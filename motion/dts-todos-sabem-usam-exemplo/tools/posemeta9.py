"""Anchors of each matted pose (frame 1): canvas size, top of the head, the soles, the feet's centre,
and for the ranking pose the tip of the raised finger. -> fabio_poses/meta.json"""
import json, numpy as np
from PIL import Image
out = {}
for nm in ('greet', 'present', 'rank1', 'welcome'):
    a = np.array(Image.open(f'fabio_poses/{nm}/p_001.png'))[..., 3].astype(np.float32) / 255
    h, w = a.shape; ys, xs = np.where(a > 0.5)
    top, sole = int(ys.min()), int(ys.max())
    band = a[sole - int(0.06 * (sole - top)):sole + 1]          # the shoes
    cols = band.sum(0); footX = float((cols * np.arange(w)).sum() / cols.sum())
    m = {'w': w, 'h': h, 'top': top, 'sole': sole, 'footX': round(footX, 1)}
    if nm == 'rank1':                                           # the raised finger: the highest point in the left third
        ys2, xs2 = np.where(a[:, :int(0.35 * w)] > 0.5); fy = int(ys2.min())
        m['finger'] = [round(float(xs2[ys2 == fy].mean()), 1), fy]
    out[nm] = m
json.dump(out, open('fabio_poses/meta.json', 'w'), indent=1)
print(json.dumps(out))
