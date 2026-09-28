import numpy as np, subprocess, sys
SP="<SCRATCH>"
FF=SP+"/bin/ffmpeg"; SRC=SP+"/v7/motion/dts-todos-sabem-usam-exemplo/video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4"
OUT=SP+"/retime/DTS_Todos_Sabem_Usam_Exemplo_3D_2min.mp4"
mp=np.load("map.npy"); cnt=np.bincount(mp, minlength=mp.max()+1)
W,H=1920,1080; FS=W*H*3//2
dec=subprocess.Popen([FF,"-loglevel","error","-i",SRC,"-f","rawvideo","-pix_fmt","yuv420p","-"],stdout=subprocess.PIPE)
enc=subprocess.Popen([FF,"-loglevel","error","-y","-f","rawvideo","-pix_fmt","yuv420p","-s",f"{W}x{H}","-r","24","-i","-",
  "-i","soundtrack_2min.wav","-c:v","libx264","-preset","slow","-crf","17","-profile:v","high",
  "-colorspace","bt709","-color_primaries","bt709","-color_trc","bt709","-color_range","tv",
  "-c:a","aac","-b:a","192k","-ar","48000","-shortest","-movflags","+faststart",OUT],stdin=subprocess.PIPE)
i=0; w=0
while i < len(cnt):
    buf=dec.stdout.read(FS)
    if len(buf)<FS: break
    for _ in range(cnt[i]): enc.stdin.write(buf); w+=1
    i+=1
dec.stdout.close(); dec.wait(); enc.stdin.close(); enc.wait()
print("source frames read",i,"written",w,"expected",len(mp))
