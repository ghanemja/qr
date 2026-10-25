// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Janelle Ghanem. QR Compass, https://ghanemja.github.io/qr/
// Builds the static site into docs/ from data/*.json.
//   npm install && npm run build
// SITE_URL (optional) sets canonical/OG URLs, e.g. SITE_URL=https://example.com/atlas/
// GOATCOUNTER (optional) picks the analytics site, e.g. GOATCOUNTER=mysite for mysite.goatcounter.com (empty turns it off)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { variantCount, PROP_COUNT, TOPPER_COUNT, ARCHETYPES } from '../src/models.js';
import { HEROES } from '../src/heroes.js';
import { HEROES2 } from '../src/heroes2.js';
import * as d3 from 'd3-geo';
import * as topo from 'topojson-client';
import * as simp from 'topojson-simplify';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs');
const SITE_URL = (process.env.SITE_URL || 'https://ghanemja.github.io/qr/').replace(/\/?$/, '/');
const LIST_YEAR = 2026;
// The project's licence (LICENSE, MIT): credited in the footer and the About page, and embedded
// in every model the 3D asset library exports.
const LICENSE_TEXT = readFileSync(join(ROOT, 'LICENSE'), 'utf8');
const AUTHOR = 'Janelle Ghanem';
const REPO_URL = 'https://github.com/ghanemja/qr';
// Your GoatCounter site code (the "mysite" in mysite.goatcounter.com); empty turns analytics off.
const GOATCOUNTER = process.env.GOATCOUNTER ?? 'ghanemja';

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
  'Exxon Mobil Holdings': 'Exxon Mobil', 'Cigna Group': 'Cigna', 'StoneX Group': 'StoneX', 'International Business Machines': 'IBM',
  'United Airlines Holdings': 'United Airlines', 'Uber Technologies': 'Uber', 'United Services Automobile Assn.': 'USAA',
  'Bank of New York (BNY)': 'BNY', 'Honeywell Technologies': 'Honeywell', 'Lennar Corporation': 'Lennar', 'PNC Financial Services Group': 'PNC',
  'PayPal Holdings': 'PayPal', 'Hartford Insurance Group': 'The Hartford', 'Reinsurance Group of America': 'RGA', 'Altria Group': 'Altria',
  'LPL Financial Holdings': 'LPL Financial', 'Bitgo Holdings': 'BitGo', 'Kyndryl Holdings': 'Kyndryl', 'Amentum Holdings': 'Amentum',
  'Labcorp Holdings': 'Labcorp', 'Equitable Holdings': 'Equitable', 'Fidelity National Information (FIS)': 'FIS', 'Vertiv Holdings': 'Vertiv',
  'Sirius XM Holdings': 'SiriusXM', 'Hertz Global Holdings': 'Hertz', 'Mondelēz International': 'Mondelēz', 'Lululemon athletica': 'Lululemon',
  'Westinghouse Air Brake': 'Wabtec', 'Interactive Brokers Group': 'Interactive Brokers', 'Public Service Enterprise Group': 'PSEG',
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
    kind: 'f500', slug: c.slug, name: SHORT_NAMES[c.name] || SHORT_NAMES[c.key] || c.name, listedName: c.name, key: c.key, model: c.model, industry: c.industry, employees: c.employees, rank: c.rank,
    revenue: c.revenue, profit: c.profit, city: c.city, region: c.state, country: 'US',
    lat: c.lat, lon: c.lon, website: c.website, tech: c.sector === 'tech',
    sector: c.sector === 'tech' ? 'Technology' : c.industry || '',
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

// ---------- QR codes ----------
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
// ---------- home map: a cartoon US in seven regions ----------
// Region pieces are the merged state outlines (pre-projected Albers USA, 975×610), simplified so
// they read as chunky puzzle pieces; the home page extrudes them into 3D. Each region shows its biggest companies as pins near their
// real city, nudged apart and kept inside the piece; the region view lists them all.
const priorityOf = (c) => (c.kind === 'f500' ? c.rank : 1000);
const MAP_REGIONS = [
  { id: 'northwest', name: 'Northwest', states: ['WA', 'OR', 'ID', 'MT', 'WY', 'AK'], water: 'left', color: '#a8d68f', hover: 'sway', chip: [235, 165] },
  { id: 'west', name: 'West', states: ['CA', 'NV', 'HI'], water: 'left', color: '#cdbfae', hover: 'float', chip: [118, 345] },
  { id: 'southwest', name: 'Southwest', states: ['AZ', 'NM', 'UT', 'CO', 'TX', 'OK'], water: 'bottom', color: '#f4bf6a', hover: 'hop', chip: [318, 455] },
  { id: 'midwest', name: 'Midwest', states: ['ND', 'SD', 'NE', 'KS', 'MN', 'IA', 'MO', 'WI', 'IL', 'MI', 'IN', 'OH', 'KY'], water: 'lake', color: '#f5e38a', hover: 'wave', chip: [452, 300] },
  { id: 'southeast', name: 'Southeast', states: ['AR', 'LA', 'MS', 'AL', 'TN', 'GA', 'FL', 'SC', 'NC'], water: 'bottom', color: '#f4a29a', hover: 'swing', chip: [640, 478] },
  { id: 'midatlantic', name: 'Mid-Atlantic', states: ['NY', 'PA', 'NJ', 'DE', 'MD', 'DC', 'VA', 'WV'], water: 'right', color: '#86d3cf', hover: 'rush', chip: [772, 300] },
  { id: 'northeast', name: 'Northeast', states: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT'], water: 'right', color: '#b8acf2', hover: 'twirl', chip: [955, 62] },
];
const REGION_OF = new Map();
const homeMap = (() => {
  const FIPS = { WA: 53, OR: 41, ID: 16, MT: 30, WY: 56, CA: 6, NV: 32, AZ: 4, NM: 35, UT: 49, CO: 8, TX: 48, OK: 40, ND: 38, SD: 46, NE: 31, KS: 20, MN: 27, IA: 19, MO: 29, WI: 55, IL: 17, MI: 26, IN: 18, OH: 39, KY: 21, AR: 5, LA: 22, MS: 28, AL: 1, TN: 47, GA: 13, FL: 12, SC: 45, NC: 37, NY: 36, PA: 42, NJ: 34, DE: 10, MD: 24, DC: 11, VA: 51, WV: 54, ME: 23, NH: 33, VT: 50, MA: 25, RI: 44, CT: 9 };
  const stateOf = Object.fromEntries(Object.entries(FIPS).map(([k, v]) => [String(v).padStart(2, '0'), k]));
  const t = simp.simplify(simp.presimplify(readJSON('node_modules/us-atlas/states-albers-10m.json'), simp.planarTriangleArea), 18);
  const path = d3.geoPath().digits(0);
  const proj = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
  const geoms = t.objects.states.geometries;
  const regions = MAP_REGIONS.map((r) => {
    const g = geoms.filter((x) => r.states.includes(stateOf[x.id]));
    const merged = topo.merge(t, g);
    // Drop slivers the simplification leaves behind (tiny islands).
    const polys = (merged.type === 'Polygon' ? [merged.coordinates] : merged.coordinates).filter((poly) => Math.abs(d3.geoPath().area({ type: 'Polygon', coordinates: poly })) > 40);
    const shape = { type: 'MultiPolygon', coordinates: polys };
    const inner = topo.mesh(t, { type: 'GeometryCollection', geometries: g }, (a, b) => a !== b);
    const members = companies.filter((c) => r.states.includes(c.region)).sort((a, b) => priorityOf(a) - priorityOf(b));
    members.forEach((c) => REGION_OF.set(c.slug, r.id));
    const inside = (x, y) => polys.some((poly) => {
      let hit = false;
      for (const ring of poly) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    });
    // Distance from a point to the piece's nearest edge (outer coast or a border with another region).
    const clearance = (x, y) => {
      let best = Infinity;
      for (const poly of polys) for (const ring of poly) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [ax, ay] = ring[j], dx = ring[i][0] - ax, dy = ring[i][1] - ay;
        const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
        best = Math.min(best, Math.hypot(x - ax - u * dx, y - ay - u * dy));
      }
      return best;
    };
    // Spots near each company's real city, nudged apart and kept inside the piece: `pins` are the
    // few biggest shown on the US map, `spots` the many shown when the region is opened.
    // `margin` keeps a model's whole footprint on the piece, not just its centre.
    const place = (gap, max, margin) => {
      const out = [];
      for (const c of members) {
        const xy = proj([c.lon, c.lat]);
        if (!xy) continue;
        let spot = null;
        for (let k = 0; k < 1200 && !spot; k++) {
          const rr = 3 * Math.sqrt(k), a = k * 2.39996;
          const x = xy[0] + Math.cos(a) * rr, y = xy[1] + Math.sin(a) * rr;
          if (inside(x, y) && clearance(x, y) >= margin && out.every((q) => Math.hypot(q[1] - x, q[2] - y) >= gap)) spot = [x, y];
        }
        if (spot) out.push([c.slug, Math.round(spot[0]), Math.round(spot[1])]);
        if (out.length >= max) break;
      }
      return out;
    };
    // Spots in the region view stand on a lot about 1 world unit across (the selection ring), about
    // 17 map units at the home page's scale.
    const pins = place(36, 8, 12);
    const spots = place(24, 40, 17);
    const [cx, cy] = path.centroid(shape);
    const r1 = (v) => Math.round(v * 10) / 10;
    return {
      id: r.id, name: r.name, color: r.color, hover: r.hover, water: r.water, chip: r.chip, cx: Math.round(cx), cy: Math.round(cy), pins, spots, members: members.map((c) => c.slug),
      polys: polys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [r1(x), r1(y)]))),
      inner: (inner.coordinates || []).map((line) => line.map(([x, y]) => [r1(x), r1(y)])),
    };
  });
  const LAKES = [
    [[-92.1, 46.7], [-90.4, 46.6], [-88.4, 47.4], [-87.0, 46.5], [-84.6, 46.5], [-84.8, 47.5], [-85.9, 48.0], [-88.3, 48.6], [-89.6, 48.0], [-91.5, 47.3]],
    [[-87.8, 42.2], [-87.6, 41.7], [-86.9, 41.7], [-86.3, 42.4], [-86.2, 43.6], [-86.5, 44.6], [-85.6, 45.2], [-85.0, 45.8], [-84.7, 45.9], [-86.0, 45.9], [-87.0, 45.8], [-87.6, 44.9], [-87.9, 43.8], [-87.8, 42.8]],
    [[-84.7, 45.9], [-83.5, 45.9], [-81.6, 45.3], [-80.7, 45.9], [-80.0, 45.0], [-81.7, 44.4], [-81.7, 43.3], [-82.4, 43.0], [-82.9, 44.0], [-83.4, 43.9], [-83.3, 44.5], [-84.1, 45.5]],
    [[-83.4, 41.7], [-82.7, 41.4], [-81.6, 41.5], [-80.0, 42.1], [-78.9, 42.8], [-79.8, 42.8], [-81.3, 42.6], [-82.5, 42.0], [-83.2, 42.0]],
    [[-79.8, 43.3], [-78.0, 43.4], [-76.3, 43.5], [-76.2, 44.2], [-77.2, 43.9], [-78.7, 43.9], [-79.4, 43.6]],
  ];
  const lakes = LAKES.map((ring) => ring.map((p) => proj(p).map(Math.round)));
  const missing = companies.filter((c) => !REGION_OF.has(c.slug)).map((c) => c.name);
  if (missing.length) console.warn(`no region for: ${missing.join(', ')}`);
  console.log(`home map: ${regions.map((r) => `${r.id} ${r.members.length}`).join(', ')}`);
  return { regions, lakes };
})();

// Which signature 3D model a company gets (see data/industries.json and src/models.js), and a
// look (shape variant, brand colours, base) that no other company in the same group shares.
const industries = readJSON('data/industries.json');
const MODEL_LABELS = industries._labels;
const MODEL_OF = new Map();
for (const [model, names] of Object.entries(industries)) if (!model.startsWith('_')) for (const nm of names) MODEL_OF.set(nm, model);
// Companies from the earlier list keep their hand-picked model (keyed by that list's name);
// newcomers get one from their Fortune industry (tools/prepare_f500.py).
const modelOf = (c) => MODEL_OF.get(c.key || c.listedName || c.name) || c.model || 'tree';
{
  const unmapped = companies.filter((c) => !MODEL_OF.has(c.key || c.listedName || c.name) && !c.model).map((c) => c.name);
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
      const name = c.key || c.listedName || c.name, island = REGION_OF.get(c.slug);
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

const analytics = (up) => (GOATCOUNTER ? `\n<script src="${up}assets/analytics.js" data-goatcounter="${GOATCOUNTER}" data-site="qr"></script>` : '');
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
<link rel="stylesheet" href="${up}assets/site.css">${analytics(up)}
</head>`;
};

// The site-wide company search (src/sitesearch.js); `cls` styles it for the page's stylesheet.
const CUBE = '<svg class="i-cube" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 7.4l8 4.6 8-4.6M12 12v9.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const siteSearch = (cls) => `<div class="${cls}" role="search" data-sitesearch>
    <input type="search" placeholder="Search companies…" autocomplete="off" spellcheck="false" aria-label="Search companies" aria-expanded="false">
    <ul class="ss-results" role="listbox" hidden></ul>
  </div>`;
// The site navigation, the same five links on every page (the topbar of site.css pages and the
// qw-nav of the 3D pages); `current` marks the page you are on.
const NAV = [
  ['world', 'index.html', 'QR world'],
  ['map', 'map.html', 'Flat map'],
  ['dir', 'companies.html', 'Directory'],
  ['about', 'about.html', 'About'],
];
const navLinks = (depth, current) => {
  const up = '../'.repeat(depth);
  const cur = (key) => (key === current ? ' aria-current="page"' : '');
  return NAV.map(([key, href, label]) => `<a href="${up}${href}"${cur(key)}>${label}</a>`).join('')
    + `<a class="lib-link" href="${up}library.html" aria-label="Access 3D asset library"${cur('lib')}>${CUBE}<span class="l-long">Access 3D asset library</span><span class="l-short">3D library</span></a>`;
};
const topbar = (depth, extra = '', current = '') => {
  const up = '../'.repeat(depth);
  return `<header class="topbar">
  <a class="brand" href="${up}index.html"><img src="${up}assets/icon.svg" alt="" width="22" height="22"><span>QR&nbsp;Compass</span></a>
  ${extra}
  <nav class="nav" aria-label="Site">${navLinks(depth, current)}</nav>
</header>`;
};
// The site footer: credit and licence.
const footer = (depth) => {
  const up = '../'.repeat(depth);
  return `<footer class="site-foot">© ${LIST_YEAR} ${AUTHOR} · QR Compass is open source under the <a href="${up}LICENSE.txt">MIT License</a> · <a href="${up}library.html">3D models</a> free to download · <a href="${REPO_URL}">Source on GitHub</a></footer>`;
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
<script type="importmap">{"imports":{"three":"${up || './'}assets/three.module.min.js"}}</script>${analytics(up)}
</head>`;
};
const qwTop = (depth, current = '') => {
  const up = '../'.repeat(depth);
  return `<div class="qw-brand">
    <a class="qw-logo" href="${up}index.html" aria-label="QR Compass home">${LOGO}</a>
  </div>
  ${depth ? siteSearch('qw-find') : ''}
  <nav class="qw-nav" aria-label="Site">${navLinks(depth, current)}</nav>`;
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
        ['Industry', esc(c.industry || '')],
        ['Headquarters', esc(place(c))],
      ]
    : [
        ['Type', 'Startup / private company'],
        ['Sector', esc(c.sector)],
        ['Founded', String(c.founded)],
        ['Headquarters', esc(place(c))],
      ];
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
      <input id="qr-title" class="qw-title-in" type="text" autocomplete="off" placeholder="Title (none)" aria-label="Title printed under the downloaded QR code">
      <input id="qr-center" class="qw-center-in" type="text" autocomplete="off" maxlength="3" placeholder="—" aria-label="Letters in the middle of the QR code (up to 3; empty for none)">
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
    ? `Rank and financials: Fortune 500, ${LIST_YEAR} list (fiscal ${LIST_YEAR - 1}). HQ locations: the city on the list, placed with the US Census Gazetteer.`
    : 'Startup entries are curated by hand; check the company’s own site for current details.'} <a href="../about.html">About the data</a>.</p>
  <p class="qw-source qw-licence">© ${LIST_YEAR} ${AUTHOR} · QR Compass is open source under the <a href="../LICENSE.txt">MIT License</a>. Download this model and the others from the <a href="../library.html">3D asset library</a>.</p>
</main>
<script>window.COMPANY=${JSON.stringify(data)};</script>
<script src="../assets/qrcode.js"></script>
<script src="../assets/qr-card.js"></script>
<script src="../assets/sitesearch.js"></script>
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
  </div>`, 'map')}
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


// ---------- home (index): the cartoon region map ----------
function worldPage() {
  const slim = companies.map((c) => {
    const lk = LOOKS.get(c.slug);
    const o = { s: c.slug, n: c.name, k: c.kind === 'f500' ? 0 : 1, t: c.tech ? 1 : 0, c: place(c), m: modelOf(c), L: [lk.v, lk.a, lk.b, lk.base, lk.prop, lk.topper] };
    if (c.rank) o.r = c.rank;
    if (c.listedName && c.listedName !== c.name) o.ln = c.listedName;
    // Quick facts for the company card.
    if (c.revenue != null) o.v = c.revenue;
    if (c.profit != null) o.p = c.profit;
    if (c.employees) o.e = c.employees;
    if (c.industry) o.i = c.industry;
    if (c.kind === 'startup') Object.assign(o, { sec: c.sector, f: c.founded, b: c.blurb });
    return o;
  });
  const description = `America’s biggest companies on a 3D map: every ${LIST_YEAR} Fortune 500 headquarters and ${startups.length} startups in seven regions. Open a region, find a company, and turn its 3D model into its QR code.`;
  return `${qwHead({ title: 'QR Compass · America’s companies on a map', description, path: '', depth: 0 })}
<body class="qw qw-home">
<section class="qw-stage hm-stage" id="stage">
  ${qwTop(0, 'world')}
  <div class="hm-intro" id="intro">
    <h1>Where America’s biggest companies live</h1>
    <p>Hover a region to wake it up. Click it to break it off the map and walk its streets.</p>
  </div>
  <div id="labels" class="hm-labels"></div>
  <div id="tip" class="hm-tip" role="tooltip" hidden></div>
  <div class="hm-fallback" id="fallback" hidden>
    <p>Your browser can’t show the 3D map. Pick a company from the <a href="companies.html">directory</a> instead.</p>
  </div>

  <section class="hm-region" id="region" hidden aria-labelledby="r-name">
    <header class="hm-r-head">
      <nav aria-label="Breadcrumb"><button id="r-crumb-home">United States</button><span aria-hidden="true">/</span><span id="r-crumb"></span></nav>
      <h1 id="r-name"></h1>
      <div class="hm-stats"><div><b id="r-f"></b><span>Fortune 500 HQs</span></div><div><b id="r-s"></b><span>startups</span></div><div><b id="r-t"></b><span>in tech</span></div></div>
    </header>
    <aside class="hm-card" aria-live="polite">
      <div class="qw-badges"><span class="qw-badge" id="c-badge"></span><span class="qw-badge" id="c-kind"></span></div>
      <h2 id="c-name"></h2>
      <p class="hm-place" id="c-place"></p>
      <dl class="hm-facts" id="c-facts"></dl>
      <div class="hm-card-stage" id="c-stage" aria-label="3D model that turns into this company's QR code"></div>
      <div class="hm-card-actions">
        <button class="hm-btn dark" id="c-toggle" aria-pressed="false">${ICONS.signature}<span id="c-toggle-label">Turn into QR code</span></button>
        <a class="hm-btn" id="c-open" href="#">Open its page</a>
      </div>
      <h3>All <span id="r-all-n"></span> companies here</h3>
      <ul class="hm-list" id="r-list"></ul>
    </aside>
    <div class="hm-r-bar">
      <button class="hm-btn brown" id="r-back">← US map</button>
      <button class="hm-btn" id="r-stop">Stop tour</button>
      <div class="hm-pills" id="r-pills" role="group" aria-label="Regions"></div>
    </div>
  </section>

  <div class="qw-dock hm-dock" id="dock">
    <div class="qw-search" role="search">
      <input id="q" type="search" placeholder="Search a company, city or region…" autocomplete="off" spellcheck="false" aria-label="Search companies" aria-controls="results" aria-expanded="false">
      <ul id="results" role="listbox" hidden></ul>
      <button class="qw-play" id="play" aria-label="Play the region tour"><svg class="i-play" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg><svg class="i-stop" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/></svg></button>
    </div>
  </div>
</section>
<script>window.HOME=${JSON.stringify({ ...homeMap, labels: MODEL_LABELS, listYear: LIST_YEAR })};window.COMPANIES=${JSON.stringify(slim)};</script>
<script src="assets/qrcode.js"></script>
<script src="assets/qr-card.js"></script>
<script type="module" src="assets/home.js"></script>
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
${topbar(0, siteSearch('search'), 'dir')}
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
${footer(0)}
<script src="assets/directory.js"></script>
<script src="assets/sitesearch.js"></script>
</body>
</html>
`;
}

function aboutPage() {
  return `${head({ title: 'About the data · QR Compass', description: 'Sources and caveats for the QR Compass company map.', path: 'about.html', depth: 0 })}
<body class="page">
${topbar(0, siteSearch('search'), 'about')}
<main class="prose">
  <h1>About the data</h1>
  <p>QR Compass gives every company a page with its own 3D model. Tap it, or press “Turn into QR code”, and the model breaks into pixels that settle into a QR code that scans back to that page, so a post or slide about a company can point to one stable link.</p>
  <p>The home page is a 3D map of the US in seven regions. Each region’s biggest companies stand on it near their headquarters; click a region to break it off the map and explore every company in it.</p>
  <h2>Fortune 500</h2>
  <p>Ranks, names, revenue, profit, industry and headquarters city come from the <strong>${LIST_YEAR} Fortune 500</strong> list (fiscal ${LIST_YEAR - 1} figures) as published at <a href="https://fortune.com/ranking/fortune500/${LIST_YEAR}/">fortune.com</a>. Fortune publishes a new list every June.</p>
  <p>Headquarters are placed at their city using the US Census Bureau’s 2024 Gazetteer of places. Some companies appear under a short name (for example IBM, BNY, USAA); their page notes the name on the list.</p>
  <h2>Startups</h2>
  <p>The ${startups.length} startups and private companies are a hand-picked set of well-known names, not a ranking. Funding and valuations change too fast to keep in a static site, so the pages leave them out.</p>
  <h2>Map</h2>
  <p>Borders from Natural Earth via <a href="https://github.com/topojson/world-atlas">world-atlas</a> and <a href="https://github.com/topojson/us-atlas">us-atlas</a>. QR codes are generated in your browser with <a href="https://github.com/kazuhikoarase/qrcode-generator">qrcode-generator</a> (MIT).</p>
  <h2>3D models</h2>
  <p>Every model on the site can be downloaded from the <a href="library.html">3D asset library</a> as a GLB file, ready for Blender, game engines and 3D viewers. Each file carries the project credit and the full licence text.</p>
  <h2>Corrections</h2>
  <p>Edit <code>data/fortune500.json</code> or <code>data/startups.json</code> and run <code>npm run build</code>.</p>
  <h2>Licence and credit</h2>
  <p>QR Compass, including its code and 3D models, is made by <a href="https://github.com/ghanemja">${AUTHOR}</a> and released under the <a href="LICENSE.txt">MIT License</a> (© ${LIST_YEAR} ${AUTHOR}): you may use, change and share it, as long as the copyright notice and licence travel with it. The source is on <a href="${REPO_URL}">GitHub</a>. Company names belong to their owners; the data sources above keep their own terms.</p>
</main>
${footer(0)}
<script src="assets/sitesearch.js"></script>
</body>
</html>
`;
}

// ---------- 3D asset library ----------
// Every model on the site, for download as GLB (src/library.js exports them in the browser).
const LIBRARY = (() => {
  const heroIds = new Set([...Object.keys(HEROES), ...Object.keys(HEROES2)]);
  const vlabels = industries._variantLabels || {};
  const users = new Map(); // "model:variant" -> companies with that look
  for (const c of rankedCompanies()) {
    const k = `${modelOf(c)}:${LOOKS.get(c.slug).v}`;
    if (!users.has(k)) users.set(k, []);
    users.get(k).push(c);
  }
  const KIND_NAMES = { ai: 'AI', vr: 'VR', pg: 'P&G' };
  const kindName = (id) => KIND_NAMES[id] || id[0].toUpperCase() + id.slice(1);
  const entry = (id, v, t, sub, kind) => {
    const list = users.get(`${id}:${v}`) || [];
    const lk = list.length ? LOOKS.get(list[0].slug) : { a: PALETTES[0][0], b: PALETTES[0][1] };
    return { id, v, kind, t, sub, slug: slugify(kind === 'hero' ? id : `${id}-${v}-${t}`), a: lk.a, b: lk.b, users: list.map((c) => [c.name, c.slug]) };
  };
  const heroes = [...heroIds].map((id) => {
    const list = users.get(`${id}:0`) || [];
    const who = list.length ? list[0].name : kindName(id);
    return entry(id, 0, who, MODEL_LABELS[id] || '', 'hero');
  }).sort((a, b) => a.t.localeCompare(b.t));
  const shapes = Object.keys(ARCHETYPES).filter((id) => !heroIds.has(id)).flatMap((id) =>
    Array.from({ length: variantCount(id) }, (_, v) => entry(id, v, (vlabels[id] || [])[v] || MODEL_LABELS[id] || kindName(id), kindName(id), 'shape')));
  return {
    site: SITE_URL, year: LIST_YEAR, author: AUTHOR, license: LICENSE_TEXT,
    groups: [
      { title: 'Signature models', note: 'One-of-a-kind scenes for the biggest names, each showing why the company wins.', items: heroes },
      { title: 'Shared shapes', note: 'The models other companies stand on, by kind of business. Pick the two brand colours before you download.', items: shapes },
    ],
  };
})();
function rankedCompanies() { return [...companies.filter((c) => c.kind === 'f500').sort((a, b) => a.rank - b.rank), ...companies.filter((c) => c.kind === 'startup')]; }
function libraryPage() {
  const n = LIBRARY.groups.reduce((s, g) => s + g.items.length, 0);
  const description = `Download any of the ${n} QR Compass 3D models as GLB files, free under the MIT License.`;
  return `${head({ title: '3D asset library · QR Compass', description, path: 'library.html', depth: 0 }).replace('</head>', `<script type="importmap">{"imports":{"three":"./assets/three.module.min.js"}}</script>
</head>`)}
<body class="page library">
${topbar(0, siteSearch('search'), 'lib')}
<main>
  <h1>3D asset library</h1>
  <p class="lede">${esc(description)} Each file credits the project and carries the full licence; keep them with the model when you share it.</p>
  <section class="lib-viewer" id="lib-viewer" aria-label="Model preview">
    <div class="lib-canvas" id="lib-canvas"></div>
    <div class="lib-panel">
      <h2 id="lib-title"></h2>
      <p class="lib-sub" id="lib-sub"></p>
      <p class="lib-users" id="lib-users"></p>
      <div class="lib-colors" id="lib-colors" hidden>
        <label><input type="color" id="lib-a"> Brand colour</label>
        <label><input type="color" id="lib-b"> Second colour</label>
      </div>
      <label class="lib-check"><input type="checkbox" id="lib-anim"> Include its animation (12-second loop)</label>
      <div class="lib-actions">
        <button class="btn primary" id="lib-glb">Download .glb</button>
        <button class="btn" id="lib-zip">Download .zip <small>GLB + licence</small></button>
        <a class="btn ghost" href="LICENSE.txt" download="LICENSE.txt">Download licence</a>
      </div>
      <p class="lib-status" id="lib-status" aria-live="polite"></p>
      <p class="lib-fine">High detail, at its rest pose. Brand colours are baked into vertex colours; water is a plain glossy material. GLB metadata: <code>asset.copyright</code> “© ${LIST_YEAR} ${AUTHOR} — QR Compass, MIT License” and <code>asset.extras</code> with the title, project, author, link and licence text.</p>
    </div>
  </section>
  <div class="lib-tools"><input id="lib-filter" type="search" placeholder="Filter models or companies…" aria-label="Filter models"></div>
  <div id="lib-groups"></div>
</main>
${footer(0)}
<script>window.LIBRARY=${JSON.stringify(LIBRARY).replace(/</g, '\\u003c')};</script>
<script src="assets/sitesearch.js"></script>
<script type="module" src="assets/library.js"></script>
</body>
</html>
`;
}

// ---------- write ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'c'), { recursive: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
for (const f of ['site.css', 'qrworld.css', 'atlas.js', 'qr-card.js', 'directory.js', 'icon.svg', 'qrworld.js', 'models.js', 'qrsculpture.js', 'company3d.js', 'home.js', 'BufferGeometryUtils.js', 'RoundedBoxGeometry.js', 'kit.js', 'heroes.js', 'heroes2.js', 'scenes.js', 'sitesearch.js', 'library.js', 'analytics.js']) copyFileSync(join(ROOT, 'src', f), join(OUT, 'assets', f));

copyFileSync(join(ROOT, 'node_modules/qrcode-generator/qrcode.js'), join(OUT, 'assets/qrcode.js'));
copyFileSync(join(ROOT, 'node_modules/three/build/three.module.min.js'), join(OUT, 'assets/three.module.min.js'));
copyFileSync(join(ROOT, 'node_modules/three/examples/jsm/controls/OrbitControls.js'), join(OUT, 'assets/OrbitControls.js'));
copyFileSync(join(ROOT, 'node_modules/three/examples/jsm/environments/RoomEnvironment.js'), join(OUT, 'assets/RoomEnvironment.js'));
// GLTFExporter (for the 3D asset library) and the one helper it imports, flattened into assets/.
writeFileSync(join(OUT, 'assets/GLTFExporter.js'), readFileSync(join(ROOT, 'node_modules/three/examples/jsm/exporters/GLTFExporter.js'), 'utf8').replace("'./../utils/TextureUtils.js'", "'./TextureUtils.js'"));
copyFileSync(join(ROOT, 'node_modules/three/examples/jsm/utils/TextureUtils.js'), join(OUT, 'assets/TextureUtils.js'));
// The licence, served next to the site (LICENSE.txt opens in the browser).
copyFileSync(join(ROOT, 'LICENSE'), join(OUT, 'LICENSE'));
copyFileSync(join(ROOT, 'LICENSE'), join(OUT, 'LICENSE.txt'));
writeFileSync(join(OUT, 'assets/map.svg'), MAP_SVG);
// The site-wide search index (src/sitesearch.js): [slug, name, place, kind, tech, rank, listed name].
writeFileSync(join(OUT, 'assets/search.json'), JSON.stringify(companies.map((c) => {
  const row = [c.slug, c.name, place(c), c.kind === 'f500' ? 0 : 1, c.tech ? 1 : 0, c.rank || 0];
  if (c.listedName && c.listedName !== c.name) row.push(c.listedName);
  return row;
})));
writeFileSync(join(OUT, 'map.html'), indexPage());
writeFileSync(join(OUT, 'index.html'), worldPage());
writeFileSync(join(OUT, 'companies.html'), directoryPage());
writeFileSync(join(OUT, 'about.html'), aboutPage());
writeFileSync(join(OUT, 'library.html'), libraryPage());
writeFileSync(join(OUT, '.nojekyll'), '');
const ordered = [...companies.filter((c) => c.kind === 'f500').sort((a, b) => a.rank - b.rank), ...companies.filter((c) => c.kind === 'startup')];
ordered.forEach((c, i) => writeFileSync(join(OUT, 'c', `${c.slug}.html`), companyPage(c, ordered[i - 1], ordered[i + 1])));
console.log(`built ${ordered.length} company pages, ${REGIONS.length} regions → docs/`);
for (const r of REGIONS) console.log(`  ${r.id}: ${r.members.length}`);
