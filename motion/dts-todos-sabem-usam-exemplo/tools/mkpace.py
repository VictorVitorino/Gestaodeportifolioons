"""Writes the PACE curve of src/pace.js from a list of beats: [story key, film seconds since the
previous key]. A repeated story key is a flat segment: an insert (tour, name, Detalhes), whose
length must match INSERT_DESIGN (the inserts run at k = 1).  python3 tools/mkpace.py"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SEGS = [
    # opening: the cut from Fabio's clip, the title read over the pillar, then the pillar and its lockup
    (10.0, 0), (10.9, 2.2), (11.0, 1.7), (11.2, 1.4), (11.5, 4.3),
    # Todos Sabem: the Início frame, the FLOWS tour, the library ring (441), the six steps announced
    (12.0, 1.0), (12.9, 2.4), (15.0, 3.8), (15.0, 14.2), (15.9, 1.0), (18.6, 3.4), (20.4, 2.6), (22.4, 2.6), (23.4, 3.0), (24.0, 1.0),
    # Todos Usam: the pillar, then the six steps (name anatomy and Detalhes are inserts)
    (24.9, 2.4), (25.6, 4.3), (26.7, 1.7), (28.0, 1.7), (28.6, 0.6), (30.2, 1.8), (31.4, 1.0), (35.3, 4.2), (36.9, 1.7), (36.9, 6.8),
    (37.4, 0.5), (38.7, 1.8), (40.4, 1.5), (42.2, 2.4), (43.7, 2.3), (45.9, 1.8), (46.9, 1.0), (48.5, 2.9), (49.8, 1.9), (52.9, 2.9),
    (53.9, 0.9), (54.8, 0.9), (55.6, 0.8), (56.9, 2.3), (57.2, 1.3), (57.2, 20.2),
    # published: fold, flight, landing (442)
    (57.4, 0.4), (58.3, 1.2), (60.2, 4.5), (62.0, 3.6),
    # Somos Exemplo: the pillar, threads of reuse, the ranking, the end card
    (62.9, 3.4), (63.7, 4.7), (65.2, 1.8), (68.5, 3.6), (69.6, 2.6), (72.9, 4.2), (73.4, 0.8), (75.2, 2.9), (75.9, 1.1), (77.3, 2.9),
    (78.8, 2.2), (81.0, 6.0), (82.2, 2.2),
]
x, P = 0.0, []
for s, d in SEGS:
    x += d; P.append([round(x, 3), s])
src_path = os.path.join(HERE, '..', 'src', 'pace.js')
src = open(src_path).read()
design = json.loads(re.search(r'INSERT_DESIGN = (\{.*?\});', src).group(1))
flat = [P[i + 1][0] - P[i][0] for i in range(len(P) - 1) if P[i][1] == P[i + 1][1]]
for (n, d), f in zip(design.items(), flat):
    assert abs(d - f) < 1e-6, f'insert {n}: design {d} s but the flat segment lasts {f} s'
body = ', '.join(json.dumps([int(a) if a == int(a) else a, int(b) if b == int(b) else b]) for a, b in P)
lines, cur = [], '  '
for tok in re.findall(r'\[[^\]]*\]', body):
    if len(cur) + len(tok) > 118: lines.append(cur.rstrip()); cur = '  '
    cur += tok + ', '
lines.append(cur.rstrip().rstrip(','))
src = re.sub(r'export const PACE = \[.*?\];', 'export const PACE = [\n' + '\n'.join(lines) + '\n];', src, count=1, flags=re.S)
open(src_path, 'w').write(src)
print('film %.1f s (+ intro): %d keys' % (P[-1][0], len(P)))
