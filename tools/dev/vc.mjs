const m = await import(new URL('../../src/models.js', import.meta.url).href);
const id = process.argv[2];
for (const d of ['high', 'low']) { const c = m.centerpiece(id, 0, 0, d); let v = c.geo.attributes.position.count; const mv = c.moving.map((x) => x.geo ? x.geo.attributes.position.count : 0); console.log(d, 'static', v, 'moving', mv.reduce((a, b) => a + b, 0), mv.join(',')); }
