// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Janelle Ghanem. QR Compass, https://ghanemja.github.io/qr/
// The second batch of signature models: well-known companies that sat on shapes shared by only
// a few companies. Same contract as src/heroes.js ({ finder, build } → { bare: true, ... }), and
// they reuse the set dressing from heroes.js and scenes.js.
import { THREE, V, part, windy, rand, taper, leafShape, shade, tuft, merge, place, box, cyl, lathe, tube, ball, capsule, cone, torus, extrude, prism, star, beam, ring, hi, TAU, clamp01, cyc, win, easeIn, easeOut, easeIO, back, bump, hop, life, K } from './kit.js';
import { rbox, curve, tubeOn, along, parcel, flameGeo, puff, miniTree, lampPost, sedan, cartGeo, walker } from './heroes.js';
import { y0, slab, coin, home, house2, truss, frame, tyre, bin, gear, reach2, stormCloud, bolt, shieldGeo, van, fan, humanoid, bottle, bubbleGeo, lifebuoy, parasol, trawler, tubeGeo, tickGeo, heartGeo, bed, pylon, drone, cardGeo, racking, medBox, column, tankTruck, rocketGeo, radarDish, heliGeo, rotorGeo, vial, molecule, crossGeo, padBody, padShackle, wafer, chipGeo, desk, serverRack, helixGeo, whiteboard, jet, appBlock, bugGeo, fighter, semi } from './scenes.js';

// ---------- small helpers for this batch ----------
const ground = (c) => part(rbox(10.4, 0.24, 10.4, 0.08), c, { p: [0, 0.12, 0] });
// (kept 0.75 in from the edge so their leaves stay on the board)
const trees = (R, pts, s0 = 0.6) => pts.map(([x, z, s]) => miniTree(R, Math.max(-4.45, Math.min(4.45, x)), y0, Math.max(-4.45, Math.min(4.45, z)), s ?? s0 + R() * 0.2));
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
    out.push(trees(R, [[-1.6, -4.5], [1.4, -4.6], [-4.6, -1.4], [4.6, -2.0], [0.9, 4.6], [4.6, 2.4], [-2.4, 2.3]]));
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
    out.push(trees(R, [[-1.6, -4.6], [1.8, -4.6], [4.6, -4.4], [-4.6, -0.5], [-2.4, 1.6], [4.7, 4.6]]));
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
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, -4.6], [0.6, -4.6]]));
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
  // U.S. Bancorp: deposits from Main Street, loans back to it. Shops along the street take card
  // payments on their terminals and bank the takings in the columned branch; the bank lends them
  // out, and across the road a family's house goes up.
  usbancorp: { finder: '#0c2074', build: () => {
    const R = rand(104), out = [], NAVY = '#0c2074', RED = '#d52b1e';
    out.push(ground('#90c46e'), part(box(10.4, 0.03, 1.5), '#5b616b', { p: [0, y0 + 0.015, -0.6] }), part(box(10.4, 0.05, 0.4), '#d8d4ca', { p: [0, y0 + 0.025, -1.55] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.6, 0.01, 0.06), '#f2c94c', { p: [-4.6 + i * 1.3, y0 + 0.035, -0.6] }));
    // ---- the branch: steps, columns, a pediment and the frieze with its name
    const BX = -2.6, BZ = -3.4;
    out.push(part(rbox(3.6, 0.3, 0.6, 0.04), '#e6e1d6', { p: [BX, y0 + 0.15, BZ + 1.55] }), part(rbox(3.8, 0.15, 0.85, 0.04), '#e6e1d6', { p: [BX, y0 + 0.07, BZ + 1.6] }));
    out.push(part(rbox(3.4, 2.4, 2.4, 0.05), '#efe9dc', { p: [BX, y0 + 1.5, BZ] }), part(rbox(1.0, 1.4, 0.06, 0.03), '#5b4a3a', { p: [BX, y0 + 1.0, BZ + 1.23] }));
    for (let i = 0; i < 6; i++) out.push(part(cyl(0.13, 0.15, 2.0, 20), K.white, { p: [BX - 1.5 + i * 0.6, y0 + 1.3, BZ + 1.45] }));
    out.push(part(rbox(3.6, 0.4, 0.4, 0.04), NAVY, { p: [BX, y0 + 2.5, BZ + 1.4] }), pixText('US BANK', 0.06, K.white, 0.03).translate(BX, y0 + 2.5, BZ + 1.61));
    out.push(part(prism(3.7, 0.8, 2.7), '#efe9dc', { p: [BX, y0 + 2.7, BZ + 0.1] }), part(prism(3.4, 0.62, 0.1), '#e2dccd', { p: [BX, y0 + 2.75, BZ + 1.43], r: [0, 0, 0] }));
    // The flag beside it.
    out.push(part(cyl(0.04, 0.05, 4.4, 10), '#c9ced6', { p: [-4.6, y0 + 2.2, -2.0] }), part(box(0.9, 0.55, 0.02), (x, y) => (y > y0 + 4.05 && x < -4.15 + 0.0 ? '#3c3b6e' : Math.floor((y - y0) * 13) % 2 ? RED : K.white), { p: [-4.1, y0 + 4.1, -2.0] }));
    // ---- the shops along the street, each with its card terminal
    const shops = [[0.6, '#e5533d'], [2.1, '#2f9e6e'], [3.6, '#f29a3a']];
    shops.forEach(([x, c]) => {
      out.push(part(rbox(1.3, 1.5, 1.6, 0.05), '#f4efe6', { p: [x, y0 + 0.75, -3.6] }), part(box(1.0, 0.7, 0.04), '#9cc3e0', { p: [x, y0 + 0.6, -2.79] }), [0, 1, 2].map((i) => part(box(0.43, 0.05, 0.4), i % 2 ? K.white : c, { p: [x - 0.43 + i * 0.43, y0 + 1.25, -2.62], r: [0.45, 0, 0] })));
      out.push(part(rbox(0.5, 0.6, 0.3, 0.04), '#8a5a36', { p: [x + 0.35, y0 + 0.3, -2.45] }), part(rbox(0.16, 0.24, 0.1, 0.03), '#2b2f36', { p: [x + 0.35, y0 + 0.72, -2.45], r: [-0.4, 0, 0] }));
    });
    // ---- the family's plot across the road: the frame going up
    const HX = 1.6, HZ = 2.6;
    out.push(part(box(3.6, 0.03, 2.9), '#7fb35a', { p: [HX, y0 + 0.015, HZ] }), part(box(0.8, 0.03, 1.2), '#d8d4ca', { p: [HX - 0.1, y0 + 0.03, HZ + 1.5] }));
    out.push(trees(R, [[-4.6, 1.4], [-4.4, 4.4], [4.7, 0.9], [4.6, 4.6], [-1.6, 3.2]]));
    out.push(place(home('#eef3e6', '#5b6b7d', 1.5, 1.3, 1.0), { p: [-3.0, y0, 2.8] }));
    // ---- moving parts
    const moving = [], P = 10;
    // Takings from each shop into the bank.
    const coinG = place(coin(0.2, 0.07), { r: [Math.PI / 2, 0, 0] });
    shops.forEach(([x], i) => {
      moving.push(pulse(x + 0.35, y0 + 0.88, -2.45, '#62d35f', P / 3, i / 9, 0.18));
      const path = curve([[x + 0.35, y0 + 1.0, -2.45], [(x + BX) / 2 + 0.5, y0 + 2.6, -1.9], [BX + 0.6, y0 + 1.2, BZ + 1.7], [BX, y0 + 0.9, BZ + 1.3]]);
      moving.push(rider(coinG, path, P / 3, i / 9 + 0.05, 0, 0.6, (t) => ({ ry: t * 4 })));
    });
    // The loan going out across the road to the plot.
    const loan = curve([[BX + 0.6, y0 + 1.2, BZ + 1.7], [BX + 1.5, y0 + 3.0, 0.0], [HX - 0.4, y0 + 2.6, HZ - 0.4], [HX, y0 + 1.2, HZ]]);
    moving.push(rider(merge(part(rbox(0.6, 0.3, 0.06, 0.03), '#7cbf7d'), part(cyl(0.08, 0.08, 0.065, 12), '#4f9258', { r: [Math.PI / 2, 0, 0] })), loan, P, 0, 0.05, 0.3, (t) => ({ rx: 0.2 })));
    // The house: frame first, then the finished home rises out of it.
    moving.push({ geo: frame(2.2, 1.8, 1.6), pivot: [HX, y0, HZ], anim: (t) => { const f = cyc(t, P); return { s: f < 0.6 ? 1 : 0.001 }; } });
    moving.push({ geo: house2('#fbf3e3', '#a35a3c', NAVY), pivot: [HX, y0, HZ], anim: (t) => { const f = cyc(t, P); return f < 0.55 ? { s: 0.001 } : { sy: easeOut(win(f, 0.55, 0.7)) * Math.min(1, (1 - f) / 0.04) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Moody's: no bond sells without a grade. Bonds from a city, a company and a country ride the
  // line under the press, come out stamped with their rating, and go on to the investors who
  // wait for it; the scale stands over everything.
  moodys: { finder: '#0a2f7a', build: () => {
    const R = rand(108), out = [], BLUE = '#0a2f7a';
    out.push(ground('#8fc66f'));
    // ---- the line along x, with the press in the middle
    const LZ = 0.6, slots = [3.8, 1.9, 0, -1.9, -3.8];
    out.push(part(rbox(9.4, 0.5, 1.0, 0.05), '#5b616b', { p: [0, y0 + 0.25, LZ] }), part(box(9.3, 0.04, 0.9), '#2b2f36', { p: [0, y0 + 0.52, LZ] }));
    if (hi()) for (let x = -4.5; x <= 4.5; x += 0.3) out.push(part(new THREE.CylinderGeometry(0.04, 0.04, 0.92, 8), '#9aa1a9', { p: [x, y0 + 0.5, LZ], r: [Math.PI / 2, 0, 0] }));
    [-0.75, 0.75].forEach((dx) => out.push(part(rbox(0.25, 2.6, 1.3, 0.04), BLUE, { p: [dx, y0 + 1.3, LZ] })));
    out.push(part(rbox(1.8, 0.5, 1.4, 0.05), BLUE, { p: [0, y0 + 2.75, LZ] }), place(pixText("MOODY'S", 0.05, K.white, 0.02), { p: [0, y0 + 2.75, LZ + 0.71] }));
    // ---- the issuers, behind the start of the line: a city hall, a company and a country's flag
    out.push(part(rbox(1.6, 1.0, 1.1, 0.04), '#efe9dc', { p: [1.5, y0 + 0.5, -2.6] }), part(cyl(0.3, 0.35, 0.3, 20), '#efe9dc', { p: [1.5, y0 + 1.15, -2.6] }), part(new THREE.SphereGeometry(0.34, 20, 10, 0, TAU, 0, Math.PI / 2), '#9fb7c9', { p: [1.5, y0 + 1.3, -2.6] }), [0, 1, 2, 3].map((i) => part(cyl(0.05, 0.05, 0.8, 8), K.white, { p: [1.05 + i * 0.3, y0 + 0.4, -1.98] })));
    out.push(place(block(1.3, 2.2, 1.1, '#e3e6ea', '#5b7fa6', 0.3), { p: [3.5, y0, -2.3] }), part(box(1.32, 0.3, 1.12), '#e5533d', { p: [3.5, y0 + 2.05, -2.3] }), part(cyl(0.04, 0.04, 2.6, 8), '#c9ced6', { p: [3.9, y0 + 1.3, -4.2] }), ['#2f9e6e', K.white, '#e5533d'].map((c, i) => part(box(0.27, 0.5, 0.02), c, { p: [4.13 + i * 0.27, y0 + 2.3, -4.2] })));
    out.push(part(rbox(1.2, 0.08, 0.35, 0.03), K.wood, { p: [2.6, y0 + 0.4, 3.0] }), [-0.5, 0.5].map((dx) => part(box(0.06, 0.4, 0.3), K.dark, { p: [2.6 + dx, y0 + 0.2, 3.0] })));
    // ---- the rating scale, back left: a board of grades with a pointer
    const SX = -3.4, SZ = -3.3, grades = [['AAA', '#2f9e6e'], ['AA', '#5fae5b'], ['A', '#9bc53d'], ['BAA', '#f2c94c'], ['BA', '#f29a3a'], ['B', '#e5533d']];
    out.push(part(rbox(2.2, 4.2, 0.25, 0.06), '#f4f5f6', { p: [SX, y0 + 2.3, SZ], r: [0, Math.PI / 4, 0] }), part(rbox(0.6, 0.2, 0.6, 0.04), '#c9ced6', { p: [SX, y0 + 0.1, SZ] }));
    grades.forEach(([g, c], i) => { const y = y0 + 3.9 - i * 0.62; out.push(place(merge(part(rbox(1.6, 0.48, 0.06, 0.04), c), pixText(g, 0.07, K.white, 0.03).translate(0, 0, 0.04)), { p: [SX + 0.1, y, SZ + 0.1], r: [0, Math.PI / 4, 0] })); });
    // ---- the investors, front left
    [[-3.4, 2.2, '#3d7be0'], [-2.7, 2.5, '#e5533d'], [-3.9, 2.9, '#2f9e6e'], [-3.1, 3.2, '#8a6cf0'], [-2.3, 3.1, '#f29a3a'], [-1.6, 2.4, '#d6336c'], [-2.0, 3.8, '#3fb8a8']].forEach(([x, z, c]) => out.push(place(fan(c), { p: [x, y0, z], s: 1.5 })));
    out.push(part(rbox(1.5, 1.1, 1.2, 0.05), '#c9ced6', { p: [-4.3, y0 + 0.55, 1.9] }), part(cyl(0.38, 0.38, 0.08, 24), '#9aa1a9', { p: [-4.3, y0 + 0.6, 2.52], r: [Math.PI / 2, 0, 0] }), part(torus(0.38, 0.05, TAU, 24), K.gold, { p: [-4.3, y0 + 0.6, 2.56] }));
    out.push(trees(R, [[4.7, 2.2], [-0.6, -4.6], [0.6, 3.8], [4.4, 4.4], [-4.6, 4.6], [1.8, 4.6], [-1.0, -2.4]]));
    // ---- moving parts
    const moving = [], T = 2.4;
    // The press ram stamps once every step, while the line is still.
    moving.push({ geo: merge(part(cyl(0.12, 0.12, 1.4, 14), '#c9ced6', { p: [0, 0.7, 0] }), part(rbox(1.0, 0.25, 0.8, 0.05), BLUE)), pivot: [0, y0 + 1.15, LZ], anim: (t) => { const u = cyc(t, T); return { y: -bump(u, 0.65, 0.07) * 0.45 }; } });
    // Bonds step along the line: unrated on the right, stamped from the press on.
    grades.slice(0, 5).forEach(([g, c], i) => {
      const st = (t) => { const s = t / T + i, n = ((Math.floor(s) % 5) + 5) % 5, u = s - Math.floor(s); return { n, u, x: 3.8 - 1.9 * (n + easeIO(clamp01(u / 0.4))) }; };
      const bond = moving.length;
      moving.push({ geo: merge(part(rbox(1.4, 0.06, 0.85, 0.02), '#fbf3e3'), part(box(1.3, 0.065, 0.04), '#c99a62', { p: [0, 0, 0.36] }), part(box(1.3, 0.065, 0.04), '#c99a62', { p: [0, 0, -0.36] }), [0, 1, 2].map((k) => part(box(0.5, 0.068, 0.04), '#b9b4aa', { p: [-0.35, 0, -0.18 + k * 0.12] }))),
        pivot: [0, y0 + 0.58, LZ], anim: (t) => { const s = st(t); return { x: s.x, s: s.n === 4 ? Math.max(0.001, 1 - win(s.u, 0, 0.4)) : s.n === 0 ? Math.min(1, win(s.u, 0.4, 0.7) + 0.001) : 1 }; } });
      moving.push({ geo: merge(part(rbox(0.8, 0.08, 0.46, 0.04), c), pixText(g, 0.07, K.white, 0.04).rotateX(-Math.PI / 2).translate(0, 0.05, 0)), pivot: [0.25, 0.05, 0.05], parent: bond, anim: (t) => { const s = st(t); return s.n >= 2 || (s.n === 1 && s.u > 0.66) ? { ry: 0.3 } : { s: 0.001 }; } });
    });
    // The pointer on the scale picks out each grade as it is stamped.
    moving.push({ geo: part(cone(0.16, 0.36, 3), '#1d1f24', { r: [0, 0, -Math.PI / 2] }), pivot: [SX - 0.53, 0, SZ + 0.81], anim: (t) => { const s = t / T, i = (((1 - Math.floor(s - 0.66)) % 5) + 5) % 5; return { y: y0 + 3.9 - i * 0.62, ry: Math.PI / 4 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Nasdaq: where the next big company lists. On the stage the founders press the button, the
  // new company's tile rises into the wall of the giants already listed, confetti flies, and the
  // ticker wraps round the MarketSite tower in Times Square.
  nasdaq: { finder: '#0090ba', build: () => {
    const R = rand(109), out = [], BLUE = '#0090ba', INK = '#121b2b';
    out.push(ground('#4a4f57'), part(box(10.2, 0.02, 10.2), '#5b616b', { p: [0, y0 + 0.01, 0] }));
    for (let i = 0; i < 7; i++) out.push(part(box(0.5, 0.01, 1.6), '#e9e6df', { p: [-1.2 + i * 0.75, y0 + 0.025, 4.0] }));
    // ---- the MarketSite tower: a dark drum with screens, back left
    const TX = -3.3, TZ = -3.3;
    out.push(part(cyl(1.3, 1.3, 5.8, 40), INK, { p: [TX, y0 + 2.9, TZ] }), part(cyl(1.36, 1.36, 0.2, 40), '#3a4656', { p: [TX, y0 + 5.85, TZ] }), part(cyl(1.36, 1.36, 0.12, 40), '#3a4656', { p: [TX, y0 + 1.2, TZ] }));
    out.push(place(merge(part(rbox(2.0, 0.5, 0.08, 0.04), BLUE), pixText('NASDAQ', 0.065, K.white, 0.03).translate(0, 0, 0.05)), { p: [TX + 0.95, y0 + 5.2, TZ + 0.95], r: [0, Math.PI / 4, 0] }));
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; out.push(part(box(0.5, 0.7, 0.04), ['#3d7be0', '#e5533d', '#f2c94c', '#2f9e6e', '#8a6cf0'][i % 5], { p: [TX + Math.cos(a) * 1.31, y0 + 4.2, TZ + Math.sin(a) * 1.31], r: [0, -a + Math.PI / 2, 0] })); }
    // ---- the wall of listed companies, centre back, facing the camera
    const WX = 0.4, WZ = -1.6, cols = 5, rows = 3, cell = 0.85, logos = ['#a2aaad', '#4285f4', '#f25022', '#76b900', '#1877f2', '#e50914', '#ff9900', '#cc0000', '#00a1e0', '#635bff', '#e31937', '#1db954', '#ff5a5f', '#6264a7'];
    const wallQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), wallAt = (c, r) => { const v = new V(-((cols - 1) / 2) * cell + c * cell, 0.9 + r * cell, 0).applyQuaternion(wallQ); return [WX + v.x, y0 + v.y, WZ + v.z]; };
    out.push(part(rbox(cols * cell + 0.4, rows * cell + 0.5, 0.2, 0.05), '#2b3440', { p: [WX, y0 + 0.9 + cell + 0.05, WZ], r: [0, Math.PI / 4, 0] }).translate(-0.08, 0, -0.08), part(rbox(1.2, 0.6, 0.6, 0.05), '#2b3440', { p: [WX - 0.08, y0 + 0.3, WZ - 0.08] }));
    let li = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (r === rows - 1 && c === cols - 1) continue; const p = wallAt(c, r), col = logos[li++ % logos.length]; out.push(part(rbox(0.7, 0.7, 0.08, 0.12), col, { p, q: wallQ }), part(new THREE.SphereGeometry(0.16, 12, 8), K.white, { p: [p[0] + 0.03, p[1], p[2] + 0.03], s: [1, 1, 0.3] })); }
    // ---- the stage, front right: podium, the button, and the founders
    const SX = 2.6, SZ = 2.0;
    out.push(part(rbox(3.0, 0.3, 2.2, 0.06), '#1d2733', { p: [SX, y0 + 0.15, SZ] }), part(box(3.02, 0.06, 2.22), BLUE, { p: [SX, y0 + 0.31, SZ] }), part(rbox(0.6, 0.9, 0.4, 0.05), K.white, { p: [SX - 0.6, y0 + 0.75, SZ - 0.4] }), part(cyl(0.12, 0.12, 0.06, 16), '#e5533d', { p: [SX - 0.6, y0 + 1.23, SZ - 0.4] }));
    [['#3d7be0', -0.1, 0.1], ['#d6336c', 0.5, -0.2], ['#2f9e6e', 0.9, 0.4], ['#f29a3a', 0.3, 0.6]].forEach(([c, dx, dz]) => out.push(place(fan(c), { p: [SX + dx, y0 + 0.34, SZ + dz], s: 1.4 })));
    out.push(part(rbox(0.9, 0.06, 0.9, 0.03), '#7b828c', { p: [SX - 1.0, y0 + 0.35, SZ + 0.5] }));
    // Times Square around it: towers wrapped in billboards, and the street with its taxis.
    [[2.9, -3.7, 1.8, 3.6, '#e5533d'], [-4.1, 0.4, 1.4, 3.0, '#f2c94c'], [0.2, -4.3, 1.4, 2.4, '#8a6cf0']].forEach(([x, z, w, h, c], i) => out.push(place(block(w, h, w, '#d9dde3', '#4a5a70', 0.3), { p: [x, y0, z] }), part(box(w * 0.8, h * 0.35, 0.04), c, { p: [x, y0 + h * 0.6, z + w / 2 + 0.03] }), part(box(0.04, h * 0.3, w * 0.7), ['#3d7be0', '#2f9e6e', '#e5533d'][i], { p: [x + w / 2 + 0.03, y0 + h * 0.45, z] })));
    out.push(part(box(10.2, 0.012, 0.06), '#f2c94c', { p: [0, y0 + 0.03, 4.0] }));
    out.push(trees(R, [[4.6, -1.6], [-4.6, 2.6], [4.6, 0.2]]));
    // ---- moving parts
    const moving = [], P = 8;
    // The ticker band wrapping round the tower.
    const tick = ['#62d35f', '#ff6b5b', K.white, '#62d35f', '#62d35f', '#ff6b5b'];
    moving.push({ geo: part(new THREE.CylinderGeometry(1.33, 1.33, 0.32, hi() ? 72 : 24, 1, true), (x, y, z) => tick[Math.floor((Math.atan2(z, x) + Math.PI) / TAU * 36) % tick.length]), pivot: [TX, y0 + 2.2, TZ], anim: (t) => ({ ry: t * 0.6 }) });
    moving.push({ geo: part(new THREE.CylinderGeometry(1.33, 1.33, 0.32, hi() ? 72 : 24, 1, true), (x, y, z) => tick[(Math.floor((Math.atan2(z, x) + Math.PI) / TAU * 30) + 2) % tick.length]), pivot: [TX, y0 + 3.0, TZ], anim: (t) => ({ ry: -t * 0.45 }) });
    // The button pressed, and the new company's tile rising from the stage into the empty slot.
    moving.push({ geo: part(cyl(0.1, 0.1, 0.05, 16), '#ff2d2d'), pivot: [SX - 0.6, y0 + 1.27, SZ - 0.4], anim: (t) => ({ y: cyc(t, P) < 0.08 ? -0.03 : 0 }) });
    const slot = wallAt(cols - 1, rows - 1), from = [SX - 1.0, y0 + 0.75, SZ + 0.5];
    const rise = curve([from, [from[0], y0 + 3.2, from[2]], [(from[0] + slot[0]) / 2 + 0.4, y0 + 4.2, (from[2] + slot[2]) / 2 + 0.4], [slot[0] + 0.3, slot[1] + 0.2, slot[2] + 0.3], slot]);
    moving.push({ geo: merge(part(rbox(0.7, 0.7, 0.08, 0.12), BLUE), part(cone(0.16, 0.36, 3), K.white, { p: [0, 0, 0.05], r: [Math.PI / 2, 0, 0] }).rotateX(-Math.PI / 2).translate(0, 0, 0.04)), pivot: [0, 0, 0], anim: (t) => {
      const f = cyc(t, P); if (f < 0.06 || f > 0.97) return { s: 0.001 }; const u = easeIO(win(f, 0.1, 0.5)), p = rise.getPointAt(u);
      return { x: p.x, y: p.y, z: p.z, q: wallQ, s: Math.min(1, win(f, 0.06, 0.12) + 0.001, (1 - f) / 0.03) * (1 + bump(f, 0.53, 0.03) * 0.25) }; } });
    // Confetti as it lands.
    for (let k = 0; k < (hi() ? 24 : 6); k++) { const a = R() * TAU, d = 0.4 + R() * 1.6, c = ['#f2c94c', '#e5533d', '#3d7be0', '#2f9e6e', K.white][k % 5];
      moving.push({ geo: part(new THREE.BoxGeometry(0.1, 0.02, 0.06), c), pivot: [SX + Math.cos(a) * d * 0.7, y0 + 3.2, SZ + Math.sin(a) * d * 0.6], anim: (t) => { const f = cyc(t, P), u = win(f, 0.5, 0.95); return f < 0.5 || f > 0.95 ? { s: 0.001 } : { y: -u * 2.6, x: Math.sin(u * 9 + k) * 0.2, rx: u * 12 + k, rz: u * 7 }; } }); }
    // Yellow cabs along the street.
    [0, 0.5].forEach((o, i) => moving.push({ geo: merge(sedan('#f6c437'), part(rbox(0.3, 0.12, 0.2, 0.03), K.white, { p: [-0.1, 1.17, 0] })), pivot: [0, y0, 4.0 + (i ? 0.45 : -0.45)], anim: (t) => { const f = cyc(t, 7, o), x = i ? 5.6 - f * 11.2 : -5.6 + f * 11.2; return { x, ry: i ? Math.PI : 0, s: clamp01((5.2 - Math.abs(x)) / 0.5) * 0.6 + 0.001 }; } }));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // ICE (Intercontinental Exchange): the exchange behind the exchanges. The New York Stock
  // Exchange, oil futures and the American mortgage all feed one cube of market data, and it
  // streams to every trading desk.
  ice: { finder: '#1e4a8c', build: () => {
    const R = rand(110), out = [], BLUE = '#1e4a8c', ICEB = '#bfe6ff';
    out.push(ground('#8fc66f'));
    // ---- the New York Stock Exchange, back left: steps, six columns, pediment, the big flag
    const NX = -2.8, NZ = -3.5;
    out.push(part(rbox(3.6, 3.2, 1.6, 0.04), '#e9e2d0', { p: [NX, y0 + 1.6, NZ - 0.2] }), part(rbox(3.8, 0.25, 0.7, 0.04), '#ddd5c2', { p: [NX, y0 + 0.12, NZ + 0.85] }));
    for (let i = 0; i < 6; i++) out.push(part(cyl(0.15, 0.17, 2.5, 20), '#f4efe2', { p: [NX - 1.4 + i * 0.56, y0 + 1.45, NZ + 0.75] }));
    out.push(part(rbox(3.7, 0.35, 0.5, 0.03), '#e9e2d0', { p: [NX, y0 + 2.85, NZ + 0.75] }), part(prism(3.8, 0.75, 0.6), '#e9e2d0', { p: [NX, y0 + 3.02, NZ + 0.75] }), place(pixText('NYSE', 0.06, '#5b5040', 0.02), { p: [NX, y0 + 2.85, NZ + 1.01] }));
    const stripes = [];
    for (let k = 0; k < 7; k++) stripes.push(part(box(2.2, 0.16, 0.02), k % 2 ? K.white : '#c8102e', { p: [0, -k * 0.16, 0] }));
    stripes.push(part(box(0.9, 0.64, 0.025), '#3c3b6e', { p: [-0.65, -0.24, 0] }));
    out.push(place(merge(stripes), { p: [NX, y0 + 2.4, NZ + 0.55] }));
    // ---- the oil: a tanker on a strip of sea, right
    out.push(part(box(2.2, 0.04, 6.0), 'W', { p: [4.0, y0 + 0.02, -0.4] }), part(rbox(0.5, 0.3, 2.6, 0.05), '#a33a2a', { p: [4.0, y0 + 0.2, -0.6] }), part(rbox(0.5, 0.12, 2.6, 0.04), '#2b3440', { p: [4.0, y0 + 0.4, -0.6] }), part(rbox(0.4, 0.4, 0.4, 0.04), K.white, { p: [4.0, y0 + 0.65, -1.7] }));
    [-1.0, -0.3, 0.4].forEach((z) => out.push(part(cyl(0.13, 0.13, 0.3, 14), '#2b2f36', { p: [4.0, y0 + 0.6, z] }), part(cyl(0.135, 0.135, 0.04, 14), '#e5533d', { p: [4.0, y0 + 0.62, z] })));
    // ---- the homes and their mortgages, front left
    out.push(place(home('#fbf3e3', '#8a5a36', 1.4, 1.2, 0.95), { p: [-3.6, y0, 1.6] }), place(home('#e8eef4', '#5b6b7d', 1.4, 1.2, 0.95), { p: [-3.4, y0, 3.8] }), place(home('#f6e7e1', '#a35a3c', 1.4, 1.2, 0.95), { p: [-1.2, y0, 3.9] }));
    // ---- the trading desks, front right
    [[1.6, 3.4], [2.9, 2.9]].forEach(([x, z]) => out.push(place(desk(K.white, '#3a3f47'), { p: [x, y0, z], r: [0, Math.PI / 4, 0] }), part(rbox(0.6, 0.38, 0.04, 0.02), '#1d1f24', { p: [x - 0.1, y0 + 1.15, z - 0.1], r: [0, Math.PI / 4, 0] }), place(fan('#3d7be0'), { p: [x + 0.35, y0, z + 0.35], s: 1.3 })));
    // ---- the cube's plinth, centre
    const CX = 0.2, CZ = -0.2;
    out.push(part(cyl(1.0, 1.1, 0.35, 32), BLUE, { p: [CX, y0 + 0.17, CZ] }), place(pixText('ICE', 0.08, K.white, 0.03), { p: [CX + 0.73, y0 + 0.2, CZ + 0.73], r: [0, Math.PI / 4, 0] }));
    out.push(trees(R, [[4.6, 4.6], [-0.6, -4.6], [1.6, -4.4], [-4.6, -1.2], [0.4, 2.0]]));
    // ---- moving parts
    const moving = [], P = 6;
    // The ice cube: a pale block with bright edges, turning and floating.
    const cube = merge(part(rbox(1.5, 1.5, 1.5, 0.18), ICEB), [[-1, -1], [1, -1], [1, 1], [-1, 1]].flatMap(([a, b]) => [part(box(0.06, 1.42, 0.06), K.white, { p: [a * 0.7, 0, b * 0.7] }), part(box(1.42, 0.06, 0.06), K.white, { p: [0, a * 0.7, b * 0.7] }), part(box(0.06, 0.06, 1.42), K.white, { p: [a * 0.7, b * 0.7, 0] })]), part(box(0.5, 0.5, 1.52), '#e6f6ff', { p: [-0.3, 0.3, 0] }));
    moving.push({ geo: cube, pivot: [CX, y0 + 1.6, CZ], anim: (t) => ({ ry: t * 0.4, y: Math.sin(t * 1.2) * 0.12 }) });
    // Data in from the exchange, the oil and the homes; data out to the desks.
    const pkt = (c) => part(new THREE.BoxGeometry(0.15, 0.15, 0.15), c), C = [CX, y0 + 1.6, CZ];
    const feeds = [[[NX + 0.6, y0 + 2.0, NZ + 1.2], '#c8102e'], [[4.0, y0 + 0.9, -0.3], '#2b2f36'], [[-3.4, y0 + 1.6, 1.8], '#7cbf7d'], [[-1.2, y0 + 1.6, 3.6], '#7cbf7d']];
    feeds.forEach(([a, c], i) => { const path = curve([a, [(a[0] + C[0]) / 2, y0 + 3.0, (a[2] + C[2]) / 2], C]); out.push(part(tubeOn(path, 0.02, hi() ? 40 : 10), '#9ccbe8')); for (let k = 0; k < 3; k++) moving.push(rider(pkt(c), path, P, i / 4 + k / 3, 0, 0.6, (t) => ({ rx: t * 3 }))); });
    [[1.5, 3.3], [2.8, 2.8]].forEach(([x, z], i) => { const path = curve([C, [(x + C[0]) / 2 + 0.3, y0 + 2.8, (z + C[2]) / 2 + 0.3], [x, y0 + 1.4, z]]); out.push(part(tubeOn(path, 0.02, hi() ? 40 : 10), '#9ccbe8')); for (let k = 0; k < 4; k++) moving.push(rider(pkt(ICEB), path, P / 2, i / 2 + k / 4, 0, 0.7)); });
    // The tanker rocking and the bell ringing on the exchange's balcony.
    moving.push({ geo: part(rbox(0.3, 0.06, 2.3, 0.02), '#7b828c'), pivot: [4.0, y0 + 0.48, -0.6], anim: (t) => ({ rz: Math.sin(t * 1.3) * 0.04 }) });
    moving.push({ geo: merge(part(lathe([[0, -0.3], [0.2, -0.28], [0.18, -0.1], [0.1, 0], [0, 0.02]], 20), K.gold), part(cyl(0.02, 0.02, 0.2, 6), K.dark, { p: [0, 0.1, 0] })), pivot: [NX + 1.4, y0 + 3.5, NZ + 0.6], anim: (t) => ({ rz: Math.sin(t * 9) * 0.35 * bump(cyc(t, P), 0.1, 0.08) }) });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // PayPal: both sides of the checkout. Friends pay each other in a tap, and the same accounts
  // pay hundreds of shops through the button in the middle; every new account makes the network
  // more useful for everyone else.
  paypal: { finder: '#003087', build: () => {
    const R = rand(111), out = [], NAVY = '#003087', SKY = '#009cde';
    out.push(ground('#8fc66f'), part(cyl(2.0, 2.0, 0.04, 48), '#e8e3d8', { p: [0.2, y0 + 0.02, 0.0] }));
    // ---- the P in the middle: an extruded letter on a plinth
    const pSh = [[0, 0], [0.5, 0], [0.5, 0.75], [0.95, 0.75], [1.25, 0.9], [1.4, 1.2], [1.4, 1.55], [1.25, 1.85], [0.95, 2.0], [0, 2.0]], pHole = [[0.5, 1.15], [0.85, 1.15], [0.95, 1.3], [0.95, 1.45], [0.85, 1.6], [0.5, 1.6]];
    const pGeo = (() => { const sh = new THREE.Shape(pSh.map(([x, y]) => new V(x - 0.7, y, 0))), h = new THREE.Path(pHole.map(([x, y]) => new V(x - 0.7, y, 0))); sh.holes.push(h); return new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: hi() ? 3 : 1 }).translate(0, 0, -0.15); })();
    out.push(part(cyl(0.9, 1.0, 0.3, 32), '#2b3440', { p: [0.2, y0 + 0.15, 0.0] }));
    // ---- the shops, back and right: storefront screens with a checkout button
    const shops = [[-3.6, -3.4], [-1.0, -3.9], [1.6, -3.9], [3.8, -2.6], [3.9, 0.2]];
    shops.forEach(([x, z], i) => {
      const c = ['#e5533d', '#2f9e6e', '#f2c94c', '#8a6cf0', '#f29a3a'][i], ry = x > 3 ? Math.PI / 2 : 0;
      out.push(place(merge(part(rbox(1.6, 1.4, 1.0, 0.05), '#f6efe2', { p: [0, 0.7, 0] }), part(rbox(1.66, 0.25, 1.06, 0.04), c, { p: [0, 1.35, 0] }), part(rbox(1.0, 0.7, 0.04, 0.03), '#1d1f24', { p: [0, 0.7, 0.51] }), part(box(0.9, 0.6, 0.01), K.white, { p: [0, 0.7, 0.535] }), part(rbox(0.5, 0.14, 0.02, 0.05), K.gold, { p: [0, 0.5, 0.545] }), part(box(0.4, 0.25, 0.015), c, { p: [0, 0.85, 0.545] })), { p: [x, y0, z], r: [0, ry, 0] }));
    });
    // ---- the people with their phones, front and left
    const people = [[-3.6, -0.6, '#3d7be0'], [-3.8, 1.8, '#e5533d'], [-2.0, 3.6, '#2f9e6e'], [0.6, 3.9, '#d6336c'], [2.8, 3.4, '#f29a3a'], [-1.6, 1.6, '#8a6cf0'], [1.8, 1.9, '#3fb8a8']];
    people.forEach(([x, z, c]) => out.push(place(fan(c), { p: [x, y0, z], s: 1.5 }), part(rbox(0.12, 0.2, 0.03, 0.02), '#1d1f24', { p: [x + 0.15, y0 + 0.85, z + 0.15], r: [0, Math.PI / 4, 0] })));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, 2.2], [-4.6, -1.8]]));
    // ---- moving parts
    const moving = [], P = 9;
    moving.push({ geo: merge(part(pGeo, NAVY), part(pGeo.clone().scale(0.8, 0.8, 1.1), SKY, { p: [-0.32, 0.25, 0.0] })), pivot: [0.2, y0 + 0.3, 0.0], anim: (t) => ({ ry: Math.PI / 4 + Math.sin(t * 0.8) * 0.4, y: Math.sin(t * 1.6) * 0.05 }) });
    const top = [0.2, y0 + 2.6, 0.0], bill = merge(part(rbox(0.36, 0.22, 0.04, 0.03), SKY), part(cyl(0.06, 0.06, 0.05, 12), K.white, { r: [Math.PI / 2, 0, 0] }));
    // Friend to friend: hops between people in light blue.
    people.forEach(([x, z], i) => { const [x2, z2] = people[(i + 3) % people.length], hopC = curve([[x, y0 + 1.1, z], [(x + x2) / 2, y0 + 2.0, (z + z2) / 2], [x2, y0 + 1.1, z2]]); moving.push(rider(bill, hopC, P / 2, i / 7, 0, 0.45)); });
    // Customers to shops through the P.
    shops.forEach(([x, z], i) => { const [px, pz] = people[i]; const pay = curve([[px, y0 + 1.1, pz], [(px + top[0]) / 2, y0 + 2.4, (pz + top[2]) / 2], top, [(x + top[0]) / 2, y0 + 2.6, (z + top[2]) / 2], [x, y0 + 1.6, z]]); moving.push(rider(place(coin(0.2, 0.07), { r: [Math.PI / 2, 0, 0] }), pay, P, i / 5, 0, 0.6, (t) => ({ ry: t * 4 }))); moving.push(pulse(x, y0 + 1.7, z, SKY, P, i / 5 + 0.6, 0.45)); });
    // A newcomer joining each cycle.
    moving.push({ geo: merge(fan('#f2c94c'), part(rbox(0.12, 0.2, 0.03, 0.02), '#1d1f24', { p: [0.15, 0.85, 0.15] })), pivot: [3.6, y0, 1.9], anim: (t) => { const f = cyc(t, P); return { s: 1.5 * back(win(f, 0.05, 0.2)) + 0.001, ry: Math.PI / 4 }; } });
    moving.push(pulse(3.6, y0 + 0.05, 1.9, SKY, P, 0.1, 0.5));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Block: Square on the counter and Cash App in the pocket. At the market every stall takes a
  // tap on its white Square reader; the money lands in the seller's Cash App, and the seller
  // spends it at the next stall, so the dollars go round inside Block's own loop.
  block: { finder: '#00d64f', build: () => {
    const R = rand(112), out = [], GREEN = '#00d64f', INK = '#121212';
    out.push(ground('#8fc66f'), part(box(7.6, 0.03, 7.6), '#d9cdb8', { p: [0.2, y0 + 0.015, 0.2] }));
    // ---- the market: a ring of stalls with striped awnings and Square readers
    const stalls = [[-2.8, -2.4], [0.2, -3.2], [3.0, -2.2], [3.2, 1.0], [-3.2, 1.0]], wares = ['#e5533d', '#f2c94c', '#8fc46a', '#d6336c', '#f29a3a'];
    const reader = merge(part(rbox(0.3, 0.05, 0.3, 0.04), K.white), part(rbox(0.26, 0.2, 0.03, 0.03), K.white, { p: [0, 0.12, -0.1], r: [-0.3, 0, 0] }), part(box(0.2, 0.15, 0.01), '#1d1f24', { p: [0, 0.12, -0.08], r: [-0.3, 0, 0] }), part(rbox(0.08, 0.08, 0.012, 0.015), INK, { p: [0, 0.12, -0.07], r: [-0.3, 0, 0] }));
    stalls.forEach(([x, z], i) => {
      const ry = Math.atan2(-(0.2 - x), 0.2 - z) * 0, face = Math.atan2(0.2 - x, 0.2 - z), g = [];
      g.push(part(rbox(1.6, 0.8, 0.7, 0.04), K.wood, { p: [0, 0.4, 0] }), [-0.75, 0.75].flatMap((dx) => [part(cyl(0.04, 0.04, 1.8, 8), K.white, { p: [dx, 0.9, -0.3] }), part(cyl(0.04, 0.04, 1.5, 8), K.white, { p: [dx, 0.75, 0.3] })]));
      for (let k = 0; k < 6; k++) g.push(part(box(0.28, 0.04, 0.9), k % 2 ? K.white : wares[i], { p: [-0.7 + k * 0.28, 1.65, 0], r: [0.35, 0, 0] }));
      for (let k = 0; k < 6; k++) g.push(part(new THREE.SphereGeometry(0.1, 10, 7), wares[(i + k) % 5], { p: [-0.6 + k * 0.17, 0.88, -0.1 + (k % 2) * 0.12] }));
      g.push(place(reader, { p: [0.55, 0.8, 0.15], r: [0, Math.PI, 0] }));
      out.push(place(merge(g), { p: [x, y0, z], r: [0, face, 0] }));
      out.push(place(fan(wares[(i + 2) % 5]), { p: [x - Math.sin(face) * 0.7, y0, z - Math.cos(face) * 0.7], s: 1.4 }));
    });
    // ---- the giant phone with Cash App, front right
    const PX = 2.6, PZ = 3.4, PQ = Math.PI / 4;
    out.push(part(rbox(1.3, 2.4, 0.14, 0.18), INK, { p: [PX, y0 + 1.4, PZ], r: [0, PQ, 0] }), part(rbox(1.16, 2.16, 0.02, 0.12), GREEN, { p: [PX + 0.05, y0 + 1.4, PZ + 0.05], r: [0, PQ, 0] }));
    out.push(place(merge(part(rbox(0.6, 0.6, 0.04, 0.14), K.white), pixText('$', 0.09, GREEN, 0.03).translate(0, 0, 0.03)), { p: [PX + 0.08, y0 + 1.75, PZ + 0.08], r: [0, PQ, 0] }), part(rbox(0.6, 0.1, 0.12, 0.03), '#c9ced6', { p: [PX, y0 + 0.05, PZ] }));
    out.push(trees(R, [[-4.6, 4.6], [4.6, -4.6], [-4.6, -4.6], [0.2, 4.6]]));
    // ---- moving parts
    const moving = [], P = 10, MID = [0.2, 0, 0.2];
    // The bitcoin turning over the square.
    moving.push({ geo: merge(part(cyl(0.5, 0.5, 0.1, 32), '#f7931a', { r: [Math.PI / 2, 0, 0] }), pixText('B', 0.1, K.white, 0.13)), pivot: [MID[0], y0 + 2.3, MID[2]], anim: (t) => ({ ry: t * 1.2, y: Math.sin(t) * 0.1 }) });
    out.push(part(cyl(0.05, 0.05, 1.7, 8), '#c9ced6', { p: [MID[0], y0 + 0.85, MID[2]] }), part(cyl(0.5, 0.6, 0.12, 24), '#c9ced6', { p: [MID[0], y0 + 0.06, MID[2]] }));
    // Each sale: a tap at the stall's reader, the green dollar to the phone, then spent at the next stall.
    const cash = merge(part(rbox(0.4, 0.4, 0.06, 0.1), GREEN), pixText('$', 0.06, K.white, 0.08));
    stalls.forEach(([x, z], i) => {
      const face = Math.atan2(0.2 - x, 0.2 - z), rx = x + Math.sin(face) * 0.15 + Math.cos(face) * 0.55, rz = z + Math.cos(face) * 0.15 - Math.sin(face) * 0.55, [nx, nz] = stalls[(i + 1) % 5];
      moving.push(pulse(rx, y0 + 0.9, rz, GREEN, P, i / 5, 0.22));
      moving.push(rider(cash, curve([[rx, y0 + 1.1, rz], [(rx + PX) / 2, y0 + 3.0, (rz + PZ) / 2], [PX, y0 + 2.4, PZ]]), P, i / 5, 0.02, 0.35));
      moving.push(rider(cash, curve([[PX, y0 + 2.4, PZ], [(nx + PX) / 2, y0 + 3.4, (nz + PZ) / 2], [nx, y0 + 1.3, nz]]), P, i / 5, 0.45, 0.8));
    });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Dell: built to order, shipped direct. An order leaves the customer's laptop for the line; a
  // bare chassis gets its board from the robot arm, is boxed under the gantry and rolls into the
  // van that drives it straight to the customer's door.
  dell: { finder: '#007db8', build: () => {
    const R = rand(113), out = [], BLUE = '#007db8';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.3), '#5b616b', { p: [0, y0 + 0.015, 2.1] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.6, 0.01, 0.06), '#f2c94c', { p: [-4.6 + i * 1.3, y0 + 0.035, 2.1] }));
    // ---- the factory floor, back: a slab, back wall with the logo, and the line
    out.push(part(rbox(9.2, 0.1, 4.0, 0.03), '#d8dde3', { p: [-0.2, y0 + 0.05, -2.6] }), part(rbox(9.2, 2.6, 0.2, 0.04), '#eef0f2', { p: [-0.2, y0 + 1.3, -4.6] }), part(box(9.22, 0.25, 0.22), BLUE, { p: [-0.2, y0 + 2.45, -4.6] }));
    out.push(part(torus(0.62, 0.07, TAU, 40), BLUE, { p: [-3.4, y0 + 1.45, -4.45] }), place(pixText('DELL', 0.07, BLUE, 0.04), { p: [-3.4, y0 + 1.45, -4.45] }));
    const LZ = -2.2, slots = [-3.0, -1.0, 1.0, 3.0], T = 2.2;
    out.push(part(rbox(8.0, 0.55, 1.0, 0.05), '#5b616b', { p: [0, y0 + 0.28, LZ] }), part(box(7.9, 0.04, 0.9), '#2b2f36', { p: [0, y0 + 0.57, LZ] }));
    if (hi()) for (let x = -3.8; x <= 3.8; x += 0.3) out.push(part(new THREE.CylinderGeometry(0.04, 0.04, 0.92, 8), '#9aa1a9', { p: [x, y0 + 0.55, LZ], r: [Math.PI / 2, 0, 0] }));
    // The robot arm's base at slot 1, the boxing gantry over slot 2, and parts bins.
    out.push(part(cyl(0.35, 0.4, 0.4, 20), '#e9ecef', { p: [-1.0, y0 + 0.2, LZ - 1.1] }), part(rbox(1.0, 0.5, 0.6, 0.04), '#9aa1a9', { p: [-2.2, y0 + 0.25, LZ - 1.2] }));
    for (let k = 0; k < 6; k++) out.push(part(box(0.14, 0.04, 0.4), '#2f9e6e', { p: [-2.55 + k * 0.14, y0 + 0.52, LZ - 1.2] }));
    [-0.6, 0.6].forEach((dz) => out.push(part(rbox(0.2, 2.4, 0.2, 0.04), BLUE, { p: [0.4, y0 + 1.2, LZ + dz] }), part(rbox(0.2, 2.4, 0.2, 0.04), BLUE, { p: [1.6, y0 + 1.2, LZ + dz] })));
    out.push(part(rbox(1.5, 0.2, 1.5, 0.04), BLUE, { p: [1.0, y0 + 2.4, LZ] }), part(rbox(0.9, 0.6, 0.6, 0.04), '#c99a62', { p: [1.0, y0 + 0.3, LZ - 1.3] }));
    // The loading dock and its door.
    out.push(part(rbox(1.2, 1.6, 0.1, 0.03), '#7b828c', { p: [3.6, y0 + 0.8, -4.45] }));
    // ---- the customer's home office, front left, across the road
    out.push(place(house2('#fbf3e3', '#5b6b7d', BLUE), { p: [-2.6, y0, 3.6], s: 0.75 }), place(desk(K.wood, '#2b2f36'), { p: [0.8, y0, 3.7], r: [0, Math.PI / 4, 0] }), place(fan('#d6336c'), { p: [1.2, y0, 4.2], s: 1.3 }));
    out.push(part(rbox(0.7, 0.45, 0.04, 0.02), '#1d1f24', { p: [0.7, y0 + 1.05, 3.6], r: [0, Math.PI / 4, 0] }), part(box(0.6, 0.36, 0.01), BLUE, { p: [0.72, y0 + 1.05, 3.63], r: [0, Math.PI / 4, 0] }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [3.2, 3.6], [-4.6, 1.0]]));
    // ---- moving parts
    const moving = [];
    const st = (t, i) => { const s = t / T + i, n = ((Math.floor(s) % 4) + 4) % 4, u = s - Math.floor(s); return { n, u, x: slots[0] + 2.0 * (n + easeIO(clamp01(u / 0.4))) }; };
    for (let i = 0; i < 4; i++) {
      const it = moving.length;
      moving.push({ geo: merge(part(rbox(1.1, 0.3, 0.75, 0.04), '#3a3f47', { p: [0, 0.15, 0] }), part(box(0.9, 0.02, 0.6), '#4a4f57', { p: [0, 0.31, 0] })), pivot: [0, y0 + 0.6, LZ], anim: (t) => { const s = st(t, i); return { x: s.x, s: s.n === 3 ? Math.max(0.001, 1 - win(s.u, 0.0, 0.4)) : s.n === 0 ? Math.min(1, win(s.u, 0.45, 0.7)) + 0.001 : 1 }; } });
      moving.push({ geo: merge(part(box(0.7, 0.04, 0.45), '#2f9e6e'), part(rbox(0.3, 0.08, 0.3, 0.02), '#1d1f24', { p: [0.1, 0.05, 0] }), part(box(0.1, 0.06, 0.4), '#76b900', { p: [-0.25, 0.04, 0] })), pivot: [0, 0.34, 0], parent: it, anim: (t) => { const s = st(t, i); return s.n >= 2 || (s.n === 1 && s.u > 0.7) ? {} : { s: 0.001 }; } });
      moving.push({ geo: merge(part(box(1.2, 0.55, 0.85), '#c99a62', { p: [0, 0.28, 0] }), part(box(0.26, 0.56, 0.86), '#e8d3ad', { p: [0, 0.28, 0] }), place(pixText('DELL', 0.03, BLUE, 0.02), { p: [0.3, 0.3, 0.43] })), pivot: [0, 0, 0], parent: it, anim: (t) => { const s = st(t, i); return s.n === 3 || (s.n === 2 && s.u > 0.62) ? { y: s.n === 2 ? (1 - easeOut(win(s.u, 0.62, 0.8))) * 1.4 : 0 } : { s: 0.001 }; } });
    }
    // The robot arm swinging a board from the bin onto the chassis.
    const arm = moving.length;
    moving.push({ geo: merge(part(cyl(0.12, 0.12, 0.3, 14), '#f29a3a', { p: [0, 0.15, 0] }), part(capsule(0.09, 0.9), '#f29a3a', { p: [0, 0.75, 0] })), pivot: [-1.0, y0 + 0.4, LZ - 1.1], anim: (t) => { const u = cyc(t, T); return { ry: Math.PI / 2 + Math.sin(win(u, 0.4, 1) * Math.PI) * 0.9 - 0.9 * (u < 0.4 ? 1 - u / 0.4 : 0) * 0 , rx: 0.5 * bump(u, 0.72, 0.1) }; } });
    moving.push({ geo: merge(part(capsule(0.07, 0.8), '#f29a3a', { p: [0, 0.4, 0], r: [0, 0, 0] }), part(box(0.2, 0.06, 0.2), '#3a3f47', { p: [0, 0.85, 0] })), pivot: [0, 1.25, 0], parent: arm, anim: (t) => { const u = cyc(t, T); return { rx: 1.7 - 0.25 * bump(u, 0.72, 0.1) }; } });
    // The order: from the laptop to the start of the line.
    const order = curve([[0.7, y0 + 1.4, 3.6], [-1.0, y0 + 3.4, 0.8], [slots[0], y0 + 1.4, LZ]]);
    moving.push(rider(merge(part(rbox(0.4, 0.3, 0.04, 0.04), K.white), part(box(0.3, 0.04, 0.05), BLUE, { p: [0, 0.06, 0] }), part(box(0.2, 0.04, 0.05), '#9aa1a9', { p: [-0.05, -0.04, 0] })), order, T * 4, 0, 0.05, 0.3, () => ({ ry: Math.PI / 4 })));
    // The van: loaded at the dock, out along the road to the customer's door.
    const route = curve([[3.6, y0, -3.4], [3.6, y0, -0.2], [2.6, y0, 1.95], [0, y0, 2.0], [-2.0, y0, 2.0], [-2.6, y0, 2.4]]);
    moving.push({ geo: van(K.white, BLUE), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, T * 4, 0.25), u = f < 0.35 ? 0 : easeIO(win(f, 0.35, 0.85)), a = along(route, u); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry, s: (f > 0.95 ? 1 - win(f, 0.95, 1) : Math.min(1, f / 0.05)) * 0.8 + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // HP: the printer in every home, and the ink that keeps coming. Pages stream out of the giant
  // printer and its ink gauges fall; before they run dry the Instant Ink van brings a fresh
  // cartridge to the mailbox and it drops straight in.
  hp: { finder: '#0096d6', build: () => {
    const R = rand(114), out = [], BLUE = '#0096d6';
    out.push(ground('#8fc66f'), part(rbox(7.0, 0.08, 6.2, 0.03), '#e3d5bd', { p: [-1.4, y0 + 0.04, -1.5] }));
    // ---- the room: two walls with the logo, a rug, the desk with the laptop
    out.push(part(rbox(7.0, 2.6, 0.2, 0.04), '#eef0f2', { p: [-1.4, y0 + 1.3, -4.6] }), part(rbox(0.2, 2.6, 6.2, 0.04), '#e6e9ed', { p: [-4.9, y0 + 1.3, -1.5] }), part(box(7.0, 0.2, 0.22), BLUE, { p: [-1.4, y0 + 2.5, -4.6] }), part(box(0.22, 0.2, 6.2), BLUE, { p: [-4.9, y0 + 2.5, -1.5] }));
    out.push(part(cyl(0.6, 0.6, 0.06, 32), BLUE, { p: [-3.2, y0 + 1.5, -4.48], r: [Math.PI / 2, 0, 0] }), place(pixText('HP', 0.1, K.white, 0.04), { p: [-3.2, y0 + 1.5, -4.44] }));
    out.push(part(rbox(1.6, 1.0, 0.04, 0.03), '#a8d4f0', { p: [0.4, y0 + 1.5, -4.48] }), part(rbox(0.04, 1.0, 1.4, 0.03), '#a8d4f0', { p: [-4.78, y0 + 1.5, 0.2] }));
    out.push(part(cyl(1.6, 1.6, 0.02, 40), '#c97b5a', { p: [-1.4, y0 + 0.09, -1.2] }));
    out.push(place(desk(K.wood, '#c9ced6'), { p: [-3.6, y0, -3.4], r: [0, Math.PI / 4, 0] }));
    // ---- the printer's table
    const PX = -1.2, PZ = -1.6;
    out.push(part(rbox(3.2, 0.12, 1.8, 0.03), K.white, { p: [PX, y0 + 0.9, PZ] }), [[-1.45, -0.75], [1.45, -0.75], [-1.45, 0.75], [1.45, 0.75]].map(([x, z]) => part(box(0.1, 0.84, 0.1), K.dark, { p: [PX + x, y0 + 0.44, PZ + z] })));
    // The printer itself: body, scanner lid, paper tray, the output tray.
    out.push(part(rbox(2.6, 0.95, 1.5, 0.12), '#f4f5f6', { p: [PX, y0 + 1.45, PZ] }), part(rbox(2.5, 0.12, 1.4, 0.06), '#3a3f47', { p: [PX, y0 + 1.98, PZ] }), part(box(1.8, 0.04, 0.6), '#2b2f36', { p: [PX, y0 + 1.2, PZ + 0.95] }), part(box(1.6, 0.3, 0.05), '#2b2f36', { p: [PX, y0 + 1.42, PZ + 0.76] }), part(rbox(0.5, 0.18, 0.04, 0.03), '#1d1f24', { p: [PX + 0.8, y0 + 1.7, PZ + 0.76] }), part(cyl(0.12, 0.12, 0.04, 16), BLUE, { p: [PX - 0.95, y0 + 1.7, PZ + 0.77], r: [Math.PI / 2, 0, 0] }));
    // The ink window on its side, with four gauges.
    out.push(part(rbox(0.04, 0.6, 1.1, 0.03), '#1d1f24', { p: [PX + 1.31, y0 + 1.45, PZ] }));
    // ---- the mailbox and the road, right
    out.push(part(box(1.4, 0.03, 10.2), '#5b616b', { p: [4.3, y0 + 0.015, 0] }), part(cyl(0.05, 0.05, 1.0, 8), '#6f4a2c', { p: [3.2, y0 + 0.5, 1.6] }), part(rbox(0.5, 0.35, 0.3, 0.06), BLUE, { p: [3.2, y0 + 1.15, 1.6] }), part(box(0.04, 0.25, 0.08), '#e5533d', { p: [3.47, y0 + 1.25, 1.55] }));
    // The family using it: a kid with homework at the low table, photos pinned up, stacks of prints.
    out.push(part(rbox(1.4, 0.08, 0.8, 0.03), K.wood, { p: [-1.2, y0 + 0.5, 1.0] }), [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([x, z]) => part(box(0.06, 0.46, 0.06), K.dark, { p: [-1.2 + x, y0 + 0.25, 1.0 + z] })), place(fan('#e5533d'), { p: [-1.2, y0, 1.7], s: 1.1 }));
    [0, 1, 2].forEach((k) => out.push(part(box(0.6, 0.04 + k * 0.03, 0.45), K.white, { p: [-1.5 + k * 0.5, y0 + 0.56 + k * 0.015, 0.95] })));
    ['#e5533d', '#3d7be0', '#2f9e6e', '#f2c94c', '#8a6cf0'].forEach((c, k) => out.push(part(box(0.4, 0.3, 0.02), K.white, { p: [-3.4 + k * 0.6, y0 + 1.6 + (k % 2) * 0.2, -4.48] }), part(box(0.34, 0.24, 0.025), c, { p: [-3.4 + k * 0.6, y0 + 1.6 + (k % 2) * 0.2, -4.48] })));
    out.push(part(rbox(0.5, 2.0, 1.6, 0.04), K.wood, { p: [-4.5, y0 + 1.0, -0.2] }), [0, 1, 2, 3].map((k) => part(box(0.44, 0.04, 1.5), '#8a5a36', { p: [-4.5, y0 + 0.3 + k * 0.5, -0.2] })), [0, 1, 2].flatMap((k) => [0, 1, 2, 3, 4].map((j) => part(box(0.3, 0.36, 0.12), ['#e5533d', BLUE, '#2f9e6e', '#f2c94c', '#8a6cf0'][(j + k) % 5], { p: [-4.4, y0 + 0.52 + k * 0.5, -0.8 + j * 0.28] }))));
    out.push(trees(R, [[2.6, 4.4], [-4.4, 4.4], [2.4, -4.4], [0.8, 3.4]]));
    // ---- moving parts
    const moving = [], P = 12;
    // The ink gauges: each falls through the cycle and fills back up when the cartridge lands.
    const level = (t, k) => { const f = cyc(t, P); return f < 0.82 ? 1 - easeIn(win(f, 0, 0.82)) * (0.7 + k * 0.06) : 0.3 + 0.7 * easeOut(win(f, 0.88, 0.96)); };
    ['#00b7eb', '#e5007e', '#ffe600', '#1d1f24'].forEach((c, k) => moving.push({ geo: part(box(0.03, 0.5, 0.2), c, { p: [0, 0.25, 0] }), pivot: [PX + 1.34, y0 + 1.2, PZ - 0.39 + k * 0.26], anim: (t) => ({ sy: level(t, k) + 0.001 }) }));
    // Pages printing: each slides out and lands on the growing stack.
    for (let k = 0; k < 5; k++) moving.push({ geo: merge(part(box(1.0, 0.012, 0.75), K.white), part(box(0.6, 0.014, 0.08), '#9aa1a9', { p: [-0.1, 0, -0.15] }), part(box(0.5, 0.014, 0.28), ['#e5533d', BLUE, '#2f9e6e', '#f29a3a', '#8a6cf0'][k], { p: [0.1, 0, 0.12] })), pivot: [PX, y0 + 1.26, PZ + 0.5], anim: (t) => { const f = cyc(t, 2.4, k / 5) , u = easeOut(win(f, 0, 0.5)); return { z: u * 0.55, y: -u * 0.02, s: f > 0.92 ? 1 - win(f, 0.92, 1) + 0.001 : 1 }; } });
    // The Instant Ink van stops at the mailbox; the cartridge flies in.
    moving.push({ geo: place(van(K.white, BLUE), { r: [0, -Math.PI / 2, 0] }), pivot: [4.3, y0, 0], anim: (t) => { const f = cyc(t, P), z = f < 0.6 ? 6 : f < 0.72 ? 5.6 - easeOut(win(f, 0.6, 0.72)) * 4.1 : f < 0.8 ? 1.5 : 1.5 - easeIn(win(f, 0.8, 0.95)) * 7.0; return { z, s: clamp01((5.2 - Math.abs(z)) / 0.5) * 0.85 + 0.001 }; } });
    const cart = merge(part(rbox(0.36, 0.24, 0.2, 0.04), '#2b2f36'), part(box(0.37, 0.08, 0.21), BLUE, { p: [0, 0.06, 0] }), part(box(0.1, 0.05, 0.05), '#00b7eb', { p: [0, -0.13, 0] }));
    const drop = curve([[3.2, y0 + 1.4, 1.6], [1.8, y0 + 3.6, 0.5], [PX + 0.3, y0 + 3.0, PZ], [PX + 0.3, y0 + 2.1, PZ]]);
    moving.push(rider(cart, drop, P, 0, 0.72, 0.9, (t, u) => ({ rz: u * 2 })));
    // The lid lifting to take it.
    moving.push({ geo: part(rbox(2.5, 0.08, 1.4, 0.04), '#c9ced6', { p: [0, 0, 0.7] }), pivot: [PX, y0 + 2.06, PZ - 0.7], anim: (t) => ({ rx: -0.5 * bump(cyc(t, P), 0.86, 0.05) }) });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Super Micro: first to ship the newest AI servers. Building blocks fly off the shelf and slot
  // into the open rack until it fills and lights up, while coolant runs through the liquid-cooled
  // racks beside it to the cooling unit outside.
  supermicro: { finder: '#2361a8', build: () => {
    const R = rand(115), out = [], BLUE = '#2361a8', GLOW = '#76e05f', COOL = '#4fc3f7';
    out.push(ground('#8fc66f'), part(rbox(7.2, 0.1, 6.0, 0.03), '#c9ced6', { p: [-1.2, y0 + 0.05, -1.4] }));
    for (let i = 0; i < 12; i++) for (let j = 0; j < 10; j++) if ((i + j) % 2) out.push(part(box(0.58, 0.012, 0.58), '#bfc5cc', { p: [-4.5 + i * 0.6, y0 + 0.11, -4.1 + j * 0.6] }));
    out.push(part(rbox(7.2, 2.8, 0.2, 0.04), '#e6e9ed', { p: [-1.2, y0 + 1.4, -4.5] }), part(box(7.22, 0.22, 0.22), BLUE, { p: [-1.2, y0 + 2.7, -4.5] }), place(pixText('SUPERMICRO', 0.06, K.white, 0.03), { p: [-1.6, y0 + 2.7, -4.38] }));
    // ---- the rows of liquid-cooled racks
    const rack = (h = 2.4) => merge(part(rbox(0.9, h, 0.9, 0.04), '#1d2026', { p: [0, h / 2, 0] }), part(box(0.92, 0.1, 0.92), BLUE, { p: [0, h - 0.05, 0] }), Array.from({ length: 8 }, (_, k) => part(box(0.8, 0.2, 0.02), '#30343c', { p: [0, 0.25 + k * 0.27, 0.46] })), Array.from({ length: 8 }, (_, k) => part(box(0.05, 0.05, 0.02), GLOW, { p: [0.3, 0.25 + k * 0.27, 0.475] })), part(cyl(0.04, 0.04, h - 0.2, 8), COOL, { p: [0.47, h / 2, 0.3] }), part(cyl(0.04, 0.04, h - 0.2, 8), '#e5533d', { p: [0.47, h / 2, -0.3] }));
    const racks = [[-4.2, -3.6], [-3.2, -3.6], [-2.2, -3.6], [-1.2, -3.6], [-4.2, -1.6], [-3.2, -1.6], [-2.2, -1.6]];
    racks.forEach(([x, z]) => out.push(place(rack(), { p: [x, y0 + 0.1, z] })));
    // The open rack being filled, its frame only.
    const OX = -1.2, OZ = -1.6, OH = 2.4;
    out.push(part(box(0.92, 0.08, 0.92), '#1d2026', { p: [OX, y0 + 0.14, OZ] }), part(box(0.92, 0.1, 0.92), BLUE, { p: [OX, y0 + 0.1 + OH - 0.05, OZ] }), [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => part(box(0.06, OH, 0.06), '#1d2026', { p: [OX + a * 0.43, y0 + 0.1 + OH / 2, OZ + b * 0.43] })));
    // ---- the shelf of building blocks, front left: boards, GPUs, drives, power
    const SX = -2.6, SZ = 1.6;
    out.push(place(racking(R, 2, 3, BLUE, K.orange, ['#2f9e6e', '#3a3f47', '#76b900']), { p: [SX, y0 + 0.1, SZ], r: [0, Math.PI / 4, 0], s: 0.8 }));
    // ---- the cooling unit outside, right, and the pipe run to it
    const CX = 3.6, CZ = -1.0;
    out.push(part(rbox(1.8, 1.4, 1.6, 0.06), '#d8dde3', { p: [CX, y0 + 0.7, CZ] }), [0, 1].map((i) => part(cyl(0.5, 0.5, 0.12, 24), '#3a3f47', { p: [CX - 0.4 + i * 0.8, y0 + 1.45, CZ] })));
    const pipeOut = curve([[-1.75, y0 + 2.6, -3.6], [1.5, y0 + 2.7, -3.4], [2.8, y0 + 2.2, -2.0], [CX - 0.6, y0 + 1.2, CZ - 0.4]]), pipeBack = curve([[CX - 0.6, y0 + 0.9, CZ + 0.4], [2.6, y0 + 1.8, -0.6], [0.6, y0 + 2.6, -1.4], [-1.75, y0 + 2.5, -1.6]]);
    out.push(part(tubeOn(pipeOut, 0.07, hi() ? 60 : 14), '#e5533d'), part(tubeOn(pipeBack, 0.07, hi() ? 60 : 14), COOL));
    out.push(trees(R, [[4.6, 4.6], [1.6, 4.4], [4.6, 2.0], [-4.6, 4.4]]));
    // ---- moving parts
    const moving = [], P = 9, N = 8;
    // Sleds flying from the shelf into the open rack, bottom up; it lights up when full.
    for (let k = 0; k < N; k++) {
      const y = y0 + 0.1 + 0.25 + k * 0.27, path = curve([[SX + 0.2, y0 + 1.3, SZ], [(SX + OX) / 2 + 0.6, y0 + 2.9, (SZ + OZ) / 2 + 0.6], [OX + 0.2, y + 0.3, OZ + 1.2], [OX, y, OZ + 0.1]]);
      moving.push({ geo: merge(part(box(0.8, 0.2, 0.8), '#30343c'), part(box(0.05, 0.05, 0.02), GLOW, { p: [0.3, 0, 0.41] }), part(box(0.6, 0.04, 0.02), k % 2 ? '#76b900' : '#3a3f47', { p: [-0.05, 0.05, 0.41] })), pivot: [0, 0, 0], anim: (t) => {
        const f = cyc(t, P), a = 0.05 + k * 0.09, u = easeIO(win(f, a, a + 0.12)); if (f < a || f > 0.97) return { s: 0.001 }; const p = path.getPointAt(u); return { x: p.x, y: p.y, z: p.z, s: Math.min(1, (1 - f) / 0.03) }; } });
    }
    moving.push({ geo: part(box(0.95, 0.06, 0.95), GLOW), pivot: [OX, y0 + 0.1 + OH + 0.03, OZ], anim: (t) => { const f = cyc(t, P); return f > 0.82 && f < 0.97 ? { s: 1 + Math.sin(t * 12) * 0.03 } : { s: 0.001 }; } });
    // Coolant flowing out hot and back cold.
    for (let k = 0; k < 6; k++) { moving.push(rider(part(new THREE.SphereGeometry(0.1, 10, 7), '#ff8a65'), pipeOut, 3, k / 6)); moving.push(rider(part(new THREE.SphereGeometry(0.1, 10, 7), '#b3e5fc'), pipeBack, 3, k / 6)); }
    // The cooling unit's fans.
    [0, 1].forEach((i) => moving.push({ geo: merge([0, 1, 2, 3].map((k) => part(box(0.85, 0.02, 0.14), '#9aa1a9', { r: [0, k * Math.PI / 4, 0] }))), pivot: [CX - 0.4 + i * 0.8, y0 + 1.53, CZ], anim: (t) => ({ ry: t * 8 }) }));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Adobe: the tools every creative works in. On the giant canvas the picture is built the
  // Photoshop way, layer by layer: the layers float apart, then settle back into one image,
  // while finished PDFs fly off to the office next door. The red A stands behind.
  adobe: { finder: '#fa0f00', build: () => {
    const R = rand(116), out = [], RED = '#fa0f00';
    out.push(ground('#8fc66f'), part(rbox(6.4, 0.08, 6.0, 0.03), '#e8e3d8', { p: [-0.9, y0 + 0.04, -0.6] }));
    // ---- the red A, back left
    const AX = -3.4, AZ = -3.4, AQ = Math.PI / 4;
    const aPart = (pts) => part(extrude(pts.map(([x, y]) => [x * 1.4, y * 1.4]), 0.5), RED, { p: [AX, y0 + 0.3, AZ], r: [0, AQ, 0] });
    out.push(aPart([[-1.0, 0], [-0.6, 0], [-0.12, 2.2], [-0.52, 2.2]]), aPart([[0.6, 0], [1.0, 0], [0.52, 2.2], [0.12, 2.2]]), aPart([[-0.25, 0.3], [0.3, 0.3], [0.38, 0], [0.1, 0.0], [0.1, 0.02], [0.02, 0.9]]), part(rbox(2.0, 0.3, 1.0, 0.05), '#d6d0c4', { p: [AX, y0 + 0.15, AZ], r: [0, AQ, 0] }));
    // ---- the easel and canvas, middle, facing the camera
    const CX = 0.0, CZ = -0.6, CQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, AQ, 0)), cv = (dx, dy, dz) => { const v = new V(dx, dy, dz).applyQuaternion(CQ); return [CX + v.x, y0 + v.y, CZ + v.z]; };
    out.push(beam(cv(-1.0, 0, 0.4), cv(-0.6, 3.8, -0.1), 0.1, K.wood), beam(cv(1.0, 0, 0.4), cv(0.6, 3.8, -0.1), 0.1, K.wood), beam(cv(0, 0, -0.9), cv(0, 3.6, -0.15), 0.1, K.wood), part(rbox(2.6, 0.1, 0.25, 0.03), K.wood, { p: cv(0, 1.1, 0.25), q: CQ }));
    out.push(part(rbox(2.8, 2.2, 0.08, 0.03), '#f8f6f1', { p: cv(0, 2.3, 0.0), q: CQ }));
    // ---- the designer at the tablet, the office receiving PDFs
    out.push(place(desk(K.white, '#2b2f36'), { p: [2.0, y0, 1.6], r: [0, -Math.PI / 4, 0] }), place(fan('#3d7be0'), { p: [2.5, y0, 2.1], s: 1.4 }));
    out.push(place(block(1.8, 2.2, 1.6, '#e3e6ea', '#5b7fa6', 0.32), { p: [3.6, y0, -3.2] }), part(rbox(1.0, 0.1, 0.7, 0.03), '#c9ced6', { p: [3.6, y0 + 0.05, -1.9] }));
    // A video editor at the left desk: a timeline on the screen.
    out.push(place(desk(K.white, '#2b2f36'), { p: [-2.6, y0, 2.0], r: [0, Math.PI / 4, 0] }), place(fan('#8a6cf0'), { p: [-2.1, y0, 2.5], s: 1.4 }), part(rbox(0.9, 0.55, 0.04, 0.02), '#1d1f24', { p: [-2.75, y0 + 1.2, 1.85], r: [0, Math.PI / 4, 0] }));
    ['#9999ff', '#ffcf3f', '#8fc46a'].forEach((c, k) => out.push(part(box(0.7 - k * 0.15, 0.08, 0.01), c, { p: [-2.73 + k * 0.03, y0 + 1.05 + k * 0.12, 1.88], r: [0, Math.PI / 4, 0] })));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [-0.6, 4.4], [4.6, 0.9], [-4.6, 0.4]]));
    // ---- moving parts
    const moving = [], P = 8;
    // The layers: sky, hills, sun, title. Exploded toward the camera, then flattened into the canvas.
    const layers = [
      merge(part(box(2.6, 2.0, 0.02), '#8ccfff'), part(box(2.6, 0.7, 0.025), '#bfe6ff', { p: [0, 0.65, 0] })),
      merge(part(extrude([[-1.3, -1.0], [1.3, -1.0], [1.3, -0.2], [0.6, 0.25], [0.0, -0.3], [-0.7, 0.35], [-1.3, -0.1]], 0.03), '#5fae5b'), part(extrude([[-1.3, -1.0], [1.3, -1.0], [1.3, -0.6], [0.2, -0.35], [-1.3, -0.7]], 0.035), '#3f7f43')),
      part(new THREE.CircleGeometry(0.32, 32), '#ffcf3f', { p: [0.65, 0.5, 0] }),
      merge(part(rbox(1.4, 0.32, 0.03, 0.08), RED, { p: [-0.4, -0.6, 0] }), pixText('HELLO', 0.04, K.white, 0.035).translate(-0.4, -0.6, 0)),
    ];
    layers.forEach((g, k) => moving.push({ geo: g, pivot: cv(0, 2.3, 0.06 + k * 0.03), anim: (t) => { const f = cyc(t, P), out1 = easeIO(win(f, 0.1, 0.35)) - easeIO(win(f, 0.6, 0.85)), d = out1 * (0.2 + k * 0.55); const sx = k * 0.55 * out1; return { q: CQ, x: Math.sin(AQ) * d + Math.cos(AQ) * sx, z: Math.cos(AQ) * d - Math.sin(AQ) * sx, y: out1 * k * 0.3 }; } }));
    // Finished PDFs to the office.
    const pdf = merge(part(rbox(0.4, 0.52, 0.03, 0.02), K.white), part(box(0.4, 0.14, 0.035), RED, { p: [0, 0.19, 0] }), [0, 1, 2].map((i) => part(box(0.26, 0.03, 0.035), '#c9ced6', { p: [0, 0.02 - i * 0.08, 0] })));
    const send = curve([cv(1.2, 3.2, 0), [2.2, y0 + 4.0, -1.6], [3.6, y0 + 2.8, -2.2], [3.6, y0 + 0.4, -1.9]]);
    for (let k = 0; k < 3; k++) moving.push(rider(pdf, send, P, -k * 0.08, 0.85, 1.0, (t, u) => ({ ry: Math.PI / 4, rz: u * 1.5 })));
    // The designer's pen hand.
    moving.push({ geo: part(capsule(0.03, 0.3), '#2b2f36'), pivot: [2.0, y0 + 0.95, 1.6], anim: (t) => ({ rz: 0.6 + Math.sin(t * 6) * 0.2, rx: Math.cos(t * 5) * 0.2 }) });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Intuit: the money software for households and small businesses. The family's forms and the
  // bakery's receipts fly into the laptop in the middle; out come the family's refund (TurboTax)
  // and the bakery's books, its profit chart rising (QuickBooks).
  intuit: { finder: '#236cff', build: () => {
    const R = rand(117), out = [], BLUE = '#236cff', TT = '#d52b1e', QB = '#2ca01c';
    out.push(ground('#8fc66f'), part(cyl(1.9, 1.9, 0.04, 48), '#e8e3d8', { p: [0.2, y0 + 0.02, -0.2] }));
    // ---- the office, back left
    out.push(place(block(2.2, 3.6, 1.8, '#eef0f2', '#4a6a9a', 0.32), { p: [-3.4, y0, -3.4] }), part(box(2.24, 0.4, 1.84), BLUE, { p: [-3.4, y0 + 3.4, -3.4] }), place(pixText('INTUIT', 0.07, K.white, 0.03), { p: [-3.4, y0 + 3.4, -2.47] }));
    // ---- the family's home and their kitchen table, front left
    out.push(place(house2('#fbf3e3', '#a35a3c', TT), { p: [-3.1, y0, 1.6], r: [0, Math.PI / 2, 0], s: 0.8 }));
    out.push(part(rbox(1.2, 0.06, 0.8, 0.03), K.wood, { p: [-1.6, y0 + 0.7, 3.4] }), [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].map(([x, z]) => part(box(0.05, 0.68, 0.05), K.dark, { p: [-1.6 + x, y0 + 0.34, 3.4 + z] })));
    out.push(part(rbox(0.5, 0.25, 0.35, 0.03), '#c99a62', { p: [-1.9, y0 + 0.86, 3.4] }), place(fan('#3d7be0'), { p: [-1.0, y0, 3.9], s: 1.3 }), place(fan('#d6336c'), { p: [-2.3, y0, 3.9], s: 1.3 }));
    // ---- the bakery, back right: awning, display window, and its chart board
    const BX = 3.0, BZ = -2.6;
    out.push(part(rbox(2.4, 1.7, 1.6, 0.05), '#f6efe2', { p: [BX, y0 + 0.85, BZ] }), [0, 1, 2, 3, 4].map((i) => part(box(0.48, 0.05, 0.5), i % 2 ? K.white : QB, { p: [BX - 0.96 + i * 0.48, y0 + 1.55, BZ + 1.02], r: [0.45, 0, 0] })), part(box(1.4, 0.7, 0.04), '#9cc3e0', { p: [BX - 0.3, y0 + 0.75, BZ + 0.81] }));
    [0, 1, 2].forEach((i) => out.push(part(torus(0.12, 0.05, TAU, 16), '#d9a05b', { p: [BX - 0.75 + i * 0.4, y0 + 0.5, BZ + 0.86], r: [Math.PI / 2, 0, 0] })));
    out.push(part(rbox(1.6, 1.2, 0.08, 0.03), K.white, { p: [3.9, y0 + 0.9, 0.4], r: [0, -Math.PI / 4, 0] }), part(box(0.05, 0.9, 0.05), K.dark, { p: [3.9, y0 + 0.3, 0.4] }), place(fan('#f29a3a'), { p: [2.0, y0, -0.8], s: 1.3 }));
    // ---- the laptop in the middle: base, open screen with the check
    const LX = 0.2, LZ = -0.2, LQ = Math.PI / 4;
    out.push(part(rbox(2.4, 0.12, 1.6, 0.05), '#c9ced6', { p: [LX, y0 + 0.3, LZ], r: [0, LQ, 0] }), part(cyl(0.5, 0.6, 0.24, 24), '#2b3440', { p: [LX, y0 + 0.12, LZ] }));
    const scrQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.25, LQ, 0, 'YXZ')), off = new V(0, 0.8, -0.78).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, LQ, 0)));
    out.push(part(rbox(2.4, 1.6, 0.08, 0.06), '#2b3440', { p: [LX + off.x, y0 + 0.36 + off.y, LZ + off.z], q: scrQ }), part(box(2.2, 1.4, 0.02), K.white, { p: [LX + off.x * 0.95, y0 + 0.36 + off.y, LZ + off.z * 0.95], q: scrQ }));
    out.push(trees(R, [[4.6, 4.6], [1.6, 4.4], [4.6, 2.4], [-0.6, -4.6], [0.6, 2.4]]));
    // ---- moving parts
    const moving = [], P = 10, top = [LX + off.x, y0 + 1.4, LZ + off.z];
    // The check on the screen pops when each return is done.
    moving.push({ geo: tickGeo(0.4), pivot: [LX + off.x * 0.9, y0 + 0.36 + off.y, LZ + off.z * 0.9], anim: (t) => { const f = cyc(t, P / 2); return f > 0.4 && f < 0.95 ? { q: scrQ, s: back(win(f, 0.4, 0.5)) } : { s: 0.001 }; } });
    const form = merge(part(box(0.4, 0.52, 0.02), K.white), part(box(0.4, 0.1, 0.025), TT, { p: [0, 0.2, 0] }), [0, 1, 2].map((i) => part(box(0.26, 0.03, 0.025), '#c9ced6', { p: [0, 0.02 - i * 0.09, 0] })));
    const receipt = merge(part(box(0.3, 0.5, 0.02), '#fbf3e3'), part(box(0.3, 0.06, 0.025), QB, { p: [0, 0.2, 0] }), [0, 1, 2].map((i) => part(box(0.2, 0.025, 0.025), '#9aa1a9', { p: [0, 0.05 - i * 0.08, 0] })));
    const inF = curve([[-1.9, y0 + 1.1, 3.4], [-1.2, y0 + 2.6, 1.8], top]), inR = curve([[BX - 0.4, y0 + 1.4, BZ + 1.0], [1.6, y0 + 2.8, -1.2], top]);
    for (let k = 0; k < 3; k++) { moving.push(rider(form, inF, P / 2, -k * 0.08, 0, 0.35, (t, u) => ({ ry: Math.PI / 4, rz: u * 3 }))); moving.push(rider(receipt, inR, P / 2, -k * 0.08 - 0.5, 0, 0.35, (t, u) => ({ ry: Math.PI / 4, rz: -u * 3 }))); }
    // The refund back to the family.
    const outF = curve([top, [-0.9, y0 + 2.8, 2.0], [-1.6, y0 + 1.0, 3.4]]);
    moving.push(rider(merge(part(rbox(0.6, 0.3, 0.04, 0.03), '#7cbf7d'), pixText('$', 0.04, '#2f6f3a', 0.05)), outF, P / 2, 0, 0.55, 0.9, () => ({ ry: Math.PI / 4 })));
    // The bakery's chart rising, bar by bar.
    for (let k = 0; k < 4; k++) moving.push({ geo: part(box(0.22, 0.8, 0.03), QB, { p: [0, 0.4, 0] }), pivot: [3.9 - 0.42 * Math.cos(Math.PI / 4) + k * 0.28 * Math.cos(Math.PI / 4), y0 + 0.4, 0.4 + 0.42 * Math.sin(Math.PI / 4) - k * 0.28 * Math.sin(Math.PI / 4) + 0.06], anim: (t) => { const f = cyc(t, P); return { ry: -Math.PI / 4, sy: (0.2 + k * 0.2) * (0.4 + 0.6 * easeOut(win(f, 0.1 + k * 0.15, 0.3 + k * 0.15))) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Workday: one system for a company's people and its money. The org chart stands in the
  // middle; a new hire joins and is wired in, and on payday the pay flows down through the
  // whole tree at once, under Workday's rising sun.
  workday: { finder: '#0875e1', build: () => {
    const R = rand(118), out = [], BLUE = '#0875e1', SUN = '#f38b00';
    out.push(ground('#8fc66f'), part(cyl(3.0, 3.0, 0.05, 48), '#e8e3d8', { p: [0.8, y0 + 0.025, -0.6] }));
    // ---- the sun arc behind it all, back left
    out.push(part(torus(2.05, 0.2, Math.PI, 48), SUN, { p: [-2.3, y0 + 0.2, -2.6], r: [0, Math.PI / 4, 0] }), part(torus(1.5, 0.1, Math.PI, 48), '#ffc35a', { p: [-2.3, y0 + 0.2, -2.6], r: [0, Math.PI / 4, 0] }));
    for (let k = 0; k < 7; k++) { const a = Math.PI * (k + 0.5) / 7, v = new V(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0).applyAxisAngle(new V(0, 1, 0), Math.PI / 4); out.push(part(rbox(0.16, 0.5, 0.12, 0.05), SUN, { p: [-2.3 + v.x, y0 + 0.2 + v.y, -2.6 + v.z], q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, a - Math.PI / 2, 'YXZ')) })); }
    // ---- the org chart: three tiers of cards on posts, wired together
    const Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), at = (u, y) => { const v = new V(u, 0, 0).applyQuaternion(Q); return [0.6 + v.x, y0 + y, -0.2 + v.z]; };
    const tiers = [[[0], 4.3], [[-2.0, 2.0], 2.9], [[-3.2, -1.6, 0, 1.6, 3.2], 1.5]];
    const card = (c) => place(merge(part(rbox(0.9, 0.6, 0.08, 0.08), K.white), part(new THREE.SphereGeometry(0.12, 12, 8), c, { p: [-0.22, 0.08, 0.05], s: [1, 1, 0.4] }), part(new THREE.CircleGeometry(0.17, 16, 0, Math.PI), c, { p: [-0.22, -0.2, 0.05] }), part(box(0.3, 0.05, 0.02), '#c9ced6', { p: [0.15, 0.08, 0.05] }), part(box(0.24, 0.05, 0.02), '#c9ced6', { p: [0.12, -0.06, 0.05] })), { s: 1.45 });
    const cols = ['#3d7be0', '#e5533d', '#2f9e6e', '#8a6cf0', '#f29a3a', '#d6336c', '#3fb8a8', '#f2c94c'];
    let ci = 0;
    tiers.forEach(([us, y]) => us.forEach((u) => out.push(place(card(cols[ci++ % 8]), { p: at(u, y), r: [0, Math.PI / 4, 0] }))));
    const link = (a, b) => out.push(beam(a, [a[0], (a[1] + b[1]) / 2, a[2]], 0.04, '#7b828c'), beam([a[0], (a[1] + b[1]) / 2, a[2]], [b[0], (a[1] + b[1]) / 2, b[2]], 0.04, '#7b828c'), beam([b[0], (a[1] + b[1]) / 2, b[2]], b, 0.04, '#7b828c'));
    const nodes = tiers.map(([us, y]) => us.map((u) => at(u, y)));
    nodes[1].forEach((n) => link([nodes[0][0][0], nodes[0][0][1] - 0.3, nodes[0][0][2]], [n[0], n[1] + 0.3, n[2]]));
    nodes[2].forEach((n, i) => { const p = nodes[1][i < 3 ? 0 : 1]; link([p[0], p[1] - 0.3, p[2]], [n[0], n[1] + 0.3, n[2]]); });
    nodes[2].forEach((n) => out.push(beam([n[0], y0 + 0.05, n[2]], [n[0], n[1] - 0.44, n[2]], 0.05, '#c9ced6')));
    // The new hire's empty spot, end of the bottom row.
    const NEW = at(4.6, 1.5);
    out.push(beam([NEW[0], y0 + 0.05, NEW[2]], [NEW[0], NEW[1] - 0.44, NEW[2]], 0.05, '#c9ced6'));
    // ---- the office, right, with people
    out.push(place(block(1.8, 2.4, 1.6, '#eef0f2', '#4a6a9a', 0.32), { p: [-3.6, y0, 2.8] }), part(box(1.84, 0.3, 1.64), BLUE, { p: [-3.6, y0 + 2.3, 2.8] }));
    out.push(trees(R, [[4.6, 4.6], [-1.4, 4.4], [-4.6, 0.6], [1.6, 4.4], [4.6, 1.4], [-4.6, -4.6]]));
    // ---- moving parts
    const moving = [], P = 10;
    // The new hire walks in and their card pops up and links in.
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, P), u = easeIO(win(f, 0, 0.25)); return { x: 3.4 + u * 0.4, z: 3.6 - u * 5.2, ry: Math.PI / 2, still: f > 0.25, s: f > 0.95 ? 1 - win(f, 0.95, 1) : Math.min(1, f / 0.03) }; }, { shirt: '#d6336c', pants: '#2b3a55', y: y0 }));
    moving.push({ geo: card('#d6336c'), pivot: NEW, anim: (t) => { const f = cyc(t, P); return f < 0.25 || f > 0.97 ? { s: 0.001 } : { ry: Math.PI / 4, s: back(win(f, 0.25, 0.35)) }; } });
    const nl = nodes[1][1], mid = (nl[1] + NEW[1]) / 2;
    moving.push({ geo: merge(beam([0, 0, 0], [0, 1, 0], 0.04, '#7b828c')), pivot: [NEW[0], NEW[1] + 0.3, NEW[2]], anim: (t) => { const f = cyc(t, P); return f < 0.33 || f > 0.97 ? { s: 0.001 } : { sy: (mid - NEW[1] - 0.3) * easeOut(win(f, 0.33, 0.4)) + 0.001 }; } });
    // Payday: coins drop down every branch at once.
    const coinG = place(coin(0.14, 0.05), { r: [Math.PI / 2, 0, 0] }), top = nodes[0][0];
    [...nodes[2], NEW].forEach((n, i) => { const p = nodes[1][i < 3 ? 0 : 1], path = curve([[top[0], top[1] + 0.5, top[2]], [p[0], p[1] + 0.6, p[2]], [n[0], n[1] + 0.5, n[2]]]); moving.push(rider(coinG, path, P, i === 5 ? 0 : 0, 0.5, 0.75, (t) => ({ ry: t * 5 }))); moving.push(pulse(n[0], n[1] - 0.34, n[2], SUN, P, 0.75, 0.3)); });
    // The sun pulsing as it rises.
    moving.push({ geo: part(new THREE.SphereGeometry(1.0, hi() ? 32 : 12, hi() ? 16 : 6, 0, TAU, 0, Math.PI / 2), '#ffd27a'), pivot: [-2.3, y0 + 0.2, -2.6], anim: (t) => ({ s: 0.95 + Math.sin(t * 1.5) * 0.05 }) });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Motorola Solutions: the radios that first responders bet their lives on. A house catches
  // fire; the call reaches the 911 centre, the tower carries the dispatch, and the fire truck,
  // the police car and the ambulance all hear it and roll.
  motorolasolutions: { finder: '#0057b8', build: () => {
    const R = rand(119), out = [], BLUE = '#0057b8';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.3), '#5b616b', { p: [0, y0 + 0.015, 1.6] }), part(box(1.3, 0.03, 4.0), '#5b616b', { p: [1.2, y0 + 0.015, -1.6] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.6, 0.01, 0.06), '#f2c94c', { p: [-4.6 + i * 1.3, y0 + 0.035, 1.6] }));
    // ---- the radio tower, back left
    const TX = -3.6, TZ = -3.6, TH = 6.0;
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.3; out.push(beam([TX + Math.cos(a) * 0.5, y0, TZ + Math.sin(a) * 0.5], [TX + Math.cos(a) * 0.12, y0 + TH, TZ + Math.sin(a) * 0.12], 0.06, i ? '#e5533d' : K.white)); }
    if (hi()) for (let y = 0.5; y < TH; y += 0.5) { const r = 0.5 - (y / TH) * 0.38; out.push(part(torus(r, 0.02, TAU, 12), '#c9ced6', { p: [TX, y0 + y, TZ], r: [Math.PI / 2, 0, 0] })); }
    out.push(part(rbox(0.3, 0.6, 0.2, 0.05), K.white, { p: [TX + 0.15, y0 + 4.8, TZ + 0.1] }), part(ball(0.1), '#e5533d', { p: [TX, y0 + TH + 0.1, TZ] }));
    // ---- the 911 dispatch centre, back right
    const DX = 3.2, DZ = -3.2;
    out.push(place(block(2.6, 1.8, 2.0, '#eef0f2', '#4a6a9a', 0.4), { p: [DX, y0, DZ] }), part(box(2.64, 0.3, 2.04), BLUE, { p: [DX, y0 + 1.7, DZ] }), place(pixText('911', 0.08, K.white, 0.03), { p: [DX, y0 + 1.7, DZ + 1.03] }), place(radarDish(0.4), { p: [DX + 0.6, y0 + 1.85, DZ - 0.4] }));
    // ---- the station: fire house with its bay, left of the road
    const SX = -2.0, SZ = -0.6;
    out.push(part(rbox(2.4, 1.6, 1.4, 0.05), '#c0392b', { p: [SX, y0 + 0.8, SZ - 0.2] }), part(box(0.9, 1.0, 0.04), '#e9ecef', { p: [SX - 0.5, y0 + 0.55, SZ + 0.52] }), part(box(0.9, 1.0, 0.04), '#e9ecef', { p: [SX + 0.6, y0 + 0.55, SZ + 0.52] }), part(prism(2.6, 0.5, 1.6), '#7b2a20', { p: [SX, y0 + 1.6, SZ - 0.2] }));
    // ---- the house, front right, where the fire is
    const HX = 3.4, HZ = 3.6;
    out.push(place(home('#fbf3e3', '#5b6b7d', 1.6, 1.4, 1.0), { p: [HX, y0, HZ], r: [0, -Math.PI / 2, 0] }), part(cyl(0.05, 0.05, 0.6, 8), '#e5533d', { p: [HX - 1.4, y0 + 0.3, HZ - 0.8] }));
    // ---- the big radio, front left: the APX handheld as a monument
    const RX = -3.6, RZ = 3.4, RQ = Math.PI / 4;
    out.push(part(rbox(0.9, 1.9, 0.55, 0.15), '#1d1f24', { p: [RX, y0 + 1.15, RZ], r: [0, RQ, 0] }), part(rbox(0.7, 0.45, 0.05, 0.05), '#4fc3f7', { p: [RX + 0.2, y0 + 1.6, RZ + 0.2], r: [0, RQ, 0] }), part(cyl(0.07, 0.09, 1.2, 12), '#2b2f36', { p: [RX - 0.15, y0 + 2.6, RZ - 0.15] }), part(cyl(0.1, 0.1, 0.12, 14), '#f2c94c', { p: [RX + 0.15, y0 + 2.15, RZ + 0.0] }), part(rbox(1.2, 0.2, 1.0, 0.05), '#c9ced6', { p: [RX, y0 + 0.1, RZ], r: [0, RQ, 0] }));
    for (let k = 0; k < 3; k++) out.push(part(box(0.5, 0.04, 0.05), '#3a3f47', { p: [RX + 0.2, y0 + 1.0 - k * 0.12, RZ + 0.2], r: [0, RQ, 0] }));
    out.push(trees(R, [[0.4, -4.6], [-0.6, -2.4], [4.6, 0.4], [-0.4, 4.4], [2.0, 4.6]]));
    // ---- moving parts
    const moving = [], P = 12;
    // The fire, flaring then put out.
    moving.push({ geo: place(flameGeo(), { r: [Math.PI, 0, 0] }), pivot: [HX, y0 + 1.6, HZ], anim: (t) => { const f = cyc(t, P), s = f < 0.05 ? win(f, 0, 0.05) : f < 0.75 ? 1 : 1 - win(f, 0.75, 0.9); return { s: s * (0.45 + Math.sin(t * 13) * 0.04) + 0.001 }; } });
    // The call to 911, then the tower's dispatch rings.
    moving.push(rider(part(new THREE.SphereGeometry(0.14, 12, 8), '#ff5252'), curve([[HX, y0 + 2.0, HZ], [3.8, y0 + 3.2, 0.4], [DX, y0 + 2.2, DZ]]), P, 0, 0.05, 0.18));
    moving.push(rider(part(new THREE.SphereGeometry(0.14, 12, 8), '#4fc3f7'), curve([[DX, y0 + 2.2, DZ], [0, y0 + 5.0, -4.2], [TX, y0 + TH - 0.4, TZ]]), P, 0, 0.18, 0.28));
    for (let k = 0; k < 3; k++) moving.push({ geo: part(torus(1, 0.03, TAU, 48), '#4fc3f7', { r: [Math.PI / 2, 0, 0] }), pivot: [TX, y0 + TH - 0.6, TZ], anim: (t) => { const f = cyc(t, P), u = win(f, 0.28 + k * 0.06, 0.55 + k * 0.06); return u <= 0 || u >= 1 ? { s: 0.001 } : { s: 0.4 + u * 3.2, y: -u * 2.0 }; } });
    // The responders: lights flashing, each rolling toward the fire.
    const lightbar = (c1, c2) => merge(part(box(0.12, 0.08, 0.3), c1, { p: [0, 0, -0.16] }), part(box(0.12, 0.08, 0.3), c2, { p: [0, 0, 0.16] }));
    const truck = merge(part(rbox(2.2, 0.8, 0.9, 0.08), '#c0392b', { p: [0, 0.6, 0] }), part(rbox(0.6, 0.6, 0.86, 0.08), '#c0392b', { p: [1.3, 0.55, 0] }), part(box(0.04, 0.3, 0.7), '#26323f', { p: [1.6, 0.7, 0] }), part(box(1.9, 0.08, 0.25), '#c9ced6', { p: [-0.1, 1.08, 0] }), [[-0.7, 0.42], [0.9, 0.42], [-0.7, -0.42], [0.9, -0.42]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] })));
    const go = (from, to, a, b) => (t) => { const f = cyc(t, P), u = easeIO(win(f, a, b)) - easeIO(win(f, 0.9, 1)); return { x: from[0] + (to[0] - from[0]) * u, z: from[1] + (to[1] - from[1]) * u }; };
    const fireGo = go([SX - 0.5, 1.6], [2.0, 1.6], 0.35, 0.6), copGo = go([-4.2, 1.85], [1.2, 1.85], 0.32, 0.55), ambGo = go([1.2, -3.0], [1.2, 0.9], 0.35, 0.62);
    const veh = (geo, fn, ry, light) => { const i = moving.length; moving.push({ geo, pivot: [0, y0, 0], anim: (t) => ({ ...fn(t), ry }) }); moving.push({ geo: lightbar(light, '#3d7be0'), pivot: light === '#e5533d' ? [0.2, 1.2, 0] : [0, 1.2, 0], parent: i, anim: (t) => ({ s: cyc(t, P) > 0.3 && cyc(t, P) < 0.9 ? (Math.sin(t * 20) > 0 ? 1 : 0.6) : 0.001 }) }); };
    veh(place(truck, { s: 0.75 }), fireGo, 0, '#e5533d');
    veh(merge(sedan('#f4f5f6'), part(box(1.0, 0.14, 1.04), '#1d1f24', { p: [0.1, 0.5, 0] })), copGo, 0, '#e5533d');
    veh(place(van(K.white, '#e5533d'), { s: 0.9 }), ambGo, -Math.PI / 2, '#e5533d');
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
};
