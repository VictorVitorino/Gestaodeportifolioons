# Revisão de Arquitetura

## Resultado
A arquitetura permanece aprovada para o MVP DEV: HTML/JS preservado, Services, Repository Pattern e PostgreSQL/Supabase.

## Gaps encontrados e tratados
1. RLS inicial bloquearia cadastros mestres sem policies de leitura → tratado em `0013_security_hardening.sql`.
2. Arquivamento validava ação, mas não escopo da gerência → tratado em `0013_security_hardening.sql`.
3. HTML puro não resolve `process.env` nem bare imports sozinho → runtime config + Vite como build tool, sem React/Next.
4. Concorrência → `SupabaseInitiativeRepository.update` filtra por `updated_at`; zero linhas vira `CONFLICT`.

## Gaps ainda dependentes de ambiente/validação
- policies de escrita das tabelas filhas;
- matriz final de permissões FEG;
- validação de views com RLS no PostgreSQL do projeto Supabase;
- backup/restore real;
- SSO corporativo;
- fórmulas/pesos/status/unidade de capacidade definitivos.

## Decisão
Não aumentar a complexidade arquitetural antes de comprovar necessidade. Primeiro garantir persistência, segurança, rastreabilidade e paridade funcional com a baseline.
