# Sistema de Gestão de Portfólio FE — ONS

Base técnica para evolução da baseline funcional do Portfólio FE de um protótipo HTML para uma aplicação persistente.

> **Repositório privado / MVP técnico.** Dados corporativos reais, documentos internos sensíveis e credenciais só devem ser utilizados em ambiente aprovado e protegido.

## Objetivo

Preservar a experiência funcional já construída e separar progressivamente:

`UI HTML/JS → Services → Repositories → PostgreSQL/Supabase`

O sistema permanece uma camada estratégica/gerencial e **não substitui** Azure DevOps, Jira, ITSM ou demais ferramentas operacionais.

## Princípios

- Não inventar regra ONS.
- Distinguir sempre `FONTE_ONS`, `DECISAO_FUNCIONAL_PRODUTO` e `A_VALIDAR_FEG`.
- Preservar histórico e rastreabilidade.
- Não aplicar score/pesos de priorização como regra oficial sem validação.
- Segurança deve existir no backend/banco, não apenas na interface.
- Migrations versionadas são a fonte de mudança estrutural do banco.
- RLS segue deny-by-default até concessão explícita de permissões.

## Arquitetura

```text
HTML/JS atual
    ↓
Services / Rules
    ↓
Repository Pattern
    ↓
LocalStorage (transição) ou Supabase/PostgreSQL (persistente)
    ↓
Histórico / Snapshots / Views executivas
```

Vite é usado somente como build/dev server para módulos ES e dependências; não há migração para React/Next nesta fase.

## Estrutura atual

```text
.
├── .github/workflows/ci.yml
├── database/
│   ├── migrations/0001...0013
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

## Runtime config

A configuração pode vir de variáveis de ambiente ou de `globalThis.__APP_CONFIG__` no navegador. Use `public/app-config.example.js` como referência e mantenha `public/app-config.js` fora do Git.

A `SUPABASE_ANON_KEY` só é segura no browser quando RLS está corretamente configurada. **Nunca** colocar `service_role` no frontend.

## Estado atual

Concluído:
- repositório privado;
- arquitetura e documentação técnica;
- migrations `0001` a `0013`;
- seeds seguros;
- base de RLS e hardening;
- Repository Pattern;
- Local e Supabase Initiative Repository;
- mapper, rules e service de iniciativa;
- runtime config para HTML puro;
- Vite sem framework;
- CI inicial;
- testes unitários iniciais.

Próximo bloqueio externo: criar/conectar o **Supabase DEV**, aplicar migrations, configurar usuário de teste e executar o runbook de RLS/smoke tests. Depois disso, integrar a baseline HTML funcional ao Repository Pattern já preparado.
