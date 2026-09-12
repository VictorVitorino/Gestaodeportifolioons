# Banco de Dados

## Estrutura
- `migrations/`: evolução estrutural versionada.
- `seeds/`: dados iniciais autorizados.
- policies/functions/views podem permanecer em migrations ou ser separados futuramente sem perder histórico.

## Regras
1. Não alterar schema manualmente sem migration.
2. Não inserir dados ONS reais em DEV sem autorização.
3. Seeds não podem inventar nomes, status, pesos, metas ou parâmetros.
4. RLS permanece deny-by-default até configuração explícita.
5. Toda migration deve ser testada em banco limpo e sobre a versão anterior esperada.
6. O HTML acessa dados somente via Supabase Auth/REST/RPC; nunca por conexão PostgreSQL privilegiada.
7. `service_role` e senha PostgreSQL são proibidas no frontend.

## Ordem atual
`0001` a `0016`.

## Hardening já incorporado
- policies de leitura de cadastros mestres e tabelas filhas por escopo;
- acesso do papel `anon` aos dados explicitamente revogado;
- grants mínimos para `authenticated`;
- escrita pelo browser atualmente limitada a iniciativas;
- `DELETE` físico bloqueado para o papel `authenticated`;
- arquivamento validando ação + escopo de gerência;
- validação de hierarquia Gerência → Comunidade → Squad no banco;
- proteção correta de snapshot fechado sem bloquear exclusão de snapshot aberto;
- horizonte 30/60/90 reproduzível por data de referência;
- concorrência otimista por `row_version` monotônico.

## Pendências para ambiente real
- executar migrations no Supabase DEV;
- validar versão PostgreSQL/Supabase;
- validar comportamento das views com RLS;
- validar grants/revokes da migration `0016_browser_access_security.sql`;
- criar policies de escrita das tabelas filhas após matriz de permissões;
- executar backup/restore antes de HML.
