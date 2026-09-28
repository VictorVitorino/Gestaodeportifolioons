"""v10 storyboard sheet (A Travessia) from rendered frames:
python3 tools/storyboard10.py out/frames10 video/storyboard10.jpg"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
F = lambda s, w=700: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if w >= 700 else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BLUE, ORANGE, GOLD, FAB = (61, 139, 255), (255, 138, 31), (242, 181, 68), (238, 232, 250)
# (film seconds, scene, act colour) — the film clock is the v10 clock (src/cut10.js, 30 fps)
beats = [
    (1.6, 'Fabio no espaço de luz', FAB), (3.2, 'As espirais o transportam', FAB), (3.75, 'A fita dourada vira o logo FLOWS', FAB),
    (6.2, 'A porta de luz do FLOWS', FAB), (9.0, 'O fio do O escreve DTS', FAB), (12.6, 'Nivelamento: as três colunas', FAB),
    (14.4, 'Todos Sabem · Todos Usam · Somos Exemplo', FAB), (20.5, '01 · Todos Sabem: a caminhada', BLUE), (24.3, 'O toque na Biblioteca de Skills', BLUE),
    (28.6, 'O portal: o universo FLOWS', BLUE), (33.0, '441 skills orbitam o Fabio', BLUE), (37.0, '02 · Todos Usam: Publicar Skill', ORANGE),
    (38.9, 'O Fabio aperta o botão', ORANGE), (39.8, 'A íris dourada abre o salão 3D', ORANGE), (48.5, 'Página 1 · o nome [DTS]', ORANGE),
    (75.0, 'Página 2 · Detalhes', ORANGE), (85.5, 'A skill publicada voa à Biblioteca', ORANGE), (89.5, '442 · o Fabio apresenta', ORANGE),
    (93.4, '03 · Somos Exemplo: a gota de luz', GOLD), (97.6, 'O chafariz alcança todas as skills', GOLD), (107.4, 'DTS em 1º · o Fabio levanta o nº 1', GOLD),
    (116.6, 'Encerramento · o Fabio se despede', GOLD),
]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + 44 + pad) + pad
sh = Image.new('RGB', (W, H), (14, 12, 38)); dr = ImageDraw.Draw(sh)
n = len([f for f in os.listdir(fr) if f.startswith('f_')]); dur = n / 30
dr.text((pad, 26), f'FLOWS · A Travessia — storyboard da v10 ({int(dur) // 60}:{int(dur) % 60:02d}, sem falas)', fill=GOLD, font=F(32))
dr.text((pad, 72), '1920×1080 · 30 fps · transporte · porta FLOWS · DTS · nivelamento · Biblioteca · Publicar Skill · formulário · 442 · chafariz · ranking', fill=(196, 190, 222), font=F(20, 400))
for k, (t, name, col) in enumerate(beats):
    f = os.path.join(fr, f'f_{int(round(t * 30)):05d}.jpg')
    X = pad + (k % cols) * (w + pad); Y = 120 + (k // cols) * (h + 44 + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (X, Y))
    dr.rectangle([X, Y + h, X + w, Y + h + 4], fill=col)
    dr.text((X, Y + h + 12), f'{int(t) // 60}:{int(t) % 60:02d}', fill=col, font=F(22))
    dr.text((X + 70, Y + h + 12), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
