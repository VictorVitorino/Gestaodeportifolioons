# Caderno de Nivelamento DTS — protótipo funcional

Diagnóstico de nivelamento de **DTS — Digital & Technology Services** em formato de caderno de atividades interativo.
Arquivo único, sem build e sem dependências além das fontes do Google Fonts (com fontes de reserva).

> Não é um quiz. Não existe gabarito, acerto ou erro. Cada escolha é uma **evidência de maturidade**
> (familiaridade, uso, reutilização, estruturação, criação, compartilhamento).

## Como abrir

- Abra `index.html` direto no navegador, ou sirva a pasta (`npx serve prototypes/diagnostico-dts`).
- As respostas ficam no `localStorage` do navegador (chave `dts-caderno-nivelamento`).
- **Recomeçar diagnóstico** (topo direito) apaga os dados após confirmação na própria página.
- **Painel interno de facilitação:** acrescente `#facilitador` ao endereço. Mostra índices declarado,
  demonstrado, consolidado, alinhamento, perfil por dimensão e o JSON completo (botão “Copiar JSON”).
  Nada disso aparece para o participante.

## As 7 experiências

| Página | Experiência | Linguagem visual | O que registra |
|---|---|---|---|
| 01 | Meu ponto de partida | matriz corporativa + régua navy | `declaredIndex` (6 dimensões, pesos 10/20/20/20/15/15, travas de 60% e 80%) |
| 02 | O que chama sua atenção? | storyboard em quadrinhos (17h42) | até 3 sinais percebidos na cena → `experience02` |
| 03 | Quem está mais perto? | mesa com fichas viradas | caminho semântico a partir de PROMPT → `experience03` |
| 04 | Por onde você iria? | mapa / labirinto | caminho A–D e `behaviorProfile` → `experience04` |
| 05 | A Skill que ninguém merece | documento bagunçado | até 3 elementos de reutilização → `experience05` |
| 06 | Salve este Prompt | rascunho com balões | até 3 peças de prompt → `experience06` |
| 07 | Retrato Falado DTS | caderno de desenho | rascunhos nº 1 e nº 2, análise estrutural local, `learningDelta` → `experience07` |

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

Dois blocos `<script>` no `index.html`:

- `#dts-core` — lógica pura, sem DOM: `CONFIG`, `CHARACTERS`, `LEVELING`, `SEMANTIC_GRAPH`,
  `EXPERIENCES`, `PROMPT_SIGNALS`, funções de cálculo (`calculateDeclaredIndex`, `applyLevelingCoherenceRules`,
  `getLevelingStage`, `calculateSemanticDistance`, `calculateSemanticProximity`, `calculateExperience02…07`,
  `analyzePromptStructure`, `calculateDemonstratedIndex`, `calculateAlignment`, `recomputeAll`).
  Testado em `tests/unit/diagnosticoDts.test.js` (`npm test`).
- `#dts-app` — estado, persistência, animações e as páginas. Os eventos só registram escolhas e chamam
  `commit()`, que recalcula tudo a partir do estado.

## Trocar os personagens por fotos reais

Edite `CHARACTERS` no bloco `#dts-core`:

```js
{ id: 'person01', name: 'Nome da pessoa', image: 'fotos/person01.jpg' }
```

Com `image: 'placeholder'` o slot mostra uma moldura vazia (nenhum rosto é gerado). `PERSONAGEM_01`
também aparece no storyboard da página 02.

## Validação feita

- Percurso completo automatizado no Chromium em 1366×768, 1366×657, 1440×900, 1536×864, 1920×1080 e 390×844:
  sem rolagem horizontal, sem texto cortado, sem sobreposição (notebooks cabem sem rolagem).
- Navegação só por teclado (setas nos grupos de rádio, Enter/Espaço nos cartões, foco visível).
- `prefers-reduced-motion` respeitado.
