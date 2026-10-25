// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Captures tools/video/stage.html frame by frame, then encodes the ad with its soundtrack.
//   node tools/video/render.cjs <outdir> [fps=30] [workers=3] [from=0] [to=end]
//   node tools/video/render.cjs <outdir> stills 3.1,12,30   (just a few frames, as PNGs)
// Needs the stage served at STAGE (default http://localhost:8124/tools/video/stage.html),
// with docs/ at /qr/ (see tools/dev/serve.sh), and ffmpeg for the encode.
const { chromium } = require('playwright');
const fs = require('fs');
const STAGE = process.env.STAGE || 'http://localhost:8124/tools/video/stage.html';
const [out, a1 = '30', a2 = '3', a3, a4] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

async function page() {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto(STAGE);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  return { b, p };
}
async function shoot(p, T, file, type = 'jpeg') {
  await p.evaluate((T) => window.frame(T), T);
  await p.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 94 } : {}) });
}
(async () => {
  if (a1 === 'stills') {
    const { b, p } = await page();
    for (const T of a2.split(',').map(Number)) { const t0 = Date.now(); await shoot(p, T, `${out}/still-${T}.png`, 'png'); console.log(T, Date.now() - t0, 'ms'); }
    return b.close();
  }
  const fps = +a1, workers = +a2;
  const { b: b0, p: p0 } = await page();
  const dur = await p0.evaluate(() => window.DURATION); await b0.close();
  const from = +(a3 ?? 0), to = Math.min(+(a4 ?? Infinity), Math.round(dur * fps));
  const todo = [];
  for (let f = from; f < to; f++) if (!fs.existsSync(`${out}/f${String(f).padStart(5, '0')}.jpg`)) todo.push(f);
  console.log(`${todo.length} frames to render (${from}-${to}) on ${workers} workers`);
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const { b, p } = await page();
    while (next < todo.length) {
      const f = todo[next++];
      await shoot(p, f / fps, `${out}/f${String(f).padStart(5, '0')}.jpg`);
      if (++done % 30 === 0) console.log(`${done}/${todo.length}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
    await b.close();
  }));
  console.log('done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
})();
