// Writes the v9 cut as JSON for audio/soundtrack9.py: node tools/cut9json.mjs
import { SHOTS, DURATION, FPS, REF1_END, T_I28, PRESS, IRIS, STANDS, NUM1, COUNT441, LOCK9, SUBS_FOOT, SUBS_TAKE } from '../src/cut9.js';
console.log(JSON.stringify({ DURATION, FPS, REF1_END, T_I28, PRESS, IRIS, NUM1, COUNT441, LOCK9, SUBS_FOOT, SUBS_TAKE,
  STANDS: STANDS.map(({ cam, ...s }) => s), SHOTS: SHOTS.map(({ f, ...s }) => s) }));
