// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// House, four on the floor (in the spirit of Equalizer's "Floor Function").
import { track, chords, bassline, arp } from '../../../../equalizer/src/presets.js';
import { BPM, BARS, any, AT, KICK, KICK_ROLL, ROLL, ROLL2, RISE } from './plan.mjs';
const prog = ['Am', 'F', 'C', 'G'];
// Everything that plays into the drop stops for the half beat before it, so the drop lands.
const GAP = `(t < ${AT.drop - 0.5} || t >= ${AT.drop})`, cut = (g) => `(${g}) && ${GAP}`;
export default {
  title: 'QR Compass · House', bpm: BPM, bars: BARS, fadeIn: 1.5, fadeOut: 2.5, master: 0.55,
  tracks: [
    track('supersaw', { name: 'Pad', pattern: chords(prog), gain: 0.2, gate: cut(any('intro', 'a', 'qr', 'b', 'build', 'outro')) }),
    track('supersaw', { name: 'Drop pad', pattern: chords(prog, 1), gain: 0.3, gate: any('drop') }),
    track('choir', { pattern: chords(prog, -1), lp: 1600, gain: 0.12, gate: GAP }),
    track('kick', { pattern: 'x...x...x...x...', gate: KICK }),
    track('kick', { name: 'Kick roll', pattern: 'x.x.x.x.xxxxxxxx', gate: cut(KICK_ROLL), gain: 0.55 }),
    track('clap', { pattern: '....x.......x...', gate: cut(any('a', 'b', 'build', 'drop')) }),
    track('snare', { name: 'Snare roll', pattern: 'x...x...x.x.x.x.xxxxxxxxxxxxxxxx', params: { tone: 0.3, decay: 18 }, gate: cut(ROLL2), gain: 0.5 }),
    // ...speeding up to 32nd notes over the last two beats.
    track('snare', { name: 'Snare 32nds', pattern: 'x', rate: 8, params: { tone: 0.3, decay: 26 }, gate: `t >= ${AT.drop - 1.5} && t < ${AT.drop - 0.5}`, gain: 0.42 }),
    track('hat', { pattern: '..x...x...x...x.', params: { decay: 32 }, gate: cut(any('a', 'qr', 'b', 'build', 'drop')), gain: 0.4 }),
    track('hat', { name: 'Hat 16ths', pattern: 'x.x.x.x.x.x.x.x.', params: { decay: 70, metal: 0.3 }, hp: 7000, gate: cut(any('build', 'drop')), gain: 0.22, pan: 0.25 }),
    track('shaker', { gain: 0.16, gate: cut(any('b', 'build', 'drop')) }),
    track('sawbass', { pattern: bassline(prog, '. . x .'), gate: cut(any('a', 'b', 'build', 'drop')), lp: 1100 }),
    track('sub808', { name: 'Drop 808', pattern: ['A1', 'F1', 'C2', 'G1'].map((r) => `${r} . . . . . . . ${r} . . . . . . .`).join(' '), gate: any('drop'), gain: 0.3 }),
    track('pluck', { pattern: arp(prog), pan: 0.2, echo: 0.28, gate: cut(any('qr', 'b', 'build', 'drop')), gain: 0.8 }),
    track('bell', { name: 'Hook', pattern: 'E6 . . C6 . . A5 . . C6 . . D6 . C6 . A5 . . . . . . . . . . . C6 . D6 . E6 . . G6 . . E6 . . D6 . C6 . . . . . . . . . . . . . . . . . . . . .',
      params: { ratio: 3.5, decay: 1.6 }, echo: 0.2, gain: 0.11, lp: 5000, gate: any('drop', 'outro') }),
    ...pixelFx(),
    track('riser', { at: [AT.build], len: RISE - 0.5, params: { rise: RISE - 0.6 }, hp: 1500, gain: 0.45 }),
    // A rising sine under the riser, then the drop itself: a falling sub and a crash over the impact.
    { name: 'Up-sweep', equation: 'sin(TAU*(80*tau + 90*tau*tau)) * min(1, tau/5.5)^2', at: [AT.drop - 6], len: 5.5, gain: 0.14 },
    { name: 'Sub drop', equation: 'sin(TAU*(110*tau - 30*tau*tau)) * exp(-tau*1.4)', at: [AT.drop], len: 1.6, gain: 0.55 },
    { name: 'Crash', equation: 'noise() * exp(-tau*2.2)', at: [AT.drop], len: 2.5, hp: 3500, gain: 0.3 },
    track('whoosh', { at: [AT.first - 0.4, AT.drop - 0.5, AT.end - 0.4], params: { rise: 0.45 }, gain: 0.45 }),
    track('kick808', { name: 'Impact', at: [AT.drop, AT.end], len: 2, params: { base: 40, decay: 1.2, drive: 3 }, gain: 0.8 }),
  ],
};
// The QR moment: a spray of pixel pops as the model shatters, and again as it rebuilds.
export function pixelFx() {
  // Spread over the slowed-down breakdown (3.4 s) and the rebuild (2.4 s).
  const pops = (t0, span) => Array.from({ length: 18 }, (_, i) => +(t0 + 0.1 + (i / 18) * span + (i % 3) * 0.03).toFixed(3));
  return [
    track('whoosh', { name: 'Shatter', at: [AT.shatter - 0.35, AT.rebuild - 0.35], params: { rise: 0.35 }, gain: 0.4 }),
    track('pop', { name: 'Pixels', at: [...pops(AT.shatter, 3), ...pops(AT.rebuild, 2.1)], params: { hi: 1500, lo: 500 }, gain: 0.3, pan: 0.15 }),
    track('bell', { name: 'Scan chime', at: [AT.shatter + 3.4], note: 'E6', len: 1.2, params: { ratio: 3, decay: 2.5 }, gain: 0.12, echo: 0.15, lp: 5000 }),
  ];
}
