// FLOWS · O Fio Dourado (v9): the cut — Fabio's journey in one flow (seconds of this film).
// Footage: the opening (ref1), his touch on the Biblioteca de Skills and the portal into the FLOWS
// universe (cont), the Publicar skill button he offers us (i28). A golden iris opens from the pressed
// button into the 3D FLOWS, which then plays as one continuous take (the v7 film at a calm, readable
// pace) with camera detours to Fabio, who is now in the world in full body (the model-sheet poses).
// Read by src/film9.js (picture) and audio/soundtrack9.py (via tools/cut9json.mjs).
import { warp } from './util.js';
export const FPS = 24;

// ------------------------------------------------------------------ footage
export const CLIPS = {
  ref1: { dir: 'clips/ref1', pfx: 'r_', fps: 24, n: 313 },
  cont: { dir: 'clips/cont', pfx: 'c_', fps: 30, n: 388 },
  i28: { dir: 'clips/i28', pfx: 'i_', fps: 30, n: 174 },
};
export const REF1_END = 313 / FPS;                       // 13.04: he reaches for the Biblioteca panel
export const T_I28 = 22.2;                              // the orbit: cont dissolves into i28
export const PRESS = 27.62;                             // the finger presses Publicar skill (i28 5.72 s)
export const T3D = PRESS;                               // the 3D take starts under the iris
export const IRIS = { t: PRESS, dur: 0.8, x: 952, y: 766, clip: 'i28' };  // the button's centre under the finger

// ------------------------------------------------------------------ the 3D take (v9 T -> v7 film time)
// one monotone map: the camera never cuts; the speeds follow the reading (1.0 = the v7 pace)
const TAKE = [
  [T3D, 57.3],
  [34.3, 64.0],      // the modal, the [DTS] tiles, the name typed
  [40.8, 70.4],      // the name's anatomy (prefixo · service line · entregável)
  [47.3, 77.6],      // onde foi testada
  [54.6, 85.6],      // modelo testado, tempo manual
  [61.1, 93.0],      // SKILL.zip
  [65.1, 96.2],      // Próximo
  [69.3, 100.0],     // Detalhes: Template
  [73.6, 103.7],     // área responsável
  [78.1, 107.7],     // co-responsáveis
  [84.0, 113.0],     // descrição
  [87.4, 116.2],     // Compartilhar Skill
  [93.6, 122.6],     // the card folds, flies, lands on the mural
  [99.4, 126.6],     // 442 (Fabio presents it)
  [105.6, 134.6],    // Pilar 03 · Somos Exemplo
  [111.9, 140.9],    // the golden arcs to everyone (Fabio, arms open)
  [116.8, 145.3],    // the ranking rises
  [122.4, 148.6],    // DTS nº 1 (Fabio points at the one)
  [125.8, 151.0],    // 87 publicações · 142 adoções
  [136.2, 164.3],    // the end card (Fabio waves goodbye)
];
export const SHOTS = [
  { a: 0, b: REF1_END, kind: 'foot', clip: 'ref1', map: [[0, 0], [REF1_END, REF1_END]] },
  // the cut on his reach: he touches the panel, the portal opens, the skills orbit around him
  { a: REF1_END, b: T_I28 + 0.4, kind: 'foot', clip: 'cont', map: [[REF1_END, 0.0], [15.5, 2.3], [T_I28 + 0.4, 9.2]] },
  // the same orbit (i28), the descent, the button he offers, the press (the button beat slowed a little)
  { a: T_I28, b: PRESS + IRIS.dur, kind: 'foot', clip: 'i28', mixIn: 0.4, map: [[T_I28, 1.05], [24.35, 3.2], [PRESS, 5.72], [PRESS + IRIS.dur, 5.78]] },
  { a: T3D, b: TAKE[TAKE.length - 1][0], kind: '3d', map: TAKE },
];
export const DURATION = SHOTS[SHOTS.length - 1].b;
SHOTS.forEach((s) => { s.f = warp(s.map); });
export const TAKE_F = SHOTS[3].f;

// v7 graphics kept in the take, by v7 film time: counters, ranking plates, end card
export const SHOW = [['k', 118.0, 127.2], ['rank', 140.9, 151.2], ['end', 151.0, 999]];

// ------------------------------------------------------------------ Fabio in the world (full body)
// pose: a matted pose (fabio_poses/<pose>/p_###.png, 24 fps), looped back and forth; placed standing
// on the floor at pos (world units, the floor is y = 0), height h; he materialises in golden light.
// cam: the detour camera (blended in and out of the take's camera), shot-local u in 0..1.
export const STANDS = [
  { id: 'present', a: 93.2, b: 99.9, pose: 'present', frames: [1, 72], pos: [299, 0, -1408], h: 178, inAt: 93.8, outAt: 99.3,
    cam: { a: 93.2, b: 99.9, fin: 1.2, fout: 1.0, from: { P: [-60, 135, -760], T: [260, 200, -2250] }, to: { P: [-40, 140, -800], T: [255, 202, -2250] }, fov: 34 } },
  { id: 'welcome', a: 105.2, b: 112.2, pose: 'welcome', frames: [1, 40], pos: [-221, 0, 179], h: 178, inAt: 105.9, outAt: 111.6,
    cam: { a: 105.2, b: 112.2, fin: 1.2, fout: 1.0, from: { P: [60, 150, 820], T: [-60, 250, -1400] }, to: { P: [40, 155, 780], T: [-60, 252, -1400] }, fov: 36 } },
  { id: 'rank1', a: 116.5, b: 122.6, pose: 'rank1', frames: [1, 72], pos: [-590, 0, 420], h: 178, inAt: 117.0, outAt: 122.1,
    cam: { a: 116.5, b: 122.6, fin: 1.3, fout: 1.0, from: { P: [-800, 170, 1080], T: [-99, 165, 60] }, to: { P: [-780, 172, 1040], T: [-95, 168, 60] }, fov: 32 } },
  { id: 'greet', a: 127.6, b: 136.2, pose: 'greet', frames: [1, 48], pos: [300, 0, 400], h: 178, inAt: 128.3, outAt: 999,
    cam: { a: 127.6, b: 136.2, fin: 1.4, fout: 0, from: { P: [120, 200, 1100], T: [107, 133, 60] }, to: { P: [110, 205, 1060], T: [105, 136, 60] }, fov: 34 } },
];
export const NUM1 = { t: 118.2, at: 'rank1' };           // the golden Nº 1 bursts over his raised finger

// ------------------------------------------------------------------ text
// subs: [from, to, text, kicker]; footage lines in v9 seconds, take lines in v7 film time (mapped)
export const SUBS_FOOT = [
  [13.4, 17.9, 'Tudo começa na *Biblioteca de Skills* do FLOWS.', ''],
  [19.1, 23.8, 'Cada skill tem sua *pontuação* e pode ser reusada.', ''],
  [24.3, 28.3, 'Para começar, clique em *Publicar skill*.', 'Passo 1 de 6'],
];
// consecutive lines of one step touch (they swap in place); other lines keep a breath between them
export const SUBS_TAKE = [
  [58.4, 64.15, 'Dê à skill um nome claro e *padronizado*.', 'Passo 2 de 6'],
  [64.15, 70.4, 'O padrão: *prefixo da área*, *service line* e *entregável*.', 'Passo 2 de 6'],
  [70.9, 77.4, 'Informe *onde ela foi testada*.', 'Passo 3 de 6'],
  [78.0, 85.4, 'Escolha o *modelo testado*: o campo é obrigatório.', 'Passo 4 de 6'],
  [85.9, 93.0, 'Envie tudo em um *único ZIP*, com o *SKILL.md na raiz*.', 'Passo 5 de 6'],
  [93.0, 96.2, 'Avance em *Próximo* para os *Detalhes*.', 'Passo 5 de 6'],
  [96.2, 99.95, 'Em *Detalhes*, classifique como *Template*.', 'Passo 6 de 6'],
  [99.95, 103.65, 'A *área responsável* recebe os *pontos*.', 'Passo 6 de 6'],
  [103.65, 107.65, 'Inclua os *co-responsáveis* da skill.', 'Passo 6 de 6'],
  [107.65, 112.95, 'Na *Descrição*, detalhe o *entregável* e o *resultado final*.', 'Passo 6 de 6'],
  [112.95, 116.1, 'E clique em *Compartilhar Skill*.', 'Passo 6 de 6'],
  [117.0, 122.6, 'Pronto: a skill está *publicada na Biblioteca*.', ''],
  [122.6, 126.5, '*+1 skill de DTS*: a Biblioteca agora tem *442*.', ''],
  [134.9, 140.9, 'Cada skill compartilhada vira *referência* para todo o time.', ''],
  [140.9, 145.25, 'Quem *publica e é adotado* sobe no placar.', ''],
  [145.25, 148.55, 'E DTS lidera: *nº 1 entre 12 áreas*, com *1.557 pontos*.', ''],
  [148.55, 151.0, 'Cada contribuição conta.', ''],
];
// lockups: [from, to, kicker, line, colors, position] (v9 seconds)
export const LOCK9 = [
  [8.3, 12.8, 'Pilar 01 · Todos Sabem', 'O conhecimento de DTS, em um só lugar', ['#d3e6ff', '#3d8bff'], 'top'],
  [23.9, 27.5, 'Pilar 02 · Todos Usam', 'Compartilhe sua skill no FLOWS', ['#ffe1c2', '#ff8a1f'], 'left mid'],
  [101.4, 105.0, 'Pilar 03 · Somos Exemplo', 'Quem compartilha, lidera pelo exemplo', ['#ffecc2', '#f2b544'], ''],
];
// the library counter over the orbit of skills (v9 seconds)
export const COUNT441 = { a: 19.3, b: 24.4, n: 441 };
// the golden thread and the flashes (v9 seconds): [time, from x, to x, y]; [peak, rise, fall, amount]
export const STREAKS = [];
export const FLASHES = [[REF1_END, 0.06, 0.28, 0.22]];   // a soft pulse of light as his finger meets the panel
