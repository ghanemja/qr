// SPDX-License-Identifier: MIT
// Copyright (c) 2026 ghanemja. QR Compass, https://ghanemja.github.io/qr/
(() => {
  const { W, H, usView, regions, listYear, places } = window.ATLAS;
  const DATA = window.COMPANIES;
  const bySlug = new Map(DATA.map((d) => [d.s, d]));
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = $('map'), stage = $('stage'), dotsG = $('dots'), ringsG = $('rings'), labelsEl = $('labels'), tip = $('tip');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MAX_REV = Math.max(...DATA.map((d) => d.v || 0));
  const WORLD = { x: W / 2, y: H * 0.47, w: W * 1.02 };
  const priority = (d) => (d.k === 0 ? d.r : 45);
  const money = (m) => (m >= 1e6 ? `$${(m / 1e6).toFixed(2)}T` : m >= 1000 ? `$${(m / 1000).toFixed(m >= 100000 ? 0 : 1)}B` : `$${Math.round(m)}M`);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---------- view ----------
  let view = { ...WORLD };
  let size = { w: 1, h: 1 };
  const k = () => size.w / view.w;
  const viewH = (w) => (w * size.h) / size.w;

  function apply() {
    view.w = clamp(view.w, 1.2, W * 1.4);
    view.x = clamp(view.x, 0, W);
    view.y = clamp(view.y, 0, H);
    const h = viewH(view.w);
    svg.setAttribute('viewBox', `${view.x - view.w / 2} ${view.y - h / 2} ${view.w} ${h}`);
    scaleDots();
    placeLabels();
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    size = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    apply();
  }

  // Screen space covered by the tour panel or the company card, so framing can avoid it.
  function insets() {
    let left = 0, right = 0, bottom = 0;
    if (size.w < 720) {
      if (!card.hidden) bottom = card.offsetHeight;
      else if (tour.active) bottom = $('tour').offsetHeight + 8;
    } else {
      if (tour.active) left = $('tour').offsetWidth + 12;
      if (!card.hidden) right = card.offsetWidth + 74;
    }
    return { left, right, bottom };
  }
  // Frame {x, y, w} (w = minimum width shown, height at least w / 1.6) in the uncovered part of the screen.
  function fit(v) {
    const { left, right, bottom } = insets();
    const aw = Math.max(120, size.w - left - right), ah = Math.max(120, size.h - bottom);
    const kk = Math.min(aw / v.w, ah / (v.w / 1.6));
    return { x: v.x - (left + aw / 2 - size.w / 2) / kk, y: v.y - (ah / 2 - size.h / 2) / kk, w: size.w / kk };
  }

  // ---------- dots ----------
  const circles = new Map();
  for (const d of [...DATA].sort((a, b) => (b.v || 0) - (a.v || 0))) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', d.x);
    c.setAttribute('cy', d.y);
    c.setAttribute('class', `dot ${d.k ? 'startup' : 'f500'}${d.t ? ' tech' : ''}`);
    c.dataset.s = d.s;
    d.px = d.k ? 3.8 : 2.2 + 7 * Math.sqrt((d.v || 0) / MAX_REV);
    circles.set(d.s, c);
    dotsG.appendChild(c);
  }
  function scaleDots() {
    const kk = k();
    // Shrink dots a little when the whole world is in view so dense metros stay readable.
    const zoomFactor = clamp(0.75 + Math.log2(kk) * 0.12, 0.75, 1.25);
    for (const d of DATA) circles.get(d.s).setAttribute('r', ((d.px * zoomFactor) / kk).toFixed(4));
    if (ring) ring.setAttribute('r', (16 / kk).toFixed(4));
  }

  // ---------- filter & focus ----------
  let filter = 'all';
  let focus = null; // Set of slugs highlighted by the tour
  const matches = (d) => filter === 'all' || (filter === 'tech' ? d.t : filter === 'startup' ? d.k === 1 : d.k === 0);
  function restyle() {
    for (const d of DATA) {
      const c = circles.get(d.s);
      c.classList.toggle('dim', !matches(d));
      c.classList.toggle('faded', !!focus && !focus.has(d.s));
    }
    placeLabels();
  }
  $('n-all').textContent = DATA.length;
  for (const b of document.querySelectorAll('.filters button')) {
    b.addEventListener('click', () => {
      filter = b.dataset.f;
      for (const o of document.querySelectorAll('.filters button')) o.setAttribute('aria-pressed', String(o === b));
      restyle();
    });
  }

  // ---------- labels ----------
  const pool = [];
  function placeLabels() {
    const kk = k();
    const x0 = view.x - view.w / 2, y0 = view.y - viewH(view.w) / 2;
    const toScreen = (d) => [(d.x - x0) * kk, (d.y - y0) * kk];
    const cands = [];
    const add = (d, force) => {
      const [sx, sy] = toScreen(d);
      if (sx < -20 || sy < -20 || sx > size.w + 20 || sy > size.h + 20) return;
      cands.push({ d, sx, sy, force });
    };
    if (selected) add(selected, true);
    if (focus) {
      [...focus].map((s) => bySlug.get(s)).filter((d) => d !== selected && matches(d)).sort((a, b) => priority(a) - priority(b)).slice(0, 14).forEach((d) => add(d));
    } else if (kk > 9) {
      DATA.filter((d) => d !== selected && matches(d)).sort((a, b) => priority(a) - priority(b)).forEach((d) => add(d));
    }
    const placed = [];
    let used = 0;
    for (const c of cands) {
      if (used >= 40) break;
      const w = c.d.n.length * 6.7 + 8, h = 17;
      const r = (c.d.px || 4) + 3;
      // Try right of the dot, then left.
      const opts = [[c.sx + r, c.sy - h / 2], [c.sx - r - w, c.sy - h / 2]];
      let spot = null;
      for (const [lx, ly] of opts) {
        const box = [lx, ly, lx + w, ly + h];
        if (c.force || !placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])) {
          spot = box;
          break;
        }
      }
      if (!spot) continue;
      placed.push(spot);
      let el = pool[used];
      if (!el) {
        el = document.createElement('div');
        el.className = 'lbl';
        labelsEl.appendChild(el);
        pool.push(el);
      }
      if (el.textContent !== c.d.n) el.textContent = c.d.n;
      el.className = `lbl${c.d.k ? ' startup' : ''}${c.force ? ' sel' : ''}`;
      el.style.transform = `translate(${spot[0].toFixed(1)}px, ${spot[1].toFixed(1)}px)`;
      el.hidden = false;
      used++;
    }
    // Place names fill the gaps: metro names when zoomed out, city names when zoomed in.
    const named = kk < 9
      ? regions.map((r) => ({ n: r.short, x: r.view.x, y: r.view.y, dy: 0 })).filter(() => kk > 0.45)
      : places.map((p) => ({ n: p.n, x: p.x, y: p.y, dy: -24 }));
    for (const p of named) {
      if (used >= 70) break;
      const [sx, sy] = toScreen(p);
      if (sx < -60 || sy < -20 || sx > size.w + 60 || sy > size.h + 20) continue;
      const w = p.n.length * 7.4 + 8, h = 16;
      const box = [sx - w / 2, sy + p.dy - h / 2, sx + w / 2, sy + p.dy + h / 2];
      if (placed.some((q) => box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1])) continue;
      placed.push(box);
      let el = pool[used];
      if (!el) {
        el = document.createElement('div');
        labelsEl.appendChild(el);
        pool.push(el);
      }
      if (el.textContent !== p.n) el.textContent = p.n;
      el.className = 'lbl place';
      el.style.transform = `translate(${box[0].toFixed(1)}px, ${box[1].toFixed(1)}px)`;
      el.hidden = false;
      used++;
    }
    for (let i = used; i < pool.length; i++) pool[i].hidden = true;
  }

  // ---------- smooth zoom (van Wijk & Nuij, as in d3-interpolate) ----------
  function zoomPath(p0, p1) {
    const rho = Math.SQRT2, rho2 = 2, rho4 = 4;
    const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1;
    const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
    if (d2 < 1e-12) {
      const S = Math.log(w1 / w0) / rho;
      return { S: Math.abs(S), at: (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)] };
    }
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    const S = (r1 - r0) / rho;
    return {
      S,
      at: (t) => {
        const s = t * S, coshr0 = Math.cosh(r0);
        const u = (w0 / (rho2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
        return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(rho * s + r0)];
      },
    };
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let flight = null;
  function flyTo(target, speed = 1) {
    stopFlight();
    if (reduceMotion) {
      view = { ...target };
      apply();
      return Promise.resolve(true);
    }
    const path = zoomPath([view.x, view.y, view.w], [target.x, target.y, target.w]);
    const dur = clamp(path.S * 900 * speed, 450, 3600);
    return new Promise((resolve) => {
      const start = performance.now();
      const f = { resolve, raf: 0 };
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const [x, y, w] = path.at(ease(t));
        view = { x, y, w };
        apply();
        if (t < 1) f.raf = requestAnimationFrame(step);
        else {
          flight = null;
          resolve(true);
        }
      };
      f.raf = requestAnimationFrame(step);
      flight = f;
    });
  }
  function stopFlight() {
    if (!flight) return;
    cancelAnimationFrame(flight.raf);
    flight.resolve(false);
    flight = null;
  }

  // ---------- pan / zoom input ----------
  const pointers = new Map();
  let dragDist = 0, pinch = null;
  function zoomAt(factor, sx, sy) {
    const kk = k();
    const x0 = view.x - view.w / 2, y0 = view.y - viewH(view.w) / 2;
    const wx = x0 + sx / kk, wy = y0 + sy / kk;
    const w = clamp(view.w * factor, 1.2, W * 1.4);
    const k2 = size.w / w;
    view = { x: wx - sx / k2 + w / 2, y: wy - sy / k2 + viewH(w) / 2, w };
    apply();
  }
  function userMoved() {
    stopFlight();
    if (tour.active && !tour.paused) pauseTour();
  }
  svg.addEventListener('pointerdown', (e) => {
    svg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragDist = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) };
    }
    svg.classList.add('grabbing');
  });
  svg.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return showTip(e);
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    dragDist += Math.abs(dx) + Math.abs(dy);
    if (dragDist > 4) userMoved();
    if (pointers.size === 1) {
      if (dragDist <= 4) return;
      view.x -= dx / k();
      view.y -= dy / k();
      apply();
    } else if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = svg.getBoundingClientRect();
      zoomAt(pinch.d / d, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      pinch.d = d;
    }
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) svg.classList.remove('grabbing');
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    userMoved();
    const rect = svg.getBoundingClientRect();
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
    zoomAt(Math.exp(clamp(delta, -120, 120) * 0.0022), e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });
  svg.addEventListener('dblclick', (e) => {
    userMoved();
    const rect = svg.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const kk = k();
    const x0 = view.x - view.w / 2, y0 = view.y - viewH(view.w) / 2;
    flyTo({ x: x0 + sx / kk, y: y0 + sy / kk, w: view.w / 2.5 });
  });
  svg.addEventListener('click', (e) => {
    if (dragDist > 4) return;
    const s = e.target.dataset && e.target.dataset.s;
    if (s) select(s);
  });
  svg.addEventListener('pointerleave', () => (tip.hidden = true));
  function showTip(e) {
    const s = e.target.dataset && e.target.dataset.s;
    if (!s || e.pointerType === 'touch') return (tip.hidden = true);
    const d = bySlug.get(s);
    tip.innerHTML = `<strong>${esc(d.n)}</strong><span>${d.k ? esc(d.sec) + ' startup' : `Fortune 500 No. ${d.r}`} · ${esc(d.c)}</span>`;
    const rect = stage.getBoundingClientRect();
    tip.style.transform = `translate(${e.clientX - rect.left + 14}px, ${e.clientY - rect.top + 14}px)`;
    tip.hidden = false;
  }
  $('zin').addEventListener('click', () => { userMoved(); flyTo({ ...view, w: view.w / 2 }); });
  $('zout').addEventListener('click', () => { userMoved(); flyTo({ ...view, w: view.w * 2 }); });
  $('zus').addEventListener('click', () => { userMoved(); flyTo(fit(usView)); });
  $('zworld').addEventListener('click', () => { userMoved(); flyTo(WORLD); });

  // ---------- selection & card ----------
  let selected = null, ring = null;
  const card = $('card');
  const pageUrl = (d) => QRCard.siteUrl(`c/${d.s}.html`);
  function select(slug, { fly = true, updateHash = true } = {}) {
    const d = bySlug.get(slug);
    if (!d) return;
    if (tour.active && !tour.paused) pauseTour();
    if (focus && !focus.has(slug)) {
      focus = null;
      restyle();
    }
    selected = d;
    for (const c of dotsG.querySelectorAll('.sel')) c.classList.remove('sel');
    circles.get(slug).classList.add('sel');
    dotsG.appendChild(circles.get(slug));
    ringsG.innerHTML = '';
    ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('class', 'ring');
    ring.setAttribute('cx', d.x);
    ring.setAttribute('cy', d.y);
    ringsG.appendChild(ring);
    fillCard(d);
    if (updateHash) history.replaceState(null, '', `#${slug}`);
    if (fly) flyTo(fit({ x: d.x, y: d.y, w: Math.min(view.w, 7) }));
    scaleDots();
    placeLabels();
  }
  function deselect() {
    selected = null;
    ring = null;
    ringsG.innerHTML = '';
    for (const c of dotsG.querySelectorAll('.sel')) c.classList.remove('sel');
    card.hidden = true;
    document.body.classList.remove('card-open');
    history.replaceState(null, '', location.pathname + location.search);
    placeLabels();
  }
  function fillCard(d) {
    $('card-badges').innerHTML = d.k
      ? `<span class="badge startup">Startup</span><span class="badge">${esc(d.sec)}</span>`
      : `<span class="badge${d.t ? ' tech' : ''}">Fortune 500 · No. ${d.r}</span>${d.t ? '<span class="badge tech">Tech</span>' : ''}`;
    $('card-name').textContent = d.n;
    $('card-place').textContent = d.c;
    const facts = d.k
      ? [['Founded', d.f], ['Sector', esc(d.sec)]]
      : [['Revenue', `${money(d.v)} <small>FY${listYear - 1}</small>`], ['Rank', `No. ${d.r} <small>${listYear} list</small>`]];
    if (d.ln) facts.push(['Listed as', esc(d.ln)]);
    $('card-facts').innerHTML = facts.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    const url = pageUrl(d);
    QRCard.draw($('card-qr'), url, d.n);
    $('card-open').href = `c/${d.s}.html`;
    $('card-copy').onclick = () => QRCard.copy(url, $('card-copy'));
    $('card-dl').onclick = () => QRCard.download(url, d.n, `${d.s}-qr.png`);
    const near = (d.a ? regions.find((r) => r.id === d.a).members.map((s) => bySlug.get(s)) : DATA.filter((o) => Math.hypot(o.x - d.x, o.y - d.y) < 3))
      .filter((o) => o !== d)
      .sort((a, b) => priority(a) - priority(b))
      .slice(0, 8);
    $('card-near-h').textContent = d.a ? `Also in ${regions.find((r) => r.id === d.a).name}` : 'Nearby';
    $('card-near-h').hidden = !near.length;
    $('card-near').innerHTML = near.map((o) => `<li><button data-s="${o.s}"><span class="dot-i ${o.k ? 'startup' : 'f500'}${o.t ? ' tech' : ''}"></span>${esc(o.n)}</button></li>`).join('');
    card.hidden = false;
    card.scrollTop = 0;
    document.body.classList.add('card-open');
  }
  $('card-near').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-s]');
    if (b) select(b.dataset.s);
  });
  $('card-close').addEventListener('click', deselect);

  // ---------- search ----------
  const q = $('q'), results = $('results');
  let hits = [], active = -1;
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const index = DATA.map((d) => ({ d, n: norm(d.n), ln: norm(d.ln || ''), c: norm(d.c) }));
  function search(text) {
    const t = norm(text.trim());
    if (!t) return [];
    const out = [];
    for (const r of regions) if (norm(r.name).includes(t)) out.push({ region: r, score: -1 });
    for (const e of index) {
      let score = null;
      if (e.n.startsWith(t)) score = 0;
      else if (e.n.split(/[\s(-]+/).some((w) => w.startsWith(t))) score = 1;
      else if (e.n.includes(t) || e.ln.includes(t)) score = 2;
      else if (e.c.includes(t)) score = 3;
      if (score !== null) out.push({ d: e.d, score: score + priority(e.d) / 1000 });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, 9);
  }
  function render() {
    results.innerHTML = hits.map((h, i) => h.region
      ? `<li role="option" id="opt-${i}" aria-selected="${i === active}" data-i="${i}"><span class="r-name">Fly to ${esc(h.region.name)}</span><span class="r-meta">${h.region.members.length} HQs</span></li>`
      : `<li role="option" id="opt-${i}" aria-selected="${i === active}" data-i="${i}"><span class="dot-i ${h.d.k ? 'startup' : 'f500'}${h.d.t ? ' tech' : ''}"></span><span class="r-name">${esc(h.d.n)}</span><span class="r-meta">${h.d.k ? 'Startup' : '#' + h.d.r} · ${esc(h.d.c)}</span></li>`).join('');
    const open = hits.length > 0;
    results.hidden = !open;
    q.setAttribute('aria-expanded', String(open));
    q.setAttribute('aria-activedescendant', active >= 0 ? `opt-${active}` : '');
  }
  function choose(i) {
    const h = hits[i];
    if (!h) return;
    hits = [];
    render();
    q.blur();
    if (h.region) {
      if (tour.active) stopTour();
      deselect();
      flyTo(fit(h.region.view));
      q.value = h.region.name;
    } else {
      q.value = h.d.n;
      select(h.d.s);
    }
  }
  q.addEventListener('input', () => {
    hits = search(q.value);
    active = hits.length ? 0 : -1;
    render();
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { active = Math.min(hits.length - 1, active + 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); render(); e.preventDefault(); }
    else if (e.key === 'Enter') { choose(active < 0 ? 0 : active); e.preventDefault(); }
    else if (e.key === 'Escape') { hits = []; render(); q.blur(); }
  });
  q.addEventListener('focus', () => { if (q.value) { hits = search(q.value); render(); } });
  q.addEventListener('blur', () => setTimeout(() => { results.hidden = true; q.setAttribute('aria-expanded', 'false'); }, 150));
  results.addEventListener('mousedown', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li) { e.preventDefault(); choose(+li.dataset.i); }
  });

  // ---------- tour ----------
  const counts = (slugs) => {
    const ds = slugs.map((s) => bySlug.get(s));
    const f = ds.filter((d) => d.k === 0);
    return { f500: f.length, tech: f.filter((d) => d.t).length, startups: ds.length - f.length, revenue: f.reduce((a, d) => a + (d.v || 0), 0), ds };
  };
  const all = DATA.map((d) => d.s);
  const usSlugs = DATA.filter((d) => d.k === 0 || /, [A-Z]{2}$/.test(d.c)).map((d) => d.s);
  const steps = [
    { title: 'The world, by headquarters', note: `Every ${listYear} Fortune 500 HQ plus notable startups worldwide. Dot size follows revenue.`, view: () => fit({ x: WORLD.x, y: WORLD.y, w: W * 0.8 }), slugs: all, list: false },
    { title: 'United States', note: 'Coast to coast: the corporate map is wider than Silicon Valley.', view: () => fit(usView), slugs: usSlugs },
    ...regions.map((r) => ({ title: r.name, note: r.note, view: () => fit(r.view), slugs: r.members, region: r })),
    { title: 'Scoreboard', note: 'Fortune 500 HQs and startups by region.', view: () => fit(usView), slugs: null, score: true },
  ];
  const tour = { active: false, paused: false, i: 0, timer: 0, holdStart: 0, hold: 0, elapsed: 0, raf: 0 };
  const HOLD = 6500;
  const tourBody = $('tour-body'), playBtn = $('play');

  function showStep(i) {
    const s = steps[i];
    $('tour-step').textContent = `Stop ${i + 1} of ${steps.length}`;
    $('tour-title').textContent = s.title;
    $('tour-note').textContent = s.note || '';
    $('tour-note').hidden = !s.note;
    if (s.score) {
      const rows = regions.map((r) => ({ r, ...counts(r.members) })).sort((a, b) => b.f500 + b.startups - (a.f500 + a.startups));
      const max = Math.max(...rows.map((x) => x.f500 + x.startups));
      $('tour-stats').innerHTML = '';
      $('tour-list').innerHTML = rows.map((x) => `<li class="bar"><button data-region="${x.r.id}"><span class="bar-name">${esc(x.r.name)}</span><span class="bar-track"><i class="f" style="width:${(x.f500 / max) * 100}%"></i><i class="s" style="width:${(x.startups / max) * 100}%"></i></span><span class="bar-n">${x.f500}<small>+${x.startups}</small></span></button></li>`).join('');
      $('tour-list').className = 'toplist bars';
      focus = null;
    } else {
      const c = counts(s.slugs);
      $('tour-stats').innerHTML = [
        c.f500 ? [c.f500, 'Fortune 500 HQs'] : null,
        c.f500 ? [c.tech, 'in tech'] : null,
        [c.startups, 'startups'],
        c.revenue ? [money(c.revenue), `revenue FY${listYear - 1}`] : null,
      ].filter(Boolean).map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('');
      const top = s.list === false ? [] : c.ds.sort((a, b) => priority(a) - priority(b)).slice(0, 7);
      $('tour-list').className = 'toplist';
      $('tour-list').innerHTML = top.map((d) => `<li><button data-s="${d.s}"><span class="dot-i ${d.k ? 'startup' : 'f500'}${d.t ? ' tech' : ''}"></span><span class="t-name">${esc(d.n)}</span><span class="t-meta">${d.k ? esc(d.sec) : '#' + d.r}</span></button></li>`).join('');
      focus = s.region ? new Set(s.slugs) : null;
    }
    restyle();
  }

  async function goTo(i) {
    clearTimeout(tour.timer);
    cancelAnimationFrame(tour.raf);
    tour.i = (i + steps.length) % steps.length;
    if (selected) deselect();
    showStep(tour.i);
    $('tour-bar').style.width = '0%';
    const arrived = await flyTo(steps[tour.i].view(), 1.15);
    if (!arrived || !tour.active) return;
    tour.elapsed = 0;
    tour.hold = steps[tour.i].score ? HOLD * 1.6 : HOLD;
    if (!tour.paused) runHold();
  }
  function runHold() {
    tour.holdStart = performance.now() - tour.elapsed;
    const tick = (now) => {
      tour.elapsed = now - tour.holdStart;
      $('tour-bar').style.width = `${Math.min(100, (tour.elapsed / tour.hold) * 100)}%`;
      if (tour.elapsed >= tour.hold) {
        if (tour.i === steps.length - 1) return stopTour(true);
        return goTo(tour.i + 1);
      }
      tour.raf = requestAnimationFrame(tick);
    };
    tour.raf = requestAnimationFrame(tick);
  }
  function startTour(from = 0) {
    tour.active = true;
    tour.paused = false;
    document.body.classList.add('touring');
    tourBody.hidden = false;
    $('prev').hidden = $('next').hidden = false;
    playBtn.textContent = '❚❚ Pause';
    history.replaceState(null, '', '#tour');
    goTo(from);
  }
  function pauseTour() {
    tour.paused = true;
    cancelAnimationFrame(tour.raf);
    playBtn.textContent = '▶ Resume';
  }
  function resumeTour() {
    tour.paused = false;
    playBtn.textContent = '❚❚ Pause';
    if (selected) deselect();
    focus = steps[tour.i].region ? new Set(steps[tour.i].slugs) : null;
    restyle();
    if (flight) return;
    // If the user wandered off, fly back to the current stop before continuing.
    const v = steps[tour.i].view();
    if (Math.abs(v.x - view.x) + Math.abs(v.y - view.y) > v.w * 0.05 || Math.abs(Math.log(v.w / view.w)) > 0.1) {
      flyTo(v).then((ok) => ok && tour.active && !tour.paused && runHold());
    } else runHold();
  }
  function stopTour(finished) {
    clearTimeout(tour.timer);
    cancelAnimationFrame(tour.raf);
    tour.active = false;
    tour.paused = false;
    focus = null;
    restyle();
    document.body.classList.remove('touring');
    $('prev').hidden = $('next').hidden = true;
    playBtn.textContent = finished ? '↻ Replay tour' : '▶ Play tour';
    if (!finished) tourBody.hidden = true;
    if (location.hash === '#tour') history.replaceState(null, '', location.pathname + location.search);
  }
  playBtn.addEventListener('click', () => {
    if (!tour.active) startTour(tourBody.hidden ? 0 : 0);
    else if (tour.paused) resumeTour();
    else pauseTour();
  });
  $('prev').addEventListener('click', () => { tour.paused = false; playBtn.textContent = '❚❚ Pause'; goTo(tour.i - 1); });
  $('next').addEventListener('click', () => { tour.paused = false; playBtn.textContent = '❚❚ Pause'; goTo(tour.i + 1); });
  $('tour-list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.s) select(b.dataset.s);
    else if (b.dataset.region) {
      const i = steps.findIndex((s) => s.region && s.region.id === b.dataset.region);
      if (i >= 0) { tour.paused = false; playBtn.textContent = '❚❚ Pause'; goTo(i); }
    }
  });
  $('random').addEventListener('click', () => {
    if (tour.active) stopTour();
    const pool = DATA.filter(matches);
    const d = pool[Math.floor(Math.random() * pool.length)];
    q.value = '';
    select(d.s);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === '/') { q.focus(); e.preventDefault(); }
    else if (e.key === 'Escape') { if (selected) deselect(); else if (tour.active) stopTour(); }
    else if (tour.active && e.key === 'ArrowRight') $('next').click();
    else if (tour.active && e.key === 'ArrowLeft') $('prev').click();
    else if (e.key === ' ' && document.activeElement === document.body) { playBtn.click(); e.preventDefault(); }
  });

  // ---------- routing & start ----------
  function route(initial) {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === 'tour') return startTour();
    if (bySlug.has(h)) {
      if (initial) {
        // Arrive from orbit: start on the world view, then fly in.
        setTimeout(() => select(h), 350);
      } else select(h, { updateHash: false });
      return;
    }
    if (initial) setTimeout(() => !selected && !tour.active && flyTo(fit(usView), 1.2), 500);
  }
  window.addEventListener('hashchange', () => route(false));
  window.addEventListener('resize', resize);
  resize();
  restyle();
  route(true);
})();
