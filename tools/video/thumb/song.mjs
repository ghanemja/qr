// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// The thumb video's soundtrack, made in Equalizer: 120 bpm, 10 bars, each gag on its beat
// (the timeline is in thumb.html) and the drop on bar 8, when the code lands.
//   node ../equalizer/examples/render.mjs tools/video/thumb/song.mjs /tmp/qrv/thumb.wav
import { track, chords, bassline, arp } from '../../../../equalizer/src/presets.js';
const prog = ['Am', 'F', 'C', 'G'], DROP = 16;
const GAP = `(t < ${DROP - 0.5} || t >= ${DROP})`, cut = (g) => `(${g}) && ${GAP}`;
const R = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646, rnd = R(5);
// Pixels hitting the thumb: a spray of pops after each beat of the rain.
const rain = [0, 0.5, 1, 1.5].flatMap((b) => Array.from({ length: 5 }, (_, i) => +(4.8 + b + i * 0.05 + rnd() * 0.04).toFixed(3))).filter((t) => t < 5.98);
// The shatter, and the pixels whirling.
const shatter = Array.from({ length: 22 }, (_, i) => +(13 + i * 0.11 + rnd() * 0.05).toFixed(3));
export default {
  title: 'QR Compass · Thumb on the dot', bpm: 120, bars: 10, fadeIn: 0.2, fadeOut: 1.6, master: 0.55,
  tracks: [
    track('supersaw', { name: 'Pad', pattern: chords(prog), gain: 0.18, gate: cut('bar < 8') }),
    track('supersaw', { name: 'Drop pad', pattern: chords(prog, 1), gain: 0.3, gate: 'bar >= 8' }),
    track('choir', { pattern: chords(prog, -1), lp: 1600, gain: 0.1, gate: GAP }),
    // The countdown: three blips and a higher one on GO.
    track('bell', { name: 'Count', at: [2, 2.5, 3], note: 'A5', len: 0.4, params: { ratio: 2, decay: 9 }, gain: 0.16 }),
    track('bell', { name: 'Go', at: [3.5], note: 'A6', len: 0.7, params: { ratio: 2, decay: 5 }, gain: 0.18 }),
    track('hat', { pattern: '..x...x...x...x.', params: { decay: 32 }, gate: cut('bar >= 1'), gain: 0.38 }),
    track('kick', { pattern: 'x...x...x...x...', gate: 'bar >= 2 && bar < 6 || bar >= 8' }),
    track('clap', { pattern: '....x.......x...', gate: cut('bar >= 2 && bar < 6 || bar >= 8') }),
    track('sawbass', { pattern: bassline(prog, '. . x .'), gate: cut('bar >= 2 && bar < 6 || bar >= 8'), lp: 1100 }),
    track('pluck', { pattern: arp(prog), pan: 0.2, echo: 0.25, gate: cut('bar >= 2'), gain: 0.7 }),
    track('pop', { name: 'Rain', at: rain, params: { hi: 1700, lo: 600 }, gain: 0.28, pan: 0.2 }),
    // The booster: a rumbling descent, the landing burn, touchdown.
    { name: 'Rumble', equation: 'noise() * min(1, tau/0.6) * (0.5 + 0.5*min(1, tau/1.4))', at: [6], len: 1.55, lp: 500, gain: 0.5 },
    track('kick808', { name: 'Touchdown', at: [7.5], len: 1.2, params: { base: 38, decay: 2.5, drive: 3 }, gain: 0.75 }),
    // The Roadster: up the curl, thrusters in the air, down on its wheels.
    track('whoosh', { name: 'Jump', at: [8.45], params: { rise: 0.3 }, gain: 0.5 }),
    track('laser', { name: 'Thrusters', at: [8.75, 9.05, 9.35], gain: 0.12 }),
    track('tom', { name: 'Landing', at: [9.72], params: { pitch: 90, decay: 7 }, gain: 0.7 }),
    // The scanner: a rising sweep, then two error buzzes on the beat.
    { name: 'Scan', equation: 'sin(TAU*(500*tau + 400*tau*tau)) * 0.5 * min(1, tau/0.1)', at: [10], len: 0.98, gain: 0.12 },
    { name: 'Buzz', equation: 'sqr(110*tau) * 0.5 * exp(-tau*5) + sqr(116*tau) * 0.5 * exp(-tau*5)', at: [11, 11.5], len: 0.38, lp: 1800, gain: 0.22 },
    // The world drops in, breaks, and its pixels whirl up into the drop.
    track('kick808', { name: 'World lands', at: [12.3], len: 0.8, params: { base: 50, decay: 5 }, gain: 0.5 }),
    track('whoosh', { name: 'Shatter', at: [12.65], params: { rise: 0.35 }, gain: 0.45 }),
    track('pop', { name: 'Pixels', at: shatter, params: { hi: 1500, lo: 500 }, gain: 0.26, pan: -0.15 }),
    track('kick', { name: 'Build kick', pattern: 'x...x...x.x.xxxx', gate: cut('bar >= 6 && bar < 8'), gain: 0.6 }),
    track('snare', { name: 'Snare roll', pattern: 'x...x...x.x.x.x.xxxxxxxxxxxxxxxx', params: { tone: 0.3, decay: 18 }, gate: cut('bar >= 6 && bar < 8'), gain: 0.45 }),
    track('riser', { at: [12.5], len: 3.0, params: { rise: 2.9 }, hp: 1500, gain: 0.42 }),
    { name: 'Up-sweep', equation: 'sin(TAU*(80*tau + 90*tau*tau)) * min(1, tau/3)^2', at: [12.5], len: 3.0, gain: 0.13 },
    // The drop: a falling sub, a crash and an impact as the code slams in, then the hook.
    { name: 'Sub drop', equation: 'sin(TAU*(110*tau - 30*tau*tau)) * exp(-tau*1.4)', at: [DROP], len: 1.6, gain: 0.55 },
    { name: 'Crash', equation: 'noise() * exp(-tau*2.2)', at: [DROP], len: 2.5, hp: 3500, gain: 0.3 },
    track('kick808', { name: 'Impact', at: [DROP], len: 2, params: { base: 40, decay: 1.2, drive: 3 }, gain: 0.8 }),
    track('sub808', { name: 'Drop 808', pattern: ['A1', 'F1', 'C2', 'G1'].map((r) => `${r} . . . . . . . ${r} . . . . . . .`).join(' '), gate: 'bar >= 8', gain: 0.3 }),
    track('bell', { name: 'Hook', pattern: 'E6 . . C6 . . A5 . . C6 . . D6 . C6 . A5 . . . . . . . . . . . . . . . . .',
      params: { ratio: 3.5, decay: 1.6 }, echo: 0.2, gain: 0.11, lp: 5000, gate: 'bar >= 8' }),
    track('bell', { name: 'Scan chime', at: [DROP + 0.5], note: 'E6', len: 1.2, params: { ratio: 3, decay: 2.5 }, gain: 0.12, echo: 0.15, lp: 5000 }),
  ],
};
