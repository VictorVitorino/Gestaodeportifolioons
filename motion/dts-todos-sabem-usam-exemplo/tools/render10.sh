#!/bin/bash
# v10 · A Travessia: render every frame at 30 fps with 3 workers — the plate (cheap) first, then the 3D
# take; then any frame the software rasteriser dropped (tools/badframes10.py) is rendered again
# (render.mjs skips frames that exist).
cd "$(dirname "$0")/.."
mkdir -p out/frames10 logs
run() { for w in 0 1 2; do PAGE=film10.htm node render.mjs frames 30 $w 3 out/frames10 $1 $2 >> logs/v10_$w.log 2>&1 & done; wait; }
run 0 41.0
run 41.0
for i in 1 2 3; do python3 tools/badframes10.py --rm | tail -1; run 0; done
echo "render finished $(date +%H:%M:%S) $(ls out/frames10 | wc -l) frames" | tee -a logs/render10.log
