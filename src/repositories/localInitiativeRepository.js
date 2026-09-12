import { InitiativeRepository } from './initiativeRepository.js';

const STORAGE_KEY = 'portfolio_fe_initiatives';

function readStore(storage = globalThis.localStorage) {
  if (!storage) return [];
  try {
    return JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeStore(items, storage = globalThis.localStorage) {
  if (!storage) throw new Error('LOCAL_STORAGE_UNAVAILABLE');
  storage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export class LocalInitiativeRepository extends InitiativeRepository {
  constructor(storage = globalThis.localStorage) {
    super();
    this.storage = storage;
  }

  async findAll(filters = {}) {
    let items = readStore(this.storage);
    if (filters.gerenciaId) items = items.filter(i => i.gerenciaId === filters.gerenciaId);
    if (filters.comunidadeId) items = items.filter(i => i.comunidadeId === filters.comunidadeId);
    if (filters.statusId) items = items.filter(i => i.statusId === filters.statusId);
    if (filters.ativo !== undefined) items = items.filter(i => i.ativo === filters.ativo);
    return items;
  }

  async findById(id) {
    return readStore(this.storage).find(i => i.id === id) ?? null;
  }

  async create(data) {
    const items = readStore(this.storage);
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      ativo: data.ativo ?? true,
      createdAt: now,
      updatedAt: now
    };
    items.push(item);
    writeStore(items, this.storage);
    return item;
  }

  async update(id, data, expectedVersion) {
    const items = readStore(this.storage);
    const index = items.findIndex(i => i.id === id);
    if (index < 0) throw new Error('REFERENCE_NOT_FOUND');
    if (expectedVersion && items[index].updatedAt !== expectedVersion) throw new Error('CONFLICT');
    items[index] = { ...items[index], ...data, id, updatedAt: new Date().toISOString() };
    writeStore(items, this.storage);
    return items[index];
  }

  async archive(id) {
    return this.update(id, { ativo: false });
  }
}
