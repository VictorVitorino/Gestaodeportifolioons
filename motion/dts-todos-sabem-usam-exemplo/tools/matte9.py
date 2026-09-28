"""v9: Fabio's full-body poses from the model-sheet clip (media/fabio_poses.mp4, 1660x1244 at 24 fps).
The sheet zooms in slowly: every frame is first mapped back onto frame 1 (a similarity per frame,
fm_src/stab.json), so each pose stands still in its column while it moves (the wave, the #1, the
open arms). Each pose is cut out of its column (a neighbour's hand or the #1 of the next pose is
painted over with the sheet's grey), matted with BiRefNet lite, the light-grey fringe is removed
(colour decontamination against the sheet), and the frames of a pose share one canvas, so his feet
stay put. python3 tools/matte9.py [pose ...]  ->  fabio_poses/<pose>/p_###.png (after tools/stab9.py)"""
import sys, os, json, time
import numpy as np, cv2
from PIL import Image
from rembg import new_session, remove
import onnxruntime as ort

S = 1.5                     # canvas scale over frame 1 (the later frames are zoomed in: more detail)
POSES = {                   # frames (1-based, inclusive), column in frame-1 pixels, rects painted over
    'greet': {'win': (1, 48), 'box': (748, 36, 970, 748), 'paint': []},
    'present': {'win': (1, 72), 'box': (966, 36, 1248, 748), 'paint': [(1198, 36, 1248, 142)]},
    'rank1': {'win': (1, 72), 'box': (1196, 36, 1422, 748), 'paint': [(1196, 142, 1248, 748)]},
    'welcome': {'win': (1, 40), 'box': (1418, 36, 1660, 748), 'paint': []},
}
st = json.load(open('fm_src/stab.json'))
so = ort.SessionOptions(); so.enable_cpu_mem_arena = False; so.enable_mem_pattern = False
so.intra_op_num_threads = int(os.environ.get('THREADS', '4'))
sess = new_session('birefnet-general-lite', sess_opts=so)


def stabilized(i, box):
    # only the pose's column, straight from the source frame (one warp per crop)
    x0, y0, x1, y1 = box
    M = np.array(st[i - 1]['M']) * S; M[0, 2] -= x0; M[1, 2] -= y0
    img = cv2.imread(f'fm_src/m_{i:03d}.png')
    return cv2.warpAffine(img, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def bg_rows(img):
    # the sheet's grey, row by row: mean of the light, unsaturated pixels of each row
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 2] > 185) & (hsv[..., 1] < 30)).astype(np.float32)
    n = m.sum(1); out = (img.astype(np.float32) * m[..., None]).sum(1) / np.maximum(n, 1)[:, None]
    for y in range(len(out)):
        if n[y] < 20: out[y] = out[y - 1] if y else np.array([225, 225, 228], np.float32)
    return cv2.GaussianBlur(out[None], (1, 31), 0)[0]


def matte(name):
    P = POSES[name]; x0, y0, x1, y1 = [int(v * S) for v in P['box']]
    dst = f'fabio_poses/{name}'; os.makedirs(dst, exist_ok=True)
    for i in range(P['win'][0], P['win'][1] + 1):
        out = f'{dst}/p_{i:03d}.png'
        if os.path.exists(out): continue
        t = time.time()
        crop = stabilized(i, (x0, y0, x1, y1)); bgc = bg_rows(crop); crop = crop.astype(np.float32)
        for (a, b, c, d) in P['paint']:
            a, b, c, d = [int(v * S) for v in (a, b, c, d)]
            crop[b - y0:d - y0, a - x0:c - x0] = bgc[b - y0:d - y0, None, :]
        h, w = crop.shape[:2]; side = max(h, w); py, px = (side - h) // 2, (side - w) // 2
        pad = np.pad(crop, ((py, side - h - py), (px, side - w - px), (0, 0)), mode='edge').astype(np.uint8)
        a = np.array(remove(Image.fromarray(cv2.cvtColor(pad, cv2.COLOR_BGR2RGB)), session=sess, only_mask=True, post_process_mask=False))
        a = a[py:py + h, px:px + w].astype(np.float32) / 255
        # keep the figure (the largest blob) and, for the ranking pose, the #1 above his finger
        n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 0.25).astype(np.uint8), 8)
        if n > 1:
            keep = np.zeros(n, bool); big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]); keep[big] = True
            if name == 'rank1':
                for k in range(1, n):
                    if stats[k, cv2.CC_STAT_TOP] < int(150 * S) - y0 and stats[k, cv2.CC_STAT_AREA] > 200: keep[k] = True
            grow = cv2.dilate(keep[lab].astype(np.uint8), np.ones((9, 9), np.uint8))
            a *= grow
        # colour decontamination: the soft edge still carries the sheet's light grey
        C = crop; B = bgc[:, None, :]
        F = np.where(a[..., None] > 0.02, (C - (1 - a[..., None]) * B) / np.maximum(a[..., None], 0.02), C)
        F = np.clip(F, 0, 255)
        rgba = np.dstack([cv2.cvtColor(F.astype(np.uint8), cv2.COLOR_BGR2RGB), (a * 255).astype(np.uint8)])
        Image.fromarray(rgba, 'RGBA').save(out, compress_level=3)
        print(name, i, round(time.time() - t, 1), 's', flush=True)


if __name__ == '__main__':
    names = sys.argv[1:] or list(POSES)
    only = os.environ.get('ONLY')          # e.g. ONLY=1,60 to test a few frames
    for nm in names:
        if only:
            w = POSES[nm]['win']; POSES[nm]['win'] = (0, -1)
            for k in map(int, only.split(',')):
                POSES[nm]['win'] = (k, k); matte(nm)
            POSES[nm]['win'] = w
        else:
            matte(nm)
    print('ALL DONE', flush=True)
