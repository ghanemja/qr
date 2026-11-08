# SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
"""Cut the reference drawings into the pieces the animation moves.

    python3 tools/snoopy/prep.py <src dir> <out dir>

<src dir> holds the four reference images (not kept in the repo):
  A_stand.jpg  standing, black and white        -> the walking/climbing/jumping puppet
  B_ace.jpg    the flying ace on his doghouse   -> the colour part (body, scarf, smoke puffs)
  C_astro.jpg  the astronaut on the red doghouse -> the doghouse (colour and black and white), the moon
  D_sit.jpg    sitting on the roof, grumpy      -> the ending
  E_wood.png   the bird, standing               -> the bird (its wing cut out to flap)
Each piece is a PNG with the background made transparent: the background is the light area connected
to the crop's border, so everything inside the ink outlines stays. pieces.json gives each piece's
size and the anchor points the stage lines up.
"""
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PAPER = np.array([245, 241, 230]); INK = np.array([22, 22, 22])
meta = {}

def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.float32)

def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114

def cutout(a, box, ink_t=120, seeds=None, close=1):
    """Crop, and make the background (light, connected to the border or to seeds) transparent."""
    x0, y0, x1, y1 = box
    c = a[y0:y1, x0:x1].copy()
    ink = lum(c) < ink_t
    if close: ink = ndimage.binary_dilation(ink, iterations=close)   # close hairline gaps in the outline
    lab, n = ndimage.label(~ink)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) if seeds is None else set(lab[y - y0, x - x0] for x, y in seeds)
    edge.discard(0)
    bg = np.isin(lab, list(edge))
    bg = ndimage.binary_erosion(bg, iterations=close)                    # give the outline its width back
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(0.7)))
    return c, alpha

def ink_paper(c, hi=200):
    """Black and white: ink stays ink, everything lighter becomes paper (keeps the anti-aliasing)."""
    k = np.clip((lum(c) - 40) / (hi - 40), 0, 1)[..., None]
    return INK * (1 - k) + PAPER * k

def save(name, rgb, alpha, **anchors):
    im = Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), alpha]), 'RGBA')
    im.save(os.path.join(OUT, name + '.png'))
    meta[name] = {'w': im.width, 'h': im.height, **anchors}

def keep(alpha, poly, box, inside=True):
    """Keep only the part of the cutout inside (or outside) a polygon given in source coordinates."""
    x0, y0 = box[0], box[1]
    m = Image.new('L', (alpha.shape[1], alpha.shape[0]), 0)
    ImageDraw.Draw(m).polygon([(x - x0, y - y0) for x, y in poly], fill=255)
    m = np.asarray(m) > 0
    return np.where(m if inside else ~m, alpha, 0).astype(np.uint8)

# ---- A: the standing puppet: head, body, two legs (all on the same canvas, so they line up) ----
A = load('A_stand.jpg'); box = (72, 38, 796, 958)
c, al = cutout(A, box, seeds=[(110, 120), (700, 700), (600, 920), (110, 600), (520, 120)])
rgb = ink_paper(c)
HEAD = [(72, 38), (796, 38), (796, 520), (470, 520), (440, 540), (345, 540), (300, 520), (72, 520)]
LEGL = [(72, 842), (306, 842), (306, 958), (72, 958)]
LEGR = [(306, 842), (796, 842), (796, 958), (306, 958)]
body = keep(keep(keep(al, HEAD, box, False), LEGL, box, False), LEGR, box, False)
o = lambda x, y: [x - box[0], y - box[1]]
save('A_head', rgb, keep(al, HEAD, box), pivot=o(392, 535))
save('A_body', rgb, body, feet=o(300, 948), shoulder=o(430, 600), hip=o(300, 842))
save('A_legL', rgb, keep(al, LEGL, box), pivot=o(222, 842))
save('A_legR', rgb, keep(al, LEGR, box), pivot=o(352, 842))

# ---- B: the flying ace (without his roof), his scarf, three smoke puffs ----
B = load('B_ace.jpg'); box = (160, 228, 668, 757)
c, al = cutout(B, box, seeds=[(170, 240), (660, 240), (300, 700), (640, 700), (200, 470)])
red = (c[..., 0] > 150) & (c[..., 1] < 110) & (c[..., 2] < 110)
roof = np.zeros_like(red); roof[(749 - box[1]):] = True
al = np.where(red & roof, 0, al).astype(np.uint8)
SCARF = [(160, 495), (440, 495), (452, 560), (440, 618), (160, 618)]
o = lambda x, y: [x - box[0], y - box[1]]
body = keep(keep(al, SCARF, box, False), [(160, 228), (240, 228), (240, 480), (160, 480)], box, False); lab, n = ndimage.label(body > 0); big = np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1
save('B_ace', c, np.where(lab == big, body, 0).astype(np.uint8), seat=o(470, 752))  # only him, not a puff's corner
save('B_scarf', c, keep(al, SCARF, box), root=o(445, 545))
for i, pb in enumerate([(74, 345, 210, 462), (750, 620, 876, 730)]):  # the third puff's outline is too open to fill
    x0, y0, x1, y1 = pb; cc = B[y0:y1, x0:x1].copy()
    fig = ndimage.binary_fill_holes(ndimage.binary_dilation(lum(cc) < 120, iterations=4))   # its outline has gaps
    fig = ndimage.binary_erosion(fig, iterations=3)
    aa = np.where(fig, 255, 0).astype(np.uint8)
    save(f'puff{i}', cc, aa)

# ---- C: the doghouse (colour and black and white) and the moon ----
C = load('C_astro.jpg'); box = (255, 793, 1062, 1485)
c, al = cutout(C, box)
im = Image.fromarray(np.dstack([c.astype(np.uint8), al]), 'RGBA')
ImageDraw.Draw(im).line([(405 - box[0], 797 - box[1]), (918 - box[0], 799 - box[1])], fill=(18, 18, 18, 255), width=10)
c, al = np.asarray(im)[..., :3].astype(np.float32), np.asarray(im)[..., 3]
o = lambda x, y: [x - box[0], y - box[1]]
anch = dict(roof=o(662, 797), ground=o(662, 1460), roofL=o(410, 797), roofR=o(915, 797))
save('C_house', c, al, **anch)
save('C_house_bw', ink_paper(c, 95), al, **anch)
cc, aa = cutout(C, (872, 102, 1122, 358), ink_t=200)
save('C_moon', cc, aa)

# ---- D: sitting on his roof, grumpy (black and white) ----
D = load('D_sit.jpg'); box = (540, 18, 912, 466)
c, al = cutout(D, box, seeds=[(545, 25), (905, 25), (545, 300), (905, 400)])
save('D_sit', ink_paper(c), al, seat=[727 - box[0], 459 - box[1]])

# ---- E: the bird, with its wing as a separate piece so it can flap ----
E = load('E_wood.png')
al = np.where((E.min(axis=2) > 232), 0, 255).astype(np.uint8)          # the background is plain white
al = np.asarray(Image.fromarray(al).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(0.6)))
box = (0, 0, E.shape[1], E.shape[0])
WING = [(30, 322), (171, 322), (174, 360), (152, 392), (126, 409), (30, 409)]
ring = ndimage.binary_dilation(al > 128, iterations=4) & ~(al > 128)     # in black and white the tuft's yellow edge needs a line
for bw in (0, 1):
    rgb = ink_paper(E, 150) if bw else E
    if bw: rgb = np.where(ring[..., None], INK, rgb); al = np.where(ring, 255, al).astype(np.uint8)
    sfx = '_bw' if bw else ''
    save('E_wood' + sfx, rgb, keep(al, WING, box, False), head=[200, 160], feet=[225, 432])
    save('E_wing' + sfx, rgb, keep(al, WING, box), pivot=[166, 352])

json.dump(meta, open(os.path.join(OUT, 'pieces.json'), 'w'), indent=1)
print(json.dumps(meta))
