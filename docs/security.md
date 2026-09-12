# Segurança e RLS

## Princípio
Ocultar controles na UI não é segurança. Toda ação sensível deve ser validada no banco/backend.

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

## RLS
- usuários não autenticados não acessam dados corporativos;
- leitura/escrita consideram ação e escopo;
- histórico não é editável por usuário funcional;
- snapshots fechados são imutáveis;
- `service_role` nunca vai para o browser.

## Segredos
Segredos e chaves privilegiadas ficam em variáveis de ambiente/secret manager. Nunca versionar `.env` real.
