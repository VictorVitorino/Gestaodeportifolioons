export function validateInitiativePayload(payload) {
  const errors = [];

  if (!payload?.titulo?.trim()) errors.push({ field: 'titulo', code: 'REQUIRED' });
  if (!payload?.descricaoObjetivo?.trim()) errors.push({ field: 'descricaoObjetivo', code: 'REQUIRED' });
  if (!payload?.gerenciaId) errors.push({ field: 'gerenciaId', code: 'REQUIRED' });
  if (!payload?.comunidadeId) errors.push({ field: 'comunidadeId', code: 'REQUIRED' });
  if (!payload?.responsavel?.trim()) errors.push({ field: 'responsavel', code: 'REQUIRED' });

  if (payload?.linkOperacional) {
    try {
      new URL(payload.linkOperacional);
    } catch {
      errors.push({ field: 'linkOperacional', code: 'INVALID_URL' });
    }
  }

  if (errors.length) {
    const error = new Error('VALIDATION_ERROR');
    error.details = errors;
    throw error;
  }

  return payload;
}
