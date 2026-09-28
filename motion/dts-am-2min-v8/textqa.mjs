// Reading-time QA (v7): every text of the film, how long it is fully readable on screen, and whether
// that is enough. Rule: a subtitle needs 0.7 s (entrance/exit) + its characters at 13.5 per second,
// and at least 2.8 s; other texts need their characters at 13.5 per second (at least 1.5 s),
// counted only while they are fully visible.   node textqa.mjs
import { warp } from './src/util.js';
import { PACE, INSERTS, SUBS, SCHED, INTRO, PILLAR_SEQ } from './src/pace.js';
const S = warp(PACE), FILM = PACE.at(-1)[0], F0 = INTRO.dur;
const TAB = []; for (let x = 0; x <= FILM + 1e-6; x += 1 / 96) TAB.push(S(x));
const NT = (st) => { let lo = 0, hi = TAB.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (TAB[m] < st) lo = m + 1; else hi = m; } return lo / 96; };
const [I_TOUR, I_NAME, I_DET] = INSERTS;
const plain = (s) => s.replace(/\*/g, '');
const clock = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
// ---- subtitles (same placement and chaining as src/timeline.js)
const subs = SUBS.map(([a, b, k, s]) => ({ a: NT(a), b: NT(b), s }));
for (const [q, id] of [[I_TOUR, 'tour'], [I_NAME, 'name'], [I_DET, 'det']]) for (const [u0, u1, k, s] of SCHED[id].subs) subs.push({ a: q.a + u0 / q.k, b: q.a + u1 / q.k, s });
subs.sort((x, y) => x.a - y.a);
for (let i = 1; i < subs.length; i++) { const g = subs[i].a - subs[i - 1].b; if (g >= 0 && g < 0.35) subs[i].a = subs[i - 1].b; }
let bad = 0;
const row = (t, d, need, what) => { const ok = d + 1e-6 >= need; if (!ok) bad++; console.log(`${clock(t + F0).padStart(7)}  ${d.toFixed(2).padStart(5)} s  (min ${need.toFixed(2)})  ${ok ? ' ok ' : 'CURTO'}  ${what}`); };
console.log('--- legendas (duração total na tela)');
for (const x of subs) { const n = plain(x.s).length, d = x.b - x.a; row(x.a, d, Math.max(2.8, 0.7 + n / 13.5), `${(n / d).toFixed(1).padStart(4)} cps  ${plain(x.s)}`); }
// ---- other texts: [start of full visibility, start of exit] in film time, characters
const need = (n) => Math.max(1.5, n / 13.5);
const other = [];
{ // opening title: fully up at clip time title + 1.1, exits at INTRO.out (film seconds after the cut)
  const a = INTRO.title + 0.6 - F0, b = INTRO.out[0]; // the title words are up (the tag follows)
  other.push([a, b, 'Como DTS compartilha conhecimento · Compartilhar uma Skill no FLOWS · 6 passos']);
}
const LOCK = ['Pilar 01 · Onde está o conhecimento', 'Pilar 02 · O passo a passo no dia a dia', 'Pilar 03 · Quem compartilha, lidera pelo exemplo'];
PILLAR_SEQ.forEach((q, k) => other.push([q.hold[0] - 0.6 + 1.35, q.hold[1] - 0.3, LOCK[k]]));
const st = (a, b, s) => other.push([NT(a), NT(b), s]);
st(17.1, 19.9, '441 · skills prontas para reuso');
st(60.55, 61.9, '442 · +1 skill de DTS na Biblioteca');
st(40.95, 42.15, 'contexto da validação');
st(43.15, 44.7, 'obrigatório');
st(47.65, 48.75, 'opcional · minutos na mão');
st(50.7, 52.4, 'SKILL.md na raiz');
st(69.6, 75.7, 'Ranking de Áreas · Todos os tempos · 12 áreas no placar');
st(73.55, 75.7, 'Nº 1 entre 12 áreas no placar');
st(74.15, 75.7, '87 publicações · 142 adoções');
st(78.1, 81.6, 'Todos Sabem. Todos Usam. Somos Exemplo. · DTS · Digital & Technology Services · Compartilhe sua skill no FLOWS');
st(80.0, 81.6, 'card final completo (última linha já no lugar)');
{ const N = SCHED.name; N.t0.forEach((t, k) => other.push([I_NAME.a + (t + 0.4) / I_NAME.k, I_NAME.a + N.out[0] / I_NAME.k, ['1 Prefixo da Área', '2 Service Line', '3 Produto/Entregável'][k]])); }
console.log('--- títulos, pilares, contadores, callouts, rótulos, card final (tempo 100% visível)');
for (const [a, b, s] of other.sort((x, y) => x[0] - y[0])) row(a, b - a, need(s.length), s);
console.log(`--- filme ${clock(F0 + FILM)} · ${bad ? bad + ' texto(s) curto(s)' : 'todos os textos com tempo de leitura'}`);
