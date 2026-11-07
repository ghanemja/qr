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
    // FEATURE=slug@x,y[@t];… swaps those companies in for the grid model nearest each point (-1..1).
    if (process.env.FEATURE) for (const f of process.env.FEATURE.split(';')) {
      const [slug, at, t] = f.split('@'), [x, y] = at.split(',').map(Number);
      await p.evaluate(([slug, x, y, t]) => window.feature(slug, x, y, t), [slug, x, y, t ? +t : 4.4]);
    }
    await p.screenshot({ path: `${out}/bg-${T}.png` });
    console.log('bg', T);
    // FRAMES=n: also film n frames of everything moving (FPS, default 30) as bg-<T>/b0000.jpg…
    if (process.env.FRAMES) {
      const dir = `${out}/bg-${T}`, fps = +(process.env.FPS || 30);
      require('fs').mkdirSync(dir, { recursive: true });
      await p.evaluate(() => window.freeze());
      for (let i = 0; i < +process.env.FRAMES; i++) {
        const f = `${dir}/b${String(i).padStart(4, '0')}.jpg`;
        if (require('fs').existsSync(f)) continue;
        await p.evaluate((dt) => window.advance(dt), i / fps);
        await p.screenshot({ path: f, type: 'jpeg', quality: 92 });
        if (i % 20 === 0) console.log('frame', i);
      }
    }
  }
  await b.close();
})();
