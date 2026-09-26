"""Recorte por IA (rembg + BiRefNet) de cada vista. Uso: python3 segone.py birefnet-general v1 (v1..v8, hero).
Rode uma vista por processo (o modelo consome muita memória)."""
import sys, os, time
import os
HERE = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(HERE, 'input')          # hero.webp, turnaround.webp (turnaround: 8 vistas lado a lado)
WORK = os.path.join(HERE, 'work')            # máscaras intermediárias
OUT = os.path.join(HERE, '..', 'assets', 'char')
os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
import numpy as np
from PIL import Image
import onnxruntime as ort
from rembg import new_session, remove
model, name = sys.argv[1], sys.argv[2]
out_path=os.path.join(WORK, f'mask_{model}_{name}.png')
if os.path.exists(out_path): print('skip', name); sys.exit(0)
sess=new_session(model)
bounds={'v1':(0,237),'v2':(237,452),'v3':(452,617),'v4':(617,832),'v5':(832,1065),'v6':(1065,1280),'v7':(1280,1440),'v8':(1440,1672)}
if name=='hero': img=Image.open(os.path.join(INPUT,'hero.webp'))
else:
    x0,x1=bounds[name]; img=Image.open(os.path.join(INPUT,'turnaround.webp')).crop((x0,0,x1,835))
a=np.array(img.convert('RGB')); h,w=a.shape[:2]; side=max(h,w)+40
py=(side-h)//2; px=(side-w)//2
pad=np.pad(a,((py,side-h-py),(px,side-w-px),(0,0)),mode='edge')
t=time.time()
m=np.array(remove(Image.fromarray(pad), session=sess, only_mask=True, post_process_mask=False))[py:py+h, px:px+w]
Image.fromarray(m).save(out_path)
print(name,'done',round(time.time()-t,1),'s',flush=True)
