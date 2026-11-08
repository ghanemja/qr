// Snoopy's Suppertime: a crayon short. Snoopy is doodled stroke by stroke on blank paper, coloured
// in, rigged with puppet pins and dragged into his first step, then the camera pulls out to his
// backyard at sunset: the kid brings his supper dish, he does the happy dance, eats, hops onto his
// doghouse and falls asleep on his back with the little yellow bird on his tummy. Drawn on a 2D
// canvas, stepped at 12 fps with line boil and a paper grain so it reads as stop-motion.
(() => {
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  const tagEl = document.getElementById('tag');

  const FPS = 12;              // stop-motion step

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

  // ---------- sizing and camera (world units; cam.s is pixels per unit) ----------
  let W = 0, H = 0, dpr = 1, grain = null;
  function resize() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    if (W * H * dpr * dpr > 3.2e6) dpr = Math.sqrt(3.2e6 / (W * H));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
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

  const cam = { x: 0, y: 0, s: 1 };
  const toScreen = (x, y) => [W / 2 + (x - cam.x) * cam.s, H / 2 + (y - cam.y) * cam.s];
  const place = (x, y) => { const [sx, sy] = toScreen(x, y); ctx.setTransform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * sx, dpr * sy); };
  const worldT = () => ctx.setTransform(dpr * cam.s, 0, 0, dpr * cam.s, dpr * (W / 2 - cam.x * cam.s), dpr * (H / 2 - cam.y * cam.s));

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
  // tracePts smooths through midpoints, which rounds a 4-point box into an oval: add points along
  // each edge so straight edges stay straight and only the corners soften a little
  function sharp(pts, n = 6) {
    const out = [];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      for (let k = 0; k < n; k++) out.push([p[0] + (q[0] - p[0]) * (k / n), p[1] + (q[1] - p[1]) * (k / n)]);
    });
    return out;
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

  // Snoopy, standing in 3/4 view facing right. Shapes are SVG paths in a 801x1055 reference box
  // (feet on y=940, centre of the feet at x=300); SNOOPY_K scales that box to world units.
  const SNOOPY_K = 34 / 895;
  const SN = {
    head: new Path2D('M 300 380 C 220 300 230 150 330 80 C 370 55 430 45 480 65 C 505 75 515 90 512 110 C 515 160 530 195 580 210 C 660 225 740 260 772 320 C 795 370 780 440 735 470 C 690 495 620 498 585 478 C 540 460 490 455 470 460 C 440 440 380 420 300 380 Z'),
    // the visible outline of the head stops where the head meets the neck, so no line crosses the neck
    headLine: new Path2D('M 300 380 C 220 300 230 150 330 80 C 370 55 430 45 480 65 C 505 75 515 90 512 110 C 515 160 530 195 580 210 C 660 225 740 260 772 320 C 795 370 780 440 735 470 C 690 495 620 498 585 478 C 540 460 490 455 470 460'),
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

  // ---------- the opening: Snoopy doodled in crayon, coloured in, rigged, then taken home ----------
  // Timeline (seconds): outline strokes, then colouring in, then the rig and a walk in place, then
  // at T0 the camera pulls out and his yard fades in around him.
  const STROKE0 = 0.5, FILL0 = 4.4, RIG0 = 6.0, T0 = 9.4, PULL = 4.5, FADE = 1.4;
  const ellD = (cx, cy, rx, ry, r) => {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const a = -Math.PI / 2 + (i / 48) * Math.PI * 2;
      const x = cx + rx * Math.cos(a) * Math.cos(r) - ry * Math.sin(a) * Math.sin(r);
      const y = cy + rx * Math.cos(a) * Math.sin(r) + ry * Math.sin(a) * Math.cos(r);
      d += (i ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  };
  // outline strokes in drawing order (w: line weight relative to the main line)
  const DOODLE_STROKES = [
    ['M 300 380 C 220 300 230 150 330 80 C 370 55 430 45 480 65 C 505 75 515 90 512 110 C 515 160 530 195 580 210 C 660 225 740 260 772 320 C 795 370 780 440 735 470 C 690 495 620 498 585 478 C 540 460 490 455 470 460', 1], ['M 505 85 Q 520 88 532 103', 0.85], [ellD(232, 345, 66, 166, 0.2), 1],
    [ellD(435, 215, 12, 25, 0.12), 0.8], [ellD(492, 220, 12, 25, 0.12), 0.8], [ellD(640, 368, 52, 25, 0.05), 0.9],
    ['M 440 345 C 440 380 470 420 530 448 C 590 470 660 462 695 432', 0.85], ['M 690 420 Q 702 432 690 448', 0.85],
    ['M 300 377 C 340 395 355 430 355 530', 1], ['M 476 458 C 455 485 440 515 432 545', 1], ['M 348 532 L 442 545', 1.9],
    ['M 352 540 C 280 575 190 620 168 700 C 155 770 195 820 240 830 L 238 895 L 385 895 L 390 838 C 450 820 490 770 482 700 C 476 640 450 590 432 548 Z', 1], ['M 215 650 C 185 690 180 750 195 785', 0.85], ['M 430 595 C 455 640 470 720 450 795', 0.85],
    ['M 245 880 C 160 882 90 900 85 930 C 85 948 200 945 300 940 C 305 920 300 895 290 880 Z', 1], ['M 330 882 C 325 900 325 925 330 942 C 420 948 510 950 518 930 C 515 900 450 885 380 880 Z', 1], ['M 325 840 C 318 870 316 885 316 892', 0.85],
    ['M 162 912 L 152 938', 0.7], ['M 192 908 L 186 938', 0.7], ['M 452 912 L 462 940', 0.7], ['M 480 915 L 494 938', 0.7],
    ['M 500 462 C 490 495 492 525 508 526 C 522 520 524 490 522 462 Z', 0.7],
  ];
  // regions coloured in afterwards, in order
  const DOODLE_FILLS = [
    ['M 300 380 C 220 300 230 150 330 80 C 370 55 430 45 480 65 C 505 75 515 90 512 110 C 515 160 530 195 580 210 C 660 225 740 260 772 320 C 795 370 780 440 735 470 C 690 495 620 498 585 478 C 540 460 490 455 470 460 C 440 440 380 420 300 380 Z', '#fdfbf5'], [ellD(232, 345, 66, 166, 0.2), '#fdfbf5'], ['M 330 390 L 478 452 L 432 548 L 352 540 Z', '#fdfbf5'], ['M 352 540 C 280 575 190 620 168 700 C 155 770 195 820 240 830 L 238 895 L 385 895 L 390 838 C 450 820 490 770 482 700 C 476 640 450 590 432 548 Z', '#fdfbf5'],
    ['M 245 880 C 160 882 90 900 85 930 C 85 948 200 945 300 940 C 305 920 300 895 290 880 Z', '#fdfbf5'], ['M 330 882 C 325 900 325 925 330 942 C 420 948 510 950 518 930 C 515 900 450 885 380 880 Z', '#fdfbf5'],
    [ellD(238, 335, 44, 134, 0.2), '#1d1b1a'], [ellD(435, 215, 12, 25, 0.12), '#1d1b1a'], [ellD(492, 220, 12, 25, 0.12), '#1d1b1a'],
    [ellD(640, 368, 52, 25, 0.05), '#1d1b1a'], ['M 500 462 C 490 495 492 525 508 526 C 522 520 524 490 522 462 Z', '#f2a7a0'],
  ];
  // measure the paths once with SVG (length, points along them, bounding boxes)
  let doodle = null;
  function measureDoodle() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute'; svg.style.visibility = 'hidden';
    document.body.appendChild(svg);
    const mk = (d) => { const e = document.createElementNS('http://www.w3.org/2000/svg', 'path'); e.setAttribute('d', d); svg.appendChild(e); return e; };
    let total = 0;
    const strokes = DOODLE_STROKES.map(([d, w]) => {
      const el = mk(d), len = el.getTotalLength();
      const o = { p: new Path2D(d), el, len, start: total, w }; total += len; return o;
    });
    const fills = DOODLE_FILLS.map(([d, col]) => {
      const el = mk(d), b = el.getBBox();
      const lines = [];
      const slant = b.height * 0.35;
      let i = 0;
      for (let x = b.x - slant - 10; x < b.x + b.width + 10; x += 19, i++) {
        lines.push(i % 2 ? [x + slant, b.y - 6, x, b.y + b.height + 6] : [x, b.y + b.height + 6, x + slant, b.y - 6]);
      }
      return { p: new Path2D(d), col, lines };
    });
    doodle = { strokes, fills, total };
  }

  // a wax crayon held at an angle, its tip at (x, y) in Snoopy's reference box
  function drawCrayonStick(x, y, col) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.8);
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(26,78,88,0.22)';
    ctx.beginPath(); ctx.moveTo(30, 34); ctx.lineTo(70, 56); ctx.lineTo(330, 56); ctx.lineTo(330, 6); ctx.lineTo(70, 6); ctx.closePath(); ctx.fill();
    const out = col === '#1d1b1a' ? '#000' : '#2b2826';
    ctx.strokeStyle = out; ctx.lineWidth = 7;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(44, -20); ctx.lineTo(44, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(44, -24, 260, 48); ctx.strokeRect(44, -24, 260, 48);
    ctx.fillStyle = col === '#fdfbf5' ? '#cfc3a8' : '#e9dcbc';
    ctx.fillRect(92, -25, 170, 50); ctx.strokeRect(92, -25, 170, 50);
    ctx.fillStyle = out; ctx.fillRect(110, -25, 10, 50); ctx.fillRect(234, -25, 10, 50);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(140, -8, 70, 6); ctx.fillRect(140, 4, 50, 5);
    ctx.restore();
  }

  // Snoopy at time tt of the opening: outlines drawing on, then the colouring in
  function drawDoodle(rng, tt) {
    if (!doodle) measureDoodle();
    ctx.save();
    ctx.scale(SNOOPY_K, SNOOPY_K); ctx.translate(-300, -940);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const fp = Math.max(0, (tt - FILL0) / (RIG0 - FILL0 - 0.2)) * doodle.fills.length;
    let pen = null;
    doodle.fills.forEach((f, i) => {
      const qf = Math.min(1, Math.max(0, fp - i));
      if (qf <= 0) return;
      ctx.save(); ctx.clip(f.p);
      if (qf >= 1) { ctx.fillStyle = f.col; ctx.fill(f.p); }
      ctx.strokeStyle = f.col; ctx.lineWidth = 34; ctx.globalAlpha = 0.92;
      const n = Math.ceil(qf * f.lines.length);
      ctx.beginPath();
      for (let k = 0; k < n; k++) { const [a, b, c, d] = f.lines[k]; ctx.moveTo(a + (rng() - 0.5) * 6, b); ctx.lineTo(c + (rng() - 0.5) * 6, d); }
      ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
      if (qf < 1) { const l = f.lines[n - 1]; pen = [l[2], l[3], f.col]; }
    });
    const sp = Math.max(0, Math.min(1, (tt - STROKE0) / (FILL0 - STROKE0 - 0.2))) * doodle.total;
    for (const st of doodle.strokes) {
      const drawn = Math.min(st.len, sp - st.start);
      if (drawn <= 0) break;
      ctx.setLineDash([drawn, 1e5]);
      for (let pass = 0; pass < 2; pass++) {
        ctx.save(); ctx.translate((rng() - 0.5) * 7, (rng() - 0.5) * 7);
        ctx.strokeStyle = '#1d1b1a'; ctx.lineWidth = (pass ? 13 : 24) * st.w; ctx.globalAlpha = pass ? 0.55 : 0.95;
        ctx.stroke(st.p); ctx.restore();
      }
      if (drawn < st.len) { const pt = st.el.getPointAtLength(drawn); pen = [pt.x, pt.y, '#1d1b1a']; }
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    if (pen) drawCrayonStick(pen[0], pen[1], pen[2]);
    ctx.restore();
  }



  // Snoopy standing in 3/4 view facing right, feet at the origin (world units).
  // o.still: standing; o.sw: set the step directly (-1..1, used by the rig and the drag);
  // o.dance: 0..1 the happy dance; o.eat: 0..1 head down in the dish (o.chew wiggles it);
  // o.sleep: eyes shut; o.earHang: extra ear rotation so it dangles when he lies on his back;
  // o.pins: an object that collects the rig's pin positions (device pixels) as parts are drawn.
  function drawSnoopy(rng, ph, o = {}) {
    const dance = o.dance || 0, eat = o.eat || 0;
    const posed = o.sw != null;
    const sw = posed ? o.sw : o.still ? 0 : Math.sin(ph);
    const bob = posed || o.still ? 0 : Math.abs(Math.sin(ph)) * (1 + dance * 2.2);
    const K = '#1d1b1a', WH = '#fdfbf5';
    const pins = o.pins;
    const pin = (name, x, y) => {
      if (!pins) return;
      const p = ctx.getTransform().transformPoint(new DOMPoint(x, y));
      pins[name] = [p.x, p.y];
    };
    ctx.save();
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
    const foot = (p, toes, dx, lift, name, px) => {
      ctx.save(); ctx.translate(dx, -lift);
      shape(p); line(p); toes.forEach((t) => line(t, lw * 0.7));
      pin(name, px, 922);
      ctx.restore();
    };
    const kick = 26 + dance * 70;
    foot(SN.footL, SN.toesL, -sw * 34 * (1 + dance), Math.max(0, sw) * kick, 'footL', 190);
    ctx.save();
    ctx.translate(0, -bob * 22);
    ctx.translate(300, 900); ctx.rotate(sw * 0.035); ctx.translate(-300, -900);
    shape(SN.body); line(SN.body);
    SN.bodyLines.forEach((p) => line(p, lw * 0.85));
    pin('hip', 318, 812); pin('chest', 332, 640); pin('armB', 200, 760); pin('armF', 456, 770); pin('neck', 396, 538);
    foot(SN.footR, SN.toesR, sw * 34 * (1 + dance), Math.max(0, -sw) * kick - bob * 22, 'footR', 430);
    // neck and tongue; the head is filled over the top of the neck, then outlined only on its outside
    shape(SN.neck);
    ctx.fillStyle = '#f2a7a0'; ctx.fill(SN.tongue); line(SN.tongue, lw * 0.7);
    ctx.save(); ctx.translate(410, 470);
    ctx.rotate(sw * 0.04 - dance * 0.24 + eat * (-0.1 + 0.09 * Math.sin(o.chew || 0)));
    ctx.translate(-410, -470);
    shape(SN.head); line(SN.headLine);
    pin('head', 455, 245); pin('nose', 640, 368);
    // the long black ear on the back of the head, swinging with the steps (and flying up in the dance)
    ctx.save(); ctx.translate(250, 190);
    ctx.rotate(-sw * 0.08 - dance * (0.5 + sw * 0.3) + (o.earHang || 0) + eat * 0.12 * Math.sin(o.chew || 0));
    ctx.translate(-250, -190);
    ell(232, 345, 66, 166, 0.2, WH, true);
    ell(238, 335, 44, 134, 0.2, K, false);
    pin('earBase', 250, 200); pin('earTip', 236, 480);
    ctx.restore();
    if (o.sleep) { // sleeping: eyes shut
      line(new Path2D('M 420 214 Q 433 226 448 214 M 478 220 Q 491 232 506 220'), lw * 0.8);
    } else if (dance > 0.5) { // happy eyes: closed upward arcs
      line(new Path2D('M 420 222 Q 433 200 448 220 M 478 228 Q 491 206 506 226'), lw * 0.8);
    } else {
      ell(435, 215, 12, 25, 0.12, K, false);
      ell(492, 220, 12, 25, 0.12, K, false);
    }
    ell(640, 368, 52, 25, 0.05, K, false);
    SN.face.forEach((p) => line(p, lw * 0.85));
    ctx.restore();
    // neck lines and collar go over the head's lower edge
    SN.neckLines.forEach((p) => line(p));
    line(SN.collar, 46);
    ctx.restore();
    ctx.restore();
  }

  function drawNote(rng, col) {
    crayon(rng, wobblyEllipse(rng, 0, 0, 2.1, 1.5, -0.4), col, { edge: 0.4 });
    crayonLine(rng, [[1.9, -0.4], [1.9, -8]], col, 0.8, 0.1);
    crayonLine(rng, [[1.9, -8], [4.2, -6.2], [3.9, -4]], col, 0.8, 0.1);
  }

  // the little yellow bird; sitting: wings folded
  function drawBird(rng, tt, sitting) {
    const flap = !sitting && Math.sin(tt * 22) > 0;
    const Y = '#f3c51c';
    crayon(rng, wobblyEllipse(rng, 0, 0, 2.8, 2.3), Y, { edge: 0.4 });
    crayon(rng, wobblyEllipse(rng, 2.2, -2.4, 1.9, 1.8), Y, { edge: 0.4 });
    crayon(rng, wobblyPoly(rng, flap ? [[-1, -1], [2, -1], [0.5, -5.5]] : sitting ? [[-1.6, -0.6], [1.6, -0.4], [-1.8, 1.2]] : [[-1, 0], [2, 0], [0.8, 3.5]], 0.2), '#e0a915', { edge: 0.3 });
    crayon(rng, wobblyPoly(rng, [[3.8, -2.6], [5.6, -2.1], [3.8, -1.6]], 0.1), '#e36a1b', { edge: 0.2 });
    crayonLine(rng, [[2, -4], [1.4, -5.6]], '#c99a12', 0.5, 0.1);
    crayonLine(rng, [[2.6, -4], [3, -5.5]], '#c99a12', 0.5, 0.1);
    if (sitting) { crayonLine(rng, [[2.3, -3.1], [3.3, -2.9]], '#222', 0.35, 0.03); }
    else { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(2.8, -2.8, 0.4, 0, 7); ctx.fill(); }
  }

  // ---------- the rig: puppet pins stuck to Snoopy's parts, bones between them, a cursor ----------
  const PIN_ORDER = ['hip', 'chest', 'neck', 'head', 'nose', 'earBase', 'earTip', 'armB', 'armF', 'footL', 'footR'];
  const BONES = [['footL', 'hip'], ['footR', 'hip'], ['hip', 'chest'], ['chest', 'neck'], ['neck', 'head'], ['head', 'nose'],
    ['head', 'earBase'], ['earBase', 'earTip'], ['chest', 'armB'], ['chest', 'armF']];
  const HANDLES = new Set(['footL', 'footR', 'nose', 'earTip']);
  function drawRigOverlay(pins, shown, alpha, active) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    const vis = (n) => PIN_ORDER.indexOf(n) < shown;
    ctx.lineCap = 'round';
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass ? '#f5d000' : 'rgba(40,30,0,0.45)';
      ctx.lineWidth = (pass ? 2 : 4.5) * dpr;
      ctx.beginPath();
      for (const [a, b] of BONES) if (vis(a) && vis(b)) { ctx.moveTo(...pins[a]); ctx.lineTo(...pins[b]); }
      ctx.stroke();
    }
    PIN_ORDER.forEach((n, i) => {
      if (!vis(n)) return;
      const pop = Math.min(1, (shown - i) * 2.5); // each pin pops in
      const [x, y] = pins[n];
      const r = (n === active ? 6.5 : 4.5) * dpr * (pop < 1 ? 0.4 + pop * 0.9 : 1);
      ctx.fillStyle = '#f5d000'; ctx.strokeStyle = '#3a3000'; ctx.lineWidth = 1.3 * dpr;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (HANDLES.has(n)) {
        const h = 9 * dpr;
        ctx.strokeStyle = '#f5d000'; ctx.lineWidth = 1.6 * dpr; ctx.strokeRect(x - h, y - h, h * 2, h * 2);
      }
      if (n === active) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(x, y, r + 3 * dpr, 0, Math.PI * 2); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
  }
  function drawCursor(x, y, alpha) {
    ctx.setTransform(dpr * 1.25, 0, 0, dpr * 1.25, x, y);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.4, 13.2); ctx.lineTo(7.4, 19.8); ctx.lineTo(10, 18.7); ctx.lineTo(7.1, 12.3); ctx.lineTo(12.6, 12.3);
    ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---------- the yard ----------
  const mix = (a, b, k) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map((sh) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  const SHADOW = 'rgba(26,78,88,0.45)';
  const ROOF_Y = -46, HOUSE_X0 = -58, HOUSE_X1 = -2, RIDGE_X = -30;
  // visible world bounds
  const viewL = () => cam.x - W / 2 / cam.s - 20, viewR = () => cam.x + W / 2 / cam.s + 20;
  const viewT = () => cam.y - H / 2 / cam.s - 20, viewB = () => cam.y + H / 2 / cam.s + 20;

  function drawSky(d) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, cv.height * 0.75);
    g.addColorStop(0, mix('#86bde3', '#262a59', d));
    g.addColorStop(0.55, mix('#bcdcea', '#8a5c86', d));
    g.addColorStop(1, mix('#fbe6b4', '#f2925a', d));
    ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
    // long pale crayon strokes across the sky
    const rng = rngFor(501);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(255,255,255,${0.1 - d * 0.05})`; ctx.lineWidth = 9 * dpr; ctx.beginPath();
    for (let i = 0; i < 70; i++) {
      const x = rng() * cv.width * 1.2 - cv.width * 0.1, y = rng() * cv.height * 0.8, L = (90 + rng() * 160) * dpr;
      ctx.moveTo(x, y); ctx.lineTo(x + L, y - L * 0.04);
    }
    ctx.stroke();
    // stars come out at dusk
    if (d > 0.55) {
      const sr = mulberry(77);
      for (let i = 0; i < 46; i++) {
        const x = sr() * cv.width, y = sr() * cv.height * 0.5, tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.globalAlpha = Math.min(1, (d - 0.55) * 3) * (0.5 + 0.5 * tw);
        ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 1.6 * dpr; const r = (2 + sr() * 2.5) * dpr;
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawSun(u, d) {
    worldT();
    const sy = -120 + Math.min(1, Math.max(0, u / 19)) * 118;
    const rng = rngFor(502);
    crayon(rng, wobblyEllipse(rng, 62, sy, 15, 15, 0, 0.04), mix('#f8c440', '#f06a3a', d), { dark: 'rgba(220,90,20,0.25)', edge: 1 });
    // the moon rises behind the tree as the sun goes down
    if (d > 0.45) {
      const my = -150 + (1 - Math.min(1, (d - 0.45) * 2)) * 30;
      crayon(rng, wobblyEllipse(rng, -48, my, 9, 9, 0, 0.04), '#f6efd0', { edge: 0.8, alpha: Math.min(1, (d - 0.45) * 3) });
      crayon(rng, wobblyEllipse(rng, -44, my - 2.5, 8, 8, 0, 0.04), mix('#8a5c86', '#262a59', 0.6), { edge: 0, alpha: Math.min(1, (d - 0.45) * 3) });
    }
  }

  function drawYard(d) {
    worldT();
    const L = viewL(), Rr = viewR(), B = viewB();
    // far hills
    {
      const rng = rngFor(510), pts = [];
      for (let x = L; x <= Rr + 20; x += 20) pts.push([x, -20 - 9 * Math.sin(x * 0.018 + 1.3) - 4 * Math.sin(x * 0.05)]);
      pts.push([Rr + 20, 5], [L, 5]);
      crayon(rng, wobblyPoly(rng, pts, 0.8), mix('#a9c77a', '#55606e', d * 0.8), { dark: 'rgba(0,0,0,0)', light: 'rgba(0,0,0,0)', edge: 1 });
    }
    // picket fence
    {
      const rng = rngFor(511), cream = mix('#f4ecd8', '#b8aec2', d * 0.7);
      const x0 = Math.floor(L / 8) * 8;
      crayon(rng, wobblyPoly(rng, sharp([[L, -19], [Rr, -19], [Rr, -15.5], [L, -15.5]], 12), 0.15), mix('#e6dcc4', '#a69db4', d * 0.7), { edge: 0.4 });
      crayon(rng, wobblyPoly(rng, sharp([[L, -9], [Rr, -9], [Rr, -5.5], [L, -5.5]], 12), 0.15), mix('#e6dcc4', '#a69db4', d * 0.7), { edge: 0.4 });
      for (let x = x0; x < Rr; x += 8) {
        const r = mulberry(hash(x, 7, boil));
        const pts = sharp([[x - 2.6, -2], [x - 2.6, -21], [x, -25], [x + 2.6, -21], [x + 2.6, -2]], 3);
        crayon(r, wobblyPoly(r, pts, 0.25), cream, { dark: 'rgba(0,0,0,0.06)', edge: 0.4 });
        outline(r, pts, 0.6, '#3a3632');
      }
    }
    // the autumn tree
    {
      const rng = rngFor(512);
      crayon(rng, wobblyPoly(rng, [[-86, 1], [-71, 1], [-74, -40], [-70, -62], [-76, -62], [-79, -44], [-84, -62], [-89, -60], [-82, -40]], 0.5), '#7a4a2b', { dark: 'rgba(0,0,0,0.2)', edge: 0.8 });
      const blobs = [[-96, -78, 20, 17, '#d9662a'], [-60, -80, 19, 16, '#e8962f'], [-80, -98, 22, 18, '#c8452c'], [-78, -74, 22, 16, '#f0b232'], [-100, -96, 14, 12, '#e8962f'], [-58, -100, 14, 12, '#d9662a']];
      for (const [x, y, rx, ry, col] of blobs) {
        crayon(rng, wobblyEllipse(rng, x, y, rx, ry, 0, 0.1), mix(col, '#6b4b5e', d * 0.5), { dark: 'rgba(0,0,0,0)', light: 'rgba(0,0,0,0)', edge: 1 });
        // leafy scribbles inside each blob
        ctx.strokeStyle = 'rgba(120,40,10,0.22)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i < 14; i++) { const a = rng() * 6.3, r = rng() * 0.8; const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 2, py - 3, px + 4, py); }
        ctx.stroke();
      }
    }
    // grass
    {
      const rng = rngFor(513);
      const pts = [];
      for (let x = L; x <= Rr + 10; x += 10) pts.push([x, -3 + Math.sin(x * 0.2) * 0.8]);
      pts.push([Rr + 10, B], [L, B]);
      crayon(rng, pts, mix('#86b84f', '#3f5b46', d * 0.75), { dark: 'rgba(0,0,0,0)', light: 'rgba(0,0,0,0)', edge: 0 });
      ctx.lineCap = 'round'; ctx.strokeStyle = mix('#5e9334', '#2c4234', d * 0.7); ctx.lineWidth = 1.1; ctx.beginPath();
      const cell = 6;
      for (let gx = Math.floor(L / cell); gx <= Rr / cell; gx++) for (let gy = 0; gy <= B / cell; gy++) {
        const r = mulberry(hash(gx, gy, 3, boil));
        const x = gx * cell + r() * cell, y = gy * cell + r() * cell - 1;
        ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 2.5, y - 2.5 - r() * 2);
      }
      ctx.stroke();
    }
  }

  function drawDoghouse(d) {
    worldT();
    const rng = rngFor(520);
    // shadow on the grass, cast to the left by the low sun on the right
    crayon(rng, wobblyEllipse(rng, -40, 1.5, 34, 3.5), SHADOW, { edge: 0.6, alpha: 0.8 });
    const red = mix('#d8322b', '#7d2a3e', d * 0.55), dark = mix('#a51f1a', '#5a1f30', d * 0.55);
    const walls = sharp([[HOUSE_X0 + 3, -24], [HOUSE_X1 - 3, -24], [HOUSE_X1 - 3, 0], [HOUSE_X0 + 3, 0]]);
    crayon(rng, wobblyPoly(rng, walls, 0.2), dark, { edge: 0.5 }); outline(rng, walls, 1);
    const roof = sharp([[HOUSE_X0 + 5, ROOF_Y], [HOUSE_X1 - 5, ROOF_Y], [HOUSE_X1 + 3, -23], [HOUSE_X0 - 3, -23]]);
    crayon(rng, wobblyPoly(rng, roof, 0.2), red, { edge: 0.5 }); outline(rng, roof, 1);
    const eave = sharp([[HOUSE_X0 - 3, -23], [HOUSE_X1 + 3, -23], [HOUSE_X1 + 3, -21], [HOUSE_X0 - 3, -21]], 10);
    crayon(rng, eave, dark, { edge: 0.4 }); outline(rng, eave, 0.8);
    ctx.strokeStyle = 'rgba(29,27,26,0.7)'; ctx.lineWidth = 0.55; ctx.beginPath();
    for (let i = 0; i < 9; i++) { const x = -40 + i * 2.2 + (rng() - 0.5) * 0.4; ctx.moveTo(x, ROOF_Y + 1); ctx.lineTo(x - 4 + i * 0.9, -24); }
    ctx.stroke();
  }

  // supper dish with a heap of kibble (amount 0..1)
  function drawDish(rng, amount) {
    if (amount > 0) {
      for (let i = 0; i < 9; i++) {
        if (i / 9 >= amount) break;
        const x = -4.5 + (i % 5) * 2.2 + (i > 4 ? 1.1 : 0), y = -4.6 - (i > 4 ? 1.3 : 0);
        crayon(rng, wobblyEllipse(rng, x, y, 1.3, 1, 0, 0.1), '#8a5a2b', { edge: 0.3 });
      }
    }
    const pts = sharp([[-7.5, -4.6], [7.5, -4.6], [5.8, 0], [-5.8, 0]], 4);
    crayon(rng, wobblyPoly(rng, pts, 0.15), '#d8322b', { edge: 0.4 }); outline(rng, pts, 0.7);
    crayonLine(rng, [[-6.8, -2.6], [6.8, -2.6]], '#fdfbf5', 0.8, 0.1);
  }

  // the kid, front view: big round head, yellow shirt with the zigzag, black shorts
  function drawKid(rng, ph, o = {}) {
    const sw = o.walk ? Math.sin(ph) : 0;
    const skin = '#f6cfa8', K = '#2a2622';
    const lift = (s) => Math.max(0, s) * 2.2;
    crayonLine(rng, [[-2.4, -9], [-2.6, -lift(sw)]], skin, 2.4);
    crayonLine(rng, [[2.4, -9], [2.6, -lift(-sw)]], skin, 2.4);
    crayon(rng, wobblyEllipse(rng, -3.2, 0.2 - lift(sw), 2.4, 1.2), K, { edge: 0.3 });
    crayon(rng, wobblyEllipse(rng, 3.2, 0.2 - lift(-sw), 2.4, 1.2), K, { edge: 0.3 });
    crayon(rng, wobblyPoly(rng, sharp([[-5, -12.5], [5, -12.5], [5.2, -8.2], [-5.2, -8.2]], 3), 0.15), K, { edge: 0.4 });
    crayon(rng, wobblyPoly(rng, sharp([[-6, -21.5], [6, -21.5], [5.6, -11.8], [-5.6, -11.8]], 3), 0.2), '#f4c430', { edge: 0.5 });
    crayonLine(rng, [[-5.8, -16.5], [-3.8, -15], [-1.9, -17.2], [0, -15], [1.9, -17.2], [3.8, -15], [5.8, -16.5]], K, 1, 0.1);
    let hands;
    if (o.carry) hands = [[-4.2, -15.2], [4.2, -15.2]];
    else if (o.cheer) { const w = Math.sin(t * 14) * 1.2; hands = [[-8.5, -28 + w], [8.5, -28 - w]]; }
    else hands = [[-7.5, -12.5 + sw * 1.4], [7.5, -12.5 - sw * 1.4]];
    crayonLine(rng, [[-5.4, -20.5], [(hands[0][0] - 5.4) / 2 - 1.2, (hands[0][1] - 20.5) / 2], hands[0]], '#f4c430', 2.2);
    crayonLine(rng, [[5.4, -20.5], [(hands[1][0] + 5.4) / 2 + 1.2, (hands[1][1] - 20.5) / 2], hands[1]], '#f4c430', 2.2);
    if (o.carry) { ctx.save(); ctx.translate(0, -13.4); drawDish(rng, 1); ctx.restore(); }
    for (const h of hands) crayon(rng, wobblyEllipse(rng, h[0], h[1], 1.2, 1.2), skin, { edge: 0.3 });
    // head
    const hy = -30;
    crayon(rng, wobblyEllipse(rng, -8.3, hy, 1.6, 2), skin, { edge: 0.3 });
    crayon(rng, wobblyEllipse(rng, 8.3, hy, 1.6, 2), skin, { edge: 0.3 });
    const head = wobblyEllipse(rng, 0, hy, 8.4, 8, 0, 0.03);
    crayon(rng, head, skin, { dark: 'rgba(160,90,50,0.12)', edge: 0.4 }); outline(rng, head, 0.6, '#5a3a24');
    ctx.fillStyle = K;
    for (const x of [-2.7, 2.7]) { ctx.beginPath(); ctx.arc(x, hy - 0.8, 0.65, 0, 7); ctx.fill(); }
    crayonLine(rng, [[-0.6, hy + 1.6], [0.2, hy + 2.2], [0.8, hy + 1.6]], '#8a5a3a', 0.45, 0.06);
    crayonLine(rng, o.cheer ? [[-3, hy + 3.4], [0, hy + 5.6], [3, hy + 3.4]] : [[-2.6, hy + 4], [0, hy + 5], [2.6, hy + 4]], K, 0.6, 0.08);
    crayonLine(rng, [[-1.2, hy - 7.2], [0, hy - 8.4], [1.4, hy - 7.6], [0.4, hy - 6.6]], '#6b4a2b', 0.5, 0.06);
    crayonLine(rng, [[-6, hy - 3.6], [-4.6, hy - 4.2]], '#8a5a3a', 0.4, 0.05);
    crayonLine(rng, [[6, hy - 3.6], [4.6, hy - 4.2]], '#8a5a3a', 0.4, 0.05);
  }

  function groundShadow(x, w) {
    worldT();
    const rng = rngFor(hash(Math.round(x * 4), 530));
    crayon(rng, wobblyEllipse(rng, x - w * 0.45, 0.8, w, 2.2), SHADOW, { edge: 0.5, alpha: 0.8 });
  }

  function drawLeaf(rng, rot, col, sz) {
    ctx.rotate(rot);
    crayon(rng, wobblyEllipse(rng, 0, 0, 2.2 * sz, 1.1 * sz, 0, 0.12), col, { edge: 0.3 });
    crayonLine(rng, [[-2 * sz, 0], [2 * sz, 0]], 'rgba(90,40,10,0.7)', 0.3, 0.05);
  }

  function drawZ(rng, sz) {
    crayonLine(rng, [[0, 0], [sz, 0], [0, sz], [sz, sz]], '#1d1b1a', 0.55 + sz * 0.08, 0.08);
  }

  // ---------- the story ----------
  // After the opening (u = t - T0): the camera pulls out to the yard; the kid brings the supper dish;
  // happy dance; Snoopy eats while the kid heads off; he hops onto the doghouse roof and lies on his
  // back; the bird settles on his tummy; Zs; the sun sets and the stars come out.
  const KID_IN0 = 4.0, KID_IN1 = 7.0, DISH0 = 7.0, DISH1 = 7.6, DANCE0 = 7.6, DANCE1 = 11.0, EAT0 = 11.0, EAT1 = 13.0;
  const KID_OUT0 = 11.2, KID_OUT1 = 14.6, HOP0 = 13.3, HOP1 = 14.4, BIRD0 = 15.0, BIRD1 = 17.2, ZZZ0 = 16.4, END = 23;
  const KID_STOP = 30, DISH_X = 15;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const span = (u, a, b) => clamp01((u - a) / (b - a));

  let t = 0, frame = 0, notes = [], zs = [], leaves = [], kibble = [];
  let tagTimer = 0;
  function say(text, ms = 2600) {
    tagEl.textContent = text; tagEl.classList.remove('gone');
    clearTimeout(tagTimer); tagTimer = setTimeout(() => tagEl.classList.add('gone'), ms);
  }

  function newLeaf(falling) {
    const col = pick(['#d9662a', '#e8962f', '#c8452c', '#f0b232', '#b5532a']);
    const x = falling ? -100 + R() * 52 : -160 + R() * 320;
    return { x, y: falling ? -110 + R() * 40 : R() * 30, rest: R() * 26 + 0.5, vy: 5 + R() * 4, sway: R() * 6, rot: R() * 6, spin: (R() - 0.5) * 4,
      col, sz: 0.8 + R() * 0.5, landed: !falling, id: Math.floor(R() * 1e9) };
  }
  function startIntro() {
    t = 0; notes = []; zs = []; kibble = [];
    leaves = [];
    for (let i = 0; i < 46; i++) leaves.push(newLeaf(false));
    placeCamera(0, 1);
  }

  // Snoopy's state at story time u: where his feet (or, lying, his back) are, and his pose
  function snoopyState(u) {
    const st = { x: 0, y: 0, ang: 0, o: { still: true } };
    if (u < 0.9) { const k = 1 - u / 0.9; st.o = { sw: Math.sin(((T0 - RIG0) - 2.1) * 9.4 + Math.PI / 2 + u * 9.4) * k }; }
    if (u >= DANCE0 && u < DANCE1) {
      const m = u - DANCE0, d = Math.min(1, m / 0.3, (DANCE1 - DANCE0 - m) / 0.3);
      st.o = { dance: Math.max(0, d) };
      st.ph = m * 11;
    }
    if (u >= EAT0 && u < HOP0) {
      const e = ease(Math.min(span(u, EAT0, EAT0 + 0.4), 1 - span(u, EAT1 - 0.3, EAT1)));
      st.o = { still: true, eat: e, chew: u * 26 }; // chomping, head bobbing
    }
    if (u >= HOP0) {
      const k = span(u, HOP0, HOP1), e = ease(k);
      // pivot on his back: standing, his back is 5 left of and 9 up from his feet
      const bx = -5.0, by = -9.12, rx = RIDGE_X + 4, ry = ROOF_Y - 0.4;
      st.pivot = [bx + (rx - bx) * e, by + (ry - by) * e - Math.sin(Math.PI * k) * 16];
      st.ang = -Math.PI / 2 * ease(span(k, 0.15, 0.85));
      st.o = { still: true, earHang: 0.75 * ease(span(u, HOP1 - 0.3, HOP1 + 0.5)) - Math.sin(Math.PI * k) * 0.6, sleep: u > HOP1 + 0.8 };
    }
    return st;
  }

  function step(dt) {
    t += dt;
    const u = t - T0;
    const at = (x) => t - dt < x && t >= x;
    if (at(0.1)) say('1. doodle snoopy', 4000);
    if (at(FILL0)) say('2. colour him in', 1600);
    if (at(RIG0)) say('3. rig him and make him walk', 3200);
    if (at(T0)) say('4. take him home', 3000);
    if (at(T0 + DANCE0)) say('suppertime!', 3000);
    if (at(T0 + HOP0 + 2.5)) say('goodnight, snoopy', 4200);
    if (u >= 0) {
      // leaves drift down from the tree and settle on the grass
      if (R() < dt * 2.2) leaves.push(newLeaf(true));
      for (const l of leaves) {
        if (l.landed) continue;
        l.y += l.vy * dt; l.x += (Math.sin(t * 2 + l.sway) * 6 + 3) * dt; l.rot += l.spin * dt;
        if (l.y >= l.rest) { l.y = l.rest; l.landed = true; }
      }
      if (leaves.length > 140) leaves.splice(0, leaves.length - 140);
      // music notes in the dance, Zs while he sleeps
      if (u > DANCE0 && u < DANCE1 - 0.4 && frame % 4 === 0) notes.push({ born: t, dx: (R() - 0.3) * 16, id: Math.floor(R() * 1e9), col: pick(['#1d1b1a', '#d8322b', '#2f5fd0', '#3c9a43']) });
      if (u > ZZZ0 && frame % 14 === 0) zs.push({ born: t, id: Math.floor(R() * 1e9) });
      if (u > EAT0 + 0.3 && u < EAT1 - 0.4 && frame % 2 === 0) kibble.push({ born: t, x0: DISH_X + (R() - 0.5) * 8, id: Math.floor(R() * 1e9) });
    }
    notes = notes.filter((n) => t - n.born < 1.6);
    zs = zs.filter((z) => t - z.born < 3.2);
    kibble = kibble.filter((k) => t - k.born < 0.45);
    document.body.style.background = mix('#e9e0cf', '#8f86a3', dusk() * 0.6);
    placeCamera(u < 0 ? 0 : ease(clamp01(u / PULL)), dt);
  }
  const dusk = () => ease(clamp01((t - T0 - 5) / 15));

  // Camera: k=0 frames Snoopy filling the screen (the doodle); k=1 the yard. After the pull-out the
  // camera drifts in on the dance, out again, then slowly in on Snoopy asleep on the roof.
  function placeCamera(k, dt) {
    const s0 = Math.min((0.6 * H) / 34, (0.8 * W) / 30);
    const sw = Math.min(W / 150, H / 160);
    const u = t - T0;
    let tx = -10, ty = -58, ts = sw;
    if (u > DANCE0 - 0.5 && u < DANCE1 + 0.3) { tx = 6; ty = -30; ts = sw * 1.5; }
    else if (u >= DANCE1 + 0.3 && u < HOP1 + 1) { tx = -8; ty = -48; ts = sw * 1.15; }
    else if (u >= HOP1 + 1) { tx = -30; ty = -64; ts = sw * 1.75; }
    if (k < 1) {
      const c0x = 6.8, c0y = -17;
      cam.s = Math.exp(Math.log(s0) + (Math.log(sw) - Math.log(s0)) * k);
      cam.x = c0x + (-10 - c0x) * k; cam.y = c0y + (-58 - c0y) * k;
      return;
    }
    const rate = Math.min(1, dt * (u > HOP1 + 1 ? 0.45 : 1.3));
    cam.x += (tx - cam.x) * rate; cam.y += (ty - cam.y) * rate;
    cam.s = Math.exp(Math.log(cam.s) + (Math.log(ts) - Math.log(cam.s)) * rate);
  }

  function grainPass() {
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

  function drawSnoopyAt(st) {
    if (st.pivot) {
      place(...st.pivot); ctx.rotate(st.ang); ctx.translate(5.0, 9.12);
    } else { place(st.x, st.y); if (st.lean) ctx.rotate(st.lean); }
    drawSnoopy(rngFor(9, 2), st.ph || 0, st.o);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (t < T0) {
      // the opening: just Snoopy on the paper
      place(0, 0);
      if (t < RIG0) drawDoodle(rngFor(9, 6), t);
      else {
        // pins pop in, the cursor grabs his front foot and drags it forward, then he walks
        const rt = t - RIG0, pins = {};
        let sw = 0, cursorAt = null, ca = 0, active = null;
        if (rt > 1.3 && rt < 2.1) { sw = 1.6 * ease(span(rt, 1.3, 2.1)); active = 'footR'; }
        else if (rt >= 2.1) sw = Math.sin((rt - 2.1) * 9.4 + Math.PI / 2) * (1 + 0.6 * (1 - span(rt, 2.1, 2.4)));
        drawSnoopy(rngFor(9, 2), 0, { sw, pins });
        const shown = span(rt, 0.05, 1.0) * PIN_ORDER.length;
        drawRigOverlay(pins, shown, 1 - span(rt, T0 - RIG0 - 0.45, T0 - RIG0 - 0.05), active);
        const [fx, fy] = pins.footR;
        if (rt < 2.1) {
          const k = ease(span(rt, 0.7, 1.3));
          cursorAt = [cv.width * 0.92 + (fx - cv.width * 0.92) * k, cv.height * 0.98 + (fy - cv.height * 0.98) * k];
          ca = span(rt, 0.7, 0.9);
        } else {
          const k = ease(span(rt, 2.2, 3.0));
          cursorAt = [fx + k * 90 * dpr, fy + k * 60 * dpr];
          ca = 1 - span(rt, 2.6, 3.0);
        }
        if (ca > 0) drawCursor(cursorAt[0], cursorAt[1], ca);
      }
      grainPass();
      return;
    }
    const u = t - T0, d = dusk();
    drawSky(d);
    drawSun(u, d);
    drawYard(d);
    // leaves already on the grass
    for (const l of leaves) if (l.landed) { place(l.x, l.y); drawLeaf(rngFor(l.id), l.rot, l.col, l.sz); }
    drawDoghouse(d);
    const st = snoopyState(u);
    // the kid and the dish
    let kidX = null, kidWalk = false, carry = false;
    if (u >= KID_IN0 && u < KID_IN1) { kidX = 105 + (KID_STOP - 105) * span(u, KID_IN0, KID_IN1); kidWalk = true; carry = true; }
    else if (u >= KID_IN1 && u < KID_OUT0) { kidX = KID_STOP; carry = u < DISH0; }
    else if (u >= KID_OUT0 && u < KID_OUT1) { kidX = KID_STOP + (110 - KID_STOP) * span(u, KID_OUT0, KID_OUT1); kidWalk = true; }
    let dish = null;
    if (u >= DISH0) {
      const k = ease(span(u, DISH0, DISH1));
      dish = { x: KID_STOP + (DISH_X - KID_STOP) * k, y: -13.4 * (1 - k) - Math.sin(Math.PI * k) * 3, amount: 1 - span(u, EAT0 + 0.3, EAT1 - 0.3) };
    }
    if (!st.pivot) groundShadow(4, 13);
    if (kidX != null) groundShadow(kidX, 9);
    if (dish) { place(dish.x, dish.y); drawDish(rngFor(540), dish.amount); }
    drawSnoopyAt(st);
    if (kidX != null) {
      place(kidX, 0);
      drawKid(rngFor(550), (kidX - 105) * 0.45, { walk: kidWalk, carry, cheer: u > DANCE0 && u < DANCE1 });
    }
    // music notes rise from his head in the dance
    for (const n of notes) {
      const k = (t - n.born) / 1.6;
      place(4 + n.dx * k + Math.sin(k * 9) * 3, SN_TOP - 2 - k * 26);
      const sc = 1.1 * Math.min(1, k * 5); ctx.scale(sc, sc);
      ctx.globalAlpha = 1 - k * k;
      drawNote(rngFor(n.id, 4), n.col);
      ctx.globalAlpha = 1;
    }
    // kibble hops out of the dish in little arcs and into his mouth
    for (const kb of kibble) {
      const k = (t - kb.born) / 0.45;
      place(kb.x0 + (11.5 - kb.x0) * k, -5 + (-18.5 + 5) * k - Math.sin(Math.PI * k) * 9);
      crayon(rngFor(kb.id), wobblyEllipse(rngFor(kb.id), 0, 0, 1.2, 0.95, k * 6, 0.1), '#8a5a2b', { edge: 0.3 });
    }
    // the bird: flies from the tree to his tummy and settles there
    if (u >= BIRD0) {
      const k = ease(span(u, BIRD0, BIRD1));
      const tx = RIDGE_X + 4, ty = ROOF_Y - 15.4; // on his tummy
      const bx = -78 + (tx + 78) * k + Math.sin(k * Math.PI * 3) * 8 * (1 - k);
      const by = -86 + (ty + 86) * k - Math.sin(k * Math.PI) * 14;
      place(bx, by);
      if (k >= 1) { ctx.translate(0, Math.sin(t * 2) * 0.25); drawBird(rngFor(11, 2), 0, true); }
      else drawBird(rngFor(11, 2), t, false);
    }
    // Zs drift up from his nose
    for (const z of zs) {
      const k = (t - z.born) / 3.2;
      place(RIDGE_X - 8 + k * 10 + Math.sin(k * 6) * 2, ROOF_Y - 20 - k * 22);
      ctx.globalAlpha = Math.min(1, k * 6) * (1 - k);
      drawZ(rngFor(z.id), 2 + k * 3);
      ctx.globalAlpha = 1;
    }
    // falling leaves in front of everything
    for (const l of leaves) if (!l.landed) { place(l.x, l.y); drawLeaf(rngFor(l.id), l.rot, l.col, l.sz); }
    // the world fades in around Snoopy as the camera pulls out: paper over everything, Snoopy on top
    if (u < FADE) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1 - ease(u / FADE);
      ctx.fillStyle = '#e9e0cf'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.globalAlpha = 1;
      drawSnoopyAt(st);
    }
    grainPass();
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
  document.getElementById('bReplay').addEventListener('click', () => startIntro());
  resize();
  startIntro();
  requestAnimationFrame(loop);
})();
