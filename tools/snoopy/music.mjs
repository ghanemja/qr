// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Soundtrack for the toggle video: an original swing tune at 120 bpm. The 2D parts (0–4 s, 11–12 s)
// play through an "old record" (mono, band-limited, crackle); the flip opens it up to the full band.
// Sound effects: switch clicks, a shimmer for the wipe, a pop and chirps for the bird.
//   node tools/snoopy/music.mjs out.wav
import fs from 'node:fs';
const SR = 44100, DUR = 12.4, N = Math.round(SR * DUR), BEAT = 0.5;
const L = new Float32Array(N), Rt = new Float32Array(N);
let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const mf = (m) => 440 * 2 ** ((m - 69) / 12);
const ss = (a, b, t) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function add(t0, len, fn, gain = 1, pan = 0) {
  const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + len) * SR));
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2, gr = gain * Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
  for (let i = i0; i < i1; i++) { const t = i / SR - t0, v = fn(t); L[i] += v * gl; Rt[i] += v * gr; }
}
const env = (t, d, a = 0.004, r = 0.06) => Math.min(1, t / a) * (t > d ? Math.max(0, 1 - (t - d) / r) : 1);
const S = Math.sin, TAU = Math.PI * 2;
const piano = (m, t0, d, g = 0.18, pan = 0) => { const f = mf(m); add(t0, d + 0.9, (t) =>
  env(t, d, 0.003, 0.25) * [1, 0.5, 0.28, 0.16, 0.08, 0.05].reduce((s, a, k) => s + a * S(TAU * f * (k + 1) * 1.0006 ** k * t) * Math.exp(-t * (1.6 + k * 0.9)), 0), g, pan); };
const vibes = (m, t0, d, g = 0.2, pan = 0.15) => { const f = mf(m); add(t0, d + 1.4, (t) =>
  env(t, d + 0.8, 0.002, 0.4) * (S(TAU * f * t) + 0.22 * S(TAU * f * 4 * t) * Math.exp(-t * 8)) * Math.exp(-t * 1.5) * (1 + 0.28 * S(TAU * 5.5 * t)), g, pan); };
const bass = (m, t0, d, g = 0.42) => { const f = mf(m); add(t0, d + 0.1, (t) =>
  env(t, d, 0.006, 0.05) * (S(TAU * f * t) + 0.45 * S(TAU * 2 * f * t) * Math.exp(-t * 4) + 0.15 * S(TAU * 3 * f * t) * Math.exp(-t * 7)) * Math.exp(-t * 1.8), g, -0.1); };
const noise = () => rnd() * 2 - 1;
const ride = (t0, g = 0.06) => { let p = 0; add(t0, 0.6, (t) => { const n = noise(), h = n - p; p = n;
  return (h * 0.7 * Math.exp(-t * 5) + 0.12 * (S(TAU * 5230 * t) + S(TAU * 7470 * t) * 0.7 + S(TAU * 3360 * t) * 0.5) * Math.exp(-t * 14)) * Math.exp(-t * 4); }, g, 0.35); };
const brush = (t0, g = 0.05) => { let y = 0; add(t0, 0.25, (t) => { y += 0.35 * (noise() - y); return y * Math.exp(-t * 18) * 2.2; }, g, -0.2); };
const kick = (t0, g = 0.35) => add(t0, 0.35, (t) => S(TAU * (50 * t + 60 * (1 - Math.exp(-t * 30)) / 30)) * Math.exp(-t * 9), g);
const click = (t0, g = 0.35) => { add(t0, 0.03, (t) => noise() * Math.exp(-t * 300), g); add(t0, 0.06, (t) => S(TAU * 1900 * t) * Math.exp(-t * 90), g * 0.6); add(t0 + 0.012, 0.08, (t) => S(TAU * 320 * t) * Math.exp(-t * 60), g * 0.8); };
const chirp = (t0, f0 = 3000, g = 0.08, pan = 0.3) => add(t0, 0.11, (t) => {
  const u = t / 0.11, f = f0 * (1 + 0.45 * Math.sin(Math.PI * u)); return S(TAU * f * t + 3 * S(TAU * 38 * t)) * Math.sin(Math.PI * u) ** 2; }, g, pan);
const pop = (t0, g = 0.3) => { add(t0, 0.12, (t) => S(TAU * (900 * t - 3500 * t * t)) * Math.exp(-t * 30), g); add(t0, 0.05, (t) => noise() * Math.exp(-t * 80), g * 0.3); };
function shimmer(t0, len, up = true, g = 0.05) {
  for (let k = 0; k < 18; k++) {
    const d = rnd() * 0.25, f0 = 500 + rnd() * 700, f1 = 2000 + rnd() * 3000, ph = rnd() * TAU, pan = rnd() * 1.6 - 0.8;
    add(t0 + d, len, (t) => { const u = Math.min(1, t / len), uu = up ? u : 1 - u, f = f0 * (f1 / f0) ** uu;
      return S(ph + TAU * f * t) * Math.sin(Math.PI * Math.min(1, u)) * (0.6 + 0.4 * S(TAU * 9 * t + k)); }, g, pan);
  }
  let y = 0; add(t0, len, (t) => { y += 0.08 * (noise() - y); const u = t / len; return y * 3 * (up ? u * (1 - u) * 4 : (1 - u) * u * 4); }, g * 2);
}

// ---- the tune: Gm7 | C7 | F | Dm7 | Gm7 C7 | F (two seconds a bar) ----
const BASS = [[43, 46, 50, 47], [48, 52, 43, 40], [41, 45, 48, 49], [50, 53, 45, 42], [43, 46, 48, 40], [41]];
BASS.forEach((bar, i) => bar.forEach((m, k) => bass(m, (i * 4 + k) * BEAT, i === 5 ? 1.6 : 0.45, i < 2 || i === 5 ? 0.36 : 0.42)));
const CH = { Gm7: [53, 58, 62], C7: [52, 58, 62], F: [57, 62, 65], Dm7: [53, 57, 60] };
[['Gm7', 0], ['C7', 4], ['F', 8], ['Dm7', 12], ['Gm7', 16], ['C7', 18], ['F', 20]].forEach(([c, b]) => {
  const hits = b === 16 || b === 18 ? [b + 0.66] : [b + 1.66, b + 3];
  for (const h of hits) CH[c].forEach((m, k) => piano(m, h * BEAT + k * 0.006, 0.22, b >= 8 && b < 22 ? 0.1 : 0.08, -0.25));
});
const MEL2D = [[0, 67, .5], [.66, 70, .3], [1, 74, .5], [2, 72, .3], [2.66, 70, .3], [3, 67, .8],
  [4, 64, .5], [4.66, 67, .3], [5, 70, .5], [6, 69, .3], [6.66, 67, .3], [7, 64, .2], [7.33, 65, .15], [7.66, 66, .15]];
MEL2D.forEach(([b, m, d]) => piano(m + 12, b * BEAT, d, 0.17, 0.1));
const MEL3D = [[8, 72, .4], [8.66, 77, .3], [9, 76, .3], [9.66, 77, .3], [10, 81, .8], [11.66, 79, .3],
  [12, 77, .4], [12.66, 74, .3], [13, 77, .3], [13.66, 81, .3], [14, 79, .8], [15.66, 77, .3],
  [16, 74, .4], [16.66, 77, .3], [17, 79, .5], [18, 76, .4], [18.66, 79, .3], [19, 82, .5], [20, 81, .6], [21, 77, .4], [21.66, 76, .2]];
MEL3D.forEach(([b, m, d]) => vibes(m, b * BEAT, d * BEAT * 2, 0.2));
MEL3D.filter((_, i) => i % 3 === 0).forEach(([b, m, d]) => vibes(m - 12, b * BEAT, d * BEAT * 2, 0.07, -0.3));
piano(72, 22 * BEAT, 0.4, 0.15); piano(77, 23 * BEAT, 0.9, 0.15); piano(69, 23 * BEAT, 0.9, 0.1);
for (let bar = 2; bar < 6; bar++) for (const b of [0, 1, 1.66, 2, 3, 3.66]) if (bar * 4 + b < 22) ride((bar * 4 + b) * BEAT, b % 1 ? 0.022 : 0.032);
for (let bar = 2; bar < 6; bar++) for (const b of [1, 3]) if (bar * 4 + b < 22) brush((bar * 4 + b) * BEAT);
for (let bar = 2; bar < 6; bar++) for (const b of [0, 2]) if (bar * 4 + b < 22) kick((bar * 4 + b) * BEAT, 0.28);
// tiptoe brushes under the 2D walk
for (let b = 0; b < 8; b++) brush(b * BEAT, 0.03);

// ---- effects on the picture's cues ----
click(3.95); shimmer(3.98, 0.85, true, 0.045); kick(4.0, 0.45);
pop(4.45); [4.62, 4.74, 6.2, 6.32, 7.85, 9.25, 9.37, 10.5].forEach((t, i) => chirp(t, 2800 + (i % 3) * 400, 0.07, i % 2 ? 0.4 : -0.3));
chirp(10.88, 3400, 0.08); click(10.98, 0.3); shimmer(10.98, 0.5, false, 0.04);
chirp(11.4, 3000, 0.05); chirp(11.52, 3300, 0.05);

// ---- 2D sections through the old record; full band in between ----
const hi = (t) => ss(3.93, 4.03, t) - ss(10.96, 11.06, t);
let lp1 = 0, lp2 = 0, hp = 0, hpx = 0;
const outL = new Float32Array(N), outR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR, k = hi(t), m = (L[i] + Rt[i]) * 0.5;
  lp1 += 0.3 * (m - lp1); lp2 += 0.3 * (lp1 - lp2);
  hp = 0.96 * (hp + lp2 - hpx); hpx = lp2;
  let lo = Math.tanh(hp * 2.2) * 0.55;
  lo += (rnd() < 0.0009 ? noise() * 0.25 : 0) + noise() * 0.006;
  const fade = Math.min(1, t / 0.05) * (1 - ss(11.7, DUR, t));
  outL[i] = (k * L[i] + (1 - k) * lo) * fade; outR[i] = (k * Rt[i] + (1 - k) * lo) * fade;
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
const g = 0.89 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(outL[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(outR[i] * g * 32767), 46 + i * 4); }
fs.writeFileSync(process.argv[2] || 'soundtrack.wav', buf);
console.log('peak', peak.toFixed(3));
