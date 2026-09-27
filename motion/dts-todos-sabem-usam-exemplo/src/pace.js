// Film pacing (v4). The v3 choreography ("story time") is replayed on a new clock:
// PACE maps [new film time, story time] through a monotone cubic (warp in util.js),
// so every action keeps its shape but gets room to breathe, each pillar gets a
// MOVE -> SETTLE -> READ -> ABSORB -> TRANSITION beat, and no camera move peaks
// above ~20°/s (the fast v3 moves got the most extra time).
// audio/soundtrack.py reads these same arrays (keep them plain JSON).
export const PACE = [
  [0, 0], [6.0, 5.2], [9.8, 8.2], [11.0, 8.35], [12.0, 9.35],
  [14.8, 11.2], [19.0, 11.5], [20.2, 12.0], [23.2, 12.9],
  [27.4, 15.9], [31.0, 18.6], [33.2, 20.4], [35.6, 22.4], [37.6, 23.4], [38.6, 24.0],
  [41.4, 24.9], [45.6, 25.6], [48.6, 26.7], [51.2, 28.0],
  [52.2, 28.6], [54.8, 30.2], [56.4, 31.4], [60.6, 35.3], [63.6, 37.4], [65.2, 38.7], [67.4, 40.4],
  [69.4, 42.2], [73.2, 43.7], [75.8, 45.9], [77.4, 46.9], [80.0, 48.5], [82.8, 49.8], [86.4, 52.9], [87.8, 53.9],
  [89.2, 54.8], [90.6, 55.6], [94.2, 56.9], [95.4, 57.4], [96.6, 58.3], [102.8, 60.2], [105.8, 62.0],
  [110.2, 62.9], [115.0, 63.7], [117.2, 65.2],
  [121.4, 68.5], [124.6, 69.6], [129.4, 72.9], [130.4, 73.4], [133.4, 75.2], [134.8, 75.9], [136.8, 77.3],
  [138.6, 78.8], [144.2, 81.0], [145.6, 82.2]
];
// the three pillar moments, anchored on story time: camera travel, then the settled hold
const PILLAR_STORY = [[9.35, 11.2, 11.5], [24.0, 24.9, 25.6], [62.0, 62.9, 63.7]];
const at = (s) => PACE.find((k) => k[1] === s)[0];
export const PILLAR_SEQ = PILLAR_STORY.map(([a, b, c]) => ({ move: [at(a), at(b)], hold: [at(b), at(c)] }));
