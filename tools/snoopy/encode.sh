#!/usr/bin/env bash
# SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
# encode.sh <frames dir> <soundtrack.wav> <out.mp4>: 1080×1920, 30 fps, H.264 + AAC, ready for Reels/TikTok.
set -euo pipefail
ffmpeg -y -v error -framerate 30 -i "$1/f%05d.png" -i "$2" -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -c:a aac -b:a 192k -shortest "$3"
