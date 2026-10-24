// QR drawing shared by the map and the company pages (needs qrcode-generator).
window.QRCard = (() => {
  const initials = (name) => name.replace(/\(.*?\)/g, '').split(/[\s&.-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  function matrix(text) {
    const qr = qrcode(0, 'Q');
    qr.addData(text);
    qr.make();
    return qr;
  }

  // Draws the QR into ctx at (x, y) with side `size`, quiet zone included, plus a centred monogram.
  function paint(ctx, text, name, x, y, size) {
    const qr = matrix(text);
    const n = qr.getModuleCount();
    const quiet = 3;
    const cell = size / (n + quiet * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#0e1726';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(x + (c + quiet) * cell, y + (r + quiet) * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
    // Monogram badge: about 3% of the symbol area, well inside level-Q error correction.
    const b = Math.round(cell * Math.max(5, Math.round(n * 0.18)));
    const bx = x + (size - b) / 2, by = y + (size - b) / 2, rad = b * 0.22;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, bx - cell * 0.6, by - cell * 0.6, b + cell * 1.2, b + cell * 1.2, rad + cell * 0.6);
    ctx.fill();
    ctx.fillStyle = '#2f6bff';
    roundRect(ctx, bx, by, b, b, rad);
    ctx.fill();
    const label = initials(name) || '•';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(b * (label.length > 1 ? 0.42 : 0.55))}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + size / 2, y + size / 2 + b * 0.03);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(canvas, text, name) {
    const css = canvas.getAttribute('width') | 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = canvas.height = Math.round(css * dpr);
    canvas.style.width = canvas.style.height = css + 'px';
    paint(canvas.getContext('2d'), text, name, 0, 0, canvas.width);
  }

  // A printable card: QR, company name and the link underneath.
  function download(text, name, filename) {
    const w = 1080, h = 1320, pad = 90;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    paint(ctx, text, name, pad, pad, w - pad * 2);
    ctx.fillStyle = '#0e1726';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    let size = 64;
    ctx.font = `700 ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    while (ctx.measureText(name).width > w - pad * 2 && size > 30) ctx.font = `700 ${(size -= 2)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(name, w / 2, w + 30);
    ctx.fillStyle = '#5b6778';
    ctx.font = '400 30px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(text.replace(/^https?:\/\//, ''), w / 2, w + 100, w - pad * 2);
    ctx.fillStyle = '#2f6bff';
    ctx.font = '600 26px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('QR COMPASS', w / 2, h - 60);
    c.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  }

  // Absolute URL for a site-relative path; falls back to the canonical site when opened from disk.
  function siteUrl(rel) {
    const canonical = document.querySelector('link[rel=canonical]');
    // The canonical URL is this page's published address, so it resolves `rel` the same way.
    if (location.protocol === 'file:' && canonical) return new URL(rel, canonical.href).href;
    return new URL(rel, location.href).href.replace(/#.*$/, '');
  }

  async function copy(text, button) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    if (button) {
      const was = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => (button.textContent = was), 1400);
    }
  }

  return { draw, download, siteUrl, copy };
})();
