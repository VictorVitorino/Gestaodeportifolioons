"""v12 (GMO TECH): the same 2:00 cut, frame for frame. Output frame j shows v7 source frame map[j] (map.npy,
rebuilt by mkmap.py). The intro (source < 228, Fabio's clip) comes from the v7 film untouched; every 3D
source frame the cut uses was re-rendered by the v7 pipeline with the GMO TECH texts (rend/f_#####.jpg).
The audio stream is copied bit-exact from the film being corrected.
python3 encode_v12.py <out.mp4> <audio_src.mp4> <W> <H> <kbps> <pass 1|2>"""
import numpy as np, subprocess, sys, os
out, asrc, W, H, kbps, ps = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
mp = np.load('map.npy')
if os.environ.get('LIMIT'): mp = mp[:int(os.environ['LIMIT'])]      # quick test on the opening frames
cnt = np.bincount(mp, minlength=mp.max() + 1)
rendered = sorted(int(f[2:7]) for f in os.listdir('rend') if f.startswith('f_') and f.endswith('.jpg') and 'tmp' not in f)
need = sorted(set(int(x) for x in mp if x >= 228))
missing = sorted(set(need) - set(rendered))
assert not missing, f'{len(missing)} frames not rendered yet, e.g. {missing[:5]}'
with open('rend_list.txt', 'w') as f:
    for n in need: f.write(f"file 'rend/f_{n:05d}.jpg'\nduration 0.041667\n")
CONV = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p'
FW, FH = 1920, 1080; FS = FW * FH * 3 // 2
dv = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', 'v7.mp4', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'], stdout=subprocess.PIPE)
dr = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'rend_list.txt', '-vf', CONV, '-fps_mode', 'passthrough',
                       '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'], stdout=subprocess.PIPE)
vf = [] if (W, H) == (FW, FH) else ['-vf', f'scale={W}:{H}:flags=lanczos']
args = ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', f'{FW}x{FH}', '-r', '24',
        '-color_range', 'tv', '-colorspace', 'bt709', '-i', '-']
if ps == 2: args += ['-i', asrc, '-map', '0:v', '-map', '1:a']
args += vf + ['-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{kbps}k', '-pass', str(ps), '-passlogfile', f'x264_{W}',
        '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
args += ['-an', '-f', 'null', '-'] if ps == 1 else ['-c:a', 'copy', '-movflags', '+faststart', '-f', 'mp4', out + '.part']
enc = subprocess.Popen(args, stdin=subprocess.PIPE)
w = r = 0
for i in range(len(cnt)):
    buf = dv.stdout.read(FS)
    if len(buf) < FS: break
    if i >= 228 and cnt[i]:
        buf = dr.stdout.read(FS); r += 1
        assert len(buf) == FS
    for _ in range(cnt[i]): enc.stdin.write(buf); w += 1
dv.stdout.close(); dv.wait(); dr.stdout.close(); dr.wait(); enc.stdin.close(); enc.wait()
assert enc.returncode == 0, 'encoder failed'
if ps == 2: os.replace(out + '.part', out)
print('pass', ps, 'written', w, 'of', len(mp), 're-rendered source frames', r)
