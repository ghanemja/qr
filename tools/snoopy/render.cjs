// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Renders tools/snoopy/stage.html frame by frame. Serve the repo root at HOST first:
//   python3 -m http.server 8125   (from the repo root)
//   node tools/snoopy/render.cjs <outdir> [fps=30] [width=1080] [times]
// With times (e.g. "0,2.5,4.2"), only those stills are written, as PNGs.
const { chromium } = require('playwright');
const fs = require('fs');
const HOST = process.env.HOST || 'http://localhost:8125';
const [out, fps = '30', w = '1080', times] = process.argv.slice(2);
const W = +w, H = Math.round(W * 16 / 9), DUR = 12;
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  p.on('console', (m) => console.log('CONSOLE', m.text()));
  await p.goto(`${HOST}/tools/snoopy/stage.html?w=${W}`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 120000 });
  const list = times ? times.split(',').map(Number) : [...Array(Math.round(DUR * fps)).keys()].map((f) => f / fps);
  const t0 = Date.now();
  for (let i = 0; i < list.length; i++) {
    const file = times ? `${out}/t${list[i].toFixed(2)}.png` : `${out}/f${String(i).padStart(5, '0')}.png`;
    if (!times && fs.existsSync(file)) continue;
    await p.evaluate((t) => window.frame(t), list[i]);
    await p.screenshot({ path: file, type: 'png' });
    if (i % 30 === 0) console.log(`${i}/${list.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await b.close();
})();
