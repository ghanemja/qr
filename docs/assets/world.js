// The QR world: one giant QR code (it scans to this site) with the map laid on its tiles and
// every company standing on it as a 3D model. Tour, search, USA/World, and scan view.
import { THREE, createStage, buildSlab, buildInk, decodeBits, setCamera, cameraState, flyCamera, stopFlight, tween, lerp, toScreen, webglAvailable } from './qrworld.js';
import { ARCHETYPES, centerpiece, modelMaterial } from './models.js';
import { createQRWorld } from './qrsculpture.js';

const { board, regions, listYear } = window.WORLD;
const DATA = window.COMPANIES;
const $ = (id) => document.getElementById(id);
const bySlug = new Map(DATA.map((d) => [d.s, d]));
const priority = (d) => (d.k === 0 ? d.r : 45);
const money = (m) => (m >= 1e6 ? `$${(m / 1e6).toFixed(2)}T` : m >= 1000 ? `$${(m / 1000).toFixed(m >= 100000 ? 0 : 1)}B` : `$${Math.round(m)}M`);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pageUrl = (d) => QRCard.siteUrl(`c/${d.s}.html`);

if (!webglAvailable()) {
  document.body.classList.add('no-webgl');
  QRCard.draw($('fallback-qr'), QRCard.siteUrl(''), 'QR Atlas');
} else {
  start();
}

function start() {
  const N = board.n, QUIET = 2, S = N + QUIET * 2;
  const dark = decodeBits(N, board.bits);
  const stageEl = $('stage');
  const stage = createStage(stageEl, { viewSize: S * 0.78 });
  stage.setSun(S);
  stage.sun.shadow.mapSize.set(3072, 3072);
  const { scene, camera, controls } = stage;
  controls.maxZoom = 30;
  controls.minZoom = 0.5;

  // ---------- board ----------
  const slab = buildSlab(S, { depth: 2.4 });
  const tiles = slab.userData.tiles;
  scene.add(slab);
  const cellX = (c) => c - N / 2 + 0.5;
  const toBoard = ([x, y]) => [x - N / 2, y - N / 2];
  const darkCells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (dark(r, c)) darkCells.push([r, c]);
  const blockGeo = new THREE.BoxGeometry(0.94, 1, 0.94).translate(0, 0.5, 0);
  const blocks = new THREE.InstancedMesh(blockGeo, new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), darkCells.length);
  blocks.castShadow = blocks.receiveShadow = true;
  scene.add(blocks);
  const ink = buildInk(darkCells.map(([r, c]) => [r + QUIET, c + QUIET]), S, '#1f2a24');
  scene.add(ink);

  const COLORS = {
    landA: '#e2ead0', landB: '#d9e3c4', seaA: '#e3edf1', seaB: '#d9e6ec',
    hedge: ['#2f5b36', '#2a5331', '#35633b'], water: ['#2a4560', '#253f58', '#2e4b67'],
  };
  let mode = 'us';
  const landOf = (m) => decodeBits(N, board.modes[m].land);
  let land = landOf(mode);
  const col = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), eul = new THREE.Euler();

  let plain = false; // scan view: plain light tiles so only the QR shows
  function paintTiles(rowsDone = S) {
    for (let r = 0; r < Math.min(S, rowsDone); r++) {
      for (let c = 0; c < S; c++) {
        const qr = r - QUIET, qc = c - QUIET;
        const inside = qr >= 0 && qc >= 0 && qr < N && qc < N;
        const alt = (r + c) % 2;
        if (plain) col.set('#f7f4ee');
        else if (!inside) col.set(alt ? '#f3efe7' : '#ebe5da');
        else col.set(land(qr, qc) ? (alt ? COLORS.landA : COLORS.landB) : (alt ? COLORS.seaA : COLORS.seaB));
        tiles.setColorAt(r * S + c, col);
      }
    }
    tiles.instanceColor.needsUpdate = true;
  }
  const blockH = (r, c) => (land(r, c) ? 0.55 + ((r * 7 + c * 13) % 5) * 0.06 : 0.22);
  let flatten = 0; // 0 = 3D, 1 = flat for scan view
  function layoutBlocks() {
    darkCells.forEach(([r, c], i) => {
      const h = lerp(blockH(r, c), 0.02, Math.min(1, Math.max(0, (flatten - ((r + c) / (2 * N)) * 0.5) / 0.4)));
      blocks.setMatrixAt(i, m4.compose(p.set(cellX(c), 0.14, cellX(r)), q.identity(), s.set(1, h, 1)));
      const pal = land(r, c) ? COLORS.hedge : COLORS.water;
      blocks.setColorAt(i, col.set(pal[(r + c) % 3]));
    });
    blocks.instanceMatrix.needsUpdate = true;
    blocks.instanceColor.needsUpdate = true;
  }
  paintTiles();
  layoutBlocks();

  // ---------- company models ----------
  // Every company stands on the board as its own signature model (src/models.js), sized by
  // revenue, with its moving parts (wings, blades, falling phones) animated.
  const MAXV = Math.max(...DATA.map((d) => d.v || 0));
  const archOf = (d) => (ARCHETYPES[d.m] ? d.m : 'tree');
  const mat = modelMaterial();
  // Model bounds (body plus moving parts), used to size each company.
  const bounds = new Map();
  const boundsOf = (a) => {
    if (!bounds.has(a)) {
      const cp = centerpiece(a);
      const b = new THREE.Box3().setFromBufferAttribute(cp.geo.attributes.position);
      for (const mv of cp.moving) b.union(new THREE.Box3().setFromBufferAttribute(mv.geo.attributes.position).translate(new THREE.Vector3(...mv.pivot)));
      const size = b.getSize(new THREE.Vector3());
      bounds.set(a, { h: Math.max(3, b.max.y), w: Math.max(size.x, size.z) });
    }
    return bounds.get(a);
  };
  const height = (d) => (d.k === 0 ? 1.3 + 5.5 * Math.sqrt((d.v || 0) / MAXV) : 1.8);
  const modelScale = (d) => {
    const b = boundsOf(archOf(d));
    const maxW = d.k === 0 ? 1.0 + 1.5 * Math.sqrt((d.v || 0) / MAXV) : 1.1;
    return Math.min(height(d) / b.h, maxW / b.w);
  };
  const meshes = {}; // name -> InstancedMesh (pickable)
  const owner = new Map(); // `${name}:${i}` -> company index
  const slots = DATA.map(() => 0);
  const byArch = new Map();
  DATA.forEach((d, di) => {
    const a = archOf(d);
    if (!byArch.has(a)) byArch.set(a, []);
    byArch.get(a).push(di);
  });
  for (const [a, list] of byArch) {
    const cp = centerpiece(a);
    const add = (name, geo) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      im.castShadow = im.receiveShadow = true;
      meshes[name] = im;
      scene.add(im);
      list.forEach((di, i) => owner.set(`${name}:${i}`, di));
      return im;
    };
    add(`c:${a}`, cp.geo);
    cp.moving.forEach((mv, j) => (add(`m:${a}:${j}`, mv.geo).userData.mv = mv));
    list.forEach((di, i) => (slots[di] = i));
  }

  // Per-company animated state: board position and visibility for the current mode/filter.
  const state = DATA.map(() => ({ x: 0, z: 0, vis: 0 }));
  const modeScale = () => (mode === 'world' ? 0.42 : 1);
  let filter = 'all';
  const matches = (d) => filter === 'all' || (filter === 'tech' ? d.t : filter === 'startup' ? d.k === 1 : d.k === 0);
  const targetOf = (d) => {
    const pos = board.modes[mode].pos[d.s];
    if (!pos) return null;
    const [x, z] = toBoard(pos);
    return { x, z, vis: matches(d) ? 1 : 0 };
  };
  DATA.forEach((d, di) => {
    const t = targetOf(d);
    if (t) Object.assign(state[di], t, { vis: 0 });
  });

  let hopAmp = 0, clock = 0;
  const pivot = new THREE.Vector3(), axis = new THREE.Vector3(), q2 = new THREE.Quaternion();
  function placeAll() {
    const k = modeScale();
    const moving = !reduceMotion;
    DATA.forEach((d, di) => {
      const st = state[di];
      // Scan view: models sink into the board in the same diagonal sweep as the squares.
      const sink = 1 - Math.min(1, Math.max(0, (flatten - ((st.x + st.z) / (2 * N) + 0.5) * 0.5) / 0.4));
      const v = Math.max(0, Math.min(1, st.vis)) * k * sink;
      const sc = Math.max(0.0001, v * modelScale(d));
      const a = archOf(d);
      const cp = centerpiece(a);
      const hover = cp.hover && moving ? Math.sin(clock * 1.2 + di) * cp.hover * sc * 0.35 : 0;
      const y0 = 0.14 + hover + hopAmp * Math.sin(Math.PI * Math.min(1, st.hopT || 0));
      const yaw = (di * 2.399) % (Math.PI * 2);
      q.setFromEuler(eul.set(0, yaw, 0));
      meshes[`c:${a}`].setMatrixAt(slots[di], m4.compose(p.set(st.x, y0, st.z), q, s.set(sc, sc, sc)));
      cp.moving.forEach((mv, j) => {
        const t = moving ? clock : 0;
        let dy = 0, ps = sc;
        if (mv.mode === 'spin') q2.setFromAxisAngle(axis.set(...mv.axis).normalize(), t * mv.speed + di);
        else if (mv.mode === 'flap') q2.setFromAxisAngle(axis.set(...mv.axis).normalize(), Math.sin(t * mv.speed + di) * mv.amp);
        else {
          const f = (t * mv.speed + (mv.phase || 0) + di * 0.13) % 1;
          dy = -f * mv.drop;
          ps = sc * Math.max(0.001, Math.min(1, f * 8, (1 - f) * 8));
          q2.setFromAxisAngle(axis.set(...mv.axis).normalize(), f * 6);
        }
        pivot.set(mv.pivot[0], mv.pivot[1] + dy, mv.pivot[2]).multiplyScalar(sc).applyQuaternion(q);
        meshes[`m:${a}:${j}`].setMatrixAt(slots[di], m4.compose(p.set(st.x + pivot.x, y0 + pivot.y, st.z + pivot.z), q2.premultiply(q), s.set(ps, ps, ps)));
      });
    });
    for (const im of Object.values(meshes)) im.instanceMatrix.needsUpdate = true;
  }
  placeAll();
  stage.frame.add((dt) => {
    clock += dt;
    placeAll();
  });

  // Grow everything into place for the current mode and filter.
  async function settle(duration = 1200, hop = 0) {
    const from = state.map((st) => ({ ...st }));
    const to = DATA.map((d, di) => targetOf(d) || { x: from[di].x, z: from[di].z, vis: 0 });
    // Companies appearing for the first time start at their spot.
    to.forEach((t, di) => { if (from[di].vis <= 0.001) { from[di].x = t.x; from[di].z = t.z; } });
    await tween(stage, duration, (e, raw) => {
      DATA.forEach((d, di) => {
        const delay = Math.min(0.4, Math.hypot(to[di].x, to[di].z) / (N * 1.4));
        const t = Math.max(0, Math.min(1, (raw - delay) / (1 - delay)));
        const et = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const st = state[di];
        st.x = lerp(from[di].x, to[di].x, et);
        st.z = lerp(from[di].z, to[di].z, et);
        st.vis = lerp(from[di].vis, to[di].vis, et);
        st.hopT = hop ? t : 0;
      });
      hopAmp = hop;
      placeAll();
      placeLabels();
    });
  }

  // ---------- camera ----------
  const halfH = () => camera.top;
  const zoomFor = (units) => (2 * halfH()) / units;
  const ISO = { az: Math.PI / 4, polar: 0.92 };
  const overview = () => ({ target: new THREE.Vector3(0, 0, mode === 'us' ? -2 : 0), az: ISO.az, polar: ISO.polar, zoom: mode === 'us' ? 0.98 : 0.9 });
  setCamera(stage, { target: new THREE.Vector3(0, 0, 0), az: ISO.az - 1.2, polar: 0.6, zoom: 0.55, radius: 600 });

  function regionView(id, i = 0) {
    const rg = board.modes[mode].regions[id];
    if (!rg) return overview();
    const [x, z] = toBoard(rg);
    const units = Math.max(mode === 'us' ? 16 : 22, rg[2] * 3.2);
    return { target: new THREE.Vector3(x, 0, z), az: ISO.az + ((i % 3) - 1) * 0.45, polar: 0.95, zoom: zoomFor(units) };
  }

  // ---------- labels ----------
  const labelsEl = $('labels');
  const pool = [];
  let selected = null, focus = null;
  const topOf = (di) => new THREE.Vector3(state[di].x, 0.14 + height(DATA[di]) * modeScale() + 0.4, state[di].z);
  function placeLabels() {
    const placed = [];
    let used = 0;
    const W = stageEl.clientWidth, H = stageEl.clientHeight;
    const put = (text, xy, cls, force) => {
      if (!xy || used >= 60) return;
      const w = text.length * 7 + 20, h = 22;
      const box = cls === 'region' ? [xy[0] - w / 2, xy[1] - h / 2, xy[0] + w / 2, xy[1] + h / 2] : [xy[0] - w / 2, xy[1] - h - 4, xy[0] + w / 2, xy[1] - 4];
      if (box[2] < 0 || box[0] > W || box[3] < 0 || box[1] > H) return;
      if (!force && placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return;
      placed.push(box);
      let el = pool[used];
      if (!el) {
        el = document.createElement('div');
        labelsEl.appendChild(el);
        pool.push(el);
      }
      if (el.textContent !== text) el.textContent = text;
      el.className = `lbl ${cls}`;
      el.style.transform = `translate(${box[0].toFixed(1)}px, ${box[1].toFixed(1)}px)`;
      el.hidden = false;
      used++;
    };
    if (flatten < 0.5) {
      const di = selected ? DATA.indexOf(selected) : -1;
      if (di >= 0) put(selected.n, toScreen(stage, topOf(di)), 'sel', true);
      const zoomed = camera.zoom > (mode === 'us' ? 4 : 6);
      const cands = (focus ? [...focus].map((sl) => bySlug.get(sl)) : zoomed ? DATA : [])
        .filter((d) => d !== selected && matches(d) && board.modes[mode].pos[d.s])
        .sort((a, b) => priority(a) - priority(b))
        .slice(0, focus ? 10 : 22);
      for (const d of cands) put(d.n, toScreen(stage, topOf(DATA.indexOf(d))), '', false);
      if (!zoomed && !focus) {
        for (const r of regions) {
          const rg = board.modes[mode].regions[r.id];
          if (!rg) continue;
          const [x, z] = toBoard(rg);
          put(r.short, toScreen(stage, new THREE.Vector3(x, 1.5, z)), 'region', false);
        }
      }
    }
    for (let i = used; i < pool.length; i++) pool[i].hidden = true;
  }
  let lastCam = '';
  stage.frame.add(() => {
    const key = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)},${camera.zoom.toFixed(3)}`;
    if (key !== lastCam) {
      lastCam = key;
      placeLabels();
    }
  });

  // ---------- picking ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickables = Object.entries(meshes).map(([name, im]) => { im.userData.part = name; return im; });
  function pick(ev) {
    const rect = stage.renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (!hit) return null;
    const di = owner.get(`${hit.object.userData.part}:${hit.instanceId}`);
    return di == null || state[di].vis < 0.5 ? null : DATA[di];
  }
  const tip = $('tip');
  let hoverQueued = false;
  stage.renderer.domElement.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch' || hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      const d = flatten < 0.5 ? pick(ev) : null;
      stage.renderer.domElement.style.cursor = d ? 'pointer' : '';
      if (!d) return (tip.hidden = true);
      tip.innerHTML = `<strong>${esc(d.n)}</strong><span>${d.k ? esc(d.sec) + ' startup' : `Fortune 500 No. ${d.r}`} · ${esc(d.c)}</span>`;
      const rect = stageEl.getBoundingClientRect();
      tip.style.transform = `translate(${ev.clientX - rect.left + 14}px, ${ev.clientY - rect.top + 14}px)`;
      tip.hidden = false;
    });
  });
  stage.renderer.domElement.addEventListener('pointerleave', () => (tip.hidden = true));
  let down = null;
  stage.renderer.domElement.addEventListener('pointerdown', (ev) => (down = [ev.clientX, ev.clientY]));
  stage.renderer.domElement.addEventListener('pointerup', (ev) => {
    if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 6) return (down = null);
    down = null;
    if (flatten > 0.5) return;
    const d = pick(ev);
    if (d) select(d.s);
  });
  controls.addEventListener('start', () => {
    stopFlight();
    controls.autoRotate = false;
    if (tour.active && !tour.paused) pauseTour();
  });

  // ---------- selection card ----------
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 40), new THREE.MeshBasicMaterial({ color: '#c47a3a' }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  stage.frame.add((dt, t) => {
    if (!ring.visible || !selected) return;
    const di = DATA.indexOf(selected);
    ring.position.set(state[di].x, 0.2, state[di].z);
    ring.scale.setScalar(modeScale() * (1 + 0.25 * Math.sin(t * 4)));
  });
  const card = $('card');
  function select(slug, { fly = true, hash = true, fromTour = false } = {}) {
    const d = bySlug.get(slug);
    if (!d) return;
    if (!fromTour && tour.active && !tour.paused) pauseTour();
    if (!board.modes[mode].pos[slug]) return switchMode(mode === 'us' ? 'world' : 'us').then(() => select(slug, { fly, hash, fromTour }));
    if (focus && !focus.has(slug)) focus = null;
    selected = d;
    ring.visible = true;
    fillCard(d);
    if (hash) history.replaceState(null, '', `#${slug}`);
    if (fly) {
      const di = DATA.indexOf(d);
      const narrow = stageEl.clientWidth < 760;
      const units = mode === 'us' ? 16 : 10;
      const target = new THREE.Vector3(state[di].x, height(d) * modeScale() * 0.4, state[di].z);
      const z = zoomFor(units);
      // Keep the model clear of the card (right on desktop, bottom on phones).
      const shift = new THREE.Vector3();
      const right = new THREE.Vector3(Math.cos(cameraState(stage).az), 0, -Math.sin(cameraState(stage).az));
      if (narrow) shift.set(0, -units * 0.22, 0);
      else shift.copy(right).multiplyScalar(units * 0.18);
      flyCamera(stage, { target: target.add(shift), zoom: z }, { duration: 1700, arc: 0.6 });
    }
    placeLabels();
  }
  function deselect() {
    closeShowcase();
    selected = null;
    ring.visible = false;
    card.hidden = true;
    document.body.classList.remove('card-open');
    history.replaceState(null, '', location.pathname + location.search);
    placeLabels();
  }
  function fillCard(d) {
    $('card-badges').innerHTML = d.k
      ? `<span class="qw-badge startup">Startup</span><span class="qw-badge">${esc(d.sec)}</span>`
      : `<span class="qw-badge">Fortune 500 · No. ${d.r}</span>${d.t ? '<span class="qw-badge tech">Tech</span>' : ''}`;
    $('card-name').textContent = d.n;
    $('card-place').textContent = d.c;
    const facts = d.k ? [['Founded', d.f], ['Sector', esc(d.sec)]] : [['Revenue', `${money(d.v)} <small>FY${listYear - 1}</small>`], ['Rank', `No. ${d.r} <small>${listYear}</small>`]];
    if (d.ln) facts.push(['Listed as', esc(d.ln)]);
    $('card-facts').innerHTML = facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    const url = pageUrl(d);
    $('card-open').href = `c/${d.s}.html`;
    $('card-copy').onclick = () => QRCard.copy(url, $('card-copy'));
    const r = d.a && regions.find((x) => x.id === d.a);
    const near = (r ? r.members.map((sl) => bySlug.get(sl)) : []).filter((o) => o !== d).sort((a, b) => priority(a) - priority(b)).slice(0, 8);
    $('card-near-h').textContent = r ? `Also in ${r.name}` : '';
    $('card-near-h').hidden = !near.length;
    $('card-near').innerHTML = near.map((o) => `<li><button data-s="${o.s}"><i class="dot ${o.k ? 'startup' : 'f500'}${o.t ? ' tech' : ''}"></i>${esc(o.n)}</button></li>`).join('');
    card.hidden = false;
    card.scrollTop = 0;
    document.body.classList.add('card-open');
    openShowcase(d);
  }

  // ---------- showcase: the company's own model and its QR code ----------
  let show = null, showToken = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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
  function openShowcase(d, { holdModel = 1800, holdQR = 3000 } = {}) {
    closeShowcase();
    const token = ++showToken;
    const w = createQRWorld($('show-stage'), { slug: d.s, model: d.m, qr: qrFor(d), viewScale: 1.4, insets: () => ({ top: 10, bottom: 10 }) });
    show = w;
    let auto = true;
    const btn = $('show-toggle');
    const label = () => (btn.textContent = w.scanning ? 'Back to the 3D model' : 'Turn into QR code');
    label();
    btn.onclick = () => {
      auto = false;
      if (w.busy) return;
      w.setScan(!w.scanning);
      label();
    };
    // Play it once on its own: the model, then its QR code, then the model again.
    (async () => {
      await w.ready;
      await wait(holdModel);
      if (token !== showToken || !auto) return;
      const toQR = w.setScan(true);
      label();
      await toQR;
      await wait(holdQR);
      if (token !== showToken || !auto) return;
      const back = w.setScan(false);
      label();
      await back;
    })();
  }
  function closeShowcase() {
    showToken++;
    if (show) {
      show.dispose();
      show = null;
    }
  }
  $('card-near').addEventListener('click', (e) => { const b = e.target.closest('button[data-s]'); if (b) select(b.dataset.s); });
  $('card-close').addEventListener('click', deselect);

  // ---------- mode & filter ----------
  async function switchMode(next) {
    if (next === mode) return;
    for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === next));
    mode = next;
    land = landOf(mode);
    // Repaint the map in a sweep while the companies hop to their new places.
    tween(stage, 1100, (e) => {
      paintTiles(Math.ceil(e * S));
      if (e >= 1) layoutBlocks();
    }).then(layoutBlocks);
    flyCamera(stage, overview(), { duration: 1600, arc: 0.25 });
    await settle(1600, 4);
  }
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => { if (tour.active) stopTour(); deselect(); switchMode(b.dataset.mode); });
  for (const b of document.querySelectorAll('.qw-filters button')) {
    b.addEventListener('click', () => {
      filter = b.dataset.f;
      for (const o of document.querySelectorAll('.qw-filters button')) o.setAttribute('aria-pressed', String(o === b));
      settle(700);
    });
  }

  // ---------- scan view ----------
  let scanning = false;
  async function setScan(on) {
    if (on === scanning) return;
    scanning = on;
    document.body.classList.toggle('scanning', on);
    $('see').setAttribute('aria-pressed', String(on));
    controls.enabled = !on;
    controls.autoRotate = false;
    if (on) {
      if (tour.active) stopTour();
      deselect();
      ink.visible = true;
      plain = true;
      paintTiles();
      const H = stageEl.clientHeight, W = stageEl.clientWidth;
      const topPad = W < 760 ? 100 : 80, botPad = W < 760 ? 190 : 150;
      const fitPx = Math.min(H - topPad - botPad, W - 32);
      const zoom = (2 * halfH() * fitPx) / (H * S);
      const delta = (topPad + (H - botPad)) / 2 - H / 2;
      flyCamera(stage, { target: new THREE.Vector3(0, 0, -delta * ((2 * halfH()) / zoom / H)), az: 0, polar: 0.0001, zoom }, { duration: 1600 });
      await tween(stage, 1600, (e) => {
        flatten = e;
        layoutBlocks();
        placeAll();
        ink.material.opacity = Math.max(0, e * 1.5 - 0.5);
        placeLabels();
      });
    } else {
      plain = false;
      paintTiles();
      flyCamera(stage, overview(), { duration: 1600 });
      await tween(stage, 1600, (e) => {
        flatten = 1 - e;
        layoutBlocks();
        placeAll();
        ink.material.opacity = 1 - e;
      });
      ink.visible = false;
    }
  }
  $('see').addEventListener('click', () => setScan(!scanning));

  // ---------- search ----------
  const qIn = $('q'), results = $('results');
  let hits = [], active = -1;
  const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const index = DATA.map((d) => ({ d, n: norm(d.n), ln: norm(d.ln || ''), c: norm(d.c) }));
  function search(text) {
    const t = norm(text.trim());
    if (!t) return [];
    const out = [];
    for (const r of regions) if (norm(r.name).includes(t) || norm(r.short).includes(t)) out.push({ region: r, score: -1 });
    for (const e of index) {
      let score = null;
      if (e.n.startsWith(t)) score = 0;
      else if (e.n.split(/[\s(-]+/).some((w) => w.startsWith(t))) score = 1;
      else if (e.n.includes(t) || e.ln.includes(t)) score = 2;
      else if (e.c.includes(t)) score = 3;
      if (score !== null) out.push({ d: e.d, score: score + priority(e.d) / 1000 });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, 8);
  }
  function renderHits() {
    results.innerHTML = hits.map((h, i) => h.region
      ? `<li role="option" id="opt-${i}" aria-selected="${i === active}" data-i="${i}"><span class="r-name">Fly to ${esc(h.region.name)}</span><span class="r-meta">${h.region.members.length} HQs</span></li>`
      : `<li role="option" id="opt-${i}" aria-selected="${i === active}" data-i="${i}"><i class="dot ${h.d.k ? 'startup' : 'f500'}${h.d.t ? ' tech' : ''}"></i><span class="r-name">${esc(h.d.n)}</span><span class="r-meta">${h.d.k ? 'Startup' : '#' + h.d.r} · ${esc(h.d.c)}</span></li>`).join('');
    results.hidden = !hits.length;
    qIn.setAttribute('aria-expanded', String(!!hits.length));
    qIn.setAttribute('aria-activedescendant', active >= 0 ? `opt-${active}` : '');
  }
  async function choose(i) {
    const h = hits[i];
    if (!h) return;
    hits = [];
    renderHits();
    qIn.blur();
    if (scanning) await setScan(false);
    if (h.region) {
      if (tour.active) stopTour();
      deselect();
      const need = h.region.members.some((sl) => board.modes.us.pos[sl]) ? 'us' : 'world';
      if (need !== mode) await switchMode(need);
      qIn.value = h.region.name;
      flyCamera(stage, regionView(h.region.id), { duration: 1800, arc: 0.5 });
    } else {
      qIn.value = h.d.n;
      select(h.d.s);
    }
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

  // ---------- tour ----------
  const groupCounts = (slugs) => {
    const ds = slugs.map((sl) => bySlug.get(sl));
    const f = ds.filter((d) => d.k === 0);
    return { f500: f.length, tech: f.filter((d) => d.t).length, startups: ds.length - f.length, revenue: f.reduce((a, d) => a + (d.v || 0), 0), ds };
  };
  // The walkthrough: each tech hub, then a close-up of its biggest tech company.
  const TECH_CITIES = ['bay-area', 'seattle', 'socal', 'austin', 'dfw', 'atlanta', 'dc', 'nyc', 'boston', 'europe', 'asia-pacific'];
  const usSlugs = DATA.filter((d) => board.modes.us.pos[d.s]).map((d) => d.s);
  const techStops = TECH_CITIES.map((id) => regions.find((r) => r.id === id)).filter(Boolean).map((r, i) => {
    const ds = r.members.map((sl) => bySlug.get(sl));
    const tech = ds.filter((d) => d.t).sort((a, b) => priority(a) - priority(b));
    const star = tech[0] || [...ds].sort((a, b) => priority(a) - priority(b))[0];
    return { title: r.name, note: `Biggest tech company here: ${star.n}${star.k ? '' : ` (Fortune 500 No. ${star.r})`}.`, mode: r.members.some((sl) => board.modes.us.pos[sl]) ? 'us' : 'world', view: () => regionView(r.id, i), slugs: tech.map((d) => d.s), region: r, star };
  });
  const steps = [
    { title: 'Tech cities on a QR code', note: 'A quick flight over each tech hub and its biggest tech company. Each one turns into its own QR code.', mode: 'us', view: overview, slugs: usSlugs.filter((sl) => bySlug.get(sl).t), list: false },
    ...techStops,
    { title: 'Tech scoreboard', note: 'Tech HQs by city: Fortune 500 tech companies plus startups.', mode: 'us', view: overview, score: true },
  ];
  const tour = { active: false, paused: false, i: 0, raf: 0, elapsed: 0, hold: 0, start: 0 };
  const HOLD = 6500;
  const caption = $('caption'), playBtn = $('play');
  function showStep(i) {
    const st = steps[i];
    $('cap-step').textContent = `Stop ${i + 1} of ${steps.length}`;
    $('cap-title').textContent = st.title;
    $('cap-note').textContent = st.note || '';
    $('cap-note').hidden = !st.note;
    if (st.score) {
      const rows = techStops.map(({ region: r }) => ({ r, ...groupCounts(r.members.filter((sl) => bySlug.get(sl).t)) })).sort((a, b) => b.f500 + b.startups - (a.f500 + a.startups));
      const max = Math.max(...rows.map((x) => x.f500 + x.startups));
      $('cap-stats').innerHTML = '';
      $('cap-list').className = 'qw-list qw-bars';
      $('cap-list').innerHTML = rows.map((x) => `<li class="bar"><button data-region="${x.r.id}"><span>${esc(x.r.short)}</span><span class="bar-track"><i class="f" style="width:${(x.f500 / max) * 100}%"></i><i class="s" style="width:${(x.startups / max) * 100}%"></i></span><span class="bar-n">${x.f500}<small>+${x.startups}</small></span></button></li>`).join('');
      focus = null;
    } else {
      const c = groupCounts(st.slugs);
      $('cap-stats').innerHTML = [c.f500 ? [c.f500, 'Fortune 500 HQs'] : null, c.f500 ? [c.tech, 'in tech'] : null, [c.startups, 'startups'], c.revenue ? [money(c.revenue), `revenue FY${listYear - 1}`] : null]
        .filter(Boolean).map(([nn, l]) => `<div><b>${nn}</b><span>${l}</span></div>`).join('');
      $('cap-list').className = 'qw-list';
      $('cap-list').innerHTML = (st.list === false ? [] : c.ds.sort((a, b) => priority(a) - priority(b)).slice(0, 6))
        .map((d) => `<li><button data-s="${d.s}"><i class="dot ${d.k ? 'startup' : 'f500'}${d.t ? ' tech' : ''}"></i>${esc(d.n)}<span class="t-meta">${d.k ? esc(d.sec) : '#' + d.r}</span></button></li>`).join('');
      focus = st.region ? new Set(st.slugs) : null;
    }
    placeLabels();
  }
  async function goTo(i) {
    cancelAnimationFrame(tour.raf);
    tour.i = (i + steps.length) % steps.length;
    if (selected) deselect();
    const st = steps[tour.i];
    showStep(tour.i);
    $('cap-bar').style.width = '0%';
    if (st.mode !== mode) await switchMode(st.mode);
    if (!tour.active) return;
    const step = tour.i;
    const ok = await flyCamera(stage, st.view(), { duration: 2200, arc: 0.45 });
    if (!ok || !tour.active || tour.i !== step) return;
    tour.elapsed = 0;
    tour.hold = st.score ? HOLD * 1.6 : st.star ? HOLD + 3000 : HOLD * 0.6;
    if (st.star) {
      // Swoop in on the city's biggest tech company and show its model turning into its QR.
      await wait(900);
      if (!tour.active || tour.paused || tour.i !== step) return;
      select(st.star.s, { hash: false, fromTour: true });
    }
    if (!tour.paused) runHold();
  }
  function runHold() {
    tour.start = performance.now() - tour.elapsed;
    const tick = (now) => {
      tour.elapsed = now - tour.start;
      $('cap-bar').style.width = `${Math.min(100, (tour.elapsed / tour.hold) * 100)}%`;
      // Slow drift around the stop keeps the scene moving.
      if (!reduceMotion && !selected) {
        const cs = cameraState(stage);
        setCamera(stage, { ...cs, az: cs.az + 0.0012 });
      }
      if (tour.elapsed >= tour.hold) return tour.i === steps.length - 1 ? stopTour(true) : goTo(tour.i + 1);
      tour.raf = requestAnimationFrame(tick);
    };
    tour.raf = requestAnimationFrame(tick);
  }
  function startTour(from = 0) {
    if (scanning) setScan(false);
    tour.active = true;
    tour.paused = false;
    caption.hidden = false;
    document.body.classList.add('touring');
    playBtn.innerHTML = ICON_PAUSE;
    playBtn.setAttribute('aria-label', 'Pause tour');
    history.replaceState(null, '', '#tour');
    goTo(from);
  }
  function pauseTour() {
    tour.paused = true;
    cancelAnimationFrame(tour.raf);
    playBtn.innerHTML = ICON_PLAY;
    playBtn.setAttribute('aria-label', 'Resume tour');
  }
  function resumeTour() {
    tour.paused = false;
    playBtn.innerHTML = ICON_PAUSE;
    playBtn.setAttribute('aria-label', 'Pause tour');
    if (selected) deselect();
    showStep(tour.i);
    flyCamera(stage, steps[tour.i].view(), { duration: 1400 }).then((ok) => ok && tour.active && !tour.paused && runHold());
  }
  function stopTour(finished) {
    cancelAnimationFrame(tour.raf);
    tour.active = false;
    tour.paused = false;
    focus = null;
    document.body.classList.remove('touring');
    if (!finished) caption.hidden = true;
    playBtn.innerHTML = ICON_PLAY;
    playBtn.setAttribute('aria-label', 'Play tour');
    if (location.hash === '#tour') history.replaceState(null, '', location.pathname + location.search);
    placeLabels();
  }
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  playBtn.addEventListener('click', () => (!tour.active ? startTour(0) : tour.paused ? resumeTour() : pauseTour()));
  $('cap-prev').addEventListener('click', () => { tour.paused = false; playBtn.innerHTML = ICON_PAUSE; goTo(tour.i - 1); });
  $('cap-next').addEventListener('click', () => { tour.paused = false; playBtn.innerHTML = ICON_PAUSE; goTo(tour.i + 1); });
  $('cap-close').addEventListener('click', () => stopTour());
  $('cap-list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.s) select(b.dataset.s);
    else if (b.dataset.region) {
      const i = steps.findIndex((st) => st.region && st.region.id === b.dataset.region);
      if (i >= 0) { tour.paused = false; playBtn.innerHTML = ICON_PAUSE; goTo(i); }
    }
  });
  $('random').addEventListener('click', async () => {
    if (tour.active) stopTour();
    if (scanning) await setScan(false);
    const poolD = DATA.filter((d) => matches(d) && board.modes[mode].pos[d.s]);
    select(poolD[Math.floor(Math.random() * poolD.length)].s);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === '/') { qIn.focus(); e.preventDefault(); }
    else if (e.key === 'Escape') { if (selected) deselect(); else if (tour.active) stopTour(); else if (scanning) setScan(false); }
    else if (tour.active && e.key === 'ArrowRight') $('cap-next').click();
    else if (tour.active && e.key === 'ArrowLeft') $('cap-prev').click();
  });

  // ---------- start ----------
  let intro;
  function route(initial) {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'tour') return startTour();
    if (h === 'scan') return setScan(true);
    // A shared link to a company: land on the board first, then fly in.
    if (bySlug.has(h)) return initial ? intro.then(() => !selected && !tour.active && select(h, { hash: false })) : select(h, { hash: false });
  }
  window.addEventListener('hashchange', () => route(false));
  intro = flyCamera(stage, overview(), { duration: 2600 });
  settle(2400).then(() => {
    if (!tour.active && !selected && !scanning && !reduceMotion) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
    }
  });
  route(true);
}
