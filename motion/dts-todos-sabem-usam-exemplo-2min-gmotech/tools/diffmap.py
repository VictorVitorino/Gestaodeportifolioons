"""Where did the picture change? For every re-rendered v7 source frame: the v7 original vs the new render, at
960x540 grey; the changed area = pixels differing by > 24 levels after a 3x3 opening (compression noise and
tiny edge shifts removed). Output: diffmap.json {source frame: changed pixel count}."""
import numpy as np, subprocess, os, json, cv2
W, H = 960, 540
dv = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', 'v7.mp4', '-vf', f'scale={W}:{H}:flags=area,format=gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
done = set(int(f[2:7]) for f in os.listdir('rend') if f.endswith('.jpg') and 'tmp' not in f)
res = json.load(open('diffmap.json')) if os.path.exists('diffmap.json') else {}
k = np.ones((3, 3), np.uint8)
i = 0
while True:
    buf = dv.stdout.read(W * H)
    if len(buf) < W * H: break
    if i in done and str(i) not in res:
        a = np.frombuffer(buf, np.uint8).reshape(H, W)
        b = cv2.resize(cv2.imread(f'rend/f_{i:05d}.jpg', cv2.IMREAD_GRAYSCALE), (W, H), interpolation=cv2.INTER_AREA)
        m = (cv2.absdiff(a, b) > 24).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
        res[str(i)] = int(m.sum())
    i += 1
json.dump(res, open('diffmap.json', 'w'))
print('frames', len(res))
