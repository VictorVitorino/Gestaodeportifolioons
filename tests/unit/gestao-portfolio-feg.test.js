// Testes do modelo do sistema Gestão de Portfólio FEG (labs/gestao-portfolio-feg).
// Carrega os scripts clássicos num contexto vm com stubs mínimos de navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function carregar(){
  const store = {};
  const noop = () => {};
  const ctx = { console, Intl, Date, Math, JSON, URL, setTimeout, clearTimeout, CustomEvent: class { constructor(t){ this.type = t; } },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, clear: () => {} },
    document: { addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    location: { hash: '' } };
  ctx.window = ctx; ctx.window.addEventListener = noop; ctx.window.dispatchEvent = noop;
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

test('carteira: reserva, execução no período, encaixe mês a mês pelo ranking e decisões manuais', () => {
  const GP = carregar(), M = GP.modelo; M.carregarExemplos();
  const cap = { periodoIni: '2027-01', periodoFim: '2027-12', fte: 10, reservaPct: 15, orcamento: 4000000, descontarExecucao: true };
  const c = M.montarCarteira(GP.projetos.todos(), cap);
  // PRJ-001 e PRJ-006 terminam em dez/2026 e não ocupam 2027; só PRJ-008 (1,5 FTE até abr/2027) entra no pico
  assert.equal(c.efetiva, 8.5); assert.equal(c.comprometido, 1.5); assert.equal(c.livre, 7);
  // mês a mês: PRJ-002, PRJ-013, PRJ-003 e PRJ-004 cabem (mar/2027 = 8,5); PRJ-014 levaria abr/2027 a 10,5
  assert.deepEqual([...c.dentro.map(i => i.p.codigo)], ['PRJ-002', 'PRJ-013', 'PRJ-003', 'PRJ-004']);
  const i14 = c.itens.find(i => i.p.codigo === 'PRJ-014');
  assert.equal(i14.status, 'cabe_a_partir'); assert.equal(i14.aPartir, '2027-07'); assert.equal(i14.falta.valor, 2);
  assert.equal(c.pico.total, 8.5); assert.equal(c.sobraFte, 0);
  const sem = M.montarCarteira(GP.projetos.todos(), { ...cap, descontarExecucao: false });
  assert.equal(sem.livre, 8.5);
  assert.deepEqual([...sem.dentro.map(i => i.p.codigo)], ['PRJ-002', 'PRJ-013', 'PRJ-003', 'PRJ-004']);   // abr/2027 com PRJ-014: 9 > 8,5
  const id = cod => GP.projetos.todos().find(p => p.codigo === cod).id;
  const f = M.montarCarteira(GP.projetos.todos(), { ...cap, descontarExecucao: false }, { [id('PRJ-002')]: 'out', [id('PRJ-014')]: 'in' });
  assert.equal(f.itens.find(i => i.p.id === id('PRJ-002')).status, 'excluido');
  assert.equal(f.itens[0].p.id, id('PRJ-014')); assert.equal(f.itens[0].status, 'fixado');
  // fixações que tiram um obrigatório da carteira
  const d = M.montarCarteira(GP.projetos.todos(), { ...cap, fte: 8 }, { [id('PRJ-013')]: 'in', [id('PRJ-014')]: 'in' });
  assert.equal(d.itens.find(i => i.p.codigo === 'PRJ-002').status, 'obrigatorio_deslocado');
  assert.deepEqual([...d.deslocados.map(i => i.p.codigo)], ['PRJ-002']);
  // fixado que estoura: pico acima da capacidade efetiva
  const e = M.montarCarteira(GP.projetos.todos(), { ...cap, fte: 6 }, { [id('PRJ-013')]: 'in', [id('PRJ-014')]: 'in' });
  assert.equal(e.itens.find(i => i.p.codigo === 'PRJ-014').status, 'fixado_estoura'); assert.ok(e.sobraFte < 0);
  // fixado que estoura está na carteira, mas não conta como "cabe"
  assert.equal(e.cabem, 1); assert.equal(e.estouram, 1); assert.equal(e.dentro.length, 2);
  // orçamento como restrição
  const o = M.montarCarteira(GP.projetos.todos(), { ...cap, descontarExecucao: false, orcamento: 1000000 });
  assert.deepEqual([...o.dentro.map(i => i.p.codigo)], ['PRJ-002', 'PRJ-004']);   // 650 mil + 250 mil
  assert.equal(o.restricao, 'orcamento');
  // projeto inteiramente fora do período não ocupa capacidade
  const y = M.montarCarteira(GP.projetos.todos(), { ...cap, periodoIni: '2029-01', periodoFim: '2029-12' });
  assert.equal(y.cabem, 0); assert.ok(y.itens.every(i => i.status === 'fora_periodo'));
});

test('carteira: uma só base para pico, livre, quem aguarda e demanda planejada', () => {
  const GP = carregar(), M = GP.modelo; M.carregarExemplos();
  const cap = { periodoIni: '2027-01', periodoFim: '2027-12', fte: 10, reservaPct: 15, orcamento: 4000000, descontarExecucao: true };
  const c = M.montarCarteira(GP.projetos.todos(), cap);
  // livre e comprometido são do mesmo mês do pico da carteira selecionada: livre − usado = sobra
  assert.equal(c.pico.mes, '2027-03'); assert.equal(c.comprometido, c.pico.execucao); assert.equal(c.livre - c.usadoFte, c.sobraFte);
  // "se todos começarem como planejado": PRJ-014 (aguardando) levaria abr/2027 a 10,5; a carteira selecionada fica em 8,5
  assert.equal(c.picoPlanejado.mes, '2027-04'); assert.equal(c.picoPlanejado.total, 10.5);
  const abr = c.demanda.find(d => d.mes === '2027-04'); assert.equal(abr.total, 8.5); assert.equal(abr.aguardando, 2); assert.equal(abr.planejada, 10.5);
  // roadmap/painel: dentro do período, os mesmos números; fora dele, as datas dos mesmos projetos
  const dm = M.demandaCarteira(GP.projetos.todos(), c, '2026-11', '2027-04');
  assert.deepEqual([...dm.map(x => x.total)], [6.5, 6.5, 6, 7.5, 8.5, 8.5]);
  assert.equal(dm[5].planejada, 10.5); assert.equal(dm[0].noPeriodo, false); assert.equal(dm[5].noPeriodo, true);
  // período jul/2026 a jun/2027: o KPI de pessoas livres usa o mês de pico (mar/2027), com o mês mais apertado como ressalva
  const j = M.montarCarteira(GP.projetos.todos(), { ...cap, periodoIni: '2026-07', periodoFim: '2027-06' });
  assert.equal(j.pico.mes, '2027-03'); assert.equal(j.livre, 7); assert.equal(j.usadoFte, 7);
  assert.equal(j.execucaoMax, 6.5); assert.equal(j.folgaMin.valor, 2); assert.equal(j.folgaMin.de, '2026-07'); assert.equal(j.folgaMin.ate, '2026-12');
  // projeto em execução sem datas: o pulado (PRJ-003) é medido contra a carteira final e o acumulado de quem entra só cresce
  GP.projetos.criar({ ...base, titulo: 'Projeto X', esforcoFte: 1.5 }); GP.projetos.todos().find(p => p.titulo === 'Projeto X').etapa = 'execucao';
  const x = M.montarCarteira(GP.projetos.todos(), cap);
  assert.deepEqual([...x.dentro.map(i => i.p.codigo)], ['PRJ-002', 'PRJ-013', 'PRJ-004']);
  const ac = x.dentro.map(i => i.acumFte); assert.ok(ac.every((v, i) => !i || v >= ac[i - 1]));
  const p3 = x.itens.find(i => i.p.codigo === 'PRJ-003');
  assert.equal(p3.status, 'cabe_a_partir'); assert.equal(p3.acumFte, 10); assert.equal(p3.falta.valor, 1.5); assert.equal(p3.falta.mes, '2027-03'); assert.equal(p3.aPartir, '2027-05');
  assert.equal(x.semDatas.length, 1);
});

test('capacidade: período antigo em texto migra sem erro', () => {
  const GP = carregar(), M = GP.modelo;
  const a = M.migrar({ capacidade: { periodo: '2027', fte: 10 } }).capacidade;
  assert.equal(a.periodoIni, '2027-01'); assert.equal(a.periodoFim, '2027-12'); assert.equal(a.periodo, '2027');
  const b = M.migrar({ capacidade: { periodo: 'próximo ciclo' } }).capacidade;
  assert.equal(b.periodoIni, new Date().getFullYear() + '-01');
  const c = M.migrar({ capacidade: { periodoIni: '2026-07', periodoFim: '2027-06' } }).capacidade;
  assert.equal(c.periodo, 'jul/2026 a jun/2027');
  assert.equal(M.montarCarteira([], { periodo: '2027' }).periodo.ini, '2027-01');
});

test('demanda mensal de pessoas', () => {
  const GP = carregar(), M = GP.modelo;
  const lista = [{ inicioPrevisto: '2027-01-10', fimPrevisto: '2027-03-31', esforcoFte: 2 }, { inicioPrevisto: '2027-03-01', fimPrevisto: '2027-04-30', esforcoFte: 1 }];
  assert.deepEqual([...M.demandaMensal(lista, '2027-01', '2027-05').map(x => x.fte)], [2, 2, 3, 1, 0]);
  assert.equal(M.demandaMensal(lista, '2027-01', '2032-12').length, 72);       // sem corte em 61 meses
  assert.equal(M.demandaMensal(lista, '2027-01', '2032-12', 24).length, 24);   // limite explícito (janela do roadmap)
});
