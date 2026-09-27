// DOM replica of the real FLOWS screen Ranking -> Áreas -> Todos os tempos (reference print,
// 1672x941 css px: every element sits where it sits in the print). Elements tagged data-l are
// baked one by one as transparent layers (bake.mjs) and assembled on the 3D screen by the film.
// Texts and figures are the ones on the screen; the only change is the recalculation date,
// shown in Brazilian Portuguese ("Sep 9, 2026, 1:15 AM" in the print).
import { icon, claudeMark } from './icons.js';

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// the three podium cards (figures from the print)
export const RK_CARDS = [
  { k: 'c2', rank: 2, code: 'MA_SERVICES', name: 'M&amp;A Services', pts: 1054, x: 303, y: 398, w: 428, h: 335, ic: 'award' },
  { k: 'c1', rank: 1, code: 'DTS', name: 'DTS', pts: 1557, x: 750, y: 390, w: 439, h: 343, ic: 'trophy' },
  { k: 'c3', rank: 3, code: 'OPERATIONS', name: 'Operations', pts: 951, x: 1207, y: 398, w: 424, h: 335, ic: 'trophy' },
];

const sbItem = (l, top, ic, label, cls = '') => `<div class="rk-si ${cls}" data-l="${l}" style="top:${top}px">${ic}<span>${label}</span></div>`;
const card = (c) => `<div class="rk-card r${c.rank}" data-l="${c.k}" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px">
    <svg class="wave" viewBox="0 0 440 340" preserveAspectRatio="none"><path d="M0 250 C 90 150, 170 120, 250 170 S 400 250, 440 150 L440 340 L0 340Z"/><path class="w2" d="M0 120 C 80 60, 140 60, 190 110 S 300 200, 440 90 L440 0 L0 0Z"/></svg>
    <div class="bd">${icon(c.ic, '', 2.2)}<b>${c.rank}</b></div>
    <div class="cd">${c.code}</div>
    <div class="nm">${c.name}</div>
    <div class="sc">${c.code}</div>
    <div class="num" data-num="${c.k}"></div>
    <div class="pt">Pontos</div>
    <div class="nv" data-l="n${c.rank}">${icon('sparkles', '', 1.8)}Novo na temporada</div>
  </div>`;

export function rankingScreen() {
  const id = 'rkl' + Math.random().toString(36).slice(2, 7);
  return h(`<div class="rks">
  <div class="rk-page" data-l="page"></div>
  <div class="rk-sb" data-l="sb"></div>
  <div class="rk-top" data-l="sb_top"><span class="hb">${icon('menu', '', 2.4)}</span><span class="rk-logo"><svg class="orb" viewBox="0 0 120 120"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe29a"/><stop offset=".45" stop-color="#f7a21b"/><stop offset="1" stop-color="#d9670a"/></linearGradient></defs><circle cx="60" cy="60" r="50" fill="none" stroke="url(#${id})" stroke-width="5" stroke-linecap="round" stroke-dasharray="230 84" transform="rotate(200 60 60)"/><circle cx="60" cy="60" r="38" fill="none" stroke="url(#${id})" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="120 119" transform="rotate(120 60 60)" opacity=".85"/></svg>FLOWS</span></div>
  <div class="rk-sec" data-l="sb_s0" style="top:88px">Principal</div>
  ${sbItem('sb_i0', 120, icon('home'), 'Início', 'act')}
  ${sbItem('sb_i1', 168, icon('folder'), 'Projetos')}
  <div class="rk-sec" data-l="sb_s1" style="top:240px">Skills</div>
  ${sbItem('sb_i2', 268, icon('library'), 'Biblioteca')}
  ${sbItem('sb_i3', 314, icon('user'), 'Minhas Skills')}
  ${sbItem('sb_i4', 359, icon('star'), 'Favoritas')}
  ${sbItem('sb_i5', 405, `<svg class="ic bars" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="12" width="4.2" height="8.5" rx=".8"/><rect x="9.9" y="4" width="4.2" height="16.5" rx=".8"/><rect x="16.3" y="8.5" width="4.2" height="12" rx=".8"/></svg>`, 'Ranking', 'cur')}
  <div class="rk-sec" data-l="sb_s2" style="top:482px">Métodos</div>
  ${sbItem('sb_i6', 511, icon('book'), 'Catálogo')}
  ${sbItem('sb_i7', 556, icon('listpen'), 'Meus Métodos')}
  <div class="rk-bot" data-l="sb_bot">
    <div class="rk-si" style="top:5px;left:13px">${claudeMark()}<span>Usar com Claude</span></div>
    <div class="rk-si" style="top:48px;left:13px">${icon('lang')}<span>Idioma</span><em>PT</em></div>
    <div class="rk-si" style="top:91px;left:13px">${icon('moon')}<span>Tema escuro</span></div>
    <div class="rk-user"><span class="av">${icon('user', '', 2.2)}</span><span>Vitorino, Victor</span>${icon('updown')}</div>
  </div>
  <div class="rk-main" data-l="main"></div>
  <div class="rk-title" data-l="title">Ranking</div>
  <div class="rk-lead" data-l="lead">Publique, seja adotado e suba no placar. A temporada reinicia todo mês, então quem começa hoje pode ganhar.</div>
  <div class="rk-meta" data-l="meta">${icon('settings', '', 1.8)}<span>Recalculado em 9 de set. de 2026, 01:15 · escala v3</span><i></i>${icon('users', '', 1.8)}<span>12 áreas no placar</span></div>
  <div class="rk-you" data-l="you"><b class="pos">#12</b><span>Você</span><i>•</i><b>150 pontos</b><i>•</i><span>6 pontos para alcançar rlauretti</span>
    <div class="btn">${icon('locate', '', 2)}Ver minha linha</div></div>
  <div class="rk-tabs" data-l="tabs"><span style="left:329px">Temporada atual</span><span style="left:509px">Temporada anterior</span>
    <div class="on"><span>Todos os tempos</span></div><span style="left:909px">Como pontuar</span><div class="rule"></div></div>
  <div class="rk-uline" data-l="uline"></div>
  <div class="rk-seg" data-l="seg"><b>Áreas</b><span>Contribuidores</span></div>
  ${RK_CARDS.map(card).join('')}
  <div class="rk-tbl" data-l="tbl"><span style="left:32px">#</span><span style="left:102px">ÁREA</span><span style="right:70px">PONTOS</span></div>
  <div class="rk-row" data-l="row"><span class="rk1">1</span><span class="av">DTS</span><b class="nm">DTS</b></div>
  <div class="rk-rnew" data-l="rnew">${icon('sparkles', '', 1.8)}<span>Novo na temporada</span></div>
  <div class="rk-rst" data-l="rstat">Publicações: 87 · Adoções: 142</div>
  <div class="rk-rpt" data-l="rpts"><b>1557</b><span>Pontos</span>${icon('chevdown', '', 2.2)}</div>
</div>`);
}
