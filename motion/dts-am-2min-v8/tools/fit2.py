"""Fit old-look -> new-look colour transfer from pixel-aligned pairs:
new-look renders (final film frames + A&M previews) vs the v7 frames at the same story time."""
import json, glob, os, numpy as np
from PIL import Image, ImageFilter
SP="<SCRATCH>"
D=SP+"/v7/motion/dts-todos-sabem-usam-exemplo"
def feats(c):
    r,g,b=c[:,0],c[:,1],c[:,2]
    return np.stack([np.ones_like(r),r,g,b,r*g,r*b,g*b,r*r,g*g,b*b,r*g*b,r**3,g**3,b**3,r*r*g,r*r*b,g*g*r,g*g*b,b*b*r,b*b*g],1)
def load(p):
    im=Image.open(p).convert("RGB").filter(ImageFilter.GaussianBlur(3)).resize((240,135),Image.BILINEAR)
    return (np.asarray(im,np.float32)/255)[12:,:].reshape(-1,3)
if __name__=="__main__":
    mp2=np.load(SP+"/retime/map.npy"); mp1=np.load(SP+"/retime/map_v1.npy")
    pairs=[]
    for k in range(240,460,8):
        f=f"{D}/out/frames/f_{k:05d}.jpg"
        if os.path.exists(f): pairs.append((f,int(mp2[min(k,len(mp2)-1)])))
    for T in [9.9,13.5,111.0,117.5]:
        f=f"{D}/out/pv4/t_{T:06.2f}.png"
        if os.path.exists(f): pairs.append((f,int(mp1[int(round(T*24))])))
    idx=sorted(set(i for _,i in pairs))
    import subprocess
    os.makedirs("old2",exist_ok=True)
    for i in idx:
        o=f"old2/o_{i:05d}.png"
        if not os.path.exists(o):
            subprocess.run([SP+"/bin/ffmpeg","-loglevel","error","-i",D+"/video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4","-vf",f"select=eq(n\\,{i})","-vsync","0","-frames:v","1",o],check=True)
    X=np.concatenate([load(f"old2/o_{i:05d}.png") for _,i in pairs]); Y=np.concatenate([load(f) for f,_ in pairs])
    F=feats(X); w=np.ones(len(X),bool)
    for it in range(4):
        M,_,_,_=np.linalg.lstsq(F[w],Y[w],rcond=None); res=np.abs(F@M-Y).sum(1); w=res<np.quantile(res,0.85)
    pred=np.clip(F@M,0,1)
    print("pairs",len(pairs),"samples",len(X),"MAE all %.4f inliers %.4f"%(np.abs(pred-Y).mean(),np.abs(pred[w]-Y[w]).mean()))
    np.save("M2.npy",M)
