# DTS · Todos Sabem, Todos Usam, Somos Exemplo — curta 3D cinematográfico

Curta de **78 s** (1920×1080, 24 fps) que conta o fluxo **Compartilhar Skill** do FLOWS pela lente
dos três pilares da **DTS — Digital & Technology Services**. Não há personagem: o protagonismo é da
própria skill (um objeto 3D que nasce do modal e pousa na Biblioteca). A linguagem visual segue a
cinematografia de animação 3D de estúdio: luz dourada de fim de tarde, materiais "de brinquedo" com
verniz (clearcoat), squash & stretch, antecipação e overshoot, profundidade de campo e bloom.

| Entrega | Arquivo |
|---|---|
| Filme final (1920×1080, 24 fps, H.264 + AAC 48 kHz) | `video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4` |
| Pôster (quadro-chave) | `video/poster.jpg` |
| Storyboard (24 quadros-chave com tempo e pilar) | `video/storyboard.jpg` |

## Roteiro em 3 atos

| Tempo | Ato | Cena | Legenda / motion graphics |
|---|---|---|---|
| 0:00 | Abertura | Céu crepuscular, praça circular iluminada, o anel da Biblioteca ao fundo; o emblema **DTS** 3D (azul-marinho com laterais douradas) salta com squash & stretch | *Digital & Technology Services* · *Como a DTS compartilha conhecimento* |
| 0:10 | **Pilar 1 · Todos Sabem** (azul) | Pódio azul; a tela Início do FLOWS em moldura 3D com destaque no card da Biblioteca; voo pelo anel de **441** skills; três skills em destaque | *Todos sabem onde encontrar…* · contador 0 → 441 · *…como contribuir: 6 passos* |
| 0:24 | **Pilar 2 · Todos Usam** (laranja) | Passo 1: botão-cápsula 3D pressionado e o modal se desdobra · Passo 2: teclas 3D `[DTS]` + digitação do nome · Passo 3: "Flo" → sugestão *Flows / Claude* · Passo 4: tambor 3D de modelos para em *Claude Sonnet 5* + tempo manual 120 · Passo 5: arquivos voam para a caixa `SKILL.zip` · Passo 6: *Próximo*; o modal se dobra na skill, que voa e pousa no anel (441 → **442**) | tracker *PASSO n/6*, callouts ancorados no 3D (prefixo da área, contexto da validação, obrigatório, opcional, SKILL.md na raiz) |
| 1:02 | **Pilar 3 · Somos Exemplo** (dourado) | Fios de luz ligam a nova skill a dezenas de skills do anel; ranking do Início sobe; o emblema DTS volta ao centro | *Uma skill compartilhada vira referência para todo o time.* · *Cada contribuição conta…* |
| 1:14 | Encerramento | Cartela final sobre o emblema | **Todos Sabem. Todos Usam. Somos Exemplo.** · DTS · *Compartilhe sua skill no FLOWS* |

## Linguagem visual ("Pixar look" traduzido em técnica)

| Intenção | Como foi feito |
|---|---|
| Luz de hora dourada | céu procedural (gradiente + nuvens fbm + halo do sol), luz-chave quente, contraluz laranja, hemisférica fria; mapa de ambiente PMREM do próprio céu para reflexos coerentes |
| Materiais táteis | `MeshPhysicalMaterial` com clearcoat, metal dourado nas laterais das letras, bordas arredondadas (RoundedBox) e letras extrudadas em Nunito 900 |
| Lente de cinema | profundidade de campo com foco animado por plano, bloom com limiar alto (só luzes brilham), tone mapping ACES, vinheta, split-tone e curva em S no grade |
| Atuação dos objetos | squash & stretch por letra, antecipação e overshoot (`outBack`), arcos de voo em Bézier, câmera em spline com ease |
| Motion graphics (After Effects) | HUD em DOM sobre o 3D: bug DTS, pílulas dos pilares com progresso, tracker de passos, legendas palavra a palavra, contadores, callouts presos a pontos 3D e cartela final |

## Pipeline ("After Effects em código")

```
prints do FLOWS ─► telas .webp (tex/) ─────────────────────────────┐
réplica HTML/CSS da UI (src/ui.js) ─► bake.mjs ─► texturas PNG ───┤
three.js: céu, praça, anel de 441 skills, emblema, pódios, props ──┼─► timeline pura t→cena (src/timeline.js) ─► Chromium headless ─► JPEG ─┐
HUD/motion graphics (hud.css) ─────────────────────────────────────┘                                                                      ├─► ffmpeg ─► MP4
trilha (audio/soundtrack.py): música original Ré maior 96 BPM + efeitos sincronizados ─────────────────────────────────────────────────────┘
```

Cada valor da cena é função pura do tempo `t`, então qualquer quadro pode ser renderizado isoladamente
(render paralelo e re-render de trechos).

## Reproduzir / editar

```bash
npm install                        # three + playwright-core; CHROME_PATH=<Chromium/Chrome> fora do Claude Code
npm run bake                       # gera tex/*.png e tex/manifest.json (estados do modal, cards, ranking, logo)
python3 -m pip install numpy scipy
npm run audio                      # audio/soundtrack.wav
npm run preview                    # quadros avulsos em out/preview (PNG)
Q=0.5 node render.mjs frames 4 0 1 out/lr          # prévia rápida: 3D em meia resolução, 4 fps
node render.mjs frames 24 0 3 out/frames & node render.mjs frames 24 1 3 out/frames & node render.mjs frames 24 2 3 out/frames
ffmpeg -framerate 24 -i out/frames/f_%05d.jpg -i audio/soundtrack.wav \
       -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 19 \
       -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart \
       -c:a aac -b:a 192k -ar 48000 -shortest video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4
npm run storyboard
```

O render usa WebGL por software (SwiftShader): ~9 s por quadro por processo em 1080p.
Para refazer um trecho, apague os quadros e rode `node render.mjs frames 24 0 1 out/frames <t0> <t1>`.

## Onde mexer

- Legendas e tempos: `SUBS` e `PILLAR_BEATS` em `src/timeline.js`; textos fixos do HUD no mesmo arquivo.
- Cores dos pilares: `BLUE`, `ORANGE`, `GOLD` em `src/timeline.js` (e `--c` das pílulas).
- Nome da skill e estados do modal: `bake.mjs`; dados dos cards: `src/ui.js` (rode `npm run bake` depois).
- Modelos do tambor 3D: array `models` em `src/timeline.js`.
- Luz, céu, neblina, DOF e grade de cor: `src/world.js`. Objetos e materiais: `src/objects.js`.
- Trilha e efeitos: listas de notas e `cue`s em `audio/soundtrack.py` (mesmos tempos da timeline).
- A composição é `film.htm` (extensão `.htm` de propósito, para o Vite do app principal não varrer esta página).

Fontes: Inter, Fraunces, JetBrains Mono e Nunito (SIL Open Font License).
A versão anterior (com o avatar como apresentador) continua em `../flows-compartilhar-skill/`.
