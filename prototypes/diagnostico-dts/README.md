# Caderno de Nivelamento DTS — protótipo funcional

Diagnóstico de nivelamento de **DTS — Digital & Technology Services** em formato de caderno de atividades interativo.
Arquivo único, sem build e sem dependências além das fontes do Google Fonts (com fontes de reserva).

> Não é um quiz. Não existe gabarito, acerto ou erro. Cada escolha é uma **evidência de maturidade**
> (familiaridade, uso, reutilização, estruturação, criação, compartilhamento).

## Como abrir

- Abra `index.html` direto no navegador, ou sirva a pasta (`npx serve prototypes/diagnostico-dts`).
- As respostas ficam no `localStorage` do navegador (chave `dts-caderno-nivelamento`).
- Antes da página 01, a pessoa preenche a **etiqueta do caderno**: nome completo, e-mail e uma frase para completar
  (*"Para mim, trazer IA para dentro dos projetos de DTS é…"*). Sem etiqueta, nenhuma página abre.
- **Recomeçar diagnóstico** (topo direito) apaga os dados após confirmação na própria página e abre uma sessão nova.
- **Painel interno de facilitação:** acrescente `#facilitador` ao endereço. Mostra índices declarado,
  demonstrado, consolidado, alinhamento, perfil por dimensão e o JSON completo (botão “Copiar JSON”).
  Nada disso aparece para o participante. O painel também mostra participante, fila de envio e o botão **Reenviar tudo**.

## Base de respostas (Google Planilhas)

Tudo o que a pessoa responde chega numa planilha do Google por um App da Web do Apps Script.
Passo a passo em [`google-apps-script/LEIAME.md`](google-apps-script/LEIAME.md); o script está em
[`google-apps-script/Codigo.gs`](google-apps-script/Codigo.gs).

- **Um único ponto de configuração:** `sheetsEndpoint` no bloco `<script id="dts-config">`, no topo do `index.html`.
  Vazio = o caderno funciona igual e guarda tudo só no navegador.
  Já está apontado para o App da Web da planilha do nivelamento; para trocar de planilha, basta colar outro link `/exec`.
- **Abas criadas automaticamente por `configurarPlanilha`:**
  - **Diagnóstico** — uma linha por pessoa e **uma coluna por questão** (P01.1 … P07), agrupadas por seção colorida,
    com o **nível diagnosticado** logo depois da identificação.
  - **Regras** — pesos da página 01, travas de 60/80, pesos do demonstrado, 30/70, faixas de nível e tolerância de
    alinhamento. Editáveis: mudar um valor recalcula todos os níveis.
  - **Resumo** — participação, pessoas por nível, médias e alinhamento, em fórmulas.
- **O nível é calculado pela planilha:** as colunas de diagnóstico são fórmulas escritas na própria linha (índice
  declarado com travas, demonstrado, consolidado, os três níveis, próximo passo, alinhamento). As leituras de 0 a 100 das
  páginas 02 a 07 vêm do caderno (mapa de conceitos e análise do texto). A coluna "Confere com o caderno?" compara os dois.
- **Quando envia:** ao entregar a etiqueta e a cada troca de página; a linha se completa enquanto a pessoa responde.
  Só vai o que mudou.
- **Resiliente:** fila no navegador (`dts-caderno-envios`, no máximo um envio por sessão) com novas tentativas automáticas,
  envio ao reabrir o caderno, `sendBeacon` ao fechar a aba e botão "Tentar agora" no encerramento. O servidor atualiza
  a mesma linha (ID da sessão), então reenviar nunca duplica.

## As 7 experiências

| Página | Experiência | Brincadeira (post-it "Lembra…?") | Linguagem visual | O que registra |
|---|---|---|---|---|
| 01 | Meu ponto de partida | jogo de trilha | matriz corporativa + régua navy | `declaredIndex` (6 dimensões, pesos 10/20/20/20/15/15, travas de 60% e 80%) |
| 02 | O que chama sua atenção? | Detetive / caça às pistas | storyboard em quadrinhos (17h42) | 3 pistas na ordem em que a pessoa investigaria (a ordem fica em `selectedSignals`) → `experience02` |
| 03 | Quem está mais perto? | Lince + Cara a Cara | mesa com fichas viradas | caminho a partir de PROMPT → `experience03` |
| 04 | Por onde você iria? | labirinto | mapa | caminho A–D e `behaviorProfile` → `experience04` |
| 05 | A Skill que ninguém merece | recorte e cole | documento bagunçado | até 3 elementos de reutilização → `experience05` |
| 06 | Salve este Prompt | complete a frase | rascunho com balões | até 3 peças de prompt → `experience06` |
| 07 | Retrato Falado DTS | retrato falado | caderno de desenho | rascunhos nº 1 e nº 2, análise estrutural local, `learningDelta` → `experience07` |

Cada página segue a mesma sequência de leitura: **lembrança** (post-it "Lembra…?") → **analogia** →
**contexto** (subtítulo) → **ação** (pergunta e dica no rodapé). Na página 01, a faixa acima da matriz mostra a
pergunta da linha da vez (a próxima sem resposta, ou a linha em foco pelo teclado).

Na página 02, cada objeto da cena é uma pista ligada à entrega do Mapa de Impactos às 18h (sinal interno entre parênteses):
Prateleira de Métodos com o Método de Impactos ainda lacrado (3), ata do kick-off com áreas, go-live e público (3),
pedido vago no Claude (3), documento em branco (3), aviso do FLOWS (3), gaveta de Skills com um mapa de impactos
guardado (3), Mapa de Impactos entregue em outro projeto (2), relógio e lembrete da entrega à diretoria (1),
17 abas abertas (1) e convite do happy hour (0).

Capa e encerramento não são experiências. O encerramento mostra apenas o ponto de partida declarado.

## Modelo de cálculo (resumo)

- **Declarado:** `Σ (resposta/3) × peso`. Acima de 60% exige FLOWS ≥ 2 e (Skills ≥ 2 ou Métodos ≥ 2).
  Acima de 80% exige FLOWS, Skills, Métodos e Criação ≥ 2, com Skills, Métodos ou Criação = 3.
- **Grafo semântico:** `context–prompt–skill–method–agent–mcp–tools`, com `flows` ligado a `skill` e `method`.
  Distância = menor caminho (BFS). Proximidade = `max(15, 100 − (d − 1) × 25)`.
- **Demonstrado:** E02 15% · E03 20% · E04 20% · E05 15% · E06 15% · E07 15% (E07 usa o rascunho nº 2 quando existe).
- **Interno (não exibido):** `overallMaturityIndex = 0,3 × declarado + 0,7 × demonstrado`;
  `alignmentGap = |declarado − demonstrado|`; `alignmentIndex = 100 − gap`.
- **Perfil multidimensional:** evidências declaradas e demonstradas ficam separadas em
  `results.dimensionProfile` (ecosystemUsage, semanticUnderstanding, reuseBehavior, workflowMaturity,
  skillMethodMaturity, promptContextMaturity, agenticMaturity, creationSharing).
- A análise do Retrato Falado é **heurística local por palavras-chave** (sem IA). Pesos: Contexto 20,
  Personagem 10, Características 20, Ação 15, Cenário 10, Estilo 10, Resultado 15.

## Estrutura do código

Blocos `<script>` no `index.html`:

- `#dts-core` — lógica pura, sem DOM: `CONFIG`, `CHARACTERS`, `LEVELING`, `SEMANTIC_GRAPH`,
  `EXPERIENCES`, `PROMPT_SIGNALS`, funções de cálculo (`calculateDeclaredIndex`, `applyLevelingCoherenceRules`,
  `getLevelingStage`, `calculateSemanticDistance`, `calculateSemanticProximity`, `calculateExperience02…07`,
  `analyzePromptStructure`, `calculateDemonstratedIndex`, `calculateAlignment`, `recomputeAll`).
  Testado em `tests/unit/diagnosticoDts.test.js` (`npm test`).
- `#dts-report` — lógica pura da etiqueta (`validateParticipant`) e da linha da planilha (`diagnosisRecord`).
  Os nomes das chaves são os cabeçalhos da aba Diagnóstico, definidos em `google-apps-script/Codigo.gs`
  (`gruposDiagnostico_`). Testado com o Apps Script numa planilha simulada em `tests/unit/diagnosticoDtsBase.test.js`,
  que também garante que a aba Regras nasce com os mesmos pesos, travas e faixas do `#dts-core`.
- `#dts-app` — estado, persistência, envio para a planilha (`Sync`), animações e as páginas. Os eventos só registram escolhas e chamam
  `commit()`, que recalcula tudo a partir do estado.

## Time e caricaturas

As 7 pessoas do time estão em `CHARACTERS` (bloco `#dts-core`), com nome completo (usado na análise do rascunho)
e primeiro nome (etiqueta do polaroid). As caricaturas são SVGs desenhados em código, no traço de nanquim do caderno:
cabeça levemente maior, olhos expressivos, sorriso simpático e sem exagerar traços físicos.

- `caricaturas/gerar.mjs` descreve cada pessoa (cabelo, barba, óculos, roupa, gravata) e gera `caricaturas/*.svg`.
- O mesmo script injeta as artes no `index.html` (bloco `<script id="dts-art">`). Depois de ajustar alguém:
  `node prototypes/diagnostico-dts/caricaturas/gerar.mjs`.
- O storyboard da página 02 usa um personagem neutro, **Você**, para que ninguém do time apareça na cena do aperto das 17h42.
- Para usar uma foto no lugar da caricatura, informe o caminho em `image` (ex.: `fotos/person01.jpg`).

## Validação feita

- Percurso completo automatizado no Chromium em 1366×768, 1366×657, 1440×900, 1536×864, 1920×1080 e 390×844:
  sem rolagem horizontal, sem texto cortado, sem sobreposição (notebooks cabem sem rolagem).
- Navegação só por teclado (setas nos grupos de rádio, Enter/Espaço nos cartões, foco visível).
- `prefers-reduced-motion` respeitado.
- Envio para a planilha testado no Chromium contra um Apps Script simulado: etiqueta obrigatória, linha que se completa
  página a página, nada reenviado sem mudança, queda de rede com fila e "Tentar agora", fila enviada ao reabrir,
  fallback `no-cors`, "Reenviar tudo" e recomeço com sessão nova.
- Fórmulas da aba Diagnóstico executadas num motor de planilhas independente (HyperFormula) para 612 perfis (aleatórios,
  travas de 60/80, extremos e incompletos): índices, níveis, travas, próximo passo e alinhamento idênticos ao `#dts-core`.
