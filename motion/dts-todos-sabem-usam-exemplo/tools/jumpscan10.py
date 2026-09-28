"""v10 QA: frame-to-frame change over the rendered film (spikes = abrupt jumps). Prints the frames whose
change stands out from their neighbourhood, and writes qa10/jumps.png (the curve).
python3 tools/jumpscan10.py [n0 n1]"""
import os, sys, glob
import numpy as np, cv2
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
fs = sorted(glob.glob(os.path.join(ROOT, 'out', 'frames10', 'f_*.jpg')))
idx = [int(os.path.basename(f)[2:7]) for f in fs]
n0, n1 = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (idx[0], idx[-1])
prev, d = None, {}
for f, n in zip(fs, idx):
    if n < n0 or n > n1: continue
    g = cv2.resize(cv2.imread(f, cv2.IMREAD_GRAYSCALE), (320, 180), interpolation=cv2.INTER_AREA).astype(np.float32)
    if prev is not None and n == prev[0] + 1: d[n] = float(np.abs(g - prev[1]).mean())
    prev = (n, g)
ks = sorted(d); v = np.array([d[k] for k in ks])
med = np.array([np.median(v[max(0, i - 6):i + 7]) for i in range(len(v))])
spk = [(ks[i], round(v[i], 2), round(med[i], 2)) for i in range(len(v)) if v[i] > 2.2 * med[i] + 1.2]
print('frames', len(ks), 'spikes (n, diff, local median):')
for s in spk: print('  ', s, f'{s[0] / 30:.2f}s')
H = 300; img = np.full((H, len(v) + 20, 3), 255, np.uint8)
for i, x in enumerate(v): cv2.line(img, (i + 10, H - 10), (i + 10, H - 10 - int(min(x, 40) * 7)), (60, 60, 200), 1)
cv2.imwrite(os.path.join(ROOT, 'qa10', 'jumps.png'), img)
