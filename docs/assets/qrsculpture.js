// A company's QR world, mountable anywhere: its signature model stands on a plaza whose tiles
// faintly carry the QR code. setScan(true) breaks the model into cube pixels that arc down onto
// the QR's dark squares and darken to a scannable shade of their own colour, in a diagonal sweep, while the camera tilts to
// top-down; setScan(false) plays it backwards and the pixels rebuild the model. With `loop` it
// keeps going back and forth on its own until a tap, a drag or setScan() takes over.
import { THREE, rng, createStage, buildSlab, buildInk, decodeBits, isFinder, setCamera, flyCamera, tween, lerp } from './qrworld.js';
import { ARCHETYPES, centerpiece, modelMaterial, setBrands, vertexColor, propGeo, topperGeo, motion, mountMovers, poseMovers, restMatrices } from './models.js';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t) => t * t * (3 - 2 * t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const PLAZA = '#ddd3c2';
// Timings (ms): model growing in, each morph, the holds on either side of a loop, and the pause before it starts.
const GROW_MS = 1500, MORPH_MS = 1700, HOLD_QR_MS = 1500, HOLD_MODEL_MS = 3000, START_MS = 2500;
// A pixel's colour made vivid for the code: saturated, lightness kept mid-range, and darkened (same
// hue) only as far as scanning needs (about 2.8:1 against the paving, like the leaves on the tree).
function inkOf(color) {
  const out = color.clone(), hsl = {};
  const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; // colours are linear in three.js
  out.getHSL(hsl);
  if (hsl.s > 0.12) out.setHSL(hsl.h, Math.min(1, hsl.s * 1.4 + 0.2), THREE.MathUtils.clamp(hsl.l, 0.34, 0.5));
  for (let k = 0; k < 30 && lum(out) > 0.2; k++) {
    out.getHSL(hsl);
    out.setHSL(hsl.h, hsl.s, hsl.l * 0.94);
  }
  return out;
}

// Random points on a mesh's surface (area-weighted), each with the colour of its triangle.
function sampleSurface(geos, count, random, brand) {
  const tris = [];
  let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  for (const { geo, matrix } of geos) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i).applyMatrix4(matrix);
      b.fromBufferAttribute(pos, i + 1).applyMatrix4(matrix);
      c.fromBufferAttribute(pos, i + 2).applyMatrix4(matrix);
      const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2;
      if (area <= 1e-6) continue;
      total += area;
      tris.push({ cum: total, a: a.clone(), b: b.clone(), c: c.clone(), color: vertexColor(geo, i, brand) });
    }
  }
  const out = [];
  for (let k = 0; k < count; k++) {
    const x = random() * total;
    let lo = 0, hi = tris.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid].cum < x) lo = mid + 1; else hi = mid; }
    const t = tris[lo];
    let u = random(), v = random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    out.push({ p: t.a.clone().addScaledVector(ab.subVectors(t.b, t.a), u).addScaledVector(ac.subVectors(t.c, t.a), v), color: t.color });
  }
  return { points: out, area: total };
}

export function createQRWorld(container, { slug, model, look = { v: 0, a: '#e5533d', b: '#2b2f36', base: 0 }, qr, insets = () => ({ top: 110, bottom: 175 }), viewScale = 1.55, autoRotate = true, loop = false, onScan = () => {} } = {}) {
  const { n, bits } = qr;
  const dark = decodeBits(n, bits);
  const finder = isFinder(n);
  const QUIET = 2;
  const size = n + QUIET * 2;
  const pos = (r, c) => [c - n / 2 + 0.5, r - n / 2 + 0.5];
  const ground = 0.14;
  const random = rng(slug + 'pixels');
  const arch = ARCHETYPES[model] || ARCHETYPES.tree;

  const stage = createStage(container, { viewSize: size * viewScale });
  stage.setSun(size);
  const { scene } = stage;
  scene.add(buildSlab(size));

  // The QR's dark modules, each with the moment in the morph its pixel lands (a diagonal sweep).
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (dark(r, c)) cells.push({ r, c, finder: finder(r, c), sweep: (r + c) / (2 * (n - 1)) });
  const ink = buildInk(cells.map(({ r, c }) => [r + QUIET, c + QUIET]), size, '#ffffff');
  scene.add(ink);

  // Plaza tiles: the code shows faintly in the paving; the corner squares are raised in the model's colour.
  const plaza = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 1, 0.96).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.85 }), cells.length);
  plaza.receiveShadow = true;
  plaza.castShadow = true;
  const finderColor = new THREE.Color(arch.finder), plazaColor = new THREE.Color(PLAZA);
  cells.forEach((cell, i) => plaza.setColorAt(i, cell.finder ? finderColor : plazaColor));
  scene.add(plaza);

  // ---------- the model ----------
  const cp = centerpiece(arch.id, look.v, look.base);
  const brand = [look.a, look.b];
  const mat = modelMaterial();
  // One-instance meshes so the brand colours reach the shader the same way as on the world board.
  const branded = (geo) => {
    const m = new THREE.InstancedMesh(geo, mat, 1);
    m.setMatrixAt(0, new THREE.Matrix4());
    setBrands(m, [brand]);
    m.frustumCulled = false;
    return m;
  };
  // Companion prop beside the model and a topper on its crown, when the company has them.
  const accs = (cp.bare ? [] : [[look.prop != null ? propGeo(look.prop) : null, cp.propAt], [look.topper ? topperGeo(look.topper) : null, cp.topAt]])
    .filter(([geo]) => geo).map(([geo, at]) => ({ geo, matrix: new THREE.Matrix4().makeTranslation(...at) }));
  const bb = new THREE.Box3().setFromBufferAttribute(cp.geo.attributes.position);
  for (const a of accs) bb.union(new THREE.Box3().setFromBufferAttribute(a.geo.attributes.position).applyMatrix4(a.matrix));
  const rest = restMatrices(cp);
  const moverGeos = cp.moving.map((mv, i) => mv.geo && { geo: mv.geo, matrix: rest[i] }).filter(Boolean);
  for (const a of moverGeos) bb.union(new THREE.Box3().setFromBufferAttribute(a.geo.attributes.position).applyMatrix4(a.matrix));
  const bsize = bb.getSize(new THREE.Vector3());
  const S = Math.min((n * 0.66) / Math.max(1, bb.max.y), (n * 1.0) / Math.max(bsize.x, bsize.z));
  const modelGroup = new THREE.Group();
  modelGroup.scale.setScalar(S);
  const center = branded(cp.geo);
  center.castShadow = center.receiveShadow = true;
  modelGroup.add(center);
  for (const a of accs) {
    const mesh = branded(a.geo);
    mesh.setMatrixAt(0, a.matrix);
    mesh.castShadow = mesh.receiveShadow = true;
    modelGroup.add(mesh);
  }
  const movers = mountMovers(cp, modelGroup, (geo) => {
    const mesh = branded(geo);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  });
  scene.add(modelGroup);
  const top = bb.max.y * S;

  // ---------- pixels ----------
  // One pixel per dark module, sampled from the model's surface and matched to a nearby square.
  const sample = sampleSurface([{ geo: cp.geo, matrix: new THREE.Matrix4() }, ...accs, ...moverGeos], cells.length, random, brand);
  const voxel = THREE.MathUtils.clamp(Math.sqrt((sample.area * S * S) / cells.length) * 1.15, 0.45, 1.3);
  const footprint = Math.max(bsize.x, bsize.z) * S / 2;
  const spread = (n * 0.5) / Math.max(1, footprint);
  const free = cells.map((_, i) => i);
  const pixelsData = sample.points
    .map((pt) => ({ src: pt.p.clone().multiplyScalar(S), color: pt.color }))
    .sort((a, b) => a.src.y - b.src.y)
    .map((px) => {
      // Nearest free square to where the pixel sits, spread out to the board's size.
      const gx = px.src.x * spread, gz = px.src.z * spread;
      let best = 0, bestD = Infinity;
      for (let k = 0; k < free.length; k++) {
        const [x, z] = pos(cells[free[k]].r, cells[free[k]].c);
        const d = (x - gx) ** 2 + (z - gz) ** 2;
        if (d < bestD) { bestD = d; best = k; }
      }
      const cell = free[best];
      free.splice(best, 1);
      const [tx, tz] = pos(cells[cell].r, cells[cell].c);
      return { ...px, ink: inkOf(px.color), cell, dst: new THREE.Vector3(tx, ground, tz), delay: 0.04 + cells[cell].sweep * 0.5 + random() * 0.06, arc: 1.5 + random() * 3, spin: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(), turns: 1 + random() * 2 };
    });
  const pixels = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true }), pixelsData.length);
  pixels.castShadow = true;
  pixels.receiveShadow = true;
  pixels.visible = false;
  scene.add(pixels);
  const col = new THREE.Color();
  // Each square of the finished code is painted the colour of the pixel that lands on it.
  const colors = new Array(n * n).fill(null);
  for (const px of pixelsData) {
    ink.setColorAt(px.cell, px.ink);
    colors[cells[px.cell].r * n + cells[px.cell].c] = '#' + px.ink.getHexString();
  }
  ink.instanceColor.needsUpdate = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();

  let hoverY = 0;
  // m: 0 = model, 1 = flat QR.
  function poseMorph(m) {
    const showModel = m < 0.035;
    modelGroup.visible = showModel;
    pixels.visible = m > 0;
    if (pixels.visible) {
      const appear = smooth(clamp01(m / 0.035));
      pixelsData.forEach((px, i) => {
        const t = clamp01((m - px.delay) / 0.38);
        const e = easeInOut(t);
        p.copy(px.src).setY(px.src.y + hoverY).lerp(px.dst, e);
        p.y += Math.sin(Math.PI * e) * px.arc;
        q.setFromAxisAngle(px.spin, Math.sin(Math.PI * e) * px.turns);
        const land = smooth(clamp01((t - 0.75) / 0.25));
        const w = lerp(voxel, 0.98, e) * (m < 0.035 ? appear : 1);
        s.set(w, Math.max(0.001, lerp(voxel, 0.24, land) * (m < 0.035 ? appear : 1)), w);
        pixels.setMatrixAt(i, m4.compose(p, q, s));
        pixels.setColorAt(i, col.copy(px.color).lerp(px.ink, smooth(clamp01((t - 0.55) / 0.45))));
      });
      pixels.instanceMatrix.needsUpdate = true;
      pixels.instanceColor.needsUpdate = true;
    }
    // The raised corner squares settle flat so their pixels can land on them.
    const fh = lerp(0.32, 0.05, smooth(clamp01(m * 1.6)));
    cells.forEach((cell, i) => {
      if (!cell.finder || grow < 1) return;
      const [x, z] = pos(cell.r, cell.c);
      plaza.setMatrixAt(i, m4.compose(p.set(x, ground, z), q.identity(), s.set(1, fh, 1)));
    });
    plaza.instanceMatrix.needsUpdate = true;
    ink.visible = m > 0.85;
    ink.material.opacity = smooth(clamp01((m - 0.88) / 0.12));
  }

  // g: growth from nothing to full (intro). Plaza tiles rise, then the model pops up.
  let grow = 0;
  function poseGrow(g) {
    grow = g;
    cells.forEach((cell, i) => {
      const [x, z] = pos(cell.r, cell.c);
      const h = cell.finder ? 0.32 : 0.05;
      const k = clamp01((g - cell.sweep * 0.4) / 0.4);
      plaza.setMatrixAt(i, m4.compose(p.set(x, ground, z), q.identity(), s.set(1, Math.max(0.001, h * k), 1)));
    });
    plaza.instanceMatrix.needsUpdate = true;
    const mg = clamp01((g - 0.35) / 0.65);
    modelGroup.scale.set(S * Math.max(0.001, Math.min(1.1, easeOutBack(mg))), S * Math.max(0.001, easeOutBack(mg)), S * Math.max(0.001, Math.min(1.1, easeOutBack(mg))));
  }

  // Idle motion: spinning parts, flapping wings, falling phones, hovering.
  function animate(t) {
    if (reduceMotion()) return;
    hoverY = cp.hover ? Math.sin(t * 1.2) * cp.hover * S * 0.35 : 0;
    // The model's own move (src/models.js motion); kept small enough to stay on its plaza.
    const b = motion(arch.id, cp, t);
    modelGroup.position.set(b.x * top * 0.6, hoverY + b.y * top * 0.6, b.z * top * 0.6);
    modelGroup.rotation.set(b.rx, b.ry, b.rz);
    if (grow >= 1) modelGroup.scale.set(S * b.sx, S * b.sy, S * b.sz); // the intro owns the scale until it ends
    poseMovers(movers, t);
  }

  let morph = 0, morphing = false, clock = 0;
  stage.frame.add((dt) => {
    clock += dt;
    mat.userData.tick(clock);
    if (morph === 0) animate(clock);
  });

  // ---------- camera ----------
  const ISO = { az: Math.PI / 4, polar: 0.98 };
  const home = () => ({ target: new THREE.Vector3(0, Math.min(top * 0.42, n * 0.3), 0), az: ISO.az, polar: ISO.polar, zoom: Math.min(1, (n * 1.05) / Math.max(n * 0.6, top)) });
  // Straight down, sized to the space between the page's top and bottom overlays.
  const topView = () => {
    const H = container.clientHeight, W = container.clientWidth;
    const { top: topPad, bottom: botPad } = insets(W, H);
    const halfH = stage.camera.top;
    const fitPx = Math.min(H - topPad - botPad, W - 24);
    const zoom = (2 * halfH * fitPx) / (H * size);
    const unitsPerPx = (2 * halfH) / zoom / H;
    const delta = (topPad + (H - botPad)) / 2 - H / 2;
    return { target: new THREE.Vector3(0, 0, -delta * unitsPerPx), az: 0, polar: 0.0001, zoom };
  };
  setCamera(stage, { ...home(), az: ISO.az - 0.9, zoom: 0.8, radius: 400 });

  // Morph to `to` (0 model, 1 QR) from wherever it is now; a newer morph cancels this one mid-way.
  let run = 0;
  function morphTo(to) {
    const token = ++run;
    const from = morph;
    const duration = reduceMotion() ? 1 : Math.max(1, MORPH_MS * Math.abs(to - from));
    morphing = true;
    flyCamera(stage, to ? topView() : home(), { duration: duration * 0.85 });
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = () => {
        if (token !== run) { stage.frame.delete(tick); return resolve(false); }
        const t = Math.min(1, (performance.now() - start) / duration);
        morph = lerp(from, to, t); // each pixel eases on its own; the sweep itself stays linear
        poseMorph(morph);
        if (t >= 1) {
          stage.frame.delete(tick);
          morphing = false;
          resolve(true);
        }
      };
      stage.frame.add(tick);
    });
  }

  let scanning = false;
  function go(on) {
    scanning = on;
    stage.controls.enabled = !on;
    stage.controls.autoRotate = false;
    onScan(on);
    return morphTo(on ? 1 : 0);
  }
  // With `loop`, the model keeps turning into its QR code and back until stopLoop() or setScan().
  let looping = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function startLoop() {
    if (reduceMotion()) return;
    const id = ++looping;
    await ready;
    await wait(START_MS);
    while (id === looping) {
      if (!(await go(!scanning))) return;
      await wait(scanning ? HOLD_QR_MS : HOLD_MODEL_MS);
    }
  }
  const stopLoop = () => looping++;
  // A person's choice: ends the loop and goes straight there, even mid-morph.
  function setScan(on) {
    stopLoop();
    if (on !== scanning) return go(on);
  }

  poseGrow(0);
  poseMorph(0);
  flyCamera(stage, home(), { duration: GROW_MS });
  const ready = tween(stage, GROW_MS, (t) => poseGrow(t)).then(() => {
    if (autoRotate && !scanning && !reduceMotion()) {
      stage.controls.autoRotate = true;
      stage.controls.autoRotateSpeed = 0.6;
    }
  });
  stage.controls.addEventListener('start', () => (stage.controls.autoRotate = false));
  // Grabbing the scene ends the loop.
  stage.renderer.domElement.addEventListener('pointerdown', stopLoop);
  if (loop) startLoop();

  return {
    stage,
    ready,
    setScan,
    startLoop,
    stopLoop,
    colors,
    get scanning() { return scanning; },
    get busy() { return morphing; },
    dispose: () => { stopLoop(); run++; stage.dispose(); },
  };
}
