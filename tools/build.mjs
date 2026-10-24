// Builds the static site into docs/ from data/*.json.
//   npm install && npm run build
// SITE_URL (optional) sets canonical/OG URLs, e.g. SITE_URL=https://example.com/atlas/
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as d3 from 'd3-geo';
import * as topo from 'topojson-client';
import * as simp from 'topojson-simplify';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs');
const SITE_URL = (process.env.SITE_URL || 'https://ghanemja.github.io/qr/').replace(/\/?$/, '/');
const LIST_YEAR = 2019;

const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/['.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- map geometry ----------
const W = 2000;
const proj = d3.geoNaturalEarth1().fitWidth(W, { type: 'Sphere' });
const H = Math.round(d3.geoPath(proj).bounds({ type: 'Sphere' })[1][1]);

function topoPaths(file, object, weight, digits, skip = new Set()) {
  let t = readJSON('node_modules/' + file);
  t = simp.simplify(simp.presimplify(t), weight);
  const path = d3.geoPath(proj).digits(digits);
  return topo.feature(t, t.objects[object]).features.filter((f) => !skip.has(f.id)).map((f) => path(f)).filter(Boolean);
}
const world = topoPaths('world-atlas/countries-50m.json', 'countries', 0.02, 1, new Set(['840', '010']));
const states = topoPaths('us-atlas/states-10m.json', 'states', 0.0015, 2);
const project = (lon, lat) => proj([lon, lat]).map((v) => Math.round(v * 1000) / 1000);

const mapInner = `<path class="land" d="${world.join('')}"/><path class="land us" d="${states.join('')}"/>`;
const MAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>.sea{fill:#dfe6ee}.land{fill:#f7f8fa;stroke:#b9c3cf;stroke-width:.25;stroke-linejoin:round}
@media (prefers-color-scheme:dark){.sea{fill:#0b1118}.land{fill:#1a2430;stroke:#33414f}}</style>
<rect class="sea" width="${W}" height="${H}"/>${mapInner}</svg>`;

// ---------- companies ----------
const f500 = readJSON('data/fortune500.json');
const startups = readJSON('data/startups.json');
const companies = [];
for (const c of f500) {
  companies.push({
    kind: 'f500', slug: c.slug, name: c.now || c.name, listedName: c.name, rank: c.rank,
    revenue: c.revenue, profit: c.profit, city: c.city, region: c.state, country: 'US',
    lat: c.lat, lon: c.lon, website: c.website, tech: c.sector === 'tech',
    sector: c.sector === 'tech' ? 'Technology' : '', listedHq: c.listed_hq || '', moved: c.moved || null,
  });
}
const taken = new Set(companies.map((c) => c.slug));
for (const s of startups) {
  let slug = slugify(s.name);
  if (taken.has(slug)) slug += '-startup';
  taken.add(slug);
  companies.push({
    kind: 'startup', slug, name: s.name, city: s.city, region: s.region, country: s.country,
    lat: s.lat, lon: s.lon, website: s.website, tech: true, sector: s.sector, founded: s.founded, blurb: s.blurb,
  });
}
// Project and nudge companies that share a spot so every dot stays clickable.
const spots = new Map();
for (const c of companies) {
  [c.x, c.y] = project(c.lon, c.lat);
  const k = `${Math.round(c.x * 20)},${Math.round(c.y * 20)}`;
  const n = spots.get(k) || 0;
  spots.set(k, n + 1);
  if (n) {
    const a = n * 2.4, r = 0.035 * Math.sqrt(n);
    c.x = +(c.x + r * Math.cos(a)).toFixed(3);
    c.y = +(c.y + r * Math.sin(a)).toFixed(3);
  }
}
const bySlug = new Map(companies.map((c) => [c.slug, c]));

// ---------- regions (tour stops) ----------
const km = (a, b) => {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const REGIONS = [
  { id: 'seattle', name: 'Seattle & Puget Sound', lat: 47.62, lon: -122.25, r: 45, note: 'Cloud and commerce giants on the lake, fusion startups up the road.' },
  { id: 'bay-area', name: 'San Francisco Bay Area', lat: 37.6, lon: -122.15, r: 75, note: 'Silicon Valley and the city: chips in the south, AI labs in SoMa.' },
  { id: 'socal', name: 'Southern California', lat: 33.75, lon: -117.95, r: 135, note: 'Media, aerospace and defense tech from Burbank to San Diego.' },
  { id: 'phoenix', name: 'Phoenix', lat: 33.45, lon: -112.0, r: 45 },
  { id: 'denver', name: 'Denver & the Front Range', lat: 39.68, lon: -104.95, r: 45 },
  { id: 'austin', name: 'Austin', lat: 30.35, lon: -97.72, r: 40, note: 'Tesla and Oracle moved in; Dell is up the road in Round Rock.' },
  { id: 'dfw', name: 'Dallas–Fort Worth', lat: 32.85, lon: -97.0, r: 60, note: 'A magnet for HQ relocations.' },
  { id: 'houston', name: 'Houston', lat: 29.85, lon: -95.4, r: 55, note: 'Energy capital of the list.' },
  { id: 'msp', name: 'Minneapolis–St. Paul', lat: 44.95, lon: -93.25, r: 45 },
  { id: 'chicago', name: 'Chicago', lat: 41.95, lon: -87.9, r: 60 },
  { id: 'detroit', name: 'Detroit', lat: 42.45, lon: -83.2, r: 45 },
  { id: 'atlanta', name: 'Atlanta', lat: 33.85, lon: -84.35, r: 45 },
  { id: 'charlotte', name: 'Charlotte', lat: 35.3, lon: -80.85, r: 45 },
  { id: 'dc', name: 'Washington, D.C. area', lat: 38.92, lon: -77.15, r: 45, note: 'Defense primes and government contractors.' },
  { id: 'nyc', name: 'New York metro', lat: 40.8, lon: -74.0, r: 60, note: 'Finance, media and a fast-growing AI scene.' },
  { id: 'boston', name: 'Boston & Cambridge', lat: 42.4, lon: -71.25, r: 50, note: 'Robotics, biotech and MIT spinouts.' },
  { id: 'europe', name: 'Europe', countries: ['GB', 'FR', 'DE', 'SE', 'EE'], note: 'London, Paris and Munich lead the startup map.' },
  { id: 'asia-pacific', name: 'Asia & the Pacific', countries: ['CN', 'JP', 'IN', 'AU', 'SA'] },
];
const SHORT = { seattle: 'Seattle', 'bay-area': 'Bay Area', socal: 'SoCal', phoenix: 'Phoenix', denver: 'Denver', austin: 'Austin', dfw: 'Dallas–Fort Worth', houston: 'Houston', msp: 'Twin Cities', chicago: 'Chicago', detroit: 'Detroit', atlanta: 'Atlanta', charlotte: 'Charlotte', dc: 'Washington', nyc: 'New York', boston: 'Boston', europe: 'Europe', 'asia-pacific': 'Asia-Pacific' };
for (const r of REGIONS) {
  r.short = SHORT[r.id];
  const members = companies.filter((c) => (r.countries ? r.countries.includes(c.country) : km(r, c) <= r.r));
  r.members = members.map((c) => c.slug);
  const xs = members.map((c) => c.x), ys = members.map((c) => c.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  r.view = { x: +((x0 + x1) / 2).toFixed(2), y: +((y0 + y1) / 2).toFixed(2), w: +Math.max((x1 - x0) * 1.5, (y1 - y0) * 2.4, 6).toFixed(2) };
  for (const c of members) if (!c.area) c.area = r.id;
}

// ---------- helpers for pages ----------
const fmtMoney = (m) => (m == null ? '—' : (m < 0 ? '−' : '') + (Math.abs(m) >= 1000 ? `$${(Math.abs(m) / 1000).toFixed(1)}B` : `$${Math.round(Math.abs(m))}M`));
const place = (c) => `${c.city}, ${c.country === 'US' ? c.region : countryName(c.country)}`;
const COUNTRIES = { US: 'United States', GB: 'United Kingdom', FR: 'France', DE: 'Germany', SE: 'Sweden', EE: 'Estonia', CA: 'Canada', CO: 'Colombia', AU: 'Australia', CN: 'China', JP: 'Japan', IN: 'India', SA: 'Saudi Arabia' };
function countryName(cc) { return COUNTRIES[cc] || cc; }
const host = (u) => (u ? u.replace(/^https?:\/\//, '').replace(/^www\./, '') : '');
const describe = (c) => c.kind === 'f500'
  ? `${c.name} — No. ${c.rank} on the ${LIST_YEAR} Fortune 500, headquartered in ${place(c)}.`
  : `${c.name} — ${c.sector} startup founded in ${c.founded}, based in ${place(c)}. ${c.blurb}`;

const head = ({ title, description, path, depth }) => {
  const up = '../'.repeat(depth);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE_URL}${path}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}${path}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}assets/site.css">
</head>`;
};

const topbar = (depth, extra = '') => {
  const up = '../'.repeat(depth);
  return `<header class="topbar">
  <a class="brand" href="${up}index.html"><img src="${up}assets/icon.svg" alt="" width="22" height="22"><span>QR&nbsp;Atlas</span></a>
  ${extra}
  <nav class="nav"><a href="${up}index.html">Map</a><a href="${up}companies.html">Directory</a></nav>
</header>`;
};

// ---------- company pages ----------
function companyPage(c, prev, next) {
  const path = `c/${c.slug}.html`;
  const nearby = companies
    .filter((o) => o !== c && km(c, o) < (c.country === 'US' ? 60 : 400))
    .sort((a, b) => km(c, a) - km(c, b)).slice(0, 8);
  const facts = c.kind === 'f500'
    ? [
        ['Fortune 500 rank', `No. ${c.rank} <small>(${LIST_YEAR} list)</small>`],
        ['Revenue', `${fmtMoney(c.revenue)} <small>FY${LIST_YEAR - 1}</small>`],
        ['Profit', `${fmtMoney(c.profit)} <small>FY${LIST_YEAR - 1}</small>`],
        ['Headquarters', esc(place(c)) + (c.moved ? ` <small>since ${c.moved}</small>` : '')],
      ]
    : [
        ['Type', 'Startup / private company'],
        ['Sector', esc(c.sector)],
        ['Founded', String(c.founded)],
        ['Headquarters', esc(place(c))],
      ];
  if (c.listedHq) facts.push(['HQ on the list', esc(c.listedHq)]);
  if (c.listedName !== c.name && c.listedName) facts.push(['Listed as', esc(c.listedName)]);
  const vw = 22, vh = 11;
  const title = `${c.name} · QR Atlas`;
  const badge = c.kind === 'f500'
    ? `<span class="badge ${c.tech ? 'tech' : ''}">Fortune 500 · No. ${c.rank}</span>${c.tech ? '<span class="badge tech">Tech</span>' : ''}`
    : `<span class="badge startup">Startup</span><span class="badge">${esc(c.sector)}</span>`;
  const data = { slug: c.slug, name: c.name };
  return `${head({ title, description: describe(c), path, depth: 1 })}
<body class="page">
${topbar(1)}
<main class="company">
  <section class="hero">
    <div class="hero-text">
      <div class="badges">${badge}</div>
      <h1>${esc(c.name)}</h1>
      <p class="lede">${esc(c.kind === 'startup' ? c.blurb : `Headquartered in ${place(c)}.`)}</p>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <div class="actions">
        ${c.website ? `<a class="btn" href="${esc(c.website)}" rel="noopener" target="_blank">${esc(host(c.website))} ↗</a>` : ''}
        <a class="btn primary" href="../index.html#${c.slug}">Fly there on the map</a>
      </div>
    </div>
    <figure class="qr-card" id="qr-card">
      <canvas id="qr" width="240" height="240" aria-label="QR code linking to this page"></canvas>
      <figcaption><strong>${esc(c.name)}</strong><span id="qr-url">${SITE_URL}${path}</span></figcaption>
      <div class="qr-actions">
        <button class="btn" id="copy">Copy link</button>
        <button class="btn" id="dl">Download QR</button>
        <button class="btn" id="share" hidden>Share</button>
      </div>
    </figure>
  </section>

  <section class="panel">
    <h2>On the map</h2>
    <a class="minimap" href="../index.html#${c.slug}" aria-label="Open ${esc(c.name)} on the map">
      <svg viewBox="${(c.x - vw / 2).toFixed(2)} ${(c.y - vh / 2).toFixed(2)} ${vw} ${vh}" preserveAspectRatio="xMidYMid slice">
        <image href="../assets/map.svg" width="${W}" height="${H}"/>
        ${nearby.map((o) => `<circle class="dot ${o.kind} ${o.tech ? 'tech' : ''}" cx="${o.x}" cy="${o.y}" r="0.09"/>`).join('')}
        <circle class="pulse" cx="${c.x}" cy="${c.y}" r="0.25"/>
        <circle class="dot me" cx="${c.x}" cy="${c.y}" r="0.14"/>
        <text class="me-label" x="${(c.x + 0.32).toFixed(3)}" y="${(c.y + 0.16).toFixed(3)}" font-size="0.45">${esc(c.name)}</text>
      </svg>
    </a>
  </section>

  ${nearby.length ? `<section class="panel">
    <h2>Nearby headquarters</h2>
    <ul class="chips">${nearby.map((o) => `<li><a href="${o.slug}.html"><span class="dot-i ${o.kind} ${o.tech ? 'tech' : ''}"></span>${esc(o.name)}</a></li>`).join('')}</ul>
  </section>` : ''}

  <section class="panel">
    <h2>Reference this page</h2>
    <div class="cite">
      <label>Link<input readonly value="${SITE_URL}${path}"></label>
      <label>Markdown<input readonly value="[${esc(c.name)}](${SITE_URL}${path})"></label>
      <label>HTML<input readonly value="${esc(`<a href="${SITE_URL}${path}">${c.name}</a>`)}"></label>
    </div>
    <p class="share-row">
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(SITE_URL + path)}&text=${encodeURIComponent(c.name)}" target="_blank" rel="noopener">Post on X</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL + path)}" target="_blank" rel="noopener">Share on LinkedIn</a>
      <a href="mailto:?subject=${encodeURIComponent(c.name)}&body=${encodeURIComponent(SITE_URL + path)}">Email</a>
    </p>
  </section>

  <nav class="pager">
    ${prev ? `<a href="${prev.slug}.html">← ${esc(prev.name)}</a>` : '<span></span>'}
    ${next ? `<a href="${next.slug}.html">${esc(next.name)} →</a>` : '<span></span>'}
  </nav>
  <p class="source">${c.kind === 'f500'
    ? `Rank and financials: Fortune 500, ${LIST_YEAR} list (fiscal ${LIST_YEAR - 1}). HQ locations: HIFLD Fortune 500 Corporate Headquarters, with corrections and later moves noted.`
    : 'Startup entries are curated by hand; check the company’s own site for current details.'} <a href="../about.html">About the data</a>.</p>
</main>
<script>window.COMPANY=${JSON.stringify(data)};</script>
<script src="../assets/qrcode.js"></script>
<script src="../assets/qr-card.js"></script>
<script src="../assets/company.js"></script>
</body>
</html>
`;
}

// ---------- atlas (index) ----------
function indexPage() {
  const slim = companies.map((c) => {
    const o = { s: c.slug, n: c.name, k: c.kind === 'f500' ? 0 : 1, t: c.tech ? 1 : 0, x: c.x, y: c.y, c: place(c) };
    if (c.rank) o.r = c.rank;
    if (c.revenue != null) o.v = c.revenue;
    if (c.sector) o.sec = c.sector;
    if (c.founded) o.f = c.founded;
    if (c.area) o.a = c.area;
    if (c.listedName && c.listedName !== c.name) o.ln = c.listedName;
    return o;
  });
  const regions = REGIONS.map(({ id, name, short, note, view, members }) => ({ id, name, short, note: note || '', view, members }));
  // City labels: one per HQ city, placed at the centroid of its companies.
  const cityMap = new Map();
  for (const c of companies) {
    const key = c.city + '|' + c.region;
    const e = cityMap.get(key) || { n: c.city, x: 0, y: 0, c: 0 };
    e.x += c.x; e.y += c.y; e.c++;
    cityMap.set(key, e);
  }
  const places = [...cityMap.values()].map((e) => ({ n: e.n, x: +(e.x / e.c).toFixed(3), y: +(e.y / e.c).toFixed(3), c: e.c })).sort((a, b) => b.c - a.c);
  const us = companies.filter((c) => c.country === 'US');
  const usView = { x: (Math.min(...us.map((c) => c.x)) + Math.max(...us.map((c) => c.x))) / 2, y: (Math.min(...us.map((c) => c.y)) + Math.max(...us.map((c) => c.y))) / 2, w: (Math.max(...us.map((c) => c.x)) - Math.min(...us.map((c) => c.x))) * 1.15 };
  const config = { W, H, listYear: LIST_YEAR, usView, regions, places };
  const description = `Every ${LIST_YEAR} Fortune 500 headquarters and ${startups.length} notable startups on one map, from Silicon Valley to Boston. Play the tour, search any company, and share its QR page.`;
  return `${head({ title: 'QR Atlas · Fortune 500 & startup map', description, path: '', depth: 0 })}
<body class="atlas">
${topbar(0, `<div class="search" role="search">
    <input id="q" type="search" placeholder="Search a company or city…" autocomplete="off" spellcheck="false" aria-label="Search companies" aria-controls="results" aria-expanded="false">
    <ul id="results" role="listbox" hidden></ul>
  </div>`)}
<div class="stage" id="stage">
  <svg id="map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="World map of company headquarters">
    <rect class="sea" x="-${W}" y="-${H}" width="${W * 3}" height="${H * 3}"/>
    <g id="base">${mapInner}</g>
    <g id="rings"></g>
    <g id="dots"></g>
  </svg>
  <div id="labels" aria-hidden="true"></div>
  <div id="tip" role="tooltip" hidden></div>

  <div class="filters" role="group" aria-label="Filter">
    <button data-f="all" aria-pressed="true">All <span id="n-all"></span></button>
    <button data-f="tech" aria-pressed="false"><i class="dot-i tech"></i>Tech</button>
    <button data-f="startup" aria-pressed="false"><i class="dot-i startup"></i>Startups</button>
    <button data-f="f500" aria-pressed="false"><i class="dot-i f500"></i>Fortune 500</button>
  </div>

  <div class="zoom" role="group" aria-label="Zoom">
    <button id="zin" aria-label="Zoom in">+</button>
    <button id="zout" aria-label="Zoom out">−</button>
    <button id="zus" aria-label="United States">US</button>
    <button id="zworld" aria-label="Whole world">🌐</button>
  </div>

  <aside class="tour" id="tour" aria-live="polite">
    <div class="tour-head">
      <button class="btn primary" id="play">▶ Play tour</button>
      <button class="btn ghost" id="prev" aria-label="Previous stop" hidden>‹</button>
      <button class="btn ghost" id="next" aria-label="Next stop" hidden>›</button>
      <button class="btn ghost" id="random" title="Fly to a random company">Surprise me</button>
    </div>
    <div class="tour-body" id="tour-body" hidden>
      <div class="tour-step" id="tour-step"></div>
      <h2 id="tour-title"></h2>
      <p id="tour-note"></p>
      <div class="stats" id="tour-stats"></div>
      <ol class="toplist" id="tour-list"></ol>
      <div class="progress"><i id="tour-bar"></i></div>
    </div>
  </aside>

  <aside class="card" id="card" hidden aria-live="polite">
    <button class="close" id="card-close" aria-label="Close">×</button>
    <div class="badges" id="card-badges"></div>
    <h2 id="card-name"></h2>
    <p class="muted" id="card-place"></p>
    <dl class="facts" id="card-facts"></dl>
    <div class="card-qr">
      <canvas id="card-qr" width="132" height="132" aria-label="QR code for this company page"></canvas>
      <div>
        <a class="btn primary" id="card-open" href="#">Open company page</a>
        <button class="btn" id="card-copy">Copy link</button>
        <button class="btn" id="card-dl">Download QR</button>
      </div>
    </div>
    <h3 id="card-near-h">Nearby</h3>
    <ul class="chips" id="card-near"></ul>
  </aside>
</div>
<script>window.ATLAS=${JSON.stringify(config)};window.COMPANIES=${JSON.stringify(slim)};</script>
<script src="assets/qrcode.js"></script>
<script src="assets/qr-card.js"></script>
<script src="assets/atlas.js"></script>
</body>
</html>
`;
}

// ---------- directory ----------
function directoryPage() {
  const rows = [...companies].sort((a, b) => (a.kind === b.kind ? (a.rank || 0) - (b.rank || 0) || a.name.localeCompare(b.name) : a.kind === 'f500' ? -1 : 1));
  const description = `Directory of all ${f500.length} companies on the ${LIST_YEAR} Fortune 500 and ${startups.length} startups, each with a shareable QR page.`;
  return `${head({ title: 'Directory · QR Atlas', description, path: 'companies.html', depth: 0 })}
<body class="page">
${topbar(0)}
<main class="directory">
  <h1>Directory</h1>
  <p class="lede">${esc(description)}</p>
  <div class="dir-tools">
    <input id="filter" type="search" placeholder="Filter by name, city or state…" aria-label="Filter companies">
    <div class="filters inline" role="group" aria-label="Type">
      <button data-f="all" aria-pressed="true">All</button>
      <button data-f="tech" aria-pressed="false"><i class="dot-i tech"></i>Tech</button>
      <button data-f="startup" aria-pressed="false"><i class="dot-i startup"></i>Startups</button>
      <button data-f="f500" aria-pressed="false"><i class="dot-i f500"></i>Fortune 500</button>
    </div>
  </div>
  <table class="dir">
    <thead><tr><th>#</th><th>Company</th><th>Headquarters</th><th class="num">Revenue</th><th></th></tr></thead>
    <tbody>
${rows.map((c) => `<tr data-k="${c.kind}" data-t="${c.tech ? 1 : 0}" data-q="${esc((c.name + ' ' + (c.listedName || '') + ' ' + place(c) + ' ' + (c.sector || '')).toLowerCase())}"><td class="num">${c.rank || ''}</td><td><a href="c/${c.slug}.html"><span class="dot-i ${c.kind} ${c.tech ? 'tech' : ''}"></span>${esc(c.name)}</a>${c.kind === 'startup' ? ` <small>${esc(c.sector)}</small>` : ''}</td><td>${esc(place(c))}</td><td class="num">${c.kind === 'f500' ? fmtMoney(c.revenue) : `<small>est. ${c.founded}</small>`}</td><td><a class="map-link" href="index.html#${c.slug}" aria-label="${esc(c.name)} on the map">map</a></td></tr>`).join('\n')}
    </tbody>
  </table>
</main>
<script src="assets/directory.js"></script>
</body>
</html>
`;
}

function aboutPage() {
  const moved = companies.filter((c) => c.moved);
  return `${head({ title: 'About the data · QR Atlas', description: 'Sources and caveats for the QR Atlas company map.', path: 'about.html', depth: 0 })}
<body class="page">
${topbar(0)}
<main class="prose">
  <h1>About the data</h1>
  <p>QR Atlas gives every company a page with a QR code, so a post or slide about a company can point to one stable link. The map shows where they are headquartered.</p>
  <h2>Fortune 500</h2>
  <p>Ranks, names, revenue and profit come from the <strong>${LIST_YEAR} Fortune 500</strong> list (fiscal ${LIST_YEAR - 1} figures), as published in the open dataset at <a href="https://github.com/cmusam/fortune500">github.com/cmusam/fortune500</a>. Fortune publishes a new list every June; ranks here are not current.</p>
  <p>HQ coordinates come from the HIFLD <em>Fortune 500 Corporate Headquarters</em> dataset (via <a href="https://github.com/anyfactor/f500hqviz">github.com/anyfactor/f500hqviz</a>), corrected by hand where that file was wrong or out of date. Companies that later moved their headquarters are shown at the new location:</p>
  <ul>${moved.map((c) => `<li><a href="c/${c.slug}.html">${esc(c.name)}</a>: ${esc(c.listedHq)} → ${esc(place(c))} (${c.moved})</li>`).join('')}</ul>
  <p>A few companies are shown under the name they use today (for example Facebook as Meta Platforms); their page notes the name on the list.</p>
  <h2>Startups</h2>
  <p>The ${startups.length} startups and private companies are a hand-picked set of well-known names, not a ranking. Funding and valuations change too fast to keep in a static site, so the pages leave them out.</p>
  <h2>Map</h2>
  <p>Borders from Natural Earth via <a href="https://github.com/topojson/world-atlas">world-atlas</a> and <a href="https://github.com/topojson/us-atlas">us-atlas</a>. QR codes are generated in your browser with <a href="https://github.com/kazuhikoarase/qrcode-generator">qrcode-generator</a> (MIT).</p>
  <h2>Corrections</h2>
  <p>Edit <code>data/fortune500.json</code> or <code>data/startups.json</code> and run <code>npm run build</code>.</p>
</main>
</body>
</html>
`;
}

// ---------- write ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'c'), { recursive: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
for (const f of ['site.css', 'atlas.js', 'company.js', 'qr-card.js', 'directory.js', 'icon.svg']) copyFileSync(join(ROOT, 'src', f), join(OUT, 'assets', f));
copyFileSync(join(ROOT, 'node_modules/qrcode-generator/qrcode.js'), join(OUT, 'assets/qrcode.js'));
writeFileSync(join(OUT, 'assets/map.svg'), MAP_SVG);
writeFileSync(join(OUT, 'index.html'), indexPage());
writeFileSync(join(OUT, 'companies.html'), directoryPage());
writeFileSync(join(OUT, 'about.html'), aboutPage());
writeFileSync(join(OUT, '.nojekyll'), '');
const ordered = [...companies.filter((c) => c.kind === 'f500').sort((a, b) => a.rank - b.rank), ...companies.filter((c) => c.kind === 'startup')];
ordered.forEach((c, i) => writeFileSync(join(OUT, 'c', `${c.slug}.html`), companyPage(c, ordered[i - 1], ordered[i + 1])));
console.log(`built ${ordered.length} company pages, ${REGIONS.length} regions → docs/`);
for (const r of REGIONS) console.log(`  ${r.id}: ${r.members.length}`);
