# Roteiro e premissas — Proposta 2 — TMO com GMO integrado para o programa AXOL no ONS (plano de 6 meses)

_Documento interno de apoio (não enviar ao cliente). Arquivo: `ONS_AXOL_Proposta2_TMO_com_GMO.pptx` · 6 slides · out/2026._

## Ideia-mestra

No AXOL, cada onda de migração exige dois cutovers na mesma janela operativa: o do fluxo de execução e o das pessoas. Por isso TMO e GMO têm um só líder, a ordem das ondas segue a FCF (NEWAVE, DECOMP, DESSEM), e cada onda só faz o cutover com o gate triplo verde (equivalência dos resultados, prontidão de quem prepara, roda e valida, e custo de execução em cloud no envelope), lido pela torre de controle nos registros do próprio AXOL. O legado mais difícil de migrar é o fluxograma que vive nas pessoas, e o ritmo do programa é o do critério mais lento: a data é meta, o gate é regra.

## Roteiro de fala e premissas por slide

### Slide 1 — Proposta Técnica

Abrir pelo enquadramento: esta proposta trata o AXOL como transformação de trabalho, não como instalação de plataforma. Em 6 slides: contexto, modelo integrado de TMO e GMO, método e governança, roadmap de 6 meses em uma página e torre de controle. Sem escopo comercial neste material. Se perguntarem a sigla: TMO é Transformation Management Office, sem relação com o Programa Mensal da Operação.

**Premissas a validar:**

- Data da capa fixada em out/2026 conforme briefing.
- Cliente 'ONS' e plataforma 'AXOL' conforme briefing; nenhuma pessoa, área ou contrato citados.

### Slide 2 — O AXOL muda quem prepara, roda e valida a cadeia, não só o sistema

Mensagem: o AXOL é um programa de mudança de trabalho antes de ser um programa de plataforma. A tese está na frase-gancho: sem TMO a entrega atrasa; sem GMO o legado não desliga. A faixa da cadeia mostra por que a migração tem ordem: cada elo consome a FCF do anterior. O papel da A&M é governar e conduzir a mudança; a execução técnica da migração segue com o time da plataforma e as áreas do ONS (a validar). Perguntas ao cliente: quais legados e rotinas locais serão substituídos e quem os atualiza; qual o catálogo efetivo de modelos do AXOL; quem é o patrocinador executivo; se o AXOL é produto interno, de terceiro ou parte de outra iniciativa; restrições de cloud e de dados.

**Premissas a validar:**

- O AXOL substitui sistemas legados atualizados por outras pessoas (premissa do briefing); nenhum legado é nomeado.
- Horizonte e cadência dos modelos (médio prazo, curto prazo, programação diária; ciclos mensais, semanais, diários): a validar no diagnóstico (nota 1).
- Rotinas locais (planilhas, scripts) e conhecimento tácito: hipótese de investigação, redigida com 'podem viver'.
- Registros de execução do AXOL consultáveis por fluxo, modelo e semana: premissa a validar com o time da plataforma.
- Nenhum número de pessoas, sistemas, datas contratuais ou nomes do ONS é afirmado.

### Slide 3 — Dois cutovers por onda, uma liderança única de TMO e GMO

Slide da ideia-mestra: toda onda do AXOL tem dois cutovers (viradas) na mesma janela operativa, o do fluxo de execução e o das pessoas, e eles precisam ser decididos juntos. Um líder único de TMO e GMO leva ao Comitê Executivo um Go/No-Go por onda com três critérios (equivalência, prontidão, custo de execução em cloud). Os times continuam distintos (Consultores TMO e Consultores GMO); o que se unifica é a decisão. Painel da direita: o cenário de dois líderes é uma alternativa de comparação, não a descrição da organização atual do ONS; no modelo recomendado o líder único tem duas interfaces, o time AXOL (plataforma) e as áreas usuárias, e a composição da liderança no ONS é premissa a validar. 'O ritmo é o do critério mais lento' significa que a data é meta e o gate é regra: se as pessoas não estão prontas, a onda espera, e vice-versa. Cuidado de linguagem: no ONS a sigla de gestão de projetos colide com o Programa Mensal da Operação; por isso usamos TMO e deixamos a nota de glossário. Não há preço nem dimensionamento de equipe neste material, por desenho.

**Premissas a validar:**

- Os 4 perfis (prepara, roda, valida, atualiza legados) são hipótese de trabalho; quem são e quantos são será levantado no diagnóstico.
- 'Time AXOL' e 'Áreas usuárias' aparecem como interfaces do líder único porque a relação contratual do AXOL (produto interno, fornecedor ou parte de outra iniciativa) está em aberto.
- Liderança única é recomendação A&M; sem composição de equipe nem preços.
- O cenário de dois líderes é ilustrativo (alternativa de comparação), não a organização atual do ONS.

### Slide 4 — A habilidade só se prova em rodada real, sob governança em três níveis

Rigor de método: o ADKAR não é uma sequência de treinamentos, é o ciclo de cada onda. No ADKAR o primeiro elemento fraco limita o progresso; em adoção de tecnologia a lacuna típica fica entre Conhecimento e Habilidade, por isso a habilidade só é dada como atingida quando a equipe conduz uma rodada real em paralelo, dentro da tolerância. A missão de prática do Laboratório AXOL é reproduzir um ciclo passado no sandbox e reconciliar com o resultado histórico. Gamificação (placar de ondas por equipe), autoatendimento (laboratório) e IA generativa entram onde ajudam a prática, não como fim; a IA generativa só responde sobre manuais e fluxogramas aprovados e depende da política de dados do ONS. Telemetria: a adoção é lida por equipe, acima de um tamanho mínimo de grupo, nunca por indivíduo; a premissa de que o AXOL registra uso por equipe é a validar. Destino do tempo liberado é decisão do ONS (com o RH); apresentamos como pergunta, não como compromisso. 'Operação-sombra' é sinônimo de paralelo: conferir o glossário do ONS. Governança: três níveis de decisão e uma torre de controle única; o status semanal é gerado a partir dela.

**Premissas a validar:**

- Quem prepara, roda e valida rodadas são perfis presumidos; os papéis reais serão mapeados no diagnóstico.
- Assistente de IA generativa só sobre manuais e fluxogramas aprovados e sujeito à política de dados e segurança do ONS (nota 1).
- Telemetria de uso por equipe no AXOL e tamanho mínimo de grupo: a validar com o time da plataforma, o RH e a segurança (nota 2).
- Cadência dos fóruns segue o padrão A&M (template 29) e será ajustada ao calendário operativo do ONS.
- Destino do tempo liberado e eventual realocação são decisão do ONS; nenhuma afirmação sobre quantidade de pessoas.

### Slide 5 — Roadmap de 6 meses: piloto e três ondas na ordem da cadeia de modelos

Ler da esquerda para a direita: 4 semanas de preparação, 16 semanas de execução por ondas e 6 semanas de go-live e estabilização, com 4 quality gates do programa. A tese: a ordem das ondas é a da cadeia (NEWAVE, DECOMP, DESSEM) porque a dependência pela FCF é real e porque o ciclo mensal junta evidência mais devagar (usa replay histórico), enquanto o diário junta em semanas. Cada onda só faz o cutover com o gate triplo verde: equivalência, prontidão e custo de execução em cloud. As ondas se sobrepõem no desenho e no replay, mas o gate é por cutover; por isso pressionam os mesmos especialistas, risco tratado no slide 6 com agenda protegida e escalonamento pela carga medida. O paralelo da onda 1 cobre no máximo um ciclo mensal real: a evidência vem do replay histórico, com o mínimo de ciclos fixado no QG2. Pontos de atenção: o cronograma é rebaselinado no QG1 depois do diagnóstico; a composição da onda 3 (inclusive estudos elétricos) depende do catálogo do AXOL; o desligamento total dos legados pode extrapolar os 6 meses, e o programa entrega critério de saída e os primeiros desligamentos. Datas são metas: o ritmo é o do critério mais lento. A A&M governa e conduz a mudança; a execução técnica da migração é do time da plataforma e das áreas do ONS.

**Premissas a validar:**

- S1 = início do programa (data a definir); nenhuma data de calendário ou contratual é afirmada.
- Ordem das ondas (NEWAVE, DECOMP, DESSEM) segue a dependência pela FCF informada no briefing; composição e escopo por onda definidos no QG1 depois do diagnóstico.
- Cadências mensal, semanal e diária e a existência de casos históricos oficializados para replay: premissas a validar.
- Executáveis e versões dos modelos congelados durante o paralelo; passagens externas (se parte da cadeia depender de outras instituições) acordadas: a validar.
- Onda 3 inclui 'demais modelos' somente se constarem do catálogo do AXOL.
- Onda 0 (piloto) em fluxograma de menor criticidade escolhido no QG1.
- Pulsos ADKAR em S3, S14, S17, S19 e S26 (pulso curto antes de cada Go/No-Go) são proposta A&M; frequência ajustável e apoiada na telemetria agregada por equipe.
- Ondas sobrepostas assumem agenda protegida dos mesmos especialistas; é risco, tratado no slide 6.

### Slide 6 — Torre de controle: o programa é medido pelo que o AXOL registra

Fechamento: a torre de controle lê o próprio AXOL (registros de execução) e os pulsos ADKAR, então adoção e custo de execução são medidos, não declarados. Os oito indicadores se agrupam nos três critérios do gate de onda (equivalência, prontidão, custo de execução) mais valor e adoção; a última coluna da tabela liga cada risco ao indicador que o detecta antes de virar atraso no cutover. Os riscos são de domínio: janelas operativas, equivalência dos resultados (inclusive versões e passagens externas, se houver), conhecimento tácito, capacidade dos especialistas, adoção parcial e custo de execução em cloud. Metas e limiares são propostos no QG1 e no QG2 com os validadores; não trazemos baseline do ONS porque ainda não foi levantado. Próximo passo sugerido: diagnóstico de 4 semanas (S1 a S4) para validar as premissas dos rodapés e rebaselinar o cronograma. Perguntas a validar com o ONS: quem é dono do custo de execução (orçamento central ou por área) e se haverá showback antes de qualquer cobrança; quem aprova as tolerâncias por variável; limites de privacidade da telemetria.

**Premissas a validar:**

- O AXOL registra execuções por fluxo, modelo, equipe e semana de forma consultável: premissa a validar com o time da plataforma.
- Metas, limiares e tolerâncias não são afirmados; são definidos no QG1 e no QG2 com o ONS.
- Showback antes de qualquer cobrança é boa prática de gestão de custo em cloud adotada como método, sem dado de custo do ONS.
- Riscos são hipóteses de domínio derivadas do briefing, a refinar no diagnóstico.
- Risco de fronteira institucional redigido como condicional (só se parte da cadeia depender de outras instituições); nenhuma instituição é nomeada.

## Perguntas para o cliente (premissas em aberto)

1. Quem é o sponsor executivo do programa AXOL e quem contrata a A&M (ONS, área usuária, TI ou o fornecedor da plataforma)? O AXOL é produto interno, de terceiro ou parte de outra iniciativa do ONS? (afeta o desenho do slide 3 e o papel de 'Time AXOL' e 'Áreas usuárias')
2. Quais sistemas legados o AXOL substitui, quem os atualiza e que rotinas locais (planilhas, scripts, ajustes manuais) existem entre os passos da cadeia? Existe inventário?
3. Qual a cadência real dos ciclos operativos (mensal, semanal, diária) e as janelas críticas e feriados dos 6 meses? Quantos ciclos reais de cada modelo cabem entre S9 e S26? (sustenta a ordem das ondas e a duração do hypercare)
4. O escopo do AXOL é só NEWAVE, DECOMP, DESSEM e FCF ou inclui geração de cenários, estudos elétricos e outros modelos? Alguma parte da cadeia é executada, validada ou recebida de fora do ONS (outras instituições)? (define a onda 3 e o risco de fronteira)
5. Há casos históricos oficializados (entradas, parâmetros, versões de executáveis e resultados) disponíveis para replay no AXOL? Quem aprova as tolerâncias por variável?
6. Quais executáveis e versões dos modelos estão em uso e há troca de versão prevista durante os 6 meses?
7. O AXOL expõe registros de execução e de custo de execução em cloud por fluxograma, modelo, equipe e semana? Existe sandbox/ambiente de ensaio e versionamento de modelos? (sustenta a torre de controle e o Laboratório AXOL)
8. Qual o modelo de custeio da cloud (quem paga a rodada: orçamento central ou por área)? Há apetite por showback antes de qualquer cobrança?
9. Qual a política do ONS para IA generativa e para telemetria de uso por equipe (tamanho mínimo de grupo, ciência da área de pessoas)? Gamificação por equipe tem apetite cultural?
10. Destino do tempo liberado: existe princípio do ONS (com o RH) para novos papéis e realocação? Quem decide? (a proposta trata como pergunta, não como compromisso)
11. Há estrutura de programa ou TMO no ONS hoje, e quem seria a contraparte da liderança única de TMO e GMO? Existe iniciativa em curso (por exemplo, redesenho organizacional ou desenvolvimento de ferramentas) com a qual o programa deve se alinhar? (ler antes de apresentar; nenhum fato público foi usado nos slides)
12. S1 começa quando? O desligamento total dos legados é meta dos 6 meses ou o programa entrega critério de saída e os primeiros desligamentos?
13. Glossário: 'paralelo' e 'operação-sombra', 'agentes de mudança' e 'campeões dos modelos' são termos aceitos no ONS? Confirmar para não colidir com usos setoriais.
14. Para o usuário (não perguntar ao cliente): os achados de pesquisa marcados como não verificados (projeto público ONS e A&M, cadências, fronteira ONS/CCEE, precedente de operação-sombra) ficaram fora dos slides; conferir as fontes primárias antes de usá-los em conversa.

## Alternativas consideradas na concepção

**Convencionais**

- Adaptação 1 para 1 do TOTVS: jornada de Gestão da Transformação em 3 etapas com lista de entregáveis (descartada: não carrega o AXOL nem a cadeia de modelos).
- GMO-first: ADKAR por perfil como espinha dorsal e TMO como suporte de cronograma (descartada: perde a integração de liderança única).
- Roadmap por módulo/sistema (um modelo por onda) sem conceito de gate de onda (descartada: ignora a dependência pela FCF e o corte duplo).
- Matriz de riscos de implantação de ERP trocando só os nomes por AXOL (descartada: riscos genéricos).
- Treinamento em sala e pesquisa de pulso trimestral como medida de adoção (descartada: mede presença, não capacidade de rodar sozinho).

**Disruptivas**

- Gate triplo por onda (equivalência, prontidão, custo de execução em cloud) como unidade única de decisão e dois cutovers por onda (ADOTADA: ideia-mestra).
- Torre de controle alimentada pelos registros de execução do próprio AXOL, adoção lida por equipe e nunca por indivíduo (ADOTADA).
- Replay histórico e execução em paralelo como prova de equivalência, com ordem das ondas definida pela cadência (ADOTADA).
- O legado mais difícil é o fluxograma que vive nas pessoas: mapa de impacto por papel x elo da cadeia e co-criação dos fluxogramas-alvo (ADOTADA).
- Laboratório AXOL de autoatendimento, placar de ondas por equipe e assistente de IA só sobre material aprovado, onde ajudam a prática (ADOTADA, sem forçar).
- Programa modelado como fluxograma de execução do próprio AXOL, 'FCF da mudança' e gêmeo digital da migração (DESCARTADA: metáfora pesada e capacidade não verificada).
- Pacto de Transição e neutralidade de headcount como compromisso (DESCARTADA: decisão do ONS e do RH; fica como pergunta ao patrocinador).
- TMO operado por agentes de IA (DESCARTADA: donos humanos para uma infraestrutura crítica).
