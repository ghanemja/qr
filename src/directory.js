(() => {
  const rows = [...document.querySelectorAll('.dir tbody tr')];
  const input = document.getElementById('filter');
  const buttons = [...document.querySelectorAll('.filters button')];
  let mode = 'all';
  const match = (tr) => mode === 'all' || (mode === 'tech' ? tr.dataset.t === '1' : tr.dataset.k === mode);
  function update() {
    const q = input.value.trim().toLowerCase();
    for (const tr of rows) tr.hidden = !(match(tr) && (!q || tr.dataset.q.includes(q)));
  }
  input.addEventListener('input', update);
  for (const b of buttons) {
    b.addEventListener('click', () => {
      mode = b.dataset.f;
      for (const o of buttons) o.setAttribute('aria-pressed', String(o === b));
      update();
    });
  }
  const q = new URLSearchParams(location.search).get('q');
  if (q) input.value = q;
  update();
})();
