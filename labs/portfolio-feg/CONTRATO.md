# Portfólio FEG — contrato de construção (v1 essencial)

Este arquivo manda **sobre** `docs/portfolio-feg-niveis.md` (a especificação validada) sempre que houver conflito.
A especificação continua sendo a fonte do **conteúdo**: dados de exemplo (§4), indicadores, perguntas, gabaritos e desafios.

## 1. Decisões de escopo da v1 (sobrepõem a especificação)

O pedido é um sistema **simples**, para pessoas que estão aprendendo. A especificação validada é ótima em conteúdo, mas traz infraestrutura que não ajuda a aprender. Na v1:

| # | Decisão | Efeito prático |
|---|---|---|
| D1 | **Sem alternância Trabalho × Referência** e sem `?ref=1` | Telas usam `PF.db()` (dados de trabalho, editáveis). Perguntas de análise/decisão usam `PF.base` (referência congelada) — o core já faz isso (`q.usaTrabalho` para exceções). Links `ver` apontam para a tela, sem `?ref=1` |
| D2 | **Sem "modo exercício" que oculta números** (§3.7 da spec) | Responder consultando o sistema **é** o aprendizado. Mantém-se só: na Triagem (N1) e no Gate (N2) a saída sugerida aparece **depois** de registrada a recomendação |
| D3 | Sem log em chave separada, sem `exercicioId`, sem detecção de conflito entre abas, sem importar progresso, sem autoteste na interface | O autoteste vira teste Node: `tests/unit/portfolio-feg-calc.test.js` |
| D4 | **Fora da v1** (citar em "Fontes e premissas → Próximas versões"): caminho crítico/CPM, opção real, HHI/concentração, "Simular promoção" de regra | Perguntas/telas que dependem só disso são removidas. AHP pode entrar como aba "Aprofundamento" no N3 se couber no orçamento de linhas |
| D5 | Desafios mantêm passos verificáveis, com gabarito calculado por `PF.calc` sobre `PF.base` (ou cópia alterada para variantes) | Nada de valores "fixos" que quebram quando a aprendiz edita o trabalho |
| D6 | Orçamento: `nivelN.js` ≤ 1.300 linhas; banco de perguntas pode ir para `perguntas-nN.js` | |
| D7 | Linguagem simples na tela. Códigos técnicos (`HIERARCHY_MISMATCH`…) só em tooltip (`PF.msgHtml`) | |
| D8 | Todo número/limiar/pergunta com badge de origem via `PF.badge('Rxx')` | Nenhum item é `FONTE_ONS` |

## 2. Arquivos e responsáveis

| Arquivo | Conteúdo | Dono |
|---|---|---|
| `src/core.js`, `src/styles.css` | Núcleo (layout, menu, rotas, perguntas, gráficos, PDF, dados) | núcleo estável; mudanças só com revisão de integração (ver "Ajustes da integração final") |
| `src/data.js` | `PF.base` completo (§4 da spec) | etapa Dados |
| `src/calc.js` | `PF.calc` — funções **puras** de todos os indicadores dos 3 níveis | etapa Dados |
| `src/globais.js` | Telas globais: Dashboard, Indicadores, Inventário, Decisões, Fontes e premissas (+ Glossário) | etapa Globais |
| `src/nivel1.js` + `src/perguntas-n1.js` | Nível 1 · Partitura · Fundamentos | construtor N1 |
| `src/nivel2.js` + `src/perguntas-n2.js` | Nível 2 · Arranjo · Priorização | construtor N2 |
| `src/nivel3.js` + `src/perguntas-n3.js` | Nível 3 · Regência · Otimização | construtor N3 |
| `build.mjs` | Gera `public/portfolio-feg.html` (arquivo único) | integração |

Ordem de carga (index.html e build): `logos → core → data → calc → globais → nivel1 → perguntas-n1 → nivel2 → perguntas-n2 → nivel3 → perguntas-n3 → PF.start()`.
`perguntas-nN.js` roda depois de `nivelN.js`: anexe com `PF.level(N).questions.push(...lista)`.

## 3. API do núcleo (resumo — leia `src/core.js`)

### Níveis
```js
PF.registerLevel({
  id: 1, nome: 'Partitura · Fundamentos', subtitulo: 'Ler o portfólio',
  pergunta: 'O que temos, como está e o que pede atenção neste mês?',
  objetivos: ['...'], unlock: { minPct: 70, desafio: true },
  screens: [{ id:'saude', titulo:'Saúde & Prazos', icone:'gauge', grupo:'A · Escolher' /*opcional*/, escreve:true /*mostra selo de exercício*/,
              render(el, ctx){ /* ctx = {dados:PF.db(), base:PF.base, nivel, go, refresh, st:PF.modState(nivel), route:{nivel,screen,query}} */ } }],
  questions: [ /* ver abaixo */ ],
  desafio: { titulo, descricao, render(el, ctx, done){ /* done({ok:true|false, nota:0..100, detalhe}) */ } },
});
```
O core cria sozinho a tela **Trilha do nível** (`#/nN/trilha`, abas `?aba=perguntas|desafio|dominio`). Rotas `#/nN/perguntas` e `#/nN/desafio` são aliases.
Abas internas de uma tela: use `PF.ui.tabs('#/n1/saude', [['sinal','Sinal'],['prazos','Prazos 30/60/90']], ctx.route.query.aba || 'sinal')`.

### Telas globais e registros compartilhados
```js
PF.registerGlobal({ id:'dashboard', titulo:'Dashboard', icone:'dashboard', ordem:1, render(el, ctx){} });   // #/dashboard
PF.registerGlobal({ id:'fontes', titulo:'Fontes e premissas', icone:'info', ordem:90, rodape:true, render });  // substitui a tela padrão
PF.registerDash({ nivel:1, ordem:10, render(d){ return html; } })        // blocos do Dashboard (aba do nível); d = PF.db()
PF.registerKpi({ id:'I1.4', nivel:1, nome:'% do orçamento em vermelho', unidade:'%', essencial:true, regra:'R13',
  valor:d=>number|null, fmt:v=>string, formula:'Σbac(vermelhas)/Σbac(em execução)', conta:d=>'(1,50 + 1,40) ÷ 6,60 = 43,9%',
  interpretacao:'...', armadilha:'...' })
PF.registerFichaTab({ id:'sinal', nivel:1, titulo:'Sinal', ordem:20, render(ini, d){ return html; } })   // abas da ficha da iniciativa (Inventário)
PF.registerGlossario(1, [{ termo:'Baseline', def:'...' }])
PF.registerConfigCard({ render(el){ el.innerHTML = '...'; } })
```
O Dashboard (globais.js) mostra **uma aba por nível liberado** com os blocos `PF.dash` daquele nível. Indicadores (globais.js) lista `PF.kpis` com nível ≤ nível atual.

### Dados
- `PF.base` — referência congelada (deepFreeze em `PF.start`). **Nunca mutar** (nem `.sort()` direto: use `.slice().sort()`).
- `PF.db()` — trabalho (cópia editável persistida). `PF.resetDb()`.
- `PF.write(colecao, id, patch, {justificativa})` → `{ok, errors:[{campo,codigo,msg}]}`; valida, grava `historico` por campo, `rowVersion++`.
- `PF.append(colecao, registro)` → registro com `id`, `registradoEm`, `usuarioId`, `simulacao:true` (decisoes, pendencias, avaliacoes, snapshotsForum, medicoesBeneficio…).
- `PF.arquivar(id, justificativa)` (≥ 10 caracteres). Não existe excluir.
- `PF.validar(colecao, obj)`; `PF.msg(codigo, ctx)` / `PF.msgHtml(codigo)`; `PF.hash(obj)` (FNV-1a).
- `PF.regra('R13')` → parâmetro vigente (do trabalho; `{base:true}` para referência). `PF.badge('R13' | 'ILUSTRATIVO' | {origemRegra,tipoFonte,referencia})` → badge clicável que abre a ficha da regra.

### Interface e gráficos
`PF.ui.{pageHead, section, kpi, pill, tag, badge, callout('conceito'|'dica'|'atencao', html, titulo), table({cols, rows, id, rowAttr}), tabs, seloExercicio}`,
`PF.modal(html,{wide})`, `PF.confirm(titulo, html, okLabel, onOk)` (nunca use `window.confirm/alert/prompt` — bloqueados em visualizadores), `PF.toast`, `PF.patch(root, sel, html)` (atualização parcial em eventos `input` contínuos; `PF.refresh()` só em `change`/clique),
`PF.charts.{hbar, bars, donut, stack, bubble, gauge, line, heat, legend, niceMax}`, `PF.pdfButton()` (o core liga o clique e exporta a tela), `PF.icon(nome)`.
Classes CSS úteis: `.grid .g2 .g3 .g4 .g-auto .card .card.hl .stack .row .spacer .chip(.on) .field .input .select .filters .tbl .meta-line .lime .muted .dim .num`.

### Perguntas (formato)
```js
{ id:'N1-C01', titulo:'Curto para a lista', tipo:'conceito'|'analise'|'decisao', formato:'mc'|'num'|'pick'|'multi'|'decisao'|'custom',
  enunciado:'...' | d=>html, contexto: d=>html, regra:'R30', conceito:'Portfólio', ver:'#/n1/saude?aba=sinal', dica:'(mostrada ao errar)',
  justificativa: '...' | (d, resposta)=>html,      // aparece só ao acertar ou ao revelar
  alternativas:[{id:'A', texto:'...'}, ...], correta:'C',                      // mc (ids estáveis; o core embaralha a exibição)
  opcoes: d=>[{id,label}], correta: d=>id,                                     // pick
  opcoes: d=>[{id,label}], corretas: d=>[ids],                                 // multi
  calc: d=>number, tolerancia: 0.5 | {rel:0.02}, unidade:'%', casas:1,         // num
  itens: d=>[{id,label,sub,cols:{fte:1.5,custo:0.8,n:1}}], colunas:[{key,label,fmt}], limites:[{key,label,max,casas}], totais:[{key,label}],
  preSel:['P01'], fixos:['P01'], avaliar:(selIds,d)=>({ok, nota, feedback}), gabarito: d=>html,   // decisao
  render(el, d, answer){ /* answer(ok, valor) */ }, renderDone(el, d, rec), gabarito: d=>html,   // custom
  aprofundamento:false, conferirFonte:false, usaTrabalho:false }
```
Comportamento (core): errar **não** revela a resposta (mostra `dica`); "Ver resposta" pede confirmação e retira o crédito; acerto mostra a justificativa.
Use o modelo de justificativa da spec para perguntas de análise: **Resposta · Como calculei · Leitura · Cuidado · Próximo passo**.

### Ajustes da integração final (core e globais)
- **Badges:** quando a regra tem `contradicao:true`, o badge é "A validar FEG · fontes em conflito" (§2.2, regra 1). `marca` (ex.: R07, R24) acrescenta o selo "Ilustrativo". Referência com vários slides vira `s143…`, e a lista completa fica no tooltip.
- **Perguntas:**
  - `dicas:{A:'…'}` (ou `d=>({…})`, ou `dica` na opção do `pick`) dá a dica da alternativa errada escolhida. Nunca escreva dica para a correta;
  - `alternativas` pode ser uma função de `d`;
  - `onAnswer(ok, val, d, rec)` é um gancho chamado depois de cada resposta;
  - o campo `num` é texto e aceita vírgula ou ponto.
- **Modais:**
  - `PF.confirm` abre por cima do modal aberto e fecha só a si mesmo;
  - Escape fecha o modal de cima;
  - navegar (`hashchange`) fecha os modais.
- **PDF:** o botão `PF.pdfButton` mostra antes o aviso `RULE_NOT_VALIDATED`, com as regras a validar citadas na tela (`PF.regrasAValidar(el)`). O rodapé traz a data de referência e `PF.versaoParametros()`.
- **Registros:**
  - `PF.write` grava `operacao:'ALTERACAO'` no histórico;
  - em `PF.append`, `registradoEm`, `usuarioId` e `simulacao:true` vêm sempre do core.
- **Tabelas:** `PF.ui.table` aceita `labelHtml` na coluna.
- **Gráficos:** `bars`, `line` e `bubble` sem formatador próprio escolhem divisões com rótulos exatos.
- **Ficha da iniciativa:** `PF.abrirFicha(id, aba, {pendencia:{tipo, campo}})` abre direto no formulário de pendência.

## 4. Como testar (cada construtor)
1. `node --check` nos seus arquivos.
2. Playwright (Chromium já instalado; `require(execSync('npm root -g').toString().trim()+'/playwright')`) abrindo `file:///home/user/Gestaodeportifolioons/labs/portfolio-feg/index.html#/...` com **modo instrutor** (`localStorage` ou tela Configurações) e `page.on('pageerror')`/`console.error`.
3. Erros vindos de arquivos que não são seus: relate, não corrija.
4. Screenshots em 1440×900 e 390×844 (sem rolagem horizontal) no seu diretório temporário.
5. Para cada pergunta de análise/decisão: confira por script (`page.evaluate`) que o gabarito calculado bate com a spec.
