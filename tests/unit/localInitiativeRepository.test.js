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
  assert.equal(created.rowVersion, 1);

  const loaded = await repo.findById(created.id);
  assert.equal(loaded.titulo, payload.titulo);

  const archived = await repo.archive(created.id, loaded.rowVersion);
  assert.equal(archived.ativo, false);
  assert.equal(archived.rowVersion, 2);
});

test('rejects stale optimistic update', async () => {
  const repo = new LocalInitiativeRepository(createMemoryStorage());
  const created = await repo.create(payload);
  const updated = await repo.update(created.id, { titulo: 'Nova versão' }, created.rowVersion);
  assert.equal(updated.rowVersion, 2);

  await assert.rejects(
    () => repo.update(created.id, { titulo: 'Versão antiga' }, created.rowVersion),
    /CONFLICT/
  );
});
