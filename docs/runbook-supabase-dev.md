# Runbook — Supabase DEV

## Pré-requisitos
- repositório privado;
- projeto Supabase exclusivo de DEV;
- dataset sintético;
- `.env`/runtime config fora do Git;
- migrations versionadas.

## Ordem de instalação
1. Criar projeto Supabase DEV.
2. Configurar `SUPABASE_URL` e `SUPABASE_ANON_KEY` no ambiente.
3. Executar `database/migrations/0001...0013` em ordem.
4. Executar seeds autorizados.
5. Criar usuário DEV controlado.
6. Conceder ações explicitamente para QA; não assumir matriz oficial.
7. Executar smoke tests e testes RLS.

## Smoke tests
- login;
- leitura de cadastro mestre;
- CRUD de iniciativa sintética;
- conflito de versão;
- auto-dependência bloqueada;
- histórico;
- arquivamento;
- persistência após nova sessão.

## Segurança
Nunca colocar `service_role`, senha de banco ou token pessoal no frontend/GitHub.
Não desabilitar RLS para contornar falha de policy.

## Gate para integrar o HTML
Somente ativar `DATA_PROVIDER=supabase` após migrations, RLS e usuário DEV estarem validados.
