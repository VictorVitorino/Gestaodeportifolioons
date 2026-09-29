import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../../prototypes/diagnostico-dts/index.html', import.meta.url), 'utf8');
const appsScript = readFileSync(new URL('../../prototypes/diagnostico-dts/google-apps-script/Codigo.gs', import.meta.url), 'utf8');

function block(id) {
  const match = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`));
  assert.ok(match, `bloco ${id} não encontrado`);
  return match[1];
}

// Core + Report no mesmo contexto, como no navegador.
function loadReport() {
  const context = vm.createContext({});
  vm.runInContext(block('dts-core'), context);
  vm.runInContext(block('dts-report'), context);
  return { Core: context.DTSCore, Report: context.DTSReport };
}
const { Core, Report } = loadReport();
const plain = value => JSON.parse(JSON.stringify(value));

function filledState() {
  const state = Core.createInitialState();
  Object.assign(state.participant, { fullName: 'Ana Paula Costa', email: 'ana.costa@empresa.com',
    aiOpinion: 'uma boa ajuda, desde que eu saiba revisar o que ela entrega.', registeredAt: '2026-09-29T12:00:00.000Z' });
  Object.assign(state.declared, { claude: 3, flows: 2, skills: 2, methods: 2, reuse: 2, creationSharing: 1 });
  state.experience02.selectedSignals = ['flows', 'prompt', 'coffee'];
  state.experience03.path = ['skill', 'method'];
  state.experience04.selectedPath = 'C';
  state.experience05.selectedElements = ['objective', 'context', 'example'];
  state.experience06.selectedPromptElements = ['context', 'objective', 'tone'];
  state.experience07.selectedCharacter = 'person02';
  state.experience07.originalPrompt = 'Desenhe a Ana Paula sorrindo.';
  state.experience07.originalStructureScore = 45;
  state.experience07.revisedPrompt = 'Contexto: homenagem ao time. Desenhe a Ana Paula sorrindo, estilo aquarela.';
  state.experience07.revisedStructureScore = 80;
  state.meta.startedAt = '2026-09-29T12:00:30.000Z';
  state.meta.finishedAt = '2026-09-29T12:07:00.000Z';
  state.meta.maxReachedPage = 8;
  Core.recomputeAll(state);
  return state;
}

/* ------------------------------------------------------------ planilha simulada (Apps Script) */

function loadAppsScript() {
  const sheets = new Map();
  const named = new Map();
  const makeSheet = name => {
    const sheet = {
      name, cells: [], notes: {}, merged: [], frozen: [0, 0], rules: [],
      getName: () => name,
      getLastRow() { for (let r = sheet.cells.length - 1; r >= 0; r--) if ((sheet.cells[r] || []).some(v => v !== '' && v != null)) return r + 1; return 0; },
      getLastColumn() { let max = 0; sheet.cells.forEach(row => (row || []).forEach((v, c) => { if (v !== '' && v != null) max = Math.max(max, c + 1); })); return max; },
      getMaxRows: () => 1000,
      getRange(r, c, nr = 1, nc = 1) { return makeRange(sheet, r, c, nr, nc); },
      setFrozenRows(n) { sheet.frozen[0] = n; },
      setFrozenColumns(n) { sheet.frozen[1] = n; },
      setColumnWidth() {},
      setConditionalFormatRules(rules) { sheet.rules = rules; },
      clear() { sheet.cells.length = 0; },
      deleteRow(r) { sheet.cells.splice(r - 1, 1); }
    };
    return sheet;
  };
  const write = (sheet, r, c, values) => values.forEach((row, i) => row.forEach((v, j) => {
    const rr = r - 1 + i;
    sheet.cells[rr] = sheet.cells[rr] || [];
    sheet.cells[rr][c - 1 + j] = v;
  }));
  const makeRange = (sheet, r, c, nr, nc) => {
    const shape = values => { assert.equal(values.length, nr); values.forEach(row => assert.equal(row.length, nc)); };
    const target = {
      sheet, r, c, nr, nc,
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => {
        const v = (sheet.cells[r - 1 + i] || [])[c - 1 + j];
        return v == null ? '' : v;
      })),
      setValues(values) { shape(values); write(sheet, r, c, values); return proxy; },
      setFormulas(values) { shape(values); values.flat().forEach(f => assert.ok(f === '' || f.startsWith('='), f)); write(sheet, r, c, values); return proxy; },
      setValue: v => target.setValues([[v]]),
      setFormula: f => target.setFormulas([[f]]),
      setNotes(values) { shape(values); values.forEach((row, i) => row.forEach((n, j) => { sheet.notes[`${r + i}:${c + j}`] = n; })); return proxy; },
      merge() { sheet.merged.push([r, c, nr, nc]); return proxy; }
    };
    const proxy = new Proxy(target, { get: (t, key) => (key in t ? t[key] : () => proxy) });
    return proxy;
  };
  const spreadsheet = {
    getSheetByName: name => sheets.get(name) || null,
    insertSheet(name) { const s = makeSheet(name); sheets.set(name, s); return s; },
    setNamedRange(name, range) { named.set(name, range); },
    removeNamedRange(name) { if (!named.delete(name)) throw new Error('não existe'); }
  };
  const builder = () => new Proxy({}, { get: (t, key) => (key === 'build' ? () => ({ rule: true }) : () => builder()) });
  const context = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet, newConditionalFormatRule: builder },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: text => ({ text, setMimeType() { return this; }, getContent() { return this.text; } })
    },
    Logger: { log() {} }
  });
  vm.runInContext(appsScript, context);
  const diag = () => {
    const sheet = sheets.get('Diagnóstico');
    const header = (sheet.cells[1] || []).map(String);
    const rows = sheet.cells.slice(2).filter(row => row && row.some(v => v !== '' && v != null));
    const cell = (row, title) => row[header.indexOf(title)];
    return { sheet, header, rows, cell };
  };
  const post = payload => JSON.parse(context.doPost({ postData: { contents: typeof payload === 'string' ? payload : JSON.stringify(payload) } }).getContent());
  const namedValues = name => named.get(name).getValues().map(row => row[0]);
  return { context, sheets, named, namedValues, diag, post };
}

// Exatamente o corpo que o caderno envia (Sync.put).
const payload = (state, tipo = 'resultado_final') => ({ tipo, versao: Report.VERSION, linha: Report.diagnosisRecord(state) });
const schema = gs => Array.from(gs.context.colunasDiagnostico_(), c => ({ titulo: c.titulo, calculada: !!c.formula, nota: c.nota, grupo: c.grupo }));

/* ------------------------------------------------------------ participante */

test('cada sessão ganha um ID próprio e começa sem participante', () => {
  const a = Core.createInitialState();
  const b = Core.createInitialState();
  assert.match(a.meta.sessionId, /^dts-[a-z0-9]+-[a-z0-9]+$/);
  assert.notEqual(a.meta.sessionId, b.meta.sessionId);
  assert.deepEqual(plain(a.participant), { fullName: '', email: '', aiOpinion: '', registeredAt: null });
});

test('etiqueta exige nome completo, e-mail válido e uma frase', () => {
  const ok = Report.validateParticipant({ fullName: '  Ana   Paula  Costa ', email: ' Ana.Costa@Empresa.com ', aiOpinion: ' algo   que me ajuda ' });
  assert.equal(ok.valid, true);
  assert.deepEqual(plain(ok.value), { fullName: 'Ana Paula Costa', email: 'ana.costa@empresa.com', aiOpinion: 'algo que me ajuda' });

  const rejected = name => Report.validateParticipant({ fullName: name, email: 'a@b.co', aiOpinion: 'bem útil' }).errors.fullName;
  assert.ok(rejected('Ana'));
  assert.ok(rejected('J. Silva'));
  assert.ok(rejected('ana@empresa.com Silva'));
  assert.ok(rejected('Ana 2'));
  assert.equal(rejected('Ng Li'), undefined);
  assert.equal(rejected('João de Souza'), undefined);

  const email = value => Report.validateParticipant({ fullName: 'Ana Costa', email: value, aiOpinion: 'bem útil' }).errors.email;
  assert.ok(email('ana'));
  assert.ok(email('ana@empresa'));
  assert.ok(email('ana@empresa.c'));
  assert.equal(email('ana.costa@a-m.com.br'), undefined);

  assert.ok(Report.validateParticipant({ fullName: 'Ana Costa', email: 'a@b.co', aiOpinion: 'ótima' }).errors.aiOpinion);
  assert.equal(Report.firstName({ fullName: 'Ana Paula Costa' }), 'Ana');
});

test('participante só conta como pronto depois de registrado e válido', () => {
  const p = { fullName: 'Ana Costa', email: 'a@b.co', aiOpinion: 'bem útil', registeredAt: null };
  assert.equal(Report.isParticipantComplete(p), false);
  p.registeredAt = '2026-09-29T12:00:00.000Z';
  assert.equal(Report.isParticipantComplete(p), true);
  p.email = 'quebrado';
  assert.equal(Report.isParticipantComplete(p), false);
});

/* ------------------------------------------------------------ linha do diagnóstico */

test('a linha do caderno tem exatamente as colunas de resposta da aba Diagnóstico', () => {
  const gs = loadAppsScript();
  const fromSheet = schema(gs).filter(c => !c.calculada && c.titulo !== 'Recebido em').map(c => c.titulo);
  const fromNotebook = Object.keys(Report.diagnosisRecord(filledState()));
  assert.deepEqual(fromNotebook, fromSheet, 'mesmas colunas, na mesma ordem');
});

test('uma coluna por questão, com respostas legíveis e na ordem escolhida', () => {
  const state = filledState();
  const row = Report.diagnosisRecord(state);
  assert.equal(row['P01.1 · Claude Desktop'], '3 · Utilizo com frequência e autonomia em várias atividades.');
  assert.match(row['P01.6 · Compartilhamento'], /^1 · /);
  assert.equal(row['P02.1 · 1ª pista'], 'FLOWS · 3 Métodos parecidos');
  assert.equal(row['P02.2 · 2ª pista'], 'Pedido no Claude');
  assert.equal(row['P02.3 · 3ª pista'], 'Caneca sobre a mesa');
  assert.equal(row['P03.1 · 1ª peça ligada ao Prompt'], 'Skill');
  assert.equal(row['P03.2 · 2ª peça'], 'Método');
  assert.match(row['P04 · caminho escolhido'], /^C · FLOWS → /);
  assert.equal(row['P04 · perfil'], 'reutilização estruturada');
  assert.deepEqual([row['P05.1 · 1º elemento'], row['P05.2 · 2º elemento'], row['P05.3 · 3º elemento']], ['Objetivo', 'Contexto', 'Exemplo']);
  assert.deepEqual([row['P06.1 · 1ª peça'], row['P06.2 · 2ª peça'], row['P06.3 · 3ª peça']], ['Contexto', 'Objetivo', 'Tom']);
  assert.equal(row['P07 · pessoa retratada'], 'Ana Paula Costa');
  assert.equal(row['P07 · evolução entre rascunhos'], 35);
  assert.equal(row['P07 · leitura (0–100)'], 80);
  assert.equal(row['P02 · leitura (0–100)'], state.experience02.score);
  assert.equal(row['Índice consolidado (caderno)'], state.results.overallMaturityIndex);
  assert.equal(row['Status'], 'Concluído');
  assert.equal(row['Páginas concluídas (de 7)'], 7);
  assert.equal(row['Iniciado em'], '2026-09-29T12:00:00.000Z', 'começa na etiqueta (o mais antigo entre etiqueta e página 01)');
  assert.equal(row['Duração (min)'], 7);
  assert.equal(row[Report.AI_QUESTION.stem], state.participant.aiOpinion);
  assert.ok(JSON.stringify(row).length < 45000);
});

test('linha parcial: o que ainda não foi respondido vai vazio', () => {
  const state = Core.createInitialState();
  state.experience02.selectedSignals = ['prompt'];
  Core.recomputeAll(state);
  const row = Report.diagnosisRecord(state);
  assert.equal(row['P01.1 · Claude Desktop'], '');
  assert.equal(row['P02.1 · 1ª pista'], 'Pedido no Claude');
  assert.equal(row['P02.2 · 2ª pista'], '');
  assert.equal(row['P03 · leitura (0–100)'], '');
  assert.equal(row['Status'], 'Em andamento');
  assert.equal(row['Índice consolidado (caderno)'], '');
});

test('o mesmo conjunto de respostas gera sempre a mesma linha (reenvio não muda nada)', () => {
  const state = filledState();
  const before = JSON.stringify(Report.diagnosisRecord(state));
  state.meta.currentPage = 4;
  state.meta.updatedAt = new Date().toISOString();
  state.meta.ui.flipped = ['skill'];
  assert.equal(JSON.stringify(Report.diagnosisRecord(state)), before);
  const snapshot = Report.diagnosisRecord(state)['Estado completo (JSON)'];
  assert.equal('ui' in snapshot.meta, false);
  assert.equal('currentPage' in snapshot.meta, false);
});

test('páginas completas seguem as mesmas regras do caderno', () => {
  const state = Core.createInitialState();
  assert.equal(Report.countCompleteExperiences(state), 0);
  state.experience02.selectedSignals = ['prompt'];
  state.experience03.path = ['skill'];
  assert.equal(Report.isExperienceComplete(state, 2), true);
  assert.equal(Report.isExperienceComplete(state, 3), false);
  assert.equal(Report.countCompleteExperiences(filledState()), 7);
});

/* ------------------------------------------------------------ Apps Script */

test('configurarPlanilha monta Diagnóstico (seções + uma coluna por questão), Regras e Resumo', () => {
  const gs = loadAppsScript();
  gs.context.configurarPlanilha();
  ['Diagnóstico', 'Regras', 'Resumo'].forEach(name => assert.ok(gs.sheets.get(name), name));
  const { sheet, header } = gs.diag();
  const cols = schema(gs);
  assert.deepEqual(header, cols.map(c => c.titulo));
  assert.equal(sheet.cells[0][0], 'Identificação');
  assert.ok(sheet.cells[0].includes('Diagnóstico · calculado pela planilha'));
  assert.ok(sheet.cells[0].includes('P02 · O que chama sua atenção?'));
  assert.deepEqual(sheet.frozen, [2, 2]);
  assert.ok(sheet.merged.length >= 10);
  assert.ok(sheet.rules.length >= 7, 'níveis coloridos');
  assert.deepEqual(header.slice(9, 12), ['Nível diagnosticado', 'Índice consolidado', 'Próximo passo']);
  // notas dos cabeçalhos da página 01 = perguntas do caderno
  Core.LEVELING.dimensions.forEach((dim, i) => assert.ok(sheet.notes[`2:${header.indexOf(`P01.${i + 1} · ${dim.label}`) + 1}`].startsWith(dim.context)));
});

test('aba Regras nasce com os mesmos pesos, travas e faixas do caderno', () => {
  const gs = loadAppsScript();
  gs.context.configurarPlanilha();
  const L = Core.LEVELING;
  assert.deepEqual(gs.namedValues('Pesos_P01'), Array.from(L.dimensions, d => d.weight));
  const regras = gs.sheets.get('Regras').cells;
  const p01 = gs.named.get('Pesos_P01');
  assert.deepEqual(regras.slice(p01.r - 1, p01.r - 1 + 6).map(r => r[0]), Array.from(L.dimensions, d => d.label));
  assert.deepEqual(gs.namedValues('Trava_60'), [60]);
  assert.deepEqual(gs.namedValues('Trava_80'), [80]);
  assert.deepEqual(gs.namedValues('Pesos_Demonstrado'), Object.values(Core.CONFIG.demonstratedWeights).map(w => Math.round(w * 100)));
  assert.deepEqual([gs.namedValues('Peso_Declarado')[0], gs.namedValues('Peso_Demonstrado')[0]],
    [Core.CONFIG.overallWeights.declared * 100, Core.CONFIG.overallWeights.demonstrated * 100]);
  assert.deepEqual(gs.namedValues('Faixas_Nome'), Array.from(L.stages, s => s.label));
  assert.deepEqual(gs.namedValues('Faixas_Min'), Array.from(L.stages, s => s.min));
  L.stages.forEach((s, i) => { if (i) assert.equal(s.min, L.stages[i - 1].max + 1, 'faixas contíguas'); });
  assert.deepEqual(gs.namedValues('Faixas_Passo'), Array.from(L.stages, s => s.nextStep));
  assert.equal(gs.context.PERGUNTA_IA, Report.AI_QUESTION.stem);
});

test('cada envio vira uma linha por pessoa, com as fórmulas de diagnóstico na própria linha', () => {
  const gs = loadAppsScript();
  const state = filledState();
  const answer = gs.post(payload(state, 'inicio'));
  assert.equal(answer.sucesso, true);
  assert.equal(answer.gravado, 'Diagnóstico!3');
  gs.post(payload(state));
  let { rows, cell, header } = gs.diag();
  assert.equal(rows.length, 1, 'mesma sessão, mesma linha');
  const row = rows[0];
  assert.equal(cell(row, 'Nome completo'), 'Ana Paula Costa');
  assert.equal(cell(row, 'P02.1 · 1ª pista'), 'FLOWS · 3 Métodos parecidos');
  assert.equal(Object.prototype.toString.call(cell(row, 'Concluído em')), '[object Date]');
  assert.equal(JSON.parse(cell(row, 'Estado completo (JSON)')).meta.sessionId, state.meta.sessionId);

  const ref = title => `${gs.context.letra_(header.indexOf(title) + 1)}3`;
  assert.equal(cell(row, 'Nível diagnosticado'), `=IF(${ref('Índice consolidado')}="","",INDEX(Faixas_Nome,MATCH(ROUND(${ref('Índice consolidado')},0),Faixas_Min,1)))`);
  assert.ok(cell(row, 'Índice declarado').includes(`MIN(${ref('P01 · índice bruto')},IF(NOT(AND(LEFT(${ref('P01.2 · FLOWS')},1)*1>=2`));
  assert.ok(cell(row, 'Índice demonstrado').startsWith(`=IF(COUNT(${ref('P02 · leitura (0–100)')},`));
  const colIndex = letters => Array.from(letters).reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  schema(gs).filter(c => c.calculada).forEach(c => {
    const formula = cell(row, c.titulo);
    assert.ok(formula.startsWith('='), c.titulo);
    // toda referência de célula aponta para a linha 3 e para uma coluna existente
    for (const [, letters, n] of formula.replace(/"[^"]*"/g, '""').matchAll(/(?<![A-Za-z_])([A-Z]{1,2})(\d+)(?![\d(_])/g)) {
      assert.equal(n, '3', `${c.titulo}: ${letters}${n}`);
      assert.ok(header[colIndex(letters)], `${c.titulo}: coluna ${letters}`);
    }
    for (const [name] of formula.matchAll(/\b(Pesos_P01|Pesos_Demonstrado|Peso_Declarado|Peso_Demonstrado|Trava_60|Trava_80|Faixas_\w+|Tolerancia_Alinhamento)\b/g)) {
      assert.ok(gs.named.has(name), `${c.titulo}: intervalo nomeado ${name}`);
    }
  });

  const other = filledState();
  gs.post(payload(other));
  ({ rows } = gs.diag());
  assert.equal(rows.length, 2, 'outra sessão, outra linha');
  assert.match(gs.diag().cell(rows[1], 'Nível diagnosticado'), /ROUND\([A-Z]+4,0\)/);
});

test('o caderno não consegue escrever por cima das colunas calculadas', () => {
  const gs = loadAppsScript();
  const linha = Report.diagnosisRecord(filledState());
  linha['Nível diagnosticado'] = 'Multiplicação';
  linha['Índice declarado'] = 100;
  gs.post({ tipo: 'resultado_final', versao: 'x', linha });
  const { rows, cell } = gs.diag();
  assert.ok(cell(rows[0], 'Nível diagnosticado').startsWith('=IF('));
  assert.ok(cell(rows[0], 'Índice declarado').startsWith('=IF('));
});

test('Resumo e recalcularTudo usam só cabeçalhos que existem', () => {
  const gs = loadAppsScript();
  gs.context.configurarPlanilha();
  const titles = new Set(schema(gs).map(c => c.titulo));
  const formulas = gs.sheets.get('Resumo').cells.flatMap(row => row || []).map(String).filter(f => f.startsWith('='));
  assert.ok(formulas.length >= 14);
  for (const f of formulas) for (const [, t] of f.matchAll(/MATCH\("([^"]+)"/g)) assert.ok(titles.has(t), t);
  gs.post(payload(filledState()));
  const { sheet, header } = gs.diag();
  sheet.cells[2][header.indexOf('Nível diagnosticado')] = 'apagado sem querer';
  gs.context.recalcularTudo();
  assert.ok(gs.diag().cell(gs.diag().rows[0], 'Nível diagnosticado').startsWith('=IF('));
});

test('textos não viram fórmula, número ou data', () => {
  const gs = loadAppsScript();
  const state = filledState();
  state.participant.aiOpinion = '=HYPERLINK("http://exemplo.com","clique")';
  gs.post(payload(state));
  const { rows, cell } = gs.diag();
  assert.equal(cell(rows[0], Report.AI_QUESTION.stem), '\'=HYPERLINK("http://exemplo.com","clique")');
  assert.equal(gs.context.celula_('1/2'), "'1/2");
  assert.equal(gs.context.celula_('+55 11 99999-0000'), "'+55 11 99999-0000");
  assert.equal(gs.context.celula_('2 · Tenho acesso'), '2 · Tenho acesso');
  assert.equal(gs.context.celula_(12.5), 12.5);
  assert.equal(gs.context.celula_({ a: 1 }), '{"a":1}');
  assert.equal(gs.context.celula_('x'.repeat(50000)).length, 45001);
});

test('recusa pedidos incompletos sem gravar nada', () => {
  const gs = loadAppsScript();
  assert.equal(gs.post('isto não é json').sucesso, false);
  assert.equal(gs.post({ tipo: 'outro', linha: { 'ID da sessão': 'x' } }).sucesso, false);
  const noKey = gs.post({ tipo: 'inicio', linha: { 'Nome completo': 'Sem ID' } });
  assert.equal(noKey.sucesso, false);
  assert.match(noKey.erro, /ID da sessão/);
  assert.equal(gs.post({ tipo: 'etapa', linha: null }).sucesso, false);
  assert.equal(gs.sheets.get('Diagnóstico'), undefined);
});

test('testarEnvio grava uma pessoa completa e apagarLinhasDeTeste limpa', () => {
  const gs = loadAppsScript();
  assert.equal(JSON.parse(gs.context.testarEnvio()).sucesso, true);
  const { rows, cell } = gs.diag();
  assert.equal(rows.length, 1);
  assert.equal(cell(rows[0], 'P01.3 · Skills'), '3 · resposta de teste');
  assert.equal(cell(rows[0], 'Índice consolidado (caderno)'), 78.35);
  assert.equal(gs.context.apagarLinhasDeTeste(), 1);
  assert.equal(gs.diag().rows.length, 0);
  assert.equal(JSON.parse(gs.context.doGet().getContent()).sucesso, true);
});
