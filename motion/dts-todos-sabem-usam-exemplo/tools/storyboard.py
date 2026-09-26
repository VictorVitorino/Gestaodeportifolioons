"""Storyboard sheet from rendered frames: python3 tools/storyboard.py out/frames video/storyboard.jpg"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
F = lambda s, w=700: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if w >= 700 else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
BLUE, ORANGE, GOLD = (61, 139, 255), (255, 138, 31), (242, 181, 68)
# (tempo, cena, pilar)
beats = [(1.6, 'Abertura: céu dourado e praça', None), (3.75, 'Emblema DTS 3D', None), (8.0, 'Como a DTS compartilha conhecimento', None),
         (11.0, 'Pilar 1 · Todos Sabem', BLUE), (14.2, 'Início do FLOWS', BLUE), (19.3, '441 skills na Biblioteca', BLUE),
         (22.0, 'Skills prontas para reuso', BLUE), (25.0, 'Pilar 2 · Todos Usam', ORANGE), (28.1, 'Passo 1 · Compartilhar Skill', ORANGE),
         (33.6, 'Passo 2 · nome digitado', ORANGE), (36.6, 'Prefixo da área [DTS]', ORANGE), (40.0, 'Passo 3 · Flows / Claude', ORANGE),
         (45.2, 'Passo 4 · tambor de modelos', ORANGE), (47.9, 'Tempo manual (opcional)', ORANGE), (51.6, 'Passo 5 · arquivos → ZIP', ORANGE),
         (54.3, 'SKILL.zip no modal', ORANGE), (56.6, 'Passo 6 · Próximo', ORANGE), (59.3, 'O card NOVA voa para o anel', ORANGE),
         (61.0, 'Publicada: 442 skills', ORANGE), (63.0, 'Pilar 3 · Somos Exemplo', GOLD), (66.6, 'Referência para todo o time', GOLD),
         (70.6, 'Cada contribuição conta', GOLD), (72.9, 'O emblema retorna', GOLD), (75.8, 'Todos Sabem. Todos Usam. Somos Exemplo.', GOLD)]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16; lab = 44
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + lab + pad) + pad
sh = Image.new('RGB', (W, H), (14, 12, 38)); d = ImageDraw.Draw(sh)
d.text((pad, 26), 'DTS · Todos Sabem, Todos Usam, Somos Exemplo — storyboard do curta 3D (78 s)', fill=GOLD, font=F(32))
d.text((pad, 72), '1920×1080 · 24 fps · PBR + profundidade de campo + bloom · fluxo Compartilhar Skill do FLOWS · trilha original', fill=(196, 190, 222), font=F(20, 400))
for k, (t, name, col) in enumerate(beats):
    n = int(round(t * 24)); f = os.path.join(fr, f'f_{n:05d}.jpg')
    x = pad + (k % cols) * (w + pad); y = 120 + (k // cols) * (h + lab + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    if col: d.rectangle([x, y + h, x + w, y + h + 4], fill=col)
    d.text((x, y + h + 12), f'{int(t)//60}:{int(t)%60:02d}', fill=col or (238, 232, 250), font=F(22))
    d.text((x + 70, y + h + 12), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
