#!/usr/bin/env bash
# SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
# encode.sh <frames dir> <out.mp4> [audio source]: 1080×1920, 30 fps, H.264 (+ AAC).
# The audio source is the screen recording of the original reel: its first 9.6 s carry the song,
# with the silence (1.9–4 s), the drop (4.3 s) and the gap (8.6 s) the animation is timed to.
# Without one the video is silent, ready for the trending sound to be added in the app.
set -euo pipefail
if [ $# -ge 3 ]; then
  ffmpeg -y -v error -framerate 30 -i "$1/f%05d.png" -t 9.6 -i "$3" -map 0:v -map 1:a \
    -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -profile:v high -movflags +faststart \
    -af "afade=t=in:d=0.03,afade=t=out:st=9.4:d=0.2" -c:a aac -b:a 192k -shortest "$2"
else
  ffmpeg -y -v error -framerate 30 -i "$1/f%05d.png" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -profile:v high -movflags +faststart "$2"
fi
