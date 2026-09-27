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
IDENT = float(re.search(r'export const IDENT = ([0-9.]+)', open(os.path.join(HERE, '..', 'src', 'ident.js')).read()).group(1))
INTRO = json.loads(re.search(r'INTRO = (\{.*?\});', open(os.path.join(HERE, '..', 'src', 'pace.js')).read()).group(1))
FILM0 = IDENT + INTRO['dur']   # Fabio's intro clip plays in [IDENT, FILM0)
G = lambda s: FILM0 + float(np.interp(s, st, nt))
IU = lambda u: IDENT + u
# inserts (v5): flat segments of PACE, in order: FLOWS tour, name anatomy, Detalhes page
DESIGN = json.loads(re.search(r'INSERT_DESIGN = (\{.*?\});', open(os.path.join(HERE, '..', 'src', 'pace.js')).read()).group(1))
INS = [(PACE[i][0], PACE[i + 1][0]) for i in range(len(PACE) - 1) if PACE[i][1] == PACE[i + 1][1]]
# insert beats are given on each insert's design clock
TOUR, NAME, DET = [(lambda a, b, n: (lambda u: FILM0 + a + u * (b - a) / DESIGN[n]))(a, b, n) for (a, b), n in zip(INS, ['tour', 'name', 'det'])]
# (global time, scene, act colour): ident beats in global time, film beats placed from story time
beats = [(3.4, 'Vinheta A&M: trilhas de luz no palco', AMB), (5.3, 'O monograma nasce da luz', AMB), (8.2, 'Alvarez & Marsal apresenta', AMB),
         (IU(1.2), 'Fabio abre o filme', None), (IU(2.5), 'Uma piscadela e o convite', None), (IU(5.3), 'O emblema DTS na praça', None),
         (IU(8.0), 'Como DTS compartilha conhecimento', None), (G(11.4), 'Pilar 01 · Todos Sabem', BLUE), (G(14.0), 'Início do FLOWS', BLUE),
         (TOUR(1.6), 'Tour: Catálogo de Métodos', BLUE), (TOUR(4.4), 'Os métodos de DTS', BLUE), (TOUR(8.8), 'Biblioteca: cada skill com sua pontuação', BLUE),
         (G(19.6), '441 skills na Biblioteca', BLUE), (G(25.3), 'Pilar 02 · Todos Usam', ORANGE), (G(28.0), 'Passo 1 · Compartilhar Skill', ORANGE),
         (G(34.0), 'Passo 2 · o nome digitado', ORANGE), (NAME(4.6), 'Prefixo · Service Line · Entregável', ORANGE), (G(40.0), 'Passo 3 · Flows / Claude', ORANGE),
         (G(45.3), 'Passo 4 · modelo testado', ORANGE), (G(51.5), 'Passo 5 · arquivos → ZIP', ORANGE), (DET(2.3), 'Passo 6 · Detalhes: Template', ORANGE),
         (DET(4.0), 'Área responsável: DTS — Performance', ORANGE), (DET(7.9), 'Co-responsáveis', ORANGE), (DET(11.3), 'Descrição: entregável e resultado', ORANGE),
         (G(59.2), 'O voo da skill (troféu 95)', ORANGE), (G(61.0), 'Publicada: 442 skills', ORANGE), (G(63.3), 'Pilar 03 · Somos Exemplo', GOLD),
         (G(71.6), 'Ranking de áreas: pódio', GOLD), (G(74.3), 'DTS nº 1 · 1.557 pontos', GOLD), (G(80.4), 'Todos Sabem. Todos Usam. Somos Exemplo.', GOLD)]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + 44 + pad) + pad
sh = Image.new('RGB', (W, H), (14, 12, 38)); dr = ImageDraw.Draw(sh)
dur = IDENT + x[-1]
dr.text((pad, 26), f'DTS · Todos Sabem, Todos Usam, Somos Exemplo — storyboard do curta 3D v6 ({int(dur) // 60}:{int(dur) % 60:02d})', fill=GOLD, font=F(32))
dr.text((pad, 72), '1920×1080 · 24 fps · abertura Alvarez & Marsal · entrada do Fabio · tour do FLOWS · anatomia do nome · etapa Detalhes · ranking', fill=(196, 190, 222), font=F(20, 400))
for k, (t, name, col) in enumerate(beats):
    f = os.path.join(fr, f'f_{int(round(t * 24)):05d}.jpg')
    X = pad + (k % cols) * (w + pad); Y = 120 + (k // cols) * (h + 44 + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (X, Y))
    if col: dr.rectangle([X, Y + h, X + w, Y + h + 4], fill=col)
    dr.text((X, Y + h + 12), f'{int(t) // 60}:{int(t) % 60:02d}', fill=col or (238, 232, 250), font=F(22))
    dr.text((X + 70, Y + h + 12), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
