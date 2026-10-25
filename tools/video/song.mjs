// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// The ad's soundtrack, written for Equalizer (https://github.com/ghanemja/equalizer):
// every sound is an equation. 120 bpm, so one bar is 2 s and the video cuts on bar lines.
//   bars 0-1  intro (title)         bars 2-9   one model per bar
//   bars 10-13 faster cuts + riser  bars 14-17 the drop: every model in a grid
//   bars 18-19 end card
// Render: node <equalizer>/examples/render.mjs tools/video/song.mjs song.wav
import { track, chords, bassline, arp } from '../../../equalizer/src/presets.js';

const prog = ['Am', 'F', 'C', 'G'];
export default {
  title: 'QR Compass', bpm: 120, bars: 20, fadeIn: 1.5, fadeOut: 2.5, master: 0.55,
  tracks: [
    track('supersaw', { name: 'Pad', pattern: chords(prog), gain: 0.2, gate: 'bar < 14 || bar >= 18' }),
    track('supersaw', { name: 'Drop pad', pattern: chords(prog, 1), gain: 0.3, gate: 'bar >= 14 && bar < 18' }),
    track('sub808', { name: 'Drop 808', pattern: ['A1', 'F1', 'C2', 'G1'].map((r) => `${r} . . . . . . . ${r} . . . . . . .`).join(' '), gate: 'bar >= 14 && bar < 18', gain: 0.3 }),
    track('choir', { pattern: chords(prog, -1), lp: 1600, gain: 0.12 }),
    track('kick', { pattern: 'x...x...x...x...', gate: '(bar >= 2 && bar < 13) || (bar == 13 && beat < 54) || (bar >= 14 && bar < 18)' }),
    track('kick', { name: 'Kick roll', pattern: 'x.x.x.x.xxxxxxxx', gate: 'bar == 13 && beat < 55.5', gain: 0.55 }),
    track('clap', { pattern: '....x.......x...', gate: 'bar >= 4 && bar < 18' }),
    track('snare', { name: 'Snare roll', pattern: 'x...x...x.x.x.x.xxxxxxxxxxxxxxxx', params: { tone: 0.3, decay: 18 },
      gate: 'bar >= 12 && bar < 14', gain: 0.45 }),
    track('hat', { pattern: '..x...x...x...x.', params: { decay: 32 }, gate: 'bar >= 2 && bar < 18', gain: 0.4 }),
    track('hat', { name: 'Hat 16ths', pattern: 'x.x.x.x.x.x.x.x.', params: { decay: 70, metal: 0.3 }, hp: 7000,
      gate: 'bar >= 10 && bar < 18', gain: 0.22, pan: 0.25 }),
    track('shaker', { gain: 0.16, gate: 'bar >= 6 && bar < 18' }),
    track('sawbass', { pattern: bassline(prog, '. . x .'), gate: 'bar >= 2 && bar < 18', lp: 1100 }),
    track('pluck', { pattern: arp(prog), pan: 0.2, echo: 0.28, gate: 'bar >= 6 && bar < 18', gain: 0.8 }),
    track('bell', { name: 'Hook', pattern: 'E6 . . C6 . . A5 . . C6 . . D6 . C6 . A5 . . . . . . . . . . . C6 . D6 . E6 . . G6 . . E6 . . D6 . C6 . . . . . . . . . . . . . . . . . . . . .',
      params: { ratio: 3.5, decay: 2.2 }, echo: 0.35, gain: 0.28, gate: '(bar >= 14 && bar < 18) || bar >= 18' }),
    track('riser', { at: [20], len: 8, params: { rise: 7.8 }, hp: 1500, gain: 0.32 }),
    track('whoosh', { at: [27.5, 3.6, 35.6], params: { rise: 0.45 }, gain: 0.45 }),
    track('kick808', { name: 'Impact', at: [28, 36], len: 2, params: { base: 40, decay: 1.2, drive: 3 }, gain: 0.8 }),
  ],
};
