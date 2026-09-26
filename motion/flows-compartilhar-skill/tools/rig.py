"""Separa a vista frontal em camadas (tronco, braço A, braço B) e grava as articulações do rig -> rig_v1.json"""
import os, json
import os
HERE = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(HERE, 'input')          # hero.webp, turnaround.webp (turnaround: 8 vistas lado a lado)
WORK = os.path.join(HERE, 'work')            # máscaras intermediárias
OUT = os.path.join(HERE, '..', 'assets', 'char')
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
D = OUT
S = WORK
import numpy as np, cv2
from PIL import Image, ImageDraw
im=np.array(Image.open(os.path.join(D,'v1.png')).convert('RGBA'))
H,W=im.shape[:2]
A=im[...,3].astype(np.float32)/255.
OX,OY=19,23
def o(p): return (p[0]-OX,p[1]-OY)
# boundary search: for rows y>=y0, find the transparent gap between arm and body near x_guess
def gap_boundary(y0,y1,x_lo,x_hi,guess):
    xs=[]
    for y in range(y0,y1):
        row=A[y,x_lo:x_hi]
        idx=np.where(row<0.35)[0]
        if len(idx)==0: xs.append(np.nan); continue
        runs=[];s=idx[0];p=idx[0]
        for i in idx[1:]:
            if i!=p+1: runs.append((s,p)); s=i
            p=i
        runs.append((s,p))
        g=guess-x_lo
        r=min(runs,key=lambda r: abs((r[0]+r[1])/2-g))
        xs.append(x_lo+(r[0]+r[1])/2)
    xs=np.array(xs,dtype=float)
    ok=~np.isnan(xs)
    xs=np.interp(np.arange(len(xs)),np.where(ok)[0],xs[ok])
    # median smooth
    k=7; pad=np.pad(xs,(k//2,k//2),mode='edge')
    xs=np.array([np.median(pad[i:i+k]) for i in range(len(xs))])
    return list(xs)
rig={}
# ---- ARM A (screen-left)
cutA=[o((38,198)),o((77,244))]
innerA=[o(p) for p in [(77,244),(76,270),(75,297),(72.5,310),(72,340)]]
gA=gap_boundary(340-OY,512-OY,int(60-OX),int(78-OX),69-OX)
autoA=[]
for i,x in enumerate(gA):
    y=340-OY+i
    if x is not None and i%4==0: autoA.append((x,y))
polyA=[cutA[0]]+innerA+autoA+[(autoA[-1][0],H-1),(0,H-1),(0,cutA[0][1])]
# ---- ARM B (screen-right)
cutB=[o((212,198)),o((176,244))]
innerB=[o(p) for p in [(176,244),(177,270),(178,297),(180,310),(180.5,340)]]
gB=gap_boundary(340-OY,512-OY,int(172-OX),int(186-OX),178.5-OX)
autoB=[]
for i,x in enumerate(gB):
    y=340-OY+i
    if x is not None and i%4==0: autoB.append((x,y))
polyB=[cutB[0]]+innerB+autoB+[(autoB[-1][0],H-1),(W-1,H-1),(W-1,cutB[0][1])]
def poly_mask(poly):
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).polygon([tuple(map(float,p)) for p in poly],fill=255)
    m=np.array(m).astype(np.float32)/255.
    return cv2.GaussianBlur(m,(3,3),0.6)
mA=poly_mask(polyA); mB=poly_mask(polyB)
# only arm parts above feet: limit to rows < 520-OY (hands end ~490)
lim=np.zeros((H,W),np.float32); lim[:515-OY]=1
mA*=lim; mB*=lim
armA=im.copy(); armA[...,3]=(A*mA*255).astype(np.uint8)
armB=im.copy(); armB[...,3]=(A*mB*255).astype(np.uint8)
hardA=(mA>0.5).astype(np.uint8); hardB=(mB>0.5).astype(np.uint8)
kern=np.ones((5,5),np.uint8)
eA=cv2.erode(hardA,kern).astype(np.float32); eB=cv2.erode(hardB,kern).astype(np.float32)
torso=im.copy(); torso[...,3]=(A*np.clip(1-eA-eB,0,1)*255).astype(np.uint8)
Image.fromarray(armA).save(os.path.join(D,'v1_armA.png'))
Image.fromarray(armB).save(os.path.join(D,'v1_armB.png'))
Image.fromarray(torso).save(os.path.join(D,'v1_torso.png'))
rig={'armA':{'S':o((60,222)),'E':o((50,335)),'W':o((45,420)),'T':o((48,487)),'cut':cutA},
     'armB':{'S':o((190,222)),'E':o((200,335)),'W':o((203,418)),'T':o((195,487)),'cut':cutB},
     'head':{'N':o((122,174)),'y0':o((0,150))[1],'y1':o((0,180))[1]},
     'w':W,'h':H}
json.dump(rig,open(os.path.join(D,'rig_v1.json'),'w'),indent=1)
# debug overlay
dbg=Image.fromarray(im).convert('RGBA'); bg=Image.new('RGBA',dbg.size,(40,200,90,255)); bg.alpha_composite(dbg)
d=ImageDraw.Draw(bg)
d.line([tuple(p) for p in polyA]+[tuple(polyA[0])],fill=(255,0,0,255),width=1)
d.line([tuple(p) for p in polyB]+[tuple(polyB[0])],fill=(0,0,255,255),width=1)
for k in ['armA','armB']:
    for j in 'SEWT':
        x,y=rig[k][j]; d.ellipse([x-3,y-3,x+3,y+3],outline=(255,255,0,255))
x,y=rig['head']['N']; d.ellipse([x-3,y-3,x+3,y+3],outline=(255,0,255,255))
bg.resize((W*3,H*3),Image.NEAREST).crop((0,0,W*3,560*3)).save(os.path.join(S,'rig_dbg.png'))
print('ok', W,H)
