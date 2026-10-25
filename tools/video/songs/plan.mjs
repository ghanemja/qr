// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// The bar map every ad soundtrack follows, so any of them drops into the video: 120 bpm, a bar
// is 2 s, and the video cuts on these bar lines. CUT=short gives the 32 s cut (cut.mjs edits it
// from the full one's frames); otherwise the full 64 s cut.
const SHORT = process.env.CUT === 'short';
export const BPM = 120, BARS = SHORT ? 16 : 34;
export const S = SHORT ? {
  intro: 'bar < 1',                    // title card
  a: 'bar >= 1 && bar < 6',            // 1 · Understand: five featured models
  qr: 'bar >= 6 && bar < 9',           // 2 · Scan: the QR morph (breakdown)
  b: 'bar < 0',                        // (not in this cut)
  build: 'bar >= 9 && bar < 12',       // 3 · Explore: two pages, then a burst of startups, rising
  drop: 'bar >= 12 && bar < 14',       // the grid
  outro: 'bar >= 14',                  // end card
} : {
  intro: 'bar < 2',                    // title card
  a: 'bar >= 2 && bar < 12',           // 1 · Understand: featured models, one a bar
  qr: 'bar >= 12 && bar < 16',         // 2 · Scan: a model breaks into its QR code and back (breakdown)
  b: 'bar >= 16 && bar < 21',          // 3 · Explore & build: the site's pages
  build: 'bar >= 21 && bar < 27',      // fast cuts, then the startups, rising
  drop: 'bar >= 27 && bar < 31',       // every model in a grid
  outro: 'bar >= 31',                  // end card
};
export const any = (...keys) => keys.map((k) => `(${S[k]})`).join(' || ');
// The build's last bar: the kick drops out for a roll into the drop.
const last = SHORT ? 11 : 26, b0 = (last + 1) * 4 - 2;
export const KICK = `${any('a', 'b', 'drop')} || (${S.build} && beat < ${b0})`, KICK_ROLL = `bar == ${last} && beat < ${b0 + 1.5}`, ROLL = `bar == ${last}`, ROLL2 = `bar >= ${last - 1} && bar < ${last + 1}`;
// Moments in seconds: the first cut, the model shattering into pixels and rebuilding, the build, the drop, the end card.
export const AT = SHORT ? { first: 2, shatter: 12.8, rebuild: 16.3, build: 18, drop: 24, end: 28 } : { first: 4, shatter: 26, rebuild: 29.5, build: 42, drop: 54, end: 62 };
export const RISE = AT.drop - AT.build;
