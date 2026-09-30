"""Every frame of the film sent by the team vs the GMO TECH film (both 1280x720): changed area per frame
(pixels differing by > 28 levels at 640x360 grey, after a 3x3 opening). Prints the changed time ranges, so
nothing can change outside the GMO texts unnoticed. python3 fullcheck.py <new.mp4>"""
import sys, subprocess, numpy as np, cv2
W, H = 640, 360
def reader(f):
    return subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', f, '-vf', f'scale={W}:{H}:flags=area,format=gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
a, b = reader('../v11/orig.mp4'), reader(sys.argv[1])
k = np.ones((3, 3), np.uint8); ch = []
while True:
    x, y = a.stdout.read(W * H), b.stdout.read(W * H)
    if len(x) < W * H or len(y) < W * H: break
    m = (cv2.absdiff(np.frombuffer(x, np.uint8).reshape(H, W), np.frombuffer(y, np.uint8).reshape(H, W)) > 28).astype(np.uint8)
    ch.append(int(cv2.morphologyEx(m, cv2.MORPH_OPEN, k).sum()))
ch = np.array(ch); np.save('fullcheck.npy', ch)
print('frames compared', len(ch))
on = ch > 20; runs = []; j = 0
while j < len(ch):
    if on[j]:
        s = j
        while j < len(ch) and (on[j] or (j + 12 < len(ch) and on[j:j + 12].any())): j += 1
        runs.append((s, j - 1, int(ch[s:j].max())))
    j += 1
for s, e, mx in runs: print(f'changed {s/24:6.2f}s - {e/24:6.2f}s  (max {mx} px at 640x360)')
