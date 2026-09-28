"""v9: the model-sheet clip zooms in slowly. For every frame, the similarity (scale, rotation, shift)
that maps it back onto frame 1, from ORB features and RANSAC: fm_src/stab.json (used by matte9.py).
python3 tools/stab9.py"""
import cv2, numpy as np, glob, json
fs = sorted(glob.glob('fm_src/m_*.png'))
ref = cv2.imread(fs[0], cv2.IMREAD_GRAYSCALE)
orb = cv2.ORB_create(6000); k0, d0 = orb.detectAndCompute(ref, None)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
out = []
for i, f in enumerate(fs):
    g = cv2.imread(f, cv2.IMREAD_GRAYSCALE); k, d = orb.detectAndCompute(g, None)
    m = sorted(bf.match(d0, d), key=lambda x: x.distance)[:1500]
    p0 = np.float32([k0[x.queryIdx].pt for x in m]); p1 = np.float32([k[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(p1, p0, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=5000, confidence=0.999)
    out.append({'i': i + 1, 'M': M.tolist(), 's': float(np.hypot(M[0, 0], M[1, 0])), 'inl': int(inl.sum())})
json.dump(out, open('fm_src/stab.json', 'w'))
print(len(out), 'frames; last scale', round(out[-1]['s'], 4))
