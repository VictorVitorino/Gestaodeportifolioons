#!/bin/bash
# After the render: 1080p master (audio of the 2:00 cut) and 720p delivery (audio of the film sent by the team),
# each in 2 passes; outputs that already exist are kept (the script can be re-run after a restart).
cd "$(dirname "$0")"
until [ $(ls rend | grep -c 'f_[0-9]*\.jpg$') -ge 2652 ]; do
  pgrep -f "[r]ender.mjs list" >/dev/null || { echo "render workers not running and frames missing"; exit 1; }
  sleep 20
done
echo "$(date +%H:%M) render complete"
if [ ! -s out/DTS_2min_GMO_TECH.mp4 ]; then
  python3 encode_v12.py out/DTS_2min_GMO_TECH.mp4 cut_orig.mp4 1920 1080 5800 1 && \
  python3 encode_v12.py out/DTS_2min_GMO_TECH.mp4 cut_orig.mp4 1920 1080 5800 2 || { echo "1080p encode failed"; exit 1; }
fi
echo "$(date +%H:%M) 1080p done"
if [ ! -s out/DTS_2min_GMO_TECH_720p.mp4 ]; then
  python3 encode_v12.py out/DTS_2min_GMO_TECH_720p.mp4 ../v11/orig.mp4 1280 720 1650 1 && \
  python3 encode_v12.py out/DTS_2min_GMO_TECH_720p.mp4 ../v11/orig.mp4 1280 720 1650 2 || { echo "720p encode failed"; exit 1; }
fi
echo "$(date +%H:%M) 720p done"
ls -la out
