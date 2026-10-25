// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Chiptune: square-wave arps and leads, 8-bit like the QR pixels (in the spirit of Equalizer's "Square One").
import { track, bassline, arp } from '../../../../equalizer/src/presets.js';
import { BPM, BARS, any, AT, KICK, KICK_ROLL, ROLL, ROLL2, RISE } from './plan.mjs';
import { pixelFx } from './house.mjs';
const prog = ['Am', 'F', 'C', 'G'];
const lead = 'E5 . . . A5 . . . C6 . . . . . B5 . A5 . . . G5 . . . F5 . . . . . . . E5 . . . G5 . . . C6 . . . . . D6 . E6 . . . D6 . . . B5 . . . . . . .';
export default {
  title: 'QR Compass · Chiptune', bpm: BPM, bars: BARS, fadeIn: 0.5, fadeOut: 2.5, master: 0.5,
  tracks: [
    track('chip', { pattern: arp(prog), gain: 0.55, gate: any('intro', 'a', 'qr', 'b', 'build', 'drop', 'outro') }),
    track('kick', { pattern: 'x.......x.x.....', params: { decay: 12 }, gate: KICK }),
    track('snare', { pattern: '....x.......x...', params: { tone: 0.2, decay: 25 }, gate: any('a', 'b', 'build', 'drop') }),
    track('snare', { name: 'Snare roll', pattern: 'x.x.x.x.xxxxxxxx', params: { tone: 0.2, decay: 25 }, gate: ROLL, gain: 0.7 }),
    track('hat', { pattern: 'x.x.x.x.x.x.x.x.', params: { decay: 90, metal: 0.8 }, gain: 0.2, gate: any('qr', 'b', 'build', 'drop') }),
    track('sawbass', { pattern: bassline(prog, 'x .'), lp: 900, gate: any('a', 'b', 'build', 'drop') }),
    track('lead', { pattern: lead, params: { vib: 0.1, width: 0.25, decay: 1.2 }, gain: 0.26, gate: any('b', 'drop') }),
    track('lead', { name: 'Lead 2', pattern: lead.split(' ').map((n) => (n === '.' ? n : n.replace(/\d$/, (d) => +d + 1))).join(' '), params: { vib: 0.05, width: 0.5, decay: 1 }, gain: 0.1, gate: any('drop') }),
    track('laser', { name: 'Zaps', at: [AT.shatter + 0.1, AT.rebuild + 0.1, AT.drop], gain: 0.22 }),
    ...pixelFx(),
    track('riser', { at: [AT.build], len: RISE, params: { rise: RISE - 0.2 }, hp: 2000, gain: 0.25 }),
    track('kick808', { name: 'Impact', at: [AT.drop, AT.end], len: 2, params: { base: 42, decay: 1.4, drive: 3 }, gain: 0.7 }),
  ],
};
