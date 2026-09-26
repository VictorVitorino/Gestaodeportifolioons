# FLOWS · Como compartilhar uma Skill — curta 3D (motion graphics)

Curta animado de **72 s** que ensina, em 6 passos, o fluxo **Compartilhar Skill** do FLOWS.
Segue o roteiro e a linguagem visual dos vídeos de referência (palco circular azul com aro
dourado, céu crepuscular com bokeh, cards de vidro flutuando em 3D, HUD em letterbox 2.39:1)
e usa o avatar do Victor (turnaround de 8 vistas) como apresentador.

| Entrega | Arquivo |
|---|---|
| Filme final (1920×1080, 24 fps, H.264 + AAC 48 kHz) | `video/FLOWS_Compartilhar_Skill_3D.mp4` |
| Pôster (quadro-chave) | `video/poster.jpg` |
| Storyboard (21 quadros-chave com tempo) | `video/storyboard.jpg` |

## Roteiro

| Tempo | Cena | Legenda (HUD) |
|---|---|---|
| 0:00 | Abertura: estrela cadente, onda no palco, personagem materializa, logo FLOWS 3D | *Um curta FLOWS — Como compartilhar uma Skill* |
| 0:06 | Início: a tela Home "explode" em camadas 3D ao redor do Victor, que acena | Tudo começa no Início: skills, métodos e projetos em um só lugar. |
| 0:13 | Victor aponta, o cursor clica no card e a câmera mergulha nele | Abra a Biblioteca de Skills. |
| 0:18 | Vista aérea do anel de skills, contador 0 → 441, filtros e cabeçalho | Na Biblioteca, a comunidade já reúne 441 skills prontas para reuso. |
| 0:26 | **Passo 1** — pedestal com o botão; Victor pressiona; o modal se desdobra | Clique em Compartilhar Skill. |
| 0:31 | **Passo 2** — digitação do nome; destaque do prefixo `[DTS]` | Dê à skill um nome claro, com o prefixo da área. |
| 0:38 | **Passo 3** — "Flo" → sugestões salvas → *Flows / Claude* | Informe onde ela foi testada. |
| 0:43 | **Passo 4** — tambor 3D de modelos; *Claude Sonnet 5* (obrigatório) + tempo manual 120 (opcional) | Escolha o modelo testado. O campo é obrigatório. |
| 0:49 | **Passo 5** — arquivos voam para a caixa `SKILL.zip`, árvore com `SKILL.md` na raiz | Envie tudo em um único ZIP, com o SKILL.md na raiz. |
| 0:57 | **Passo 6** — Próximo; o modal vira o card *NOVA*, que pousa no anel (441 → 442); comemoração | Avance em Próximo e publique para o time. |
| 1:04 | Encerramento: grua aérea, logo e *Compartilhe. Valide. Escale.* | Sua skill agora faz parte da Biblioteca do FLOWS |

## Como foi feito (pipeline "After Effects em código")

```
turnaround 8 vistas ──► recorte IA (BiRefNet) ──► rig 2D (ombro/cotovelo/punho, pele LBS) ─┐
telas FLOWS (prints) ──► réplica HTML/CSS fiel ──► camadas 3D (CSS3D) ───────────────────────┼─► timeline determinística ─► Chromium headless ─► quadros JPEG ─┐
cenário ──────────────► three.js: céu, estrelas, bokeh, palco, aro, bloom ────────────────────┘                                                              ├─► ffmpeg ─► MP4
trilha ───────────────► síntese Python (música original Ré maior 100 BPM + 270 efeitos sincronizados) ───────────────────────────────────────────────────────┘
```

- **Personagem 2.5D** — cada vista do turnaround vira um sprite; a vista exibida é escolhida pelo
  ângulo entre o personagem e a câmera (como sprites de 8 direções). A vista frontal tem um rig
  de recorte com skinning (acenar, apontar, pressionar, apresentar, comemorar), renderizado em
  WebGL com rim light dourado.
- **UI fiel** — Início (sidebar, saudação, cards, ranking), Biblioteca (cabeçalho, filtros, cards de
  skill com os dados reais) e o modal *Compartilhar Skill* com estados (foco, digitação, sugestões,
  seleção, rádio, arquivo, stepper) — texto nítido em close-up.
- **Timeline** — `src/timeline.js`: cada valor é função pura do tempo `t`, então qualquer quadro pode
  ser renderizado isoladamente (render paralelo e re-render de trechos).

## Reproduzir / editar

```bash
npm install                                   # three + playwright-core; CHROME_PATH=<Chromium/Chrome> se não estiver no Claude Code
python3 -m pip install numpy scipy            # trilha
python3 audio/soundtrack.py audio/soundtrack.wav
node render.mjs preview 12,33.5,53 out/preview        # quadros avulsos (PNG)
node render.mjs frames 24 0 3 out/frames & node render.mjs frames 24 1 3 out/frames & node render.mjs frames 24 2 3 out/frames
ffmpeg -framerate 24 -i out/frames/f_%05d.jpg -i audio/soundtrack.wav \
       -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 19 \
       -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart \
       -c:a aac -b:a 192k -ar 48000 -shortest video/FLOWS_Compartilhar_Skill_3D.mp4
```

- Legendas e tempos: array `SUBS` em `src/timeline.js`.
- Textos da UI: `src/ui.js` (dados dos cards em `SKILLS`).
- Gestos do personagem: `WAVE`, `POINT_L`, `REACH_R`, `PRESENT_R`, `CHEER` em `src/timeline.js`.
- `tools/` guarda o pipeline do personagem (segmentação, preparação e rig).
- A composição é `film.htm` (extensão `.htm` de propósito, para o Vite do app principal não varrer esta página).

Fontes: Inter, Fraunces e JetBrains Mono (SIL Open Font License).
