# Maestro · Portfólio FEG: trilha de gestão de portfólio em 3 níveis

**Especificação final validada · v1.0 · data de referência do gabarito: 03/10/2026**

Este documento é autocontido e permite construir o app nível por nível. O app se destina a 3 analistas da FEG (Gerência de Governança e Estratégia de Ferramentas Eletroenergéticas do ONS) que estão aprendendo gestão de portfólio.

Três avisos valem para o documento inteiro:
- **Nada aqui é regra ONS aprovada.**
- **Todos os dados de iniciativas são fictícios.**
- O conteúdo do Deck A&M "Etapa 3: Desenho do novo modelo organizacional" v25 é **proposta de consultoria** e aparece sempre como "a validar pela FEG". Pesos, limiares e taxonomias também são **a validar pela FEG**.

---

## 0. Resumo

| Item | Definição |
|---|---|
| Produto | Aplicação web de arquivo único (`public/portfolio-feg.html`), offline, sem backend, em pt-BR, na paleta Maestro/ONS. É gerada por `node labs/portfolio-feg/build.mjs` sobre o core que já existe em `labs/portfolio-feg/src/core.js` |
| Menu | Início · **Dashboard** · **Indicadores** · Inventário · Decisões (globais), mais um grupo por nível |
| Níveis | **N1 Partitura · Fundamentos**: ler o portfólio. **N2 Arranjo · Priorização**: escolher o que cabe e acompanhar. **N3 Regência · Otimização**: decidir com robustez. Cada nível é um módulo que se desbloqueia e se soma ao anterior |
| Perguntas e respostas | 76 perguntas: N1 23, N2 28, N3 25. Contam para o desbloqueio 72 delas: N1 23, N2 27, N3 22. As demais são "aprofundamento" ou dependem de conferir a fonte |
| Tipos de pergunta | conceituais (com alternativas, resposta e justificativa); análise do portfólio (com regra de cálculo); decisão de escolha (com cenário, restrição e feedback) |
| Conjunto de exemplo | 22 iniciativas fictícias, sobre a estrutura proposta da FE: 4 gerências, 10 comunidades, 13 squads |
| Status desta versão | As três críticas adversariais (pedagogia, fidelidade ao ONS e viabilidade/UX) foram aplicadas. A rastreabilidade de cada uma está na §10 |

---

## 1. Visão geral, princípios e glossário mínimo

### 1.1 Produto

| Item | Definição |
|---|---|
| Nome | **Maestro · Portfólio FEG: Trilha** (`PF.APP_NAME = 'Portfólio FEG'`) |
| Público | 3 analistas da FEG que vão ocupar papéis do Pool de Recursos de Governança. Todas fazem quase tudo hoje |
| Natureza | **Camada estratégica e gerencial** em modo de **exercício**. Tarefas, sprints, chamados e horas ficam no Azure DevOps, Jira, GitHub Projects ou ITSM; contratos ficam no ERP. A iniciativa guarda só `linkOperacional` (URL fictícia em domínio `.invalid`) |
| Persistência | `localStorage['portfolio-feg-v1']` guarda o estado. `localStorage['portfolio-feg-v1-log']` guarda os registros append-only por exercício. Essas chaves não colidem com `portfolio_fe_initiatives` nem com `afinacao-feg-v1`. Toda leitura e escrita fica em try/catch; sem armazenamento, o app roda em memória e avisa |
| Paleta e tipografia | Tokens do core: grafite `#54575C`/`#4A4D52`/`#404347`, tinta `#2C2E31`, oliva `#AEAB33`, lima `#D3CE22`, papel `#F2F2F2`, branco. Outfit e Inter carregam de forma **não bloqueante**, com fallback `system-ui` |
| Acessibilidade | O sinal calculado (RAG) sempre aparece com texto e ícone, nunca só com cor. Gráficos têm tabela equivalente ao lado. Mensagens de validação usam linguagem simples e deixam o código técnico no tooltip |
| Data de referência | 03/10/2026, fixa para o gabarito (parâmetro R07, com selo ILUSTRATIVO ao lado). É possível "usar a data de hoje"; nesse caso o app avisa que o gabarito deixa de valer |

### 1.2 Princípios obrigatórios

| # | Princípio | Como o app aplica |
|---|---|---|
| P1 | Não inventar regra ONS | Nenhum item recebe hoje `FONTE_ONS`. Esse rótulo exige documento ONS aprovado e citado (§2) |
| P2 | Distinguir sempre a origem | Todo número, limiar, pergunta e opção de decisão leva badge de origem e "ficha da regra" (§2.3) |
| P3 | Preservar histórico e rastreabilidade | Arquivar em vez de apagar. Decisões, histórico, avaliações, medições e fotografias são append-only. Correção sempre é um novo registro. O reset não apaga o log (§3.9) |
| P4 | Score e pesos não são regra oficial | Pesos versionados e rotulados "a validar". A fotografia do ciclo congela a versão usada. Não há índice agregado de "saúde do portfólio" |
| P5 | O app não substitui as ferramentas de execução | Sem tarefas, sprints nem chamados. O caminho crítico é só em nível de marco. Demandas aparecem como espelho, com link obrigatório ao registro de origem |
| P6 | Dados fictícios e rotulados | Todo registro de `PF.base` tem `ilustrativo:true`. Títulos terminam em "(fictício)". Há faixa fixa "Dados fictícios para aprendizagem" e marca d'água nos PDFs |
| P7 | A decisão é humana | O otimizador e o score **apoiam**. O app nunca decide nem muda o status sozinho |
| P8 | O PMO consolida, recomenda e escala; a instância decide | Toda decisão registrada pela analista tem `papelRegistrante` e `instancia` diferentes e `recomendacao:true` quando a RACI não lhe dá o "A" |
| P9 | Simplicidade progressiva | No máximo 3 conceitos novos por tela. Cada tela tem "aula rápida" de até 120 palavras. Técnicas pesadas são "aprofundamento" e não contam para o desbloqueio |
| P10 | O exercício nunca se confunde com documento oficial | Ciclo "Ciclo Exemplo 2027 (ILUSTRATIVO)", fóruns "[Simulado]", selo "Exercício: registro simulado, sem efeito oficial", marca d'água e autor "Aprendiz (perfil local)" no PDF |

### 1.3 Os três módulos

| Nível | Módulo | Pergunta-guia | Prática que o nível treina (referência do deck, proposta) | Artefato entregue | Carga sugerida (a validar) |
|---|---|---|---|---|---|
| N1 | **Partitura · Fundamentos** | "O que temos, como está e o que pede atenção neste mês?" | Leitura do inventário; admissibilidade de demandas, que adapta a triagem s142/s143 ao portfólio; insumo do Fórum de Acompanhamento de Portfólio (mensal, s129) | Inventário com pendências, sinal calculado × declarado, recomendações de triagem, rascunho de pauta por exceção | 6–8 h |
| N2 | **Arranjo · Priorização** | "O que fazer primeiro, cabendo na capacidade, e como acompanhar?" | Seleção da carteira para o Fórum de Planejamento do Portfólio (s127) e o Fórum de Planejamento e Evolução (s128); Fórum de Acompanhamento conduzido (s129). O exercício de gate usa Stage-Gate (referência de mercado) | Proposta de carteira, recomendações de gate, fotografia FECHADA do fórum simulado de outubro | 10–12 h |
| N3 | **Regência · Otimização** | "Qual a melhor combinação, quanto custam nossas políticas e a escolha se sustenta?" | Planejamento do Portfólio (s127): balancear, definir diretrizes de capacidade. Saídas do s128: mapa de dependências e registro de decisões de priorização | Recomendação de carteira do Ciclo Exemplo 2027, com custos das políticas, cenários, sensibilidade, benefícios e fotografia do ciclo com pesos congelados | 10–14 h |

### 1.4 Validação dos níveis

| # | Critério | Verificação | Resultado |
|---|---|---|---|
| V1 | Progressão cognitiva (Bloom revisada) | N1 identificar, classificar, calcular, ler → N2 aplicar, comparar, selecionar → N3 avaliar, otimizar, testar, justificar | Atende |
| V2 | Dados cumulativos | Um único conjunto de 22 iniciativas; N2 e N3 só acrescentam campos e entidades | Atende |
| V3 | Utilidade autônoma | Cada nível entrega um artefato usável (§1.3) | Atende |
| V4 | Carga cognitiva | Até 3 conceitos novos por tela; telas densas divididas em abas; N1 com 3 telas próprias e 4 globais; N2 dividido em "Escolher" e "Acompanhar"; N3 com 5 telas e técnicas de aprofundamento fora da nota | Atende |
| V5 | Matemática gradual | N1: contagem, %, mediana, meses de calendário. N2: soma ponderada, razões, enumeração, EVM básico. N3: multirrestrição, Pareto, sensibilidade; AHP, CPM e opção real só como aprofundamento | Atende |
| V6 | Ancoragem em prática real | Cada nível prepara um fórum ou exercício ligado ao deck, rotulado como proposta | Atende |
| V7 | RACI respeitada | Aviso de RACI conforme o contexto; o PMO registra recomendação. A RACI reconstruída fica "a conferir" e não reprova ninguém | Atende |
| V8 | Fronteira do sistema | Sem gestão de tarefas; demandas como espelho; CPM só com marcos | Atende |
| V9 | Avaliação verificável | Erro não revela a resposta; "ver resposta" retira o crédito; alternativas embaralhadas; desafios com variantes não exibidas na tela; autoteste | Atende |
| V10 | Rotulagem | 100% dos parâmetros com uma única `origemRegra`, `tipoFonte` e `referencia`; nenhum `FONTE_ONS` | Atende |
| V11 | Construtibilidade | Core existente mais 7 arquivos, cada um com até 1.300 linhas (§3.1) | Atende |

**Espiral de temas** (cada tema volta com mais profundidade):

| Tema | N1 Partitura | N2 Arranjo | N3 Regência |
|---|---|---|---|
| Status | Sinal calculado × declarado; Cinza; previsão vencida | EVM básico (SPI, CPI, EAC); EAC × previsão declarada | — |
| Risco | Riscos e impedimentos abertos pelos literais do repositório; vencidos | P×I das candidatas; R ≥ 15 sem mitigação; exposição | Concentração: fornecedor (HHI), pessoa-chave, classe de sourcing |
| Dependência | Lista "quem bloqueia quem" | Bloqueio na pauta do fórum | Restrição lógica de seleção; caminho crítico (aprofundamento) |
| Capacidade | (não entra) | Demanda × oferta, discricionária, faixa agregada (s165) | Capacidade por gerência, reserva (s166), valor marginal |
| Mix | Distribuição descritiva | Índice D contra o alvo | Restrição D ≤ tolerância e seu custo; horizontes H1/H2/H3 |
| Benefício | Texto do benefício esperado | KPI exigido no gate | Trajetória, realização e linha de base sem dupla contagem |
| Decisão | Recomendação de triagem (5 saídas) | Recomendação de gate (5 saídas) + escalonamento | Recomendação do ciclo: núcleo, condicionais, habilitadora, Recycle |

### 1.5 Glossário mínimo (todos os níveis)

| Termo | Definição didática |
|---|---|
| Portfólio | Projetos, programas e operações gerenciados em conjunto para atingir objetivos estratégicos ("fazer as coisas certas") |
| Programa / Projeto | Programa: projetos relacionados, coordenados para gerar benefícios conjuntos. Projeto: esforço temporário com entrega única ("fazer certo as coisas") |
| Iniciativa | Unidade do portfólio no app: projeto, programa, evolução ou PoC. Não é tarefa nem chamado |
| Demanda | Pedido ainda não decidido. No app é um espelho do registro de origem (ITSM ou ADO) |
| Baseline (data planejada) | Referência aprovada de prazo e custo. Sem baseline não há sinal confiável |
| Sinal calculado (RAG) | Verde, Amarelo, Vermelho ou Cinza por regra didática (a validar). Comparado ao sinal declarado |
| Status melancia | Declarado verde, calculado vermelho |
| BAC / AC | BAC: orçamento total da iniciativa. AC: custo realizado até a data |
| % físico | Avanço físico informado (real) ou planejado até a data |
| pp | Ponto percentual: diferença entre duas porcentagens |
| FTE / HC | FTE: equivalente em tempo integral (capacidade). HC: pessoa no quadro |
| Data de referência | Data em que o retrato é calculado (03/10/2026 no gabarito) |
| 30/60/90 | Faixa de entrega pela data prevista em relação à data de referência |
| Risco × impedimento | Risco: algo que pode acontecer. Impedimento: algo que já trava a iniciativa |
| Fotografia (snapshot) | Retrato do portfólio na data de corte de um fórum. Depois de FECHADA, não muda |
| Recomendação | Decisão registrada pela analista para a instância decidir |
| Rótulo de origem | Proposta A&M a validar · A validar FEG · Decisão de produto (DFP) · Ilustrativo · Fonte ONS (só com documento aprovado) |

Glossários por nível: §8.3.

---

## 2. Rótulos de origem e regras de exibição

### 2.1 Modelo de rótulo (compatível com o repositório)

| Atributo | Valores | Regra |
|---|---|---|
| `origemRegra` | `FONTE_ONS` \| `DECISAO_FUNCIONAL_PRODUTO` \| `A_VALIDAR_FEG` | Os únicos três valores do CHECK de `0003`. Uma única origem por regra |
| `tipoFonte` (EXT) | `DOCUMENTO_ONS_APROVADO` \| `PROPOSTA_CONSULTORIA` \| `COMENTARIO_REVISAO` \| `ARTEFATO_INTERNO` \| `REPOSITORIO` \| `REF_MERCADO` \| `PREMISSA_ILUSTRATIVA` | Obrigatório. `FONTE_ONS` só é aceito com `DOCUMENTO_ONS_APROVADO` e referência completa (documento, versão, data e trecho); fora isso o app mostra `RULE_NOT_VALIDATED`. **Nenhum item atende hoje** |
| `statusValidacao` | `A_VALIDAR` (default do repositório). `VALIDADO` e `SUBSTITUIDO` são extensões propostas pelo produto ao repositório; `0003` só define o default | Na trilha, `VALIDADO` só existe como **simulação** (§2.5). `SUBSTITUIDO` marca versão anterior de parâmetro (ex.: pesos v1 depois de criada a v2) |
| `referencia` | Ex.: "Deck A&M Etapa 3 v25, s129 (proposta de consultoria, não aprovada)", "migration 0014", "PMI: EVM" | Obrigatória para todo item. Quando o item é RACI ou quadrante do s168, inclui "reconstrução a partir do texto extraído; conferir no slide original" |
| Marcas visuais | `ILUSTRATIVO`, `SIMULAÇÃO`, `REF. DE MERCADO` | Não são valores do CHECK; são só marcas de interface |

### 2.2 Regras de atribuição (precedência, de cima para baixo)

1. **Há contradição entre fontes?** → `A_VALIDAR_FEG`, e o app mostra as duas fontes sem escolher entre elas. Ex.: periodicidades do s127 × s205; papel do PMO no s143 × s149.
2. **Parâmetro numérico ou regra usada em cálculo sem documento ONS aprovado** → `A_VALIDAR_FEG`, com referência ao slide se vier do deck. Ex.: faixas 75/90/100% do s165, reserva de 15% do s166, 70/20/10 do s209.
3. **Afirmação descritiva do deck** (estrutura, papéis, fóruns, RACI, catálogo de ferramentas) → `A_VALIDAR_FEG` + `PROPOSTA_CONSULTORIA` + slide. Badge: **"Proposta A&M v25 · sNN · a validar FEG"**.
4. **Comentário de revisão do deck** (rascunho não consolidado) → `A_VALIDAR_FEG` + `COMENTARIO_REVISAO`. Badge: **"Rascunho de revisão · a validar FEG"**. O app não mostra nomes de pessoas.
5. **Mecânica implementada no repositório ou escolha de projeto da trilha** → `DECISAO_FUNCIONAL_PRODUTO`. Vale para hierarquia, arquivar, 30/60/90, fotografia imutável, avaliação append-only, `rowVersion`, normalização e desempate.
6. **Fórmula de mercado** (EVM, AHP, Spearman, Pareto, CPM, HHI) → `DECISAO_FUNCIONAL_PRODUTO` + marca REF. DE MERCADO.
7. **Conteúdo de artefato interno** (naipes do Afinação FEG, `public/afinacao-feg.html`) → `A_VALIDAR_FEG` + `ARTEFATO_INTERNO`.
8. **Dados de iniciativas, valores, datas, notas, pessoas e fornecedores** → marca ILUSTRATIVO.
9. **Fonte ONS** → só com documento ONS aprovado. Hoje não existe nenhum item.

### 2.3 Badges exibidos e quando aparecem

| Badge | Combinação | Visual | A partir de |
|---|---|---|---|
| Proposta A&M v25 · sNN · a validar FEG | `A_VALIDAR_FEG` + `PROPOSTA_CONSULTORIA` | contorno lima, texto grafite | N1 |
| A validar FEG | `A_VALIDAR_FEG` + premissa, artefato interno ou contradição | fundo lima, texto grafite | N1 |
| Decisão de produto (DFP) | `DECISAO_FUNCIONAL_PRODUTO` | fundo oliva, texto grafite | N1 |
| Ilustrativo | marca | cinza pontilhado | N1 |
| Exercício: registro simulado | marca, em toda tela que escreve | faixa grafite com texto lima | N1 |
| Rascunho de revisão · a validar FEG | `A_VALIDAR_FEG` + `COMENTARIO_REVISAO` | contorno lima tracejado | N2 |
| Ref. de mercado | marca | texto discreto "Ref.: PMI…" | N2 |
| Fonte ONS · documento aprovado | `FONTE_ONS` + `DOCUMENTO_ONS_APROVADO` | fundo grafite, texto branco | Sem itens; existe só no Painel de Regras e no N1-C09 |

`q.regra` (código da regra, ex.: `'R05a'`) é resolvido por `PF.badge()`. Nenhuma pergunta grava a string de origem diretamente.

### 2.4 Onde o rótulo é obrigatório

1. Faixa fixa do core: "Dados fictícios para aprendizagem".
2. Linha de metadados em toda tela com número: `Data de referência 03/10/2026 (ilustrativa) · Parâmetros v1 · Dados ilustrativos · [Trabalho | Referência]`.
3. Badge em todo KPI, limiar, pergunta e opção de decisão. O botão **ⓘ Ficha da regra** mostra origem, tipo de fonte, status, versão, referência, fórmula, parâmetros usados e data do dado.
4. Cards derivados do sinal calculado levam o selo **"Regra didática a validar: não usar em reporte"**.
5. **Selo "Exercício: registro simulado, sem efeito oficial"** em toda tela que grava em `decisoes`, `snapshotsForum`, `historico`, `avaliacoes`, `medicoesBeneficio` ou `pendencias`, ou que gera PDF. São elas: Inventário (editar, arquivar, pendência), Triagem, Decisões, Dashboard (rascunho de pauta), Pontuação, Capacidade & Seleção, Exercício de Gate, Fórum Mensal, Otimizador, Cenários, Sensibilidade & AHP, Benefícios e Planejamento do Ciclo.
6. Toda decisão grava `simulacao:true`. Em listas, PDF e JSON aparece com o prefixo **[SIMULAÇÃO]**.
7. Não existe "índice de saúde do portfólio" agregado (princípio da migration `0011`, linha 61). O sinal é por iniciativa e sempre mostra o motivo da cor.
8. **"Exportar exercício (PDF)"** mostra antes o aviso `RULE_NOT_VALIDATED`, com a lista das regras a validar usadas. O PDF leva marca d'água em todas as páginas e rodapé com rótulos, versão dos parâmetros e data de referência (§3.9).

### 2.5 Promoção de regra: só simulada

- No app **não existe promoção real.** O Painel de Regras oferece **"Simular promoção"**:
  - grava um registro com `simulacao:true`;
  - mostra o badge "VALIDADO (simulação local, sem efeito oficial)" ao lado da origem original;
  - em PDF e JSON a origem original continua visível.
- **É proibido** rebaixar `A_VALIDAR_FEG` para `DECISAO_FUNCIONAL_PRODUTO` dentro do app.
- A promoção real acontece **fora do app**: revisão de seed ou migration no repositório, com a evidência anexada (documento, versão, data, trecho e instância). Regra transversal do `docs/implementation-plan.md`: nenhum item `A_VALIDAR_FEG` é promovido por conveniência técnica.
- O "modo instrutor" é um atalho didático e **não é controle de acesso**; a tela de Configurações diz isso. Ele não promove nada.

### 2.6 Proteções contra confundir exercício com documento oficial

| Risco | Proteção |
|---|---|
| Fórum simulado confundido com fórum real | Nomes com prefixo "[Simulado]". Ciclo "Ciclo Exemplo 2027 (ILUSTRATIVO)" (`ciclo:'EX-2027'`) |
| PDF circular como recomendação da FEG | Marca d'água "EXERCÍCIO DIDÁTICO · DADOS FICTÍCIOS · NÃO É RECOMENDAÇÃO DA FEG/ONS" em todas as páginas; autor "Aprendiz (perfil local)"; o nome do perfil nunca é impresso |
| Nomes reais de ferramentas sugerirem plano real | Títulos com apelido genérico ("modelo energético de médio prazo") terminando em "(fictício)". O nome real aparece só como vínculo de catálogo (`ferramentaId`), com a nota "vínculo de catálogo; status e números da iniciativa são fictícios" |
| Dados de exercício migrarem para o Portfólio FE | Todo objeto de `PF.base` tem `ilustrativo:true` e `origemDado:'TRILHA_FEG_FICTICIO'`. O JSON exportado tem cabeçalho `{tipo:'EXERCICIO_TRILHA', naoImportar:true}`. Qualquer importador futuro deve rejeitar `ilustrativo:true` (pendência registrada no Painel de Regras) |
| Link fictício abrir site de terceiros | Links em `https://ado.exemplo.invalid/<codigo>` e `https://itsm.exemplo.invalid/<codigo>` (TLD reservado, RFC 6761). O botão "abrir" fica desabilitado, com o tooltip "link fictício" |

---

## 3. Arquitetura

### 3.1 Arquivos e orçamento de linhas

| Arquivo | Conteúdo | Linhas |
|---|---|---|
| `src/core.js` | Existente (551) mais as mudanças da §3.3 | ~1.050 |
| `src/data.js` | `PF.base` **completo para os 3 níveis desde a etapa 1** (§4), registro de regras, RACI, catálogos | 650–800 |
| `src/calc.js` | `PF.calc`: funções **puras** usadas por telas, perguntas, desafios e autoteste (§3.10) | 450–550 |
| `src/globais.js` | Telas globais: Dashboard (abas por nível), Indicadores (mestre-detalhe), Inventário com ficha, Decisões | 600–750 |
| `src/governanca.js` | Fontes e premissas (Painel de Regras e Glossário), Autoteste, exportar e importar, cards de Configurações | 350–450 |
| `src/nivel1.js` | 3 telas, KPIs, blocos do Dashboard, abas da ficha, 23 perguntas, desafio | 900–1.100 |
| `src/nivel2.js` | 6 telas, 28 perguntas, desafio | 1.100–1.300 |
| `src/nivel3.js` | 5 telas com abas, 25 perguntas, desafio | 1.100–1.300 |

- `build.mjs` passa a usar `modules = ['src/core.js','src/data.js','src/calc.js','src/globais.js','src/governanca.js','src/nivel1.js','src/nivel2.js','src/nivel3.js']`. O `index.html` recebe a mesma lista.
- Se um nível passar de 1.300 linhas, o banco de perguntas vai para `src/perguntas-nN.js`, que entra na lista.

### 3.2 O que o core já entrega (reusar, não reimplementar)

- **Níveis:** `PF.registerLevel({id, nome, subtitulo, pergunta, objetivos, unlock:{minPct:70, desafio:true}, screens, questions, desafio})`.
- **Estado:** `PF.state`, `PF.save`, `PF.modState(n)`, `PF.ui_state`/`PF.set_ui`.
- **Dados:** `PF.base`, `PF.db()`, `PF.resetDb`.
- **Progresso:** `PF.levelStats`, `PF.levelDone`, `PF.award`.
- **Interface:** `PF.ui` (`kpi`, `pill`, `callout`, `section`, `pageHead`, `table` ordenável, `tag`), `PF.modal`, `PF.confirm` não bloqueante, `PF.toast`, `PF.busy`.
- **Gráficos SVG em `PF.charts`:** `hbar`, `bars`, `donut`, `stack`, `bubble`, `gauge`, `line`, `heat`, `legend`.
- **Exportação:** `PF.exportPDF`/`PF.pdfButton` (html2canvas e jsPDF embutidos).
- **Telas do core:** Início (cards de nível e medalhas), Fontes e premissas, Configurações.

### 3.3 Mudanças no core

| # | Mudança | Comportamento |
|---|---|---|
| C1 | Rotas globais | `PF.registerGlobal({id, titulo, icone, nivelMin, render})`. `parse()` aceita `#/dashboard`, `#/indicadores`, `#/inventario` e `#/decisoes`, e separa a query string (`h.split('?')`): `?ref=1` liga a Referência temporária e `?aba=x` abre uma aba |
| C2 | Sidebar em acordeão | Grupos de nível recolhíveis (`PF.ui_state('navOpen:'+id)`); só o nível atual vem aberto. Cabeçalhos: "Partitura · Fundamentos", "Arranjo · Priorização", "Regência · Otimização". Um único item **"Trilha do nível"** (abas Perguntas & Respostas · Desafio · Domínio) substitui os dois itens que o core cria hoje |
| C3 | Desbloqueio persistente | Quando `levelDone(id)` fica verdadeiro pela primeira vez, grava `S.concluidos[id] = ts` (em `checkLevelMedals`). `PF.unlocked = id => id===1 \|\| S.instrutor \|\| !!S.concluidos[id-1]`. "Reiniciar nível N" avisa que os níveis seguintes serão bloqueados e apaga `concluidos` e as medalhas de N em diante |
| C4 | Perguntas | Ver §3.6: alternativas com id estável; embaralhamento por semente; erro sem revelar a resposta; "Ver resposta" retira o crédito; `best` preservado; flags `aprofundamento` e `conferirFonte`; formato `decisao` com `preSel` e `fixos` |
| C5 | Modo exercício | `PF.exercicio.oculto(qids)` e `PF.ui.oculto(html, qids, rotulo)` (§3.7) |
| C6 | Dados | `PF.dados()`; `deepFreeze(PF.base)` logo após a carga; `PF.write`, `PF.append`, `PF.arquivar`, `PF.validar`, `PF.hash`, `PF.migrate` (§3.8 e §3.9) |
| C7 | Rótulos | `PF.regra(codigo)` devolve a versão vigente do parâmetro. `PF.badge(regraOuCodigo)` gera o badge composto da §2.3. `PF.fonteLabel` deixa de ter "Fonte ONS" como rótulo genérico |
| C8 | Registros compartilhados | `PF.dash[]` (blocos do Dashboard por nível e aba), `PF.kpis[]`, `PF.fichaTabs[]`, `PF.glossario[]`, `PF.autoteste[]`, `PF.configCards[]` (renderizados ao fim de Configurações) |
| C9 | Perfil | `PF.perfil()` devolve `{nome}`. O nome é usado em `historico.usuarioId`; `responsavel` de registro é o papel escolhido. Não há filtro "Minha carteira" |
| C10 | Conflito entre abas | Um evento `storage` com versão diferente bloqueia o salvamento (`CONFLICT`) e pede recarga |
| C11 | Reset com escopo | "Restaurar dados" oferece **só demandas** ou **tudo**. Antes, exporta automaticamente o JSON do exercício e pede confirmação. O log append-only é preservado em outra chave (§3.9) |
| C12 | Exportar e importar | JSON com cabeçalho de exercício. "Importar progresso (somente leitura)" mostra o resumo por nível de um JSON exportado, para a facilitadora juntar as três analistas |
| C13 | PDF | Botão "Exportar exercício (PDF)". Escala 1,5. Uma captura por seção marcada com `[data-pdf-page]`, para não estourar o limite de altura do canvas. Marca d'água e rodapé em todas as páginas; autor "Aprendiz (perfil local)" |
| C14 | Selo de simulação | `PF.ui.seloExercicio()`, renderizado automaticamente em telas declaradas com `escreve:true` |
| C15 | Renderização | Regra no cabeçalho do core: **nunca chamar `PF.refresh` no evento `input` contínuo** (slider ou texto). O handler de `input` atualiza só o contêiner de resultado (`PF.patch(el,'[data-res]',html)`) e grava em `PF.modState`; `PF.refresh` fica para o evento `change` |
| C16 | Fontes | `build.mjs` e `index.html`: `<link rel="stylesheet" href="…" media="print" onload="this.media='all'">` com `<noscript>` equivalente. Assim a página não fica em branco em rede que descarta conexões externas |
| C17 | Mensagens | `PF.msg(codigo, contexto)` devolve uma frase simples (ex.: "A comunidade escolhida não pertence a esta gerência") e deixa o código (`HIERARCHY_MISMATCH`) no tooltip |
| C18 | Datas | `PF.calc.dias(a,b)` com `Date.UTC` e `PF.calc.mesIdx(d) = 12·ano + mês`. Nenhuma conta de dias usa hora local |

### 3.4 Menu, rotas e navegação

```
Início                                          #/inicio            (core)
Dashboard                                       #/dashboard         global · abas: Execução (N1) | Ciclo Exemplo 2027 (N2) | Recomendação (N3)
Indicadores                                     #/indicadores       global · mestre-detalhe · filtro padrão "Nível atual"
Inventário                                      #/inventario        global · ficha com abas que crescem por nível
Decisões                                        #/decisoes          global · registro append-only de todos os níveis
▾ Partitura · Fundamentos (N1)   [x% · desafio ✓]
    Saúde & Prazos                              #/n1/saude          abas: Sinal | Prazos 30/60/90 | Riscos & Dependências
    Triagem                                     #/n1/triagem
    Mapa da FE                                  #/n1/mapa           abas: Estrutura | Pool e papéis | Fóruns | Fronteira
    Trilha do nível                             #/n1/trilha         abas: Perguntas & Respostas | Desafio | Domínio
▸ Arranjo · Priorização (N2)     [cadeado até concluir N1]
    A · Escolher
      Critérios & Pesos                         #/n2/criterios      abas: Critérios e rubricas | Parâmetros
      Pontuação & Matrizes                      #/n2/pontuacao      abas: Grade | Avaliação às cegas | Valor × Esforço | Valor × Risco
      Capacidade & Seleção                      #/n2/selecao
      Exercício de Gate                         #/n2/gate           abas: Assistente | Quem decide (RACI)
    B · Acompanhar
      Desempenho (EVM)                          #/n2/evm
      Fórum Mensal                              #/n2/forum          abas: Pauta | O que mudou | Ata e escalonamentos | Fotografia
    Trilha do nível                             #/n2/trilha
▸ Regência · Otimização (N3)     [cadeado até concluir N2]
    Otimizador                                  #/n3/otimizador     abas: Restrições & custos | Fronteira & Pareto | Capacidade local | Concentração
    Cenários & Robustez                         #/n3/cenarios
    Sensibilidade & AHP                         #/n3/sensibilidade  abas: Sensibilidade | AHP (aprofundamento)
    Benefícios, Prazos & Opções                 #/n3/valor          abas: Benefícios | Caminho crítico (aprofundamento) | Opção real (aprofundamento) | Inovação
    Planejamento do Ciclo                       #/n3/ciclo
    Trilha do nível                             #/n3/trilha
— Fontes e premissas (Painel de Regras · Glossário) · Configurações (perfil, modo instrutor, autoteste, restaurar, exportar/importar)
```

**Ícones:** dashboard, chart, list, gavel (Decisões), gauge (Saúde), flow (Triagem), people (Mapa), question (Trilha), sliders (Critérios), matrix (Pontuação), scale (Seleção), target (Gate), money (EVM), forum (Fórum), layers (Otimizador), branch (Cenários), compass (Sensibilidade), spark (Valor), calendar (Ciclo). Nenhum ícone se repete.

**Itens de nível bloqueado:** aparecem com cadeado e a dica "Conclua o Nível X". Quem abre um bloqueado vê os objetivos do nível.

**Como as telas globais crescem:**
- **Dashboard:** uma aba por nível liberado; abre na aba do nível atual. Na aba N3, o painel de 7 indicadores descritivos **substitui** os cards do N1 e do N2 em vez de se somar a eles.
- **Indicadores:** lista compacta (nome, valor, badge) e ficha completa ao clicar. Filtros: "Nível atual" (padrão), "Essenciais", "Todos liberados". Os de nível bloqueado ficam ocultos.
- **Ficha da iniciativa** (Inventário):
  - N1: Dados · Sinal · Riscos & Dependências · Decisões · Histórico · Rótulos;
  - N2 acrescenta Avaliação & Risco (linha do tempo) e Capacidade, Custo & EVM;
  - N3 acrescenta Benefícios, Dependências lógicas e Cenários.
- **Decisões:** desde o N1 mostra as decisões semente e as recomendações de triagem; no N2 e no N3 entram gates, escalonamentos e a recomendação do ciclo.

### 3.5 Desbloqueio e progresso

- **Regra (R36a, DFP; valor de 70% em R36b, a validar):**
  - Nível concluído = `pct ≥ 70%` **e** desafio concluído.
  - `pct` = perguntas com `best === true` e `revelada !== true`, divididas pelas perguntas **graduadas**.
  - Graduadas são as que não têm `aprofundamento:true` nem `conferirFonte:true`.
- **Persistente:** depois de concluído, o nível fica concluído (`S.concluidos`). Revisar perguntas ou refazer o desafio não bloqueia os níveis seguintes. "Refazer desafio" guarda o resultado anterior em `S.desafios[id].historico[]` e mantém `feito` até haver nova conclusão.
- **Tentativas ilimitadas.** Sem cronômetro e sem ranking entre colegas.
- **Card "Domínio"** (aba da Trilha): conceitos x/n · análise y/n · decisão z/n · desafio ✓/–, mais a barra por `conceito`. Sugestão: "revise as perguntas marcadas com ! antes do desafio".
- **Modo instrutor:** libera os níveis, mostra gabaritos e o mapa de armadilhas, desliga o modo exercício, mostra a alternância "Todas ativas" do 30/60/90 e roda o autoteste.

### 3.6 Perguntas: formato e comportamento

```js
{ id:'N1-C01', nivel:1, tipo:'conceito'|'analise'|'decisao',
  formato:'mc'|'num'|'pick'|'multi'|'decisao'|'custom',
  enunciado:'…', contexto:(d)=>html,
  alternativas:[{id:'A', texto:'…'}, …], correta:'C',          // mc: id estável, não posição
  corretas:['B','C'],                                            // multi
  calc:(d)=>number, tolerancia:0.5|{rel:0.02}, unidade, casas,   // num
  opcoes:(d)=>[{id,label}], correta:(d)=>id,                     // pick
  itens:(d)=>[…], colunas:[…], limites:[…], preSel:['P01'], fixos:['P01'], avaliar:(sel,d)=>({ok,nota,feedback}),
  justificativa:(d,resp)=>html, dica:'…', conceito:'…', regra:'R13', ver:'#/n1/saude?ref=1',
  aprofundamento:false, conferirFonte:false, usaTrabalho:false }
```

| Situação | Comportamento |
|---|---|
| Fonte dos dados | `q.usaTrabalho ? PF.db() : PF.base`. Toda pergunta de análise ou decisão do gabarito usa `PF.base` e mostra "calculado sobre a Referência". Se o Trabalho divergir, mostra também "nos seus dados de Trabalho o valor é X" |
| Acerto | Feedback completo: resposta, justificativa e "como calculei". Grava `{ok:true, best:true, n, val}` |
| Erro | **Não** marca a alternativa correta, **não** mostra a resposta esperada nem a justificativa. Mostra só a `dica` e "Tentar de novo". Grava `{ok:false, best:prev.best, n}` |
| "Ver resposta" | Confirmação: "Ao ver a resposta, esta pergunta deixa de contar para o desbloqueio". Grava `revelada:true` e mostra o gabarito |
| Tentar de novo | Não apaga o registro; preserva `best` e incrementa `n` |
| Embaralhamento | Ordem das alternativas de `mc`, `pick` e `multi` por semente estável (`hash(q.id + n)`); letras reatribuídas na exibição. A correção compara ids |
| Distribuição das letras originais | No máximo 35% das corretas na mesma letra, por nível (o autoteste verifica). Alternativas com tamanho semelhante |
| `aprofundamento` / `conferirFonte` | Selo "Aprofundamento: não conta para o desbloqueio" ou "Depende de conferir a fonte no slide original". Fora do denominador |
| Link `ver` | Abre a tela com `?ref=1`, mostrando a faixa "Mostrando dados de Referência (os da pergunta) · edição desativada" |
| Modelo de justificativa das perguntas de análise (DFP) | **Resposta** · **Como calculei** (campos e filtro) · **Leitura** · **Cuidado** · **Próximo passo** · **Rótulos** · **Data do dado** |

### 3.7 Modo exercício

- **Quando está ligado:** por padrão, em cada nível, até o desafio daquele nível ser concluído. Só o modo instrutor desliga.
- **O que faz:** todo elemento de tela que entrega a resposta de uma pergunta graduada ainda não resolvida (não acertada nem revelada) aparece como **"? · fórmula e insumos visíveis · responda AQx-yy na Trilha para revelar"**. O registro é declarativo: `revelaApos:['AQ1-02']` no KPI ou no bloco.
- **O que fica oculto, por nível:**
  - **N1:**
    - cards de % do orçamento em vermelho (AQ1-02), desvio mediano (AQ1-05), riscos abertos (AQ1-07) e demandas com mais de 60 dias (AQ1-09);
    - a coluna "sinal calculado" e a lista "Onde agir" (AQ1-01, AQ1-03);
    - o resultado de "mostrar a conta" desses KPIs.
  - **N2:**
    - valor, ociosidade e eficiência dos métodos em Capacidade & Seleção, inclusive no what-if, até o desafio do N2 ser concluído (a composição das carteiras fica visível);
    - a coluna "ótimo exato" até DC2-02 ter sido respondida;
    - D (AQ2-06), CPI do portfólio (AQ2-07) e o diff com a fotografia de setembro (AQ2-09);
    - nas matrizes, os rótulos de quadrante até a aprendiz classificar.
  - **N3:**
    - o painel "custo de cada restrição" e o "limiar de reversão" calculado, até o desafio do N3 ser concluído. V* da configuração atual fica sempre visível, porque o exercício é calcular a diferença;
    - frequências de robustez (AQ3-04);
    - folgas do caminho crítico (AQ3-07).
- **Triagem e Gate:** a saída sugerida pelo sistema aparece **só depois** de registrada a recomendação, como feedback. "Mostrar solução" grava `usouAjuda:true`.
- **Desafios:** usam **variantes** que não aparecem em nenhuma tela (ex.: "% do orçamento em vermelho se E03 também ficar vermelha"). São calculadas por `PF.calc` sobre uma cópia de `PF.base` com a alteração da variante.

### 3.8 Trabalho × Referência

- **Trabalho:** `PF.db()`, editável e padrão das telas.
- **Referência:** `PF.base`, congelada com `deepFreeze` logo após calcular a fotografia SN-SET.
- **Escolha nas telas:** seletor `[Trabalho | Referência]` na linha de metadados; `PF.dados()` devolve o conjunto escolhido.
- **Em Referência:**
  - todo botão de edição fica desabilitado;
  - `PF.write`, `PF.append` e `PF.arquivar` sempre operam sobre `PF.db()` e lançam `VALIDATION_ERROR` se a Referência estiver ativa;
  - todas as funções de cálculo são puras (`slice().sort()`, sem cache gravado no objeto).
- **Escrita:** `PF.write(entidade, id, patch, {justificativa})`:
  1. chama `PF.validar`;
  2. grava um `historico` por campo (`valorAnterior`, `valorNovo`, `usuarioId`, `alteradoEm`, `origemAlteracao:'APP_TRILHA'`, `justificativa`);
  3. faz `rowVersion++` e atualiza `updatedAt`.
- **Registros append-only:** `PF.append(colecao, registro)` serve para `avaliacoes`, `decisoes`, `historico`, `medicoesBeneficio` e `snapshotsForum` (FECHADO). Não há update nem delete.
- **Arquivar:** `PF.arquivar(id, justificativa)` faz `ativo:false` e grava histórico. Nenhuma tela oferece "excluir".

### 3.9 Persistência, log, reset e exportação

| Item | Regra |
|---|---|
| Estado | `portfolio-feg-v1`: `{v, instrutor, respostas, desafios, concluidos, medalhas, work, workV, mod, ui, perfil, exercicioId}` |
| Log append-only | `portfolio-feg-v1-log`: `{exercicios:{[exercicioId]:{inicio, decisoes[], historico[], avaliacoes[], medicoesBeneficio[], snapshotsForum[]}}}`. `PF.db()` monta essas coleções como sementes de `PF.base` mais o log do exercício atual. Ao restaurar, nasce um novo `exercicioId`; os anteriores ficam consultáveis só para leitura em Decisões → "Exercícios anteriores" |
| Imutabilidade | O texto da tela diz: "imutabilidade simulada no navegador; a garantia real é do banco (triggers `0012`/`0014`, RLS)" |
| Versão dos dados | `data.js` é publicado **completo já na etapa 1** e `PF.base.versao` fica fixa. Se for preciso mudar, `PF.migrate(oldWork, newBase)` preserva as coleções criadas pela aprendiz e os campos editados. Nunca se recria o Trabalho em silêncio |
| Exportar JSON | `{tipo:'EXERCICIO_TRILHA', naoImportar:true, ilustrativo:true, versaoDados, versaoParametros, exportadoEm, perfil:{nome}, progresso, log}` |
| Importar | Só progresso, só leitura (resumo por nível). Não altera dados |
| PDF | Ver C13 e §2.6 |

### 3.10 Regras transversais de cálculo e interface

| Tema | Regra | Origem |
|---|---|---|
| Divisão | `PF.calc.div(a,b)` devolve `null` se `b ≤ 0` ou se o resultado não for finito. Indicador com `null` mostra "n/d" e o motivo | DFP |
| Sinal com dado faltante | Qualquer dimensão `null` (sem baseline, BAC ou AC ausente ou zero) → **Cinza**, com o motivo. Nunca cai em "Verde" por omissão | DFP |
| BAC e AC | `bac(i)` = Σ `financeiro.orcamentoPlanejado` e `ac(i)` = Σ `financeiro.realizado`, **com o mesmo filtro** (`fonte` e `periodo` preenchidos). Linha sem fonte → `SOURCE_REQUIRED` e fica fora | DFP (regra 5 do `data-model`) |
| TCPI | Com `BAC − AC ≤ 0`, mostra "BAC esgotado (TCPI n/d)" | DFP |
| D (mix) | `null` se o custo discricionário for 0 | DFP |
| Desvio de prazo | `mesIdx(max(dataPrevistaAtual, ref)) − mesIdx(dataPlanejada)`, em **meses de calendário** (R14). A ficha do indicador mostra a convenção | DFP |
| Hierarquia | Comunidade pertence à gerência e squad à comunidade, ambas ativas; senão `HIERARCHY_MISMATCH`. Ferramenta de outra comunidade é aceita com aviso informativo, porque o repositório não valida isso | DFP (`0012`/`0014`) |
| Exclusão | Não existe DELETE. Arquivar = `ativo:false` com justificativa | DFP (`0012`/`0017`) |
| Decisão × fase | A decisão **não muda a fase sozinha**. Para P01–P08 (candidatas do gabarito), decisões com `simulacao:true` **nunca** propõem transição. Nas demandas, o efeito da triagem é aplicado como "efeito simulado se a instância acatar", com histórico e reversível por "Corrigir triagem" | DFP |
| Candidatas do ciclo | `ciclo==='EX-2027' && ['EM_ANALISE','APROVADA'].includes(fase) && fte>0 && custo>0`, com FTE e custo na unidade FTE | DFP |
| Unidades | Capacidade e demanda só somam na mesma `unidade`. A divergente fica fora com `INCOMPATIBLE_UNIT`. **O app não converte horas em FTE** (R25 = `null`) | DFP (regra 6 do `data-model`) |
| Fotografia | ABERTO pode ser regenerada; FECHADO é imutável (`SNAPSHOT_LOCKED`). Corrigir cria `versao + 1` | DFP (`0007`, `0014`) |
| Hash | `PF.hash(obj)`: FNV-1a de 32 bits sobre JSON com chaves ordenadas. Serve para detectar mudança e funciona em `file://`. Não é segurança | DFP |
| Otimizador | Enumeração exata para `n ≤ 14` candidatas (16.384 combinações); acima disso fica desligada, com aviso, e restam as heurísticas. Inteiros internos (meio-FTE, R$ mil). Memoização por `PF.hash({candidatas, restricoes, pesos})`. Fronteira e "por que ficou de fora" só sob demanda (botão) | DFP |
| Desempate do otimizador | Maior V → menor FTE → menor custo → menor risco médio → códigos em ordem. Arredondar só na exibição | DFP |
| Desempate do ranking | Menor R → maior C1 → código (R23) | DFP |
| "Por que ficou de fora" | Para cada excluída: força a entrada, reotimiza e mostra ΔV e quem sai, ou qual restrição a barra | DFP |
| Sliders | O evento `input` atualiza só o contêiner de resultado; `change` persiste e chama `PF.refresh` (C15) | DFP |
| Parâmetros editáveis | Só por lista fechada (R43): R13, R15, R16, R20, R22, R26, R27, R28, R29, R32. Os demais ficam somente leitura | DFP |
| Matrizes nos limiares | Tabela de classificação ao lado do gráfico com a regra de fronteira explícita ("FTE ≤ 2 = baixo; R ≥ 12 = alto"). Rótulos com o mesmo x recebem deslocamento vertical alternado | DFP |

### 3.11 Códigos de validação (texto simples na tela; código no tooltip)

| Código | Quando | Mensagem na tela |
|---|---|---|
| `REQUIRED` | Campo obrigatório vazio (R10a) | "Preencha {campo}." |
| `INVALID_URL` | `linkOperacional` não passa em `new URL()` | "O link precisa ser um endereço válido." |
| `HIERARCHY_MISMATCH` | Comunidade ou squad fora da hierarquia | "A {comunidade/squad} escolhida não pertence a {gerência/comunidade}." |
| `VALIDATION_ERROR` | Pesos com soma ≠ 100%; justificativa curta; escrita em Referência | "Os pesos precisam somar 100% (hoje: 95%)." |
| `INCOMPATIBLE_UNIT` | Capacidade ou demanda em unidade diferente | "Esta linha está em horas e não entra na soma em FTE. O app não converte horas em FTE." |
| `SOURCE_REQUIRED` | Financeiro sem fonte ou período | "Valor sem fonte ou período: fica fora dos indicadores." |
| `SNAPSHOT_LOCKED` | Tentar alterar fotografia FECHADA | "Fotografia fechada não muda. Gere uma nova versão ou registre uma correção." |
| `RULE_NOT_VALIDATED` | Exportar PDF com regras a validar; `FONTE_ONS` sem documento aprovado | "Este material usa regras ainda não validadas pela FEG: {lista}." |
| `CONFLICT` | Outra aba salvou uma versão diferente | "Os dados mudaram em outra aba. Recarregue antes de salvar." |

---

## 4. Modelo de dados e conjunto de exemplo (ILUSTRATIVO)

Legenda:
- **REPO:** existe no repositório (migrations e `initiativeMapper.js`), em camelCase.
- **EXT:** extensão do app (DFP), a propor ao repositório.
- Os ids são códigos estáveis (`E01`, `FEN`, `PPE-A`).
- Todo objeto tem `ilustrativo:true` e `origemDado:'TRILHA_FEG_FICTICIO'`.

### 4.1 Entidades

| Entidade | Campos REPO usados | Campos EXT | Nível |
|---|---|---|---|
| `gerencias` | id, sigla, nome (= sigla, como no seed 001), ativo | nomeProposto (s4, proposta) | N1 |
| `comunidades` | id, nome, tipo (`ENTREGA`\|`TECNICA`), gerenciaId, lider ("a definir"), ativo | sigla, siglaDidatica (bool) | N1 |
| `squads` | id, nome, comunidadeId, ativo | — | N1 |
| `ferramentas` | id, nome, comunidadeId, observacao, ativo | classeSourcing (`NUCLEO_CRITICO`\|`PERIFERICO`\|`MERCADO`\|`LEGADO`) | N1 (classe no N3) |
| `statusConfiguracao` | codigo, nome, descricao, origemRegra, statusValidacao, ativo | ordem, terminal, tipoFonte | N1 |
| `objetivosEstrategicos` | — | codigo, nome, vinculoSugerido, origemRegra, tipoFonte | N1 |
| `iniciativas` | id, titulo, descricaoObjetivo, gerenciaId, comunidadeId, squadId, ferramentaId, areaClienteOrigem, responsavel, horizontePrazo (não usado em cálculo), statusId (= fase), criticidade, impacto, trlEsperado, linkOperacional, dataPlanejada (= baseline), dataPrevistaAtual (base do 30/60/90), observacoes, ativo, rowVersion, createdAt, updatedAt | **N1:** codigo, categoria, objetivoEstrategicoId, patrocinador, origemDemanda, canalEntrada, envolveCtPmoPld, percentualFisicoReal, ragDeclarado, dataEntrada, estimativaInformada {valor, unidade, custo}, beneficioEsperado, triagem {itemDePortfolio, exigeNovaMetodologia, redundanteComId, outroFluxo}<br>**N2:** percentualFisicoPlanejado, ciclo, obrigatoria, evidenciaObrigatoriedade {documento, versao, data, trecho, anexada}<br>**N3:** horizonteInovacao (`H1`\|`H2`\|`H3`), pessoasChave[], grupoExclusividade | N1/N2/N3 |
| `avaliacoes` (append-only) | iniciativaId, criticidade, impacto, alinhamentoEstrategico, requisitoRegulatorioInstitucional, capacidade, dependenciasResumo, riscosResumo, trl, observacoes, registradoPor, registradoEm | notasCriterios {C1..C5}, versaoPesos, simulacao | N2 |
| `riscosImpedimentos` | iniciativaId, descricao, impacto, responsavel, acao (= mitigação), status, prazo | natureza (`RISCO`\|`IMPEDIMENTO`), probabilidade (1–5), impactoNota (1–5) | N1 (lista) / N2 (P×I) |
| `dependencias` | iniciativaOrigemId, iniciativaDependenciaId, comunidadeDependenciaId, descricao, impacto, responsavel, status, dataEsperada | tipo (`LOGICA`\|`TEMPORAL`), confirmada | N1 (lista) / N3 (restrição) |
| `capacidades` | periodo, nivelOrganizacional (`GERENCIA`\|`COMUNIDADE`), referenciaId, capacidadeDisponivel, unidade, fonte | metodo, usoNaTrilha (`RESTRICAO`\|`INFORMATIVO`) | N2/N3 |
| `demandasCapacidade` | iniciativaId, periodo, capacidadeRequerida, unidade | fonte | N2 |
| `financeiro` | iniciativaId, periodo, orcamentoPlanejado, previsao (previsão no término, convenção R37), realizado, fonte, dataReferencia | fornecedorPrincipal (fictício) | N1/N2/N3 |
| `foruns` | tipoForum, periodoReferencia, dataCorte, statusPreparacao, observacoes (resumo da pauta) | codigo, nome, pautaItens[] | N1/N2/N3 |
| `decisoes` (append-only) | iniciativaId, forumId, tipoRitoForum, decisao (texto NN), justificativa, responsavel (NN), decididoEm | tipoDecisao, recomendacao, papelRegistrante, instancia, condicionantes, proximaRevisao, gatilhoReativacao, versaoPesos, cenarioId, custosRestricao[], classeRecomendacao, refDecisaoAnteriorId, tipoDecisaoCorrigido, preMortem, usouAjuda, exercicioId, simulacao | N1 |
| `snapshotsForum` | forumId, geradoEm, versao, status (`ABERTO`\|`FECHADO`), indicadoresJson, iniciativasJson, decisoesPendentesJson, filtrosJson, hashConteudo | versaoPesos | N2/N3 |
| `parametrosSistema` | chave, valor, tipo, origemRegra, statusValidacao, versao, atualizadoPor, atualizadoEm | codigo (R01…), tipoFonte, referencia, justificativa, editavel, vigente | N1 (leitura) / N2 / N3 |
| `historico` (append-only) | entidade, entidadeId, campoAlterado, valorAnterior, valorNovo, usuarioId, alteradoEm, origemAlteracao | justificativa | N1 |
| `pendencias` | — | id, iniciativaId, tipo (`CAMPO_VAZIO`\|`DIVERGENCIA_STATUS`\|`DADO_INCONSISTENTE`), campo, descricao, responsavel, prazo, status (`ABERTA`\|`RESOLVIDA`) | N1 |
| `beneficios` / `medicoesBeneficio` (append-only) | — | kpi, unidade, sentido (`MAIOR_MELHOR`\|`MENOR_MELHOR`), linhaBase, meta, dataBase, dataMeta, dono (papel), fonteDado; medição {data, mes, planejado, realizado} | N3 |
| `atividadesCronograma` | — | id, iniciativaId, nome, duracaoMeses, predecessoras[] | N3 |
| `cenarios` | — | id, nome, premissas {cap, orc, deps[], excl[], maxD, gcap, pesos, extras[], obrig[]}, gatilho (obrigatório), usoRobustez (bool), origemRegra, criadoPor | N3 |

### 4.2 Catálogos

**Fases** (`statusConfiguracao`, R11, a validar):

| Ordem | Código | Terminal | Observação |
|---|---|---|---|
| 1 | `DEMANDA` | não | — |
| 2 | `EM_ANALISE` | não | — |
| 3 | `APROVADA` | não | — |
| 4 | `EM_EXECUCAO` | não | — |
| 5 | `EM_ESPERA` | não | — |
| 6 | `ENCERRADA` | sim | Continua `ativo:true` para o benefício seguir medido (a validar) |
| 7 | `CANCELADA` | sim | `ativo:false` |

**Outros catálogos:**
- **Categorias** (R12, a validar): `OBRIGATORIA`, `SUSTENTACAO`, `EVOLUCAO`, `INOVACAO`. O s127 cita evolução, inovação e sustentação; o s166 cita "não negociáveis".
- **Origem da demanda:** `OPERATIVA` \| `REGULATORIA` \| `ESTRATEGICA` (s94, proposta).
- **Canal de entrada:** `USUARIOS_INTERNOS` \| `CENTRAL_ATENDIMENTO` \| `CT_PMO_PLD` (s142, proposta).

**`tipoDecisao`** (R18, catálogo a validar):

| Contexto | Valores | Campos exigidos | Base |
|---|---|---|---|
| Triagem (recomendação) | `ADMITIR`, `DEVOLVER`, `REDIRECIONAR_EXECUCAO`, `ENCAMINHAR_EXPLORATORIO`, `ARQUIVAR` | justificativa ≥ 20 caracteres; instância "PO da squad (R)"; destino ou vínculo | Adaptação didática do s142 (DFP; uso como admissibilidade ao portfólio a validar) |
| Gate (recomendação) | `GO`, `GO_CONDICIONADO`, `HOLD`, `RECYCLE`, `KILL` | GO_CONDICIONADO: condicionantes e próxima revisão. HOLD: gatilho. RECYCLE: próxima revisão. KILL: justificativa | Stage-Gate (Ref. de mercado) → DFP |
| Acompanhamento | `ESCALAR`, `REPLANEJAR`, `REGISTRAR_DESVIO`, `ENCERRAR` | ESCALAR: instância | s129 (proposta) |
| Inovação | `GATE2_PAUSA_FORMAL`, `GATE3_ENCERRAR` | GATE2: gatilho de reativação | s189 (proposta) |
| Registro | `CORRECAO_REGISTRO` | `refDecisaoAnteriorId`; `tipoDecisaoCorrigido` quando corrige triagem | DFP |

**`classeRecomendacao`** (N3; mapeamento para `tipoDecisao`):

| Classe | `tipoDecisao` | Exigência |
|---|---|---|
| Núcleo | `GO` | — |
| Condicional | `GO_CONDICIONADO` | condicionante e gatilho obrigatórios |
| Habilitadora | `HOLD` | `gatilhoReativacao` (ex.: "Dep4 confirmada") |
| Recycle | `RECYCLE` | — |
| Kill | `KILL` | — |

A decisão do ciclo referencia a do gate por `refDecisaoAnteriorId`, e a tela mostra a decisão **vigente**: a última não corrigida.

**`tipoForum`** (a validar):

| Código | Tipo | Origem |
|---|---|---|
| `ACOMPANHAMENTO_PORTFOLIO` | mensal | s129, proposta |
| `PLANEJAMENTO_PORTFOLIO` | periodicidade em conflito | s127 |
| `PLANEJAMENTO_EVOLUCAO` | — | s128 |
| `SESSAO_GATE_SIMULADA` | sessão de exercício | s153 descreve um **mecanismo**, não um fórum; adaptação didática |

**Status fechados** (literais da `0011`, comparação com `upper()`, nulo = aberto):
- riscos: `RESOLVIDO`, `CONCLUIDO`, `FECHADO`;
- dependências: `RESOLVIDA`, `CONCLUIDA`, `FECHADA`.

**Papéis registrantes:**
- Analista: Gestão de Portfólio/PMO
- Analista: Governança, Riscos e Conformidade
- Analista: Contratos e Fornecedores
- Analista: Estratégia e Inovação
- Analista: Interface institucional e regulatória (papel de aprendizagem)

### 4.3 Registro de regras (`parametrosSistema` v1; `statusValidacao` A_VALIDAR salvo indicação)

| Cód. | chave | Valor | origemRegra | tipoFonte · referência |
|---|---|---|---|---|
| R01 | gerencias | FEG, FEL, FEN, FER | A_VALIDAR_FEG | PROPOSTA · s4/s56; siglas também no seed 001, que não confirma nomes |
| R02 | catalogoFE | 10 comunidades, 13 squads de entrega, 16 ferramentas (§4.4) | A_VALIDAR_FEG | PROPOSTA · s22, s30–s42 |
| R03 | comunidadesTecnicasNaFEG | `gerenciaId=FEG` para PEL, PEN, ACO, PLA | A_VALIDAR_FEG | PREMISSA · inferência do s117; `gerencia_id` NN no repositório; liderança de PLA pela DTA (s118) |
| R04 | objetivosEstrategicos | OE-1..OE-3 fictícios | A_VALIDAR_FEG | PREMISSA · os reais devem vir de documento ONS |
| R05a | forumAcompanhamento | mensal, coordenação FEG | A_VALIDAR_FEG | PROPOSTA · s129 |
| R05b | periodicidadesEmConflito | Estratégico anual (s126) × quadrienal (s205/s208); Portfólio semestral (s127) × anual (s125/s205/s208); Evolução trimestral (s128) × semestral (comentário) | A_VALIDAR_FEG | PROPOSTA + COMENTARIO_REVISAO |
| R06 | mecanicasRepositorio | hierarquia; arquivar; fotografia imutável; avaliação append-only; rowVersion | DFP | REPOSITORIO · `0012`–`0017` |
| R07 | dataReferencia | 2026-10-03 | DFP | PREMISSA |
| R08 | faixasHorizonteDias | [30, 60, 90] inclusivo; nulo = SEM_DATA; anterior à referência = VENCIDO | DFP | REPOSITORIO · RPC `get_horizonte_datas` |
| R09 | statusFechados | literais §4.2 | DFP | REPOSITORIO · `0011` |
| R10a | camposObrigatoriosRepo | titulo, descricaoObjetivo, gerenciaId, comunidadeId, responsavel | DFP | REPOSITORIO · `initiativeRules.js` |
| R10b | camposObrigatoriosTrilha | categoria, objetivoEstrategicoId, bac, dataPlanejada, dataPrevistaAtual | A_VALIDAR_FEG | PREMISSA |
| R11 | fases | catálogo §4.2 | A_VALIDAR_FEG | PREMISSA · `status_configuracao` vazio no repositório |
| R12 | categorias | catálogo §4.2 | A_VALIDAR_FEG | PREMISSA · inspirado em s127/s166 |
| R13 | sinalLimiares | vermelho: desvio ≥ 3 meses ou índice < 0,85; amarelo: desvio de 1–2 meses ou índice de 0,85 a < 0,95; pior dimensão | A_VALIDAR_FEG | PREMISSA |
| R14 | previsaoVencida | prevista < referência e fase não terminal → usa a referência como previsão mínima e sinaliza "previsão vencida" | DFP | — |
| R15 | toleranciaPrazoMeses | 0 | A_VALIDAR_FEG | PREMISSA |
| R16 | idadeDemandaAlertaDias | 60 | A_VALIDAR_FEG | PREMISSA |
| R17 | checklistTriagem | T1–T6 e precedência (§5.2.6) | A_VALIDAR_FEG | PROPOSTA · T4/T5 do s143 |
| R18 | tiposDecisao | catálogo §4.2 | A_VALIDAR_FEG | PREMISSA |
| R19 | criterios | C1–C5 (§6.2.1) | A_VALIDAR_FEG | PREMISSA · relação aproximada com s138/s143 |
| R20 | pesosCriterios | {C1 0,30; C2 0,25; C3 0,20; C4 0,15; C5 0,10} | A_VALIDAR_FEG | PREMISSA |
| R21 | escalaNormalizacao | 1–5 ancorada; N = (S − 1)/4 × 100 | DFP | — |
| R22 | limiaresQuadrante | valor alto N ≥ 60; esforço alto FTE > 2; risco alto R ≥ 12; risco crítico R ≥ 15 | A_VALIDAR_FEG | PREMISSA |
| R23 | desempate / empateTecnico | menor R → maior C1 → código / \|ΔN\| < 1,0 | DFP | — |
| R24 | capacidadeCiclo | 10,0 FTE (FEL 1,5; FEN 3,5; FER 4,0; FEG 1,0); R$ 4,0 mi | A_VALIDAR_FEG (marca ILUSTRATIVO) | PREMISSA |
| R25 | fatorHorasPorFte | `null` (não converter) | A_VALIDAR_FEG | PREMISSA |
| R26 | faixasCapacidade | u > 100%: "Ativar tanque + repriorizar backlog"; 90% ≤ u ≤ 100%: "Reduzir escopo + modularizar entregas"; 75% ≤ u < 90%: "Executar roadmap estruturado"; u < 75%: "Investir em autonomia e dívida técnica" | A_VALIDAR_FEG | PROPOSTA · s165 (adaptado de Lovelock & Wirtz) |
| R27 | reservaCapacidade | 0,15 (faixa 15–20%) | A_VALIDAR_FEG | PROPOSTA · s166 |
| R28 | mixAlvo / toleranciaD | {SUSTENTACAO 0,30; EVOLUCAO 0,50; INOVACAO 0,20}, na parcela discricionária em R$ / 0,15 | A_VALIDAR_FEG | PREMISSA |
| R29 | limiaresEvm | índice 0,85; TCPI 1,1 | A_VALIDAR_FEG | REF_MERCADO · PMI |
| R30 | formulas | EVM, AHP, Spearman, Pareto, CPM, HHI | DFP | REF_MERCADO |
| R31 | horizontesInovacao / trlHandover | H1 70%, H2 20%, H3 10% / TRL 7 | A_VALIDAR_FEG | PROPOSTA · s181, s209/s210; s183 |
| R32 | robustezNucleo / limiarHhi | 0,80 / 0,25 | A_VALIDAR_FEG | PREMISSA |
| R33 | papelPmoPriorizacao | C (s143) × A (s149) × "contribui em estruturantes" | A_VALIDAR_FEG | PROPOSTA · contradição; RACI reconstruída |
| R34 | limiteFegCtPmoPld | FEG executa e operacionaliza o backlog (s63); quem prioriza o escopo do CT está a validar | A_VALIDAR_FEG | COMENTARIO_REVISAO · rascunho do deck v25 |
| R35 | pesosCongeladosNaFotografia | fechar a fotografia do ciclo grava `versaoPesos`; versões criadas depois ficam `vigente:false` com o selo "não usada na fotografia FR-CICLO" | DFP | — |
| R36a | regraDesbloqueio | % de graduadas acertadas sem revelação + desafio | DFP | core `unlock` |
| R36b | notaMinimaNivel | 70% | A_VALIDAR_FEG | PREMISSA |
| R37 | convencoesFinanceiras | `previsao` = previsão no término; BAC = soma das linhas com fonte e período; moeda R$ assumida (`0006` não modela moeda) | DFP | — |
| R38 | raciReconstruida | linhas da §4.18 | A_VALIDAR_FEG | PROPOSTA · s143/s147/s149/s196, reconstrução do texto extraído; conferir no slide |
| R39 | quadrantesS168 | nomes e posição dos quadrantes | A_VALIDAR_FEG | PROPOSTA · s168, posição inferida do layout |
| R40 | classeSourcing | §4.4 | A_VALIDAR_FEG | PROPOSTA · s231–s235 |
| R41 | poolDeck | 5 blocos do s56/s57 | A_VALIDAR_FEG | PROPOSTA · s56/s57 |
| R42 | papeisAprendizagem | 5 naipes do Afinação FEG | A_VALIDAR_FEG | ARTEFATO_INTERNO · `public/afinacao-feg.html` (NAIPES), não consta no deck |
| R43 | parametrosEditaveis | R13, R15, R16, R20, R22, R26, R27, R28, R29, R32 | DFP | — |

### 4.4 Estrutura da FE (proposta A&M v25 · a validar)

**Gerências** (R01): FEG Governança e Estratégia de Ferramentas Eletroenergéticas · FEL Ferramentas Elétricas · FEN Ferramentas Energéticas · FER Ferramentas para Recursos e Carga. Os nomes vêm do s4; no seed 001 o nome é igual à sigla.

**Comunidades e squads** (R02; 10 comunidades, 13 squads):

| Gerência | Comunidade (tipo) | Sigla | Squads |
|---|---|---|---|
| FEL | Transitórios Eletromagnéticos (ENTREGA) | TEM (deck) | TEM-A Simulador EMT · TEM-B Base de Dados EMT |
| FEL | Regime Permanente e Transitórios Eletromecânicos (ENTREGA) | RP (deck: RP/TEMec) | RP-A Regime Permanente · RP-B Transitórios Eletromecânicos · RP-C Operação · RP-D Base de Dados Eletromecânicos |
| FEN | Planejamento e Programação Energética (ENTREGA) | PPE (deck) | PPE-A Curto e Médio Prazo · PPE-B Curtíssimo Prazo · PPE-C Simulador de Despacho |
| FER | Recursos Hidrológicos (ENTREGA) | HID (sigla didática) | HID-A Vazão e Cenários Hídricos · HID-B Simulador Hidráulico |
| FER | Geração Renovável Variável (ENTREGA) | GRV (deck) | GRV-A Fotovoltaica e Eólica |
| FER | Carga e Recursos Energéticos Distribuídos (ENTREGA) | CRG (sigla didática) | CRG-A Previsão de Carga e GD/MMGD |
| FEG\* | Prospecção e Evolução Técnica das Ferramentas Elétricas (TECNICA) | PEL (sigla didática) | — |
| FEG\* | Prospecção e Evolução Técnica das Ferramentas Energéticas (TECNICA) | PEN (sigla didática) | — |
| FEG\* | Acoplamento Eletroenergético (TECNICA) | ACO (sigla didática) | — |
| FEG\* | Plataformização, Escalabilidade e Performance (TECNICA; liderança DTA, s118) | PLA (sigla didática) | — |

\* Vínculo R03, a validar. "Sigla didática" = DFP, não oficial; a interface mostra a nota.

**Ferramentas** (16; vínculo de catálogo; classe de sourcing R40, proposta s231–s235):

| Ferramenta | Comunidade | Classe |
|---|---|---|
| ANAREDE, ANAFAS, ORGANON | RP | NUCLEO_CRITICO |
| HARMZS | RP | LEGADO |
| NEWAVE, DECOMP, DESSEM, BALPONTA | PPE | NUCLEO_CRITICO |
| GEVAZP, PREVIVAZ, SMAP/ONS | HID | PERIFERICO |
| WEOL | GRV | PERIFERICO |
| PREV CARGA PMO, PREV CARGA DESSEM | CRG | PERIFERICO |
| HYPERSIM, PSCAD | TEM | MERCADO |

### 4.5 Objetivos estratégicos (fictícios, R04)

| Código | Nome | Ligação sugerida (texto) |
|---|---|---|
| OE-1 | Continuidade e desempenho das ferramentas | direcionador "Agilidade e Sustentação Operacional" (s180, proposta) |
| OE-2 | Integração e qualidade de dados | pilar "Transparência, dados e relação com o setor" (s262, proposta) |
| OE-3 | Atendimento a requisitos regulatórios | pilar "Governança institucional e regulatória" (s262, proposta) |

### 4.6 Iniciativas (22 registros, todos ILUSTRATIVOS)

**Composição:**
- 6 em execução (E01–E06);
- 8 candidatas do Ciclo Exemplo 2027 em análise (P01–P08);
- 5 demandas (D1–D5);
- 1 encerrada (B01);
- 1 em espera (H01);
- 1 cancelada (X01, `ativo:false`).

P09 não é registro: é premissa do cenário C5 (D2 qualificada). Todos os títulos terminam em "(fictício)"; nas tabelas abaixo o sufixo foi omitido para economizar espaço.

#### 4.6.1 Identificação e hierarquia

| Cód. | Título | Fase | Gerência · Comunidade · Squad | Ferramenta (vínculo) | Categoria | Objetivo | Responsável (papel fictício) | Patrocinador (papel) |
|---|---|---|---|---|---|---|---|---|
| E01 | Ajuste de desempenho em casos de grande porte do modelo de fluxo de potência | EM_EXECUCAO | FEL · RP · RP-D | ANAREDE | Sustentação | OE-1 | PO RP-D | Gerente FEL |
| E02 | Módulo de relatórios gerenciais de saídas do simulador de despacho | EM_EXECUCAO | FEN · PPE · PPE-C | BALPONTA | Evolução | OE-2 | PO PPE-C | Gerente FEN |
| E03 | Adequação do modelo de previsão de vazões ao requisito regulatório fictício R-00 | EM_EXECUCAO | FER · HID · HID-A | PREVIVAZ | Obrigatória | OE-3 | PO HID-A | Gerente FER |
| E04 | PoC de visualização de resultados de simulações de transitórios eletromagnéticos | EM_EXECUCAO | FEG · PEL · — | — | Inovação | **(vazio)** | Líder técnico PEL | Gerente FEG |
| E05 | Modernização do ambiente de execução dos modelos energéticos de médio prazo | EM_EXECUCAO | FEN · PPE · PPE-A | NEWAVE | Sustentação | OE-1 | PO PPE-A | Gerente FEN |
| E06 | Integração do modelo de previsão de carga de curtíssimo prazo à base corporativa | EM_EXECUCAO | FER · CRG · CRG-A | PREV CARGA DESSEM | Evolução | OE-2 | PO CRG-A | Gerente FER |
| P01 | Adequação do modelo de programação diária ao requisito regulatório fictício R-01 | EM_ANALISE | FEN · PPE · PPE-B | DESSEM | Obrigatória | OE-3 | PO PPE-B | Gerente FEN |
| P02 | Migração do repositório de dados hidrometeorológicos para nova plataforma | EM_ANALISE | FER · HID · HID-A | — | Evolução | OE-2 | PO HID-A | Gerente FER |
| P03 | Painel de qualidade dos dados de entrada, fase 2: modelos de médio e curto prazo | EM_ANALISE | FEN · PPE · PPE-A | DECOMP | Evolução | OE-2 | PO PPE-A | Gerente FEN |
| P04 | PoC de aprendizado de máquina para previsão de carga | EM_ANALISE | FEG · PEN · — | — | Inovação | OE-1 | Líder técnico PEN | Gerente FEG |
| P05 | Refatoração do código legado do modelo chuva-vazão | EM_ANALISE | FER · HID · HID-A | SMAP/ONS | Sustentação | OE-1 | PO HID-A | Gerente FER |
| P06 | Automação de testes de regressão de versões dos modelos hidrológicos | EM_ANALISE | FER · HID · HID-A | SMAP/ONS | Evolução | OE-1 | PO HID-A | Gerente FER |
| P07 | Gestão documental de versões e manuais dos modelos de transitórios eletromagnéticos | EM_ANALISE | FEL · TEM · TEM-B | — | Sustentação | OE-1 | PO TEM-B | Gerente FEL |
| P08 | Integração de novas fontes de dados meteorológicos às previsões eólicas | EM_ANALISE | FER · GRV · GRV-A | WEOL | Evolução | OE-2 | PO GRV-A | Gerente FER |
| D1 | Corrigir defeito pontual no relatório de saída do modelo de previsão de carga mensal | DEMANDA | FER · CRG · CRG-A | PREV CARGA PMO | — | **(vazio)** | PO CRG-A | **(vazio)** |
| D2 | Adequar o modelo de geração de cenários de vazões ao requisito regulatório fictício R-02 | DEMANDA | FER · HID · HID-A | GEVAZP | candidata a Obrigatória | OE-3 | PO HID-A | Gerente FER |
| D3 | Avaliar nova metodologia de previsão de vazões com aprendizado profundo | DEMANDA | FER · HID · — | — | — | OE-1 | Líder da comunidade HID | Gerente FER |
| D4 | Painel de validação dos dados de entrada do modelo de programação diária | DEMANDA | FEN · PPE · PPE-B | DESSEM | — | OE-2 | PO PPE-B | Gerente FEN |
| D5 | Nova saída de sensibilidade no modelo de programação diária, solicitada pela área usuária | DEMANDA | FEN · PPE · PPE-B | DESSEM | — | OE-2 | PO PPE-B | Gerente FEN |
| B01 | Painel de qualidade dos dados de entrada, fase 1: modelo energético de médio prazo | ENCERRADA (31/03/2026) | FEN · PPE · PPE-A | NEWAVE | Evolução | OE-2 | PO PPE-A | Gerente FEN |
| H01 | Estudo de co-simulação EMT–RMS | EM_ESPERA (desde 15/04/2026) | FEG · PEL · — | — | Inovação | OE-1 | Líder técnico PEL | Gerente FEG |
| X01 | Customização visual das telas do programa de análise harmônica | CANCELADA (`ativo:false`) | FEL · RP · RP-D | HARMZS | Evolução | **(vazio)** | PO RP-D | Gerente FEL |

#### 4.6.2 Classificação, origem, ciclo e datas

| Cód. | Origem | Canal | CT PMO-PLD | Horiz. | Ciclo | Entrada | Data planejada (baseline) | Data prevista atual | Criticidade / impacto (texto livre, não usado em cálculo) | TRL esperado | Link operacional |
|---|---|---|---|---|---|---|---|---|---|---|---|
| E01 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | EX-2026 | 10/02/2026 | 18/12/2026 | 18/12/2026 | média / estudos elétricos | n/a | ado…/E01 |
| E02 | ESTRATEGICA | USUARIOS_INTERNOS | não | H1 | EX-2026 | 15/01/2026 | 27/11/2026 | 26/03/2027 | média / áreas usuárias | n/a | ado…/E02 |
| E03 | REGULATORIA | CT_PMO_PLD | sim | H1 | EX-2026 | 20/11/2025 | 26/02/2027 | 31/03/2027 | alta / requisito regulatório | n/a | ado…/E03 |
| E04 | ESTRATEGICA | USUARIOS_INTERNOS | não | H3 | EX-2026 | 02/03/2026 | 01/12/2026 | 01/12/2026 | baixa / exploratório | 3→4 | ado…/E04 |
| E05 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | EX-2026 | 15/10/2025 | 30/10/2026 | 29/01/2027 | alta / rodadas mensais | n/a | ado…/E05 |
| E06 | ESTRATEGICA | USUARIOS_INTERNOS | não | H1 | EX-2026 | 06/04/2026 | **(vazio)** | 30/04/2027 | média / carga manual | n/a | ado…/E06 |
| P01 | REGULATORIA | CT_PMO_PLD | sim | H1 | EX-2027 | 20/05/2026 | — | — | alta / regulatório | n/a | ado…/P01 |
| P02 | ESTRATEGICA | USUARIOS_INTERNOS | não | H2 | EX-2027 | 02/06/2026 | — | — | média / dados | n/a | ado…/P02 |
| P03 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | EX-2027 | 10/06/2026 | — | — | média / dados de entrada | n/a | ado…/P03 |
| P04 | ESTRATEGICA | USUARIOS_INTERNOS | não | H3 | EX-2027 | 25/06/2026 | — | — | baixa / exploratório | 3→5 | ado…/P04 |
| P05 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | EX-2027 | 12/05/2026 | — | — | alta / dívida técnica | n/a | ado…/P05 |
| P06 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | EX-2027 | 18/06/2026 | — | — | média / qualidade de versões | n/a | ado…/P06 |
| P07 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | EX-2027 | 01/07/2026 | — | — | baixa / documentação | n/a | ado…/P07 |
| P08 | ESTRATEGICA | USUARIOS_INTERNOS | não | H2 | EX-2027 | 08/07/2026 | — | — | média / previsão eólica | n/a | ado…/P08 |
| D1 | OPERATIVA | CENTRAL_ATENDIMENTO | não | — | — | 20/09/2026 | — | — | — | n/a | itsm…/D1 |
| D2 | REGULATORIA | CT_PMO_PLD | sim | H1 | — | 10/07/2026 | — | — | alta / regulatório | n/a | itsm…/D2 |
| D3 | ESTRATEGICA | USUARIOS_INTERNOS | não | H3 | — | 01/08/2026 | — | — | — | 2→4 | itsm…/D3 |
| D4 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | — | 25/09/2026 | — | — | — | n/a | itsm…/D4 |
| D5 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | — | 01/09/2026 | — | — | — | n/a | itsm…/D5 |
| B01 | OPERATIVA | USUARIOS_INTERNOS | não | H1 | EX-2025 | 02/06/2025 | 31/03/2026 | 31/03/2026 | média / dados de entrada | n/a | ado…/B01 |
| H01 | ESTRATEGICA | USUARIOS_INTERNOS | não | H3 | EX-2026 | 20/01/2026 | — | **15/09/2026 (desatualizada)** | média / exploratório | 2→4 | ado…/H01 |
| X01 | OPERATIVA | CENTRAL_ATENDIMENTO | não | H1 | EX-2026 | 10/04/2026 | — | — | baixa / cosmético | n/a | ado…/X01 |

`ado…` = `https://ado.exemplo.invalid`; `itsm…` = `https://itsm.exemplo.invalid`.

#### 4.6.3 Descrição, benefício esperado e vínculos

| Cód. | descricaoObjetivo (resumo) | Benefício esperado (texto) | Obrigatoriedade / evidência | Dependências | Pessoa-chave K / exclusividade |
|---|---|---|---|---|---|
| E01 | Reduzir o tempo de execução de casos grandes | Tempo de execução menor (KPI a definir) | — | — | — |
| E02 | Padronizar relatórios gerenciais de saídas | Relatórios padronizados para áreas usuárias | — | Dep2: depende de E05 | — |
| E03 | Atender requisito fictício R-00 | Cumprir R-00 no prazo | Sim · "documento fictício R-00/2025: ILUSTRATIVO", anexada | Dep3 (resolvida) | — |
| E04 | Testar visualização interativa de resultados EMT | Avaliar viabilidade | — | — | — |
| E05 | Estabilizar o ambiente de execução | Ambiente estável para as rodadas mensais | — | bloqueia E02 (Dep2) | — |
| E06 | Integrar dados de entrada à base corporativa | Eliminar carga manual | — | Dep1: comunidade PLA | — |
| P01 | Atender requisito fictício R-01 | Cumprir R-01 | Sim · "ofício fictício R-01/2026: ILUSTRATIVO", anexada | — | — |
| P02 | Migrar o repositório hidrometeorológico | Base única e versionada | — | habilita P08 (Dep4, a confirmar) | K |
| P03 | Validar automaticamente lotes de entrada (fase 2) | "elevar o % de lotes validados de **60%** para 95%" (armadilha: a linha de base correta é 78%) | — | — | K |
| P04 | PoC com critérios de sucesso e gate de escala | Avaliar ganho de acurácia | — | — | grupo X-AMB (desligado) |
| P05 | Refatorar código sem testes conhecido por uma só pessoa | Reduzir dívida técnica e dependência | — | atividade B do cronograma depende de P06 | K |
| P06 | Automatizar regressão entre versões | Menos falhas de regressão | — | — | K |
| P07 | Organizar versões e manuais | Manuais e versões rastreáveis | — | — | — |
| P08 | Incorporar novas fontes meteorológicas | Previsão eólica melhor | — | Dep4: exige P02 (a confirmar) | K · grupo X-AMB (desligado) |
| D1 | Correção pontual de defeito | — | — | — | — |
| D2 | Adequação regulatória | Cumprir R-02 | candidata · documento **não anexado** | — | — |
| D3 | Nova metodologia de previsão | Avaliar método | — | — | — |
| D4 | Validar dados de entrada | — | — | redundante com P03 | — |
| D5 | Nova saída de sensibilidade | — | — | — | — |
| B01 | Validar lotes de entrada (fase 1) | BEN-01 e BEN-02 (§4.15) | — | — | — |
| H01 | Avaliar co-simulação EMT–RMS | Avaliar viabilidade | — | aguarda base de casos EMT validada | — |
| X01 | Nova identidade visual das telas | — | — | — | — |

#### 4.6.4 Execução e financeiro (EX-2026; fonte "Consolidação ilustrativa (ERP fictício)", dataReferencia 30/09/2026; R$ mi)

Convenção R37: uma linha por iniciativa, com o orçamento total (BAC) no período de início. `previsao` = previsão declarada no término.

| Cód. | BAC | AC (realizado) | Previsão declarada | % físico real | % físico planejado | Sinal declarado | Fornecedor |
|---|---|---|---|---|---|---|---|
| E01 | 0,80 | 0,50 | 0,80 | 70% | 70% | Verde | Gama |
| E02 | 1,50 | 1,20 | **1,50** | 50% | 70% | **Verde** | Beta |
| E03 | 2,00 | 0,90 | 2,00 | 45% | 50% | Amarelo | Alfa |
| E04 | 0,30 | 0,08 | 0,30 | 30% | 30% | Verde | Beta |
| E05 | 1,40 | 1,30 | 1,80 | 60% | 80% | Vermelho | Alfa |
| E06 | 0,60 | 0,20 | 0,60 | 35% | **(vazio)** | (não informado) | Alfa |
| B01 | 0,35 | 0,33 | 0,35 | 100% | 100% | — | Gama |
| H01 | 0,40 | 0,05 | 0,40 | 10% | — | — | — · **fonte vazia** (`SOURCE_REQUIRED`) |
| X01 | 0,15 | 0,02 | — | 5% | — | — | Beta |

Fornecedores Alfa, Beta e Gama são fictícios.

#### 4.6.5 Candidatas do Ciclo Exemplo 2027 (P01–P08)

- **FTE:** em `demandasCapacidade` (período 2027, unidade FTE, fonte "estimativa da squad: ordem de grandeza").
- **Custo:** em `financeiro` (2027, fonte "Estimativa ilustrativa: ordem de grandeza", dataReferencia 18/09/2026).
- **Notas:** avaliação vigente.
- **P e I:** um risco aberto por candidata (§4.9).

| Cód. | Cat. | Ger. | FTE | R$ mi | C1 | C2 | C3 | C4 | C5 | P | I | R | Mitigação (`acao`) | Obrig. | H | K |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P01 | OBR | FEN | 3,0 | 1,20 | 4 | 5 | 5 | 4 | 4 | 3 | 5 | 15 | "Validar a interpretação do requisito com a área usuária antes de desenvolver" | Sim | H1 | — |
| P02 | EVO | FER | 2,5 | 0,90 | 3 | 3 | 2 | 4 | 3 | 4 | 3 | 12 | "Detalhar o escopo da migração" | — | H2 | ✓ |
| P03 | EVO | FEN | 1,0 | 0,30 | 3 | 4 | 3 | 4 | 5 | 1 | 2 | 2 | (vazio) | — | H1 | ✓ |
| P04 | INO | FEG | 1,5 | 0,50 | 4 | 3 | 2 | 2 | 2 | 4 | 2 | 8 | "PoC com critérios de sucesso e gate de escala" | — | H3 | — |
| P05 | SUS | FER | 4,0 | 1,60 | 3 | 4 | 3 | **5** | 3 | 4 | 4 | **16** | **(vazio)** | — | H1 | ✓ |
| P06 | EVO | FER | 2,0 | 0,60 | 4 | 4 | 3 | 4 | 4 | 2 | 3 | 6 | (vazio) | — | H1 | ✓ |
| P07 | SUS | FEL | 1,0 | 0,25 | 2 | 2 | 2 | 3 | 5 | 1 | 1 | 1 | (vazio) | — | H1 | — |
| P08 | EVO | FER | 2,0 | 0,80 | 4 | 4 | 3 | 3 | 3 | **4** | 3 | **12** | "Confirmar com a equipe técnica se depende de P02; negociar acordo de dados" | — | H2 | ✓ |

**Gabarito (pesos v1):**

| Cód. | S | N | N/FTE | N/R$ mi | R |
|---|---|---|---|---|---|
| P01 | 4,45 | 86,25 | 28,75 | 71,9 | 15 |
| P02 | 2,95 | 48,75 | 19,50 | 54,2 | 12 |
| P03 | 3,60 | 65,00 | **65,00** | **216,7** | 2 |
| P04 | 2,85 | 46,25 | 30,83 | 92,5 | 8 |
| P05 | 3,55 | 63,75 | 15,94 | 39,8 | 16 |
| P06 | 3,80 | 70,00 | 35,00 | 116,7 | 6 |
| P07 | 2,45 | 36,25 | 36,25 | 145,0 | 1 |
| P08 | 3,55 | 63,75 | 31,88 | 79,7 | 12 |

- **Ranking com desempate:** P01, P06, P03, **P08** (R 12), P05 (R 16), P02, P04, P07.
- **Demanda total:** 17,0 FTE e R$ 6,15 mi.

#### 4.6.6 Demandas D1–D5: campos usados na triagem

| Cód. | Entrada | Idade em 03/10 | Patrocinador | Objetivo | Estimativa informada | itemDePortfolio | exigeNovaMetodologia | redundanteCom | outroFluxo | escopoFEG |
|---|---|---|---|---|---|---|---|---|---|---|
| D1 | 20/09/2026 | 13 d | (vazio) | (vazio) | (vazia) | **não** (correção pontual; registro de origem no ITSM) | não | — | **sim** (ITSM/ADO da CRG-A) | sim |
| D2 | 10/07/2026 | **85 d** | Gerente FER | OE-3 | **3.200 HORAS**; custo R$ 0,6 mi | sim | não | — | não | sim |
| D3 | 01/08/2026 | **63 d** | Gerente FER | OE-1 | 1,0 FTE | sim | **sim** | — | não | sim |
| D4 | 25/09/2026 | 8 d | Gerente FEN | OE-2 | 0,5 FTE | sim | não | **P03** | não | sim |
| D5 | 01/09/2026 | 32 d | Gerente FEN | OE-2 | **(vazia)** | sim | não | — | **não** | **sim** |

Idade mediana: 32 dias. Acima de 60 dias: D2 e D3.

### 4.7 Financeiro: candidatas e encerradas

| Iniciativa | Período | orcamentoPlanejado | realizado | fonte |
|---|---|---|---|---|
| P01..P08 | 2027-01-01 | custo da §4.6.5 | 0 | "Estimativa ilustrativa: ordem de grandeza" |
| B01 | 2025-07-01 | 0,35 | 0,33 | "Consolidação ilustrativa (ERP fictício)" |
| H01 | 2026-01-01 | 0,40 | 0,05 | **(vazia)** |
| X01 | 2026-01-01 | 0,15 | 0,02 | "Consolidação ilustrativa (ERP fictício)" |

### 4.8 Capacidade e orçamento (Ciclo Exemplo 2027; FTE; fonte "premissa ilustrativa")

**`metodo`:** "capacidade livre para novas iniciativas no ciclo, já descontada a continuidade de E02, E03, E05 e E06, antes da reserva".

| Gerência (`usoNaTrilha: RESTRICAO`, N3) | FTE | Comunidades (`usoNaTrilha: INFORMATIVO`) |
|---|---|---|
| FEL | 1,5 | TEM 1,0 · RP 0,5 |
| FEN | 3,5 | PPE 3,5 |
| FER | 4,0 | HID 2,0 · GRV 2,0 · CRG 0,0 |
| FEG | 1,0 | PEN 1,0 · PEL 0 · ACO 0 · PLA 0 |
| **Total** | **10,0** | **10,0** |

- **Orçamento do ciclo:** R$ 4,0 mi (R24).
- **H01:** `demandasCapacidade` de **880 HORAS** em 2027 (fonte "estimativa do líder técnico") → `INCOMPATIBLE_UNIT`, não somada.
- **Capacidade por comunidade:** só referência. A restrição de capacidade local (N3) é por **gerência**, porque o deck põe o balanceamento entre comunidades com o Gerente de Área (s12, proposta).

### 4.9 Riscos e impedimentos

**Das iniciativas em execução:**

| id | Iniciativa | Natureza | Descrição | Ação | Status | Prazo |
|---|---|---|---|---|---|---|
| R1 | E02 | RISCO | Escopo do módulo cresceu sem revisão da baseline (aberto em 20/09) | Revisar escopo e baseline | ABERTO | 20/10/2026 |
| R2 | E05 | IMPEDIMENTO | Atraso na entrega de servidores pelo fornecedor Alfa | Escalar ao fornecedor e à gerência | ABERTO | **30/09/2026 (vencido)** |
| R3 | E05 | RISCO | Janela de manutenção conflita com as rodadas mensais | Replanejar a janela | **EM TRATAMENTO** | 15/11/2026 |
| R4 | E03 | RISCO | Interpretação do requisito fictício R-00 em discussão | Reunião com a área usuária | ABERTO | 15/12/2026 |
| R5 | E01 | RISCO | Perda de desempenho em casos grandes | Otimização aplicada | RESOLVIDO | — |
| R6 | E06 | IMPEDIMENTO | Acesso à base corporativa pendente | Solicitar liberação | **(vazio)** | 15/10/2026 |
| R7 | E04 | RISCO | Biblioteca de visualização sem suporte | Substituída | FECHADO | — |

**Das candidatas** (natureza RISCO, status ABERTO, sem prazo):

| id | Iniciativa | Descrição | P | I |
|---|---|---|---|---|
| RK-P01 | P01 | Interpretação do requisito R-01 pode mudar o escopo | 3 | 5 |
| RK-P02 | P02 | Volume de dados e regras de transformação indefinidos | 4 | 3 |
| RK-P03 | P03 | Regras de validação podem gerar falsos alertas | 1 | 2 |
| RK-P04 | P04 | Dados históricos podem ser insuficientes para treinar o modelo | 4 | 2 |
| RK-P05 | P05 | Comportamento do código legado pouco documentado; conhecido por uma só pessoa | 4 | 4 |
| RK-P06 | P06 | Cobertura inicial de casos de teste insuficiente | 2 | 3 |
| RK-P07 | P07 | Baixa adesão ao novo padrão documental | 1 | 1 |
| RK-P08 | P08 | Fonte externa nova, sem contrato de dados; possível dependência de P02 | 4 | 3 |

### 4.10 Dependências

| id | Origem | Depende de | Tipo | Descrição | Status | Data | Confirmada |
|---|---|---|---|---|---|---|---|
| Dep1 | E06 | comunidade PLA | TEMPORAL | Liberação de acesso e ambiente de integração | ABERTA | 15/10/2026 | sim |
| Dep2 | E02 | iniciativa E05 | TEMPORAL | Os relatórios dependem do novo ambiente de execução | ABERTA | 29/01/2027 | sim |
| Dep3 | E03 | comunidade PPE | TEMPORAL | Validação do impacto nos insumos do modelo de médio prazo | RESOLVIDA | — | sim |
| Dep4 | P08 | iniciativa P02 | **LOGICA** | A integração usaria a nova plataforma de dados | **A CONFIRMAR** | — | **não** |

### 4.11 Avaliações (append-only; registradoPor "Comitê ilustrativo"; versaoPesos v1; simulacao true)

| id | Iniciativa | registradoEm | notasCriterios | alinhamentoEstrategico (texto) | requisitoRegulatorioInstitucional (texto; só evidência de obrigatoriedade) | trl |
|---|---|---|---|---|---|---|
| AV-P01 | P01 | 28/08/2026 | 4,5,5,4,4 | contribui diretamente para OE-3 | ofício fictício R-01/2026 | n/a |
| AV-P02 | P02 | 28/08/2026 | 3,3,2,4,3 | apoia OE-2 em parte | — | n/a |
| AV-P03 | P03 | 28/08/2026 | 3,4,3,4,5 | apoia OE-2 em parte | — | n/a |
| AV-P04 | P04 | 28/08/2026 | 4,3,2,2,2 | contribui para OE-1 | — | 3→5 |
| AV-P05a | P05 | **15/06/2026** | 3,4,3,**4**,3 (S 3,40; N 60,00) | apoia OE-1 em parte | — | n/a |
| AV-P05b | P05 | **18/09/2026** (vigente) | 3,4,3,**5**,3 | apoia OE-1 em parte | — | n/a |
| AV-P06 | P06 | 28/08/2026 | 4,4,3,4,4 | contribui diretamente para OE-1 | — | n/a |
| AV-P07 | P07 | 28/08/2026 | 2,2,2,3,5 | vínculo genérico | — | n/a |
| AV-P08 | P08 | 28/08/2026 | 4,4,3,3,3 | contribui diretamente para OE-2 | — | n/a |

**Evidências para a avaliação às cegas** (N2). Cada frase corresponde a uma âncora da rubrica:

| Iniciativa | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| **P06** (4,4,3,4,4) | "contribui diretamente para OE-1" | "elimina falha recorrente de regressão em 2 modelos hidrológicos" | "sem data-limite; o risco cresce a cada versão" | "reduz risco recorrente em várias rodadas" | "a equipe já automatizou testes em outro modelo" |
| **P03** (3,4,3,4,5) | "apoia OE-2 em parte; é fase 2 de solução existente" | "melhora os dados de entrada de 2 modelos" | "sem data-limite; mantém retrabalho manual" | "reduz o risco recorrente de rodar com dado inconsistente" | "a fase 1 (B01) foi entregue com a mesma solução" |
| **P05** (3,4,3,5,3) | "apoia OE-1 em parte" | "melhoria relevante em vários processos que usam o modelo chuva-vazão" | "o atraso aumenta aos poucos o custo de manutenção" | "remove dívida técnica severa: código sem testes, conhecido por uma só pessoa" | "refatoração extensa, com incerteza sobre o comportamento legado" |

### 4.12 Fóruns e fotografia

| Código | Nome | Tipo | dataCorte | Status | Usado em |
|---|---|---|---|---|---|
| FR-SET | [Simulado] Fórum de Acompanhamento de Portfólio: set/2026 | ACOMPANHAMENTO_PORTFOLIO | 04/09/2026 | REALIZADO (fotografia SN-SET FECHADA) | N2 (o que mudou) |
| FR-OUT | [Simulado] Fórum de Acompanhamento de Portfólio: out/2026 | ACOMPANHAMENTO_PORTFOLIO | 03/10/2026 | EM_PREPARACAO (`pautaItens: []`, `observacoes: ''`) | N1 (rascunho de pauta) e N2 (fotografia) |
| FR-GATE | [Simulado] Sessão de gate: Ciclo Exemplo 2027 | SESSAO_GATE_SIMULADA | 30/10/2026 | PLANEJADO | N2 |
| FR-CICLO | [Simulado] Planejamento do Portfólio: Ciclo Exemplo 2027 | PLANEJAMENTO_PORTFOLIO | 16/11/2026 | PLANEJADO | N3 |

**Fotografia SN-SET v1** (FECHADO, `geradoEm` 04/09/2026):
- **Como é gerada:** na carga, por `PF.calc.indicadoresFotografia(PF.calc.estadoEm(PF.base, '2026-09-04'))`. `estadoEm` reverte as alterações do histórico semente posteriores à data: as de E02 e a criação de R1. É a **mesma função** usada nas fotografias da aprendiz, para que o "o que mudou" compare esquemas iguais. O hash é calculado na carga.
- **Resultado:**
  - `iniciativasJson` (sinais): E01 Verde · E02 **Amarelo** (físico 45%, AC 0,75, prevista 29/01/2027, desvio 2, índice 0,90; declarado Amarelo) · E03 Amarelo · E04 Verde · E05 Vermelho · E06 Cinza;
  - `indicadoresJson`: emExecucao 6 · %vermelho por contagem 16,7% · %orçamento em vermelho **21,2%** · riscos e impedimentos abertos 4 · dependências abertas 2 · divergências de sinal 0 · CPI do portfólio **0,88**;
  - `decisoesPendentesJson`: ["D2 e D3 aguardando triagem"];
  - `filtrosJson`: {fase:"EM_EXECUCAO"}.

### 4.13 Decisões semente (ILUSTRATIVAS, `simulacao:true`)

| id | Data | Iniciativa | tipoDecisao | Registro | Papel registrante · instância |
|---|---|---|---|---|---|
| DEC-001 | 31/03/2026 | B01 | ENCERRAR | "Entregue; medir o benefício por 12 meses" | Analista PMO · [Simulado] Fórum de Acompanhamento |
| DEC-002 | 15/04/2026 | H01 | GATE2_PAUSA_FORMAL | "Alinhada às rotas, mas com impedimento conjuntural: falta base de casos EMT validada. Gatilho: base validada e 1 FTE de modeleiro EMT disponível" (padrão Gate 2, s189) | Líder técnico PEL (R) · inovação (s196) |
| DEC-003 | 10/06/2026 | X01 | KILL | "Melhoria cosmética em ferramenta legado sem investimento estruturante (s231–s235, proposta)" | Analista PMO (recomendação) · Gerente FEL |
| DEC-004 | 04/09/2026 | E05 | REPLANEJAR | "Nova baseline de E05 (29/01/2027) **aprovada**" | **responsável: Analista de Governança e Portfólio** (erro: a analista não aprova baseline) |
| DEC-005 | 06/09/2026 | E05 | CORRECAO_REGISTRO (ref. DEC-004) | "Recomendação registrada pela analista; aprovação da baseline cabe à instância (a validar: [Simulado] Fórum de Acompanhamento coordenado pela FEG, s129, ou gerência responsável). Baseline vigente: 30/10/2026" | Analista PMO · instância a validar |

### 4.14 Histórico semente

| id | Data | Entidade · id | Campo | De → para | Justificativa |
|---|---|---|---|---|---|
| HS-01 | 10/06/2026 | iniciativa X01 | ativo | true → false | "KILL DEC-003" |
| HS-02 | 18/09/2026 | avaliação AV-P05b | (inserção) | — | "Reavaliação de C4 após diagnóstico da equipe" |
| HS-03 | 20/09/2026 | iniciativa E02 | dataPrevistaAtual | 29/01/2027 → 26/03/2027 | "Replanejamento informado pelo PO" |
| HS-04 | 20/09/2026 | risco R1 | (inserção) | — | "Escopo cresceu" |
| HS-05 | 28/09/2026 | iniciativa E02 | ragDeclarado | Amarelo → **Verde** | **(vazia)** |
| HS-06 | 30/09/2026 | iniciativa E02 | percentualFisicoReal | 45 → 50 | "Consolidação mensal" |
| HS-07 | 30/09/2026 | financeiro E02 | realizado | 0,75 → 1,20 | "Consolidação mensal" |

### 4.15 Benefícios e medições

Os benefícios têm dono (área usuária, papel) e fonte "log de execução fictício". dataBase 31/03/2026; meta em 12 meses.

| Id | Iniciativa | KPI (fictício) | Sentido | Base | Meta | Mês 3 (30/06): plan. / real | Mês 6 (30/09): plan. / real | Índice × meta (mês 6) | Índice × trajetória (mês 6) |
|---|---|---|---|---|---|---|---|---|---|
| BEN-01 | B01 | % de lotes de entrada do modelo energético validados automaticamente | Maior melhor | 60 | 90 | 67,5 / 70 | 75 / 78 | **60%** | **120%** (adiantado) |
| BEN-02 | B01 | Horas médias de preparação manual de lotes por rodada | **Menor melhor** | 40 | 20 | 35 / 39 | 30 / 36 | **20%** | **40%** (abaixo) |
| BEN-03 | P03 (proposto) | mesmo KPI de BEN-01, fase 2 | Maior melhor | **60 (errado; correto 78)** | 95 | — | — | — | — |

Lição de B01: a mesma iniciativa pode ir bem num KPI e mal em outro.

### 4.16 Cronograma ilustrativo ("Programa da cadeia hidrometeorológica"; marcos, não tarefas)

| Atividade | Iniciativa | Duração | Depende de |
|---|---|---|---|
| A | P06 | 4 meses | — |
| B | P05 | 8 meses | A ("testar antes de refatorar") |
| C | P02 | 6 meses | — |
| D | P08 | 5 meses | C |
| M | marco "Nova versão integrada" | 0 | B e D |

### 4.17 Cenários semente (gatilhos a validar)

| Cenário | Mudança | Gatilho observável | Robustez? |
|---|---|---|---|
| C0 Base | — | — | sim |
| C1 Dependência | P08 ⇒ P02 | confirmação técnica de Dep4 | sim |
| C2 Capacidade −2 | 8 FTE | 2 FTE realocados para demanda emergencial | sim |
| C3 Pesos | w4 = 40% (os demais renormalizados) | fórum decide valorizar redução de risco | sim |
| C4 Mix | D ≤ 15 pp | política de mix aprovada (s127) | sim |
| C5 Nova obrigatória | P09 = D2 qualificada: re-estimativa bottom-up da squad em 2,0 FTE (1,0 de modeleiro + 1,0 de desenvolvedor por 12 meses) e R$ 0,6 mi. Coincidir com 3.200 h ÷ 1.600 h não valida um fator geral; R25 continua `null` | evidência documental do requisito R-02 anexada | sim |
| C6 Pessimista | C1 + C2 | os dois gatilhos | sim |
| C7 Capacidade local | capacidade por gerência (R24) | Gerentes de Área não cedem FTE entre gerências | **não** (política/estresse) |
| C8 Reserva | 8,5 FTE (reserva de 15%, s166) | adoção da reserva | **não** (política) |

### 4.18 RACI e "quem decide" (proposta A&M · reconstrução do texto extraído · conferir no slide original · R38)

| Atividade | Leitura proposta | Fonte |
|---|---|---|
| Registro e triagem de demanda | PO R · PMO I | s143 |
| Redirecionamento / despriorização | PO R · PMO I | s143 |
| Encaminhar a escopo exploratório | PO R · PMO C | s143 |
| Arquivar com justificativa | PO R · PMO I | s143 |
| Avaliação de esforço e capacidade | PO R · Líder **A** · PMO C | s143 |
| Avaliação de priorização (gate da squad) | PO R/A · PMO C | s143 |
| Priorização de demanda de monitoramento/sustentação | PO R · PMO **A** (conflito com s143: R33) | s149 |
| Aprovação para implantação | PO R · Líder A · PMO C | s147 |
| Inserir iniciativa de inovação no portfólio | Líder da Comunidade Técnica R · PMO I | s196 |
| Decidir produção | Líder de Entrega A | s196 |
| Identificar e escalar impedimentos, conflitos de prioridade e dependências críticas | atribuição do Analista de Governança e Portfólio | s74 |
| Escalonamento e replanejamento | Fórum de Acompanhamento (FEG coordena) "avalia e propõe" | s129 |
| Arbitrar conflito de prioridade | Gerente Executivo FE | s71 |
| Aprovar o portfólio do ciclo | Fórum de Planejamento do Portfólio (FEG coordena); tomadores de decisão no s205: Diretores/GEs. Deliberação a validar | s127, s205 |
| Priorizar demandas do escopo do CT PMO-PLD | **Rascunho de revisão · a validar:** o comentário sugere a Comissão Gestora do CT; o slide diz que a FEG executa e operacionaliza o backlog (s63) | comentário de revisão; s63 |

### 4.19 Armadilhas plantadas (o sistema não as aponta antes da resposta)

| Armadilha | Onde | Lição | Nível |
|---|---|---|---|
| Status melancia | E02: declarado Verde (mudado sem justificativa); calculado Vermelho; previsão 1,50 × EAC 2,40 | Comparar com referência e registrar a divergência | N1/N2 |
| Sem baseline | E06 | Cinza não é Verde | N1 |
| Sem objetivo | E04 | Abrir pendência, não inventar vínculo | N1 |
| Status fora do catálogo ou vazio | R3 "EM TRATAMENTO", R6 vazio | O que não está fechado está aberto | N1 |
| Prazo vencido | R2 | Escalar a causa raiz | N1 |
| Bloqueio em cadeia | Dep2: E05 (vermelha) bloqueia E02 | Escalar E05 primeiro | N1 |
| Registro bagunçado | H01: previsão vencida, financeiro sem fonte, 880 h | `SOURCE_REQUIRED`, `INCOMPATIBLE_UNIT` | N1/N2 |
| Arquivada escondida | X01 | Arquivar não é apagar | N1 |
| Cinco saídas de triagem | D1–D5 | Cada saída tem um critério | N1 |
| Estimativa em horas | D2 (3.200 h) | Não converter sem método validado | N1/N3 |
| Registro com papel errado | DEC-004 → DEC-005 | Correção é novo registro; a analista recomenda | N1 |
| Empate criado por reavaliação | P05 × P08 (63,75) | O desempate muda a carteira, não o valor | N2 |
| Possível habilitadora com valor baixo | P02 | Questionar não é matar | N2/N3 |
| Ostra sem mitigação | P05 (R 16, `acao` vazia) | Recycle em fases | N2 |
| Matrizes diferentes | P08 é "fazer primeiro" em V×E e "ostra" em V×R | As matrizes respondem a perguntas diferentes | N2 |
| Dupla contagem de critério | C5 × P×I | Independência dos critérios | N2 |
| Ótimo sem sustentação | C0 com D = 30 pp | Diagnóstico de mix | N2 |
| Sobrecarga local | C0: FEN 114%, FEG 150%, FEL 0% | O agregado esconde o local; FTE não é fungível | N3 |
| Dependência a confirmar | P08 ⇒ P02 | Carteira possivelmente inviável | N3 |
| Política documental (s168) | P07 | Política vira restrição com custo | N3 |
| Pessoa-chave | K em 5 das 8 candidatas | Risco sistêmico | N3 |
| Linha de base de benefício | P03 propõe 60% (deveria ser 78%) | Dupla contagem de benefício | N3 |
| KPI "menor é melhor" | BEN-02 | A fórmula funciona nos dois sentidos | N3 |

### 4.20 Gabarito-resumo (sobre `PF.base`, referência 03/10/2026)

| Bloco | Valores |
|---|---|
| Sinal calculado | E01 Verde · E02 **Vermelho** (desvio 4; índice 0,63) · E03 Amarelo (desvio 1; 1,00) · E04 Verde · E05 Vermelho (desvio 3; 0,65) · E06 **Cinza** (sem baseline) |
| Horizonte em execução | E04 60_DIAS (59 d) · E01 90_DIAS (76 d) · E02, E03, E05, E06 ACIMA_90 |
| Horizonte "todas ativas" (21 ativas; instrutor) | VENCIDO 2 (B01, H01) · 60_DIAS 1 · 90_DIAS 1 · ACIMA_90 4 · SEM_DATA 13 (P01–P08, D1–D5) |
| Métodos (10 FTE; R$ 4,0 mi; P01 obrigatória) | Linha de corte P01, P06, P03, P08 = 285,00 (8,0 FTE) · Guloso N/FTE P01, P03, P07, P06, P08 = 321,25 (9,0) · **Ótimo exato P01, P03, P04, P06, P08 = 331,25** (9,5 FTE; R$ 3,40 mi) |
| EVM do portfólio | CPI 0,80 (3,35 ÷ 4,18) · SPI 0,82 (3,14 ÷ 3,82; E06 fora) |

---

## 5. NÍVEL 1 · PARTITURA · FUNDAMENTOS ("Ler o portfólio")

### 5.1 Ficha do nível

- **Pergunta-guia:** "O que temos, como está e o que pede atenção neste mês?"
- **Objetivos de aprendizagem:**
  1. Distinguir portfólio, programa, projeto e operação, e dizer o que fica no ADO, Jira ou ITSM.
  2. Localizar iniciativas em Gerência → Comunidade → Squad → Ferramenta e reconhecer uma hierarquia inválida.
  3. Classificar por fase e categoria e apontar lacunas de cadastro sem inventar valor.
  4. Aplicar a regra de sinal, identificar Cinza e divergências.
  5. Calcular e interpretar contagem × valor, média × mediana, gasto × progresso e 30/60/90.
  6. Listar riscos e dependências abertos pela regra literal.
  7. Recomendar a triagem de uma demanda em uma de cinco saídas, com justificativa e instância.
  8. Reconhecer os blocos do Pool e os fóruns propostos no deck, sabendo que são proposta.
  9. Rotular afirmações pela precedência da §2.2.
- **Pré-requisitos:** nenhum.
- **Desbloqueio do N2:** ≥ 70% das 23 perguntas graduadas, contando só acertos sem revelação, e desafio concluído.
- **Badges exibidos no N1:** Proposta A&M · A validar FEG · DFP · Ilustrativo, mais a faixa "Exercício". "Ref. de mercado" e "Rascunho de revisão" só aparecem a partir do N2.

### 5.2 Telas

#### 5.2.1 Dashboard (global, aba "Execução (N1)")

É um exercício de home executiva. Não corresponde ao contrato `getExecutiveHome` do repositório, cujos KPIs não estão definidos.

**Topo:**
- Linha de metadados.
- **Roteiro da Partitura** (stepper persistido em `PF.modState(1)`; some ao concluir o nível): 1 Mapa da FE → 2 Inventário → 3 Saúde & Prazos → 4 Indicadores → 5 Triagem → 6 Trilha do nível.
- Missões por papel (texto estático, §5.7).

**Seis cards:**

| Card | Valor | Subtítulo | Selo / oculto até |
|---|---|---|---|
| Em execução | 6 | "por fase EM_EXECUCAO" | — |
| % do orçamento em sinal vermelho | 43,9% | "33,3% por contagem" | regra didática; AQ1-02 |
| Desvio mediano de prazo | 1 mês | "média 1,6 · meses de calendário" | AQ1-05 |
| Completude cadastral | 96,7% | "58 de 60 campos" | — |
| Riscos e impedimentos abertos | 5 | "1 vencido" | AQ1-07 |
| Demandas com mais de 60 dias | 2 | "mediana 32 dias" | AQ1-09 |

**Gráficos e listas:**
- `stack` do sinal por contagem e `hbar` por R$ (selo de regra didática); `bars` 30/60/90; `bars` agrupado do mix por categoria (contagem × R$). Cada gráfico tem a tabela equivalente.
- **Onde agir** (oculto até AQ1-01): lista de exceções com link para a ficha. Ordem: vermelhas → divergências → Cinza → riscos vencidos → bloqueios por vermelha → demandas com mais de 60 dias.
- **Rascunho da pauta do [Simulado] Fórum de Acompanhamento de out/2026** (selo Exercício):
  - seleção de **até 2** iniciativas entre E01–E06 para discussão aprofundada, gravada em `foruns[FR-OUT].pautaItens[]`;
  - textarea de **até 5 linhas**, gravada em `FR-OUT.observacoes`;
  - as duas gravações geram `historico`. O N2 importa esse rascunho na Pauta do Fórum Mensal.

**Filtro e aula rápida:**
- Filtro por gerência.
- *Aula rápida:* "Gestão por exceção: o painel não mostra tudo, mostra o que está fora da tolerância. Comece pelo vermelho, depois pelas divergências e pelo cinza. Os números deste painel saem de regras didáticas a validar: não use em reporte."

#### 5.2.2 Indicadores (global)

- **Formato:** mestre-detalhe. A lista mostra nome, valor e badge.
- **Ficha do indicador:** valor e unidade; fórmula; **mostrar a conta** com os dados (ex.: "(1,50 + 1,40) ÷ 6,60 = 43,9%"; no modo exercício o resultado aparece como "?"); como interpretar; armadilha; badge; parâmetros usados com versão; data do dado; convenções (ex.: "desvio em meses de calendário").
- **Filtros:** "Nível atual" (padrão) · "Essenciais" · "Todos liberados".

#### 5.2.3 Inventário (global)

- **Tabela:** código, título, fase, gerência, comunidade (tipo), squad, ferramenta, categoria, sinal e ícones de pendência (dado sem fonte, unidade incompatível, campo vazio).
- **Filtros:** gerência, comunidade, tipo, fase, categoria e **incluir arquivadas** (desligado por padrão; X01 só aparece com ele ligado).
- **Aba Árvore:** Gerência → Comunidade → Squad → Ferramenta → iniciativas, com contagens. Siglas didáticas trazem a nota "sigla didática, não oficial".
- **Ficha:** Dados · Sinal · Riscos & Dependências · Decisões · Histórico · Rótulos. A ferramenta aparece com a nota "vínculo de catálogo; status e números são fictícios".
- **Ações (selo Exercício):**
  - **editar**, com as validações da §3.11, gravação por `PF.write` e `rowVersion++`;
  - **registrar pendência**, com tipo, campo, descrição, responsável e prazo obrigatórios;
  - **arquivar** com justificativa;
  - **abrir link**, desabilitado para `.invalid`.
- *Aula rápida:* "Inventário único: iniciativa invisível consome capacidade sem ter sido escolhida. Arquivar preserva a história; apagar não existe."

#### 5.2.4 Decisões (global)

- **Conteúdo:** registro append-only de todas as decisões, das sementes e do exercício, com o prefixo [SIMULAÇÃO].
- **Filtros:** iniciativa, tipo, nível e "só vigentes".
- **Ação "Corrigir":** cria `CORRECAO_REGISTRO` com `refDecisaoAnteriorId`; numa triagem, também `tipoDecisaoCorrigido`.
- **Aba "Exercícios anteriores":** somente leitura.
- *Aula rápida:* "Decisão errada não se apaga: registra-se a correção, que aponta para o registro anterior."

#### 5.2.5 Saúde & Prazos (`#/n1/saude`), com três abas e uma aula por aba

**Aba Sinal**
- Tabela declarado × calculado: % físico, AC/BAC, índice progresso × gasto, desvio em meses, **motivo da cor** (ex.: "desvio 4 meses ≥ 3; índice 0,63 < 0,85 → Vermelho") e filtro "só divergências".
- No modo exercício, a coluna "calculado" fica oculta até AQ1-01 e AQ1-03.
- *Aula:* "Cor é comparação com uma referência. Sem baseline, Cinza. A pior dimensão (prazo ou custo) define a cor. O desvio conta meses de calendário: (12 × ano + mês previsto) − (12 × ano + mês planejado)."

**Aba Prazos 30/60/90**
- Data de referência editável, com aviso.
- Contagem das iniciativas **em execução** por faixa.
- A alternância "Todas ativas (como a RPC `get_horizonte_datas`)" fica só no modo instrutor.
- *Aula:* "A faixa conta dias corridos até a data prevista. A própria data de referência cai na faixa de 30 dias. Data já passada é VENCIDO; sem data é SEM_DATA."

**Aba Riscos & Dependências**
- Riscos e impedimentos abertos, com os vencidos destacados.
- Dependências abertas: "X é bloqueada por Y", com destaque quando Y está vermelha.
- *Aula:* "Só está fechado o risco com status RESOLVIDO, CONCLUIDO ou FECHADO (na dependência, RESOLVIDA, CONCLUIDA ou FECHADA). Vazio ou qualquer outro texto, como 'EM TRATAMENTO', conta como aberto. Risco pode acontecer; impedimento já trava."

#### 5.2.6 Triagem (`#/n1/triagem`)

Selo Exercício e nota fixa: "Adaptação didática (DFP): no deck (s142) as saídas da triagem levam ao backlog da squad. Aqui elas são usadas como admissibilidade ao portfólio (a validar). O registro e a triagem reais acontecem no canal oficial (ITSM/ADO); aqui se treina a leitura e a recomendação."

- **Fila:** demandas em fase DEMANDA, como espelho, com link obrigatório ao registro de origem e idade em dias.
- **Checklist (R17).** Cada item mostra **o campo que o comprova**:

| Item | Pergunta | Campo |
|---|---|---|
| T1 | É item de portfólio (não tarefa nem incidente)? | `triagem.itemDePortfolio` |
| T2 | Tem patrocinador? | `patrocinador` |
| T3 | Tem vínculo com objetivo? | `objetivoEstrategicoId` |
| T4 | Está no escopo e não pertence a outro fluxo? Dica: "exige nova metodologia ou novo modelo matemático? → escopo exploratório da Comunidade Técnica (s182)" | `triagem.outroFluxo`, `triagem.exigeNovaMetodologia` |
| T5 | Não é redundante? | `triagem.redundanteComId` |
| T6 | Tem estimativa mínima? Estimativa em outra unidade conta; a unidade se resolve na qualificação | `estimativaInformada` |

- **Precedência:** T1 → T4 → T5 → T2/T3/T6 → Admitir. T1 falha → REDIRECIONAR_EXECUCAO. T4 por nova metodologia → ENCAMINHAR_EXPLORATORIO (outro fluxo → REDIRECIONAR_EXECUCAO). T5 → ARQUIVAR com vínculo. T2, T3 ou T6 → DEVOLVER.
- **Fluxo:**
  1. A aprendiz escolhe a saída e justifica (≥ 20 caracteres).
  2. Grava-se `decisoes` com `recomendacao:true`, `papelRegistrante` ("Analista: …"), `instancia: 'PO da squad (R): s143, leitura do texto extraído'`, `forumId:null` e `simulacao:true`.
  3. **Só então** aparecem a saída sugerida pela precedência e o feedback.
- **Efeito simulado "se a instância acatar"** (com histórico):

| Saída | Efeito |
|---|---|
| ADMITIR | fase `EM_ANALISE` |
| DEVOLVER | continua `DEMANDA`; gera pendência |
| REDIRECIONAR_EXECUCAO | `ativo:false`; grava só o link de destino |
| ENCAMINHAR_EXPLORATORIO | `ativo:false`; destino "Comunidade Técnica PEN" |
| ARQUIVAR | `ativo:false`; vínculo com a iniciativa redundante |

- **Aba Registro:** recomendações vigentes, com a ação **"Corrigir triagem"**, que reativa a demanda e a devolve à fila.
- *Aula:* "Triagem não é priorização: decide se a demanda entra na análise do portfólio. A analista recomenda; o PO da squad é o responsável (proposta s143)."

#### 5.2.7 Mapa da FE (`#/n1/mapa`), somente leitura, tudo rotulado

| Aba | Conteúdo | Rótulo |
|---|---|---|
| Estrutura | 4 gerências, matriz equilibrada (s8–s12), comunidades de entrega × técnicas (s13), lista de comunidades e squads (§4.4) | Proposta A&M · a validar; siglas didáticas marcadas DFP |
| Pool e papéis | **Quadro 1, Pool de Recursos de Governança (s56/s57):** Gestão de Portfólio/PMO; Governança, Riscos e Conformidade; Gestão de Contratos e Fornecedores; Estratégia e Inovação; **Líder de Comunidade Técnica**. Legenda "atuação transversal". Cobertura proposta de PMO (s111–s118): 4 HCs para 4 carteiras (Elétricas, Energéticas, Recursos e Carga, Técnicas) contra 3 analistas reais<br>**Quadro 2, Papéis de aprendizagem (Afinação FEG):** GRC (GOV + AUD), Portfólio/PMO (PORT + KPI), Contratos e Fornecedores (ORC + CONT), Interface institucional e regulatória (INST + REG), Estratégia e Inovação (INOV + MAT). Nota: "INST/REG são atribuições da FEG (s63) e do Analista de Planejamento e Estratégia (s73), não um bloco do Pool" | Quadro 1: Proposta A&M · a validar (R41). Quadro 2: A validar FEG · artefato interno (R42). Alocação das 3 analistas: a validar |
| Fóruns | Nível, periodicidade, responsável e saídas de s126–s131 e s205. Periodicidades em conflito destacadas, com as duas fontes (R05b). O nível de cada fórum vem do layout do s125 (inferência) | Proposta A&M · a validar; conflitos: A validar FEG |
| Fronteira | O que fica fora do app: tarefas e sprints (ADO, Jira, GitHub Projects), chamados (ITSM), contratos e execução financeira (ERP), e o que o app recebe: dados consolidados e link | DFP (princípio do repositório) |

A tabela de RACI ("Quem decide") fica no N2 (Exercício de Gate → aba Quem decide).

#### 5.2.8 Trilha do nível (`#/n1/trilha`)

Abas Perguntas & Respostas · Desafio · Domínio (§3.5).

### 5.3 Indicadores do N1

**Notação:**
- `A` = {i | i.ativo ∧ fase = EM_EXECUCAO};
- `bac(i)`, `ac(i)` com fonte e período (§3.10);
- `ref` = R07;
- `prevEf(i)` = max(dataPrevistaAtual, ref) (R14);
- `mesIdx(d)` = 12·ano + mês.

| ID | Indicador | Fórmula | Resultado | Unid. | Interpretação | Origem (badge) | Oculto até |
|---|---|---|---|---|---|---|---|
| I1.1 | Em execução | \|A\| | **6** | nº | Tamanho da carteira ativa | DFP | — |
| I1.2 | Mix por categoria | count(A_k)/\|A\|; Σbac(A_k)/Σbac(A) | Contagem: Sust 2 · Evo 2 · Obr 1 · Inov 1. R$: Sust 33,3% · Evo 31,8% · Obr 30,3% · Inov 4,5% | % | Contagem e valor contam histórias diferentes | DFP; taxonomia A validar FEG (R12) | — |
| I1.3 | Distribuição do sinal | count(A, sinal = cor)/\|A\|, com Cinza no denominador | V 33,3 · A 16,7 · Vm 33,3 · Cinza 16,7 | % | Retrato, não nota de saúde | A validar FEG (R13); selo regra didática | AQ1-01 |
| I1.4 | % do orçamento em vermelho | Σbac(A, Vm)/Σbac(A) | (1,50 + 1,40)/6,60 = **43,9%** | % | Dinheiro sob sinal vermelho | DFP sobre regra A validar FEG; selo | AQ1-02 |
| I1.5 | Execução orçamentária | Σac(A)/Σbac(A) | 4,18/6,60 = **63,3%** | % | Sozinho não diz nada; comparar com o físico | DFP | — |
| I1.6 | Índice progresso × gasto | div(%físicoReal, ac/bac) | E01 1,12 · E02 **0,63** · E03 1,00 · E04 1,13 · E05 **0,65** · E06 1,05 | índice | < 1: gastou mais do que avançou (prévia do CPI do N2) | DFP | AQ1-01 |
| I1.7 | Desvio de prazo | mesIdx(prevEf) − mesIdx(dataPlanejada), só com baseline | [0, 4, 1, 0, 3]: média **1,6**, mediana **1** | meses | Mostrar a distribuição; chamar de "atraso" é a validar | DFP | AQ1-05 |
| I1.8 | % no prazo | count(desvio ≤ tol)/count(com baseline) | tol 0: **40%** · tol 1: **60%** | % | Depende da tolerância (R15) | A validar FEG | — |
| I1.9 | % vinculadas a objetivo | count(objetivo ≠ null)/\|A\| | 5/6 = **83,3%** | % | Sem vínculo: por que existe? | DFP | — |
| I1.10 | Completude cadastral | campos de R10a + R10b preenchidos / (\|A\| × 10) | 58/60 = **96,7%** (faltam objetivo de E04 e baseline de E06) | % | Pré-condição para qualquer análise | DFP (R10a) / A validar FEG (R10b) | — |
| I1.11 | Idade das demandas | mediana(dias(ref − dataEntrada)); count(> R16) das em DEMANDA | mediana **32 d**; **2** acima de 60 (D2, D3) | dias | Demanda envelhecida é decisão evitada | A validar FEG (limiar) | AQ1-09 |
| I1.12 | Divergência de sinal | count(declarado ≠ null ∧ ≠ calculado)/count(declarado ≠ null) | 1/5 = **20%** (E02) | % | Status melancia | DFP | AQ1-03 |
| I1.13 | Concentração top-2 | bac das 2 maiores / Σbac(A) | (2,00 + 1,50)/6,60 = **53,0%** | % | Foco de acompanhamento | DFP | — |
| I1.14 | Horizonte 30/60/90 | R08 sobre dataPrevistaAtual, iniciativas de A | 60_DIAS 1 (E04, 59 d) · 90_DIAS 1 (E01, 76 d) · ACIMA_90 4 | nº | O que entrega no trimestre | DFP (repositório) | — |
| I1.15 | Riscos e impedimentos abertos | count(upper(status ?? 'ABERTO') ∉ fechados) das iniciativas de A; vencido = prazo < ref | **5** (R1, R2, R3, R4, R6); 1 vencido (R2); 4 iniciativas com algum aberto | nº | Regra literal do repositório | DFP (`0011`) | AQ1-07 |
| I1.16 | Dependências abertas | count(upper(status ?? 'ABERTA') ∉ fechadas); bloqueio por vermelha | **2** (Dep1, Dep2); E02 bloqueada por E05 | nº | Efeito cascata | DFP | AQ1-08 |

Essenciais do Dashboard: I1.1, I1.4, I1.7, I1.10, I1.15, I1.11.

### 5.4 Perguntas & Respostas do N1 (23, todas graduadas)

Antes de N1-C09 vem uma aula rápida com a precedência da §2.2.

#### (a) Conceituais (9)

| ID | Formato | Enunciado e alternativas | Resposta | Justificativa (aparece só ao acertar ou revelar) | Regra |
|---|---|---|---|---|---|
| N1-C01 | mc | "Qual frase descreve melhor um portfólio?"<br>A) Projetos inter-relacionados, coordenados para obter benefícios que isolados não teriam<br>B) O cronograma consolidado de todas as tarefas e entregas da gerência no ano<br>C) Projetos, programas e operações gerenciados em conjunto para atingir objetivos estratégicos<br>D) A lista de itens de trabalho do Azure DevOps ordenada pela data de entrega | **C** | A descreve programa. B e D são execução, que fica nas ferramentas de execução (Ref. PMI) | R30 |
| N1-C02 | mc | "Uma squad quer acompanhar no sistema de portfólio as tarefas da sprint e os chamados. O que responder?"<br>A) Tarefas e chamados ficam no ADO, Jira ou ITSM; o portfólio guarda a iniciativa, os dados consolidados e o link<br>B) Cadastrar cada tarefa como iniciativa, para que o painel mostre o andamento completo da squad<br>C) Manter uma planilha paralela com as tarefas e anexá-la à ficha de cada iniciativa no sistema<br>D) Cadastrar só os chamados críticos, porque os demais não interessam à gerência executiva | **A** | Princípio do repositório: o sistema não substitui ADO, Jira nem ITSM | R06 |
| N1-C03 | mc | "Segundo a proposta do deck A&M (s129), quem coordena o Fórum de Acompanhamento de Portfólio e com que periodicidade?"<br>A) O Líder de Comunidade, a cada trimestre<br>B) A Diretoria, uma vez por ano<br>C) O Product Owner, ao final de cada sprint<br>D) A FEG, mensalmente | **D** | s129 (proposta): "Responsável: FEG", mensal. Saídas: painel de status, registro de riscos e desvios, histórico de escalonamentos. É proposta: a FEG ainda valida | R05a |
| N1-C04 | multi | "Segundo o organograma proposto (s56/s57), quais blocos compõem o Pool de Recursos de Governança?" Opções: Gestão de Portfólio/PMO · Governança, Riscos e Conformidade · Gestão de Contratos e Fornecedores · Estratégia e Inovação · Líder de Comunidade Técnica · Interface institucional e regulatória · Product Owner | os **5 primeiros** | "Interface institucional e regulatória" é papel de aprendizagem do Afinação FEG, não bloco do Pool. O PO atua nas squads | R41, R42 |
| N1-C05 | mc | "E06 não tem data planejada (baseline). Qual sinal o sistema mostra?"<br>A) Verde, porque a previsão atual (abr/2027) ainda está longe<br>B) Cinza, com pendência de cadastro para registrar a baseline<br>C) Amarelo, por precaução, até a baseline ser informada<br>D) Vermelho, porque falta um dado obrigatório do cadastro | **B** | A cor compara com uma referência; sem baseline, qualquer cor é opinião. Verde passaria falsa segurança | R13 |
| N1-C06 | mc | "O que significa arquivar uma iniciativa no sistema?"<br>A) Apagar o registro para manter o inventário limpo<br>B) Mover os dados para uma planilha de histórico<br>C) Pintar a iniciativa de cinza no painel de saúde<br>D) Marcar como inativa, preservando dados, decisões e histórico | **D** | `archive_initiative` (`0012`/`0017`) e regra 4 do `data-model.md`: arquivar, nunca apagar | R06 |
| N1-C07 | mc | "Execução orçamentária de 63% na carteira em execução: isso é bom?"<br>A) Depende: é preciso comparar com o progresso físico e com o planejado até a data<br>B) Sim: sobra dinheiro e a carteira está claramente sob controle<br>C) Não: gastar pouco indica que as iniciativas estão atrasadas<br>D) Sim, desde que o número fique abaixo de 70% até o fim do ano | **A** | Gastar pouco pode ser eficiência ou paralisação; só o físico desfaz a dúvida | R30 |
| N1-C08 | mc | "Ao cadastrar uma iniciativa na comunidade PPE (FEN), qual squad o sistema aceita?"<br>A) RP-B, porque é a squad com mais capacidade livre<br>B) Qualquer squad ativa, de qualquer gerência<br>C) PPE-B, porque pertence à comunidade PPE<br>D) Nenhuma: a squad é obrigatória e precisa ser criada antes | **C** | RP-B mostra "A squad escolhida não pertence a esta comunidade" (código `HIERARCHY_MISMATCH`). A squad é opcional | R06 |
| N1-C09 | custom "Rótulo certo" | Classificar 8 afirmações com os rótulos que a interface mostra: Proposta A&M · a validar / A validar FEG / Decisão de produto (DFP) / Ilustrativo / Fonte ONS (documento aprovado). Ok com ≥ 6/8. Medalha `m-rotulo` | ver abaixo | Feedback por item, citando a regra de precedência usada | §2.2 (DFP) |

**Itens do N1-C09 e gabarito:**
1. "O deck A&M v25 (s4) propõe quatro gerências na FE: FEG, FEL, FEN e FER" → **Proposta A&M · a validar**.
2. "Desvio de 3 meses ou mais deixa a iniciativa vermelha" → **A validar FEG** (parâmetro de cálculo).
3. "Arquivar em vez de apagar; o histórico só recebe acréscimos" → **DFP** (mecânica do repositório).
4. "O deck traz o Planejamento do Portfólio como semestral (s127) e como anual (s205)" → **A validar FEG** (contradição).
5. "O sistema classifica o horizonte em 30/60/90 reproduzindo a função já implementada no repositório" → **DFP**.
6. "O sistema usa as categorias Obrigatória/Sustentação/Evolução/Inovação para calcular o mix" → **A validar FEG** (taxonomia usada em cálculo).
7. "Segundo o deck (s129), o Fórum de Acompanhamento é mensal e coordenado pela FEG" → **Proposta A&M · a validar**.
8. "E05 tem orçamento de R$ 1,40 mi e 60% de avanço físico" → **Ilustrativo**.

Nenhum item é "Fonte ONS". O feedback explica: "hoje não há documento ONS aprovado citado no sistema".

#### (b) Análise do portfólio (9), sobre `PF.base`

| ID | Formato | Pergunta | Regra de cálculo | Gabarito | `ver` |
|---|---|---|---|---|---|
| AQ1-01 | multi | Quais iniciativas em execução estão vermelhas pela regra calculada? | `PF.calc.sinal(i)` para i ∈ A | **E02, E05** | `#/n1/saude?ref=1` |
| AQ1-02 | num (%, tol 0,5) | Que % do orçamento em execução está em iniciativas com sinal vermelho? | I1.4 | **43,9** (por contagem, 33,3) | `#/indicadores?ref=1` |
| AQ1-03 | pick | Em qual iniciativa o sinal declarado diverge do calculado? | declarado ≠ calculado | **E02**. O histórico mostra a mudança para Verde em 28/09 sem justificativa | `#/n1/saude?ref=1` |
| AQ1-04 | multi | Quais iniciativas em execução têm campo obrigatório vazio? | campos R10a + R10b vazios | **E04** (objetivo) e **E06** (data planejada) | `#/inventario?ref=1` |
| AQ1-05 | num (meses, tol 0,15) | Qual o desvio mediano de prazo das iniciativas com baseline, em meses de calendário? | mediana de I1.7 | **1,0** (lista 0, 0, 1, 3, 4; média 1,6) | `#/indicadores?ref=1` |
| AQ1-06 | multi | Quais iniciativas em execução entregam em até 90 dias? | faixa ∈ {30, 60, 90} | **E04** (59 d) e **E01** (76 d) | `#/n1/saude?ref=1&aba=prazos` |
| AQ1-07 | num (tol 0) | Quantos riscos e impedimentos das iniciativas em execução estão abertos? | I1.15 | **5**. "EM TRATAMENTO" (R3) e vazio (R6) contam como abertos | `#/n1/saude?ref=1&aba=riscos` |
| AQ1-08 | pick | Qual iniciativa vermelha bloqueia outra em execução? | dependência aberta cujo alvo está vermelho | **E05** (bloqueia E02 via Dep2) | `#/n1/saude?ref=1&aba=riscos` |
| AQ1-09 | multi | Quais demandas aguardam decisão há mais de 60 dias? | dias(ref − dataEntrada) > R16 | **D2** (85 d) e **D3** (63 d) | `#/n1/triagem?ref=1` |

#### (c) Decisão de escolha (5)

**DC1-01 · custom · "Recomende a triagem da fila"**
- **Formato:** cinco seletores (D1–D5) com as cinco saídas, mais destino ou vínculo. A tela mostra o checklist com os campos comprobatórios.
- **Nota:** 1 ponto por acerto; D2 com DEVOLVER vale 0,5. Ok com ≥ 4.
- **Feedback por demanda:**

| Demanda | Gabarito | Feedback |
|---|---|---|
| D1 | REDIRECIONAR_EXECUCAO (ITSM/ADO da CRG-A) | "Correção pontual não é item de portfólio (T1)." |
| D2 | ADMITIR com "evidência pendente" | "A estimativa em horas se resolve na qualificação, sem conversão inventada." |
| D3 | ENCAMINHAR_EXPLORATORIO (Comunidade Técnica PEN) | "Nova metodologia vai para escopo exploratório (T4; árvore s182)." |
| D4 | ARQUIVAR com vínculo a P03 | "Redundante com P03 (T5)." |
| D5 | DEVOLVER | "Sem estimativa mínima (T6). Escopo FEG e fluxo próprio estão confirmados nos campos." |

**DC1-02 · decisao · "Pauta do fórum simulado de outubro"**
- **Cenário:** "Há 30 minutos para discussão aprofundada de **no máximo 2** iniciativas."
- **Configuração:** itens E01–E06; colunas sinal calculado, declarado, BAC e desvio; `limites:[{key:'n', label:'Itens', max:2, casas:0}]` com `cols.n = 1`.
- **`avaliar`:**

| Seleção | Nota | Ok | Feedback |
|---|---|---|---|
| {E02, E05} | 100 | sim | "Gestão por exceção: as duas vermelhas somam 43,9% do orçamento, e E02 ainda é melancia." |
| inclui E06 | 50 | não | "E06 é pendência de cadastro: resolve-se fora da pauta, com responsável e prazo." |
| inclui E03 | 60 | não | "Amarela com desvio de 1 mês e índice 1,00: entra como informe." |
| inclui uma verde | ≤ 30 | não | — |

**DC1-03 · mc**
- **Enunciado:** "E05 está vermelha, tem impedimento vencido (R2) e bloqueia E02 (Dep2). O que você leva primeiro ao fórum?"
- **Alternativas:**
  - A) E02, porque é a iniciativa com status melancia
  - **B) E05, a causa raiz: R2 vencido trava E05 e, pela dependência, E02**
  - C) Nenhuma; esperar a próxima consolidação mensal
  - D) As duas juntas, como um ponto de "atenção geral"
- **Resposta:** B. A analista identifica e escala impedimentos (s74, proposta).
- **Feedback dos erros:** A: "E02 precisa de registro, mas parte do desvio dela vem de E05." D: "Escalonamento sem foco não gera decisão."

**DC1-04 · mc**
- **Enunciado:** "D2 pede adequação regulatória, tem patrocinador e objetivo, mas o documento do requisito não foi anexado. A estimativa veio em horas. O que você recomenda?"
- **Alternativas:**
  - A) Marcar como Obrigatória e enviar direto para a execução da squad
  - B) Arquivar até que o documento seja anexado ao registro de origem
  - C) Devolver e encerrar a demanda; o canal reabre quando houver documento
  - **D) Admitir para análise como "candidata a obrigatória: evidência pendente"**
- **Resposta:** D.
- **Feedback dos erros:** A: "Obrigatória sem evidência é inventar regra." B: "Arquivar apaga a janela regulatória do radar." C: "Perde a janela regulatória e a rastreabilidade."
- **Nota no feedback:** "Quem prioriza demandas no escopo do CT PMO-PLD é tema do N2."

**DC1-05 · mc**
- **Enunciado:** "A responsável por E06 diz: 'Está verde, confie em mim. Grave a previsão atual (30/04/2027) como baseline para fechar o dado'."
- **Alternativas:**
  - **A) Manter Cinza e abrir pendência de baseline com responsável e prazo; a baseline precisa de aprovação registrada**
  - B) Aceitar Verde, porque a responsável conhece a iniciativa melhor que o painel
  - C) Gravar a baseline igual à previsão atual para fechar o dado ainda hoje
  - D) Arquivar E06 até que a baseline seja aprovada pelo fórum competente
- **Resposta:** A.
- **Feedback dos erros:** C: "Baseline retroativa igual à previsão zera o desvio por construção: é maquiagem." D: "Arquivar tira do radar uma iniciativa em execução."

**Distribuição das corretas nas mc do N1** (10): A 3 · B 2 · C 2 · D 3 (máximo 30%).

### 5.5 Desafio do N1: "Partitura limpa para o fórum simulado de outubro"

O checklist é vivo: cada passo tem uma função `verificar`.

| Passo | Tarefa | Verificação |
|---|---|---|
| 1 | Registrar pendências para E04 (`objetivoEstrategicoId`) e E06 (`dataPlanejada`) | 2 `pendencias` do tipo CAMPO_VAZIO, com responsável e prazo, e os campos **continuam vazios** em `PF.db()` |
| 2 | Registrar a divergência de E02 | 1 pendência do tipo `DIVERGENCIA_STATUS` em E02, com descrição de ≥ 20 caracteres. Medalha `m-melancia` |
| 3 | Cinco contas "e se?" (variantes que não aparecem em nenhuma tela; calculadas por `PF.calc` sobre cópia de `PF.base`) | (a) % do orçamento em vermelho se E03 também ficar vermelha = **74,2%** (±0,5) · (b) índice progresso × gasto de E05 se o realizado subir para R$ 1,40 mi = **0,60** (±0,02) · (c) desvio mediano se E02 terminar na baseline = **0** (±0,15) · (d) completude se E04 receber objetivo = **98,3%** (±0,5) · (e) riscos e impedimentos abertos se R3 for marcado RESOLVIDO = **4** |
| 4 | Recomendar a triagem de D1–D5 | Decisão **vigente** de cada demanda = gabarito da §5.4 em ≥ 4 das 5 (D2 com DEVOLVER vale meio acerto); cada uma com `instancia` preenchida e diferente do registrante e `recomendacao:true` |
| 5 | Pauta e resumo | `FR-OUT.pautaItens` = {E02, E05}; `FR-OUT.observacoes` com ≤ 5 linhas, citando E02 e E05 e contendo "ilustrativo" |

**Conclusão:** `done({ok, nota})`, com `nota` = % de passos. `ok` exige os passos 1, 4 e 5 e pelo menos 4 dos 5.

### 5.6 Critérios de aceite do N1

- Dashboard (modo instrutor) mostra 6 / 43,9% / 1 mês / 96,7% / 5 (1 vencido) / 2. No modo exercício, os cards marcados aparecem com "?" até a pergunta correspondente ser resolvida.
- Sinal: E01 V, E02 Vm, E03 A, E04 V, E05 Vm, E06 Cinza. Divergência só em E02.
- 30/60/90 em execução: E04 60 d, E01 90 d, 4 acima de 90. "Todas ativas" (instrutor): VENCIDO 2 (H01, B01), SEM_DATA 13.
- X01 só aparece com "incluir arquivadas"; não existe botão de excluir.
- Editar incrementa `rowVersion` e grava `historico`.
- Mensagens: comunidade de outra gerência mostra "A comunidade escolhida não pertence a esta gerência" (`HIERARCHY_MISMATCH`); URL inválida mostra `INVALID_URL`. A ficha de H01 mostra "valor sem fonte" (`SOURCE_REQUIRED`) e "linha em horas" (`INCOMPATIBLE_UNIT`).
- Triagem: a sugestão só aparece depois de registrada a recomendação; "Corrigir triagem" reativa a demanda.
- Errar uma pergunta não revela a resposta; "Ver resposta" retira o crédito.

### 5.7 Missões por papel (texto estático; papéis de aprendizagem do Afinação, a validar; não contam nota)

| Papel | Missão N1 |
|---|---|
| Gestão de Portfólio/PMO | Montar o rascunho de pauta por exceção e o resumo de 5 linhas |
| Governança, Riscos e Conformidade | Achar no histórico a alteração sem justificativa (E02, 28/09), os status fora do catálogo (R3, R6) e o registro corrigido DEC-004 → DEC-005 |
| Contratos e Fornecedores | Explicar gasto × progresso de E02 e E05; ligar R2 ao fornecedor Alfa |
| Estratégia e Inovação | Tratar E04 sem objetivo; ler a pausa formal de H01 (Gate 2) e o seu gatilho |
| Interface institucional e regulatória | Conferir a evidência de E03 e a ausência dela em D2 |

---

## 6. NÍVEL 2 · ARRANJO · PRIORIZAÇÃO ("Escolher o que cabe e acompanhar")

### 6.1 Ficha do nível

- **Pergunta-guia:** "O que fazer primeiro, cabendo na capacidade, e como acompanhar?"
- **Estrutura:**
  - **Parte A · Escolher:** Critérios → Pontuação → Seleção → Gate.
  - **Parte B · Acompanhar:** EVM → Fórum Mensal.
- **Objetivos:**
  1. Aplicar rubricas e calcular S e N.
  2. Explicar por que os pesos estão a validar e relacionar C1–C5 aos critérios do deck sem tratá-los como iguais.
  3. Classificar em valor × esforço e valor × risco e explicar por que as matrizes diferem (P08).
  4. Calcular a capacidade discricionária e a utilização da demanda.
  5. Montar e comparar carteiras por linha de corte, guloso e ótimo exato.
  6. Calcular o índice D.
  7. Calcular e interpretar PV, EV, AC, SPI, CPI, EAC e EAC × previsão declarada.
  8. Conduzir o Fórum Mensal: pauta, "o que mudou", escalonamento com instância e fotografia FECHADA.
  9. Registrar recomendações de gate com versão dos pesos e instância.
- **Pré-requisito:** N1 concluído. O nível retoma melancia, Cinza, triagem e a pauta de FR-OUT.
- **Desbloqueio do N3:** ≥ 70% das 27 perguntas graduadas e desafio concluído.
- **Badges novos:** Ref. de mercado; Rascunho de revisão · a validar.

### 6.2 Telas (Parte A · Escolher)

#### 6.2.1 Critérios & Pesos (`#/n2/criterios`)

**Aba Critérios e rubricas:**

| Crit. | Nome | Relação aproximada com o deck (interpretação DFP) | Onde a nota é gravada | Peso v1 |
|---|---|---|---|---|
| C1 | Alinhamento estratégico | "alinhamento à estratégia tecnológica" (s141), "alinhadas ao roadmap" (s168) | `avaliacoes.notasCriterios.C1`; texto em `alinhamentoEstrategico` | 30% |
| C2 | Criticidade sistêmica / impacto na confiabilidade | "criticidade sistêmica" (s138), "impacto sistêmico" (s168) | `notasCriterios.C2` | 25% |
| C3 | Urgência / janela regulatória e operacional | "janela regulatória e operacional" (s138), "nível de urgência" (s143) | `notasCriterios.C3` | 20% |
| C4 | Redução de risco (técnico, de dependência, de lock-in) | dívida técnica (s166), dependência de terceiros (s227) | `notasCriterios.C4` (**não** usa `riscosResumo`, que descreve o risco de execução) | 15% |
| C5 | Viabilidade / maturidade técnica | "metodologia conhecida e madura", "complexidade" (s143) | `notasCriterios.C5` | 10% |

**Rubricas (a validar):**

| Nota | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| 1 | sem vínculo | sem efeito | adiar 12 meses não muda nada | nenhuma | método desconhecido |
| 2 | vínculo genérico | localizado | incômodo | risco menor | exige pesquisa |
| 3 | apoia um objetivo em parte | relevante em uma ferramenta | custo ou risco cresce aos poucos | relevante em uma ferramenta | conhecido, com incertezas |
| 4 | contribui diretamente | vários processos ou falha recorrente | janela em 6–12 meses | relevante e recorrente | a equipe já fez algo parecido |
| 5 | contribui diretamente e é marco ou obrigação | estrutural ou falha crítica | data-limite firme no ciclo | remove risco crítico | rotina |

**Callout fixo (Proposta A&M · a validar):** "O deck lista quatro critérios de priorização técnica e institucional (s138/s140): criticidade sistêmica, custo cognitivo, janela regulatória e operacional, e curto × longo prazo. Cobertos aqui: C2 e C3. Curto × longo prazo é tratado como propriedade da carteira (mix e horizontes). **Custo cognitivo não está coberto: pendência a validar.** C1, C4 e C5 são escolhas didáticas."

**Outros elementos:**
- `requisitoRegulatorioInstitucional` é usado só como evidência de obrigatoriedade, não como C3.
- **Checklist de independência**, com o alerta "C5 × risco P×I = dupla contagem".

**Aba Parâmetros:**
- Lista de `parametrosSistema`; editáveis só os de R43.
- Editar cria **nova versão** com justificativa e histórico; a anterior fica `SUBSTITUIDO`.
- Pesos com soma ≠ 100% dão `VALIDATION_ERROR` e bloqueiam o salvamento.

#### 6.2.2 Pontuação & Matrizes (`#/n2/pontuacao`)

**Aba Grade:**
- P01–P08 × C1–C5, com tooltip da rubrica, S, N, N/FTE, N/R$, R e ranking com o desempate visível.
- Alertas: "notas infladas" (média > 4) e "empate técnico" (\|ΔN\| < 1).
- Linha do tempo de avaliações: P05 em 15/06 (N 60,00) → 18/09 (N 63,75).

**Aba Avaliação às cegas** (exercício; grava só em `PF.modState(2).cegas`, nunca em `avaliacoes`):
- P03, P05 e P06 com as evidências da §4.11.
- A aprendiz atribui as notas e o app compara com a referência (±1).

**Aba Valor × Esforço:**
- `bubble` com qx = 2 FTE e qy = N 60, e tabela de classificação com regra de fronteira.
- **No modo exercício, a aprendiz classifica antes de ver os quadrantes.**
- Nomes de quadrante (DFP, Ref. de mercado):

| Quadrante | Iniciativas |
|---|---|
| fazer primeiro (N ≥ 60, FTE ≤ 2) | P03, P06, P08 |
| planejar (N ≥ 60, FTE > 2) | P01, P05 |
| complementar (N < 60, FTE ≤ 2) | P04, P07 |
| questionar (N < 60, FTE > 2) | P02 |

- Nota (R39, Proposta A&M · a validar): "O deck (s168) cruza esforço técnico × impacto sistêmico e usa quick wins, evoluções incrementais, projetos estruturantes e possíveis dispersões. Aqui N é aproximação (DFP), e a posição dos quadrantes foi inferida do layout." **P02 nunca é rotulada "dispersão".**

**Aba Valor × Risco** (bolha de Cooper; Ref. de mercado; qx = R 12; tamanho = custo; cor = categoria):

| Grupo | Iniciativas |
|---|---|
| pérolas | P03, P06 |
| ostras | P01, P05, **P08** |
| pão com manteiga | P04, P07 |
| elefante branco | P02 ("questionar não é matar") |

*Aula:* "Risco de execução (chance de dar errado) não é redução de risco (benefício, C4). A escala é ordinal: diz a ordem, não 'quantas vezes melhor'. As duas matrizes respondem a perguntas diferentes: P08 é fácil de fazer, mas arriscada."

#### 6.2.3 Capacidade & Seleção (`#/n2/selecao`): assistente em 3 passos

1. **Demanda × oferta:**
   - `gauge` com 170% de FTE e 153,8% de R$.
   - Faixa R26 agregada (Proposta A&M · a validar): "> 100%: ativar tanque + repriorizar".
   - As obrigatórias entram primeiro: o discricionário fica em 7,0 FTE e R$ 2,8 mi.
2. **Métodos lado a lado:** linha de corte, guloso N/FTE, **ótimo exato** e seleção manual. Cada um mostra carteira, FTE, R$, valor, ociosidade, eficiência e "por que ficou de fora".
   - No modo exercício, valor, ociosidade e eficiência ficam ocultos até o desafio do N2; a composição fica visível.
   - A coluna "ótimo exato" fica oculta até DC2-02 ter sido respondida.
3. **Conferir:** D (`stack` real × alvo), exposição a risco, faixa da proposta e slider what-if de 6 a 12 FTE (atualiza só o contêiner de resultado).

- **Alertas de qualidade:** H01 com 880 h ("linha em horas, fora da soma"; `INCOMPATIBLE_UNIT`) e H01 sem fonte (`SOURCE_REQUIRED`).
- **Ação:** "Salvar proposta v1" grava em `PF.modState(2).propostas`.
- A utilização **por gerência** e a reserva de 15% ficam no N3.

#### 6.2.4 Exercício de Gate (`#/n2/gate`), Stage-Gate (Ref. de mercado), selo Exercício

**Aba Assistente**, por candidata, em blocos:

| Bloco | Conteúdo |
|---|---|
| A | Admissibilidade (do N1) |
| B | Obrigatoriedade e evidência |
| C | Valor (S, N; benefício com KPI, base e meta) |
| D | Esforço e capacidade |
| E | Risco (P, I, mitigação; há dupla contagem com C5?) |
| F | Carteira (entra no ótimo? efeito em D) |

**Saída:** recomendação GO, GO_CONDICIONADO, HOLD, RECYCLE ou KILL, com os campos exigidos (§4.2). Grava `versaoPesos:'v1'`, `cenarioId:'C0'`, `papelRegistrante`, `instancia`, `recomendacao:true`, `forumId:'FR-GATE'` e `simulacao:true`.

**Aviso de RACI conforme o contexto** (não bloqueia):
- **Contexto "squad":** mostra lado a lado s143 (PMO C) e s149 (PMO A), com a nota "conflito R33; leitura do texto extraído; conferir no slide".
- **Contexto "ciclo":** "Deliberação: Fórum de Planejamento do Portfólio (s127); tomadores segundo s205: Diretores/GEs. A validar."
- **Fora do aviso:** ESCALAR e registro de pendência, que são atribuições da analista (s74).

**Instâncias selecionáveis:**
- "PO da squad: gate da squad (s143, a conferir)";
- "[Simulado] Sessão de gate: instância a validar";
- "Fórum de Planejamento do Portfólio (s127): deliberação a validar".

**Final:** resumo "Proposta de carteira da sessão de gate".

**Aba Quem decide (RACI):** tabela da §4.18, com todas as linhas rotuladas "Proposta A&M · reconstrução do texto extraído · conferir no slide". A linha do CT PMO-PLD tem o badge "Rascunho de revisão".

### 6.3 Telas (Parte B · Acompanhar)

#### 6.3.1 Desempenho (EVM) (`#/n2/evm`)

- **Tabela E01–E06:** BAC, PV, EV, AC, SPI, CPI, EAC e **EAC × previsão declarada**.
- **Aprofundamento** (recolhido, sem pergunta): VAC e TCPI.
- Consolidado do portfólio; `bars` PV/EV/AC.
- Destaques: SPI ou CPI < 0,85.
- Ação "Gerar item de pauta", que leva ao Fórum Mensal.
- *Aula:* "EV = % físico × BAC. CPI = EV ÷ AC: quanto valor cada R$ 1 gerou. SPI = EV ÷ PV: quanto do planejado foi feito. EAC = BAC ÷ CPI: quanto deve custar no fim se nada mudar."

#### 6.3.2 Fórum Mensal (`#/n2/forum`), selo Exercício

**(1) Pauta automática** por exceção, em **5 seções**:

| Seção | Gabarito em FR-OUT |
|---|---|
| 1 Vermelhas e divergências | E02 (Vermelho; melancia), E05 (Vermelho) |
| 2 Riscos e impedimentos vencidos | R2 (E05) |
| 3 Bloqueios por iniciativa vermelha | E05 → E02 (Dep2) |
| 4 EAC acima da previsão declarada em mais de 10% | E02 (+60%), E05 (+20%) |
| 5 Pendências de dados abertas e demandas com mais de 60 dias | pendências criadas no N1; D2, D3 (se ainda em DEMANDA) |

A seção importa o rascunho do N1 (`pautaItens` e `observacoes`).

**(2) O que mudou:** diff entre a última fotografia FECHADA (SN-SET) e o estado atual, pela mesma função `indicadoresFotografia`.

**(3) Ata e escalonamentos:**
- ESCALAR, REPLANEJAR e REGISTRAR_DESVIO, com `instancia`, `papelRegistrante` e, em REPLANEJAR e REGISTRAR_DESVIO, `recomendacao:true`.
- Aba "Registro de decisões" filtrada para o fórum.

**(4) Fotografia:**
- Gerar (ABERTO) → revisar → **FECHAR** (calcula `hashConteudo`).
- Editar uma FECHADA dá `SNAPSHOT_LOCKED`; corrigir gera v2.
- Botão "Exportar exercício (PDF)".

### 6.4 Blocos do Dashboard (aba "Ciclo Exemplo 2027 (N2)")

Demanda × oferta (170% / 153,8%) · discricionária (7,0 FTE / R$ 2,8 mi) · proposta salva (valor, eficiência, ociosidade, D) · CPI e SPI do portfólio · "o que mudou desde set/2026" · nº de itens da próxima pauta.

### 6.5 Indicadores do N2

**Notação:**
- `C` = candidatas;
- `fte(i)` = Σ `demandasCapacidade` em FTE;
- `custo(i)` = Σ `financeiro` 2027;
- `R(i)` = máximo de P × I entre os riscos abertos.

| ID | Indicador | Fórmula | Resultado | Unid. | Origem | Oculto até |
|---|---|---|---|---|---|---|
| I2.1 | Score | S = Σ wⱼ·Cⱼ (avaliação vigente; pesos vigentes) | P01 4,45 · P06 3,80 | 1–5 | DFP; pesos A validar | — |
| I2.2 | Valor normalizado | N = (S − 1)/4 × 100 | P06 70,00 | 0–100 | DFP | — |
| I2.3 | Valor por FTE | N/fte | **P03 65,00** · P07 36,25 · P06 35,00 · P08 31,88 · P04 30,83 · P01 28,75 · P02 19,50 · P05 15,94 | pts/FTE | DFP | — |
| I2.4 | Valor por R$ | N/custo | P03 216,7 · P07 145,0 · P06 116,7 · P04 92,5 · P08 79,7 · P01 71,9 · P02 54,2 · P05 39,8 | pts/R$ mi | DFP | — |
| I2.5 | Utilização da demanda | Σfte(C)/Σcapacidades; Σcusto(C)/orçamento | **170%**; **153,8%** | % | DFP; faixa A validar (s165) | — |
| I2.6 | Capacidade discricionária | cap − Σfte(obrig.); orç − Σcusto(obrig.) | **7,0 FTE**; **R$ 2,8 mi** | FTE; R$ | DFP | — |
| I2.7 | Ociosidade | cap − Σfte(sel.) | corte 2,0 · guloso 1,0 · ótimo 0,5 | FTE | DFP | desafio N2 |
| I2.8 | Valor da carteira | ΣN(sel.) | corte 285,00 · guloso 321,25 · ótimo **331,25** | pts | DFP | desafio N2 / DC2-02 |
| I2.9 | Eficiência | V/V* (mesmas restrições) | 86,0% · 97,0% · 100% | % | DFP | desafio N2 |
| I2.10 | Risco de execução | R = P × I | P05 16 · P01 15 · P02 12 · **P08 12** · P04 8 · P06 6 · P03 2 · P07 1 | 1–25 | escalas A validar | — |
| I2.11 | Exposição ponderada | ΣR·custo / Σcusto | candidatas **11,78**; ótimo **10,53** | 1–25 | DFP | — |
| I2.12 | % do custo em risco crítico | Σcusto(R ≥ 15)/Σcusto | candidatas **45,5%**; ótimo **35,3%** | % | A validar (limiar) | — |
| I2.13 | Desbalanceamento | D = ½ Σₖ \|custoₖ/custo_disc − alvoₖ\| (só parcela discricionária) | ótimo **30,0** (S 0 · E 77,3 · I 22,7) · corte 50,0 · guloso 37,2 | pp | alvo A validar (R28) | AQ2-06 |
| I2.14 | Faixa da proposta (agregada) | Σfte(sel)/cap → R26 | corte 80% (75–90%: equilíbrio) · guloso 90% e ótimo 95% (90–100%: reduzir escopo + modularizar) | % | A validar (s165) | — |
| I2.15 | EVM por iniciativa | EV = físico·BAC; PV = planejado·BAC; SPI = EV/PV; CPI = EV/AC; EAC = BAC/CPI · *aprofundamento:* VAC = BAC − EAC; TCPI = (BAC − EV)/(BAC − AC) | tabela abaixo | índice; R$ | DFP (Ref. PMI) | — |
| I2.16 | CPI e SPI do portfólio | ΣEV/ΣAC; ΣEV/ΣPV (só com baseline) | **CPI 0,80** (3,35/4,18) · **SPI 0,82** (3,14/3,82; E06 fora) | índice | DFP | AQ2-07 |
| I2.17 | EAC × previsão declarada | EAC − financeiro.previsao | E02 **+0,90** (2,40 × 1,50; +60%) · E05 **+0,37** (2,17 × 1,80; +20%) | R$ mi | DFP (R37) | — |
| I2.18 | O que mudou | diff com a última fotografia FECHADA | E02 Amarelo → Vermelho · % orç. vermelho 21,2% → 43,9% (+22,7 pp) · riscos abertos 4 → 5 (R1) · divergências 0 → 1 · CPI 0,88 → 0,80 | — | DFP | AQ2-09 |
| I2.19 | Decisões por tipo | count por `tipoDecisao`; taxa de KILL | calculado ao vivo | nº; % | DFP | — |
| I2.20 | WIP | count(fase = EM_EXECUCAO) | 6 | nº | DFP | — |

**EVM (gabarito):**

| Cód. | PV | EV | AC | SPI | CPI | EAC | *VAC* | *TCPI* |
|---|---|---|---|---|---|---|---|---|
| E01 | 0,56 | 0,56 | 0,50 | 1,00 | 1,12 | 0,71 | +0,09 | 0,80 |
| E02 | 1,05 | 0,75 | 1,20 | **0,71** | **0,63** | 2,40 | −0,90 | 2,50 |
| E03 | 1,00 | 0,90 | 0,90 | 0,90 | 1,00 | 2,00 | 0,00 | 1,00 |
| E04 | 0,09 | 0,09 | 0,08 | 1,00 | 1,13 | 0,27 | +0,03 | 0,95 |
| E05 | 1,12 | 0,84 | 1,30 | **0,75** | **0,65** | 2,17 | −0,77 | 5,60 |
| E06 | — | 0,21 | 0,20 | n/d | 1,05 | 0,57 | +0,03 | 0,98 |

**Métodos de seleção** (10 FTE; R$ 4,0 mi; P01 obrigatória):

| Método | Carteira | FTE | R$ mi | Valor |
|---|---|---|---|---|
| Linha de corte (ranking P01, P06, P03, P08, P05…; para no primeiro que não cabe) | P01, P06, P03, P08 | 8,0 | 2,90 | 285,00 |
| Linha de corte sem regra de desempate (P05 antes de P08) | P01, P06, P03, P05 | 10,0 | 3,70 | 285,00 (mesmo valor, risco maior) |
| Guloso por N/FTE | P01, P03, P07, P06, P08 | 9,0 | 3,15 | 321,25 |
| **Ótimo exato (256 combinações)** | **P01, P03, P04, P06, P08** | 9,5 | 3,40 | **331,25** |
| What-if 8 FTE | P01, P03, P06, P08 | 8,0 | 2,90 | 285,00 |

### 6.6 Perguntas & Respostas do N2 (28; 27 graduadas)

#### (a) Conceituais (13; N2-C13 não graduada até conferência da fonte)

| ID | Enunciado e alternativas | Resposta | Justificativa | Regra |
|---|---|---|---|---|
| N2-C01 | "Pesos 0,30/0,25/0,20/0,15/0,10 e notas (4, 4, 3, 4, 4). Quanto valem S e N?"<br>A) S = 3,80 e N = 76,0 · B) S = 4,00 e N = 75,0 · C) S = 3,60 e N = 65,0 · D) S = 3,80 e N = 70,0 | **D** | 1,2 + 1,0 + 0,6 + 0,6 + 0,4 = 3,80; (3,80 − 1)/4 × 100 = 70 | R21 |
| N2-C02 | "Para que serve a rubrica ancorada?"<br>A) Para que o mesmo "4" signifique o mesmo para avaliadoras diferentes<br>B) Para substituir os pesos, já que a âncora define a importância<br>C) Para deixar o processo mais formal, com as notas ainda livres<br>D) Para garantir que toda iniciativa tenha pelo menos nota 3 | **A** | Sem âncora, o "4" de uma é o "3" de outra; a âncora reduz subjetividade e inflação | R19 |
| N2-C03 | "É correto dizer que P06 (N 70) vale cerca de 1,5 vez P04 (N 46,25)?"<br>A) Sim, porque N já está normalizado de 0 a 100<br>B) Sim, desde que os pesos somem exatamente 100%<br>C) Não: a escala diz a ordem (e no máximo diferenças), não proporções<br>D) Não, porque P04 é de inovação e P06 é de evolução | **C** | Ordem e diferenças são mais defensáveis do que razões | R21 |
| N2-C04 | "Que par de medidas do caso tem risco de dupla contagem?"<br>A) C1 (alinhamento) e C3 (urgência)<br>B) C5 (viabilidade técnica) e o risco de execução P×I<br>C) C2 (criticidade sistêmica) e o custo estimado<br>D) C4 (redução de risco) e o FTE estimado | **B** | As duas penalizam a mesma incerteza técnica | R19 |
| N2-C05 | "Como P01 (obrigatória) entra no processo?"<br>A) Compete no ranking como as demais, com bônus de 10 pontos<br>B) Fica de fora, porque o valor por FTE é baixo (28,75)<br>C) Entra só se sobrar capacidade depois das discricionárias<br>D) Entra antes do ranking e reduz o disponível para 7 FTE e R$ 2,8 mi | **D** | O que conta como obrigatória e com que evidência está a validar (R12) | R24 |
| N2-C06 | "Na matriz decisória proposta no deck (s165), capacidade utilizada entre 90% e 100% indica:"<br>A) Executar o roadmap estruturado<br>B) Reduzir escopo e modularizar entregas<br>C) Ativar tanque e repriorizar o backlog<br>D) Investir em autonomia e dívida técnica | **B** | Proposta v25; adotar como regra é R26, a validar | R26 |
| N2-C07 | "Qual destes **não** está entre os critérios de priorização técnica e institucional citados no deck (s138/s140)?"<br>A) Criticidade sistêmica · B) Custo cognitivo · C) Maior retorno financeiro no ano · D) Janela regulatória e operacional | **C** | O deck cita também curto × longo prazo e não define pesos | R19 |
| N2-C08 | "Uma candidata tem S = 4,6, mas não tem patrocinador. O que você recomenda ao comitê?"<br>A) Go, porque o score alto compensa a falta<br>B) Recycle ou devolução até cumprir o must-meet<br>C) Kill imediato, sem possibilidade de retorno<br>D) Go condicionado a indicar o patrocinador depois | **B** | Must-meet vem antes de should-meet. Go condicionado não substitui um eliminatório | R17 |
| N2-C09 | "P01 envolve o CT PMO-PLD. Sobre quem prioriza demandas nesse escopo, o material disponível permite afirmar que:"<br>A) A FEG prioriza sozinha, porque coordena os fóruns de portfólio<br>B) O PO decide, porque é R/A na priorização da squad<br>C) O limite FEG × CT ainda está a validar; o slide fala em executar o backlog (s63)<br>D) A Diretoria decide, porque o CT é um fórum externo à FE | **C** | A ideia de que a Comissão Gestora prioriza vem de comentário de revisão (rascunho). Reconhecer um ponto em aberto é competência de GRC | R34 |
| N2-C10 | "P05 recebeu nova avaliação em 18/09 (C4 de 4 para 5). O que acontece com a de 15/06?"<br>A) Fica preservada; a mais recente vale e a decisão grava a versão usada<br>B) É sobrescrita, porque só a avaliação mais recente importa<br>C) É apagada depois de 30 dias para não confundir o comitê<br>D) Vira média com a nova, para suavizar mudanças de opinião | **A** | Avaliação é append-only. A reavaliação levou N de 60,00 para 63,75 e criou o empate com P08 | R06 |
| N2-C11 | "A fotografia de set/2026 está FECHADA e tem um erro de digitação. O que fazer?"<br>A) Editar a fotografia, registrando o motivo no histórico<br>B) Apagar a fotografia e gerar outra com o dado certo<br>C) Pedir ao instrutor para reabri-la como ABERTO<br>D) Registrar uma correção como novo registro ou gerar nova versão | **D** | O que foi apresentado no fórum não muda (`SNAPSHOT_LOCKED`) | R06 |
| N2-C12 | "Aumentar o número de iniciativas em paralelo, com a mesma capacidade, tende a:"<br>A) Reduzir o prazo médio, porque mais coisas andam juntas<br>B) Não ter efeito, se a capacidade total for a mesma<br>C) Aumentar o prazo médio e a troca de contexto<br>D) Aumentar a vazão na mesma proporção do WIP | **C** | Mais WIP com a mesma vazão significa mais prazo (Ref. Lean Portfolio Management) | R30 |
| N2-C13 *(conferirFonte)* | "Na RACI de estruturação e priorização (leitura do s143), quem aprova (A) a avaliação de esforço e capacidade?"<br>A) PO da squad · B) PMO (Analista de Governança e Portfólio) · C) Área usuária · D) Líder da Comunidade | **D** | Leitura do texto extraído; conferir no slide. Não conta para o desbloqueio até a conferência | R38 |

#### (b) Análise (10), sobre `PF.base`

| ID | Formato | Pergunta | Regra de cálculo | Gabarito |
|---|---|---|---|---|
| AQ2-01 | pick | Qual candidata tem maior valor por FTE? | argmax N/fte | **P03** (65,00); depois P07 (36,25) e P06 (35,00) |
| AQ2-02 | num (FTE, tol 0) | Quanto sobra de capacidade discricionária depois das obrigatórias? | I2.6 | **7,0** |
| AQ2-03 | pick | Qual candidata cai em "questionar" (N < 60 e FTE > 2)? | quadrante V×E | **P02** (questionar não é matar: pode habilitar outra) |
| AQ2-04 | num (pts, tol 0,05) | Qual o valor da melhor carteira que cabe (10 FTE, R$ 4,0 mi, P01 obrigatória)? | ótimo exato | **331,25** (P01, P03, P04, P06, P08) |
| AQ2-05 | pick | Qual candidata tem R ≥ 15 e nenhuma mitigação registrada? | R ≥ 15 ∧ `acao` vazia | **P05** (R 16) |
| AQ2-06 | num (pp, tol 0,5) | Qual o índice D da carteira ótima? | I2.13 | **30,0** (Sustentação 0%) |
| AQ2-07 | num (tol 0,01) | Qual o CPI do portfólio em execução? | ΣEV/ΣAC | **0,80** (3,35 ÷ 4,18). Retoma o N1: E02 e E05 puxam o índice |
| AQ2-08 | num (FTE, tol 0) | Quantos FTE o método guloso por N/FTE deixa ociosos? | cap − Σfte(guloso) | **1,0** (P07 entrou cedo e P04 não cabe) |
| AQ2-09 | pick | Desde a fotografia FECHADA de set/2026, qual iniciativa piorou de sinal calculado? | diff SN-SET × base | **E02** (Amarelo → Vermelho, enquanto o declarado foi de Amarelo para Verde) |
| AQ2-10 | pick | Qual candidata muda de grupo entre as matrizes valor × esforço e valor × risco? | quadrantes | **P08** (fazer primeiro × ostra; R 12) |


#### (c) Decisão de escolha (5)

**DC2-01 · mc**
- **Cenário:** "Num exercício de ciclo menor, restam **4 FTE e R$ 1,6 mi** para escolher entre P03, P05, P06, P07 e P08."
- **Resposta:** A.

| Alternativa | Valor | Feedback |
|---|---|---|
| **A) P03 + P06 + P07 (4 FTE; R$ 1,15 mi)** | 171,25 | Correta: maior valor, cabe e inclui uma sustentação barata |
| B) P05 sozinha (4 FTE; R$ 1,60 mi) | 63,75 | "Vale 107,5 pontos a menos. Só se defende como política explícita contra dívida técnica, com o custo registrado. Prefira Recycle em fases" |
| C) P03 + P06 (3 FTE; R$ 0,90 mi) | 135,00 | "Deixa 1 FTE ocioso" |
| D) P06 + P08 (4 FTE; R$ 1,40 mi) | 133,75 | "Menor valor com o mesmo recurso" |

**DC2-02 · decisao · "Monte a carteira do Ciclo Exemplo 2027"**
- **Configuração:** itens P01–P08; colunas categoria, N, FTE, R$, R e quadrante; `limites`: FTE ≤ 10 e R$ ≤ 4,0; `preSel:['P01']` e `fixos:['P01']`.
- **`avaliar`** (nota = V/V* × 100):

| Situação | Ok | Feedback |
|---|---|---|
| Inviável | não | "Estoura FTE ou R$ em X" |
| V ≥ 95% de V* | sim | mostra Δ para o ótimo, D e exposição. Revela a coluna "ótimo exato" |
| D ≤ 15 pp e V < 95% | sim | "Você trocou {Δ} pontos por um mix dentro da tolerância. É defensável se registrado; custo de política é tema do N3" |
| Demais | não | "Deixa {Δ} pontos na mesa; veja o que cabe nos {ociosos} FTE" |

**DC2-03 · mc**
- **Cenário:** "Na linha de corte, P05 e P08 empatam em 63,75 na 4ª posição. O que fazer?"
- **Alternativas:** A) Escolher a preferida da equipe e registrar a escolha · **B) Aplicar a regra de desempate registrada (menor risco: P08, R 12 < 16) e anotar o empate técnico** · C) Sortear, porque empate técnico não tem critério · D) Levar as duas, estourando a capacidade em 2 FTE.
- **Resposta:** B.
- **Feedback:** "Com P05 primeiro, a linha de corte levaria P01, P06, P03 e P05: o mesmo valor (285), mas 10 FTE e risco 16. O desempate muda a carteira, não o valor; por isso precisa ser regra escrita. O empate só existe desde a reavaliação de P05 em 18/09."

**DC2-04 · mc**
- **Cenário:** "O comitê decide hoje. P05 é ostra (valor alto, R 16) e não tem mitigação registrada. Que recomendação você registra?"
- **Resposta:** A.

| Alternativa | Feedback |
|---|---|
| **A) Recycle: fase 1 menor (diagnóstico de dívida técnica, ~1 FTE), com mitigação, de volta no próximo gate** | Correta |
| B) Go, porque o valor é alto e a sustentação está zerada | "Sem mitigação, aprova-se o risco às cegas" |
| C) Go condicionado, com a mitigação a ser elaborada depois da aprovação | "Condicionante sem plano definido não é condicionante. Incluir P05 (4 FTE) tira P04 e P08 e reduz a carteira de 331,25 para 285,00" |
| D) Kill, porque risco 16 é inaceitável | "Descarta a única sustentação com C4 = 5; o risco de dívida técnica continua" |

**DC2-05 · mc**
- **Cenário:** "E05: SPI 0,75, CPI 0,65 e EAC R$ 2,17 mi contra previsão declarada de R$ 1,80 mi. O que vai para o fórum simulado de outubro?"
- **Resposta:** D.

| Alternativa | Feedback |
|---|---|
| A) Seguir sem registro, porque falta pouco para terminar | "Com CPI 0,65, o custo final previsto passa a previsão em R$ 0,37 mi" |
| B) A analista decide interromper E05 e comunica o fórum | "O PMO consolida, recomenda e escala (s74, s129); não decide interromper" |
| C) Trocar a previsão declarada pelo EAC e manter o sinal atual | "Previsão é declaração do responsável. A diferença é informação, não erro a esconder" |
| **D) ESCALAR com três opções (nova baseline, corte de escopo, interrupção), custo restante pelo EAC (≈ R$ 0,87 mi) e efeito em E02 (Dep2)** | Correta. Instância: a validar (a FEG coordena o fórum, s129) |

**Distribuição das corretas nas mc do N2** (17): A 4 · B 4 · C 4 · D 5 (máximo 29%).

### 6.7 Desafio do N2: "Sessão de gate do Ciclo Exemplo 2027 e fórum simulado de outubro"

| Passo | Tarefa | Verificação |
|---|---|---|
| 1 | Avaliação às cegas de P03, P05 e P06 | ≥ 13 das 15 notas a ±1 da referência e S a ±0,3, sobre `PF.modState(2).cegas` |
| 2 | Classificar P01–P08 em valor × esforço (antes de ver os quadrantes) | ≥ 7 de 8 corretos (Referência) |
| 3 | **Variante não exibida:** com capacidade de **8 FTE** (R$ 4,0 mi; P01 obrigatória), informar o valor e a ociosidade da linha de corte, do guloso N/FTE e do ótimo exato | corte **285,00** / ocioso **0,0** · guloso **257,50** / **1,0** · ótimo **285,00** / **0,0** (±0,5 pts; ±0,1 FTE). Lição: aqui o guloso falha e a linha de corte coincide com o ótimo |
| 4 | Diagnóstico do ótimo com 8 FTE | D = **50,0** pp (±1) e categorias zeradas: Sustentação **e** Inovação |
| 5 | **Variante:** EVM de E02 no estado da fotografia de setembro (físico 45%, AC 0,75) | CPI **0,90** (±0,02) e EAC **1,67** (±0,02). Comentário de ≥ 20 caracteres sobre a piora para 0,63 / 2,40 |
| 6 | Três recomendações de gate | 1 GO; 1 HOLD ou RECYCLE com `proximaRevisao`; 1 GO_CONDICIONADO com `condicionantes`. Justificativa ≥ 30 caracteres, `versaoPesos:'v1'`, `instancia` preenchida e diferente do `papelRegistrante`, `recomendacao:true` |
| 7 | Fórum simulado de outubro | Gerar a fotografia de FR-OUT, registrar ESCALAR de E05 com instância e **fechar** (status FECHADO e `hashConteudo` preenchido). Medalha `m-fotografia` |

**Conclusão:** `ok` com ≥ 6 de 7, e os passos 6 e 7 são obrigatórios.

### 6.8 Critérios de aceite do N2

- S e N iguais à §4.6.5. Ranking: P01, P06, P03, P08, P05, P02, P04, P07.
- 285,00 / 321,25 / 331,25. A enumeração das 256 combinações roda em < 50 ms.
- What-if: 8 FTE → 285,00.
- Variantes do desafio conferem com `PF.calc`.
- D(ótimo) = 30,0. CPI 0,80; SPI 0,82.
- Pesos com soma de 95% não salvam. Mudar peso cria v2 com histórico.
- Fotografia FECHADA recusa edição.
- Toda recomendação de gate leva `versaoPesos` e [SIMULAÇÃO].
- O slider não perde o foco ao arrastar.
- A coluna "ótimo exato" só aparece depois de DC2-02.

### 6.9 Missões por papel (N2)

| Papel | Missão |
|---|---|
| PMO | Carteira pelos três métodos, explicando a diferença; conduzir a pauta |
| GRC | Achar a dupla contagem; garantir versão de pesos e instância em toda decisão; fechar a fotografia |
| Contratos e Fornecedores | EVM de E02 e E05; EAC × previsão declarada; R2 com o fornecedor Alfa |
| Estratégia e Inovação | Diagnóstico de mix (D = 30) e o papel de P04 e P05 |
| Interface institucional e regulatória | P01 e o limite FEG × CT (R34); C3 nas regulatórias |

---

## 7. NÍVEL 3 · REGÊNCIA · OTIMIZAÇÃO ("Decidir com robustez")

### 7.1 Ficha do nível

- **Pergunta-guia:** "Qual a melhor combinação, quanto custam nossas políticas e a escolha se sustenta?"
- **Prática:** Planejamento do Portfólio (s127, proposta): aprovar e priorizar o portfólio, balancear evolução, inovação e sustentação, definir diretrizes de capacidade. Saídas do s128: mapa de dependências e registro das decisões de priorização.
- **Objetivos:**
  1. Formular políticas como restrições e calcular o custo de cada uma, isoladas e combinadas.
  2. Ler a fronteira e o valor marginal em degraus.
  3. Construir cenários com gatilho observável e medir a robustez.
  4. Testar a sensibilidade de pesos e achar o limiar de reversão.
  5. Reconhecer a sobrecarga local e que FTE não é fungível.
  6. Acompanhar benefícios (meta × trajetória) sem dupla contagem.
  7. Medir concentração (HHI, pessoa-chave, classe de sourcing).
  8. Redigir a recomendação do ciclo e fechar a fotografia com pesos congelados.
  9. *Aprofundamento, fora do desbloqueio:* AHP com CR, caminho crítico e opção real.
- **Pré-requisito:** N2 concluído.
- **Conclusão da trilha:** ≥ 70% das 22 perguntas graduadas e desafio concluído. Medalha automática "Nível 3 concluído: Regência".

### 7.2 Telas (5, com abas)

#### 7.2.1 Otimizador (`#/n3/otimizador`), selo Exercício

**Aba Restrições & custos:**
- **Chaves:** obrigatórias, orçamento, dependência P08 ⇒ P02 ("a confirmar"), mix D ≤ tolerância, capacidade por gerência, reserva (%), exclusividade X-AMB {P04, P08} e "P07 prioritária (s168, a validar)".
- **Sempre visíveis:** a carteira ótima da configuração atual (V*, FTE, R$, D, exposição) e "por que ficou de fora" (sob demanda).
- **Painel "custo de cada restrição"** (`hbar`): oculto no modo exercício até o desafio do N3. A aprendiz calcula pela diferença de V* entre as configurações.
- **Ação:** "Salvar como cenário" (gatilho obrigatório).

**Aba Fronteira & Pareto** (botão "calcular"):
- `line` V* × FTE de 4 a 10,5, com a proposta marcada.
- Valor marginal por +0,5 FTE.
- Pareto por recurso: FTE, R$ ou risco.

**Aba Capacidade local:**
- Utilização **por gerência** (restrição) com as faixas R26 (Proposta A&M · a validar).
- Utilização por comunidade (informativa).
- Botão "Reservar 15% (s166)".
- *Aula:* "FTE não é fungível: competência elétrica não substitui energética. Balancear entre comunidades é atribuição do Gerente de Área (s12, proposta) e pode exigir tanque de terceiros (s165)."

**Aba Concentração:**
- HHI por fornecedor (execução).
- Pessoa-chave K nas candidatas e na carteira.
- Custo por classe de sourcing, com as diretrizes de s231–s235 rotuladas como proposta.

#### 7.2.2 Cenários & Robustez (`#/n3/cenarios`)

- Cenários C0–C8 com premissas e **gatilho obrigatório**. C7 e C8 aparecem marcados "política/estresse: fora da robustez".
- Matriz iniciativa × cenário (`heat`), frequência (C0–C6) e núcleo robusto (R32). Uma coluna extra mostra a frequência incluindo C7.
- "Criar cenário": copia a base e muda **um** fator. O cenário próprio aparece em coluna separada e não altera o núcleo esperado.
- "Comparar dois cenários".
- *Aula:* "Robustez mede incerteza (C0–C6). C7 e C8 são políticas: avalie pelo custo, não pela frequência."

#### 7.2.3 Sensibilidade & AHP (`#/n3/sensibilidade`)

**Aba Sensibilidade:**
- Slider por peso, com renormalização dos demais: w′ⱼ = wⱼ·(1 − w′ₖ)/(1 − wₖ).
- Ranking ao vivo, ρ de Spearman e selos "ranking mudou" / "seleção mudou".
- Seletor de par para o limiar de reversão. O valor calculado fica oculto no modo exercício; a aprendiz o encontra deslizando.

**Aba AHP (aprofundamento):**
- Matriz de Saaty de 3 a 5 critérios, com recíprocos automáticos.
- Média geométrica, λmax, CI e CR (RI 0,58 / 0,90 / 1,12).
- "Salvar como versão candidata de pesos":
  - bloqueado se CR ≥ 0,10;
  - exige justificativa;
  - grava `vigente:false`, `statusValidacao:'A_VALIDAR'`, origem A validar FEG;
  - **não** altera a v1 usada no ciclo (R35).

#### 7.2.4 Benefícios, Prazos & Opções (`#/n3/valor`)

**Aba Benefícios:**
- Fichas BEN-01..03: KPI, sentido, base, meta, dono, fonte.
- `line` planejado × realizado e índices.
- "Lançar medição" (append-only).
- "Corrigir linha de base" de proposta (via `PF.write`, com justificativa).

**Aba Caminho crítico (aprofundamento):**
- Tabela ES/EF/LS/LF/folga do programa A–D/M, sem Gantt.
- Simulação "+n meses em X" ou "retirar X".

**Aba Opção real (aprofundamento):**
- Tabela com p, custos e benefício editáveis.
- VE direto, VE estagiado, valor da opção e p*.

**Aba Inovação** (só texto e exemplos; Proposta A&M · a validar):
- árvore inovação × entrega (s182; D3 como exemplo);
- handover a partir do TRL 7 (s183);
- gates de inovação (s189; H01 = Gate 2);
- mix H1/H2/H3 da carteira × referência 70/20/10 (s209, R31).

#### 7.2.5 Planejamento do Ciclo (`#/n3/ciclo`), selo Exercício

- **Classificação** de cada candidata em Núcleo, Condicional, Habilitadora, Recycle ou Kill (mapeamento na §4.2), com condicionante e gatilho quando exigidos.
- **Mostra** os custos das políticas adotadas, o cenário usado, `versaoPesos:'v1'`, as diretrizes de capacidade por gerência e o **pre-mortem** obrigatório ("daqui a 12 meses deu errado: por quê?").
- **Contexto do roadmap 2026–2030** (s263–s270): só texto, rótulo de proposta.
- **"Gerar fotografia do FR-CICLO":** ABERTO → FECHADO; congela `versaoPesos`.
- **"Exportar exercício (PDF)":** aviso `RULE_NOT_VALIDATED` com a lista das regras a validar usadas.
- Cada decisão referencia a recomendação de gate anterior (`refDecisaoAnteriorId`); a tela mostra a decisão vigente.

### 7.3 Blocos do Dashboard (aba "Recomendação (N3)")

Esta aba **substitui** os cards do N1 e do N2 pelo **painel candidato de 7 indicadores descritivos** (a validar). São só contagens e somas, sem semáforo nem score:

| # | Indicador | Base | Valor no caso |
|---|---|---|---|
| 1 | Iniciativas por fase e gerência | I1.1, I1.2 | 6 em execução; 8 em análise; 5 demandas |
| 2 | Distribuição 30/60/90 na data de referência | I1.14 | 60 d 1 · 90 d 1 · acima 4 |
| 3 | Vencidas e sem data | prevista < ref; SEM_DATA | em execução: 0 vencidas; 1 sem baseline (E06) |
| 4 | Riscos e impedimentos abertos (e vencidos) | I1.15 | 5 (1 vencido) |
| 5 | Dependências abertas e bloqueios | I1.16 | 2; E05 bloqueia E02 |
| 6 | Desvio de prazo ("desvio", não "atraso") | I1.7 | mediana 1 mês |
| 7 | Financeiro e capacidade válidos | I1.5 + I2.5, excluindo linhas sem fonte ou com unidade incompatível | AC/BAC 63,3%; demanda 170% da capacidade (H01 fora) |

Abaixo do painel: recomendação vigente, custos de restrição adotados, benefícios × trajetória, HHI e pessoa-chave.

### 7.4 Indicadores do N3

| ID | Indicador | Fórmula | Resultado | Unid. | Origem | Oculto até |
|---|---|---|---|---|---|---|
| I3.1 | Valor ótimo | V* = max ΣN s.a. ΣFTE ≤ cap; Σcusto ≤ orç; obrigatórias ∈ S; (a ⇒ b) ⇒ b ∈ S; \|S ∩ grupo\| ≤ 1; D(S) ≤ Dmáx; ΣFTE_g ≤ cap_g | C0 331,25 · C1 316,25 · C4 303,75 · C6 267,50 · C7 256,25 | pts | DFP | — |
| I3.2 | Custo de restrição | V*(sem) − V*(com); % = ÷ V*(sem) | tabela de custos | pts; % | DFP | desafio N3 |
| I3.3 | Eficiência | V(proposta)/V*(mesmas restrições) | corte 86,0% · guloso 97,0% | % | DFP | — |
| I3.4 | Valor marginal | [V*(C + 0,5) − V*(C)] por 0,5 FTE | 8 → 8,5: +18,75 · 8,5 → 9: +17,5 · 9 → 9,5: +10,0 · **9,5 → 10: 0** · **10 → 10,5: +36,25** | pts | DFP | — |
| I3.5 | Frequência de seleção | nº de cenários de C0–C6 com i no ótimo / 7 | P01, P03, P06 **100%** · P04, P08 57% · P07 29% · P02 14% · **P05 0%**. Com C7 (÷ 8): P01, P06 100% · **P03 87,5%** · P08 62,5% · P04 50% · P07 37,5% · P02 12,5% · P05 0% | % | DFP; limiar R32 | AQ3-04 |
| I3.6 | Limiar de reversão | menor w4 com S(P05) > S(X), renormalizando | P05 × P06: **w4 > 32%** · P05 × P03: **w4 > 19%** | peso | DFP | slider |
| I3.7 | Estabilidade do ranking | ρ de Spearman (postos médios) | w4 15% → 30%: **ρ 0,958**; pesos AHP da equipe: ρ 0,934 | ρ | DFP (Ref.) | — |
| I3.8 | Consistência AHP *(aprof.)* | CI = (λmax − n)/(n − 1); CR = CI/RI | M1 3×3 **0,008** · M2 **0,864** · equipe 5×5 **0,017** | CR | DFP (Saaty) | — |
| I3.9 | Valor da opção *(aprof.)* | VE(estagiado) − VE(direto) | 0,78 − (−0,20) = **0,98** | R$ mi eq. | DFP; unidade a validar | — |
| I3.10 | Probabilidade de equilíbrio *(aprof.)* | p* com VE = 0 | direto 44% · estagiado 15,6% | % | DFP | — |
| I3.11 | Folga *(aprof.)* | LS − ES | A 0 · B 0 · C 1 · D 1 · M 0; crítico A → B (12 m). Sem P05: C → D crítico (11 m), A com folga 7 | meses | DFP | AQ3-07 |
| I3.12 | Realização × meta | (real − base)/(meta − base) | BEN-01 60% · BEN-02 20% | % | DFP | — |
| I3.13 | Realização × trajetória | (real − base)/(planejado_t − base) | BEN-01 **120%** · BEN-02 **40%** | % | DFP | AQ3-08 |
| I3.14 | HHI por fornecedor | Σ sₖ² sobre o BAC em execução | Alfa 0,606 · Beta 0,273 · Gama 0,121 → **0,456** | 0–1 | DFP (Ref.); limiar R32 | desafio N3 (participações visíveis) |
| I3.15 | Pessoa-chave | count(i com K)/n | **62,5%** das candidatas (5/8); 60% da C0 (3/5) | % | DFP | — |
| I3.16 | Utilização por gerência | Σfte(sel, g)/capacidade(g) | C0: FEL 0% (< 75) · FEN **114,3%** (> 100) · FER 100% (90–100) · FEG **150%** (> 100) | % | A validar (s165) | — |
| I3.17 | Mix por horizonte | custo por H / custo da carteira; D_h = ½ Σ \|pₕ − alvoₕ\| | C0: H1 61,8 · H2 23,5 · H3 14,7 → **D_h 8,2 pp** | %; pp | A validar (s209, R31) | — |
| I3.18 | Custo por classe de sourcing | custo por classe da ferramenta / custo da carteira | C0: núcleo crítico 44,1% (P01, P03) · periférico 41,2% (P06, P08) · sem ferramenta 14,7% (P04) | % | DFP (classe R40: proposta) | — |

**Cenários** (gatilhos na §4.17):

| Cenário | Carteira ótima | FTE | R$ mi | Valor | D |
|---|---|---|---|---|---|
| C0 Base | P01, P03, P04, P06, P08 | 9,5 | 3,40 | 331,25 | 30,0 |
| C1 Dependência | P01, P02, P03, P04, P06 | 10,0 | 3,50 | 316,25 | 30,0 |
| C2 Capacidade −2 (8 FTE) | P01, P03, P06, P08 | 8,0 | 2,90 | 285,00 | 50,0 |
| C3 Pesos (w4 = 40%) | P01, P03, P06, P07, P08 | 9,0 | 3,15 | 322,35 (outra escala; não comparar) | 37,2 |
| C4 Mix (D ≤ 15 pp) | P01, P03, P04, P06, P07 | 8,5 | 2,85 | 303,75 | 14,8 |
| C5 Nova obrigatória (P09) | P01, P09, P03, P06, P08 | 10,0 | 3,50 | 285,00 + P09 (não pontuada) | 50,0 |
| C6 Pessimista (C1 + C2) | P01, P03, P04, P06 | 7,5 | 2,60 | 267,50 | 30,0 |
| C7 Capacidade por gerência (fora da robustez) | P01, P06, P07, P08 | 8,0 | 2,85 | 256,25 | 34,8 |
| C8 Reserva 15% (fora da robustez) | P01, P03, P04, P06, P07 | 8,5 | 2,85 | 303,75 (= C4) | 14,8 |

**Custos de política** (V* base = 331,25; mostram que **custos não são aditivos**):

| Política | V* com ela | Custo | % | Observação |
|---|---|---|---|---|
| Dependência P08 ⇒ P02 | 316,25 | **15,00** | 4,5% | P08 sai; P02 entra |
| Mix D ≤ 15 pp | 303,75 | **27,50** | 8,3% | entra P07 (sustentação); sai P08 |
| Reserva de 15% | 303,75 | **27,50** | 8,3% | gera a **mesma** carteira da política de mix |
| Reserva + mix | 303,75 | 27,50 | 8,3% | **sub-aditivo**: não é 55 |
| Capacidade por gerência | 256,25 | **75,00** | 22,6% | P03 sai (FEN sem folga depois de P01), P04 sai (FEG), P07 entra |
| Dependência + capacidade por gerência | 192,50 | 138,75 | 41,9% | **super-aditivo**: maior que 15 + 75 = 90 (carteira P01, P06, P07) |
| P07 prioritária (documentação, s168) | 321,25 | 10,00 | 3,0% | D **sobe** para 37,2 pp (inovação zera) |
| Exclusividade {P04, P08} | 321,25 | 10,00 | 3,0% | carteira = guloso |
| Nova obrigatória P09 (C5) | 285,00 (parte pontuada) | 46,25 | 14,0% | equivale a perder 2 FTE (C2) |

**Fronteira** (P01 obrigatória; o orçamento só restringe acima de 10,5 FTE):

| FTE | 4 | 4,5 | 5 | 5,5 | 6 | 6,5 | 7 | 7,5 | 8 | 8,5 | 9 | 9,5 | 10 | 10,5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| V* | 151,25 | 151,25 | 187,5 | 197,5 | 221,25 | 233,75 | 257,5 | 267,5 | 285,0 | 303,75 | 321,25 | 331,25 | 331,25 | 367,5 |

**Pareto por iniciativa:** valor × FTE = {P01, P03, P06}; valor × custo = valor × risco = {P01, P03, P06, P07}.

**Sensibilidade:**
- **w4 = 30%:** pesos 0,2471 / 0,2059 / 0,1647 / 0,30 / 0,0824.
  - Novos N: P01 84,26 · P06 70,88 · **P05 70,15** · P03 66,76 · P08 61,32 · P02 53,38 · P04 42,50 · P07 38,68.
  - O ranking muda (ρ 0,958), mas **a seleção não muda** (325,74 na nova escala).
- **Varredura de ±15 pp por peso:** a seleção só muda com **w5 = 25%** (P07 no lugar de P04).
- **w4 = 40% (C3):** P07 entra no lugar de P04 por 0,29 ponto (239,41 × 239,12 na parte discricionária). É **empate técnico**, e o sistema mostra isso.

**AHP:**
- **M1** (C1, C2, C4 = [1, ½, 2; 2, 1, 3; ½, ⅓, 1]): pesos 0,297 / 0,540 / 0,163; λmax 3,009; CR 0,008.
- **M2** (C1 > C2 = 3; C2 > C4 = 3; C4 > C1 = 2): pesos 0,379 / 0,331 / 0,289; λmax 4,002; **CR 0,864**.
- **Matriz da equipe 5×5**, linhas: C1 [1, 2, 2, 3, 3] · C2 [½, 1, 1, 2, 3] · C3 [½, 1, 1, 2, 2] · C4 [⅓, ½, ½, 1, 2] · C5 [⅓, ⅓, ½, ½, 1].
  - Pesos 0,364 / 0,221 / 0,204 / 0,124 / 0,087; λmax 5,078; CI 0,0195; **CR 0,017**.
  - Carteira inalterada (331,85 na nova escala). No ranking, P08 sobe para 3º (64,63) e P03 cai para 4º (62,98).

**CPM:**
- A: 0/4/0/4/0 · B: 4/12/4/12/0 · C: 0/6/1/7/1 · D: 6/11/7/12/1 · M = 12.
- A + 2 meses → M 14 · C + 2 → M 13 · D + 2 → M 13 · C + 1 → M 12 (folga compartilhada no caminho C → D).

**Opção (P04; R$ mi equivalentes):**
- Direto: custo 2,2; p = 0,4; benefício 5,0 → VE = −0,20.
- Estagiado: PoC 0,5 e, se der certo, escala de 1,8 → VE = −0,5 + 0,4 × 3,2 = 0,78.

### 7.5 Perguntas & Respostas do N3 (25; 22 graduadas; aprofundamento: N3-C02, AQ3-07, DC3-03)

#### (a) Conceituais (9)

| ID | Enunciado e alternativas | Resposta | Justificativa | Regra |
|---|---|---|---|---|
| N3-C01 | "Em valor (N) × FTE, quais candidatas são não dominadas?"<br>A) P01, P03, P06, P07 · B) P01, P03, P06 · C) Todas as oito · D) Só P01 | **B** | P03 (65; 1 FTE) domina P07 (mesmo FTE, menos valor). Em custo, P07 entra porque é a mais barata: a fronteira depende do recurso escasso | R30 |
| N3-C02 *(aprof.)* | "Uma matriz AHP 3×3 tem CR = 0,86. O que fazer?"<br>A) Usar os pesos, porque o CR só importa acima de 1<br>B) Arredondar os pesos para a dezena mais próxima<br>C) Refazer os julgamentos, porque CR ≥ 0,10 indica inconsistência<br>D) Remover o critério de menor peso e recalcular | **C** | Os julgamentos formam ciclo: C1 > C2 > C4 > C1 | R30 |
| N3-C03 | "Com w4 = 30%, P05 sobe no ranking, mas a carteira não muda. Como ler isso?"<br>A) A seleção é robusta a essa incerteza de peso, mesmo com o ranking variando<br>B) A análise falhou, porque o ranking deveria ser estável<br>C) É preciso subir w4 até P05 entrar na carteira<br>D) Os pesos v1 estão errados e devem ser trocados | **A** | O que importa é a estabilidade da seleção. C é manipulação | R35 |
| N3-C04 | "Por que ir de 9,5 para 10 FTE acrescenta 0, e de 10 para 10,5 acrescenta 36,25?"<br>A) A seleção é inteira: com +0,5 nada novo cabe; a partir de 10, +0,5 permite incluir P07<br>B) O otimizador errou a conta nos dois casos<br>C) O orçamento acabou em 10 FTE, por isso o salto<br>D) Cada 0,5 FTE vale sempre o mesmo; é arredondamento | **A** | O valor marginal anda em degraus | R30 |
| N3-C05 | "Uma iniciativa gastou R$ 1,5 mi de 2,0. Faltam R$ 1,2 mi para um benefício restante de R$ 0,8 mi. 'Já gastamos muito' justifica continuar?"<br>A) Sim, porque abandonar desperdiça o que já foi gasto<br>B) Sim, se a iniciativa estiver alinhada a um objetivo<br>C) Depende do sinal da iniciativa no último fórum<br>D) Não: compara-se custo restante (1,2) com valor restante (0,8) | **D** | Custo afundado: o gasto passado é irrecuperável | R30 |
| N3-C06 | "A C0 usa 9,5 de 10 FTE, mas a FEN fica em 114% e a FEL em 0%. Por que 'mover 1 FTE da FEL para a FEN' não resolve automaticamente?"<br>A) Resolve sempre, porque FTE é uma unidade padrão<br>B) FTE não é fungível; balancear entre áreas é do Gerente de Área e pode exigir tanque (s12, s165)<br>C) Basta a FEL ceder 1 FTE por e-mail<br>D) É erro de cadastro; a FEN deveria ter mais capacidade | **B** | Competência elétrica não substitui energética | R26 |
| N3-C07 | "Uma iniciativa de inovação está alinhada às rotas tecnológicas, mas falta uma base de dados validada. O que o deck propõe (s189)?"<br>A) Encerrar com lições aprendidas (Gate 3)<br>B) Executar assim mesmo e tratar a falta como risco<br>C) Transferir para a comunidade de entrega<br>D) Pausar formalmente, com justificativa e gatilho objetivo de reativação | **D** | É o Gate 2 proposto; H01 (DEC-002) é o exemplo | R31 |
| N3-C08 | "O deck cita a transferência para a entrega a partir do TRL 7 (s183) e a distribuição 70/20/10 entre horizontes (s209). Como o sistema trata essas referências?"<br>A) Como regra oficial do ONS, já aplicada nos cálculos<br>B) Como meta individual das analistas de portfólio<br>C) Como proposta do deck, que só vira regra se a FEG validar<br>D) Como ilustração sem relação com o deck | **C** | Afirmação do deck usada como parâmetro: a validar (R31) | R31 |
| N3-C09 | "A reserva de 15% custa 27,5 e a política de mix custa 27,5. Adotadas juntas, quanto custam?"<br>A) 55,0, porque custos de restrição sempre se somam<br>B) 27,5: as duas levam à mesma carteira; custos de política não são aditivos<br>C) 0, porque uma política anula a outra<br>D) 13,75, porque a média das duas é o custo combinado | **B** | Dependência + capacidade local custa 138,75, mais que 15 + 75. Teste as políticas combinadas | R30 |

#### (b) Análise (10), sobre `PF.base`

| ID | Formato | Pergunta | Regra de cálculo | Gabarito |
|---|---|---|---|---|
| AQ3-01 | multi | Qual a melhor carteira se P08 ⇒ P02 for confirmada? | `otimizar({deps:[['P08','P02']]})` | **P01, P02, P03, P04, P06** (316,25; 10 FTE) |
| AQ3-02 | num (tol 0,05) | Quanto custa essa dependência? | V*(C0) − V*(C1) | **15,0** |
| AQ3-03 | num (tol 0,05) | Quanto custa impor D ≤ 15 pp? | V*(C0) − V*(C4) | **27,5** |
| AQ3-04 | multi | Quais iniciativas estão em todos os cenários C0–C6? | frequência = 100% | **P01, P03, P06**. Medalha `m-robusto` |
| AQ3-05 | num (%, tol 1) | A partir de que peso de C4 a P05 passa a P06? | limiar de reversão | **32** |
| AQ3-06 | num (tol 0,05) | Quanto custa respeitar a capacidade de cada gerência (C7)? | V*(C0) − V*(C7) | **75,0**. A justificativa mostra que P03 (FEN) e P04 (FEG) saem e P07 entra |
| AQ3-07 *(aprof.)* | pick | Se P05 sair do programa (Recycle), qual o novo caminho crítico até M? | `cpm` sem B | **C → D (P02 → P08), 11 meses** |
| AQ3-08 | pick | Qual benefício está abaixo da trajetória planejada? | índice de trajetória < 100% | **BEN-02** (B01; 40%; KPI "menor é melhor"). B01 vai bem em BEN-01 e mal em BEN-02 |
| AQ3-09 | num (%, tol 0,5) | Qual deve ser a linha de base do benefício proposto por P03 (mesmo KPI de BEN-01)? | última medição de BEN-01 | **78** (a proposta usa 60 e contaria duas vezes o ganho da fase 1) |
| AQ3-10 | num (%, tol 0,5) | Incluindo C7, qual a frequência de seleção de P03? Continua no núcleo (≥ 80%)? | 7/8 | **87,5**. Continua, mas com condicionante de capacidade da FEN |

#### (c) Decisão de escolha (6)

**DC3-01 · mc**
- **Cenário:** "Impor D ≤ 15 pp custa 27,5 pontos (8,3%). Qual conduta **invalida** o processo?"
- **Alternativas:** A) Adotar a política e registrar o custo e o motivo · B) Não adotar e registrar o risco aceito (0% de sustentação), com revisão no próximo ciclo · C) Apresentar as duas opções com os custos ao fórum · **D) Aumentar o peso de C4 até a sustentação entrar no ótimo**.
- **Resposta:** D. *P-hacking* decisório. A, B e C são defensáveis se registradas.

**DC3-02 · mc**
- **Cenário:** "P08 ⇒ P02 está 'a confirmar' e o fórum simulado é em 16/11."
- **Resposta:** A.

| Alternativa | Feedback |
|---|---|
| **A) Núcleo + P08 como Go condicionado à confirmação técnica até uma data; se confirmada, aplicar C1 (entra P02, sai P08), com o gatilho registrado** | Correta |
| B) Aprovar P08 sem P02 e confirmar a dependência depois | "Carteira possivelmente inviável" |
| C) Aprovar P02 e P08 juntas, por segurança | "Núcleo (6,0) + P02 (2,5) + P08 (2,0) = 10,5 FTE > 10: não cabe nem sem P04" |
| D) Recomendar Kill de P08, porque a dependência é incerta | "Descarta uma ostra de valor 63,75 por uma incerteza que se resolve com uma confirmação" |

**DC3-03 · mc (aprofundamento)**
- **Cenário:** "P04: investir direto (R$ 2,2 mi; p = 0,4; benefício 5,0) ou fazer a PoC (R$ 0,5 mi) e escalar (R$ 1,8 mi) só se der certo?"
- **Resposta:** B.

| Alternativa | Feedback |
|---|---|
| A) Investir direto na solução completa (VE −0,20) | — |
| **B) Fazer a PoC e escalar só se der certo (VE 0,78)** | Correta: valor da opção 0,98; p* cai de 44% para 15,6% |
| C) Não fazer nada (VE 0) | "Abre mão de 0,78" |
| D) Investir direto se p subir para 0,5 (VE 0,30) | "Mesmo assim, o estagiado daria 1,10" |

Nota do feedback: "As probabilidades são estimativas: mostre a faixa e o p*, não um número único."

**DC3-04 · mc**
- **Cenário:** "Com capacidade por gerência, a FEN (114%) e a FEG (150%) estouram."
- **Resposta:** C.

| Alternativa | Feedback |
|---|---|
| A) Ignorar, porque no agregado ainda sobra 0,5 FTE | "O agregado esconde o local" |
| B) Mover 1 FTE da FEL para a FEN, que tem capacidade ociosa | "FTE não é fungível" |
| **C) Levar ao fórum duas opções com custo explícito: recompor dentro das capacidades locais (256,25; −75) ou manter C0 com condicionantes (sequenciar P03 após E05, escalonar P04, ou tanque, s165)** | Correta. O conflito de prioridade é arbitrado pelo Gerente Executivo (s71, proposta) |
| D) Retirar P01 para aliviar a FEN | "P01 é obrigatória" |

**DC3-05 · multi**
- **Cenário:** "No comitê, depois de ver o resultado, alguém pede para subir w4 até P05 entrar. Marque as condutas corretas."
- **Alternativas:** A) Aceitar e reotimizar com o novo peso · **B) Recusar e mostrar o limiar de reversão (32%) e a robustez (P05 em 0/7)** · **C) Abrir uma versão candidata de pesos, com justificativa, que não vale para a fotografia do ciclo** · D) Trocar o peso e registrar como correção de erro.
- **Corretas:** B e C (R35).

**DC3-06 · custom · "Recomendação do ciclo"**
- A aprendiz classifica P01–P08. Pontuação: 1 ponto por classe exata; 0,5 por alternativa aceitável; 0 para Kill em P05. Ok com ≥ 6 de 8.

| Classe | Gabarito-modelo | Também aceito (0,5) |
|---|---|---|
| Núcleo | P01, P06; **P03** com condicionante de capacidade da FEN | P03 como Condicional |
| Condicional | P08 (confirmar a dependência); P04 (PoC com gate de escala e capacidade da FEG); P07 (se a política de mix ou a s168 for adotada) | Hold em P04 ou P07 |
| Habilitadora | P02 (só se Dep4 for confirmada) | Hold em P02 |
| Recycle | P05 (fase 1 de ~1 FTE; registrar o risco de dívida técnica e de pessoa-chave) | Hold em P05 |

**Distribuição das corretas nas mc do N3** (13): A 3 · B 4 · C 3 · D 3 (máximo 31%).

### 7.6 Desafio do N3: "Recomendação de carteira do Ciclo Exemplo 2027 (ILUSTRATIVA)"

| Passo | Entrega | Verificação |
|---|---|---|
| 1 | **Variante (8 FTE, cenário C2):** custos da dependência, do mix e da capacidade por gerência, obtidos pela diferença de V* no Otimizador | **17,5** (285,00 − 267,50) · **52,5** (285,00 − 232,50) · **28,75** (285,00 − 256,25), ±0,5. Lição: o custo de uma política depende do contexto. Medalha `m-preco` |
| 2 | Um cenário próprio além de C0–C8 | gatilho com ≥ 15 caracteres; uma única mudança; o núcleo esperado (P01, P03, P06 sobre C0–C6) é marcado corretamente |
| 3 | **Variante de sensibilidade:** limiar de w4 para P05 passar **P03** e se a seleção muda com w4 = 30% | **19%** (±1) · "não muda" |
| 4 | Aprofundamento, **escolha 1 de 3:** (a) AHP próprio 3×3 ou 5×5 com CR < 0,10, salvo como versão candidata; (b) CPM: se D atrasar 2 meses, em quanto M atrasa?; (c) opção real com p = 0,3: valor da opção | (a) CR calculado sobre a matriz da aprendiz < 0,10 e versão `vigente:false` · (b) **1 mês** (M = 13) · (c) **1,16** (VE direto −0,70; estagiado 0,46), ±0,02 |
| 5 | Benefícios | BEN-01 acima e BEN-02 abaixo da trajetória; ação para BEN-02 (≥ 20 caracteres); linha de base de BEN-03 corrigida para 78 em `PF.db()`, com justificativa |
| 6 | Concentração | HHI de execução (0,456 ± 0,01) e uma mitigação para a pessoa-chave K (≥ 20 caracteres) |
| 7 | Recomendação final | DC3-06 com ≥ 6 pontos, justificativa, custos adotados, `versaoPesos:'v1'`, pre-mortem preenchido e **fotografia do FR-CICLO FECHADA** |

**Conclusão:** `ok` com ≥ 6 de 7, e o passo 7 é obrigatório.

### 7.7 Critérios de aceite do N3

- C0–C8, custos de política, frequências, fronteira e Pareto reproduzem a §7.4.
- **Sensibilidade:** w4 = 30% mantém a seleção (ρ 0,958); w4 = 40% mostra "empate técnico".
- **AHP:** 0,008 / 0,864 / 0,017; o botão fica bloqueado com CR ≥ 0,10. Salvar uma versão candidata não altera a v1 nem a fotografia.
- CPM confere; HHI 0,456; BEN-02 em 40%.
- A fotografia do ciclo fecha, fica imutável e congela `versaoPesos`. O PDF mostra `RULE_NOT_VALIDATED` e a marca d'água.
- O Otimizador recalcula em < 50 ms com 8 candidatas (cache por hash). Com mais de 14 candidatas, a enumeração exata fica desligada e o app avisa.

### 7.8 Missões por papel (N3)

| Papel | Missão |
|---|---|
| PMO | Recomendação robusta, com os custos das políticas e o cenário |
| GRC | Simular a trilha de auditoria: versões de pesos, CR, gatilhos, pre-mortem, fotografia fechada |
| Contratos e Fornecedores | HHI 0,456 (Alfa 60,6%); contratar em fases (opção); classe de sourcing (núcleo crítico 44,1%) |
| Estratégia e Inovação | Política de mix; 70/20/10 como referência a validar; P04 em PoC; D3 na árvore s182 |
| Interface institucional e regulatória | Cenário C5 (P09 = D2) e o seu gatilho; limite FEG × CT ainda a validar |

---

## 8. Progressão, medalhas e glossário por nível

### 8.1 Medalhas

**Automáticas do core:** "Nível N concluído: Partitura / Arranjo / Regência".

**Extras** (`PF.award`):

| id | Medalha | Gatilho |
|---|---|---|
| `m-rotulo` | Rótulo certo | N1-C09 com ≥ 6/8 |
| `m-melancia` | Caçadora de melancias | pendência de divergência de E02 registrada |
| `m-fotografia` | Fórum fechado | primeira fotografia FECHADA |
| `m-robusto` | Núcleo robusto | AQ3-04 correta (sem revelação) |
| `m-preco` | Preço da política | passo 1 do desafio N3 |

### 8.2 Revisão espaçada

Cada nível retoma o anterior:
- **N2:** AQ2-07 (o EVM confirma as vermelhas do N1), N2-C08 (must-meet da triagem), AQ2-09 (E02).
- **N3:** N3-C07 (H01), AQ3-08 (B01), AQ3-09 (a linha de base vem da fase 1).

### 8.3 Glossário por nível (`PF.glossario`)

| Nível | Termos |
|---|---|
| N1 | portfólio, programa, projeto, iniciativa, demanda, inventário único, baseline, BAC, AC, % físico, pp, sinal calculado/RAG, Cinza, status melancia, gestão por exceção, data de referência, 30/60/90, risco × impedimento, dependência, triagem, recomendação, pendência, arquivar, rótulos de origem |
| N2 | FTE, HC, critério, rubrica, peso, score, normalização, escala ordinal, must-meet/should-meet, quadrantes, bolha de Cooper, capacidade discricionária, mochila, linha de corte, guloso, ótimo exato, índice D, PV, EV, SPI, CPI, EAC (VAC e TCPI como aprofundamento), Go/Go condicionado/Hold/Recycle/Kill, fotografia, escalonamento, WIP, RACI |
| N3 | custo de restrição, fronteira eficiente, Pareto, valor marginal, cenário, gatilho, robustez, sensibilidade, limiar de reversão, Spearman, AHP, CR, caminho crítico, folga, opção real, p*, TRL, horizontes H1/H2/H3, benefício, trajetória, HHI, pessoa-chave, classe de sourcing, custo afundado, pre-mortem |

---

## 9. Autoteste (modo instrutor; asserções sobre `PF.base`)

**Tolerância:** ±0,01 para valores e ±0,1 pp para percentuais.

| Bloco | Asserções |
|---|---|
| Dados | 22 iniciativas · 10 comunidades · **13 squads** · 16 ferramentas · todo objeto com `ilustrativo:true` · todo link em `.invalid` · toda regra com uma `origemRegra` válida (3 valores) e `tipoFonte` · nenhum `FONTE_ONS` sem `DOCUMENTO_ONS_APROVADO` · soma da capacidade por gerência = 10,0 = soma por comunidade |
| N1 | sinal = [V, Vm, A, V, Vm, Cinza] · I1.4 43,9% · I1.5 63,3% · I1.7 média 1,6 / mediana 1 · I1.8 40% / 60% · I1.9 83,3% · I1.10 96,7% · I1.11 mediana 32 e 2 acima de 60 · I1.12 20% · I1.13 53,0% · I1.14 em execução (60 d 1; 90 d 1; acima 4); todas ativas (VENCIDO 2; SEM_DATA 13) · I1.15 5 (1 vencido) · I1.16 2 · triagem esperada D1–D5 · variantes do desafio (74,2%; 0,60; 0; 98,3%; 4) · SN-SET (E02 Amarelo; 21,2%; 16,7%; 4 riscos; 2 dependências; 0 divergências; CPI 0,88) |
| N2 | S e N de P01–P08 · ranking P01, P06, P03, P08, P05, P02, P04, P07 · 285,00 / 321,25 / 331,25 = {P01, P03, P04, P06, P08} · ociosidade 2,0 / 1,0 / 0,5 · I2.5 170% / 153,8% · I2.6 7,0 / 2,8 · D 30,0 / 50,0 / 37,2 · I2.11 11,78 / 10,53 · I2.12 45,5% / 35,3% · I2.14 80% / 90% / 95% · CPI 0,80 · SPI 0,82 · EAC E02 2,40 · EAC − previsão E02 +0,90; E05 +0,37 · TCPI E05 5,60 · diff SN-SET (E02 A → Vm; +22,7 pp; riscos 4 → 5; CPI 0,88 → 0,80) · P05 v1 N 60,00 · V×E (P03, P06, P08 / P01, P05 / P04, P07 / P02) · V×R (P03, P06 / P01, P05, P08 / P04, P07 / P02) · variantes a 8 FTE (285,00/0; 257,50/1,0; 285,00/0; D 50,0) · E02 setembro CPI 0,90, EAC 1,67 · DC2-01 = 171,25 |
| N3 | C1 316,25 · C2 285,00 · C3 322,35 · C4 303,75 (D 14,8) · C5 285,00 · C6 267,50 · C7 256,25 · C8 303,75 · custos 15,0 / 27,5 / 27,5 / 75,0 / 138,75 / 10,0 / 10,0 / 46,25 · frequências C0–C6 (P01, P03, P06 7/7; P04, P08 4/7; P07 2/7; P02 1/7; P05 0/7) e C0–C7 (P03 7/8) · fronteira §7.4 · Pareto FTE {P01, P03, P06}; custo e risco {P01, P03, P06, P07} · ρ 0,958 · limiares 0,32 e 0,19 · varredura (só w5 = 25% muda) · CR 0,008 / 0,864 / 0,017 · CPM (folgas 0, 0, 1, 1; sem B 11; A + 2 → 14; D + 2 → 13) · opção 0,98; p* 0,44 / 0,156; p = 0,3 → 1,16 · BEN 60/120 e 20/40 · HHI 0,456 · K 62,5% / 60% · I3.16 0 / 114,3 / 100 / 150 · D_h 8,2 · sourcing 44,1 / 41,2 / 14,7 · variantes a 8 FTE (17,5; 52,5; 28,75) |
| Regras e interface | `HIERARCHY_MISMATCH` · `INVALID_URL` · `SOURCE_REQUIRED` (H01) · `INCOMPATIBLE_UNIT` (H01) · `SNAPSHOT_LOCKED` · `VALIDATION_ERROR` (pesos 95%; escrita em Referência) · `RULE_NOT_VALIDATED` (FONTE_ONS sem documento; PDF) · nenhum DELETE disponível · `PF.base` congelado · divisões por zero dão `null` (casos AC = 0, PV = 0, BAC = AC) · em cada nível, ≤ 35% das corretas na mesma letra original · nenhuma pergunta graduada revela a resposta após erro |

---

## 10. Rastreabilidade das críticas adversariais

PED = pedagogia · FID = fidelidade ao ONS · VIA = viabilidade/UX. Todos os itens de severidade alta e média foram resolvidos, e também os de severidade baixa.

### 10.1 Pedagogia

| ID | Sev. | Problema | Como foi resolvido | § |
|---|---|---|---|---|
| PED-01 | alta | Era possível chegar a 100% clicando duas vezes, porque o erro revelava a resposta | Erro mostra só a dica. "Ver resposta" grava `revelada` e retira o crédito. `pct` conta `best && !revelada` | 3.5, 3.6 |
| PED-02 | alta | O passo 5 do desafio N1 não tinha tela | Bloco "Rascunho da pauta" no Dashboard N1 (`pautaItens`, `observacoes`); o passo 2 exige pendência DIVERGENCIA_STATUS | 5.2.1, 5.5 |
| PED-03 | alta | Triagem rígida: 5/5, D5 ambígua, sem reabertura | Passo aprovado com ≥ 4/5 (D2 DEVOLVER vale 0,5). Verificação pela decisão vigente. "Corrigir triagem" reativa a demanda. D5 reescrita com campos explícitos. Checklist mostra o campo comprobatório | 4.6.6, 5.2.6, 5.5 |
| PED-04 | alta | No desafio N2, a avaliação às cegas quebrava os passos seguintes | A avaliação às cegas grava só em `modState`. Os passos numéricos usam variantes calculadas sobre cópia de `PF.base` | 6.2.2, 6.7 |
| PED-05 | alta | No desafio N3, o AHP próprio quebrava os passos e a fotografia | AHP salvo como versão candidata (`vigente:false`). A fotografia congela a v1. Núcleo esperado calculado sobre C0–C6; o cenário próprio fica em coluna separada | 7.2.3, 7.6 |
| PED-06 | alta | N1 com conceitos demais | RACI e N1-C04 antigo movidos para o N2. Saúde & Prazos dividida em 3 abas com aula. "Todas ativas" só para o instrutor. Mensagens simples com código no tooltip. 4 badges no N1. Indicadores filtrados por nível. R34 retirado de DC1-04 | 5.1, 5.2, 5.4 |
| PED-07 | alta | Salto N1 → N2 | EVM só com PV, EV, AC, SPI, CPI e EAC; VAC e TCPI como aprofundamento; DC2-05 sem TCPI. Utilização por gerência e reserva movidas para o N3. N2 em Parte A e Parte B. A pergunta sobre gerências acima de 100% foi trocada pela ociosidade do guloso (AQ2-08) | 6.1–6.6 |
| PED-08 | média | Viés de letra B e de alternativa mais longa | Embaralhamento por semente. 4 alternativas de tamanho semelhante. Distribuição por nível ≤ 35% (N1 30%, N2 29%, N3 31%), verificada no autoteste | 3.6, 5.4, 6.6, 7.5 |
| PED-09 | média | N1-C09 com itens ambíguos | Aula com a precedência da §2.2 antes da questão. Itens reescritos. Rótulos exatamente como a interface mostra. Item 8 trocado por dado ilustrativo | 2.2, 5.4 |
| PED-10 | média | DC1-04 e DC2-04 tinham duas respostas defensáveis | DC1-04: C virou "devolver e encerrar". DC2-04: "o comitê decide hoje", B virou "mitigação depois", com feedback factual (285,00) | 5.4, 6.6 |
| PED-11 | média | DC3-05, AQ3-06 e DC3-03 incompatíveis com o core | DC3-05 em `multi` [B, C]. AQ3-06 em `num` (75), com as saídas na justificativa. DC3-03 com 4 alternativas | 7.5 |
| PED-12 | média | Respostas exibidas nas telas | Modo exercício (`revelaApos`). Matrizes classificadas antes de revelar. Desafios com variantes que não aparecem em nenhuma tela | 3.7, 5.5, 6.7, 7.6 |
| PED-13 | média | Conceitos cobrados antes de serem ensinados | Dica de T4 com s182. Aula de status fechados em Saúde. BAC, AC, % físico e pp no glossário do N1; FTE e HC no N2. Normalização fora do N1-C09 | 5.2.5, 5.2.6, 8.3 |
| PED-14 | média | Convenção do desvio em meses indefinida | Meses de calendário declarados na ficha e na aula; tolerância ±0,15 | 3.10, 5.3 |
| PED-15 | média | Vazão de Little sem dado de origem | Tela de fluxo e Lei de Little removidas do escopo; WIP fica só como conceito (N2-C12) | 6.6, 10.3 |
| PED-16 | média | Matrizes V×E e V×R idênticas | P08 com P = 4 (R 12), "fonte externa nova, sem contrato de dados". P08 vira ostra. AQ2-10 nova. Recalculados I2.10 e I2.11 (11,78 / 10,53) | 4.6.5, 6.2.2, 6.6 |
| PED-17 | média | Núcleo robusto × FTE não fungível | Aula: robustez mede incerteza (C0–C6); C7 e C8 são políticas avaliadas pelo custo. AQ3-10: P03 = 87,5% incluindo C7 (o valor citado na crítica, 75%, foi recalculado). DC3-06 aceita P03 como Condicional | 7.2.2, 7.5 |
| PED-18 | média | Trabalho/Referência confundia a aprendiz | Link `ver` abre com `?ref=1` e faixa. A pergunta mostra o valor da Referência e, se houver divergência, o do Trabalho | 3.6, 3.8 |
| PED-19 | média | Desbloqueio podia ser perdido | `S.concluidos` persistente; "Reiniciar nível" avisa | 3.3 (C3), 3.5 |
| PED-20 | média | N3 pesado demais | AHP, CPM e opção marcados como aprofundamento (fora do denominador). No desafio, passo "escolha 1 de 3". N3 com 22 graduadas | 7.1, 7.5, 7.6 |
| PED-21 | baixa | Aritmética errada em DC3-02 | Feedback corrigido: 6,0 + 2,5 + 2,0 = 10,5 > 10 | 7.5 |
| PED-22 | baixa | Enunciados punham o PMO como decisor | Enunciados viraram "que recomendação você registra"; passo 6 exige recomendação e instância | 6.6, 6.7 |
| PED-23 | baixa | P09 = 2,0 FTE parecia validar a conversão de horas | C5 descreve re-estimativa bottom-up; R25 continua `null` | 4.17 |

### 10.2 Fidelidade ao ONS

| ID | Sev. | Problema | Como foi resolvido | § |
|---|---|---|---|---|
| FID-01 | alta | Deck gravado como FONTE_ONS | Deck = `A_VALIDAR_FEG` + `PROPOSTA_CONSULTORIA`, badge "Proposta A&M v25 · sNN · a validar FEG". FONTE_ONS sem itens. `q.regra` resolvido por `PF.badge`. N1-C09 com categoria própria | 2.1–2.3, 4.3, 5.4 |
| FID-02 | alta | Pool com 5 papéis atribuído ao deck | Mapa mostra os 5 blocos do s56/s57 (com Líder de Comunidade Técnica) e, em quadro separado, os naipes do Afinação (ARTEFATO_INTERNO, R42) com a nota sobre INST/REG. N1-C04 ensina a diferença | 5.2.7, 5.4 |
| FID-03 | alta | Triagem tratava o PMO como decisor | Triagem como recomendação: instância "PO da squad (R)", `forumId:null`, adaptação didática rotulada, efeito "se a instância acatar" | 5.2.6 |
| FID-04 | alta | Promoção de regra pelo modo instrutor | Promoção só simulada. A_VALIDAR_FEG → DFP proibido. VALIDADO e SUBSTITUIDO marcados como proposta ao repositório. Promoção real só por revisão de seed/migration | 2.5 |
| FID-05 | alta | Dados montados sobre o calendário real | "Ciclo Exemplo 2027 (ILUSTRATIVO)" e `EX-2027`; fóruns "[Simulado]"; "Exportar exercício" com marca d'água; autor "Aprendiz (perfil local)"; data de referência com selo ILUSTRATIVO | 2.6, 4.12 |
| FID-06 | média | Ferramentas reais com status negativo | Títulos com apelido e "(fictício)"; nome real só como vínculo de catálogo, com nota; KPIs dos benefícios reescritos sem citar a cadeia oficial; `ilustrativo:true` em tudo | 2.6, 4.6, 4.15 |
| FID-07 | média | Instâncias inventadas (Comitê de Gate, s205) | `SESSAO_GATE_SIMULADA` a validar, citando s153 como mecanismo; tela "Exercício de Gate (Stage-Gate, Ref.)"; ritual do N2 = s127/s128; s205 só como saídas de inovação | 1.3, 4.2, 6.2.4 |
| FID-08 | média | RACI do s143 aplicada às decisões do ciclo | Aviso de RACI por contexto (squad: s143 × s149 lado a lado; ciclo: s127/s205 a validar). O desafio verifica só instância, registrante e recomendação | 6.2.4, 6.7 |
| FID-09 | média | O "erro de RACI" de DEC-005 não era erro | DEC-004 agora é "analista aprova nova baseline" (erro real); DEC-005 corrige. ESCALAR saiu do aviso de RACI. DC2-05 com instância a validar | 4.13, 6.2.4, 6.6 |
| FID-10 | média | RACI e quadrantes reconstruídos tratados como fonte | R38 e R39 com "reconstrução do texto extraído; conferir". Pergunta de RACI (N2-C13) com `conferirFonte`, fora do desbloqueio | 4.3, 4.18, 6.6 |
| FID-11 | média | s168 aplicado com outros eixos; P02 como "dispersão" | Quadrantes com nomes de mercado (DFP); s168 só em nota; P02 nunca é "dispersão" | 6.2.2 |
| FID-12 | média | C1–C5 com "âncora no deck"; C4 mapeado para `riscosResumo` | Coluna "relação aproximada (DFP)"; callout com os 4 critérios do deck e custo cognitivo como pendência; notas só em `notasCriterios`; `requisitoRegulatorioInstitucional` só como evidência | 6.2.1, 4.11 |
| FID-13 | média | Home com semáforo agregado | Não se afirma correspondência com `getExecutiveHome`; selo "regra didática: não usar em reporte"; painel de 7 indicadores só descritivos (sem I1.4 e I3.3) | 2.4, 7.3 |
| FID-14 | média | Selo de simulação só nas telas de seleção | Selo em toda tela que escreve ou gera PDF; [SIMULAÇÃO] em listas, PDF e JSON | 2.4 |
| FID-15 | média | Reset apagava registros append-only | Log em chave própria por exercício, preservado entre resets; exportação automática antes do reset; texto "imutabilidade simulada"; missão GRC "simular trilha de auditoria" | 3.9, 7.8 |
| FID-16 | média | JSON exportado sem marca de exercício | `ilustrativo:true` e `origemDado` em cada objeto; cabeçalho `naoImportar:true`; frase sobre importação no Supabase removida | 2.6, 3.9 |
| FID-17 | média | R02 dizia "15 squads" | 13 squads de entrega; asserção no autoteste | 4.3, 4.4, 9 |
| FID-18 | média | Linha do CT PMO-PLD vinha de comentário de revisão | `COMENTARIO_REVISAO`, badge próprio; N2-C09 afirma só "limite a validar"; DC1-04 sem R34 | 4.18, 5.4, 6.6 |
| FID-19 | baixa | Origem mista no registro de regras | Uma origem por linha: R05a/b, R10a/b, R36a/b; R24 a validar com marca ILUSTRATIVO; I3.18 = DFP | 4.3, 7.4 |
| FID-20 | baixa | Triagem como canal paralelo | Demandas como espelho, com link de origem obrigatório; texto de fronteira na tela | 5.2.6 |
| FID-21 | baixa | Link em domínio real | `.invalid` (RFC 6761), com botão desabilitado | 2.6 |
| FID-22 | baixa | encerramentos12m sem registro | Removido: a fotografia é calculada pela mesma função sobre o estado de setembro; a Lei de Little saiu do escopo | 4.12 |
| FID-23 | baixa | Siglas inventadas | Marcadas como "sigla didática" (DFP); RH → HID | 4.4 |
| FID-24 | baixa | Convenções de EVM e financeiro implícitas | R37 no Painel de Regras e nas fichas de I1.5, I2.15 e I2.17 | 4.3 |

### 10.3 Viabilidade e UX

| ID | Sev. | Problema | Como foi resolvido | § |
|---|---|---|---|---|
| VIA-01 | alta | Revisar rebloqueava os níveis | `S.concluidos`; retry preserva `best`; refazer o desafio guarda histórico | 3.3, 3.5 |
| VIA-02 | alta | Desafios conferiam literais sobre `PF.db()` | Valores esperados vêm de `PF.calc` (variantes sobre cópia de `PF.base`); passos de ação verificam `PF.db()`; literais só no autoteste | 3.7, 5.5, 6.7, 7.6 |
| VIA-03 | alta | GO em P03 a tirava das candidatas | Filtro inclui `APROVADA`; decisões simuladas sobre P01–P08 nunca propõem transição | 3.10 |
| VIA-04 | alta | `PF.refresh` destruía os sliders | Regra C15: `input` atualiza só o contêiner; `change` persiste | 3.3, 3.10 |
| VIA-05 | alta | Escopo e linhas acima do teto | N3 com 5 telas; sem Kanban/Little/Gantt; opção como tabela; inovação como texto; N3 com 25 perguntas (22 graduadas); avaliação às cegas sem gravação; pauta com 5 seções; comparador triplo cortado; arquivos `calc.js`, `globais.js` e `governanca.js` | 3.1, 6, 7 |
| VIA-06 | média | Dashboard e Indicadores presos ao N1 | `PF.registerGlobal` e rotas globais `#/dashboard`, `#/indicadores`, `#/inventario`, `#/decisoes` | 3.3, 3.4 |
| VIA-07 | média | Sidebar com 28 itens | Acordeão; "Trilha do nível" única; ícones únicos; cabeçalhos descritivos | 3.4 |
| VIA-08 | média | Trabalho/Referência: link `ver`, query string, `PF.base` mutável | `deepFreeze`; escrita só em `PF.db()`; `parse()` com query; faixa da Referência; cálculos puros | 3.8 |
| VIA-09 | média | Divisões por zero | `PF.calc.div`; Cinza com motivo; TCPI "BAC esgotado"; D `null`; mesmo filtro para BAC e AC; casos no autoteste | 3.10, 9 |
| VIA-10 | média | SN-SET (encerramentos, CPI) não reproduzível | SN-SET gerada por `indicadoresFotografia(estadoEm(base, 04/09))`: CPI 0,88; encerramentos removidos | 4.12 |
| VIA-11 | média | Triagem e Seleção entregavam a resposta | Sugestão só depois do registro; "ótimo exato" só depois de DC2-02; `usouAjuda` | 3.7 |
| VIA-12 | média | Erro de triagem só se desfazia com reset | "Corrigir triagem"; reset com escopo "só demandas" | 5.2.6, 3.3 |
| VIA-13 | média | Mudança de versão de `data.js` apagava o trabalho | `data.js` completo na etapa 1; versão fixa; `PF.migrate` | 3.9, 12 |
| VIA-14 | média | Dashboard superlotado | Abas por nível; na aba N3 o painel de 7 substitui os cards; Indicadores em mestre-detalhe com filtro padrão | 3.4, 7.3 |
| VIA-15 | média | Missão GRC do N1 sem tela de decisões | Tela global Decisões e aba Decisões na ficha desde o N1 | 5.2.4 |
| VIA-16 | média | Classes da recomendação fora do catálogo | Mapeamento classe → `tipoDecisao`; campo `classeRecomendacao`; `refDecisaoAnteriorId`; decisão vigente | 4.2, 7.2.5 |
| VIA-17 | média | R35 dependia de um "próximo ciclo" inexistente | Versões posteriores ficam `vigente:false` com o selo "não usada na fotografia" | 4.3, 7.2.3 |
| VIA-18 | média | Desempenho do otimizador | Enumeração exata só com n ≤ 14; memoização por hash; fronteira e "por que ficou de fora" sob demanda | 3.10 |
| VIA-19 | média | Google Fonts bloqueava a renderização | Carregamento não bloqueante com `noscript`; fallback `system-ui` | 3.3 (C16) |
| VIA-20 | baixa | Formatos de pergunta fora do contrato | `multi` em DC3-05; AQ3-06 em `num`; `decisao` com `preSel`/`fixos`; DC1-02 com `cols.n` | 3.6, 5.4, 6.6, 7.5 |
| VIA-21 | baixa | Itens exatamente sobre os limiares das matrizes | Tabela com a regra de fronteira; deslocamento de rótulos | 3.10, 6.2.2 |
| VIA-22 | baixa | Datas em hora local | `Date.UTC` em `PF.calc.dias` | 3.3 (C18) |
| VIA-23 | baixa | Perfil e gamificação sem retorno | "Minha carteira" e `carteiraPmo` cortados; perfil só com nome; missões estáticas; 5 medalhas extras | 3.3 (C9), 8.1 |
| VIA-24 | baixa | Todos os parâmetros editáveis | Lista fechada (R43) | 3.10, 4.3 |
| VIA-25 | baixa | Importação ausente; PDF longo em branco | Importar progresso só para leitura; PDF em escala 1,5, paginado por `[data-pdf-page]` | 3.3 (C12, C13) |

### 10.4 Conflitos entre críticas e como foram resolvidos

| Conflito | Decisão |
|---|---|
| Little: "parâmetro de vazão" (PED/FID) × "remover a tela" (VIA) | Remover a tela de fluxo e a Lei de Little; WIP fica como conceito no N2 |
| Avaliação às cegas: "botão Registrar no Trabalho" (PED) × "só exercício" (VIA) | Só exercício, gravado em `modState` |
| Verificar desafios na Referência (PED) × recalcular sobre `PF.db()` (VIA) | Variantes calculadas por `PF.calc` sobre cópia de `PF.base`; passos de ação verificam `PF.db()` |
| Selo de simulação "só a partir do N2" (PED) × "em toda tela que escreve" (FID) | Faixa "Exercício" desde o N1 (linguagem simples); badge "Ref. de mercado" e "Rascunho de revisão" só a partir do N2 |
| Robustez com P03 a 75% incluindo C7 (PED) | Recalculado: 87,5% (7/8). A lição foi mantida: C7 é política, avaliada pelo custo |
| Medalhas: 11 (spec anterior) × 4 (VIA) | 5 extras, mantendo `m-preco`, ligada a um objetivo central do N3 |

---

## 11. O que é ilustrativo e o que precisa de validação da FEG

### 11.1 Ilustrativo: dados fictícios, que não devem ser validados e sim substituídos por dados reais quando houver uso real

- As 22 iniciativas: títulos, datas, % físico, BAC, AC, previsões, sinais declarados, notas C1–C5, P, I, FTE e custos.
- Fornecedores Alfa, Beta e Gama; especialista K; responsáveis e patrocinadores como papéis fictícios.
- Requisitos regulatórios R-00, R-01 e R-02 e os "documentos fictícios" que os evidenciam.
- Benefícios BEN-01..03 e suas medições; o programa A–D/M; a árvore de opção de P04.
- Capacidade de 10,0 FTE e orçamento de R$ 4,0 mi do "Ciclo Exemplo 2027"; data de referência 03/10/2026.
- Fotografia SN-SET, decisões DEC-001..005 e histórico HS-01..07.
- **O que não é usado:** valores reais de contratos e orçamento do deck (s245–s260) e nomes de pessoas de comentários e notas.

### 11.2 Proposta do Deck A&M v25 que a FEG precisa validar (`A_VALIDAR_FEG` + `PROPOSTA_CONSULTORIA`)

- Estrutura: 4 gerências, 10 comunidades, 13 squads, catálogo de ferramentas (R01, R02).
- Pool de Recursos de Governança: 5 blocos (R41) e cobertura de 4 HCs de PMO (s111–s118).
- Fóruns, periodicidades e saídas (R05a), e o nível de cada fórum inferido do layout.
- RACI de s143/s147/s149/s196 e quadrantes do s168, reconstruídos do texto extraído e **a conferir no slide** (R38, R39).
- Faixas de capacidade do s165 (R26), reserva de 15–20% do s166 (R27), 70/20/10 e TRL 7 (R31), classes de sourcing (R40).
- Gates de inovação (s189) e árvore inovação × entrega (s182).

### 11.3 Hipóteses e decisões em aberto (`A_VALIDAR_FEG`), exportáveis do Painel de Regras

1. Catálogo de fases e transições; se ENCERRADA permanece ativa (R11).
2. Taxonomia de categorias; se "Obrigatória" é categoria ou condição; evidência exigida (R12).
3. Limiares do sinal e tolerância de prazo (R13, R15). Se o sinal deve existir fora do exercício.
4. Critérios C1–C5, rubricas e pesos; tratamento do "custo cognitivo" (s138) (R19, R20).
5. Limiares de quadrante e de empate técnico (R22, R23).
6. Capacidade: unidade, método, ciclo, fungibilidade entre gerências e comunidades, conversão horas → FTE (R24, R25).
7. Adoção das faixas do s165 e da reserva do s166 (R26, R27).
8. Mix-alvo e tolerância; adoção do 70/20/10 e do handover em TRL 7 (R28, R31).
9. Periodicidades em conflito: Estratégico anual × quadrienal; Portfólio semestral × anual; Evolução trimestral × semestral (R05b).
10. Direito decisório do PMO na priorização: C (s143) × A (s149) × "contribui em estruturantes" (R33).
11. Limite FEG × Comissão Gestora do CT PMO-PLD e nome oficial do CT (R34).
12. Vínculo das comunidades técnicas à FEG; liderança de PLA pela DTA (R03).
13. Catálogo de tipos de decisão e alçadas; instâncias decisoras de baseline e escalonamento (R18).
14. Os "7 KPIs" da Home executiva: o painel da §7.3 é **candidato** descritivo; nomes, fórmulas, metas e fontes estão em aberto.
15. Papéis de aprendizagem do Afinação (R42) × blocos do Pool (R41); alocação das 3 analistas às 4 carteiras de PMO (4 HCs × 3 licenças, s251).
16. Objetivos estratégicos reais, a citar quando houver documento ONS aprovado (R04).
17. Unidade de valor de benefícios e de opções (pontos × R$).
18. Limiares de núcleo robusto e de HHI (R32); nota mínima de 70% e carga horária (R36b).
19. Conferir no PPTX original as RACIs, os quadrantes do s168 e a periodicidade de cada fórum (R38, R39).
20. Convenções financeiras: moeda e "previsão no término" (R37); regra para importadores rejeitarem `ilustrativo:true`.
21. Importação consolidada (CSV/JSON) vinda de ADO, Jira ou ITSM, sem substituir essas ferramentas.

### 11.4 Decisões de produto (DFP)

Não dependem de validação ONS, mas a FEG pode revisar:
- mecânicas do repositório (hierarquia, arquivar, 30/60/90, fotografia, append-only, `rowVersion`);
- normalização 0–100; desempates; convenção de meses de calendário; tratamento de divisão por zero;
- regra de desbloqueio (mecânica); modo exercício; triagem como recomendação; fórmulas de mercado adotadas.

### 11.5 Fonte ONS

**Nenhum item hoje.** Um item só passa a `FONTE_ONS` fora do app, por revisão de seed ou migration, com documento ONS aprovado citado (documento, versão, data, trecho e instância).

---

## 12. Ordem de construção, aceite e riscos

| Etapa | Entrega | Aceite |
|---|---|---|
| 1. Core e base | Mudanças C1–C18; `data.js` **completo** (§4); `calc.js`; `globais.js` (shells); `governanca.js` (Painel de Regras, Glossário, Autoteste vazio); `build.mjs` com os novos módulos | `node labs/portfolio-feg/build.mjs` gera arquivo único que abre em `file://` sem rede e sem tela em branco; roda sem `localStorage`; bloco "Dados" do autoteste 100%; `PF.base` congelado |
| 2. N1 Partitura | §5 | Autoteste N1 100%; desafio verificável; nenhuma tela com "excluir"; erro não revela resposta; modo exercício funcionando no Dashboard |
| 3. N2 Arranjo | §6, com o otimizador já genérico (`deps`, `excl`, `maxD`, `gcap`, `obrig`) | Autoteste N2 100%; 256 combinações em < 50 ms; fotografia FECHADA imutável; sliders sem perder o foco |
| 4. N3 Regência | §7 | Autoteste N3 100%; pesos congelados na fotografia do ciclo; `RULE_NOT_VALIDATED` e marca d'água na exportação |

**Riscos de produto e mitigação:**

| Risco | Mitigação |
|---|---|
| Confundir simulação com decisão real | `simulacao:true`, [SIMULAÇÃO], selo "Exercício", fóruns "[Simulado]", ciclo EX-2027, marca d'água |
| Edição da aprendiz "quebrar" o gabarito | Perguntas sobre `PF.base`; Referência congelada; desafios com variantes; "Corrigir"; reset com escopo e log preservado |
| Nomes reais de ferramentas sugerirem planos reais | Apelidos nos títulos, "(fictício)", vínculo de catálogo com nota |
| Proposta do deck virar "verdade" | Badge de proposta com slide; contradições mostram as duas fontes; RACI "a conferir" fora do desbloqueio |
| N3 pesado demais | 5 telas com abas; AHP, CPM e opção como aprofundamento; desafio com "escolha 1 de 3" |
| Score tratado como prioridade oficial | Sem índice agregado; pesos versionados e congelados; decisão humana com instância e justificativa |
| Medir cópia em vez de aprendizagem | Erro sem revelação; crédito perdido ao revelar; modo exercício; alternativas embaralhadas; variantes |

---

## Apêndice A. Formato de `data.js` (trecho ilustrativo)

```js
PF.base = {
  versao: 1, ilustrativo: true, origemDado: 'TRILHA_FEG_FICTICIO',
  dataReferencia: '2026-10-03',
  gerencias: [{ id:'FEN', sigla:'FEN', nome:'FEN', nomeProposto:'Ferramentas Energéticas', ativo:true, ilustrativo:true }],
  comunidades: [{ id:'PPE', nome:'Planejamento e Programação Energética', sigla:'PPE', siglaDidatica:false, tipo:'ENTREGA', gerenciaId:'FEN', lider:'a definir', ativo:true }],
  squads: [{ id:'PPE-C', nome:'Simulador de Despacho', comunidadeId:'PPE', ativo:true }],
  ferramentas: [{ id:'BALPONTA', nome:'BALPONTA', comunidadeId:'PPE', classeSourcing:'NUCLEO_CRITICO', ativo:true }],
  iniciativas: [{
    id:'E02', codigo:'E02', titulo:'Módulo de relatórios gerenciais de saídas do simulador de despacho (fictício)',
    descricaoObjetivo:'Padronizar relatórios gerenciais de saídas', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-C',
    ferramentaId:'BALPONTA', areaClienteOrigem:'Áreas usuárias (papel)', responsavel:'PO PPE-C (fictício)', patrocinador:'Gerente FEN (papel)',
    statusId:'EM_EXECUCAO', categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-2', origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS',
    envolveCtPmoPld:false, horizonteInovacao:'H1', ciclo:'EX-2026', dataEntrada:'2026-01-15',
    dataPlanejada:'2026-11-27', dataPrevistaAtual:'2027-03-26', horizontePrazo:null,
    percentualFisicoReal:50, percentualFisicoPlanejado:70, ragDeclarado:'VERDE',
    criticidade:'média', impacto:'áreas usuárias', trlEsperado:'n/a', beneficioEsperado:'Relatórios padronizados para áreas usuárias',
    linkOperacional:'https://ado.exemplo.invalid/E02', observacoes:'', ativo:true, rowVersion:3,
    createdAt:'2026-01-15T12:00:00Z', updatedAt:'2026-09-30T12:00:00Z', ilustrativo:true, origemDado:'TRILHA_FEG_FICTICIO'
  }],
  financeiro: [{ iniciativaId:'E02', periodo:'2026-01-01', orcamentoPlanejado:1.50, previsao:1.50, realizado:1.20,
    fonte:'Consolidação ilustrativa (ERP fictício)', dataReferencia:'2026-09-30', fornecedorPrincipal:'Beta' }],
  riscosImpedimentos: [{ id:'RK-P08', iniciativaId:'P08', natureza:'RISCO', descricao:'Fonte externa nova, sem contrato de dados; possível dependência de P02',
    probabilidade:4, impactoNota:3, acao:'Confirmar com a equipe técnica se depende de P02; negociar acordo de dados', status:'ABERTO', prazo:null }],
  parametrosSistema: [{ codigo:'R26', chave:'faixasCapacidade', valor:[/* … */], tipo:'json', origemRegra:'A_VALIDAR_FEG',
    tipoFonte:'PROPOSTA_CONSULTORIA', referencia:'Deck A&M Etapa 3 v25, s165 (proposta de consultoria, não aprovada; adaptado de Lovelock & Wirtz)',
    statusValidacao:'A_VALIDAR', versao:1, editavel:true, vigente:true }],
  // … demais coleções conforme §4
};
```

## Apêndice B. Arquivos de referência no repositório

| Arquivo | Uso |
|---|---|
| `labs/portfolio-feg/src/core.js` | Contrato `PF.registerLevel`, `renderQuestion` (~linha 318), `screenConfig` (~linha 477), `PF.unlocked` (~linha 151) |
| `labs/portfolio-feg/build.mjs` e `labs/portfolio-feg/index.html` | Lista `modules`; carregamento de fontes |
| `database/migrations/` (0003, 0004, 0005, 0006, 0007, 0011, 0012, 0014, 0015, 0017) | Origem das mecânicas DFP |
| `database/seeds/001_gerencias.sql`, `002_security_catalog.sql` | Siglas das gerências; perfis `A_VALIDAR_FEG` |
| `src/rules/initiativeRules.js` | Campos obrigatórios (R10a) e validação de URL |
| `docs/architecture.md`, `docs/data-model.md`, `docs/implementation-plan.md` | Princípios: sem score oficial, arquivar, regra transversal de validação |
| `public/afinacao-feg.html` | Paleta Maestro/ONS e naipes do Afinação (R42) |
