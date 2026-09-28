// FLOWS · O Fio Dourado (v8): the cut — shots, text and transitions (seconds of this film).
// Read by src/film8.js (picture) and audio/soundtrack8.py (via tools/cut8json.mjs), so the
// sound follows the same edit. Plain data plus the monotone time maps.
import { warp } from './util.js';
export const FPS = 24;
export const REF1_END = 313 / FPS; // the reference clip, 13.04 s
export const SHOTS = [
  { a: 0, b: REF1_END, kind: 'foot', clip: 'ref1', map: [[0, 0], [REF1_END, REF1_END]] },
  // Todos Sabem: the thread flies into the Biblioteca (FLOWS screen), then the 441 skills of the library ring
  { a: REF1_END, b: 24.0, kind: '3d', map: [[REF1_END, 25.9], [17.4, 29.3], [19.0, 32.2], [24.0, 38.0]], show: ['k'] },
  // Todos Usam: Fabio smiles, winks and snaps; the button appears by his hand
  { a: 24.0, b: 27.8, kind: 'comp', map: [[24.0, 50.3], [27.8, 51.3]], cam: 'usam', fab: { from: 0.4, to: 3.75, dist: 300, x: 0.19, s: 1.0 } },
  { a: 27.8, b: 31.9, kind: '3d', map: [[27.8, 52.46], [31.9, 57.1]] },                                   // the button, the modal
  { a: 31.9, b: 37.9, kind: '3d', map: [[31.9, 58.1], [33.9, 62.3], [34.5, 64.0], [37.9, 70.3]] },       // the name and its anatomy
  { a: 37.9, b: 39.5, kind: '3d', map: [[37.9, 72.0], [39.5, 74.5]] },                                   // where it was tested
  { a: 39.5, b: 41.3, kind: '3d', map: [[39.5, 79.3], [41.3, 81.8]] },                                   // the model
  { a: 41.3, b: 43.1, kind: '3d', map: [[41.3, 87.5], [43.1, 91.4]] },                                   // SKILL.zip
  { a: 43.1, b: 44.1, kind: '3d', map: [[43.1, 97.0], [44.1, 98.6]] },                                   // Detalhes: Template
  { a: 44.1, b: 45.3, kind: '3d', map: [[44.1, 100.3], [45.3, 102.4]] },                                 // área DTS
  { a: 45.3, b: 46.8, kind: '3d', map: [[45.3, 104.0], [46.8, 107.3]] },                                 // co-responsáveis
  { a: 46.8, b: 48.8, kind: '3d', map: [[46.8, 108.3], [48.8, 112.8]] },                                 // descrição
  { a: 48.8, b: 49.9, kind: '3d', map: [[48.8, 113.4], [49.9, 114.7]] },                                 // Compartilhar Skill
  // Somos Exemplo: the card flies to the mural (442), the pillar, the golden arcs to everyone
  { a: 49.9, b: 56.9, kind: '3d', map: [[49.9, 116.2], [51.1, 117.8], [55.1, 122.3], [56.9, 124.3]], show: ['k'] },
  { a: 56.9, b: 67.1, kind: '3d', map: [[56.9, 126.0], [59.9, 129.3], [61.9, 133.0], [65.1, 137.5], [67.1, 139.4]] },
  // the ranking: the podium rises; Fabio in the foreground as the trophy lands on DTS; the Nº 1 plate
  { a: 67.1, b: 70.9, kind: '3d', map: [[67.1, 139.4], [70.9, 145.2]], show: ['rank'] },
  { a: 70.9, b: 75.1, kind: 'comp', map: [[70.9, 145.3], [75.1, 147.7]], cam: 'rank', fab: { from: 0.1, to: 2.65, dist: 300, x: -0.21, s: 1.0 }, show: ['rank'] },
  { a: 75.1, b: 79.9, kind: '3d', map: [[75.1, 147.7], [79.9, 151.0]], show: ['rank'] },
  { a: 79.9, b: 88.5, kind: '3d', map: [[79.9, 151.0], [81.5, 154.9], [88.5, 164.3]], show: ['end'] },
];
export const DURATION = SHOTS[SHOTS.length - 1].b;
SHOTS.forEach((s) => { s.f = warp(s.map); });


// text (seconds of this film). subs: [from, to, text]; lockups: [from, to, kicker, line, colors]
export const SUBS8 = [
  [13.3, 18.2, 'Na *Biblioteca de Skills*, cada skill tem sua *pontuação*.'],
  [28.1, 31.7, 'Clique em *Compartilhar Skill*.'],
  [32.1, 37.7, 'Dê um nome padrão: *área*, *service line* e *entregável*.'],
  [38.1, 42.9, 'Informe onde testou, o *modelo* e envie o *SKILL.zip*.'],
  [43.3, 47.9, 'Em *Detalhes*: Template, *área DTS* e descrição.'],
  [47.9, 51.1, 'E clique em *Compartilhar Skill*.'],
  [53.1, 56.9, 'Publicada: *+1 skill de DTS* na Biblioteca.'],
  [62.5, 67.1, 'Cada skill compartilhada vira *referência* para todos.'],
  [71.1, 75.7, 'No ranking de áreas, *DTS é nº 1* entre 12 áreas.'],
];
export const LOCK8 = [
  [8.3, 12.8, 'Pilar 01 · Todos Sabem', 'Tudo o que DTS sabe, em um só lugar', ['#d3e6ff', '#3d8bff'], 'top'],
  [24.2, 27.55, 'Pilar 02 · Todos Usam', 'Compartilhe sua skill no FLOWS', ['#ffe1c2', '#ff8a1f'], 'left'],
  [59.1, 62.8, 'Pilar 03 · Somos Exemplo', 'Quem compartilha, lidera pelo exemplo', ['#ffecc2', '#f2b544'], ''],
];
// the golden thread across the big cuts (time, from x, to x, y) and the white-gold flashes
export const STREAKS = [[REF1_END, 380, 1780, 560], [24.0, 1700, 260, 520]];
export const FLASHES = [[26.97, 0.05, 0.32, 0.3], [27.8, 0.32, 0.4, 0.85], [REF1_END, 0.28, 0.35, 0.5]]; // [peak, rise, fall, amount]: the snap, the cut after it, the thread
export const SNAP = 26.95; // Fabio's finger snap (clip time 3.0 s, 3.35 s of clip over 3.8 s)

