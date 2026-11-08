# Toggle trend: the beagle edition

A 10.4 s vertical video (1080×1920, 30 fps) of the "flip the giant iOS switch" trend, animated from the
reference drawings themselves and timed to the song of the original reel:

- **0–1.9 s (intro):** in black and white he walks up to his doghouse. The switch is high up on the right.
- **1.9–4.3 s (the silence):** he jumps onto the edge of the roof (on the click at 2.65 s), scrambles up,
  stretches up on tiptoe and still can't reach, crouches…
- **4.3 s (the drop):** …and boops the switch with his nose at the top of a big jump. Colour grows out of
  it inside a rainbow ring: the flying ace on his red doghouse, scarf rippling, smoke puffs going by,
  his yellow bird looping round him (in front and behind). The doghouse stays put.
- **8.5 s (the gap):** the bird perches on the switch and pecks it off. Black and white again: he sits
  on his doghouse, grumpy, glaring up at the bird, an angry scribble over his head. The bird bolts.

The drawings aren't kept in the repo (nor is the song, nor the video). To render:

1. Put the four reference images in a folder as `A_stand.jpg` (standing), `B_ace.jpg` (flying ace on
   the doghouse), `C_astro.jpg` (astronaut on the red doghouse, with the moon) and `D_sit.jpg`
   (sitting on the roof, grumpy), plus `E_wood.png` (the bird, standing).
2. `python3 tools/snoopy/prep.py <that folder> <pieces folder>` cuts them into pieces with transparent
   backgrounds (the standing drawing into head, body and two legs for the puppet; the flying ace, his
   scarf and the smoke puffs; the doghouse in colour and in black and white; the moon; the sitting
   drawing), plus `pieces.json` with their anchor points. Link the pieces folder to `tools/snoopy/pieces`.
3. Serve the repo root (`python3 -m http.server 8125`) and run `node tools/snoopy/render.cjs <frames> 30 1080`.
4. `tools/snoopy/encode.sh <frames> <out.mp4> [screen recording of the original reel]` adds the song.

`stage.html` draws everything on a 2D canvas from those pieces: the standing puppet (legs swing at the hips, arms drawn in the same ink reach, grab the roof and tap the switch, the head
tilts, the body squashes and leans), the scarf drawn in thin rippling strips, the
bird drawing with its wing flapping (in black and white with an added outline), and the wipe between the two worlds. The
black-and-white world moves on twos (12 fps), like old cartoons.
