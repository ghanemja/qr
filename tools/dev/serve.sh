#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Janelle Ghanem. QR Compass, https://ghanemja.github.io/qr/
# Serve the built site and the model gallery for the preview scripts:
#   /qr/...       -> docs/ (run `npm run build` first)
#   /gallery/     -> tools/dev/gallery.html
# Usage: tools/dev/serve.sh   (port $PORT, default 8123; run it in the background)
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${DEV_OUT:-/tmp/qr-dev}"
mkdir -p "$OUT/srv/gallery"
ln -sfn "$ROOT/docs" "$OUT/srv/qr"
ln -sfn "$ROOT/tools/dev/gallery.html" "$OUT/srv/gallery/index.html"
cd "$OUT/srv" && exec python3 -m http.server "${PORT:-8123}"
