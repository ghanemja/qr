// SPDX-License-Identifier: MIT
// Copyright (c) 2026 ghanemja. QR Compass, https://ghanemja.github.io/qr/
// Shared 3D pieces for the QR worlds: stage, isometric camera rig, palettes, helpers.
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls.js';
import { RoomEnvironment } from './RoomEnvironment.js';

export { THREE };

export const SEASONS = {
  spring: { leaves: ['#f6a6c1', '#f08bb0', '#fbc5d8', '#e9739d', '#f9b7cf'], grass: ['#8fd16a', '#7cc35a', '#a6dc7e'], ground: '#f4efe6', ink: '#3a1f2b' },
  summer: { leaves: ['#7cc456', '#5fae45', '#94d26a', '#4f9a3c', '#86cc5f'], grass: ['#5fbf3f', '#4fae35', '#79cf52'], ground: '#f2eee5', ink: '#1f3320' },
  autumn: { leaves: ['#f2a83b', '#e07b2a', '#f5c451', '#c9572a', '#eb9534'], grass: ['#a9b847', '#c3b14a', '#8fa83c'], ground: '#f3ede2', ink: '#3b2414' },
  city: { leaves: ['#2c3440'], grass: ['#3f7d45', '#357040'], ground: '#efeae2', ink: '#1d232b' },
};
export const SLAB = { side: '#d9d2c5', sideDark: '#c9c1b2', tileA: '#f3efe7', tileB: '#ebe5da' };

// Deterministic random numbers so a company's world looks the same on every visit.
export function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a, b, t) => a + (b - a) * t;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Renderer + orthographic isometric camera + orbit controls + frame loop.
export function createStage(container, { viewSize = 30, background = '#f6f1e7' } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(background);
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  // A soft studio environment, so curved surfaces pick up gentle reflections and highlights.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;
  pmrem.dispose();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
  camera.position.set(200, 200, 200);

  const hemi = new THREE.HemisphereLight('#fffaf0', '#d8cbb5', 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e0', 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minZoom = 0.35;
  controls.maxZoom = 40;

  const stage = { renderer, scene, camera, controls, hemi, sun, viewSize, container, frame: new Set() };

  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px';
    renderer.domElement.style.height = h + 'px';
    const aspect = w / h;
    const s = stage.viewSize / 2;
    // Fit the board in the shorter screen dimension.
    const halfH = aspect >= 1 ? s : s / aspect;
    camera.left = -halfH * aspect;
    camera.right = halfH * aspect;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }
  stage.resize = resize;
  window.addEventListener('resize', resize);
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Light the board from the upper left; shadow camera covers `size` units.
  stage.setSun = (size) => {
    sun.position.set(-size * 0.55, size * 1.2, size * 0.35);
    sun.target.position.set(0, 0, 0);
    const c = sun.shadow.camera;
    c.left = c.bottom = -size * 0.85;
    c.right = c.top = size * 0.85;
    c.near = 1;
    c.far = size * 4;
    c.updateProjectionMatrix();
  };

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const f of stage.frame) f(dt, now / 1000);
    controls.update();
    renderer.render(scene, camera);
    if (running) requestAnimationFrame(loop);
  }
  let running = true;
  requestAnimationFrame(loop);
  // Free the GL context (pages that open and close small stages).
  stage.dispose = () => {
    running = false;
    window.removeEventListener('resize', resize);
    ro.disconnect();
    controls.dispose();
    scene.environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  return stage;
}

// Camera state as {target: Vector3, az, polar, zoom}; flights tween all four.
export function cameraState(stage) {
  const off = stage.camera.position.clone().sub(stage.controls.target);
  const sph = new THREE.Spherical().setFromVector3(off);
  return { target: stage.controls.target.clone(), az: sph.theta, polar: sph.phi, zoom: stage.camera.zoom, radius: sph.radius };
}
export function setCamera(stage, s) {
  const r = s.radius || 400;
  stage.controls.target.copy(s.target);
  stage.camera.position.copy(s.target).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(r, Math.max(0.0001, s.polar), s.az)));
  stage.camera.zoom = s.zoom;
  stage.camera.updateProjectionMatrix();
}
// Each stage has at most one flight at a time; a new one cancels the old.
export function stopFlight(stage) {
  if (stage && stage.flight) {
    stage.flight.done(false);
    stage.flight = null;
  }
}
// Fly the camera; `arc` zooms out mid-flight so long hops read as travel.
export function flyCamera(stage, to, { duration = 1600, arc = 0 } = {}) {
  stopFlight(stage);
  const from = cameraState(stage);
  let daz = (to.az ?? from.az) - from.az;
  daz = Math.atan2(Math.sin(daz), Math.cos(daz));
  const target = { target: to.target || from.target, az: from.az + daz, polar: to.polar ?? from.polar, zoom: to.zoom ?? from.zoom, radius: from.radius };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) duration = 1;
  return new Promise((resolve) => {
    const start = performance.now();
    const f = {
      done: (ok) => { stage.frame.delete(tick); resolve(ok); },
    };
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const e = ease(t);
      const z = Math.exp(lerp(Math.log(from.zoom), Math.log(target.zoom), e)) / (1 + arc * Math.sin(Math.PI * e));
      setCamera(stage, {
        target: from.target.clone().lerp(target.target, e),
        az: lerp(from.az, target.az, e),
        polar: lerp(from.polar, target.polar, e),
        zoom: z,
        radius: from.radius,
      });
      if (t >= 1) {
        stage.flight = null;
        f.done(true);
      }
    };
    stage.flight = f;
    stage.frame.add(tick);
  });
}

// A generic tween on the frame loop: fn(easedT) each frame for `duration` ms.
export function tween(stage, duration, fn) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      fn(ease(t), t);
      if (t >= 1) {
        stage.frame.delete(tick);
        resolve();
      }
    };
    stage.frame.add(tick);
  });
}

// Slab with a tile per cell (`size` × `size`, centred), plus the dark "ink" layer used by scan view.
export function buildSlab(size, { depth = 1.4 } = {}) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(size + 0.6, depth, size + 0.6),
    [SLAB.side, SLAB.sideDark, '#efe9df', SLAB.sideDark, SLAB.side, SLAB.sideDark].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 })),
  );
  base.position.y = -depth / 2;
  base.receiveShadow = true;
  group.add(base);
  const tileGeo = new THREE.BoxGeometry(0.96, 0.14, 0.96);
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), size * size);
  tiles.receiveShadow = true;
  const m = new THREE.Matrix4(), col = new THREE.Color();
  let i = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      m.makeTranslation(c - size / 2 + 0.5, 0.07, r - size / 2 + 0.5);
      tiles.setMatrixAt(i, m);
      tiles.setColorAt(i++, col.set((r + c) % 2 ? SLAB.tileA : SLAB.tileB));
    }
  }
  group.add(tiles);
  group.userData.tiles = tiles;
  return group;
}

// Flat dark squares on the dark modules; fades in for scan view.
export function buildInk(cells, size, color) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
  const ink = new THREE.InstancedMesh(new THREE.BoxGeometry(1.001, 0.02, 1.001), mat, cells.length);
  const m = new THREE.Matrix4();
  cells.forEach(([r, c], i) => {
    m.makeTranslation(c - size / 2 + 0.5, 0.16, r - size / 2 + 0.5);
    ink.setMatrixAt(i, m);
  });
  ink.renderOrder = 5;
  ink.visible = false;
  return ink;
}

// Canvas texture of a facade: columns of windows.
export function windowTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#d3dde6';
  for (let y = 6; y < 128; y += 14) for (let x = 7; x < 64; x += 16) g.fillRect(x, y, 7, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Screen-space position of a world point, or null if it is behind the camera.
export function toScreen(stage, v) {
  const p = v.clone().project(stage.camera);
  if (p.z > 1) return null;
  const el = stage.renderer.domElement;
  return [((p.x + 1) / 2) * el.clientWidth, ((1 - p.y) / 2) * el.clientHeight];
}

export function decodeBits(n, bits) {
  return (r, c) => r >= 0 && c >= 0 && r < n && c < n && bits.charCodeAt(r * n + c) === 49;
}
export const isFinder = (n) => (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
