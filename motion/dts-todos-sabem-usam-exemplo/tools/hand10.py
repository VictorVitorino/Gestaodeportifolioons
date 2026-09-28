"""v10: in R23 the button is pressed by Fabio's finger and by a viewer's hand coming from below. The film
keeps only Fabio's: from f334 the viewer's hand is painted out with a clean plate (f328, before the hand
enters) warped onto each frame by the button's own motion (a similarity from features on the button's
ends and the sparkle ring). Fabio's finger, coming from above, is protected by keyframes of its tip.
From f343 (when the footage's button starts to glow under the hand) the whole capsule comes from the
clean plate, so the press glow is the film's own (film10 draws it at Fabio's fingertip).
python3 tools/hand10.py  (reads clips10/r23_orig, writes clips10/r23 and qa10/hand_*.jpg)"""
import os, glob
import numpy as np, cv2

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC, DST = os.path.join(ROOT, 'clips10', 'r23_orig'), os.path.join(ROOT, 'clips10', 'r23')
CLEAN, F0, F1 = 328, 334, 366
rd = lambda i: cv2.imread(os.path.join(SRC, f'f_{i:03d}.jpg')) if os.path.exists(os.path.join(SRC, f'f_{i:03d}.jpg')) else cv2.imread(os.path.join(DST, f'f_{i:03d}.jpg'))
# Fabio's fingertip (x, y) per frame (from the gridded crops); linear in between
TIP = {334: (890, 420), 336: (960, 520), 338: (965, 560), 340: (975, 568), 342: (990, 600), 344: (985, 612),
       346: (972, 604), 348: (976, 602), 350: (990, 578), 352: (990, 562), 356: (992, 548), 360: (994, 536), 366: (996, 520)}
def tip(i):
    ks = sorted(TIP)
    if i <= ks[0]: return TIP[ks[0]]
    for a, b in zip(ks, ks[1:]):
        if a <= i <= b:
            u = (i - a) / (b - a); return (TIP[a][0] + (TIP[b][0] - TIP[a][0]) * u, TIP[a][1] + (TIP[b][1] - TIP[a][1]) * u)
    return TIP[ks[-1]]

orb = cv2.ORB_create(5000)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
ref = rd(CLEAN); gref = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
mref = np.zeros_like(gref); mref[600:930, 520:880] = 255; mref[600:930, 1150:1420] = 255
kr, dr = orb.detectAndCompute(gref, mref)
# the capsule in the clean frame: saturated orange-gold, filled
hsv = cv2.cvtColor(ref, cv2.COLOR_BGR2HSV)
cap = ((hsv[..., 0] < 28) & (hsv[..., 1] > 90) & (hsv[..., 2] > 110)).astype(np.uint8) * 255
cap[:560] = 0; cap[960:] = 0
cap = cv2.morphologyEx(cap, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(cap, 8)
big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); cap = (lab == big).astype(np.uint8) * 255
cnts, _ = cv2.findContours(cap, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE); cap = np.zeros_like(cap); cv2.drawContours(cap, cnts, -1, 255, -1)
cap = cv2.dilate(cap, np.ones((15, 15), np.uint8))
os.makedirs(os.path.join(ROOT, 'qa10'), exist_ok=True)
for i in range(F0, F1 + 1):
    img = rd(i); g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mi = np.zeros_like(g); mi[520:960, 480:880] = 255; mi[520:960, 1160:1460] = 255
    k, d = orb.detectAndCompute(g, mi)
    m = sorted(bf.match(dr, d), key=lambda x: x.distance)[:600]
    p0 = np.float32([kr[x.queryIdx].pt for x in m]); p1 = np.float32([k[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=2.5, maxIters=4000, confidence=0.999)
    C = cv2.warpAffine(ref, M, (1920, 1080), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    diff = cv2.GaussianBlur(cv2.absdiff(img, C).max(axis=2), (0, 0), 3)
    hand = (diff > 26).astype(np.uint8) * 255; hand[:, :760] = 0; hand[:, 1260:] = 0; hand[:470] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(hand, 8)
    keep = np.zeros(n, bool)
    for c in range(1, n):
        if st[c, cv2.CC_STAT_TOP] + st[c, cv2.CC_STAT_HEIGHT] >= 1070 and st[c, cv2.CC_STAT_AREA] > 800: keep[c] = True
    P = keep[lab].astype(np.uint8) * 255
    if i >= 343: P = np.maximum(P, cv2.warpAffine(cap, M, (1920, 1080), flags=cv2.INTER_NEAREST))
    # protect Fabio's finger: everything above his fingertip in a band around it, and a disc on the tip
    tx, ty = tip(i)
    prot = np.zeros_like(P); prot[: int(ty) - 2, int(tx) - 70: int(tx) + 70] = 255
    cv2.ellipse(prot, (int(tx), int(ty) - 14), (20, 24), 0, 0, 360, 255, -1)
    P = cv2.dilate(P, np.ones((13, 13), np.uint8)); P[prot > 0] = 0
    A = cv2.GaussianBlur(P.astype(np.float32) / 255, (0, 0), 4)[..., None]
    out = (img * (1 - A) + C * A).astype(np.uint8)
    cv2.imwrite(os.path.join(DST, f'f_{i:03d}.jpg'), out, [cv2.IMWRITE_JPEG_QUALITY, 97])
    if i % 3 == 1 or i in (344, 345):
        sbs = np.hstack([img[380:940, 700:1260], out[380:940, 700:1260]])
        cv2.circle(sbs, (int(tx) - 700 + 560, int(ty) - 380), 5, (0, 255, 255), 1)
        cv2.imwrite(os.path.join(ROOT, 'qa10', f'hand_{i}.jpg'), sbs, [cv2.IMWRITE_JPEG_QUALITY, 85])
    print(i, 'inliers', int(inl.sum()), 'scale %.4f' % np.hypot(M[0, 0], M[1, 0]), 'shift', np.round(M[:, 2], 1), flush=True)
