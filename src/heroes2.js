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
  // HP: the printer in every home, and the ink that never runs out. The giant printer in the
  // middle of the neighbourhood prints page after page and its ink gauges fall; the Instant Ink
  // van does its round of the homes, and when it reaches the printer, fresh cartridges drop in
  // through the lid before it ever runs dry.
  hp: { finder: '#0096d6', build: () => {
    const R = rand(214), out = [], BLUE = '#0096d6', INK = '#1d1f24';
    out.push(ground('#8fc66f'));
    // ---- the ring road round the middle, and the homes outside it
    const RD = 3.05;
    [[0, -RD, 6.9, 0.8], [0, RD, 6.9, 0.8], [-RD, 0, 0.8, 6.9], [RD, 0, 0.8, 6.9]].forEach(([x, z, w, d]) => out.push(part(box(w, 0.03, d), '#5b616b', { p: [x, y0 + 0.015, z] })));
    for (let k = -2; k <= 2; k++) out.push(part(box(0.5, 0.01, 0.06), '#f2c94c', { p: [k * 1.3, y0 + 0.035, RD] }), part(box(0.06, 0.01, 0.5), '#f2c94c', { p: [RD, y0 + 0.035, k * 1.3] }));
    const homes = [[-4.2, -1.6, Math.PI / 2], [-4.2, 1.8, Math.PI / 2], [-1.6, 4.25, 0], [1.8, 4.25, 0], [4.2, 1.8, -Math.PI / 2], [4.2, -1.6, -Math.PI / 2]];
    homes.forEach(([x, z, ry], i) => out.push(place(home(['#fbf3e3', '#e8eef4', '#f6e7e1', '#eef3e6', '#f1e2c6', '#fbf3e3'][i], ['#8a5a36', '#5b6b7d', '#a35a3c', '#3f6f8f', '#6f4a2c', '#5b6b7d'][i], 1.3, 1.1, 0.9), { p: [x, y0, z], r: [0, ry, 0] }), part(cyl(0.03, 0.03, 0.7, 6), '#6f4a2c', { p: [x * 0.84, y0 + 0.35, z * 0.84 + (ry ? 0.6 : 0)] }), part(rbox(0.26, 0.2, 0.18, 0.04), BLUE, { p: [x * 0.84, y0 + 0.75, z * 0.84 + (ry ? 0.6 : 0)] })));
    // ---- the giant printer, turned to face the camera
    const PX = -0.4, PZ = -0.4, PQ = Math.PI / 4, PQq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, PQ, 0));
    const L = (x, y, z) => { const v = new V(x, y, z).applyQuaternion(PQq); return [PX + v.x, y0 + y, PZ + v.z]; };
    const printer = merge(
      part(rbox(4.0, 0.3, 2.8, 0.06), '#c9ced6', { p: [0, 0.15, 0] }),
      part(rbox(3.8, 1.5, 2.5, 0.2), '#f4f5f6', { p: [0, 1.05, -0.1] }), part(rbox(3.7, 0.22, 2.4, 0.08), '#3a3f47', { p: [0, 1.9, -0.1] }),
      part(box(3.0, 0.08, 0.06), INK, { p: [0, 1.25, 1.16] }), part(rbox(3.2, 0.06, 1.3, 0.03), '#d8dde3', { p: [0, 0.95, 1.7] }), part(rbox(0.7, 0.4, 0.06, 0.04), INK, { p: [1.3, 1.55, 1.16] }), part(box(0.6, 0.3, 0.02), '#4fc3f7', { p: [1.3, 1.55, 1.2] }),
      part(cyl(0.42, 0.42, 0.06, 32), BLUE, { p: [-1.2, 1.4, 1.16], r: [Math.PI / 2, 0, 0] }), pixText('HP', 0.09, K.white, 0.08).translate(-1.2, 1.4, 1.18),
      part(rbox(0.06, 1.0, 1.6, 0.04), INK, { p: [1.91, 1.05, -0.1] }));
    out.push(place(printer, { p: [PX, y0, PZ], r: [0, PQ, 0] }));
    out.push(trees(R, [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]], 0.5));
    // ---- moving parts
    const moving = [], P = 16;
    // The ink gauges on the printer's side: falling all cycle, refilled when the cartridges land.
    const level = (t, k) => { const f = cyc(t, P); return f < 0.78 ? 1 - easeIn(win(f, 0, 0.78)) * (0.62 + k * 0.08) : 0.3 + 0.7 * easeOut(win(f, 0.84, 0.92)); };
    ['#00b7eb', '#e5007e', '#ffe600', '#1d1f24'].forEach((c, k) => moving.push({ geo: part(box(0.04, 0.8, 0.28), c, { p: [0, 0.4, 0] }), pivot: L(1.95, 0.6, -0.65 + k * 0.36), anim: (t) => ({ ry: PQ, sy: level(t, k) + 0.001 }) }));
    // Pages: each slides out of the slot onto the tray, showing its picture; the stack grows.
    const page = (k) => merge(part(box(1.5, 0.015, 1.05), K.white), part(box(1.3, 0.02, 0.5), ['#9fd0ff', '#ffe0a8', '#bfe6b0', '#f8c4d4'][k % 4], { p: [0, 0, -0.15] }), part(new THREE.CylinderGeometry(0.12, 0.12, 0.022, 14), ['#ffcf3f', '#e5533d', '#3d7be0', '#2f9e6e'][k % 4], { p: [0.35, 0, -0.2] }), [0, 1].map((j) => part(box(1.1, 0.02, 0.06), '#9aa1a9', { p: [0, 0, 0.2 + j * 0.15] })));
    for (let k = 0; k < 4; k++) moving.push({ geo: page(k), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, 3, k / 4), u = easeOut(win(f, 0, 0.5)), p = L(0, 1.0 - u * 0.02, 0.9 + u * 0.8); return { x: p[0], y: p[1], z: p[2], ry: PQ, s: f > 0.9 ? 1 - win(f, 0.9, 1) + 0.001 : 1 }; } });
    moving.push({ geo: part(box(1.5, 0.4, 1.05), K.white, { p: [0, 0.2, 0] }), pivot: L(0, 0.98, 1.75), anim: (t) => ({ ry: PQ, sy: 0.1 + 0.9 * cyc(t, P) }) });
    // The lid lifting for the cartridges.
    moving.push({ geo: part(rbox(3.7, 0.12, 2.4, 0.06), '#5b616b', { p: [0, 0, 1.2] }), pivot: L(0, 2.04, -1.3), anim: (t) => ({ ry: PQ, rx: -0.6 * (easeIO(win(cyc(t, P), 0.76, 0.8)) - easeIO(win(cyc(t, P), 0.9, 0.94))) }) });
    // The Instant Ink van: round the ring road, stopping at each home and at the printer.
    const loop = curve([[RD, y0, -RD], [RD, y0, RD], [-RD, y0, RD], [-RD, y0, -RD]], true);
    const vanU = (f) => (f < 0.72 ? f / 0.72 : 1) % 1;
    moving.push({ geo: place(van(K.white, BLUE), { s: 0.8 }), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P), u = f < 0.72 ? easeIO(win(f, 0, 0.72)) * 0.75 + 0.125 : 0.875, a = along(loop, u % 1); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry }; } });
    // Parcels to each home as it passes, and the four cartridges to the printer at the end.
    homes.forEach(([x, z], i) => moving.push(pulse(x * 0.84, y0 + 0.05, z * 0.84, BLUE, P, 0.12 + i * 0.1, 0.4)));
    const vanStop = loop.getPointAt(0.875);
    ['#00b7eb', '#e5007e', '#ffe600', '#1d1f24'].forEach((c, k) => moving.push(rider(merge(part(rbox(0.36, 0.5, 0.24, 0.04), '#2b2f36'), part(box(0.37, 0.14, 0.25), c, { p: [0, 0.12, 0] })), curve([[vanStop.x, y0 + 1.2, vanStop.z], [(vanStop.x + PX) / 2, y0 + 3.6, (vanStop.z + PZ) / 2], L(-0.9 + k * 0.6, 2.8, -0.2), L(-0.9 + k * 0.6, 1.95, -0.2)]), P, -k * 0.012, 0.74, 0.86, (t, u) => ({ ry: PQ + u * 3 }))));
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
  // Charter (Spectrum): the cable already runs to every house. From the headend with its
  // dishes, light races down the line on the poles and into each home; one by one the houses
  // light up with TV and Wi-Fi.
  charter: { finder: '#0099d8', build: () => {
    const R = rand(120), out = [], BLUE = '#0099d8', NAVY = '#003057';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.2), '#5b616b', { p: [0, y0 + 0.015, 0.4] }), part(box(1.2, 0.03, 4.2), '#5b616b', { p: [-0.4, y0 + 0.015, 2.9] }));
    // ---- the headend, back left: a low building with satellite dishes
    const HX = -3.2, HZ = -3.4;
    out.push(part(rbox(2.6, 1.4, 1.8, 0.05), '#e6e9ed', { p: [HX, y0 + 0.7, HZ] }), part(box(2.64, 0.3, 1.84), NAVY, { p: [HX, y0 + 1.3, HZ] }), place(pixText('SPECTRUM', 0.05, K.white, 0.02), { p: [HX, y0 + 1.3, HZ + 0.93] }));
    [[-4.4, -1.6, 0.7], [-2.6, -1.8, 0.55], [-1.2, -4.0, 0.6]].forEach(([x, z, r]) => out.push(part(cyl(0.06, 0.08, 0.8, 10), '#9aa1a9', { p: [x, y0 + 0.4, z] }), place(radarDish(r), { p: [x, y0 + 0.9, z], r: [0, -2.3, 0] })));
    // ---- the homes along the street
    const homes = [[1.4, -1.6, 0], [3.6, -1.6, 0], [1.8, 2.6, Math.PI], [3.8, 2.6, Math.PI], [-2.6, 2.4, Math.PI]];
    homes.forEach(([x, z, ry], i) => out.push(place(home(['#fbf3e3', '#e8eef4', '#f6e7e1', '#eef3e6', '#f1e2c6'][i], ['#8a5a36', '#5b6b7d', '#a35a3c', '#3f6f8f', '#6f4a2c'][i], 1.6, 1.3, 1.0), { p: [x, y0, z], r: [0, ry === Math.PI ? Math.PI / 2 : 0, 0] })));
    // ---- the poles and the cable run: headend → along the street → drops to each house
    const poles = [-1.8, 0.4, 2.6, 4.6], PY = 2.0, PZ = -0.35;
    poles.forEach((x) => out.push(part(cyl(0.06, 0.08, PY + 0.2, 10), '#8a5a36', { p: [x, y0 + (PY + 0.2) / 2, PZ] }), part(box(0.05, 0.05, 0.6), '#6f4a2c', { p: [x, y0 + PY, PZ] }), part(cyl(0.12, 0.12, 0.3, 10), '#5b616b', { p: [x, y0 + PY - 0.3, PZ + 0.1] })));
    const trunk = curve([[HX + 1.3, y0 + 1.2, HZ + 0.4], [-1.8, y0 + PY, PZ], [-0.7, y0 + PY - 0.18, PZ], [0.4, y0 + PY, PZ], [1.5, y0 + PY - 0.18, PZ], [2.6, y0 + PY, PZ], [3.6, y0 + PY - 0.18, PZ], [4.6, y0 + PY, PZ]]);
    out.push(part(tubeOn(trunk, 0.025, hi() ? 120 : 30), '#1d1f24'));
    const drops = homes.map(([x, z, ry], i) => { const px = poles.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a)), dz = ry ? 0.55 : -0.55; return curve([[px, y0 + PY, PZ], [(px + x) / 2, y0 + PY - 0.4, (PZ + z + dz) / 2], [x, y0 + 1.0, z + dz]]); });
    drops.forEach((c) => out.push(part(tubeOn(c, 0.018, hi() ? 32 : 10), '#1d1f24')));
    out.push(trees(R, [[4.6, 4.6], [0.4, 4.6], [-4.6, 4.6], [4.6, -4.4], [0.4, -4.4], [-4.6, 0.8]]));
    // ---- moving parts
    const moving = [], P = 8;
    // Light down the trunk line.
    for (let k = 0; k < 8; k++) moving.push(rider(part(new THREE.SphereGeometry(0.09, 10, 7), '#7fe3ff'), trunk, 2.4, k / 8));
    // Into each home, which lights up with TV and Wi-Fi.
    homes.forEach(([x, z, ry], i) => {
      const at = 0.1 + i * 0.15;
      moving.push(rider(part(new THREE.SphereGeometry(0.11, 10, 7), '#7fe3ff'), drops[i], P, 0, at, at + 0.1));
      moving.push({ geo: merge([0, 1, 2].map((k) => part(torus(0.18 + k * 0.14, 0.035, Math.PI / 2, 16), BLUE, { r: [0, 0, Math.PI / 4] }))), pivot: [x, y0 + 2.0, z], anim: (t) => { const f = cyc(t, P); return f > at + 0.1 ? { ry: Math.PI / 4, s: Math.min(1, win(f, at + 0.1, at + 0.16)) * (1 + Math.sin(t * 4 + i) * 0.06) * Math.min(1, (1 - f) / 0.05) + 0.001 } : { s: 0.001 }; } });
      moving.push({ geo: part(box(0.5, 0.36, 0.05), '#7fe3ff'), pivot: [x + (ry ? 0.55 : 0.2), y0 + 0.62, z + (ry ? 0.2 : 0.55)], anim: (t) => { const f = cyc(t, P); return f > at + 0.1 && f < 0.97 ? { ry: ry ? Math.PI / 2 : 0 } : { s: 0.001 }; } });
    });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Lowe's: everything for the job, from the store to the backyard. The pickup loads lumber at
  // the big blue store and drives it home, where the deck goes down board by board.
  lowes: { finder: '#004990', build: () => {
    const R = rand(121), out = [], BLUE = '#004990';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.3), '#5b616b', { p: [0, y0 + 0.015, 0.2] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.6, 0.01, 0.06), '#f2c94c', { p: [-4.6 + i * 1.3, y0 + 0.035, 0.2] }));
    // ---- the store, back: a big box with the house-shaped sign and the garden centre
    const SX = -1.4, SZ = -3.1;
    out.push(part(rbox(6.0, 2.2, 2.6, 0.05), '#e9e4da', { p: [SX, y0 + 1.1, SZ] }), part(box(6.04, 0.3, 2.64), BLUE, { p: [SX, y0 + 2.05, SZ] }), part(box(1.6, 1.4, 0.04), '#2a3c50', { p: [SX + 0.6, y0 + 0.7, SZ + 1.31] }));
    const signG = merge(part(extrude([[-1.0, 0], [1.0, 0], [1.0, 0.6], [0, 1.1], [-1.0, 0.6]], 0.14), BLUE), pixText("LOWE'S", 0.075, K.white, 0.18).translate(0, 0.42, 0));
    out.push(place(signG, { p: [SX + 0.6, y0 + 2.25, SZ + 1.3] }));
    // The lumber yard on the left end: racks of boards.
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) out.push(part(box(2.0, 0.12, 0.6), k % 2 ? '#e2c089' : '#d6b47a', { p: [-4.0, y0 + 0.3 + k * 0.14 + r * 0.0, -0.9 - r * 0.8] }));
    [[-4.0, -0.9], [-4.0, -1.7], [-4.0, -2.5]].forEach(([x, z]) => out.push(part(box(2.2, 0.06, 0.08), '#7b828c', { p: [x, y0 + 0.2, z] })));
    // Garden centre on the right end: plants in rows.
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) out.push(part(cyl(0.16, 0.12, 0.2, 10), '#8a5a36', { p: [2.4 + i * 0.4, y0 + 0.1, -1.4 - j * 0.45] }), part(new THREE.SphereGeometry(0.2, 10, 7), ['#5fae45', '#e5533d', '#f2c94c', '#d6336c'][(i + j) % 4], { p: [2.4 + i * 0.4, y0 + 0.32, -1.4 - j * 0.45] }));
    // ---- the backyard across the road: the house, a lawn, the deck frame
    const HX = 1.8, HZ = 3.4;
    out.push(place(house2('#eef3e6', '#5b6b7d', BLUE), { p: [-2.2, y0, 3.2], r: [0, Math.PI / 2, 0], s: 0.85 }));
    out.push(part(box(4.0, 0.15, 0.04), '#e2c089', { p: [HX, y0 + 0.35, HZ - 1.0] }), part(box(4.0, 0.15, 0.04), '#e2c089', { p: [HX, y0 + 0.35, HZ + 1.0] }));
    for (let i = 0; i < 6; i++) out.push(part(box(0.06, 0.15, 2.0), '#c9a36b', { p: [HX - 1.9 + i * 0.76, y0 + 0.35, HZ] }));
    [[-1.9, -1], [1.9, -1], [-1.9, 1], [1.9, 1]].forEach(([x, z]) => out.push(part(box(0.14, 0.4, 0.14), '#c9a36b', { p: [HX + x, y0 + 0.2, HZ + z] })));
    out.push(part(rbox(0.9, 0.5, 0.5, 0.04), '#3a3f47', { p: [HX + 1.3, y0 + 0.25, HZ - 1.5] }), part(box(1.0, 0.1, 0.4), '#e2c089', { p: [HX + 1.3, y0 + 0.55, HZ - 1.5] }));
    out.push(trees(R, [[4.6, 4.6], [4.6, 1.6], [-4.6, 1.6], [4.6, -4.6], [-0.2, 4.6]]));
    // ---- moving parts
    const moving = [], P = 12, N = 12;
    // The deck boards going down one by one.
    for (let k = 0; k < N; k++) moving.push({ geo: part(box(0.28, 0.05, 2.1), k % 2 ? '#e2c089' : '#d6b47a'), pivot: [HX - 1.85 + k * 0.335, y0 + 0.45, HZ], anim: (t) => { const f = cyc(t, P), a = 0.4 + k * 0.045; return f < a || f > 0.97 ? { s: 0.001 } : { y: (1 - easeOut(win(f, a, a + 0.04))) * 0.6 }; } });
    // The DIYer with a hammer.
    const diy = moving.length;
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, P), k = Math.min(N - 1, Math.max(0, Math.floor((f - 0.4) / 0.045))); return f < 0.4 ? { x: HX + 2.4, z: HZ - 0.6, ry: Math.PI, still: true } : { x: HX - 1.85 + k * 0.335, z: HZ - 1.4, ry: Math.PI / 2, still: true, push: Math.sin(t * 14) > 0 }; }, { shirt: BLUE, pants: '#2b3a55', y: y0 }));
    // The pickup: loads at the yard, drives the road, parks by the house.
    const pickup = merge(part(rbox(1.0, 0.7, 0.9, 0.08), '#c0392b', { p: [0.55, 0.6, 0] }), part(box(0.04, 0.3, 0.75), '#26323f', { p: [1.06, 0.75, 0] }), part(rbox(2.2, 0.4, 0.95, 0.06), '#c0392b', { p: [0, 0.4, 0] }), part(box(1.2, 0.08, 0.85), '#7a1f15', { p: [-0.5, 0.62, 0] }), [[-0.75, 0.45], [0.75, 0.45], [-0.75, -0.45], [0.75, -0.45]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] })), [0, 1, 2].map((k) => part(box(1.6, 0.08, 0.2), '#e2c089', { p: [-0.6, 0.7 + k * 0.08, -0.25 + k * 0.25] })));
    const drive = curve([[-3.0, y0, -0.3], [-1.5, y0, 0.25], [1.0, y0, 0.25], [3.2, y0, 0.35], [4.0, y0, 1.6], [3.8, y0, 2.4]]);
    moving.push({ geo: pickup, pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P), u = easeIO(win(f, 0.05, 0.35)), a = along(drive, u); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry, s: (f > 0.92 ? 1 - win(f, 0.92, 0.99) : 1) * 0.85 + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Best Buy: the store where you can try it, and the Geek Squad who set it up. Inside, the wall
  // of TVs plays, laptops and phones wait on the tables and the blue shirts help; outside, the
  // black-and-white Beetle drives to the customer's house, where the new TV goes on the wall.
  bestbuy: { finder: '#0046be', build: () => {
    const R = rand(231), out = [], BLUE = '#0046be', TAG = '#fff200';
    out.push(ground('#8fc66f'), part(rbox(6.6, 0.06, 6.0, 0.03), '#e9ecef', { p: [-1.7, y0 + 0.03, -1.8] }));
    // ---- the store: blue walls, the yellow tag, the TV wall
    out.push(part(rbox(6.6, 2.8, 0.2, 0.03), BLUE, { p: [-1.7, y0 + 1.4, -4.9] }), part(rbox(0.2, 2.8, 6.0, 0.03), '#0a3aa0', { p: [-4.9, y0 + 1.4, -1.8] }));
    const tagG = merge(part(extrude([[-1.1, -0.45], [0.8, -0.45], [1.2, 0], [0.8, 0.45], [-1.1, 0.45]], 0.12), TAG), part(cyl(0.08, 0.08, 0.14, 14), '#1d1f24', { p: [0.85, 0, 0], r: [Math.PI / 2, 0, 0] }), pixText('BEST BUY', 0.055, '#1d1f24', 0.16).translate(-0.15, 0, 0));
    out.push(place(tagG, { p: [1.0, y0 + 2.3, -4.75] }));
    // Appliances along the left wall.
    for (let k = 0; k < 4; k++) out.push(part(rbox(0.8, k % 2 ? 1.0 : 1.8, 0.8, 0.06), k % 2 ? K.white : '#c9ced6', { p: [-4.35, y0 + (k % 2 ? 0.5 : 0.9), -3.9 + k * 1.0] }), part(cyl(0.25, 0.25, 0.04, 20), '#3a3f47', { p: [-3.94, y0 + 0.5, -3.9 + k * 1.0], r: [0, 0, Math.PI / 2] }));
    // Tables of laptops and phones.
    [[-2.6, -2.4], [-0.6, -2.4], [-1.6, -0.6]].forEach(([x, z]) => { out.push(part(rbox(1.6, 0.9, 0.9, 0.04), K.white, { p: [x, y0 + 0.45, z] })); [-0.5, 0, 0.5].forEach((dx, i) => out.push(part(rbox(0.36, 0.03, 0.26, 0.02), '#3a3f47', { p: [x + dx, y0 + 0.92, z + 0.1] }), part(rbox(0.36, 0.24, 0.02, 0.02), '#1d1f24', { p: [x + dx, y0 + 1.04, z - 0.03], r: [-0.25, 0, 0] }))); });
    // ---- the customer's house, front right, cut open to its living room
    const HX = 2.8, HZ = 2.8;
    out.push(part(rbox(3.2, 0.1, 2.8, 0.03), '#d9c3a0', { p: [HX, y0 + 0.05, HZ] }), part(rbox(3.2, 2.0, 0.14, 0.03), '#f1e2c6', { p: [HX, y0 + 1.0, HZ - 1.4] }), part(rbox(0.14, 2.0, 2.8, 0.03), '#ebd6b4', { p: [HX - 1.6, y0 + 1.0, HZ] }));
    out.push(part(rbox(1.8, 0.45, 0.7, 0.12), '#5b6b7d', { p: [HX + 0.2, y0 + 0.33, HZ + 0.8] }), part(rbox(1.8, 0.55, 0.2, 0.1), '#5b6b7d', { p: [HX + 0.2, y0 + 0.6, HZ + 1.15] }), part(cyl(0.9, 0.9, 0.02, 32), '#c97b5a', { p: [HX + 0.2, y0 + 0.11, HZ + 0.2] }), place(fan('#e5533d'), { p: [HX - 0.2, y0 + 0.25, HZ + 0.8], s: 1.2 }), place(fan('#2f9e6e'), { p: [HX + 0.6, y0 + 0.25, HZ + 0.8], s: 1.0 }));
    out.push(part(box(10.2, 0.03, 1.0), '#5b616b', { p: [0, y0 + 0.015, 4.55] }));
    out.push(trees(R, [[4.6, -4.6], [4.6, -1.6], [-4.6, 3.0], [0.2, 2.4]], 0.5));
    // ---- moving parts
    const moving = [], P = 12;
    // The TV wall: twelve screens, pictures changing.
    const pics = ['#4fc3f7', '#f29a3a', '#5fae45', '#d6336c', '#8a6cf0', '#f2c94c'];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { out.push(part(rbox(1.0, 0.62, 0.06, 0.03), '#1d1f24', { p: [-3.9 + k * 1.1, y0 + 0.6 + r * 0.7, -4.75] })); pics.forEach((c, j) => moving.push({ geo: part(box(0.9, 0.52, 0.01), c), pivot: [-3.9 + k * 1.1, y0 + 0.6 + r * 0.7, -4.71], anim: (t) => (Math.floor(t * 0.7 + r * 0.6 + k * 0.4) % pics.length === j ? {} : { s: 0.001 }) })); }
    // Blue shirts helping at the tables.
    [[-2.6, -1.6], [-0.6, -1.6]].forEach(([x, z], i) => moving.push(...walker(moving.length, (t) => ({ x: x + Math.sin(t * 0.5 + i) * 0.4, z, ry: Math.PI / 2, still: true, push: Math.sin(t * 2 + i) > 0.4 }), { shirt: BLUE, pants: '#1d1f24', y: y0 + 0.03 })));
    // The Beetle: out along the road to the house.
    const beetle = merge(part(new THREE.SphereGeometry(0.6, hi() ? 24 : 10, hi() ? 16 : 6, 0, TAU, 0, Math.PI / 2), '#1d1f24', { s: [1.6, 1.0, 1.0], p: [0, 0.28, 0] }), part(rbox(1.9, 0.3, 1.0, 0.12), '#1d1f24', { p: [0, 0.3, 0] }), part(box(0.8, 0.3, 1.02), K.white, { p: [0, 0.5, 0] }), part(box(0.3, 0.12, 1.03), '#ff6a13', { p: [0, 0.55, 0] }), part(box(0.04, 0.22, 0.6), '#9fcdea', { p: [0.62, 0.62, 0], r: [0, 0, 0.6] }), [[-0.6, 0.48], [0.6, 0.48], [-0.6, -0.48], [0.6, -0.48]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14), '#3a3f47', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] })));
    moving.push({ geo: beetle, pivot: [0, y0, 4.55], anim: (t) => { const f = cyc(t, P), x = -5.6 + easeOut(win(f, 0, 0.25)) * 6.6 + easeIn(win(f, 0.8, 1)) * 5.6; return { x, s: clamp01((5.2 - Math.abs(x)) / 0.6) + 0.001 }; } });
    // The agent carries the TV in; it goes on the wall and lights up.
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, P), u = easeIO(win(f, 0.28, 0.48)); return { x: 1.2 + u * 1.4, z: 4.2 - u * 2.2, ry: Math.PI * 0.3, still: f < 0.28 || f > 0.48, s: f < 0.26 || f > 0.78 ? 0.001 : 1 }; }, { shirt: K.white, pants: '#1d1f24', y: y0 }));
    moving.push({ geo: part(rbox(1.4, 0.8, 0.08, 0.03), '#1d1f24'), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P); if (f < 0.26) return { s: 0.001 }; if (f < 0.5) { const u = easeIO(win(f, 0.28, 0.48)); return { x: 1.2 + u * 1.4 + 0.3, y: y0 + 1.3, z: 4.2 - u * 2.2 }; } const u = easeIO(win(f, 0.5, 0.6)); return { x: 2.9 + (HX - 2.9) * u, y: y0 + 1.3 + u * 0.2, z: 2.0 + (HZ - 1.31 - 2.0) * u, s: f > 0.96 ? 0.001 : 1 }; } });
    moving.push({ geo: merge(part(box(1.25, 0.66, 0.02), '#4fc3f7'), part(box(1.25, 0.22, 0.025), '#5fae45', { p: [0, -0.22, 0] }), part(new THREE.CircleGeometry(0.1, 12), '#ffd23f', { p: [0.35, 0.15, 0.015] })), pivot: [HX, y0 + 1.5, HZ - 1.26], anim: (t) => { const f = cyc(t, P); return f > 0.62 && f < 0.96 ? { s: Math.min(1, win(f, 0.62, 0.66)) + 0.001 } : { s: 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // TJX (T.J. Maxx): the treasure hunt. Trucks bring the brands' surplus straight from their
  // warehouses, a different mix every day; the racks fill, the tags flip from the full price to
  // the much lower one, and shoppers leave with their bags.
  tjx: { finder: '#a6192e', build: () => {
    const R = rand(123), out = [], RED = '#a6192e';
    out.push(ground('#8fc66f'), part(rbox(6.6, 0.08, 4.4, 0.03), '#e9e2d4', { p: [-0.6, y0 + 0.04, 0.2] }));
    // ---- the brands' warehouses, back: each in its own colour
    const brands = ['#1d3557', '#2f9e6e', '#e5533d', '#8a6cf0'];
    brands.forEach((c, i) => { const x = -3.8 + i * 2.3; out.push(part(rbox(1.9, 1.4, 1.4, 0.04), '#d8dde3', { p: [x, y0 + 0.7, -4.2] }), part(box(1.92, 0.3, 1.42), c, { p: [x, y0 + 1.25, -4.2] }), part(box(0.9, 0.8, 0.04), '#7b828c', { p: [x, y0 + 0.45, -3.48] })); });
    // ---- the store floor: open cut-away walls with the sign, racks of everything
    out.push(part(rbox(0.2, 2.0, 4.4, 0.03), '#eee6d8', { p: [-3.9, y0 + 1.0, 0.2] }), part(rbox(6.6, 2.0, 0.2, 0.03), '#eee6d8', { p: [-0.6, y0 + 1.0, -2.0] }), part(box(6.62, 0.4, 0.22), RED, { p: [-0.6, y0 + 1.8, -2.0] }), place(pixText('T.J.MAXX', 0.07, K.white, 0.03), { p: [-0.6, y0 + 1.8, -1.88] }));
    const rackXs = [-2.8, -1.2, 0.4, 2.0];
    rackXs.forEach((x, i) => {
      out.push(part(cyl(0.03, 0.03, 1.2, 8), '#9aa1a9', { p: [x - 0.6, y0 + 0.6, 0.4] }), part(cyl(0.03, 0.03, 1.2, 8), '#9aa1a9', { p: [x + 0.6, y0 + 0.6, 0.4] }), part(cyl(0.025, 0.025, 1.3, 8), '#9aa1a9', { p: [x, y0 + 1.2, 0.4], r: [0, 0, Math.PI / 2] }));
      for (let k = 0; k < 7; k++) out.push(part(rbox(0.12, 0.7, 0.45, 0.04), ['#e5533d', '#3d7be0', '#f2c94c', '#2f9e6e', '#8a6cf0', '#d6336c', '#f29a3a', '#1d3557', K.white][(i * 3 + k * 2) % 9], { p: [x - 0.48 + k * 0.16, y0 + 0.82, 0.4] }));
    });
    // Shelves of shoes and home goods along the back wall.
    for (let k = 0; k < 10; k++) out.push(part(rbox(0.4, 0.3, 0.3, 0.04), brands[k % 4], { p: [-3.4 + k * 0.58, y0 + 0.3, -1.65] }), part(rbox(0.35, 0.25, 0.25, 0.04), ['#f2c94c', '#d6336c', K.white][k % 3], { p: [-3.4 + k * 0.58, y0 + 0.6, -1.65] }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, -1.8], [0.6, 4.6]]));
    // ---- moving parts
    const moving = [], P = 10;
    // Boxes of mixed brands coming in from the warehouses, a different mix every day.
    for (let k = 0; k < 4; k++) moving.push({ geo: merge(part(rbox(0.5, 0.4, 0.5, 0.04), brands[k], { p: [0, 0.2, 0] }), part(box(0.52, 0.06, 0.15), K.white, { p: [0, 0.4, 0] })), pivot: [0, y0, 0], anim: (t) => { const f = cyc(t, P, k / 4), u = easeIO(win(f, 0, 0.5)), x = -3.8 + k * 2.3 * 0.75, path = curve([[x, 0.1, -3.3], [x, 0.3, -2.6], [x * 0.5, 0.2, -1.2], [-1.0 + k * 0.6, 0.0, 1.4]]), p = path.getPointAt(u); return f > 0.6 ? { s: 0.001 } : { x: p.x, y: p.y, z: p.z, s: Math.min(1, f / 0.05, (0.6 - f) / 0.05) + 0.001 }; } });
    // Tags on each rack: the full price swings down to show the lower one.
    rackXs.forEach((x, i) => {
      const tag = moving.length;
      moving.push({ geo: merge(part(rbox(0.6, 0.36, 0.03, 0.04), K.white), part(box(0.5, 0.04, 0.035), '#c9ced6', { p: [0, 0.08, 0] }), part(box(0.5, 0.05, 0.04), '#e5533d', { p: [0, -0.06, 0], r: [0, 0, 0.3] })), pivot: [x, y0 + 1.65, 0.7], anim: (t) => { const f = cyc(t, P, -i * 0.12); return { s: f < 0.5 ? 1 : 0.001 }; } });
      moving.push({ geo: merge(part(rbox(0.6, 0.36, 0.03, 0.04), RED), pixText('$' + [9, 12, 7, 15][i], 0.05, K.white, 0.04)), pivot: [x, y0 + 1.65, 0.7], anim: (t) => { const f = cyc(t, P, -i * 0.12); return f < 0.5 ? { s: 0.001 } : { s: back(win(f, 0.5, 0.58)) * Math.min(1, (1 - f) / 0.04) + 0.001 }; } });
    });
    // Shoppers leaving with bags.
    [0, 0.5].forEach((o, i) => moving.push(...walker(moving.length, (t) => { const f = cyc(t, P, o), u = win(f, 0, 0.8); return { x: -1.8 + u * 5.0 + i * 0.4, z: 2.0 + u * 2.0 - i * 0.6, ry: -0.4, s: f > 0.8 ? 0.001 : Math.min(1, u / 0.05, (1 - u) / 0.05) }; }, { shirt: ['#d6336c', '#3d7be0'][i], pants: '#2b3a55', y: y0, carry: part(rbox(0.3, 0.35, 0.12, 0.03), RED, { p: [0.05, 0.75, 0.32] }) })));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Macy's: the store on Herald Square that New York parades past. The giant balloon floats down
  // the avenue with its handlers below, under the red star.
  macys: { finder: '#e21a2c', build: () => {
    const R = rand(124), out = [], RED = '#e21a2c';
    out.push(ground('#5b616b'), part(box(10.2, 0.02, 2.4), '#4a4f57', { p: [0, y0 + 0.01, 1.4] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.6, 0.01, 0.06), K.white, { p: [-4.6 + i * 1.3, y0 + 0.025, 1.4] }));
    out.push(part(box(10.2, 0.08, 2.0), '#cfc8ba', { p: [0, y0 + 0.04, 3.7] }), part(box(10.2, 0.08, 1.0), '#cfc8ba', { p: [0, y0 + 0.04, -0.3] }));
    // ---- the flagship, back: brick and stone with the awning, windows and the red star
    const SX = -0.6, SZ = -3.0;
    out.push(part(rbox(8.0, 3.6, 2.6, 0.04), '#b9653f', { p: [SX, y0 + 1.8, SZ] }), part(box(8.04, 0.6, 2.64), '#efe6d6', { p: [SX, y0 + 0.3, SZ] }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) out.push(part(box(0.38, 0.4, 0.04), '#f3e7c9', { p: [SX - 3.6 + c * 0.8, y0 + 1.1 + r * 0.65, SZ + 1.31] }));
    out.push(part(rbox(8.0, 0.12, 0.7, 0.03), RED, { p: [SX, y0 + 0.75, SZ + 1.5] }), part(box(2.4, 0.4, 0.04), RED, { p: [SX, y0 + 3.2, SZ + 1.32] }), place(pixText("MACY'S", 0.07, K.white, 0.03), { p: [SX - 0.15, y0 + 3.2, SZ + 1.36] }), part(star(0.16, 0.06), K.white, { p: [SX + 0.75, y0 + 3.2, SZ + 1.37] }));
    for (let k = 0; k < 4; k++) out.push(part(box(1.1, 0.5, 0.04), ['#2f9e6e', '#f2c94c', '#3d7be0', '#d6336c'][k], { p: [SX - 2.4 + k * 1.6, y0 + 0.35, SZ + 1.32] }));
    out.push(part(star(0.7, 0.3), RED, { p: [SX - 3.0, y0 + 4.3, SZ + 0.6] }), part(cyl(0.05, 0.05, 0.6, 8), '#9aa1a9', { p: [SX - 3.0, y0 + 3.7, SZ + 0.6] }));
    // ---- the crowd along the kerb, front
    for (let k = 0; k < 14; k++) out.push(place(fan(['#e5533d', '#3d7be0', '#2f9e6e', '#f2c94c', '#8a6cf0', '#d6336c', '#f29a3a'][k % 7], ['#e9b98f', '#8d5a3b', '#c58c66'][k % 3]), { p: [-4.4 + k * 0.66 + R() * 0.2, y0 + 0.08, 3.4 + R() * 0.6], s: 1.2 }));
    out.push(trees(R, [[-4.6, 4.6], [4.6, 4.6], [4.6, -0.3], [-4.6, -0.3]], 0.5));
    // ---- moving parts
    const moving = [], P = 16;
    // The balloon: a big round-eared bear in red and white, bobbing as it drifts along.
    const bear = merge(part(ball(0.9), '#c8553d', { s: [1, 1.1, 0.9] }), part(ball(0.6), '#c8553d', { p: [0, 1.25, 0] }), [-1, 1].map((s) => part(ball(0.25), '#c8553d', { p: [0, 1.75, s * 0.42] })), part(ball(0.25), '#f4d8b8', { p: [0.5, 1.15, 0], s: [0.8, 0.7, 1] }), part(ball(0.07), '#1d1f24', { p: [0.68, 1.2, 0] }), [-1, 1].map((s) => part(ball(0.07), '#1d1f24', { p: [0.5, 1.4, s * 0.2] })),
      [-1, 1].map((s) => part(capsule(0.22, 0.5), '#c8553d', { p: [0.3, 0.2, s * 0.85], r: [s * 0.9, 0, 0] })), part(box(0.6, 0.3, 1.5), RED, { p: [0.1, 0.55, 0] }).translate(0.0, 0, 0), part(star(0.18, 0.05), K.white, { p: [0.58, 0.55, 0], r: [0, Math.PI / 2, 0] }));
    const bx = (t) => { const f = cyc(t, P); return -6.2 + f * 12.4; };
    moving.push({ geo: bear, pivot: [0, y0 + 3.6, 1.4], anim: (t) => { const x = bx(t); return { x, y: Math.sin(t * 1.2) * 0.15, rz: Math.sin(t * 0.9) * 0.08, ry: Math.sin(t * 0.5) * 0.15, s: clamp01((5.6 - Math.abs(x)) / 0.8) + 0.001 }; } });
    // Its handlers walking below, ropes up to it.
    [-0.6, 0.6].forEach((dz, i) => [-0.7, 0.7].forEach((dx, j) => {
      moving.push(...walker(moving.length, (t) => { const x = bx(t) + dx; return { x, z: 1.4 + dz * 1.4, ry: 0, s: clamp01((5.0 - Math.abs(x)) / 0.4) }; }, { shirt: '#3d7be0', pants: K.white, y: y0 }));
      moving.push({ geo: beam([0, 0, 0], [-dx * 0.7, 2.0, -dz * 1.0], 0.025, '#e9e6df'), pivot: [0, y0 + 1.3, 1.4 + dz * 1.4], anim: (t) => { const x = bx(t) + dx; return { x, s: clamp01((5.0 - Math.abs(x)) / 0.4) + 0.001 }; } });
    }));
    // Confetti over the avenue.
    for (let k = 0; k < (hi() ? 22 : 6); k++) { const x0 = -4 + R() * 8, z0 = 0.6 + R() * 2.0, c = ['#f2c94c', '#e5533d', '#3d7be0', '#2f9e6e', K.white][k % 5];
      moving.push({ geo: part(new THREE.BoxGeometry(0.1, 0.02, 0.06), c), pivot: [x0, y0 + 3.0, z0], anim: (t) => { const u = cyc(t, 3, k / 22); return { y: -u * 2.8, x: Math.sin(u * 7 + k) * 0.2, rx: u * 12 + k, rz: u * 6, s: u > 0.95 ? 0.001 : 1 }; } }); }
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Gap Inc.: one maker, four brands for every budget. Cotton from the field becomes denim on
  // the loom; the folded jeans stack up, and pairs fly to Old Navy, Gap, Banana Republic and
  // Athleta along the street.
  gap: { finder: '#002e5f', build: () => {
    const R = rand(125), out = [], NAVY = '#002e5f', DEN = '#3b5f8f';
    out.push(ground('#8fc66f'), part(box(1.2, 0.03, 10.2), '#d9d4c8', { p: [2.4, y0 + 0.015, 0] }));
    // ---- the four stores along the back and right
    const stores = [[-3.4, -3.6, 0, '#00559f', 'OLD NAVY'], [-0.6, -3.6, 0, NAVY, 'GAP'], [3.8, -2.2, 1, '#1d1f24', 'BANANA'], [3.8, 1.0, 1, '#5b2a86', 'ATHLETA']];
    stores.forEach(([x, z, side, c, name]) => {
      const g = merge(part(rbox(2.4, 1.8, 1.6, 0.05), '#f4efe6', { p: [0, 0.9, 0] }), part(box(2.44, 0.45, 1.64), c, { p: [0, 1.6, 0] }), pixText(name, 0.055, K.white, 0.03).translate(0, 1.6, 0.83), part(box(1.6, 0.9, 0.04), '#9cc3e0', { p: [0, 0.6, 0.81] }), [0, 1].map((k) => part(rbox(0.35, 0.7, 0.2, 0.04), DEN, { p: [-0.4 + k * 0.8, 0.6, 0.65] })));
      out.push(place(g, { p: [x, y0, z], r: [0, side ? Math.PI / 2 : 0, 0] }));
    });
    // ---- the cotton field and the loom, front left
    const FX = -3.2, FZ = 2.8;
    out.push(part(box(2.6, 0.12, 2.4), '#8a6a45', { p: [FX, y0 + 0.06, FZ] }));
    if (hi()) for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) { const x = FX - 1.1 + i * 0.37, z = FZ - 1.0 + j * 0.4; out.push(part(cyl(0.015, 0.015, 0.3, 6), '#4f7a3a', { p: [x, y0 + 0.27, z] }), part(new THREE.SphereGeometry(0.08, 8, 6), K.white, { p: [x, y0 + 0.45, z] })); }
    out.push(part(rbox(0.6, 0.5, 0.6, 0.06), '#f4f1ea', { p: [FX + 1.8, y0 + 0.25, FZ - 1.4] }));
    const LX = -1.0, LZ = 0.8;
    out.push(part(rbox(1.6, 1.0, 1.2, 0.05), '#8a6a45', { p: [LX, y0 + 0.5, LZ] }), part(cyl(0.2, 0.2, 1.3, 16), DEN, { p: [LX, y0 + 1.15, LZ + 0.4], r: [0, 0, Math.PI / 2] }), part(cyl(0.12, 0.12, 1.3, 12), '#f4f1ea', { p: [LX, y0 + 1.15, LZ - 0.4], r: [0, 0, Math.PI / 2] }), part(box(1.3, 0.02, 0.8), DEN, { p: [LX, y0 + 1.1, LZ], r: [0.15, 0, 0] }));
    // ---- the stack plinth
    const SX = 0.9, SZ = -0.9;
    out.push(part(rbox(1.8, 0.2, 1.4, 0.05), '#c9ced6', { p: [SX, y0 + 0.1, SZ] }));
    out.push(trees(R, [[4.6, 4.6], [-0.4, 4.6], [1.4, 3.4], [-4.6, -1.0], [1.4, -4.6]]));
    // ---- moving parts
    const moving = [], P = 10;
    const jeans = (s = 1) => place(merge(part(rbox(1.5, 0.16, 1.0, 0.05), DEN), part(box(1.52, 0.02, 0.04), '#d9a441', { p: [0, 0.06, 0.4] }), part(box(0.3, 0.17, 0.2), '#2f4a70', { p: [0.55, 0, -0.3] }), part(cyl(0.04, 0.04, 0.17, 8), '#c9a227', { p: [-0.5, 0.0, 0.3] })), { s });
    // The stack growing.
    for (let k = 0; k < 8; k++) moving.push({ geo: jeans(), pivot: [SX, y0 + 0.28 + k * 0.17, SZ], anim: (t) => { const f = cyc(t, P), a = k * 0.1; return f < a || f > 0.97 ? { s: 0.001 } : { ry: (k % 2 ? 0.1 : -0.08), y: (1 - easeOut(win(f, a, a + 0.06))) * 0.8 }; } });
    // Cotton to the loom; denim out of it to the stack.
    const toLoom = curve([[FX + 1.8, y0 + 0.6, FZ - 1.4], [(FX + LX) / 2 + 0.6, y0 + 1.8, (FZ + LZ) / 2], [LX, y0 + 1.4, LZ]]);
    for (let k = 0; k < 3; k++) moving.push(rider(part(new THREE.SphereGeometry(0.16, 10, 8), K.white), toLoom, P / 3, k / 3, 0, 0.5));
    const toStack = curve([[LX + 0.7, y0 + 1.1, LZ], [(LX + SX) / 2, y0 + 2.0, (LZ + SZ) / 2], [SX, y0 + 1.8, SZ]]);
    moving.push(rider(jeans(0.6), toStack, P / 3, 0.5, 0, 0.5));
    // Pairs flying from the stack to each store.
    stores.forEach(([x, z], i) => { const path = curve([[SX, y0 + 1.8, SZ], [(x + SX) / 2, y0 + 3.0, (z + SZ) / 2], [x, y0 + 2.2, z]]); moving.push(rider(jeans(0.45), path, P / 2, i / 4, 0.1, 0.6, (t, u) => ({ rz: u * 3 }))); });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Lululemon: a brand built on a community. Outside the store the free yoga class flows
  // through its sun salutations and the run club laps the block; the members walk out in the
  // leggings everyone wants.
  lululemon: { finder: '#d31f30', build: () => {
    const R = rand(126), out = [], RED = '#d31f30';
    out.push(ground('#8fc66f'), part(rbox(9.6, 0.05, 9.6, 0.05), '#d9d4c8', { p: [0, y0 + 0.025, 0] }), part(rbox(7.0, 0.06, 7.0, 0.05), '#8fc66f', { p: [-0.2, y0 + 0.04, -0.2] }));
    // ---- the store, back left: wood and glass, the red omega
    const SX = -2.4, SZ = -3.0;
    out.push(part(rbox(4.0, 2.2, 2.2, 0.05), '#e8dcc6', { p: [SX, y0 + 1.1, SZ] }), part(box(3.0, 1.5, 0.04), '#a9c9de', { p: [SX + 0.3, y0 + 0.85, SZ + 1.11] }), part(box(4.04, 0.35, 2.24), '#b08560', { p: [SX, y0 + 2.05, SZ] }));
    const omega = merge(part(torus(0.36, 0.09, Math.PI * 1.45, 24), RED, { r: [0, 0, -Math.PI * 0.22] }), part(rbox(0.3, 0.12, 0.12, 0.04), RED, { p: [-0.35, -0.3, 0] }), part(rbox(0.3, 0.12, 0.12, 0.04), RED, { p: [0.35, -0.3, 0] }));
    out.push(part(cyl(0.6, 0.6, 0.08, 32), K.white, { p: [SX - 1.2, y0 + 1.3, SZ + 1.16], r: [Math.PI / 2, 0, 0] }), place(omega, { p: [SX - 1.2, y0 + 1.33, SZ + 1.22] }));
    // Mannequins in leggings in the window.
    [0, 1, 2].forEach((k) => out.push(part(capsule(0.12, 0.3), ['#1d1f24', RED, '#5b6b7d'][k], { p: [SX - 0.3 + k * 0.7, y0 + 1.15, SZ + 0.9] }), part(capsule(0.08, 0.5), '#1d1f24', { p: [SX - 0.3 + k * 0.7, y0 + 0.5, SZ + 0.9] })));
    // ---- the yoga lawn: rows of mats
    const mats = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) mats.push([-2.4 + c * 1.3, 0.2 + r * 1.2]);
    mats.forEach(([x, z], i) => out.push(part(rbox(0.5, 0.03, 1.0, 0.02), ['#d31f30', '#5b2a86', '#3fb8a8', '#f29a3a'][i % 4], { p: [x, y0 + 0.08, z] })));
    out.push(part(rbox(1.0, 0.05, 1.2, 0.02), '#c9a36b', { p: [1.6, y0 + 0.08, -1.2] }));
    out.push(trees(R, [[4.0, -4.0], [1.6, -3.6], [-4.0, 4.0], [3.0, 3.0], [-4.2, 1.2]]));
    // ---- moving parts
    const moving = [], P = 6;
    // Each yogi: a body that dips forward and arms that sweep up overhead and down.
    const yogi = (x, z, c, k, ry) => {
      const bi = moving.length;
      moving.push({ geo: merge(part(capsule(0.17, 0.4), c, { p: [0, 0.75, 0] }), part(ball(0.14), '#e9b98f', { p: [0, 1.23, 0] }), part(capsule(0.07, 0.45), '#1d1f24', { p: [0, 0.3, 0.1] }), part(capsule(0.07, 0.45), '#1d1f24', { p: [0, 0.3, -0.1] })), pivot: [x, y0 + 0.1, z], anim: (t) => { const f = cyc(t, P, k * 0.02); return { ry, rz: -bump(f, 0.55, 0.12) * 1.1 }; } });
      [-0.22, 0.22].forEach((dz) => moving.push({ geo: part(capsule(0.05, 0.4), c, { p: [0, -0.25, 0] }), pivot: [0, 1.0, dz], parent: bi, anim: (t) => { const f = cyc(t, P, k * 0.02); return { rz: -Math.PI * 0.95 * (bump(f, 0.25, 0.14) + bump(f, 0.85, 0.12)) }; } }));
    };
    mats.forEach(([x, z], i) => yogi(x, z, ['#1d1f24', RED, '#5b6b7d', '#3fb8a8', K.white, '#5b2a86'][i % 6], i, Math.PI));
    // The teacher on the front platform, leading.
    yogi(1.6, -1.2, RED, 0, 0);
    // The run club round the path.
    [0, 0.18, 0.36, 0.54].forEach((o, i) => moving.push(...walker(moving.length, (t) => { const u = cyc(t, 14, o) * 4, side = Math.floor(u), w = u - side, L = 4.2; const pts = [[-L, -L], [L, -L], [L, L], [-L, L]], a = pts[side], b = pts[(side + 1) % 4]; return { x: a[0] + (b[0] - a[0]) * w, z: a[1] + (b[1] - a[1]) * w, ry: [0, -Math.PI / 2, Math.PI, Math.PI / 2][side] }; }, { shirt: [RED, '#3fb8a8', '#f29a3a', '#5b2a86'][i], pants: '#1d1f24', y: y0 })));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Ulta Beauty: every price point under one roof, and points that bring members back. The walls
  // run floor to ceiling with drugstore and prestige side by side, the salon chairs are busy, and
  // every purchase at the till sends points up the member's gauge until a reward pops out.
  ulta: { finder: '#f05a28', build: () => {
    const R = rand(229), out = [], OR = '#f05a28', PINK = '#e8558f';
    out.push(ground('#8fc66f'), part(rbox(9.6, 0.06, 9.0, 0.03), '#f6efe9', { p: [-0.2, y0 + 0.03, -0.5] }));
    // ---- the walls with the sign, product walls floor to ceiling
    out.push(part(rbox(9.6, 2.8, 0.2, 0.03), '#fbe7dc', { p: [-0.2, y0 + 1.4, -4.9] }), part(rbox(0.2, 2.8, 9.0, 0.03), '#f8e0d4', { p: [-4.9, y0 + 1.4, -0.5] }), part(box(9.62, 0.34, 0.22), OR, { p: [-0.2, y0 + 2.65, -4.9] }), place(pixText('ULTA BEAUTY', 0.08, K.white, 0.03), { p: [-0.6, y0 + 2.65, -4.77] }));
    const pc = ['#e5533d', PINK, '#8a6cf0', '#f2c94c', '#3fb8a8', '#1d1f24', '#d6336c', '#f29a3a'];
    for (let r = 0; r < 5; r++) { out.push(part(box(8.6, 0.05, 0.4), K.white, { p: [0.2, y0 + 0.4 + r * 0.46, -4.6] })); for (let k = 0; k < 30; k++) { const x = -4.0 + k * 0.29, c = pc[(k + r * 3) % 8], kd = (k + r) % 3; out.push(kd === 0 ? part(cyl(0.05, 0.05, 0.24, 10), c, { p: [x, y0 + 0.55 + r * 0.46, -4.55] }) : kd === 1 ? part(rbox(0.15, 0.26, 0.12, 0.03), c, { p: [x, y0 + 0.56 + r * 0.46, -4.55] }) : place(bottle(0.32, c, K.gold), { p: [x, y0 + 0.43 + r * 0.46, -4.55] })); } }
    out.push(part(box(0.06, 2.3, 0.42), OR, { p: [0.2, y0 + 1.35, -4.6] }), place(pixText('PRESTIGE', 0.035, OR, 0.02), { p: [2.4, y0 + 2.4, -4.76] }), place(pixText('EVERYDAY', 0.035, OR, 0.02), { p: [-2.0, y0 + 2.4, -4.76] }));
    // ---- two gondola islands of testers
    [[-1.4, -2.4], [1.6, -2.4]].forEach(([x, z], i) => { out.push(part(rbox(2.2, 1.0, 0.9, 0.05), K.white, { p: [x, y0 + 0.5, z] }), part(box(2.2, 0.04, 0.9), '#f2e4dc', { p: [x, y0 + 1.02, z] })); for (let k = 0; k < 8; k++) out.push(part(cyl(0.05, 0.05, 0.2, 10), pc[(k + i * 3) % 8], { p: [x - 0.9 + k * 0.26, y0 + 1.14, z + (k % 2 ? 0.15 : -0.15)] })); });
    // ---- the salon along the left wall: mirrors, chairs, clients
    [-3.0, -1.4, 0.2, 1.8].forEach((z, i) => out.push(part(rbox(0.06, 1.0, 0.8, 0.03), '#cfe6f2', { p: [-4.75, y0 + 1.4, z] }), part(cyl(0.14, 0.22, 0.45, 14), '#3a3f47', { p: [-4.0, y0 + 0.22, z] }), part(rbox(0.65, 0.12, 0.65, 0.05), '#1d1f24', { p: [-4.0, y0 + 0.5, z] }), part(rbox(0.12, 0.65, 0.65, 0.05), '#1d1f24', { p: [-4.28, y0 + 0.85, z] }), place(fan(pc[i]), { p: [-4.0, y0 + 0.2, z], s: 1.25 })));
    // ---- the till and the points gauge, front right
    out.push(part(rbox(2.0, 0.95, 0.8, 0.04), OR, { p: [2.4, y0 + 0.48, 0.6] }), part(rbox(0.4, 0.3, 0.06, 0.03), '#1d1f24', { p: [2.4, y0 + 1.15, 0.4] }));
    const GX = 3.9, GZ = -2.4, Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), gp = (dx, dy, dz = 0.07) => { const v = new V(dx, dy, dz).applyQuaternion(Q); return [GX + v.x, y0 + dy, GZ + v.z]; };
    out.push(part(rbox(1.3, 3.2, 0.14, 0.08), K.white, { p: gp(0, 1.7, 0), q: Q }), part(rbox(0.8, 2.4, 0.04, 0.06), '#f2e4dc', { p: gp(0, 1.55), q: Q }), place(cardGeo(OR), { p: gp(0, 3.0, 0.1), q: Q }), part(rbox(0.6, 0.15, 0.6, 0.04), '#c9ced6', { p: [GX, y0 + 0.08, GZ] }));
    out.push(trees(R, [[-4.6, 4.6], [-1.4, 4.6], [1.6, 4.6]], 0.45));
    // ---- moving parts
    const moving = [], P = 10;
    // Stylists at work behind the chairs, dryers waving.
    [-3.0, -1.4, 0.2, 1.8].forEach((z, i) => moving.push(...walker(moving.length, (t) => ({ x: -3.4, z: z + 0.1, ry: Math.PI, still: true, push: Math.sin(t * 3 + i * 1.3) > 0 }), { shirt: '#1d1f24', pants: '#3a3f47', y: y0 + 0.03 })));
    // Shoppers: through the gondolas to the till, then out.
    [0, 0.33, 0.66].forEach((o, i) => moving.push(...walker(moving.length, (t) => { const f = cyc(t, P, o), u = easeIO(win(f, 0, 0.45)), w = easeIO(win(f, 0.55, 1)); return f < 0.55 ? { x: -1.8 + u * 3.6, z: -1.2 + u * 1.2, ry: -0.3, still: f > 0.45 } : { x: 1.8 + w * 1.8, z: 0.0 + w * 4.0, ry: -1.1, s: Math.min(1, (1 - f) / 0.05) }; }, { shirt: [PINK, '#3fb8a8', '#f29a3a'][i], pants: '#2b3a55', y: y0 + 0.03, carry: part(rbox(0.3, 0.35, 0.12, 0.03), OR, { p: [0.05, 0.75, 0.32] }) })));
    // Each sale sends points up to the gauge; it fills in steps; at the top the reward pops.
    for (let k = 0; k < 3; k++) moving.push(rider(merge(part(cyl(0.16, 0.16, 0.05, 16), PINK, { r: [Math.PI / 2, 0, 0] }), part(star(0.1, 0.06), K.white)), curve([[2.4, y0 + 1.4, 0.6], [3.4, y0 + 3.2, -0.8], gp(0, 2.4, 0.2)]), P, k * 0.33 - 0.45, 0, 0.12, () => ({ ry: Math.PI / 4 })));
    moving.push({ geo: part(rbox(0.7, 2.3, 0.03, 0.05), OR, { p: [0, 1.15, 0] }), pivot: gp(0, 0.4, 0.1), anim: (t) => { const f = cyc(t, P * 2), lvl = Math.min(6, Math.floor(f * 7)) / 6; return { q: Q, sy: f > 0.95 ? 0.001 : lvl * 0.95 + 0.001 }; } });
    moving.push({ geo: merge(part(rbox(0.9, 0.7, 0.4, 0.06), PINK), part(box(0.92, 0.14, 0.42), K.gold), part(box(0.14, 0.72, 0.42), K.gold)), pivot: gp(0, 3.9, 0.3), anim: (t) => { const f = cyc(t, P * 2); return f > 0.86 ? { q: Q, s: back(win(f, 0.86, 0.92)) * Math.min(1, (1 - f) / 0.03) + 0.001, y: Math.sin(t * 6) * 0.06 } : { s: 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Dollar General: the store that is close to everyone in rural America. Across the farmland
  // the yellow stores keep opening, each a short drive from the farms around it, and the truck
  // runs its route between them.
  dollargeneral: { finder: '#ffc220', build: () => {
    const R = rand(128), out = [], YEL = '#ffc220';
    out.push(ground('#9cc86a'));
    // ---- farmland patches and roads
    [[-3.4, -3.4, '#c9b45a'], [3.4, -3.4, '#7fb35a'], [-3.4, 3.4, '#a3c46a'], [3.4, 3.4, '#d6c27a'], [-0.0, -3.6, '#8fbf5a'], [0.0, 3.6, '#b9c96a'], [-3.6, 0, '#8ab55a'], [3.6, 0, '#c4b860']].forEach(([x, z, c]) => {
      out.push(part(box(2.4, 0.05, 2.4), c, { p: [x, y0 + 0.025, z] }));
      if (hi()) for (let k = 0; k < 6; k++) out.push(part(box(2.3, 0.02, 0.06), shade(c, 0.85), { p: [x, y0 + 0.055, z - 1.0 + k * 0.4] }));
    });
    out.push(part(box(10.2, 0.03, 0.7), '#5b616b', { p: [0, y0 + 0.02, -1.8] }), part(box(10.2, 0.03, 0.7), '#5b616b', { p: [0, y0 + 0.02, 1.8] }), part(box(0.7, 0.03, 10.2), '#5b616b', { p: [-1.8, y0 + 0.02, 0] }), part(box(0.7, 0.03, 10.2), '#5b616b', { p: [1.8, y0 + 0.02, 0] }));
    // Farmhouses, barns and silos.
    [[-3.8, -4.0], [3.0, -4.2], [-4.2, 3.0], [3.8, 3.2], [0.0, 4.3], [4.3, 0.2]].forEach(([x, z], i) => out.push(place(i % 2 ? home('#fbf3e3', '#8a5a36', 1.0, 0.9, 0.7) : merge(part(rbox(1.0, 0.7, 0.8, 0.04), '#b03a2e', { p: [0, 0.35, 0] }), part(prism(1.1, 0.5, 0.9), '#5b3a2a', { p: [0, 0.7, 0] })), { p: [x, y0, z], r: [0, i * 0.7, 0] })));
    [[-2.6, -3.2], [2.6, 3.0]].forEach(([x, z]) => out.push(place(bin(0.32, 1.1, '#9aa1a9'), { p: [x, y0, z] })));
    // ---- the depot, back left
    out.push(part(rbox(1.6, 0.9, 1.2, 0.04), '#e6e9ed', { p: [-3.8, y0 + 0.45, -0.2] }), part(box(1.62, 0.25, 1.22), YEL, { p: [-3.8, y0 + 0.8, -0.2] }));
    out.push(trees(R, [[-0.4, -0.4], [0.6, 0.6], [-2.6, 2.6], [2.6, -2.6], [4.5, -1.2], [-1.0, 4.5]], 0.45));
    // ---- moving parts
    const moving = [], P = 14;
    // The stores: opening one by one at the crossroads and along the roads.
    const store = merge(part(rbox(1.1, 0.6, 0.8, 0.04), '#f4f1ea', { p: [0, 0.3, 0] }), part(box(1.12, 0.22, 0.82), YEL, { p: [0, 0.55, 0] }), pixText('DG', 0.04, '#1d1f24', 0.02).translate(0, 0.55, 0.42), part(box(0.5, 0.3, 0.02), '#2a3c50', { p: [0, 0.2, 0.41] }));
    const spots = [[-1.0, -1.0], [1.0, 1.0], [-1.0, 2.6], [2.6, -1.0], [1.0, -2.6], [-2.6, 1.0], [2.6, 2.6], [-2.6, -2.6]];
    spots.forEach(([x, z], i) => { moving.push({ geo: store, pivot: [x, y0, z], anim: (t) => { const f = cyc(t, P), a = i * 0.1; return f < a || f > 0.97 ? { s: 0.001 } : { ry: Math.PI / 4, s: back(win(f, a, a + 0.06)) * 0.9 }; } }); moving.push({ geo: part(cone(0.18, 0.4, 16), YEL, { r: [Math.PI, 0, 0] }), pivot: [x, y0 + 1.3, z], anim: (t) => { const f = cyc(t, P), a = i * 0.1; return f < a || f > 0.97 ? { s: 0.001 } : { y: Math.abs(Math.sin(t * 3 + i)) * 0.2, s: back(win(f, a, a + 0.06)) }; } }); });
    // The truck running the route round the crossroads.
    const loop = curve([[-1.8, y0, -1.8], [1.8, y0, -1.8], [1.8, y0, 1.8], [-1.8, y0, 1.8]], true);
    moving.push({ geo: place(semi(YEL, K.white, '#1d1f24'), { s: 0.45 }), pivot: [0, 0, 0], anim: (t) => { const a = along(loop, cyc(t, 10)); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Dollar Tree: one price on everything. Down the checkout belt rolls a parade of completely
  // different things, candy, a mop, party plates, a toy, a balloon, and each gets the same green
  // tag as it passes the scanner, under the store's giant price tag and its aisles of everything.
  dollartree: { finder: '#00953a', build: () => {
    const R = rand(230), out = [], GREEN = '#00953a';
    out.push(ground('#8fc66f'), part(rbox(9.6, 0.06, 9.0, 0.03), '#eef0e8', { p: [-0.2, y0 + 0.03, -0.5] }));
    out.push(part(rbox(9.6, 2.8, 0.2, 0.03), '#e8f2e6', { p: [-0.2, y0 + 1.4, -4.9] }), part(rbox(0.2, 2.8, 9.0, 0.03), '#e1eddf', { p: [-4.9, y0 + 1.4, -0.5] }), part(box(9.62, 0.34, 0.22), GREEN, { p: [-0.2, y0 + 2.65, -4.9] }), place(pixText('DOLLAR TREE', 0.08, K.white, 0.03), { p: [-0.6, y0 + 2.65, -4.77] }));
    // The giant price tag on the back wall.
    const tag = merge(part(extrude([[-1.2, -0.6], [1.0, -0.6], [1.45, 0], [1.0, 0.6], [-1.2, 0.6]], 0.12), GREEN), part(cyl(0.09, 0.09, 0.14, 14), K.white, { p: [1.05, 0, 0], r: [Math.PI / 2, 0, 0] }), pixText('$1.25', 0.12, K.white, 0.16).translate(-0.15, 0, 0));
    out.push(place(tag, { p: [2.6, y0 + 1.6, -4.7] }));
    // ---- aisles of everything: four gondolas, fully stocked
    const gc = ['#e5533d', '#f2c94c', '#3d7be0', '#d6336c', '#8a6cf0', '#3fb8a8', '#f29a3a', K.white];
    [-3.8, -2.4, -1.0, 0.4].forEach((x, a) => { out.push(part(rbox(0.7, 1.7, 3.2, 0.03), '#d8dde3', { p: [x, y0 + 0.88, -2.8] })); for (let r = 0; r < 4; r++) for (let k = 0; k < 8; k++) [-1, 1].forEach((s) => out.push(part(rbox(0.14, 0.28, 0.3, 0.03), gc[(a * 2 + r * 3 + k + (s > 0 ? 4 : 0)) % 8], { p: [x + s * 0.38, y0 + 0.35 + r * 0.4, -4.2 + k * 0.4] }))); });
    // The party corner: balloons over a table of plates.
    out.push(part(rbox(1.6, 0.8, 1.2, 0.05), K.white, { p: [3.4, y0 + 0.4, -2.8] }));
    // ---- the checkout: a long belt, the scanner arch, the cashier
    const BZ = 0.6;
    out.push(part(rbox(5.6, 0.8, 0.9, 0.04), '#5b616b', { p: [0.2, y0 + 0.4, BZ] }), part(box(5.5, 0.03, 0.8), '#2b2f36', { p: [0.2, y0 + 0.81, BZ] }), part(rbox(0.12, 0.8, 0.9, 0.03), GREEN, { p: [1.2, y0 + 1.2, BZ] }), part(rbox(0.12, 0.8, 0.9, 0.03), GREEN, { p: [1.6, y0 + 1.2, BZ] }), part(rbox(0.6, 0.12, 0.9, 0.03), GREEN, { p: [1.4, y0 + 1.6, BZ] }));
    out.push(trees(R, [[-4.6, 4.6], [1.0, 4.6], [4.6, 4.6]], 0.45));
    // ---- moving parts
    const moving = [], P = 10;
    moving.push(...walker(moving.length, (t) => ({ x: 1.4, z: BZ - 0.9, ry: -Math.PI / 2, still: true, push: Math.sin(t * 4) > 0.5 }), { shirt: GREEN, pants: '#2b3a55', y: y0 + 0.03 }));
    const minitag = merge(part(extrude([[-0.2, -0.1], [0.15, -0.1], [0.24, 0], [0.15, 0.1], [-0.2, 0.1]], 0.03), GREEN), part(box(0.2, 0.04, 0.035), K.white, { p: [-0.02, 0, 0] }));
    const items = [
      merge(part(rbox(0.5, 0.35, 0.35, 0.06), '#e5533d', { p: [0, 0.18, 0] }), part(box(0.52, 0.1, 0.37), '#f2c94c', { p: [0, 0.18, 0] })),
      merge(part(cyl(0.04, 0.04, 1.2, 8), '#9aa1a9', { p: [0, 0.2, 0], r: [0, 0, Math.PI / 2] }), part(rbox(0.2, 0.25, 0.4, 0.04), '#3d7be0', { p: [0.65, 0.12, 0] })),
      merge(part(cyl(0.35, 0.35, 0.12, 20), K.white, { p: [0, 0.06, 0] }), part(cyl(0.25, 0.25, 0.13, 20), '#d6336c', { p: [0, 0.06, 0] })),
      merge(part(rbox(0.4, 0.35, 0.3, 0.08), '#f29a3a', { p: [0, 0.18, 0] }), part(ball(0.12), '#1d1f24', { p: [0.1, 0.42, 0] })),
      merge(place(bottle(0.6, '#3fb8a8', K.white), {})),
      merge(part(new THREE.SphereGeometry(0.28, 16, 12), '#8a6cf0', { p: [0, 1.2, 0], s: [1, 1.15, 1] }), part(cyl(0.01, 0.01, 1.0, 4), '#9aa1a9', { p: [0, 0.5, 0] }), part(box(0.1, 0.06, 0.1), '#3a3f47', { p: [0, 0.03, 0] })),
    ];
    items.forEach((g, k) => { const it = moving.length; moving.push({ geo: g, pivot: [0, y0 + 0.83, BZ], anim: (t) => { const u = cyc(t, P, k / items.length), x = -2.4 + u * 5.2; return { x, s: Math.min(1, u / 0.05, (1 - u) / 0.05) + 0.001 }; } });
      moving.push({ geo: minitag, pivot: [0.1, 0.55, 0.3], parent: it, anim: (t) => { const u = cyc(t, P, k / items.length), x = -2.4 + u * 5.2; return x > 1.4 ? { s: back(clamp01((x - 1.4) / 0.3)) } : { s: 0.001 }; } }); });
    // The balloon bouquet over the party table.
    [[3.0, -3.0, '#e5533d'], [3.5, -2.6, '#f2c94c'], [3.8, -3.2, '#3d7be0'], [3.2, -2.4, '#d6336c'], [3.9, -2.5, '#8a6cf0'], [3.4, -3.3, '#3fb8a8']].forEach(([x, z, c], i) => moving.push({ geo: merge(part(new THREE.SphereGeometry(0.3, hi() ? 18 : 8, hi() ? 14 : 6), c, { s: [1, 1.15, 1] }), part(cyl(0.008, 0.008, 1.2, 4), '#9aa1a9', { p: [0, -0.9, 0] })), pivot: [x, y0 + 2.4, z], anim: (t) => ({ y: Math.sin(t * 1.3 + i) * 0.12, rz: Math.sin(t * 0.9 + i) * 0.08 }) }));
    // Shoppers with baskets heading for the till.
    [0, 0.5].forEach((o, i) => moving.push(...walker(moving.length, (t) => { const f = cyc(t, P, o), u = win(f, 0, 0.9); return { x: -3.2 + u * 1.6, z: -0.8 + u * 3.2, ry: -1.1, s: Math.min(1, u / 0.05, (1 - u) / 0.05) }; }, { shirt: ['#e5533d', '#3d7be0'][i], pants: '#2b3a55', y: y0 + 0.03, carry: part(rbox(0.4, 0.3, 0.3, 0.04), GREEN, { p: [0.2, 0.75, 0.32] }) })));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // AutoZone: the right part, today. Inside the cut-away store the shelves run floor to ceiling;
  // the AutoZoner looks the part up, it comes off the shelf, and out in the lot the battery goes
  // in and the headlights come on. Out back the hub truck refills the shelves.
  autozone: { finder: '#d52b1e', build: () => {
    const R = rand(223), out = [], RED = '#d52b1e', OR = '#f37f00';
    out.push(ground('#5b616b'), part(box(10.2, 0.02, 10.2), '#6a7079', { p: [0, y0 + 0.01, 0] }));
    // ---- the cut-away store: floor, back and left walls with the stripes
    out.push(part(rbox(6.4, 0.06, 5.0, 0.03), '#e9ecef', { p: [-1.6, y0 + 0.04, -2.3] }), part(rbox(6.4, 2.8, 0.2, 0.03), '#f4f5f6', { p: [-1.6, y0 + 1.4, -4.7] }), part(rbox(0.2, 2.8, 5.0, 0.03), '#eef0f2', { p: [-4.7, y0 + 1.4, -2.3] }));
    [RED, OR, RED].forEach((c, k) => out.push(part(box(6.42, 0.14, 0.22), c, { p: [-1.6, y0 + 2.3 + k * 0.16, -4.7] }), part(box(0.22, 0.14, 5.0), c, { p: [-4.7, y0 + 2.3 + k * 0.16, -2.3] })));
    out.push(place(pixText('AUTOZONE', 0.08, RED, 0.03), { p: [-1.0, y0 + 1.95, -4.58] }));
    // Floor-to-ceiling shelving: three aisles of parts.
    const partC = ['#1d1f24', '#f2c94c', OR, '#3d7be0', '#e5533d', '#9aa1a9'];
    [-3.6, -2.2, -0.8].forEach((x, a) => { out.push(part(rbox(0.7, 2.2, 3.2, 0.03), '#5b616b', { p: [x, y0 + 1.15, -2.9] })); for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) { const c = partC[(a * 3 + r * 2 + k) % 6], y = y0 + 0.35 + r * 0.5, z = -4.2 + k * 0.42; out.push(r % 2 ? part(cyl(0.1, 0.1, 0.32, 10), c, { p: [x + 0.36, y + 0.06, z] }) : part(rbox(0.12, 0.3, 0.32, 0.03), c, { p: [x + 0.36, y + 0.06, z] }), part(r % 2 ? rbox(0.12, 0.3, 0.32, 0.03) : cyl(0.1, 0.1, 0.32, 10), partC[(k + 1) % 6], { p: [x - 0.36, y + 0.06, z] })); } });
    // The counter, the lookup screen, the AutoZoner.
    out.push(part(rbox(1.6, 0.9, 0.6, 0.04), RED, { p: [0.8, y0 + 0.45, -0.6] }), part(rbox(0.6, 0.4, 0.05, 0.03), '#1d1f24', { p: [0.8, y0 + 1.2, -0.75] }), part(box(0.5, 0.3, 0.01), '#4fc3f7', { p: [0.8, y0 + 1.2, -0.72] }), place(fan(RED), { p: [0.8, y0, -1.2], s: 1.4 }));
    // ---- the lot: the customer's car, hood up; the back door and hub truck bay
    const CX = 2.6, CZ = 2.6;
    out.push(place(sedan('#3d7be0'), { p: [CX, y0, CZ], r: [0, Math.PI / 2, 0] }), part(box(0.95, 0.04, 0.7), '#2d5fb3', { p: [CX, y0 + 1.15, CZ - 0.95], r: [0.9, 0, 0] }), place(fan('#5b6b7d'), { p: [CX + 1.0, y0, CZ - 1.4], s: 1.4 }));
    for (let i = 0; i < 4; i++) out.push(part(box(0.06, 0.012, 1.8), '#e9e6df', { p: [0.6 + i * 1.4, y0 + 0.025, CZ] }));
    out.push(trees(R, [[4.6, -1.0], [-4.6, 4.6], [4.6, -4.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 12;
    // The lookup: the part glows on the shelf, comes off to the counter.
    moving.push({ geo: part(torus(0.3, 0.04, TAU, 24), '#62d35f', { r: [0, Math.PI / 2, 0] }), pivot: [-0.44, y0 + 0.41, -3.36], anim: (t) => { const f = cyc(t, P); return f > 0.05 && f < 0.2 ? { s: 1 + Math.sin(t * 10) * 0.1 } : { s: 0.001 }; } });
    const bat = merge(part(rbox(0.36, 0.26, 0.22, 0.03), '#1d1f24'), part(box(0.37, 0.06, 0.23), OR, { p: [0, 0.08, 0] }), part(cyl(0.03, 0.03, 0.06, 8), RED, { p: [0.1, 0.16, 0] }), part(cyl(0.03, 0.03, 0.06, 8), '#9aa1a9', { p: [-0.1, 0.16, 0] }));
    moving.push(rider(bat, curve([[-0.44, y0 + 0.5, -3.36], [0.2, y0 + 2.0, -2.0], [0.8, y0 + 1.0, -0.6]]), P, 0, 0.18, 0.3));
    // The AutoZoner takes it out to the car and fits it.
    const walk = (f) => { const go = easeIO(win(f, 0.32, 0.5)), bk = easeIO(win(f, 0.78, 0.95)), u = go - bk; return { x: 0.8 + (CX - 0.4 - 0.8) * u, z: -1.2 + (CZ - 1.7 + 1.2) * u, ry: f < 0.6 ? -Math.atan2(CZ - 1.7 + 1.2, CX - 1.2) : Math.PI - Math.atan2(CZ - 1.7 + 1.2, CX - 1.2), still: (f > 0.5 && f < 0.78) || f < 0.32 || f > 0.95 }; };
    moving.push(...walker(moving.length, (t) => walk(cyc(t, P)), { shirt: RED, pants: '#1d1f24', y: y0, carry: null }));
    moving.push({ geo: bat, pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P); if (f < 0.3 || f > 0.62) return { s: 0.001 }; const w = walk(f); return f < 0.5 ? { x: w.x + 0.3, y: y0 + 0.85, z: w.z + 0.2 } : { x: CX, y: y0 + 0.85 - easeIO(win(f, 0.52, 0.6)) * 0.2, z: CZ - 0.95 }; } });
    moving.push({ geo: tickGeo(0.28), pivot: [CX, y0 + 1.9, CZ - 0.9], anim: (t) => { const f = cyc(t, P); return f > 0.62 && f < 0.95 ? { ry: Math.PI / 4, s: back(win(f, 0.62, 0.68)) } : { s: 0.001 }; } });
    moving.push({ geo: merge([-0.3, 0.3].map((x) => part(new THREE.CircleGeometry(0.45, 20), '#fff2b0', { p: [x, 0.02, 0.6], r: [-Math.PI / 2, 0, 0] }))), pivot: [CX, y0, CZ - 1.15], anim: (t) => { const f = cyc(t, P); return f > 0.64 && f < 0.97 ? { s: 1 } : { s: 0.001 }; } });
    // The hub truck backing up to the side door and boxes going onto the shelves.
    moving.push({ geo: place(merge(part(rbox(0.8, 0.9, 0.9, 0.08), RED, { p: [0.9, 0.6, 0] }), part(rbox(1.8, 1.1, 0.95, 0.05), K.white, { p: [-0.4, 0.75, 0] }), part(box(1.4, 0.3, 0.02), RED, { p: [-0.4, 0.8, 0.48] }), [[-0.8, 0.45], [0.8, 0.45], [-0.8, -0.45], [0.8, -0.45]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] }))), { r: [0, Math.PI / 2, 0] }), pivot: [-2.6, y0, 0], anim: (t) => { const f = cyc(t, P, 0.5), z = 5.6 - easeOut(win(f, 0, 0.3)) * 4.4 + easeIn(win(f, 0.7, 1)) * 4.4; return { z, s: clamp01((5.0 - z) / 0.6) + 0.001 }; } });
    for (let k = 0; k < 3; k++) moving.push(rider(part(rbox(0.35, 0.3, 0.3, 0.03), '#c99a62'), curve([[-2.6, y0 + 1.2, 1.0], [-2.8, y0 + 2.2, -0.6], [-3.6 + k * 1.4 * 0, y0 + 1.6, -1.8 - k * 0.4]]), P, 0.5 - k * 0.04, 0.32, 0.5));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // O'Reilly Auto Parts: the pros' parts store. From the big distribution centre the parts reach
  // every store, and from the store a pickup runs them to the repair garages within the hour;
  // the car on the lift comes down fixed.
  oreilly: { finder: '#00843d', build: () => {
    const R = rand(131), out = [], GREEN = '#00843d';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.2), '#5b616b', { p: [0, y0 + 0.015, 0.3] }), part(box(1.2, 0.03, 4.6), '#5b616b', { p: [0.0, y0 + 0.015, 2.9] }));
    // ---- the distribution centre, back left
    out.push(part(rbox(3.6, 2.0, 2.6, 0.05), '#e6e9ed', { p: [-3.0, y0 + 1.0, -3.3] }), part(box(3.62, 0.3, 2.62), GREEN, { p: [-3.0, y0 + 1.85, -3.3] }), [0, 1, 2].map((k) => part(box(0.7, 1.0, 0.04), '#7b828c', { p: [-4.2 + k * 1.2, y0 + 0.5, -1.98] })));
    // ---- the store, back right
    out.push(part(rbox(3.2, 1.6, 2.0, 0.05), '#f4f5f6', { p: [2.6, y0 + 0.8, -3.2] }), part(box(3.22, 0.4, 2.02), GREEN, { p: [2.6, y0 + 1.4, -3.2] }), place(pixText("O'REILLY", 0.06, K.white, 0.03), { p: [2.6, y0 + 1.4, -2.18] }), part(box(1.2, 0.8, 0.04), '#2a3c50', { p: [2.0, y0 + 0.45, -2.18] }));
    // ---- the two repair garages, front: bays with lifts
    const garages = [[-3.0, 2.8], [3.2, 2.8]];
    garages.forEach(([x, z]) => {
      out.push(part(rbox(2.6, 0.1, 2.2, 0.03), '#b9bec6', { p: [x, y0 + 0.05, z] }), part(rbox(2.6, 2.0, 0.15, 0.03), '#d8dde3', { p: [x, y0 + 1.0, z - 1.05] }), part(rbox(0.15, 2.0, 2.2, 0.03), '#d0d5db', { p: [x - 1.25, y0 + 1.0, z] }), part(box(2.62, 0.3, 0.17), '#3a3f47', { p: [x, y0 + 1.85, z - 1.05] }));
      [-0.6, 0.6].forEach((dz) => out.push(part(box(0.12, 1.6, 0.12), '#c0392b', { p: [x - 0.9, y0 + 0.8, z + dz] })));
    });
    out.push(trees(R, [[4.6, 0.0], [-4.6, 0.6], [1.6, 4.6], [-1.6, 4.6], [0.4, -4.6]], 0.6));
    // ---- moving parts
    const moving = [], P = 10;
    // The cars on the lifts: up while the part comes, down fixed.
    garages.forEach(([x, z], i) => { const lift = (t) => { const f = cyc(t, P, i * 0.5); return 0.9 * (easeIO(win(f, 0.0, 0.1)) - easeIO(win(f, 0.75, 0.88))); };
      moving.push({ geo: merge(sedan(['#e5533d', '#3d7be0'][i]), part(box(2.0, 0.06, 1.3), '#c0392b', { p: [0, 0.0, 0] })), pivot: [x + 0.1, y0 + 0.1, z], anim: (t) => ({ y: lift(t) }) });
      moving.push(...walker(moving.length, () => ({ x: x + 0.3, z: z + 1.0, ry: Math.PI / 2, still: true }), { shirt: '#3a5a8a', pants: '#2b3a55', y: y0 }));
    });
    // DC → store: a box truck along the back.
    moving.push({ geo: place(semi(GREEN, K.white, GREEN), { s: 0.5 }), pivot: [0, y0, -1.1], anim: (t) => { const f = cyc(t, P), x = -1.4 + Math.sin(f * Math.PI) * 2.6; return { x, ry: f < 0.5 ? 0 : Math.PI }; } });
    // Store → garages: the parts pickup, out to each garage in turn.
    garages.forEach(([x, z], i) => { const route = curve([[2.0, y0, -2.0], [1.6, y0, 0.3], [x * 0.5, y0, 0.3], [x * 0.85, y0, 1.4]]); moving.push({ geo: place(van(K.white, GREEN), { s: 0.7 }), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P, i * 0.5), u = easeIO(win(f, 0.12, 0.4)) - easeIO(win(f, 0.55, 0.75)); if (f < 0.12 || f > 0.75) return { s: 0.001 }; const a = along(route, clamp01(u)); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: f < 0.48 ? a.ry : a.ry + Math.PI }; } });
      moving.push(rider(merge(part(rbox(0.4, 0.3, 0.3, 0.03), '#c99a62'), part(box(0.42, 0.06, 0.1), GREEN)), curve([[x * 0.85, y0 + 1.0, 1.4], [x * 0.9, y0 + 1.6, 2.0], [x + 0.1, y0 + 1.4, z]]), P, i * 0.5, 0.4, 0.5)); });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Publix: the supermarket its employees own. Inside the cut-away store the green-aproned staff
  // stock the aisles, build the famous Pub Sub at the deli and bag at the till; every so often
  // each of them gets a gold dividend coin, and the bagger walks the order out to the car.
  publix: { finder: '#3c8d2f', build: () => {
    const R = rand(224), out = [], GREEN = '#3c8d2f';
    out.push(ground('#5b616b'), part(box(10.2, 0.02, 10.2), '#6a7079', { p: [0, y0 + 0.01, 0] }));
    // ---- the store: floor, back and left walls with the green band and sign
    out.push(part(rbox(7.0, 0.06, 6.0, 0.03), '#f3ead8', { p: [-1.1, y0 + 0.04, -1.8] }), part(rbox(7.0, 2.6, 0.2, 0.03), '#f3ead8', { p: [-1.1, y0 + 1.3, -4.7] }), part(rbox(0.2, 2.6, 6.0, 0.03), '#ece2cc', { p: [-4.6, y0 + 1.3, -1.8] }), part(box(7.02, 0.3, 0.22), GREEN, { p: [-1.1, y0 + 2.45, -4.7] }), part(box(0.22, 0.3, 6.0), GREEN, { p: [-4.6, y0 + 2.45, -1.8] }));
    out.push(place(pixText('PUBLIX', 0.1, GREEN, 0.03), { p: [-2.6, y0 + 1.9, -4.58] }));
    // Aisles of goods.
    const goods = ['#e5533d', '#f2c94c', '#3d7be0', '#2f9e6e', '#d6336c', '#f29a3a', K.white];
    [-3.4, -2.2, -1.0].forEach((x, a) => { out.push(part(rbox(0.6, 1.5, 2.6, 0.03), '#d8dde3', { p: [x, y0 + 0.78, -2.9] })); for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) [-1, 1].forEach((s) => out.push(part(rbox(0.12, 0.3, 0.32, 0.03), goods[(a + r * 2 + k + (s > 0 ? 3 : 0)) % 7], { p: [x + s * 0.32, y0 + 0.35 + r * 0.45, -4.0 + k * 0.44] }))); });
    // Produce bins along the front of the aisles.
    [['#e5533d', -3.4], ['#f29a3a', -2.4], ['#8fc46a', -1.4]].forEach(([c, x]) => { out.push(part(rbox(0.9, 0.5, 0.7, 0.04), '#8a5a3a', { p: [x, y0 + 0.3, -0.8] })); if (hi()) for (let k = 0; k < 9; k++) out.push(part(new THREE.SphereGeometry(0.1, 10, 7), c, { p: [x - 0.25 + (k % 3) * 0.25, y0 + 0.62, -1.0 + Math.floor(k / 3) * 0.2] })); });
    // The deli counter, back right, with the giant sub on it.
    out.push(part(rbox(2.4, 1.0, 0.8, 0.04), '#cfe6f2', { p: [1.2, y0 + 0.5, -3.6] }), part(rbox(2.4, 0.06, 0.9, 0.03), K.white, { p: [1.2, y0 + 1.02, -3.6] }), part(box(2.2, 0.4, 0.02), GREEN, { p: [1.2, y0 + 2.0, -4.58] }), place(pixText('DELI', 0.06, K.white, 0.02), { p: [1.2, y0 + 2.0, -4.56] }));
    // The till, front right of the store.
    out.push(part(rbox(1.8, 0.85, 0.7, 0.04), '#5b616b', { p: [0.9, y0 + 0.43, -0.6] }), part(box(1.6, 0.04, 0.5), '#2b2f36', { p: [0.9, y0 + 0.87, -0.6] }), part(rbox(0.3, 0.3, 0.05, 0.03), '#1d1f24', { p: [1.5, y0 + 1.1, -0.8] }));
    // The lot, front right: the customer's car.
    const CX = 3.2, CZ = 3.0;
    out.push(place(sedan('#c0392b'), { p: [CX, y0, CZ], r: [0, Math.PI / 2, 0] }), part(box(1.0, 0.05, 0.8), '#7a1f15', { p: [CX, y0 + 0.75, CZ - 1.2], r: [0.6, 0, 0] }));
    for (let i = 0; i < 3; i++) out.push(part(box(0.06, 0.012, 2.0), '#e9e6df', { p: [2.4 + i * 1.2, y0 + 0.025, CZ] }));
    out.push(trees(R, [[-4.6, 3.6], [-1.2, 4.4], [4.6, -1.4], [4.6, -4.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 12;
    // The staff: a stocker, the deli associate, the cashier, the bagger. Each gets a dividend coin now and then.
    const staff = [[-1.6, -2.0, Math.PI / 2], [1.2, -4.2, 0], [0.9, -1.2, 0]];
    staff.forEach(([x, z, ry], i) => { moving.push(...walker(moving.length, (t) => ({ x, z, ry, still: true, push: Math.sin(t * 3 + i) > 0.3 }), { shirt: GREEN, pants: '#2b3a55', y: y0 + 0.06 }));
      moving.push({ geo: place(coin(0.2, 0.06), { r: [Math.PI / 2, 0, 0] }), pivot: [x, y0 + 2.2, z], anim: (t) => { const f = cyc(t, P, -i * 0.05); return f > 0.85 && f < 0.98 ? { ry: t * 5, y: easeOut(win(f, 0.85, 0.9)) * 0.3, s: back(win(f, 0.85, 0.88)) } : { s: 0.001 }; } }); });
    // The Pub Sub growing layer by layer on the deli counter.
    const layers = [['#d9a05b', 0.2], ['#5fae45', 0.08], ['#e5533d', 0.08], ['#f2c94c', 0.08], ['#f4d8b8', 0.1], ['#e2b37a', 0.2]];
    let yy = y0 + 1.06;
    layers.forEach(([c, h], k) => { const y = yy; yy += h; moving.push({ geo: k === 0 || k === 5 ? part(capsule(h / 2 + 0.1, 1.6), c, { r: [0, 0, Math.PI / 2], s: [1, k === 5 ? 0.8 : 0.6, 1] }) : part(rbox(1.7, h, 0.36, 0.03), c), pivot: [1.2, y + h / 2, -3.6], anim: (t) => { const f = cyc(t, P), a = k * 0.1; return f > a && f < 0.97 ? { y: (1 - easeOut(win(f, a, a + 0.06))) * 0.6 } : { s: 0.001 }; } }); });
    // The bagger walks the order out to the car and back.
    const out1 = (f) => { const u = easeIO(win(f, 0.2, 0.45)) - easeIO(win(f, 0.6, 0.85)); return { x: 1.6 + (CX - 1.6) * u, z: -0.0 + (CZ - 1.6) * u, ry: f < 0.5 ? -Math.atan2(CZ - 1.6, CX - 1.6) : Math.PI - Math.atan2(CZ - 1.6, CX - 1.6), still: f < 0.2 || (f > 0.45 && f < 0.6) || f > 0.85 }; };
    moving.push(...walker(moving.length, (t) => ({ ...out1(cyc(t, P)), push: true }), { shirt: GREEN, pants: '#2b3a55', y: y0, carry: place(cartGeo(GREEN), { p: [0.95, 0, 0] }) }));
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, P), p = out1(f); return { ...p, z: p.z + 0.7, x: p.x - 0.3, s: f > 0.5 ? Math.max(0.001, 1 - win(f, 0.5, 0.55)) : 1 }; }, { shirt: '#d6336c', pants: '#3a3f47', y: y0 }));
    for (let k = 0; k < 3; k++) moving.push(rider(part(rbox(0.3, 0.38, 0.2, 0.04), '#d8c6a5'), curve([[CX - 1.2, y0 + 0.9, CZ - 1.5], [CX - 0.6, y0 + 1.6, CZ - 1.6], [CX, y0 + 0.9, CZ - 1.3]]), P, -k * 0.03, 0.46, 0.58));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Albertsons: one grocer behind the local names. Safeway, Vons, Jewel-Osco, Acme and Shaw's
  // each keep their own sign and neighbourhood, while one warehouse and one fleet keep them all
  // stocked, with the pharmacy counter in each.
  albertsons: { finder: '#00539f', build: () => {
    const R = rand(133), out = [], BLUE = '#00539f';
    out.push(ground('#8fc66f'));
    // ---- the shared warehouse in the middle
    const WX = -0.4, WZ = -0.6;
    out.push(part(rbox(3.0, 1.6, 2.2, 0.05), '#e6e9ed', { p: [WX, y0 + 0.8, WZ] }), part(box(3.02, 0.35, 2.22), BLUE, { p: [WX, y0 + 1.45, WZ] }), place(pixText('ALBERTSONS', 0.05, K.white, 0.02), { p: [WX, y0 + 1.45, WZ + 1.12] }), [0, 1, 2].map((k) => part(box(0.6, 0.9, 0.04), '#7b828c', { p: [WX - 0.9 + k * 0.9, y0 + 0.45, WZ + 1.11] })));
    out.push(part(rbox(3.4, 0.06, 2.6, 0.03), '#9aa1a9', { p: [WX, y0 + 0.03, WZ] }));
    // ---- the banners round it
    const banners = [[-3.6, -3.6, '#e21a2c', 'SAFEWAY'], [2.8, -3.8, '#d6336c', 'VONS'], [3.8, 0.8, '#00539f', 'JEWEL'], [1.6, 3.8, '#e5533d', 'ACME'], [-3.4, 2.6, '#2f9e6e', "SHAW'S"]];
    banners.forEach(([x, z, c, name]) => {
      const face = Math.atan2(WX - x, WZ - z) * 0 + Math.PI / 4;
      const g = merge(part(rbox(2.0, 1.2, 1.4, 0.05), '#f4efe6', { p: [0, 0.6, 0] }), part(box(2.02, 0.32, 1.42), c, { p: [0, 1.1, 0] }), pixText(name, 0.045, K.white, 0.02).translate(0, 1.1, 0.72), part(box(1.2, 0.6, 0.03), '#9cc3e0', { p: [-0.2, 0.4, 0.71] }), part(rbox(0.36, 0.24, 0.03, 0.03), K.white, { p: [0.68, 0.6, 0.71] }), part(box(0.08, 0.2, 0.035), '#e5533d', { p: [0.68, 0.6, 0.72] }), part(box(0.2, 0.08, 0.035), '#e5533d', { p: [0.68, 0.6, 0.72] }));
      out.push(place(g, { p: [x, y0, z], r: [0, face, 0] }));
    });
    out.push(trees(R, [[0.0, -4.4], [4.6, -1.8], [4.6, 4.4], [-1.2, 4.4], [-4.6, -0.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 10;
    // One fleet, every banner: a truck out to each store in turn.
    banners.forEach(([x, z], i) => { const route = curve([[WX + 0.4, y0, WZ + 1.5], [(WX + x) / 2 + 0.4, y0, (WZ + z) / 2 + 0.4], [x + 0.6, y0, z + 1.2]]); moving.push({ geo: place(semi(BLUE, K.white, BLUE), { s: 0.4 }), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P, i / 5), u = easeIO(win(f, 0, 0.4)) - easeIO(win(f, 0.55, 0.95)), a = along(route, clamp01(u)); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: f < 0.5 ? a.ry : a.ry + Math.PI, s: f > 0.95 || f < 0.02 ? 0.001 : 1 }; } }); moving.push(pulse(x, y0 + 0.05, z, BLUE, P, i / 5 * -1 + 0.4, 1.1)); });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Sysco: the truck behind the menu. From the big distribution centre the trucks run to the
  // restaurant, the school, the hospital and the stadium, and wherever they stop a meal is served.
  sysco: { finder: '#0077c8', build: () => {
    const R = rand(134), out = [], BLUE = '#0077c8';
    out.push(ground('#8fc66f'));
    // ---- the distribution centre, back left
    const DX = -3.0, DZ = -3.2;
    out.push(part(rbox(3.6, 2.0, 2.6, 0.05), '#e6e9ed', { p: [DX, y0 + 1.0, DZ] }), part(box(3.62, 0.35, 2.62), BLUE, { p: [DX, y0 + 1.82, DZ] }), place(pixText('SYSCO', 0.08, K.white, 0.03), { p: [DX, y0 + 1.82, DZ + 1.32] }), [0, 1, 2].map((k) => part(box(0.7, 1.0, 0.04), '#7b828c', { p: [DX - 1.1 + k * 1.1, y0 + 0.5, DZ + 1.31] })));
    out.push(part(rbox(4.2, 0.06, 3.6, 0.03), '#9aa1a9', { p: [DX, y0 + 0.03, DZ + 0.4] }));
    // ---- the customers: a restaurant, a school, a hospital, a stadium
    const sites = [[3.4, -3.4], [3.8, 0.6], [2.2, 3.8], [-2.6, 3.4]];
    { const [x, z] = sites[0]; out.push(part(rbox(1.8, 1.2, 1.4, 0.05), '#f6efe2', { p: [x, y0 + 0.6, z] }), [0, 1, 2, 3].map((i) => part(box(0.45, 0.05, 0.4), i % 2 ? K.white : '#e5533d', { p: [x - 0.67 + i * 0.45, y0 + 1.2, z + 0.85], r: [0.45, 0, 0] })), part(box(1.0, 0.5, 0.04), '#9cc3e0', { p: [x, y0 + 0.5, z + 0.71] }), part(cyl(0.3, 0.3, 0.04, 16), K.white, { p: [x + 1.2, y0 + 0.7, z + 0.4] }), part(cyl(0.03, 0.03, 0.7, 6), K.dark, { p: [x + 1.2, y0 + 0.35, z + 0.4] })); }
    { const [x, z] = sites[1]; out.push(part(rbox(2.0, 1.3, 1.4, 0.05), '#c0533d', { p: [x, y0 + 0.65, z], r: [0, Math.PI / 2, 0] }), part(prism(1.6, 0.4, 2.1), '#7a3a2a', { p: [x, y0 + 1.3, z] }), part(cyl(0.03, 0.03, 1.4, 6), '#c9ced6', { p: [x - 1.0, y0 + 0.7, z + 1.0] }), part(box(0.4, 0.25, 0.02), '#3c3b6e', { p: [x - 0.8, y0 + 1.25, z + 1.0] }), part(box(0.04, 0.6, 1.2), '#f2c94c', { p: [x + 0.71, y0 + 0.5, z] })); }
    { const [x, z] = sites[2]; out.push(place(block(1.6, 2.0, 1.4, K.white, '#7fb7d8', 0.35), { p: [x, y0, z] }), part(box(0.12, 0.42, 0.04), '#e5533d', { p: [x, y0 + 1.7, z + 0.72] }), part(box(0.42, 0.12, 0.04), '#e5533d', { p: [x, y0 + 1.7, z + 0.72] })); }
    { const [x, z] = sites[3]; out.push(part(new THREE.CylinderGeometry(1.2, 1.0, 0.9, hi() ? 32 : 12, 1, true), '#c9ced6', { p: [x, y0 + 0.45, z] }), part(cyl(0.95, 0.95, 0.04, 32), '#5fae45', { p: [x, y0 + 0.04, z] }), part(torus(1.2, 0.06, TAU, 40), BLUE, { p: [x, y0 + 0.9, z], r: [Math.PI / 2, 0, 0] })); }
    out.push(trees(R, [[0.4, -4.6], [0.6, 1.0], [-4.6, 0.8], [4.6, 4.6], [-0.4, 4.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 9;
    const truck = place(merge(part(rbox(0.8, 0.9, 0.9, 0.08), BLUE, { p: [0.9, 0.6, 0] }), part(box(0.04, 0.3, 0.75), '#26323f', { p: [1.31, 0.75, 0] }), part(rbox(1.8, 1.1, 0.95, 0.05), K.white, { p: [-0.4, 0.75, 0] }), part(box(1.4, 0.3, 0.02), BLUE, { p: [-0.4, 0.8, 0.48] }), [[-0.8, 0.45], [0.8, 0.45], [-0.8, -0.45], [0.8, -0.45]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] }))), { s: 0.6 });
    const plate = merge(part(cyl(0.3, 0.25, 0.05, 20), K.white), part(new THREE.SphereGeometry(0.12, 10, 8), '#e5533d', { p: [-0.08, 0.05, 0], s: [1, 0.6, 1] }), part(new THREE.SphereGeometry(0.1, 10, 8), '#5fae45', { p: [0.1, 0.05, 0.05], s: [1, 0.6, 1] }), part(box(0.16, 0.06, 0.1), '#d9a05b', { p: [0.05, 0.05, -0.12] }));
    sites.forEach(([x, z], i) => {
      const route = curve([[DX + 1.2, y0, DZ + 2.0], [(DX + x) / 2 + 0.6, y0, (DZ + z) / 2 + 0.8], [x - 0.6, y0, z - 1.4 + (i === 3 ? 0.4 : 0)]]);
      moving.push({ geo: truck, pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P, i / 4), u = easeIO(win(f, 0, 0.4)) - easeIO(win(f, 0.6, 0.95)), a = along(route, clamp01(u)); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: f < 0.5 ? a.ry : a.ry + Math.PI, s: f > 0.95 || f < 0.02 ? 0.001 : 1 }; } });
      moving.push({ geo: plate, pivot: [x, y0 + 2.4, z], anim: (t) => { const f = cyc(t, P, i / 4); return f > 0.42 && f < 0.7 ? { s: back(win(f, 0.42, 0.5)) * 1.4, ry: t, y: Math.sin(t * 3) * 0.06 } : { s: 0.001 }; } });
    });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Tyson Foods: from the egg to the supermarket, all in one company. Chicks hatch, grow up in
  // the farm's barns, go to the plant, and come out as packs of nuggets and chicken on the truck.
  tyson: { finder: '#002d72', build: () => {
    const R = rand(135), out = [], RED = '#e31837', NAVY = '#002d72';
    out.push(ground('#8fc66f'));
    // ---- the hatchery (left), the barns (back), the plant (right)
    out.push(part(rbox(2.0, 1.2, 1.6, 0.05), '#f4efe6', { p: [-3.6, y0 + 0.6, 1.6] }), part(prism(2.2, 0.6, 1.8), NAVY, { p: [-3.6, y0 + 1.2, 1.6] }), [0, 1, 2].map((k) => part(new THREE.SphereGeometry(0.14, 12, 8), '#f6e7c9', { p: [-3.0 + k * 0.3, y0 + 0.14, 2.7], s: [1, 1.3, 1] })));
    [-3.4, -1.4].forEach((x) => out.push(part(rbox(1.6, 0.9, 3.0, 0.05), '#e8e4da', { p: [x, y0 + 0.45, -3.2] }), part(prism(1.8, 0.5, 3.2), '#8a8f96', { p: [x, y0 + 0.9, -3.2] }), part(box(1.62, 0.12, 2.8), '#c9ced6', { p: [x, y0 + 0.5, -3.2] })));
    out.push(place(bin(0.4, 1.4, '#9aa1a9'), { p: [-0.2, y0, -4.2] }));
    out.push(part(rbox(3.0, 1.8, 2.4, 0.05), '#eef0f2', { p: [3.2, y0 + 0.9, -2.6] }), part(box(3.02, 0.35, 2.42), RED, { p: [3.2, y0 + 1.6, -2.6] }), place(pixText('TYSON', 0.07, K.white, 0.03), { p: [3.2, y0 + 1.6, -1.38] }), part(cyl(0.15, 0.18, 1.2, 12), '#c9ced6', { p: [4.2, y0 + 2.2, -3.2] }));
    // The plant's out-conveyor and the truck bay.
    out.push(part(rbox(0.6, 0.5, 3.0, 0.04), '#5b616b', { p: [3.2, y0 + 0.25, 0.4] }), part(box(0.5, 0.03, 2.9), '#2b2f36', { p: [3.2, y0 + 0.51, 0.4] }));
    out.push(part(box(10.2, 0.03, 1.2), '#5b616b', { p: [0, y0 + 0.015, 3.6] }));
    out.push(trees(R, [[0.4, 1.6], [-0.6, 4.6], [4.6, 4.6], [-4.6, -1.0], [0.8, -2.0]], 0.55));
    // ---- moving parts
    const moving = [], P = 12;
    const chick = (s = 1) => place(merge(part(new THREE.SphereGeometry(0.16, 12, 8), '#ffe27a', { s: [1.2, 1, 1] }), part(new THREE.SphereGeometry(0.1, 10, 7), '#ffe27a', { p: [0.14, 0.13, 0] }), part(cone(0.03, 0.08, 6), '#f29a3a', { p: [0.25, 0.13, 0], r: [0, 0, -Math.PI / 2] })), { s });
    const hen = merge(part(new THREE.SphereGeometry(0.22, 14, 10), K.white, { s: [1.3, 1, 1] }), part(new THREE.SphereGeometry(0.13, 12, 8), K.white, { p: [0.25, 0.2, 0] }), part(box(0.05, 0.08, 0.1), '#e5533d', { p: [0.27, 0.35, 0] }), part(cone(0.04, 0.1, 6), '#f29a3a', { p: [0.39, 0.2, 0], r: [0, 0, -Math.PI / 2] }), part(cone(0.12, 0.2, 8), K.white, { p: [-0.3, 0.12, 0], r: [0, 0, 0.9] }));
    // Chicks walking from the hatchery to the barns.
    for (let k = 0; k < 4; k++) moving.push(rider(chick(), curve([[-3.0, y0 + 0.15, 2.4], [-2.6, y0 + 0.15, 0.4], [-2.4, y0 + 0.15, -1.6]]), P / 2, k / 4, 0, 0.9, (t) => ({ y: Math.abs(Math.sin(t * 10)) * 0.05 })));
    // Hens pecking in the yard by the barns.
    [[-2.4, -1.2], [-1.8, -1.5], [-3.0, -1.4], [-0.6, -1.3]].forEach(([x, z], i) => moving.push({ geo: hen, pivot: [x, y0 + 0.2, z], anim: (t) => ({ ry: i + Math.sin(t * 0.7 + i) * 0.8, rz: -Math.max(0, Math.sin(t * 3 + i * 2)) * 0.4 }) }));
    // Packs out of the plant down the conveyor to the truck.
    const pack = merge(part(rbox(0.42, 0.12, 0.3, 0.03), RED), part(box(0.3, 0.13, 0.18), '#f4d8b8'), part(box(0.15, 0.14, 0.06), K.white, { p: [0.1, 0, -0.1] }));
    for (let k = 0; k < 5; k++) moving.push({ geo: pack, pivot: [3.2, y0 + 0.6, 0], anim: (t) => { const u = cyc(t, 4, k / 5); return { z: -1.0 + u * 2.8, s: Math.min(1, u / 0.06, (1 - u) / 0.06) + 0.001 }; } });
    moving.push({ geo: place(semi(RED, K.white, NAVY), { s: 0.55 }), pivot: [0, y0, 3.6], anim: (t) => { const f = cyc(t, P), x = f < 0.5 ? 3.0 : 3.0 - easeIn(win(f, 0.5, 0.95)) * 9; return { x, ry: Math.PI, s: clamp01((5.6 - Math.abs(x)) / 0.6) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Kraft Heinz: the brands already in every pantry. The giant Heinz bottle tips and lays down
  // the ketchup on the fries and the burger, the Kraft mac and cheese steams, and the shelf of
  // familiar labels stands behind.
  kraftheinz: { finder: '#c8102e', build: () => {
    const R = rand(136), out = [], RED = '#c8102e', KBLUE = '#1c5aa6';
    out.push(ground('#8fc66f'), part(rbox(7.0, 0.08, 6.0, 0.03), '#f1e7d6', { p: [-0.6, y0 + 0.04, -0.6] }));
    // ---- the pantry shelf, back
    out.push(part(rbox(7.0, 3.2, 0.5, 0.04), K.wood, { p: [-0.6, y0 + 1.6, -4.4] }));
    for (let r = 0; r < 3; r++) { out.push(part(box(6.8, 0.06, 0.5), '#8a5a36', { p: [-0.6, y0 + 0.4 + r * 0.95, -4.15] })); for (let k = 0; k < 11; k++) { const x = -3.7 + k * 0.6, kind = (k + r) % 4; out.push(kind === 0 ? place(bottle(0.6, RED, K.white), { p: [x, y0 + 0.43 + r * 0.95, -4.1] }) : kind === 1 ? part(rbox(0.4, 0.6, 0.15, 0.03), KBLUE, { p: [x, y0 + 0.73 + r * 0.95, -4.1] }) : kind === 2 ? part(cyl(0.16, 0.16, 0.4, 16), ['#f2c94c', '#3fb8a8', '#e5533d'][r], { p: [x, y0 + 0.63 + r * 0.95, -4.1] }) : part(rbox(0.35, 0.5, 0.12, 0.03), ['#f29a3a', '#8a6cf0', '#2f9e6e'][r], { p: [x, y0 + 0.68 + r * 0.95, -4.1] })); } }
    // ---- the table: a plate with fries and a burger, the mac and cheese bowl, the box
    const TX = 0.8, TZ = 0.8;
    out.push(part(cyl(1.2, 1.2, 0.08, 40), K.white, { p: [TX, y0 + 0.12, TZ] }), part(torus(1.2, 0.06, TAU, 48), '#e9e6df', { p: [TX, y0 + 0.16, TZ], r: [Math.PI / 2, 0, 0] }));
    for (let k = 0; k < (hi() ? 18 : 6); k++) { const a = R() * TAU, d = R() * 0.5; out.push(part(box(0.08, 0.08, 0.6), '#f2c14e', { p: [TX + 0.4 + Math.cos(a) * d, y0 + 0.22 + R() * 0.1, TZ + 0.3 + Math.sin(a) * d], r: [R() * 0.3, R() * TAU, 0] })); }
    out.push(part(cyl(0.45, 0.48, 0.18, 24), '#d9a05b', { p: [TX - 0.45, y0 + 0.25, TZ - 0.2] }), part(cyl(0.48, 0.48, 0.12, 24), '#6f3b22', { p: [TX - 0.45, y0 + 0.4, TZ - 0.2] }), part(cyl(0.5, 0.5, 0.04, 24), '#f2c94c', { p: [TX - 0.45, y0 + 0.48, TZ - 0.2] }), part(new THREE.SphereGeometry(0.46, 24, 12, 0, TAU, 0, Math.PI / 2), '#d9a05b', { p: [TX - 0.45, y0 + 0.5, TZ - 0.2], s: [1, 0.55, 1] }));
    const BX = -2.6, BZ = 1.4;
    out.push(part(cyl(0.7, 0.55, 0.45, 32), K.white, { p: [BX, y0 + 0.25, BZ] }), part(cyl(0.62, 0.62, 0.06, 32), '#f5a623', { p: [BX, y0 + 0.47, BZ] }));
    if (hi()) for (let k = 0; k < 16; k++) { const a = R() * TAU, d = R() * 0.5; out.push(part(torus(0.06, 0.025, Math.PI, 8), '#ffc53d', { p: [BX + Math.cos(a) * d, y0 + 0.52, BZ + Math.sin(a) * d], r: [Math.PI / 2, 0, R() * TAU] })); }
    out.push(part(rbox(0.9, 1.3, 0.3, 0.04), KBLUE, { p: [-3.6, y0 + 0.69, 0.0], r: [0, Math.PI / 4, 0] }), place(merge(part(rbox(0.6, 0.3, 0.02, 0.1), K.white), pixText('KRAFT', 0.035, KBLUE, 0.03)), { p: [-3.48, y0 + 1.0, 0.12], r: [0, Math.PI / 4, 0] }), part(box(0.6, 0.3, 0.02), '#ffc53d', { p: [-3.48, y0 + 0.55, 0.12], r: [0, Math.PI / 4, 0] }));
    out.push(trees(R, [[4.6, 4.6], [4.6, -3.6], [-4.6, 4.6], [1.6, 4.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 7;
    // The bottle: hangs over the plate, turns upside down, squeezes, rights itself.
    const btl = merge(part(lathe([[0, 0], [0.42, 0.02], [0.46, 0.2], [0.44, 1.3], [0.28, 1.75], [0.2, 1.95], [0, 1.96]], 32), RED), part(cyl(0.21, 0.21, 0.25, 20), K.white, { p: [0, 2.05, 0] }), part(new THREE.CylinderGeometry(0.47, 0.47, 0.55, hi() ? 32 : 12, 1, true), '#f4ead2', { p: [0, 0.85, 0] }), place(pixText('HEINZ', 0.045, RED, 0.03), { p: [0, 0.9, 0.47] }), part(cone(0.1, 0.15, 12), K.white, { p: [0, 2.24, 0] })).translate(0, -1.1, 0);
    const tip = (t) => { const f = cyc(t, P); return easeIO(win(f, 0.1, 0.3)) - easeIO(win(f, 0.75, 0.9)); };
    moving.push({ geo: btl, pivot: [TX + 0.4, y0 + 2.6, TZ + 0.3], anim: (t) => ({ ry: Math.PI / 4, rz: tip(t) * Math.PI, y: Math.sin(t * 2) * 0.05 }) });
    // The ketchup ribbon landing on the fries.
    moving.push({ geo: part(capsule(0.09, 0.6), '#a30d1e', { r: [0, 0, Math.PI / 2] }), pivot: [TX + 0.4, y0 + 0.38, TZ + 0.3], anim: (t) => { const f = cyc(t, P); return f > 0.35 && f < 0.95 ? { sx: Math.min(1, win(f, 0.35, 0.7)) * 1.4 + 0.001, ry: 0.6 } : { s: 0.001 }; } });
    moving.push({ geo: part(cyl(0.05, 0.08, 1.0, 12), '#c8102e', { p: [0, -0.5, 0] }), pivot: [TX + 0.4, y0 + 1.35, TZ + 0.3], anim: (t) => { const f = cyc(t, P); return f > 0.32 && f < 0.72 ? { sy: 0.9 + Math.sin(t * 20) * 0.08 } : { s: 0.001 }; } });
    // Steam off the mac and cheese.
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.16, 10, 8), '#f4f1ea'), pivot: [BX + (k - 1) * 0.2, y0 + 0.6, BZ], anim: (t) => { const u = cyc(t, 2.4, k / 3); return { y: u * 1.4, x: Math.sin(u * 6 + k) * 0.1, s: Math.sin(u * Math.PI) * 1.2 + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // General Mills: from the mill to the breakfast table. Oats from the field go into the old
  // flour mill by the river, out come the yellow boxes, and the giant box pours its O's into the
  // bowl of milk.
  generalmills: { finder: '#1a3d8f', build: () => {
    const R = rand(137), out = [], BLUE = '#1a3d8f', YEL = '#f6c814';
    out.push(ground('#8fc66f'), part(box(10.2, 0.05, 1.6), 'W', { p: [0, y0 + 0.02, -4.3] }));
    // ---- the oat field, left
    out.push(part(box(3.0, 0.3, 3.4), '#d9b45a', { p: [-3.4, y0 + 0.15, 0.6] }));
    if (hi()) for (let k = 0; k < 140; k++) { const x = -4.8 + R() * 2.8, z = -1.0 + R() * 3.2, h = 0.4 + R() * 0.2; out.push(windy(part(cyl(0.012, 0.012, h, 4), '#c9a24a', { p: [x, y0 + 0.3 + h / 2, z] }), 0.4), windy(part(new THREE.SphereGeometry(0.035, 5, 3), '#e9c46a', { p: [x, y0 + 0.3 + h, z], s: [1, 2.4, 1] }), 0.5)); }
    // ---- the mill by the river, back: brick, tall, with its sign and the water wheel
    const MX = -2.4, MZ = -2.8;
    out.push(part(rbox(3.0, 3.6, 1.8, 0.04), '#b9653f', { p: [MX, y0 + 1.8, MZ] }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) out.push(part(box(0.3, 0.42, 0.04), '#f3e7c9', { p: [MX - 1.1 + c * 0.55, y0 + 0.6 + r * 0.8, MZ + 0.91] }));
    out.push(part(box(2.6, 0.4, 0.06), BLUE, { p: [MX, y0 + 3.3, MZ + 0.92] }), place(pixText('GENERAL MILLS', 0.045, K.white, 0.03), { p: [MX, y0 + 3.3, MZ + 0.96] }), part(cyl(0.25, 0.3, 1.6, 14), '#b9653f', { p: [MX + 1.1, y0 + 4.4, MZ - 0.4] }));
    // ---- the box factory output, right: a shelf of yellow boxes
    for (let k = 0; k < 5; k++) out.push(part(rbox(0.6, 0.9, 0.25, 0.03), YEL, { p: [2.0 + k * 0.65, y0 + 0.45, -2.8] }), part(cyl(0.12, 0.12, 0.02, 14), BLUE, { p: [2.0 + k * 0.65, y0 + 0.55, -2.67], r: [Math.PI / 2, 0, 0] }));
    // ---- the table with the bowl
    const BX = 1.4, BZ = 1.6;
    out.push(part(rbox(3.2, 0.12, 2.4, 0.04), K.wood, { p: [BX, y0 + 0.9, BZ] }), [[-1.4, -1.0], [1.4, -1.0], [-1.4, 1.0], [1.4, 1.0]].map(([x, z]) => part(box(0.1, 0.84, 0.1), '#6f4a2c', { p: [BX + x, y0 + 0.42, BZ + z] })));
    out.push(part(lathe([[0, 0], [0.5, 0], [0.9, 0.25], [1.05, 0.6], [1.0, 0.6], [0.85, 0.28], [0, 0.1]], 40), '#e5533d', { p: [BX - 0.3, y0 + 0.96, BZ + 0.2] }), part(cyl(0.95, 0.95, 0.04, 40), '#f8f6f1', { p: [BX - 0.3, y0 + 1.48, BZ + 0.2] }));
    if (hi()) for (let k = 0; k < 24; k++) { const a = R() * TAU, d = R() * 0.75; out.push(part(torus(0.08, 0.035, TAU, 12), '#e9b949', { p: [BX - 0.3 + Math.cos(a) * d, y0 + 1.52, BZ + 0.2 + Math.sin(a) * d], r: [Math.PI / 2 + (R() - 0.5) * 0.5, 0, R() * TAU] })); }
    out.push(part(rbox(0.12, 0.04, 0.6, 0.02), '#c9ced6', { p: [BX + 0.9, y0 + 0.98, BZ + 0.6] }));
    out.push(trees(R, [[4.6, 4.6], [4.6, 0.0], [-1.0, 4.4], [-4.6, 4.4], [0.6, -1.2]], 0.55));
    // ---- moving parts
    const moving = [], P = 8;
    // The water wheel turning.
    moving.push({ geo: merge(part(torus(0.8, 0.06, TAU, 32), '#6f4a2c'), Array.from({ length: 8 }, (_, k) => part(box(0.08, 0.4, 0.5), '#8a5a36', { p: [Math.cos(k * TAU / 8) * 0.8, Math.sin(k * TAU / 8) * 0.8, 0], r: [0, 0, k * TAU / 8] }))), pivot: [MX + 1.7, y0 + 0.6, MZ - 1.3], anim: (t) => ({ ry: Math.PI / 2, rx: 0, rz: -t * 0.8 }) });
    // Oats from the field to the mill; boxes from the mill to the shelf.
    for (let k = 0; k < 3; k++) moving.push(rider(part(new THREE.SphereGeometry(0.14, 8, 6), '#e9c46a', { s: [1, 1.6, 1] }), curve([[-3.4, y0 + 0.8, 0.4], [-3.0, y0 + 2.2, -1.2], [MX, y0 + 1.6, MZ + 1.0]]), P / 2, k / 3, 0, 0.7));
    moving.push(rider(part(rbox(0.4, 0.6, 0.18, 0.03), YEL), curve([[MX + 1.6, y0 + 1.0, MZ + 0.4], [0.6, y0 + 2.0, -2.2], [2.0, y0 + 1.4, -2.6]]), P / 2, 0.4, 0, 0.7));
    // The giant box, tipping to pour.
    const gbox = merge(part(rbox(1.2, 1.7, 0.45, 0.05), YEL), part(cyl(0.3, 0.3, 0.02, 20), BLUE, { p: [0, 0.2, 0.235], r: [Math.PI / 2, 0, 0] }), part(torus(0.22, 0.06, TAU, 20), '#e9b949', { p: [0, 0.2, 0.25] }), place(pixText('O', 0.08, BLUE, 0.03), { p: [0, 0.55, 0.24] })).translate(0, -0.85, 0);
    const tilt = (t) => { const f = cyc(t, P); return easeIO(win(f, 0.05, 0.25)) - easeIO(win(f, 0.75, 0.92)); };
    moving.push({ geo: gbox, pivot: [BX + 1.0, y0 + 3.0, BZ + 0.2], anim: (t) => ({ ry: Math.PI / 4, rz: tilt(t) * 2.2, x: -tilt(t) * 0.4 }) });
    // The O's falling into the bowl.
    for (let k = 0; k < (hi() ? 12 : 4); k++) moving.push({ geo: part(torus(0.08, 0.035, TAU, 12), '#e9b949'), pivot: [BX - 0.2 + (k % 3) * 0.12, y0 + 2.6, BZ + 0.2 + (k % 4) * 0.08], anim: (t) => { const f = cyc(t, P); if (f < 0.25 || f > 0.75) return { s: 0.001 }; const u = cyc(t, 0.8, k / 12); return { y: -u * 1.1, rx: u * 8 + k, rz: u * 5, s: 1 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Mondelez International: the snacks the world reaches for. The giant Oreo twists open and
  // dunks in the glass of milk; Cadbury, Toblerone and Ritz stand round it; and packs of all of
  // them circle the turning globe they are sold across.
  mondelez: { finder: '#4f2170', build: () => {
    const R = rand(228), out = [], PURP = '#4f2170', OREO = '#2b1d16';
    out.push(ground('#8fc66f'), part(cyl(2.6, 2.6, 0.05, 56), '#ece6f2', { p: [0.2, y0 + 0.025, 0.4] }));
    // ---- the glass of milk
    const GX = 1.4, GZ = 0.9;
    out.push(part(new THREE.CylinderGeometry(1.0, 0.9, 2.6, hi() ? 40 : 14, 1, true), '#e3eef5', { p: [GX, y0 + 1.3, GZ] }), part(cyl(0.95, 0.87, 2.0, 40), '#fbfbf8', { p: [GX, y0 + 1.02, GZ] }), part(torus(1.0, 0.05, TAU, 40), '#d5e3ec', { p: [GX, y0 + 2.6, GZ], r: [Math.PI / 2, 0, 0] }));
    // ---- Cadbury: a giant purple bar standing up, back left
    const bar = merge(part(rbox(1.6, 2.6, 0.4, 0.06), PURP), Array.from({ length: 8 }, (_, k) => part(rbox(0.66, 0.54, 0.1, 0.06), '#5d2a86', { p: [-0.38 + (k % 2) * 0.76, -0.95 + Math.floor(k / 2) * 0.64, 0.2] })), place(pixText('CADBURY', 0.04, K.gold, 0.02), { p: [0, 1.15, 0.22] }));
    out.push(place(bar, { p: [-3.4, y0 + 1.3, -2.4], r: [0, Math.PI / 4, -0.12] }));
    // Toblerone: a long triangular bar of peaks, back right.
    const tob = merge(part(box(3.0, 0.1, 0.8), '#d9b45a', { p: [0, 0.05, 0] }), Array.from({ length: 7 }, (_, k) => part(prism(0.42, 0.62, 0.8), '#c9a24a', { p: [-1.26 + k * 0.42, 0.1, 0], r: [0, 0, 0] })));
    out.push(place(tob, { p: [2.4, y0, -3.4], r: [0, -Math.PI / 4 + 0.3, 0] }));
    // Ritz: a stack of round crackers, front left.
    for (let k = 0; k < 5; k++) { out.push(part(new THREE.CylinderGeometry(0.6, 0.6, 0.12, hi() ? 24 : 10), '#e8a24a', { p: [-3.0, y0 + 0.07 + k * 0.13, 2.4], r: [0, k * 0.4, 0] })); }
    if (hi()) for (let k = 0; k < 7; k++) { const a = k * TAU / 7; out.push(part(cyl(0.03, 0.03, 0.02, 6), '#b8752e', { p: [-3.0 + Math.cos(a) * 0.35, y0 + 0.72, 2.4 + Math.sin(a) * 0.35] })); }
    // The globe on its stand, back.
    out.push(part(cyl(0.5, 0.6, 0.3, 24), '#3a3f47', { p: [-0.6, y0 + 0.15, -3.6] }), part(cyl(0.08, 0.08, 1.0, 8), '#9aa1a9', { p: [-0.6, y0 + 0.8, -3.6] }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, 0.4], [-4.6, -0.4]], 0.5));
    // ---- moving parts
    const moving = [], P = 8;
    const land = (x, y, z) => { const u = x, v = y, w = z; if (Math.abs(v) > 0.88) return '#f4f6f8'; const n = Math.sin(u * 4.1 + 1.3) + Math.sin(v * 3.7 + u * 2.1) + Math.sin(w * 4.3 - v * 1.7); return n > 0.6 ? '#7cc46a' : '#3b8fd9'; };
    moving.push({ geo: part(new THREE.SphereGeometry(1.0, hi() ? 40 : 14, hi() ? 24 : 8), land), pivot: [-0.6, y0 + 2.3, -3.6], anim: (t) => ({ ry: t * 0.3 }) });
    for (let k = 0; k < 4; k++) moving.push({ geo: part(rbox(0.36, 0.22, 0.1, 0.04), [PURP, '#d9b45a', '#e8a24a', '#1f5fa8'][k]), pivot: [-0.6, y0 + 2.3, -3.6], anim: (t) => { const a = t * 0.9 + k * TAU / 4; return { x: Math.cos(a) * 1.5, z: Math.sin(a) * 1.5, y: Math.sin(a * 2) * 0.3, ry: -a }; } });
    // The giant Oreo: stands on edge; the top wafer twists off, the cream half dunks, it goes back together.
    const OX = -0.9, OZ = 1.1, OQ = Math.PI / 4;
    const wafer = merge(part(cyl(1.0, 1.0, 0.24, 48), OREO, { r: [Math.PI / 2, 0, 0] }), hi() ? Array.from({ length: 20 }, (_, k) => part(box(0.06, 0.04, 0.14), '#3d2b22', { p: [Math.cos(k * TAU / 20) * 0.75, Math.sin(k * TAU / 20) * 0.75, 0.12], r: [0, 0, k * TAU / 20] })) : [], part(torus(0.42, 0.03, TAU, 32), '#3d2b22', { p: [0, 0, 0.12] }));
    const half = moving.length;
    moving.push({ geo: merge(wafer, part(cyl(0.94, 0.94, 0.2, 48), K.white, { p: [0, 0, -0.22], r: [Math.PI / 2, 0, 0] })), pivot: [OX, y0 + 1.1, OZ], anim: (t) => { const f = cyc(t, P), d = easeIO(win(f, 0.35, 0.5)) - easeIO(win(f, 0.72, 0.86)), dip = bump(f, 0.6, 0.06); return { ry: OQ, x: d * (GX - OX), z: d * (GZ - OZ), y: d * 2.0 - dip * 1.2, rx: d * Math.PI / 2 }; } });
    moving.push({ geo: wafer, pivot: [OX, y0 + 1.1, OZ], anim: (t) => { const f = cyc(t, P), tw = easeIO(win(f, 0.05, 0.25)) - easeIO(win(f, 0.88, 0.98)), lift = easeIO(win(f, 0.2, 0.32)) - easeIO(win(f, 0.86, 0.96)); const back1 = new V(0, 0, -1).applyAxisAngle(new V(0, 1, 0), OQ); return { ry: OQ, x: back1.x * (0.44 + lift * 0.9), z: back1.z * (0.44 + lift * 0.9), y: lift * 0.4, rz: tw * 2.0 }; } });
    out.push(part(rbox(1.2, 0.5, 0.8, 0.06), '#d8d0e6', { p: [OX, y0 + 0.25, OZ] }));
    // Splashes when it dunks.
    for (let k = 0; k < 5; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.1, 8, 6), K.white), pivot: [GX, y0 + 2.6, GZ], anim: (t) => { const f = cyc(t, P), u = win(f, 0.58, 0.72); return u > 0 && u < 1 ? { x: Math.cos(k * 1.3) * u * 0.8, z: Math.sin(k * 1.3) * u * 0.8, y: hop(u) * 0.6 } : { s: 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Hershey: America's chocolate town. In the factory each Kiss is dropped onto the belt and
  // wrapped in silver foil with its paper plume; the street lamps of Hershey, Pennsylvania are
  // Kisses too.
  hershey: { finder: '#4e2a1e', build: () => {
    const R = rand(139), out = [], BROWN = '#4e2a1e', CHOC = '#5a3221';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.4), '#5b616b', { p: [0, y0 + 0.015, 3.4] }));
    // ---- the factory, back: brick, smokestacks with HERSHEY down them
    const FX = -0.8, FZ = -3.2;
    out.push(part(rbox(7.0, 2.4, 2.0, 0.04), '#9b5a3c', { p: [FX, y0 + 1.2, FZ] }));
    for (let c = 0; c < 10; c++) out.push(part(box(0.4, 0.6, 0.04), '#f3e7c9', { p: [FX - 3.0 + c * 0.66, y0 + 1.5, FZ + 1.01] }));
    [-3.6, -2.8].forEach((x) => out.push(part(cyl(0.3, 0.36, 5.0, 16), '#9b5a3c', { p: [x, y0 + 2.5, -4.2] }), part(cyl(0.34, 0.34, 0.2, 16), '#5b3a2a', { p: [x, y0 + 5.0, -4.2] })));
    out.push(place(pixText('HERSHEY', 0.06, K.white, 0.03), { p: [FX + 1.4, y0 + 2.1, FZ + 1.03] }));
    // ---- the line in front of the factory: depositor, belt, wrapper
    const LZ = -0.6;
    out.push(part(rbox(7.0, 0.5, 1.0, 0.05), '#5b616b', { p: [FX, y0 + 0.25, LZ] }), part(box(6.9, 0.03, 0.9), '#e9e6df', { p: [FX, y0 + 0.52, LZ] }));
    out.push(part(rbox(1.2, 1.4, 1.2, 0.05), '#c9ced6', { p: [-3.4, y0 + 1.4, LZ] }), part(cone(0.4, 0.5, 20), '#c9ced6', { p: [-3.4, y0 + 0.9, LZ], r: [Math.PI, 0, 0] }), part(rbox(1.3, 1.1, 1.3, 0.05), '#b9bec6', { p: [0.6, y0 + 1.2, LZ] }));
    [[-3.4, 0], [0.6, 0]].forEach(([x]) => [-0.55, 0.55].forEach((dz) => out.push(part(box(0.1, 0.9, 0.1), '#7b828c', { p: [x - 0.5, y0 + 0.45, LZ + dz] }), part(box(0.1, 0.9, 0.1), '#7b828c', { p: [x + 0.5, y0 + 0.45, LZ + dz] }))));
    // ---- the Kiss street lamps along the road
    const kiss = (c, s) => place(merge(part(lathe([[0, 0], [0.5, 0], [0.48, 0.15], [0.34, 0.4], [0.16, 0.7], [0.05, 0.95], [0, 1.0]], 32), c), part(box(0.03, 0.5, 0.15), K.white, { p: [0, 1.15, 0.05], r: [0, 0, 0.2] })), { s });
    [-3.6, -1.2, 1.2, 3.6].forEach((x, i) => out.push(part(cyl(0.05, 0.06, 2.0, 10), '#2b2f36', { p: [x, y0 + 1.0, 2.5] }), place(kiss(i % 2 ? '#c9ced6' : '#d9dde3', 0.45), { p: [x, y0 + 2.0, 2.5] })));
    // ---- a giant Kiss on the plaza, front left
    out.push(part(cyl(0.9, 1.0, 0.2, 32), '#c9ced6', { p: [-3.2, y0 + 0.1, 1.2] }), place(kiss('#cdd3da', 1.6), { p: [-3.2, y0 + 0.2, 1.2] }));
    out.push(trees(R, [[4.6, 4.6], [-0.4, 4.6], [4.6, 1.2], [3.6, -4.6]], 0.55));
    // ---- moving parts
    const moving = [], T = 1.2;
    // Kisses along the belt: brown under the depositor, silver after the wrapper.
    for (let k = 0; k < 8; k++) {
      const pos = (t) => cyc(t, T * 8, k / 8);
      moving.push({ geo: kiss(CHOC, 0.28), pivot: [0, y0 + 0.55, LZ], anim: (t) => { const u = pos(t), x = -3.4 + u * 6.8; return x > 0.6 ? { s: 0.001 } : { x, s: Math.min(1, u / 0.03) + 0.001 }; } });
      moving.push({ geo: kiss('#d4d9df', 0.3), pivot: [0, y0 + 0.55, LZ], anim: (t) => { const u = pos(t), x = -3.4 + u * 6.8; return x <= 0.6 ? { s: 0.001 } : { x, s: Math.min(1, (1 - u) / 0.04) + 0.001 }; } });
    }
    // The depositor's nozzle pumping.
    moving.push({ geo: part(cyl(0.06, 0.06, 0.4, 10), '#7b828c'), pivot: [-3.4, y0 + 0.75, LZ], anim: (t) => ({ y: -Math.max(0, Math.sin(t / T * TAU)) * 0.1 }) });
    // A tour tram rolling along the road.
    moving.push({ geo: merge(part(rbox(1.6, 0.6, 0.8, 0.08), '#a33a2a', { p: [0, 0.6, 0] }), part(box(1.4, 0.06, 0.82), K.white, { p: [0, 0.95, 0] }), part(rbox(1.6, 0.06, 0.9, 0.03), '#5b3a2a', { p: [0, 1.25, 0] }), [[-0.55, 0.42], [0.55, 0.42], [-0.55, -0.42], [0.55, -0.42]].map(([x, z]) => part(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), '#1d1f24', { p: [x, 0.18, z], r: [Math.PI / 2, 0, 0] }))), pivot: [0, y0, 3.4], anim: (t) => { const x = -5.6 + cyc(t, 12) * 11.2; return { x, s: clamp01((5.2 - Math.abs(x)) / 0.5) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Keurig Dr Pepper: the brewer already on the counter, and pods forever. The giant brewer takes
  // a pod from the carousel, the lid shuts and the mug fills; the pod van makes its round of the
  // homes that own one; and Keurig's own trucks keep the Dr Pepper cooler full.
  keurigdrpepper: { finder: '#8a1538', build: () => {
    const R = rand(227), out = [], MAROON = '#8a1538', KG = '#2b2f36';
    out.push(ground('#8fc66f'), part(cyl(2.4, 2.4, 0.05, 56), '#e9e2d4', { p: [-0.6, y0 + 0.025, -0.6] }));
    // ---- the giant brewer in the middle, on a stretch of counter
    const KX = -0.6, KZ = -0.8, Q = Math.PI / 4, Qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Q, 0)), L = (x, y, z) => { const v = new V(x, y, z).applyQuaternion(Qq); return [KX + v.x, y0 + y, KZ + v.z]; };
    const brewer = merge(part(rbox(3.6, 0.9, 1.8, 0.05), '#f4f5f6', { p: [0, 0.45, 0] }), part(rbox(3.7, 0.1, 1.9, 0.03), '#3a3f47', { p: [0, 0.95, 0] }),
      part(rbox(1.6, 2.6, 1.6, 0.2), KG, { p: [-0.4, 2.3, -0.1] }), part(rbox(1.3, 0.2, 1.1, 0.06), '#1d1f24', { p: [-0.4, 1.1, 0.35] }), part(rbox(0.9, 0.6, 0.04, 0.04), MAROON, { p: [-0.4, 2.2, 0.71] }), part(rbox(0.7, 0.18, 0.02, 0.04), '#4fc3f7', { p: [-0.4, 3.3, 0.72] }), part(rbox(1.1, 0.6, 0.9, 0.06), '#3a3f47', { p: [-0.4, 3.3, 0.25] }));
    out.push(place(brewer, { p: [KX, y0, KZ], r: [0, Q, 0] }));
    // The giant mug under the spout.
    out.push(part(lathe([[0, 0], [0.36, 0], [0.4, 0.75], [0.36, 0.75], [0.32, 0.05], [0, 0.05]], 28), K.white, { p: L(-0.4, 1.2, 0.35) }), part(torus(0.18, 0.05, Math.PI, 14), K.white, { p: L(0.0, 1.55, 0.35), r: [0, Q, -Math.PI / 2] }));
    // The pod carousel tower beside it.
    out.push(part(cyl(0.06, 0.06, 1.6, 8), '#9aa1a9', { p: L(1.1, 1.75, 0) }), part(cyl(0.5, 0.5, 0.05, 24), '#3a3f47', { p: L(1.1, 1.0, 0) }));
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + r * 0.5, p = L(1.1, 1.2 + r * 0.38, 0); out.push(part(cyl(0.13, 0.1, 0.18, 12), ['#6f4a2c', KG, MAROON, '#2f9e6e'][(k + r) % 4], { p: [p[0] + Math.cos(a) * 0.4, p[1], p[2] + Math.sin(a) * 0.4] })); }
    // ---- the homes that own a brewer, round the left and front, with their mailboxes
    const homes = [[-4.2, -2.4], [-4.2, 1.0], [-2.6, 3.7], [0.8, 3.8]];
    homes.forEach(([x, z], i) => out.push(place(home(['#fbf3e3', '#e8eef4', '#f6e7e1', '#eef3e6'][i], ['#8a5a36', '#5b6b7d', '#a35a3c', '#3f6f8f'][i], 1.3, 1.1, 0.9), { p: [x, y0, z], r: [0, x < -4 ? Math.PI / 2 : 0, 0] })));
    // ---- the store with its Dr Pepper cooler, right
    out.push(part(rbox(2.2, 1.6, 1.8, 0.05), '#f4efe6', { p: [3.6, y0 + 0.8, -3.0] }), part(box(2.22, 0.3, 1.82), MAROON, { p: [3.6, y0 + 1.45, -3.0] }), place(pixText('DR PEPPER', 0.04, K.white, 0.02), { p: [3.6, y0 + 1.45, -2.08] }));
    out.push(part(rbox(1.0, 1.8, 0.7, 0.05), MAROON, { p: [3.8, y0 + 0.9, -0.8] }), part(box(0.8, 1.5, 0.04), '#cfe6f2', { p: [3.8, y0 + 0.9, -0.44] }));
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) out.push(part(cyl(0.09, 0.09, 0.28, 10), ['#8a1538', '#2f9e6e', '#e5533d', '#f2c94c'][r], { p: [3.6 + k * 0.2, y0 + 0.4 + r * 0.38, -0.6] }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [2.6, 2.4], [-4.6, -4.6]], 0.5));
    // ---- moving parts
    const moving = [], P = 8;
    // A pod from the carousel up and into the brewer's head.
    moving.push(rider(part(cyl(0.13, 0.1, 0.18, 12), '#6f4a2c'), curve([L(1.1, 2.6, 0), L(0.6, 3.9, 0.2), L(-0.4, 3.9, 0.45), L(-0.4, 3.45, 0.45)]), P, 0, 0.02, 0.2));
    moving.push({ geo: part(rbox(1.1, 0.12, 0.9, 0.04), '#5b616b', { p: [0, 0, 0.45] }), pivot: L(-0.4, 3.64, -0.2), anim: (t) => { const f = cyc(t, P); return { ry: Q, rx: -1.0 * (1 - easeIO(win(f, 0.2, 0.28))) * (f < 0.9 ? 1 : 0) - 1.0 * easeIO(win(f, 0.9, 1)) }; } });
    moving.push({ geo: part(cyl(0.05, 0.05, 0.75, 8), '#5a3221', { p: [0, -0.37, 0] }), pivot: L(-0.4, 2.0, 0.35), anim: (t) => { const f = cyc(t, P); return f > 0.3 && f < 0.7 ? { sy: 1 + Math.sin(t * 30) * 0.03 } : { s: 0.001 }; } });
    moving.push({ geo: part(cyl(0.33, 0.33, 0.68, 20), '#5a3221', { p: [0, 0.34, 0] }), pivot: L(-0.4, 1.26, 0.35), anim: (t) => { const f = cyc(t, P); return { sy: f < 0.3 ? 0.001 : Math.min(1, win(f, 0.3, 0.7)) + 0.001 }; } });
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.15, 8, 6), '#f4f1ea'), pivot: L(-0.4 + (k - 1) * 0.12, 2.1, 0.35), anim: (t) => { const f = cyc(t, P), u = cyc(t, 1.6, k / 3); return f > 0.4 && f < 0.97 ? { y: u * 1.2, s: Math.sin(u * Math.PI) + 0.001 } : { s: 0.001 }; } });
    // The pod van on its round of the homes, a box of pods at each.
    const route = curve([[-2.8, y0, -3.6], [-2.9, y0, 0.0], [-2.4, y0, 2.6], [0.8, y0, 2.8], [2.4, y0, 2.0]]);
    moving.push({ geo: place(van(K.white, MAROON), { s: 0.75 }), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P * 1.5), a = along(route, easeIO(f)); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry, s: Math.min(1, f / 0.05, (1 - f) / 0.05) + 0.001 }; } });
    homes.forEach(([x, z], i) => moving.push(pulse(x + (x < -4 ? 0.9 : 0), y0 + 0.05, z + (x < -4 ? 0 : 0.9), MAROON, P * 1.5, 0.15 + i * 0.22, 0.4)));
    // The Dr Pepper truck pulling up to the store.
    moving.push({ geo: place(merge(part(rbox(0.8, 0.9, 0.9, 0.08), MAROON, { p: [0.9, 0.6, 0] }), part(box(0.04, 0.3, 0.75), '#26323f', { p: [1.31, 0.75, 0] }), part(rbox(1.8, 1.1, 0.95, 0.05), MAROON, { p: [-0.4, 0.75, 0] }), part(box(1.4, 0.4, 0.02), K.white, { p: [-0.4, 0.8, 0.48] }), [[-0.8, 0.45], [0.8, 0.45], [-0.8, -0.45], [0.8, -0.45]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] }))), { r: [0, Math.PI / 2, 0], s: 0.85 }), pivot: [4.5, y0, 0], anim: (t) => { const f = cyc(t, P * 1.5), z = 5.8 - easeOut(win(f, 0, 0.3)) * 4.6 + easeIn(win(f, 0.65, 0.95)) * 4.6; return { z, s: clamp01((5.4 - z) / 0.6) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Monster Beverage: a brand riders wear, carried by Coca-Cola's trucks. The rider sails off
  // the dirt ramp under the giant clawed can, and the red trucks of the bottler network fill the
  // store's cooler.
  monster: { finder: '#7ac143', build: () => {
    const R = rand(141), out = [], GREEN = '#7ac143', INK = '#111111';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.3), '#5b616b', { p: [0, y0 + 0.015, 3.5] }));
    // ---- the giant can, back left, with the three claw marks
    const CX = -3.0, CZ = -3.0, CH = 4.6;
    out.push(part(cyl(1.15, 1.15, CH, 48), INK, { p: [CX, y0 + CH / 2 + 0.1, CZ] }), part(cyl(1.0, 1.15, 0.2, 48), '#c9ced6', { p: [CX, y0 + CH + 0.2, CZ] }), part(cyl(1.15, 1.0, 0.15, 48), '#c9ced6', { p: [CX, y0 + 0.08, CZ] }), part(rbox(0.3, 0.06, 0.5, 0.03), '#9aa1a9', { p: [CX + 0.3, y0 + CH + 0.32, CZ] }));
    for (let k = 0; k < 3; k++) {
      const pts = [], a0 = Math.PI / 4 - 0.35 + k * 0.32;
      for (let j = 0; j <= 6; j++) { const y = 0.9 + j * 0.55, a = a0 + (j % 2 ? 0.08 : -0.08); pts.push([CX + Math.cos(a) * 1.16, y0 + y, CZ + Math.sin(a) * 1.16]); }
      out.push(part(tubeOn(curve(pts), 0.09, hi() ? 40 : 10), GREEN));
    }
    // ---- the dirt track and the ramps, middle
    out.push(part(rbox(7.0, 0.1, 2.6, 0.05), '#a9784f', { p: [0.6, y0 + 0.05, 0.4] }));
    out.push(part(extrude([[0, 0], [1.6, 0], [1.6, 1.0]], 1.6), '#8a5a36', { p: [-2.2, y0 + 0.1, 0.4] }), part(extrude([[0, 0], [1.6, 0], [0, 0.8]], 1.6), '#8a5a36', { p: [2.0, y0 + 0.1, 0.4] }));
    // ---- the store with its cooler, right
    out.push(part(rbox(2.4, 1.6, 1.8, 0.05), '#f4efe6', { p: [3.6, y0 + 0.8, -2.8] }), part(box(2.42, 0.3, 1.82), '#e21a2c', { p: [3.6, y0 + 1.5, -2.8] }), part(rbox(1.0, 1.3, 0.5, 0.04), INK, { p: [3.6, y0 + 0.65, -1.7] }), part(box(0.8, 1.1, 0.04), '#1f3a1f', { p: [3.6, y0 + 0.65, -1.44] }));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) out.push(part(cyl(0.07, 0.07, 0.26, 10), r === 1 ? '#5fa8d3' : INK, { p: [3.3 + k * 0.2, y0 + 0.3 + r * 0.35, -1.5] }), part(cyl(0.072, 0.072, 0.05, 10), GREEN, { p: [3.3 + k * 0.2, y0 + 0.33 + r * 0.35, -1.5] }));
    // Fans by the track.
    for (let k = 0; k < 6; k++) out.push(place(fan(['#7ac143', INK, '#e5533d', '#3d7be0'][k % 4]), { p: [-1.6 + k * 0.7, y0, 2.2], s: 1.2 }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, 1.4], [-4.6, 0.4], [0.6, -4.4]], 0.55));
    // ---- moving parts
    const moving = [], P = 5;
    // The rider: up the ramp, a flip in the air, down the landing.
    const bike = merge(part(rbox(0.8, 0.2, 0.15, 0.05), GREEN, { p: [0, 0.45, 0] }), part(new THREE.TorusGeometry(0.22, 0.06, 8, 16), INK, { p: [-0.42, 0.22, 0] }), part(new THREE.TorusGeometry(0.22, 0.06, 8, 16), INK, { p: [0.45, 0.22, 0] }), beam([0.45, 0.22, 0], [0.25, 0.65, 0], 0.05, '#9aa1a9'), part(capsule(0.13, 0.3), INK, { p: [-0.05, 0.8, 0], r: [0, 0, -0.4] }), part(ball(0.14), GREEN, { p: [0.12, 1.12, 0] }));
    moving.push({ geo: bike, pivot: [0, y0 + 0.1, 0.4], anim: (t) => { const f = cyc(t, P); let x, y, rz = 0;
      if (f < 0.25) { const u = win(f, 0, 0.25); x = -4.2 + u * 3.6; y = Math.max(0, (x + 2.2) / 1.6) * 1.0; rz = x > -2.2 ? 0.55 : 0; }
      else if (f < 0.65) { const u = win(f, 0.25, 0.65); x = -0.6 + u * 2.6; y = 1.0 + hop(u) * 1.8 - u * 0.2; rz = 0.4 - u * (TAU + 0.8); }
      else { const u = win(f, 0.65, 1); x = 2.0 + u * 2.4; y = Math.max(0, 0.8 - (x - 2.0) / 2.0); rz = x < 3.6 ? -0.45 : 0; }
      return { x, y, rz, s: Math.min(1, f / 0.04, (1 - f) / 0.04) + 0.001 }; } });
    // The red bottler truck at the store, crates going in.
    moving.push({ geo: place(merge(part(rbox(0.8, 0.9, 0.9, 0.08), '#e21a2c', { p: [0.9, 0.6, 0] }), part(box(0.04, 0.3, 0.75), '#26323f', { p: [1.31, 0.75, 0] }), part(rbox(1.8, 1.1, 0.95, 0.05), '#e21a2c', { p: [-0.4, 0.75, 0] }), part(box(1.2, 0.2, 0.02), K.white, { p: [-0.4, 0.8, 0.48] }), [[-0.8, 0.45], [0.8, 0.45], [-0.8, -0.45], [0.8, -0.45]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] }))), { s: 0.8 }), pivot: [0, y0, 3.5], anim: (t) => { const f = cyc(t, 12), x = f < 0.3 ? 5.8 - easeOut(win(f, 0, 0.3)) * 3.0 : f < 0.65 ? 2.8 : 2.8 - easeIn(win(f, 0.65, 1)) * 8.6; return { x, ry: Math.PI, s: clamp01((5.4 - Math.abs(x)) / 0.6) + 0.001 }; } });
    for (let k = 0; k < 3; k++) moving.push(rider(merge(part(rbox(0.4, 0.3, 0.3, 0.03), '#e21a2c'), part(box(0.3, 0.05, 0.2), INK, { p: [0, 0.16, 0] })), curve([[2.8, y0 + 0.9, 3.0], [3.4, y0 + 1.8, 0.6], [3.6, y0 + 1.0, -1.4]]), 12, -k * 0.04, 0.32, 0.5));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Chipotle: a fresh line that never stops. Customers queue past the long counter; the bowl
  // slides along it collecting rice, beans, chicken, salsa, guac and cheese from the staff; cases
  // of avocados come in the back, and orders go out of the Chipotlane window to the cars.
  chipotle: { finder: '#a81612', build: () => {
    const R = rand(226), out = [], RED = '#a81612', BROWN = '#451400';
    out.push(ground('#8fc66f'), part(rbox(8.0, 0.06, 6.4, 0.03), '#c9a57a', { p: [-0.9, y0 + 0.03, -1.0] }), part(box(1.3, 0.03, 10.2), '#5b616b', { p: [4.3, y0 + 0.015, 0] }));
    // ---- the back wall with the sign, and the kitchen behind the line
    out.push(part(rbox(8.0, 2.6, 0.2, 0.03), '#7a4a2e', { p: [-0.9, y0 + 1.3, -4.3] }), part(box(3.4, 0.6, 0.06), RED, { p: [-0.9, y0 + 2.0, -4.18] }), place(pixText('CHIPOTLE', 0.08, K.white, 0.03), { p: [-0.9, y0 + 2.0, -4.14] }), part(rbox(0.2, 2.6, 6.4, 0.03), '#6a3e26', { p: [-4.9, y0 + 1.3, -1.0] }));
    out.push(part(rbox(6.4, 0.9, 0.7, 0.04), '#b9bec6', { p: [-0.9, y0 + 0.45, -3.6] }), part(box(6.2, 0.04, 0.6), '#9aa1a9', { p: [-0.9, y0 + 0.92, -3.6] }), [-3.0, -1.4, 0.2].map((x) => part(rbox(0.9, 0.12, 0.6, 0.03), '#3a3f47', { p: [x, y0 + 0.98, -3.6] })));
    // ---- the line: a long counter with the wells and the sneeze guard
    const LZ = -1.6, wells = [['#f4f1ea', 'RICE'], ['#2b1d16', 'BEANS'], ['#c97b3a', 'CHICKEN'], ['#c0392b', 'SALSA'], ['#5fae45', 'GUAC'], ['#f2c94c', 'CHEESE']];
    out.push(part(rbox(7.0, 1.0, 1.2, 0.04), '#8a5a3a', { p: [-0.9, y0 + 0.5, LZ] }), part(rbox(7.0, 0.06, 1.3, 0.03), '#c9ced6', { p: [-0.9, y0 + 1.02, LZ] }), part(box(7.0, 0.5, 0.03), '#d6eef8', { p: [-0.9, y0 + 1.5, LZ + 0.2], r: [-0.3, 0, 0] }));
    wells.forEach(([c], i) => { const x = -3.8 + i * 1.05; out.push(part(box(0.9, 0.12, 0.6), '#9aa1a9', { p: [x, y0 + 1.0, LZ - 0.2] }), part(new THREE.SphereGeometry(0.42, 16, 10, 0, TAU, 0, Math.PI / 2), c, { p: [x, y0 + 1.04, LZ - 0.2], s: [1, 0.35, 0.65] })); });
    // Avocado crates and the delivery door, back left.
    for (let k = 0; k < 3; k++) { out.push(part(rbox(0.8, 0.4, 0.6, 0.03), '#a87a48', { p: [-4.2, y0 + 0.2 + k * 0.42, -2.6] })); if (hi()) for (let j = 0; j < 6; j++) out.push(part(new THREE.SphereGeometry(0.1, 10, 7), '#4a6b2a', { p: [-4.45 + (j % 3) * 0.25, y0 + 0.43 + k * 0.42, -2.75 + Math.floor(j / 3) * 0.3], s: [1, 1.3, 1] })); }
    // ---- the Chipotlane window, right, with the pickup shelf
    out.push(part(rbox(1.4, 2.0, 2.4, 0.04), '#7a4a2e', { p: [3.2, y0 + 1.0, -1.4] }), part(box(0.04, 0.7, 1.0), '#2a3c50', { p: [3.92, y0 + 1.1, -1.4] }), part(rbox(0.5, 0.06, 1.2, 0.02), RED, { p: [4.1, y0 + 1.6, -1.4] }), place(pixText('CHIPOTLANE', 0.03, K.white, 0.02), { p: [3.93, y0 + 1.75, -1.4], r: [0, Math.PI / 2, 0] }));
    out.push(trees(R, [[-4.6, 3.6], [-2.0, 4.4], [1.6, 4.4]], 0.55));
    // ---- moving parts
    const moving = [], P = 9;
    // The staff behind the line, scooping.
    wells.forEach(([c], i) => moving.push(...walker(moving.length, (t) => ({ x: -3.8 + i * 1.05, z: LZ - 0.95, ry: -Math.PI / 2, still: true, push: Math.abs(Math.sin(t * 2.5 + i * 0.9)) > 0.6 }), { shirt: BROWN, pants: '#2b2f36', y: y0 + 0.03 })));
    // The customers queueing along the front.
    for (let k = 0; k < 4; k++) moving.push(...walker(moving.length, (t) => { const u = cyc(t, P * 2, k / 4); return { x: -4.4 + u * 7.2, z: LZ + 1.2, ry: 0, s: Math.min(1, u / 0.05, (1 - u) / 0.05) }; }, { shirt: ['#3d7be0', '#d6336c', '#2f9e6e', '#f29a3a'][k], pants: '#2b3a55', y: y0 + 0.03 }));
    // The bowl: big, sliding down the line, each topping landing as it passes its well.
    const bowlX = (f) => -4.4 + easeIO(win(f, 0, 0.7)) * 6.9;
    const bi = moving.length;
    moving.push({ geo: part(lathe([[0, 0], [0.35, 0], [0.45, 0.26], [0.42, 0.26], [0.32, 0.04], [0, 0.04]], 24), '#e9e2d4'), pivot: [0, y0 + 1.06, LZ + 0.35], anim: (t) => { const f = cyc(t, P); return f > 0.74 ? { s: 0.001 } : { x: bowlX(f), s: 1.3 * Math.min(1, f / 0.03) + 0.001 }; } });
    wells.forEach(([c], i) => moving.push({ geo: part(new THREE.SphereGeometry(0.28, 14, 8, 0, TAU, 0, Math.PI / 2), c, { s: [1, 0.45, 1] }), pivot: [(i % 2 ? 0.08 : -0.08), 0.06 + i * 0.03, ((i % 3) - 1) * 0.08], parent: bi, anim: (t) => (bowlX(cyc(t, P)) > -3.8 + i * 1.05 - 0.1 ? { s: 1 - i * 0.1 } : { s: 0.001 }) }));
    // The bagged order from the end of the line to the Chipotlane window.
    moving.push(rider(merge(part(rbox(0.4, 0.5, 0.25, 0.04), '#8a5a3a'), part(box(0.3, 0.1, 0.26), RED, { p: [0, 0.1, 0] })), curve([[2.6, y0 + 1.3, LZ], [3.2, y0 + 2.2, -1.5], [4.1, y0 + 1.7, -1.4]]), P, 0, 0.74, 0.86));
    // Cars rolling up the lane: stop at the window, take the bag, drive on.
    [0, 0.33, 0.66].forEach((o, i) => moving.push({ geo: place(sedan(['#3d7be0', '#f4f5f6', '#e5533d'][i]), { r: [0, -Math.PI / 2, 0], s: 0.8 }), pivot: [4.3, y0, 0], anim: (t) => { const f = cyc(t, P * 3, o + 0.1), z = 5.6 - easeIO(win(f, 0, 0.3)) * 7.0 - easeIO(win(f, 0.4, 0.7)) * 4.4; return { z, s: clamp01((5.0 - Math.abs(z)) / 0.6) + 0.001 }; } }));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // DoorDash: the most dashers on the most streets. Orders ping from the homes, and red-bagged
  // dashers on scooters and in cars run from the restaurants to the doors, many at once.
  doordash: { finder: '#ff3008', build: () => {
    const R = rand(143), out = [], RED = '#ff3008';
    out.push(ground('#8fc66f'));
    // ---- the street grid
    [-1.6, 1.6].forEach((v) => out.push(part(box(10.2, 0.03, 0.9), '#5b616b', { p: [0, y0 + 0.015, v] }), part(box(0.9, 0.03, 10.2), '#5b616b', { p: [v, y0 + 0.016, 0] })));
    // ---- restaurants (left and back) and homes (front and right)
    const rest = [[-3.4, -3.4, '#e5533d', 'PIZZA'], [0, -3.6, '#2f9e6e', 'TACO'], [-3.4, 0, '#f2c94c', 'BURGER']];
    rest.forEach(([x, z, c, name]) => out.push(part(rbox(1.8, 1.2, 1.4, 0.05), '#f4efe6', { p: [x, y0 + 0.6, z] }), part(box(1.82, 0.3, 1.42), c, { p: [x, y0 + 1.1, z] }), place(pixText(name, 0.05, K.white, 0.02), { p: [x, y0 + 1.1, z + 0.72] }), part(box(1.0, 0.5, 0.03), '#9cc3e0', { p: [x, y0 + 0.45, z + 0.71] })));
    const homes = [[3.4, 0, 0], [3.4, 3.4, 0], [0, 3.4, 0], [-3.4, 3.4, 0], [3.4, -3.4, 0]];
    homes.forEach(([x, z], i) => out.push(place(home(['#fbf3e3', '#e8eef4', '#f6e7e1', '#eef3e6', '#f1e2c6'][i], ['#8a5a36', '#5b6b7d', '#a35a3c', '#3f6f8f', '#6f4a2c'][i], 1.5, 1.3, 1.0), { p: [x, y0, z] })));
    out.push(part(rbox(1.4, 0.08, 1.4, 0.03), '#c9ced6', { p: [0, y0 + 0.04, 0] }), part(rbox(0.5, 0.9, 0.08, 0.06), '#1d1f24', { p: [0, y0 + 0.6, 0], r: [0, Math.PI / 4, 0] }), part(rbox(0.42, 0.78, 0.02, 0.05), RED, { p: [0.04, y0 + 0.6, 0.04], r: [0, Math.PI / 4, 0] }));
    out.push(trees(R, [[-4.6, -1.8], [1.8, -4.6], [4.6, -1.8], [-1.8, 4.6], [4.6, 4.6]], 0.5));
    // ---- moving parts
    const moving = [], P = 8;
    const scooter = merge(part(rbox(0.7, 0.12, 0.2, 0.05), '#3a3f47', { p: [0, 0.2, 0] }), part(new THREE.TorusGeometry(0.15, 0.05, 8, 14), '#1d1f24', { p: [-0.3, 0.15, 0] }), part(new THREE.TorusGeometry(0.15, 0.05, 8, 14), '#1d1f24', { p: [0.3, 0.15, 0] }), part(capsule(0.12, 0.3), '#2b3a55', { p: [-0.05, 0.6, 0] }), part(ball(0.12), '#e9b98f', { p: [-0.02, 0.95, 0] }), part(ball(0.13), RED, { p: [-0.02, 1.0, 0], s: [1, 0.7, 1] }), part(rbox(0.35, 0.35, 0.35, 0.05), RED, { p: [-0.4, 0.55, 0] }));
    const car = merge(place(sedan('#f4f5f6'), { s: 0.55 }), part(rbox(0.2, 0.2, 0.3, 0.03), RED, { p: [0, 0.72, 0] }));
    // Each run: a restaurant's pickup point to a home's door, through the streets.
    const runs = [[0, 0], [1, 1], [2, 2], [0, 3], [1, 4], [2, 1]];
    runs.forEach(([ri, hi_], k) => {
      const [rx, rz] = rest[ri], [hx, hz] = homes[hi_], a = [rx, y0, rz + 1.0], b = [hx, y0, hz + 1.0];
      const route = curve([a, [rx, y0, Math.abs(rz + 1.6) < 1.5 ? -1.6 : 1.6], [ (rx + hx) / 2, y0, (Math.abs(rz + 1.6) < 1.5 ? -1.6 : 1.6)], [hx < 0 ? -1.6 : 1.6, y0, (rz + hz) / 2], [hx < 0 ? -1.6 : 1.6, y0, hz + 1.0], b]);
      moving.push({ geo: k % 3 === 2 ? car : scooter, pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P, k / runs.length), a2 = along(route, easeIO(win(f, 0.1, 0.8))); return { x: a2.p.x, y: a2.p.y, z: a2.p.z, ry: a2.ry, s: Math.min(1, f / 0.08, (1 - f) / 0.08) + 0.001 }; } });
      moving.push(pulse(hx, y0 + 0.05, hz + 1.0, RED, P, k / runs.length * -1 + 0.8, 0.5));
      moving.push({ geo: merge(part(rbox(0.36, 0.36, 0.06, 0.08), RED), part(new THREE.SphereGeometry(0.06, 8, 6), K.white, { p: [0, 0, 0.04] })), pivot: [hx, y0 + 2.3, hz], anim: (t) => { const f = cyc(t, P, k / runs.length); return f < 0.12 ? { ry: Math.PI / 4, s: back(win(f, 0, 0.06)) * Math.min(1, (0.12 - f) / 0.03) + 0.001, y: Math.sin(t * 6) * 0.05 } : { s: 0.001 }; } });
    });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Abbott: medicine you can wear. A runner laps the park with a FreeStyle Libre on her arm; the
  // sensor, shown big above her, reads her glucose every minute and sends it to the giant phone,
  // whose line draws itself as the day goes. The lab behind makes the tests the world relies on.
  abbott: { finder: '#009cde', build: () => {
    const R = rand(219), out = [], BLUE = '#009cde', NAVY = '#00205b';
    out.push(ground('#8fc66f'));
    // ---- the running track: a red oval round the park
    const ring2 = (a1, b1, a2, b2, c, y) => { const n = hi() ? 96 : 32, tri = []; for (let i = 0; i < n; i++) { const u = (i / n) * TAU, v = ((i + 1) / n) * TAU; const A0 = [Math.cos(u) * a1, y, Math.sin(u) * b1], A1 = [Math.cos(u) * a2, y, Math.sin(u) * b2], B0 = [Math.cos(v) * a1, y, Math.sin(v) * b1], B1 = [Math.cos(v) * a2, y, Math.sin(v) * b2]; tri.push(...A0, ...B0, ...A1, ...A1, ...B0, ...B1); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3)); g.computeVertexNormals(); return part(g, c); };
    out.push(place(ring2(3.6, 3.6, 4.5, 4.5, '#c8553d', 0), { p: [0, y0 + 0.012, 0] }), place(ring2(4.03, 4.03, 4.07, 4.07, '#f4f1ea', 0), { p: [0, y0 + 0.016, 0] }));
    // ---- the lab, back left inside the track
    out.push(place(block(2.2, 2.2, 1.6, K.white, '#7fb7d8', 0.35), { p: [1.7, y0, -2.0] }), part(box(2.24, 0.35, 1.64), NAVY, { p: [1.7, y0 + 2.05, -2.0] }), place(pixText('ABBOTT', 0.06, K.white, 0.03), { p: [1.7, y0 + 2.05, -1.17] }));
    for (let k = 0; k < 4; k++) out.push(place(tubeGeo(['#e5533d', BLUE, '#f2c94c', '#2f9e6e'][k]), { p: [0.9 + k * 0.4, y0, -0.9], s: 1.4 }));
    // ---- the giant phone, centre, on its plinth
    const Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), pp = (dx, dy, dz = 0.09) => { const v = new V(dx, dy, dz).applyQuaternion(Q); return [-0.6 + v.x, y0 + dy, 0.4 + v.z]; };
    out.push(part(cyl(0.7, 0.8, 0.3, 32), '#3a3f47', { p: [-0.6, y0 + 0.15, 0.4] }), part(rbox(1.9, 3.4, 0.16, 0.24), '#1d1f24', { p: pp(0, 2.0, 0), q: Q }), part(rbox(1.72, 3.16, 0.02, 0.16), K.white, { p: pp(0, 2.0), q: Q }));
    out.push(place(pixText('108', 0.09, NAVY, 0.03), { p: pp(0, 3.15, 0.1), q: Q }), part(box(1.5, 0.9, 0.02), '#e6f6ec', { p: pp(0, 2.0, 0.1), q: Q }), part(box(1.5, 0.3, 0.025), '#cdeed8', { p: pp(0, 2.0, 0.11), q: Q }), part(rbox(1.2, 0.5, 0.02, 0.1), '#e9f6fc', { p: pp(0, 1.0, 0.1), q: Q }));
    // Benches and planting.
    [[2.6, 0.0], [-2.4, 2.0]].forEach(([x, z]) => out.push(part(rbox(1.0, 0.08, 0.35, 0.03), K.wood, { p: [x, y0 + 0.4, z], r: [0, Math.PI / 4, 0] }), part(box(0.9, 0.4, 0.06), '#3a3f47', { p: [x, y0 + 0.2, z], r: [0, Math.PI / 4, 0] })));
    out.push(trees(R, [[-1.6, -2.6], [0.8, 2.4], [-2.8, -0.6], [2.8, 1.2], [-4.8, -4.8], [4.8, 4.8]], 0.55));
    // ---- moving parts
    const moving = [], P = 10;
    const runPos = (t) => { const u = cyc(t, P) * TAU; return { x: Math.cos(u) * 4.05, z: Math.sin(u) * 4.05, ry: -u - Math.PI / 2 }; };
    moving.push(...walker(moving.length, (t) => runPos(t), { shirt: '#d6336c', pants: '#1d1f24', y: y0, carry: part(cyl(0.08, 0.08, 0.04, 16), K.white, { p: [0, 1.15, 0.3], r: [Math.PI / 2, 0, 0] }) }));
    // The sensor shown big above her, pulsing.
    const sens = moving.length;
    moving.push({ geo: merge(part(cyl(0.45, 0.45, 0.14, 40), K.white, { r: [Math.PI / 2, 0, 0] }), part(cyl(0.34, 0.34, 0.15, 40), '#e9ecef', { r: [Math.PI / 2, 0, 0] }), part(cyl(0.08, 0.08, 0.16, 16), BLUE, { r: [Math.PI / 2, 0, 0] })), pivot: [0, y0 + 2.6, 0], anim: (t) => { const p = runPos(t); return { x: p.x * 0.97, z: p.z * 0.97, ry: Math.PI / 4, y: Math.sin(t * 3) * 0.06, s: 1.5 }; } });
    moving.push({ geo: part(torus(0.6, 0.03, TAU, 32), BLUE), pivot: [0, 0, 0], parent: sens, anim: (t) => { const u = cyc(t, 1); return { s: 0.8 + u * 0.8 }; } });
    // A reading every second, from the runner to the phone.
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.12, 10, 8), BLUE), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, 1, k / 3); const tr = t - u; const p = runPos(tr), a = new V(p.x, y0 + 2.6, p.z), b = new V(...pp(0, 2.0, 0.3)), m = a.clone().lerp(b, u); return { x: m.x, y: m.y + hop(u) * 1.0, z: m.z }; } });
    // The glucose line drawing across the screen.
    const N = 16, gl = (u) => 0.18 * Math.sin(u * 8) + 0.1 * Math.sin(u * 19 + 1);
    for (let k = 0; k < N; k++) { const u = k / (N - 1); moving.push({ geo: part(new THREE.SphereGeometry(0.06, 8, 6), gl(u) > 0.2 ? '#f29a3a' : '#2f9e6e'), pivot: pp(-0.65 + u * 1.3, 2.0 + gl(u), 0.13), anim: (t) => { const f = cyc(t, P); return f > u * 0.9 && f < 0.98 ? { s: 1 } : { s: 0.001 }; } }); }
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Marriott International: thirty brands, one membership. Travellers check in at the Ritz, the
  // Sheraton, the Courtyard and the rest; every stay sends points to the Bonvoy card in the
  // middle, which climbs from silver to gold to platinum.
  marriott: { finder: '#b5121b', build: () => {
    const R = rand(145), out = [], RED = '#b5121b', INK = '#1c1c1c';
    out.push(ground('#8fc66f'), part(cyl(2.0, 2.0, 0.05, 48), '#e8e3d8', { p: [0.2, y0 + 0.025, 0.4] }));
    // ---- the hotels round the edge, each its own brand
    const hotels = [[-3.4, -3.4, 4.6, '#1f3a5f', 'RITZ'], [-0.4, -3.8, 3.6, '#7a6a4f', 'JW'], [2.8, -3.4, 3.0, '#2b2f36', 'W'], [3.8, 0.4, 2.4, '#3f6f8f', 'SHERATON'], [-3.8, 0.6, 2.8, '#8a3a2a', 'WESTIN'], [3.2, 3.6, 1.6, '#2f7a6a', 'COURTYARD']];
    hotels.forEach(([x, z, h, c, name]) => { const w = name.length > 5 ? 1.7 : 1.5; out.push(place(block(w, h, w, '#eef0f2', shade(c, 1.3), 0.3), { p: [x, y0, z] }), part(box(w + 0.04, 0.4, w + 0.04), c, { p: [x, y0 + h - 0.2, z] }), place(pixText(name, 0.045, K.white, 0.02), { p: [x, y0 + h - 0.2, z + w / 2 + 0.03] }), part(rbox(w * 0.7, 0.08, 0.5, 0.03), c, { p: [x, y0 + 0.7, z + w / 2 + 0.25] })); });
    // ---- the card's plinth
    out.push(part(cyl(0.7, 0.8, 0.3, 32), INK, { p: [0.2, y0 + 0.15, 0.4] }), part(cyl(0.12, 0.12, 0.5, 12), '#c9ced6', { p: [0.2, y0 + 0.55, 0.4] }));
    out.push(trees(R, [[-1.6, 4.4], [1.0, 4.6], [-4.6, 3.6], [4.6, -1.6], [-1.8, -1.4]], 0.55));
    // ---- moving parts
    const moving = [], P = 12;
    // The Bonvoy card, its colour climbing the tiers through the cycle.
    const tiers = ['#c9ced6', '#d9a93a', '#9fa8b3', '#3a3f47'];
    tiers.forEach((c, i) => moving.push({ geo: merge(part(rbox(2.0, 1.25, 0.08, 0.12), c), part(box(2.0, 0.22, 0.09), INK, { p: [0, 0.3, 0] }), pixText('BONVOY', 0.06, K.white, 0.1).translate(0, -0.15, 0), part(rbox(0.3, 0.22, 0.1, 0.04), K.gold, { p: [-0.65, 0.0, 0] })), pivot: [0.2, y0 + 1.5, 0.4], anim: (t) => { const f = cyc(t, P), k = Math.min(3, Math.floor(f * 4)); return k === i ? { ry: Math.PI / 4 + Math.sin(t * 0.8) * 0.3, s: 1 + bump(f, (i + 0.0) / 4, 0.02) * 0.15 } : { s: 0.001 }; } }));
    // Travellers walking between hotels with their bags.
    const pathFor = (a, b) => (t, o) => { const f = cyc(t, 6, o), u = easeIO(win(f, 0.05, 0.85)); return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u + 1.2, ry: Math.atan2(-(b[1] - a[1]), b[0] - a[0]), s: Math.min(1, f / 0.05, (1 - f) / 0.05) }; };
    [[0, 3], [4, 5], [1, 4]].forEach(([a, b], i) => { const fn = pathFor(hotels[a], hotels[b]); moving.push(...walker(moving.length, (t) => fn(t, i / 3), { shirt: ['#3d7be0', '#d6336c', '#f29a3a'][i], pants: '#2b3a55', y: y0, carry: part(rbox(0.3, 0.4, 0.18, 0.04), INK, { p: [0, 0.3, 0.35] }) })); });
    // Points from each stay to the card.
    hotels.forEach(([x, z, h], i) => moving.push(rider(merge(part(cyl(0.16, 0.16, 0.05, 16), RED, { r: [Math.PI / 2, 0, 0] }), part(cyl(0.1, 0.1, 0.055, 12), K.white, { r: [Math.PI / 2, 0, 0] })), curve([[x, y0 + h * 0.6, z + 0.9], [(x + 0.2) / 2, y0 + 3.6, (z + 0.4) / 2], [0.2, y0 + 1.6, 0.4]]), P / 4, i / 6, 0, 0.8, (t) => ({ ry: t * 4 }))));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Southwest Airlines: point to point, one kind of plane, turned fast. Four cities in the
  // corners are linked directly, 737s flying straight between them instead of through a hub;
  // at the gate in the middle the bags (they fly free) come off and on, and the clock barely moves.
  southwest: { finder: '#304cb2', build: () => {
    const R = rand(225), out = [], BLUE = '#304cb2', RED = '#c8102e', YEL = '#ffbf27';
    out.push(ground('#8fc66f'));
    // ---- the four cities: little airports in the corners, each its own colour
    const cities = [[-3.9, -3.9, '#e5533d'], [3.9, -3.9, '#2f9e6e'], [3.9, 3.9, '#f2c94c'], [-3.9, 3.9, '#8a6cf0']];
    cities.forEach(([x, z, c]) => out.push(part(cyl(1.0, 1.1, 0.12, 32), '#9aa1a9', { p: [x, y0 + 0.06, z] }), part(cyl(0.18, 0.24, 1.4, 12), '#e9ecef', { p: [x - 0.4 * Math.sign(x), y0 + 0.8, z - 0.4 * Math.sign(z)] }), part(cyl(0.34, 0.3, 0.25, 12), '#3b5b7d', { p: [x - 0.4 * Math.sign(x), y0 + 1.6, z - 0.4 * Math.sign(z)] }), part(box(0.5, 0.3, 0.02), c, { p: [x + 0.3 * Math.sign(x), y0 + 1.2, z] }), part(cyl(0.02, 0.02, 1.2, 6), '#9aa1a9', { p: [x + 0.05 * Math.sign(x), y0 + 0.6, z] })));
    // ---- the gate in the middle: apron, terminal, the jet bridge
    out.push(part(rbox(5.2, 0.04, 4.4, 0.03), '#b9bec6', { p: [0, y0 + 0.02, 0] }), part(rbox(4.4, 1.2, 1.0, 0.05), '#d6d9dd', { p: [-0.4, y0 + 0.6, -1.9] }), part(box(4.4, 0.4, 0.02), '#5d7fa3', { p: [-0.4, y0 + 0.7, -1.39] }), part(box(4.5, 0.12, 1.1), BLUE, { p: [-0.4, y0 + 1.26, -1.9] }), place(pixText('SOUTHWEST', 0.06, K.white, 0.03), { p: [-0.8, y0 + 1.0, -1.37] }), part(heartGeo(0.3, 0.12), RED, { p: [1.2, y0 + 1.0, -1.32] }));
    out.push(part(rbox(0.4, 0.4, 1.2, 0.05), '#c9ced6', { p: [0.4, y0 + 1.0, -0.9] }), part(cyl(0.05, 0.05, 0.8, 8), '#7b828c', { p: [0.4, y0 + 0.4, -0.4] }));
    // The gate clock on its post.
    const CKX = -2.4, CKZ = 0.6;
    out.push(part(cyl(0.05, 0.06, 1.8, 10), '#3a3f47', { p: [CKX, y0 + 0.9, CKZ] }), part(cyl(0.55, 0.55, 0.1, 32), K.white, { p: [CKX, y0 + 2.3, CKZ], r: [Math.PI / 2, 0, Math.PI / 4] }), part(torus(0.55, 0.05, TAU, 32), BLUE, { p: [CKX, y0 + 2.3, CKZ], r: [0, Math.PI / 4, 0] }));
    for (let k = 0; k < 12; k++) { const a = k * TAU / 12, v = new V(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.06).applyAxisAngle(new V(0, 1, 0), Math.PI / 4); out.push(part(box(0.04, 0.08, 0.02), '#3a3f47', { p: [CKX + v.x, y0 + 2.3 + v.y, CKZ + v.z] })); }
    out.push(trees(R, [[0, -4.6], [0, 4.6], [-4.6, 0], [4.6, 0]], 0.5));
    // ---- moving parts
    const moving = [], P = 10;
    // The 737 at the gate, nose to the terminal, in the livery.
    out.push(place(jet(RED, BLUE), { p: [0.4, y0 + 0.04, 0.9], r: [0, Math.PI / 2, 0] }), part(box(0.5, 0.08, 2.4), YEL, { p: [0.4, y0 + 0.5, 1.1] }));
    // Bags off and on along the belt loader, each with its heart tag.
    moving.push({ geo: merge(part(box(1.8, 0.08, 0.4), '#3a3f47', { r: [0, 0, 0.3] }), part(rbox(0.6, 0.3, 0.6, 0.04), YEL, { p: [-0.6, -0.3, 0] })), pivot: [1.7, y0 + 0.5, 1.6], anim: () => ({}) });
    for (let k = 0; k < 5; k++) moving.push({ geo: merge(part(rbox(0.32, 0.24, 0.42, 0.04), ['#3d7be0', '#e5533d', '#2f9e6e', '#f2c94c', '#8a6cf0'][k]), part(heartGeo(0.06, 0.04), RED, { p: [0, 0.16, 0.22] })), pivot: [1.0, y0 + 0.4, 1.6], anim: (t) => { const u = cyc(t, 2, k / 5); return { x: u * 1.6, y: u * 0.5, s: Math.min(1, u / 0.1, (1 - u) / 0.1) + 0.001 }; } });
    moving.push({ geo: part(box(0.06, 0.45, 0.04), RED, { p: [0, 0.2, 0] }), pivot: [CKX + 0.05, y0 + 2.3, CKZ + 0.05], anim: (t) => ({ ry: Math.PI / 4, rz: -easeIO(cyc(t, P)) * TAU * 0.2 }) });
    // Point to point: 737s flying straight from city to city, all at once.
    const legs = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
    legs.forEach(([a, b], i) => { const A = cities[a], B = cities[b], path = curve([[A[0], y0 + 0.4, A[1]], [(A[0] * 2 + B[0]) / 3, y0 + 3.4, (A[1] * 2 + B[1]) / 3], [(A[0] + B[0] * 2) / 3, y0 + 3.4, (A[1] + B[1] * 2) / 3], [B[0], y0 + 0.4, B[1]]]);
      out.push(part(tubeOn(path, 0.015, hi() ? 40 : 10), '#c9d6f2'));
      moving.push(rider(place(jet(RED, BLUE, false), { s: 0.38 }), path, 6, i / legs.length, 0, 0.9)); });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Las Vegas Sands: the integrated resort, Marina Bay Sands. Three towers carry the SkyPark
  // with its infinity pool; boats cross the bay below and the lotus museum opens on the shore.
  lasvegassands: { finder: '#0b2d5b', build: () => {
    const R = rand(147), out = [], NAVY = '#0b2d5b';
    out.push(ground('#8fc66f'), part(box(10.2, 0.05, 4.2), 'W', { p: [0, y0 + 0.02, 3.0] }), part(box(10.2, 0.2, 0.2), '#c9c4b8', { p: [0, y0 + 0.1, 0.85] }));
    // ---- the three towers, back, each leaning out at the base
    const tx = [-2.6, -0.6, 1.4], TZ = -2.8, TH = 5.2;
    tx.forEach((x) => {
      out.push(part(extrude([[-0.9, 0], [0.4, 0], [0.4, TH], [-0.3, TH], [-0.55, TH * 0.4]], 1.4), '#dfe6ec', { p: [x, y0, TZ], r: [0, Math.PI / 2, 0] }));
      for (let y = 0.3; y < TH - 0.1; y += 0.28) out.push(part(new THREE.BoxGeometry(1.42, 0.1, 0.02), '#7f9fbf', { p: [x, y0 + y, TZ + 0.42] }));
    });
    // The SkyPark: the ship along the tops with its cantilevered prow, the pool on top.
    out.push(part(rbox(6.8, 0.35, 1.2, 0.1), '#e9ecef', { p: [-0.4, y0 + TH + 0.17, TZ] }), part(extrude([[0, 0], [1.4, 0.1], [1.4, 0.35], [0, 0.35]], 1.2), '#e9ecef', { p: [2.95, y0 + TH, TZ] }));
    out.push(part(box(4.6, 0.06, 0.6), 'W', { p: [-0.6, y0 + TH + 0.37, TZ + 0.2] }), place(pixText('MARINA BAY SANDS', 0.04, NAVY, 0.02), { p: [-0.4, y0 + TH + 0.17, TZ + 0.62] }));
    for (let k = 0; k < 8; k++) out.push(part(new THREE.SphereGeometry(0.12, 10, 7), '#4f8f3f', { p: [-3.2 + k * 0.75, y0 + TH + 0.48, TZ - 0.35] }));
    // The podium mall in front of the towers.
    out.push(part(rbox(6.4, 0.9, 1.2, 0.1), '#c9d4dc', { p: [-0.6, y0 + 0.45, -1.2] }), part(box(6.2, 0.4, 0.02), '#5d7fa3', { p: [-0.6, y0 + 0.5, -0.59] }));
    // ---- the lotus museum on the shore, right
    const LX = 3.6, LZ = -0.4;
    out.push(part(cyl(0.6, 0.7, 0.4, 24), '#e9ecef', { p: [LX, y0 + 0.2, LZ] }));
    for (let k = 0; k < 9; k++) { const a = k * TAU / 9; out.push(part(cone(0.32, 1.6, 12), K.white, { p: [LX + Math.cos(a) * 0.45, y0 + 1.0, LZ + Math.sin(a) * 0.45], r: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5] })); }
    out.push(trees(R, [[-4.6, -0.2], [4.6, -2.6], [4.6, -4.6], [-4.6, -4.6]], 0.55));
    // ---- moving parts
    const moving = [];
    // Swimmers on the edge of the infinity pool.
    for (let k = 0; k < 4; k++) moving.push({ geo: part(new THREE.SphereGeometry(0.07, 8, 6), '#e9b98f'), pivot: [-2.4 + k * 1.1, y0 + TH + 0.42, TZ + 0.25], anim: (t) => ({ x: Math.sin(t * 0.6 + k) * 0.4, y: Math.abs(Math.sin(t * 2 + k)) * 0.02 }) });
    // Boats on the bay.
    const boat = merge(part(rbox(1.0, 0.25, 0.45, 0.1), K.white, { p: [0, 0.12, 0] }), part(rbox(0.4, 0.25, 0.35, 0.05), '#3d7be0', { p: [-0.1, 0.35, 0] }));
    [[2.2, 9], [3.8, 13]].forEach(([z, P], i) => moving.push({ geo: boat, pivot: [0, y0 + 0.04, z], anim: (t) => { const x = (i ? 5.6 : -5.6) + (i ? -1 : 1) * cyc(t, P) * 11.2; return { x, ry: i ? Math.PI : 0, rz: Math.sin(t * 2) * 0.04, s: clamp01((5.0 - Math.abs(x)) / 0.5) + 0.001 }; } }));
    // Visitors along the promenade.
    [0, 0.33, 0.66].forEach((o, i) => moving.push(...walker(moving.length, (t) => { const u = cyc(t, 14, o); return { x: -4.6 + u * 9.2, z: 0.4, ry: 0, s: Math.min(1, u / 0.05, (1 - u) / 0.05) * 0.8 }; }, { shirt: ['#e5533d', '#2f9e6e', '#f2c94c'][i], pants: '#2b3a55', y: y0 })));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // MGM Resorts International: the Strip's biggest landlord. The golden lion guards the green
  // tower, the slot machine's reels spin and pay out, and the BetMGM phone keeps the game going
  // after guests fly home.
  mgm: { finder: '#b8860b', build: () => {
    const R = rand(148), out = [], GOLD = '#c9a227', EMER = '#2f8f5f';
    out.push(ground('#4a4f57'), part(box(10.2, 0.02, 1.4), '#3a3f47', { p: [0, y0 + 0.01, 1.2] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.6, 0.01, 0.06), '#f2c94c', { p: [-4.6 + i * 1.3, y0 + 0.025, 1.2] }));
    // ---- the green tower, back left: three wings with gold trim
    const GX = -2.8, GZ = -3.0;
    [0, 1, 2].forEach((k) => { const a = k * TAU / 3 + Math.PI / 4; out.push(part(rbox(0.9, 4.8 - k * 0.5, 1.8, 0.04), EMER, { p: [GX + Math.cos(a) * 0.7, y0 + (4.8 - k * 0.5) / 2, GZ + Math.sin(a) * 0.7], r: [0, -a, 0] })); });
    for (let y = 0.4; y < 4.6; y += 0.3) out.push(part(cyl(0.95, 0.95, 0.04, 6), GOLD, { p: [GX, y0 + y, GZ] }));
    out.push(place(pixText('MGM GRAND', 0.06, GOLD, 0.03), { p: [GX + 0.7, y0 + 4.4, GZ + 1.3], r: [0, Math.PI / 4, 0] }));
    // ---- the golden lion on its plinth, middle
    const LX = 0.4, LZ = -1.6;
    out.push(part(rbox(1.8, 0.8, 1.2, 0.06), '#d8d0bd', { p: [LX, y0 + 0.4, LZ] }));
    const lion = merge(part(capsule(0.35, 1.0), GOLD, { r: [0, 0, Math.PI / 2], p: [0, 0.4, 0] }), part(ball(0.42), '#b8860b', { p: [0.65, 0.75, 0] }), part(ball(0.28), GOLD, { p: [0.85, 0.75, 0] }), [[-0.45, 0.2], [0.45, 0.2], [-0.45, -0.2], [0.45, -0.2]].map(([x, z]) => part(capsule(0.1, 0.4), GOLD, { p: [x, 0.05, z] })), part(capsule(0.05, 0.6), GOLD, { p: [-0.75, 0.6, 0], r: [0, 0, 0.8] }));
    out.push(place(lion, { p: [LX, y0 + 1.05, LZ], r: [0, Math.PI / 4, 0], s: 1.2 }));
    // ---- the slot machine, front right
    const SX = 3.0, SZ = 3.3, SQ = Math.PI / 4;
    out.push(part(rbox(1.8, 2.6, 1.0, 0.12), '#8a1538', { p: [SX, y0 + 1.3, SZ], r: [0, SQ, 0] }), part(rbox(1.5, 0.7, 0.1, 0.05), '#1d1f24', { p: [SX + 0.36, y0 + 1.6, SZ + 0.36], r: [0, SQ, 0] }), part(rbox(1.6, 0.4, 0.1, 0.05), GOLD, { p: [SX + 0.36, y0 + 2.35, SZ + 0.36], r: [0, SQ, 0] }), place(pixText('777', 0.06, '#8a1538', 0.03), { p: [SX + 0.42, y0 + 2.35, SZ + 0.42], r: [0, SQ, 0] }), part(rbox(1.4, 0.2, 0.4, 0.04), '#3a3f47', { p: [SX + 0.4, y0 + 0.9, SZ + 0.4], r: [0, SQ, 0] }));
    // ---- the phone, front left
    out.push(part(rbox(1.0, 1.9, 0.1, 0.14), '#1d1f24', { p: [-3.4, y0 + 1.1, 2.8], r: [0, SQ, 0] }), part(rbox(0.88, 1.7, 0.02, 0.1), '#0f5132', { p: [-3.36, y0 + 1.1, 2.84], r: [0, SQ, 0] }), place(pixText('BETMGM', 0.035, GOLD, 0.03), { p: [-3.33, y0 + 1.6, 2.87], r: [0, SQ, 0] }), part(rbox(0.5, 0.1, 0.3, 0.03), '#c9ced6', { p: [-3.4, y0 + 0.05, 2.8] }));
    out.push(trees(R, [[4.6, -4.6], [1.6, -4.6], [4.6, -1.0], [-0.4, 4.6]], 0.5));
    // ---- moving parts
    const moving = [], P = 6;
    const sym = ['#e5533d', GOLD, '#2f9e6e', '#3d7be0'];
    const fv = (dx, dy, dz) => { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, SQ, 0)), v = new V(dx, dy, dz).applyQuaternion(q); return [SX + v.x, y0 + v.y, SZ + v.z]; };
    for (let k = 0; k < 3; k++) moving.push({ geo: part(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 16, 1), (x, y, z) => sym[Math.floor((Math.atan2(y, z) + Math.PI) / TAU * 8) % 4], { r: [0, 0, Math.PI / 2] }), pivot: fv(-0.45 + k * 0.45, 1.6, 0.48), anim: (t) => { const f = cyc(t, P), stop = 0.4 + k * 0.1; return { ry: SQ, rx: f < stop ? t * 18 : Math.PI / 2 }; } });
    moving.push({ geo: merge(part(cyl(0.04, 0.04, 0.9, 8), '#c9ced6', { p: [0, 0.45, 0] }), part(ball(0.12), '#e5533d', { p: [0, 0.9, 0] })), pivot: fv(0.95, 1.4, 0), anim: (t) => ({ ry: SQ, rx: 0.9 * bump(cyc(t, P), 0.05, 0.04) }) });
    for (let k = 0; k < 8; k++) moving.push({ geo: place(coin(0.14, 0.05), { r: [Math.PI / 2, 0, 0] }), pivot: fv(0, 0.95, 0.5), anim: (t) => { const f = cyc(t, P); if (f < 0.72 || f > 0.98) return { s: 0.001 }; const u = win(f, 0.72 + k * 0.02, 0.9 + k * 0.01); return { x: Math.cos(k) * u * 0.8 + u * 0.6, z: Math.sin(k) * u * 0.8 + u * 0.6, y: hop(u) * 0.7 - u * 0.7, rx: u * 9, s: u > 0 ? 1 : 0.001 }; } });
    // A guest walking to the slot, and cars along the Strip.
    moving.push({ geo: place(sedan('#f4f5f6'), { s: 0.75 }), pivot: [0, y0, 1.0], anim: (t) => { const x = -5.6 + cyc(t, 8) * 11.2; return { x, s: clamp01((5.0 - Math.abs(x)) / 0.5) + 0.001 }; } });
    moving.push({ geo: place(sedan('#e5533d'), { s: 0.75 }), pivot: [0, y0, 1.5], anim: (t) => { const x = 5.6 - cyc(t, 10, 0.5) * 11.2; return { x, ry: Math.PI, s: clamp01((5.0 - Math.abs(x)) / 0.5) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Caesars Entertainment: one rewards card across a whole Strip of casinos. The fountains play
  // in front of Caesars Palace, and points from Harrah's, the Flamingo and Horseshoe all land on
  // the same Caesars Rewards card.
  caesars: { finder: '#a6894b', build: () => {
    const R = rand(149), out = [], GOLD = '#a6894b', MARBLE = '#efe9dc';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.2), '#5b616b', { p: [0, y0 + 0.015, 3.9] }));
    // ---- Caesars Palace, back left: a curved tower with gold trim and a colonnade
    const CX = -2.4, CZ = -3.2;
    out.push(part(new THREE.CylinderGeometry(2.6, 2.6, 4.6, hi() ? 40 : 14, 1, false, Math.PI * 0.1, Math.PI * 0.55), MARBLE, { p: [CX - 1.4, y0 + 2.3, CZ - 0.2] }));
    for (let y = 0.6; y < 4.5; y += 0.38) out.push(part(new THREE.CylinderGeometry(2.62, 2.62, 0.08, hi() ? 40 : 14, 1, true, Math.PI * 0.1, Math.PI * 0.55), '#7a9cb8', { p: [CX - 1.4, y0 + y, CZ - 0.2] }));
    out.push(part(new THREE.CylinderGeometry(2.64, 2.64, 0.3, hi() ? 40 : 14, 1, true, Math.PI * 0.1, Math.PI * 0.55), GOLD, { p: [CX - 1.4, y0 + 4.5, CZ - 0.2] }));
    for (let k = 0; k < 8; k++) out.push(part(cyl(0.12, 0.14, 1.4, 16), K.white, { p: [-4.4 + k * 0.6, y0 + 0.7, -0.9] }));
    out.push(part(rbox(5.0, 0.3, 0.6, 0.04), MARBLE, { p: [-2.3, y0 + 1.55, -0.9] }), place(pixText("CAESARS", 0.08, GOLD, 0.03), { p: [-2.3, y0 + 1.55, -0.58] }));
    // ---- the fountain pool in front, with a statue
    const FX = -1.6, FZ = 1.4;
    out.push(part(cyl(1.8, 1.9, 0.3, 40), MARBLE, { p: [FX, y0 + 0.15, FZ] }), part(cyl(1.65, 1.65, 0.05, 40), 'W', { p: [FX, y0 + 0.29, FZ] }), part(cyl(0.3, 0.4, 0.8, 16), MARBLE, { p: [FX, y0 + 0.6, FZ] }), part(capsule(0.18, 0.5), K.white, { p: [FX, y0 + 1.35, FZ] }), part(ball(0.13), K.white, { p: [FX, y0 + 1.8, FZ] }));
    // ---- the sister casinos, right: Harrah's, the Flamingo (pink), Horseshoe
    const sis = [[3.4, -3.4, '#8a1538', "HARRAH'S"], [3.8, -0.4, '#f39ab8', 'FLAMINGO'], [3.0, 2.4, '#1d3557', 'HORSESHOE']];
    sis.forEach(([x, z, c, n]) => out.push(place(block(1.8, 2.0, 1.4, '#f4efe6', shade(c, 1.2), 0.32), { p: [x, y0, z] }), part(box(1.84, 0.35, 1.44), c, { p: [x, y0 + 1.85, z] }), place(pixText(n, 0.04, K.white, 0.02), { p: [x, y0 + 1.85, z + 0.73] })));
    out.push(trees(R, [[0.6, -4.6], [-4.6, 2.6], [0.8, 2.4], [-4.4, 4.4]], 0.55));
    // ---- moving parts
    const moving = [], P = 8;
    // The fountain jets.
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; moving.push({ geo: part(cyl(0.05, 0.1, 1.0, 8), '#d6f0fb', { p: [0, 0.5, 0] }), pivot: [FX + Math.cos(a) * 1.2, y0 + 0.3, FZ + Math.sin(a) * 1.2], anim: (t) => ({ sy: 0.6 + Math.max(0, Math.sin(t * 2 + k * 0.8)) * 1.2, rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3 }) }); }
    // The rewards card, turning on its stand by the road.
    const card = merge(part(rbox(1.5, 0.95, 0.06, 0.1), '#1d1f24'), part(box(1.5, 0.15, 0.07), GOLD, { p: [0, 0.2, 0] }), pixText('REWARDS', 0.045, GOLD, 0.08).translate(0, -0.15, 0), part(rbox(0.25, 0.18, 0.08, 0.03), K.gold, { p: [-0.5, 0.0, 0] }));
    out.push(part(cyl(0.06, 0.06, 1.4, 8), '#9aa1a9', { p: [0.8, y0 + 0.7, 0.2] }));
    moving.push({ geo: card, pivot: [0.8, y0 + 1.9, 0.2], anim: (t) => ({ ry: Math.PI / 4 + Math.sin(t * 0.9) * 0.5 }) });
    // Points from every casino onto the one card.
    [...sis.map(([x, z]) => [x, z]), [CX, CZ + 1.4]].forEach(([x, z], i) => moving.push(rider(merge(part(cyl(0.15, 0.15, 0.05, 16), GOLD, { r: [Math.PI / 2, 0, 0] }), part(cyl(0.09, 0.09, 0.055, 12), K.white, { r: [Math.PI / 2, 0, 0] })), curve([[x, y0 + 2.2, z + 0.8], [(x + 0.8) / 2, y0 + 3.4, (z + 0.2) / 2], [0.8, y0 + 2.0, 0.2]]), P / 2, i / 4, 0, 0.8, (t) => ({ ry: t * 4 }))));
    // Cars along the Strip.
    moving.push({ geo: place(sedan('#f4f5f6'), { s: 0.7 }), pivot: [0, y0, 3.7], anim: (t) => { const x = -5.6 + cyc(t, 9) * 11.2; return { x, s: clamp01((5.0 - Math.abs(x)) / 0.5) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Carvana: buy a car on your phone and pick it up from a vending machine. The coin goes in,
  // the glass tower's lift brings a car down from its bay and rolls it out to its new owner.
  carvana: { finder: '#00aed9', build: () => {
    const R = rand(150), out = [], TEAL = '#00aed9', NAVY = '#183558';
    out.push(ground('#8fc66f'), part(cyl(2.4, 2.4, 0.05, 48), '#d8dde3', { p: [-1.6, y0 + 0.025, -1.6] }), part(box(1.4, 0.03, 6.0), '#5b616b', { p: [0.8, y0 + 0.015, 2.2] }));
    // ---- the vending tower: an octagonal glass shaft with bays of cars
    const VX = -1.6, VZ = -1.6, VR = 1.6, LV = 6, LH = 0.85;
    out.push(part(cyl(VR + 0.2, VR + 0.25, 0.3, 8), NAVY, { p: [VX, y0 + 0.15, VZ] }));
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + TAU / 16; out.push(part(box(0.1, LV * LH + 0.4, 0.1), K.white, { p: [VX + Math.cos(a) * VR, y0 + 0.3 + (LV * LH + 0.4) / 2, VZ + Math.sin(a) * VR] })); }
    for (let l = 0; l <= LV; l++) out.push(part(torus(VR, 0.05, TAU, 8), l === LV ? TEAL : K.white, { p: [VX, y0 + 0.4 + l * LH, VZ], r: [Math.PI / 2, 0, TAU / 16] }));
    out.push(part(cone(VR + 0.15, 0.5, 8), NAVY, { p: [VX, y0 + 0.65 + LV * LH, VZ], r: [0, TAU / 16, 0] }), place(pixText('CARVANA', 0.06, NAVY, 0.03), { p: [VX + 1.1, y0 + LV * LH - 0.2, VZ + 1.1], r: [0, Math.PI / 4, 0] }));
    // Cars parked in the bays, facing out.
    const cols = ['#e5533d', '#3d7be0', '#f2c94c', '#2f9e6e', K.white, '#1d1f24', '#8a6cf0', '#f29a3a'];
    for (let l = 1; l < LV; l++) for (let k = 0; k < 4; k++) { if (l === 3 && k === 1) continue; const a = -Math.PI / 4 + (k - 1.5) * 0.9 + Math.PI; out.push(place(sedan(cols[(l * 3 + k) % 8]), { p: [VX + Math.cos(a) * 0.7, y0 + 0.45 + l * LH, VZ + Math.sin(a) * 0.7], r: [0, -a, 0], s: 0.45 })); }
    // ---- the coin and the customer's spot
    out.push(part(rbox(0.6, 1.0, 0.4, 0.05), NAVY, { p: [1.6, y0 + 0.5, -0.4], r: [0, Math.PI / 4, 0] }), part(cyl(0.12, 0.12, 0.04, 16), K.gold, { p: [1.62, y0 + 0.8, -0.2], r: [Math.PI / 2, 0, Math.PI / 4] }));
    out.push(trees(R, [[4.6, -4.6], [4.6, -1.6], [-4.6, 4.6], [-2.0, 4.4], [3.6, 4.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 10;
    // The customer drops the giant coin in.
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, P); return { x: 2.1, z: 0.2, ry: Math.PI * 0.75, still: true, push: f < 0.12 }; }, { shirt: '#d6336c', pants: '#2b3a55', y: y0 }));
    moving.push(rider(place(coin(0.25, 0.08), { r: [Math.PI / 2, 0, 0] }), curve([[2.0, y0 + 1.6, 0.0], [1.8, y0 + 1.4, -0.2], [1.62, y0 + 0.85, -0.25]]), P, 0, 0, 0.12, (t) => ({ ry: Math.PI / 4 })));
    // The lift: from the ground up to level 3, takes the car, comes down, car rolls out to the road.
    const liftY = (f) => (f < 0.12 ? 0 : f < 0.3 ? easeIO(win(f, 0.12, 0.3)) : f < 0.38 ? 1 : f < 0.58 ? 1 - easeIO(win(f, 0.38, 0.58)) : 0) * 3 * LH;
    moving.push({ geo: merge(part(cyl(0.9, 0.9, 0.08, 24), TEAL), part(box(1.8, 0.02, 0.1), K.white, { p: [0, 0.05, 0] })), pivot: [VX, y0 + 0.4, VZ], anim: (t) => ({ y: liftY(cyc(t, P)) }) });
    const a0 = -Math.PI / 4 + (1 - 1.5) * 0.9 + Math.PI;
    moving.push({ geo: place(sedan(TEAL), { s: 0.45 }), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P); if (f < 0.3) return { x: VX + Math.cos(a0) * 0.7, y: y0 + 0.45 + 3 * LH, z: VZ + Math.sin(a0) * 0.7, ry: -a0 }; if (f < 0.38) { const u = easeIO(win(f, 0.3, 0.38)); return { x: VX + Math.cos(a0) * 0.7 * (1 - u), y: y0 + 0.45 + 3 * LH, z: VZ + Math.sin(a0) * 0.7 * (1 - u), ry: -a0 }; } if (f < 0.58) return { x: VX, y: y0 + 0.45 + liftY(f), z: VZ, ry: -a0 }; const u = easeIO(win(f, 0.6, 0.85)), path = curve([[VX, 0, VZ], [VX + 1.6, 0, VZ + 1.6], [0.8, 0, 1.6], [0.8, 0, 3.6]]), a = along(path, u); return { x: a.p.x, y: y0 + 0.45 * (1 - Math.min(1, u * 8)) + 0.02, z: a.p.z, ry: a.ry, s: f > 0.95 ? 1 - win(f, 0.95, 1) + 0.001 : 1 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // CarMax: used cars, done like a factory. A car comes in and gets an instant offer, goes
  // through the reconditioning centre (lift, wash, inspection, every box ticked), gets one fixed
  // price, and either joins the lot or rides the car hauler to a store across the country.
  carmax: { finder: '#053361', build: () => {
    const R = rand(222), out = [], NAVY = '#053361', YEL = '#ffd520';
    out.push(ground('#8fc66f'), part(rbox(9.8, 0.04, 9.8, 0.05), '#6a7079', { p: [0, y0 + 0.02, 0] }));
    // ---- the appraisal booth, front right
    const AX = 3.4, AZ = 2.6;
    out.push(part(rbox(1.4, 1.3, 1.2, 0.05), K.white, { p: [AX + 0.6, y0 + 0.65, AZ + 1.4] }), part(box(1.42, 0.3, 1.22), YEL, { p: [AX + 0.6, y0 + 1.25, AZ + 1.4] }), place(pixText('OFFER', 0.045, NAVY, 0.03), { p: [AX + 0.6, y0 + 1.25, AZ + 0.78] }));
    out.push(part(rbox(2.4, 0.04, 2.0, 0.03), '#9aa1a9', { p: [AX, y0 + 0.05, AZ] }));
    // ---- the reconditioning centre, back right: an open-sided shed with a lift, wash and inspection
    const CX = 2.0, CZ = -2.6;
    out.push(part(rbox(5.6, 0.2, 2.6, 0.04), '#d8dde3', { p: [CX, y0 + 2.4, CZ] }), [[-2.7, -1.2], [2.7, -1.2], [-2.7, 1.2], [2.7, 1.2], [0, -1.2], [0, 1.2]].map(([x, z]) => part(box(0.16, 2.3, 0.16), '#9aa1a9', { p: [CX + x, y0 + 1.15, CZ + z] })), part(box(5.6, 0.4, 0.04), NAVY, { p: [CX, y0 + 2.2, CZ + 1.3] }), place(pixText('RECONDITIONING', 0.04, K.white, 0.02), { p: [CX, y0 + 2.2, CZ + 1.33] }));
    [-0.6, 0.6].forEach((dz) => out.push(part(box(0.14, 1.6, 0.14), '#c0392b', { p: [CX - 2.2, y0 + 0.8, CZ + dz] })));
    out.push(part(rbox(0.4, 1.4, 0.06, 0.03), K.white, { p: [CX + 2.2, y0 + 1.0, CZ - 1.1] }));
    // ---- the lot on the left: rows with yellow price stickers
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { const x = -4.0 + k * 1.3, z = -2.6 + r * 2.4; out.push(place(sedan(['#e5533d', '#3d7be0', '#f4f5f6', '#1d1f24', '#2f9e6e', '#9aa1a9'][r * 3 + k]), { p: [x, y0 + 0.04, z], r: [0, Math.PI / 2, 0], s: 0.85 }), part(box(0.45, 0.3, 0.02), YEL, { p: [x, y0 + 0.78, z + 1.0] })); }
    // The store, back left corner, with its sign.
    out.push(part(rbox(2.4, 1.5, 1.0, 0.05), '#eef0f2', { p: [-3.6, y0 + 0.75, -4.4] }), part(box(2.42, 0.4, 1.02), NAVY, { p: [-3.6, y0 + 1.3, -4.4] }), place(pixText('CARMAX', 0.06, YEL, 0.03), { p: [-3.6, y0 + 1.3, -3.88] }));
    // The road out along the front for the hauler.
    out.push(part(box(10.2, 0.03, 1.1), '#4a4f57', { p: [0, y0 + 0.04, 4.6] }));
    // ---- moving parts
    const moving = [], P = 14;
    // The car's journey: in, offer, lift, wash, inspection, priced, onto the lot.
    const path = curve([[5.6, 0, 1.4], [AX, 0, AZ - 0.2], [AX - 0.6, 0, 0.6], [CX - 2.2, 0, CZ + 1.6], [CX - 2.2, 0, CZ], [CX, 0, CZ], [CX + 2.0, 0, CZ], [CX + 2.0, 0, CZ + 1.8], [-0.4, 0, 0.6], [-1.4, 0, -0.2]]);
    const pos = (f) => { const keys = [[0, 0], [0.08, 0.12], [0.18, 0.12], [0.26, 0.4], [0.36, 0.4], [0.44, 0.53], [0.52, 0.53], [0.6, 0.66], [0.68, 0.66], [0.85, 1.0], [1, 1]]; for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const [f0, u0] = keys[i - 1], [f1, u1] = keys[i]; return u0 + (u1 - u0) * easeIO((f - f0) / (f1 - f0)); } return 1; };
    const car = moving.length;
    moving.push({ geo: place(sedan('#c97b5a'), { s: 0.85 }), pivot: [0, y0 + 0.04, 0], anim: (t) => { const f = cyc(t, P), a = along(path, pos(f)), lift = f > 0.26 && f < 0.36 ? hop(win(f, 0.26, 0.36)) * 0.9 : 0; return { x: a.p.x, y: lift, z: a.p.z, ry: a.ry, s: (f > 0.95 ? 1 - win(f, 0.95, 1) : Math.min(1, f / 0.04)) + 0.001 }; } });
    moving.push({ geo: part(box(1.6, 0.04, 0.9), '#8a7a5a', { p: [0, 1.0, 0] }), pivot: [0, 0, 0], parent: car, anim: (t) => (cyc(t, P) < 0.46 ? {} : { s: 0.001 }) });
    moving.push({ geo: merge(part(box(0.55, 0.36, 0.03), YEL), pixText('$', 0.06, NAVY, 0.05)), pivot: [0, 1.4, 0], parent: car, anim: (t) => { const f = cyc(t, P); return f > 0.7 ? { s: back(win(f, 0.7, 0.76)) } : { s: 0.001 }; } });
    moving.push({ geo: merge(part(rbox(0.9, 0.4, 0.04, 0.06), K.white), pixText('OFFER', 0.035, NAVY, 0.05)), pivot: [AX, y0 + 1.9, AZ - 0.2], anim: (t) => { const f = cyc(t, P); return f > 0.08 && f < 0.2 ? { ry: Math.PI / 4, s: back(win(f, 0.08, 0.12)) } : { s: 0.001 }; } });
    // The wash brushes and suds, the inspection ticks.
    [-1, 1].forEach((s) => moving.push({ geo: merge(part(cyl(0.2, 0.2, 1.1, 12), '#4fc3f7'), [0, 1, 2, 3].map((k) => part(box(0.45, 1.0, 0.04), '#7fd3f7', { r: [0, k * Math.PI / 4, 0] }))), pivot: [CX, y0 + 0.65, CZ + s * 0.75], anim: (t) => { const f = cyc(t, P); return { ry: t * (f > 0.42 && f < 0.54 ? 12 : 1) }; } }));
    for (let k = 0; k < 4; k++) moving.push({ geo: tickGeo(0.13), pivot: [CX + 2.25, y0 + 1.5 - k * 0.3, CZ - 1.05], anim: (t) => { const f = cyc(t, P), a = 0.58 + k * 0.02; return f > a && f < 0.98 ? { s: 1 } : { s: 0.001 }; } });
    // The car hauler leaving along the front road with a full deck.
    const hauler = merge(part(rbox(0.9, 0.9, 0.9, 0.08), NAVY, { p: [1.9, 0.65, 0] }), part(box(3.2, 0.1, 0.9), '#7b828c', { p: [0, 0.45, 0] }), part(box(3.0, 0.08, 0.9), '#7b828c', { p: [-0.1, 1.15, 0], r: [0, 0, 0.05] }), [-1.1, 0.4].map((x) => place(sedan('#e5533d'), { p: [x, 0.5, 0], s: 0.55 })), [-1.0, 0.5].map((x) => place(sedan('#3d7be0'), { p: [x, 1.22, 0], s: 0.55 })), [[-1.2, 0.45], [1.9, 0.45], [-1.2, -0.45], [1.9, -0.45]].map(([x, z]) => part(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12), '#1d1f24', { p: [x, 0.2, z], r: [Math.PI / 2, 0, 0] })));
    moving.push({ geo: place(hauler, { s: 0.85 }), pivot: [0, y0 + 0.05, 4.6], anim: (t) => { const x = -6.4 + cyc(t, P, 0.3) * 12.8; return { x, s: clamp01((4.8 - Math.abs(x)) / 0.8) + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Hertz: a car waiting for everyone off the plane. The jet lands, the traveller walks to the
  // yellow counter and drives a car out of the gate, while a returned car rolls through the wash,
  // gets charged and parks in the empty bay for the next flight.
  hertz: { finder: '#ffd100', build: () => {
    const R = rand(221), out = [], YEL = '#ffd100', INK = '#1d1f24';
    out.push(ground('#8fc66f'), part(box(10.2, 0.02, 1.4), '#4a4f57', { p: [0, y0 + 0.01, -4.0] }), part(rbox(9.6, 0.04, 7.0, 0.03), '#6a7079', { p: [0, y0 + 0.02, 0.6] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.55, 0.01, 0.06), '#f4f4f0', { p: [-4.4 + i * 1.25, y0 + 0.02, -4.0] }));
    // ---- the terminal and the yellow counter canopy, back
    out.push(part(rbox(4.4, 1.4, 1.4, 0.05), '#e3e7eb', { p: [-2.4, y0 + 0.7, -2.7] }), part(box(4.2, 0.6, 0.02), '#7fa6c8', { p: [-2.4, y0 + 0.8, -1.99] }), part(box(4.5, 0.15, 1.5), '#9aa1a9', { p: [-2.4, y0 + 1.45, -2.7] }));
    out.push(part(rbox(3.0, 0.3, 1.8, 0.05), YEL, { p: [1.6, y0 + 2.0, -2.2] }), [[-1.3, -0.8], [1.3, -0.8], [-1.3, 0.8], [1.3, 0.8]].map(([x, z]) => part(cyl(0.06, 0.06, 2.0, 8), '#c9ced6', { p: [1.6 + x, y0 + 1.0, -2.2 + z] })), place(pixText('HERTZ', 0.09, INK, 0.03), { p: [1.6, y0 + 2.0, -1.28] }), part(rbox(2.0, 0.9, 0.5, 0.04), YEL, { p: [1.6, y0 + 0.45, -2.7] }), place(fan(INK), { p: [1.6, y0, -3.1], s: 1.3 }));
    // ---- the lot: three rows of bays with cars and chargers
    const bays = [];
    for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) bays.push([-3.8 + k * 1.3, 0.3 + r * 2.2]);
    bays.forEach(([x, z], i) => { out.push(part(box(0.05, 0.012, 1.8), K.white, { p: [x - 0.65, y0 + 0.05, z] })); if (i % 6 === 5) out.push(part(box(0.05, 0.012, 1.8), K.white, { p: [x + 0.65, y0 + 0.05, z] })); if (i !== 3 && i !== 8) out.push(place(sedan(['#f4f5f6', INK, YEL, '#9aa1a9', '#3d7be0', '#e5533d'][i % 6]), { p: [x, y0 + 0.04, z], r: [0, Math.PI / 2, 0], s: 0.85 })); out.push(part(rbox(0.2, 0.8, 0.2, 0.04), '#2f9e6e', { p: [x, y0 + 0.4, z - 1.05] })); });
    // ---- the car wash lane, front right: an arch with brushes
    const WX = 3.6, WZ = 4.3;
    out.push(part(rbox(0.3, 1.6, 0.3, 0.04), '#3d7be0', { p: [WX - 0.9, y0 + 0.8, WZ - 0.6] }), part(rbox(0.3, 1.6, 0.3, 0.04), '#3d7be0', { p: [WX - 0.9, y0 + 0.8, WZ + 0.6] }), part(rbox(0.4, 0.3, 1.5, 0.04), '#3d7be0', { p: [WX - 0.9, y0 + 1.7, WZ] }));
    out.push(trees(R, [[4.8, -2.4], [-4.8, 4.8], [4.8, 2.2]], 0.45));
    // ---- moving parts
    const moving = [], P = 14;
    // The jet landing along the back runway.
    moving.push({ geo: place(jet('#3d7be0'), { s: 0.7 }), pivot: [0, y0, -3.88], anim: (t) => { const f = cyc(t, P), x = -6 + easeOut(win(f, 0, 0.3)) * 12, y = (1 - easeOut(win(f, 0, 0.2))) * 2.5; return { x, y, s: clamp01((5.4 - Math.abs(x)) / 0.6) * Math.min(1, f / 0.03) + 0.001 }; } });
    // The traveller: off the plane to the counter, then to bay 3.
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, P), u = easeIO(win(f, 0.2, 0.35)), v = easeIO(win(f, 0.42, 0.55)); return f < 0.4 ? { x: -0.6 + u * 2.2, z: -1.8 + u * 0.4, ry: -0.2, still: f > 0.35, s: f < 0.18 ? 0.001 : 1 } : { x: 1.6 + v * (bays[3][0] - 1.6 - 0.6), z: -1.4 + v * (bays[3][1] - 0.4 + 1.4), ry: -1.4, s: f > 0.56 ? 0.001 : 1 }; }, { shirt: '#d6336c', pants: '#2b3a55', y: y0, carry: part(rbox(0.3, 0.4, 0.18, 0.04), INK, { p: [0, 0.3, 0.35] }) }));
    // Her car: in bay 3 until she arrives, then out of the lot and away.
    moving.push({ geo: place(sedan(YEL), { r: [0, Math.PI / 2, 0], s: 0.85 }), pivot: [bays[3][0], y0 + 0.04, bays[3][1]], anim: (t) => { const f = cyc(t, P), u = easeIn(win(f, 0.58, 0.85)); return f < 0.04 ? { s: f / 0.04 + 0.001 } : { z: u * 4.6, s: f > 0.8 ? Math.max(0.001, 1 - win(f, 0.8, 0.86)) : 1 }; } });
    // A returned car: through the wash, along the lane, into bay 8.
    const ret = curve([[5.6, y0 + 0.04, WZ], [WX - 0.9, y0 + 0.04, WZ], [1.0, y0 + 0.04, WZ - 0.2], [bays[8][0], y0 + 0.04, bays[8][1] + 1.3], [bays[8][0], y0 + 0.04, bays[8][1]]]);
    moving.push({ geo: place(sedan('#2f9e6e'), { s: 0.85 }), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P, 0.5), u = f < 0.3 ? easeOut(win(f, 0, 0.3)) * 0.25 : f < 0.45 ? 0.25 : f < 0.85 ? 0.25 + easeIO(win(f, 0.45, 0.85)) * 0.75 : 1, a = along(ret, u); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry, s: (f > 0.95 ? 1 - win(f, 0.95, 1) : Math.min(1, f / 0.05)) + 0.001 }; } });
    [-1, 1].forEach((s) => moving.push({ geo: merge(part(cyl(0.22, 0.22, 1.2, 14), '#4fc3f7'), [0, 1, 2, 3].map((k) => part(box(0.5, 1.1, 0.04), '#7fd3f7', { r: [0, k * Math.PI / 4, 0] }))), pivot: [WX - 0.9, y0 + 0.7, WZ + s * 0.42], anim: (t) => { const f = cyc(t, P, 0.5); return { ry: t * (f > 0.25 && f < 0.48 ? 12 : 1) }; } }));
    for (let k = 0; k < 4; k++) moving.push({ geo: bubbleGeo(0.16), pivot: [WX - 0.9 + (k - 1.5) * 0.25, y0 + 1.2, WZ], anim: (t) => { const f = cyc(t, P, 0.5), u = cyc(t, 0.8, k / 4); return f > 0.25 && f < 0.48 ? { y: u * 0.8, s: 1 - u + 0.001 } : { s: 0.001 }; } });
    // Charging lights on the posts.
    bays.forEach(([x, z], i) => moving.push({ geo: part(box(0.12, 0.12, 0.02), '#62d35f'), pivot: [x, y0 + 0.65, z - 0.94], anim: (t) => ({ s: Math.sin(t * 3 + i) > 0 ? 1 : 0.4 }) }));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Goodyear: the tyre maker the whole world can see. The blimp drifts over the race track while
  // the cars lap on Goodyear rubber, and the giant tyre stands by the factory.
  goodyear: { finder: '#003e7e', build: () => {
    const R = rand(153), out = [], BLUE = '#003e7e', YEL = '#fedb00';
    out.push(ground('#7fbf5a'));
    // ---- the oval track
    const ring2 = (a1, b1, a2, b2, c, y) => { const n = hi() ? 96 : 32, tri = []; for (let i = 0; i < n; i++) { const u = (i / n) * TAU, v = ((i + 1) / n) * TAU; const A0 = [Math.cos(u) * a1, y, Math.sin(u) * b1], A1 = [Math.cos(u) * a2, y, Math.sin(u) * b2], B0 = [Math.cos(v) * a1, y, Math.sin(v) * b1], B1 = [Math.cos(v) * a2, y, Math.sin(v) * b2]; tri.push(...A0, ...B0, ...A1, ...A1, ...B0, ...B1); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3)); g.computeVertexNormals(); return part(g, c); };
    const TX = 0.6, TZ = 1.0;
    out.push(place(ring2(2.6, 1.8, 4.0, 3.1, '#4a4f57', 0), { p: [TX, y0 + 0.012, TZ] }), place(ring2(3.95, 3.05, 4.05, 3.15, K.white, 0), { p: [TX, y0 + 0.016, TZ] }), place(ring2(2.55, 1.75, 2.65, 1.85, K.white, 0), { p: [TX, y0 + 0.016, TZ] }));
    // Grandstand on the back straight.
    out.push(part(extrude([[0, 0], [1.2, 0], [1.2, 1.0]], 4.0), '#c9ced6', { p: [TX, y0, TZ - 3.9], r: [0, -Math.PI / 2, 0] }).translate(0, 0, 0));
    for (let k = 0; k < 12; k++) out.push(place(fan(['#e5533d', BLUE, YEL, '#2f9e6e'][k % 4]), { p: [TX - 1.8 + k * 0.33, y0 + 0.5 + (k % 2) * 0.35, TZ - 4.3 + (k % 2) * 0.4], s: 0.9 }));
    // ---- the factory and its giant tyre, back left
    out.push(part(rbox(2.0, 1.4, 1.6, 0.05), '#e6e9ed', { p: [-3.9, y0 + 0.7, -3.4] }), part(box(2.02, 0.3, 1.62), BLUE, { p: [-3.9, y0 + 1.3, -3.4] }), part(cyl(0.18, 0.2, 1.4, 12), '#9aa1a9', { p: [-4.4, y0 + 2.1, -3.8] }));
    out.push(place(tyre(1.2, 0.7, YEL), { p: [-3.6, y0 + 1.2, -1.2], r: [0, Math.PI / 4, 0] }), part(rbox(1.2, 0.1, 0.8, 0.03), '#c9ced6', { p: [-3.6, y0 + 0.05, -1.2] }));
    out.push(trees(R, [[TX, TZ], [TX - 1.2, TZ + 0.2], [TX + 1.2, TZ - 0.2], [-4.6, 4.6], [4.6, -4.4]], 0.55));
    // ---- moving parts
    const moving = [];
    // The blimp, drifting round above.
    const blimp = merge(part(new THREE.SphereGeometry(0.75, hi() ? 32 : 12, hi() ? 20 : 8), '#d8dde3', { s: [2.4, 1, 1] }), part(new THREE.SphereGeometry(0.76, hi() ? 32 : 12, hi() ? 20 : 8, 0, TAU, Math.PI * 0.4, Math.PI * 0.2), BLUE, { s: [2.4, 1, 1] }), part(rbox(0.6, 0.2, 0.25, 0.08), '#3a3f47', { p: [0.2, -0.8, 0] }), [0, 1, 2, 3].map((k) => part(extrude([[0, 0], [0.5, 0], [0.5, 0.45]], 0.05), BLUE, { p: [-1.6, 0, 0], r: [k * Math.PI / 2, 0, 0] })), place(pixText('GOODYEAR', 0.055, YEL, 0.02), { p: [0, 0, 0.77] }), place(pixText('GOODYEAR', 0.055, YEL, 0.02), { p: [0, 0, -0.77], r: [0, Math.PI, 0] }));
    moving.push({ geo: blimp, pivot: [TX, y0 + 4.8, TZ - 1.0], anim: (t) => { const a = t * 0.15; return { x: Math.cos(a) * 1.4, z: Math.sin(a) * 0.9, ry: -a - Math.PI / 2, y: Math.sin(t * 0.7) * 0.15 }; } });
    // The race cars lapping.
    const racer = (c) => merge(part(rbox(1.0, 0.18, 0.45, 0.06), c, { p: [0, 0.18, 0] }), part(rbox(0.3, 0.14, 0.25, 0.05), '#1d1f24', { p: [-0.05, 0.33, 0] }), part(box(0.15, 0.04, 0.55), c, { p: [-0.45, 0.35, 0] }), [[-0.32, 0.25], [0.32, 0.25], [-0.32, -0.25], [0.32, -0.25]].map(([x, z]) => part(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 12), '#1d1f24', { p: [x, 0.11, z], r: [Math.PI / 2, 0, 0] })), part(new THREE.CylinderGeometry(0.115, 0.115, 0.02, 12), YEL, { p: [0.32, 0.11, 0.3], r: [Math.PI / 2, 0, 0] }));
    ['#e5533d', BLUE, YEL, '#2f9e6e'].forEach((c, i) => moving.push({ geo: racer(c), pivot: [TX, y0, TZ], anim: (t) => { const u = cyc(t, 5 + i * 0.4, i * 0.22) * TAU, a = 3.3 - (i % 2) * 0.35, b = 2.45 - (i % 2) * 0.35; return { x: Math.cos(u) * a, z: Math.sin(u) * b, ry: Math.atan2(-Math.cos(u) * b, -Math.sin(u) * a) }; } }));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Paccar: the premium trucks drivers ask for. Kenworths and Peterbilts roll off the line and
  // out onto the highway, and when they stop in, the parts counter keeps them running.
  paccar: { finder: '#003a70', build: () => {
    const R = rand(154), out = [], NAVY = '#003a70';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 2.2), '#4a4f57', { p: [0, y0 + 0.015, 2.6] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.6, 0.01, 0.06), '#f2c94c', { p: [-4.6 + i * 1.3, y0 + 0.035, 2.6] }));
    // A long-nose conventional: chrome grille, sleeper, stacks; nose along +x, on y = 0.
    const rig = (c, trail = true) => merge(part(rbox(1.1, 0.55, 0.9, 0.12), c, { p: [1.2, 0.75, 0] }), part(rbox(0.12, 0.6, 0.8, 0.04), '#d8dde3', { p: [1.78, 0.75, 0] }), part(rbox(0.8, 1.15, 0.95, 0.1), c, { p: [0.3, 1.0, 0] }), part(box(0.04, 0.35, 0.8), '#26323f', { p: [0.71, 1.3, 0] }), part(rbox(0.7, 1.25, 0.95, 0.1), shade(c, 0.85), { p: [-0.45, 1.05, 0] }), [-0.48, 0.48].map((z) => part(cyl(0.05, 0.05, 1.3, 10), '#d8dde3', { p: [0.7, 1.5, z] })), [[1.3, 0.48], [1.3, -0.48], [-0.4, 0.48], [-0.4, -0.48], [-0.9, 0.48], [-0.9, -0.48]].map(([x, z]) => part(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16), '#1d1f24', { p: [x, 0.28, z], r: [Math.PI / 2, 0, 0] })),
      trail ? [part(rbox(3.6, 1.4, 1.0, 0.05), K.white, { p: [-2.9, 1.2, 0] }), part(box(3.0, 0.3, 1.02), c, { p: [-2.9, 1.2, 0] }), [[-3.8, 0.48], [-3.8, -0.48], [-4.3, 0.48], [-4.3, -0.48]].map(([x, z]) => part(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 16), '#1d1f24', { p: [x, 0.26, z], r: [Math.PI / 2, 0, 0] }))] : []);
    // ---- the plant, back left, with its rollout door
    out.push(part(rbox(5.0, 2.2, 2.4, 0.05), '#e6e9ed', { p: [-2.4, y0 + 1.1, -3.3] }), part(box(5.02, 0.35, 2.42), NAVY, { p: [-2.4, y0 + 2.0, -3.3] }), place(pixText('PACCAR', 0.08, K.white, 0.03), { p: [-3.2, y0 + 2.0, -2.08] }), part(box(1.4, 1.5, 0.04), '#3a3f47', { p: [-1.0, y0 + 0.75, -2.08] }));
    // ---- the dealer and parts counter, back right
    out.push(part(rbox(2.6, 1.6, 2.0, 0.05), '#f4efe6', { p: [3.2, y0 + 0.8, -3.4] }), part(box(2.62, 0.35, 2.02), '#c8102e', { p: [3.2, y0 + 1.45, -3.4] }), place(pixText('PARTS', 0.07, K.white, 0.03), { p: [3.2, y0 + 1.45, -2.38] }), part(box(1.2, 0.8, 0.04), '#9cc3e0', { p: [3.2, y0 + 0.5, -2.38] }));
    // Two new trucks on the forecourt.
    out.push(place(rig('#c8102e', false), { p: [1.4, y0, -0.6], r: [0, Math.PI / 6, 0], s: 0.8 }), place(rig('#2f9e6e', false), { p: [-2.4, y0, 0.0], r: [0, Math.PI / 4, 0], s: 0.8 }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [0.4, 4.4], [4.6, 0.6], [0.8, -4.6]], 0.55));
    // ---- moving parts
    const moving = [];
    // Rigs on the highway, both ways.
    [['#003a70', 0, 7, 2.1], ['#f29a3a', 0.5, 8, 3.1]].forEach(([c, o, P, z], i) => moving.push({ geo: place(rig(c), { s: 0.6, r: [0, i ? Math.PI : 0, 0] }), pivot: [0, y0, z], anim: (t) => { const x = (i ? 7 : -7) + (i ? -1 : 1) * cyc(t, P, o) * 14; return { x, s: clamp01((4.6 - Math.abs(x)) / 0.8) + 0.001 }; } }));
    // A new truck rolling out of the plant door.
    moving.push({ geo: place(rig('#5b6b7d', false), { r: [0, -Math.PI / 2, 0], s: 0.8 }), pivot: [-1.0, y0, -2.6], anim: (t) => { const f = cyc(t, 9), u = easeIO(win(f, 0.1, 0.6)); return { z: u * 1.8, s: f > 0.85 ? 1 - win(f, 0.85, 1) + 0.001 : Math.min(1, f / 0.1) + 0.001 }; } });
    // Parts boxes from the counter into the stopped rig.
    for (let k = 0; k < 3; k++) moving.push(rider(part(rbox(0.3, 0.25, 0.25, 0.03), '#c99a62'), curve([[3.2, y0 + 1.0, -2.3], [2.6, y0 + 2.0, -1.4], [1.8, y0 + 1.3, -0.5]]), 4, k / 3, 0, 0.7));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Northrop Grumman: the machines no one else can build. The B-21 Raider rolls down the runway
  // and lifts off while another sweeps overhead; the James Webb telescope unfolds its gold mirror
  // over its five-layer sunshield; and a rocket stands on its solid boosters behind.
  northrop: { finder: '#0d2240', build: () => {
    const R = rand(220), out = [], NAVY = '#0d2240', GOLD = '#d9a93a';
    out.push(ground('#c9b98f'), part(box(10.2, 0.02, 1.6), '#4a4f57', { p: [0, y0 + 0.01, 2.8] }));
    for (let i = 0; i < 8; i++) out.push(part(box(0.55, 0.01, 0.08), '#f4f4f0', { p: [-4.4 + i * 1.25, y0 + 0.02, 2.8] }));
    // ---- the hangar, back left: an arched roof with the name
    const HX = -2.8, HZ = -2.6;
    out.push(part(new THREE.CylinderGeometry(2.0, 2.0, 3.6, hi() ? 32 : 12, 1, false, 0, Math.PI), '#c9ced6', { p: [HX, y0, HZ], r: [0, 0, Math.PI / 2] }), part(new THREE.CircleGeometry(2.0, hi() ? 32 : 12, 0, Math.PI), '#3a3f47', { p: [HX + 1.81, y0, HZ], r: [0, Math.PI / 2, 0] }), place(pixText('NORTHROP GRUMMAN', 0.05, NAVY, 0.03), { p: [HX, y0 + 1.6, HZ + 1.3], r: [-0.85, 0, 0] }));
    out.push(part(box(2.4, 0.02, 3.0), '#9aa1a9', { p: [HX + 2.4, y0 + 0.01, HZ + 0.8] }));
    // ---- the rocket on its pad, back
    out.push(part(rbox(1.6, 0.3, 1.6, 0.05), '#7b828c', { p: [0.8, y0 + 0.15, -3.9] }), place(rocketGeo(4.6, '#f4f5f6', NAVY, '#3a3f47'), { p: [0.8, y0 + 0.3, -3.9] }), [-1, 1].map((s) => part(cyl(0.18, 0.18, 2.6, 16), K.white, { p: [0.8 + s * 0.48, y0 + 1.6, -3.9] })), [-1, 1].map((s) => part(cone(0.18, 0.35, 16), K.white, { p: [0.8 + s * 0.48, y0 + 3.05, -3.9] })));
    out.push(part(box(0.3, 4.4, 0.3), '#c0392b', { p: [-0.3, y0 + 2.2, -4.3] }), part(box(0.9, 0.12, 0.12), '#c0392b', { p: [0.15, y0 + 3.6, -4.3] }));
    // ---- the telescope on its test stand, right: the sunshield kite with five layers
    const TX = 3.0, TZ = -0.8;
    out.push(part(rbox(1.2, 0.6, 1.2, 0.05), '#9aa1a9', { p: [TX, y0 + 0.3, TZ] }), part(cyl(0.12, 0.12, 0.9, 10), '#3a3f47', { p: [TX, y0 + 1.0, TZ] }));
    for (let k = 0; k < 5; k++) out.push(part(extrude([[-1.8, -0.9], [1.8, -0.9], [2.2, 0], [1.8, 0.9], [-1.8, 0.9], [-2.2, 0]], 0.02), ['#b48fd0', '#c9a7d8', '#b48fd0', '#d8c0e4', '#e8d6f0'][k], { p: [TX, y0 + 1.4 + k * 0.09, TZ], r: [Math.PI / 2, 0, Math.PI / 4], s: 0.75 }));
    out.push(part(rbox(0.6, 0.4, 0.6, 0.05), '#2b2f36', { p: [TX, y0 + 1.25, TZ] }));
    out.push(trees(R, [[-4.6, 1.0], [4.6, -4.4], [-0.6, 1.2], [4.6, 4.6]], 0.5));
    // ---- moving parts
    const moving = [];
    // The mirror: a centre of seven gold hexes and two wings of three that unfold.
    const hex = (c) => part(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 6), c, { r: [Math.PI / 2, 0, Math.PI / 6] });
    const hexAt = (q, r) => [0.54 * (q + r / 2), 0.47 * r];
    const mir = moving.length, MQ = Math.PI / 4;
    moving.push({ geo: merge([[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]].map(([q, r]) => place(hex(GOLD), { p: [...hexAt(q, r), 0] })), part(cyl(0.03, 0.03, 1.4, 6), '#2b2f36', { p: [0, 0, 0.7], r: [Math.PI / 2, 0, 0] }), part(cyl(0.14, 0.14, 0.08, 10), '#2b2f36', { p: [0, 0, 1.4], r: [Math.PI / 2, 0, 0] }), part(rbox(0.3, 1.6, 0.2, 0.04), '#3a3f47', { p: [0, -0.5, -0.2] })), pivot: [TX, y0 + 3.0, TZ], anim: () => ({ ry: MQ, rx: -0.35 }) });
    [-1, 1].forEach((side) => moving.push({ geo: merge([[0, 0], [0, 1], [0, -1]].map(([q, r]) => place(hex('#e9bb4a'), { p: [side * 0.54 + hexAt(q, r)[0] - (r ? side * 0.27 * 0 : 0), hexAt(q, r)[1], 0] }))), pivot: [side * 0.81, 0, 0], parent: mir, anim: (t) => { const f = cyc(t, 12), open = easeIO(win(f, 0.15, 0.45)) - easeIO(win(f, 0.85, 1)); return { ry: side * (1 - open) * 1.7 }; } }));
    // The B-21: a dark flying wing, one taking off, one sweeping round overhead.
    const wing = merge(part(extrude([[1.2, 0], [-0.4, 1.9], [-0.7, 1.5], [-0.45, 1.0], [-0.75, 0.6], [-0.5, 0], [-0.75, -0.6], [-0.45, -1.0], [-0.7, -1.5], [-0.4, -1.9]], 0.14), '#4a4f57', { r: [Math.PI / 2, 0, 0] }), part(new THREE.SphereGeometry(0.42, 16, 8, 0, TAU, 0, Math.PI / 2), '#3a3f47', { s: [1.4, 0.4, 0.8], p: [0.2, 0.06, 0] }), part(box(0.25, 0.03, 0.4), '#1d1f24', { p: [0.62, 0.14, 0] }));
    moving.push({ geo: place(wing, { s: 1.2 }), pivot: [0, y0 + 0.3, 2.8], anim: (t) => { const f = cyc(t, 10), x = -5.4 + easeIn(win(f, 0.1, 0.85)) * 11, y = easeIn(win(f, 0.5, 1)) * 3.0; return { x, y, rz: Math.min(0.2, win(f, 0.45, 0.6) * 0.2), s: clamp01((5.2 - Math.abs(x)) / 0.7) * Math.min(1, f / 0.08) + 0.001 }; } });
    moving.push({ geo: wing, pivot: [-0.4, y0 + 5.0, 0.0], anim: (t) => { const a = t * 0.3; return { x: Math.cos(a) * 2.6, z: Math.sin(a) * 2.0, ry: -a - Math.PI / 2, rx: -0.3 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // International Paper: the boxes the online world ships in. Logs come out of the managed pine
  // forest to the mill, and out of the mill comes corrugated board, folded into the boxes the
  // delivery vans carry away.
  internationalpaper: { finder: '#004b87', build: () => {
    const R = rand(156), out = [], BLUE = '#004b87', KRAFT = '#c99a62';
    out.push(ground('#8fc66f'), part(box(10.2, 0.03, 1.2), '#5b616b', { p: [0, y0 + 0.015, 3.8] }));
    // ---- the pine forest, back left: rows of conifers, a few stumps
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = -4.6 + i * 0.6 + (j % 2) * 0.3, z = -4.6 + j * 0.65; if (i === 5 && j > 1) continue; const h = 1.0 + R() * 0.5; out.push(part(cyl(0.05, 0.07, 0.4, 6), '#6f4a2c', { p: [x, y0 + 0.2, z] }), part(cone(0.32, h, 8), shade('#2f6f3a', 0.85 + R() * 0.3), { p: [x, y0 + 0.35 + h / 2, z] })); }
    for (let k = 0; k < 4; k++) out.push(part(cyl(0.08, 0.09, 0.12, 8), '#c9a36b', { p: [-4.4 + k * 0.6, y0 + 0.06, -1.6] }), part(cone(0.12, 0.3, 8), '#5fae45', { p: [-4.1 + k * 0.6, y0 + 0.15, -1.6] }));
    // ---- the mill, back right: buildings, a stack, the log yard
    const MX = 2.6, MZ = -3.0;
    out.push(part(rbox(3.4, 1.8, 2.2, 0.05), '#e6e9ed', { p: [MX, y0 + 0.9, MZ] }), part(box(3.42, 0.3, 2.22), BLUE, { p: [MX, y0 + 1.65, MZ] }), place(pixText('IP', 0.1, K.white, 0.03), { p: [MX - 1.0, y0 + 1.65, MZ + 1.12] }), part(cyl(0.25, 0.3, 3.4, 16), '#c9ced6', { p: [MX + 1.2, y0 + 1.7, MZ - 0.5] }), part(cyl(0.6, 0.6, 1.2, 20), '#9aa1a9', { p: [MX - 1.0, y0 + 2.4, MZ - 0.4] }));
    for (let k = 0; k < 5; k++) out.push(part(cyl(0.12, 0.12, 1.4, 10), '#9a6a41', { p: [0.4, y0 + 0.12 + (k % 3) * 0.2, -2.4 + Math.floor(k / 3) * 0.26 + (k % 3) * 0.05], r: [0, 0, Math.PI / 2] }));
    // ---- the board line: a conveyor out of the mill toward the front
    out.push(part(rbox(0.9, 0.5, 5.0, 0.05), '#5b616b', { p: [MX, y0 + 0.25, 0.6] }), part(box(0.8, 0.03, 4.9), '#2b2f36', { p: [MX, y0 + 0.51, 0.6] }));
    // Stacks of flat board and a pallet of boxes at the end.
    out.push(part(box(1.0, 0.6, 1.0), KRAFT, { p: [MX - 1.4, y0 + 0.3, 0.0] }), part(box(1.0, 0.02, 1.0), '#a87a48', { p: [MX - 1.4, y0 + 0.4, 0.0] }));
    out.push(trees(R, [[-0.6, 4.6], [-4.4, 4.4], [4.6, 4.6], [-1.6, 1.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 9;
    // The log truck from the forest to the mill.
    const logTruck = merge(part(rbox(0.7, 0.8, 0.8, 0.08), '#2f6f3a', { p: [0.9, 0.55, 0] }), part(box(1.8, 0.1, 0.8), '#3a3f47', { p: [-0.4, 0.35, 0] }), [0, 1, 2].map((k) => part(cyl(0.12, 0.12, 1.8, 10), '#9a6a41', { p: [-0.4, 0.55 + (k === 2 ? 0.2 : 0), -0.15 + (k % 2) * 0.3 + (k === 2 ? 0.15 : 0)], r: [0, 0, Math.PI / 2] })), [[-0.9, 0.42], [0.8, 0.42], [-0.9, -0.42], [0.8, -0.42]].map(([x, z]) => part(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), '#1d1f24', { p: [x, 0.18, z], r: [Math.PI / 2, 0, 0] })));
    const logRoute = curve([[-3.0, y0, -1.0], [-1.0, y0, -0.8], [0.6, y0, -1.6], [1.0, y0, -1.9]]);
    moving.push({ geo: place(logTruck, { s: 0.8 }), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, P), u = easeIO(win(f, 0, 0.45)) - easeIO(win(f, 0.55, 1)), a = along(logRoute, clamp01(u)); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: f < 0.5 ? a.ry : a.ry + Math.PI }; } });
    // Corrugated boxes along the line, flat board folding up into boxes near the end.
    for (let k = 0; k < 6; k++) moving.push({ geo: parcel(0.45), pivot: [MX, y0 + 0.73, 0], anim: (t) => { const u = cyc(t, 6, k / 6); return { z: -1.6 + u * 4.4, sy: 0.15 + 0.85 * easeOut(win(u, 0.35, 0.55)), s: Math.min(1, u / 0.05, (1 - u) / 0.05) + 0.001 }; } });
    // The van carrying them off along the road.
    moving.push({ geo: van(K.white, BLUE), pivot: [0, y0, 3.8], anim: (t) => { const x = 5.6 - cyc(t, 7) * 11.2; return { x, ry: Math.PI, s: clamp01((5.0 - Math.abs(x)) / 0.5) * 0.8 + 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Newmont: the world's biggest gold miner, decades of ore in the ground. Haul trucks climb the
  // terraced pit with ore for the mill, and at the end of the line the gold is poured into bars.
  newmont: { finder: '#c49a2c', build: () => {
    const R = rand(157), out = [], GOLD = '#c49a2c';
    out.push(ground('#c8a77a'));
    // ---- the open pit: stepped terraces down into the ground (rings on the slab), centre left
    const PX = -1.4, PZ = -0.6;
    const prof = [[3.6, 0], [3.3, 1.0], [2.8, 1.0], [2.8, 0.8]], cols = ['#b8956a', '#a8845c', '#987552', '#88674a', '#755a42'];
    for (let k = 0; k < 4; k++) { const r = 2.8 - k * 0.55, y = 0.8 - k * 0.2; prof.push([r - 0.55, y], [r - 0.55, y - 0.2]); }
    prof.push([0, 0.0]);
    out.push(part(lathe(prof, 64), (x, y) => cols[Math.max(0, Math.min(4, Math.round((1.0 - (y - y0)) / 0.2)))], { p: [PX, y0, PZ], s: [1, 1, 0.8] }));
    out.push(part(cyl(0.5, 0.5, 0.04, 24), '#5e7f8f', { p: [PX, y0 + 0.02, PZ], s: [1, 1, 0.8] }));
    // ---- the mill, back right, and the refinery hut
    out.push(part(rbox(2.6, 1.8, 1.8, 0.05), '#d8dde3', { p: [3.2, y0 + 0.9, -3.4] }), part(box(2.62, 0.3, 1.82), GOLD, { p: [3.2, y0 + 1.65, -3.4] }), place(pixText('NEWMONT', 0.06, K.white, 0.03), { p: [3.2, y0 + 1.65, -2.48] }), part(cyl(0.6, 0.6, 2.4, 20), '#c9ced6', { p: [4.2, y0 + 1.2, -1.6] }), beam([2.2, y0 + 0.4, -2.4], [3.0, y0 + 1.6, -2.4], 0.2, '#7b828c'));
    out.push(part(rbox(1.6, 1.0, 1.2, 0.05), '#9aa1a9', { p: [3.6, y0 + 0.5, 1.4] }), part(box(0.8, 0.5, 0.04), '#3a1f0a', { p: [3.4, y0 + 0.4, 2.02] }));
    // The stack of poured bars in front of the refinery.
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) out.push(part(extrude([[-0.22, 0], [0.22, 0], [0.17, 0.14], [-0.17, 0.14]], 0.22), '#f2c94c', { p: [2.9 + k * 0.48 + r * 0.24, y0 + r * 0.15, 3.0] }));
    out.push(trees(R, [[-4.6, 4.6], [4.6, -0.4], [0.6, 4.6]], 0.5));
    // ---- moving parts
    const moving = [], P = 10;
    // Haul trucks climbing the spiral ramp out of the pit and on to the mill.
    const haul = merge(part(rbox(1.0, 0.4, 0.8, 0.06), '#f2c94c', { p: [0, 0.5, 0] }), part(box(1.0, 0.25, 0.8), '#e0b23a', { p: [-0.1, 0.8, 0], r: [0, 0, -0.15] }), part(rbox(0.3, 0.35, 0.6, 0.05), '#f2c94c', { p: [0.55, 0.75, 0.0] }), part(new THREE.SphereGeometry(0.25, 10, 8), '#8a6a4a', { p: [-0.15, 0.95, 0], s: [1.6, 0.6, 1.1] }), [[-0.35, 0.42], [0.35, 0.42], [-0.35, -0.42], [0.35, -0.42]].map(([x, z]) => part(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 12), '#1d1f24', { p: [x, 0.25, z], r: [Math.PI / 2, 0, 0] })));
    const spiral = curve([...Array.from({ length: 9 }, (_, i) => { const u = i / 8, a = u * TAU * 1.1, r = 0.7 + u * 2.4; return [PX + Math.cos(a) * r, y0 + 0.04 + Math.max(0, r - 0.55) / 2.55 * 0.98, PZ + Math.sin(a) * r * 0.8]; }), [1.4, y0, -2.6], [2.2, y0, -2.6]]);
    [0, 0.5].forEach((o) => moving.push({ geo: place(haul, { s: 0.7 }), pivot: [0, 0, 0], anim: (t) => { const u = cyc(t, P, o), a = along(spiral, u); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry, s: Math.min(1, u / 0.05, (1 - u) / 0.05) + 0.001 }; } }));
    // The excavator at the bottom of the pit, digging.
    moving.push({ geo: merge(part(rbox(0.6, 0.35, 0.5, 0.05), '#f2c94c', { p: [0, 0.3, 0] }), part(box(0.7, 0.15, 0.6), '#3a3f47', { p: [0, 0.08, 0] }), beam([0.2, 0.4, 0], [0.8, 0.9, 0], 0.08, '#f2c94c'), beam([0.8, 0.9, 0], [1.1, 0.3, 0], 0.07, '#f2c94c')), pivot: [PX - 0.2, y0 + 0.12, PZ], anim: (t) => ({ ry: Math.sin(t * 0.8) * 0.8 }) });
    // The pour: a glowing stream into a mould, the new bar sliding onto the stack.
    moving.push({ geo: part(cyl(0.05, 0.08, 0.6, 10), '#ffb02e', { p: [0, -0.3, 0] }), pivot: [3.4, y0 + 0.9, 2.4], anim: (t) => { const f = cyc(t, 4); return f < 0.5 ? { sy: 1 + Math.sin(t * 30) * 0.05 } : { s: 0.001 }; } });
    moving.push({ geo: part(extrude([[-0.22, 0], [0.22, 0], [0.17, 0.14], [-0.17, 0.14]], 0.22), '#ffcf3f'), pivot: [3.4, y0 + 0.02, 2.4], anim: (t) => { const f = cyc(t, 4), u = easeIO(win(f, 0.5, 0.9)); return { x: u * -0.5, z: u * 0.6, s: f < 0.1 ? f / 0.1 + 0.001 : f > 0.92 ? 0.001 : 1 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Databricks: the lakehouse. Data of every kind pours into one lake, and the house built on
  // it, stacked red bricks, turns it into the tables, charts and AI models a company runs on.
  databricks: { finder: '#ff3621', build: () => {
    const R = rand(158), out = [], RED = '#ff3621', NAVY = '#1b3139';
    out.push(ground('#8fc66f'), part(cyl(3.2, 3.2, 0.06, 64), 'W', { p: [-0.6, y0 + 0.03, -0.6], s: [1, 1, 0.85] }), part(torus(3.2, 0.1, TAU, 64), '#c9c4b8', { p: [-0.6, y0 + 0.05, -0.6], r: [Math.PI / 2, 0, 0], s: [1, 0.85, 1] }));
    // ---- the lakehouse: stilts, a deck, and the stacked-brick logo as the house
    const HX = -0.6, HZ = -0.6;
    [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([x, z]) => out.push(part(cyl(0.08, 0.08, 0.7, 10), '#7b828c', { p: [HX + x, y0 + 0.35, HZ + z] })));
    out.push(part(rbox(2.4, 0.14, 2.4, 0.04), '#c9a36b', { p: [HX, y0 + 0.75, HZ] }));
    const brick = (s) => merge(part(extrude([[0, -0.5], [1, 0], [0, 0.5], [-1, 0]], 0.28), RED, { r: [Math.PI / 2, 0, 0] })).scale(s, 1, s);
    for (let k = 0; k < 4; k++) out.push(place(brick(1.0 - k * 0.05), { p: [HX, y0 + 1.0 + k * 0.42, HZ], r: [0, Math.PI / 4, 0] }));
    // ---- the sources round the shore: an app, a sensor mast, a stack of files, a shop till
    const srcs = [[3.4, -3.6], [3.8, 0.4], [2.6, 3.6], [-3.4, 3.6]];
    out.push(part(rbox(0.9, 1.5, 0.12, 0.12), NAVY, { p: [3.4, y0 + 0.9, -3.6], r: [0, Math.PI / 4, 0] }), part(rbox(0.78, 1.3, 0.02, 0.08), '#9cc3e0', { p: [3.44, y0 + 0.9, -3.56], r: [0, Math.PI / 4, 0] }));
    out.push(part(cyl(0.05, 0.06, 2.0, 8), '#9aa1a9', { p: [3.8, y0 + 1.0, 0.4] }), part(rbox(0.3, 0.3, 0.3, 0.05), K.white, { p: [3.8, y0 + 2.0, 0.4] }), part(ball(0.08), '#62d35f', { p: [3.8, y0 + 2.2, 0.4] }));
    for (let k = 0; k < 5; k++) out.push(part(rbox(0.7, 0.08, 0.5, 0.02), ['#f4f5f6', '#fbf3e3', '#e8eef4'][k % 3], { p: [2.6, y0 + 0.05 + k * 0.09, 3.6], r: [0, k * 0.1, 0] }));
    out.push(part(rbox(1.0, 0.8, 0.6, 0.04), '#8a5a36', { p: [-3.4, y0 + 0.4, 3.6] }), part(rbox(0.3, 0.25, 0.04, 0.03), '#1d1f24', { p: [-3.4, y0 + 0.95, 3.6], r: [-0.3, 0, 0] }));
    // ---- what comes out: a dashboard board and a model chip, back left
    out.push(part(rbox(2.0, 1.3, 0.1, 0.05), K.white, { p: [-3.2, y0 + 1.6, -3.6], r: [0, Math.PI / 4, 0] }), part(box(0.08, 0.95, 0.08), '#9aa1a9', { p: [-3.2, y0 + 0.47, -3.6] }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 0.6], [0.6, 4.6], [0.6, -4.6]], 0.55));
    // ---- moving parts
    const moving = [], P = 6;
    // Data from every source down into the lake.
    const kinds = [(c) => part(new THREE.BoxGeometry(0.18, 0.18, 0.18), c), (c) => part(new THREE.SphereGeometry(0.11, 10, 7), c), (c) => part(new THREE.BoxGeometry(0.24, 0.04, 0.18), c), (c) => part(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 10), c)];
    const hs = [[3.4, 1.8, -3.6], [3.8, 2.3, 0.4], [2.6, 0.7, 3.6], [-3.4, 1.2, 3.6]];
    hs.forEach(([x, y, z], i) => { const path = curve([[x, y0 + y, z], [(x + HX) / 2, y0 + 2.6, (z + HZ) / 2], [HX + (x > HX ? 1 : -1) * 0.6, y0 + 0.2, HZ + (z > HZ ? 1 : -1) * 0.6]]); for (let k = 0; k < 2; k++) moving.push(rider(kinds[i](['#3d7be0', '#62d35f', '#f2c94c', '#d6336c'][i]), path, P / 2, i / 4 + k / 2, 0, 0.9, (t) => ({ rx: t * 3 }))); });
    // Ripples where it lands.
    hs.forEach(([x, , z], i) => moving.push(pulse(HX + (x > HX ? 1 : -1) * 0.6, y0 + 0.07, HZ + (z > HZ ? 1 : -1) * 0.6, '#d6f0fb', P / 2, i / 4 + 0.45, 0.3)));
    // The house's top brick pulsing as it works, and bars on the board climbing.
    moving.push({ geo: brick(0.9), pivot: [HX, y0 + 2.7, HZ], anim: (t) => ({ ry: Math.PI / 4, y: Math.sin(t * 2) * 0.05, s: 1 + Math.sin(t * 4) * 0.03 }) });
    const BQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0));
    for (let k = 0; k < 5; k++) { const v = new V(-0.7 + k * 0.35, 0, 0.07).applyQuaternion(BQ); moving.push({ geo: part(box(0.22, 1.0, 0.02), [RED, '#3d7be0', '#f2c94c', '#2f9e6e', RED][k], { p: [0, 0.5, 0] }), pivot: [-3.2 + v.x, y0 + 1.05, -3.6 + v.z], anim: (t) => ({ q: BQ, sy: 0.2 + 0.8 * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.6 + k))) * (0.4 + k * 0.12) }) }); }
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Perplexity: an answer engine that shows its sources. A question goes up to the big answer
  // screen; the search reaches every source round the square, three of them light up, and their
  // numbered citations fly back into the answer as it writes itself.
  perplexity: { finder: '#20808d', build: () => {
    const R = rand(218), out = [], TEAL = '#20808d', INK = '#13343b';
    out.push(ground('#8fc66f'), part(cyl(2.6, 2.6, 0.05, 56), '#e9efef', { p: [0, y0 + 0.025, 0] }));
    // ---- the sources round the square, each its own kind, each with a numbered badge
    const S = [[-3.7, 1.2, 'NEWS'], [-3.6, -2.0, 'LIBRARY'], [-1.0, -3.9, 'JOURNAL'], [2.2, -3.6, 'FORUM'], [3.9, -0.6, 'VIDEO'], [3.4, 2.6, 'WIKI'], [-1.2, 3.8, 'GOV']];
    const kindG = (k) => {
      if (k === 'NEWS') return merge(place(block(1.4, 2.0, 1.2, '#eef0f2', '#5b6b7d', 0.3), {}), part(box(1.44, 0.35, 1.24), INK, { p: [0, 1.85, 0] }));
      if (k === 'LIBRARY') return merge(part(rbox(1.6, 1.2, 1.2, 0.04), '#efe9dc', { p: [0, 0.6, 0] }), [0, 1, 2, 3].map((i) => part(cyl(0.07, 0.08, 1.0, 10), K.white, { p: [-0.55 + i * 0.37, 0.55, 0.65] })), part(prism(1.7, 0.45, 1.3), '#e2dccd', { p: [0, 1.2, 0] }));
      if (k === 'JOURNAL') return merge([0, 1, 2, 3, 4].map((i) => part(rbox(1.1, 0.22, 0.8, 0.04), ['#8a1538', '#1d3557', '#2f6f3a', '#b8860b', '#5b2a86'][i], { p: [0, 0.11 + i * 0.23, 0], r: [0, i * 0.12, 0] })));
      if (k === 'FORUM') return merge(part(rbox(1.0, 0.7, 0.1, 0.15), '#ff6a3d', { p: [0, 1.3, 0] }), part(rbox(0.9, 0.6, 0.1, 0.15), '#3d7be0', { p: [0.3, 0.6, 0.1] }), part(cyl(0.05, 0.05, 1.0, 8), '#9aa1a9', { p: [-0.2, 0.5, -0.1] }));
      if (k === 'VIDEO') return merge(part(rbox(1.6, 1.0, 0.1, 0.06), INK, { p: [0, 1.1, 0] }), part(box(1.4, 0.8, 0.02), '#e5533d', { p: [0, 1.1, 0.06] }), part(extrude([[-0.15, -0.2], [0.25, 0], [-0.15, 0.2]], 0.02), K.white, { p: [0, 1.1, 0.08] }), part(cyl(0.06, 0.08, 0.6, 8), '#3a3f47', { p: [0, 0.3, 0] }));
      if (k === 'WIKI') return merge(part(ball(0.6), '#e9ecef', { p: [0, 0.9, 0] }), part(torus(0.6, 0.02, TAU, 24), '#9aa1a9', { p: [0, 0.9, 0] }), part(cyl(0.3, 0.4, 0.3, 16), '#c9ced6', { p: [0, 0.15, 0] }));
      return merge(part(rbox(1.4, 1.0, 1.0, 0.04), '#f4efe6', { p: [0, 0.5, 0] }), part(new THREE.SphereGeometry(0.4, 20, 10, 0, TAU, 0, Math.PI / 2), '#9fb7c9', { p: [0, 1.0, 0] }));
    };
    S.forEach(([x, z, k], i) => out.push(place(kindG(k), { p: [x, y0, z], r: [0, Math.PI / 4, 0] }), place(merge(part(cyl(0.26, 0.26, 0.06, 20), K.white, { r: [Math.PI / 2, 0, 0] }), pixText(String(i + 1), 0.06, INK, 0.08)), { p: [x, y0 + 2.6, z], r: [0, Math.PI / 4, 0] })));
    // ---- the answer screen in the middle
    const Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), at = (dx, dy, dz = 0.09) => { const v = new V(dx, dy, dz).applyQuaternion(Q); return [v.x, y0 + dy, v.z]; };
    out.push(part(cyl(0.7, 0.8, 0.3, 32), INK, { p: [0, y0 + 0.15, 0] }), part(rbox(2.6, 3.2, 0.14, 0.14), INK, { p: at(0, 2.0, 0), q: Q }), part(rbox(2.44, 3.04, 0.02, 0.1), '#f6f8f8', { p: at(0, 2.0, 0.08), q: Q }), part(rbox(2.1, 0.4, 0.02, 0.12), '#e1eff0', { p: at(0, 3.15, 0.1), q: Q }));
    out.push(...[0, 1, 2, 3].map((k) => part(box(0.1, 0.8, 0.08), TEAL, { p: at(0, 4.1, 0), q: Q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new V(0, 0, 1), k * Math.PI / 4)) })));
    // The asker at the front with a laptop.
    out.push(place(fan('#d6336c'), { p: [1.6, y0, 1.8], s: 1.5 }), part(rbox(0.6, 0.04, 0.4, 0.02), '#3a3f47', { p: [1.3, y0 + 0.9, 1.5] }), part(cyl(0.05, 0.05, 0.9, 8), '#9aa1a9', { p: [1.3, y0 + 0.45, 1.5] }));
    out.push(trees(R, [[4.6, 4.6], [-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6]], 0.45));
    // ---- moving parts
    const moving = [], P = 10, cited = [1, 3, 5];
    // The question rising into the search bar.
    moving.push({ geo: merge(part(rbox(1.0, 0.36, 0.06, 0.12), TEAL), pixText('?', 0.05, K.white, 0.08)), pivot: [1.3, y0 + 1.1, 1.5], anim: (t) => { const f = cyc(t, P); if (f > 0.15) return { s: 0.001 }; const u = easeOut(win(f, 0, 0.15)), p = new V(1.3, y0 + 1.1, 1.5).lerp(new V(...at(0, 3.15, 0.15)), u); return { x: p.x - 1.3, y: p.y - y0 - 1.1, z: p.z - 1.5, q: Q }; } });
    moving.push({ geo: merge(part(box(1.4, 0.08, 0.02), '#5b6b7d'), pixText('?', 0.04, TEAL, 0.03).translate(0.85, 0, 0)), pivot: at(-0.2, 3.15, 0.12), anim: (t) => { const f = cyc(t, P); return f > 0.13 && f < 0.97 ? { q: Q, sx: Math.min(1, win(f, 0.13, 0.2)) + 0.001 } : { s: 0.001 }; } });
    // Search out to every source; the cited ones glow and send their number back.
    S.forEach(([x, z], i) => { const top = [x, y0 + 2.6, z], o = curve([at(0, 3.3, 0), [x * 0.5, y0 + 4.0, z * 0.5], top]); moving.push(rider(part(new THREE.SphereGeometry(0.08, 8, 6), '#7fd3dc'), o, P, 0, 0.17, 0.32));
      if (cited.includes(i)) { const n = cited.indexOf(i); moving.push({ geo: part(torus(0.36, 0.05, TAU, 24), TEAL), pivot: top, anim: (t) => { const f = cyc(t, P); return f > 0.32 && f < 0.95 ? { ry: Math.PI / 4, s: 1 + Math.sin(t * 6) * 0.06 } : { s: 0.001 }; } });
        moving.push(rider(merge(part(rbox(0.3, 0.3, 0.06, 0.08), TEAL), pixText(String(i + 1), 0.045, K.white, 0.08)), curve([top, [x * 0.5, y0 + 4.2, z * 0.5], at(0.95, 2.55 - n * 0.55, 0.15)]), P, 0, 0.35 + n * 0.08, 0.5 + n * 0.08, () => ({ ry: Math.PI / 4 }))); } });
    // The answer: lines writing themselves, each ending with its citation chip.
    for (let k = 0; k < 3; k++) { const a = 0.48 + k * 0.08; moving.push({ geo: merge(part(box(1.6, 0.08, 0.02), '#5b6b7d', { p: [-0.1, 0.1, 0] }), part(box(1.2, 0.08, 0.02), '#9aa1a9', { p: [-0.3, -0.1, 0] })), pivot: at(-0.15, 2.55 - k * 0.55, 0.1), anim: (t) => { const f = cyc(t, P); return f > a && f < 0.97 ? { q: Q, sx: Math.min(1, win(f, a, a + 0.06)) + 0.001 } : { s: 0.001 }; } });
      moving.push({ geo: merge(part(rbox(0.3, 0.3, 0.04, 0.08), TEAL), pixText(String(cited[k] + 1), 0.045, K.white, 0.06)), pivot: at(0.95, 2.55 - k * 0.55, 0.12), anim: (t) => { const f = cyc(t, P); return f > a + 0.05 && f < 0.97 ? { q: Q } : { s: 0.001 }; } }); }
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Neuralink: thought into action. In the surgical bay the R1 robot threads the implant with a
  // precision no hand can match; the N1 itself floats in the middle, its threads stirring; and
  // the participant in the wheelchair moves the cursor across the big screen just by thinking.
  neuralink: { finder: '#1d1f24', build: () => {
    const R = rand(217), out = [], INK = '#1d1f24', GLOW = '#4fc3f7';
    out.push(ground('#8fc66f'), part(rbox(9.6, 0.08, 9.6, 0.05), '#f2f4f6', { p: [0, y0 + 0.04, 0] }));
    for (let i = 0; i < 8; i++) out.push(part(box(9.4, 0.005, 0.02), '#e2e6ea', { p: [0, y0 + 0.085, -4.2 + i * 1.2] }), part(box(0.02, 0.005, 9.4), '#e2e6ea', { p: [-4.2 + i * 1.2, y0 + 0.085, 0] }));
    out.push(part(rbox(9.6, 2.2, 0.2, 0.03), '#e9ecef', { p: [0, y0 + 1.1, -4.7] }), part(rbox(0.2, 2.2, 9.4, 0.03), '#e2e6ea', { p: [-4.7, y0 + 1.1, 0] }), place(pixText('NEURALINK', 0.09, INK, 0.03), { p: [1.4, y0 + 1.5, -4.58] }));
    // ---- the surgical bay, back left: the bed, the head rest, the R1 gantry
    const BX = -2.8, BZ = -2.6;
    out.push(part(rbox(1.2, 0.8, 2.6, 0.1), K.white, { p: [BX, y0 + 0.48, BZ] }), part(rbox(1.1, 0.14, 2.5, 0.05), '#cfd8de', { p: [BX, y0 + 0.94, BZ] }), part(rbox(0.9, 0.24, 1.5, 0.08), '#9fb7c9', { p: [BX, y0 + 1.12, BZ + 0.4] }), part(ball(0.34), '#e9b98f', { p: [BX, y0 + 1.25, BZ - 0.95] }), part(torus(0.38, 0.06, TAU, 24), '#c9ced6', { p: [BX, y0 + 1.15, BZ - 0.95], r: [Math.PI / 2, 0, 0] }));
    [-1, 1].forEach((s) => out.push(part(rbox(0.22, 3.0, 0.22, 0.05), K.white, { p: [BX + s * 1.0, y0 + 1.55, BZ - 1.7] })));
    out.push(part(rbox(2.4, 0.3, 0.4, 0.06), K.white, { p: [BX, y0 + 3.0, BZ - 1.7] }), part(rbox(0.5, 0.5, 0.5, 0.08), INK, { p: [BX - 0.8, y0 + 2.6, BZ - 1.9] }), part(box(0.3, 0.1, 0.02), GLOW, { p: [BX - 0.8, y0 + 2.65, BZ - 1.64] }));
    // ---- the implant's plinth, middle
    out.push(part(cyl(0.7, 0.8, 0.9, 32), K.white, { p: [0.6, y0 + 0.45, -0.4] }), part(torus(0.72, 0.04, TAU, 32), GLOW, { p: [0.6, y0 + 0.85, -0.4], r: [Math.PI / 2, 0, 0] }));
    // ---- the participant's corner, front right: the big screen and the wheelchair
    const DX = 2.6, DZ = 2.4, DQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), sc = (dx, dy, dz = 0.06) => { const v = new V(dx, dy, dz).applyQuaternion(DQ); return [DX + v.x, y0 + dy, DZ + v.z]; };
    out.push(part(rbox(2.8, 1.7, 0.1, 0.05), INK, { p: sc(0, 1.7, 0), q: DQ }), part(box(2.6, 1.5, 0.01), '#0f2a3a', { p: sc(0, 1.7, 0.06), q: DQ }), beam(sc(0, 0, -0.1), sc(0, 0.85, -0.1), 0.1, '#3a3f47'), part(rbox(1.0, 0.06, 0.6, 0.03), '#3a3f47', { p: sc(0, 0.03, -0.1) }));
    const WX = 3.9, WZ = 3.7;
    out.push(part(torus(0.35, 0.05, TAU, 24), '#3a3f47', { p: [WX - 0.3, y0 + 0.4, WZ + 0.3], r: [0, Math.PI / 4, 0] }), part(torus(0.35, 0.05, TAU, 24), '#3a3f47', { p: [WX + 0.3, y0 + 0.4, WZ - 0.3], r: [0, Math.PI / 4, 0] }), part(rbox(0.6, 0.1, 0.6, 0.03), '#3a3f47', { p: [WX, y0 + 0.55, WZ] }), part(rbox(0.1, 0.6, 0.6, 0.03), '#3a3f47', { p: [WX + 0.25, y0 + 0.85, WZ + 0.25], r: [0, Math.PI / 4, 0] }));
    out.push(part(capsule(0.2, 0.35), '#3d7be0', { p: [WX + 0.05, y0 + 0.95, WZ + 0.05] }), part(capsule(0.08, 0.4), '#2b3a55', { p: [WX - 0.2, y0 + 0.55, WZ - 0.2], r: [0, Math.PI / 4, Math.PI / 2] }), part(ball(0.17), '#e9b98f', { p: [WX, y0 + 1.42, WZ] }), part(ball(0.18), '#3a2a20', { p: [WX + 0.02, y0 + 1.48, WZ + 0.02], s: [1, 0.7, 1] }));
    out.push(trees(R, [[4.6, -4.6], [-4.6, 4.6], [1.2, 4.6]], 0.45));
    // ---- moving parts
    const moving = [], P = 10;
    // The R1 head: along the gantry, down to the head rest, threading, back up.
    moving.push({ geo: merge(part(rbox(0.5, 0.6, 0.5, 0.08), K.white), part(cyl(0.06, 0.02, 0.4, 10), '#9aa1a9', { p: [0, -0.5, 0] }), part(cyl(0.07, 0.07, 0.06, 12), GLOW, { p: [0.26, 0.1, 0], r: [0, 0, Math.PI / 2] })), pivot: [BX, y0 + 2.5, BZ - 1.4], anim: (t) => { const f = cyc(t, P), d = easeIO(win(f, 0.05, 0.25)) - easeIO(win(f, 0.45, 0.6)); return { z: d * 0.45, y: -d * 0.55 + Math.sin(t * 30) * 0.01 * (f > 0.25 && f < 0.45 ? 1 : 0) }; } });
    moving.push({ geo: merge(part(cyl(0.12, 0.12, 0.05, 20), '#c9ced6'), part(cyl(0.07, 0.07, 0.055, 16), INK)), pivot: [BX, y0 + 1.6, BZ - 0.95], anim: (t) => (cyc(t, P) > 0.35 ? { s: 1 } : { s: 0.001 }) });
    // The N1, big, floating over its plinth with its threads stirring.
    const n1 = moving.length;
    moving.push({ geo: merge(part(cyl(0.75, 0.75, 0.25, 48), '#c9ced6'), part(cyl(0.6, 0.6, 0.26, 48), '#e9ecef'), part(cyl(0.3, 0.3, 0.27, 32), INK), part(torus(0.75, 0.04, TAU, 48), GLOW, { r: [Math.PI / 2, 0, 0] })), pivot: [0.6, y0 + 2.2, -0.4], anim: (t) => ({ ry: t * 0.4, y: Math.sin(t * 1.2) * 0.1 }) });
    for (let k = 0; k < 16; k++) { const a = k * TAU / 16, r = 0.25 + (k % 3) * 0.12; moving.push({ geo: part(tube([[0, 0, 0], [0.04, -0.4, 0], [-0.03, -0.8, 0.02], [0.02, -1.1, 0]], 0.012), '#5b616b'), pivot: [Math.cos(a) * r, -0.12, Math.sin(a) * r], parent: n1, anim: (t) => ({ rz: Math.sin(t * 2 + k) * 0.15, rx: Math.cos(t * 1.7 + k) * 0.12 }) }); }
    // Thought to the screen: rings from the participant's head, the cursor gliding to each target.
    for (let k = 0; k < 3; k++) moving.push({ geo: part(torus(0.3, 0.03, TAU, 24), GLOW, { r: [Math.PI / 2, 0, 0] }), pivot: [WX, y0 + 1.7, WZ], anim: (t) => { const u = cyc(t, 1.8, k / 3); return { s: 0.5 + u * 2, y: u * 0.3 }; } });
    const tgt = [[-0.9, 0.45], [0.8, 0.35], [0.6, -0.45], [-0.7, -0.4]];
    tgt.forEach(([x, y], k) => moving.push({ geo: merge(part(new THREE.CircleGeometry(0.16, 20), '#62d35f'), part(new THREE.RingGeometry(0.2, 0.24, 20), '#62d35f')), pivot: sc(x, 1.7 + y, 0.08), anim: (t) => { const i = Math.floor(cyc(t, 6) * 4); return i === k ? { q: DQ, s: 1 + Math.sin(t * 8) * 0.1 } : { s: 0.001 }; } }));
    moving.push({ geo: part(extrude([[0, 0], [0, -0.3], [0.08, -0.22], [0.15, -0.34], [0.2, -0.32], [0.13, -0.2], [0.22, -0.2]], 0.02), K.white), pivot: [0, 0, 0], anim: (t) => { const f = cyc(t, 6) * 4, i = Math.floor(f), u = easeIO(Math.min(1, (f - i) / 0.6)), a = tgt[(i + 3) % 4], b = tgt[i], x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u, p = sc(x, 1.7 + y, 0.09); return { x: p[0], y: p[1], z: p[2], q: DQ }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Scale AI: the data behind the models. Pictures roll down the belt past the labellers, who
  // box every car, sign and person; the labelled data feeds the model, which grows brighter.
  scaleai: { finder: '#6c47ff', build: () => {
    const R = rand(161), out = [], PURP = '#6c47ff';
    out.push(ground('#8fc66f'), part(rbox(8.0, 0.08, 6.4, 0.03), '#eceaf6', { p: [-0.6, y0 + 0.04, -0.8] }));
    // ---- the belt along x, the labellers' desks behind it
    const LZ = 0.2;
    out.push(part(rbox(7.4, 0.5, 1.0, 0.05), '#5b616b', { p: [-0.9, y0 + 0.25, LZ] }), part(box(7.3, 0.03, 0.9), '#2b2f36', { p: [-0.9, y0 + 0.52, LZ] }));
    [-3.6, -1.8, 0.0].forEach((x, i) => out.push(place(desk(K.white, '#2b2f36'), { p: [x, y0, LZ - 1.4] }), place(fan(['#3d7be0', '#e5533d', '#2f9e6e'][i]), { p: [x, y0, LZ - 2.0], s: 1.3 })));
    out.push(part(rbox(8.0, 2.4, 0.2, 0.03), '#e6e2f6', { p: [-0.6, y0 + 1.2, -4.0] }), place(pixText('SCALE', 0.1, PURP, 0.03), { p: [-2.6, y0 + 1.6, -3.88] }));
    // ---- the model: a glowing core on a plinth at the end of the line, front right
    const MX = 3.4, MZ = 2.4;
    out.push(part(cyl(0.9, 1.0, 0.5, 32), '#2b2f36', { p: [MX, y0 + 0.25, MZ] }), part(torus(0.95, 0.06, TAU, 40), PURP, { p: [MX, y0 + 0.5, MZ], r: [Math.PI / 2, 0, 0] }));
    out.push(trees(R, [[-4.6, 4.6], [-1.6, 4.6], [4.6, -1.6], [4.6, -4.6]], 0.55));
    // ---- moving parts
    const moving = [], T = 2.0;
    // Picture tiles stepping along the belt: plain until they pass a desk, then boxed.
    const pic = (k) => merge(part(rbox(0.8, 0.04, 0.6, 0.02), K.white), part(box(0.7, 0.045, 0.5), ['#9fd0ff', '#bfe6b0', '#ffe0a8'][k % 3]), k % 3 === 0 ? part(rbox(0.3, 0.06, 0.16, 0.03), '#e5533d', { p: [0.05, 0, 0.05] }) : k % 3 === 1 ? part(cyl(0.1, 0.1, 0.06, 8), '#e5533d', { p: [0, 0, 0] }) : part(capsule(0.06, 0.12), '#3d7be0', { p: [0, 0.02, 0], r: [Math.PI / 2, 0, 0] }));
    const frameG = merge([[0, 0.12, 0.42, 0.03], [0, -0.12, 0.42, 0.03], [0.2, 0, 0.03, 0.27], [-0.2, 0, 0.03, 0.27]].map(([x, z, w, d]) => part(box(w, 0.06, d), '#62d35f', { p: [x, 0.04, z] })));
    for (let k = 0; k < 6; k++) {
      const st = (t) => { const s = t / T + k, n = ((Math.floor(s) % 6) + 6) % 6, u = s - Math.floor(s); return { n, u, x: -4.2 + 1.3 * (n + easeIO(clamp01(u / 0.4))) }; };
      const it = moving.length;
      moving.push({ geo: pic(k), pivot: [0, y0 + 0.56, LZ], anim: (t) => { const s = st(t); return { x: s.x, s: s.n === 5 ? Math.max(0.001, 1 - win(s.u, 0, 0.4)) : s.n === 0 ? Math.min(1, win(s.u, 0.4, 0.7)) + 0.001 : 1 }; } });
      moving.push({ geo: frameG, pivot: [0, 0, 0], parent: it, anim: (t) => { const s = st(t); return s.n >= 2 ? {} : { s: 0.001 }; } });
    }
    // Labelled data hopping into the model; the core brightens and grows with it.
    const toModel = curve([[3.0, y0 + 0.7, LZ], [3.6, y0 + 2.0, 1.2], [MX, y0 + 1.4, MZ]]);
    moving.push(rider(part(new THREE.BoxGeometry(0.2, 0.2, 0.2), PURP), toModel, T, 0.45, 0, 0.6, (t) => ({ rx: t * 3, ry: t * 2 })));
    moving.push({ geo: part(new THREE.IcosahedronGeometry(0.7, hi() ? 2 : 1), (x, y, z) => (Math.floor((x + y + z) * 6) % 2 ? '#a58bff' : PURP)), pivot: [MX, y0 + 1.4, MZ], anim: (t) => { const f = cyc(t, T * 6); return { ry: t * 0.6, rx: t * 0.3, s: 0.7 + f * 0.45 + bump(cyc(t, T), 0.75, 0.05) * 0.06 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Hugging Face: where the AI community shares its models. Builders upload model boxes onto the
  // Hub's shelves around the smiling face; others take them down and build on them.
  huggingface: { finder: '#ffd21e', build: () => {
    const R = rand(162), out = [], YEL = '#ffd21e', OR = '#ff9d00';
    out.push(ground('#8fc66f'), part(cyl(2.6, 2.6, 0.06, 56), '#fff3c4', { p: [0, y0 + 0.03, 0] }));
    // ---- the shelves of the Hub in an arc at the back
    const shelf = (a) => { const x = Math.cos(a) * 3.8, z = Math.sin(a) * 3.8; out.push(part(rbox(1.6, 2.2, 0.5, 0.04), '#e6dcc6', { p: [x, y0 + 1.1, z], r: [0, -a - Math.PI / 2, 0] })); for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { const v = new V(-0.5 + k * 0.5, 0.45 + r * 0.65, 0.05).applyAxisAngle(new V(0, 1, 0), -a - Math.PI / 2); out.push(part(rbox(0.36, 0.36, 0.36, 0.06), ['#ff9d00', '#3d7be0', '#e5533d', '#2f9e6e', '#8a6cf0', '#3fb8a8'][(r * 3 + k + Math.round(a * 3)) % 6], { p: [x + v.x, y0 + v.y, z + v.z] })); } };
    [-2.3, -1.85, -1.4, -0.95, -2.75].forEach(shelf);
    // ---- the face: a big yellow sphere with eyes, a smile and two hugging hands
    const FX = 0, FZ = 0, FR = 1.2, FQ = Math.PI / 4;
    out.push(part(cyl(0.6, 0.7, 0.3, 32), '#e6dcc6', { p: [FX, y0 + 0.15, FZ] }));
    const face = merge(part(ball(FR), YEL), [-1, 1].map((s) => part(new THREE.SphereGeometry(0.14, 14, 10), '#3a2a20', { p: [s * 0.38, 0.3, FR * 0.9], s: [1, 1.2, 0.5] })), [-1, 1].map((s) => part(new THREE.SphereGeometry(0.16, 14, 10), '#ffb3a7', { p: [s * 0.7, 0.0, FR * 0.75], s: [1, 0.8, 0.5] })), part(new THREE.TorusGeometry(0.4, 0.07, 10, 24, Math.PI), '#3a2a20', { p: [0, -0.1, FR * 0.92], r: [0, 0, Math.PI] }), part(new THREE.SphereGeometry(0.2, 12, 8), '#e5533d', { p: [0, -0.4, FR * 0.9], s: [1, 0.6, 0.5] }));
    out.push(place(face, { p: [FX, y0 + 1.6, FZ], r: [0, FQ, 0] }));
    // ---- the community: builders at laptops round the front
    const users = [[-2.4, 2.8], [0.2, 3.8], [2.8, 2.6], [3.8, -0.4], [-3.6, 0.6]];
    users.forEach(([x, z], i) => out.push(place(fan(['#3d7be0', '#e5533d', '#2f9e6e', '#8a6cf0', '#d6336c'][i]), { p: [x, y0, z], s: 1.4 }), part(rbox(0.5, 0.04, 0.35, 0.02), '#3a3f47', { p: [x - Math.sign(x || 1) * 0.0, y0 + 0.7, z - 0.4] }), part(cyl(0.04, 0.04, 0.7, 6), '#9aa1a9', { p: [x, y0 + 0.35, z - 0.4] })));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, -4.6]], 0.5));
    // ---- moving parts
    const moving = [], P = 8;
    // The hands waving a hug.
    [-1, 1].forEach((s) => moving.push({ geo: part(new THREE.SphereGeometry(0.35, 14, 10), OR, { s: [1, 0.8, 0.6] }), pivot: [FX + Math.cos(FQ) * s * 0.9 + 0.25, y0 + 0.9, FZ - Math.sin(FQ) * s * 0.9 + 0.25], anim: (t) => ({ ry: FQ, rz: s * Math.sin(t * 2) * 0.2, y: Math.abs(Math.sin(t * 2)) * 0.1 }) }));
    // Models uploaded to a shelf, and downloaded to someone else.
    const box2 = (c) => merge(part(rbox(0.36, 0.36, 0.36, 0.06), c), part(box(0.38, 0.06, 0.1), K.white, { p: [0, 0.12, 0] }));
    users.forEach(([x, z], i) => { const a = [-2.3, -1.85, -1.4, -0.95, -2.75][i], sx = Math.cos(a) * 3.6, sz = Math.sin(a) * 3.6, up = curve([[x, y0 + 1.0, z - 0.4], [(x + sx) / 2, y0 + 3.2, (z + sz) / 2], [sx, y0 + 1.6, sz]]), [x2, z2] = users[(i + 2) % 5], down = curve([[sx, y0 + 1.6, sz], [(x2 + sx) / 2, y0 + 3.6, (z2 + sz) / 2], [x2, y0 + 1.0, z2 - 0.4]]); const c = ['#ff9d00', '#3d7be0', '#e5533d', '#2f9e6e', '#8a6cf0'][i];
      moving.push(rider(box2(c), up, P, i / 5, 0, 0.4, (t) => ({ ry: t * 2 }))); moving.push(rider(box2(c), down, P, i / 5, 0.5, 0.9, (t) => ({ ry: t * 2 }))); });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Runway: a film from a sentence. The director types the prompt, and on the stage the world it
  // describes builds itself: mountains rise, the river runs, pines and a cabin appear and the sun
  // comes up, while the camera dollies round it and the big screen shows the shot.
  runway: { finder: '#111111', build: () => {
    const R = rand(216), out = [], INK = '#111111';
    out.push(ground('#8fc66f'), part(rbox(9.8, 0.08, 9.8, 0.06), '#2b2f36', { p: [0, y0 + 0.04, 0] }));
    // ---- the big screen, back left, facing the camera
    const SQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), at = (dx, dy, dz = 0) => { const v = new V(dx, dy, dz).applyQuaternion(SQ); return [-2.6 + v.x, y0 + dy, -2.6 + v.z]; };
    out.push(part(rbox(4.4, 2.7, 0.15, 0.05), INK, { p: at(0, 2.9), q: SQ }), beam(at(-1.5, 0), at(-1.5, 1.6), 0.14, INK), beam(at(1.5, 0), at(1.5, 1.6), 0.14, INK));
    // ---- the stage: a round platform, centre right
    const SX = 1.4, SZ = 0.8;
    out.push(part(cyl(2.0, 2.1, 0.3, 48), '#3a3f47', { p: [SX, y0 + 0.15, SZ] }), part(cyl(1.85, 1.85, 0.04, 48), '#7fbf5a', { p: [SX, y0 + 0.31, SZ] }));
    // The dolly track round it.
    out.push(part(torus(2.6, 0.04, TAU, 64), '#9aa1a9', { p: [SX, y0 + 0.1, SZ], r: [Math.PI / 2, 0, 0] }), part(torus(2.8, 0.04, TAU, 64), '#9aa1a9', { p: [SX, y0 + 0.1, SZ], r: [Math.PI / 2, 0, 0] }));
    // ---- the director's desk with the laptop, front left
    out.push(place(desk(K.white, INK), { p: [-3.0, y0 + 0.08, 2.6], r: [0, Math.PI / 4, 0] }), place(fan('#e5533d'), { p: [-2.6, y0 + 0.08, 3.0], s: 1.4 }));
    // Studio lights on stands and a clapperboard.
    [[4.0, -1.6], [-0.6, 3.9], [4.0, 3.4]].forEach(([x, z]) => { const a = Math.atan2(SZ - z, SX - x); out.push([[0.3, 0], [-0.15, 0.26], [-0.15, -0.26]].map(([dx, dz]) => beam([x + dx, y0, z + dz], [x, y0 + 2.0, z], 0.04, '#3a3f47')), part(cyl(0.3, 0.22, 0.45, 16), '#2b2f36', { p: [x + Math.cos(a) * 0.15, y0 + 2.15, z + Math.sin(a) * 0.15], r: [0, -a, Math.PI / 2 + 0.4] }), part(cyl(0.27, 0.27, 0.02, 16), '#fff2b0', { p: [x + Math.cos(a) * 0.38, y0 + 2.05, z + Math.sin(a) * 0.38], r: [0, -a, Math.PI / 2 + 0.4] })); });
    out.push(part(rbox(0.7, 0.5, 0.05, 0.02), INK, { p: [-1.4, y0 + 0.35, 3.6], r: [0, Math.PI / 4, 0] }), part(box(0.72, 0.12, 0.06), (x) => (Math.floor(x * 10) % 2 ? K.white : INK), { p: [-1.4, y0 + 0.66, 3.6], r: [0, Math.PI / 4, 0.15] }));
    out.push(trees(R, [[4.7, -4.7], [-4.7, 4.7], [4.7, 4.7]], 0.5));
    // ---- moving parts
    const moving = [], P = 12, t0 = (f, a, b) => win(f, a, b);
    // The prompt: a card rising off the laptop with the words of the shot.
    moving.push({ geo: merge(part(rbox(2.9, 0.5, 0.06, 0.12), K.white), pixText('A CABIN BY A RIVER', 0.035, INK, 0.08)), pivot: [-2.6, y0 + 1.4, 2.2], anim: (t) => { const f = cyc(t, P); return f < 0.85 ? { ry: Math.PI / 4, y: easeOut(t0(f, 0, 0.12)) * 1.4, s: Math.min(1, f / 0.04) + 0.001 } : { s: 0.001 }; } });
    // The world on the stage, element by element.
    const grow = (a, b) => (t) => { const f = cyc(t, P); return f < a || f > 0.94 ? { s: 0.001 } : { s: back(win(f, a, b)) }; };
    const mtn = (r, h, c) => merge(part(cone(r, h, 20), c), part(cone(r * 0.4, h * 0.4, 20), K.white, { p: [0, h * 0.3, 0] }));
    [[-0.7, -0.9, 1.0, 2.2, '#6b7a8f'], [0.6, -1.1, 0.8, 1.6, '#7b8aa0'], [-1.3, 0.0, 0.6, 1.2, '#8a98ab']].forEach(([x, z, r, h, c], k) => moving.push({ geo: mtn(r, h, c), pivot: [SX + x, y0 + 0.33 + h / 2, SZ + z], anim: (t) => { const f = cyc(t, P); return f < 0.12 + k * 0.03 || f > 0.94 ? { s: 0.001 } : { sy: easeOut(win(f, 0.12 + k * 0.03, 0.24 + k * 0.03)) + 0.001 }; } }));
    moving.push({ geo: part(tubeOn(curve([[-1.6, 0, 0.6], [-0.5, 0, 0.2], [0.4, 0, 0.8], [1.6, 0, 0.5]]), 0.18, hi() ? 40 : 10), 'W', { s: [1, 0.15, 1] }), pivot: [SX, y0 + 0.34, SZ], anim: (t) => { const f = cyc(t, P); return f < 0.3 || f > 0.94 ? { s: 0.001 } : { sx: easeOut(win(f, 0.3, 0.4)) + 0.001 }; } });
    [[0.9, -0.2], [1.2, 0.3], [-0.4, 1.1], [0.2, 1.3], [-1.0, 0.9]].forEach(([x, z], k) => moving.push({ geo: merge(part(cyl(0.04, 0.05, 0.25, 6), '#6f4a2c', { p: [0, 0.12, 0] }), part(cone(0.22, 0.6, 8), '#2f6f3a', { p: [0, 0.5, 0] })), pivot: [SX + x, y0 + 0.33, SZ + z], anim: grow(0.42 + k * 0.025, 0.47 + k * 0.025) }));
    moving.push({ geo: merge(part(rbox(0.6, 0.4, 0.5, 0.04), '#8a5a36', { p: [0, 0.2, 0] }), part(prism(0.75, 0.35, 0.6), '#5b3a2a', { p: [0, 0.4, 0] }), part(box(0.15, 0.25, 0.02), '#ffd479', { p: [0.1, 0.15, 0.26] })), pivot: [SX + 0.1, y0 + 0.33, SZ + 0.5], anim: grow(0.58, 0.64) });
    moving.push({ geo: part(new THREE.SphereGeometry(0.35, 20, 14), '#ffcf3f'), pivot: [SX - 0.3, y0 + 0.4, SZ - 1.5], anim: (t) => { const f = cyc(t, P); return f < 0.62 || f > 0.94 ? { s: 0.001 } : { y: easeOut(win(f, 0.62, 0.8)) * 2.4 }; } });
    // The camera on its dolly, circling the stage, its light blinking while it rolls.
    const cam = moving.length;
    moving.push({ geo: merge(part(rbox(0.6, 0.12, 0.6, 0.04), '#5b616b', { p: [0, 0.08, 0] }), part(cyl(0.05, 0.05, 1.0, 8), '#3a3f47', { p: [0, 0.6, 0] }), part(rbox(0.6, 0.4, 0.35, 0.05), INK, { p: [0, 1.25, 0] }), part(cyl(0.14, 0.16, 0.35, 14), '#3a3f47', { p: [-0.45, 1.25, 0], r: [0, 0, Math.PI / 2] })), pivot: [SX, y0 + 0.1, SZ], anim: (t) => { const a = cyc(t, P) * TAU * 0.6 + 0.3; return { x: Math.cos(a) * 2.7, z: Math.sin(a) * 2.7, ry: -a }; } });
    moving.push({ geo: part(new THREE.SphereGeometry(0.06, 8, 6), '#ff3b30'), pivot: [0.2, 1.5, 0.15], parent: cam, anim: (t) => ({ s: Math.sin(t * 8) > 0 ? 1 : 0.3 }) });
    // The screen: blank, then the shot appearing when the world is built.
    const shot = merge(part(box(4.1, 2.4, 0.02), '#f6b26b'), part(box(4.1, 0.9, 0.025), '#f9d29d', { p: [0, 0.75, 0] }), part(extrude([[-2.05, -0.3], [-1.0, 0.7], [-0.2, -0.1], [0.6, 0.5], [2.05, -0.3], [2.05, -1.2], [-2.05, -1.2]], 0.02), '#6b7a8f', { p: [0, 0, 0.01] }), part(box(4.1, 0.3, 0.03), '#4fb3c9', { p: [0, -0.85, 0] }), part(new THREE.CircleGeometry(0.3, 20), '#ffcf3f', { p: [1.2, 0.65, 0.03] }), part(box(0.5, 0.35, 0.03), '#8a5a36', { p: [-0.3, -0.5, 0.03] }));
    out.push(shot.clone().applyQuaternion(SQ).translate(...at(0, 2.9, 0.08)));
    moving.push({ geo: part(box(4.1, 2.4, 0.02), K.white), pivot: at(0, 2.9, 0.11), anim: (t) => { const f = cyc(t, P), u = win(f, 0.66, 0.78); return u > 0 && u < 1 ? { q: SQ, sx: 1 - u + 0.001, x: 0 } : { s: 0.001 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Discord: where communities hang out. Round the big controller face float the servers, each
  // full of friends; voices light up green as people talk, messages pop up, and a newcomer hops
  // from one server to the next.
  discord: { finder: '#5865f2', build: () => {
    const R = rand(164), out = [], BLURP = '#5865f2';
    out.push(ground('#8fc66f'), part(cyl(2.0, 2.0, 0.05, 48), '#e3e5fb', { p: [-0.4, y0 + 0.025, -0.4] }));
    // ---- the controller face in the middle, standing on its plinth
    const FQ = Math.PI / 4;
    const faceSh = new THREE.Shape(); faceSh.moveTo(-1.2, -0.5); faceSh.quadraticCurveTo(-1.5, 0.6, -0.9, 0.95); faceSh.quadraticCurveTo(-0.6, 0.85, -0.4, 0.7); faceSh.lineTo(0.4, 0.7); faceSh.quadraticCurveTo(0.6, 0.85, 0.9, 0.95); faceSh.quadraticCurveTo(1.5, 0.6, 1.2, -0.5); faceSh.quadraticCurveTo(0.9, -0.8, 0.6, -0.7); faceSh.lineTo(0.45, -0.5); faceSh.lineTo(-0.45, -0.5); faceSh.lineTo(-0.6, -0.7); faceSh.quadraticCurveTo(-0.9, -0.8, -1.2, -0.5);
    const faceG = merge(part(new THREE.ExtrudeGeometry(faceSh, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: hi() ? 3 : 1, curveSegments: hi() ? 12 : 4 }).translate(0, 0, -0.17), BLURP), [-1, 1].map((s) => part(new THREE.SphereGeometry(0.2, 16, 10), K.white, { p: [s * 0.45, 0.1, 0.25], s: [1, 1.15, 0.4] })));
    out.push(part(cyl(0.6, 0.7, 0.4, 32), '#3a3f9a', { p: [-0.4, y0 + 0.2, -0.4] }), part(cyl(0.12, 0.12, 0.6, 12), '#c9ced6', { p: [-0.4, y0 + 0.7, -0.4] }));
    // ---- the servers: round platforms in their own colours, with members
    const servers = [[-3.2, -3.0, '#f29a3a'], [2.4, -3.2, '#2f9e6e'], [3.4, 1.2, '#e5533d'], [1.0, 3.6, '#8a6cf0'], [-3.4, 2.4, '#3fb8a8']];
    servers.forEach(([x, z, c]) => { out.push(part(cyl(1.15, 1.25, 0.3, 32), c, { p: [x, y0 + 0.15, z] }), part(cyl(1.0, 1.0, 0.04, 32), shade(c, 1.25), { p: [x, y0 + 0.32, z] }), part(cyl(0.08, 0.08, 0.04, 12), K.white, { p: [x, y0 + 0.35, z] })); for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.4; out.push(place(fan(['#3d7be0', '#d6336c', '#f2c94c', '#1d1f24'][k], ['#e9b98f', '#8d5a3b', '#c58c66', '#f1c9a5'][k]), { p: [x + Math.cos(a) * 0.6, y0 + 0.32, z + Math.sin(a) * 0.6], s: 1.1 })); } });
    out.push(trees(R, [[4.6, 4.6], [-4.6, -0.4], [0.0, -4.6], [4.6, -1.4], [-1.4, 4.6]], 0.5));
    // ---- moving parts
    const moving = [];
    moving.push({ geo: faceG, pivot: [-0.4, y0 + 1.9, -0.4], anim: (t) => ({ ry: FQ + Math.sin(t * 0.8) * 0.3, y: Math.sin(t * 1.6) * 0.08 }) });
    // Speaking rings under whoever is talking, and message bubbles rising.
    servers.forEach(([x, z], i) => { for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.4; moving.push({ geo: part(torus(0.22, 0.03, TAU, 20), '#3ba55c', { r: [Math.PI / 2, 0, 0] }), pivot: [x + Math.cos(a) * 0.6, y0 + 0.36, z + Math.sin(a) * 0.6], anim: (t) => (Math.floor(t * 0.8 + i * 1.7) % 4 === k ? { s: 1 + Math.sin(t * 10) * 0.08 } : { s: 0.001 }) }); }
      moving.push({ geo: merge(part(rbox(0.6, 0.36, 0.06, 0.12), K.white), [0, 1, 2].map((j) => part(new THREE.SphereGeometry(0.04, 8, 6), '#9aa1a9', { p: [-0.15 + j * 0.15, 0, 0.04] }))), pivot: [x, y0 + 1.4, z], anim: (t) => { const u = cyc(t, 3, i / 5); return { ry: FQ, y: u * 1.0, s: Math.sin(u * Math.PI) + 0.001 }; } }); });
    // A newcomer hopping between servers.
    moving.push({ geo: merge(fan(BLURP), part(torus(0.2, 0.03, TAU, 16), '#3ba55c', { p: [0, 0.02, 0], r: [Math.PI / 2, 0, 0] })), pivot: [0, y0 + 0.32, 0], anim: (t) => { const f = cyc(t, 10) * 5, i = Math.floor(f), u = f - i, a = servers[i], b = servers[(i + 1) % 5], m = easeIO(clamp01((u - 0.5) / 0.5)); return { x: a[0] + (b[0] - a[0]) * m, z: a[1] + (b[1] - a[1]) * m, y: hop(m) * 2.0, s: 1.1 }; } });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Plaid: the plumbing between apps and banks. The apps on one side, the banks on the other,
  // and through the checkered Plaid block in the middle every connection runs: a request goes
  // in, the bank answers, the app gets its tick.
  plaid: { finder: '#111111', build: () => {
    const R = rand(165), out = [], INK = '#111111';
    out.push(ground('#8fc66f'));
    // ---- the Plaid block: a cube of black and white checks
    const CX = 0.0, CZ = 0.0;
    out.push(part(cyl(0.9, 1.0, 0.4, 32), '#3a3f47', { p: [CX, y0 + 0.2, CZ] }));
    const n = 4, c = 0.42;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) if (i === 0 || j === 0 || k === 0 || i === n - 1 || j === n - 1 || k === n - 1) out.push(part(new THREE.BoxGeometry(c * 0.96, c * 0.96, c * 0.96), (i + j + k) % 2 ? INK : K.white, { p: [CX - (n - 1) * c / 2 + i * c, y0 + 0.45 + c / 2 + j * c, CZ - (n - 1) * c / 2 + k * c] }));
    // ---- the apps on the right and front: phones with coloured app tiles
    const apps = [[3.8, -1.6, '#3d95ce'], [3.8, 1.2, '#2f9e6e'], [2.4, 3.6, '#8a6cf0'], [-0.6, 3.9, '#f29a3a']];
    apps.forEach(([x, z, col]) => out.push(part(rbox(0.8, 1.5, 0.1, 0.12), INK, { p: [x, y0 + 0.95, z], r: [0, Math.PI / 4, 0] }), part(rbox(0.68, 1.3, 0.02, 0.08), col, { p: [x + 0.04, y0 + 0.95, z + 0.04], r: [0, Math.PI / 4, 0] }), part(rbox(0.4, 0.12, 0.3, 0.03), '#c9ced6', { p: [x, y0 + 0.06, z] })));
    // ---- the banks on the left and back: small columned branches
    const banks = [[-3.6, -3.4], [-0.6, -3.9], [2.4, -3.8], [-3.9, 0.4]];
    const bank = () => merge(part(rbox(1.4, 0.9, 1.0, 0.04), '#efe9dc', { p: [0, 0.55, 0] }), part(rbox(1.5, 0.1, 1.1, 0.03), '#e2dccd', { p: [0, 0.05, 0] }), [0, 1, 2, 3].map((i) => part(cyl(0.05, 0.06, 0.8, 10), K.white, { p: [-0.45 + i * 0.3, 0.5, 0.58] })), part(prism(1.5, 0.4, 1.15), '#e2dccd', { p: [0, 1.0, 0] }));
    banks.forEach(([x, z], i) => out.push(place(bank(), { p: [x, y0, z], r: [0, i === 3 ? Math.PI / 2 : 0, 0] })));
    // ---- the pipes: from every app and every bank into the block
    const hub = [CX, y0 + 1.3, CZ], pipesA = apps.map(([x, z]) => curve([[x, y0 + 0.4, z], [(x + CX) / 2, y0 + 0.4, (z + CZ) / 2], hub])), pipesB = banks.map(([x, z]) => curve([hub, [(x + CX) / 2, y0 + 0.4, (z + CZ) / 2], [x, y0 + 0.4, z]]));
    [...pipesA, ...pipesB].forEach((p) => out.push(part(tubeOn(p, 0.07, hi() ? 40 : 10), '#9aa1a9')));
    out.push(trees(R, [[4.6, 4.6], [-4.6, 4.6], [4.6, -4.6], [-2.4, 2.4]], 0.5));
    // ---- moving parts
    const moving = [], P = 6;
    apps.forEach(([x, z], i) => { const bp = pipesB[i], off = i / 4;
      moving.push(rider(part(new THREE.SphereGeometry(0.12, 10, 7), apps[i][2]), pipesA[i], P, off, 0, 0.3));
      moving.push(rider(part(new THREE.SphereGeometry(0.12, 10, 7), apps[i][2]), bp, P, off, 0.3, 0.55));
      moving.push(rider(part(new THREE.BoxGeometry(0.2, 0.2, 0.2), '#62d35f'), curve(bp.points.slice().reverse().map((p) => p.toArray())), P, off, 0.55, 0.75));
      moving.push(rider(part(new THREE.BoxGeometry(0.2, 0.2, 0.2), '#62d35f'), curve(pipesA[i].points.slice().reverse().map((p) => p.toArray())), P, off, 0.75, 0.92));
      moving.push({ geo: tickGeo(0.25), pivot: [x, y0 + 2.0, z], anim: (t) => { const f = cyc(t, P, off); return f > 0.92 || f < 0.05 ? { ry: Math.PI / 4, s: 1 } : { s: 0.001 }; } }); });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Ramp: the corporate card that spends less. Every purchase leaves the giant card for a
  // supplier round the board: flights, the cloud, the café, office supplies go through with a
  // tick and their receipts file themselves in the books; the luxury watch hits the card's rule,
  // the barrier drops, and that money goes to savings instead.
  ramp: { finder: '#e4f222', build: () => {
    const R = rand(215), out = [], LIME = '#e4f222', INK = '#1d1f24';
    out.push(ground('#8fc66f'), part(cyl(2.3, 2.3, 0.05, 56), '#eceee8', { p: [0, y0 + 0.025, 0] }));
    // ---- the card, big, on its stand in the middle
    out.push(part(cyl(0.8, 0.95, 0.4, 32), INK, { p: [0, y0 + 0.2, 0] }), part(cyl(0.14, 0.14, 0.7, 12), '#c9ced6', { p: [0, y0 + 0.75, 0] }));
    const card = merge(part(rbox(3.0, 1.9, 0.1, 0.18), INK), part(rbox(0.5, 0.38, 0.11, 0.05), K.gold, { p: [-0.9, 0.25, 0] }), part(extrude([[0, 0], [0.7, 0], [0.35, 0.55]], 0.12), LIME, { p: [0.8, 0.3, 0] }), pixText('RAMP', 0.08, LIME, 0.12).translate(-0.5, -0.5, 0), part(box(3.0, 0.08, 0.11), '#3a3f47', { p: [0, -0.15, 0] }));
    out.push(place(card, { p: [0, y0 + 2.1, 0], r: [-0.25, Math.PI / 4, 0, 'YXZ'] }));
    // ---- the suppliers round the edge, each with its sign
    const sup = [[-3.7, -0.4, 'FLIGHTS', '#3d7be0'], [-2.0, -3.7, 'CLOUD', '#8a6cf0'], [1.6, -3.8, 'CAFE', '#8a5a36'], [3.8, -0.2, 'SUPPLIES', '#e5533d'], [2.0, 3.6, 'WATCHES', '#b8860b']];
    const shopG = (name, c) => merge(part(rbox(1.7, 1.3, 1.4, 0.05), '#f4efe6', { p: [0, 0.65, 0] }), part(box(1.74, 0.36, 1.44), c, { p: [0, 1.2, 0] }), pixText(name, 0.045, K.white, 0.03).translate(0, 1.2, 0.73), part(box(1.1, 0.6, 0.03), '#9cc3e0', { p: [0, 0.5, 0.71] }));
    sup.forEach(([x, z, name, c]) => out.push(place(shopG(name, c), { p: [x, y0, z], r: [0, Math.PI / 4, 0] })));
    // Shop dressing: a little jet by FLIGHTS, a cloud over CLOUD, cups at the CAFE, boxes at SUPPLIES, a giant watch at WATCHES.
    out.push(place(jet('#3d7be0'), { p: [-3.4, y0, 1.6], r: [0, Math.PI / 4, 0], s: 0.5 }));
    [[-2.2, 2.5, -3.7, 0.4], [-1.7, 2.7, -3.6, 0.35], [-2.5, 2.6, -3.5, 0.3]].forEach(([x, y, z, r]) => out.push(part(new THREE.SphereGeometry(r, 14, 10), K.white, { p: [x, y0 + y, z] })));
    out.push(part(cyl(0.18, 0.14, 0.4, 16), K.white, { p: [2.6, y0 + 0.2, -3.0] }), part(cyl(0.18, 0.14, 0.4, 16), K.white, { p: [2.9, y0 + 0.2, -2.7] }));
    out.push(...[0, 1, 2].map((k) => place(parcel(0.4), { p: [3.4 + k * 0.1, y0 + 0.18 + k * 0.36, 1.2] })));
    out.push(part(torus(0.5, 0.1, TAU, 32), K.gold, { p: [3.4, y0 + 2.0, 3.8], r: [0, Math.PI / 4, 0] }), part(cyl(0.42, 0.42, 0.06, 32), K.white, { p: [3.4, y0 + 2.0, 3.8], r: [Math.PI / 2, 0, Math.PI / 4] }), part(box(0.3, 1.6, 0.2), '#5b3a2a', { p: [3.4, y0 + 1.0, 3.8] }));
    // ---- the books (back left) and the savings jar (front left)
    const BX = -4.1, BZ = -3.9;
    out.push(part(rbox(1.4, 0.15, 1.0, 0.04), '#3a3f47', { p: [BX, y0 + 0.08, BZ] }), part(rbox(1.3, 0.12, 0.95, 0.04), '#2f6f3a', { p: [BX, y0 + 0.22, BZ] }));
    const JX = -3.2, JZ = 3.4;
    out.push(part(new THREE.CylinderGeometry(0.85, 0.8, 2.0, hi() ? 32 : 12, 1, true), '#d6eef8', { p: [JX, y0 + 1.0, JZ] }), part(cyl(0.8, 0.8, 0.05, 24), '#d6eef8', { p: [JX, y0 + 0.02, JZ] }), part(cyl(0.7, 0.7, 0.22, 24), LIME, { p: [JX, y0 + 2.1, JZ] }), place(pixText('SAVED', 0.05, INK, 0.03), { p: [JX + 0.6, y0 + 1.3, JZ + 0.6], r: [0, Math.PI / 4, 0] }));
    out.push(trees(R, [[-0.4, 4.6], [4.6, -4.4], [-4.6, 1.8], [0.2, -4.6]], 0.5));
    // ---- moving parts
    const moving = [], P = 15, n = sup.length, C = [0, y0 + 2.1, 0];
    sup.forEach(([x, z], i) => {
      const a = i / n, ok = i !== 4, to = curve([C, [x * 0.5, y0 + 3.2, z * 0.5], [x, y0 + 1.9, z]]);
      moving.push(rider(merge(part(rbox(0.6, 0.38, 0.05, 0.08), INK), part(box(0.6, 0.06, 0.06), LIME)), to, P, -a, 0.0, 0.08, () => ({ ry: Math.PI / 4 })));
      moving.push({ geo: ok ? tickGeo(0.4) : crossGeo(0.4), pivot: [x, y0 + 2.5, z], anim: (t) => { const f = cyc(t, P, -a); return f > 0.08 && f < 0.2 ? { ry: Math.PI / 4, s: back(win(f, 0.08, 0.12)) } : { s: 0.001 }; } });
      if (ok) moving.push(rider(merge(part(box(0.4, 0.55, 0.02), K.white), [0, 1, 2].map((k) => part(box(0.28, 0.03, 0.025), '#9aa1a9', { p: [0, 0.12 - k * 0.1, 0] }))), curve([[x, y0 + 2.1, z], [(x + BX) / 2, y0 + 3.4, (z + BZ) / 2], [BX, y0 + 0.5, BZ]]), P, -a, 0.12, 0.2, (t, u) => ({ rz: u * 4 })));
      else { moving.push(rider(place(coin(0.25, 0.08), { r: [Math.PI / 2, 0, 0] }), curve([[x, y0 + 2.1, z], [(x + JX) / 2, y0 + 3.2, (z + JZ) / 2], [JX, y0 + 1.8, JZ]]), P, -a, 0.12, 0.2, (t) => ({ ry: t * 5 })));
        moving.push({ geo: merge(part(box(1.6, 0.1, 0.1), '#e5533d'), part(box(0.3, 0.12, 0.12), K.white, { p: [0.4, 0, 0] })), pivot: [x - 0.9, y0 + 0.9, z + 1.0], anim: (t) => { const f = cyc(t, P, -a); return { rz: -(Math.PI / 2) * (1 - (easeIO(win(f, 0.06, 0.1)) - easeIO(win(f, 0.25, 0.3)))) }; } }); }
    });
    // The books growing thicker, the jar filling.
    moving.push({ geo: part(rbox(1.2, 0.6, 0.9, 0.03), K.white, { p: [0, 0.3, 0] }), pivot: [BX, y0 + 0.28, BZ], anim: (t) => ({ sy: 0.1 + 0.9 * cyc(t, P * 3) }) });
    moving.push({ geo: part(cyl(0.78, 0.78, 1.8, 24), (x, y) => (Math.floor(y * 10) % 2 ? '#e9b949' : '#f6d66e'), { p: [0, 0.9, 0] }), pivot: [JX, y0 + 0.05, JZ], anim: (t) => ({ sy: 0.1 + 0.85 * cyc(t, P * 3) }) });
    // Employees walking between the card and the shops.
    [0, 0.5].forEach((o, i) => moving.push(...walker(moving.length, (t) => { const u = cyc(t, 12, o) * TAU; return { x: Math.cos(u) * 2.6, z: Math.sin(u) * 2.6, ry: -u - Math.PI / 2 }; }, { shirt: ['#3d7be0', '#d6336c'][i], pants: INK, y: y0 })));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Nuro: delivery with no one at the wheel. Driverless pods leave the grocer and the pizza place,
  // spin their sensors as they stop for the person at the crosswalk, pull up at the homes and lift
  // their doors for the customers to take their orders.
  nuro: { finder: '#00b2a9', build: () => {
    const R = rand(233), out = [], TEAL = '#00b2a9';
    out.push(ground('#8fc66f'));
    // ---- the streets: a loop round the block, with a crosswalk
    const RD = 2.6;
    [[0, -RD, 6.2, 1.0], [0, RD, 6.2, 1.0], [-RD, 0, 1.0, 6.2], [RD, 0, 1.0, 6.2]].forEach(([x, z, w, d]) => out.push(part(box(w, 0.03, d), '#5b616b', { p: [x, y0 + 0.015, z] })));
    for (let k = 0; k < 6; k++) out.push(part(box(0.14, 0.012, 0.9), K.white, { p: [-0.6 + k * 0.26, y0 + 0.035, RD] }));
    // The middle of the block: a park; the pickup places on the back street; homes round the outside.
    out.push(part(rbox(4.0, 0.08, 4.0, 0.05), '#7fbf5a', { p: [0, y0 + 0.04, 0] }));
    out.push(part(rbox(2.0, 1.4, 1.4, 0.05), '#f4efe6', { p: [-1.2, y0 + 0.7, -4.3] }), part(box(2.02, 0.3, 1.42), '#2f9e6e', { p: [-1.2, y0 + 1.3, -4.3] }), place(pixText('GROCER', 0.045, K.white, 0.02), { p: [-1.2, y0 + 1.3, -3.58] }));
    out.push(part(rbox(1.6, 1.2, 1.2, 0.05), '#f4efe6', { p: [1.8, y0 + 0.6, -4.3] }), part(box(1.62, 0.3, 1.22), '#e5533d', { p: [1.8, y0 + 1.1, -4.3] }), place(pixText('PIZZA', 0.045, K.white, 0.02), { p: [1.8, y0 + 1.1, -3.68] }));
    const homes = [[-4.3, -1.0], [-4.3, 1.8], [-1.4, 4.3], [1.6, 4.3], [4.3, 1.4], [4.3, -1.6]];
    homes.forEach(([x, z], i) => out.push(place(home(['#fbf3e3', '#e8eef4', '#f6e7e1', '#eef3e6', '#f1e2c6', '#fbf3e3'][i], ['#8a5a36', '#5b6b7d', '#a35a3c', '#3f6f8f', '#6f4a2c', '#5b6b7d'][i], 1.2, 1.0, 0.85), { p: [x, y0, z], r: [0, Math.abs(x) > 4 ? (x < 0 ? Math.PI / 2 : -Math.PI / 2) : 0, 0] })));
    out.push(trees(R, [[-1.0, -0.8], [1.0, 0.8], [0.8, -1.0], [-0.8, 1.0], [-4.6, -4.6], [4.6, -4.6]], 0.6));
    // ---- moving parts
    const moving = [], P = 14;
    const pod = (c) => merge(part(rbox(1.6, 1.15, 0.9, 0.25), K.white, { p: [0, 0.78, 0] }), part(rbox(1.62, 0.28, 0.92, 0.12), c, { p: [0, 0.34, 0] }), part(rbox(0.06, 0.38, 0.75, 0.1), '#26323f', { p: [0.81, 1.0, 0] }), part(rbox(0.6, 0.5, 0.02, 0.06), '#e9ecef', { p: [0.15, 0.85, 0.46] }), [[-0.5, 0.45], [0.5, 0.45], [-0.5, -0.45], [0.5, -0.45]].map(([x, z]) => part(new THREE.CylinderGeometry(0.21, 0.21, 0.12, 14), '#1d1f24', { p: [x, 0.21, z], r: [Math.PI / 2, 0, 0] })));
    const loop = curve([[-RD, y0, -RD], [RD, y0, -RD], [RD, y0, RD], [-RD, y0, RD]], true);
    // Two pods round the block; each stops at the crosswalk and at a door.
    [[0, TEAL], [0.5, '#3d7be0']].forEach(([o, c], i) => {
      const uOf = (t) => { const f = cyc(t, P, o); return f < 0.3 ? f / 0.3 * 0.42 : f < 0.42 ? 0.42 : f < 0.62 ? 0.42 + (f - 0.42) / 0.2 * 0.2 : f < 0.78 ? 0.62 : 0.62 + (f - 0.78) / 0.22 * 0.38; };
      const pi = moving.length;
      moving.push({ geo: pod(c), pivot: [0, 0, 0], anim: (t) => { const a = along(loop, uOf(t) % 1); return { x: a.p.x, y: a.p.y, z: a.p.z, ry: a.ry }; } });
      moving.push({ geo: merge(part(cyl(0.16, 0.16, 0.14, 14), '#3a3f47'), part(box(0.05, 0.06, 0.3), '#4fc3f7', { p: [0, 0.03, 0] })), pivot: [0.2, 1.45, 0], parent: pi, anim: (t) => ({ ry: t * 6 }) });
      moving.push({ geo: part(torus(0.9, 0.025, TAU, 32), '#4fc3f7', { r: [Math.PI / 2, 0, 0] }), pivot: [0.2, 1.5, 0], parent: pi, anim: (t) => { const u = cyc(t, 1.2); return { s: 0.5 + u * 1.2, y: -u * 1.2 }; } });
      moving.push({ geo: part(rbox(0.6, 0.5, 0.04, 0.06), '#e9ecef'), pivot: [0.15, 0.85, 0.48], parent: pi, anim: (t) => { const f = cyc(t, P, o); return { y: 0.55 * (easeIO(win(f, 0.64, 0.68)) - easeIO(win(f, 0.74, 0.78))) }; } });
    });
    // The pedestrian on the crosswalk the pods wait for.
    moving.push(...walker(moving.length, (t) => { const f = cyc(t, P / 2), u = easeIO(win(f, 0.1, 0.5)); return { x: 0.0, z: RD + 0.6 - u * 1.2, ry: Math.PI / 2, s: f > 0.55 ? 0.001 : 1 }; }, { shirt: '#f29a3a', pants: '#2b3a55', y: y0 }));
    // Customers stepping out to their doors.
    [[4.3, 1.4, -1], [-1.4, 4.3, 0]].forEach(([x, z, s], i) => moving.push(...walker(moving.length, (t) => { const f = cyc(t, P, i * 0.5), u = easeIO(win(f, 0.6, 0.66)) - easeIO(win(f, 0.76, 0.82)); return s ? { x: x - 0.7 - u * 0.4, z, ry: Math.PI, still: true, s: f > 0.58 && f < 0.84 ? 1 : 0.001 } : { x, z: z - 0.7 - u * 0.4, ry: Math.PI / 2, still: true, s: f > 0.58 && f < 0.84 ? 1 : 0.001 }; }, { shirt: ['#d6336c', '#3d7be0'][i], pants: '#2b3a55', y: y0 })));
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
  // Figure AI: humanoids at work in a car plant. Car bodies move down the line; the robots walk
  // to the racks, pick up the sheet-metal panels and fit them to each car, and when one runs low
  // it walks to the dock to charge.
  figureai: { finder: '#111111', build: () => {
    const R = rand(232), out = [], INK = '#111111';
    out.push(ground('#8fc66f'), part(rbox(9.8, 0.06, 9.8, 0.03), '#c9ced6', { p: [0, y0 + 0.03, 0] }));
    out.push(part(rbox(9.8, 3.0, 0.2, 0.03), '#e6e9ed', { p: [0, y0 + 1.5, -4.9] }), part(rbox(0.2, 3.0, 9.6, 0.03), '#dde1e6', { p: [-4.9, y0 + 1.5, 0] }), place(pixText('FIGURE', 0.12, INK, 0.03), { p: [1.6, y0 + 2.3, -4.78] }));
    for (let k = 0; k < 2; k++) out.push(part(box(9.4, 0.012, 0.08), '#f2c94c', { p: [0, y0 + 0.07, -0.2 + k * 2.2] }));
    // ---- the line: a long conveyor through the middle
    const LZ = 0.9;
    out.push(part(rbox(9.4, 0.4, 1.4, 0.04), '#5b616b', { p: [0, y0 + 0.2, LZ] }), part(box(9.3, 0.03, 1.3), '#2b2f36', { p: [0, y0 + 0.41, LZ] }));
    // ---- the racks of panels behind the line
    const racks = [-3.0, 0.0, 3.0];
    racks.forEach((x) => { out.push(part(rbox(1.8, 1.8, 0.7, 0.03), '#2a5bb0', { p: [x, y0 + 0.9, -3.6] })); for (let k = 0; k < 6; k++) out.push(part(box(1.4, 0.04, 0.6), '#b9bec6', { p: [x, y0 + 0.4 + k * 0.24, -3.55] })); });
    // The charging dock, back left corner.
    out.push(part(rbox(1.0, 2.4, 0.6, 0.06), INK, { p: [-4.2, y0 + 1.2, -2.0] }), part(box(0.6, 0.15, 0.02), '#62d35f', { p: [-4.2, y0 + 2.0, -1.69] }));
    out.push(trees(R, [[-4.6, 4.6], [0.0, 4.6], [4.6, 4.6]], 0.45));
    // ---- moving parts
    const moving = [], P = 9;
    // Car bodies in primer gliding down the line; each picks up a door panel at each station.
    const body = place(merge(part(rbox(2.2, 0.55, 1.0, 0.12), '#9aa1a9', { p: [0, 0.45, 0] }), part(rbox(1.2, 0.45, 0.9, 0.12), '#8a919a', { p: [-0.15, 0.95, 0] }), part(box(1.0, 0.36, 0.92), '#3a4656', { p: [-0.15, 0.95, 0] })), { s: 1.0 });
    for (let k = 0; k < 3; k++) { const ci = moving.length; moving.push({ geo: body, pivot: [0, y0 + 0.42, LZ], anim: (t) => { const u = cyc(t, P * 1.5, k / 3), x = -5.4 + u * 10.8; return { x, s: clamp01((4.9 - Math.abs(x)) / 0.5) + 0.001 }; } });
      racks.forEach((rx, j) => moving.push({ geo: part(box(0.9, 0.5, 0.04), ['#d0d4d9', '#c4c9cf', '#b9bec6'][j]), pivot: [-0.2, 0.6, 0.53], parent: ci, anim: (t) => { const u = cyc(t, P * 1.5, k / 3), x = -5.4 + u * 10.8; return x > rx + 0.2 ? { x: (j - 1) * 0.0, s: 1 } : { s: 0.001 }; } })); }
    // The robots: each walks from its rack to the line with a panel and back.
    racks.forEach((x, i) => {
      const leg = (t) => { const f = cyc(t, P / 2, i / 3), go = easeIO(win(f, 0.1, 0.4)), back1 = easeIO(win(f, 0.55, 0.85)), u = go - back1; return { f, u, z: -2.8 + u * 2.6, ry: f < 0.5 ? -Math.PI / 2 : Math.PI / 2 }; };
      moving.push(...humanoid(moving.length, (t) => { const l = leg(t); return { x, z: l.z, ry: l.ry }; }, { y: y0 + 0.03, shell: '#e9ecef', joint: INK, s: 1.5 }));
      moving.push({ geo: part(box(1.0, 0.05, 0.6), '#b9bec6'), pivot: [x, 0, 0], anim: (t) => { const l = leg(t); return l.f > 0.1 && l.f < 0.45 ? { y: y0 + 1.55, z: l.z + 0.55 } : { s: 0.001 }; } });
    });
    // A fourth robot walking to the dock to charge, then back.
    moving.push(...humanoid(moving.length, (t) => { const f = cyc(t, P * 2), u = easeIO(win(f, 0.0, 0.3)) - easeIO(win(f, 0.6, 0.9)); return { x: -1.6 - u * 2.0, z: -1.2 - u * 0.2, ry: f < 0.45 ? Math.PI : 0 }; }, { y: y0 + 0.03, shell: '#e9ecef', joint: INK, s: 1.5 }));
    moving.push({ geo: part(box(0.6, 0.15, 0.02), '#62d35f'), pivot: [-4.2, y0 + 2.0, -1.68], anim: (t) => ({ s: Math.sin(t * 4) > 0 ? 1 : 0.4 }) });
    return { bare: true, move: () => ({}), geo: merge(out), moving };
  } },
};
