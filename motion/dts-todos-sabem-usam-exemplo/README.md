# DTS · Todos Sabem, Todos Usam, Somos Exemplo — curta 3D cinematográfico (v3)

Curta de **88 s** (1920×1080, 24 fps) que conta o fluxo **Compartilhar Skill** do FLOWS pela lente
dos três pilares da **DTS — Digital & Technology Services**, da **Alvarez & Marsal**. Abre com uma
vinheta de estúdio A&M (como nos longas de animação), segue o roteiro em 3 atos e fecha com o
**Ranking de Áreas do FLOWS**, em que a DTS é a nº 1. Não há personagem: o protagonismo é da própria
skill, um objeto 3D que nasce do modal, voa e pousa na Biblioteca.

| Entrega | Arquivo |
|---|---|
| Filme final (1920×1080, 24 fps, H.264 + AAC 48 kHz) | `video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4` |
| Pôster (cartela final) | `video/poster.jpg` |
| Storyboard (24 quadros-chave com tempo e ato) | `video/storyboard.jpg` |

## Roteiro

| Tempo | Ato | Cena | Motion graphics |
|---|---|---|---|
| 0:00 | **Vinheta A&M** | Palco azul-noite; uma centelha no azul A&M guia a montagem do monograma em 3D: as três colunas sobem do chão como um skyline, as letras A&M surgem e um brilho em estrela acende o topo | letterbox 2.39:1, varredura de luz, *Alvarez & Marsal · Digital & Technology Services apresenta* |
| 0:06 | Abertura | Céu dourado, praça circular, o emblema **DTS** cai com elasticidade; as barras do letterbox recolhem | *Como a DTS compartilha conhecimento* |
| 0:16 | **Todos Sabem** (azul) | Tela Início do FLOWS em moldura 3D; anel de **441** skills; três skills em destaque | medalhão com ícone de lâmpada + transição em íris azul, contador com ícone, marca-texto nas legendas |
| 0:30 | **Todos Usam** (laranja) | Os 6 passos viram objetos: botão-cápsula, teclas `[DTS]`, sugestão *Flows / Claude*, tambor de modelos (*Claude Sonnet 5*), caixa `SKILL.zip`, *Próximo* → o modal vira o card *NOVA*, que voa (com motion blur) e pousa no anel: **442** | íris laranja, rastreador de passos com ícones e checks animados, moldura de foco que acompanha cada campo, notas presas ao 3D |
| 1:08 | **Somos Exemplo** (dourado) | Fios de luz ligam a skill ao anel; chicote de câmera até o **pódio do Ranking de Áreas**: Operations 951 (3º), M&A Services 1.054 (2º) e **DTS 1.557 (1º)**, com troféu, medalha, confete e holofotes | íris dourada, cards do FLOWS nos blocos com pontos contando ao vivo, carimbo **Nº 1 entre 12 áreas** com linha de conexão, *87 publicações · 142 adoções* |
| 1:23 | Encerramento | O emblema DTS volta ao centro; letterbox | **Todos Sabem. Todos Usam. Somos Exemplo.** · *Compartilhe sua skill no FLOWS* · assinatura Alvarez & Marsal |

Dados do ranking: tela *Ranking → Áreas → Todos os tempos* do FLOWS (recalculado em 9 set 2026,
12 áreas no placar). Os textos de apoio dos pilares, as notas e as legendas foram escritos para o vídeo.

## Linguagem visual ("longa de animação" traduzido em técnica)

| Intenção | Como foi feito |
|---|---|
| Luz de hora dourada | céu procedural, luz-chave quente, contraluz laranja, hemisférica fria, reflexos de um mapa de ambiente do próprio céu |
| Materiais táteis | `MeshPhysicalMaterial` com clearcoat, dourado metálico, bordas arredondadas, letras extrudadas (Nunito 900) |
| Lente de cinema | profundidade de campo animada, **motion blur de câmera** (obturador de 180°, com máscara para o que a câmera acompanha), bloom com limiar alto, ACES, grade com split-tone e vinheta, letterbox 2.39:1 nos momentos de "cinema" |
| Chão de verdade | sombras suaves (PCF) e sombras de contato sob cada objeto |
| Atuação dos objetos | squash & stretch, antecipação e overshoot, quedas com quique (troféus), arcos em Bézier, câmera em spline |
| Camada After Effects | ícones com traço animado (trim paths), estouros e ondas (shape layers), íris nas cores dos pilares, medalhões que voam até o HUD, rastreador de passos, moldura de foco rastreada no 3D, marca-texto, carimbo, linha de conexão, contadores |
| Som | trilha original (Ré maior, 96 BPM) com assinatura da vinheta, rufar e fanfarra na revelação da DTS e cliques/pops sincronizados a cada evento visual |

## Marca Alvarez & Marsal

- O monograma (`tex/am_mark.svg`) é o arquivo oficial do site alvarezandmarsal.com, na versão
  vazada (branca sobre azul). No 3D ele só é extrudado e iluminado: as peças sobem e aparecem, mas a
  forma final mantém as proporções originais.
- Paleta usada na vinheta: azul A&M `#0085CA` e azul-marinho `#00244A`.
- A tipografia da marca é a Helvetica Neue LT Std (licenciada); nos textos da vinheta e da
  assinatura foi usada a Liberation Sans (OFL), de desenho equivalente.
- Para uso externo, valide com a equipe de marca da A&M.

## Pipeline ("After Effects em código")

```
monograma A&M (SVG) ─► extrusão 3D + montagem (src/ident.js) ──────────────┐
prints do FLOWS ─► telas .webp ─┐                                          │
réplica HTML/CSS da UI ─► bake.mjs ─► texturas PNG (modal, cards, ranking) ┼─► timeline pura t→cena ─► Chromium headless ─► JPEG ─┐
three.js: céu, praça, anel de 441 skills, pódio, props (src/*.js) ─────────┤   (src/timeline.js)                                    ├─► ffmpeg ─► MP4
motion graphics DOM/SVG (src/mg.js, hud.css) ──────────────────────────────┘                                                        │
trilha (audio/soundtrack.py): música original + efeitos no mesmo relógio ───────────────────────────────────────────────────────────┘
```

Cada valor da cena é função pura do tempo `t`, então qualquer quadro pode ser renderizado isoladamente
(render paralelo e re-render de trechos).

## Reproduzir / editar

```bash
npm install                        # three + playwright-core; CHROME_PATH=<Chromium/Chrome> fora do Claude Code
npm run bake                       # gera tex/*.png e tex/manifest.json (estados do modal, cards, ranking, logo)
python3 -m pip install numpy scipy
npm run audio                      # audio/soundtrack.wav (88,2 s)
npm run preview                    # quadros avulsos em out/preview (PNG)
Q=0.5 node render.mjs frames 4 0 1 out/lr          # prévia rápida: 3D em meia resolução, 4 fps
node render.mjs frames 24 0 3 out/frames & node render.mjs frames 24 1 3 out/frames & node render.mjs frames 24 2 3 out/frames
ffmpeg -framerate 24 -i out/frames/f_%05d.jpg -i audio/soundtrack.wav \
       -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 20 \
       -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart \
       -c:a aac -b:a 192k -ar 48000 -shortest video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4
npm run storyboard
```

O render usa WebGL por software (SwiftShader): ~12 s por quadro por processo em 1080p (3 processos ≈ 2 h).
Para refazer um trecho, apague os quadros e rode `node render.mjs frames 24 0 1 out/frames <t0> <t1>`
(tempos globais: a vinheta ocupa 0–6 s e o filme começa em 6 s).

## Onde mexer

- Legendas (com `*termos*` em marca-texto) e títulos dos pilares: `SUBS` e `PILLAR_BEATS` em `src/timeline.js` (tempo do filme = tempo global − 6 s).
- Ranking: `AREAS` em `src/podium.js` (pontos, posições, cores); publicações/adoções e textos no HUD em `src/timeline.js`.
- Vinheta A&M: `src/ident.js` (tempos de subida das colunas, caminho da centelha, câmera).
- Motion graphics: componentes em `src/mg.js`, estilos em `hud.css`.
- Motion blur: `SHUTTER` em `src/timeline.js` e `src/mblur.js`.
- Nome da skill e estados do modal: `bake.mjs`; cards e ranking: `src/ui.js` (rode `npm run bake` depois).
- Luz, céu, DOF e grade de cor: `src/world.js`. Objetos e materiais: `src/objects.js`.
- Trilha e efeitos: `audio/soundtrack.py` (cues no mesmo relógio; `OFF` separa vinheta e filme).
- A composição é `film.htm` (extensão `.htm` de propósito, para o Vite do app principal não varrer esta página).

Fontes: Inter, Fraunces, JetBrains Mono, Nunito e Liberation Sans (SIL Open Font License). Ícones no estilo Lucide (ISC).
A versão com o avatar como apresentador continua em `../flows-compartilhar-skill/`.
