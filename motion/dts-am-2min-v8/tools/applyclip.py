"""Colour-match Fabio's intro clip to the A&M look: LUT ramps in while the studio turns into the plaza."""
import glob, os, shutil, numpy as np
from PIL import Image
from fit2 import feats, SP, D
M=np.load("M2.npy").astype(np.float32)
src=D+"/tex/fabio"; bak=D+"/tex/fabio_orig"
if not os.path.exists(bak): shutil.copytree(src,bak)
A,B=100,125   # c_100 (4.17 s) -> c_125 (5.21 s)
for f in sorted(glob.glob(bak+"/c_*.jpg")):
    n=int(os.path.basename(f)[2:5]); u=min(1,max(0,(n-A)/(B-A))); w=u*u*(3-2*u)
    out=os.path.join(src,os.path.basename(f))
    if w<=0: shutil.copy(f,out); continue
    im=np.asarray(Image.open(f).convert("RGB"),np.float32)/255; h,wd,_=im.shape
    c=im.reshape(-1,3); t=np.clip(feats(c)@M,0,1)
    res=(c*(1-w)+t*w).reshape(h,wd,3)
    Image.fromarray((res*255+0.5).astype(np.uint8)).save(out,quality=95)
print("clip graded")
