#!/bin/bash
# v10 (A Travessia): the opening plate. Frames of the four clips (media/v10_*.mp4, 30 fps), the viewer's
# hand painted out of R23 (Fabio presses Publicar Skill himself: tools/hand10.py), the plate as one
# continuous shot with its slow window and light transitions (tools/plate10.py), and the stage's camera
# tracks for the graphics that live in it (tools/track10.py). Needs opencv-python-headless and numpy.
set -e
cd "$(dirname "$0")/.."
for k in r16:v10_r16_porta r21:v10_r21_transporte r22:v10_r22_caminhada r23:v10_r23_biblioteca; do
  id=${k%%:*}; f=${k#*:}; mkdir -p clips10/$id
  [ -f clips10/$id/f_001.jpg ] || ffmpeg -loglevel error -i media/$f.mp4 -q:v 2 clips10/$id/f_%03d.jpg
done
mkdir -p clips10/r23_orig
for i in $(seq 320 366); do [ -f clips10/r23_orig/f_$i.jpg ] || cp clips10/r23/f_$i.jpg clips10/r23_orig/; done
python3 tools/hand10.py
python3 tools/plate10.py
python3 tools/track10.py
