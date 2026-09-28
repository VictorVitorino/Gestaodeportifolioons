"""Fixes the bottom edge of Fabio's matte: where the frame cuts him at the waist, BiRefNet drops the
grey trousers and the belt in some frames (he floats, and the hem flickers). Below the vest's hem the
silhouette is extruded down to the frame edge, keyed against the studio's light blue. Idempotent, so it
can run in place:  python3 tools/matte8_fix.py fabio_matte fabio_src fabio_matte"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageFilter
src_m, src_c, dst = sys.argv[1], sys.argv[2], sys.argv[3]
YR = 1018  # the vest's hem: above it BiRefNet is stable in every frame
for f in sorted(glob.glob(os.path.join(src_m, 'e_*.png'))):
    im = np.array(Image.open(f)).astype(np.float32)
    rgb0 = np.array(Image.open(os.path.join(src_c, os.path.basename(f)[:-4] + '.jpg')).convert('RGB')).astype(np.float32)
    a = im[..., 3] / 255
    ref = a[YR - 6:YR + 1].max(0)
    lim = np.maximum(rgb0[..., 0], rgb0[..., 1]); b = rgb0[..., 2]
    bg = np.clip((b - lim - 18) / 14, 0, 1)                      # the backdrop is light blue (b - max(r, g) > 40); grey cloth and brown leather are not (< 15)
    bg = np.array(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32) / 255
    a2 = a.copy(); a2[YR:] = np.maximum(a[YR:], ref[None, :] * (1 - bg[YR:]))
    rgb = im[..., :3].copy(); ch = a2 > a + 1e-3
    edge = np.clip((1 - a2) * 4, 0, 1) * (a2 > 0.02)            # same despill as matte.py, for the new edge
    bb = np.where(b > lim, b - (b - lim) * edge, b)
    rgb[..., 0] = np.where(ch, rgb0[..., 0], rgb[..., 0]); rgb[..., 1] = np.where(ch, rgb0[..., 1], rgb[..., 1]); rgb[..., 2] = np.where(ch, bb, rgb[..., 2])
    Image.fromarray(np.dstack([np.clip(rgb, 0, 255), a2 * 255]).astype(np.uint8), 'RGBA').save(os.path.join(dst, os.path.basename(f)), compress_level=3)
print('fixed', len(glob.glob(os.path.join(src_m, 'e_*.png'))), 'mattes')
