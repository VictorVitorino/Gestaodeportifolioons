# Painel executivo · Comitês do Maestro (v1)

Painel em HTML de arquivo único com o **Comitê Gestor** e o **Comitê Executivo** da Operação Assistida em abas separadas. Cada comitê tem:

1. **Atividades.** Indicadores da reunião, gráfico de **atividades por período**, leitura executiva e lista de atividades com a trilha de status reunião a reunião.
2. **Riscos e impactos**, só com status. Indicadores dos pontos de atenção, matriz de status por reunião, reprogramações de prazo e, quando o deck traz a tabela, a classificação de impacto do slide "Gestão de riscos".

Abra `index.html` direto no navegador. Os dados estão embutidos no arquivo, então ele funciona sem servidor e offline. As fontes Barlow Condensed e Inter vêm do Google Fonts; sem internet, o navegador usa fontes de fallback.

Segue a linguagem visual das apresentações executivas A&M do repositório: paleta navy/azul/dourado, tipografia condensada nos títulos e o cabeçalho do "Status Report Executivo" (modelos 06–09 de `apresentacoes/modelos-referencia/README.md`, no branch `claude/tender-gates-hehws8`).

## Como usar

| Controle | O que faz |
|---|---|
| Abas **Comitê Gestor / Comitê Executivo** | Trocam o comitê. As duas visões nunca se misturam. |
| **Reunião de referência** | Mostra o painel "como estava" em qualquer reunião passada. Todos os números, gráficos e tabelas são recalculados até aquela data. |
| **Frente** | Filtra por Gerências e comunidades ou por Gestão de mudanças. |
| Gráfico: **Semana do prazo / Mês do prazo / Reunião do comitê** | As duas primeiras opções agrupam as atividades acompanhadas pelo prazo, com o último status reportado. A terceira mostra o retrato da pauta de cada reunião. |
| Clique numa coluna | Filtra a lista de atividades pelo período ou reunião escolhido. Funciona também pelo teclado: Tab, depois Enter. |
| "Ver dados do gráfico em tabela" | Mostra a versão em tabela do gráfico, para acessibilidade e conferência. |

## Regras dos dados

**Fonte.** Tudo sai de `docs/fontes/comites-maestro/*.pptx`. Nenhum número é estimado.

| Regra | Classificação |
|---|---|
| O status de cada atividade é o ícone do deck, lido pela geometria do slide. A tabela e os ícones estão em camadas separadas; o i-ésimo ícone da coluna Status, de cima para baixo e excluindo a legenda, corresponde à i-ésima linha com atividade. O script só aceita esse mapeamento quando o número de ícones é igual ao de linhas; caso contrário, avisa para conferir. | FONTE (leitura) |
| Numa reunião vigente (capa visível), slides ocultos são cópias de trabalho e ficam de fora. Exemplo: slides 6 e 7 do Executivo de 02/10. | DECISAO_FUNCIONAL_PRODUTO |
| Se a atividade aparece em mais de um slide da mesma reunião, vale a primeira ocorrência, que é o retrato mais recente. | DECISAO_FUNCIONAL_PRODUTO |
| A mesma atividade é reconhecida entre reuniões pela descrição normalizada. Variantes de redação só se juntam quando nunca aparecem na mesma reunião, têm similaridade ≥ 0,93, o mesmo verbo inicial e os mesmos números. Assim, "Agendamento" e "Realização" do workshop ficam separados, assim como a "3ª" e a "4ª Sessão". As junções ficam registradas em `aliases`. | DECISAO_FUNCIONAL_PRODUTO |
| **Prazo vencido sem conclusão**: prazo anterior à data da reunião e status diferente de concluído. | Derivado · A_VALIDAR_FEG |
| **Saíram da pauta sem desfecho**: a última menção da atividade não é "concluído". Pode ser atividade encerrada sem registro ou atividade renomeada de forma livre. | Derivado · A_VALIDAR_FEG |
| O status dos pontos de atenção é o texto da tabela ("Em acompanhamento" ou "Fechado"). Uma reprogramação é contada a cada mudança de prazo entre reuniões. | FONTE / Derivado |
| A classificação de impacto (Dentro do plano, Risco moderado, Impacto relevante) só existe no slide "Gestão de riscos" do Gestor (base 22/07). Não é extrapolada para os pontos de atenção. | FONTE |

## Verificação feita na v1

- As 253 linhas extraídas (atividades, pontos de atenção e riscos) foram conferidas uma a uma contra as imagens dos slides das 17 reuniões, por verificadores independentes. Houve divergência zero em status, prazo e texto das atividades.
- O pipeline é reprodutível: rodar `tools/atualizar_painel.py` sobre os `.pptx` armazenados gera exatamente o `dados/dados-comites.json` verificado.

## Atualizar com um deck novo

```bash
# na raiz do repositório (requer python3 + lxml)
python3 apresentacoes/painel-comites-maestro/tools/atualizar_painel.py \
  --gestor docs/fontes/comites-maestro/AM_Comite_Gestor_Op_Assistida_Master.pptx \
  --executivo docs/fontes/comites-maestro/AM_Comite_Executivo_Op_Assistida_Master.pptx
```

O script extrai (`extrair_comites.py`), consolida (`consolidar_dados.py`), grava `dados/dados-comites.json` e injeta o mesmo JSON no bloco `<script id="dados-comites">` do `index.html`. Se alguma tabela tiver número de ícones diferente do número de linhas, ele imprime **ATENÇÃO** com o slide a conferir.

## Arquivos

```text
apresentacoes/painel-comites-maestro/
├── index.html                 # painel (arquivo único, dados embutidos)
├── dados/dados-comites.json   # dataset consolidado (mesmo conteúdo embutido)
└── tools/
    ├── extrair_comites.py     # pptx -> JSON bruto (tabelas + ícones de status por geometria)
    ├── consolidar_dados.py    # JSON bruto -> dataset do painel (regras acima)
    └── atualizar_painel.py    # orquestra e injeta no index.html
```

## Próximos passos sugeridos

- Levar a "Evolução das Comunidades" (% de adoção por frente e comunidade, slides 8 e 17 do Gestor) para um heatmap no painel.
- Validar com a FEG os dois indicadores derivados e a regra de "em atraso".
- Integrar ao modelo do sistema (Fóruns, Decisões e Snapshots já existem nas migrations `0007`), para que cada reunião vire um snapshot persistido.
