"""Retime v7 -> 2:00. Motion-aware speed per source frame; intro untouched; inserts uniform;
subtitle reading floor. Outputs: map.npy (source frame per output frame) and new pace.js values."""
import json, re, numpy as np, sys
SP = "<SCRATCH>"
SRC = SP + "/v7/motion/dts-todos-sabem-usam-exemplo/src/pace.js"
js = open(SRC).read()
PACE = json.loads(re.search(r'PACE = (\[.*?\]);', js, re.S).group(1))
INTRO = json.loads(re.search(r'INTRO = (\{.*?\});', js).group(1))
DESIGN = json.loads(re.search(r'INSERT_DESIGN = (\{.*?\});', js).group(1))
SCHED = json.loads(re.search(r'SCHED = (\{.*?\});', js, re.S).group(1))
SUBS = eval(re.search(r'export const SUBS = (\[.*?\n\]);', js, re.S).group(1).replace("'", '"'))
FPS = 24; F0 = INTRO['dur']; TARGET = 120.0
m = np.load(SP + "/v7motion.npy"); NF = len(m)
# --- monotone warp (same as src/util.js)
def warp(keys):
    x = np.array([k[0] for k in keys], float); y = np.array([k[1] for k in keys], float); n = len(x)
    d = np.diff(y) / np.diff(x); mm = np.zeros(n); mm[0] = d[0]; mm[-1] = d[-1]
    for i in range(1, n - 1): mm[i] = 0 if d[i-1]*d[i] <= 0 else (d[i-1]+d[i])/2
    for i in range(n - 1):
        if d[i] == 0: mm[i] = mm[i+1] = 0; continue
        a = mm[i]/d[i]; b = mm[i+1]/d[i]; s = a*a+b*b
        if s > 9: t = 3/np.sqrt(s); mm[i] = t*a*d[i]; mm[i+1] = t*b*d[i]
    def f(t):
        t = np.asarray(t, float); i = np.clip(np.searchsorted(x, t) - 1, 0, n - 2); h = x[i+1]-x[i]; u = (t-x[i])/h
        return (2*u**3-3*u**2+1)*y[i]+(u**3-2*u**2+u)*h*mm[i]+(-2*u**3+3*u**2)*y[i+1]+(u**3-u**2)*h*mm[i+1]
    return f
S = warp(PACE)
ft = np.linspace(0, PACE[-1][0], 200001); st = S(ft)
def story_to_film(s):  # first film time reaching story s (old)
    return float(ft[np.searchsorted(st, s - 1e-9)])
INS = [(PACE[i][0], PACE[i+1][0]) for i in range(len(PACE)-1) if PACE[i][1] == PACE[i+1][1]]
INS = [dict(id=n, a=a, b=b, k=DESIGN[n]/(b-a)) for (a, b), n in zip(INS, ['tour', 'name', 'det'])]
# --- reading windows in OLD global time: (g0, g1, chars)
clean = lambda s: len(re.sub(r'\*', '', s))
READ = []
for a, b, k, txt in SUBS: READ.append((F0 + story_to_film(a), F0 + story_to_film(b), clean(k + ' ' + txt)))
for ins in INS:
    for u0, u1, k, txt, *_ in SCHED[ins['id']]['subs']:
        READ.append((F0 + ins['a'] + u0/ins['k'], F0 + ins['a'] + u1/ins['k'], clean(k + ' ' + txt)))
# pillar lockups (text read on the hold): 'Pilar 0x' + line
LOCK = ['Pilar 01 Onde está o conhecimento', 'Pilar 02 O passo a passo no dia a dia', 'Pilar 03 Quem compartilha, lidera pelo exemplo']
for (s0, s1, s2), txt in zip([[10.0, 11.2, 11.5], [24.0, 24.9, 25.6], [62.0, 62.9, 63.7]], LOCK):
    READ.append((F0 + story_to_film(s1), F0 + story_to_film(s2) + 0.6, clean(txt)))
# --- base speed from motion (smoothed): still -> faster, moving -> gentle
g = np.arange(NF) / FPS
ker = np.exp(-0.5*(np.arange(-18, 19)/7.0)**2); ker /= ker.sum()
ms = np.convolve(np.pad(m, 18, mode='edge'), ker, 'same')[18:-18]
def build(lam):
    base = 1 + lam * np.interp(ms, [0.15, 0.6, 2.0, 6.0, 12.0], [1.5, 1.2, 0.85, 0.6, 0.5])
    sp = base.copy(); sp[g < F0] = 1.0
    for ins in INS:  # inserts: one uniform speed (their cues run on a uniform design clock)
        sel = (g >= F0 + ins['a']) & (g < F0 + ins['b']); sp[sel] = sp[sel].mean()
    # reading floor: every text keeps >= 0.45 s + chars/17 on screen
    for it in range(6):
        for g0, g1, ch in READ:
            sel = (g >= g0) & (g < g1)
            if not sel.any(): continue
            need = 0.45 + ch/17.0; have = (1/sp[sel]).sum()/FPS
            if have < need: sp[sel] *= have/need
        for ins in INS:
            sel = (g >= F0 + ins['a']) & (g < F0 + ins['b']); sp[sel] = sp[sel].min()
        sp[g < F0] = 1.0
    sp = np.clip(sp, 1.0, 2.6)
    # smooth speed changes outside inserts/intro (no abrupt ramps)
    film = g >= F0
    lock = np.zeros(NF, bool)
    for ins in INS: lock |= (g >= F0 + ins['a']) & (g < F0 + ins['b'])
    s2 = np.convolve(np.pad(sp, 18, mode='edge'), ker, 'same')[18:-18]
    sp = np.where(film & ~lock, np.maximum(1.0, s2), sp)
    return sp
lo, hi = 0.0, 6.0
for _ in range(60):
    lam = (lo + hi)/2; sp = build(lam); tot = (1/sp).sum()/FPS
    if tot > TARGET: lo = lam
    else: hi = lam
sp = build(hi); dt = (1/sp)/FPS
newg = np.concatenate([[0], np.cumsum(dt)])   # new global time at the start of each old frame
print("lambda", round(hi, 3), "total", round(newg[-1], 3))
# output frames -> nearest source frame
NOUT = int(round(TARGET*FPS)); tt = (np.arange(NOUT) + 0.5)/FPS
src = np.clip(np.searchsorted(newg, tt) - 1, 0, NF - 1); np.save(SP + "/retime/map.npy", src)
oldg_of_new = lambda t: float(np.interp(t, newg, np.arange(NF + 1)/FPS))
newg_of_old = lambda t: float(np.interp(t, np.arange(NF + 1)/FPS, newg))
# report
print("reading check (old->new s, needed):")
worst = min(((newg_of_old(b)-newg_of_old(a))/(0.45+c/17), a) for a, b, c in READ); print(" worst ratio", round(worst[0], 3))
for ins in INS: print(ins['id'], round(ins['b']-ins['a'], 2), '->', round(newg_of_old(F0+ins['b'])-newg_of_old(F0+ins['a']), 2))
# new PACE: dense keys (every 0.25 s old film) outside inserts, exact flat inserts
keys = []
fts = sorted(set([round(k[0], 4) for k in PACE] + [round(x, 4) for x in np.arange(0, PACE[-1][0], 0.25)]))
for f in fts:
    if any(ins['a'] < f < ins['b'] for ins in INS): continue
    keys.append([round(newg_of_old(F0 + f) - F0, 4), round(float(S(f)), 5)])
for ins in INS:  # exact flat segment ends
    for f in (ins['a'], ins['b']):
        nf = round(newg_of_old(F0 + f) - F0, 4)
        keys = [k for k in keys if abs(k[0] - nf) > 1e-6]; keys.append([nf, [p[1] for p in PACE if p[0] == f][0]])
keys.sort(); keys[0] = [0, PACE[0][1]]
# guarantee strictly increasing film, non-decreasing story
out = [keys[0]]
for k in keys[1:]:
    if k[0] > out[-1][0] + 1e-4 and k[1] >= out[-1][1]: out.append(k)
out[-1][0] = round(TARGET - F0, 4)
json.dump(dict(PACE=out, out=[round(newg_of_old(F0+x)-F0, 3) for x in INTRO['out']],
               ins=[(i['id'], i['a'], i['b']) for i in INS]), open(SP + "/retime/newpace.json", "w"))
print("keys", len(out), "end", out[-1], "intro.out", [round(newg_of_old(F0+x)-F0, 3) for x in INTRO['out']])
# per-section summary
marks = [(0,'Entrada Fabio'),(F0,'Todos Sabem'),(F0+INS[0]['a'],'Tour'),(F0+INS[0]['b'],'441 skills'),(F0+story_to_film(24.0),'Pilar Todos Usam'),(F0+INS[1]['a'],'Anatomia nome'),(F0+INS[1]['b'],'Passos 3-5'),(F0+INS[2]['a'],'Detalhes'),(F0+INS[2]['b'],'Card/442'),(F0+story_to_film(62.0),'Pilar Somos Exemplo'),(F0+story_to_film(65.2),'Ranking'),(F0+story_to_film(78.8),'Cartela'),(NF/FPS,'fim')]
for (a, n), (b, _) in zip(marks, marks[1:]):
    na, nb = newg_of_old(a), newg_of_old(b)
    print(f"{n:22s} {int(a)//60}:{a%60:04.1f} ({b-a:5.1f}s) -> {int(na)//60}:{na%60:04.1f} ({nb-na:5.1f}s)  x{(b-a)/(nb-na):.2f}")
