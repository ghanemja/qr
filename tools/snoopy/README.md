# Toggle trend: the beagle edition

A 12 s vertical video (1080×1920, 30 fps) of the "flip the giant iOS switch" trend. A 2D black-and-white
cartoon beagle walks up to a blank wall, jumps and taps the switch. A rainbow-edged wipe grows out of it and turns the room, and
him, into colourful 3D, confetti and all, while his little yellow bird pops in and flies loops round him. He
does his happy dance and strolls off; the bird flips the switch back and the world goes flat again.

Final file: `media/snoopy/toggle-snoopy.mp4`.

- `stage.html`: the three.js scene. `window.frame(t)` draws time `t`. Every mesh has a 2D material (flat ink
  on paper, outlined, stepped at 12 fps like old cartoons) and a 3D one (lit, coloured, shadows); the
  composite mixes the two passes inside the wipe circle centred on the switch knob.
- `render.cjs`: films the frames with Playwright (`node tools/snoopy/render.cjs <dir> [fps] [width] [t1,t2…]`;
  with times it writes only those stills). Serve the repo root first: `python3 -m http.server 8125`.
- `music.mjs`: the original swing soundtrack plus effects, written as a WAV. The 2D parts play through an
  "old record" filter.
- `encode.sh <frames> <wav> <out.mp4>`: H.264 + AAC.

Full render: about 2.5 min for the frames in the cloud container.
