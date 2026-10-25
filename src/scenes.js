// The shared industry shapes, rebuilt as small animated scenes to the signature models' standard
// (src/heroes.js): each sits on its own slab and shows how that kind of business wins. Unlike a
// signature model, one scene serves many companies, so it is painted partly in brand slots
// ('A'/'B' and darker 'Ad'/'Bd') and still takes each company's companion prop (at propAt, a
// free spot on the slab) and topper (at topAt). Keyed `kind:variant` (see models.js).
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
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-4.2, y0, 0.2], topAt: [BX, fl + H + 0.78, BZ - 0.45] };
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
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-4.1, y0, 0.6], topAt: [0, y0 + 2.95, HZ] };
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
    return { slab: true, move: () => ({}), geo: merge(out), moving, propAt: [-4.0, y0, -0.9], topAt: [BX, y0 + 3.12, BZ] };
  },
};
