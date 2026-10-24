// Builds the static site into docs/ from data/*.json.
//   npm install && npm run build
// SITE_URL (optional) sets canonical/OG URLs, e.g. SITE_URL=https://example.com/atlas/
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
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

// ---------- QR board (3D world) ----------
const qrcode = createRequire(import.meta.url)('qrcode-generator');
function qrBits(text, type = 0) {
  const q = qrcode(type, 'H');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  let bits = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) bits += q.isDark(r, c) ? '1' : '0';
  return { n, bits };
}
// Rings of a geometry in projected (grid) coordinates.
function projectedRings(projection, geo) {
  const rings = [];
  let cur;
  const sink = { point(x, y) { cur.push([x, y]); }, lineStart() { cur = []; }, lineEnd() { if (cur.length > 2) rings.push(cur); }, polygonStart() {}, polygonEnd() {}, sphere() {} };
  d3.geoStream(geo, projection.stream(sink));
  return rings;
}
// One bit per grid cell: is the cell centre on land (even-odd rule)?
function landBits(n, rings) {
  let out = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = c + 0.5, y = r + 0.5;
      let inside = false;
      for (const ring of rings) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i], [xj, yj] = ring[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
      }
      out += inside ? '1' : '0';
    }
  }
  return out;
}
// Push apart points closer than `min` so every model on the board has its own footing.
function relax(points, min, iterations = 80) {
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 1e-6) { dx = Math.cos(i + j); dy = Math.sin(i + j); d = 1; }
        const push = (min - d) / 2;
        a[0] -= (dx / d) * push; a[1] -= (dy / d) * push;
        b[0] += (dx / d) * push; b[1] += (dy / d) * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
}
const BOARD_N = 117; // QR version 25
const board = { ...qrBits(SITE_URL, 25), modes: {} };
{
  const nationTopo = readJSON('node_modules/us-atlas/nation-10m.json');
  const nation = topo.feature(nationTopo, nationTopo.objects.nation).features[0];
  const conus = { type: 'MultiPolygon', coordinates: nation.geometry.coordinates.filter((p) => { const [lon, lat] = p[0][0]; return lon > -126 && lon < -65 && lat > 24 && lat < 50; }) };
  const worldTopo = readJSON('node_modules/world-atlas/land-110m.json');
  const land = topo.feature(worldTopo, worldTopo.objects.land);
  const n = BOARD_N;
  const modes = {
    us: { projection: d3.geoConicEqualArea().parallels([29.5, 45.5]).rotate([96, 0]).fitExtent([[5, 5], [n - 5, n - 5]], conus), geo: conus, min: 1.15, keep: (c) => c.country === 'US' },
    world: { projection: d3.geoNaturalEarth1().fitExtent([[3, 3], [n - 3, n - 3]], { type: 'Sphere' }), geo: land, min: 0.42, keep: () => true },
  };
  for (const [id, m] of Object.entries(modes)) {
    const kept = companies.filter(m.keep);
    const pts = kept.map((c) => m.projection([c.lon, c.lat]));
    relax(pts, m.min);
    const pos = {};
    kept.forEach((c, i) => (pos[c.slug] = [+pts[i][0].toFixed(2), +pts[i][1].toFixed(2)]));
    const regionsAt = {};
    for (const r of REGIONS) {
      const ps = r.members.map((s) => pos[s]).filter(Boolean);
      if (!ps.length) continue;
      const x = ps.reduce((a, p) => a + p[0], 0) / ps.length, y = ps.reduce((a, p) => a + p[1], 0) / ps.length;
      const spread = Math.max(...ps.map((p) => Math.hypot(p[0] - x, p[1] - y)));
      regionsAt[r.id] = [+x.toFixed(2), +y.toFixed(2), +spread.toFixed(2)];
    }
    board.modes[id] = { land: landBits(n, projectedRings(m.projection, m.geo)), pos, regions: regionsAt };
  }
}
// 3D model for a company on the board.
// Which signature 3D model a company gets (see data/industries.json and src/models.js).
const industries = readJSON('data/industries.json');
const MODEL_LABELS = industries._labels;
const MODEL_OF = new Map();
for (const [model, names] of Object.entries(industries)) if (!model.startsWith('_')) for (const nm of names) MODEL_OF.set(nm, model);
const modelOf = (c) => MODEL_OF.get(c.listedName || c.name) || 'tree';
{
  const unmapped = companies.filter((c) => !MODEL_OF.has(c.listedName || c.name)).map((c) => c.name);
  if (unmapped.length) console.warn(`no model for: ${unmapped.join(', ')}`);
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
  <nav class="nav"><a href="${up}index.html">QR world</a><a href="${up}map.html">Flat map</a><a href="${up}companies.html">Directory</a></nav>
</header>`;
};

// ---------- dot-matrix logo ----------
const GLYPHS = {
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
};
function dotLogo(text) {
  let x = 0;
  const dots = [];
  for (const ch of text) {
    const g = GLYPHS[ch];
    g.forEach((row, y) => [...row].forEach((v, i) => v === '#' && dots.push(`<circle cx="${(x + i) * 4 + 2}" cy="${y * 4 + 2}" r="1.35"/>`)));
    x += g[0].length + 1;
  }
  const w = x * 4 - 4, h = 28;
  const b = 7; // bracket arm
  const pad = 6, W2 = w + pad * 2, H2 = h + pad * 2;
  return `<svg class="qw-dots" viewBox="${-pad} ${-pad} ${W2} ${H2}" width="${W2 * 1.6}" height="${H2 * 1.6}" aria-hidden="true">
<g fill="none" stroke="#ffcf33" stroke-width="2.2" stroke-linecap="round"><path d="M${-pad + 1} ${-pad + 1 + b}V${-pad + 1}H${-pad + 1 + b}"/><path d="M${w + pad - 1 - b} ${-pad + 1}H${w + pad - 1}V${-pad + 1 + b}"/><path d="M${-pad + 1} ${h + pad - 1 - b}V${h + pad - 1}H${-pad + 1 + b}"/><path d="M${w + pad - 1 - b} ${h + pad - 1}H${w + pad - 1}V${h + pad - 1 - b}"/></g>
<g fill="currentColor">${dots.join('')}</g></svg>`;
}
const LOGO = dotLogo('QR ATLAS');
const qwHead = ({ title, description, path, depth }) => {
  const up = '../'.repeat(depth);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#f6f1e7">
<link rel="canonical" href="${SITE_URL}${path}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}${path}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}assets/qrworld.css">
<script type="importmap">{"imports":{"three":"${up || './'}assets/three.module.min.js"}}</script>
</head>`;
};
const qwTop = (depth, eyeLabel = 'I see QR') => {
  const up = '../'.repeat(depth);
  return `<div class="qw-brand">
    <a class="qw-logo" href="${up}index.html" aria-label="QR Atlas home">${LOGO}</a>
    <button class="qw-pill" id="see" aria-pressed="false"><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M12 5C6.5 5 2.7 9.3 1.5 12c1.2 2.7 5 7 10.5 7s9.3-4.3 10.5-7C21.3 9.3 17.5 5 12 5Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"/></svg>${eyeLabel}</button>
  </div>
  <nav class="qw-nav"><a href="${up}index.html">World</a><a href="${up}map.html">Flat map</a><a href="${up}companies.html">Directory</a></nav>`;
};
const ICONS = {
  spring: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.6"/><path d="M12 9.4c-1.6-3.9 1.4-6.4 3.2-4.6 1.6 1.6-.4 4.6-3.2 4.6Zm2.6 2.6c3.9-1.6 6.4 1.4 4.6 3.2-1.6 1.6-4.6-.4-4.6-3.2ZM12 14.6c1.6 3.9-1.4 6.4-3.2 4.6-1.6-1.6.4-4.6 3.2-4.6ZM9.4 12c-3.9 1.6-6.4-1.4-4.6-3.2 1.6-1.6 4.6.4 4.6 3.2Z"/></svg>',
  summer: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  autumn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 14a5 5 0 0 1 .7-9.9A6 6 0 0 1 17 5a4.5 4.5 0 0 1 2 8.6"/><path d="M8 15v2M12 15v4M16 15v2"/></svg>',
  city: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V9l5-3v15M10 21V4h7v17M17 21v-9h3v9"/></svg>',
  signature: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
};

// ---------- company pages ----------
function companyPage(c, prev, next) {
  const path = `c/${c.slug}.html`;
  const pageUrl = SITE_URL + path;
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
  const model = modelOf(c);
  const sub = c.kind === 'f500' ? `Fortune 500 No. ${c.rank} · ${place(c)}` : `${c.sector} startup · ${place(c)}`;
  const data = { slug: c.slug, name: c.name, model, qr: qrBits(pageUrl) };
  const tabs = [['signature', model === 'tree' ? 'Tree' : MODEL_LABELS[model]], ['spring', 'Spring'], ['summer', 'Summer'], ['autumn', 'Autumn'], ['city', 'City']];
  return `${qwHead({ title: `${c.name} · QR Atlas`, description: describe(c), path, depth: 1 })}
<body class="qw qw-company">
<section class="qw-stage" id="stage">
  ${qwTop(1)}
  <header class="qw-title">
    <h1>${esc(c.name)}</h1>
    <p>${esc(sub)}</p>
  </header>
  <canvas class="qw-fallback" id="fallback-qr" width="320" height="320" aria-label="QR code for this page"></canvas>
  <div class="qw-hint" id="hint">Tap the model to see the QR code</div>
  <div class="qw-dock">
    <div class="qw-url">
      <input id="page-url" readonly value="${pageUrl}" aria-label="Link to this page">
      <button class="qw-share" id="share" aria-label="Share link">${ICONS.share}<span id="share-label" class="sr">Share</span></button>
    </div>
    <div class="qw-tabs" role="group" aria-label="World style">
      ${tabs.map(([id, label]) => `<button data-theme="${id}" aria-pressed="${id === 'signature'}"${id === 'signature' ? ' class="sig"' : ''}>${ICONS[id]}<span>${esc(label)}</span></button>`).join('')}
    </div>
  </div>
  <a class="qw-scroll" href="#info" aria-label="Company details">Details ↓</a>
</section>

<main class="qw-info" id="info">
  <div class="qw-badges">${c.kind === 'f500' ? `<span class="qw-badge">Fortune 500 · No. ${c.rank}</span>${c.tech ? '<span class="qw-badge tech">Tech</span>' : ''}` : `<span class="qw-badge startup">Startup</span><span class="qw-badge">${esc(c.sector)}</span>`}</div>
  <h2>${esc(c.name)}</h2>
  <p class="qw-lede">${esc(c.kind === 'startup' ? c.blurb : `Headquartered in ${place(c)}.`)}</p>
  <dl class="qw-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  <div class="qw-actions">
    ${c.website ? `<a class="qw-btn" href="${esc(c.website)}" rel="noopener" target="_blank">${esc(host(c.website))} ↗</a>` : ''}
    <a class="qw-btn primary" href="../index.html#${c.slug}">See it in the world</a>
    <button class="qw-btn" id="download">Download QR</button>
  </div>

  ${nearby.length ? `<h3>Neighbors</h3>
  <ul class="qw-chips">${nearby.map((o) => `<li><a href="${o.slug}.html"><i class="dot ${o.kind} ${o.tech ? 'tech' : ''}"></i>${esc(o.name)}</a></li>`).join('')}</ul>` : ''}

  <h3>Reference this page</h3>
  <div class="cite">
    <label>Link<input readonly value="${pageUrl}"></label>
    <label>Markdown<input readonly value="[${esc(c.name)}](${pageUrl})"></label>
    <label>HTML<input readonly value="${esc(`<a href="${pageUrl}">${c.name}</a>`)}"></label>
  </div>
  <p class="qw-share-row">
    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(c.name)}" target="_blank" rel="noopener">Post on X</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}" target="_blank" rel="noopener">Share on LinkedIn</a>
    <a href="mailto:?subject=${encodeURIComponent(c.name)}&body=${encodeURIComponent(pageUrl)}">Email</a>
  </p>
  <nav class="qw-pager">
    ${prev ? `<a href="${prev.slug}.html">← ${esc(prev.name)}</a>` : '<span></span>'}
    ${next ? `<a href="${next.slug}.html">${esc(next.name)} →</a>` : '<span></span>'}
  </nav>
  <p class="qw-source">${c.kind === 'f500'
    ? `Rank and financials: Fortune 500, ${LIST_YEAR} list (fiscal ${LIST_YEAR - 1}). HQ locations: HIFLD Fortune 500 Corporate Headquarters, with corrections and later moves noted.`
    : 'Startup entries are curated by hand; check the company’s own site for current details.'} <a href="../about.html">About the data</a>.</p>
</main>
<script>window.COMPANY=${JSON.stringify(data)};</script>
<script src="../assets/qrcode.js"></script>
<script src="../assets/qr-card.js"></script>
<script type="module" src="../assets/company3d.js"></script>
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
  return `${head({ title: 'Flat map · QR Atlas', description, path: 'map.html', depth: 0 })}
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


// ---------- QR world (index) ----------
function worldPage() {
  const slim = companies.map((c) => {
    const o = { s: c.slug, n: c.name, k: c.kind === 'f500' ? 0 : 1, t: c.tech ? 1 : 0, c: place(c), m: modelOf(c) };
    if (c.rank) o.r = c.rank;
    if (c.revenue != null) o.v = c.revenue;
    if (c.sector) o.sec = c.sector;
    if (c.founded) o.f = c.founded;
    if (c.area) o.a = c.area;
    if (c.listedName && c.listedName !== c.name) o.ln = c.listedName;
    return o;
  });
  const config = {
    listYear: LIST_YEAR,
    board,
    regions: REGIONS.map(({ id, name, short, note, members }) => ({ id, name, short, note: note || '', members })),
  };
  const description = `A 3D world on a QR code: every ${LIST_YEAR} Fortune 500 headquarters and ${startups.length} startups, from Silicon Valley to Boston. Play the tour, search any company, and scan the board.`;
  return `${qwHead({ title: 'QR Atlas · a world on a QR code', description, path: '', depth: 0 })}
<body class="qw qw-world">
<section class="qw-stage" id="stage">
  ${qwTop(0)}
  <div class="qw-filters" role="group" aria-label="Filter">
    <button data-f="all" aria-pressed="true">All</button>
    <button data-f="tech" aria-pressed="false"><i class="dot tech"></i>Tech</button>
    <button data-f="startup" aria-pressed="false"><i class="dot startup"></i>Startups</button>
    <button data-f="f500" aria-pressed="false"><i class="dot f500"></i>Fortune 500</button>
  </div>
  <div id="labels" aria-hidden="true"></div>
  <div id="tip" role="tooltip" hidden></div>
  <canvas class="qw-fallback" id="fallback-qr" width="320" height="320" aria-label="QR code for this site"></canvas>

  <aside class="qw-caption" id="caption" hidden aria-live="polite">
    <div class="step" id="cap-step"></div>
    <h2 id="cap-title"></h2>
    <p id="cap-note"></p>
    <div class="qw-stats" id="cap-stats"></div>
    <ol class="qw-list" id="cap-list"></ol>
    <div class="qw-progress"><i id="cap-bar"></i></div>
    <div class="controls">
      <button class="qw-btn" id="cap-prev" aria-label="Previous stop">‹ Prev</button>
      <button class="qw-btn" id="cap-next" aria-label="Next stop">Next ›</button>
      <button class="qw-btn" id="cap-close">End tour</button>
    </div>
  </aside>

  <aside class="qw-card" id="card" hidden aria-live="polite">
    <button class="qw-close" id="card-close" aria-label="Close">×</button>
    <div class="qw-badges" id="card-badges"></div>
    <h2 id="card-name"></h2>
    <p class="place" id="card-place"></p>
    <dl class="qw-facts" id="card-facts"></dl>
    <div class="row">
      <canvas id="card-qr" width="120" height="120" aria-label="QR code for this company's page"></canvas>
      <div>
        <a class="qw-btn primary" id="card-open" href="#">Open its QR world</a>
        <button class="qw-btn" id="card-copy">Copy link</button>
      </div>
    </div>
    <h3 id="card-near-h"></h3>
    <ul class="qw-chips" id="card-near"></ul>
  </aside>

  <div class="qw-dock">
    <div class="qw-search" role="search">
      <input id="q" type="search" placeholder="Search a company, city or region…" autocomplete="off" spellcheck="false" aria-label="Search companies" aria-controls="results" aria-expanded="false">
      <ul id="results" role="listbox" hidden></ul>
      <button class="qw-play" id="play" aria-label="Play tour"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg></button>
    </div>
    <div class="qw-tabs" role="group" aria-label="Board">
      <button data-mode="us" aria-pressed="true">${ICONS.city}USA</button>
      <button data-mode="world" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>World</button>
      <button id="random"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>Surprise me</button>
    </div>
  </div>
</section>
<script>window.WORLD=${JSON.stringify(config)};window.COMPANIES=${JSON.stringify(slim)};</script>
<script src="assets/qrcode.js"></script>
<script src="assets/qr-card.js"></script>
<script type="module" src="assets/world.js"></script>
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
  <p>QR Atlas gives every company a page whose QR code is a small 3D world: a tree or a city growing out of the code. Tap it, or press “I see QR”, and it settles into a flat QR code that scans back to that page, so a post or slide about a company can point to one stable link.</p>
  <p>The home page is the same idea at full scale: one large QR code that scans to this site, with the map laid across its tiles and every company standing at its headquarters. Towers grow with revenue; startups are trees, rockets (aerospace and defense) or glowing orbs (AI). The <a href="map.html">flat map</a> shows the same data in 2D.</p>
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
for (const f of ['site.css', 'qrworld.css', 'atlas.js', 'qr-card.js', 'directory.js', 'icon.svg', 'qrworld.js', 'models.js', 'company3d.js', 'world.js']) copyFileSync(join(ROOT, 'src', f), join(OUT, 'assets', f));
copyFileSync(join(ROOT, 'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'), join(OUT, 'assets/BufferGeometryUtils.js'));
copyFileSync(join(ROOT, 'node_modules/qrcode-generator/qrcode.js'), join(OUT, 'assets/qrcode.js'));
copyFileSync(join(ROOT, 'node_modules/three/build/three.module.min.js'), join(OUT, 'assets/three.module.min.js'));
copyFileSync(join(ROOT, 'node_modules/three/examples/jsm/controls/OrbitControls.js'), join(OUT, 'assets/OrbitControls.js'));
writeFileSync(join(OUT, 'assets/map.svg'), MAP_SVG);
writeFileSync(join(OUT, 'map.html'), indexPage());
writeFileSync(join(OUT, 'index.html'), worldPage());
writeFileSync(join(OUT, 'companies.html'), directoryPage());
writeFileSync(join(OUT, 'about.html'), aboutPage());
writeFileSync(join(OUT, '.nojekyll'), '');
const ordered = [...companies.filter((c) => c.kind === 'f500').sort((a, b) => a.rank - b.rank), ...companies.filter((c) => c.kind === 'startup')];
ordered.forEach((c, i) => writeFileSync(join(OUT, 'c', `${c.slug}.html`), companyPage(c, ordered[i - 1], ordered[i + 1])));
console.log(`built ${ordered.length} company pages, ${REGIONS.length} regions → docs/`);
for (const r of REGIONS) console.log(`  ${r.id}: ${r.members.length}`);
