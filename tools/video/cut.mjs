// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Edits the 32 s cut out of the full cut's frames (no re-rendering), on the same bar lines as
// songs/plan.mjs with CUT=short. Each segment is [from, to] in seconds of the full cut.
//   node tools/video/cut.mjs <full frames dir> <short frames dir> [fps=30]
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
const [src, dst, fps = 30] = process.argv.slice(2);
const SEGMENTS = [
  [1.2, 3.2],                                  // title, already up in the first frame
  [4, 8], [10, 16],                            // Walmart, Nvidia · Tesla, SpaceX, Anthropic
  [25.2, 31.2],                                // the QR morph: shatter, the code, rebuild
  [32, 34], [40, 42],                          // QR world · the asset library
  [50, 52],                                    // startups: OpenAI, Stripe, Figure AI, Waymo
  [58, 62],                                    // the grid pulling back to all of them
  [62, 66],                                    // the end card
];
mkdirSync(dst, { recursive: true });
const name = (dir, f) => `${dir}/f${String(f).padStart(5, '0')}.jpg`;
let out = 0;
for (const [a, b] of SEGMENTS) for (let f = Math.round(a * fps); f < Math.round(b * fps); f++) {
  if (!existsSync(name(src, f))) throw new Error(`missing frame ${f}`);
  copyFileSync(name(src, f), name(dst, out++));
}
console.log(`${out} frames (${(out / fps).toFixed(2)} s)`);
