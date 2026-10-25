// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Janelle Ghanem. QR Compass, https://ghanemja.github.io/qr/
// Company page: mounts the company's QR world and wires the page controls to it.
import { webglAvailable } from './qrworld.js';
import { createQRWorld } from './qrsculpture.js';

const C = window.COMPANY;
const $ = (id) => document.getElementById(id);
const pageUrl = QRCard.siteUrl(`${C.slug}.html`);
// The QR opens the link people paste into the field; this page until they do.
let link = pageUrl;

const normalize = (text) => {
  const t = text.trim();
  if (!t) return '';
  return /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
};
// QR modules for a link: highest error correction that fits (the level decides if a monogram fits).
function qrOf(text) {
  for (const level of ['H', 'Q', 'M', 'L']) {
    try {
      const q = qrcode(0, level);
      q.addData(text);
      q.make();
      const n = q.getModuleCount();
      let bits = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) bits += q.isDark(r, c) ? '1' : '0';
      return { n, bits, level };
    } catch {}
  }
  return null;
}

// Page chrome that works without WebGL.
const field = $('page-url');
// Title under the downloaded code and the letters in its middle; the company's own by default.
const titleIn = $('qr-title'), centerIn = $('qr-center');
titleIn.value = C.name;
centerIn.value = QRCard.initials(C.name);
// The code being shown, so the download matches it square for square (colours included).
let shownQR = C.qr, world = null;
const cardOpts = () => ({ title: titleIn.value.trim(), center: centerIn.value.trim().toUpperCase(), ...(world ? { qr: shownQR, colors: world.colors } : {}) });
$('share').addEventListener('click', async () => {
  if (navigator.share) return navigator.share({ title: C.name, url: pageUrl }).catch(() => {});
  QRCard.copy(pageUrl, $('share-label'));
});
for (const id of ['download', 'dock-download']) $(id).addEventListener('click', () => QRCard.download(link, C.name, `${C.slug}-qr.png`, cardOpts()));
for (const input of document.querySelectorAll('.cite input')) input.addEventListener('focus', () => input.select());

let applyLink = () => {};
const useField = () => {
  const next = normalize(field.value) || pageUrl;
  if (next === link) return;
  if (!qrOf(next)) {
    field.setCustomValidity('That link is too long for a QR code');
    field.reportValidity();
    return;
  }
  field.setCustomValidity('');
  link = next;
  applyLink();
};
field.addEventListener('change', useField);
field.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); useField(); field.blur(); } });
field.addEventListener('paste', () => setTimeout(useField, 0));
field.addEventListener('input', () => field.setCustomValidity(''));

if (!webglAvailable()) {
  document.body.classList.add('no-webgl');
  const redraw = () => QRCard.draw($('fallback-qr'), link, C.name, cardOpts());
  redraw();
  applyLink = redraw;
  for (const input of [titleIn, centerIn]) input.addEventListener('input', redraw);
} else {
  const stageEl = $('stage');
  const hint = $('hint').textContent;
  const label = (on) => {
    document.body.classList.toggle('scanning', on);
    for (const id of ['toggle']) $(id).setAttribute('aria-pressed', String(on));
    $('toggle-label').textContent = on ? 'Back to the 3D model' : 'Turn into QR code';
    $('hint').textContent = on ? 'Scan me · tap to rebuild the model' : hint;
  };
  const setScan = (on) => world && world.setScan(on);
  const mount = (qr) => {
    if (world) world.dispose();
    label(false);
    world = createQRWorld(stageEl, {
      onScan: label,
      slug: C.slug,
      model: C.model,
      look: C.look,
      qr,
      viewScale: stageEl.clientWidth < 640 ? 1.38 : 1.55,
      insets: (W) => (W < 640 ? { top: 100, bottom: 246 } : { top: 110, bottom: 175 }),
    });
    // A tap (not a drag) anywhere on the scene toggles scan view.
    let down = null;
    const canvas = world.stage.renderer.domElement;
    canvas.addEventListener('pointerdown', (ev) => (down = [ev.clientX, ev.clientY]));
    canvas.addEventListener('pointerup', (ev) => {
      if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) < 6) setScan(!world.scanning);
      down = null;
    });
    return world;
  };
  mount(C.qr);
  for (const id of ['toggle']) $(id).addEventListener('click', () => setScan(!world.scanning));
  // A new link rebuilds the model around its own QR, then turns it into the code to scan.
  applyLink = () => {
    shownQR = qrOf(link);
    const w = mount(shownQR);
    w.ready.then(() => w === world && setScan(true));
  };
  if (location.hash === '#scan') world.ready.then(() => setScan(true));
}
