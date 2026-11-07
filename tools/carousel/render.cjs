// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Saves the carousel's ten slides as 1080×1350 PNGs.
//   node tools/carousel/render.cjs <out dir> [slides, e.g. 1,5,10]
// VIDEO=<served dir of b0000.jpg… from bg.cjs FRAMES=n> films every slide over the moving city instead:
// <out dir>/sNN/f0000.jpg…, one loop of n frames each. Slide n starts STEP frames (default 12) later in
// the loop than slide n-1, so the first frames, posted as stills, also move when the dots are scrubbed.
// Serve the repo as in tools/video/README.md (bg.jpg is the picture from bg.cjs).
const { chromium } = require('playwright');
const fs = require('fs');
const HOST = process.env.HOST || 'http://localhost:8124';
const out = process.argv[2] || '/tmp/qrv/carousel/out';
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const save = (file, data) => fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  p.on('console', (m) => console.log('page:', m.text())); p.on('pageerror', (e) => console.log('error:', e.message));
  await p.goto(`${HOST}/tools/carousel/slides.html`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 60000 });
  if (process.env.VIDEO) {
    const F = +process.env.FRAMES, STEP = +(process.env.STEP || 12);
    for (const n of only) fs.mkdirSync(`${out}/s${String(n).padStart(2, '0')}`, { recursive: true });
    for (let f = 0; f < F; f++) {
      await p.evaluate((u) => window.setBg(u), `${process.env.VIDEO}/b${String(f).padStart(4, '0')}.jpg`);
      for (const n of only) {
        const j = (((f - (n - 1) * STEP) % F) + F) % F;
        const data = await p.evaluate((n) => { window.slide(n); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, n);
        save(`${out}/s${String(n).padStart(2, '0')}/f${String(j).padStart(4, '0')}.jpg`, data);
      }
      if (f % 20 === 0) console.log('frame', f);
    }
  } else for (const n of only) {
    const data = await p.evaluate((n) => { window.slide(n); return document.getElementById('c').toDataURL('image/png'); }, n);
    save(`${out}/slide-${String(n).padStart(2, '0')}.png`, data);
    console.log('slide', n);
  }
  await b.close();
})();
