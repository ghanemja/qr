// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Synthwave: saw bass, big pads and a vibrato lead (in the spirit of Equalizer's "Fourier Drive").
import { track, chords, bassline } from '../../../../equalizer/src/presets.js';
import { BPM, BARS, any, AT, KICK, KICK_ROLL, ROLL, ROLL2, RISE } from './plan.mjs';
import { pixelFx } from './house.mjs';
const prog = ['Am', 'F', 'C', 'G'];
const lead = 'E5 . . . A5 . . . G5 . E5 . . . D5 . C5 . . . . . . . A4 . C5 . D5 . . . E5 . . . G5 . . . E5 . D5 . C5 . . . D5 . . . . . B4 . D5 . . . G5 . . .';
export default {
  title: 'QR Compass · Synthwave', bpm: BPM, bars: BARS, fadeIn: 1.5, fadeOut: 2.5, master: 0.55,
  tracks: [
    track('choir', { pattern: chords(prog), gain: 0.35 }),
    track('supersaw', { name: 'Pad', pattern: chords(prog), gain: 0.18, gate: any('b', 'build', 'drop') }),
    track('kick', { params: { decay: 8 }, gate: KICK }),
    track('snare', { pattern: '....x.......x...', params: { tone: 0.45, decay: 13 }, echo: 0.2, gain: 0.6, gate: any('a', 'b', 'build', 'drop') }),
    track('snare', { name: 'Snare roll', pattern: 'x...x...x.x.x.x.xxxxxxxxxxxxxxxx', params: { tone: 0.35, decay: 18 }, gate: ROLL2, gain: 0.4 }),
    track('hat', { pattern: 'x.x.x.x.x.x.x.x.', params: { decay: 60 }, gain: 0.26, gate: any('a', 'qr', 'b', 'build', 'drop') }),
    track('sawbass', { pattern: bassline(prog, 'x .'), params: { sub: 0.4, decay: 4 }, lp: 900, gain: 0.55, gate: any('a', 'b', 'build', 'drop') }),
    track('lead', { pattern: lead, params: { vib: 0.12, decay: 1.2 }, echo: 0.3, gain: 0.26, gate: any('b', 'drop') }),
    track('bell', { name: 'Arp', pattern: 'A5 C6 E6 C6 A5 C6 E6 C6 F5 A5 C6 A5 F5 A5 C6 A5', rate: 2, params: { ratio: 2, decay: 4 }, echo: 0.3, gain: 0.16, gate: any('qr', 'build') }),
    ...pixelFx(),
    track('riser', { at: [AT.build], len: RISE, params: { rise: RISE - 0.2 }, hp: 1500, gain: 0.3 }),
    track('whoosh', { at: [AT.first - 0.4, AT.drop - 0.5, AT.end - 0.4], params: { rise: 0.45 }, gain: 0.45 }),
    track('kick808', { name: 'Impact', at: [AT.drop, AT.end], len: 2, params: { base: 40, decay: 1.2, drive: 3 }, gain: 0.8 }),
  ],
};
