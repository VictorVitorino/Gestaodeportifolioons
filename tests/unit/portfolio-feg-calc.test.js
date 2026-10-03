// Portfólio FEG — testes de dados e cálculo (substitui o "autoteste" da especificação; CONTRATO D3).
// Carrega os scripts clássicos de labs/portfolio-feg/src em node:vm, num contexto { window:{ PF:{} } },
// e confere os gabaritos de docs/portfolio-feg-niveis.md (§4.20, §5.3–5.5, §6.5–6.7, §7.4–7.6) sobre PF.base.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = new URL('../../labs/portfolio-feg/src/', import.meta.url);
const noop = () => {};
function carregar(arquivos = ['data.js', 'calc.js']) {
  const ctx = vm.createContext({
    window: { PF: {}, addEventListener: noop },
    document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] },
    console,
  });
  for (const f of arquivos) vm.runInContext(readFileSync(new URL(f, SRC), 'utf8'), ctx, { filename: f });
  return ctx.window.PF;
}
const PF = carregar();
const C = PF.calc;
const B = PF.base;
const plain = (x) => JSON.parse(JSON.stringify(x));
const sorted = (arr) => plain(arr).slice().sort();
// Objetos criados no contexto vm têm outro Array.prototype: compara sempre a forma JSON.
const eq = (obtido, esperado, msg) => assert.deepEqual(plain(obtido), plain(esperado), msg);
const near = (obtido, esperado, tol = 0.005, rotulo = '') =>
  assert.ok(obtido != null && Math.abs(obtido - esperado) <= tol + 1e-12, `${rotulo}: esperado ${esperado} ± ${tol}, obtido ${obtido}`);
const pct = (obtido, esperadoPct, tolPp = 0.1, rotulo = '') => near(obtido * 100, esperadoPct, tolPp, rotulo);
const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
const variante = (fn) => C.comAlteracao(B, fn);
const iniV = (x, id) => x.iniciativas.find((i) => i.id === id);

/* =============================================================== §9 bloco Dados */
test('dados: composição, catálogo e hierarquia (§4.4, §4.6)', () => {
  assert.equal(B.versao, 1);
  assert.equal(B.dataReferencia, '2026-10-03');
  assert.equal(B.iniciativas.length, 22);
  assert.equal(B.gerencias.length, 4);
  assert.equal(B.comunidades.length, 10);
  assert.equal(B.squads.length, 13);
  assert.equal(B.ferramentas.length, 16);
  const porFase = {};
  B.iniciativas.forEach((i) => { porFase[i.statusId] = (porFase[i.statusId] || 0) + 1; });
  eq(plain(porFase), { EM_EXECUCAO: 6, EM_ANALISE: 8, DEMANDA: 5, ENCERRADA: 1, EM_ESPERA: 1, CANCELADA: 1 });
  assert.equal(B.iniciativas.find((i) => i.id === 'X01').ativo, false);
  assert.equal(C.ativas(B).length, 21);
  for (const i of B.iniciativas) {
    assert.ok(i.titulo.endsWith('(fictício)'), `título de ${i.id}`);
    assert.equal(i.rowVersion, 1);
    assert.equal(i.origemDado, 'TRILHA_FEG_FICTICIO');
    assert.match(i.linkOperacional, /^https:\/\/(ado|itsm)\.exemplo\.invalid\//);
    const com = B.comunidades.find((c) => c.id === i.comunidadeId);
    assert.ok(com && com.gerenciaId === i.gerenciaId, `hierarquia gerência/comunidade de ${i.id}`);
    if (i.squadId) assert.equal(B.squads.find((s) => s.id === i.squadId).comunidadeId, i.comunidadeId, `squad de ${i.id}`);
    if (i.ferramentaId) assert.ok(B.ferramentas.some((f) => f.id === i.ferramentaId), `ferramenta de ${i.id}`);
    for (const k of ['dataEntrada', 'dataPlanejada', 'dataPrevistaAtual', 'faseDesde']) if (i[k] != null) assert.match(i[k], /^\d{4}-\d{2}-\d{2}$/, `${k} de ${i.id}`);
    for (const k of ['titulo', 'descricaoObjetivo', 'gerenciaId', 'comunidadeId', 'responsavel']) assert.ok(String(i[k] || '').trim(), `${k} de ${i.id} (R10a)`);
  }
  assert.equal(B.squads.filter((s) => B.comunidades.find((c) => c.id === s.comunidadeId).tipo === 'ENTREGA').length, 13);
  eq(sorted(B.comunidades.filter((c) => c.gerenciaId === 'FEG').map((c) => c.id)), ['ACO', 'PEL', 'PEN', 'PLA']);
  eq(plain(B.pendencias), []);
});

test('dados: todo registro é ilustrativo; regras R01…R43 com uma origem válida e nenhum FONTE_ONS (§2, §4.3)', () => {
  const colecoes = Object.keys(B).filter((k) => Array.isArray(B[k]) && k !== 'pendencias');
  assert.ok(colecoes.length >= 25);
  for (const k of colecoes) for (const r of B[k]) {
    assert.equal(r.ilustrativo, true, `${k}/${r.id} ilustrativo`);
    assert.equal(r.origemDado, 'TRILHA_FEG_FICTICIO', `${k}/${r.id} origemDado`);
  }
  const codigos = ['R01', 'R02', 'R03', 'R04', 'R05a', 'R05b', 'R06', 'R07', 'R08', 'R09', 'R10a', 'R10b',
    ...Array.from({ length: 25 }, (_, k) => 'R' + (11 + k)), 'R36a', 'R36b', 'R37', 'R38', 'R39', 'R40', 'R41', 'R42', 'R43'];
  eq(B.regras.map((r) => r.codigo), codigos);
  const ORIGENS = ['FONTE_ONS', 'DECISAO_FUNCIONAL_PRODUTO', 'A_VALIDAR_FEG'];
  const TIPOS = ['DOCUMENTO_ONS_APROVADO', 'PROPOSTA_CONSULTORIA', 'COMENTARIO_REVISAO', 'ARTEFATO_INTERNO', 'REPOSITORIO', 'REF_MERCADO', 'PREMISSA_ILUSTRATIVA'];
  for (const r of B.regras) {
    assert.ok(ORIGENS.includes(r.origemRegra) && r.origemRegra !== 'FONTE_ONS', `origem de ${r.codigo}`);
    assert.ok(TIPOS.includes(r.tipoFonte) && r.tipoFonte !== 'DOCUMENTO_ONS_APROVADO', `tipoFonte de ${r.codigo}`);
    assert.ok(String(r.referencia || '').trim(), `referência de ${r.codigo}`);
    assert.equal(r.statusValidacao, 'A_VALIDAR');
    assert.equal(r.versao, 1);
    assert.equal(r.vigente, true);
    assert.ok(r.valor !== undefined, `valor de ${r.codigo}`);
  }
  for (const [k, v] of Object.entries(B.catalogos)) if (Array.isArray(v)) for (const x of v) if (x && typeof x === 'object') assert.equal(x.ilustrativo, true, `catalogos.${k}`);
  // §2.2 regra 1: contradição entre fontes → A_VALIDAR_FEG mostrando as duas fontes (o badge depende do core ler `contradicao`)
  for (const c of ['R05b', 'R33']) { const r = C.regra(B, c); assert.equal(r.origemRegra, 'A_VALIDAR_FEG'); assert.equal(r.contradicao, true, `${c} contradição`); assert.match(r.referencia, /Contradição entre fontes/); }
  assert.match(C.regra(B, 'R17').referencia, /^Deck A&M Etapa 3 v25, s143/, 'R17: T4/T5 vêm do s143');
  assert.equal(C.regra(B, 'R07').marca, 'ILUSTRATIVO'); assert.equal(C.regra(B, 'R24').marca, 'ILUSTRATIVO');
  const editaveis = B.regras.filter((r) => r.editavel).map((r) => r.codigo);
  eq(editaveis, ['R13', 'R15', 'R16', 'R20', 'R22', 'R26', 'R27', 'R28', 'R29', 'R32']);
  eq(plain(C.regra(B, 'R43').valor), editaveis);
  const w = C.param(B, 'R20');
  near(Object.values(w).reduce((a, b) => a + b, 0), 1, 1e-9, 'pesos v1 somam 100%');
  assert.equal(C.param(B, 'R25'), null);
});

test('dados: capacidade, unidades e financeiro sem fonte (§4.7, §4.8)', () => {
  const g = C.capacidadePorGerencia(B);
  eq(plain(g), { FEL: 1.5, FEN: 3.5, FER: 4, FEG: 1 });
  near(C.capacidadeTotal(B), 10, 1e-9, 'soma por gerência');
  near(Object.values(C.capacidadePorComunidade(B)).reduce((a, b) => a + b, 0), 10, 1e-9, 'soma por comunidade');
  near(C.orcamentoCiclo(B), 4.0, 1e-9, 'orçamento do ciclo');
  eq(plain(C.unidadesIncompativeis(B)).map((x) => [x.iniciativaId, x.unidade, x.codigo]), [['H01', 'HORAS', 'INCOMPATIBLE_UNIT']]);
  eq(plain(C.semFonte(B)).map((x) => [x.iniciativaId, x.codigo]), [['H01', 'SOURCE_REQUIRED']]);
  assert.equal(C.bac(B, 'H01'), null);
});

test('dados: fotografia SN-SET = indicadoresFotografia(estadoEm(base, 04/09)) e hash = PF.hash (§4.12)', () => {
  const sn = B.snapshotsForum.find((s) => s.id === 'SN-SET');
  assert.equal(sn.status, 'FECHADO');
  const calc = C.conteudoFotografia(C.estadoEm(B, '2026-09-04'));
  eq(plain(calc.indicadoresJson), plain(sn.indicadoresJson));
  eq(plain(calc.iniciativasJson), plain(sn.iniciativasJson));
  eq(plain(sn.filtrosJson), { fase: 'EM_EXECUCAO' });
  assert.equal(sn.iniciativasJson.find((x) => x.id === 'E02').sinal, 'AMARELO');
  pct(sn.indicadoresJson.pctOrcamentoVermelho, 21.2, 0.05, 'SN-SET % orçamento em vermelho');
  pct(sn.indicadoresJson.pctVermelhoContagem, 16.7, 0.05, 'SN-SET % por contagem');
  assert.equal(sn.indicadoresJson.riscosAbertos, 4);
  assert.equal(sn.indicadoresJson.dependenciasAbertas, 2);
  assert.equal(sn.indicadoresJson.divergencias, 0);
  near(sn.indicadoresJson.cpiPortfolio, 0.88, 0.005, 'SN-SET CPI');
  const comCore = carregar(['core.js', 'data.js', 'calc.js']);
  const s2 = comCore.base.snapshotsForum[0];
  assert.equal(comCore.hash({ indicadoresJson: s2.indicadoresJson, iniciativasJson: s2.iniciativasJson, decisoesPendentesJson: s2.decisoesPendentesJson, filtrosJson: s2.filtrosJson }), s2.hashConteudo);
  assert.equal(comCore.regra('R13', { base: true }).valor.vermelhoDesvioMeses, 3);
  assert.match(comCore.badge('R26'), /Proposta A&amp;M · s165 · a validar/);
  assert.match(comCore.badge('R30'), /Ref\. mercado/);
  assert.match(comCore.badge('R17'), /Proposta A&amp;M · s143 · a validar/);
  assert.match(comCore.badge('R34'), /Rascunho de revisão/);
  for (const r of comCore.base.regras) assert.doesNotMatch(comCore.badge(r.codigo), /Fonte ONS/, `badge de ${r.codigo}`);
});

/* =============================================================== §4.20 gabarito-resumo */
test('§4.20 sinal calculado, horizontes, métodos e EVM do portfólio', () => {
  const s = Object.fromEntries(C.sinais(B).map((x) => [x.id, x]));
  eq(Object.values(s).map((x) => x.cor), ['VERDE', 'VERMELHO', 'AMARELO', 'VERDE', 'VERMELHO', 'CINZA']);
  assert.equal(s.E02.desvio, 4); near(s.E02.indice, 0.63, 0.005, 'índice E02');
  assert.equal(s.E03.desvio, 1); near(s.E03.indice, 1.0, 0.005, 'índice E03');
  assert.equal(s.E05.desvio, 3); near(s.E05.indice, 0.65, 0.005, 'índice E05');
  assert.match(s.E06.motivo, /sem baseline/);
  assert.equal(s.E02.motivo, 'desvio 4 meses ≥ 3; índice 0,63 < 0,85 → Vermelho');
  const h = C.horizontes(B);
  eq(plain(h.contagem), { VENCIDO: 0, '30_DIAS': 0, '60_DIAS': 1, '90_DIAS': 1, ACIMA_90: 4, SEM_DATA: 0 });
  eq(plain(C.horizonte(B, 'E04')), { faixa: '60_DIAS', dias: 59 });
  eq(plain(C.horizonte(B, 'E01')), { faixa: '90_DIAS', dias: 76 });
  const t = C.horizontes(B, { todasAtivas: true });
  eq(plain(t.contagem), { VENCIDO: 2, '30_DIAS': 0, '60_DIAS': 1, '90_DIAS': 1, ACIMA_90: 4, SEM_DATA: 13 });
  eq(sorted(t.itens.filter((x) => x.faixa === 'VENCIDO').map((x) => x.id)), ['B01', 'H01']);
  eq(sorted(t.itens.filter((x) => x.faixa === 'SEM_DATA').map((x) => x.id)), ['D1', 'D2', 'D3', 'D4', 'D5', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08']);
  eq(plain(C.horizonte(B, '2026-10-03')), { faixa: '30_DIAS', dias: 0 }, 'a própria referência cai em 30 dias');
  // R08: faixas inclusivas nas bordas (30, 60, 90) e VENCIDO no dia anterior à referência
  [['2026-10-02', 'VENCIDO', -1], ['2026-11-02', '30_DIAS', 30], ['2026-11-03', '60_DIAS', 31], ['2026-12-02', '60_DIAS', 60], ['2026-12-03', '90_DIAS', 61],
    ['2027-01-01', '90_DIAS', 90], ['2027-01-02', 'ACIMA_90', 91]].forEach(([dt, f, n]) => eq(plain(C.horizonte(B, dt)), { faixa: f, dias: n }, `horizonte de ${dt}`));
  const m = C.metodos(B);
  eq(plain(m.corte.ids), ['P01', 'P03', 'P06', 'P08']); near(m.corte.valor, 285, 1e-6); near(m.corte.fte, 8, 1e-9);
  eq(plain(m.corte.ordem), ['P01', 'P06', 'P03', 'P08']);
  eq(plain(m.guloso.ordem), ['P01', 'P03', 'P07', 'P06', 'P08']); near(m.guloso.valor, 321.25, 1e-6); near(m.guloso.fte, 9, 1e-9);
  eq(plain(m.otimo.ids), ['P01', 'P03', 'P04', 'P06', 'P08']); near(m.otimo.valor, 331.25, 1e-6); near(m.otimo.fte, 9.5, 1e-9); near(m.otimo.custo, 3.4, 1e-9);
  assert.equal(m.otimo.avaliadas, 256);
  const e = C.evmPortfolio(B);
  near(e.cpi, 0.80, 0.005, 'CPI'); near(e.ev, 3.35, 1e-6); near(e.ac, 4.18, 1e-6);
  near(e.spi, 0.82, 0.005, 'SPI'); near(e.evSpi, 3.14, 1e-6); near(e.pv, 3.82, 1e-6);
  eq(plain(e.foraSpi), ['E06']);
});

/* =============================================================== §5.3 indicadores N1 */
test('§5.3 indicadores I1.1–I1.16', () => {
  const I = C.indicadores(B);
  assert.equal(I['I1.1'].valor, 6);
  eq(plain(I['I1.2'].contagem), { SUSTENTACAO: 2, EVOLUCAO: 2, OBRIGATORIA: 1, INOVACAO: 1 });
  pct(I['I1.2'].pctValor.SUSTENTACAO, 33.3); pct(I['I1.2'].pctValor.EVOLUCAO, 31.8); pct(I['I1.2'].pctValor.OBRIGATORIA, 30.3); pct(I['I1.2'].pctValor.INOVACAO, 4.5);
  pct(I['I1.3'].pct.VERDE, 33.3); pct(I['I1.3'].pct.AMARELO, 16.7); pct(I['I1.3'].pct.VERMELHO, 33.3); pct(I['I1.3'].pct.CINZA, 16.7);
  pct(I['I1.4'].valor, 43.9, 0.05, 'I1.4'); pct(I['I1.4'].porContagem, 33.3, 0.05); near(I['I1.4'].numerador, 2.9, 1e-9); near(I['I1.4'].denominador, 6.6, 1e-9);
  pct(I['I1.5'].valor, 63.3, 0.05, 'I1.5'); near(I['I1.5'].ac, 4.18, 1e-9);
  const ix = I['I1.6'].valor;
  [['E01', 1.12], ['E02', 0.63], ['E03', 1.0], ['E04', 1.13], ['E05', 0.65], ['E06', 1.05]].forEach(([id, v]) => near(ix[id], v, 0.0051, `I1.6 ${id}`));
  eq(plain(I['I1.7'].valores).sort(), [0, 0, 1, 3, 4]); near(I['I1.7'].media, 1.6, 1e-9); assert.equal(I['I1.7'].mediana, 1);
  pct(I['I1.8'].tol0, 40); pct(I['I1.8'].tol1, 60); pct(I['I1.8'].valor, 40);
  pct(I['I1.9'].valor, 83.3); eq(plain(I['I1.9'].sem), ['E04']);
  assert.equal(I['I1.10'].preenchidos, 58); assert.equal(I['I1.10'].total, 60); pct(I['I1.10'].valor, 96.7);
  eq(plain(I['I1.10'].faltas), [{ id: 'E04', campo: 'objetivoEstrategicoId' }, { id: 'E06', campo: 'dataPlanejada' }]);
  assert.equal(I['I1.11'].mediana, 32); eq(plain(I['I1.11'].acima), ['D2', 'D3']);
  pct(I['I1.12'].valor, 20); eq(plain(I['I1.12'].ids), ['E02']); assert.equal(I['I1.12'].total, 5);
  pct(I['I1.13'].valor, 53.0, 0.05); eq(plain(I['I1.13'].ids), ['E03', 'E02']);
  eq(plain(I['I1.14'].valor), { VENCIDO: 0, '30_DIAS': 0, '60_DIAS': 1, '90_DIAS': 1, ACIMA_90: 4, SEM_DATA: 0 });
  assert.equal(I['I1.15'].valor, 5); assert.equal(I['I1.15'].vencidos, 1); assert.equal(I['I1.15'].iniciativas, 4);
  eq(plain(I['I1.15'].ids), ['R1', 'R2', 'R3', 'R4', 'R6']); eq(plain(I['I1.15'].idsVencidos), ['R2']);
  assert.equal(I['I1.16'].valor, 2); eq(plain(I['I1.16'].ids), ['Dep1', 'Dep2']);
  eq(plain(C.dependenciasAbertas(B, { todas: true })).map((x) => x.id), ['Dep1', 'Dep2', 'Dep4'], 'pela regra literal "A CONFIRMAR" também é aberta');
  eq(plain(I['I1.16'].bloqueiosPorVermelha).map((b) => [b.bloqueada, b.por]), [['E02', 'E05']]);
});

/* =============================================================== §5.4–5.5 perguntas e desafio N1 */
test('§5.4 análise N1 (AQ1-01…09) sobre PF.base', () => {
  eq(C.sinais(B).filter((s) => s.cor === 'VERMELHO').map((s) => s.id), ['E02', 'E05']); // AQ1-01
  pct(C.pctOrcamentoVermelho(B).valor, 43.9, 0.5, 'AQ1-02');
  eq(C.sinais(B).filter((s) => s.divergente).map((s) => s.id), ['E02']); // AQ1-03
  const hs = B.historico.find((h) => h.entidadeId === 'E02' && h.campoAlterado === 'ragDeclarado');
  assert.equal(hs.alteradoEm, '2026-09-28'); assert.equal(hs.justificativa, '');
  eq(C.emExecucao(B).filter((i) => C.camposVazios(B, i).length).map((i) => i.id), ['E04', 'E06']); // AQ1-04
  near(C.desvios(B).mediana, 1.0, 0.15, 'AQ1-05');
  eq(C.horizontes(B).itens.filter((h) => ['30_DIAS', '60_DIAS', '90_DIAS'].includes(h.faixa)).map((h) => h.id).sort(), ['E01', 'E04']); // AQ1-06
  assert.equal(C.riscosAbertos(B).length, 5); // AQ1-07
  assert.ok(C.riscoAberto(B, B.riscosImpedimentos.find((r) => r.id === 'R3')) && C.riscoAberto(B, B.riscosImpedimentos.find((r) => r.id === 'R6')));
  eq(C.bloqueios(B).filter((b) => b.porVermelha).map((b) => b.por), ['E05']); // AQ1-08
  const idade = C.idadeDemandas(B);
  eq(plain(idade.acima), ['D2', 'D3']); // AQ1-09
  assert.equal(idade.lista.find((x) => x.id === 'D2').dias, 85);
  assert.equal(idade.lista.find((x) => x.id === 'D3').dias, 63);
});

test('§5.2.6 / DC1-01 triagem: checklist T1–T6, precedência e nota', () => {
  const sug = Object.fromEntries(C.demandas(B).map((i) => [i.id, C.triagemSugerida(B, i)]));
  assert.equal(sug.D1.saida, 'REDIRECIONAR_EXECUCAO'); assert.equal(sug.D1.item, 'T1'); assert.equal(sug.D1.destino, 'ITSM/ADO da CRG-A');
  assert.equal(sug.D2.saida, 'ADMITIR'); assert.equal(sug.D2.observacao, 'evidência pendente');
  assert.equal(sug.D3.saida, 'ENCAMINHAR_EXPLORATORIO'); assert.equal(sug.D3.destino, 'Comunidade Técnica PEN');
  assert.equal(sug.D4.saida, 'ARQUIVAR'); assert.equal(sug.D4.vinculo, 'P03');
  assert.equal(sug.D5.saida, 'DEVOLVER'); eq(plain(sug.D5.faltas), ['T6']);
  const ck = Object.fromEntries(C.checklistTriagem(B, 'D5').map((x) => [x.id, x]));
  assert.ok(ck.T1.ok && ck.T2.ok && ck.T3.ok && ck.T4.ok && ck.T5.ok && !ck.T6.ok);
  assert.equal(ck.T6.campo, 'estimativaInformada');
  assert.ok(C.checklistTriagem(B, 'D2').find((x) => x.id === 'T6').ok, 'estimativa em horas conta como estimativa mínima');
  const gab = { D1: 'REDIRECIONAR_EXECUCAO', D2: 'ADMITIR', D3: 'ENCAMINHAR_EXPLORATORIO', D4: 'ARQUIVAR', D5: 'DEVOLVER' };
  assert.equal(C.avaliarTriagem(B, gab).nota, 5);
  const meio = C.avaliarTriagem(B, Object.assign({}, gab, { D2: 'DEVOLVER' }));
  assert.equal(meio.nota, 4.5); assert.equal(meio.ok, true);
  assert.equal(C.avaliarTriagem(B, Object.assign({}, gab, { D2: 'ARQUIVAR', D5: 'ADMITIR' })).ok, false);
});

test('decisões: vigência e correção como novo registro (DEC-004 → DEC-005)', () => {
  const vig = C.decisoesVigentes(B).map((x) => x.id);
  assert.ok(!vig.includes('DEC-004') && vig.includes('DEC-005'));
  assert.equal(C.decisaoVigente(B, 'E05').id, 'DEC-005');
  assert.equal(C.triagemVigente(B, 'D2'), null);
  const x = variante((v) => {
    v.decisoes.push({ id: 'T1', iniciativaId: 'D2', tipoDecisao: 'DEVOLVER', registradoEm: '2026-10-03T10:00:00Z' });
    v.decisoes.push({ id: 'T2', iniciativaId: 'D2', tipoDecisao: 'CORRECAO_REGISTRO', refDecisaoAnteriorId: 'T1', tipoDecisaoCorrigido: 'DEVOLVER', registradoEm: '2026-10-03T11:00:00Z' });
  });
  assert.equal(C.triagemVigente(x, 'D2'), null, 'triagem corrigida devolve a demanda à fila');
  assert.equal(C.decisoesPorTipo(B).contagem.KILL, 1);
});

test('DC1-02 pauta do fórum de outubro (gestão por exceção)', () => {
  eq(plain(C.avaliarPauta(B, ['E05', 'E02'])), { ok: true, nota: 100, caso: 'EXCECAO' });
  assert.equal(C.avaliarPauta(B, ['E02', 'E06']).nota, 50);
  assert.equal(C.avaliarPauta(B, ['E03', 'E05']).nota, 60);
  assert.ok(C.avaliarPauta(B, ['E01', 'E05']).nota <= 30);
  assert.equal(C.avaliarPauta(B, ['E05']).ok, false);
  assert.equal(C.avaliarPauta(B, []).nota, 0);
});

test('§5.5 desafio N1: cinco contas "e se?" sobre cópia de PF.base', () => {
  const a = variante((x) => { iniV(x, 'E03').dataPrevistaAtual = '2027-06-30'; });
  assert.equal(C.sinal(a, 'E03').cor, 'VERMELHO');
  pct(C.pctOrcamentoVermelho(a).valor, 74.2, 0.5, '(a) E03 também vermelha');
  const b = variante((x) => { x.financeiro.find((f) => f.id === 'FIN-E05').realizado = 1.40; });
  near(C.indice(b, 'E05'), 0.60, 0.02, '(b) índice de E05 com realizado 1,40');
  const c = variante((x) => { const e = iniV(x, 'E02'); e.dataPrevistaAtual = e.dataPlanejada; });
  near(C.desvios(c).mediana, 0, 0.15, '(c) desvio mediano se E02 terminar na baseline');
  const d = variante((x) => { iniV(x, 'E04').objetivoEstrategicoId = 'OE-1'; });
  pct(C.completude(d).pct, 98.3, 0.5, '(d) completude se E04 receber objetivo');
  const e = variante((x) => { x.riscosImpedimentos.find((r) => r.id === 'R3').status = 'RESOLVIDO'; });
  assert.equal(C.riscosAbertos(e).length, 4, '(e) R3 resolvido');
});

/* =============================================================== §4.6.5 / §6.5 indicadores N2 */
test('§4.6.5 notas, S, N, razões, risco e ranking com desempate', () => {
  const rows = Object.fromEntries(C.linhasCandidatas(B).map((r) => [r.id, r]));
  const gab = { P01: [4.45, 86.25, 28.75, 71.9, 15], P02: [2.95, 48.75, 19.50, 54.2, 12], P03: [3.60, 65.00, 65.00, 216.7, 2], P04: [2.85, 46.25, 30.83, 92.5, 8],
    P05: [3.55, 63.75, 15.94, 39.8, 16], P06: [3.80, 70.00, 35.00, 116.7, 6], P07: [2.45, 36.25, 36.25, 145.0, 1], P08: [3.55, 63.75, 31.88, 79.7, 12] };
  for (const [id, [S, N, nf, nc, R]] of Object.entries(gab)) {
    near(rows[id].S, S, 1e-9, `S ${id}`); near(rows[id].N, N, 1e-9, `N ${id}`); near(rows[id].nFte, nf, 0.005, `N/FTE ${id}`); near(rows[id].nCusto, nc, 0.05, `N/R$ ${id}`); assert.equal(rows[id].R, R, `R ${id}`);
  }
  assert.equal(rows.P05.N, rows.P08.N, 'empate exato P05 × P08 depois da reavaliação');
  const rk = C.ranking(B);
  eq(rk.map((r) => r.id), ['P01', 'P06', 'P03', 'P08', 'P05', 'P02', 'P04', 'P07']);
  eq(plain(rk.find((r) => r.id === 'P08').empateTecnicoCom), ['P05']);
  near(C.normalizar(B, C.score({ C1: 3, C2: 4, C3: 3, C4: 4, C5: 3 }, C.pesosEfetivos(B))), 60.0, 1e-9, 'P05 v1 (AV-P05a) N 60,00');
  assert.equal(C.avaliacaoVigente(B, 'P05').id, 'AV-P05b');
  near(C.linhasCandidatas(B).reduce((s, r) => s + r.fte, 0), 17.0, 1e-9, 'demanda total FTE');
  near(C.linhasCandidatas(B).reduce((s, r) => s + r.custo, 0), 6.15, 1e-9, 'demanda total R$');
});

test('§6.5 indicadores I2.5–I2.20 e tabela EVM', () => {
  const I = C.indicadores(B);
  pct(I['I2.5'].pctFte, 170); pct(I['I2.5'].pctCusto, 153.8, 0.05); assert.equal(I['I2.5'].faixa.id, 'TANQUE');
  near(I['I2.6'].fte, 7.0, 1e-9); near(I['I2.6'].custo, 2.8, 1e-9);
  eq(plain(I['I2.7'].valor), { corte: 2, guloso: 1, otimo: 0.5 });
  near(I['I2.8'].valor.corte, 285, 1e-6); near(I['I2.8'].valor.guloso, 321.25, 1e-6); near(I['I2.8'].valor.otimo, 331.25, 1e-6);
  pct(I['I2.9'].valor.corte, 86.0, 0.05); pct(I['I2.9'].valor.guloso, 97.0, 0.05);
  eq(plain(I['I2.10'].valor), { P01: 15, P02: 12, P03: 2, P04: 8, P05: 16, P06: 6, P07: 1, P08: 12 });
  near(I['I2.11'].valor, 11.78, 0.005); near(I['I2.11'].otimo, 10.53, 0.005);
  pct(I['I2.12'].valor, 45.5, 0.05); pct(I['I2.12'].otimo, 35.3, 0.05);
  pct(I['I2.13'].otimo, 30.0, 0.05); pct(I['I2.13'].corte, 50.0, 0.05); pct(I['I2.13'].guloso, 37.2, 0.05);
  pct(I['I2.13'].mixOtimo.SUSTENTACAO, 0); pct(I['I2.13'].mixOtimo.EVOLUCAO, 77.3, 0.05); pct(I['I2.13'].mixOtimo.INOVACAO, 22.7, 0.05);
  eq(plain(I['I2.14'].u), { corte: 0.8, guloso: 0.9, otimo: 0.95 });
  assert.equal(I['I2.14'].valor.corte.id, 'ROADMAP'); assert.equal(I['I2.14'].valor.guloso.id, 'REDUZIR'); assert.equal(I['I2.14'].valor.otimo.id, 'REDUZIR');
  const ev = I['I2.15'].valor;
  const gab = { E01: [0.56, 0.56, 0.50, 1.00, 1.12, 0.71, 0.09, 0.80], E02: [1.05, 0.75, 1.20, 0.71, 0.63, 2.40, -0.90, 2.50], E03: [1.00, 0.90, 0.90, 0.90, 1.00, 2.00, 0.00, 1.00],
    E04: [0.09, 0.09, 0.08, 1.00, 1.13, 0.27, 0.03, 0.95], E05: [1.12, 0.84, 1.30, 0.75, 0.65, 2.17, -0.77, 5.60], E06: [null, 0.21, 0.20, null, 1.05, 0.57, 0.03, 0.98] };
  for (const [id, [pv, evv, ac, spi, cpi, eac, vac, tcpi]] of Object.entries(gab)) {
    const x = ev[id];
    if (pv == null) { assert.equal(x.pv, null); assert.equal(x.spi, null); } else { near(x.pv, pv, 0.005, `PV ${id}`); near(x.spi, spi, 0.0051, `SPI ${id}`); }
    near(x.ev, evv, 0.005, `EV ${id}`); near(x.ac, ac, 1e-9, `AC ${id}`); near(x.cpi, cpi, 0.0051, `CPI ${id}`); near(x.eac, eac, 0.0051, `EAC ${id}`);
    near(x.vac, vac, 0.0051, `VAC ${id}`); near(x.tcpi, tcpi, 0.0051, `TCPI ${id}`);
  }
  near(I['I2.16'].cpi, 0.80, 0.005); near(I['I2.16'].spi, 0.82, 0.005);
  near(I['I2.17'].valor.E02.delta, 0.90, 0.005); pct(I['I2.17'].valor.E02.pct, 60, 0.5);
  near(I['I2.17'].valor.E05.delta, 0.37, 0.005); pct(I['I2.17'].valor.E05.pct, 20, 0.5);
  const diff = I['I2.18'];
  assert.equal(diff.fotografia, 'SN-SET');
  const di = Object.fromEntries(diff.indicadores.map((x) => [x.chave, x]));
  pct(di.pctOrcamentoVermelho.antes, 21.2, 0.05); pct(di.pctOrcamentoVermelho.depois, 43.9, 0.05); pct(di.pctOrcamentoVermelho.delta, 22.7, 0.05);
  eq([di.riscosAbertos.antes, di.riscosAbertos.depois], [4, 5]);
  eq([di.divergencias.antes, di.divergencias.depois], [0, 1]);
  near(di.cpiPortfolio.antes, 0.88, 0.005); near(di.cpiPortfolio.depois, 0.80, 0.005);
  eq(plain(diff.pioraram), ['E02']);
  eq(plain(diff.iniciativas.find((x) => x.id === 'E02')).antes, 'AMARELO');
  assert.equal(I['I2.20'].valor, 6);
});

test('§6.5 métodos de seleção, quadrantes e what-if', () => {
  const m = C.metodos(B);
  eq(plain(m.corteSemDesempate.ids), ['P01', 'P03', 'P05', 'P06']);
  near(m.corteSemDesempate.valor, 285, 1e-6); near(m.corteSemDesempate.fte, 10, 1e-9); near(m.corteSemDesempate.custo, 3.70, 1e-9);
  near(m.corte.custo, 2.90, 1e-9); near(m.guloso.custo, 3.15, 1e-9);
  const w8 = C.otimizar(B, { cap: 8 });
  eq(plain(w8.ids), ['P01', 'P03', 'P06', 'P08']); near(w8.valor, 285, 1e-6);
  const q = Object.fromEntries(C.linhasCandidatas(B).map((r) => [r.id, [r.qVE, r.qVR]]));
  const grupos = (k, nome) => Object.keys(q).filter((id) => q[id][k] === nome).sort();
  eq(grupos(0, 'FAZER_PRIMEIRO'), ['P03', 'P06', 'P08']);
  eq(grupos(0, 'PLANEJAR'), ['P01', 'P05']);
  eq(grupos(0, 'COMPLEMENTAR'), ['P04', 'P07']);
  eq(grupos(0, 'QUESTIONAR'), ['P02']);
  eq(grupos(1, 'PEROLA'), ['P03', 'P06']);
  eq(grupos(1, 'OSTRA'), ['P01', 'P05', 'P08']);
  eq(grupos(1, 'PAO_COM_MANTEIGA'), ['P04', 'P07']);
  eq(grupos(1, 'ELEFANTE_BRANCO'), ['P02']);
  const t0 = Date.now(); const novo = carregar(); novo.calc.otimizar(novo.base); assert.ok(Date.now() - t0 < 1000);
  const t1 = Date.now(); novo.calc.otimizar(novo.base, { cap: 9 }); assert.ok(Date.now() - t1 < 50, '256 combinações em < 50 ms');
});

/* =============================================================== §6.6–6.7 perguntas e desafio N2 */
test('§6.6 análise N2 (AQ2-01…10) e decisões DC2-01…05', () => {
  const rows = C.linhasCandidatas(B);
  const argmax = rows.slice().sort((a, b) => b.nFte - a.nFte);
  eq(argmax.slice(0, 3).map((r) => r.id), ['P03', 'P07', 'P06']); // AQ2-01
  near(C.discricionaria(B).fte, 7.0, 1e-9, 'AQ2-02');
  eq(rows.filter((r) => r.qVE === 'QUESTIONAR').map((r) => r.id), ['P02']); // AQ2-03
  near(C.otimizar(B).valor, 331.25, 0.05, 'AQ2-04');
  eq(rows.filter((r) => r.R >= 15 && !r.acao).map((r) => r.id), ['P05']); // AQ2-05
  pct(C.otimizar(B).D, 30.0, 0.5, 'AQ2-06');
  near(C.evmPortfolio(B).cpi, 0.80, 0.01, 'AQ2-07');
  near(C.guloso(B).ociosidade, 1.0, 1e-9, 'AQ2-08');
  const diff = C.diffFotografia(C.ultimaFotografiaFechada(B), C.conteudoFotografia(B));
  eq(plain(diff.pioraram), ['E02']); // AQ2-09
  const muda = rows.filter((r) => (r.qVE === 'FAZER_PRIMEIRO') !== (r.qVR === 'PEROLA')).map((r) => r.id);
  eq(muda, ['P08']); // AQ2-10
  // DC2-01: 4 FTE e R$ 1,6 mi entre P03, P05, P06, P07, P08
  const sub = rows.filter((r) => ['P03', 'P05', 'P06', 'P07', 'P08'].includes(r.id));
  const dc1 = C.otimizar(B, { rows: sub, cap: 4, orc: 1.6, obrig: [] });
  eq(plain(dc1.ids), ['P03', 'P06', 'P07']); near(dc1.valor, 171.25, 1e-6); near(dc1.custo, 1.15, 1e-9);
  near(C.resumoCarteira(B, ['P05'], { rows: sub, cap: 4, orc: 1.6 }).valor, 63.75, 1e-9);
  near(C.resumoCarteira(B, ['P03', 'P06'], { rows: sub, cap: 4, orc: 1.6 }).valor, 135.0, 1e-9);
  near(C.resumoCarteira(B, ['P06', 'P08'], { rows: sub, cap: 4, orc: 1.6 }).valor, 133.75, 1e-9);
  // DC2-02 (avaliar = V/V*)
  const ot = C.avaliarSelecao(B, ['P01', 'P03', 'P04', 'P06', 'P08']);
  assert.equal(ot.ok, true); assert.equal(ot.nota, 100); assert.equal(ot.caso, 'PROXIMO_OTIMO');
  assert.equal(C.avaliarSelecao(B, ['P01', 'P03', 'P06', 'P07', 'P08']).ok, true, 'guloso: 97% de V*');
  const mix = C.avaliarSelecao(B, ['P01', 'P03', 'P04', 'P06', 'P07']);
  assert.equal(mix.caso, 'MIX'); assert.equal(mix.ok, true); near(mix.delta, 27.5, 1e-6);
  const corte = C.avaliarSelecao(B, ['P01', 'P03', 'P06', 'P08']);
  assert.equal(corte.caso, 'DEIXA_VALOR'); assert.equal(corte.ok, false); assert.equal(corte.nota, 86);
  const inv = C.avaliarSelecao(B, ['P01', 'P02', 'P05', 'P06']);
  assert.equal(inv.caso, 'INVIAVEL'); near(inv.estouro.fte, 1.5, 1e-9); assert.equal(inv.nota, 0, 'inviável não pontua');
  assert.equal(C.avaliarSelecao(B, C.linhasCandidatas(B).map((r) => r.id)).nota, 0, 'todas (17 FTE) é inviável: nota 0, não 145');
  assert.equal(C.avaliarSelecao(B, ['P03', 'P06']).caso, 'INVIAVEL', 'sem a obrigatória P01');
  // DC2-03: o desempate muda a carteira, não o valor
  near(C.linhaDeCorte(B, { desempate: false }).valor, C.linhaDeCorte(B).valor, 1e-9);
  // DC2-04: incluir P05 tira P04 e P08 e leva a 285,00
  const fora = Object.fromEntries(C.porQueFora(B).map((x) => [x.id, x]));
  near(fora.P05.deltaV, -46.25, 1e-6); eq(plain(fora.P05.saem), ['P04', 'P08']);
  near(C.otimizar(B, { forcar: ['P05'] }).valor, 285.0, 1e-6);
  // DC2-05: E05
  const e5 = C.evm(B, 'E05');
  near(e5.spi, 0.75, 0.005); near(e5.cpi, 0.65, 0.005); near(e5.eac, 2.17, 0.005); near(e5.eacMenosPrevisao, 0.37, 0.005); near(e5.etc, 0.87, 0.005);
});

test('§6.7 desafio N2: avaliação às cegas, quadrantes e variantes', () => {
  const ref = { P03: { C1: 3, C2: 4, C3: 3, C4: 4, C5: 5 }, P05: { C1: 3, C2: 4, C3: 3, C4: 5, C5: 3 }, P06: { C1: 4, C2: 4, C3: 3, C4: 4, C5: 4 } };
  assert.equal(C.conferirCegas(B, ref).ok, true);
  const longe = plain(ref); longe.P03.C1 = 1; longe.P05.C2 = 1; longe.P06.C3 = 5;
  assert.equal(C.conferirCegas(B, longe).ok, false);
  const certos = Object.fromEntries(C.linhasCandidatas(B).map((r) => [r.id, r.qVE]));
  assert.equal(C.conferirQuadrantes(B, certos).corretos, 8);
  assert.equal(C.conferirQuadrantes(B, Object.assign({}, certos, { P08: 'PLANEJAR' })).ok, true, '7 de 8');
  const m8 = C.metodos(B, { cap: 8 });
  near(m8.corte.valor, 285.0, 0.5); near(m8.corte.ociosidade, 0.0, 0.1);
  near(m8.guloso.valor, 257.5, 0.5); near(m8.guloso.ociosidade, 1.0, 0.1);
  near(m8.otimo.valor, 285.0, 0.5); near(m8.otimo.ociosidade, 0.0, 0.1);
  pct(m8.otimo.D, 50.0, 1); assert.equal(m8.otimo.mix.SUSTENTACAO, 0); assert.equal(m8.otimo.mix.INOVACAO, 0);
  const set = C.evm(B, 'E02', { fisico: 45, ac: 0.75 });
  near(set.cpi, 0.90, 0.02); near(set.eac, 1.67, 0.02);
  const hoje = C.evm(B, 'E02');
  near(hoje.cpi, 0.63, 0.005); near(hoje.eac, 2.40, 0.005);
});

/* =============================================================== §7.4 indicadores N3 */
test('§7.4 cenários C0–C8 (carteira, FTE, R$, valor, D)', () => {
  const gab = {
    C0: [['P01', 'P03', 'P04', 'P06', 'P08'], 9.5, 3.40, 331.25, 30.0], C1: [['P01', 'P02', 'P03', 'P04', 'P06'], 10.0, 3.50, 316.25, 30.0],
    C2: [['P01', 'P03', 'P06', 'P08'], 8.0, 2.90, 285.00, 50.0], C3: [['P01', 'P03', 'P06', 'P07', 'P08'], 9.0, 3.15, 322.35, 37.2],
    C4: [['P01', 'P03', 'P04', 'P06', 'P07'], 8.5, 2.85, 303.75, 14.8], C5: [['P01', 'P03', 'P06', 'P08', 'P09'], 10.0, 3.50, 285.00, 50.0],
    C6: [['P01', 'P03', 'P04', 'P06'], 7.5, 2.60, 267.50, 30.0], C7: [['P01', 'P06', 'P07', 'P08'], 8.0, 2.85, 256.25, 34.8],
    C8: [['P01', 'P03', 'P04', 'P06', 'P07'], 8.5, 2.85, 303.75, 14.8],
  };
  const res = Object.fromEntries(C.cenarios(B).map((c) => [c.cenarioId, c]));
  for (const [id, [ids, fte, custo, valor, D]] of Object.entries(gab)) {
    eq(plain(res[id].ids), ids, `carteira ${id}`);
    near(res[id].fte, fte, 1e-9, `FTE ${id}`); near(res[id].custo, custo, 1e-9, `R$ ${id}`); near(res[id].valor, valor, 0.005, `V* ${id}`); pct(res[id].D, D, 0.05, `D ${id}`);
  }
  assert.equal(res.C3.empateTecnico, true, 'C3: P07 entra no lugar de P04 por 0,29 ponto');
  near(res.C3.margem, 0.29, 0.005); near(res.C3.segunda.valor, 322.06, 0.005);
  eq(plain(B.cenarios.filter((c) => c.usoRobustez).map((c) => c.id)), ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
  for (const c of B.cenarios) assert.ok(String(c.gatilho || '').trim(), `gatilho de ${c.id}`);
});

test('§7.4 custos de política (não aditivos) e I3.1–I3.4', () => {
  const p = Object.fromEntries(C.custosPolitica(B).map((x) => [x.id, x]));
  const gab = { DEP: [316.25, 15.00, 4.5], MIX: [303.75, 27.50, 8.3], RESERVA: [303.75, 27.50, 8.3], RESERVA_MIX: [303.75, 27.50, 8.3], GCAP: [256.25, 75.00, 22.6],
    DEP_GCAP: [192.50, 138.75, 41.9], P07: [321.25, 10.00, 3.0], EXCL: [321.25, 10.00, 3.0], P09: [285.00, 46.25, 14.0] };
  for (const [id, [v, c, pc]] of Object.entries(gab)) { near(p[id].vCom, v, 1e-6, `V* ${id}`); near(p[id].custo, c, 1e-6, `custo ${id}`); pct(p[id].pct, pc, 0.05, `% ${id}`); }
  eq(plain(p.MIX.idsCom), plain(p.RESERVA.idsCom), 'reserva gera a mesma carteira do mix');
  assert.ok(p.DEP_GCAP.custo > p.DEP.custo + p.GCAP.custo, 'super-aditivo');
  eq(plain(p.DEP_GCAP.idsCom), ['P01', 'P06', 'P07']);
  eq(plain(p.EXCL.idsCom), plain(C.guloso(B).ids), 'exclusividade = guloso');
  pct(p.P07.D, 37.2, 0.05);
  const fr = C.fronteira(B);
  eq(fr.pontos.map((x) => x.fte), [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5]);
  [151.25, 151.25, 187.5, 197.5, 221.25, 233.75, 257.5, 267.5, 285.0, 303.75, 321.25, 331.25, 331.25, 367.5].forEach((v, k) => near(fr.pontos[k].valor, v, 1e-6, `fronteira ${fr.pontos[k].fte}`));
  const mg = Object.fromEntries(fr.marginal.map((x) => [`${x.de}-${x.ate}`, x.delta]));
  near(mg['8-8.5'], 18.75, 1e-6); near(mg['8.5-9'], 17.5, 1e-6); near(mg['9-9.5'], 10.0, 1e-6); near(mg['9.5-10'], 0, 1e-6); near(mg['10-10.5'], 36.25, 1e-6);
  const I = C.indicadores(B);
  pct(I['I3.3'].valor.corte, 86.0, 0.05); pct(I['I3.3'].valor.guloso, 97.0, 0.05);
  near(I['I3.1'].valor.C7.valor, 256.25, 1e-6);
});

test('§7.4 robustez, Pareto, sensibilidade, Spearman e AHP (I3.5–I3.8)', () => {
  const r = C.robustez(B);
  const f = (id) => r.frequencia[id];
  ['P01', 'P03', 'P06'].forEach((id) => assert.equal(f(id).n, 7));
  assert.equal(f('P04').n, 4); assert.equal(f('P08').n, 4); assert.equal(f('P07').n, 2); assert.equal(f('P02').n, 1); assert.equal(f('P05').n, 0);
  eq(plain(r.nucleo), ['P01', 'P03', 'P06']);
  const r7 = C.robustez(B, { incluir: ['C7'] });
  pct(r7.frequencia.P03.pct, 87.5, 0.05); pct(r7.frequencia.P08.pct, 62.5, 0.05); pct(r7.frequencia.P04.pct, 50, 0.05); pct(r7.frequencia.P07.pct, 37.5, 0.05); pct(r7.frequencia.P02.pct, 12.5, 0.05);
  eq(plain(C.paretoIniciativas(B, 'fte')), ['P01', 'P03', 'P06']);
  eq(plain(C.paretoIniciativas(B, 'custo')), ['P01', 'P03', 'P06', 'P07']);
  eq(plain(C.paretoIniciativas(B, 'risco')), ['P01', 'P03', 'P06', 'P07']);
  const s = C.sensibilidade(B, { C4: 0.30 });
  [['C1', 0.2471], ['C2', 0.2059], ['C3', 0.1647], ['C4', 0.30], ['C5', 0.0824]].forEach(([k, v]) => near(s.pesos[k], v, 0.00005, `peso ${k}`));
  const N = Object.fromEntries(s.ranking.map((x) => [x.id, x.N]));
  [['P01', 84.26], ['P06', 70.88], ['P05', 70.15], ['P03', 66.76], ['P08', 61.32], ['P02', 53.38], ['P04', 42.50], ['P07', 38.68]].forEach(([id, v]) => near(N[id], v, 0.005, `N w4=30% ${id}`));
  assert.equal(s.rankingMudou, true); assert.equal(s.selecaoMudou, false); near(s.valor, 325.74, 0.005); near(s.rho, 0.958, 0.0005);
  const v = C.varreduraPesos(B);
  eq(plain(v.mudancas).map((x) => [x.criterio, x.peso, x.entram, x.saem]), [['C5', 0.25, ['P07'], ['P04']]]);
  const s40 = C.sensibilidade(B, { C4: 0.40 });
  eq(plain(s40.selecao), ['P01', 'P03', 'P06', 'P07', 'P08']); assert.equal(s40.empateTecnico, true);
  const disc = (sel) => s40.ranking.filter((x) => sel.includes(x.id)).reduce((a, x) => a + x.N, 0);
  near(disc(['P03', 'P06', 'P07', 'P08']), 239.41, 0.005); near(disc(['P03', 'P04', 'P06', 'P08']), 239.12, 0.005);
  near(C.limiarReversao(B, 'P05', 'P06').limiar, 0.32, 1e-9); assert.equal(C.limiarReversao(B, 'P05', 'P06').sentido, 'ACIMA');
  near(C.limiarReversao(B, 'P05', 'P03').limiar, 0.19, 0.005);
  const ex = Object.fromEntries(B.ahpExemplos.map((x) => [x.id, C.ahp(x.matriz)]));
  [0.297, 0.540, 0.163].forEach((w, k) => near(ex.M1.pesos[k], w, 0.0005)); near(ex.M1.lambdaMax, 3.009, 0.0005); near(ex.M1.CR, 0.008, 0.0005);
  [0.379, 0.331, 0.289].forEach((w, k) => near(ex.M2.pesos[k], w, 0.0005)); near(ex.M2.lambdaMax, 4.002, 0.0005); near(ex.M2.CR, 0.864, 0.0005); assert.equal(ex.M2.consistente, false);
  [0.364, 0.221, 0.204, 0.124, 0.087].forEach((w, k) => near(ex.EQUIPE.pesos[k], w, 0.0005)); near(ex.EQUIPE.lambdaMax, 5.078, 0.0005); near(ex.EQUIPE.CI, 0.0195, 0.00005); near(ex.EQUIPE.CR, 0.017, 0.0005);
  const equipe = B.ahpExemplos.find((x) => x.id === 'EQUIPE');
  const sa = C.sensibilidade(B, C.pesosAhp(equipe.matriz, equipe.criterios));
  assert.equal(sa.selecaoMudou, false); near(sa.valor, 331.85, 0.005); near(sa.rho, 0.934, 0.0005);
  // A spec mostra P03 = 62,98 porque arredondou os pesos para 3 casas (62,975); com os pesos exatos dá 62,9736 → 62,97.
  eq(sa.ranking.slice(2, 4).map((x) => x.id), ['P08', 'P03']); near(sa.ranking[2].N, 64.63, 0.005); near(sa.ranking[3].N, 62.9736, 0.0005);
});

test('§7.4 benefícios, pessoa-chave, capacidade local, horizontes e sourcing (I3.12–I3.18)', () => {
  const b1 = C.beneficio(B, 'BEN-01'), b2 = C.beneficio(B, 'BEN-02');
  pct(b1.realizacaoMeta, 60); pct(b1.realizacaoTrajetoria, 120); assert.equal(b1.situacao, 'ACIMA');
  pct(b2.realizacaoMeta, 20); pct(b2.realizacaoTrajetoria, 40); assert.equal(b2.situacao, 'ABAIXO');
  assert.equal(C.trajetoriaPlanejada(B.beneficios[0], 6), 75);
  const c0 = C.otimizar(B).ids;
  const k = C.pessoaChave(B); pct(k.valor, 62.5); assert.equal(k.n, 5);
  pct(C.pessoaChave(B, c0).valor, 60);
  const u = Object.fromEntries(C.utilizacaoPorGerencia(B, c0).map((g) => [g.gerenciaId, g]));
  pct(u.FEL.u, 0); pct(u.FEN.u, 114.3, 0.05); pct(u.FER.u, 100); pct(u.FEG.u, 150);
  eq([u.FEL.faixa.id, u.FEN.faixa.id, u.FER.faixa.id, u.FEG.faixa.id], ['AUTONOMIA', 'TANQUE', 'REDUZIR', 'TANQUE']);
  const h = C.mixHorizonte(B, c0);
  pct(h.pct.H1, 61.8, 0.05); pct(h.pct.H2, 23.5, 0.05); pct(h.pct.H3, 14.7, 0.05); pct(h.Dh, 8.2, 0.05);
  const sc = C.custoPorSourcing(B, c0);
  pct(sc.pct.NUCLEO_CRITICO, 44.1, 0.05); pct(sc.pct.PERIFERICO, 41.2, 0.05); pct(sc.pct.SEM_FERRAMENTA, 14.7, 0.05);
  eq(plain(sc.porClasse.NUCLEO_CRITICO), ['P01', 'P03']);
  near(C.capacidadeComReserva(B), 8.5, 1e-9);
});

/* =============================================================== §7.5–7.6 perguntas e desafio N3 */
test('§7.5 análise e decisão N3 (AQ3-01…10, exceto AQ3-07/CPM; DC3-01…06)', () => {
  const dep = [['P08', 'P02']];
  eq(plain(C.depsLogicas(B)), dep);
  const c1 = C.otimizar(B, { deps: dep });
  eq(plain(c1.ids), ['P01', 'P02', 'P03', 'P04', 'P06']); near(c1.valor, 316.25, 1e-6); near(c1.fte, 10, 1e-9); // AQ3-01
  near(C.custoRestricao(B, {}, { deps: dep }).custo, 15.0, 0.05, 'AQ3-02');
  near(C.custoRestricao(B, {}, { maxD: 0.15 }).custo, 27.5, 0.05, 'AQ3-03');
  eq(plain(C.robustez(B).nucleo), ['P01', 'P03', 'P06']); // AQ3-04
  near(C.limiarReversao(B, 'P05', 'P06').limiar * 100, 32, 1, 'AQ3-05');
  const gc = C.custoRestricao(B, {}, { gcap: true });
  near(gc.custo, 75.0, 0.05, 'AQ3-06'); assert.ok(!gc.idsCom.includes('P03') && !gc.idsCom.includes('P04') && gc.idsCom.includes('P07'));
  eq(C.beneficiosResumo(B).filter((x) => x.realizacaoTrajetoria != null && x.realizacaoTrajetoria < 1).map((x) => x.id), ['BEN-02']); // AQ3-08
  assert.equal(C.linhaBaseSugerida(B, 'BEN-03'), 78); // AQ3-09
  pct(C.robustez(B, { incluir: ['C7'] }).frequencia.P03.pct, 87.5, 0.5, 'AQ3-10');
  // DC3-02: núcleo (6,0) + P02 (2,5) + P08 (2,0) = 10,5 > 10
  near(C.resumoCarteira(B, ['P01', 'P03', 'P06', 'P02', 'P08']).fte, 10.5, 1e-9);
  assert.equal(C.resumoCarteira(B, ['P01', 'P03', 'P06', 'P02', 'P08']).viavel, false);
  // DC3-04: recompor nas capacidades locais = 256,25 (−75)
  near(C.otimizar(B, { gcap: true }).valor, 256.25, 1e-6);
  // DC3-06: gabarito-modelo e nota
  const g = C.gabaritoCiclo(B);
  eq(Object.fromEntries(Object.entries(plain(g)).map(([id, x]) => [id, x.classe])),
    { P01: 'NUCLEO', P02: 'HABILITADORA', P03: 'NUCLEO', P04: 'CONDICIONAL', P05: 'RECYCLE', P06: 'NUCLEO', P07: 'CONDICIONAL', P08: 'CONDICIONAL' });
  eq(plain(g.P03.aceitas), { CONDICIONAL: 0.5 });
  const modelo = { P01: 'NUCLEO', P02: 'HABILITADORA', P03: 'NUCLEO', P04: 'CONDICIONAL', P05: 'RECYCLE', P06: 'NUCLEO', P07: 'CONDICIONAL', P08: 'CONDICIONAL' };
  assert.equal(C.avaliarRecomendacaoCiclo(B, modelo).nota, 8);
  const alt = C.avaliarRecomendacaoCiclo(B, Object.assign({}, modelo, { P03: 'CONDICIONAL', P04: 'HABILITADORA', P05: 'KILL' }));
  assert.equal(alt.nota, 6); assert.equal(alt.ok, true);
});

test('§7.6 desafio N3: variantes a 8 FTE e de sensibilidade', () => {
  const p8 = Object.fromEntries(C.custosPolitica(B, { cap: 8 }).map((x) => [x.id, x]));
  near(p8.DEP.custo, 17.5, 0.5); near(p8.DEP.vCom, 267.5, 1e-6);
  near(p8.MIX.custo, 52.5, 0.5); near(p8.MIX.vCom, 232.5, 1e-6);
  near(p8.GCAP.custo, 28.75, 0.5); near(p8.GCAP.vCom, 256.25, 1e-6);
  near(C.limiarReversao(B, 'P05', 'P03').limiar * 100, 19, 1, 'limiar P05 × P03');
  assert.equal(C.sensibilidade(B, { C4: 0.30 }).selecaoMudou, false, 'w4 = 30%: a seleção não muda');
  const proprio = { id: 'CX', nome: 'Orçamento menor', premissas: { orc: 3.0 }, gatilho: 'corte de orçamento anunciado', usoRobustez: false };
  const r = C.cenario(B, proprio);
  assert.ok(r.viavel && r.custo <= 3.0 + 1e-9);
  eq(plain(C.robustez(B).nucleo), ['P01', 'P03', 'P06'], 'cenário próprio não altera o núcleo esperado');
});

/* =============================================================== §3.10 regras transversais */
test('§3.10 divisões seguras, Cinza com dado faltante, TCPI e D nulos, datas UTC', () => {
  assert.equal(C.div(1, 0), null); assert.equal(C.div(1, -2), null); assert.equal(C.div(null, 2), null); assert.equal(C.div(3, 2), 1.5);
  const ac0 = variante((x) => { x.financeiro.find((f) => f.id === 'FIN-E01').realizado = 0; });
  assert.equal(C.sinal(ac0, 'E01').cor, 'CINZA'); assert.equal(C.evm(ac0, 'E01').cpi, null);
  const pv0 = variante((x) => { iniV(x, 'E01').percentualFisicoPlanejado = 0; });
  assert.equal(C.evm(pv0, 'E01').spi, null);
  const esgotado = variante((x) => { x.financeiro.find((f) => f.id === 'FIN-E03').realizado = 2.0; });
  assert.equal(C.evm(esgotado, 'E03').tcpi, null); assert.equal(C.evm(esgotado, 'E03').tcpiMotivo, 'BAC esgotado (TCPI n/d)');
  assert.equal(C.indiceD(B, ['P01']).D, null, 'D nulo sem custo discricionário');
  assert.equal(C.dias('2026-10-03', '2026-12-01'), 59);
  assert.equal(C.dias('2026-03-28', '2026-03-30'), 2, 'sem efeito de horário de verão');
  assert.equal(C.mesIdx('2027-03-26') - C.mesIdx('2026-11-27'), 4);
  const vencida = variante((x) => { iniV(x, 'E01').dataPrevistaAtual = '2026-09-01'; });
  const s = C.sinal(vencida, 'E01');
  assert.equal(s.previsaoVencida, true); assert.equal(s.desvio, C.mesIdx('2026-10-03') - C.mesIdx('2026-12-18'));
  // R13 nas bordas: índice 0,85 é Amarelo (vermelho só < 0,85); 0,95 é Verde; desvio 1–2 Amarelo, ≥ 3 Vermelho; vale a pior dimensão
  const borda = (fisico, prevista) => C.sinal(variante((x) => { const e = iniV(x, 'E01'); e.percentualFisicoReal = fisico; e.dataPrevistaAtual = prevista; x.financeiro.find((f) => f.id === 'FIN-E01').realizado = 0.8; }), 'E01');
  [[95, '2026-12-18', 'VERDE'], [85, '2026-12-18', 'AMARELO'], [84, '2026-12-18', 'VERMELHO'], [94, '2026-12-18', 'AMARELO'],
    [95, '2027-01-05', 'AMARELO'], [95, '2027-02-05', 'AMARELO'], [95, '2027-03-05', 'VERMELHO'], [84, '2027-01-05', 'VERMELHO']].forEach(([f, p, cor]) => assert.equal(borda(f, p).cor, cor, `físico ${f}% e prevista ${p}`));
  assert.equal(borda(85, '2026-12-18').motivo, 'desvio 0 meses < 1; índice 0,85 (0,85 a < 0,95) → Amarelo');
  assert.equal(C.arred(1.005, 2), 1.01); assert.equal(C.arred(-0.765, 2), -0.77); assert.equal(C.mediana([3, 1, 2, 4]), 2.5);
  assert.equal(C.otimizar(B, { rows: Array.from({ length: 15 }, (_, k) => ({ id: 'Z' + k, fte: 1, custo: 0.1, N: 1, R: 0, categoria: 'EVOLUCAO' })) }).desligado, true);
});

test('estadoEm reverte histórico sem mutar a origem', () => {
  const antes = JSON.stringify(B);
  const set = C.estadoEm(B, '2026-09-04');
  assert.equal(JSON.stringify(B), antes);
  assert.equal(set.dataReferencia, '2026-09-04');
  assert.equal(set.riscosImpedimentos.some((r) => r.id === 'R1'), false);
  assert.equal(set.avaliacoes.some((a) => a.id === 'AV-P05b'), false);
  const e2 = set.iniciativas.find((i) => i.id === 'E02');
  eq([e2.dataPrevistaAtual, e2.ragDeclarado, e2.percentualFisicoReal], ['2027-01-29', 'AMARELO', 45]);
  assert.equal(set.financeiro.find((f) => f.id === 'FIN-E02').realizado, 0.75);
  assert.equal(set.iniciativas.find((i) => i.id === 'X01').ativo, false, 'HS-01 (10/06) é anterior e fica');
  const novo = variante((x) => { x.riscosImpedimentos.push({ id: 'RX', iniciativaId: 'E01', status: 'ABERTO', registradoEm: '2026-10-01T10:00:00.000Z' }); });
  assert.equal(C.estadoEm(novo, '2026-09-04').riscosImpedimentos.some((r) => r.id === 'RX'), false, 'risco registrado depois da data não existia');
  assert.equal(C.riscosAbertos(novo).length, 6);
});

/* =============================================================== robustez sobre PF.db() editado */
const naoFinitos = (o, p = '', acc = []) => {
  if (typeof o === 'number' && !Number.isFinite(o)) acc.push(`${p}=${o}`);
  else if (o && typeof o === 'object') for (const k of Object.keys(o)) naoFinitos(o[k], `${p}.${k}`, acc);
  return acc;
};
test('robustez: cálculos sobre cópias editadas (como PF.db()) não lançam erro nem devolvem NaN/Infinity', () => {
  const edicoes = {
    'E01 sem financeiro': (x) => { x.financeiro = x.financeiro.filter((f) => f.iniciativaId !== 'E01'); },
    'sem financeiro algum': (x) => { x.financeiro = []; },
    'P03 sem avaliação': (x) => { x.avaliacoes = x.avaliacoes.filter((a) => a.iniciativaId !== 'P03'); },
    'nova candidata sem nota, risco ou ferramenta': (x) => {
      x.iniciativas.push(Object.assign(plain(iniV(x, 'P07')), { id: 'P10', ferramentaId: null, pessoasChave: [] }));
      x.financeiro.push({ id: 'FIN-P10', iniciativaId: 'P10', periodo: '2027-01-01', orcamentoPlanejado: 0.2, realizado: 0, fonte: 'x' });
      x.demandasCapacidade.push({ id: 'DCAP-P10', iniciativaId: 'P10', periodo: '2027-01-01', capacidadeRequerida: 0.5, unidade: 'FTE' });
    },
    'sem regras (padrões da v1)': (x) => { x.regras = []; },
    'sem capacidades (R24)': (x) => { x.capacidades = []; },
    'capacidade e orçamento zero': (x) => { x.capacidades.forEach((c) => { c.capacidadeDisponivel = 0; }); Object.assign(x.regras.find((r) => r.codigo === 'R24').valor, { fteTotal: 0, orcamento: 0 }); },
    'sem riscos, dependências, cenários, AHP, benefícios e fotografias': (x) => { Object.assign(x, { riscosImpedimentos: [], dependencias: [], cenarios: [], ahpExemplos: [], beneficios: [], medicoesBeneficio: [], snapshotsForum: [] }); },
    'campos vazios e fase desconhecida': (x) => { iniV(x, 'E01').dataPrevistaAtual = ''; iniV(x, 'E03').percentualFisicoReal = null; iniV(x, 'E04').statusId = 'XPTO'; iniV(x, 'D5').triagem = null; },
    'P01 estimada em horas (sai das candidatas)': (x) => { x.demandasCapacidade.find((d) => d.iniciativaId === 'P01').unidade = 'HORAS'; },
    '16 candidatas (enumeração desligada)': (x) => {
      for (let k = 10; k < 18; k++) {
        const id = 'Q' + k; x.iniciativas.push(Object.assign(plain(iniV(x, 'P06')), { id }));
        x.financeiro.push({ id: 'F' + id, iniciativaId: id, periodo: '2027-01-01', orcamentoPlanejado: 0.1, realizado: 0, fonte: 'x' });
        x.demandasCapacidade.push({ id: 'D' + id, iniciativaId: id, periodo: '2027-01-01', capacidadeRequerida: 0.5, unidade: 'FTE' });
        x.avaliacoes.push({ id: 'A' + id, iniciativaId: id, registradoEm: '2026-08-28', notasCriterios: { C1: 3, C2: 3, C3: 3, C4: 3, C5: 3 } });
      }
    },
  };
  for (const [nome, fn] of Object.entries(edicoes)) {
    const d = variante(fn);
    const r = [C.indicadores(d), C.sinais(d), C.horizontes(d, { todasAtivas: true }), C.completude(d), C.avaliarTriagem(d, {}), C.avaliarPauta(d, ['E02', 'E05']),
      C.metodos(d), C.porQueFora(d), C.avaliarSelecao(d, ['P01', 'P03']), C.robustez(d, { incluir: ['C7'] }), C.custosPolitica(d), C.fronteira(d),
      C.sensibilidade(d, { C4: 0.3 }), C.limiarReversao(d, 'P05', 'P06'), C.gabaritoCiclo(d), C.beneficiosResumo(d),
      C.diffFotografia(C.ultimaFotografiaFechada(d), C.conteudoFotografia(d)), C.indicadoresFotografia(C.estadoEm(d, '2026-09-04')),
      C.ativas(d).map((i) => [C.evm(d, i), C.horizonte(d, i), C.camposVazios(d, i)]), C.demandas(d).map((i) => C.triagemSugerida(d, i))];
    eq(naoFinitos(r), [], `NaN/Infinity em "${nome}"`);
  }
  assert.equal(C.sinal(variante(edicoes['E01 sem financeiro']), 'E01').cor, 'CINZA', 'sem financeiro → Cinza, nunca Verde');
  assert.equal(C.evm(variante(edicoes['E01 sem financeiro']), 'E01').cpi, null);
  assert.equal(C.otimizar(variante(edicoes['capacidade e orçamento zero'])).viavel, false);
  assert.equal(C.linhasCandidatas(variante(edicoes['P03 sem avaliação'])).find((r) => r.id === 'P03').N, null);
  for (const f of ['sinal', 'evm', 'indice', 'camposVazios', 'checklistTriagem', 'triagemSugerida']) assert.equal(C[f](B, 'ZZ'), null, `${f} com id inexistente`);
  eq(plain(C.horizonte(B, 'ZZ')), { faixa: 'SEM_DATA', dias: null });
  // parâmetro editável (R20 v2 vigente; v1 deixa de valer) muda S e N
  const v2 = variante((x) => { const r = x.regras.find((k) => k.codigo === 'R20'); r.vigente = false; x.regras.push(Object.assign(plain(r), { versao: 2, vigente: true, valor: { C1: 0.4, C2: 0.2, C3: 0.2, C4: 0.1, C5: 0.1 } })); });
  near(C.linhasCandidatas(v2).find((r) => r.id === 'P01').N, 85, 1e-9, 'P01 com pesos v2');
  // data de referência alternativa (o.ref) chega aos agregados do N1
  pct(C.pctOrcamentoVermelho(B, { ref: '2027-06-01' }).valor, 6.0 / 6.6 * 100, 0.05, 'I1.4 com referência em jun/2027');
  assert.equal(C.distribuicaoSinal(B, { ref: '2027-06-01' }).contagem.VERMELHO, 5);
  assert.equal(C.avaliarTriagem(B, { D1: 'REDIRECIONAR_EXECUCAO', D2: 'ADMITIR' }, { ids: ['D1', 'D2'] }).ok, true, 'fila fixada por o.ids');
});

test('otimizador: memória não devolve resumo velho e o ótimo bate com força bruta independente', () => {
  // parâmetros editáveis que não mudam a busca (R22 crítico, R26) precisam refletir no resumo mesmo com a busca em memória
  const base = C.otimizar(B);
  const ed = C.otimizar(variante((x) => { x.regras.find((r) => r.codigo === 'R22').valor.riscoCritico = 10; x.regras.find((r) => r.codigo === 'R26').valor.reduzirAPartirDe = 0.96; }));
  eq(plain(ed.ids), plain(base.ids));
  pct(base.pctCritico, 35.3, 0.05); pct(ed.pctCritico, 58.8, 0.05, 'R ≥ 10 agora inclui P08');
  assert.equal(base.faixa.id, 'REDUZIR'); assert.equal(ed.faixa.id, 'ROADMAP', '95% < 96%');
  const r1 = C.otimizar(B); r1.ids.push('XX'); r1.segunda.ids.push('YY'); assert.ok(!C.otimizar(B).ids.includes('XX') && !C.otimizar(B).segunda.ids.includes('YY'), 'resultado é cópia');
  // força bruta independente (só usa fte, custo, N, categoria e gerência das linhas)
  const rows = plain(C.linhasCandidatas(B)), GC = { FEL: 1.5, FEN: 3.5, FER: 4.0, FEG: 1.0 }, alvo = { SUSTENTACAO: 0.3, EVOLUCAO: 0.5, INOVACAO: 0.2 };
  const bruta = ({ cap, orc, deps = [], excl = [], maxD = null, gcap = false, forcar = [] }) => {
    let top = null;
    for (let m = 0; m < 1 << rows.length; m++) {
      const s = rows.filter((_, k) => m & (1 << k)), ids = s.map((r) => r.id);
      if (!['P01', ...forcar].every((x) => ids.includes(x))) continue;
      if (Math.round(s.reduce((a, r) => a + r.fte, 0) * 100) > Math.round(cap * 100) || Math.round(s.reduce((a, r) => a + r.custo, 0) * 1000) > Math.round(orc * 1000)) continue;
      if (deps.some(([a, b]) => ids.includes(a) && !ids.includes(b)) || excl.some((g) => g.filter((x) => ids.includes(x)).length > 1)) continue;
      if (gcap && Object.keys(GC).some((g) => s.filter((r) => r.gerenciaId === g).reduce((a, r) => a + r.fte, 0) > GC[g] + 1e-9)) continue;
      if (maxD != null) {
        const dsc = s.filter((r) => !r.obrigatoria), t = dsc.reduce((a, r) => a + r.custo, 0); if (!(t > 0)) continue;
        if (Object.keys(alvo).reduce((a, k) => a + Math.abs(dsc.filter((r) => r.categoria === k).reduce((x, r) => x + r.custo, 0) / t - alvo[k]), 0) / 2 > maxD + 1e-9) continue;
      }
      const v = s.reduce((a, r) => a + r.N, 0); if (!top || v > top + 1e-9) top = v;
    }
    return top;
  };
  let seed = 20261003; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let k = 0; k < 40; k++) {
    const o = { cap: 4 + rnd(17) * 0.5, orc: [2.5, 3, 3.5, 4, 5][rnd(5)] };
    if (rnd(2)) o.deps = [['P08', 'P02']]; if (rnd(3) === 0) o.excl = [['P04', 'P08']]; if (rnd(3) === 0) o.gcap = true;
    const md = [null, 0.15, 0.25][rnd(3)]; if (md != null) o.maxD = md; if (rnd(4) === 0) o.forcar = [['P05', 'P07', 'P02'][rnd(3)]];
    const esperado = bruta(o), obtido = C.otimizar(B, o);
    if (esperado == null) assert.equal(obtido.viavel, false, JSON.stringify(o)); else near(obtido.valor, esperado, 1e-6, JSON.stringify(o));
  }
});

/* =============================================================== pureza */
test('pureza: todos os cálculos rodam com PF.base congelado (deep freeze) sem erro e sem mutação', () => {
  const P = carregar();
  const d = deepFreeze(P.base);
  const K = P.calc;
  const antes = JSON.stringify(d);
  assert.ok(Object.isFrozen(d.iniciativas[0]) && Object.isFrozen(d.regras[0].valor));
  const I = K.indicadores(d);
  assert.ok(Object.keys(I).length >= 45);
  K.metodos(d); K.metodos(d, { cap: 8 }); K.porQueFora(d); K.cenarios(d); K.robustez(d, { incluir: ['C7'] }); K.custosPolitica(d); K.custosPolitica(d, { cap: 8 });
  K.fronteira(d); K.varreduraPesos(d); K.sensibilidade(d, { C4: 0.40 }); K.limiarReversao(d, 'P05', 'P06'); K.gabaritoCiclo(d); K.avaliarRecomendacaoCiclo(d, {});
  K.avaliarSelecao(d, ['P01', 'P03']); K.avaliarTriagem(d, {}); K.avaliarPauta(d, ['E02']); K.conferirCegas(d, {}); K.conferirQuadrantes(d, {});
  K.demandas(d).forEach((i) => { K.checklistTriagem(d, i); K.triagemSugerida(d, i); });
  K.ativas(d).forEach((i) => { K.sinal(d, i); K.horizonte(d, i); K.evm(d, i); K.camposVazios(d, i); });
  K.beneficiosResumo(d); K.linhaBaseSugerida(d, 'BEN-03'); K.diffFotografia(K.ultimaFotografiaFechada(d), K.conteudoFotografia(d));
  K.estadoEm(d, '2026-09-04'); K.horizontes(d, { todasAtivas: true }); K.decisoesVigentes(d); K.ranking(d, { desempate: false });
  d.ahpExemplos.forEach((x) => K.ahp(x.matriz));
  assert.equal(JSON.stringify(d), antes);
});
