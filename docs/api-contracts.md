# Contratos de Serviços e API

## Camadas
`UI → Services → Repositories → Supabase Auth/REST/RPC → RLS → PostgreSQL`

A UI não deve espalhar chamadas diretas ao banco nem abrir conexão PostgreSQL. O Repository pode usar o Supabase Client/REST/RPC, sempre sujeito à sessão autenticada e às policies RLS.

Services no browser organizam regra/orquestração, mas não substituem autorização no banco.

## Resposta padrão
Sucesso:
```json
{ "data": {}, "meta": {}, "warnings": [] }
```

Erro:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "..." } }
```

## Iniciativas
- `listInitiatives(filters)`
- `getInitiative(id)`
- `createInitiative(payload)`
- `updateInitiative(id, payload, rowVersion)`
- `archiveInitiative(id)`

O controle otimista usa `row_version`. `updated_at` permanece timestamp de auditoria e não é token de concorrência.

## Avaliações
- `listAssessments(iniciativaId)`
- `getLatestAssessment(iniciativaId)`
- `createAssessment(iniciativaId, payload)`

## Dependências e riscos
- `listDependencies(filters)`
- `createDependency(payload)`
- `updateDependency(id, payload)`
- `closeDependency(id, resolution)`
- `listRisks(filters)`
- `createRisk(payload)`
- `updateRisk(id, payload)`
- `closeRisk(id, resolution)`

## Capacidade e financeiro
Cálculos derivados só são permitidos quando unidade, período, fonte e método estiverem válidos/aprovados.

## Home executiva
`getExecutiveHome(filters)` retorna situação atual, KPIs, mudanças, horizontes 30/60/90, pontos objetivos de ação e metadata da regra/data de corte.

## Segurança do acesso pelo browser
- `SUPABASE_URL` e anon/publishable key podem estar no frontend;
- dados exigem sessão autenticada e RLS;
- `anon` não possui privilégio de dados no schema público;
- `authenticated` recebe mínimo privilégio;
- `service_role`, senha PostgreSQL e segredos administrativos são proibidos no browser;
- operações privilegiadas devem usar RPC segura/Edge Function/backend.

## Códigos de erro
`AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`, `REFERENCE_NOT_FOUND`, `HIERARCHY_MISMATCH`, `CONFLICT`, `RULE_NOT_VALIDATED`, `INCOMPATIBLE_UNIT`, `SOURCE_REQUIRED`, `SNAPSHOT_LOCKED`, `INTERNAL_ERROR`.
