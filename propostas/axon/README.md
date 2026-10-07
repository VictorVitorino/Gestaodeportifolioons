# Axon · Propostas de Gestão de Mudanças (GMO) e TMO

Pasta de trabalho das propostas comerciais (de **trabalho**, não de valor) para a adoção da plataforma **Axon** no ONS, nas gerências PE, PR, PL, OS e PD.

| Arquivo | Conteúdo |
|---|---|
| [`axon-propostas.html`](axon-propostas.html) | **Entregável.** Apresentação navegável e autocontida: Proposta A (GMO) e Proposta B (TMO), com 6 slides cada |
| [`00-briefing-original.md`](00-briefing-original.md) | Pedido e transcrição da conversa, verbatim (fonte primária) |
| [`01-contexto-axon.md`](01-contexto-axon.md) | Contexto consolidado: produto, mudança, públicos, desafios, identidade visual, pendências e decisões |
| [`02-roteiro-propostas.md`](02-roteiro-propostas.md) | Roteiro slide a slide das duas propostas: texto final, revelações, interações e notas do apresentador |
| [`src/`](src/) | Fonte modular do HTML (motor, design system, decks A e B, biblioteca de revelações, build e QA) |
| [`referencias/`](referencias/) | Deck de referência (PPTX) e renders dos slides |

## Como apresentar

Abra `axon-propostas.html` no navegador. Funciona direto do disco, sem servidor e sem internet (a fonte Archivo cai para uma fonte de reserva).

| Tecla | Ação |
|---|---|
| → ← · Espaço · PageUp/PageDown | Avança ou volta um slide |
| 1–6 · Home · End | Vai direto ao slide |
| **A** / **B** | Troca de proposta, mantendo o número do slide |
| **C** | Compara A e B lado a lado |
| **N** | Notas do apresentador e mensagem-chave |
| **P** | Modo apresentador (segunda janela sincronizada, com relógio) |
| **L** | Modo leitura (todos os slides e revelações abertas; ativa sozinho no celular) |
| **F** | Tela cheia |
| **?** | Ajuda |

- Os pontos laranja indicam elementos clicáveis: revelações, cartas que viram, portões e simulações.
- O botão de impressão gera um PDF 16:9 da Proposta A, da B ou das duas, com anexos das revelações e, se marcado, as notas.
- Rotas diretas: `#A-1` … `#A-6`, `#B-1` … `#B-6`.

## Como editar e regenerar

```bash
node propostas/axon/src/build.mjs                       # regenera axon-propostas.html a partir de src/
node propostas/axon/src/tools/shoot.cjs propostas/axon/axon-propostas.html /tmp/qa --deck AB --reveals --mobile --print
```

- O conteúdo de cada deck fica em `src/slides-A.*` e `src/slides-B.*`.
- As revelações compartilhadas (R-01 a R-19) ficam em `src/reveals-lib.js`.
- As convenções estão em [`src/COMPONENTES.md`](src/COMPONENTES.md).
- O QA usa Playwright, que precisa estar instalado no ambiente.

**Próximo insumo esperado:** propostas de referência de GMO e de TMO enviadas pelo usuário. Elas devem ser incorporadas numa nova iteração.
