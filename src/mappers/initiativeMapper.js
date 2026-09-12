export function initiativeDbToDomain(row) {
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    descricaoObjetivo: row.descricao_objetivo,
    gerenciaId: row.gerencia_id,
    comunidadeId: row.comunidade_id,
    squadId: row.squad_id,
    ferramentaId: row.ferramenta_id,
    areaClienteOrigem: row.area_cliente_origem,
    responsavel: row.responsavel,
    horizontePrazo: row.horizonte_prazo,
    statusId: row.status_id,
    criticidade: row.criticidade,
    impacto: row.impacto,
    trlEsperado: row.trl_esperado,
    linkOperacional: row.link_operacional,
    dataPlanejada: row.data_planejada,
    dataPrevistaAtual: row.data_prevista_atual,
    observacoes: row.observacoes,
    ativo: row.ativo,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function initiativeDomainToDb(model) {
  return {
    titulo: model.titulo,
    descricao_objetivo: model.descricaoObjetivo,
    gerencia_id: model.gerenciaId,
    comunidade_id: model.comunidadeId,
    squad_id: model.squadId ?? null,
    ferramenta_id: model.ferramentaId ?? null,
    area_cliente_origem: model.areaClienteOrigem ?? null,
    responsavel: model.responsavel,
    horizonte_prazo: model.horizontePrazo ?? null,
    status_id: model.statusId ?? null,
    criticidade: model.criticidade ?? null,
    impacto: model.impacto ?? null,
    trl_esperado: model.trlEsperado ?? null,
    link_operacional: model.linkOperacional ?? null,
    data_planejada: model.dataPlanejada ?? null,
    data_prevista_atual: model.dataPrevistaAtual ?? null,
    observacoes: model.observacoes ?? null,
    ativo: model.ativo ?? true
  };
}
