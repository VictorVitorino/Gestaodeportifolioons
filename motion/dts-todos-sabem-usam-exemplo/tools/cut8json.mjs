// Writes the v8 cut as JSON for audio/soundtrack8.py: node tools/cut8json.mjs > out/cut8.json
import { SHOTS, DURATION, SUBS8, LOCK8, STREAKS, FLASHES, SNAP, FPS } from '../src/cut8.js';
console.log(JSON.stringify({ DURATION, FPS, SNAP, SUBS8, LOCK8, STREAKS, FLASHES, SHOTS: SHOTS.map(({ f, ...s }) => s) }));
