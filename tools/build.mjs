// Builds the static site into docs/ from data/*.json.
//   npm install && npm run build
// SITE_URL (optional) sets canonical/OG URLs, e.g. SITE_URL=https://example.com/atlas/
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { variantCount, PROP_COUNT, TOPPER_COUNT } from '../src/models.js';
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

// Names people actually use, where the list's name is long or formal.
const SHORT_NAMES = {
  'Advanced Micro Devices': 'AMD', 'Amazon.com': 'Amazon', 'salesforce.com': 'Salesforce', 'Jones Financial (Edward Jones)': 'Edward Jones',
  'Bank of New York Mellon': 'BNY Mellon', 'Laboratory Corp. of America': 'Labcorp', 'C.H. Robinson Worldwide': 'C.H. Robinson',
  'Expeditors Intl. of Washington': 'Expeditors', 'Guardian Life Ins. Co. of America': 'Guardian Life', 'United Continental Holdings': 'United Airlines',
  'INTL FCStone': 'StoneX', 'Goldman Sachs Group': 'Goldman Sachs', 'Hewlett Packard Enterprise': 'HPE', 'Cognizant Technology Solutions': 'Cognizant',
  'Fidelity National Information Services': 'FIS', 'Liberty Mutual Insurance Group': 'Liberty Mutual', 'Massachusetts Mutual Life Insurance': 'MassMutual',
  'New York Life Insurance': 'New York Life', 'Northwestern Mutual': 'Northwestern Mutual', 'State Farm Insurance': 'State Farm',
  'American Family Insurance Group': 'American Family Insurance', 'Mutual of Omaha Insurance': 'Mutual of Omaha', 'Thrivent Financial for Lutherans': 'Thrivent',
  'Western & Southern Financial Group': 'Western & Southern', 'Publix Super Markets': 'Publix', 'Costco Wholesale': 'Costco', 'Walt Disney': 'Disney',
  'Ford Motor': 'Ford', 'Verizon Communications': 'Verizon', 'Cisco Systems': 'Cisco', 'Micron Technology': 'Micron', 'Walgreens Boots Alliance': 'Walgreens',
  'Archer Daniels Midland': 'ADM', 'Enterprise Products Partners': 'Enterprise Products', 'Philip Morris International': 'Philip Morris',
  'Honeywell International': 'Honeywell', 'Mondelez International': 'Mondelez', 'Marriott International': 'Marriott', 'Hilton Worldwide Holdings': 'Hilton',
  'Goodyear Tire & Rubber': 'Goodyear', 'Booz Allen Hamilton': 'Booz Allen', 'Leidos Holdings': 'Leidos', 'L3Harris Technologies': 'L3Harris',
  'Spirit AeroSystems Holdings': 'Spirit AeroSystems', 'Huntington Ingalls Industries': 'Huntington Ingalls', 'Thermo Fisher Scientific': 'Thermo Fisher',
  'Zimmer Biomet Holdings': 'Zimmer Biomet', 'Regeneron Pharmaceuticals': 'Regeneron', 'IQVIA Holdings': 'IQVIA', 'US Foods Holding': 'US Foods',
  'Hertz Global Holdings': 'Hertz', 'Penske Automotive Group': 'Penske Automotive', 'American Axle & Manufacturing': 'American Axle',
  'MGM Resorts International': 'MGM Resorts', 'Twenty-First Century Fox': '21st Century Fox', 'Anysphere (Cursor)': 'Cursor',
};

// ---------- companies ----------
const f500 = readJSON('data/fortune500.json');
// US only for now: Fortune 500 HQs and US startups.
const startups = readJSON('data/startups.json').filter((s) => s.country === 'US');
const companies = [];
for (const c of f500) {
  companies.push({
    kind: 'f500', slug: c.slug, name: SHORT_NAMES[c.now || c.name] || c.now || c.name, listedName: c.name, rank: c.rank,
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
    kind: 'startup', slug, name: SHORT_NAMES[s.name] || s.name, listedName: s.name, city: s.city, region: s.region, country: s.country,
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
  { id: 'philly', name: 'Philadelphia', lat: 40.0, lon: -75.3, r: 40 },
  { id: 'dc', name: 'Washington, D.C. area', lat: 38.92, lon: -77.15, r: 45, note: 'Defense primes and government contractors.' },
  { id: 'nyc', name: 'New York metro', lat: 40.8, lon: -74.0, r: 60, note: 'Finance, media and a fast-growing AI scene.' },
  { id: 'boston', name: 'Boston & Cambridge', lat: 42.4, lon: -71.25, r: 50, note: 'Robotics, biotech and MIT spinouts.' },
];
const SHORT = { seattle: 'Seattle', 'bay-area': 'Bay Area', socal: 'SoCal', phoenix: 'Phoenix', denver: 'Denver', austin: 'Austin', dfw: 'Dallas–Fort Worth', houston: 'Houston', msp: 'Twin Cities', chicago: 'Chicago', detroit: 'Detroit', atlanta: 'Atlanta', charlotte: 'Charlotte', philly: 'Philadelphia', dc: 'Washington', nyc: 'New York', boston: 'Boston', europe: 'Europe', 'asia-pacific': 'Asia-Pacific' };
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
// The board is a map of the US: the real outline (with Canada and Mexico around it) rasterized
// onto the grid, state lines on top, and each metro a district of city blocks at its real spot.
// Districts are pushed apart just enough that every company gets its own lot.
const SPACING = 2.6; // board cells from one company's lot to the next
const BOARD_N = 250;
const priorityOf = (c) => (c.kind === 'f500' ? c.rank : 1000);
// Even-odd scanline fill of projected rings onto an n×n grid of cell centres.
function fillRings(rings, n) {
  const out = new Uint8Array(n * n);
  for (let r = 0; r < n; r++) {
    const y = r + 0.5, xs = [];
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [x1, y1] = ring[i], [x2, y2] = ring[j];
        if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let c = Math.max(0, Math.ceil(xs[k] - 0.5)); c < n && c + 0.5 <= xs[k + 1]; c++) out[r * n + c] = 1;
    }
  }
  return out;
}
const ringsOf = (geometry, pj) => (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates).flat().map((ring) => ring.map((pt) => pj(pt)));
function usBoard(kept) {
  const n = BOARD_N;
  const nationTopo = readJSON('node_modules/us-atlas/nation-10m.json');
  const nation = topo.feature(nationTopo, nationTopo.objects.nation).features[0];
  const conus = { type: 'MultiPolygon', coordinates: nation.geometry.coordinates.filter((p) => { const [lon, lat] = p[0][0]; return lon > -126 && lon < -65 && lat > 24 && lat < 50; }) };
  const pj = d3.geoConicEqualArea().parallels([29.5, 45.5]).rotate([96, 0]).fitExtent([[7, 7], [n - 7, n - 7]], conus);
  // Shift the map so it sits in the middle of the board vertically.
  const box = d3.geoPath(pj).bounds(conus);
  pj.translate([pj.translate()[0], pj.translate()[1] + (n - box[1][1] - box[0][1]) / 2]);
  // Metro districts.
  const groups = new Map();
  for (const c of kept) {
    const key = c.area || `${c.city}|${c.region}`;
    if (!groups.has(key)) groups.set(key, { name: c.area ? REGIONS.find((r) => r.id === c.area).short : c.city, members: [] });
    groups.get(key).members.push(c);
  }
  let isl = [...groups.values()];
  const centre = (g) => ({ lat: g.members.reduce((a, c) => a + c.lat, 0) / g.members.length, lon: g.members.reduce((a, c) => a + c.lon, 0) / g.members.length });
  for (let merged = true; merged;) {
    merged = false;
    isl.sort((a, b) => b.members.length - a.members.length);
    for (let i = isl.length - 1; i > 0 && !merged; i--) {
      const small = isl[i], cs = centre(small);
      let best = -1, bestD = 90;
      for (let j = 0; j < i; j++) { const d = km(cs, centre(isl[j])); if (d < bestD) { bestD = d; best = j; } }
      if (best >= 0) { isl[best].members.push(...small.members); isl.splice(i, 1); merged = true; }
    }
  }
  for (const g of isl) {
    const pts = g.members.map((c) => pj([c.lon, c.lat]));
    g.tx = g.x = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    g.ty = g.y = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    g.r = SPACING * Math.sqrt(g.members.length / Math.PI) * 1.05 + SPACING * 0.5;
  }
  const gap = 0.8;
  for (let it = 0; it < 800; it++) {
    for (let i = 0; i < isl.length; i++) {
      for (let j = i + 1; j < isl.length; j++) {
        const a = isl[i], b = isl[j];
        let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        const min = a.r + b.r + gap;
        if (d >= min) continue;
        if (d < 1e-6) { dx = Math.cos(i * 7 + j); dy = Math.sin(i * 7 + j); d = 1; }
        const push = (min - d) / 2, wa = b.r / (a.r + b.r), wb = a.r / (a.r + b.r);
        a.x -= (dx / d) * push * 2 * wa; a.y -= (dy / d) * push * 2 * wa;
        b.x += (dx / d) * push * 2 * wb; b.y += (dy / d) * push * 2 * wb;
      }
    }
    for (const g of isl) {
      g.x += (g.tx - g.x) * 0.03; g.y += (g.ty - g.y) * 0.03;
      g.x = Math.min(n - g.r - 2, Math.max(g.r + 2, g.x)); g.y = Math.min(n - g.r - 2, Math.max(g.r + 2, g.y));
    }
  }
  // Lots: grid points nearest the district's centre, biggest company in the middle.
  const pos = {}, lots = [];
  for (const g of isl) {
    const span = Math.ceil(Math.sqrt(g.members.length)) + 2;
    const grid = [];
    for (let i = -span; i <= span; i++) for (let j = -span; j <= span; j++) grid.push([i, j, Math.hypot(i, j * 1.02) + (i + j) * 1e-3]);
    grid.sort((a, b) => a[2] - b[2]);
    [...g.members].sort((a, b) => priorityOf(a) - priorityOf(b)).forEach((c, k) => {
      const x = Math.round(g.x) + grid[k][0] * SPACING, y = Math.round(g.y) + grid[k][1] * SPACING;
      pos[c.slug] = [+x.toFixed(2), +y.toFixed(2)];
      lots.push([x, y]);
    });
  }
  // Rasterize: US land, Canada and Mexico, districts (paved city blocks) and lots.
  // The census outline fills in the Great Lakes, so cut them back out (rough shorelines).
  const LAKES = [
    [[-92.1, 46.7], [-90.4, 46.6], [-88.4, 47.4], [-87.0, 46.5], [-84.6, 46.5], [-84.8, 47.5], [-85.9, 48.0], [-88.3, 48.6], [-89.6, 48.0], [-91.5, 47.3]],
    [[-87.8, 42.2], [-87.6, 41.7], [-86.9, 41.7], [-86.3, 42.4], [-86.2, 43.6], [-86.5, 44.6], [-85.6, 45.2], [-85.0, 45.8], [-84.7, 45.9], [-86.0, 45.9], [-87.0, 45.8], [-87.6, 44.9], [-87.9, 43.8], [-87.8, 42.8]],
    [[-84.7, 45.9], [-83.5, 45.9], [-81.6, 45.3], [-80.7, 45.9], [-80.0, 45.0], [-81.7, 44.4], [-81.7, 43.3], [-82.4, 43.0], [-82.9, 44.0], [-83.4, 43.9], [-83.3, 44.5], [-84.1, 45.5]],
    [[-83.4, 41.7], [-82.7, 41.4], [-81.6, 41.5], [-80.0, 42.1], [-78.9, 42.8], [-79.8, 42.8], [-81.3, 42.6], [-82.5, 42.0], [-83.2, 42.0]],
    [[-79.8, 43.3], [-78.0, 43.4], [-76.3, 43.5], [-76.2, 44.2], [-77.2, 43.9], [-78.7, 43.9], [-79.4, 43.6]],
  ];
  const lakeBits = fillRings(LAKES.map((ring) => ring.map((pt) => pj(pt))), n);
  const usBits = fillRings(ringsOf(conus, pj), n).map((v, i) => v && !lakeBits[i]);
  const countriesTopo = readJSON('node_modules/world-atlas/countries-50m.json');
  const neighbours = topo.feature(countriesTopo, countriesTopo.objects.countries).features.filter((f) => f.id === '124' || f.id === '484');
  const abroadBits = fillRings(neighbours.flatMap((f) => ringsOf(f.geometry, pj)), n).map((v, i) => v && !lakeBits[i]);
  let land = '', lot = '', town = '', abroad = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = c + 0.5, y = r + 0.5, i = r * n + c;
      const inTown = isl.some((g) => Math.hypot(x - g.x, y - g.y) <= g.r);
      land += usBits[i] || inTown ? '1' : '0';
      town += inTown ? '1' : '0';
      abroad += !usBits[i] && !inTown && abroadBits[i] ? '1' : '0';
      lot += lots.some(([lx, ly]) => Math.abs(x - lx) < SPACING * 0.36 && Math.abs(y - ly) < SPACING * 0.36) ? '1' : '0';
    }
  }
  // State lines and the national border, as board-space polylines.
  const statesTopo = simp.simplify(simp.presimplify(readJSON('node_modules/us-atlas/states-10m.json')), 0.002);
  const lines = (mesh) => mesh.coordinates.map((line) => {
    const out = [];
    for (const pt of line) {
      const [x, y] = pj(pt);
      if (out.length && Math.hypot(x - out[out.length - 2], y - out[out.length - 1]) < 0.7) continue;
      out.push(+x.toFixed(1), +y.toFixed(1));
    }
    return out;
  }).filter((l) => l.length >= 4 && l.every((v) => v > -2 && v < n + 2));
  const stateLines = lines(topo.mesh(statesTopo, statesTopo.objects.states, (a, b) => a !== b));
  const islands = isl.filter((g) => g.members.length >= 2).map((g) => [g.name, +g.x.toFixed(2), +g.y.toFixed(2), +g.r.toFixed(2)]);
  const moved = isl.map((g) => Math.hypot(g.x - g.tx, g.y - g.ty));
  console.log(`map: ${isl.length} districts, median shift ${moved.sort((a, b) => a - b)[moved.length >> 1].toFixed(1)} cells, max ${Math.max(...moved).toFixed(1)}`);
  return { isl, placed: { pos, land, lot, town, abroad, islands, states: stateLines } };
}
const board = { modes: {} };
const ISLAND_OF = new Map();
{
  const us = usBoard(companies);
  us.isl.forEach((g, i) => g.members.forEach((c) => ISLAND_OF.set(c.slug, i)));
  // The map's own grid; scan view lays a separate QR code (it scans to this site) over it.
  board.n = BOARD_N;
  board.qr = qrBits(SITE_URL);
  const placed = us.placed;
  const regionsAt = {};
  for (const r of REGIONS) {
    const ps = r.members.map((s) => placed.pos[s]).filter(Boolean);
    if (!ps.length) continue;
    const x = ps.reduce((a, p) => a + p[0], 0) / ps.length, y = ps.reduce((a, p) => a + p[1], 0) / ps.length;
    regionsAt[r.id] = [+x.toFixed(2), +y.toFixed(2), +Math.max(...ps.map((p) => Math.hypot(p[0] - x, p[1] - y))).toFixed(2)];
  }
  board.modes.us = { ...placed, regions: regionsAt };
  console.log(`board: ${board.n}×${board.n} map, ${board.qr.n}×${board.qr.n} QR`);
}

// Which signature 3D model a company gets (see data/industries.json and src/models.js), and a
// look (shape variant, brand colours, base) that no other company in the same group shares.
const industries = readJSON('data/industries.json');
const MODEL_LABELS = industries._labels;
const MODEL_OF = new Map();
for (const [model, names] of Object.entries(industries)) if (!model.startsWith('_')) for (const nm of names) MODEL_OF.set(nm, model);
const modelOf = (c) => MODEL_OF.get(c.listedName || c.name) || 'tree';
{
  const unmapped = companies.filter((c) => !MODEL_OF.has(c.listedName || c.name)).map((c) => c.name);
  if (unmapped.length) console.warn(`no model for: ${unmapped.join(', ')}`);
}
const PALETTES = [
  ['#e5533d', '#2b2f36'], ['#3d7be0', '#f0c24a'], ['#2f9e6e', '#f4f1ea'], ['#8a6cf0', '#ffd23f'], ['#f29a3a', '#2b4a6b'], ['#d6336c', '#f8f6f1'],
  ['#1f6f8b', '#e9c46a'], ['#6b4f3a', '#e5533d'], ['#3fb8a8', '#2b2f36'], ['#c0392b', '#f0c24a'], ['#2b4a9b', '#e5533d'], ['#7a8f2e', '#f4e3b5'],
];
const LOOKS = new Map();
{
  // A company's look: hero shape (v), brand colours (a, b), base, companion prop and topper.
  // Heroes come from what the company does (_heroes); no hero repeats on an island where it can
  // be helped; and no two companies anywhere share the same hero + prop + topper.
  const overrides = industries._looks || {};
  const heroes = industries._heroes || {};
  const byModel = new Map();
  for (const c of companies) {
    const m = modelOf(c);
    if (!byModel.has(m)) byModel.set(m, []);
    byModel.get(m).push(c);
  }
  const shapes = new Set();
  const islandHeroes = new Map(), islandProps = new Map();
  const seen = (map, island, k) => (map.get(island) || new Set()).has(k);
  const mark = (map, island, k) => (map.has(island) || map.set(island, new Set()), map.get(island).add(k));
  const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  for (const [m, list] of byModel) {
    const V = variantCount(m);
    const heroCount = new Array(V).fill(0);
    const sorted = [...list].sort((a, b) => priorityOf(a) - priorityOf(b));
    sorted.forEach((c, idx) => {
      const name = c.listedName || c.name, island = ISLAND_OF.get(c.slug);
      const o = overrides[name] || {};
      let v = o.v ?? heroes[name];
      if (v == null) {
        // Least-used hero that isn't already on this island.
        v = [...Array(V).keys()].sort((x, y) => (seen(islandHeroes, island, `${m}:${x}`) - seen(islandHeroes, island, `${m}:${y}`)) || heroCount[x] - heroCount[y] || x - y)[0];
      }
      v %= V;
      heroCount[v]++;
      mark(islandHeroes, island, `${m}:${v}`);
      // Prop and topper: first free combination, preferring a prop not yet on this island.
      const start = hash(c.slug);
      let pick = null;
      for (const strict of [true, false]) {
        for (let k = 0; k < PROP_COUNT * TOPPER_COUNT && !pick; k++) {
          const prop = (start + k) % PROP_COUNT, topper = (Math.floor((start + k) / PROP_COUNT) + idx) % TOPPER_COUNT;
          if (shapes.has(`${m}:${v}:${prop}:${topper}`) || (strict && seen(islandProps, island, prop))) continue;
          pick = { prop, topper };
        }
        if (pick) break;
      }
      if (!pick) throw new Error(`ran out of shapes for ${c.name}`);
      shapes.add(`${m}:${v}:${pick.prop}:${pick.topper}`);
      mark(islandProps, island, pick.prop);
      const pal = PALETTES[(idx + m.length) % PALETTES.length];
      LOOKS.set(c.slug, { v, a: o.a || pal[0], b: o.b || pal[1], base: o.base ?? (heroCount[v] - 1) % 3, prop: pick.prop, topper: pick.topper });
    });
  }
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
  <a class="brand" href="${up}index.html"><img src="${up}assets/icon.svg" alt="" width="22" height="22"><span>QR&nbsp;Compass</span></a>
  ${extra}
  <nav class="nav"><a href="${up}index.html">QR world</a><a href="${up}map.html">Flat map</a><a href="${up}companies.html">Directory</a></nav>
</header>`;
};

// ---------- dot-matrix logo ----------
// The mark: a compass whose dial is a ring of QR modules.
const MARK = `<svg class="qw-mark" viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#2a2520"/>${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, r = 14.2, x = 20 + Math.sin(a) * r, y = 20 - Math.cos(a) * r, big = i % 4 === 0; const s = big ? 3.4 : 1.9; return `<rect x="${(x - s / 2).toFixed(2)}" y="${(y - s / 2).toFixed(2)}" width="${s}" height="${s}" rx="${big ? 0.7 : 0.4}" fill="${i === 0 ? '#ff6a3d' : '#f6f1e7'}" opacity="${big ? 1 : 0.55}"/>`; }).join('')}<g transform="rotate(32 20 20)"><path d="M20 7.5 24 20h-8z" fill="#ff6a3d"/><path d="M16 20h8l-4 12.5z" fill="#f6f1e7"/></g><circle cx="20" cy="20" r="2" fill="#2a2520" stroke="#f6f1e7" stroke-width="1.2"/></svg>`;
const LOGO = `${MARK}<span class="qw-word"><b>QR</b> Compass</span>`;
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
const qwTop = (depth) => {
  const up = '../'.repeat(depth);
  return `<div class="qw-brand">
    <a class="qw-logo" href="${up}index.html" aria-label="QR Compass home">${LOGO}</a>
  </div>
  <nav class="qw-nav">${depth ? `<a href="${up}index.html">← Map</a>` : ''}<a href="${up}about.html">About</a></nav>`;
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
  const data = { slug: c.slug, name: c.name, model, look: LOOKS.get(c.slug), qr: qrBits(pageUrl) };

  return `${qwHead({ title: `${c.name} · QR Compass`, description: describe(c), path, depth: 1 })}
<body class="qw qw-company">
<section class="qw-stage" id="stage">
  ${qwTop(1)}
  <header class="qw-title">
    <h1>${esc(c.name)}</h1>
    <p>${esc(sub)}</p>
  </header>
  <canvas class="qw-fallback" id="fallback-qr" width="320" height="320" aria-label="QR code for this page"></canvas>
  <div class="qw-hint" id="hint">${esc(((industries._variantLabels || {})[model] || [])[LOOKS.get(c.slug).v] || MODEL_LABELS[model] || '')} · tap to turn it into its QR code</div>
  <div class="qw-dock">
    <div class="qw-url">
      <input id="page-url" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="Paste your link to make it the QR" aria-label="Your link: the QR code will open it">
      <button class="qw-share" id="share" aria-label="Share link">${ICONS.share}<span id="share-label" class="sr">Share</span></button>
    </div>
    <div class="qw-tabs" role="group" aria-label="View">
      <button id="toggle" class="sig" aria-pressed="false">${ICONS.signature}<span id="toggle-label">Turn into QR code</span></button>
      <button id="dock-download">${ICONS.share.replace('M12 15V3M8 7l4-4 4 4', 'M12 3v12M8 11l4 4 4-4')}<span>Download QR</span></button>
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
    <a class="qw-btn primary" href="../index.html#${c.slug}">See it on the map</a>
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
  return `${head({ title: 'Flat map · QR Compass', description, path: 'map.html', depth: 0 })}
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
    const lk = LOOKS.get(c.slug);
    const o = { s: c.slug, n: c.name, k: c.kind === 'f500' ? 0 : 1, t: c.tech ? 1 : 0, c: place(c), m: modelOf(c), L: [lk.v, lk.a, lk.b, lk.base, lk.prop, lk.topper] };
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
  const description = `A 3D map of the US on a QR code: every ${LIST_YEAR} Fortune 500 headquarters and ${startups.length} startups, from Silicon Valley to Boston. Play the tour, search any company, and scan the map.`;
  return `${qwHead({ title: 'QR Compass · America’s companies on a QR code', description, path: '', depth: 0 })}
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
    <div class="qw-show">
      <div class="show-stage" id="show-stage" aria-label="3D model that turns into this company's QR code"></div>
      <button class="qw-show-toggle" id="show-toggle">Turn into QR code</button>
    </div>
    <div class="row">
      <a class="qw-btn primary" id="card-open" href="#">Open its page</a>
      <button class="qw-btn" id="card-copy">Copy link</button>
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
      <button id="scan-btn" class="sig" aria-pressed="false">${ICONS.signature}<span id="scan-label">Turn the map into a QR code</span></button>
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
  return `${head({ title: 'Directory · QR Compass', description, path: 'companies.html', depth: 0 })}
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
  return `${head({ title: 'About the data · QR Compass', description: 'Sources and caveats for the QR Compass company map.', path: 'about.html', depth: 0 })}
<body class="page">
${topbar(0)}
<main class="prose">
  <h1>About the data</h1>
  <p>QR Compass gives every company a page whose QR code is a small 3D world: a tree or a city growing out of the code. Tap it, or press “Turn into QR code”, and it settles into a flat QR code that scans back to that page, so a post or slide about a company can point to one stable link.</p>
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
for (const f of ['site.css', 'qrworld.css', 'atlas.js', 'qr-card.js', 'directory.js', 'icon.svg', 'qrworld.js', 'models.js', 'qrsculpture.js', 'company3d.js', 'world.js', 'BufferGeometryUtils.js']) copyFileSync(join(ROOT, 'src', f), join(OUT, 'assets', f));

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
