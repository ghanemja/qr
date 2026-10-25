// The modelling kit shared by the kinds of company (models.js) and the signature models of the
// biggest companies (heroes.js): soft primitives, colouring, brand slots and motion helpers.
import * as THREE from 'three';
import { mergeGeometries } from './BufferGeometryUtils.js';
import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';

const V = THREE.Vector3;
const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), col = new THREE.Color();

// ---------- geometry kit ----------
// Brand slots: the 'mask' attribute says which brand colour a vertex takes (0 = its own colour).
// 'W' paints a surface with live water (see modelMaterial).
const BRAND = { A: 1, Ad: 2, B: 3, Bd: 4, W: 5 };
const WATER = '#4fb3c9';
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
    col.set(c === 'W' ? WATER : BRAND[c] ? '#ffffff' : c);
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
// Every shape is built soft: boxes have rounded edges, cylinders filleted rims, rods are round,
// extrusions bevelled, spheres smooth. DETAIL picks how finely (the map draws hundreds of models
// at once and uses 'low'; a company's own card and page use 'high').
let DETAIL = 'high';
const hi = () => DETAIL === 'high';
const faceted = (g) => { g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('normal'); g.computeVertexNormals(); return g; };
const box = (w, h, d) => {
  const m = Math.min(w, h, d);
  if (m < 0.16) return new THREE.BoxGeometry(w, h, d);
  return new RoundedBoxGeometry(w, h, d, hi() ? 3 : 1, Math.min(0.32, m * 0.2));
};
// A lathe-turned cylinder (or frustum) with rounded rims; few-sided ones stay crisp prisms.
const cyl = (rt, rb, h, seg = 14) => {
  if (seg <= 8) return faceted(new THREE.CylinderGeometry(rt, rb, h, seg));
  const f = Math.min(0.28, h * 0.3, Math.max(rt, rb) * 0.3), n = hi() ? 4 : 1, pts = [new THREE.Vector2(0, -h / 2)];
  const arc = (cx, cy, a0, a1) => { for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push(new THREE.Vector2(cx + Math.cos(a) * f, cy + Math.sin(a) * f)); } };
  if (rb > f) arc(rb - f, -h / 2 + f, -Math.PI / 2, 0); else pts.push(new THREE.Vector2(rb, -h / 2));
  if (rt > f) arc(rt - f, h / 2 - f, 0, Math.PI / 2); else pts.push(new THREE.Vector2(rt, h / 2));
  pts.push(new THREE.Vector2(0, h / 2));
  return new THREE.LatheGeometry(pts, hi() ? Math.max(32, seg * 2) : Math.max(16, seg));
};
// A shape turned on a lathe from [radius, height] points (bottles, cups, bells, nose cones).
const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), seg || (hi() ? 48 : 18));
// A smooth curve through points (handles, cables, straws, hoses) as a tube of radius r.
const tube = (pts, r, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new V(...p)), closed), hi() ? 48 : 16, r, hi() ? 12 : 6, closed);
const ball = (r) => new THREE.SphereGeometry(r, hi() ? 32 : 14, hi() ? 20 : 9);
const cone = (r, h, seg = 12) => (seg <= 8 ? faceted(new THREE.ConeGeometry(r, h, seg)) : new THREE.ConeGeometry(r, h, hi() ? 40 : 16));
const torus = (r, t, arc = Math.PI * 2, seg = 24) => new THREE.TorusGeometry(r, t, hi() ? 16 : 8, hi() ? Math.max(48, seg * 2) : seg, arc);
function extrude(points, depth) {
  const sh = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const bev = depth >= 0.18 ? Math.min(0.12, depth * 0.25) : 0;
  const g = new THREE.ExtrudeGeometry(sh, { depth: depth - bev * 2, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: hi() ? 3 : 1 });
  g.translate(0, 0, -depth / 2 + bev);
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
// A round rod from a to b, t thick.
function beam(a, b, t, color) {
  const A = new V(...a), B = new V(...b);
  const dir = B.clone().sub(A);
  const g = new THREE.CylinderGeometry(t / 2, t / 2, dir.length(), hi() ? 14 : 6);
  return part(g, color, { p: A.clone().add(B).multiplyScalar(0.5).toArray(), q: new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), dir.normalize()) });
}
const ring = (n, fn) => Array.from({ length: n }, (_, i) => fn((i / n) * Math.PI * 2, i));

// ---------- motion kit ----------
// A moving part is { geo, pivot, anim, parent }: anim(t) returns its pose about the pivot (x, y, z
// offsets; rx, ry, rz angles or a quaternion q; s or sx/sy/sz scale). A part with a parent (its
// index in the list) rides on it, with its pivot in the parent's frame; geo may be null for a
// bare joint. A model's move(t) replaces its kind's whole-model motion (behave).
const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const cyc = (t, period, off = 0) => (((t / period + off) % 1) + 1) % 1;
const win = (f, a, b) => clamp01((f - a) / (b - a)); // progress of f through [a, b]
const easeIn = (k) => k * k * k;
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const back = (k) => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2; // overshoots, then settles
const bump = (f, at, w) => Math.exp(-(((f - at) / w) ** 2));
const hop = (k) => 4 * k * (1 - k); // 0 → 1 → 0
// Grows in with a little overshoot over [a, b] and shrinks away over [c, d] of a cycle.
const life = (f, a, b, c, d) => (f < a || f > d ? 0 : f < b ? back(win(f, a, b)) : f < c ? 1 : 1 - easeIn(win(f, c, d)));
const legacy = (mv) => {
  const axis = new V(...mv.axis).normalize(), q = new THREE.Quaternion();
  if (mv.mode === 'spin') return (t) => ({ q: q.setFromAxisAngle(axis, t * mv.speed) });
  if (mv.mode === 'flap') return (t) => ({ q: q.setFromAxisAngle(axis, Math.sin(t * mv.speed) * mv.amp) });
  return (t) => { const f = cyc(t * mv.speed + (mv.phase || 0), 1); return { y: -f * mv.drop, s: Math.min(1, f * 8, (1 - f) * 8), q: q.setFromAxisAngle(axis, f * 6) }; };
};

// ---------- palette ----------
const K = {
  stone: '#efe6d6', stoneDk: '#d8ccb6', white: '#f8f6f1', ink: '#2b2f36', dark: '#3a3f47', steel: '#a9b1bb', steelDk: '#7d8792',
  gold: '#f0c24a', goldDk: '#c99a2e', red: '#e5533d', redDk: '#b83a2a', blue: '#3d7be0', blueDk: '#2a5bb0', sky: '#8cc8f0',
  green: '#5fae5b', greenDk: '#3f7f43', money: '#7cbf7d', moneyDk: '#4f9258', wood: '#9a6a41', woodDk: '#6f4a2c',
  cream: '#fbf3e3', orange: '#f29a3a', purple: '#8a6cf0', purpleLt: '#c3b4ff', pink: '#f39ab8', teal: '#3fb8a8', yellow: '#ffd23f', tan: '#e2b37a', brown: '#8a5a36',
};

export const withDetail = (detail, make) => { const was = DETAIL; DETAIL = detail; try { return make(); } finally { DETAIL = was; } };
export { THREE, V, BRAND, part, merge, place, box, cyl, lathe, tube, ball, cone, torus, extrude, prism, star, beam, ring, faceted, hi,
  TAU, clamp01, cyc, win, easeIn, easeOut, easeIO, back, bump, hop, life, legacy, K };

