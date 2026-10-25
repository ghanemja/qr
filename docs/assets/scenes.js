// The shared industry shapes, rebuilt as small animated scenes to the signature models' standard
// (src/heroes.js): each sits on its own slab and shows how that kind of business wins. Unlike a
// signature model, one scene serves many companies, so it is painted partly in brand slots
// ('A'/'B' and darker 'Ad'/'Bd') and still takes each company's companion prop (at propAt, a
// free spot on the slab) and topper (at topAt). Keyed `kind:variant` (see models.js).
// Same conventions as the heroes: slab top y0 = 0.24, keep within ±5.2, rest height ≤ 6.8, the
// camera looks from +x, +z.
import { THREE, V, part, windy, rand, taper, shade, tuft, merge, place, box, cyl, lathe, tube, ball, capsule, cone, torus, extrude, prism, star, beam, ring, hi, TAU, clamp01, cyc, win, easeIn, easeOut, easeIO, back, bump, hop, life, K } from './kit.js';
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
    [[4.6, -4.6], [-4.6, -4.4], [0.4, -4.4], [-4.7, 1.5]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.6 + R() * 0.25)));
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
};
