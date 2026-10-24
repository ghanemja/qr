// Low-poly signature models. Each archetype has a centerpiece (about 10 units tall, built at
// the origin) and a set of small "pieces" (about one QR module across) that float above the
// dark modules, the way the leaves of a tree do. Geometry carries vertex colours, so one
// material draws everything and instancing stays cheap.
import * as THREE from 'three';
import { mergeGeometries } from './BufferGeometryUtils.js';

const V = THREE.Vector3;
const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), col = new THREE.Color();

// ---------- geometry kit ----------
// Colour a geometry (a hex, or fn(x, y, z, vertexIndex) on transformed coords) and place it.
function part(geo, color, { p = [0, 0, 0], r = [0, 0, 0], s = 1, q = null } = {}) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  g.clearGroups();
  m4.compose(new V(...p), q || qt.setFromEuler(eu.set(...r)), new V(...(Array.isArray(s) ? s : [s, s, s])));
  g.applyMatrix4(m4);
  const pos = g.attributes.position, n = pos.count, arr = new Float32Array(n * 3);
  const fn = typeof color === 'function' ? color : null;
  if (!fn) col.set(color);
  for (let i = 0; i < n; i++) {
    if (fn) col.set(fn(pos.getX(i), pos.getY(i), pos.getZ(i), i));
    arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
const merge = (...parts) => mergeGeometries(parts.flat(Infinity));
// Move an already-coloured geometry without repainting it.
function place(geo, { p = [0, 0, 0], r = [0, 0, 0], s = 1 } = {}) {
  return geo.clone().applyMatrix4(m4.compose(new V(...p), qt.setFromEuler(eu.set(...r)), new V(...(Array.isArray(s) ? s : [s, s, s]))));
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 14) => new THREE.CylinderGeometry(rt, rb, h, seg);
const ball = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
const cone = (r, h, seg = 12) => new THREE.ConeGeometry(r, h, seg);
const torus = (r, t, arc = Math.PI * 2, seg = 24) => new THREE.TorusGeometry(r, t, 8, seg, arc);
function extrude(points, depth) {
  const sh = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}
const prism = (w, h, d) => extrude([[-w / 2, 0], [w / 2, 0], [0, h]], d); // roof: ridge along z
function star(r, depth) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return extrude(pts, depth);
}
// A strut from a to b.
function beam(a, b, t, color) {
  const A = new V(...a), B = new V(...b);
  const dir = B.clone().sub(A);
  const g = box(t, dir.length(), t);
  return part(g, color, { p: A.clone().add(B).multiplyScalar(0.5).toArray(), q: new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), dir.normalize()) });
}
const ring = (n, fn) => Array.from({ length: n }, (_, i) => fn((i / n) * Math.PI * 2, i));

// ---------- palette ----------
const K = {
  stone: '#efe6d6', stoneDk: '#d8ccb6', white: '#f8f6f1', ink: '#2b2f36', dark: '#3a3f47', steel: '#a9b1bb', steelDk: '#7d8792',
  gold: '#f0c24a', goldDk: '#c99a2e', red: '#e5533d', redDk: '#b83a2a', blue: '#3d7be0', blueDk: '#2a5bb0', sky: '#8cc8f0',
  green: '#5fae5b', greenDk: '#3f7f43', money: '#7cbf7d', moneyDk: '#4f9258', wood: '#9a6a41', woodDk: '#6f4a2c',
  cream: '#fbf3e3', orange: '#f29a3a', purple: '#8a6cf0', purpleLt: '#c3b4ff', pink: '#f39ab8', teal: '#3fb8a8', yellow: '#ffd23f', tan: '#e2b37a', brown: '#8a5a36',
};

// ---------- pieces (fit a 1 x 1 module) ----------
export const PIECES = {
  leaf: () => part(ball(0.64, 0), '#ffffff'),
  bill: () => merge(part(box(0.92, 0.03, 0.5), K.money), part(box(0.72, 0.034, 0.34), K.moneyDk), part(cyl(0.11, 0.11, 0.04, 12), '#e7f3df')),
  coin: () => merge(part(cyl(0.36, 0.36, 0.09, 18), K.gold), part(cyl(0.25, 0.25, 0.1, 18), K.goldDk), part(box(0.06, 0.105, 0.22), K.gold)),
  card: () => merge(part(box(0.86, 0.04, 0.55), '#ffffff'), part(box(0.86, 0.045, 0.1), K.ink, { p: [0, 0, -0.15] }), part(box(0.15, 0.05, 0.12), K.gold, { p: [-0.24, 0, 0.06] })),
  phone: () => merge(part(box(0.44, 0.07, 0.86), K.ink), part(box(0.36, 0.075, 0.7), '#7cc0ff', { p: [0, 0.002, -0.02] }), part(box(0.1, 0.08, 0.03), '#9aa3ad', { p: [0, 0, 0.38] })),
  headset: () => merge(
    part(torus(0.3, 0.05, Math.PI, 16), K.ink, { r: [0, 0, 0] }),
    part(cyl(0.15, 0.15, 0.13, 14), K.red, { p: [0.3, -0.02, 0], r: [0, 0, Math.PI / 2] }),
    part(cyl(0.15, 0.15, 0.13, 14), K.red, { p: [-0.3, -0.02, 0], r: [0, 0, Math.PI / 2] }),
    part(cyl(0.025, 0.025, 0.32, 6), K.ink, { p: [0.2, -0.12, 0.12], r: [0.9, 0, 0.5] }),
  ),
  puff: () => part(ball(0.55, 1), '#ffffff'),
  drop: () => merge(part(ball(0.2, 1), '#5aa9e6', { s: [1, 1.05, 1] }), part(cone(0.18, 0.32, 10), '#5aa9e6', { p: [0, 0.22, 0] })),
  oil: () => merge(part(ball(0.22, 1), '#2b2b30'), part(cone(0.2, 0.34, 10), '#2b2b30', { p: [0, 0.24, 0] })),
  barrel: () => merge(part(cyl(0.3, 0.3, 0.6, 14), '#2f6aa3'), part(cyl(0.315, 0.315, 0.05, 14), '#204a74', { p: [0, 0.16, 0] }), part(cyl(0.315, 0.315, 0.05, 14), '#204a74', { p: [0, -0.16, 0] }), part(cyl(0.22, 0.22, 0.02, 14), '#4c86bf', { p: [0, 0.305, 0] })),
  bolt: () => merge(part(box(0.16, 0.42, 0.1), K.yellow, { p: [0.06, 0.22, 0], r: [0, 0, -0.35] }), part(box(0.34, 0.1, 0.1), K.yellow, { p: [0, 0.02, 0] }), part(box(0.16, 0.42, 0.1), K.yellow, { p: [-0.06, -0.2, 0], r: [0, 0, -0.35] })),
  parcel: () => merge(part(box(0.66, 0.5, 0.66), '#c99a62'), part(box(0.67, 0.505, 0.14), '#ead8b5'), part(box(0.16, 0.51, 0.16), '#ffffff', { p: [0.2, 0.002, 0.2] })),
  bag: () => merge(part(box(0.5, 0.56, 0.26), '#ffffff'), part(box(0.505, 0.1, 0.265), K.ink, { p: [0, 0.2, 0] }), part(torus(0.13, 0.025, Math.PI, 10), K.ink, { p: [0, 0.28, 0] })),
  tire: () => merge(part(torus(0.26, 0.12, Math.PI * 2, 18), '#2b2b2e', { r: [Math.PI / 2, 0, 0] }), part(cyl(0.16, 0.16, 0.16, 14), K.steel)),
  suitcase: () => merge(part(box(0.62, 0.44, 0.26), '#ffffff'), part(box(0.64, 0.06, 0.28), K.ink, { p: [0, 0.1, 0] }), part(torus(0.1, 0.025, Math.PI, 8), K.ink, { p: [0, 0.22, 0] })),
  chipToken: () => merge(part(cyl(0.34, 0.34, 0.09, 18), '#ffffff'), part(cyl(0.22, 0.22, 0.1, 18), K.white), ring(6, (a) => part(box(0.1, 0.095, 0.08), K.white, { p: [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], r: [0, -a, 0] }))),
  die: () => merge(part(box(0.5, 0.5, 0.5), K.white), [[0, 0.251, 0], [0.1, 0.251, 0.1], [-0.1, 0.251, -0.1], [0.251, 0, 0], [-0.251, 0.1, 0.1], [-0.251, -0.1, -0.1]].map((p) => part(ball(0.05, 0), K.red, { p }))),
  star: () => part(star(0.42, 0.14), K.yellow, { r: [-Math.PI / 2, 0, 0] }),
  smoke: () => part(ball(0.55, 1), '#e9e6e1'),
  voxel: () => merge(part(box(0.62, 0.62, 0.62), '#ffffff'), part(box(0.4, 0.64, 0.4), '#f4f4f4')),
  app: () => merge(part(box(0.66, 0.16, 0.66), '#ffffff'), part(box(0.26, 0.17, 0.26), K.white)),
  bubble: () => part(ball(0.3, 1), '#ffffff'),
  ice: () => part(box(0.44, 0.44, 0.44), '#d6eef9', { r: [0.3, 0.4, 0.1] }),
  heart: () => merge(part(ball(0.2, 1), '#ffffff', { p: [-0.13, 0.08, 0] }), part(ball(0.2, 1), '#ffffff', { p: [0.13, 0.08, 0] }), part(cone(0.27, 0.36, 4), '#ffffff', { p: [0, -0.16, 0], r: [Math.PI, Math.PI / 4, 0] })),
  speech: () => merge(part(box(0.66, 0.42, 0.14), '#ffffff'), part(cone(0.1, 0.2, 4), '#ffffff', { p: [-0.18, -0.28, 0], r: [Math.PI, 0, 0] }), ring(3, (a, i) => part(ball(0.045, 0), K.ink, { p: [-0.14 + i * 0.14, 0, 0.075] }))),
  popcorn: () => merge(part(ball(0.18, 0), K.cream), part(ball(0.15, 0), '#fff8e6', { p: [0.16, 0.06, 0.05] }), part(ball(0.13, 0), '#f6d77a', { p: [-0.1, 0.1, 0.12] })),
  fry: () => merge(part(box(0.1, 0.62, 0.1), '#f3c443', { r: [0, 0, 0.2] }), part(box(0.1, 0.56, 0.1), '#f0b931', { p: [0.14, 0, 0.05], r: [0, 0, -0.15] }), part(box(0.1, 0.5, 0.1), '#f6cd55', { p: [-0.12, 0, -0.06], r: [0.1, 0, 0.05] })),
  nugget: () => part(ball(0.26, 0), '#d99a43', { s: [1.2, 0.8, 1] }),
  corn: () => merge(part(new THREE.CapsuleGeometry(0.15, 0.42, 4, 10), '#f5c84a'), part(box(0.12, 0.5, 0.03), '#6cae54', { p: [0.1, -0.08, 0], r: [0, 0, -0.3] }), part(box(0.12, 0.5, 0.03), '#5f9f49', { p: [-0.1, -0.08, 0], r: [0, 0, 0.3] })),
  hay: () => merge(part(cyl(0.3, 0.3, 0.5, 14), '#e3c169', { r: [Math.PI / 2, 0, 0] }), part(cyl(0.305, 0.305, 0.05, 14), '#c9a24a', { r: [Math.PI / 2, 0, 0] })),
  gear: () => merge(part(cyl(0.28, 0.28, 0.14, 16), '#ffffff'), part(cyl(0.09, 0.09, 0.15, 10), K.dark), ring(8, (a) => part(box(0.12, 0.14, 0.12), '#ffffff', { p: [Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32], r: [0, -a, 0] }))),
  screw: () => merge(part(cyl(0.07, 0.07, 0.46, 8), K.steel), part(cyl(0.16, 0.16, 0.1, 6), K.steelDk, { p: [0, 0.25, 0] })),
  molecule: () => merge(part(ball(0.18, 1), '#ffffff', { p: [-0.2, 0, 0] }), part(ball(0.14, 1), K.white, { p: [0.22, 0.08, 0] }), part(cyl(0.04, 0.04, 0.4, 6), K.steel, { p: [0, 0.04, 0], r: [0, 0, Math.PI / 2 - 0.2] })),
  ingot: () => part(cyl(0.22, 0.32, 0.2, 4), '#ffffff', { r: [0, Math.PI / 4, 0], s: [1.3, 1, 0.8] }),
  ibeam: () => merge(part(box(0.9, 0.06, 0.3), '#b0643c'), part(box(0.9, 0.06, 0.3), '#b0643c', { p: [0, 0.28, 0] }), part(box(0.9, 0.24, 0.06), '#97522f', { p: [0, 0.14, 0] })),
  house: () => merge(part(box(0.5, 0.36, 0.44), K.white), part(prism(0.62, 0.3, 0.5), '#ffffff', { p: [0, 0.18, 0] }), part(box(0.12, 0.2, 0.02), K.wood, { p: [0, -0.08, 0.225] })),
  neuron: () => merge(part(ball(0.24, 1), '#ffffff'), ring(3, (a) => part(cyl(0.025, 0.025, 0.3, 5), K.purpleLt, { p: [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], r: [0, -a, Math.PI / 2] }))),
  spark: () => part(star(0.3, 0.1), '#ffffff', { r: [-Math.PI / 2, 0, 0] }),
  capsule: () => part(new THREE.CapsuleGeometry(0.17, 0.42, 4, 12), (x) => (x > 0 ? K.red : K.white), { r: [0, 0, Math.PI / 2] }),
  plane: () => merge(part(extrude([[0, 0.45], [0.3, -0.35], [0, -0.2]], 0.02), K.white, { r: [-Math.PI / 2, 0, 0] }), part(extrude([[0, 0.45], [-0.3, -0.35], [0, -0.2]], 0.02), '#e9eef5', { r: [-Math.PI / 2, 0, 0], p: [0, 0.03, 0] })),
};

// ---------- centerpieces (≈10 units tall) ----------
const columns = (n, x0, x1, z, h, y, color) => Array.from({ length: n }, (_, i) => part(cyl(0.34, 0.38, h, 12), color, { p: [x0 + ((x1 - x0) * i) / (n - 1), y + h / 2, z] }));
const cloud = (y, s, tone = K.white, dark = '#dfe5ec') => merge(
  [[0, 0, 0, 2.2], [2, -0.3, 0.4, 1.7], [-2.1, -0.4, -0.2, 1.8], [0.9, 0.9, -0.6, 1.6], [-0.9, 0.7, 0.8, 1.5], [3.4, -0.7, -0.3, 1.1], [-3.4, -0.7, 0.4, 1.1], [0, -0.6, 1.6, 1.4], [0.4, -0.6, -1.7, 1.4]]
    .map(([x, yy, z, r]) => part(ball(r * s, 1), (X, Y) => (Y < y - 0.4 * s ? dark : tone), { p: [x * s, y + yy * s, z * s] })),
);
const wheel = (p, r = 0.6, w = 0.45) => [part(cyl(r, r, w, 16), '#2b2b2e', { p, r: [Math.PI / 2, 0, 0] }), part(cyl(r * 0.5, r * 0.5, w + 0.04, 12), K.steel, { p, r: [Math.PI / 2, 0, 0] })];

const CENTER = {
  bank: () => ({ geo: merge(
    part(box(9, 0.5, 7), K.stoneDk, { p: [0, 0.25, 0] }), part(box(8.2, 0.5, 6.2), K.stone, { p: [0, 0.75, 0] }), part(box(7.4, 0.4, 5.4), K.stoneDk, { p: [0, 1.2, 0] }),
    part(box(6.2, 4.4, 3.6), '#e4d8c2', { p: [0, 3.6, -0.6] }),
    columns(6, -3.2, 3.2, 2.1, 4.4, 1.4, K.white), columns(6, -3.2, 3.2, -2.1, 4.4, 1.4, K.white),
    part(box(7.8, 0.7, 5.6), K.stone, { p: [0, 6.15, 0] }),
    part(prism(8.2, 2, 5.8), '#d9c9a8', { p: [0, 6.5, 0], r: [0, Math.PI / 2, 0], s: [0.71, 1, 1.41] }),
    part(cyl(0.75, 0.75, 0.25, 20), K.gold, { p: [0, 7.15, 2.95], r: [Math.PI / 2, 0, 0] }),
    part(box(1.6, 2.6, 0.2), '#b88a3a', { p: [0, 2.7, 1.25] }),
  ) }),
  payments: () => ({ geo: merge(
    part(box(3.4, 0.6, 2.4), K.dark, { p: [0, 0.3, 0] }),
    part(box(8.6, 5.4, 0.35), (x, y) => (y > 6.6 && y < 7.4 ? K.ink : K.blue), { p: [0, 3.6 + 1.4, 0], r: [-0.18, 0, 0] }),
    part(box(1.2, 0.9, 0.1), K.gold, { p: [-2.6, 5.1, 0.42], r: [-0.18, 0, 0] }),
    ring(4, (a, i) => part(box(1.2, 0.18, 0.1), '#dfe8ff', { p: [-2.2 + i * 1.5, 3.6, 0.6], r: [-0.18, 0, 0] })),
    ring(6, (a, i) => part(cyl(0.9, 0.9, 0.3, 20), i % 2 ? K.gold : K.goldDk, { p: [4.4, 0.15 + i * 0.32, 2.4] })),
    ring(4, (a, i) => part(cyl(0.9, 0.9, 0.3, 20), i % 2 ? K.gold : K.goldDk, { p: [-4.4, 0.15 + i * 0.32, 2] })),
  ) }),
  insurance: () => ({ geo: merge(
    part(cyl(0.16, 0.16, 9.4, 8), K.ink, { p: [0, 4.7, 0] }),
    part(torus(0.6, 0.15, Math.PI, 12), K.ink, { p: [0.6, 0.1, 0], r: [0, 0, Math.PI] }),
    part(cone(6, 2.4, 8), (x, y, z, i) => (Math.floor(i / 6) % 2 ? K.red : K.white), { p: [0, 9.6, 0] }),
    part(ball(0.3, 0), K.ink, { p: [0, 10.9, 0] }),
    part(box(3, 2.2, 2.6), K.cream, { p: [-1.6, 1.1, 1.6] }), part(prism(3.6, 1.6, 3), K.redDk, { p: [-1.6, 2.2, 1.6] }),
    part(box(0.7, 1.2, 0.05), K.wood, { p: [-1.6, 0.6, 2.93] }),
  ) }),
  health: () => ({ geo: merge(
    part(cyl(3.6, 3.9, 0.7, 24), K.white, { p: [0, 0.35, 0] }),
    part(box(2.2, 6.6, 1.4), K.red, { p: [-1.2, 4, -0.5] }), part(box(6.6, 2.2, 1.4), K.red, { p: [-1.2, 4.2, -0.5] }),
    part(new THREE.CapsuleGeometry(1.1, 3.6, 6, 16), (x, y) => (x * 0.6 + y * 0.8 > 3.8 ? K.teal : K.white), { p: [2.6, 2.6, 1.6], r: [0, 0, -0.65] }),
  ) }),
  oil: () => {
    const legs = [[-2, -2], [2, -2], [2, 2], [-2, 2]];
    const H = 10, top = 0.45;
    const parts = legs.map(([x, z]) => beam([x, 0, z], [x * top / 2, H, z * top / 2], 0.28, K.red));
    for (let lv = 1; lv <= 4; lv++) {
      const y = (lv * H) / 5, k = 1 - (1 - top / 2) * (y / H);
      for (let i = 0; i < 4; i++) {
        const [x0, z0] = legs[i], [x1, z1] = legs[(i + 1) % 4];
        parts.push(beam([x0 * k, y, z0 * k], [x1 * k, y, z1 * k], 0.16, K.white));
      }
    }
    parts.push(part(box(1.6, 0.8, 1.6), K.dark, { p: [0, H + 0.4, 0] }), part(box(5.2, 0.4, 5.2), K.steelDk, { p: [0, 0.2, 0] }));
    for (const [x, z, c] of [[3.3, 1.4, '#2f6aa3'], [3.5, -0.4, K.red], [3.1, 2.9, '#2f6aa3']]) parts.push(part(cyl(0.7, 0.7, 1.5, 14), c, { p: [x, 0.75, z] }), part(cyl(0.72, 0.72, 0.1, 14), K.ink, { p: [x, 1.1, z] }));
    return { geo: merge(parts) };
  },
  power: () => ({
    geo: merge(
      part(cyl(0.22, 0.45, 10, 12), K.white, { p: [0, 5, 0] }), part(box(0.9, 0.8, 1.8), K.white, { p: [0, 10.2, -0.3] }),
      ring(3, (a, i) => part(box(1.6, 0.06, 1), '#2d4f8e', { p: [-3 + i * 1.8, 0.7, 2.6], r: [-0.5, 0, 0] })),
      ring(3, (a, i) => part(box(0.1, 0.6, 0.1), K.steelDk, { p: [-3 + i * 1.8, 0.3, 2.6] })),
    ),
    spin: { geo: merge(part(ball(0.35, 0), K.white), ring(3, (a) => part(box(0.35, 4.6, 0.12), K.white, { p: [Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0], r: [0, 0, a - Math.PI / 2] }))), pivot: [0, 10.2, 0.75], axis: [0, 0, 1], speed: 1.2 },
  }),
  retail: () => ({ geo: merge(
    beam([-3, 2, -1.8], [3.4, 2, -1.8], 0.16, K.red), beam([-3, 2, 1.8], [3.4, 2, 1.8], 0.16, K.red), beam([-3, 2, -1.8], [-3, 2, 1.8], 0.16, K.red), beam([3.4, 2, -1.8], [3.4, 2, 1.8], 0.16, K.red),
    beam([-3.6, 5.6, -2.2], [4.2, 5.6, -2.2], 0.16, K.red), beam([-3.6, 5.6, 2.2], [4.2, 5.6, 2.2], 0.16, K.red), beam([-3.6, 5.6, -2.2], [-3.6, 5.6, 2.2], 0.16, K.red), beam([4.2, 5.6, -2.2], [4.2, 5.6, 2.2], 0.16, K.red),
    ...[-3, 3.4].flatMap((x, i) => [beam([x, 2, -1.8], [x + (i ? 0.8 : -0.6), 5.6, -2.2], 0.14, K.red), beam([x, 2, 1.8], [x + (i ? 0.8 : -0.6), 5.6, 2.2], 0.14, K.red)]),
    ring(5, (a, i) => beam([-2 + i * 1.2, 2, -1.8], [-2.3 + i * 1.5, 5.6, -2.2], 0.08, K.white)),
    ring(5, (a, i) => beam([-2 + i * 1.2, 2, 1.8], [-2.3 + i * 1.5, 5.6, 2.2], 0.08, K.white)),
    part(box(6.4, 0.1, 3.6), '#f6d7cf', { p: [0.2, 2.05, 0] }),
    beam([-3.6, 5.6, -2.2], [-5, 6.6, -2.2], 0.16, K.dark), beam([-3.6, 5.6, 2.2], [-5, 6.6, 2.2], 0.16, K.dark), part(cyl(0.22, 0.22, 4.8, 10), K.dark, { p: [-5, 6.6, 0], r: [Math.PI / 2, 0, 0] }),
    beam([-2.6, 2, 0], [-2.6, 0.6, 0], 0.18, K.dark), beam([3, 2, 0], [3, 0.6, 0], 0.18, K.dark),
    wheel([-2.6, 0.5, -1.6], 0.5, 0.3), wheel([-2.6, 0.5, 1.6], 0.5, 0.3), wheel([3, 0.5, -1.6], 0.5, 0.3), wheel([3, 0.5, 1.6], 0.5, 0.3),
    part(box(1.8, 2.2, 1.4), K.orange, { p: [-1, 3.2, -0.6] }), part(box(1.4, 1.6, 1.2), K.blue, { p: [1.2, 2.9, 0.6] }), part(box(1.6, 2.6, 0.8), K.green, { p: [2.2, 3.4, -0.8], r: [0, 0.3, 0.1] }),
  ) }),
  parcel: () => ({ geo: merge(
    part(box(5.4, 4.4, 5.4), '#c99a62', { p: [0, 2.2, 0] }), part(box(5.45, 4.42, 1), '#ead8b5', { p: [0, 2.21, 0] }),
    part(box(5.4, 0.12, 2.7), '#b98a52', { p: [0, 4.9, -3.4], r: [-0.9, 0, 0] }), part(box(5.4, 0.12, 2.7), '#b98a52', { p: [0, 4.9, 3.4], r: [0.9, 0, 0] }),
    part(box(2.7, 0.12, 5.4), '#d4a76d', { p: [-3.4, 4.9, 0], r: [0, 0, 0.9] }), part(box(2.7, 0.12, 5.4), '#d4a76d', { p: [3.4, 4.9, 0], r: [0, 0, -0.9] }),
    part(box(2.2, 2, 2.2), '#d9ab70', { p: [-0.6, 5.2, 0.4], r: [0, 0.4, 0.15] }), part(box(1.4, 1.4, 1.4), '#c58f55', { p: [1, 6.4, -0.6], r: [0.3, 0.2, 0] }), part(box(0.9, 0.9, 0.9), '#e2bb84', { p: [0.2, 7.6, 0.5], r: [0.1, 0.8, 0.3] }),
    part(box(3, 2, 1.8), K.white, { p: [4.4, 1.3, 3.4] }), part(box(1.2, 1.4, 1.8), K.blue, { p: [6.4, 1, 3.4] }), part(box(0.05, 0.7, 1.4), '#9dd0f2', { p: [7.02, 1.3, 3.4] }),
    wheel([4, 0.4, 2.5], 0.4, 0.3), wheel([4, 0.4, 4.3], 0.4, 0.3), wheel([6.3, 0.4, 2.5], 0.4, 0.3), wheel([6.3, 0.4, 4.3], 0.4, 0.3),
  ) }),
  car: () => ({
    geo: merge(part(cyl(5.4, 5.6, 0.6, 32), K.steelDk, { p: [0, 0.3, 0] })),
    spin: { geo: merge(
      part(cyl(5, 5, 0.25, 32), K.dark, { p: [0, 0.72, 0] }),
      part(box(7.6, 1.5, 3.4), K.red, { p: [0, 2.05, 0] }), part(box(4.2, 1.4, 3.1), K.red, { p: [-0.4, 3.45, 0] }),
      part(box(4.25, 1, 3.15), '#2c3e55', { p: [-0.4, 3.5, 0] }), part(box(4.4, 0.12, 3.2), K.red, { p: [-0.4, 4.15, 0] }),
      part(box(0.1, 0.35, 0.6), K.yellow, { p: [3.82, 2.3, 1.1] }), part(box(0.1, 0.35, 0.6), K.yellow, { p: [3.82, 2.3, -1.1] }),
      part(box(0.1, 0.3, 0.5), K.redDk, { p: [-3.82, 2.3, 1.2] }), part(box(0.1, 0.3, 0.5), K.redDk, { p: [-3.82, 2.3, -1.2] }),
      wheel([2.4, 1.45, 1.75], 0.8, 0.5), wheel([2.4, 1.45, -1.75], 0.8, 0.5), wheel([-2.4, 1.45, 1.75], 0.8, 0.5), wheel([-2.4, 1.45, -1.75], 0.8, 0.5),
    ), pivot: [0, 0, 0], axis: [0, 1, 0], speed: 0.35 },
  }),
  plane: () => ({
    geo: merge(part(cyl(0.9, 1.2, 6, 12), K.white, { p: [0, 3, 0] }), part(cyl(1.6, 1.4, 1.2, 10), '#7fc3ea', { p: [0, 6.6, 0] }), part(cone(1.7, 0.8, 10), K.white, { p: [0, 7.6, 0] }), part(cyl(0.05, 0.05, 1.4, 6), K.red, { p: [0, 8.6, 0] })),
    spin: { geo: merge(
      part(new THREE.CapsuleGeometry(0.75, 6, 6, 14), K.white, { p: [4.6, 9, 0], r: [Math.PI / 2, 0, 0] }),
      part(box(7.4, 0.14, 1.6), '#e8edf3', { p: [4.6, 8.8, 0.2] }), part(box(2.8, 0.12, 0.9), '#e8edf3', { p: [4.6, 9.1, -3.2] }),
      part(box(0.14, 1.6, 1.2), K.blue, { p: [4.6, 9.9, -3.3] }),
      part(cyl(0.38, 0.38, 1.2, 12), K.steel, { p: [2.6, 8.5, 0.5], r: [Math.PI / 2, 0, 0] }), part(cyl(0.38, 0.38, 1.2, 12), K.steel, { p: [6.6, 8.5, 0.5], r: [Math.PI / 2, 0, 0] }),
      ring(7, (a, i) => part(box(0.04, 0.22, 0.26), K.ink, { p: [5.37, 9.15, 2.2 - i * 0.6] })),
      part(cone(0.75, 1.1, 14), K.blue, { p: [4.6, 9, 3.55], r: [Math.PI / 2, 0, 0] }),
    ), pivot: [0, 0, 0], axis: [0, 1, 0], speed: -0.45 },
  }),
  casino: () => ({ geo: merge(
    part(box(4, 4, 4), K.white, { p: [-1.4, 2.4, -0.4], r: [0.3, 0.5, 0.2] }),
    [[-1.4, 4.65, -0.4], [-0.6, 4.6, 0.4], [-2.2, 4.7, -1.2]].map((p) => part(ball(0.32, 1), K.red, { p })),
    part(box(3, 3, 3), K.red, { p: [2.4, 1.5, 1.4], r: [0, -0.4, 0] }),
    [[2.4, 3.05, 1.4], [1.7, 3.05, 0.8], [3.1, 3.05, 2]].map((p) => part(ball(0.26, 1), K.white, { p })),
    ring(9, (a, i) => part(cyl(1.1, 1.1, 0.32, 20), i % 3 === 0 ? K.ink : i % 3 === 1 ? K.red : K.blue, { p: [-3.6, 0.16 + i * 0.34, 3] })),
    ring(5, (a, i) => part(cyl(1.1, 1.1, 0.32, 20), i % 2 ? K.green : K.ink, { p: [3.6, 0.16 + i * 0.34, -3] })),
  ) }),
  rocket: () => ({ geo: merge(
    part(cyl(3.4, 3.8, 0.8, 20), K.steelDk, { p: [0, 0.4, 0] }),
    part(cyl(1.25, 1.35, 7, 20), K.white, { p: [0, 4.9, 0] }), part(cone(1.25, 2.8, 20), K.red, { p: [0, 9.8, 0] }),
    part(cyl(0.5, 0.5, 0.15, 16), '#7fc3ea', { p: [0, 6.8, 1.25], r: [Math.PI / 2, 0, 0] }), part(cyl(1.27, 1.27, 0.4, 20), K.red, { p: [0, 4, 0] }),
    ring(4, (a) => part(extrude([[0, 0], [1.6, 0], [0, 2.4]], 0.18), K.red, { p: [Math.cos(a) * 1.2, 1.5, Math.sin(a) * 1.2], r: [0, -a, 0] })),
    part(cone(0.9, 1, 16), K.dark, { p: [0, 1.1, 0], r: [Math.PI, 0, 0] }),
    part(ball(1, 1), K.orange, { p: [0, 0.7, 0], s: [1, 0.6, 1] }),
    beam([3, 0.8, -1], [3, 9, -1], 0.3, K.steel), beam([3, 0.8, 1], [3, 9, 1], 0.3, K.steel), ring(5, (a, i) => beam([3, 1.5 + i * 1.6, -1], [3, 2.3 + i * 1.6, 1], 0.12, K.steel)),
    ring(5, (a) => part(ball(0.9, 1), '#eeeae4', { p: [Math.cos(a) * 2.6, 1, Math.sin(a) * 2.6] })),
  ) }),
  chip: () => ({
    geo: merge(part(box(8, 0.5, 8), '#2f6b4a', { p: [0, 0.25, 0] }), ring(10, (a, i) => part(box(0.12, 0.52, 3.6), K.gold, { p: [-3.6 + i * 0.8, 0.26, i % 2 ? 2.2 : -2.2] })), part(cyl(0.5, 0.7, 2.4, 12), K.steel, { p: [0, 1.7, 0] })),
    spin: { geo: merge(
      part(box(5, 0.6, 5), K.ink, { p: [0, 3.6, 0] }), part(box(3, 0.3, 3), '#c9ccd2', { p: [0, 4.05, 0] }), part(box(1.4, 0.32, 1.4), K.gold, { p: [0, 4.1, 0] }),
      ...[-1, 1].flatMap((sgn) => ring(8, (a, i) => [part(box(0.22, 0.12, 0.8), K.gold, { p: [-2.1 + i * 0.6, 3.5, sgn * 2.8] }), part(box(0.8, 0.12, 0.22), K.gold, { p: [sgn * 2.8, 3.5, -2.1 + i * 0.6] })])),
    ), pivot: [0, 0, 0], axis: [0, 1, 0], speed: 0.4 },
  }),
  computer: () => ({ geo: merge(
    part(box(8, 0.4, 5.4), '#c9ced6', { p: [0, 0.2, 0] }), part(box(6.8, 0.1, 2.6), K.dark, { p: [0, 0.42, -0.6] }), part(box(2.4, 0.06, 1.4), '#b3b9c2', { p: [0, 0.42, 1.6] }),
    part(box(8, 5.2, 0.3), '#c9ced6', { p: [0, 2.8, -2.9], r: [-0.22, 0, 0] }), part(box(7.4, 4.6, 0.05), (x, y) => (y > 3.6 ? '#7cc0ff' : '#4f8fe0'), { p: [0, 2.85, -2.7], r: [-0.22, 0, 0] }),
    part(box(2.2, 1.4, 0.06), K.white, { p: [-1.8, 3.6, -2.6], r: [-0.22, 0, 0] }), part(box(2.2, 0.4, 0.06), K.yellow, { p: [1.6, 3.9, -2.65], r: [-0.22, 0, 0] }), part(box(2.2, 0.4, 0.06), K.white, { p: [1.6, 3.2, -2.5], r: [-0.22, 0, 0] }),
  ) }),
  software: () => ({ geo: merge(
    cloud(8, 1.15), ring(5, (a, i) => part(cyl(0.08, 0.08, 6.4, 6), i % 2 ? '#7cc0ff' : '#bfe3ff', { p: [-2.4 + i * 1.2, 3.6, (i % 3) - 1] })),
    part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }), part(cyl(2.2, 2.2, 0.52, 24), '#bfe3ff', { p: [0, 0.27, 0] }),
  ) }),
  comms: () => ({ geo: merge(
    cloud(10.5, 1.25, '#f3f5f8', '#b9c3cf'),
    part(box(3.6, 1.4, 2.4), K.red, { p: [0, 0.7, 0] }), part(cyl(1, 1, 0.3, 16), K.white, { p: [0, 1.45, 0.3] }),
    part(cyl(0.4, 0.4, 3.4, 10), K.red, { p: [0, 2.1, -0.6], r: [0, 0, Math.PI / 2] }), part(box(0.9, 0.6, 1), K.red, { p: [1.6, 2.2, -0.6] }), part(box(0.9, 0.6, 1), K.red, { p: [-1.6, 2.2, -0.6] }),
  ) }),
  social: () => ({ geo: merge(
    part(box(3.6, 7.2, 0.5), K.ink, { p: [-0.8, 3.8, 0], r: [-0.1, 0.2, 0] }), part(box(3.2, 6.2, 0.05), (x, y) => (y > 5.8 ? '#8fb7ff' : '#dfe8ff'), { p: [-0.75, 3.85, 0.28], r: [-0.1, 0.2, 0] }),
    part(box(3.2, 2, 0.5), K.white, { p: [2.4, 7.6, 1] }), part(cone(0.4, 0.8, 4), K.white, { p: [1.4, 6.4, 1], r: [Math.PI, 0, 0] }),
    part(ball(0.75, 1), K.red, { p: [2.8, 4.6, 1.6] }), part(ball(0.75, 1), K.red, { p: [3.9, 4.6, 1.6] }), part(cone(1.1, 1.4, 4), K.red, { p: [3.35, 3.6, 1.6], r: [Math.PI, Math.PI / 4, 0] }),
    part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }),
  ) }),
  media: () => ({ geo: merge(
    beam([0, 5, 0], [-2.2, 0, -1.4], 0.22, K.dark), beam([0, 5, 0], [2.2, 0, -1.4], 0.22, K.dark), beam([0, 5, 0], [0, 0, 2.4], 0.22, K.dark),
    part(box(3.6, 2.4, 2), K.ink, { p: [0, 6.2, 0] }), part(cyl(0.8, 1.1, 1.6, 16), K.dark, { p: [0, 6.2, 1.8], r: [Math.PI / 2, 0, 0] }), part(cyl(0.7, 0.7, 0.1, 16), '#7cc0ff', { p: [0, 6.2, 2.62], r: [Math.PI / 2, 0, 0] }),
    part(cyl(1.4, 1.4, 0.4, 20), K.dark, { p: [-0.9, 8.6, 0], r: [0, 0, Math.PI / 2] }), part(cyl(1.1, 1.1, 0.4, 20), K.dark, { p: [1.3, 8.4, 0], r: [0, 0, Math.PI / 2] }),
    part(cyl(0.4, 0.4, 0.42, 10), K.steel, { p: [-0.9, 8.6, 0], r: [0, 0, Math.PI / 2] }), part(cyl(0.3, 0.3, 0.42, 10), K.steel, { p: [1.3, 8.4, 0], r: [0, 0, Math.PI / 2] }),
    part(box(3.4, 0.5, 2.4), (x, y, z, i) => (Math.floor(x + 10) % 2 ? K.ink : K.white), { p: [3.2, 0.7, 2.6], r: [0, 0.3, 0] }), part(box(3.4, 0.5, 2.4), K.ink, { p: [3.2, 1.4, 2.2], r: [-0.5, 0.3, 0] }),
    part(cyl(1.2, 0.9, 2, 12), (x, y) => (Math.floor(y * 2) % 2 ? K.red : K.white), { p: [-3.4, 1, 2.4] }), part(ball(1.1, 1), K.cream, { p: [-3.4, 2.2, 2.4] }),
  ) }),
  food: () => ({ geo: merge(
    part(cyl(3.1, 3, 1, 24), '#e2a65a', { p: [0, 0.5, 0] }), part(cyl(3.35, 3.35, 0.9, 24), '#6b3b22', { p: [0, 1.45, 0] }),
    part(box(4.6, 0.18, 4.6), '#f6c443', { p: [0, 2, 0], r: [0, Math.PI / 4, 0] }), part(cyl(3.5, 3.5, 0.25, 12), '#6cbf4b', { p: [0, 2.2, 0] }), part(cyl(3.1, 3.1, 0.3, 24), K.red, { p: [0, 2.45, 0] }),
    part(new THREE.SphereGeometry(3.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#e8ad5f', { p: [0, 2.6, 0], s: [1, 0.75, 1] }),
    ring(12, (a, i) => part(ball(0.16, 0), K.cream, { p: [Math.cos(a) * (1 + (i % 3) * 0.6), 4.5 - (i % 3) * 0.35, Math.sin(a) * (1 + (i % 3) * 0.6)], s: [1.5, 0.6, 1] })),
    part(box(2, 2.4, 1.4), K.red, { p: [4.4, 1.2, 2.2], r: [0, -0.3, 0] }), ring(7, (a, i) => part(box(0.22, 2, 0.22), '#f3c443', { p: [3.8 + (i % 4) * 0.35, 2.9, 1.8 + (i % 2) * 0.5], r: [0.1 * (i % 3), 0, 0.12 * ((i % 2) * 2 - 1)] })),
  ) }),
  drink: () => ({ geo: merge(
    part(cyl(2.4, 1.8, 7.4, 24), (x, y) => (y > 2.6 && y < 4.4 ? K.white : K.red), { p: [0, 3.7, 0] }),
    part(cyl(2.55, 2.55, 0.5, 24), K.white, { p: [0, 7.6, 0] }), part(cyl(1.4, 1.4, 0.55, 24), '#eef0f2', { p: [0, 7.7, 0] }),
    part(cyl(0.2, 0.2, 5, 10), (x, y) => (Math.floor(y * 1.6) % 2 ? K.red : K.white), { p: [0.8, 9.6, 0], r: [0, 0, -0.35] }),
    ring(5, (a) => part(box(1, 1, 1), '#d6eef9', { p: [Math.cos(a) * 3.4, 0.5, Math.sin(a) * 3.4], r: [0.4, a, 0.2] })),
  ) }),
  care: () => ({ geo: merge(
    part(cyl(2, 2.2, 6, 20), K.teal, { p: [0, 3, 0] }), part(cyl(2.05, 2.05, 2.2, 20), K.white, { p: [0, 3, 0] }),
    part(cyl(0.8, 0.9, 1, 14), K.white, { p: [0, 6.5, 0] }), part(cyl(0.25, 0.25, 1.4, 8), K.white, { p: [0, 7.6, 0] }), part(box(2, 0.5, 0.6), K.white, { p: [0.7, 8.3, 0] }),
    part(cyl(1.2, 1.3, 3.4, 16), K.pink, { p: [3.4, 1.7, 1.4] }), part(cyl(0.7, 0.7, 0.8, 12), K.white, { p: [3.4, 3.8, 1.4] }),
  ) }),
  farm: () => ({ geo: merge(
    part(box(6, 4.6, 5), K.red, { p: [-1, 2.3, 0] }), part(prism(6.8, 2.8, 5.4), '#6f2a22', { p: [-1, 4.6, 0], r: [0, Math.PI / 2, 0], s: [0.8, 1, 1.25] }),
    part(box(2.2, 3, 0.1), K.white, { p: [-1, 1.5, 2.55] }), beam([-2.1, 0, 2.62], [0.1, 3, 2.62], 0.15, K.red), beam([0.1, 0, 2.62], [-2.1, 3, 2.62], 0.15, K.red),
    part(cyl(1.5, 1.5, 7.4, 18), '#c9ced6', { p: [3.6, 3.7, -0.6] }), part(new THREE.SphereGeometry(1.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.steel, { p: [3.6, 7.4, -0.6] }),
    ring(5, (a, i) => part(cyl(0.18, 0.18, 0.08, 8), K.steelDk, { p: [3.6, 1.2 + i * 1.4, 0.92] })),
    part(cyl(0.9, 0.9, 1.4, 14), '#e3c169', { p: [2.6, 0.9, 3], r: [0, 0, Math.PI / 2] }), part(cyl(0.9, 0.9, 1.4, 14), '#e3c169', { p: [4.2, 0.9, 3.2], r: [0, 0, Math.PI / 2] }),
  ) }),
  industrial: () => {
    const gear = (r, teeth, w, color) => merge(part(cyl(r, r, w, 28), color, { r: [Math.PI / 2, 0, 0] }), part(cyl(r * 0.35, r * 0.35, w + 0.1, 14), K.dark, { r: [Math.PI / 2, 0, 0] }),
      ring(teeth, (a) => part(box(r * 0.28, r * 0.3, w), color, { p: [Math.cos(a) * (r + r * 0.12), Math.sin(a) * (r + r * 0.12), 0], r: [0, 0, a] })),
      ring(5, (a) => part(cyl(r * 0.16, r * 0.16, w + 0.04, 10), K.dark, { p: [Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 0], r: [Math.PI / 2, 0, 0] })));
    return {
      geo: merge(part(box(3, 0.6, 2.4), K.dark, { p: [0, 0.3, 0] }), beam([-0.8, 0.6, -0.4], [-0.3, 6, -0.4], 0.4, K.steelDk), beam([0.8, 0.6, -0.4], [0.3, 6, -0.4], 0.4, K.steelDk),
        place(gear(2.2, 12, 0.8, K.steel), { p: [4.6, 3.4, 0.2] })),
      spin: { geo: gear(3.6, 16, 1, K.orange), pivot: [0, 6.2, 0.2], axis: [0, 0, 1], speed: 0.5 },
    };
  },
  chem: () => ({ geo: merge(
    part(cyl(1, 3.4, 5, 20), '#cfe9f2', { p: [0, 2.5, 0] }), part(cyl(0.95, 0.95, 2.6, 16), '#cfe9f2', { p: [0, 6.3, 0] }), part(cyl(1.15, 1.15, 0.4, 16), '#e6f4f8', { p: [0, 7.6, 0] }),
    part(cyl(1.8, 3.1, 2.6, 20), '#5fd08f', { p: [0, 1.4, 0] }),
    part(box(4.4, 0.4, 1.4), K.wood, { p: [4.2, 2.6, 1.2] }), beam([2.2, 0, 1.2], [2.2, 2.6, 1.2], 0.25, K.wood), beam([6.2, 0, 1.2], [6.2, 2.6, 1.2], 0.25, K.wood),
    ring(4, (a, i) => part(new THREE.CapsuleGeometry(0.3, 2.4, 4, 10), (x, y) => (y < 2.3 ? [K.pink, K.yellow, K.teal, K.purple][i] : '#e6f4f8'), { p: [2.8 + i * 1, 2.6, 1.2] })),
  ) }),
  metal: () => {
    const ib = (len, p, r) => merge(part(box(len, 0.2, 1), '#b0643c', { p: [p[0], p[1] - 0.45, p[2]], r }), part(box(len, 0.2, 1), '#b0643c', { p: [p[0], p[1] + 0.45, p[2]], r }), part(box(len, 1, 0.2), '#97522f', { p, r }));
    return { geo: merge(
      ...Array.from({ length: 6 }, (_, i) => [ib(7, [0, 0.6 + i * 1.2, -1.8], [0, (i % 2) * Math.PI / 2, 0]), ib(7, [0, 0.6 + i * 1.2, 1.8], [0, (i % 2) * Math.PI / 2, 0])]).map((pair, i) => i % 2 ? pair.map((g) => g.clone().rotateY(Math.PI / 2)) : pair),
      ring(6, (a, i) => part(cyl(0.6, 0.9, 0.5, 4), i % 2 ? K.gold : '#cfd5dc', { p: [4.8 + (i % 3) * 0.9, 0.25 + Math.floor(i / 3) * 0.5, 3.6], r: [0, Math.PI / 4, 0], s: [1.4, 1, 0.8] })),
    ) };
  },
  house: () => ({ geo: merge(
    part(box(6, 4, 5), K.cream, { p: [0, 2, 0] }), part(prism(7, 3, 5.6), '#7a8fa8', { p: [0, 4, 0] }), part(box(0.8, 2, 0.8), '#b0643c', { p: [1.8, 5.4, -1] }),
    part(box(1.2, 2.2, 0.1), K.wood, { p: [0, 1.1, 2.52] }), part(box(1.2, 1, 0.1), '#9dd0f2', { p: [-1.9, 2.4, 2.52] }), part(box(1.2, 1, 0.1), '#9dd0f2', { p: [1.9, 2.4, 2.52] }),
    part(cyl(0.12, 0.12, 2.6, 6), K.wood, { p: [4.4, 1.3, 2.6] }), part(box(1.8, 1.1, 0.1), K.red, { p: [4.4, 2.4, 2.6] }),
    part(ball(1, 1), K.green, { p: [-4.2, 1.4, 1.8] }), part(cyl(0.15, 0.2, 0.8, 6), K.wood, { p: [-4.2, 0.4, 1.8] }),
  ) }),
  ai: () => ({
    geo: merge(part(cyl(2.6, 3, 1, 24), K.white, { p: [0, 0.5, 0] }), part(cyl(0.5, 0.8, 3, 12), K.steel, { p: [0, 2.5, 0] }), part(ball(3, 2), K.purple, { p: [0, 7, 0] }), part(ball(2.2, 1), K.purpleLt, { p: [0.6, 7.6, 1.4] })),
    spin: { geo: merge(part(torus(4.6, 0.14, Math.PI * 2, 48), K.purpleLt, { r: [Math.PI / 2 - 0.4, 0, 0], p: [0, 7, 0] }), part(torus(5.4, 0.1, Math.PI * 2, 48), '#ffffff', { r: [Math.PI / 2 + 0.5, 0.3, 0], p: [0, 7, 0] }), part(ball(0.4, 1), K.yellow, { p: [4.6, 7, 0] })), pivot: [0, 0, 0], axis: [0, 1, 0], speed: 0.6 },
  }),
  robot: () => ({ geo: merge(
    part(box(1, 3, 1.2), K.steel, { p: [-1, 1.5, 0] }), part(box(1, 3, 1.2), K.steel, { p: [1, 1.5, 0] }), part(box(1.3, 0.5, 1.8), K.dark, { p: [-1, 0.25, 0.2] }), part(box(1.3, 0.5, 1.8), K.dark, { p: [1, 0.25, 0.2] }),
    part(box(4, 3.6, 2.4), K.white, { p: [0, 4.9, 0] }), part(box(2.2, 1.4, 0.1), '#7cc0ff', { p: [0, 5.2, 1.22] }),
    beam([-2.1, 6.2, 0], [-3.2, 3.6, 0.6], 0.6, K.steel), beam([2.1, 6.2, 0], [3.4, 8, 0.6], 0.6, K.steel), part(ball(0.55, 1), K.orange, { p: [-3.3, 3.4, 0.6] }), part(ball(0.55, 1), K.orange, { p: [3.5, 8.2, 0.6] }),
    part(box(2.8, 2.2, 2.2), K.white, { p: [0, 7.9, 0] }), part(box(2.2, 0.8, 0.1), K.ink, { p: [0, 8, 1.12] }), part(ball(0.22, 1), '#7cf0ff', { p: [-0.5, 8, 1.2] }), part(ball(0.22, 1), '#7cf0ff', { p: [0.5, 8, 1.2] }),
    part(cyl(0.06, 0.06, 1.2, 6), K.dark, { p: [0, 9.6, 0] }), part(ball(0.25, 1), K.red, { p: [0, 10.3, 0] }),
  ) }),
  tree: () => {
    const bark = '#7a5233';
    const parts = [part(cyl(0.9, 1.5, 9, 9), bark, { p: [0, 4.5, 0] })];
    ring(7, (a, i) => parts.push(beam([0, 5.5 + (i % 3) * 0.8, 0], [Math.cos(a) * 4.2, 8.6 + (i % 2) * 0.8, Math.sin(a) * 4.2], 0.4, bark)));
    return { geo: merge(parts) };
  },
};

// ---------- archetypes ----------
// layout: canopy | swirl | rain | pile | orbit.  anim: flutter | spin | tumble | bob.
export const ARCHETYPES = {
  bank: { pieces: [['bill', 0.78], ['coin', 0.22]], layout: 'swirl', anim: 'flutter', finder: '#cdb37a' },
  payments: { pieces: [['card', 0.6], ['coin', 0.4]], tints: { card: ['#3d7be0', '#2b2f36', '#e5533d', '#f0c24a', '#5fae5b', '#8a6cf0'] }, layout: 'swirl', anim: 'flutter', finder: '#9fb5e0' },
  insurance: { pieces: [['drop', 1]], cloud: true, pieceScale: 1.5, layout: 'rain', anim: 'bob', finder: '#e9a191' },
  health: { pieces: [['capsule', 0.75], ['heart', 0.25]], tints: { heart: ['#e5533d', '#f39ab8'] }, layout: 'orbit', anim: 'tumble', finder: '#a6d9cf' },
  oil: { pieces: [['barrel', 0.7, 'low'], ['oil', 0.3]], layout: 'orbit', anim: 'bob', finder: '#6f7883' },
  power: { pieces: [['bolt', 0.6], ['puff', 0.4, 'high']], tints: { puff: ['#ffffff', '#eef3f8'] }, layout: 'orbit', anim: 'spin', finder: '#ffe27a' },
  retail: { pieces: [['bag', 0.7], ['parcel', 0.3]], tints: { bag: ['#e5533d', '#3d7be0', '#f29a3a', '#5fae5b', '#f39ab8', '#ffd23f'] }, layout: 'pile', anim: 'bob', finder: '#f0a99b' },
  parcel: { pieces: [['parcel', 0.85], ['plane', 0.15, 'high']], layout: 'pile', anim: 'bob', finder: '#d9b98c' },
  car: { pieces: [['tire', 1]], layout: 'orbit', anim: 'spin', finder: '#8d96a1' },
  plane: { pieces: [['puff', 0.3, 'high'], ['suitcase', 0.7, 'low']], pieceScale: 1.15, tints: { puff: ['#ffffff', '#f1f5fa'], suitcase: ['#e5533d', '#3d7be0', '#f29a3a', '#5fae5b'] }, layout: 'orbit', anim: 'bob', finder: '#9fd0ef' },
  casino: { pieces: [['chipToken', 0.7], ['die', 0.3]], tints: { chipToken: ['#e5533d', '#2b2f36', '#3d7be0', '#5fae5b'] }, layout: 'swirl', anim: 'flutter', finder: '#2f7d4f' },
  rocket: { pieces: [['star', 0.55, 'high'], ['smoke', 0.45, 'low']], tints: { smoke: ['#f4f1ec', '#e6e2dc', '#ffffff'] }, layout: 'orbit', anim: 'spin', finder: '#8d96a1' },
  chip: { pieces: [['voxel', 1]], tints: { voxel: ['#3d7be0', '#3fb8a8', '#8a6cf0', '#7cc0ff', '#2b2f36'] }, layout: 'orbit', anim: 'spin', finder: '#2f6b4a' },
  computer: { pieces: [['app', 0.6], ['voxel', 0.4]], tints: { app: ['#3d7be0', '#e5533d', '#5fae5b', '#f29a3a', '#8a6cf0'], voxel: ['#7cc0ff', '#bfe3ff'] }, layout: 'orbit', anim: 'bob', finder: '#c9ced6' },
  software: { pieces: [['app', 1]], tints: { app: ['#3d7be0', '#e5533d', '#5fae5b', '#f29a3a', '#8a6cf0', '#3fb8a8'] }, layout: 'orbit', anim: 'bob', finder: '#bfe3ff' },
  comms: { pieces: [['headset', 0.5], ['phone', 0.5]], cloud: true, pieceScale: 1.55, layout: 'rain', anim: 'tumble', finder: '#b9c3cf' },
  social: { pieces: [['heart', 0.5], ['speech', 0.5]], tints: { heart: ['#e5533d', '#f39ab8'], speech: ['#ffffff', '#dfe8ff', '#8fb7ff'] }, layout: 'swirl', anim: 'bob', finder: '#f39ab8' },
  media: { pieces: [['popcorn', 0.6], ['star', 0.4]], layout: 'orbit', anim: 'tumble', finder: '#e5533d' },
  food: { pieces: [['fry', 0.6], ['nugget', 0.4]], layout: 'orbit', anim: 'tumble', finder: '#f3c443' },
  drink: { pieces: [['ice', 0.35, 'low'], ['bubble', 0.65]], tints: { bubble: ['#f7fbff', '#d6eef9', '#ffd6d0'] }, layout: 'orbit', anim: 'bob', finder: '#e5533d' },
  care: { pieces: [['bubble', 1]], tints: { bubble: ['#d6f2ee', '#f9d9e5', '#e6e0ff', '#ffffff'] }, layout: 'orbit', anim: 'bob', finder: '#7fd1c4' },
  farm: { pieces: [['corn', 0.7], ['hay', 0.3]], layout: 'pile', anim: 'bob', finder: '#7cbf5a' },
  industrial: { pieces: [['gear', 0.65], ['screw', 0.35]], tints: { gear: ['#f29a3a', '#a9b1bb', '#7d8792'] }, layout: 'orbit', anim: 'spin', finder: '#f29a3a' },
  chem: { pieces: [['bubble', 0.55], ['molecule', 0.45]], tints: { bubble: ['#5fd08f', '#8fe0b5', '#3fb8a8'], molecule: ['#e5533d', '#3d7be0', '#5fd08f'] }, layout: 'orbit', anim: 'bob', finder: '#5fd08f' },
  metal: { pieces: [['ingot', 0.55], ['ibeam', 0.45]], tints: { ingot: ['#f0c24a', '#cfd5dc', '#d98c5f'] }, layout: 'pile', anim: 'bob', finder: '#b0643c' },
  house: { pieces: [['house', 1]], tints: { house: ['#e5533d', '#3d7be0', '#5fae5b', '#f29a3a', '#7a8fa8'] }, layout: 'pile', anim: 'bob', finder: '#7cbf5a' },
  ai: { pieces: [['neuron', 0.75], ['spark', 0.25]], tints: { neuron: ['#8a6cf0', '#c3b4ff', '#6fa8ff'], spark: ['#ffd23f', '#ffffff'] }, layout: 'swirl', anim: 'bob', finder: '#c3b4ff', glow: '#5b3fff' },
  robot: { pieces: [['gear', 0.6], ['screw', 0.4]], tints: { gear: ['#a9b1bb', '#f29a3a', '#7cc0ff'] }, layout: 'orbit', anim: 'spin', finder: '#7cc0ff' },
  tree: { pieces: [['leaf', 1]], layout: 'canopy', anim: 'none', finder: 'grass' },
};
for (const [id, a] of Object.entries(ARCHETYPES)) a.id = id;

const cache = new Map();
export function centerpiece(id) {
  if (!cache.has(id)) cache.set(id, (CENTER[id] || CENTER.tree)());
  return cache.get(id);
}
const pieceCache = new Map();
export function piece(kind) {
  if (!pieceCache.has(kind)) pieceCache.set(kind, PIECES[kind]());
  return pieceCache.get(kind);
}

// Shared material for everything with vertex colours.
export function modelMaterial({ glow } = {}) {
  return new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.72, metalness: 0.02, ...(glow ? { emissive: glow, emissiveIntensity: 0.18 } : {}) });
}
