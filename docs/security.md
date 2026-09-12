# Segurança e RLS

## Princípio
Ocultar controles na UI não é segurança. Toda ação sensível deve ser validada no banco/backend.

Services e Rules executados no navegador organizam comportamento, mas **não são fronteira de confiança**. A autorização real deve ser reenforçada por RLS, RPC segura ou backend server-side.

## Acesso do HTML ao banco

O HTML está autorizado a utilizar o banco do MVP por este fluxo:

`HTML/JS → Supabase Auth → Supabase Client/REST/RPC → RLS → PostgreSQL`

Permitido no frontend:
- `SUPABASE_URL`;
- anon/publishable key;
- sessão do usuário gerenciada pelo SDK.

Proibido no frontend:
- `service_role`;
- senha PostgreSQL;
- token administrativo;
- segredo de integração;
- conexão SQL direta.

A anon/publishable key identifica a aplicação, mas **não concede acesso aos dados por si só**. O papel `anon` não possui privilégios de dados no schema público. O papel `authenticated` recebe somente privilégios mínimos e continua sujeito às policies RLS.

## Perfis provisórios
- `GERENTE_EXECUTIVO_FE`
- `GERENTE_FEG`
- `GERENTE_DOMINIO`
- `ANALISTA_GOV_PORTFOLIO`
- `LIDER_COMUNIDADE`
- `PRODUCT_OWNER`
- `CONSULTA`

As permissões finais permanecem `A_VALIDAR_FEG`.

## Ações técnicas
`portfolio.read`, `initiative.create`, `initiative.update`, `initiative.archive`, `assessment.create`, `dependency.manage`, `risk.manage`, `capacity.manage`, `financial.manage`, `decision.create`, `forum.manage`, `snapshot.generate`, `parameter.manage`, `masterdata.manage`, `useraccess.manage`.

## RLS e menor privilégio
- usuários não autenticados não acessam dados corporativos;
- leitura/escrita consideram ação e escopo;
- escrita pelo browser está inicialmente limitada a Iniciativas;
- tabelas filhas continuam deny-by-default para escrita até validação da matriz funcional;
- `DELETE` físico não faz parte do fluxo do frontend;
- histórico não é editável por usuário funcional;
- snapshots fechados são imutáveis;
- `service_role` nunca vai para o browser.

## Operações privilegiadas
Operações que exigem privilégio elevado, segredo ou lógica sensível devem ser feitas por RPC segura, Edge Function ou backend server-side. A RPC `archive_initiative` exige usuário autenticado e valida `initiative.archive` + escopo de gerência.

## Proteção do frontend
- HTTPS obrigatório fora de localhost;
- evitar `innerHTML` para conteúdo dinâmico não sanitizado;
- não registrar token, credenciais ou payload corporativo completo em console/log;
- aplicar Content Security Policy na hospedagem publicada;
- não usar validação JavaScript como autorização;
- não persistir manualmente segredos em localStorage/sessionStorage.

## Segredos
Segredos e chaves privilegiadas ficam em variáveis de ambiente seguras/secret manager. Nunca versionar `.env` real.

## Migration de referência
`0016_browser_access_security.sql` formaliza os grants/revokes necessários para o acesso seguro do HTML ao Supabase.
