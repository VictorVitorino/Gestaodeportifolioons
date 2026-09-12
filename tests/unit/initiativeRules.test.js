import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInitiativePayload } from '../../src/rules/initiativeRules.js';

const valid = {
  titulo: 'Iniciativa teste',
  descricaoObjetivo: 'Objetivo controlado de QA',
  gerenciaId: 'g1',
  comunidadeId: 'c1',
  responsavel: 'Usuário Teste'
};

test('accepts a valid initiative payload', () => {
  assert.equal(validateInitiativePayload(valid), valid);
});

test('rejects required fields', () => {
  assert.throws(() => validateInitiativePayload({}), /VALIDATION_ERROR/);
});

test('rejects invalid operational URL', () => {
  assert.throws(() => validateInitiativePayload({ ...valid, linkOperacional: 'not-a-url' }), /VALIDATION_ERROR/);
});
