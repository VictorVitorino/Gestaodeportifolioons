// FLOWS · A Travessia (v10): the cut — one continuous journey, no speech, under two minutes (seconds, 30 fps).
//   0.0  the plate (plates10, tools/plate10.py): Fabio is taken by the spirals of light, the FLOWS logo,
//        the door of light, the FLOWS stage (DTS is written in the sky, three columns of light level:
//        Todos Sabem · Todos Usam · Somos Exemplo), his walk, his touch on the Biblioteca de Skills, the
//        portal, the hall of skills (441), the Publicar Skill button that he presses himself
//  39.2  a golden iris opens from the pressed button into the same hall, now in 3D (the v7 film as one
//        take at a calm pace, re-lit at night): the form (2 pages), the publish, 442, the fountain of
//        light that reaches every skill of the library, the ranking (DTS nº 1, Fabio raises the one),
//        the end card
// Read by src/film10.js (picture) and audio/soundtrack10.py (via tools/cut10json.mjs).
import { warp } from './util.js';
export const FPS = 30;

// ------------------------------------------------------------------ the plate (see plates10/plate.json)
export const PLATE = { dir: 'plates10', pfx: 'p_', n: 1211, dur: 40.3167 };
export const TA = 3.4333, TB = 6.9333, TC = 17.2167, TD = 27.9167;   // plate joins
export const PRESS = 38.63;                                           // Fabio's finger meets Publicar Skill
export const T3D = 39.2;                                              // the 3D take starts under the iris
export const IRIS = { t: T3D, dur: 1.0 };
// the capsule's centre in the plate (the camera keeps pushing in while the finger rests on it)
export const CAPSULE = [[37.6, 952, 772, 773], [38.6, 950, 762, 786], [39.0, 951, 740, 800], [39.4, 953, 713, 825], [39.8, 955, 671, 868], [40.0, 954, 653, 884], [40.33, 958, 605, 940]];
// Fabio's fingertip on the capsule (R23 frame -> plate px; plate.json maps film frames to R23 frames)
export const TIP = { 334: [890, 420], 336: [960, 520], 338: [965, 560], 340: [975, 568], 342: [990, 600], 344: [985, 612], 346: [972, 604], 348: [976, 602], 350: [990, 578], 352: [990, 562], 356: [992, 548], 360: [994, 536], 366: [996, 520] };

// ------------------------------------------------------------------ graphics over the plate
// the golden ribbon: one of the spiral's golden strands tightens into the FLOWS logo's swoosh
export const RIBBON = { a: 2.95, b: 3.95, from: { cx: 960, cy: 600, rx: 560, ry: 150 }, to: { cx: 960, cy: 532, rx: 312, ry: 312 } };
// DTS written by the golden thread that leaves the FLOWS O (sky track; reference frame REF of track.json);
// it stays up, as the title of the three columns, until Fabio walks
export const DTS = { a: 8.02, write: [8.4, 10.0], fill: [9.85, 10.45], tag: [10.15, 10.85], shrink: [99, 100], out: [15.95, 16.6],
  O: [890, 456], cx: 960, base: 232, size: 150, shrinkTo: 1, shrinkBase: 232 };
// the nivelamento: three columns of light (floor track), unequal, then levelled by the golden line
export const COLS = {
  bases: [[380.6, 857.9], [960, 866], [1609.2, 891.2]],      // left plate · Fabio · right plate (reference frame)
  names: ['TODOS SABEM', 'TODOS USAM', 'SOMOS EXEMPLO'], colors: [['#3d8bff', '#b9d8ff'], ['#ff8a1f', '#ffc58a'], ['#f2b544', '#ffe2a0']],
  rise: [10.9, 11.2, 11.5], riseDur: 0.75, first: [480, 300, 575], level: 404,  // tops (reference y): unequal, then levelled
  line: [11.85, 12.6], labels: [12.3, 13.0], out: [16.0, 16.6],
};
// act tags (top left) and step tags (bottom): titles only, no sentences
export const ACTS = [[17.0, 36.0, '01', 'Todos Sabem', '#3d8bff'], [36.25, 91.3, '02', 'Todos Usam', '#ff8a1f'], [91.8, 111.0, '03', 'Somos Exemplo', '#f2b544']];
// the library counter while the skills orbit Fabio
export const COUNT441 = { a: 31.0, b: 35.2, n: 441 };

// ------------------------------------------------------------------ the 3D take (v10 T -> v7 film time)
// one monotone map: the camera never cuts; the film fits in two minutes, so the take runs a little faster
// than the v7 pace through the form (no sentences to read: the form itself is the text) and breathes on
// the moments that matter (the name, the fountain, the one)
export const TAKE = [
  [T3D, 55.3],       // the form is born from the light of the press (Fabio beside it)
  [42.4, 58.0],      // [DTS]
  [46.85, 64.0],     // the name typed
  [51.95, 70.4],     // the name's anatomy
  [56.75, 77.6],     // onde foi testada
  [61.9, 85.6],      // modelo testado, tempo manual
  [66.85, 93.0],     // SKILL.zip
  [69.15, 96.2],     // Próximo
  [71.68, 100.0],    // Detalhes: Template
  [74.15, 103.7],    // área responsável
  [76.82, 107.7],    // co-responsáveis
  [80.48, 113.0],    // descrição
  [82.77, 116.2],    // Compartilhar Skill
  [87.69, 122.6],    // the card folds, flies, lands in the library
  [91.69, 126.6],    // 442 (Fabio presents it)
  [102.1, 140.2],    // the fountain (its own camera; the v7 clock runs through its Somos Exemplo light)
  [106.0, 145.3],    // the ranking rises
  [108.9, 148.6],    // DTS nº 1 (Fabio raises the one)
  [111.1, 151.0],    // 87 publicações · 142 adoções
  [119.4, 164.3],    // the end card (Fabio waves goodbye)
];
export const TAKE_F = warp(TAKE);
export const DURATION = TAKE[TAKE.length - 1][0];
// v7 graphics kept in the take, by v7 film time: counters, ranking plates, end card
export const SHOW = [['k', 118.0, 127.2], ['rank', 140.9, 151.2], ['end', 151.0, 999]];
// the step of the form on screen (v7 film time): [from, to, step, name]
export const STEPS = [
  [36.25, 39.35, 1, 'Publicar Skill', 'foot'],
  [57.9, 70.6, 2, 'Nome da skill'], [70.6, 77.6, 3, 'Onde foi testada'], [77.6, 85.6, 4, 'Modelo e tempo'],
  [85.6, 96.2, 5, 'Arquivo SKILL.zip'], [96.2, 116.4, 6, 'Detalhes e publicação'],
];

// ------------------------------------------------------------------ Fabio in the world (full body)
// pose: a matted pose (fabio_poses/<pose>/p_###.png, 24 fps), looped back and forth; placed standing on the
// floor at pos (world units, the floor is y = 0), height h; he materialises in golden light
export const STANDS = [
  { id: 'form', a: T3D, b: 44.4, pose: 'present', frames: [1, 72], pos: [-405, 0, 474], h: 178, inAt: 39.5, outAt: 43.1 },
  { id: 'present', a: 87.3, b: 92.3, pose: 'present', frames: [1, 72], pos: [330, 0, -1250], h: 178, inAt: 87.8, outAt: 91.6 },
  { id: 'welcome', a: 93.6, b: 102.2, pose: 'welcome', frames: [1, 40], pos: [-430, 0, 560], h: 178, inAt: 94.15, outAt: 101.5 },
  { id: 'rank1', a: 104.8, b: 110.6, pose: 'rank1', frames: [1, 72], pos: [-590, 0, 420], h: 178, inAt: 105.25, outAt: 110.1 },
  { id: 'greet', a: 111.9, b: DURATION + 1, pose: 'greet', frames: [1, 48], pos: [300, 0, 400], h: 178, inAt: 112.5, outAt: 999 },
];
export const NUM1 = { t: 106.9, at: 'rank1' };            // the golden 1 rises over his raised finger
// camera detours, blended over the take's camera (later ones blend over earlier ones):
// keys [T, P, T(arget), fov]; fin/fout: blend seconds
export const CAMS = [
  // the establishing shot the iris opens on: the form born from the light, Fabio beside it
  { a: T3D, b: 44.0, fin: 0, fout: 1.5, keys: [[T3D, [-120, 226, 1760], [-150, 266, 0], 32], [41.0, [-126, 232, 1640], [-150, 272, 0], 32], [42.5, [-165, 360, 1150], [-150, 420, -20], 31]] },
  // 442: Fabio presents the new skill on the library wall
  { a: 87.3, b: 92.3, fin: 1.1, fout: 0, keys: [[87.3, [-110, 186, -210], [200, 190, -2250], 32], [92.3, [-90, 193, -300], [200, 192, -2250], 32]] },
  // the fountain: the new card glows, its drop falls into the plaza, the eruption, then a slow orbit while
  // the jets reach everyone (deep focus: the whole library stays readable)
  { a: 91.8, b: 103.2, fin: 1.3, fout: 1.3, ap: 2.2e-5, focusAt: [0, 320, -200], keys: [
    [91.8, [-90, 193, -300], [200, 192, -2250], 32], [92.9, [0, 300, 700], [80, 300, -1800], 34],
    [94.1, [0, 320, 1150], [0, 190, -300], 36], [95.3, [0, 330, 1400], [0, 400, -500], 38],
    [97.3, [-420, 330, 1400], [0, 420, -300], 38], [99.4, [-640, 300, 1300], [20, 360, -120], 36],
    [101.3, [-380, 300, 1480], [0, 260, 60], 33], [103.2, [0, 330, 1480], [0, 215, 60], 30]] },
  // the ranking: Fabio raises the one beside the podium
  { a: 104.8, b: 110.6, fin: 1.2, fout: 1.0, keys: [[104.8, [-800, 170, 1080], [-99, 165, 60], 32], [110.6, [-780, 172, 1040], [-95, 168, 60], 32]] },
  // the end card: Fabio waves goodbye
  { a: 111.9, b: DURATION + 1, fin: 1.3, fout: 0, keys: [[111.9, [120, 200, 1100], [107, 133, 60], 34], [DURATION, [110, 205, 1060], [105, 136, 60], 34]] },
];

// ------------------------------------------------------------------ the fountain of light (v10 T)
// a drop leaves the new card on the library wall, falls into the plaza's centre, a basin of light opens,
// the central jet erupts and a crown of jets arcs out to the whole library; every card it reaches lights
export const FOUNT = {
  c: [0, 0, 60], glowCard: 92.3, drop: [92.75, 94.15], basin: [94.15, 94.7], jet: [94.4, 95.3],
  crown: [95.1, 98.9], jetLife: 1.2, allGlow: [98.4, 99.8], calm: [100.4, 101.9], drain: [101.3, 102.4],
  jets: 44, pillars: [94.85, 95.1, 95.35],   // the three pillars rise around the fountain as it erupts
};
