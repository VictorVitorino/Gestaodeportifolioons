import { InitiativeRepository } from './initiativeRepository.js';
import { initiativeDbToDomain, initiativeDomainToDb } from '../mappers/initiativeMapper.js';

export class SupabaseInitiativeRepository extends InitiativeRepository {
  constructor(client) {
    super();
    this.client = client;
  }

  async findAll(filters = {}) {
    let query = this.client.from('iniciativas').select('*');
    if (filters.gerenciaId) query = query.eq('gerencia_id', filters.gerenciaId);
    if (filters.comunidadeId) query = query.eq('comunidade_id', filters.comunidadeId);
    if (filters.statusId) query = query.eq('status_id', filters.statusId);
    if (filters.ativo !== undefined) query = query.eq('ativo', filters.ativo);

    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) throw new Error(error.code || 'PERSISTENCE_ERROR');
    return (data || []).map(initiativeDbToDomain);
  }

  async findById(id) {
    const { data, error } = await this.client
      .from('iniciativas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.code || 'PERSISTENCE_ERROR');
    return initiativeDbToDomain(data);
  }

  async create(model) {
    const payload = initiativeDomainToDb(model);
    const { data, error } = await this.client
      .from('iniciativas')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(error.code || 'PERSISTENCE_ERROR');
    return initiativeDbToDomain(data);
  }

  async update(id, model, expectedVersion) {
    let query = this.client
      .from('iniciativas')
      .update(initiativeDomainToDb(model))
      .eq('id', id);

    if (expectedVersion) query = query.eq('updated_at', expectedVersion);

    const { data, error } = await query.select('*');
    if (error) throw new Error(error.code || 'PERSISTENCE_ERROR');
    if (!data || data.length === 0) throw new Error('CONFLICT');
    return initiativeDbToDomain(data[0]);
  }

  async archive(id) {
    const { error } = await this.client.rpc('archive_initiative', { p_iniciativa_id: id });
    if (error) throw new Error(error.message || error.code || 'PERSISTENCE_ERROR');
    return this.findById(id);
  }
}
