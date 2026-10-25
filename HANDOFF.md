# Handoff: QR Compass 3D models

Notes for the next session working on this repo. Live site: https://ghanemja.github.io/qr/ (GitHub Pages serves `docs/` on `main`).

## Where things stand

- **59 bespoke "hero" models** are built and live, each a small animated scene showing the company's moat:
  - **The first 16, rebuilt to the current quality bar:** amazon, walmart, apple, alphabet, berkshire, spacex, cocacola, exxon, microsoft, nvidia, costco, meta, ford, tesla, disney, mcdonalds.
  - **43 added in the latest session:** jpmorgan, unitedhealth, cvs, boeing, homedepot, netflix, starbucks, visa, chevron, anthropic, openai, gm, verizon, bofa, target, ups, ibm, lilly, caterpillar, pepsico, lockheed, deere, intel, delta, nike, uber, mastercard, att, wellsfargo, goldman, pfizer, comcast, amex, pg, jnj, waymo, airbnb, salesforce, fedex, oracle, cisco, stripe, kroger.
  - Stripe was rebuilt once (as the payments layer under a street of businesses), and Airbnb and Salesforce were strengthened after the user's feedback.
- Every other company uses one of the **137 shared industry shapes**. **57 of them have been rebuilt as full scenes** (334 companies); the agreed upgrade list is finished. See **Shared-shape upgrades** below.

## The user's plan, in order

1. **Bespoke models (done for now).** The user will post on LinkedIn next. More heroes are welcome if asked. Candidates: Citigroup, Adobe, Broadcom, Qualcomm, Dell, HP, Marriott, Micron, Databricks, Anduril, Figure AI, Zipline.
2. **Upgrade the shared shapes** (done for the agreed list; see **Shared-shape upgrades** below for what's done and what's deliberately skipped).
3. **Advertisement video** of the coolest models, set to music "from Equalizer" (the user wants to advertise Equalizer too).
   - Equalizer is the user's own music-making app: https://github.com/ghanemja/equalizer (studio: https://ghanemja.github.io/equalizer/). Every sound is an equation; a song is `{ bpm, bars, tracks: [{ name, equation, params, pattern }] }`, and `examples/render.mjs` renders one headlessly to WAV (no samples, no dependencies). Ready-made tracks live in its `docs/audio/` (for example `hyperbolic-808.mp3`, `four-on-the-floor.mp3`). Plan: compose a custom ad track in Equalizer, render it, cut the video to its beat, and show an end card crediting "Soundtrack made in Equalizer" with its link.
   - **Requested finale:** stack all the models in a grid and do a camera pan, then a zoom-out over all of them.
   - **Possible approach:** a Playwright-driven headless page that renders heroes, captured frame by frame, then encoded with ffmpeg if it's available.
4. **"Access 3D asset library" button** next to **About** in the header. **Done** (see **3D asset library** below).
   - It should open a page where people can download the 3D models (for example GLB via three's `GLTFExporter`).
   - Every model file must **credit the project and authors** and **embed the open-source licence**. In GLB, use `asset.copyright` and `asset.extras`, and add a LICENSE text alongside. The repo is MIT-licensed (`LICENSE`, chosen by the user); embed that text and the copyright line.
5. **Small fixes:** tidy the Apple Watch strap; tree shadows don't sway with the leaves.

The Walmart "falling off the edge" fix (region-view lots kept fully on their piece, `tools/build.mjs`) has been merged to `main`.

## Shared-shape upgrades

### How they're built (conventions)

- **`src/scenes.js`** holds the upgraded shapes as `SCENES['kind:variant'] = () => ({ ... })`. The key is the archetype id and the variant index into `[CENTER[kind], ...EXTRA[kind]]` in `models.js`, and `_variantLabels` in `data/industries.json` names each variant. `build()` in `models.js` uses a scene when one exists for that key, otherwise the old shape.
- A scene returns **`{ slab: true, move: () => ({}), geo, moving, propAt, topAt }`**. `slab: true` means it brings its own 10.4 × 10.4 ground (`slab(color)`, top at `y0 = 0.24`), so no pedestal is added. Unlike a hero (`bare: true`), a scene still gets each company's **brand colours, companion prop and topper**, so one scene serves many companies:
  - Paint brand parts `'A'`, `'B'`, `'Ad'`, `'Bd'`. Don't pass those to `shade()`: it only takes hex colours.
  - **`propAt`**: a free spot on the slab within **±3.7** of the middle, since a prop can be about 1.5 wide.
  - **`topAt`**: no higher than **y = 4.7**, since a topper can be 2 tall and the whole model must stay under 6.8.
- **Rest bounds decide the framing.** Static geometry, plus every mover at its pivot with no animation applied, must stay within ±5.2 in x and z and ≤ 6.8 in height. If not, the model shrinks and big L-shaped QR corner squares show. Thin coloured strips at the slab's corners are normal; heroes show them too. Build an arm or boom in the pose it rests in, and pre-rotate it if its animation swings it away.
- **Camera:** the company page **orbits**, and it looks down from the front right (+x, +z). Keep tall things (towers, clouds, stacks) at the back or left. Anything tall at the front right projects onto the middle and hides the action. Avoid opaque "light beam" cones: use pools of light on the ground instead.
- **Reuse:** `heroes.js` exports its set dressing (`rbox`, `curve`, `tubeOn`, `along`, `miniTree`, `lampPost`, `sedan`, `cartGeo`, `walker`, `parcel`, `puff`, `flameGeo`). `scenes.js` adds more shared helpers at the top:
  - Buildings: `home`, `house2`, `frame`/`truss`, `bin`, `labWalls`, `racking`, `pylon`.
  - Vehicles and machines: `van`, `trawler`, `drone`, `humanoid`.
  - Produce and parts: `wheat`, `tyre`, `gear`, `coin`, `bottle`, `bubbleGeo`, `tubeGeo`, `medBox`.
  - People and props: `fan`, `bed`, `parasol`, `lifebuoy`.
  - Symbols and weather: `heartGeo`, `shieldGeo`, `anchorGeo`, `jigsaw`, `stethoscope`, `cardGeo`, `tickGeo`, `stormCloud`, `bolt`.
  - Mechanics: `reach2`, two-link arm inverse kinematics; see `industrial:0` or `robot:0` for a full arm.
  - Added with the second batch of scenes:
    - Plant and vehicles: `column` (refinery/process column), `tankTruck`, `semi` (tractor-trailer), `jet` (airliner), `fighter`, `heliGeo` + `rotorGeo`, `rocketGeo`, `radarDish`.
    - Tech: `wafer`, `chipGeo`, `serverRack`, `desk` (desk, chair and laptop), `appBlock`, `whiteboard`.
    - Small symbols and props: `vial`, `molecule`, `helixGeo`, `crossGeo` (red cross-out), `bugGeo`, `padBody` + `padShackle`.
  - Gotchas found on the way: shape helpers that return bare geometry (`heartGeo`, `extrude`, `star`, `jigsaw`, `gear`) must be wrapped in `part(..., colour)` before `merge`, or the page crashes in `vertexColor`; a brand band whose top face sits exactly on a roof or plinth top z-fights (sunk it a little); rest bounds use unscaled mover geometry, so pre-scale big movers' `geo` instead of animating `s`.
  - The user asked that smaller shapes **mix and match these pieces** rather than start from scratch.
- **Dev tools additions:**
  - `node tools/dev/vc.mjs kind:variant` prints vertex counts and the **rest bounds**, plus the prop and topper spots.
  - `gal.cjs` takes `id:variant`, plus an optional 7th argument `prop.topper` (for example `3.2`) that draws a prop and topper.
  - Check a real page with `still.cjs <slug>`; it's a different angle from the gallery.
- **Workflow for a scene:** write it at the end of `SCENES`. Then run `npm run build`, `vc.mjs kind:variant` (fix the bounds), `gal.cjs` at a few times, and `still.cjs` on one of its companies. Look at the images, then `ship.sh`.

### Done (57 scenes, 334 companies; all live on `main`)

- **First batch (23):** `bank:10` Coin tower · `house:0` Neighborhood · `farm:0` Harvest · `industrial:0` Machine shop · `metal:0` Steelworks · `oil:2` Storage tank · `car:6` Engine · `insurance:0` Rainy-day umbrella · `insurance:1` Shield · `media:0` Showtime · `robot:0` Robot lab · `care:0` Bubbles · `insurance:2` Lifebuoy · `insurance:3` Hourglass · `insurance:5` Anchor · `health:7` Microscope · `chem:0` Lab · `health:1` Heartbeat · `power:2` Light bulb · `software:6` Puzzle pieces · `industrial:3` Excavator · `health:4` Stethoscope · `health:9` Medical supplies
- **Second batch (the agreed queue of 34, 161 companies):** `oil:4` Refinery · `bank:11` Ticker board · `rocket:0` Launch pad · `health:3` Hospital · `health:5` Syringe · `insurance:4` Padlock · `chip:0` Silicon · `software:3` Terminal · `computer:0` Laptop · `ai:5` Bright idea · `plane:0` Control tower · `plane:1` Airliner · `software:2` App blocks · `rocket:1` Fighter jet · `chip:1` Graphics card · `bank:9` Briefcase · `power:0` Wind turbine · `chip:2` Memory · `parcel:0` Parcels on the move · `power:5` Plug and socket · `power:1` Power lines · `bank:8` Rising chart · `power:3` Solar farm · `oil:5` Tanker · `payments:3` Crypto coin · `industrial:5` Garbage truck · `parcel:1` Delivery van · `industrial:4` Paint · `parcel:2` Parcel with wings · `industrial:1` Tower crane · `software:4` Dashboard · `industrial:2` Hard hat · `industrial:6` Packaging line · `software:5` Email

No more shared shapes are queued. Further upgrades only if the user asks (see the next list for what was deliberately left).

### Deliberately NOT upgraded (they keep their current models)

- **5 shapes in the 4–6-company tier (24 companies):**
  - `health:6` DNA: Amgen, Gilead, Regeneron, Biogen, Solventum
  - `oil:0` Oil derrick: Halliburton, Baker Hughes, Venture Global, APA, NOV
  - `oil:1` Pumpjack: ConocoPhillips, Occidental, EOG, Devon, Continental
  - `oil:3` Gas pump: World Kinect, Murphy USA, Diamondback, Delek, Coterra
  - `power:4` Cooling towers: NRG, Exelon, Dominion, Entergy
  - The user may still add Amgen, Gilead, Regeneron, Halliburton or ConocoPhillips; ask before doing so.
- **Every shape used by only 1–3 companies.** Instead, well-known companies on those shapes are **candidates for their own bespoke hero** (don't build them until the user picks):
  - Banks and finance: Citigroup, Morgan Stanley, Capital One, U.S. Bancorp, KKR, Apollo, Fiserv, Moody's, Nasdaq, Intercontinental Exchange.
  - Payments: PayPal, Block.
  - Tech and hardware: Dell, HP, Super Micro, Adobe, Intuit, Workday, Motorola Solutions, Charter.
  - Retail: Lowe's, Best Buy, TJX, Macy's, Gap, Lululemon, Ulta, Dollar General, Dollar Tree, AutoZone, O'Reilly.
  - Groceries and food service: Publix, Albertsons, Sysco.
  - Food, drink and restaurants: Tyson, Kraft Heinz, General Mills, Mondelēz, Hershey, Keurig Dr Pepper, Monster, Chipotle, DoorDash.
  - Health: Abbott.
  - Travel and casinos: Marriott, Southwest, Las Vegas Sands, MGM, Caesars.
  - Cars and vehicles: Carvana, CarMax, Hertz, Goodyear, Paccar.
  - Defence and space: Northrop Grumman.
  - Materials and mining: International Paper, Newmont.
  - Startups: Databricks, Perplexity, Neuralink, Scale AI, Hugging Face, Runway, Discord, Plaid, Ramp, Nuro.

Next: item 3 (the ad video).

## 3D asset library (`docs/library.html`)

- Built by `libraryPage()` in `tools/build.mjs` from every model id: the 60 signature models plus all 137 shared shapes (`kind:variant`), with labels from `data/industries.json` and the companies that use each look. The browser code is `src/library.js`.
- Export happens in the browser with three's `GLTFExporter` (copied with its `TextureUtils.js` helper into `docs/assets/` by the build). `buildModel()` in `models.js` builds a model uncached; the library bakes brand slots into vertex colours, turns `'W'` water into a plain glossy "Water" material, merges vertices, and poses movers at t = 0 (parts hidden at t = 0 are left out). "Include its animation" samples the movers into a 12 s clip.
- Every GLB gets `asset.copyright` ("© 2026 Janelle Ghanem — QR Compass, MIT License") and `asset.extras` { title, project, url, page, author, license, copyright, licenseText }; the same credit is the scene's extras. The .zip download (a tiny stored-zip writer, no dependency) adds `LICENSE.txt` and `README.txt`. `window.QRLibrary.exportGLB('amazon:0')` exports without a download (for tests).
- Licence: `LICENSE` is copied to `docs/LICENSE` and `docs/LICENSE.txt`; the footer (`footer()` in the build), the About page and company pages credit it. Project source files carry an `SPDX-License-Identifier: MIT` header; vendored three.js files (`BufferGeometryUtils.js`, `RoundedBoxGeometry.js`, etc.) keep their own.

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
| `tools/dev/serve.sh &` | Serves `docs/` at `http://localhost:8123/qr/` and the gallery at `/gallery/`. Run `npm run build` first. `PORT=8137 DEV_OUT=/tmp/x tools/dev/serve.sh` runs a second copy (smoke/still/gal also read `PORT`). |
| `node tools/dev/vc.mjs <id or kind:variant>` | Prints vertex counts at high and low detail, and the rest bounds (keep x/z within ±5.2, height ≤ 6.8). |
| `node tools/dev/still.cjs <slug> <out> 1300 1100` | Screenshots a company page to `/tmp/qr-dev/<out>.png`. |
| `node tools/dev/gal.cjs "<id,id:variant>" <out> <cols> "<t1,t2>" 500` | Renders a hero or a shape variant at the given animation times. An optional 7th argument `prop.topper` (e.g. `3.2`) also draws a prop and topper. |
| `node tools/dev/smoke.cjs` | Loads 6 pages (including the library) and reports errors and 404s. |
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
