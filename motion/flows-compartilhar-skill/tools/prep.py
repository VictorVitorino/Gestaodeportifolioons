"""Defringe, recorte justo e âncoras (eixo do corpo + linha do pé) de cada vista -> assets/char/*.png + meta.json"""
import os, json, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(HERE, 'input')          # hero.webp, turnaround.webp (turnaround: 8 vistas lado a lado)
WORK = os.path.join(HERE, 'work')            # máscaras intermediárias
OUT = os.path.join(HERE, '..', 'assets', 'char')
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
import numpy as np, cv2
from PIL import Image
bounds={'v1':(0,237),'v2':(237,452),'v3':(452,617),'v4':(617,832),'v5':(832,1065),'v6':(1065,1280),'v7':(1280,1440),'v8':(1440,1672)}
def largest_component(alpha):
    b=(alpha>40).astype(np.uint8)
    n,lab,stats,_=cv2.connectedComponentsWithStats(b,8)
    if n<=1: return alpha
    idx=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
    keep=(lab==idx).astype(np.uint8)
    keep=cv2.dilate(keep,np.ones((5,5),np.uint8))
    return (alpha.astype(np.float32)*keep).astype(np.uint8)
def defringe(rgb, a):
    af=a.astype(np.float32)/255.
    core=(af>0.97).astype(np.float32)
    out=rgb.astype(np.float32).copy()
    num=np.zeros_like(out); den=np.zeros_like(af)
    for k in (3,7,15,31):
        n=cv2.GaussianBlur(out*core[...,None],(k,k),0); d=cv2.GaussianBlur(core,(k,k),0)
        fill=(den<1e-3)&(d>1e-3)
        num[fill]=n[fill]; den[fill]=d[fill]
    est=num/np.maximum(den,1e-6)[...,None]
    edge=(af<0.97)&(den>1e-3)
    out[edge]=est[edge]
    a2=np.clip((af-0.06)/0.94,0,1)
    return np.clip(out,0,255).astype(np.uint8), (a2*255).astype(np.uint8)
meta={}
src2=np.array(Image.open(os.path.join(INPUT,'turnaround.webp')).convert('RGB'))
items=[(k,) for k in bounds]+[('hero',)]
for (name,) in items:
    mp=os.path.join(WORK,f'mask_birefnet-general_{name}.png')
    if not os.path.exists(mp): print('missing',name); continue
    m=np.array(Image.open(mp).convert('L'))
    if name=='hero': rgb=np.array(Image.open(os.path.join(INPUT,'hero.webp')).convert('RGB'))
    else:
        x0,x1=bounds[name]; rgb=src2[0:835,x0:x1]
    m=largest_component(m)
    # cut floor reflection below shoes: find lowest row with substantial alpha in lower part
    rows=np.where((m>128).sum(axis=1)>2)[0]
    rgb2,a2=defringe(rgb,m)
    ys,xs=np.where(a2>10)
    y0,y1,x0_,x1_=ys.min(),ys.max(),xs.min(),xs.max()
    pad=6
    y0=max(0,y0-pad); x0_=max(0,x0_-pad); y1=min(a2.shape[0]-1,y1+pad); x1_=min(a2.shape[1]-1,x1_+pad)
    crop=np.dstack([rgb2,a2])[y0:y1+1,x0_:x1_+1]
    # anchor: body axis from torso rows (relative to crop), foot baseline = lowest solid row
    H=crop.shape[0]
    a=crop[...,3].astype(np.float32)/255
    solid_rows=np.where((a>0.5).sum(axis=1)>3)[0]
    foot=int(solid_rows.max())
    top=int(solid_rows.min())
    h=foot-top
    t0=int(top+0.23*h); t1=int(top+0.45*h)
    band=a[t0:t1]
    cx=float((band*np.arange(band.shape[1])[None]).sum()/band.sum())
    Image.fromarray(crop).save(os.path.join(OUT,f'{name}.png'))
    meta[name]={'w':int(crop.shape[1]),'h':int(crop.shape[0]),'ax':round(cx,1),'ay':foot,'top':top,'ox':int(x0_),'oy':int(y0)}
    print(name, meta[name])
json.dump(meta,open(os.path.join(OUT,'meta.json'),'w'),indent=1)
