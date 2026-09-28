// Writes the v10 cut as JSON for audio/soundtrack10.py: node tools/cut10json.mjs
import * as K from '../src/cut10.js';
const { TAKE_F, CAMS, ...rest } = K;
console.log(JSON.stringify({ ...rest, STANDS: K.STANDS }));
