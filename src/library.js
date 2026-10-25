// SPDX-License-Identifier: MIT
// Copyright (c) 2026 ghanemja. QR Compass, https://ghanemja.github.io/qr/
// 3D asset library: browse every model on the site and download it as a GLB (via three's
// GLTFExporter), with the project credit and the MIT licence embedded in each file. A model can
// also be downloaded as a .zip holding the GLB, LICENSE.txt and a short credit note.
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls.js';
import { RoomEnvironment } from './RoomEnvironment.js';
import { GLTFExporter } from './GLTFExporter.js';
import { mergeVertices } from './BufferGeometryUtils.js';
import { buildModel, mountMovers, poseMovers, vertexColor } from './models.js';

const LIB = window.LIBRARY;
const $ = (id) => document.getElementById(id);
const COPYRIGHT = `© ${LIB.year} ${LIB.author} — QR Compass, MIT License`;
const ANIM_SECONDS = 12, ANIM_FPS = 20;

// ---------- turning a model into plain, exportable meshes ----------
// On the site, brand colours and water are drawn by a custom shader. A GLB gets baked vertex
// colours instead, and the live water ('W') becomes a plain glossy blue material.
const PAINT = new THREE.MeshStandardMaterial({ name: 'Paint', vertexColors: true, roughness: 0.55, metalness: 0.04 });
const WATER = new THREE.MeshStandardMaterial({ name: 'Water', color: '#3f9fbf', roughness: 0.12, metalness: 0 });

function bake(geo, brand) {
  const src = geo.index ? geo.toNonIndexed() : geo;
  const pos = src.attributes.position, nor = src.attributes.normal, mask = src.attributes.mask;
  const solid = { p: [], n: [], c: [] }, water = { p: [], n: [] }, col = new THREE.Color();
  for (let i = 0; i + 2 < pos.count; i += 3) {
    const wet = mask && Math.max(mask.getX(i), mask.getX(i + 1), mask.getX(i + 2)) > 4.5;
    const out = wet ? water : solid;
    for (let k = i; k < i + 3; k++) {
      out.p.push(pos.getX(k), pos.getY(k), pos.getZ(k));
      if (nor) out.n.push(nor.getX(k), nor.getY(k), nor.getZ(k));
      if (!wet) { vertexColor(src, k, brand, col); out.c.push(col.r, col.g, col.b); }
    }
  }
  const make = ({ p, n, c }) => {
    if (!p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    if (n.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    else g.computeVertexNormals();
    if (c) g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    return mergeVertices(g, 1e-4); // shared vertices: much smaller files
  };
  const out = [];
  const s = make(solid), w = make({ ...water, c: null });
  if (s) out.push([s, PAINT, '']);
  if (w) out.push([w, WATER, ' water']);
  return out;
}

// A model as a three.js group: the static body plus each moving part as its own node, posed at
// the start of its animation. With `animate`, also returns a looping clip sampled from the site's motion.
function modelGroup(item, detail, brand, { animate = false } = {}) {
  const cp = buildModel(item.id, item.v, 0, detail);
  const root = new THREE.Group();
  root.name = item.t;
  const meshes = (geo, parent, name) => {
    for (const [g, mat, suffix] of bake(geo, brand)) {
      const m = new THREE.Mesh(g, mat);
      m.name = name + suffix;
      parent.add(m);
    }
  };
  const body = new THREE.Group();
  body.name = 'body';
  meshes(cp.geo, body, 'body');
  root.add(body);
  let count = 0;
  const nodes = mountMovers(cp, root, (geo) => {
    const g = new THREE.Group();
    meshes(geo, g, `part_${++count}_mesh`);
    return g;
  });
  nodes.forEach((n, i) => (n.o.name = `part_${String(i + 1).padStart(3, '0')}`));
  let clip = null;
  if (animate && nodes.length) {
    const frames = ANIM_SECONDS * ANIM_FPS + 1, times = new Float32Array(frames);
    const tracks = nodes.map(() => ({ p: [], q: [], s: [] }));
    for (let f = 0; f < frames; f++) {
      times[f] = f / ANIM_FPS;
      poseMovers(nodes, times[f]);
      nodes.forEach(({ o }, i) => {
        tracks[i].p.push(...o.position.toArray());
        tracks[i].q.push(...o.quaternion.toArray());
        tracks[i].s.push(...o.scale.toArray());
      });
    }
    clip = new THREE.AnimationClip('motion', ANIM_SECONDS, nodes.flatMap(({ o }, i) => [
      new THREE.VectorKeyframeTrack(`${o.name}.position`, times, tracks[i].p),
      new THREE.QuaternionKeyframeTrack(`${o.name}.quaternion`, times, tracks[i].q),
      new THREE.VectorKeyframeTrack(`${o.name}.scale`, times, tracks[i].s),
    ]));
  }
  poseMovers(nodes, 0);
  // Animated files keep every part (hidden ones are scaled to nothing); still files drop them.
  if (clip) for (const { o } of nodes) o.visible = true;
  return { root, clip, branded: hasBrandSlots(cp) };
}
const hasBrandSlots = (cp) => [cp.geo, ...cp.moving.map((m) => m.geo).filter(Boolean)].some((g) => {
  const m = g.attributes.mask;
  if (!m) return false;
  for (let i = 0; i < m.count; i += 3) { const k = m.getX(i); if (k > 0.5 && k < 4.5) return true; }
  return false;
});
const dispose = (root) => root.traverse((o) => o.geometry && o.geometry.dispose());

// ---------- export ----------
const credit = (item) => ({
  title: item.kind === 'hero' ? `${item.t} — ${item.sub}` : `${item.sub} — ${item.t}`,
  project: 'QR Compass',
  url: LIB.site,
  page: `${LIB.site}library.html#${key(item)}`,
  author: LIB.author,
  license: 'MIT',
  copyright: COPYRIGHT,
  licenseText: LIB.license,
});
async function exportGLB(item, brand, animate) {
  const { root, clip } = modelGroup(item, 'high', brand, { animate });
  const scene = new THREE.Scene();
  scene.name = item.t;
  scene.userData = credit(item); // written as the scene's extras too
  scene.add(root);
  const exporter = new GLTFExporter();
  exporter.register((writer) => ({
    afterParse() {
      writer.json.asset.copyright = COPYRIGHT;
      writer.json.asset.extras = credit(item);
    },
  }));
  try {
    return await exporter.parseAsync(scene, { binary: true, onlyVisible: true, animations: clip ? [clip] : [] });
  } finally {
    dispose(root);
  }
}

// A minimal .zip writer (stored, no compression): enough to bundle a GLB with its licence.
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (bytes) => { let c = 0xffffffff; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  let offset = 0;
  for (const { name, data } of files) {
    const bytes = data instanceof Uint8Array ? data : typeof data === 'string' ? enc.encode(data) : new Uint8Array(data);
    const nm = enc.encode(name), crc = crc32(bytes);
    const head = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, bytes.length, 4], [22, bytes.length, 4], [26, nm.length, 2], [28, 0, 2]]
      .forEach(([o, v, n]) => (n === 4 ? head.setUint32(o, v, true) : head.setUint16(o, v, true)));
    const cd = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, bytes.length, 4], [24, bytes.length, 4], [28, nm.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, offset, 4]]
      .forEach(([o, v, n]) => (n === 4 ? cd.setUint32(o, v, true) : cd.setUint16(o, v, true)));
    parts.push(head, nm, bytes);
    central.push(cd, nm);
    offset += 30 + nm.length + bytes.length;
  }
  const size = central.reduce((s, p) => s + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  [[0, 0x06054b50, 4], [8, files.length, 2], [10, files.length, 2], [12, size, 4], [16, offset, 4]]
    .forEach(([o, v, n]) => (n === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true)));
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

const save = (blob, name) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
const fileBase = (item) => `qr-compass-${item.slug}`;
const readme = (item) => `${credit(item).title}
A 3D model from QR Compass (${LIB.site})
Made by ${LIB.author}. ${COPYRIGHT}.

Free to use, change and share under the MIT License (LICENSE.txt). Please keep the
copyright notice and licence with the model. The GLB carries the same credit in its
asset.copyright and asset.extras fields.

Browse more models: ${LIB.site}library.html
`;

// ---------- page ----------
const items = LIB.groups.flatMap((g) => g.items);
const key = (item) => `${item.id}:${item.v}`;
const byKey = new Map(items.map((it) => [key(it), it]));
const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();

function lights(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fffaf0', '#d8cbb5', 0.9));
  const sun = new THREE.DirectionalLight('#fff4e0', 2);
  sun.position.set(8, 14, 6);
  scene.add(sun);
}
function frame(camera, root, controls) {
  const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  const d = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.02;
  camera.position.copy(sphere.center).add(new THREE.Vector3(1, 0.78, 1).normalize().multiplyScalar(d));
  camera.near = d / 50; camera.far = d * 4;
  camera.updateProjectionMatrix();
  camera.lookAt(sphere.center);
  if (controls) { controls.target.copy(sphere.center); controls.update(); }
}

// The big preview.
const view = { item: null, root: null, brand: null };
let preview = null;
if (webgl) {
  const host = $('lib-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  lights(scene, renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotateSpeed = 0.8;
  controls.addEventListener('start', () => (controls.autoRotate = false));
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host);
  resize();
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
  preview = { scene, camera, controls };
} else {
  $('lib-canvas').innerHTML = '<p class="lib-nogl">Your browser can’t show 3D previews, but the downloads still work.</p>';
}

const status = (text) => ($('lib-status').textContent = text);
function select(item, { scroll = false } = {}) {
  view.item = item;
  view.brand = [item.a, item.b];
  $('lib-title').textContent = item.t;
  $('lib-sub').textContent = item.sub;
  const users = $('lib-users');
  users.innerHTML = '';
  if (item.users.length) {
    users.append(item.users.length > 1 ? `Used by ${item.users.length} companies: ` : 'Used by ');
    item.users.slice(0, 12).forEach(([name, slug], i) => {
      if (i) users.append(', ');
      const a = document.createElement('a');
      a.href = `c/${slug}.html`;
      a.textContent = name;
      users.append(a);
    });
    if (item.users.length > 12) users.append(` and ${item.users.length - 12} more`);
    users.append('.');
  }
  $('lib-a').value = item.a;
  $('lib-b').value = item.b;
  for (const card of document.querySelectorAll('.lib-card')) card.setAttribute('aria-current', String(card.dataset.key === key(item)));
  history.replaceState(null, '', `#${key(item)}`);
  // Build the 3D preview once the page has loaded (a high-detail model takes a moment).
  if (document.readyState === 'complete') setTimeout(show, 0);
  else window.addEventListener('load', () => setTimeout(show, 0), { once: true });
  if (scroll) $('lib-viewer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function show() {
  const item = view.item;
  let branded = false;
  if (preview) {
    if (view.root) { preview.scene.remove(view.root); dispose(view.root); view.root = null; }
    try {
      const m = modelGroup(item, 'high', view.brand);
      view.root = m.root;
      branded = m.branded;
      preview.scene.add(view.root);
      frame(preview.camera, view.root, preview.controls);
      let verts = 0;
      view.root.traverse((o) => { if (o.isMesh && o.visible) verts += o.geometry.attributes.position.count; });
      status(`${verts.toLocaleString()} vertices · drag to turn it`);
    } catch (err) {
      status('This model could not be previewed here.');
      console.error(err);
    }
  } else status('');
  $('lib-colors').hidden = !(branded || item.kind === 'shape');
}
for (const id of ['lib-a', 'lib-b']) $(id).addEventListener('change', () => {
  view.brand = [$('lib-a').value, $('lib-b').value];
  show();
});

async function download(asZip) {
  const item = view.item;
  const btns = [$('lib-glb'), $('lib-zip')];
  btns.forEach((b) => (b.disabled = true));
  status('Building the file…');
  try {
    const glb = await exportGLB(item, view.brand, $('lib-anim').checked);
    const name = fileBase(item);
    if (asZip) save(zip([{ name: `${name}.glb`, data: glb }, { name: 'LICENSE.txt', data: LIB.license }, { name: 'README.txt', data: readme(item) }]), `${name}.zip`);
    else save(new Blob([glb], { type: 'model/gltf-binary' }), `${name}.glb`);
    status(`Saved ${name}.${asZip ? 'zip' : 'glb'} (${(glb.byteLength / 1048576).toFixed(1)} MB model)`);
  } catch (err) {
    status('Sorry, that export failed.');
    console.error(err);
  } finally {
    btns.forEach((b) => (b.disabled = false));
  }
}
$('lib-glb').addEventListener('click', () => download(false));
$('lib-zip').addEventListener('click', () => download(true));

// ---------- the grid, with thumbnails drawn lazily one at a time ----------
const grid = $('lib-groups');
for (const g of LIB.groups) {
  const sec = document.createElement('section');
  sec.className = 'lib-group';
  sec.innerHTML = `<h2>${g.title} <small>${g.items.length}</small></h2><p class="lib-note">${g.note}</p><ul class="lib-grid"></ul>`;
  const ul = sec.querySelector('ul');
  for (const item of g.items) {
    const li = document.createElement('li');
    li.innerHTML = `<button class="lib-card" data-key="${key(item)}"><span class="lib-thumb"><img alt="" width="160" height="160" hidden></span><b></b><small></small></button>`;
    const btn = li.querySelector('button');
    btn.querySelector('b').textContent = item.t;
    btn.querySelector('small').textContent = item.sub;
    btn.dataset.q = `${item.t} ${item.sub} ${item.users.map((u) => u[0]).join(' ')}`.toLowerCase();
    btn.addEventListener('click', () => select(item, { scroll: true }));
    ul.append(li);
  }
  grid.append(sec);
}
$('lib-filter').addEventListener('input', (ev) => {
  const q = ev.target.value.trim().toLowerCase();
  for (const sec of grid.children) {
    let n = 0;
    for (const btn of sec.querySelectorAll('.lib-card')) { const on = !q || btn.dataset.q.includes(q); btn.parentElement.hidden = !on; n += on; }
    sec.hidden = !n;
  }
});

if (webgl) {
  const size = 200;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  lights(scene, renderer);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  const queue = [], done = new Set();
  let busy = false;
  const pump = () => {
    if (busy || !queue.length) return;
    busy = true;
    const btn = queue.shift();
    setTimeout(() => {
      try {
        const item = byKey.get(btn.dataset.key);
        const { root } = modelGroup(item, 'low', [item.a, item.b]);
        scene.add(root);
        frame(camera, root);
        renderer.render(scene, camera);
        const img = btn.querySelector('img');
        img.src = renderer.domElement.toDataURL('image/png');
        img.hidden = false;
        scene.remove(root);
        dispose(root);
      } catch (err) { console.error(err); }
      busy = false;
      pump();
    }, 16);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting && !done.has(e.target)) { done.add(e.target); queue.push(e.target); io.unobserve(e.target); }
    pump();
  }, { rootMargin: '300px' });
  const start = () => document.querySelectorAll('.lib-card').forEach((b) => io.observe(b));
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

select(byKey.get(decodeURIComponent(location.hash.slice(1))) || items[0]);
window.addEventListener('hashchange', () => { const it = byKey.get(decodeURIComponent(location.hash.slice(1))); if (it && it !== view.item) select(it, { scroll: true }); });
// For tests: export a model without the download dialog.
window.QRLibrary = { exportGLB: (k, animate = false) => { const it = byKey.get(k); return exportGLB(it, [it.a, it.b], animate); }, keys: items.map(key) };
