// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// House, four on the floor (in the spirit of Equalizer's "Floor Function").
import { track, chords, bassline, arp } from '../../../../equalizer/src/presets.js';
import { BPM, BARS, any, AT, KICK, KICK_ROLL, ROLL, ROLL2, RISE } from './plan.mjs';
const prog = ['Am', 'F', 'C', 'G'];
export default {
  title: 'QR Compass · House', bpm: BPM, bars: BARS, fadeIn: 1.5, fadeOut: 2.5, master: 0.55,
  tracks: [
    track('supersaw', { name: 'Pad', pattern: chords(prog), gain: 0.2, gate: any('intro', 'a', 'qr', 'b', 'build', 'outro') }),
    track('supersaw', { name: 'Drop pad', pattern: chords(prog, 1), gain: 0.3, gate: any('drop') }),
    track('choir', { pattern: chords(prog, -1), lp: 1600, gain: 0.12 }),
    track('kick', { pattern: 'x...x...x...x...', gate: KICK }),
    track('kick', { name: 'Kick roll', pattern: 'x.x.x.x.xxxxxxxx', gate: KICK_ROLL, gain: 0.55 }),
    track('clap', { pattern: '....x.......x...', gate: any('a', 'b', 'build', 'drop') }),
    track('snare', { name: 'Snare roll', pattern: 'x...x...x.x.x.x.xxxxxxxxxxxxxxxx', params: { tone: 0.3, decay: 18 }, gate: ROLL2, gain: 0.45 }),
    track('hat', { pattern: '..x...x...x...x.', params: { decay: 32 }, gate: any('a', 'qr', 'b', 'build', 'drop'), gain: 0.4 }),
    track('hat', { name: 'Hat 16ths', pattern: 'x.x.x.x.x.x.x.x.', params: { decay: 70, metal: 0.3 }, hp: 7000, gate: any('build', 'drop'), gain: 0.22, pan: 0.25 }),
    track('shaker', { gain: 0.16, gate: any('b', 'build', 'drop') }),
    track('sawbass', { pattern: bassline(prog, '. . x .'), gate: any('a', 'b', 'build', 'drop'), lp: 1100 }),
    track('sub808', { name: 'Drop 808', pattern: ['A1', 'F1', 'C2', 'G1'].map((r) => `${r} . . . . . . . ${r} . . . . . . .`).join(' '), gate: any('drop'), gain: 0.3 }),
    track('pluck', { pattern: arp(prog), pan: 0.2, echo: 0.28, gate: any('qr', 'b', 'build', 'drop'), gain: 0.8 }),
    track('bell', { name: 'Hook', pattern: 'E6 . . C6 . . A5 . . C6 . . D6 . C6 . A5 . . . . . . . . . . . C6 . D6 . E6 . . G6 . . E6 . . D6 . C6 . . . . . . . . . . . . . . . . . . . . .',
      params: { ratio: 3.5, decay: 2.2 }, echo: 0.35, gain: 0.28, gate: any('drop', 'outro') }),
    ...pixelFx(),
    track('riser', { at: [AT.build], len: RISE, params: { rise: RISE - 0.2 }, hp: 1500, gain: 0.32 }),
    track('whoosh', { at: [AT.first - 0.4, AT.drop - 0.5, AT.end - 0.4], params: { rise: 0.45 }, gain: 0.45 }),
    track('kick808', { name: 'Impact', at: [AT.drop, AT.end], len: 2, params: { base: 40, decay: 1.2, drive: 3 }, gain: 0.8 }),
  ],
};
// The QR moment: a spray of pixel pops as the model shatters, and again as it rebuilds.
export function pixelFx() {
  const pops = (t0) => Array.from({ length: 14 }, (_, i) => +(t0 + i * 0.11 + (i % 3) * 0.02).toFixed(3));
  return [
    track('whoosh', { name: 'Shatter', at: [AT.shatter - 0.35, AT.rebuild - 0.35], params: { rise: 0.35 }, gain: 0.4 }),
    track('pop', { name: 'Pixels', at: [...pops(AT.shatter), ...pops(AT.rebuild)], params: { hi: 1500, lo: 500 }, gain: 0.3, pan: 0.15 }),
    track('bell', { name: 'Scan chime', at: [AT.shatter + 1.8], note: 'E6', len: 1.5, params: { ratio: 3, decay: 2 }, gain: 0.3, echo: 0.3 }),
  ];
}
