#!/usr/bin/env bash
# SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
# Turns render.cjs's VIDEO frames into the posted files:
#   slide-NN.mp4  each slide as a 4 s looping video (Instagram carousels take video slides)
#   slide-NN.jpg  each slide's first frame; they step through the motion, so scrubbing the dots plays it
#   swipe-preview.mp4  the first STEP frames of every slide in a row (one unbroken shot), then slide 10
# usage: tools/carousel/encode.sh <frames dir> <out dir> [STEP=12]
set -euo pipefail
src=$1 out=$(realpath -m "$2") step=${3:-12}
mkdir -p "$out"
list=$(mktemp)
for d in "$src"/s*/; do
  n=$(basename "$d" | tr -d s)
  ffmpeg -v error -y -framerate 30 -i "$d/f%04d.jpg" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "$out/slide-$n.mp4"
  ffmpeg -v error -y -i "$d/f0000.jpg" -q:v 2 "$out/slide-$n.jpg"
  if [ "$n" = 10 ]; then frames=120; else frames=$step; fi
  ffmpeg -v error -y -framerate 30 -i "$d/f%04d.jpg" -frames:v "$frames" -c:v libx264 -crf 18 -pix_fmt yuv420p "$out/.part-$n.mp4"
  echo "file '$out/.part-$n.mp4'" >> "$list"
done
ffmpeg -v error -y -f concat -safe 0 -i "$list" -c copy -movflags +faststart "$out/swipe-preview.mp4"
rm -f "$out"/.part-*.mp4 "$list"
ffmpeg -v error -y -i "$out/slide-%02d.jpg" -vf "scale=360:-1,tile=5x2:padding=8:color=white" -frames:v 1 "$out/contact-sheet.jpg"
