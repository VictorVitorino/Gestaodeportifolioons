# Modelos visuais de referência

Biblioteca de modelos de layout para usar como ponto de partida nas próximas apresentações executivas em HTML. Ao reaproveitar um modelo, substitua a paleta pela da Alvarez & Marsal (#002B49, #0085CA, #5E8AB4, #CE8E00, #02624B, #BC0404, #FCBF00) e aplique as regras de dados de cada projeto: sem dados inventados, fonte no rodapé e FATO → DADO → INSIGHT → IMPLICAÇÃO.

| # | Arquivo | Padrão visual | Quando usar | Componentes a reaproveitar |
|---|---|---|---|---|
| 01 | `01-swot-quebra-cabeca.png` | Anel em 4 peças de quebra-cabeça com ícones, 4 blocos de texto ligados por conectores em cotovelo | SWOT, 4 pilares, 4 quadrantes de diagnóstico | Donut segmentado clicável · conectores leader line · rótulos em pílula |
| 02 | `02-performance-dashboard.png` | Dashboard em grade com cabeçalhos em pílula; mistura de linha, colunas, pizza, colunas empilhadas e anel de % | Painel de indicadores e acompanhamento de metas | Seções com título em pílula · KPI tiles grandes (valor + rótulo) · anel de progresso |
| 03 | `03-capa-data-analysis.png` | Capa escura com tipografia gigante e barras em cápsula com gradiente e círculos | Capa, abertura de seção ou separador | Título em 2 linhas · faixa "Apresentado por" · animação de cápsulas deslizando |
| 04 | `04-okr-dashboard-dark.png` | Dashboard escuro em blocos, KPIs grandes "12 / 15", barras horizontais por área, linha de tendência e donut, cada gráfico com texto explicativo ao lado | OKRs, maturidade por área, confiança e aderência | KPI fracionário · barras de progresso com % · gráfico + legenda interpretativa (bom para o INSIGHT) |
| 05 | `05-sales-marketing-cards.png` | Fundo em gradiente azul com cards brancos arredondados: 2 gráficos grandes em cima, 3 cards menores embaixo (donut, anel %, pictograma de pessoas) | Análise comparativa, público-alvo, composição | Grade 2+3 · pictograma de pessoas (ex.: "5 de 7 entrevistas") · anel de % central |

## Aplicações sugeridas no contexto TMG
- **01** para os 4 pilares da reorganização (Cultura, Operação, Governança, Estrutura) ou para forças, pontos de atenção, gaps e riscos.
- **04** para o dashboard de maturidade por dimensão, com texto interpretativo ao lado de cada gráfico.
- **05** com o pictograma para mostrar a recorrência dos padrões (x de 7 entrevistas), em vez de números soltos.
- **03** como capa ou separador de seção, na versão navy A&M.

---

## Modelos 06–09 · Status Report Executivo de Gestão de Mudanças (GMO)

> As imagens destes modelos não chegaram como arquivo ao ambiente. Fica registrada aqui a especificação detalhada, suficiente para reproduzir o layout em HTML. Os PNGs podem ser adicionados depois nesta pasta, com os nomes indicados.

**Estrutura comum (1600×900):**
- **Cabeçalho navy** com cantos arredondados, dividido em 4 blocos:
  - logo do programa;
  - pílula branca "STATUS REPORT – EXECUTIVO";
  - pílula "DATA STATUS dd/mm/aa";
  - à direita, "GMO | Programa" e "Gestão de Mudanças".
  - Setas decorativas (▸▸▸) nas bordas.
- **Faixa de seção** colorida em gradiente, com o título em caixa alta precedido de ">". A cor muda por tema: verde para Cultura, dourado para Impactos.
- **Key Targets:** 4 cards KPI em linha. Cada card tem:
  - ícone circular;
  - título;
  - valor gigante em %;
  - barra de progresso;
  - selo de meta ("100%", "≥75%", "≥95%").

| # | Arquivo sugerido | Conteúdo / padrão | Componentes a reaproveitar |
|---|---|---|---|
| 06 | `06-status-cultura-stakeholders.png` | Status "Cultura & Stakeholders" (tema verde) | 4 KPIs (Cobertura, Perfil, Engajamento, Resistência) · **Mapa cognitivo** · 3 mini-KPIs "from last event" com sparkline (Prontidão / Adoção / Repercussão, semáforo verde / amarelo / vermelho) · **Heatmap de impacto** (área × complexidade / impacto / utilização, com bolinhas de semáforo) · **Donut de perfis** (Apoiador, Influenciador, Change Agent, Neutro) com rótulos em leader line · caixa **Insights** em bullets com prefixo em negrito |
| 07 | `07-mapa-cognitivo-stakeholders.png` | Detalhe do mapa cognitivo | Pictograma de 10 pessoas com preenchimento parcial (verde favoráveis × laranja receosos, com a pessoa de transição dividida) · % grande de cada lado com seta ↑/↓ circular · pílulas cinza de "Meta" |
| 08 | `08-cronologia-cia.png` | Linha do tempo do projeto em 7 fases (Pre Kick-off → Discovery → Design → Change Plan → Rollout → Sustentação → Designer Refinement) | Eixo horizontal "Project Start / Finish" · marcos circulares · setas para baixo com entregável e bullets · **setas de retorno em arco** (refinamento volta para Change Plan e Rollout) · título em pílula dourada |
| 09 | `09-status-impactos-riscos.png` | Status "Impactos e Riscos" (tema dourado) | 4 KPIs (Quantidade, Priorização, Execução e Eficiência da mitigação) · 4 **tiles de contagem** (Mapeados, Críticos, Planos, Ações) com seta de tendência · **colunas de status** (Mapeados 100% → Mitigados 18%) · tabela **Leitura analítica** (Dimensão · Áreas · Intensidade semáforo · Leitura) · **matriz de bolhas** criticidade × impacto (bolha = % dos impactos) · cronologia CIA embutida |

**Como aplicar no contexto TMG/A&M**
- Recolorir para a paleta A&M: navy no cabeçalho; verde #02624B, dourado #CE8E00 e vermelho #BC0404 para o semáforo.
- O **pictograma parcial** (07) serve para "x de 7 entrevistas".
- A **matriz de bolhas** (09) serve para impacto × criticidade das dimensões.
- A **cronologia com retornos** (08) serve para o roteiro 0–30 / 31–60 / 61–90 / 90+ com ciclos de ajuste.
- O **Status Report** (06/09) funciona como modelo de acompanhamento mensal da transformação, com KPIs, meta e tendência.
