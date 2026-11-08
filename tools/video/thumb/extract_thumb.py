"""Cut the trend's thumb out of the reel, one sprite per screen-recording frame of one up/down cycle.

    python3 extract_thumb.py <reel.mov> [outdir]

The reel is a screen recording of the TikTok (1320x2868 at 59.94 fps). Frames 56..103 are one
whole cycle: frame 56 is where the thumb snaps up, frame 82 where it snaps down. Each sprite is
the thumb alone (white fill, black line art, transparent around it), already scaled and placed
for the 1080x1920 stage: x_out = x * S, y_out = (y - 2600) * S + 1920.

The thumb is found as everything the black outline closes off from the sky, so the TikTok
buttons, counts and caption drawn over the video (light glyphs with no outline) drop out. The
sprites are the reel's own art, so like the song they stay out of the repo (reel/ is ignored).
"""
import os, subprocess, sys, tempfile
import cv2, numpy as np
from scipy import ndimage

REEL = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reel')
FIRST, LAST = 56, 103
S, W, H = 1080 / 1320, 1080, 1920
BOTTOM = 2600  # the last row of the video above TikTok's bottom bar
EDGE = 1312
CIRCLE = (1202, 957, 96)  # the target ring, redrawn by the stage; masked out here

os.makedirs(OUT, exist_ok=True)
tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', REEL, '-vf', f'select=between(n\\,{FIRST}\\,{LAST})', '-vsync', '0',
                os.path.join(tmp, 'f%03d.png')], check=True)

def big(m, keep=15000):
    # The thumb's pieces: big, and running off the right or bottom edge (the title doesn't).
    lab, n = ndimage.label(m)
    if not n:
        return m
    sz = ndimage.sum(m, lab, range(1, n + 1))
    edge = set(np.unique(lab[:, EDGE - 1])) | set(np.unique(lab[BOTTOM - 1]))
    return np.isin(lab, [i + 1 for i in range(n) if sz[i] >= keep and (i + 1) in edge])


yy, xx = np.mgrid[0:2868, 0:1320]
ring = (xx - CIRCLE[0]) ** 2 + (yy - CIRCLE[1]) ** 2 <= CIRCLE[2] ** 2

for k in range(LAST - FIRST + 1):
    a = cv2.imread(os.path.join(tmp, f'f{k + 1:03d}.png'))[..., ::-1].astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = (r + g + b) / 3
    # Under the ring the art is darkened (the ring multiplies), so judge it by greyness there.
    sky = (b - r > 35) & ~(ring & (abs(b - r) < 14))
    sky = ndimage.binary_opening(sky, iterations=6)  # real sky only, not tinted glyph strokes
    line = (lum < 130) & (abs(b - r) < 40)
    # TikTok's white counts sit over the outline in places and break it; close those gaps.
    line = ndimage.binary_dilation(ndimage.binary_closing(line, iterations=8), iterations=2)
    line[BOTTOM:] = False
    # Everything reachable from the sky without crossing the outline is outside the thumb.
    free = ~line
    free[BOTTOM:] = False
    free[:, EDGE:] = False  # the screen edge closes the thumb off where it runs out of frame
    lab, _ = ndimage.label(free)
    seeds = np.unique(lab[sky & free])
    outside = np.isin(lab, seeds[seeds > 0])
    thumb = ~outside
    thumb[BOTTOM:] = False
    # Keep the thumb's pieces (it can run out of frame and back in), drop stray specks.
    thumb = big(thumb)
    # Shave off the glyph strokes the gap-closing glued to the outside of the outline.
    thumb = ndimage.binary_opening(thumb, iterations=4)
    thumb = big(thumb)
    thumb[:, EDGE:] = thumb[:, EDGE - 1:EDGE]  # carry it out to the edge
    thumb = ndimage.binary_fill_holes(thumb)
    # Line art: the real dark pixels inside the thumb (undilated), minus the music disc and any
    # other dark blobs near the bottom that are TikTok's, not the drawing.
    dark = (lum < 130) & (abs(b - r) < 40)
    art = ((lum < 105) | ndimage.binary_closing(dark, iterations=5)) & thumb
    inner = ndimage.binary_erosion(thumb, iterations=22)
    art &= ~(inner & (yy > 2250))
    # Light specks left outside the outline (bits of TikTok's glyphs) are cut off from the
    # thumb's inside by the line art: drop those small islands.
    lab, n = ndimage.label(thumb & ~art)
    if n:
        sz = ndimage.sum(thumb & ~art, lab, range(1, n + 1))
        thumb &= ~np.isin(lab, 1 + np.flatnonzero(sz < 4000))
        art &= ndimage.binary_dilation(thumb & ~art, iterations=40) | ndimage.binary_erosion(thumb, iterations=3)
    rgba = np.zeros((2868, 1320, 4), np.uint8)
    rgba[thumb] = (255, 255, 255, 255)
    rgba[art] = (0, 0, 0, 255)
    # The outline itself sits on the boundary; make sure the edge is drawn dark all round.
    edge = thumb & ~ndimage.binary_erosion(thumb, iterations=6)
    edge[:, 1314:] = False
    edge[BOTTOM - 6:] = False
    rgba[edge] = (0, 0, 0, 255)
    # Place on the stage.
    top = int(round(BOTTOM - H / S))
    crop = rgba[max(0, top):BOTTOM]
    pad = max(0, -top)
    if pad:
        crop = np.vstack([np.zeros((pad, 1320, 4), np.uint8), crop])
    # Premultiply for an even downscale, then undo.
    f = crop.astype(np.float32)
    f[..., :3] *= f[..., 3:4] / 255
    f = cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA)
    al = np.clip(f[..., 3:4], 1e-3, 255)
    f[..., :3] = np.where(al > 1, f[..., :3] * 255 / al, 0)
    out = np.clip(f, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(OUT, f't{k:02d}.png'), cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA))
print(f'wrote {LAST - FIRST + 1} sprites to {OUT}')
