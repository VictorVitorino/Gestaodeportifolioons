# Sistema de Gestão de Portfólio FE — ONS

Base técnica para evolução da baseline funcional do Portfólio FE de um protótipo HTML para uma aplicação persistente.

> **Atenção:** este repositório está em fase de MVP técnico. Não inserir dados corporativos reais, credenciais, documentos internos ou informações sensíveis enquanto o ambiente não estiver aprovado e protegido.

## Objetivo

Preservar a experiência funcional já construída e separar progressivamente:

`UI → Services → Repositories → PostgreSQL/Supabase`

O sistema permanece uma camada estratégica/gerencial e **não substitui** Azure DevOps, Jira, ITSM ou demais ferramentas operacionais.

## Princípios

- Não inventar regra ONS.
- Distinguir sempre `FONTE_ONS`, `DECISAO_FUNCIONAL_PRODUTO` e `A_VALIDAR_FEG`.
- Preservar histórico e rastreabilidade.
- Não aplicar score/pesos de priorização como regra oficial sem validação.
- Segurança deve existir no backend/banco, não apenas na interface.
- Migrations versionadas são a fonte de mudança estrutural do banco.

## Estrutura

```text
.
├── docs/
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── policies/
│   ├── functions/
│   └── views/
├── src/
│   ├── ui/
│   ├── services/
│   ├── repositories/
│   ├── rules/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
└── .gitignore
```

## Persistência

Banco alvo do MVP: PostgreSQL, inicialmente via Supabase.

Entidades principais:

- Gerências
- Comunidades
- Squads
- Ferramentas
- Iniciativas
- Avaliações
- Dependências
- Riscos/Impedimentos
- Capacidade
- Financeiro
- Fóruns
- Decisões
- Snapshots
- Histórico
- Parâmetros e segurança

## Ambientes

- `DEV`: dados fictícios/controlados.
- `HML`: homologação futura com FEG/ONS.
- `PRD`: somente após validação de infraestrutura, segurança e governança.

## Status

Estrutura inicial de engenharia em construção. Próxima etapa: conectar projeto Supabase DEV e aplicar migrations versionadas.
