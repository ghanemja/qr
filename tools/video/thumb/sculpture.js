// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// The site's QR world (docs/assets/qrsculpture.js), posed frame by frame for the video instead of
// on its own clock: a company's model on a plaza that faintly carries the QR code; morph 0 → 1
// breaks the model into cube pixels that arc down onto the code's dark squares in a diagonal
// sweep and darken to a scannable shade of their own colour, while the camera tilts from the
// site's iso view to straight down; 1 → 0 rebuilds the model. The pixel sampling, sweep, ink
// colours, plaza and camera are the site's; only the clock is the video's.
import * as THREE from 'three';
const { RoomEnvironment } = await import('/qr/assets/RoomEnvironment.js');
const Q = await import('/qr/assets/qrworld.js');
const M = await import('/qr/assets/models.js');
const { rng, buildSlab, buildInk, decodeBits, isFinder, lerp } = Q;
const { ARCHETYPES, centerpiece, modelMaterial, setBrands, vertexColor, propGeo, topperGeo, motion, mountMovers, poseMovers, restMatrices } = M;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t) => t * t * (3 - 2 * t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const PLAZA = '#ddd3c2';

// As the site: a pixel's colour made vivid, darkened only as far as scanning needs.
function inkOf(color) {
  const out = color.clone(), hsl = {};
  const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  out.getHSL(hsl);
  if (hsl.s > 0.12) out.setHSL(hsl.h, Math.min(1, hsl.s * 1.4 + 0.2), THREE.MathUtils.clamp(hsl.l, 0.34, 0.5));
  for (let k = 0; k < 30 && lum(out) > 0.2; k++) { out.getHSL(hsl); out.setHSL(hsl.h, hsl.s, hsl.l * 0.94); }
  return out;
}
function sampleSurface(geos, count, random, brand) {
  const tris = []; let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  for (const { geo, matrix } of geos) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i).applyMatrix4(matrix); b.fromBufferAttribute(pos, i + 1).applyMatrix4(matrix); c.fromBufferAttribute(pos, i + 2).applyMatrix4(matrix);
      const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2;
      if (area <= 1e-6) continue;
      total += area; tris.push({ cum: total, a: a.clone(), b: b.clone(), c: c.clone(), color: vertexColor(geo, i, brand) });
    }
  }
  const out = [];
  for (let k = 0; k < count; k++) {
    const x = random() * total; let lo = 0, hi = tris.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid].cum < x) lo = mid + 1; else hi = mid; }
    const t = tris[lo]; let u = random(), v = random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    out.push({ p: t.a.clone().addScaledVector(ab.subVectors(t.b, t.a), u).addScaledVector(ac.subVectors(t.c, t.a), v), color: t.color });
  }
  return { points: out, area: total };
}

let R = null;
function renderer(W, H) {
  if (R) return R;
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H); R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setClearColor(0x000000, 0);
  return R;
}

// sculpture(company, qr, W, H, { fit }): company is window.COMPANY of a /qr/c/ page; qr { n, bits }.
// render(m, cam, t): m 0 model … 1 code, cam 0 iso … 1 top-down, t the model's own clock.
export function sculpture(C, { n, bits }, W, H, { fit = 0.86, viewScale = 1.55 } = {}) {
  const r = renderer(W, H), look = C.look, slug = C.slug;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.28;
  scene.add(new THREE.HemisphereLight('#fffaf0', '#d8cbb5', 0.95));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun, sun.target);

  const dark = decodeBits(n, bits), finder = isFinder(n), QUIET = 2, size = n + QUIET * 2;
  const pos = (rr, c) => [c - n / 2 + 0.5, rr - n / 2 + 0.5];
  const ground = 0.14, random = rng(slug + 'pixels'), arch = ARCHETYPES[C.model] || ARCHETYPES.tree;
  sun.position.set(-size * 0.55, size * 1.2, size * 0.35); sun.target.position.set(0, 0, 0);
  { const c = sun.shadow.camera; c.left = c.bottom = -size * 0.85; c.right = c.top = size * 0.85; c.near = 1; c.far = size * 4; c.updateProjectionMatrix(); }
  scene.add(buildSlab(size));

  const cells = [];
  for (let rr = 0; rr < n; rr++) for (let c = 0; c < n; c++) if (dark(rr, c)) cells.push({ r: rr, c, finder: finder(rr, c), sweep: (rr + c) / (2 * (n - 1)) });
  const ink = buildInk(cells.map(({ r: rr, c }) => [rr + QUIET, c + QUIET]), size, '#ffffff'); scene.add(ink);
  const plaza = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 1, 0.96).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.85 }), cells.length);
  plaza.receiveShadow = plaza.castShadow = true;
  const finderColor = new THREE.Color(arch.finder), plazaColor = new THREE.Color(PLAZA);
  cells.forEach((cell, i) => plaza.setColorAt(i, cell.finder ? finderColor : plazaColor));
  scene.add(plaza);

  const cp = centerpiece(arch.id, look.v, look.base), brand = [look.a, look.b], mat = modelMaterial();
  const branded = (geo) => { const m = new THREE.InstancedMesh(geo, mat, 1); m.setMatrixAt(0, new THREE.Matrix4()); setBrands(m, [brand]); m.frustumCulled = false; return m; };
  const accs = (cp.bare ? [] : [[look.prop != null ? propGeo(look.prop) : null, cp.propAt], [look.topper ? topperGeo(look.topper) : null, cp.topAt]])
    .filter(([geo]) => geo).map(([geo, at]) => ({ geo, matrix: new THREE.Matrix4().makeTranslation(...at) }));
  const bb = new THREE.Box3().setFromBufferAttribute(cp.geo.attributes.position);
  for (const a of accs) bb.union(new THREE.Box3().setFromBufferAttribute(a.geo.attributes.position).applyMatrix4(a.matrix));
  const rest = restMatrices(cp);
  const moverGeos = cp.moving.map((mv, i) => mv.geo && { geo: mv.geo, matrix: rest[i] }).filter(Boolean);
  for (const a of moverGeos) bb.union(new THREE.Box3().setFromBufferAttribute(a.geo.attributes.position).applyMatrix4(a.matrix));
  const bsize = bb.getSize(new THREE.Vector3());
  const S = Math.min((n * 0.66) / Math.max(1, bb.max.y), (n * 1.0) / Math.max(bsize.x, bsize.z));
  const modelGroup = new THREE.Group(); modelGroup.scale.setScalar(S);
  const center = branded(cp.geo); center.castShadow = center.receiveShadow = true; modelGroup.add(center);
  for (const a of accs) { const mesh = branded(a.geo); mesh.setMatrixAt(0, a.matrix); mesh.castShadow = mesh.receiveShadow = true; modelGroup.add(mesh); }
  const movers = mountMovers(cp, modelGroup, (geo) => { const mesh = branded(geo); mesh.castShadow = mesh.receiveShadow = true; return mesh; });
  scene.add(modelGroup);
  const top = bb.max.y * S;

  const sample = sampleSurface([{ geo: cp.geo, matrix: new THREE.Matrix4() }, ...accs, ...moverGeos], cells.length, random, brand);
  const voxel = THREE.MathUtils.clamp(Math.sqrt((sample.area * S * S) / cells.length) * 1.15, 0.45, 1.3);
  const footprint = Math.max(bsize.x, bsize.z) * S / 2, spread = (n * 0.5) / Math.max(1, footprint);
  const free = cells.map((_, i) => i);
  const pixelsData = sample.points.map((pt) => ({ src: pt.p.clone().multiplyScalar(S), color: pt.color })).sort((a, b) => a.src.y - b.src.y).map((px) => {
    const gx = px.src.x * spread, gz = px.src.z * spread; let best = 0, bestD = Infinity;
    for (let k = 0; k < free.length; k++) { const [x, z] = pos(cells[free[k]].r, cells[free[k]].c); const d = (x - gx) ** 2 + (z - gz) ** 2; if (d < bestD) { bestD = d; best = k; } }
    const cell = free[best]; free.splice(best, 1); const [tx, tz] = pos(cells[cell].r, cells[cell].c);
    return { ...px, ink: inkOf(px.color), cell, dst: new THREE.Vector3(tx, ground, tz), delay: 0.04 + cells[cell].sweep * 0.5 + random() * 0.06, arc: 1.5 + random() * 3, spin: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(), turns: 1 + random() * 2 };
  });
  const pixels = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true }), pixelsData.length);
  pixels.castShadow = pixels.receiveShadow = true; pixels.visible = false; scene.add(pixels);
  const col = new THREE.Color();
  for (const px of pixelsData) ink.setColorAt(px.cell, px.ink);
  ink.instanceColor.needsUpdate = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();

  // Grown in (the site's intro, at its end).
  cells.forEach((cell, i) => { const [x, z] = pos(cell.r, cell.c); plaza.setMatrixAt(i, m4.compose(p.set(x, ground, z), q.identity(), s.set(1, cell.finder ? 0.32 : 0.05, 1))); });
  plaza.instanceMatrix.needsUpdate = true;

  let hoverY = 0;
  function poseMorph(m) {
    modelGroup.visible = m < 0.035; pixels.visible = m > 0;
    if (pixels.visible) {
      const appear = smooth(clamp01(m / 0.035));
      pixelsData.forEach((px, i) => {
        const t = clamp01((m - px.delay) / 0.38), e = easeInOut(t);
        p.copy(px.src).setY(px.src.y + hoverY).lerp(px.dst, e); p.y += Math.sin(Math.PI * e) * px.arc;
        q.setFromAxisAngle(px.spin, Math.sin(Math.PI * e) * px.turns);
        const land = smooth(clamp01((t - 0.75) / 0.25)), w = lerp(voxel, 0.98, e) * (m < 0.035 ? appear : 1);
        s.set(w, Math.max(0.001, lerp(voxel, 0.24, land) * (m < 0.035 ? appear : 1)), w);
        pixels.setMatrixAt(i, m4.compose(p, q, s));
        pixels.setColorAt(i, col.copy(px.color).lerp(px.ink, smooth(clamp01((t - 0.55) / 0.45))));
      });
      pixels.instanceMatrix.needsUpdate = true; pixels.instanceColor.needsUpdate = true;
    }
    const fh = lerp(0.32, 0.05, smooth(clamp01(m * 1.6)));
    cells.forEach((cell, i) => { if (!cell.finder) return; const [x, z] = pos(cell.r, cell.c); plaza.setMatrixAt(i, m4.compose(p.set(x, ground, z), q.identity(), s.set(1, fh, 1))); });
    plaza.instanceMatrix.needsUpdate = true;
    ink.visible = m > 0.85; ink.material.opacity = smooth(clamp01((m - 0.88) / 0.12));
  }
  function animate(t) {
    hoverY = cp.hover ? Math.sin(t * 1.2) * cp.hover * S * 0.35 : 0;
    const b = motion(arch.id, cp, t);
    modelGroup.position.set(b.x * top * 0.6, hoverY + b.y * top * 0.6, b.z * top * 0.6);
    modelGroup.rotation.set(b.rx, b.ry, b.rz); modelGroup.scale.set(S * b.sx, S * b.sy, S * b.sz);
    poseMovers(movers, t);
  }

  // The site's orthographic camera, its iso home view and its top-down view (the board fitted to
  // `fit` of the width, centred).
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000), aspect = W / H, halfH = (size * viewScale) / 2 / aspect;
  cam.left = -halfH * aspect; cam.right = halfH * aspect; cam.top = halfH; cam.bottom = -halfH; cam.updateProjectionMatrix();
  const home = { target: new THREE.Vector3(0, Math.min(top * 0.42, n * 0.3), 0), az: Math.PI / 4, polar: 0.98, zoom: Math.min(1, (n * 1.05) / Math.max(n * 0.6, top)) };
  const topV = { target: new THREE.Vector3(0, 0, 0), az: 0, polar: 0.0001, zoom: (2 * halfH * W * fit) / (H * size) };
  const tg = new THREE.Vector3();
  return {
    render(m, k, t = 0) {
      mat.userData.tick?.(t);
      if (m === 0) animate(t);
      poseMorph(m);
      tg.lerpVectors(home.target, topV.target, k);
      const polar = lerp(home.polar, topV.polar, k), az = lerp(home.az, topV.az, k);
      cam.position.copy(tg).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(400, Math.max(0.0001, polar), az)));
      cam.up.set(0, 1, 0); cam.lookAt(tg); cam.zoom = lerp(home.zoom, topV.zoom, k); cam.updateProjectionMatrix();
      r.render(scene, cam);
      return r.domElement;
    },
  };
}
