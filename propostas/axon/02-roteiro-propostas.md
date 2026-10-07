# Axon · Roteiro final das propostas A (GMO) e B (TMO)

> Roteiro de produção para o desenvolvedor do HTML. Síntese das três lentes do painel de design (Pessoas, Executiva, Experiência) com os insights do arquiteto-líder.
> Fontes: [`00-briefing-original.md`](00-briefing-original.md), [`01-contexto-axon.md`](01-contexto-axon.md), deck de referência de 6 slides (`referencias/render/slide-1.jpg` a `slide-6.jpg`).
> Versão 1 · 07/10/2026.

---

## 0. Cabeçalho

### 0.1 Propósito

Duas propostas de **trabalho** (não de preço), em um único HTML navegável, para levar o Axon do MVP à adoção nas gerências **PE · PR · PL · OS · PD**, com horizonte mínimo de 6 meses:

- **Proposta A · GMO:** Gestão de Mudanças pura. Prepara as pessoas para cada passo da adoção.
- **Proposta B · TMO:** Transformation Management Office = GMO (≈70% do esforço) + PMO (≈30%). Prepara as pessoas **e** sincroniza os passos: roadmap do produto × ondas de adoção × desligamento de legados, num Plano Mestre com portões de decisão, funil único de demanda, RAID e benefícios.

Cada deck tem **6 slides** (o slide 1 é capa e contexto, como na referência) e responde a quatro perguntas: **O QUE** entregamos, com **QUAL MÉTODO**, com **QUAL PLANO DE TRABALHO** e com **QUAIS ENTREGÁVEIS**.

| Pergunta | Proposta A · GMO | Proposta B · TMO |
|---|---|---|
| O que | A1 | B1 |
| Método | A2, A3, A4 | B2, B3 (GMO) · B4, B5 (PMO) |
| Plano de trabalho | A5 | B4 (Plano Mestre) · B6 |
| Entregáveis | A6 | B6 |

### 0.2 Premissas de integridade (inegociáveis)

1. **Únicos dados factuais**, sempre com o rótulo *"informado pelo time do produto, a validar"*:
   - MVP em produção com **2 times pioneiros** (ex.: Hidrologia);
   - teste com **176 mil casos em ~2 h**, contra **~3 dias** estimados no processo atual;
   - ambição de **~150 usuários em 6 a 12 meses**;
   - **custo por rodada visível** (exemplo citado: menos de US$ 0,01 em fan-out).
2. **Nada inventado:** nenhuma meta, economia, honorário, quantidade de pessoas, percentual de resultado ou data de calendário. **Nenhuma razão calculada** a partir do teste do MVP ("x vezes mais rápido" é proibido).
3. **"M1–M6"** = meses após o início da atuação, nunca meses do calendário.
4. **Indicadores** aparecem como fórmula + fonte; linha de base e metas são pactuadas no diagnóstico.
5. **"≈70% / ≈30%"** é sempre rotulado como *ênfase indicativa do esforço, calibrada no diagnóstico* (não é composição de preço nem de equipe).
6. **Nenhum nome de pessoa.** Times só como exemplo (Hidrologia). Siglas das gerências **sem** significado inventado. Nenhum sistema legado real nomeado nas animações (usar "Legado A").
7. **Headcount** é sempre decisão da liderança e de Pessoas/RH, com evidência. A proposta se compromete com **processo** ("um destino para cada pessoa"), nunca com **desfecho** ("ninguém será afetado").
8. **Heatmap:** células por gerência nascem "a mapear" (cinza). Intensidade só por **perfil** e como **hipótese**. Painéis da vitrine com "—" no lugar de números.
9. **Simulações** (rodada espelho, copiloto, funil) trazem o selo *"ilustrativo"*.

### 0.3 Como ler este roteiro

- Blocos ```` ```text ```` = **copy visível final**, exatamente como deve aparecer. Linhas iniciadas por `§` indicam a **zona** do slide e **não** são texto visível.
- `[▶ Rótulo]` = botão. `›` = chevron laranja. `◆` = portão (losango laranja). `|` em copy = separação de colunas ou de rótulo e texto.
- **Revelações** (clique, flip, alternador) podem ter até ~80 palavras por item. Códigos `R-xx` apontam para a **Biblioteca de revelações** (seção 1.9), compartilhada pelos dois decks.
- Limite: **≤ ~150 palavras visíveis por slide** (título, subtítulo e rodapé incluídos). Revelações não contam.
- Grid de referência: **canvas 1280 × 720 px**, escalado para caber na janela (ver seção 4).

### 0.4 Julgamento das lentes e decisões de síntese

Notas de 1 a 10.

| Lente | Proposta | Clareza executiva | Profundidade de mudança | Diferenciação / inovação | Cabe em 6 slides | Média |
|---|---|---|---|---|---|---|
| Pessoas | A · GMO | 8 | **9** | 8 | 7 | **8,0** |
| Pessoas | B · TMO | 8 | 8 | 7 | 7 | 7,5 |
| Executiva | A · GMO | **9** | 7 | 6 | **8** | 7,5 |
| Executiva | B · TMO | **9** | 8 | 8 | 7 | **8,0** |
| Experiência | A · GMO | 7 | 8 | **9** | 6 | 7,5 |
| Experiência | B · TMO | 7 | 8 | **9** | 6 | 7,5 |

**Espinha dorsal escolhida**

- **A · GMO → espinha da lente Pessoas.** Melhor tese (o problema é identitário), melhor arco humano e a única com a transição tratada como jornada (Bridges). Enxertos: lupa de três níveis e "uma atividade, dois olhares" (Executiva); rodada espelho, Axon Live, "um botão, quatro vozes", escada de aprendizagem, orçamento de treino e copiloto (Experiência); 4R e Guardiões do Legado (arquiteto).
- **B · TMO → espinha da lente Executiva.** É a única cuja camada PMO é realmente distinta (Plano Mestre, portões G0–G4 com aceite do dono do processo, funil de demanda, RAID vivo, benefícios por fórmula, RACI e critério de saída do próprio TMO). Enxertos: costura "legado relacionado + onda" no mapa de impactos (Experiência), três chaves do desligamento (Experiência), funil-escudo com triagem por tipo de voz (Pessoas e Experiência), Torre de Controle e metáfora do sistema nervoso (arquiteto).

**O que foi descartado, e por quê**

| Ideia descartada | Origem | Motivo |
|---|---|---|
| Animação de "capacidade" em que nenhum ponto cai para fora do quadro | Executiva A4 | Promete implicitamente que ninguém sai: fere a premissa 7. |
| Termômetro de convicção por gerência | Executiva B3 | Expõe gerências; contradiz "sem ranking". |
| Três relógios girando | Pessoas B1 | Substituídos por **três trilhos convergentes**: mais legíveis e coerentes com o axônio (o impulso corre por fibras). |
| "Limiar" e "somação" como nomes visíveis | Experiência | Competiam com "portão" e "nódulo". Fica um único vocabulário: **portão** no slide, **nódulo** na navegação. |
| Gantt de 8 frentes no slide final do TMO | Executiva B6 | A tabela com coluna GMO mais larga comunica o 70/30 com menos tinta. |
| Seletor de perfil + vitrine + copiloto + manual + escada num só slide | Experiência B4 | Densidade acima do limite; redistribuído entre B3 e a biblioteca de revelações. |
| Selos Kotter/ADKAR/Bridges como elementos visuais | Pessoas A1 | Viram uma linha de método clicável; o slide 1 fica limpo. |
| "Catequizar" no slide | Briefing | Fica nas notas do apresentador (termo do cliente); no slide, "evangelizar com prova" e "mostrar, não convencer". |

**Grandes ideias que sobreviveram ao escrutínio (diferenciam as duas propostas)**

1. **Guardiões do Legado: quem conhece o legado valida o futuro.** As pessoas mais ameaçadas têm o conhecimento mais necessário para a migração segura (exceções, paridade, validação). Torná-las protagonistas reduz o risco técnico e o humano ao mesmo tempo.
2. **Rodada espelho como unidade da mudança.** O mesmo estudo roda no sistema atual e no Axon: um único ritual gera capacitação, medição do tempo por processo, protagonismo do Guardião e o critério de desligamento.
3. **4R para a capacidade liberada:** Reconhecer, Requalificar, Realocar, Reinventar. Premissa de desenho: minimizar impacto em headcount, sem prometer o que não depende de nós.
4. **Radar de Inquietações:** o reporte de bug autoalimentado que já existe passa a ouvir dúvida, ideia e receio. No GMO, é escuta triada; no TMO, vira governança de demanda que protege o time do produto.
5. **FinOps como mudança oculta:** o Axon transfere à área a autonomia **e** a responsabilidade pelo custo de cada rodada. Entra no mapa de impactos, ganha trilha própria e aparece no Axon Live.

---

## 1. Sistema narrativo e visual compartilhado

### 1.1 Arco narrativo

| | Arco | Sensação que a audiência deve levar |
|---|---|---|
| **A · GMO** | A1 o que permanece, muda e nasce → A2 onde muda, atividade por atividade → A3 e as pessoas? → A4 por que acreditar → A5 como chegamos lá → A6 como medimos e o que entregamos | "Eles entenderam que o problema é de identidade, não de software, e têm um plano para cada pessoa." |
| **B · TMO** | B1 três ritmos, um plano → B2 pessoas no centro → B3 convicção e capacitação → B4 Plano Mestre e portões → B5 Torre de Controle → B6 plano, entregáveis e quem decide | "Eles cuidam das pessoas e também garantem que produto, ondas e legados andem no mesmo compasso, sem afogar o time do produto." |

Frase-mãe das duas propostas: **"O processo permanece; muda o como."**
Frase de identidade: **"Do 'eu rodo' ao 'eu desenho, valido e analiso'."** (aparece nas notas e na revelação R-13; no slide, a versão respeitosa: "Do domínio do legado à autoria do novo").

### 1.2 Metáfora neural: o sistema e as regras

| Termo | Na biologia | No programa | Onde aparece |
|---|---|---|---|
| **Axônio** | Fibra que conduz o impulso entre neurônios | A plataforma Axon: conduz os jobs em fluxos integrados | Nome do produto; revelação R-02 |
| **Mielina** | Bainha que acelera a condução e evita a perda de sinal | **A GMO**: faz o novo jeito de trabalhar chegar rápido e sem perda a cada pessoa | Revelação R-02 (clique em "Axon" no título de A1); notas |
| **Sistema nervoso** | Mielina + coordenação central | **O TMO**: acelera a adoção e coordena os sinais de produto, pessoas e legados | Revelação R-03 (B1); notas |
| **Condução saltatória** | O impulso salta de nódulo em nódulo (nódulos de Ranvier) | **Ondas de adoção**: cada onda é um nódulo; cada portão é um salto autorizado | Barra de progresso; animação dos portões (A5, B4) |
| **Sinapse** | Ponto de passagem do sinal entre células | **Rede Sinapse** (embaixadores) e os pontos de passagem entre raias do Plano Mestre | Nome próprio da rede; microcopy em B4 |
| **Neuroplasticidade** | "Neurônios que disparam juntos se conectam" | Prática repetida cria o novo hábito (escada Ver › Fazer junto › Fazer sozinho › Ensinar) | Revelação da escada (A5, B3); notas |

**Regras de uso**

1. **Títulos sempre executivos.** A metáfora vive em: um nome próprio visível (**Rede Sinapse**), revelações, animações, barra de progresso e notas.
2. **Nenhum número biológico** ("a mielina acelera N vezes"): fere a premissa 2.
3. **Proibido:** cérebros ilustrados, neurônios com dendritos, mascote, "reprogramar pessoas", "poda".
4. **Geometria sóbria:** linhas de 1,5 a 2 px em azul aço, nós de 6 a 8 px, impulso = ponto laranja de 8 px com brilho suave.
5. **Toda animação ensina um mecanismo** (fluxo de job, triagem, portão, sincronia). Se não ensina, sai.

### 1.3 Motivos visuais recorrentes

| Motivo | Descrição | Uso |
|---|---|---|
| **Fio do axônio** | Linha fina azul aço com nós; o impulso laranja percorre a linha | A1 (cards ligados), B1 (três trilhos), navegação |
| **Impulso** | Ponto laranja de 8 px que pulsa uma vez | Indica elemento clicável (um pulso ao entrar no slide) e anima fluxos |
| **Portão ◆** | Losango laranja de 14 px sobre a linha do tempo | A5 (◆1 a ◆3), B4 (G0 a G4) |
| **Mito × Fato** | Carta que vira: frente navy com a frase-medo entre aspas; verso `#EDF2F7` com o fato | A4, B3 |
| **Heatmap em três estados** | `#EDF2F7` "a mapear" → `#5E8AB3` "hipótese" → `#002B49` "validado"; contorno laranja = "em ação" | A2, B2 |
| **Mock "—"** | Painéis do Axon Live e de benefícios com "—" e o selo "dados reais a partir da linha de base" | A4, B3, B5 |

### 1.4 Paleta

| Token | Hex | Uso |
|---|---|---|
| `--navy` | `#002B49` | **Dominante:** títulos, faixas de KPI, painéis de resultado, cabeçalhos de tabela, blocos de governança |
| `--orange` | `#F78C16` | **Acento apenas:** números 01–06, chevrons, portões, impulso, rótulos de destaque, KPI em faixa navy |
| `--steel` | `#5E8AB3` | Subtítulos, cabeçalhos de gerência, barras secundárias, linhas do axônio, estado "hipótese" |
| `--panel` | `#EDF2F7` | Cards, linhas pares de tabela, células "a mapear", verso das cartas |
| `--gray` | `#646464` | Texto de apoio, rodapés de premissas, número do slide |
| `--white` | `#FFFFFF` | Fundo do slide; texto sobre navy |
| `--line` *(tom de apoio)* | `#CCD4DA` | Único tom adicional: bordas, grades de tabela e trilhos inativos (é o `lt2` do tema da referência) |

Proporção visual alvo por slide: branco ≈ 55%, navy ≈ 25%, painel ≈ 15%, laranja ≤ 5%.
Modo escuro: **não** aplicar ao canvas do slide (é um documento 16:9 de identidade fixa); a moldura externa da página (fora do canvas) pode usar `#0B1620` em `prefers-color-scheme: dark`.

### 1.5 Tipografia

- **Família:** **Archivo** (Google Fonts, variável com eixo de largura), em largura ~87,5% para aproximar a Arial Nova Cond. Fallback: `"Archivo Narrow", "Arial Narrow", Arial, sans-serif`.
  `https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&family=Archivo+Narrow:wght@400..700&display=swap`
- **Escala no canvas 1280 × 720:**

| Elemento | Tamanho | Peso | Cor |
|---|---|---|---|
| Título | 34 px / 1,15 | 500 | navy |
| Subtítulo | 19 px / 1,3 | 400 | azul aço |
| Rótulo de seção (caixa alta) | 14 px, tracking +0,02em | 700 | navy |
| Corpo de card | 15 px / 1,3 | 400 | navy |
| Rótulo de card | 16 px | 700 | navy |
| Número "01" | 22 px | 800 | laranja |
| KPI na faixa | 26 px número (laranja, 800) + 17 px rótulo (branco, 400) | | |
| Rodapé de premissas | 12 px / 1,35 | 400 | cinza |
| Número do slide | 11 px | 400 | cinza |

Números com `font-variant-numeric: tabular-nums`. Caixa alta só em rótulos de seção.

### 1.6 Componentes recorrentes

| Componente | Especificação |
|---|---|
| **Cabeçalho** | Título em x = 50, y = 48; subtítulo logo abaixo, largura máx. 1100 px, até 2 linhas. |
| **Marca** | `ALVAREZ & MARSAL` em versalete (small caps), 11 px, tracking +0,08em, navy a 85%, alinhada à direita em x = 1230, y = 22. Somente texto, como na referência. |
| **Faixa navy de KPIs** | Largura total útil (50 → 1230), altura 68 px, fundo navy; número/termo em laranja 26 px 800 + rótulo branco 17 px. Separadores verticais `#33546D` de 1 px. |
| **Card numerado** | Fundo `#EDF2F7`, raio 2 px, padding 14 × 18; número "01" laranja à esquerda; título navy 16 px 700; texto 15 px. Variante com barra vertical de 4 px à esquerda (azul aço ou laranja), como no slide 5 da referência. |
| **Chevron** | `›` laranja em SVG (12 × 18 px) entre etapas; nos fluxos horizontais, cabeçalhos navy com número laranja (slide 3 da referência). |
| **Tabela** | Cabeçalho navy com texto branco 14 px 700; linhas alternando branco e `#EDF2F7`; grade `#CCD4DA` 1 px; primeira coluna em negrito navy. |
| **Painel de resultado** | Fundo navy; rótulo laranja em caixa alta; frase principal branca 22 px 700; itens "01–04" com número laranja. |
| **Rodapé de premissas** | 12 px cinza, x = 50, y ≈ 668, largura máx. 1100 px, até 2 linhas. |
| **Número do slide** | 11 px cinza, x = 1230, y = 690, alinhado à direita. No TMO, precedido do **selo de ênfase** (pílula 10 px: "GMO", "PMO" ou "GMO + PMO"; GMO em laranja, PMO em azul aço). |
| **Indicador de clique** | Ponto laranja de 8 px no canto superior direito do elemento; pulsa uma vez ao entrar no slide; cursor `pointer`; foco por teclado com anel laranja de 2 px. |
| **Revelação** | Popover branco com borda superior navy de 3 px, sombra suave, largura 320–420 px, fecha com Esc ou clique fora; ou carta com flip 3D (rotateY, 500 ms). Uma revelação aberta por vez. |

### 1.7 Glossário de linguagem: evitar × preferir

| Evitar | Preferir |
|---|---|
| Redução de headcount, FTE liberado, corte, enxugar | Capacidade liberada com destino; 4R; transição |
| Resistência, resistentes | Inquietações, receio legítimo, barreiras |
| Catequizar (no slide) | Evangelizar com prova; mostrar, não convencer |
| O sistema vai substituir vocês; eliminar atividades | O Axon assume o repetitivo; o macroprocesso permanece |
| Sem depender da TI | Dentro das regras definidas com a TI |
| A IA decide; autocorreção em produção | A IA propõe, a pessoa aprova; correção aprovada por pessoa antes da produção |
| Usuário básico | Executor |
| Gerências mais impactadas | Perfis com maior intensidade esperada (hipótese) |
| Agentes (sozinho) | Agentes do setor (externos) × agente de IA |
| Rito de desligamento de pessoas | "Desligamento" só para sistemas: passagem de bastão |
| x vezes mais rápido | 176 mil casos em ~2 h, contra ~3 dias estimados (informado, a validar) |
| Ranking, competição | Progresso coletivo |

### 1.8 Tom do lúdico

O lúdico está na **interação** (virar, clicar, simular, pulsar), nunca no tom do texto. No máximo **uma animação simultânea** por slide, 300 a 700 ms, sem som, respeitando `prefers-reduced-motion`. O deck precisa fazer sentido **fechado** (sem nenhum clique) e **impresso** (modo leitura).

### 1.9 Biblioteca de revelações compartilhadas (R-xx)

**R-01 · Evidências do MVP**
> Informado pelo time do produto, a validar no diagnóstico. MVP em produção com 2 times pioneiros (ex.: Hidrologia). Teste reportado: 176 mil casos em ~2 h, contra ~3 dias estimados no processo atual. Ambição: ~150 usuários em 6 a 12 meses. Custo por rodada visível antes de executar (exemplo citado: menos de US$ 0,01 em fan-out). No diagnóstico, esses indícios viram linha de base medida.

**R-02 · Por que mielina?**
> O axônio conduz o impulso entre neurônios. A mielina é a bainha que o envolve: acelera a condução e evita a perda de sinal. O Axon já conduz; a gestão de mudanças é a mielina, o que faz o novo jeito de trabalhar chegar rápido e sem perda a cada pessoa. E, como na biologia, ela se forma com uso repetido: prática, não apresentação.

**R-03 · Por que sistema nervoso?**
> O TMO é a mielina mais a coordenação central. Além de acelerar a adoção, sincroniza os sinais que vêm do produto, das pessoas e dos legados. As ondas funcionam como a condução saltatória: o impulso salta de nódulo em nódulo. Cada onda é um nódulo; cada portão, um salto autorizado. Nada salta sem que os três sinais estejam prontos.

**R-04 · Fórmulas e fontes dos indicadores** (linha de base, metas e periodicidade pactuadas no diagnóstico)

| Indicador | Fórmula | Fonte | Deck |
|---|---|---|---|
| Prontidão | Pessoas da onda com critérios ADKAR atendidos ÷ pessoas da onda × 100 | Pulso anônimo e checklist por onda | A6 |
| Adoção efetiva | Rodadas elegíveis executadas no Axon ÷ total de rodadas elegíveis × 100 | Registros de execução + inventário do diagnóstico | A6, B3 |
| Autonomia | Pessoas aprovadas na prova prática sem apoio ÷ pessoas capacitadas × 100 | Avaliação prática por perfil | A6 |
| Protagonismo | Pessoas de legado com novo papel ativo ÷ pessoas de legado mapeadas × 100 | Rotas 4R pactuadas | A6 |
| Tempo por processo | (Tempo de ciclo na linha de base − tempo de ciclo no Axon) ÷ tempo de ciclo na linha de base × 100, por processo | Cronometragem no diagnóstico + rodadas espelho + registros do Axon | A6, B3, B5 |
| Sombra no legado | Rodadas repetidas no legado "por garantia" ÷ rodadas no Axon × 100 (quanto menor, melhor) | Registros dos dois ambientes | A6 |
| Times ativos | Times com ao menos uma rodada própria no período ÷ times previstos na onda × 100 | Registros de execução por projeto | B3 |
| Inquietações e respostas | Abertas, em análise e resolvidas, por tipo (bug, dúvida, ideia, receio); tempo até a primeira resposta | Radar de Inquietações | B3 |
| Você disse, nós fizemos | Inquietações com resposta publicada ÷ inquietações recebidas × 100 | Backlog | B3 |
| Qualidade das rodadas | Rodadas com divergência ou reexecução ÷ rodadas executadas × 100 | Registros de execução e chamados | B5 |
| Desvio de custo por rodada | \|Custo realizado − custo previsto\| ÷ custo previsto × 100 | Custo por rodada exibido no Axon | B3, B5 |
| Consumo do orçamento | Custo realizado no período ÷ orçamento do time no período × 100 | Orçamento configurado no Axon | B5 |
| Funções de legado absorvidas | Funções do legado executadas no Axon ÷ funções inventariadas × 100 | Inventário de legados + atas do comitê | B5 |

**R-05 · Trilhas por perfil e prova de autonomia** (formato comum: escada Ver › Fazer junto › Fazer sozinho › Ensinar; aprender migrando um estudo real do próprio time)

| Trilha | Módulos | Prova de autonomia |
|---|---|---|
| **Construtor** | Padrão de documentação do container; contrato de entrada e saída; builds, logs e segurança; versionamento; "documentação = realidade do código". | Publicar um container documentado cuja caixinha rode num pipeline real. |
| **Arquiteto de estudos** | Pipeline low code; tela de parâmetros (faixa, número, seleção, data, texto, tabela); duplicar e salvar estudos; copiloto de IA com revisão. | Migrar um estudo do próprio time, substituindo os arquivos de definição. |
| **Executor** | Executar; acompanhar status; entender um erro; achar a saída (download, catálogo, Axon Drive); reportar no Radar. | Rodar sozinho o estudo da rotina e localizar a saída. |
| **Consulta** | Axon Drive; catálogo de dados corporativo; permissões por projeto. | Encontrar o resultado de um estudo sem pedir a ninguém. |
| **Gestor de orçamento** | Custo por rodada; escolha de máquina; fan-out consciente; orçamento mensal e anual; leitura de desvio. | Configurar o orçamento do time e explicar um desvio. |
| *Rede Sinapse (transversal)* | Facilitação de clínicas; escuta e registro de inquietações; primeira linha de dúvida. | Conduzir uma clínica com o próprio time. |
| *Liderança (transversal)* | Conversa de transição; patrocínio visível; reconhecimento; leitura do Axon Live. | Pactuar as rotas 4R do time com Pessoas/RH. |

**R-06 · Mito × Fato** (frente → verso)
1. "Vou perder meu posicionamento." → Quem domina o legado é quem melhor ensina o Axon: vira Guardião, valida a equivalência e assina os casos de teste. Autoria é posicionamento. Cenários de quadro só com evidência, pela liderança e por Pessoas/RH.
2. "Vão desligar meu sistema amanhã." → Desligamento gradual, função por função, depois de autonomia comprovada e de rodadas espelho aceitas. Precedente interno: o Workfront absorveu sistemas satélites aos poucos.
3. "A IA vai decidir por mim." → A IA, via MCP, preenche parâmetros quando você pede. Você revisa, aprova e continua respondendo pelo estudo.
4. "Orçamento de nuvem não é comigo." → Cada time passa a ver o custo por rodada e a gerir o próprio orçamento. Antes disso, trilha de gestor de orçamento e orçamento de treino.
5. *(só no modo leitura)* "Low code é para quem não sabe modelar." → O low code tira o repetitivo; o conhecimento do modelo continua sendo o diferencial, e o contrato que o construtor escreve vira a caixinha que todos usam.

**R-07 · Três perguntas por perfil**

| Perfil | Deixa de fazer | Passa a fazer | Precisa aprender |
|---|---|---|---|
| Operam rodadas e mantêm legados | Rodar, atualizar e conferir manualmente | Guardião do Legado; arquiteto de estudos; mais tempo de análise | Contratos de entrada e saída, pipelines, critérios de equivalência |
| Preparam estudos de vez em quando | Editar arquivos de definição | Montar estudos na tela de parâmetros, duplicar, revisar a IA | Tela de parâmetros, pipelines, copiloto |
| Só executam e conferem | Disparos manuais e conferência solta | Executar e acompanhar com poucos cliques | Rodar, ler status e erro, achar as saídas |
| Consultam resultados | Pedir arquivo a alguém | Buscar no Axon Drive e no catálogo de dados corporativo | Onde está, quem tem acesso |
| Constroem modelos e containers | Manter interface e configuração próprias por sistema | Publicar containers documentados que viram caixinhas arrastáveis | Padrão de documentação, contratos, builds, logs, segurança |
| Gerem orçamento de nuvem | Conviver com custo invisível | Definir e acompanhar o orçamento do time | Custo por rodada, escolha de máquina, fan-out |
| Agentes do setor (externos) | Receber ligações e e-mails de validação | Receber o retorno automático via Caixa de Entrada | Ler o novo relatório, no mesmo canal |

**R-08 · Rodada espelho (protocolo)**
1. O time escolhe **seu** primeiro processo a espelhar.
2. O Guardião do Legado define os casos de teste, inclusive as exceções que só ele conhece.
3. O mesmo estudo roda no sistema atual e no Axon, com registro do tempo de ciclo nos dois.
4. O Guardião aceita ou devolve o resultado. Testa-se o sistema, nunca a pessoa.
5. Aceite registrado: o processo acende no Axon Live, o tempo por processo entra no painel e o critério de desligamento avança.

**R-09 · Passagem de bastão (desligamento gradual de um legado ou função)**
1. Inventário de funções do legado, feito com quem o mantém (escuta, não auditoria).
2. Memória do Legado: exceções, regras implícitas e "pulos do gato" registrados com autoria.
3. Convivência com fim combinado: sombra no legado em queda e autonomia comprovada.
4. Última rodada em paralelo, conferida pelo Guardião.
5. Desligamento da função, com crédito público a quem a manteve e o novo papel dela já ativo.
*Precedente interno: o Workfront absorveu aos poucos as responsabilidades de sistemas satélites, com business case de desligamento ao longo do ano. Calendário sempre sujeito à validação técnica.*

**R-10 · Radar de Inquietações (um botão, quatro vozes)**
> O reporte de bug que já existe (captura de sessão, print, versão, link e área, com triagem por agente e aprovação humana antes da produção) ganha três novas vozes: dúvida, ideia e receio. **Bug** segue a esteira atual do produto. **Dúvida** vira resposta ou receita no Guia de Bolso. **Ideia** vira item de backlog. **Receio** vira ação de mudança (conversa, ajuste de plano, Mito × Fato). Toda resposta volta ao Axon Live: "você disse, nós fizemos".

**R-11 · Copiloto de parâmetros (IA via MCP)** *(simulação ilustrativa)*
> Quadro 1: a pessoa digita "Rodar o estudo de previsão de carga para o próximo mês, com o horizonte padrão". Quadro 2: os campos de data, horizonte e seleção se preenchem, com custo estimado visível. Quadro 3: botão "Revisar e aprovar". Regras: a IA propõe, a pessoa aprova; nenhuma rodada parte sem confirmação; uso opcional e registrado; regras de segurança e de dados definidas com a TI antes da Onda 0.

**R-12 · Guia de Bolso do Axon (manual friendly)**
> Não é manual técnico: responde "o que muda para mim". Sumário: (1) O que muda na sua semana, uma página por perfil; (2) Suas primeiras receitas: duplicar um estudo, ajustar um parâmetro, rodar, achar o resultado; (3) Quanto custa sua rodada; (4) Peça ajuda à IA, e quando não pedir; (5) Tenho uma inquietação; (6) Quem decide o quê na transição; (7) O que não muda. Vive dentro do Axon (botão "?") e em versão de bolso para oficinas.

**R-13 · 4R: o que a pessoa sente e o que a liderança faz** (Bridges aplicado)

| R | Tempo de Bridges | O que a pessoa sente | O que a liderança faz |
|---|---|---|---|
| **Reconhecer** | Finais | Perda, apego ao domínio do legado, medo de irrelevância | Nomeia o que termina, honra quem construiu, conversa antes de qualquer anúncio |
| **Requalificar** | Zona neutra | Confusão, queda de ritmo, mas também criatividade | Protege tempo de prática, aceita erro, mantém o paralelo com fim combinado |
| **Realocar** | Novos começos | Insegurança sobre o novo lugar | Constrói a rota com Pessoas/RH, com evidência e conversa individual |
| **Reinventar** | Novos começos | Energia, nova identidade profissional: do "eu rodo" ao "eu desenho, valido e analiso" | Reconhece em público, consolida papéis, celebra a primeira rodada solo |

**R-14 · Ficha de impacto (campos)**
> Gerência · perfil · atividade · sistema ou legado · hoje × amanhã · o que permanece · intensidade · pessoas e papéis · criticidade operacional · ação · responsável · evidência de tratamento. *No TMO, dois campos a mais, em laranja: legado relacionado · onda.* Selo: "a preencher com evidência no diagnóstico".

**R-15 · Riscos de pessoas** (hipótese → resposta proposta → evidência de tratamento)

| Hipótese de risco | Resposta proposta | Evidência de tratamento |
|---|---|---|
| Receio de perder posicionamento | Papel de Guardião nomeado antes de qualquer desligamento; crédito público de autoria | Pessoas de legado com papel ativo |
| Perda de conhecimento tácito | Memória do Legado; exceções viram casos de teste assinados | Rotinas críticas transferidas e aceitas |
| Sobrecarga na convivência | Capacidade planejada por onda; paralelo com fim combinado | Ondas validadas com as lideranças |
| Controles paralelos que não se desligam | Medir a sombra no legado; encerrar cópias com o dono do processo | Controles paralelos encerrados |
| Quem não quer mudar | Conversa individual com liderança e Pessoas/RH; tempo, mentoria em dupla e alternativas reais | Plano individual pactuado e documentado |

**R-16 · Portões**

*A · GMO (◆1 a ◆3)*
- **◆1 Antes da Onda 0:** linha de base de tempo medida; ambiente, acessos e permissões prontos; casos de teste definidos com os Guardiões; regras de uso da IA validadas com a TI.
- **◆2 Antes de cada onda:** autonomia validada por perfil; Rede Sinapse ativa na gerência; inquietações críticas respondidas; agentes do setor comunicados, quando aplicável.
- **◆3 Antes de desligar um legado:** rodadas espelho aceitas pelos Guardiões; sombra no legado em queda; controles paralelos encerrados; recomendação levada ao patrocínio (a decisão técnica é do ONS).

*B · TMO (G0 a G4)*
- **G0 Piloto:** linha de base de tempo e custo medida; ambiente, acessos e permissões prontos; cenários de prática definidos; responsáveis nomeados.
- **G1 Onda:** autonomia validada em cenários críticos por perfil; suporte e escalonamento definidos; funcionalidades da onda liberadas pelo produto; públicos comunicados, inclusive agentes do setor.
- **G2 Paralelo:** mesmos estudos rodados no Axon e no legado pelos ciclos acordados; divergências explicadas ou corrigidas; aceite dos Guardiões e do dono do processo.
- **G3 Desligamento (três chaves):** 1 a função está coberta pelo produto; 2 as pessoas estão capacitadas e com rota 4R pactuada; 3 a evidência foi aceita. Mais: interfaces migradas, plano de reversão testado, aceite do dono do processo, da TI e do patrocinador.
- **G4 Sustentação:** período de observação concluído sem divergência aberta; indicadores estáveis; lições registradas.

**R-17 · RAID vivo** (hipóteses iniciais; dono indicado)

| Item | Resposta | Dono · evidência |
|---|---|---|
| R · Roadmap fora do ritmo das ondas | Onda só dispara com funcionalidade liberada (G1); replanejamento quinzenal | PMO + produto · portões cumpridos |
| R · Demanda acima da capacidade do produto | Funil-escudo; dúvidas resolvidas com receitas; prioridade por onda | PMO · tempo de resposta do backlog acompanhado |
| R · Divergência de resultados no paralelo | Mais ciclos antes do G2; Guardiões explicam exceções | PMO + GMO · aceite registrado |
| R · Receio de perder posicionamento | Guardiões, Memória do Legado e crédito público | GMO · rotas 4R pactuadas |
| R · Custo de nuvem fora do previsto em rodadas massivas | Orçamento de treino, alertas e trilha de gestor de orçamento | GMO + times · previsto × realizado por time |
| R · Segurança e uso de IA | A IA propõe, a pessoa aprova; regras definidas com a TI | PMO + TI · aprovações registradas |
| A · Premissas | Patrocínio ativo; donos de processo disponíveis para os portões | Patrocínio |
| I · Problemas | Registrados a partir da execução | TMO |
| D · Dependências | Capacidade do time do produto; ambientes e segurança (TI); decisões de Pessoas/RH; comunicação com agentes do setor via Caixa de Entrada; integrações futuras (ex.: Organon) | TMO |

**R-18 · Pautas de governança**
- **Semanal · Execução:** uso, inquietações da semana, incidentes, ações. *(A: GMO e Rede Sinapse · B: TMO, Rede Sinapse e dono do produto)*
- **Quinzenal:** prontidão, impactos, rotas 4R, orçamento de nuvem e regras de uso da IA. *(A: gerências, produto, TI e Pessoas/RH · B: idem + backlog priorizado e RAID)*
- **Mensal · Patrocínio / Comitê:** ondas, riscos e transição *(A)*; portões, ondas, desligamentos e benefícios *(B)*.
- Regra comum: **a reunião acontece em cima do Axon Live**, não de slides montados à mão.

**R-19 · Axon Live (vitrine do Axon)**
> Página viva, alimentada pelos registros da própria plataforma: movimentos (rodadas, estudos e pipelines por gerência), chamados abertos e resolvidos, inquietações e respostas, "você disse, nós fizemos", tempo por processo, nuvem previsto × realizado, e a **rodada do mês** (um caso real contado por quem o fez). Mostra também o que ainda não funciona bem: transparência gera confiança. Agregados apenas; comparações entre gerências ficam no fórum de governança.

---

## 2. PROPOSTA A · GMO (Gestão de Mudanças)

**Uma frase:** a GMO é a mielina do Axon: faz o novo jeito de trabalhar chegar rápido, sem perda, a cada perfil das cinco gerências, e transforma quem domina o legado em autor do novo.

---

### A1 · O que vamos entregar

- **Título:** Axon | Proposta de Gestão de Mudanças
- **Subtítulo:** Do MVP ao hábito nas cinco gerências: o processo permanece, muda o como.
- **Mensagem-chave:** O ONS não muda o que faz; muda como faz, e quem domina o como de hoje desenha o de amanhã.

**Layout (1280 × 720)**
- Cabeçalho padrão (y 48–130) e marca no canto superior direito.
- Faixa navy de KPIs, y 150–218, três blocos de largura igual.
- Esquerda (x 50–820, y 240–630): três cards `#EDF2F7` empilhados (altura ~120 px cada, gap 10). Rótulo navy em negrito numa coluna de 170 px à esquerda; texto à direita. Na margem esquerda dos cards, o **fio do axônio** vertical (2 px azul aço) com três nós (Permanece, Muda, Nasce). No card "O que muda", a tira de jobs (três retângulos azul aço "Job 1 › Job 2 › Job 3", chevrons laranja) e o botão `▶ Rodar`.
- Direita (x 850–1230, y 240–630): painel navy "Resultado a perseguir". Linha de método na base do painel, clicável.
- Rodapé de premissas.

**Copy final**

```text
§ Cabeçalho
Axon | Proposta de Gestão de Mudanças
Do MVP ao hábito nas cinco gerências: o processo permanece, muda o como.
§ Faixa navy
5 gerências   PE • PR • PL • OS • PD
≥ 6 meses   horizonte mínimo
MVP em produção*   2 times pioneiros
§ Esquerda · cards
O que permanece | O macroprocesso: o estudo que a área roda três vezes por semana segue rodando.
O que muda | O como: arquivos de definição viram tela de parâmetros; rodadas viram pipelines; o custo fica visível.
Job 1 › Job 2 › Job 3   [▶ Rodar]
O que nasce | Papéis novos: Guardiões do Legado, arquitetos de estudos, curadores de modelos e gestores de orçamento.
§ Direita · painel navy
RESULTADO A PERSEGUIR
Cada perfil executa as novas rotinas com autonomia, e o tempo devolvido vira análise.
01 Adoção efetiva nas cinco gerências
02 Saber dos legados preservado
03 Capacidade liberada com destino
04 Voz das pessoas no produto
Método: ADKAR · Bridges · ondas com portões ›
§ Rodapé
*Informado pelo time do produto, a validar. Impactos e calendário confirmados no diagnóstico.
```

**Revelações por clique**
1. `[▶ Rodar]` → o impulso percorre Job 1 › Job 2 › Job 3 e abre o cartão **R-01**.
2. "MVP em produção*" → **R-01** (versão curta: 2 times pioneiros, ex.: Hidrologia; ambição de ~150 usuários em 6 a 12 meses; informado, a validar).
3. Palavra **"Axon"** no título (sublinhado pontilhado discreto) → **R-02 · Por que mielina?**
4. Card "O que muda" → vira e mostra as cinco mudanças concretas:
   > **Configurar:** arquivos de definição viram tela de parâmetros, salva por estudo e duplicável. **Executar:** pipeline de arrastar e soltar, orquestrado pelos contratos de entrada e saída. **Custo:** visível por rodada, no orçamento do time. **IA (MCP):** preenche parâmetros quando você pede; você aprova. **Agentes do setor:** retorno pela Caixa de Entrada, pelo mesmo canal de hoje.
5. Card "O que nasce" → mini-glossário de papéis:
   > **Guardião do Legado:** define casos de teste e valida a equivalência dos resultados. **Arquiteto de estudos:** desenha, compara e analisa estudos na tela de parâmetros. **Curador de modelos:** mantém containers, contratos e documentação fiel ao código. **Gestor de orçamento:** planeja e acompanha o custo de nuvem do time. Todos a validar no diagnóstico.
6. "Método ›" →
   > **ADKAR** acompanha cada pessoa: consciência, desejo, conhecimento, habilidade e reforço. **Bridges** cuida da transição: toda mudança começa por um fim, atravessa uma zona neutra e só então vira novo começo. **Ondas com portões:** cada grupo entra quando está pronto, nunca por data.

**Interação e animação lúdica**
- Ao entrar no slide, o impulso desce pelo fio do axônio e acende os três cards em sequência (Permanece em navy estável, Muda com pulso laranja, Nasce com contorno laranja), 150 ms entre nós.
- `▶ Rodar` é o "momento uau" do deck: o impulso atravessa os jobs como num pipeline real.

**Nota do apresentador**
Começamos pelo que não muda, porque é isso que reduz a ansiedade: o macroprocesso e a responsabilidade de cada gerência ficam onde estão. A aposta central é que quem domina os legados se torne autor do novo jeito de trabalhar, e não alvo dele. Os números do MVP são do time do produto e viram linha de base no diagnóstico.

---

### A2 · Mapa de impactos no nível da atividade

- **Título:** Mapa de impactos: muda o como, não o porquê
- **Subtítulo:** Cinco gerências × sete perfis, lidos no nível da atividade, a partir dos pioneiros e validados pelos responsáveis.
- **Mensagem-chave:** Não mapeamos sistemas nem pessoas: mapeamos o gesto que muda em cada atividade.

**Layout**
- Esquerda (x 50–770, y 160–620): **heatmap**. Cabeçalho de colunas como no slide 2 da referência (blocos azul aço PE, PR, PL, OS, PD). Primeira coluna (230 px): perfil em navy. Segunda coluna (130 px): etiqueta de hipótese em azul aço (texto branco). Células das gerências: 35 quadrados `#EDF2F7` com "?" cinza claro. Legenda abaixo.
- Direita (x 800–1230):
  - topo: **lupa em três níveis**, três linhas com chevrons laranja (Macroprocesso › Atividade › Tarefa), a primeira com fundo navy (fixa);
  - meio: card branco com borda navy "Uma atividade em dois tempos" com alternador segmentado `Hoje ⟷ Com Axon`;
  - base: **callout laranja** (borda esquerda laranja 4 px, fundo `#EDF2F7`) "Mudança oculta".
- Rodapé de método.

**Copy final**

```text
§ Cabeçalho
Mapa de impactos: muda o como, não o porquê
Cinco gerências × sete perfis, lidos no nível da atividade, a partir dos pioneiros e validados pelos responsáveis.
§ Esquerda · heatmap
MAPA DE IMPACTOS | GERÊNCIA × PERFIL
Perfil | Hipótese | PE | PR | PL | OS | PD
Operam rodadas e mantêm legados | Alta
Preparam estudos de vez em quando | Média
Só executam e conferem | Média
Consultam resultados | Baixa a média
Constroem modelos e containers | Alta, como ganho
Gerem orçamento de nuvem | Nova
Agentes do setor (externos) | Baixa, mesmo canal
▢ a mapear  ▣ hipótese  ■ validado · TI/Infra: transversal
§ Direita · lupa
LUPA EM TRÊS NÍVEIS
Macroprocesso › permanece
Atividade › muda o como
Tarefa › passa ao Axon
§ Direita · card (estado inicial: Hoje)
UMA ATIVIDADE EM DOIS TEMPOS   [Hoje ⟷ Com Axon]
Hoje: edita arquivos de definição › dispara a rodada › confere e envia o resultado.
§ (estado alternativo, mesmo espaço)
Com Axon: ajusta parâmetros na tela › o pipeline orquestra › o resultado vai ao catálogo ou ao Axon Drive.
§ Direita · callout
MUDANÇA OCULTA | Cada time passa a gerir o próprio orçamento de nuvem.
§ Rodapé
Método: escuta dos pioneiros, observação de rotinas e oficinas por gerência. Nenhuma célula é preenchida sem evidência.
```

**Revelações por clique**
1. **Célula** → ficha vazia da combinação gerência × perfil (**R-14**) com o selo "a preencher com evidência".
2. **Rótulo do perfil** → painel lateral com as três perguntas daquele perfil (**R-07**).
3. **Cabeçalho de gerência** → a coluna "abre" em três camadas (macroprocesso › atividades › tarefas), com o texto "a levantar no diagnóstico". Mostra que o macroprocesso não se move.
4. **Alternador Hoje ⟷ Com Axon** → os três passos se transformam um a um (arquivo vira seletor; disparo manual vira pipeline; pasta vira catálogo/Axon Drive). "A área roda o estudo três vezes por semana para a programação" fica fixo em navy no topo do card.
5. **Legenda** → uma única célula, rotulada "exemplo ilustrativo", percorre os três estados (a mapear → hipótese → validado).
6. **Mudança oculta** →
   > O Axon mostra o custo de cada rodada antes de executar e permite orçamento mensal ou anual por time (exemplo citado pelo time do produto: menos de US$ 0,01 por rodada em fan-out, a validar). Autonomia nova, responsabilidade nova: escolher máquina, dimensionar o fan-out e responder pelo orçamento. Ninguém pediu essa mudança; por isso ela entra no mapa, ganha trilha própria e aparece no Axon Live.
7. **Agentes do setor** → mini-diagrama em laço: "Axon processa › encontra erro › notifica a Caixa de Entrada › agentes do setor recebem pelo canal de sempre". Nota: "agentes do setor ≠ agentes de IA".
8. **TI/Infra** →
   > Aliada crítica, não perfil impactado: coautora das regras de segurança, identidade, ambientes e uso da IA, com cadeira fixa no fórum quinzenal.

**Interação e animação lúdica**
- O heatmap entra coluna a coluna (PE → PD), 80 ms entre colunas, sempre em cinza: o mapa "existe", mas espera evidência.
- O alternador é o momento lúdico: a audiência vê o gesto mudar enquanto o macroprocesso não se mexe.

**Nota do apresentador**
Não vamos redesenhar processos: descemos ao nível da atividade, que é onde o Axon muda o trabalho. Começamos pelos dois times pioneiros, que já vivem o novo jeito, e usamos a mesma ficha em todas as gerências; nenhuma célula é colorida sem evidência, e medimos o processo, não a pessoa. Atenção à mudança oculta: o orçamento de nuvem passa a ser de cada time, e isso pede preparo.

---

### A3 · Pessoas: do domínio do legado à autoria do novo

- **Título:** Do domínio do legado à autoria do novo
- **Subtítulo:** Toda capacidade liberada tem destino: reconhecer, requalificar, realocar e reinventar, com o menor impacto possível.
- **Mensagem-chave:** Quem conhece o legado valida o futuro: as pessoas que mais temem a mudança são as mais necessárias para uma migração segura.

**Layout**
- Topo (y 160–330): **quatro chevrons** no padrão do slide 3 da referência: cabeçalho navy com número laranja e verbo em branco; corpo `#EDF2F7` com uma frase; chevrons laranja entre os blocos.
- Meio (y 345–425): **faixa navy** de largura total "Guardiões do Legado", rótulo laranja à esquerda, frase de destaque branca e texto de apoio.
- Base (y 445–600): rótulo de seção + **cinco chips de risco** (pílulas navy com texto branco e ponto laranja) que viram cartões.
- Rodapé: diretriz de quadro, em cinza.

**Copy final**

```text
§ Cabeçalho
Do domínio do legado à autoria do novo
Toda capacidade liberada tem destino: reconhecer, requalificar, realocar e reinventar, com o menor impacto possível.
§ Topo · 4R
01 Reconhecer › Nomear o que termina e dar crédito a quem construiu e manteve os legados.
02 Requalificar › Trilhas por perfil, com prática em estudos reais do próprio time.
03 Realocar › Levar capacidade às frentes do ONS que precisam dela.
04 Reinventar › Novas atividades: desenho e análise de estudos, curadoria de modelos, orçamento de nuvem.
§ Meio · faixa navy
GUARDIÕES DO LEGADO | Quem conhece o legado valida o futuro.
Especialistas dos sistemas atuais definem os casos de teste, validam a equivalência dos resultados e conduzem a passagem de bastão.
§ Base · chips
RISCOS A INVESTIGAR
Receio de perder posicionamento · Perda de conhecimento tácito · Sobrecarga na convivência · Controles paralelos · Quem não quer mudar
§ Rodapé
Prioridade: requalificação e realocação. Cenários de quadro são decisão da liderança e de Pessoas/RH, sempre com evidência.
```

**Revelações por clique**
1. **Cada R** → duas camadas: "O que a pessoa sente" e "O que a liderança faz" (**R-13**).
2. **Faixa Guardiões** → abre em duas colunas:
   > **O que fazem:** listam exceções e regras implícitas; transformam-nas em casos de teste; aceitam ou devolvem as rodadas espelho; conduzem a passagem de bastão do sistema que conhecem. **Por que importa:** reduz ao mesmo tempo o risco técnico (paridade, exceções) e o humano (perda de posicionamento). **Reconhecimento:** papel formal pactuado com Pessoas/RH e crédito público em cada desligamento.
   Link interno "ver passagem de bastão" → **R-09**.
3. **Chips de risco** → viram com resposta e evidência (**R-15**).
4. **"Quem não quer mudar"** (verso estendido) →
   > Conversa individual com a liderança e Pessoas/RH; identificar a barreira (ADKAR); oferecer tempo de convivência, mentoria em dupla "veterano do legado + nativo do Axon" e alternativas internas reais. Decisão respeitosa e documentada.

**Interação e animação lúdica**
- Os quatro chevrons acendem da esquerda para a direita como um impulso que salta entre nódulos (condução saltatória discreta: o ponto laranja "pula" de chevron em chevron).
- Ao clicar na faixa Guardiões, uma linha laranja fina liga a faixa aos chips "Receio de perder posicionamento" e "Perda de conhecimento tácito": a mesma resposta trata dois riscos.

**Nota do apresentador**
A pergunta na cabeça das pessoas é "e eu?", e a respondemos com caminhos concretos antes de qualquer cenário de quadro, que é decisão da liderança e de Pessoas/RH, com evidência. Os Guardiões do Legado são o centro da estratégia: o saber de quem domina o sistema atual vira caso de teste, critério de desligamento e novo papel, do "eu rodo" ao "eu desenho, valido e analiso".

---

### A4 · Evangelização com prova: marca, vitrine e escuta

- **Título:** Mostrar, não convencer: marca, vitrine e escuta
- **Subtítulo:** Evangelizar com prova: o Axon exibe seus movimentos, ouve cada inquietação e responde mitos com fatos.
- **Mensagem-chave:** Ninguém se convence por apresentação; convence-se vendo o colega rodar o próprio estudo.

**Layout**
- Esquerda (x 50–740, y 160–620): **ecossistema**. Nó central navy "Axon" (círculo de 92 px) e cinco nós periféricos (cards `#EDF2F7` com rótulo navy em negrito e uma frase), ligados ao centro por linhas azul aço de 1,5 px (as sinapses). Abaixo do ecossistema, o **laço da escuta** em quatro passos com setas circulares laranja.
- Direita (x 770–1230, y 160–620): rótulo de seção + **quatro cartas Mito × Fato** em grade 2 × 2 (frente navy, frase branca entre aspas, ponto laranja).
- Rodapé.

**Copy final**

```text
§ Cabeçalho
Mostrar, não convencer: marca, vitrine e escuta
Evangelizar com prova: o Axon exibe seus movimentos, ouve cada inquietação e responde mitos com fatos.
§ Esquerda · ecossistema (nó central: Axon)
Marca interna | Menos tempo rodando, mais tempo pensando.
Axon Live | Vitrine com rodadas, chamados, indicadores e a rodada do mês.
Rede Sinapse | Embaixadores por gerência, a partir dos pioneiros; demo days por onda.
Guia de Bolso | Manual friendly por situação real, sem jargão.
Radar de Inquietações | O reporte de bug passa a ouvir dúvida, ideia e receio.
§ Esquerda · laço
Você fala › a GMO tria › o produto responde › o Axon Live mostra
§ Direita · cartas (frente)
MITO × FATO | VIRE A CARTA
"Vou perder meu posicionamento."
"Vão desligar meu sistema amanhã."
"A IA vai decidir por mim."
"Orçamento de nuvem não é comigo."
§ Rodapé
O Axon Live mostra a plataforma e a voz das pessoas; não ranqueia pessoas nem gerências.
```

**Revelações por clique**
1. **Marca interna** →
   > Assinatura: "Axon · menos tempo rodando, mais tempo pensando." Três atributos: Conecta · Mostra o custo · Aprende com quem usa. Glifo: o chevron laranja "›" vira o impulso da marca (sem logotipo novo nesta fase). Alternativas a testar com os pioneiros: "o estudo em movimento" · "do arquivo ao resultado".
2. **Axon Live** → mock ampliado com seis quadros "—" (Rodadas no Axon · Times ativos · Inquietações e respostas · Você disse, nós fizemos · Tempo por processo · Nuvem: previsto × realizado) e o selo "dados reais a partir da linha de base". Texto **R-19**.
3. **Rede Sinapse** →
   > Critérios, sem número fixo: ao menos uma referência por perfil relevante em cada gerência; mistura deliberada de pioneiros do MVP e de mantenedores de legado (convidá-los é a resposta mais forte ao "vou perder posicionamento"); duplas "veterano do legado + nativo do Axon"; demo days por onda, em que um time mostra a própria rodada; reconhecimento formal pactuado com Pessoas/RH.
4. **Guia de Bolso** → capa e sumário (**R-12**).
5. **Radar de Inquietações** → **R-10**.
6. **Cartas Mito × Fato** → viram (**R-06**, itens 1 a 4).
7. **Botão `[Simule uma inquietação]`** (no laço) → um cartão "Não acho o resultado do meu estudo" percorre o laço e cai em "dúvida › Guia de Bolso"; um segundo clique envia "Vou perder meu papel?" para "receio › ação de mudança". Selo "ilustrativo".

**Interação e animação lúdica**
- Clique em cada nó: o impulso corre pela sinapse do centro até o nó e abre a revelação.
- O laço gira uma volta completa ao clicar em "Você fala", com a legenda: "estende o canal de reporte de bugs que já existe no Axon".

**Nota do apresentador**
A técnica está pronta; falta fazer o Axon ser desejado, e o cliente nos pediu exatamente isso: catequizar, no sentido de mostrar. Vender, aqui, é tornar visível o que roda, o que foi pedido e o que mudou por causa de quem pediu. O Radar de Inquietações aproveita o canal de bugs que já existe e chega triado ao time do produto, que hoje tem pouca capacidade para absorver a demanda que a adoção vai gerar.

---

### A5 · Plano de trabalho: ondas, portões e capacitação por perfil

- **Título:** Plano de trabalho: pioneiros primeiro, ondas depois
- **Subtítulo:** Cada onda só avança com os portões de prontidão cumpridos; cada perfil aprende migrando um estudo real.
- **Mensagem-chave:** Onda não avança por data; avança por prontidão. E nenhum legado sai antes de o novo caminho estar pavimentado.

**Layout**
- Esquerda (x 50–800, y 160–630): **cronograma indicativo** no padrão do slide 4 da referência. Eixo horizontal M1 a M6 ("meses após o início"), grade vertical `#CCD4DA`. Barras: navy = diagnóstico; laranja = Onda 0 e ondas; azul aço = frentes contínuas (marca, capacitação); barra tracejada laranja = passagens de bastão (estende além de M6 com "+"). Três **losangos ◆** sobre o eixo, com os critérios em três linhas logo abaixo do gráfico.
- Direita (x 830–1230, y 160–630): painel navy "Capacitação por perfil": escada de quatro degraus ascendentes (o degrau "Ensinar" em laranja); chips das trilhas; destaque laranja "Rodada espelho"; chips de apoio.
- Rodapé.

**Copy final**

```text
§ Cabeçalho
Plano de trabalho: pioneiros primeiro, ondas depois
Cada onda só avança com os portões de prontidão cumpridos; cada perfil aprende migrando um estudo real.
§ Esquerda · cronograma (eixo M1 a M6, meses após o início)
CRONOGRAMA INDICATIVO
Diagnóstico e linha de base | M1–M2
Onda 0 · pioneiros do MVP e rodadas espelho | M2–M3
Ondas por gerência, conforme prontidão | M3–M6
Marca, Axon Live e escuta | M1–M6
Capacitação e Rede Sinapse | M2–M6
Passagens de bastão dos legados | M4–M6+
◆1 Antes da Onda 0 · linha de base, acessos e casos de teste
◆2 Antes de cada onda · autonomia por perfil comprovada
◆3 Antes de desligar · rodadas espelho aceitas pelos Guardiões
§ Direita · painel navy
CAPACITAÇÃO POR PERFIL
Ver › Fazer junto › Fazer sozinho › Ensinar
Trilhas: Construtor · Arquiteto de estudos · Executor · Consulta · Gestor de orçamento
Rodada espelho: aprender migrando um estudo real do próprio time.
Guia de Bolso · Copiloto de parâmetros (IA) · Orçamento de treino
§ Rodapé
Ordem das gerências e desligamentos dependem do diagnóstico e da validação técnica; a duração pode superar seis meses.
```

**Revelações por clique**
1. **Barra "Onda 0"** → animação da **rodada espelho** (selo "ilustrativo"): dois trilhos paralelos (Sistema atual / Axon) recebem o mesmo estudo; dois impulsos correm; ao chegar, aparecem "resultado equivalente? ✓ aceito pelo Guardião" e "tempo de ciclo registrado". Protocolo completo em **R-08**.
2. **Cada ◆** → checklist do portão (**R-16 · A**). Ao marcar todos os itens, o impulso **salta** para o segmento seguinte do cronograma (condução saltatória).
3. **Barra "Ondas por gerência"** →
   > A ordem das gerências sai do diagnóstico, combinando criticidade operacional, maturidade e dependência de legados, e é decidida no fórum mensal. Nenhuma gerência é citada como "primeira" antes disso.
4. **Barra "Passagens de bastão"** → **R-09**, com o selo do precedente Workfront.
5. **Cada degrau da escada** →
   > **Ver:** demonstração ao vivo e pílulas curtas no momento de uso. **Fazer junto:** dupla com um pioneiro ou um Guardião. **Fazer sozinho:** ambiente de prática, receitas e orçamento de treino. **Ensinar:** Rede Sinapse e clínicas no horário de trabalho. *Neuroplasticidade: o caminho fica rápido com repetição, não com apresentação.*
6. **Cada trilha** → módulos e prova de autonomia (**R-05**).
7. **Copiloto de parâmetros** → simulação (**R-11**).
8. **Orçamento de treino** →
   > Antes de responder pelo orçamento real, cada time pratica num projeto de treino com orçamento próprio, a configurar com o time do produto. O gestor de orçamento conclui a trilha antes de o time receber a nova responsabilidade. FinOps chega como autonomia, não como fiscalização.

**Interação e animação lúdica**
- Ao entrar, um impulso laranja percorre o cronograma e **para em cada ◆** (o salto só acontece quando o apresentador abre o portão e marca os critérios). É a condução saltatória que dá nome à barra de progresso.

**Nota do apresentador**
A Onda 0 já existe: são os dois times pioneiros, que nos dão diagnóstico, casos reais e os primeiros multiplicadores. Ninguém aprende em exemplo genérico: cada pessoa migra um estudo real do próprio time, o que gera, de uma vez, competência, medição do tempo por processo e um caso para o Axon Live. Seis meses é o mínimo; se as ondas pedirem mais, o plano se estende com a mesma lógica.

---

### A6 · Indicadores, governança e entregáveis

- **Título:** Indicadores, governança e entregáveis
- **Subtítulo:** Indicadores como fórmula e fonte, rituais curtos de decisão e pacotes validados por etapa.
- **Mensagem-chave:** Medimos autonomia e protagonismo, não logins; cada etapa termina com algo que a gerência usa.

**Layout**
- Esquerda (x 50–620, y 160–630):
  - grade 3 × 2 de **tiles de indicador** (padrão do slide 5 da referência: fundo `#EDF2F7`, barra azul aço de 4 px à esquerda, número laranja), só com o nome visível;
  - abaixo, três **blocos navy** de governança lado a lado (cadência em laranja, texto branco).
- Direita (x 650–1230, y 160–630): **tabela de pacotes** com cabeçalho navy (Etapa | Entregáveis), quatro linhas, etapa em negrito navy, ícone de check laranja antes de cada linha.
- Rodapé.

**Copy final**

```text
§ Cabeçalho
Indicadores, governança e entregáveis
Indicadores como fórmula e fonte, rituais curtos de decisão e pacotes validados por etapa.
§ Esquerda · tiles
INDICADORES | VIRE PARA VER FÓRMULA E FONTE
01 Prontidão
02 Adoção efetiva
03 Autonomia
04 Protagonismo
05 Tempo por processo
06 Sombra no legado
§ Esquerda · governança
Semanal | Execução · GMO e Rede Sinapse
Quinzenal | Adoção · gerências, produto, TI e Pessoas/RH
Mensal | Patrocínio · ondas, riscos e transição
§ Direita · tabela
PACOTES DE ENTREGA
Etapa | Entregáveis
M1–M2 Diagnóstico | Mapa de impactos por atividade, linha de base de tempo, prontidão, riscos e plano de mudança.
M2–M3 Preparação | Rotas 4R, marca e Axon Live, Guia de Bolso, trilhas por perfil e Rede Sinapse.
M3–M5 Ondas | Onda 0 e ondas com portões, rodadas espelho, Radar de Inquietações e painel de adoção.
M5–M6+ Sustentação | Autonomia validada, passagens de bastão, lições aprendidas e plano de continuidade.
§ Rodapé
Metas após a linha de base. ONS: patrocínio, pontos focais, dados, TI e Pessoas/RH. Desenvolvimento e infraestrutura: equipes técnicas.
```

**Revelações por clique**
1. **Tiles** → viram com fórmula e fonte (**R-04**: Prontidão, Adoção efetiva, Autonomia, Protagonismo, Tempo por processo, Sombra no legado).
2. **Linhas da tabela** → critério de aceite:
   > **M1–M2:** mapa de impactos validado pelos responsáveis de cada gerência; linha de base aceita pelos donos de processo. **M2–M3:** rotas 4R pactuadas com liderança e Pessoas/RH; Axon Live no ar com dados reais. **M3–M5:** portões registrados em ata; rodadas espelho aceitas pelos Guardiões. **M5–M6+:** autonomia comprovada por perfil; plano de continuidade assumido pelo ONS.
3. **Blocos de governança** → pauta e participantes (**R-18**, versão A).
4. **Ícone "Do ONS, precisamos de" (no rodapé)** →
   > Patrocinador; pontos focais por gerência; acesso aos pioneiros, às pessoas e aos registros do Axon; ambiente de prática; TI e Pessoas/RH nos fóruns. Equipe, dedicação e condições: composição comercial final.

**Interação e animação lúdica**
- Ao avançar o último passo do deck, os checks laranja da tabela se marcam em sequência, como um pipeline concluído; o impulso completa a barra de progresso, acende os seis nódulos e mostra, por 2 s, a assinatura "Axon · menos tempo rodando, mais tempo pensando".

**Nota do apresentador**
Logins dizem pouco; importa se a pessoa roda sozinha e se quem mantinha o legado ganhou um novo papel. O indicador de sombra mostra quando o legado ainda é usado "por garantia", e é ele que sinaliza o momento seguro de desligar. Metas serão pactuadas depois da linha de base; desenvolvimento, migração e infraestrutura seguem com as equipes técnicas.

---

## 3. PROPOSTA B · TMO (≈70% GMO · ≈30% PMO)

**Uma frase:** o TMO é o sistema nervoso da adoção: a mielina da GMO (≈70% do esforço) mais a coordenação central do PMO (≈30%), que sincroniza roadmap do produto × ondas de adoção × desligamento de legados, protege o time do produto e converte evidência em decisão.

**Como o 70/30 aparece no deck**
- **Faixa de KPI de B1:** barra de ênfase (laranja ≈70% GMO | azul aço ≈30% PMO).
- **Selo de ênfase** junto ao número de cada slide: B1 "GMO + PMO" · B2 "GMO" · B3 "GMO" · B4 "PMO + GMO" · B5 "PMO" · B6 "GMO + PMO".
- **Dois slides integralmente de pessoas** (B2, B3); nos mistos, a camada de pessoas ocupa a maior área (raia Pessoas é a mais alta em B4; a triagem do funil de B5 é GMO; a coluna GMO da tabela de B6 é mais larga).
- O 70/30 é **esforço**, não contagem de slides; rótulo sempre "ênfase indicativa, calibrada no diagnóstico".

**O que só existe no TMO (a camada PMO)**
| Elemento PMO | Onde |
|---|---|
| Plano Mestre Integrado (produto × ondas × legados num só calendário) | B1, B4 |
| Portões G0–G4 com aceite do dono do processo, TI e patrocinador; três chaves do desligamento; ficha de desligamento | B4 |
| Funil único de demanda e backlog (escudo do produto), com critérios de priorização | B5 |
| RAID vivo com donos | B5 |
| Realização de benefícios por fórmula | B5 |
| Torre de Controle (o painel único de decisão) | B5, B6 |
| Mapa de impactos com campos "legado relacionado" e "onda" (a costura GMO × PMO) | B2 |
| RACI, comitê que decide portões e critério de saída do próprio TMO | B6 |

---

### B1 · O que vamos entregar

- **Título:** Axon | Proposta de TMO: pessoas, produto e legados
- **Subtítulo:** Um escritório de transformação que sincroniza adoção, roadmap e desligamento de legados, com peso maior nas pessoas.
- **Mensagem-chave:** Nenhuma onda dispara e nenhum legado sai sem que produto, pessoas e evidência estejam prontos ao mesmo tempo.

**Layout**
- Cabeçalho e marca.
- Faixa navy de KPIs (y 150–218): três blocos; o terceiro contém a **barra de ênfase** (200 × 12 px; 70% laranja, 30% azul aço) com rótulos.
- Esquerda (x 50–800, y 240–630): **três trilhos horizontais** (fibras de 3 px): Produto (azul aço), Pessoas (laranja, o mais espesso: 5 px), Legados (`#CCD4DA` com contorno navy), cada um com rótulo e frase à esquerda; os três convergem à direita num **◆ navy grande** "Plano Mestre". Botão `[▶ Sincronizar]`. Abaixo, a "equação" do TMO num card `#EDF2F7`.
- Direita (x 830–1230, y 240–630): painel navy "Resultado a perseguir" + link "Por que sistema nervoso? ›".
- Rodapé.

**Copy final**

```text
§ Cabeçalho
Axon | Proposta de TMO: pessoas, produto e legados
Um escritório de transformação que sincroniza adoção, roadmap e desligamento de legados, com peso maior nas pessoas.
§ Faixa navy
5 gerências   PE • PR • PL • OS • PD
≥ 6 meses   horizonte mínimo
Ênfase do esforço   ≈70% GMO · ≈30% PMO
§ Esquerda · três trilhos
TRÊS RITMOS, UM PLANO MESTRE
Produto | o que o Axon já entrega, e quando
Pessoas | quem está pronto, e para quê
Legados | o que pode sair, e com que segurança
◆ Só avança quando os três apontam juntos   [▶ Sincronizar]
TMO = GMO (pessoas e adoção) + PMO (plano, demanda, riscos e benefícios)
§ Direita · painel navy
RESULTADO A PERSEGUIR
Axon adotado e legados desligados com segurança, com o menor impacto nas pessoas.
01 Pessoas com autonomia e destino claro
02 Roadmap no ritmo das ondas
03 Demanda triada antes do produto
04 Benefícios medidos por processo
Por que sistema nervoso? ›
§ Rodapé
MVP com 2 times pioneiros: informado pelo time do produto, a validar. Ênfase indicativa, calibrada no diagnóstico.
```

**Revelações por clique**
1. `[▶ Sincronizar]` → três impulsos partem em velocidades diferentes; o ◆ "Plano Mestre" só acende quando o terceiro chega. Legenda: "Um sinal sozinho não dispara."
2. **Cada trilho** → o que dá errado sem sincronia:
   > **Produto sem pessoas:** funcionalidade pronta e pouco usada. **Pessoas sem produto:** treinamento antes da hora, esquecido antes do uso. **Legado sem prova:** desligamento com risco à operação, trauma e controles paralelos.
3. **Barra 70/30** →
   > **GMO ≈70%:** mapa de impactos, transição das pessoas (4R e Guardiões), evangelização, capacitação e adoção em ondas. **PMO ≈30%:** Plano Mestre, portões, funil de demanda e backlog, RAID, benefícios e governança. Ênfase indicativa do esforço, calibrada no diagnóstico; não é composição de preço nem de equipe.
4. **"Por que sistema nervoso? ›"** → **R-03**.
5. **Rodapé** → **R-01** completo.

**Interação e animação lúdica**
- Ao entrar, os três trilhos se desenham da esquerda para a direita (400 ms), e o ◆ permanece apagado até o clique em `Sincronizar`: o momento lúdico do deck B.

**Nota do apresentador**
O TMO não é um PMO maior: é a gestão de mudanças com um sistema nervoso de coordenação. Quando o MVP chegar às gerências, três ritmos diferentes precisam bater juntos (o que o produto entrega, quem está pronto e o que pode sair) e a demanda vai crescer mais rápido que o time do produto. A maior parte do esforço continua nas pessoas; a decisão de produto continua com o dono do produto.

---

### B2 · Pessoas no centro: impacto por atividade e destino *(GMO)*

- **Título:** Pessoas no centro: impacto por atividade e destino
- **Subtítulo:** O mapa de impactos nasce ligado ao legado e à onda; toda capacidade liberada tem destino pelos 4R.
- **Mensagem-chave:** No TMO, o mapa de impactos não só cuida das pessoas: define a ordem das ondas e o calendário de desligamento.

**Layout**
- Esquerda (x 50–700, y 160–630): faixa fina da **lupa** (três níveis em chevrons) sobre um **heatmap compacto** 7 perfis × 5 gerências (células "a mapear"); abaixo, a linha da ficha com os dois campos extras em laranja e o alternador `[Ver como define as ondas]`.
- Direita (x 730–1230, y 160–630): **4R em coluna** (quatro linhas com número laranja e verbo navy); **faixa navy** Guardiões do Legado; **callout laranja** da mudança oculta.
- Rodapé. Selo "GMO".

**Copy final**

```text
§ Cabeçalho
Pessoas no centro: impacto por atividade e destino
O mapa de impactos nasce ligado ao legado e à onda; toda capacidade liberada tem destino pelos 4R.
§ Esquerda · lupa + heatmap
MAPA DE IMPACTOS | GERÊNCIA × PERFIL × ATIVIDADE
Macroprocesso permanece › atividade muda › tarefa vai ao Axon
Operam rodadas e mantêm legados · Preparam estudos · Só executam · Consultam resultados · Constroem modelos · Gerem orçamento de nuvem · Agentes do setor
PE | PR | PL | OS | PD   (a mapear)
Ficha: atividade · hoje × amanhã · intensidade · ação · + legado relacionado · + onda
[Ver como define as ondas]
§ Direita · 4R
DESTINO DA CAPACIDADE | 4R
01 Reconhecer · crédito a quem construiu os legados
02 Requalificar · trilhas por perfil com estudos reais
03 Realocar · capacidade para frentes que precisam dela
04 Reinventar · novas atividades de análise e curadoria
§ Direita · faixa navy
GUARDIÕES DO LEGADO | quem conhece o legado valida o futuro
§ Direita · callout
MUDANÇA OCULTA | o orçamento de nuvem passa a ser de cada time
§ Rodapé
Intensidades: hipóteses a validar. Quadro: decisão da liderança e de Pessoas/RH, com evidência.
```

**Revelações por clique**
1. **Célula** → ficha (**R-14**) com os campos **legado relacionado** e **onda** destacados em laranja: "é aqui que a GMO e o PMO se costuram".
2. **Rótulo do perfil** → três perguntas (**R-07**) + hipótese de intensidade (a mesma de A2).
3. **`[Ver como define as ondas]`** → as linhas de maior intensidade esperada por perfil se acendem em azul aço (hipótese) e surge a frase: "Uma gerência só entra na onda quando o impacto está mapeado, as pessoas têm destino e o produto entrega o que elas precisam." Nenhuma gerência é colorida.
4. **Cada R** → **R-13**.
5. **Guardiões** → mesma revelação de A3, com uma linha a mais: "No TMO, o aceite dos Guardiões é critério formal do portão G2 (slide 4)."
6. **Mudança oculta** → mesma revelação de A2 + "No TMO, o consumo do orçamento entra na Torre de Controle (slide 5)."
7. **Agentes do setor** → laço da Caixa de Entrada (como em A2).

**Interação e animação lúdica**
- Igual a A2/A3 (células, perfis, 4R). Exclusivo do TMO: ao clicar em "+ onda", uma linha laranja tracejada sai da ficha em direção à borda direita do slide, sugerindo a continuação no Plano Mestre (B4).

**Nota do apresentador**
Mesmo no TMO, o centro é a pessoa, e é aqui que está a maior parte do esforço. O mapa ganha dois campos, legado relacionado e onda, porque é isso que permite ao PMO sincronizar a mudança com o roadmap e com os desligamentos. Toda decisão sobre quadro é da liderança e de Pessoas/RH, com evidência; nossa prioridade é requalificar e realocar.

---

### B3 · Evangelizar e capacitar: o Axon que se mostra *(GMO)*

- **Título:** Evangelizar e capacitar: o Axon que se mostra
- **Subtítulo:** Marca, Axon Live, Rede Sinapse e trilhas por perfil: o painel que engaja as pessoas é o mesmo que informa o comitê.
- **Mensagem-chave:** A convicção vem de ver o Axon funcionando com dados reais e de enxergar o próprio papel no futuro.

**Layout**
- Topo (y 150–190): assinatura da marca em navy 22 px, com o glifo "›" laranja.
- Esquerda (x 50–600, y 205–520): **Axon Live**, mock de painel com cabeçalho navy e seis quadros `#EDF2F7` (nome do indicador + "—").
- Direita (x 630–1230, y 205–520): rótulo + **seletor de perfil** (cinco pílulas) + **escada** de quatro degraus ascendentes (o degrau "Ensinar" em laranja) + linha de chips de apoio.
- Base (y 535–630): três **cartas Mito × Fato** em linha (frente navy).
- Rodapé. Selo "GMO".

**Copy final**

```text
§ Cabeçalho
Evangelizar e capacitar: o Axon que se mostra
Marca, Axon Live, Rede Sinapse e trilhas por perfil: o painel que engaja as pessoas é o mesmo que informa o comitê.
§ Topo · assinatura
Axon › menos tempo rodando, mais tempo pensando.
§ Esquerda · Axon Live
AXON LIVE | A VITRINE DO AXON
Rodadas no Axon · Times ativos · Inquietações e respostas · Você disse, nós fizemos · Tempo por processo · Nuvem: previsto × realizado
§ Direita · escada
APRENDER FAZENDO | ESCOLHA UM PERFIL
Construtor · Arquiteto de estudos · Executor · Consulta · Gestor de orçamento
Ver › Fazer junto › Fazer sozinho › Ensinar
Guia de Bolso · Copiloto de parâmetros (IA via MCP) · Orçamento de treino · Demo days
§ Base · cartas (frente)
"Vou perder meu posicionamento."   "Vão desligar tudo de uma vez."   "A IA vai decidir por mim."
§ Rodapé
Progresso coletivo, sem ranking de pessoas ou gerências. Uso de IA dentro das regras de segurança definidas com a TI.
```

**Revelações por clique**
1. **Quadros do Axon Live** → viram com fórmula e fonte (**R-04**: Adoção efetiva, Times ativos, Inquietações e respostas, Você disse nós fizemos, Tempo por processo, Desvio de custo por rodada). Selo "dados reais a partir da linha de base". Texto geral **R-19** + "No TMO, o Axon Live e o painel de benefícios da Torre de Controle usam a mesma fonte: a comunicação nunca promete mais do que os dados mostram."
2. **Seletor de perfil** → os quatro degraus mostram a trilha do perfil escolhido (**R-05**). É o momento "isso foi feito para mim".
3. **Copiloto** → **R-11**.
4. **Guia de Bolso** → **R-12**.
5. **Orçamento de treino** → mesma revelação de A5.
6. **Demo days** →
   > Por onda, um time mostra a própria rodada, ao vivo, para as outras gerências. A melhor história vira a "rodada do mês" no Axon Live, contada por quem a fez.
7. **Cartas** → **R-06** (itens 1, 2 e 3; a carta 2 traz o precedente Workfront).

**Interação e animação lúdica**
- Os quadros do Axon Live acendem um a um com o impulso (150 ms entre quadros), sem números.
- Ao trocar de perfil, os degraus fazem uma transição vertical curta (300 ms), como um impulso subindo a escada.

**Nota do apresentador**
Catequizar, aqui, é mostrar e não pregar: o Axon Live usa dados da própria plataforma e casos dos pioneiros, inclusive o que ainda não funciona bem. Cada perfil enxerga a própria trilha, do ver ao ensinar, e aprende migrando um estudo real. No TMO, o mesmo painel que engaja as pessoas informa o comitê.

---

### B4 · Plano Mestre Integrado: desligar legados só com prova *(PMO + GMO)*

- **Título:** Plano Mestre Integrado: desligar legados só com prova
- **Subtítulo:** Roadmap do produto, ondas de adoção e legados num só calendário, com portões de decisão de G0 a G4.
- **Mensagem-chave:** Nenhum legado é desligado por data: é desligado por evidência, aceita por quem responde pela operação.

**Layout**
- Topo (x 50–1230, y 160–410): **swimlanes** sobre o eixo M1 … M6+ ("meses após o início"). Três raias: Produto (azul aço, 60 px), **Pessoas** (laranja, 90 px, a mais alta: peso GMO), Legados (`#CCD4DA`, 60 px). Rótulo da raia em navy à esquerda (110 px). Pequenos círculos laranja nos **pontos de sinapse** entre raias. Losangos ◆ G0–G4 atravessam verticalmente as três raias.
- Base (y 430–620): **cinco chevrons** (G0 a G4), cabeçalho navy com código laranja e nome branco, corpo `#EDF2F7` com o critério resumido. Botão discreto `[Ficha de desligamento]` à direita da linha.
- Rodapé. Selo "PMO + GMO".

**Copy final**

```text
§ Cabeçalho
Plano Mestre Integrado: desligar legados só com prova
Roadmap do produto, ondas de adoção e legados num só calendário, com portões de decisão de G0 a G4.
§ Topo · raias (M1 … M6+)
PRODUTO | liberações do roadmap alinhadas às ondas · integrações futuras (ex.: Organon)
PESSOAS | diagnóstico › Onda 0 · pioneiros › ondas por gerência › sustentação
LEGADOS | inventário › convivência › rodadas espelho › desligamento › observação
§ Base · portões
G0 Piloto · linha de base, ambiente e acessos
G1 Onda · autonomia por perfil e suporte definido
G2 Paralelo · mesmo estudo no Axon e no legado, equivalência aceita pelos Guardiões
G3 Desligamento · três chaves: função coberta, pessoas prontas, evidência aceita
G4 Sustentação · observação estável e lições registradas
[Ficha de desligamento]
§ Rodapé
Decidem o dono do processo, a TI e o patrocinador; o TMO recomenda com evidência. Precedente: o Workfront absorveu sistemas satélites aos poucos.
```

**Revelações por clique**
1. **Cada portão G0–G4** → checklist completo com caixas de seleção (**R-16 · B**). Ao marcar todos, o portão **dispara** (pulso laranja) e o impulso **salta** para o segmento seguinte das raias.
2. **G3** → componente **Três chaves**: três chaves navy giram a cada clique (1 função coberta pelo produto · 2 pessoas capacitadas e com rota 4R · 3 evidência aceita); o bloco "Legado A" (rótulo genérico) só esmaece quando as três giram, e aparece: "O saber foi herdado pelo Axon. Crédito: quem manteve o sistema." Ligação para **R-09**.
3. **Pontos de sinapse** →
   > Dependência entre raias, em linguagem genérica até o diagnóstico. Ex.: "A onda N depende da liberação X do produto e do G1"; "O desligamento do Legado A depende do G2 e da rota 4R de quem o mantém".
4. **`[Ficha de desligamento]`** → molde por legado: funções atendidas · interfaces e dependências · donos · Guardiões · critérios G2/G3 · plano de reversão · decisão e data (a definir).
5. **"Workfront"** →
   > Precedente interno: a adoção do Workfront absorveu aos poucos as responsabilidades de sistemas satélites, com business case de desligamento ao longo do ano. Aqui, os critérios ficam explícitos desde o primeiro dia.
6. **"integrações futuras (ex.: Organon)"** →
   > Trazer o Organon e sistemas em Python que hoje têm interface e configuração próprias. Entram em ondas futuras, conforme o roadmap do produto, com o mesmo rito de portões.

**Interação e animação lúdica**
- Ao entrar, um impulso laranja percorre a raia Pessoas e **para no G0**: o deck "espera" o apresentador abrir o portão. É a condução saltatória em seu uso mais literal.

**Nota do apresentador**
Este é o slide que tranquiliza a operação: o desligamento é decidido por evidência, com corrida em paralelo e aceite de quem responde pelo processo, pela TI e pelo patrocínio. O ONS já fez isso com o Workfront; aqui tornamos os critérios explícitos desde o primeiro dia. O roadmap entra no mesmo calendário para que nenhuma onda dependa de uma funcionalidade que ainda não chegou.

---

### B5 · Torre de Controle: demanda, riscos e benefícios *(PMO)*

- **Título:** Torre de Controle: demanda, riscos e benefícios
- **Subtítulo:** Funil único que protege o produto; RAID vivo e benefícios por fórmula para cada decisão de onda.
- **Mensagem-chave:** O TMO filtra antes de a demanda chegar ao produto e mede depois que as pessoas usam.

**Layout**
- Esquerda (x 50–600, y 160–630): **funil-escudo** vertical em quatro camadas (navy escurecendo para baixo; números laranja à esquerda), com o botão `[Solte uma inquietação]` no topo e o "Time do produto" como base do funil.
- Direita topo (x 630–1230, y 160–390): rótulo + seis **cartões RAID** em grade 3 × 2 (fundo `#EDF2F7`, letra R/A/I/D em laranja).
- Direita base (x 630–1230, y 405–630): rótulo + cinco **tiles de benefício** (borda azul aço à esquerda), viráveis.
- Rodapé. Selo "PMO".

**Copy final**

```text
§ Cabeçalho
Torre de Controle: demanda, riscos e benefícios
Funil único que protege o produto; RAID vivo e benefícios por fórmula para cada decisão de onda.
§ Esquerda · funil
ESCUDO DO PRODUTO | FUNIL ÚNICO DE DEMANDA
1 Escutar · bug, dúvida, ideia e receio pelo mesmo botão
2 Triar · dúvida › Guia de Bolso; receio › ação de mudança; bug e ideia › backlog
3 Priorizar · valor × criticidade operacional × esforço × onda
4 Decidir · o dono do produto decide; o TMO prepara a decisão
[Solte uma inquietação]
§ Direita · RAID
RAID VIVO
Roadmap fora do ritmo das ondas · Demanda acima da capacidade · Divergência no paralelo · Receio de perder posicionamento · Custo de nuvem fora do previsto · Segurança e uso de IA
§ Direita · benefícios
BENEFÍCIOS | FÓRMULA E FONTE
Tempo por processo · Qualidade das rodadas · Desvio de custo por rodada · Consumo do orçamento · Funções de legado absorvidas
§ Rodapé
Metas após a linha de base. Indício informado pelo time do produto, a validar: 176 mil casos em ~2 h, contra ~3 dias estimados.
```

**Revelações por clique**
1. **`[Solte uma inquietação]`** (simulação "ilustrativa") → um cartão "Não sei onde ficou a saída do estudo" desce e sai na camada 2 como "dúvida › Guia de Bolso"; segundo clique: "Vou perder meu papel?" desvia para "receio › ação de mudança (GMO)"; terceiro clique: "Quero rodar com mais casos sem estourar o orçamento" vira "ideia › backlog" e desce até o produto. Mostra, sem números, o que a triagem poupa.
2. **Camada 1 "Escutar"** → **R-10** + "O agente que hoje tria bugs pode agrupar inquietações por tema, com revisão humana (proposta ao backlog do produto, a validar com o dono do produto e a TI)."
3. **Camada 3 "Priorizar"** →
   > Critérios aplicados no fórum quinzenal: valor para a onda em curso; criticidade operacional; esforço estimado pelo produto; dependência de legado. O resultado é um backlog único, com a capacidade do time do produto visível: quando a demanda supera a capacidade, o TMO leva ao patrocínio os dados para a decisão de reforço.
4. **Cartões RAID** → resposta, dono e evidência (**R-17**). Botão "Ver RAID completo" abre também premissas, problemas e dependências.
5. **Tiles de benefício** → fórmula e fonte (**R-04**: Tempo por processo, Qualidade das rodadas, Desvio de custo por rodada, Consumo do orçamento, Funções de legado absorvidas). No tile "Desvio de custo": "exemplo citado pelo time do produto: menos de US$ 0,01 por rodada em fan-out, a validar".
6. **Título "Torre de Controle"** →
   > Não é uma sala: é um painel único (alimentado pelos registros do Axon, pelo backlog e pelo RAID) e três ritos curtos. O mesmo painel abastece o Axon Live e o comitê mensal.

**Interação e animação lúdica**
- Funil animado com pontos coloridos por tipo de voz (bug navy, dúvida azul aço, ideia laranja, receio cinza): dúvidas saem cedo, receios desviam para a GMO, só itens qualificados chegam ao produto.

**Nota do apresentador**
Quando o MVP chegar a mais times, a demanda vai crescer mais rápido que o time do produto; o funil garante que só chegue ao produto o que é do produto, e que dúvidas e receios tenham outro destino. Os benefícios entram como fórmula e fonte, e as metas nascem da linha de base, não antes. O dono do produto continua decidindo o roadmap; o TMO prepara a decisão.

---

### B6 · Plano de trabalho, entregáveis e governança *(GMO + PMO)*

- **Título:** Plano de trabalho, entregáveis e governança
- **Subtítulo:** Pacotes por etapa, ritos curtos de decisão e um TMO que também tem critério de saída.
- **Mensagem-chave:** Um calendário, um funil, um painel; e o próprio TMO sai com prova, quando o ONS o opera sozinho.

**Layout**
- Esquerda (x 50–820, y 160–630): **tabela de pacotes** com três colunas: Etapa (150 px) | **GMO · pessoas e adoção** (≈ 430 px, cabeçalho com faixa laranja de 4 px no topo) | **PMO · coordenação** (≈ 190 px, cabeçalho com faixa azul aço). A diferença de largura comunica o 70/30.
- Direita (x 850–1230, y 160–480): painel navy "Governança" com três ritos (cadência em laranja).
- Direita (x 850–1230, y 495–630): card `#EDF2F7` com borda laranja "Gate do TMO" (vira) + link `[Quem faz o quê]`.
- Rodapé. Selo "GMO + PMO".

**Copy final**

```text
§ Cabeçalho
Plano de trabalho, entregáveis e governança
Pacotes por etapa, ritos curtos de decisão e um TMO que também tem critério de saída.
§ Esquerda · tabela
Etapa | GMO · pessoas e adoção | PMO · coordenação
M1–M2 Diagnóstico | Mapa de impactos, linha de base, prontidão e riscos de pessoas | Plano Mestre v1, inventário de legados, RAID
M2–M3 Preparação | Rotas 4R, marca, Axon Live, Guia de Bolso e trilhas | Portões G0–G4 e funil de demanda ativos
M3–M5 Ondas | Capacitação, Rede Sinapse, rodadas espelho | Relatórios de portão, backlog priorizado, fichas de desligamento
M5–M6+ Sustentação | Autonomia validada, passagens de bastão, lições | Painel de benefícios, recomendações de desligamento
§ Direita · governança
GOVERNANÇA
Semanal | Execução · TMO, Rede Sinapse e produto
Quinzenal | Produto e adoção · gerências, TI e Pessoas/RH
Mensal | Comitê · patrocínio decide portões, ondas e desligamentos
§ Direita · card
GATE DO TMO | Saímos quando o ONS opera ritos, painel e funil.
[Quem faz o quê]
§ Rodapé
O ONS decide; nós conduzimos, medimos e recomendamos. Fora do escopo: desenvolvimento, migração e infraestrutura.
```

**Revelações por clique**
1. **Linha da tabela** → as células GMO e PMO se ligam por uma linha laranja que mostra a dependência:
   > **M1–M2:** o mapa de impactos alimenta o inventário de legados e o Plano Mestre v1. **M2–M3:** as rotas 4R são pré-requisito dos portões. **M3–M5:** as rodadas espelho geram a evidência dos relatórios de portão. **M5–M6+:** a autonomia validada sustenta as recomendações de desligamento.
2. **Ritos** → pauta e participantes (**R-18**, versão B).
3. **`[Quem faz o quê]`** → RACI simplificado:
   > **ONS:** patrocinador (prioridades e portões); donos de processo (aceite); dono do produto (roadmap); TI (ambientes, segurança, desligamento técnico); Pessoas/RH (transição e decisões de quadro); Rede Sinapse. **Consultoria:** condução do TMO, Plano Mestre, RAID, frentes de GMO, funil de demanda, benefícios, materiais e medição. Equipe e dedicação: composição comercial final.
4. **Gate do TMO** → vira:
   > Critério de saída: ritos, Torre de Controle e funil operados pelo ONS; Rede Sinapse autônoma; plano das próximas ondas aprovado. Se desligamos legados com prova, desligamos o TMO com prova também.

**Interação e animação lúdica**
- Passar o mouse (ou focar) numa linha acende os meses correspondentes numa mini linha do tempo acima da tabela.
- Fechamento: o impulso percorre a barra de progresso, acende os seis nódulos, e os três trilhos de B1 aparecem em miniatura no canto, alinhados; a assinatura "Axon › menos tempo rodando, mais tempo pensando" surge por 2 s.

**Nota do apresentador**
O TMO é leve por desenho: um calendário, um funil, um painel e ritos curtos, sem burocracia sobre um time de produto enxuto. O ONS decide em todos os portões; nós conduzimos, medimos e recomendamos. E o próprio TMO tem critério de saída: o sucesso é o ONS operar o escritório sem nós.

---

## 4. Elementos de navegação do HTML

### 4.1 Estrutura da página
- **Página única** com moldura externa (fundo `#F4F6F9`; no modo escuro do sistema, `#0B1620`) e o **canvas 1280 × 720** centralizado, escalado por `transform: scale()` para caber na janela, preservando 16:9. Em telas estreitas (celular), o canvas encolhe para a largura útil com 16 px de margem; **nunca** há rolagem horizontal da página.
- **Barra superior** (fora do canvas, 48 px): seletor A/B ao centro; à direita, ícones de Notas (N), Modo leitura (L), Apresentador (P), Tela cheia (F), Imprimir e Ajuda (?).
- **Barra inferior** (fora do canvas, 56 px): barra de progresso em forma de axônio.
- Endereço com âncora: `#A-1` … `#A-6`, `#B-1` … `#B-6`, e `?step=n` para o passo de build.

### 4.2 Seletor A/B
- Controle segmentado em pílula: **`A · GMO`** | **`B · TMO`**. Sob o rótulo B, uma microbarra 70/30 (laranja/azul aço) de 40 × 3 px.
- Trocar de proposta **mantém o número do slide** (A3 ↔ B3), com crossfade de 300 ms, para comparar escopo e não estética.
- *Opcional (recomendado):* tecla **C** abre o **modo comparar**: os dois slides do mesmo número lado a lado, em escala reduzida, com a diferença essencial em uma linha abaixo (ex.: "B4 só existe no TMO: Plano Mestre e portões G0–G4").

### 4.3 Barra de progresso: axônio com nódulos (condução saltatória)
- Uma fibra horizontal com **seis nódulos** (círculos de 10 px, um por slide). Entre os nódulos, **bainhas de mielina** (cápsulas arredondadas azul aço a 35%, 6 px de altura).
- Nódulo atual: laranja com brilho suave. Visitados: navy. Futuros: `#CCD4DA`.
- Ao avançar de slide, o **impulso** (ponto laranja de 8 px) **salta** do nódulo atual para o seguinte num arco curto (450 ms, `ease-out`), sem percorrer a bainha: é a condução saltatória.
- Passos de build dentro do slide aparecem como **pequenos traços** sob o nódulo atual; cada clique preenche um traço.
- Clicar num nódulo navega até o slide. Rótulo (tooltip) com o título curto do slide.
- Microcopy ao passar o mouse sobre a barra: "Condução saltatória: cada onda é um nódulo, cada portão um salto."
- Fim do deck: o impulso percorre toda a fibra e acende os seis nódulos.

### 4.4 Atalhos de teclado
| Tecla | Ação |
|---|---|
| → · Espaço · PageDown | Próximo passo de build; no último passo, próximo slide |
| ← · PageUp | Passo anterior; no primeiro, slide anterior |
| 1 a 6 | Ir ao slide |
| Home / End | Primeiro / último slide |
| A / B | Trocar de proposta, mantendo o slide |
| C | Modo comparar (opcional) |
| N | Mostrar/ocultar notas do apresentador (painel inferior) |
| P | Modo apresentador |
| L | Modo leitura (todas as revelações abertas) |
| F | Tela cheia |
| Esc | Fecha a revelação aberta; sai de modos |
| ? | Painel de ajuda com atalhos |

Todas as revelações também abrem por **Enter** quando o elemento está em foco (Tab percorre os clicáveis em ordem de leitura).

### 4.5 Modo apresentador (P)
- Abre uma **segunda janela** sincronizada por `BroadcastChannel` (fallback: painel na mesma janela). Mostra: slide atual (grande), próximo slide (miniatura), **nota do apresentador**, passo de build atual / total, relógio e cronômetro, e a **mensagem-chave** do slide em destaque laranja.
- Avançar em qualquer janela avança as duas. Revelações abertas pelo apresentador abrem também na tela projetada.

### 4.6 Modo leitura (L) e impressão em PDF
- **Modo leitura:** todas as revelações aparecem como cartões estáticos ao redor ou abaixo do slide; animações desligadas; simulações viram três quadros estáticos numerados.
- **Impressão** (`@media print`, `@page { size: 13.333in 7.5in; margin: 0 }`): cada slide em uma página 16:9, seguida de uma **página de anexo** com as revelações daquele slide (modo leitura) e, se o usuário marcar a opção no diálogo do botão Imprimir, a nota do apresentador. Barra superior e barra de progresso ocultas. Cores preservadas (`print-color-adjust: exact`). O deck precisa ser legível também em preto e branco.
- Opções do botão Imprimir: "Proposta A", "Proposta B" ou "Ambas (A e depois B)".

### 4.7 Acessibilidade e movimento
- `prefers-reduced-motion`: impulsos, flips e saltos viram trocas de estado instantâneas (opacidade em 150 ms).
- Contraste: laranja `#F78C16` só sobre navy ou em números grandes; texto corrido sempre navy, cinza ou branco.
- Elementos clicáveis com `role="button"`, `aria-expanded` e rótulo legível; cartas com o verso acessível ao leitor de tela.
- Preferências por visitante (último slide, proposta, modo) podem ficar em `localStorage`, sempre com `try/catch`; a página funciona sem isso.

---

## 5. Checklist de cobertura dos temas obrigatórios

Legenda: **V** = visível no slide · **R** = em revelação por clique · **N** = nas notas do apresentador.

| Tema obrigatório | Proposta A · GMO | Proposta B · TMO |
|---|---|---|
| Plano de adoção: ondas, pilotos, pioneiros do MVP primeiro | **A5** V (Onda 0 com pioneiros, ondas por prontidão, portões ◆1–◆3) · A1 V (MVP com 2 pioneiros) | **B4** V (raia Pessoas, G0–G4) · B1 V · B6 V |
| Mapa de impactos por gerência × perfil, no nível da atividade (macroprocesso fica, muda o como) | **A2** V (heatmap, lupa, dois tempos) · A1 V | **B2** V (com "legado relacionado" e "onda") |
| Riscos | **A3** V+R (cinco riscos de pessoas, R-15) · A6 R | **B5** V+R (RAID vivo, R-17) · B1 R (desalinhamento dos três ritmos) |
| Catequização / evangelização: brand interna, vitrine, chamados e indicadores, desmistificar "perder posicionamento" | **A4** V (marca, Axon Live, Rede Sinapse, Mito × Fato) · A3 V (Guardiões) | **B3** V (assinatura, Axon Live, Mito × Fato, demo days) · B2 V (Guardiões) |
| Reestruturação do trabalho e transição das pessoas (4R; headcount com liderança e Pessoas/RH, com evidência) | **A3** V (4R, Guardiões, regra de quadro) · A1 V | **B2** V (4R, Guardiões, regra de quadro) |
| Treinamento no novo sistema por perfil | **A5** V (escada, trilhas, rodada espelho) + R-05 | **B3** V (seletor de perfil, escada) + R-05 |
| Manual friendly voltado a engajamento | **A4** V (Guia de Bolso) · A5 V · R-12 | **B3** V (Guia de Bolso) · B5 V (destino das dúvidas) · R-12 |
| Backlog de inquietações alimentando o produto | **A4** V (Radar de Inquietações, laço da escuta) · R-10 | **B5** V (funil único de demanda, escudo do produto) · R-10 |
| Medição do ganho de tempo por processo | **A6** V (indicador 05) · A5 V (linha de base, rodada espelho) · R-04, R-08 | **B5** V (benefício "Tempo por processo") · B3 V (Axon Live) · R-04 |
| Descomissionamento gradual dos legados (precedente Workfront) | **A5** V (passagens de bastão, ◆3) · A4 R (Mito × Fato) · R-09 | **B4** V (raia Legados, G2–G3, três chaves, Workfront no rodapé) · R-09 |
| Orçamento de nuvem por time (FinOps) | **A2** V (mudança oculta, perfil "Gerem orçamento") · A5 V (trilha e orçamento de treino) · A4 V (mito) | **B2** V (mudança oculta) · B5 V (consumo do orçamento, RAID) · B3 V (Nuvem previsto × realizado) |
| IA / MCP que configura parâmetros | **A1** R (o que muda) · A4 V (mito) · A5 V (copiloto) · R-11 | **B3** V (copiloto, regra com a TI) · B5 V (RAID: segurança e uso de IA) · R-11 |
| Caixa de Entrada falando com agentes externos pelo mesmo canal | **A2** V (perfil "Agentes do setor · mesmo canal") + R (laço) · A1 R | **B2** V (perfil "Agentes do setor") + R · B4 R (G1: agentes do setor comunicados) |
| O quê · método · plano · entregáveis | A1 · A2–A4 · A5 · A6 | B1 · B2–B5 · B4 e B6 · B6 |
| Integridade: só os quatro dados informados, com rótulo | A1 V+R · A2 R · R-01 | B1 V+R · B5 V · R-01 |
| Sem nomes de pessoas; siglas sem significado | Todo o deck | Todo o deck |

**Checklist final para o desenvolvedor**
- [ ] Nenhum número além dos quatro dados informados; nenhuma razão calculada.
- [ ] "M1–M6" = meses após o início; nenhuma data de calendário.
- [ ] Heatmaps com células por gerência em "a mapear"; painéis com "—".
- [ ] ≈70/30 sempre rotulado como ênfase indicativa do esforço.
- [ ] Simulações com selo "ilustrativo".
- [ ] Cada slide com ≤ ~150 palavras visíveis (contar a copy dos blocos `text`, sem as linhas `§`).
- [ ] Títulos ≤ 60 caracteres; subtítulos ≤ 120 caracteres.
- [ ] Deck legível fechado (sem cliques), impresso e em `prefers-reduced-motion`.
