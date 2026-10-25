// The shared industry shapes, rebuilt as small animated scenes to the signature models' standard
// (src/heroes.js): each sits on its own slab and shows how that kind of business wins. Unlike a
// signature model, one scene serves many companies, so it is painted partly in brand slots
// ('A'/'B' and darker 'Ad'/'Bd') and still takes each company's companion prop (at propAt, a
// free spot on the slab, at most 3.7 from the middle since a prop can be 1.5 wide) and topper
// (at topAt, no higher than 4.7 since a topper can be 2 tall). Keyed `kind:variant` (see models.js).
// Same conventions as the heroes: slab top y0 = 0.24, keep within ±5.2, rest height ≤ 6.8, the
// camera looks from +x, +z.
import { THREE, V, part, windy, rand, taper, shade, tuft, bladeShape, merge, place, box, cyl, lathe, tube, ball, capsule, cone, torus, extrude, prism, star, beam, ring, hi, TAU, clamp01, cyc, win, easeIn, easeOut, easeIO, back, bump, hop, life, K } from './kit.js';
import { rbox, curve, tubeOn, along, miniTree, lampPost, sedan, cartGeo, walker, parcel, puff, flameGeo } from './heroes.js';

const y0 = 0.24;
const slab = (color) => part(rbox(10.4, 0.24, 10.4, 0.08), color, { p: [0, 0.12, 0] });
// A gold coin lying flat (centred on the origin), with a reeded edge and a raised face.
const coin = (r = 0.62, h = 0.2) => {
  const seg = hi() ? 48 : 14;
  return merge(
    part(new THREE.CylinderGeometry(r, r, h, hi() ? 72 : 14, 1, true), (x, y, z, i) => (Math.floor(i / 6) % 2 ? '#d9a93a' : '#c8952c')),
    part(new THREE.CylinderGeometry(r * 0.995, r * 0.995, h * 0.98, seg), K.gold),
    part(new THREE.CylinderGeometry(r * 0.74, r * 0.74, h * 1.08, seg), '#f6d66e'),
  );
};
// A small gabled house facing +z (door side), sitting on y = 0 at the origin.
const home = (wall = K.cream, roof = 'Ad', w = 1.7, d = 1.5, h = 1.1) => merge(
  part(rbox(w, h, d, 0.05), wall, { p: [0, h / 2, 0] }),
  part(prism(w + 0.3, 0.85, d + 0.25), roof, { p: [0, h, 0], r: [0, Math.PI / 2, 0], s: [1, 1, 1] }),
  part(rbox(0.36, 0.62, 0.06, 0.03), K.woodDk, { p: [-w * 0.18, 0.31, d / 2 + 0.02] }),
  [w * 0.2].map((x) => part(rbox(0.42, 0.36, 0.05, 0.03), '#a8d4f0', { p: [x, 0.62, d / 2 + 0.02] })),
  part(rbox(0.05, 0.36, 0.42, 0.03), '#a8d4f0', { p: [w / 2 + 0.02, 0.62, 0] }),
  part(rbox(0.22, 0.5, 0.22, 0.03), '#a35a3c', { p: [w * 0.28, h + 0.55, -d * 0.15] }),
);

// A two-storey family home facing +z on y = 0: gabled roof, garage wing, porch, windows.
const house2 = (wall = K.cream, roof = 'Ad', door = 'B', trim = K.white) => {
  const W = 1.9, D = 1.6, H = 2.0, g = [];
  g.push(part(rbox(W, H, D, 0.05), wall, { p: [-0.35, H / 2, 0] }), part(prism(D + 0.32, 0.95, W + 0.3), roof, { p: [-0.35, H, 0], r: [0, Math.PI / 2, 0] }));
  g.push(part(rbox(1.2, 1.25, 1.5, 0.05), wall, { p: [1.15, 0.625, 0.05] }), part(prism(1.72, 0.6, 1.36), roof, { p: [1.15, 1.25, 0.05] }));
  g.push(part(rbox(0.96, 0.9, 0.05, 0.03), trim, { p: [1.15, 0.45, 0.82] }));
  if (hi()) for (let i = 0; i < 4; i++) g.push(part(box(0.92, 0.015, 0.02), '#d8dde3', { p: [1.15, 0.12 + i * 0.22, 0.85] }));
  g.push(part(rbox(0.36, 0.7, 0.06, 0.03), door, { p: [-0.1, 0.35, D / 2 + 0.02] }), part(rbox(0.5, 0.06, 0.08, 0.02), trim, { p: [-0.1, 0.73, D / 2 + 0.03] }));
  const win = (x, y, z, side) => g.push(part(rbox(side ? 0.06 : 0.4, 0.42, side ? 0.4 : 0.06, 0.02), trim, { p: [x, y, z] }), part(box(side ? 0.07 : 0.32, 0.34, side ? 0.32 : 0.07), '#9fcdea', { p: [x, y, z] }));
  win(-0.85, 0.75, D / 2 + 0.02); win(-0.85, 1.55, D / 2 + 0.02); win(0.0, 1.55, D / 2 + 0.02); win(-1.32, 1.1, 0, 1);
  g.push(part(rbox(1.0, 0.08, 0.6, 0.03), K.stone, { p: [-0.3, 0.04, D / 2 + 0.3] }), part(prism(1.1, 0.3, 0.7), roof, { p: [-0.3, 0.95, D / 2 + 0.3], r: [0, Math.PI / 2, 0], s: [1, 1, 1] }));
  [-0.75, 0.15].forEach((x) => g.push(part(cyl(0.035, 0.035, 0.88, 8), trim, { p: [x, 0.5, D / 2 + 0.56] })));
  g.push(part(rbox(0.24, 0.6, 0.24, 0.03), '#a35a3c', { p: [-0.9, H + 0.6, -0.3] }));
  return merge(g);
};
// The bare frame of a house going up (facing +z on y = 0): deck, studs, plates, a few trusses.
const LUMBER = '#e2c089', LUMBERDK = '#c9a36b';
const truss = (span = 1.9, rise = 0.85) => merge(beam([0, 0, -span / 2], [0, 0, span / 2], 0.07, LUMBERDK), beam([0, 0, -span / 2], [0, rise, 0], 0.07, LUMBER), beam([0, 0, span / 2], [0, rise, 0], 0.07, LUMBER), beam([0, 0, 0], [0, rise, 0], 0.05, LUMBER), beam([0, 0, -span / 4], [0, rise / 2, 0], 0.04, LUMBER), beam([0, 0, span / 4], [0, rise / 2, 0], 0.04, LUMBER));
const frame = (W = 2.2, D = 1.8, H = 1.8) => {
  const g = [part(rbox(W + 0.2, 0.3, D + 0.2, 0.03), '#b9b4aa', { p: [0, 0.15, 0] }), part(box(W, 0.06, D), '#d6b47a', { p: [0, 0.33, 0] })];
  const stud = (x, z) => g.push(part(new THREE.BoxGeometry(0.06, H, 0.09), LUMBER, { p: [x, 0.36 + H / 2, z] }));
  for (let x = -W / 2; x <= W / 2 + 1e-3; x += W / 7) { if (Math.abs(x + 0.2) > 0.25) stud(x, D / 2 - 0.05); stud(x, -D / 2 + 0.05); }
  for (let z = -D / 2 + D / 6; z < D / 2 - 1e-3; z += D / 6) { stud(-W / 2 + 0.03, z); stud(W / 2 - 0.03, z); }
  [D / 2 - 0.05, -D / 2 + 0.05].forEach((z) => g.push(part(new THREE.BoxGeometry(W, 0.08, 0.1), LUMBERDK, { p: [0, 0.36 + H, z] }), part(new THREE.BoxGeometry(W, 0.06, 0.1), LUMBERDK, { p: [0, 0.39, z] })));
  [-W / 2 + 0.03, W / 2 - 0.03].forEach((x) => g.push(part(new THREE.BoxGeometry(0.1, 0.08, D), LUMBERDK, { p: [x, 0.36 + H, 0] })));
  g.push(part(new THREE.BoxGeometry(0.6, 0.06, 0.1), LUMBERDK, { p: [-0.2, 1.4, D / 2 - 0.05] }));
  // Diagonal braces and two trusses already up.
  g.push(beam([-W / 2 + 0.03, 0.4, -D / 2 + 0.3], [-W / 2 + 0.03, 0.36 + H, D / 2 - 0.3], 0.04, LUMBERDK));
  [-W / 2 + 0.1, -W / 2 + 0.55].forEach((x) => g.push(place(truss(D + 0.1), { p: [x, 0.4 + H, 0] })));
  return merge(g);
};

// A patch of ripe wheat w × d (centred on the origin, on y = 0): a golden mat with swaying stalks
// and heavy heads on top (just the mat on the map).
const GOLD = ['#e9c46a', '#f0cf73', '#dcb257', '#f3d98b'];
const wheat = (R, w, d, h = 0.55) => {
  const g = [part(new THREE.BoxGeometry(w, h * 0.55, d), '#d9b45a', { p: [0, h * 0.275, 0] })];
  if (!hi()) return merge(g);
  const n = Math.round(w * d * 26), head = new THREE.SphereGeometry(0.035, 5, 3);
  for (let i = 0; i < n; i++) {
    const x = (R() - 0.5) * w * 0.96, z = (R() - 0.5) * d * 0.96, hh = h * (0.85 + R() * 0.35), lean = (R() - 0.5) * 0.12, c = GOLD[Math.floor(R() * GOLD.length)];
    g.push(windy(part(bladeShape(hh, lean), (X, Y) => shade(c, 0.8 + 0.3 * Math.min(1, Y / hh)), { p: [x, 0, z], r: [0, R() * TAU, 0], s: [0.6, 1, 0.6] }), (X, Y) => Math.min(1, Y / hh) ** 2 * 0.45));
    g.push(windy(part(head, shade(c, 0.95), { p: [x + lean * 0.9, hh, z], s: [1, 2.6, 1] }), 0.45));
  }
  return merge(g);
};
// A wheel at the origin, axle along z.
const tyre = (r, w, hub = K.steel) => merge(part(new THREE.CylinderGeometry(r, r, w, hi() ? 22 : 10), '#24262b', { r: [Math.PI / 2, 0, 0] }), part(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, hi() ? 16 : 8), hub, { r: [Math.PI / 2, 0, 0] }),
  hi() ? ring(8, (a) => part(box(0.06, r * 0.18, w + 0.03), '#1b1c20', { p: [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, 0], r: [0, 0, a] })) : []);
// A corrugated steel grain bin (radius r, wall height h) with a conical roof, on y = 0.
const bin = (r, h, band = 'A') => merge(
  part(new THREE.CylinderGeometry(r, r, h, hi() ? 40 : 14, hi() ? 8 : 1), (x, y) => (Math.floor(y * 6) % 2 ? '#c9ced6' : '#b5bcc6'), { p: [0, h / 2, 0] }),
  part(cone(r * 1.04, r * 0.55, 40), '#d8dde3', { p: [0, h + r * 0.27, 0] }), part(cyl(0.2, 0.25, 0.25, 12), '#a9b1bb', { p: [0, h + r * 0.6, 0] }),
  part(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.22, hi() ? 40 : 14), band, { p: [0, h * 0.8, 0] }), part(cyl(r + 0.08, r + 0.1, 0.12, 40), K.stoneDk, { p: [0, 0.06, 0] }),
);

// A spur gear lying in the xy plane (axle along z): radius r to the tooth tips, n teeth, depth d.
const gear = (r, n, d, hole = 0.3) => {
  const sh = new THREE.Shape(), m = hi() ? 4 : 2;
  for (let i = 0; i < n; i++) for (let j = 0; j < m * 2; j++) {
    const a = ((i + j / (m * 2)) / n) * TAU, tooth = j < m ? 1 : 0.84, rr = r * (j === 0 || j === m ? (1 + 0.84) / 2 : tooth);
    i || j ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  if (hole) { const hp = new THREE.Path(); hp.absarc(0, 0, r * hole, 0, TAU, true); sh.holes.push(hp); }
  const bev = Math.min(0.06, d * 0.2);
  return new THREE.ExtrudeGeometry(sh, { depth: d - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.7, bevelSegments: hi() ? 2 : 1, curveSegments: hi() ? 24 : 8 }).translate(0, 0, -d / 2 + bev);
};
// Two-link reach: the shoulder and elbow angles (in the arm's own vertical plane) that put the
// wrist r out and h up from the shoulder, elbow up.
const reach2 = (r, h, L1, L2) => {
  const d = Math.min(L1 + L2 - 1e-3, Math.hypot(r, h)), e = -Math.acos(clamp01(((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2) + 1) / 2) * 2 - 1);
  return { s: Math.atan2(h, r) - Math.atan2(L2 * Math.sin(e), L1 + L2 * Math.cos(e)), e };
};

// A storm cloud of soft puffs, darker underneath, centred on the origin.
const stormCloud = (s = 1) => merge([[0, 0, 0, 0.9], [0.85, -0.1, 0.2, 0.7], [-0.85, -0.15, -0.1, 0.72], [0.35, 0.35, -0.3, 0.65], [-0.4, 0.3, 0.35, 0.6], [1.5, -0.25, -0.1, 0.45], [-1.5, -0.25, 0.15, 0.45], [0, -0.2, 0.7, 0.55], [0.2, -0.2, -0.7, 0.55]]
  .map(([x, y, z, r]) => part(new THREE.SphereGeometry(r * s, hi() ? 20 : 8, hi() ? 14 : 6), (X, Y) => (Y < -0.25 * s ? '#7f8a99' : '#a9b3c0'), { p: [x * s, y * s, z * s] })));
// A zigzag lightning bolt, about h tall, hanging down from the origin.
const bolt = (h = 3) => part(extrude([[0, 0], [0.32, 0], [0.12, -h * 0.4], [0.36, -h * 0.4], [-0.05, -h], [0.02, -h * 0.52], [-0.24, -h * 0.52]], 0.08), '#fff3a3');

// A heraldic shield, flat face toward +z, about 1.6 tall, its point at the origin.
const shieldGeo = (face = 'A', rim = K.white, check = K.white) => {
  const sh = (k) => { const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([-0.7 * k + 1.4 * k * u, (1.55 + Math.sin(u * Math.PI) * 0.08) * k]); } for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([0.7 * k * Math.cos(u * Math.PI / 2), (0.75 - 0.75 * Math.sin(u * Math.PI / 2)) * k + (1 - k) * 0.3]); } for (let i = 1; i < 12; i++) { const u = i / 12; pts.push([-0.7 * k * Math.sin(u * Math.PI / 2), (0.75 * Math.cos(u * Math.PI / 2)) * k + (1 - k) * 0.3]); } return pts; };
  return merge(part(extrude(sh(1), 0.22), rim), part(extrude(sh(0.86).map(([x, y]) => [x, y + 0.08]), 0.26), face),
    part(extrude([[-0.38, 0.85], [-0.22, 1.0], [-0.08, 0.82], [0.32, 1.25], [0.46, 1.1], [-0.08, 0.55]], 0.3), check));
};

// A delivery van facing +x on y = 0, about 2 long, brand panels on its sides.
const van = (body = K.white, panel = 'A') => merge(part(rbox(1.5, 0.95, 0.85, 0.1), body, { p: [-0.1, 0.65, 0] }), part(rbox(0.5, 0.65, 0.82, 0.12), body, { p: [0.8, 0.48, 0] }), part(box(0.04, 0.28, 0.7), '#26323f', { p: [1.04, 0.66, 0] }),
  part(box(1.2, 0.3, 0.02), panel, { p: [-0.1, 0.72, 0.43] }), part(box(1.2, 0.3, 0.02), panel, { p: [-0.1, 0.72, -0.43] }),
  [[-0.55, 0.4], [0.65, 0.4], [-0.55, -0.4], [0.65, -0.4]].map(([x, z]) => part(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 14), '#1d1f24', { p: [x, 0.17, z], r: [Math.PI / 2, 0, 0] })));
// A crowd member (cheap: body and head), standing on y = 0.
const fan = (shirt, skin = '#e9b98f') => merge(part(new THREE.CapsuleGeometry(0.13, 0.32, 3, 8), shirt, { p: [0, 0.38, 0] }), part(new THREE.SphereGeometry(0.12, 10, 7), skin, { p: [0, 0.75, 0] }));

// A humanoid robot walking path(t) → { x, z, ry } (facing +x), like walker() but taller, in
// white shells with brand-coloured joints. Returns 5 moving parts; base = moving.length.
const humanoid = (base, path, { y = 0, shell = '#f4f5f6', joint = 'A', s = 1.25 } = {}) => {
  const step = (t, k) => Math.sin(t * 5 + k) * 0.5;
  return [
    { geo: merge(part(rbox(0.3, 0.5, 0.42, 0.1), shell, { p: [0, 1.2, 0] }), part(rbox(0.26, 0.18, 0.36, 0.06), joint, { p: [0, 0.92, 0] }), part(rbox(0.24, 0.24, 0.24, 0.08), shell, { p: [0, 1.62, 0] }), part(rbox(0.05, 0.1, 0.2, 0.03), '#1d1f24', { p: [0.12, 1.63, 0] }), part(cyl(0.08, 0.08, 0.06, 12), joint, { p: [0, 1.25, 0.0], r: [0, 0, Math.PI / 2] }).translate(0.15, 0, 0)).scale(s, s, s),
      pivot: [0, y, 0], anim: (t) => { const p = path(t); return { x: p.x, z: p.z, ry: p.ry, y: Math.abs(Math.sin(t * 5)) * 0.03 }; } },
    ...[-0.11, 0.11].map((z, i) => ({ geo: merge(part(capsule(0.07, 0.36), '#c9ced6', { p: [0, -0.27, 0] }), part(rbox(0.2, 0.06, 0.12, 0.03), joint, { p: [0.04, -0.52, 0] })).scale(s, s, s), pivot: [0, 0.86 * s, z * s], parent: base, anim: (t) => ({ rz: step(t, i * Math.PI) }) })),
    ...[-0.27, 0.27].map((z, i) => ({ geo: merge(part(cyl(0.07, 0.07, 0.1, 10), joint, { r: [Math.PI / 2, 0, 0] }), part(capsule(0.055, 0.32), '#c9ced6', { p: [0, -0.24, 0] })).scale(s, s, s), pivot: [0, 1.38 * s, z * s], parent: base, anim: (t) => ({ rz: -step(t, i * Math.PI) * 0.7 }) })),
  ];
};

// A product bottle (body in a brand colour, cap, label), on y = 0, about h tall.
const bottle = (h = 0.5, body = 'A', cap = 'B') => merge(part(lathe([[0, 0], [h * 0.28, 0.01], [h * 0.3, h * 0.08], [h * 0.3, h * 0.62], [h * 0.16, h * 0.78], [h * 0.12, h * 0.84], [0, h * 0.84]], 20), body),
  part(cyl(h * 0.13, h * 0.13, h * 0.18, 14), cap, { p: [0, h * 0.92, 0] }), part(new THREE.CylinderGeometry(h * 0.305, h * 0.305, h * 0.26, 20, 1, true), K.white, { p: [0, h * 0.36, 0] }));
// A soap bubble: pale, with a highlight.
const bubbleGeo = (r = 0.15) => merge(part(new THREE.SphereGeometry(r, hi() ? 16 : 8, hi() ? 12 : 6), (x, y, z) => (y > r * 0.5 && x < 0 ? '#ffffff' : '#cfeefc'), {}));

// A lifebuoy ring lying in the xz plane: brand and white quarters.
const lifebuoy = (r = 0.32) => part(torus(r, r * 0.32, TAU, 32), (x, y, z) => (Math.floor((Math.atan2(z, x) + TAU) / (Math.PI / 2)) % 2 ? 'A' : K.white));
// A beach umbrella (striped canopy on a pole), on y = 0.
const parasol = (a = 'A', b = K.white, r = 0.8) => merge(part(cyl(0.025, 0.025, 1.4, 8), K.white, { p: [0, 0.7, 0] }), part(cone(r, 0.35, 16), (x, y, z) => (Math.floor((Math.atan2(z, x) + TAU) / (TAU / 8)) % 2 ? a : b), { p: [0, 1.45, 0] }));

// An anchor standing upright on y = 0 (crown at the bottom), about h tall, flat face toward +z.
const anchorGeo = (h = 2, c = 'A') => merge(
  part(rbox(h * 0.1, h * 0.8, h * 0.1, h * 0.03), c, { p: [0, h * 0.5, 0] }), part(rbox(h * 0.55, h * 0.08, h * 0.1, h * 0.03), c, { p: [0, h * 0.78, 0] }),
  part(torus(h * 0.1, h * 0.035, TAU, 20), c, { p: [0, h * 0.97, 0] }),
  part(torus(h * 0.36, h * 0.045, Math.PI * 0.85, 28), c, { p: [0, h * 0.4, 0], r: [0, 0, Math.PI * 1.075] }),
  [-1, 1].map((sx) => part(cone(h * 0.09, h * 0.22, 4), c, { p: [sx * h * 0.33, h * 0.32, 0], r: [0, 0, sx * 0.5] })));
// A small trawler, bow toward +x, sitting on y = 0 at its waterline.
const trawler = (hull = 'A') => merge(
  part(extrude([[-1.1, -0.2], [0.9, -0.2], [1.35, 0.35], [-1.1, 0.35]], 0.9), hull, { r: [0, 0, 0] }), part(extrude([[-1.1, 0.25], [1.32, 0.25], [1.36, 0.36], [-1.1, 0.36]], 0.92), K.white),
  part(rbox(0.7, 0.55, 0.65, 0.05), K.white, { p: [-0.35, 0.65, 0] }), part(box(0.72, 0.15, 0.67), '#2a3c50', { p: [-0.35, 0.78, 0] }), part(cyl(0.04, 0.04, 1.1, 8), K.white, { p: [0.4, 0.9, 0] }), beam([0.4, 1.4, 0], [-1.0, 0.45, 0], 0.025, K.steelDk));

// Two back walls (along -z and -x) of a room, with a brand stripe along the top; returns parts.
const labWalls = (h = 2.4, wall = '#eef0f2') => [part(rbox(10.4, h, 0.2, 0.04), wall, { p: [0, y0 + h / 2, -5.1] }), part(rbox(0.2, h, 10.0, 0.04), wall, { p: [-5.1, y0 + h / 2, 0.1] }), part(box(10.4, 0.2, 0.22), 'A', { p: [0, y0 + h - 0.1, -5.1] }), part(box(0.22, 0.2, 10.0), 'A', { p: [-5.1, y0 + h - 0.1, 0.1] })];
// A sample tube with a coloured cap, standing on y = 0.
const tubeGeo = (cap = '#e5533d') => merge(part(cyl(0.07, 0.07, 0.38, 12), '#eef6fa', { p: [0, 0.19, 0] }), part(cyl(0.065, 0.065, 0.2, 12), '#c0392b', { p: [0, 0.12, 0] }), part(cyl(0.085, 0.085, 0.08, 12), cap, { p: [0, 0.42, 0] }));
// A green tick in a disc, facing +z, centred on the origin.
const tickGeo = (r = 0.3) => merge(part(cyl(r, r, 0.06, 24), '#5fae5b', { r: [Math.PI / 2, 0, 0] }), part(extrude([[-0.5, 0.05], [-0.25, -0.2], [0.45, 0.45], [0.35, 0.55], [-0.25, 0.0], [-0.42, 0.15]].map(([x, y]) => [x * r, y * r]), 0.08), K.white, { p: [0, 0, 0.03] }));

// A heart, flat face toward +z, about 2s across, centred on the origin, with a bevelled edge.
const heartGeo = (s = 1, depth = 0.6) => { const pts = []; for (let i = 0; i < (hi() ? 48 : 20); i++) { const a = (i / (hi() ? 48 : 20)) * TAU; pts.push([(16 * Math.sin(a) ** 3) / 16 * s, ((13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16) * s]); } return extrude(pts, depth); };
// A hospital bed facing +x on y = 0, with a patient under the covers.
const bed = (blanket = 'A') => merge(part(rbox(2.0, 0.3, 1.0, 0.05), '#c9ced6', { p: [0, 0.55, 0] }), [-0.85, 0.85].flatMap((x) => [-0.4, 0.4].map((z) => part(cyl(0.04, 0.04, 0.45, 8), K.steelDk, { p: [x, 0.25, z] }))),
  part(rbox(0.08, 0.7, 1.0, 0.03), '#9aa1a9', { p: [-1.0, 0.8, 0] }), part(rbox(1.9, 0.2, 0.95, 0.08), K.white, { p: [0, 0.78, 0] }), part(rbox(1.3, 0.22, 0.98, 0.08), blanket, { p: [0.3, 0.86, 0] }),
  part(rbox(0.4, 0.14, 0.6, 0.06), K.white, { p: [-0.7, 0.92, 0] }), part(new THREE.SphereGeometry(0.17, 14, 10), '#e9b98f', { p: [-0.62, 1.08, 0] }), part(new THREE.SphereGeometry(0.175, 14, 10), '#5a3a28', { p: [-0.68, 1.12, 0], s: [1, 0.7, 1] }));

// A lattice transmission pylon on y = 0, h tall, cross-arms along z.
const pylon = (h = 3.2, c = '#9aa1a9') => {
  const g = [], w = 0.45;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => g.push(beam([sx * w, 0, sz * w], [sx * 0.12, h, sz * 0.12], 0.05, c)));
  if (hi()) for (let y = 0.4; y < h - 0.3; y += 0.55) { const k = 1 - (y / h) * 0.74; g.push(beam([-w * k, y, -w * k], [w * k, y + 0.5, w * k], 0.025, c), beam([w * k, y, -w * k], [-w * k, y + 0.5, w * k], 0.025, c)); }
  [h * 0.72, h * 0.92].forEach((y, i) => g.push(beam([0, y, -0.9 + i * 0.25], [0, y, 0.9 - i * 0.25], 0.05, c), ...[-1, 1].map((sz) => part(cyl(0.04, 0.04, 0.2, 8), '#d8dde3', { p: [0, y - 0.12, sz * (0.85 - i * 0.25)] }))));
  return merge(g);
};

// A jigsaw piece 1 × 1 in the xz plane (thickness d), edges [top(-z), right(+x), bottom(+z), left(-x)]:
// +1 a tab, -1 a blank, 0 flat.
const jigsaw = (edges, d = 0.16) => {
  const sh = new THREE.Shape(), r = 0.14, n = hi() ? 10 : 5;
  const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  sh.moveTo(-0.5, -0.5);
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = corners[e], [bx, by] = corners[(e + 1) % 4], k = edges[e], mx = (ax + bx) / 2, my = (ay + by) / 2, nx = (by - ay), ny = -(bx - ax);
    if (k) { const dx = (bx - ax), dy = (by - ay); sh.lineTo(ax + dx * 0.36, ay + dy * 0.36); for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI * 1.0, cx = mx - nx * k * r * 0.9, cy = my - ny * k * r * 0.9; sh.lineTo(cx + Math.cos(a) * dx * r + Math.sin(a) * -nx * k * r * -1, cy + Math.cos(a) * dy * r + Math.sin(a) * -ny * k * r * -1); } sh.lineTo(ax + dx * 0.64, ay + dy * 0.64); }
    sh.lineTo(bx, by);
  }
  const bev = 0.03;
  return new THREE.ExtrudeGeometry(sh, { depth: d - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: hi() ? 2 : 1, curveSegments: 4 }).rotateX(Math.PI / 2).translate(0, d - bev, 0);
};
// A little quadcopter, its rotors on top, hanging hook below.
const drone = (c = 'A') => merge(part(rbox(0.36, 0.12, 0.36, 0.05), c), [[-1, -1], [1, -1], [1, 1], [-1, 1]].flatMap(([sx, sz]) => [beam([0, 0, 0], [sx * 0.3, 0.04, sz * 0.3], 0.03, K.dark), part(cyl(0.14, 0.14, 0.015, 16), '#c9ced6', { p: [sx * 0.3, 0.1, sz * 0.3] })]), part(cyl(0.05, 0.05, 0.03, 10), '#62d35f', { p: [0.19, 0, 0], r: [0, 0, Math.PI / 2] }));

// A stethoscope lying over things: ear tips, the binaural Y, the long tube and the chestpiece,
// laid out in the xz plane at about unit scale (pass a curve of the tube's run in the scene).
const stethoscope = (run, c = 'A') => merge(part(tubeOn(run, 0.08, hi() ? 80 : 20), c),
  (() => { const p = run.getPointAt(1); return [part(cyl(0.38, 0.38, 0.16, 28), K.steel, { p: [p.x, p.y, p.z] }), part(cyl(0.3, 0.3, 0.18, 28), '#e9ecef', { p: [p.x, p.y + 0.01, p.z] })]; })(),
  (() => { const p = run.getPointAt(0), d = run.getTangentAt(0); return [[-1, 1].map((s) => part(tube([[p.x, p.y, p.z], [p.x - d.x * 0.5 + s * 0.35 * d.z, p.y + 0.5, p.z - d.z * 0.5 - s * 0.35 * d.x], [p.x - d.x * 0.6 + s * 0.6 * d.z, p.y + 1.0, p.z - d.z * 0.6 - s * 0.6 * d.x]], 0.05), K.steel)), [-1, 1].map((s) => part(new THREE.SphereGeometry(0.1, 12, 8), K.dark, { p: [p.x - d.x * 0.6 + s * 0.6 * d.z, p.y + 1.05, p.z - d.z * 0.6 - s * 0.6 * d.x] }))]; })());
// A member card, flat face toward +z, centred on the origin.
const cardGeo = (c = 'A') => merge(part(rbox(0.9, 0.56, 0.04, 0.06), c), part(box(0.86, 0.1, 0.045), shade('#ffffff', 0.95), { p: [0, 0.12, 0] }), part(box(0.3, 0.05, 0.05), K.white, { p: [-0.22, -0.12, 0] }), part(box(0.2, 0.15, 0.05), K.gold, { p: [0.25, -0.1, 0] }));

// Pallet racking: n bays × levels, each shelf stocked with boxes; front face toward +z, on y = 0.
const racking = (R, bays = 3, levels = 3, frame = '#2a5bb0', beamC = K.orange, boxes = ['#c99a62', '#d9ab70', '#e8d3ad']) => {
  const g = [], bw = 1.1, lh = 0.75, d = 0.8;
  for (let i = 0; i <= bays; i++) [-d / 2, d / 2].forEach((z) => g.push(part(new THREE.BoxGeometry(0.07, levels * lh + 0.1, 0.07), frame, { p: [i * bw, (levels * lh + 0.1) / 2, z] })));
  for (let l = 0; l < levels; l++) {
    [-d / 2, d / 2].forEach((z) => g.push(part(new THREE.BoxGeometry(bays * bw, 0.08, 0.06), beamC, { p: [(bays * bw) / 2, 0.1 + l * lh, z] })));
    for (let i = 0; i < bays; i++) for (let k = 0; k < 2; k++) if (R() > 0.15) g.push(part(rbox(0.45, 0.4 + R() * 0.15, 0.6, 0.03), boxes[Math.floor(R() * boxes.length)], { p: [i * bw + 0.3 + k * 0.5, 0.36 + l * lh, 0] }));
  }
  return merge(g);
};
// A medicine case: a white box with a brand cross.
const medBox = (c = 'A', s = 1) => merge(part(rbox(0.5 * s, 0.36 * s, 0.4 * s, 0.03 * s), K.white), part(box(0.22 * s, 0.07 * s, 0.02), c, { p: [0, 0, 0.2 * s + 0.01] }), part(box(0.07 * s, 0.22 * s, 0.02), c, { p: [0, 0, 0.2 * s + 0.01] }));

// A refinery column (radius r, height h) standing on y = 0: banded shell, skirt, a domed head,
// platforms with handrails every metre or so, a ladder up the front-right side and a vent.
const column = (r, h, shell = '#e9ecef', band = 'A') => {
  const g = [part(new THREE.CylinderGeometry(r, r, h, hi() ? 36 : 12, hi() ? 6 : 1), (x, y) => (Math.floor(y * 1.6) % 2 ? shell : shade(shell, 0.94)), { p: [0, h / 2, 0] }),
    part(cyl(r * 1.12, r * 1.18, 0.3, 24), K.stoneDk, { p: [0, 0.15, 0] }), part(new THREE.SphereGeometry(r, hi() ? 24 : 8, hi() ? 10 : 4, 0, TAU, 0, Math.PI / 2), shell, { p: [0, h, 0] }),
    part(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.2, hi() ? 36 : 12, 1, true), band, { p: [0, h * 0.86, 0] }), part(cyl(0.06, 0.06, 0.5, 8), K.steelDk, { p: [0, h + r * 0.9, 0] })];
  for (let y = 1.1; y < h - 0.3; y += 1.2) {
    g.push(part(torus(r + 0.16, 0.05, TAU * 0.6, 24), K.steelDk, { p: [0, y, 0], r: [Math.PI / 2, 0, -0.3] }));
    if (hi()) g.push(part(torus(r + 0.2, 0.02, TAU * 0.6, 24), K.orange, { p: [0, y + 0.3, 0], r: [Math.PI / 2, 0, -0.3] }));
  }
  const a = Math.PI / 4;
  [-0.1, 0.1].forEach((o) => g.push(beam([Math.cos(a + o) * (r + 0.1), 0.3, Math.sin(a + o) * (r + 0.1)], [Math.cos(a + o) * (r + 0.1), h - 0.2, Math.sin(a + o) * (r + 0.1)], 0.035, K.steelDk)));
  return merge(g);
};
// A road tanker facing +x on y = 0, about 3 long: cab in a brand colour, a polished tank.
const tankTruck = (cab = 'A', tank = '#dfe3e8', stripe = 'B') => merge(
  part(rbox(0.8, 0.9, 0.95, 0.1), cab, { p: [1.05, 0.68, 0] }), part(box(0.04, 0.32, 0.8), '#26323f', { p: [1.46, 0.85, 0] }), part(rbox(3.0, 0.16, 0.8, 0.03), K.dark, { p: [0, 0.32, 0] }),
  part(capsule(0.42, 1.55), tank, { p: [-0.35, 0.86, 0], r: [0, 0, Math.PI / 2] }), part(new THREE.CylinderGeometry(0.43, 0.43, 0.3, hi() ? 24 : 10, 1, true), stripe, { p: [-0.35, 0.86, 0], r: [0, 0, Math.PI / 2] }),
  part(rbox(0.3, 0.1, 0.3, 0.03), K.steelDk, { p: [-0.35, 1.32, 0] }),
  [[-1.25, 0.4], [-0.85, 0.4], [1.0, 0.4], [-1.25, -0.4], [-0.85, -0.4], [1.0, -0.4]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 14), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] })));

// A rocket standing on y = 0, h tall, facing +z: white body with a brand band, nose cone, fins.
const rocketGeo = (h = 4, body = '#f4f5f6', band = 'A', nose = 'Ad') => { const r = h * 0.075; return merge(
  part(lathe([[r * 0.8, 0], [r, h * 0.06], [r, h * 0.72], [r * 0.97, h * 0.74], [0.001, h * 0.74]], 32), body), part(lathe([[r * 0.97, 0], [r * 0.85, h * 0.1], [r * 0.45, h * 0.2], [0.001, h * 0.26]], 32), nose, { p: [0, h * 0.74, 0] }),
  part(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.08, hi() ? 32 : 12, 1, true), band, { p: [0, h * 0.5, 0] }), part(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * 0.025, hi() ? 32 : 12, 1, true), band, { p: [0, h * 0.6, 0] }),
  ring(4, (a) => part(extrude([[0, 0], [r * 1.5, -h * 0.02], [r * 1.5, h * 0.08], [0, h * 0.2]], 0.05), band, { p: [Math.cos(a + Math.PI / 4) * r * 0.9, h * 0.02, Math.sin(a + Math.PI / 4) * r * 0.9], r: [0, -a - Math.PI / 4, 0] })),
  part(cyl(r * 0.6, r * 0.8, h * 0.05, 16), K.dark, { p: [0, -h * 0.015, 0] })); };
// A radar dish on a turning mount (dish faces +x, tilted up), base at y = 0.
const radarDish = (r = 0.8, c = K.white) => merge(part(new THREE.SphereGeometry(r, hi() ? 28 : 10, hi() ? 10 : 4, 0, TAU, 0, Math.PI * 0.32), c, { r: [0, 0, Math.PI / 2 + 0.6], p: [-r * 0.5, 0, 0] }),
  beam([0, 0, 0], [r * 0.45, r * 0.32, 0], 0.04, K.steelDk), part(new THREE.SphereGeometry(0.08, 10, 8), 'A', { p: [r * 0.47, r * 0.34, 0] }), part(cyl(0.12, 0.16, 0.3, 12), K.steelDk, { p: [-0.2, -0.15, 0] }));

export const SCENES = {
  // Coin tower (regional banks, mortgage finance): deposits in, loans out. A customer walks into
  // the branch; a coin flies from its roof onto the tower of savings; the bottom coin slides out
  // and rolls across the green to a family's new house, and its key pops up.
  'bank:10': () => {
    const R = rand(101), out = [], moving = [];
    out.push(slab('#d6ccb8'));
    // Lawn, paths and a kerb.
    out.push(part(rbox(4.6, 0.06, 4.4, 0.04), '#8cc66a', { p: [2.6, y0 + 0.03, 2.6] }), part(rbox(3.8, 0.06, 2.4, 0.04), '#8cc66a', { p: [-3.0, y0 + 0.03, 3.6] }));
    out.push(part(box(10.2, 0.03, 0.9), '#d2c8b4', { p: [0, y0 + 0.015, 0.8] }), part(box(0.9, 0.03, 4.2), '#d2c8b4', { p: [-0.5, y0 + 0.015, 3.0] }));
    // ---- the branch: a classical bank on steps, its pediment and frieze in the brand colour
    const BX = -2.3, BZ = -2.1, W = 3.6, D = 2.6, H = 2.3, front = BZ + D / 2;
    for (let i = 0; i < 3; i++) out.push(part(rbox(W + 0.8 - i * 0.25, 0.14, D + 0.9 - i * 0.25, 0.03), i % 2 ? K.stone : K.stoneDk, { p: [BX, y0 + 0.07 + i * 0.14, BZ + 0.2 - i * 0.06] }));
    const fl = y0 + 0.42;
    out.push(part(rbox(W, H, D - 0.7, 0.05), K.cream, { p: [BX, fl + H / 2, BZ - 0.35] }));
    for (let i = 0; i < 4; i++) {
      const x = BX - W / 2 + 0.4 + i * ((W - 0.8) / 3);
      out.push(part(cyl(0.17, 0.2, H - 0.3, 16), K.white, { p: [x, fl + (H - 0.3) / 2 + 0.12, front - 0.25] }), part(rbox(0.5, 0.12, 0.5, 0.03), K.stone, { p: [x, fl + 0.06, front - 0.25] }), part(rbox(0.5, 0.14, 0.5, 0.03), K.stone, { p: [x, fl + H - 0.12, front - 0.25] }));
    }
    out.push(part(rbox(W + 0.25, 0.32, D + 0.1, 0.04), 'A', { p: [BX, fl + H + 0.16, BZ] }), part(box(W + 0.3, 0.06, D + 0.15), K.white, { p: [BX, fl + H + 0.35, BZ] }));
    out.push(part(prism(W + 0.3, 0.75, 0.3), 'Ad', { p: [BX, fl + H + 0.38, front - 0.12] }), part(prism(W - 0.3, 0.5, 0.06), K.white, { p: [BX, fl + H + 0.44, front + 0.04] }));
    out.push(part(rbox(W - 0.3, 0.4, D - 0.9, 0.05), K.stone, { p: [BX, fl + H + 0.58, BZ - 0.45] }));
    out.push(part(rbox(0.7, 1.2, 0.08, 0.04), K.ink, { p: [BX, fl + 0.6, BZ - 0.35 + (D - 0.7) / 2 + 0.03] }), part(rbox(0.86, 0.12, 0.1, 0.03), 'B', { p: [BX, fl + 1.26, BZ - 0.35 + (D - 0.7) / 2 + 0.04] }));
    [-1, 1].forEach((s) => out.push(part(rbox(0.5, 0.8, 0.06, 0.03), '#a8d4f0', { p: [BX + s * 1.15, fl + 1.0, BZ - 0.35 + (D - 0.7) / 2 + 0.03] })));
    out.push(part(cyl(0.03, 0.03, 1.4, 8), K.steelDk, { p: [BX + W / 2 + 0.2, y0 + 0.7, front + 0.55] }), part(rbox(0.5, 0.34, 0.04, 0.02), 'B', { p: [BX + W / 2 + 0.2, y0 + 1.3, front + 0.55] }));
    // ---- the tower of savings: coins stacked on a plinth with a slot at its foot
    const TX = 2.3, TZ = -2.2, CH = 0.2, N = 26, base = y0 + 0.5, c = coin();
    out.push(part(cyl(1.1, 1.2, 0.5, 40), K.white, { p: [TX, y0 + 0.25, TZ] }), part(cyl(1.22, 1.24, 0.14, 40), 'A', { p: [TX, y0 + 0.08, TZ] }));
    // A ramp from the slot down to the lawn, where the loans roll out.
    out.push(part(rbox(0.5, 0.06, 1.3, 0.03), K.steel, { p: [TX + 0.55, y0 + 0.3, TZ + 1.3], r: [0.32, 0, 0] }));
    const jit = (k) => [(R() - 0.5) * 0.06, (R() - 0.5) * 0.06, (R() - 0.5) * 0.3];
    const stack = [];
    for (let k = 1; k < N; k++) { const [dx, dz, ry] = jit(k); stack.push(place(c, { p: [dx, base + CH / 2 + k * CH, dz], r: [0, ry, 0] })); }
    // ---- the homes across the green, one waiting for its loan
    const HX = 3.3, HZ = 2.9;
    out.push(place(home(K.cream, 'Ad'), { p: [HX, y0, HZ], r: [0, -Math.PI / 2 + 0.2, 0] }), place(home('#f3e6d0', '#7d6a5a', 1.5, 1.4, 1.0), { p: [0.9, y0, 4.0], r: [0, Math.PI, 0] }), place(home('#e9eef2', '#5a6b7d', 1.5, 1.3, 1.0), { p: [-3.2, y0, 3.7], r: [0, 0.1, 0] }));
    out.push(part(box(0.06, 0.4, 1.4), K.white, { p: [HX - 1.35, y0 + 0.2, HZ] }));
    [[4.55, -4.55], [-4.55, -4.4], [0.4, -4.4], [-4.6, 1.5]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.6 + R() * 0.25)));
    if (hi()) for (let i = 0; i < 10; i++) { const a = R() * TAU, d = R() * 1.6; out.push(tuft(R, 2.6 + Math.cos(a) * d, 2.4 + Math.sin(a) * d, 0.2, 6, ['#7fcf3f', '#6cc23a', '#94d84f'], 0.3).map((g) => place(g, { p: [0, y0, 0] }))); }
    // ---- moving parts (one 7 s cycle)
    const P = 7, F = (t) => cyc(t, P);
    // The stack settles by one coin as the bottom one leaves, then resets unseen (it looks the same).
    const settle = (f) => -CH * easeIO(win(f, 0.62, 0.72));
    moving.push({ geo: merge(stack), pivot: [TX, 0, TZ], anim: (t) => ({ y: settle(F(t)) }) });
    // The deposit: up from the bank's roof, over, and down onto the top of the tower.
    const from = new V(BX + 0.9, fl + H + 0.8, BZ), to = new V(TX, base + CH / 2 + N * CH, TZ);
    moving.push({ geo: c, pivot: to.toArray(), anim: (t) => {
      const f = F(t), k = easeIO(win(f, 0.3, 0.52)), land = f > 0.52;
      const p = from.clone().lerp(to, k).sub(to);
      return { x: p.x, z: p.z, y: (land ? 0 : p.y + hop(k) * 2.4) + hop(win(f, 0.52, 0.58)) * 0.25 + settle(f), rx: (1 - k) * TAU * 2, s: f < 0.28 ? 0.001 : Math.min(1, (f - 0.28) / 0.03) };
    } });
    const qH = new THREE.Quaternion(), qT = new THREE.Quaternion(), qS = new THREE.Quaternion(), X = new V(1, 0, 0), Y = new V(0, 1, 0);
    // The loan: out of the slot, down the ramp, rolling on its edge to the house's door.
    const path = curve([[TX, base + CH / 2, TZ], [TX + 0.6, y0 + 0.62, TZ + 0.9], [TX + 0.6, y0 + 0.3, TZ + 2.0], [TX + 0.9, y0 + 0.62, 0.8], [HX - 0.9, y0 + 0.62, HZ - 0.2]]);
    moving.push({ geo: c, pivot: [0, 0, 0], anim: (t) => {
      const f = F(t), k = win(f, 0.6, 0.95), { p, ry } = along(path, easeIO(k) * 0.999), up = win(k, 0.08, 0.2);
      // Heading, then tipped up onto its edge, then spinning about its own axis as it rolls.
      const q = qH.setFromAxisAngle(Y, ry).multiply(qT.setFromAxisAngle(X, (up * Math.PI) / 2)).multiply(qS.setFromAxisAngle(Y, -easeIO(k) * 14));
      return { x: p.x, y: p.y, z: p.z, q, s: f > 0.95 ? 1 - win(f, 0.95, 0.99) : 1 };
    } });
    // The key pops up over the new homeowners' roof.
    const key = merge(part(torus(0.22, 0.06, TAU, 18), K.gold, { r: [0, 0, 0] }), part(rbox(0.6, 0.1, 0.08, 0.03), K.gold, { p: [0.5, 0, 0] }), part(box(0.08, 0.18, 0.08), K.gold, { p: [0.7, -0.1, 0] }), part(box(0.08, 0.14, 0.08), K.gold, { p: [0.55, -0.08, 0] }));
    moving.push({ geo: key, pivot: [HX, y0 + 2.6, HZ], anim: (t) => { const f = F(t); return { y: back(win(f, 0.93, 0.99)) * 0.5 + (f < 0.2 ? 0.5 + hop(win(f, 0, 0.2)) * 0.1 : 0), ry: t * 1.6, s: f < 0.2 ? 1 - win(f, 0.12, 0.2) : life(f, 0.93, 0.98, 1, 1.1) }; } });
    // The depositor, from the street to the bank's door.
    const wp = curve([[-0.5, 0, 5.0], [-0.5, 0, 1.4], [-1.4, 0, 0.8], [BX, 0, 0.6], [BX, 0, front - 0.3]]);
    moving.push(...walker(moving.length, (t) => {
      const f = F(t), k = win(f, 0, 0.34), { p, ry } = along(wp, k * 0.999);
      return { x: p.x, z: p.z, ry, s: f > 0.34 ? 0.001 : Math.min(1, k / 0.04, (1 - k) / 0.04), still: f > 0.34 };
    }, { shirt: 'B', pants: '#2b3a55', y: y0 }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.7, y0, 0.3], topAt: [BX, fl + H + 0.78, BZ - 0.45] };
  },

  // Neighborhood (homebuilders, real estate): new homes go up lot by lot. Across the street a
  // family pulls into the drive of a finished home as its SOLD sign goes up; on this side a
  // mixer pours a slab and a crane swings a roof truss onto a frame.
  'house:0': () => {
    const R = rand(202), out = [], moving = [];
    out.push(slab('#93c46e'));
    // The street, kerbs and sidewalks.
    const RZ = -1.2;
    out.push(part(box(10.4, 0.03, 1.5), '#5b616b', { p: [0, y0 + 0.015, RZ] }));
    for (let i = 0; i < 7; i++) out.push(part(box(0.7, 0.012, 0.07), '#f2e9c9', { p: [-4.5 + i * 1.5, y0 + 0.035, RZ] }));
    [RZ - 1.0, RZ + 1.0].forEach((z) => out.push(part(box(10.4, 0.05, 0.5), '#e4ded2', { p: [0, y0 + 0.025, z] })));
    // Finished homes across the street, in a few tones; the right-hand one is just sold.
    const HZ = -3.7, tones = [['#f3ead8', 'Ad', 'B'], ['#e4ecf0', 'Bd', K.ink], ['#f6f0e4', 'A', 'Bd']];
    [-3.5, -0.2, 3.0].forEach((x, i) => {
      out.push(place(house2(...tones[i]), { p: [x, y0, HZ] }), part(box(1.0, 0.04, 1.0), '#cfc8bb', { p: [x + 1.15, y0 + 0.02, HZ + 1.3] }));
      out.push(part(rbox(0.12, 0.3, 0.12, 0.02), K.ink, { p: [x - 1.5, y0 + 0.15, RZ - 1.35] }), part(rbox(0.22, 0.14, 0.12, 0.03), tones[i][1], { p: [x - 1.5, y0 + 0.36, RZ - 1.35] }));
    });
    const SX = 2.6, SZ = RZ - 1.4;
    out.push(part(new THREE.BoxGeometry(0.08, 1.5, 0.08), K.white, { p: [SX + 0.5, y0 + 0.75, SZ] }), part(new THREE.BoxGeometry(1.0, 0.06, 0.06), K.white, { p: [SX, y0 + 1.47, SZ] }), part(rbox(0.9, 0.55, 0.05, 0.03), K.white, { p: [SX, y0 + 1.1, SZ] }), part(box(0.6, 0.08, 0.06), 'B', { p: [SX, y0 + 1.16, SZ] }), part(box(0.45, 0.06, 0.06), K.steelDk, { p: [SX, y0 + 1.0, SZ] }));
    [[-4.6, -4.7], [-1.65, -4.7], [1.65, -4.7], [4.6, -4.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.2)));
    // ---- lot 1: the slab being poured inside its forms
    const L1 = -3.1, LZ = 2.2;
    out.push(part(box(2.4, 0.04, 2.0), '#a8865c', { p: [L1, y0 + 0.02, LZ] }));
    [[0, 1.0, 2.4, 0.06], [0, -1.0, 2.4, 0.06], [1.2, 0, 0.06, 2.0], [-1.2, 0, 0.06, 2.0]].forEach(([x, z, w, d]) => out.push(part(new THREE.BoxGeometry(w, 0.22, d), LUMBERDK, { p: [L1 + x, y0 + 0.11, LZ + z] })));
    out.push(part(box(2.3, 0.14, 1.9), '#c3c0b8', { p: [L1, y0 + 0.07, LZ] }));
    if (hi()) for (let i = 0; i < 5; i++) out.push(part(new THREE.BoxGeometry(2.2, 0.02, 0.02), '#8a5a3a', { p: [L1, y0 + 0.16, LZ - 0.8 + i * 0.4] }));
    // The mixer at the kerb, its chute over the forms.
    const MX = -3.2, MZ = RZ + 0.35;
    out.push(part(rbox(2.6, 0.32, 0.9, 0.04), '#3a3f47', { p: [MX, y0 + 0.36, MZ] }), part(rbox(0.8, 0.8, 0.9, 0.1), 'A', { p: [MX - 1.0, y0 + 0.9, MZ] }), part(box(0.05, 0.36, 0.72), '#26323f', { p: [MX - 1.41, y0 + 1.0, MZ] }));
    [[-1.0, 0.45], [0.4, 0.45], [0.9, 0.45], [-1.0, -0.45], [0.4, -0.45], [0.9, -0.45]].forEach(([x, z]) => out.push(part(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16), '#1d1f24', { p: [MX + x, y0 + 0.22, MZ + z], r: [Math.PI / 2, 0, 0] })));
    out.push(beam([MX + 1.25, y0 + 1.3, MZ + 0.1], [MX + 0.9, y0 + 0.6, LZ - 0.6], 0.14, K.steelDk));
    // ---- lot 2: the frame the crane is roofing
    const L2 = 0.4;
    out.push(place(frame(), { p: [L2, y0, LZ] }));
    // ---- the crane on the corner lot, with a stack of trusses at its feet
    const CX = 3.6, CZ = 1.1, CY = y0 + 1.0, toDrop = new V(L2 + 0.35 - CX, 0, LZ - CZ), REACH = toDrop.length(), TOP = 3.0;
    const yawDrop = Math.atan2(-toDrop.z, toDrop.x), yawPick = -Math.PI / 2, PX = CX, PZ = CZ + REACH;
    out.push(part(rbox(2.2, 0.4, 1.0, 0.05), '#f2c94c', { p: [CX + 0.2, y0 + 0.42, CZ], r: [0, 0, 0] }), part(rbox(0.7, 0.75, 0.95, 0.1), '#f2c94c', { p: [CX + 1.05, y0 + 0.85, CZ] }), part(box(0.05, 0.34, 0.75), '#26323f', { p: [CX + 1.41, y0 + 0.95, CZ] }));
    [[-0.6, 0.5], [0.9, 0.5], [-0.6, -0.5], [0.9, -0.5]].forEach(([x, z]) => out.push(part(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16), '#1d1f24', { p: [CX + x, y0 + 0.24, CZ + z], r: [Math.PI / 2, 0, 0] })));
    [[-0.8, 0.7], [-0.8, -0.7], [1.2, 0.7], [1.2, -0.7]].forEach(([x, z]) => out.push(part(rbox(0.3, 0.06, 0.3, 0.02), K.steelDk, { p: [CX + x, y0 + 0.03, CZ + z] }), beam([CX + x, y0 + 0.05, CZ + z], [CX + x * 0.7, y0 + 0.4, CZ + z * 0.7], 0.06, K.steelDk)));
    out.push(part(box(0.9, 0.1, 2.1), LUMBERDK, { p: [PX, y0 + 0.05, PZ] }));
    for (let i = 0; i < 3; i++) out.push(place(truss(1.9), { p: [PX, y0 + 0.14 + i * 0.08, PZ], r: [0, 0, -Math.PI / 2 + 0.02 * i] }));
    [[-4.6, 4.5], [-0.6, 4.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.2)));
    if (hi()) for (let i = 0; i < 8; i++) out.push(tuft(R, -4.5 + R() * 9, 3.6 + R() * 1.0, 0.25, 6, ['#7fcf3f', '#6cc23a', '#94d84f'], 0.3).map((g) => place(g, { p: [0, y0, 0] })));
    // ---- moving parts (one 9 s cycle)
    const P = 9, F = (t) => cyc(t, P);
    const yaw = (f) => yawPick + (yawDrop - yawPick) * (easeIO(win(f, 0.18, 0.42)) - easeIO(win(f, 0.68, 0.9)));
    const tip = (f) => { const a = yaw(f); return new V(CX + Math.cos(a) * REACH, CY + TOP - 0.4, CZ - Math.sin(a) * REACH); };
    // How far below the boom's tip the hook hangs: down to the stack, up, over, down onto the plates.
    const pick = CY + TOP - 0.4 - (y0 + 0.4), set = CY + TOP - 0.4 - (y0 + 2.2), up = 0.8;
    const cable = (f) => (f < 0.08 ? pick : f < 0.16 ? pick + (up - pick) * easeIO(win(f, 0.08, 0.16)) : f < 0.44 ? up : f < 0.56 ? up + (set - up) * easeIO(win(f, 0.44, 0.56)) : f < 0.62 ? set : set + (up - set) * easeIO(win(f, 0.62, 0.7)) + (pick - up) * easeIO(win(f, 0.9, 1)));
    moving.push({ geo: merge(part(cyl(0.45, 0.5, 0.35, 20), '#f2c94c', { p: [0, 0.17, 0] }), part(rbox(0.5, 0.45, 0.5, 0.06), '#e0b33a', { p: [-0.35, 0.55, 0] }), part(box(0.05, 0.3, 0.4), '#26323f', { p: [-0.1, 0.6, 0.0] }),
      beam([0, 0.4, 0], [REACH, TOP, 0], 0.2, '#f2c94c'), beam([-0.2, 0.5, 0], [REACH, TOP, 0], 0.06, '#e0b33a'), part(cyl(0.12, 0.12, 0.3, 12), K.ink, { p: [REACH, TOP, 0], r: [Math.PI / 2, 0, 0] })).rotateY(yawPick),
      pivot: [CX, CY - 0.4, CZ], anim: (t) => ({ ry: yaw(F(t)) - yawPick }) });
    moving.push({ geo: part(new THREE.CylinderGeometry(0.015, 0.015, 1, 6), K.ink, { p: [0, -0.5, 0] }), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = tip(f); return { x: p.x, y: p.y, z: p.z, sy: cable(f) }; } });
    moving.push({ geo: merge(part(cone(0.1, 0.18, 10), K.ink, { r: [Math.PI, 0, 0] }), part(torus(0.06, 0.02, Math.PI * 1.5, 12), K.steelDk, { p: [0, -0.14, 0] })), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = tip(f); return { x: p.x, y: p.y - cable(f), z: p.z }; } });
    // The truss on the hook, turning with the boom so it lands square across the frame; it is
    // picked up lying on its side and swings upright.
    moving.push({ geo: truss(1.9), pivot: [0, 0, 0], anim: (t) => {
      const f = F(t), at = tip(Math.min(f, 0.6)), hang = f < 0.6 ? cable(f) : set;
      return { x: at.x, y: at.y - hang - 0.95 + (1 - easeIO(win(f, 0.06, 0.14))) * 0.75, z: at.z, ry: yaw(Math.min(f, 0.6)) - yawDrop, rz: -Math.PI / 2 * (1 - easeIO(win(f, 0.06, 0.14))), sy: f > 0.94 ? 1 - win(f, 0.94, 1) : 1, s: f < 0.04 ? f / 0.04 : 1 };
    } });
    // The mixer's drum turns.
    moving.push({ geo: merge(part(lathe([[0, -0.95], [0.32, -0.8], [0.5, -0.3], [0.52, 0.2], [0.38, 0.75], [0.2, 0.95], [0, 0.96]], 24), (x, y, z) => (Math.floor(Math.atan2(z, x) / 0.5 + y * 3) % 2 ? '#e9e6df' : 'B')), part(torus(0.36, 0.04, TAU, 20), K.steelDk, { p: [0, 0.3, 0], r: [Math.PI / 2, 0, 0] })),
      pivot: [MX + 0.4, y0 + 1.15, MZ], anim: (t) => ({ q: new THREE.Quaternion().setFromAxisAngle(new V(0, 0, 1), -Math.PI / 2 + 0.35).multiply(new THREE.Quaternion().setFromAxisAngle(new V(0, 1, 0), t * 2)) }) });
    // A finisher trowelling the wet slab.
    moving.push(...walker(moving.length, (t) => { const k = Math.sin(t * 0.6); return { x: L1 + k * 0.7, z: LZ + 0.3, ry: Math.cos(t * 0.6) > 0 ? 0 : Math.PI }; }, { shirt: K.orange, pants: '#3b4a5c', y: y0 + 0.14 }));
    // The family's car comes down the street and into the drive; then the SOLD sign pops up.
    const drive = curve([[-5.6, 0, RZ - 0.35], [1.5, 0, RZ - 0.35], [3.7, 0, RZ - 0.4], [4.15, 0, RZ - 1.1], [4.15, 0, HZ + 1.5]]);
    moving.push({ geo: sedan('B'), pivot: [0, y0, 0], anim: (t) => {
      const f = F(t), k = easeOut(win(f, 0.05, 0.5)), { p, ry } = along(drive, k * 0.999);
      return { x: p.x, z: p.z, ry, s: f > 0.95 ? 1 - win(f, 0.95, 1) + 0.001 : Math.min(1, k / 0.02) * 0.8 + 0.001 };
    } });
    moving.push({ geo: merge(part(rbox(0.9, 0.3, 0.06, 0.03), 'A', { p: [0, -0.15, 0] }), part(box(0.56, 0.08, 0.07), K.white, { p: [0, -0.15, 0] })), pivot: [SX, y0 + 1.44, SZ + 0.04], anim: (t) => { const f = F(t); return { s: life(f, 0.5, 0.58, 0.94, 0.99), rx: (1 - back(win(f, 0.5, 0.6))) * 1.2 }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.7, y0, 0.6], topAt: [0, y0 + 2.95, HZ] };
  },

  // Harvest (grain, seed, fertiliser, farm machinery, tobacco): a combine cuts a swath through
  // ripe wheat, the crop dropping to stubble as its header passes, and augers the grain into a
  // cart running alongside; behind, a truck tips its load into the pit and the grain rides up the
  // elevator leg and pours into the bins.
  'farm:0': () => {
    const R = rand(303), out = [], moving = [];
    out.push(slab('#8a6a45'));
    // Furrowed soil, a farm track, standing wheat behind the swath.
    if (hi()) for (let i = 0; i < 14; i++) out.push(part(new THREE.BoxGeometry(10.2, 0.03, 0.08), '#7a5c3a', { p: [0, y0 + 0.015, -0.4 + i * 0.36] }));
    out.push(part(box(10.4, 0.04, 0.9), '#b89b72', { p: [0, y0 + 0.02, 1.65] }), part(box(0.9, 0.04, 3.4), '#b89b72', { p: [0.9, y0 + 0.02, -0.4] }));
    out.push(place(wheat(R, 5.6, 1.6), { p: [-2.3, y0, 0.2] }));
    // ---- the farmstead: a red barn and the grain elevator with its bins
    const BX = -2.8, BZ = -3.2;
    out.push(part(rbox(3.0, 1.9, 2.2, 0.05), '#b5432f', { p: [BX, y0 + 0.95, BZ] }));
    out.push(part(extrude([[-1.6, 0], [-1.6, 0.55], [-0.85, 1.25], [0.85, 1.25], [1.6, 0.55], [1.6, 0]], 2.4), '#5a4a42', { p: [BX, y0 + 1.9, BZ], r: [0, 0, 0] }).rotateY(0).translate(0, 0, 0));
    out.push(part(rbox(1.1, 1.3, 0.06, 0.03), K.white, { p: [BX + 0.2, y0 + 0.66, BZ + 1.11] }), part(rbox(0.94, 1.14, 0.07, 0.03), '#8f3424', { p: [BX + 0.2, y0 + 0.66, BZ + 1.12] }), beam([BX - 0.27, y0 + 0.12, BZ + 1.16], [BX + 0.67, y0 + 1.2, BZ + 1.16], 0.06, K.white), beam([BX + 0.67, y0 + 0.12, BZ + 1.16], [BX - 0.27, y0 + 1.2, BZ + 1.16], 0.06, K.white));
    out.push(part(rbox(0.5, 0.45, 0.06, 0.03), K.white, { p: [BX + 0.2, y0 + 2.35, BZ + 1.21] }), part(rbox(0.06, 0.5, 0.5, 0.03), K.white, { p: [BX + 1.51, y0 + 1.1, BZ] }));
    const EX = 2.6, EZ = -2.6;
    [[EX - 1.3, EZ - 1.4, 1.05, 2.6], [EX + 1.15, EZ - 1.35, 1.05, 2.6], [EX + 1.55, EZ + 0.95, 0.85, 2.0]].forEach(([x, z, r, h], i) => out.push(place(bin(r, h, i === 1 ? 'B' : 'A'), { p: [x, y0, z] })));
    // The leg: a tall steel tower with the head house on top and spouts to the bins.
    const LX = EX, LZ = EZ, LH = 5.2;
    out.push(part(rbox(0.6, LH, 0.6, 0.05), '#d8dde3', { p: [LX, y0 + LH / 2, LZ] }), part(rbox(0.9, 0.7, 0.9, 0.06), 'A', { p: [LX, y0 + LH + 0.3, LZ] }), part(prism(1.0, 0.35, 1.0), 'Ad', { p: [LX, y0 + LH + 0.65, LZ] }));
    for (let y = 0.6; y < LH; y += 0.6) out.push(part(box(0.66, 0.04, 0.66), '#a9b1bb', { p: [LX, y0 + y, LZ] }));
    const spouts = [[EX - 1.3, EZ - 1.4, y0 + 3.2], [EX + 1.15, EZ - 1.35, y0 + 3.2], [EX + 1.55, EZ + 0.95, y0 + 2.5]];
    spouts.forEach(([x, z, top]) => out.push(part(tube([[LX, y0 + LH, LZ], [(LX + x) / 2, y0 + LH - 0.3, (LZ + z) / 2], [x, top + 0.15, z]], 0.07), '#a9b1bb')));
    // The pit and its grate at the foot of the leg, where the truck tips.
    out.push(part(rbox(1.2, 0.08, 1.6, 0.03), '#5b616b', { p: [LX + 0.1, y0 + 0.04, LZ + 1.4] }));
    if (hi()) for (let i = 0; i < 6; i++) out.push(part(box(1.0, 0.02, 0.04), '#2b2f36', { p: [LX + 0.1, y0 + 0.09, LZ + 0.8 + i * 0.24] }));
    [[-4.6, -1.6], [-0.5, -4.6], [4.6, 0.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.6 + R() * 0.2)));
    // ---- the swath being cut: ten patches that drop to stubble as the header passes
    const P = 12, F = (t) => cyc(t, P), SZ = 3.45, NP = 10, PW = 10.2 / NP;
    const cx = (f) => -5.6 + 11.2 * win(f, 0.04, 0.8);
    for (let i = 0; i < NP; i++) {
      const x = -5.1 + PW / 2 + i * PW;
      moving.push({ geo: wheat(R, PW, 1.9), pivot: [x, y0, SZ], anim: (t) => {
        const f = F(t), cut = cx(f) + 1.15 > x - PW / 2 + 0.1 && f < 0.92;
        return { sy: cut ? 0.18 : 0.18 + 0.82 * easeOut(win(f, 0.92, 1) || 1) };
      } });
    }
    // The combine: brand-coloured body, glass cab, grain tank, header with its turning reel.
    const comb = moving.length;
    const body = merge(
      part(rbox(2.2, 1.1, 1.3, 0.12), 'A', { p: [-0.4, 0.95, 0] }), part(rbox(1.4, 0.65, 1.2, 0.12), 'Ad', { p: [-0.6, 1.8, 0] }),
      part(rbox(0.75, 0.75, 0.85, 0.08), '#9fcdea', { p: [0.55, 1.85, 0] }), part(rbox(0.8, 0.08, 0.9, 0.04), 'A', { p: [0.55, 2.26, 0] }),
      part(box(0.9, 0.5, 0.1), 'Ad', { p: [-0.5, 0.95, 0.66] }), part(cyl(0.09, 0.09, 0.7, 10), K.dark, { p: [-1.1, 2.3, -0.35] }),
      // Feeder house down to the header, and the header itself across the swath.
      part(rbox(0.9, 0.45, 0.8, 0.06), 'Ad', { p: [0.95, 0.75, 0], r: [0, 0, -0.35] }),
      part(rbox(0.5, 0.35, 2.3, 0.06), K.dark, { p: [1.45, 0.42, 0] }), part(box(0.6, 0.06, 2.3), K.steel, { p: [1.6, 0.27, 0] }),
      [-1.15, 1.15].map((z) => part(rbox(0.6, 0.5, 0.06, 0.03), 'A', { p: [1.5, 0.55, z] })),
      hi() ? ring(14, (a, i) => part(cone(0.04, 0.22, 6), K.steelDk, { p: [1.92, 0.27, -1.05 + i * 0.16], r: [0, 0, -Math.PI / 2] })) : [],
      // The unloading auger, folded out over the cart's side.
      beam([-0.9, 1.9, -0.4], [-0.1, 2.5, -1.7], 0.12, 'Ad'), part(cyl(0.09, 0.05, 0.25, 10), K.dark, { p: [-0.1, 2.4, -1.75] }),
    );
    moving.push({ geo: body, pivot: [0, y0, SZ], anim: (t) => { const f = F(t), x = cx(f); return { x, y: Math.abs(Math.sin(t * 6)) * 0.015, s: clamp01((5.6 - Math.abs(x)) / 0.5) * 0.999 + 0.001 }; } });
    [[0.2, 0.62, 0.68, 0.32], [0.2, 0.62, -0.68, 0.32], [-1.25, 0.38, 0.6, 0.24], [-1.25, 0.38, -0.6, 0.24]].forEach(([x, r, z, w]) => moving.push({ geo: tyre(r, w), pivot: [x, r, z], parent: comb, anim: (t) => ({ rz: -cx(F(t)) / r }) }));
    moving.push({ geo: merge(part(cyl(0.05, 0.05, 2.3, 8), K.steelDk, { r: [Math.PI / 2, 0, 0] }), ring(5, (a) => part(box(0.04, 0.06, 2.2), 'B', { p: [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0] })), ring(5, (a) => beam([0, 0, -1.0], [Math.cos(a) * 0.3, Math.sin(a) * 0.3, -1.0], 0.03, K.steelDk))),
      pivot: [1.75, 0.7, 0], parent: comb, anim: (t) => ({ rz: -t * 3 }) });
    // The grain cart and its tractor, keeping pace alongside, and the stream of grain between.
    const cart = moving.length, CZ = SZ - 1.75;
    moving.push({ geo: merge(
      part(rbox(1.5, 0.8, 1.0, 0.1), '#2f7d4f', { p: [-1.6, 0.85, 0] }), part(lathe([[0.62, 0], [0.75, 0.45], [0.75, 0.75], [0, 0.76]], 20), '#2f7d4f', { p: [-1.6, 1.25, 0], s: [1.15, 1, 0.75] }), part(box(1.4, 0.05, 0.8), '#e9c46a', { p: [-1.6, 1.98, 0] }),
      part(rbox(1.0, 0.55, 0.8, 0.08), K.red, { p: [0.45, 0.75, 0] }), part(rbox(0.6, 0.6, 0.7, 0.06), '#9fcdea', { p: [0.25, 1.32, 0] }), part(rbox(0.66, 0.05, 0.76, 0.02), K.red, { p: [0.25, 1.64, 0] }), beam([-0.85, 0.5, 0], [-0.1, 0.5, 0], 0.08, K.dark),
      place(tyre(0.48, 0.3), { p: [0.0, 0.48, 0.42] }), place(tyre(0.48, 0.3), { p: [0.0, 0.48, -0.42] }), place(tyre(0.28, 0.2), { p: [0.8, 0.28, 0.36] }), place(tyre(0.28, 0.2), { p: [0.8, 0.28, -0.36] }), place(tyre(0.4, 0.28), { p: [-1.6, 0.4, 0.55] }), place(tyre(0.4, 0.28), { p: [-1.6, 0.4, -0.55] })),
      pivot: [0, y0, CZ], anim: (t) => { const f = F(t), x = cx(f) + 1.6; return { x, y: Math.abs(Math.sin(t * 5)) * 0.015, s: clamp01((5.4 - Math.abs(x)) / 0.5) * 0.999 + 0.001 }; } });
    const grain = new THREE.SphereGeometry(0.06, 6, 4);
    for (let k = 0; k < 8; k++) moving.push({ geo: part(grain, GOLD[k % 4]), pivot: [-0.1, 2.35, -1.75], parent: comb, anim: (t) => {
      const u = cyc(t, 0.6, k / 8), f = F(t), on = f > 0.12 && f < 0.72 ? 1 : 0;
      return { y: -u * u * 0.6, x: Math.sin(k * 2.1) * 0.04, z: Math.cos(k * 1.3) * 0.04, s: on * (1 - u * 0.4) + 0.001 };
    } });
    // Chaff puffing out behind the combine.
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.2, 8, 6), '#e8d7a8'), pivot: [-1.6, 0.8, 0], parent: comb, anim: (t) => { const u = cyc(t, 1.1, k / 3); return { x: -u * 0.9, y: u * 0.5, s: (1 - u) * 1.1 + 0.001 }; } });
    // The truck at the pit: its bed tips and grain slides out; the grain rides up the leg.
    const tk = moving.length, TX = LX + 0.1, TZ = LZ + 2.9;
    moving.push({ geo: merge(part(rbox(0.9, 0.85, 1.0, 0.1), K.white, { p: [0, 0.75, 1.3] }), part(box(0.05, 0.3, 0.8), '#26323f', { p: [0, 0.95, 1.81] }).rotateY(0), part(rbox(1.0, 0.2, 2.6, 0.04), K.dark, { p: [0, 0.38, 0.2] }),
      [[0.45, 1.3], [-0.45, 1.3], [0.45, -0.4], [-0.45, -0.4], [0.45, -0.85], [-0.45, -0.85]].map(([x, z]) => part(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 14), '#1d1f24', { p: [x, 0.24, z], r: [0, 0, Math.PI / 2] }))),
      pivot: [TX, y0, TZ], anim: () => ({}) });
    moving.push({ geo: merge(part(rbox(1.0, 0.6, 1.9, 0.05), 'B', { p: [0, 0.3, -0.95] }), part(box(0.9, 0.06, 1.8), '#e9c46a', { p: [0, 0.62, -0.95] })), pivot: [0, 0.5, 0.0], parent: tk, anim: (t) => { const f = cyc(t, 6); return { rx: 0.5 * easeIO(win(f, 0.1, 0.35)) * (1 - easeIO(win(f, 0.7, 0.9))) }; } });
    for (let k = 0; k < 6; k++) moving.push({ geo: part(grain, GOLD[k % 4]), pivot: [TX, y0 + 0.6, TZ - 1.9], anim: (t) => { const f = cyc(t, 6), u = cyc(t, 0.5, k / 6), on = f > 0.3 && f < 0.75; return { y: -u * 0.5, z: u * 0.1, s: on ? 1.3 : 0.001 }; } });
    for (let k = 0; k < 10; k++) moving.push({ geo: part(grain, GOLD[k % 4], { s: 1.4 }), pivot: [LX + 0.32, y0 + 0.3, LZ + 0.32], anim: (t) => { const u = cyc(t, 2.4, k / 10); return { y: u * (LH - 0.3), s: Math.min(1, u * 20, (1 - u) * 20) }; } });
    // And pours from the spout into the nearest bin.
    const [bx, bz, btop] = spouts[2];
    for (let k = 0; k < 5; k++) moving.push({ geo: part(grain, GOLD[k % 4]), pivot: [bx, btop + 0.15, bz], anim: (t) => { const u = cyc(t, 0.7, k / 5); return { y: -u * 0.6, s: (1 - u) + 0.001 }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.7, y0, -0.9], topAt: [BX, y0 + 3.12, BZ] };
  },

  // Machine shop (industrial automation, components, conglomerates): blanks ride the conveyor into
  // a CNC cell and come out finished gears; a robot arm lifts each one into a crate; a mobile
  // robot hauls full crates past the racking to the trailer at the dock, and the big gear on the
  // hall roof turns.
  'industrial:0': () => {
    const R = rand(404), out = [], moving = [];
    out.push(slab('#b4b7bb'));
    // ---- the hall: sawtooth roof with north lights, roller door, brand stripe
    const HX = -2.0, HZ = -3.7, HW = 5.6, HD = 2.4, HH = 2.4;
    out.push(part(rbox(HW, HH, HD, 0.05), '#e3e0da', { p: [HX, y0 + HH / 2, HZ] }), part(box(HW + 0.02, 0.3, HD + 0.02), 'A', { p: [HX, y0 + HH - 0.35, HZ] }));
    for (let i = 0; i < 4; i++) {
      const x = HX - HW / 2 + 0.7 + i * 1.4;
      out.push(part(extrude([[-0.7, 0], [0.7, 0], [0.7, 0.75], [0.5, 0.75]], HD), '#9aa1a9', { p: [x, y0 + HH, HZ] }), part(box(0.04, 0.6, HD - 0.1), '#9fcdea', { p: [x + 0.67, y0 + HH + 0.38, HZ] }));
    }
    out.push(part(rbox(1.5, 1.7, 0.06, 0.03), '#c9ced6', { p: [HX + 1.6, y0 + 0.85, HZ + HD / 2 + 0.02] }));
    if (hi()) for (let i = 0; i < 8; i++) out.push(part(box(1.46, 0.02, 0.07), '#aab3bc', { p: [HX + 1.6, y0 + 0.1 + i * 0.21, HZ + HD / 2 + 0.04] }));
    [-2.2, -1.2, -0.2].forEach((dx) => out.push(part(rbox(0.6, 0.5, 0.06, 0.03), '#9fcdea', { p: [HX + dx, y0 + 1.3, HZ + HD / 2 + 0.02] })));
    // Painted lanes on the floor.
    const lane = (pts) => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); out.push(part(box(L, 0.012, 0.07), '#f2c94c', { p: [(a[0] + b[0]) / 2, y0 + 0.006, (a[1] + b[1]) / 2], r: [0, -Math.atan2(b[1] - a[1], b[0] - a[0]), 0] })); } };
    lane([[-4.9, 1.6], [2.0, 1.6]]); lane([[-4.9, 4.9], [2.0, 4.9]]);
    // ---- the line: stock rack, conveyor, the CNC cell and its stack light
    const CZ = 0.3, TOPY = y0 + 0.9, X0 = -4.6, X1 = 1.5;
    out.push(part(box(X1 - X0, 0.08, 0.95), '#3a3f47', { p: [(X0 + X1) / 2, TOPY - 0.04, CZ] }));
    [CZ - 0.5, CZ + 0.5].forEach((z) => out.push(part(new THREE.BoxGeometry(X1 - X0, 0.16, 0.07), '#9aa1a9', { p: [(X0 + X1) / 2, TOPY - 0.06, z] })));
    for (let x = X0 + 0.1; x <= X1; x += 0.85) [CZ - 0.45, CZ + 0.45].forEach((z) => out.push(part(new THREE.BoxGeometry(0.08, 0.82, 0.08), '#7d8792', { p: [x, y0 + 0.41, z] })));
    out.push(part(rbox(1.0, 0.55, 1.0, 0.04), '#7d8792', { p: [-4.3, y0 + 0.28, CZ - 1.25] }));
    for (let i = 0; i < 6; i++) out.push(part(cyl(0.28, 0.28, 0.16, 20), '#8e959e', { p: [-4.55 + (i % 3) * 0.26, y0 + 0.64 + Math.floor(i / 3) * 0.17, CZ - 1.25 + (i % 2) * 0.32] }));
    const MX = -2.0;
    out.push(part(rbox(1.8, 2.0, 1.6, 0.1), '#eef0f2', { p: [MX, y0 + 1.0, CZ] }), part(rbox(1.82, 0.26, 1.62, 0.07), 'A', { p: [MX, y0 + 1.85, CZ] }), part(rbox(1.1, 0.7, 0.05, 0.03), '#2a3c50', { p: [MX - 0.15, y0 + 1.15, CZ + 0.81] }), part(rbox(0.3, 0.5, 0.06, 0.03), K.dark, { p: [MX + 0.62, y0 + 1.2, CZ + 0.81] }));
    if (hi()) [[0.55, 1.35, '#e5533d'], [0.68, 1.35, '#5fae5b'], [0.55, 1.05, '#f2c94c']].forEach(([x, y, c]) => out.push(part(cyl(0.035, 0.035, 0.03, 10), c, { p: [MX + x, y0 + y, CZ + 0.85], r: [Math.PI / 2, 0, 0] })));
    out.push(part(cyl(0.05, 0.05, 0.4, 8), K.dark, { p: [MX + 0.65, y0 + 2.2, CZ - 0.55] }));
    [['#e5533d', 0], ['#f2c94c', 1], ['#5fae5b', 2]].forEach(([c, i]) => out.push(part(cyl(0.09, 0.09, 0.14, 12), shade(c, 0.6), { p: [MX + 0.65, y0 + 2.45 + i * 0.15, CZ - 0.55] })));
    // ---- the robot cell: pedestal, control cabinet, fence posts, the crate being filled
    const RX = 1.3, RZ = -1.1, SY = y0 + 1.1, L1 = 1.45, L2 = 1.3, PICK = new V(1.1, TOPY + 0.14, CZ), PLACE = new V(3.1, y0 + 0.8, RZ);
    out.push(part(cyl(0.45, 0.55, 0.6, 24), '#3a3f47', { p: [RX, y0 + 0.3, RZ] }), part(rbox(1.2, 0.04, 1.2, 0.02), '#f2c94c', { p: [RX, y0 + 0.02, RZ] }));
    out.push(part(rbox(0.8, 1.5, 0.5, 0.05), '#d8dde3', { p: [RX + 0.3, y0 + 0.75, RZ - 1.6] }), part(rbox(0.55, 0.35, 0.05, 0.02), '#2a3c50', { p: [RX + 0.3, y0 + 1.1, RZ - 1.33] }));
    const crate = (c = '#3d7be0') => merge(part(rbox(1.3, 0.14, 1.1, 0.02), '#a37b4f', { p: [0, 0.07, 0] }), part(rbox(1.2, 0.55, 1.0, 0.04), c, { p: [0, 0.42, 0] }), part(box(1.1, 0.04, 0.9), shade(c, 0.7), { p: [0, 0.68, 0] }));
    const done = place(part(gear(0.3, 12, 0.14, 0.25), 'B'), { r: [Math.PI / 2, 0, 0] }), blank = part(cyl(0.3, 0.3, 0.16, 20), '#8e959e');
    const full = (c) => merge(crate(c), [[-0.3, -0.2], [0.3, -0.2], [0, 0.22], [-0.35, 0.25], [0.35, 0.2]].map(([x, z]) => place(done, { p: [x, 0.74, z] })));
    out.push(place(crate(), { p: [PLACE.x, y0, PLACE.z] }));
    [[0, 0.22], [0.3, -0.2], [-0.3, -0.2]].forEach(([x, z]) => out.push(place(done, { p: [PLACE.x + x, y0 + 0.74, PLACE.z + z] })));
    if (hi()) [[RX - 1.0, RZ + 0.85], [PLACE.x + 0.9, RZ + 0.85], [PLACE.x + 0.9, RZ - 1.0]].forEach(([x, z]) => out.push(part(new THREE.BoxGeometry(0.07, 1.1, 0.07), '#f2c94c', { p: [x, y0 + 0.55, z] })));
    // ---- racking at the front left, full crates waiting at the dock, the trailer
    const KX = -2.9, KZ = 3.4;
    [-1.5, 0, 1.5].forEach((dx) => [-0.55, 0.55].forEach((dz) => out.push(part(new THREE.BoxGeometry(0.08, 2.0, 0.08), '#2a5bb0', { p: [KX + dx * 1.0, y0 + 1.0, KZ + dz] }))));
    [0.75, 1.65].forEach((y) => [-0.55, 0.55].forEach((dz) => out.push(part(new THREE.BoxGeometry(3.1, 0.1, 0.08), K.orange, { p: [KX, y0 + y, KZ + dz] }))));
    [[-0.75, 0], [0.75, 0], [-0.75, 1], [0.75, 1]].forEach(([dx, l], i) => out.push(place(i % 3 ? full('#3d7be0') : crate('#5fae5b'), { p: [KX + dx, y0 + (l ? 1.7 : 0.05), KZ], s: [0.95, 0.95, 0.85] })));
    out.push(place(full('#3d7be0'), { p: [KX - 0.75, y0 + 0.8, KZ], s: [0.95, 0.95, 0.85] }));
    const TX = 3.5, TZ = 2.45;
    out.push(part(rbox(1.6, 0.18, 2.9, 0.04), '#5b616b', { p: [TX, y0 + 0.62, TZ] }), part(box(1.62, 0.12, 2.9), 'A', { p: [TX, y0 + 0.5, TZ] }));
    out.push(part(rbox(1.6, 1.25, 1.1, 0.12), 'A', { p: [TX, y0 + 1.05, TZ + 2.05] }), part(rbox(1.3, 0.5, 0.05, 0.04), '#2a3c50', { p: [TX, y0 + 1.35, TZ + 2.61] }), part(rbox(1.62, 0.16, 1.12, 0.04), 'Ad', { p: [TX, y0 + 0.5, TZ + 2.05] }), part(box(1.2, 0.08, 0.05), '#fff2c6', { p: [TX, y0 + 0.62, TZ + 2.62] }));
    [[-0.8, TZ - 1.0], [0.8, TZ - 1.0], [-0.8, TZ - 0.3], [0.8, TZ - 0.3], [-0.8, TZ + 2.1], [0.8, TZ + 2.1]].forEach(([x, z]) => out.push(part(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 18), '#1d1f24', { p: [TX + x, y0 + 0.3, z], r: [0, 0, Math.PI / 2] }), part(new THREE.CylinderGeometry(0.16, 0.16, 0.23, 12), K.steel, { p: [TX + x, y0 + 0.3, z], r: [0, 0, Math.PI / 2] })));
    out.push(place(full('#3d7be0'), { p: [TX, y0 + 0.7, TZ - 0.8], s: 0.95 }), place(full('#5fae5b'), { p: [TX, y0 + 0.7, TZ + 0.4], s: 0.95 }));
    // ---- moving parts
    const P = 6, F = (t) => cyc(t, P);
    // The big gear sign on the roof and its partner, meshing.
    const G1 = new V(HX - 0.8, y0 + HH + 0.75 + 1.3, HZ + 0.2), r1 = 1.25, r2 = 0.78;
    out.push(part(box(0.22, 1.4, 0.22), '#7d8792', { p: [G1.x, y0 + HH + 0.75 + 0.5, G1.z - 0.25] }), part(box(0.22, 1.0, 0.22), '#7d8792', { p: [G1.x + r1 + r2 - 0.1, y0 + HH + 0.75 + 0.3, G1.z - 0.25] }));
    moving.push({ geo: merge(part(gear(r1, 16, 0.3, 0.22), 'A'), part(cyl(0.3, 0.3, 0.36, 20), K.dark, { r: [Math.PI / 2, 0, 0] }), ring(4, (a) => part(box(0.12, r1 * 0.55, 0.32), 'Ad', { p: [Math.cos(a) * r1 * 0.45, Math.sin(a) * r1 * 0.45, 0], r: [0, 0, a - Math.PI / 2] }))), pivot: G1.toArray(), anim: (t) => ({ rz: t * 0.5 }) });
    moving.push({ geo: merge(part(gear(r2, 10, 0.26, 0.25), K.steel), part(cyl(0.2, 0.2, 0.32, 16), K.dark, { r: [Math.PI / 2, 0, 0] })), pivot: [G1.x + r1 + r2 - 0.1, G1.y - 0.4, G1.z], anim: (t) => ({ rz: -t * 0.5 * (16 / 10) + 0.2 }) });
    // Each part spends two cycles on the line: conveyor to the cell, machining, out to the pick
    // point, then up in the gripper and over to the crate. Two are on the line at once.
    const onBelt = (u) => (u < 0.25 ? X0 + 0.2 + (MX - X0 - 0.2) * easeIO(u / 0.25) : u < 0.4 ? MX : u < 0.675 ? MX + (PICK.x - MX) * easeIO(win(u, 0.4, 0.675)) : PICK.x);
    // The arm's wrist through a cycle: hover, down, grip, up, over, down, release, back.
    const hover = (p) => p.clone().add(new V(0, 0.6, 0));
    const keys = [[0, hover(PICK)], [0.3, hover(PICK)], [0.36, PICK], [0.42, PICK], [0.48, hover(PICK)], [0.62, hover(PLACE)], [0.68, PLACE], [0.72, PLACE], [0.78, hover(PLACE)], [0.95, hover(PICK)], [1, hover(PICK)]];
    const wrist = (f) => { for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return keys[i - 1][1].clone().lerp(keys[i][1], easeIO(win(f, keys[i - 1][0], keys[i][0]))); return hover(PICK); };
    // Turn a wrist target into the arm's joints; the hand stays pointing straight down.
    const HAND = 0.5;
    const pose = (f) => { const w = wrist(f), dx = w.x - RX, dz = w.z - RZ, j = reach2(Math.hypot(dx, dz), w.y + HAND - SY, L1, L2); return { yaw: Math.atan2(-dz, dx), s: j.s, e: j.e, wr: -Math.PI / 2 - j.s - j.e }; };
    const base = moving.length;
    moving.push({ geo: merge(part(cyl(0.42, 0.46, 0.3, 24), 'A', { p: [0, 0.15, 0] }), part(rbox(0.55, 0.4, 0.55, 0.08), 'Ad', { p: [0, 0.45, 0] })), pivot: [RX, y0 + 0.6, RZ], anim: (t) => ({ ry: pose(F(t)).yaw }) });
    moving.push({ geo: merge(part(cyl(0.24, 0.24, 0.6, 18), K.dark, { r: [Math.PI / 2, 0, 0] }), part(rbox(L1, 0.34, 0.36, 0.12), 'A', { p: [L1 / 2, 0, 0] })), pivot: [0, SY - y0 - 0.6, 0], parent: base, anim: (t) => ({ rz: pose(F(t)).s }) });
    moving.push({ geo: merge(part(cyl(0.19, 0.19, 0.5, 16), K.dark, { r: [Math.PI / 2, 0, 0] }), part(rbox(L2, 0.26, 0.28, 0.1), 'A', { p: [L2 / 2, 0, 0] })), pivot: [L1, 0, 0], parent: base + 1, anim: (t) => ({ rz: pose(F(t)).e }) });
    moving.push({ geo: merge(part(cyl(0.13, 0.13, 0.34, 14), K.dark, { r: [Math.PI / 2, 0, 0] }), part(rbox(0.32, 0.18, 0.22, 0.05), K.steelDk, { p: [0.2, 0, 0] }), [-0.1, 0.1].map((z) => part(box(0.16, 0.05, 0.05), K.steel, { p: [0.42, 0, z] }))), pivot: [L2, 0, 0], parent: base + 2, anim: (t) => ({ rz: pose(F(t)).wr }) });
    // The parts: a raw blank until the cell has cut it, then a finished gear.
    for (let k = 0; k < 2; k++) {
      const u = (t) => cyc(t, 2 * P, k * 0.5);
      const at = (t) => { const uu = u(t), f = (uu - 0.5) * 2; return uu < 0.68 ? new V(onBelt(uu), TOPY + 0.08, CZ) : f < 0.72 ? wrist(Math.max(f, 0.36)).add(new V(0, -0.12, 0)) : PLACE.clone().add(new V(0, -0.12, 0)); };
      moving.push({ geo: blank, pivot: [0, 0, 0], anim: (t) => { const p = at(t), uu = u(t); return { x: p.x, y: p.y, z: p.z, s: uu < 0.33 ? Math.min(1, uu / 0.02) : 0.001 }; } });
      moving.push({ geo: done, pivot: [0, 0, 0], anim: (t) => { const p = at(t), uu = u(t); return { x: p.x, y: p.y, z: p.z, s: uu >= 0.33 ? 1 - win(uu, 0.93, 0.99) + 0.001 : 0.001 }; } });
    }
    // Inside the cell: the spindle spins and sparks fly while it cuts.
    const cutting = (t) => [0, 0.5].some((o) => { const a = cyc(t, 2 * P, o); return a > 0.26 && a < 0.39; });
    moving.push({ geo: merge(part(cyl(0.14, 0.14, 0.6, 14), K.steelDk), part(cone(0.06, 0.24, 10), K.gold, { p: [0, -0.42, 0], r: [Math.PI, 0, 0] })), pivot: [MX, TOPY + 0.75, CZ], anim: (t) => ({ ry: t * 30, y: cutting(t) ? -0.15 : 0 }) });
    for (let k = 0; k < 8; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.04, 5, 3), '#ffcf5a'), pivot: [MX, TOPY + 0.2, CZ + 0.3], anim: (t) => { const u = cyc(t, 0.4, k / 8), a = k * 0.8; return { x: Math.cos(a) * u * 0.6, y: hop(u) * 0.3, z: Math.abs(Math.sin(a)) * u * 0.45, s: cutting(t) ? 1 - u : 0.001 }; } });
    moving.push({ geo: part(cyl(0.095, 0.095, 0.15, 12), '#62d35f'), pivot: [MX + 0.65, y0 + 2.75, CZ - 0.55], anim: (t) => ({ s: Math.floor(t * 2) % 2 ? 1 : 0.001 }) });
    // The mobile robot: from the cell to the racking, along the front to the trailer, and back.
    const loop = curve([[2.3, 0, 0.9], [0.0, 0, 2.2], [-2.9, 0, 2.3], [-4.4, 0, 2.6], [-2.9, 0, 2.9], [0.2, 0, 3.0], [2.0, 0, 2.3]], true);
    moving.push({ geo: merge(part(rbox(1.1, 0.24, 0.8, 0.08), '#f4f5f6', { p: [0, 0.17, 0] }), part(box(1.12, 0.05, 0.82), 'A', { p: [0, 0.22, 0] }), part(cyl(0.05, 0.05, 0.04, 10), '#62d35f', { p: [0.45, 0.31, 0.25] }), place(full('#3d7be0'), { p: [0, 0.3, 0], s: 0.75 })),
      pivot: [0, y0, 0], anim: (t) => { const { p, ry } = along(loop, cyc(t, 14)); return { x: p.x, z: p.z, ry }; } });
    // A forklift lifts a crate into the racking and lowers again.
    const fk = moving.length;
    moving.push({ geo: merge(part(rbox(1.0, 0.5, 0.75, 0.08), K.orange, { p: [-0.1, 0.45, 0] }), part(rbox(0.5, 0.06, 0.7, 0.03), K.dark, { p: [-0.2, 1.4, 0] }), [[-0.4, 0.3], [0.2, 0.3], [-0.4, -0.3], [0.2, -0.3]].map(([x, z]) => beam([x, 0.7, z], [x * 0.7, 1.4, z], 0.04, K.dark)), part(rbox(0.4, 0.4, 0.5, 0.06), K.dark, { p: [-0.55, 0.85, 0] }),
      [[0.25, 0.3], [-0.4, 0.3], [0.25, -0.3], [-0.4, -0.3]].map(([x, z]) => part(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 14), '#1d1f24', { p: [x, 0.17, z], r: [Math.PI / 2, 0, 0] })), part(box(0.08, 1.9, 0.6), K.steelDk, { p: [0.48, 0.95, 0] })),
      pivot: [KX + 0.75, y0, KZ - 1.6], anim: (t) => { const f = cyc(t, 8); return { z: 0.5 * easeIO(win(f, 0.05, 0.2)) - 0.5 * easeIO(win(f, 0.75, 0.9)), ry: Math.PI / 2 }; } });
    moving.push({ geo: merge(part(box(0.6, 0.04, 0.12), K.steelDk, { p: [0.3, 0, -0.18] }), part(box(0.6, 0.04, 0.12), K.steelDk, { p: [0.3, 0, 0.18] }), place(full('#5fae5b'), { p: [0.45, 0.02, 0], s: [0.65, 0.75, 0.65] })), pivot: [0.5, 0.15, 0], parent: fk, anim: (t) => { const f = cyc(t, 8); return { y: 1.45 * easeIO(win(f, 0.25, 0.45)) * (1 - easeIO(win(f, 0.55, 0.7))) }; } });
    moving.push(...walker(moving.length, (t) => { const k = Math.sin(t * 0.45); return { x: -0.4 + k * 1.3, z: 1.25, ry: Math.cos(t * 0.45) > 0 ? 0 : Math.PI }; }, { shirt: '#f2994a', pants: '#2b3a55', y: y0 }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [3.7, y0, -3.7], topAt: [HX + 1.8, y0 + HH + 0.75, HZ] };
  },

  // Steelworks (steel, aluminium, mining, metals service): a mini-mill turns scrap into steel. A
  // magnet crane drops scrap into the arc furnace, its electrodes sparking; the overhead crane
  // carries the glowing ladle to the caster and pours; a red-hot strand rolls out, a torch cuts it
  // into slabs that cool from orange to grey; a flatcar of coils rolls along the front.
  'metal:0': () => {
    const R = rand(505), out = [], moving = [], HOT = '#ff8a2a', HOTTER = '#ffc04a', MOLTEN = '#ffdd73';
    out.push(slab('#9d9a94'));
    // ---- the scrap pile at the back left
    const SX = -3.5, SZ = -3.3, rust = ['#8a5a3a', '#a0673f', '#6f6a64', '#8e959e', '#7a4a32', '#5b616b'];
    out.push(part(lathe([[1.7, 0], [1.4, 0.4], [0.9, 0.9], [0.3, 1.25], [0, 1.3]], 24), '#6f5a48', { p: [SX, y0, SZ] }));
    const junk = () => { const k = R(), c = rust[Math.floor(R() * rust.length)]; return k < 0.4 ? part(box(0.3 + R() * 0.5, 0.08 + R() * 0.15, 0.2 + R() * 0.3), c) : k < 0.7 ? part(cyl(0.08 + R() * 0.1, 0.08 + R() * 0.1, 0.4 + R() * 0.6, 8), c) : beam([0, 0, 0], [0.6 + R() * 0.6, 0, 0], 0.07, c); };
    for (let i = 0, n = hi() ? 70 : 18; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 1.5, h = (1 - d / 1.7) * 1.25; out.push(place(junk(), { p: [SX + Math.cos(a) * d, y0 + h, SZ + Math.sin(a) * d], r: [R() * 3, R() * 3, R() * 3] })); }
    // ---- the melt shop: an open steel shed over the furnace and caster
    const X0 = -1.8, X1 = 4.7, Z0 = -4.8, Z1 = -1.5, SH = 4.0;
    [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1], [(X0 + X1) / 2, Z0], [(X0 + X1) / 2, Z1]].forEach(([x, z]) => out.push(part(rbox(0.25, SH, 0.25, 0.04), '#7d8792', { p: [x, y0 + SH / 2, z] })));
    [Z0, Z1].forEach((z) => out.push(part(box(X1 - X0 + 0.3, 0.3, 0.3), '#6d7681', { p: [(X0 + X1) / 2, y0 + SH - 0.15, z] })));
    // Roof trusses only, so the furnace and ladle show; the front girder carries the brand.
    for (let x = X0; x <= X1 + 1e-3; x += (X1 - X0) / 4) out.push(beam([x, y0 + SH, Z0], [x, y0 + SH + 0.7, (Z0 + Z1) / 2], 0.1, '#6d7681'), beam([x, y0 + SH + 0.7, (Z0 + Z1) / 2], [x, y0 + SH, Z1], 0.1, '#6d7681'));
    out.push(part(box(X1 - X0 + 0.3, 0.12, 0.12), '#6d7681', { p: [(X0 + X1) / 2, y0 + SH + 0.7, (Z0 + Z1) / 2] }), part(box(X1 - X0 + 0.32, 0.34, 0.08), 'A', { p: [(X0 + X1) / 2, y0 + SH - 0.15, Z1 + 0.17] }));
    out.push(part(box(X1 - X0 - 0.2, 1.6, 0.1), '#b9bec5', { p: [(X0 + X1) / 2, y0 + 0.8, Z0] }));
    // Crane rails along the shed, under its roof.
    [Z0 + 0.15, Z1 - 0.15].forEach((z) => out.push(part(box(X1 - X0, 0.14, 0.14), K.steelDk, { p: [(X0 + X1) / 2, y0 + SH - 0.5, z] })));
    // Stacks behind the shed.
    [[0.4, -4.75], [1.4, -4.75]].forEach(([x, z]) => out.push(part(cyl(0.25, 0.32, 5.4, 18), '#c9ced6', { p: [x, y0 + 2.7, z] }), part(cyl(0.27, 0.27, 0.3, 18), 'A', { p: [x, y0 + 4.9, z] })));
    // ---- the arc furnace: a squat vessel, its roof, three electrodes
    const FX = -0.5, FZ = -3.2;
    out.push(part(cyl(1.2, 1.2, 0.3, 28), '#3a3f47', { p: [FX, y0 + 0.15, FZ] }), part(lathe([[0.8, 0], [1.0, 0.15], [1.05, 0.9], [1.0, 1.0], [0, 1.0]], 32), 'A', { p: [FX, y0 + 0.3, FZ] }), part(lathe([[1.05, 0], [0.9, 0.3], [0.4, 0.5], [0, 0.52]], 32), '#7d8792', { p: [FX, y0 + 1.3, FZ] }));
    out.push(part(rbox(0.5, 0.25, 0.6, 0.05), '#3a3f47', { p: [FX + 1.05, y0 + 0.9, FZ], r: [0, 0, -0.3] }));
    ring(3, (a) => out.push(part(box(0.12, 0.12, 1.5), '#5b616b', { p: [FX - 0.9, y0 + 2.6, FZ + Math.sin(a) * 0.3], r: [0, Math.PI / 2 - a * 0.1, 0] })));
    out.push(part(rbox(0.5, 2.6, 0.5, 0.05), '#5b616b', { p: [FX - 1.5, y0 + 1.3, FZ] }));
    // ---- the caster: tundish, mould, the curved strand and the run-out table
    const CX = 2.8, CZ = -2.9, TY = y0 + 1.9;
    out.push(part(rbox(1.1, 0.5, 0.8, 0.06), '#5b616b', { p: [CX, TY, CZ] }), part(box(0.9, 0.05, 0.6), MOLTEN, { p: [CX, TY + 0.25, CZ] }), part(rbox(1.5, 0.15, 1.2, 0.04), '#3a3f47', { p: [CX, TY - 0.32, CZ] }));
    [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]].forEach(([x, z]) => out.push(part(box(0.14, TY - 0.4 - y0, 0.14), '#7d8792', { p: [CX + x, y0 + (TY - 0.4 - y0) / 2, CZ + z] })));
    const strand = curve([[CX, TY - 0.3, CZ], [CX, TY - 1.0, CZ + 0.15], [CX, y0 + 0.75, CZ + 0.9], [CX, y0 + 0.62, CZ + 1.6]]);
    out.push(part(new THREE.TubeGeometry(strand, hi() ? 40 : 10, 0.16, hi() ? 4 : 4, false), (x, y) => (y > TY - 0.9 ? HOTTER : HOT)));
    const RZ0 = CZ + 1.6, RZ1 = 3.0;
    for (let z = RZ0; z <= RZ1; z += 0.3) out.push(part(new THREE.CylinderGeometry(0.08, 0.08, 0.9, hi() ? 12 : 6), K.steelDk, { p: [CX, y0 + 0.5, z], r: [0, 0, Math.PI / 2] }));
    [-0.5, 0.5].forEach((x) => out.push(part(new THREE.BoxGeometry(0.08, 0.5, RZ1 - RZ0 + 0.3), '#5b616b', { p: [CX + x, y0 + 0.3, (RZ0 + RZ1) / 2] })));
    // The strand is continuous up to the torch.
    const CUT = 0.3;
    out.push(part(new THREE.BoxGeometry(0.7, 0.14, CUT - RZ0), HOT, { p: [CX, y0 + 0.65, (RZ0 + CUT) / 2] }));
    out.push(part(rbox(1.2, 0.5, 0.3, 0.05), '#f2c94c', { p: [CX, y0 + 1.25, CUT] }), [-0.6, 0.6].map((x) => part(box(0.1, 1.0, 0.1), '#f2c94c', { p: [CX + x, y0 + 0.75, CUT] })));
    // Finished slabs stacked, coils and beams waiting at the front left.
    for (let i = 0; i < 5; i++) out.push(part(rbox(0.75, 0.14, 1.1, 0.03), i % 2 ? '#8e959e' : '#7d8792', { p: [CX + 1.4, y0 + 0.07 + i * 0.15, 2.6 + (i % 2) * 0.04] }));
    const coil = (c = '#a9b1bb', face = c === 'B' ? 'Bd' : shade(c, 0.85)) => merge(part(new THREE.CylinderGeometry(0.5, 0.5, 0.6, hi() ? 32 : 12, 1, true), c, { r: [Math.PI / 2, 0, 0] }), part(new THREE.CylinderGeometry(0.22, 0.22, 0.6, hi() ? 24 : 8, 1, true), '#6d7681', { r: [Math.PI / 2, 0, 0] }), part(new THREE.RingGeometry(0.22, 0.5, hi() ? 32 : 12), face, { p: [0, 0, 0.3] }), part(new THREE.RingGeometry(0.22, 0.5, hi() ? 32 : 12), face, { p: [0, 0, -0.3], r: [0, Math.PI, 0] }));
    [[-3.9, 1.0], [-2.8, 1.0], [-3.35, 1.0]].forEach(([x, z], i) => out.push(place(coil(i % 2 ? '#b5bcc6' : 'B'), { p: [x, y0 + (i === 2 ? 1.25 : 0.5), z] })));
    const ibeam = (L) => merge(part(box(L, 0.05, 0.3), '#7d8792', { p: [0, 0.025, 0] }), part(box(L, 0.05, 0.3), '#7d8792', { p: [0, 0.375, 0] }), part(box(L, 0.3, 0.05), '#6d7681', { p: [0, 0.2, 0] }));
    for (let i = 0; i < 6; i++) out.push(place(ibeam(2.6), { p: [-1.0, y0 + Math.floor(i / 3) * 0.4, 1.2 + (i % 3) * 0.4 + Math.floor(i / 3) * 0.2] }));
    // The rail along the front edge.
    out.push(part(box(10.4, 0.06, 1.3), '#7a6a5a', { p: [0, y0 + 0.03, 4.3] }));
    if (hi()) for (let x = -5.0; x <= 5.0; x += 0.4) out.push(part(box(0.14, 0.05, 1.2), '#6b4a32', { p: [x, y0 + 0.08, 4.3] }));
    [3.85, 4.75].forEach((z) => out.push(part(new THREE.BoxGeometry(10.4, 0.08, 0.07), K.steel, { p: [0, y0 + 0.14, z] })));
    // ---- moving parts
    const P = 10, F = (t) => cyc(t, P);
    // The magnet crane: a crawler with a lattice boom, swinging scrap from the pile to the furnace.
    const MX = -2.1, MZ = -1.2, REACH = 2.35, BOOM = 3.4;
    const pickYaw = Math.atan2(-(SZ + 0.2 - MZ), SX + 0.3 - MX), dropYaw = Math.atan2(-(FZ - MZ), FX - MX);
    const myaw = (f) => pickYaw + (dropYaw - pickYaw) * (easeIO(win(f, 0.18, 0.38)) - easeIO(win(f, 0.55, 0.75)));
    out.push(part(rbox(1.6, 0.35, 1.3, 0.08), '#2b2f36', { p: [MX, y0 + 0.2, MZ] }), [-0.55, 0.55].map((z) => part(rbox(1.8, 0.3, 0.3, 0.12), '#1d1f24', { p: [MX, y0 + 0.17, MZ + z] })));
    const tipOf = (f) => { const a = myaw(f); return new V(MX + Math.cos(a) * REACH, y0 + 0.4 + BOOM, MZ - Math.sin(a) * REACH); };
    const lattice = merge(beam([0, 0.6, 0], [REACH, BOOM, 0], 0.16, K.yellow), beam([0.1, 0.5, 0.18], [REACH, BOOM, 0], 0.06, '#e0b33a'), beam([0.1, 0.5, -0.18], [REACH, BOOM, 0], 0.06, '#e0b33a'), hi() ? ring(6, (a, i) => beam([0.15 + i * 0.35, 0.65 + i * 0.47, 0.12], [0.33 + i * 0.35, 0.9 + i * 0.47, -0.12], 0.03, '#e0b33a')) : []);
    moving.push({ geo: merge(part(rbox(1.1, 0.75, 0.95, 0.08), K.yellow, { p: [-0.2, 0.45, 0] }), part(rbox(0.5, 0.45, 0.6, 0.06), '#9fcdea', { p: [0.3, 0.75, 0.25] }), part(rbox(0.5, 0.55, 0.9, 0.06), '#3a3f47', { p: [-0.75, 0.4, 0] }), lattice).rotateY(pickYaw),
      pivot: [MX, y0 + 0.4, MZ], anim: (t) => ({ ry: myaw(F(t)) - pickYaw }) });
    const hang = (f) => 1.0 + 1.6 * hop(win(f, 0.03, 0.17)) + 0.9 * hop(win(f, 0.42, 0.5));
    moving.push({ geo: part(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), K.ink, { p: [0, -0.5, 0] }), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = tipOf(f); return { x: p.x, y: p.y, z: p.z, sy: hang(f) }; } });
    moving.push({ geo: merge(part(cyl(0.42, 0.42, 0.18, 24), '#3a3f47'), part(cyl(0.12, 0.12, 0.2, 10), K.ink, { p: [0, 0.18, 0] })), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = tipOf(f); return { x: p.x, y: p.y - hang(f) - 0.1, z: p.z }; } });
    const clump = merge(Array.from({ length: hi() ? 8 : 3 }, () => place(junk(), { p: [(R() - 0.5) * 0.5, -0.1 - R() * 0.2, (R() - 0.5) * 0.5], r: [R() * 3, R() * 3, R() * 3] })));
    moving.push({ geo: clump, pivot: [0, 0, 0], anim: (t) => {
      const f = F(t), p = tipOf(Math.min(f, 0.5)), held = f > 0.1 && f < 0.48, fall = win(f, 0.48, 0.56);
      return { x: p.x, y: p.y - hang(Math.min(f, 0.48)) - 0.2 - easeIn(fall) * 1.2, z: p.z, s: f < 0.1 ? 0.001 : f > 0.56 ? 0.001 : held || fall < 1 ? 1 : 0.001 };
    } });
    // Electrodes bob and arc; sparks spit from the roof.
    ring(3, (a, i) => moving.push({ geo: merge(part(cyl(0.11, 0.11, 1.6, 12), '#3a3f47'), part(cyl(0.12, 0.12, 0.08, 12), HOTTER, { p: [0, -0.8, 0] })), pivot: [FX + Math.cos(a) * 0.3, y0 + 2.1, FZ + Math.sin(a) * 0.3], anim: (t) => ({ y: Math.sin(t * 9 + i * 2) * 0.03 }) }));
    for (let k = 0; k < 8; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.04, 5, 3), k % 2 ? HOTTER : '#fff2b0'), pivot: [FX, y0 + 1.75, FZ], anim: (t) => { const u = cyc(t, 0.5, k / 8), a = k * 0.79; return { x: Math.cos(a) * u * 0.9, y: hop(u) * 0.7, z: Math.sin(a) * u * 0.9, s: 1 - u }; } });
    // The overhead crane's bridge and trolley carry the ladle from the furnace's spout to the tundish.
    const lx = (f) => FX + 1.5 + (CX - FX - 1.5) * (easeIO(win(f, 0.25, 0.45)) - easeIO(win(f, 0.72, 0.92)));
    const lift = (f) => 0.6 * (easeIO(win(f, 0.2, 0.26)) - easeIO(win(f, 0.45, 0.5))) + 0.6 * (easeIO(win(f, 0.7, 0.74)) - easeIO(win(f, 0.92, 0.98)));
    const bridge = moving.length;
    moving.push({ geo: merge(part(box(0.3, 0.3, Z1 - Z0 - 0.1), '#f2c94c', { p: [0, 0, 0] }), [Z0 + 0.15, Z1 - 0.15].map((z) => part(box(0.5, 0.2, 0.25), '#e0b33a', { p: [0, -0.1, z - (Z0 + Z1) / 2] }))), pivot: [0, y0 + SH - 0.35, (Z0 + Z1) / 2], anim: (t) => ({ x: lx(F(t)) }) });
    moving.push({ geo: merge(part(rbox(0.6, 0.3, 0.6, 0.05), '#3a3f47'), part(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), K.ink, { p: [-0.15, -0.6, 0] }), part(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), K.ink, { p: [0.15, -0.6, 0] })), pivot: [0, -0.2, CZ - (Z0 + Z1) / 2 + 0.1], parent: bridge, anim: () => ({}) });
    const ladle = merge(part(lathe([[0.4, 0], [0.55, 0.1], [0.62, 0.8], [0.66, 0.85], [0, 0.86]], 28), '#5b616b'), part(cyl(0.58, 0.58, 0.04, 24), MOLTEN, { p: [0, 0.84, 0] }), part(torus(0.62, 0.05, TAU, 28), HOT, { p: [0, 0.85, 0], r: [Math.PI / 2, 0, 0] }), [-1, 1].map((sx) => part(rbox(0.1, 0.5, 0.1, 0.03), '#3a3f47', { p: [sx * 0.66, 0.8, 0] })), part(box(1.4, 0.08, 0.1), '#3a3f47', { p: [0, 1.05, 0] }));
    moving.push({ geo: ladle, pivot: [0, -2.8, CZ - (Z0 + Z1) / 2 + 0.1], parent: bridge, anim: (t) => { const f = F(t); return { y: lift(f), rz: -0.9 * easeIO(win(f, 0.47, 0.53)) * (1 - easeIO(win(f, 0.64, 0.7))) }; } });
    // Tapping: a stream from the furnace into the ladle; pouring: from the ladle into the tundish.
    moving.push({ geo: part(cyl(0.07, 0.05, 1, 10), HOTTER, { p: [0, -0.5, 0] }), pivot: [FX + 1.35, y0 + 0.95, FZ + 0.25], anim: (t) => { const f = F(t); return { sy: 0.6, s: f > 0.04 && f < 0.2 ? 1 : 0.001 }; } });
    moving.push({ geo: part(cyl(0.07, 0.05, 1, 10), HOTTER, { p: [0, -0.5, 0] }), pivot: [CX - 0.6, TY + 0.95, CZ], anim: (t) => { const f = F(t); return { sy: 0.7, s: f > 0.52 && f < 0.66 ? 1 : 0.001 }; } });
    // The torch cuts the strand; slabs ride the table, cooling, onto the stack.
    for (let k = 0; k < 6; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.035, 5, 3), k % 2 ? '#ffe9a8' : HOTTER), pivot: [CX, y0 + 0.75, CUT], anim: (t) => { const u = cyc(t, 0.3, k / 6), a = k * 1.05; return { x: Math.cos(a) * u * 0.5, y: hop(u) * 0.35 - u * 0.2, z: Math.sin(a) * u * 0.3, s: 1 - u }; } });
    const SL = 0.85, hotSlab = part(box(0.7, 0.14, SL), HOT), coldSlab = part(box(0.7, 0.14, SL), '#8e959e'), warmSlab = part(box(0.7, 0.14, SL), '#c0643a');
    for (let k = 0; k < 3; k++) {
      const z = (t) => CUT + SL / 2 + cyc(t, 6, k / 3) * (RZ1 - CUT);
      const temp = (t) => (z(t) - CUT) / (RZ1 - CUT);
      [[hotSlab, 0, 0.4], [warmSlab, 0.4, 0.75], [coldSlab, 0.75, 1.01]].forEach(([g, a, b]) => moving.push({ geo: g, pivot: [CX, y0 + 0.65, 0], anim: (t) => { const k2 = temp(t); return { z: z(t), s: k2 >= a && k2 < b ? (k2 > 0.94 ? 1 - win(k2, 0.94, 1) : 1) : 0.001 }; } }));
    }
    // Smoke from the stacks.
    [[0.4, -4.75], [1.4, -4.75]].forEach(([x, z], i) => { for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.32, 10, 7), '#e6e3de'), pivot: [x, y0 + 5.3, z], anim: (t) => { const u = cyc(t, 3, k / 3 + i * 0.17); return { y: u * 1.0, x: u * 0.6, s: (0.6 + u) * (1 - u) * 1.6 + 0.001 }; } }); });
    // A flatcar of coils rolls along the front.
    moving.push({ geo: merge(part(rbox(3.0, 0.2, 1.0, 0.04), '#3a3f47', { p: [0, 0.55, 0] }), part(box(3.02, 0.12, 1.02), 'A', { p: [0, 0.4, 0] }), [-1.1, -0.8, 0.8, 1.1].flatMap((x) => [-0.45, 0.45].map((z) => part(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 14), '#1d1f24', { p: [x, 0.25, z], r: [Math.PI / 2, 0, 0] }))),
      [-0.8, 0.0, 0.8].map((x, i) => place(coil(i === 1 ? 'B' : '#b5bcc6'), { p: [x, 1.15, 0] }))),
      pivot: [0, y0, 4.3], anim: (t) => { const f = cyc(t, 14), x = -6.4 + 12.8 * f; return { x, s: clamp01((5.0 - Math.abs(x)) / 1.6) * 0.999 + 0.001 }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.6, y0, 2.6], topAt: [CX + 1.4, y0 + 0.82, 2.62] };
  },

  // Storage tank (pipelines, midstream): the toll road for energy. Product pulses down the
  // pipelines from the field into the tank farm, whose floating roofs rise and fall as tanks fill
  // and empty, and on along the rack to a tanker loading at the jetty; at the meter station a
  // coin pops up for every batch that passes.
  'oil:2': () => {
    const R = rand(606), out = [], moving = [], QX = 2.6, SEA = 0.14;
    // ---- land and a dock basin along the +x side, with live water
    out.push(part(rbox(QX + 5.2, 0.24, 10.4, 0.08), '#bab09c', { p: [(QX - 5.2) / 2, 0.12, 0] }), part(rbox(5.2 - QX, 0.1, 10.4, 0.05), '#2b4a7a', { p: [(QX + 5.2) / 2, 0.05, 0] }));
    out.push(part(new THREE.PlaneGeometry(5.2 - QX, 10.4).rotateX(-Math.PI / 2), 'W', { p: [(QX + 5.2) / 2, SEA, 0] }), part(box(0.2, 0.3, 10.4), '#9aa1a9', { p: [QX + 0.1, 0.15, 0] }));
    // Gravel bunds around the tank farm.
    const tanks = [[-3.6, -3.6, 1.15], [-1.0, -3.6, 1.15], [-3.6, -1.1, 1.0], [-1.0, -1.1, 1.0]], TH = 1.7;
    out.push(part(rbox(5.4, 0.12, 5.2, 0.05), '#b8b0a0', { p: [-2.3, y0 + 0.06, -2.35] }), part(rbox(5.0, 0.04, 4.8, 0.03), '#d7d0c0', { p: [-2.3, y0 + 0.14, -2.35] }));
    for (const [x, z, r] of tanks) {
      out.push(part(new THREE.CylinderGeometry(r, r, TH, hi() ? 48 : 16, hi() ? 6 : 1, true), (X, Y) => (Math.floor(Y * 3.2) % 2 ? '#f4f5f6' : '#e9ecef'), { p: [x, y0 + 0.14 + TH / 2, z] }));
      out.push(part(new THREE.CylinderGeometry(r * 0.98, r * 0.98, TH, hi() ? 48 : 16, 1, true), '#c9ced6', { p: [x, y0 + 0.14 + TH / 2, z], r: [Math.PI, 0, 0] }));
      out.push(part(torus(r, 0.04, TAU, 48), K.white, { p: [x, y0 + 0.14 + TH, z], r: [Math.PI / 2, 0, 0] }), part(new THREE.CylinderGeometry(r * 1.005, r * 1.005, 0.2, hi() ? 48 : 16, 1, true), 'A', { p: [x, y0 + 0.14 + TH * 0.72, z] }));
      // A spiral stair up the side.
      if (hi()) for (let k = 0; k < 8; k++) { const a = 0.6 + k * 0.16; out.push(part(box(0.22, 0.04, 0.1), K.steelDk, { p: [x + Math.cos(a) * (r + 0.07), y0 + 0.3 + k * 0.2, z + Math.sin(a) * (r + 0.07)], r: [0, -a, 0] })); }
    }
    // ---- pipes: from the field (front left) to the farm, the rack to the jetty, the meter station
    const PY = y0 + 0.5, RY = y0 + 1.05, pipeC = ['#d8a33a', 'B', '#9aa1a9'];
    const field = curve([[-3.0, PY, 5.1], [-3.0, PY, 2.2], [-3.0, PY, 1.0], [-2.3, PY, 0.4]]);
    const rack = curve([[-1.0, PY, -0.1], [-0.4, RY, 0.6], [1.2, RY, 0.6], [2.4, RY, 0.6], [3.0, RY + 0.2, 0.6]]);
    [-0.2, 0, 0.2].forEach((dz, i) => out.push(part(tubeOn(curve(field.points.map((p) => [p.x + dz, p.y, p.z])), 0.08), pipeC[i])));
    [-0.2, 0, 0.2].forEach((dz, i) => out.push(part(tubeOn(curve(rack.points.map((p) => [p.x, p.y, p.z + dz])), 0.08), pipeC[i])));
    // The rack's bents.
    for (let x = -0.2; x <= 2.6; x += 0.7) out.push(part(box(0.08, RY - y0, 0.08), K.steelDk, { p: [x, y0 + (RY - y0) / 2, 0.3] }), part(box(0.08, RY - y0, 0.08), K.steelDk, { p: [x, y0 + (RY - y0) / 2, 0.9] }), part(box(0.1, 0.08, 0.75), K.steelDk, { p: [x, RY - 0.12, 0.6] }));
    for (let z = 4.6; z > 1.0; z -= 0.9) out.push(part(rbox(0.8, 0.3, 0.2, 0.04), '#8e959e', { p: [-3.0, y0 + 0.15, z] }));
    // Manifold where the field pipes meet the farm.
    out.push(part(rbox(1.2, 0.5, 0.7, 0.05), '#d8dde3', { p: [-2.3, y0 + 0.25, 0.4] }));
    if (hi()) ring(4, (a, i) => out.push(part(torus(0.12, 0.03, TAU, 14), K.red, { p: [-2.7 + i * 0.27, y0 + 0.62, 0.4] })));
    // The meter station: a hut with its readout, on the rack, where the toll is taken.
    const MX = 1.2, MZ = 1.7;
    out.push(part(rbox(1.1, 1.0, 0.9, 0.06), K.white, { p: [MX, y0 + 0.5, MZ] }), part(prism(1.2, 0.35, 1.0), 'Ad', { p: [MX, y0 + 1.0, MZ], r: [0, Math.PI / 2, 0] }), part(rbox(0.6, 0.3, 0.04, 0.02), '#1d2a33', { p: [MX, y0 + 0.65, MZ + 0.46] }), part(box(0.5, 0.06, 0.05), '#62d35f', { p: [MX, y0 + 0.65, MZ + 0.47] }));
    out.push(part(cyl(0.18, 0.18, 0.5, 14), '#d8dde3', { p: [MX, RY - 0.25, 0.6] }), part(rbox(0.3, 0.2, 0.3, 0.04), 'A', { p: [MX, RY - 0.55, 0.6] }));
    // ---- the compressor station by the field line
    out.push(part(rbox(1.6, 1.1, 1.2, 0.06), '#e3e0da', { p: [-4.2, y0 + 0.55, 2.8] }), part(box(1.62, 0.18, 1.22), 'A', { p: [-4.2, y0 + 0.95, 2.8] }), part(rbox(0.5, 0.7, 0.06, 0.03), '#c9ced6', { p: [-4.2, y0 + 0.35, 3.41] }));
    // ---- the flare stack at the back
    out.push(part(cyl(0.12, 0.18, 4.0, 14), '#c9ced6', { p: [1.2, y0 + 2.0, -4.3] }), ring(3, (a) => beam([1.2 + Math.cos(a) * 0.7, y0, -4.3 + Math.sin(a) * 0.7], [1.2, y0 + 2.6, -4.3], 0.04, K.steelDk)), part(cyl(0.2, 0.2, 0.2, 14), 'A', { p: [1.2, y0 + 3.6, -4.3] }));
    // ---- the jetty and loading arm
    out.push(part(rbox(1.2, 0.18, 1.3, 0.04), '#b9b2a2', { p: [QX + 0.5, y0 + 0.3, 0.6] }), [[QX + 0.2, 0.1], [QX + 0.9, 0.1], [QX + 0.2, 1.1], [QX + 0.9, 1.1]].map(([x, z]) => part(cyl(0.06, 0.06, 0.5, 8), '#6d7681', { p: [x, 0.2, z] })));
    out.push(part(box(0.14, 1.3, 0.14), K.steelDk, { p: [QX + 0.7, y0 + 0.95, 0.6] }), beam([QX + 0.7, y0 + 1.6, 0.6], [QX + 1.4, y0 + 1.7, 0.6], 0.1, 'A'), beam([QX + 1.4, y0 + 1.7, 0.6], [QX + 1.55, y0 + 0.75, 0.6], 0.09, 'A'), part(tube([[3.0, RY + 0.2, 0.6], [QX + 0.6, RY + 0.4, 0.6], [QX + 0.7, y0 + 1.6, 0.6]], 0.07), K.steelDk));
    [[4.6, -4.4], [-4.6, 4.6], [-0.2, 4.4]].forEach(([x, z]) => out.push(miniTree(R, x < 2 ? x : x - 0.6, y0, z, 0.55 + R() * 0.2)));
    // ---- moving parts
    const P = 9, F = (t) => cyc(t, P);
    // Floating roofs: the two near the field fill while the two by the rack empty, then swap.
    tanks.forEach(([x, z, r], i) => moving.push({ geo: merge(part(cyl(r * 0.96, r * 0.96, 0.08, 40), '#c9ced6'), part(cyl(0.18, 0.18, 0.1, 12), K.steelDk, { p: [0, 0.06, 0] }), hi() ? part(torus(r * 0.6, 0.02, TAU, 32), '#aab3bc', { p: [0, 0.05, 0], r: [Math.PI / 2, 0, 0] }) : []),
      pivot: [x, y0 + 0.14, z], anim: (t) => { const k = (Math.sin((t / P) * TAU + (i % 2 ? Math.PI : 0)) + 1) / 2; return { y: 0.3 + k * (TH - 0.45) }; } }));
    // Batches pulsing down the field lines into the farm, along the rack, to the ship.
    const batch = (c) => merge(part(cyl(0.11, 0.11, 0.26, 14), c, { r: [0, 0, Math.PI / 2] }), part(torus(0.1, 0.025, TAU, 14), K.white, { r: [0, Math.PI / 2, 0] }));
    for (let k = 0; k < 3; k++) moving.push({ geo: batch('B'), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 3, k / 3), { p, ry } = along(field, u * 0.999); return { x: p.x, y: p.y, z: p.z, ry }; } });
    for (let k = 0; k < 3; k++) moving.push({ geo: batch('A'), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 3, k / 3 + 0.15), { p, ry } = along(rack, u * 0.999), d = rack.getTangentAt(u * 0.999); return { x: p.x, y: p.y, z: p.z, q: new THREE.Quaternion().setFromUnitVectors(new V(1, 0, 0), d) }; } });
    // The toll: a coin pops from the meter each time a batch passes it.
    const coinG = merge(part(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24), K.gold, { r: [Math.PI / 2, 0, 0] }), part(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 20), '#f6d66e', { r: [Math.PI / 2, 0, 0] }));
    const meterU = (() => { let best = 0, bd = 1e9; for (let i = 0; i <= 200; i++) { const q = rack.getPointAt(i / 200); const d = Math.abs(q.x - MX); if (d < bd) { bd = d; best = i / 200; } } return best; })();
    for (let k = 0; k < 3; k++) moving.push({ geo: coinG, pivot: [MX, y0 + 1.4, MZ], anim: (t) => { const f = ((cyc(t, 3, k / 3 + 0.15) - meterU) % 1 + 1) % 1; return { y: easeOut(win(f, 0, 0.3)) * 0.8, ry: f * 8, s: life(f, 0, 0.06, 0.25, 0.32) }; } });
    // The tanker at the jetty: it settles lower in the water as it loads, then a fresh one comes in.
    const ship = merge(
      part(extrude([[-2.6, 0], [2.2, 0], [2.9, 0.45], [2.75, 0.75], [-2.6, 0.75]], 1.5), '#2b2f36', { r: [0, Math.PI / 2, 0], p: [0, 0, 0] }),
      part(extrude([[-2.6, 0.55], [2.75, 0.55], [2.82, 0.75], [-2.6, 0.75]], 1.52), 'A', { r: [0, Math.PI / 2, 0] }),
      part(box(1.4, 0.06, 5.2), '#7a3a2f', { p: [0, 0.78, -0.05] }),
      part(rbox(1.3, 0.9, 0.8, 0.05), K.white, { p: [0, 1.25, -2.1] }), part(box(1.32, 0.12, 0.82), '#2a3c50', { p: [0, 1.5, -2.1] }), part(cyl(0.12, 0.14, 0.5, 12), 'B', { p: [0, 1.9, -2.3] }),
      hi() ? ring(5, (a, i) => part(rbox(0.9, 0.12, 0.4, 0.03), '#9aa1a9', { p: [0, 0.86, -1.2 + i * 0.75] })) : [],
      beam([0, 0.8, 0.6], [0, 1.25, 0.6], 0.05, K.steelDk),
    );
    moving.push({ geo: ship, pivot: [(QX + 5.2) / 2 + 0.25, SEA - 0.35, 0.3], anim: (t) => { const f = cyc(t, 18), load = win(f, 0.1, 0.8), arrive = 1 - easeOut(win(f, 0, 0.1)), leave = easeIn(win(f, 0.85, 1)); return { y: -load * 0.18 + Math.sin(t * 1.3) * 0.03, z: (leave - arrive) * 2.5, rz: Math.sin(t * 0.9) * 0.02, s: clamp01(1 - Math.max(arrive, leave) * 1.25) * 0.999 + 0.001 }; } });
    // The flare burns and flickers.
    moving.push({ geo: merge(part(lathe([[0, 0], [0.25, 0.15], [0.28, 0.45], [0.14, 0.9], [0, 1.3]]), K.orange), part(lathe([[0, 0], [0.15, 0.1], [0.16, 0.35], [0, 0.8]]), K.yellow, { p: [0, -0.02, 0] })), pivot: [1.2, y0 + 4.0, -4.3], anim: (t) => ({ sy: 0.8 + Math.sin(t * 13) * 0.12 + Math.sin(t * 7.3) * 0.08, sx: 1 + Math.sin(t * 9) * 0.08, rz: Math.sin(t * 2) * 0.12 }) });
    // The compressor's fan turns.
    moving.push({ geo: merge(part(cyl(0.38, 0.38, 0.08, 20), K.dark), ring(5, (a) => part(box(0.32, 0.03, 0.1), K.steel, { p: [Math.cos(a) * 0.17, 0.06, Math.sin(a) * 0.17], r: [0, -a, 0.3] }))), pivot: [-4.2, y0 + 1.12, 2.8], anim: (t) => ({ ry: t * 8 }) });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.7, y0, 1.3], topAt: [MX, y0 + 1.36, MZ] };
  },

  // Engine (auto parts, powertrains, components): the parts that keep the world driving. A big
  // cutaway engine on its stand runs: four pistons pump off the turning crankshaft, the camshaft
  // turns at half speed, each cylinder flashes as it fires and the turbo spins. Behind, the parts
  // store sends its van to the garage, where a car rises on the lift.
  'car:6': () => {
    const R = rand(707), out = [], moving = [];
    out.push(slab('#c2c4c6'));
    out.push(part(box(10.2, 0.012, 0.08), '#f2c94c', { p: [0, y0 + 0.006, 0.4] }));
    // ---- the engine on its stand
    const EX = -0.3, EZ = 2.0, CY = y0 + 1.25, RC = 0.3, LR = 0.9, PITCH = 0.95, xs = [-1.5, -0.5, 0.5, 1.5].map((k) => EX + k * PITCH);
    [EX - 2.3, EX + 2.3].forEach((x) => out.push(part(rbox(0.25, 0.9, 0.25, 0.05), '#3a3f47', { p: [x, y0 + 0.45, EZ] }), part(rbox(0.9, 0.12, 1.3, 0.04), '#3a3f47', { p: [x, y0 + 0.06, EZ] })));
    // Crankcase and the block, cut away along the front so the pistons show.
    out.push(part(rbox(4.1, 0.7, 1.4, 0.1), '#5b616b', { p: [EX, CY - 0.15, EZ] }), part(rbox(4.1, 0.25, 1.2, 0.08), '#3a3f47', { p: [EX, CY - 0.6, EZ] }), [EX - 2.3, EX + 2.3].map((x) => part(box(0.5, 0.12, 0.3), '#3a3f47', { p: [x + (x < EX ? 0.25 : -0.25), CY - 0.1, EZ] })));
    const BY = CY + 0.35, BH = 1.35;
    out.push(part(rbox(4.1, BH, 0.5, 0.06), 'A', { p: [EX, BY + BH / 2, EZ - 0.5] }), [EX - 2.05, EX + 2.05].map((x) => part(rbox(0.1, BH, 1.3, 0.04), 'A', { p: [x, BY + BH / 2, EZ] })));
    xs.forEach((x) => out.push(part(new THREE.CylinderGeometry(0.4, 0.4, BH, hi() ? 28 : 10, 1, true, Math.PI * 0.1, Math.PI * 1.3), '#c9ced6', { p: [x, BY + BH / 2, EZ], r: [0, Math.PI * 0.5, 0] })));
    [-1, 0, 1].forEach((k) => out.push(part(box(0.1, BH, 0.8), 'Ad', { p: [EX + k * PITCH, BY + BH / 2, EZ - 0.15] })));
    // Head and cam cover, also cut open.
    const HY = BY + BH;
    out.push(part(rbox(4.1, 0.35, 1.3, 0.06), '#7d8792', { p: [EX, HY + 0.17, EZ] }), part(rbox(4.1, 0.4, 0.3, 0.08), 'A', { p: [EX, HY + 0.55, EZ - 0.5] }));
    xs.forEach((x) => out.push(part(cyl(0.05, 0.05, 0.35, 8), '#e9e6df', { p: [x + 0.18, HY + 0.4, EZ + 0.35], r: [0.5, 0, 0] }), part(cyl(0.1, 0.1, 0.06, 10), K.dark, { p: [x + 0.18, HY + 0.6, EZ + 0.45], r: [0.5, 0, 0] })));
    // Intake manifold and the exhaust to the turbo.
    xs.forEach((x) => out.push(part(tube([[x, HY + 0.1, EZ - 0.55], [x, HY + 0.1, EZ - 0.95], [x * 0.3 + EX * 0.7, HY - 0.4, EZ - 1.2]], 0.09), '#b5bcc6')));
    out.push(part(cyl(0.18, 0.18, 3.2, 16), '#b5bcc6', { p: [EX, HY - 0.4, EZ - 1.2], r: [0, 0, Math.PI / 2] }));
    // Timing belt at the front, and the oil pan.
    const TX = EX + 2.2;
    out.push(part(tube([[TX, CY, EZ + 0.25], [TX, HY + 0.4, EZ + 0.25], [TX, HY + 0.4, EZ - 0.25], [TX, CY, EZ - 0.25]], 0.035, true), '#2b2f36'));
    // ---- the parts store at the back right
    const SX = 2.4, SZ = -3.4;
    out.push(part(rbox(4.2, 2.2, 2.4, 0.06), '#eef0f2', { p: [SX, y0 + 1.1, SZ] }), part(rbox(4.26, 0.5, 2.46, 0.06), 'A', { p: [SX, y0 + 2.0, SZ] }), part(box(2.2, 0.26, 0.05), K.white, { p: [SX, y0 + 2.0, SZ + 1.24] }));
    out.push(part(rbox(2.6, 1.2, 0.05, 0.03), '#9fcdea', { p: [SX - 0.4, y0 + 0.9, SZ + 1.21] }), part(rbox(0.7, 1.4, 0.06, 0.03), '#2a3c50', { p: [SX + 1.4, y0 + 0.7, SZ + 1.21] }), part(rbox(4.4, 0.08, 0.6, 0.03), 'Bd', { p: [SX, y0 + 1.62, SZ + 1.45], r: [0.2, 0, 0] }));
    if (hi()) for (let i = 0; i < 4; i++) out.push(part(box(0.5, 0.9, 0.3), ['#e5533d', '#3d7be0', '#f2c94c', '#5fae5b'][i], { p: [SX - 1.4 + i * 0.65, y0 + 0.75, SZ + 0.9] }));
    // Tyres stacked out front, a pallet of boxed parts.
    const tyreG = merge(part(torus(0.36, 0.15, TAU, 24), '#24262b', { r: [Math.PI / 2, 0, 0] }), part(cyl(0.22, 0.22, 0.12, 16), K.steel));
    for (let i = 0; i < 5; i++) out.push(place(tyreG, { p: [SX - 2.4 + (i > 2 ? 0.0 : 0), y0 + 0.15 + (i % 3) * 0.3, SZ + 2.0 + (i > 2 ? 0.75 : 0)] }));
    for (let i = 0; i < 6; i++) out.push(part(rbox(0.45, 0.35, 0.45, 0.03), i % 2 ? '#c99a62' : '#d9ab70', { p: [3.4 + (i % 3) * 0.5, y0 + 0.3 + Math.floor(i / 3) * 0.36, 3.6], r: [0, (R() - 0.5) * 0.2, 0] }), part(box(0.47, 0.06, 0.2), 'B', { p: [3.4 + (i % 3) * 0.5, y0 + 0.4 + Math.floor(i / 3) * 0.36, 3.83] }));
    out.push(part(rbox(1.6, 0.14, 1.0, 0.02), '#a37b4f', { p: [3.9, y0 + 0.07, 3.6] }));
    // ---- the garage lift at the front right
    const GX = -2.6, GZ = -2.4;
    out.push(part(rbox(3.4, 0.05, 2.6, 0.02), '#9aa1a9', { p: [GX, y0 + 0.025, GZ] }));
    [-1.3, 1.3].forEach((dx) => out.push(part(rbox(0.3, 2.6, 0.3, 0.05), '#d6336c', { p: [GX + dx, y0 + 1.3, GZ - 0.9] }), part(rbox(0.5, 0.1, 0.5, 0.02), K.dark, { p: [GX + dx, y0 + 0.05, GZ - 0.9] })));
    out.push(part(box(2.9, 0.15, 0.2), '#d6336c', { p: [GX, y0 + 2.55, GZ - 0.9] }));
    [[-4.4, 4.4], [4.4, 4.4], [-4.5, -0.2]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.2)));
    // ---- moving parts: the engine
    const crank = (t) => t * 5;
    const phase = [0, Math.PI, Math.PI, 0];
    moving.push({ geo: merge(part(cyl(0.09, 0.09, 4.3, 12), K.steel, { r: [0, 0, Math.PI / 2] }), xs.map((x, i) => [-1, 1].map((s) => part(rbox(0.06, 0.62, 0.36, 0.03), K.steelDk, { p: [x - EX + s * 0.2, RC / 2 * Math.cos(phase[i]), RC / 2 * Math.sin(phase[i])], r: [-phase[i], 0, 0] }))),
      xs.map((x, i) => part(cyl(0.08, 0.08, 0.35, 12), K.steel, { p: [x - EX, RC * Math.cos(phase[i]), RC * Math.sin(phase[i])], r: [0, 0, Math.PI / 2] })), part(cyl(0.3, 0.3, 0.12, 24), K.dark, { p: [TX - EX, 0, 0], r: [0, 0, Math.PI / 2] })),
      pivot: [EX, CY, EZ], anim: (t) => ({ rx: crank(t) }) });
    const rod = merge(part(rbox(0.12, LR, 0.07, 0.03), K.steel, { p: [0, LR / 2, 0] }), part(torus(0.09, 0.03, TAU, 14), K.steelDk, { r: [0, Math.PI / 2, 0] }));
    const piston = merge(part(cyl(0.37, 0.37, 0.45, 24), '#d8dde3'), [0.12, 0.05].map((y) => part(new THREE.CylinderGeometry(0.375, 0.375, 0.025, 24), K.steelDk, { p: [0, y, 0] })), part(cyl(0.06, 0.06, 0.5, 8), K.steelDk, { p: [0, -0.1, 0], r: [0, 0, Math.PI / 2] }));
    xs.forEach((x, i) => {
      const th = (t) => crank(t) + phase[i], pinY = (t) => RC * Math.cos(th(t)), pinZ = (t) => RC * Math.sin(th(t));
      const py = (t) => pinY(t) + Math.sqrt(LR * LR - pinZ(t) ** 2);
      moving.push({ geo: piston, pivot: [x, CY, EZ], anim: (t) => ({ y: py(t) + 0.1 }) });
      moving.push({ geo: rod, pivot: [x, CY, EZ], anim: (t) => ({ y: pinY(t), z: pinZ(t), rx: Math.atan2(-pinZ(t), py(t) - pinY(t)) }) });
      // A flash at the top of the stroke as it fires.
      moving.push({ geo: part(new THREE.SphereGeometry(0.28, 12, 8), K.yellow, { s: [1.3, 0.4, 1.3] }), pivot: [x, HY - 0.1, EZ], anim: (t) => { const c = ((th(t) % TAU) + TAU) % TAU, k = bump(c, 0.25, 0.3) * (Math.floor((crank(t) + phase[i]) / TAU + i * 0.5) % 2 ? 1 : 0); return { s: k * 1.1 + 0.001 }; } });
    });
    // The camshaft at half speed, and its pulley.
    moving.push({ geo: merge(part(cyl(0.06, 0.06, 4.0, 10), K.steel, { r: [0, 0, Math.PI / 2] }), xs.map((x, i) => part(extrude([[0, -0.1], [0.1, 0], [0, 0.18], [-0.1, 0]], 0.1), K.steelDk, { p: [x - EX + 0.18, 0, 0], r: [i * 1.57, Math.PI / 2, 0] })), part(cyl(0.38, 0.38, 0.1, 28), K.dark, { p: [TX - EX, 0, 0], r: [0, 0, Math.PI / 2] }), hi() ? ring(6, (a) => part(box(0.12, 0.06, 0.06), K.steel, { p: [TX - EX + 0.06, Math.cos(a) * 0.25, Math.sin(a) * 0.25] })) : []),
      pivot: [EX, HY + 0.4, EZ + 0.1], anim: (t) => ({ rx: crank(t) / 2 }) });
    // The turbo: its snail housing and a spinning compressor wheel.
    out.push(part(torus(0.3, 0.16, TAU * 0.85, 24), '#b5bcc6', { p: [EX + 1.7, HY - 0.4, EZ - 1.45], r: [0, 0, 0] }), part(cyl(0.18, 0.22, 0.3, 18), '#9aa1a9', { p: [EX + 1.7, HY - 0.4, EZ - 1.3], r: [Math.PI / 2, 0, 0] }));
    moving.push({ geo: merge(part(cone(0.16, 0.18, 14), K.gold, { r: [Math.PI / 2, 0, 0] }), ring(6, (a) => part(box(0.02, 0.15, 0.12), K.gold, { p: [Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0], r: [0, 0, a] }))), pivot: [EX + 1.7, HY - 0.4, EZ - 1.45], anim: (t) => ({ rz: t * 25 }) });
    // ---- the lift raises the car; a mechanic works beneath
    const liftY = (t) => { const f = cyc(t, 10); return 1.4 * easeIO(win(f, 0.1, 0.3)) * (1 - easeIO(win(f, 0.75, 0.95))); };
    moving.push({ geo: merge([-1.3, 1.3].map((dx) => part(rbox(0.5, 0.12, 0.3, 0.03), K.dark, { p: [dx, 0, 0] })), [-0.5, 0.5].map((z) => part(box(2.3, 0.08, 0.12), K.dark, { p: [0, 0.05, z + 0.9] }))), pivot: [GX, y0 + 0.4, GZ - 0.9], anim: (t) => ({ y: liftY(t) }) });
    moving.push({ geo: sedan('B'), pivot: [GX, y0 + 0.43, GZ], anim: (t) => ({ y: liftY(t) }) });
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, 10), k = win(f, 0.32, 0.42) - win(f, 0.62, 0.72); return { x: GX - 1.0 + k * 0.9, z: GZ + 1.3 - k * 1.2, ry: k > 0 && k < 1 ? Math.PI / 2 : 0, still: !(f > 0.32 && f < 0.42) && !(f > 0.62 && f < 0.72) }; }, { shirt: 'A', pants: '#2b3a55', y: y0 }));
    // ---- the van runs parts from the store to the garage
    const run = curve([[SX + 1.2, 0, SZ + 2.0], [SX - 0.8, 0, -0.5], [GX + 1.4, 0, -0.3], [GX + 0.4, 0, -0.8], [GX + 1.6, 0, -1.0], [SX - 0.6, 0, SZ + 1.8]], true);
    moving.push({ geo: merge(part(rbox(1.5, 0.9, 0.8, 0.08), K.white, { p: [-0.15, 0.62, 0] }), part(rbox(0.45, 0.6, 0.78, 0.12), K.white, { p: [0.75, 0.45, 0] }), part(box(0.04, 0.28, 0.66), '#26323f', { p: [0.98, 0.62, 0] }), part(box(1.2, 0.26, 0.02), 'A', { p: [-0.2, 0.7, 0.41] }), part(box(1.2, 0.26, 0.02), 'A', { p: [-0.2, 0.7, -0.41] }),
      [[-0.55, 0.38], [0.6, 0.38], [-0.55, -0.38], [0.6, -0.38]].map(([x, z]) => part(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14), '#1d1f24', { p: [x, 0.16, z], r: [Math.PI / 2, 0, 0] }))),
      pivot: [0, y0, 0], anim: (t) => { const { p, ry } = along(run, cyc(t, 12)); return { x: p.x, z: p.z, ry }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [3.7, y0, -0.2], topAt: [SX - 1.2, y0 + 2.25, SZ] };
  },

  // Rainy-day umbrella (insurers and brokers): many pay a little so the few who are hit are
  // covered. Every house in town hops a premium coin into the pool under a giant umbrella; a storm
  // rolls over and rains on the umbrella while the town stays dry, lightning knocks the roof off
  // one house, and a payout coin and the repair van go out and put it right.
  'insurance:0': () => {
    const R = rand(808), out = [], moving = [];
    out.push(slab('#9fcf7a'));
    // A ring road and paths to the plaza.
    out.push(part(new THREE.RingGeometry(2.7, 3.3, hi() ? 64 : 24).rotateX(-Math.PI / 2), '#d8d0c0', { p: [0, y0 + 0.012, -0.2] }));
    // ---- the plaza: the pool of premiums under the umbrella
    const UX = 0, UZ = -0.2, CR = 2.6, CY = y0 + 3.1;
    out.push(part(cyl(1.6, 1.7, 0.4, 40), K.stone, { p: [UX, y0 + 0.2, UZ] }), part(cyl(1.72, 1.74, 0.12, 40), 'A', { p: [UX, y0 + 0.06, UZ] }));
    out.push(part(lathe([[1.45, 0], [1.3, 0.2], [0.9, 0.4], [0.4, 0.5], [0, 0.52]], 40), K.gold, { p: [UX, y0 + 0.35, UZ] }));
    const coinG = merge(part(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 20), K.gold), part(new THREE.CylinderGeometry(0.14, 0.14, 0.07, 18), '#f6d66e'));
    for (let i = 0; i < (hi() ? 16 : 4); i++) { const a = R() * TAU, d = R() * 1.2; out.push(place(coinG, { p: [UX + Math.cos(a) * d, y0 + 0.9 - d * 0.35, UZ + Math.sin(a) * d], r: [(R() - 0.5) * 0.8, 0, (R() - 0.5) * 0.8] })); }
    // The umbrella: eight panels in alternating colours, ribs, a scalloped hem, shaft and handle.
    const panels = [], N8 = 8;
    for (let i = 0; i < N8; i++) {
      const a0 = (i / N8) * TAU, a1 = ((i + 1) / N8) * TAU, g = new THREE.BufferGeometry(), pos = [], m = hi() ? 8 : 3;
      for (let j = 0; j < m; j++) for (let k = 0; k < m; k++) {
        const P = (u, v) => { const a = a0 + (a1 - a0) * v, sag = Math.sin(v * Math.PI) * 0.12 * u, r = CR * u * (1 - sag * 0.4); return [Math.cos(a) * r, 0.9 * (1 - u * u) - sag * 0.5 - 0.08 * u, Math.sin(a) * r]; };
        const [u0, u1, v0, v1] = [j / m, (j + 1) / m, k / m, (k + 1) / m];
        pos.push(...P(u0, v0), ...P(u1, v1), ...P(u1, v0), ...P(u0, v0), ...P(u0, v1), ...P(u1, v1));
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      const both = merge(part(g, i % 2 ? 'A' : K.white), part(g.clone().scale(1, 1, 1).translate(0, -0.03, 0), i % 2 ? 'Ad' : '#e6e3de'));
      panels.push(both);
      panels.push(beam([0, 0.9, 0].map((v, k) => v), [Math.cos(a0) * CR, -0.08, Math.sin(a0) * CR], 0.04, K.dark));
    }
    out.push(place(merge(panels, part(cyl(0.12, 0.08, 0.4, 12), K.dark, { p: [0, 1.05, 0] }), part(new THREE.SphereGeometry(0.1, 12, 8), K.gold, { p: [0, 1.3, 0] })), { p: [UX, CY, UZ] }));
    out.push(part(cyl(0.07, 0.07, CY - y0 - 0.5, 12), '#5b616b', { p: [UX, (CY + y0 + 0.5) / 2, UZ] }));
    // ---- the houses around the ring; the one at the front right will be struck
    const homes = [[-3.4, -3.5, 0.6], [0.2, -4.1, 0], [3.5, -3.4, -0.6], [-4.0, 0.6, Math.PI / 2], [4.0, 0.4, -Math.PI / 2], [-2.6, 3.5, Math.PI - 0.6], [2.5, 3.4, Math.PI + 0.6]];
    const walls = [K.cream, '#e9eef2', '#f3e6d0', '#efe2cc', '#e4ecf0', '#f6f0e4', K.cream], roofs = ['#7d6a5a', '#5a6b7d', 'Bd', '#a35a3c', '#5a6b7d', '#7d6a5a', 'Bd'];
    homes.forEach(([x, z, ry], i) => out.push(place(home(walls[i], roofs[i], 1.6, 1.4, 1.0), { p: [x, y0, z], r: [0, ry, 0] })));
    [[-4.6, -1.6], [4.6, -1.8], [0, 4.6], [-4.5, 4.5], [4.5, 4.5]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.5 + R() * 0.2)));
    if (hi()) for (let i = 0; i < 14; i++) { const a = R() * TAU, d = 3.6 + R() * 1.0; out.push(tuft(R, Math.cos(a) * d, Math.sin(a) * d, 0.2, 5, ['#7fcf3f', '#6cc23a', '#94d84f'], 0.3).map((g) => place(g, { p: [0, y0, 0] }))); }
    // ---- moving parts (one 10 s cycle)
    const P = 10, F = (t) => cyc(t, P), [HX, HZ, HRY] = homes[6];
    // Premiums: each house hops a coin into the pool, one after another.
    homes.forEach(([x, z], i) => {
      const from = new V(x, y0 + 0.5, z).lerp(new V(UX, 0, UZ), 0.18), to = new V(UX + (x - UX) * 0.15, y0 + 0.95, UZ + (z - UZ) * 0.15);
      moving.push({ geo: coinG, pivot: to.toArray(), anim: (t) => { const f = cyc(t, 3.5, i / 7), k = easeIO(win(f, 0.05, 0.4)), p = from.clone().lerp(to, k).sub(to); return { x: p.x, y: p.y + hop(k) * 1.6, z: p.z, rx: k * TAU, s: life(f, 0.0, 0.05, 0.42, 0.48) }; } });
    });
    // The storm: in over the umbrella, then over the front-right house as lightning strikes.
    const cp = (f) => { const a = new V(-5.0, 0, -2.6), b = new V(UX, 0, UZ), c = new V(HX - 0.3, 0, HZ - 0.3), d = new V(5.6, 0, 5.0); return f < 0.22 ? a.lerp(b, easeIO(f / 0.22)) : f < 0.36 ? b.lerp(c, easeIO(win(f, 0.22, 0.36))) : f < 0.48 ? c : c.lerp(d, easeIn(win(f, 0.48, 0.66))); };
    const cloudS = (f) => Math.min(1, f / 0.05) * (1 - win(f, 0.6, 0.66));
    const CH = y0 + 5.2;
    moving.push({ geo: stormCloud(1.15), pivot: [0, CH, 0], anim: (t) => { const f = F(t), p = cp(f); return { x: p.x, z: p.z, s: cloudS(f) + 0.001 }; } });
    for (let k = 0; k < 14; k++) {
      const ox = (R() - 0.5) * 2.2, oz = (R() - 0.5) * 1.6;
      moving.push({ geo: part(new THREE.SphereGeometry(0.06, 6, 4), '#6fb4e8', { s: [1, 3, 1] }), pivot: [0, CH - 0.5, 0], anim: (t) => {
        const f = F(t), p = cp(f), x = p.x + ox, z = p.z + oz, under = Math.hypot(x - UX, z - UZ) < CR * 0.97;
        const floor = under ? CY + 0.9 * (1 - (Math.hypot(x - UX, z - UZ) / CR) ** 2) - 0.1 : y0 + 0.1, u = cyc(t, 0.7, k / 14), drop = (CH - 0.5 - floor);
        return { x, z, y: -u * drop, s: cloudS(f) > 0.5 && f < 0.6 ? (u > 0.92 ? 0.5 : 1) : 0.001 };
      } });
    }
    moving.push({ geo: bolt(4.4), pivot: [HX - 0.1, CH - 0.4, HZ - 0.1], anim: (t) => { const f = F(t); return { s: (f > 0.38 && f < 0.395) || (f > 0.41 && f < 0.425) ? 1 : 0.001 }; } });
    // The struck roof panel flies off, and comes back when the repair is done.
    const panel = part(rbox(1.0, 0.08, 1.0, 0.03), roofs[6]);
    moving.push({ geo: panel, pivot: [HX, y0 + 1.45, HZ], anim: (t) => { const f = F(t), off = win(f, 0.4, 0.5), back2 = easeIO(win(f, 0.78, 0.86)), k = off * (1 - back2); return { x: k * 1.4, y: hop(Math.min(1, off * 1.6)) * 1.2 * (1 - back2) + k * -1.25, z: k * 0.8, rx: k * 2.6, ry: HRY + k, rz: 0.55 + k * 1.8 }; } });
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.25, 10, 7), '#8b8f96'), pivot: [HX, y0 + 1.6, HZ], anim: (t) => { const f = F(t), u = cyc(t, 1.2, k / 3); return { y: u * 1.2, x: u * 0.4, s: f > 0.4 && f < 0.78 ? (1 - u) * (0.5 + u) + 0.001 : 0.001 }; } });
    // The claim is paid: a big coin from the pool to the house, and the van brings the crew.
    moving.push({ geo: place(coinG, { s: 2.2 }), pivot: [HX, y0 + 1.0, HZ], anim: (t) => { const f = F(t), k = easeIO(win(f, 0.5, 0.64)), from = new V(UX, y0 + 1.0, UZ), p = from.lerp(new V(HX, y0 + 1.0, HZ), k).sub(new V(HX, y0 + 1.0, HZ)); return { x: p.x, z: p.z, y: hop(k) * 2.2, rx: Math.PI / 2, ry: k * 6, s: life(f, 0.5, 0.54, 0.64, 0.68) }; } });
    const road = curve([[UX + 1.2, 0, UZ + 1.9], [UX + 1.9, 0, UZ + 2.5], [HX - 1.0, 0, HZ - 0.9]]);
    moving.push({ geo: merge(part(rbox(1.2, 0.75, 0.7, 0.08), K.white, { p: [-0.1, 0.52, 0] }), part(rbox(0.4, 0.5, 0.68, 0.1), K.white, { p: [0.62, 0.38, 0] }), part(box(0.03, 0.24, 0.58), '#26323f', { p: [0.82, 0.52, 0] }), part(box(0.9, 0.2, 0.02), 'A', { p: [-0.1, 0.6, 0.36] }), part(box(0.9, 0.2, 0.02), 'A', { p: [-0.1, 0.6, -0.36] }), part(box(0.5, 0.06, 0.2), '#f2c94c', { p: [-0.1, 0.92, 0] }),
      [[-0.45, 0.33], [0.5, 0.33], [-0.45, -0.33], [0.5, -0.33]].map(([x, z]) => part(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), '#1d1f24', { p: [x, 0.14, z], r: [Math.PI / 2, 0, 0] }))),
      pivot: [0, y0, 0], anim: (t) => { const f = F(t), k = easeIO(win(f, 0.56, 0.72)) * (1 - easeIO(win(f, 0.88, 0.98))), { p, ry } = along(road, k * 0.999); return { x: p.x, z: p.z, ry: ry + (f > 0.86 ? Math.PI : 0), s: life(f, 0.55, 0.58, 0.95, 0.99) }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.6, y0, -1.4], topAt: [UX, CY + 1.38, UZ] };
  },

  // Shield (auto, property and business insurers): cover when it counts. At the crossroads under
  // the insurer's shield, a car waiting at the red light is bumped from behind; a shield pops up
  // over the pair, the claims van pulls alongside, the mechanic fixes the dent, and everyone
  // drives on when the light turns green.
  'insurance:1': () => {
    const R = rand(909), out = [], moving = [];
    out.push(slab('#9fcf7a'));
    // ---- the crossroads
    const XZ = 0.6, ZX = -0.6, RW = 1.7;
    out.push(part(box(10.4, 0.03, RW), '#5b616b', { p: [0, y0 + 0.015, XZ] }), part(box(RW, 0.03, 10.4), '#5b616b', { p: [ZX, y0 + 0.016, 0] }));
    for (let i = 0; i < 7; i++) { const d = -4.6 + i * 1.5; if (Math.abs(d - ZX) > 1.2) out.push(part(box(0.7, 0.012, 0.06), '#f2e9c9', { p: [d, y0 + 0.035, XZ] })); if (Math.abs(d - XZ) > 1.2) out.push(part(box(0.06, 0.012, 0.7), '#f2e9c9', { p: [ZX, y0 + 0.036, d] })); }
    for (let i = 0; i < 5; i++) out.push(part(box(0.15, 0.012, RW - 0.2), K.white, { p: [ZX + RW / 2 + 0.3 + i * 0.25, y0 + 0.035, XZ] }));
    out.push(part(box(0.1, 0.012, RW / 2 - 0.1), K.white, { p: [ZX + RW / 2 + 1.6, y0 + 0.036, XZ - RW / 4] }));
    // Kerbs around the four blocks.
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const x0 = sx < 0 ? -5.2 : ZX + RW / 2, x1 = sx < 0 ? ZX - RW / 2 : 5.2, z0 = sz < 0 ? -5.2 : XZ + RW / 2, z1 = sz < 0 ? XZ - RW / 2 : 5.2; out.push(part(rbox(x1 - x0 - 0.2, 0.08, z1 - z0 - 0.2, 0.04), '#d8d0c0', { p: [(x0 + x1) / 2, y0 + 0.04, (z0 + z1) / 2] }), part(box(x1 - x0 - 0.7, 0.05, z1 - z0 - 0.7), '#9fcf7a', { p: [(x0 + x1) / 2, y0 + 0.08, (z0 + z1) / 2] })); });
    // ---- the insurer's office, with the shield on its roof
    const OX = -3.0, OZ = -2.9;
    out.push(part(rbox(2.6, 2.9, 2.2, 0.06), '#dfe6ec', { p: [OX, y0 + 1.55, OZ] }), part(box(2.62, 0.3, 2.22), 'A', { p: [OX, y0 + 2.85, OZ] }));
    for (let f = 0; f < 3; f++) [[0, 1.11], [1.31, 0]].forEach(([dx, dz]) => out.push(part(box(dx ? 0.04 : 2.2, 0.55, dx ? 1.8 : 0.04), '#8fbfe0', { p: [OX + dx, y0 + 0.65 + f * 0.75, OZ + dz] })));
    out.push(part(rbox(0.7, 0.8, 0.06, 0.03), '#2a3c50', { p: [OX + 0.6, y0 + 0.5, OZ + 1.12] }), part(rbox(1.0, 0.08, 0.5, 0.03), 'Ad', { p: [OX + 0.6, y0 + 0.95, OZ + 1.35] }));
    out.push(place(shieldGeo(), { p: [OX, y0 + 3.05, OZ + 0.2], r: [0, Math.PI / 4, 0], s: 1.0 }));
    // ---- the body shop across the road
    const BX = 2.7, BZ = -2.9;
    out.push(part(rbox(3.4, 1.7, 2.2, 0.05), '#eef0f2', { p: [BX, y0 + 0.85, BZ] }), part(extrude([[-1.8, 0], [1.8, 0], [1.4, 0.45], [-1.4, 0.45]], 2.3), '#9aa1a9', { p: [BX, y0 + 1.7, BZ] }), part(box(3.42, 0.25, 2.22), 'Bd', { p: [BX, y0 + 1.5, BZ] }));
    [-0.8, 0.8].forEach((dx) => out.push(part(rbox(1.2, 1.15, 0.05, 0.03), '#c9ced6', { p: [BX + dx, y0 + 0.6, BZ + 1.11] })));
    if (hi()) [-0.8, 0.8].forEach((dx) => { for (let i = 0; i < 6; i++) out.push(part(box(1.16, 0.02, 0.07), '#aab3bc', { p: [BX + dx, y0 + 0.12 + i * 0.19, BZ + 1.13] })); });
    // ---- houses and a park in front
    out.push(place(home(K.cream, '#a35a3c', 1.5, 1.4, 1.0), { p: [-3.5, y0 + 0.08, 3.6], r: [0, 0.3, 0] }));
    // A car park on the front-right block.
    out.push(part(box(3.6, 0.02, 2.6), '#7b818a', { p: [2.6, y0 + 0.1, 3.4] }));
    for (let i = 0; i < 5; i++) out.push(part(box(0.05, 0.012, 1.1), K.white, { p: [1.1 + i * 0.75, y0 + 0.115, 3.0] }));
    out.push(place(sedan('#e5533d'), { p: [1.47, y0 + 0.1, 3.0], r: [0, Math.PI / 2, 0], s: 0.8 }), place(sedan('#9aa1a9'), { p: [3.7, y0 + 0.1, 3.0], r: [0, -Math.PI / 2, 0], s: 0.8 }));
    out.push(part(rbox(1.2, 0.1, 0.35, 0.03), K.wood, { p: [-3.0, y0 + 0.45, 2.6] }), [-0.5, 0.5].map((dx) => part(box(0.06, 0.35, 0.3), K.dark, { p: [-3.0 + dx, y0 + 0.25, 2.6] })));
    [[-4.4, 2.2], [-1.8, 4.4], [-2.0, 2.4], [4.4, 4.5], [0.8, 4.5]].forEach(([x, z]) => out.push(miniTree(R, x, y0 + 0.08, z, 0.55 + R() * 0.2)));
    // The traffic light on the corner, facing the waiting cars (they come from +x).
    const LX = ZX + RW / 2 + 0.3, LZ = XZ - RW / 2 - 0.3;
    out.push(part(cyl(0.06, 0.07, 2.2, 10), '#3a3f47', { p: [LX, y0 + 1.1, LZ] }), part(rbox(0.3, 0.8, 0.26, 0.06), '#2b2f36', { p: [LX, y0 + 2.4, LZ], r: [0, 0, 0] }));
    // ---- moving parts (one 10 s cycle)
    const P = 10, F = (t) => cyc(t, P), lane = XZ - 0.42, stop = -(ZX + RW / 2 + 1.75), green = (f) => f > 0.66;
    const light = (c, dy, on) => moving.push({ geo: part(new THREE.SphereGeometry(0.09, 12, 8), c, { s: [1, 1, 0.5] }), pivot: [LX + 0.16, y0 + 2.4 + dy, LZ], anim: (t) => ({ s: on(F(t)) ? 1 : 0.001 }) });
    light('#ff5a4a', 0.22, (f) => !green(f) && f > 0.08); light('#ffc93a', 0, (f) => f <= 0.08 && f > 0.02); light('#5be36a', -0.22, (f) => green(f) || f <= 0.02);
    const fade = (x) => clamp01((5.0 - Math.abs(x)) / 0.6) * 0.85 + 0.001;
    // The waiting car, then the one that bumps it; both pull away on green.
    const car1x = (f) => f < 0.2 ? -5.8 + (stop + 5.8) * easeOut(f / 0.2) : f < 0.7 ? stop + bump(f, 0.305, 0.012) * 0.15 : stop + (11 - stop) * easeIn(win(f, 0.7, 0.98));
    const car2x = (f) => f < 0.12 ? -6.5 : f < 0.3 ? -6.5 + (stop - 2.1 + 6.5) * easeOut(win(f, 0.12, 0.3)) : f < 0.74 ? stop - 2.1 : stop - 2.1 + (13 - stop) * easeIn(win(f, 0.74, 1));
    moving.push({ geo: sedan(K.white), pivot: [0, y0, lane], anim: (t) => { const x = -car1x(F(t)); return { x, ry: Math.PI, s: fade(x) }; } });
    moving.push({ geo: sedan('B'), pivot: [0, y0, lane], anim: (t) => { const f = F(t), x = -car2x(f); return { x, ry: Math.PI, rz: -bump(f, 0.3, 0.01) * 0.05, s: fade(x) }; } });
    // The dent: a crumple at the bumpers, while the claim is open.
    moving.push({ geo: merge(part(new THREE.IcosahedronGeometry(0.16, 0), '#3a3f47', { s: [0.6, 1, 1.2] }), part(new THREE.IcosahedronGeometry(0.12, 0), '#7d8792', { p: [0.05, 0.12, 0.3] })), pivot: [-(stop - 1.07), y0 + 0.4, lane], anim: (t) => { const f = F(t); return { s: f > 0.3 && f < 0.62 ? 1 : 0.001 }; } });
    // The shield pops up over them.
    moving.push({ geo: shieldGeo('A'), pivot: [-(stop - 1.05), y0 + 2.0, lane], anim: (t) => { const f = F(t); return { y: Math.sin(t * 2) * 0.06, ry: Math.PI / 4 + Math.sin(t) * 0.15, s: life(f, 0.32, 0.38, 0.66, 0.72) * 0.85 }; } });
    // The claims van comes the other way and stops alongside.
    const vanx = (f) => f < 0.36 ? 6.5 : f < 0.5 ? 6.5 + (stop - 1.0 - 6.5) * easeOut(win(f, 0.36, 0.5)) : f < 0.68 ? stop - 1.0 : stop - 1.0 - (12) * easeIn(win(f, 0.68, 0.95));
    moving.push({ geo: merge(part(rbox(1.5, 0.95, 0.85, 0.1), K.white, { p: [-0.1, 0.65, 0] }), part(rbox(0.5, 0.65, 0.82, 0.12), K.white, { p: [0.8, 0.48, 0] }), part(box(0.04, 0.28, 0.7), '#26323f', { p: [1.04, 0.66, 0] }), part(box(1.2, 0.3, 0.02), 'A', { p: [-0.1, 0.72, 0.43] }), part(box(1.2, 0.3, 0.02), 'A', { p: [-0.1, 0.72, -0.43] }), place(shieldGeo(), { p: [-0.1, 1.12, 0], r: [0, Math.PI / 2, 0], s: 0.22 }),
      [[-0.55, 0.4], [0.65, 0.4], [-0.55, -0.4], [0.65, -0.4]].map(([x, z]) => part(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 14), '#1d1f24', { p: [x, 0.17, z], r: [Math.PI / 2, 0, 0] }))),
      pivot: [0, y0, XZ + 0.42], anim: (t) => { const x = -vanx(F(t)); return { x, s: fade(x) * 1.15 }; } });
    // The mechanic hops out, fixes the dent and gets back in.
    moving.push(...walker(moving.length, (t) => { const f = F(t), k = win(f, 0.5, 0.54) - win(f, 0.62, 0.66); return { x: -(stop - 1.0), z: XZ + 0.1 - k * 0.4, ry: Math.PI / 2, still: f > 0.54 && f < 0.62, s: f > 0.5 && f < 0.66 ? 1 : 0.001 }; }, { shirt: 'A', pants: '#2b3a55', y: y0 }));
    for (let k = 0; k < 5; k++) moving.push({ geo: star(0.12, 0.04).translate(0, 0, 0), pivot: [-(stop - 1.05), y0 + 0.8, lane], anim: (t) => { const f = F(t), u = cyc(t, 0.6, k / 5), a = k * 1.26; return { x: Math.cos(a) * u * 0.6, y: u * 0.6, z: Math.sin(a) * u * 0.6, ry: u * 4, s: f > 0.55 && f < 0.62 ? 1 - u : 0.001 }; } });
    // Cross traffic while the light is red for the waiting cars.
    for (let k = 0; k < 2; k++) moving.push({ geo: sedan(k ? '#3d7be0' : '#f29a3a'), pivot: [ZX + (k ? -0.42 : 0.42), y0, 0], anim: (t) => { const f = F(t), u = win(f, 0.08 + k * 0.22, 0.32 + k * 0.22), z = (k ? 1 : -1) * (5.8 - 11.6 * u); return { z, ry: k ? Math.PI / 2 : -Math.PI / 2, s: u > 0 && u < 1 ? fade(z) : 0.001 }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.4, y0 + 0.08, 1.9], topAt: [BX + 0.9, y0 + 2.15, BZ] };
  },

  // Showtime (studios, broadcasters, live events, radio): made once, watched everywhere. On stage
  // the band plays under sweeping spotlights, the crowd jumps and the big screen pulses; a camera
  // crane films it, and the broadcast truck beams the show up to a satellite and down to the
  // homes, whose screens light up.
  'media:0': () => {
    const R = rand(1001), out = [], moving = [];
    out.push(slab('#5d6470'));
    // ---- the stage: deck, truss arch, speaker stacks, the big screen
    const SX = -1.6, SZ = -3.1, SW = 5.0, SD = 2.2, SH = 0.9;
    out.push(part(rbox(SW, SH, SD, 0.05), '#2b2f36', { p: [SX, y0 + SH / 2, SZ] }), part(box(SW + 0.02, 0.12, SD + 0.02), 'A', { p: [SX, y0 + SH - 0.1, SZ] }));
    for (let i = 0; i < 4; i++) out.push(part(rbox(1.0, 0.18, 0.4, 0.03), '#3a3f47', { p: [SX + 0.5, y0 + 0.09 + i * 0.0, SZ + SD / 2 + 0.2 + 0 * i] }));
    const TH = 3.9, truss = (a, b) => { out.push(beam(a, b, 0.09, K.steel)); if (hi()) { const A = new V(...a), B = new V(...b), n = Math.round(A.distanceTo(B) / 0.45); for (let i = 0; i < n; i++) { const p = A.clone().lerp(B, (i + 0.5) / n); out.push(beam([p.x - 0.1, p.y - 0.1, p.z], [p.x + 0.1, p.y + 0.1, p.z], 0.03, K.steelDk)); } } };
    [-1, 1].forEach((sx) => truss([SX + sx * (SW / 2 - 0.1), y0 + SH, SZ + SD / 2 - 0.2], [SX + sx * (SW / 2 - 0.1), y0 + SH + TH, SZ + SD / 2 - 0.2]));
    truss([SX - SW / 2 + 0.1, y0 + SH + TH, SZ + SD / 2 - 0.2], [SX + SW / 2 - 0.1, y0 + SH + TH, SZ + SD / 2 - 0.2]);
    out.push(part(box(SW - 0.4, 0.3, 0.12), 'A', { p: [SX, y0 + SH + TH - 0.3, SZ + SD / 2 - 0.2] }));
    out.push(part(rbox(3.4, 2.1, 0.15, 0.04), '#1d1f24', { p: [SX, y0 + SH + 1.55, SZ - SD / 2 + 0.15] }), part(box(3.2, 1.9, 0.02), '#272b3a', { p: [SX, y0 + SH + 1.55, SZ - SD / 2 + 0.24] }));
    [-1, 1].forEach((sx) => { for (let i = 0; i < 3; i++) out.push(part(rbox(0.6, 0.55, 0.5, 0.04), '#1d1f24', { p: [SX + sx * (SW / 2 + 0.4), y0 + 0.28 + i * 0.56, SZ + 0.3] }), part(cyl(0.18, 0.18, 0.03, 16), '#3a3f47', { p: [SX + sx * (SW / 2 + 0.4), y0 + 0.28 + i * 0.56, SZ + 0.56], r: [Math.PI / 2, 0, 0] })); });
    // Drum kit and mic stand.
    out.push(part(cyl(0.3, 0.3, 0.3, 18), K.white, { p: [SX - 0.9, y0 + SH + 0.2, SZ - 0.4], r: [Math.PI / 2, 0, 0] }), part(cyl(0.2, 0.2, 0.2, 16), 'B', { p: [SX - 1.3, y0 + SH + 0.4, SZ - 0.2] }), part(cyl(0.25, 0.25, 0.02, 16), K.gold, { p: [SX - 0.4, y0 + SH + 0.8, SZ - 0.3] }), part(cyl(0.02, 0.02, 0.8, 6), K.dark, { p: [SX - 0.4, y0 + SH + 0.4, SZ - 0.3] }));
    out.push(part(cyl(0.02, 0.02, 1.1, 6), K.dark, { p: [SX + 0.5, y0 + SH + 0.55, SZ + 0.5] }));
    // ---- the camera crane's dolly, the broadcast truck with its dish, homes at the front right
    const JX = 1.6, JZ = 0.0;
    out.push(part(rbox(1.0, 0.3, 0.8, 0.05), '#3a3f47', { p: [JX, y0 + 0.2, JZ] }), part(cyl(0.12, 0.15, 1.2, 12), '#3a3f47', { p: [JX, y0 + 0.9, JZ] }));
    const TX = 3.2, TZ = -2.6;
    out.push(place(van('#eef0f2', 'A'), { p: [TX, y0, TZ], r: [0, -Math.PI / 2, 0], s: 1.3 }), part(cyl(0.08, 0.1, 0.8, 10), K.steelDk, { p: [TX, y0 + 1.6, TZ + 0.2] }));
    out.push(part(lathe([[0, 0], [0.4, 0.06], [0.7, 0.22]], 28), '#f4f5f6', { p: [TX, y0 + 2.0, TZ + 0.2], r: [-0.5, 0.6, 0] }), beam([TX, y0 + 2.05, TZ + 0.2], [TX + 0.2, y0 + 2.5, TZ + 0.5], 0.03, K.steelDk));
    const homes = [[2.4, 3.7], [3.9, 2.3], [3.9, 3.9]];
    homes.forEach(([x, z], i) => out.push(place(home(['#f3ead8', '#e4ecf0', '#efe2cc'][i], ['#7d6a5a', '#5a6b7d', '#a35a3c'][i], 1.4, 1.2, 0.9), { p: [x, y0, z], r: [0, Math.PI * 0.75, 0] })));
    out.push(part(rbox(4.0, 0.06, 3.4, 0.04), '#8cc66a', { p: [3.2, y0 + 0.03, 3.3] }));
    [[0.9, 4.5], [4.6, 0.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.5 + R() * 0.2)));
    // ---- moving parts
    // The big screen: equalizer bars dancing in the brand colours.
    for (let i = 0; i < 10; i++) moving.push({ geo: part(box(0.24, 1, 0.03), i % 3 ? 'A' : 'B', { p: [0, 0.5, 0] }), pivot: [SX - 1.35 + i * 0.3, y0 + SH + 0.7, SZ - SD / 2 + 0.27], anim: (t) => ({ sy: 0.15 + Math.abs(Math.sin(t * (3 + (i % 4)) + i * 1.7)) * 1.4 * (0.6 + 0.4 * Math.sin(t * 1.3 + i)) }) });
    // Spotlights on the truss sweep the crowd.
    for (let i = 0; i < 4; i++) {
      const L = new V(SX - 1.8 + i * 1.2, y0 + SH + TH - 0.12, SZ + SD / 2 - 0.2), ang = (t) => ({ rx: -0.75 + Math.sin(t * 0.9 + i) * 0.25, rz: Math.sin(t * 0.7 + i * 1.9) * 0.28 });
      moving.push({ geo: merge(part(cyl(0.14, 0.18, 0.32, 12), '#1d1f24'), part(cyl(0.12, 0.12, 0.02, 12), '#fff4c2', { p: [0, -0.17, 0] })), pivot: L.toArray(), anim: (t) => ang(t) });
      // Where its beam lands: a pool of light on the crowd.
      moving.push({ geo: part(cyl(0.55, 0.55, 0.02, 24), '#fff1b0'), pivot: [0, y0 + 0.02, 0], anim: (t) => { const { rx, rz } = ang(t), d = new V(Math.sin(rz), -Math.cos(rz) * Math.cos(rx), -Math.cos(rz) * Math.sin(rx)), k = (L.y - y0) / -d.y; return { x: L.x + d.x * k, z: L.z + d.z * k, sx: 1, sz: 1 + Math.abs(d.z / d.y) * 0.4 }; } });
    }
    // The band: a singer at the mic, a guitarist rocking.
    moving.push(...walker(moving.length, (t) => ({ x: SX + 0.5, z: SZ + 0.3, ry: -Math.PI / 2 + Math.sin(t * 1.5) * 0.3, still: true }), { shirt: 'B', pants: '#1d1f24', y: y0 + SH }));
    moving.push(...walker(moving.length, (t) => ({ x: SX + 1.5 + Math.sin(t * 0.8) * 0.4, z: SZ, ry: -Math.PI / 2 + Math.sin(t * 2) * 0.2 }), { shirt: K.white, pants: '#1d1f24', y: y0 + SH, carry: part(rbox(0.6, 0.18, 0.05, 0.03), K.red, { p: [0.25, 0.95, 0], r: [0, 0, 0.5] }) }));
    // The crowd jumps in three waves.
    const shirts = ['#e5533d', '#3d7be0', '#f2c94c', '#5fae5b', '#8a6cf0', '#f39ab8', K.white, '#f29a3a'], skins = ['#e9b98f', '#c98d63', '#8a5a3a', '#f1cfae'];
    for (let g = 0; g < 3; g++) {
      const crowd = [];
      for (let i = 0; i < (hi() ? 14 : 5); i++) { const x = SX - 2.2 + R() * 4.6, z = SZ + SD / 2 + 0.8 + R() * 2.6; if (Math.hypot(x - JX, z - JZ) < 0.9) continue; crowd.push(place(fan(shirts[Math.floor(R() * shirts.length)], skins[Math.floor(R() * skins.length)]), { p: [x, 0, z], r: [0, -Math.PI / 2 + (R() - 0.5), 0] })); }
      moving.push({ geo: merge(crowd), pivot: [0, y0, 0], anim: (t) => ({ y: Math.abs(Math.sin(t * 4.2 + g * 2.1)) * 0.18 }) });
    }
    // The camera crane swings its arm over the crowd.
    const jib = moving.length;
    moving.push({ geo: merge(beam([-1.0, 0, 0], [2.4, 0, 0], 0.09, '#f2c94c'), part(rbox(0.4, 0.4, 0.4, 0.06), '#3a3f47', { p: [-1.1, -0.1, 0] })), pivot: [JX, y0 + 1.55, JZ], anim: (t) => ({ ry: Math.PI * 0.75 + Math.sin(t * 0.5) * 0.6, rz: 0.25 + Math.sin(t * 0.7) * 0.15 }) });
    moving.push({ geo: merge(part(rbox(0.4, 0.3, 0.3, 0.05), '#1d1f24'), part(cyl(0.1, 0.12, 0.25, 12), '#3a3f47', { p: [0.3, 0, 0], r: [0, 0, Math.PI / 2] }), part(cyl(0.03, 0.03, 0.04, 8), '#e5533d', { p: [0, 0.17, 0] })), pivot: [2.4, -0.1, 0], parent: jib, anim: (t) => ({ rz: -0.25 - Math.sin(t * 0.7) * 0.15 }) });
    // The broadcast: rings up from the dish to the satellite, down to each home.
    const SAT = new V(3.6, y0 + 5.4, 0.2), DISH = new V(TX + 0.2, y0 + 2.4, TZ + 0.4);
    moving.push({ geo: merge(part(rbox(0.4, 0.4, 0.4, 0.05), K.gold), [-1, 1].map((sx) => part(box(0.9, 0.02, 0.4), '#2a5bb0', { p: [sx * 0.68, 0, 0] })), part(cyl(0.18, 0.05, 0.15, 14), K.white, { p: [0, -0.25, 0], r: [Math.PI, 0, 0] })), pivot: SAT.toArray(), anim: (t) => ({ y: Math.sin(t * 0.8) * 0.1, ry: Math.sin(t * 0.3) * 0.3 }) });
    const ringG = part(torus(0.22, 0.03, TAU, 20), '#ffe27a');
    for (let k = 0; k < 3; k++) moving.push({ geo: ringG, pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 2, k / 3), p = DISH.clone().lerp(SAT, u); return { x: p.x, y: p.y, z: p.z, rx: -0.6, s: 0.6 + u * 0.8 }; } });
    homes.forEach(([x, z], i) => {
      const H = new V(x, y0 + 1.6, z);
      moving.push({ geo: ringG, pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 2, i / 3 + 0.5), p = SAT.clone().lerp(H, u); return { x: p.x, y: p.y, z: p.z, rx: 0.5, s: 1.2 - u * 0.6 }; } });
      // The TV in each window flickers on as the show arrives.
      moving.push({ geo: part(box(0.36, 0.26, 0.04), '#7cc7ff'), pivot: [x + 0.48, y0 + 0.55, z - 0.48], anim: (t) => ({ ry: Math.PI * 0.75, s: Math.floor(t * 6 + i) % 4 ? 1 : 0.85 }) });
    });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.7, y0, 3.4], topAt: [SX + SW / 2 + 0.4, y0 + 1.66, SZ + 0.3] };
  },

  // Robot lab (robotics, surgical robots, robot learning, 3D printing): machines that learn to do
  // physical work. A humanoid walks its test loop, a robot dog trots over steps and a ramp, an arm
  // sorts blocks while a tele-operator in a headset shows it how, and a resin printer draws a part
  // up out of its tank.
  'robot:0': () => {
    const R = rand(1101), out = [], moving = [];
    out.push(slab('#d9dde2'));
    // Lab floor grid and the two back walls with screens.
    if (hi()) for (let i = -4; i <= 4; i++) out.push(part(box(10.2, 0.006, 0.02), '#c3c9d0', { p: [0, y0 + 0.003, i * 1.1] }), part(box(0.02, 0.006, 10.2), '#c3c9d0', { p: [i * 1.1, y0 + 0.003, 0] }));
    out.push(part(rbox(10.4, 2.4, 0.2, 0.04), '#eef0f2', { p: [0, y0 + 1.2, -5.1] }), part(rbox(0.2, 2.4, 10.0, 0.04), '#eef0f2', { p: [-5.1, y0 + 1.2, 0.1] }), part(box(10.4, 0.2, 0.22), 'A', { p: [0, y0 + 2.3, -5.1] }), part(box(0.22, 0.2, 10.0), 'A', { p: [-5.1, y0 + 2.3, 0.1] }));
    [[-1.2, 0], [0.6, 0], [2.4, 0]].forEach(([x]) => out.push(part(rbox(1.5, 0.9, 0.05, 0.03), '#1d2a33', { p: [x, y0 + 1.4, -4.97] })));
    // ---- the humanoid's loop, painted on the floor
    const HX = 1.6, HZ = 0.6, ax = 2.3, az = 1.4;
    for (let i = 0; i < (hi() ? 40 : 12); i++) { const a = (i / (hi() ? 40 : 12)) * TAU; out.push(part(box(0.22, 0.008, 0.06), '#f2c94c', { p: [HX + Math.cos(a) * ax, y0 + 0.005, HZ + Math.sin(a) * az], r: [0, -a - Math.PI / 2, 0] })); }
    // ---- the dog's course: steps up, a platform, a ramp down
    const DZ = 3.6;
    out.push(part(rbox(0.6, 0.2, 1.0, 0.03), '#9aa1a9', { p: [-2.6, y0 + 0.1, DZ] }), part(rbox(0.6, 0.4, 1.0, 0.03), '#9aa1a9', { p: [-2.0, y0 + 0.2, DZ] }), part(rbox(1.2, 0.6, 1.0, 0.03), '#9aa1a9', { p: [-1.1, y0 + 0.3, DZ] }), part(extrude([[0, 0], [1.6, 0], [0, 0.6]], 1.0), '#aab3bc', { p: [-0.5, y0, DZ] }));
    const ground = (x) => (x < -2.9 ? 0 : x < -2.3 ? 0.2 : x < -1.7 ? 0.4 : x < -0.5 ? 0.6 : x < 1.1 ? 0.6 * (1 - (x + 0.5) / 1.6) : 0);
    // ---- the arm's bench: tray of blocks, bins, the operator's station
    const AX = -3.2, AZ = -2.6;
    out.push(part(rbox(2.6, 0.8, 1.3, 0.05), '#c9ced6', { p: [AX, y0 + 0.4, AZ] }), part(rbox(2.7, 0.06, 1.4, 0.03), '#3a3f47', { p: [AX, y0 + 0.83, AZ] }));
    const blockC = ['#e5533d', '#3d7be0', '#f2c94c'];
    out.push(part(rbox(0.8, 0.08, 0.6, 0.03), '#5b616b', { p: [AX - 0.8, y0 + 0.9, AZ + 0.1] }));
    blockC.forEach((c, i) => out.push(part(rbox(0.36, 0.22, 0.36, 0.03), c, { p: [AX + 0.4 + i * 0.42, y0 + 0.97, AZ + 0.3] }), part(rbox(0.12, 0.12, 0.12, 0.02), c, { p: [AX + 0.4 + i * 0.42, y0 + 1.0, AZ + 0.3] })));
    out.push(part(rbox(0.5, 0.75, 0.4, 0.04), '#3a3f47', { p: [AX + 0.3, y0 + 0.38, AZ + 1.3] }), part(rbox(0.9, 0.55, 0.05, 0.03), '#1d2a33', { p: [AX + 0.3, y0 + 1.1, AZ + 1.1], r: [0.2, 0, 0] }));
    // ---- the resin printer at the back right
    const PX = 3.6, PZ = -3.7;
    out.push(part(rbox(1.2, 0.5, 1.2, 0.06), '#3a3f47', { p: [PX, y0 + 0.25, PZ] }), [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => part(box(0.06, 1.4, 0.06), '#f29a3a', { p: [PX + sx * 0.52, y0 + 1.2, PZ + sz * 0.52] })), part(rbox(1.1, 0.1, 1.1, 0.03), '#f29a3a', { p: [PX, y0 + 1.9, PZ] }), part(rbox(0.9, 0.12, 0.9, 0.03), '#b35a1f', { p: [PX, y0 + 0.56, PZ] }), part(box(0.1, 1.3, 0.1), K.steelDk, { p: [PX, y0 + 1.15, PZ - 0.45] }));
    // The orange cover is see-through on the front: leave it open with a frame.
    out.push(part(box(0.84, 0.04, 0.84), '#f29a3a', { p: [PX, y0 + 0.63, PZ] }));
    [[4.5, 4.4], [-4.4, 1.2]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55)));
    out.push(part(cyl(0.3, 0.25, 0.4, 16), '#c9ced6', { p: [4.5, y0 + 0.2, 4.4] }), part(cyl(0.3, 0.25, 0.4, 16), '#c9ced6', { p: [-4.4, y0 + 0.2, 1.2] }));
    // ---- moving parts
    // The humanoid on its loop.
    moving.push(...humanoid(moving.length, (t) => { const a = t * 0.32, dx = -Math.sin(a) * ax, dz = Math.cos(a) * az; return { x: HX + Math.cos(a) * ax, z: HZ + Math.sin(a) * az, ry: Math.atan2(-dz, dx) }; }, { y: y0, joint: 'A', s: 1.7 }));
    // A second humanoid carrying a box across the back.
    moving.push(...humanoid(moving.length, (t) => { const f = cyc(t, 12), k = f < 0.5 ? easeIO(f * 2) : 1 - easeIO((f - 0.5) * 2), x = -0.8 + k * 3.4; return { x, z: -3.6, ry: f < 0.5 ? 0 : Math.PI }; }, { y: y0, joint: 'B', s: 1.5 }));
    moving.push({ geo: part(rbox(0.6, 0.5, 0.6, 0.04), '#c99a62'), pivot: [0, y0 + 1.6, -3.6], anim: (t) => { const f = cyc(t, 12), k = f < 0.5 ? easeIO(f * 2) : 1 - easeIO((f - 0.5) * 2); return { x: -0.8 + k * 3.4 + (f < 0.5 ? 0.5 : -0.5) }; } });
    // The dog trots over the course and back.
    const dogX = (t) => { const f = cyc(t, 10); return -4.3 + 5.8 * (f < 0.5 ? easeIO(f * 2) : 1 - easeIO((f - 0.5) * 2)); };
    const dogDir = (t) => (cyc(t, 10) < 0.5 ? 0 : Math.PI);
    const dog = moving.length;
    moving.push({ geo: merge(part(rbox(0.9, 0.24, 0.36, 0.08), '#f2c94c'), part(rbox(0.3, 0.18, 0.3, 0.06), '#2b2f36', { p: [0.52, 0.06, 0] }), part(box(0.5, 0.05, 0.3), '#2b2f36', { p: [0, 0.14, 0] }), part(cyl(0.04, 0.04, 0.02, 8), '#62d35f', { p: [0.68, 0.06, 0.09], r: [0, 0, Math.PI / 2] })),
      pivot: [0, y0 + 0.74, DZ], anim: (t) => { const x = dogX(t), gy = (ground(x - 0.45) + ground(x + 0.45)) / 2; return { x, y: gy + Math.abs(Math.sin(t * 9)) * 0.03, ry: dogDir(t), rz: (ground(x + 0.45) - ground(x - 0.45)) * 0.5 * (dogDir(t) ? -1 : 1), s: 1.4 }; } });
    [[0.35, 0.2, 0], [0.35, -0.2, 1], [-0.35, 0.2, 1], [-0.35, -0.2, 0]].forEach(([x, z, ph]) => moving.push({ geo: merge(part(capsule(0.05, 0.22), '#3a3f47', { p: [0, -0.15, 0] }), part(capsule(0.04, 0.22), '#9aa1a9', { p: [0.06, -0.38, 0], r: [0, 0, 0.4] })), pivot: [x, -0.05, z], parent: dog, anim: (t) => ({ rz: Math.sin(t * 9 + ph * Math.PI) * 0.45 }) }));
    // The arm sorts blocks from the tray into their bins.
    const RB = new V(AX, y0 + 0.86, AZ - 0.35), L1 = 0.75, L2 = 0.7, P = 6;
    const TRAY = new V(AX - 0.8, y0 + 1.05, AZ + 0.1);
    const binOf = (k) => new V(AX + 0.4 + (k % 3) * 0.42, y0 + 1.05, AZ + 0.3);
    const wrist = (t) => { const f = cyc(t, P), k = Math.floor(t / P) % 3, up = (p) => p.clone().add(new V(0, 0.4, 0)), A = TRAY, B = binOf(k);
      const keys = [[0, up(A)], [0.15, A], [0.25, A], [0.35, up(A)], [0.6, up(B)], [0.7, B], [0.75, B], [0.85, up(B)], [1, up(A)]];
      for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return keys[i - 1][1].clone().lerp(keys[i][1], easeIO(win(f, keys[i - 1][0], keys[i][0])));
      return up(A); };
    const pose = (t) => { const w = wrist(t), dx = w.x - RB.x, dz = w.z - RB.z, j = reach2(Math.hypot(dx, dz), w.y + 0.28 - (RB.y + 0.3), L1, L2); return { yaw: Math.atan2(-dz, dx), s: j.s, e: j.e, wr: -Math.PI / 2 - j.s - j.e }; };
    const ab = moving.length;
    moving.push({ geo: merge(part(cyl(0.18, 0.2, 0.2, 18), K.dark, { p: [0, 0.1, 0] }), part(rbox(0.26, 0.2, 0.26, 0.06), 'A', { p: [0, 0.25, 0] })), pivot: RB.toArray(), anim: (t) => ({ ry: pose(t).yaw }) });
    moving.push({ geo: merge(part(cyl(0.1, 0.1, 0.26, 14), K.dark, { r: [Math.PI / 2, 0, 0] }), part(rbox(L1, 0.14, 0.15, 0.06), K.white, { p: [L1 / 2, 0, 0] })), pivot: [0, 0.3, 0], parent: ab, anim: (t) => ({ rz: pose(t).s }) });
    moving.push({ geo: merge(part(cyl(0.08, 0.08, 0.22, 12), 'A', { r: [Math.PI / 2, 0, 0] }), part(rbox(L2, 0.12, 0.13, 0.05), K.white, { p: [L2 / 2, 0, 0] })), pivot: [L1, 0, 0], parent: ab + 1, anim: (t) => ({ rz: pose(t).e }) });
    moving.push({ geo: merge(part(cyl(0.06, 0.06, 0.16, 10), K.dark, { r: [Math.PI / 2, 0, 0] }), part(rbox(0.16, 0.08, 0.12, 0.03), K.steelDk, { p: [0.1, 0, 0] }), [-0.05, 0.05].map((z) => part(box(0.1, 0.03, 0.03), K.steel, { p: [0.22, 0, z] }))), pivot: [L2, 0, 0], parent: ab + 2, anim: (t) => ({ rz: pose(t).wr }) });
    for (let k = 0; k < 3; k++) moving.push({ geo: part(rbox(0.12, 0.12, 0.12, 0.02), blockC[k]), pivot: [0, 0, 0], anim: (t) => {
      const f = cyc(t, P), cur = Math.floor(t / P) % 3, held = cur === k && f > 0.25 && f < 0.75, w = wrist(t);
      const p = held ? w.clone().add(new V(0, -0.06, 0)) : cur === k && f <= 0.25 ? TRAY.clone().add(new V(0, -0.06, 0)) : binOf(k).add(new V(0, -0.08, 0));
      return { x: p.x, y: p.y, z: p.z, s: cur === k || (cur + 2) % 3 === k ? 1 : (f < 0.1 ? 1 - f * 10 : 0.001) };
    } });
    // The tele-operator in a headset, mirroring the arm.
    moving.push(...walker(moving.length, () => ({ x: AX + 0.3, z: AZ + 1.75, ry: Math.PI / 2, still: true }), { shirt: K.dark, pants: '#2b3a55', y: y0, carry: part(rbox(0.12, 0.1, 0.26, 0.03), '#1d1f24', { p: [0.1, 1.58, 0] }) }));
    // The printer: the build plate rises from the tank as the part grows beneath it.
    const PP = 8;
    moving.push({ geo: merge(part(rbox(0.6, 0.06, 0.6, 0.02), K.steel), part(box(0.08, 0.1, 0.5), K.steelDk, { p: [0, 0.08, -0.3] })), pivot: [PX, y0 + 0.66, PZ], anim: (t) => ({ y: easeIO(win(cyc(t, PP), 0.05, 0.85)) * 0.9 }) });
    moving.push({ geo: part(lathe([[0, 0], [0.18, 0.02], [0.08, 0.3], [0.2, 0.6], [0, 0.62]], 16), '#f29a3a', { r: [Math.PI, 0, 0] }), pivot: [PX, y0 + 0.63, PZ], anim: (t) => { const k = easeIO(win(cyc(t, PP), 0.05, 0.85)); return { y: k * 0.9, sy: Math.max(0.001, Math.min(1, k * 1.5)), s: cyc(t, PP) > 0.97 ? 0.001 : 1 }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [3.6, y0, 3.2], topAt: [PX, y0 + 1.9, PZ] };
  },

  // Bubbles (household and personal care, cleaning, hygiene services): products in every home,
  // every day. The filling line fills, caps and boxes bottles under a giant pump bottle; the van
  // carries them off; in a cut-away home the bath foams over with rising bubbles and the washer
  // spins.
  'care:0': () => {
    const R = rand(1201), out = [], moving = [];
    out.push(slab('#a9d7c9'));
    // ---- the plant: back wall with its stripe and a giant pump bottle on the roof
    const WZ = -4.45;
    out.push(part(rbox(6.0, 2.4, 1.2, 0.05), '#f4f5f6', { p: [-2.1, y0 + 1.2, WZ] }), part(box(6.02, 0.3, 1.22), 'A', { p: [-2.1, y0 + 2.1, WZ] }));
    [-4.1, -2.1, -0.1].forEach((x) => out.push(part(rbox(1.2, 0.8, 0.05, 0.03), '#9fcdea', { p: [x, y0 + 1.2, WZ + 0.61] })));
    out.push(place(bottle(2.4, 'A', 'B'), { p: [-2.6, y0 + 2.4, WZ] }), part(box(0.14, 0.14, 0.7), 'B', { p: [-2.6, y0 + 2.4 + 2.35, WZ + 0.35] }), part(cyl(0.05, 0.05, 0.3, 8), 'B', { p: [-2.6, y0 + 2.4 + 2.3, WZ + 0.7], r: [Math.PI / 2, 0, 0] }));
    // ---- the line: conveyor along x, filler, capper, the case packer
    const CZ = -2.7, TOPY = y0 + 0.75, X0 = -4.7, X1 = 0.4;
    out.push(part(box(X1 - X0, 0.08, 0.7), '#3a3f47', { p: [(X0 + X1) / 2, TOPY - 0.04, CZ] }));
    [CZ - 0.37, CZ + 0.37].forEach((z) => out.push(part(new THREE.BoxGeometry(X1 - X0, 0.14, 0.05), '#c9ced6', { p: [(X0 + X1) / 2, TOPY - 0.03, z] })));
    for (let x = X0 + 0.1; x <= X1; x += 0.85) [CZ - 0.32, CZ + 0.32].forEach((z) => out.push(part(new THREE.BoxGeometry(0.07, 0.7, 0.07), '#9aa1a9', { p: [x, y0 + 0.35, z] })));
    const FX = -3.3, KX = -1.9;
    [FX, KX].forEach((x, i) => { out.push(part(rbox(0.9, 0.12, 1.0, 0.03), '#eef0f2', { p: [x, y0 + 1.85, CZ] }), [-0.4, 0.4].map((dz) => part(box(0.1, 1.15, 0.1), '#eef0f2', { p: [x, y0 + 1.3, CZ + dz] }))); out.push(part(rbox(0.94, 0.2, 1.04, 0.03), i ? 'B' : 'A', { p: [x, y0 + 1.97, CZ] })); });
    out.push(part(rbox(1.0, 0.7, 1.0, 0.05), '#c99a62', { p: [X1 + 0.6, y0 + 0.35, CZ] }), part(box(1.02, 0.1, 1.02), 'A', { p: [X1 + 0.6, y0 + 0.5, CZ] }));
    for (let i = 0; i < 4; i++) out.push(part(rbox(0.6, 0.45, 0.6, 0.03), '#d9ab70', { p: [X1 + 0.3 + (i % 2) * 0.65, y0 + 0.23 + Math.floor(i / 2) * 0.46, CZ + 1.1] }), part(box(0.62, 0.08, 0.2), 'A', { p: [X1 + 0.3 + (i % 2) * 0.65, y0 + 0.3 + Math.floor(i / 2) * 0.46, CZ + 1.31] }));
    // ---- the home, cut away: bathroom and laundry
    const HX0 = -0.4, HX1 = 4.8, HZ0 = 0.2, HZ1 = 4.6, FY = y0 + 0.2, WH = 2.2, MID = 2.1;
    out.push(part(rbox(HX1 - HX0, 0.2, HZ1 - HZ0, 0.04), '#d9cbb4', { p: [(HX0 + HX1) / 2, y0 + 0.1, (HZ0 + HZ1) / 2] }));
    out.push(part(box(MID - HX0, 0.02, HZ1 - HZ0 - 0.1), '#e6f2f6', { p: [(HX0 + MID) / 2, FY + 0.01, (HZ0 + HZ1) / 2] }));
    if (hi()) for (let i = 1; i < 6; i++) out.push(part(box(MID - HX0, 0.022, 0.02), '#c7dde5', { p: [(HX0 + MID) / 2, FY + 0.012, HZ0 + i * 0.73] }));
    out.push(part(rbox(HX1 - HX0, WH, 0.15, 0.03), '#f6efe2', { p: [(HX0 + HX1) / 2, FY + WH / 2, HZ0] }), part(rbox(0.15, WH, HZ1 - HZ0, 0.03), '#f6efe2', { p: [HX0, FY + WH / 2, (HZ0 + HZ1) / 2] }), part(rbox(0.12, 0.9, 2.4, 0.03), '#eadfcc', { p: [MID, FY + 0.45, HZ0 + 1.2] }));
    out.push(part(box(HX1 - HX0, 0.12, 0.17), 'Bd', { p: [(HX0 + HX1) / 2, FY + WH, HZ0] }), part(box(0.17, 0.12, HZ1 - HZ0), 'Bd', { p: [HX0, FY + WH, (HZ0 + HZ1) / 2] }));
    // The bath along the back wall, tiles, a sink with its mirror, a shelf of products.
    if (hi()) for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) out.push(part(box(0.3, 0.3, 0.02), (i + j) % 2 ? '#d9eef5' : '#ffffff', { p: [HX0 + 0.3 + i * 0.32, FY + 0.2 + j * 0.32, HZ0 + 0.09] }));
    out.push(part(rbox(1.7, 0.6, 0.95, 0.2), K.white, { p: [0.65, FY + 0.3, HZ0 + 0.6] }), part(rbox(1.5, 0.05, 0.75, 0.1), '#a9dff2', { p: [0.65, FY + 0.56, HZ0 + 0.6] }), part(tube([[0.0, FY + 0.9, HZ0 + 0.1], [0.0, FY + 1.05, HZ0 + 0.25], [0.0, FY + 0.85, HZ0 + 0.35]], 0.03), K.steel));
    if (hi()) for (let i = 0; i < 14; i++) out.push(place(bubbleGeo(0.12 + R() * 0.1), { p: [0.05 + R() * 1.3, FY + 0.62 + R() * 0.12, HZ0 + 0.3 + R() * 0.6] }));
    out.push(part(rbox(0.6, 0.12, 0.45, 0.04), K.white, { p: [HX0 + 0.35, FY + 0.85, HZ0 + 2.2] }), part(cyl(0.05, 0.07, 0.75, 10), K.white, { p: [HX0 + 0.35, FY + 0.4, HZ0 + 2.2] }), part(rbox(0.04, 0.7, 0.55, 0.03), '#bfe3f2', { p: [HX0 + 0.1, FY + 1.45, HZ0 + 2.2] }));
    out.push(part(box(0.08, 0.04, 1.0), '#c99a62', { p: [HX0 + 0.12, FY + 1.95, HZ0 + 1.2] }));
    [['A', 'B'], ['B', 'A'], [K.white, 'A'], ['Ad', K.white]].forEach(([b, c], i) => out.push(place(bottle(0.32, b, c), { p: [HX0 + 0.14, FY + 1.97, HZ0 + 0.8 + i * 0.26] })));
    // Laundry: the washer, a dryer, a basket, detergent.
    out.push(part(rbox(0.9, 1.0, 0.8, 0.08), K.white, { p: [3.0, FY + 0.5, HZ0 + 0.55] }), part(torus(0.3, 0.05, TAU, 28), '#c9ced6', { p: [3.0, FY + 0.5, HZ0 + 0.96] }), part(rbox(0.6, 0.12, 0.05, 0.02), '#9aa1a9', { p: [3.0, FY + 0.92, HZ0 + 0.96] }));
    out.push(part(rbox(0.9, 1.0, 0.8, 0.08), '#eef0f2', { p: [4.0, FY + 0.5, HZ0 + 0.55] }), part(cyl(0.3, 0.3, 0.04, 24), '#5b616b', { p: [4.0, FY + 0.5, HZ0 + 0.96], r: [Math.PI / 2, 0, 0] }));
    out.push(place(bottle(0.45, 'A', 'B'), { p: [3.0, FY + 1.0, HZ0 + 0.4] }), part(lathe([[0.32, 0], [0.38, 0.35], [0, 0.36]].reverse().map(([r, y]) => [r, 0.36 - y]).reverse(), 20), '#e8d3ad', { p: [3.5, FY, HZ0 + 1.8] }));
    out.push(part(lathe([[0, 0], [0.3, 0], [0.36, 0.38], [0.34, 0.4], [0.28, 0.04], [0, 0.04]], 20), '#d9c39a', { p: [3.6, FY, HZ0 + 1.9] }), part(new THREE.SphereGeometry(0.22, 10, 7), '#8fc4e8', { p: [3.55, FY + 0.33, HZ0 + 1.9], s: [1, 0.5, 1] }), part(new THREE.SphereGeometry(0.18, 10, 7), '#f39ab8', { p: [3.7, FY + 0.36, HZ0 + 1.8], s: [1, 0.5, 1] }));
    [[-4.5, 4.4], [-4.6, 0.6], [-1.6, 4.5]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.2)));
    // ---- moving parts
    // Bottles ride the line: filled under the filler, capped under the capper, boxed at the end.
    const P = 1.6, N = 6, travel = (u) => X0 + 0.2 + u * (X1 - X0 - 0.2);
    for (let k = 0; k < N; k++) {
      const u = (t) => cyc(t, P * N, k / N), x = (t) => travel(u(t));
      moving.push({ geo: merge(part(lathe([[0, 0], [0.13, 0.01], [0.135, 0.04], [0.135, 0.28], [0.07, 0.35], [0.055, 0.38], [0, 0.38]], 18), 'A'), part(new THREE.CylinderGeometry(0.137, 0.137, 0.12, 18, 1, true), K.white, { p: [0, 0.16, 0] })), pivot: [0, TOPY, CZ], anim: (t) => ({ x: x(t), s: Math.min(1, u(t) / 0.03, (1 - u(t)) / 0.03) }) });
      moving.push({ geo: part(cyl(0.06, 0.06, 0.08, 12), 'B'), pivot: [0, TOPY + 0.42, CZ], anim: (t) => ({ x: x(t), s: x(t) > KX && u(t) < 0.97 ? 1 : 0.001 }) });
    }
    // The filler's nozzle and the capper's head bob as bottles pass.
    moving.push({ geo: merge(part(cyl(0.05, 0.03, 0.5, 10), K.steel), part(rbox(0.3, 0.2, 0.3, 0.04), K.steelDk, { p: [0, 0.3, 0] })), pivot: [FX, TOPY + 0.95, CZ], anim: (t) => ({ y: -bump(cyc(t, P), 0.5, 0.15) * 0.25 }) });
    moving.push({ geo: merge(part(cyl(0.1, 0.1, 0.25, 12), K.steelDk), part(rbox(0.3, 0.2, 0.3, 0.04), K.steelDk, { p: [0, 0.2, 0] })), pivot: [KX, TOPY + 0.95, CZ], anim: (t) => ({ y: -bump(cyc(t, P, 0.3), 0.5, 0.15) * 0.3, ry: t * 6 }) });
    // A worker checks the line.
    moving.push(...walker(moving.length, (t) => { const k = Math.sin(t * 0.4); return { x: -2.4 + k * 1.6, z: CZ + 0.95, ry: Math.cos(t * 0.4) > 0 ? 0 : Math.PI }; }, { shirt: 'A', pants: '#2b3a55', y: y0 }));
    // The van runs cases from the plant round to the home.
    const run = curve([[X1 + 1.6, 0, CZ + 0.3], [3.6, 0, -1.6], [4.5, 0, -0.6], [3.6, 0, -1.0], [X1 + 1.7, 0, CZ + 0.9]], true);
    moving.push({ geo: van(K.white, 'A'), pivot: [0, y0, 0], anim: (t) => { const { p, ry } = along(run, cyc(t, 12)); return { x: p.x, z: p.z, ry }; } });
    // Bubbles rise from the bath, wobble and pop.
    for (let k = 0; k < 10; k++) { const bx = 0.1 + R() * 1.2, bz = HZ0 + 0.35 + R() * 0.5, r = 0.1 + R() * 0.12; moving.push({ geo: bubbleGeo(r), pivot: [bx, FY + 0.7, bz], anim: (t) => { const u = cyc(t, 4 + (k % 3), k / 10); return { y: u * 3.2, x: Math.sin(t * 2 + k) * 0.25 * u + u * 0.6, z: Math.cos(t * 1.7 + k) * 0.2 * u + u * 0.8, s: u > 0.92 ? 1 + (u - 0.92) * 6 : Math.min(1, u * 10) }; } }); }
    // The washer's drum turns, clothes tumbling.
    moving.push({ geo: merge(part(cyl(0.27, 0.27, 0.02, 24), '#bfe3f2', { r: [Math.PI / 2, 0, 0] }), [['#e5533d', 0], ['#3d7be0', 2], ['#f2c94c', 4]].map(([c, a]) => part(new THREE.SphereGeometry(0.1, 8, 6), c, { p: [Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.02], s: [1.4, 0.8, 0.5] }))), pivot: [3.0, FY + 0.5, HZ0 + 0.95], anim: (t) => ({ rz: t * 5 }) });
    // Someone brushing their teeth at the sink.
    moving.push(...walker(moving.length, () => ({ x: HX0 + 0.9, z: HZ0 + 2.2, ry: Math.PI, still: true }), { shirt: '#8fc4e8', pants: '#3b4a5c', y: FY }));
    moving.push({ geo: merge(part(rbox(0.04, 0.04, 0.22, 0.015), 'A'), part(box(0.04, 0.05, 0.05), K.white, { p: [0, 0.03, -0.09] })), pivot: [HX0 + 0.72, FY + 1.5, HZ0 + 2.2], anim: (t) => ({ z: Math.sin(t * 14) * 0.04, ry: Math.PI / 2 }) });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.6, y0, 2.0], topAt: [-0.6, y0 + 2.42, WZ] };
  },

  // Lifebuoy (life, auto and home insurers, reinsurers): there when you need it. A swimmer gets
  // into trouble beyond the waves; the lifeguard climbs down from the tower, runs to the water and
  // throws the lifebuoy on its line, then hauls the swimmer safely ashore while the beach plays on.
  'insurance:2': () => {
    const R = rand(1301), out = [], moving = [];
    out.push(slab('#e9d7a8'));
    // ---- the sea along the front, the sand, the boardwalk and huts at the back
    const SHORE = 1.3, SEA = y0 + 0.03;
    out.push(part(rbox(10.4, 0.12, 5.2 - SHORE + 0.1, 0.04), '#d9c48e', { p: [0, y0 - 0.05, (SHORE - 0.1 + 5.2) / 2] }), part(new THREE.PlaneGeometry(10.4, 5.2 - SHORE).rotateX(-Math.PI / 2), 'W', { p: [0, SEA, (SHORE + 5.2) / 2] }));
    out.push(part(box(10.4, 0.012, 0.25), '#f2e8cf', { p: [0, y0 + 0.006, SHORE - 0.1] }));
    out.push(part(box(10.4, 0.18, 1.3), '#b98a5a', { p: [0, y0 + 0.09, -3.6] }));
    if (hi()) for (let i = 0; i < 26; i++) out.push(part(box(0.05, 0.19, 1.3), '#a37b4f', { p: [-5.1 + i * 0.4, y0 + 0.095, -3.6] }));
    const hut = ['A', K.white, 'B', K.white, 'A'];
    for (let i = 0; i < 5; i++) { const x = -4.2 + i * 1.9; out.push(part(rbox(1.3, 1.3, 1.0, 0.04), (X, Y) => (Math.floor((X - x + 2) * 4) % 2 ? hut[i] : K.white), { p: [x, y0 + 0.83, -4.6] }), part(prism(1.5, 0.5, 1.2), i % 2 ? 'Ad' : 'Bd', { p: [x, y0 + 1.48, -4.6] }), part(rbox(0.4, 0.8, 0.04, 0.02), '#7a5233', { p: [x, y0 + 0.58, -4.08] })); }
    // ---- the lifeguard tower, brand coloured, with buoys on a stand
    const TX = 0.6, TZ = -1.2, TH = 1.9;
    [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([x, z]) => out.push(beam([TX + x * 1.3, y0, TZ + z * 1.3], [TX + x, y0 + TH, TZ + z], 0.1, K.white)));
    out.push(part(rbox(1.5, 0.12, 1.5, 0.03), K.white, { p: [TX, y0 + TH, TZ] }), part(rbox(1.2, 0.9, 1.1, 0.06), 'A', { p: [TX, y0 + TH + 0.5, TZ - 0.1] }), part(box(1.0, 0.4, 0.04), '#9fcdea', { p: [TX, y0 + TH + 0.6, TZ + 0.47] }), part(prism(1.6, 0.5, 1.6), K.white, { p: [TX, y0 + TH + 0.95, TZ - 0.1] }));
    for (let i = 0; i < 6; i++) out.push(part(box(0.6, 0.05, 0.12), K.white, { p: [TX + 0.9, y0 + 0.3 + i * 0.3, TZ + 0.75], r: [0, 0, 0] }));
    beam([TX + 0.65, y0, TZ + 0.75], [TX + 0.65, y0 + TH, TZ + 0.75], 0.05, K.white);
    out.push(beam([TX + 0.65, y0, TZ + 0.75], [TX + 0.65, y0 + TH, TZ + 0.75], 0.05, K.white), beam([TX + 1.15, y0, TZ + 0.75], [TX + 1.15, y0 + TH, TZ + 0.75], 0.05, K.white));
    out.push(part(cyl(0.04, 0.04, 2.6, 8), K.white, { p: [TX - 0.6, y0 + TH + 1.3, TZ - 0.6] }), part(box(0.6, 0.4, 0.02), 'B', { p: [TX - 0.3, y0 + TH + 2.35, TZ - 0.6] }));
    out.push(part(box(0.08, 1.2, 0.08), K.white, { p: [-1.0, y0 + 0.6, 0.6] }), place(lifebuoy(0.3), { p: [-1.0, y0 + 0.95, 0.66], r: [Math.PI / 2, 0, 0] }));
    // ---- the beach: parasols, towels, a sandcastle, a bucket
    [[-3.6, -1.0, 'A'], [-2.0, 0.2, 'B'], [3.2, -1.2, '#e5533d'], [3.8, 0.3, '#3d7be0']].forEach(([x, z, c], i) => out.push(place(parasol(c, K.white), { p: [x, y0, z], r: [0, 0, 0.12 * (i % 2 ? 1 : -1)] }), part(box(1.1, 0.02, 0.6), ['#f2c94c', '#5fae5b', '#f39ab8', '#8a6cf0'][i], { p: [x + 0.5, y0 + 0.01, z + 0.5], r: [0, 0.3 * i, 0] })));
    out.push(part(cyl(0.45, 0.55, 0.35, 8), '#dcc488', { p: [-0.5, y0 + 0.17, -0.2] }), part(cyl(0.3, 0.38, 0.3, 8), '#dcc488', { p: [-0.5, y0 + 0.5, -0.2] }), ring(4, (a) => part(cyl(0.1, 0.12, 0.35, 6), '#dcc488', { p: [-0.5 + Math.cos(a) * 0.45, y0 + 0.5, -0.2 + Math.sin(a) * 0.45] })), part(cyl(0.12, 0.1, 0.2, 12), '#e5533d', { p: [0.1, y0 + 0.1, 0.1] }));
    // ---- moving parts (one 12 s cycle)
    const P = 12, F = (t) => cyc(t, P);
    // Waves roll in to the shore in bands of foam.
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.CapsuleGeometry(0.06, 9.6, 3, 8), '#ffffff', { r: [0, 0, Math.PI / 2] }), pivot: [0, SEA + 0.02, 0], anim: (t) => { const u = cyc(t, 4, k / 3); return { z: 5.0 - u * (5.0 - SHORE - 0.1), sy: 1, sx: 1, s: Math.min(1, u * 5, (1 - u) * 8) }; } });
    // Happy swimmers bobbing.
    const swimmer = (cap) => merge(part(new THREE.SphereGeometry(0.15, 12, 9), '#e9b98f', { p: [0, 0.14, 0] }), part(new THREE.SphereGeometry(0.16, 12, 9), cap, { p: [-0.02, 0.2, 0], s: [1, 0.6, 1] }), part(capsule(0.14, 0.2), '#3d7be0', { p: [0, -0.1, 0] })).scale(1.5, 1.5, 1.5);
    [[-3.2, 2.4, '#f2c94c'], [-1.6, 3.4, '#e5533d'], [3.8, 2.6, '#5fae5b']].forEach(([x, z, c], i) => moving.push({ geo: swimmer(c), pivot: [x, SEA, z], anim: (t) => ({ y: Math.sin(t * 2 + i) * 0.06, x: Math.sin(t * 0.4 + i) * 0.3 }) }));
    // The swimmer in trouble: bobbing and waving, then pulled in on the ring and walking out.
    const SW = new V(1.9, SEA, 3.9), DRY = new V(1.5, y0, SHORE + 0.1);
    const swPos = (f) => f < 0.45 ? SW.clone() : f < 0.72 ? SW.clone().lerp(new V(DRY.x, SEA, SHORE + 0.4), easeIO(win(f, 0.45, 0.72))) : new V(DRY.x, SEA, SHORE + 0.4);
    const sw = moving.length;
    moving.push({ geo: swimmer('#8a6cf0'), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = swPos(f), dunk = f < 0.42 ? Math.abs(Math.sin(t * 3)) * 0.18 : 0; return { x: p.x, y: p.y - dunk + Math.sin(t * 2) * 0.03, z: p.z, s: f < 0.74 ? 1 : 0.001 }; } });
    moving.push({ geo: part(capsule(0.07, 0.5), '#e9b98f', { p: [0, 0.3, 0] }), pivot: [0.22, 0.15, 0], parent: sw, anim: (t) => ({ rz: F(t) < 0.42 ? -0.3 + Math.sin(t * 8) * 0.5 : -1.2 }) });
    // Safe: they walk up the beach to their towel.
    moving.push(...walker(moving.length, (t) => { const f = F(t), k = win(f, 0.74, 0.95); return { x: DRY.x - k * 2.6, z: DRY.z - k * 1.2, ry: Math.atan2(1.2, -2.6), s: f > 0.74 && f < 0.97 ? 1 : 0.001, still: f > 0.95 }; }, { shirt: '#3d7be0', pants: '#3d7be0', y: y0 }));
    // The lifeguard: down the ladder, along the sand to the water's edge, throws, hauls in.
    const GP = (f) => { const a = new V(TX + 0.9, 0, TZ + 1.0), b = new V(DRY.x - 0.3, 0, SHORE - 0.2); return f < 0.18 ? a : f < 0.32 ? a.lerp(b, easeIO(win(f, 0.18, 0.32))) : f < 0.85 ? b : b.lerp(a, easeIO(win(f, 0.85, 0.98))); };
    moving.push(...walker(moving.length, (t) => { const f = F(t), p = GP(f), back2 = f > 0.85; return { x: p.x, z: p.z, ry: back2 ? Math.atan2(-(TZ + 1.0 - (SHORE - 0.2)), TX + 0.9 - DRY.x + 0.3) : f < 0.32 ? Math.atan2(-(SHORE - 0.2 - TZ - 1.0), DRY.x - 0.3 - TX - 0.9) : -Math.PI / 2, still: f > 0.32 && f < 0.85, push: f > 0.35 && f < 0.72 }; }, { shirt: 'A', pants: 'A', y: y0 }));
    // The lifebuoy: carried, thrown out to the swimmer, then hauled back with them in it.
    const ringPos = (f) => { const hand = GP(f).add(new V(0.3, y0 + 1.0, 0)); if (f < 0.34) return hand; if (f < 0.45) { const k = easeOut(win(f, 0.34, 0.45)), p = hand.clone().lerp(SW.clone().add(new V(0, 0.05, 0)), k); p.y += hop(k) * 1.6; return p; } return swPos(f).add(new V(0, 0.05, 0)); };
    moving.push({ geo: lifebuoy(0.42), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = ringPos(f); return { x: p.x, y: p.y, z: p.z, rx: f < 0.45 && f > 0.34 ? win(f, 0.34, 0.45) * TAU : 0, s: f < 0.76 ? 1 : 0.001 }; } });
    // Its line, from the lifeguard's hands to the ring.
    moving.push({ geo: part(new THREE.CylinderGeometry(0.012, 0.012, 1, 5), '#f2c94c', { p: [0, 0.5, 0] }), pivot: [0, 0, 0], anim: (t) => { const f = F(t), a = GP(f).add(new V(0.15, y0 + 1.0, 0)), b = ringPos(f), d = b.clone().sub(a), L = d.length(); const on = f > 0.35 && f < 0.74; return { x: a.x, y: a.y, z: a.z, q: new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), d.normalize()), sx: on ? 1 : 0.001, sy: on ? Math.max(0.001, L) : 0.001, sz: on ? 1 : 0.001 }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.6, y0, -2.3], topAt: [TX, y0 + TH + 1.45, TZ - 0.1] };
  },

  // Hourglass (life insurers, annuities, title and specialty insurers): security over a lifetime.
  // A giant hourglass trickles gold from top to bottom and turns over each cycle; around it a path
  // runs through life (a couple's first home, a family with a child on the swing, a retired couple
  // rocking on their porch), and cheques fly from the hourglass to the retirees.
  'insurance:3': () => {
    const R = rand(1401), out = [], moving = [];
    out.push(slab('#9fcf7a'));
    // ---- the path through life
    const path = curve([[-4.6, 0, 4.2], [-2.6, 0, 2.0], [0, 0, 2.6], [2.4, 0, 1.6], [2.6, 0, -1.2], [1.4, 0, -3.4], [3.4, 0, -4.6]]);
    for (let i = 0, n = hi() ? 70 : 20; i < n; i++) { const { p, ry } = along(path, i / n); out.push(part(rbox(0.5, 0.04, 0.5, 0.06), '#e6dcc8', { p: [p.x, y0 + 0.02, p.z], r: [0, ry + (i % 2) * 0.3, 0] })); }
    // ---- the hourglass on its plinth
    const GX = -0.6, GZ = -0.4, PH = 0.5, H = 1.6, GY = y0 + PH + 0.2 + H;
    out.push(part(cyl(1.3, 1.4, PH, 32), K.stone, { p: [GX, y0 + PH / 2, GZ] }), part(cyl(1.42, 1.44, 0.14, 32), 'A', { p: [GX, y0 + 0.07, GZ] }));
    // ---- three homes along the path
    out.push(place(home('#f3ead8', 'Bd', 1.5, 1.3, 1.0), { p: [-3.6, y0, 3.3], r: [0, 0.7, 0] }));
    out.push(place(house2('#e4ecf0', '#5a6b7d', 'B'), { p: [3.3, y0, 3.3], r: [0, -0.6, 0], s: 0.85 }));
    // The retirees' porch house at the back right, with rocking chairs.
    const OX = 3.2, OZ = -2.4;
    out.push(place(home('#efe2cc', 'Ad', 2.0, 1.6, 1.2), { p: [OX, y0, OZ - 0.6], r: [0, -0.3, 0] }), part(rbox(2.2, 0.12, 0.9, 0.03), '#b98a5a', { p: [OX + 0.25, y0 + 0.08, OZ + 0.45], r: [0, -0.3, 0] }));
    // A swing set by the family home.
    const SX = 1.6, SZ = 4.0;
    out.push(beam([SX - 0.8, y0, SZ - 0.4], [SX - 0.8, y0 + 1.8, SZ], 0.06, '#d6336c'), beam([SX - 0.8, y0, SZ + 0.4], [SX - 0.8, y0 + 1.8, SZ], 0.06, '#d6336c'), beam([SX + 0.8, y0, SZ - 0.4], [SX + 0.8, y0 + 1.8, SZ], 0.06, '#d6336c'), beam([SX + 0.8, y0, SZ + 0.4], [SX + 0.8, y0 + 1.8, SZ], 0.06, '#d6336c'), beam([SX - 0.8, y0 + 1.8, SZ], [SX + 0.8, y0 + 1.8, SZ], 0.06, '#d6336c'));
    [[-4.5, 0.4], [-2.3, -3.6], [0.4, -4.4], [4.5, 0.6], [-4.4, -2.0], [0.6, 4.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.25)));
    if (hi()) for (let i = 0; i < 12; i++) out.push(tuft(R, -4.6 + R() * 9.2, -4.6 + R() * 9.2, 0.2, 5, ['#7fcf3f', '#6cc23a', '#94d84f'], 0.3).map((g) => place(g, { p: [0, y0, 0] })));
    // ---- moving parts (one 10 s cycle per turn of the glass)
    const P = 10, F = (t) => cyc(t, P), n = (t) => Math.floor(t / P), flow = (t) => win(F(t), 0.05, 0.84);
    const turn = (t) => Math.PI * (n(t) + easeIO(win(F(t), 0.86, 1)));
    const glass = moving.length;
    // The frame: caps, posts and a glass outline (hoops) around two bulbs.
    // The glass, drawn as ribs and hoops along the two bulbs' profile.
    const prof = [[0.12, 0.02], [0.55, 0.3], [0.85, 0.75], [0.82, 1.2], [0.6, 1.5]];
    const ribs = [-1, 1].flatMap((sg) => ring(hi() ? 10 : 5, (a) => part(tube(prof.map(([r, y]) => [Math.cos(a) * r, sg * y, Math.sin(a) * r]), 0.025), '#cfeefc')));
    const hoops = [-1, 1].flatMap((sg) => [[0.85, 0.75], [0.6, 1.5]].map(([r, y]) => part(torus(r, 0.03, TAU, 32), '#cfeefc', { p: [0, sg * y, 0], r: [Math.PI / 2, 0, 0] })));
    moving.push({ geo: merge(part(cyl(1.05, 1.05, 0.22, 32), K.wood, { p: [0, H + 0.11, 0] }), part(cyl(1.05, 1.05, 0.22, 32), K.wood, { p: [0, -H - 0.11, 0] }), part(cyl(1.08, 1.08, 0.06, 32), 'A', { p: [0, H + 0.24, 0] }), part(cyl(1.08, 1.08, 0.06, 32), 'A', { p: [0, -H - 0.24, 0] }),
      ring(3, (a) => part(cyl(0.07, 0.07, 2 * H, 10), K.woodDk, { p: [Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95] })), ribs, hoops),
      pivot: [GX, GY, GZ], anim: (t) => ({ rz: turn(t) }) });
    // Gold heaps in each bulb: the one on top drains while the one below fills; they swap roles each turn.
    const heap = (sgn) => part(lathe([[0, 0], [0.78, 0.0], [0.6, 0.35], [0.12, 0.7], [0, 0.72]], 28), (x, y, z) => (Math.floor((x + z) * 6) % 2 ? K.gold : '#e3b23c'), { r: sgn > 0 ? [Math.PI, 0, 0] : [0, 0, 0] });
    moving.push({ geo: heap(1), pivot: [0, H, 0], parent: glass, anim: (t) => { const k = n(t) % 2 ? flow(t) : 1 - flow(t); return { sy: Math.max(0.02, k), sx: 0.4 + 0.6 * Math.sqrt(k), sz: 0.4 + 0.6 * Math.sqrt(k) }; } });
    moving.push({ geo: heap(-1), pivot: [0, -H, 0], parent: glass, anim: (t) => { const k = n(t) % 2 ? 1 - flow(t) : flow(t); return { sy: Math.max(0.02, k), sx: 0.4 + 0.6 * Math.sqrt(k), sz: 0.4 + 0.6 * Math.sqrt(k) }; } });
    // The stream through the neck, and coins tumbling in it.
    moving.push({ geo: part(cyl(0.04, 0.04, 1, 8), K.gold, { p: [0, -0.5, 0] }), pivot: [GX, GY, GZ], anim: (t) => { const f = F(t), on = f > 0.05 && f < 0.84; return { sy: on ? H - 0.2 : 0.001, s: on ? 1 : 0.001 }; } });
    for (let k = 0; k < 4; k++) moving.push({ geo: part(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), K.gold), pivot: [GX, GY, GZ], anim: (t) => { const f = F(t), u = cyc(t, 0.6, k / 4); return { y: -u * (H - 0.3), rx: u * 9, s: f > 0.05 && f < 0.84 ? 1 : 0.001 }; } });
    // Cheques fly out to the retired couple.
    const OUT = new V(GX + 1.2, y0 + PH + 0.3, GZ), TO = new V(OX - 0.2, y0 + 1.1, OZ + 0.6);
    for (let k = 0; k < 2; k++) moving.push({ geo: merge(part(box(0.42, 0.02, 0.26), K.white), part(box(0.12, 0.025, 0.1), 'A', { p: [0.12, 0, -0.05] }), part(box(0.25, 0.026, 0.02), K.ink, { p: [-0.05, 0, 0.06] })), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 5, k / 2), k2 = easeIO(win(u, 0.1, 0.7)), p = OUT.clone().lerp(TO, k2); return { x: p.x, y: p.y + hop(k2) * 1.6, z: p.z, ry: k2 * 3, rz: Math.sin(u * 20) * 0.2, s: life(u, 0.08, 0.14, 0.7, 0.8) }; } });
    // The retirees rock on their porch.
    [[-0.45, '#8fc4e8'], [0.45, '#d6336c']].forEach(([dx, c], i) => {
      const cx = OX + dx * Math.cos(0.3), cz = OZ + 0.55 + dx * Math.sin(0.3);
      const chair = moving.length;
      moving.push({ geo: merge(part(rbox(0.45, 0.06, 0.45, 0.02), K.woodDk, { p: [0, 0.35, 0] }), part(rbox(0.06, 0.6, 0.45, 0.02), K.woodDk, { p: [-0.22, 0.65, 0] }), [-0.2, 0.2].map((z) => part(torus(0.5, 0.025, 0.9, 10), K.woodDk, { p: [0, 0.5, z], r: [0, 0, -Math.PI / 2 - 0.45] }))), pivot: [cx, y0 + 0.14, cz], anim: (t) => ({ ry: -0.3 + Math.PI, rz: Math.sin(t * 1.6 + i) * 0.12 }) });
      moving.push({ geo: merge(part(capsule(0.17, 0.3), c, { p: [0, 0.65, 0] }), part(new THREE.SphereGeometry(0.15, 12, 9), '#e9b98f', { p: [0, 1.05, 0] }), part(new THREE.SphereGeometry(0.155, 12, 9), '#e6e6e6', { p: [-0.02, 1.1, 0], s: [1, 0.75, 1] }), part(capsule(0.08, 0.3), '#3b4a5c', { p: [0.2, 0.42, 0.08], r: [0, 0, Math.PI / 2] }), part(capsule(0.08, 0.3), '#3b4a5c', { p: [0.2, 0.42, -0.08], r: [0, 0, Math.PI / 2] })), pivot: [0, 0, 0], parent: chair, anim: () => ({}) });
    });
    // A young couple strolls the path; a child swings.
    [0, 0.04].forEach((o, i) => moving.push(...walker(moving.length, (t) => { const u = cyc(t, 22, -o), { p, ry } = along(path, Math.min(0.999, u * 0.999)); return { x: p.x, z: p.z + (i ? 0.25 : -0.25), ry, s: Math.min(1, u / 0.03, (1 - u) / 0.03) }; }, { shirt: i ? '#f29a3a' : 'B', pants: '#2b3a55', y: y0 })));
    const sw = moving.length;
    moving.push({ geo: merge([-0.25, 0.25].map((z) => part(cyl(0.01, 0.01, 1.4, 4), K.ink, { p: [0, -0.7, z] })), part(rbox(0.3, 0.05, 0.6, 0.02), K.wood, { p: [0, -1.4, 0] })), pivot: [SX, y0 + 1.78, SZ], anim: (t) => ({ rz: Math.sin(t * 2.2) * 0.6, ry: Math.PI / 2 }) });
    moving.push({ geo: merge(part(capsule(0.12, 0.2), '#f2c94c', { p: [0, 0.2, 0] }), part(new THREE.SphereGeometry(0.12, 10, 8), '#e9b98f', { p: [0, 0.5, 0] }), part(capsule(0.05, 0.25), '#3d7be0', { p: [0.15, 0.0, 0], r: [0, 0, Math.PI / 2] })), pivot: [0, -1.38, 0], parent: sw, anim: () => ({ ry: -Math.PI / 2 }) });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.6, y0, -1.2], topAt: [OX + 0.2, y0 + 1.95, OZ - 0.6] };
  },

  // Anchor (mutual life insurers, commercial and specialty insurers): steady in any storm. On the
  // rock a lighthouse sweeps its beam; out at sea a storm rages and a trawler pitches hard in the
  // swell but its anchor chain holds; behind the breakwater, under the big anchor, the harbour's
  // boats bob calmly.
  'insurance:5': () => {
    const R = rand(1501), out = [], moving = [];
    out.push(part(rbox(10.4, 0.2, 10.4, 0.06), '#1f4f7a', { p: [0, 0.1, 0] }), part(new THREE.PlaneGeometry(10.2, 10.2).rotateX(-Math.PI / 2), 'W', { p: [0, y0 - 0.02, 0] }));
    // ---- the rock and its lighthouse, at the back left
    const RX = -2.8, RZ = -2.8;
    const rock = (x, z, r, h, c) => out.push(part(new THREE.DodecahedronGeometry(1, hi() ? 1 : 0), c, { p: [x, y0 - 0.2 + h * 0.4, z], s: [r, h, r * 0.9], r: [0, R() * 3, 0] }));
    rock(RX, RZ, 2.0, 1.5, '#8a8f96'); rock(RX + 1.2, RZ + 0.6, 1.2, 1.0, '#7a8088'); rock(RX - 0.9, RZ + 1.2, 1.0, 0.8, '#9aa0a8'); rock(RX + 0.6, RZ - 1.3, 1.1, 1.1, '#858a91');
    out.push(part(cyl(0.95, 1.0, 0.25, 24), '#c9ced6', { p: [RX, y0 + 1.25, RZ] }));
    const LH = 3.1, ly = y0 + 1.35;
    for (let i = 0; i < 5; i++) { const r0 = 0.62 - (0.12 * i) / 5, r1 = 0.62 - (0.12 * (i + 1)) / 5; out.push(part(new THREE.CylinderGeometry(r1, r0, LH / 5, hi() ? 32 : 12), i % 2 ? K.white : 'A', { p: [RX, ly + (i + 0.5) * (LH / 5), RZ] })); }
    out.push(part(cyl(0.65, 0.65, 0.1, 24), K.dark, { p: [RX, ly + LH + 0.05, RZ] }), part(cyl(0.42, 0.42, 0.55, 16), '#fff1b0', { p: [RX, ly + LH + 0.38, RZ] }), part(cone(0.5, 0.45, 16), 'Ad', { p: [RX, ly + LH + 0.88, RZ] }));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; out.push(part(cyl(0.02, 0.02, 0.55, 6), K.dark, { p: [RX + Math.cos(a) * 0.43, ly + LH + 0.38, RZ + Math.sin(a) * 0.43] })); }
    out.push(part(rbox(0.3, 0.5, 0.05, 0.02), '#2a3c50', { p: [RX + 0.3, ly + 0.25, RZ + 0.55], r: [0, 0.5, 0] }));
    // ---- the breakwater curving out from the rock, the anchor on its end, the harbour inside
    const bw = curve([[RX + 1.6, 0, RZ + 1.0], [0.4, 0, -1.6], [1.6, 0, 0.6], [1.4, 0, 2.2]]);
    for (let i = 0, n = hi() ? 60 : 16; i <= n; i++) { const { p, ry } = along(bw, i / n); out.push(part(rbox(0.65, 0.5, 0.7, 0.08), i % 2 ? '#b9b4aa' : '#a8a398', { p: [p.x, y0 + 0.15, p.z], r: [0, ry, 0] })); }
    const end = bw.getPointAt(1);
    out.push(part(cyl(0.6, 0.7, 0.4, 20), K.stone, { p: [end.x, y0 + 0.4, end.z] }), place(anchorGeo(2.4, 'A'), { p: [end.x, y0 + 0.6, end.z], r: [0, Math.PI / 4, 0] }));
    // A jetty in the harbour.
    out.push(part(box(2.4, 0.08, 0.5), '#b98a5a', { p: [-2.6, y0 + 0.15, 0.4] }));
    for (let i = 0; i < 5; i++) out.push(part(cyl(0.05, 0.05, 0.5, 6), '#7a5233', { p: [-3.7 + i * 0.55, y0 + 0.05, 0.62] }));
    // ---- moving parts
    // The beam sweeps round: two flat blades of light from the lantern.
    moving.push({ geo: merge([0, Math.PI].map((a) => part(extrude([[0, -0.1], [2.2, -0.4], [2.2, 0.4], [0, 0.1]], 0.02), '#fff6c8', { r: [Math.PI / 2, a, 0] }))), pivot: [RX, ly + LH + 0.38, RZ], anim: (t) => ({ ry: t * 0.9 }) });
    // Harbour boats bob gently at the jetty.
    const sail = (c) => merge(part(extrude([[-0.6, -0.1], [0.5, -0.1], [0.75, 0.15], [-0.6, 0.15]], 0.45), c), part(cyl(0.02, 0.02, 1.1, 6), K.white, { p: [0, 0.65, 0] }), part(extrude([[0, 0], [0.55, 0], [0, 0.95]], 0.02), K.white, { p: [0.03, 0.2, 0] }));
    [[-3.3, 1.1, 'B'], [-2.2, 1.2, K.white], [-1.4, -0.4, '#e5533d']].forEach(([x, z, c], i) => moving.push({ geo: sail(c), pivot: [x, y0 - 0.02, z], anim: (t) => ({ y: Math.sin(t * 1.2 + i) * 0.03, rx: Math.sin(t * 1.0 + i) * 0.05, ry: 0.4 * i }) }));
    // Out at sea: swell bands rolling, a storm cloud with rain and lightning.
    for (let k = 0; k < 6; k++) { const x0 = 1.6 + (k % 3) * 1.1; moving.push({ geo: part(new THREE.CapsuleGeometry(0.07, 1.2, 3, 8), '#ffffff', { r: [0, 0, Math.PI / 2] }), pivot: [x0, y0, 0], anim: (t) => { const u = cyc(t, 3.2, k / 6); return { z: -3.8 + u * 8.4, x: Math.sin(u * 3 + k) * 0.3, ry: -0.3, s: Math.min(1, u * 5, (1 - u) * 5) }; } }); }
    const CL = new V(3.4, y0 + 4.4, -2.6);
    moving.push({ geo: stormCloud(0.9), pivot: CL.toArray(), anim: (t) => ({ x: Math.sin(t * 0.25) * 0.6, z: Math.cos(t * 0.2) * 0.4 }) });
    for (let k = 0; k < 12; k++) { const ox = (R() - 0.5) * 1.8, oz = (R() - 0.5) * 1.2; moving.push({ geo: part(new THREE.SphereGeometry(0.05, 6, 4), '#9fd3f5', { s: [1, 3.5, 1] }), pivot: [CL.x + ox, CL.y - 0.6, CL.z + oz], anim: (t) => { const u = cyc(t, 0.6, k / 12); return { x: Math.sin(t * 0.25) * 0.6 - u * 0.6, z: Math.cos(t * 0.2) * 0.4, y: -u * (CL.y - 0.6 - y0), s: 1 - win(u, 0.9, 1) }; } }); }
    moving.push({ geo: bolt(3.6), pivot: [CL.x + 0.6, CL.y - 0.5, CL.z + 0.5], anim: (t) => { const f = cyc(t, 5); return { s: (f > 0.5 && f < 0.52) || (f > 0.55 && f < 0.565) ? 1 : 0.001 }; } });
    // The trawler: pitching and rolling in the swell, swinging on its chain, but held.
    const AN = new V(3.6, y0, -2.2), boatAt = (t) => { const a = Math.sin(t * 0.35) * 0.5 + Math.PI * 0.75; return new V(AN.x + Math.cos(a) * 1.4, y0, AN.z - Math.sin(a) * 1.4); };
    moving.push({ geo: trawler('A'), pivot: [0, 0, 0], anim: (t) => { const p = boatAt(t), d = AN.clone().sub(p); return { x: p.x, y: p.y + Math.sin(t * 2.0) * 0.12, z: p.z, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t * 1.6) * 0.16, Math.atan2(-d.z, d.x), Math.sin(t * 2.0 + 0.6) * 0.22, 'YXZ')) }; } });
    // Its chain, from the bow down to the anchor's buoy, taut and slack in turn.
    const link = part(torus(0.07, 0.022, TAU, 10), K.steelDk);
    for (let k = 0; k < 8; k++) moving.push({ geo: link, pivot: [0, 0, 0], anim: (t) => { const p = boatAt(t), d = AN.clone().sub(p).normalize(), bow = p.clone().addScaledVector(d, 1.25).add(new V(0, 0.3 + Math.sin(t * 2) * 0.12, 0)), u = (k + 0.5) / 8, q = bow.clone().lerp(AN, u); q.y = bow.y * (1 - u) + (y0 - 0.05) * u - Math.sin(u * Math.PI) * 0.15 * (0.5 + 0.5 * Math.sin(t * 2)); return { x: q.x, y: q.y, z: q.z, ry: Math.atan2(-d.z, d.x) + (k % 2) * Math.PI / 2 }; } });
    moving.push({ geo: merge(part(new THREE.SphereGeometry(0.22, 14, 10), 'B'), part(cyl(0.03, 0.03, 0.4, 6), K.dark, { p: [0, 0.3, 0] })), pivot: AN.toArray(), anim: (t) => ({ y: Math.sin(t * 2.2) * 0.08, rz: Math.sin(t * 1.7) * 0.2 }) });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.4, y0, 3.2], topAt: [RX + 0.9, y0 + 1.6, RZ - 0.6] };
  },

  // Microscope (life-science tools, diagnostics labs, clinical research): every test, fast and
  // right. A courier brings samples in; capped tubes ride the automation track through the
  // analysers and a green tick pops as each result comes out; a pipetting robot works a well
  // plate; the big microscope's view of moving cells glows on the wall.
  'health:7': () => {
    const R = rand(1601), out = [], moving = [];
    out.push(slab('#e3e8ec'), labWalls());
    // ---- the big microscope at the back left and its wall view
    const MX = -3.3, MZ = -3.4;
    out.push(part(rbox(1.8, 0.3, 1.4, 0.1), K.white, { p: [MX, y0 + 0.15, MZ] }), part(extrude([[-0.3, 0], [0.3, 0], [0.3, 1.2], [0.0, 2.2], [-0.45, 2.2], [-0.3, 1.2]], 0.5), 'A', { p: [MX - 0.5, y0 + 0.3, MZ] }));
    out.push(part(rbox(1.2, 0.12, 1.0, 0.04), '#3a3f47', { p: [MX + 0.15, y0 + 1.0, MZ] }), part(cyl(0.08, 0.08, 0.04, 12), '#fff2c6', { p: [MX + 0.15, y0 + 1.07, MZ] }));
    out.push(part(cyl(0.18, 0.2, 1.1, 18), K.white, { p: [MX + 0.15, y0 + 1.95, MZ], r: [0, 0, 0.0] }), part(cyl(0.3, 0.3, 0.25, 18), K.dark, { p: [MX + 0.15, y0 + 1.45, MZ] }), ring(3, (a) => part(cyl(0.06, 0.05, 0.3, 10), K.steel, { p: [MX + 0.15 + Math.cos(a) * 0.15, y0 + 1.25, MZ + Math.sin(a) * 0.15] })));
    out.push(part(cyl(0.12, 0.1, 0.6, 14), K.white, { p: [MX - 0.15, y0 + 2.65, MZ], r: [0, 0, 0.6] }), part(cyl(0.12, 0.12, 0.1, 14), K.dark, { p: [MX - 0.38, y0 + 2.92, MZ], r: [0, 0, 0.6] }), part(cyl(0.22, 0.22, 0.28, 16), 'Ad', { p: [MX - 0.45, y0 + 1.4, MZ + 0.3], r: [Math.PI / 2, 0, 0] }));
    const VX = -0.8, VY = y0 + 1.45, VR = 0.85;
    out.push(part(cyl(VR + 0.08, VR + 0.08, 0.08, 40), K.dark, { p: [VX, VY, -4.95], r: [Math.PI / 2, 0, 0] }), part(cyl(VR, VR, 0.1, 40), '#f6e9f2', { p: [VX, VY, -4.94], r: [Math.PI / 2, 0, 0] }));
    // ---- the automation track: a loop through two analysers
    const track = curve([[-1.6, 0, -0.4], [2.8, 0, -0.4], [3.4, 0, 0.4], [2.8, 0, 1.2], [-1.6, 0, 1.2], [-2.2, 0, 0.4]], true), TY = y0 + 0.8;
    out.push(part(tubeOn(track, 0.16, hi() ? 160 : 40), '#c9ced6', { p: [0, TY - 0.08, 0] }), part(tubeOn(curve(track.points.map((p) => [p.x, p.y, p.z]), true), 0.1, hi() ? 160 : 40), '#3a3f47', { p: [0, TY - 0.02, 0] }));
    for (let i = 0; i < 10; i++) { const p = track.getPointAt(i / 10); out.push(part(box(0.1, TY - 0.1 - y0, 0.1), '#9aa1a9', { p: [p.x, y0 + (TY - 0.1 - y0) / 2, p.z] })); }
    const analyser = (x, c) => out.push(part(rbox(1.3, 1.3, 1.4, 0.08), K.white, { p: [x, y0 + 0.95, -0.4] }), part(box(1.32, 0.18, 1.42), c, { p: [x, y0 + 1.5, -0.4] }), part(rbox(0.7, 0.4, 0.04, 0.02), '#1d2a33', { p: [x, y0 + 1.1, 0.31] }), part(box(0.5, 0.06, 0.05), '#62d35f', { p: [x, y0 + 1.1, 0.33] }));
    analyser(0.0, 'A'); analyser(1.8, 'B');
    // ---- the pipetting robot's deck at the front left
    const GX = -3.0, GZ = 2.8;
    out.push(part(rbox(2.0, 0.8, 1.4, 0.06), '#d8dde3', { p: [GX, y0 + 0.4, GZ] }), [-0.95, 0.95].map((dx) => part(box(0.1, 1.0, 1.3), '#9aa1a9', { p: [GX + dx, y0 + 1.3, GZ] })), part(box(2.0, 0.12, 0.12), '#9aa1a9', { p: [GX, y0 + 1.82, GZ - 0.6] }), part(box(2.0, 0.12, 0.12), '#9aa1a9', { p: [GX, y0 + 1.82, GZ + 0.6] }));
    out.push(part(rbox(0.9, 0.08, 0.6, 0.02), K.white, { p: [GX - 0.3, y0 + 0.84, GZ] }));
    if (hi()) for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) out.push(part(cyl(0.035, 0.035, 0.02, 8), ['#f39ab8', '#8fc4e8', '#f2c94c'][(i + j) % 3], { p: [GX - 0.68 + i * 0.11, y0 + 0.89, GZ - 0.22 + j * 0.11] }));
    out.push(part(rbox(0.4, 0.15, 0.5, 0.03), '#3d7be0', { p: [GX + 0.55, y0 + 0.88, GZ] }));
    // A results screen beside the track.
    out.push(part(rbox(1.2, 0.8, 0.06, 0.03), '#1d2a33', { p: [3.6, y0 + 1.6, -1.6], r: [0, -0.3, 0] }), part(cyl(0.04, 0.04, 1.2, 8), K.dark, { p: [3.6, y0 + 0.6, -1.6] }));
    [[4.5, 4.4], [-4.5, 0.4]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55), part(cyl(0.3, 0.25, 0.4, 16), '#c9ced6', { p: [x, y0 + 0.2, z] })));
    // ---- moving parts
    // Cells drifting in the wall view.
    for (let k = 0; k < 7; k++) { const a0 = R() * TAU, r0 = R() * 0.55; moving.push({ geo: merge(part(new THREE.SphereGeometry(0.16, 14, 10), k % 3 ? '#d98bc0' : '#9b7fd8', { s: [1, 1, 0.3] }), part(new THREE.SphereGeometry(0.07, 10, 8), '#6a3d8f', { p: [0.03, 0.02, 0.03], s: [1, 1, 0.4] })), pivot: [VX, VY, -4.86], anim: (t) => { const a = a0 + t * 0.15 * (k % 2 ? 1 : -1), r = r0 + Math.sin(t * 0.5 + k) * 0.1; return { x: Math.cos(a) * r, y: Math.sin(a) * r, rz: t * 0.3 + k, s: 1 + Math.sin(t * 2 + k) * 0.08 }; } }); }
    // Tubes ride the track; a green tick pops over the analysers as each result comes out.
    const caps = ['#e5533d', '#7d3fbf', '#3d7be0', '#f2c94c', '#5fae5b', '#e5533d', '#3d7be0', '#f39ab8'];
    for (let k = 0; k < 8; k++) moving.push({ geo: tubeGeo(caps[k]), pivot: [0, TY, 0], anim: (t) => { const { p } = along(track, cyc(t, 16, k / 8)); return { x: p.x, z: p.z }; } });
    [0.0, 1.8].forEach((x, i) => moving.push({ geo: tickGeo(0.3), pivot: [x, y0 + 2.0, -0.4], anim: (t) => { const f = cyc(t, 2, i * 0.5); return { y: easeOut(f) * 0.5, s: life(f, 0, 0.12, 0.6, 0.8) }; } }));
    // The results screen ticks through a list.
    for (let k = 0; k < 3; k++) moving.push({ geo: merge(part(box(0.7, 0.08, 0.02), '#8fa6b8', { p: [0.1, 0, 0] }), part(cyl(0.06, 0.06, 0.02, 12), '#62d35f', { p: [-0.35, 0, 0], r: [Math.PI / 2, 0, 0] })), pivot: [3.6 + Math.sin(-0.6) * -0.04, y0 + 1.85 - k * 0.2, -1.6 + 0.04], anim: (t) => ({ ry: -0.3, s: (Math.floor(t * 1.2) % 4) > k ? 1 : 0.001 }) });
    // The pipette head: across the plate, down into a well, up, over to the reservoir.
    const gan = moving.length;
    moving.push({ geo: part(box(0.14, 0.14, 1.3), '#5b616b'), pivot: [GX, y0 + 1.82, GZ], anim: (t) => ({ x: -0.6 + cyc(t, 4) * 0.7 + (Math.floor(t / 4) % 2) * 0.0 }) });
    moving.push({ geo: merge(part(rbox(0.26, 0.4, 0.26, 0.05), 'A'), ring(4, (a, i) => part(cyl(0.015, 0.008, 0.3, 6), K.white, { p: [0, -0.35, -0.15 + i * 0.1] }))), pivot: [0, -0.2, 0], parent: gan, anim: (t) => { const f = cyc(t, 1); return { y: -bump(f, 0.5, 0.12) * 0.32, z: Math.floor(t) % 4 * 0.11 - 0.17 }; } });
    // The courier: from the van at the front right to the track, with a cooler.
    out.push(place(van(K.white, 'A'), { p: [3.4, y0, 3.6], r: [0, Math.PI, 0] }));
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, 10), k = f < 0.45 ? easeIO(f / 0.45) : f < 0.55 ? 1 : 1 - easeIO(win(f, 0.55, 1)), x = 2.6 - k * 0.9, z = 3.1 - k * 1.5; return { x, z, ry: f < 0.5 ? Math.atan2(1.5, -0.9) : Math.atan2(-1.5, 0.9), still: f > 0.45 && f < 0.55 }; }, { shirt: 'B', pants: '#2b3a55', y: y0, carry: part(rbox(0.4, 0.3, 0.3, 0.05), K.white, { p: [0.3, 0.9, 0] }) }));
    // A scientist at the microscope.
    moving.push(...walker(moving.length, (t) => ({ x: MX + 1.1, z: MZ + 0.4, ry: Math.PI - 0.4 + Math.sin(t * 0.5) * 0.15, still: true }), { shirt: K.white, pants: '#3b4a5c', y: y0 }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.4, y0, 0.0], topAt: [0.0, y0 + 1.6, -0.4] };
  },

  // Lab (chemicals, materials, industrial gases, flavours): molecules into materials. Distillation
  // columns vent steam and the cracker's flame flickers; product pulses along the pipe rack from the
  // reactor, its agitator turning, to the silo, which pours pellets into a hopper car; out front a
  // big ball-and-stick molecule turns.
  'chem:0': () => {
    const R = rand(1701), out = [], moving = [];
    out.push(slab('#c4c1ba'));
    // ---- distillation columns with platforms and ladders, back left
    const cols = [[-3.7, -3.6, 0.55, 4.9], [-2.3, -4.0, 0.42, 4.1], [-1.3, -3.2, 0.32, 3.3]];
    cols.forEach(([x, z, r, h], i) => {
      out.push(part(cyl(r, r, h, 24), '#e3e6ea', { p: [x, y0 + h / 2, z] }), part(new THREE.SphereGeometry(r, 20, 10, 0, TAU, 0, Math.PI / 2), '#e3e6ea', { p: [x, y0 + h, z] }), part(cyl(r * 1.02, r * 1.02, 0.25, 24), i === 0 ? 'A' : 'B', { p: [x, y0 + h * 0.75, z] }));
      for (let y = 1.4; y < h - 0.4; y += 1.4) out.push(part(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.06, 24, 1, false, -0.4, Math.PI * 1.2), '#7d8792', { p: [x, y0 + y, z] }), part(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.35, 24, 1, true, -0.4, Math.PI * 1.2), '#f2c94c', { p: [x, y0 + y + 0.18, z] }));
      out.push(part(box(0.3, h - 0.3, 0.04), K.steelDk, { p: [x + r + 0.05, y0 + h / 2, z + 0.1], r: [0, 0, 0] }), part(cyl(0.06, 0.06, 0.6, 8), K.steelDk, { p: [x, y0 + h + r + 0.2, z] }));
    });
    // The cracker furnace with its stack.
    out.push(part(rbox(1.6, 1.4, 1.0, 0.04), '#b0643c', { p: [-3.5, y0 + 0.7, -1.4] }), part(rbox(1.7, 0.2, 1.1, 0.03), '#3a3f47', { p: [-3.5, y0 + 1.5, -1.4] }), part(cyl(0.2, 0.25, 2.2, 14), '#9aa1a9', { p: [-3.0, y0 + 2.6, -1.4] }));
    for (let i = 0; i < 4; i++) out.push(part(rbox(0.22, 0.22, 0.04, 0.02), '#ff9a3a', { p: [-4.0 + i * 0.32, y0 + 0.45, -0.89] }));
    // ---- pressure spheres on legs, back right
    [[2.0, -3.6, 1.05], [3.8, -2.6, 0.85]].forEach(([x, z, r], i) => {
      ring(6, (a) => out.push(part(cyl(0.06, 0.06, r + 0.5, 8), '#7d8792', { p: [x + Math.cos(a) * r * 0.85, y0 + (r + 0.5) / 2, z + Math.sin(a) * r * 0.85] })));
      out.push(part(new THREE.SphereGeometry(r, 28, 18), K.white, { p: [x, y0 + r + 0.6, z] }), part(torus(r * 1.0, 0.04, TAU, 40), i ? 'B' : 'A', { p: [x, y0 + r + 0.6, z], r: [Math.PI / 2, 0, 0] }));
    });
    // ---- the reactor, centre
    const RX = 0.4, RZ = -1.0;
    out.push(part(lathe([[0, 0], [0.7, 0.05], [0.85, 0.35], [0.85, 1.7], [0.6, 2.05], [0, 2.1]], 32), '#d8dde3', { p: [RX, y0 + 0.5, RZ] }), ring(4, (a) => part(box(0.12, 0.6, 0.12), '#7d8792', { p: [RX + Math.cos(a) * 0.7, y0 + 0.3, RZ + Math.sin(a) * 0.7] })), part(cyl(0.87, 0.87, 0.18, 32), 'A', { p: [RX, y0 + 1.6, RZ] }));
    out.push(part(rbox(0.4, 0.4, 0.4, 0.06), K.dark, { p: [RX, y0 + 2.85, RZ] }), part(rbox(1.0, 0.12, 0.12, 0.03), '#f2c94c', { p: [RX - 0.6, y0 + 2.3, RZ + 0.75] }));
    // ---- the pipe rack from the reactor to the silo at the front left, with a hopper car
    const rack = curve([[RX - 0.9, y0 + 1.3, RZ], [-1.0, y0 + 1.6, 0.6], [-2.6, y0 + 1.6, 1.4], [-3.4, y0 + 2.6, 2.4]]);
    [-0.15, 0, 0.15].forEach((d, i) => out.push(part(tubeOn(curve(rack.points.map((p) => [p.x + d, p.y, p.z + d])), 0.07), ['#9aa1a9', 'B', '#d8a33a'][i])));
    [[-1.0, 0.6], [-2.6, 1.4]].forEach(([x, z]) => out.push(part(box(0.1, 1.6, 0.1), K.steelDk, { p: [x, y0 + 0.8, z] })));
    const SX = -3.6, SZ = 2.7;
    out.push(part(lathe([[0.15, 0], [0.7, 0.6], [0.75, 0.65], [0.75, 2.5], [0.5, 2.85], [0, 2.9]], 28), '#eef0f2', { p: [SX, y0 + 1.0, SZ] }), ring(4, (a) => part(box(0.1, 1.2, 0.1), '#7d8792', { p: [SX + Math.cos(a) * 0.65, y0 + 0.6, SZ + Math.sin(a) * 0.65] })), part(cyl(0.77, 0.77, 0.2, 28), 'B', { p: [SX, y0 + 3.0, SZ] }));
    out.push(part(box(10.4, 0.06, 1.0), '#7a6a5a', { p: [0, y0 + 0.03, 4.35] }), [3.95, 4.75].map((z) => part(new THREE.BoxGeometry(10.4, 0.08, 0.06), K.steel, { p: [0, y0 + 0.1, z] })));
    // ---- the molecule sign's plinth, front right
    const NX = 2.6, NZ = 1.8;
    out.push(part(cyl(0.9, 1.0, 0.5, 28), K.stone, { p: [NX, y0 + 0.25, NZ] }), part(cyl(1.02, 1.04, 0.14, 28), 'A', { p: [NX, y0 + 0.07, NZ] }), part(cyl(0.06, 0.06, 0.8, 8), K.steelDk, { p: [NX, y0 + 0.9, NZ] }));
    // ---- moving parts
    // The molecule: a ring of carbon with its neighbours, turning slowly.
    const atoms = [], bonds = [], ringPts = ring(6, (a) => new V(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0));
    ringPts.forEach((p, i) => { atoms.push(part(new THREE.SphereGeometry(0.26, 18, 12), K.dark, { p: p.toArray() })); bonds.push(beam(p.toArray(), ringPts[(i + 1) % 6].toArray(), 0.08, '#c9ced6')); const out2 = p.clone().multiplyScalar(1.75); atoms.push(part(new THREE.SphereGeometry(0.2, 16, 10), i % 3 ? K.white : i === 0 ? 'A' : 'B', { p: out2.toArray() })); bonds.push(beam(p.toArray(), out2.toArray(), 0.07, '#c9ced6')); });
    moving.push({ geo: merge(atoms, bonds), pivot: [NX, y0 + 2.6, NZ], anim: (t) => ({ ry: t * 0.6, rx: Math.sin(t * 0.4) * 0.3 }) });
    // Steam from the column vents, flame in the furnace stack.
    cols.forEach(([x, z, r, h], i) => { for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.25, 10, 7), '#f4f2ee'), pivot: [x, y0 + h + r + 0.5, z], anim: (t) => { const u = cyc(t, 2.6, k / 3 + i * 0.2); return { y: u * 0.9, x: u * 0.5, s: (0.5 + u) * (1 - u) * 1.8 + 0.001 }; } }); });
    moving.push({ geo: flameGeo(), pivot: [-3.0, y0 + 3.7, -1.4], anim: (t) => ({ s: 0.35 + Math.sin(t * 11) * 0.04, sy: 0.4 + Math.sin(t * 7) * 0.06 }) });
    // The reactor's agitator: its shaft and paddles turn; product pulses along the rack.
    moving.push({ geo: merge(part(cyl(0.05, 0.05, 0.6, 8), K.steel), part(box(0.5, 0.1, 0.06), K.steel, { p: [0, 0.3, 0] })), pivot: [RX, y0 + 3.2, RZ], anim: (t) => ({ ry: t * 4 }) });
    for (let k = 0; k < 4; k++) moving.push({ geo: merge(part(cyl(0.1, 0.1, 0.24, 12), 'B', { r: [0, 0, Math.PI / 2] }), part(torus(0.09, 0.02, TAU, 12), K.white, { r: [0, Math.PI / 2, 0] })), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 4, k / 4), p = rack.getPointAt(u), d = rack.getTangentAt(u); return { x: p.x, y: p.y, z: p.z, q: new THREE.Quaternion().setFromUnitVectors(new V(1, 0, 0), d) }; } });
    // The silo pours pellets into the hopper car; the car rolls on when full and the next comes in.
    const pellet = new THREE.SphereGeometry(0.04, 5, 4);
    for (let k = 0; k < 10; k++) moving.push({ geo: part(pellet, k % 2 ? K.white : 'A'), pivot: [SX, y0 + 0.95, SZ], anim: (t) => { const f = cyc(t, 12), u = cyc(t, 0.5, k / 10); return { y: -u * 0.4, x: Math.sin(k * 2.4) * 0.06, z: Math.cos(k * 2.4) * 0.06, s: f > 0.2 && f < 0.6 ? 1 : 0.001 }; } });
    moving.push({ geo: merge(part(extrude([[-1.2, 0.35], [1.2, 0.35], [1.0, 1.25], [-1.0, 1.25]], 0.9), '#eef0f2', { r: [0, 0, 0] }), part(box(2.0, 0.12, 0.92), 'A', { p: [0, 1.0, 0] }), [-0.8, 0.8].map((x) => part(lathe([[0, 0], [0.3, 0.25], [0, 0.26]], 12), '#9aa1a9', { p: [x, 0.1, 0] })), [-0.8, 0.8].flatMap((x) => [-0.4, 0.4].map((z) => part(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12), '#1d1f24', { p: [x, 0.16, z], r: [Math.PI / 2, 0, 0] })))),
      pivot: [0, y0 + 0.08, 4.35], anim: (t) => { const f = cyc(t, 12), x = f < 0.15 ? SX - 6 + 6 * easeOut(f / 0.15) : f < 0.65 ? SX : SX + 10 * easeIn(win(f, 0.65, 1)); return { x, s: clamp01((5.0 - Math.abs(x)) / 0.8) * 0.999 + 0.001 }; } });
    moving.push(...walker(moving.length, (t) => { const k = Math.sin(t * 0.35); return { x: 0.6 + k * 1.4, z: 0.6, ry: Math.cos(t * 0.35) > 0 ? 0 : Math.PI }; }, { shirt: K.orange, pants: '#2b3a55', y: y0, carry: part(cyl(0.05, 0.08, 0.2, 10), K.white, { p: [0.25, 0.95, 0.2] }) }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [3.4, y0, -0.4], topAt: [RX, y0 + 3.05, RZ] };
  },

  // Heartbeat (medical devices, supplies, implants, wearables): devices that keep people going. A
  // big heart beats in time with the trace racing across the wall monitor; a patient rests by a
  // bedside monitor and a dripping IV; a supply cart rolls through; and in rehab a patient with a
  // new knee walks the parallel bars beside the physio.
  'health:1': () => {
    const R = rand(1801), out = [], moving = [];
    out.push(slab('#e6ecef'), labWalls(2.4, '#eaf2f4'));
    out.push(part(box(10.2, 0.012, 4.0), '#d7e4ea', { p: [0, y0 + 0.006, -3.0] }));
    // ---- the ECG on the back wall: a glowing trace, with the bright dot racing along it
    const beat = (x) => { const u = ((x % 2.4) + 2.4) % 2.4; return u > 1.0 && u < 1.1 ? (u - 1.0) * 6 : u >= 1.1 && u < 1.25 ? 0.6 - (u - 1.1) * 8 : u >= 1.25 && u < 1.35 ? -0.6 + (u - 1.25) * 6 : u > 1.6 && u < 1.9 ? Math.sin((u - 1.6) / 0.3 * Math.PI) * 0.15 : 0; };
    const ecgPts = []; for (let x = -4.6; x <= 0.2; x += 0.04) ecgPts.push([x, y0 + 1.5 + beat(x + 4.6) * 0.8, -4.98]);
    out.push(part(rbox(5.2, 1.6, 0.06, 0.04), '#14232b', { p: [-2.2, y0 + 1.5, -5.0] }), part(tube(ecgPts, 0.03), '#62e38a'));
    // ---- the big heart on its plinth
    const HX = -1.6, HZ = -1.2;
    out.push(part(cyl(0.9, 1.0, 0.5, 32), K.white, { p: [HX, y0 + 0.25, HZ] }), part(cyl(1.02, 1.04, 0.14, 32), 'A', { p: [HX, y0 + 0.07, HZ] }), part(cyl(0.08, 0.1, 0.6, 10), K.steel, { p: [HX, y0 + 0.8, HZ] }));
    // ---- the patient's bed, monitor and IV at the back right
    const BX = 2.6, BZ = -3.6;
    out.push(place(bed('A'), { p: [BX, y0, BZ] }), part(cyl(0.04, 0.04, 2.0, 8), K.steel, { p: [BX - 1.4, y0 + 1.0, BZ + 0.7] }), part(cyl(0.3, 0.3, 0.04, 5), K.steelDk, { p: [BX - 1.4, y0 + 0.04, BZ + 0.7] }), part(rbox(0.3, 0.42, 0.1, 0.06), '#d9eef7', { p: [BX - 1.4, y0 + 1.75, BZ + 0.7] }), part(tube([[BX - 1.4, y0 + 1.5, BZ + 0.7], [BX - 1.1, y0 + 1.0, BZ + 0.5], [BX - 0.5, y0 + 0.95, BZ + 0.2]], 0.012), '#cfe6ef'));
    out.push(part(rbox(0.8, 0.6, 0.12, 0.04), '#3a3f47', { p: [BX + 1.6, y0 + 1.6, -4.95] }), part(box(0.68, 0.48, 0.02), '#0f1b22', { p: [BX + 1.6, y0 + 1.6, -4.88] }), part(rbox(0.5, 0.4, 0.4, 0.04), '#d8dde3', { p: [BX + 1.6, y0 + 0.2, BZ + 0.2] }));
    // ---- rehab: parallel bars at the front
    const PZ = 3.0, PX0 = -1.6, PX1 = 2.2;
    [PZ - 0.45, PZ + 0.45].forEach((z) => { out.push(part(cyl(0.035, 0.035, PX1 - PX0, 10), K.steel, { p: [(PX0 + PX1) / 2, y0 + 0.95, z], r: [0, 0, Math.PI / 2] })); [PX0, (PX0 + PX1) / 2, PX1].forEach((x) => out.push(part(cyl(0.035, 0.035, 0.95, 8), K.steelDk, { p: [x, y0 + 0.47, z] }))); });
    out.push(part(rbox(PX1 - PX0 + 0.6, 0.04, 1.4, 0.02), '#8fc4e8', { p: [(PX0 + PX1) / 2, y0 + 0.02, PZ] }));
    [[4.5, 4.4], [-4.5, 0.6], [4.5, 0.0]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55), part(cyl(0.3, 0.25, 0.4, 16), '#c9ced6', { p: [x, y0 + 0.2, z] })));
    // ---- moving parts
    const P = 1.2, pulse = (t) => { const f = cyc(t, P); return bump(f, 0.1, 0.05) * 0.14 + bump(f, 0.28, 0.06) * 0.08; };
    moving.push({ geo: merge(part(heartGeo(1.1, 0.7), 'A'), part(heartGeo(0.82, 0.74).translate(-0.12, 0.12, 0.02), 'Ad')), pivot: [HX, y0 + 2.2, HZ], anim: (t) => { const k = pulse(t); return { s: 1 + k, ry: Math.PI / 4 + Math.sin(t * 0.4) * 0.3 }; } });
    // The dot racing along the trace, in time with the heart.
    moving.push({ geo: part(new THREE.SphereGeometry(0.08, 12, 8), '#d9ffe6'), pivot: [-4.6, y0 + 1.5, -4.95], anim: (t) => { const u = cyc(t, P * 2), x = u * 4.8; return { x, y: beat(x) * 0.8 }; } });
    // The bedside monitor's own small trace dot, and the IV drip.
    moving.push({ geo: part(new THREE.SphereGeometry(0.03, 8, 6), '#62e38a'), pivot: [BX + 1.3, y0 + 1.6, -4.86], anim: (t) => { const u = cyc(t, P), x = u * 0.6; return { x, y: beat(x * 4 + 1.0) * 0.2 }; } });
    moving.push({ geo: part(new THREE.SphereGeometry(0.03, 8, 6), '#bfe3f2', { s: [1, 1.6, 1] }), pivot: [BX - 1.4, y0 + 1.5, BZ + 0.7], anim: (t) => { const u = cyc(t, 1.5); return { y: -u * 0.18, s: u < 0.9 ? 1 : 0.001 }; } });
    // A nurse checks on the patient.
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, 14), k = f < 0.4 ? easeIO(f / 0.4) : f < 0.6 ? 1 : 1 - easeIO(win(f, 0.6, 1)); return { x: 0.6 + k * 1.4, z: -2.0 - k * 0.6, ry: f < 0.5 ? -0.4 : Math.PI - 0.4, still: f > 0.4 && f < 0.6 }; }, { shirt: '#5fb7c9', pants: '#5fb7c9', y: y0 }));
    // The rehab patient walks the bars (knee brace on), the physio alongside.
    const px = (t) => { const f = cyc(t, 12); return PX0 + 0.3 + (PX1 - PX0 - 0.6) * (f < 0.5 ? easeIO(f * 2) : 1 - easeIO((f - 0.5) * 2)); };
    const dir = (t) => (cyc(t, 12) < 0.5 ? 0 : Math.PI);
    moving.push(...walker(moving.length, (t) => ({ x: px(t), z: PZ, ry: dir(t) }), { shirt: 'B', pants: '#3b4a5c', y: y0, carry: part(cyl(0.09, 0.09, 0.14, 10), 'A', { p: [0, 0.5, 0.1] }) }));
    moving.push(...walker(moving.length, (t) => ({ x: px(t) + 0.2, z: PZ + 0.9, ry: dir(t) }), { shirt: '#5fae5b', pants: '#2b3a55', y: y0 }));
    // A supply cart rolls through, stocked with boxes.
    const cartPath = curve([[-4.4, 0, 4.4], [-3.0, 0, 1.4], [0.4, 0, 0.8], [3.2, 0, 1.2], [3.8, 0, 3.8], [0.6, 0, 4.5]], true);
    moving.push({ geo: merge(part(rbox(1.0, 0.06, 0.6, 0.02), K.steel, { p: [0, 0.3, 0] }), part(rbox(1.0, 0.06, 0.6, 0.02), K.steel, { p: [0, 0.75, 0] }), [[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].flatMap(([x, z]) => [part(cyl(0.025, 0.025, 0.8, 6), K.steelDk, { p: [x, 0.45, z] }), part(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), '#1d1f24', { p: [x, 0.07, z], r: [Math.PI / 2, 0, 0] })]),
      [[-0.25, 0.42, 'A'], [0.2, 0.42, K.white], [-0.2, 0.87, K.white], [0.25, 0.87, 'B']].map(([x, y, c]) => part(rbox(0.38, 0.22, 0.45, 0.03), c, { p: [x, y, 0] }))),
      pivot: [0, y0, 0], anim: (t) => { const { p, ry } = along(cartPath, cyc(t, 20)); return { x: p.x, z: p.z, ry }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.6, y0, 2.2], topAt: [BX + 1.6, y0 + 0.4, BZ + 0.2] };
  },

  // Light bulb (utilities, nuclear and gas generation, fusion): power on demand. The plant's
  // cooling tower steams beside its glowing reactor ring and pulses of power run along the pylons
  // into town; as the sun sets and the moon rises, windows and street lamps come on house by house
  // and the giant bulb glows, then the day comes back.
  'power:2': () => {
    const R = rand(1901), out = [], moving = [];
    out.push(slab('#9fcf7a'));
    // ---- the plant, back left: cooling tower, reactor hall with its ring, a fence
    const CX = -3.5, CZ = -3.3;
    out.push(part(lathe([[1.5, 0], [1.2, 1.4], [1.0, 2.6], [1.1, 3.4]], 40), '#d8dde3', { p: [CX, y0, CZ] }), part(new THREE.CylinderGeometry(1.09, 1.09, 0.3, 40, 1, true), 'A', { p: [CX, y0 + 3.1, CZ] }));
    const RX = -1.2, RZ = -3.8;
    out.push(part(rbox(2.2, 1.4, 1.8, 0.06), '#eef0f2', { p: [RX, y0 + 0.7, RZ] }), part(new THREE.SphereGeometry(0.9, 28, 14, 0, TAU, 0, Math.PI / 2), '#e3e6ea', { p: [RX, y0 + 1.4, RZ] }), part(box(2.22, 0.2, 1.82), 'A', { p: [RX, y0 + 1.2, RZ] }));
    // ---- pylons from the plant to the substation to town, with sagging lines
    const pyl = [[1.2, -2.4], [2.9, -0.9], [3.6, 1.0]], PH = 3.0;
    pyl.forEach(([x, z]) => out.push(place(pylon(PH), { p: [x, y0, z], r: [0, -1.1, 0] })));
    const attach = [[RX + 1.0, y0 + 1.1, RZ + 0.4], ...pyl.map(([x, z]) => [x, y0 + PH * 0.72 - 0.12, z]), [3.9, y0 + 0.9, 2.6]];
    const lines = [];
    for (let i = 0; i < attach.length - 1; i++) { const a = new V(...attach[i]), b = new V(...attach[i + 1]), m = a.clone().lerp(b, 0.5).add(new V(0, -0.35, 0)); lines.push(curve([a.toArray(), m.toArray(), b.toArray()])); }
    lines.forEach((c) => out.push(part(tubeOn(c, 0.018, 24), '#3a3f47')));
    // The substation by the town.
    out.push(part(rbox(1.4, 0.06, 1.0, 0.02), '#9aa1a9', { p: [4.0, y0 + 0.03, 2.8] }), part(rbox(0.6, 0.7, 0.5, 0.04), '#7d8792', { p: [4.2, y0 + 0.4, 3.0] }), part(cyl(0.12, 0.12, 0.5, 10), '#d8dde3', { p: [3.9, y0 + 0.6, 2.6] }), part(cyl(0.12, 0.12, 0.5, 10), '#d8dde3', { p: [3.9, y0 + 0.6, 2.95] }));
    // ---- the town at the front left, its windows to light
    const homes = [[0.0, 1.6, 0.2], [1.8, 2.4, 0.0], [0.2, 3.5, 0.3], [2.0, 3.9, -0.2], [3.6, 3.9, 0]];
    homes.forEach(([x, z, ry], i) => out.push(place(home(['#f3ead8', '#e4ecf0', '#efe2cc', '#f6f0e4', '#e9eef2'][i], ['#7d6a5a', '#5a6b7d', '#a35a3c', 'Bd', '#5a6b7d'][i], 1.4, 1.2, 0.9), { p: [x, y0, z], r: [0, ry, 0] })));
    const lamps = [[1.0, 0.6], [3.0, 1.8], [-0.9, 2.8]];
    lamps.forEach(([x, z]) => out.push(lampPost(x, y0, z, -Math.PI / 2)));
    // ---- the giant bulb on its plinth, centre
    const GX = -2.6, GZ = 2.0;
    out.push(part(cyl(0.8, 0.9, 0.4, 28), K.stone, { p: [GX, y0 + 0.2, GZ] }), part(cyl(0.92, 0.94, 0.12, 28), 'A', { p: [GX, y0 + 0.06, GZ] }));
    out.push(part(cyl(0.38, 0.38, 0.55, 24), '#b5bcc6', { p: [GX, y0 + 0.68, GZ] }));
    if (hi()) for (let i = 0; i < 5; i++) out.push(part(torus(0.39, 0.03, TAU, 24), '#9aa1a9', { p: [GX, y0 + 0.47 + i * 0.1, GZ], r: [Math.PI / 2, 0, 0] }));
    out.push(part(lathe([[0.38, 0], [0.42, 0.25], [0.85, 0.85], [0.9, 1.35], [0.6, 1.85], [0, 2.0]], 36), '#f4f7fa', { p: [GX, y0 + 0.95, GZ] }));
    [[-4.4, 4.3], [4.5, -4.4], [-0.4, -1.4], [-4.5, 0.2]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.2)));
    // ---- moving parts: one 14 s day
    const P = 14, F = (t) => cyc(t, P), night = (f) => clamp01(win(f, 0.38, 0.5) - win(f, 0.86, 0.96));
    // Sun and moon arc across the back.
    const arc = (u) => new V(-4.2 + u * 8.4, y0 + 2.5 + Math.sin(u * Math.PI) * 3.0, -4.6);
    moving.push({ geo: part(new THREE.SphereGeometry(0.42, 20, 14), '#ffd23f'), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = arc(clamp01(((f + 0.06) % 1) / 0.56)); return { x: p.x, y: p.y, z: p.z, s: night(f) < 0.5 ? 1 : 0.001 }; } });
    moving.push({ geo: merge(part(new THREE.SphereGeometry(0.34, 20, 14), '#eef2f7'), part(new THREE.SphereGeometry(0.1, 10, 8), '#cfd6de', { p: [0.1, 0.1, 0.3] })), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = arc(win(f, 0.46, 0.94)); return { x: p.x, y: p.y, z: p.z, s: night(f) > 0.5 ? 1 : 0.001 }; } });
    // Windows light up house by house at dusk; the lamps come on.
    homes.forEach(([x, z, ry], i) => { const c = Math.cos(ry), s2 = Math.sin(ry); moving.push({ geo: merge(part(box(0.44, 0.38, 0.06), '#ffd23f', { p: [0.28, 0.62, 0.62] }), part(box(0.3, 0.6, 0.06), '#ffd23f', { p: [-0.25, 0.32, 0.62] }), part(box(0.06, 0.38, 0.44), '#ffd23f', { p: [0.72, 0.62, 0] })), pivot: [x, y0, z], anim: (t) => { const f = F(t); return { ry, s: night(f - i * 0.012) > 0.5 ? 1 : 0.001 }; } }); });
    lamps.forEach(([x, z]) => moving.push({ geo: merge(part(new THREE.SphereGeometry(0.16, 12, 8), '#fff2b0', { p: [0, 3.3, -0.75], s: [1.3, 0.5, 1.3] }), part(cyl(0.9, 0.9, 0.01, 24), '#fbe7a1', { p: [0, 0.015, -0.75] })), pivot: [x, y0, z], anim: (t) => ({ s: night(F(t)) > 0.3 ? 1 : 0.001 }) }));
    // The bulb's filament and glow.
    moving.push({ geo: merge(part(tube([[-0.25, 0, 0], [-0.12, 0.25, 0], [0, 0, 0], [0.12, 0.25, 0], [0.25, 0, 0]], 0.025), '#ffb02e'), part(cyl(0.02, 0.02, 0.6, 6), K.steelDk, { p: [-0.25, -0.3, 0] }), part(cyl(0.02, 0.02, 0.6, 6), K.steelDk, { p: [0.25, -0.3, 0] })), pivot: [GX, y0 + 2.0, GZ], anim: (t) => ({ ry: t * 0.3 }) });
    moving.push({ geo: merge(part(lathe([[0.4, 0], [0.44, 0.25], [0.87, 0.85], [0.92, 1.35], [0.62, 1.87], [0, 2.02]], 36), '#ffe27a'), ring(10, (a) => part(cone(0.07, 0.5, 6), '#fff2b0', { p: [Math.cos(a) * 1.25, 1.2 + Math.sin(a) * 1.25, 0], r: [0, 0, a - Math.PI / 2] }))), pivot: [GX, y0 + 0.94, GZ], anim: (t) => { const k = night(F(t)); return { s: k > 0.05 ? 1.0 + Math.sin(t * 6) * 0.02 : 0.001, ry: Math.PI / 4 }; } });
    // Power pulses run down the lines into town.
    lines.forEach((c, i) => { for (let k = 0; k < 2; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.08, 10, 8), '#ffe27a'), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 1.6, k / 2 + i * 0.2), p = c.getPointAt(u); return { x: p.x, y: p.y, z: p.z, s: 0.6 + night(F(t)) * 0.8 }; } }); });
    // Steam from the cooling tower; the reactor ring glows and turns.
    for (let k = 0; k < 4; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.6, 14, 10), '#f4f2ee'), pivot: [CX, y0 + 3.3, CZ], anim: (t) => { const u = cyc(t, 3.6, k / 4); return { y: u * 1.6, x: u * 0.8, s: (0.4 + u) * (1 - u * 0.8) * 1.5 + 0.001 }; } });
    moving.push({ geo: part(torus(0.62, 0.12, TAU, 40), 'A'), pivot: [RX, y0 + 1.9, RZ], anim: (t) => ({ rx: Math.PI / 2, rz: t * 0.8, s: 1 + Math.sin(t * 3) * 0.04 }) });
    moving.push({ geo: part(torus(0.62, 0.06, TAU, 40), '#ff8fd0'), pivot: [RX, y0 + 1.9, RZ], anim: (t) => ({ rx: Math.PI / 2, rz: -t * 2, s: 1.0 + Math.sin(t * 5) * 0.06 }) });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [3.4, y0, -3.0], topAt: [3.4, y0 + 0.75, 3.8] };
  },

  // Puzzle pieces (IT services, consulting, staffing, HR software): fitting the right people and
  // systems together. Drones lift the last pieces out of the box and set them into a giant floor
  // jigsaw in the brand's colours; when it's whole it glints, and the cycle starts again. Around
  // it, consultants work at their desks.
  'software:6': () => {
    const R = rand(2001), out = [], moving = [];
    out.push(slab('#d9dde2'));
    // ---- the board and its frame
    const N = 4, S = 1.25, BX = 1.0, BZ = 0.8, x0 = BX - (N * S) / 2 + S / 2, z0 = BZ - (N * S) / 2 + S / 2;
    out.push(part(rbox(N * S + 0.5, 0.12, N * S + 0.5, 0.05), 'Ad', { p: [BX, y0 + 0.06, BZ] }), part(box(N * S + 0.1, 0.02, N * S + 0.1), '#3a3f47', { p: [BX, y0 + 0.12, BZ] }));
    // Edges match: a piece's right/bottom edges are tabs when (i + j) is even, blanks when odd.
    const edge = (i, j) => { const e = (i + j) % 2 ? -1 : 1; return [j === 0 ? 0 : -((i + j - 1) % 2 ? -1 : 1), i === N - 1 ? 0 : e, j === N - 1 ? 0 : e, i === 0 ? 0 : -((i - 1 + j) % 2 ? -1 : 1)]; };
    // The picture: a sunrise over hills, in brand and neutral tones, by piece.
    const colour = (i, j) => (j === 0 ? '#f2c94c' : j === 1 ? (i === 1 || i === 2 ? K.orange : '#f6d77a') : j === 2 ? ((i + j) % 2 ? 'A' : 'Ad') : (i % 2 ? 'B' : 'Bd'));
    const missing = [[1, 1], [3, 2], [0, 3], [2, 0]];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (!missing.some(([a, b]) => a === i && b === j)) out.push(part(jigsaw(edge(i, j)), colour(i, j), { p: [x0 + i * S, y0 + 0.12, z0 + j * S], s: [S, 1, S] }));
    // ---- the puzzle box at the back left, lid leaning
    const KX = -3.2, KZ = -2.6;
    out.push(part(rbox(1.8, 0.5, 1.4, 0.05), K.white, { p: [KX, y0 + 0.25, KZ] }), part(box(1.82, 0.12, 1.42), 'A', { p: [KX, y0 + 0.4, KZ] }), part(rbox(1.9, 0.1, 1.5, 0.04), 'A', { p: [KX - 1.15, y0 + 0.75, KZ], r: [0, 0, 1.2] }));
    for (let i = 0; i < 4; i++) out.push(part(jigsaw([0, 1, -1, 0]), ['#f2c94c', 'A', 'B', K.orange][i], { p: [KX - 0.4 + (i % 2) * 0.6, y0 + 0.36 + Math.floor(i / 2) * 0.05, KZ - 0.3 + Math.floor(i / 2) * 0.5], r: [0, i, 0], s: 0.55 }));
    // ---- desks with consultants around the back and left
    const desk = (x, z, ry) => out.push(place(merge(part(rbox(1.3, 0.06, 0.7, 0.02), '#b98a5a', { p: [0, 0.72, 0] }), [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([dx, dz]) => part(box(0.05, 0.72, 0.05), K.dark, { p: [dx, 0.36, dz] })), part(rbox(0.6, 0.4, 0.04, 0.02), '#1d2a33', { p: [0, 1.0, -0.2] }), part(box(0.1, 0.2, 0.05), K.dark, { p: [0, 0.8, -0.22] }), part(rbox(0.5, 0.45, 0.5, 0.06), '#3a3f47', { p: [0, 0.45, 0.6] })), { p: [x, y0, z], r: [0, ry, 0] }));
    [[-0.6, -4.2, 0], [1.2, -4.2, 0], [3.0, -4.2, 0], [-4.2, 0.4, Math.PI / 2], [-4.2, 2.4, Math.PI / 2]].forEach(([x, z, ry]) => desk(x, z, ry));
    [[4.5, 4.4], [-4.5, 4.4], [4.5, -1.2]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55), part(cyl(0.3, 0.25, 0.4, 16), '#c9ced6', { p: [x, y0 + 0.2, z] })));
    // A tall puzzle-piece sculpture at the back right.
    out.push(part(cyl(0.7, 0.8, 0.3, 24), K.stone, { p: [3.4, y0 + 0.15, -3.4] }));
    moving.push({ geo: part(jigsaw([1, -1, 1, 0], 0.3).rotateX(-Math.PI / 2).translate(0, 0.5, 0), 'A', { s: [1.9, 1.9, 1] }), pivot: [3.4, y0 + 0.3, -3.4], anim: (t) => ({ ry: t * 0.4 }) });
    // ---- moving parts (one 10 s cycle)
    const P = 10, F = (t) => cyc(t, P);
    missing.forEach(([i, j], k) => {
      const t0 = 0.05 + k * 0.17, slot = new V(x0 + i * S, y0 + 0.12, z0 + j * S), from = new V(KX + (k % 2) * 0.5 - 0.25, y0 + 0.6, KZ), lift = 1.6;
      const at = (f) => { const u = win(f, t0, t0 + 0.15), e = easeIO(u), p = from.clone().lerp(slot, e); p.y += hop(Math.min(1, u * 1.0)) * lift + (u >= 1 ? 0 : 0); return u >= 1 ? slot.clone() : p; };
      const back = (f) => win(f, 0.9, 0.98);
      moving.push({ geo: part(jigsaw(edge(i, j)), colour(i, j), { s: [S, 1, S] }), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = at(f), b = back(f); if (b > 0) { const q = slot.clone().lerp(from, easeIO(b)); q.y += hop(b) * lift; return { x: q.x, y: q.y, z: q.z, s: 1 - b * 0.6 }; } return { x: p.x, y: p.y + bump(f, t0 + 0.16, 0.01) * 0.1, z: p.z, s: f < t0 ? 0.001 : 1 }; } });
      // Its drone, flying it in and back for the next.
      moving.push({ geo: drone(k % 2 ? 'A' : 'B'), pivot: [0, 0, 0], anim: (t) => { const f = F(t), u = win(f, t0, t0 + 0.15), carry = f >= t0 && u < 1, p = carry ? at(f) : slot.clone().lerp(from, easeIO(win(f, t0 + 0.15, t0 + 0.3))); return { x: p.x, y: (carry ? p.y : y0 + 1.6) + 0.7 + Math.sin(t * 3 + k) * 0.05, z: p.z, s: (f >= t0 - 0.02 && f < t0 + 0.32) ? 1 : 0.001 }; } });
    });
    // When the picture is whole, it glints: sparkles across the board.
    for (let k = 0; k < 6; k++) moving.push({ geo: part(star(0.2, 0.05), '#ffe27a'), pivot: [x0 + (k % 3) * 1.7, y0 + 0.5, z0 + Math.floor(k / 3) * 2.6 + 0.3], anim: (t) => { const f = F(t), u = cyc(t, 0.8, k / 6); return { y: u * 0.4, ry: u * 3, s: f > 0.75 && f < 0.9 ? Math.sin(u * Math.PI) : 0.001 }; } });
    // Consultants at their desks (heads down) and one walking a laptop over.
    [[-0.6, -3.6, Math.PI / 2], [1.2, -3.6, Math.PI / 2], [3.0, -3.6, Math.PI / 2], [-3.6, 0.4, Math.PI], [-3.6, 2.4, Math.PI]].forEach(([x, z, ry], i) => moving.push(...walker(moving.length, (t) => ({ x, z, ry: ry + Math.PI + Math.sin(t * 0.7 + i) * 0.1, still: true }), { shirt: ['A', '#3d7be0', K.white, 'B', '#8a6cf0'][i], pants: '#2b3a55', y: y0 })));
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, 12), k = f < 0.5 ? easeIO(f * 2) : 1 - easeIO((f - 0.5) * 2); return { x: -2.2 + k * 0.4, z: 3.8 - k * 5.2, ry: f < 0.5 ? Math.PI / 2 : -Math.PI / 2 }; }, { shirt: K.orange, pants: '#2b3a55', y: y0, carry: part(rbox(0.36, 0.03, 0.26, 0.01), K.dark, { p: [0.3, 0.95, 0] }) }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-2.9, y0, -1.1], topAt: [KX, y0 + 0.5, KZ + 0.4] };
  },

  // Excavator (engineering and construction, contractors, equipment rental): big projects, built.
  // A bridge goes up over the river: the crawler crane swings the last deck span off the trailer
  // into place; an excavator digs at the river bank and loads a dump truck, which drives off full
  // as an empty one comes back; hard-hat crews work the site.
  'industrial:3': () => {
    const R = rand(2101), out = [], moving = [];
    // ---- ground with a river channel running along z
    const W0 = -1.7, W1 = 0.3, SEA = y0 - 0.12;
    out.push(part(rbox(W0 + 5.2, 0.24, 10.4, 0.06), '#b99a72', { p: [(W0 - 5.2) / 2, 0.12, 0] }), part(rbox(5.2 - W1, 0.24, 10.4, 0.06), '#b99a72', { p: [(W1 + 5.2) / 2, 0.12, 0] }), part(box(W1 - W0, 0.08, 10.4), '#5a6f86', { p: [(W0 + W1) / 2, 0.04, 0] }));
    out.push(part(new THREE.PlaneGeometry(W1 - W0, 10.4).rotateX(-Math.PI / 2), 'W', { p: [(W0 + W1) / 2, SEA, 0] }));
    if (hi()) for (let i = 0; i < 16; i++) out.push(part(new THREE.SphereGeometry(0.12 + R() * 0.12, 7, 5), '#8e8a82', { p: [(R() < 0.5 ? W0 : W1) + (R() - 0.5) * 0.3, y0 - 0.05, -5 + R() * 10], s: [1, 0.6, 1] }));
    // ---- the bridge across, at z = 0: abutments, a pier, three spans in place
    const BZ = -0.4, DY = y0 + 1.2;
    [[W0 - 0.9, 1.4], [W1 + 0.9, 1.4]].forEach(([x, w]) => out.push(part(rbox(w, DY - y0, 1.6, 0.04), '#c9c4b8', { p: [x, y0 + (DY - y0) / 2, BZ] })));
    out.push(part(rbox(0.5, DY - SEA, 1.2, 0.04), '#c9c4b8', { p: [(W0 + W1) / 2, SEA + (DY - SEA) / 2, BZ] }));
    const span = (L) => merge(part(rbox(L, 0.22, 1.5, 0.03), '#9aa1a9'), part(box(L, 0.05, 1.3), '#5b616b', { p: [0, 0.13, 0] }), [-0.72, 0.72].map((z) => part(box(L, 0.2, 0.05), 'A', { p: [0, 0.25, z] })));
    out.push(place(span(2.3), { p: [W0 - 1.75, DY + 0.11, BZ] }), place(span(2.3), { p: [W0 + 0.5, DY + 0.11, BZ] }));
    // Road leading to the bridge on the left; the gap at the right end is the last span's.
    out.push(part(box(2.0, 0.03, 1.4), '#6b6f75', { p: [-4.2, y0 + 0.02, BZ] }), part(extrude([[-1.0, 0], [0.4, 0], [0.4, 1.0]], 1.4), '#b5a58a', { p: [-2.6, y0, BZ] }));
    const GAP = new V(W1 + 1.6, DY + 0.11, BZ);
    // ---- materials on the left bank (pipes, rebar), the dig at the back right on the river bank
    for (let i = 0; i < 5; i++) out.push(part(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 18, 1, true), '#b8b3a8', { p: [-4.2 + (i % 3) * 0.62, y0 + 0.3 + Math.floor(i / 3) * 0.52, -3.4], r: [Math.PI / 2, 0, 0] }));
    for (let i = 0; i < 8; i++) out.push(part(cyl(0.04, 0.04, 2.2, 6), '#8a5a3a', { p: [-3.4, y0 + 0.08 + Math.floor(i / 4) * 0.08, -1.9 + (i % 4) * 0.1], r: [0, 0, Math.PI / 2] }));
    const XX = 3.4, XZ = -3.2;
    out.push(part(lathe([[0, -0.4], [1.0, -0.35], [1.3, 0]], 24), '#8a6a45', { p: [0.9, y0 + 0.01, XZ] }));
    // ---- cones and barriers, a site office
    [[-4.4, 1.6], [-3.4, 1.6], [3.0, 1.4], [4.2, 1.4]].forEach(([x, z]) => out.push(part(cone(0.16, 0.45, 10), (X, Y) => (Y > y0 + 0.22 && Y < y0 + 0.3 ? K.white : K.orange), { p: [x, y0 + 0.22, z] })));
    out.push(part(rbox(2.0, 1.0, 1.0, 0.04), K.white, { p: [-3.6, y0 + 0.5, 3.6] }), part(box(2.02, 0.2, 1.02), 'A', { p: [-3.6, y0 + 0.9, 3.6] }), part(rbox(0.5, 0.35, 0.04, 0.02), '#9fcdea', { p: [-3.3, y0 + 0.6, 4.12] }));
    // ---- the crawler crane at the front right, the trailer with the last span
    const CX = 3.4, CZ = 1.6, CY = y0 + 0.9, TRX = CX, TRZ = 0, toGap = new V(GAP.x - CX, 0, GAP.z - CZ), REACH = toGap.length(), TOP = 3.4;
    const yawGap = Math.atan2(-toGap.z, toGap.x), yawPick = -Math.PI / 2;
    out.push(part(rbox(1.8, 0.4, 1.4, 0.06), '#2b2f36', { p: [CX, y0 + 0.2, CZ] }), [-0.6, 0.6].map((z) => part(rbox(2.0, 0.36, 0.36, 0.14), '#1d1f24', { p: [CX, y0 + 0.18, CZ + z] })));
    const TZ2 = CZ + REACH;
    out.push(part(rbox(1.2, 0.12, 2.2, 0.03), '#5b616b', { p: [TRX, y0 + 0.55, TZ2 - 0.3] }), [[0.5, -1.0], [-0.5, -1.0], [0.5, 0.4], [-0.5, 0.4]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 14), '#1d1f24', { p: [TRX + x, y0 + 0.22, TZ2 + z], r: [0, 0, Math.PI / 2] })));
    const P = 12, F = (t) => cyc(t, P);
    const yaw = (f) => yawPick + (yawGap - yawPick) * (easeIO(win(f, 0.2, 0.45)) - easeIO(win(f, 0.7, 0.92)));
    const tip = (f) => { const a = yaw(f); return new V(CX + Math.cos(a) * REACH, CY + TOP, CZ - Math.sin(a) * REACH); };
    const pick = CY + TOP - (y0 + 0.9), set = CY + TOP - (DY + 0.5), up = 1.2;
    const cable = (f) => (f < 0.08 ? pick : f < 0.18 ? pick + (up - pick) * easeIO(win(f, 0.08, 0.18)) : f < 0.45 ? up : f < 0.56 ? up + (set - up) * easeIO(win(f, 0.45, 0.56)) : f < 0.62 ? set : set + (up - set) * easeIO(win(f, 0.62, 0.7)) + (pick - up) * easeIO(win(f, 0.9, 1)));
    moving.push({ geo: merge(part(rbox(1.3, 0.8, 1.1, 0.08), '#f2c94c', { p: [-0.2, 0.4, 0] }), part(rbox(0.5, 0.55, 0.5, 0.06), '#9fcdea', { p: [0.4, 0.55, 0.3] }), part(rbox(0.6, 0.6, 1.0, 0.06), '#3a3f47', { p: [-0.85, 0.4, 0] }),
      beam([0.2, 0.6, 0], [REACH, TOP, 0], 0.18, '#f2c94c'), beam([0.2, 0.55, 0.2], [REACH, TOP, 0], 0.06, '#e0b33a'), beam([0.2, 0.55, -0.2], [REACH, TOP, 0], 0.06, '#e0b33a'), hi() ? ring(7, (a, i) => beam([0.3 + i * 0.4, 0.65 + i * 0.4, 0.15], [0.5 + i * 0.4, 0.85 + i * 0.4, -0.15], 0.03, '#e0b33a')) : [], part(cyl(0.12, 0.12, 0.3, 12), K.ink, { p: [REACH, TOP, 0], r: [Math.PI / 2, 0, 0] })).rotateY(yawPick),
      pivot: [CX, CY, CZ], anim: (t) => ({ ry: yaw(F(t)) - yawPick }) });
    moving.push({ geo: part(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), K.ink, { p: [0, -0.5, 0] }), pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = tip(f); return { x: p.x, y: p.y, z: p.z, sy: cable(f) }; } });
    // The last span: on the trailer, lifted, swung round and lowered into the gap.
    moving.push({ geo: span(1.6), pivot: [0, 0, 0], anim: (t) => { const f = F(t), at = tip(Math.min(f, 0.6)), h = f < 0.6 ? cable(f) : set; return { x: at.x, y: at.y - h - 0.2, z: at.z, ry: yaw(Math.min(f, 0.6)) - yawGap, sy: f > 0.94 ? 1 - win(f, 0.94, 1) : 1, s: f < 0.04 ? f / 0.04 : 1 }; } });
    // ---- the excavator: swings between the dig and the truck; boom, stick and bucket work
    const EP = 6, ef = (t) => cyc(t, EP), swing = (f) => Math.PI + 1.15 * (easeIO(win(f, 0.3, 0.45)) - easeIO(win(f, 0.65, 0.8)));
    const dig = (f) => bump(f, 0.15, 0.08), dump = (f) => bump(f, 0.55, 0.06);
    const ex = moving.length;
    out.push(part(rbox(1.6, 0.36, 1.3, 0.06), '#2b2f36', { p: [XX, y0 + 0.18, XZ] }), [-0.5, 0.5].map((z) => part(rbox(1.8, 0.34, 0.34, 0.14), '#1d1f24', { p: [XX, y0 + 0.17, XZ + z] })));
    // The arm is built pointing -x (toward the river), so it rests over the dig.
    moving.push({ geo: merge(part(rbox(1.3, 0.6, 1.1, 0.08), 'A', { p: [0.2, 0.3, 0] }), part(rbox(0.55, 0.6, 0.5, 0.06), '#9fcdea', { p: [-0.25, 0.75, -0.25] }), part(rbox(0.5, 0.5, 1.0, 0.06), 'Ad', { p: [0.7, 0.35, 0] })), pivot: [XX, y0 + 0.4, XZ], anim: (t) => ({ ry: swing(ef(t)) - Math.PI }) });
    moving.push({ geo: merge(part(rbox(1.6, 0.22, 0.22, 0.06), 'A', { p: [-0.8, 0, 0] }), part(cyl(0.1, 0.1, 0.3, 10), K.dark, { r: [Math.PI / 2, 0, 0] })), pivot: [-0.3, 0.6, 0.15], parent: ex, anim: (t) => { const f = ef(t); return { rz: -(0.55 - dig(f) * 0.6 + dump(f) * 0.1) }; } });
    moving.push({ geo: merge(part(rbox(1.2, 0.16, 0.18, 0.05), 'Ad', { p: [-0.6, 0, 0] }), part(cyl(0.08, 0.08, 0.26, 10), K.dark, { r: [Math.PI / 2, 0, 0] })), pivot: [-1.6, 0, 0], parent: ex + 1, anim: (t) => { const f = ef(t); return { rz: -(-1.5 + dig(f) * 0.5 - dump(f) * 0.3) }; } });
    moving.push({ geo: merge(part(extrude([[0, 0.15], [-0.42, 0.1], [-0.42, -0.22], [-0.1, -0.3]], 0.42), '#3a3f47'), hi() ? ring(4, (a, i) => part(cone(0.04, 0.12, 6), K.steel, { p: [-0.12, -0.32, -0.15 + i * 0.1], r: [0, 0, Math.PI] })) : []), pivot: [-1.2, 0, 0], parent: ex + 2, anim: (t) => { const f = ef(t); return { rz: -(-0.4 - dig(f) * 0.9 + dump(f) * 1.6) }; } });
    // The dump truck: loaded by the excavator, drives off full; an empty one comes back.
    const tt = (t) => cyc(t, EP * 2), tx = (t) => { const f = tt(t); return f < 0.6 ? 2.0 : f < 0.8 ? 2.0 + easeIn(win(f, 0.6, 0.8)) * 4 : 6.5 - 4.5 * easeOut(win(f, 0.8, 1)); };
    const truck = moving.length;
    moving.push({ geo: merge(part(rbox(0.8, 0.8, 1.0, 0.1), '#f2c94c', { p: [0.95, 0.7, 0] }), part(box(0.04, 0.3, 0.8), '#26323f', { p: [1.36, 0.85, 0] }), part(rbox(2.2, 0.2, 1.1, 0.04), K.dark, { p: [0.1, 0.4, 0] }), [[-0.6, 0.5], [0.0, 0.5], [0.95, 0.5], [-0.6, -0.5], [0.0, -0.5], [0.95, -0.5]].map(([x, z]) => part(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14), '#1d1f24', { p: [x, 0.24, z], r: [Math.PI / 2, 0, 0] }))),
      pivot: [0, y0, -1.5], anim: (t) => { const x = tx(t); return { x, ry: Math.PI, s: clamp01((5.0 - Math.abs(x)) / 0.8) * 0.999 + 0.001 }; } });
    moving.push({ geo: merge(part(extrude([[-1.0, 0], [0.5, 0], [0.5, 0.7], [-1.1, 0.75]], 1.1), '#f2c94c'), part(box(1.3, 0.05, 0.95), '#9a7a52', { p: [-0.25, 0.6, 0] })), pivot: [-0.55, 0.5, 0], parent: truck, anim: (t) => { const f = tt(t); return { rz: 0 }; } });
    // The load in its bed grows with each bucketful.
    moving.push({ geo: part(lathe([[0.6, 0], [0.3, 0.3], [0, 0.35]], 16), '#9a7a52', { s: [1.1, 1, 0.75] }), pivot: [-0.3, 0.65, 0], parent: truck, anim: (t) => { const f = tt(t), k = Math.min(1, Math.floor(f * 2 / 0.6 * 1.0 + 0.3) / 2 + 0.05); return { s: f < 0.8 ? Math.max(0.1, k) : 0.001 }; } });
    // Hard-hat crews: one on the bridge deck guiding the span, one at the river bank.
    moving.push(...walker(moving.length, (t) => ({ x: W0 + 1.4, z: BZ + 0.3, ry: Math.sin(t * 0.6) * 0.3, still: true }), { shirt: K.orange, pants: '#2b3a55', y: DY + 0.24, carry: part(new THREE.SphereGeometry(0.19, 12, 8, 0, TAU, 0, Math.PI / 2), '#ffd23f', { p: [0, 1.62, 0] }) }));
    moving.push(...walker(moving.length, (t) => { const k = Math.sin(t * 0.4); return { x: 1.2, z: 2.0 + k * 1.2, ry: Math.cos(t * 0.4) > 0 ? -Math.PI / 2 : Math.PI / 2 }; }, { shirt: '#f2c94c', pants: '#2b3a55', y: y0, carry: part(new THREE.SphereGeometry(0.19, 12, 8, 0, TAU, 0, Math.PI / 2), K.white, { p: [0, 1.62, 0] }) }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.5, y0, -1.4], topAt: [-3.6, y0 + 1.0, 3.6] };
  },

  // Stethoscope (health insurers and managed care): coverage connects people to care. Families walk
  // from their homes to the clinic under a giant stethoscope; a member card and a green tick pop up
  // as each checks in; a car rolls through the pharmacy drive-through.
  'health:4': () => {
    const R = rand(2201), out = [], moving = [];
    out.push(slab('#9fcf7a'));
    // ---- the clinic, back right: a low building with a canopy, the stethoscope over its roof
    const CX = 1.6, CZ = -2.8, W = 4.6, D = 2.6, H = 1.8;
    out.push(part(rbox(W, H, D, 0.06), '#f4f5f6', { p: [CX, y0 + H / 2, CZ] }), part(box(W + 0.02, 0.3, D + 0.02), 'A', { p: [CX, y0 + H - 0.15, CZ] }));
    for (let i = 0; i < 4; i++) out.push(part(rbox(0.7, 0.7, 0.05, 0.03), '#9fcdea', { p: [CX - 1.7 + i * 1.1, y0 + 0.9, CZ + D / 2 + 0.01] }));
    out.push(part(rbox(1.0, 1.2, 0.06, 0.03), '#2a3c50', { p: [CX + 0.6, y0 + 0.6, CZ + D / 2 + 0.02] }), part(rbox(1.8, 0.1, 1.2, 0.03), 'A', { p: [CX + 0.6, y0 + 1.35, CZ + D / 2 + 0.55] }), [-0.8, 0.8].map((dx) => part(cyl(0.05, 0.05, 1.3, 8), K.white, { p: [CX + 0.6 + dx, y0 + 0.65, CZ + D / 2 + 1.05] })));
    // A cross sign on the roof.
    out.push(part(rbox(0.9, 0.3, 0.12, 0.03), K.white, { p: [CX - 1.6, y0 + H + 0.55, CZ + 0.4] }), part(rbox(0.3, 0.9, 0.12, 0.03), K.white, { p: [CX - 1.6, y0 + H + 0.55, CZ + 0.4] }), part(rbox(0.7, 0.18, 0.14, 0.03), 'B', { p: [CX - 1.6, y0 + H + 0.55, CZ + 0.4] }), part(rbox(0.18, 0.7, 0.14, 0.03), 'B', { p: [CX - 1.6, y0 + H + 0.55, CZ + 0.4] }), part(box(0.1, 0.3, 0.1), K.dark, { p: [CX - 1.6, y0 + H + 0.05, CZ + 0.4] }));
    // The stethoscope draped over the roof and down the side.
    const run = curve([[CX - 0.2, y0 + H + 0.15, CZ - 0.6], [CX + 1.2, y0 + H + 0.12, CZ - 0.2], [CX + 2.3, y0 + H - 0.1, CZ + 0.4], [CX + 2.42, y0 + 0.9, CZ + 1.0], [CX + 2.2, y0 + 0.12, CZ + 1.9], [CX + 1.4, y0 + 0.12, CZ + 2.4]]);
    out.push(stethoscope(run, 'A'));
    // ---- the pharmacy drive-through lane round the left end
    const lane = curve([[-4.9, 0, -0.4], [-2.0, 0, -0.6], [CX - W / 2 - 0.5, 0, CZ + 0.4], [CX - W / 2 - 0.6, 0, CZ - 1.6], [-3.0, 0, -4.5], [-4.9, 0, -4.3]]);
    for (let i = 0, n = hi() ? 50 : 14; i < n; i++) { const { p, ry } = along(lane, i / n); out.push(part(box(0.5, 0.02, 1.1), '#5b616b', { p: [p.x, y0 + 0.01, p.z], r: [0, ry, 0] })); }
    out.push(part(rbox(0.5, 0.6, 0.06, 0.03), '#9fcdea', { p: [CX - W / 2 - 0.01, y0 + 1.0, CZ - 0.6], r: [0, Math.PI / 2, 0] }), part(rbox(0.8, 0.08, 0.4, 0.02), 'A', { p: [CX - W / 2 - 0.2, y0 + 1.45, CZ - 0.6] }));
    // ---- the neighbourhood at the front: homes and the path to the clinic
    const homes = [[-3.6, 2.2, 0.4], [-1.4, 3.8, 0.1], [1.0, 3.9, -0.1], [3.6, 3.4, -0.4]];
    homes.forEach(([x, z, ry], i) => out.push(place(home(['#f3ead8', '#e4ecf0', '#efe2cc', '#f6f0e4'][i], ['#7d6a5a', '#5a6b7d', '#a35a3c', 'Bd'][i], 1.5, 1.3, 1.0), { p: [x, y0, z], r: [0, Math.PI + ry, 0] })));
    const walk = curve([[-3.4, 0, 1.1], [-1.4, 0, 1.6], [0.6, 0, 1.0], [CX + 0.6, 0, CZ + D / 2 + 1.4], [CX + 0.6, 0, CZ + D / 2 + 0.3]]);
    for (let i = 0, n = hi() ? 40 : 12; i < n; i++) { const { p, ry } = along(walk, i / n); out.push(part(rbox(0.5, 0.03, 0.5, 0.04), '#e6dcc8', { p: [p.x, y0 + 0.015, p.z], r: [0, ry, 0] })); }
    [[4.5, -0.6], [-4.6, 4.5], [4.6, 1.4], [-0.2, -0.4]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.2)));
    // ---- moving parts
    // Patients walk to the clinic one after another; at the door a card and a tick pop up.
    for (let k = 0; k < 3; k++) {
      const u = (t) => cyc(t, 12, k / 3);
      moving.push(...walker(moving.length, (t) => { const f = u(t), { p, ry } = along(walk, Math.min(0.999, win(f, 0, 0.7))); return { x: p.x, z: p.z, ry, s: Math.max(0.001, Math.min(1, f / 0.04, (0.86 - f) / 0.04)), still: f > 0.7 }; }, { shirt: ['#e5533d', '#3d7be0', '#8a6cf0'][k], pants: '#2b3a55', y: y0 }));
      moving.push({ geo: cardGeo('A'), pivot: [CX + 0.6, y0 + 2.2, CZ + D / 2 + 0.6], anim: (t) => { const f = u(t); return { y: easeOut(win(f, 0.7, 0.78)) * 0.3, ry: -0.5, s: life(f, 0.7, 0.75, 0.84, 0.88) }; } });
      moving.push({ geo: tickGeo(0.22), pivot: [CX + 1.2, y0 + 2.5, CZ + D / 2 + 0.6], anim: (t) => { const f = u(t); return { y: easeOut(win(f, 0.74, 0.8)) * 0.3, ry: -0.5, s: life(f, 0.74, 0.78, 0.84, 0.88) }; } });
    }
    // A car rolls through the pharmacy drive-through, pausing at the window.
    moving.push({ geo: sedan('B'), pivot: [0, y0, 0], anim: (t) => { const f = cyc(t, 14), u = f < 0.4 ? easeOut(f / 0.4) * 0.5 : f < 0.55 ? 0.5 : 0.5 + easeIn(win(f, 0.55, 1)) * 0.5, { p, ry } = along(lane, Math.min(0.999, u)); return { x: p.x, z: p.z, ry, s: Math.min(clamp01(f / 0.04), clamp01((1 - f) / 0.04)) * 0.85 + 0.001 }; } });
    moving.push({ geo: merge(part(rbox(0.3, 0.2, 0.2, 0.03), K.white), part(box(0.1, 0.22, 0.04), 'A', { p: [0, 0, 0.11] })), pivot: [CX - W / 2 - 0.3, y0 + 1.0, CZ - 0.6], anim: (t) => { const f = cyc(t, 14); return { x: -easeOut(win(f, 0.42, 0.5)) * 0.6, s: f > 0.42 && f < 0.56 ? 1 : 0.001 }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-3.6, y0, -2.4], topAt: [CX + 1.4, y0 + H, CZ - 0.6] };
  },

  // Medical supplies (drug and medical distributors): the shelves behind every pharmacy. In the
  // distribution centre, racks of medicine cases feed totes along the conveyor through a scanner;
  // vans run orders out to the pharmacy and the hospital, and a drone drops an urgent box on the
  // hospital's roof.
  'health:9': () => {
    const R = rand(2301), out = [], moving = [];
    out.push(slab('#c4c7cb'));
    // ---- the distribution centre: back wall, racking, the conveyor and scanner arch
    out.push(part(rbox(10.4, 2.8, 0.25, 0.04), '#e3e6ea', { p: [0, y0 + 1.4, -5.05] }), part(box(10.4, 0.35, 0.27), 'A', { p: [0, y0 + 2.55, -5.05] }));
    [-4.9, -1.4, 1.6].forEach((x) => out.push(place(racking(R, 3, 3, '#2a5bb0', K.orange, ['#ffffff', '#f4f5f6', '#e8d3ad']), { p: [x, y0, -4.3] })));
    const CZ = -2.6, TOPY = y0 + 0.75, X0 = -4.8, X1 = 3.4;
    out.push(part(box(X1 - X0, 0.08, 0.7), '#3a3f47', { p: [(X0 + X1) / 2, TOPY - 0.04, CZ] }));
    [CZ - 0.37, CZ + 0.37].forEach((z) => out.push(part(new THREE.BoxGeometry(X1 - X0, 0.14, 0.05), '#c9ced6', { p: [(X0 + X1) / 2, TOPY - 0.03, z] })));
    for (let x = X0 + 0.1; x <= X1; x += 0.9) [CZ - 0.32, CZ + 0.32].forEach((z) => out.push(part(new THREE.BoxGeometry(0.07, 0.7, 0.07), '#9aa1a9', { p: [x, y0 + 0.35, z] })));
    const AX = -0.2;
    out.push(part(rbox(0.16, 1.5, 0.16, 0.04), K.white, { p: [AX, y0 + 0.75, CZ - 0.5] }), part(rbox(0.16, 1.5, 0.16, 0.04), K.white, { p: [AX, y0 + 0.75, CZ + 0.5] }), part(rbox(0.2, 0.18, 1.2, 0.04), 'A', { p: [AX, y0 + 1.55, CZ] }));
    // The loading dock, at the conveyor's end.
    out.push(part(rbox(1.6, 0.6, 1.6, 0.04), '#9aa1a9', { p: [4.3, y0 + 0.3, CZ] }));
    // ---- the pharmacy (front left) and hospital (front right)
    const PX = -3.4, PZ = 3.2;
    out.push(part(rbox(2.6, 1.5, 1.8, 0.05), '#f4f5f6', { p: [PX, y0 + 0.75, PZ] }), part(rbox(2.64, 0.35, 1.84, 0.05), 'B', { p: [PX, y0 + 1.35, PZ] }), part(rbox(1.6, 0.8, 0.05, 0.03), '#9fcdea', { p: [PX + 0.3, y0 + 0.65, PZ - 0.91] }), part(rbox(0.4, 0.4, 0.06, 0.03), '#5fae5b', { p: [PX - 0.9, y0 + 1.35, PZ - 0.93] }), part(rbox(0.14, 0.32, 0.07, 0.02), K.white, { p: [PX - 0.9, y0 + 1.35, PZ - 0.97] }), part(rbox(0.32, 0.14, 0.07, 0.02), K.white, { p: [PX - 0.9, y0 + 1.35, PZ - 0.97] }));
    const HX = 2.6, HZ = 3.0;
    out.push(part(rbox(2.8, 2.6, 2.0, 0.05), '#eef0f2', { p: [HX, y0 + 1.3, HZ] }), part(box(2.82, 0.2, 2.02), 'A', { p: [HX, y0 + 2.5, HZ] }));
    for (let f = 0; f < 3; f++) for (let i = 0; i < 3; i++) out.push(part(rbox(0.5, 0.4, 0.05, 0.02), '#9fcdea', { p: [HX - 0.9 + i * 0.9, y0 + 0.6 + f * 0.7, HZ - 1.01] }));
    out.push(part(cyl(0.6, 0.6, 0.04, 24), '#5b616b', { p: [HX, y0 + 2.62, HZ] }), part(box(0.12, 0.02, 0.6), K.white, { p: [HX - 0.18, y0 + 2.65, HZ] }), part(box(0.12, 0.02, 0.6), K.white, { p: [HX + 0.18, y0 + 2.65, HZ] }), part(box(0.36, 0.02, 0.12), K.white, { p: [HX, y0 + 2.65, HZ] }));
    [[-0.4, 4.4], [0.6, 2.2], [-4.6, 0.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.55 + R() * 0.2)));
    // ---- moving parts
    // Totes ride the line through the scanner, each with a case on board.
    for (let k = 0; k < 6; k++) moving.push({ geo: merge(part(rbox(0.55, 0.28, 0.45, 0.04), 'A', { p: [0, 0.14, 0] }), place(medBox('B', 0.7), { p: [0, 0.35, 0] })), pivot: [0, TOPY, CZ], anim: (t) => { const u = cyc(t, 12, k / 6), x = X0 + 0.3 + u * (X1 - X0 - 0.6); return { x, s: Math.min(1, u / 0.03, (1 - u) / 0.03) }; } });
    moving.push({ geo: part(box(0.04, 0.6, 1.0), '#ff5a4a'), pivot: [AX, y0 + 1.15, CZ], anim: (t) => ({ s: cyc(t, 2) < 0.15 ? 1 : 0.001 }) });
    // A picker pulls cases from the racks.
    moving.push(...walker(moving.length, (t) => { const k = Math.sin(t * 0.4); return { x: -1.0 + k * 3.0, z: -3.45, ry: Math.cos(t * 0.4) > 0 ? 0 : Math.PI }; }, { shirt: K.orange, pants: '#2b3a55', y: y0, carry: place(medBox('A', 0.6), { p: [0.3, 0.95, 0] }) }));
    // Two vans: dock → pharmacy and dock → hospital.
    const dock = new V(4.3, 0, CZ + 1.4);
    [[new V(PX + 1.6, 0, PZ - 1.5), 0], [new V(HX - 1.9, 0, HZ - 1.4), 0.5]].forEach(([to, o]) => {
      const c = curve([dock.toArray(), [1.2, 0, -0.6], [to.x, 0, to.z]]);
      moving.push({ geo: van(K.white, 'A'), pivot: [0, y0, 0], anim: (t) => { const f = cyc(t, 12, o), u = f < 0.45 ? easeIO(f / 0.45) : f < 0.55 ? 1 : 1 - easeIO(win(f, 0.55, 1)), { p, ry } = along(c, Math.min(0.999, u)); return { x: p.x, z: p.z, ry: ry + (f > 0.55 ? Math.PI : 0) }; } });
    });
    // The drone with an urgent case for the hospital roof.
    const DF = new V(4.3, y0 + 1.6, CZ), DT = new V(HX, y0 + 2.9, HZ);
    moving.push({ geo: merge(drone('A'), place(medBox('A', 0.55), { p: [0, -0.28, 0] })), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, 9), u = f < 0.45 ? easeIO(f / 0.45) : f < 0.55 ? 1 : 1 - easeIO(win(f, 0.55, 1)), p = DF.clone().lerp(DT, u); return { x: p.x, y: p.y + hop(u) * 1.6 + Math.sin(t * 3) * 0.04, z: p.z }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-0.6, y0, 0.4], topAt: [PX, y0 + 1.52, PZ] };
  },

  // Refinery (refiners): crude in, fuels out, and the spread between them. Dark crude pipes into
  // the furnace and up the distillation column, heat climbs its trays, and three cuts (gasoline,
  // jet fuel, diesel) draw off at their heights to the product tanks; a tanker fills at the rack
  // and drives to the filling station, where the margin pops up as a coin.
  'oil:4': () => {
    const R = rand(2401), out = [], moving = [];
    out.push(slab('#bab09c'));
    // Bunded gravel round the process area, the road along the front.
    out.push(part(rbox(6.6, 0.06, 4.6, 0.03), '#cfc7b6', { p: [-1.6, y0 + 0.03, -2.6] }));
    out.push(part(box(10.4, 0.03, 1.3), '#5b616b', { p: [0, y0 + 0.015, 3.8] }));
    for (let i = 0; i < 9; i++) out.push(part(box(0.5, 0.012, 0.06), '#f2c94c', { p: [-4.4 + i * 1.1, y0 + 0.035, 3.8] }));
    // ---- the distillation column, a second column and the furnace (back left)
    const C1 = [-3.4, -3.4], C1R = 0.6, C1H = 5.0, C2 = [-1.7, -4.0];
    out.push(place(column(C1R, C1H, '#eef0f2', 'A'), { p: [C1[0], y0, C1[1]] }), place(column(0.42, 3.4, '#e3e6ea', 'Ad'), { p: [C2[0], y0, C2[1]] }));
    out.push(part(tube([[C1[0] + 0.3, y0 + C1H + 0.3, C1[1]], [-2.4, y0 + C1H + 0.1, -3.7], [C2[0], y0 + 3.6, C2[1]]], 0.08), '#c9ced6'));
    const FX = -3.0, FZ = -1.0;
    out.push(part(rbox(1.8, 1.3, 1.3, 0.05), '#b8442f', { p: [FX, y0 + 0.65, FZ] }), part(box(1.82, 0.16, 1.32), '#8e3424', { p: [FX, y0 + 1.25, FZ] }), part(cyl(0.22, 0.26, 2.6, 16), '#9aa1a9', { p: [FX - 0.5, y0 + 2.6, FZ - 0.3] }), part(cyl(0.24, 0.24, 0.16, 16), 'A', { p: [FX - 0.5, y0 + 3.5, FZ - 0.3] }));
    out.push(part(tube([[FX + 0.2, y0 + 1.2, FZ - 0.6], [FX - 0.1, y0 + 1.0, -2.4], [C1[0] + 0.2, y0 + 0.7, C1[1] + 0.55]], 0.11), '#7d8792'));
    // ---- crude in from the pipeline at the left edge
    const PY = y0 + 0.45, crude = curve([[-5.2, PY, 1.4], [-4.0, PY, 1.4], [FX, PY, 1.3], [FX, PY, 0.3], [FX, PY + 0.1, FZ + 0.6]]);
    out.push(part(tubeOn(crude, 0.12), '#3a3f47'));
    for (let x = -4.8; x < -3.0; x += 0.8) out.push(part(rbox(0.3, 0.3, 0.5, 0.04), '#8e959e', { p: [x, y0 + 0.15, 1.4] }));
    // ---- the side draws: three cuts at their heights, over the pipe rack to their tanks
    const cuts = [['#f2c94c', 4.2], ['#9ad0f0', 3.1], ['#d98a3a', 1.9]], tanks = [[0.9, -3.6], [2.4, -3.6], [3.9, -3.6]], TR = 0.66, TH = 1.4, RZ = -2.25;
    const draws = cuts.map(([c, h], i) => { const ry = y0 + 1.0 + i * 0.22, [tx, tz] = tanks[i]; return curve([[C1[0] + C1R, y0 + h, C1[1] + 0.1], [C1[0] + 1.0, y0 + h - 0.6, -2.9], [-1.4, ry, RZ - i * 0.18], [tx - 0.5, ry, RZ - i * 0.18], [tx, ry, tz + TR + 0.04]]); });
    draws.forEach((c, i) => out.push(part(tubeOn(c, 0.07), cuts[i][0])));
    for (let x = -2.2; x <= 3.6; x += 0.9) out.push(part(box(0.08, 1.2, 0.08), K.steelDk, { p: [x, y0 + 0.6, RZ + 0.3] }), part(box(0.08, 1.2, 0.08), K.steelDk, { p: [x, y0 + 0.6, RZ - 0.6] }), part(box(0.1, 0.07, 1.0), K.steelDk, { p: [x, y0 + 0.95, RZ - 0.15] }));
    tanks.forEach(([x, z], i) => {
      out.push(part(new THREE.CylinderGeometry(TR, TR, TH, hi() ? 40 : 14, 1), '#f4f5f6', { p: [x, y0 + TH / 2, z] }), part(cone(TR * 1.03, 0.3, 40), '#e3e6ea', { p: [x, y0 + TH + 0.15, z] }));
      out.push(part(new THREE.CylinderGeometry(TR * 1.01, TR * 1.01, 0.22, hi() ? 40 : 14, 1, true), cuts[i][0], { p: [x, y0 + TH * 0.7, z] }), part(new THREE.CylinderGeometry(TR * 1.01, TR * 1.01, 0.08, hi() ? 40 : 14, 1, true), 'A', { p: [x, y0 + TH * 0.45, z] }));
    });
    // A product line from the tanks to the loading rack, and the flare at the back.
    const LX = 2.2, feed = curve([[3.9, y0 + 0.35, -2.9], [4.4, y0 + 0.35, -1.8], [4.4, y0 + 0.35, 1.2], [LX + 0.6, y0 + 0.35, 2.6], [LX, y0 + 1.75, 3.0]]);
    out.push(part(tubeOn(feed, 0.08), 'Bd'));
    out.push(part(cyl(0.1, 0.16, 4.6, 12), '#c9ced6', { p: [0.2, y0 + 2.3, -4.6] }), ring(3, (a) => beam([0.2 + Math.cos(a) * 0.6, y0, -4.6 + Math.sin(a) * 0.6], [0.2, y0 + 3.0, -4.6], 0.04, K.steelDk)), part(cyl(0.18, 0.18, 0.2, 14), 'A', { p: [0.2, y0 + 4.2, -4.6] }));
    // ---- the loading rack over the road, the control room
    out.push(part(rbox(2.2, 0.12, 1.6, 0.03), 'A', { p: [LX, y0 + 2.05, 3.8] }), [[-0.95, 3.15], [0.95, 3.15], [-0.95, 4.45], [0.95, 4.45]].map(([x, z]) => part(box(0.1, 2.0, 0.1), K.steelDk, { p: [LX + x, y0 + 1.0, z] })));
    out.push(part(box(0.12, 0.12, 0.8), K.steelDk, { p: [LX, y0 + 1.8, 3.35] }));
    const CR = [1.5, 0.6];
    out.push(part(rbox(1.8, 1.0, 1.2, 0.05), K.white, { p: [CR[0], y0 + 0.5, CR[1]] }), part(box(1.82, 0.16, 1.22), 'A', { p: [CR[0], y0 + 0.92, CR[1]] }), part(rbox(1.2, 0.36, 0.05, 0.02), '#9fcdea', { p: [CR[0], y0 + 0.55, CR[1] + 0.61] }));
    // ---- the filling station along the road (front left)
    const SX = -2.4;
    out.push(part(rbox(2.4, 0.1, 1.2, 0.03), 'A', { p: [SX, y0 + 1.6, 2.6] }), part(box(2.42, 0.1, 1.22), K.white, { p: [SX, y0 + 1.5, 2.6] }), [-0.9, 0.9].map((x) => part(cyl(0.06, 0.06, 1.5, 8), K.white, { p: [SX + x, y0 + 0.75, 2.6] })));
    [-0.5, 0.5].forEach((x) => out.push(part(rbox(0.3, 0.6, 0.24, 0.04), K.white, { p: [SX + x, y0 + 0.3, 2.6] }), part(box(0.24, 0.14, 0.02), '#1d2a33', { p: [SX + x, y0 + 0.45, 2.73] }), part(box(0.3, 0.08, 0.25), 'B', { p: [SX + x, y0 + 0.58, 2.6] })));
    out.push(part(rbox(1.5, 0.9, 1.0, 0.05), K.cream, { p: [-4.3, y0 + 0.45, 2.4] }), part(box(1.52, 0.18, 1.02), 'B', { p: [-4.3, y0 + 0.85, 2.4] }), part(rbox(0.7, 0.4, 0.04, 0.02), '#9fcdea', { p: [-4.3, y0 + 0.45, 2.92] }));
    out.push(part(cyl(0.05, 0.05, 1.6, 8), K.steelDk, { p: [-0.9, y0 + 0.8, 2.3] }), part(rbox(0.5, 0.7, 0.08, 0.03), 'A', { p: [-0.9, y0 + 1.8, 2.3] }), [0, 1, 2].map((i) => part(box(0.36, 0.1, 0.02), cuts[i][0], { p: [-0.9, y0 + 2.0 - i * 0.2, 2.35] })));
    [[4.6, 1.8], [-4.6, -0.2], [4.6, -0.4], [0.5, 2.0]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.5 + R() * 0.2)));
    // ---- moving parts
    const blob = (c, r = 0.12) => merge(part(new THREE.CylinderGeometry(r, r, 0.26, 14), c, { r: [0, 0, Math.PI / 2] }), part(new THREE.TorusGeometry(r * 0.95, 0.025, 6, 16), K.white, { r: [0, Math.PI / 2, 0] }));
    const ride = (c, path, n, P, off = 0) => { for (let k = 0; k < n; k++) moving.push({ geo: blob(c), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, P, k / n + off), p = path.getPointAt(u * 0.999), d = path.getTangentAt(u * 0.999); return { x: p.x, y: p.y, z: p.z, q: new THREE.Quaternion().setFromUnitVectors(new V(1, 0, 0), d), s: Math.min(1, u / 0.05, (1 - u) / 0.05) }; } }); };
    ride('#1d1f24', crude, 3, 3);
    draws.forEach((c, i) => ride(cuts[i][0], c, 2, 3, i * 0.2));
    ride('B', feed, 2, 3, 0.5);
    // Heat climbing the column: glowing bands rising tray by tray.
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.CylinderGeometry(C1R + 0.02, C1R + 0.02, 0.14, hi() ? 36 : 12, 1, true), K.orange), pivot: [C1[0], y0 + 0.5, C1[1]], anim: (t) => { const u = cyc(t, 3, k / 3); return { y: u * (C1H - 0.9), s: Math.sin(u * Math.PI) * 0.999 + 0.001, sy: 1 }; } });
    // The furnace's firebox glows.
    moving.push({ geo: part(box(1.0, 0.36, 0.04), '#ff8a3a'), pivot: [FX + 0.1, y0 + 0.55, FZ + 0.66], anim: (t) => ({ sy: 0.8 + Math.sin(t * 9) * 0.15 + Math.sin(t * 5.3) * 0.1 }) });
    // The flare burns.
    moving.push({ geo: merge(part(lathe([[0, 0], [0.22, 0.15], [0.25, 0.4], [0.12, 0.8], [0, 1.15]]), K.orange), part(lathe([[0, 0], [0.13, 0.1], [0.14, 0.32], [0, 0.7]]), K.yellow, { p: [0, -0.02, 0] })), pivot: [0.2, y0 + 4.62, -4.6], anim: (t) => ({ sy: 0.8 + Math.sin(t * 13) * 0.12 + Math.sin(t * 7.3) * 0.08, sx: 1 + Math.sin(t * 9) * 0.08, rz: Math.sin(t * 2) * 0.12 }) });
    // The tanker: in from the right, fills at the rack, drives to the station, unloads, leaves.
    const P = 14, F = (t) => cyc(t, P), RX = LX + 0.3, STX = SX + 0.2;
    const tx = (f) => (f < 0.1 ? 5.6 - (5.6 - RX) * easeOut(f / 0.1) : f < 0.4 ? RX : f < 0.55 ? RX + (STX - RX) * easeIO(win(f, 0.4, 0.55)) : f < 0.75 ? STX : STX - 3.6 * easeIn(win(f, 0.75, 0.92)));
    moving.push({ geo: tankTruck('A', '#dfe3e8', 'B'), pivot: [0, y0, 3.8], anim: (t) => { const f = F(t), x = tx(f); return { x, ry: Math.PI, s: clamp01((5.0 - Math.abs(x)) / 0.6) * 0.999 + 0.001 }; } });
    // Its load gauge fills at the rack, then the hose drops in.
    moving.push({ geo: part(cyl(0.05, 0.05, 1, 8), '#3a3f47', { p: [0, -0.5, 0] }), pivot: [LX + 0.3, y0 + 1.8, 3.8], anim: (t) => { const f = F(t); return { sy: f > 0.12 && f < 0.38 ? 0.45 * easeOut(win(f, 0.12, 0.16)) * (1 - win(f, 0.34, 0.38)) + 0.001 : 0.001 }; } });
    moving.push({ geo: part(cyl(0.44, 0.44, 0.05, 20), cuts[0][0], { r: [0, 0, Math.PI / 2] }), pivot: [0, y0 + 0.86, 3.8], anim: (t) => { const f = F(t), x = tx(f); return { x: x + 0.35, sy: f < 0.12 ? 0.001 : f < 0.4 ? 0.1 + win(f, 0.12, 0.38) * 0.9 : f < 0.62 ? 1 : Math.max(0.001, 1 - win(f, 0.62, 0.72)), s: clamp01((5.0 - Math.abs(x)) / 0.6) * 0.999 + 0.001 }; } });
    // The margin: a coin pops over the station as the load goes in.
    moving.push({ geo: coin(0.32, 0.1).rotateX(Math.PI / 2), pivot: [SX, y0 + 2.1, 2.6], anim: (t) => { const f = F(t); return { y: easeOut(win(f, 0.6, 0.72)) * 0.6, ry: f * 18, s: life(f, 0.6, 0.65, 0.74, 0.78) }; } });
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [3.2, y0, -0.9], topAt: [CR[0], y0 + 1.0, CR[1]] };
  },

  // Ticker board (asset managers, brokers, ratings and index houses): where prices are made. On the
  // exchange the ticker runs along the frieze and round the corner tower; on the plaza the big
  // board prints the day's candles one by one, trending up, and traders hurry between them.
  'bank:11': () => {
    const R = rand(2501), out = [], moving = [];
    out.push(slab('#d9d2c4'));
    // Plaza paving, the street along the front with its kerb.
    out.push(part(box(10.4, 0.03, 1.4), '#5b616b', { p: [0, y0 + 0.015, 4.2] }), part(box(10.4, 0.1, 0.12), K.stoneDk, { p: [0, y0 + 0.05, 3.44] }));
    for (let i = 0; i < 9; i++) out.push(part(box(0.5, 0.012, 0.06), K.white, { p: [-4.4 + i * 1.1, y0 + 0.035, 4.2] }));
    if (hi()) for (let x = -5; x < 5; x += 0.8) out.push(part(box(0.02, 0.012, 7.0), '#cfc6b4', { p: [x, y0 + 0.006, -0.1] }));
    // ---- the exchange (back left): steps, six columns, the pediment and a frieze for the ticker
    const EX = -2.3, EZ = -3.3, W = 4.4, H = 2.6, fl = y0 + 0.42, front = EZ + 0.95;
    for (let i = 0; i < 3; i++) out.push(part(rbox(W + 0.7 - i * 0.2, 0.14, 2.6 - i * 0.15, 0.03), i % 2 ? K.stone : K.stoneDk, { p: [EX, y0 + 0.07 + i * 0.14, EZ + 0.15 - i * 0.05] }));
    out.push(part(rbox(W - 0.2, H, 1.4, 0.04), K.cream, { p: [EX, fl + H / 2, EZ - 0.35] }));
    for (let i = 0; i < 6; i++) { const x = EX - W / 2 + 0.35 + i * ((W - 0.7) / 5); out.push(part(cyl(0.15, 0.18, H - 0.3, 16), K.white, { p: [x, fl + (H - 0.3) / 2, front] }), part(rbox(0.42, 0.12, 0.42, 0.03), K.stone, { p: [x, fl + H - 0.25, front] })); }
    out.push(part(rbox(W + 0.2, 0.5, 2.0, 0.04), K.stone, { p: [EX, fl + H + 0.05, EZ] }), part(box(W - 0.2, 0.32, 0.04), '#1d232b', { p: [EX, fl + H + 0.05, EZ + 1.01] }));
    out.push(part(prism(W + 0.2, 0.8, 0.3), 'Ad', { p: [EX, fl + H + 0.3, front + 0.05] }), part(prism(W - 0.4, 0.55, 0.06), K.white, { p: [EX, fl + H + 0.36, front + 0.22] }), part(rbox(W, 0.5, 1.4, 0.04), K.stoneDk, { p: [EX, fl + H + 0.55, EZ - 0.3] }));
    out.push(part(rbox(1.0, 1.4, 0.06, 0.03), '#2a3c50', { p: [EX, fl + 0.7, EZ + 0.36] }));
    [-1, 1].forEach((s) => out.push(part(rbox(0.3, 2.0, 0.06, 0.02), 'A', { p: [EX + s * 1.5, fl + 1.1, EZ + 0.36] })));
    // ---- the corner tower (back right) with its wraparound ticker
    const TX = 2.5, TZ = -2.7, TR = 1.15, TH = 4.9;
    out.push(part(new THREE.CylinderGeometry(TR, TR, TH, hi() ? 48 : 16, hi() ? 12 : 1), (x, y) => (Math.floor(y * 2.4) % 2 ? '#a9c6dc' : '#d7e3ec'), { p: [TX, y0 + TH / 2, TZ] }));
    out.push(part(cyl(TR + 0.08, TR + 0.08, 0.2, 48), 'A', { p: [TX, y0 + TH + 0.1, TZ] }), part(cyl(TR * 0.7, TR * 0.8, 0.4, 32), '#c9ced6', { p: [TX, y0 + TH + 0.4, TZ] }), part(cyl(0.04, 0.04, 0.9, 8), K.steelDk, { p: [TX, y0 + TH + 1.05, TZ] }));
    out.push(part(cyl(TR + 0.04, TR + 0.04, 0.62, 48), '#1d232b', { p: [TX, y0 + 3.2, TZ] }), part(cyl(TR + 0.1, TR + 0.1, 0.06, 48), K.steelDk, { p: [TX, y0 + 3.54, TZ] }), part(cyl(TR + 0.1, TR + 0.1, 0.06, 48), K.steelDk, { p: [TX, y0 + 2.86, TZ] }));
    out.push(part(rbox(1.2, 1.2, 0.3, 0.04), '#2a3c50', { p: [TX + 0.55, y0 + 0.6, TZ + 0.85], r: [0, Math.PI / 4, 0] }), part(rbox(1.6, 0.1, 0.7, 0.03), 'A', { p: [TX + 0.75, y0 + 1.3, TZ + 1.05], r: [0, Math.PI / 4, 0] }));
    // ---- the candle board on the plaza (front left), facing the camera
    const BX = -2.5, BZ = 1.7, BA = Math.PI / 4, BW = 3.2, BH = 1.9, BY = y0 + 0.9, q = new THREE.Quaternion().setFromAxisAngle(new V(0, 1, 0), BA);
    const at = (lx, ly, lz) => new V(lx, ly, lz).applyQuaternion(q).add(new V(BX, 0, BZ));
    const board = [part(rbox(BW + 0.3, BH + 0.3, 0.2, 0.06), K.dark, { p: [0, BY + BH / 2, 0] }), part(box(BW, BH, 0.04), '#141a22', { p: [0, BY + BH / 2, 0.11] }), part(rbox(BW + 0.3, 0.26, 0.24, 0.05), 'A', { p: [0, BY + BH + 0.2, 0] })];
    [-1, 1].forEach((s) => board.push(part(rbox(0.16, BY, 0.16, 0.04), K.steelDk, { p: [s * BW * 0.35, BY / 2, 0] })));
    if (hi()) for (let i = 1; i < 4; i++) board.push(part(box(BW - 0.1, 0.012, 0.01), '#2c3644', { p: [0, BY + i * BH / 4, 0.135] }));
    out.push(place(merge(board), { p: [BX, 0, BZ], r: [0, BA, 0] }));
    // ---- trees in planters, lamps, a bench
    [[0.3, -0.3], [4.4, 0.8], [-4.5, -0.2], [4.4, 3.0]].forEach(([x, z]) => out.push(part(rbox(0.8, 0.3, 0.8, 0.05), K.stoneDk, { p: [x, y0 + 0.15, z] }), miniTree(R, x, y0 + 0.3, z, 0.5 + R() * 0.15)));
    out.push(lampPost(-0.4, y0, 3.1, -Math.PI / 2), lampPost(3.4, y0, 3.1, -Math.PI / 2));
    out.push(part(rbox(1.2, 0.08, 0.4, 0.03), K.wood, { p: [1.8, y0 + 0.42, 1.6] }), [-0.5, 0.5].map((x) => part(box(0.06, 0.4, 0.36), K.dark, { p: [1.8 + x, y0 + 0.2, 1.6] })));
    // ---- moving parts
    // The tower's ticker ring: green, red and white quotes running round.
    const tiles = [];
    for (let i = 0, n = hi() ? 56 : 24; i < n; i++) { const a = (i / n) * TAU, c = R() < 0.6 ? '#46d36b' : R() < 0.6 ? '#ff5a4a' : '#f4f5f6', w = 0.08 + R() * 0.06; tiles.push(part(box(w, 0.16 + (i % 3 ? 0 : 0.1), 0.03), c, { p: [Math.cos(a) * (TR + 0.07), 0, Math.sin(a) * (TR + 0.07)], r: [0, -a + Math.PI / 2, 0] })); }
    moving.push({ geo: merge(tiles), pivot: [TX, y0 + 3.2, TZ], anim: (t) => ({ ry: t * 0.45 }) });
    // The frieze ticker: quotes sliding along the exchange's front.
    const FW = W - 0.3;
    for (let k = 0; k < 8; k++) { const c = k % 3 === 1 ? '#ff5a4a' : '#46d36b'; moving.push({ geo: merge(part(box(0.32, 0.14, 0.03), c), part(cone(0.07, 0.1, 3), c, { p: [0.24, 0, 0], r: [0, 0, c === '#46d36b' ? 0 : Math.PI] })), pivot: [EX + FW / 2, fl + H + 0.05, EZ + 1.04], anim: (t) => { const u = cyc(t, 8, k / 8); return { x: -u * FW, s: Math.min(1, u / 0.04, (1 - u) / 0.04) * 0.999 + 0.001 }; } }); }
    // The board's candles print left to right, trending up; an arrow pops at the close.
    const P = 10, F = (t) => cyc(t, P), N = 8, levels = [0.3, 0.55, 0.45, 0.75, 0.95, 0.82, 1.2, 1.5].map((v) => v * 0.95);
    for (let i = 0; i < N; i++) {
      const lo = Math.min(levels[i], i ? levels[i - 1] : 0.25), hiL = Math.max(levels[i], i ? levels[i - 1] : 0.25), up = !i || levels[i] >= levels[i - 1], c = up ? '#46d36b' : '#ff5a4a', h = hiL - lo + 0.12;
      const p = at(-BW / 2 + 0.3 + i * ((BW - 0.6) / (N - 1)), BY + 0.1 + lo, 0.15);
      moving.push({ geo: merge(part(box(0.26, h, 0.05), c, { p: [0, h / 2, 0] }), part(box(0.04, h + 0.26, 0.03), c, { p: [0, h / 2, -0.01] })).applyQuaternion(q), pivot: p.toArray(), anim: (t) => { const f = F(t), k = easeOut(win(f, 0.05 + i * 0.09, 0.12 + i * 0.09)); return { sy: k * 0.999 + 0.001, s: f > 0.93 ? 1 - win(f, 0.93, 0.99) * 0.999 : 1 }; } });
    }
    const arrow = merge(part(box(0.18, 0.4, 0.08), '#46d36b', { p: [0, 0.2, 0] }), part(cone(0.24, 0.3, 4), '#46d36b', { p: [0, 0.55, 0], r: [0, Math.PI / 4, 0] })).applyQuaternion(q);
    const ap = at(BW / 2 - 0.1, BY + BH + 0.4, 0.1);
    moving.push({ geo: arrow, pivot: ap.toArray(), anim: (t) => { const f = F(t); return { y: easeOut(win(f, 0.8, 0.88)) * 0.4, s: life(f, 0.8, 0.85, 0.93, 0.97) }; } });
    // The exchange's flags.
    [-1, 1].forEach((s) => { out.push(part(cyl(0.025, 0.025, 1.0, 8), K.steelDk, { p: [EX + s * 1.6, fl + H + 1.05, EZ - 0.3] })); moving.push({ geo: part(box(0.5, 0.3, 0.02), s < 0 ? 'A' : 'B', { p: [0.25, 0, 0] }), pivot: [EX + s * 1.6 + 0.02, fl + H + 1.4, EZ - 0.3], anim: (t) => ({ ry: Math.sin(t * 2.2 + s) * 0.35 }) }); });
    // Traders crossing the plaza with their briefcases.
    const bag = place(merge(part(rbox(0.32, 0.24, 0.1, 0.03), K.woodDk), part(torus(0.06, 0.015, Math.PI, 8), K.dark, { p: [0, 0.12, 0] })), { p: [0.05, 0.62, 0.3] });
    const p1 = curve([[-4.6, 0, 3.0], [-0.6, 0, 2.6], [0.8, 0, 0.6], [TX + 0.6, 0, TZ + 1.6]]), p2 = curve([[4.6, 0, 2.6], [1.0, 0, 2.0], [-1.0, 0, -0.8], [EX, 0, EZ + 1.4]]);
    [[p1, 'B', 0], [p2, '#3a4a6b', 0.5]].forEach(([c, shirt, o]) => moving.push(...walker(moving.length, (t) => { const f = cyc(t, 9, o), { p, ry } = along(c, f * 0.999); return { x: p.x, z: p.z, ry, s: Math.min(1, f / 0.05, (1 - f) / 0.05) * 0.999 + 0.001 }; }, { shirt, pants: '#2b2f36', y: y0, carry: bag })));
    // Taxis along the street.
    [0, 0.5].forEach((o) => moving.push({ geo: sedan('#f2c230'), pivot: [0, y0, 4.2 + (o ? -0.3 : 0.3)], anim: (t) => { const f = cyc(t, 7, o), x = (o ? 1 : -1) * (-5.4 + f * 10.8); return { x, ry: o ? 0 : Math.PI, s: clamp01((5.0 - Math.abs(x)) / 0.6) * 0.75 + 0.001 }; } }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [1.2, y0, 0.2], topAt: [EX, fl + H + 0.8, EZ - 0.3] };
  },

  // Launch pad (defence and aerospace primes, defence tech): see first, answer first. On the test
  // range the radar sweeps, locks onto an incoming target drone, and an interceptor leaps from the
  // launcher truck to meet it; patrol drones circle, and on the pad the rocket lifts off its gantry.
  'rocket:0': () => {
    const R = rand(2601), out = [], moving = [];
    out.push(slab('#d6c29a'));
    // Range roads and the pad's apron.
    out.push(part(box(1.2, 0.03, 10.4), '#b8ab8e', { p: [0.4, y0 + 0.015, 0] }), part(box(10.4, 0.03, 1.0), '#b8ab8e', { p: [0, y0 + 0.015, 2.4] }));
    if (hi()) for (let i = 0; i < 24; i++) out.push(part(new THREE.SphereGeometry(0.1 + R() * 0.14, 7, 5), '#bba77e', { p: [(R() - 0.5) * 10, y0, (R() - 0.5) * 10], s: [1, 0.5, 1] }));
    // ---- the launch pad and gantry (back left)
    const PX = -3.0, PZ = -3.0, RH = 4.2, py = y0 + 0.5;
    out.push(part(cyl(1.7, 1.9, 0.5, 40), '#c9c4b8', { p: [PX, y0 + 0.25, PZ] }), part(cyl(0.55, 0.55, 0.06, 24), K.dark, { p: [PX, py, PZ] }), part(box(1.2, 0.3, 0.5), '#9aa1a9', { p: [PX + 1.5, y0 + 0.15, PZ + 1.2], r: [0, -0.8, 0] }));
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => out.push(part(box(0.18, 0.4, 0.18), K.steelDk, { p: [PX + sx * 0.45, py + 0.2, PZ + sz * 0.45] })));
    const GX = PX - 1.35, GZ = PZ - 0.6, GH = 4.9, gw = 0.32;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => out.push(part(box(0.08, GH, 0.08), K.red, { p: [GX + sx * gw, py + GH / 2, GZ + sz * gw] })));
    for (let y = 0.4; y < GH; y += 0.5) { out.push(part(box(gw * 2, 0.05, 0.06), K.redDk, { p: [GX, py + y, GZ - gw] }), part(box(0.06, 0.05, gw * 2), K.redDk, { p: [GX - gw, py + y, GZ] })); if (hi()) out.push(beam([GX + gw, py + y, GZ - gw], [GX + gw, py + y + 0.5, GZ + gw], 0.03, K.redDk), beam([GX - gw, py + y, GZ + gw], [GX + gw, py + y + 0.5, GZ + gw], 0.03, K.redDk)); }
    out.push(part(rbox(0.9, 0.1, 0.9, 0.03), K.steelDk, { p: [GX, py + GH, GZ] }), part(cyl(0.03, 0.03, 0.6, 6), K.steelDk, { p: [GX, py + GH + 0.3, GZ] }));
    // A water tower and the fuel spheres beside the pad.
    out.push(part(new THREE.SphereGeometry(0.55, hi() ? 24 : 10, hi() ? 16 : 6), K.white, { p: [-0.9, y0 + 0.95, -4.3] }), part(cyl(0.6, 0.6, 0.16, 20), 'A', { p: [-0.9, y0 + 0.95, -4.3] }), ring(4, (a) => beam([-0.9 + Math.cos(a) * 0.4, y0, -4.3 + Math.sin(a) * 0.4], [-0.9 + Math.cos(a) * 0.3, y0 + 0.7, -4.3 + Math.sin(a) * 0.3], 0.05, K.steelDk)));
    // ---- the radar site (back right) and mission control (front left)
    const DX = 2.9, DZ = -2.8;
    out.push(part(rbox(1.6, 0.9, 1.6, 0.06), '#e3e0da', { p: [DX, y0 + 0.45, DZ] }), part(box(1.62, 0.14, 1.62), 'A', { p: [DX, y0 + 0.83, DZ] }), part(cyl(0.3, 0.4, 0.8, 16), '#c9ced6', { p: [DX, y0 + 1.3, DZ] }));
    out.push(part(new THREE.SphereGeometry(0.7, hi() ? 28 : 10, hi() ? 18 : 6), K.white, { p: [4.2, y0 + 1.2, -4.4] }), part(cyl(0.5, 0.6, 0.6, 20), '#c9ced6', { p: [4.2, y0 + 0.3, -4.4] }));
    const MX = -3.2, MZ = 1.6;
    out.push(part(rbox(2.6, 1.2, 1.8, 0.06), '#eef0f2', { p: [MX, y0 + 0.6, MZ] }), part(box(2.62, 0.2, 1.82), 'A', { p: [MX, y0 + 1.1, MZ] }), part(rbox(2.0, 0.4, 0.05, 0.02), '#2a3c50', { p: [MX, y0 + 0.65, MZ + 0.91] }), part(rbox(0.05, 0.4, 1.2, 0.02), '#2a3c50', { p: [MX + 1.31, y0 + 0.65, MZ] }));
    out.push(part(cyl(0.03, 0.03, 0.9, 6), K.steelDk, { p: [MX - 0.8, y0 + 1.65, MZ - 0.5] }), part(cyl(0.03, 0.03, 0.7, 6), K.steelDk, { p: [MX - 0.5, y0 + 1.55, MZ - 0.5] }));
    // ---- the launcher truck (front right): eight-wheeler with its cell pack raised
    const LX = 2.6, LZ = 1.5;
    out.push(part(rbox(3.0, 0.3, 1.1, 0.04), '#5b6650', { p: [LX, y0 + 0.5, LZ] }), part(rbox(0.9, 0.8, 1.1, 0.1), '#6b7760', { p: [LX + 1.35, y0 + 0.95, LZ] }), part(box(0.04, 0.3, 0.9), '#26323f', { p: [LX + 1.81, y0 + 1.1, LZ] }));
    for (let i = 0; i < 4; i++) [-0.5, 0.5].forEach((z) => out.push(part(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14), '#1d1f24', { p: [LX - 1.1 + i * 0.75, y0 + 0.24, LZ + z], r: [Math.PI / 2, 0, 0] })));
    const cells = [part(rbox(1.3, 1.6, 0.95, 0.05), '#6b7760', { p: [0, 0.8, 0] }), part(box(1.32, 0.12, 0.97), 'A', { p: [0, 1.3, 0] })];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) cells.push(part(cyl(0.2, 0.2, 0.04, 16), K.dark, { p: [-0.3 + i * 0.6, 1.61, -0.22 + j * 0.44] }));
    out.push(place(merge(cells), { p: [LX - 0.5, y0 + 0.65, LZ], r: [0, 0, -0.35] }));
    [[4.5, 4.3], [-4.6, 4.4], [-1.4, 4.4]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.45 + R() * 0.15)));
    // ---- moving parts (one 12 s cycle)
    const P = 12, F = (t) => cyc(t, P);
    // The radar sweeps, then holds on the target from the lock to the intercept.
    const tgt = (f) => new V(5.8, 7.0, -4.8).lerp(new V(2.8, 5.4, -0.6), easeIO(win(f, 0, 0.6)) * 0.85 + win(f, 0, 0.6) * 0.15);
    const lockYaw = (f) => { const p = tgt(f); return Math.atan2(-(p.z - DZ), p.x - DX); };
    moving.push({ geo: radarDish(0.85, K.white), pivot: [DX, y0 + 1.9, DZ], anim: (t) => { const f = F(t), sweep = t * 1.6, lock = win(f, 0.25, 0.32) * (1 - win(f, 0.62, 0.68)); return { ry: sweep * (1 - lock) + lockYaw(Math.min(f, 0.6)) * lock }; } });
    // The lock ring pulses round the radar.
    moving.push({ geo: part(torus(0.9, 0.04, TAU, 32), '#ff5a4a', { r: [Math.PI / 2, 0, 0] }), pivot: [DX, y0 + 0.95, DZ], anim: (t) => { const f = F(t), k = cyc(f, 0.1); return { s: f > 0.28 && f < 0.6 ? 0.6 + k * 0.9 : 0.001 }; } });
    // The target drone, flying in high from the right.
    const tDrone = merge(part(capsule(0.16, 0.7), '#e5533d', { r: [0, 0, Math.PI / 2] }), part(box(0.1, 0.03, 1.3), '#b83a2a'), part(box(0.06, 0.25, 0.03), '#b83a2a', { p: [-0.4, 0.12, 0] }));
    moving.push({ geo: tDrone, pivot: [0, 0, 0], anim: (t) => { const f = F(t), p = tgt(Math.min(f, 0.6)), a = new V(2.8, 5.4, -0.6).sub(new V(5.8, 7.0, -4.8)); return { x: p.x, y: p.y, z: p.z, ry: Math.atan2(-a.z, a.x), s: f < 0.6 ? Math.min(1, f / 0.04) : 0.001 }; } });
    // The interceptor, out of the cell pack and up to meet it.
    const L0 = new V(LX - 0.5 + 0.28, y0 + 2.4, LZ);
    const iPath = (u) => { const T = tgt(0.6); return new V().lerpVectors(L0, T, u).add(new V(0, Math.sin(u * Math.PI) * 1.2, 0)); };
    moving.push({ geo: merge(part(capsule(0.09, 0.6), K.white), part(cone(0.09, 0.2, 12), 'A', { p: [0, 0.42, 0] }), ring(4, (a) => part(box(0.02, 0.16, 0.12), K.steelDk, { p: [Math.cos(a) * 0.08, -0.24, Math.sin(a) * 0.08], r: [0, -a, 0] })), place(flameGeo(), { p: [0, -0.36, 0], s: [0.18, 0.25, 0.18] })), pivot: [0, 0, 0], anim: (t) => {
      const f = F(t), u = easeIn(win(f, 0.4, 0.6)), p = iPath(u), d = iPath(Math.min(1, u + 0.02)).sub(p).normalize();
      return { x: p.x, y: p.y, z: p.z, q: new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), d.lengthSq() ? d : new V(0, 1, 0)), s: f > 0.4 && f < 0.6 ? 1 : 0.001 };
    } });
    // The intercept: a white flash and a ring of smoke.
    const T6 = tgt(0.6);
    moving.push({ geo: merge(puff(0.6), part(new THREE.SphereGeometry(0.4, 16, 12), K.yellow, {})), pivot: [0, 0, 0], anim: (t) => { const f = F(t), k = win(f, 0.6, 0.78); return { x: T6.x, y: T6.y, z: T6.z, s: f > 0.6 && f < 0.78 ? 0.4 + easeOut(k) * 1.2 : 0.001 }; } });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; moving.push({ geo: part(box(0.12, 0.08, 0.16), '#7d4a3a'), pivot: [0, 0, 0], anim: (t) => { const f = F(t), u = win(f, 0.6, 0.82); return { x: T6.x + Math.cos(a) * u * 1.2, y: T6.y + u * 0.4 - u * u * 3, z: T6.z + Math.sin(a) * u * 1.2, rx: u * 9, s: f > 0.6 && f < 0.82 ? 1 : 0.001 }; } }); }
    // The rocket on the pad: the gantry arm swings back, it lifts off on its flame, a fresh one is raised.
    const lift = (f) => easeIn(win(f, 0.72, 0.98)) * 14;
    const rk = moving.length;
    moving.push({ geo: rocketGeo(RH, '#f4f5f6', 'A', 'Ad'), pivot: [PX, py + 0.1, PZ], anim: (t) => { const f = F(t); return { y: lift(f) + (f < 0.08 ? -(1 - easeOut(f / 0.08)) * RH : 0), s: f < 0.08 ? Math.max(0.001, f / 0.08) : f > 0.97 ? 0.001 : 1 }; } });
    moving.push({ geo: place(flameGeo(), { s: [0.55, 0.7, 0.55] }), pivot: [0, -0.1, 0], parent: rk, anim: (t) => { const f = F(t); return { sy: f > 0.7 && f < 0.97 ? 0.8 + Math.sin(t * 30) * 0.15 : 0.001, s: f > 0.7 && f < 0.97 ? 1 : 0.001 }; } });
    moving.push({ geo: merge(part(box(1.0, 0.1, 0.14), K.redDk, { p: [0.5, 0, 0] }), part(rbox(0.14, 0.4, 0.4, 0.03), K.red, { p: [1.0, 0, 0] })), pivot: [GX + gw, py + RH * 0.7, GZ], anim: (t) => { const f = F(t), k = easeIO(win(f, 0.62, 0.7)) - easeIO(win(f, 0.05, 0.12)) * (f < 0.5 ? 1 : 0); return { ry: Math.atan2(-(PZ - GZ), PX - GX) - (f < 0.5 ? 1 - easeIO(win(f, 0.05, 0.12)) : k) * 1.3 }; } });
    // Smoke billowing off the pad at lift-off.
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.4; moving.push({ geo: puff(0.5), pivot: [PX, py, PZ], anim: (t) => { const f = F(t), u = win(f, 0.72, 0.99); return { x: Math.cos(a) * (0.6 + u * 1.4), z: Math.sin(a) * (0.6 + u * 1.4), y: u * 0.5, s: f > 0.72 && f < 0.99 ? (0.5 + u * 0.9) * (1 - win(f, 0.9, 0.99)) + 0.001 : 0.001 }; } }); }
    // Patrol drones circling the range.
    [[0, 3.4, 2.0], [Math.PI, 3.0, 2.6]].forEach(([o, h, r]) => moving.push({ geo: drone('A'), pivot: [0.2, y0 + h, 0.3], anim: (t) => { const a = t * 0.5 + o; return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: Math.sin(t * 2 + o) * 0.08, ry: -a }; } }));
    // A crew member walking from mission control toward the pad.
    moving.push(...walker(moving.length, (t) => { const k = Math.sin(t * 0.35); return { x: -1.0 + k * 0.1, z: 0.2 + k * 1.4, ry: Math.cos(t * 0.35) > 0 ? -Math.PI / 2 : Math.PI / 2 }; }, { shirt: K.orange, pants: '#3a4a3a', y: y0 }));
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-0.6, y0, 3.7], topAt: [MX - 0.2, y0 + 1.2, MZ + 0.2] };
  },
};
