"""Original score + sound design for the FLOWS short, synthesized from scratch.
Every cue is placed on the same timeline as the animation (see src/timeline.js)."""
import numpy as np, wave, sys, math
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 72.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
mus = np.zeros((2, N)); sfx = np.zeros((2, N))

def t_arr(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
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

# ------------------------------------------------------------------ SCORE (D major, 100 bpm)
BPM = 100; beat = 60 / BPM; bar = beat * 4
chords = {  # midi notes
    'D': [50, 57, 62, 66, 69], 'Bm': [47, 54, 59, 62, 66], 'G': [43, 50, 55, 59, 62, 66], 'A': [45, 52, 57, 61, 64],
    'Em': [40, 47, 52, 55, 59, 64], 'Dsus': [50, 57, 62, 67, 69], 'F#m': [42, 49, 54, 57, 61], 'Gmaj7': [43, 50, 54, 59, 62, 66],
}
# section plan: (start, end, progression, energy)
prog_intro = ['D', 'Bm', 'G', 'A']
prog_main = ['D', 'A', 'Bm', 'G']
prog_lift = ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D']

def pad_section(t0, t1, prog, gain, bright):
    t = t0; i = 0
    while t < t1 - 0.01:
        d = min(bar, t1 - t)
        c = chords[prog[i % len(prog)]]
        for m in c:
            s = saw_pad(midi(m), d + 1.2, bright) * env_adsr(int((d + 1.2) * SR), 0.35, 0.4, 0.8, 1.1)
            add(mus, t, lp(s, 1800 + bright * 2500), gain * (0.9 if m < 50 else 0.55), pan=(m % 7 - 3) / 6)
        t += bar; i += 1

def arp_section(t0, t1, prog, gain, patt=(0, 2, 1, 3, 2, 4, 3, 1), div=2, octave=12, tone=0.5):
    step = beat / div; t = t0; k = 0
    while t < t1 - 0.01:
        ci = int((t - t0) // bar)
        c = chords[prog[ci % len(prog)]]
        m = sorted(c)[patt[k % len(patt)] % len(c)] + octave
        add(mus, t, pluck(midi(m), 1.0, tone), gain * (1.0 if k % 4 == 0 else 0.7), pan=0.35 * math.sin(k * 0.9))
        t += step; k += 1

def bass_section(t0, t1, prog, gain):
    t = t0; i = 0
    while t < t1 - 0.01:
        c = chords[prog[i % len(prog)]]
        root = min(c)
        while root > 45: root -= 12
        for b in range(4):
            tb = t + b * beat
            if tb >= t1: break
            d = beat * 0.95; tt = t_arr(d)
            s = (np.sin(2 * np.pi * midi(root) * tt) + 0.25 * np.sin(2 * np.pi * midi(root) * 2 * tt)) * env_adsr(len(tt), 0.01, 0.1, 0.7, 0.08)
            add(mus, tb, np.tanh(s * 1.4), 0.82 * gain * (1 if b % 2 == 0 else 0.75))
        t += bar; i += 1

def drums_section(t0, t1, gain, hats=True, kick_every=2):
    t = t0; k = 0
    while t < t1 - 0.01:
        if k % kick_every == 0: add(mus, t, kick(), gain * 0.75)
        if hats:
            for j in range(4):
                add(mus, t + j * beat / 4, shaker(k * 4 + j), gain * 0.18 * (1.0 if j == 2 else 0.6), pan=0.3)
        t += beat; k += 1

# --- intro (0 - 6.2)
add(mus, 0.0, lp(saw_pad(midi(38), 7.0, 0.3) * env_adsr(7 * SR, 2.5, 0.5, 0.9, 2.0), 600), 0.35)
add(mus, 0.0, lp(saw_pad(midi(50), 7.0, 0.3) * env_adsr(7 * SR, 3.0, 0.5, 0.9, 2.0), 900), 0.18)
pad_section(1.6, 6.4, prog_intro, 0.16, 0.35)
arp_section(1.6, 6.2, prog_intro, 0.09, patt=(0, 2, 4, 2), div=2, octave=24, tone=0.3)
# --- home + library (6.2 - 26): groove
pad_section(6.2, 26.0, prog_main, 0.14, 0.45)
arp_section(6.2, 26.0, prog_main, 0.11, div=2, octave=12)
bass_section(6.2, 17.4, prog_main, 0.20)
drums_section(6.2, 17.2, 0.45, hats=True, kick_every=2)
bass_section(18.4, 26.0, prog_main, 0.22)
drums_section(18.4, 26.0, 0.5, hats=True, kick_every=1)
# --- steps (26 - 57): steady, lighter (UI sounds on top)
pad_section(26.0, 57.0, prog_main, 0.12, 0.4)
arp_section(26.0, 57.0, prog_main, 0.075, patt=(0, 3, 1, 4, 2, 3), div=2, octave=12, tone=0.7)
bass_section(26.0, 57.0, prog_main, 0.17)
drums_section(26.0, 57.0, 0.33, hats=True, kick_every=2)
# --- publish lift (57 - 64)
pad_section(57.0, 61.1, ['G', 'A'], 0.15, 0.6)
arp_section(57.0, 61.1, ['G', 'A'], 0.11, div=4, octave=12, tone=0.4)
drums_section(57.0, 61.0, 0.42, hats=True, kick_every=1)
pad_section(61.1, 64.4, ['D', 'Bm'], 0.18, 0.7)
arp_section(61.1, 64.4, ['D', 'Bm'], 0.12, div=2, octave=24, tone=0.3)
bass_section(61.1, 64.4, ['D', 'Bm'], 0.24)
drums_section(61.1, 64.4, 0.5, hats=True, kick_every=1)
# --- outro (64 - 72): resolve
for m in [38, 50, 57, 62, 66, 69, 74]:
    s = saw_pad(midi(m), 8.0, 0.5) * env_adsr(8 * SR, 0.6, 1.0, 0.85, 4.5)
    add(mus, 64.2, lp(s, 3200), 0.15 if m > 45 else 0.3, pan=(m % 5 - 2) / 4)
arp_section(64.4, 69.5, ['D', 'G', 'D', 'A'], 0.08, patt=(0, 2, 4, 5, 4, 2), div=2, octave=24, tone=0.25)
for i, tt in enumerate([65.6, 65.9, 66.2]):
    add(mus, tt, bell(midi(74 + [0, 4, 7][i]), 3.0), 0.12, pan=[-0.4, 0, 0.4][i])

# ------------------------------------------------------------------ SFX cues
def cue(t0, sig, g=1.0, pan=0.0): add(sfx, t0, sig, g, pan)
# intro
cue(0.2, reverse_swell(1.35), 0.12)
cue(0.5, whoosh(1.1, 5000, 300, 0.7, 1.0), 0.35, 0.2)           # shooting star
cue(1.55, sub_boom(2.2), 0.9); cue(1.55, lp(noise(1.2), 2500) * np.exp(-t_arr(1.2) * 4), 0.25)
cue(1.6, bell(midi(86), 3.0), 0.12); cue(1.62, sparkle(1.2, 26, seed=2), 0.10)
cue(1.8, whoosh(0.9, 600, 5000, 0.4), 0.18)                      # title reveal
for i, tt in enumerate([2.8, 2.93, 3.19, 3.32]): cue(tt + 0.2, pop(1200 - i * 80, 380, 0.14), 0.22, -0.5 + i * 0.33)
cue(3.0, whoosh(0.9, 800, 7000, 0.6, 0.8), 0.22)                 # ring draw
cue(3.9, bell(midi(81), 3.0), 0.16); cue(3.9, sparkle(0.9, 22, seed=3), 0.14); cue(3.9, sub_boom(1.2, 90, 45), 0.35)
cue(4.6, whoosh(0.7, 1500, 400, 0.3), 0.12)                       # HUD in
cue(5.55, whoosh(0.8, 3000, 300, 0.5), 0.2)                       # title out
# home
cue(5.9, riser(1.1, 300, 2000), 0.14)
cue(6.0, sparkle(0.8, 14, 2500, 7000, seed=4), 0.08)
for i in range(7): cue(7.1 + i * 0.1, whoosh(0.55, 400 + i * 150, 2500 + i * 300, 0.45), 0.16, -0.8 + i * 0.27)
cue(8.7, pop(700, 300, 0.12), 0.18); cue(8.75, bell(midi(88), 1.5), 0.08)   # wave "hi"
# open library
cue(13.6, whoosh(0.6, 2000, 900, 0.5), 0.1)
cue(14.35, click(3000, 0.04), 0.5); cue(14.36, bell(midi(90), 1.2), 0.08)
cue(14.6, whoosh(1.5, 300, 3500, 0.6), 0.3)
cue(16.1, riser(1.45, 250, 3000), 0.2)
cue(17.5, sub_boom(2.0, 80, 35), 0.6); cue(17.5, whoosh(1.2, 5000, 400, 0.08), 0.22); cue(17.55, sparkle(1.4, 30, seed=5), 0.14)
# library reveal
for i in range(16): cue(18.2 + i * 0.05, whoosh(0.45, 700, 3000, 0.4), 0.05, math.sin(i) * 0.8)
cnt_ticks = []
for k in range(1, 37):
    v = k * 12.25 / 441
    u = -math.log2(max(1e-6, 1 - v)) / 10
    if u <= 1: cnt_ticks.append(18.7 + u * 2.2)
for i, tt in enumerate(cnt_ticks): cue(tt, click(2000 + i * 55, 0.03, 0.2), 0.22)
cue(20.9, bell(midi(85), 2.0), 0.12)
cue(21.0, pop(800, 260, 0.14), 0.2); 
for i in range(5): cue(21.4 + i * 0.1, pop(1400 + i * 90, 500, 0.08), 0.12, -0.6 + i * 0.3)
cue(21.6, whoosh(0.8, 4000, 900, 0.3), 0.12)
# STEP 1
cue(26.2, lp(noise(1.0), 400) * env_adsr(SR, 0.3, 0.2, 0.6, 0.4), 0.35); cue(26.2, whoosh(0.9, 200, 1200, 0.7), 0.25)
cue(26.75, pop(1000, 420, 0.14), 0.25); cue(26.8, sparkle(0.5, 10, seed=6), 0.07)
cue(28.25, click(1800, 0.06, 0.8), 0.7); cue(28.25, sub_boom(1.2, 110, 50), 0.45); cue(28.26, sparkle(0.9, 26, seed=7), 0.16); cue(28.27, bell(midi(86), 1.8), 0.12)
cue(28.8, whoosh(1.1, 400, 5000, 0.5), 0.3, 0.4)
# STEP 2: typing
name = '[DTS] - Change Management - Mapa de Impactos'
for i in range(1, len(name) + 1): cue(32.3 + i * 3.9 / len(name) - 0.01, key(100 + i), 0.33, 0.1)
cue(36.4, pop(1100, 450, 0.12), 0.22); cue(36.42, sparkle(0.4, 8, seed=8), 0.06)
# STEP 3
cue(38.6, click(2600, 0.035), 0.3)
for i in range(1, 4): cue(38.9 + i * 0.183, key(200 + i), 0.33, 0.1)
cue(39.5, whoosh(0.35, 3000, 1200, 0.3), 0.12); cue(39.52, click(3500, 0.025, 0.2), 0.18)
cue(40.2, click(4200, 0.02, 0.1), 0.15)
cue(40.9, click(2800, 0.04), 0.45); cue(40.95, bell(midi(88), 1.4), 0.09)
cue(41.6, pop(1100, 450, 0.12), 0.2)
# STEP 4
for tt in (43.65, 44.1): cue(tt, bell(midi(79), 0.5, 1.0, 2.0), 0.08)
cue(43.7, pop(1100, 450, 0.12), 0.2)
cue(44.3, click(2600, 0.035), 0.4); cue(44.35, whoosh(0.7, 500, 4000, 0.5), 0.22, 0.5)
drum_ticks = []
for n in (3, 2, 1, 0.5):
    v = (3.2 - n) / 3.2
    u = 1 - (1 - v) ** (1 / 5)
    drum_ticks.append(44.9 + u * 2.0)
extra = [44.9 + (1 - (1 - (3.2 - n) / 3.2) ** 0.2) * 2 for n in np.arange(3.1, 0.2, -0.25)]
for i, tt in enumerate(sorted(set([round(x, 3) for x in extra]))): cue(tt, click(1500 + i * 40, 0.03, 0.6), 0.28, 0.5)
cue(46.75, bell(midi(86), 1.8), 0.14); cue(46.76, sparkle(0.6, 14, seed=9), 0.1)
cue(47.3, whoosh(0.55, 3000, 700, 0.4), 0.2)
cue(47.8, bell(midi(90), 1.5), 0.1); cue(47.8, pop(1300, 600, 0.1), 0.18)
cue(48.0, click(2600, 0.035), 0.25)
for i in range(1, 4): cue(48.2 + i * 0.183, key(300 + i), 0.33, 0.1)
cue(48.4, pop(1100, 450, 0.12), 0.18)
# STEP 5
cue(49.8, pop(600, 200, 0.2), 0.35); cue(49.8, thump(0.3), 0.25)
cue(50.0, click(2400, 0.04), 0.35)
for i in range(6):
    cue(50.5 + i * 0.44, whoosh(0.5, 900, 3500, 0.55), 0.14, 0.6 - i * 0.2)
    cue(50.95 + i * 0.44, thump(0.3), 0.32 if i == 0 else 0.22)
    cue(50.95 + i * 0.44, pop(900 - i * 40, 350, 0.08), 0.1)
cue(51.0, bell(midi(86), 1.2), 0.08)
cue(53.7, whoosh(0.35, 600, 1800, 0.5), 0.2); cue(53.85, thump(0.35), 0.35); cue(54.05, thump(0.3), 0.3)
cue(54.3, bell(midi(88), 2.0), 0.14); cue(54.3, sparkle(0.9, 22, seed=10), 0.12)
cue(54.6, whoosh(0.9, 300, 3000, 0.6), 0.26)
cue(55.3, click(3000, 0.03), 0.3); cue(55.32, bell(midi(93), 1.6), 0.1)
# STEP 6
cue(57.0, whoosh(0.6, 2500, 900, 0.5), 0.08)
cue(57.9, click(2200, 0.05, 0.7), 0.55); cue(57.92, bell(midi(86), 1.2), 0.1)
cue(58.0, whoosh(0.6, 800, 3000, 0.6), 0.12)
cue(59.1, riser(0.35, 500, 3000), 0.2)
cue(59.4, sparkle(1.0, 30, seed=11), 0.2); cue(59.4, pop(700, 250, 0.18), 0.3); cue(59.4, sub_boom(1.0, 90, 45), 0.3)
cue(59.8, riser(1.3, 300, 2600), 0.2); cue(59.8, whoosh(1.3, 400, 5000, 0.7), 0.2, -0.3)
cue(61.1, sub_boom(2.4, 75, 32), 0.85); cue(61.1, whoosh(1.0, 5000, 300, 0.05), 0.2); cue(61.12, sparkle(1.6, 40, seed=12), 0.2)
for i, m in enumerate([74, 78, 81, 86]): cue(61.15 + i * 0.07, bell(midi(m), 2.4), 0.1, -0.4 + i * 0.27)
for i in range(24): cue(61.25 + rng.random() * 0.5, pop(1600 + rng.random() * 1200, 700, 0.05), 0.05, rng.uniform(-0.9, 0.9))
cue(61.5, pop(1000, 400, 0.14), 0.2)
# outro
cue(64.3, whoosh(2.0, 300, 2500, 0.5), 0.2)
cue(64.9, bell(midi(81), 3.5), 0.14); cue(64.9, sparkle(1.4, 30, seed=13), 0.14); cue(64.95, sub_boom(1.6, 80, 40), 0.35)
for i, tt in enumerate([65.6, 65.9, 66.2]): cue(tt, sub_boom(0.9, 110, 60), 0.16); cue(tt, whoosh(0.5, 3000, 800, 0.2), 0.08)
cue(66.9, sparkle(0.9, 16, seed=14), 0.07)

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
