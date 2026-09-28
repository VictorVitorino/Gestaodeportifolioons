#!/bin/bash
# v10: a <30 MiB delivery (2-pass) and a CRF master, once every frame exists
set -e
cd "$(dirname "$0")/.."
NF=$(node -e "import('./src/cut10.js').then(m=>console.log(Math.round(m.DURATION*30)))")
until [ "$(ls out/frames10 | wc -l)" -ge "$NF" ] && [ -z "$(pgrep -f 'node [r]ender.mjs frames 30')" ]; do sleep 10; done
echo "frames complete ($NF) $(date +%H:%M:%S)"
VF="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
COL="-colorspace bt709 -color_primaries bt709 -color_trc bt709"
X="-c:v libx264 -preset slower -profile:v high -x264-params aq-mode=3:aq-strength=0.9"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i out/frames10/f_%05d.jpg -vf "$VF" $X -b:v 1450k -maxrate 3400k -bufsize 6800k $COL -pass 1 -passlogfile out/x264v10 -an -f mp4 /dev/null
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i out/frames10/f_%05d.jpg -i audio/soundtrack10.wav -vf "$VF" $X -b:v 1450k -maxrate 3400k -bufsize 6800k $COL -pass 2 -passlogfile out/x264v10 -movflags +faststart -c:a aac -b:a 128k -ar 48000 -shortest out/FLOWS_A_Travessia_v10.mp4
echo "delivery done $(date +%H:%M:%S) $(stat -c %s out/FLOWS_A_Travessia_v10.mp4)"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i out/frames10/f_%05d.jpg -i audio/soundtrack10.wav -vf "$VF" -c:v libx264 -preset slow -crf 18 -profile:v high $COL -movflags +faststart -c:a aac -b:a 192k -ar 48000 -shortest out/FLOWS_A_Travessia_master_v10.mp4
echo "master done $(date +%H:%M:%S) $(stat -c %s out/FLOWS_A_Travessia_master_v10.mp4)"
