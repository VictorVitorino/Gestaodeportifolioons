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
├── public/app-config.example.js
├── src/
├── tests/unit/
├── index.html
├── package.json
├── .env.example
└── .gitignore
```

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
