# QR Atlas

A static site where every company's QR code is a 3D world.

- `docs/index.html`: one large QR code (it scans to the site) with the US or world map laid across its tiles and every company standing at its headquarters. It has a guided fly-through tour, company search, a USA/World switch and a scan view.
- `docs/c/<company>.html`: one page per company. Its QR code grows into a tree (spring, summer, autumn) or a city; tap it to settle into a scannable QR that links back to the page.
- `docs/map.html`: flat 2D map of the same data. `docs/companies.html`: searchable directory.

Covers the 2019 Fortune 500 (latest list available as open data) plus a hand-picked set of startups. Sources and caveats are on `docs/about.html`.

## Build

```sh
npm install
npm run build                      # writes docs/
SITE_URL=https://example.com/ npm run build   # URL encoded in the QR codes and canonical links
```

Data lives in `data/`: `fortune500.json` (made by `python3 tools/prepare_f500.py` from the two CSVs) and `startups.json` (edit by hand). Page templates are in `tools/build.mjs`; browser code and styles are in `src/`.

To publish with GitHub Pages, serve the `docs/` folder. The default `SITE_URL` is `https://ghanemja.github.io/qr/`, so the QR codes point there.

## Signature models

Each company is drawn as a 3D model of what it does: banks get a vault in a swirl of flying bills, telecoms a cloud raining phones and headsets, oil companies a derrick with barrels, AI labs a glowing orb, and so on. The models live in `src/models.js`; which company gets which model is set in `data/industries.json`. The small pieces float above the QR code's dark squares, so the scene still flattens into a scannable code.
