// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Half-time hip-hop: tanh-driven 808s, swung hats and FM bells (in the spirit of Equalizer's "Hyperbolic 808").
import { track, chords } from '../../../../equalizer/src/presets.js';
import { BPM, BARS, any, AT, KICK, KICK_ROLL, ROLL, ROLL2, RISE } from './plan.mjs';
import { pixelFx } from './house.mjs';
const prog = ['Am', 'F', 'C', 'G'];
export default {
  title: 'QR Compass · Hip-hop', bpm: BPM, bars: BARS, fadeIn: 1, fadeOut: 2.5, master: 0.55,
  tracks: [
    track('choir', { pattern: chords(prog, -1), gain: 0.28 }),
    track('rhodes', { pattern: ['A3+C4+E4+G4', 'F3+A3+C4+E4', 'C4+E4+G4+B4', 'G3+B3+D4+F4'].map((c) => `${c} . . . . . ${c} . . . . . . . . .`).join(' '), gain: 0.7, gate: any('intro', 'a', 'qr', 'b', 'build', 'outro') }),
    track('kick808', { pattern: 'x.........x.....x.........x..x..', gate: KICK }),
    track('clap', { pattern: '........x.......', gain: 0.5, gate: any('a', 'b', 'build', 'drop') }),
    track('hat', { pattern: 'x.x.x.x.x.x.xxxxx.x.x.x.x.x.x.x.', params: { decay: 80 }, gain: 0.3, gate: any('a', 'qr', 'b', 'build', 'drop') }),
    track('hat', { name: 'Hat rolls', pattern: 'xxxxxxxxxxxxxxxx', params: { decay: 90 }, rate: 8, gain: 0.18, gate: ROLL }),
    track('rim', { pattern: '...x.....x....x.', gain: 0.22, gate: any('b', 'drop') }),
    track('sub808', { name: '808', pattern: ['A1', 'F1', 'C2', 'G1'].map((r) => `${r} . . . . . . . . . ${r} . . . . .`).join(' '), gain: 0.34, gate: any('a', 'b', 'build', 'drop') }),
    track('bell', { name: 'Bells', pattern: 'A5 . . C6 . . E6 . D6 . . C6 . . A5 . G5 . . . A5 . . C6 . . . . . . . .', params: { ratio: 3.5, decay: 2.5 }, echo: 0.35, gain: 0.3, gate: any('b', 'drop', 'outro') }),
    track('crackle', { name: 'Crackle' }),
    ...pixelFx(),
    track('riser', { at: [AT.build], len: RISE, params: { rise: RISE - 0.2 }, hp: 1500, gain: 0.28 }),
    track('whoosh', { at: [AT.first - 0.4, AT.drop - 0.5, AT.end - 0.4], params: { rise: 0.45 }, gain: 0.45 }),
    track('kick808', { name: 'Impact', at: [AT.drop, AT.end], len: 2, params: { base: 38, decay: 1, drive: 3 }, gain: 0.7 }),
  ],
};
