// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Saves the carousel's ten slides as 1080×1350 PNGs.
//   node tools/carousel/render.cjs <out dir> [slides, e.g. 1,5,10]
// Serve the repo as in tools/video/README.md, (bg.jpg is the picture from bg.cjs).
const { chromium } = require('playwright');
const fs = require('fs');
const HOST = process.env.HOST || 'http://localhost:8124';
const out = process.argv[2] || '/tmp/qrv/carousel/out';
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  p.on('console', (m) => console.log('page:', m.text())); p.on('pageerror', (e) => console.log('error:', e.message));
  await p.goto(`${HOST}/tools/carousel/slides.html`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 60000 });
  for (const n of only) {
    const data = await p.evaluate((n) => { window.slide(n); return document.getElementById('c').toDataURL('image/png'); }, n);
    fs.writeFileSync(`${out}/slide-${String(n).padStart(2, '0')}.png`, Buffer.from(data.split(',')[1], 'base64'));
    console.log('slide', n);
  }
  await b.close();
})();
