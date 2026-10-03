# Sistema de Gestão de Portfólio FE — ONS

Base técnica para evolução da baseline funcional do Portfólio FE de um protótipo HTML para uma aplicação persistente.

> **Repositório privado / MVP técnico.** Dados corporativos reais, documentos internos sensíveis e credenciais só devem ser utilizados em ambiente aprovado e protegido.

## Objetivo

Preservar a experiência funcional já construída e separar progressivamente:

`HTML/JS → Services → Repositories → Supabase Auth/REST/RPC → RLS → PostgreSQL`

O sistema permanece uma camada estratégica/gerencial e **não substitui** Azure DevOps, Jira, ITSM ou demais ferramentas operacionais.

## Princípios

- Não inventar regra ONS.
- Distinguir sempre `FONTE_ONS`, `DECISAO_FUNCIONAL_PRODUTO` e `A_VALIDAR_FEG`.
- Preservar histórico e rastreabilidade.
- Não aplicar score/pesos de priorização como regra oficial sem validação.
- Segurança deve existir no banco/backend, não apenas na interface ou nos Services do browser.
- Migrations versionadas são a fonte de mudança estrutural do banco.
- RLS segue deny-by-default até concessão explícita de permissões.
- O HTML pode persistir dados, mas apenas via Supabase Client/REST/RPC com sessão autenticada e RLS.

## Arquitetura

```text
HTML/JS atual
    ↓
Services / Rules
    ↓
Repository Pattern
    ↓
Supabase Auth + REST/RPC
    ↓
Row Level Security + grants mínimos
    ↓
PostgreSQL
    ↓
Histórico / Snapshots / Views executivas
```

`LocalStorage` permanece somente como adapter temporário de transição/paridade.

Vite é usado apenas como build/dev server para módulos ES e dependências; não há migração para React/Next nesta fase.

## Estrutura atual

```text
.
├── .github/workflows/ci.yml
├── database/
│   ├── migrations/0001...0019
│   ├── seeds/
│   └── README.md
├── docs/
├── labs/portfolio-feg/        # trilha didática (ver seção abaixo)
├── public/app-config.example.js
├── public/portfolio-feg.html  # arquivo único gerado da trilha didática
├── src/
├── tests/unit/
├── index.html
├── package.json
├── .env.example
└── .gitignore
```

## Gestão de Portfólio FEG — sistema (labs/gestao-portfolio-feg)

Sistema de cadastro, entrada e priorização de projetos para a própria equipe da FEG fazer a gestão do portfólio. Arquivo único e offline: abra `public/gestao-portfolio-feg.html` no Chrome ou Edge. Os dados ficam no `localStorage` do navegador; use **Dados e configurações → Backup** para guardar cópia.

| Nível | Para quê | Telas |
|---|---|---|
| 1 · Cadastro e entrada | Registrar tudo e decidir o que entra | Painel, Novo projeto, Acervo, Funil de entrada (checklist entra / não entra / falta informação) |
| 2 · Priorização | Ordenar com perguntas (0–3) e pesos em % | Avaliar projetos, Ranking, Matriz valor × esforço, Critérios e pesos |
| 3 · Capacidade e planejamento | Ver o que cabe e quando | Carteira e capacidade (FTE, reserva, orçamento, decisão do comitê, pauta), Roadmap |

- Pesos, perguntas, checklist e reserva de capacidade são **sugestões a validar pela FEG** (editáveis na tela de Critérios e pesos e em Carteira).
- Planilha: exporta CSV compatível com Excel e importa com prévia de erros (modelo de planilha em Dados e configurações).
- Desenvolvimento: `labs/gestao-portfolio-feg/index.html` (arquivos separados) → `node labs/gestao-portfolio-feg/build.mjs` gera o arquivo único.
- QA de regressão: `bash labs/gestao-portfolio-feg/qa/qa.sh` (build, `npm test`, `npm run check`, apps existentes, todas as rotas em desktop/celular e fluxos de cada passo). Testes do modelo: `tests/unit/gestao-portfolio-feg.test.js`.
- Plano e requisitos: `labs/gestao-portfolio-feg/PLANO.md`.

## Portfólio FEG — trilha didática (labs/portfolio-feg)

App de aprendizagem de gestão de portfólio para as analistas da FEG, em 3 níveis progressivos. É um **arquivo HTML único e offline**, em pt-BR, com a paleta Maestro/ONS. Ele não usa o Supabase nem os dados do Portfólio FE.

> **Atenção:** todos os dados são fictícios (`ilustrativo:true`). Nenhuma regra do app é norma oficial do ONS: pesos, limiares e critérios aparecem com o rótulo de origem (Proposta A&M, A validar FEG, Decisão de produto ou Ilustrativo). Os registros feitos no app (decisões, pendências, fotografias) são simulações. Os PDFs saem com marca d'água de exercício.

**Como abrir:** abra `public/portfolio-feg.html` no Chrome ou no Edge. Não precisa de servidor nem de internet. O progresso fica salvo no `localStorage` do navegador. Em Configurações ficam o modo instrutor (libera todos os níveis), a restauração dos dados de exemplo e o reinício de um nível.

**Como desenvolver:**
- Abra `labs/portfolio-feg/index.html`, que carrega os arquivos de `src/` separados.
- Depois de editar, gere o arquivo único com `node labs/portfolio-feg/build.mjs`, que escreve `public/portfolio-feg.html`.
- `npm test` roda também `tests/unit/portfolio-feg-calc.test.js`, que testa os cálculos de `src/calc.js` sobre os dados de exemplo.

| Nível | Pergunta-guia | Telas | Perguntas |
|---|---|---|---|
| 1 · Partitura · Fundamentos | O que temos, como está e o que pede atenção neste mês? | Saúde & Prazos, Triagem, Mapa da FE | 23 |
| 2 · Arranjo · Priorização | O que fazer primeiro, cabendo na capacidade, e como acompanhar? | Critérios & Pesos, Pontuação & Matrizes, Capacidade & Seleção, Exercício de Gate, Desempenho (EVM), Fórum Mensal | 28 (27 contam) |
| 3 · Regência · Otimização | Qual a melhor combinação, quanto custam nossas políticas e a escolha se sustenta? | Otimizador, Cenários & Robustez, Sensibilidade, Benefícios & Inovação, Planejamento do Ciclo | 23 (22 contam) |

- Cada nível tem a **Trilha do nível**, com três abas: Perguntas & Respostas (conceito, análise e decisão), Desafio e Domínio.
- O nível seguinte abre com **70% das perguntas que contam + o desafio concluído**.
- Errar uma pergunta não mostra a resposta. "Ver resposta" mostra, mas a pergunta deixa de contar.
- Telas comuns a todos os níveis: Dashboard (uma aba por nível liberado), Indicadores, Inventário (ficha da iniciativa com abas que crescem a cada nível), Decisões e Fontes e premissas (painel de regras e glossário).

Referências:
- [`docs/portfolio-feg-niveis.md`](docs/portfolio-feg-niveis.md): especificação validada, com o conteúdo, os dados de exemplo e os gabaritos.
- [`labs/portfolio-feg/CONTRATO.md`](labs/portfolio-feg/CONTRATO.md): escopo da v1 e API do núcleo. Prevalece sobre a especificação quando as duas divergem.

## Banco

PostgreSQL via **Supabase DEV** ativo na região `sa-east-1`.

Entidades principais: Gerências, Comunidades, Squads, Ferramentas, Iniciativas, Avaliações, Dependências, Riscos/Impedimentos, Capacidade, Financeiro, Fóruns, Decisões, Snapshots, Histórico, Parâmetros e Segurança.

## Runtime config e acesso ao banco

A configuração pode vir de variáveis `VITE_*` ou de `globalThis.__APP_CONFIG__` no navegador.

Preferência atual:
- `VITE_APP_ENV=development`
- `VITE_DATA_PROVIDER=supabase`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

A publishable key pode existir no frontend. Ela **não** concede acesso aos dados por si só: a proteção depende de sessão autenticada, grants mínimos e RLS.

Nunca colocar no frontend: `service_role`, senha PostgreSQL, token administrativo ou segredo de integração.

## Hardening incorporado

- `anon` sem leitura dos dados corporativos;
- `authenticated` com grants mínimos e RLS;
- views executivas com `security_invoker`;
- helpers de autorização movidos para schema `private`;
- RPC pública intencional apenas onde necessária;
- escrita pelo browser atualmente limitada a Iniciativas;
- `DELETE` físico bloqueado no frontend;
- arquivamento por RPC validando ação + gerência;
- validação Gerência → Comunidade → Squad no banco;
- snapshot fechado protegido;
- horizonte 30/60/90 reproduzível por data de referência;
- concorrência por `row_version` monotônico;
- índices de suporte às FKs identificados pelo Performance Advisor.

## Estado atual

Concluído:
- repositório privado;
- Supabase DEV criado e ativo;
- migrations `0001` a `0019` aplicadas;
- seeds mínimos aplicados: 4 gerências, 7 perfis provisórios e 15 ações técnicas;
- RLS e hardening revisados pelo Supabase Advisor;
- smoke test de hierarquia e `row_version` aprovado;
- `anon` sem `SELECT` em Iniciativas;
- `authenticated` com `SELECT/INSERT/UPDATE` e sem `DELETE` em Iniciativas;
- Repository Pattern;
- Local e Supabase Initiative Repository;
- runtime config com publishable key e suporte a Vite;
- CI verde.

## Próxima etapa

Criar o primeiro usuário DEV autenticado pelo fluxo normal do Supabase Auth e vincular explicitamente perfil/ações de QA. Depois disso, executar o teste E2E pelo browser e integrar a baseline visual/funcional completa do HTML ao Repository Pattern.
