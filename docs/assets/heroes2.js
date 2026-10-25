// The second batch of signature models: well-known companies that sat on shapes shared by only
// a few companies. Same contract as src/heroes.js ({ finder, build } → { bare: true, ... }), and
// they reuse the set dressing from heroes.js and scenes.js.
import { THREE, V, part, windy, rand, taper, leafShape, shade, tuft, merge, place, box, cyl, lathe, tube, ball, capsule, cone, torus, extrude, prism, star, beam, ring, hi, TAU, clamp01, cyc, win, easeIn, easeOut, easeIO, back, bump, hop, life, K } from './kit.js';
import { rbox, curve, tubeOn, along, parcel, flameGeo, puff, miniTree, lampPost, sedan, cartGeo, walker } from './heroes.js';
import { y0, slab, coin, home, house2, truss, frame, tyre, bin, gear, reach2, stormCloud, bolt, shieldGeo, van, fan, humanoid, bottle, bubbleGeo, lifebuoy, parasol, trawler, tubeGeo, tickGeo, heartGeo, bed, pylon, drone, cardGeo, racking, medBox, column, tankTruck, rocketGeo, radarDish, heliGeo, rotorGeo, vial, molecule, crossGeo, padBody, padShackle, wafer, chipGeo, desk, serverRack, helixGeo, whiteboard, jet, appBlock, bugGeo, fighter, semi } from './scenes.js';

// ---------- small helpers for this batch ----------
const ground = (c) => part(rbox(10.4, 0.24, 10.4, 0.08), c, { p: [0, 0.12, 0] });
const trees = (R, pts, s0 = 0.6) => pts.map(([x, z, s]) => miniTree(R, x, y0, z, s ?? s0 + R() * 0.2));
// A blocky pixel font (5 rows) for signs and labels: pixText(str, px, colour, depth) is centred on
// the origin in the xy plane, facing +z.
const FONT = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'], D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'], G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'], J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'], M: ['10001', '11011', '10101', '10001', '10001'], N: ['1001', '1101', '1011', '1001', '1001'], O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'], Q: ['010', '101', '101', '110', '011'], R: ['110', '101', '110', '101', '101'], S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'], W: ['10001', '10001', '10101', '11011', '10001'], X: ['101', '101', '010', '101', '101'], Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'], 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['110', '001', '010', '100', '111'], 3: ['110', '001', '010', '001', '110'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '110', '001', '110'], 6: ['011', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '110'], $: ['011', '110', '010', '011', '110'], '.': ['0', '0', '0', '0', '1'], '%': ['101', '001', '010', '100', '101'], '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000'], ' ': ['00', '00', '00', '00', '00'], '!': ['1', '1', '1', '0', '1'], '?': ['110', '001', '010', '000', '010'], '&': ['010', '101', '010', '101', '011'], "'": ['1', '1', '0', '0', '0'],
};
const pixText = (str, px, color, d = 0.06) => {
  const cols = [...str].map((ch) => FONT[ch] || FONT[' ']), W = cols.reduce((a, g) => a + g[0].length + 1, -1), g = [], cube = new THREE.BoxGeometry(px * 0.92, px * 0.92, d);
  let x0 = -W / 2;
  cols.forEach((gl) => { gl.forEach((row, r) => [...row].forEach((b, c) => { if (b === '1') g.push(cube.clone().translate((x0 + c + 0.5) * px, (2 - r) * px, 0)); })); x0 += gl[0].length + 1; });
  return part(merge(g), color);
};
// A part that rides along a curve over [a, b] of a cycle (hidden otherwise), fading in and out.
const rider = (geo, path, P, off = 0, a = 0, b = 1, extra = () => ({})) => ({ geo, pivot: [0, 0, 0], anim: (t) => {
  const f = cyc(t, P, off); if (f < a || f > b) return { s: 0.001 };
  const u = win(f, a, b), p = path.getPointAt(u), d = path.getTangentAt(u);
  return { x: p.x, y: p.y, z: p.z, ry: Math.atan2(-d.z, d.x), s: Math.min(1, u / 0.06, (1 - u) / 0.06) + 0.001, ...extra(t, u) };
} });
// A flat ring that swells and fades at (x, y, z) once per cycle, around phase `at`.
const pulse = (x, y, z, c, P, at = 0, r = 0.5) => ({ geo: part(torus(r, 0.04, TAU, 32), c, { r: [Math.PI / 2, 0, 0] }), pivot: [x, y, z], anim: (t) => { const k = cyc(t - at * P, P); return k < 0.25 ? { s: 0.5 + k * 5 } : { s: 0.001 }; } });
// A simple office/apartment block w × h × d on y = 0 with window bands, facing +z and +x.
const block = (w, h, d, wall = '#e9edf1', glass = '#6f8fb0', step = 0.32) => {
  const g = [part(rbox(w, h, d, 0.04), wall, { p: [0, h / 2, 0] })];
  for (let y = 0.22; y < h - 0.15; y += step) g.push(part(new THREE.BoxGeometry(w + 0.02, step * 0.42, d + 0.02), glass, { p: [0, y, 0] }));
  return merge(g);
};

export const HEROES2 = {
  // Citigroup: the bank that is already everywhere. Money for the world's companies crosses its
  // own network: a turning globe in the plaza of the slant-topped Citigroup Center sends payments
  // out along glowing arcs to five financial cities and takes theirs back, round the clock.
  citigroup: { finder: '#056dae', build: () => {
    const R = rand(101), out = [], BLUE = '#056dae', NAVY = '#003b70', RED = '#e31837';
    out.push(ground('#8cc56c'), part(cyl(2.5, 2.5, 0.04, 48), '#e8e3d8', { p: [0.4, y0 + 0.02, -0.4] }), part(torus(2.5, 0.05, TAU, 64), '#cfc8ba', { p: [0.4, y0 + 0.04, -0.4], r: [Math.PI / 2, 0, 0] }));
    // ---- the Citigroup Center: a tower on four stilts and a core, with its 45° crown
    const TX = -3.3, TZ = -3.3, W = 1.7, LEG = 0.9, H = 4.3, top = y0 + LEG + H;
    [[W / 2 - 0.15, 0], [-W / 2 + 0.15, 0], [0, W / 2 - 0.15], [0, -W / 2 + 0.15]].forEach(([dx, dz]) => out.push(part(box(0.3, LEG, 0.3), '#d4d8dd', { p: [TX + dx, y0 + LEG / 2, TZ + dz] })));
    out.push(part(cyl(0.32, 0.32, LEG, 20), '#bfc5cc', { p: [TX, y0 + LEG / 2, TZ] }), part(box(W, H, W), '#e4e7eb', { p: [TX, y0 + LEG + H / 2, TZ] }));
    for (let y = y0 + LEG + 0.15; y < top - 0.1; y += 0.2) out.push(part(new THREE.BoxGeometry(W + 0.02, 0.09, W + 0.02), '#5b7fa6', { p: [TX, y, TZ] }));
    out.push(part(extrude([[-W / 2, 0], [W / 2, 0], [W / 2, 1.1]], W), '#d9dde2', { p: [TX, top, TZ], r: [0, Math.PI / 2, 0] }));
    out.push(part(rbox(1.0, 0.3, 0.06, 0.03), NAVY, { p: [TX + 0.3, y0 + LEG + 0.5, TZ + W / 2 + 0.04] }), pixText('CITI', 0.045, K.white, 0.02).translate(TX + 0.3, y0 + LEG + 0.5, TZ + W / 2 + 0.08));
    // ---- the monument sign: the wordmark under its red arc
    const SX = -3.7, SZ = 3.5;
    out.push(part(rbox(2.0, 0.5, 0.4, 0.06), '#d6d0c4', { p: [SX, y0 + 0.25, SZ], r: [0, Math.PI / 6, 0] }));
    const sign = merge(part(rbox(1.9, 0.75, 0.16, 0.06), K.white, { p: [0, 0.4, 0] }), pixText('CITI', 0.11, BLUE, 0.06).translate(0, 0.33, 0.1), part(torus(0.5, 0.045, Math.PI * 0.8, 24), RED, { p: [0.12, 0.42, 0.1], r: [0, 0, Math.PI * 0.1] }));
    out.push(place(sign, { p: [SX, y0 + 0.5, SZ], r: [0, Math.PI / 6, 0] }));
    // ---- the globe's stand: base, stem and a blue meridian arc
    const GX = 0.4, GZ = -0.4, GR = 1.35, GY = y0 + 2.35;
    out.push(part(cyl(0.9, 1.0, 0.3, 32), NAVY, { p: [GX, y0 + 0.15, GZ] }), part(cyl(0.18, 0.28, 0.75, 16), '#c9ced6', { p: [GX, y0 + 0.65, GZ] }), part(torus(GR + 0.18, 0.06, Math.PI * 1.25, 48), BLUE, { p: [GX, GY, GZ], r: [0, Math.PI / 4, Math.PI * 0.9] }));
    // ---- five financial cities round the edge, each with its own colours
    const cities = [[3.6, -3.6, '#e5533d'], [4.0, 0.5, '#f2c94c'], [2.4, 3.8, '#2f9e6e'], [-0.9, 4.0, '#8a6cf0'], [-4.0, 0.7, '#f29a3a']];
    cities.forEach(([cx, cz, c], i) => {
      out.push(part(cyl(0.85, 0.9, 0.12, 28), '#c9d1da', { p: [cx, y0 + 0.06, cz] }));
      [[-0.32, -0.28, 1.7], [0.3, -0.25, 1.15], [-0.25, 0.33, 0.8], [0.33, 0.33, 1.3]].forEach(([dx, dz, h], k) => out.push(place(block(0.48, h, 0.48, k ? '#eef1f4' : '#dfe5ec', k % 2 ? '#7d9cbc' : '#5f80a3', 0.26), { p: [cx + dx, y0 + 0.12, cz + dz] })));
      out.push(part(box(0.5, 0.06, 0.5), c, { p: [cx - 0.32, y0 + 1.85, cz - 0.28] }), part(cyl(0.02, 0.02, 0.6, 8), '#7b828c', { p: [cx - 0.32, y0 + 2.15, cz - 0.28] }), part(box(0.34, 0.22, 0.02), c, { p: [cx - 0.15, y0 + 2.33, cz - 0.28] }));
    });
    trees(R, [[-1.6, -4.5], [1.4, -4.6], [-4.6, -1.4], [4.6, -2.0], [0.9, 4.6], [4.6, 2.4], [-2.4, 2.3]]);
    // ---- moving parts
    const moving = [], P = 6;
    // The globe: blue oceans, green continents, white caps, turning.
    const land = (x, y, z) => { const u = x / GR, v = y / GR, w = z / GR; if (Math.abs(v) > 0.88) return '#f4f6f8'; const n = Math.sin(u * 4.1 + 1.3) + Math.sin(v * 3.7 + u * 2.1) + Math.sin(w * 4.3 - v * 1.7); return n > 0.6 ? (n > 1.4 ? '#5fae5b' : '#7cc46a') : '#3b8fd9'; };
    moving.push({ geo: part(new THREE.SphereGeometry(GR, hi() ? 56 : 18, hi() ? 36 : 12), land), pivot: [GX, GY, GZ], anim: (t) => ({ ry: t * 0.25 }) });
    // Payments out to each city and back home along glowing arcs.
    const goldC = place(coin(0.2, 0.07), { r: [Math.PI / 2, 0, 0] }), blueC = merge(part(cyl(0.2, 0.2, 0.07, 24), BLUE, { r: [Math.PI / 2, 0, 0] }), part(cyl(0.12, 0.12, 0.075, 20), K.white, { r: [Math.PI / 2, 0, 0] }));
    cities.forEach(([cx, cz, c], i) => {
      const dx = cx - GX, dz = cz - GZ, L = Math.hypot(dx, dz), sx = GX + (dx / L) * (GR * 0.8), sz = GZ + (dz / L) * (GR * 0.8);
      const arc = curve([[sx, GY + 0.75, sz], [(sx + cx) / 2, GY + 1.5, (sz + cz) / 2], [cx - 0.1, y0 + 2.0, cz - 0.1]]);
      out.push(part(tubeOn(arc, 0.025, hi() ? 48 : 12), '#a8d4ff'));
      const back = curve(arc.points.slice().reverse().map((p) => p.toArray()));
      moving.push(rider(goldC, arc, P, i / 5, 0, 0.5, (t) => ({ ry: t * 5 })), rider(blueC, back, P, i / 5 + 0.5, 0, 0.5, (t) => ({ ry: t * 5 })));
      moving.push(pulse(cx, y0 + 0.14, cz, c, P, -i / 5 + 0.5, 0.7));
    });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Morgan Stanley: the firm families trust with their savings. Money from the homes round the
  // edge passes the advisor's desk and lands in the clients' portfolio, whose columns of gold keep
  // compounding; the ticker on the Broadway tower never stops.
  morganstanley: { finder: '#002d72', build: () => {
    const R = rand(102), out = [], NAVY = '#002d72', SKY = '#6cace4';
    out.push(ground('#93c873'));
    // ---- the tower on Broadway: dark glass, mullions, and the LED ticker bands
    const TX = -3.3, TZ = -3.3, W = 2.0, H = 5.9;
    out.push(part(rbox(W, H, W, 0.05), '#2d4a6b', { p: [TX, y0 + H / 2, TZ] }));
    for (let k = 0; k < 7; k++) { const o = -W / 2 + 0.15 + k * ((W - 0.3) / 6); out.push(part(new THREE.BoxGeometry(0.04, H - 0.1, 0.03), '#8fa6bf', { p: [TX + o, y0 + H / 2, TZ + W / 2 + 0.01] }), part(new THREE.BoxGeometry(0.03, H - 0.1, 0.04), '#8fa6bf', { p: [TX + W / 2 + 0.01, y0 + H / 2, TZ + o] })); }
    [1.0, 1.6, 2.2].forEach((y, i) => out.push(part(new THREE.BoxGeometry(W + 0.06, 0.34, W + 0.06), i === 1 ? '#0b1a2e' : NAVY, { p: [TX, y0 + y, TZ] })));
    out.push(part(box(W + 0.1, 0.25, W + 0.1), '#1d3557', { p: [TX, y0 + H, TZ] }), part(rbox(1.5, 0.28, 0.04, 0.03), K.white, { p: [TX, y0 + 3.0, TZ + W / 2 + 0.04] }), pixText('MS', 0.05, NAVY, 0.02).translate(TX, y0 + 3.0, TZ + W / 2 + 0.07));
    // ---- the portfolio: a plinth with five columns of gold, rising left to right
    const BZ = -1.6, bars = [0, 1, 2, 3, 4].map((k) => [-1.0 + k * 0.7, 1.0 + k * 0.42]);
    out.push(part(rbox(3.9, 0.16, 1.0, 0.05), NAVY, { p: [0.4, y0 + 0.08, BZ] }), part(box(3.92, 0.04, 1.02), SKY, { p: [0.4, y0 + 0.17, BZ] }));
    // ---- the advisor's desk in the middle: advisor and client across a table, a screen between
    const DX = 0.9, DZ = 1.1;
    out.push(part(rbox(1.6, 0.06, 0.9, 0.03), K.wood, { p: [DX, y0 + 0.74, DZ] }), [[-0.7, -0.38], [0.7, -0.38], [-0.7, 0.38], [0.7, 0.38]].map(([x, z]) => part(box(0.05, 0.72, 0.05), K.dark, { p: [DX + x, y0 + 0.36, DZ + z] })));
    out.push(part(rbox(0.6, 0.38, 0.04, 0.02), '#1d1f24', { p: [DX, y0 + 1.0, DZ], r: [0, Math.PI / 4, 0] }), part(box(0.5, 0.3, 0.01), SKY, { p: [DX + 0.02, y0 + 1.0, DZ + 0.02], r: [0, Math.PI / 4, 0] }));
    out.push(place(fan(NAVY), { p: [DX - 0.55, y0, DZ - 0.6], s: 1.3 }), place(fan('#d6336c', '#c58c66'), { p: [DX + 0.55, y0, DZ + 0.6], s: 1.3 }));
    out.push(part(rbox(2.6, 0.04, 2.0, 0.02), '#d9cdb8', { p: [DX, y0 + 0.02, DZ] }));
    // ---- the families' homes round the front and right, with their paths
    const homes = [[4.0, -1.2, Math.PI / 2], [4.1, 1.9, Math.PI / 2], [2.4, 4.1, 0], [-0.9, 4.1, 0], [-3.9, 3.4, 0]];
    homes.forEach(([x, z, ry], i) => out.push(place(home(['#fbf3e3', '#f1e2c6', '#e8eef4', '#f6e7e1', '#eef3e6'][i], ['#8a5a36', '#5b6b7d', '#a35a3c', '#3f6f8f', '#6f4a2c'][i], 1.4, 1.2, 0.95), { p: [x, y0, z], r: [0, ry, 0] })));
    trees(R, [[-1.6, -4.6], [1.8, -4.6], [4.6, -4.4], [-4.6, -0.5], [-2.4, 1.6], [4.7, 4.6]]);
    // ---- moving parts
    const moving = [], P = 12;
    // The columns compound: each grows through the cycle and settles back for the next year.
    bars.forEach(([x, h], k) => moving.push({ geo: part(new THREE.CylinderGeometry(0.27, 0.27, h, hi() ? 28 : 12, hi() ? Math.round(h * 12) : 1), (X, Y) => (Math.floor((Y + h / 2) * 12) % 2 ? '#e9b949' : '#f6d66e'), { p: [0, h / 2, 0] }),
      pivot: [x, y0 + 0.19, BZ], anim: (t) => { const f = cyc(t, P); return { sy: 0.55 + 0.45 * easeOut(win(f, 0, 0.9)) - 0.45 * easeIO(win(f, 0.92, 1)) }; } }));
    // Savings from each home: to the advisor's desk, then on into a column.
    const coinG = place(coin(0.2, 0.07), { r: [Math.PI / 2, 0, 0] });
    homes.forEach(([x, z], i) => {
      const [bx, h] = bars[i], path = curve([[x, y0 + 1.1, z], [(x + DX) / 2, y0 + 2.2, (z + DZ) / 2], [DX, y0 + 1.5, DZ], [(DX + bx) / 2, y0 + 3.2, (DZ + BZ) / 2], [bx, y0 + h + 0.5, BZ]]);
      moving.push(rider(coinG, path, P / 2, i / 5, 0, 0.8, (t) => ({ ry: t * 4 })));
    });
    // The ticker crawling round the middle band.
    for (let k = 0; k < 8; k++) moving.push({ geo: part(new THREE.BoxGeometry(0.22, 0.12, 0.02), k % 3 ? '#62d35f' : '#ff6b5b'), pivot: [0, y0 + 1.6, 0], anim: (t) => { const u = cyc(t, 6, k / 8) * 2; return u < 1 ? { x: TX - W / 2 + u * W, z: TZ + W / 2 + 0.05 } : { x: TX + W / 2 + 0.05, z: TZ + W / 2 - (u - 1) * W, ry: Math.PI / 2 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Capital One: a bank run as a data company, now with its own payments network. The servers in
  // the cloud score every card in the middle; payments race round the network loop it owns, from
  // the shop and the café to the gas station and the home office.
  capitalone: { finder: '#004977', build: () => {
    const R = rand(103), out = [], NAVY = '#004977', RED = '#d03027';
    out.push(ground('#8fc66f'));
    // ---- the network loop and its four stops
    const CX = 0.5, CZ = 0.5, RR = 3.25;
    out.push(part(torus(RR, 0.12, TAU, 96), '#2b3440', { p: [CX, y0 + 0.06, CZ], r: [Math.PI / 2, 0, 0], s: [1, 1, 0.5] }), part(torus(RR, 0.05, TAU, 96), RED, { p: [CX, y0 + 0.13, CZ], r: [Math.PI / 2, 0, 0] }));
    const at = (a, r = RR + 0.9) => [CX + Math.cos(a) * r, CZ + Math.sin(a) * r];
    const stops = [-0.55, 0.75, 1.95, 3.15];
    // A shop with an awning, a café, a gas station and a home office.
    { const [x, z] = at(stops[0]); out.push(place(block(1.4, 1.1, 1.0, '#f4efe6', '#7aa6c8', 0.5), { p: [x, y0, z] }), ...[0, 1, 2, 3].map((i) => part(box(0.35, 0.05, 0.4), i % 2 ? K.white : '#2f9e6e', { p: [x - 0.52 + i * 0.35, y0 + 1.15, z + 0.62], r: [0.4, 0, 0] }))); }
    { const [x, z] = at(stops[1]); out.push(part(rbox(1.3, 1.0, 1.1, 0.05), '#f6efe2', { p: [x, y0 + 0.5, z] }), part(rbox(1.36, 0.16, 1.16, 0.04), NAVY, { p: [x, y0 + 1.05, z] }), part(box(0.8, 0.5, 0.04), '#8fb9d8', { p: [x, y0 + 0.5, z + 0.56] }), part(cyl(0.3, 0.3, 0.05, 20), K.white, { p: [x + 0.9, y0 + 0.62, z + 0.2] }), part(cyl(0.03, 0.03, 0.6, 8), K.dark, { p: [x + 0.9, y0 + 0.3, z + 0.2] })); }
    { const [x, z] = at(stops[2]); out.push(part(rbox(1.6, 0.1, 1.1, 0.03), RED, { p: [x, y0 + 1.5, z] }), [-0.6, 0.6].map((dx) => part(cyl(0.06, 0.06, 1.5, 10), K.white, { p: [x + dx, y0 + 0.75, z] })), part(rbox(0.3, 0.7, 0.3, 0.05), '#e9ecef', { p: [x, y0 + 0.35, z] }), part(box(0.2, 0.15, 0.02), '#2b3440', { p: [x, y0 + 0.5, z + 0.16] })); }
    { const [x, z] = at(stops[3]); out.push(place(home('#eef3e6', '#5b6b7d', 1.4, 1.2, 0.95), { p: [x, y0, z], r: [0, Math.PI / 2, 0] })); }
    // ---- the cloud and its servers, back left
    [[-4.3, -2.4], [-4.3, -3.4], [-3.3, -4.3], [-2.3, -4.3]].forEach(([x, z], i) => out.push(place(serverRack(2.0, RED), { p: [x, y0, z], r: [0, i < 2 ? Math.PI / 2 : 0, 0] })));
    out.push(part(rbox(3.4, 0.08, 3.4, 0.03), '#c9ced6', { p: [-3.4, y0 + 0.04, -3.4] }));
    [[-3.6, 4.0, -3.6, 0.75], [-2.8, 3.8, -3.9, 0.6], [-4.2, 3.7, -2.8, 0.6], [-3.1, 4.4, -3.0, 0.55]].forEach(([x, y, z, r]) => out.push(part(new THREE.SphereGeometry(r, hi() ? 20 : 8, hi() ? 14 : 6), '#f4f7fb', { p: [x, y0 + y - 0.5, z] })));
    // ---- the centre: a plinth for the card
    out.push(part(cyl(0.9, 1.0, 0.3, 32), '#2b3440', { p: [CX, y0 + 0.15, CZ] }), part(cyl(0.18, 0.18, 0.6, 16), '#c9ced6', { p: [CX, y0 + 0.6, CZ] }));
    trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, -4.6], [0.6, -4.6]]);
    // ---- moving parts
    const moving = [];
    // The card, turning to show its face.
    const card = merge(part(rbox(2.6, 1.65, 0.1, 0.16), NAVY), part(torus(1.0, 0.07, Math.PI * 0.75, 32), RED, { p: [-0.2, -0.35, 0.06], r: [0, 0, Math.PI * 0.15] }),
      part(rbox(0.42, 0.32, 0.03, 0.05), K.gold, { p: [-0.75, 0.15, 0.06] }), part(box(0.38, 0.01, 0.035), K.goldDk, { p: [-0.75, 0.15, 0.08] }), pixText('1234 5678', 0.04, K.white, 0.02).translate(0.2, -0.4, 0.06), part(box(2.6, 0.3, 0.02), '#1d1f24', { p: [0, 0.35, -0.06] }));
    moving.push({ geo: card, pivot: [CX, y0 + 1.75, CZ], anim: (t) => ({ ry: Math.PI / 4 + Math.sin(t * 0.7) * 0.6, y: Math.sin(t * 1.4) * 0.06 }) });
    // Data from the servers to the card: little blue packets.
    const feed = curve([[-3.4, y0 + 2.4, -3.0], [-1.8, y0 + 3.0, -1.4], [CX - 0.3, y0 + 2.6, CZ - 0.3]]);
    for (let k = 0; k < 6; k++) moving.push(rider(part(new THREE.BoxGeometry(0.14, 0.14, 0.14), k % 2 ? '#6cc3ff' : K.white), feed, 3, k / 6, 0, 1, (t) => ({ rx: t * 3 })));
    // Payments racing round the loop, each stop flashing as one passes.
    const loop = curve(Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * TAU; return [CX + Math.cos(a) * RR, y0 + 0.3, CZ + Math.sin(a) * RR]; }), true);
    for (let k = 0; k < 6; k++) moving.push({ geo: merge(part(new THREE.SphereGeometry(0.16, 14, 10), RED), part(torus(0.2, 0.03, TAU, 16), K.white, { r: [Math.PI / 2, 0, 0] })), pivot: [0, 0, 0], anim: (t) => { const p = loop.getPointAt(cyc(t, 9, k / 6)); return { x: p.x, y: p.y, z: p.z }; } });
    stops.forEach((a, i) => { const [x, z] = at(a, RR); moving.push(pulse(x, y0 + 0.16, z, '#ffd479', 1.5, i * 0.2, 0.35)); });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
};
