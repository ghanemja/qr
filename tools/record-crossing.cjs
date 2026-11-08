// Records docs/crossing.html to PNG frames, one per 12 fps animation step, on a paused clock so
// timing is exact however slow the screenshots are. Serve docs/ first, e.g.
//   (cd docs && python3 -m http.server 8765) &
//   node tools/record-crossing.cjs /tmp/frames 433
//   ffmpeg -framerate 12 -start_number 1 -i /tmp/frames/%04d.png -vf scale=720:-2 \
//     -c:v libx264 -pix_fmt yuv420p -crf 26 -preset slow -r 24 -movflags +faststart media/crossing/snoopy-crossing.mp4
// Frame 0 is blank (before the first draw), hence -start_number 1. The buttons are hidden.
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const n = Number(process.argv[3] || 433);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await p.clock.install({ time: 0 });
  await p.clock.pauseAt(1000);
  await p.goto(process.env.URL || 'http://localhost:8765/crossing.html');
  await p.addStyleTag({ content: '.bar{display:none !important}' });
  await p.evaluate(() => document.fonts.ready);
  for (let i = 0; i < n; i++) {
    await p.clock.runFor(1000 / 12);
    await p.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.png` });
  }
  await b.close();
})();
