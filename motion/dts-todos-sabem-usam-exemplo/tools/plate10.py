"""v10 · A Travessia — the opening plate: Fabio's footage as one continuous shot at 30 fps.

  A  R21  f1   → f104   the arms-crossed smile, the golden rings, the spirals take him (1.0x)
     ── golden flash: the spiral light peaks and hands over to the FLOWS logo's golden swoosh
  B  R16  f1   → f107   the FLOWS logo, the door of light rises, Fabio materializes inside it (1.0x)
     ── door light: the doorway's light fills the frame and opens onto the FLOWS stage
  C  R21  f120 → f254   the stage: the FLOWS letters sweep and settle; slowed (optical-flow in-betweens)
                        while DTS is written and the three pillars level, then back to 1.0x
  D  R22  f16  → f337   (frame-exact join with R21 f254) the walk, the touch on the Biblioteca, the portal
  E  R23  f41  → end    (frame-exact join with R22 f337) the hall, the orbit, the Publicar Skill button;
                        Fabio's own finger presses it: the viewer's hand is painted out (clean plate)

Writes plates10/p_#####.jpg (film frame n = n/30 s) and plates10/plate.json (per frame: source, speed,
whiteness, and the camera tracks the overlays follow).  python3 tools/plate10.py [--only a,b] [--q]"""
import os, sys, json, glob
import numpy as np, cv2

FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
CLIP = {k: sorted(glob.glob(os.path.join(ROOT, 'clips10', k, 'f_*.jpg'))) for k in ('r16', 'r21', 'r22', 'r23')}
# R16 was made at 24 fps and padded to 30 by repeating every fifth frame (the tilt stutters): the film
# plays its unique frames at 24 fps with optical-flow in-betweens ('r16u', 1-based unique index)
def _unique(files):
    keep, prev = [], None
    for f in files:
        g = cv2.resize(cv2.imread(f, cv2.IMREAD_GRAYSCALE), (480, 270), interpolation=cv2.INTER_AREA).astype(np.float32)
        if prev is None or np.abs(g - prev).mean() >= 0.35: keep.append(f)
        prev = g
    return keep
CLIP['r16u'] = _unique(CLIP['r16'])
U107 = CLIP['r16u'].index(CLIP['r16'][106]) + 1          # R16 f107 in unique frames
FIX = {('r21', 130): (129, 131)}                           # a repeated frame in R21: rebuilt as an in-between
OUT = os.path.join(ROOT, 'plates10'); os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ the time map (film seconds -> clip frame)
def smooth(x): x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)
def speed_curve(keys):
    """piecewise speed (clip frames per film second / 30) with smoothstep blends: keys [(T, speed, blend)]"""
    def s(T):
        v = keys[0][1]
        for (t0, v1, b) in keys[1:]:
            v = v + (v1 - v) * smooth((T - t0) / b) if T > t0 else v
        return v
    return s

SEG = []   # (clip, T0, T1, f0 (1-based float), speed function or None for 1.0x)
T = 0.0
# A: R21 f1 → f104
SEG.append(('r21', T, T + 103 / FPS, 1.0, None)); T += 103 / FPS
TA = T
# B: R16 f1 → f107 (its unique frames at 24 fps)
SEG.append(('r16u', T, T + (U107 - 1) / 24, 1.0, lambda t: 24 / FPS)); T += (U107 - 1) / 24
TB = T
# C: R21 f120 → f254 with the slow window (speed 1 → 0.45 → 0.3 → 1)
spC = speed_curve([(0, 1.0, 0), (TB + 0.85, 0.45, 0.55), (TB + 3.6, 0.30, 0.6), (TB + 9.5, 1.0, 1.1)])
f, t, dt = 120.0, TB, 1 / (FPS * 8)
while f < 254.0:
    f += spC(t) * FPS * dt; t += dt
TC = t
SEG.append(('r21', TB, TC, 120.0, spC))
# D: R22 f16 → f337 (1.0x)
SEG.append(('r22', TC, TC + (337 - 16) / FPS, 16.0, None)); TD = TC + (337 - 16) / FPS
# E: R23 f41 → the press (f339 contact), then slow while the iris opens
spE = speed_curve([(0, 1.0, 0), (TD + (330 - 41) / FPS, 0.35, 0.3)])
f, t = 41.0, TD
while f < 362.0:
    f += spE(t) * FPS * dt; t += dt
TE = t
SEG.append(('r23', TD, TE, 41.0, spE))
DUR = TE

def clip_pos(Tf):
    """(clip, fractional 1-based frame) shown at film time Tf"""
    for (c, a, b, f0, sp) in SEG:
        if a - 1e-9 <= Tf < b + 1e-9:
            if sp is None: return c, f0 + (Tf - a) * FPS
            f, t = f0, a
            while t < Tf - 1e-12:
                h = min(dt, Tf - t); f += sp(t) * FPS * h; t += h
            return c, f
    c, a, b, f0, sp = SEG[-1]; return c, 362.0

# the two light transitions (never pure white: the pictures cross through the light), and the fade in
PEAK = 0.93
def white(Tf):
    """(amount, colour BGR): A is the golden spiral light, B the doorway's cool light"""
    if TA - 0.30 < Tf < TA + 0.38:
        w = smooth((Tf - (TA - 0.30)) / 0.30) if Tf < TA else 1 - smooth((Tf - TA) / 0.38)
        return w * PEAK, (224, 242, 255)
    if TB - 0.32 < Tf < TB + 0.45:
        w = smooth((Tf - (TB - 0.32)) / 0.32) if Tf < TB else 1 - smooth((Tf - TB) / 0.45)
        return w * PEAK, (255, 250, 244)
    return 0.0, (255, 255, 255)

# ------------------------------------------------------------------ frames, in-betweens
_cache = {}
def frame(c, i):
    i = max(1, min(len(CLIP[c]), int(i)))
    k = (c, i)
    if k not in _cache:
        if len(_cache) > 24: _cache.pop(next(iter(_cache)))
        if k in FIX: a, b = FIX[k]; _cache[k] = at(c, a + 0.5) if False else _mid(c, a, b)
        else: _cache[k] = cv2.imread(CLIP[c][i - 1])
    return _cache[k]
DIS = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
_flow = {}
def flow(c, i):
    """forward and backward flow between clip frames i and i+1 (computed at half resolution)"""
    k = (c, i)
    if k not in _flow:
        if len(_flow) > 6: _flow.pop(next(iter(_flow)))
        A = cv2.cvtColor(cv2.resize(frame(c, i), (960, 540), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        B = cv2.cvtColor(cv2.resize(frame(c, i + 1), (960, 540), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        fab = DIS.calc(A, B, None); fba = DIS.calc(B, A, None)
        up = lambda f: cv2.resize(f, (1920, 1080), interpolation=cv2.INTER_LINEAR) * 2.0
        _flow[k] = (up(fab), up(fba))
    return _flow[k]
GX, GY = np.meshgrid(np.arange(1920, dtype=np.float32), np.arange(1080, dtype=np.float32))
def _mid(c, a, b):
    """the in-between halfway from clip frame a to b (for a repeated frame)"""
    A, B = cv2.imread(CLIP[c][a - 1]), cv2.imread(CLIP[c][b - 1])
    gA = cv2.cvtColor(cv2.resize(A, (960, 540)), cv2.COLOR_BGR2GRAY); gB = cv2.cvtColor(cv2.resize(B, (960, 540)), cv2.COLOR_BGR2GRAY)
    up = lambda f: cv2.resize(f, (1920, 1080)) * 2.0
    fab, fba = up(DIS.calc(gA, gB, None)), up(DIS.calc(gB, gA, None))
    wa = cv2.remap(A, GX - 0.5 * fab[..., 0], GY - 0.5 * fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    wb = cv2.remap(B, GX - 0.5 * fba[..., 0], GY - 0.5 * fba[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return cv2.addWeighted(wa, 0.5, wb, 0.5, 0)
def at(c, fpos):
    i = int(np.floor(fpos)); a = fpos - i
    if a < 0.02: return frame(c, i).copy()
    if a > 0.98: return frame(c, i + 1).copy()
    A, B = frame(c, i), frame(c, i + 1); fab, fba = flow(c, i)
    wa = cv2.remap(A, GX - a * fab[..., 0], GY - a * fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    wb = cv2.remap(B, GX - (1 - a) * fba[..., 0], GY - (1 - a) * fba[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return cv2.addWeighted(wa, 1 - a, wb, a, 0)

# ------------------------------------------------------------------ the viewer's hand, painted out of R23
HAND = None
def hand_patch(img, fpos):
    """R23 from f330: warp the clean frame f328 onto this frame (camera push) and paste it where the
    viewer's hand is (below the button's top edge, where the frame differs from the clean plate)"""
    global HAND
    if HAND is None:
        HAND = json.load(open(os.path.join(ROOT, 'plates10', 'hand.json'))) if os.path.exists(os.path.join(ROOT, 'plates10', 'hand.json')) else {}
    k = str(int(round(fpos)))
    if k not in HAND: return img
    h = HAND[k]; M = np.array(h['M'], np.float32)
    clean = cv2.warpAffine(frame('r23', 328), M, (1920, 1080), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    mask = cv2.imread(os.path.join(ROOT, 'plates10', f'hand_{int(k):03d}.png'), cv2.IMREAD_GRAYSCALE).astype(np.float32)[..., None] / 255
    return (img * (1 - mask) + clean * mask).astype(np.uint8)

def render(n):
    Tf = n / FPS
    c, fpos = clip_pos(Tf)
    img = at(c, fpos)
    if c == 'r23': img = hand_patch(img, fpos)
    w, col = white(Tf)
    if w > 0:
        glow = cv2.GaussianBlur(img, (0, 0), 18)
        img = cv2.addWeighted(img, 1 - 0.5 * w, glow, 0.5 * w, 0)
        img = (img.astype(np.float32) * (1 - w) + np.array(col, np.float32) * w).astype(np.uint8)
    if Tf < 0.6: img = (img.astype(np.float32) * smooth(Tf / 0.6)).astype(np.uint8)
    return img, c, fpos, w

if __name__ == '__main__':
    N = int(np.ceil(DUR * FPS)) + 1
    info = {'fps': FPS, 'dur': DUR, 'TA': TA, 'TB': TB, 'TC': TC, 'TD': TD, 'TE': TE, 'frames': []}
    only = None
    if '--only' in sys.argv: a, b = sys.argv[sys.argv.index('--only') + 1].split(','); only = range(int(a), int(b) + 1)
    q = 88 if '--q' in sys.argv else 95
    for n in range(N):
        c, fpos = clip_pos(n / FPS)
        info['frames'].append([c, round(fpos, 3)])
        if only is not None and n not in only: continue
        out = os.path.join(OUT, f'p_{n:05d}.jpg')
        if os.path.exists(out) and only is None: continue
        img, c, fpos, w = render(n)
        cv2.imwrite(out, img, [cv2.IMWRITE_JPEG_QUALITY, q])
        if n % 60 == 0: print('plate', n, '/', N, c, round(fpos, 2), flush=True)
    json.dump(info, open(os.path.join(OUT, 'plate.json'), 'w'))
    print('dur %.2f s · %d frames · A→B %.2f · B→C %.2f · C→D %.2f · D→E %.2f' % (DUR, N, TA, TB, TC, TD))
