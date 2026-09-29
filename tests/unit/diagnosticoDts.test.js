import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../../prototypes/diagnostico-dts/index.html', import.meta.url), 'utf8');

function loadCore() {
  const match = html.match(/<script id="dts-core">([\s\S]*?)<\/script>/);
  assert.ok(match, 'bloco dts-core não encontrado');
  const context = vm.createContext({});
  vm.runInContext(match[1], context);
  return context.DTSCore;
}

const Core = loadCore();
const answers = (claude, flows, skills, methods, reuse, creationSharing) => ({ claude, flows, skills, methods, reuse, creationSharing });

test('pesos do nivelamento inicial somam 100%', () => {
  assert.equal(Core.LEVELING.dimensions.reduce((sum, d) => sum + d.weight, 0), 100);
});

test('pesos do índice demonstrado somam 100%', () => {
  const total = Object.values(Core.CONFIG.demonstratedWeights).reduce((sum, w) => sum + w, 0);
  assert.equal(Math.round(total * 100), 100);
});

test('declaredIndex vai de 0 a 100', () => {
  assert.equal(Core.calculateDeclaredIndex(answers(0, 0, 0, 0, 0, 0)).finalIndex, 0);
  const full = Core.calculateDeclaredIndex(answers(3, 3, 3, 3, 3, 3));
  assert.equal(full.finalIndex, 100);
  assert.equal(full.stage, 'multiplication');
});

test('declaredIndex fica nulo enquanto a matriz está incompleta', () => {
  assert.equal(Core.calculateDeclaredIndex(answers(3, 3, 3, 3, 3, null)).finalIndex, null);
});

test('trava de 60%: FLOWS abaixo de 2', () => {
  const result = Core.calculateDeclaredIndex(answers(3, 1, 3, 3, 3, 3));
  assert.equal(result.rawIndex, 86.67);
  assert.equal(result.finalIndex, 60);
  assert.equal(result.appliedCap, 60);
  assert.equal(result.stage, 'evolution');
});

test('trava de 60%: Skills e Métodos abaixo de 2', () => {
  const result = Core.calculateDeclaredIndex(answers(3, 3, 1, 1, 3, 3));
  assert.equal(result.finalIndex, 60);
});

test('trava de 80%: Criação & Compartilhamento abaixo de 2', () => {
  const result = Core.calculateDeclaredIndex(answers(3, 3, 3, 3, 3, 1));
  assert.equal(result.rawIndex, 90);
  assert.equal(result.finalIndex, 80);
  assert.equal(result.appliedCap, 80);
  assert.equal(result.stage, 'autonomy');
});

test('trava de 80%: nenhuma dimensão Skills/Métodos/Criação em 3', () => {
  const result = Core.calculateDeclaredIndex(answers(3, 3, 2, 2, 3, 2));
  assert.equal(result.rawIndex, 81.67);
  assert.equal(result.finalIndex, 80);
});

test('sem trava quando as regras de coerência são atendidas', () => {
  const result = Core.calculateDeclaredIndex(answers(3, 3, 3, 2, 3, 2));
  assert.equal(result.appliedCap, null);
  assert.equal(result.finalIndex, result.rawIndex);
});

test('faixas do nivelamento', () => {
  const stage = v => Core.getLevelingStage(v).key;
  assert.equal(stage(0), 'start');
  assert.equal(stage(20), 'start');
  assert.equal(stage(21), 'exploration');
  assert.equal(stage(40), 'exploration');
  assert.equal(stage(41), 'evolution');
  assert.equal(stage(60), 'evolution');
  assert.equal(stage(61), 'autonomy');
  assert.equal(stage(80), 'autonomy');
  assert.equal(stage(81), 'multiplication');
  assert.equal(stage(100), 'multiplication');
});

test('grafo semântico: menor caminho', () => {
  const d = (a, b) => Core.calculateSemanticDistance(a, b);
  assert.equal(d('prompt', 'skill'), 1);
  assert.equal(d('prompt', 'method'), 2);
  assert.equal(d('prompt', 'flows'), 2);
  assert.equal(d('prompt', 'agent'), 3);
  assert.equal(d('prompt', 'mcp'), 4);
  assert.equal(d('prompt', 'tools'), 5);
  assert.equal(d('skill', 'flows'), 1);
  assert.equal(d('method', 'flows'), 1);
  assert.equal(d('context', 'tools'), 6);
  assert.deepEqual(Array.from(Core.findShortestPath('prompt', 'agent')), ['prompt', 'skill', 'method', 'agent']);
});

test('conversão distância → proximidade', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(Core.calculateSemanticProximity), [100, 75, 50, 25, 15, 15]);
});

test('experiência 03 usa a peça escolhida como nova âncora', () => {
  assert.equal(Core.calculateExperience03(['skill', 'method'], 'prompt').score, 100);
  assert.equal(Core.calculateExperience03(['tools', 'mcp'], 'prompt').score, 57.5);
  const flowsAgent = Core.calculateExperience03(['flows', 'agent'], 'prompt');
  assert.deepEqual(Array.from(flowsAgent.distances), [2, 2]);
  assert.equal(flowsAgent.score, 75);
  assert.deepEqual(Array.from(flowsAgent.semanticPath), ['prompt', 'flows', 'agent']);
});

test('experiência 02 compara com o máximo possível para a mesma quantidade', () => {
  assert.equal(Core.calculateExperience02(['prompt', 'skills', 'flows']), 100);
  assert.equal(Core.calculateExperience02(['happyHour']), 0);
  assert.equal(Core.calculateExperience02(['tabs', 'deadline', 'prompt']), 55.56);
  assert.equal(Core.calculateExperience02([]), null);
  // pistas da cena redesenhada: ata (contexto) 3, mapa de outro projeto (reutilização informal) 2, happy hour 0
  assert.equal(Core.calculateExperience02(['minutes', 'pastMap', 'happyHour']), 55.56);
  assert.equal(Core.calculateExperience02(['pastMap']), 66.67);
  assert.equal(Core.EXPERIENCES.experience02.signals.length, 10);
});

test('experiências 04, 05 e 06', () => {
  assert.deepEqual({ ...Core.calculateExperience04('C') }, { score: 80, behaviorProfile: 'structured-reuse' });
  assert.equal(Core.calculateExperience04('D').score, 95);
  assert.equal(Core.calculateExperience05(['objective', 'context', 'emoji']), 71.67);
  assert.equal(Core.calculateExperience06(['context', 'objective', 'outputFormat']), 98.33);
});

test('análise estrutural do rascunho encontra os sete sinais', () => {
  const rich = 'Contexto: homenagem ao time DTS no encerramento do projeto. Desenhe PERSONAGEM_01, uma pessoa alta, de óculos, ' +
    'cabelo cacheado e sorriso largo, regendo uma orquestra de Skills num palco. Estilo caricatura em lápis colorido. ' +
    'Resultado: imagem de corpo inteiro, formato horizontal, fundo claro.';
  const analysis = Core.analyzePromptStructure(rich, { characterName: 'PERSONAGEM_01' });
  assert.equal(analysis.structureScore, 100);
  assert.ok(analysis.signals.every(s => s.status === 'present'));

  const poor = Core.analyzePromptStructure('faz um desenho engraçado');
  assert.ok(poor.structureScore < 40);
  assert.equal(poor.signals.find(s => s.id === 'style').status, 'present');
  assert.equal(poor.signals.find(s => s.id === 'context').status, 'explore');
});

test('learningDelta nunca é negativo', () => {
  assert.equal(Core.calculateLearningDelta(40, 75), 35);
  assert.equal(Core.calculateLearningDelta(70, 55), 0);
  assert.equal(Core.calculateLearningDelta(70, null), null);
});

test('recomputeAll mantém declarado e demonstrado separados', () => {
  const state = Core.createInitialState();
  Object.assign(state.declared, answers(3, 2, 2, 2, 2, 1));
  state.experience02.selectedSignals = ['prompt', 'flows', 'happyHour'];
  state.experience03.path = ['skill', 'method'];
  state.experience04.selectedPath = 'C';
  state.experience05.selectedElements = ['objective', 'context', 'example'];
  state.experience06.selectedPromptElements = ['context', 'objective', 'tone'];
  state.experience07.originalStructureScore = 45;
  state.experience07.revisedStructureScore = 80;
  Core.recomputeAll(state);

  assert.equal(state.declared.finalIndex, 65);
  assert.equal(state.declared.appliedCap, null);
  assert.equal(state.experience02.score, 66.67);
  assert.equal(state.experience03.score, 100);
  assert.equal(state.experience07.score, 80);
  assert.equal(state.experience07.learningDelta, 35);

  const expected = 66.67 * 0.15 + 100 * 0.2 + 80 * 0.2 + 93.33 * 0.15 + 88.33 * 0.15 + 80 * 0.15;
  assert.ok(Math.abs(state.results.demonstratedIndex - expected) < 0.02);
  assert.ok(Math.abs(state.results.overallMaturityIndex - (65 * 0.3 + state.results.demonstratedIndex * 0.7)) < 0.02);
  assert.equal(state.results.alignmentIndex, Math.round((100 - state.results.alignmentGap) * 100) / 100);
  assert.notEqual(state.declared.finalIndex, state.results.demonstratedIndex);
  assert.ok(state.results.dimensionProfile.declared.reuseBehavior != null);
  assert.ok(state.results.dimensionProfile.demonstrated.semanticUnderstanding != null);
});

test('sem revisão, a experiência 07 usa o rascunho original', () => {
  const state = Core.createInitialState();
  state.experience07.originalStructureScore = 62;
  Core.recomputeAll(state);
  assert.equal(state.experience07.score, 62);
  assert.equal(state.experience07.learningDelta, null);
});

test('o caderno tem exatamente 7 experiências', () => {
  const pages = html.match(/\{ id: 'xp0\d', n: \d/g) || [];
  assert.equal(pages.length, 7);
});

test('vocabulário de gabarito não aparece no código', () => {
  assert.doesNotMatch(html, /correctAnswer|wrongAnswer|isCorrect/);
});
