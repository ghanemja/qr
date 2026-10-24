// A company's QR world. Its signature model stands in the middle and small pieces (bills,
// phones, barrels, leaves…) float above the dark modules, so from straight above they read
// as the QR code. Tapping settles everything into a flat, scannable code. Spring, Summer and
// Autumn swap in a tree; City swaps in a skyline.
import { THREE, SEASONS, rng, createStage, buildSlab, buildInk, windowTexture, decodeBits, isFinder, setCamera, flyCamera, tween, lerp, webglAvailable } from './qrworld.js';
import { ARCHETYPES, centerpiece, piece, modelMaterial } from './models.js';

const C = window.COMPANY;
const $ = (id) => document.getElementById(id);
const stageEl = $('stage');
const url = QRCard.siteUrl(`${C.slug}.html`);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Page chrome that works without WebGL.
$('page-url').value = url;
$('share').addEventListener('click', async () => {
  if (navigator.share) return navigator.share({ title: C.name, url }).catch(() => {});
  QRCard.copy(url, $('share-label'));
});
$('download').addEventListener('click', () => QRCard.download(url, C.name, `${C.slug}-qr.png`));
for (const input of document.querySelectorAll('.cite input')) input.addEventListener('focus', () => input.select());

if (!webglAvailable()) {
  document.body.classList.add('no-webgl');
  QRCard.draw($('fallback-qr'), url, C.name);
} else {
  start();
}

function start() {
  const { n, bits } = C.qr;
  const dark = decodeBits(n, bits);
  const finder = isFinder(n);
  const QUIET = 2;
  const size = n + QUIET * 2;
  const pos = (r, c) => [c - n / 2 + 0.5, r - n / 2 + 0.5];
  const dist = (r, c) => Math.hypot(...pos(r, c));
  const R = n * 0.5;
  const ground = 0.14;

  const stage = createStage(stageEl, { viewSize: size * (stageEl.clientWidth < 640 ? 1.38 : 1.55) });
  stage.setSun(size);
  const { scene } = stage;
  scene.add(buildSlab(size));

  const darkCells = [], finderCells = [], bodyCells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!dark(r, c)) continue;
      darkCells.push([r, c]);
      (finder(r, c) ? finderCells : bodyCells).push([r, c]);
    }
  }
  const ink = buildInk(darkCells.map(([r, c]) => [r + QUIET, c + QUIET]), size, '#1d232b');
  scene.add(ink);

  // ---------- sculptures (signature model or tree) ----------
  // Each sculpture: centerpiece + floating pieces + finder decoration; layout(g) poses it at growth g.
  function buildSculpture(arch, season) {
    const random = rng(C.slug + arch.id);
    const group = new THREE.Group();
    const mat = modelMaterial({ glow: arch.glow });
    const cp = centerpiece(arch.id);
    cp.geo.computeBoundingBox();
    const S = n / (arch.id === 'tree' ? 21 : 16.5); // model units → board units
    const pieceScale = arch.pieceScale ?? (arch.id === 'tree' ? 1 : 1.3);
    const top = cp.geo.boundingBox.max.y * S;
    const halfW = Math.max(cp.geo.boundingBox.max.x, cp.geo.boundingBox.max.z) * S;
    const center = new THREE.Mesh(cp.geo, mat);
    center.castShadow = center.receiveShadow = true;
    group.add(center);
    let spinner = null;
    if (cp.spin) {
      const g = cp.spin.geo.clone().translate(...cp.spin.pivot.map((v) => -v));
      spinner = new THREE.Group();
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      spinner.add(m);
      spinner.userData = { pivot: new THREE.Vector3(...cp.spin.pivot).multiplyScalar(S), axis: new THREE.Vector3(...cp.spin.axis), speed: cp.spin.speed };
      group.add(spinner);
    }

    // Where each dark module's piece floats.
    const cloudY = arch.cloud ? top * 0.82 : 0;
    const specs = [];
    const zoneOf = Object.fromEntries(arch.pieces.map(([k, , zone]) => [k, zone]));
    const pick = () => {
      let x = random();
      for (const [k, w] of arch.pieces) if ((x -= w) <= 0) return k;
      return arch.pieces[0][0];
    };
    for (const [r, c] of bodyCells) {
      const [x, z] = pos(r, c);
      const d = dist(r, c);
      const theta = Math.atan2(z, x);
      const k = Math.max(0, 1 - d / R);
      let y, kind = pick(), groundy = false, extra = 0;
      switch (arch.layout) {
        case 'canopy': {
          if (d < R) { y = top * 0.9 + n * 0.2 * Math.sqrt(1 - (d / R) ** 2) + random() * 0.5; extra = d < R * 0.85 ? 2 : 1; }
          else { y = 0.45; groundy = true; }
          break;
        }
        case 'swirl': {
          if (d < R * 1.05) { y = 0.9 + top * 1.25 * Math.pow(k, 0.75) + 1.4 * Math.sin(theta * 3 + d * 0.35) + random() * 0.6; extra = d < R * 0.7 ? 1 : 0; }
          else { y = 0.35 + random() * 0.3; groundy = true; }
          break;
        }
        case 'rain': {
          if (d < R * 0.46) { kind = 'puff'; y = cloudY + 0.6 + random() * 1.2; }
          else y = 0.6 + random() * cloudY * 0.95 * Math.min(1, k * 1.9 + 0.15);
          break;
        }
        case 'pile': {
          y = 0.4 + Math.floor(random() * 3) * 0.55 * k + random() * 0.15;
          if (d < halfW * 0.8) y = top + 0.6 + random() * 1.2;
          break;
        }
        default: { // orbit: a loose dome of pieces wrapped around the model
          if (d < R * 1.02) { y = top * 0.3 + top * 0.85 * Math.sqrt(Math.max(0, 1 - (d / R) ** 2)) + (random() - 0.5) * top * 0.3; extra = d < R * 0.6 ? 1 : 0; }
          else { y = 0.4 + random() * 0.4; groundy = true; }
        }
      }
      // Some pieces keep to the ground (smoke, luggage) or the sky (clouds, stars).
      if (zoneOf[kind] === 'low') { y = 0.45 + random() * 1.6; groundy = true; extra = 0; }
      else if (zoneOf[kind] === 'high') y = Math.max(y, top * 0.8 + random() * top * 0.45);
      if (d < halfW * 0.85 && y < top + 0.5 && !groundy) y = top + 0.6 + random() * 1.4; // stay clear of the centerpiece
      specs.push({ x, z, y: Math.max(0.45, y), kind, rot: random() * Math.PI * 2, phase: random() * 6.28, sy: 0.85 + random() * 0.3, tint: random(), delay: d / R, s: pieceScale });
      for (let e = 0; e < extra; e++) specs.push({ x: x + (random() - 0.5) * 0.4, z: z + (random() - 0.5) * 0.4, y: Math.max(0.6, y - 1 - random() * 2.5), kind, rot: random() * 6.28, phase: random() * 6.28, sy: 0.85, tint: random(), delay: d / R, s: pieceScale * 0.82 });
    }
    // One instanced mesh per piece kind.
    const byKind = new Map();
    for (const sp of specs) {
      if (!byKind.has(sp.kind)) byKind.set(sp.kind, []);
      byKind.get(sp.kind).push(sp);
    }
    const meshes = [];
    const tints = (kind) => (season && kind === 'leaf' ? SEASONS[season].leaves : kind === 'puff' && arch.cloud ? ['#ffffff', '#eef2f6', '#dfe5ec'] : (arch.tints || {})[kind]);
    for (const [kind, list] of byKind) {
      const im = new THREE.InstancedMesh(piece(kind), mat, list.length);
      im.castShadow = true;
      im.receiveShadow = true;
      const ts = tints(kind);
      if (ts) list.forEach((sp, i) => im.setColorAt(i, new THREE.Color(ts[Math.floor(sp.tint * ts.length)])));
      meshes.push({ im, list });
      group.add(im);
    }
    // Finder patterns: grass for trees, low platforms in the model's accent colour otherwise.
    let finderMesh, finderSpecs;
    if (arch.finder === 'grass') {
      finderSpecs = [];
      for (const [r, c] of finderCells) {
        const [x, z] = pos(r, c);
        for (let k = 0; k < 7; k++) finderSpecs.push({ x: x + (random() - 0.5) * 0.8, z: z + (random() - 0.5) * 0.8, h: 0.6 + random() * 0.7, lean: (random() - 0.5) * 0.6, a: random() * Math.PI * 2, col: Math.floor(random() * 3) });
      }
      finderMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.11, 1, 3).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), finderSpecs.length);
      const grass = SEASONS[season || 'summer'].grass;
      finderSpecs.forEach((b, i) => finderMesh.setColorAt(i, new THREE.Color(grass[b.col % grass.length])));
    } else {
      finderSpecs = finderCells.map(([r, c]) => { const [x, z] = pos(r, c); return { x, z }; });
      finderMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.94, 0.45, 0.94).translate(0, 0.22, 0), new THREE.MeshStandardMaterial({ color: arch.finder, roughness: 0.8 }), finderSpecs.length);
    }
    finderMesh.castShadow = true;
    group.add(finderMesh);

    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    let grow = 0;
    function pose(g, t) {
      grow = g;
      const cg = Math.max(0.001, Math.min(1, g * 1.35));
      center.scale.set(S, S * cg, S);
      if (spinner) {
        spinner.position.copy(spinner.userData.pivot).multiply(new THREE.Vector3(1, cg, 1));
        spinner.scale.setScalar(S * Math.max(0.001, Math.min(1, (g - 0.4) / 0.4)));
        if (!reduceMotion) spinner.quaternion.setFromAxisAngle(spinner.userData.axis, t * spinner.userData.speed);
      }
      const anim = reduceMotion ? 'none' : arch.anim;
      for (const { im, list } of meshes) {
        list.forEach((sp, i) => {
          const lg = Math.min(1, Math.max(0, (g - 0.3 - sp.delay * 0.3) / 0.4));
          const settled = lg >= 1 ? 1 : 0;
          let y = lerp(ground + 0.3, sp.y, lg);
          let rx = 0, ry = sp.rot, rz = 0;
          if (settled) {
            const w = t + sp.phase;
            if (anim === 'flutter') { y += Math.sin(w * 1.3) * 0.22; rx = Math.sin(w * 2.1) * 0.55; rz = Math.cos(w * 1.7) * 0.45; ry += t * 0.4; }
            else if (anim === 'spin') { y += Math.sin(w) * 0.12; ry += t * 1.2; }
            else if (anim === 'tumble') { y += Math.sin(w * 0.9) * 0.18; rx = w * 0.7; rz = w * 0.5; }
            else if (anim === 'bob') { y += Math.sin(w * 1.1) * 0.15; ry += Math.sin(w * 0.5) * 0.3; }
          }
          const s = Math.max(0.001, lg * sp.s);
          im.setMatrixAt(i, m4.compose(p.set(sp.x, y, sp.z), q.setFromEuler(e.set(rx, ry, rz)), sc.set(s, s * sp.sy, s)));
        });
        im.instanceMatrix.needsUpdate = true;
      }
      finderSpecs.forEach((b, i) => {
        if (arch.finder === 'grass') {
          const h = Math.max(0.001, b.h * Math.min(1, g * 1.6));
          finderMesh.setMatrixAt(i, m4.compose(p.set(b.x, ground, b.z), q.setFromEuler(e.set(b.lean, b.a, b.lean * 0.5)), sc.set(1, h, 1)));
        } else {
          finderMesh.setMatrixAt(i, m4.compose(p.set(b.x, ground, b.z), q.identity(), sc.set(1, Math.max(0.02, g), 1)));
        }
      });
      finderMesh.instanceMatrix.needsUpdate = true;
    }
    return { group, pose, top, get grow() { return grow; }, animated: arch.anim !== 'none' || !!spinner };
  }

  // ---------- city ----------
  function buildCity() {
    const random = rng(C.slug + 'city');
    const group = new THREE.Group();
    const facade = windowTexture();
    const wallMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: facade, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#2c3440', roughness: 0.7 });
    const specs = bodyCells.map(([r, c]) => {
      const d = dist(r, c), k = Math.max(0, 1 - d / (R * 1.05));
      const [x, z] = pos(r, c);
      return { x, z, h: 0.5 + n * 0.32 * Math.pow(k, 1.7) * (0.55 + random() * 0.45), delay: d / R };
    });
    const tallest = specs.reduce((a, b) => (b.h > a.h ? b : a), specs[0]);
    const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 1, 0.9).translate(0, 0.5, 0), [wallMat, wallMat, roofMat, roofMat, wallMat, wallMat], specs.length);
    buildings.castShadow = buildings.receiveShadow = true;
    const tintsW = ['#f4ede2', '#ebe3d6', '#f7f2ea', '#e4dccd', '#efe6d8'];
    specs.forEach((b, i) => buildings.setColorAt(i, new THREE.Color(tintsW[i % tintsW.length])));
    const hedges = new THREE.InstancedMesh(new THREE.BoxGeometry(0.94, 0.45, 0.94).translate(0, 0.22, 0), new THREE.MeshStandardMaterial({ color: '#3f7d45', roughness: 0.85 }), finderCells.length);
    hedges.castShadow = true;
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, n * 0.12, 6).translate(0, n * 0.06, 0), new THREE.MeshStandardMaterial({ color: '#c47a3a', metalness: 0.4, roughness: 0.4 }));
    group.add(buildings, hedges, spire);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    let grow = 0;
    function pose(g) {
      grow = g;
      specs.forEach((b, i) => {
        const bg = Math.min(1, Math.max(0, (g - b.delay * 0.4) / 0.6));
        buildings.setMatrixAt(i, m4.compose(p.set(b.x, ground, b.z), q.identity(), s.set(1, Math.max(0.02, b.h * bg), 1)));
      });
      buildings.instanceMatrix.needsUpdate = true;
      finderCells.forEach(([r, c], i) => {
        const [x, z] = pos(r, c);
        hedges.setMatrixAt(i, m4.compose(p.set(x, ground, z), q.identity(), s.set(1, Math.max(0.02, g), 1)));
      });
      hedges.instanceMatrix.needsUpdate = true;
      spire.position.set(tallest.x, ground + tallest.h * Math.min(1, Math.max(0, (g - tallest.delay * 0.4) / 0.6)), tallest.z);
      spire.scale.setScalar(Math.max(0.001, Math.min(1, (g - 0.7) / 0.3)));
    }
    return { group, pose, top: n * 0.3, get grow() { return grow; }, animated: false };
  }

  // ---------- styles ----------
  const built = new Map();
  function sculptureFor(style) {
    if (!built.has(style)) {
      const s = style === 'city' ? buildCity() : style === 'signature' ? buildSculpture(ARCHETYPES[C.model] || ARCHETYPES.tree, ARCHETYPES[C.model] ? null : 'summer') : buildSculpture(ARCHETYPES.tree, style);
      s.group.visible = false;
      scene.add(s.group);
      built.set(style, s);
    }
    return built.get(style);
  }
  let style = 'signature';
  let current = sculptureFor(style);
  current.group.visible = true;
  let scanning = false;
  let clock = 0;
  const hintText = () => (scanning ? 'Tap to see it in 3D' : 'Tap the model to see the QR code');

  // Keep animated models moving.
  stage.frame.add((dt) => {
    clock += dt;
    if (current.animated && !scanning && current.grow >= 1) current.pose(1, clock);
  });

  // ---------- camera ----------
  const ISO = { az: Math.PI / 4, polar: 0.98 };
  // Pull back for tall models so the top stays on screen.
  const home = () => ({ target: new THREE.Vector3(0, Math.min(current.top * 0.45, n * 0.3), 0), az: ISO.az, polar: ISO.polar, zoom: Math.min(1, (n * 1.05) / Math.max(n * 0.6, current.top)) });
  // Straight down, sized to the space between the title bar and the dock.
  const topView = () => {
    const H = stageEl.clientHeight, W = stageEl.clientWidth;
    const halfH = stage.camera.top;
    const topPad = W < 640 ? 100 : 110, botPad = W < 640 ? 190 : 175;
    const fitPx = Math.min(H - topPad - botPad, W - 32);
    const zoom = (2 * halfH * fitPx) / (H * size);
    const unitsPerPx = (2 * halfH) / zoom / H;
    const delta = (topPad + (H - botPad)) / 2 - H / 2;
    return { target: new THREE.Vector3(0, 0, -delta * unitsPerPx), az: 0, polar: 0.0001, zoom };
  };
  setCamera(stage, { ...home(), az: ISO.az - 0.9, zoom: 0.8, radius: 400 });

  // ---------- interactions ----------
  async function setScan(on) {
    if (on === scanning) return;
    scanning = on;
    document.body.classList.toggle('scanning', on);
    $('see').setAttribute('aria-pressed', String(on));
    $('hint').textContent = hintText();
    stage.controls.enabled = !on;
    stage.controls.autoRotate = false;
    if (on) {
      ink.visible = true;
      flyCamera(stage, topView(), { duration: 1500 });
      await tween(stage, 1500, (t) => {
        current.pose(1 - t, clock);
        ink.material.opacity = Math.max(0, t * 1.4 - 0.4);
      });
    } else {
      flyCamera(stage, home(), { duration: 1500 });
      await tween(stage, 1500, (t) => {
        current.pose(t, clock);
        ink.material.opacity = 1 - t;
      });
      ink.visible = false;
    }
  }
  $('see').addEventListener('click', () => setScan(!scanning));
  let down = null;
  stage.renderer.domElement.addEventListener('pointerdown', (ev) => (down = [ev.clientX, ev.clientY]));
  stage.renderer.domElement.addEventListener('pointerup', (ev) => {
    if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) < 6) setScan(!scanning);
    down = null;
  });
  stage.controls.addEventListener('start', () => (stage.controls.autoRotate = false));

  for (const b of document.querySelectorAll('.qw-tabs button')) {
    b.addEventListener('click', async () => {
      const next = b.dataset.theme;
      if (next === style) return;
      for (const o of document.querySelectorAll('.qw-tabs button')) o.setAttribute('aria-pressed', String(o === b));
      const old = current;
      style = next;
      current = sculptureFor(style);
      if (scanning) {
        old.group.visible = false;
        current.group.visible = true;
        current.pose(0, clock);
        return;
      }
      // Swap worlds: sink the old one, grow the new one.
      await tween(stage, 600, (t) => old.pose(1 - t, clock));
      old.group.visible = false;
      current.group.visible = true;
      current.pose(0, clock);
      flyCamera(stage, home(), { duration: 900 });
      await tween(stage, 1500, (t) => current.pose(t, clock));
    });
  }

  current.pose(0, 0);
  flyCamera(stage, home(), { duration: 2200 });
  tween(stage, 2400, (t) => current.pose(t, clock)).then(() => {
    if (!scanning && !reduceMotion) {
      stage.controls.autoRotate = true;
      stage.controls.autoRotateSpeed = 0.6;
    }
  });
  if (location.hash === '#scan') setTimeout(() => setScan(true), 2600);
}
