#!/bin/bash
# Fabio's intro: extracts the user's clip (media/entrada_fabio.mp4, 30 fps) to 24 fps frames for the
# renderer (tex/fabio/c_###.jpg). A gentle grade brings its plaza toward the film's palette
# (the clip's shadows are more magenta: lift green/blue in the darks) and a light unsharp matches
# the film's crispness. The film takes over during the clip's final pan (src/pace.js, INTRO).
set -e
cd "$(dirname "$0")/.."
SRC=${1:-media/entrada_fabio.mp4}
mkdir -p tex/fabio && rm -f tex/fabio/c_*.jpg
ffmpeg -hide_banner -loglevel error -i "$SRC" -vf "fps=24:round=near,curves=g='0/0.03 0.5/0.5 1/1':b='0/0.04 0.5/0.52 1/1',unsharp=5:5:0.35:5:5:0" -q:v 2 -start_number 0 tex/fabio/c_%03d.jpg
ls tex/fabio | wc -l
