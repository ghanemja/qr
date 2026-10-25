# Handoff: QR Compass 3D models

Notes for the next session working on this repo. Live site: https://ghanemja.github.io/qr/ (GitHub Pages serves `docs/` on `main`).

## Where things stand

- **59 bespoke "hero" models** are built and live, each a small animated scene showing the company's moat:
  - **The first 16, rebuilt to the current quality bar:** amazon, walmart, apple, alphabet, berkshire, spacex, cocacola, exxon, microsoft, nvidia, costco, meta, ford, tesla, disney, mcdonalds.
  - **43 added in the latest session:** jpmorgan, unitedhealth, cvs, boeing, homedepot, netflix, starbucks, visa, chevron, anthropic, openai, gm, verizon, bofa, target, ups, ibm, lilly, caterpillar, pepsico, lockheed, deere, intel, delta, nike, uber, mastercard, att, wellsfargo, goldman, pfizer, comcast, amex, pg, jnj, waymo, airbnb, salesforce, fedex, oracle, cisco, stripe, kroger.
  - Stripe was rebuilt once (as the payments layer under a street of businesses), and Airbnb and Salesforce were strengthened after the user's feedback.
- Every other company still uses one of the **137 shared industry shapes**. Most of those are at the old, simpler standard; only the generic tree has been rebuilt.

## The user's plan, in order

1. **Bespoke models (done for now).** The user will post on LinkedIn next. More heroes are welcome if asked. Candidates: Citigroup, Adobe, Broadcom, Qualcomm, Dell, HP, Marriott, Micron, Databricks, Anduril, Figure AI, Zipline.
2. **Upgrade the 137 shared shapes** to the same standard. Start with the shapes that cover the most companies, since they change the most of the map.
3. **Advertisement video** of the coolest models, set to music "from Equalizer" (the user wants to advertise Equalizer too).
   - Equalizer is the user's own music-making app: https://github.com/ghanemja/equalizer (studio: https://ghanemja.github.io/equalizer/). Every sound is an equation; a song is `{ bpm, bars, tracks: [{ name, equation, params, pattern }] }`, and `examples/render.mjs` renders one headlessly to WAV (no samples, no dependencies). Ready-made tracks live in its `docs/audio/` (for example `hyperbolic-808.mp3`, `four-on-the-floor.mp3`). Plan: compose a custom ad track in Equalizer, render it, cut the video to its beat, and show an end card crediting "Soundtrack made in Equalizer" with its link.
   - **Requested finale:** stack all the models in a grid and do a camera pan, then a zoom-out over all of them.
   - **Possible approach:** a Playwright-driven headless page that renders heroes, captured frame by frame, then encoded with ffmpeg if it's available.
4. **"Access 3D asset library" button** next to **About** in the header.
   - It should open a page where people can download the 3D models (for example GLB via three's `GLTFExporter`).
   - Every model file must **credit the project and authors** and **embed the open-source licence**. In GLB, use `asset.copyright` and `asset.extras`, and add a LICENSE text alongside. The repo is MIT-licensed (`LICENSE`, chosen by the user); embed that text and the copyright line.
5. **Small fixes:** tidy the Apple Watch strap; tree shadows don't sway with the leaves.

The Walmart "falling off the edge" fix (region-view lots kept fully on their piece, `tools/build.mjs`) has been merged to `main`.

## How the models work

- **`src/kit.js`** is the shared geometry kit. It provides `part(geo, color, {p,r,s,q})` for coloured, positioned geometry, plus `merge`, `place`, `box`, `cyl`, `lathe`, `tube`, `ball`, `capsule`, `cone`, `torus`, `extrude`, `prism`, `star`, `beam`, `ring`, `windy`, `tuft` and `leafShape`.
  - Easing and timing helpers: `cyc`, `win`, `easeIn`, `easeOut`, `easeIO`, `back`, `bump`, `hop`.
  - Detail: `hi()` is true on the company page and card (high detail) and false on the map (low detail). At low detail, boxes, cylinders and spheres become cheap.
  - The colour `'W'` paints animated water, using the same shader as the map.
- **`src/heroes.js`** holds `HEROES = { id: { finder, build } }`. `build()` returns `{ bare: true, move: () => ({}), geo, moving }`.
  - `moving` is a list of `{ geo, pivot:[x,y,z], parent?, anim(t) → {x,y,z,rx,ry,rz,q,s,sx,sy,sz} }`.
  - A part whose scale is 0.001 or less is hidden. `parent` is the index of another mover in the list.
  - Shared helpers at the top of the file: `rbox`, `curve`, `tubeOn`, `along(curve,u)` (returns position plus yaw for a part whose nose points along +x), `miniTree`, `lampPost`, `sedan` (a curved car), `cartGeo` and `walker(baseIndex, path, opts)`.
  - `walker` returns 5 movers, and **`baseIndex` must equal `moving.length` at the moment you push them.**
- **`src/models.js`** has the archetypes (`CENTER`/`EXTRA`), the motion engine and `modelMaterial`. Heroes are registered there automatically.
- **`data/industries.json`** maps model id to company keys. Company keys are the `key` field in `data/fortune500.json`, or the startup name from `data/startups.json`. `_labels[id]` is the caption shown under the model.
- **Conventions that keep scenes framed and fast:**
  - **Board:** the ground is `rbox(10.4, 0.24, 10.4)` and the ground top is `y0 = 0.24`. Keep everything inside ±5.2 in x and z, or the whole model shrinks and the QR finder squares show.
  - **Height:** keep the rest height (pivots plus static geometry) at **6.8 or below**, for the same reason. Moving parts can fly higher in mid-animation.
  - **Camera:** it looks from +x, +z (front-right). Things at the back corner (−x, −z) get hidden behind tall centrepieces. Faces you want seen should point toward (+x, +z), for example with `r: [0, Math.PI/4, 0]`.
  - **Vertex budget:** keep the map (low detail) under about 45k vertices per hero. On the page (high detail), aim for about 300k or less; repeated `ball()` at high detail costs 3.6k vertices each, so use `new THREE.SphereGeometry(r, 8, 6)` for small repeated bits.
  - **Faces and normals:** `LatheGeometry` points must run bottom to top, otherwise the faces are inside-out. For a crisp, faceted look, delete the `normal` attribute before passing the geometry to `part`.

## Dev tools (`tools/dev/`)

The software renderer in a cloud container is slow (about 1.5 fps), so timed frames come from the gallery rather than from the live page.

| Command | What it does |
|---|---|
| `tools/dev/serve.sh &` | Serves `docs/` at `http://localhost:8123/qr/` and the gallery at `/gallery/`. Run `npm run build` first. |
| `node tools/dev/vc.mjs <id>` | Prints vertex counts at high and low detail. |
| `node tools/dev/still.cjs <slug> <out> 1300 1100` | Screenshots a company page to `/tmp/qr-dev/<out>.png`. |
| `node tools/dev/gal.cjs "<id,id>" <out> <cols> "<t1,t2>" 500` | Renders a hero at the given animation times. |
| `node tools/dev/smoke.cjs` | Loads 5 pages and reports errors and 404s. |
| `python3 tools/dev/addhero.py <id> "<label>" "<Company key>"` | Assigns a company to a new hero (removes it from its old group). |
| `tools/dev/ship.sh "<message>"` | Smoke test, commit, rebase onto `origin/main`, rebuild `docs`, push. |

- Other sessions also push to `main`, so always rebase before pushing; `ship.sh` does this.
- Commit messages should end with the attribution trailer the session's system prompt asks for. Never put a model name in commits.
- **Workflow for a new hero:**
  1. Write the `build()` for it.
  2. Append it to `HEROES` (just before the final `};` in `src/heroes.js`).
  3. Run `addhero.py`.
  4. `npm run build`.
  5. `vc.mjs`, then `still.cjs` and `gal.cjs`. Look at the images and fix anything off.
  6. `ship.sh`.

## User preferences learned

- **Quality:** they want high-quality, curved, detailed models with clever, *legible* animations that show **why the company wins**. Literal or abstract-but-confusing ideas get pushback (the first Stripe "didn't make sense"; Airbnb and Salesforce needed to be "stronger").
- **Water:** any water must look like the map's water: smooth flowing movement and clarity. Use `'W'`.
- **Reference images:** an image they share may be a quality reference only, not a request to copy it (they showed a tree for quality and didn't want a tree).
- **Process:** keep going without asking; ship each model as it's done; give short progress notes.
