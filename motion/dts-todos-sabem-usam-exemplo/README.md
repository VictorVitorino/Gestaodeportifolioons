# DTS · Todos Sabem, Todos Usam, Somos Exemplo — curta 3D cinematográfico (v4)

Curta de **2 min 35 s** (1920×1080, 24 fps) que conta o fluxo **Compartilhar Skill** do FLOWS pela lente
dos três pilares da **DTS — Digital & Technology Services**, da **Alvarez & Marsal**. Abre com uma
vinheta A&M, segue o roteiro em 3 atos e fecha com o **Ranking de Áreas do FLOWS**, em que a DTS é a nº 1.
Não há personagem: o protagonismo é da própria skill, um objeto 3D que nasce do modal, voa e pousa na Biblioteca.

A v4 é **o mesmo filme da v3** (mesma história, cenas, ordem, objetos, mensagens e identidade visual),
refinado em ritmo, câmera, motion design, abertura A&M e nitidez.

| Entrega | Arquivo |
|---|---|
| Filme final (1920×1080, 24 fps, H.264 + AAC 48 kHz) | `video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4` |
| Pôster (cartela final) | `video/poster.jpg` |
| Storyboard (24 quadros-chave com tempo e ato) | `video/storyboard.jpg` |

## Roteiro

| Tempo | Ato | Cena | Motion graphics |
|---|---|---|---|
| 0:00 | **Vinheta A&M** | Palco azul-marinho profundo: constelação de dados ao fundo, partículas suaves, trilhas de luz (azuis e uma laranja) deslizam pelo piso e formam um anel; a grade digital se espalha e o monograma **nasce da luz** (faixa de varredura no chão), as letras A&M surgem por dissolução e uma única varredura de luz cruza a marca | letterbox 2.39:1, *Alvarez & Marsal · Digital & Technology Services apresenta* com revelação por máscara e fio azul/laranja; a composição completa **repousa ~2 s** antes do fade |
| 0:10 | Abertura | Céu dourado, praça circular, o emblema **DTS** pousa; as barras do letterbox recolhem | *Como a DTS compartilha conhecimento* (palavras sobem de máscaras) |
| 0:22 | **Todos Sabem** (azul) | Câmera viaja até o pilar, assenta e **segura 4 s**: um brilho percorre as letras e a luz do ambiente se tinge de azul | *Pilar 01 · Onde está o conhecimento*, parado durante a leitura |
| 0:29 | | Tela Início do FLOWS em moldura 3D; anel de **441** skills; três skills em destaque | legendas em placa translúcida com sublinhado desenhado, contador com fio dourado |
| 0:48 | **Todos Usam** (laranja) | Viagem lenta até o pilar; a luz esquenta para laranja; **segura 4 s** | *Pilar 02 · O passo a passo no dia a dia* |
| 0:55 | | Os 6 passos viram objetos: botão-cápsula, teclas `[DTS]`, sugestão *Flows / Claude*, tambor de modelos (*Claude Sonnet 5*), caixa `SKILL.zip`, *Próximo* → o modal vira o card *NOVA*, que **plana ~6 s** até o anel: **442** | rastreador de passos, moldura de foco que desliza entre os campos, notas presas ao 3D |
| 1:55 | **Somos Exemplo** (dourado) | Recuo longo e contínuo do anel até o pilar (sem corte); luz dourada, raios e partículas subindo; **segura ~5 s** — o momento mais forte | *Pilar 03 · Quem compartilha, lidera pelo exemplo* |
| 2:05 | | Fios de luz ligam a skill ao anel; a câmera recua até o **pódio do Ranking de Áreas**: Operations 951 (3º), M&A Services 1.054 (2º) e **DTS 1.557 (1º)** | cards do FLOWS nos blocos com pontos contando, placa **Nº 1 entre 12 áreas** com conector desenhado, *87 publicações · 142 adoções* |
| 2:27 | Encerramento | O emblema DTS volta ao centro; letterbox | **Todos Sabem. Todos Usam. Somos Exemplo.** por ~4 s · *Compartilhe sua skill no FLOWS* · assinatura Alvarez & Marsal |

Dados do ranking: tela *Ranking → Áreas → Todos os tempos* do FLOWS (recalculado em 9 set 2026,
12 áreas no placar). Os textos de apoio dos pilares, as notas e as legendas foram escritos para o vídeo.

## O que mudou da v3 para a v4

| Tema | v3 | v4 |
|---|---|---|
| Ritmo | 82 s de filme, transições rápidas | 146 s: a coreografia da v3 é reproduzida por uma **curva de tempo monotônica** (`src/pace.js`), com mais tempo exatamente onde a câmera se movia rápido |
| Pilares | íris colorida + medalhão (≈1,5 s) | **MOVER → ASSENTAR → LER → ABSORVER → TRANSIÇÃO**: 4–5 s de quadro parado, tipografia imóvel durante a leitura, brilho nas letras e luz do ambiente na cor do pilar |
| Câmera | Catmull-Rom com saltos de velocidade, cortes escondidos por íris e flashes, tremores | caminho **Hermite monotônico no tempo** (velocidade contínua, sem overshoot); os cortes viraram movimentos reais; sem tremores; pico ≤ ~20°/s (exceto o voo da skill, que plana) |
| Motion graphics | estouros, íris, carimbo "batendo", marca-texto, contagens rápidas | revelações por máscara, fios desenhados, placas translúcidas, contadores suaves; nada pisca |
| Abertura A&M | skyline sobe com quique + estrela | ambiente premium (constelação de dados, trilhas de luz, grade, partículas), marca materializada pela luz, tipografia por máscara e pausa final |
| Nitidez | modal 2,2×, cards 2× | modal **3,2×** (carregado sob demanda), cards e botão **4×**; nitidez (unsharp) no grade; DOF e motion blur mais contidos (obturador ~135°) |
| Som | trilha 96 BPM com muitos efeitos | trilha 84 BPM, mais ampla, com crescendos para cada pilar; efeitos mais raros e suaves, posicionados pela mesma curva de tempo |

## Linguagem visual ("longa de animação" traduzido em técnica)

| Intenção | Como foi feito |
|---|---|
| Luz de hora dourada | céu procedural, luz-chave quente, contraluz que assume a cor do pilar ativo, hemisférica fria, reflexos de um mapa de ambiente do próprio céu |
| Materiais táteis | `MeshPhysicalMaterial` com clearcoat, dourado metálico, bordas arredondadas, letras extrudadas (Nunito 900) |
| Lente de cinema | profundidade de campo animada por plano, motion blur de câmera (com máscara para o que a câmera acompanha), bloom com limiar alto, ACES, grade com split-tone, vinheta e nitidez, letterbox 2.39:1 na abertura e no fim |
| Chão de verdade | sombras suaves (PCF) e sombras de contato sob cada objeto |
| Atuação dos objetos | antecipação e overshoot contidos, arcos em Bézier, câmera contínua por atos |
| Camada After Effects | revelação por máscara, fios e ícones com traço animado (trim paths), rastreador de passos, moldura de foco rastreada no 3D, placas translúcidas, contadores, conector desenhado |
| Som | trilha original (Ré maior, 84 BPM), crescendos nos pilares, cliques e sinos discretos sincronizados a cada evento visual |

## Marca Alvarez & Marsal

- O monograma (`tex/am_mark.svg`) é o arquivo oficial do site alvarezandmarsal.com, na versão
  vazada (branca sobre azul). No 3D ele só é extrudado e iluminado: as peças sobem pelo piso e as letras
  aparecem por dissolução, mas a forma final mantém as proporções originais.
- Paleta usada na vinheta: azul A&M `#0085CA`, azul-marinho profundo e um acento laranja discreto.
- A tipografia da marca é a Helvetica Neue LT Std (licenciada); nos textos da vinheta e da
  assinatura foi usada a Liberation Sans (OFL), de desenho equivalente.
- Para uso externo, valide com a equipe de marca da A&M.

## Pipeline ("After Effects em código")

```
monograma A&M (SVG) ─► extrusão 3D + palco (src/ident.js) ─────────────────┐
prints do FLOWS ─► telas .webp ─┐                                          │
réplica HTML/CSS da UI ─► bake.mjs ─► texturas PNG (modal, cards, ranking) ┼─► coreografia pura t→cena ─► curva de ritmo ─► Chromium headless ─► JPEG ─┐
three.js: céu, praça, anel de 441 skills, pódio, props (src/*.js) ─────────┤   (src/timeline.js)            (src/pace.js)                                ├─► ffmpeg ─► MP4
motion graphics DOM/SVG (src/mg.js, hud.css) ──────────────────────────────┘                                                                             │
trilha (audio/soundtrack.py): música original + efeitos no mesmo relógio ────────────────────────────────────────────────────────────────────────────────┘
```

Cada valor da cena é função pura do tempo, então qualquer quadro pode ser renderizado isoladamente
(render paralelo e re-render de trechos).

## Reproduzir / editar

```bash
npm install                        # three + playwright-core; CHROME_PATH=<Chromium/Chrome> fora do Claude Code
npm run bake                       # gera tex/*.png e tex/manifest.json (estados do modal, cards, ranking, logo)
python3 -m pip install numpy scipy
npm run audio                      # audio/soundtrack.wav (155,2 s)
npm run preview                    # quadros avulsos em out/preview (PNG)
Q=0.5 node render.mjs frames 8 0 1 out/lr          # prévia rápida: 3D em meia resolução, 8 fps
node render.mjs frames 24 0 3 out/frames & node render.mjs frames 24 1 3 out/frames & node render.mjs frames 24 2 3 out/frames
ffmpeg -framerate 24 -i out/frames/f_%05d.jpg -i audio/soundtrack.wav \
       -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 19 \
       -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart \
       -c:a aac -b:a 192k -ar 48000 -shortest video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4
npm run storyboard
```

O render usa WebGL por software (SwiftShader): ~12 s por quadro por processo em 1080p (3 processos ≈ 4 h).
Para refazer um trecho, apague os quadros e rode `node render.mjs frames 24 0 1 out/frames <t0> <t1>`
(tempos globais: a vinheta ocupa 0–9,6 s e o filme começa em 9,6 s).

## Onde mexer

- **Ritmo**: `PACE` em `src/pace.js` — pares *[tempo do filme, tempo da história]*. Afastar dois pontos
  deixa aquele trecho mais lento; os três pilares são ancorados na história (`PILLAR_STORY`).
  A trilha lê o mesmo arquivo; rode `npm run audio` depois de mudar.
- Legendas (com `*termos*` sublinhados) e textos dos pilares: `SUBS` e `LOCK` em `src/timeline.js` (tempo da história).
- Ranking: `AREAS` em `src/podium.js` (pontos, posições, cores); publicações/adoções e textos no HUD em `src/timeline.js`.
- Vinheta A&M: `src/ident.js` (trilhas de luz, subida das peças, varredura, câmera) e `ID_TYPE` (tipografia).
- Câmera: `CAM_P`/`CAM_T` em `src/timeline.js` (chaves por tempo da história; interpolação em `path()` de `src/util.js`).
- Motion graphics: componentes em `src/mg.js`, estilos em `hud.css`.
- Motion blur: `SHUTTER` em `src/timeline.js` e `src/mblur.js`.
- Nome da skill e estados do modal: `bake.mjs`; cards e ranking: `src/ui.js` (rode `npm run bake` depois).
- Luz, céu, DOF, luz do ato (`setAccent`) e grade de cor: `src/world.js`. Objetos e materiais: `src/objects.js`.
- A composição é `film.htm` (extensão `.htm` de propósito, para o Vite do app principal não varrer esta página).

Fontes: Inter, Fraunces, JetBrains Mono, Nunito e Liberation Sans (SIL Open Font License). Ícones no estilo Lucide (ISC).
A versão com o avatar como apresentador continua em `../flows-compartilhar-skill/`.
