#!/bin/bash
# Serve the built site and the model gallery for the preview scripts:
#   /qr/...       -> docs/ (run `npm run build` first)
#   /gallery/     -> tools/dev/gallery.html
# Usage: tools/dev/serve.sh   (port 8123; run it in the background)
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${DEV_OUT:-/tmp/qr-dev}"
mkdir -p "$OUT/srv/gallery"
ln -sfn "$ROOT/docs" "$OUT/srv/qr"
ln -sfn "$ROOT/tools/dev/gallery.html" "$OUT/srv/gallery/index.html"
cd "$OUT/srv" && exec python3 -m http.server 8123
