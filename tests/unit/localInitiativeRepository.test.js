import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalInitiativeRepository } from '../../src/repositories/localInitiativeRepository.js';

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

const payload = {
  titulo: 'Iniciativa QA',
  descricaoObjetivo: 'Teste de persistência local',
  gerenciaId: 'g1',
  comunidadeId: 'c1',
  responsavel: 'QA'
};

test('creates, reads and archives an initiative', async () => {
  const repo = new LocalInitiativeRepository(createMemoryStorage());
  const created = await repo.create(payload);
  assert.ok(created.id);

  const loaded = await repo.findById(created.id);
  assert.equal(loaded.titulo, payload.titulo);

  const archived = await repo.archive(created.id);
  assert.equal(archived.ativo, false);
});

test('rejects stale optimistic update', async () => {
  const repo = new LocalInitiativeRepository(createMemoryStorage());
  const created = await repo.create(payload);
  await repo.update(created.id, { titulo: 'Nova versão' }, created.updatedAt);

  await assert.rejects(
    () => repo.update(created.id, { titulo: 'Versão antiga' }, created.updatedAt),
    /CONFLICT/
  );
});
