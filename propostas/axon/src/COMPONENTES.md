# Axon · Catálogo de componentes e contrato do motor

Guia para os autores dos decks **A · GMO** (`slides-A.*`) e **B · TMO** (`slides-B.*`).
O motor (`engine.js`), o design system (`base.css`) e a biblioteca de revelações (`reveals-lib.js`) já estão prontos; você escreve **apenas** o conteúdo de cada slide.
Fonte da verdade do conteúdo: [`../02-roteiro-propostas.md`](../02-roteiro-propostas.md). Identidade: `../referencias/render/slide-1.jpg … slide-6.jpg`.

> Os arquivos `slides-A.*` e `slides-B.*` são os decks finais e servem de exemplo vivo de cada componente.

---

## 0. Fluxo de trabalho em 4 comandos

```bash
cd propostas/axon/src
node build.mjs /tmp/…/qa/<rótulo>/deck.html            # junta tudo num HTML autocontido (padrão: ../axon-propostas.html)
node tools/shoot.cjs /tmp/…/qa/<rótulo>/deck.html /tmp/…/qa/<rótulo>/shots --deck A --reveals
node tools/shoot.cjs … --deck AB --reveals --mobile --print   # bateria completa
```

- O build **avisa** (não falha) sobre: seções fora do contrato, `data-reveal`/`data-include` inexistentes, templates ausentes, ids duplicados, CSS fora do escopo `#A1…#A6` / `#B1…#B6`. Leia os avisos.
- Nunca use a pasta `build/`. Saídas temporárias: `…/scratchpad/qa/<seu-rótulo>/`.
- **Olhe os PNGs** (`<id>.png`, `<id>-rv<n>.png`, `<id>-flip<n>.png`, `<id>-seg<n>.png`). O JSON resume, mas não substitui o olho.

---

## 1. Contrato de marcação de um slide

```html
<section class="slide" id="A2" data-deck="A" data-index="2" data-title="Mapa de impactos">
  <header class="hdr">
    <h1 class="hdr-title">Mapa de impactos: muda o como, não o porquê</h1>
    <p class="hdr-sub">Cinco gerências × sete perfis, lidos no nível da atividade…</p>
  </header>

  <!-- conteúdo do slide, posicionado em px de canvas (ver §2) -->

  <footer class="foot">Método: escuta dos pioneiros…</footer>

  <template id="tpl-a2-ti" data-title="TI/Infra">…</template>   <!-- revelações locais -->
  <aside class="notes"><p>Nota do apresentador…</p></aside>
  <p class="keymsg" hidden>Mensagem-chave do slide.</p>
</section>
```

| Atributo / elemento | Obrigatório | Regra |
|---|---|---|
| `id` | sim | `A1`…`A6`, `B1`…`B6`. Escopo do CSS. |
| `data-deck` / `data-index` | sim | `A`/`B` e `1`…`6`, na ordem. |
| `data-title` | sim | Título **curto** (tooltip da barra-axônio, leitura, anexo, apresentador). |
| `data-emphasis` | só no B | `GMO`, `PMO`, `GMO + PMO` ou `PMO + GMO` (roteiro, §3). Vira a pílula ao lado do número. |
| `data-compare` | opcional | Uma linha exibida no modo comparar (C), ex.: "B4 só existe no TMO: Plano Mestre e portões G0–G4." Coloque no slide B. |
| `<aside class="notes">` | sim | Nota do apresentador (HTML simples, `<p>`). Oculta no slide. |
| `<p class="keymsg" hidden>` | sim | Mensagem-chave (gaveta de notas, apresentador, anexo impresso). |
| `.brand` e `.pgnum` | **não escreva** | O motor injeta "Alvarez & Marsal" (versalete, x 1230, y 22) e o número (x 1230, y 690) com o selo de ênfase. |

- O slide é um canvas fixo de **1280 × 720 px**; o motor escala com `transform: scale()`. Trabalhe sempre em px de canvas.
- Cada slide deve fazer sentido **fechado** (sem cliques) e **impresso**. Revelações são aprofundamento, não muleta.
- Limite do roteiro: **≤ ~150 palavras visíveis** por slide; títulos ≤ 60 caracteres; subtítulos ≤ 120.

---

## 2. Grade e posicionamento

| Zona | Posição (canvas) | Componente |
|---|---|---|
| Marca | x 1230 (direita), y 22 | automático |
| Cabeçalho | x 50, y 48, largura 1100 (até ~y 142 com subtítulo de 2 linhas) | `.hdr` |
| Corpo | x 50 → 1230, y 150/160 → ~640 | seus blocos |
| Rodapé de premissas | x 50, y 660, largura 1100, até 2 linhas | `.foot` |
| Número + selo | x 1230 (direita), y 690 | automático |

Utilitário de posição absoluta (coordenadas do roteiro direto no HTML):

```html
<div class="at" style="--x:50;--y:240;--w:770;--h:390">…</div>   <!-- --w/--h opcionais -->
```

Layout interno: `.stack` (coluna), `.row` (linha), `.grid` (`--cols`, `--gap` em px), `.fill` (ocupa o resto). Ex.: `<div class="grid" style="--cols:3;--gap:10">`.

---

## 3. Tokens e tipografia

| Token | Valor | Uso |
|---|---|---|
| `--navy` | `#002B49` | dominante: títulos, faixas, painéis, cabeçalhos de tabela |
| `--orange` | `#F78C16` | **acento** (≤ 5%): números 01–06, chevrons, portões, impulso, rótulos sobre navy |
| `--steel` | `#5E8AB3` | subtítulos, cabeçalhos de gerência, fios do axônio, estado "hipótese" |
| `--panel` | `#EDF2F7` | cards, linhas pares, células "a mapear", verso das cartas |
| `--gray` | `#646464` | apoio, rodapé, número |
| `--line` | `#CCD4DA` | bordas, grades, trilhos inativos |
| `--navy-2` | `#33546D` | só separadores na faixa navy de KPIs |

Contraste: **texto laranja só sobre navy ou em números grandes**. Em fundo claro, laranja é forma (chevron, losango, ponto, barra), nunca texto corrido.

Fonte: Archivo a 87,5% de largura (`--font`, `--stretch`), com fallback calibrado. Números tabulares em todo o slide.

| Classe | Tamanho / peso | Cor |
|---|---|---|
| `.hdr-title` | 34 px / 1,15 · 500 | navy |
| `.hdr-sub` | 19 px / 1,3 · 400 | azul aço |
| `.lbl` (rótulo de seção, caixa alta) | 14 px · 700 · +0,02em | navy (`.hint` em azul aço) |
| `.card-title` | 16 px · 700 | navy |
| `.card-text`, `.txt` | 15 px / 1,3 | navy |
| `.num`, `.card-num` | 22 px · 800 | laranja |
| `.kpi-num` + `.kpi-lbl` | 26 px · 800 laranja + 17 px branco | — |
| `.foot` | 12 px / 1,35 | cinza |
| `.txt-sm` | 13 px | — |

Caixa alta só em rótulos de seção. `.pipe` desenha a barra vertical fina de "Título | Complemento".

---

## 4. Componentes (snippets)

### 4.1 Cabeçalho, rótulo e rodapé
```html
<header class="hdr">
  <h1 class="hdr-title">Axon<span class="pipe" aria-hidden="true"></span>Proposta de Gestão de Mudanças</h1>
  <p class="hdr-sub">Do MVP ao hábito nas cinco gerências: o processo permanece, muda o como.</p>
</header>
<p class="lbl">Mito × Fato<span class="pipe" aria-hidden="true"></span><span class="hint">Vire a carta</span></p>
<footer class="foot">*Informado pelo time do produto, a validar. …</footer>
```

### 4.2 Faixa navy de KPIs (y 150–218, largura 50 → 1230)
```html
<div class="kpis">
  <div class="kpi"><span class="kpi-num">5 gerências</span><span class="kpi-lbl">PE • PR • PL • OS • PD</span></div>
  <div class="kpi"><span class="kpi-num">≥ 6 meses</span><span class="kpi-lbl">horizonte mínimo</span></div>
  <button class="kpi rv dot" data-reveal="R-01" data-pick="mvp;ambicao" data-label="MVP em produção*">
    <span class="kpi-num">MVP em produção*</span><span class="kpi-lbl">2 times pioneiros</span></button>
</div>
```
Variante empilhada (número acima do rótulo): `.kpi--stack`. Barra de ênfase 70/30: `<span class="emph-bar"><i></i><i></i></span>` (200 × 12, laranja/azul aço; sempre com o rótulo "ênfase indicativa, calibrada no diagnóstico").

### 4.3 Cards
```html
<div class="card card--row"><p class="card-title">O que permanece</p><p class="card-text">O macroprocesso…</p></div>
<div class="card card--num"><span class="card-num">01</span><div><p class="card-title">Diagnóstico</p><p class="card-text">…</p></div></div>
<div class="card card--bar card--num">…</div>        <!-- barra azul aço 4 px à esquerda (slide 5 da referência) -->
```
Variantes: `--row` (rótulo 170 px + texto), `--num` (número laranja à esquerda), `--bar` (barra azul aço), `--bar-orange`, `--white` (borda navy), `--navy` (texto branco).

### 4.4 Chevron e fluxo em etapas (slide 3 da referência)
```html
<i class="chev" aria-hidden="true"></i>            <!-- 12 × 18 laranja; .chev--sm 8 × 12; .chev--navy -->
<span class="gt" aria-hidden="true">›</span>        <!-- chevron tipográfico laranja, em linha -->

<div class="steps at" style="--x:50;--y:160;--w:1180;--h:170">
  <div class="step"><span class="step-head"><span class="num">01</span>Reconhecer</span><span class="step-body">Nomear o que termina…</span></div>
  <i class="chev" aria-hidden="true"></i>
  <div class="step">…</div>
</div>
```
Uma etapa pode ser gatilho: `<button class="step rv dot" data-reveal="R-13" data-pick="Reconhecer">…</button>` (use `<span>` dentro de `<button>`).

### 4.5 Tabela
```html
<table class="tbl">
  <thead><tr><th style="width:150px">Etapa</th><th>Entregáveis</th></tr></thead>
  <tbody><tr><td><span class="ck" aria-hidden="true"></span>M1–M2 Diagnóstico</td><td>…</td></tr></tbody>
</table>
```
Cabeçalho navy 14/700, linhas alternadas, grade `--line`, 1ª coluna em negrito. `.tbl--compact` para tabelas densas; `.ck` é o check laranja.

Linha clicável: **não** ponha `data-reveal` nem `role` no `<tr>` (apaga a semântica de linha e célula). Use `tr.rv-row` e um `<button class="rv-cellbtn" data-reveal="…" aria-label="M1–M2 · Diagnóstico: ver critério de aceite">` na 1ª célula. O motor abre a revelação ao clicar em qualquer ponto da linha, ancora o popover na linha inteira e mostra o foco/estado aberto na linha (`tr.rv-row:has(.rv-cellbtn:focus-visible)`, `tr:has([aria-expanded="true"])`).
```html
<tr class="rv-row"><td><button class="rv-cellbtn" data-reveal="#tpl-a6-aceite" data-row="1" data-label="Critério de aceite por etapa" aria-label="M1–M2 · Diagnóstico: ver critério de aceite"><span class="ck" aria-hidden="true"></span><span class="a6-et"><span class="a6-m">M1–M2</span>Diagnóstico</span></button></td><td>…</td></tr>
```

### 4.6 Painel de resultado, faixa navy e callout
```html
<div class="result at" style="--x:850;--y:240;--w:380;--h:390">
  <p class="result-lbl">Resultado a perseguir</p>
  <p class="result-main">Cada perfil executa as novas rotinas com autonomia…</p>
  <ol class="result-list"><li><span class="n">01</span>Adoção efetiva nas cinco gerências</li>…</ol>
</div>
<div class="band"><span class="band-lbl">Guardiões do Legado</span><div><p class="band-main">Quem conhece o legado valida o futuro.</p><p class="band-text">…</p></div></div>
<div class="callout"><p class="callout-lbl">Mudança oculta</p><p class="callout-text">Cada time passa a gerir o próprio orçamento de nuvem.</p></div>
```

### 4.7 Chips, selos e botões
```html
<span class="chip">Receio de perder posicionamento</span>   <!-- navy + ponto laranja -->
<span class="chip chip--light">…</span> <span class="chip chip--outline">…</span> <span class="chip chip--on-navy">…</span>  <!-- .chip--plain sem ponto -->
<span class="selo">ilustrativo</span>   <span class="selo selo--dark">dados reais a partir da linha de base</span>
<button class="btn btn--play">Rodar</button>   <button class="btn btn--ghost">Simule uma inquietação</button>
```
**Toda simulação leva `<span class="selo">ilustrativo</span>`.** Texto de componente no canvas tem no mínimo 12 px (selo, `flip-tag`, `gate-sub`, `rv-frame-k`, número no losango); as exceções são a marca, o número do slide (11 px) e a pílula de ênfase do TMO (10 px), fixadas pelo roteiro (§1.5–1.6). Não sobrescreva esses tamanhos no deck.

### 4.8 Indicador de clique (ponto laranja)
Adicione `dot` a qualquer elemento clicável grande (card, carta, faixa): ponto de 8 px no canto superior direito, que **pulsa uma vez** ao entrar no slide. Variantes: `.dot--tl` (canto esquerdo), `.dot--in` (centralizado à direita, para barras). Não use em links de texto (`.rv-link` já tem sublinhado pontilhado).

### 4.9 Losango de portão ◆
```html
<span class="diamond"></span>                                    <!-- 14 px laranja; --navy, --off, --lg (28 px) -->
<span class="diamond diamond--num"><span>2</span></span>           <!-- com número dentro -->
<button class="gate-mark" data-reveal="R-16" data-pick="◆2" aria-label="Portão ◆2: antes de cada onda">
  <span class="diamond diamond--num" aria-hidden="true"><span>2</span></span>Antes de cada onda</button>
```
O desenho já é o ◆: não repita o glifo "◆" no texto ao lado. Portão aberto ganha `.is-open` (brilho laranja) automaticamente.

### 4.10 Heatmap em três estados
```html
<div class="hm" style="grid-template-columns:230px 120px repeat(5,1fr)">
  <span class="hm-rowh">Perfil</span><span class="hm-rowh">Hipótese</span><span class="hm-colh">PE</span>…
  <button class="hm-rowh rv" data-reveal="R-07" data-pick="Operam rodadas">Operam rodadas e mantêm legados</button>
  <span class="hm-tag">Alta</span>
  <button class="hm-cell rv" data-reveal="R-14" data-label="Célula gerência × perfil" aria-label="PE × Operam rodadas: a mapear"></button>
  …
</div>
<div class="hm-legend"><span><i class="sw sw--map"></i>a mapear</span><span><i class="sw sw--hyp"></i>hipótese</span><span><i class="sw sw--val"></i>validado</span><span><i class="sw sw--act"></i>em ação</span></div>
```
Estados: sem atributo = "a mapear" (`#EDF2F7`, "?" automático se vazia); `data-state="hyp"` (azul aço); `data-state="val"` (navy); `.is-action` (contorno laranja). **Células por gerência nascem "a mapear"**; intensidade só por perfil e como hipótese. Gere as 35 células no `init` (ver §6) para não repetir HTML.

### 4.11 Cronograma M1…M6
```html
<div class="tl at" style="--x:50;--y:194;--w:750;--label:262px">
  <div class="tl-grid" aria-hidden="true"></div>
  <div class="tl-row"><span class="tl-label">Diagnóstico e linha de base</span><span class="tl-track"><span class="tl-bar" style="--s:1;--e:2"></span></span></div>
  <div class="tl-row"><span class="tl-label">Onda 0 · …</span><span class="tl-track"><button class="tl-bar tl-bar--orange" style="--s:2;--e:3" data-reveal="R-08" aria-label="Onda 0"></button></span></div>
  <div class="tl-row"><span class="tl-label">Passagens de bastão</span><span class="tl-track"><span class="tl-bar tl-bar--dashed tl-bar--more" style="--s:4;--e:6"></span></span></div>
  <div class="tl-axis"><span></span><span class="tl-ticks"><span>M1</span>…<span>M6</span></span><span class="tl-axis-cap">meses após o início</span></div>
</div>
```
`--s`/`--e` = mês inicial/final (M1 = 1). Cores: padrão navy, `--orange`, `--steel`, `--dashed` (passagens de bastão), `--more` (acrescenta "+"). **"M1–M6" = meses após o início, nunca calendário.**

### 4.12 Fio do axônio e impulso
```html
<div class="fiber at" style="--x:290;--y:300;--w:400">          <!-- horizontal; .fiber--v vertical; .fiber--thin 1,5 px -->
  <span class="node" style="--at:0"></span><span class="node" style="--at:50"></span><span class="node" style="--at:100"></span>
  <span class="impulse"></span>                                  <!-- ponto laranja 8 px, invisível até ser animado -->
</div>
```
`--at` = posição do nó em % do fio. `.fiber--thin` (1,5 px) vale para o fio horizontal e para o vertical (`.fiber--v.fiber--thin`). `.node.is-lit` acende o nó em laranja. Animação só-CSS: adicione `.is-running` ao `.fiber` (o impulso corre de 0 a 100% em `--dur`). Para trajetos reais, use `ctx.fx.travel` (§6.3).

### 4.13 Carta Mito × Fato (flip 3D)
```html
<div class="flip dot" data-label="Mito: vou perder meu posicionamento">
  <div class="flip-front"><span class="flip-tag">Mito</span><p class="flip-q">“Vou perder meu posicionamento.”</p></div>
  <div class="flip-back"><span class="flip-tag">Fato</span><div data-include="R-06" data-pick="1" data-part="back"></div></div>
</div>
```
- A carta precisa de **altura definida** (as faces são absolutas). Frente navy; `.flip--light` para frente clara.
- O motor dá `role="button"`, `tabindex`, `aria-pressed`, Enter/Espaço; vira em 500 ms (instantâneo em movimento reduzido). O **nome acessível é fixo** (`data-label` ou o texto da frente) e o verso vira a descrição (`aria-describedby`), então o leitor de tela não troca o nome ao virar.
- Dentro de um slide, **uma carta virada por vez** (ou por `.flip-group`); `data-flip-multi` num contêiner libera várias.
- Carta com controle dentro (ex.: `▶ Rodar` no card "O que muda"): o motor a transforma em `role="group"` e injeta um `<button class="flip-toggle">` sobre o ponto laranja (o estado `aria-pressed` fica nele). Clicar no controle **não** vira a carta; clicar no resto da carta, sim.
- **Verso de texto** (fórmula e fonte, resposta e evidência): um padrão único para os dois decks, definido no `base.css` — pares `<dl><dt>Fórmula</dt><dd>…</dd>…</dl>` (ou `data-include` da R-04/R-15), rótulo 12 px em caixa alta azul aço e valor **14 px** (piso para projeção). Não sobrescreva tamanhos no CSS do slide.
- O verso **não pode cortar**: o QA mede (`<id>-flip<n>.png`). Se não couber, use `.flip--grow`: o verso ganha altura automática e a linguagem do popover (fundo branco, borda navy de 3 px no topo, anel branco de 6 px e sombra) e fica por cima dos vizinhos — lê-se como elevação, não como falha de camada. `.flip--grow.flip--up` cresce para cima (última linha de uma grade). Prefira `.flip--grow` em todas as cartas de um mesmo grupo, para o estado virado ser igual em todas.
- No modo leitura/impressão o slide mostra a frente e o verso vai para o anexo.

### 4.14 Alternador segmentado (ex.: Hoje ⟷ Com Axon)
```html
<div class="seg" data-target="#a2-tempo" aria-label="Uma atividade em dois tempos">
  <button data-value="hoje">Hoje</button><button data-value="axon">Com Axon</button>
</div>
<div id="a2-tempo">
  <p data-when="hoje"><strong>Hoje:</strong> edita arquivos de definição › dispara a rodada › …</p>
  <p data-when="axon"><strong>Com Axon:</strong> ajusta parâmetros na tela › o pipeline orquestra › …</p>
</div>
```
O motor marca `aria-pressed`, põe `data-state="<valor>"` no alvo e `.is-on` nos `[data-when]` que casam (os outros ficam ocultos). Padrão = 1º botão (ou `data-default`). `data-default="none"` abre **sem** opção escolhida (ex.: seletor de perfil do B3): ponha no alvo um `[data-when="none"]` com a linha de apoio (ex.: "Escolha um perfil…"); ela não entra no anexo. Se o elemento `[data-when]` tiver `display` próprio no CSS do slide, declare-o só com `.is-on` (senão ele vence o `display: none` do motor). Para animar a troca, sobrescreva no CSS escopado (`#A2 [data-when]{…} #A2 [data-when].is-on{…}`) ou use `#a2-tempo[data-state="axon"] …`. Dispara `seg:change`. `.seg--on-navy` sobre fundo navy. O anexo lista todos os estados.

### 4.15 Portão (checklist)
Do roteiro (R-16), via popover: `data-reveal="R-16" data-pick="◆1"` (A: `◆1`–`◆3`; B: `G0`–`G4`). Portão próprio, num `<template>`:
```html
<template id="tpl-b1-plano" data-title="Plano Mestre">
  <div class="gate" data-gate="Plano Mestre">
    <p class="gate-head gate-head--plain"><span class="gate-code"><span class="gate-glyph">◆</span></span><span class="gate-name">Só avança quando os três apontam juntos</span></p>
    <ul class="gate-list">
      <li><label><input type="checkbox"><span class="gate-txt"><b>Produto</b> · o que o Axon já entrega, e quando</span></label></li>
      …
    </ul>
    <p class="gate-status" aria-live="polite"></p>
  </div>
</template>
<button class="gate-mark" data-reveal="#tpl-b1-plano" data-gate="Plano Mestre">…</button>
```
`.gate-head--plain`: código só com o glifo ◆ (sem o "·" antes do nome). Ao marcar **todos** os itens: `.gate.is-open`, o gatilho correspondente (`data-pick` ou `data-gate` iguais ao código, inclusive cartões fora do checklist, como os G0–G4 do B4) ganha `.is-open` e pulsa, o slide recebe `CustomEvent('gate:open', {detail:{gate, trigger}})` e o popover fecha sozinho em ~0,9 s (`data-gate-autoclose="false"` no gatilho desliga); se o foco estava no checklist, ele volta ao gatilho. O estado (incluindo `.is-open` dos gatilhos) zera ao reentrar no slide.

---

## 5. Revelações

### 5.1 Gatilhos
Qualquer elemento com `data-reveal` vira gatilho (o motor completa `role`, `tabindex`, `aria-expanded`, `aria-controls`, `aria-haspopup`). Prefira `<button>`.

```html
<button class="rv dot card" data-reveal="R-19">…</button>                      <!-- bloco clicável -->
<button class="rv-link" data-reveal="#tpl-a1-metodo">Método: ADKAR · Bridges · ondas com portões</button>  <!-- texto -->
```
`.rv` só zera o estilo de botão (não altera o componente que você combinar com ele); `.rv-link` é o link pontilhado.

| Atributo no gatilho | Efeito |
|---|---|
| `data-reveal="R-xx"` | conteúdo da biblioteca compartilhada (§5.3) |
| `data-reveal="#tpl-id"` | conteúdo de um `<template id>` **dentro do mesmo slide** |
| `data-pick` | seleção: chave(s) separadas por `;`, índice (`2`), filtro de deck (`@A6`), código de portão (`◆1`, `G3`) |
| `data-variant` | `A`, `B` ou `all` (padrão: o deck do slide; afeta R-14, R-16, R-18) |
| `data-part` | R-06: `front`/`back`; tabelas: nome de uma coluna (`Fórmula`) |
| `data-reveal-title` | título do popover para **este** gatilho (padrão: título da R-xx ou `data-title` do template). No anexo, gatilhos do mesmo conteúdo são mesclados; se os títulos próprios diferirem (ex.: "PE em três camadas", "PR em três camadas"), o anexo usa o título-base |
| `data-selo` | selo no cabeçalho (ex.: `ilustrativo`) |
| `data-w` | largura do popover (320–420; padrão por entrada) |
| `data-label` | rótulo do gatilho no **anexo** (leitura/impressão). Use em cards grandes. |

Popover: branco, borda superior navy de 3 px, sombra suave, 320–420 px, **sempre contido no canvas** e dentro das margens de 50 px; gatilhos na área de conteúdo (y ≥ 140) nunca abrem por cima do título; altura máx. 520 px com rolagem interna (esmaece a borda quando há mais; o foco vai para o corpo, que rola com ↑ ↓ PageDown Espaço), uma revelação por vez; fecha com Esc (devolve o foco), clique fora ou ×. Tab que sai do popover (pelo fim ou, com Shift, pelo início) fecha a revelação e segue a partir do gatilho. O foco volta ao gatilho de origem mesmo em revelação aninhada ou com gatilho virtual (`reveal.show`); `reveal.open(alvo, { returnFocus: el })` devolve o foco a outro elemento (ex.: cartões G0–G4 do B4, que abrem o checklist ancorado no losango) e marca nele `aria-expanded`.

### 5.2 Templates locais
```html
<template id="tpl-a3-guardioes" data-title="Guardiões do Legado" data-w="420" data-selo="">
  <p><strong>O que fazem:</strong> …</p>
  <div data-include="R-13" data-pick="Reconhecer"></div>             <!-- trecho da biblioteca dentro do template -->
  <p><button class="rv-link" data-reveal="R-09">Ver passagem de bastão</button></p>   <!-- link para outra revelação -->
</template>
```
- Id: `tpl-<slide>-<assunto>` em minúsculas (ex.: `tpl-b4-sinapse`).
- Só texto, listas, tabelas pequenas, portões (`.gate`), botões e links `data-reveal`. Nada de scripts **nem `style=""`** (exceto propriedades de componente, como `--at`).
- **Estilo do conteúdo:** o popover (`#rvpop`) e o anexo (`.annex`) vivem fora do slide, mas o motor os marca com `data-slide="A2"` (e `data-deck`). No CSS do deck, escreva `:is(#rvpop, .annex)[data-slide="A2"] .a2l { … }` (vale no popover e na leitura/impressão), ou `#rvpop[data-slide="A2"] …` / `.annex[data-slide="A2"] …` para um só dos dois. O build aceita esse escopo.
- Componentes prontos para revelações: `.rv-loop` (laço 2 × 2 com `.rv-loop-b`, `.rv-loop-b--navy` e chevrons `.rv-loop-up|down|back`, ver A2 e B2), `.rv-facts`, `.rv-steps` (o item aceita texto com `<strong>` em linha), `.rv-frames`, `.rv-ficha`, `.rv-flag`, `.rv-note`, `.rv-sub`, `.rv-k`. Parágrafos e blocos do popover já têm 8 px entre si (6 px no anexo), inclusive dentro de `data-include`.
- Composição da biblioteca: "mesma revelação de A2 + uma linha" = `data-include` + `<p>` extra.

### 5.3 Biblioteca R-01 … R-19 (`reveals-lib.js`, texto do roteiro §1.9)

| Código | Título | Seleção (`data-pick`) |
|---|---|---|
| R-01 | Evidências do MVP | `mvp`, `teste`, `ambicao`, `custo` (ex.: `mvp;ambicao` = versão curta) |
| R-02 | Por que mielina? | — |
| R-03 | Por que sistema nervoso? | — |
| R-04 | Fórmulas e fontes dos indicadores | nome do indicador (`Prontidão`, `Desvio de custo`…), `@A6`, `@B3`, `@B5`; `data-part="Fórmula"` ou `"Fonte"` |
| R-05 | Trilhas por perfil e prova de autonomia | `Construtor`, `Arquiteto de estudos`, `Executor`, `Consulta`, `Gestor de orçamento`, `Rede Sinapse`, `Liderança` |
| R-06 | Mito × Fato | `1`…`5` (o 5 só aparece no modo leitura, automaticamente); `data-part="back"` |
| R-07 | Três perguntas por perfil | início do nome do perfil (`Operam rodadas`, `Agentes do setor`…) |
| R-08 | Rodada espelho (protocolo) | — |
| R-09 | Passagem de bastão | — |
| R-10 | Radar de Inquietações | — |
| R-11 | Copiloto de parâmetros (selo "ilustrativo") | — |
| R-12 | Guia de Bolso do Axon | — |
| R-13 | 4R (Bridges aplicado) | `Reconhecer`, `Requalificar`, `Realocar`, `Reinventar` |
| R-14 | Ficha de impacto | — (no B mostra os campos laranja "legado relacionado · onda") |
| R-15 | Riscos de pessoas | início da hipótese (`Receio de perder`, `Quem não quer mudar`…) |
| R-16 | Portões | `◆1`, `◆2`, `◆3` (A) · `G0`…`G4` (B); sem seleção = todos do deck. Com um único portão, o título vira "Portão G3 · Desligamento" e o cabeçalho interno sai do popover |
| R-17 | RAID vivo | trecho do item (`Roadmap fora`, `Custo de nuvem`, `Dependências`…) |
| R-18 | Pautas de governança | `Semanal`, `Quinzenal`, `Mensal` (versão A ou B pelo deck) |
| R-19 | Axon Live (vitrine) | — |

Seleção sem correspondência gera `console.warn` (o QA conta avisos). Dados programáticos: `AxonReveals.row('R-05','Executor').cells`, `AxonReveals.rows('R-04','@B5')`, `AxonReveals.myth(2)`, `AxonReveals.gate('G3')`.

### 5.4 Trechos da biblioteca dentro do slide (`data-include`)
```html
<div class="flip-back" data-include="R-04" data-pick="Tempo por processo" data-part="Fórmula"></div>
<div data-when="executor" data-include="R-05" data-pick="Executor"></div>
```
Formato padrão no slide: compacto (sem título de linha quando há uma só). Force com `data-format="pop|compact|annex"`.

### 5.5 Anexo (modo leitura e impressão)
O motor monta sozinho, na ordem do DOM: cada `data-reveal` (sem duplicar o mesmo conteúdo), o verso de cada `.flip`, todos os estados de cada `.seg[data-target]`, itens "só no modo leitura" da biblioteca e:
- `data-annex="texto"` em qualquer elemento (ex.: botão de animação) → item com o rótulo do elemento;
- `<template class="annex" data-title="Rodada espelho (simulação)" data-selo="ilustrativo">…</template>` → bloco livre (use para "simulações viram três quadros estáticos numerados").
Fonte do anexo ≥ 15 px reais (o QA verifica).

---

## 6. JavaScript dos slides (`slides-A.js`, `slides-B.js`)

### 6.1 Registro
```js
AxonDeck.register('A1', {
  init(el, ctx)  { /* uma vez, no boot: gere DOM repetitivo, ligue eventos dos SEUS botões */ },
  enter(el, ctx) { /* a cada entrada: estado inicial + animação de entrada (pode ser async) */ },
  leave(el, ctx) { /* ao sair: limpe classes que você adicionou */ }
});
```
- Cada arquivo roda isolado (IIFE + try/catch): um erro seu é logado e não derruba o motor.
- Ordem do boot: injeta marca/número e `data-include` → **`init`** → aplica papéis ARIA e estados padrão (também ao DOM gerado no `init`) → fotografa o slide (base da leitura/impressão) → entra no slide inicial. Por isso: **DOM estrutural só no `init`**; `enter`/`leave` mudam apenas estado.
- `enter` deve definir o estado inicial (o motor já desvira cartas, volta alternadores ao padrão e zera portões a cada entrada).
- Ao entrar, o slide ganha `.is-active` (reinicia as animações CSS). Escreva o **estado final como estilo-base** e a entrada sob `.slide.is-active`:
  ```css
  #A6 .a6-ck { /* estado final */ }
  #A6.is-active .a6-ck { animation: a6Ck 300ms var(--ease-out) both; animation-delay: calc(var(--k) * 160ms + 400ms); }
  ```
  Assim, leitura, impressão e movimento reduzido mostram o estado final sem JS.

### 6.2 `ctx`
| Campo | Conteúdo |
|---|---|
| `ctx.id`, `ctx.el`, `ctx.deck`, `ctx.index` | identificação |
| `ctx.fx` | efeitos ligados a esta visita (cancelados ao sair; ver §6.3) |
| `ctx.signal` | `AbortSignal` da visita: `el.addEventListener('x', fn, { signal: ctx.signal })` |
| `ctx.on(alvo, tipo, fn)` | atalho que já usa o `signal` (só em `enter`) |
| `ctx.reveal` | `open(gatilho, {anchor, returnFocus})`, `show('R-01', âncora, {pick})`, `close()`, `isOpen()`, `reposition()`, `setTitle(texto)` (troca o título do popover aberto), `mark(seletor)` (destaca no popover aberto o trecho ligado ao gatilho, classe `.rv-mark`), `body` e `trigger` (do popover aberto) |
| `ctx.reduced` | `true` se o usuário pediu movimento reduzido |

Em handlers do `init` use `AxonDeck.fx` e `AxonDeck.reveal` (apontam sempre para a visita atual).

### 6.3 Efeitos (`fx`) — o impulso
Todos devolvem Promise. Ao sair do slide, as animações são canceladas, os impulsos voltam ao repouso e as Promises pendentes **nunca resolvem** (o código após o `await` simplesmente não roda; não precisa de try/catch). Em movimento reduzido, tudo vira troca instantânea.

| Método | Uso |
|---|---|
| `fx.travel(dot, [el \| {x,y}, …], {duration, easing, hide})` | o impulso percorre os centros dos elementos (ou pontos em px do contêiner do `dot`) |
| `fx.hop(dot, de, para, {height, duration})` | salto em arco (condução saltatória), 450 ms padrão |
| `fx.along(dot, svgPath, {duration, reverse, hide})` | percorre um `<path>` SVG |
| `fx.pulse(el, {size})` | um pulso laranja (anel) |
| `fx.light(lista, {stagger, cls})` | acende em sequência (`is-lit`, 150 ms) |
| `fx.show(el)` | entrada curta (opacidade + 6 px) |
| `fx.wait(ms)` | espera cancelável |
| `fx.center(el, ref)` | centro de `el` no sistema de `ref` (px de canvas) |

```js
AxonDeck.register('A1', {
  init(el) {
    const run = el.querySelector('.a1-run');
    run.addEventListener('click', async () => {
      const jobs = el.querySelectorAll('.a1-job');
      await AxonDeck.fx.travel(el.querySelector('.a1-jobs .impulse'), [...jobs], { duration: 1100, hide: true });
      AxonDeck.reveal.show('R-01', run);
    });
  },
  async enter(el, ctx) {
    const dot = el.querySelector('.a1-fiber .impulse'), nodes = el.querySelectorAll('.a1-fiber .node');
    await ctx.fx.wait(300);
    await ctx.fx.travel(dot, [...nodes], { duration: 700 });
    await ctx.fx.light(nodes);
  }
});
```
O `dot` deve ser um `.impulse` posicionado (absoluto) dentro do contêiner do trajeto. **Uma animação por vez por slide**, 300–700 ms, e só se ensina um mecanismo (roteiro §1.8).

### 6.4 Eventos no slide
`slide:enter`, `slide:settled` (a Promise do `enter` terminou; o slide ganha `data-settled`), `slide:leave`, `slide:step` `{step, total}`, `reveal:open` `{key, trigger}`, `reveal:close` `{silent}` (**sempre** emitido, também quando o motor fecha em silêncio ao trocar de slide, abrir outra revelação, a ajuda, a leitura ou a impressão: limpe ali os destaques ligados à revelação), `flip` `{flip, flipped}`, `seg:change` `{seg, value, target}`, `gate:check` `{gate, checked, total}`, `gate:open` `{gate, trigger}`, `gate:close` `{gate}`. No documento: `axondeck:change` `{deck, index, id}`.

```js
AxonDeck.register('A5', { init(el) { el.addEventListener('gate:open', (e) => { /* e.detail.gate === '◆1' … */ }); } });
```

### 6.5 Passos de build (→ dentro do slide)
`data-build="1"` (ou `"1 2"`) num botão do slide faz dele o passo 1 (e 2…) de build: → / Espaço / PageDown acionam (clicam) o passo seguinte e só no último vão ao próximo slide; ← volta um passo (o slide recomeça e os passos anteriores são refeitos). O motor conta os passos (`data-steps` no slide), desenha os traços sob o nódulo atual da barra-axônio, grava `?step=n` no endereço, mostra "passo n de N" no apresentador e sincroniza as duas janelas. Hook opcional `step(el, ctx)` com `ctx.step`. Botões de passo que animam devem **enfileirar** cliques recebidos durante a animação (ver A4 e B5). Hoje: A1 (▶ Rodar), A2 (Com Axon), A3 (faixa Guardiões), A4 (Simule ×2), B1 (Sincronizar), B2 (ondas, + onda), B5 (Solte ×3).

### 6.6 API global útil
`AxonDeck.go('B', 4)`, `next()`, `prev()`, `step(n)`, `current()`, `slide('A3')`, `gate.isOpen('A5','◆1')`, `gate.list('A5')`, `reducedMotion()`, `preparePrint({decks:'AB', notes:true})`, `buildAnnex('A2')`.

### 6.7 Sincronização com o apresentador
Cliques em `button`, `[role=button]` e `[data-reveal]` do slide **e do popover aberto** (ex.: as três chaves do B4) são repetidos na outra janela pela **posição** do elemento no slide ou no popover. Portanto: o mesmo HTML nas duas janelas (garantido) e **não crie/remova botões em `enter`** (gere no `init`). Efeitos disparados por cliques rodam nas duas janelas.

---

## 7. Escopo do CSS
- Todo seletor de `slides-A.css` começa por `#A1`…`#A6` (B: `#B1`…`#B6`) ou pelo escopo do conteúdo das revelações, `:is(#rvpop, .annex)[data-slide="A2"]` (§5.2). O build lista os que fogem.
- Nomes de `@keyframes` prefixados pelo slide (`a1In`, `b3Lit`) para não colidir.
- Não redefina tokens nem classes do `base.css` fora do escopo; para variar, combine com uma classe sua (`#A2 .a2-oculta .flip-front {…}`).
- Ids internos únicos no deck inteiro, prefixados (`a2-tempo`, `tpl-a2-ti`).
- Nada de fontes ou bibliotecas externas; ícones em SVG inline. Moldura escura (modo escuro) não afeta o canvas: não use `prefers-color-scheme` nos slides.

---

## 8. Integridade (inegociável) e linguagem
- Só os quatro dados do MVP, sempre com "informado pelo time do produto, a validar" (R-01). Nenhuma razão calculada ("x vezes").
- Nenhuma meta, economia, honorário, quantidade de pessoas, percentual de resultado ou data de calendário. M1–M6 = meses após o início.
- Indicadores = fórmula + fonte; linha de base e metas no diagnóstico. ≈70/30 sempre como "ênfase indicativa do esforço, calibrada no diagnóstico".
- Heatmap por gerência "a mapear"; painéis com "—" e o selo "dados reais a partir da linha de base". Simulações com selo "ilustrativo".
- Nenhum nome de pessoa; siglas PE/PR/PL/OS/PD sem significado; "Legado A" nas animações. Glossário evitar × preferir: roteiro §1.7.
- Português do Brasil impecável; aspas tipográficas “ ”; espaço inseparável em "~2&nbsp;h", "US$&nbsp;0,01".

---

## 9. QA (`tools/shoot.cjs`)

```bash
node tools/shoot.cjs <html> <saida> [--deck A|B|AB] [--only A3,B4] [--reveals] [--mobile] [--print] [--notes] [--offline] [--wait 2200]
```
| Saída | O que verificar |
|---|---|
| `<id>.png` | o slide fechado, depois de `slide:settled` e de ao menos `--wait` ms (padrão 2200, cobre o pulso dos pontos) |
| `overflow` | elemento fora do canvas 1280 × 720 |
| `clipped` | texto cortado (`cortado`: caixa com overflow oculto) ou transbordando a própria caixa (`transborda`: altura fixa pequena demais) |
| `overlap` | blocos irmãos com texto sobrepostos |
| `console` | erros de console e exceções (meta: zero) |
| `--reveals` | `<id>-rv<n>.png` (depois do evento `reveal:open`; popover contido, sem corte, 320–420 px, ≤ 520 px; gatilho não coberto; portão dispara `gate:open` ou já estava aberto na visita, `<id>-rv<n>-gate.png`), `<id>-flip<n>.png` (verso sem corte), `<id>-seg<n>.png` (estados do alternador) |
| `--mobile` | 390 × 844: entra em leitura, sem rolagem horizontal, anexo ≥ 15 px (`mobile-<deck>.png`, `-full.png`) |
| `--print` | `print-AB.pdf` (A e depois B), nº de páginas, `pdf-p-0n.png`, `print-slide*.png`, `print-annex*.png` |
| `--offline` | bloqueia o Google Fonts: confere que nada corta com a fonte de reserva (arquivo aberto sem rede). Rode ao menos uma vez antes de entregar. |

Marcações para o QA: `data-qa-overlap="ok"` num elemento que sobrepõe outros de propósito (ex.: portões sobre raias); `data-qa-ignore` para decoração que pode sair da caixa (`.sr-only` já é ignorado). Use com parcimônia e justifique no CSS.

**Checklist antes de entregar:** zero problemas no JSON, zero erros de console, PNGs revisados (inclusive revelações e versos), ≤ ~150 palavras visíveis por slide, nenhum dado fora do roteiro, notas e mensagem-chave em todos os slides, `data-emphasis` em todos os slides do B.
