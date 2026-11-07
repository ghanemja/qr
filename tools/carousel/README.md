# The "hold the dots and swipe" carousel

Ten 4:5 slides (1080×1350) for Instagram or LinkedIn. A torn sheet of paper rips open over QR Compass
a little more on every slide, so holding the dots and scrubbing plays it like a flipbook. The panel
under the paper tells the story one beat a slide (`STORY` in `slides.html`), aimed at people who'd
use the models: "Free 3D assets usually just sit there" (repeated on 2–4 while the rip opens),
"These move.", "261 of them", "Drop them in your game, your deck, your site", "Animated 3D model
asset store" (8–9), and "Comment for the link!". Slide 1 has the
"Hold the dots and swipe!" hint.

The city under the paper moves: every model plays its animation. Finished files in `media/carousel/`:

- `slide-01.mp4` … `slide-10.mp4`: each slide as a 4 s video (Instagram carousels take video slides).
- `slide-01.jpg` … `slide-10.jpg`: stills. Each is taken 0.4 s later in the motion than the one
  before, so a carousel of stills also moves as the dots are scrubbed.
- `swipe-preview.mp4` (a quick flip through, one unbroken shot) and `contact-sheet.jpg`.

The picture shows Walmart up front, with Wells Fargo, Starbucks, Coca-Cola, Costco, Berkshire,
Amazon and Netflix behind (`FEATURE` swaps the defence lots out).

```sh
# serve the repo as in tools/video/README.md (docs/ at /qr/, tools/ at /tools/, port 8124)
F="walmart@-0.05,-0.6;starbucks@-0.46,0.21;wells-fargo@0.03,0.12"
SHIFT=0,-260 DSF=1.5 FEATURE="$F" node tools/carousel/bg.cjs /tmp/qrv/carousel 60.5            # still (bg.jpg)
SHIFT=0,-260 DSF=1.5 FEATURE="$F" FRAMES=120 node tools/carousel/bg.cjs /tmp/qrv/carousel 60.5  # 4 s of motion (~30 min)
ln -sfn /tmp/qrv/carousel/bg-60.5 /tmp/qrv/srv/cframes
VIDEO=/cframes FRAMES=120 node tools/carousel/render.cjs /tmp/qrv/carousel/vid   # every slide over every frame
tools/carousel/encode.sh /tmp/qrv/carousel/vid media/carousel                    # mp4s, stills, preview
node tools/carousel/render.cjs /tmp/qrv/carousel/out                             # (still PNGs from bg.jpg)
```

`slides.html` draws everything on a canvas: the paper texture, the shared tear line, how far each
slide opens (`OPEN`) and the viewfinder with its two lines of text. Fonts: Archivo and Instrument Serif (Google
Fonts), Inter and JetBrains Mono.
