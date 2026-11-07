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

A 16.3 s vertical (9:16, 1080×1920, 60 fps) take on the "slide your thumb up, feel the beat" trend,
timed to the original reel's song: a beat every 0.4073 s from 0. The reel cuts every 8 beats, at
3.24, 6.49, 9.73 and 13.01 s, and its actions land on the beats in between.

- **The opening card** has the trend's look (sky blue, "SLIDE YOUR THUMB UP! FEEL THE BEAT
  (QR edition)"). A cartoon thumb bends at the knuckle and comes in from the bottom right: up on
  the even beats, down on the odd ones, like the reel's demo.
- **The montage** (beats 8–23) cuts on every beat. Up beats send something up: the Roadster off its
  ramp, the SpaceX booster lifting off (flown on a smooth climb), the Amazon drone, the pad rocket,
  the Starship. Down beats bring something down: the Berkshire snowball rolling down its slope, the
  booster landing, the Oreo dunk, General Mills cereal pouring, the Caterpillar digging. Each shot runs
  its world's clock at one steady rate (smooth) and drifts with the swipe.
- **Beats 24–31:** the Starbucks world is fired up into its QR code, slice by slice.
- **Beats 32–39:** the code jumps up and thumps down with confetti. The last frame scans (checked with
  ZXing).

The video in the repo has no audio track. Add the reel's song when posting; it starts with the video
at 0 s. The song's strongest hits sit about 35 ms ahead of the grid, so a version with the song
muxed in uses `adelay=35`.

```sh
node tools/video/thumb/render.cjs /tmp/qrv/thumb stills 1,4,9,13.5   # a few stills
node tools/video/thumb/render.cjs /tmp/qrv/frames 60 4               # every frame (about 5 min)
ffmpeg -framerate 60 -i /tmp/qrv/frames/f%05d.jpg -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -movflags +faststart media/thumb/qr-thumb-swipe-16s.mp4
```
