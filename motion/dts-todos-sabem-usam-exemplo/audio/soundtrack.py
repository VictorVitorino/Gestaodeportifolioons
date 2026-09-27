"""DTS · Todos Sabem, Todos Usam, Somos Exemplo (v5) — original score and sound design,
synthesized from scratch on the same clock as the film: the Alvarez & Marsal
ident, then the film. Story-time cues (the v3 choreography) are placed through the same
pacing curve as src/pace.js, so every sound lands on its picture; the score itself is
written on the new clock: calmer, broader, with a swell into each pillar. v5: the three
inserts (flat segments of PACE: FLOWS tour, name anatomy, Detalhes page) get their own
cues on the film clock, from the same schedules as src/timeline.js. v6: Fabio's intro clip plays
between the ident and the film; its sound is replaced by this same score (same key, tempo and
instruments), written on his gestures, so the intro flows into the film as one piece of music.
v6 (final): the A&M ident is off and the intro keeps Fabio's own sound (his finger snap, DTS
appearing); it hands over to the score at the cut with a short crossfade (both in D major)."""
import subprocess, tempfile
import numpy as np, wave, sys, math, json, re, os
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
PACE = json.loads(re.search(r'PACE = (\[.*?\]);', open(os.path.join(HERE, '..', 'src', 'pace.js')).read(), re.S).group(1))
IDENT = float(re.search(r'export const IDENT = ([0-9.]+)', open(os.path.join(HERE, '..', 'src', 'ident.js')).read()).group(1))
INTRO = json.loads(re.search(r'INTRO = (\{.*?\});', open(os.path.join(HERE, '..', 'src', 'pace.js')).read()).group(1))
ID = IDENT if INTRO['ident'] else 0.0   # the A&M ident is optional (off in v6)
FILM0 = ID + INTRO['dur']             # the film joins the intro clip here (story time PACE[0][1])
DUR = FILM0 + PACE[-1][0]
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
DESIGN = json.loads(re.search(r'INSERT_DESIGN = (\{.*?\});', open(os.path.join(HERE, '..', 'src', 'pace.js')).read()).group(1))
INS = [(FILM0 + PACE[i][0], FILM0 + PACE[i + 1][0]) for i in range(len(PACE) - 1) if PACE[i][1] == PACE[i + 1][1]]
INS = [(a, b, DESIGN[n] / (b - a)) for (a, b), n in zip(INS, ['tour', 'name', 'det'])]   # (start, end, design seconds per film second)
I_TOUR, I_NAME, I_DET = INS
def D(s0, s1): return T(s1) - T(s0)
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

def cue(t0, sig, g=1.0, pan=0.0): add(sfx, t0, sig, g, pan)
def scue(s, sig, g=1.0, pan=0.0): add(sfx, T(s), sig, g, pan)        # story-time cue
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

# ================================================================== IDENT (0-IDENT s): Alvarez & Marsal (optional)
def ident_score():
    add(mus, 0.0, lp(saw_pad(midi(38), IDENT, 0.25) * env_adsr(int(IDENT * SR), 2.5, 0.5, 0.9, 1.4), 520), 0.15)
    add(mus, 0.0, lp(pink(int(IDENT * SR)), 1800) * env_adsr(int(IDENT * SR), 3.0, 0.5, 0.8, 1.2) * 0.25, 0.08)
    R0 = np.random.default_rng(3)
    for i in range(22):  # slow "data" arpeggio: sparse plucks from the D major pentatonic
        tt = 0.9 + i * 0.36 + R0.random() * 0.05
        if tt > 7.6: break
        cue(tt, pluck(midi(74 + [0, 2, 4, 7, 9, 12, 14][int(R0.random() * 7)]), 0.9, 0.2), 0.022 + 0.01 * (i % 3 == 0), R0.uniform(-0.7, 0.7))
    for k, t0 in enumerate([1.2, 1.35, 1.55, 1.75, 1.95]):   # light trails gliding over the floor
        cue(t0 - 0.9, whoosh(2.0, 900, 3800, 0.75, 0.8), 0.05, [-0.8, 0.8, -0.5, 0.6, 0.2][k])
    cue(2.05, bell(midi(81), 3.0, 1.2, 2.0), 0.04); cue(2.1, sub_boom(2.4, 60, 34), 0.1)   # the ring forms
    cue(2.45, swell(2.4, 120, 700), 0.1)                                                      # the mark materializes
    for m in [50, 57, 62, 66, 69]: add(mus, 2.4, strings(midi(m), 6.6, 0.38) * env_adsr(int(6.6 * SR), 2.2, 0.8, 0.85, 2.2), 0.032 if m > 55 else 0.05, pan=(m % 5 - 2) / 5)
    cue(4.7, whoosh(1.3, 3200, 1100, 0.5, 0.8), 0.03, 0.35)                                                  # a line of light runs down the letters
    for k, (tt, m) in enumerate([(5.0, 86), (5.3, 90), (5.62, 93)]): cue(tt, bell(midi(m), 2.6, 0.9, 2.0), 0.045, 0.3 + k * 0.1)   # A, &, M
    cue(5.4, whoosh(1.6, 2500, 6000, 0.5, 0.7), 0.035, 0.2); cue(5.5, shimmer(1.6, 7), 0.05)            # light sweep
    for m in [55, 59, 62, 66, 71]: add(mus, 5.8, strings(midi(m), 3.4, 0.4) * env_adsr(int(3.4 * SR), 0.8, 0.5, 0.8, 1.6), 0.034, pan=(m % 5 - 2) / 5)   # Gmaj7 under the type
    for m in [50, 57, 62, 66, 69, 74]: add(mus, 7.0, strings(midi(m), 2.8, 0.42) * env_adsr(int(2.8 * SR), 0.6, 0.4, 0.85, 1.4), 0.034, pan=(m % 5 - 2) / 5)   # resolve (D)
    for i, m in enumerate([74, 78, 81, 86]): cue(6.0 + i * 0.22, celesta(midi(m + 12), 2.2), 0.025, -0.3 + i * 0.2)


if INTRO['ident']: ident_score()

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

G = lambda s: T(s)
P1m, P1h, P1e = G(10.0), G(11.2), G(11.5)   # the pillar move starts at the cut from the intro clip
P2m, P2h, P2e = G(24.0), G(24.9), G(25.6)
FOLD, FLY, LAND = G(57.4), G(58.3), G(60.2)
P3m, P3h, P3e = G(62.0), G(62.9), G(63.7)
POD, REVEAL, SINK, FIN = G(68.5), G(72.9), G(75.9), G(78.1)
PROG_A = ['D', 'Bm', 'G', 'A']; PROG_B = ['D', 'A', 'Bm', 'G']; PROG_C = ['G', 'A', 'F#m', 'Bm', 'Em', 'Asus', 'D', 'D']
# ---- Fabio's intro: by default it keeps the clip's own sound (mixed in at the master, below); this
# alternative scores it with the film's instruments instead (INTRO.sound != "clip").
IU = lambda u: ID + u
def intro_score():
    add(mus, ID - 0.2, lp(saw_pad(midi(38), INTRO['dur'] + 3.0, 0.3) * env_adsr(int((INTRO['dur'] + 3.0) * SR), 1.6, 0.5, 0.9, 2.4), 700), 0.17)
    for i, m in enumerate([74, 78, 81, 86]): add(mus, IU(0.35) + i * 0.28, celesta(midi(m), 2.2), 0.045, pan=-0.3 + i * 0.2)   # he looks at us
    pads(IU(0.2), IU(INTRO['dur']) + 0.3, ['D', 'G', 'D', 'Asus'], 0.065, 0.36)
    pizz_bass(IU(0.2 + bar), IU(INTRO['dur']), ['G', 'D', 'Asus'], 0.1)
    for u, m, g in [(1.05, 69, 0.04), (1.4, 74, 0.035)]: add(mus, IU(u), pizz(midi(m), 0.6), g, pan=0.2)     # the smile
    add(mus, IU(2.45), glock(midi(98), 1.4), 0.05, pan=0.35); add(sfx, IU(2.47), shimmer(0.7, 71, 5000, 10000, 8) * 0.8, 0.035, pan=0.35)   # the wink
    for i, m in enumerate([69, 71, 74, 78]): add(mus, IU(2.75 + i * 0.16), pizz(midi(m + 12), 0.5), 0.04, pan=-0.2 + i * 0.12)   # "come on" gesture
    add(sfx, IU(3.62), pop(700, 300, 0.1), 0.04)                                                                   # hands together
    add(sfx, IU(3.55), whoosh(1.6, 180, 1800, 0.7), 0.09, pan=-0.1); add(sfx, IU(3.8), riser(1.0, 200, 1400), 0.05)   # the camera pulls back
    add(sfx, IU(4.25), whoosh(0.7, 150, 900, 0.6), 0.08); add(sfx, IU(4.62), thump(0.35), 0.2); add(sfx, IU(4.64), sub_boom(1.8, 70, 36), 0.14)   # the emblem rises
    add(sfx, IU(4.66), shimmer(1.4, 72), 0.05); add(mus, IU(4.68), bell(midi(86), 2.4), 0.05)
    for m in [50, 57, 62, 66, 69, 74]: add(mus, IU(5.05), strings(midi(m), 3.6, 0.5) * env_adsr(int(3.6 * SR), 0.5, 0.6, 0.8, 1.6), 0.032 if m > 55 else 0.05, pan=(m % 5 - 2) / 5)   # the plaza opens up
    for i, m in enumerate([81, 86, 90]): add(mus, IU(5.15 + i * 0.14), celesta(midi(m), 2.0), 0.035, pan=0.3 - i * 0.2)  # presenting DTS
    add(sfx, IU(6.45), reverse_swell(0.45), 0.035); add(sfx, IU(6.9), whoosh(1.0, 700, 3500, 0.5), 0.07)          # the title panel and headline
    add(sfx, IU(INTRO['hud'][0] + 0.02), click(3400, 0.02, 0.15), 0.05, pan=0.7)
    add(sfx, IU(8.35), whoosh(1.5, 260, 2200, 0.8), 0.1, pan=-0.3)                                                 # the pan to the pillar
if INTRO['sound'] != 'clip': intro_score()
# pillar 1 (blue): swell into the hold
if INTRO['sound'] == 'clip':
    # the clip's own music runs past the picture cut and lands on its hit (a D major 7 chord, 10.0 s into
    # the clip) as the Todos Sabem letters form: our strings bloom out of that hit, on the same chord,
    # and carry the hold; nothing rhythmic of ours starts until the clip's music has rung out
    HIT = ID + 10.0
    d = P1e - HIT + 1.2
    for m in CH['Dmaj9']:
        s_ = strings(midi(m), d + 2.4, 0.46) * env_adsr(int((d + 2.4) * SR), 0.45, 0.4, 0.9, 2.4)
        add(mus, HIT - 0.06, s_, 0.052 * (1.3 if m < 48 else 1.0), pan=(m % 5 - 2) / 5)
    add(mus, HIT - 0.06, lp(saw_pad(midi(38), d + 2.4, 0.3) * env_adsr(int((d + 2.4) * SR), 0.5, 0.4, 0.9, 2.4), 600), 0.12)
    cue(P1h - 0.3, shimmer(1.8, 21), 0.04)   # a soft glint as the camera settles
else:
    pillar_swell(P1m, P1h, 'Dadd9', 0.05, 0.45)
    cue(P1h - 0.35, shimmer(1.8, 21), 0.06); cue(P1h - 0.3, bell(midi(86), 2.8, 1.0, 2.0), 0.06); cue(P1h - 0.3, sub_boom(2.0, 70, 36), 0.12)
# act 1: Todos Sabem
pads(P1e - 0.6, P2m, PROG_A, 0.1, 0.42)
pizz_bass(P1e + bar, P2m, PROG_A, 0.16)
melody(P1e + 2 * bar, P2m - 0.8, 0.04)
# pillar 2 (orange)
pillar_swell(P2m, P2h, 'G', 0.05, 0.48)
cue(P2h - 0.35, shimmer(1.8, 22, 3000, 8000), 0.06); cue(P2h - 0.3, bell(midi(83), 2.8, 1.0, 2.0), 0.06); cue(P2h - 0.3, sub_boom(2.0, 70, 36), 0.12)
# act 2: Todos Usam (piano, light pulse)
pads(P2e - 0.6, FOLD, PROG_B, 0.085, 0.4)
pizz_bass(P2e + bar, FOLD, PROG_B, 0.15)
pulse_perc(G(26.0), FOLD - 0.3, 0.5)
melody(G(26.2), FOLD - 0.5, 0.032, inst=piano, octave=0)
# fold + flight: strings rise with the card, land on D
pads(FOLD, LAND, ['G', 'Asus'], 0.1, 0.55)
for m in [57, 62, 66, 69]:
    d = LAND - FOLD
    add(mus, FOLD, strings(midi(m), d + 0.4, 0.5) * np.linspace(0.2, 1, int((d + 0.4) * SR)) ** 1.5 * env_adsr(int((d + 0.4) * SR), 0.3, 0.1, 1, 0.5), 0.05, pan=(m % 5 - 2) / 5)
for m in [38, 50, 57, 62, 66, 69, 74]: add(mus, LAND, strings(midi(m), 3.4, 0.5) * env_adsr(int(3.4 * SR), 0.2, 0.6, 0.8, 1.6), 0.05 if m > 45 else 0.09, pan=(m % 5 - 2) / 5)
pads(LAND + 1.0, P3m + 0.5, ['D', 'Gmaj7'], 0.09, 0.45)
# pillar 3 (gold): the strongest swell of the film
pillar_swell(P3m, P3h, 'D', 0.058, 0.55)
for m in [50, 57, 62, 66]: add(mus, P3h - 0.3, brass(midi(m), 4.2) * 0.8, 0.032, pan=(m % 5 - 2) / 5)
cue(P3h - 0.4, shimmer(2.6, 23, 3000, 9000, 26), 0.08); cue(P3h - 0.3, bell(midi(86), 3.2, 1.0, 2.0), 0.07); cue(P3h - 0.25, bell(midi(90), 3.0, 1.0, 2.0), 0.05); cue(P3h - 0.3, sub_boom(2.6, 64, 32), 0.16)
# act 3: threads of reuse, then the ranking
pads(P3e - 0.6, POD, PROG_C, 0.11, 0.55)
pizz_bass(P3e + bar, POD, PROG_C, 0.15)
melody(P3e + bar, POD - 0.4, 0.045, inst=glock, octave=12)
pads(POD, REVEAL, ['Asus', 'A'], 0.1, 0.5)
for i, tt in enumerate(np.arange(G(69.3), REVEAL - 0.8, beat * 2)): add(mus, tt, timpani(midi(33), 1.4), 0.12 + i * 0.008)
add(mus, REVEAL - 1.6, snare_roll(1.6, 12, 7), 0.12)
add(mus, REVEAL - 1.4, riser(1.4, 250, 2400), 0.08)
# reveal: a warm, restrained fanfare (no crash)
add(mus, REVEAL - 0.6, reverse_swell(0.6), 0.05); add(mus, REVEAL, hp(noise(2.4), 5000) * np.exp(-t_arr(2.4) * 1.8) * 0.25, 0.12)   # soft cymbal swell, no crash
for m in [50, 57, 62, 66, 69, 74]: add(mus, REVEAL, brass(midi(m), 1.8), 0.05 if m > 55 else 0.07, pan=(m % 5 - 2) / 5)
for m in [54, 62, 66, 69, 74, 78]: add(mus, REVEAL + 1.4, brass(midi(m), 2.2), 0.042, pan=(m % 5 - 2) / 5)
pads(REVEAL, SINK, ['D', 'G', 'A', 'D'], 0.11, 0.58)
pizz_bass(REVEAL + 0.4, SINK, ['D', 'G', 'A', 'D'], 0.15)
pulse_perc(REVEAL + bar, SINK - 0.3, 0.45)
melody(REVEAL + bar, SINK - 0.3, 0.04, inst=glock, octave=12)
pads(SINK, FIN, ['G', 'Asus'], 0.11, 0.52)
# finale: the three pillars, one line
for m in [38, 50, 57, 62, 66, 69, 74]:
    d = DUR - FIN
    add(mus, FIN, strings(midi(m), d, 0.52) * env_adsr(int(d * SR), 0.6, 1.0, 0.85, 3.2), 0.07 if m > 45 else 0.12, pan=(m % 5 - 2) / 5)
for i, m in enumerate([74, 78, 81, 86, 90, 93]): add(mus, FIN + i * 0.16, celesta(midi(m), 2.8), 0.045, pan=-0.5 + i * 0.2)

# ================================================================== SOUND DESIGN on story time (v3 cues, calmer)
# (the v5 opening cues are gone: the intro clip covers story < 10.) The Todos Sabem letters pop at the
# cut on the film clock (as in src/timeline.js), Todos Usam a beat later, softly.
if INTRO['sound'] != 'clip':   # with the clip's sound, its own music already carries the letters and the cut
    for k, (t0, n, g) in enumerate([(-0.06, 11, 0.035), (0.3, 10, 0.02)]):
        for i in range(n): add(sfx, FILM0 + t0 + i * 0.05 + 0.22, pizz(midi(74 + [0, 2, 4, 7, 9][i % 5] + (i // 5) * 12 - 12), 0.35), g, -0.5 + k * 0.9)
    add(sfx, FILM0 + 0.02, thump(0.3), 0.1, -0.4)
scue(11.4, whoosh(1.0, 1200, 200, 0.3), 0.07); scue(12.3, whoosh(1.2, 200, 1600, 0.6), 0.1); scue(13.1, thump(0.3), 0.12)
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
scue(79.0, bell(midi(86), 2.4), 0.035); scue(79.8, bell(midi(93), 2.2), 0.03)
# motion-graphics layer: step tracker ticks and completion notes, focus frame, counters
for s in [26.0, 30.6, 37.5, 42.5, 48.5, 55.5]: scue(s + 0.02, click(3400, 0.02, 0.15), 0.06, 0.7)
for i, s in enumerate([30.6, 37.5, 42.5, 48.5, 55.5, 58.2]): scue(s, glock(midi(86 + [0, 2, 4, 5, 7, 9][i]), 1.2), 0.03, 0.7)
for s in [31.25, 37.6, 42.6, 47.2, 54.5, 55.7]: scue(s, click(2900, 0.025, 0.25), 0.07)
for s in [16.65, 60.35]: scue(s, bell(midi(90), 1.8), 0.04)

# ================================================================== v5 inserts (film clock)
def icue(ins, u, sig, g=1.0, pan=0.0): add(sfx, ins[0] + u / ins[2], sig, g, pan)
def uiclick(ins, u, g=0.16): icue(ins, u, click(2500, 0.035, 0.6), g, 0.1); icue(ins, u + 0.005, pop(1100, 420, 0.06), 0.03, 0.1)
# FLOWS tour: cursor, clicks, page dissolves, highlight rings, the trophies
icue(I_TOUR, 0.45, whoosh(0.6, 1200, 3200, 0.5), 0.025, 0.4)
for u in (1.75, 3.2, 5.6, 7.05): uiclick(I_TOUR, u)
for u in (1.85, 5.7, 7.15): icue(I_TOUR, u, whoosh(0.55, 700, 3000, 0.45), 0.06, -0.1)
for u, m in ((1.25, 86), (3.15, 88), (3.95, 90), (6.55, 86)): icue(I_TOUR, u, glock(midi(m), 1.2), 0.028, 0.3)
for i in range(5): icue(I_TOUR, 7.85 + i * 0.15, tink(2600 + i * 260), 0.035, -0.5 + i * 0.25)
# name anatomy: one note per part of the name, then a small chord for the whole pattern
for u, m in ((0.25, 81), (1.65, 85), (3.05, 88)): icue(I_NAME, u, marker(0.24), 0.06); icue(I_NAME, u + 0.02, glock(midi(m), 1.4), 0.045)
for i, m in enumerate((81, 85, 88, 93)): icue(I_NAME, 4.35 + i * 0.05, celesta(midi(m), 1.8), 0.03, -0.3 + i * 0.2)
icue(I_NAME, 4.35, shimmer(1.2, 61), 0.04)
# Detalhes: the page dissolves in, clicks, the area list, typing, chips, description, share
icue(I_DET, 0.05, whoosh(0.6, 600, 3000, 0.5), 0.07)
for u in (1.95, 3.05, 3.75, 5.65, 7.0, 8.0, 9.15): uiclick(I_DET, u)
icue(I_DET, 1.99, glock(midi(86), 1.0), 0.025)                       # Template selected
icue(I_DET, 3.1, pop(800, 400, 0.08), 0.04); icue(I_DET, 3.8, tink(2900), 0.04)   # list opens, DTS chosen
for a, b in ((4.6, 5.6), (8.1, 9.1)): icue(I_DET, a, whoosh((b - a) / I_DET[2], 1500, 900, 0.5, 0.6), 0.025, 0.2)   # scroll
for i in range(9): icue(I_DET, 5.75 + i * 0.083, key(700 + i), 0.16, -0.1)                 # domingues
for i in range(6): icue(I_DET, 7.1 + i * 0.075, key(720 + i), 0.16, -0.1)                  # talita
for u in (6.55, 7.6): icue(I_DET, u, pop(1300, 700, 0.07), 0.03)                          # suggestion
for u in (7.02, 8.02): icue(I_DET, u, pop(900, 300, 0.12), 0.06); icue(I_DET, u + 0.03, tink(3200), 0.03)   # chip
R5 = np.random.default_rng(55)
for i in range(38): icue(I_DET, 9.25 + i * 0.045 + R5.random() * 0.012, key(800 + i), 0.09 + R5.random() * 0.04, 0.05)   # description
for u in (11.0, 11.45): icue(I_DET, u, marker(0.26), 0.06)
icue(I_DET, 12.85, click(2200, 0.05, 0.7), 0.34); icue(I_DET, 12.87, bell(midi(86), 1.8), 0.05); icue(I_DET, 12.9, shimmer(1.0, 63), 0.04)

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
if INTRO['ident']:
    # ident dips to black in its last 0.65 s: the sound breathes with it
    dip = np.ones(N); a0, a1, a2 = int((IDENT - 0.65) * SR), int(IDENT * SR), int((IDENT + 0.8) * SR)
    dip[a0:a1] = np.linspace(1, 0.55, a1 - a0); dip[a1:a2] = np.linspace(0.55, 1, a2 - a1)
    mix *= dip
if INTRO['sound'] == 'clip':
    # Fabio's own sound (the finger snap at 3.0 s, DTS appearing at 4.2-4.8 s) keeps playing over the picture
    # cut (at 9.5 s) until its musical hit at 10.0 s and the clip's end (10.45 s): the cut is never heard.
    # The hit then rings out in the film's reverb, and the score's strings bloom out of it (same chord).
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, 'clip.wav')
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', os.path.join(HERE, '..', 'media', 'entrada_fabio.mp4'), '-vn', '-ac', '2', '-ar', str(SR), wav], check=True)
        with wave.open(wav) as cw: clip = np.frombuffer(cw.readframes(cw.getnframes()), np.int16).astype(float).reshape(-1, 2).T / 32768
    L = clip.shape[1]; u = np.arange(L) / SR; end = L / SR
    clip = clip * np.where(u < end - 0.12, 1.0, np.cos(0.5 * np.pi * np.clip((u - (end - 0.12)) / 0.12, 0, 1)))   # no click at the file end
    tail_src = clip * (u > 9.85)                                   # the hit, sent to the film's reverb so it decays naturally
    tail = np.vstack([fftconvolve(tail_src[c], ir[c]) for c in range(2)]) * 0.55
    ref = mix[:, int((FILM0 + 1.2) * SR):int((FILM0 + 6.0) * SR)]
    lvl = np.sqrt(np.mean(ref ** 2)) / (np.sqrt(np.mean(clip[:, int(4.0 * SR):int(9.4 * SR)] ** 2)) + 1e-9)
    i0 = int(ID * SR)
    n = min(L, N - i0); mix[:, i0:i0 + n] += clip[:, :n] * lvl
    n = min(tail.shape[1], N - i0); mix[:, i0:i0 + n] += tail[:, :n] * lvl
    print('clip level x%.2f' % lvl)
fi = int((0.8 if INTRO['ident'] else 0.05) * SR); fo = int(2.2 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi); mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
def limiter(x, ceil=0.89):
    peak = np.max(np.abs(x), axis=0)
    g = np.minimum(1, ceil / (peak + 1e-9))
    gs = np.copy(g); a = np.exp(-1 / (0.08 * SR))
    for i in range(1, len(gs)):
        gs[i] = g[i] if g[i] < gs[i - 1] else a * gs[i - 1] + (1 - a) * g[i]
    return x * gs
rms = np.sqrt(np.mean(mix ** 2))
mix *= 0.15 / (rms + 1e-9)
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
mix = limiter(mix, 0.89)
out = (np.clip(mix, -1, 1).T * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('dur', DUR, 'peak', np.abs(mix).max(), 'rms dB', 20 * np.log10(np.sqrt(np.mean(mix ** 2))))
