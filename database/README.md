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

## Ordem atual
`0001` a `0013`.

## Pendências para ambiente real
- executar migrations no Supabase DEV;
- validar PostgreSQL/Supabase version;
- validar comportamento das views com RLS;
- criar policies de escrita das tabelas filhas após matriz de permissões;
- executar backup/restore antes de HML.
