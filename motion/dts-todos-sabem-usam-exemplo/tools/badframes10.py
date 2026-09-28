"""v10 QA: frames with a raster glitch (a band of pure black rows inside the picture, or a mostly black
frame where the film is not black). Prints them; with --rm deletes them so render.mjs re-renders them.
python3 tools/badframes10.py [--rm]"""
import os, sys, glob
import numpy as np, cv2
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
bad = []
for f in sorted(glob.glob(os.path.join(ROOT, 'out', 'frames10', 'f_*.jpg'))):
    n = int(os.path.basename(f)[2:7])
    g = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    if g is None: bad.append((n, 'unreadable')); continue
    if n < 20 or n > 3540: continue                     # the fade in, the end (letterbox and fade out)
    rows = g[150:930:2].max(axis=1)
    run = best = 0
    for v in rows:
        run = run + 1 if v < 6 else 0; best = max(best, run)
    if best >= 8: bad.append((n, f'black band {best * 2}px'))
for b in bad: print(b)
print(len(bad), 'bad frames')
if '--rm' in sys.argv:
    for n, _ in bad: os.remove(os.path.join(ROOT, 'out', 'frames10', f'f_{n:05d}.jpg'))
