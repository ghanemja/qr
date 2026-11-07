# The "hold the dots and swipe" carousel

Ten 4:5 slides (1080×1350) for Instagram or LinkedIn. A torn sheet of paper rips open over QR Compass
a little more on every slide, so holding the dots and scrubbing plays it like a flipbook. Slide 1 has
the "Hold the dots and swipe!" hint, slides 4–9 show the headline in a scanner viewfinder, and slide 10
ends on a real, scannable QR code to the site.

Finished files: `media/carousel/slide-01.jpg` … `slide-10.jpg`, plus `swipe-preview.mp4` (a quick
flip through, like scrubbing the dots) and `contact-sheet.jpg`.

```sh
# serve the repo as in tools/video/README.md (docs/ at /qr/, tools/ at /tools/, port 8124)
SHIFT=0,-260 DSF=1.5 node tools/carousel/bg.cjs /tmp/qrv/carousel 60.5   # the picture (saved as bg.jpg)
node tools/carousel/render.cjs /tmp/qrv/carousel/out                      # the ten slides as PNGs
```

`slides.html` draws everything on a canvas: the paper texture, the shared tear line, how far each
slide opens (`OPEN`), the viewfinder and the end card. Fonts: Archivo and Instrument Serif (Google
Fonts), Inter and JetBrains Mono.
