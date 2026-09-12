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
│   ├── migrations/0001...0016
│   ├── seeds/
│   └── README.md
├── docs/
│   ├── architecture.md
│   ├── architecture-review.md
│   ├── api-contracts.md
│   ├── data-model.md
│   ├── implementation-plan.md
│   ├── runbook-supabase-dev.md
│   └── security.md
├── public/
│   └── app-config.example.js
├── src/
│   ├── config/
│   ├── lib/
│   ├── mappers/
│   ├── repositories/
│   ├── rules/
│   └── services/
├── tests/unit/
├── index.html
├── package.json
├── .env.example
└── .gitignore
```

## Banco

PostgreSQL, inicialmente via Supabase DEV.

Entidades principais: Gerências, Comunidades, Squads, Ferramentas, Iniciativas, Avaliações, Dependências, Riscos/Impedimentos, Capacidade, Financeiro, Fóruns, Decisões, Snapshots, Histórico, Parâmetros e Segurança.

## Desenvolvimento

```bash
npm install
npm run check
npm test
npm run dev
```

Para build:

```bash
npm run build
```

## Runtime config e acesso ao banco

A configuração pode vir de variáveis de ambiente ou de `globalThis.__APP_CONFIG__` no navegador. Use `public/app-config.example.js` como referência e mantenha `public/app-config.js` fora do Git.

`SUPABASE_URL` e a anon/publishable key podem existir no frontend. Elas **não** substituem autenticação nem autorização. A proteção dos dados depende de sessão autenticada, grants mínimos e RLS corretamente configurada.

Nunca colocar no frontend: `service_role`, senha PostgreSQL, token administrativo ou segredo de integração.

O papel `anon` não recebe acesso aos dados do schema público. O papel `authenticated` recebe somente os privilégios mínimos necessários e continua sujeito às policies RLS por linha/escopo.

## Hardening incorporado

- policies de leitura por escopo para cadastros mestres e tabelas filhas;
- acesso anônimo a dados explicitamente revogado;
- privilégios mínimos para `authenticated`;
- escrita pelo browser atualmente limitada a Iniciativas;
- `DELETE` físico bloqueado no frontend;
- arquivamento por RPC validando ação + gerência;
- validação Gerência → Comunidade → Squad no banco;
- snapshot fechado imutável sem bloquear exclusão de snapshot aberto;
- horizonte 30/60/90 calculável com data de referência explícita para reprodutibilidade histórica;
- runtime config compatível com HTML/JS sem exigir framework;
- controle de concorrência por `row_version` monotônico, sem depender de timestamp.

## Estado atual

Concluído:
- repositório privado;
- arquitetura e documentação técnica revisadas;
- migrations `0001` a `0016`;
- seeds seguros;
- RLS e hardening para acesso pelo browser;
- Repository Pattern;
- Local e Supabase Initiative Repository;
- mapper, rules e service de iniciativa;
- runtime config para HTML puro;
- Vite sem framework;
- CI inicial;
- testes unitários iniciais;
- optimistic locking por `row_version`.

Próximo bloqueio externo: criar/conectar o **Supabase DEV**, aplicar migrations, configurar usuário de teste e executar o runbook de RLS/smoke tests. Depois disso, integrar a baseline HTML funcional ao Repository Pattern já preparado.
