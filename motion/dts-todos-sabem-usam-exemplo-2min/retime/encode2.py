"""Same as encode.py, but replaces re-rendered source frames (fix/f_#####.jpg) and can apply a LUT."""
import numpy as np, subprocess, sys, os, glob
SP="<SCRATCH>"
FF=SP+"/bin/ffmpeg"; SRC=SP+"/v7/motion/dts-todos-sabem-usam-exemplo/video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4"
OUT=sys.argv[1]; VF=sys.argv[2] if len(sys.argv)>2 else None
mp=np.load("map.npy"); cnt=np.bincount(mp, minlength=mp.max()+1)
W,H=1920,1080; FS=W*H*3//2
fix={int(os.path.basename(f)[2:7]):f for f in glob.glob("fix/f_*.jpg")}
def yuv(jpg):
    return subprocess.run([FF,"-loglevel","error","-i",jpg,"-vf","scale=out_color_matrix=bt709:out_range=tv,format=yuv420p","-f","rawvideo","-"],capture_output=True,check=True).stdout
dec=subprocess.Popen([FF,"-loglevel","error","-i",SRC,"-f","rawvideo","-pix_fmt","yuv420p","-"],stdout=subprocess.PIPE)
args=[FF,"-loglevel","error","-y","-f","rawvideo","-pix_fmt","yuv420p","-s",f"{W}x{H}","-r","24","-color_range","tv","-colorspace","bt709","-i","-","-i","soundtrack_2min.wav"]
if VF: args+=["-vf",VF]
args+=["-c:v","libx264","-preset","slow","-crf","16","-profile:v","high","-pix_fmt","yuv420p","-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-color_range","tv",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",OUT]
enc=subprocess.Popen(args,stdin=subprocess.PIPE)
i=w=r=0
while i < len(cnt):
    buf=dec.stdout.read(FS)
    if len(buf)<FS: break
    if cnt[i] and i in fix: buf=yuv(fix[i]); r+=1
    for _ in range(cnt[i]): enc.stdin.write(buf); w+=1
    i+=1
dec.stdout.close(); dec.wait(); enc.stdin.close(); enc.wait()
print("written",w,"replaced source frames",r)
