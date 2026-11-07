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

## Instagram Reels (`reel.html`)

A 20-second 9:16 reel (1080×1920) for one company, in one take with no words and no camera moves:
the site's own QR world in its normal iso view, the model's animation playing; at 6 s a mouse pointer
clicks it and it breaks into its real QR code (held long enough to scan off the screen); at 12.5 s
it clicks again, the model rebuilds and plays on (`qrshot.html?fmt=reel&click=1`). The music drops
on the first click. `TEXT=1` renders the older captioned version with close-ups (hook, captions,
end card), with the words kept clear of Instagram's own UI (top 220 px, bottom 420 px).
Each company's close-ups are a recipe in `RECIPES` in `reel.html`; only Amazon has one so far.

```sh
CUT=reel node ../equalizer/examples/render.mjs tools/video/songs/house.mjs /tmp/qrv/house-reel.wav
STAGE=reel SLUG=amazon node tools/video/render.cjs /tmp/qrv/reel-stills stills 1.5,3,5,7,17.5
STAGE=reel SLUG=amazon node tools/video/render.cjs /tmp/qrv/reel-amazon 30 3
# no flash or zoom punch, so plain ffmpeg rather than encode.sh
ffmpeg -framerate 30 -i /tmp/qrv/reel-amazon/f%05d.jpg -i /tmp/qrv/house-reel.wav -c:v libx264 -preset slow -crf 20 \
  -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart media/reels/amazon-house.mp4
```
