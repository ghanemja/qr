// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// The bar map every ad soundtrack follows, so any of them drops into the video: 120 bpm, a bar
// is 2 s, and the video cuts on these bar lines. CUT=short gives the 32 s cut (cut.mjs edits it
// from the full one's frames); otherwise the full 64 s cut.
const SHORT = process.env.CUT === 'short';
export const BPM = 120, BARS = SHORT ? 18 : 35;
export const S = SHORT ? {
  intro: 'bar < 1',                    // title card
  a: 'bar >= 1 && bar < 6',            // 1 · Understand: five featured models
  qr: 'bar >= 6 && bar < 11',          // 2 · Scan: the QR morph (in slow motion) and the rebuild (breakdown)
  b: 'bar < 0',                        // (not in this cut)
  build: 'bar >= 11 && bar < 14',      // 3 · Explore: two pages, then a burst of companies, rising
  drop: 'bar >= 14 && bar < 16',       // the grid
  outro: 'bar >= 16',                  // end card
} : {
  intro: 'bar < 2',                    // title card
  a: 'bar >= 2 && bar < 12',           // 1 · Understand: featured models, one a bar
  qr: 'bar >= 12 && bar < 17',         // 2 · Scan: a model breaks into its QR code and back (breakdown)
  b: 'bar >= 17 && bar < 22',          // 3 · Explore & build: the site's pages
  build: 'bar >= 22 && bar < 28',      // fast cuts, then the startups, rising
  drop: 'bar >= 28 && bar < 32',       // every model in a grid
  outro: 'bar >= 32',                  // end card
};
export const any = (...keys) => keys.map((k) => `(${S[k]})`).join(' || ');
// The build's last bar: the kick drops out for a roll into the drop.
const last = SHORT ? 13 : 27, b0 = (last + 1) * 4 - 2;
export const KICK = `${any('a', 'b', 'drop')} || (${S.build} && beat < ${b0})`, KICK_ROLL = `bar == ${last} && beat < ${b0 + 1.5}`, ROLL = `bar == ${last}`, ROLL2 = `bar >= ${last - 1} && bar < ${last + 1}`;
// Moments in seconds: the first cut, the model shattering into pixels and rebuilding, the build, the drop, the end card.
export const AT = SHORT ? { first: 2, shatter: 13, rebuild: 17.6, build: 22, drop: 28, end: 32 } : { first: 4, shatter: 25, rebuild: 29.6, build: 44, drop: 56, end: 64 };
export const RISE = AT.drop - AT.build;
