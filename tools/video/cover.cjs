// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Video covers: a moment of the stage with the captions swapped for the headline.
//   node tools/video/cover.cjs <out dir>    (FMT=portrait for 4:5)
const { chromium } = require('playwright');
const HOST = process.env.HOST || 'http://localhost:8124', PORTRAIT = process.env.FMT === 'portrait';
const VIEW = PORTRAIT ? { width: 1080, height: 1350 } : { width: 1920, height: 1080 };
const out = process.argv[2] || '/tmp/qrv/covers';
const TEXT = `<div class="day">7 days of vibes: <b>Day 3</b></div>
  <div class="brand"><img src="/qr/assets/icon.svg">QR Compass</div>
  <h2>The economy,<br>built in 3D.</h2>
  <p>All of the Fortune 500 and 81 top startups, each a living 3D world. <b>See why every company wins, then scan it.</b></p>
  <div class="url">ghanemja.github.io/qr</div>`;
const CSS = `#cover { position: absolute; z-index: 9; display: flex; flex-direction: column; align-items: flex-start; text-align: left; }
  #cover h2 { margin: 0; font: 800 ${PORTRAIT ? 108 : 112}px/1.0 'Inter Display', Inter, sans-serif; letter-spacing: -3px; color: #17202c; }
  #cover p { margin: 26px 0 0; max-width: ${PORTRAIT ? 900 : 760}px; font: 500 ${PORTRAIT ? 36 : 34}px/1.35 Inter, sans-serif; color: #3d4757; }
  #cover p b { color: #17202c; } #cover .brand { display: flex; align-items: center; gap: 18px; margin-bottom: 30px; font: 800 46px/1 'Inter Display', Inter, sans-serif; color: #17202c; }
  #cover .brand img { width: 70px; height: 70px; } #cover .url { margin-top: 30px; font: 600 38px/1 'JetBrains Mono', monospace; color: #e07a3f; }
  #cover .day { margin-bottom: 26px; padding: 12px 24px; border-radius: 999px; background: #17202c; color: #f6f1e7; font: 700 28px/1 Inter, sans-serif; }
  #cover .day b { color: #f0a46b; } #shade { position: absolute; inset: 0; z-index: 8; pointer-events: none; }`;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: VIEW });
  await p.goto(`${HOST}/tools/video/stage.html${PORTRAIT ? '?fmt=portrait' : ''}`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 180000 });
  await p.addStyleTag({ content: CSS });
  // A: Disney's castle with its fireworks, the headline beside (or above) it. B: the grid, under a soft shade.
  for (const [name, T, shade, pos] of [
    ['model', 19.2, '', PORTRAIT ? 'left:72px;right:72px;top:70px' : 'left:96px;top:0;bottom:0;justify-content:center'],
    ['grid', 59.3, PORTRAIT ? 'linear-gradient(180deg,rgba(246,241,231,.96) 0%,rgba(246,241,231,.9) 48%,rgba(246,241,231,0) 72%)' : 'linear-gradient(90deg,rgba(246,241,231,.97) 0%,rgba(246,241,231,.92) 42%,rgba(246,241,231,0) 68%)',
      PORTRAIT ? 'left:72px;right:72px;top:70px' : 'left:96px;top:0;bottom:0;justify-content:center'],
  ]) {
    await p.evaluate((T) => window.frame(T), T);
    if (name === 'model') await p.evaluate((portrait) => (portrait ? window.shift(0, 330) : window.shift(330, 30)), PORTRAIT);
    // FEATURE=slug@x,y;slug@x,y… swaps those companies into the grid at those screen points (-1..1).
    if (name === 'grid' && process.env.FEATURE) for (const f of process.env.FEATURE.split(';')) {
      const [slug, at, t] = f.split('@'), [x, y] = at.split(',').map(Number);
      await p.evaluate(([slug, x, y, t]) => window.feature(slug, x, y, t), [slug, x, y, t ? +t : 4.4]);
    }
    // SHIFT=dx,dy slides the picture (pixels) to clear the text.
    if (name === 'grid' && process.env.SHIFT) await p.evaluate(([dx, dy]) => window.shift(dx, dy), process.env.SHIFT.split(',').map(Number));
    await p.evaluate(([html, shade, pos, portrait]) => {
      for (const id of ['cap', 'act', 'big']) document.getElementById(id).style.opacity = 0;
      document.getElementById('cover')?.remove(); document.getElementById('shade')?.remove();
      document.body.insertAdjacentHTML('beforeend', `<div id="shade" style="background:${shade}"></div><div id="cover" style="${pos}">${html}</div>`);
    }, [TEXT, shade, pos, PORTRAIT]);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${out}/cover-${name}${process.env.FEATURE && name === 'grid' ? '-featured' : ''}-${PORTRAIT ? '4x5' : '16x9'}.jpg`, type: 'jpeg', quality: 95 });
    console.log(name);
  }
  await b.close();
})();
