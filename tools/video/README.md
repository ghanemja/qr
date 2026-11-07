# The QR Compass ad

A 68-second ad (and a 32-second cut of it) of the signature models, cut to a soundtrack made in
[Equalizer](https://ghanemja.github.io/equalizer/) (every sound is an equation).

- `stage.html`: the video's timeline. `window.frame(seconds)` draws any moment of it.
- `qrshot.html`: the QR moment, using the site's own QR world (`src/qrsculpture.js`): a model breaks
  into pixels that land as its real, scannable QR code, then rebuilds.
- `heroes.json`: the name and caption shown for each signature model.
- `render.cjs`: captures every frame with Playwright. The QR shot runs on a paused fake clock, so the
  morph lands on exact frames however slow the renderer is.
- `songs/`: four soundtracks on one bar map (`songs/plan.mjs`: 120 bpm, cuts on bar lines), so any of
  them fits the video: `house`, `synthwave`, `hiphop`, `chiptune`. `CUT=short` renders the 32 s version.
- `cut.mjs`: edits the 32 s cut out of the full cut's frames (no re-rendering).
- 'page' shots film the live site's pages on the same fake clock, with a caption pill.

```sh
npm run build                                   # docs/ must be current
git clone https://github.com/ghanemja/equalizer ../equalizer
node ../equalizer/examples/render.mjs tools/video/songs/house.mjs /tmp/qrv/house.wav
# serve the repo with docs/ at /qr/ and tools/ at /tools/ on port 8124, e.g.
#   mkdir -p /tmp/qrv/srv && ln -sfn "$PWD/docs" /tmp/qrv/srv/qr && ln -sfn "$PWD/tools" /tmp/qrv/srv/tools
#   (cd /tmp/qrv/srv && python3 -m http.server 8124 &)
node tools/video/render.cjs /tmp/qrv/stills stills 5,20,40   # a few PNG stills to check
node tools/video/render.cjs /tmp/qrv/frames 30 3              # every frame (resumable)
node tools/video/cut.mjs /tmp/qrv/frames /tmp/qrv/short        # the 32 s cut's frames
CUT=short node ../equalizer/examples/render.mjs tools/video/songs/house.mjs /tmp/qrv/house-short.wav
ffmpeg -framerate 30 -i /tmp/qrv/frames/f%05d.jpg -i /tmp/qrv/house.wav \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart qr-compass-ad.mp4
```

## The thumb video (`thumb/`)

A 20 s vertical (9:16, 1080×1920) take on the "put your thumb on the dot, feel the beat" trend. After
the opening card there are no words. The viewer holds a thumb on the dot: pixels rain and bounce off
it, the SpaceX booster lands on it, the Roadster jumps it, a scanner gets stuck on it, and then the
Starbucks world breaks into pixels that whirl around it and slam into a real QR code on the drop. The
dot sits on the code's lower right, and level-H error correction covers the thumb, so the code still
scans with the thumb on it (checked with ZXing on the final frame, with a simulated thumb).

```sh
node ../equalizer/examples/render.mjs tools/video/thumb/song.mjs /tmp/qrv/thumb.wav
node tools/video/thumb/render.cjs /tmp/qrv/thumb stills 1,5,16.5   # a few stills
node tools/video/thumb/render.cjs /tmp/qrv/frames 30 3             # every frame (about 2.5 min)
tools/video/encode.sh /tmp/qrv/frames /tmp/qrv/thumb.wav media/thumb/qr-thumb-dance-20s.mp4 16
```
