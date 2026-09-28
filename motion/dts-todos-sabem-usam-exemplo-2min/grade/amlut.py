"""A&M cinematic grade as a 33^3 .cube LUT: violet -> A&M deep navy/blue, blues -> #0085CA, keep orange/gold."""
import numpy as np, colorsys
N=33; out=[]
def win(h,a,b,c,d):  # trapezoid weight on hue degrees
    if h<a or h>d: return 0.0
    if h<b: return (h-a)/(b-a)
    if h<=c: return 1.0
    return (d-h)/(d-c)
for bi in range(N):
    for gi in range(N):
        for ri in range(N):
            r,g,b=ri/(N-1),gi/(N-1),bi/(N-1)
            h,s,v=colorsys.rgb_to_hsv(r,g,b); H=h*360
            wv=win(H,225,248,292,318)*min(1,s*3)          # violets/purples
            wm=win(H,292,312,352,360.01)*min(1,s*3)       # magenta highlights
            wb=win(H,185,195,222,240)*min(1,s*3)           # blues
            H2=H+(214-H)*0.88*wv                            # violet -> navy blue
            H2=H2+(202-H2)*0.5*wb                           # blues -> A&M blue (#0085CA ~ 200°)
            s2=s*(1-0.16*wv)*(1-0.30*wm)
            if wm>0: H2=H2+((378 if H2>300 else H2)-H2)*0.75*wm  # pinks -> warm orange (18°)
            v2=v
            # deep backgrounds a touch darker/denser (navy) when violet
            v2=v2*(1-0.14*wv*(1-0.6*v))
            r2,g2,b2=colorsys.hsv_to_rgb((H2%360)/360,min(1,s2),v2)
            # gentle filmic S-curve + navy toe
            def curve(x): return x+0.06*np.sin(np.pi*(x-0.5))*(x*(1-x))*4*0.5
            r2,g2,b2=curve(r2),curve(g2),curve(b2)
            lift=0.012*(1-v2)**3; r2,g2,b2=r2,g2+lift*0.5,b2+lift*1.2
            out.append((min(1,max(0,r2)),min(1,max(0,g2)),min(1,max(0,b2))))
with open("am_grade.cube","w") as f:
    f.write('TITLE "A&M cinematic"\nLUT_3D_SIZE 33\n')
    for c in out: f.write(f"{c[0]:.6f} {c[1]:.6f} {c[2]:.6f}\n")
print("ok")
