# Revisão de Arquitetura

## Resultado
A arquitetura permanece aprovada para o MVP DEV: HTML/JS preservado, Services, Repository Pattern e PostgreSQL/Supabase.

## Gaps encontrados e tratados
1. RLS inicial bloquearia cadastros mestres sem policies de leitura → tratado em `0013_security_hardening.sql`.
2. Arquivamento validava ação, mas não escopo da gerência → tratado em `0013_security_hardening.sql`.
3. HTML puro não resolve `process.env` nem bare imports sozinho → runtime config + Vite como build tool, sem React/Next.
4. Snapshot fechado precisava distinguir corretamente UPDATE de DELETE → tratado em `0014_integrity_and_reproducibility.sql`.
5. 30/60/90 baseado apenas em `current_date` não reproduzia uma visão histórica → função por data de referência em `0014_integrity_and_reproducibility.sql`.
6. Hierarquia Gerência → Comunidade → Squad precisava de garantia no banco → trigger de integridade em `0014_integrity_and_reproducibility.sql`.
7. Concorrência por `updated_at` era frágil e falhou em teste → substituída por `row_version` monotônico em `0015_optimistic_concurrency.sql`.
8. Toolchain inicial estava defasado → CI em Node 24, Supabase JS 2.116+ e Vite 8 em linha corrigida de segurança.

## Gaps ainda dependentes de ambiente/validação
- policies de escrita das tabelas filhas;
- matriz final de permissões FEG;
- validação de views com RLS no PostgreSQL do projeto Supabase;
- backup/restore real;
- SSO corporativo;
- fórmulas/pesos/status/unidade de capacidade definitivos.

## Decisão
Não aumentar a complexidade arquitetural antes de comprovar necessidade. Primeiro garantir persistência, segurança, rastreabilidade e paridade funcional com a baseline.
