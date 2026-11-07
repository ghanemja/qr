# The "hold the dots and swipe" carousel

Ten 4:5 slides (1080×1350) for Instagram or LinkedIn. A torn sheet of paper rips open over QR Compass
a little more on every slide, so holding the dots and scrubbing plays it like a flipbook. The panel
under the paper tells the story one beat a slide (`STORY` in `slides.html`), aimed at people who'd
use the models: "Free 3D assets usually just sit there" (repeated on 2–4 while the rip opens),
"These move.", "261 of them", "Drop them in your game, your deck, your site", "Animated 3D model
asset store" (8–9), and "Comment for the link!". Slide 1 has the
"Hold the dots and swipe!" hint.

Finished files: `media/carousel/slide-01.jpg` … `slide-10.jpg`, plus `swipe-preview.mp4` (a quick
flip through, like scrubbing the dots) and `contact-sheet.jpg`.

```sh
# serve the repo as in tools/video/README.md (docs/ at /qr/, tools/ at /tools/, port 8124)
SHIFT=0,-260 DSF=1.5 node tools/carousel/bg.cjs /tmp/qrv/carousel 60.5   # the picture (saved as bg.jpg)
node tools/carousel/render.cjs /tmp/qrv/carousel/out                      # the ten slides as PNGs
```

`slides.html` draws everything on a canvas: the paper texture, the shared tear line, how far each
slide opens (`OPEN`) and the viewfinder with its two lines of text. Fonts: Archivo and Instrument Serif (Google
Fonts), Inter and JetBrains Mono.
