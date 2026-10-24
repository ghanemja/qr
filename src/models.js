// Low-poly signature models: several shapes per kind of company (about 10 units tall, built at
// the origin), plus optional moving parts (wings that flap, blades that spin, phones that fall).
// Geometry carries vertex colours; parts painted 'A'/'B' (and darker 'Ad'/'Bd') take the
// company's own two brand colours in the shader, so one geometry serves many companies.
import * as THREE from 'three';
import { mergeGeometries } from './BufferGeometryUtils.js';

const V = THREE.Vector3;
const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), col = new THREE.Color();

// ---------- geometry kit ----------
// Brand slots: the 'mask' attribute says which brand colour a vertex takes (0 = its own colour).
const BRAND = { A: 1, Ad: 2, B: 3, Bd: 4 };
// Colour a geometry (a hex, a brand slot, or fn(x, y, z, vertexIndex) returning either) and place it.
function part(geo, color, { p = [0, 0, 0], r = [0, 0, 0], s = 1, q = null } = {}) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  g.clearGroups();
  m4.compose(new V(...p), q || qt.setFromEuler(eu.set(...r)), new V(...(Array.isArray(s) ? s : [s, s, s])));
  g.applyMatrix4(m4);
  const pos = g.attributes.position, n = pos.count, arr = new Float32Array(n * 3), mask = new Float32Array(n);
  const fn = typeof color === 'function' ? color : null;
  for (let i = 0; i < n; i++) {
    const c = fn ? fn(pos.getX(i), pos.getY(i), pos.getZ(i), i) : color;
    mask[i] = BRAND[c] || 0;
    col.set(BRAND[c] ? '#ffffff' : c);
    arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  g.setAttribute('mask', new THREE.BufferAttribute(mask, 1));
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

// ---------- centerpieces (≈10 units tall) ----------
const columns = (n, x0, x1, z, h, y, color) => Array.from({ length: n }, (_, i) => part(cyl(0.34, 0.38, h, 12), color, { p: [x0 + ((x1 - x0) * i) / (n - 1), y + h / 2, z] }));
const cloud = (y, s, tone = K.white, dark = '#dfe5ec') => merge(
  [[0, 0, 0, 2.2], [2, -0.3, 0.4, 1.7], [-2.1, -0.4, -0.2, 1.8], [0.9, 0.9, -0.6, 1.6], [-0.9, 0.7, 0.8, 1.5], [3.4, -0.7, -0.3, 1.1], [-3.4, -0.7, 0.4, 1.1], [0, -0.6, 1.6, 1.4], [0.4, -0.6, -1.7, 1.4]]
    .map(([x, yy, z, r]) => part(ball(r * s, 1), (X, Y) => (Y < y - 0.4 * s ? dark : tone), { p: [x * s, y + yy * s, z * s] })),
);
const wheel = (p, r = 0.6, w = 0.45) => [part(cyl(r, r, w, 16), '#2b2b2e', { p, r: [Math.PI / 2, 0, 0] }), part(cyl(r * 0.5, r * 0.5, w + 0.04, 12), K.steel, { p, r: [Math.PI / 2, 0, 0] })];

const CENTER = {
  // A stack of cash with wings.
  bank: () => {
    const bills = [];
    for (let i = 0; i < 7; i++) bills.push(part(box(7, 0.36, 3.6), i % 2 ? K.money : '#86c788', { p: [((i * 37) % 5) * 0.06 - 0.12, 3.4 + i * 0.38, ((i * 53) % 5) * 0.06 - 0.12], r: [0, ((i * 29) % 7) * 0.012 - 0.04, 0] }));
    // A wing spreads out sideways (x) with feathers fanning backwards; it flaps about the front-back axis.
    const wing = (side) => merge(
      part(box(1.6, 0.5, 2.4), '#eef0ec', { p: [side * 0.7, 0, 0] }),
      [[6.2, 0.05], [5.4, 0.3], [4.6, 0.55], [3.6, 0.8]].map(([len, ang], i) => part(box(len, 0.2, 1.25), i % 2 ? '#ffffff' : '#f1f3f0', { p: [side * Math.cos(ang) * len * 0.5, 0.05 * i, -Math.sin(ang) * len * 0.5 - 0.2], r: [0, side * ang, 0] })),
    );
    return {
      geo: merge(bills,
        part(box(7.05, 0.5, 1.3), 'A', { p: [0, 5.15, 0] }), part(box(1.3, 2.66, 3.65), 'A', { p: [0, 4.6, 0] }),
        part(cyl(0.75, 0.75, 0.16, 20), K.gold, { p: [0, 4.7, 1.86], r: [Math.PI / 2, 0, 0] }), part(box(0.18, 0.95, 0.17), K.goldDk, { p: [0, 4.7, 1.95] }),
        part(box(5.6, 0.04, 0.9), K.moneyDk, { p: [0, 6.03, 0.9] }), part(box(5.6, 0.04, 0.9), K.moneyDk, { p: [0, 6.03, -0.9] }),
        part(box(2.2, 0.08, 1.1), K.money, { p: [4.2, 6.8, 1.8], r: [0.4, 0.5, 0.3] }), part(box(2.2, 0.08, 1.1), '#86c788', { p: [-4.4, 7.2, -1.4], r: [-0.3, 0.8, -0.4] }),
      ),
      moving: [
        { geo: wing(1), pivot: [3.4, 5.4, -0.2], axis: [0, 0, 1], mode: 'flap', amp: 0.5, speed: 5 },
        { geo: wing(-1), pivot: [-3.4, 5.4, -0.2], axis: [0, 0, -1], mode: 'flap', amp: 0.5, speed: 5 },
      ],
      hover: 0.6,
    };
  },
  payments: () => ({ geo: merge(
    part(box(3.4, 0.6, 2.4), K.dark, { p: [0, 0.3, 0] }),
    part(box(8.6, 5.4, 0.35), (x, y) => (y > 6.6 && y < 7.4 ? K.ink : 'B'), { p: [0, 3.6 + 1.4, 0], r: [-0.18, 0, 0] }),
    part(box(1.2, 0.9, 0.1), K.gold, { p: [-2.6, 5.1, 0.42], r: [-0.18, 0, 0] }),
    ring(4, (a, i) => part(box(1.2, 0.18, 0.1), '#dfe8ff', { p: [-2.2 + i * 1.5, 3.6, 0.6], r: [-0.18, 0, 0] })),
    ring(6, (a, i) => part(cyl(0.9, 0.9, 0.3, 20), i % 2 ? K.gold : K.goldDk, { p: [4.4, 0.15 + i * 0.32, 2.4] })),
    ring(4, (a, i) => part(cyl(0.9, 0.9, 0.3, 20), i % 2 ? K.gold : K.goldDk, { p: [-4.4, 0.15 + i * 0.32, 2] })),
  ) }),
  insurance: () => ({ geo: merge(
    part(cyl(0.16, 0.16, 9.4, 8), K.ink, { p: [0, 4.7, 0] }),
    part(torus(0.6, 0.15, Math.PI, 12), K.ink, { p: [0.6, 0.1, 0], r: [0, 0, Math.PI] }),
    part(cone(6, 2.4, 8), (x, y, z, i) => (Math.floor(i / 6) % 2 ? 'A' : K.white), { p: [0, 9.6, 0] }),
    part(ball(0.3, 0), K.ink, { p: [0, 10.9, 0] }),
    part(box(3, 2.2, 2.6), K.cream, { p: [-1.6, 1.1, 1.6] }), part(prism(3.6, 1.6, 3), 'Ad', { p: [-1.6, 2.2, 1.6] }),
    part(box(0.7, 1.2, 0.05), K.wood, { p: [-1.6, 0.6, 2.93] }),
  ) }),
  health: () => ({ geo: merge(
    part(cyl(3.6, 3.9, 0.7, 24), K.white, { p: [0, 0.35, 0] }),
    part(box(2.2, 6.6, 1.4), 'A', { p: [-1.2, 4, -0.5] }), part(box(6.6, 2.2, 1.4), 'A', { p: [-1.2, 4.2, -0.5] }),
    part(new THREE.CapsuleGeometry(1.1, 3.6, 6, 16), (x, y) => (x * 0.6 + y * 0.8 > 3.8 ? 'B' : K.white), { p: [2.6, 2.6, 1.6], r: [0, 0, -0.65] }),
  ) }),
  oil: () => {
    const legs = [[-2, -2], [2, -2], [2, 2], [-2, 2]];
    const H = 10, top = 0.45;
    const parts = legs.map(([x, z]) => beam([x, 0, z], [x * top / 2, H, z * top / 2], 0.28, 'A'));
    for (let lv = 1; lv <= 4; lv++) {
      const y = (lv * H) / 5, k = 1 - (1 - top / 2) * (y / H);
      for (let i = 0; i < 4; i++) {
        const [x0, z0] = legs[i], [x1, z1] = legs[(i + 1) % 4];
        parts.push(beam([x0 * k, y, z0 * k], [x1 * k, y, z1 * k], 0.16, K.white));
      }
    }
    parts.push(part(box(1.6, 0.8, 1.6), K.dark, { p: [0, H + 0.4, 0] }), part(box(5.2, 0.4, 5.2), K.steelDk, { p: [0, 0.2, 0] }));
    for (const [x, z, c] of [[3.3, 1.4, '#2f6aa3'], [3.5, -0.4, 'A'], [3.1, 2.9, '#2f6aa3']]) parts.push(part(cyl(0.7, 0.7, 1.5, 14), c, { p: [x, 0.75, z] }), part(cyl(0.72, 0.72, 0.1, 14), K.ink, { p: [x, 1.1, z] }));
    return { geo: merge(parts) };
  },
  power: () => ({
    geo: merge(
      part(cyl(0.22, 0.45, 10, 12), K.white, { p: [0, 5, 0] }), part(box(0.9, 0.8, 1.8), 'A', { p: [0, 10.2, -0.3] }),
      ring(3, (a, i) => part(box(1.6, 0.06, 1), 'B', { p: [-3 + i * 1.8, 0.7, 2.6], r: [-0.5, 0, 0] })),
      ring(3, (a, i) => part(box(0.1, 0.6, 0.1), K.steelDk, { p: [-3 + i * 1.8, 0.3, 2.6] })),
    ),
    spin: { geo: merge(part(ball(0.35, 0), K.white), ring(3, (a) => part(box(0.35, 4.6, 0.12), K.white, { p: [Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0], r: [0, 0, a - Math.PI / 2] }))), pivot: [0, 10.2, 0.75], axis: [0, 0, 1], speed: 1.2 },
  }),
  retail: () => ({ geo: merge(
    beam([-3, 2, -1.8], [3.4, 2, -1.8], 0.16, 'A'), beam([-3, 2, 1.8], [3.4, 2, 1.8], 0.16, 'A'), beam([-3, 2, -1.8], [-3, 2, 1.8], 0.16, 'A'), beam([3.4, 2, -1.8], [3.4, 2, 1.8], 0.16, 'A'),
    beam([-3.6, 5.6, -2.2], [4.2, 5.6, -2.2], 0.16, 'A'), beam([-3.6, 5.6, 2.2], [4.2, 5.6, 2.2], 0.16, 'A'), beam([-3.6, 5.6, -2.2], [-3.6, 5.6, 2.2], 0.16, 'A'), beam([4.2, 5.6, -2.2], [4.2, 5.6, 2.2], 0.16, 'A'),
    ...[-3, 3.4].flatMap((x, i) => [beam([x, 2, -1.8], [x + (i ? 0.8 : -0.6), 5.6, -2.2], 0.14, 'A'), beam([x, 2, 1.8], [x + (i ? 0.8 : -0.6), 5.6, 2.2], 0.14, 'A')]),
    ring(5, (a, i) => beam([-2 + i * 1.2, 2, -1.8], [-2.3 + i * 1.5, 5.6, -2.2], 0.08, K.white)),
    ring(5, (a, i) => beam([-2 + i * 1.2, 2, 1.8], [-2.3 + i * 1.5, 5.6, 2.2], 0.08, K.white)),
    part(box(6.4, 0.1, 3.6), '#f6d7cf', { p: [0.2, 2.05, 0] }),
    beam([-3.6, 5.6, -2.2], [-5, 6.6, -2.2], 0.16, K.dark), beam([-3.6, 5.6, 2.2], [-5, 6.6, 2.2], 0.16, K.dark), part(cyl(0.22, 0.22, 4.8, 10), K.dark, { p: [-5, 6.6, 0], r: [Math.PI / 2, 0, 0] }),
    beam([-2.6, 2, 0], [-2.6, 0.6, 0], 0.18, K.dark), beam([3, 2, 0], [3, 0.6, 0], 0.18, K.dark),
    wheel([-2.6, 0.5, -1.6], 0.5, 0.3), wheel([-2.6, 0.5, 1.6], 0.5, 0.3), wheel([3, 0.5, -1.6], 0.5, 0.3), wheel([3, 0.5, 1.6], 0.5, 0.3),
    part(box(1.8, 2.2, 1.4), K.orange, { p: [-1, 3.2, -0.6] }), part(box(1.4, 1.6, 1.2), 'B', { p: [1.2, 2.9, 0.6] }), part(box(1.6, 2.6, 0.8), K.green, { p: [2.2, 3.4, -0.8], r: [0, 0.3, 0.1] }),
  ) }),
  parcel: () => ({ geo: merge(
    part(box(5.4, 4.4, 5.4), '#c99a62', { p: [0, 2.2, 0] }), part(box(5.45, 4.42, 1), '#ead8b5', { p: [0, 2.21, 0] }),
    part(box(5.4, 0.12, 2.7), '#b98a52', { p: [0, 4.9, -3.4], r: [-0.9, 0, 0] }), part(box(5.4, 0.12, 2.7), '#b98a52', { p: [0, 4.9, 3.4], r: [0.9, 0, 0] }),
    part(box(2.7, 0.12, 5.4), '#d4a76d', { p: [-3.4, 4.9, 0], r: [0, 0, 0.9] }), part(box(2.7, 0.12, 5.4), '#d4a76d', { p: [3.4, 4.9, 0], r: [0, 0, -0.9] }),
    part(box(2.2, 2, 2.2), '#d9ab70', { p: [-0.6, 5.2, 0.4], r: [0, 0.4, 0.15] }), part(box(1.4, 1.4, 1.4), '#c58f55', { p: [1, 6.4, -0.6], r: [0.3, 0.2, 0] }), part(box(0.9, 0.9, 0.9), '#e2bb84', { p: [0.2, 7.6, 0.5], r: [0.1, 0.8, 0.3] }),
    part(box(3, 2, 1.8), K.white, { p: [4.4, 1.3, 3.4] }), part(box(1.2, 1.4, 1.8), 'B', { p: [6.4, 1, 3.4] }), part(box(0.05, 0.7, 1.4), '#9dd0f2', { p: [7.02, 1.3, 3.4] }),
    wheel([4, 0.4, 2.5], 0.4, 0.3), wheel([4, 0.4, 4.3], 0.4, 0.3), wheel([6.3, 0.4, 2.5], 0.4, 0.3), wheel([6.3, 0.4, 4.3], 0.4, 0.3),
  ) }),
  car: () => ({
    geo: merge(part(cyl(5.4, 5.6, 0.6, 32), K.steelDk, { p: [0, 0.3, 0] })),
    spin: { geo: merge(
      part(cyl(5, 5, 0.25, 32), K.dark, { p: [0, 0.72, 0] }),
      part(box(7.6, 1.5, 3.4), 'A', { p: [0, 2.05, 0] }), part(box(4.2, 1.4, 3.1), 'A', { p: [-0.4, 3.45, 0] }),
      part(box(4.25, 1, 3.15), '#2c3e55', { p: [-0.4, 3.5, 0] }), part(box(4.4, 0.12, 3.2), 'A', { p: [-0.4, 4.15, 0] }),
      part(box(0.1, 0.35, 0.6), K.yellow, { p: [3.82, 2.3, 1.1] }), part(box(0.1, 0.35, 0.6), K.yellow, { p: [3.82, 2.3, -1.1] }),
      part(box(0.1, 0.3, 0.5), 'Ad', { p: [-3.82, 2.3, 1.2] }), part(box(0.1, 0.3, 0.5), 'Ad', { p: [-3.82, 2.3, -1.2] }),
      wheel([2.4, 1.45, 1.75], 0.8, 0.5), wheel([2.4, 1.45, -1.75], 0.8, 0.5), wheel([-2.4, 1.45, 1.75], 0.8, 0.5), wheel([-2.4, 1.45, -1.75], 0.8, 0.5),
    ), pivot: [0, 0, 0], axis: [0, 1, 0], speed: 0.35 },
  }),
  plane: () => ({
    geo: merge(part(cyl(0.9, 1.2, 6, 12), K.white, { p: [0, 3, 0] }), part(cyl(1.6, 1.4, 1.2, 10), '#7fc3ea', { p: [0, 6.6, 0] }), part(cone(1.7, 0.8, 10), K.white, { p: [0, 7.6, 0] }), part(cyl(0.05, 0.05, 1.4, 6), 'A', { p: [0, 8.6, 0] })),
    spin: { geo: merge(
      part(new THREE.CapsuleGeometry(0.75, 6, 6, 14), K.white, { p: [4.6, 9, 0], r: [Math.PI / 2, 0, 0] }),
      part(box(7.4, 0.14, 1.6), '#e8edf3', { p: [4.6, 8.8, 0.2] }), part(box(2.8, 0.12, 0.9), '#e8edf3', { p: [4.6, 9.1, -3.2] }),
      part(box(0.14, 1.6, 1.2), 'B', { p: [4.6, 9.9, -3.3] }),
      part(cyl(0.38, 0.38, 1.2, 12), K.steel, { p: [2.6, 8.5, 0.5], r: [Math.PI / 2, 0, 0] }), part(cyl(0.38, 0.38, 1.2, 12), K.steel, { p: [6.6, 8.5, 0.5], r: [Math.PI / 2, 0, 0] }),
      ring(7, (a, i) => part(box(0.04, 0.22, 0.26), K.ink, { p: [5.37, 9.15, 2.2 - i * 0.6] })),
      part(cone(0.75, 1.1, 14), 'B', { p: [4.6, 9, 3.55], r: [Math.PI / 2, 0, 0] }),
    ), pivot: [0, 0, 0], axis: [0, 1, 0], speed: -0.45 },
  }),
  casino: () => ({ geo: merge(
    part(box(4, 4, 4), K.white, { p: [-1.4, 2.4, -0.4], r: [0.3, 0.5, 0.2] }),
    [[-1.4, 4.65, -0.4], [-0.6, 4.6, 0.4], [-2.2, 4.7, -1.2]].map((p) => part(ball(0.32, 1), 'A', { p })),
    part(box(3, 3, 3), 'A', { p: [2.4, 1.5, 1.4], r: [0, -0.4, 0] }),
    [[2.4, 3.05, 1.4], [1.7, 3.05, 0.8], [3.1, 3.05, 2]].map((p) => part(ball(0.26, 1), K.white, { p })),
    ring(9, (a, i) => part(cyl(1.1, 1.1, 0.32, 20), i % 3 === 0 ? K.ink : i % 3 === 1 ? 'A' : 'B', { p: [-3.6, 0.16 + i * 0.34, 3] })),
    ring(5, (a, i) => part(cyl(1.1, 1.1, 0.32, 20), i % 2 ? K.green : K.ink, { p: [3.6, 0.16 + i * 0.34, -3] })),
  ) }),
  rocket: () => ({ geo: merge(
    part(cyl(3.4, 3.8, 0.8, 20), K.steelDk, { p: [0, 0.4, 0] }),
    part(cyl(1.25, 1.35, 7, 20), K.white, { p: [0, 4.9, 0] }), part(cone(1.25, 2.8, 20), 'A', { p: [0, 9.8, 0] }),
    part(cyl(0.5, 0.5, 0.15, 16), '#7fc3ea', { p: [0, 6.8, 1.25], r: [Math.PI / 2, 0, 0] }), part(cyl(1.27, 1.27, 0.4, 20), 'A', { p: [0, 4, 0] }),
    ring(4, (a) => part(extrude([[0, 0], [1.6, 0], [0, 2.4]], 0.18), 'A', { p: [Math.cos(a) * 1.2, 1.5, Math.sin(a) * 1.2], r: [0, -a, 0] })),
    part(cone(0.9, 1, 16), K.dark, { p: [0, 1.1, 0], r: [Math.PI, 0, 0] }),
    part(ball(1, 1), K.orange, { p: [0, 0.7, 0], s: [1, 0.6, 1] }),
    beam([3, 0.8, -1], [3, 9, -1], 0.3, K.steel), beam([3, 0.8, 1], [3, 9, 1], 0.3, K.steel), ring(5, (a, i) => beam([3, 1.5 + i * 1.6, -1], [3, 2.3 + i * 1.6, 1], 0.12, K.steel)),
    ring(5, (a) => part(ball(0.9, 1), '#eeeae4', { p: [Math.cos(a) * 2.6, 1, Math.sin(a) * 2.6] })),
  ) }),
  chip: () => ({
    geo: merge(part(box(8, 0.5, 8), '#2f6b4a', { p: [0, 0.25, 0] }), ring(10, (a, i) => part(box(0.12, 0.52, 3.6), K.gold, { p: [-3.6 + i * 0.8, 0.26, i % 2 ? 2.2 : -2.2] })), part(cyl(0.5, 0.7, 2.4, 12), K.steel, { p: [0, 1.7, 0] })),
    spin: { geo: merge(
      part(box(5, 0.6, 5), 'A', { p: [0, 3.6, 0] }), part(box(3, 0.3, 3), '#c9ccd2', { p: [0, 4.05, 0] }), part(box(1.4, 0.32, 1.4), K.gold, { p: [0, 4.1, 0] }),
      ...[-1, 1].flatMap((sgn) => ring(8, (a, i) => [part(box(0.22, 0.12, 0.8), K.gold, { p: [-2.1 + i * 0.6, 3.5, sgn * 2.8] }), part(box(0.8, 0.12, 0.22), K.gold, { p: [sgn * 2.8, 3.5, -2.1 + i * 0.6] })])),
    ), pivot: [0, 0, 0], axis: [0, 1, 0], speed: 0.4 },
  }),
  computer: () => ({ geo: merge(
    part(box(8, 0.4, 5.4), 'A', { p: [0, 0.2, 0] }), part(box(6.8, 0.1, 2.6), K.dark, { p: [0, 0.42, -0.6] }), part(box(2.4, 0.06, 1.4), '#b3b9c2', { p: [0, 0.42, 1.6] }),
    part(box(8, 5.2, 0.3), 'A', { p: [0, 2.8, -2.9], r: [-0.22, 0, 0] }), part(box(7.4, 4.6, 0.05), (x, y) => (y > 3.6 ? '#7cc0ff' : 'B'), { p: [0, 2.85, -2.7], r: [-0.22, 0, 0] }),
    part(box(2.2, 1.4, 0.06), K.white, { p: [-1.8, 3.6, -2.6], r: [-0.22, 0, 0] }), part(box(2.2, 0.4, 0.06), K.yellow, { p: [1.6, 3.9, -2.65], r: [-0.22, 0, 0] }), part(box(2.2, 0.4, 0.06), K.white, { p: [1.6, 3.2, -2.5], r: [-0.22, 0, 0] }),
  ) }),
  software: () => ({ geo: merge(
    cloud(8, 1.15), ring(5, (a, i) => part(cyl(0.08, 0.08, 6.4, 6), i % 2 ? 'A' : 'B', { p: [-2.4 + i * 1.2, 3.6, (i % 3) - 1] })),
    part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }), part(cyl(2.2, 2.2, 0.52, 24), 'B', { p: [0, 0.27, 0] }),
  ) }),
  // A storm cloud raining phones and headsets onto an old telephone.
  comms: () => {
    const phone = () => merge(part(box(1.5, 0.25, 2.9), K.ink), part(box(1.25, 0.26, 2.4), '#7cc0ff', { p: [0, 0.01, -0.06] }));
    const headset = () => merge(part(torus(1.1, 0.18, Math.PI, 16), K.ink), part(cyl(0.55, 0.55, 0.45, 14), 'A', { p: [1.1, -0.05, 0], r: [0, 0, Math.PI / 2] }), part(cyl(0.55, 0.55, 0.45, 14), 'A', { p: [-1.1, -0.05, 0], r: [0, 0, Math.PI / 2] }));
    const drops = [[-2.6, 0.4, phone], [1.8, 1.2, headset], [0.2, -1.8, phone], [3.4, -0.8, phone], [-1.2, 2.2, headset], [-3.6, -1.4, headset], [2.4, 2.6, phone]];
    return {
      geo: merge(
        cloud(10.5, 1.25, '#f3f5f8', '#b9c3cf'),
        part(box(3.6, 1.4, 2.4), 'A', { p: [0, 0.7, 0] }), part(cyl(1, 1, 0.3, 16), K.white, { p: [0, 1.45, 0.3] }),
        part(cyl(0.4, 0.4, 3.4, 10), 'A', { p: [0, 2.1, -0.6], r: [0, 0, Math.PI / 2] }), part(box(0.9, 0.6, 1), 'A', { p: [1.6, 2.2, -0.6] }), part(box(0.9, 0.6, 1), 'A', { p: [-1.6, 2.2, -0.6] }),
      ),
      moving: drops.map(([x, z, make], i) => ({ geo: make(), pivot: [x, 9, z], axis: [1, 0.3, 0.2], mode: 'drop', drop: 8.2, speed: 0.35, phase: i / drops.length })),
    };
  },
  social: () => ({ geo: merge(
    part(box(3.6, 7.2, 0.5), K.ink, { p: [-0.8, 3.8, 0], r: [-0.1, 0.2, 0] }), part(box(3.2, 6.2, 0.05), (x, y) => (y > 5.8 ? '#8fb7ff' : '#dfe8ff'), { p: [-0.75, 3.85, 0.28], r: [-0.1, 0.2, 0] }),
    part(box(3.2, 2, 0.5), K.white, { p: [2.4, 7.6, 1] }), part(cone(0.4, 0.8, 4), K.white, { p: [1.4, 6.4, 1], r: [Math.PI, 0, 0] }),
    part(ball(0.75, 1), 'A', { p: [2.8, 4.6, 1.6] }), part(ball(0.75, 1), 'A', { p: [3.9, 4.6, 1.6] }), part(cone(1.1, 1.4, 4), 'A', { p: [3.35, 3.6, 1.6], r: [Math.PI, Math.PI / 4, 0] }),
    part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }),
  ) }),
  media: () => ({ geo: merge(
    beam([0, 5, 0], [-2.2, 0, -1.4], 0.22, K.dark), beam([0, 5, 0], [2.2, 0, -1.4], 0.22, K.dark), beam([0, 5, 0], [0, 0, 2.4], 0.22, K.dark),
    part(box(3.6, 2.4, 2), K.ink, { p: [0, 6.2, 0] }), part(cyl(0.8, 1.1, 1.6, 16), K.dark, { p: [0, 6.2, 1.8], r: [Math.PI / 2, 0, 0] }), part(cyl(0.7, 0.7, 0.1, 16), '#7cc0ff', { p: [0, 6.2, 2.62], r: [Math.PI / 2, 0, 0] }),
    part(cyl(1.4, 1.4, 0.4, 20), K.dark, { p: [-0.9, 8.6, 0], r: [0, 0, Math.PI / 2] }), part(cyl(1.1, 1.1, 0.4, 20), K.dark, { p: [1.3, 8.4, 0], r: [0, 0, Math.PI / 2] }),
    part(cyl(0.4, 0.4, 0.42, 10), K.steel, { p: [-0.9, 8.6, 0], r: [0, 0, Math.PI / 2] }), part(cyl(0.3, 0.3, 0.42, 10), K.steel, { p: [1.3, 8.4, 0], r: [0, 0, Math.PI / 2] }),
    part(box(3.4, 0.5, 2.4), (x, y, z, i) => (Math.floor(x + 10) % 2 ? K.ink : K.white), { p: [3.2, 0.7, 2.6], r: [0, 0.3, 0] }), part(box(3.4, 0.5, 2.4), K.ink, { p: [3.2, 1.4, 2.2], r: [-0.5, 0.3, 0] }),
    part(cyl(1.2, 0.9, 2, 12), (x, y) => (Math.floor(y * 2) % 2 ? 'A' : K.white), { p: [-3.4, 1, 2.4] }), part(ball(1.1, 1), K.cream, { p: [-3.4, 2.2, 2.4] }),
  ) }),
  food: () => ({ geo: merge(
    part(cyl(3.1, 3, 1, 24), '#e2a65a', { p: [0, 0.5, 0] }), part(cyl(3.35, 3.35, 0.9, 24), '#6b3b22', { p: [0, 1.45, 0] }),
    part(box(4.6, 0.18, 4.6), '#f6c443', { p: [0, 2, 0], r: [0, Math.PI / 4, 0] }), part(cyl(3.5, 3.5, 0.25, 12), '#6cbf4b', { p: [0, 2.2, 0] }), part(cyl(3.1, 3.1, 0.3, 24), 'A', { p: [0, 2.45, 0] }),
    part(new THREE.SphereGeometry(3.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#e8ad5f', { p: [0, 2.6, 0], s: [1, 0.75, 1] }),
    ring(12, (a, i) => part(ball(0.16, 0), K.cream, { p: [Math.cos(a) * (1 + (i % 3) * 0.6), 4.5 - (i % 3) * 0.35, Math.sin(a) * (1 + (i % 3) * 0.6)], s: [1.5, 0.6, 1] })),
    part(box(2, 2.4, 1.4), 'A', { p: [4.4, 1.2, 2.2], r: [0, -0.3, 0] }), ring(7, (a, i) => part(box(0.22, 2, 0.22), '#f3c443', { p: [3.8 + (i % 4) * 0.35, 2.9, 1.8 + (i % 2) * 0.5], r: [0.1 * (i % 3), 0, 0.12 * ((i % 2) * 2 - 1)] })),
  ) }),
  drink: () => ({ geo: merge(
    part(cyl(2.4, 1.8, 7.4, 24), (x, y) => (y > 2.6 && y < 4.4 ? K.white : 'A'), { p: [0, 3.7, 0] }),
    part(cyl(2.55, 2.55, 0.5, 24), K.white, { p: [0, 7.6, 0] }), part(cyl(1.4, 1.4, 0.55, 24), '#eef0f2', { p: [0, 7.7, 0] }),
    part(cyl(0.2, 0.2, 5, 10), (x, y) => (Math.floor(y * 1.6) % 2 ? 'A' : K.white), { p: [0.8, 9.6, 0], r: [0, 0, -0.35] }),
    ring(5, (a) => part(box(1, 1, 1), '#d6eef9', { p: [Math.cos(a) * 3.4, 0.5, Math.sin(a) * 3.4], r: [0.4, a, 0.2] })),
  ) }),
  care: () => ({ geo: merge(
    part(cyl(2, 2.2, 6, 20), 'A', { p: [0, 3, 0] }), part(cyl(2.05, 2.05, 2.2, 20), K.white, { p: [0, 3, 0] }),
    part(cyl(0.8, 0.9, 1, 14), K.white, { p: [0, 6.5, 0] }), part(cyl(0.25, 0.25, 1.4, 8), K.white, { p: [0, 7.6, 0] }), part(box(2, 0.5, 0.6), K.white, { p: [0.7, 8.3, 0] }),
    part(cyl(1.2, 1.3, 3.4, 16), 'B', { p: [3.4, 1.7, 1.4] }), part(cyl(0.7, 0.7, 0.8, 12), K.white, { p: [3.4, 3.8, 1.4] }),
  ) }),
  farm: () => ({ geo: merge(
    part(box(6, 4.6, 5), 'A', { p: [-1, 2.3, 0] }), part(prism(6.8, 2.8, 5.4), '#6f2a22', { p: [-1, 4.6, 0], r: [0, Math.PI / 2, 0], s: [0.8, 1, 1.25] }),
    part(box(2.2, 3, 0.1), K.white, { p: [-1, 1.5, 2.55] }), beam([-2.1, 0, 2.62], [0.1, 3, 2.62], 0.15, 'A'), beam([0.1, 0, 2.62], [-2.1, 3, 2.62], 0.15, 'A'),
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
      spin: { geo: gear(3.6, 16, 1, 'A'), pivot: [0, 6.2, 0.2], axis: [0, 0, 1], speed: 0.5 },
    };
  },
  chem: () => ({ geo: merge(
    part(cyl(1, 3.4, 5, 20), '#cfe9f2', { p: [0, 2.5, 0] }), part(cyl(0.95, 0.95, 2.6, 16), '#cfe9f2', { p: [0, 6.3, 0] }), part(cyl(1.15, 1.15, 0.4, 16), '#e6f4f8', { p: [0, 7.6, 0] }),
    part(cyl(1.8, 3.1, 2.6, 20), 'A', { p: [0, 1.4, 0] }),
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
    part(box(6, 4, 5), K.cream, { p: [0, 2, 0] }), part(prism(7, 3, 5.6), 'A', { p: [0, 4, 0] }), part(box(0.8, 2, 0.8), '#b0643c', { p: [1.8, 5.4, -1] }),
    part(box(1.2, 2.2, 0.1), K.wood, { p: [0, 1.1, 2.52] }), part(box(1.2, 1, 0.1), '#9dd0f2', { p: [-1.9, 2.4, 2.52] }), part(box(1.2, 1, 0.1), '#9dd0f2', { p: [1.9, 2.4, 2.52] }),
    part(cyl(0.12, 0.12, 2.6, 6), K.wood, { p: [4.4, 1.3, 2.6] }), part(box(1.8, 1.1, 0.1), 'A', { p: [4.4, 2.4, 2.6] }),
    part(ball(1, 1), K.green, { p: [-4.2, 1.4, 1.8] }), part(cyl(0.15, 0.2, 0.8, 6), K.wood, { p: [-4.2, 0.4, 1.8] }),
  ) }),
  // An assistant you talk to: a chat bubble with a glowing spark.
  ai: () => {
    const W = 8, H = 5.2, D = 1.4, r = 1.1, y0 = 3.2;
    const bubble = merge(
      part(box(W - 2 * r, H, D), K.cream, { p: [0, y0 + H / 2, 0] }), part(box(W, H - 2 * r, D), K.cream, { p: [0, y0 + H / 2, 0] }),
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => part(cyl(r, r, D, 16), K.cream, { p: [sx * (W / 2 - r), y0 + H / 2 + sy * (H / 2 - r), 0], r: [Math.PI / 2, 0, 0] })),
      part(extrude([[0, 0], [1.6, 0], [-0.4, -1.6]], D * 0.9), K.cream, { p: [-1.8, y0 + 0.05, 0] }),
      [2.0, 0.9].map((w, i) => part(box(w * 2.4, 0.42, 0.1), i ? '#c9bfae' : '#b3a893', { p: [-2.6 + w * 1.2, y0 + H - 1.5 - i * 1.0, D / 2 + 0.04] })),
    );
    const ray = (a, len, w) => part(box(w, len, w * 0.9), K.orange, { p: [Math.cos(a) * len / 2, Math.sin(a) * len / 2, 0], r: [0, 0, a - Math.PI / 2] });
    return {
      geo: merge(bubble, part(cyl(2.4, 2.8, 0.6, 24), K.white, { p: [0, 0.3, 0] }), part(cyl(0.35, 0.45, 2.6, 10), K.steel, { p: [0, 1.6, 0] })),
      moving: [{ geo: merge(ring(8, (a, i) => ray(a, i % 2 ? 2.1 : 3.1, 0.6)), part(ball(0.75, 1), '#ffb38a')), pivot: [2.2, y0 + H / 2 - 0.2, D / 2 + 0.7], axis: [0, 0, 1], mode: 'spin', speed: 0.5 }],
    };
  },
  // Search: a magnifying glass.
  search: () => ({ geo: merge(
    part(cyl(3, 3.3, 0.6, 28), K.white, { p: [0, 0.3, 0] }),
    part(torus(2.8, 0.55, Math.PI * 2, 36), 'A', { p: [0, 6.6, 0], r: [0, 0, 0] }), part(cyl(2.5, 2.5, 0.2, 28), '#cfe9f7', { p: [0, 6.6, 0], r: [Math.PI / 2, 0, 0] }),
    part(box(0.9, 0.3, 0.1), '#ffffff', { p: [-0.9, 7.6, 0.12], r: [0, 0, 0.6] }),
    part(cyl(0.55, 0.65, 4, 14), K.ink, { p: [0, 2.4, 0] }), part(cyl(0.7, 0.7, 0.5, 14), 'B', { p: [0, 3.6, 0] }), part(cyl(0.56, 0.66, 1.2, 14), 'Ad', { p: [0, 2.6, 0] }),
  ), hover: 0.25 }),
  // A VR headset.
  vr: () => ({ geo: merge(
    part(box(7, 3.4, 3), K.ink, { p: [0, 5, 0] }), part(box(6.4, 2.8, 0.2), 'A', { p: [0, 5, 1.55] }), part(box(5.6, 0.25, 0.25), '#7cc0ff', { p: [0, 5.6, 1.66] }),
    part(box(7.2, 3.6, 0.6), '#cfd5dc', { p: [0, 5, -1.6] }), part(cyl(0.9, 0.9, 0.4, 16), '#2b2f36', { p: [-1.6, 5, -2], r: [Math.PI / 2, 0, 0] }), part(cyl(0.9, 0.9, 0.4, 16), '#2b2f36', { p: [1.6, 5, -2], r: [Math.PI / 2, 0, 0] }),
    part(torus(3.6, 0.3, Math.PI, 24), K.dark, { p: [0, 5, -1.9], r: [Math.PI / 2, 0, 0] }), part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }),
  ), hover: 0.5 }),
  // Databricks: a stack of bricks.
  bricks: () => {
    const parts = [part(box(8.4, 0.4, 5.4), K.stoneDk, { p: [0, 0.2, 0] })];
    for (let layer = 0; layer < 5; layer++) {
      const w = 4 - Math.floor(layer / 1.5), off = (layer % 2) * 0.9;
      for (let i = 0; i < w; i++) for (let j = 0; j < 2; j++) parts.push(part(box(1.75, 0.9, 1.75), ['#d4583a', '#c24a30', '#e06a45'][(i + j + layer) % 3], { p: [(i - (w - 1) / 2) * 1.85 + (layer % 2 ? 0.2 : 0), 0.85 + layer * 0.95, (j - 0.5) * 1.85 + off * 0.1] }));
    }
    return { geo: merge(parts) };
  },
  robot: () => ({ geo: merge(
    part(box(1, 3, 1.2), K.steel, { p: [-1, 1.5, 0] }), part(box(1, 3, 1.2), K.steel, { p: [1, 1.5, 0] }), part(box(1.3, 0.5, 1.8), K.dark, { p: [-1, 0.25, 0.2] }), part(box(1.3, 0.5, 1.8), K.dark, { p: [1, 0.25, 0.2] }),
    part(box(4, 3.6, 2.4), K.white, { p: [0, 4.9, 0] }), part(box(2.2, 1.4, 0.1), '#7cc0ff', { p: [0, 5.2, 1.22] }),
    beam([-2.1, 6.2, 0], [-3.2, 3.6, 0.6], 0.6, K.steel), beam([2.1, 6.2, 0], [3.4, 8, 0.6], 0.6, K.steel), part(ball(0.55, 1), 'A', { p: [-3.3, 3.4, 0.6] }), part(ball(0.55, 1), 'A', { p: [3.5, 8.2, 0.6] }), part(box(4.05, 0.5, 2.45), 'B', { p: [0, 3.4, 0] }),
    part(box(2.8, 2.2, 2.2), K.white, { p: [0, 7.9, 0] }), part(box(2.2, 0.8, 0.1), K.ink, { p: [0, 8, 1.12] }), part(ball(0.22, 1), '#7cf0ff', { p: [-0.5, 8, 1.2] }), part(ball(0.22, 1), '#7cf0ff', { p: [0.5, 8, 1.2] }),
    part(cyl(0.06, 0.06, 1.2, 6), K.dark, { p: [0, 9.6, 0] }), part(ball(0.25, 1), 'A', { p: [0, 10.3, 0] }),
  ) }),
  tree: () => {
    const bark = '#7a5233';
    const parts = [part(cyl(0.9, 1.5, 9, 9), bark, { p: [0, 4.5, 0] })];
    ring(7, (a, i) => parts.push(beam([0, 5.5 + (i % 3) * 0.8, 0], [Math.cos(a) * 4.2, 8.6 + (i % 2) * 0.8, Math.sin(a) * 4.2], 0.4, bark)));
    const greens = ['#7cc456', '#5fae45', '#94d26a', '#4f9a3c', '#86cc5f'];
    ring(7, (a, i) => parts.push(part(ball(2.1, 0), greens[i % 5], { p: [Math.cos(a) * 4.2, 9.4 + (i % 2) * 0.8, Math.sin(a) * 4.2] })));
    ring(5, (a, i) => parts.push(part(ball(2.4, 0), greens[(i + 2) % 5], { p: [Math.cos(a + 0.6) * 2, 11.4, Math.sin(a + 0.6) * 2] })));
    parts.push(part(ball(2.6, 0), greens[1], { p: [0, 12.8, 0] }));
    return { geo: merge(parts) };
  },
};

// ---------- extra shapes, so companies of the same kind look different ----------
// Wings (feathers fanning back), mounted at ±x; returned as two flapping parts.
const wingGeo = (side, k = 1) => merge(
  part(box(1.6 * k, 0.5 * k, 2.4 * k), '#eef0ec', { p: [side * 0.7 * k, 0, 0] }),
  [[6.2, 0.05], [5.4, 0.3], [4.6, 0.55], [3.6, 0.8]].map(([len, ang], i) => part(box(len * k, 0.2 * k, 1.25 * k), i % 2 ? '#ffffff' : '#f1f3f0', { p: [side * Math.cos(ang) * len * k * 0.5, 0.05 * i * k, (-Math.sin(ang) * len * 0.5 - 0.2) * k], r: [0, side * ang, 0] })),
);
const winged = (x, y, z = 0, k = 1) => [1, -1].map((side) => ({ geo: wingGeo(side, k), pivot: [side * x, y, z], axis: [0, 0, side], mode: 'flap', amp: 0.5, speed: 5 }));
const plinth = (r, h = 0.6) => [part(cyl(r, r * 1.05, h, 28), K.white, { p: [0, h / 2, 0] }), part(cyl(r * 1.06, r * 1.08, h * 0.35, 28), 'B', { p: [0, h * 0.18, 0] })];
const tire = (p, r = 0.8, w = 0.5, hub = K.steel) => [part(cyl(r, r, w, 16), '#2b2b2e', { p, r: [Math.PI / 2, 0, 0] }), part(cyl(r * 0.5, r * 0.5, w + 0.04, 12), hub, { p, r: [Math.PI / 2, 0, 0] })];

const EXTRA = {
  bank: [
    // Winged gold bars.
    () => {
      const bar = (x, y, z) => part(cyl(0.95, 1.3, 0.85, 4), K.gold, { p: [x, y, z], r: [0, Math.PI / 4, 0], s: [1.9, 1, 0.95] });
      return {
        geo: merge(bar(-2.7, 3.4, 0), bar(0, 3.4, 0), bar(2.7, 3.4, 0), bar(-1.35, 4.25, 0), bar(1.35, 4.25, 0), bar(0, 5.1, 0),
          part(box(0.5, 2.6, 2.8), 'A', { p: [0, 4.2, 0] }), part(box(7.6, 0.5, 0.5), 'A', { p: [0, 4.6, 1.3] })),
        moving: winged(4.2, 4.4, -0.2, 0.9),
        hover: 0.6,
      };
    },
    // A vault door with a spinning wheel.
    () => ({
      geo: merge(part(box(9, 0.6, 4), K.dark, { p: [0, 0.3, 0] }), part(box(8, 8.4, 1.2), '#8d96a1', { p: [0, 4.8, -0.4] }),
        part(cyl(3.3, 3.3, 0.8, 32), '#c3c9d0', { p: [0, 4.8, 0.5], r: [Math.PI / 2, 0, 0] }), part(torus(3.3, 0.28, Math.PI * 2, 40), 'A', { p: [0, 4.8, 0.95] }),
        ring(10, (a) => part(cyl(0.18, 0.18, 0.3, 8), K.steelDk, { p: [Math.cos(a) * 2.6, 4.8 + Math.sin(a) * 2.6, 1], r: [Math.PI / 2, 0, 0] })),
        ring(5, (a, i) => part(cyl(0.8, 0.8, 0.3, 18), i % 2 ? K.gold : K.goldDk, { p: [5, 0.75 + i * 0.32, 1.4] })), ring(3, (a, i) => part(cyl(0.8, 0.8, 0.3, 18), K.gold, { p: [-5, 0.75 + i * 0.32, 1.6] }))),
      moving: [{ geo: merge(part(torus(1.2, 0.16, Math.PI * 2, 28), 'B'), ring(3, (a) => part(box(0.22, 2.4, 0.22), 'B', { r: [0, 0, a] })), part(cyl(0.4, 0.4, 0.4, 12), 'Bd', { r: [Math.PI / 2, 0, 0] })), pivot: [0, 4.8, 1.3], axis: [0, 0, 1], mode: 'spin', speed: 0.6 }],
    }),
    // A piggy bank with a coin dropping in.
    () => ({
      geo: merge(part(ball(3, 2), 'A', { p: [0, 4.2, 0], s: [1.3, 1, 1] }), part(cyl(1, 1.1, 0.9, 18), 'Ad', { p: [4.2, 4.2, 0], r: [0, 0, Math.PI / 2] }),
        part(ball(0.18, 0), K.ink, { p: [4.7, 4.4, 0.4] }), part(ball(0.18, 0), K.ink, { p: [4.7, 4.4, -0.4] }), part(ball(0.28, 0), K.ink, { p: [3.1, 5.4, 1.5] }), part(ball(0.28, 0), K.ink, { p: [3.1, 5.4, -1.5] }),
        part(cone(0.8, 1.4, 4), 'Ad', { p: [2.2, 6.8, 1.4] }), part(cone(0.8, 1.4, 4), 'Ad', { p: [2.2, 6.8, -1.4] }),
        [[2, 1.4], [2, -1.4], [-2, 1.4], [-2, -1.4]].map(([x, z]) => part(cyl(0.6, 0.6, 1.8, 12), 'Ad', { p: [x, 0.9, z] })),
        part(box(1.6, 0.2, 0.35), K.ink, { p: [0, 7.2, 0] }), part(torus(0.4, 0.1, Math.PI * 1.5, 12), 'Ad', { p: [-4, 4.6, 0] })),
      moving: [{ geo: merge(part(cyl(0.7, 0.7, 0.18, 20), K.gold, { r: [Math.PI / 2, 0, 0] })), pivot: [0, 10, 0], axis: [0, 1, 0], mode: 'drop', drop: 2.8, speed: 0.45 }],
    }),
    // A charging bull.
    () => ({ geo: merge(
      part(box(9.5, 1.2, 4.2), 'B', { p: [0, 0.6, 0] }), part(box(9.7, 0.2, 4.4), 'Bd', { p: [0, 1.25, 0] }),
      part(box(6, 2.8, 2.6), '#9a6b3c', { p: [-0.3, 4.4, 0], r: [0, 0, -0.08] }), part(box(2.4, 2.4, 2.8), '#8a5d33', { p: [1.8, 5.1, 0] }),
      part(box(2, 2, 2), '#8a5d33', { p: [3.6, 4.1, 0], r: [0, 0, -0.5] }), part(box(1, 0.8, 1.4), '#6f4a2c', { p: [4.4, 3.4, 0], r: [0, 0, -0.5] }),
      part(cone(0.32, 2, 8), '#efe3c6', { p: [3.6, 5.3, 1.4], r: [0.9, 0, -0.6] }), part(cone(0.32, 2, 8), '#efe3c6', { p: [3.6, 5.3, -1.4], r: [-0.9, 0, -0.6] }),
      [[2, 0.9, 0.25], [2.2, -0.9, -0.25], [-2.4, 0.9, -0.3], [-2.6, -0.9, 0.35]].map(([x, z, lean]) => part(box(0.8, 2.6, 0.8), '#8a5d33', { p: [x, 2.5, z], r: [0, 0, lean] })),
      beam([-3.2, 5.2, 0], [-4.6, 6.6, 0], 0.25, '#8a5d33'),
    ) }),
    // A columned bank.
    () => ({ geo: merge(
      part(box(9, 0.5, 7), K.stoneDk, { p: [0, 0.25, 0] }), part(box(8.2, 0.5, 6.2), K.stone, { p: [0, 0.75, 0] }), part(box(7.4, 0.4, 5.4), K.stoneDk, { p: [0, 1.2, 0] }),
      part(box(6.2, 4.4, 3.6), '#e4d8c2', { p: [0, 3.6, -0.6] }),
      ring(6, (a, i) => part(cyl(0.34, 0.38, 4.4, 12), K.white, { p: [-3.2 + i * 1.28, 3.6, 2.1] })), ring(6, (a, i) => part(cyl(0.34, 0.38, 4.4, 12), K.white, { p: [-3.2 + i * 1.28, 3.6, -2.1] })),
      part(box(7.8, 0.7, 5.6), 'A', { p: [0, 6.15, 0] }),
      part(prism(8.2, 2, 5.8), K.stone, { p: [0, 6.5, 0], r: [0, Math.PI / 2, 0], s: [0.71, 1, 1.41] }),
      part(cyl(0.75, 0.75, 0.25, 20), K.gold, { p: [0, 7.15, 2.95], r: [Math.PI / 2, 0, 0] }),
      part(box(1.6, 2.6, 0.2), 'B', { p: [0, 2.7, 1.25] }),
    ) }),
    // A stagecoach.
    () => ({ geo: merge(
      part(box(5.2, 3.2, 3), 'A', { p: [0, 3.6, 0] }), part(box(5.6, 0.35, 3.4), 'Ad', { p: [0, 5.35, 0] }), part(box(5.4, 0.3, 3.2), 'B', { p: [0, 2.1, 0] }),
      part(box(1.6, 1.2, 0.1), '#2c3e55', { p: [-1.2, 4.2, 1.52] }), part(box(1.6, 1.2, 0.1), '#2c3e55', { p: [1.2, 4.2, 1.52] }),
      part(box(1.2, 0.8, 1), K.wood, { p: [-1.2, 5.9, 0] }), part(box(1.4, 0.7, 1.2), K.woodDk, { p: [0.6, 5.85, 0.2] }),
      part(box(1.8, 0.3, 2.6), K.woodDk, { p: [3.4, 4.4, 0] }), beam([4.2, 2, 0.8], [7.4, 1.6, 0.8], 0.18, K.woodDk), beam([4.2, 2, -0.8], [7.4, 1.6, -0.8], 0.18, K.woodDk),
      [[1.9, 1.75], [1.9, -1.75], [-1.9, 1.75], [-1.9, -1.75]].flatMap(([x, z]) => [part(torus(1.25, 0.14, Math.PI * 2, 24), 'Bd', { p: [x, 1.4, z] }), ring(6, (a) => part(box(0.1, 2.4, 0.1), 'B', { p: [x, 1.4, z], r: [0, 0, a] }))]),
    ) }),
  ],
  payments: [
    // A wallet stuffed with cards.
    () => ({ geo: merge(part(box(7.4, 1.8, 4.8), '#6b4f3a', { p: [0, 0.9, 0] }), part(box(7.5, 0.12, 4.9), '#8a6a4e', { p: [0, 1.8, 0] }),
      part(box(5.6, 3.6, 0.18), 'A', { p: [-0.8, 3.2, -0.6], r: [0, 0, 0.12] }), part(box(5.6, 3.6, 0.18), 'B', { p: [0.4, 3.4, 0.2], r: [0, 0, -0.08] }), part(box(5.6, 3.6, 0.18), K.gold, { p: [1.4, 3.1, 1], r: [0, 0, -0.2] }),
      part(box(0.9, 0.7, 0.05), K.gold, { p: [-2.2, 3.8, -0.48], r: [0, 0, 0.12] }), ring(4, (a, i) => part(cyl(0.8, 0.8, 0.28, 18), K.gold, { p: [5, 0.15 + i * 0.3, 1.8] }))) }),
    // A credit card with wings.
    () => ({
      geo: merge(part(box(8.6, 5.4, 0.35), (x, y) => (y > 6.4 && y < 7.2 ? K.ink : 'A'), { p: [0, 5.6, 0], r: [-0.25, 0, 0] }), part(box(1.2, 0.9, 0.1), K.gold, { p: [-2.6, 5, 0.3], r: [-0.25, 0, 0] }), ring(4, (a, i) => part(box(1.2, 0.18, 0.1), 'B', { p: [-2.2 + i * 1.5, 3.9, 0.6], r: [-0.25, 0, 0] }))),
      moving: winged(4.4, 5.6, -0.6, 0.85),
      hover: 0.7,
    }),
  ],
  insurance: [
    // A shield with a tick.
    () => ({ geo: merge(...plinth(3.4), part(extrude([[-3.4, 4], [3.4, 4], [3.4, 1.2], [0, -3.2], [-3.4, 1.2]], 1.2), 'A', { p: [0, 5.4, 0] }), part(extrude([[-2.6, 3.4], [2.6, 3.4], [2.6, 1.2], [0, -2.2], [-2.6, 1.2]], 0.3), 'B', { p: [0, 5.4, 0.7] }),
      part(box(1.8, 0.6, 0.3), K.white, { p: [-0.9, 6.4, 0.95], r: [0, 0, -0.8] }), part(box(3.4, 0.6, 0.3), K.white, { p: [0.9, 7.1, 0.95], r: [0, 0, 0.9] })) }),
    // A lifebuoy on the waves.
    () => ({ geo: merge(part(cyl(4.6, 4.8, 0.8, 32), '#5aa9e6', { p: [0, 0.4, 0] }), ring(6, (a) => part(cone(1, 1.4, 4), '#8cc8f0', { p: [Math.cos(a) * 3.4, 1.2, Math.sin(a) * 3.4] })),
      part(torus(3, 1, Math.PI * 2, 40), (x, y, z) => (Math.floor(((Math.atan2(y - 4.6, x) + Math.PI) / (Math.PI * 2)) * 8) % 2 ? 'A' : K.white), { p: [0, 4.6, 0] }),
      part(torus(3.05, 0.12, Math.PI * 2, 40), '#d9c39a', { p: [0, 4.6, 1] })) }),
  ],
  health: [
    // A heart with a pulse line.
    () => ({ geo: merge(...plinth(3.4), part(ball(2.1, 2), 'A', { p: [-1.5, 6.6, 0] }), part(ball(2.1, 2), 'A', { p: [1.5, 6.6, 0] }), part(cone(3.3, 4, 4), 'A', { p: [0, 4, 0], r: [Math.PI, Math.PI / 4, 0], s: [1, 1, 0.65] }),
      beam([-4, 6, 2], [-1.4, 6, 2], 0.3, K.white), beam([-1.4, 6, 2], [-0.6, 7.8, 2], 0.3, K.white), beam([-0.6, 7.8, 2], [0.4, 4.6, 2], 0.3, K.white), beam([0.4, 4.6, 2], [1.2, 6, 2], 0.3, K.white), beam([1.2, 6, 2], [4, 6, 2], 0.3, K.white)) }),
    // A pill bottle with pills spilling out.
    () => ({ geo: merge(part(cyl(2.2, 2.2, 5.4, 24), '#f2a65a', { p: [0, 2.9, 0], r: [0, 0, 0] }), part(cyl(2.25, 2.25, 2.4, 24), K.white, { p: [0, 2.9, 0] }), part(box(2.6, 0.3, 0.1), 'B', { p: [0, 3.2, 2.24] }),
      part(cyl(2.4, 2.4, 1, 24), K.white, { p: [0, 6.1, 0] }), part(cyl(2.42, 2.42, 0.2, 24), 'A', { p: [0, 6.3, 0] }),
      ring(7, (a, i) => part(new THREE.CapsuleGeometry(0.35, 0.8, 4, 10), (x, y, z) => ((x - Math.cos(a) * 4) * Math.cos(a) > 0 ? 'A' : K.white), { p: [Math.cos(a) * (3.4 + (i % 2)), 0.4, Math.sin(a) * (3.4 + (i % 2))], r: [0, -a, Math.PI / 2] }))) }),
  ],
  retail: [
    // A giant shopping bag.
    () => ({ geo: merge(part(box(5.6, 6, 2.8), 'A', { p: [0, 3, 0] }), part(box(5.65, 0.8, 2.85), 'B', { p: [0, 4.6, 0] }),
      part(torus(1.3, 0.16, Math.PI, 16), K.ink, { p: [0, 6, 0.9] }), part(torus(1.3, 0.16, Math.PI, 16), K.ink, { p: [0, 6, -0.9] }),
      part(cone(1, 2, 4), K.white, { p: [-1, 6.6, 0], r: [0.2, 0.3, 0.2] }), part(cone(0.9, 1.8, 4), '#f6d7cf', { p: [1, 6.5, 0.2], r: [-0.2, 0.5, -0.2] }),
      part(box(1, 1.3, 0.08), K.white, { p: [2.2, 2, 1.45], r: [0, 0, 0.2] })) }),
    // A storefront with a striped awning.
    () => ({ geo: merge(part(box(8.4, 5.4, 4), K.cream, { p: [0, 2.7, 0] }), part(box(8.6, 1.2, 0.3), 'B', { p: [0, 6, 2.05] }),
      ring(8, (a, i) => part(box(1.05, 0.16, 1.8), i % 2 ? K.white : 'A', { p: [-3.7 + i * 1.06, 4.6, 2.7], r: [0.45, 0, 0] })),
      part(box(2.8, 2.6, 0.1), '#9dd0f2', { p: [-2.2, 2, 2.02] }), part(box(2.8, 2.6, 0.1), '#9dd0f2', { p: [2.2, 2, 2.02] }), part(box(1.2, 3, 0.1), K.wood, { p: [0, 1.5, 2.03] })) }),
  ],
  oil: [
    // A nodding pumpjack.
    () => ({
      geo: merge(part(box(9, 0.6, 3), K.dark, { p: [0, 0.3, 0] }), beam([-0.6, 0.6, 1], [0, 5.6, 0], 0.4, K.steelDk), beam([0.6, 0.6, -1], [0, 5.6, 0], 0.4, K.steelDk), beam([-0.6, 0.6, -1], [0, 5.6, 0], 0.4, K.steelDk),
        part(box(1.8, 1.8, 1.8), K.dark, { p: [-3.4, 1.5, 0] }), part(cyl(0.3, 0.3, 4, 8), K.steel, { p: [3.8, 2, 0] }), ring(3, (a, i) => part(cyl(0.7, 0.7, 1.4, 14), i === 1 ? 'A' : 'B', { p: [-1 + i * 1.6, 0.7, 2.6] }))),
      moving: [{ geo: merge(part(box(8, 0.7, 0.7), 'A', { p: [0, 0, 0] }), part(box(1, 2.4, 1), 'Ad', { p: [4.2, -0.6, 0] }), part(box(1.4, 1.4, 1.2), K.dark, { p: [-3.8, -0.4, 0] })), pivot: [0, 5.8, 0], axis: [0, 0, 1], mode: 'flap', amp: 0.28, speed: 1.6 }],
    }),
    // A storage tank with pipes.
    () => ({ geo: merge(part(cyl(3.4, 3.4, 5.2, 28), K.white, { p: [0, 2.6, 0] }), part(cyl(3.42, 3.42, 0.9, 28), 'A', { p: [0, 3.8, 0] }), part(cone(3.5, 1, 28), '#e8e8e4', { p: [0, 5.7, 0] }),
      ring(9, (a, i) => beam([Math.cos(a) * 3.5, i * 0.6, Math.sin(a) * 3.5], [Math.cos(a + 0.35) * 3.5, i * 0.6 + 0.6, Math.sin(a + 0.35) * 3.5], 0.12, K.steelDk)),
      part(cyl(0.4, 0.4, 6, 10), K.steel, { p: [3.6, 0.6, 2], r: [0, 0, Math.PI / 2] }), part(cyl(1.3, 1.3, 2.4, 18), 'B', { p: [6.4, 1.2, 2] })) }),
  ],
  power: [
    // A pylon carrying lines.
    () => {
      const parts = [];
      const legs = [[-1.8, -1.8], [1.8, -1.8], [1.8, 1.8], [-1.8, 1.8]];
      legs.forEach(([x, z]) => parts.push(beam([x, 0, z], [x * 0.2, 11, z * 0.2], 0.25, K.steelDk)));
      for (let lv = 1; lv < 5; lv++) { const y = lv * 2.2, k = 1 - 0.8 * (y / 11); for (let i = 0; i < 4; i++) { const [x0, z0] = legs[i], [x1, z1] = legs[(i + 1) % 4]; parts.push(beam([x0 * k, y, z0 * k], [x1 * k, y + 2.2, z1 * k], 0.1, K.steel)); } }
      [7.2, 9.4].forEach((y) => { parts.push(part(box(8, 0.35, 0.35), K.steelDk, { p: [0, y, 0] })); [-3.8, 3.8].forEach((x) => parts.push(part(cyl(0.25, 0.25, 0.9, 8), 'A', { p: [x, y - 0.6, 0] }), beam([x, y - 1, 0], [x * 1.8, y - 3, 3], 0.06, K.ink))); });
      return { geo: merge(parts) };
    },
    // A glowing light bulb.
    () => ({ geo: merge(...plinth(2.6), part(cyl(1.3, 1.4, 2.4, 16), (x, y) => (Math.floor(y * 2.5) % 2 ? K.steel : K.steelDk), { p: [0, 1.8, 0] }),
      part(cyl(1.3, 2.2, 1.2, 18), '#fff3b0', { p: [0, 3.6, 0] }), part(ball(3, 2), '#fff3b0', { p: [0, 6.2, 0] }), part(torus(0.8, 0.12, Math.PI, 12), 'A', { p: [0, 6, 0] }),
      beam([-0.8, 6, 0], [-0.4, 3.8, 0], 0.08, 'A'), beam([0.8, 6, 0], [0.4, 3.8, 0], 0.08, 'A'),
      ring(8, (a) => beam([Math.cos(a) * 3.8, 6.2 + Math.sin(a) * 3.8, 0], [Math.cos(a) * 4.8, 6.2 + Math.sin(a) * 4.8, 0], 0.22, K.yellow))) }),
  ],
  software: [
    // A browser window full of code.
    () => ({ geo: merge(part(box(2, 2.4, 1.4), K.steelDk, { p: [0, 1.2, 0] }), part(box(9, 6.4, 0.5), K.white, { p: [0, 5.6, 0] }), part(box(9, 0.9, 0.55), 'A', { p: [0, 8.35, 0] }),
      ring(3, (a, i) => part(ball(0.22, 0), [K.white, '#f6d77a', '#9ee3a1'][i], { p: [-4 + i * 0.6, 8.35, 0.3] })),
      [[2.8, 'B'], [4.2, '#c3c9d0'], [3.2, 'Bd'], [5, '#c3c9d0'], [2.2, 'A']].map(([w, c], i) => part(box(w, 0.42, 0.1), c, { p: [-3.8 + w / 2 + (i % 2) * 0.6, 7.3 - i * 0.95, 0.3] })),
      part(box(0.2, 0.8, 0.12), K.ink, { p: [1.8, 3.5, 0.32] })) }),
    // A turning cube of app blocks.
    () => ({ geo: merge(...plinth(3)),
      moving: [{ geo: merge(Array.from({ length: 27 }, (_, i) => { const x = (i % 3) - 1, y = Math.floor(i / 3) % 3 - 1, z = Math.floor(i / 9) - 1; return part(box(1.75, 1.75, 1.75), ['A', 'B', K.white, 'Ad', '#f6d77a'][(i * 7) % 5], { p: [x * 1.9, y * 1.9, z * 1.9] }); })), pivot: [0, 5, 0], axis: [0.3, 1, 0.2], mode: 'spin', speed: 0.5 }],
    }),
  ],
  ai: [
    // A brain on a stand.
    () => ({ geo: merge(...plinth(2.8), part(cyl(0.4, 0.6, 2.6, 10), K.steel, { p: [0, 1.8, 0] }),
      ...Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2 * 3.1, t = (i % 10) / 10; const side = i % 2 ? 1 : -1; return part(ball(1.05, 1), i % 3 ? 'A' : 'Ad', { p: [side * (0.9 + Math.sin(a) * 1.1), 5.6 + Math.cos(a) * 1.6 * (1 - t * 0.3), Math.cos(a * 0.7) * 2.2 * (1 - t * 0.4)] }); })) }),
    // A small neural network.
    () => {
      const layers = [[-3.4, 3], [0, 4], [3.4, 2]];
      const nodes = [];
      layers.forEach(([x, count], li) => { for (let k = 0; k < count; k++) nodes.push({ li, p: [x, 4 + (k - (count - 1) / 2) * 2, 0] }); });
      const links = [];
      nodes.forEach((a) => nodes.forEach((b) => { if (b.li === a.li + 1) links.push(beam(a.p, b.p, 0.12, '#c3c9d0')); }));
      return { geo: merge(...plinth(4.2), links, nodes.map((nd, i) => part(ball(0.75, 1), nd.li === 1 ? 'A' : 'B', { p: nd.p }))) };
    },
  ],
  car: [
    // A pickup truck on a turntable.
    () => ({
      geo: merge(part(cyl(5.6, 5.8, 0.6, 32), K.steelDk, { p: [0, 0.3, 0] })),
      moving: [{ geo: merge(part(cyl(5.2, 5.2, 0.25, 32), K.dark, { p: [0, 0.72, 0] }), part(box(3.6, 2.4, 3.2), 'A', { p: [1.8, 2.6, 0] }), part(box(3.65, 1, 3.25), '#2c3e55', { p: [1.8, 3.2, 0] }),
        part(box(4.4, 0.4, 3.2), 'Ad', { p: [-2.2, 1.9, 0] }), part(box(4.4, 1.2, 0.2), 'A', { p: [-2.2, 2.6, 1.5] }), part(box(4.4, 1.2, 0.2), 'A', { p: [-2.2, 2.6, -1.5] }), part(box(0.2, 1.2, 3.2), 'A', { p: [-4.3, 2.6, 0] }),
        part(box(1.6, 0.9, 1.4), 'B', { p: [-2.4, 2.6, 0] }), tire([2.4, 1.5, 1.75], 0.9), tire([2.4, 1.5, -1.75], 0.9), tire([-2.6, 1.5, 1.75], 0.9), tire([-2.6, 1.5, -1.75], 0.9)), pivot: [0, 0, 0], axis: [0, 1, 0], mode: 'spin', speed: 0.35 }],
    }),
    // A giant tire on a stand.
    () => ({
      geo: merge(part(box(6, 0.6, 3), K.dark, { p: [0, 0.3, 0] }), beam([-2, 0.6, 0], [0, 5.2, 0], 0.4, K.steelDk), beam([2, 0.6, 0], [0, 5.2, 0], 0.4, K.steelDk)),
      moving: [{ geo: merge(part(torus(3.1, 1.3, Math.PI * 2, 36), '#2b2b2e'), part(cyl(1.9, 1.9, 1.2, 24), 'A', { r: [Math.PI / 2, 0, 0] }), part(cyl(0.6, 0.6, 1.3, 12), 'B', { r: [Math.PI / 2, 0, 0] }), ring(16, (a) => part(box(0.5, 0.35, 2.4), '#3a3a3e', { p: [Math.cos(a) * 4.2, Math.sin(a) * 4.2, 0], r: [0, 0, a] }))), pivot: [0, 5.4, 0], axis: [0, 0, 1], mode: 'spin', speed: 0.6 }],
    }),
  ],
  industrial: [
    // A tower crane with a turning jib.
    () => ({
      geo: merge(part(box(3.2, 0.8, 3.2), K.dark, { p: [0, 0.4, 0] }), [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]].map(([x, z]) => beam([x, 0.8, z], [x, 9.6, z], 0.22, 'A')), ring(8, (a, i) => beam([-0.7, 1 + i * 1.1, -0.7], [0.7, 2.1 + i * 1.1, 0.7], 0.1, 'Ad'))),
      moving: [{ geo: merge(part(box(10, 0.6, 0.9), 'A', { p: [2, 0, 0] }), part(box(1.4, 1.2, 1.4), K.dark, { p: [-3.2, -0.3, 0] }), part(box(1.4, 1.2, 1.2), '#2c3e55', { p: [0, 0.9, 0] }), beam([6, 0, 0], [6, -4.4, 0], 0.06, K.ink), part(box(0.8, 0.8, 0.8), 'B', { p: [6, -4.8, 0] })), pivot: [0, 10, 0], axis: [0, 1, 0], mode: 'spin', speed: 0.3 }],
    }),
    // A hard hat and a wrench.
    () => ({ geo: merge(...plinth(3.6), part(new THREE.SphereGeometry(2.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'A', { p: [0, 2.6, 0] }), part(cyl(3.6, 3.6, 0.3, 28), 'Ad', { p: [0, 2.7, 0.4] }), part(box(0.6, 0.4, 5.4), 'Ad', { p: [0, 5.3, 0], r: [0.1, 0, 0] }),
      part(box(7.4, 0.6, 0.6), K.steel, { p: [0, 1.2, 2.8], r: [0, 0.3, 0] }), part(torus(0.7, 0.3, Math.PI * 1.4, 12), K.steel, { p: [3.6, 1.2, 1.7], r: [Math.PI / 2, 0, 0.6] })) }),
  ],
  food: [
    // A pizza with a slice lifting off.
    () => ({ geo: merge(part(cyl(4.4, 4.4, 0.6, 32), '#e2a65a', { p: [0, 0.8, 0] }), part(cyl(4, 4, 0.3, 32), '#f6c443', { p: [0, 1.15, 0] }),
      ring(8, (a, i) => part(cyl(0.55, 0.55, 0.15, 14), 'A', { p: [Math.cos(a) * (1.6 + (i % 2) * 1.2), 1.32, Math.sin(a) * (1.6 + (i % 2) * 1.2)] })),
      part(extrude([[0, 0], [4.2, -1.3], [4.2, 1.3]], 0.6), '#f6c443', { p: [0.4, 4.2, 0], r: [-Math.PI / 2 + 0.4, 0.3, 0] }), part(cyl(0.3, 0.3, 2.6, 10), '#f6c443', { p: [0.6, 2.6, 0] }),
      part(box(9.4, 0.3, 9.4), 'B', { p: [0, 0.15, 0] })) }),
    // Stacked donuts.
    () => ({ geo: merge(...plinth(3.4), [0, 1].flatMap((k) => [part(torus(2.4, 1.2, Math.PI * 2, 28), '#d9a15c', { p: [k * 0.6, 1.8 + k * 2.4, k * 0.3], r: [Math.PI / 2, 0, 0] }), part(torus(2.4, 1.0, Math.PI * 2, 28), k ? 'A' : 'B', { p: [k * 0.6, 2.4 + k * 2.4, k * 0.3], r: [Math.PI / 2, 0, 0], s: [1.04, 1.04, 0.7] })]),
      ring(14, (a, i) => part(box(0.12, 0.12, 0.5), [K.yellow, K.white, '#7cc0ff', '#5fae5b'][i % 4], { p: [0.6 + Math.cos(a) * 2.4, 5.6, 0.3 + Math.sin(a) * 2.4], r: [0, a * 3, 0] }))) }),
  ],
  drink: [
    // A coffee mug with rising steam.
    () => ({
      geo: merge(part(cyl(4, 4, 0.4, 28), K.white, { p: [0, 0.2, 0] }), part(cyl(2.6, 2.3, 4.6, 24), 'A', { p: [0, 2.7, 0] }), part(cyl(2.3, 2.3, 0.2, 24), '#5a3a22', { p: [0, 4.9, 0] }), part(torus(1.2, 0.35, Math.PI * 1.2, 16), 'A', { p: [2.7, 2.8, 0], r: [0, 0, -Math.PI * 0.6] }), part(box(1.6, 1.6, 0.1), 'B', { p: [0, 2.8, 2.5] })),
      moving: [0, 1, 2].map((i) => ({ geo: part(ball(0.7, 1), '#ffffff'), pivot: [-0.8 + i * 0.8, 5.4, (i - 1) * 0.6], axis: [0, 1, 0], mode: 'drop', drop: -5, speed: 0.4, phase: i / 3 })),
    }),
    // Glass bottles.
    () => ({ geo: merge(...plinth(3.2), [[-1.2, 0], [1.4, 0.4]].flatMap(([x, z], k) => [part(cyl(1.4, 1.4, 4.6, 18), k ? 'Ad' : 'A', { p: [x, 3, z] }), part(cyl(0.5, 1.4, 1.4, 18), k ? 'Ad' : 'A', { p: [x, 6, z] }), part(cyl(0.45, 0.45, 1.4, 12), k ? 'Ad' : 'A', { p: [x, 7.4, z] }), part(cyl(0.52, 0.52, 0.4, 12), 'B', { p: [x, 8.2, z] }), part(cyl(1.42, 1.42, 1.6, 18), K.white, { p: [x, 3.2, z] })])) }),
  ],
  parcel: [
    // A delivery van.
    () => ({ geo: merge(part(box(6, 4, 3.4), K.white, { p: [-0.8, 2.8, 0] }), part(box(6.05, 0.7, 3.45), 'A', { p: [-0.8, 2.4, 0] }), part(box(2.2, 2.8, 3.2), 'B', { p: [3.3, 2.2, 0] }), part(box(0.1, 1.2, 2.6), '#9dd0f2', { p: [4.42, 2.9, 0] }),
      tire([2.8, 0.9, 1.7], 0.85), tire([2.8, 0.9, -1.7], 0.85), tire([-2.6, 0.9, 1.7], 0.85), tire([-2.6, 0.9, -1.7], 0.85),
      part(box(1.4, 1.2, 1.4), '#c99a62', { p: [-1, 5.4, 0], r: [0, 0.3, 0] }), part(box(1, 0.9, 1), '#d4a76d', { p: [0.6, 5.25, 0.4] })) }),
    // A parcel with wings.
    () => ({ geo: merge(part(box(5, 4, 4), '#c99a62', { p: [0, 4.4, 0] }), part(box(5.05, 4.02, 0.9), 'A', { p: [0, 4.41, 0] }), part(box(1.4, 1, 0.1), K.white, { p: [1.4, 3.6, 2.02] })), moving: winged(2.6, 5, 0, 0.8), hover: 0.6 }),
  ],
  rocket: [
    // A fighter jet climbing.
    () => ({ geo: merge(part(box(2, 3.2, 2), K.dark, { p: [0, 1.6, 0] }),
      part(new THREE.CapsuleGeometry(0.9, 7, 6, 14), '#a9b1bb', { p: [0, 6, 0], r: [Math.PI / 2 - 0.5, 0, 0] }), part(extrude([[0, 3], [3.6, -1.4], [-3.6, -1.4]], 0.25), '#8d96a1', { p: [0, 5.4, -0.6], r: [-Math.PI / 2 - 0.5, 0, 0] }),
      part(extrude([[0, 1.6], [0.9, -0.4], [-0.9, -0.4]], 0.2), 'A', { p: [0, 4.4, -2.9], r: [0.3, Math.PI / 2, 0] }), part(new THREE.SphereGeometry(0.7, 12, 8), '#4f8fe0', { p: [0, 7.4, 2.4], s: [1, 0.8, 1.8] }), part(cone(0.5, 1, 10), K.orange, { p: [0, 3.2, -3.4], r: [-2.07, 0, 0] })) }),
    // A satellite with turning panels.
    () => ({
      geo: merge(part(box(2, 4, 2), K.dark, { p: [0, 2, 0] }), part(box(3, 3, 3), '#d9a93a', { p: [0, 6, 0] }), part(cone(1.4, 1, 18), K.white, { p: [0, 8.2, 0], r: [Math.PI, 0, 0] }), part(cyl(0.08, 0.08, 1.6, 6), K.steel, { p: [0, 9.2, 0] }), part(box(3.05, 0.4, 3.05), 'A', { p: [0, 6, 0] })),
      moving: [{ geo: merge(part(box(10, 0.15, 2.4), '#2d4f8e'), ring(8, (a, i) => part(box(0.08, 0.17, 2.4), '#c9d6e3', { p: [-4.5 + i * 1.28, 0, 0] })), part(box(3, 0.3, 0.3), K.steel)), pivot: [0, 6, 0], axis: [1, 0, 0], mode: 'spin', speed: 0.4 }],
    }),
  ],
  chip: [
    // A graphics card with spinning fans.
    () => ({
      geo: merge(part(box(9, 0.4, 4.4), '#2f6b4a', { p: [0, 2.2, 0] }), part(box(9, 1.4, 4.2), 'A', { p: [0, 3.1, 0] }), part(box(0.3, 2.4, 4.4), K.steel, { p: [-4.6, 2.6, 0] }), part(box(4, 0.3, 0.3), K.gold, { p: [0.8, 2, 2.2] }), part(box(2, 2, 2), K.dark, { p: [0, 1, 0] })),
      moving: [-2, 2].map((x) => ({ geo: merge(part(cyl(1.6, 1.6, 0.2, 24), K.ink), ring(7, (a) => part(box(1.4, 0.12, 0.5), 'B', { p: [Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8], r: [0.4, -a, 0] }))), pivot: [x, 3.85, 0], axis: [0, 1, 0], mode: 'spin', speed: 4 })),
    }),
    // Memory sticks.
    () => ({ geo: merge(...plinth(3.8), [-0.9, 0.9].flatMap((z, k) => [part(box(9, 3, 0.25), '#2f6b4a', { p: [0, 2.3, z] }), ring(8, (a, i) => part(box(0.8, 1.2, 0.3), K.ink, { p: [-3.6 + i * 1.03, 2.6, z] })), part(box(8.6, 0.4, 0.3), K.gold, { p: [0, 1, z] }), part(box(9.1, 0.35, 0.32), k ? 'A' : 'B', { p: [0, 3.7, z] })])) }),
  ],
  computer: [
    // A desktop monitor and keyboard.
    () => ({ geo: merge(part(box(4, 0.3, 2.6), K.steel, { p: [0, 0.15, -0.6] }), part(box(0.8, 3, 0.6), K.steel, { p: [0, 1.8, -0.8] }), part(box(9, 5.6, 0.5), K.ink, { p: [0, 5.6, -0.6] }), part(box(8.4, 5, 0.06), (x, y) => (y > 6.4 ? '#7cc0ff' : 'B'), { p: [0, 5.6, -0.33] }),
      part(box(6.4, 0.3, 2.2), K.white, { p: [0, 0.15, 2.4] }), part(box(1, 0.4, 1.4), 'A', { p: [4.2, 0.2, 2.4] })) }),
    // A server rack.
    () => ({ geo: merge(part(box(4.6, 9.4, 3.6), K.ink, { p: [0, 4.7, 0] }), ring(8, (a, i) => [part(box(4, 0.9, 0.1), '#3a3f47', { p: [0, 1 + i * 1.05, 1.82] }), part(box(0.25, 0.25, 0.12), i % 3 ? '#5fd08f' : 'A', { p: [1.6, 1 + i * 1.05, 1.85] }), part(box(2, 0.12, 0.12), 'B', { p: [-0.6, 1 + i * 1.05, 1.86] })]), part(box(4.8, 0.3, 3.8), 'A', { p: [0, 9.5, 0] })) }),
  ],
  plane: [
    // An airliner taking off.
    () => ({ geo: merge(part(box(1.4, 3, 1.4), K.steelDk, { p: [0, 1.5, 0] }),
      part(new THREE.CapsuleGeometry(1, 8, 6, 16), K.white, { p: [0, 5.4, 0], r: [Math.PI / 2 - 0.35, 0, 0] }), part(box(10, 0.2, 1.8), '#e8edf3', { p: [0, 5.1, 0.3], r: [-0.35, 0, 0] }),
      part(box(0.2, 2.2, 1.6), 'A', { p: [0, 5.2, -4.3], r: [-0.35, 0, 0] }), part(box(3.4, 0.16, 1), '#e8edf3', { p: [0, 3.9, -3.9], r: [-0.35, 0, 0] }),
      [-2.4, 2.4].map((x) => part(cyl(0.5, 0.5, 1.6, 12), 'B', { p: [x, 4.5, 0.6], r: [Math.PI / 2 - 0.35, 0, 0] })), ring(6, (a, i) => part(box(0.05, 0.25, 0.3), K.ink, { p: [1.02, 5.9 - i * 0.22, 2.4 - i * 0.62] }))) }),
    // A hotel with a sign.
    () => ({ geo: merge(part(box(6, 9, 4), K.cream, { p: [0, 4.5, 0] }), ring(6, (a, i) => [part(box(5.4, 0.2, 0.8), K.white, { p: [0, 1.6 + i * 1.3, 2.3] }), ring(3, (b, j) => part(box(1.2, 0.8, 0.06), '#9dd0f2', { p: [-1.8 + j * 1.8, 2.1 + i * 1.3, 2.02] }))]),
      part(box(6.4, 1.4, 0.4), 'A', { p: [0, 9.6, 0.8] }), part(box(2, 1.6, 0.1), 'B', { p: [0, 0.8, 2.03] }), part(cyl(3, 3, 0.3, 24), '#7cc0ff', { p: [5, 0.15, 3] })) }),
  ],
};
// Pedestals add variety and lift the model: 0 none, 1 round, 2 square steps.
const BASES = [
  null,
  (r) => [part(cyl(r, r * 1.05, 0.6, 32), K.white, { p: [0, 0.3, 0] }), part(cyl(r * 1.06, r * 1.08, 0.22, 32), 'B', { p: [0, 0.11, 0] })],
  (r) => [part(box(r * 2, 0.35, r * 2), K.stoneDk, { p: [0, 0.18, 0] }), part(box(r * 1.8, 0.35, r * 1.8), K.stone, { p: [0, 0.52, 0] }), part(box(r * 1.82, 0.1, r * 1.82), 'A', { p: [0, 0.4, 0] })],
];

// ---------- archetypes ----------
// finder: colour of the QR's corner squares around the model. glow: emissive tint.
const FINDER = {
  bank: '#cdb37a', payments: '#9fb5e0', insurance: '#e9a191', health: '#a6d9cf', oil: '#6f7883', power: '#ffe27a', retail: '#f0a99b', parcel: '#d9b98c',
  car: '#8d96a1', plane: '#9fd0ef', casino: '#2f7d4f', rocket: '#8d96a1', chip: '#2f6b4a', computer: '#c9ced6', software: '#bfe3ff', comms: '#b9c3cf',
  social: '#f39ab8', media: '#e5533d', food: '#f3c443', drink: '#e5533d', care: '#7fd1c4', farm: '#7cbf5a', industrial: '#f29a3a', chem: '#5fd08f',
  metal: '#b0643c', house: '#7cbf5a', ai: '#f2b08f', robot: '#7cc0ff', tree: '#6fb84e', search: '#9fc3f2', vr: '#9aa6b8', bricks: '#e06a45',
};
export const ARCHETYPES = Object.fromEntries(Object.entries(FINDER).map(([id, finder]) => [id, { id, finder }]));

// How many shapes each kind of company has.
export const variantCount = (id) => 1 + ((EXTRA[id] || []).length);
const cache = new Map();
// { geo, moving: [{ geo, pivot, axis, mode: spin|flap|drop, speed, amp, drop, phase }], hover }
// A moving part's geometry is built around its own pivot point.
export function centerpiece(id, variant = 0, base = 0) {
  const key = `${id}:${variant}:${base}`;
  if (!cache.has(key)) {
    const builders = [CENTER[id] || CENTER.tree, ...(EXTRA[id] || [])];
    const c = { ...builders[variant % builders.length]() };
    if (c.spin) c.moving = [{ ...c.spin, mode: 'spin' }];
    c.moving = (c.moving || []).map((mv) => ({ ...mv }));
    const make = BASES[base % BASES.length];
    if (make) {
      const bb = new THREE.Box3().setFromBufferAttribute(c.geo.attributes.position);
      const r = Math.min(5.4, Math.max(2.6, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 0.5));
      const lift = 0.7;
      c.geo = merge(make(r), c.geo.clone().translate(0, lift, 0));
      c.moving = c.moving.map((mv) => ({ ...mv, pivot: [mv.pivot[0], mv.pivot[1] + lift, mv.pivot[2]] }));
    }
    cache.set(key, c);
  }
  return cache.get(key);
}

// Shared material: vertex colours, with brand slots filled from per-instance brandA / brandB.
export function modelMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.72, metalness: 0.02 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float mask;\nattribute vec3 brandA;\nattribute vec3 brandB;')
      .replace('#include <color_vertex>', `#include <color_vertex>
  if (mask > 0.5) {
    vec3 bc = mask < 2.5 ? brandA : brandB;
    vColor.rgb = bc * ((mask > 1.5 && mask < 2.5) || mask > 3.5 ? 0.72 : 1.0);
  }`);
  };
  return m;
}
// Per-instance brand colours for an InstancedMesh (one [a, b] hex pair per instance).
export function setBrands(mesh, pairs) {
  const A = new Float32Array(pairs.length * 3), B = new Float32Array(pairs.length * 3), c = new THREE.Color();
  pairs.forEach(([a, b], i) => { c.set(a); A.set([c.r, c.g, c.b], i * 3); c.set(b); B.set([c.r, c.g, c.b], i * 3); });
  mesh.geometry = mesh.geometry.clone();
  mesh.geometry.setAttribute('brandA', new THREE.InstancedBufferAttribute(A, 3));
  mesh.geometry.setAttribute('brandB', new THREE.InstancedBufferAttribute(B, 3));
}
// The colour a vertex shows for a given brand pair (used when a model turns into pixels).
export function vertexColor(geo, i, [a, b], out = new THREE.Color()) {
  const k = geo.attributes.mask ? geo.attributes.mask.getX(i) : 0;
  if (!k) return out.fromBufferAttribute(geo.attributes.color, i);
  out.set(k < 2.5 ? a : b);
  return k === 2 || k === 4 ? out.multiplyScalar(0.72) : out;
}
