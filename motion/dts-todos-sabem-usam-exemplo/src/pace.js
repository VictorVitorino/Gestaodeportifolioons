// Film pacing (v5). The v3 choreography ("story time") is replayed on a new clock:
// PACE maps [new film time, story time] through a monotone cubic (warp in util.js),
// so every action keeps its shape but gets room to breathe, and each pillar gets a
// MOVE -> SETTLE -> READ -> ABSORB -> TRANSITION beat.
// v5: the step-by-step runs ~22% faster than v4 (the typing of the name keeps its v4
// speed), and three flat segments freeze the story for new scenes played on the film
// clock ("inserts"): the FLOWS tour, the anatomy of the skill name and the Detalhes page.
// audio/soundtrack.py reads these same arrays (keep them plain JSON).
export const PACE = [
  [0, 0], [6.0, 5.2], [9.8, 8.2], [11.0, 8.35], [12.0, 9.35],
  [14.8, 11.2], [19.0, 11.5], [20.2, 12.0], [23.2, 12.9],
  [26.1, 15.0], [36.1, 15.0], [37.3, 15.9],
  [40.9, 18.6], [43.1, 20.4], [45.5, 22.4], [47.5, 23.4], [48.5, 24.0],
  [51.3, 24.9], [55.5, 25.6], [57.7, 26.7], [59.7, 28.0],
  [60.4, 28.6], [62.3, 30.2], [63.5, 31.4], [67.7, 35.3], [69.5, 36.9], [74.7, 36.9], [75.3, 37.4],
  [77.5, 38.7], [79.2, 40.4], [80.8, 42.2], [83.4, 43.7], [85.4, 45.9], [86.6, 46.9], [88.5, 48.5],
  [90.5, 49.8], [93.3, 52.9], [94.4, 53.9], [95.4, 54.8], [96.4, 55.6], [98.4, 56.9], [99.3, 57.2],
  [113.9, 57.2], [114.4, 57.4], [115.6, 58.3], [121.0, 60.2], [123.4, 62.0],
  [127.8, 62.9], [132.6, 63.7], [134.8, 65.2],
  [139.0, 68.5], [142.2, 69.6], [147.0, 72.9], [148.0, 73.4], [151.0, 75.2], [152.4, 75.9], [154.4, 77.3],
  [156.2, 78.8], [161.8, 81.0], [163.2, 82.2]
];
// the three pillar moments, anchored on story time: camera travel, then the settled hold
const PILLAR_STORY = [[9.35, 11.2, 11.5], [24.0, 24.9, 25.6], [62.0, 62.9, 63.7]];
const at = (s) => PACE.find((k) => k[1] === s)[0];
export const PILLAR_SEQ = PILLAR_STORY.map(([a, b, c]) => ({ move: [at(a), at(b)], hold: [at(b), at(c)] }));
// inserts = the flat segments of PACE, in order: FLOWS tour, name anatomy, Detalhes page
const IDS = ['tour', 'name', 'det'];
export const INSERTS = PACE.slice(1).map((k, i) => [PACE[i], k]).filter(([a, b]) => a[1] === b[1])
  .map(([a, b], i) => ({ id: IDS[i], at: a[1], a: a[0], b: b[0] }));
