"""Before/after QA: the film being corrected (orig 720p) vs the GMO TECH film, at the moments that changed,
plus a check that unchanged moments stay the same. python3 qa_v12.py <new.mp4> <out.jpg>"""
import sys, subprocess, numpy as np, cv2
new, out = sys.argv[1], sys.argv[2]
ORIG = '../v11/orig.mp4'
def frame(f, t):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', f, '-frames:v', '1', '-vf', 'scale=1280:720',
                          '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(720, 1280, 3).copy()
CHANGED = [(28.9, 'Biblioteca (tour)'), (33.5, '441 · cards'), (38.5, 'cards em destaque'), (49.6, 'nome digitado'),
           (51.2, 'nome completo'), (53.3, 'anatomia · Service Line'), (54.6, 'anatomia · entregável'), (58.5, 'topo do formulário'),
           (72.8, 'Detalhes · Título'), (90.6, 'card NOVA'), (93.4, '442 na Biblioteca')]
rows = []
for t, lbl in CHANGED:
    a, b = frame(ORIG, t), frame(new, t)
    a = cv2.resize(a, (640, 360), interpolation=cv2.INTER_AREA); b = cv2.resize(b, (640, 360), interpolation=cv2.INTER_AREA)
    for im, tag in ((a, 'ANTES'), (b, 'DEPOIS')):
        cv2.rectangle(im, (0, 0), (640, 30), (20, 20, 40), -1)
        cv2.putText(im, f'{tag}  {int(t) // 60}:{t % 60:04.1f}  {lbl}', (10, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    rows.append(np.hstack([a, np.full((360, 8, 3), 255, np.uint8), b]))
sheet = np.vstack([np.vstack([r, np.full((8, r.shape[1], 3), 255, np.uint8)]) for r in rows])
cv2.imwrite(out, sheet, [cv2.IMWRITE_JPEG_QUALITY, 86])
print('changed moments', len(CHANGED))
for t in [2.0, 6.0, 12.0, 16.0, 21.0, 25.0, 42.0, 44.0, 64.0, 80.0, 86.0, 98.0, 104.0, 110.0, 117.5]:
    a, b = frame(ORIG, t).astype(float), frame(new, t).astype(float)
    d = np.abs(a - b).mean(2)
    print(f'unchanged? t={t:6.1f}s  mean {d.mean():.2f}  p99 {np.percentile(d, 99):.1f}')
