#!/bin/bash
# v9 · O Fio Dourado (Fabio's journey): render every frame with 3 workers. Phase 1 renders the film
# except Fabio's full-body shots whose mattes may still be in the making; phase 2 waits for the
# mattes (matte9.py) and renders the rest (render.mjs skips frames that exist).
cd "$(dirname "$0")/.."
mkdir -p out/frames9 logs
run() { for w in 0 1 2; do PAGE=film9.htm node render.mjs frames 24 $w 3 out/frames9 $1 $2 >> logs/v9_$w.log 2>&1 & done; wait; }
run 0 93.2; run 99.9 105.2; run 112.2 127.6
until [ "$(ls fabio_poses/present | wc -l)" -ge 72 ] && [ "$(ls fabio_poses/welcome | wc -l)" -ge 40 ] && [ "$(ls fabio_poses/greet | wc -l)" -ge 48 ]; do sleep 20; done
python3 tools/posemeta9.py > /dev/null
run 0          # the whole film (to its duration): only the missing frames
echo "render finished $(date +%H:%M:%S) $(ls out/frames9 | wc -l) frames"
