// Low-poly signature models: several shapes per kind of company (about 10 units tall, built at
// the origin), plus optional moving parts (wings that flap, blades that spin, phones that fall).
// Geometry carries vertex colours; parts painted 'A'/'B' (and darker 'Ad'/'Bd') take the
// company's own two brand colours in the shader, so one geometry serves many companies.
import * as THREE from 'three';
import { V, part, windy, rand, taper, leafShape, shade, tuft, merge, place, box, cyl, lathe, tube, ball, cone, torus, extrude, prism, star, beam, ring, faceted, hi, TAU, cyc, win, easeIn, easeOut, easeIO, back, bump, hop, life, legacy, K, withDetail } from './kit.js';
import { HEROES } from './heroes.js';
import { SCENES } from './scenes.js';


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
      ),
      moving: [
        // Loose bills slip off the stack and flutter away.
        ...[1, -1].map((side, i) => ({ geo: part(box(2.2, 0.08, 1.1), i ? '#86c788' : K.money), pivot: [side * 1.6, 6.2, -0.6], anim: (t) => {
          const f = cyc(t, 3.4, i * 0.5), k = win(f, 0.05, 0.95);
          return { x: side * (k * 3 + Math.sin(k * TAU) * 0.8), y: -k * 6.4, z: -k * 2.6, rx: Math.sin(t * 6 + i) * 0.8, ry: k * 3 * side, rz: Math.sin(t * 4.3 + i) * 0.5, s: life(f, 0.04, 0.12, 0.82, 0.95) };
        } })),
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
  ),
  // Paid: coins keep dropping onto the stack.
  moving: [{ geo: part(cyl(0.9, 0.9, 0.3, 20), K.gold), pivot: [4.4, 2.07, 2.4], anim: (t) => {
    const f = cyc(t, 1.8), k = win(f, 0, 0.35);
    return { y: (1 - easeIn(k)) * 6 + hop(win(f, 0.35, 0.45)) * 0.4, rx: (1 - k) * 4, s: life(f, 0, 0.05, 0.85, 0.98) };
  } }] }),
  insurance: () => ({
    move: (t) => ({ rz: Math.sin(t * 1.2) * 0.02 }),
    // Rain: drops land on the canopy (and on the ground around it) and splash.
    moving: [[1.6, 0.4], [3.4, 1.9], [2.6, 3.6], [4.4, 4.2], [5.2, 5.3], [1.2, 2.2], [4, 0.9], [2.6, 5.6], [7, 0.3], [6.8, 2.4], [7.4, 4.4], [6.6, 5.9]].map(([r, a], i) => {
      const x = Math.cos(a) * r, z = Math.sin(a) * r, hit = r < 6 ? 10.8 - r * 0.4 : 0.1;
      return { geo: part(ball(0.17, 1), '#6fb4e8', { s: [1, 2.4, 1] }), pivot: [x, hit, z], anim: (t) => {
        const f = cyc(t, 0.95, i * 0.379), k = win(f, 0.72, 1);
        return f < 0.72 ? { y: (1 - f / 0.72) * (16 - hit) } : { sx: 1 + k * 2.4, sz: 1 + k * 2.4, sy: 0.3 * (1 - k), y: -0.15 };
      } };
    }),
    geo: merge(
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
  ),
  moving: [{ geo: part(new THREE.CapsuleGeometry(1.1, 3.6, 6, 16), (x, y) => (y > 0 ? 'B' : K.white), { r: [0, 0, -0.65] }), pivot: [2.6, 2.6, 1.6], anim: (t) => {
    const f = cyc(t, 2.6), k = win(f, 0.1, 0.5);
    return { y: hop(k) * 3, rz: -TAU * easeIO(k), sy: 1 - bump(f, 0.52, 0.03) * 0.15 };
  } }] }),
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
    parts.push(part(cyl(2.6, 2.6, 0.06, 20), '#1d1f24', { p: [-0.6, 0.43, 0.4] }));
    // A gusher: oil spurts from the top and rains down around the rig.
    return { geo: merge(parts), move: () => ({}),
      moving: Array.from({ length: 9 }, (_, i) => ({ geo: part(ball(0.32, 1), '#1d1f24', { s: [1, 1.4, 1] }), pivot: [0, 11, 0], anim: (t) => {
        const f = cyc(t, 1.5, i / 9), a = i * 2.4, r = 2.2 + (i % 3) * 0.7;
        return { x: Math.cos(a) * r * f, z: Math.sin(a) * r * f, y: 10 * f * (1 - f) - 10.5 * f * f, s: life(f, 0, 0.08, 0.85, 1) * (0.8 + (i % 3) * 0.2) };
      } })) };
  },
  power: () => ({
    geo: merge(
      part(cyl(0.22, 0.45, 10, 12), K.white, { p: [0, 5, 0] }), part(box(0.9, 0.8, 1.8), 'A', { p: [0, 10.2, -0.3] }),
      ring(3, (a, i) => part(box(1.6, 0.06, 1), 'B', { p: [-3 + i * 1.8, 0.7, 2.6], r: [-0.5, 0, 0] })),
      ring(3, (a, i) => part(box(0.1, 0.6, 0.1), K.steelDk, { p: [-3 + i * 1.8, 0.3, 2.6] })),
    ),
    spin: { geo: merge(part(ball(0.35, 0), K.white), ring(3, (a) => part(box(0.35, 4.6, 0.12), K.white, { p: [Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0], r: [0, 0, a - Math.PI / 2] }))), pivot: [0, 10.2, 0.75], axis: [0, 0, 1], speed: 1.2 },
  }),
  retail: () => ({ geo: part(box(10.4, 0.1, 5.2), '#e8dcc6', { p: [0, 0.05, 0] }), move: () => ({}), moving: rolling(merge(
    beam([-3, 2, -1.8], [3.4, 2, -1.8], 0.16, 'A'), beam([-3, 2, 1.8], [3.4, 2, 1.8], 0.16, 'A'), beam([-3, 2, -1.8], [-3, 2, 1.8], 0.16, 'A'), beam([3.4, 2, -1.8], [3.4, 2, 1.8], 0.16, 'A'),
    beam([-3.6, 5.6, -2.2], [4.2, 5.6, -2.2], 0.16, 'A'), beam([-3.6, 5.6, 2.2], [4.2, 5.6, 2.2], 0.16, 'A'), beam([-3.6, 5.6, -2.2], [-3.6, 5.6, 2.2], 0.16, 'A'), beam([4.2, 5.6, -2.2], [4.2, 5.6, 2.2], 0.16, 'A'),
    ...[-3, 3.4].flatMap((x, i) => [beam([x, 2, -1.8], [x + (i ? 0.8 : -0.6), 5.6, -2.2], 0.14, 'A'), beam([x, 2, 1.8], [x + (i ? 0.8 : -0.6), 5.6, 2.2], 0.14, 'A')]),
    ring(5, (a, i) => beam([-2 + i * 1.2, 2, -1.8], [-2.3 + i * 1.5, 5.6, -2.2], 0.08, K.white)),
    ring(5, (a, i) => beam([-2 + i * 1.2, 2, 1.8], [-2.3 + i * 1.5, 5.6, 2.2], 0.08, K.white)),
    part(box(6.4, 0.1, 3.6), '#f6d7cf', { p: [0.2, 2.05, 0] }),
    beam([-3.6, 5.6, -2.2], [-5, 6.6, -2.2], 0.16, K.dark), beam([-3.6, 5.6, 2.2], [-5, 6.6, 2.2], 0.16, K.dark), part(cyl(0.22, 0.22, 4.8, 10), K.dark, { p: [-5, 6.6, 0], r: [Math.PI / 2, 0, 0] }),
    beam([-2.6, 2, 0], [-2.6, 0.6, 0], 0.18, K.dark), beam([3, 2, 0], [3, 0.6, 0], 0.18, K.dark),
    part(box(1.8, 2.2, 1.4), K.orange, { p: [-1, 3.2, -0.6] }), part(box(1.4, 1.6, 1.2), 'B', { p: [1.2, 2.9, 0.6] }), part(box(1.6, 2.6, 0.8), K.green, { p: [2.2, 3.4, -0.8], r: [0, 0.3, 0.1] }),
  ), [[-2.6, 0.5, -1.6, 0.5], [-2.6, 0.5, 1.6, 0.5], [3, 0.5, -1.6, 0.5], [3, 0.5, 1.6, 0.5]], (r) => merge(wheel([0, 0, 0], r, 0.3)), { reach: 1.1, speed: 1.1, bounce: 0.04 }) }),
  parcel: () => ({ geo: merge(
    part(box(5.4, 4.4, 5.4), '#c99a62', { p: [0, 2.2, 0] }), part(box(5.45, 4.42, 1), '#ead8b5', { p: [0, 2.21, 0] }),
    part(box(5.4, 0.12, 2.7), '#b98a52', { p: [0, 4.9, -3.4], r: [-0.9, 0, 0] }), part(box(5.4, 0.12, 2.7), '#b98a52', { p: [0, 4.9, 3.4], r: [0.9, 0, 0] }),
    part(box(2.7, 0.12, 5.4), '#d4a76d', { p: [-3.4, 4.9, 0], r: [0, 0, 0.9] }), part(box(2.7, 0.12, 5.4), '#d4a76d', { p: [3.4, 4.9, 0], r: [0, 0, -0.9] }),
    part(box(2.2, 2, 2.2), '#d9ab70', { p: [-0.6, 5.2, 0.4], r: [0, 0.4, 0.15] }), part(box(1.4, 1.4, 1.4), '#c58f55', { p: [1, 6.4, -0.6], r: [0.3, 0.2, 0] }), part(box(0.9, 0.9, 0.9), '#e2bb84', { p: [0.2, 7.6, 0.5], r: [0.1, 0.8, 0.3] }),
  ),
  // A delivery truck keeps lapping the box.
  moving: [
    { geo: null, pivot: [0, 0, 0], anim: (t) => ({ ry: t * 0.55 }) },
    { geo: merge(part(box(3, 2, 1.8), K.white, { p: [-0.8, 1.3, 0] }), part(box(1.2, 1.4, 1.8), 'B', { p: [1.2, 1, 0] }), part(box(0.05, 0.7, 1.4), '#9dd0f2', { p: [1.82, 1.3, 0] }), part(box(1.4, 0.8, 0.05), 'A', { p: [-0.8, 1.4, 0.92] }),
      wheel([-1.2, 0.4, -0.9], 0.4, 0.3), wheel([-1.2, 0.4, 0.9], 0.4, 0.3), wheel([1.1, 0.4, -0.9], 0.4, 0.3), wheel([1.1, 0.4, 0.9], 0.4, 0.3)).rotateY(Math.PI / 2),
      pivot: [5.6, 0, 0], parent: 0, anim: (t) => ({ y: Math.abs(Math.sin(t * 9)) * 0.06 }) },
  ] }),
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
    // The plane circles the control tower, banked into the turn; the tower's beacon blinks.
    move: () => ({}),
    moving: [
      { geo: null, pivot: [0, 0, 0], anim: (t) => ({ ry: -0.45 * t }) },
      { geo: merge(
        part(new THREE.CapsuleGeometry(0.75, 6, 6, 14), K.white, { r: [Math.PI / 2, 0, 0] }),
        part(box(7.4, 0.14, 1.6), '#e8edf3', { p: [0, -0.2, 0.2] }), part(box(2.8, 0.12, 0.9), '#e8edf3', { p: [0, 0.1, -3.2] }),
        part(box(0.14, 1.6, 1.2), 'B', { p: [0, 0.9, -3.3] }),
        part(cyl(0.38, 0.38, 1.2, 12), K.steel, { p: [-2, -0.5, 0.5], r: [Math.PI / 2, 0, 0] }), part(cyl(0.38, 0.38, 1.2, 12), K.steel, { p: [2, -0.5, 0.5], r: [Math.PI / 2, 0, 0] }),
        ring(7, (a, i) => part(box(0.04, 0.22, 0.26), K.ink, { p: [0.77, 0.15, 2.2 - i * 0.6] })),
        part(cone(0.75, 1.1, 14), 'B', { p: [0, 0, 3.55], r: [Math.PI / 2, 0, 0] }),
      ), pivot: [4.6, 9, 0], parent: 0, anim: (t) => ({ rz: 0.32 + Math.sin(t * 1.3) * 0.08, y: Math.sin(t * 0.9) * 0.4 }) },
      { geo: part(ball(0.22, 1), K.red), pivot: [0, 9.35, 0], anim: (t) => ({ s: cyc(t, 1.2) < 0.15 ? 1.6 : 0.8 }) },
    ],
  }),
  casino: () => {
    // A die with pips on every face (0.5 is the pip inset from a face).
    const die = (s, body, pip) => {
      const h = s / 2, o = s * 0.27, faces = [[0, 1, 0, [[0, 0]]], [0, -1, 0, [[-o, -o], [o, o], [-o, o], [o, -o], [0, -o], [0, o]]], [1, 0, 0, [[-o, -o], [o, o]]], [-1, 0, 0, [[-o, -o], [0, 0], [o, o]]], [0, 0, 1, [[-o, -o], [o, o], [-o, o], [o, -o]]], [0, 0, -1, [[-o, -o], [o, o], [-o, o], [o, -o], [0, 0]]]];
      return merge(part(box(s, s, s), body), faces.flatMap(([nx, ny, nz, pips]) => pips.map(([u, v]) => part(ball(s * 0.08, 1), pip, { p: nx ? [nx * h, u, v] : ny ? [u, ny * h, v] : [u, v, nz * h], s: nx ? [0.4, 1, 1] : ny ? [1, 0.4, 1] : [1, 1, 0.4] }))));
    };
    const roll = (delay) => (t) => { const f = cyc(t, 3, delay), k = win(f, 0.08, 0.5); return { y: hop(k) * 3.4, rx: easeOut(k) * TAU, rz: easeOut(k) * Math.PI, ry: 0.5 - easeOut(k) * 0.6 }; };
    return { geo: merge(
      ring(9, (a, i) => part(cyl(1.1, 1.1, 0.32, 20), i % 3 === 0 ? K.ink : i % 3 === 1 ? 'A' : 'B', { p: [-3.6, 0.16 + i * 0.34, 3] })),
      ring(4, (a, i) => part(cyl(1.1, 1.1, 0.32, 20), i % 2 ? K.green : K.ink, { p: [3.6, 0.16 + i * 0.34, -3] })),
      part(box(9.6, 0.1, 8.4), '#2f7d4f', { p: [0, 0.05, 0] })),
      move: () => ({}),
      moving: [
        { geo: die(4, K.white, 'A'), pivot: [-1.4, 2.1, -0.4], anim: roll(0) },
        { geo: die(3, 'A', K.white), pivot: [2.4, 1.6, 1.4], anim: roll(0.06) },
        { geo: part(cyl(1.1, 1.1, 0.32, 20), K.green), pivot: [3.6, 1.52, -3], anim: (t) => { const f = cyc(t, 2.2, 0.5), k = win(f, 0.1, 0.55); return { y: hop(k) * 2.6, rx: easeOut(k) * TAU }; } },
      ] };
  },
  // A test hop: the engine lights, the rocket lifts off, hovers, and lands back on its pad.
  rocket: () => {
    const f7 = (t) => cyc(t, 7), alt = (f) => 4.2 * easeIO(win(f, 0.2, 0.48)) * (1 - easeIO(win(f, 0.56, 0.86)));
    const burning = (f) => f > 0.14 && f < 0.88;
    return { geo: merge(
      part(cyl(3.4, 3.8, 0.8, 20), K.steelDk, { p: [0, 0.4, 0] }),
      beam([3, 0.8, -1], [3, 9, -1], 0.3, K.steel), beam([3, 0.8, 1], [3, 9, 1], 0.3, K.steel), ring(5, (a, i) => beam([3, 1.5 + i * 1.6, -1], [3, 2.3 + i * 1.6, 1], 0.12, K.steel)),
    ),
    move: () => ({}),
    moving: [
      { geo: merge(
        part(cyl(1.25, 1.35, 7, 20), K.white, { p: [0, 4.1, 0] }), part(cone(1.25, 2.8, 20), 'A', { p: [0, 9, 0] }),
        part(cyl(0.5, 0.5, 0.15, 16), '#7fc3ea', { p: [0, 6, 1.25], r: [Math.PI / 2, 0, 0] }), part(cyl(1.27, 1.27, 0.4, 20), 'A', { p: [0, 3.2, 0] }),
        ring(4, (a) => part(extrude([[0, 0], [1.6, 0], [0, 2.4]], 0.18), 'A', { p: [Math.cos(a) * 1.2, 0.7, Math.sin(a) * 1.2], r: [0, -a, 0] })),
        part(cone(0.9, 1, 16), K.dark, { p: [0, 0.3, 0], r: [Math.PI, 0, 0] })),
        pivot: [0, 0.8, 0], anim: (t) => { const f = f7(t), shake = f > 0.12 && f < 0.22 ? Math.sin(t * 70) * 0.05 : 0; return { y: alt(f), x: shake, rz: Math.sin(t * 2) * 0.02 * (alt(f) > 0.1 ? 1 : 0) }; } },
      { geo: merge(part(cone(0.85, 2.4, 14), K.orange, { p: [0, -1.2, 0], r: [Math.PI, 0, 0] }), part(cone(0.5, 1.6, 12), K.yellow, { p: [0, -0.9, 0], r: [Math.PI, 0, 0] })), pivot: [0, -0.3, 0], parent: 0,
        anim: (t) => { const f = f7(t); return { s: burning(f) ? 1 : 0, sy: burning(f) ? 0.8 + Math.sin(t * 31) * 0.2 + (alt(f) > 0.2 ? 0.5 : 0) : 0 }; } },
      ...ring(5, (a, i) => ({ geo: part(ball(0.9, 1), '#eeeae4'), pivot: [Math.cos(a) * 2.6, 1.1, Math.sin(a) * 2.6], anim: (t) => {
        const f = f7(t), puff = Math.max(win(f, 0.14, 0.3) * (1 - win(f, 0.4, 0.6)), win(f, 0.7, 0.86) * (1 - win(f, 0.9, 1)));
        return { s: 1 + puff * 1.2, x: Math.cos(a) * puff * 1.4, z: Math.sin(a) * puff * 1.4, y: puff * 0.3 };
      } })),
    ] };
  },
  chip: () => ({
    geo: merge(part(box(8, 0.5, 8), '#2f6b4a', { p: [0, 0.25, 0] }), ring(10, (a, i) => part(box(0.12, 0.52, 3.6), K.gold, { p: [-3.6 + i * 0.8, 0.26, i % 2 ? 2.2 : -2.2] })), part(cyl(0.5, 0.7, 2.4, 12), K.steel, { p: [0, 1.7, 0] })),
    spin: { geo: merge(
      part(box(5, 0.6, 5), 'A', { p: [0, 3.6, 0] }), part(box(3, 0.3, 3), '#c9ccd2', { p: [0, 4.05, 0] }), part(box(1.4, 0.32, 1.4), K.gold, { p: [0, 4.1, 0] }),
      ...[-1, 1].flatMap((sgn) => ring(8, (a, i) => [part(box(0.22, 0.12, 0.8), K.gold, { p: [-2.1 + i * 0.6, 3.5, sgn * 2.8] }), part(box(0.8, 0.12, 0.22), K.gold, { p: [sgn * 2.8, 3.5, -2.1 + i * 0.6] })])),
    ), pivot: [0, 0, 0], axis: [0, 1, 0], speed: 0.4 },
  }),
  computer: () => ({ geo: merge(
    part(box(8, 0.4, 5.4), 'A', { p: [0, 0.2, 0] }), part(box(6.8, 0.1, 2.6), K.dark, { p: [0, 0.42, -0.6] }), part(box(2.4, 0.06, 1.4), '#b3b9c2', { p: [0, 0.42, 1.6] }),
  ),
  moving: [{ geo: merge(
    part(box(8, 5.2, 0.3), 'A', { p: [0, 2.8, -2.9], r: [-0.22, 0, 0] }), part(box(7.4, 4.6, 0.05), (x, y) => (y > 3.6 ? '#7cc0ff' : 'B'), { p: [0, 2.85, -2.7], r: [-0.22, 0, 0] }),
    part(box(2.2, 1.4, 0.06), K.white, { p: [-1.8, 3.6, -2.6], r: [-0.22, 0, 0] }), part(box(2.2, 0.4, 0.06), K.yellow, { p: [1.6, 3.9, -2.65], r: [-0.22, 0, 0] }), part(box(2.2, 0.4, 0.06), K.white, { p: [1.6, 3.2, -2.5], r: [-0.22, 0, 0] }),
  ).translate(0, -0.4, 2.35), pivot: [0, 0.4, -2.35], anim: (t) => { const f = cyc(t, 5); return { rx: 1.72 * easeIO(win(f, 0.55, 0.68)) * (1 - back(win(f, 0.8, 0.96))) }; } }] }),
  software: () => ({ geo: merge(
    cloud(8, 1.15), ring(5, (a, i) => part(cyl(0.08, 0.08, 6.4, 6), i % 2 ? 'A' : 'B', { p: [-2.4 + i * 1.2, 3.6, (i % 3) - 1] })),
    part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }), part(cyl(2.2, 2.2, 0.52, 24), 'B', { p: [0, 0.27, 0] }),
  ),
  // Uploads and downloads: packets ride the cables to and from the cloud.
  moving: Array.from({ length: 5 }, (_, i) => ({ geo: part(box(0.45, 0.45, 0.45), i % 2 ? 'A' : 'B'), pivot: [-2.4 + i * 1.2, 0.6, (i % 3) - 1], anim: (t) => {
    const f = cyc(t, 1.7, i * 0.31), k = i % 2 ? f : 1 - f;
    return { y: k * 6.2, ry: t * 3, s: life(f, 0, 0.1, 0.88, 1) };
  } })) }),
  // A storm cloud raining phones and headsets onto an old telephone.
  comms: () => {
    const phone = () => merge(part(box(1.5, 0.25, 2.9), K.ink), part(box(1.25, 0.26, 2.4), '#7cc0ff', { p: [0, 0.01, -0.06] }));
    const headset = () => merge(part(torus(1.1, 0.18, Math.PI, 16), K.ink), part(cyl(0.55, 0.55, 0.45, 14), 'A', { p: [1.1, -0.05, 0], r: [0, 0, Math.PI / 2] }), part(cyl(0.55, 0.55, 0.45, 14), 'A', { p: [-1.1, -0.05, 0], r: [0, 0, Math.PI / 2] }));
    const drops = [[-2.6, 0.4, phone], [1.8, 1.2, headset], [0.2, -1.8, phone], [3.4, -0.8, phone], [-1.2, 2.2, headset], [-3.6, -1.4, headset], [2.4, 2.6, phone]];
    return {
      geo: merge(
        cloud(10.5, 1.25, '#f3f5f8', '#b9c3cf'),
        part(box(3.6, 1.4, 2.4), 'A', { p: [0, 0.7, 0] }), part(cyl(1, 1, 0.3, 16), K.white, { p: [0, 1.45, 0.3] }),
      ),
      moving: [{ geo: merge(part(cyl(0.4, 0.4, 3.4, 10), 'A', { r: [0, 0, Math.PI / 2] }), part(box(0.9, 0.6, 1), 'A', { p: [1.6, 0.1, 0] }), part(box(0.9, 0.6, 1), 'A', { p: [-1.6, 0.1, 0] })), pivot: [0, 2.1, -0.6], anim: (t) => {
        const f = cyc(t, 1.6), ringing = f < 0.35 ? 1 : 0;
        return { y: Math.abs(Math.sin(t * 38)) * 0.35 * ringing, rz: Math.sin(t * 47) * 0.1 * ringing };
      } }].concat(drops.map(([x, z, make], i) => ({ geo: make(), pivot: [x, 9, z], axis: [1, 0.3, 0.2], mode: 'drop', drop: 8.2, speed: 0.35, phase: i / drops.length }))),
    };
  },
  social: () => ({ geo: merge(
    part(box(3.6, 7.2, 0.5), K.ink, { p: [-0.8, 3.8, 0], r: [-0.1, 0.2, 0] }), part(box(3.2, 6.2, 0.05), (x, y) => (y > 5.8 ? '#8fb7ff' : '#dfe8ff'), { p: [-0.75, 3.85, 0.28], r: [-0.1, 0.2, 0] }),
    part(box(3.2, 2, 0.5), K.white, { p: [2.4, 7.6, 1] }), part(cone(0.4, 0.8, 4), K.white, { p: [1.4, 6.4, 1], r: [Math.PI, 0, 0] }),
    part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }),
  ),
  moving: (() => {
    const heart = (k) => merge(part(ball(0.75 * k, 2), 'A', { p: [-0.55 * k, 0.4 * k, 0] }), part(ball(0.75 * k, 2), 'A', { p: [0.55 * k, 0.4 * k, 0] }), part(cone(1.1 * k, 1.4 * k, 4), 'A', { p: [0, -0.6 * k, 0], r: [Math.PI, Math.PI / 4, 0] }));
    return [
      { geo: heart(1), pivot: [3.35, 4.2, 1.6], anim: (t) => { const f = cyc(t, 2); return { s: 1 + bump(f, 0.08, 0.04) * 0.35 + bump(f, 0.22, 0.04) * 0.2 }; } },
      ...[0, 1, 2].map((i) => ({ geo: heart(0.35), pivot: [3.35, 5, 1.6], anim: (t) => { const f = cyc(t, 2.4, i / 3); return { y: f * 4.5, x: Math.sin(f * 9 + i * 2) * 0.6 + (i - 1) * 0.8, s: life(f, 0, 0.15, 0.6, 1) }; } })),
    ];
  })() }),
  media: () => ({ geo: merge(
    beam([0, 5, 0], [-2.2, 0, -1.4], 0.22, K.dark), beam([0, 5, 0], [2.2, 0, -1.4], 0.22, K.dark), beam([0, 5, 0], [0, 0, 2.4], 0.22, K.dark),
    part(box(3.6, 2.4, 2), K.ink, { p: [0, 6.2, 0] }), part(cyl(0.8, 1.1, 1.6, 16), K.dark, { p: [0, 6.2, 1.8], r: [Math.PI / 2, 0, 0] }), part(cyl(0.7, 0.7, 0.1, 16), '#7cc0ff', { p: [0, 6.2, 2.62], r: [Math.PI / 2, 0, 0] }),

    part(box(3.4, 0.5, 2.4), (x, y, z, i) => (Math.floor(x + 10) % 2 ? K.ink : K.white), { p: [3.2, 0.7, 2.6], r: [0, 0.3, 0] }), part(box(3.4, 0.5, 2.4), K.ink, { p: [3.2, 1.4, 2.2], r: [-0.5, 0.3, 0] }),
    part(cyl(1.2, 0.9, 2, 12), (x, y) => (Math.floor(y * 2) % 2 ? 'A' : K.white), { p: [-3.4, 1, 2.4] }), part(ball(1.1, 1), K.cream, { p: [-3.4, 2.2, 2.4] }),
  ),
  // Rolling: the reels turn, and a kernel of popcorn pops now and then.
  moving: [
    ...[[-0.9, 8.6, 1.4], [1.3, 8.4, 1.1]].map(([x, y, r]) => ({ geo: merge(part(cyl(r, r, 0.4, 20), K.dark, { r: [0, 0, Math.PI / 2] }), part(cyl(r * 0.3, r * 0.3, 0.42, 10), K.steel, { r: [0, 0, Math.PI / 2] }), ring(3, (a) => part(cyl(r * 0.2, r * 0.2, 0.44, 8), K.steelDk, { p: [0, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62], r: [0, 0, Math.PI / 2] }))), pivot: [x, y, 0], anim: (t) => ({ rx: -t * 2.2 }) })),
    ...[0, 1].map((i) => ({ geo: part(ball(0.35, 1), K.cream), pivot: [-3.4, 3, 2.4], anim: (t) => { const f = cyc(t, 1.7, i * 0.5), k = win(f, 0, 0.6); return { y: hop(k) * 2.4 - k * 2.6, x: (i ? 1 : -1) * k * 2, s: life(f, 0, 0.05, 0.6, 0.7) }; } })),
  ] }),
  food: () => ({ geo: merge(
    part(cyl(3.1, 3, 1, 24), '#e2a65a', { p: [0, 0.5, 0] }), part(cyl(3.35, 3.35, 0.9, 24), '#6b3b22', { p: [0, 1.45, 0] }),
    part(box(4.6, 0.18, 4.6), '#f6c443', { p: [0, 2, 0], r: [0, Math.PI / 4, 0] }), part(cyl(3.5, 3.5, 0.25, 12), '#6cbf4b', { p: [0, 2.2, 0] }), part(cyl(3.1, 3.1, 0.3, 24), 'A', { p: [0, 2.45, 0] }),
    part(box(2, 2.4, 1.4), 'A', { p: [4.4, 1.2, 2.2], r: [0, -0.3, 0] }), ring(7, (a, i) => part(box(0.22, 2, 0.22), '#f3c443', { p: [3.8 + (i % 4) * 0.35, 2.9, 1.8 + (i % 2) * 0.5], r: [0.1 * (i % 3), 0, 0.12 * ((i % 2) * 2 - 1)] })),
  ),
  // Order up: the top bun hops off and slaps back down on the stack.
  moving: [{ geo: merge(part(new THREE.SphereGeometry(3.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#e8ad5f', { s: [1, 0.75, 1] }),
    ring(12, (a, i) => part(ball(0.16, 0), K.cream, { p: [Math.cos(a) * (1 + (i % 3) * 0.6), 1.9 - (i % 3) * 0.35, Math.sin(a) * (1 + (i % 3) * 0.6)], s: [1.5, 0.6, 1] }))),
    pivot: [0, 2.6, 0], anim: (t) => { const f = cyc(t, 2.4), k = win(f, 0.1, 0.45); return { y: hop(k) * 2.4, rz: hop(k) * 0.25, rx: hop(k) * -0.1 }; } }],
  move: (t) => { const s = bump(cyc(t, 2.4), 0.46, 0.03) * 0.08; return { sy: 1 - s, sx: 1 + s * 0.5, sz: 1 + s * 0.5 }; } }),
  drink: () => ({ geo: merge(
    part(cyl(2.4, 1.8, 7.4, 24), (x, y) => (y > 2.6 && y < 4.4 ? K.white : 'A'), { p: [0, 3.7, 0] }),
    part(cyl(2.55, 2.55, 0.5, 24), K.white, { p: [0, 7.6, 0] }), part(cyl(1.4, 1.4, 0.55, 24), '#eef0f2', { p: [0, 7.7, 0] }),
  ),
  moving: [
    { geo: part(cyl(0.2, 0.2, 5, 10), (x, y) => (Math.floor((y + 9.6) * 1.6) % 2 ? 'A' : K.white), { p: [0, 2.5, 0] }), pivot: [0, 7.3, 0], anim: (t) => ({ rz: -0.35 + Math.sin(t * 1.3) * 0.12, rx: Math.cos(t * 1.1) * 0.1, y: Math.max(0, Math.sin(t * 3)) * 0.2 }) },
    { geo: merge(ring(5, (a) => part(box(1, 1, 1), '#d6eef9', { p: [Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4], r: [0.4, a, 0.2] }))), pivot: [0, 0.5, 0], anim: (t) => ({ ry: t * 0.5, y: Math.abs(Math.sin(t * 2)) * 0.25 }) },
  ] }),
  care: () => ({ geo: merge(
    part(cyl(2, 2.2, 6, 20), 'A', { p: [0, 3, 0] }), part(cyl(2.05, 2.05, 2.2, 20), K.white, { p: [0, 3, 0] }),
    part(cyl(0.8, 0.9, 1, 14), K.white, { p: [0, 6.5, 0] }),
    part(cyl(1.2, 1.3, 3.4, 16), 'B', { p: [3.4, 1.7, 1.4] }), part(cyl(0.7, 0.7, 0.8, 12), K.white, { p: [3.4, 3.8, 1.4] }),
  ),
  moving: (() => {
    const press = (t) => bump(cyc(t, 2.2), 0.15, 0.06);
    return [
      { geo: merge(part(cyl(0.25, 0.25, 1.4, 8), K.white, { p: [0, 0.6, 0] }), part(box(2, 0.5, 0.6), K.white, { p: [0.7, 1.3, 0] })), pivot: [0, 7, 0], anim: (t) => ({ y: -press(t) * 0.6 }) },
      ...[0, 1, 2, 3].map((i) => ({ geo: part(ball(0.4, 2), '#e8f6ff'), pivot: [1.7, 8.1, 0], anim: (t) => { const f = cyc(t, 2.2, -0.17 - i * 0.05), k = win(f, 0, 0.8); return { x: k * (0.8 + i * 0.4), y: k * (1.5 + i * 0.5) + Math.sin(k * 8 + i) * 0.2, z: (i - 1.5) * k * 0.6, s: (0.6 + i * 0.25) * life(f, 0, 0.08, 0.7, 0.8) }; } })),
    ];
  })() }),
  farm: () => ({ geo: merge(
    part(box(6, 4.6, 5), 'A', { p: [-1, 2.3, 0] }), part(prism(6.8, 2.8, 5.4), '#6f2a22', { p: [-1, 4.6, 0], r: [0, Math.PI / 2, 0], s: [0.8, 1, 1.25] }),
    part(box(2.2, 3, 0.05), '#3a2a20', { p: [-1, 1.5, 2.52] }), part(box(4.8, 0.14, 0.14), K.dark, { p: [-1.6, 3.1, 2.62] }), beam([-1, 7.3, 0], [-1, 8.6, 0], 0.1, K.dark),
    part(cyl(1.5, 1.5, 7.4, 18), '#c9ced6', { p: [3.6, 3.7, -0.6] }), part(new THREE.SphereGeometry(1.5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.steel, { p: [3.6, 7.4, -0.6] }),
    ring(5, (a, i) => part(cyl(0.18, 0.18, 0.08, 8), K.steelDk, { p: [3.6, 1.2 + i * 1.4, 0.92] })),
    part(cyl(0.9, 0.9, 1.4, 14), '#e3c169', { p: [2.6, 0.9, 3], r: [0, 0, Math.PI / 2] }), part(cyl(0.9, 0.9, 1.4, 14), '#e3c169', { p: [4.2, 0.9, 3.2], r: [0, 0, Math.PI / 2] }),
  ),
  moving: [
    { geo: merge(part(box(2.2, 3, 0.1), K.white, { p: [0, 1.5, 0] }), beam([-1.1, 0, 0.07], [1.1, 3, 0.07], 0.15, 'A'), beam([1.1, 0, 0.07], [-1.1, 3, 0.07], 0.15, 'A')), pivot: [-1, 0, 2.6], anim: (t) => { const f = cyc(t, 5); return { x: -2.3 * easeIO(win(f, 0.2, 0.36)) * (1 - easeIO(win(f, 0.7, 0.86))) }; } },
    { geo: merge(part(box(1.8, 0.12, 0.12), K.dark), part(cone(0.25, 0.5, 4), K.dark, { p: [0.95, 0, 0], r: [0, 0, -Math.PI / 2] }), part(box(0.5, 0.5, 0.05), K.dark, { p: [-0.8, 0.15, 0] }), part(ball(0.12, 1), K.gold, { p: [0, 0.2, 0] })), pivot: [-1, 8.6, 0], anim: (t) => ({ ry: Math.sin(t * 0.7) * 1.2 + Math.sin(t * 2.3) * 0.15 }) },
  ] }),
  industrial: () => {
    const gear = (r, teeth, w, color) => merge(part(cyl(r, r, w, 28), color, { r: [Math.PI / 2, 0, 0] }), part(cyl(r * 0.35, r * 0.35, w + 0.1, 14), K.dark, { r: [Math.PI / 2, 0, 0] }),
      ring(teeth, (a) => part(box(r * 0.28, r * 0.3, w), color, { p: [Math.cos(a) * (r + r * 0.12), Math.sin(a) * (r + r * 0.12), 0], r: [0, 0, a] })),
      ring(5, (a) => part(cyl(r * 0.16, r * 0.16, w + 0.04, 10), K.dark, { p: [Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 0], r: [Math.PI / 2, 0, 0] })));
    return {
      geo: merge(part(box(3, 0.6, 2.4), K.dark, { p: [0, 0.3, 0] }), beam([-0.8, 0.6, -0.4], [-0.3, 6, -0.4], 0.4, K.steelDk), beam([0.8, 0.6, -0.4], [0.3, 6, -0.4], 0.4, K.steelDk), beam([4.6, 0, -0.4], [4.6, 3.4, -0.4], 0.35, K.steelDk)),
      // Two gears in mesh: the small one turns faster, the other way.
      moving: [
        { geo: gear(3.6, 16, 1, 'A'), pivot: [0, 6.2, 0.2], anim: (t) => ({ rz: t * 0.5 }) },
        { geo: gear(2.2, 12, 0.8, K.steel), pivot: [4.6, 3.4, 0.2], anim: (t) => ({ rz: -t * 0.5 * (16 / 12) + 0.2 }) },
      ],
    };
  },
  chem: () => ({ geo: merge(
    part(cyl(1, 3.4, 5, 20), '#cfe9f2', { p: [0, 2.5, 0] }), part(cyl(0.95, 0.95, 2.6, 16), '#cfe9f2', { p: [0, 6.3, 0] }), part(cyl(1.15, 1.15, 0.4, 16), '#e6f4f8', { p: [0, 7.6, 0] }),
    part(cyl(2.15, 3.44, 2.7, 20), 'A', { p: [0, 1.35, 0] }),
    part(box(4.4, 0.4, 1.4), K.wood, { p: [4.2, 2.6, 1.2] }), beam([2.2, 0, 1.2], [2.2, 2.6, 1.2], 0.25, K.wood), beam([6.2, 0, 1.2], [6.2, 2.6, 1.2], 0.25, K.wood),
    ring(4, (a, i) => part(new THREE.CapsuleGeometry(0.3, 2.4, 4, 10), (x, y) => (y < 2.3 ? [K.pink, K.yellow, K.teal, K.purple][i] : '#e6f4f8'), { p: [2.8 + i * 1, 2.6, 1.2] })),
  ),
  // The reaction bubbles over: bubbles rise from the flask's mouth and pop.
  moving: Array.from({ length: 5 }, (_, i) => ({ geo: part(ball(0.45, 2), 'A'), pivot: [0, 7.8, 0], anim: (t) => {
    const f = cyc(t, 2.2, i / 5);
    return { y: f * 4, x: Math.sin(f * 7 + i * 2.1) * 0.6, z: Math.cos(f * 6 + i) * 0.4, s: (0.5 + f * 0.8) * (f > 0.9 ? 1 + (f - 0.9) * 6 : 1) * life(f, 0, 0.1, 0.94, 1) };
  } })) }),
  metal: () => {
    const ib = (len, p, r) => merge(part(box(len, 0.2, 1), '#b0643c', { p: [p[0], p[1] - 0.45, p[2]], r }), part(box(len, 0.2, 1), '#b0643c', { p: [p[0], p[1] + 0.45, p[2]], r }), part(box(len, 1, 0.2), '#97522f', { p, r }));
    return { geo: merge(
      ...Array.from({ length: 6 }, (_, i) => [ib(7, [0, 0.6 + i * 1.2, -1.8], [0, (i % 2) * Math.PI / 2, 0]), ib(7, [0, 0.6 + i * 1.2, 1.8], [0, (i % 2) * Math.PI / 2, 0])]).map((pair, i) => i % 2 ? pair.map((g) => g.clone().rotateY(Math.PI / 2)) : pair),
      ring(6, (a, i) => part(cyl(0.6, 0.9, 0.5, 4), i % 2 ? K.gold : '#cfd5dc', { p: [4.8 + (i % 3) * 0.9, 0.25 + Math.floor(i / 3) * 0.5, 3.6], r: [0, Math.PI / 4, 0], s: [1.4, 1, 0.8] })),
      part(box(0.5, 0.5, 0.5), K.ink, { p: [3.2, 4.4, 2.4] }), beam([3.2, 4.4, 2.4], [4.4, 6.4, 3.4], 0.2, K.dark)),
      // Welding: sparks spray from the torch and fall.
      moving: Array.from({ length: 10 }, (_, i) => ({ geo: part(box(0.16, 0.16, 0.16), i % 3 ? K.yellow : K.orange), pivot: [3.4, 4.2, 2.6], anim: (t) => {
        const f = cyc(t, 0.9, (i * 0.37) % 1), a = i * 2.4, v = 2 + (i % 4) * 0.6;
        return { x: Math.cos(a) * v * f, z: Math.sin(a) * v * f, y: v * 1.2 * f - 6 * f * f, s: (1 - f) * (cyc(t, 3) < 0.6 ? 1 : 0) };
      } })),
    };
  },
  house: () => ({ geo: merge(
    part(box(6, 4, 5), K.cream, { p: [0, 2, 0] }), part(prism(7, 3, 5.6), 'A', { p: [0, 4, 0] }), part(box(0.8, 2, 0.8), '#b0643c', { p: [1.8, 5.4, -1] }),
    part(box(1.2, 2.2, 0.1), K.wood, { p: [0, 1.1, 2.52] }), part(box(1.2, 1, 0.1), '#9dd0f2', { p: [-1.9, 2.4, 2.52] }), part(box(1.2, 1, 0.1), '#9dd0f2', { p: [1.9, 2.4, 2.52] }),
    part(cyl(0.12, 0.12, 3.2, 6), K.wood, { p: [4.4, 1.6, 2.6] }), part(box(2.2, 0.12, 0.12), K.wood, { p: [3.6, 3.1, 2.6] }),
    part(ball(1, 1), K.green, { p: [-4.2, 1.4, 1.8] }), part(cyl(0.15, 0.2, 0.8, 6), K.wood, { p: [-4.2, 0.4, 1.8] }),
  ),
  moving: [
    { geo: merge(part(box(1.8, 1.1, 0.1), 'A', { p: [0, -0.75, 0] }), beam([-0.7, 0, 0], [-0.7, -0.2, 0], 0.04, K.ink), beam([0.7, 0, 0], [0.7, -0.2, 0], 0.04, K.ink)), pivot: [3.4, 3, 2.6], anim: (t) => ({ rx: Math.sin(t * 1.6) * 0.25 }) },
    ...[0, 1, 2].map((i) => ({ geo: part(ball(0.5, 1), '#eeeae4'), pivot: [1.8, 6.6, -1], anim: (t) => { const f = cyc(t, 3, i / 3); return { y: f * 3.6, x: Math.sin(f * 5 + i) * 0.5 + f * 0.8, s: (0.5 + f * 0.9) * life(f, 0, 0.12, 0.6, 1) }; } })),
  ] }),
  // An assistant you talk to: a chat bubble with a glowing spark.
  ai: () => {
    const W = 8, H = 5.2, D = 1.4, r = 1.1, y0 = 3.2;
    const bubble = merge(
      part(box(W - 2 * r, H, D), K.cream, { p: [0, y0 + H / 2, 0] }), part(box(W, H - 2 * r, D), K.cream, { p: [0, y0 + H / 2, 0] }),
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => part(cyl(r, r, D, 16), K.cream, { p: [sx * (W / 2 - r), y0 + H / 2 + sy * (H / 2 - r), 0], r: [Math.PI / 2, 0, 0] })),
      part(extrude([[0, 0], [1.6, 0], [-0.4, -1.6]], D * 0.9), K.cream, { p: [-1.8, y0 + 0.05, 0] }),
      [2.0, 0.9].map((w, i) => part(box(w * 2.4, 0.42, 0.1), i ? '#c9bfae' : '#b3a893', { p: [-2.6 + w * 1.2, y0 + H - 1.2 - i * 0.9, D / 2 + 0.04] })),
    );
    const ray = (a, len, w) => part(box(w, len, w * 0.9), K.orange, { p: [Math.cos(a) * len / 2, Math.sin(a) * len / 2, 0], r: [0, 0, a - Math.PI / 2] });
    return {
      geo: merge(bubble, part(cyl(2.4, 2.8, 0.6, 24), K.white, { p: [0, 0.3, 0] }), part(cyl(0.35, 0.45, 2.6, 10), K.steel, { p: [0, 1.6, 0] })),
      moving: [
        { geo: merge(ring(8, (a, i) => ray(a, i % 2 ? 2.1 : 3.1, 0.6)), part(ball(0.75, 1), '#ffb38a')), pivot: [2.2, y0 + H / 2 - 0.2, D / 2 + 0.7], anim: (t) => ({ rz: t * 0.5, s: 1 + Math.max(0, Math.sin(t * 2.6)) * 0.12 }) },
        // "Thinking…": three dots bounce in turn.
        ...[0, 1, 2].map((i) => ({ geo: part(ball(0.32, 2), '#8c816e'), pivot: [-2.6 + i * 0.95, y0 + 1.1, D / 2 + 0.2], anim: (t) => ({ y: hop(win(cyc(t, 1.2, -i * 0.15), 0, 0.35)) * 0.45 }) })),
      ],
    };
  },
  // Search: a magnifying glass.
  search: () => ({ geo: part(cyl(3, 3.3, 0.6, 28), K.white, { p: [0, 0.3, 0] }), move: () => ({}),
    moving: [{ geo: merge(
      part(torus(2.8, 0.55, TAU, 36), 'A', { p: [0, 6, 0] }), part(cyl(2.5, 2.5, 0.2, 28), '#cfe9f7', { p: [0, 6, 0], r: [Math.PI / 2, 0, 0] }),
      part(box(0.9, 0.3, 0.1), '#ffffff', { p: [-0.9, 7, 0.12], r: [0, 0, 0.6] }), part(box(0.9, 0.3, 0.1), '#ffffff', { p: [0.9, 5, -0.12], r: [0, 0, 0.6] }),
      part(cyl(0.55, 0.65, 4, 14), K.ink, { p: [0, 1.8, 0] }), part(cyl(0.7, 0.7, 0.5, 14), 'B', { p: [0, 3, 0] }), part(cyl(0.56, 0.66, 1.2, 14), 'Ad', { p: [0, 2, 0] }),
    ), pivot: [0, 0.6, 0], anim: (t) => ({ x: Math.cos(t * 0.9) * 0.9, z: Math.sin(t * 0.9) * 0.9, y: 0.3 + Math.sin(t * 1.8) * 0.3, ry: Math.sin(t * 0.9) * 0.5, rz: -Math.cos(t * 0.9) * 0.12 }) }] }),
  // A VR headset.
  vr: () => ({ geo: part(cyl(3, 3.3, 0.5, 24), K.white, { p: [0, 0.25, 0] }), move: () => ({}),
    // Someone's in there: the headset looks around a virtual world.
    moving: [
      { geo: merge(
        part(box(7, 3.4, 3), K.ink), part(box(6.4, 2.8, 0.2), 'A', { p: [0, 0, 1.55] }),
        part(box(7.2, 3.6, 0.6), '#cfd5dc', { p: [0, 0, -1.6] }), part(cyl(0.9, 0.9, 0.4, 16), '#2b2f36', { p: [-1.6, 0, -2], r: [Math.PI / 2, 0, 0] }), part(cyl(0.9, 0.9, 0.4, 16), '#2b2f36', { p: [1.6, 0, -2], r: [Math.PI / 2, 0, 0] }),
        part(torus(3.6, 0.3, Math.PI, 24), K.dark, { p: [0, 0, -1.9], r: [Math.PI / 2, 0, 0] }),
      ), pivot: [0, 5.2, 0], anim: (t) => ({ y: Math.sin(t * 1.2) * 0.3, ry: Math.sin(t * 0.6) * 0.6 + Math.sin(t * 1.7) * 0.1, rx: Math.sin(t * 0.9) * 0.15, order: 'YXZ' }) },
      { geo: part(box(5.6, 0.25, 0.25), '#7cc0ff'), pivot: [0, 0.6, 1.66], parent: 0, anim: (t) => ({ x: Math.sin(t * 2.4) * 0.4, sx: 0.4 + Math.abs(Math.sin(t * 1.2)) * 0.6 }) },
    ] }),
  // Databricks: a stack of bricks.
  bricks: () => {
    const parts = [part(box(8.4, 0.4, 5.4), K.stoneDk, { p: [0, 0.2, 0] })];
    const laid = [];
    for (let layer = 0; layer < 5; layer++) {
      const w = 4 - Math.floor(layer / 1.5), off = (layer % 2) * 0.9;
      for (let i = 0; i < w; i++) for (let j = 0; j < 2; j++) {
        const at = [(i - (w - 1) / 2) * 1.85 + (layer % 2 ? 0.2 : 0), 0.85 + layer * 0.95, (j - 0.5) * 1.85 + off * 0.1], color = ['#d4583a', '#c24a30', '#e06a45'][(i + j + layer) % 3];
        if (layer >= 3) laid.push({ at, color }); else parts.push(part(box(1.75, 0.9, 1.75), color, { p: at }));
      }
    }
    // The top courses are laid one brick at a time, then cleared away for the next build.
    return { geo: merge(parts), moving: laid.map(({ at, color }, k) => ({ geo: part(box(1.75, 0.9, 1.75), color), pivot: at, anim: (t) => {
      const f = cyc(t, 6), d = win(f, 0.05 + k * 0.08, 0.13 + k * 0.08);
      return { y: (1 - easeIn(d)) * 5 + bump(f, 0.13 + k * 0.08, 0.012) * 0.15, rx: (1 - d) * 0.6, s: d > 0 ? 1 - easeIn(win(f, 0.9, 0.98)) : 0 };
    } })) };
  },
  robot: () => ({ geo: merge(
    part(box(1, 3, 1.2), K.steel, { p: [-1, 1.5, 0] }), part(box(1, 3, 1.2), K.steel, { p: [1, 1.5, 0] }), part(box(1.3, 0.5, 1.8), K.dark, { p: [-1, 0.25, 0.2] }), part(box(1.3, 0.5, 1.8), K.dark, { p: [1, 0.25, 0.2] }),
    part(box(4, 3.6, 2.4), K.white, { p: [0, 4.9, 0] }), part(box(2.2, 1.4, 0.1), '#7cc0ff', { p: [0, 5.2, 1.22] }),
    beam([-2.1, 6.2, 0], [-3.2, 3.6, 0.6], 0.6, K.steel), part(ball(0.55, 1), 'A', { p: [-3.3, 3.4, 0.6] }), part(box(4.05, 0.5, 2.45), 'B', { p: [0, 3.4, 0] }),
    part(box(2.8, 2.2, 2.2), K.white, { p: [0, 7.9, 0] }), part(box(2.2, 0.8, 0.1), K.ink, { p: [0, 8, 1.12] }),
    part(cyl(0.06, 0.06, 1.2, 6), K.dark, { p: [0, 9.6, 0] }),
  ),
  // It waves hello, blinks, and its antenna light pulses.
  moving: [
    { geo: merge(beam([0, 0, 0], [1.3, 1.8, 0.6], 0.6, K.steel), part(ball(0.55, 1), 'A', { p: [1.4, 2, 0.6] })), pivot: [2.1, 6.2, 0], anim: (t) => { const f = cyc(t, 3.5), w = f < 0.55 ? 1 : 0; return { rz: Math.sin(t * 9) * 0.35 * w - 0.1 }; } },
    ...[-0.5, 0.5].map((x) => ({ geo: part(ball(0.22, 1), '#7cf0ff'), pivot: [x, 8, 1.2], anim: (t) => ({ sy: bump(cyc(t, 2.9), 0.5, 0.025) > 0.3 ? 0.1 : 1 }) })),
    { geo: part(ball(0.25, 1), 'A'), pivot: [0, 10.3, 0], anim: (t) => ({ s: 1 + Math.max(0, Math.sin(t * 4)) * 0.5 }) },
  ] }),
  // A broad shade tree, grown procedurally: a curved trunk forks into branches and twigs, and
  // hundreds of lobed leaves gather in clusters at their ends, lighter on the outside and on top,
  // darker within. Grass grows at its foot, a few leaves lie fallen, and more drift down. Every
  // leaf and blade sways on its own in the wind (modelMaterial).
  tree: () => {
    const R = rand(11), bark = '#7a5233', greens = ['#8fd35f', '#7cc456', '#a6dc6e', '#9bd85f', '#b5e27a', '#86cc5f'], grass = ['#7fcf3f', '#6cc23a', '#94d84f', '#a6dc5e'];
    const wood = [], tips = [];
    const barkColor = (x, y, z) => shade(bark, 0.78 + 0.3 * Math.sin(y * 6 + Math.atan2(z, x) * 3) ** 2);
    const grow = (from, dir, len, r, depth) => {
      const to = from.clone().addScaledVector(dir, len);
      const mid = from.clone().lerp(to, 0.5).add(new V((R() - 0.5) * len * 0.22, 0, (R() - 0.5) * len * 0.22));
      wood.push(part(taper([from.toArray(), mid.toArray(), to.toArray()], r, r * 0.6), barkColor));
      if (depth === 0) { tips.push(to, from.clone().lerp(to, 0.5).add(new V(0, -0.35, 0))); return; }
      if (depth === 1) tips.push(from.clone().lerp(to, 0.6).add(new V(0, -0.5, 0)));
      // The crown spreads wide: early forks reach outwards, twigs droop at their ends.
      const kids = depth === 4 ? 3 : depth === 1 ? 2 : 3;
      for (let k = 0; k < kids; k++) {
        const a = (k / kids) * TAU + R() * 1.3 + depth, out = depth >= 3 ? 1 : 0.85;
        const rise = depth >= 3 ? 0.55 + R() * 0.35 : depth === 2 ? 0.25 + R() * 0.35 : -0.1 + R() * 0.3;
        const d = new V(Math.cos(a) * out, rise, Math.sin(a) * out).addScaledVector(dir, 0.35).normalize();
        grow(to, d, len * (0.68 + R() * 0.14), r * 0.62, depth - 1);
      }
    };
    grow(new V(0, -0.2, 0), new V(0.07, 1, 0.04).normalize(), 4.3, 0.6, 4);
    // Root flare where the trunk meets the ground.
    ring(5, (a) => wood.push(part(taper([[0, 0.9, 0], [Math.cos(a) * 0.7, 0.25, Math.sin(a) * 0.7], [Math.cos(a) * 1.4, 0.02, Math.sin(a) * 1.4]], 0.32, 0.06, 8), barkColor)));
    const center = tips.reduce((c, p) => c.add(p), new V()).multiplyScalar(1 / tips.length);
    const reach = Math.max(...tips.map((p) => p.distanceTo(center))) + 1.4;
    const blade = leafShape(5), leaves = [], up = new V(0, 0, 1), n = new V(), q = new THREE.Quaternion(), twist = new THREE.Quaternion();
    const perTip = hi() ? 17 : 5, size = hi() ? 0.82 : 1.4, spread = hi() ? 1.3 : 1.5;
    for (const tip of tips) {
      for (let i = 0; i < perTip; i++) {
        n.set(R() * 2 - 1, R() * 1.8 - 0.9, R() * 2 - 1).normalize();
        const at = tip.clone().addScaledVector(n, spread * (0.45 + 0.55 * Math.sqrt(R())));
        const outward = at.distanceTo(center) / reach, top = (at.y - center.y) / reach;
        const k = Math.min(1.12, Math.max(0.66, 0.7 + outward * 0.32 + top * 0.25 + (R() - 0.5) * 0.12));
        q.setFromUnitVectors(up, n.clone().add(new V(0, 0.35, 0)).normalize()).multiply(twist.setFromAxisAngle(up, R() * TAU));
        const g = part(blade, shade(greens[Math.floor(R() * greens.length)], k), { p: at.toArray(), q, s: size * (0.75 + R() * 0.45) });
        leaves.push(windy(g, 0.35 + outward * 0.65));
      }
    }
    // Grass in tufts around the foot of the trunk, and a few fallen leaves.
    const ground = [];
    for (let i = 0, nt = hi() ? 26 : 8; i < nt; i++) { const a = (i / nt) * TAU + R() * 0.5, d = 1.3 + R() * 3; ground.push(tuft(R, Math.cos(a) * d, Math.sin(a) * d, 0.6, hi() ? 22 : 7, grass, 0.8)); }
    for (let i = 0; i < 9; i++) { const a = R() * TAU, d = 1 + R() * 3.4; ground.push(part(blade, shade(greens[i % greens.length], 0.85), { p: [Math.cos(a) * d, 0.03, Math.sin(a) * d], r: [-Math.PI / 2 + (R() - 0.5) * 0.3, 0, R() * TAU], s: 0.8 })); }
    const drifting = [0, 1, 2, 3, 4].map((i) => tips[(i * 7 + 3) % tips.length]);
    return { geo: merge(wood, leaves, ground), move: (t) => ({ rz: Math.sin(t * 0.8) * 0.008 }),
      moving: drifting.map((tip, i) => ({ geo: part(blade, greens[i % greens.length], { s: 0.9 }), pivot: tip.toArray(), anim: (t) => {
        const f = cyc(t, 5.5, i / 5), fall = tip.y - 0.05, k = easeIn(Math.min(1, f / 0.8)) * 0.4 + Math.min(1, f / 0.8) * 0.6;
        return f < 0.8
          ? { y: -k * fall, x: Math.sin(f * 11 + i) * 0.9, z: Math.cos(f * 8 + i) * 0.6, rx: Math.sin(t * 4 + i) * 1.1, rz: Math.cos(t * 3.3 + i) * 0.9, ry: t * 1.5, s: Math.min(1, f * 12) }
          : { y: -fall, x: Math.sin(0.8 * 11 + i) * 0.9, z: Math.cos(0.8 * 8 + i) * 0.6, rx: -Math.PI / 2, s: 1 - win(f, 0.88, 1) };
      } })) };
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

// A vehicle that rolls to and fro, its wheels turning with the ground it covers. `wheels` are
// [x, y, z, r] and `wheel(r)` builds one at the origin; returns the moving parts.
const rolling = (body, wheels, wheel, { reach = 0.8, speed = 0.9, bounce = 0.05 } = {}) => {
  const x = (t) => Math.sin(t * speed) * reach;
  return [
    { geo: body, pivot: [0, 0, 0], anim: (t) => ({ x: x(t), y: Math.abs(Math.sin(t * 7)) * bounce, rz: -Math.cos(t * speed) * reach * speed * 0.02 }) },
    ...wheels.map(([wx, wy, wz, r]) => ({ geo: wheel(r), pivot: [wx, wy, wz], parent: 0, anim: (t) => ({ rz: -x(t) / r }) })),
  ];
};
const tireAt0 = (r) => merge(part(cyl(r, r, 0.5, 16), '#2b2b2e', { r: [Math.PI / 2, 0, 0] }), part(cyl(r * 0.5, r * 0.5, 0.54, 12), K.steel, { r: [Math.PI / 2, 0, 0] }), part(box(r * 0.9, 0.12, 0.56), K.steelDk));

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
    // A vault: the wheel spins, the door swings open on its gold, then locks again.
    () => {
      const bar = (x, y) => part(cyl(0.5, 0.7, 0.45, 4), K.gold, { p: [x, y, 0.75], r: [0, Math.PI / 4, 0], s: [1.6, 1, 0.5] });
      const door = merge(part(cyl(3.3, 3.3, 0.8, 32), '#c3c9d0', { p: [3.3, 0, 0], r: [Math.PI / 2, 0, 0] }), part(torus(3.3, 0.28, TAU, 40), 'A', { p: [3.3, 0, 0.45] }),
        ring(10, (a) => part(cyl(0.18, 0.18, 0.3, 8), K.steelDk, { p: [3.3 + Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0.5], r: [Math.PI / 2, 0, 0] })),
        [-1.8, 1.8].map((y) => part(box(0.7, 1.2, 1), K.steelDk, { p: [0, y, -0.1] })));
      const f6 = (t) => cyc(t, 6);
      return {
        geo: merge(part(box(9, 0.6, 4), K.dark, { p: [0, 0.3, 0] }), part(box(8, 8.4, 1.2), '#8d96a1', { p: [0, 4.8, -0.4] }),
          part(cyl(3.1, 3.1, 0.3, 32), '#23272d', { p: [0, 4.8, 0.3], r: [Math.PI / 2, 0, 0] }), part(torus(3.25, 0.2, TAU, 40), K.steelDk, { p: [0, 4.8, 0.4] }),
          bar(-1.7, 2.65), bar(0, 2.65), bar(1.7, 2.65), bar(-0.85, 3.1), bar(0.85, 3.1), bar(0, 3.55),
          ring(4, (a, i) => part(cyl(0.6, 0.6, 0.22, 16), i % 2 ? K.gold : K.goldDk, { p: [1.6, 4.6 + i * 0.24, 0.7] })), part(cyl(0.6, 0.6, 0.22, 16), K.gold, { p: [-1.4, 4.7, 0.7], r: [0.5, 0, 0.3] }),
          ring(5, (a, i) => part(cyl(0.8, 0.8, 0.3, 18), i % 2 ? K.gold : K.goldDk, { p: [5, 0.75 + i * 0.32, 1.4] })), ring(3, (a, i) => part(cyl(0.8, 0.8, 0.3, 18), K.gold, { p: [-5, 0.75 + i * 0.32, 1.6] }))),
        moving: [
          { geo: door, pivot: [-3.3, 4.8, 1.5], anim: (t) => { const f = f6(t); return { ry: -1.9 * back(win(f, 0.27, 0.42)) * (1 - easeIO(win(f, 0.76, 0.9))) }; } },
          { geo: merge(part(torus(1.2, 0.16, TAU, 28), 'B'), ring(3, (a) => part(box(0.22, 2.4, 0.22), 'B', { r: [0, 0, a] })), part(cyl(0.4, 0.4, 0.4, 12), 'Bd', { r: [Math.PI / 2, 0, 0] })),
            pivot: [3.3, 0, 0.6], parent: 0, anim: (t) => { const f = f6(t); return { rz: -TAU * easeIO(win(f, 0.04, 0.25)) + TAU * easeIO(win(f, 0.9, 1)) }; } },
        ],
      };
    },
    // A piggy bank with a coin dropping in.
    () => ({
      geo: merge(part(ball(3, 2), 'A', { p: [0, 4.2, 0], s: [1.3, 1, 1] }), part(cyl(1, 1.1, 0.9, 18), 'Ad', { p: [4.2, 4.2, 0], r: [0, 0, Math.PI / 2] }),
        part(ball(0.18, 0), K.ink, { p: [4.7, 4.4, 0.4] }), part(ball(0.18, 0), K.ink, { p: [4.7, 4.4, -0.4] }), part(ball(0.28, 0), K.ink, { p: [3.1, 5.4, 1.5] }), part(ball(0.28, 0), K.ink, { p: [3.1, 5.4, -1.5] }),
        part(cone(0.8, 1.4, 4), 'Ad', { p: [2.2, 6.8, 1.4] }), part(cone(0.8, 1.4, 4), 'Ad', { p: [2.2, 6.8, -1.4] }),
        [[2, 1.4], [2, -1.4], [-2, 1.4], [-2, -1.4]].map(([x, z]) => part(cyl(0.6, 0.6, 1.8, 12), 'Ad', { p: [x, 0.9, z] })),
        part(box(1.6, 0.2, 0.35), K.ink, { p: [0, 7.2, 0] }), part(torus(0.4, 0.1, Math.PI * 1.5, 12), 'Ad', { p: [-4, 4.6, 0] })),
      moving: [{ geo: part(cyl(0.7, 0.7, 0.18, 20), K.gold, { r: [Math.PI / 2, 0, 0] }), pivot: [0, 7.4, 0], anim: (t) => {
        const f = cyc(t, 2.6);
        return { y: (1 - easeIn(win(f, 0.12, 0.5))) * 4.2, ry: t * 4, s: f < 0.12 ? back(win(f, 0, 0.12)) : f < 0.5 ? 1 : 0 };
      } }],
      move: (t) => {
        const f = cyc(t, 2.6), k = win(f, 0.52, 0.78), thud = bump(f, 0.5, 0.025);
        return { y: hop(k) * 0.1, rz: Math.sin(k * TAU) * 0.05, sy: 1 - thud * 0.07, sx: 1 + thud * 0.04, sz: 1 + thud * 0.04 };
      },
    }),
    // A charging bull: it paws the ground, lunges, and swishes its tail.
    () => ({ geo: merge(part(box(9.5, 1.2, 4.2), 'B', { p: [0, 0.6, 0] }), part(box(9.7, 0.2, 4.4), 'Bd', { p: [0, 1.25, 0] })),
      move: () => ({}),
      moving: [{ pivot: [0, 0, 0], anim: (t) => {
        const f = cyc(t, 3.2), paw = f < 0.45 ? Math.max(0, Math.sin(f * 50)) * 0.04 : 0;
        const lunge = easeOut(win(f, 0.45, 0.56)) * (1 - easeIO(win(f, 0.62, 0.95)));
        return { x: lunge * 1.1 - paw * 2, rz: -lunge * 0.06 + paw };
      }, geo: merge(
      part(box(6, 2.8, 2.6), '#9a6b3c', { p: [-0.3, 4.4, 0], r: [0, 0, -0.08] }), part(box(2.4, 2.4, 2.8), '#8a5d33', { p: [1.8, 5.1, 0] }),
      part(box(2, 2, 2), '#8a5d33', { p: [3.6, 4.1, 0], r: [0, 0, -0.5] }), part(box(1, 0.8, 1.4), '#6f4a2c', { p: [4.4, 3.4, 0], r: [0, 0, -0.5] }),
      part(cone(0.32, 2, 8), '#efe3c6', { p: [3.6, 5.3, 1.4], r: [0.9, 0, -0.6] }), part(cone(0.32, 2, 8), '#efe3c6', { p: [3.6, 5.3, -1.4], r: [-0.9, 0, -0.6] }),
      [[2, 0.9, 0.25], [2.2, -0.9, -0.25], [-2.4, 0.9, -0.3], [-2.6, -0.9, 0.35]].map(([x, z, lean]) => part(box(0.8, 2.6, 0.8), '#8a5d33', { p: [x, 2.5, z], r: [0, 0, lean] })),
    ) }, { geo: merge(beam([0, 0, 0], [-1.4, 1.4, 0], 0.25, '#8a5d33'), part(ball(0.3, 0), '#6f4a2c', { p: [-1.45, 1.45, 0] })), pivot: [-3.2, 5.2, 0], parent: 0, anim: (t) => ({ rx: Math.sin(t * 5) * 0.6 }) }],
    }),
    // A columned bank.
    () => ({ geo: merge(
      part(box(9, 0.5, 7), K.stoneDk, { p: [0, 0.25, 0] }), part(box(8.2, 0.5, 6.2), K.stone, { p: [0, 0.75, 0] }), part(box(7.4, 0.4, 5.4), K.stoneDk, { p: [0, 1.2, 0] }),
      part(box(6.2, 4.4, 3.6), '#e4d8c2', { p: [0, 3.6, -0.6] }),
      ring(6, (a, i) => part(cyl(0.34, 0.38, 4.4, 12), K.white, { p: [-3.2 + i * 1.28, 3.6, 2.1] })), ring(6, (a, i) => part(cyl(0.34, 0.38, 4.4, 12), K.white, { p: [-3.2 + i * 1.28, 3.6, -2.1] })),
      part(box(7.8, 0.7, 5.6), 'A', { p: [0, 6.15, 0] }),
      part(prism(8.2, 2, 5.8), K.stone, { p: [0, 6.5, 0], r: [0, Math.PI / 2, 0], s: [0.71, 1, 1.41] }),
      part(box(1.6, 2.6, 0.2), 'B', { p: [0, 2.7, 1.25] }),
    ),
    moving: [{ geo: part(cyl(0.75, 0.75, 0.25, 20), K.gold, { r: [Math.PI / 2, 0, 0] }), pivot: [0, 7.15, 3.05], anim: (t) => ({ ry: t * 2.2 }) }] }),
    // A stagecoach rolling back and forth; the wheels turn with the ground it covers.
    () => ({ geo: part(box(9, 0.12, 4.8), '#d9c39a', { p: [0, 0.06, 0] }),
      move: () => ({}),
      moving: [{ pivot: [0, 0, 0], anim: (t) => ({ x: Math.sin(t * 0.9) * 0.9, y: Math.abs(Math.sin(t * 7)) * 0.06, rz: Math.sin(t * 3.1) * 0.015 }), geo: merge(
      part(box(5.2, 3.2, 3), 'A', { p: [0, 3.6, 0] }), part(box(5.6, 0.35, 3.4), 'Ad', { p: [0, 5.35, 0] }), part(box(5.4, 0.3, 3.2), 'B', { p: [0, 2.1, 0] }),
      part(box(1.6, 1.2, 0.1), '#2c3e55', { p: [-1.2, 4.2, 1.52] }), part(box(1.6, 1.2, 0.1), '#2c3e55', { p: [1.2, 4.2, 1.52] }),
      part(box(1.2, 0.8, 1), K.wood, { p: [-1.2, 5.9, 0] }), part(box(1.4, 0.7, 1.2), K.woodDk, { p: [0.6, 5.85, 0.2] }),
      part(box(1.8, 0.3, 2.6), K.woodDk, { p: [3.4, 4.4, 0] }), beam([4.2, 2, 0.8], [7.4, 1.6, 0.8], 0.18, K.woodDk), beam([4.2, 2, -0.8], [7.4, 1.6, -0.8], 0.18, K.woodDk),
    ) },
    ...[[1.9, 1.75], [1.9, -1.75], [-1.9, 1.75], [-1.9, -1.75]].map(([x, z]) => ({ geo: merge(part(torus(1.25, 0.14, TAU, 24), 'Bd'), ring(6, (a) => part(box(0.1, 2.4, 0.1), 'B', { r: [0, 0, a] })), part(cyl(0.3, 0.3, 0.3, 10), 'Bd', { r: [Math.PI / 2, 0, 0] })),
      pivot: [x, 1.4, z], parent: 0, anim: (t) => ({ rz: -(Math.sin(t * 0.9) * 0.9) / 1.25 }) }))],
    }),
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
    () => ({ geo: merge(...plinth(3.4)),
      moving: [
        { geo: merge(part(extrude([[-3.4, 4], [3.4, 4], [3.4, 1.2], [0, -3.2], [-3.4, 1.2]], 1.2), 'A'), part(extrude([[-2.6, 3.4], [2.6, 3.4], [2.6, 1.2], [0, -2.2], [-2.6, 1.2]], 0.3), 'B', { p: [0, 0, 0.7] }), part(extrude([[-2.6, 3.4], [2.6, 3.4], [2.6, 1.2], [0, -2.2], [-2.6, 1.2]], 0.3), 'B', { p: [0, 0, -0.7] })),
          pivot: [0, 5.4, 0], anim: (t) => { const f = cyc(t, 4); return { ry: TAU * easeIO(win(f, 0.55, 0.82)), y: hop(win(f, 0.55, 0.82)) * 0.8 }; } },
        { geo: merge(part(box(1.8, 0.6, 0.3), K.white, { p: [-0.9, 0, 0], r: [0, 0, -0.8] }), part(box(3.4, 0.6, 0.3), K.white, { p: [0.9, 0.7, 0], r: [0, 0, 0.9] })), pivot: [0, 1, 0.95], parent: 0,
          anim: (t) => { const f = cyc(t, 4); return { s: f < 0.5 ? 1 : f < 0.55 ? 1 - win(f, 0.5, 0.55) : f < 0.84 ? 0 : back(win(f, 0.84, 0.96)) }; } },
      ] }),
    // A lifebuoy on the waves.
    () => ({ geo: part(cyl(4.6, 4.8, 0.8, 32), 'W', { p: [0, 0.4, 0] }),
      moving: [
        { geo: merge(part(torus(3, 1, TAU, 40), (x, y) => (Math.floor(((Math.atan2(y, x) + Math.PI) / TAU) * 8) % 2 ? 'A' : K.white)), part(torus(3.05, 0.12, TAU, 40), '#d9c39a', { p: [0, 0, 1] })),
          pivot: [0, 4.6, 0], anim: (t) => ({ y: Math.sin(t * 1.7) * 0.35, rx: Math.sin(t * 1.3) * 0.12, rz: Math.sin(t * 1.1) * 0.1 }) },
      ] }),
  ],
  health: [
    // A heart with a pulse line.
    () => ({ geo: merge(...plinth(3.4), part(ball(2.1, 2), 'A', { p: [-1.5, 6.6, 0] }), part(ball(2.1, 2), 'A', { p: [1.5, 6.6, 0] }), part(cone(3.3, 4, 4), 'A', { p: [0, 4, 0], r: [Math.PI, Math.PI / 4, 0], s: [1, 1, 0.65] }),
      beam([-4, 6, 2], [-1.4, 6, 2], 0.3, K.white), beam([-1.4, 6, 2], [-0.6, 7.8, 2], 0.3, K.white), beam([-0.6, 7.8, 2], [0.4, 4.6, 2], 0.3, K.white), beam([0.4, 4.6, 2], [1.2, 6, 2], 0.3, K.white), beam([1.2, 6, 2], [4, 6, 2], 0.3, K.white)) }),
    // A pill bottle with pills spilling out.
    () => ({ geo: merge(part(cyl(2.2, 2.2, 5.4, 24), '#f2a65a', { p: [0, 2.9, 0], r: [0, 0, 0] }), part(cyl(2.25, 2.25, 2.4, 24), K.white, { p: [0, 2.9, 0] }), part(box(2.6, 0.3, 0.1), 'B', { p: [0, 3.2, 2.24] }),
      ring(7, (a, i) => part(new THREE.CapsuleGeometry(0.35, 0.8, 4, 10), (x, y, z) => ((x - Math.cos(a) * 4) * Math.cos(a) > 0 ? 'A' : K.white), { p: [Math.cos(a) * (3.4 + (i % 2)), 0.4, Math.sin(a) * (3.4 + (i % 2))], r: [0, -a, Math.PI / 2] }))),
      moving: [{ geo: merge(part(cyl(2.4, 2.4, 1, 24), K.white, { p: [0, 0.5, 0] }), part(cyl(2.42, 2.42, 0.2, 24), 'A', { p: [0, 0.7, 0] })), pivot: [0, 5.6, 0], anim: (t) => {
        const f = cyc(t, 3), k = win(f, 0.1, 0.5);
        return { y: hop(k) * 3.2, rx: hop(k) * 0.5, ry: easeOut(k) * TAU };
      } }],
      move: (t) => { const f = cyc(t, 3), s = bump(f, 0.1, 0.03) * 0.06; return { sy: 1 - s, sx: 1 + s * 0.5, sz: 1 + s * 0.5 }; } }),
  ],
  retail: [
    // A giant shopping bag.
    () => ({ geo: merge(part(box(5.6, 6, 2.8), 'A', { p: [0, 3, 0] }), part(box(5.65, 0.8, 2.85), 'B', { p: [0, 4.6, 0] }),
      part(torus(1.3, 0.16, Math.PI, 16), K.ink, { p: [0, 6, 0.9] }), part(torus(1.3, 0.16, Math.PI, 16), K.ink, { p: [0, 6, -0.9] }),
      part(box(1, 1.3, 0.08), K.white, { p: [2.2, 2, 1.45], r: [0, 0, 0.2] })),
      moving: [[K.white, -1, 0, 0.2, 0.3, 0.2], ['#f6d7cf', 1, 0.2, -0.2, 0.5, -0.2]].map(([c, x, z, rx, ry, rz], i) => ({ geo: part(cone(1, 2, 4), c, { r: [rx, ry, rz] }), pivot: [x, 6.4, z], anim: (t) => {
        const f = cyc(t, 2.4, i * 0.5), k = win(f, 0, 0.35);
        return { y: hop(k) * 1.6, rz: hop(k) * (i ? -0.4 : 0.4) };
      } })) }),
    // A storefront with a striped awning.
    () => ({ geo: merge(part(box(8.4, 5.4, 4), K.cream, { p: [0, 2.7, 0] }), part(box(8.6, 1.2, 0.3), 'B', { p: [0, 6, 2.05] }),
      ring(8, (a, i) => part(box(1.05, 0.16, 1.8), i % 2 ? K.white : 'A', { p: [-3.7 + i * 1.06, 4.6, 2.7], r: [0.45, 0, 0] })),
      part(box(2.8, 2.6, 0.1), '#9dd0f2', { p: [-2.2, 2, 2.02] }), part(box(2.8, 2.6, 0.1), '#9dd0f2', { p: [2.2, 2, 2.02] }), part(box(1.2, 3, 0.1), K.wood, { p: [0, 1.5, 2.03] })) }),
  ],
  oil: [
    // A nodding pumpjack.
    () => ({
      geo: merge(part(box(9, 0.6, 3), K.dark, { p: [0, 0.3, 0] }), beam([-0.6, 0.6, 1], [0, 5.6, 0], 0.4, K.steelDk), beam([0.6, 0.6, -1], [0, 5.6, 0], 0.4, K.steelDk), beam([-0.6, 0.6, -1], [0, 5.6, 0], 0.4, K.steelDk),
        part(box(1.2, 2.2, 1.6), K.steelDk, { p: [-3.4, 1.7, 0] }), part(cyl(0.5, 0.5, 0.9, 12), K.ink, { p: [3.8, 0.9, 0] }), ring(3, (a, i) => part(cyl(0.7, 0.7, 1.4, 14), i === 1 ? 'A' : 'B', { p: [-1 + i * 1.6, 0.7, 2.6] }))),
      move: () => ({}),
      moving: [
        { geo: merge(part(box(8, 0.7, 0.7), 'A', { p: [0, 0, 0] }), part(box(1, 2.4, 1), 'Ad', { p: [4.2, -0.6, 0] }), part(box(1.4, 1.4, 1.2), K.dark, { p: [-3.8, -0.4, 0] })), pivot: [0, 5.8, 0], anim: (t) => ({ rz: Math.sin(t * 1.6) * 0.28 }) },
        { geo: part(cyl(0.22, 0.22, 4, 8), K.steel, { p: [0, 2, 0] }), pivot: [3.8, 0.4, 0], anim: (t) => ({ y: Math.sin(Math.sin(t * 1.6) * 0.28) * 4.2 }) },
        { geo: merge(part(box(2.6, 0.5, 0.4), K.dark, { p: [0.9, 0, 0] }), part(cyl(0.6, 0.6, 0.45, 14), K.ink, { p: [1.9, 0, 0], r: [Math.PI / 2, 0, 0] })), pivot: [-3.4, 2.4, 0.9], anim: (t) => ({ rz: t * 1.6 + Math.PI }) },
      ],
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
      const lines = [];
      [7.2, 9.4].forEach((y) => { parts.push(part(box(8, 0.35, 0.35), K.steelDk, { p: [0, y, 0] })); [-3.8, 3.8].forEach((x) => { parts.push(part(cyl(0.25, 0.25, 0.9, 8), 'A', { p: [x, y - 0.6, 0] }), beam([x, y - 1, 0], [x * 1.8, y - 3, 3], 0.06, K.ink)); lines.push([x, y - 1, 0, x * 0.8, -2, 3]); }); });
      // Power on the move: sparks race down each line.
      return { geo: merge(parts), moving: lines.map(([x, y, z, dx, dy, dz], i) => ({ geo: part(ball(0.42, 1), K.yellow), pivot: [x, y, z], anim: (t) => {
        const f = cyc(t, 1.1, i * 0.27);
        return { x: dx * f, y: dy * f, z: dz * f, s: (0.8 + Math.sin(t * 40 + i) * 0.35) * life(f, 0, 0.1, 0.85, 1) };
      } })) };
    },
    // A glowing light bulb.
    () => ({ geo: merge(...plinth(2.6), part(cyl(1.3, 1.4, 2.4, 16), (x, y) => (Math.floor(y * 2.5) % 2 ? K.steel : K.steelDk), { p: [0, 1.8, 0] }),
      part(cyl(1.3, 2.2, 1.2, 18), '#fff3b0', { p: [0, 3.6, 0] }), part(ball(3, 2), '#fff3b0', { p: [0, 6.2, 0] }), part(torus(0.8, 0.12, Math.PI, 12), 'A', { p: [0, 6, 0] }),
      beam([-0.8, 6, 0], [-0.4, 3.8, 0], 0.08, 'A'), beam([0.8, 6, 0], [0.4, 3.8, 0], 0.08, 'A')),
      moving: [{ geo: merge(ring(8, (a) => beam([Math.cos(a) * 3.8, Math.sin(a) * 3.8, 0], [Math.cos(a) * 4.8, Math.sin(a) * 4.8, 0], 0.22, K.yellow))), pivot: [0, 6.2, 0],
        anim: (t) => ({ rz: t * 0.5, s: 1 + Math.max(0, Math.sin(t * 3.4)) * 0.12 }) }] }),
  ],
  software: [
    // A browser window full of code.
    () => ({ geo: merge(part(box(2, 2.4, 1.4), K.steelDk, { p: [0, 1.2, 0] }), part(box(9, 6.4, 0.5), K.white, { p: [0, 5.6, 0] }), part(box(9, 0.9, 0.55), 'A', { p: [0, 8.35, 0] }),
      ring(3, (a, i) => part(ball(0.22, 0), [K.white, '#f6d77a', '#9ee3a1'][i], { p: [-4 + i * 0.6, 8.35, 0.3] })),
    ),
      moving: [
        ...[[2.8, 'B'], [4.2, '#c3c9d0'], [3.2, 'Bd'], [5, '#c3c9d0'], [2.2, 'A']].map(([w, c], i) => ({ geo: part(box(w, 0.42, 0.1), c, { p: [w / 2, 0, 0] }), pivot: [-3.8 + (i % 2) * 0.6, 7.3 - i * 0.95, 0.3], anim: (t) => {
          const f = cyc(t, 5);
          return { sx: win(f, 0.04 + i * 0.13, 0.15 + i * 0.13) * (1 - win(f, 0.88, 0.95)) };
        } })),
        { geo: part(box(0.2, 0.6, 0.12), K.ink), pivot: [0, 0, 0.34], anim: (t) => {
          const f = cyc(t, 5), i = Math.min(4, Math.floor(Math.max(0, f - 0.04) / 0.13)), w = [2.8, 4.2, 3.2, 5, 2.2][i];
          return { x: -3.8 + (i % 2) * 0.6 + w * win(f, 0.04 + i * 0.13, 0.15 + i * 0.13) + 0.2, y: 7.3 - i * 0.95, s: cyc(t, 0.6) < 0.5 ? 1 : 0 };
        } },
      ] }),
    // A turning cube of app blocks.
    () => {
      const cubie = (i) => { const x = (i % 3) - 1, y = Math.floor(i / 3) % 3 - 1, z = Math.floor(i / 9) - 1; return { y, g: part(box(1.75, 1.75, 1.75), ['A', 'B', K.white, 'Ad', '#f6d77a'][(i * 7) % 5], { p: [x * 1.9, y * 1.9, z * 1.9] }) }; };
      const all = Array.from({ length: 27 }, (_, i) => cubie(i));
      return { geo: merge(...plinth(3)),
        moving: [
          { geo: merge(all.filter((c) => c.y < 1).map((c) => c.g)), pivot: [0, 5, 0], anim: (t) => ({ ry: t * 0.4, rx: 0.25, order: 'XYZ' }) },
          { geo: merge(all.filter((c) => c.y === 1).map((c) => c.g)), pivot: [0, 0, 0], parent: 0, anim: (t) => { const f = cyc(t, 6), step = Math.floor(f * 4), sub = win(f * 4 - step, 0.45, 0.85); return { ry: (step + easeIO(sub)) * (Math.PI / 2) }; } },
        ] };
    },
  ],
  ai: [
    // A brain on a stand.
    () => ({ geo: merge(...plinth(2.8), part(cyl(0.4, 0.6, 2.6, 10), K.steel, { p: [0, 1.8, 0] }),
      ...Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2 * 3.1, t = (i % 10) / 10; const side = i % 2 ? 1 : -1; return part(ball(1.05, 1), i % 3 ? 'A' : 'Ad', { p: [side * (0.9 + Math.sin(a) * 1.1), 5.6 + Math.cos(a) * 1.6 * (1 - t * 0.3), Math.cos(a * 0.7) * 2.2 * (1 - t * 0.4)] }); })),
      move: (t) => { const f = cyc(t, 1.6), s = bump(f, 0.1, 0.05) * 0.04; return { sx: 1 + s, sy: 1 + s, sz: 1 + s }; },
      moving: [[0.5, 0], [-0.6, 1.2], [1.2, 2.4]].flatMap(([tilt, ph], i) => [
        { geo: null, pivot: [0, 5.6, 0], anim: (t) => ({ rx: tilt, rz: tilt * 0.5, ry: t * (1.4 + i * 0.3) + ph }) },
        { geo: part(ball(0.32, 1), K.yellow), pivot: [3.4, 0, 0], parent: i * 2, anim: (t) => ({ s: 0.8 + Math.sin(t * 9 + i) * 0.3 }) },
      ]) }),
    // A small neural network.
    () => {
      const layers = [[-3.4, 3], [0, 4], [3.4, 2]];
      const nodes = [];
      layers.forEach(([x, count], li) => { for (let k = 0; k < count; k++) nodes.push({ li, p: [x, 4 + (k - (count - 1) / 2) * 2, 0] }); });
      const links = [];
      nodes.forEach((a) => nodes.forEach((b) => { if (b.li === a.li + 1) links.push(beam(a.p, b.p, 0.12, '#c3c9d0')); }));
      // Signals flow forward: each pulse runs input → hidden → output along the links.
      const L = [0, 1, 2].map((li) => nodes.filter((n) => n.li === li));
      const pulses = Array.from({ length: 6 }, (_, i) => [L[0][i % 3].p, L[1][(i * 3 + 1) % 4].p, L[2][i % 2].p]);
      const at = (a, b, k) => a.map((v, j) => v + (b[j] - v) * k);
      return { geo: merge(...plinth(4.2), links, nodes.map((nd, i) => part(ball(0.75, 1), nd.li === 1 ? 'A' : 'B', { p: nd.p }))),
        moving: pulses.map(([a, b, c], i) => ({ geo: part(ball(0.3, 1), K.yellow), pivot: [0, 0, 0], anim: (t) => {
          const f = cyc(t, 2, i / 6), p = f < 0.5 ? at(a, b, easeIO(f * 2)) : at(b, c, easeIO(f * 2 - 1));
          return { x: p[0], y: p[1], z: p[2] + 0.2, s: 0.8 + bump(f, 0.5, 0.06) * 0.8 };
        } })) };
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
      moving: (() => {
        const drop = (t) => 3.2 + Math.sin(t * 0.9) * 1.8;
        return [
          { geo: merge(part(box(10, 0.6, 0.9), 'A', { p: [2, 0, 0] }), part(box(1.4, 1.2, 1.4), K.dark, { p: [-3.2, -0.3, 0] }), part(box(1.4, 1.2, 1.2), '#2c3e55', { p: [0, 0.9, 0] })), pivot: [0, 10, 0], anim: (t) => ({ ry: t * 0.3 }) },
          { geo: part(box(0.06, 1, 0.06), K.ink, { p: [0, -0.5, 0] }), pivot: [6, -0.3, 0], parent: 0, anim: (t) => ({ sy: drop(t) }) },
          { geo: merge(part(box(0.9, 0.3, 0.6), K.steelDk), part(box(1.2, 1, 1.2), 'B', { p: [0, -0.8, 0] })), pivot: [6, -0.3, 0], parent: 0, anim: (t) => ({ y: -drop(t) - 0.15, ry: Math.sin(t * 1.3) * 0.3 }) },
        ];
      })(),
    }),
    // A hard hat and a wrench.
    () => ({ geo: merge(...plinth(3.6), part(new THREE.SphereGeometry(2.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'A', { p: [0, 2.6, 0] }), part(cyl(3.6, 3.6, 0.3, 28), 'Ad', { p: [0, 2.7, 0.4] }), part(box(0.6, 0.4, 5.4), 'Ad', { p: [0, 5.3, 0], r: [0.1, 0, 0] }),
      part(box(7.4, 0.6, 0.6), K.steel, { p: [0, 1.2, 2.8], r: [0, 0.3, 0] }), part(torus(0.7, 0.3, Math.PI * 1.4, 12), K.steel, { p: [3.6, 1.2, 1.7], r: [Math.PI / 2, 0, 0.6] })) }),
  ],
  food: [
    // A pizza with a slice lifting off.
    () => {
      const W = 0.34, wedge = (r, h, c, a0, len) => part(new THREE.CylinderGeometry(r, r, h, 32, 1, false, a0, len), c);
      const lift = (t) => { const f = cyc(t, 4); return easeIO(win(f, 0.1, 0.36)) * (1 - easeIO(win(f, 0.72, 0.92))); };
      return { geo: merge(place(wedge(4.4, 0.6, '#e2a65a', Math.PI / 2 + W, TAU - 2 * W), { p: [0, 0.8, 0] }), place(wedge(4, 0.3, '#f6c443', Math.PI / 2 + W, TAU - 2 * W), { p: [0, 1.15, 0] }),
        [W, -W].map((a) => part(box(4.4, 0.62, 0.04), '#d8954c', { p: [Math.cos(a) * 2.2, 0.8, -Math.sin(a) * 2.2], r: [0, a, 0] })),
        ring(8, (a, i) => i === 0 ? [] : part(cyl(0.55, 0.55, 0.15, 14), 'A', { p: [Math.cos(a) * (1.6 + (i % 2) * 1.2), 1.32, Math.sin(a) * (1.6 + (i % 2) * 1.2)] })),
        part(box(9.4, 0.3, 9.4), 'B', { p: [0, 0.15, 0] })),
        moving: [
          { geo: merge(place(wedge(4.4, 0.6, '#e2a65a', Math.PI / 2 - W, 2 * W), {}), place(wedge(4, 0.3, '#f6c443', Math.PI / 2 - W, 2 * W), { p: [0, 0.35, 0] }), part(cyl(0.5, 0.5, 0.15, 14), 'A', { p: [2.6, 0.55, 0] })),
            pivot: [0, 0.8, 0], anim: (t) => { const k = lift(t); return { y: k * 2.6, x: k * 0.6, rz: k * 0.42 + Math.sin(t * 2.2) * 0.03 * k }; } },
          ...[[0.7, 0.2], [1.4, -0.25]].map(([x, z]) => ({ geo: part(cyl(0.12, 0.2, 1, 8), '#f6c443', { p: [0, 0.5, 0] }), pivot: [x, 1.25, z], anim: (t) => { const k = lift(t); return { sy: 0.01 + k * 2.4, x: k * (0.35 + x * 0.3), s: k > 0.04 ? undefined : 0 }; } })),
        ] };
    },
    // Stacked donuts.
    () => ({ geo: merge(...plinth(3.4), part(torus(2.4, 1.2, TAU, 28), '#d9a15c', { p: [0, 1.8, 0], r: [Math.PI / 2, 0, 0] }), part(torus(2.4, 1.0, TAU, 28), 'B', { p: [0, 2.4, 0], r: [Math.PI / 2, 0, 0], s: [1.04, 1.04, 0.7] })),
      moving: [{ geo: merge(part(torus(2.4, 1.2, TAU, 28), '#d9a15c', { r: [Math.PI / 2, 0, 0] }), part(torus(2.4, 1.0, TAU, 28), 'A', { p: [0, 0.6, 0], r: [Math.PI / 2, 0, 0], s: [1.04, 1.04, 0.7] }),
        ring(14, (a, i) => part(box(0.12, 0.12, 0.5), [K.yellow, K.white, '#7cc0ff', '#5fae5b'][i % 4], { p: [Math.cos(a) * 2.4, 1.4, Math.sin(a) * 2.4], r: [0, a * 3, 0] }))),
        pivot: [0.6, 4.2, 0.3], anim: (t) => ({ ry: t * 1.1, y: Math.abs(Math.sin(t * 2.2)) * 0.5, rx: Math.sin(t * 2.2) * 0.06 }) }] }),
  ],
  drink: [
    // A coffee mug with rising steam.
    () => ({
      geo: merge(part(cyl(4, 4, 0.4, 28), K.white, { p: [0, 0.2, 0] }), part(cyl(2.6, 2.3, 4.6, 24), 'A', { p: [0, 2.7, 0] }), part(cyl(2.3, 2.3, 0.2, 24), '#5a3a22', { p: [0, 4.9, 0] }), part(torus(1.2, 0.35, Math.PI * 1.2, 16), 'A', { p: [2.7, 2.8, 0], r: [0, 0, -Math.PI * 0.6] }), part(box(1.6, 1.6, 0.1), 'B', { p: [0, 2.8, 2.5] })),
      moving: [0, 1, 2, 3].map((i) => ({ geo: part(ball(0.7, 1), '#ffffff'), pivot: [-0.6 + (i % 2) * 1.2, 5.2, (i - 1.5) * 0.4], anim: (t) => {
        const f = cyc(t, 2.8, i / 4);
        return { y: f * 5, x: Math.sin(f * 6 + i * 1.7) * 0.7, s: (0.5 + f * 0.9) * life(f, 0, 0.12, 0.6, 1) };
      } })),
    }),
    // Glass bottles.
    () => {
      const clink = (t) => { const f = cyc(t, 3); return easeOut(win(f, 0.2, 0.32)) * (1 - easeIO(win(f, 0.4, 0.7))); };
      return { geo: merge(...plinth(3.2)),
        moving: [
          ...[[-1.3, 0, 1], [1.5, 0.4, -1]].map(([x, z, side], k) => ({ geo: merge(part(cyl(1.4, 1.4, 4.6, 18), k ? 'Ad' : 'A', { p: [0, 2.3, 0] }), part(cyl(0.5, 1.4, 1.4, 18), k ? 'Ad' : 'A', { p: [0, 5.3, 0] }), part(cyl(0.45, 0.45, 1.4, 12), k ? 'Ad' : 'A', { p: [0, 6.7, 0] }), part(cyl(0.52, 0.52, 0.4, 12), 'B', { p: [0, 7.5, 0] }), part(cyl(1.42, 1.42, 1.6, 18), K.white, { p: [0, 2.5, 0] })),
            pivot: [x, 0.7, z], anim: (t) => ({ rz: -side * 0.2 * clink(t) }) })),
          ...[0, 1, 2, 3].map((i) => ({ geo: part(ball(0.2, 1), K.white), pivot: [0.1, 8.4, 0.2], anim: (t) => { const f = cyc(t, 3, -0.3 + i * 0.04), k = win(f, 0, 0.45); return { y: hop(k) * 2 + k, x: (i - 1.5) * k * 1.2, z: Math.sin(i * 2) * k, s: life(f, 0, 0.04, 0.35, 0.45) }; } })),
        ] };
    },
  ],
  parcel: [
    // A delivery van.
    () => ({ geo: part(box(10, 0.1, 4.6), '#c9ced6', { p: [0, 0.05, 0] }), move: () => ({}),
      moving: [
        ...rolling(merge(part(box(6, 4, 3.4), K.white, { p: [-0.8, 2.8, 0] }), part(box(6.05, 0.7, 3.45), 'A', { p: [-0.8, 2.4, 0] }), part(box(2.2, 2.8, 3.2), 'B', { p: [3.3, 2.2, 0] }), part(box(0.1, 1.2, 2.6), '#9dd0f2', { p: [4.42, 2.9, 0] })),
          [[2.8, 0.9, 1.7, 0.85], [2.8, 0.9, -1.7, 0.85], [-2.6, 0.9, 1.7, 0.85], [-2.6, 0.9, -1.7, 0.85]], tireAt0, { reach: 0.9 }),
        ...[[part(box(1.4, 1.2, 1.4), '#c99a62', { p: [0, 0.6, 0], r: [0, 0.3, 0] }), [-1, 4.8, 0]], [part(box(1, 0.9, 1), '#d4a76d', { p: [0, 0.45, 0] }), [0.6, 4.8, 0.4]]].map(([geo, at], i) => ({ geo, pivot: at, parent: 0,
          anim: (t) => ({ y: Math.max(0, Math.sin(t * 7 + i * 2)) * 0.25, rz: Math.sin(t * 3.5 + i) * 0.06 }) })),
      ] }),
    // A parcel with wings.
    () => ({ geo: merge(part(box(5, 4, 4), '#c99a62', { p: [0, 4.4, 0] }), part(box(5.05, 4.02, 0.9), 'A', { p: [0, 4.41, 0] }), part(box(1.4, 1, 0.1), K.white, { p: [1.4, 3.6, 2.02] })), moving: winged(2.6, 5, 0, 0.8), hover: 0.6 }),
  ],
  rocket: [
    // A fighter jet climbing.
    () => {
      const axis = new V(0, Math.sin(0.5), Math.cos(0.5)), q = new THREE.Quaternion();
      return { geo: merge(part(cyl(2.4, 2.6, 0.4, 24), K.dark, { p: [0, 0.2, 0] }), beam([0, 0.4, 0], [0, 5.2, 0.3], 0.34, K.steelDk)),
        move: () => ({}),
        moving: [{ geo: merge(part(new THREE.CapsuleGeometry(0.9, 7, 6, 14), '#a9b1bb', { r: [Math.PI / 2 - 0.5, 0, 0] }), part(extrude([[0, 3], [3.6, -1.4], [-3.6, -1.4]], 0.25), '#8d96a1', { p: [0, -0.6, -0.6], r: [-Math.PI / 2 - 0.5, 0, 0] }),
          part(extrude([[0, 1.6], [0.9, -0.4], [-0.9, -0.4]], 0.2), 'A', { p: [0, -1.6, -2.9], r: [0.3, Math.PI / 2, 0] }), part(new THREE.SphereGeometry(0.7, 12, 8), '#4f8fe0', { p: [0, 1.4, 2.4], s: [1, 0.8, 1.8] }), part(cone(0.5, 1, 10), K.orange, { p: [0, -2.8, -3.4], r: [-2.07, 0, 0] })),
          pivot: [0, 6, 0], anim: (t) => { const f = cyc(t, 4); return { q: q.setFromAxisAngle(axis, TAU * easeIO(win(f, 0.45, 0.8))), y: Math.sin(t * 1.4) * 0.25 }; } }] };
    },
    // A satellite with turning panels.
    // A satellite in orbit around a turning globe.
    () => ({
      geo: merge(...plinth(2.6), part(cyl(0.3, 0.45, 2.4, 10), K.steelDk, { p: [0, 1.8, 0] })),
      move: () => ({}),
      moving: [
        { geo: merge(part(ball(2.4, 3), '#3d7be0'), [[0.4, 0.9, 0.3, 1.1], [-0.6, -0.3, 0.8, 0.9], [0.9, -0.6, -0.4, 0.8], [-0.7, 0.6, -0.6, 0.7], [0.1, -0.95, 0.2, 0.6]].map(([x, y, z, r]) => { const d = new V(x, y, z).normalize().multiplyScalar(2.25); return part(ball(r, 1), '#5fae5b', { p: d.toArray(), s: [1, 0.55, 1] }); }), part(ball(0.9, 1), K.white, { p: [0, 2.15, 0], s: [1.3, 0.35, 1.3] })),
          pivot: [0, 5.4, 0], anim: (t) => ({ ry: t * 0.4, rz: 0.4, order: 'ZYX' }) },
        { geo: null, pivot: [0, 5.4, 0], anim: (t) => ({ rx: 0.45, ry: t * 0.9 }) },
        { geo: merge(part(box(1.3, 1.3, 1.3), '#d9a93a'), part(box(1.32, 0.25, 1.32), 'A'), part(cone(0.55, 0.5, 14), K.white, { p: [0, -0.9, 0], r: [Math.PI, 0, 0] }), part(cyl(0.04, 0.04, 0.9, 6), K.steel, { p: [0, 1.1, 0] })), pivot: [4.4, 0, 0], parent: 1, anim: (t) => ({ ry: t * 0.6 }) },
        { geo: merge(part(box(5, 0.08, 1.1), '#2d4f8e'), ring(5, (a, i) => part(box(0.06, 0.1, 1.1), '#c9d6e3', { p: [-2 + i, 0, 0] })), part(box(1.6, 0.16, 0.16), K.steel)), pivot: [0, 0, 0], parent: 2, anim: (t) => ({ rx: Math.sin(t * 0.8) * 0.5 }) },
      ],
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
    () => ({ geo: merge(part(box(4.6, 9.4, 3.6), K.ink, { p: [0, 4.7, 0] }), ring(8, (a, i) => [part(box(4, 0.9, 0.1), '#3a3f47', { p: [0, 1 + i * 1.05, 1.82] }), part(box(2, 0.12, 0.12), 'B', { p: [-0.6, 1 + i * 1.05, 1.86] })]), part(box(4.8, 0.3, 3.8), 'A', { p: [0, 9.5, 0] })),
    moving: Array.from({ length: 16 }, (_, i) => ({ geo: part(box(0.25, 0.25, 0.12), i % 5 === 2 ? 'A' : '#5fd08f'), pivot: [1.25 + (i % 2) * 0.45, 1 + (i >> 1) * 1.05, 1.88], anim: (t) => ({ s: Math.sin(t * (2.3 + (i * 7) % 5) + i * 1.9) > 0.1 ? 1 : 0.25 }) })) }),
  ],
  plane: [
    // An airliner taking off.
    () => ({ geo: merge(part(box(1.4, 3, 1.4), K.steelDk, { p: [0, 1.5, 0] }),
      part(new THREE.CapsuleGeometry(1, 8, 6, 16), K.white, { p: [0, 5.4, 0], r: [Math.PI / 2 - 0.35, 0, 0] }), part(box(10, 0.2, 1.8), '#e8edf3', { p: [0, 5.1, 0.3], r: [-0.35, 0, 0] }),
      part(box(0.2, 2.2, 1.6), 'A', { p: [0, 5.2, -4.3], r: [-0.35, 0, 0] }), part(box(3.4, 0.16, 1), '#e8edf3', { p: [0, 3.9, -3.9], r: [-0.35, 0, 0] }),
      [-2.4, 2.4].map((x) => part(cyl(0.5, 0.5, 1.6, 12), 'B', { p: [x, 4.5, 0.6], r: [Math.PI / 2 - 0.35, 0, 0] })), ring(6, (a, i) => part(box(0.05, 0.25, 0.3), K.ink, { p: [1.02, 5.9 - i * 0.22, 2.4 - i * 0.62] }))) }),
    // A hotel with a sign.
    () => ({ geo: merge(part(box(6, 9, 4), K.cream, { p: [0, 4.5, 0] }), ring(6, (a, i) => [part(box(5.4, 0.2, 0.8), K.white, { p: [0, 1.6 + i * 1.3, 2.3] }), ring(3, (b, j) => part(box(1.2, 0.8, 0.06), '#9dd0f2', { p: [-1.8 + j * 1.8, 2.1 + i * 1.3, 2.02] }))]),
      part(box(6.4, 1.4, 0.4), 'A', { p: [0, 9.6, 0.8] }), part(box(2, 1.6, 0.1), 'B', { p: [0, 0.8, 2.03] }), part(cyl(3, 3, 0.3, 24), 'W', { p: [5, 0.15, 3] })) }),
  ],
};
// ---------- heroes by what a company actually does ----------
// Appended to EXTRA so their indices follow the shapes above (see data/industries.json _heroes).
const roundBox = (w, h, d, r, color, p = [0, 0, 0]) => [part(box(w - 2 * r, h, d), color, { p }), part(box(w, h, d - 2 * r), color, { p }), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => part(cyl(r, r, h, 12), color, { p: [p[0] + sx * (w / 2 - r), p[1], p[2] + sz * (d / 2 - r)] }))];
EXTRA.retail.push(
  // 3 grocery basket with produce
  () => ({ geo: merge(part(cyl(3.6, 2.8, 3, 8), 'A', { p: [0, 1.5, 0], r: [0, Math.PI / 8, 0] }), part(cyl(3.65, 3.65, 0.3, 8), 'Ad', { p: [0, 3, 0], r: [0, Math.PI / 8, 0] }), part(torus(3, 0.18, Math.PI, 16), K.ink, { p: [0, 3, 0], r: [0, Math.PI / 2, 0] }),
    part(cyl(0.7, 0.8, 2.6, 10), '#f6f2e8', { p: [1.6, 4.2, 1] })),
    moving: [[ball(1.1, 1), '#e5533d', [-1.2, 3.5, 0.8]], [ball(1, 1), '#f29a3a', [1, 3.5, -0.6]], [ball(0.9, 1), '#5fae5b', [-0.4, 3.9, -1.3]], [cone(0.5, 2.6, 8), '#f29a3a', [0.4, 4, 1.2], [0.5, 0, 0.6]]].map(([g, c, at, r], i) => ({ geo: part(g, c, { r: r || [0, 0, 0] }), pivot: at, anim: (t) => {
      const f = cyc(t, 2, i * 0.14), k = win(f, 0, 0.3);
      return { y: hop(k) * 1.8, rx: k * TAU * (i % 2 ? 1 : -1) * 0.5, sy: 1 - bump(f, 0.31, 0.02) * 0.2 };
    } })) }),
  // 4 dress form
  () => ({ geo: merge(...plinth(2.4), part(cyl(0.12, 0.12, 2.6, 8), K.woodDk, { p: [0, 2, 0] })),
    moving: [{ geo: merge(part(cyl(1.6, 2.4, 4.2, 14), (x, y, z) => (Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI / 7)) % 2 ? 'A' : 'Ad'), { p: [0, 2.1, 0] }), part(cyl(1.5, 1.2, 1.6, 14), 'A', { p: [0, 4.9, 0] }), part(cyl(0.3, 0.3, 0.8, 8), K.woodDk, { p: [0, 6, 0] }), part(cyl(1.65, 1.65, 0.25, 14), 'B', { p: [0, 4.1, 0] }), part(torus(1.3, 0.1, TAU, 18), K.gold, { p: [0, 5.5, 0], r: [Math.PI / 2, 0, 0] })),
      pivot: [0, 3.3, 0], anim: (t) => ({ ry: t * 0.8, sx: 1 + Math.sin(t * 2.4) * 0.04, sz: 1 + Math.sin(t * 2.4) * 0.04 }) }] }),
  // 5 warehouse pallet stack
  () => ({ geo: merge(part(box(7, 0.6, 5), K.wood, { p: [0, 0.3, 0] }), ring(3, (a, i) => part(box(7, 0.2, 0.6), K.woodDk, { p: [0, 0.7, -2 + i * 2] })),
    ...[0, 1, 2].flatMap((y) => [-1, 1].flatMap((x) => [-1, 1].map((z) => part(box(3.3, 2, 2.3), (y + x + z) % 2 ? '#c99a62' : '#d4a76d', { p: [x * 1.7, 1.8 + y * 2.05, z * 1.2] })))), part(box(7.1, 0.6, 0.2), 'A', { p: [0, 5, 2.4] }), part(box(4, 1.2, 0.1), 'B', { p: [0, 3.2, 2.42] })) }),
  // 6 toolbox
  () => ({ geo: merge(part(box(7, 3.4, 3.4), 'A', { p: [0, 1.7, 0] }), part(box(7.1, 0.3, 3.5), 'Ad', { p: [0, 3.2, 0] }), part(torus(1.4, 0.2, Math.PI, 12), K.ink, { p: [0, 3.5, 0] }),
    part(box(0.3, 3.6, 0.3), K.steel, { p: [1.8, 4.6, -0.4], r: [0, 0, -0.4] }), part(cyl(0.45, 0.45, 1.6, 10), 'B', { p: [1.2, 3.6, -0.4], r: [0, 0, -0.4] })),
    moving: [{ geo: merge(part(box(0.5, 4, 0.5), K.wood, { p: [-0.96, 1.76, 0], r: [0, 0, 0.5] }), part(box(2, 0.9, 0.9), K.steel, { p: [-1.96, 3.36, 0], r: [0, 0, 0.5] })), pivot: [-0.64, 3.04, 0.4], anim: (t) => {
      const f = cyc(t, 1.3);
      return { rz: f < 0.55 ? -0.5 * easeOut(win(f, 0, 0.55)) : f < 0.66 ? -0.5 + 0.85 * easeIn(win(f, 0.55, 0.66)) : 0.35 * (1 - easeOut(win(f, 0.66, 1))) };
    } }],
    move: (t) => { const s = bump(cyc(t, 1.3), 0.66, 0.025) * 0.06; return { sy: 1 - s, sx: 1 + s * 0.5, sz: 1 + s * 0.5 }; } }),
  // 7 TV on a stand
  () => ({ geo: merge(part(box(3, 0.3, 2), K.ink, { p: [0, 0.15, 0] }), part(box(0.6, 2, 0.4), K.ink, { p: [0, 1.2, 0] }), part(box(9, 5.4, 0.4), K.ink, { p: [0, 4.6, 0] }), part(box(8.4, 4.8, 0.05), (x, y) => (y > 5.2 ? '#7cc0ff' : y > 3.8 ? 'B' : '#5fae5b'), { p: [0, 4.6, 0.23] }), part(box(1.2, 0.5, 0.1), 'A', { p: [3.6, 2.2, 0.25] })) }),
  // 8 sneaker
  () => ({ geo: merge(...plinth(3.4), part(box(7.4, 0.8, 2.8), K.white, { p: [0.2, 1.1, 0] }), part(box(5.6, 1.8, 2.6), 'A', { p: [-0.6, 2.3, 0] }), part(box(2.8, 2.8, 2.4), 'A', { p: [-2.2, 3, 0] }), part(box(2.6, 1.2, 2.5), 'Ad', { p: [2.6, 1.9, 0], r: [0, 0, -0.3] }),
    part(box(3.6, 0.5, 0.1), 'B', { p: [0, 2.4, 1.32], r: [0, 0, 0.3] }), ring(4, (a, i) => part(box(0.12, 0.12, 2.2), K.white, { p: [0.2 + i * 0.6, 3.1 - i * 0.15, 0] }))) }),
  // 9 lipstick
  () => ({ geo: merge(...plinth(2.6), part(cyl(1.5, 1.5, 3.6, 18), K.gold, { p: [0, 2.6, 0] }), part(cyl(1.2, 1.2, 2.2, 18), K.goldDk, { p: [0, 5.5, 0] }), part(cyl(1.5, 1.5, 4, 18), 'B', { p: [3, 2, 1.4], r: [0.2, 0, 0.3] })),
    moving: [{ geo: merge(part(cyl(1.05, 1.05, 2.4, 18), 'A', { p: [0, 1.2, 0] }), part(cone(1.05, 1.4, 18), 'A', { p: [0.2, 3, 0], r: [0, 0, -0.35] })), pivot: [0, 6.1, 0], anim: (t) => {
      const up = (Math.sin(t * 1.3) + 1) / 2;
      return { y: -1.6 + up * 1.8, ry: up * 4 };
    } }] }),
  // 10 car battery
  () => ({ geo: merge(part(box(7, 4.6, 4.4), K.ink, { p: [0, 2.3, 0] }), part(box(7.05, 0.8, 4.45), 'A', { p: [0, 4.2, 0] }), part(cyl(0.6, 0.6, 0.9, 12), K.red, { p: [-2.2, 5, 0] }), part(cyl(0.6, 0.6, 0.9, 12), K.steel, { p: [2.2, 5, 0] }), part(box(2.4, 0.3, 0.1), 'B', { p: [0, 2.4, 2.22] }),
    ),
    moving: [{ geo: part(extrude([[0, 0], [1, 1.4], [0.4, 1.4], [1.2, 3], [-0.2, 1.2], [0.4, 1.2]], 0.2), K.yellow, { p: [-0.5, -1.5, 0] }), pivot: [0.1, 2.3, 2.35], anim: (t) => {
      const f = cyc(t, 1.4);
      return { s: 1 + bump(f, 0.1, 0.04) * 0.5 + bump(f, 0.25, 0.04) * 0.35, rz: bump(f, 0.1, 0.04) * 0.2 };
    } }] }),
  // 11 price tag
  () => ({ geo: merge(...plinth(2.8), part(cyl(0.12, 0.12, 4, 8), K.ink, { p: [0, 2.4, 0] })),
    moving: [{ geo: merge(part(extrude([[-2.6, -1.8], [2, -1.8], [3.4, 0], [2, 1.8], [-2.6, 1.8]], 0.4), 'A'), part(cyl(0.35, 0.35, 0.5, 12), K.white, { p: [2.2, 0, 0], r: [Math.PI / 2, 0, 0] }),
      [1, -1].map((s) => merge(part(box(0.5, 2.4, 0.1), K.white, { p: [-0.8, 0, 0.25 * s] }), part(box(1.4, 0.4, 0.1), K.white, { p: [-0.8, 0.8, 0.25 * s] }), part(box(1.4, 0.4, 0.1), K.white, { p: [-0.8, -0.8, 0.25 * s] })))),
      pivot: [0, 6.4, 0], anim: (t) => ({ ry: Math.sin(t * 1.2) * 0.9, rz: Math.sin(t * 2.4) * 0.05 }) }] }),
  // 12 game controller
  () => ({ geo: merge(...plinth(3), ...roundBox(6.4, 1.4, 3.4, 1.2, 'A', [0, 4.6, 0]), part(cyl(1, 1, 1.4, 12), 'A', { p: [-2.4, 4.6, 1.4] }), part(cyl(1, 1, 1.4, 12), 'A', { p: [2.4, 4.6, 1.4] }),
    part(box(1.4, 0.3, 0.45), K.ink, { p: [-1.8, 5.4, -0.2] }), part(box(0.45, 0.3, 1.4), K.ink, { p: [-1.8, 5.4, -0.2] }), ring(4, (a, i) => part(cyl(0.3, 0.3, 0.3, 10), ['B', '#5fae5b', '#ffd23f', '#3d7be0'][i], { p: [1.8 + Math.cos(a) * 0.6, 5.4, -0.2 + Math.sin(a) * 0.6] })), beam([0, 3.9, -1.7], [0, 1, -3], 0.15, K.ink)) }),
);
EXTRA.health.push(
  // 3 hospital
  // A hospital: its air ambulance circles, lands on the roof pad, waits and takes off again.
  () => {
    const pad = [0, 9.1, 0.2], R = 4.6, H = 11.6;
    const around = (th) => [Math.cos(th) * R, H + Math.sin(th * 2) * 0.4, 0.2 + Math.sin(th) * R];
    const heli = merge(part(ball(0.95, 2), 'A', { s: [1.35, 1, 1] }), part(ball(0.6, 2), '#9dd0f2', { p: [0.75, 0.2, 0], s: [0.8, 0.8, 1.1] }), beam([-0.9, 0.1, 0], [-3.2, 0.5, 0], 0.28, 'A'),
      part(box(0.7, 0.9, 0.12), 'Ad', { p: [-3.2, 0.8, 0] }), part(box(0.5, 0.4, 0.08), K.white, { p: [0, 0.1, 0.92] }), part(box(0.14, 0.5, 0.08), 'B', { p: [0, 0.1, 0.96] }), part(box(0.5, 0.14, 0.08), 'B', { p: [0, 0.1, 0.96] }),
      [-0.55, 0.55].map((z) => part(box(2.4, 0.12, 0.12), K.dark, { p: [0, -0.9, z] })), [-0.55, 0.55].flatMap((z) => [beam([-0.5, -0.9, z], [-0.4, -0.5, z * 0.7], 0.08, K.dark), beam([0.5, -0.9, z], [0.4, -0.5, z * 0.7], 0.08, K.dark)]), part(cyl(0.12, 0.12, 0.4, 8), K.dark, { p: [0, 1.1, 0] }));
    return {
      geo: merge(part(box(7, 6, 4.4), K.white, { p: [0, 3, 0] }), part(box(3, 8, 3), K.white, { p: [0, 4, 0.2] }), part(box(2, 0.6, 0.1), 'A', { p: [0, 6.6, 1.72] }), part(box(0.6, 2, 0.1), 'A', { p: [0, 6.6, 1.72] }),
        ring(4, (a, i) => part(box(5.6, 0.6, 0.06), '#9dd0f2', { p: [0, 1.2 + i * 1.3, 2.22] })), part(box(1.6, 1.4, 0.1), 'B', { p: [0, 0.7, 2.25] }), part(cyl(1.4, 1.4, 0.15, 20), '#5fae5b', { p: [0, 8.1, 0.2] }),
        part(box(1, 0.06, 0.2), K.white, { p: [0, 8.2, 0.2] }), part(box(0.2, 0.06, 1), K.white, { p: [0, 8.2, 0.2] })),
      move: () => ({}),
      moving: [
        { geo: heli, pivot: pad, anim: (t) => {
          const f = cyc(t, 10);
          let at, ry, tilt = 0;
          if (f < 0.55) { const th = TAU * (f / 0.55); at = around(th); ry = -(th + Math.PI / 2); tilt = -0.18; }
          else if (f < 0.7) { const k = easeIO(win(f, 0.55, 0.7)); at = around(0).map((v, i) => v + (pad[i] - v) * k); ry = -Math.PI / 2; tilt = -0.12 * (1 - k); }
          else if (f < 0.82) { at = pad; ry = -Math.PI / 2; }
          else { const k = easeIO(win(f, 0.82, 1)); at = pad.map((v, i) => v + (around(0)[i] - v) * k); ry = -Math.PI / 2; tilt = -0.15 * k; }
          return { x: at[0] - pad[0], y: at[1] - pad[1], z: at[2] - pad[2], ry, rz: tilt, order: 'YXZ' };
        } },
        { geo: merge(part(box(4.6, 0.06, 0.32), K.dark), part(box(0.32, 0.06, 4.6), K.dark)), pivot: [0, 1.32, 0], parent: 0, anim: (t) => ({ ry: t * 14 }) },
        { geo: merge(part(box(0.06, 1.1, 0.16), K.dark), part(box(0.06, 0.16, 1.1), K.dark)), pivot: [-3.2, 0.5, 0.12], parent: 0, anim: (t) => ({ rz: t * 18 }) },
      ],
    };
  },
  // 4 stethoscope
  () => ({ geo: merge(...plinth(3.2), part(torus(2.2, 0.28, Math.PI * 1.5, 24), 'A', { p: [0, 5.6, 0], r: [0, 0, Math.PI * 0.75] }), part(ball(0.35, 0), K.steel, { p: [-1.6, 7.2, 0] }), part(ball(0.35, 0), K.steel, { p: [1.6, 7.2, 0] })),
    moving: [{ geo: merge(part(cyl(0.9, 0.9, 0.6, 18), K.steel, { p: [0, -1.2, 1.6], r: [Math.PI / 2, 0, 0] }), part(cyl(0.7, 0.7, 0.62, 18), 'B', { p: [0, -1.2, 1.6], r: [Math.PI / 2, 0, 0] }), beam([0, 0, 0], [0, -1, 1.4], 0.24, 'A')),
      pivot: [0, 3.4, 0], anim: (t) => ({ rx: Math.sin(t * 1.8) * 0.3, rz: Math.sin(t * 1.3) * 0.18 }) }] }),
  // 5 syringe
  () => {
    const press = (t) => { const f = cyc(t, 3.4); return easeIO(win(f, 0.12, 0.5)) * (1 - easeIO(win(f, 0.66, 0.95))); };
    return { geo: merge(...plinth(2.4), part(cyl(1, 1, 5.4, 16), '#e6f4f8', { p: [0, 4.6, 0] }), part(cyl(1.6, 1.6, 0.3, 16), K.white, { p: [0, 7.4, 0] }), part(cone(0.3, 0.9, 8), K.steel, { p: [0, 1.4, 0], r: [Math.PI, 0, 0] }), part(cyl(0.05, 0.05, 1.2, 6), K.steel, { p: [0, 0.6, 0] })),
      moving: [
        { geo: merge(part(cyl(0.3, 0.3, 4.6, 8), K.white, { p: [0, 7.4, 0] }), part(cyl(1, 1, 0.3, 16), 'B', { p: [0, 9.8, 0] }), part(cyl(0.88, 0.88, 0.4, 16), K.dark, { p: [0, 5.3, 0] })), pivot: [0, 0, 0], anim: (t) => ({ y: -press(t) * 2.4 }) },
        { geo: part(cyl(1.04, 1.04, 3, 16), 'A', { p: [0, 1.5, 0] }), pivot: [0, 2.1, 0], anim: (t) => ({ sy: 1 - press(t) * 0.8 }) },
      ] };
  },
  // 6 DNA helix
  () => ({ geo: merge(...plinth(2.6)), move: () => ({}),
    moving: [{ geo: merge(...Array.from({ length: 14 }, (_, i) => { const y = 1.4 + i * 0.6, a = i * 0.55; return [part(ball(0.42, 1), 'A', { p: [Math.cos(a) * 1.8, y, Math.sin(a) * 1.8] }), part(ball(0.42, 1), 'B', { p: [-Math.cos(a) * 1.8, y, -Math.sin(a) * 1.8] }), beam([Math.cos(a) * 1.6, y, Math.sin(a) * 1.6], [-Math.cos(a) * 1.6, y, -Math.sin(a) * 1.6], 0.14, i % 2 ? '#c3c9d0' : K.white)]; })),
      pivot: [0, 0, 0], anim: (t) => ({ ry: t * 0.9 }) }] }),
  // 7 microscope
  () => ({ geo: merge(part(box(5, 0.6, 3.4), K.ink, { p: [0, 0.3, 0] }), beam([1.4, 0.6, 0], [1, 6.4, 0], 0.9, 'A'), part(box(3, 0.4, 2.4), K.dark, { p: [-0.6, 2.8, 0] }), part(cyl(0.7, 0.8, 4.4, 14), K.white, { p: [-0.6, 6.4, 0], r: [0, 0, -0.35] }), part(cyl(0.45, 0.45, 1.2, 12), K.dark, { p: [-1.2, 4.4, 0] }), part(cyl(0.5, 0.5, 1.4, 12), 'B', { p: [0.4, 8.8, 0], r: [0, 0, -0.35] })) }),
  // 8 pharmacy storefront
  () => ({ geo: merge(part(box(8, 5, 4), K.white, { p: [0, 2.5, 0] }), part(box(8.2, 1.2, 0.3), 'A', { p: [0, 5.6, 2.05] }), part(box(0.2, 2.4, 0.2), K.steel, { p: [0, 5.6, 0.5] }), part(box(2.6, 2.4, 0.1), '#9dd0f2', { p: [-2.2, 2, 2.02] }), part(box(2.6, 2.4, 0.1), '#9dd0f2', { p: [2.2, 2, 2.02] }), part(box(1.2, 3, 0.1), K.wood, { p: [0, 1.5, 2.03] })),
    move: () => ({}),
    moving: [{ geo: merge(part(box(2.6, 0.7, 0.4), 'B'), part(box(0.7, 2.6, 0.4), 'B')), pivot: [0, 7.2, 0.5], anim: (t) => ({ ry: t * 1.6, s: 1 + Math.max(0, Math.sin(t * 5)) * 0.06 }) }] }),
  // 9 medical supply truck
  () => ({ geo: part(box(10, 0.1, 4.4), '#c9ced6', { p: [0, 0.05, 0] }), move: () => ({}),
    moving: [
      ...rolling(merge(part(box(6.4, 3.6, 3.2), K.white, { p: [-0.8, 2.6, 0] }), part(box(1.6, 0.5, 0.1), 'A', { p: [-0.8, 2.8, 1.62] }), part(box(0.5, 1.6, 0.1), 'A', { p: [-0.8, 2.8, 1.62] }), part(box(2, 2.6, 3), 'B', { p: [3.4, 2, 0] }), part(box(0.1, 1, 2.4), '#9dd0f2', { p: [4.42, 2.6, 0] }), part(box(1.6, 0.3, 1.4), K.dark, { p: [-0.8, 4.55, 0] })),
        [[2.8, 0.85, 1.6, 0.8], [2.8, 0.85, -1.6, 0.8], [-2.8, 0.85, 1.6, 0.8], [-2.8, 0.85, -1.6, 0.8]], tireAt0),
      ...[['#e5533d', -0.35], ['#3d7be0', 0.35]].map(([c, z], i) => ({ geo: part(box(0.6, 0.4, 0.6), c), pivot: [-0.8, 4.9, z * 1.4], parent: 0, anim: (t) => ({ s: Math.sin(t * 9 + i * Math.PI) > 0 ? 1.25 : 0.8 }) })),
    ] }),
);
EXTRA.bank.push(
  // 7 money bag: coins pop out of the top and roll away
  () => ({ geo: merge(part(ball(3, 2), 'A', { p: [0, 3.2, 0], s: [1, 0.95, 1] }), part(cyl(0.9, 1.4, 1.2, 14), 'A', { p: [0, 6.2, 0] }), part(torus(1, 0.22, Math.PI * 2, 16), K.gold, { p: [0, 6, 0], r: [Math.PI / 2, 0, 0] }), part(cone(1.4, 1.4, 6), 'Ad', { p: [0, 7.4, 0] }), part(box(0.4, 2.4, 0.2), 'B', { p: [0, 3.4, 2.9] }), part(box(1.6, 0.4, 0.2), 'B', { p: [0, 3.8, 2.92] }), part(box(1.6, 0.4, 0.2), 'B', { p: [0, 2.9, 2.92] })),
    moving: [0.7, 2.6, 4.6].map((a, i) => ({ geo: part(cyl(0.6, 0.6, 0.18, 18), K.gold, { r: [Math.PI / 2, 0, 0] }), pivot: [0, 7.6, 0], anim: (t) => {
      const f = cyc(t, 3, i / 3), k = win(f, 0, 0.55);
      return { x: Math.cos(a) * 4 * k, z: Math.sin(a) * 4 * k, y: 9 * k * (1 - k) * 1.1 - 7.2 * k * k, rx: k * 9, ry: a, s: life(f, 0, 0.06, 0.8, 0.95) };
    } })),
    move: (t) => { const f = cyc(t * 3, 3), s = bump(f, 0.02, 0.04) * 0.05; return { sy: 1 + s, sx: 1 - s * 0.5, sz: 1 - s * 0.5 }; },
  }),
  // 8 rising chart
  () => ({ geo: part(box(8, 0.5, 3), K.white, { p: [0, 0.25, 0] }),
    moving: [
      ...Array.from({ length: 5 }, (_, i) => ({ geo: part(box(1.1, 1.2 + i * 1.3, 1.1), i === 4 ? 'A' : 'Ad', { p: [0, (1.2 + i * 1.3) / 2, 0] }), pivot: [-2.8 + i * 1.4, 0.5, 0], anim: (t) => {
        const f = cyc(t, 5);
        return { sy: 0.08 + 0.92 * (back(win(f, 0.04 + i * 0.07, 0.2 + i * 0.07)) * (1 - easeIO(win(f, 0.86, 0.97)))) };
      } })),
      { geo: merge(beam([0, 0, 0], [2.8, 1.8, 0], 0.3, 'B'), beam([2.8, 1.8, 0], [4.4, 1.2, 0], 0.3, 'B'), beam([4.4, 1.2, 0], [7, 5.4, 0], 0.3, 'B'), part(cone(0.7, 1.2, 4), 'B', { p: [7.3, 5.9, 0], r: [0, 0, -0.55] })),
        pivot: [-3.4, 2.6, 1], anim: (t) => { const f = cyc(t, 5); return { s: back(win(f, 0.45, 0.6)) * (1 - easeIn(win(f, 0.84, 0.92))) }; } },
    ] }),
  // 9 briefcase
  () => ({ geo: merge(...plinth(3.4), ...roundBox(7, 4.6, 2.2, 0.5, 'A', [0, 3.2, 0]), part(torus(1, 0.25, Math.PI, 12), K.ink, { p: [0, 5.5, 0] }), part(box(7.1, 0.4, 2.25), 'Ad', { p: [0, 4, 0] }), part(box(0.8, 0.6, 0.2), K.gold, { p: [-1.6, 4.4, 1.15] }), part(box(0.8, 0.6, 0.2), K.gold, { p: [1.6, 4.4, 1.15] })) }),
  // 10 coin tower
  () => ({ geo: merge(...plinth(3.2), ...Array.from({ length: 14 }, (_, i) => part(cyl(1.6, 1.6, 0.42, 22), i % 2 ? K.gold : K.goldDk, { p: [Math.sin(i * 0.9) * 0.25, 0.9 + i * 0.44, Math.cos(i * 1.3) * 0.25] })), ring(3, (a, i) => part(cyl(1, 1, 0.3, 18), K.gold, { p: [Math.cos(a) * 2.9, 0.8 + i * 0.3, Math.sin(a) * 2.9] }))),
    // The top coin is flipped like a coin toss and lands back on the tower.
    moving: [{ geo: merge(part(cyl(1.7, 1.7, 0.3, 22), 'A'), part(cyl(1.1, 1.1, 0.32, 22), 'Ad')), pivot: [0, 7.2, 0], anim: (t) => {
      const f = cyc(t, 2.4), k = win(f, 0.15, 0.7);
      return { y: hop(k) * 4.5, rx: easeOut(k) * TAU * 2, sy: 1 - bump(f, 0.72, 0.03) * 0.3 };
    } }] }),
);
EXTRA.insurance.push(
  // 3 hourglass
  // The sand runs from the top bulb to the bottom one, then the glass flips over and starts again.
  () => {
    const f6 = (t) => cyc(t, 6), run = (t) => win(f6(t), 0, 0.74);
    return {
      geo: part(cyl(3.2, 3.2, 0.04, 24), K.stoneDk, { p: [0, 0.02, 0] }),
      move: () => ({}),
      moving: [
        { geo: merge(part(cyl(2.6, 2.6, 0.6, 6), 'A', { p: [0, -4, 0] }), part(cyl(2.6, 2.6, 0.6, 6), 'A', { p: [0, 4, 0] }), ring(3, (a) => part(cyl(0.2, 0.2, 7.4, 8), K.woodDk, { p: [Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2] })),
          // The glass, drawn as a light outline so the sand shows through.
          [1, -1].map((s) => merge(ring(8, (a) => beam([Math.cos(a) * 2, s * 3.6, Math.sin(a) * 2], [Math.cos(a) * 0.22, s * 0.2, Math.sin(a) * 0.22], 0.07, '#cfe9f2')), part(torus(2, 0.08, TAU, 24), '#cfe9f2', { p: [0, s * 3.6, 0], r: [Math.PI / 2, 0, 0] }))),
          part(cyl(0.24, 0.24, 0.5, 10), '#cfe9f2')),
          pivot: [0, 4.3, 0], anim: (t) => { const k = win(f6(t), 0.78, 0.98); return { rz: Math.PI * easeIO(k), y: Math.sin(Math.PI * k) * 1.2 }; } },
        { geo: part(cone(1.35, 2.3, 16), 'B', { p: [0, 1.15, 0], r: [Math.PI, 0, 0] }), pivot: [0, 0.2, 0], parent: 0, anim: (t) => ({ s: Math.cbrt(1 - run(t)) }) },
        { geo: part(cone(1.75, 1.7, 16), 'B', { p: [0, 0.85, 0] }), pivot: [0, -3.7, 0], parent: 0, anim: (t) => ({ s: Math.cbrt(run(t)) }) },
        { geo: part(box(0.1, 3.6, 0.1), 'B', { p: [0, -1.8, 0] }), pivot: [0, 0.2, 0], parent: 0, anim: (t) => ({ s: f6(t) > 0.02 && f6(t) < 0.74 ? 1 : 0 }) },
      ],
    };
  },
  // 4 padlock
  () => ({ geo: merge(...plinth(3), ...roundBox(5.4, 4.4, 2, 0.6, 'A', [0, 3.2, 0]), part(cyl(0.5, 0.5, 0.3, 12), K.ink, { p: [0, 3.4, 1.05], r: [Math.PI / 2, 0, 0] }), part(box(0.3, 1, 0.2), K.ink, { p: [0, 2.8, 1.05] }), part(box(5.5, 0.4, 2.05), 'B', { p: [0, 1.6, 0] })),
    moving: [{ geo: merge(part(torus(1.8, 0.45, Math.PI, 18), K.steel, { p: [-1.8, 0, 0] }), part(cyl(0.45, 0.45, 0.6, 12), K.steel, { p: [-3.6, -0.3, 0] }), part(cyl(0.45, 0.45, 0.6, 12), K.steel, { p: [0, -0.3, 0] })), pivot: [1.8, 5.4, 0], anim: (t) => {
      const f = cyc(t, 3.6), up = back(win(f, 0.15, 0.3)) * (1 - easeIn(win(f, 0.74, 0.84)));
      return { y: up * 1.3 - bump(f, 0.85, 0.02) * 0.1, ry: -1.7 * easeIO(win(f, 0.32, 0.46)) * (1 - easeIO(win(f, 0.58, 0.72))) };
    } }] }),
  // 5 anchor
  () => ({ geo: part(cyl(4, 4.2, 0.6, 28), 'W', { p: [0, 0.3, 0] }),
    moving: [{ geo: merge(part(box(0.7, 7, 0.7), 'A', { p: [0, -4, 0] }), part(box(3.6, 0.6, 0.6), 'A', { p: [0, -1.6, 0] }), part(torus(0.8, 0.25, TAU, 14), 'A'), part(torus(2.8, 0.35, Math.PI, 20), 'A', { p: [0, -5, 0], r: [0, 0, Math.PI] }), part(cone(0.7, 1.2, 4), 'A', { p: [-2.8, -4.8, 0] }), part(cone(0.7, 1.2, 4), 'A', { p: [2.8, -4.8, 0] }), part(torus(1.2, 0.12, Math.PI * 1.6, 14), '#d9c39a', { p: [0, -1.2, 0.5] })),
      pivot: [0, 8.6, 0], anim: (t) => ({ rz: Math.sin(t * 1.4) * 0.2, rx: Math.sin(t * 0.9) * 0.05 }) }] }),
);
EXTRA.oil.push(
  // 3 gas pump
  () => ({ geo: merge(part(box(4, 0.5, 3), K.stoneDk, { p: [0, 0.25, 0] }), part(box(2.8, 6.4, 2), 'A', { p: [0, 3.7, 0] }), part(box(2.2, 1.4, 0.1), '#2c3e55', { p: [0, 5.6, 1.02] }), part(box(2.9, 1, 2.1), 'B', { p: [0, 7.2, 0] }), part(box(0.6, 1.4, 0.6), K.ink, { p: [1.7, 4, 0.6] }), part(torus(1.2, 0.12, Math.PI, 12), K.ink, { p: [1.9, 2.8, 0.8], r: [0, Math.PI / 2, 0] })) }),
  // 4 refinery towers
  () => ({ geo: merge(part(box(8, 0.5, 4), K.stoneDk, { p: [0, 0.25, 0] }), part(cyl(1.2, 1.2, 8, 16), K.white, { p: [-2, 4.4, 0] }), part(cyl(1, 1, 6, 16), K.white, { p: [0.6, 3.4, -0.4] }), part(cyl(0.5, 0.5, 9.4, 12), K.steelDk, { p: [2.8, 5.2, 0.6] }), ring(3, (a, i) => part(cyl(1.25, 1.25, 0.4, 16), 'A', { p: [-2, 2 + i * 2.4, 0] })), beam([-0.8, 6, 0], [0.6, 5.6, -0.4], 0.3, K.steel), part(cyl(1.05, 1.05, 0.3, 16), 'B', { p: [0.6, 6.5, -0.4] })), move: () => ({}),
    moving: [
      { geo: merge(part(cone(0.6, 1.4, 10), K.orange, { p: [0, 0.7, 0] }), part(cone(0.34, 0.9, 8), K.yellow, { p: [0, 0.5, 0] })), pivot: [2.8, 9.9, 0.6], anim: (t) => ({ sy: 1 + Math.sin(t * 13) * 0.22 + Math.sin(t * 7.3) * 0.15, sx: 1 + Math.sin(t * 11) * 0.12, sz: 1 + Math.cos(t * 9) * 0.12, rz: Math.sin(t * 5) * 0.12 }) },
      ...[[-2, 8.5, 0], [0.6, 6.7, -0.4]].flatMap((at, j) => [0, 1, 2].map((i) => ({ geo: part(ball(0.7, 1), '#eeeae4'), pivot: at, anim: (t) => {
        const f = cyc(t, 3, i / 3 + j * 0.17);
        return { y: f * 4.4, x: f * 1.4, s: (0.5 + f * 1.1) * life(f, 0, 0.12, 0.7, 1) };
      } }))),
    ] }),
  // 5 tanker ship
  () => ({ geo: part(cyl(4.8, 5, 0.6, 28), 'W', { p: [0, 0.3, 0] }), move: () => ({}),
    moving: [
      { geo: merge(part(box(8.4, 1.8, 2.8), 'A', { p: [0, 0.9, 0] }), part(box(8.4, 0.4, 2.8), 'Ad', { p: [0, 2, 0] }), part(box(2, 2.6, 2.4), K.white, { p: [-3, 3.4, 0] }), part(cyl(0.4, 0.5, 1.6, 10), 'B', { p: [-3.4, 5.4, 0] }), ring(3, (a, i) => part(cyl(0.8, 0.8, 0.6, 14), K.white, { p: [-0.2 + i * 1.8, 2.5, 0] }))),
        pivot: [0, 0.6, 0], anim: (t) => ({ y: Math.sin(t * 1.5) * 0.14, rz: Math.sin(t * 1.1) * 0.05, rx: Math.sin(t * 0.8) * 0.04 }) },
      ...[0, 1, 2].map((i) => ({ geo: part(ball(0.5, 1), '#eeeae4'), pivot: [-3.4, 6.4, 0], parent: 0, anim: (t) => { const f = cyc(t, 2.4, i / 3); return { y: f * 3, x: f * 1.8, s: (0.5 + f) * life(f, 0, 0.12, 0.7, 1) }; } })),
    ] }),
);
EXTRA.power.push(
  // 3 solar array
  () => ({ geo: merge(part(box(8, 0.4, 5.6), K.stoneDk, { p: [0, 0.2, 0] }), ...[-1.8, 1.8].flatMap((z) => [-2.7, 0, 2.7].map((x) => [part(box(2.5, 0.12, 2.2), 'B', { p: [x, 2, z], r: [-0.6, 0, 0] }), part(box(0.15, 1.6, 0.15), K.steel, { p: [x, 1, z] })])), part(box(0.2, 0.2, 5.6), 'A', { p: [0, 0.5, 0] })),
    moving: [{ geo: merge(part(ball(1.2, 1), K.yellow), ring(8, (a) => beam([Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0], [Math.cos(a) * 2.3, Math.sin(a) * 2.3, 0], 0.18, K.yellow))), pivot: [3, 7, -2], anim: (t) => ({ rz: t * 0.7, y: Math.sin(t * 1.1) * 0.3, s: 1 + Math.sin(t * 3) * 0.06 }) }] }),
  // 4 cooling towers
  () => ({ geo: merge(part(box(9, 0.4, 5), K.stoneDk, { p: [0, 0.2, 0] }), part(cyl(1.8, 2.6, 6.4, 20), '#e4dccd', { p: [-2, 3.6, 0] }), part(cyl(1.5, 2.2, 5.2, 20), '#e4dccd', { p: [2.4, 3, 0.4] }), part(cyl(1.82, 1.82, 0.4, 20), 'A', { p: [-2, 6.4, 0] }), part(box(2, 1.6, 2), 'B', { p: [0.2, 0.9, -1.8] })),
    moving: [[-2, 6.6, 0, 4], [2.4, 5.6, 0.4, 3]].flatMap(([x, y, z, n], j) => Array.from({ length: n }, (_, i) => ({ geo: part(ball(1, 1), K.white), pivot: [x, y, z], anim: (t) => {
      const f = cyc(t, 3.6, i / n + j * 0.13);
      return { y: f * 5, x: f * 1.6 + Math.sin(t + i) * 0.2, s: (0.6 + f * 1.1) * life(f, 0, 0.15, 0.72, 1) };
    } }))) }),
  // 5 plug and socket
  () => ({ geo: merge(...plinth(3.2), ...roundBox(4, 5, 1.4, 0.6, K.white, [-1.2, 3.6, 0]), part(cyl(0.3, 0.3, 0.2, 10), K.ink, { p: [-1.8, 4, 0.72], r: [Math.PI / 2, 0, 0] }), part(cyl(0.3, 0.3, 0.2, 10), K.ink, { p: [-0.6, 4, 0.72], r: [Math.PI / 2, 0, 0] }),
    part(box(2.4, 2.6, 2), 'A', { p: [2.4, 4.4, 0.8] }), part(box(0.25, 1, 0.25), K.steel, { p: [1.9, 2.7, 0.8] }), part(box(0.25, 1, 0.25), K.steel, { p: [2.9, 2.7, 0.8] }), beam([2.4, 5.7, 0.8], [3.6, 8, 0], 0.35, 'Ad')) }),
);
EXTRA.industrial.push(
  // 3 excavator
  () => ({ geo: part(box(5.4, 1.2, 3.6), K.ink, { p: [0, 0.6, 0] }),
    moving: [
      { geo: merge(part(box(4, 2.4, 3), 'A', { p: [0, 1.2, 0] }), part(box(1.6, 1.8, 1.6), '#2c3e55', { p: [-0.8, 3, 0.6] }), part(box(1.4, 1, 2.6), K.dark, { p: [-1.9, 1.4, 0] })), pivot: [-0.4, 1.2, 0], anim: (t) => ({ ry: Math.sin(t * 0.6) * 0.5 }) },
      { geo: merge(beam([0, 0, 0], [2.4, 3.4, 0], 0.7, 'A')), pivot: [1.6, 1.8, 0], parent: 0, anim: (t) => ({ rz: Math.sin(t * 1.2) * 0.22 }) },
      { geo: merge(beam([0, 0, 0], [1.4, -3.4, 0], 0.6, 'A')), pivot: [2.4, 3.4, 0], parent: 1, anim: (t) => ({ rz: Math.sin(t * 1.2 - 0.8) * 0.3 }) },
      { geo: merge(part(box(1.6, 1.2, 1.8), K.steelDk, { p: [0.2, -0.5, 0] }), part(box(0.2, 0.4, 1.8), K.steel, { p: [-0.6, -1.1, 0] })), pivot: [1.4, -3.4, 0], parent: 2, anim: (t) => ({ rz: 0.5 + Math.sin(t * 1.2 - 1.6) * 0.5 }) },
    ] }),
  // 4 paint can and brush
  () => ({ geo: merge(part(cyl(2.6, 2.6, 4.6, 24), K.steel, { p: [0, 2.3, 0] }), part(cyl(2.65, 2.65, 2.6, 24), 'A', { p: [0, 2.3, 0] }), part(cyl(2.5, 2.5, 0.3, 24), 'A', { p: [0, 4.7, 0] }), part(torus(2.6, 0.08, Math.PI, 16), K.ink, { p: [0, 4.6, 0], r: [0, Math.PI / 2, 0] }),
    ),
    moving: [
      { geo: merge(part(box(2, 0.5, 2.4), K.wood, { p: [0.8, 1.2, 0], r: [0, 0, -0.5] }), part(box(2, 1.4, 2.4), 'Ad', { p: [0, 0, 0], r: [0, 0, -0.5] }), part(cyl(0.3, 0.3, 3, 8), K.wood, { p: [2, 2.6, 0], r: [0, 0, -0.5] })), pivot: [2.4, 2.4, 1.2],
        anim: (t) => { const f = cyc(t, 2.6), d = bump(f, 0.3, 0.12); return { y: d * 1.2 - 0.2, x: -d * 0.6, rz: d * 0.35 }; } },
      { geo: part(ball(0.28, 1), 'A', { s: [1, 1.5, 1] }), pivot: [1.9, 1.5, 1.2], anim: (t) => { const f = cyc(t, 2.6, -0.5), k = win(f, 0, 0.4); return { y: -easeIn(k) * 1.4, s: life(f, 0, 0.05, 0.38, 0.42) }; } },
    ] }),
  // 5 garbage truck
  () => ({ geo: merge(part(box(5.4, 3.4, 3.2), 'A', { p: [-1, 2.6, 0] }), part(box(2, 2.6, 3), K.white, { p: [3.2, 2.2, 0] }), part(box(0.1, 1, 2.4), '#9dd0f2', { p: [4.22, 2.8, 0] }), part(box(5.5, 0.5, 3.25), 'Ad', { p: [-1, 3, 0] }), tire([2.8, 0.85, 1.6], 0.8), tire([2.8, 0.85, -1.6], 0.8), tire([-2.6, 0.85, 1.6], 0.8), tire([-2.6, 0.85, -1.6], 0.8), beam([-3.7, 4.3, 1.5], [-4.2, 2.4, 1.5], 0.2, K.dark)),
    moving: [{ geo: merge(part(box(1.2, 1.6, 1.2), 'B', { p: [-0.4, -1.4, 0] }), part(box(1.3, 0.15, 1.3), 'Bd', { p: [-0.4, -0.55, 0] })), pivot: [-3.7, 2.4, 0.8], anim: (t) => {
      const f = cyc(t, 4), up = easeIO(win(f, 0.15, 0.4)) * (1 - easeIO(win(f, 0.6, 0.85)));
      return { rz: -2.3 * up, y: up * 1.6, x: up * 0.3 + bump(f, 0.48, 0.03) * 0.08 };
    } }] }),
  // 6 cardboard carton line
  () => ({ geo: merge(part(box(9, 0.5, 3), K.dark, { p: [0, 1.6, 0] }), beam([-4.2, 0, 1.2], [-4.2, 1.4, 1.2], 0.3, K.steelDk), beam([4.2, 0, 1.2], [4.2, 1.4, 1.2], 0.3, K.steelDk), beam([0, 1.8, -1.6], [0, 6, -1.6], 0.3, K.steelDk), part(box(0.3, 0.3, 1.8), K.steelDk, { p: [0, 6, -0.8] })),
    moving: [
      ...ring(5, (a, i) => ({ geo: merge(part(cyl(0.3, 0.3, 3.1, 10), K.steel, { r: [Math.PI / 2, 0, 0] }), part(box(0.62, 0.1, 3.12), K.steelDk)), pivot: [-3.6 + i * 1.8, 1.2, 0], anim: (t) => ({ rz: -t * 3 }) })),
      ...[0, 1, 2].map((i) => ({ geo: merge(part(box(1.8, 1.6, 1.8), '#c99a62', { p: [0, 0.8, 0] }), part(box(1.82, 0.3, 0.5), '#e8d3ad', { p: [0, 1.45, 0] })), pivot: [0, 1.85, 0], anim: (t) => { const f = cyc(t, 4.5, i / 3); return { x: -4.4 + f * 8.8, s: life(f, 0, 0.06, 0.92, 1) }; } })),
      { geo: merge(part(box(1.4, 0.2, 1.8), 'A'), part(box(0.3, 1.4, 0.3), K.steel, { p: [0, 0.8, 0] })), pivot: [0, 4.4, 0], anim: (t) => ({ y: -bump(cyc(t, 1.5), 0.5, 0.06) * 0.9 }) },
    ] }),
);
EXTRA.software.push(
  // 3 terminal window
  () => ({ geo: merge(part(box(8.6, 6, 0.6), K.ink, { p: [0, 4.6, 0] }), part(box(8.6, 0.8, 0.65), 'A', { p: [0, 7.3, 0] }), part(box(2.4, 1.6, 1.6), K.steelDk, { p: [0, 0.8, 0] }), part(box(0.4, 0.4, 0.1), '#5fd08f', { p: [-3.7, 6.2, 0.32] })),
    moving: [
      ...[[3, 'B'], [5, '#5fd08f'], [2, '#c3c9d0'], [4, '#5fd08f']].map(([w, c], i) => ({ geo: part(box(w, 0.4, 0.1), c, { p: [w / 2, 0, 0] }), pivot: [-3.2, 6.2 - i * 0.9, 0.32], anim: (t) => { const f = cyc(t, 4.5); return { sx: win(f, 0.05 + i * 0.17, 0.18 + i * 0.17) * (1 - win(f, 0.9, 0.96)) }; } })),
      { geo: part(box(0.5, 0.5, 0.1), K.white), pivot: [-3.2, 2.6, 0.34], anim: (t) => ({ s: cyc(t, 0.8) < 0.5 ? 1 : 0 }) },
    ] }),
  // 4 dashboard chart
  () => ({ geo: merge(part(box(8.6, 6, 0.5), K.white, { p: [0, 4.6, 0] }), part(box(2.4, 1.6, 1.6), K.steelDk, { p: [0, 0.8, 0] }), part(box(4.4, 0.08, 0.1), '#c3c9d0', { p: [2.3, 2.56, 0.3] })),
    moving: [
      { geo: part(cyl(1.6, 1.6, 0.2, 24, 1), (x, y, z) => (x > 0 && z > -0.4 ? 'A' : 'B'), { r: [Math.PI / 2, 0, 0] }), pivot: [-2.4, 5, 0.3], anim: (t) => ({ rz: -t * 0.8 }) },
      ...ring(4, (a, i) => ({ geo: part(box(0.8, 1 + i * 0.8, 0.2), i % 2 ? 'A' : 'B', { p: [0, (1 + i * 0.8) / 2, 0] }), pivot: [0.8 + i * 1, 2.6, 0.3], anim: (t) => ({ sy: 0.65 + 0.35 * Math.sin(t * 1.6 + i * 1.4) }) })),
    ] }),
  // 5 envelope
  () => {
    const open = (t) => { const f = cyc(t, 4.4); return easeIO(win(f, 0.08, 0.26)) * (1 - easeIO(win(f, 0.8, 0.95))); };
    const letter = (t) => { const f = cyc(t, 4.4); return back(win(f, 0.26, 0.42)) * (1 - easeIO(win(f, 0.66, 0.8))); };
    return { geo: merge(...plinth(3.4), part(box(7, 4.6, 0.3), K.white, { p: [0, 4.4, -0.15] }), part(extrude([[-3.5, -2.3], [0, 0.2], [3.5, -2.3]], 0.2), '#eef0ec', { p: [0, 4.4, 0.32] }), part(box(7, 4.6, 0.1), '#eef0ec', { p: [0, 4.4, 0.26] })),
      moving: [
        { geo: merge(part(box(6.2, 4, 0.08), K.white), ring(4, (a, i) => part(box(i === 0 ? 2.4 : 4.6, 0.25, 0.04), i === 0 ? 'A' : '#c3c9d0', { p: [i === 0 ? -1.7 : -0.4, 1.3 - i * 0.7, 0.06] }))), pivot: [0, 4.4, 0.1], anim: (t) => ({ y: letter(t) * 3.4 }) },
        { geo: merge(part(extrude([[-3.5, 0], [3.5, 0], [0, -2.7]], 0.2), 'A'), part(cyl(0.6, 0.6, 0.2, 16), 'B', { p: [0, -2.5, 0.15], r: [Math.PI / 2, 0, 0] })), pivot: [0, 6.7, 0.42], anim: (t) => ({ rx: -2.9 * open(t) }) },
      ] };
  },
  // 6 puzzle pieces
  () => ({ geo: merge(...plinth(3.6), part(box(3.2, 3.2, 1), 'A', { p: [-1.6, 3, 0] }), part(cyl(0.7, 0.7, 1, 14), 'A', { p: [0.1, 3, 0], r: [Math.PI / 2, 0, 0] }), part(box(3.2, 3.2, 1), 'B', { p: [1.8, 3.2, 0.3], r: [0, 0, 0.15] }), ),
    moving: [{ geo: merge(part(box(3.2, 3.2, 1), 'Ad', { p: [0, 1.7, 0] }), part(cyl(0.7, 0.7, 1, 14), 'Ad', { r: [Math.PI / 2, 0, 0] })), pivot: [-1.4, 4.7, 0.2], anim: (t) => {
      const f = cyc(t, 3.4), away = f < 0.3 ? 1 - easeOut(win(f, 0, 0.3)) : f > 0.78 ? easeIn(win(f, 0.78, 1)) : 0;
      return { y: away * 4, x: away * -1.5, rz: away * 0.8 - bump(f, 0.31, 0.02) * 0.04, s: f < 0.02 || f > 0.98 ? 0 : 1 };
    } }] }),
);
EXTRA.car.push(
  // 3 motorcycle
  () => {
    const wheelie = (t) => hop(win(cyc(t, 3.2), 0.25, 0.75)) * 0.38;
    const tyre = merge(part(torus(1.05, 0.3, TAU, 22), '#2b2b2e'), part(cyl(0.75, 0.75, 0.3, 14), K.steel, { r: [Math.PI / 2, 0, 0] }), part(box(1.5, 0.18, 0.34), K.steelDk), part(box(0.18, 1.5, 0.34), K.steelDk));
    return { geo: merge(...plinth(3.6)), move: () => ({}),
      moving: [
        { geo: merge(part(box(3.4, 1.2, 1.2), 'A', { p: [2.4, 2.7, 0], r: [0, 0, -0.1] }), part(box(2.2, 0.6, 1.1), K.ink, { p: [1.2, 3.5, 0] }), part(box(1.4, 1.2, 1), K.steel, { p: [2.6, 1.7, 0] }), beam([5, 1.3, 0], [4.2, 4.3, 0], 0.25, K.steel), part(box(0.25, 0.25, 2.4), K.ink, { p: [4.2, 4.3, 0] }), part(cyl(0.3, 0.3, 0.3, 10), K.yellow, { p: [4.6, 3.7, 0], r: [0, 0, Math.PI / 2] }), beam([0, 1.3, 0], [2, 2.3, 0], 0.2, K.steel)),
          pivot: [-2.4, 0.6, 0], anim: (t) => ({ rz: wheelie(t) }) },
        { geo: tyre, pivot: [0, 1.4, 0], parent: 0, anim: (t) => ({ rz: -t * 6 }) },
        { geo: tyre, pivot: [5, 1.4, 0], parent: 0, anim: (t) => ({ rz: -t * 6 }) },
      ] };
  },
  // 4 camper van
  () => ({ geo: part(box(10.4, 0.1, 4.6), '#c9ced6', { p: [0, 0.05, 0] }), move: () => ({}),
    moving: rolling(merge(part(box(7.6, 4, 3.4), K.white, { p: [0, 3, 0] }), part(box(7.65, 0.8, 3.45), 'A', { p: [0, 2.2, 0] }), part(box(2.6, 1, 0.1), '#9dd0f2', { p: [-1.6, 3.8, 1.72] }), part(box(1.4, 1.2, 0.1), '#9dd0f2', { p: [2.8, 3.8, 1.72] }), part(box(3.4, 0.5, 2.4), 'B', { p: [-0.4, 5.25, 0] })),
      [[2.4, 0.9, 1.7, 0.85], [2.4, 0.9, -1.7, 0.85], [-2.4, 0.9, 1.7, 0.85], [-2.4, 0.9, -1.7, 0.85]], tireAt0, { reach: 0.7, speed: 0.8 }) }),
  // 5 semi truck cab
  () => ({ geo: part(box(10, 0.1, 4.4), '#c9ced6', { p: [0, 0.05, 0] }), move: () => ({}),
    moving: [
      ...rolling(merge(part(box(3.4, 4.6, 3.2), 'A', { p: [1.4, 3.1, 0] }), part(box(0.1, 1.4, 2.6), '#9dd0f2', { p: [3.12, 4, 0] }), part(box(2.4, 0.8, 3.2), K.steel, { p: [3.6, 1.6, 0] }), part(box(4, 1, 3), K.ink, { p: [-2.4, 1.6, 0] }), part(cyl(0.2, 0.2, 3.6, 8), K.steel, { p: [-0.6, 5.4, 1.4] }), part(box(3.5, 0.6, 3.25), 'B', { p: [1.4, 5.1, 0] })),
        [[2.6, 0.9, 1.6, 0.9], [2.6, 0.9, -1.6, 0.9], [-2.6, 0.9, 1.6, 0.9], [-2.6, 0.9, -1.6, 0.9]], tireAt0, { reach: 0.6, speed: 0.8 }),
      ...[0, 1, 2].map((i) => ({ geo: part(ball(0.45, 1), '#7d8792'), pivot: [-0.6, 7.3, 1.4], parent: 0, anim: (t) => { const f = cyc(t, 1.8, i / 3); return { y: f * 3, x: -f * 2, s: (0.5 + f * 1.2) * life(f, 0, 0.1, 0.6, 1) }; } })),
    ] }),
  // 6 engine block
  () => ({ geo: merge(...plinth(3.6), part(box(5.4, 3, 3), K.steelDk, { p: [0, 2.4, 0] }), ring(6, (a, i) => part(box(0.12, 2.6, 0.2), K.steel, { p: [-2.2 + i * 0.9, 2.4, 1.52] }))), move: (t) => ({ x: Math.sin(t * 31) * 0.003 }),
    moving: [
      ...[0, Math.PI, Math.PI, 0].map((ph, i) => ({ geo: merge(part(cyl(0.5, 0.5, 1.2, 12), 'A'), part(cyl(0.56, 0.56, 0.2, 12), 'Bd', { p: [0, 0.6, 0] })), pivot: [-1.8 + i * 1.2, 4.4, 0], anim: (t) => ({ y: (Math.sin(t * 7 + ph) + 1) * 0.35 }) })),
      { geo: merge(part(cyl(1.2, 1.2, 0.5, 18), K.ink, { r: [0, 0, Math.PI / 2] }), part(box(0.52, 2, 0.3), K.steel)), pivot: [3, 2.4, 0], anim: (t) => ({ rx: t * 7 }) },
    ] }),
);
EXTRA.ai.push(
  // 3 magic wand
  () => ({ geo: merge(...plinth(2.6)),
    moving: [
      { geo: merge(beam([0, 0, 0], [3.4, 7, 0], 0.5, K.ink), part(cyl(0.3, 0.3, 1, 10), K.white, { p: [3.2, 6.6, 0], r: [0, 0, -0.45] }), part(star(1.8, 0.6), 'A', { p: [3.8, 8, 0] })), pivot: [-1.6, 1, 0], anim: (t) => ({ rz: Math.sin(t * 1.8) * 0.18, rx: Math.sin(t * 1.1) * 0.08 }) },
      ...ring(5, (a, i) => ({ geo: part(star(0.5, 0.2), 'B'), pivot: [2.2 + Math.cos(a) * 2.6, 9 + Math.sin(a) * 2.2, 0.3], anim: (t) => ({ s: 0.4 + Math.abs(Math.sin(t * 2.2 + i * 1.3)) * 0.9, rz: t * (i % 2 ? 1.5 : -1.5) }) })),
    ] }),
  // 4 open book with sparks
  () => ({ geo: merge(...plinth(3.4), part(box(3.4, 0.4, 4.4), 'A', { p: [-1.75, 2.2, 0], r: [0, 0, 0.18] }), part(box(3.4, 0.4, 4.4), 'A', { p: [1.75, 2.2, 0], r: [0, 0, -0.18] }), part(box(3.2, 0.3, 4.2), K.white, { p: [-1.7, 2.55, 0], r: [0, 0, 0.18] }), part(box(3.2, 0.3, 4.2), K.white, { p: [1.7, 2.55, 0], r: [0, 0, -0.18] })),
    moving: [
      ...[0, 1].map((i) => ({ geo: part(box(3.2, 0.06, 4.1), i ? '#f6f2e8' : K.white, { p: [1.65, 0, 0] }), pivot: [0, 2.75, 0], anim: (t) => { const f = cyc(t, 3.2, -i * 0.12); return { rz: -0.18 + (Math.PI + 0.36) * easeIO(win(f, 0.2, 0.5)) }; } })),
      ...ring(3, (a, i) => ({ geo: part(star(0.7 - i * 0.12, 0.25), 'B'), pivot: [-1 + i * 1.2, 3.2, (i - 1) * 0.6], anim: (t) => { const f = cyc(t, 3.2, i / 3); return { y: f * 5, ry: t * 2 + i, s: life(f, 0, 0.12, 0.7, 1) }; } })),
    ] }),
  // 5 lightbulb idea with gears
  () => ({ geo: merge(...plinth(2.8), part(cyl(1, 1.1, 2, 14), K.steel, { p: [0, 1.6, 0] }), part(ball(2.6, 2), 'A', { p: [0, 4.8, 0] }), part(torus(0.5, 0.15, Math.PI * 2, 12), K.white, { p: [0.6, 5.4, 0.3] })),
    moving: [0, 1, 2].map((i) => ({ geo: merge(part(torus(3.3, 0.1, TAU, 40), 'B'), part(ball(0.32, 1), K.white, { p: [3.3, 0, 0] })), pivot: [0, 4.8, 0], anim: (t) => ({ rx: 1.2 + i * 0.5, ry: i * 2.1, rz: t * (1.2 + i * 0.4), order: 'YXZ' }) })) }),
  // 6 translation: one speech bubble speaks, the other answers in another language
  () => {
    // A rounded speech bubble standing upright, its tail at the bottom on side `tail` (±1).
    const bubble = (w, h, color, tail) => {
      const r = 0.7, x0 = -w / 2, y0 = 0, sh = new THREE.Shape();
      sh.moveTo(x0 + r, y0);
      sh.lineTo(tail * w * 0.15 - 0.5, y0); sh.lineTo(tail * w * 0.32, y0 - 1.2); sh.lineTo(tail * w * 0.15 + 0.5, y0);
      sh.lineTo(x0 + w - r, y0); sh.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
      sh.lineTo(x0 + w, y0 + h - r); sh.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
      sh.lineTo(x0 + r, y0 + h); sh.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
      sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -0.4);
      return part(g, color);
    };
    const lines = (ws, y, z) => ws.map((w, i) => part(box(w, 0.3, 0.1), K.white, { p: [-1.6 + w / 2, y - i * 0.7, z] }));
    const say = (a, b, c, d) => (t) => { const f = cyc(t, 3.6); return { s: life(f, a, b, c, d), rz: Math.sin(t * 3) * 0.04 }; };
    return { geo: merge(...plinth(3.4), part(cyl(0.18, 0.18, 2.6, 8), K.steelDk, { p: [-1.6, 1.9, 0] }), part(cyl(0.18, 0.18, 4.4, 8), K.steelDk, { p: [1.6, 2.8, 0.8] })),
      moving: [
        { geo: merge(bubble(4.6, 3, 'A', -1), lines([2.8, 2, 2.4], 2.2, 0.45)), pivot: [-1.6, 4.4, 0], anim: say(0, 0.08, 0.5, 0.58) },
        { geo: merge(bubble(4.6, 3, 'B', 1), lines([2.2, 3, 1.6], 2.2, 0.45)), pivot: [1.6, 6.2, 0.8], anim: say(0.32, 0.4, 0.86, 0.94) },
      ] };
  },
);
EXTRA.payments.push(
  // 3 crypto coin
  () => ({ geo: merge(...plinth(3), part(box(0.4, 1.4, 0.4), K.steel, { p: [0, 1.4, 0] })),
    moving: [{ geo: merge(part(cyl(3, 3, 0.8, 32), 'A', { r: [Math.PI / 2, 0, 0] }), part(cyl(2.4, 2.4, 0.85, 32), 'Ad', { r: [Math.PI / 2, 0, 0] }),
      [1, -1].map((side) => merge(part(box(0.5, 2.6, 0.2), 'B', { p: [-0.3, 0, 0] }), part(extrude([[0, 1.3], [1.3, 0.6], [0, 0], [1.3, -0.6], [0, -1.3]], 0.2), 'B')).rotateY(side > 0 ? 0 : Math.PI).translate(0, 0, side * 0.5))),
      pivot: [0, 5, 0], anim: (t) => ({ ry: t * 1.4 + Math.sin(t * 1.4) * 0.6, y: Math.sin(t * 2.8) * 0.2 }) }] }),
  // 4 tap-to-pay phone
  () => ({ geo: merge(...plinth(3), ...roundBox(3.6, 7, 0.5, 0.5, K.ink, [0, 4.8, 0]).map((g) => g.rotateX(Math.PI / 2).translate(0, 4.8, -4.8)), part(box(3, 6, 0.06), 'A', { p: [0, 4.8, 0.28] }), part(cyl(0.7, 0.7, 0.08, 18), K.white, { p: [0, 4.8, 0.33], r: [Math.PI / 2, 0, 0] })),
    moving: [0, 1, 2].map((i) => ({ geo: part(torus(1 + i * 0.6, 0.12, Math.PI / 2, 12), 'B', { r: [0, 0, -Math.PI / 4] }), pivot: [2.2, 6.6, 0.4], anim: (t) => {
      const f = cyc(t, 1.6, -i * 0.12);
      return { s: life(f, 0, 0.12, 0.45, 0.6) };
    } })) }),
  // 5 ATM
  () => ({ geo: merge(part(box(4.4, 7.6, 3), 'A', { p: [0, 3.8, 0] }), part(box(3.4, 2, 0.1), '#7cc0ff', { p: [0, 5.6, 1.52] }), ring(9, (a, i) => part(box(0.5, 0.3, 0.2), K.white, { p: [-0.7 + (i % 3) * 0.7, 3.8 - Math.floor(i / 3) * 0.5, 1.6] })), part(box(2.4, 0.3, 0.3), K.ink, { p: [0, 2, 1.55] }), part(box(4.5, 1, 3.1), 'B', { p: [0, 7.3, 0] })),
    moving: [{ geo: merge(part(box(2, 0.05, 1.5), K.money, { p: [0, 0, 0.75] }), part(box(2, 0.05, 1.5), '#86c788', { p: [0, 0.06, 0.7] })), pivot: [0, 2, 1.3], anim: (t) => {
      const f = cyc(t, 3.4), out = easeOut(win(f, 0.1, 0.3)) * (1 - easeIO(win(f, 0.75, 0.9)));
      return { z: out * 1.2, rx: out * 0.35 + Math.sin(t * 3) * 0.04 * out, s: f > 0.08 && f < 0.92 ? 1 : 0 };
    } }] }),
  // 6 gold bars on a cart
  () => ({ geo: merge(part(box(6, 0.5, 3.6), K.steelDk, { p: [0, 1.2, 0] }), tire([-2.2, 0.6, 1.6], 0.55, 0.4), tire([2.2, 0.6, 1.6], 0.55, 0.4), tire([-2.2, 0.6, -1.6], 0.55, 0.4), tire([2.2, 0.6, -1.6], 0.55, 0.4), ...[[-1.5, 1.85, -0.8], [1.5, 1.85, -0.8], [-1.5, 1.85, 0.8], [1.5, 1.85, 0.8], [0, 2.65, 0]].map((p) => part(cyl(0.95, 1.3, 0.8, 4), K.gold, { p, r: [0, Math.PI / 4, 0], s: [1.6, 1, 0.9] })), beam([3, 1.4, 0], [4.6, 4, 0], 0.3, 'A')) }),
);
EXTRA.food.push(
  // 3 cereal bowl
  () => ({ geo: merge(part(new THREE.SphereGeometry(3.4, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'A', { p: [0, 3.6, 0] }), part(cyl(3.3, 3.3, 0.3, 24), K.white, { p: [0, 3.4, 0] }), ring(14, (a, i) => part(torus(0.35, 0.15, Math.PI * 2, 10), ['#f3c443', '#e5533d', '#5fae5b'][i % 3], { p: [Math.cos(a * 1.7) * 2.2 * ((i % 3) / 3 + 0.3), 3.65, Math.sin(a * 1.7) * 2.2 * ((i % 3) / 3 + 0.3)], r: [Math.PI / 2, 0, 0] })), part(cyl(1.4, 1.4, 0.4, 18), 'B', { p: [0, 0.2, 0] })),
    moving: [{ geo: merge(part(box(0.5, 0.2, 4.8), K.steel, { p: [0.6, 1.2, 1.4], r: [0.6, 0, 0] }), part(ball(0.6, 2), K.steel, { p: [0.6, 0.1, -0.4], s: [1, 0.35, 1.3] })), pivot: [0, 3.6, 0], anim: (t) => ({ ry: t * 1.4 }) }] }),
  // 4 chocolate bar
  () => ({ geo: merge(...plinth(3.4), part(box(6, 0.8, 3.6), '#6b3b22', { p: [0, 1.6, 0], r: [0, 0, 0.1] }), ...[0, 1, 2].flatMap((i) => [0, 1].map((j) => (i === 0 && j === 1 ? [] : part(box(1.7, 0.4, 1.5), '#7a4a2c', { p: [-2 + i * 2, 2.1 + (-2 + i * 2) * 0.1, -0.85 + j * 1.7], r: [0, 0, 0.1] })))), part(box(3.4, 1.2, 3.8), 'A', { p: [2.4, 3.2, 0], r: [0, 0, 0.6] }), part(box(3.42, 0.4, 3.82), 'B', { p: [2.4, 3.2, 0], r: [0, 0, 0.6] })),
    moving: [{ geo: merge(part(box(1.9, 0.8, 1.6), '#6b3b22', { p: [0, -0.2, 0] }), part(box(1.7, 0.4, 1.5), '#7a4a2c', { p: [0, 0.3, 0] })), pivot: [-2, 1.9, 0.85], anim: (t) => {
      const f = cyc(t, 3), k = win(f, 0.15, 0.7);
      return { y: hop(k) * 3, x: -hop(k) * 0.8, rx: easeOut(k) * TAU, rz: 0.1 };
    } }] }),
  // 5 cheese wedge
  () => ({ geo: merge(...plinth(3.2), part(extrude([[-3, 0], [3, 0], [3, 3.6]], 3.2), '#f6c443', { p: [0, 0.7, 0] }), ...[[1.6, 1.6, 1.62], [0.4, 1.2, 1.62], [2.2, 2.6, 1.62]].map((p) => part(cyl(0.4, 0.4, 0.1, 12), '#e2a835', { p, r: [Math.PI / 2, 0, 0] })), part(box(0.3, 4, 0.3), K.steel, { p: [-1.6, 3, 0] }), part(box(1.6, 1, 0.1), 'A', { p: [-1.6, 4.6, 0] })) }),
  // 6 soup can
  () => ({ geo: merge(part(cyl(2.4, 2.4, 6, 24), 'A', { p: [0, 3, 0] }), part(cyl(2.42, 2.42, 2.6, 24), K.white, { p: [0, 2.4, 0] }), part(cyl(2.3, 2.3, 0.2, 24), K.steel, { p: [0, 6.05, 0] }), part(cyl(2.3, 2.3, 0.2, 24), K.steel, { p: [0, 0.05, 0] }), part(cyl(0.8, 0.8, 0.1, 16), 'B', { p: [0, 2.4, 2.42], r: [Math.PI / 2, 0, 0] }), part(new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.white, { p: [3.6, 0, 1.4] })),
    moving: [0, 1, 2].map((i) => ({ geo: part(ball(0.55, 1), K.white), pivot: [0, 6.4, 0], anim: (t) => { const f = cyc(t, 2.6, i / 3); return { y: f * 3.6, x: Math.sin(f * 7 + i * 2) * 0.5 + (i - 1) * 0.6, s: (0.5 + f) * life(f, 0, 0.15, 0.6, 1) }; } })) }),
  // 7 drumstick
  () => ({ geo: merge(...plinth(3), part(ball(2, 1), '#c9772e', { p: [-0.8, 4.4, 0], s: [1.4, 1, 1] }), part(cyl(0.45, 0.45, 3.4, 10), '#f3ead8', { p: [2.2, 5.2, 0], r: [0, 0, 1.1] }), part(ball(0.6, 0), '#f3ead8', { p: [3.6, 5.9, 0.3] }), part(ball(0.6, 0), '#f3ead8', { p: [3.6, 5.9, -0.3] }), part(cyl(3, 3, 0.25, 24), 'A', { p: [0, 0.85, 0] })),
    moving: [0, 1, 2].map((i) => ({ geo: part(ball(0.55, 1), K.white), pivot: [-0.8, 6, 0], anim: (t) => { const f = cyc(t, 2.6, i / 3); return { y: f * 3.6, x: Math.sin(f * 7 + i * 2) * 0.5 + (i - 1) * 0.6, s: (0.5 + f) * life(f, 0, 0.15, 0.6, 1) }; } })) }),
);
EXTRA.retail.push(
  // 13 clothing rack
  () => ({ geo: merge(part(box(7, 0.4, 2.4), K.steelDk, { p: [0, 0.2, 0] }), beam([-3.2, 0.4, 0], [-3.2, 6, 0], 0.2, K.steel), beam([3.2, 0.4, 0], [3.2, 6, 0], 0.2, K.steel), beam([-3.2, 6, 0], [3.2, 6, 0], 0.15, K.steel),
    ),
    moving: Array.from({ length: 5 }, (_, i) => ({ geo: merge(part(torus(0.3, 0.05, Math.PI, 8), K.ink, { p: [0, -0.3, 0] }), part(box(0.25, 3.2, 2), ['A', 'B', 'Ad', '#f6f2e8', 'Bd'][i], { p: [0, -2.1, 0] })), pivot: [-2.2 + i * 1.1, 6, 0],
      anim: (t) => ({ rz: Math.sin(t * 1.7 + i * 1.3) * 0.12, ry: Math.sin(t * 1.1 + i * 0.7) * 0.3 }) })) }),
  // 14 jeans
  () => ({ geo: merge(...plinth(2.8), part(box(3.6, 1.4, 1.2), 'A', { p: [0, 7.4, 0] }), part(box(1.6, 5.8, 1.1), 'A', { p: [-0.95, 4, 0], r: [0, 0, 0.05] }), part(box(1.6, 5.8, 1.1), 'A', { p: [0.95, 4, 0], r: [0, 0, -0.05] }), part(box(3.65, 0.3, 1.25), K.ink, { p: [0, 7.9, 0] }), part(box(0.4, 0.3, 0.1), 'B', { p: [1.2, 6.8, 0.6] }), ring(5, (a, i) => part(box(0.12, 0.12, 0.12), K.gold, { p: [-1.6 + i * 0.8, 7.6, 0.62] }))) }),
  // 15 handbag
  () => ({ geo: merge(...plinth(3), ...roundBox(6, 3.8, 2.2, 0.8, 'A', [0, 3, 0]), part(torus(1.8, 0.2, Math.PI, 16), 'Ad', { p: [0, 4.9, 0] }), part(box(6.05, 0.5, 2.25), 'B', { p: [0, 4.2, 0] }), part(box(0.8, 0.6, 0.2), K.gold, { p: [0, 4.2, 1.15] })) }),
  // 16 T-shirt
  () => ({ geo: merge(...plinth(3)),
    moving: [{ geo: merge(part(box(3.8, 4.6, 0.8), 'A', { p: [0, -3.8, 0] }), part(box(2, 1.4, 0.8), 'A', { p: [-2.6, -2.2, 0], r: [0, 0, 0.6] }), part(box(2, 1.4, 0.8), 'A', { p: [2.6, -2.2, 0], r: [0, 0, -0.6] }), part(torus(0.7, 0.15, Math.PI, 12), 'B', { p: [0, -1.5, 0.3], r: [0, 0, Math.PI] }), part(star(0.8, 0.1), 'B', { p: [0, -3.8, 0.45] }), beam([0, -1.5, 0], [0, 0, 0], 0.1, K.steel), part(torus(0.4, 0.08, Math.PI, 8), K.steel)),
      pivot: [0, 8.4, 0], anim: (t) => ({ rz: Math.sin(t * 1.5) * 0.1, ry: Math.sin(t * 0.8) * 0.35 }) }] }),
);
EXTRA.bank.push(
  // 11 ticker board
  () => ({ geo: merge(part(box(1, 4, 1), K.steelDk, { p: [-3, 2, 0] }), part(box(1, 4, 1), K.steelDk, { p: [3, 2, 0] }), part(box(8.6, 3.6, 0.6), K.ink, { p: [0, 5.6, 0] }), ring(3, (a, i) => [part(box(4.6, 0.5, 0.1), i % 2 ? 'A' : '#5fd08f', { p: [-1.4, 6.6 - i * 1, 0.32] }), part(cone(0.3, 0.6, 3), i % 2 ? 'A' : '#5fd08f', { p: [2.4, 6.6 - i * 1, 0.32], r: i % 2 ? [Math.PI, 0, 0] : [0, 0, 0] })]), part(box(8.8, 0.4, 0.8), 'B', { p: [0, 7.6, 0] })) }),
  // 12 trading bell
  () => ({ geo: merge(part(box(5, 0.6, 3), K.stoneDk, { p: [0, 0.3, 0] }), beam([-2, 0.6, 0], [-2, 7, 0], 0.4, K.woodDk), beam([2, 0.6, 0], [2, 7, 0], 0.4, K.woodDk), part(box(4.6, 0.5, 0.6), K.woodDk, { p: [0, 7.2, 0] }), part(box(5.2, 0.4, 3.2), 'A', { p: [0, 0.75, 0] })),
    moving: [
      { geo: merge(part(new THREE.CylinderGeometry(0.6, 1.8, 2.6, 18, 1, true), K.gold, { p: [0, -1.6, 0] }), part(cyl(0.6, 0.6, 0.3, 14), K.gold, { p: [0, -0.2, 0] })), pivot: [0, 7, 0],
        anim: (t) => { const f = cyc(t, 3); return { rz: Math.sin(f * 3 * TAU) * 0.38 * (1 - win(f, 0, 0.75)) }; } },
      { geo: merge(beam([0, 0, 0], [0, -2.6, 0], 0.08, K.goldDk), part(ball(0.35, 0), K.goldDk, { p: [0, -2.9, 0] })), pivot: [0, 7, 0],
        anim: (t) => { const f = cyc(t, 3); return { rz: Math.sin(f * 3 * TAU - 0.7) * 0.5 * (1 - win(f, 0, 0.75)) }; } },
    ] }),
);
EXTRA.comms = [
  // 1 cell tower
  () => ({ geo: merge(part(box(3.4, 0.5, 3.4), K.stoneDk, { p: [0, 0.25, 0] }), ...[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z]) => beam([x * 1.4, 0.5, z * 1.4], [x * 0.3, 10, z * 0.3], 0.2, K.steel)), ring(6, (a, i) => beam([Math.cos(a) * 0.8, 3 + i, Math.sin(a) * 0.8], [Math.cos(a + 1) * 0.7, 4 + i, Math.sin(a + 1) * 0.7], 0.08, K.steelDk)),
    ring(3, (a) => part(box(0.4, 1.6, 0.8), K.white, { p: [Math.cos(a) * 0.8, 9, Math.sin(a) * 0.8], r: [0, -a, 0] }))),
    moving: [0, 1, 2].flatMap((i) => [0, Math.PI].map((side) => ({ geo: part(torus(1.6 + i * 1, 0.14, Math.PI / 2, 12), 'A', { r: [0, side, Math.PI / 4] }), pivot: [0, 9.6, 0], anim: (t) => ({ s: life(cyc(t, 1.8, -i * 0.14), 0, 0.12, 0.4, 0.55) }) }))) }),
  // 2 satellite dish
  () => ({ geo: merge(part(box(4, 0.6, 4), K.stoneDk, { p: [0, 0.3, 0] }), part(cyl(0.4, 0.6, 3.6, 10), K.steel, { p: [0, 2.4, 0] })),
    moving: [{ geo: merge(part(new THREE.SphereGeometry(3.4, 22, 10, 0, Math.PI * 2, 0, Math.PI / 3), 'A', { p: [0, -1, 0], r: [-0.7, 0, 0] }), beam([0, 0.2, 0.6], [0, 2.4, 2.4], 0.1, K.steelDk), part(ball(0.4, 1), 'B', { p: [0, 2.4, 2.4] })),
      pivot: [0, 4.2, 0], anim: (t) => ({ ry: Math.sin(t * 0.5) * 1.1, rx: Math.sin(t * 0.8) * 0.12, order: 'YXZ' }) }] }),
  // 3 router with antennas
  () => ({ geo: merge(...plinth(3.6), ...roundBox(6.4, 1.6, 4, 0.8, 'A', [0, 1.6, 0]), beam([-2.4, 2.4, -1.4], [-3, 7, -1.4], 0.3, K.ink), beam([2.4, 2.4, -1.4], [3, 7, -1.4], 0.3, K.ink)),
    moving: [
      ...[0, 1, 2].map((i) => ({ geo: part(torus(1 + i * 0.8, 0.14, Math.PI / 2, 12), 'B', { r: [0, 0, Math.PI / 4] }), pivot: [0, 3.6, 0], anim: (t) => ({ s: life(cyc(t, 1.5, -i * 0.13), 0, 0.12, 0.4, 0.55) }) })),
      ...ring(4, (a, i) => ({ geo: part(cyl(0.18, 0.18, 0.2, 8), i % 2 ? '#5fd08f' : 'B', { r: [Math.PI / 2, 0, 0] }), pivot: [-1.8 + i * 1.2, 2, 2.02], anim: (t) => ({ s: Math.sin(t * (4 + i * 1.3) + i) > -0.2 ? 1 : 0.3 }) })),
    ] }),
  // 4 walkie-talkie
  () => ({ geo: merge(...plinth(2.6), ...roundBox(3, 6.4, 1.6, 0.6, 'A', [0, 4, 0]), part(box(2.2, 1.6, 0.1), '#7cc0ff', { p: [0, 5.6, 0.82] }), ring(6, (a, i) => part(box(0.5, 0.2, 0.1), K.ink, { p: [-0.6 + (i % 2) * 1.2, 3.6 - Math.floor(i / 2) * 0.5, 0.82] })), part(cyl(0.22, 0.22, 3.4, 8), K.ink, { p: [0.8, 8.8, 0] }), part(cyl(0.35, 0.35, 0.6, 10), 'B', { p: [-0.6, 7.5, 0] })),
    moving: [0, 1, 2].flatMap((i) => [0, Math.PI].map((side) => ({ geo: part(torus(0.7 + i * 0.6, 0.12, Math.PI / 2, 12), 'A', { r: [0, side, Math.PI / 4] }), pivot: [0.8, 10.3, 0], anim: (t) => ({ s: life(cyc(t, 1.4, -i * 0.12), 0, 0.1, 0.35, 0.5) }) }))),
    move: (t) => { const k = cyc(t, 1.4) < 0.5 ? 1 : 0; return { x: Math.sin(t * 60) * 0.004 * k }; } }),
];

// ---------- companion props (small, beside the model) and toppers (on top) ----------
export const PROPS = [
  () => merge(part(cyl(0.06, 0.06, 3.2, 6), K.steel, { p: [0, 1.6, 0] }), part(box(1.4, 0.9, 0.05), 'A', { p: [0.7, 2.7, 0] })),
  () => merge(part(cyl(0.03, 0.03, 2.6, 4), K.ink, { p: [0, 1.3, 0] }), part(ball(0.5, 1), 'A', { p: [0, 2.9, 0] }), part(ball(0.45, 1), 'B', { p: [0.5, 2.6, 0.2] }), part(ball(0.45, 1), '#ffd23f', { p: [-0.4, 2.7, -0.2] })),
  () => merge(part(cyl(1.2, 1.3, 0.5, 18), K.stone, { p: [0, 0.25, 0] }), part(cyl(1, 1, 0.1, 18), 'W', { p: [0, 0.5, 0] }), part(cyl(0.2, 0.25, 1.2, 8), K.stone, { p: [0, 1, 0] }), part(ball(0.35, 1), '#bfe3ff', { p: [0, 1.7, 0] })),
  () => merge(part(cyl(0.2, 0.3, 2, 6), K.wood, { p: [0, 1, 0] }), part(ball(1.1, 0), '#5fae5b', { p: [0, 2.6, 0] })),
  () => merge(part(cyl(0.18, 0.25, 2.6, 6), '#a07a4e', { p: [0, 1.3, 0], r: [0, 0, 0.15] }), ring(5, (a) => part(box(1.6, 0.08, 0.5), '#5fae5b', { p: [0.2 + Math.cos(a) * 0.7, 2.7, Math.sin(a) * 0.7], r: [0, -a, -0.4] }))),
  () => merge(part(box(0.9, 0.5, 0.9), K.stone, { p: [0, 0.25, 0] }), part(cyl(0.12, 0.12, 0.8, 8), K.gold, { p: [0, 0.9, 0] }), part(cyl(0.5, 0.25, 0.7, 12), K.gold, { p: [0, 1.6, 0] }), part(torus(0.25, 0.06, Math.PI, 8), K.gold, { p: [0.5, 1.6, 0], r: [0, 0, -Math.PI / 2] })),
  () => merge(part(cyl(0.05, 0.05, 1.4, 6), K.steel, { p: [0, 0.7, 0] }), part(new THREE.SphereGeometry(0.8, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), K.white, { p: [0, 1.5, 0], r: [-0.8, 0, 0] })),
  () => merge(part(box(1.6, 0.15, 0.5), K.wood, { p: [0, 0.5, 0] }), part(box(1.6, 0.6, 0.12), K.wood, { p: [0, 0.8, -0.25] }), part(cyl(0.05, 0.05, 2.2, 6), K.ink, { p: [1.1, 1.1, 0] }), part(ball(0.2, 0), K.yellow, { p: [1.1, 2.3, 0] })),
  () => merge(part(cyl(0.08, 0.08, 1.2, 6), K.ink, { p: [0, 0.6, 0] }), part(box(0.7, 0.5, 0.9), 'A', { p: [0, 1.4, 0] })),
  () => merge(part(new THREE.CapsuleGeometry(0.55, 1.8, 6, 12), 'A', { p: [0, 3, 0], r: [0, 0, Math.PI / 2] }), part(box(0.6, 0.3, 0.3), K.white, { p: [0, 2.4, 0] }), part(box(0.1, 0.5, 0.4), 'B', { p: [-1.3, 3, 0] })),
  () => merge(part(ball(0.9, 1), 'A', { p: [0, 3, 0], s: [1, 1.15, 1] }), part(box(0.4, 0.3, 0.4), K.wood, { p: [0, 1.8, 0] }), beam([-0.25, 2, 0], [-0.4, 2.7, 0], 0.03, K.ink), beam([0.25, 2, 0], [0.4, 2.7, 0], 0.03, K.ink)),
  () => merge(part(box(0.8, 0.8, 0.8), 'A', { p: [0, 0.4, 0] }), part(box(0.82, 0.2, 0.82), 'B', { p: [0, 0.6, 0] }), part(box(0.2, 0.82, 0.82), 'B', { p: [0, 0.4, 0] })),
  () => merge(ring(3, (a, i) => part(cone(0.35, 0.9, 8), (x, y) => (y > 0.75 + i * 0.2 ? K.white : K.orange), { p: [Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5] }))),
  () => merge(part(cyl(0.6, 0.7, 0.6, 12), '#b0643c', { p: [0, 0.3, 0] }), ring(5, (a, i) => part(ball(0.25, 0), ['#f39ab8', '#ffd23f', '#e5533d', '#c3b4ff', '#ffffff'][i], { p: [Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35] }))),
  () => merge(ring(3, (a, i) => [part(cyl(0.15, 0.22, 0.7, 6), K.wood, { p: [Math.cos(a) * 0.8, 0.35, Math.sin(a) * 0.8] }), part(cone(0.55, 1.6 + i * 0.3, 7), '#3f7f43', { p: [Math.cos(a) * 0.8, 1.4 + i * 0.15, Math.sin(a) * 0.8] })])),
  () => merge(part(box(0.15, 2.6, 0.15), K.steelDk, { p: [0, 1.3, 0] }), ring(3, (a, i) => part(box(0.9, 0.12, 0.12), K.steelDk, { p: [0, 1.6 + i * 0.4, 0] })), part(ball(0.15, 0), 'A', { p: [0, 2.7, 0] })),
];
export const TOPPERS = [
  null,
  () => merge(part(cyl(0.05, 0.05, 2, 6), K.steel, { p: [0, 1, 0] }), part(box(1.2, 0.7, 0.05), 'A', { p: [0.6, 1.6, 0] })),
  () => merge(part(cyl(0.6, 0.7, 0.4, 5), K.gold, { p: [0, 0.2, 0] }), ring(5, (a) => part(cone(0.15, 0.5, 4), K.gold, { p: [Math.cos(a) * 0.55, 0.6, Math.sin(a) * 0.55] }))),
  () => merge(part(cyl(0.04, 0.04, 1.6, 6), K.ink, { p: [0, 0.8, 0] }), part(ball(0.25, 1), 'B', { p: [0, 1.7, 0] })),
  () => part(star(0.8, 0.25), K.yellow, { p: [0, 0.8, 0] }),
  () => merge(part(cyl(0.03, 0.03, 1.2, 4), K.ink, { p: [0, 0.6, 0] }), part(ball(0.6, 1), 'A', { p: [0, 1.6, 0] }), part(ball(0.5, 1), 'B', { p: [0.55, 1.3, 0.2] })),
];

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
// The biggest names have signature models of their own (src/heroes.js), each its own kind.
for (const [id, h] of Object.entries(HEROES)) { CENTER[id] = h.build; FINDER[id] = h.finder; }
export const ARCHETYPES = Object.fromEntries(Object.entries(FINDER).map(([id, finder]) => [id, { id, finder }]));

const propCache = new Map(), topCache = new Map();
export const propGeo = (i, detail = 'high') => { const k = `${i}:${detail}`; if (!propCache.has(k)) propCache.set(k, withDetail(detail, PROPS[i % PROPS.length])); return propCache.get(k); };
export const topperGeo = (i, detail = 'high') => { const make = TOPPERS[i % TOPPERS.length], k = `${i}:${detail}`; if (!make) return null; if (!topCache.has(k)) topCache.set(k, withDetail(detail, make)); return topCache.get(k); };
export const PROP_COUNT = 16, TOPPER_COUNT = 6;
// How many shapes each kind of company has.
export const variantCount = (id) => 1 + ((EXTRA[id] || []).length);
const cache = new Map();
// { geo, moving: [{ geo, pivot, axis, mode: spin|flap|drop, speed, amp, drop, phase }], hover }
// A moving part's geometry is built around its own pivot point.
export function centerpiece(id, variant = 0, base = 0, detail = 'high') {
  const key = `${id}:${variant}:${base}:${detail}`;
  if (!cache.has(key)) cache.set(key, withDetail(detail, () => build(id, variant, base)));
  return cache.get(key);
}
function build(id, variant, base) {
  {
    const builders = [CENTER[id] || CENTER.tree, ...(EXTRA[id] || [])], v = variant % builders.length;
    // An upgraded shape (src/scenes.js) is a whole scene on its own slab, like a signature model,
    // but still takes the company's colours, companion prop and topper (at its propAt / topAt).
    const c = { ...(SCENES[`${CENTER[id] ? id : 'tree'}:${v}`] || builders[v])() };
    if (c.spin) c.moving = [{ ...c.spin, mode: 'spin' }];
    c.moving = (c.moving || []).map((mv) => ({ ...mv, anim: mv.anim || legacy(mv) }));
    const make = c.bare || c.slab ? null : BASES[base % BASES.length]; // a scene brings its own ground
    if (make) {
      const bb = new THREE.Box3().setFromBufferAttribute(c.geo.attributes.position);
      const r = Math.min(5.4, Math.max(2.6, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 0.5));
      const lift = 0.7;
      c.geo = merge(make(r), c.geo.clone().translate(0, lift, 0));
      c.moving = c.moving.map((mv) => (mv.parent != null ? mv : { ...mv, pivot: [mv.pivot[0], mv.pivot[1] + lift, mv.pivot[2]] }));
    }
    // Where a company's companion prop and topper go: beside the model, and on its highest
    // point near the middle.
    const bb = new THREE.Box3().setFromBufferAttribute(c.geo.attributes.position);
    const pos = c.geo.attributes.position;
    let top = 0;
    for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getX(i)) < 1.5 && Math.abs(pos.getZ(i)) < 1.5) top = Math.max(top, pos.getY(i));
    c.propAt ||= [bb.max.x + 1.3, 0, bb.max.z * 0.4 + 0.6];
    c.topAt ||= [0, (top || bb.max.y) - 0.05, 0];
    return c;
  }
}

// Builds a model's moving parts under `root`, each holding mesh(geo); returns them for poseMovers.
export function mountMovers(cp, root, mesh) {
  const nodes = cp.moving.map((mv) => {
    const o = new THREE.Group();
    o.position.set(...mv.pivot);
    if (mv.geo) o.add(mesh(mv.geo));
    return { o, mv };
  });
  for (const n of nodes) (n.mv.parent != null ? nodes[n.mv.parent].o : root).add(n.o);
  return nodes;
}
export function poseMovers(nodes, t) {
  for (const { o, mv } of nodes) {
    const p = mv.anim(t);
    o.position.set(mv.pivot[0] + (p.x || 0), mv.pivot[1] + (p.y || 0), mv.pivot[2] + (p.z || 0));
    if (p.q) o.quaternion.copy(p.q);
    else o.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0, p.order || 'XYZ');
    const s = p.s ?? 1, sx = p.sx ?? s, sy = p.sy ?? s, sz = p.sz ?? s;
    o.scale.set(Math.max(1e-3, sx), Math.max(1e-3, sy), Math.max(1e-3, sz));
    // A part scaled away to nothing isn't drawn at all (several stages of a thing can share a spot).
    o.visible = Math.min(sx, sy, sz) > 2e-3;
  }
}
// Where each moving part sits at rest, in the model's frame (for fitting and for the QR pixels).
export function restMatrices(cp) {
  const out = [];
  cp.moving.forEach((mv, i) => {
    const m = new THREE.Matrix4().makeTranslation(...mv.pivot);
    out[i] = mv.parent != null ? out[mv.parent].clone().multiply(m) : m;
  });
  return out;
}
// The whole model's motion: its own move() if it has one, else its kind's.
export function motion(id, cp, t, phase = 0) {
  return cp.move ? { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1, ...cp.move(t + phase) } : behave(id, t, phase);
}

// Each kind of business moves its own way: cars drive, planes bank, rockets launch, oil pumps
// rock, phones ring, hearts beat, presses thump. Returns offsets as fractions of the model's
// height and angles in radians, about the model's base; s* are scale factors.
export function behave(id, t, phase = 0) {
  const b = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
  const T = t + phase;
  const cycle = (period) => ((T / period) % 1 + 1) % 1;
  switch (id) {
    case 'car': {
      b.x = Math.sin(T * 0.8) * 0.28;
      b.rz = -Math.cos(T * 0.8) * 0.035;
      b.y = Math.abs(Math.sin(T * 11)) * 0.012;
      break;
    }
    case 'plane': {
      b.y = 0.1 + Math.sin(T * 0.9) * 0.08;
      b.rz = Math.sin(T * 0.9) * 0.22;
      b.rx = Math.cos(T * 0.9) * 0.05;
      b.x = Math.sin(T * 0.45) * 0.12;
      break;
    }
    case 'rocket': {
      const f = cycle(5.5);
      if (f < 0.12) b.x = Math.sin(T * 60) * 0.012;
      else if (f < 0.45) { const k = (f - 0.12) / 0.33; b.y = k * k * 0.7; }
      else if (f < 0.75) { const k = (f - 0.45) / 0.3; b.y = 0.7 * (1 - k * (2 - k)); }
      else if (f < 0.8) b.sy = 1 - Math.sin(((f - 0.75) / 0.05) * Math.PI) * 0.08;
      break;
    }
    case 'parcel': {
      const h = Math.abs(Math.sin(T * 2.2));
      b.y = h * 0.12;
      b.ry = Math.sin(T * 1.1) * 0.15;
      const land = Math.pow(1 - h, 6);
      b.sy = 1 - land * 0.1; b.sx = b.sz = 1 + land * 0.06;
      break;
    }
    case 'oil': b.rx = Math.sin(T * 1.8) * 0.09; break;
    case 'comms': case 'social': {
      const f = cycle(3.2);
      if (f < 0.25) { const k = 1 - f / 0.25; b.rz = Math.sin(T * 45) * 0.07 * k; b.y = 0.03 * k; }
      break;
    }
    case 'health': {
      const f = cycle(1.3);
      const beat = Math.exp(-Math.pow((f - 0.1) / 0.05, 2)) + 0.6 * Math.exp(-Math.pow((f - 0.3) / 0.05, 2));
      b.sx = b.sy = b.sz = 1 + beat * 0.07;
      break;
    }
    case 'bank': case 'payments': {
      b.y = 0.04 + Math.sin(T * 1.6) * 0.04;
      b.ry = Math.sin(T * 0.7) * 0.2;
      break;
    }
    case 'insurance': b.rz = Math.sin(T * 1.2) * 0.06; break;
    case 'retail': {
      const h = Math.abs(Math.sin(T * 2.6));
      b.y = h * 0.06;
      b.sy = 1 - Math.pow(1 - h, 5) * 0.08;
      break;
    }
    case 'chip': case 'computer': {
      b.x = Math.sin(T * 31) * 0.003;
      const p = 1 + Math.max(0, Math.sin(T * 3)) * 0.035;
      b.sx = b.sz = p;
      break;
    }
    case 'media': {
      const f = cycle(2.6);
      if (f < 0.18) b.rz = Math.sin((f / 0.18) * Math.PI * 4) * 0.08;
      break;
    }
    case 'food': case 'drink': case 'care': {
      const w = Math.sin(T * 5) * Math.max(0, Math.sin(T * 0.9));
      b.sx = b.sz = 1 + w * 0.05; b.sy = 1 - w * 0.05;
      break;
    }
    case 'power': {
      b.y = 0.02 + Math.sin(T * 1.4) * 0.02;
      b.sx = b.sy = b.sz = 1 + Math.sin(T * 3) * 0.025;
      break;
    }
    case 'industrial': case 'metal': {
      const f = cycle(1.6);
      if (f > 0.78 && f < 0.92) { const k = Math.sin(((f - 0.78) / 0.14) * Math.PI); b.sy = 1 - k * 0.12; b.sx = b.sz = 1 + k * 0.05; }
      break;
    }
    case 'chem': b.rz = Math.sin(T * 3) * 0.04; b.rx = Math.cos(T * 2.3) * 0.04; break;
    case 'farm': case 'tree': b.rz = Math.sin(T * 1.5) * 0.07; b.rx = Math.sin(T * 1.1) * 0.03; break;
    case 'casino': b.ry = T * 0.8; b.y = Math.abs(Math.sin(T * 1.6)) * 0.05; break;
    case 'robot': b.ry = Math.sin(T * 2) * 0.4; b.y = Math.abs(Math.sin(T * 4)) * 0.04; break;
    case 'house': b.y = Math.max(0, Math.sin(T * 0.9)) * 0.02; break;
    default: b.y = 0.05 + Math.sin(T * 1.3) * 0.05; b.ry = Math.sin(T * 0.5) * 0.3;
  }
  return b;
}

// Shared material: vertex colours, with brand slots filled from per-instance brandA / brandB.
// Water ('W' parts) is drawn live, like the sea on the map: rippling light, caustics and glints.
// Call material.userData.tick(seconds) each frame to move it.
export function modelMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.04 });
  const uTime = { value: 0 };
  m.userData.tick = (t) => (uTime.value = t);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float mask;\nattribute float wind;\nattribute vec3 brandA;\nattribute vec3 brandB;\nuniform float uTime;\nvarying float vWater;\nvarying vec2 vFlat;')
      // Wind: weighted vertices (leaves, blades) sway, each with its own phase so they flutter.
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  if (wind > 0.0) {
    float ph = dot(position, vec3(1.7, 0.9, 1.3));
    transformed += wind * vec3(sin(uTime * 1.6 + ph) * 0.16 + sin(uTime * 0.7 + position.y * 0.3) * 0.1, sin(uTime * 2.3 + ph * 1.3) * 0.06, cos(uTime * 1.3 + ph * 0.8) * 0.13);
  }`)
      .replace('#include <color_vertex>', `#include <color_vertex>
  vWater = mask > 4.5 ? 1.0 : 0.0;
  vFlat = position.xz;
  if (mask > 0.5 && mask < 4.5) {
    vec3 bc = mask < 2.5 ? brandA : brandB;
    vColor.rgb = bc * ((mask > 1.5 && mask < 2.5) || mask > 3.5 ? 0.72 : 1.0);
  }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uTime;
varying float vWater;
varying vec2 vFlat;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wHash(i), wHash(i + vec2(1, 0)), f.x), mix(wHash(i + vec2(0, 1)), wHash(i + vec2(1, 1)), f.x), f.y); }
float wWaves(vec2 p, float t) { return 0.5 * sin(dot(p, vec2(0.9, 0.5)) + t * 1.3) + 0.35 * sin(dot(p, vec2(-0.6, 1.0)) + t * 1.7) + 0.3 * wNoise(p * 1.6 + vec2(t * 0.4, t * 0.25)); }
float wCaustic(vec2 p, float t) { float c = 0.0; for (int i = 0; i < 2; i++) { vec2 q = p * (1.6 + float(i)) + vec2(t * 0.3, -t * 0.22) * (1.0 + float(i)); float n = wNoise(q) + 0.5 * wNoise(q * 2.3 + 4.0); c += pow(1.0 - abs(n - 0.75) * 2.2, 6.0); } return clamp(c, 0.0, 1.0); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  if (vWater > 0.5) diffuseColor.rgb = mix(vec3(0.16, 0.52, 0.66), vec3(0.42, 0.80, 0.86), 0.5 + 0.5 * wWaves(vFlat * 0.9, uTime)) + vec3(wCaustic(vFlat * 0.8, uTime) * 0.35);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  if (vWater > 0.5) roughnessFactor = 0.12;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  if (vWater > 0.5) { float e = 0.12, h = wWaves(vFlat * 0.9, uTime); normal = normalize(normal + vec3(-(wWaves((vFlat + vec2(e, 0.0)) * 0.9, uTime) - h) / e * 0.18, 0.0, -(wWaves((vFlat + vec2(0.0, e)) * 0.9, uTime) - h) / e * 0.18)); }`);
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
  if (!k || k > 4.5) return out.fromBufferAttribute(geo.attributes.color, i);
  out.set(k < 2.5 ? a : b);
  return k === 2 || k === 4 ? out.multiplyScalar(0.72) : out;
}
