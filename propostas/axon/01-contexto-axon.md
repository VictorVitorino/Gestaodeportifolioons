# Axon · Contexto consolidado para as propostas de GMO e TMO

> Memória de trabalho das propostas comerciais (proposta de **trabalho**, não de valor) para a adoção da plataforma Axon no ONS.
> Fonte primária: [`00-briefing-original.md`](00-briefing-original.md) (pedido + transcrição verbatim).
> Referência de estrutura e identidade visual: [`referencias/Axol_Proposta_Gestao_de_Mudancas_6_Slides.pptx`](referencias/) (renders em `referencias/render/`).
> Última atualização: 07/10/2026.

---

## 1. O pedido, em uma frase

Duas propostas de trabalho, com no mínimo 6 meses de atuação, para levar o Axon do MVP à adoção em cinco gerências (**PE · PR · PL · OS · PD**), com o menor impacto possível sobre as pessoas:

| | **Proposta A · GMO** | **Proposta B · TMO** |
|---|---|---|
| O que é | Gestão de Mudanças pura | Transformation Management Office = **PMO + GMO**, com **peso maior em GMO** |
| Foco | Adoção, mapa de impactos, riscos, catequização, transição do trabalho e das pessoas, capacitação, manual friendly | Tudo da A **+** coordenação integrada: roadmap do produto × ondas de adoção × desligamento de legados, gestão de demandas/backlog, governança, benefícios |
| Formato | HTML lúdico e apresentável, **até 6 slides** | HTML lúdico e apresentável, **até 6 slides** |
| Conteúdo | O que entregamos · método · plano de trabalho · entregáveis | idem |

O usuário enviará depois **propostas de referência de GMO e de TMO**, que devem ser incorporadas numa próxima iteração.

---

## 2. O produto: Axon

**Nome.** *Axon* = axônio, a parte do neurônio que transmite impulsos e conecta células. A metáfora: o Axon conecta e coordena os jobs dos modelos eletroenergéticos em fluxos integrados. (O PPTX de referência usa "Axol"; a conversa usa "Axon". **Padronizado como Axon**. Confirmar com o usuário.)

**Proposta de valor.** Plataforma *low code* (clicar e arrastar, "tipo Miro") para montar e executar **pipelines de jobs** em sequência. Cada job é uma rodada de modelo eletroenergético, mas a plataforma é agnóstica: serve a qualquer processamento (RH, folha, trading...).

### Mapa de capacidades (o que existe ou está em construção)

| Módulo | O que faz | Implicação para a mudança |
|---|---|---|
| **Containers / biblioteca** | Repositórios, builds, monitoramento, logs, segurança. Cada container tem configuração e **documentação padronizada**: jobs disponíveis e **contrato de entrada e saída**. | A documentação **gera automaticamente as "caixinhas"** arrastáveis. Exige disciplina: documentação = realidade do código. Novo papel: **construtor/curador de modelos**. |
| **Projetos** | Ambientes, *computes* disponíveis, *storage* na nuvem, **catálogo de jobs** conectado aos containers. | Organização por projeto/time, com permissões integradas à identidade corporativa. |
| **Pipelines low code** | Arrastar jobs e conectar. O sistema **orquestra a partir dos contratos de E/S**, sem a pessoa definir a sequência lógica. | Muda o "como" da atividade. O macroprocesso permanece. |
| **Estudos + UI dinâmica de parâmetros** | Cada estudo tem um conjunto de parâmetros que **vira interface automaticamente** (faixa, número, select, multi-select, data, texto, tabela). Salva por estudo, permite duplicar, alterar e criar do zero. Substitui os **vários arquivos de definição**. | Fim da edição manual de arquivos de configuração. Parâmetro novo não depende de pedido à TI. Ganho grande de autonomia, e quebra de um hábito antigo. |
| **Execução e custo (FinOps)** | Escolha de máquina, *fan-out* massivo (ex.: 10 mil a 170 mil casos), **custo por rodada visível** (exemplo citado: menos de US$ 0,01 por rodada) e **orçamento por time** configurável (mensal/anual). | **Mudança cultural oculta**: a área passa a gerir o próprio orçamento de nuvem ("sou adulto, gasto meu orçamento para gerar mais resultado"). Pede letramento de custo e papel de **gestor de orçamento**. |
| **Saídas** | Download, envio ao **catálogo de dados corporativo** ou **Axon Drive** (em finalização): um drive local montado conforme o perfil e as permissões do usuário. | Saídas alimentam outros modelos e sistemas (ex.: Organon). Muda onde as pessoas "pegam" resultados. |
| **IA / MCP** | Conexão MCP gerenciada: uma IA pode configurar parâmetros pelo usuário. | Reduz a curva de aprendizado. Pede alfabetização em IA e confiança no "copiloto". |
| **Reporte de bug autoalimentado** | Captura sessão, print, versão, link e área. Um agente (Claude Code) faz triagem: bug simples é autocorrigido; o resto vira plano, implementação e PR para aprovação, até a produção. | Canal nativo de "voz do usuário" que o GMO pode ampliar para **inquietações** (não só bugs). |
| **Caixa de Entrada** | Ferramenta irmã: recebe dados personalizados. O Axon processa e, se houver erro, notifica a Caixa de Entrada, que notifica os **agentes do setor** pelo mesmo canal que já usam. | Ex.: validação de previsões enviadas pelos agentes. Hoje há ligações e e-mails manuais; amanhã, um loop automático. **Público externo impactado** (agentes), mas o canal se mantém. |
| **Integrações futuras** | Trazer o **Organon** e sistemas em Python que hoje têm interface e configuração próprias. | Novos legados entram no escopo de substituição em ondas. |

### Estágio atual e evidências (informadas pelo dono do produto, a validar no diagnóstico)

- **MVP em produção** com **2 times pioneiros** (ex.: Hidrologia), com poucos usuários ativos.
- **Teste reportado:** **176 mil casos em ~2 h**, contra **~3 dias** estimados no processo atual.
- Ambição: **~150 usuários** num horizonte de **6 a 12 meses**, com possibilidade de uso nacional.
- O dono do produto está **praticamente sozinho** no desenvolvimento. Deseja ~2 desenvolvedores e um time de GMO/projeto para não se afogar na demanda que surgirá quando o MVP rodar para os times.
- Há orçamento/licença já em uso. **Valores não entram na proposta.**

---

## 3. A mudança: o que realmente muda

1. **Substituição gradual de legados.** Diversos sistemas legados, atualizados e operados por pessoas, serão substituídos. O descomissionamento será **sistêmico e gradual**, nunca "do dia para a noite". *Precedente interno citado:* a adoção do Adobe Workfront absorveu aos poucos as responsabilidades de sistemas satélites, com business case de desligamento ao longo do ano.
2. **Trabalho operacional reduzido.** Parte das atividades de rodar, atualizar e conferir tende a diminuir ou acabar. Diretriz: **quanto menos impacto em pessoas, melhor**. Prioridade para requalificação, realocação e novas atividades de maior valor ("menos tempo de operação, mais tempo de análise"). Cenários de headcount são decisão da liderança e de Pessoas/RH, sempre com base em evidência.
3. **Mudança no nível da atividade, não do macroprocesso.** Ex.: "a área X roda um estudo 3x por semana para gerar resultado para a programação". Isso continua. Muda *como* se faz.
4. **Nova responsabilidade financeira** (orçamento cloud por time).
5. **Novo jeito de configurar estudos** (arquivos de definição → UI dinâmica, duplicável e salva).
6. **Interação com agentes externos** via Caixa de Entrada, pelo mesmo canal de hoje.
7. **Risco identitário: "perder posicionamento".** Quem domina o legado ou os arquivos de definição pode sentir perda de relevância. É preciso **catequizar**: desmistificar, dar novo protagonismo e mostrar caminhos.

### Públicos e categorias de impacto (cada um é um "modelo de impacto")

| Categoria (da conversa) | Leitura | Intensidade esperada |
|---|---|---|
| Pessoas que **só** trabalham com isso | Operadores de rodadas e mantenedores de legados | Alta (trabalho muda ou desaparece) |
| Pessoas que mexem **de vez em quando** | Analistas que preparam ou rodam estudos pontuais | Média (novo jeito de fazer) |
| Pessoas que **usam para consulta** | Consumidores de resultados | Baixa a média (onde e como acessar) |
| **Construtores** | Desenvolvedores e modeladores: containers, contratos de E/S, documentação | Alta, como ganho (novo papel) |
| **Executores básicos** | "Só quero executar e ver se rodou" | Média (simplicidade é chave) |
| **Gestores de orçamento** | Líderes de time com budget de nuvem | Nova responsabilidade |
| **Agentes externos** | Recebem as validações via Caixa de Entrada | Baixa (mesmo canal) |
| **TI / Infra** | Área forte e com poder de veto | Aliada crítica |

---

## 4. Desafios declarados

- **Ganhar apoio corporativo**: patrocínio, narrativa e uma TI forte.
- **Vender internamente**: construir uma **brand do Axon** e uma vitrine visual (movimentos, chamados, indicadores da plataforma), porque "técnica está sensacional; falta vender".
- **Medir ganho de tempo por processo**: o dado existe e pode ser medido.
- **Capacidade do time de produto**: a demanda vai explodir no MVP. É preciso alguém **coletando inquietações e organizando backlog**.
- **Mapear categorias de usuários por gerência**: um trabalho grande, que pede método.
- Abordagem desejada: **"tradicional, porém com olhar de transformação"**.

## 5. Ideias levantadas na conversa (a incorporar)

- **Manual friendly**, voltado a pessoas e engajamento, além do manual técnico de containers.
- **Treinamento** por perfil no novo sistema.
- **Diagnóstico com os usuários atuais** (pioneiros), que também serve à melhoria do produto.
- **Brand e vitrine do Axon**: portfólio/site, casos, indicadores.
- **Backlog de inquietações** alimentando o produto.
- **Plano para quem muda de atividade**, inclusive para quem não quer mudar.

---

## 6. Identidade visual da referência (PPTX)

- **Paleta (tema):** navy `#002B49` (dominante) · laranja `#F78C16` (acento) · azul aço `#5E8AB3` · painel claro `#EDF2F7` · cinza texto `#646464` · branco. Tema: `dk1 002A46`, `dk2 5E8AB3`, `lt2 CCD4DA`, `accent4 F78B15`, `accent5 33546D`, `accent6 99AAB6`.
- **Tipografia:** Arial Nova Cond (títulos e corpo). Títulos grandes em navy, subtítulo em azul aço.
- **Padrões:** faixa navy de destaque (KPIs: "5 gerências", "≥ 6 meses"), cards cinza-azulados, numeração laranja "01–06", chevrons laranja entre etapas, tabelas com cabeçalho navy, nota de rodapé com premissas, marca "Alvarez & Marsal" no canto superior direito, número da página.
- **Estrutura dos 6 slides de referência:** (1) contexto e resultado a perseguir · (2) diagnóstico e mapa de impactos + seis frentes · (3) transição de pessoas e legados + riscos · (4) jornada de 6 meses por ondas + capacitação · (5) indicadores + governança · (6) escopo, entregáveis e modelo de contratação.
- **Princípio de integridade (das notas da referência):** plano, riscos, perfis, métricas e datas são **propostos e dependem do diagnóstico**. Nada de metas, economia, headcount ou honorários inventados.

---

## 7. Pendências e próximos insumos

- [ ] Receber as **propostas de referência de GMO e de TMO** do usuário e incorporá-las.
- [ ] Confirmar o **nome** (Axon × Axol) e o significado das siglas **PE, PR, PL, OS, PD**.
- [ ] Levantar: número de pessoas por gerência e categoria, inventário de legados, patrocinador, calendário técnico do produto.
- [ ] Validar as evidências do MVP (176 mil casos em ~2 h × ~3 dias).
- [ ] Definir a modalidade comercial e a equipe (fora do escopo deste material).

## 8. Log de decisões

| Data | Decisão |
|---|---|
| 07/10/2026 | Nome padronizado como **Axon** nas propostas (referência dizia "Axol"). |
| 07/10/2026 | Duas propostas em um único HTML navegável (A · GMO e B · TMO), até 6 slides cada, na identidade da referência, com camada lúdica baseada na metáfora neural. |
| 07/10/2026 | Proposta de trabalho, sem valores. Evidências do MVP sempre rotuladas como "informadas, a validar". |
| 07/10/2026 | Ideias-âncora aprovadas no roteiro: Guardiões do Legado, rodada espelho, 4R (Reconhecer, Requalificar, Realocar, Reinventar), Radar de Inquietações, FinOps como mudança oculta, Axon Live, Rede Sinapse, Guia de Bolso. Metáfora: GMO = mielina; TMO = sistema nervoso; ondas = condução saltatória. |
| 07/10/2026 | TMO = ≈70% GMO / ≈30% PMO, sempre rotulado como ênfase indicativa do esforço. Camada PMO: Plano Mestre Integrado, portões G0–G4, funil de demanda, RAID, benefícios por fórmula e Torre de Controle. |
| 07/10/2026 | Entregue `axon-propostas.html` v1 (fonte em `src/`). QA: 12 slides sem overflow nem erros, revelações e cartas verificadas, celular em modo leitura, PDF 16:9 com anexos. |
