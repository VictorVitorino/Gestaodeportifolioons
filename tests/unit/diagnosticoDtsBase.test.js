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
const PAGE_NAMES = { 1: 'Meu ponto de partida', 2: 'O que chama sua atenção?', 3: 'Quem está mais perto?', 4: 'Por onde você iria?',
  5: 'A Skill que ninguém merece', 6: 'Salve este Prompt', 7: 'Retrato Falado DTS' };
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

/* ------------------------------------------------------------ linhas para a planilha */

test('linha de participante resume progresso e status', () => {
  const state = filledState();
  const row = Report.participantRecord(state, PAGE_NAMES);
  assert.equal(row['ID da sessão'], state.meta.sessionId);
  assert.equal(row['Nome completo'], 'Ana Paula Costa');
  assert.equal(row[Report.AI_QUESTION.stem], state.participant.aiOpinion);
  assert.equal(row['Status'], 'Concluído');
  assert.equal(row['Páginas concluídas (de 7)'], 7);
  assert.equal(row['Página mais avançada'], 'Encerramento');

  const midway = Core.createInitialState();
  midway.meta.maxReachedPage = 3;
  const early = Report.participantRecord(midway, PAGE_NAMES);
  assert.equal(early['Status'], 'Em andamento');
  assert.equal(early['Página mais avançada'], 'Página 03 · Quem está mais perto?');
  assert.equal(early['Páginas concluídas (de 7)'], 0);
});

test('linhas de etapa são legíveis e guardam a ordem das pistas', () => {
  const state = filledState();
  const p2 = Report.stageRecord(state, 2, PAGE_NAMES);
  assert.equal(p2['Página'], 'P02');
  assert.equal(p2['Experiência'], 'O que chama sua atenção?');
  assert.equal(p2['Respostas'], '1. FLOWS · 3 Métodos parecidos\n2. Pedido no Claude\n3. Caneca sobre a mesa');
  assert.equal(p2['Leitura interna (0–100)'], state.experience02.score);
  assert.deepEqual(plain(p2['Detalhe (JSON)']), { pistasEmOrdem: ['flows', 'prompt', 'coffee'] });

  assert.equal(Report.stageRecord(state, 3, PAGE_NAMES)['Respostas'], 'Prompt → Skill → Método');
  assert.match(Report.stageRecord(state, 4, PAGE_NAMES)['Respostas'], /^Rota C: FLOWS → .*\(reutilização estruturada\)$/);
  assert.match(Report.stageRecord(state, 1, PAGE_NAMES)['Respostas'], /^Claude Desktop: Utilizo com frequência/);
  const p7 = Report.stageRecord(state, 7, PAGE_NAMES)['Respostas'];
  assert.match(p7, /^Retratado: Ana Paula Costa\nRascunho nº 1: Desenhe a Ana Paula sorrindo\.\nRascunho nº 2: Contexto:/);
});

test('linha de resultado abre tudo em colunas, sem misturar declarado e demonstrado', () => {
  const state = filledState();
  const row = Report.resultRecord(state);
  assert.equal(row['P01 · Claude Desktop (0–3)'], 3);
  assert.equal(row['Declarado · final (%)'], state.declared.finalIndex);
  assert.equal(row['Faixa declarada'], Core.getLevelingStage(state.declared.finalIndex).label);
  assert.equal(row['P02 · pistas (em ordem)'], 'FLOWS · 3 Métodos parecidos → Pedido no Claude → Caneca sobre a mesa');
  assert.equal(row['Índice demonstrado'], Math.round(state.results.demonstratedIndex * 100) / 100);
  assert.equal(row['Duração (min)'], 6.5);
  assert.equal(row['P07 · retratado'], 'Ana Paula Costa');
  assert.equal(row['P07 · evolução entre rascunhos'], 35);
  assert.notEqual(row['Declarado · final (%)'], row['Índice demonstrado']);
  const snapshot = row['Estado completo (JSON)'];
  assert.equal(snapshot.meta.sessionId, state.meta.sessionId);
  assert.equal('ui' in snapshot.meta, false);
  assert.equal('currentPage' in snapshot.meta, false);
  assert.ok(JSON.stringify(row).length < 45000);
});

test('o mesmo conjunto de respostas gera sempre a mesma linha (reenvio não muda nada)', () => {
  const state = filledState();
  const before = JSON.stringify(Report.resultRecord(state));
  state.meta.currentPage = 4;
  state.meta.updatedAt = new Date().toISOString();
  state.meta.ui.flipped = ['skill'];
  assert.equal(JSON.stringify(Report.resultRecord(state)), before);
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

/* ------------------------------------------------------------ Apps Script (planilha simulada) */

function loadAppsScript() {
  const sheets = new Map();
  const makeSheet = name => {
    const sheet = {
      name, cells: [], frozen: 0,
      getLastRow() { for (let r = sheet.cells.length - 1; r >= 0; r--) if ((sheet.cells[r] || []).some(v => v !== '' && v != null)) return r + 1; return 0; },
      getLastColumn() { let max = 0; sheet.cells.forEach(row => (row || []).forEach((v, c) => { if (v !== '' && v != null) max = Math.max(max, c + 1); })); return max; },
      getRange(r, c, nr = 1, nc = 1) { return makeRange(sheet, r, c, nr, nc); },
      setFrozenRows(n) { sheet.frozen = n; },
      setColumnWidth() {},
      clear() { sheet.cells.length = 0; },
      deleteRow(r) { sheet.cells.splice(r - 1, 1); }
    };
    return sheet;
  };
  const makeRange = (sheet, r, c, nr, nc) => {
    const target = {
      getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => {
        const v = (sheet.cells[r - 1 + i] || [])[c - 1 + j];
        return v == null ? '' : v;
      })),
      setValues(values) {
        assert.equal(values.length, nr);
        values.forEach((row, i) => {
          assert.equal(row.length, nc);
          row.forEach((v, j) => { const rr = r - 1 + i; sheet.cells[rr] = sheet.cells[rr] || []; sheet.cells[rr][c - 1 + j] = v; });
        });
        return proxy;
      },
      setValue: v => target.setValues([[v]]),
      setFormula: f => target.setValues([[f]])
    };
    const proxy = new Proxy(target, { get: (t, key) => (key in t ? t[key] : () => proxy) });
    return proxy;
  };
  const spreadsheet = {
    getSheetByName: name => sheets.get(name) || null,
    insertSheet(name) { const s = makeSheet(name); sheets.set(name, s); return s; }
  };
  const context = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: text => ({ text, setMimeType() { return this; }, getContent() { return this.text; } })
    },
    Logger: { log() {} }
  });
  vm.runInContext(appsScript, context);
  const table = name => {
    const sheet = sheets.get(name);
    if (!sheet) return null;
    const [header = [], ...rows] = sheet.cells;
    return { header, rows: rows.filter(row => row && row.some(v => v !== '' && v != null)), sheet };
  };
  const post = payload => JSON.parse(context.doPost({ postData: { contents: typeof payload === 'string' ? payload : JSON.stringify(payload) } }).getContent());
  return { context, sheets, table, post };
}

// Exatamente o corpo que o caderno envia (Sync.put).
const payload = (tipo, state, linha) => ({ tipo, versao: Report.VERSION, participante: Report.participantRecord(state, PAGE_NAMES), linha: linha || null });

test('Apps Script: participante, etapas e resultado viram linhas atualizáveis', () => {
  const gs = loadAppsScript();
  const state = filledState();

  assert.equal(gs.post(payload('inicio', state)).sucesso, true);
  let people = gs.table('Participantes');
  assert.equal(people.rows.length, 1);
  assert.deepEqual(people.header.slice(0, 4), ['ID da sessão', 'Nome completo', 'E-mail', Report.AI_QUESTION.stem]);
  assert.equal(people.header.at(-1), 'Recebido em');
  assert.equal(people.sheet.frozen, 1);

  state.participant.fullName = 'Ana Paula da Costa';
  gs.post(payload('inicio', state));
  people = gs.table('Participantes');
  assert.equal(people.rows.length, 1, 'mesma sessão atualiza a mesma linha');
  assert.equal(people.rows[0][1], 'Ana Paula da Costa');

  gs.post(payload('etapa', state, Report.stageRecord(state, 2, PAGE_NAMES)));
  gs.post(payload('etapa', state, Report.stageRecord(state, 2, PAGE_NAMES)));
  gs.post(payload('etapa', state, Report.stageRecord(state, 3, PAGE_NAMES)));
  const stages = gs.table('Etapas');
  assert.equal(stages.rows.length, 2);
  const detail = stages.header.indexOf('Detalhe (JSON)');
  assert.equal(stages.rows[0][detail], '{"pistasEmOrdem":["flows","prompt","coffee"]}');

  const result = gs.post(payload('resultado_final', state, Report.resultRecord(state)));
  assert.equal(result.sucesso, true);
  assert.deepEqual(Array.from(result.gravados), ['Participantes!2', 'Resultados!2']);
  const results = gs.table('Resultados');
  assert.equal(results.rows.length, 1);
  const col = name => results.header.indexOf(name);
  assert.equal(Object.prototype.toString.call(results.rows[0][col('Concluído em')]), '[object Date]');
  assert.equal(results.rows[0][col('P01 · Claude Desktop (0–3)')], 3);
  assert.equal(JSON.parse(results.rows[0][col('Estado completo (JSON)')]).meta.sessionId, state.meta.sessionId);

  const other = filledState();
  gs.post(payload('resultado_final', other, Report.resultRecord(other)));
  assert.equal(gs.table('Resultados').rows.length, 2, 'outra sessão, outra linha');
  assert.equal(gs.table('Participantes').rows.length, 2);
});

test('Apps Script: textos não viram fórmula, número ou data', () => {
  const gs = loadAppsScript();
  const state = filledState();
  state.participant.aiOpinion = '=HYPERLINK("http://exemplo.com","clique")';
  gs.post(payload('inicio', state));
  const people = gs.table('Participantes');
  assert.equal(people.rows[0][people.header.indexOf(Report.AI_QUESTION.stem)], '\'=HYPERLINK("http://exemplo.com","clique")');
  assert.equal(gs.context.celula_('1/2'), "'1/2");
  assert.equal(gs.context.celula_('+55 11 99999-0000'), "'+55 11 99999-0000");
  assert.equal(gs.context.celula_(12.5), 12.5);
  assert.equal(gs.context.celula_('P03'), 'P03');
  assert.equal(gs.context.celula_({ a: 1 }), '{"a":1}');
  assert.equal(gs.context.celula_('x'.repeat(50000)).length, 45001);
});

test('Apps Script: recusa pedidos incompletos sem gravar nada', () => {
  const gs = loadAppsScript();
  assert.equal(gs.post('isto não é json').sucesso, false);
  assert.equal(gs.post({ tipo: 'outro', participante: { 'ID da sessão': 'x' } }).sucesso, false);
  const noKey = gs.post({ tipo: 'inicio', participante: { 'Nome completo': 'Sem ID' } });
  assert.equal(noKey.sucesso, false);
  assert.match(noKey.erro, /ID da sessão/);
  assert.equal(gs.post({ tipo: 'etapa', participante: null, linha: null }).sucesso, false);
  assert.equal(gs.table('Participantes'), null);
});

test('Apps Script: resumo acha as colunas pelos cabeçalhos que o caderno envia', () => {
  const gs = loadAppsScript();
  gs.context.configurarPlanilha();
  ['Participantes', 'Etapas', 'Resultados', 'Resumo'].forEach(name => assert.ok(gs.sheets.get(name), name));
  const formulas = gs.sheets.get('Resumo').cells.map(row => String(row[1] || '')).filter(f => f.startsWith('='));
  assert.ok(formulas.length >= 10);

  const state = filledState();
  const known = new Set([...Object.keys(Report.participantRecord(state, PAGE_NAMES)), ...Object.keys(Report.resultRecord(state))]);
  const referenced = [...appsScript.matchAll(/coluna\([PR], '([^']+)'\)|contar\([PR], '([^']+)'|media\('([^']+)'\)/g)].map(m => m[1] || m[2] || m[3]);
  assert.ok(referenced.length >= 7);
  referenced.forEach(header => assert.ok(known.has(header), `cabeçalho "${header}" não existe nas linhas do caderno`));

  assert.deepEqual(Array.from(gs.context.FAIXAS), Array.from(Core.LEVELING.stages, s => s.label));
  assert.equal(gs.context.PERGUNTA_IA, Report.AI_QUESTION.stem);
  assert.deepEqual(Array.from(gs.context.ABAS.etapa.chaves), [Report.COLUMNS.session, Report.COLUMNS.page]);
});

test('Apps Script: testarEnvio grava e apagarLinhasDeTeste limpa', () => {
  const gs = loadAppsScript();
  assert.equal(JSON.parse(gs.context.testarEnvio()).sucesso, true);
  assert.equal(gs.table('Participantes').rows.length, 1);
  assert.equal(gs.table('Etapas').rows.length, 1);
  assert.equal(gs.context.apagarLinhasDeTeste(), 2);
  assert.equal(gs.table('Participantes').rows.length, 0);
  const status = JSON.parse(gs.context.doGet().getContent());
  assert.equal(status.sucesso, true);
});
