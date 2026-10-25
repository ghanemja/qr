// Signature models for the biggest names: each one shows the thing that put the company where it
// is (its moat), not just what it sells. Built with the same kit as the kinds of company, about
// 10 units tall at the origin; each is its own kind in models.js, with a finder colour and label.
import { THREE, V, part, windy, rand, taper, leafShape, shade, tuft, merge, place, box, cyl, lathe, tube, ball, cone, torus, extrude, beam, ring, hi, TAU, cyc, win, easeIn, easeOut, easeIO, back, bump, hop, life, K } from './kit.js';
import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';

// A box with a chosen corner radius (the kit's boxes pick a modest one themselves).
const rbox = (w, h, d, r) => (hi() ? new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d));
const curve = (pts, closed = false) => new THREE.CatmullRomCurve3(pts.map((p) => new V(...p)), closed);
const tubeOn = (c, r, segs) => new THREE.TubeGeometry(c, segs || (hi() ? 96 : 24), r, hi() ? 14 : 6, c.closed);
// Pose along a curve: position, plus the yaw that faces along it.
const along = (c, u) => { const p = c.getPointAt(u), d = c.getTangentAt(u); return { p, ry: Math.atan2(-d.z, d.x) }; };
// A cardboard parcel with its tape.
const parcel = (s = 1) => merge(part(box(1.3 * s, 0.9 * s, 1 * s), '#c99a62'), part(box(0.26 * s, 0.92 * s, 1.02 * s), '#e8d3ad'), part(box(1.32 * s, 0.06 * s, 0.3 * s), '#e8d3ad', { p: [0, 0.45 * s, 0] }));
const flameGeo = () => merge(part(lathe([[0, 0], [0.55, 0.25], [0.6, 0.7], [0.3, 1.6], [0, 2.4]]), K.orange, { r: [Math.PI, 0, 0] }), part(lathe([[0, 0], [0.32, 0.2], [0.34, 0.6], [0, 1.4]]), K.yellow, { p: [0, -0.1, 0], r: [Math.PI, 0, 0] }));
const puff = (r = 0.8) => part(ball(r), '#f1eee8');

// ---------- set dressing shared by the heroes ----------
// A small tree of leaf cards that sways (s ≈ 1 is about 2 units tall).
// On the map (low detail) the set dressing is left out: it can't be seen at that size, and it is
// most of a scene's weight. Cars and carts keep a cheap stand-in; people move but aren't drawn.
const miniTree = (R, x, y, z, s = 1, greens = ['#6fbf4c', '#86cc5f', '#5fae45', '#9bd85f']) => {
  if (!hi()) return [];
  const leaf = leafShape(0), g = [part(taper([[x, y, z], [x + 0.05 * s, y + 0.8 * s, z], [x, y + 1.45 * s, z + 0.04]], 0.1 * s, 0.05 * s, 8), '#7a5233')];
  for (let c = 0; c < 4; c++) {
    const cx = x + (R() - 0.5) * 0.7 * s, cy = y + (1.35 + R() * 0.7) * s, cz = z + (R() - 0.5) * 0.7 * s;
    for (let i = 0, n = hi() ? 26 : 8; i < n; i++) {
      const d = new V(R() * 2 - 1, R() * 2 - 0.8, R() * 2 - 1).normalize(), at = new V(cx, cy, cz).addScaledVector(d, 0.45 * s * (0.5 + 0.5 * R()));
      g.push(windy(part(leaf, shade(greens[Math.floor(R() * greens.length)], 0.72 + 0.35 * (d.y * 0.5 + 0.5)), { p: at.toArray(), q: new THREE.Quaternion().setFromUnitVectors(new V(0, 0, 1), d), s: 0.32 * s * (0.8 + R() * 0.4) }), 0.5));
    }
  }
  return g;
};
// A street lamp at (x, y, z), its arm reaching along angle a.
const lampPost = (x, y, z, a) => (!hi() ? [] : [part(cyl(0.06, 0.08, 3.4, 12), '#5b616b', { p: [x, y + 1.7, z] }), beam([x, y + 3.35, z], [x + Math.cos(a) * 0.7, y + 3.45, z + Math.sin(a) * 0.7], 0.06, '#5b616b'),
  part(rbox(0.45, 0.12, 0.22, 0.05), '#3a3f47', { p: [x + Math.cos(a) * 0.75, y + 3.42, z + Math.sin(a) * 0.75], r: [0, -a, 0] }), part(box(0.38, 0.02, 0.16), '#fff6d8', { p: [x + Math.cos(a) * 0.75, y + 3.35, z + Math.sin(a) * 0.75], r: [0, -a, 0] })]);
// A family car, nose along +x, sitting on y = 0, about 2.3 long.
const sedan = (color) => (!hi() ? merge(part(new THREE.BoxGeometry(2.3, 0.6, 1.05), color, { p: [0, 0.4, 0] }), part(new THREE.BoxGeometry(1.2, 0.45, 0.95), '#26323f', { p: [-0.15, 0.9, 0] })) : merge(part(rbox(2.3, 0.55, 1.05, 0.22), color, { p: [0, 0.48, 0] }), part(rbox(1.25, 0.5, 0.95, 0.22), color, { p: [-0.15, 0.95, 0] }),
  part(box(1.18, 0.36, 0.97), '#26323f', { p: [-0.15, 0.98, 0] }), part(box(0.04, 0.08, 0.8), '#fff2c6', { p: [1.16, 0.55, 0] }), part(box(0.04, 0.08, 0.8), '#b8202a', { p: [-1.16, 0.55, 0] }),
  [[-0.72, 0.5], [0.72, 0.5], [-0.72, -0.5], [0.72, -0.5]].flatMap(([x, z]) => [part(cyl(0.22, 0.22, 0.16, 18), '#1d1f24', { p: [x, 0.22, z], r: [Math.PI / 2, 0, 0] }), part(cyl(0.12, 0.12, 0.17, 14), '#c9ced6', { p: [x, 0.22, z], r: [Math.PI / 2, 0, 0] })])));
// A shopping cart, handle at -x, about 1 long.
const cartGeo = (handle = '#0071ce') => (!hi() ? part(new THREE.BoxGeometry(1.1, 0.5, 0.8), '#aab3bc', { p: [0, 0.65, 0] }) : merge(
  [[-0.45, -0.32], [0.45, -0.32], [0.45, 0.32], [-0.45, 0.32]].map(([x, z], i, a) => beam([x, 0.42, z], [a[(i + 1) % 4][0], 0.42, a[(i + 1) % 4][1]], 0.04, '#aab3bc')),
  [[-0.55, -0.4], [0.55, -0.4], [0.55, 0.4], [-0.55, 0.4]].map(([x, z], i, a) => beam([x, 0.9, z], [a[(i + 1) % 4][0], 0.9, a[(i + 1) % 4][1]], 0.045, '#aab3bc')),
  [[-0.45, -0.32, -0.55, -0.4], [0.45, -0.32, 0.55, -0.4], [0.45, 0.32, 0.55, 0.4], [-0.45, 0.32, -0.55, 0.4]].map(([x0, z0, x1, z1]) => beam([x0, 0.42, z0], [x1, 0.9, z1], 0.04, '#aab3bc')),
  [-0.2, 0.1, 0.35].map((x) => beam([x, 0.42, -0.34], [x * 1.1, 0.9, -0.42], 0.025, '#aab3bc')), [-0.2, 0.1, 0.35].map((x) => beam([x, 0.42, 0.34], [x * 1.1, 0.9, 0.42], 0.025, '#aab3bc')),
  beam([-0.55, 0.9, -0.4], [-0.72, 1.05, -0.4], 0.04, '#aab3bc'), beam([-0.55, 0.9, 0.4], [-0.72, 1.05, 0.4], 0.04, '#aab3bc'), part(cyl(0.05, 0.05, 0.86, 10), handle, { p: [-0.72, 1.05, 0], r: [Math.PI / 2, 0, 0] }),
  part(box(0.9, 0.03, 0.64), '#c8d0d8', { p: [0, 0.42, 0] }), [[-0.38, -0.28], [0.38, -0.28], [0.38, 0.28], [-0.38, 0.28]].flatMap(([x, z]) => [beam([x, 0.42, z], [x, 0.12, z], 0.035, '#aab3bc'), part(cyl(0.08, 0.08, 0.06, 12), '#1d1f24', { p: [x, 0.08, z], r: [Math.PI / 2, 0, 0] })])));
// A person walking along path(t) → { x, z, ry } (they face +x), with swinging arms and legs.
// Returns the moving parts; `base` is the index the first one will have in the model's list.
const walker = (base, path, { shirt = '#3d7be0', pants = '#2b3a55', skin = '#e9b98f', hair = '#3a2a20', y = 0, carry = null } = {}) => {
  const step = (t, k) => Math.sin(t * 7 + k) * 0.55, show = hi();
  return [
    { geo: show ? merge(part(new THREE.CapsuleGeometry(0.2, 0.42, 6, 14), shirt, { p: [0, 1.02, 0] }), part(ball(0.17), skin, { p: [0, 1.55, 0] }), part(ball(0.18), hair, { p: [-0.02, 1.6, 0], s: [1, 0.7, 1] }), part(box(0.24, 0.12, 0.42), pants, { p: [0, 0.72, 0] }), carry || []) : null,
      pivot: [0, y, 0], anim: (t) => { const p = path(t); return { x: p.x, z: p.z, ry: p.ry, y: Math.abs(Math.sin(t * 7)) * 0.03, s: p.s ?? 1 }; } },
    ...[-0.1, 0.1].map((z, i) => ({ geo: show ? part(new THREE.CapsuleGeometry(0.075, 0.5, 4, 10), pants, { p: [0, -0.3, 0] }) : null, pivot: [0, 0.72, z], parent: base, anim: (t) => ({ rz: path(t).still ? 0 : step(t, i * Math.PI) }) })),
    ...[-0.26, 0.26].map((z, i) => ({ geo: show ? part(new THREE.CapsuleGeometry(0.06, 0.4, 4, 10), shirt, { p: [0, -0.25, 0] }) : null, pivot: [0, 1.25, z], parent: base, anim: (t) => (path(t).push ? { rz: 1.2 } : { rz: path(t).still ? 0 : -step(t, i * Math.PI) * 0.8 }) })),
  ];
};

export const HEROES = {
  // Amazon: the logistics machine. A fulfilment centre with a trailer at its dock sends parcels
  // down a smile-shaped conveyor; a delivery drone collects one at the arrow and flies it off,
  // and an electric delivery van heads out along the lot.
  amazon: { finder: '#ff9900', build: () => {
    const R = rand(5), ORANGE = '#ff9900', NAVY = '#232f3e', PRIME = '#1a98ff', y0 = 0.24;
    const out = [];
    // ---- the lot: asphalt, painted bays, kerbs, planted strips with trees, lamp posts
    out.push(part(rbox(10.4, 0.24, 10.4, 0.08), '#5b616b', { p: [0, 0.12, 0] }));
    for (let i = 0; i < 6; i++) out.push(part(box(0.06, 0.012, 1.2), '#e9e6df', { p: [-3.6 + i * 0.9, y0 + 0.006, 4.0] }));
    out.push(part(box(9.6, 0.012, 0.06), '#f2c94c', { p: [0, y0 + 0.006, 3.3] }), part(box(0.06, 0.012, 7.2), '#f2c94c', { p: [3.15, y0 + 0.006, -1] }));
    const strip = (x0, z0, w, d) => { out.push(part(rbox(w, 0.18, d, 0.06), '#c9c4b8', { p: [x0, y0 + 0.09, z0] }), part(box(w - 0.2, 0.1, d - 0.2), '#6aa84f', { p: [x0, y0 + 0.16, z0] })); };
    strip(-0.5, -4.85, 9.4, 0.7); strip(-4.85, 0.3, 0.7, 9.4);
    const miniTree = (x, z, s) => {
      if (!hi()) return [];
      const leaf = leafShape(0), g = [part(taper([[x, y0 + 0.2, z], [x + 0.05 * s, y0 + 0.9 * s, z], [x, y0 + 1.6 * s, z + 0.04]], 0.1 * s, 0.05 * s, 8), '#7a5233')];
      for (let c = 0; c < 4; c++) {
        const cx = x + (R() - 0.5) * 0.7 * s, cy = y0 + (1.5 + R() * 0.7) * s, cz = z + (R() - 0.5) * 0.7 * s;
        for (let i = 0, n = hi() ? 26 : 8; i < n; i++) {
          const d = new V(R() * 2 - 1, R() * 2 - 0.8, R() * 2 - 1).normalize(), at = new V(cx, cy, cz).addScaledVector(d, 0.45 * s * (0.5 + 0.5 * R()));
          const k = 0.72 + 0.35 * (d.y * 0.5 + 0.5);
          g.push(windy(part(leaf, shade(['#6fbf4c', '#86cc5f', '#5fae45', '#9bd85f'][Math.floor(R() * 4)], k), { p: at.toArray(), q: new THREE.Quaternion().setFromUnitVectors(new V(0, 0, 1), d), s: 0.32 * s * (0.8 + R() * 0.4) }), 0.5));
        }
      }
      return g;
    };
    [[-3.6, -4.85, 1], [-1.2, -4.85, 0.85], [1.6, -4.85, 1.05], [-4.85, -2.2, 0.9], [-4.85, 1.2, 1], [-4.85, 3.9, 0.85]].forEach(([x, z, s]) => out.push(miniTree(x, z, s)));
    if (hi()) [[3.9, -4.85], [-4.85, -0.5], [0.2, -4.85], [-4.85, 2.6]].forEach(([x, z]) => out.push(tuft(R, x, z, 0.25, hi() ? 14 : 5, ['#6cc23a', '#7fcf3f', '#94d84f'], 0.45).map((g) => g.translate(0, y0 + 0.2, 0))));
    const lamp = (x, z, a) => !hi() ? [] : [part(cyl(0.06, 0.08, 3.4, 12), '#5b616b', { p: [x, y0 + 1.7, z] }), beam([x, y0 + 3.35, z], [x + Math.cos(a) * 0.7, y0 + 3.45, z + Math.sin(a) * 0.7], 0.06, '#5b616b'), part(rbox(0.45, 0.12, 0.22, 0.05), '#3a3f47', { p: [x + Math.cos(a) * 0.75, y0 + 3.42, z + Math.sin(a) * 0.75], r: [0, -a, 0] }), part(box(0.38, 0.02, 0.16), '#fff6d8', { p: [x + Math.cos(a) * 0.75, y0 + 3.35, z + Math.sin(a) * 0.75], r: [0, -a, 0] })];
    out.push(lamp(4.7, 1.2, Math.PI), lamp(-3.9, 4.7, -Math.PI / 2));

    // ---- the fulfilment centre: ribbed cladding, dark parapet with the smile, roof plant, docks
    const B = { x0: -4.2, x1: 1.4, z0: -4.1, z1: 0.2, h: 3.4 }, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2;
    out.push(part(box(B.x1 - B.x0, B.h, B.z1 - B.z0), '#ebe8e1', { p: [cx, y0 + B.h / 2, cz] }));
    for (let x = B.x0 + 0.2; x < B.x1 - 0.1; x += 0.24) out.push(part(box(0.07, B.h - 0.7, 0.05), '#d8d4ca', { p: [x, y0 + (B.h - 0.7) / 2 + 0.1, B.z1 + 0.025] }));
    for (let z = B.z0 + 0.2; z < B.z1 - 0.1; z += 0.24) out.push(part(box(0.05, B.h - 0.7, 0.07), '#d8d4ca', { p: [B.x1 + 0.025, y0 + (B.h - 0.7) / 2 + 0.1, z] }));
    out.push(part(box(B.x1 - B.x0 + 0.12, 0.62, B.z1 - B.z0 + 0.12), NAVY, { p: [cx, y0 + B.h - 0.2, cz] }), part(box(B.x1 - B.x0 + 0.2, 0.08, B.z1 - B.z0 + 0.2), '#3a4656', { p: [cx, y0 + B.h + 0.13, cz] }));
    // The smile on the parapet.
    const smileLogo = curve([[-2.9, y0 + 3.08, B.z1 + 0.09], [-2.2, y0 + 2.92, B.z1 + 0.09], [-1.3, y0 + 2.95, B.z1 + 0.09], [-0.75, y0 + 3.12, B.z1 + 0.09]]);
    out.push(part(tubeOn(smileLogo, 0.055, 32), ORANGE), part(cone(0.1, 0.22, 12), ORANGE, { p: [-0.68, y0 + 3.16, B.z1 + 0.09], r: [0, 0, -1.1] }));
    out.push(part(box(B.x1 - B.x0 - 0.2, 0.06, B.z1 - B.z0 - 0.2), '#c3c7cc', { p: [cx, y0 + B.h + 0.03, cz] }));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) out.push(part(box(0.5, 0.05, 1.3), '#9fc6e0', { p: [-3.5 + i * 1.5, y0 + B.h + 0.08, -3.2 + j * 1.9] }), part(box(0.58, 0.07, 1.38), '#e9e6df', { p: [-3.5 + i * 1.5, y0 + B.h + 0.06, -3.2 + j * 1.9] }));
    [[0.3, -3.3], [0.3, -1.5], [-3.6, -0.7]].forEach(([x, z]) => out.push(part(rbox(0.9, 0.48, 0.75, 0.08), '#a7adb4', { p: [x, y0 + B.h + 0.3, z] }), part(cyl(0.26, 0.26, 0.06, 20), '#3a3f47', { p: [x, y0 + B.h + 0.56, z] }), part(torus(0.26, 0.03, TAU, 24), '#8d939a', { p: [x, y0 + B.h + 0.6, z], r: [Math.PI / 2, 0, 0] })));
    // Entrance on the front.
    out.push(part(box(1, 1.5, 0.06), '#2c3e55', { p: [-3.4, y0 + 0.75, B.z1 + 0.04] }), part(box(0.03, 1.5, 0.08), '#9aa4b1', { p: [-3.4, y0 + 0.75, B.z1 + 0.05] }), part(rbox(1.5, 0.1, 0.7, 0.04), NAVY, { p: [-3.4, y0 + 1.7, B.z1 + 0.35] }));
    // Loading docks on the side: roll-up doors, bumpers, a canopy, and a trailer backed in.
    const docks = [-3.3, -2.0, -0.7];
    docks.forEach((z) => {
      out.push(part(box(0.06, 1.9, 1.05), '#3a3f47', { p: [B.x1 + 0.06, y0 + 0.95, z] }));
      for (let k = 0; k < 9; k++) out.push(part(box(0.05, 0.17, 0.92), k % 2 ? '#c6cbd1' : '#b3b9c0', { p: [B.x1 + 0.1, y0 + 0.12 + k * 0.19, z] }));
      out.push(part(rbox(0.16, 0.3, 0.14, 0.04), '#1d1f24', { p: [B.x1 + 0.14, y0 + 0.4, z - 0.42] }), part(rbox(0.16, 0.3, 0.14, 0.04), '#1d1f24', { p: [B.x1 + 0.14, y0 + 0.4, z + 0.42] }), part(box(0.5, 0.02, 1.1), '#f2c94c', { p: [B.x1 + 0.4, y0 + 0.01, z] }));
    });
    out.push(part(rbox(0.9, 0.1, 4.0, 0.04), NAVY, { p: [B.x1 + 0.45, y0 + 2.2, -2] }), [-3.9, -0.1].map((z) => beam([B.x1 + 0.85, y0 + 2.2, z], [B.x1 + 0.05, y0 + 2.9, z], 0.05, '#3a3f47')));
    const trailer = merge(part(rbox(3.2, 1.75, 1.1, 0.08), '#f4f5f6', { p: [0, 1.15, 0] }), part(box(3.1, 0.3, 0.02), PRIME, { p: [0, 0.75, 0.56] }), part(box(3.1, 0.05, 0.02), PRIME, { p: [0, 1.95, 0.56] }),
      part(tubeOn(curve([[-0.9, 1.45, 0.565], [-0.3, 1.3, 0.565], [0.4, 1.32, 0.565], [0.85, 1.5, 0.565]]), 0.04, 24), ORANGE),
      part(box(0.9, 0.12, 1), '#3a3f47', { p: [1.1, 0.25, 0] }), [[0.9, 0.42], [1.35, 0.42], [0.9, -0.42], [1.35, -0.42]].map(([x, z]) => part(cyl(0.21, 0.21, 0.16, 18), '#1d1f24', { p: [x, 0.22, z], r: [Math.PI / 2, 0, 0] })),
      [-0.9, -0.9].map((x, i) => part(box(0.05, 0.42, 0.05), '#5b616b', { p: [x, 0.3, i ? 0.4 : -0.4] })));
    out.push(place(trailer, { p: [B.x1 + 1.75, y0, -2] }));

    // ---- the smile conveyor: rollers between orange rails, on legs, out of the building
    const belt = curve([[-2.6, y0 + 1.15, B.z1 + 0.3], [-2.4, y0 + 0.95, 1.6], [-1.0, y0 + 0.82, 2.75], [0.9, y0 + 0.86, 3.0], [2.35, y0 + 1.05, 2.45]]);
    const L = belt.getLength(), side = (u, o) => { const p = belt.getPointAt(u), t = belt.getTangentAt(u); return p.clone().add(new V(-t.z, 0, t.x).normalize().multiplyScalar(o)); };
    for (let s = 0.1; s < L; s += 0.2) {
      const u = s / L, p = belt.getPointAt(u), t = belt.getTangentAt(u);
      out.push(part(cyl(0.065, 0.065, 0.92, 10), '#9aa1a9', { p: p.toArray(), q: new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), new V(-t.z, 0, t.x).normalize()) }));
    }
    [-0.5, 0.5].forEach((o) => out.push(part(tubeOn(curve(Array.from({ length: 12 }, (_, i) => side(i / 11, o).toArray())), 0.07, 64), ORANGE)));
    for (let s = 0.4; s < L; s += 1.05) { const u = s / L; [-0.45, 0.45].forEach((o) => { const p = side(u, o); out.push(part(cyl(0.05, 0.05, p.y - y0, 8), '#5b616b', { p: [p.x, (p.y + y0) / 2, p.z] })); }); }
    // The arrow at the end of the smile.
    const end = belt.getPointAt(1), dir = belt.getTangentAt(1);
    out.push(part(cone(0.75, 1, 3), ORANGE, { p: end.clone().addScaledVector(dir, 0.5).toArray(), q: new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), dir.clone().setY(0).normalize()), s: [1, 1, 0.25] }));

    // ---- parcels of different sizes, with tape and a label
    const box3 = (w, h, d) => merge(part(rbox(w, h, d, 0.03), '#c99a62'), part(box(w + 0.01, 0.012, 0.12), '#e3c690', { p: [0, h / 2, 0] }), part(box(0.012, h * 0.5, 0.12), '#e3c690', { p: [w / 2, h / 4, 0] }), part(box(w * 0.38, 0.01, d * 0.32), K.white, { p: [w * 0.18, h / 2 + 0.006, d * 0.2] }), part(box(w * 0.2, 0.012, d * 0.05), '#2b2f36', { p: [w * 0.14, h / 2 + 0.012, d * 0.26] }));
    const sizes = [[0.62, 0.42, 0.5], [0.45, 0.3, 0.4], [0.7, 0.5, 0.56], [0.5, 0.36, 0.44], [0.4, 0.4, 0.4]];

    // ---- the delivery drone and its route
    const arm = (a) => part(taper([[0, 0, 0], [Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5], [Math.cos(a) * 0.95, 0.1, Math.sin(a) * 0.95]], 0.07, 0.05, 10), '#e9eef3');
    const drone = merge(part(rbox(0.95, 0.3, 0.7, 0.14), '#f1f4f7'), part(ball(0.28), NAVY, { p: [0.1, 0.13, 0], s: [1.2, 0.55, 1] }), part(box(0.5, 0.04, 0.02), PRIME, { p: [0, 0, 0.36] }),
      [0.785, 2.356, 3.927, 5.498].flatMap((a, i) => [arm(a), part(cyl(0.12, 0.14, 0.2, 16), '#2b2f36', { p: [Math.cos(a) * 0.95, 0.16, Math.sin(a) * 0.95] }), part(ball(0.04), i < 2 ? '#5fd08f' : '#e5533d', { p: [Math.cos(a) * 1.07, 0.08, Math.sin(a) * 1.07] })]),
      [-0.25, 0.25].flatMap((z) => [part(tubeOn(curve([[-0.45, -0.42, z], [0, -0.45, z], [0.45, -0.42, z]]), 0.03, 12), '#5b616b'), beam([-0.2, -0.15, z * 0.8], [-0.25, -0.43, z], 0.04, '#5b616b'), beam([0.2, -0.15, z * 0.8], [0.25, -0.43, z], 0.04, '#5b616b')]));
    const blade = part(extrude([[0, -0.05], [0.25, -0.07], [0.55, -0.04], [0.6, 0], [0.55, 0.04], [0.25, 0.06], [0, 0.05]], 0.02), '#dfe5ec', { r: [Math.PI / 2, 0, 0] });
    const prop = merge(blade, place(blade, { r: [0, Math.PI, 0] }), part(cyl(0.05, 0.05, 0.06, 10), '#2b2f36'));
    const pick = end.clone().addScaledVector(dir, 0.2).add(new V(0, 1.15, 0)).toArray(), H = 6.6;
    const loop = (th) => [Math.cos(th) * 3.6 - 0.5, H + Math.sin(th * 2) * 0.3, Math.sin(th) * 3.4 - 0.6];
    const th0 = Math.atan2((pick[2] + 0.6) / 3.4, (pick[0] + 0.5) / 3.6);
    const dronePath = (t) => {
      const f = cyc(t, 10), top = [pick[0], H, pick[2]], start = loop(th0), mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
      if (f < 0.12) return mix(start, top, easeIO(f / 0.12));
      if (f < 0.26) return mix(top, pick, easeIO(win(f, 0.12, 0.26)));
      if (f < 0.34) return pick;
      if (f < 0.48) return mix(pick, top, easeIO(win(f, 0.34, 0.48)));
      if (f < 0.6) return mix(top, start, easeIO(win(f, 0.48, 0.6)));
      return loop(th0 + TAU * easeIO(win(f, 0.6, 1)));
    };
    // ---- the electric delivery van
    const van = merge(part(rbox(2.5, 1.45, 1.15, 0.3), '#eef0f2', { p: [0, 0.98, 0] }), part(rbox(0.5, 0.75, 1.1, 0.2), '#eef0f2', { p: [1.3, 0.62, 0] }),
      part(box(0.3, 0.55, 1.0), '#22303e', { p: [1.12, 1.33, 0], r: [0, 0, -0.35] }), part(box(0.03, 0.06, 1.0), '#e8f4ff', { p: [1.56, 0.86, 0] }), part(box(2.1, 0.12, 0.02), PRIME, { p: [-0.2, 0.7, 0.58] }),
      part(tubeOn(curve([[-0.9, 1.25, 0.585], [-0.4, 1.1, 0.585], [0.2, 1.12, 0.585], [0.55, 1.3, 0.585]]), 0.035, 20), ORANGE),
      [[-0.8, 0.5], [0.95, 0.5], [-0.8, -0.5], [0.95, -0.5]].flatMap(([x, z]) => [part(cyl(0.27, 0.27, 0.2, 20), '#1d1f24', { p: [x, 0.27, z], r: [Math.PI / 2, 0, 0] }), part(cyl(0.15, 0.15, 0.21, 16), '#c9ced6', { p: [x, 0.27, z], r: [Math.PI / 2, 0, 0] })]));

    return {
      bare: true, move: () => ({}),
      geo: merge(out),
      moving: [
        // 0-4: parcels riding the conveyor
        ...sizes.map((sz, i) => ({ geo: box3(...sz), pivot: [0, 0, 0], anim: (t) => {
          const u = cyc(t, 7, i / sizes.length), { p, ry } = along(belt, Math.min(0.98, u));
          return { x: p.x, y: p.y + 0.07 + sz[1] / 2, z: p.z, ry: ry + (i % 2) * 0.2, s: u < 0.05 ? u / 0.05 : u > 0.92 ? Math.max(0.001, 1 - (u - 0.92) / 0.06) : 1 };
        } })),
        // 5: the drone, 6-9: its propellers, 10: the parcel on its tether
        { geo: drone, pivot: [0, 0, 0], anim: (t) => { const p = dronePath(t); return { x: p[0], y: p[1], z: p[2], ry: -t * 0.3, rz: Math.sin(t * 1.3) * 0.05, rx: Math.cos(t * 1.1) * 0.05, s: 1.25 }; } },
        ...[0.785, 2.356, 3.927, 5.498].map((a, i) => ({ geo: prop, pivot: [Math.cos(a) * 0.95, 0.3, Math.sin(a) * 0.95], parent: 5, anim: (t) => ({ ry: t * (i % 2 ? 34 : -34) }) })),
        { geo: merge(beam([0, 0, 0], [0, -0.55, 0], 0.025, '#2b2f36'), box3(0.45, 0.32, 0.38).translate(0, -0.72, 0)), pivot: [0, -0.45, 0], parent: 5, anim: (t) => { const f = cyc(t, 10); return { s: f > 0.3 && f < 0.88 ? (f > 0.82 ? 1 - win(f, 0.82, 0.88) : 1) : 0, rz: Math.sin(t * 2.2) * 0.12 }; } },
        // 11: the van heading out along the lot
        { geo: van, pivot: [0, y0, 4.45], anim: (t) => { const f = cyc(t, 9), x = -3.9 + f * 9.3; return { x, ry: 0, y: Math.abs(Math.sin(t * 11)) * 0.015, s: f < 0.06 ? f / 0.06 : f > 0.94 ? (1 - f) / 0.06 : 1 }; } },
      ],
    };
  } },

  // Berkshire Hathaway: compounding. Buffett's snowball: a small push at the top of a long wet
  // hill, and it rolls down gathering coins and growing, carving its track, until it comes to
  // rest by Berkshire's famously modest head office.
  berkshire: { finder: '#c9a227', build: () => {
    const R = rand(23), out = [], X0 = -4.4, X1 = 3.0;
    // The hillside: steep at the top, easing out at the bottom, with soft bumps and a groove
    // the snowball follows.
    const slope = (x) => { const u = Math.min(1, Math.max(0, (x - X0) / (X1 - X0))); return 0.9 + 5.4 * (1 - u) ** 2.1; };
    const h = (x, z) => slope(x) + 0.18 * Math.sin(x * 1.3 + z * 0.9) * Math.cos(z * 1.1) - 0.32 * Math.exp(-(z * z) / 0.9) * (x < X1 + 0.6 ? 1 : 0) + 0.08 * Math.sin(x * 4.1 + z * 3.3);
    const N = hi() ? 72 : 20, terr = new THREE.PlaneGeometry(10, 10, N, N).rotateX(-Math.PI / 2), tp = terr.attributes.position;
    for (let i = 0; i < tp.count; i++) tp.setY(i, h(tp.getX(i), tp.getZ(i)));
    terr.computeVertexNormals();
    out.push(part(terr, (x, y, z) => { const n = 0.5 + 0.5 * Math.sin(x * 2.3 + z * 1.7); return shade('#f3f6fa', 0.93 + n * 0.07 - Math.max(0, 0.35 - y * 0.05) * 0.05); }));
    // The block's sides: layered earth under a snow lip.
    [[0, 5, 0], [5, 0, Math.PI / 2]].forEach(([x, z, ry]) => {
      // Rows of vertices up the wall so the strata show as bands: a snow lip, then earth and rock.
      const rows = hi() ? 40 : 8, wall = new THREE.PlaneGeometry(10, 1, N, rows), wp = wall.attributes.position;
      for (let i = 0; i < wp.count; i++) { const u = wp.getX(i), f = wp.getY(i) + 0.5, wx = ry ? 5 : u, wz = ry ? -u : 5; wp.setY(i, f * h(wx, wz)); }
      wall.computeVertexNormals();
      const strata = ['#8a6a4e', '#a07a56', '#7d5f45', '#9a8a7a', '#6f5440'];
      out.push(part(wall, (X, Y, Z) => { const top = h(ry ? 5 : X, ry ? Z : 5); if (Y > top - 0.22) return '#eef2f7'; const band = Math.floor((Y + 0.12 * Math.sin(X * 1.7)) / 0.42); return strata[((band % 5) + 5) % 5]; }, { p: [x, 0, z], r: [0, ry, 0] }));
    });
    // Pines with snow on their boughs, and rocks through the snow.
    const pine = (x, z, s) => {
      const y = h(x, z) - 0.05, g = [part(cyl(0.09 * s, 0.13 * s, 0.6 * s, 8), '#5a3d28', { p: [x, y + 0.3 * s, z] })];
      for (let k = 0; k < 4; k++) {
        const ty = y + (0.5 + k * 0.45) * s, r = (0.95 - k * 0.2) * s, tier = new THREE.ConeGeometry(r, 0.8 * s, hi() ? 14 : 7, 1), q = tier.attributes.position;
        for (let i = 0; i < q.count; i++) if (q.getY(i) < 0) { const j = 0.82 + 0.3 * ((i * 7919) % 13) / 13; q.setX(i, q.getX(i) * j); q.setZ(i, q.getZ(i) * j); }
        tier.computeVertexNormals();
        g.push(part(tier, shade('#2f6b4a', 0.85 + k * 0.08), { p: [x, ty + 0.4 * s, z], r: [0, R() * TAU, 0] }));
        g.push(part(cone(r * 0.62, 0.32 * s, hi() ? 14 : 7), '#f6f8fb', { p: [x, ty + 0.62 * s, z] }));
      }
      return g;
    };
    [[-3.7, -2.6, 0.95], [-2.2, -3.6, 0.8], [-3.2, 2.5, 0.85], [-1.4, 3.3, 0.75], [-0.4, -2.4, 0.7], [0.9, 3.6, 0.8], [1.8, -3.4, 0.9], [-4.3, 0.9, 0.7], [-1.9, -1.4, 0.6]].forEach(([x, z, s]) => out.push(pine(x, z, s)));
    [[-2.8, 1.5, 0.35], [0.4, -1.6, 0.28], [2.6, 2.2, 0.32], [-0.9, 2.1, 0.22]].forEach(([x, z, r]) => out.push(part(new THREE.IcosahedronGeometry(r, 1), '#8d939a', { p: [x, h(x, z), z], s: [1.3, 0.8, 1] }), part(new THREE.SphereGeometry(r * 0.9, 12, 6, 0, TAU, 0, Math.PI / 3), '#f6f8fb', { p: [x, h(x, z) + r * 0.25, z], s: [1.3, 0.8, 1] })));
    // Berkshire's small brick head office at the bottom, with a flag.
    const hx = 3.8, hz = -2.9, hy = h(hx, hz) - 0.05;
    out.push(part(box(1.8, 1.5, 1.4), '#a4553c', { p: [hx, hy + 0.75, hz] }), part(box(1.9, 0.12, 1.5), '#e9eef4', { p: [hx, hy + 1.56, hz] }));
    for (let y = 0.2; y < 1.4; y += 0.14) out.push(part(box(1.82, 0.015, 1.42), '#8f4631', { p: [hx, hy + y, hz] }));
    [[-0.5, 0.95], [0.5, 0.95], [-0.5, 0.45], [0.5, 0.45]].forEach(([dx, y]) => out.push(part(box(0.38, 0.32, 0.03), '#2c3e55', { p: [hx + dx, hy + y, hz + 0.71] }), part(box(0.44, 0.05, 0.06), '#f4f5f6', { p: [hx + dx, hy + y - 0.18, hz + 0.72] })));
    out.push(part(box(0.36, 0.6, 0.03), '#3a2a20', { p: [hx, hy + 0.3, hz + 0.71] }), part(cyl(0.03, 0.03, 1.4, 8), '#c9ced6', { p: [hx + 0.75, hy + 2.25, hz] }));
    // ---- the roll
    const roll = (t) => {
      const f = cyc(t, 7), k = easeIn(win(f, 0.08, 0.78)) * 0.94 + 0.03, x = X0 + 0.3 + (X1 + 0.2 - X0 - 0.3) * k, r = 0.28 + 1.05 * k ** 0.85;
      return { f, k, x, r, y: h(x, 0) + r * 0.92 };
    };
    const snowball = merge(part(ball(1), '#f6f8fb'), Array.from({ length: 14 }, (_, i) => { const d = new V(Math.cos(i * 2.4) * Math.sin(1 + i * 0.7), Math.cos(1 + i * 0.7), Math.sin(i * 2.4) * Math.sin(1 + i * 0.7)).normalize(); return part(cyl(0.16, 0.16, 0.05, 18), i % 3 ? K.gold : K.goldDk, { p: d.clone().multiplyScalar(0.985).toArray(), q: new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), d) }); }));
    const trackN = hi() ? 26 : 8, coinsOnPath = [-3.4, -2.6, -1.8, -1.0, -0.3, 0.4, 1.1, 1.8, 2.4];
    return {
      bare: true, move: () => ({}),
      geo: merge(out),
      moving: [
        { geo: snowball, pivot: [0, 0, 0], anim: (t) => {
          const { f, x, r, y } = roll(t);
          let d = 0; for (let j = 0, n = 24, xa = X0 + 0.3; j < n; j++) { const a = xa + ((x - xa) * j) / n, b = xa + ((x - xa) * (j + 1)) / n; d += Math.hypot(b - a, slope(b) - slope(a)); }
          return { x, y, rz: -d / (0.3 + r * 0.7), s: r * (f > 0.93 ? Math.max(0.001, 1 - win(f, 0.93, 0.995)) : 1) };
        } },
        // The packed track it leaves behind, as wide as the ball was there.
        ...Array.from({ length: trackN }, (_, i) => {
          const x = X0 + 0.5 + ((X1 - X0) * i) / trackN, k = (x - X0 - 0.3) / (X1 + 0.2 - X0 - 0.3), r = 0.28 + 1.05 * Math.max(0, k) ** 0.85;
          return { geo: part(new THREE.PlaneGeometry(((X1 - X0) / trackN) * 1.15, 1).rotateX(-Math.PI / 2), '#dbe3ec'), pivot: [x, h(x, 0) + 0.02, 0], anim: (t) => { const b = roll(t); return { sz: b.x > x && b.f < 0.95 ? r * 1.2 : 0.001, rz: Math.atan((slope(x - 0.05) - slope(x + 0.05)) / 0.1) }; } };
        }),
        // Coins lying in its path, swallowed as it passes.
        ...coinsOnPath.map((x, i) => ({ geo: part(cyl(0.18, 0.18, 0.05, 18), K.gold, { r: [0.3, i, 0.2] }), pivot: [x, h(x, (i % 2 ? 0.25 : -0.25)) + 0.06, i % 2 ? 0.25 : -0.25], anim: (t) => { const b = roll(t); return { s: b.x < x - 0.1 ? 1 : 0.001, ry: t * 1.5 + i }; } })),
        // Powder kicked up behind it.
        ...[0, 1, 2, 3].map((i) => ({ geo: part(ball(0.18), '#ffffff'), pivot: [0, 0, 0], anim: (t) => { const b = roll(t), g = cyc(t, 0.6, i / 4); return b.f > 0.1 && b.f < 0.8 ? { x: b.x - b.r * 0.8 - g * 0.6, y: h(b.x - b.r, 0) + g * 0.7 - g * g * 0.5, z: (i - 1.5) * 0.35 * b.r, s: (1 - g) * (0.6 + b.r * 0.6) } : { s: 0 }; } })),
        // A small figure in a red scarf gives it the first push.
        ...walker(1 + trackN + coinsOnPath.length + 4, () => ({ x: X0 - 0.15, z: 0, ry: 0, still: true, push: true, s: 0.8 }), { shirt: '#3a4656', pants: '#2b2f36', hair: '#d9d9d9', carry: part(new THREE.CapsuleGeometry(0.05, 0.4, 4, 8), '#c0392b', { p: [0, 1.38, 0], r: [Math.PI / 2, 0, 0] }), y: slope(X0 - 0.15) - 0.25 }),
        { geo: part(extrude([[0, 0], [0.7, 0.18], [0, 0.4]], 0.02), '#1f3a5f'), pivot: [hx + 0.77, hy + 2.75, hz], anim: (t) => ({ ry: Math.sin(t * 2.2) * 0.4 }) },
      ],
    };
  } },

  // SpaceX: reusable rockets. A Falcon 9 first stage comes home on its landing burn, unfolds its
  // legs and touches down on the droneship at sea in a burst of smoke, then lights up and flies
  // again; the support boat circles and gulls wheel overhead.
  spacex: { finder: '#9aa4b1', build: () => {
    const R = rand(31), out = [], SEA = 1.6, deckY = SEA + 0.75;
    // ---- the sea, as a block: live water on top, deepening blue strata down the sides
    out.push(part(rbox(10.4, 0.2, 10.4, 0.06), '#0d3b5c', { p: [0, 0.1, 0] }));
    [[0, 5.2, 0], [5.2, 0, Math.PI / 2]].forEach(([x, z, ry]) => {
      const wall = new THREE.PlaneGeometry(10.4, SEA, hi() ? 24 : 4, hi() ? 16 : 3).translate(0, SEA / 2, 0);
      out.push(part(wall, (X, Y) => shade('#1f6f9e', 0.55 + (Y / SEA) * 0.55 + 0.05 * Math.sin(X * 2 + Y * 5)), { p: [x, 0, z], r: [0, ry, 0] }));
    });
    out.push(part(new THREE.PlaneGeometry(10.4, 10.4, 1, 1).rotateX(-Math.PI / 2), 'W', { p: [0, SEA, 0] }));
    // ---- the droneship
    const L = 7, Wd = 4.4;
    out.push(part(rbox(L, 0.95, Wd, 0.12), '#3a3f47', { p: [0, SEA + 0.25, 0] }), part(box(L - 0.1, 0.06, Wd - 0.1), '#5b616b', { p: [0, deckY - 0.02, 0] }));
    for (let x = -L / 2 + 0.7; x < L / 2; x += 0.7) out.push(part(box(0.02, 0.012, Wd - 0.5), '#4b5059', { p: [x, deckY + 0.012, 0] }));
    for (let z = -Wd / 2 + 0.55; z < Wd / 2; z += 0.55) out.push(part(box(L - 0.5, 0.012, 0.02), '#4b5059', { p: [0, deckY + 0.012, z] }));
    out.push(part(cyl(1.75, 1.75, 0.012, 48), '#e9e6df', { p: [0, deckY + 0.018, 0] }), part(cyl(1.55, 1.55, 0.014, 48), '#5b616b', { p: [0, deckY + 0.02, 0] }),
      part(torus(1.65, 0.07, TAU, 64), '#f2c94c', { p: [0, deckY + 0.03, 0], r: [Math.PI / 2, 0, 0], s: [1, 1, 0.2] }),
      part(box(2.4, 0.016, 0.32), '#f2c94c', { p: [0, deckY + 0.028, 0], r: [0, 0.785, 0] }), part(box(2.4, 0.016, 0.32), '#f2c94c', { p: [0, deckY + 0.028, 0], r: [0, -0.785, 0] }));
    [-1, 1].forEach((s) => { out.push(part(box(L, 0.75, 0.16), '#2f343c', { p: [0, deckY + 0.35, s * (Wd / 2 - 0.08)] })); for (let x = -L / 2 + 0.3; x < L / 2; x += 0.45) out.push(part(box(0.05, 0.75, 0.04), '#262a31', { p: [x, deckY + 0.35, s * (Wd / 2 + 0.01)] })); });
    // Deck gear: containers, an antenna mast, and thruster pods under the corners.
    [[-2.9, -1.45], [-2.9, 1.45], [2.9, -1.45]].forEach(([x, z]) => { out.push(part(rbox(0.9, 0.5, 0.55, 0.04), '#c9a227', { p: [x, deckY + 0.25, z] })); for (let k = 0; k < 7; k++) out.push(part(box(0.02, 0.44, 0.57), '#b08d1e', { p: [x - 0.36 + k * 0.12, deckY + 0.25, z] })); });
    out.push(part(cyl(0.05, 0.07, 1.6, 10), '#c9ced6', { p: [3.0, deckY + 0.8, 1.5] }), part(new THREE.SphereGeometry(0.26, 18, 8, 0, TAU, 0, Math.PI / 2), '#e9e6df', { p: [3.0, deckY + 1.55, 1.5], r: [-1.2, 0, 0] }));
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => out.push(part(cyl(0.35, 0.4, 0.5, 20), '#262a31', { p: [sx * (L / 2 - 0.5), SEA - 0.12, sz * (Wd / 2 - 0.5)] })));
    // ---- the Falcon 9 first stage, sooty from re-entry
    const angle = (x, z) => Math.atan2(z, x);
    const body = part(lathe([[0, 0.25], [0.62, 0.25], [0.62, 6.1], [0.62, 7.1], [0.55, 7.2], [0, 7.2]], hi() ? 48 : 16), (x, y, z) => {
      if (y > 6.1) return '#1d1f24';
      const soot = Math.max(0, 1 - y / 4.4) * (0.65 + 0.35 * Math.sin(angle(x, z) * 9 + y * 1.5) ** 2);
      return shade('#f4f5f6', 1 - soot * 0.75);
    });
    const octaweb = merge(part(cyl(0.62, 0.55, 0.3, 32), '#3a3f47', { p: [0, 0.12, 0] }), [[0, 0], ...ring(8, (a) => [Math.cos(a) * 0.38, Math.sin(a) * 0.38])].map(([x, z]) => part(lathe([[0.04, 0], [0.13, -0.08], [0.16, -0.3], [0.15, -0.31], [0.11, -0.08], [0.03, 0]], 18), '#2b2f36', { p: [x, 0, z] })));
    const finGeo = merge(part(box(0.62, 0.05, 0.05), '#3a3f47', { p: [0.31, 0.3, 0] }), part(box(0.62, 0.05, 0.05), '#3a3f47', { p: [0.31, -0.3, 0] }), part(box(0.05, 0.62, 0.05), '#3a3f47', { p: [0.62, 0, 0] }),
      [0.12, 0.24, 0.36, 0.48].map((x) => part(box(0.02, 0.6, 0.04), '#5b616b', { p: [x, 0, 0] })), [-0.18, -0.06, 0.06, 0.18].map((y) => part(box(0.6, 0.02, 0.04), '#5b616b', { p: [0.31, y, 0] })));
    const legGeo = merge(part(taper([[0, 0, 0], [0, -1.4, 0.05], [0, -2.6, 0.1]], 0.1, 0.07, 8), '#1d1f24'), part(cyl(0.18, 0.2, 0.06, 16), '#2b2f36', { p: [0, -2.62, 0.1] }), beam([0, -1.0, 0.04], [0, -0.1, -0.35], 0.05, '#3a3f47'));
    const flame = merge(part(lathe([[0, 0], [0.45, -0.25], [0.55, -0.9], [0.32, -2.2], [0, -3.2]], 24), '#ff8a2a'), part(lathe([[0, 0], [0.26, -0.2], [0.3, -0.8], [0.14, -1.9], [0, -2.4]], 20), '#ffd36b', { p: [0, -0.05, 0] }),
      [-0.7, -1.3, -1.9].map((y, i) => part(ball(0.12 - i * 0.025), '#fff6d8', { p: [0, y, 0], s: [1, 1.6, 1] })));
    // Timeline (10 s): descent, legs out, landing burn, touchdown, rest, relight and lift-off.
    const alt = (f) => (f < 0.42 ? 4.2 * (1 - easeOut(f / 0.42)) : f < 0.72 ? 0 : 4.2 * easeIn(win(f, 0.72, 1)));
    // It arrives from above the frame and leaves through it, so it fades in and out up there.
    const seen = (f) => Math.min(1, f / 0.05, (1 - f) / 0.05);
    const burning = (f) => (f > 0.2 && f < 0.43) || f > 0.72;
    const legsOut = (f) => (f < 0.28 ? 0 : f < 0.38 ? easeOut(win(f, 0.28, 0.38)) : f < 0.9 ? 1 : 1 - win(f, 0.9, 0.97));
    const boat = merge(part(extrude([[-1.1, 0], [0.8, 0], [1.25, 0.35], [0.9, 0.55], [-1.1, 0.55]], 0.62).rotateX(Math.PI / 2).rotateX(-Math.PI / 2), '#e9e6df'),
      part(box(2.05, 0.08, 0.64), '#2f6fb0', { p: [0.05, 0.1, 0] }), part(rbox(0.7, 0.45, 0.5, 0.06), K.white, { p: [0.3, 0.8, 0] }), part(box(0.72, 0.12, 0.52), '#22303e', { p: [0.3, 0.9, 0] }),
      beam([-0.5, 0.6, 0], [-0.9, 1.4, 0], 0.06, '#f2c94c'), part(cyl(0.03, 0.03, 0.6, 8), '#c9ced6', { p: [0.3, 1.3, 0] }));
    const gull = (side) => part(extrude([[0, 0], [0.5 * side, 0.06], [0.75 * side, -0.05], [0.3 * side, -0.14]], 0.03), K.white, { r: [Math.PI / 2, 0, 0] });
    const moving = [
      { geo: merge(body, octaweb), pivot: [0, deckY + 0.42, 0], anim: (t) => { const f = cyc(t, 10), a = alt(f); return { y: a, rz: Math.sin(t * 1.5) * 0.035 * Math.min(1, a / 2), rx: Math.cos(t * 1.2) * 0.025 * Math.min(1, a / 2), s: Math.max(0.001, seen(f)), sy: Math.max(0.001, seen(f)) * (1 - bump(f, 0.425, 0.012) * 0.02) }; } },
      ...ring(4, (a) => ({ geo: legGeo, pivot: [Math.cos(a + 0.785) * 0.6, 1.9, Math.sin(a + 0.785) * 0.6], parent: 0, anim: (t) => {
        const k = legsOut(cyc(t, 10)), ax = new V(-Math.sin(a + 0.785), 0, Math.cos(a + 0.785));
        return { q: new THREE.Quaternion().setFromAxisAngle(ax, -(Math.PI - 0.08) * (1 - k) - 0.62 * k) };
      } })),
      ...ring(4, (a) => ({ geo: finGeo, pivot: [Math.cos(a) * 0.6, 6.8, Math.sin(a) * 0.6], parent: 0, anim: (t) => ({ ry: -a, rx: Math.sin(t * 2 + a) * 0.15 * (alt(cyc(t, 10)) > 0.5 ? 1 : 0) }) })),
      { geo: flame, pivot: [0, -0.25, 0], parent: 0, anim: (t) => { const f = cyc(t, 10); return burning(f) ? { sy: 0.85 + Math.sin(t * 37) * 0.12 + (alt(f) > 1 ? 0.35 : 0), sx: 1 + Math.sin(t * 29) * 0.06, sz: 1 + Math.cos(t * 31) * 0.06 } : { s: 0 }; } },
      // Smoke billows across the deck at touchdown and lift-off.
      ...Array.from({ length: hi() ? 10 : 5 }, (_, i) => { const a = (i / (hi() ? 10 : 5)) * TAU + R() * 0.4; return { geo: part(ball(0.7), '#efece6'), pivot: [0, deckY + 0.4, 0], anim: (t) => {
        const f = cyc(t, 10), k = Math.max(win(f, 0.36, 0.5) * (1 - win(f, 0.55, 0.7)), win(f, 0.72, 0.8) * (1 - win(f, 0.84, 0.95)));
        return { x: Math.cos(a) * (0.7 + k * 2.9), z: Math.sin(a) * (0.5 + k * 1.8), y: k * 0.35, s: k * (0.6 + (i % 3) * 0.2) };
      } }; }),
      // The support boat circling, with its wake.
      { geo: null, pivot: [0, SEA, 0], anim: (t) => ({ ry: -t * 0.22 }) },
      { geo: boat, pivot: [0, 0.02, 4.5], parent: 4 + 4 + 1 + 1 + (hi() ? 10 : 5), anim: (t) => ({ ry: Math.PI, y: Math.sin(t * 1.6) * 0.05, rx: Math.sin(t * 1.1) * 0.04 }) },
      ...[0, 1, 2].map((i) => ({ geo: part(new THREE.CircleGeometry(0.3, 16).rotateX(-Math.PI / 2), '#f4f8fb'), pivot: [0, 0.03, 4.5], parent: 4 + 4 + 1 + 1 + (hi() ? 10 : 5), anim: (t) => { const g = cyc(t, 1.5, i / 3); return { x: -1.1 - g * 1.4, s: 0.6 + g * 1.4, sz: 0.5 + g * 0.6, sx: 1.5 + g * 2 }; } })),
    ];
    // Gulls wheeling overhead, wings flapping.
    const gullBase = moving.length;
    [0, 1, 2].forEach((i) => {
      const me = moving.length;
      moving.push({ geo: part(new THREE.CapsuleGeometry(0.07, 0.3, 4, 8), K.white, { r: [0, 0, Math.PI / 2] }), pivot: [0, 0, 0], anim: (t) => { const a = t * 0.5 + i * 2.1; return { x: Math.cos(a) * (3 + i * 0.6), y: 8.5 + i * 0.6 + Math.sin(t + i) * 0.3, z: Math.sin(a) * (2.6 + i * 0.5), ry: -a - Math.PI / 2 }; } });
      [1, -1].forEach((side) => moving.push({ geo: gull(side), pivot: [0, 0, 0], parent: me, anim: (t) => ({ rx: side * Math.sin(t * 7 + i) * 0.6 }) }));
    });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },

  // Coca-Cola: a brand bottled and shipped everywhere. In the bottling hall, empty contour bottles
  // ride the line: filled at the turning carousel, crowned at the capper, wrapped at the labeller,
  // and crated; the red truck heads out with crates under the famous sign.
  cocacola: { finder: '#e61a27', build: () => {
    const RED = '#e61a27', out = [], y0 = 0.24, beltY = y0 + 1.05;
    const contour = [[0, 0], [1.05, 0], [1.15, 0.3], [1.2, 0.9], [1.0, 1.7], [0.95, 2.3], [1.2, 3.1], [1.25, 3.8], [1.05, 4.6], [0.6, 5.6], [0.42, 6.4], [0.45, 6.6], [0.4, 6.7], [0, 6.75]];
    const bottleOf = (s, color) => part(lathe(contour.map(([r, y]) => [r * s, y * s]), hi() ? 32 : 10), color);
    const bs = 0.17, bh = 6.75 * bs;
    // ---- the hall: tiled floor with safety lines, back wall with the sign
    out.push(part(rbox(10.4, 0.24, 10.4, 0.08), '#d6d9dd', { p: [0, 0.12, 0] }));
    for (let i = -4; i <= 4; i++) out.push(part(box(0.02, 0.01, 10), '#c3c7cc', { p: [i * 1.15, y0 + 0.005, 0] }), part(box(10, 0.01, 0.02), '#c3c7cc', { p: [0, y0 + 0.005, i * 1.15] }));
    out.push(part(box(9.4, 0.012, 0.1), K.yellow, { p: [0, y0 + 0.01, 1.5] }), part(box(9.4, 0.012, 0.1), K.yellow, { p: [0, y0 + 0.01, -1.5] }));
    out.push(part(box(10.4, 4.2, 0.3), '#f1ece4', { p: [0, y0 + 2.1, -5.05] }), part(box(10.4, 0.5, 0.32), '#c9c1b4', { p: [0, y0 + 0.25, -5.05] }));
    for (let x = -4.6; x < 5; x += 1.15) out.push(part(box(0.06, 4.2, 0.05), '#e2dbd0', { p: [x, y0 + 2.1, -4.88] }));
    // The red disc sign with its white ribbon.
    out.push(part(cyl(1.35, 1.35, 0.16, 48), RED, { p: [-1.2, y0 + 2.6, -4.82], r: [Math.PI / 2, 0, 0] }), part(torus(1.35, 0.06, TAU, 48), '#f4f5f6', { p: [-1.2, y0 + 2.6, -4.73] }),
      part(tube([[-2.3, y0 + 2.45, -4.72], [-1.6, y0 + 2.85, -4.7], [-0.9, y0 + 2.4, -4.7], [-0.1, y0 + 2.75, -4.72]], 0.07), '#f4f5f6'));
    // A giant contour bottle on a plinth.
    out.push(part(cyl(1.0, 1.1, 0.5, 32), '#3a3f47', { p: [3.6, y0 + 0.25, -3.6] }), place(bottleOf(0.62, '#4a2a1a'), { p: [3.6, y0 + 0.5, -3.6] }),
      part(cyl(0.79, 0.79, 0.8, 32), RED, { p: [3.6, y0 + 0.5 + 2.6 * 0.62 + 0.4, -3.6] }), part(tube(Array.from({ length: 9 }, (_, i) => { const a = -0.6 + i * 0.15; return [3.6 + Math.cos(a) * 0.81, y0 + 0.5 + 2.6 * 0.62 + 0.4 + Math.sin(i * 0.9) * 0.18, -3.6 + Math.sin(a) * 0.81]; }), 0.05), '#f4f5f6'),
      part(lathe([[0, 0], [0.3, 0], [0.3, 0.2], [0, 0.22]].map(([r, y]) => [r, y]), 24), '#d8d8d8', { p: [3.6, y0 + 0.5 + 6.65 * 0.62, -3.6] }));
    // ---- the line: a roller conveyor on legs
    const X0 = -4.4, X1 = 3.4;
    out.push(part(rbox(X1 - X0 + 0.4, 0.18, 0.9, 0.05), '#5b616b', { p: [(X0 + X1) / 2, beltY - 0.12, 0] }), [-0.48, 0.48].map((z) => part(box(X1 - X0 + 0.4, 0.12, 0.06), '#aab3bc', { p: [(X0 + X1) / 2, beltY + 0.08, z] })));
    for (let x = X0; x <= X1; x += 0.22) out.push(part(cyl(0.05, 0.05, 0.86, 10), '#c9ced6', { p: [x, beltY, 0], r: [Math.PI / 2, 0, 0] }));
    for (let x = X0 + 0.2; x <= X1; x += 1.3) [-0.38, 0.38].forEach((z) => out.push(part(cyl(0.05, 0.05, beltY - y0 - 0.1, 8), '#3a3f47', { p: [x, (beltY + y0) / 2 - 0.05, z] })));
    // Stations: filler carousel, capper, labeller.
    const XF = -2.3, XC = -0.3, XL = 1.5;
    out.push(part(cyl(0.2, 0.25, 2.2, 16), '#aab3bc', { p: [XF, beltY + 1.6, -1.0] }), beam([XF, beltY + 2.6, -1.0], [XF, beltY + 2.6, 0], 0.14, '#aab3bc'), part(cyl(0.65, 0.7, 0.45, 32), '#c9ced6', { p: [XF, beltY + 2.5, 0] }), part(cyl(0.5, 0.5, 0.3, 24), '#4a2a1a', { p: [XF, beltY + 2.85, 0] }));
    [-0.6, 0.6].forEach((z) => out.push(part(box(0.12, 2.3, 0.12), '#3a3f47', { p: [XC, beltY + 1.15, z] }))); out.push(part(rbox(0.6, 0.35, 1.4, 0.05), RED, { p: [XC, beltY + 2.3, 0] }));
    out.push(part(rbox(0.7, 1.2, 0.5, 0.06), '#aab3bc', { p: [XL, beltY + 0.6, -0.8] }));
    // ---- crates, and the truck
    const crate = merge(part(rbox(1.1, 0.5, 0.8, 0.05), RED), [-0.2, 0.2].map((z) => part(box(1.0, 0.04, 0.03), '#b8151f', { p: [0, 0.26, z] })), [-0.27, 0, 0.27].map((x) => part(box(0.03, 0.04, 0.72), '#b8151f', { p: [x, 0.26, 0] })),
      Array.from({ length: 6 }, (_, i) => place(bottleOf(0.11, '#4a2a1a'), { p: [-0.36 + (i % 3) * 0.36, 0.2, -0.17 + Math.floor(i / 3) * 0.34] })));
    [[4.3, 0, 0], [4.3, 0, 0.9], [4.3, 0.5, 0.45], [4.3, 0, -0.9]].forEach(([x, y, z]) => out.push(place(crate, { p: [x, y0 + 0.25 + y, z + 0.4] })));
    const truck = merge(part(rbox(3.2, 1.6, 1.3, 0.12), RED, { p: [-0.7, 1.25, 0] }), part(tube([[-2.2, 1.0, 0.66], [-1.4, 1.5, 0.66], [-0.4, 0.95, 0.66], [0.8, 1.45, 0.66]], 0.07), '#f4f5f6'),
      part(rbox(1.1, 1.2, 1.25, 0.2), RED, { p: [1.5, 0.95, 0] }), part(box(0.05, 0.5, 1.0), '#22303e', { p: [2.06, 1.25, 0] }), part(box(4.4, 0.18, 1.2), '#3a3f47', { p: [-0.1, 0.36, 0] }),
      [[-1.6, 0.6], [-1.0, 0.6], [1.5, 0.6], [-1.6, -0.6], [-1.0, -0.6], [1.5, -0.6]].flatMap(([x, z]) => [part(cyl(0.27, 0.27, 0.2, 18), '#1d1f24', { p: [x, 0.27, z], r: [Math.PI / 2, 0, 0] }), part(cyl(0.14, 0.14, 0.21, 14), '#c9ced6', { p: [x, 0.27, z], r: [Math.PI / 2, 0, 0] })]));
    // ---- the bottles riding the line: each is a joint with its stages as children
    const N = 9, period = 9, xAt = (t, i) => X0 + (cyc(t, period, i / N)) * (X1 - X0 + 0.6);
    const moving = [
      { geo: merge(ring(6, (a) => part(cyl(0.05, 0.03, 0.5, 8), '#aab3bc', { p: [Math.cos(a) * 0.5, -0.25, Math.sin(a) * 0.5] }))), pivot: [XF, beltY + 2.25, 0], anim: (t) => ({ ry: t * 1.2 }) },
      { geo: merge(part(cyl(0.12, 0.12, 0.8, 12), '#c9ced6', { p: [0, 0.4, 0] }), part(cyl(0.22, 0.22, 0.12, 16), '#3a3f47')), pivot: [XC, beltY + bh + 0.05, 0], anim: (t) => ({ y: 0.45 - bump(cyc(t, period / N), 0.5, 0.08) * 0.45 }) },
      { geo: merge(part(cyl(0.3, 0.3, 0.45, 24), RED, { r: [0, 0, 0] }), part(cyl(0.31, 0.31, 0.1, 24), '#f4f5f6', { p: [0, 0.05, 0] })), pivot: [XL, beltY + 0.7, -0.45], anim: (t) => ({ ry: t * 3 }) },
      { geo: truck, pivot: [0, y0, 3.6], anim: (t) => { const f = cyc(t, 12), x = f < 0.5 ? -7 + 9.4 * easeOut(win(f, 0, 0.3)) : 2.4 + 6 * easeIn(win(f, 0.6, 0.9)); return { x, s: Math.min(1, Math.max(0.001, (5.2 - Math.abs(x)) / 0.6)) }; } },
    ];
    for (let i = 0; i < N; i++) {
      const me = moving.length, x = (t) => xAt(t, i);
      moving.push({ geo: null, pivot: [0, beltY + 0.05, 0], anim: (t) => { const X = x(t); return { x: X, s: X > X1 + 0.3 ? 0.001 : 1 }; } });
      moving.push({ geo: bottleOf(bs, '#cfe6dd'), pivot: [0, 0, 0], parent: me, anim: (t) => ({ s: x(t) < XF ? 1 : 0.001 }) });
      moving.push({ geo: bottleOf(bs * 1.002, '#4a2a1a'), pivot: [0, 0, 0], parent: me, anim: (t) => ({ s: x(t) >= XF ? 1 : 0.001, sy: x(t) >= XF ? Math.min(1, (x(t) - XF) / 0.25 + 0.05) : 0.001 }) });
      moving.push({ geo: part(cyl(0.085, 0.085, 0.06, 16), RED), pivot: [0, bh + 0.02, 0], parent: me, anim: (t) => ({ s: x(t) >= XC ? 1 : 0.001 }) });
      moving.push({ geo: merge(part(cyl(1.27 * bs, 1.27 * bs, 0.7 * bs * 1.4, 24), RED), part(torus(1.27 * bs, 0.012, TAU, 24), '#f4f5f6', { r: [Math.PI / 2, 0, 0] })), pivot: [0, 3.45 * bs, 0], parent: me, anim: (t) => ({ s: x(t) >= XL ? 1 : 0.001 }) });
    }
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },

  // Walmart: everyday low prices at enormous scale. A Supercenter on its car park: shoppers push
  // carts in, an associate wheels a train of carts back, a Walmart truck rolls up to the dock
  // (the distribution network is the moat), the spark turns over the door and a Rollback tag drops.
  walmart: { finder: '#ffc220', build: () => {
    const R = rand(9), BLUE = '#0071ce', YELLOW = '#ffc220', y0 = 0.24, out = [];
    // A route through points at a steady pace over [a, b] of a `period`-second cycle (people face +x).
    const route = (pts, period, a = 0, b = 1, off = 0) => {
      const P = pts.map(([x, z]) => new V(x, 0, z)), seg = P.slice(1).map((p, i) => p.distanceTo(P[i])), total = seg.reduce((x, y) => x + y, 0);
      return (t) => {
        const f = cyc(t, period, off), k = win(f, a, b);
        let d = k * total, i = 0;
        while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
        const p = P[i].clone().lerp(P[i + 1], Math.min(1, d / seg[i])), dir = P[i + 1].clone().sub(P[i]);
        return { x: p.x, z: p.z, ry: Math.atan2(-dir.z, dir.x), s: f < a || f > b ? 0 : Math.min(1, (f - a) / 0.03, (b - f) / 0.03), still: false, push: true };
      };
    };
    // ---- the lot
    out.push(part(rbox(10.4, 0.24, 10.4, 0.08), '#5b616b', { p: [0, 0.12, 0] }));
    for (let i = 0; i <= 7; i++) [1.15, 3.55].forEach((z) => out.push(part(box(0.06, 0.012, 1.25), '#eceae4', { p: [-4.35 + i * 1.18, y0 + 0.006, z] })));
    out.push(part(box(8.4, 0.012, 0.06), '#eceae4', { p: [-0.2, y0 + 0.006, 2.35] }), part(box(0.08, 0.012, 9.6), YELLOW, { p: [4.05, y0 + 0.006, 0] }));
    out.push(part(rbox(0.7, 0.18, 9.6, 0.06), '#c9c4b8', { p: [-4.95, y0 + 0.09, 0.2] }), part(box(0.5, 0.1, 9.4), '#6aa84f', { p: [-4.95, y0 + 0.16, 0.2] }));
    [-3.4, -0.6, 2.4].forEach((z) => out.push(miniTree(R, -4.95, y0 + 0.2, z, 0.95)));
    if (hi()) out.push(tuft(R, -4.95, 1.2, 0.25, hi() ? 14 : 5, ['#6cc23a', '#7fcf3f', '#94d84f'], 0.45).map((g) => g.translate(0, y0 + 0.2, 0)));
    out.push(lampPost(-0.2, y0, 2.35, 0), lampPost(3.6, y0, 2.35, Math.PI));
    // Parked cars, in two rows with a few gaps.
    const paint = ['#b8202a', '#f4f5f6', '#2b2f36', '#9aa4b1', '#3d7be0', '#e9e6df', '#5b6470', '#7a2e3a'];
    [[1.15, Math.PI / 2], [3.55, -Math.PI / 2]].forEach(([z, ry], row) => {
      for (let i = 0; i < 7; i++) { if ((i + row * 3) % 4 === 2) continue; out.push(place(sedan(paint[(i * 3 + row * 5) % paint.length]), { p: [-3.76 + i * 1.18, y0, z], r: [0, ry, 0], s: 0.82 })); }
    });
    // A cart corral in a bay.
    const corral = [-0.06, 3.55];
    out.push(beam([corral[0] - 0.4, y0 + 0.6, corral[1] - 0.55], [corral[0] - 0.4, y0 + 0.6, corral[1] + 0.55], 0.05, BLUE), beam([corral[0] + 0.4, y0 + 0.6, corral[1] - 0.55], [corral[0] + 0.4, y0 + 0.6, corral[1] + 0.55], 0.05, BLUE));
    [-0.4, 0.4].forEach((dx) => [-0.55, 0.55].forEach((dz) => out.push(beam([corral[0] + dx, y0, corral[1] + dz], [corral[0] + dx, y0 + 0.6, corral[1] + dz], 0.05, BLUE))));
    [0, 0.32].forEach((dz) => out.push(place(cartGeo(), { p: [corral[0], y0, corral[1] - 0.2 + dz], r: [0, Math.PI / 2, 0], s: 0.6 })));
    // ---- the Supercenter
    const S = { x0: -4.6, x1: 3.4, z0: -4.7, z1: -1.2, h: 3 }, cx = (S.x0 + S.x1) / 2, cz = (S.z0 + S.z1) / 2;
    out.push(part(box(S.x1 - S.x0, S.h, S.z1 - S.z0), '#e6dccb', { p: [cx, y0 + S.h / 2, cz] }));
    for (let y = 0.3; y < S.h - 0.8; y += 0.26) out.push(part(box(S.x1 - S.x0 + 0.02, 0.025, 0.03), '#d3c6b0', { p: [cx, y0 + y, S.z1 + 0.01] }), part(box(0.03, 0.025, S.z1 - S.z0 + 0.02), '#d3c6b0', { p: [S.x1 + 0.01, y0 + y, cz] }));
    out.push(part(box(S.x1 - S.x0 + 0.1, 0.85, S.z1 - S.z0 + 0.1), BLUE, { p: [cx, y0 + S.h - 0.3, cz] }), part(box(S.x1 - S.x0 + 0.16, 0.08, S.z1 - S.z0 + 0.16), '#0b5ea8', { p: [cx, y0 + S.h + 0.13, cz] }));
    // The wordmark, suggested by white letter blocks on the band.
    [0.32, 0.22, 0.12, 0.22, 0.3, 0.22, 0.22].forEach((w, i, a) => { const x = -3.4 + a.slice(0, i).reduce((s, v) => s + v + 0.08, 0); out.push(part(rbox(w, 0.42, 0.05, 0.05), K.white, { p: [x + w / 2, y0 + S.h - 0.3, S.z1 + 0.08] })); });
    out.push(part(box(S.x1 - S.x0 - 0.3, 0.05, S.z1 - S.z0 - 0.3), '#c3c7cc', { p: [cx, y0 + S.h + 0.04, cz] }));
    [[-3.2, -3.4], [-0.4, -3.9], [1.9, -3.2]].forEach(([x, z]) => out.push(part(rbox(0.9, 0.45, 0.7, 0.08), '#a7adb4', { p: [x, y0 + S.h + 0.27, z] }), part(cyl(0.24, 0.24, 0.06, 20), '#3a3f47', { p: [x, y0 + S.h + 0.52, z] })));
    // Two entrance vestibules with glass doors and canopies.
    [-2.9, 1.7].forEach((x) => {
      out.push(part(box(1.5, 2.1, 0.8), '#efe8dc', { p: [x, y0 + 1.05, S.z1 + 0.4] }), part(box(1.56, 0.32, 0.86), BLUE, { p: [x, y0 + 2.2, S.z1 + 0.4] }),
        part(box(1.0, 1.5, 0.04), '#22303e', { p: [x, y0 + 0.75, S.z1 + 0.82] }), part(box(0.03, 1.5, 0.06), '#9aa4b1', { p: [x, y0 + 0.75, S.z1 + 0.83] }),
        part(rbox(1.9, 0.08, 0.9, 0.03), '#3a4656', { p: [x, y0 + 1.75, S.z1 + 1.2] }), [-0.85, 0.85].map((dx) => part(cyl(0.04, 0.04, 1.7, 10), '#9aa4b1', { p: [x + dx, y0 + 0.85, S.z1 + 1.55] })));
    });
    // Side dock for the trucks.
    [-3.9, -2.6].forEach((z) => { out.push(part(box(0.06, 1.8, 1.0), '#3a3f47', { p: [S.x1 + 0.04, y0 + 0.9, z] })); for (let k = 0; k < 8; k++) out.push(part(box(0.05, 0.19, 0.88), k % 2 ? '#c6cbd1' : '#b3b9c0', { p: [S.x1 + 0.08, y0 + 0.12 + k * 0.21, z] })); });
    // ---- the Walmart truck
    const semi = merge(part(rbox(3.5, 1.7, 1.15, 0.08), '#f4f5f6', { p: [-0.9, 1.25, 0] }), part(box(3.3, 0.38, 0.02), BLUE, { p: [-0.9, 0.82, 0.58] }), part(box(3.3, 0.38, 0.02), BLUE, { p: [-0.9, 0.82, -0.58] }),
      ring(6, (a) => part(new THREE.CapsuleGeometry(0.06, 0.16, 4, 10), YELLOW, { p: [0.3 + Math.cos(a) * 0.2, 1.5 + Math.sin(a) * 0.2, 0.59], r: [0, 0, a - Math.PI / 2] })),
      part(rbox(1.2, 1.35, 1.1, 0.2), BLUE, { p: [1.55, 0.95, 0] }), part(box(0.05, 0.5, 0.9), '#22303e', { p: [2.15, 1.25, 0] }), part(rbox(0.5, 0.5, 1.12, 0.12), BLUE, { p: [2.0, 0.5, 0] }), part(cyl(0.06, 0.06, 1, 10), '#c9ced6', { p: [1.0, 1.9, 0.45] }),
      [[-2.2, 0.48], [-1.75, 0.48], [-2.2, -0.48], [-1.75, -0.48], [1.7, 0.48], [1.7, -0.48], [0.9, 0.48], [0.9, -0.48]].flatMap(([x, z]) => [part(cyl(0.26, 0.26, 0.18, 18), '#1d1f24', { p: [x, 0.26, z], r: [Math.PI / 2, 0, 0] }), part(cyl(0.14, 0.14, 0.19, 14), '#c9ced6', { p: [x, 0.26, z], r: [Math.PI / 2, 0, 0] })]));
    const spark = merge(ring(6, (a) => part(new THREE.CapsuleGeometry(0.3, 0.8, 8, 20), YELLOW, { p: [Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0], r: [0, 0, a - Math.PI / 2] })));
    const shopper = route([[-1.6, 2.35], [-2.9, 2.35], [-2.9, -0.3]], 8, 0.05, 0.75);
    const associate = route([[0.5, 2.35], [1.7, 2.35], [1.7, -0.3]], 8, 0.3, 0.95);
    const tag = merge(part(extrude([[-1.1, 0.7], [0.8, 0.7], [1.3, 0], [0.8, -0.7], [-1.1, -0.7]], 0.2), YELLOW), part(cyl(0.12, 0.12, 0.26, 12), '#2c3e55', { p: [0.85, 0, 0], r: [Math.PI / 2, 0, 0] }),
      part(extrude([[-0.15, 0.4], [0.15, 0.4], [0.15, -0.05], [0.4, -0.05], [0, -0.5], [-0.4, -0.05], [-0.15, -0.05]], 0.24), '#e5533d', { p: [-0.25, 0, 0.02] })).translate(0, -0.9, 0);
    return {
      bare: true, move: () => ({}),
      geo: merge(out),
      moving: [
        { geo: spark, pivot: [-0.6, y0 + S.h + 1.0, S.z1 + 0.1], anim: (t) => ({ rz: t * 0.5, s: 0.72 + Math.max(0, Math.sin(t * 2.4)) * 0.05 }) },
        { geo: tag, pivot: [2.6, y0 + S.h - 0.2, S.z1 + 0.25], anim: (t) => { const f = cyc(t, 4.5), drop = f < 0.2 ? 1 - back(win(f, 0, 0.2)) : 0; return { y: drop * 2.4, rz: Math.sin(t * 2.4) * 0.1 + bump(f, 0.22, 0.05) * 0.25, s: f > 0.94 ? 1 - win(f, 0.94, 1) : 0.8 }; } },
        { geo: semi, pivot: [4.6, y0, 0], anim: (t) => { const f = cyc(t, 11), z = f < 0.35 ? 5.6 - 5.3 * easeOut(win(f, 0.03, 0.35)) : 0.3; return { z, ry: Math.PI / 2, s: f < 0.03 ? f / 0.03 : f > 0.92 ? Math.max(0.001, (1 - f) / 0.08) : 1, y: Math.abs(Math.sin(t * 10)) * 0.01 }; } },
        ...walker(3, shopper, { shirt: '#e5533d', pants: '#2b3a55', carry: place(cartGeo(), { p: [0.95, 0, 0] }) }),
        ...walker(8, associate, { shirt: BLUE, pants: '#5b4636', hair: '#1d1f24', skin: '#c58c66', carry: merge(place(cartGeo(), { p: [0.95, 0, 0] }), place(cartGeo(), { p: [1.3, 0.04, 0] }), place(cartGeo(), { p: [1.65, 0.08, 0] })) }),
      ],
    };
  } },

  // Apple: the ecosystem, a closed loop people stay inside. Apple Park's ring, glass walls under a
  // solar roof around an orchard courtyard, with the iPhone floating at the centre and the Mac,
  // iPad, Watch and AirPods orbiting it.
  apple: { finder: '#a3aaae', build: () => {
    const R = rand(17), y0 = 0.3, out = [];
    // ---- the campus
    out.push(part(cyl(5.1, 5.25, 0.3, 64), '#7cbf5a', { p: [0, 0.15, 0] }), part(lathe([[4.62, y0 + 0.005], [4.95, y0 + 0.005], [4.95, y0 + 0.02], [4.62, y0 + 0.02]], hi() ? 96 : 32), '#e8e4da'));
    // Glass walls inside and out, with the floor slabs showing as white bands, and mullions.
    const segs = hi() ? 128 : 40;
    out.push(part(lathe([[4.3, y0], [4.3, y0 + 1.06]], segs), '#9fc3d8'), part(lathe([[3.25, y0 + 1.06], [3.25, y0]], segs), '#9fc3d8'));
    [0.02, 0.36, 0.7, 1.04].forEach((h) => out.push(part(lathe([[3.19, y0 + h], [4.36, y0 + h], [4.36, y0 + h + 0.05], [3.19, y0 + h + 0.05], [3.19, y0 + h]], segs), '#f4f5f6')));
    for (let i = 0, n = hi() ? 120 : 0; i < n; i++) { const a = (i / n) * TAU; out.push(part(box(0.02, 1.0, 0.02), '#dfe6ea', { p: [Math.cos(a) * 4.31, y0 + 0.53, Math.sin(a) * 4.31] })); }
    out.push(part(lathe([[3.05, y0 + 1.06], [4.5, y0 + 1.06], [4.5, y0 + 1.14], [3.05, y0 + 1.14], [3.05, y0 + 1.06]], hi() ? 128 : 40), (x, y) => (y > y0 + 1.13 ? '#2d3a4a' : '#f4f5f6')));
    for (let i = 0, n = hi() ? 72 : 24; i < n; i++) { const a = (i / n) * TAU; out.push(part(box(0.025, 0.02, 1.3), '#5b6b7c', { p: [Math.cos(a) * 3.78, y0 + 1.155, Math.sin(a) * 3.78], r: [0, -a, 0] })); }
    // The courtyard: a pond and an orchard.
    out.push(part(cyl(1.0, 1.0, 0.06, 40), 'W', { p: [0.7, y0 + 0.03, -0.5] }), part(torus(1.0, 0.06, TAU, 40), '#d9d4c7', { p: [0.7, y0 + 0.04, -0.5], r: [Math.PI / 2, 0, 0] }));
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + R() * 0.4, d = 1.9 + R() * 0.9; out.push(miniTree(R, Math.cos(a) * d, y0, Math.sin(a) * d, 0.62, ['#6fbf4c', '#86cc5f', '#9bd85f', '#f2a6c1'])); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + 0.3; out.push(miniTree(R, Math.cos(a) * 4.85, y0, Math.sin(a) * 4.85, 0.5)); }
    // ---- the devices
    const icons = ['#34c759', '#ff9500', '#ff2d55', '#5ac8fa', '#ffcc00', '#af52de', '#f4f5f6', '#007aff', '#ff3b30', '#30b0c7', '#a2845e', '#64d2ff'];
    const phone = merge(part(rbox(1.72, 3.5, 0.22, 0.3), '#8e9196'), part(rbox(1.6, 3.38, 0.04, 0.27), (x, y) => (y > 0.6 ? '#4b6cf2' : y > -0.6 ? '#7457e0' : '#b45fd1'), { p: [0, 0, 0.11] }),
      part(new THREE.CapsuleGeometry(0.06, 0.3, 4, 10), '#0b0b0d', { p: [0, 1.48, 0.135], r: [0, 0, Math.PI / 2] }),
      Array.from({ length: 16 }, (_, i) => part(rbox(0.28, 0.28, 0.04, 0.08), icons[i % icons.length], { p: [-0.54 + (i % 4) * 0.36, 1.05 - Math.floor(i / 4) * 0.46, 0.14] })),
      part(rbox(1.42, 0.42, 0.03, 0.14), '#c9b9f2', { p: [0, -1.38, 0.135] }), Array.from({ length: 4 }, (_, i) => part(rbox(0.28, 0.28, 0.04, 0.08), icons[(i * 5 + 3) % icons.length], { p: [-0.54 + i * 0.36, -1.38, 0.16] })),
      part(rbox(0.78, 0.78, 0.08, 0.2), '#7d8187', { p: [-0.38, 1.22, -0.14] }), [[-0.56, 1.4], [-0.2, 1.4], [-0.38, 1.04]].flatMap(([x, y]) => [part(cyl(0.15, 0.15, 0.08, 20), '#55595f', { p: [x, y, -0.2], r: [Math.PI / 2, 0, 0] }), part(cyl(0.1, 0.1, 0.09, 20), '#0d1117', { p: [x, y, -0.21], r: [Math.PI / 2, 0, 0] })]),
      part(box(0.04, 0.4, 0.06), '#8e9196', { p: [0.88, 0.7, 0] }));
    const mac = merge(part(rbox(2.1, 0.08, 1.45, 0.06), '#c9ced6'), part(rbox(1.8, 0.01, 0.75, 0.04), '#2b2f36', { p: [0, 0.045, -0.15] }), part(rbox(0.75, 0.01, 0.45, 0.04), '#b9bec6', { p: [0, 0.045, 0.45] }),
      place(merge(part(rbox(2.1, 1.4, 0.05, 0.06), '#c9ced6', { p: [0, 0.7, 0] }), part(rbox(1.96, 1.26, 0.01, 0.05), (x, y) => (y > 0.75 ? '#2e5ea8' : '#c06b4c'), { p: [0, 0.71, 0.03] })), { p: [0, 0.04, -0.72], r: [-0.25, 0, 0] }));
    const pad = merge(part(rbox(1.6, 2.2, 0.09, 0.14), '#d7d9dc'), part(rbox(1.48, 2.08, 0.01, 0.12), (x, y) => (y > 0.2 ? '#ff9f6b' : '#e8577a'), { p: [0, 0, 0.05] }), Array.from({ length: 8 }, (_, i) => part(rbox(0.22, 0.22, 0.03, 0.06), icons[(i * 3) % icons.length], { p: [-0.48 + (i % 4) * 0.32, 0.7 - Math.floor(i / 4) * 0.36, 0.065] })));
    const watch = merge(part(rbox(0.58, 0.7, 0.2, 0.16), '#1d1f24'), part(rbox(0.5, 0.62, 0.02, 0.14), '#0b0b0d', { p: [0, 0, 0.1] }),
      [['#ff2d55', 0.2], ['#a3f75b', 0.15], ['#3ce3f5', 0.1]].map(([c, r], i) => part(torus(r, 0.022, TAU * (0.85 - i * 0.15), 24), c, { p: [0, 0, 0.115], r: [0, 0, Math.PI / 2] })),
      part(cyl(0.05, 0.05, 0.08, 12), '#e5533d', { p: [0.31, 0.12, 0], r: [0, 0, Math.PI / 2] }),
      [1, -1].map((sy) => part(tube([[0, sy * 0.32, -0.04], [0, sy * 0.62, -0.12], [0, sy * 0.82, -0.36], [0, sy * 0.86, -0.62]], 0.045), '#e5533d', { s: [5.2, 1, 1] })));
    const podsCase = merge(part(rbox(0.66, 0.42, 0.34, 0.14), '#f8f8f8'), part(cyl(0.025, 0.025, 0.02, 10), '#5fd08f', { p: [0, 0.02, 0.17], r: [Math.PI / 2, 0, 0] }),
      [-0.13, 0.13].flatMap((x) => [part(ball(0.1), '#ffffff', { p: [x, 0.25, 0] }), part(new THREE.CapsuleGeometry(0.035, 0.16, 4, 10), '#ffffff', { p: [x, 0.36, 0.02] })]));
    const podsLid = part(rbox(0.66, 0.16, 0.34, 0.12), '#f8f8f8', { p: [0, 0.08, 0.17] });
    // Each device rides the orbit, facing outwards, with its own little bob.
    const orbit = (k) => (t) => { const a = t * 0.38 + (k / 4) * TAU; return { x: Math.cos(a) * 3.3, z: Math.sin(a) * 3.3, y: Math.sin(t * 1.2 + k) * 0.25, ry: -a + Math.PI / 2, rx: -0.15 }; };
    return {
      bare: true, move: () => ({}),
      geo: merge(out),
      moving: [
        { geo: phone, pivot: [0, 5.6, 0], anim: (t) => ({ ry: Math.sin(t * 0.45) * 0.7, y: Math.sin(t * 1.1) * 0.18, rx: -0.12 }) },
        { geo: mac, pivot: [0, 4.4, 0], anim: orbit(0) },
        { geo: pad, pivot: [0, 5.2, 0], anim: orbit(1) },
        { geo: watch, pivot: [0, 5.0, 0], anim: (t) => ({ ...orbit(2)(t), s: 1.3 }) },
        { geo: podsCase, pivot: [0, 4.6, 0], anim: (t) => ({ ...orbit(3)(t), s: 1.5 }) },
        { geo: podsLid, pivot: [0, 0.21, -0.17], parent: 4, anim: (t) => ({ rx: -1.9 * easeIO(win(cyc(t, 4), 0.1, 0.25)) * (1 - easeIO(win(cyc(t, 4), 0.65, 0.8))) }) },
        // Apps lift off the phone's screen and settle back.
        ...[0, 1, 2].map((i) => ({ geo: part(rbox(0.32, 0.32, 0.05, 0.09), ['#34c759', '#ff9500', '#007aff'][i]), pivot: [-0.36 + i * 0.36, 1.05, 0.15], parent: 0, anim: (t) => { const k = hop(win(cyc(t, 3.4, i * 0.18), 0, 0.5)); return { z: k * 0.9, y: k * 0.4, rz: k * (i - 1) * 0.5, s: 1 + k * 0.6 }; } })),
      ],
    };
  } },

  // Alphabet: organising the world's information. On the campus, queries fly from the search bar
  // into the data centre's famous colour-coded pipes and racks and come back as results; the
  // Android statue waves, a Maps pin drops, YouTube plays, and people ride the campus bikes.
  alphabet: { finder: '#4285f4', build: () => {
    const R = rand(81), out = [], y0 = 0.3, G = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
    out.push(part(rbox(10.4, 0.3, 10.4, 0.08), '#7cbf5a', { p: [0, 0.15, 0] }));
    // A loop path the bikes ride, and paving under the sculptures.
    const loopPts = Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * TAU; return [0.6 + Math.cos(a) * 3.7, y0, 1.2 + Math.sin(a) * 2.6]; });
    const loop = new THREE.CatmullRomCurve3(loopPts.map((p) => new V(...p)), true);
    for (let i = 0; i < 64; i++) { const u = i / 64, p = loop.getPointAt(u), d = loop.getTangentAt(u); out.push(part(box(0.5, 0.02, 0.7), '#e9e4d8', { p: [p.x, y0 + 0.01, p.z], r: [0, Math.atan2(-d.z, d.x), 0] })); }
    [[-4.2, 4.3], [4.4, -0.8], [4.5, 4.4], [-1.0, 4.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.75)));
    // ---- the data centre with its colour-coded pipes, cut away
    const D = { x0: -4.9, x1: 0.2, z0: -4.9, z1: -1.6 };
    out.push(part(box(D.x1 - D.x0, 0.2, D.z1 - D.z0), '#9aa1a9', { p: [(D.x0 + D.x1) / 2, y0 + 0.1, (D.z0 + D.z1) / 2] }), part(box(D.x1 - D.x0, 3.0, 0.2), '#d6d9dd', { p: [(D.x0 + D.x1) / 2, y0 + 1.5, D.z0] }), part(box(0.2, 3.0, D.z1 - D.z0), '#d6d9dd', { p: [D.x0, y0 + 1.5, (D.z0 + D.z1) / 2] }), part(box(D.x1 - D.x0 + 0.2, 0.2, D.z1 - D.z0 + 0.2), '#bfc3c8', { p: [(D.x0 + D.x1) / 2, y0 + 3.1, (D.z0 + D.z1) / 2] }));
    G.forEach((c, k) => {
      const yy = y0 + 0.6 + k * 0.55, zz = D.z0 + 0.35 + k * 0.05;
      out.push(part(cyl(0.12, 0.12, D.x1 - D.x0 - 0.6, 16), c, { p: [(D.x0 + D.x1) / 2, yy, zz], r: [0, 0, Math.PI / 2] }));
      [D.x0 + 0.6 + k * 0.4, D.x1 - 0.5 - k * 0.3].forEach((x) => out.push(part(torus(0.25, 0.12, Math.PI / 2, 12), c, { p: [x, yy - 0.25, zz + 0.25], r: [0, Math.PI / 2, Math.PI] }), part(cyl(0.12, 0.12, yy - y0 - 0.45, 12), c, { p: [x, (yy + y0) / 2 - 0.05, zz + 0.5] })));
      for (let x = D.x0 + 0.5; x < D.x1 - 0.3; x += 0.9) out.push(part(box(0.06, 0.34, 0.34), '#7d8792', { p: [x, yy, zz] }));
    });
    for (let k = 0; k < 4; k++) { const x = D.x0 + 0.9 + k * 1.1; out.push(part(rbox(0.8, 1.9, 0.6, 0.04), '#2b2f36', { p: [x, y0 + 1.15, -2.3] })); for (let u = 0; u < 8; u++) out.push(part(box(0.7, 0.03, 0.01), '#3a3f47', { p: [x, y0 + 0.4 + u * 0.2, -1.995] })); }
    // ---- the search bar sculpture with its query box
    const S = [0.6, 1.2];
    out.push(part(rbox(4.6, 1.0, 0.7, 0.5), K.white, { p: [S[0], y0 + 1.2, S[1]] }), part(rbox(4.3, 0.75, 0.05, 0.38), '#f1f3f4', { p: [S[0], y0 + 1.2, S[1] + 0.36] }),
      part(torus(0.17, 0.05, TAU, 24), '#9aa0a6', { p: [S[0] - 1.75, y0 + 1.24, S[1] + 0.39] }), beam([S[0] - 1.63, y0 + 1.12, S[1] + 0.39], [S[0] - 1.5, y0 + 0.99, S[1] + 0.39], 0.06, '#9aa0a6'),
      part(box(1.8, 0.08, 0.03), '#5f6368', { p: [S[0] - 0.4, y0 + 1.2, S[1] + 0.39] }), part(cyl(0.16, 0.16, 0.06, 20), G[0], { p: [S[0] + 1.8, y0 + 1.2, S[1] + 0.39], r: [Math.PI / 2, 0, 0] }),
      part(rbox(0.5, 0.7, 0.4, 0.06), '#e9e6df', { p: [S[0] - 1.6, y0 + 0.35, S[1]] }), part(rbox(0.5, 0.7, 0.4, 0.06), '#e9e6df', { p: [S[0] + 1.6, y0 + 0.35, S[1]] }));
    // ---- the Android statue on its plinth
    const A = [3.6, -2.8];
    out.push(part(rbox(1.2, 0.5, 1.2, 0.08), '#e9e6df', { p: [A[0], y0 + 0.25, A[1]] }), part(new THREE.CapsuleGeometry(0.55, 0.5, 8, 24), '#3ddc84', { p: [A[0], y0 + 1.45, A[1]] }),
      part(new THREE.SphereGeometry(0.55, 32, 16, 0, TAU, 0, Math.PI / 2), '#3ddc84', { p: [A[0], y0 + 2.12, A[1]] }), [-0.2, 0.2].map((dx) => part(ball(0.06), K.white, { p: [A[0] + dx, y0 + 2.35, A[1] + 0.47] })),
      [-0.22, 0.22].map((dx) => beam([A[0] + dx * 0.9, y0 + 2.55, A[1]], [A[0] + dx * 1.8, y0 + 2.85, A[1]], 0.05, '#3ddc84')), [-0.2, 0.2].map((dx) => part(new THREE.CapsuleGeometry(0.13, 0.3, 6, 12), '#3ddc84', { p: [A[0] + dx, y0 + 0.75, A[1]] })),
      part(new THREE.CapsuleGeometry(0.12, 0.45, 6, 12), '#3ddc84', { p: [A[0] - 0.72, y0 + 1.5, A[1]] }));
    // ---- the map tile with its pin, and the play button
    const M = [3.9, 0.9];
    out.push(part(rbox(1.6, 0.12, 1.6, 0.04), '#e8f0e0', { p: [M[0], y0 + 0.06, M[1]] }), part(box(1.5, 0.02, 0.18), '#fbbc05', { p: [M[0], y0 + 0.13, M[1] + 0.2], r: [0, 0.3, 0] }), part(box(0.14, 0.02, 1.5), K.white, { p: [M[0] - 0.3, y0 + 0.13, M[1]] }), part(box(0.5, 0.025, 0.4), '#a8d5ff', { p: [M[0] + 0.45, y0 + 0.13, M[1] - 0.45] }));
    out.push(part(cyl(0.05, 0.05, 1.6, 8), '#9aa1a9', { p: [-3.8, y0 + 0.8, 0.6] }), part(rbox(1.3, 0.9, 0.14, 0.22), '#ff0000', { p: [-3.8, y0 + 1.9, 0.6], r: [0, Math.PI / 4, 0] }), part(extrude([[-0.2, 0.25], [0.28, 0], [-0.2, -0.25]], 0.06), K.white, { p: [-3.8 + 0.06, y0 + 1.9, 0.6 + 0.06], r: [0, Math.PI / 4, 0] }));
    // ---- moving parts
    const bike = (c) => merge(part(torus(0.3, 0.04, TAU, 20), '#1d1f24', { p: [-0.5, 0.33, 0] }), part(torus(0.3, 0.04, TAU, 20), '#1d1f24', { p: [0.5, 0.33, 0] }), beam([-0.5, 0.33, 0], [0, 0.4, 0], 0.06, c), beam([0, 0.4, 0], [0.4, 0.8, 0], 0.06, c), beam([-0.5, 0.33, 0], [-0.15, 0.8, 0], 0.06, c), beam([-0.15, 0.8, 0], [0.4, 0.8, 0], 0.06, c), beam([0.4, 0.8, 0], [0.5, 0.33, 0], 0.05, c),
      part(rbox(0.12, 0.2, 0.55, 0.04), '#1d1f24', { p: [0.42, 0.95, 0] }), part(rbox(0.3, 0.06, 0.18, 0.03), '#1d1f24', { p: [-0.18, 0.86, 0] }), part(rbox(0.35, 0.2, 0.3, 0.04), c, { p: [0.62, 0.72, 0] }),
      part(new THREE.CapsuleGeometry(0.15, 0.32, 6, 12), '#5b6470', { p: [-0.1, 1.22, 0], r: [0, 0, -0.3] }), part(ball(0.13), '#e9b98f', { p: [0.0, 1.55, 0] }), part(ball(0.14), '#3a2a20', { p: [-0.02, 1.6, 0], s: [1, 0.7, 1] }),
      beam([-0.05, 1.3, 0.12], [0.4, 1.0, 0.25], 0.07, '#5b6470'), beam([-0.05, 1.3, -0.12], [0.4, 1.0, -0.25], 0.07, '#5b6470'), beam([-0.15, 0.95, 0.1], [0, 0.55, 0.15], 0.08, '#2b3a55'), beam([-0.15, 0.95, -0.1], [0, 0.55, -0.15], 0.08, '#2b3a55'));
    const qFrom = [S[0] - 0.4, y0 + 1.8, S[1]], into = [-2.4, y0 + 3.4, -3.2];
    const moving = [
      ...G.map((c, i) => ({ geo: part(ball(0.36), c), pivot: [S[0] - 1.05 + i * 0.7, y0 + 2.2, S[1]], anim: (t) => { const f = cyc(t, 1.4, -i * 0.12), k = win(f, 0, 0.5); return { y: hop(k) * 1.1, sy: 1 - bump(f, 0.5, 0.04) * 0.25 }; } })),
      { geo: part(box(0.04, 0.5, 0.04), K.ink), pivot: [S[0] + 0.55, y0 + 1.2, S[1] + 0.39], anim: (t) => ({ s: cyc(t, 0.9) < 0.5 ? 1 : 0.001 }) },
      // Queries out to the data centre, results back.
      ...Array.from({ length: 6 }, (_, i) => ({ geo: part(ball(0.13), G[i % 4]), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, 3, i / 6), back = f > 0.5, k = easeIO(back ? (f - 0.5) * 2 : f * 2), a = back ? into : qFrom, b = back ? qFrom : into; return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k + Math.sin(Math.PI * k) * 1.6, z: a[2] + (b[2] - a[2]) * k, s: back ? 0.8 : 1 }; } })),
      // The Android waves.
      { geo: part(new THREE.CapsuleGeometry(0.12, 0.45, 6, 12), '#3ddc84', { p: [0, 0.3, 0] }), pivot: [A[0] + 0.72, y0 + 1.7, A[1]], anim: (t) => ({ rz: 2.6 + Math.sin(t * 6) * 0.35 * (cyc(t, 4) < 0.5 ? 1 : 0) }) },
      // The Maps pin drops and bounces.
      { geo: merge(part(lathe([[0, 0], [0.12, 0.28], [0.3, 0.62], [0.34, 0.85], [0.26, 1.05], [0, 1.13]], 32), '#ea4335'), part(cyl(0.12, 0.12, 0.08, 20), '#a50e0e', { p: [0, 0.82, 0.24], r: [Math.PI / 2, 0, 0] })), pivot: [M[0] + 0.1, y0 + 0.14, M[1] + 0.1], anim: (t) => { const f = cyc(t, 3.2), d = win(f, 0, 0.25); return { y: (1 - easeIn(d)) * 2.2 + bump(f, 0.3, 0.04) * 0.25, sy: 1 - bump(f, 0.26, 0.02) * 0.25, ry: t * 0.6 }; } },
      // Riders on the campus bikes.
      ...G.slice(0, 3).map((c, i) => ({ geo: bike(c), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 14, i / 3), p = loop.getPointAt(u), d = loop.getTangentAt(u); return { x: p.x, y: p.y + Math.abs(Math.sin(t * 6 + i)) * 0.02, z: p.z, ry: Math.atan2(-d.z, d.x) }; } })),
    ];
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },

  // ExxonMobil: integration, from the well to the pump. An offshore platform drills and flares at
  // sea; oil pulses ashore along a jetty pipeline past a moored tanker into the refinery's columns
  // and tanks; a tanker truck carries fuel to the station where a car fills up.
  exxon: { finder: '#e31937', build: () => {
    const R = rand(41), RED = '#e31937', BLUE = '#0047ba', out = [], SEA = 1.3, LAND = 1.5, XS = -0.8;
    // ---- the block: sea on one side (live water over blue strata), land on the other
    out.push(part(rbox(10.4, 0.2, 10.4, 0.06), '#0d3b5c', { p: [0, 0.1, 0] }));
    out.push(part(new THREE.PlaneGeometry(XS + 5.2, 10.4).rotateX(-Math.PI / 2), 'W', { p: [(XS - 5.2) / 2, SEA, 0] }));
    out.push(part(new THREE.PlaneGeometry(XS + 5.2, SEA, 8, 6).translate(0, SEA / 2, 0), (X, Y) => shade('#1f6f9e', 0.55 + (Y / SEA) * 0.55), { p: [(XS - 5.2) / 2, 0, 5.2] }));
    out.push(part(box(5.2 - XS, LAND, 10.4), '#a07a56', { p: [(XS + 5.2) / 2, LAND / 2, 0] }), part(box(5.2 - XS, 0.12, 10.4), '#cfd2d6', { p: [(XS + 5.2) / 2, LAND + 0.06, 0] }));
    for (let y = 0.25; y < LAND; y += 0.35) out.push(part(box(5.2 - XS + 0.01, 0.03, 10.42), '#8a6a4e', { p: [(XS + 5.2) / 2, y, 0] }));
    out.push(part(box(0.3, LAND + 0.15, 10.4), '#9aa1a9', { p: [XS - 0.12, (LAND + 0.15) / 2, 0] }));
    const gy = LAND + 0.12;
    // ---- the offshore platform
    const P = [-3.1, -2.2], deck = 3.9;
    // Four legs, X-braced between neighbours in two bays.
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [P[0] + sx * 1.1, P[1] + sz * 1.1]);
    corners.forEach(([x, z], i) => {
      out.push(part(cyl(0.22, 0.28, deck, 16), '#f2c94c', { p: [x, deck / 2, z] }));
      const [nx, nz] = corners[(i + 1) % 4];
      [[0.5, 1.9], [1.9, 3.3]].forEach(([y0b, y1b]) => out.push(beam([x, y0b, z], [nx, y1b, nz], 0.07, '#d4a92e'), beam([x, y1b, z], [nx, y0b, nz], 0.07, '#d4a92e')));
      out.push(beam([x, 1.9, z], [nx, 1.9, nz], 0.07, '#d4a92e'));
    });
    out.push(part(box(3.0, 0.3, 3.0), '#5b616b', { p: [P[0], deck, P[1]] }), part(box(2.9, 0.04, 2.9), '#7d8792', { p: [P[0], deck + 0.17, P[1]] }));
    out.push(part(rbox(1.2, 0.8, 1.0, 0.06), '#f4f5f6', { p: [P[0] - 0.75, deck + 0.55, P[1] + 0.85] }), part(rbox(1.2, 0.14, 1.0, 0.04), BLUE, { p: [P[0] - 0.75, deck + 0.98, P[1] + 0.85] }), part(rbox(0.9, 0.6, 0.8, 0.06), '#c9ced6', { p: [P[0] + 0.85, deck + 0.45, P[1] + 0.9] }));
    for (let k = 0; k < 4; k++) out.push(part(box(0.25, 0.2, 0.03), '#2c3e55', { p: [P[0] - 1.15 + k * 0.28, deck + 0.6, P[1] + 1.36] }));
    // Helipad cantilevered out, and orange lifeboats.
    out.push(part(cyl(0.75, 0.75, 0.08, 32), '#3a3f47', { p: [P[0] - 1.5, deck + 0.5, P[1] - 1.3] }), part(torus(0.6, 0.03, TAU, 32), K.yellow, { p: [P[0] - 1.5, deck + 0.55, P[1] - 1.3], r: [Math.PI / 2, 0, 0] }), beam([P[0] - 1.2, deck + 0.2, P[1] - 1.0], [P[0] - 1.5, deck + 0.45, P[1] - 1.3], 0.08, '#5b616b'),
      part(box(0.08, 0.02, 0.5), K.white, { p: [P[0] - 1.65, deck + 0.55, P[1] - 1.3] }), part(box(0.08, 0.02, 0.5), K.white, { p: [P[0] - 1.35, deck + 0.55, P[1] - 1.3] }), part(box(0.3, 0.02, 0.08), K.white, { p: [P[0] - 1.5, deck + 0.55, P[1] - 1.3] }));
    [0, 1].forEach((k) => out.push(part(new THREE.CapsuleGeometry(0.16, 0.45, 6, 12), K.orange, { p: [P[0] + 1.6, deck - 0.25, P[1] - 0.6 + k * 0.5], r: [Math.PI / 2, 0, 0] })));
    // The derrick: a tapered lattice tower.
    const D = [P[0] + 0.3, P[1] - 0.4], legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    legs.forEach(([sx, sz]) => out.push(beam([D[0] + sx * 0.55, deck + 0.15, D[1] + sz * 0.55], [D[0] + sx * 0.12, deck + 3.6, D[1] + sz * 0.12], 0.08, RED)));
    for (let k = 0; k < 6; k++) { const y = deck + 0.15 + k * 0.58, w = 0.55 - (k * 0.58) * 0.12, w2 = 0.55 - ((k + 1) * 0.58) * 0.12; legs.forEach(([sx, sz], i) => { const [nx, nz] = legs[(i + 1) % 4]; out.push(beam([D[0] + sx * w, y, D[1] + sz * w], [D[0] + nx * w, y, D[1] + nz * w], 0.035, K.white), beam([D[0] + sx * w, y, D[1] + sz * w], [D[0] + nx * w2, y + 0.58, D[1] + nz * w2], 0.025, '#e9e6df')); }); }
    out.push(part(box(0.4, 0.25, 0.4), '#3a3f47', { p: [D[0], deck + 3.7, D[1]] }));
    // The flare boom.
    out.push(beam([P[0] + 1.4, deck, P[1] - 1.4], [P[0] + 2.6, deck + 2.2, P[1] - 2.6], 0.12, '#7d8792'), [0.3, 0.6].map((k) => beam([P[0] + 1.4 + 1.2 * k, deck + 2.2 * k, P[1] - 1.4 - 1.2 * k], [P[0] + 1.4 + 1.2 * k + 0.2, deck + 2.2 * k - 0.4, P[1] - 1.4 - 1.2 * k], 0.04, '#7d8792')));
    // ---- the jetty carrying the pipeline ashore, with the tanker moored alongside
    const jz = 1.6, jy = SEA + 0.5;
    out.push(part(box(Math.abs(XS - P[0]) + 0.4, 0.12, 0.7), '#7d8792', { p: [(XS + P[0]) / 2, jy, jz] }));
    for (let x = P[0]; x < XS; x += 0.7) out.push(part(cyl(0.06, 0.06, jy, 8), '#5b616b', { p: [x, jy / 2, jz - 0.25] }), part(cyl(0.06, 0.06, jy, 8), '#5b616b', { p: [x, jy / 2, jz + 0.25] }));
    const pipe = new THREE.CatmullRomCurve3([[P[0] + 0.6, deck - 0.2, P[1] + 1.2], [P[0] + 0.6, jy + 0.3, jz - 0.6], [P[0] + 0.8, jy + 0.18, jz], [XS, jy + 0.18, jz], [XS + 0.8, gy + 0.6, jz], [1.4, gy + 0.6, jz], [1.9, gy + 0.6, -0.4], [1.9, gy + 0.6, -1.4]].map((p) => new V(...p)));
    out.push(part(new THREE.TubeGeometry(pipe, hi() ? 160 : 40, 0.1, hi() ? 12 : 6, false), '#c9ced6'));
    const ship = merge(part(extrude([[-2.2, 0], [1.6, 0], [2.4, 0.45], [2.2, 0.85], [-2.3, 0.85]], 1.2).rotateY(0), (x, y) => (y < 0.4 ? '#1d1f24' : '#b8202a')), part(box(4.2, 0.08, 1.15), '#5b616b', { p: [-0.05, 0.88, 0] }),
      Array.from({ length: 6 }, (_, i) => part(cyl(0.06, 0.06, 3.4, 8), '#d4a92e', { p: [0.0, 0.98, -0.35 + (i % 3) * 0.35], r: [0, 0, Math.PI / 2] })).slice(0, 3),
      part(rbox(0.8, 1.1, 1.0, 0.06), K.white, { p: [-1.75, 1.45, 0] }), part(box(0.82, 0.12, 1.02), '#2c3e55', { p: [-1.75, 1.8, 0] }), part(cyl(0.16, 0.2, 0.5, 14), RED, { p: [-1.95, 2.25, 0] }), part(cyl(0.17, 0.17, 0.1, 14), '#1d1f24', { p: [-1.95, 2.52, 0] }));
    // ---- the refinery: distillation columns, tanks, pipe rack, its own flare
    const column = (x, z, r, h) => { out.push(part(cyl(r, r * 1.05, h, 24), '#e9e6df', { p: [x, gy + h / 2, z] }), part(new THREE.SphereGeometry(r, 24, 10, 0, TAU, 0, Math.PI / 2), '#e9e6df', { p: [x, gy + h, z] })); for (let y = 1; y < h; y += 1.1) out.push(part(torus(r + 0.12, 0.03, TAU, 24), '#7d8792', { p: [x, gy + y, z], r: [Math.PI / 2, 0, 0] }), part(cyl(r + 0.12, r + 0.12, 0.04, 24), '#9aa1a9', { p: [x, gy + y - 0.02, z] })); out.push(beam([x + r + 0.05, gy, z + 0.1], [x + r + 0.05, gy + h, z + 0.1], 0.04, '#5b616b'), beam([x + r + 0.05, gy, z - 0.1], [x + r + 0.05, gy + h, z - 0.1], 0.04, '#5b616b')); };
    column(2.3, -2.6, 0.45, 5.2); column(3.4, -1.9, 0.35, 4.0); column(1.3, -3.4, 0.3, 3.2);
    const tank = (x, z, r, h) => { out.push(part(cyl(r, r, h, 32), '#f4f5f6', { p: [x, gy + h / 2, z] }), part(cyl(r * 1.01, r * 1.01, 0.22, 32), RED, { p: [x, gy + h * 0.72, z] }), part(new THREE.SphereGeometry(r, 32, 8, 0, TAU, 0, 0.45), '#e9e6df', { p: [x, gy + h - r * Math.cos(0.45), z] })); for (let k = 0; k < 10; k++) { const a = k * 0.35; out.push(part(box(0.18, 0.04, 0.1), '#7d8792', { p: [x + Math.cos(a) * (r + 0.07), gy + (k / 10) * h, z + Math.sin(a) * (r + 0.07)], r: [0, -a, 0] })); } };
    tank(4.1, -3.8, 0.8, 1.3); tank(4.1, -0.3, 0.7, 1.1); tank(0.5, -1.2, 0.6, 1.0);
    [-0.4, -1.2, -2.0].forEach((z) => out.push(part(box(0.08, 1.2, 0.08), '#5b616b', { p: [1.5, gy + 0.6, z] }), part(box(0.08, 1.2, 0.08), '#5b616b', { p: [2.3, gy + 0.6, z] }), part(box(0.9, 0.06, 0.08), '#5b616b', { p: [1.9, gy + 1.2, z] })));
    [0, 1, 2].forEach((k) => out.push(part(cyl(0.06, 0.06, 2.2, 8), ['#c9ced6', '#d4a92e', BLUE][k], { p: [1.65 + k * 0.25, gy + 1.28, -1.2], r: [Math.PI / 2, 0, 0] })));
    out.push(part(cyl(0.1, 0.14, 4.6, 12), '#7d8792', { p: [4.6, gy + 2.3, -2.2] }));
    // ---- the filling station
    const S = [2.6, 3.0];
    out.push(part(box(3.6, 0.04, 2.6), '#5b616b', { p: [S[0], gy + 0.02, S[1]] }), part(rbox(3.2, 0.32, 1.9, 0.08), K.white, { p: [S[0], gy + 1.75, S[1]] }), part(box(3.22, 0.1, 1.92), RED, { p: [S[0], gy + 1.67, S[1]] }), part(box(3.22, 0.07, 1.92), BLUE, { p: [S[0], gy + 1.58, S[1]] }));
    [[-1.2, -0.7], [1.2, -0.7], [-1.2, 0.7], [1.2, 0.7]].forEach(([dx, dz]) => out.push(part(cyl(0.07, 0.07, 1.6, 10), '#c9ced6', { p: [S[0] + dx, gy + 0.8, S[1] + dz] })));
    [-0.6, 0.6].forEach((dx) => out.push(part(rbox(0.35, 0.8, 0.28, 0.05), K.white, { p: [S[0] + dx, gy + 0.4, S[1]] }), part(box(0.36, 0.14, 0.29), RED, { p: [S[0] + dx, gy + 0.72, S[1]] }), part(box(0.2, 0.14, 0.02), '#2c3e55', { p: [S[0] + dx, gy + 0.5, S[1] + 0.15] })));
    out.push(part(rbox(1.6, 1.0, 1.0, 0.06), '#f4f5f6', { p: [4.3, gy + 0.5, 3.6] }), part(box(1.0, 0.6, 0.03), '#9dd0f2', { p: [4.3, gy + 0.45, 4.11] }), part(box(1.62, 0.16, 1.02), BLUE, { p: [4.3, gy + 1.0, 3.6] }));
    out.push(part(cyl(0.06, 0.06, 2.6, 10), '#9aa1a9', { p: [0.9, gy + 1.3, 4.6] }), part(rbox(0.9, 0.7, 0.12, 0.06), K.white, { p: [0.9, gy + 2.7, 4.6] }), part(box(0.7, 0.18, 0.13), RED, { p: [0.9, gy + 2.85, 4.6] }), part(box(0.7, 0.12, 0.13), BLUE, { p: [0.9, gy + 2.6, 4.6] }));
    const truck = merge(part(lathe([[0, -1.3], [0.42, -1.25], [0.45, 1.2], [0.4, 1.3], [0, 1.32]], 24).rotateZ(Math.PI / 2), '#e9ecef', { p: [-0.5, 0.85, 0] }), part(box(2.6, 0.08, 0.02), RED, { p: [-0.5, 0.85, 0.44] }),
      part(rbox(0.9, 0.95, 0.95, 0.15), BLUE, { p: [1.25, 0.72, 0] }), part(box(0.05, 0.38, 0.8), '#22303e', { p: [1.72, 0.9, 0] }), part(box(3.4, 0.14, 0.9), '#3a3f47', { p: [-0.1, 0.32, 0] }),
      [[-1.3, 0.45], [-0.8, 0.45], [1.25, 0.45], [-1.3, -0.45], [-0.8, -0.45], [1.25, -0.45]].flatMap(([x, z]) => [part(cyl(0.22, 0.22, 0.16, 16), '#1d1f24', { p: [x, 0.22, z], r: [Math.PI / 2, 0, 0] }), part(cyl(0.11, 0.11, 0.17, 12), '#c9ced6', { p: [x, 0.22, z], r: [Math.PI / 2, 0, 0] })]));
    const flame = flameGeo();
    return {
      bare: true, move: () => ({}),
      geo: merge(out),
      moving: [
        { geo: merge(part(cyl(0.08, 0.08, 3.4, 10), K.steel, { p: [0, -1.2, 0] }), part(box(0.5, 0.18, 0.5), '#3a3f47', { p: [0, 0.4, 0] })), pivot: [D[0], deck + 1.7, D[1]], anim: (t) => ({ ry: t * 3, y: Math.sin(t * 0.7) * 0.25 }) },
        { geo: flame, pivot: [P[0] + 2.62, deck + 2.3, P[1] - 2.62], anim: (t) => ({ rx: Math.PI, s: 0.6, sy: 0.55 + Math.sin(t * 17) * 0.1 + Math.sin(t * 7) * 0.07, rz: Math.sin(t * 5) * 0.15 }) },
        { geo: flame, pivot: [4.6, gy + 4.65, -2.2], anim: (t) => ({ rx: Math.PI, s: 0.42, sy: 0.4 + Math.sin(t * 19) * 0.08 + Math.sin(t * 6) * 0.05, rz: Math.cos(t * 4) * 0.15 }) },
        { geo: ship, pivot: [-2.6, SEA - 0.25, 2.65], anim: (t) => ({ y: Math.sin(t * 1.3) * 0.06, rx: Math.sin(t * 1.0) * 0.025, rz: Math.cos(t * 0.8) * 0.02 }) },
        // Oil pulsing ashore along the pipeline.
        ...Array.from({ length: hi() ? 8 : 3 }, (_, i) => ({ geo: part(torus(0.13, 0.04, TAU, 16), K.gold), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 5, i / (hi() ? 8 : 3)), p = pipe.getPointAt(u), d = pipe.getTangentAt(u); return { x: p.x, y: p.y, z: p.z, q: new THREE.Quaternion().setFromUnitVectors(new V(0, 0, 1), d) }; } })),
        // Steam from the columns.
        ...[0, 1, 2].map((i) => ({ geo: part(ball(0.4), '#f1eee8'), pivot: [3.4, gy + 4.3, -1.9], anim: (t) => { const f = cyc(t, 3, i / 3); return { y: f * 2.4, x: f * 0.8, s: (0.5 + f) * life(f, 0, 0.12, 0.6, 1) }; } })),
        // A tanker truck runs from the refinery to the station; a car pulls in to fill up.
        { geo: truck, pivot: [0, gy, 1.0], anim: (t) => { const f = cyc(t, 12), x = f < 0.4 ? -0.2 + 3.6 * easeIO(win(f, 0.05, 0.4)) : f < 0.6 ? 3.4 : 3.4 + 2.8 * easeIn(win(f, 0.6, 0.85)); return { x, s: Math.max(0.001, Math.min(1, (5.4 - x) / 0.6)) }; } },
        { geo: sedan('#3d7be0'), pivot: [0, gy, S[1] + 0.45], anim: (t) => { const f = cyc(t, 9, 0.3), x = f < 0.3 ? -0.2 + 2.2 * easeOut(win(f, 0, 0.3)) : f < 0.7 ? 2.0 : 2.0 + 3.2 * easeIn(win(f, 0.7, 0.95)); return { x, s: 0.75 * Math.max(0.001, Math.min(1, (x + 0.2) / 0.4, (5.3 - x) / 0.5)) }; } },
      ],
    };
  } },

  // Microsoft: the world works on its software, and that work runs in its cloud. On the campus,
  // people at desks work in Word, Excel, PowerPoint and Teams; their work arcs up into the cloud
  // and down into the Azure data centre, its racks blinking and its fans turning.
  microsoft: { finder: '#00a4ef', build: () => {
    const R = rand(51), out = [], y0 = 0.3, MS = ['#f25022', '#7fba00', '#00a4ef', '#ffb900'], APPS = ['#2b579a', '#217346', '#d24726', '#5b5fc7'];
    // ---- the campus lawn and paths
    out.push(part(rbox(10.4, 0.3, 10.4, 0.08), '#7cbf5a', { p: [0, 0.15, 0] }), part(box(10.2, 0.02, 0.9), '#e9e4d8', { p: [0, y0 + 0.01, 1.6] }), part(box(0.9, 0.02, 3.4), '#e9e4d8', { p: [-0.1, y0 + 0.01, 3.6] }));
    [[-4.2, 3.0], [-3.0, 4.4], [4.3, 3.2], [3.2, 4.5], [1.6, 4.6]].forEach(([x, z]) => out.push(miniTree(R, x, y0, z, 0.8)));
    // ---- the office pavilion, cut away to show the floor
    const O = { x0: -4.9, x1: -0.7, z0: -4.6, z1: 0.6 };
    out.push(part(box(O.x1 - O.x0, 0.2, O.z1 - O.z0), '#d6d1c6', { p: [(O.x0 + O.x1) / 2, y0 + 0.1, (O.z0 + O.z1) / 2] }), part(box(O.x1 - O.x0 - 0.1, 0.02, O.z1 - O.z0 - 0.1), '#b9a58a', { p: [(O.x0 + O.x1) / 2, y0 + 0.21, (O.z0 + O.z1) / 2] }));
    out.push(part(box(O.x1 - O.x0, 2.4, 0.12), '#9fc3d8', { p: [(O.x0 + O.x1) / 2, y0 + 1.4, O.z0] }), part(box(0.12, 2.4, O.z1 - O.z0), '#9fc3d8', { p: [O.x0, y0 + 1.4, (O.z0 + O.z1) / 2] }));
    for (let x = O.x0 + 0.5; x < O.x1; x += 0.6) out.push(part(box(0.04, 2.4, 0.14), '#e9ecef', { p: [x, y0 + 1.4, O.z0] }));
    for (let z = O.z0 + 0.5; z < O.z1; z += 0.6) out.push(part(box(0.14, 2.4, 0.04), '#e9ecef', { p: [O.x0, y0 + 1.4, z] }));
    out.push(part(box(O.x1 - O.x0 + 0.1, 0.12, 0.3), '#e9ecef', { p: [(O.x0 + O.x1) / 2, y0 + 2.66, O.z0] }), part(box(0.3, 0.12, O.z1 - O.z0 + 0.1), '#e9ecef', { p: [O.x0, y0 + 2.66, (O.z0 + O.z1) / 2] }));
    // Desks in two rows, each with a monitor showing an app and a person at work.
    const fy = y0 + 0.22;
    [[-3.9, -3.4], [-2.3, -3.4], [-3.9, -1.5], [-2.3, -1.5]].forEach(([x, z], k) => {
      out.push(part(rbox(1.3, 0.06, 0.7, 0.03), '#f4f5f6', { p: [x, fy + 0.72, z] }), [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([dx, dz]) => part(box(0.04, 0.72, 0.04), '#5b616b', { p: [x + dx, fy + 0.36, z + dz] })));
      const app = APPS[k % 4];
      out.push(part(rbox(0.75, 0.48, 0.04, 0.03), '#1d1f24', { p: [x, fy + 1.12, z - 0.2] }), part(box(0.68, 0.4, 0.01), '#f4f5f6', { p: [x, fy + 1.12, z - 0.175] }), part(box(0.68, 0.08, 0.012), app, { p: [x, fy + 1.28, z - 0.17] }),
        [0, 1, 2].map((r) => part(box(0.4 - r * 0.08, 0.025, 0.012), '#9aa1a9', { p: [x - 0.1, fy + 1.15 - r * 0.07, z - 0.17] })), part(box(0.05, 0.25, 0.05), '#1d1f24', { p: [x, fy + 0.86, z - 0.2] }), part(box(0.4, 0.02, 0.14), '#2b2f36', { p: [x, fy + 0.76, z + 0.05] }));
      // A seated person.
      const shirt = ['#3d7be0', '#e5533d', '#2f9e6e', '#8a6cf0'][k], skin = ['#e9b98f', '#c58c66', '#8d5a3b', '#f2c9a0'][k];
      out.push(part(rbox(0.5, 0.08, 0.5, 0.03), '#3a3f47', { p: [x, fy + 0.48, z + 0.55] }), part(box(0.5, 0.5, 0.06), '#3a3f47', { p: [x, fy + 0.75, z + 0.82] }), part(cyl(0.04, 0.04, 0.45, 8), '#5b616b', { p: [x, fy + 0.24, z + 0.55] }),
        part(new THREE.CapsuleGeometry(0.17, 0.32, 6, 12), shirt, { p: [x, fy + 0.85, z + 0.55] }), part(ball(0.15), skin, { p: [x, fy + 1.25, z + 0.52] }), part(ball(0.16), '#2b2f36', { p: [x, fy + 1.3, z + 0.55], s: [1, 0.7, 1] }),
        part(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), shirt, { p: [x - 0.18, fy + 0.85, z + 0.25], r: [1.2, 0, 0] }), part(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), shirt, { p: [x + 0.18, fy + 0.85, z + 0.25], r: [1.2, 0, 0] }));
    });
    out.push(part(cyl(0.22, 0.18, 0.4, 16), '#e9e6df', { p: [-1.2, fy + 0.2, -4.1] }), miniTree(R, -1.2, fy + 0.3, -4.1, 0.45), part(rbox(0.9, 0.5, 2.0, 0.1), '#5b5fc7', { p: [-1.2, fy + 0.25, -0.6] }));
    // ---- the Azure data centre, cut away to show its racks
    const Dc = { x0: 0.4, x1: 4.9, z0: -4.7, z1: 0.4 };
    out.push(part(box(Dc.x1 - Dc.x0, 0.2, Dc.z1 - Dc.z0), '#5b616b', { p: [(Dc.x0 + Dc.x1) / 2, y0 + 0.1, (Dc.z0 + Dc.z1) / 2] }));
    out.push(part(box(Dc.x1 - Dc.x0, 2.8, 0.2), '#2f343c', { p: [(Dc.x0 + Dc.x1) / 2, y0 + 1.4, Dc.z0] }), part(box(0.2, 2.8, Dc.z1 - Dc.z0), '#2f343c', { p: [Dc.x0, y0 + 1.4, (Dc.z0 + Dc.z1) / 2] }));
    out.push(part(box(Dc.x1 - Dc.x0 + 0.2, 0.25, Dc.z1 - Dc.z0 + 0.2), '#3a3f47', { p: [(Dc.x0 + Dc.x1) / 2, y0 + 2.92, (Dc.z0 + Dc.z1) / 2] }));
    // The four-square logo standing on the data centre's roof, turned to face the street.
    out.push(place(merge(part(rbox(1.35, 1.35, 0.1, 0.05), '#f4f5f6'), MS.map((c, i) => part(rbox(0.56, 0.56, 0.06, 0.04), c, { p: [-0.3 + (i % 2) * 0.6, 0.3 - Math.floor(i / 2) * 0.6, 0.07] })), [-0.45, 0.45].map((dx) => part(box(0.08, 0.6, 0.08), '#5b616b', { p: [dx, -0.95, -0.05] }))), { p: [4.2, y0 + 4.2, -0.3], r: [0, Math.PI / 4, 0] }));
    const racks = [];
    for (let row = 0; row < 3; row++) for (let k = 0; k < 4; k++) {
      const x = 1.1 + k * 0.92, z = -3.9 + row * 1.4;
      out.push(part(rbox(0.8, 2.0, 0.6, 0.04), '#1d1f24', { p: [x, y0 + 1.2, z] }));
      for (let u = 0; u < 9; u++) out.push(part(box(0.7, 0.03, 0.01), '#3a3f47', { p: [x, y0 + 0.35 + u * 0.2, z + 0.305] }));
      racks.push([x, z]);
    }
    // ---- the logo sculpture on the lawn
    out.push(part(rbox(0.5, 0.6, 0.5, 0.06), '#e9e6df', { p: [2.4, y0 + 0.3, 3.0] }));
    // ---- the cloud
    const cloudGeo = merge([[0, 0, 0, 1.2], [1.2, -0.25, 0.2, 0.95], [-1.25, -0.3, -0.1, 1.0], [0.5, 0.55, -0.3, 0.85], [-0.6, 0.45, 0.35, 0.8], [2.0, -0.45, -0.2, 0.6], [-2.0, -0.5, 0.2, 0.6]].map(([x, y, z, r]) => part(ball(r), (X, Y) => shade('#f4f8fc', Y < y - 0.4 ? 0.88 : 1), { p: [x, y, z] })));
    const officeOut = [-2.9, y0 + 1.6, -2.4], cloudAt = [0.2, 7.2, -1.6], dcIn = [2.6, y0 + 3.1, -2.2];
    const arc = (a, b, k, lift) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(Math.PI * k) * lift, a[2] + (b[2] - a[2]) * k];
    const moving = [
      { geo: cloudGeo, pivot: cloudAt, anim: (t) => ({ y: Math.sin(t * 0.8) * 0.2, x: Math.sin(t * 0.3) * 0.2 }) },
      ...MS.map((c, i) => ({ geo: part(rbox(0.5, 0.5, 0.14, 0.05), c), pivot: [2.15 + (i % 2) * 0.56, y0 + 1.15 - Math.floor(i / 2) * 0.56, 3.0], anim: (t) => ({ z: Math.sin(t * 2 + i * 0.9) * 0.04, y: 0.55 + Math.max(0, Math.sin(t * 2 + i * 0.9)) * 0.06 }) })),
      // Work flows up from the office into the cloud, and down into the data centre.
      ...Array.from({ length: hi() ? 8 : 4 }, (_, i) => ({ geo: part(rbox(0.28, 0.28, 0.08, 0.05), APPS[i % 4]), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, 3.2, i / (hi() ? 8 : 4)), p = f < 0.5 ? arc(officeOut, cloudAt, easeIO(f * 2), 0.8) : arc(cloudAt, dcIn, easeIO(f * 2 - 1), 0.6); return { x: p[0], y: p[1], z: p[2], ry: t * 2 + i, s: Math.min(1, f / 0.06, (1 - f) / 0.06) }; } })),
      // Rack lights blinking, a strip per rack.
      ...racks.map(([x, z], i) => ({ geo: merge(Array.from({ length: 8 }, (_, u) => part(box(0.05, 0.04, 0.012), u % 3 ? '#5fd08f' : '#00a4ef', { p: [0.25, 0.35 + u * 0.2, 0] }))), pivot: [x, y0, z + 0.31], anim: (t) => ({ sy: Math.sin(t * (3 + (i % 5)) + i * 1.7) > -0.3 ? 1 : 0.001 }) })),
      // Cooling fans turning on the roof.
      ...[[1.4, -3.6], [2.8, -3.6], [4.2, -3.6], [1.4, -1.4], [2.8, -1.4], [4.2, -1.4]].map(([x, z]) => ({ geo: merge(part(cyl(0.45, 0.45, 0.2, 24), '#7d8792', { p: [0, -0.1, 0] }), ring(5, (a) => part(box(0.38, 0.02, 0.12), '#c9ced6', { p: [Math.cos(a) * 0.2, 0.02, Math.sin(a) * 0.2], r: [0.3, -a, 0] }))), pivot: [x, y0 + 3.15, z], anim: (t) => ({ ry: t * 6 }) })),
    ];
    const walkerAt = moving.length;
    moving.push(...walker(walkerAt, (t) => { const f = cyc(t, 9), x = -4.6 + f * 9.2; return { x, z: 1.6, ry: 0, s: Math.min(1, f / 0.05, (1 - f) / 0.05) }; }, { shirt: '#00a4ef', pants: '#2b3a55', y: y0 }));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },

  // Nvidia: the engine every AI is trained on. A silicon city: the GPU die laid out like a town
  // of tiny blocks, ringed by memory towers, on a board of gold traces; light races along the
  // traces into the chip and rises into the neural network training above it.
  nvidia: { finder: '#76b900', build: () => {
    const R = rand(61), out = [], GREEN = '#76b900', y0 = 0.5;
    // ---- the board
    out.push(part(rbox(10.2, 0.5, 8.6, 0.1), '#14532d', { p: [0, 0.25, 0] }), part(box(10.0, 0.02, 8.4), '#1a6b3a', { p: [0, y0 + 0.01, 0] }));
    for (let i = 0; i < 18; i++) out.push(part(box(0.32, 0.03, 0.7), K.gold, { p: [-4.25 + i * 0.5, y0 + 0.02, 4.2] }));
    // Gold traces running to the chip, in bundles.
    const traces = [];
    for (let i = 0; i < (hi() ? 26 : 10); i++) {
      const side = i % 4, k = (Math.floor(i / 4) - 3) * 0.28, path = side === 0 ? [[-4.8, k - 0.8], [-3.2, k - 0.8], [-2.4, k * 0.6]] : side === 1 ? [[4.8, k + 0.6], [3.4, k + 0.6], [2.4, k * 0.6]] : side === 2 ? [[k - 0.6, -4.1], [k - 0.6, -2.9], [k * 0.6, -2.0]] : [[k + 0.5, 3.9], [k + 0.5, 3.0], [k * 0.6, 2.0]];
      traces.push(path);
      path.slice(1).forEach(([x, z], j) => { const [px, pz] = path[j], len = Math.hypot(x - px, z - pz); out.push(part(box(len, 0.012, 0.05), '#c9a227', { p: [(x + px) / 2, y0 + 0.025, (z + pz) / 2], r: [0, -Math.atan2(z - pz, x - px), 0] })); });
    }
    // Capacitors and power chokes around the edge.
    for (let i = 0; i < (hi() ? 30 : 10); i++) { const a = R() * TAU, d = 3.2 + R() * 0.9; const x = Math.cos(a) * d * 1.15, z = Math.sin(a) * d * 0.85; if (Math.abs(x) < 4.6 && Math.abs(z) < 3.8) out.push(part(cyl(0.12, 0.12, 0.35, 16), '#5b616b', { p: [x, y0 + 0.18, z] }), part(cyl(0.12, 0.12, 0.02, 16), '#c9ced6', { p: [x, y0 + 0.36, z] })); }
    for (let i = 0; i < 6; i++) out.push(part(rbox(0.5, 0.35, 0.5, 0.05), '#3a3f47', { p: [-3.9 + i * 0.6, y0 + 0.18, -3.3] }), part(box(0.3, 0.02, 0.3), '#9aa1a9', { p: [-3.9 + i * 0.6, y0 + 0.36, -3.3] }));
    // ---- the package, the die city and the memory towers
    out.push(part(rbox(4.6, 0.25, 4.0, 0.06), '#2b2f36', { p: [0, y0 + 0.13, 0] }), part(rbox(3.0, 0.12, 2.6, 0.04), '#5b616b', { p: [0, y0 + 0.31, 0] }));
    const dieY = y0 + 0.37;
    for (let gx = 0; gx < (hi() ? 13 : 6); gx++) for (let gz = 0; gz < (hi() ? 11 : 5); gz++) {
      const n = hi() ? [13, 11] : [6, 5], cw = 2.8 / n[0], cd = 2.4 / n[1], x = -1.4 + (gx + 0.5) * cw, z = -1.2 + (gz + 0.5) * cd;
      if (R() < 0.12) continue;
      const h = 0.04 + R() * R() * 0.32, core = (gx + gz) % 5 === 0;
      out.push(part(box(cw * 0.78, h, cd * 0.78), core ? '#4d7a12' : shade('#8d939a', 0.8 + R() * 0.3), { p: [x, dieY + h / 2, z] }));
    }
    const hbm = [[-2.0, -1.0], [-2.0, 0], [-2.0, 1.0], [2.0, -1.0], [2.0, 0], [2.0, 1.0]];
    hbm.forEach(([x, z]) => { for (let l = 0; l < 8; l++) out.push(part(box(0.62, 0.11, 0.72), l % 2 ? '#3a3f47' : '#4b5059', { p: [x, y0 + 0.31 + l * 0.12, z] })); out.push(part(box(0.62, 0.03, 0.72), '#9aa1a9', { p: [x, y0 + 0.31 + 8 * 0.12, z] })); });
    // ---- the heatsink and fan at one side
    for (let i = 0; i < (hi() ? 22 : 8); i++) out.push(part(box(0.04, 1.2, 2.4), '#c9ced6', { p: [3.3 + i * (hi() ? 0.07 : 0.19), y0 + 0.6, -2.4] }));
    out.push(part(rbox(1.8, 0.22, 2.6, 0.08), '#1d1f24', { p: [4.05, y0 + 1.31, -2.4] }), part(torus(0.95, 0.07, TAU, 40), GREEN, { p: [4.05, y0 + 1.43, -2.4], r: [Math.PI / 2, 0, 0] }));
    // ---- the neural network above, being trained
    const layers = [[-3, 4], [-1, 6], [1, 6], [3, 3]], nodes = [];
    layers.forEach(([x, n], li) => { for (let k = 0; k < n; k++) nodes.push({ li, p: [x * 1.05, 6.4 + (k - (n - 1) / 2) * 0.85, -0.4 + Math.sin(k * 1.7 + li) * 0.35] }); });
    const L = [0, 1, 2, 3].map((li) => nodes.filter((n) => n.li === li));
    nodes.forEach((a) => nodes.forEach((b) => { if (b.li === a.li + 1) out.push(beam(a.p, b.p, 0.025, '#5b7a3a')); }));
    out.push(nodes.map((n) => part(ball(0.2), '#2f3a2a', { p: n.p })));
    // Rings of light stacked from the die up into the network.
    [0, 1, 2, 3, 4].forEach((k) => out.push(part(torus(0.5 + k * 0.16, 0.025, TAU, 40), '#c7f464', { p: [0, dieY + 0.9 + k * 0.85, 0], r: [Math.PI / 2, 0, 0] })));
    const at = (pts, f) => { const seg = Math.min(pts.length - 2, Math.floor(f * (pts.length - 1))), k = f * (pts.length - 1) - seg; return pts[seg].map((v, j) => v + (pts[seg + 1][j] - v) * k); };
    const moving = [
      { geo: merge(part(cyl(0.18, 0.18, 0.1, 16), '#1d1f24'), ring(9, (a) => part(extrude([[0, 0], [0.85, -0.12], [0.92, 0.18], [0.12, 0.2]], 0.04), '#3a3f47', { r: [Math.PI / 2, 0, a] }))), pivot: [4.05, y0 + 1.48, -2.4], anim: (t) => ({ ry: -t * 8 }) },
      // Pulses along the traces into the chip.
      ...traces.map((path, i) => ({ geo: part(ball(0.07), '#c7f464', { s: [2.2, 1, 1] }), pivot: [0, y0 + 0.07, 0], anim: (t) => { const f = cyc(t, 1.8, (i * 0.37) % 1), p = at(path.map(([x, z]) => [x, 0, z]), f); return { x: p[0], z: p[2], s: Math.min(1, f / 0.05, (1 - f) / 0.05) }; } })),
      // Signals rising from the die and running forward through the network.
      ...Array.from({ length: hi() ? 8 : 4 }, (_, i) => { const path = [[0, dieY + 0.3, 0], L[0][i % 4].p, L[1][(i * 2 + 1) % 6].p, L[2][(i * 5 + 2) % 6].p, L[3][i % 3].p]; return { geo: part(ball(0.13), '#e9ffc7'), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, 2.6, i / (hi() ? 8 : 4)), p = at(path, easeIO(f)); return { x: p[0], y: p[1], z: p[2], s: 1 + bump(f, 0.25, 0.04) + bump(f, 0.5, 0.04) + bump(f, 0.75, 0.04) }; } }; }),
      // Nodes light up as training passes through them.
      ...nodes.map((n, i) => ({ geo: part(ball(0.22), GREEN), pivot: n.p, anim: (t) => { const f = cyc(t, 2.6, -n.li * 0.18 + i * 0.01); return { s: 0.6 + bump(f, 0.5, 0.12) * 0.9 }; } })),
    ];
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },

  // Costco: the membership warehouse. Towering racks of bulk pallets, a forklift lifting stock to
  // the top shelf, a member wheeling out a loaded flatbed, checkouts, and the food court where the
  // $1.50 hot dog has never changed price; the membership card turns overhead.
  costco: { finder: '#e31837', build: () => {
    const R = rand(71), RED = '#e31837', BLUE = '#005daa', out = [], y0 = 0.24;
    out.push(part(rbox(10.4, 0.24, 10.4, 0.08), '#c9ccd0', { p: [0, 0.12, 0] }));
    for (let i = -4; i <= 4; i++) out.push(part(box(0.02, 0.01, 10), '#b9bdc2', { p: [i * 1.15, y0 + 0.005, 0] }));
    // ---- the cut-away building: back and side walls with the red and blue bands
    out.push(part(box(10.4, 4.4, 0.25), '#d9d6cf', { p: [0, y0 + 2.2, -5.05] }), part(box(0.25, 4.4, 10.4), '#d9d6cf', { p: [-5.05, y0 + 2.2, 0] }));
    out.push(part(box(10.4, 0.5, 0.27), RED, { p: [0, y0 + 3.7, -5.05] }), part(box(10.4, 0.25, 0.27), BLUE, { p: [0, y0 + 3.3, -5.05] }), part(box(0.27, 0.5, 10.4), RED, { p: [-5.05, y0 + 3.7, 0] }), part(box(0.27, 0.25, 10.4), BLUE, { p: [-5.05, y0 + 3.3, 0] }));
    for (let x = -4.6; x < 5; x += 0.9) out.push(beam([x, y0 + 4.4, -5.0], [x, y0 + 4.4, -3.4], 0.06, '#9aa1a9'));
    // ---- the racks: blue uprights, orange beams, pallets of bulk goods
    const goods = [
      (x, y, z) => [part(rbox(1.0, 0.12, 0.9, 0.02), '#c9a072', { p: [x, y + 0.06, z] }), part(rbox(0.95, 0.75, 0.85, 0.04), '#3d7be0', { p: [x, y + 0.5, z] }), [0, 1, 2].map((k) => part(box(0.96, 0.02, 0.86), '#9fc3e8', { p: [x, y + 0.25 + k * 0.25, z] }))],
      (x, y, z) => [part(rbox(1.0, 0.12, 0.9, 0.02), '#c9a072', { p: [x, y + 0.06, z] }), ...[[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]].flatMap(([dx, dz]) => [0, 1].map((l) => part(cyl(0.2, 0.2, 0.36, 16), '#f4f5f6', { p: [x + dx, y + 0.32 + l * 0.38, z + dz] })))],
      (x, y, z) => [part(rbox(1.0, 0.12, 0.9, 0.02), '#c9a072', { p: [x, y + 0.06, z] }), [0, 1, 2].map((k) => part(rbox(0.9, 0.22, 0.8, 0.03), '#1d1f24', { p: [x, y + 0.25 + k * 0.24, z] })), [0, 1, 2].map((k) => part(box(0.5, 0.02, 0.81), '#5b6470', { p: [x, y + 0.25 + k * 0.24, z] }))],
      (x, y, z) => [part(rbox(1.0, 0.12, 0.9, 0.02), '#c9a072', { p: [x, y + 0.06, z] }), part(rbox(0.95, 0.8, 0.85, 0.04), '#c99a62', { p: [x, y + 0.52, z] }), part(box(0.97, 0.06, 0.2), '#e3c690', { p: [x, y + 0.92, z] })],
    ];
    const rack = (z) => {
      const levels = [0, 1.4, 2.8], xs = [-4.4, -3.2, -2.0, -0.8, 0.4, 1.6];
      xs.forEach((x) => [-0.5, 0.5].forEach((dz) => out.push(part(box(0.1, 4.0, 0.1), BLUE, { p: [x - 0.6, y0 + 2.0, z + dz] }))));
      [-0.5, 0.5].forEach((dz) => out.push(part(box(0.1, 4.0, 0.1), BLUE, { p: [xs[xs.length - 1] + 0.6, y0 + 2.0, z + dz] })));
      levels.forEach((ly) => [-0.5, 0.5].forEach((dz) => out.push(part(box(7.3, 0.12, 0.08), '#f29a3a', { p: [-1.4, y0 + ly + 0.06, z + dz] }))));
      xs.forEach((x, i) => levels.forEach((ly, j) => { if ((i + j * 2 + Math.floor(z)) % 5 === 4) return; out.push(goods[(i * 3 + j + (z > -3 ? 1 : 0)) % goods.length](x, y0 + ly + 0.12, z)); }));
    };
    rack(-4.1); rack(-2.3);
    // ---- checkouts and the member desk at the front
    [[-3.6, 1.9], [-1.9, 1.9]].forEach(([x, z]) => out.push(part(rbox(1.6, 0.85, 0.6, 0.06), '#e9e6df', { p: [x, y0 + 0.43, z] }), part(box(1.5, 0.04, 0.45), '#1d1f24', { p: [x, y0 + 0.87, z] }), part(rbox(0.3, 0.35, 0.25, 0.04), '#3a3f47', { p: [x + 0.6, y0 + 1.05, z - 0.1] }), part(cyl(0.03, 0.03, 1.2, 8), '#9aa1a9', { p: [x - 0.7, y0 + 1.4, z] }), part(rbox(0.35, 0.3, 0.06, 0.03), RED, { p: [x - 0.7, y0 + 2.0, z] })));
    // ---- the food court: the stand with the hot dog on its sign, tables under red umbrellas
    const F = [3.2, 2.6];
    out.push(part(rbox(2.4, 1.0, 0.9, 0.06), K.white, { p: [F[0], y0 + 0.5, F[1] - 1.2] }), part(box(2.42, 0.18, 0.92), RED, { p: [F[0], y0 + 0.95, F[1] - 1.2] }), part(rbox(2.4, 0.9, 0.08, 0.04), '#1d1f24', { p: [F[0], y0 + 2.2, F[1] - 1.62] }),
      [0, 1, 2].map((k) => part(box(0.6, 0.6, 0.02), ['#e9b06a', '#c0503a', '#ffd23f'][k], { p: [F[0] - 0.75 + k * 0.75, y0 + 2.2, F[1] - 1.57] })), [-1.1, 1.1].map((dx) => part(box(0.06, 1.3, 0.06), '#5b616b', { p: [F[0] + dx, y0 + 1.6, F[1] - 1.62] })));
    const hotdog = merge(part(new THREE.CapsuleGeometry(0.42, 1.9, 8, 20), '#e8b06a', { r: [0, 0, Math.PI / 2], s: [1, 1, 1.25] }), part(new THREE.CapsuleGeometry(0.25, 2.3, 8, 16), '#c0503a', { p: [0, 0.3, 0], r: [0, 0, Math.PI / 2] }),
      part(tube(Array.from({ length: 11 }, (_, i) => [-1.05 + i * 0.21, 0.58, (i % 2 ? 0.1 : -0.1)]), 0.05), K.yellow));
    out.push(place(hotdog, { p: [F[0], y0 + 3.15, F[1] - 1.6], s: 0.8 }));
    [[F[0] - 1.0, F[1] + 0.5], [F[0] + 0.9, F[1] + 0.4], [F[0], F[1] + 1.8]].forEach(([x, z]) => out.push(part(cyl(0.45, 0.45, 0.05, 20), K.white, { p: [x, y0 + 0.75, z] }), part(cyl(0.05, 0.05, 0.75, 8), '#9aa1a9', { p: [x, y0 + 0.37, z] }), part(cyl(0.03, 0.03, 1.8, 8), '#9aa1a9', { p: [x, y0 + 1.6, z] }),
      part(cone(0.95, 0.4, 8), (X, Y, Z) => (Math.floor((Math.atan2(Z - z, X - x) + Math.PI) / (Math.PI / 4)) % 2 ? RED : K.white), { p: [x, y0 + 2.35, z] }), [0, 1, 2].map((k) => { const a = k * 2.1 + 0.4; return part(rbox(0.32, 0.35, 0.32, 0.05), '#3a3f47', { p: [x + Math.cos(a) * 0.7, y0 + 0.18, z + Math.sin(a) * 0.7] }); }),
      part(rbox(0.18, 0.08, 0.1, 0.03), '#e8b06a', { p: [x + 0.1, y0 + 0.8, z] }), part(cyl(0.06, 0.05, 0.16, 12), RED, { p: [x - 0.15, y0 + 0.86, z + 0.1] })));
    // Seated diners at two tables.
    [[F[0] - 1.0, F[1] + 0.5, 0.4, '#3d7be0'], [F[0] + 0.9, F[1] + 0.4, 2.5, '#2f9e6e']].forEach(([x, z, a, c]) => { const px = x + Math.cos(a) * 0.7, pz = z + Math.sin(a) * 0.7; out.push(part(new THREE.CapsuleGeometry(0.16, 0.3, 6, 12), c, { p: [px, y0 + 0.75, pz] }), part(ball(0.14), '#e9b98f', { p: [px, y0 + 1.12, pz] }), part(ball(0.15), '#3a2a20', { p: [px, y0 + 1.17, pz], s: [1, 0.7, 1] })); });
    // ---- the forklift, its mast and its forks
    const forklift = merge(part(rbox(1.5, 0.75, 1.0, 0.12), K.yellow, { p: [0, 0.6, 0] }), part(rbox(0.7, 0.55, 0.95, 0.12), '#2b2f36', { p: [-0.45, 0.6, 0] }), part(rbox(0.5, 0.35, 0.5, 0.06), '#1d1f24', { p: [-0.1, 1.15, 0] }),
      [[-0.45, 0.4], [-0.45, -0.4], [0.5, 0.4], [-0.95, 0.4], [0.5, -0.4], [-0.95, -0.4]].slice(0, 4).map(([x, z]) => part(cyl(0.25, 0.25, 0.2, 16), '#1d1f24', { p: [x === -0.45 ? 0.45 : -0.55, 0.25, z * 1.2], r: [Math.PI / 2, 0, 0] })),
      [[-0.65, 0.42], [-0.65, -0.42], [0.25, 0.42], [0.25, -0.42]].map(([x, z]) => beam([x, 0.95, z], [x * 0.9, 2.1, z], 0.05, '#1d1f24')), part(box(1.1, 0.06, 1.0), '#1d1f24', { p: [-0.2, 2.12, 0] }),
      [-0.35, 0.35].map((z) => part(box(0.1, 2.6, 0.1), '#3a3f47', { p: [0.8, 1.35, z] })));
    const forks = merge([-0.3, 0.3].map((z) => part(box(1.0, 0.06, 0.15), '#7d8792', { p: [0.5, 0, z] })), part(box(0.1, 0.7, 0.9), '#5b616b', { p: [0, 0.35, 0] }), goods[0](0.55, 0.03, 0));
    const lift = (t) => { const f = cyc(t, 8); return easeIO(win(f, 0.3, 0.5)) * (1 - easeIO(win(f, 0.72, 0.9))); };
    const drive = (t) => { const f = cyc(t, 8); return easeIO(win(f, 0, 0.25)) * (1 - easeIO(win(f, 0.9, 1))); };
    const flatbed = merge(part(rbox(1.5, 0.08, 0.7, 0.03), '#9aa1a9', { p: [1.05, 0.3, 0] }), [[0.45, 0.3], [1.65, 0.3], [0.45, -0.3], [1.65, -0.3]].map(([x, z]) => part(cyl(0.1, 0.1, 0.08, 12), '#1d1f24', { p: [x, 0.12, z], r: [Math.PI / 2, 0, 0] })),
      beam([0.3, 0.3, -0.32], [0.3, 1.1, -0.32], 0.04, '#9aa1a9'), beam([0.3, 0.3, 0.32], [0.3, 1.1, 0.32], 0.04, '#9aa1a9'), beam([0.3, 1.1, -0.32], [0.3, 1.1, 0.32], 0.05, RED),
      part(rbox(0.6, 0.45, 0.6, 0.04), '#3d7be0', { p: [0.75, 0.57, 0] }), [0, 1].map((k) => part(cyl(0.12, 0.12, 0.3, 12), '#f4f5f6', { p: [1.25 + k * 0.26, 0.5, -0.12] })), part(rbox(0.55, 0.12, 0.45, 0.03), '#1d1f24', { p: [1.35, 0.42, 0.15] }), part(rbox(0.5, 0.35, 0.4, 0.04), '#c99a62', { p: [1.4, 0.68, 0.12] }));
    const card = merge(part(rbox(3.0, 1.9, 0.1, 0.18), K.white), part(box(3.02, 0.5, 0.11), RED, { p: [0, 0.42, 0] }), part(box(3.02, 0.22, 0.11), BLUE, { p: [0, 0.08, 0] }), part(rbox(0.65, 0.8, 0.12, 0.08), '#9aa4b1', { p: [-0.95, -0.42, 0] }), part(box(1.2, 0.1, 0.12), '#5b6470', { p: [0.5, -0.38, 0] }), part(box(0.9, 0.08, 0.12), '#9aa1a9', { p: [0.4, -0.6, 0] }));
    const moving = [
      { geo: forklift, pivot: [0, y0, -0.95], anim: (t) => ({ x: -3.6 + drive(t) * 3.0, y: Math.abs(Math.sin(t * 9)) * 0.01 * (drive(t) > 0 && drive(t) < 1 ? 1 : 0) }) },
      { geo: forks, pivot: [0.85, 0.35, 0], parent: 0, anim: (t) => ({ y: lift(t) * 2.65, x: lift(t) > 0.98 ? 0.25 : 0 }) },
      { geo: card, pivot: [0.8, 8.0, -0.6], anim: (t) => ({ ry: t * 0.8, y: Math.sin(t * 1.3) * 0.2 }) },
    ];
    moving.push(...walker(3, (t) => { const f = cyc(t, 10), x = -3.0 + f * 7.0; return { x, z: 0.55, ry: 0, s: Math.min(1, f / 0.04, (1 - f) / 0.04), push: true }; }, { shirt: '#f29a3a', pants: '#2b3a55', y: y0, carry: flatbed }));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },

  // Meta: billions of people connected. Little people ride the infinity loop, and hearts pop up
  // where they meet.
  meta: { finder: '#0866ff', build: () => {
    // The infinity loop stands upright, with a slight twist in depth where it crosses.
    const N = 64, pts = Array.from({ length: N }, (_, i) => { const a = (i / N) * TAU, d = 1 + Math.sin(a) ** 2; return [4 * Math.cos(a) / d, 5.6 + 3.2 * Math.sin(a) * Math.cos(a) / d, 0.7 * Math.sin(a)]; });
    const loop = curve(pts, true);
    const person = (c) => merge(part(ball(0.42), c), part(ball(0.12), K.white, { p: [0.2, 0.12, 0.34] }), part(ball(0.12), K.white, { p: [-0.2, 0.12, 0.34] }));
    const heart = merge(part(ball(0.3), '#ff3b5c', { p: [-0.22, 0.12, 0] }), part(ball(0.3), '#ff3b5c', { p: [0.22, 0.12, 0] }), part(cone(0.42, 0.55, 4), '#ff3b5c', { p: [0, -0.24, 0], r: [Math.PI, Math.PI / 4, 0], s: [1, 1, 0.75] }));
    return {
      bare: true, move: () => ({}),
      geo: merge(part(cyl(4.6, 4.8, 0.5, 56), '#f0f2f5', { p: [0, 0.25, 0] }), part(tubeOn(loop, 0.55, hi() ? 200 : 48), (x) => (x < -1 ? '#0064e0' : x < 1 ? '#0866ff' : '#4f8dff')),
        [[-2.6, 0], [2.6, 0]].map(([x, z]) => part(cyl(0.16, 0.22, 4.6, 12), '#c8ccd1', { p: [x, 2.55, z] }))),
      moving: [
        ...['#f25c54', '#2a9d8f', '#e9c46a', '#8a6cf0', '#f4a261'].map((c, i) => ({ geo: person(c), pivot: [0, 0, 0], anim: (t) => {
          const u = cyc(t, 7, i / 5), p = loop.getPointAt(u), d = loop.getTangentAt(u);
          return { x: p.x, y: p.y, z: p.z + 0.55, s: 1 + Math.sin(t * 6 + i) * 0.06 };
        } })),
        ...[0, 1, 2].map((i) => ({ geo: heart, pivot: [0, 6.4, 0.6], anim: (t) => { const f = cyc(t, 2.4, i / 3); return { y: f * 3, x: (i - 1) * 1.4 + Math.sin(f * 6) * 0.3, s: life(f, 0, 0.12, 0.6, 1) }; } })),
      ],
    };
  } },

  // Ford: the moving assembly line it invented. Bodies ride the line; a robot welds, a cab drops
  // on, the wheels go on, and a finished truck rolls off.
  ford: { finder: '#003478', build: () => {
    const truck = (stage) => merge(part(rbox(3.2, 0.5, 1.5, 0.12), '#3a3f47', { p: [0, 0.55, 0] }),
      stage >= 1 ? [part(rbox(1.4, 1.2, 1.5, 0.25), '#003478', { p: [0.55, 1.4, 0] }), part(box(1.42, 0.5, 1.3), '#9dd0f2', { p: [0.65, 1.7, 0] }), part(rbox(1.7, 0.6, 1.5, 0.12), '#003478', { p: [-0.85, 1.05, 0] }), part(rbox(0.9, 0.55, 1.45, 0.15), '#003478', { p: [1.4, 1.05, 0] })] : [],
      stage >= 2 ? [[-1, 0.8], [1.05, 0.8], [-1, -0.8], [1.05, -0.8]].map(([x, z]) => part(cyl(0.38, 0.38, 0.3, 18), K.ink, { p: [x, 0.4, z], r: [Math.PI / 2, 0, 0] })) : []);
    const line = (i) => (t) => { const f = cyc(t, 7.5, i / 3), x = -5 + f * 10; return { x, s: f < 0.04 ? f / 0.04 : f > 0.95 ? (1 - f) / 0.05 : 1 }; };
    const stageOf = (x) => (x < -1.5 ? 0 : x < 1.6 ? 1 : 2);
    return {
      bare: true, move: () => ({}),
      geo: merge(part(box(10, 0.16, 6), '#cfd4da', { p: [0, 0.08, 0] }), part(rbox(10, 0.7, 2.2, 0.2), '#3a3f47', { p: [0, 0.5, 0] }), ring(10, (a, i) => part(box(0.06, 0.02, 2.1), '#5b6470', { p: [-4.5 + i, 0.86, 0] })),
        part(box(0.3, 5.2, 0.3), '#7d8792', { p: [-1.6, 2.6, -1.7] }), part(box(0.3, 5.2, 0.3), '#7d8792', { p: [-1.6, 2.6, 1.7] }), part(box(0.4, 0.4, 3.8), '#7d8792', { p: [-1.6, 5.2, 0] }),
        part(cyl(0.7, 0.8, 0.5, 24), '#f29a3a', { p: [1.6, 0.25, -2.2] }), part(rbox(5.4, 1.4, 0.2, 0.1), '#003478', { p: [0.4, 4.5, -2.9] }), part(cyl(0.65, 0.65, 0.22, 40), K.white, { p: [0.4, 4.5, -2.75], r: [Math.PI / 2, 0, 0], s: [1.6, 1, 1] }), part(cyl(0.6, 0.6, 0.24, 40), '#003478', { p: [0.4, 4.5, -2.74], r: [Math.PI / 2, 0, 0], s: [1.55, 1, 1] })),
      moving: [
        // Three trucks on the line, each shown at the stage it has reached.
        ...[0, 1, 2].flatMap((i) => [0, 1, 2].map((st) => ({ geo: truck(st), pivot: [0, 0.85, 0], anim: (t) => { const p = line(i)(t); return stageOf(p.x) === st ? p : { s: 0 }; } }))),
        // The robot arm at the welding station.
        { geo: merge(part(cyl(0.35, 0.35, 1.6, 16), '#f29a3a', { p: [0, 0.8, 0] }), part(ball(0.36), '#3a3f47', { p: [0, 1.6, 0] })), pivot: [1.6, 0.5, -2.2], anim: (t) => ({ ry: Math.sin(t * 1.4) * 0.5 }) },
        { geo: merge(beam([0, 0, 0], [0, 1.6, 1], 0.32, '#f29a3a'), part(ball(0.3), '#3a3f47', { p: [0, 1.6, 1] }), beam([0, 1.6, 1], [0, 1.2, 2.2], 0.24, '#f29a3a'), part(cone(0.15, 0.4, 12), K.steel, { p: [0, 1.05, 2.4], r: [Math.PI * 0.8, 0, 0] })), pivot: [0, 1.6, 0], parent: 9, anim: (t) => ({ rx: Math.sin(t * 2.8) * 0.2 }) },
        ...Array.from({ length: 6 }, (_, i) => ({ geo: part(box(0.12, 0.12, 0.12), i % 2 ? K.yellow : K.orange), pivot: [1.6, 2.2, 0.2], anim: (t) => { const f = cyc(t, 0.7, i / 6), a = i * 2.3; return { x: Math.cos(a) * f * 1.4, z: Math.sin(a) * f * 1.4, y: f * 1.4 - 3 * f * f, s: (1 - f) * (Math.sin(t * 2.8) > 0 ? 1 : 0) }; } })),
      ],
    };
  } },

  // Tesla: electric cars that refuel at their own network. The car charges at a Supercharger,
  // the battery fills, and it glides away and back.
  tesla: { finder: '#cc0000', build: () => {
    const car = merge(
      part(lathe([[0, -2.4], [0.5, -2.35], [0.7, -2.1], [0.78, -1], [0.8, 0.6], [0.72, 1.8], [0.5, 2.3], [0, 2.4]], hi() ? 40 : 14).rotateZ(Math.PI / 2).scale(1, 0.7, 1.35), '#cc0000', { p: [0, 0.95, 0] }),
      part(ball(1), '#1e2a36', { p: [-0.25, 1.45, 0], s: [1.55, 0.55, 0.95] }),
      [[-1.45, 0.92], [1.45, 0.92], [-1.45, -0.92], [1.45, -0.92]].flatMap(([x, z]) => [part(cyl(0.48, 0.48, 0.32, 24), K.ink, { p: [x, 0.48, z], r: [Math.PI / 2, 0, 0] }), part(cyl(0.3, 0.3, 0.34, 20), '#c9ced6', { p: [x, 0.48, z], r: [Math.PI / 2, 0, 0] })]),
      part(box(0.05, 0.12, 0.9), '#d9d9d9', { p: [2.38, 0.95, 0] }), part(box(0.05, 0.14, 1.4), '#8a1010', { p: [-2.38, 1.05, 0] }));
    const drive = (t) => { const f = cyc(t, 8); return f < 0.55 ? 0 : 4.5 * easeIO(win(f, 0.55, 0.75)) * (1 - easeIO(win(f, 0.8, 1))); };
    const charge = (t) => { const f = cyc(t, 8); return f < 0.5 ? win(f, 0.03, 0.48) : f < 0.8 ? 1 - win(f, 0.55, 0.8) * 0.4 : 0.6 - win(f, 0.8, 1) * 0.6; };
    return {
      bare: true, move: () => ({}),
      geo: merge(part(box(10, 0.16, 7), '#3a3f47', { p: [0, 0.08, 0] }), part(box(5.6, 0.02, 0.15), K.white, { p: [0.4, 0.17, 1.9] }), part(box(5.6, 0.02, 0.15), K.white, { p: [0.4, 0.17, -1.9] }),
        part(rbox(1, 4.6, 0.8, 0.45), '#f4f5f6', { p: [-3.4, 2.4, -2.6] }), part(rbox(1.04, 1.2, 0.84, 0.4), '#cc0000', { p: [-3.4, 4.1, -2.6] }), part(rbox(0.6, 0.8, 0.06, 0.1), '#1e2a36', { p: [-3.4, 2.9, -2.18] }),
        // Battery gauge beside the stall.
        part(rbox(0.9, 4.4, 0.4, 0.15), '#2b2f36', { p: [-4.4, 2.4, 0.4] }), part(rbox(0.74, 4.1, 0.05, 0.1), '#11161c', { p: [-4.4, 2.4, 0.62] })),
      moving: [
        { geo: car, pivot: [-0.6, 0.16, 0], anim: (t) => ({ x: drive(t), y: Math.abs(Math.sin(t * 9)) * 0.02 * Math.min(1, drive(t)), s: 1.35 }) },
        { geo: part(tube([[0, 0, 0], [0.6, -0.8, 0.6], [1.3, -1.2, 1.4], [1.3, -1.6, 2.2]], 0.09), K.ink), pivot: [-3.3, 2.6, -2.2], anim: (t) => ({ s: drive(t) < 0.05 ? 1 : 0 }) },
        { geo: part(rbox(0.56, 1, 0.08, 0.06), '#5fd08f', { p: [0, 0.5, 0] }), pivot: [-4.4, 0.5, 0.66], anim: (t) => ({ sy: Math.max(0.02, charge(t)) * 3.8 }) },
        { geo: merge(part(extrude([[0.1, 0.5], [-0.25, -0.05], [0.02, -0.05], [-0.1, -0.5], [0.25, 0.05], [-0.02, 0.05]], 0.12), K.yellow)), pivot: [-4.4, 5.1, 0.4], anim: (t) => ({ s: charge(t) < 0.99 && drive(t) < 0.05 ? 1 + Math.sin(t * 8) * 0.15 : 0, ry: t * 2 }) },
      ],
    };
  } },

  // Disney: storytelling magic. The castle, with fireworks blooming over its spires.
  disney: { finder: '#113ccf', build: () => {
    const tower = (x, z, r, h) => merge(part(cyl(r, r * 1.08, h, 28), '#f4f1ea', { p: [x, h / 2, z] }), part(cone(r * 1.45, h * 0.55, 28), '#3f6fd8', { p: [x, h + h * 0.27, z] }), part(cyl(r * 1.15, r * 1.15, 0.2, 28), '#ffd23f', { p: [x, h, z] }), part(cone(0.07, 0.6, 8), '#ffd23f', { p: [x, h + h * 0.55 + 0.3, z] }), ring(6, (a) => part(box(r * 0.35, 0.3, r * 0.35), '#f4f1ea', { p: [x + Math.cos(a) * r, h + 0.15, z + Math.sin(a) * r] })));
    const burst = (c) => merge(ring(12, (a, i) => part(ball(0.13), c, { p: [Math.cos(a) * Math.cos(i * 1.3) * 1.2, Math.sin(i * 1.3) * 1.1, Math.sin(a) * Math.cos(i * 1.3) * 1.2] })), ring(12, (a, i) => beam([0, 0, 0], [Math.cos(a) * Math.cos(i * 1.3) * 1, Math.sin(i * 1.3) * 0.95, Math.sin(a) * Math.cos(i * 1.3) * 1], 0.05, c)));
    return {
      bare: true, move: () => ({}),
      geo: merge(part(cyl(4.8, 5, 0.4, 56), '#7cbf5a', { p: [0, 0.2, 0] }), part(cyl(4.9, 4.9, 0.12, 56), 'W', { p: [0, 0.32, 0] }), part(cyl(3.6, 3.7, 0.5, 48), '#cfc6b4', { p: [0, 0.6, 0] }),
        part(box(5.6, 2.6, 2.6), '#f4f1ea', { p: [0, 2.1, 0] }), ring(9, (a, i) => part(box(0.4, 0.4, 0.4), '#f4f1ea', { p: [-2.6 + i * 0.65, 3.6, 1.15] })),
        part(extrude([[-0.6, 0], [0.6, 0], [0.6, 1], [0, 1.6], [-0.6, 1]], 0.2), '#3a3f47', { p: [0, 0.85, 1.32] }),
        tower(-2.6, 0.8, 0.6, 4.2), tower(2.6, 0.8, 0.6, 4.2), tower(-1.4, -0.6, 0.7, 5.6), tower(1.4, -0.6, 0.7, 5.6), tower(0, -0.2, 0.95, 7.2)),
      moving: [
        ...[['#ffd23f', -2.5, 10.4], ['#ff5d8f', 2.3, 11], ['#7cf0ff', 0.3, 12.2], ['#b28dff', -1.2, 9.8]].map(([c, x, y], i) => ({ geo: burst(c), pivot: [x, y, -0.5], anim: (t) => {
          const f = cyc(t, 3.2, i * 0.27);
          return { s: f < 0.08 ? 0 : easeOut(win(f, 0.08, 0.45)) * 2 * (f > 0.7 ? 1 - win(f, 0.7, 0.95) : 1), y: -win(f, 0.3, 0.95) * 1.2, ry: f * 1.5 };
        } })),
        { geo: part(extrude([[0, 0], [1.2, 0.3], [0, 0.6]], 0.04), '#e31837'), pivot: [0, 11.15, -0.2], anim: (t) => ({ ry: Math.sin(t * 2.4) * 0.4, sx: 1 + Math.sin(t * 6) * 0.1 }) },
      ],
    };
  } },

  // McDonald's: the system that serves billions. Ingredients drop into place under the golden
  // arches and the burger assembles itself, again and again.
  mcdonalds: { finder: '#ffbc0d', build: () => {
    const arch = (x) => tube(Array.from({ length: 13 }, (_, i) => { const u = i / 12; return [x + (u - 0.5) * 3.2, 0.6 + 6.4 * (1 - (2 * u - 1) ** 2) ** 0.75, -1.2]; }), 0.42);
    const stack = [['bun', '#e2a65a', 0.55], ['patty', '#5a3420', 0.5], ['cheese', '#ffc83d', 0.12], ['lettuce', '#5fae45', 0.18], ['patty', '#5a3420', 0.5], ['top', '#e8a84e', 1.2]];
    let y = 0.9;
    const layers = stack.map(([kind, c, h]) => { const at = y; y += h; return { kind, c, h, at }; });
    const geoOf = ({ kind, c, h }) => kind === 'top' ? merge(part(new THREE.SphereGeometry(1.75, 32, 16, 0, TAU, 0, Math.PI / 2), c, { s: [1, h / 1.75, 1] }), ring(10, (a, i) => part(ball(0.08), '#fdf3dc', { p: [Math.cos(a) * (0.5 + (i % 3) * 0.35), h * (0.95 - (i % 3) * 0.12), Math.sin(a) * (0.5 + (i % 3) * 0.35)], s: [1.6, 0.6, 1] })))
      : kind === 'cheese' ? part(box(3.3, h, 3.3), c, { p: [0, h / 2, 0], r: [0, Math.PI / 4, 0] }) : kind === 'lettuce' ? part(cyl(1.95, 1.9, h, 14), c, { p: [0, h / 2, 0] }) : part(cyl(1.75, 1.75, h, 40), c, { p: [0, h / 2, 0] });
    return {
      bare: true, move: () => ({}),
      geo: merge(part(cyl(4.6, 4.8, 0.5, 56), '#da291c', { p: [0, 0.25, 0] }), part(cyl(4.62, 4.62, 0.06, 56), '#ffbc0d', { p: [0, 0.5, 0] }), part(arch(-1.6), '#ffbc0d'), part(arch(1.6), '#ffbc0d'),
        part(rbox(1.2, 1.3, 0.9, 0.15), '#da291c', { p: [3.3, 1.15, 1.6] }), ring(9, (a, i) => part(box(0.16, 1.2, 0.16), '#ffc83d', { p: [2.95 + (i % 5) * 0.18, 2, 1.45 + Math.floor(i / 5) * 0.3], r: [0, 0, (i % 3 - 1) * 0.12] }))),
      moving: layers.map((l, i) => ({ geo: geoOf(l), pivot: [0, l.at, 1], anim: (t) => {
        const f = cyc(t, 5), d = win(f, 0.05 + i * 0.1, 0.13 + i * 0.1);
        return { y: (1 - easeIn(d)) * 6, s: d > 0 ? (f > 0.88 ? 1 - easeIn(win(f, 0.88, 0.97)) : 1) : 0, sy: 1 - bump(f, 0.13 + i * 0.1, 0.012) * 0.25, ry: (1 - d) * 1.5 };
      } })),
    };
  } },
};
