"""Rebuild the 2:00 frame map: which v7 source frame each output frame of the 2:00 cut shows.
Small grey thumbnails, full distance matrix, Viterbi with steps of 1..4 source frames."""
import numpy as np, subprocess
def thumbs(f):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f, '-vf', 'scale=48:27:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 27 * 48).astype(np.float32)
A = thumbs('cut_orig.mp4'); B = thumbs('v7.mp4'); print(A.shape, B.shape)
D = (A * A).sum(1)[:, None] + (B * B).sum(1)[None, :] - 2 * A @ B.T; D = np.maximum(D, 0) / A.shape[1]
NJ, NI = D.shape; INF = 1e18
cost = np.full(NI, INF); cost[:8] = D[0, :8]; back = np.zeros((NJ, NI), np.int16)
for j in range(1, NJ):
    best = np.full(NI, INF); arg = np.zeros(NI, np.int16)
    for s in (1, 2, 3, 4):
        c = np.full(NI, INF); c[s:] = cost[:-s]
        m = c < best; best[m] = c[m]; arg[m] = s
    cost = best + D[j]; back[j] = arg
i = int(np.argmin(cost)); path = [i]
for j in range(NJ - 1, 0, -1): i -= int(back[j, i]); path.append(i)
path = np.array(path[::-1]); np.save('map.npy', path)
res = D[np.arange(NJ), path]
print('end', path[-1], 'of', NI - 1, 'steps', np.bincount(np.diff(path)), 'resid mean', res.mean().round(2), 'max', res.max().round(1), 'at', int(res.argmax()))
