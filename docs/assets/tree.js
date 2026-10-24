// A company's QR world: the dark modules grow into a tree canopy (or a city), and
// scan view settles it back into a flat, scannable QR code.
import { THREE, SEASONS, rng, createStage, buildSlab, buildInk, windowTexture, decodeBits, isFinder, setCamera, flyCamera, tween, lerp, webglAvailable } from './qrworld.js';

const C = window.COMPANY;
const $ = (id) => document.getElementById(id);
const stageEl = $('stage');
const url = QRCard.siteUrl(`${C.slug}.html`);

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
  const random = rng(C.slug);

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

  const R = n * 0.5; // canopy radius
  const trunkH = n * 0.42;
  const domeH = n * 0.2;
  const dist = (r, c) => {
    const [x, z] = pos(r, c);
    return Math.hypot(x, z);
  };

  // ---------- tree ----------
  const tree = new THREE.Group();
  const bark = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.9, flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(n * 0.035, n * 0.06, trunkH, 9), bark);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  tree.add(trunk);
  const branchCount = 7;
  for (let i = 0; i < branchCount; i++) {
    const a = (i / branchCount) * Math.PI * 2 + random() * 0.6;
    const len = n * (0.22 + random() * 0.12);
    const geo = new THREE.CylinderGeometry(n * 0.008, n * 0.022, len, 6);
    geo.translate(0, len / 2, 0);
    const b = new THREE.Mesh(geo, bark);
    b.position.y = trunkH * (0.62 + random() * 0.25);
    b.rotation.set(0, -a, 0);
    b.rotateZ(-(0.75 + random() * 0.35));
    b.castShadow = true;
    tree.add(b);
  }
  // One leaf cluster above every dark module, at the height of the canopy dome; extra clusters
  // underneath fill the crown without changing what the top view shows.
  const leafSpecs = [];
  for (const [r, c] of bodyCells) {
    const d = dist(r, c);
    const [x, z] = pos(r, c);
    if (d < R) {
      const top = trunkH * 0.92 + domeH * Math.sqrt(1 - (d / R) ** 2);
      leafSpecs.push({ x, z, y: top + random() * 0.5, s: 1, cell: true });
      const extra = d < R * 0.85 ? 2 : 1;
      for (let k = 0; k < extra; k++) leafSpecs.push({ x: x + (random() - 0.5) * 0.4, z: z + (random() - 0.5) * 0.4, y: top - 1 - random() * domeH * 0.5, s: 0.85 });
    } else {
      leafSpecs.push({ x, z, y: 0.45, s: 0.8, cell: true, ground: true });
    }
  }
  const leafGeo = new THREE.IcosahedronGeometry(0.64, 0);
  const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true }), leafSpecs.length);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  leafSpecs.forEach((l) => { l.rot = random() * Math.PI; l.sy = 0.8 + random() * 0.35; l.col = Math.floor(random() * 5); l.delay = random(); });
  tree.add(leaves);

  // Grass tufts on the three finder patterns.
  const bladeSpecs = [];
  for (const [r, c] of finderCells) {
    const [x, z] = pos(r, c);
    for (let k = 0; k < 7; k++) bladeSpecs.push({ x: x + (random() - 0.5) * 0.8, z: z + (random() - 0.5) * 0.8, h: 0.6 + random() * 0.7, lean: (random() - 0.5) * 0.6, a: random() * Math.PI * 2, col: Math.floor(random() * 3) });
  }
  const blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.11, 1, 3).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), bladeSpecs.length);
  blades.castShadow = true;
  scene.add(tree, blades);

  // ---------- city ----------
  const city = new THREE.Group();
  const facade = windowTexture();
  const wallMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: facade, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#2c3440', roughness: 0.7 });
  const blockGeo = new THREE.BoxGeometry(0.9, 1, 0.9).translate(0, 0.5, 0);
  const buildingSpecs = bodyCells.map(([r, c]) => {
    const d = dist(r, c);
    const k = Math.max(0, 1 - d / (R * 1.05));
    const [x, z] = pos(r, c);
    return { x, z, h: 0.5 + n * 0.32 * Math.pow(k, 1.7) * (0.55 + random() * 0.45), delay: d / R };
  });
  const tallest = buildingSpecs.reduce((a, b) => (b.h > a.h ? b : a), buildingSpecs[0]);
  const buildings = new THREE.InstancedMesh(blockGeo, [wallMat, wallMat, roofMat, roofMat, wallMat, wallMat], buildingSpecs.length);
  buildings.castShadow = true;
  buildings.receiveShadow = true;
  const wallTints = ['#f4ede2', '#ebe3d6', '#f7f2ea', '#e4dccd', '#efe6d8'];
  buildingSpecs.forEach((b, i) => buildings.setColorAt(i, new THREE.Color(wallTints[i % wallTints.length])));
  const hedges = new THREE.InstancedMesh(new THREE.BoxGeometry(0.94, 0.45, 0.94).translate(0, 0.22, 0), new THREE.MeshStandardMaterial({ color: '#3f7d45', roughness: 0.85 }), finderCells.length);
  hedges.castShadow = true;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, n * 0.12, 6).translate(0, n * 0.06, 0), new THREE.MeshStandardMaterial({ color: '#c47a3a', metalness: 0.4, roughness: 0.4 }));
  city.add(buildings, hedges, spire);
  scene.add(city);

  // ---------- state ----------
  let theme = C.theme; // spring | summer | autumn | city
  let grow = 0; // 0 = flat, 1 = fully grown
  let scanning = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  const ground = 0.14;

  function paintColors() {
    const pal = SEASONS[theme] || SEASONS.summer;
    leafSpecs.forEach((l, i) => leaves.setColorAt(i, col.set(pal.leaves[l.col % pal.leaves.length])));
    bladeSpecs.forEach((b, i) => blades.setColorAt(i, col.set(pal.grass[b.col % pal.grass.length])));
    leaves.instanceColor.needsUpdate = true;
    blades.instanceColor.needsUpdate = true;
    ink.material.color.set(pal.ink);
  }

  // Lay out every instance for growth `g` (0..1), staggered so the world grows outward.
  function layout(g) {
    const isTree = theme !== 'city';
    tree.visible = blades.visible = isTree;
    city.visible = !isTree;
    if (isTree) {
      const tg = Math.min(1, g * 1.4);
      trunk.scale.set(1, Math.max(0.001, tg), 1);
      trunk.position.y = (trunkH * tg) / 2;
      tree.children.forEach((ch) => { if (ch !== trunk && ch !== leaves) ch.scale.setScalar(Math.max(0.001, Math.min(1, (g - 0.25) * 2))); });
      leafSpecs.forEach((l, i) => {
        const lg = Math.min(1, Math.max(0, (g - 0.3 - l.delay * 0.3) / 0.4));
        const y = lerp(ground + 0.3, l.y, l.ground ? 1 : lg);
        const sc = Math.max(0.001, (l.ground ? Math.min(1, g * 2) : lg) * l.s);
        p.set(l.x, y, l.z);
        q.setFromEuler(e.set(0, l.rot, 0));
        s.set(sc, sc * l.sy, sc);
        leaves.setMatrixAt(i, m4.compose(p, q, s));
      });
      leaves.instanceMatrix.needsUpdate = true;
      bladeSpecs.forEach((b, i) => {
        const h = Math.max(0.001, b.h * Math.min(1, g * 1.6));
        p.set(b.x, ground, b.z);
        q.setFromEuler(e.set(b.lean, b.a, b.lean * 0.5));
        s.set(1, h, 1);
        blades.setMatrixAt(i, m4.compose(p, q, s));
      });
      blades.instanceMatrix.needsUpdate = true;
    } else {
      buildingSpecs.forEach((b, i) => {
        const bg = Math.min(1, Math.max(0, (g - b.delay * 0.4) / 0.6));
        p.set(b.x, ground, b.z);
        q.identity();
        s.set(1, Math.max(0.02, b.h * bg), 1);
        buildings.setMatrixAt(i, m4.compose(p, q, s));
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
  }

  // ---------- camera ----------
  const ISO = { az: Math.PI / 4, polar: 0.98 };
  const home = () => ({ target: new THREE.Vector3(0, theme === 'city' ? n * 0.08 : n * 0.2, 0), az: ISO.az, polar: ISO.polar, zoom: 1 });
  // Straight down, sized to the space between the title bar and the dock.
  const top = () => {
    const H = stageEl.clientHeight, W = stageEl.clientWidth;
    const cam = stage.camera;
    const halfH = cam.top; // at zoom 1
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
    $('hint').textContent = on ? (theme === 'city' ? 'Tap to see the city' : 'Tap to see the tree') : (theme === 'city' ? 'Tap the city to see the QR code' : 'Tap the tree to see the QR code');
    stage.controls.enabled = !on;
    stage.controls.autoRotate = false;
    if (on) {
      ink.visible = true;
      flyCamera(stage, top(), { duration: 1500 });
      await tween(stage, 1500, (t) => {
        layout(1 - t);
        ink.material.opacity = Math.max(0, t * 1.4 - 0.4);
      });
    } else {
      flyCamera(stage, home(), { duration: 1500 });
      await tween(stage, 1500, (t) => {
        layout(t);
        ink.material.opacity = 1 - t;
      });
      ink.visible = false;
    }
  }
  $('see').addEventListener('click', () => setScan(!scanning));

  // A tap (not a drag) anywhere on the scene toggles scan view.
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
      if (next === theme) return;
      for (const o of document.querySelectorAll('.qw-tabs button')) o.setAttribute('aria-pressed', String(o === b));
      const wasCity = theme === 'city', toCity = next === 'city';
      if (scanning) {
        theme = next;
        paintColors();
        layout(0);
        return;
      }
      if (wasCity !== toCity) {
        // Swap worlds: sink, switch, regrow.
        await tween(stage, 600, (t) => layout(1 - t));
        theme = next;
        paintColors();
        flyCamera(stage, home(), { duration: 900 });
        await tween(stage, 1400, (t) => layout(t));
      } else {
        theme = next;
        paintColors();
      }
      $('hint').textContent = theme === 'city' ? 'Tap the city to see the QR code' : 'Tap the tree to see the QR code';
    });
  }

  // Gentle sway for the canopy.
  stage.frame.add((dt, t) => {
    if (theme === 'city' || scanning) return;
    tree.rotation.y = Math.sin(t * 0.35) * 0.015;
  });

  paintColors();
  layout(0);
  // Grow in.
  flyCamera(stage, home(), { duration: 2200 });
  tween(stage, 2400, (t) => layout(t)).then(() => {
    if (!scanning) stage.controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  stage.controls.autoRotateSpeed = 0.6;
  if (location.hash === '#scan') setTimeout(() => setScan(true), 2600);
}
