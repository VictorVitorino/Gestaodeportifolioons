// Reading-time QA (v9): every text of the film, how long it is on screen, and whether that is enough.
// Calmer rule than v7: a subtitle needs 1.0 s + its characters at 13.5 per second (at least 3.0 s);
// lockups and counters need their characters at 13.5 per second of full visibility (at least 2.0 s);
// a gap of at least 0.35 s between two subtitles unless they touch (they swap in place).   node textqa9.mjs
import { SHOTS, SUBS_FOOT, SUBS_TAKE, LOCK9, COUNT441, DURATION, TAKE_F, T3D } from './src/cut9.js';
const plain = (s) => s.replace(/\*/g, '');
const clock = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
// v7 time -> v9 time on the take (the map is monotone: bisection)
const TAKE_END = SHOTS[SHOTS.length - 1].b;
const inv = (nt) => { let lo = T3D, hi = TAKE_END; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (TAKE_F(m) < nt) lo = m; else hi = m; } return (lo + hi) / 2; };
export const subs9 = () => [...SUBS_FOOT.map(([a, b, s, k]) => [a, b, s, k]), ...SUBS_TAKE.map(([a, b, s, k]) => [inv(a), inv(b), s, k])].sort((x, y) => x[0] - y[0]);
if (process.argv[1] && process.argv[1].endsWith('textqa9.mjs')) {
  let bad = 0;
  const row = (t, d, need, what) => { const ok = d + 1e-6 >= need; if (!ok) bad++; console.log(`${clock(t).padStart(7)}  ${d.toFixed(2).padStart(5)} s  (min ${need.toFixed(2)})  ${ok ? ' ok ' : 'CURTO'}  ${what}`); };
  console.log('--- legendas');
  const S = subs9();
  S.forEach(([a, b, s, k], i) => {
    const n = plain(s).length; row(a, b - a, Math.max(3.0, 1.0 + n / 13.5), `${(n / (b - a)).toFixed(1).padStart(4)} cps  ${k ? '[' + k + '] ' : ''}${plain(s)}`);
    const nx = S[i + 1]; if (nx) { const g = nx[0] - b; if (g > 0.05 && g < 0.35) { bad++; console.log(`         gap ${g.toFixed(2)} s  CURTO entre legendas`); } if (g < -0.05) { bad++; console.log(`         sobreposição ${(-g).toFixed(2)} s`); } }
  });
  console.log('--- lockups e contador (tempo 100% visível)');
  for (const [a, b, k, d] of LOCK9) { const s = `${k} · ${d}`; row(a + 0.85, b - (a + 0.85), Math.max(2.0, d.length / 13.5), s); }
  row(COUNT441.a + 1.2, COUNT441.b - COUNT441.a - 1.2, 2.0, `${COUNT441.n} skills prontas para reuso`);
  console.log('--- velocidades do plano-sequência (1.0 = ritmo da v7)');
  const K = SHOTS[SHOTS.length - 1].map;
  for (let i = 1; i < K.length; i++) { const k = (K[i][1] - K[i - 1][1]) / (K[i][0] - K[i - 1][0]); console.log(`${clock(K[i - 1][0])}–${clock(K[i][0])}  v7 ${K[i - 1][1]}→${K[i][1]}  ${k.toFixed(2)}x`); }
  console.log(`--- filme ${clock(DURATION)} · ${bad ? bad + ' problema(s)' : 'todos os textos com tempo de leitura'}`);
}
