#!/bin/bash
# v8 (O Fio Dourado): Fabio's footage at 24 fps — the reference clip that opens the film (clips/ref1)
# and his gestures from the entrada clip (fabio_src), then his matte (fabio_matte) with tools/matte8.py,
# its waist edge fixed by tools/matte8_fix.py.
set -e
cd "$(dirname "$0")/.."
mkdir -p clips/ref1 fabio_src fabio_matte
ffmpeg -hide_banner -loglevel error -y -i media/referencia_inovadora_1.mp4 -vf "fps=24:round=near" -q:v 2 clips/ref1/r_%03d.jpg
ffmpeg -hide_banner -loglevel error -y -i media/entrada_fabio.mp4 -t 4.84 -vf "fps=24:round=near" -q:v 1 fabio_src/e_%03d.jpg
echo "ref1: $(ls clips/ref1 | wc -l) frames · Fabio: $(ls fabio_src | wc -l) frames"
python3 tools/matte8.py fabio_src fabio_matte birefnet-general-lite
python3 tools/matte8_fix.py fabio_matte fabio_src fabio_matte
