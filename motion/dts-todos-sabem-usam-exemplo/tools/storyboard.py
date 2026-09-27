"""Storyboard sheet from rendered frames: python3 tools/storyboard.py out/frames video/storyboard.jpg"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
F = lambda s, w=700: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if w >= 700 else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BLUE, ORANGE, GOLD, AMB = (61, 139, 255), (255, 138, 31), (242, 181, 68), (0, 133, 202)
# (tempo global, cena, cor do ato)
beats = [(2.1, 'Vinheta A&M: o skyline sobe', AMB), (4.6, 'Alvarez & Marsal apresenta', AMB), (9.8, 'Emblema DTS 3D', None),
         (14.0, 'Como a DTS compartilha conhecimento', None), (16.1, 'Íris azul · Todos Sabem', BLUE), (20.2, 'Início do FLOWS', BLUE),
         (25.3, '441 skills na Biblioteca', BLUE), (28.0, 'Skills prontas para reuso', BLUE), (30.1, 'Íris laranja · Todos Usam', ORANGE),
         (34.1, 'Passo 1 · Compartilhar Skill', ORANGE), (39.6, 'Passo 2 · nome + prefixo [DTS]', ORANGE), (46.0, 'Passo 3 · Flows / Claude', ORANGE),
         (51.2, 'Passo 4 · tambor de modelos', ORANGE), (57.6, 'Passo 5 · arquivos → ZIP', ORANGE), (62.6, 'Passo 6 · Próximo', ORANGE),
         (65.3, 'Voo da skill (motion blur)', ORANGE), (67.0, 'Publicada: 442 skills', ORANGE), (68.1, 'Íris dourada · Somos Exemplo', GOLD),
         (72.6, 'Referência para todo o time', GOLD), (76.8, 'Ranking de áreas: pódio', GOLD), (79.3, 'DTS nº 1 · 1.557 pontos', GOLD),
         (81.0, '87 publicações · 142 adoções', GOLD), (83.5, 'O emblema retorna', GOLD), (86.0, 'Todos Sabem. Todos Usam. Somos Exemplo.', GOLD)]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16; lab = 44
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + lab + pad) + pad
sh = Image.new('RGB', (W, H), (14, 12, 38)); d = ImageDraw.Draw(sh)
d.text((pad, 26), 'DTS · Todos Sabem, Todos Usam, Somos Exemplo — storyboard do curta 3D (88 s)', fill=GOLD, font=F(32))
d.text((pad, 72), '1920×1080 · 24 fps · vinheta Alvarez & Marsal · PBR, DOF, motion blur e bloom · motion graphics · trilha original', fill=(196, 190, 222), font=F(20, 400))
for k, (t, name, col) in enumerate(beats):
    n = int(round(t * 24)); f = os.path.join(fr, f'f_{n:05d}.jpg')
    x = pad + (k % cols) * (w + pad); y = 120 + (k // cols) * (h + lab + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    if col: d.rectangle([x, y + h, x + w, y + h + 4], fill=col)
    d.text((x, y + h + 12), f'{int(t)//60}:{int(t)%60:02d}', fill=col or (238, 232, 250), font=F(22))
    d.text((x + 70, y + h + 12), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
