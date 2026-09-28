"""FLOWS · O Fio Dourado (v9) — original score and sound design for Fabio's journey (2:16).
The picture (src/cut9.js) is Fabio's footage, then the v7 film as one continuous take. Every v7 sound
effect inside the take is carried over by mapping its v7 time through the take's time map (to9), so the
clicks, the typing, the model drum and the trophy land on their frames. The music is new: the theme
written in light, the touch on the Biblioteca and the portal into the FLOWS universe, the orbit of
skills, the button he offers and the press that opens the golden iris, a calm groove under the form,
a shimmer each time Fabio is built by the light, a fanfare for the one, and the finale."""
import subprocess, tempfile
import numpy as np, wave, sys, math, json, re, os
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
PACE = json.loads(re.search(r'PACE = (\[.*?\]);', open(os.path.join(HERE, '..', 'src', 'pace.js')).read(), re.S).group(1))
IDENT = float(re.search(r'export const IDENT = ([0-9.]+)', open(os.path.join(HERE, '..', 'src', 'ident.js')).read()).group(1))
INTRO = json.loads(re.search(r'INTRO = (\{.*?\});', open(os.path.join(HERE, '..', 'src', 'pace.js')).read()).group(1))
ID = IDENT if INTRO['ident'] else 0.0
FILM0 = ID + INTRO['dur']             # v7: the 3D film starts here (v7 global time = FILM0 + v7 film time)
CUT = json.loads(subprocess.check_output(['node', os.path.join(HERE, '..', 'tools', 'cut9json.mjs')]))
DUR = CUT['DURATION']
N = int(SR * DUR)
rng = np.random.default_rng(7)
mus = np.zeros((2, N)); sfx = np.zeros((2, N))
def t_arr(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
# story time -> global time: the inverse of the monotone warp in src/util.js
_x = np.array([k[0] for k in PACE], float); _y = np.array([k[1] for k in PACE], float)
_n = len(_x); _d = np.diff(_y) / np.diff(_x); _m = np.zeros(_n); _m[0] = _d[0]; _m[-1] = _d[-1]
for _i in range(1, _n - 1): _m[_i] = 0 if _d[_i - 1] * _d[_i] <= 0 else (_d[_i - 1] + _d[_i]) / 2
for _i in range(_n - 1):
    if _d[_i] == 0: _m[_i] = _m[_i + 1] = 0; continue
    _a = _m[_i] / _d[_i]; _b = _m[_i + 1] / _d[_i]; _s = _a * _a + _b * _b
    if _s > 9: _tau = 3 / np.sqrt(_s); _m[_i] = _tau * _a * _d[_i]; _m[_i + 1] = _tau * _b * _d[_i]
def _S(t):
    t = np.asarray(t, float); i = np.clip(np.searchsorted(_x, t) - 1, 0, _n - 2); h = _x[i + 1] - _x[i]; u = (t - _x[i]) / h
    return (2*u**3 - 3*u**2 + 1)*_y[i] + (u**3 - 2*u**2 + u)*h*_m[i] + (-2*u**3 + 3*u**2)*_y[i + 1] + (u**3 - u**2)*h*_m[i + 1]
_nt = np.linspace(0, _x[-1], 400001); _st = _S(_nt)
def T(s):
    """global time of story time s"""
    return FILM0 + float(np.interp(s, _st, _nt))
# inserts: flat segments of PACE -> (global start, global end), in order tour / name / det
PACE_SRC = open(os.path.join(HERE, '..', 'src', 'pace.js')).read()
DESIGN = json.loads(re.search(r'INSERT_DESIGN = (\{.*?\});', PACE_SRC).group(1))
SCHED = json.loads(re.search(r'SCHED = (\{.*?\});', PACE_SRC, re.S).group(1))   # insert schedules (shared with the picture)
INS = [(FILM0 + PACE[i][0], FILM0 + PACE[i + 1][0]) for i in range(len(PACE) - 1) if PACE[i][1] == PACE[i + 1][1]]
INS = [(a, b, DESIGN[n] / (b - a)) for (a, b), n in zip(INS, ['tour', 'name', 'det'])]   # (start, end, design seconds per film second)
I_TOUR, I_NAME, I_DET = INS
def D(s0, s1): return T(s1) - T(s0)

# ---- v7 -> v8: each 3D shot of the cut plays v7 film time nt7 = f(T8) (the monotone warp of src/util.js)
def _warp(keys):
    x = np.array([k[0] for k in keys], float); y = np.array([k[1] for k in keys], float); n = len(x)
    d = np.diff(y) / np.diff(x); m = np.zeros(n); m[0] = d[0]; m[-1] = d[-1]
    for i in range(1, n - 1): m[i] = 0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2
    for i in range(n - 1):
        if d[i] == 0: m[i] = m[i + 1] = 0; continue
        a = m[i] / d[i]; b = m[i + 1] / d[i]; s = a * a + b * b
        if s > 9: tau = 3 / np.sqrt(s); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]
    def f(t):
        t = np.asarray(t, float); i = np.clip(np.searchsorted(x, t) - 1, 0, n - 2); h = x[i + 1] - x[i]; u = (t - x[i]) / h
        return (2*u**3 - 3*u**2 + 1)*y[i] + (u**3 - 2*u**2 + u)*h*m[i] + (-2*u**3 + 3*u**2)*y[i + 1] + (u**3 - u**2)*h*m[i + 1]
    return f
SH = []
for s_ in CUT['SHOTS']:
    if s_['kind'] == 'foot': continue
    tt = np.linspace(s_['a'], s_['b'], 4000); SH.append((tt, _warp(s_['map'])(tt)))
def to8(t7):
    """v7 global time -> v9 time on the take, or None when the cut does not show that moment"""
    nt = t7 - FILM0
    for tt, nn in SH:
        if nn[0] - 1e-6 <= nt <= nn[-1] + 1e-6: return float(np.interp(nt, nn, tt))
    return None
G8 = lambda s: to8(T(s))                 # story time -> v9 time
def add(buf, t0, sig, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.414, sig * r * 1.414])
    if i0 < 0: sig = sig[:, -i0:]; i0 = 0
    n = min(sig.shape[1], N - i0)
    if n > 0: buf[:, i0:i0 + n] += sig[:, :n] * gain
def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    A = min(A, n); e[:A] = np.linspace(0, 1, A, endpoint=False)
    D = min(D, max(0, n - A)); e[A:A + D] = np.linspace(1, s, D, endpoint=False)
    if R > 0 and R < n: e[-R:] *= np.linspace(1, 0, R)
    return e
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

# ------------------------------------------------------------------ instruments
def saw_pad(freq, d, bright=0.5, detune=0.12):
    t = t_arr(d); out = np.zeros_like(t)
    for dt in (-detune, 0, detune):
        f = freq * 2 ** (dt / 12)
        ph = rng.random() * 6.28
        for k in range(1, 14):
            if f * k > 9000: break
            out += np.sin(2 * np.pi * f * k * t + ph * k) / k * (bright ** ((k - 1) * 0.35))
    return out / 6

def pluck(freq, d=1.2, tone=0.5):
    t = t_arr(d)
    e = np.exp(-t * (4.5 + tone * 3))
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t * 14)
    atk = np.minimum(1, t / 0.004)
    return s * e * atk

def bell(freq, d=2.5, idx=2.2, ratio=3.5):
    t = t_arr(d)
    mod = np.sin(2 * np.pi * freq * ratio * t) * idx * np.exp(-t * 3.2)
    s = np.sin(2 * np.pi * freq * t + mod) * np.exp(-t * 2.2) * np.minimum(1, t / 0.002)
    return s

def sub_boom(d=1.8, f0=70, f1=32):
    t = t_arr(d)
    f = f1 + (f0 - f1) * np.exp(-t * 5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 2.4) * np.minimum(1, t / 0.005)

def noise(d): return rng.standard_normal(int(d * SR))

def pink(n):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X /= np.sqrt(np.maximum(f, 20.0))
    y = np.fft.irfft(X, n)
    return y / (np.std(y) + 1e-9)

def whoosh(d=0.8, f0=300, f1=4000, peak=0.6, q=1.2):
    """Pink noise through a smoothly gliding band-pass (STFT shaped, click free)."""
    n = int(d * SR); frame, hop = 2048, 256
    f0, f1 = min(f0, 6000), min(f1, 6000)
    x = pink(n + frame)
    win = np.hanning(frame); freqs = np.fft.rfftfreq(frame, 1 / SR)
    out = np.zeros(n + frame); norm = np.zeros(n + frame)
    bw = 0.55 + 0.35 * q
    for i in range(0, n, hop):
        u = i / n
        fc = f0 * (f1 / f0) ** u
        g = np.exp(-0.5 * (np.log2(np.maximum(freqs, 20) / fc) / bw) ** 2)
        y = np.fft.irfft(np.fft.rfft(x[i:i + frame] * win) * g, frame) * win
        out[i:i + frame] += y; norm[i:i + frame] += win ** 2
    out = out[:n] / np.maximum(norm[:n], 1e-3)
    t = np.arange(n) / n
    e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak + 1e-9)) ** 1.5)
    out *= e
    return out / (np.abs(out).max() + 1e-9)

def riser(d=1.2, f0=200, f1=2400):
    t = t_arr(d)
    f = f0 * (f1 / f0) ** (t / d)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
    return (whoosh(d, f0, min(f1 * 1.6, 5000), 0.95, 1.2) * 0.8 + tone) * (t / d) ** 2

def click(f=2600, d=0.035, noise_amt=0.5):
    t = t_arr(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 180) + hp(noise(d), 1500) * np.exp(-t * 400) * noise_amt
    return s

def key(seed):
    r = np.random.default_rng(seed)
    d = 0.06; t = t_arr(d)
    body = bp(r.standard_normal(len(t)), 1800 + r.random() * 1600, 6500) * np.exp(-t * 160)
    thock = np.sin(2 * np.pi * (180 + r.random() * 60) * t) * np.exp(-t * 90) * 0.5
    return (body * 0.9 + thock) * (0.7 + r.random() * 0.5)

def pop(f0=900, f1=280, d=0.12):
    t = t_arr(d)
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * np.minimum(1, t / 0.002)

def thump(d=0.25):
    t = t_arr(d)
    f = 70 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16) + lp(noise(d), 900) * np.exp(-t * 35) * 0.6

def sparkle(d=0.8, n=18, lo=3000, hi=9000, seed=1):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR))
    for i in range(n):
        st = r.random() * d * 0.7; f = lo + r.random() * (hi - lo)
        s = np.sin(2 * np.pi * f * t_arr(0.25)) * np.exp(-t_arr(0.25) * 22) * (0.3 + r.random() * 0.7)
        i0 = int(st * SR); m = min(len(s), len(out) - i0); out[i0:i0 + m] += s[:m]
    return out

def kick():
    t = t_arr(0.35)
    f = 45 + 80 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + hp(noise(0.35), 3000) * np.exp(-t * 300) * 0.25

def shaker(seed):
    r = np.random.default_rng(seed); d = 0.07; t = t_arr(d)
    return hp(r.standard_normal(len(t)), 6000) * np.exp(-t * 60) * (0.6 + 0.4 * r.random())

def reverse_swell(d=1.2):
    x = pink(int(d * SR)); x = bp(x, 1500, 7000)
    t = t_arr(d)
    return x * (t / d) ** 3


# ------------------------------------------------------------------ extra instruments (whimsical, Pixar-like palette)
def pizz(freq, d=0.7):
    t = t_arr(d)
    body = np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 18) + 0.2 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t * 26)
    return body * np.exp(-t * 9) * np.minimum(1, t / 0.003)

def celesta(freq, d=1.8):
    t = t_arr(d)
    s = np.sin(2 * np.pi * freq * t + 1.2 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t * 7)) * np.exp(-t * 3.2)
    s += 0.3 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 5)
    return s * np.minimum(1, t / 0.002)

def glock(freq, d=1.6):
    t = t_arr(d)
    return (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 10)) * np.exp(-t * 2.6) * np.minimum(1, t / 0.001)

def strings(freq, d, bright=0.45):
    t = t_arr(d)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.6)
    out = np.zeros_like(t)
    for dt in (-0.07, 0.0, 0.08):
        f = freq * 2 ** (dt / 12)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        for k in range(1, 10):
            if f * k > 7000: break
            out += np.sin(ph * k + rng.random() * 6) / k * (bright ** ((k - 1) * 0.4))
    return lp(out / 5, 2600)

def piano(freq, d=2.2):
    t = t_arr(d)
    s = np.zeros_like(t)
    for k, a in [(1, 1.0), (2, 0.45), (3, 0.22), (4, 0.12), (5, 0.06)]:
        s += a * np.sin(2 * np.pi * freq * k * 1.0008 ** k * t) * np.exp(-t * (1.6 + k * 0.9))
    s += lp(noise(d), 3000) * np.exp(-t * 120) * 0.08
    return s * np.minimum(1, t / 0.004)

def snap(seed):
    r = np.random.default_rng(seed); d = 0.09; t = t_arr(d)
    return bp(r.standard_normal(len(t)), 1800, 5200) * np.exp(-t * 70)

def boing(f0=180, f1=420, d=0.35):
    t = t_arr(d)
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 12)) + 40 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * np.minimum(1, t / 0.004)

# ------------------------------------------------------------------ v3 instruments (ranking fanfare, UI motion)
def snare_roll(d, dens=16.0, seed=5):
    r = np.random.default_rng(seed); out = np.zeros(int(d * SR)); t = 0.0
    while t < d:
        u = t / d; h = t_arr(0.06)
        hit = bp(r.standard_normal(len(h)), 900, 6000) * np.exp(-h * 60) + np.sin(2 * np.pi * 190 * h) * np.exp(-h * 50) * 0.4
        i0 = int(t * SR); m = min(len(hit), len(out) - i0); out[i0:i0 + m] += hit[:m] * (0.25 + 0.75 * u ** 1.5) * (0.8 + 0.4 * r.random())
        t += 1.0 / (dens * (1 + 1.3 * u))
    return out
def crash(d=2.8):
    t = t_arr(d)
    return (hp(noise(d), 4500) * np.exp(-t * 1.6) + bp(noise(d), 2500, 9000) * np.exp(-t * 3.5) * 0.6) * np.minimum(1, t / 0.003)
def brass(freq, d=1.6):
    t = t_arr(d); out = np.zeros_like(t)
    for dt in (-0.06, 0.0, 0.07):
        f = freq * 2 ** (dt / 12)
        for k in range(1, 16):
            if f * k > 8000: break
            out += np.sin(2 * np.pi * f * k * t + rng.random() * 6) / k
    a = np.exp(-t * 3.0) * np.minimum(1, t / 0.04)
    y = lp(out, 900) * (1 - a) + lp(out, 4200) * a
    return y / 4 * env_adsr(len(t), 0.03, 0.25, 0.7, 0.45)
def timpani(freq=55.0, d=1.4):
    t = t_arr(d); f = freq * (1 + 0.06 * np.exp(-t * 8))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.8) + lp(noise(d), 500) * np.exp(-t * 25) * 0.4) * np.minimum(1, t / 0.003)
def tink(freq=3200, d=0.5): return bell(freq, d, 1.4, 2.76) * 0.8
def marker(d=0.28):
    t = t_arr(d); return bp(noise(d), 2500, 8000) * np.sin(np.pi * np.minimum(1, t / d)) ** 0.8 * 0.6
def stamp():
    return thump(0.35) * 1.2 + np.pad(bp(noise(0.12), 400, 3000) * np.exp(-t_arr(0.12) * 40) * 0.8, (0, int(0.35 * SR) - int(0.12 * SR)))
def confetti_pop(seed):
    r = np.random.default_rng(seed); d = 0.4; t = t_arr(d)
    return bp(r.standard_normal(len(t)), 300, 5000) * np.exp(-t * 18) * 1.2 + sub_boom(d, 140, 60) * 0.5

def cue(t7, sig, g=1.0, pan=0.0):          # a v7 cue (v7 global time), placed on the cut
    t8 = to8(t7)
    if t8 is not None: add(sfx, t8, sig, g, pan)
def scue(s, sig, g=1.0, pan=0.0): cue(T(s), sig, g, pan)        # story-time cue
def cue8(t8, sig, g=1.0, pan=0.0): add(sfx, t8, sig, g, pan)    # a v8 cue
def mus8(t8, sig, g=1.0, pan=0.0): add(mus, t8, sig, g, pan)
def ticks_for(c0, c1, n, f0=2200, g=0.1, pan=0.0, p=3):
    # soft ticks at equal value steps of an outCubic count-up between story times c0 and c1
    for i in range(1, n + 1):
        u = 1 - (1 - i / n) ** (1 / p)
        scue(c0 + u * (c1 - c0), click(f0 + i * 20, 0.022, 0.12), g, pan)
def swell(d, f0=180, f1=900):
    """airy rising shimmer (filtered noise + soft tone), for things emerging from light"""
    return riser(d, f0, f1) * 0.6 + reverse_swell(d) * 0.4
def shimmer(d=1.6, seed=1, lo=3500, hi=9500, n=16):
    return sparkle(d, n, lo, hi, seed) * np.linspace(1, 0.4, int(d * SR))

# ================================================================== SCORE on the new clock: D major, 84 bpm
BPM = 84; beat = 60 / BPM; bar = beat * 4
CH = {'D': [50, 57, 62, 66, 69], 'Bm': [47, 54, 59, 62, 66], 'G': [43, 50, 55, 59, 62], 'A': [45, 52, 57, 61, 64], 'Em': [40, 47, 52, 55, 59], 'F#m': [42, 49, 54, 57, 61], 'Gmaj7': [43, 50, 54, 59, 62], 'Asus': [45, 52, 57, 62, 64], 'Dadd9': [50, 57, 62, 64, 66], 'Dmaj9': [50, 57, 61, 64, 66]}
def pads(t0, t1, prog, gain, bright=0.42):
    t = t0; i = 0
    while t < t1 - 0.01:
        d = min(bar, t1 - t); c = CH[prog[i % len(prog)]]
        for m in c[1:]:
            s = strings(midi(m), d + 1.6, bright) * env_adsr(int((d + 1.6) * SR), 0.6, 0.3, 0.85, 1.4)
            add(mus, t, s, gain * 0.5, pan=(m % 7 - 3) / 7)
        t += bar; i += 1
def pizz_bass(t0, t1, prog, gain, pattern=(0, 2)):
    t = t0; i = 0
    while t < t1 - 0.01:
        c = CH[prog[i % len(prog)]]; root = c[0]
        while root > 45: root -= 12
        for j, b in enumerate((0, 2)):
            tb = t + b * beat
            if tb >= t1: break
            add(mus, tb, pizz(midi(root + (0 if pattern[j % len(pattern)] == 0 else 7)), 0.8), gain * (1 if j == 0 else 0.7), pan=-0.2)
        t += bar; i += 1
MOTIF = [(0, 69, 1.0), (1.0, 66, 0.5), (1.5, 62, 0.5), (2.0, 66, 1.0), (3.0, 69, 1.0), (4.0, 71, 1.0), (5.0, 69, 0.5), (5.5, 67, 0.5), (6.0, 64, 1.5), (7.5, 66, 0.5)]
def melody(t0, t1, gain, inst=celesta, octave=12, motif=MOTIF, length_beats=8):
    t = t0
    while t < t1 - 0.01:
        for (b, m, dur) in motif:
            tb = t + b * beat
            if tb >= t1 - 0.2: break
            add(mus, tb, inst(midi(m + octave)), gain, pan=0.25)
        t += length_beats * beat
def pulse_perc(t0, t1, gain):
    t = t0; k = 0
    while t < t1 - 0.01:
        if k % 4 == 0: add(mus, t, kick(), gain * 0.35)
        add(mus, t + beat / 2, shaker(k), gain * 0.08, pan=0.35)
        t += beat; k += 1
def pillar_swell(g0, g1, chord, gain, bright=0.5):
    """strings rise from the start of the camera move to the settle, then hold the chord through the read"""
    d = g1 - g0
    for m in CH[chord]:
        s = strings(midi(m), d + 4.8, bright) * np.concatenate([np.linspace(0.15, 1, int(d * SR)) ** 1.6, np.ones(int(4.8 * SR))])[: int((d + 4.8) * SR)]
        s *= env_adsr(len(s), 0.05, 0.1, 1.0, 2.2)
        add(mus, g0, s, gain * (1.3 if m < 48 else 1.0), pan=(m % 5 - 2) / 5)

# ================================================================== SCORE on the v9 cut (D major, 84 bpm)
PROG_A = ['D', 'Bm', 'G', 'A']; PROG_B = ['D', 'A', 'Bm', 'G']; PROG_C = ['G', 'A', 'F#m', 'Bm', 'Em', 'Asus', 'D', 'D']
REF_END, PRESS, IRIS = CUT['REF1_END'], CUT['PRESS'], CUT['IRIS']
STAND = {s['id']: s for s in CUT['STANDS']}
_cont = next(s for s in CUT['SHOTS'] if s.get('clip') == 'cont'); _i28 = next(s for s in CUT['SHOTS'] if s.get('clip') == 'i28')
def clip_t(shot, ct):
    """v9 time at which the footage shot shows clip time ct"""
    tt = np.linspace(shot['a'], shot['b'], 4000); cc = _warp(shot['map'])(tt); return float(np.interp(ct, cc, tt))
WORDS = [0.85 + i * 0.72 for i in range(3)]          # the theme written in light (src/film9.js)
WORLD = 4.02                                          # the spiral collapses into the FLOWS ring (reference clip)
TOUCH = REF_END + 0.05                                # his finger on the Biblioteca de Skills
RING = clip_t(_cont, 0.45); OPEN = clip_t(_cont, 2.35); THROUGH = clip_t(_cont, 3.3); FLOWS_ = clip_t(_cont, 4.15)
HALL = clip_t(_cont, 6.2); TOP = clip_t(_cont, 6.85)
DESC = clip_t(_i28, 2.05); STANDS_UP = clip_t(_i28, 3.05); BTN = clip_t(_i28, 3.6); POINT = clip_t(_i28, 4.85)
C0, C1 = CUT['COUNT441']['a'], CUT['COUNT441']['b']
FOLD9, LAND9 = G8(57.4), G8(60.2)
P3m9, P3h9, P3e9 = G8(62.0), G8(62.9), G8(63.7)
POD9, REVEAL9, SINK9, FIN9 = G8(68.5), G8(72.9), G8(75.9), G8(78.1)
print('v9 beats', {k: round(v, 2) for k, v in dict(RING=RING, OPEN=OPEN, THROUGH=THROUGH, FLOWS=FLOWS_, HALL=HALL, TOP=TOP, DESC=DESC, STAND=STANDS_UP, BTN=BTN, POINT=POINT,
      FOLD=FOLD9, LAND=LAND9, P3m=P3m9, P3h=P3h9, POD=POD9, REVEAL=REVEAL9, SINK=SINK9, FIN=FIN9).items()})
# ---- the light (0 - 4): a low D pedal and Dadd9 strings swell under the spiral; a celesta climbs with it
mus8(0.0, lp(saw_pad(midi(38), 5.4, 0.3) * env_adsr(int(5.4 * SR), 1.1, 0.5, 0.9, 1.4), 700), 0.16)
for m in CH['Dadd9']: mus8(0.15, strings(midi(m), 4.7, 0.42) * env_adsr(int(4.7 * SR), 1.3, 0.4, 0.9, 1.0), 0.042 * (1.3 if m < 48 else 1), pan=(m % 5 - 2) / 5)
ARP = [62, 66, 69, 74, 71, 76, 78, 81, 83, 86, 88, 90, 93, 95]
for i, m in enumerate(ARP): mus8(0.35 + i * 0.26, celesta(midi(m), 1.6), 0.024 + 0.012 * (i / len(ARP)), pan=math.sin(i * 1.3) * 0.7)
for i, (t0, m) in enumerate(zip(WORDS, (86, 90, 93))):   # one bell per pillar as its word is written
    cue8(t0 - 0.05, whoosh(0.75, 1600, 5200, 0.55), 0.045, 0.5); mus8(t0 + 0.3, bell(midi(m), 2.6, 1.0, 2.0), 0.05, 0.4); cue8(t0 + 0.28, shimmer(1.0, 90 + i, 4000, 9500, 12), 0.04, 0.5)
cue8(2.55, riser(1.5, 220, 3200), 0.075); cue8(2.9, reverse_swell(1.15), 0.06)
# ---- the world is born from the ring (4.0)
cue8(WORLD - 0.02, sub_boom(2.6, 70, 32), 0.26); cue8(WORLD, hp(noise(2.6), 5000) * np.exp(-t_arr(2.6) * 1.9) * 0.3, 0.12); cue8(WORLD + 0.02, shimmer(2.2, 95, 3000, 9000, 24), 0.06)
for i, m in enumerate((74, 81, 86)): mus8(WORLD + i * 0.05, bell(midi(m), 3.0, 1.0, 2.0), 0.05, -0.3 + i * 0.3)
for m in CH['Dmaj9']: mus8(WORLD - 0.05, strings(midi(m), 4.8, 0.48) * env_adsr(int(4.8 * SR), 0.35, 0.5, 0.85, 1.6), 0.05 * (1.3 if m < 48 else 1), pan=(m % 5 - 2) / 5)
mus8(WORLD - 0.05, lp(saw_pad(midi(38), 4.8, 0.3) * env_adsr(int(4.8 * SR), 0.4, 0.4, 0.9, 1.6), 600), 0.12)
for i, m in enumerate((86, 90, 93)): mus8(5.35 + i * 0.18, glock(midi(m), 1.4), 0.03, 0.2 + i * 0.1)        # the title line
# ---- Fabio walks through FLOWS (8 - 13): the pulse and the pizzicato bass begin
pads(7.6, REF_END + 0.6, PROG_A, 0.09, 0.42); pizz_bass(8.0, REF_END, PROG_A, 0.14); pulse_perc(8.0 + beat * 2, REF_END - 0.1, 0.34)
mus8(8.25, bell(midi(86), 2.4, 1.0, 2.0), 0.04); cue8(8.2, shimmer(1.6, 21), 0.04)                              # Pilar 01
# ---- the touch (13.1): the panel answers his finger; the pulse holds its breath
for i, m in enumerate((74, 78, 81, 86)): mus8(TOUCH + 0.05 + i * 0.07, celesta(midi(m), 2.2), 0.04, -0.3 + i * 0.2)
cue8(TOUCH, click(3600, 0.02, 0.3), 0.08, 0.3); cue8(RING, shimmer(1.8, 110, 3000, 9500, 30), 0.07, 0.3); cue8(RING, whoosh(1.2, 900, 4200, 0.5), 0.05, 0.3)
for m in CH['Dadd9']: mus8(TOUCH - 0.1, strings(midi(m), OPEN - TOUCH + 1.4, 0.44) * env_adsr(int((OPEN - TOUCH + 1.4) * SR), 0.5, 0.3, 0.9, 1.2), 0.05 * (1.3 if m < 48 else 1), pan=(m % 5 - 2) / 5)
# ---- the portal: a riser into the light, the whoosh through, the FLOWS universe blooms
cue8(OPEN - 1.1, riser(1.2, 200, 3400), 0.1); cue8(OPEN - 0.9, reverse_swell(0.95), 0.08)
cue8(OPEN, whoosh(THROUGH - OPEN + 0.5, 180, 5200, 0.6, 1.4), 0.16); cue8(OPEN + 0.05, sparkle(1.4, 40, 3000, 9500, 111), 0.07)
cue8(THROUGH, sub_boom(2.4, 74, 32), 0.24); cue8(THROUGH + 0.02, hp(noise(2.2), 4500) * np.exp(-t_arr(2.2) * 2.2) * 0.3, 0.1)
for i, m in enumerate((74, 81, 86, 90)): mus8(FLOWS_ + i * 0.06, bell(midi(m), 3.0, 1.0, 2.0), 0.05, -0.4 + i * 0.27)
for m in CH['Dmaj9']: mus8(FLOWS_ - 0.1, strings(midi(m), HALL - FLOWS_ + 2.5, 0.5) * env_adsr(int((HALL - FLOWS_ + 2.5) * SR), 0.3, 0.5, 0.85, 1.8), 0.055 * (1.3 if m < 48 else 1), pan=(m % 5 - 2) / 5)
cue8(FLOWS_, shimmer(2.4, 112, 3000, 9000, 30), 0.07)
# ---- the orbit of skills (the library): pads, a floating celesta, the counter
pads(HALL - 0.2, DESC + 0.5, PROG_A, 0.1, 0.44); pizz_bass(HALL + beat, DESC, PROG_A, 0.14); pulse_perc(HALL + bar / 2, DESC - 0.2, 0.36)
ORB = [74, 78, 81, 86, 81, 78]
for i, tt in enumerate(np.arange(TOP, DESC, beat / 2)): mus8(tt, celesta(midi(ORB[i % 6] + (12 if i % 12 >= 6 else 0)), 1.2), 0.02, math.sin(i * 0.9) * 0.8)
ticks_q = 16
for i in range(1, ticks_q + 1):
    u = 1 - (1 - i / ticks_q) ** (1 / 3); cue8(C0 + 0.1 + u * 1.2, click(2200 + i * 20, 0.022, 0.12), 0.06)
cue8(C0 + 1.35, bell(midi(86), 2.4), 0.06); cue8(C0 + 1.35, shimmer(1.2, 113), 0.04)
# ---- the descent, the button he offers, the press
cue8(DESC, whoosh(STANDS_UP - DESC + 0.3, 3000, 400, 0.4), 0.07)
pads(DESC, PRESS + 0.3, ['G', 'Asus'], 0.09, 0.4)
cue8(BTN - 0.15, whoosh(0.9, 200, 1600, 0.7), 0.1); cue8(BTN + 0.55, pop(700, 260, 0.16), 0.1); cue8(BTN + 0.58, shimmer(1.4, 114, 3000, 9000, 26), 0.06)
for i, m in enumerate((74, 78, 81)): mus8(BTN + 0.6 + i * 0.12, pizz(midi(m), 0.6), 0.045, 0.2)
mus8(POINT, glock(midi(93), 1.4), 0.04, 0.2); cue8(POINT + 0.05, boing(220, 480, 0.3), 0.03, 0.2)
cue8(PRESS - 0.55, reverse_swell(0.55), 0.09); cue8(PRESS - 0.5, riser(0.5, 400, 2600), 0.05)
cue8(PRESS, click(2000, 0.06, 0.9), 0.5); cue8(PRESS, thump(0.35), 0.24); cue8(PRESS + 0.01, sub_boom(1.8, 96, 44), 0.2)
cue8(PRESS + 0.02, bell(midi(86), 2.4), 0.07); cue8(PRESS + 0.03, shimmer(1.4, 115, 3000, 9500, 30), 0.07)
cue8(PRESS + 0.05, whoosh(IRIS['dur'] + 0.4, 300, 5200, 0.55, 1.3), 0.13)       # the golden iris opens
# ---- the form (calm): pads, pizzicato, a soft pulse, a sparse piano line
pads(PRESS + 0.2, FOLD9, PROG_B, 0.082, 0.4); pizz_bass(PRESS + bar / 2, FOLD9, PROG_B, 0.13); pulse_perc(PRESS + bar, FOLD9 - 0.3, 0.34)
_t = PRESS + bar
while _t < FOLD9 - 2 * bar:
    melody(_t, min(_t + 2 * bar, FOLD9 - 0.5), 0.028, inst=piano, octave=0); _t += 4 * bar       # two bars on, two bars of air
# ---- fold + flight: strings rise with the card and land on D
pads(FOLD9, LAND9, ['G', 'Asus'], 0.1, 0.55)
for m in [57, 62, 66, 69]:
    d = LAND9 - FOLD9
    mus8(FOLD9, strings(midi(m), d + 0.4, 0.5) * np.linspace(0.2, 1, int((d + 0.4) * SR)) ** 1.5 * env_adsr(int((d + 0.4) * SR), 0.3, 0.1, 1, 0.5), 0.05, pan=(m % 5 - 2) / 5)
for m in [38, 50, 57, 62, 66, 69, 74]: mus8(LAND9, strings(midi(m), 3.4, 0.5) * env_adsr(int(3.4 * SR), 0.2, 0.6, 0.8, 1.6), 0.05 if m > 45 else 0.09, pan=(m % 5 - 2) / 5)
pads(LAND9 + 1.0, P3m9 + 0.5, ['D', 'Gmaj7'], 0.09, 0.45)
# ---- Somos Exemplo: the strongest swell, then the golden arcs
pillar_swell(P3m9, P3h9, 'D', 0.058, 0.55)
for m in [50, 57, 62, 66]: mus8(P3h9 - 0.3, brass(midi(m), 4.2) * 0.8, 0.032, pan=(m % 5 - 2) / 5)
cue8(P3h9 - 0.4, shimmer(2.6, 23, 3000, 9000, 26), 0.08); mus8(P3h9 - 0.3, bell(midi(86), 3.2, 1.0, 2.0), 0.07); mus8(P3h9 - 0.25, bell(midi(90), 3.0, 1.0, 2.0), 0.05); cue8(P3h9 - 0.3, sub_boom(2.6, 64, 32), 0.16)
pads(P3e9 - 0.6, POD9, PROG_C, 0.11, 0.55); pizz_bass(P3e9 + bar, POD9, PROG_C, 0.15); melody(P3e9 + bar, POD9 - 0.4, 0.045, inst=glock, octave=12)
# ---- the ranking: a timpani build, a snare roll into the reveal, a warm fanfare
pads(POD9, REVEAL9, ['Asus', 'A'], 0.1, 0.5)
for i, tt in enumerate(np.arange(POD9 + 0.5, REVEAL9 - 0.8, beat * 2)): mus8(tt, timpani(midi(33), 1.4), 0.12 + i * 0.008)
mus8(REVEAL9 - 1.6, snare_roll(1.6, 12, 7), 0.12); mus8(REVEAL9 - 1.4, riser(1.4, 250, 2400), 0.08)
mus8(REVEAL9 - 0.6, reverse_swell(0.6), 0.05); mus8(REVEAL9, hp(noise(2.4), 5000) * np.exp(-t_arr(2.4) * 1.8) * 0.25, 0.12)
for m in [50, 57, 62, 66, 69, 74]: mus8(REVEAL9, brass(midi(m), 1.8), 0.05 if m > 55 else 0.07, pan=(m % 5 - 2) / 5)
for m in [54, 62, 66, 69, 74, 78]: mus8(REVEAL9 + 1.4, brass(midi(m), 2.2), 0.042, pan=(m % 5 - 2) / 5)
pads(REVEAL9, SINK9, ['D', 'G', 'A', 'D'], 0.11, 0.58); pizz_bass(REVEAL9 + 0.4, SINK9, ['D', 'G', 'A', 'D'], 0.15)
pulse_perc(REVEAL9 + bar, SINK9 - 0.3, 0.45); melody(REVEAL9 + bar, SINK9 - 0.3, 0.04, inst=glock, octave=12)
pads(SINK9, FIN9, ['G', 'Asus'], 0.11, 0.52)
# ---- finale: the three pillars, one line (the last seconds breathe out)
for m in [38, 50, 57, 62, 66, 69, 74]:
    d = DUR - FIN9
    mus8(FIN9, strings(midi(m), d, 0.52) * env_adsr(int(d * SR), 0.6, 1.0, 0.85, 3.0), 0.07 if m > 45 else 0.12, pan=(m % 5 - 2) / 5)
for i, m in enumerate([74, 78, 81, 86, 90, 93]): mus8(FIN9 + i * 0.16, celesta(midi(m), 2.8), 0.045, pan=-0.5 + i * 0.2)


# ================================================================== SOUND DESIGN on story time (v3 cues, calmer)
# (the v5 opening cues are gone: the intro clip covers story < 10.) The Todos Sabem letters pop at the
# cut on the film clock (as in src/timeline.js), Todos Usam a beat later, softly.
if INTRO['sound'] != 'clip':   # with the clip's sound, its own music already carries the letters and the cut
    for k, (t0, n, g) in enumerate([(-0.06, 11, 0.035), (0.3, 10, 0.02)]):
        for i in range(n): add(sfx, FILM0 + t0 + i * 0.05 + 0.22, pizz(midi(74 + [0, 2, 4, 7, 9][i % 5] + (i // 5) * 12 - 12), 0.35), g, -0.5 + k * 0.9)
    add(sfx, FILM0 + 0.02, thump(0.3), 0.1, -0.4)
scue(11.55, whoosh(1.0, 1200, 200, 0.3), 0.07); scue(12.3, whoosh(1.2, 200, 1600, 0.6), 0.1); scue(13.1, thump(0.3), 0.12)
scue(15.9, whoosh(1.0, 1600, 200, 0.4), 0.08)
for i in range(24): scue(16.2 + (i / 24) * 2.6, pizz(midi(86 + [0, 2, 4, 7, 9][i % 5]), 0.3), 0.018, math.sin(i) * 0.8)
ticks_for(16.7, 19.3, 18, 2200, 0.06)
scue(19.1, bell(midi(86), 2.4), 0.06)
for k in range(3): scue(20.7 + k * 0.18, whoosh(1.4, 300, 2400, 0.6), 0.07, -0.6 + k * 0.6); scue(21.8 + k * 0.1, glock(midi(86 + k * 4), 1.4), 0.03, -0.6 + k * 0.6)
scue(23.3, whoosh(1.0, 2400, 300, 0.3), 0.08)
# Passo 1: the button
scue(26.35, whoosh(1.2, 150, 1100, 0.6), 0.12); scue(27.0, pop(700, 260, 0.14), 0.07)
scue(28.0, click(1800, 0.06, 0.9), 0.5); scue(28.0, thump(0.35), 0.22); scue(28.02, sub_boom(1.4, 100, 48), 0.12); scue(28.05, bell(midi(86), 2.2), 0.07); scue(28.04, shimmer(1.2, 38), 0.05)
scue(28.6, whoosh(1.4, 400, 4000, 0.5), 0.1)
scue(30.2, whoosh(1.0, 1400, 200, 0.3), 0.06)
for i in range(5): scue(30.9 + i * 0.07 + 0.25, pop(900 + i * 60, 360, 0.1), 0.05, -0.6 + i * 0.1)
# Passo 2: typing
for i in range(5): scue(31.4 + (i + 1) * 0.24 - 0.12, key(400 + i), 0.34, -0.4)
for i in range(39): scue(32.6 + (i + 1) * (2.7 / 39) - 0.01, key(500 + i), 0.18, 0.05)
# Passo 3: where
scue(37.5, click(2600, 0.035), 0.16)
for tt in (37.95, 38.15, 38.35): scue(tt, key(int(tt * 100)), 0.22)
scue(38.7, click(3500, 0.025, 0.2), 0.08)
scue(39.85, click(2800, 0.04), 0.22); scue(39.86, whoosh(0.6, 1500, 3500, 0.5), 0.06); scue(40.27, bell(midi(88), 1.6), 0.05)
# Passo 4: model
scue(42.5, click(2600, 0.035), 0.16); scue(42.85, bell(midi(79), 1.0, 1.0, 2.0), 0.04)
scue(43.1, whoosh(1.0, 200, 1600, 0.6), 0.1)
for j in range(9):   # the drum passes about nine slats in its 1.25 calm turns
    u = (j + 0.5) / 9; uu = 0.5 * (1 - math.cos(math.pi * u))
    scue(43.7 + uu * 2.2, click(1500 + j * 40, 0.03, 0.5), 0.1, 0.5)
scue(45.9, bell(midi(86), 2.2), 0.07); scue(45.92, shimmer(0.9, 39), 0.04)
scue(46.15, whoosh(0.8, 3000, 700, 0.4), 0.07); scue(46.6, bell(midi(90), 1.8), 0.05)
# Passo 4b: time
scue(47.25, click(2600, 0.035), 0.14)
for tt in (47.45, 47.65, 47.85): scue(tt, key(int(tt * 100)), 0.22)
# Passo 5: files into the box
scue(48.6, whoosh(1.2, 150, 1200, 0.6), 0.12); scue(49.35, thump(0.3), 0.12)
for i in range(6):
    scue(49.8 + i * 0.5, whoosh(0.8, 900, 3600, 0.55), 0.06, 0.6 - i * 0.2)
    scue(50.35 + i * 0.5, thump(0.3), 0.14 if i == 0 else 0.1); scue(50.35 + i * 0.5, pop(900 - i * 40, 350, 0.08), 0.04)
scue(52.9, whoosh(0.5, 600, 1800, 0.5), 0.08); scue(53.2, thump(0.35), 0.16); scue(53.45, thump(0.3), 0.14)
scue(53.55, bp(noise(0.3), 2000, 7000) * np.linspace(1, 0, int(0.3 * SR)), 0.07)
scue(53.7, bell(midi(88), 2.4), 0.06)
scue(54.0, whoosh(1.0, 300, 3000, 0.6), 0.1); scue(54.55, click(3000, 0.03), 0.16); scue(54.57, bell(midi(93), 2.0), 0.045)
# Passo 6: Próximo, fold, flight, landing
scue(56.55, click(2200, 0.05, 0.7), 0.36); scue(56.57, bell(midi(86), 1.6), 0.05)
scue(57.4, whoosh(1.3, 300, 4000, 0.8), 0.1); scue(57.95, pop(700, 250, 0.18), 0.1); scue(57.95, shimmer(1.2, 41), 0.06)
scue(58.3, whoosh(D(58.3, 60.2), 250, 3600, 0.7), 0.14, -0.2); scue(58.4, riser(D(58.4, 60.2), 260, 2000), 0.06)
scue(60.2, sub_boom(2.6, 70, 32), 0.3); scue(60.2, whoosh(1.4, 4000, 300, 0.05), 0.08); scue(60.22, shimmer(2.0, 42, 3000, 9000, 26), 0.08)
for i, m in enumerate([74, 78, 81, 86]): scue(60.25 + i * 0.09, bell(midi(m), 2.6), 0.05, -0.4 + i * 0.27)
scue(62.05, whoosh(D(62.0, 62.9), 1800, 400, 0.5), 0.05)
# Somos Exemplo: threads of reuse
R2 = np.random.default_rng(9)
for i in range(14):
    t0 = 64.4 + R2.random() * 1.6
    scue(t0, whoosh(1.2, 2000, 6000, 0.6), 0.02, R2.uniform(-0.8, 0.8))
    scue(t0 + 1.4, glock(midi([74, 76, 78, 81, 83, 86, 88, 90][i % 8]), 1.4), 0.022, R2.uniform(-0.8, 0.8))
# ranking de áreas
scue(68.5, whoosh(D(68.5, 69.6), 2400, 300, 0.45), 0.08)
scue(69.12, click(2800, 0.03, 0.3), 0.08); scue(69.37, click(3000, 0.03, 0.3), 0.07)
for k, (t0, pan) in enumerate([(69.3, 0.5), (70.2, -0.5)]):
    scue(t0, whoosh(1.0, 150, 1200, 0.65), 0.1, pan); scue(t0 + 0.5, thump(0.35), 0.16, pan)
    ticks_for(t0 + 0.45, t0 + 1.3, 10, 2000, 0.05, pan)
scue(70.65, tink(2600), 0.06, 0.5); scue(71.6, tink(3400), 0.05, -0.5)
scue(71.9, whoosh(1.3, 120, 1400, 0.6), 0.13); scue(72.5, thump(0.4), 0.22); scue(72.5, sub_boom(1.8, 84, 40), 0.18)
ticks_for(72.35, 73.35, 14, 2300, 0.06)
scue(72.9, confetti_pop(1), 0.12, -0.7); scue(72.93, confetti_pop(2), 0.12, 0.7); scue(72.95, shimmer(2.4, 80, 3000, 9000, 40), 0.07)
scue(73.0, bell(midi(86), 2.6), 0.06); scue(73.05, click(2400, 0.04, 0.2), 0.12, 0.5)   # the Nº 1 plate settles
scue(73.4, whoosh(0.8, 1500, 4000, 0.5), 0.04, 0.3)                                 # connector draws
ticks_for(73.8, 75.0, 8, 2600, 0.04, 0.5); ticks_for(74.0, 75.2, 10, 2900, 0.04, 0.5)
scue(75.9, whoosh(1.0, 1400, 150, 0.35), 0.1)
# emblem returns, letterbox, end card, signature
scue(76.5, whoosh(1.2, 150, 1300, 0.6), 0.12); scue(77.2, thump(0.35), 0.18); scue(77.22, sub_boom(1.6, 76, 40), 0.14)
for k in range(3): scue(76.7 + k * 0.25, shimmer(0.8, 50 + k), 0.03, -0.6 + k * 0.6)
for i, tt in enumerate([78.1, 78.52, 78.94]): scue(tt, bell(midi(81 + i * 4), 2.6), 0.06, -0.5 + i * 0.5)
scue(79.1, bell(midi(86), 2.4), 0.035); scue(79.45, bell(midi(93), 2.2), 0.03)
# motion-graphics layer: step tracker ticks and completion notes, focus frame, counters
for s in [26.0, 30.6, 37.5, 42.5, 48.5, 55.5]: scue(s + 0.02, click(3400, 0.02, 0.15), 0.06, 0.7)
for i, s in enumerate([30.6, 37.5, 42.5, 48.5, 55.5, 58.2]): scue(s, glock(midi(86 + [0, 2, 4, 5, 7, 9][i]), 1.2), 0.03, 0.7)
for s in [31.25, 37.6, 42.6, 47.2, 54.5, 55.7]: scue(s, click(2900, 0.025, 0.25), 0.07)
for s in [16.65, 60.3]: scue(s, bell(midi(90), 1.8), 0.04)

# ================================================================== v5 inserts (film clock)
def icue(ins, u, sig, g=1.0, pan=0.0): cue(ins[0] + u / ins[2], sig, g, pan)
def uiclick(ins, u, g=0.16): icue(ins, u, click(2500, 0.035, 0.6), g, 0.1); icue(ins, u + 0.005, pop(1100, 420, 0.06), 0.03, 0.1)
ST, SN, SD = SCHED['tour'], SCHED['name'], SCHED['det']
# FLOWS tour: cursor, clicks, page dissolves, highlight rings, the trophies
icue(I_TOUR, ST['curVis'][0], whoosh(0.6, 1200, 3200, 0.5), 0.025, 0.4)
for u in ST['clk']: uiclick(I_TOUR, u)
for u0, u1, a, b in ST['scr']: icue(I_TOUR, u0 + 0.02, whoosh(0.55, 700, 3000, 0.45), 0.06, -0.1)
for k, m in ((0, 86), (1, 88), (2, 88), (3, 90), (5, 86)): icue(I_TOUR, ST['rings'][k][1][0] + 0.1, glock(midi(m), 1.2), 0.028, 0.3)
for i, (r, e) in enumerate(ST['rings'][6:]): icue(I_TOUR, e[0] + 0.1, tink(2600 + i * 260), 0.035, -0.5 + i * 0.25)
# name anatomy: one note per part of the name, then a small chord for the whole pattern
for u, m in zip(SN['t0'], (81, 85, 88)): icue(I_NAME, u, marker(0.24), 0.06); icue(I_NAME, u + 0.02, glock(midi(m), 1.4), 0.045)
for i, m in enumerate((81, 85, 88, 93)): icue(I_NAME, SN['all'] + i * 0.05, celesta(midi(m), 1.8), 0.03, -0.3 + i * 0.2)
icue(I_NAME, SN['all'], shimmer(1.2, 61), 0.04)
# Detalhes: the page dissolves in, clicks, the area list, typing, chips, description, share
TL = {}
for u, n in SD['tl']: TL.setdefault(n, u)
icue(I_DET, 0.05, whoosh(0.6, 600, 3000, 0.5), 0.07)
for u in SD['clk'][:-1]: uiclick(I_DET, u)
icue(I_DET, TL['d_tpl'] + 0.02, glock(midi(86), 1.0), 0.025)                                     # Template selected
icue(I_DET, TL['d_area_hi0'], pop(800, 400, 0.08), 0.04); icue(I_DET, TL['d_area_act'] + 0.02, tink(2900), 0.04)   # list opens, DTS chosen
for a, b in SD['scroll']: icue(I_DET, a, whoosh((b - a) / I_DET[2], 1500, 900, 0.5, 0.6), 0.025, 0.2)   # scroll
R5 = np.random.default_rng(55)
for pre, i0_, i1_, t0, dt, pad in SD['typ']:
    for i in range(i1_ - i0_ + 1):
        if pre == 'd_desc_':   # a word per step: two soft keys each
            for h in (0.0, 0.5): icue(I_DET, t0 + (i + h) * dt - 0.02 + R5.random() * 0.012, key(800 + 2 * i + int(h * 2)), 0.08 + R5.random() * 0.035, 0.05)
        else: icue(I_DET, t0 + i * dt - 0.01, key(700 + i + (20 if pre == 'd_p2_' else 0)), 0.16, -0.1)
for n in ('d_p1_sugg', 'd_p2_sugg'): icue(I_DET, TL[n], pop(1300, 700, 0.07), 0.03)                  # suggestion
for n in ('d_p2_0', 'd_people'): icue(I_DET, TL[n], pop(900, 300, 0.12), 0.06); icue(I_DET, TL[n] + 0.03, tink(3200), 0.03)   # chip
for n in ('d_desc_hl1', 'd_desc_hl2'): icue(I_DET, TL[n], marker(0.26), 0.06)
u = SD['clk'][-1]; icue(I_DET, u, click(2200, 0.05, 0.7), 0.34); icue(I_DET, u + 0.02, bell(midi(86), 1.8), 0.05); icue(I_DET, u + 0.05, shimmer(1.0, 63), 0.04)


# ================================================================== v9 sound design (Fabio in the world)
# each time the light builds him (feet to head): a reverse swell, the ring on the floor, sparks, a chord
CHORD_IN = {'present': (74, 78, 81), 'welcome': (78, 81, 86), 'rank1': (81, 86, 90), 'greet': (74, 81, 86)}
for sid, s in STAND.items():
    t0 = s['inAt']; pan = -0.3 if s['pos'][0] < 0 else 0.3
    cue8(t0 - 0.35, reverse_swell(0.5), 0.05, pan); cue8(t0 + 0.2, sub_boom(1.4, 90, 44), 0.08, pan)
    cue8(t0 + 0.05, sparkle(1.3, 34, 3000, 9500, 120 + len(sid)), 0.06, pan); cue8(t0 + 0.2, whoosh(1.1, 400, 3600, 0.5), 0.05, pan)
    for i, m in enumerate(CHORD_IN[sid]): mus8(t0 + 0.3 + i * 0.08, celesta(midi(m), 2.0), 0.035, pan)
    if s['outAt'] < 900:   # and when he goes back into the light
        cue8(s['outAt'] + 0.05, sparkle(0.9, 20, 4000, 9500, 140 + len(sid)), 0.035, pan); cue8(s['outAt'], whoosh(0.7, 2800, 800, 0.4), 0.03, pan)
# the golden Nº 1 over his raised finger
N1 = CUT['NUM1']['t']
cue8(N1, pop(900, 300, 0.12), 0.08, -0.4); cue8(N1 + 0.02, bell(midi(93), 2.4, 1.2, 2.0), 0.06, -0.4); cue8(N1 + 0.03, shimmer(1.4, 150, 3500, 9500, 24), 0.05, -0.4)


# ================================================================== mix & master
def reverb_ir(d=3.0, seed=3):
    r = np.random.default_rng(seed); n = int(d * SR); t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        x = r.standard_normal(n) * np.exp(-t * 2.3)
        x = lp(x, 7000); x[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        irs.append(x / np.sqrt((x ** 2).sum()))
    return irs
ir = reverb_ir()
def verb(x, wet):
    return np.vstack([fftconvolve(x[c], ir[c])[:N] for c in range(2)]) * wet
mus_mix = mus + verb(mus, 0.6)
sfx_mix = sfx + verb(sfx, 0.4)
env = np.abs(lp(np.abs(sfx).sum(axis=0), 8))
duck = 1 / (1 + 0.9 * env / (env.max() + 1e-9))
mix = mus_mix * duck * 0.95 + sfx_mix * 0.9
mix = hp(mix, 28)
fi = int(0.05 * SR); fo = int(2.0 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi); mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
def limiter(x, ceil=0.84, look=0.005, rel=0.08):
    # look-ahead peak limiter: the gain is already down when a transient arrives (no clipped edges)
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    peak = np.max(np.abs(x), axis=0)
    L = int(look * SR)
    g = minimum_filter1d(np.minimum(1, ceil / (peak + 1e-9)), size=2 * L + 1)
    gs = np.copy(g); a = np.exp(-1 / (rel * SR))
    for i in range(1, len(gs)):
        gs[i] = g[i] if g[i] < gs[i - 1] else a * gs[i - 1] + (1 - a) * g[i]
    return x * uniform_filter1d(gs, size=L + 1)
rms = np.sqrt(np.mean(mix ** 2))
mix *= 0.12 / (rms + 1e-9)            # about -14 LUFS integrated
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
mix = limiter(mix, 0.84)
from scipy.signal import resample_poly
tp = np.abs(resample_poly(mix, 4, 1, axis=1)).max()   # true peak (4x oversampled) at most -1 dBTP
if tp > 0.89: mix *= 0.89 / tp
out = (np.clip(mix, -1, 1).T * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('dur', DUR, 'peak', np.abs(mix).max(), 'rms dB', 20 * np.log10(np.sqrt(np.mean(mix ** 2))))
