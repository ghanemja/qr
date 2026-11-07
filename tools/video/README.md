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

A 16.3 s vertical (9:16, 1080×1920) take on the "slide your thumb up, feel the beat" trend, cut to
the original reel's song (about 147.6 bpm; beat k falls at -0.04 + 0.4065k s, measured from the
reel's audio, and it cuts every two bars like the reel). Only the opening card has words. Every
swipe lands on a hit that launches something:
- **Roadster:** off its ramp, then down on its wheels, twice.
- **Rockets:** the SpaceX booster lifts off, then the launch-pad rocket climbs out of the frame.
- **Build:** the Starbucks world is fired up into its QR code, one slice per beat.
- **Finish:** the finished code bounces, with confetti, on the last swipes.

The models' own clocks are driven off the beat (`pw()` keyframes in `thumb.html`). The video has no
audio track: add the song where you post it (it starts with the video at 0 s). The last frame scans
(checked with ZXing).

```sh
node tools/video/thumb/render.cjs /tmp/qrv/thumb stills 1,4,9,13.5   # a few stills
node tools/video/thumb/render.cjs /tmp/qrv/frames 30 3               # every frame (about 2.5 min)
ffmpeg -framerate 30 -i /tmp/qrv/frames/f%05d.jpg -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -movflags +faststart media/thumb/qr-thumb-swipe-16s.mp4
```
