(() => {
  const { slug, name } = window.COMPANY;
  const url = QRCard.siteUrl(`${slug}.html`);
  document.getElementById('qr-url').textContent = url.replace(/^https?:\/\//, '');
  QRCard.draw(document.getElementById('qr'), url, name);
  const copy = document.getElementById('copy');
  copy.addEventListener('click', () => QRCard.copy(url, copy));
  document.getElementById('dl').addEventListener('click', () => QRCard.download(url, name, `${slug}-qr.png`));
  const share = document.getElementById('share');
  if (navigator.share) {
    share.hidden = false;
    share.addEventListener('click', () => navigator.share({ title: name, url }).catch(() => {}));
  }
  for (const input of document.querySelectorAll('.cite input')) input.addEventListener('focus', () => input.select());
})();
