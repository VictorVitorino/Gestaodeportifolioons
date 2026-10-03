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

test('priorização: nota por eixo, quadrante, classe e pesos', () => {
  const GP = carregar(), M = GP.modelo;
  const p = GP.projetos.criar(base).projeto;
  GP.projetos.avaliar(p.id, { V1:3, V2:2, V3:3, V4:1, V5:3, V6:0, C1:2, C2:1, C3:1 });
  const s = M.pontuar(p);
  // valor = 25 + 20·2/3 + 20 + 15/3 + 10 + 0 = 73,33 ; esforço = 40·2/3 + 35/3 + 25/3 = 46,67
  assert.ok(Math.abs(s.valor - 73.333) < 0.01, String(s.valor));
  assert.ok(Math.abs(s.esforco - 46.667) < 0.01, String(s.esforco));
  assert.equal(s.quadrante, 'rapido'); assert.equal(s.classe, 'A');
  GP.projetos.avaliar(p.id, { V1:0 });
  assert.equal(M.pontuar(p).completo, false); assert.equal(M.pontuar(p).faltam, 8);
  // mudar pesos muda a nota
  const crit = M.CRITERIOS_PADRAO.map(c => ({ ...c, peso: c.id === 'V1' ? 50 : c.id === 'V6' ? 0 : c.eixo === 'valor' ? 12.5 : c.peso }));
  GP.projetos.avaliar(p.id, { V1:3, V2:0, V3:0, V4:0, V5:0, V6:3, C1:0, C2:0, C3:0 });
  assert.equal(M.pontuar(p, crit).valor, 50);
  assert.equal(M.pontuar(p).valor, 35);
});

test('ranking: obrigatórios no topo, ordem por valor e desempate por esforço', () => {
  const GP = carregar(), M = GP.modelo;
  const mk = (t, ob, r) => { const p = GP.projetos.criar({ ...base, titulo: t, obrigatorio: ob }).projeto; GP.projetos.avaliar(p.id, r); return p; };
  const a = mk('Projeto A', false, { V1:0, V2:3, V3:3, V4:3, V5:3, V6:3, C1:3, C2:3, C3:3 });
  const b = mk('Projeto B', true,  { V1:3, V2:0, V3:0, V4:0, V5:0, V6:0, C1:0, C2:0, C3:0 });
  const c = mk('Projeto C', false, { V1:0, V2:3, V3:3, V4:3, V5:3, V6:3, C1:0, C2:0, C3:0 });
  mk('Projeto D', false, { V1:1 });
  const rk = M.ranking(GP.projetos.todos());
  assert.deepEqual([...rk.map(x => x.p.titulo)], ['Projeto B', 'Projeto C', 'Projeto A']);
  assert.deepEqual([...M.ranking(GP.projetos.todos(), { obrigatoriosNoTopo:false }).map(x => x.p.titulo)], ['Projeto C', 'Projeto A', 'Projeto B']);
});

test('exemplos: avaliações geram ranking coerente', () => {
  const GP = carregar(), M = GP.modelo; M.carregarExemplos();
  const rk = M.ranking(GP.projetos.todos().filter(p => p.etapa === 'aprovado'));
  assert.equal(rk.length, 5);
  assert.match(rk[0].p.titulo, /requisito regulatório/);   // obrigatório
  assert.match(rk[1].p.titulo, /Base única/);              // 60
  assert.match(rk.at(-1).p.titulo, /chuva-vazão/);         // empata com automação em 41,7, perde no esforço
});

test('carteira: reserva, execução comprometida, encaixe por ranking e decisões manuais', () => {
  const GP = carregar(), M = GP.modelo; M.carregarExemplos();
  const cap = { fte: 10, reservaPct: 15, orcamento: 4000000, descontarExecucao: true };
  const c = M.montarCarteira(GP.projetos.todos(), cap);
  assert.equal(c.efetiva, 8.5); assert.equal(c.comprometido, 6.5); assert.equal(c.livre, 2);
  // ranking aprovados: PRJ-002 (2,0 FTE) cabe; PRJ-013 (2,5) não; PRJ-003 (1,5) não (2+1,5>2)...
  assert.deepEqual([...c.dentro.map(i => i.p.codigo)], ['PRJ-002']);
  assert.equal(c.itens.find(i => i.p.codigo === 'PRJ-013').status, 'nao_cabe');
  const sem = M.montarCarteira(GP.projetos.todos(), { ...cap, descontarExecucao: false });
  assert.equal(sem.livre, 8.5);
  assert.deepEqual([...sem.dentro.map(i => i.p.codigo)], ['PRJ-002', 'PRJ-013', 'PRJ-003', 'PRJ-004']);   // 2+2,5+1,5+1 = 7; PRJ-014 (2) estoura 8,5
  const id002 = GP.projetos.todos().find(p => p.codigo === 'PRJ-002').id, id014 = GP.projetos.todos().find(p => p.codigo === 'PRJ-014').id;
  const f = M.montarCarteira(GP.projetos.todos(), { ...cap, descontarExecucao: false }, { [id002]: 'out', [id014]: 'in' });
  assert.equal(f.itens.find(i => i.p.id === id002).status, 'excluido');
  assert.equal(f.itens[0].p.id, id014); assert.equal(f.itens[0].status, 'fixado');
  // orçamento como restrição
  const o = M.montarCarteira(GP.projetos.todos(), { ...cap, descontarExecucao: false, orcamento: 1000000 });
  assert.deepEqual([...o.dentro.map(i => i.p.codigo)], ['PRJ-002', 'PRJ-004']);   // 650 mil + 250 mil
});

test('demanda mensal de pessoas', () => {
  const GP = carregar(), M = GP.modelo;
  const lista = [{ inicioPrevisto: '2027-01-10', fimPrevisto: '2027-03-31', esforcoFte: 2 }, { inicioPrevisto: '2027-03-01', fimPrevisto: '2027-04-30', esforcoFte: 1 }];
  assert.deepEqual([...M.demandaMensal(lista, '2027-01', '2027-05').map(x => x.fte)], [2, 2, 3, 1, 0]);
});
