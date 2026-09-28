"""v9 storyboard sheet (O Fio Dourado · a jornada do Fabio) from rendered frames:
python3 tools/storyboard9.py out/frames9 video/storyboard9.jpg"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
F = lambda s, w=700: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if w >= 700 else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BLUE, ORANGE, GOLD, FAB = (61, 139, 255), (255, 138, 31), (242, 181, 68), (238, 232, 250)
# (film seconds, scene, act colour) — the film clock is the v9 clock (src/cut9.js)
beats = [
    (1.0, 'Fabio no mundo FLOWS', FAB), (2.95, 'O tema escrito em luz', FAB), (6.6, 'Todos Sabem · Todos Usam · Somos Exemplo', FAB),
    (10.2, 'Pilar 01 · Todos Sabem', BLUE), (13.9, 'O toque na Biblioteca de Skills', BLUE), (16.3, 'O portal para o universo FLOWS', BLUE),
    (17.8, 'O universo FLOWS', BLUE), (21.3, 'As skills orbitam o Fabio · 441', BLUE), (25.8, 'Publicar skill · Pilar 02', ORANGE),
    (28.05, 'A íris dourada abre o FLOWS 3D', ORANGE), (36.8, 'Passo 2 · o nome padrão', ORANGE), (44.6, 'Passo 3 · onde foi testada', ORANGE),
    (50.6, 'Passo 4 · o modelo testado', ORANGE), (57.8, 'Passo 5 · um único ZIP', ORANGE), (66.8, 'Passo 6 · Detalhes', ORANGE),
    (90.2, 'O voo do card', ORANGE), (96.3, 'Fabio apresenta: 442 skills', GOLD), (102.6, 'Pilar 03 · Somos Exemplo', GOLD),
    (108.4, 'Arcos dourados · Fabio de braços abertos', GOLD), (119.6, 'Fabio aponta o Nº 1 · DTS', GOLD), (132.0, 'Encerramento · Fabio se despede', GOLD),
]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + 44 + pad) + pad
sh = Image.new('RGB', (W, H), (14, 12, 38)); dr = ImageDraw.Draw(sh)
n = len([f for f in os.listdir(fr) if f.startswith('f_')]); dur = n / 24
dr.text((pad, 26), f'FLOWS · O Fio Dourado · a jornada do Fabio — storyboard da v9 ({int(dur) // 60}:{int(dur) % 60:02d})', fill=GOLD, font=F(32))
dr.text((pad, 72), '1920×1080 · 24 fps · o toque na Biblioteca · o portal · Publicar skill · a íris dourada · o formulário em plano-sequência · Fabio de corpo inteiro no mundo', fill=(196, 190, 222), font=F(20, 400))
for k, (t, name, col) in enumerate(beats):
    f = os.path.join(fr, f'f_{int(round(t * 24)):05d}.jpg')
    X = pad + (k % cols) * (w + pad); Y = 120 + (k // cols) * (h + 44 + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (X, Y))
    dr.rectangle([X, Y + h, X + w, Y + h + 4], fill=col)
    dr.text((X, Y + h + 12), f'{int(t) // 60}:{int(t) % 60:02d}', fill=col, font=F(22))
    dr.text((X + 70, Y + h + 12), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
