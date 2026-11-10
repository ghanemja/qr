// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Janelle Ghanem. QR Compass, https://ghanemja.github.io/qr/
const m = await import(new URL('../../src/models.js', import.meta.url).href);
const [id, vi = 0] = process.argv[2].split(':');
for (const d of ['high', 'low']) { const c = m.centerpiece(id, +vi, 0, d); let v = c.geo.attributes.position.count; const mv = c.moving.map((x) => x.geo ? x.geo.attributes.position.count : 0); console.log(d, 'static', v, 'moving', mv.reduce((a, b) => a + b, 0), mv.join(',')); }
// Bounds at rest (static + movers at their pivots, high detail): keep x/z within ±5.2 and y ≤ 6.8.
{
  const { THREE } = await import(new URL('../../src/kit.js', import.meta.url).href);
  const c = m.centerpiece(id, +vi, 0, 'high'), bb = new THREE.Box3().setFromBufferAttribute(c.geo.attributes.position), rest = m.restMatrices(c);
  c.moving.forEach((mv, i) => mv.geo && bb.union(new THREE.Box3().setFromBufferAttribute(mv.geo.attributes.position).applyMatrix4(rest[i])));
  const f = (v) => v.toArray().map((x) => x.toFixed(3)).join(', ');
  console.log('bounds', f(bb.min), '→', f(bb.max), c.propAt ? `prop at ${c.propAt}` : '', c.topAt ? `top at ${c.topAt.map((x) => x.toFixed(2))}` : '');
}
