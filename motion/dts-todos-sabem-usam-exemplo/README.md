# DTS · Todos Sabem, Todos Usam, Somos Exemplo — curtas 3D cinematográficos (v10, v9, v8 e v7)

## v10 · A Travessia (1:59, sem nenhuma fala)

Versão totalmente customizada e lúdica, em **1080p a 30 fps**, com **menos de 2 minutos** e **cinematografia
estilo Pixar 3D**. Nenhuma fala e nenhuma frase na tela: só títulos e etiquetas. A história é fixa:
o Fabio é **transportado** ao mundo FLOWS e **entra pela porta de luz**; as iniciais **DTS** (Digital &
Technology Services) são escritas no céu; um **nivelamento** mostra *Todos Sabem · Todos Usam · Somos
Exemplo*; ele caminha até a **Biblioteca de Skills**, toca o painel, atravessa o portal e **ele mesmo aperta
Publicar Skill**; a skill é construída (**as 2 páginas do formulário**) e publicada; o **contador** vai de 441
para **442**; um **chafariz de luz** mostra que a skill ajuda todo mundo; e o **ranking** fecha com a **DTS em
1º lugar** e o **Fabio levantando o número 1**. Um único cenário do começo ao fim: o salão 3D é o mesmo salão
noturno das filmagens, sem quebra de ambiente.

| Entrega | Arquivo |
|---|---|
| Filme v10 (1920×1080, 30 fps, H.264 + AAC 48 kHz, 1:59) | `video/FLOWS_A_Travessia_v10.mp4` |
| Pôster e storyboard | `video/poster10.jpg`, `video/storyboard10.jpg` |

| Tempo | Ato | Cena | Conector (sem corte seco) |
|---|---|---|---|
| 0:00 | **Transporte** | Fabio de braços cruzados no espaço de luz; anéis dourados e espirais o envolvem | as espirais crescem até o clarão |
| 0:03 | | Um fio dourado da espiral atravessa o clarão e **vira o arco do logo FLOWS** | forma: espiral → anel → logo |
| 0:04 | | A câmera desce, a **porta de luz** sobe e o Fabio se materializa dentro dela | luz: a porta inunda o quadro |
| 0:07 | **DTS** | O palco FLOWS; um **fio de luz sai do "O"** e escreve **D·T·S** no céu, que se preenche em azul-marinho com borda dourada; *Digital & Technology Services* | câmera lenta suave (fluxo óptico) |
| 0:11 | **Nivelamento** | Três **colunas de luz** sobem desiguais (placa esquerda, o próprio Fabio, placa direita); uma **linha dourada** passa e as nivela; **TODOS SABEM · TODOS USAM · SOMOS EXEMPLO** | as colunas afundam quando ele começa a andar |
| 0:17 | **01 · Todos Sabem** | A caminhada; o **toque na Biblioteca de Skills**; o portal; o salão; **441 skills** orbitando | emendas no quadro exato das filmagens |
| 0:36 | **02 · Todos Usam** | O botão **Publicar Skill** sobe; em câmera lenta, **o dedo do Fabio aperta** (a mão em 1ª pessoa foi apagada); o botão se carrega de luz | a **íris dourada** nasce do botão pressionado |
| 0:39 | | O mesmo salão, agora em 3D: o formulário nasce da luz e o Fabio se materializa ao lado | câmera em movimento contínuo |
| 0:42 | | **Página 1 · Arquivos**: nome [DTS] e sua anatomia, onde foi testada, modelo, tempo, SKILL.zip, Próximo · **Página 2 · Detalhes**: Template, área DTS, co-responsáveis, descrição, *Compartilhar Skill* (etiquetas *Passo N de 6*) | plano-sequência |
| 1:23 | | O formulário dobra no card, que voa à Biblioteca: **442**, com o **Fabio apresentando** | a skill nova brilha no mural |
| 1:32 | **03 · Somos Exemplo** | **O chafariz**: uma **gota de luz** sai da skill publicada e cai no centro da praça; a bacia se abre, o jato central sobe, os **três pilares** emergem e uma coroa de **44 jatos** alcança o mural inteiro, acendendo cada card; o Fabio de braços abertos | a luz escoa e o pódio sobe no lugar da bacia |
| 1:42 | | **Ranking de Áreas**: a **DTS em 1º** (1.557 pontos) e o **Fabio levantando o número 1** | a câmera desliza até ele |
| 1:51 | Encerramento | *Todos Sabem. Todos Usam. Somos Exemplo.* · DTS · FLOWS · A&M, com o Fabio acenando | fade |

**A abertura** (`tools/plate10.py`) é uma única tomada a 30 fps feita das quatro filmagens do Fabio
(`media/v10_*.mp4`): as emendas R21 → R22 → R23 caem no quadro idêntico; o R16 (a porta) tinha um quadro
repetido a cada cinco e passa a rodar seus quadros únicos a 24 fps com intermediários por fluxo óptico
(DIS); no palco, a velocidade desce suavemente a 0,3× (intermediários por fluxo óptico, sem tremor) para o
DTS e o nivelamento, e volta a 1× quando ele anda. As transições são de luz, nunca branco puro. Em R23, a
mão de quem assiste foi pintada por cima com um *clean plate* rastreado (`tools/hand10.py`), protegendo o
dedo do Fabio, que é quem aperta o botão. `tools/track10.py` rastreia a câmera do palco (céu e piso, ORB +
RANSAC), e os gráficos vivem dentro da cena: o DTS acompanha o céu, as colunas acompanham o piso.

**O salão 3D** (`src/film10.js`, `world.night()`): o mundo da v7 relido à noite, com o mesmo azul-marinho,
estrelas, nebulosas, luz vinda do zênite e os anéis dourados do piso acesos, para que a íris abra no
**mesmo lugar** das filmagens. O formulário é o da v7 num plano-sequência mais ágil (sem legendas para ler,
o próprio formulário é o texto). O **chafariz** (`src/fountain10.js`) é novo: gota, bacia, coluna, coroa de
jatos (tubos de luz + gotículas) e o mural que se acende card a card. Os três pilares ficam sob o piso até
o chafariz os erguer.

**Som** (`audio/soundtrack10.py`): música original sem voz: as espirais, o mundo que nasce do anel, a caneta
de luz que escreve o DTS (uma nota por contorno), as colunas e o nivelamento, a caminhada, o portal, a
órbita e o contador, o aperto e a íris, o groove calmo do formulário, **uma nota para cada card que o
chafariz acende**, a fanfarra do nº 1 e o final. Master em -16 LUFS, pico real ≤ -1 dBTP.

**QA de movimento**: `tools/jumpscan10.py` mede a variação quadro a quadro e aponta saltos;
`tools/badframes10.py` encontra quadros com falha de rasterização e o render os refaz.

**Reproduzir a v10:** `npm run footage10` → `npm run audio10` → `npm run frames10` → `npm run encode10` →
`npm run storyboard10`.

---

## v9 · O Fio Dourado · a jornada do Fabio (2:16)

A versão longa e calma (mais de 2 minutos): mais movimento, respiro entre as falas, calmaria no
preenchimento do formulário e tempo de leitura para cada texto. As filmagens do Fabio viram uma única
cena contínua: o tema escrito em luz, a caminhada, **o toque na Biblioteca de Skills**, o **portal para o
universo FLOWS**, as skills orbitando ao redor dele e o botão **Publicar skill** que ele oferece a quem
assiste. O dedo aperta o botão e uma **íris dourada** se abre a partir dele para o FLOWS 3D, que segue em
**plano-sequência** (o filme da v7 no ritmo de leitura, sem cortes secos). A câmera só deixa o formulário
para encontrar o Fabio, agora **de corpo inteiro dentro do mundo**, feito de luz dourada dos pés à cabeça,
como o portal: apresentando o mural, de braços abertos para os arcos, apontando o **Nº 1** e se despedindo.

| Entrega | Arquivo |
|---|---|
| Filme v9 (1920×1080, 24 fps, H.264 + AAC 48 kHz) | `video/FLOWS_O_Fio_Dourado_v9.mp4` |
| Pôster e storyboard | `video/poster9.jpg`, `video/storyboard9.jpg` |

| Tempo | Ato | Cena | Como foi feito |
|---|---|---|---|
| 0:00 | **Abertura** | Espirais de luz em volta do Fabio escrevem **TODOS SABEM · TODOS USAM · SOMOS EXEMPLO**; o logo FLOWS; o *Pilar 01* enquanto ele caminha | referência 1 + tipografia em luz |
| 0:13 | **Todos Sabem** | Corte na ação: a mão dele **toca a Biblioteca de Skills**, um anel dourado se forma, o **portal** se abre, o universo FLOWS nasce e as skills **orbitam** ao redor dele: **441 skills prontas para reuso** | continuação da entrada (`media/referencia_continuacao.mp4`) |
| 0:22 | **Todos Usam** | Fusão na órbita; a câmera desce, o botão **Publicar skill** surge diante dele, o Fabio aponta e o dedo de quem assiste aperta (*Passo 1 de 6*) | `media/referencia_botao.mp4` |
| 0:27 | | **A íris dourada** abre, a partir do botão, o formulário **Compartilhar Skill** do FLOWS 3D | máscara circular + anel de luz |
| 0:28 | | **Plano-sequência** do formulário, calmo: nome padrão e sua anatomia, onde foi testada, modelo, SKILL.zip, Próximo, Detalhes (Template, área DTS, co-responsáveis, descrição), *Compartilhar Skill*; cada passo com legenda numerada (*Passo N de 6*) e as etiquetas da v7 de volta | o filme da v7, velocidade 0,8–1,1× |
| 1:27 | **Somos Exemplo** | O card voa ao mural: **442**; a câmera recua e encontra o **Fabio apresentando** o mural | Fabio de corpo inteiro no 3D |
| 1:39 | | *Pilar 03 · Somos Exemplo*; os **arcos dourados** partem para todo o mural e o **Fabio abre os braços** | idem |
| 1:52 | | **Ranking de Áreas**: o pódio sobe, a câmera desliza para o **Fabio apontando o Nº 1**, que brota dourado do dedo dele quando o troféu pousa na DTS (1.557 pontos) | idem + selo em motion graphics |
| 2:05 | Encerramento | *Todos Sabem. Todos Usam. Somos Exemplo.* · DTS · FLOWS · Alvarez & Marsal, com o **Fabio acenando** ao lado do DTS | cartela da v7 + Fabio |

**O Fabio de corpo inteiro.** As poses vêm do *model sheet* animado (`media/fabio_poses.mp4`: acenando,
apresentando, *explaining #1 ranking*, boas-vindas). A folha dá um zoom lento: `tools/stab9.py` estima,
quadro a quadro, a similaridade que o leva de volta ao primeiro quadro, e cada pose fica parada na sua
coluna, só com o movimento dela. `tools/matte9.py` recorta cada pose (BiRefNet lite): pinta por cima a mão
ou o *#1* da pose vizinha e remove a franja cinza da folha (descontaminação de cor). `tools/posemeta9.py`
mede onde ficam as solas e a ponta do dedo. No filme (`src/film9.js`), cada pose é um *billboard* de pé no
chão do mundo, virado para a câmera, com sombra de contato e luz de borda. Os quadros correm em vaivém, e
ele se materializa de baixo para cima numa faixa de luz dourada, com um anel no chão e faíscas.

**Câmera.** O plano-sequência nunca corta: nos momentos do Fabio, a câmera da v7 é misturada suavemente
com uma câmera de desvio (entrada e saída de cerca de 1 s), e o foco vai para ele. Os enquadramentos foram
calculados por projeção (pés num pixel-alvo, altura de 40 a 50% do quadro, sem invadir o pódio).

**Texto.** Regra de leitura mais calma que a da v7: legenda com 1,0 s + 13,5 caracteres/s (mínimo 3 s),
lockups e contador com os caracteres a 13,5/s de visibilidade total, e 0,35 s de respiro entre legendas
(ou troca no lugar, quando são do mesmo passo). `node textqa9.mjs` confere tudo: *todos os textos com
tempo de leitura*.

**Som** (`audio/soundtrack9.py`). Música nova sobre o corte: o toque (celesta), o portal (riser e passagem),
o universo FLOWS (sinos e cordas), a órbita (celesta flutuante e o contador), o botão e o aperto (clique,
grave e a íris), um groove calmo sob o formulário, um brilho a cada vez que a luz forma o Fabio, fanfarra
no Nº 1 e o final. Os efeitos da v7 são reposicionados pelo mapa de tempo do plano-sequência. Master em
torno de -15 LUFS, com pico real de -1 dBTP.

**Reproduzir a v9:** `npm run footage9` (quadros das filmagens, estabilização, recortes; `pip install
rembg onnxruntime opencv-python-headless`) → `npm run audio9` → `npm run frames9` (3 processos) →
`npm run encode9` → `npm run storyboard9`.

---


# v8 · O Fio Dourado (1:28)

Um corte cinematográfico **com menos de 1:30**, com o **Fabio como anfitrião**. As duas cenas de referência
enviadas pelo time (`media/referencia_inovadora_*.mp4`: o Fabio envolto por espirais de luz que viram o
mundo FLOWS) abrem o filme. O mundo 3D da v7 é remontado plano a plano, com câmeras novas, rampas de
velocidade e montagem. O Fabio é **recortado da entrada original** (matte por IA, quadro a quadro) e
**composto dentro do mundo FLOWS**. O rastro de luz dourada das referências vira a linha que costura os
cortes: o *fio dourado*.

| Entrega | Arquivo |
|---|---|
| Filme v8 (1920×1080, 24 fps, H.264 + AAC 48 kHz) | `video/FLOWS_O_Fio_Dourado.mp4` |
| Pôster e storyboard | `video/poster8.jpg`, `video/storyboard8.jpg` |

| Tempo | Ato | Cena | Como foi feito |
|---|---|---|---|
| 0:00 | **Abertura · o tema** | Fabio de braços cruzados; espirais de luz azul e dourada o envolvem e **escrevem, uma a uma, TODOS SABEM · TODOS USAM · SOMOS EXEMPLO**; as palavras são levadas pela espiral | referência 1 + tipografia revelada por uma barra de luz, na cor de cada pilar |
| 0:04 | | A espiral vira o aro do **FLOWS** e o mundo nasce; o tema assenta sob o logo | referência 1 + título |
| 0:08 | **Todos Sabem** | Fabio caminha entre *Catálogo de Métodos*, *Meus Projetos* e *Biblioteca de Skills*; o fio dourado o leva à Biblioteca | referência 1 + *Pilar 01* no céu |
| 0:13 | | O fio atravessa o corte e entra na **Biblioteca de Skills** do FLOWS (pontuações) → anel de **441 skills** | 3D da v7 remontado |
| 0:24 | **Todos Usam** | **Fabio dentro do mundo**, diante do pilar *Todos Usam*: olha para nós, sorri, pisca e **estala os dedos**: faíscas, e o botão **Compartilhar Skill** surge ao lado da mão dele | Fabio recortado (BiRefNet) e composto no 3D |
| 0:28 | | Montagem do passo a passo: botão e modal, nome padrão (prefixo, service line, entregável), onde testou, modelo, SKILL.zip, Detalhes (Template, área DTS, co-responsáveis, descrição), *Compartilhar Skill* | 3D da v7 com rampas de velocidade e cortes secos |
| 0:50 | **Somos Exemplo** | O modal vira o card (troféu 95), voa ao **mural de skills** (442); o pilar dourado; os **arcos dourados** partem do card para todo o mural | efeitos da v5/v7 |
| 1:07 | | **Ranking de Áreas**: o pódio sobe; **Fabio em primeiro plano, de braços cruzados, enquanto o troféu pousa na DTS**, e pisca; placa Nº 1 · 1.557 pontos (os selos do ranking vão para a direita, livres do Fabio) | Fabio composto + 3D |
| 1:20 | Encerramento | *Todos Sabem. Todos Usam. Somos Exemplo.* · DTS · FLOWS · Alvarez & Marsal | cartela da v7 |

**Fabio no mundo 3D.** Os gestos existem na entrada original (fundo azul liso): braços cruzados, sorriso,
piscada, estalo, mão aberta. `tools/footage8.sh` extrai esses 4,8 s a 24 fps e `tools/matte8.py` recorta o
Fabio com o **BiRefNet** (rembg/ONNX), com despill da borda azul. Onde o quadro corta o Fabio na cintura, o
modelo às vezes perde a calça e o cinto (ele pareceria flutuar, e a barra piscaria): `tools/matte8_fix.py`
estende a silhueta da barra do colete até a borda do quadro, com uma chave contra o azul do estúdio. No filme,
ele é um plano preso à câmera,
desenhado depois do desfoque e antes do bloom e do grade (`src/film8.js`): fica nítido com o fundo
desfocado e recebe a mesma luz e cor do mundo, com uma leve luz quente na borda.

**Texto.** Poucas frases, curtas e com tempo de leitura (0,7 s + 13,5 caracteres/s). Pilares como
*lockup* (no céu, à esquerda do Fabio ou embaixo, conforme o plano) e legendas na placa translúcida.

**Som** (`audio/soundtrack8.py`). Música nova no corte:
- a espiral sobe em celesta, com um sino por pilar quando cada palavra se escreve;
- o mundo nasce de um impacto suave no aro;
- um groove carrega a montagem, e o estalo do Fabio tem faíscas e o "pop" do botão;
- uma fanfarra recebe o troféu, e as cordas seguram a cartela.

Master: cerca de -14,6 LUFS integrados e pico real de -1 dBTP, com limitador *look-ahead* (sem bordas
cortadas nos transientes, então nada clipa depois do AAC).

Todos os efeitos da v7 (cliques, digitação, tambor, troféu) são reposicionados pelas mesmas funções de
tempo de cada plano (`src/cut8.js`), então caem no quadro certo.

**Reproduzir a v8:** `npm run footage8` (quadros + matte; `pip install rembg onnxruntime`) →
`npm run audio8` → `PAGE=film8.htm node render.mjs frames 24 <w> 3 out/frames8` (3 processos) → ffmpeg com
`audio/soundtrack8.wav` → `python3 tools/storyboard8.py out/frames8 video/storyboard8.jpg`. O corte inteiro
(planos, rampas, textos, transições) está em `src/cut8.js`.

---

# v7 · versão completa com ritmo de leitura (2:54)

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
