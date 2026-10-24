# QR Compass

A static site where every company's QR code is a 3D model, on a 3D map of the US.

- `docs/index.html`: a 3D map of the US (real outline, state lines, Great Lakes, Canada and Mexico around it) with hot zones where companies cluster. Each metro is a district of city blocks at its real spot, every company stands as its own 3D model, and the whole map turns into a QR code that scans to the site. ▶ plays a walkthrough of each tech city and its biggest tech company; searching a company opens its model next to its QR code. On a company page, paste any link and the model turns into a QR code for that link.
- `docs/c/<company>.html`: one page per company. Its 3D model stands on a plaza paved with its QR code; tap it and the model breaks into pixels that land on the code, giving a scannable QR that links back to the page.
- `docs/map.html`: flat 2D map of the same data. `docs/companies.html`: searchable directory.

Covers the 2019 Fortune 500 (latest list available as open data) plus a hand-picked set of US startups (the site is US-only for now). Sources and caveats are on `docs/about.html`.

## Build

```sh
npm install
npm run build                      # writes docs/
SITE_URL=https://example.com/ npm run build   # URL encoded in the QR codes and canonical links
```

Data lives in `data/`: `fortune500.json` (made by `python3 tools/prepare_f500.py` from the two CSVs) and `startups.json` (edit by hand). Page templates are in `tools/build.mjs`; browser code and styles are in `src/`.

To publish with GitHub Pages, serve the `docs/` folder. The default `SITE_URL` is `https://ghanemja.github.io/qr/`, so the QR codes point there.

## Signature models

Each company is drawn as one 3D model of what it does, and no two companies look the same: each kind has several shapes (banks get winged cash, winged gold bars, a vault, a piggy bank, a bull, a columned bank and a stagecoach), and every model is painted in the company's own two colours on one of three bases. For example: banks get a flying stack of cash with wings, telecoms a cloud raining phones and headsets, oil companies a derrick, AI labs a chat bubble with a spark, Google a magnifying glass, Meta a VR headset, and so on. The models live in `src/models.js`; which company gets which model, and the hand-picked looks for big names, are set in `data/industries.json`; the build checks that no two companies share a look. `src/qrsculpture.js` turns a model into its QR code: the model is sampled into one pixel per dark square, and each pixel flies to its square.
