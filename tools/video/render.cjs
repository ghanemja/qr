// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// Captures the ad frame by frame: stage.html draws most shots; a 'qr' shot is the site's own
// QR world (qrshot.html), run on Playwright's fake clock so its morph lands on exact frames.
//   node tools/video/render.cjs <outdir> [fps=30] [workers=3]      every frame (resumable)
//   node tools/video/render.cjs <outdir> stills 3.1,12,30          a few stage frames, as PNGs
//   ONLY=page (or qr, or stage) node tools/video/render.cjs <outdir>   just those shots
// Needs the repo served at HOST (docs/ at /qr/, tools/ at /tools/; see README.md).
const { chromium } = require('playwright');
const fs = require('fs');
const HOST = process.env.HOST || 'http://localhost:8124';
const [out, a1 = '30', a2 = '3'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const ARGS = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
// FMT=portrait renders the 4:5 vertical cut (1080×1350) instead of 16:9 (1920×1080).
const PORTRAIT = process.env.FMT === 'portrait', VIEW = PORTRAIT ? { width: 1080, height: 1350 } : { width: 1920, height: 1080 };
const name = (f) => `${out}/f${String(f).padStart(5, '0')}.jpg`;

async function open(url, { clock = false } = {}) {
  const b = await chromium.launch({ args: ARGS });
  const p = await b.newPage({ viewport: VIEW, reducedMotion: 'no-preference' });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  if (clock) { await p.clock.install({ time: 0 }); await p.clock.pauseAt(1000); } // time moves only when we say
  await p.goto(HOST + url);
  return { b, p };
}
async function stage() {
  const { b, p } = await open(`/tools/video/stage.html${PORTRAIT ? '?fmt=portrait' : ''}`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  return { b, p };
}
async function shoot(p, T, file, type = 'jpeg') {
  await p.evaluate((T) => window.frame(T), T);
  await p.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 94 } : {}) });
}
// One QR shot, frame by frame on the fake clock (each step also renders the frames in between).
async function qrShot(shot, fps) {
  const first = Math.round(shot.t0 * fps), last = Math.round(shot.t1 * fps);
  if (fs.existsSync(name(last - 1))) return;
  const { b, p } = await open(`/tools/video/qrshot.html?slug=${shot.slug}`, { clock: true });
  for (let i = 0; i < 150 && !(await p.evaluate(() => !!window.world)); i++) await new Promise((r) => setTimeout(r, 200));
  await p.evaluate(() => document.fonts.ready);
  await p.clock.runFor(2600); // let the world grow in before the shot starts
  // The page's clock runs at window.rate(t) of the video's, so the shot can slow down for the morph.
  let page = 0, done = 0;
  for (let f = first; f < last; f++) {
    const t = (f - first) / fps, ms = Math.round(page);
    if (ms > done) await p.clock.runFor(ms - done);
    done = ms;
    await p.evaluate((t) => window.cue(t), t);
    await p.clock.runFor(1); done += 1; page += 1; // draw the cue's changes
    page += (1000 / fps) * (await p.evaluate((t) => (window.rate ? window.rate(t) : 1), t)) - 1;
    await p.screenshot({ path: name(f), type: 'jpeg', quality: 94 });
    if ((f - first) % 30 === 0) console.log(`qr ${shot.slug}: ${f - first}/${last - first}`);
  }
  await b.close();
}

// A page of the live site, filmed on the fake clock (scrolling down some), with the act and a
// caption in a pill laid over it.
const OVERLAY = `
  #ad-cap { position: fixed; z-index: 99999; pointer-events: none; left: 50%; bottom: 70px; transform: translateX(-50%); padding: 22px 40px; border-radius: 20px; background: rgba(23,32,44,.92); color: #fff; font: 700 48px/1.1 'Inter Display', Inter, sans-serif; letter-spacing: -1px; white-space: nowrap; box-shadow: 0 12px 40px rgba(0,0,0,.25); text-align: center; }
  #ad-cap small { display: block; margin-bottom: 10px; font: 700 24px/1 Inter, sans-serif; letter-spacing: 1.5px; text-transform: uppercase; color: #f0a46b; }`;
const SCROLL = { 'companies.html': 220, 'about.html': 700 };
async function pageShot(shot, fps) {
  const first = Math.round(shot.t0 * fps), last = Math.round(shot.t1 * fps);
  if (fs.existsSync(name(last - 1))) return;
  const { b, p } = await open(`/qr/${shot.page}`, { clock: true });
  await p.evaluate(() => document.fonts.ready);
  await p.clock.runFor(3500); // let the page draw and settle
  await p.addStyleTag({ content: OVERLAY });
  await p.evaluate(([act, cap]) => {
    document.body.insertAdjacentHTML('beforeend', `<div id="ad-cap"><small>${act[0]} · ${act[1]}</small>${cap}</div>`);
  }, [shot.act, shot.caption]);
  const scroll = SCROLL[shot.page] || 0;
  for (let f = first; f < last; f++) {
    const u = (f - first) / (last - first), e = u * u * (3 - 2 * u);
    await p.clock.runFor(Math.round(1000 / fps));
    await p.evaluate(([u, e, scroll]) => {
      window.scrollTo(0, e * scroll);
      const k = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
      document.getElementById('ad-cap').style.opacity = Math.min(k(u / 0.12), 1 - k((u - 0.9) / 0.1));
    }, [u, e, scroll]);
    await p.screenshot({ path: name(f), type: 'jpeg', quality: 94 });
  }
  console.log(`page ${shot.page} done`);
  await b.close();
}

(async () => {
  if (a1 === 'stills') {
    const { b, p } = await stage();
    for (const T of a2.split(',').map(Number)) { const t0 = Date.now(); await shoot(p, T, `${out}/still-${T}.png`, 'png'); console.log(T, Date.now() - t0, 'ms'); }
    return b.close();
  }
  const fps = +a1, workers = +a2, only = process.env.ONLY; // ONLY=page or ONLY=qr renders just those shots
  const { b: b0, p: p0 } = await stage();
  const [dur, shots] = await p0.evaluate(() => [window.DURATION, window.SHOTS]);
  await b0.close();
  const qr = shots.filter((s) => s.kind === 'qr'), pages = shots.filter((s) => s.kind === 'page');
  const isQR = (f) => [...qr, ...pages].some((s) => f >= Math.round(s.t0 * fps) && f < Math.round(s.t1 * fps));
  // NEED=a-b,c-d (seconds) renders only what those spans use, e.g. just the short cut's segments.
  const need = process.env.NEED && process.env.NEED.split(',').map((r) => r.split('-').map(Number));
  const wanted = (t0, t1) => !need || need.some(([a, b]) => t0 < b && t1 > a);
  for (const list of [qr, pages]) list.splice(0, list.length, ...list.filter((s) => wanted(s.t0, s.t1)));
  const todo = [];
  for (let f = 0; f < Math.round(dur * fps); f++) if (!isQR(f) && wanted(f / fps, (f + 1) / fps) && !fs.existsSync(name(f))) todo.push(f);
  console.log(`${todo.length} stage frames, ${qr.length} QR shot(s) and ${pages.length} page shot(s) to render on ${workers} workers`);
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all([
    ...(only && only !== 'qr' ? [] : qr.map((s) => qrShot(s, fps))),
    (async () => { if (!only || only === 'page') for (const s of pages) await pageShot(s, fps); })(),
    ...Array.from({ length: only && only !== 'stage' ? 0 : workers }, async () => {
      const { b, p } = await stage();
      while (next < todo.length) {
        const f = todo[next++];
        await shoot(p, f / fps, name(f));
        if (++done % 60 === 0) console.log(`${done}/${todo.length}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
      }
      await b.close();
    }),
  ]);
  console.log('done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
})();
