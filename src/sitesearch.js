// Site-wide company search: every [data-sitesearch] box (an input and a results list) jumps to
// the chosen company's page. The index (assets/search.json, written by tools/build.mjs) loads on
// first use, so pages that never search never fetch it.
(() => {
  const base = document.currentScript.src;
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  let index = null;
  const load = () => index || (index = fetch(new URL('search.json', base))
    .then((r) => r.json())
    // Rows: [slug, name, place, kind (0 Fortune 500, 1 startup), tech, rank, listed name]
    .then((rows) => rows.map(([s, n, c, k, t, r, ln]) => ({ s, n, c, k, t, r, nn: norm(n), nln: norm(ln || ''), nc: norm(c) }))));

  function search(list, text) {
    const t = norm(text.trim());
    if (!t) return [];
    const out = [];
    for (const e of list) {
      let score = null;
      if (e.nn.startsWith(t)) score = 0;
      else if (e.nn.split(/[\s(-]+/).some((w) => w.startsWith(t))) score = 1;
      else if (e.nn.includes(t) || e.nln.includes(t)) score = 2;
      else if (e.nc.includes(t)) score = 3;
      if (score !== null) out.push({ e, score: score + (e.k === 0 ? e.r / 1000 : 0.6) });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, 8).map((h) => h.e);
  }

  document.querySelectorAll('[data-sitesearch]').forEach((box, n) => {
    const q = box.querySelector('input'), results = box.querySelector('ul');
    let hits = [], active = -1, seq = 0;
    function render() {
      results.innerHTML = hits.map((e, i) => `<li role="option" id="ss${n}-${i}" aria-selected="${i === active}" data-i="${i}"><span class="dot-i ${e.k ? 'startup' : 'f500'}${e.t ? ' tech' : ''}"></span><span class="r-name">${esc(e.n)}</span><span class="r-meta">${e.k ? 'Startup' : '#' + e.r} · ${esc(e.c)}</span></li>`).join('');
      results.hidden = !hits.length;
      q.setAttribute('aria-expanded', String(!!hits.length));
      q.setAttribute('aria-activedescendant', active >= 0 ? `ss${n}-${active}` : '');
    }
    async function update() {
      const id = ++seq;
      const list = await load().catch(() => []);
      if (id !== seq) return;
      hits = search(list, q.value);
      active = hits.length ? 0 : -1;
      render();
    }
    function choose(i) {
      const e = hits[i];
      if (e) location.href = new URL(`../c/${e.s}.html`, base).href;
    }
    q.addEventListener('focus', () => { load(); if (q.value) update(); });
    q.addEventListener('input', update);
    q.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { active = Math.min(hits.length - 1, active + 1); render(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { active = Math.max(0, active - 1); render(); ev.preventDefault(); }
      else if (ev.key === 'Enter') { choose(Math.max(0, active)); ev.preventDefault(); }
      else if (ev.key === 'Escape') { hits = []; render(); q.blur(); }
    });
    q.addEventListener('blur', () => setTimeout(() => { results.hidden = true; q.setAttribute('aria-expanded', 'false'); }, 150));
    results.addEventListener('mousedown', (ev) => {
      const li = ev.target.closest('li[data-i]');
      if (li) { ev.preventDefault(); choose(+li.dataset.i); }
    });
  });
})();
