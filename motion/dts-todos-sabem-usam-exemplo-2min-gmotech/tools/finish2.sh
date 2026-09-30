#!/bin/bash
# Ring fix: wait for the re-rendered frames, then the 1080p master (audio of the 2:00 cut), a 1080p delivery sized
# for the chat (audio of the film sent by the team) and the 720p (same audio). 2 passes each.
cd "$(dirname "$0")"
until [ $(ls rend | grep -c 'f_[0-9]*\.jpg$') -ge 2652 ]; do
  pgrep -f "[r]ender.mjs list" >/dev/null || { echo "render workers not running and frames missing"; exit 1; }
  sleep 10
done
echo "$(date +%H:%M) render complete"
mkdir -p out2
enc() { [ -s "$1" ] || { python3 encode_v12.py "$1" "$2" $3 $4 $5 1 && python3 encode_v12.py "$1" "$2" $3 $4 $5 2; } || { echo "$1 encode failed"; exit 1; }; echo "$(date +%H:%M) $1 done"; }
enc out2/DTS_2min_GMO_TECH.mp4 cut_v0.mp4 1920 1080 5800
enc out2/DTS_2min_GMO_TECH_1080p_envio.mp4 ../v11/orig.mp4 1920 1080 1870
enc out2/DTS_2min_GMO_TECH_720p.mp4 ../v11/orig.mp4 1280 720 1650
ls -la out2
