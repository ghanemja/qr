# Toggle trend: the beagle edition

A 10.4 s vertical video (1080×1920, 30 fps) of the "flip the giant iOS switch" trend, timed beat for beat
to the song of the original reel:

- **0–1.9 s (intro):** in 2D black and white, the beagle walks up to his doghouse. The switch is high on
  the wall above it.
- **1.9–4.3 s (the silence):** he jumps and grabs the edge of the roof (on the click at 2.65 s), dangles
  kicking, scrambles up to the ridge, stretches on tiptoe and still can't reach, crouches…
- **4.3 s (the drop):** …and a big jump taps the switch. A rainbow-edged wipe grows out of it into colourful 3D: he's in his
  astronaut flying-ace kit (leather cap and goggles, bubble helmet, red scarf, orange suit) and the red
  doghouse rockets through space past Saturn and the moon, while his little yellow bird, in its own
  bubble helmet, flies loops round him.
- **8.5 s (the gap):** the bird pecks the switch off and the world goes flat again. He glares up at
  the bird, brows down and frowning, shakes his fist under an angry scribble; the bird bolts, and he
  crosses his arms and fumes.

Files:

- `stage.html`: the three.js scene. `window.frame(t)` draws time `t`. Every mesh has a 2D material (flat
  ink on paper, outlined, stepped at 12 fps like old cartoons) and a 3D one (lit, coloured, shadows); the
  composite mixes the two passes inside the wipe circle centred on the switch knob. Head and body are
  blended-ellipsoid distance fields meshed into single smooth surfaces.
- `render.cjs`: films the frames with Playwright (`node tools/snoopy/render.cjs <dir> [fps] [width] [t1,t2…]`;
  with times it writes only those stills). Serve the repo root first: `python3 -m http.server 8125`.
- `encode.sh <frames> <out.mp4> [audio source]`: H.264, plus the song taken from the screen recording of
  the original reel when given (the song isn't kept in the repo). Without it the video is silent, ready
  for the trending sound to be added in the app.

Full render: about 2 min for the frames in the cloud container.
