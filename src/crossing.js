// Snoopy Crossing: a crayon crosswalk seen from above. Snoopy, upright on two feet (black ear,
// black nose, red collar), is walked across a zebra crossing among walkers and bikes; a little yellow bird
// tags along. Everything is drawn in 2D canvas as wobbly crayon shapes, re-jittered a few
// times a second ("line boil") and stepped at 12 fps so it reads like stop-motion, then a
// paper grain is punched out of the whole frame so the wax looks patchy.
(() => {
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  const tagEl = document.getElementById('tag');
  const hintEl = document.getElementById('hint');

  const FPS = 12;              // stop-motion step
  const ROT = 0.2;             // crosswalk tilt (radians); world "up" points up-right on screen
  const COS = Math.cos(ROT), SIN = Math.sin(ROT);
  const STRIPE_H = 46, STRIPE_P = 84;
  const END_ZOOM = 1.8;        // the wide shot after the pull-back
  const DOG = 1;               // extra scale for Snoopy (his own size is set by SNOOPY_K)

  // ---------- seeded randomness (so a shape jitters the same way within one boil frame) ----------
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hash = (...n) => { let h = 2166136261; for (const v of n) { h ^= (v | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); } return h; };
  let boil = 0;
  const rngFor = (...n) => mulberry(hash(...n, boil));
  const R = Math.random;
  const pick = (a) => a[Math.floor(R() * a.length)];

  // ---------- sizing ----------
  let W = 0, H = 0, dpr = 1, base = 1, halfCW = 150, grain = null;
  function resize() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    if (W * H * dpr * dpr > 3.2e6) dpr = Math.sqrt(3.2e6 / (W * H));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    base = Math.min(W / 420, H / 760);
    halfCW = Math.max(150, (W / base) * 0.36);
    makeGrain();
  }
  function makeGrain() {
    const g = document.createElement('canvas');
    g.width = g.height = 220;
    const gx = g.getContext('2d');
    const im = gx.createImageData(220, 220);
    for (let i = 0; i < im.data.length; i += 4) {
      const r = Math.random();
      im.data[i + 3] = r < 0.2 ? 120 + Math.random() * 135 : r < 0.32 ? 50 : 0;
    }
    gx.putImageData(im, 0, 0);
    grain = ctx.createPattern(g, 'repeat');
  }

  // ---------- camera ----------
  const cam = { x: 0, y: 0, zoom: 1 };
  const S = () => base * cam.zoom;
  function toScreen(wx, wy) {
    const dx = wx - cam.x, dy = wy - cam.y, s = S();
    return [W / 2 + (dx * COS - dy * SIN) * s, H * 0.52 + (dx * SIN + dy * COS) * s];
  }
  const viewRadius = () => 0.5 * Math.hypot(W, H) / S() + 50;

  // ---------- crayon primitives (in whatever transform is current) ----------
  function wobblyEllipse(rng, cx, cy, rx, ry, rot = 0, j = 0.08) {
    const n = 16, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, k = 1 + (rng() * 2 - 1) * j;
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  }
  function wobblyPoly(rng, pts, j) {
    return pts.map(([x, y]) => [x + (rng() * 2 - 1) * j, y + (rng() * 2 - 1) * j]);
  }
  function tracePts(pts) {
    ctx.beginPath();
    // smooth closed curve through the points
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = mid(p, pts[(i + 1) % n]); ctx.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
    ctx.closePath();
  }
  // Fill a shape with wax: a base coat, a few scribbles clipped inside, and a fuzzy edge.
  function crayon(rng, pts, color, opt = {}) {
    const { dark = 'rgba(0,0,0,0.18)', light = 'rgba(255,255,255,0.18)', edge = 0.9, alpha = 0.95 } = opt;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    tracePts(pts); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.lineCap = 'round';
    const span = Math.max(x1 - x0, y1 - y0), step = Math.max(1.3, span / 9);
    for (const [col, off] of [[dark, 0], [light, step / 2]]) {
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, step * 0.55); ctx.beginPath();
      for (let d = -span + off; d < span * 2; d += step) {
        const jx = (rng() - 0.5) * step, jy = (rng() - 0.5) * step;
        ctx.moveTo(x0 + d + jx, y1 + 1 + jy); ctx.lineTo(x0 + d - span * 0.55 + jx, y0 - 1 - jy);
      }
      ctx.stroke();
    }
    ctx.restore();
    if (edge) {
      ctx.strokeStyle = color; ctx.lineWidth = edge; ctx.lineJoin = 'round';
      tracePts(wobblyPoly(rng, pts, edge * 0.7)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function crayonLine(rng, pts, color, width, j = 0.35) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.globalAlpha = pass ? 0.55 : 0.95;
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const px = x + (rng() * 2 - 1) * j, py = y + (rng() * 2 - 1) * j;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function outline(rng, pts, width = 0.9, color = '#2b2826') {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.9; tracePts(wobblyPoly(rng, pts, 0.35)); ctx.stroke(); ctx.globalAlpha = 1;
  }

  // ---------- the street ----------
  function drawStreet() {
    const s = S(), rad = viewRadius();
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * W / 2, dpr * H * 0.52);
    ctx.rotate(ROT);
    ctx.translate(-cam.x, -cam.y);
    // asphalt: diagonal charcoal hatching anchored to world cells
    const cell = 13;
    const gx0 = Math.floor((cam.x - rad) / cell), gx1 = Math.ceil((cam.x + rad) / cell);
    const gy0 = Math.floor((cam.y - rad) / cell), gy1 = Math.ceil((cam.y + rad) / cell);
    ctx.lineCap = 'round';
    const tones = [['rgba(62,62,64,0.62)', 3.2], ['rgba(95,94,92,0.5)', 2.4], ['rgba(40,40,44,0.45)', 1.8]];
    tones.forEach(([col, lw], t) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) {
        const r = mulberry(hash(gx, gy, t, boil));
        if (t === 2 && r() < 0.6) continue;
        const x = gx * cell + r() * cell, y = gy * cell + r() * cell;
        const a = -1.05 + (r() - 0.5) * 0.35, L = 18 + r() * 26;
        ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      }
      ctx.stroke();
    });
    // zebra stripes: cream bars with a sketchy double outline
    const k0 = Math.floor((cam.y - rad) / STRIPE_P), k1 = Math.ceil((cam.y + rad) / STRIPE_P);
    for (let k = k0; k <= k1; k++) {
      const rng = rngFor(k, 77);
      const y = k * STRIPE_P, x0 = -halfCW, x1 = halfCW;
      const pts = [];
      const n = Math.max(6, Math.round(halfCW / 25));
      for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y]);
      pts.push([x1 + 2, y + STRIPE_H / 2]);
      for (let i = n; i >= 0; i--) pts.push([x0 + (x1 - x0) * i / n, y + STRIPE_H]);
      pts.push([x0 - 2, y + STRIPE_H / 2]);
      const fill = wobblyPoly(rng, pts, 1.6);
      ctx.fillStyle = '#efe6d3'; tracePts(fill); ctx.fill();
      ctx.save(); tracePts(fill); ctx.clip();
      ctx.strokeStyle = 'rgba(214,200,175,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let d = x0 - 40; d < x1 + 40; d += 7) { ctx.moveTo(d + rng() * 4, y + STRIPE_H + 2); ctx.lineTo(d + 20 + rng() * 4, y - 2); }
      ctx.stroke(); ctx.restore();
      ctx.strokeStyle = '#2f2d2b'; ctx.lineJoin = 'round';
      for (let pass = 0; pass < 2; pass++) {
        ctx.lineWidth = pass ? 1.4 : 2.6; ctx.globalAlpha = pass ? 0.6 : 0.9;
        tracePts(wobblyPoly(rng, fill, pass ? 1.4 : 0.6)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---------- characters ----------
  const SHIRTS = ['#d8322b', '#2f5fd0', '#ef8a1f', '#7a3fb0', '#f2c230', '#2aa39a', '#3c9a43', '#e2577a', '#c62f2a', '#4b4bd6'];
  const PANTS = ['#3540c9', '#2b2b6e', '#55361e', '#2a2a2a', '#6a6f78', '#2f5fd0', '#7a3fb0', '#1f6e5e'];
  const SKIN = ['#f0b48a', '#d9905e', '#a8673f', '#7a4a2b', '#f3c6a0', '#c98a5b'];
  const HAIR = ['#2a1d16', '#4b2e1a', '#1c1c1c', '#8a5a2b', '#c9a35a', '#6b1f1a'];
  const SHADOW = 'rgba(26,78,88,0.55)';

  function drawShadow(rng, w, len) {
    const pts = [[-w * 0.6, 0], [w * 0.7, -1], [w * 0.6 + len, len * 0.42], [-w * 0.2 + len * 0.8, len * 0.5]];
    crayon(rng, wobblyPoly(rng, pts, 1.2), SHADOW, { dark: 'rgba(10,40,48,0.25)', light: 'rgba(255,255,255,0.05)', edge: 1.2, alpha: 0.85 });
  }

  function drawPerson(p, rng, sw) {
    const dir = p.dir; // -1 walking away (up), 1 towards (down)
    const lift = Math.abs(sw) * 0.6;
    // legs
    crayonLine(rng, [[-2, -12], [-2.4 + sw * 0.4, -5], [-2.6, 0 + sw * 1.8 * dir]], p.pants, 3.6);
    crayonLine(rng, [[2, -12], [2.4 - sw * 0.4, -5], [2.6, 0 - sw * 1.8 * dir]], p.pants, 3.6);
    crayon(rng, wobblyEllipse(rng, -2.7, 0.6 + sw * 1.8 * dir, 1.8, 1.1), '#222', { edge: 0.4 });
    crayon(rng, wobblyEllipse(rng, 2.7, 0.6 - sw * 1.8 * dir, 1.8, 1.1), '#222', { edge: 0.4 });
    // bag behind / beside
    if (p.bag && dir < 0) crayon(rng, wobblyPoly(rng, [[3, -21 - lift], [7, -20.5 - lift], [7, -13 - lift], [3, -13.5 - lift]], 0.4), p.bag);
    // torso
    const ty = -lift;
    crayon(rng, wobblyPoly(rng, [[-5, -22.5 + ty], [5, -22.5 + ty], [4.4, -10.5 + ty], [-4.4, -10.5 + ty]], 0.5), p.shirt);
    // arms swing opposite to legs
    crayonLine(rng, [[-4.6, -21 + ty], [-6, -16 + ty], [-5.8, -12.5 + ty - sw * 1.6 * dir]], p.shirt, 2.7);
    crayonLine(rng, [[4.6, -21 + ty], [6, -16 + ty], [5.8, -12.5 + ty + sw * 1.6 * dir]], p.shirt, 2.7);
    crayon(rng, wobblyEllipse(rng, -5.8, -12 + ty - sw * 1.6 * dir, 1.2, 1.2), p.skin, { edge: 0.3 });
    crayon(rng, wobblyEllipse(rng, 5.8, -12 + ty + sw * 1.6 * dir, 1.2, 1.2), p.skin, { edge: 0.3 });
    if (p.bag && dir > 0) crayon(rng, wobblyPoly(rng, [[5, -15 + ty], [9, -15 + ty], [9.4, -9 + ty], [4.8, -9 + ty]], 0.4), p.bag);
    // head
    crayon(rng, wobblyEllipse(rng, 0, -26.5 + ty, 3.9, 4.1), p.skin, { edge: 0.5 });
    if (dir < 0) crayon(rng, wobblyEllipse(rng, 0, -27.2 + ty, 4, 3.6), p.hair, { edge: 0.6 });
    else crayon(rng, wobblyPoly(rng, [[-4, -27 + ty], [-3, -30.5 + ty], [0, -31.4 + ty], [3, -30.5 + ty], [4, -27 + ty], [0, -28.5 + ty]], 0.4), p.hair, { edge: 0.5 });
    if (p.hat) crayon(rng, wobblyPoly(rng, [[-4.2, -29.5 + ty], [-3, -32.5 + ty], [3, -32.5 + ty], [4.2, -29.5 + ty]], 0.4), p.hat);
  }

  function drawBike(p, rng, ph) {
    const f = p.dir < 0 ? 1 : -1; // facing right when riding up the screen
    ctx.scale(f, 1);
    const wheel = (cx) => {
      ctx.strokeStyle = '#2b2826'; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.9;
      tracePts(wobblyEllipse(rng, cx, -4.6, 4.6, 4.6, 0, 0.06)); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.globalAlpha = 0.6;
      tracePts(wobblyEllipse(rng, cx, -4.6, 4.2, 4.2, 0, 0.08)); ctx.stroke();
      ctx.globalAlpha = 1;
    };
    wheel(-8.5); wheel(8.5);
    const crank = [Math.cos(ph) * 2.2, -5 + Math.sin(ph) * 2.2], crank2 = [-crank[0], -10 - crank[1]];
    crayonLine(rng, [[-8.5, -4.6], [-1, -5], [6, -11], [-3, -12], [-1, -5]], p.frame, 1.3, 0.2);
    crayonLine(rng, [[8.5, -4.6], [6, -13.5], [3.5, -14.5]], p.frame, 1.3, 0.2);
    // rider
    crayonLine(rng, [[-3, -13], [1 + crank2[0] * 0.5, -9], [crank2[0], crank2[1]]], p.pants, 3);
    crayonLine(rng, [[-3, -13], [1.5 + crank[0] * 0.5, -9], [crank[0], crank[1]]], p.pants, 3.2);
    crayon(rng, wobblyPoly(rng, [[-5, -13.5], [-1.5, -12.5], [3, -22], [-1, -23.5]], 0.4), p.shirt);
    crayonLine(rng, [[1.5, -21.5], [4.5, -17], [4, -14.5]], p.shirt, 2.4);
    crayon(rng, wobblyEllipse(rng, 2.6, -26.6, 3.6, 3.8), p.skin, { edge: 0.5 });
    crayon(rng, wobblyEllipse(rng, 1.8, -28.6, 3.8, 2.4), p.hat || p.hair, { edge: 0.5 });
  }

  // Snoopy, standing in 3/4 view facing right. Shapes are SVG paths in a 801x1055 reference box
  // (feet on y=940, centre of the feet at x=300); SNOOPY_K scales that box to world units.
  const SNOOPY_K = 34 / 895;
  const SN = {
    head: new Path2D('M 300 380 C 220 300 230 150 330 80 C 370 55 430 45 480 65 C 505 75 515 90 512 110 C 515 160 530 195 580 210 C 660 225 740 260 772 320 C 795 370 780 440 735 470 C 690 495 620 498 585 478 C 540 460 490 455 470 460 C 440 440 380 420 300 380 Z'),
    neck: new Path2D('M 330 390 L 478 452 L 432 548 L 352 540 Z'),
    neckLines: ['M 300 377 C 340 395 355 430 355 530', 'M 476 458 C 455 485 440 515 432 545'].map((d) => new Path2D(d)),
    body: new Path2D('M 352 540 C 280 575 190 620 168 700 C 155 770 195 820 240 830 L 238 895 L 385 895 L 390 838 C 450 820 490 770 482 700 C 476 640 450 590 432 548 Z'),
    footL: new Path2D('M 245 880 C 160 882 90 900 85 930 C 85 948 200 945 300 940 C 305 920 300 895 290 880 Z'),
    footR: new Path2D('M 330 882 C 325 900 325 925 330 942 C 420 948 510 950 518 930 C 515 900 450 885 380 880 Z'),
    toesL: ['M 162 912 L 152 938', 'M 192 908 L 186 938'].map((d) => new Path2D(d)),
    toesR: ['M 452 912 L 462 940', 'M 480 915 L 494 938'].map((d) => new Path2D(d)),
    tongue: new Path2D('M 500 462 C 490 495 492 525 508 526 C 522 520 524 490 522 462 Z'),
    bodyLines: ['M 215 650 C 185 690 180 750 195 785', 'M 430 595 C 455 640 470 720 450 795', 'M 325 840 C 318 870 316 885 316 892'].map((d) => new Path2D(d)),
    face: ['M 505 85 Q 520 88 532 103', 'M 440 345 C 440 380 470 420 530 448 C 590 470 660 462 695 432', 'M 690 420 Q 702 432 690 448'].map((d) => new Path2D(d)),
    collar: new Path2D('M 348 532 L 442 545'),
  };
  const SN_COLLAR = [(395 - 300) * SNOOPY_K, (538 - 940) * SNOOPY_K];
  const SN_TOP = (50 - 940) * SNOOPY_K;
  function drawSnoopy(rng, ph, still) {
    const sw = still ? 0 : Math.sin(ph), bob = still ? 0 : Math.abs(Math.sin(ph));
    const K = '#1d1b1a', WH = '#fdfbf5';
    ctx.scale(SNOOPY_K, SNOOPY_K);
    ctx.translate(-300, -940);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const lw = 24;
    // white shape with a little wax hatching inside, then a black outline drawn twice, each pass
    // nudged a few units so the line boils like the rest of the drawing
    const shape = (p, fill = WH) => {
      ctx.fillStyle = fill; ctx.fill(p);
      ctx.save(); ctx.clip(p);
      ctx.strokeStyle = 'rgba(120,110,95,0.10)'; ctx.lineWidth = 9; ctx.beginPath();
      for (let d = -200; d < 1100; d += 26) { const j = rng() * 10; ctx.moveTo(d + j, 1000); ctx.lineTo(d + 520 + j, 0); }
      ctx.stroke(); ctx.restore();
    };
    const line = (p, w = lw) => {
      ctx.strokeStyle = K;
      for (let pass = 0; pass < 2; pass++) {
        ctx.save(); ctx.translate((rng() - 0.5) * 7, (rng() - 0.5) * 7);
        ctx.lineWidth = pass ? w * 0.55 : w; ctx.globalAlpha = pass ? 0.55 : 0.95;
        ctx.stroke(p); ctx.restore();
      }
      ctx.globalAlpha = 1;
    };
    const ell = (cx, cy, rx, ry, r, fill, stroke) => {
      const p = new Path2D(); p.ellipse(cx + (rng() - 0.5) * 4, cy + (rng() - 0.5) * 4, rx, ry, r, 0, Math.PI * 2);
      if (fill === WH) shape(p); else { ctx.fillStyle = fill; ctx.fill(p); }
      if (stroke) line(p);
    };
    // feet step forward and back in turn and lift a little; the body bounces on each step
    const foot = (p, toes, dx, lift) => {
      ctx.save(); ctx.translate(dx, -lift);
      shape(p); line(p); toes.forEach((t) => line(t, lw * 0.7));
      ctx.restore();
    };
    foot(SN.footL, SN.toesL, -sw * 34, Math.max(0, sw) * 26);
    ctx.save();
    ctx.translate(0, -bob * 22);
    ctx.translate(300, 900); ctx.rotate(sw * 0.035); ctx.translate(-300, -900);
    shape(SN.body); line(SN.body);
    SN.bodyLines.forEach((p) => line(p, lw * 0.85));
    foot(SN.footR, SN.toesR, sw * 34 + 0, Math.max(0, -sw) * 26 - bob * 22);
    // neck, collar, tongue, head
    shape(SN.neck); SN.neckLines.forEach((p) => line(p));
    ctx.fillStyle = '#f2a7a0'; ctx.fill(SN.tongue); line(SN.tongue, lw * 0.7);
    line(SN.collar, 46);
    ctx.save(); ctx.translate(410, 470); ctx.rotate(sw * 0.04); ctx.translate(-410, -470);
    shape(SN.head); line(SN.head);
    // the long black ear on the back of the head, swinging with the steps
    ctx.save(); ctx.translate(250, 190); ctx.rotate(-sw * 0.08); ctx.translate(-250, -190);
    ell(232, 345, 66, 166, 0.2, WH, true);
    ell(238, 335, 44, 134, 0.2, K, false);
    ctx.restore();
    ell(435, 215, 12, 25, 0.12, K, false);
    ell(492, 220, 12, 25, 0.12, K, false);
    ell(640, 368, 52, 25, 0.05, K, false);
    SN.face.forEach((p) => line(p, lw * 0.85));
    ctx.restore();
    ctx.restore();
  }

  function drawBird(rng, t) {
    const flap = Math.sin(t * 22) > 0;
    const Y = '#f3c51c';
    crayon(rng, wobblyEllipse(rng, 0, 0, 2.8, 2.3), Y, { edge: 0.4 });
    crayon(rng, wobblyEllipse(rng, 2.2, -2.4, 1.9, 1.8), Y, { edge: 0.4 });
    crayon(rng, wobblyPoly(rng, flap ? [[-1, -1], [2, -1], [0.5, -5.5]] : [[-1, 0], [2, 0], [0.8, 3.5]], 0.2), '#e0a915', { edge: 0.3 });
    crayon(rng, wobblyPoly(rng, [[3.8, -2.6], [5.6, -2.1], [3.8, -1.6]], 0.1), '#e36a1b', { edge: 0.2 });
    crayonLine(rng, [[2, -4], [1.4, -5.6]], '#c99a12', 0.5, 0.1);
    crayonLine(rng, [[2.6, -4], [3, -5.5]], '#c99a12', 0.5, 0.1);
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(2.8, -2.8, 0.4, 0, 7); ctx.fill();
  }

  // ---------- the crowd ----------
  let agents = [], star = null, t = 0, frame = 0, introAt = 0;
  // anywhere across the crossing except the lane Snoopy and his walker use, so nobody walks through them
  function laneX() {
    for (;;) {
      const x = (R() * 2 - 1) * (halfCW - 15);
      if (!star || x < star.x - 22 || x > star.x + 58) return x;
    }
  }
  function newPerson(kind) {
    const dir = R() < 0.5 ? -1 : 1;
    return {
      kind, dir, id: Math.floor(R() * 1e9),
      x: laneX(),
      y: 0,
      speed: kind === 'bike' ? 70 + R() * 30 : 18 + R() * 16,
      phase: R() * 6,
      shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKIN), hair: pick(HAIR),
      hat: R() < 0.2 ? pick(['#d8322b', '#2f5fd0', '#f2c230', '#2a2a2a']) : null,
      bag: R() < 0.3 ? pick(['#6b4426', '#8a5a2b', '#2a2a2a', '#c62f2a']) : null,
      frame: pick(['#2aa39a', '#d8322b', '#2f5fd0', '#2b2826', '#ef8a1f']),
    };
  }
  function populate() {
    const span = 0.5 * Math.hypot(W, H) / (base * END_ZOOM) + 60;
    const n = Math.round((halfCW * 2 * span * 2) / 2600);
    agents = [];
    for (let i = 0; i < n; i++) {
      const a = newPerson(R() < 0.1 ? 'bike' : 'person');
      a.y = cam.y + 40 + (R() * 2 - 1) * span;
      agents.push(a);
    }
  }
  function startIntro() {
    star = { kind: 'star', dir: -1, x: -30, y: 0, speed: 24, phase: 0, id: 1,
      shirt: '#2aa39a', pants: '#2b2b6e', skin: '#f0b48a', hair: '#4b2e1a', hat: null, bag: null, sniff: 0 };
    t = 0; introAt = 0;
    cam.x = star.x + 12; cam.y = star.y - 16; cam.zoom = 3.4;
    populate();
    tagEl.classList.remove('gone'); hintEl.classList.add('gone');
  }

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  function step(dt) {
    t += dt;
    // the walker and Snoopy stop for a sniff every so often
    star.sniff = Math.max(0, star.sniff - dt);
    if (star.sniff === 0 && R() < dt * 0.06 && t > 7) star.sniff = 1.6;
    const v = star.sniff > 0 ? 0 : star.speed;
    star.y -= v * dt; star.phase += v * dt * 0.28;
    // camera: open close on the pair, then pull back to the whole crossing and follow them
    const k = ease(Math.min(1, Math.max(0, (t - 1.2) / 3.6)));
    cam.zoom = 3.4 + (END_ZOOM - 3.4) * k;
    cam.x = star.x + 12 - 12 * k;
    cam.y = star.y - 16 + 40 * k;
    if (t > 4.2) tagEl.classList.add('gone');
    if (t > 6 && t < 6.2) hintEl.classList.remove('gone');
    if (t > 12) hintEl.classList.add('gone');
    // recycle against the wide shot's bounds even during the close-up, so the crowd stays spread out
    const rad = 0.5 * Math.hypot(W, H) / (base * END_ZOOM) + 90;
    for (const a of agents) {
      a.y += a.dir * a.speed * dt;
      a.phase += a.speed * dt * (a.kind === 'bike' ? 0.18 : 0.28);
      const rel = a.y - cam.y;
      if (rel < -rad || rel > rad) {
        const b = newPerson(R() < 0.1 ? 'bike' : 'person');
        // enter from the edge it will move into view from (the camera drifts up with the walker)
        const relV = b.dir * b.speed + star.speed;
        b.y = cam.y + (relV > 0 ? -rad + 5 : rad - 5);
        Object.assign(a, b);
      }
    }
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawStreet();
    const s = S();
    const items = [...agents, star].map((a) => {
      const [sx, sy] = toScreen(a.x, a.y);
      return { a, sx, sy };
    }).filter((o) => o.sx > -60 * s && o.sx < W + 60 * s && o.sy > -40 * s && o.sy < H + 80 * s);
    // Snoopy's position relative to the walker: ahead (up the crossing) and to the right
    const dogWorld = [star.x + 22, star.y - 12];
    const [dsx, dsy] = toScreen(...dogWorld);
    const place = (sx, sy) => ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * sx, dpr * sy);
    // shadows first so nobody's shadow lands on top of someone else
    for (const o of items) {
      place(o.sx, o.sy);
      drawShadow(rngFor(o.a.id, 1), o.a.kind === 'bike' ? 14 : 8, o.a.kind === 'bike' ? 26 : 24);
    }
    place(dsx, dsy); ctx.scale(DOG, DOG); drawShadow(rngFor(9, 1), 16, 22);
    items.push({ a: { kind: 'dog' }, sx: dsx, sy: dsy });
    items.sort((p, q) => p.sy - q.sy);
    for (const o of items) {
      place(o.sx, o.sy);
      const a = o.a;
      if (a.kind === 'dog') {
        const sniff = star.sniff > 0;
        ctx.scale(DOG, DOG);
        drawSnoopy(rngFor(9, 2), sniff ? 0 : star.phase * 1.4, sniff);
      } else if (a.kind === 'bike') drawBike(a, rngFor(a.id, 2), a.phase);
      else {
        const sw = a.kind === 'star' && star.sniff > 0 ? 0 : Math.sin(a.phase);
        drawPerson(a, rngFor(a.id, 2), sw);
      }
    }
    // leash from the walker's hand to the collar, sagging a little
    {
      const [wsx, wsy] = toScreen(star.x, star.y);
      const sw = star.sniff > 0 ? 0 : Math.sin(star.phase);
      const hx = wsx + 5.8 * s, hy = wsy + (-12 + sw * 1.6 * -1) * s;
      const cx = dsx + SN_COLLAR[0] * DOG * s, cy = dsy + SN_COLLAR[1] * DOG * s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rng = rngFor(9, 3);
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        pts.push([hx + (cx - hx) * u, hy + (cy - hy) * u + Math.sin(u * Math.PI) * 4 * s]);
      }
      crayonLine(rng, pts, '#6b2a1a', 1.3 * s, 0.4 * s);
    }
    // the little yellow bird looping over Snoopy
    {
      const bx = dsx + (Math.cos(t * 1.4) * 15 + 6) * s, by = dsy + (SN_TOP * DOG - 7 + Math.sin(t * 2.8) * 5) * s;
      place(bx, by + 30 * s); drawShadow(rngFor(11, 1), 3, 6);
      place(bx, by);
      if (Math.cos(t * 1.4 - Math.PI / 2) < 0) ctx.scale(-1, 1);
      drawBird(rngFor(11, 2), t);
    }
    // patchy wax: punch paper grain out of everything, shifted each boil so it shimmers
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.45;
    ctx.save(); ctx.translate((boil * 73) % 220, (boil * 41) % 220);
    ctx.fillStyle = grain; ctx.fillRect(-220, -220, cv.width + 440, cv.height + 440);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  let last = 0, acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!last) last = now;
    acc += Math.min(0.25, (now - last) / 1000); last = now;
    if (acc < 1 / FPS) return;
    const dt = 1 / FPS; acc = acc % dt;
    frame++; boil = frame % 3;
    step(dt);
    render();
  }

  addEventListener('resize', () => { resize(); render(); });
  cv.addEventListener('click', () => { startIntro(); window.track?.('crossing replay'); });
  resize();
  startIntro();
  requestAnimationFrame(loop);
})();
