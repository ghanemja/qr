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

A 15.8 s vertical (9:16, 1080×1920, 60 fps) take on the "slide your thumb up, feel the beat" trend,
timed to the "move your thumb to the beat" sound: a beat every 0.451 s from 0.035 s (fitted to its
beats, all within 22 ms), with its drop on beat 9 (4.09 s).

- **The opening card** is the first reel's: its sky blue, "SLIDE YOUR THUMB UP! FEEL THE BEAT", its
  target ring and its own thumb drawings. `extract_thumb.py` cuts the 48 drawings of one cycle out
  of that screen recording into `thumb/reel/` (the TikTok buttons and captions over them are
  removed). They're the reel's art, so like the song they stay out of the repo (`reel/` is
  git-ignored): run it before rendering.
- **The thumb** swipes up on the odd beats and down on the even ones on the opening card only.
- **The montage** (beats 9–24, from the drop) hard-cuts on every beat with a quick zoom snap, a
  different world each time. Up beats send something up: the Roadster off its ramp, the SpaceX
  booster lifting off, the Amazon drone, the pad rocket, Lockheed's jet lifting off its pad, the
  Starship, Disney's fireworks, the Goodyear blimp. Down beats bring something down: the Berkshire
  snowball, the Oreo dunk, the booster landing, General Mills cereal pouring, the McDonald's burger
  dropping together, the Heinz bottle flipping onto it, the oil pump nodding, the Caterpillar digging.
- **Beats 25–30, the morphs** use the site's QR world (`sculpture.js`: `docs/assets/qrsculpture.js`
  posed per frame, same pixel sampling, diagonal sweep, ink colours, plaza and camera). Each swipe
  up breaks the model into cube pixels that arc down onto the code's squares as the camera tilts to
  top-down; each swipe down rebuilds the next company from them (Caterpillar, Tesla, Amazon,
  Berkshire). Each morph takes 0.36 s, so it lands just before the next beat.
- **Beat 31**, the last swipe up, keeps the code. It hops with confetti to the end, and the last frame
  scans (ZXing).

The video in the repo has no audio track; add the sound when posting, starting with the video at
0 s. The clip of the sound we have is only 7.3 s long, so the preview with audio loops its 4-beat
bar after the drop (beats 9–13).

```sh
python3 tools/video/thumb/extract_thumb.py <the reel's screen recording .mov>  # once, makes thumb/reel/
node tools/video/thumb/render.cjs /tmp/qrv/thumb stills 1,4,9,13.5   # a few stills
node tools/video/thumb/render.cjs /tmp/qrv/frames 60 3               # every frame (about 5 min)
ffmpeg -framerate 60 -i /tmp/qrv/frames/f%05d.jpg -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -movflags +faststart media/thumb/qr-thumb-swipe-16s.mp4
```
