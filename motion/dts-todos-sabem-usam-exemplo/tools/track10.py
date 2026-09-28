"""v10: camera tracks of the opening plate for the graphics that live in the stage: 'sky' (the FLOWS letters and
the walls, where DTS is written) and 'floor' (the stage floor, where the three columns of light stand). For each
plate frame n in the stage window, the similarity that maps the reference frame REF onto frame n, chained frame to
frame (ORB + RANSAC, Fabio's column masked out). python3 tools/track10.py -> plates10/track.json"""
import os, json
import numpy as np, cv2

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
info = json.load(open(os.path.join(ROOT, 'plates10', 'plate.json')))
N0 = int(info['TB'] * 30) + 6            # a few frames after the door light
N1 = int(info['TC'] * 30) + 60            # into the walk (R22)
REF = int((info['TB'] + 3.0) * 30)
REGIONS = {'sky': (140, 560), 'floor': (700, 1075)}
orb = cv2.ORB_create(3000)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
def gray(n): return cv2.cvtColor(cv2.imread(os.path.join(ROOT, 'plates10', f'p_{n:05d}.jpg')), cv2.COLOR_BGR2GRAY)
def mask(y0, y1):
    m = np.zeros((1080, 1920), np.uint8); m[y0:y1] = 255; m[:, 840:1080] = 0; return m
def step(ga, gb, m):
    ka, da = orb.detectAndCompute(ga, m); kb, db = orb.detectAndCompute(gb, m)
    if da is None or db is None: return np.eye(3)
    mt = sorted(bf.match(da, db), key=lambda x: x.distance)[:800]
    if len(mt) < 12: return np.eye(3)
    pa = np.float32([ka[x.queryIdx].pt for x in mt]); pb = np.float32([kb[x.trainIdx].pt for x in mt])
    M, inl = cv2.estimateAffinePartial2D(pa, pb, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=3000, confidence=0.995)
    if M is None: return np.eye(3)
    return np.vstack([M, [0, 0, 1]])
out = {'ref': REF, 'n0': N0, 'n1': N1}
for name, (y0, y1) in REGIONS.items():
    m = mask(y0, y1)
    H = {REF: np.eye(3)}
    g = {n: gray(n) for n in range(N0, N1 + 1)}
    for n in range(REF + 1, N1 + 1): H[n] = step(g[n - 1], g[n], m) @ H[n - 1]
    for n in range(REF - 1, N0 - 1, -1): H[n] = np.linalg.inv(step(g[n], g[n + 1], m)) @ H[n + 1]
    # light smoothing of the parameters (the in-betweens can jitter a pixel)
    ks = sorted(H); P = np.array([[H[k][0, 0], H[k][1, 0], H[k][0, 2], H[k][1, 2]] for k in ks])
    Ps = np.copy(P)
    for j in range(4): Ps[:, j] = np.convolve(np.pad(P[:, j], 3, mode='edge'), np.ones(7) / 7, mode='valid')
    out[name] = {str(k): [round(float(v), 6) for v in Ps[i]] for i, k in enumerate(ks)}
    print(name, 'frames', len(ks), 'scale at ends %.3f %.3f' % (np.hypot(*Ps[0, :2]), np.hypot(*Ps[-1, :2])), 'shift at ends', np.round(Ps[0, 2:], 1), np.round(Ps[-1, 2:], 1), flush=True)
json.dump(out, open(os.path.join(ROOT, 'plates10', 'track.json'), 'w'))
