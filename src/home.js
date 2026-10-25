// SPDX-License-Identifier: MIT
// Copyright (c) 2026 ghanemja. QR Compass, https://ghanemja.github.io/qr/
// Home: a 3D cartoon US map on a square tiled slab, split into seven regions. Hover a region and its
// companies' 3D models come alive in that region's own way; click it and the piece breaks off the
// map and opens as a little moving world, where any company's card shows its model turning into
// its QR code.
import { THREE, createStage, setCamera, flyCamera, stopFlight, tween, lerp, toScreen, webglAvailable, rng, SLAB as SLAB_COLORS } from './qrworld.js';
import { ARCHETYPES, centerpiece, modelMaterial, setBrands, propGeo, topperGeo, motion, mountMovers, poseMovers, restMatrices } from './models.js';
import { createQRWorld } from './qrsculpture.js';

const HOME = window.HOME;
const DATA = window.COMPANIES;
const bySlug = new Map(DATA.map((d) => [d.s, d]));
const REGIONS = HOME.regions;
const regionById = new Map(REGIONS.map((r) => [r.id, r]));
const regionOf = new Map();
for (const r of REGIONS) for (const s of r.members) regionOf.set(s, r);
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const badgeOf = (d) => (d.k === 0 ? `Fortune 500 · No. ${d.r}` : 'Startup');
const MODEL_LABELS = HOME.labels;
const shade = (hex, f) => {
  const c = new THREE.Color(hex);
  return f > 1 ? c.lerp(new THREE.Color('#ffffff'), f - 1) : c.multiplyScalar(f);
};
const INK = '#2a2520';

if (!webglAvailable()) {
  document.body.classList.add('no-webgl');
  $('fallback').hidden = false;
} else {
  start();
}

function start() {
  const stageEl = $('stage');
  const stage = createStage(stageEl, { viewSize: 64 });
  stage.setSun(90);
  const { scene, camera, controls, renderer } = stage;
  controls.minZoom = 0.6;
  controls.maxZoom = 8;
  controls.enableRotate = false;
  const mat = modelMaterial();
  let clock = 0;
  stage.frame.add((dt) => { if (!reduceMotion) clock += dt; });

  // ---------- slab, lawn and ocean ----------
  // The same cream tile slab as the company pages, with a lawn around the rim and the ocean inside.
  const N = 74, OCEAN = 64;
  const AZ = 0.3; // camera turn: nearly front-on, so the slab reads as a tile and the US stays upright
  // Fit the lower 48 to the ocean, leaving a strip of sea all round.
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const r of REGIONS) for (const poly of r.polys) for (const [x, y] of poly[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const k = (OCEAN - 5) / Math.max(x1 - x0, y1 - y0);
  const toWorld = (x, y) => [(x - (x0 + x1) / 2) * k, (y - (y0 + y1) / 2) * k];
  const slab = new THREE.Group();
  scene.add(slab);
  const base = new THREE.Mesh(new THREE.BoxGeometry(N + 0.6, 2.6, N + 0.6), [SLAB_COLORS.side, SLAB_COLORS.sideDark, '#efe9df', SLAB_COLORS.sideDark, SLAB_COLORS.side, SLAB_COLORS.sideDark].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 })));
  base.position.y = -1.3;
  base.receiveShadow = true;
  slab.add(base);
  {
    const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 0.14, 0.96), new THREE.MeshStandardMaterial({ roughness: 0.9 }), N * N);
    tiles.receiveShadow = true;
    const m = new THREE.Matrix4(), col = new THREE.Color(), r = rng('tiles');
    let i = 0;
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      m.makeTranslation(b - N / 2 + 0.5, 0.07, a - N / 2 + 0.5);
      tiles.setMatrixAt(i, m);
      tiles.setColorAt(i++, col.set((a + b) % 2 ? SLAB_COLORS.tileA : SLAB_COLORS.tileB).multiplyScalar(0.97 + r() * 0.05));
    }
    slab.add(tiles);
  }
  // Lawn: clumps of grass blades around the rim, like the tree app's lawn.
  {
    const blade = new THREE.ConeGeometry(0.09, 1, 3).translate(0, 0.5, 0);
    const COUNT = 2600;
    const grass = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), COUNT);
    const r = rng('lawn'), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    const greens = ['#4fae3f', '#62c24a', '#3e9637', '#79d052', '#58b947'];
    const inner = OCEAN / 2 + 0.6, outer = N / 2 - 0.4;
    let i = 0;
    while (i < COUNT) {
      // A clump somewhere on the rim band, with gaps between clumps.
      const side = Math.floor(r() * 4), t = (r() - 0.5) * 2 * outer, d = inner + r() * (outer - inner);
      const [cx, cz] = side === 0 ? [t, -d] : side === 1 ? [d, t] : side === 2 ? [t, d] : [-d, t];
      if (r() < 0.35) continue;
      const n = 10 + Math.floor(r() * 16);
      for (let j = 0; j < n && i < COUNT; j++) {
        const x = cx + (r() - 0.5) * 1.6, z = cz + (r() - 0.5) * 1.6;
        const out = Math.max(Math.abs(x), Math.abs(z));
        if (out > outer || out < inner - 0.3) continue;
        q.setFromEuler(e.set((r() - 0.5) * 0.6, r() * Math.PI, (r() - 0.5) * 0.6));
        grass.setMatrixAt(i, m.compose(new THREE.Vector3(x, 0.14, z), q, new THREE.Vector3(1, 0.5 + r() * 1.1, 1)));
        grass.setColorAt(i, col.set(r() < 0.06 ? '#e7a7b8' : greens[Math.floor(r() * greens.length)]));
        i++;
      }
    }
    slab.add(grass);
  }
  // Ocean basin and the water over it.
  const basin = new THREE.Mesh(new THREE.BoxGeometry(OCEAN, 0.1, OCEAN), new THREE.MeshStandardMaterial({ color: '#7fc0d6', roughness: 0.9 }));
  basin.position.y = 0.16;
  basin.receiveShadow = true;
  slab.add(basin);
  const waterMat = waterMaterial();
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(OCEAN, OCEAN).rotateX(-Math.PI / 2), waterMat);
  ocean.position.y = 0.42;
  ocean.renderOrder = 2;
  slab.add(ocean);
  const rim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(OCEAN, 0.6, OCEAN)), new THREE.LineBasicMaterial({ color: INK }));
  rim.position.y = 0.2;
  slab.add(rim);
  const waterView = new THREE.Vector3();
  const waters = [waterMat];
  stage.frame.add(() => {
    mat.userData.tick(clock);
    for (const w of waters) {
      w.uniforms.uTime.value = clock;
      w.uniforms.uSun.value.copy(stage.sun.position).sub(stage.sun.target.position);
      w.uniforms.uView.value.copy(camera.getWorldDirection(waterView)).negate();
    }
  });

  // Compass rose lying on the ocean off California.
  const compass = new THREE.Group();
  {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.25, 40), new THREE.MeshStandardMaterial({ color: '#fdf8f0' }));
    disc.castShadow = disc.receiveShadow = true;
    compass.add(disc, new THREE.LineSegments(new THREE.EdgesGeometry(disc.geometry, 30), new THREE.LineBasicMaterial({ color: INK })));
    const star = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, rr = i % 2 ? 0.55 : 3.0;
      const p = [Math.sin(a) * rr, -Math.cos(a) * rr];
      if (i) star.lineTo(...p);
      else star.moveTo(...p);
    }
    const rose = new THREE.Mesh(new THREE.ShapeGeometry(star).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#ece3cf' }));
    rose.position.y = 0.14;
    compass.add(rose);
    const needle = new THREE.Group();
    const half = (color, dir) => {
      const s = new THREE.Shape([new THREE.Vector2(-0.45, 0), new THREE.Vector2(0, 2.6 * dir), new THREE.Vector2(0.45, 0)]);
      const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false }).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color }));
      mesh.castShadow = true;
      return mesh;
    };
    needle.add(half('#ff6a3d', 1), half(INK, -1));
    needle.position.y = 0.2;
    compass.add(needle);
    const [x, z] = toWorld(x0 + 20, y1 + 10);
    compass.position.set(x + 2, 0.5, Math.min(z + 2, OCEAN / 2 - 4));
    slab.add(compass);
    stage.frame.add(() => { needle.rotation.y = Math.PI + Math.sin(clock * 0.9) * 0.18; });
  }

  // ---------- 3D company models ----------
  // A company's own model (shape, colours, prop and topper, as on its page) with its moving parts.
  const I4 = new THREE.Matrix4();
  function buildModel(d, maxH, maxW) {
    const arch = ARCHETYPES[d.m] ? d.m : 'tree';
    const cp = centerpiece(arch, d.L[0], d.L[3], 'low');
    const brand = [[d.L[1], d.L[2]]];
    const branded = (geo, m4 = I4) => {
      const mesh = new THREE.InstancedMesh(geo, mat, 1);
      mesh.setMatrixAt(0, m4);
      setBrands(mesh, brand);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.userData.slug = d.s;
      return mesh;
    };
    const g = new THREE.Group(), inner = new THREE.Group();
    g.add(inner);
    inner.add(branded(cp.geo));
    const bb = new THREE.Box3().setFromBufferAttribute(cp.geo.attributes.position);
    const prop = cp.bare ? null : propGeo(d.L[4], 'low');
    if (prop) {
      const m4 = new THREE.Matrix4().makeTranslation(...cp.propAt);
      inner.add(branded(prop, m4));
      bb.union(new THREE.Box3().setFromBufferAttribute(prop.attributes.position).applyMatrix4(m4));
    }
    const top = d.L[5] && !cp.bare ? topperGeo(d.L[5], 'low') : null;
    if (top) inner.add(branded(top, new THREE.Matrix4().makeTranslation(...cp.topAt)));
    const movers = mountMovers(cp, inner, (geo) => branded(geo));
    const rest = restMatrices(cp);
    cp.moving.forEach((mv, i) => mv.geo && bb.union(new THREE.Box3().setFromBufferAttribute(mv.geo.attributes.position).applyMatrix4(rest[i])));
    const size = bb.getSize(new THREE.Vector3());
    const s = Math.min(maxH / Math.max(3, bb.max.y), maxW / Math.max(size.x, size.z));
    inner.scale.setScalar(s);
    g.userData = { d, arch, cp, inner, movers, s, h: bb.max.y * s, hover: cp.hover || 0, phase: (d.s.length * 1.7) % 6.28, labelY: bb.max.y * s + 0.6 };
    return g;
  }
  function animateModel(g, t) {
    const { inner, movers, s, h, arch, cp, hover, phase } = g.userData;
    const b = motion(arch, cp, t, phase);
    inner.position.set(b.x * h, (hover ? Math.sin(t * 1.2 + phase) * hover * s * 0.35 : 0) + b.y * h, b.z * h);
    inner.rotation.set(b.rx, b.ry, b.rz);
    inner.scale.set(s * b.sx, s * b.sy, s * b.sz);
    poseMovers(movers, t + phase);
  }

  // ---------- region pieces ----------
  const PIECE_H = 1.15, TOP_Y = 0.42 + PIECE_H + 0.24;
  const mapGroup = new THREE.Group();
  slab.add(mapGroup);
  const pieces = new Map();
  const pickMap = [];
  for (const r of REGIONS) {
    const [cx, cz] = toWorld(r.cx, r.cy);
    const pt = ([x, y]) => { const [X, Z] = toWorld(x, y); return new THREE.Vector2(X - cx, -(Z - cz)); };
    const shapes = r.polys.map((poly) => {
      const sh = new THREE.Shape(poly[0].map(pt));
      for (const hole of poly.slice(1)) sh.holes.push(new THREE.Path(hole.map(pt)));
      return sh;
    });
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: PIECE_H, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.14, bevelSegments: 1, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0.42 + 0.12, 0);
    const topMat = new THREE.MeshStandardMaterial({ color: r.color, roughness: 0.75 });
    const sideMat = new THREE.MeshStandardMaterial({ color: shade(r.color, 0.72), roughness: 0.85 });
    const mesh = new THREE.Mesh(geo, [topMat, sideMat]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.region = r.id;
    const group = new THREE.Group();
    group.position.set(cx, 0, cz);
    group.add(mesh);
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), new THREE.LineBasicMaterial({ color: INK })));
    // State lines, dashed on top of the piece.
    const seg = [];
    for (const line of r.inner) for (let i = 1; i < line.length; i++) {
      const a = pt(line[i - 1]), b = pt(line[i]);
      seg.push(a.x, TOP_Y + 0.02, -a.y, b.x, TOP_Y + 0.02, -b.y);
    }
    if (seg.length) {
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
      const lines = new THREE.LineSegments(lg, new THREE.LineDashedMaterial({ color: shade(r.color, 0.55), dashSize: 0.45, gapSize: 0.35 }));
      lines.computeLineDistances();
      group.add(lines);
    }
    if (r.id === 'midwest') {
      const lakes = new THREE.Mesh(new THREE.ShapeGeometry(HOME.lakes.map((ring) => new THREE.Shape(ring.map(pt)))).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#8cc8dc', roughness: 0.4 }));
      lakes.position.y = TOP_Y + 0.03;
      group.add(lakes);
    }
    // Its biggest companies, standing near their real cities.
    const models = [];
    r.pins.forEach(([slug, x, y], i) => {
      const d = bySlug.get(slug);
      if (!d) return;
      const big = d.k === 0 && d.r <= 30;
      const g = buildModel(d, big ? 6 : 4.8, 3.5);
      const [X, Z] = toWorld(x, y);
      g.position.set(X - cx, TOP_Y, Z - cz);
      g.rotation.y = ((i % 3) - 1) * 0.35;
      g.userData.home = g.position.clone();
      g.userData.spin0 = g.rotation.y;
      g.userData.wave = X;
      group.add(g);
      models.push(g);
      g.traverse((o) => { if (o.isInstancedMesh) pickMap.push(o); });
    });
    mapGroup.add(group);
    pickMap.push(mesh);
    pieces.set(r.id, { r, group, mesh, topMat, models, home: group.position.clone(), hot: 0 });
  }

  // Hover: the piece lifts and brightens, and its companies move in the region's own style.
  let hover = null, exploding = false;
  const HOVER = {
    sway: (g, t, a, i) => { g.position.y += a * 0.7; g.rotation.z = Math.sin(t * 3.4 + i) * 0.2 * a; },
    float: (g, t, a, i) => { g.position.y += a * (1.4 + Math.sin(t * 2.2 + i) * 0.6); },
    hop: (g, t, a, i) => { const h = Math.abs(Math.sin(t * 3.6 + i)); g.position.y += a * h * 1.8; g.scale.set(1 + a * (1 - h) * 0.12, 1 - a * (1 - h) * 0.12, 1 + a * (1 - h) * 0.12); },
    wave: (g, t, a) => { g.position.y += a * (Math.sin(t * 4 - g.userData.wave * 0.18) + 1) * 0.8; },
    swing: (g, t, a, i) => { g.position.y += a * 0.7; g.rotation.x = Math.sin(t * 2.4 + i) * 0.25 * a; },
    rush: (g, t, a, i) => { g.position.y += a * Math.abs(Math.sin(t * 8 + i)) * 0.9; },
    twirl: (g, t, a, i) => { g.position.y += a * 1.0; g.rotation.y = g.userData.spin0 + a * (t * 3 + i); },
  };
  stage.frame.add((dt) => {
    if (!mapGroup.visible) return;
    for (const p of pieces.values()) {
      const focused = current && current.p === p;
      const target = p.r.id === hover && !exploding && !focused ? 1 : 0;
      p.hot += (target - p.hot) * Math.min(1, dt * 7);
      if (!exploding && !focused) p.group.position.y = p.hot * 0.7;
      p.topMat.emissive.set(p.r.color).multiplyScalar(p.hot * 0.12);
      const style = HOVER[p.r.hover];
      p.models.forEach((g, i) => {
        g.position.copy(g.userData.home);
        g.rotation.set(0, g.userData.spin0, 0);
        g.scale.set(1, 1, 1);
        if (p.hot > 0.001 && !reduceMotion) style(g, clock, p.hot, i);
        animateModel(g, clock);
      });
    }
  });

  // ---------- labels ----------
  const labelsEl = $('labels'), tip = $('tip');
  // Region names are painted onto each piece near its bottom edge, reading across the screen.
  const labelMeshes = [];
  const insidePoly = (polys, x, y) => polys.some((poly) => {
    let hit = false;
    for (const ring of poly) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  });
  function regionLabel(r) {
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const nameFont = '800 64px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
    const subFont = '600 38px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
    const sub = `${r.members.length} companies`;
    g.font = nameFont;
    const w = Math.ceil(Math.max(g.measureText(r.name.toUpperCase()).width, (g.font = subFont, g.measureText(sub).width)) + 40);
    c.width = w;
    c.height = 130;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(255, 250, 240, 0.9)';
    g.shadowBlur = 10;
    g.fillStyle = 'rgba(42, 37, 32, 0.88)';
    g.font = nameFont;
    g.fillText(r.name.toUpperCase(), w / 2, 66);
    g.fillStyle = 'rgba(42, 37, 32, 0.62)';
    g.font = subFont;
    g.fillText(sub, w / 2, 114);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return { tex, aspect: w / c.height };
  }
  const allPins = REGIONS.flatMap((r) => r.pins);
  for (const p of pieces.values()) {
    const r = p.r;
    const { tex, aspect } = regionLabel(r);
    // Find the spot nearest the bottom of the screen where the label fits inside the piece,
    // clear of the company models.
    const ax = Math.cos(AZ), az = -Math.sin(AZ); // label's reading direction on the ground (map px)
    const fx = Math.sin(AZ), fz = Math.cos(AZ); // towards the viewer
    let best = null;
    const lateral = (dx, dy) => dx * ax + dy * az, depth = (dx, dy) => dx * fx + dy * fz;
    for (const scale of [1, 0.85, 0.7, 0.56]) {
      const hW = 3.6 * scale, wW = hW * aspect;
      const hw = wW / k / 2, hh = hW / k / 2;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of r.polys.flatMap((poly) => poly[0])) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let x = x0; x <= x1; x += 5) for (let y = y0; y <= y1; y += 5) {
        let ok = true;
        for (const u of [-1, -0.5, 0, 0.5, 1]) for (const v of [-1, 0, 1]) {
          if (!ok) break;
          ok = insidePoly(r.polys, x + ax * u * hw + fx * v * hh, y + az * u * hw + fz * v * hh);
        }
        // Clear of every model, and not behind one (models stand up and hide what is behind them).
        if (!ok || allPins.some(([, px, py]) => {
          const l = Math.abs(lateral(px - x, py - y)), dd = depth(px - x, py - y);
          return l < hw + 28 && dd > -hh - 28 && dd < 150;
        })) continue;
        const score = x * fx + y * fz;
        if (!best || score > best.score) best = { x, y, score, hW, wW };
      }
      if (best) break;
    }
    if (!best) {
      // Too small to hold its name (the Northeast): print it on the Atlantic off its east coast.
      let east = null;
      for (const [x, y] of r.polys.flatMap((poly) => poly[0])) if (!east || x > east[0]) east = [x, y];
      const hW = 2.4, wW = hW * aspect;
      best = { x: east[0] + wW / k / 2 + 12, y: east[1] + 30, hW, wW };
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(best.wW, best.hW).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
    );
    const [X, Z] = toWorld(best.x, best.y);
    mesh.position.set(X - p.home.x, TOP_Y + 0.03, Z - p.home.z);
    mesh.rotation.y = AZ;
    mesh.renderOrder = 3;
    p.group.add(mesh);
    labelMeshes.push(mesh);
  }
  const tags = [];
  const v3 = new THREE.Vector3();
  stage.frame.add(() => {
    const onMap = view === 'us';
    // Region view: names over the biggest companies and the selected one.
    const list = !onMap && current ? current.models.filter((g, i) => i < 4 || g.userData.d === selected) : [];
    while (tags.length < list.length) {
      const t = document.createElement('span');
      t.className = 'hm-tag';
      labelsEl.append(t);
      tags.push(t);
    }
    tags.forEach((t, i) => {
      const g = list[i];
      t.hidden = !g;
      if (!g) return;
      g.getWorldPosition(v3);
      v3.y += g.userData.labelY * current.p.group.scale.y;
      const s = toScreen(stage, v3);
      if (!s) { t.hidden = true; return; }
      t.textContent = g.userData.d.n;
      t.classList.toggle('sel', g.userData.d === selected);
      t.style.transform = `translate(${s[0]}px, ${s[1]}px) translate(-50%, -100%)`;
    });
  });

  // ---------- camera ----------
  const ISO = { az: AZ, polar: 0.92 };
  // On-screen width and height of a w×d footprint seen from the camera angle.
  const across = (w, d) => w * Math.cos(ISO.az) + d * Math.sin(ISO.az);
  const deep = (w, d) => (w * Math.sin(ISO.az) + d * Math.cos(ISO.az)) * Math.cos(ISO.polar);
  const axes = (az, polar) => ({
    right: new THREE.Vector3(Math.cos(az), 0, -Math.sin(az)),
    up: new THREE.Vector3(-Math.cos(polar) * Math.sin(az), Math.sin(polar), -Math.cos(polar) * Math.cos(az)),
  });
  // Fit a box `w`×`h` world units (as seen on screen) into the canvas minus padding (px).
  function framing(center, w, h, pad, az = ISO.az, polar = ISO.polar) {
    const W = stageEl.clientWidth, H = stageEl.clientHeight;
    const ppu = Math.min((W - pad.left - pad.right) / w, (H - pad.top - pad.bottom) / h);
    const zoom = (ppu * (camera.top - camera.bottom)) / H;
    const { right, up } = axes(az, polar);
    const target = center.clone().addScaledVector(right, (pad.right - pad.left) / 2 / ppu).addScaledVector(up, (pad.top - pad.bottom) / 2 / ppu);
    return { target, az, polar, zoom };
  }
  const narrow = () => stageEl.clientWidth < 760;
  const overview = () => framing(new THREE.Vector3(0, 0, 0), across(N, N) * 1.02, deep(N, N) + 6, narrow() ? { top: 150, bottom: 110, left: 8, right: 8 } : { top: 110, bottom: 100, left: 20, right: 20 });
  {
    const o = overview();
    setCamera(stage, { ...o, az: ISO.az - 0.25, polar: 0.7, zoom: o.zoom * 0.8 });
    flyCamera(stage, o, { duration: reduceMotion ? 1 : 2200 });
  }
  addEventListener('resize', () => {
    if (view === 'us' && !exploding) setCamera(stage, overview());
    else if (current) setCamera(stage, regionFraming());
  });

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev, objects) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(objects, false)[0] || null;
  }
  function setHover(id) {
    hover = exploding ? null : id;
  }
  function showTip(text, ev) {
    tip.hidden = !text;
    if (!text) return;
    tip.textContent = text;
    tip.style.transform = `translate(${ev.clientX + 14}px, ${ev.clientY + 14}px)`;
  }
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (ev) => (down = [ev.clientX, ev.clientY]));
  renderer.domElement.addEventListener('pointermove', (ev) => {
    if (ev.buttons) return;
    if (view === 'us') {
      const hit = exploding ? null : pick(ev, pickMap);
      const slug = hit ? hit.object.userData.slug : null;
      const rid = hit ? hit.object.userData.region || regionOf.get(slug)?.id : null;
      setHover(rid || null);
      showTip(slug ? bySlug.get(slug).n : null, ev);
      renderer.domElement.style.cursor = rid ? 'pointer' : '';
    } else if (current) {
      const hit = pick(ev, current.pick);
      showTip(hit ? bySlug.get(hit.object.userData.slug).n : null, ev);
      renderer.domElement.style.cursor = hit ? 'pointer' : '';
    }
  });
  renderer.domElement.addEventListener('pointerleave', () => { if (view === 'us') setHover(null); showTip(null); });
  renderer.domElement.addEventListener('pointerup', (ev) => {
    showTip(null);
    if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 6) return;
    down = null;
    if (view === 'us') {
      const hit = pick(ev, pickMap);
      if (!hit) return;
      const slug = hit.object.userData.slug;
      const rid = hit.object.userData.region || regionOf.get(slug)?.id;
      stopTour();
      if (rid) openRegion(rid, { select: slug || null });
    } else if (current) {
      const hit = pick(ev, current.pick);
      if (hit) { stopTour(); selectCompany(hit.object.userData.slug); }
    }
  });

  // ---------- breaking a region off the map ----------
  async function explode(id) {
    showTip(null);
    const chosen = pieces.get(id);
    exploding = true;
    hover = null;
    document.body.classList.add('hm-exploding');
    const o = overview();
    flyCamera(stage, { ...o, zoom: o.zoom * 1.25, target: o.target.clone().add(chosen.home.clone().multiplyScalar(0.3)) }, { duration: 900 });
    const from = [...pieces.values()].map((p) => ({ p, pos: p.group.position.clone(), dir: p.home.clone().sub(chosen.home).setY(0).normalize() }));
    await tween(stage, reduceMotion ? 1 : 950, (e) => {
      for (const { p, pos, dir } of from) {
        if (p === chosen) {
          p.group.position.lerpVectors(pos, new THREE.Vector3(0, 7, 0), e);
          p.group.scale.setScalar(1 + e * 0.35);
        } else {
          p.group.position.copy(pos).addScaledVector(dir, e * 46).setY(pos.y - e * 14);
          p.group.scale.setScalar(Math.max(0.001, 1 - e * 0.8));
          p.group.rotation.set(-dir.z * e * 0.6, 0, dir.x * e * 0.6);
        }
      }
    });
  }
  async function assemble() {
    exploding = true;
    const all = [...pieces.values()];
    for (const p of all) p.from = p.home.clone().addScaledVector(p.home.clone().setY(0).normalize(), 40).setY(18);
    await tween(stage, reduceMotion ? 1 : 1100, (e) => {
      all.forEach((p, i) => {
        const t = Math.min(1, Math.max(0, e * 1.4 - i * 0.06));
        const b = 1 - Math.pow(1 - t, 3);
        p.group.position.lerpVectors(p.from, p.home, b);
        p.group.scale.setScalar(0.4 + 0.6 * b);
        p.group.rotation.set(0, 0, 0);
      });
    });
    for (const p of all) { p.group.position.copy(p.home); p.group.scale.setScalar(1); }
    exploding = false;
  }

  // ---------- region explorer: the broken-off piece, close up, with many of its companies ----------
  const regionView = $('region');
  let current = null; // { p, r, models, pick, ring }
  function focusRegion(p) {
    // The map's few pins make way for the explorer's spots: up to 40 companies at their cities.
    for (const g of p.models) g.visible = false;
    const models = [], pick = [];
    p.r.spots.forEach(([slug, x, y], i) => {
      const d = bySlug.get(slug);
      if (!d) return;
      const big = d.k === 0 && d.r <= 50;
      const g = buildModel(d, big ? 2.7 : 2.1, 1.3);
      const [X, Z] = toWorld(x, y);
      g.position.set(X - p.home.x, TOP_Y, Z - p.home.z);
      g.rotation.y = ((i % 3) - 1) * 0.3;
      g.userData.home = g.position.clone();
      g.userData.spin0 = g.rotation.y;
      g.userData.wave = X;
      p.group.add(g);
      models.push(g);
      g.traverse((o) => { if (o.isInstancedMesh) pick.push(o); });
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 32).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: INK }));
    ring.visible = false;
    p.group.add(ring);
    current = { p, r: p.r, models, pick, ring };
  }
  function unfocus() {
    if (!current) return;
    const { p, models, ring } = current;
    // Model geometry is cached and shared (src/models.js), so only the ring needs freeing.
    for (const g of models) p.group.remove(g);
    p.group.remove(ring);
    ring.geometry.dispose();
    ring.material.dispose();
    for (const g of p.models) g.visible = true;
    current = null;
  }
  function resetPieces() {
    for (const p of pieces.values()) {
      p.group.position.copy(p.home);
      p.group.scale.setScalar(1);
      p.group.rotation.set(0, 0, 0);
      p.group.visible = true;
    }
  }
  // While exploring, the companies keep moving in their region's own style.
  stage.frame.add((dt) => {
    if (!current) return;
    const style = HOVER[current.r.hover];
    current.models.forEach((g, i) => {
      g.position.copy(g.userData.home);
      g.rotation.set(0, g.userData.spin0, 0);
      g.scale.set(1, 1, 1);
      if (!reduceMotion) style(g, clock, 0.35, i);
      animateModel(g, clock);
    });
    if (current.ring.visible) current.ring.rotation.y += dt * 0.8;
  });
  function regionFraming() {
    // Frame the companies rather than the whole piece, so they read up close.
    const box = new THREE.Box3();
    for (const g of current.models) box.expandByObject(g);
    if (box.isEmpty()) box.setFromObject(current.p.group);
    box.expandByVector(new THREE.Vector3(2.5, 0, 2.5));
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    // Frame it in the space the header, card and buttons leave free.
    const W = stageEl.clientWidth, H = stageEl.clientHeight;
    const card = document.querySelector('.hm-card').getBoundingClientRect(), head = document.querySelector('.hm-r-head').getBoundingClientRect();
    const bar = document.querySelector('.hm-r-bar').getBoundingClientRect(), top = stageEl.getBoundingClientRect().top;
    const pad = narrow()
      ? { top: Math.max(head.bottom, bar.bottom) - top + 8, bottom: H - (card.top - top) + 8, left: 8, right: 8 }
      : { top: 120, bottom: H - (bar.top - top) + 10, left: 30, right: W - (card.left - stageEl.getBoundingClientRect().left) + 16 };
    return framing(center, across(size.x, size.z) * 1.06, deep(size.x, size.z) + size.y * Math.sin(ISO.polar), pad);
  }

  // ---------- company card: 3D model that turns into its QR code ----------
  let show = null, selected = null;
  function qrFor(d) {
    const canonical = document.querySelector('link[rel=canonical]');
    const q = qrcode(0, 'H');
    q.addData(new URL(`c/${d.s}.html`, canonical ? canonical.href : location.href).href);
    q.make();
    const n = q.getModuleCount();
    let bits = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) bits += q.isDark(r, c) ? '1' : '0';
    return { n, bits };
  }
  const lookOf = (d) => ({ v: d.L[0], a: d.L[1], b: d.L[2], base: d.L[3], prop: d.L[4], topper: d.L[5] });
  function selectCompany(slug, { hash = true } = {}) {
    const d = bySlug.get(slug);
    if (!d || !current) return;
    selected = d;
    $('c-badge').textContent = badgeOf(d);
    $('c-kind').textContent = MODEL_LABELS[d.m] || 'Company';
    $('c-name').textContent = d.n;
    $('c-place').textContent = d.c;
    const money = (m) => (m == null ? '—' : `${m < 0 ? '−' : ''}$${Math.abs(m) >= 1000 ? `${(Math.abs(m) / 1000).toFixed(1)}B` : `${Math.round(Math.abs(m))}M`}`);
    const fy = `FY${HOME.listYear - 1}`;
    const facts = d.k === 0
      ? [['Revenue', `${money(d.v)} <small>${fy}</small>`], ['Profit', `${money(d.p)} <small>${fy}</small>`], ['Employees', d.e ? d.e.toLocaleString('en-US') : '—'], ['Industry', esc(d.i || '—')]]
      : [['Sector', esc(d.sec || '—')], ['Founded', esc(String(d.f || '—'))], ['About', esc(d.b || '')]];
    $('c-facts').innerHTML = facts.map(([k, v]) => `<div${k === 'About' || k === 'Industry' ? ' class="wide"' : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('c-open').href = `c/${d.s}.html`;
    for (const b of document.querySelectorAll('#r-list button')) b.setAttribute('aria-current', String(b.dataset.slug === slug));
    const g = current.models.find((m) => m.userData.d === d);
    current.ring.visible = !!g;
    if (g) current.ring.position.set(g.userData.home.x, TOP_Y + 0.06, g.userData.home.z);
    if (hash) history.replaceState(null, '', `#${slug}`);
    if (show) show.dispose();
    $('c-stage').innerHTML = '';
    setQRLabel(false);
    // The card keeps turning the model into its QR code and back until someone takes the controls.
    show = createQRWorld($('c-stage'), { slug: d.s, model: d.m, look: lookOf(d), qr: qrFor(d), viewScale: 1.35, insets: () => ({ top: 8, bottom: 8 }), loop: true, onScan: setQRLabel });
  }
  function setQRLabel(on) {
    $('c-toggle-label').textContent = on ? 'Back to the model' : 'Turn into QR code';
    $('c-toggle').setAttribute('aria-pressed', String(on));
  }
  $('c-toggle').addEventListener('click', () => {
    stopTour();
    if (show) show.setScan(!show.scanning);
  });
  $('r-list').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-slug]');
    if (b) { stopTour(); selectCompany(b.dataset.slug); }
  });

  // ---------- switching views ----------
  let view = 'us';
  async function openRegion(id, { select = null } = {}) {
    const r = regionById.get(id);
    if (!r || exploding) return;
    stopFlight(stage);
    if (view !== 'us') { unfocus(); resetPieces(); }
    await explode(id);
    for (const [rid, p] of pieces) p.group.visible = rid === id;
    focusRegion(pieces.get(id));
    const members = r.members.map((s) => bySlug.get(s));
    $('r-name').textContent = r.name;
    $('r-crumb').textContent = r.name;
    const f = members.filter((d) => d.k === 0).length;
    $('r-f').textContent = f;
    $('r-s').textContent = members.length - f;
    $('r-t').textContent = members.filter((d) => d.t).length;
    $('r-all-n').textContent = members.length;
    $('r-list').innerHTML = members.map((d) => `<li><button data-slug="${d.s}"><span>${esc(d.n)}</span><small>${d.k === 0 ? `No. ${d.r}` : 'Startup'} · ${esc(d.c.split(',')[0])}</small></button></li>`).join('');
    regionView.style.setProperty('--region', r.color);
    regionView.style.setProperty('--region-soft', '#' + shade(r.color, 1.3).getHexString());
    for (const b of document.querySelectorAll('#r-pills button')) b.setAttribute('aria-pressed', String(b.dataset.region === r.id));
    document.body.classList.remove('hm-exploding');
    document.body.classList.add('hm-in-region');
    regionView.hidden = false;
    view = id;
    exploding = false;
    // Close in on the piece.
    flyCamera(stage, regionFraming(), { duration: reduceMotion ? 1 : 900 });
    selectCompany(select && regionOf.get(select) === r ? select : r.members[0], { hash: false });
    history.replaceState(null, '', `#${select || id}`);
  }
  async function backToMap() {
    if (view === 'us') return;
    stopTour();
    if (show) show.dispose();
    show = null;
    unfocus();
    for (const p of pieces.values()) p.group.visible = true;
    selected = null;
    regionView.hidden = true;
    document.body.classList.remove('hm-in-region');
    view = 'us';
    history.replaceState(null, '', location.pathname + location.search);
    flyCamera(stage, overview(), { duration: reduceMotion ? 1 : 1100 });
    await assemble();
  }
  $('r-back').addEventListener('click', backToMap);
  $('r-crumb-home').addEventListener('click', backToMap);
  $('r-pills').innerHTML = REGIONS.map((r) => `<button data-region="${r.id}" style="--pill:${r.color}">${esc(r.name)}</button>`).join('');
  $('r-pills').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-region]');
    if (b) { stopTour(); openRegion(b.dataset.region); }
  });
  addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && view !== 'us') backToMap(); });

  // ---------- search ----------
  const qIn = $('q'), results = $('results');
  const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const index = DATA.map((d) => ({ d, n: norm(d.n), ln: norm(d.ln || ''), c: norm(d.c) }));
  let hits = [], active = -1;
  function search(text) {
    const t = norm(text.trim());
    if (!t) return [];
    const out = REGIONS.filter((r) => norm(r.name).includes(t)).map((r) => ({ region: r, score: -1 }));
    for (const e of index) {
      let score = null;
      if (e.n.startsWith(t)) score = 0;
      else if (e.n.split(/[\s(-]+/).some((w) => w.startsWith(t))) score = 1;
      else if (e.n.includes(t) || e.ln.includes(t)) score = 2;
      else if (e.c.includes(t)) score = 3;
      if (score !== null) out.push({ d: e.d, score: score + (e.d.k === 0 ? e.d.r / 1000 : 0.6) });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, 8);
  }
  function renderHits() {
    results.hidden = !hits.length;
    qIn.setAttribute('aria-expanded', String(!!hits.length));
    results.innerHTML = hits.map((h, i) => (h.region
      ? `<li role="option" data-i="${i}" aria-selected="${i === active}"><b>${esc(h.region.name)}</b><span>Region · ${h.region.members.length} companies</span></li>`
      : `<li role="option" data-i="${i}" aria-selected="${i === active}"><b>${esc(h.d.n)}</b><span>${esc(h.d.c)}</span></li>`)).join('');
  }
  function choose(i) {
    const h = hits[i];
    if (!h) return;
    hits = [];
    renderHits();
    qIn.blur();
    stopTour();
    qIn.value = h.region ? h.region.name : h.d.n;
    const r = h.region || regionOf.get(h.d.s);
    if (r) openRegion(r.id, { select: h.d ? h.d.s : null });
  }
  qIn.addEventListener('input', () => { hits = search(qIn.value); active = hits.length ? 0 : -1; renderHits(); });
  qIn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { active = Math.min(hits.length - 1, active + 1); renderHits(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); renderHits(); e.preventDefault(); }
    else if (e.key === 'Enter') { choose(Math.max(0, active)); e.preventDefault(); }
    else if (e.key === 'Escape') { hits = []; renderHits(); qIn.blur(); }
  });
  qIn.addEventListener('blur', () => setTimeout(() => { results.hidden = true; }, 150));
  results.addEventListener('mousedown', (e) => { const li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); choose(+li.dataset.i); } });

  // ---------- tour: every region in turn, its biggest company turning into its QR ----------
  const ORDER = ['northwest', 'west', 'southwest', 'midwest', 'southeast', 'midatlantic', 'northeast'];
  const tour = { on: false, token: 0 };
  const playBtn = $('play');
  function stopTour() {
    if (!tour.on) return;
    tour.on = false;
    tour.token++;
    document.body.classList.remove('hm-touring');
    playBtn.setAttribute('aria-label', 'Play the region tour');
  }
  async function runTour() {
    tour.on = true;
    const token = ++tour.token;
    document.body.classList.add('hm-touring');
    playBtn.setAttribute('aria-label', 'Stop the tour');
    for (let i = 0; tour.on && token === tour.token; i = (i + 1) % ORDER.length) {
      await openRegion(ORDER[i]);
      // The card's own loop turns the model into its QR code meanwhile.
      await wait(8900);
    }
  }
  playBtn.addEventListener('click', () => (tour.on ? stopTour() : runTour()));
  $('r-stop').addEventListener('click', stopTour);

  // ---------- deep links: #region-id or #company-slug ----------
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (regionById.has(h)) openRegion(h);
    else if (regionOf.has(h)) {
      const r = regionOf.get(h);
      if (view === r.id) selectCompany(h, { hash: false });
      else openRegion(r.id, { select: h });
    } else if (!h && view !== 'us') backToMap();
  }
  addEventListener('hashchange', fromHash);
  fromHash();
}

// Clear, moving water: sun glints off the ripples and caustics, as on the old map.
function waterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uSun: { value: new THREE.Vector3(1, 1, 1) }, uView: { value: new THREE.Vector3(0, 1, 0) } },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vPos = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSun, uView;
      varying vec3 vPos;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      float waves(vec2 p, float t) {
        return 0.5 * sin(dot(p, vec2(0.38, 0.21)) + t * 1.1) + 0.35 * sin(dot(p, vec2(-0.27, 0.43)) + t * 1.4)
          + 0.22 * sin(dot(p, vec2(0.71, -0.52)) + t * 2.1) + 0.3 * noise(p * 0.9 + vec2(t * 0.35, t * 0.2)) + 0.18 * noise(p * 2.1 - vec2(t * 0.5, -t * 0.3));
      }
      float caustic(vec2 p, float t) {
        float c = 0.0;
        for (int i = 0; i < 2; i++) {
          vec2 q = p * (1.3 + float(i) * 0.9) + vec2(t * 0.25, -t * 0.18) * (1.0 + float(i));
          float n = noise(q) + 0.5 * noise(q * 2.3 + 4.0);
          c += pow(1.0 - abs(n - 0.75) * 2.2, 6.0);
        }
        return clamp(c, 0.0, 1.0);
      }
      void main() {
        vec2 p = vPos.xz;
        float t = uTime, e = 0.15, h = waves(p, t);
        vec3 n = normalize(vec3(-(waves(p + vec2(e, 0.0), t) - h) / e * 0.35, 1.0, -(waves(p + vec2(0.0, e), t) - h) / e * 0.35));
        vec3 col = vec3(0.36, 0.74, 0.82) + vec3(caustic(p * 0.7, t) * 0.32);
        vec3 V = normalize(uView), L = normalize(uSun);
        col = mix(col, vec3(0.93, 0.97, 1.0), pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.5);
        float spec = pow(max(dot(reflect(-L, n), V), 0.0), 120.0) * 2.2;
        col += vec3(1.0, 0.97, 0.88) * spec;
        gl_FragColor = vec4(col, max(0.72, min(1.0, spec)));
        #include <colorspace_fragment>
      }`,
  });
}
