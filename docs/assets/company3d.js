// Company page: mounts the company's QR world and wires the page controls to it.
import { webglAvailable } from './qrworld.js';
import { createQRWorld } from './qrsculpture.js';

const C = window.COMPANY;
const $ = (id) => document.getElementById(id);
const url = QRCard.siteUrl(`${C.slug}.html`);

// Page chrome that works without WebGL.
$('page-url').value = url;
$('share').addEventListener('click', async () => {
  if (navigator.share) return navigator.share({ title: C.name, url }).catch(() => {});
  QRCard.copy(url, $('share-label'));
});
for (const id of ['download', 'dock-download']) $(id).addEventListener('click', () => QRCard.download(url, C.name, `${C.slug}-qr.png`));
for (const input of document.querySelectorAll('.cite input')) input.addEventListener('focus', () => input.select());

if (!webglAvailable()) {
  document.body.classList.add('no-webgl');
  QRCard.draw($('fallback-qr'), url, C.name);
} else {
  const stageEl = $('stage');
  const world = createQRWorld(stageEl, {
    slug: C.slug,
    model: C.model,
    look: C.look,
    qr: C.qr,
    viewScale: stageEl.clientWidth < 640 ? 1.38 : 1.55,
    insets: (W) => (W < 640 ? { top: 100, bottom: 190 } : { top: 110, bottom: 175 }),
  });
  const hint = $('hint').textContent;
  const setScan = (on) => {
    if (world.busy) return;
    document.body.classList.toggle('scanning', on);
    for (const id of ['see', 'toggle']) $(id).setAttribute('aria-pressed', String(on));
    $('toggle-label').textContent = on ? 'Back to the 3D model' : 'Turn into QR code';
    $('hint').textContent = on ? 'Scan me · tap to rebuild the model' : hint;
    return world.setScan(on);
  };
  for (const id of ['see', 'toggle']) $(id).addEventListener('click', () => setScan(!world.scanning));
  // A tap (not a drag) anywhere on the scene toggles scan view.
  let down = null;
  const canvas = world.stage.renderer.domElement;
  canvas.addEventListener('pointerdown', (ev) => (down = [ev.clientX, ev.clientY]));
  canvas.addEventListener('pointerup', (ev) => {
    if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) < 6) setScan(!world.scanning);
    down = null;
  });
  if (location.hash === '#scan') world.ready.then(() => setScan(true));
}
