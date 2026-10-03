// Testes do modelo do sistema Gestão de Portfólio FEG (labs/gestao-portfolio-feg).
// Carrega os scripts clássicos num contexto vm com stubs mínimos de navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function carregar(){
  const store = {};
  const noop = () => {};
  const ctx = { console, Intl, Date, Math, JSON, URL, setTimeout, clearTimeout,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, clear: () => {} },
    document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    location: { hash: '' } };
  ctx.window = ctx; ctx.window.addEventListener = noop;
  vm.createContext(ctx);
  const base = new URL('../../labs/gestao-portfolio-feg/src/', import.meta.url);
  for(const f of ['core.js', 'modelo.js']) vm.runInContext(readFileSync(new URL(f, base), 'utf8'), ctx, { filename: f });
  ctx.GP.resetState(ctx.GP.modelo.estadoInicial());
  return ctx.GP;
}
const base = { titulo: 'Projeto teste', descricao: 'd', gerencia: 'FEG', demandante: 'x', tipo: 'Projeto' };

test('validação: obrigatórios, link, datas e título duplicado', () => {
  const GP = carregar();
  const e = GP.modelo.validar({});
  for(const k of ['titulo', 'descricao', 'gerencia', 'demandante', 'tipo']) assert.ok(e[k], k);
  assert.ok(GP.modelo.validar({ ...base, link: 'abc' }).link);
  assert.ok(GP.modelo.validar({ ...base, inicioPrevisto: '2027-02-01', fimPrevisto: '2027-01-01' }).fimPrevisto);
  assert.equal(GP.projetos.criar(base).ok, true);
  assert.ok(GP.projetos.criar({ ...base, titulo: 'PROJETO TESTE' }).erros.titulo);
});

test('cadastro gera código sequencial, histórico e etapa inicial', () => {
  const GP = carregar();
  const a = GP.projetos.criar(base).projeto, b = GP.projetos.criar({ ...base, titulo: 'Outro projeto' }).projeto;
  assert.equal(a.codigo, 'PRJ-001'); assert.equal(b.codigo, 'PRJ-002');
  assert.equal(a.etapa, 'entrada'); assert.equal(a.historico.length, 1);
  GP.projetos.atualizar(a.id, { titulo: 'Projeto teste alterado' });
  assert.match(a.historico.at(-1).detalhe, /Título/);
});

test('checklist de entrada: barreira, falta de informação, entra e incompleto', () => {
  const GP = carregar(), M = GP.modelo;
  const sim = Object.fromEntries(M.ENTRADA.map(q => [q.id, 'sim']));
  assert.equal(M.avaliarEntrada(sim).resultado, 'entra');
  assert.equal(M.avaliarEntrada({ ...sim, E2: 'nao' }).resultado, 'nao_entra');
  assert.equal(M.avaliarEntrada({ ...sim, E2: 'nao', E5: 'nao' }).resultado, 'nao_entra');
  assert.equal(M.avaliarEntrada({ ...sim, E5: 'nao' }).resultado, 'falta_info');
  assert.equal(M.avaliarEntrada({ E1: 'sim' }).resultado, 'incompleto');
  assert.equal(M.avaliarEntrada({ E1: 'nao' }).resultado, 'nao_entra');   // barreira já decide
});

test('registrar entrada move a etapa e registra motivo', () => {
  const GP = carregar(), M = GP.modelo;
  const p = GP.projetos.criar(base).projeto, sim = Object.fromEntries(M.ENTRADA.map(q => [q.id, 'sim']));
  GP.projetos.registrarEntrada(p.id, { ...sim, E6: 'nao' }); assert.equal(p.etapa, 'triagem');
  GP.projetos.registrarEntrada(p.id, sim); assert.equal(p.etapa, 'aprovado');
  GP.projetos.registrarEntrada(p.id, { ...sim, E1: 'nao' }); assert.equal(p.etapa, 'nao_entra');
  assert.match(p.historico.at(-1).detalhe, /rotina/);
  assert.equal(GP.projetos.registrarEntrada(p.id, {}).ok, false);
});

test('exemplos: 14 projetos coerentes e sem duplicar', () => {
  const GP = carregar();
  assert.equal(GP.modelo.carregarExemplos(), 14);
  assert.equal(GP.modelo.carregarExemplos(), 0);
  const ps = GP.projetos.todos();
  for(const p of ps.filter(p => ['aprovado', 'execucao', 'concluido', 'espera'].includes(p.etapa))) assert.equal(p.entrada.resultado, 'entra', p.codigo);
  assert.equal(ps.find(p => p.etapa === 'nao_entra').entrada.resultado, 'nao_entra');
  assert.equal(ps.find(p => p.etapa === 'triagem').entrada.resultado, 'falta_info');
});
