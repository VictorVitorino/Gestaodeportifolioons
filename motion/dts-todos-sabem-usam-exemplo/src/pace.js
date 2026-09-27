// Film pacing (v6). The v3 choreography ("story time") is replayed on a new clock:
// PACE maps [new film time, story time] through a monotone cubic (warp in util.js),
// so every action keeps its shape but gets room to breathe, and each pillar gets a
// MOVE -> SETTLE -> READ -> ABSORB -> TRANSITION beat.
// v5: the step-by-step runs ~22% faster than v4 (the typing of the name keeps its v4
// speed), and three flat segments freeze the story for new scenes played on the film
// clock ("inserts"): the FLOWS tour, the anatomy of the skill name and the Detalhes page.
// v6: same film, ~18% shorter: pillar holds, counters, inserts and the end card lose their
// dead time (the name typing still keeps its speed). The opening is now Fabio's intro (a
// video clip, INTRO below): the film joins it mid-pan, at story 10.0, as the camera reaches
// the Todos Sabem pillar, so PACE starts there.
// audio/soundtrack.py reads these same arrays (keep them plain JSON).
export const PACE = [
  [0, 10], [1.7, 11.2], [4.7, 11.5], [5.7, 12], [8.1, 12.9], [10.5, 15], [19, 15], [20, 15.9],
  [22.9, 18.6], [24.7, 20.4], [26.7, 22.4], [28.3, 23.4], [29.1, 24], [31.5, 24.9], [34.5, 25.6], [36.2, 26.7],
  [37.9, 28], [38.5, 28.6], [40.3, 30.2], [41.3, 31.4], [45.5, 35.3], [47.2, 36.9], [51.5, 36.9], [52, 37.4],
  [53.8, 38.7], [55.3, 40.4], [56.6, 42.2], [58.9, 43.7], [60.7, 45.9], [61.7, 46.9], [63.5, 48.5], [65.4, 49.8],
  [67.9, 52.9], [68.8, 53.9], [69.7, 54.8], [70.5, 55.6], [72.4, 56.9], [73.7, 57.2], [85.7, 57.2], [86.1, 57.4],
  [87.3, 58.3], [92.1, 60.2], [94.1, 62], [97.5, 62.9], [100.7, 63.7], [102.5, 65.2], [105.7, 68.5], [108.3, 69.6],
  [112.1, 72.9], [112.9, 73.4], [115.3, 75.2], [116.4, 75.9], [118.1, 77.3], [119.6, 78.8], [123.8, 81], [125, 82.2]
];
// the three pillar moments, anchored on story time: camera travel, then the settled hold
const PILLAR_STORY = [[10.0, 11.2, 11.5], [24.0, 24.9, 25.6], [62.0, 62.9, 63.7]];
const at = (s) => PACE.find((k) => k[1] === s)[0];
export const PILLAR_SEQ = PILLAR_STORY.map(([a, b, c]) => ({ move: [at(a), at(b)], hold: [at(b), at(c)] }));
// inserts = the flat segments of PACE, in order: FLOWS tour, name anatomy, Detalhes page.
// Their schedules (src/timeline.js) are written on a design clock of INSERT_DESIGN seconds and
// replayed uniformly in the film time the flat segment allows: u_design = (nt - a) * k.
export const INSERT_DESIGN = {"tour": 10.0, "name": 5.2, "det": 14.6};
const IDS = ['tour', 'name', 'det'];
export const INSERTS = PACE.slice(1).map((k, i) => [PACE[i], k]).filter(([a, b]) => a[1] === b[1])
  .map(([a, b], i) => ({ id: IDS[i], at: a[1], a: a[0], b: b[0], d: INSERT_DESIGN[IDS[i]], k: INSERT_DESIGN[IDS[i]] / (b[0] - a[0]) }));
// Fabio's intro (the user's clip, 30 fps, extracted at 24 fps into tex/fabio by tools/intro.sh):
// it plays between the A&M ident and the film. dur = seconds used (the film takes over during its
// final pan); zoom = [start, end, scale]: a slow push-in, anchored bottom-centre, that also keeps
// the clip's own (older) overlay graphics out of frame; title = when our corrected headline
// rises (over the clip's), cover = the frosted panel that hides the clip's baked-in headline.
export const INTRO = {"frames": "tex/fabio/c_%03d.jpg", "fps": 24, "dur": 9.5, "fadeIn": 0.55, "zoom": [5.9, 7.1, 1.12], "hud": [7.25, 7.85], "title": 6.9, "cover": [6.5, 6.85]};
