#!/bin/bash
# v9 (Fabio's journey): the footage frames and Fabio's full-body mattes.
#  - clips/cont, clips/i28: the continuation of the entrance (the touch on the Biblioteca, the portal,
#    the orbit) and the Publicar skill button, at their native 30 fps
#  - fm_src: the first 6.25 s of the model-sheet clip at 24 fps, stabilized (tools/stab9.py), then the
#    four poses matted (tools/matte9.py) and anchored (tools/posemeta9.py)
set -e
cd "$(dirname "$0")/.."
mkdir -p clips/cont clips/i28 fm_src fabio_poses
ffmpeg -hide_banner -loglevel error -y -i media/referencia_continuacao.mp4 -q:v 2 clips/cont/c_%03d.jpg
ffmpeg -hide_banner -loglevel error -y -i media/referencia_botao.mp4 -q:v 2 clips/i28/i_%03d.jpg
ffmpeg -hide_banner -loglevel error -y -i media/fabio_poses.mp4 -t 6.25 -vf "fps=24:round=near" fm_src/m_%03d.png
python3 tools/stab9.py
python3 tools/matte9.py
python3 tools/posemeta9.py
