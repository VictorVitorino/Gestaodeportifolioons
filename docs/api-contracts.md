# Contratos de Serviços e API

## Camadas
`UI → Services → Repositories → PostgreSQL/Supabase`

A UI não deve espalhar chamadas diretas ao banco.

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
- `updateInitiative(id, payload, expectedVersion)`
- `archiveInitiative(id)`

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

## Códigos de erro
`AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_ERROR`, `REFERENCE_NOT_FOUND`, `HIERARCHY_MISMATCH`, `CONFLICT`, `RULE_NOT_VALIDATED`, `INCOMPATIBLE_UNIT`, `SOURCE_REQUIRED`, `SNAPSHOT_LOCKED`, `INTERNAL_ERROR`.
