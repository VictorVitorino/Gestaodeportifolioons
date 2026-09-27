# DTS · Todos Sabem, Todos Usam, Somos Exemplo — curta 3D cinematográfico (v7)

Curta de **2 min 54 s** (1920×1080, 24 fps) que conta o fluxo **Compartilhar Skill** do FLOWS pela lente
dos três pilares da **DTS — Digital & Technology Services**, da **Alvarez & Marsal**. Abre com a
**entrada do Fabio**, segue o roteiro em 3 atos e fecha com o **Ranking de Áreas do FLOWS**, em que DTS é a nº 1.
Não há personagem: o protagonismo é da própria skill, um objeto 3D que nasce do modal, voa e pousa na Biblioteca.

A v5 mantém o filme da v4 e acrescenta, a pedido do time: um **tour rápido pelo FLOWS** (Catálogo de Métodos →
métodos de DTS → Início → Biblioteca de Skills), a **anatomia do nome da skill** (Prefixo da Área · Service Line ·
Produto/Entregável, um item por vez), a **2ª página do formulário (Detalhes)** fiel ao FLOWS real e o **troféu 95**
no card publicado. O passo a passo ficou ~22% mais ágil (a digitação do nome segue igual).

A v6 é o mesmo filme, **~18% mais enxuto**, com a **entrada do Fabio** incorporada: o clipe enviado pelo
time abre o vídeo com o som dele (estalo de dedo e o DTS surgindo), substitui a abertura na praça e o filme
3D assume, sem corte perceptível, durante o movimento final de câmera do clipe (ver *Entrada do Fabio*
abaixo). A vinheta Alvarez & Marsal saiu da abertura a pedido do time (o código continua disponível:
`INTRO.ident` em `src/pace.js`).

A v7 é o mesmo filme, com o mesmo conteúdo e a mesma ordem, **reritmado para leitura confortável**. Nenhum
texto sai da tela antes de ser lido: cada legenda fica, no mínimo, 0,7 s + o tempo de ler seus caracteres a
13,5 por segundo (e nunca menos de 2,8 s). Câmera, zoom e troca de tela esperam a leitura terminar. A
passagem *Como DTS compartilha conhecimento* → *Todos Sabem* ficou contínua: o título atravessa o corte
sobre o pilar, sai por máscara e só então a câmera desce até o pilar (no corte, a câmera 3D mantém a
velocidade do giro do clipe). O tour (métodos e skills) e a
etapa Detalhes ganharam tempo próprio, com digitação em ritmo natural (ver *O que mudou da v6 para a v7*).

| Entrega | Arquivo |
|---|---|
| Filme final (1920×1080, 24 fps, H.264 + AAC 48 kHz) | `video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4` |
| Pôster (cartela final) | `video/poster.jpg` |
| Storyboard (24 quadros-chave com tempo e ato) | `video/storyboard.jpg` |

## Roteiro

| Tempo | Ato | Cena | Motion graphics |
|---|---|---|---|
| 0:00 | **Entrada do Fabio** | Fabio no estúdio azul olha para a câmera, sorri, pisca e **estala os dedos**: a câmera recua e o **emblema DTS** surge à frente dele; o estúdio vira a praça do filme | som original do clipe (estalo, DTS surgindo) |
| 0:07 | | Na praça, sobre o emblema, ele apresenta a DTS | *Como DTS compartilha conhecimento* em placa de vidro · o HUD do filme aparece |
| 0:09 | **Todos Sabem** (azul) | A câmera gira para o pilar e o **filme 3D assume no meio do movimento**; as letras *Todos Sabem* se formam **sob o título, que continua na tela** | a música do clipe fecha no seu impacto e a trilha do filme nasce dele |
| 0:13 | | O título sai (subtítulo, palavras por máscara, placa); a câmera **desce até o pilar** | *Pilar 01 · Onde está o conhecimento* (≈3 s de leitura) |
| 0:20 | | Tela **Início** do FLOWS em moldura 3D | *Todos sabem onde encontrar…* · legendas em placa translúcida com sublinhado desenhado |
| 0:26 | **Tour do FLOWS** (14 s) | Início: **métodos** e **skills** → Catálogo de Métodos: **filtro DTS** e a linha **DTS · 5 métodos** → Início → **Biblioteca de Skills** com as pontuações | um enquadramento parado por frase; anéis na própria tela, cursor com clique |
| 0:41 | | Anel de **441** skills; três skills em destaque | *Na Biblioteca, a Alvarez já reúne 441 skills prontas para reuso* · *…leva 6 passos* |
| 0:54 | **Todos Usam** (laranja) | Viagem até o pilar; luz laranja; **segura ~4 s** | *Pilar 02 · O passo a passo no dia a dia* |
| 1:01 | | Passos 1–2: botão-cápsula, teclas `[DTS]` e o nome digitado | rastreador de passos, moldura de foco |
| 1:13 | **Anatomia do nome** (7 s) | **[DTS] → Prefixo da Área**, **Change Management → Service Line**, **Mapa de Impactos → Produto/Entregável** | rótulos numerados com conector, holofote no campo |
| 1:20 | | Passos 3–5: *Flows / Claude*, tambor de modelos (*Claude Sonnet 5*), caixa `SKILL.zip` | notas presas ao 3D, cada uma lida por ≥1,5 s |
| 1:45 | **Passo 6 · Detalhes** (20 s) | Template, **DTS — Performance (DTS)**, co-responsáveis (nomes digitados), descrição e **Compartilhar Skill** | página que rola como no FLOWS, foco que acompanha |
| 2:06 | | O modal vira o card **NOVA** com **troféu 95**, que plana até o anel: **442** | *Pronto: a skill está publicada na Biblioteca* |
| 2:15 | **Somos Exemplo** (dourado) | Recuo contínuo até o pilar; luz dourada; **segura ~4,5 s** | *Pilar 03 · Quem compartilha, lidera pelo exemplo* |
| 2:24 | | Fios de luz; pódio do **Ranking de Áreas**: Operations 951, M&A Services 1.054 e **DTS 1.557 (1º)** | cabeçalho do ranking sob o selo DTS, placa **Nº 1 entre 12 áreas** |
| 2:41 | Encerramento | O emblema DTS volta ao centro; letterbox; a cartela fica ~4 s completa | **Todos Sabem. Todos Usam. Somos Exemplo.** · assinatura Alvarez & Marsal |

## Entrada do Fabio (v6, transição refeita na v7)

O clipe enviado (`media/entrada_fabio.mp4`, 10,5 s, 30 fps) foi gerado a partir de uma versão anterior do
filme: por isso ele termina na mesma praça, com o emblema, o título e o giro até o pilar Todos Sabem. A costura:

| Ponto | Como ficou invisível |
|---|---|
| Abertura | o vídeo abre direto no Fabio (fade curto do preto); a vinheta A&M foi retirada |
| Texto antigo no clipe (*Como **a** DTS…*) | coberto por uma **placa de vidro** com o título correto (*Como DTS compartilha conhecimento*), no mesmo lugar e no mesmo instante em que o texto antigo sobe |
| HUD antigo gravado no clipe | um **push-in lento** (×1,12, 5,9–7,1 s) tira o HUD antigo do quadro antes que ele apareça; o HUD do filme entra no mesmo ponto |
| Clipe → filme 3D | corte aos **9,5 s do clipe**, no meio do giro de câmera, depois que o Fabio sai do quadro. A câmera do filme começa **na pose resolvida a partir do último quadro do clipe** (pódio, letra D do emblema e aro dourado alinhados) e continua o movimento **na mesma velocidade e direção do giro do clipe**, desacelerando até assentar num enquadramento um pouco mais aberto sobre o pilar (olhando um pouco acima dele); as letras de *Todos Sabem* seguem se formando como no clipe; um brilho quente carrega o halo do emblema do clipe por meio segundo |
| Título → pilar (v7) | o título *Como DTS compartilha conhecimento* **não sai no corte**: fica ~5,8 s legível (2 s no clipe + 3,8 s sobre o pilar, que se forma logo abaixo dele). Depois sai em cascata (subtítulo, palavras recolhidas pela máscara, placa de vidro); a câmera então desce até o pilar e o *Pilar 01* sobe. Na trilha, o acorde do impacto do clipe sustenta a leitura, passa ao IV quando a câmera desce e resolve quando o *Pilar 01* assenta |
| Cor | o clipe recebe uma correção suave (sombras menos magenta) e nitidez leve (`tools/intro.sh`) para casar com o 3D |
| Som | a entrada mantém o **som original do clipe** (o estalo de dedo aos 3 s e o DTS surgindo). O som **não é cortado no corte de imagem**: a música do clipe segue por cima dos primeiros quadros do filme até o seu próprio impacto (10 s, um acorde de Ré maior com sétima), que ressoa na mesma reverberação do filme, e as cordas da trilha nascem de dentro desse impacto, no mesmo acorde, sustentando o pilar Todos Sabem. Nenhum elemento rítmico da trilha entra antes de a música do clipe terminar; o nível do clipe é igualado ao da trilha |

Dados do ranking: tela *Ranking → Áreas → Todos os tempos* do FLOWS (recalculado em 9 set 2026,
12 áreas no placar). Telas do tour: prints reais do FLOWS (`tex/screen_*.webp`). A 2ª página do formulário
foi reproduzida a partir da gravação de tela do FLOWS (lista de especializações com códigos, busca de pessoas,
chips "Sobrenome, Nome", botão *Compartilhar Skill* habilitado só após escolher a área); nas sugestões de
pessoas o vídeo mostra apenas o nome (sem e-mail). Os textos de apoio, as notas e as legendas foram escritos para o vídeo.

## O que mudou da v6 para a v7

| Pedido | Como ficou |
|---|---|
| *Como DTS compartilha conhecimento* → *Todos Sabem* rápido demais | o título atravessa o corte e fica sobre o pilar (câmera assenta mais alta); saída por máscara em cascata, depois a câmera desce e o *Pilar 01* sobe. Legível ~5,8 s (antes ~2 s, com saída de 0,4 s por cima das letras) |
| Tempo de leitura (métodos, skills, Biblioteca de Métodos/Skills) | tour de **8,5 → 14,2 s**: uma frase por tela, enquadramento parado enquanto se lê e troca de tela junto com a troca de frase. *O FLOWS organiza métodos e skills* destaca os dois cards do Início; *Os métodos de DTS ficam no Catálogo* mostra o filtro DTS e a linha *DTS · 5 métodos* num único plano; *E a Biblioteca de Skills…* vai até as pontuações. Legendas a 9–11 caracteres/s (antes 14,6–17) |
| Preenchimento dos Detalhes rápido demais | etapa de **12 → 20,2 s**: nomes digitados a ~11 letras/s (antes ~15), sugestão, pausa e clique; descrição digitada em 3,3 s (antes 1,4 s); cada campo é enquadrado quando sua frase entra e fica parado durante a leitura |
| Legendas visíveis durante toda a cena | regra única verificada por `node textqa.mjs` para todas as 23 legendas e 18 textos do filme (título, pilares, contadores, notas, rótulos, cartela): nenhum "curto" |
| Sem cortes/zooms durante a leitura | movimentos de câmera acontecem entre frases; nos planos de leitura só há um avanço lento (≤1,5%) |
| Elementos saem aos poucos | pilares: o texto sobe enquanto a câmera assenta e só sai quando o próximo movimento começa; notas (*obrigatório*, *opcional*, *SKILL.md na raiz*, *contexto da validação*), contador 442 e cartela final ganharam 0,3–2 s de permanência |
| Ritmo equilibrado | o tempo extra foi para a leitura; as ações do passo a passo mantiveram a velocidade da v6. Filme 2:14 → **2:54** |
| Troféu do ranking com a alça quebrada | as alças das taças do pódio (ouro e prata) foram refeitas: cada uma é um laço que sai logo abaixo da borda e volta ao bojo, com as pontas presas na parede da taça; a esquerda é o espelho exato da direita (antes estava girada ao contrário e parecia um gancho solto) |

## O que mudou da v4 para a v5

| Pedido | Como ficou |
|---|---|
| Passo a passo mais rápido | ~22% menos tempo em cada passo (curva `PACE`); a digitação do nome ficou exatamente como na v4 |
| "Como DTS" / "a Alvarez" | abertura *Como DTS compartilha conhecimento*; *Na Biblioteca, a Alvarez já reúne…*; também *E DTS lidera…* e *+1 skill de DTS* |
| Overview do FLOWS (Todos Sabem) | inserto de 10 s: Catálogo de Métodos → métodos de DTS → voltar ao Início → Biblioteca de Skills → fechamento com as 441 skills |
| Ênfase no nome da skill | inserto de 5 s: Prefixo da Área, Service Line e Produto/Entregável, um de cada vez, depois o padrão completo |
| 2ª página (Detalhes) | inserto de 14 s com Template, DTS — Performance, co-responsáveis, descrição e *Compartilhar Skill* |
| Troféu no card | chip com troféu **95**, igual aos cards reais da Biblioteca |
| Ranking | *Ranking de Áreas · Todos os tempos* e *12 áreas no placar* foram para baixo do selo DTS (canto superior esquerdo) |

Na v6 os insertos ficaram mais curtos (tour 8,5 s, nome 4,3 s, Detalhes 12 s): cada um roda o mesmo roteiro
num relógio de projeto (`INSERT_DESIGN`) acelerado de forma uniforme. As legendas dos insertos foram encurtadas
para continuarem confortáveis de ler (todas entre 6 e 18 caracteres por segundo).

Os insertos são trechos planos da curva de ritmo: a história "congela" e a cena nova roda no relógio do filme,
com câmera própria que sai e volta exatamente ao enquadramento congelado, em repouso (sem saltos).

## O que mudou da v3 para a v4

| Tema | v3 | v4 |
|---|---|---|
| Ritmo | 82 s de filme, transições rápidas | 146 s: a coreografia da v3 é reproduzida por uma **curva de tempo monotônica** (`src/pace.js`), com mais tempo exatamente onde a câmera se movia rápido |
| Pilares | íris colorida + medalhão (≈1,5 s) | **MOVER → ASSENTAR → LER → ABSORVER → TRANSIÇÃO**: 4–5 s de quadro parado, tipografia imóvel durante a leitura, brilho nas letras e luz do ambiente na cor do pilar |
| Câmera | Catmull-Rom com saltos de velocidade, cortes escondidos por íris e flashes, tremores | caminho **Hermite monotônico no tempo** (velocidade contínua, sem overshoot); os cortes viraram movimentos reais; sem tremores; pico ≤ ~20°/s (exceto o voo da skill, que plana) |
| Motion graphics | estouros, íris, carimbo "batendo", marca-texto, contagens rápidas | revelações por máscara, fios desenhados, placas translúcidas, contadores suaves; nada pisca |
| Abertura A&M | skyline sobe com quique + estrela | ambiente premium (constelação de dados, trilhas de luz, grade, partículas), marca e letras materializadas pela luz, tipografia por máscara e pausa final |
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
  são reveladas por uma linha de luz, mas a forma final mantém as proporções originais.
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
./tools/intro.sh                   # quadros da entrada do Fabio (tex/fabio) a partir de media/entrada_fabio.mp4
npm run audio                      # audio/soundtrack.wav (173,8 s; usa o som de media/entrada_fabio.mp4 na entrada)
python3 tools/mkpace.py            # (se mudar o ritmo) regrava a curva PACE a partir da lista de batidas SEGS
node textqa.mjs                    # confere o tempo de leitura de todas as legendas e textos do filme
npm run preview                    # quadros avulsos em out/preview (PNG)
Q=0.5 node render.mjs frames 8 0 1 out/lr          # prévia rápida: 3D em meia resolução, 8 fps
node render.mjs frames 24 0 3 out/frames & node render.mjs frames 24 1 3 out/frames & node render.mjs frames 24 2 3 out/frames
ffmpeg -framerate 24 -i out/frames/f_%05d.jpg -i audio/soundtrack.wav \
       -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 19 \
       -profile:v high -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart \
       -c:a aac -b:a 192k -ar 48000 -shortest video/DTS_Todos_Sabem_Usam_Exemplo_3D.mp4
npm run storyboard
```

O render usa WebGL por software (SwiftShader): ~10 s por quadro por processo em 1080p (3 processos ≈ 3 h 40 min);
os quadros da entrada do Fabio não usam o 3D e saem em segundos.
Para refazer um trecho, apague os quadros e rode `node render.mjs frames 24 0 1 out/frames <t0> <t1>`
(tempos globais: a entrada do Fabio ocupa 0–9,5 s e o filme 3D começa em 9,5 s).

## Onde mexer

- **Ritmo**: `SEGS` em `tools/mkpace.py` — batidas *[tempo da história, segundos de filme desde a anterior]*;
  o script regrava `PACE` em `src/pace.js` (pares *[tempo do filme, tempo da história]*). Mais segundos
  deixam aquele trecho mais lento; os três pilares são ancorados na história (`PILLAR_STORY`) e uma batida
  repetida cria um inserto (`INSERTS`: tour, anatomia do nome, Detalhes; na v7 rodam em tempo real, k = 1).
  A trilha lê o mesmo arquivo; rode `npm run audio` e `node textqa.mjs` depois de mudar.
- Insertos: roteiros em `SCHED` (`src/pace.js`), lidos pela imagem e pela trilha — telas, anéis, cursor e
  cliques do tour; tempos da anatomia do nome; estados, digitação, rolagem, foco e cliques dos Detalhes.
  As câmeras dos insertos ficam em `INS_CAM` (`src/timeline.js`).
- Entrada do Fabio: `INTRO` em `src/pace.js` (duração usada, push-in, HUD, título e sua saída `out`), a pose
  de câmera do corte (`HANDOFF` em `src/timeline.js`, resolvida com `handoff.mjs`) e o assentamento alto
  sobre o pilar enquanto o título é lido (`HI`, `spHi` em `src/timeline.js`).
- Legendas (com `*termos*` sublinhados): `SUBS` em `src/pace.js` (tempo da história) e `SCHED.*.subs` (tempo do
  inserto); textos dos pilares: `LOCK` em `src/timeline.js`. Regra de leitura e conferência: `textqa.mjs`.
- Ranking: `AREAS` em `src/podium.js` (pontos, posições, cores); publicações/adoções e textos no HUD em `src/timeline.js`.
- Vinheta A&M: `src/ident.js` (trilhas de luz, subida das peças, varredura, câmera) e `ID_TYPE` (tipografia).
- Câmera: `CAM_P`/`CAM_T` em `src/timeline.js` (chaves por tempo da história; interpolação em `path()` de `src/util.js`).
- Motion graphics: componentes em `src/mg.js`, estilos em `hud.css`.
- Motion blur: `SHUTTER` em `src/timeline.js` e `src/mblur.js`.
- Nome da skill, estados do modal e da página Detalhes (descrição, pessoas, área): `bake.mjs`; réplicas em
  `src/ui.js` (`shareModal`, `shareModalDetails`, cards e ranking). Rode `npm run bake` depois.
- Luz, céu, DOF, luz do ato (`setAccent`) e grade de cor: `src/world.js`. Objetos e materiais: `src/objects.js`.
- A composição é `film.htm` (extensão `.htm` de propósito, para o Vite do app principal não varrer esta página).

Fontes: Inter, Fraunces, JetBrains Mono, Nunito e Liberation Sans (SIL Open Font License). Ícones no estilo Lucide (ISC).
A versão com o avatar como apresentador continua em `../flows-compartilhar-skill/`.
