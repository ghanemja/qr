#!/bin/bash
# SPDX-License-Identifier: MIT · Copyright (c) 2026 Janelle Ghanem
# Encodes a cut's frames with its soundtrack, and hits the drop on screen: a white flash that
# fades in 0.4 s and a 5% zoom punch that settles over half a second.
#   tools/video/encode.sh <frames dir> <song.wav> <out.mp4> <drop seconds>
set -e
FRAMES=$1 WAV=$2 OUT=$3 D=$4
IFS=x read W H < <(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0:s=x "$FRAMES/f00000.jpg")
Z="1+0.05*exp(-(t-$D)*7)*gte(t\,$D)"
ffmpeg -loglevel error -y -framerate 30 -i "$FRAMES/f%05d.jpg" -i "$WAV" -f lavfi -i "color=white:s=${W}x${H}:r=30" -filter_complex "
  [0:v]scale=w='trunc($W*($Z)/2)*2':h='trunc($H*($Z)/2)*2':eval=frame,crop=$W:$H[z];
  [2:v]format=rgba,fade=t=out:st=$D:d=0.4:alpha=1[w];
  [z][w]overlay=enable='between(t,$D,$D+0.4)':shortest=1,format=yuv420p[v]" \
  -map '[v]' -map 1:a -c:v libx264 -preset slow -crf 20 -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
