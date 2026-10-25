# QR Compass

A static site where every company's QR code is a 3D model, on a 3D map of the US.

- `docs/index.html`: a 3D cartoon map of the US on a square tiled slab with a lawn around the rim, split into seven regions (Northwest, West, Southwest, Midwest, Southeast, Mid-Atlantic, Northeast). Each region's biggest companies stand on it as their own 3D models near their real cities. Hover a region and its models move in that region's style (sway, float, hop, wave, swing, rush, twirl); click it and the piece breaks off the map and opens as a moving world with every company on its own lot, traffic, clouds and water, plus a card where the company's model turns into its scannable QR code. ▶ tours the regions; search jumps to any company. On a company page, paste any link and the model turns into a QR code for that link.
- `docs/c/<company>.html`: one page per company. Its 3D model stands on a plaza paved with its QR code; tap it and the model breaks into pixels that land on the code, giving a scannable QR that links back to the page.
- `docs/map.html`: flat 2D map of the same data. `docs/companies.html`: searchable directory.
- `docs/library.html`: the 3D asset library. Every model on the site (the signature models and the shared shapes) can be previewed and downloaded as a GLB, exported in the browser with three.js's `GLTFExporter` (`src/library.js`). Each file embeds the credit and the licence in `asset.copyright` and `asset.extras`; the .zip download adds `LICENSE.txt`.

Covers the 2019 Fortune 500 (latest list available as open data) plus a hand-picked set of US startups (the site is US-only for now). Sources and caveats are on `docs/about.html`.

## Build

```sh
npm install
npm run build                      # writes docs/
SITE_URL=https://example.com/ npm run build   # URL encoded in the QR codes and canonical links
GOATCOUNTER=mysite npm run build   # analytics site (default ghanemja; empty turns it off)
```

Data lives in `data/`: `fortune500.json` (made by `python3 tools/prepare_f500.py` from the two CSVs) and `startups.json` (edit by hand). Page templates are in `tools/build.mjs`; browser code and styles are in `src/`.

To publish with GitHub Pages, serve the `docs/` folder. The default `SITE_URL` is `https://ghanemja.github.io/qr/`, so the QR codes point there.

## Signature models

Each company is drawn as one 3D model of what it does, and no two companies look the same: each kind has several shapes (banks get winged cash, winged gold bars, a vault, a piggy bank, a bull, a columned bank and a stagecoach), and every model is painted in the company's own two colours on one of three bases. For example: banks get a flying stack of cash with wings, telecoms a cloud raining phones and headsets, oil companies a derrick, AI labs a chat bubble with a spark, Google a magnifying glass, Meta a VR headset, and so on. The models live in `src/models.js`; which company gets which model, and the hand-picked looks for big names, are set in `data/industries.json`; the build checks that no two companies share a look. `src/qrsculpture.js` turns a model into its QR code: the model is sampled into one pixel per dark square, and each pixel flies to its square.

## Licence

MIT, © 2026 Janelle Ghanem. See [`LICENSE`](LICENSE); the built site serves it at `docs/LICENSE.txt`. That covers the code and the 3D models, including the GLB files from the asset library: keep the copyright notice and licence with them when you share or reuse them. Vendored third-party files (three.js and its add-ons, qrcode-generator) keep their own licences, and company names belong to their owners.
