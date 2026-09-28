# DTS · Todos Sabem, Todos Usam, Somos Exemplo — v8 (2:00, visual Alvarez & Marsal)

Curta de **2 min 00 s** (1920×1080, 24 fps, H.264 + AAC 48 kHz). Mesmo roteiro, mesma ordem e mesmo conteúdo da
v7, que abre com a **entrada do Fabio**. Tudo foi **renderizado de novo, quadro a quadro**, com a direção de fotografia
alinhada à marca Alvarez & Marsal e às referências do time (Mundo Flows: piso azul profundo com anéis dourados finos,
céu azul estrelado, cards brancos).

> **Status:** fonte e direção de arte da v8 prontas; o render completo em 1080p está em andamento e o filme será
> adicionado em `video/` assim que terminar.

| Entrega | Arquivo |
|---|---|
| Filme 2:00 · 1080p (≈5,8 Mb/s, < 100 MB) | `video/DTS_AM_2min_1080p.mp4` |
| Antes (v7) × depois (v8) | `video/antes_depois.png` |
| Folha de contato | `video/storyboard.png` |

## Paleta (site oficial alvarezandmarsal.com)

| Papel | Cor | Onde aparece no filme |
|---|---|---|
| Azul A&M (primária) | `#0085CA` | letras *Todos Sabem*, chips e acentos da HUD, pódio nº 2 |
| Navy A&M (secundária) | `#00244A` | placas de legenda, textos e HUD (antes eram navy arroxeados) |
| Navy médio | `#0E4067` | piso da praça e profundidade do cenário |
| Cinza-claro / branco | `#EEEEEE` / `#FFFFFF` | cards da Biblioteca e telas do FLOWS |
| Champanhe (acento) | `#ECD29E` | anéis finos do piso, borda da praça, fios de reuso |
| Laranja e dourado dos pilares | `#FF8A1F` / `#F2B544` | preservados: são a identidade de *Todos Usam* e *Somos Exemplo* |

## O que mudou da v7 para a v8

| Tema | v7 | v8 |
|---|---|---|
| Céu | pôr do sol: rosa, pêssego e violeta | azul profundo com estrelas discretas e horizonte lavanda-creme suave |
| Piso | índigo com raios e marcas douradas | navy/azul royal A&M com anéis champanhe finos (sem raios e marcas) |
| Luz | chave quente, contraluz laranja, névoa violeta | chave branca neutra, contraluz fria, névoa azul profunda |
| **Passagens de etapa** | o ambiente inteiro se tingia da cor de cada pilar, com mais bloom e raios de sol no pilar 3 (o "brilho estranho") | **removido**: o cenário fica estável e só os pilares carregam a cor da etapa |
| Brilhos | bloom 0,38 → 0,48, barras e anéis com emissão 2,0–2,2 | bloom 0,2 constante, emissão 1,1–1,25, fios de reuso finos |
| Grade | split-tone laranja/azul, saturação +6 %, aberração cromática | neutra, sem aberração, vinheta leve |
| HUD e legendas | azul `#3d8bff`, placas navy arroxeadas | azul A&M `#0085CA`, placas navy A&M `#00244A` |
| Ritmo | 2:54 | 2:00, renderizado direto no novo relógio (movimento nativo, sem quadros pulados) |
| Contador da Biblioteca | "+1 skill de DTS na Biblioteca" | **"442 · skills na Biblioteca da Alvarez · +1 de DTS"** |

## Entrada do Fabio → 3D (costura)

O clipe do Fabio foi gerado sobre a praça antiga (violeta). Para a costura continuar invisível:

1. **Transferência de cor por correspondência.** Quadros da v8 e da v7 no mesmo instante da história (mesma câmera,
   mesma cena) formam pares de pixels. Deles sai um LUT polinomial que leva a paleta antiga para a nova
   (`tools/fit2.py`). Esse LUT entra no clipe em rampa, de 4,2 s a 5,2 s, quando o estúdio vira a praça
   (`tools/applyclip.py`). O estúdio azul do início fica intacto.
2. **Mesma velocidade no corte.** A curva de ritmo de 2:00 começa na velocidade de giro da v7, que é a do clipe,
   e só depois acelera até o novo ritmo (`retime/plan.py`).
3. **Fusão de 0,45 s.** O clipe continua o próprio giro e dissolve sobre o 3D em movimento (`src/timeline.js`, `XF`).

## Reproduzir

Fonte da v7 (commit `49161cd`, branch `claude/magical-wright-ncwadb`) com os arquivos de `src/`, `hud.css` e `ui.css`
desta pasta por cima, depois:

```bash
npm install && npm run bake && bash tools/intro.sh
python3 tools/applyclip.py                     # colore a praça do clipe do Fabio (usa tools/M2.npy)
node render.mjs frames 24 <w> <n> out/frames   # n processos em paralelo
python3 audio/soundtrack.py soundtrack.wav     # trilha a partir da mesma curva (src/pace.js)
ffmpeg -framerate 24 -i out/frames/f_%05d.jpg -i soundtrack.wav ... video.mp4
```
