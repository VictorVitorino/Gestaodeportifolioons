"""v8 storyboard sheet (O Fio Dourado) from rendered frames:
python3 tools/storyboard8.py out/frames8 video/storyboard8.jpg"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
F = lambda s, w=700: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if w >= 700 else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BLUE, ORANGE, GOLD, FAB = (61, 139, 255), (255, 138, 31), (242, 181, 68), (238, 232, 250)
# (film seconds, scene, act colour) — the film clock is the v8 clock (src/cut8.js)
beats = [
    (0.6, 'Fabio no mundo FLOWS', FAB), (2.6, 'O tema escrito em luz', FAB), (4.6, 'O logo FLOWS nasce do fio', FAB),
    (6.6, 'Todos Sabem · Todos Usam · Somos Exemplo', FAB), (10.2, 'Pilar 01 · Todos Sabem', BLUE), (15.0, 'Biblioteca: cada skill com sua pontuação', BLUE),
    (22.4, '441 skills prontas para reuso', BLUE), (25.4, 'Pilar 02 · Fabio apresenta', ORANGE), (27.1, 'O estalo: Compartilhar Skill', ORANGE),
    (29.6, 'Passo 1 · Compartilhar Skill', ORANGE), (34.6, 'Passo 2 · o nome padrão', ORANGE), (40.2, 'Passos 3–5 · teste, modelo, SKILL.zip', ORANGE),
    (45.0, 'Passo 6 · Detalhes', ORANGE), (48.4, 'Compartilhar Skill', ORANGE), (52.0, 'O voo do card', ORANGE),
    (55.4, 'Publicada: 442 skills', ORANGE), (60.6, 'Pilar 03 · Somos Exemplo', GOLD), (64.6, 'Arcos dourados para todos', GOLD),
    (69.2, 'Ranking de áreas', GOLD), (73.6, 'Fabio no pódio de DTS', GOLD), (78.0, 'DTS nº 1 · 87 publicações', GOLD),
    (84.0, 'Todos Sabem. Todos Usam. Somos Exemplo.', GOLD),
]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + 44 + pad) + pad
sh = Image.new('RGB', (W, H), (14, 12, 38)); dr = ImageDraw.Draw(sh)
n = len([f for f in os.listdir(fr) if f.startswith('f_')]); dur = n / 24
dr.text((pad, 26), f'FLOWS · O Fio Dourado — storyboard do curta 3D v8 ({int(dur) // 60}:{int(dur) % 60:02d})', fill=GOLD, font=F(32))
dr.text((pad, 72), '1920×1080 · 24 fps · Fabio no mundo FLOWS · Todos Sabem, Todos Usam, Somos Exemplo · compartilhar uma skill · ranking de áreas', fill=(196, 190, 222), font=F(20, 400))
for k, (t, name, col) in enumerate(beats):
    f = os.path.join(fr, f'f_{int(round(t * 24)):05d}.jpg')
    X = pad + (k % cols) * (w + pad); Y = 120 + (k // cols) * (h + 44 + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (X, Y))
    dr.rectangle([X, Y + h, X + w, Y + h + 4], fill=col)
    dr.text((X, Y + h + 12), f'{int(t) // 60}:{int(t) % 60:02d}', fill=col, font=F(22))
    dr.text((X + 70, Y + h + 12), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
