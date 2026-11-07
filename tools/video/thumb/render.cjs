// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Captures the thumb video frame by frame (1080×1920, 9:16).
//   node tools/video/thumb/render.cjs <outdir> [fps=30] [workers=2]   every frame (resumable)
//   node tools/video/thumb/render.cjs <outdir> stills 1,5,16.5          a few PNG stills
// Needs the repo served at HOST, with docs/ at /qr/ and tools/ at /tools/ (see ../README.md).
const { chromium } = require('playwright');
const fs = require('fs');
const HOST = process.env.HOST || 'http://localhost:8124';
const [out, a1 = '30', a2 = '2'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const ARGS = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
async function stage() {
  const b = await chromium.launch({ args: ARGS });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto(`${HOST}/tools/video/thumb/thumb.html`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 300000 });
  return { b, p };
}
const name = (f) => `${out}/f${String(f).padStart(5, '0')}.jpg`;
(async () => {
  if (a1 === 'stills') {
    const { b, p } = await stage();
    for (const T of a2.split(',').map(Number)) { await p.evaluate((T) => window.frame(T), T); await p.screenshot({ path: `${out}/still-${T}.png` }); }
    return b.close();
  }
  const fps = +a1, workers = +a2;
  const { b: b0, p: p0 } = await stage(); const dur = await p0.evaluate(() => window.DURATION); await b0.close();
  const todo = []; for (let f = 0; f < Math.round(dur * fps); f++) if (!fs.existsSync(name(f))) todo.push(f);
  console.log(`${todo.length} frames on ${workers} workers`);
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const { b, p } = await stage();
    while (next < todo.length) {
      const f = todo[next++];
      await p.evaluate((T) => window.frame(T), f / fps);
      await p.screenshot({ path: name(f), type: 'jpeg', quality: 93 });
      if (++done % 60 === 0) console.log(`${done}/${todo.length}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
    await b.close();
  }));
  console.log('done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
})();
