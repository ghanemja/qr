# The QR Compass ad

A 40-second ad of the signature models, cut to a soundtrack made in
[Equalizer](https://ghanemja.github.io/equalizer/) (every sound is an equation).

- `song.mjs`: the soundtrack (120 bpm, 20 bars; one bar = 2 s, and the video cuts on bar lines).
- `stage.html`: the video's timeline. `window.frame(seconds)` draws any moment of it.
- `heroes.json`: the name and caption shown for each signature model.
- `render.cjs`: captures the stage frame by frame with Playwright.

```sh
npm run build                                   # docs/ must be current
git clone https://github.com/ghanemja/equalizer ../equalizer
node ../equalizer/examples/render.mjs tools/video/song.mjs /tmp/qrv/song.wav
# serve the repo with docs/ at /qr/ and tools/ at /tools/ on port 8124, e.g.
#   mkdir -p /tmp/qrv/srv && ln -sfn "$PWD/docs" /tmp/qrv/srv/qr && ln -sfn "$PWD/tools" /tmp/qrv/srv/tools
#   (cd /tmp/qrv/srv && python3 -m http.server 8124 &)
node tools/video/render.cjs /tmp/qrv/stills stills 5,20,33   # a few PNG stills to check
node tools/video/render.cjs /tmp/qrv/frames 30 3              # every frame (resumable)
ffmpeg -framerate 30 -i /tmp/qrv/frames/f%05d.jpg -i /tmp/qrv/song.wav \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart qr-compass-ad.mp4
```
