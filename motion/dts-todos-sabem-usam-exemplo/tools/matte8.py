"""Mattes Fabio out of the entrada clip (blue studio): BiRefNet lite (rembg, ONNX on CPU, ~11 s per
frame) per frame, padded to a square so the model sees the whole figure; writes RGBA PNGs with a
despilled edge. python3 tools/matte8.py fabio_src fabio_matte [model] (pip install rembg onnxruntime)"""
import sys, os, glob, time
import numpy as np
from PIL import Image
from rembg import new_session, remove
src, dst = sys.argv[1], sys.argv[2]
import onnxruntime as ort
so = ort.SessionOptions(); so.enable_cpu_mem_arena = False; so.enable_mem_pattern = False; so.intra_op_num_threads = 4
MODEL = sys.argv[3] if len(sys.argv) > 3 else 'birefnet-general-lite'
sess = new_session(MODEL, sess_opts=so)
fs = sorted(glob.glob(os.path.join(src, '*.jpg')))
for f in fs:
    out = os.path.join(dst, os.path.basename(f).replace('.jpg', '.png'))
    if os.path.exists(out): continue
    t = time.time()
    img = Image.open(f).convert('RGB'); a = np.array(img); h, w = a.shape[:2]
    side = max(h, w); py, px = (side - h) // 2, (side - w) // 2
    pad = np.pad(a, ((py, side - h - py), (px, side - w - px), (0, 0)), mode='edge')
    m = np.array(remove(Image.fromarray(pad), session=sess, only_mask=True, post_process_mask=False))[py:py + h, px:px + w].astype(np.float32) / 255
    # despill: the blue studio bleeds into soft edges; pull blue down toward max(r, g) where the matte is partial
    rgb = a.astype(np.float32); edge = np.clip((1 - m) * 4, 0, 1) * (m > 0.02)
    lim = np.maximum(rgb[..., 0], rgb[..., 1]); b = rgb[..., 2]
    rgb[..., 2] = np.where(b > lim, b - (b - lim) * edge, b)
    rgba = np.dstack([np.clip(rgb, 0, 255), m * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(out, compress_level=3)
    print(os.path.basename(out), round(time.time() - t, 1), 's', flush=True)
print('ALL DONE', flush=True)
