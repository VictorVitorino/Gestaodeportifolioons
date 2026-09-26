import sys, os
from PIL import Image, ImageDraw, ImageFont
fr, out = sys.argv[1], sys.argv[2]
F = lambda s, w=700: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if w >= 700 else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)
beats = [(1.9,'Abertura'),(4.4,'Logo FLOWS'),(7.6,'Início explode em 3D'),(9.6,'Olá, Victor'),(14.3,'Abra a Biblioteca'),(16.6,'Mergulho no card'),
         (20.2,'441 skills'),(24.5,'Biblioteca'),(28.3,'Passo 1 · Compartilhar Skill'),(30.5,'Modal Compartilhar Skill'),(36.8,'Passo 2 · Nome + [DTS]'),(40.3,'Passo 3 · Onde foi testada'),
         (46.2,'Passo 4 · Modelo testado'),(48.8,'Tempo manual (opcional)'),(52.0,'Passo 5 · Arquivos → ZIP'),(54.4,'SKILL.zip fechado'),(58.8,'Passo 6 · Próximo'),(60.2,'Card NOVA voando'),
         (62.2,'Publicada! 442 skills'),(66.4,'Compartilhe.'),(68.6,'Valide. Escale.')]
cols, w = 3, 620; h = int(w * 1080 / 1920); pad = 16; lab = 44
rows = (len(beats) + cols - 1) // cols
W = cols * w + (cols + 1) * pad; H = 120 + rows * (h + lab + pad) + pad
sh = Image.new('RGB', (W, H), (8, 12, 34)); d = ImageDraw.Draw(sh)
d.text((pad, 28), 'FLOWS · Como compartilhar uma Skill — storyboard do curta 3D (72 s)', fill=(240, 169, 59), font=F(34))
d.text((pad, 74), '1920×1080 · 24 fps · letterbox 2.39:1 · trilha original + SFX sincronizados', fill=(185, 191, 211), font=F(20, 400))
for k, (t, name) in enumerate(beats):
    n = int(round(t * 24)); f = os.path.join(fr, f'f_{n:05d}.jpg')
    x = pad + (k % cols) * (w + pad); y = 120 + (k // cols) * (h + lab + pad)
    if os.path.exists(f): sh.paste(Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS), (x, y))
    d.text((x, y + h + 8), f'{int(t)//60}:{int(t)%60:02d}', fill=(240, 169, 59), font=F(22))
    d.text((x + 70, y + h + 8), name, fill=(238, 240, 250), font=F(22, 400))
sh.save(out, quality=88)
print('ok', sh.size)
