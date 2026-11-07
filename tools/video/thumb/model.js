// SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
// A company's 3D world (as its page shows it), drawn on a transparent canvas the size of the
// video, so the 2D thumb video can lay the site's real models over its own drawing.
import * as THREE from 'three';
const M = await import('/qr/assets/models.js');
const { centerpiece, modelMaterial, setBrands, motion, mountMovers, poseMovers, propGeo, topperGeo } = M;
const { RoomEnvironment } = await import('/qr/assets/RoomEnvironment.js');

let R = null;
function renderer(W, H) {
  if (R) return R;
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H); R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setClearColor(0x000000, 0);
  return R;
}

export async function company(slug) {
  const html = await (await fetch(`/qr/c/${slug}.html`)).text();
  return JSON.parse(html.match(/window\.COMPANY=(\{.*?\});<\/script>/)[1]);
}

// world(slug, W, H).render(t, view) draws the world at its animation time t and returns the
// canvas. view: { after(nodes) (adjust posed parts), pin: [x, y, z] (a point in the world), at: [px, py] (where it lands on screen),
// az (π/4 is the site's front-right view), elev, dist, scale }.
export async function world(slug, W, H) {
  const C = await company(slug), look = C.look, r = renderer(W, H);
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
  scene.add(new THREE.HemisphereLight('#fffaf0', '#d8cbb5', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004;
  sun.position.set(-10, 22, 7); const c = sun.shadow.camera; c.left = c.bottom = -9; c.right = c.top = 9; c.far = 140;
  scene.add(sun, sun.target);
  const mat = modelMaterial();
  const mk = (geo, at) => {
    const m = new THREE.InstancedMesh(geo, mat, 1);
    m.setMatrixAt(0, at ? new THREE.Matrix4().makeTranslation(...at) : new THREE.Matrix4());
    setBrands(m, [[look.a, look.b]]); m.castShadow = m.receiveShadow = true; m.frustumCulled = false; return m;
  };
  const cp = centerpiece(C.model, look.v, look.base, 'high'), g = new THREE.Group(), outer = new THREE.Group();
  g.add(mk(cp.geo));
  if (!cp.bare) {
    if (look.prop != null) g.add(mk(propGeo(look.prop, 'high'), cp.propAt));
    const tg = look.topper ? topperGeo(look.topper, 'high') : null;
    if (tg) g.add(mk(tg, cp.topAt));
  }
  const nodes = mountMovers(cp, g, mk); outer.add(g); scene.add(outer);
  const h = new THREE.Box3().setFromBufferAttribute(cp.geo.attributes.position).max.y;
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.5, 700);
  return {
    name: C.name,
    render(t, { pin = [0, 0, 0], at = [W / 2, H / 2], az = Math.PI / 4, elev = 0.55, dist = 30, spin = 0, lift = 0, squash = 1, after } = {}) {
      poseMovers(nodes, t);
      if (after) after(nodes); // the video can take over single parts (e.g. fly the booster itself)
      const b = motion(C.model, cp, t);
      g.position.set(b.x * h, b.y * h, b.z * h); g.rotation.set(b.rx, b.ry, b.rz); g.scale.set(b.sx, b.sy, b.sz);
      // Whole-world moves for the video: a turn about the pin, a drop from above, a squash on landing.
      outer.position.set(pin[0], lift, pin[2]); outer.rotation.set(0, spin, 0); outer.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
      g.position.x -= pin[0]; g.position.z -= pin[2];
      const tgt = new THREE.Vector3(...pin);
      cam.position.set(tgt.x + dist * Math.cos(elev) * Math.sin(az), tgt.y + dist * Math.sin(elev), tgt.z + dist * Math.cos(elev) * Math.cos(az));
      cam.lookAt(tgt);
      cam.setViewOffset(W, H, W / 2 - at[0], H / 2 - at[1], W, H); // slide the picture so the pin lands on `at`
      r.render(scene, cam);
      return r.domElement;
    },
  };
}
