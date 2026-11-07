// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Renders reel-title.html as a transparent PNG to lay over a reel with ffmpeg (see README.md).
//   node tools/video/title.cjs <out.png>
const { chromium } = require('playwright');
const HOST = process.env.HOST || 'http://localhost:8124';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`${HOST}/tools/video/reel-title.html`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: process.argv[2] || '/tmp/qrv/title.png', omitBackground: true });
  await b.close();
})();
