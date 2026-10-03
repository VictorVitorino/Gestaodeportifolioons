# Gestão de Portfólio FEG — plano de desenvolvimento

## O pedido, organizado

| # | Pedido | Como será atendido |
|---|---|---|
| 1 | Design limpo, menos cinza | Fundo branco, verde ONS `#3E6801` como cor principal, cinza `#E4E3E4` só em bordas/divisórias |
| 2 | Sem Maestro, sem nomes de orquestra | Novo app, sem nenhuma referência ao Maestro |
| 3 | Logo ONS + logo FEG (só a sigla) | Logo oficial ONS (extraído da imagem enviada) + monograma tipográfico "FEG" |
| 4 | **Sistema** de cadastro de projetos (não treinamento) | Cadastro, acervo, funil de entrada (entra / não entra), status, histórico |
| 5 | Perguntas para priorizar, com % de importância | Questionário de priorização com escala 0–3 e pesos em % editáveis (somam 100%) → score 0–100, ranking e matriz |
| 6 | Níveis 1, 2 e 3 explicados de forma simples | Seletor de nível no topo: cada nível libera telas e tem um botão "o que este nível faz" |
| 7 | Menu lateral minimizável com ícone + tooltip | Botão de recolher; recolhido mostra só ícones com tooltip; preferência salva |
| 8 | Inspirado na planilha de ranking (não cópia) | Notas 0–3 por critério, dois eixos (Valor × Esforço), score, ranking e quadrantes |

## Melhorias propostas (análise)
- **Funil de entrada** (decks Fleury e A&M Etapa 5): Entrada → Triagem → Priorização → Execução → Acervo. Cada projeto mostra em que etapa está.
- **Checklist "entra / não entra"** com motivo registrado. Evita discussão subjetiva.
- **Obrigatório/regulatório** fura a fila (inspirado na classe de prioridade 1 do deck Fleury), mas fica sinalizado.
- **Importar/exportar** CSV (abre no Excel) e backup JSON, para não ficar preso ao navegador.
- **PDF do ranking/painel** para levar ao comitê.
- Pesos e perguntas vêm como **sugestão a validar pela FEG**. São editáveis na tela de Pesos.

## Níveis
| Nível | Para quê | Telas |
|---|---|---|
| **1 · Cadastro e entrada** | Registrar tudo e decidir o que entra | Painel, Novo projeto, Acervo, Funil de entrada |
| **2 · Priorização** | Ordenar o que entrou com critérios e pesos | Avaliar projetos, Ranking, Matriz valor × esforço, Critérios e pesos |
| **3 · Capacidade e planejamento** | Ver o que cabe na equipe/orçamento e quando | Carteira e capacidade (simulação), Roadmap |

## Passo a passo (cada passo termina com QA de regressão)
1. Base visual limpa, logos, menu recolhível, seletor de níveis
2. Cadastro + Acervo (lista, filtros, busca, ficha, editar, arquivar)
3. Funil de entrada (checklist entra/não entra, quadro por etapa)
4. Priorização (perguntas, pesos %, score, ranking, matriz)
5. Painel (indicadores)
6. Nível 3: carteira e capacidade + roadmap
7. Importar/exportar CSV/JSON + PDF
8. QA final completo e entrega

## Checklist de QA (rodado a cada passo — `qa/qa.cjs`)
- `npm test` e `npm run check` do repositório passam (nada existente quebrou)
- Apps existentes (`public/afinacao-feg.html`, `public/portfolio-feg.html`) continuam abrindo sem erro
- Todas as rotas do novo app abrem sem erro de console, em 1440×900 e 390×844, sem rolagem horizontal
- Fluxos do passo (cadastrar, editar, avaliar…) funcionam e persistem após recarregar
- Testes unitários do modelo de score (`tests/unit/gestao-portfolio-feg.test.js`)
