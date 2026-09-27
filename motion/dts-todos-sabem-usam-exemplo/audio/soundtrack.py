"""DTS · Todos Sabem, Todos Usam, Somos Exemplo (v3) — original score and sound design,
synthesized from scratch on the same clock as src/timeline.js: a 6 s Alvarez & Marsal
studio ident, then the film (film time + OFF)."""
import numpy as np, wave, sys, math
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 88.2
N = int(SR * DUR)
rng = np.random.default_rng(7)
mus = np.zeros((2, N)); sfx = np.zeros((2, N))

def t_arr(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
OFF = 0.0  # 0 for the ident, 6.0 (IDENT) for film-time cues
def add(buf, t0, sig, gain=1.0, pan=0.0):
    i0 = int((t0 + OFF) * SR)
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
def ticks_for(c0, c1, n, f0=2200, g=0.12, pan=0.0, p=3):
    # ticks at equal value steps of an outCubic count-up between c0 and c1
    for i in range(1, n + 1):
        u = 1 - (1 - i / n) ** (1 / p)
        cue(c0 + u * (c1 - c0), click(f0 + i * 25, 0.024, 0.15), g, pan)
def cue(t0, sig, g=1.0, pan=0.0): add(sfx, t0, sig, g, pan)

# ------------------------------------------------------------------ STUDIO IDENT (global 0-6 s): Alvarez & Marsal
OFF = 0.0
add(mus, 0.2, lp(saw_pad(midi(38), 5.8, 0.28) * env_adsr(int(5.8 * SR), 1.8, 0.4, 0.9, 1.4), 600), 0.2)
for m in [50, 57, 62, 66]: add(mus, 1.2, strings(midi(m), 4.6, 0.4) * env_adsr(int(4.6 * SR), 1.2, 0.6, 0.85, 1.6), 0.065, pan=(m % 5 - 2) / 5)
for i in range(14): cue(0.45 + i * 0.05, pluck(midi(62 + [0, 2, 4, 7, 9, 11, 12][i % 7] + (i // 7) * 12), 0.8, 0.3), 0.06, -0.8 + i * 0.1)
cue(0.35, whoosh(0.9, 800, 5000, 0.6), 0.1, -0.6)
for k, (t0, m) in enumerate([(1.2, 74), (1.45, 78), (1.75, 81)]):
    cue(t0, whoosh(0.5, 180, 1400, 0.7), 0.14, -0.4 + k * 0.4); cue(t0 + 0.42, thump(0.3), 0.3, -0.4 + k * 0.4); cue(t0 + 0.42, bell(midi(m), 1.8), 0.08, -0.4 + k * 0.4)
cue(1.88, sub_boom(1.6, 80, 38), 0.35)
for k, (t0, m) in enumerate([(2.45, 86), (2.62, 90), (2.8, 93)]):
    cue(t0, click(3000 + k * 400, 0.03, 0.3), 0.3, 0.4); cue(t0 + 0.02, glock(midi(m), 1.0), 0.06, 0.4)
cue(3.3, sparkle(1.2, 34, 3500, 10000, seed=90), 0.14); cue(3.32, bell(midi(98), 2.4), 0.07); cue(3.3, whoosh(1.1, 1200, 6000, 0.5), 0.08, 0.3)
for m in [62, 66, 69, 74]: add(mus, 3.5, celesta(midi(m + 12), 2.4), 0.045, pan=(m % 5 - 2) / 5)
OFF = 6.0

# ------------------------------------------------------------------ SCORE: D major, 96 bpm
BPM = 96; beat = 60 / BPM; bar = beat * 4
CH = {'D': [50, 57, 62, 66, 69], 'Bm': [47, 54, 59, 62, 66], 'G': [43, 50, 55, 59, 62], 'A': [45, 52, 57, 61, 64], 'Em': [40, 47, 52, 55, 59], 'F#m': [42, 49, 54, 57, 61], 'Gmaj7': [43, 50, 54, 59, 62], 'Asus': [45, 52, 57, 62, 64]}
def pads(t0, t1, prog, gain, bright=0.45):
    t = t0; i = 0
    while t < t1 - 0.01:
        d = min(bar, t1 - t); c = CH[prog[i % len(prog)]]
        for m in c[1:]:
            s = strings(midi(m), d + 1.4, bright) * env_adsr(int((d + 1.4) * SR), 0.45, 0.3, 0.85, 1.2)
            add(mus, t, s, gain * 0.5, pan=(m % 7 - 3) / 7)
        t += bar; i += 1
def pizz_bass(t0, t1, prog, gain, pattern=(0, 2, 1, 2)):
    t = t0; i = 0
    while t < t1 - 0.01:
        c = CH[prog[i % len(prog)]]; root = c[0]
        while root > 45: root -= 12
        notes = [root, root + 7, root + 12, root + 7]
        for b in range(4):
            tb = t + b * beat
            if tb >= t1: break
            add(mus, tb, pizz(midi(notes[pattern[b] % 4]), 0.6), gain * (1 if b == 0 else 0.7), pan=-0.2)
        t += bar; i += 1
MOTIF = [(0, 69, 0.5), (0.5, 66, 0.5), (1.0, 62, 0.5), (1.5, 66, 0.5), (2.0, 69, 1.0), (3.0, 71, 0.5), (3.5, 69, 0.5),
         (4.0, 67, 0.5), (4.5, 64, 0.5), (5.0, 61, 0.5), (5.5, 64, 0.5), (6.0, 69, 1.5), (7.5, 66, 0.5)]
def melody(t0, t1, gain, inst=celesta, octave=12, motif=MOTIF, length_beats=8):
    t = t0
    while t < t1 - 0.01:
        for (b, m, dur) in motif:
            tb = t + b * beat
            if tb >= t1: break
            add(mus, tb, inst(midi(m + octave)), gain, pan=0.25)
        t += length_beats * beat
def perc(t0, t1, gain):
    t = t0; k = 0
    while t < t1 - 0.01:
        if k % 4 == 0: add(mus, t, kick(), gain * 0.55)
        if k % 4 == 2: add(mus, t, snap(k), gain * 0.35, pan=0.2)
        for j in range(2): add(mus, t + j * beat / 2, shaker(k * 2 + j), gain * 0.12, pan=0.35)
        t += beat; k += 1

PROG_A = ['D', 'Bm', 'G', 'A']
PROG_B = ['D', 'A', 'Bm', 'G']
PROG_C = ['G', 'A', 'F#m', 'Bm', 'Em', 'Asus', 'D', 'D']
# intro 0-5
add(mus, 0.0, lp(saw_pad(midi(38), 6.0, 0.3) * env_adsr(6 * SR, 2.4, 0.5, 0.9, 1.8), 700), 0.28)
for i, m in enumerate([74, 78, 81, 86]): add(mus, 0.35 + i * 0.28, celesta(midi(m), 2.0), 0.07, pan=-0.3 + i * 0.2)
pads(1.4, 5.0, ['D', 'G'], 0.12, 0.35)
# Todos Sabem 5-24
pads(5.0, 24.0, PROG_A, 0.11, 0.45)
pizz_bass(5.0, 24.0, PROG_A, 0.22)
melody(7.5, 23.5, 0.055)
# Todos Usam 24-62
pads(24.0, 62.0, PROG_B, 0.09, 0.4)
pizz_bass(24.0, 62.0, PROG_B, 0.2, pattern=(0, 1, 2, 1))
perc(26.0, 57.3, 0.55)
melody(26.0, 57.0, 0.035, inst=piano, octave=0)
# publish lift 57.3-60.2
pads(57.3, 60.2, ['G', 'Asus'], 0.13, 0.6)
for i in range(16): add(mus, 57.4 + i * 0.17, pizz(midi(62 + [0, 4, 7, 12][i % 4] + (i // 4) * 2), 0.4), 0.08 + i * 0.006)
# Somos Exemplo 60.2-68.8 (threads of reuse)
pads(60.2, 68.8, PROG_C, 0.14, 0.62)
pizz_bass(60.2, 68.8, PROG_C, 0.2)
melody(62.3, 68.6, 0.06, inst=glock, octave=12)
perc(64.0, 68.4, 0.4)
# ranking build 68.8-72.95: A pedal, timpani pulses, snare roll into the reveal
pads(68.8, 72.95, ['Asus', 'A'], 0.12, 0.5)
for i, tt in enumerate(np.arange(69.3, 71.9, beat)): add(mus, tt, timpani(midi(33), 1.2), 0.2 + i * 0.012)
add(mus, 71.0, snare_roll(1.95, 16, 7), 0.22)
add(mus, 71.9, riser(1.05, 250, 3000), 0.14)
# reveal 72.95: fanfare hit + crash, then a triumphant groove
add(mus, 72.95, crash(3.2), 0.2)
for m in [50, 57, 62, 66, 69, 74]: add(mus, 72.95, brass(midi(m), 1.3), 0.1 if m > 55 else 0.14, pan=(m % 5 - 2) / 5)
for m in [52, 59, 64, 68]: add(mus, 73.57, brass(midi(m), 0.45), 0.07, pan=(m % 5 - 2) / 5)
for m in [54, 62, 66, 69, 74, 78]: add(mus, 73.88, brass(midi(m), 1.8), 0.09, pan=(m % 5 - 2) / 5)
pads(73.0, 76.4, ['D', 'G', 'A', 'D'], 0.12, 0.6)
pizz_bass(73.0, 76.4, ['D', 'G', 'A', 'D'], 0.2)
perc(73.3, 76.2, 0.5)
melody(74.2, 76.3, 0.05, inst=glock, octave=12)
# emblem return 76.4-78.1
pads(76.4, 78.1, ['G', 'Asus'], 0.12, 0.55)
# finale 78.1-82.2
for m in [38, 50, 57, 62, 66, 69, 74]:
    add(mus, 78.1, strings(midi(m), 5.0, 0.55) * env_adsr(5 * SR, 0.4, 0.8, 0.85, 3.0), 0.12 if m > 45 else 0.22, pan=(m % 5 - 2) / 5)
for i, m in enumerate([74, 78, 81, 86, 90, 93]): add(mus, 78.1 + i * 0.12, celesta(midi(m), 2.6), 0.06, pan=-0.5 + i * 0.2)

# ------------------------------------------------------------------ SFX cues (same clock as src/timeline.js)
cue(0.1, reverse_swell(1.2), 0.08)
for i in range(3):
    a = 1.4 + i * 0.18
    cue(a - 0.05, whoosh(0.4, 400, 2200, 0.7), 0.12, -0.4 + i * 0.4)
    cue(a + 0.33, thump(0.3), 0.5, -0.4 + i * 0.4); cue(a + 0.33, boing(160 + i * 20, 360 + i * 30), 0.16, -0.4 + i * 0.4)
cue(1.9, sparkle(0.9, 20, seed=31), 0.1); cue(1.95, sub_boom(1.4, 80, 40), 0.35)
cue(2.5, whoosh(0.9, 900, 5000, 0.5), 0.1); cue(2.6, sparkle(0.8, 14, seed=32), 0.06)
for k, t0 in enumerate([4.2, 4.5, 4.8]):
    cue(t0, whoosh(0.7, 200, 1400, 0.6), 0.2, -0.6 + k * 0.6); cue(t0 + 0.55, thump(0.3), 0.3, -0.6 + k * 0.6)
    n = [11, 10, 13][k]
    for i in range(n): cue(t0 + 0.6 + i * 0.06 + 0.28, pizz(midi(74 + [0, 2, 4, 7, 9][i % 5] + (i // 5) * 12 - 12), 0.35), 0.07, -0.6 + k * 0.6)
cue(6.8, whoosh(0.8, 700, 3500, 0.5), 0.14); cue(7.4, sparkle(0.6, 10, seed=33), 0.05)
cue(9.2, riser(0.8, 300, 2600), 0.22); cue(10.0, sub_boom(1.4, 90, 45), 0.45); cue(10.0, bell(midi(86), 2.0), 0.1); cue(10.02, sparkle(1.0, 24, seed=34), 0.12)
for i in range(11): cue(10.3 + i * 0.05 + 0.2, pizz(midi(74 + [0, 2, 4, 7, 9, 12][i % 6]), 0.3), 0.07, -0.5 + i * 0.1)
cue(11.4, whoosh(0.8, 1200, 200, 0.3), 0.14); cue(11.9, whoosh(0.9, 200, 1600, 0.6), 0.2); cue(12.7, thump(0.3), 0.2)
cue(13.4, bell(midi(90), 1.4), 0.09); cue(13.45, sparkle(0.5, 8, seed=35), 0.05)
cue(15.9, whoosh(0.8, 1600, 200, 0.4), 0.16)
for i in range(40): cue(16.2 + (i / 40) * 2.6 + (i % 3) * 0.02, pizz(midi(86 + [0, 2, 4, 7, 9][i % 5]), 0.25), 0.03, math.sin(i) * 0.8)
ticks = []
for k in range(1, 34):
    v = k * 13.36 / 441; u = -math.log2(max(1e-6, 1 - v)) / 10
    if u <= 1: ticks.append(16.7 + u * 2.3)
for i, tt in enumerate(ticks): cue(tt, click(2200 + i * 40, 0.028, 0.15), 0.16)
cue(19.0, bell(midi(86), 2.0), 0.12); cue(19.02, sparkle(0.8, 16, seed=36), 0.08)
for k in range(3): cue(20.7 + k * 0.18, whoosh(1.1, 300, 2400, 0.6), 0.16, -0.6 + k * 0.6); cue(21.8 + k * 0.1, glock(midi(86 + k * 4), 1.2), 0.05, -0.6 + k * 0.6)
cue(23.3, whoosh(0.8, 2400, 300, 0.3), 0.18)
cue(23.1, riser(0.9, 300, 2600), 0.2); cue(24.0, sub_boom(1.4, 95, 45), 0.45); cue(24.02, sparkle(1.0, 24, seed=37), 0.12)
for i in range(10): cue(24.3 + i * 0.05 + 0.2, pizz(midi(76 + [0, 2, 4, 7, 9][i % 5]), 0.3), 0.07, -0.5 + i * 0.1)
cue(26.35, whoosh(0.9, 150, 1100, 0.6), 0.24); cue(26.35, lp(noise(0.9), 300) * env_adsr(int(0.9 * SR), 0.2, 0.2, 0.6, 0.4), 0.3); cue(27.0, pop(700, 260, 0.14), 0.2)
cue(26.6, whoosh(1.2, 2500, 900, 0.5), 0.07)
cue(28.0, click(1800, 0.06, 0.9), 0.7); cue(28.0, thump(0.35), 0.45); cue(28.02, sub_boom(1.2, 110, 50), 0.35); cue(28.03, sparkle(1.0, 30, seed=38), 0.16); cue(28.05, bell(midi(86), 1.8), 0.12); cue(28.0, whoosh(0.9, 300, 3000, 0.1), 0.16)
cue(28.6, boing(200, 520, 0.4), 0.22); cue(28.6, whoosh(1.0, 400, 4500, 0.5), 0.24)
cue(30.2, whoosh(0.8, 1400, 200, 0.3), 0.14)
for i in range(5): cue(30.9 + i * 0.07 + 0.2, pop(900 + i * 60, 360, 0.1), 0.12, -0.6 + i * 0.1)
for i in range(5): cue(31.4 + (i + 1) * 0.24 - 0.12, key(400 + i), 0.55, -0.4); cue(31.4 + (i + 1) * 0.24 - 0.1, thump(0.12), 0.18, -0.4)
for i in range(39): cue(32.6 + (i + 1) * (2.7 / 39) - 0.01, key(500 + i), 0.3, 0.05)
cue(35.7, bell(midi(88), 1.4), 0.1); cue(35.72, pop(1100, 450, 0.12), 0.18)
for i in range(5): cue(35.8 + i * 0.05 + 0.35, pop(700 - i * 40, 250, 0.1), 0.08, -0.6)
cue(37.5, click(2600, 0.035), 0.28)
for tt in (37.95, 38.15, 38.35): cue(tt, key(int(tt * 100)), 0.34)
cue(38.7, whoosh(0.35, 3000, 1200, 0.3), 0.1); cue(38.72, click(3500, 0.025, 0.2), 0.16)
cue(39.3, click(4200, 0.02, 0.1), 0.14)
cue(39.85, click(2800, 0.04), 0.42); cue(39.86, whoosh(0.45, 1500, 3500, 0.5), 0.14); cue(40.25, pop(1000, 420, 0.12), 0.2); cue(40.27, bell(midi(88), 1.2), 0.08)
cue(40.7, pop(1100, 450, 0.12), 0.18)
cue(42.5, click(2600, 0.035), 0.28)
for tt in (42.8, 43.2, 43.6): cue(tt, bell(midi(79), 0.4, 1.0, 2.0), 0.07)
cue(43.1, whoosh(0.7, 200, 1600, 0.6), 0.2); cue(43.7, whoosh(0.6, 800, 2600, 0.5), 0.12)
for n in np.arange(17.3, 0.2, -0.5):
    v = 1 - n / 17.5
    u = 1 - (1 - v) ** 0.2
    cue(43.7 + u * 2.2, click(1500 + (17.5 - n) * 30, 0.03, 0.6), 0.22, 0.5)
cue(45.9, bell(midi(86), 1.8), 0.14); cue(45.9, click(1200, 0.05, 0.8), 0.3); cue(45.92, sparkle(0.6, 14, seed=39), 0.1)
cue(46.15, whoosh(0.5, 3000, 700, 0.4), 0.16); cue(46.6, bell(midi(90), 1.5), 0.1); cue(46.62, pop(1300, 600, 0.1), 0.16); cue(46.6, whoosh(0.7, 1400, 200, 0.3), 0.12)
cue(47.25, click(2600, 0.035), 0.24)
for tt in (47.45, 47.65, 47.85): cue(tt, key(int(tt * 100)), 0.34)
cue(47.5, pop(1100, 450, 0.12), 0.16)
cue(48.6, whoosh(0.9, 150, 1200, 0.6), 0.24); cue(49.3, thump(0.3), 0.22)
cue(49.0, click(2400, 0.04), 0.3)
for i in range(6):
    cue(49.8 + i * 0.5, whoosh(0.6, 900, 3600, 0.55), 0.14, 0.6 - i * 0.2)
    cue(50.35 + i * 0.5, thump(0.3), 0.3 if i == 0 else 0.22); cue(50.35 + i * 0.5, pop(900 - i * 40, 350, 0.08), 0.1)
cue(50.37, bell(midi(86), 1.2), 0.08)
cue(52.9, whoosh(0.35, 600, 1800, 0.5), 0.18); cue(53.1, thump(0.35), 0.32); cue(53.4, thump(0.3), 0.3)
cue(53.55, bp(noise(0.25), 2000, 7000) * np.linspace(1, 0, int(0.25 * SR)), 0.16)
cue(53.7, bell(midi(88), 2.0), 0.13); cue(53.7, sparkle(0.9, 22, seed=40), 0.12)
cue(54.0, whoosh(0.7, 300, 3000, 0.6), 0.24); cue(54.55, click(3000, 0.03), 0.28); cue(54.57, bell(midi(93), 1.6), 0.09)
cue(55.6, whoosh(0.9, 2500, 900, 0.5), 0.07)
cue(56.55, click(2200, 0.05, 0.7), 0.55); cue(56.57, bell(midi(86), 1.2), 0.09)
cue(56.8, whoosh(0.6, 800, 3000, 0.6), 0.12); cue(56.85, bell(midi(90), 1.2), 0.07)
cue(57.4, whoosh(0.8, 300, 4000, 0.8), 0.22); cue(57.95, pop(700, 250, 0.18), 0.28); cue(57.95, sparkle(1.0, 30, seed=41), 0.18)
cue(58.3, whoosh(1.9, 300, 4200, 0.75), 0.26, -0.2); cue(58.4, riser(1.8, 280, 2400), 0.18)
cue(60.2, sub_boom(2.4, 75, 32), 0.85); cue(60.2, whoosh(1.0, 5000, 300, 0.05), 0.18); cue(60.22, sparkle(1.6, 40, seed=42), 0.2)
for i, m in enumerate([74, 78, 81, 86]): cue(60.25 + i * 0.07, bell(midi(m), 2.4), 0.09, -0.4 + i * 0.27)
cue(60.3, bell(midi(93), 1.8), 0.08)
cue(61.2, riser(0.85, 300, 2600), 0.2); cue(62.05, sub_boom(1.4, 95, 45), 0.45); cue(62.07, sparkle(1.2, 30, seed=43), 0.14)
for i in range(13): cue(62.3 + i * 0.05 + 0.2, glock(midi(81 + [0, 2, 4, 7, 9][i % 5]), 0.8), 0.05, -0.6 + i * 0.1)
R2 = np.random.default_rng(9)
for i in range(34):
    t0 = 64.4 + R2.random() * 1.6
    cue(t0, whoosh(0.9, 2000, 6000, 0.6), 0.03, R2.uniform(-0.8, 0.8))
    cue(t0 + 1.4, glock(midi([74, 76, 78, 81, 83, 86, 88, 90][i % 8]), 1.2), 0.035, R2.uniform(-0.8, 0.8))
# ---- ranking de áreas (68.5-76.6)
cue(68.5, whoosh(1.0, 3000, 300, 0.45), 0.2)
cue(69.1, pop(1000, 420, 0.1), 0.16); cue(69.12, click(2800, 0.03, 0.3), 0.18); cue(69.35, pop(1100, 460, 0.1), 0.16); cue(69.37, click(3000, 0.03, 0.3), 0.16)
for k, (t0, pan) in enumerate([(69.3, 0.5), (70.2, -0.5)]):
    cue(t0, whoosh(0.7, 150, 1200, 0.65), 0.2, pan); cue(t0 + 0.45, thump(0.35), 0.35, pan); cue(t0 + 0.45, sparkle(0.5, 10, seed=70 + k), 0.06, pan)
    ticks_for(t0 + 0.45, t0 + 1.3, 16, 2000, 0.1, pan)
cue(70.3, tink(2600), 0.12, 0.5); cue(70.46, tink(2900, 0.3), 0.06, 0.5)
cue(71.25, tink(3400), 0.1, -0.5); cue(71.4, tink(3700, 0.3), 0.05, -0.5)
cue(71.9, whoosh(1.0, 120, 1400, 0.6), 0.28); cue(72.45, thump(0.4), 0.45); cue(72.45, sub_boom(1.6, 90, 40), 0.4)
ticks_for(72.35, 73.35, 26, 2300, 0.12)
cue(72.9, confetti_pop(1), 0.4, -0.7); cue(72.93, confetti_pop(2), 0.4, 0.7); cue(72.95, sparkle(2.0, 60, seed=80), 0.2); cue(72.97, tink(2200, 0.8), 0.15)
cue(73.18, whoosh(0.25, 2000, 500, 0.8), 0.14, 0.5); cue(73.22, stamp(), 0.5, 0.5); cue(73.23, sub_boom(0.9, 110, 55), 0.25)
cue(73.3, marker(0.45), 0.12, 0.4)
cue(73.7, pop(1000, 420, 0.1), 0.15, 0.5); cue(73.85, pop(1150, 480, 0.1), 0.15, 0.5)
ticks_for(73.8, 74.9, 10, 2600, 0.07, 0.5); ticks_for(74.0, 75.1, 12, 2900, 0.07, 0.5)
cue(75.9, whoosh(0.8, 1400, 150, 0.35), 0.2)
# ---- emblem returns, letterbox, end card, A&M signature
cue(76.3, whoosh(0.8, 1600, 200, 0.4), 0.16); cue(76.5, whoosh(0.9, 150, 1300, 0.6), 0.24); cue(77.1, thump(0.35), 0.4); cue(77.12, sub_boom(1.4, 80, 40), 0.35)
for k in range(3): cue(76.7 + k * 0.25, sparkle(0.6, 10, seed=50 + k), 0.06, -0.6 + k * 0.6)
cue(77.7, whoosh(1.0, 300, 900, 0.7), 0.08)
for i, tt in enumerate([78.1, 78.45, 78.8]): cue(tt, bell(midi(81 + i * 4), 2.2), 0.1, -0.5 + i * 0.5); cue(tt, sub_boom(0.8, 110, 60), 0.12)
cue(79.0, bell(midi(86), 2.0), 0.05); cue(79.3, pop(1000, 420, 0.12), 0.12); cue(79.8, pop(1200, 500, 0.12), 0.12); cue(79.82, sparkle(0.8, 14, seed=60), 0.06)
# ---- motion-graphics layer (After Effects): medallions + iris wipes
for k, b in enumerate([10.05, 24.05, 62.05]):
    cue(b - 0.62, pop(900, 380, 0.12), 0.2); cue(b - 0.6, click(2600, 0.03, 0.3), 0.2); cue(b - 0.5, sparkle(0.5, 12, seed=100 + k), 0.08)
    cue(b - 0.32, whoosh(0.35, 400, 3000, 0.9), 0.2); cue(b + 0.2, whoosh(0.5, 3000, 500, 0.2), 0.16)
    cue(b + 0.62, whoosh(0.5, 900, 3000, 0.5), 0.07, 0.6); cue(b + 1.12, click(3200, 0.03, 0.2), 0.2, 0.7); cue(b + 1.13, glock(midi(88 + k * 2), 0.9), 0.05, 0.7)
# step tracker: activation ticks and completion checks
for tt in [26.0, 30.6, 37.5, 42.5, 48.5, 55.5]: cue(tt + 0.02, click(3400, 0.02, 0.15), 0.12, 0.7)
for i, tt in enumerate([30.6, 37.5, 42.5, 48.5, 55.5, 58.2]): cue(tt, glock(midi(86 + [0, 2, 4, 5, 7, 9][i]), 1.0), 0.06, 0.7); cue(tt, pop(1300, 600, 0.08), 0.08, 0.7)
# focus frame snaps
for tt in [31.25, 37.6, 42.6, 47.2, 54.5, 55.7]: cue(tt, click(2900, 0.025, 0.25), 0.16); cue(tt + 0.02, whoosh(0.25, 2500, 5000, 0.5), 0.04)
# counter icons
for tt in [16.65, 60.35]: cue(tt, pop(1000, 420, 0.12), 0.16); cue(tt + 0.02, sparkle(0.5, 10, seed=int(tt * 10)), 0.06)
# highlighter swipes on the first key term of each subtitle
SUBS = [(12.6, 'Todos sabem onde encontrar: tudo começa no *Início do FLOWS*.'), (16.3, 'Na Biblioteca, a comunidade já reúne *441 skills* prontas para reuso.'),
        (20.7, 'E todos sabem como contribuir: compartilhar uma skill leva *6 passos*.'), (26.2, 'Clique em *Compartilhar Skill*.'), (30.8, 'Dê à skill um nome claro, com o *prefixo da área*.'),
        (37.7, 'Informe *onde ela foi testada*.'), (42.7, 'Escolha o modelo testado. O campo é *obrigatório*.'), (48.7, 'Envie tudo em um *único ZIP*, com o *SKILL.md na raiz*.'),
        (55.7, 'Avance em *Próximo* e publique para o time.'), (64.2, 'Uma skill compartilhada vira *referência* para todo o time.'), (69.3, 'No FLOWS, quem *publica e é adotado* sobe no placar.'),
        (73.1, 'E a DTS lidera: *nº 1 entre 12 áreas*, com *1.557 pontos*.')]
for t0, txt in SUBS:
    words = txt.replace('*', ' * ').split(); i = 0; hl = False
    for w in words:
        if w == '*': hl = not hl; continue
        if hl: cue(t0 + 0.45 + i * 0.05, marker(0.32), 0.05); break
        i += 1
# ------------------------------------------------------------------ mix & master
def reverb_ir(d=2.6, seed=3):
    r = np.random.default_rng(seed); n = int(d * SR); t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        x = r.standard_normal(n) * np.exp(-t * 2.6)
        x = lp(x, 7000); x[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        irs.append(x / np.sqrt((x ** 2).sum()))
    return irs
ir = reverb_ir()
def verb(x, wet):
    return np.vstack([fftconvolve(x[c], ir[c])[:N] for c in range(2)]) * wet
mus_mix = mus + verb(mus, 0.55)
sfx_mix = sfx + verb(sfx, 0.35)
# gentle ducking of music under dense UI cues
env = np.abs(lp(np.abs(sfx).sum(axis=0), 8))
duck = 1 / (1 + 1.2 * env / (env.max() + 1e-9))
mix = mus_mix * duck * 0.9 + sfx_mix
mix = hp(mix, 28)
# fade in/out
fi = int(0.6 * SR); fo = int(1.6 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi); mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
# soft-knee limiter
def limiter(x, ceil=0.89):
    peak = np.max(np.abs(x), axis=0)
    g = np.minimum(1, ceil / (peak + 1e-9))
    # smooth gain (attack fast, release slow)
    gs = np.copy(g); a = np.exp(-1 / (0.08 * SR))
    for i in range(1, len(gs)):
        gs[i] = g[i] if g[i] < gs[i - 1] else a * gs[i - 1] + (1 - a) * g[i]
    return x * gs
rms = np.sqrt(np.mean(mix ** 2))
mix *= 0.16 / (rms + 1e-9)   # ~ -16 dBFS RMS
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = limiter(mix, 0.89)
out = (np.clip(mix, -1, 1).T * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('peak', np.abs(mix).max(), 'rms dB', 20 * np.log10(np.sqrt(np.mean(mix ** 2))))
