"""Storyboard sheet from rendered frames: python3 tools/storyboard.py out/frames video/storyboard.jpg"""
import sys, os, json, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda s, w=700: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if w >= 700 else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BLUE, ORANGE, GOLD, AMB = (61, 139, 255), (255, 138, 31), (242, 181, 68), (0, 133, 202)
# story time -> film time: same monotone warp as src/util.js over src/pace.js
PACE = json.loads(re.search(r'PACE = (\[.*?\]);', open(os.path.join(HERE, '..', 'src', 'pace.js')).read(), re.S).group(1))
x = np.array([k[0] for k in PACE], float); y = np.array([k[1] for k in PACE], float); n = len(x)
d = np.diff(y) / np.diff(x); m = np.zeros(n); m[0] = d[0]; m[-1] = d[-1]
for i in range(1, n - 1): m[i] = 0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2
for i in range(n - 1):
    if d[i] == 0: m[i] = m[i + 1] = 0; continue
    a = m[i] / d[i]; b = m[i + 1] / d[i]; s = a * a + b * b
    if s > 9: tau = 3 / np.sqrt(s); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]
def S(t):
    t = np.asarray(t, float); i = np.clip(np.searchsorted(x, t) - 1, 0, n - 2); h = x[i + 1] - x[i]; u = (t - x[i]) / h
    return (2*u**3 - 3*u**2 + 1)*y[i] + (u**3 - 2*u**2 + u)*h*m[i] + (-2*u**3 + 3*u**2)*y[i + 1] + (u**3 - u**2)*h*m[i + 1]
nt = np.linspace(0, x[-1], 200001); st = S(nt)
IDENT = 9.6
G = lambda s: IDENT + float(np.interp(s, st, nt))
# (global time, scene, act colour): ident beats in global time, film beats placed from story time
beats = [(3.4, 'Vinheta A&M: trilhas de luz no palco', AMB), (5.3, 'O monograma nasce da luz', AMB), (8.2, 'Alvarez & Marsal apresenta', AMB),
         (G(3.0), 'Emblema DTS 3D', None), (G(7.9), 'Como a DTS compartilha conhecimento', None), (G(11.4), 'Pilar 01 · Todos Sabem', BLUE),
         (G(14.0), 'Início do FLOWS', BLUE), (G(17.8), '441 skills na Biblioteca', BLUE), (G(22.8), 'Skills prontas para reuso', BLUE),
         (G(25.3), 'Pilar 02 · Todos Usam', ORANGE), (G(28.0), 'Passo 1 · Compartilhar Skill', ORANGE), (G(34.0), 'Passo 2 · nome + prefixo [DTS]', ORANGE),
         (G(40.0), 'Passo 3 · Flows / Claude', ORANGE), (G(45.3), 'Passo 4 · modelo testado', ORANGE), (G(51.5), 'Passo 5 · arquivos → ZIP', ORANGE),
         (G(56.2), 'Passo 6 · Próximo', ORANGE), (G(59.2), 'O voo da skill até a Biblioteca', ORANGE), (G(61.0), 'Publicada: 442 skills', ORANGE),
         (G(63.3), 'Pilar 03 · Somos Exemplo', GOLD), (G(66.5), 'Referência para todo o time', GOLD), (G(71.6), 'Ranking de áreas: pódio', GOLD),
         (G(74.3), 'DTS nº 1 · 1.557 pontos', GOLD), (G(77.0), 'O emblema retorna', GOLD), (G(80.4), 'Todos Sabem. Todos Usam. Somos Exemplo.', GOLD)]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + 44 + pad) + pad
sh = Image.new('RGB', (W, H), (14, 12, 38)); dr = ImageDraw.Draw(sh)
dur = IDENT + x[-1]
dr.text((pad, 26), f'DTS · Todos Sabem, Todos Usam, Somos Exemplo — storyboard do curta 3D v4 ({int(dur) // 60}:{int(dur) % 60:02d})', fill=GOLD, font=F(32))
dr.text((pad, 72), '1920×1080 · 24 fps · abertura Alvarez & Marsal · ritmo MOVER → ASSENTAR → LER → ABSORVER → TRANSIÇÃO em cada pilar', fill=(196, 190, 222), font=F(20, 400))
for k, (t, name, col) in enumerate(beats):
    f = os.path.join(fr, f'f_{int(round(t * 24)):05d}.jpg')
    X = pad + (k % cols) * (w + pad); Y = 120 + (k // cols) * (h + 44 + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (X, Y))
    if col: dr.rectangle([X, Y + h, X + w, Y + h + 4], fill=col)
    dr.text((X, Y + h + 12), f'{int(t) // 60}:{int(t) % 60:02d}', fill=col or (238, 232, 250), font=F(22))
    dr.text((X + 70, Y + h + 12), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
