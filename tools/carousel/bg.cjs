// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// The carousel's hidden picture: clean 4:5 moments of the ad's stage (no captions).
//   node tools/carousel/bg.cjs <out dir> [t,t,...]   (serve as in tools/video/README.md)
const { chromium } = require('playwright');
const HOST = process.env.HOST || 'http://localhost:8124';
const out = process.argv[2] || '/tmp/qrv/carousel';
const times = (process.argv[3] || '59.3').split(',').map(Number);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: +(process.env.DSF || 1) });
  await p.goto(`${HOST}/tools/video/stage.html?fmt=portrait`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 180000 });
  for (const T of times) {
    await p.evaluate((T) => window.frame(T), T);
    await p.evaluate(() => { for (const el of document.querySelectorAll('#cap,#act,#big,.card')) el.style.opacity = 0; });
    if (process.env.SHIFT) await p.evaluate(([dx, dy]) => window.shift(dx, dy), process.env.SHIFT.split(',').map(Number));
    await p.screenshot({ path: `${out}/bg-${T}.png` });
    console.log('bg', T);
  }
  await b.close();
})();
