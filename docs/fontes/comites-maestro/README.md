# Fontes · Comitês do Projeto Maestro (Operação Assistida)

Decks "Master" usados nos comitês de acompanhamento da **Etapa 5 – Operação Assistida** do Projeto Maestro (A&M × ONS). Cada arquivo acumula as reuniões do comitê: a edição mais recente fica no início e as anteriores ficam como slides ocultos.

> **Material interno e confidencial.** Traz nomes de áreas, representantes indicados e status de projeto. Mantenha-o só neste repositório privado ou em outro ambiente aprovado (ver `README.md` da raiz).

## Arquivos

| Arquivo | Comitê | Cadência | Slides | Reuniões | Período | SHA-256 |
|---|---|---|---|---|---|---|
| `AM_Comite_Gestor_Op_Assistida_Master.pptx` | Comitê Gestor | semanal | 95 | 11 | 22/07 → 30/09/2026 | `bbee2b1ea2b8d920cc08054b95124f74abd96904cc5868cf814ecd9e4586d098` |
| `AM_Comite_Executivo_Op_Assistida_Master.pptx` | Comitê Executivo | quinzenal | 78 | 6 | 24/07 → 02/10/2026 | `38b8fa77d7a33a2eadbf409e5d79527275210e46ff39ea324b8e4eb3076487df` |

- Os nomes originais eram `AM_Comitê Gestor - Op. Assistida Master.pptx` e `AM_Comitê Executivo - Op. Assistida Master.pptx`. Foram normalizados para ASCII, sem espaços.
- O deck Executivo chegou duas vezes, em uploads idênticos (mesmo SHA-256), e foi armazenado uma única vez.
- `extracao/comite-gestor.md` e `extracao/comite-executivo.md` guardam o texto integral de cada slide, separado por reunião e com a marcação de slide oculto, para busca (`grep`) sem abrir o PowerPoint. O status das atividades vem de ícones e não aparece nesse texto; ele está consolidado no painel (abaixo).

## Estrutura de cada reunião

Todas as reuniões seguem o mesmo esqueleto:

1. Capa com a data da reunião.
2. Cronograma do projeto: visão geral de out/2025 a out/2026 e detalhe da Etapa 5.
3. **Acompanhamento de atividades.** Tabela com Frente, Atividade, Prazo, Status e Próximos passos. O status é um ícone: ● concluído, ◐ em andamento, ◐ amarelo em atraso, ○ não iniciado.
4. Slides temáticos da semana (lista abaixo).
5. **Pontos de atenção.** Tabela com Descrição, Status textual (Em acompanhamento ou Fechado), Plano de ação, Responsável e Prazo.

### Comitê Gestor

| Reunião | Slides | Situação no deck | Atividades | Pontos de atenção | Slides temáticos |
|---|---|---|---|---|---|
| 30/09/2026 | 1–10 | vigente | 10 | 3 | Plano de monitoramento, ajustes e transferência · Frentes de adoção ao Modelo de Operação · Evolução das Comunidades (% por frente) |
| 23/09/2026 | 11–19 | arquivada | 10 | 3 | Plano de monitoramento · Frentes de adoção · Evolução das Comunidades |
| 16/09/2026 | 20–28 | arquivada | 11 | 3 | Atividade de fixação (Modelo de Operação Matricial) · Plano de monitoramento |
| 09/09/2026 | 29–34 | arquivada | 10 | 3 | — |
| 02/09/2026 | 35–42 | arquivada | 11 | 2 | Indicações de representantes de negócio e participantes das Comunidades Técnicas · Resumo administrativo do treinamento |
| 26/08/2026 | 43–49 | arquivada | 11 | 2 | Gestão de Mudanças, abordagem A&M |
| 19/08/2026 | 50–58 | arquivada | 10 | 2 | Principais entregáveis · Destino dos processos acumulados na FE · Pesquisa do workshop |
| 12/08/2026 | 59–66 | arquivada | 10 | 2 | Modelo comum de governança para o setup · Sugestão de cronograma de treinamentos |
| 05/08/2026 | 67–75 | arquivada | 9 | 2 | Plano de Comunicação · Rede de Influenciadores (FE, DPL, DOP, DTA) |
| 29/07/2026 | 76–81 | arquivada | 11 | 2 | — |
| 22/07/2026 | 82–95 | arquivada | 10 | 2 | Fluxo de validação das definições da FE · Pesquisa de Prontidão 2025–2026 · **Gestão de riscos**, com classificação de impacto (slide 93) · Cronograma de Gestão de Mudanças · Boletim mensal |

### Comitê Executivo

| Reunião | Slides | Situação no deck | Atividades | Pontos de atenção | Slides temáticos |
|---|---|---|---|---|---|
| 02/10/2026 | 1–11 | vigente | 14 | 3 | Frentes de adoção ao Modelo de Operação. Os slides 6 e 7 estão **ocultos**: são cópias das tabelas do Gestor de 30/09 e 23/09, não foram apresentados e o painel os ignora. |
| 18/09/2026 | 12–19 | vigente | 15 | 3 | — |
| 04/09/2026 | 20–33 | arquivada | 15 | 2 | Cronograma de treinamentos · Representantes de negócio e Comunidades Técnicas · Gestão de Mudanças · Resumo administrativo do treinamento |
| 21/08/2026 | 34–46 | arquivada | 11 | 2 | Principais entregáveis · Modelo comum de governança · Cronograma de treinamentos · Alcance da comunicação · Pesquisa do workshop |
| 10/08/2026 | 47–60 | arquivada | 11 | 2 | Plano de Comunicação · Rede de Influenciadores · Detalhamento dos workshops · Change Management |
| 24/07/2026 | 61–78 | arquivada | 11 | 2 | Detalhamento da Operação Assistida (3 frentes) · Fluxo de validação das definições da FE · Pesquisa de Prontidão |

A coluna "Atividades" conta atividades únicas apresentadas na reunião, deduplicadas quando a mesma atividade aparece em mais de um slide.

## Classificação da fonte

Pela regra do repositório (`FONTE_ONS` · `DECISAO_FUNCIONAL_PRODUTO` · `A_VALIDAR_FEG`):

- O conteúdo dos slides (atividades, prazos, status, pontos de atenção) é **FONTE**: material oficial dos comitês do projeto.
- As consolidações e os indicadores derivados do painel (prazo vencido, saída de pauta sem desfecho) são **DECISAO_FUNCIONAL_PRODUTO** e ficam marcados como "Derivado" até validação com a FEG.

## Uso

- Painel executivo: `apresentacoes/painel-comites-maestro/`. Veja o README de lá para abrir e para atualizar quando chegar uma versão nova de algum deck.
- Para atualizar: substitua o `.pptx` aqui, mantendo o nome, e rode `tools/atualizar_painel.py`.
