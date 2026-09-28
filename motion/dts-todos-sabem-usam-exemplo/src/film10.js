// FLOWS · A Travessia (v10) — Fabio's journey in one flow, no speech (2:31, 30 fps).
// The plate (Fabio's footage as one continuous shot, tools/plate10.py) carries the story up to his press on
// Publicar Skill; the graphics live inside it (camera-tracked): the golden strand that becomes the FLOWS
// swoosh, DTS written in the sky by a thread of light born in the FLOWS O, three columns of light that
// level (Todos Sabem · Todos Usam · Somos Exemplo), the library counter, the press. A golden iris opens
// from the pressed button into the same hall in 3D (the v7 film as one take, re-lit at night), where
// Fabio appears in full body: beside the form, presenting the new skill, welcoming the fountain of light
// that reaches every skill of the library, raising the one beside the ranking, waving goodbye.
// Every value is a pure function of time T.
import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { E, clamp, lerp, seg, env as envl, pulse, rng, path } from './util.js';
import * as MG from './mg.js';
import * as O from './objects.js';
import * as K from './cut10.js';
import { buildFountain } from './fountain10.js';
import { SCHED } from './pace.js';

const mixv = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const pad = (n, w) => String(n).padStart(w, '0');
const SVGNS = 'http://www.w3.org/2000/svg';

export function buildFilm10({ world, film7, hud, meta, project, plate, track, font }) {
  const F0 = film7.film0, SHUTTER = film7.SHUTTER;
  const { T3D, IRIS, TAKE_F, DURATION } = K;
  hud.classList.add('v9', 'v10');
  // the take runs the name's anatomy a little faster than v7: its spotlight and labels leave more slowly
  SCHED.name.spot = [0.05, 0.45, 5.85, 6.75]; SCHED.name.out = [5.9, 6.7];
  const vis = MG.vis;

  // ---------------------------------------------------------------- the plate layer (under the graphics)
  const foot = document.createElement('div'); foot.id = 'footwrap'; foot.innerHTML = '<img class="fa" alt="">';
  hud.parentNode.insertBefore(foot, hud);
  const plateImg = foot.querySelector('img');
  const plateN = (T) => clamp(Math.round(T * K.FPS), 0, K.PLATE.n - 1);
  const plateSrc = (T) => `${K.PLATE.dir}/${K.PLATE.pfx}${pad(plateN(T), 5)}.jpg`;
  const r23At = (T) => { const f = plate.frames[plateN(T)]; return f && f[0] === 'r23' ? f[1] : null; };

  // camera tracks of the stage (plate frames; similarity from the reference frame): x' = a x - b y + tx
  const trk = (kind, T) => {
    const f = T * K.FPS, n0 = Math.floor(f), u = f - n0;
    const g = (n) => track[kind][String(clamp(n, track.n0, track.n1))];
    const A = g(n0), B = g(n0 + 1); return A.map((v, i) => v + (B[i] - v) * u);
  };
  const mtx = (m) => `matrix(${m[0].toFixed(5)},${m[1].toFixed(5)},${(-m[1]).toFixed(5)},${m[0].toFixed(5)},${m[2].toFixed(2)},${m[3].toFixed(2)})`;
  const apply = (m, x, y) => [m[0] * x - m[1] * y + m[2], m[1] * x + m[0] * y + m[3]];

  // ---------------------------------------------------------------- graphics layer
  const h10 = document.createElement('div'); h10.id = 'hud10'; hud.parentNode.appendChild(h10);
  h10.innerHTML = `
    <svg class="ribbon" width="1920" height="1080" viewBox="0 0 1920 1080"><g class="rb"></g></svg>
    <div class="trk sky"><div class="dts"><svg class="dsvg" width="1920" height="1080" viewBox="0 0 1920 1080" overflow="visible">
      <defs><linearGradient id="dFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3561c9"/><stop offset=".55" stop-color="#1a3a93"/><stop offset="1" stop-color="#0e2263"/></linearGradient>
      <linearGradient id="dEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c8"/><stop offset=".5" stop-color="#f6c254"/><stop offset="1" stop-color="#d0801a"/></linearGradient>
      <linearGradient id="dSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="dPen"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#ffe7a8"/><stop offset=".6" stop-color="rgba(255,176,60,.45)"/><stop offset="1" stop-color="rgba(255,150,40,0)"/></radialGradient>
      <clipPath id="dClip"></clipPath></defs>
      <g class="dfill"></g><g class="dsheen" clip-path="url(#dClip)"><rect class="sh" x="0" y="0" width="160" height="1080" fill="url(#dSheen)"/></g>
      <g class="dglow"></g><g class="ddark"></g><g class="dline"></g><path class="thread" fill="none"/>
      <g class="pen"><circle r="34" fill="url(#dPen)"/><circle r="4.5" fill="#fff"/></g></svg>
      <div class="tag"><i></i><span>DIGITAL &amp; TECHNOLOGY SERVICES</span><i></i></div></div></div>
    <div class="trk floor"><div class="cols"></div></div>
    <div class="act"><b></b><span></span></div>
    <div class="step"><div class="pl"><b class="n"></b><span class="k"></span><span class="t"></span></div></div>
    <div class="c441"><div class="n mk"><span>0</span></div><div class="l mk"><span>skills na Biblioteca de Skills</span></div></div>
    <div class="press"><div class="pglow"></div><div class="pring"></div><div class="pring r2"></div><div class="pflash"></div><div class="psp"></div></div>
    <div class="iris"></div>
    <div class="num1"><div class="rays"></div><b>Nº 1</b></div>`;
  const $ = (s) => h10.querySelector(s);
  const rise = (el, u) => { el.style.transform = `translateY(${((1 - u) * 108).toFixed(2)}%)`; };

  // ---- 1. the golden strand (A: the spiral's light tightens into the FLOWS swoosh)
  const ribbon = $('.ribbon'), rbG = $('.rb');
  rbG.innerHTML = [0, 1].map((k) => `<ellipse class="rg${k}" fill="none" stroke="rgba(255,170,50,.35)" stroke-width="30" stroke-linecap="round"/><ellipse class="rd${k}" fill="none" stroke="#c87414" stroke-width="12" stroke-linecap="round"/><ellipse class="rb${k}" fill="none" stroke="#fff0c0" stroke-width="5" stroke-linecap="round"/>`).join('');
  const rbE = [0, 1].map((k) => ['rg', 'rd', 'rb'].map((c) => rbG.querySelector(`.${c}${k}`)));
  function ribbonAt(T) {
    const { a, b, from: A, to: B } = K.RIBBON, u = seg(T, a, b);
    if (!vis(ribbon, u > 0 && u < 1)) return;
    const m = E.inOutCubic(seg(u, 0.12, 0.72));
    const cx = lerp(A.cx, B.cx, m), cy = lerp(A.cy, B.cy, m), rx = lerp(A.rx, B.rx, m), ry = lerp(A.ry, B.ry, E.inOutSine(seg(u, 0.2, 0.78)));
    const tilt = lerp(-9, 0, m), o = E.outCubic(seg(u, 0, 0.16)) * (1 - E.inCubic(seg(u, 0.74, 1)));
    const L = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));   // ellipse perimeter
    const arc = L * lerp(0.26, 0.36, m), spin = -L * (u * 1.35);
    rbE.forEach((els, k) => els.forEach((e, j) => {
      e.setAttribute('cx', cx.toFixed(1)); e.setAttribute('cy', cy.toFixed(1)); e.setAttribute('rx', rx.toFixed(1)); e.setAttribute('ry', ry.toFixed(1));
      e.setAttribute('transform', `rotate(${tilt.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
      e.style.strokeDasharray = `${arc.toFixed(1)} ${(L - arc).toFixed(1)}`; e.style.strokeDashoffset = `${(spin + k * L * 0.5).toFixed(1)}`;
      e.style.strokeWidth = `${[30, 12, 5][j] * lerp(0.8, 1.6, m)}`;
    }));
    ribbon.style.opacity = o.toFixed(3);
  }

  // ---- 2. DTS written in the sky (sky track): glyph outlines of the film's font (Nunito 900)
  const skyT = $('.trk.sky'), dtsBox = $('.dts'), dsvg = $('.dsvg'), tag = $('.tag');
  const gFill = dsvg.querySelector('.dfill'), gGlow = dsvg.querySelector('.dglow'), gDark = dsvg.querySelector('.ddark'), gLine = dsvg.querySelector('.dline');
  const thread = dsvg.querySelector('.thread'), pen = dsvg.querySelector('.pen'), sheen = dsvg.querySelector('.sh'), clip = dsvg.querySelector('#dClip');
  const D = K.DTS;
  const glyphs = (() => {
    const sc = D.size / font.resolution, sp = 0.035 * D.size, out = []; let x = 0;
    for (const ch of 'DTS') {
      const g = font.glyphs[ch], o = g.o.trim().split(/\s+/), cs = []; let cur = null;
      const P = (i) => [x + +o[i] * sc, -(+o[i + 1]) * sc];
      for (let i = 0; i < o.length;) {
        const c = o[i++];
        if (c === 'm') { cur = [`M${P(i).map((v) => v.toFixed(2)).join(' ')}`]; cs.push(cur); i += 2; }
        else if (c === 'l') { cur.push(`L${P(i).map((v) => v.toFixed(2)).join(' ')}`); i += 2; }
        else if (c === 'q') { const e = P(i), q = P(i + 2); cur.push(`Q${q[0].toFixed(2)} ${q[1].toFixed(2)} ${e[0].toFixed(2)} ${e[1].toFixed(2)}`); i += 4; }
        else if (c === 'b') { const e = P(i), c1 = P(i + 2), c2 = P(i + 4); cur.push(`C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${e[0].toFixed(2)} ${e[1].toFixed(2)}`); i += 6; }
      }
      out.push({ ch, contours: cs.map((c) => c.join(' ') + ' Z') });
      x += g.ha * sc + sp;
    }
    return { list: out, width: x - sp };
  })();
  const gx = D.cx - glyphs.width / 2;
  const mkPath = (parent, d, attrs) => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v); parent.appendChild(p); return p; };
  const wrap = (g) => { const w = document.createElementNS(SVGNS, 'g'); w.setAttribute('transform', `translate(${gx.toFixed(2)} ${D.base})`); g.appendChild(w); return w; };
  const wFill = wrap(gFill), wGlow = wrap(gGlow), wDark = wrap(gDark), wLine = wrap(gLine), wClip = wrap(clip);
  const fills = glyphs.list.map((g) => mkPath(wFill, g.contours.join(' '), { fill: 'url(#dFill)', stroke: 'url(#dEdge)', 'stroke-width': '3.2', 'stroke-linejoin': 'round' }));
  glyphs.list.forEach((g) => mkPath(wClip, g.contours.join(' '), {}));
  const strokes = [];
  glyphs.list.forEach((g, gi) => g.contours.forEach((d) => {
    const glow = mkPath(wGlow, d, { fill: 'none', stroke: 'rgba(255,184,70,.45)', 'stroke-width': '16', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const dark = mkPath(wDark, d, { fill: 'none', stroke: '#a55a0c', 'stroke-width': '7', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    const line = mkPath(wLine, d, { fill: 'none', stroke: '#ffe7a6', 'stroke-width': '3.2', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    strokes.push({ gi, glow, dark, line, L: 1 });
  }));
  // pen schedule: constant speed along every outline, a short hop between outlines
  const HOP = 0.075;
  let penSched = null;
  const schedule = () => {
    strokes.forEach((s) => { s.L = s.line.getTotalLength(); [s.glow, s.dark, s.line].forEach((p) => { p.style.strokeDasharray = `${s.L} ${s.L}`; }); });
    const tot = strokes.reduce((a, s) => a + s.L, 0), dur = D.write[1] - D.write[0] - HOP * (strokes.length - 1);
    let t = D.write[0]; penSched = strokes.map((s) => { const a = t, b = t + (s.L / tot) * dur; t = b + HOP; return { a, b }; });
    window.__dtsPen = penSched.map((q, i) => [strokes[i].gi, +q.a.toFixed(3), +q.b.toFixed(3)]);
    // the thread from the top of the FLOWS O to the first point of the D
    const p0 = strokes[0].line.getPointAtLength(0), sx = gx + p0.x, sy = D.base + p0.y;
    thread.setAttribute('d', `M${D.O[0]} ${D.O[1] - 78} Q${(D.O[0] + sx) / 2 - 60} ${Math.min(D.O[1] - 78, sy) - 90} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
    thread.dataset.L = thread.getTotalLength();
  };
  const penAt = (p, u) => { const q = p.getPointAtLength(u); return [gx + q.x, D.base + q.y]; };
  function dtsAt(T) {
    const on = T > D.a - 0.05 && T < D.out[1] + 0.05;
    if (!vis(skyT, on)) return;
    if (!penSched) schedule();
    skyT.style.transform = mtx(trk('sky', T));
    // shrink toward the top once read, making room for the columns' labels
    const sh = E.inOutCubic(seg(T, D.shrink[0], D.shrink[1])), s = lerp(1, D.shrinkTo, sh), by = lerp(D.base, D.shrinkBase, sh);
    dtsBox.style.transform = `translate(${D.cx}px, ${by.toFixed(2)}px) scale(${s.toFixed(4)}) translate(${-D.cx}px, ${-D.base}px)`;
    const out = E.inOutSine(seg(T, D.out[0], D.out[1]));
    dtsBox.style.opacity = (1 - out).toFixed(3);
    // the thread from the O
    const tu = seg(T, D.a, D.write[0] - 0.02), TL = +thread.dataset.L;
    thread.style.strokeDasharray = `${TL} ${TL}`; thread.style.strokeDashoffset = `${(TL * (1 - E.inOutSine(tu))).toFixed(1)}`;
    thread.style.opacity = (tu > 0 ? 1 - E.inOutSine(seg(T, D.write[0] + 0.1, D.write[0] + 0.7)) : 0).toFixed(3);
    // the pen draws every outline; the letters fill, then a sheen crosses them
    let pp = null;
    if (T < D.write[0]) { if (tu > 0 && tu < 1) { const q = thread.getPointAtLength(TL * E.inOutSine(tu)); pp = [q.x, q.y]; } }
    strokes.forEach((s, i) => {
      const { a, b } = penSched[i], u = seg(T, a, b), off = s.L * (1 - u);
      s.glow.style.strokeDashoffset = s.dark.style.strokeDashoffset = s.line.style.strokeDashoffset = `${off.toFixed(1)}`;
      if (T >= a && T <= b) pp = penAt(s.line, s.L * u);
      else if (i < strokes.length - 1 && T > b && T < penSched[i + 1].a) { const A = penAt(s.line, s.L), B = penAt(strokes[i + 1].line, 0), h = seg(T, b, penSched[i + 1].a); pp = [lerp(A[0], B[0], h), lerp(A[1], B[1], h) - Math.sin(Math.PI * h) * 26]; }
    });
    const fu = E.inOutSine(seg(T, D.fill[0], D.fill[1]));
    fills.forEach((f) => { f.style.opacity = fu.toFixed(3); });
    gGlow.style.opacity = (0.95 - 0.7 * fu).toFixed(3); gDark.style.opacity = (0.9 * (1 - fu)).toFixed(3); gLine.style.opacity = (1 - 0.85 * fu).toFixed(3);
    const su = seg(T, D.fill[1] - 0.1, D.fill[1] + 0.8);
    sheen.setAttribute('x', (lerp(gx - 200, gx + glyphs.width + 40, E.inOutSine(su))).toFixed(1)); sheen.style.opacity = (su > 0 && su < 1 ? 1 : 0);
    vis(pen, !!pp);
    if (pp) pen.setAttribute('transform', `translate(${pp[0].toFixed(1)} ${pp[1].toFixed(1)}) scale(${(1 + 0.12 * Math.sin(T * 40)).toFixed(3)})`);
    // the tagline: from the centre outward, then its rules
    const gu = E.inOutCubic(seg(T, D.tag[0], D.tag[1]));
    tag.style.clipPath = `inset(-20px ${((1 - gu) * 50).toFixed(2)}% -20px ${((1 - gu) * 50).toFixed(2)}%)`;
    tag.style.setProperty('--r', E.outCubic(seg(T, D.tag[0] + 0.3, D.tag[1] + 0.3)).toFixed(3));
  }
  tag.style.top = `${D.base + 22}px`;

  // ---- 3. the nivelamento: three columns of light on the stage (floor track)
  const floorT = $('.trk.floor'), colsBox = $('.cols'), CL = K.COLS;
  colsBox.innerHTML = CL.names.map((n, k) => `<div class="col c${k}" style="--c:${CL.colors[k][0]};--l:${CL.colors[k][1]}"><div class="foot"></div><div class="beam"></div><div class="core"></div><div class="cap"></div>${'<i class="mote"></i>'.repeat(9)}<div class="lbl"><span><i></i>${n}</span></div></div>`).join('') + '<div class="lvl"><b></b></div>';
  const cols = [...colsBox.querySelectorAll('.col')].map((el, k) => ({ el, k, foot: el.querySelector('.foot'), beam: el.querySelector('.beam'), core: el.querySelector('.core'), cap: el.querySelector('.cap'), lbl: el.querySelector('.lbl'), lblIn: el.querySelector('.lbl span'), motes: [...el.querySelectorAll('.mote')], w: k === 1 ? 170 : 124 }));
  const lvl = colsBox.querySelector('.lvl'), lvlHead = lvl.querySelector('b');
  const LX0 = CL.bases[0][0] - 170, LX1 = CL.bases[2][0] + 170;
  const lineX = (T) => lerp(LX0, LX1, E.inOutSine(seg(T, CL.line[0], CL.line[1])));
  const passT = CL.bases.map(([bx]) => { let lo = CL.line[0], hi = CL.line[1]; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (lineX(m) < bx) lo = m; else hi = m; } return (lo + hi) / 2; });
  const spring = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.cos(u * Math.PI * 2.5) * Math.exp(-u * 5.5));
  function colsAt(T) {
    const on = T > CL.rise[0] - 0.25 && T < CL.out[1] + 0.4;
    if (!vis(floorT, on)) return;
    floorT.style.transform = mtx(trk('floor', T));
    cols.forEach((c) => {
      const [bx, by] = CL.bases[c.k], t0 = CL.rise[c.k], k = c.k;
      const ru = seg(T, t0, t0 + CL.riseDur), first = by - (by - CL.first[k]) * E.outBack(ru, 1.5);
      const lu = seg(T, passT[k], passT[k] + 0.62), top0 = lerp(first, CL.level, spring(lu));
      const ou = E.inCubic(seg(T, CL.out[0] + k * 0.1, CL.out[1] + k * 0.1));
      const top = lerp(top0, by, ou), h = Math.max(0, by - top), w = c.w * (1 - 0.25 * ou);
      const a = (ru > 0 ? 1 : 0) * (1 - E.inQuad(seg(T, CL.out[1] - 0.2 + k * 0.1, CL.out[1] + 0.25 + k * 0.1)));
      c.el.style.opacity = a.toFixed(3);
      if (a <= 0.001) return;
      c.beam.style.cssText = `left:${(bx - w / 2).toFixed(1)}px;top:${top.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
      c.core.style.cssText = `left:${(bx - 1.6).toFixed(1)}px;top:${top.toFixed(1)}px;height:${h.toFixed(1)}px;opacity:${(0.55 + 0.45 * pulse(T, t0, 0.05, 0.5)).toFixed(3)}`;
      const fl = pulse(T, t0 - 0.05, 0.08, 0.45), capF = pulse(T, passT[k], 0.05, 0.35);
      c.cap.style.cssText = `left:${(bx - w / 2).toFixed(1)}px;top:${(top - w * 0.14).toFixed(1)}px;width:${w.toFixed(1)}px;height:${(w * 0.28).toFixed(1)}px;box-shadow:0 0 ${(18 + 40 * capF).toFixed(0)}px ${(6 + 16 * capF).toFixed(0)}px var(--c), inset 0 0 12px 2px rgba(255,255,255,${(0.5 + 0.5 * capF).toFixed(2)})`;
      const fw = c.w * (1.55 + 0.6 * fl);
      c.foot.style.cssText = `left:${(bx - fw / 2).toFixed(1)}px;top:${(by - fw * 0.15).toFixed(1)}px;width:${fw.toFixed(1)}px;height:${(fw * 0.3).toFixed(1)}px;opacity:${(0.75 + 0.25 * fl).toFixed(3)}`;
      c.motes.forEach((m, i) => {
        const R = ((i * 0.618 + k * 0.37) % 1), sp = 0.28 + R * 0.3, yy = ((T * sp + R) % 1);
        const x = bx + Math.sin(i * 2.1 + T * (0.8 + R)) * w * 0.3, y = by - yy * h;
        m.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; m.style.opacity = (Math.sin(Math.PI * yy) * 0.9).toFixed(3);
      });
      // the label rides the column's top once levelled
      const la = CL.labels[0] + k * 0.2, lu2 = E.outCubic(seg(T, la, la + 0.55));
      c.lbl.style.left = `${bx.toFixed(1)}px`; c.lbl.style.top = `${(top - w * 0.14 - 10).toFixed(1)}px`;
      c.lblIn.style.transform = `translateY(${((1 - lu2) * 22).toFixed(2)}px) scale(${(0.9 + 0.1 * lu2).toFixed(4)})`;
      c.lbl.style.opacity = (Math.min(1, lu2 * 1.4) * (1 - E.inCubic(seg(T, CL.out[0] - 0.1 + k * 0.1, CL.out[0] + 0.35 + k * 0.1)))).toFixed(3);
    });
    // the level line: drawn left to right by a spark, then it stays, thin, joining the tops
    const lu = seg(T, CL.line[0], CL.line[1]), x = lineX(T), lo = (lu > 0 ? 1 : 0) * (1 - E.inQuad(seg(T, CL.out[0] - 0.2, CL.out[0] + 0.3)));
    lvl.style.cssText = `left:${LX0}px;top:${CL.level - 1.5}px;width:${Math.max(0, x - LX0).toFixed(1)}px;opacity:${lo.toFixed(3)}`;
    lvlHead.style.opacity = (lu > 0 && lu < 1 ? 1 : 0);
    lvl.classList.toggle('done', lu >= 1);
  }

  // ---- 4. act tag (top left) and step tag (bottom): titles only
  const act = $('.act'), actB = act.querySelector('b'), actS = act.querySelector('span');
  let actKey = null;
  function actAt(T) {
    const A = K.ACTS.find(([a, b]) => T > a - 0.05 && T < b + 0.65);
    if (!vis(act, !!A)) return;
    const [a, b, n, name, c] = A;
    if (actKey !== n) { actKey = n; actB.textContent = n; actS.textContent = name; act.style.setProperty('--c', c); }
    const u = E.outCubic(seg(T, a, a + 0.7)), o = 1 - E.inOutSine(seg(T, b, b + 0.6));
    act.style.opacity = (u * o).toFixed(3); act.style.transform = `translateX(${((1 - u) * -24).toFixed(1)}px)`;
  }
  const step = $('.step'), stN = step.querySelector('.n'), stK = step.querySelector('.k'), stT = step.querySelector('.t'), stP = step.querySelector('.pl');
  let stepKey = null;
  const inv = (nt) => { let lo = T3D, hi = DURATION; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (TAKE_F(m) < nt) lo = m; else hi = m; } return (lo + hi) / 2; };
  const STEPS = K.STEPS.map(([a, b, n, name, w]) => (w === 'foot' ? [a, b, n, name] : [inv(a), inv(b), n, name]));
  function stepAt(T) {
    const i = STEPS.findIndex(([a, b]) => T > a - 0.05 && T < b + 0.5);
    if (!vis(step, i >= 0)) return;
    const [a, b, n, name] = STEPS[i], prv = STEPS[i - 1], nxt = STEPS[i + 1];
    if (stepKey !== n) { stepKey = n; stN.textContent = String(n); stK.textContent = `Passo ${n} de 6`; stT.textContent = name; }
    const cIn = prv && Math.abs(prv[1] - a) < 0.1, cOut = nxt && Math.abs(nxt[0] - b) < 0.1;
    const oIn = cIn ? 1 : E.outCubic(seg(T, a, a + 0.5)), oOut = cOut ? 1 : 1 - E.inCubic(seg(T, b, b + 0.45));
    stP.style.opacity = Math.min(oIn, oOut).toFixed(3);
    const tIn = E.outCubic(seg(T, a, a + 0.55));
    stT.style.opacity = tIn.toFixed(3); stT.style.transform = `translateY(${((1 - tIn) * 10).toFixed(1)}px)`;
    stP.style.transform = `translateY(${((1 - oIn) * 16).toFixed(1)}px)`;
  }

  // ---- 5. the library counter while the skills orbit
  const c441 = $('.c441'), c441n = c441.querySelector('.n span'), c441N = c441.querySelector('.n'), c441l = c441.querySelector('.l span');
  function countAt(T) {
    const { a, b, n } = K.COUNT441, o = envl(T, a, a + 0.5, b - 0.5, b, 'outCubic', 'inOutSine');
    if (!vis(c441, o > 0.003)) return;
    c441.style.opacity = o.toFixed(3);
    const u1 = E.outCubic(seg(T, a, a + 0.7)), u2 = E.outCubic(seg(T, a + 0.35, a + 1.0));
    c441N.style.transform = `translateY(${((1 - u1) * 30).toFixed(2)}px)`; c441N.style.opacity = u1.toFixed(3);
    c441l.style.transform = `translateY(${((1 - u2) * 16).toFixed(2)}px)`; c441l.style.opacity = u2.toFixed(3);
    c441n.textContent = String(Math.round(n * E.outCubic(seg(T, a + 0.1, a + 1.9))));
    c441.style.transform = `scale(${(1 + 0.025 * seg(T, a, b)).toFixed(4)})`;
  }

  // ---- 6. the press (Fabio's own finger) and the golden iris
  const press = $('.press'), pglow = $('.pglow'), prings = [...h10.querySelectorAll('.pring')], pflash = $('.pflash'), psp = $('.psp');
  psp.innerHTML = '<i></i>'.repeat(26);
  const spk = [...psp.querySelectorAll('i')];
  const capsule = (T) => { const C = K.CAPSULE; if (T <= C[0][0]) return C[0].slice(1); for (let i = 1; i < C.length; i++) if (T <= C[i][0]) { const u = (T - C[i - 1][0]) / (C[i][0] - C[i - 1][0]); return C[i].slice(1).map((v, j) => lerp(C[i - 1][j + 1], v, u)); } return C[C.length - 1].slice(1); };
  const tipAt = (f) => { const ks = Object.keys(K.TIP).map(Number).sort((x, y) => x - y); if (f <= ks[0]) return K.TIP[ks[0]]; for (let i = 1; i < ks.length; i++) if (f <= ks[i]) { const u = (f - ks[i - 1]) / (ks[i] - ks[i - 1]); return K.TIP[ks[i]].map((v, j) => lerp(K.TIP[ks[i - 1]][j], v, u)); } return K.TIP[ks[ks.length - 1]]; };
  const iris = $('.iris');
  const irisAt = (T) => { const [x, y] = capsule(T); return { x, y: y - 6, R: E.inCubic(seg(T, IRIS.t, IRIS.t + IRIS.dur)) * 2350 }; };
  function pressAt(T) {
    const on = T > K.PRESS - 0.15 && T < IRIS.t + IRIS.dur;
    if (!vis(press, on)) return;
    const [cx, cy, cw] = capsule(T), f = r23At(T), [tx, ty] = f ? tipAt(f) : [cx, cy - 120];
    // the capsule charges with light under his finger
    const g = E.inOutSine(seg(T, K.PRESS, IRIS.t)) * 0.75 + pulse(T, K.PRESS, 0.04, 0.3) * 0.5;
    pglow.style.cssText = `left:${(cx - cw * 0.56).toFixed(1)}px;top:${(cy - cw * 0.2).toFixed(1)}px;width:${(cw * 1.12).toFixed(1)}px;height:${(cw * 0.4).toFixed(1)}px;opacity:${Math.min(1, g).toFixed(3)}`;
    prings.forEach((r, i) => {
      const u = seg(T, K.PRESS + i * 0.14, K.PRESS + i * 0.14 + 0.8), w = 30 + cw * 0.95 * E.outCubic(u);
      r.style.cssText = `left:${(tx - w / 2).toFixed(1)}px;top:${(ty + 6 - w * 0.16).toFixed(1)}px;width:${w.toFixed(1)}px;height:${(w * 0.32).toFixed(1)}px;opacity:${(u > 0 && u < 1 ? (1 - u) * 0.95 : 0).toFixed(3)}`;
    });
    const fl = pulse(T, K.PRESS, 0.03, 0.22);
    pflash.style.cssText = `left:${tx.toFixed(1)}px;top:${(ty + 4).toFixed(1)}px;opacity:${fl.toFixed(3)};transform:translate(-50%,-50%) scale(${(0.6 + fl).toFixed(3)})`;
    spk.forEach((s, i) => {
      const t0 = K.PRESS + (i % 13) * 0.03, dt = T - t0, life = 0.7 + (i % 5) * 0.08;
      if (dt < 0 || dt > life) { s.style.opacity = 0; return; }
      const az = -Math.PI / 2 + (i / 26 - 0.5) * 2.6, v = 260 + (i % 7) * 50, dr = (1 - Math.exp(-3 * dt)) / 3;
      s.style.opacity = (1 - dt / life).toFixed(3);
      s.style.transform = `translate(${(tx + Math.cos(az) * v * dr).toFixed(1)}px, ${(ty + Math.sin(az) * v * dr * 0.8 + 240 * dt * dt).toFixed(1)}px)`;
    });
  }

  // ---- 7. the golden Nº 1 over Fabio's raised finger (3D anchored, set in update)
  const num1 = $('.num1');

  function graphics(T) {
    ribbonAt(T); dtsAt(T); colsAt(T); actAt(T); stepAt(T); countAt(T); pressAt(T);
    const I = irisAt(T), u = seg(T, IRIS.t - 0.03, IRIS.t + IRIS.dur), on = u > 0 && u < 1;
    if (vis(iris, on)) {
      iris.style.left = `${I.x.toFixed(1)}px`; iris.style.top = `${I.y.toFixed(1)}px`; iris.style.width = iris.style.height = `${(2 * I.R + 6).toFixed(1)}px`;
      iris.style.opacity = (Math.min(1, u * 14) * (1 - E.inQuad(seg(T, IRIS.t + IRIS.dur * 0.55, IRIS.t + IRIS.dur)))).toFixed(3);
    }
  }

  // ---------------------------------------------------------------- Fabio in the world (full body), as v9
  const fg = new THREE.Scene();
  const fgPass = new RenderPass(fg, world.camera); fgPass.clear = false; fgPass.clearDepth = true;
  world.composer.insertPass(fgPass, 3);
  const fabTex = new THREE.Texture(); fabTex.colorSpace = THREE.SRGBColorSpace; fabTex.premultiplyAlpha = true;
  fabTex.minFilter = THREE.LinearMipmapLinearFilter; fabTex.generateMipmaps = true; fabTex.anisotropy = world.maxAniso || 8;
  const fabMat = new THREE.ShaderMaterial({
    transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: false,
    uniforms: { map: { value: fabTex }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uRim: { value: new THREE.Color(1.0, 0.74, 0.42) }, uRimK: { value: 0.45 }, uA: { value: 1 }, uRev: { value: 1 }, uFeet: { value: 0.02 }, uTop: { value: 0.97 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D map; uniform vec3 uGain; uniform vec3 uRim; uniform float uRimK, uA, uRev, uFeet, uTop; varying vec2 vUv;
      void main(){ vec4 c = texture2D(map, vUv); float a = c.a; vec3 rgb = c.rgb * uGain;
        float edge = smoothstep(0.0, 0.5, a) * (1.0 - smoothstep(0.5, 1.0, a));
        rgb += uRim * edge * a * uRimK;
        float h = clamp((vUv.y - uFeet) / (uTop - uFeet), 0.0, 1.0);
        rgb *= mix(0.78, 1.0, smoothstep(0.0, 0.28, h));
        float lv = uRev * 1.08 - 0.04;
        float keep = 1.0 - smoothstep(lv - 0.012, lv + 0.012, h);
        float band = exp(-pow((h - lv) / 0.03, 2.0)) * step(0.001, uRev) * (1.0 - step(1.0, uRev));
        vec3 gold = vec3(1.0, 0.8, 0.45);
        vec4 o = vec4(rgb * keep + gold * band * a * 2.4, a * max(keep, band * 0.9));
        gl_FragColor = o * uA; }`,
  });
  const fab = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fabMat); fab.renderOrder = 2; fab.frustumCulled = false; fg.add(fab);
  const ringMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uA: { value: 0 }, uR: { value: 0.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float uA, uR; void main(){ float r = length(vUv - 0.5) * 2.0; float ring = exp(-pow((r - uR) / 0.035, 2.0)) + 0.35 * exp(-pow((r - uR * 0.72) / 0.02, 2.0)); float disc = exp(-r * r / 0.18) * 0.25; gl_FragColor = vec4(vec3(1.0, 0.78, 0.42) * (ring + disc) * uA, 1.0); }' });
  const fring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat); fring.rotation.x = -Math.PI / 2; fring.renderOrder = 1; fring.frustumCulled = false; fg.add(fring);
  const NS = 110, spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3)); spGeo.setAttribute('a', new THREE.BufferAttribute(new Float32Array(NS), 1));
  const spMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uS: { value: 7 } },
    vertexShader: 'attribute float a; varying float vA; uniform float uS; void main(){ vA = a; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(uS * 900.0 / -mv.z, 1.0, 16.0) * (0.5 + 0.5*a); }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float k = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(1.0,0.82,0.5) * k * vA * 2.0, 1.0); }' });
  const sparks = new THREE.Points(spGeo, spMat); sparks.renderOrder = 3; sparks.frustumCulled = false; fg.add(sparks);
  const shadow = O.contactShadow(1, 1, 0.55); world.scene.add(shadow); shadow.visible = false;
  let fabShown = '';
  const setFab = (img, key) => { if (fabShown === key) return; fabTex.image = img; fabTex.needsUpdate = true; fabShown = key; };
  const standAt = (T) => K.STANDS.find((s) => T >= s.a && T < s.b);
  const poseIdx = (s, T) => { const [f0, f1] = s.frames, L = f1 - f0, k = Math.max(0, Math.floor((T - s.a) * 24)), m = k % (2 * L); return m <= L ? f0 + m : f1 - (m - L); };
  const geomOf = (s) => { const M = meta[s.pose], k = s.h / (M.sole - M.top), w = M.w * k, h = M.h * k; return { w, h, cx: (M.w / 2 - M.footX) * k, cy: h / 2 - (M.h - M.sole) * k, k, M }; };

  // ---------------------------------------------------------------- camera detours (blended over the take)
  const CAMS = K.CAMS.map((c) => ({ ...c, P: c.keys.map((k) => [k[0], k[1]]), Tg: c.keys.map((k) => [k[0], k[2]]), fov: c.keys.map((k) => [k[0], [k[3]]]) }));
  const camAt = (T, pose) => {
    let P = pose.P, Tg = pose.T, fov = pose.fov, ap = pose.aperture, any = false;
    for (const c of CAMS) {
      if (T < c.a || T > c.b) continue;
      const wIn = c.fin > 0 ? E.inOutSine(seg(T, c.a, c.a + c.fin)) : 1, wOut = c.fout > 0 ? 1 - E.inOutSine(seg(T, c.b - c.fout, c.b)) : 1, w = Math.min(wIn, wOut);
      if (w <= 0) continue;
      P = mixv(P, path(c.P, T), w); Tg = mixv(Tg, path(c.Tg, T), w); fov = lerp(fov, path(c.fov, T)[0], w); ap = lerp(ap, c.ap || 1.0e-4, w); any = true;
    }
    return any ? { P, T: Tg, fov, aperture: ap } : null;
  };
  // a detour that keeps its own point in focus (the fountain), with its weight
  const focusCam = (T) => { for (const c of CAMS) { if (!c.focusAt || T < c.a || T > c.b) continue; const wIn = c.fin > 0 ? E.inOutSine(seg(T, c.a, c.a + c.fin)) : 1, wOut = c.fout > 0 ? 1 - E.inOutSine(seg(T, c.b - c.fout, c.b)) : 1; return { at: c.focusAt, w: Math.min(wIn, wOut) }; } return null; };
  let hookT = 0;
  window.__camHook = (nt, pose) => camAt(hookT, pose);

  // ---------------------------------------------------------------- the fountain and the library's light
  const fountain = buildFountain({ world, ring: film7.ring, slotPos: film7.slotPos, TARGET: film7.TARGET, F: K.FOUNT });
  film7.ring.face.material.emissiveIntensity = 0.2;   // at night the cards glow softly, like screens
  film7.ring.body.material.color.set(0xcdd5ec);
  // the new skill's halo on the library wall (from its landing until its drop leaves)
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(420, 320), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uA: { value: 0 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float uA, uT; void main(){ vec2 p = (vUv - 0.5) * vec2(1.3, 1.0); float r = length(p); float g = exp(-r * r / 0.05) * 0.9 + exp(-r * r / 0.18) * 0.35; float rays = 0.5 + 0.5 * sin(atan(p.y, p.x) * 10.0 + uT * 0.8); g += exp(-r * r / 0.12) * rays * 0.25; gl_FragColor = vec4(vec3(1.0, 0.76, 0.4) * g * uA, 1.0); }' }));
  halo.position.copy(film7.slotPos); halo.quaternion.copy(film7.slotQ); halo.translateZ(-6); halo.renderOrder = 5; halo.userData.noDepth = true; world.scene.add(halo); halo.visible = false;
  let fountOut = { cards: null, energy: 0, flash: 0 }, ringT = 0;
  window.__v10 = {
    hideBtn: true, noThreads: true,
    ringHook: (ring) => {
      const T = ringT, F = K.FOUNT;
      // the whole library shines once every jet has landed (a wave around the ring)
      const ga = envl(T, F.allGlow[0], F.allGlow[1], F.calm[0], F.drain[1], 'inOutSine', 'inOutSine');
      if (ga > 0.001) for (let i = 0; i < ring.N; i++) { const sl = ring.slots[i]; const da = Math.abs(Math.atan2(Math.sin(sl.a), Math.cos(sl.a))) / Math.PI; const w = pulse(T, F.allGlow[0] + da * 1.1 + sl.r * 0.04, 0.2, 0.9); ring.set(i, 1, w * 18, ga * 0.32 + w * 0.5); }
      if (fountOut.cards) for (const [i, g, lift] of fountOut.cards) ring.set(i, 1, lift, g + ga * 0.2);
    },
  };

  // ---------------------------------------------------------------- the 3D birth of the form (golden sparkles under the iris)
  // (the v7 modal is born at its button's place; the button is hidden: it is born from the light instead)

  // ---------------------------------------------------------------- update
  function update(T) {
    graphics(T);
    const inFoot = T < IRIS.t + IRIS.dur, in3d = T >= T3D;
    vis(foot, inFoot);
    if (inFoot) {
      const I = irisAt(T);
      if (I.R > 0) { const m = `radial-gradient(circle at ${I.x.toFixed(1)}px ${I.y.toFixed(1)}px, transparent ${Math.max(0, I.R - 1).toFixed(1)}px, #000 ${(I.R + 1.5).toFixed(1)}px)`; foot.style.webkitMaskImage = m; foot.style.maskImage = m; }
      else { foot.style.webkitMaskImage = 'none'; foot.style.maskImage = 'none'; }
    }
    if (!in3d) { hud.classList.add('off'); fab.visible = fring.visible = sparks.visible = shadow.visible = false; vis(num1, false); fountain.update(-1); return { skip3d: true }; }
    hud.classList.remove('off');
    const nt7 = TAKE_F(T);
    for (const k of ['k', 'rank', 'end']) hud.classList.toggle(`show-${k}`, K.SHOW.some(([id, a, b]) => id === k && nt7 >= a && nt7 < b));
    hookT = Math.max(T3D, T - SHUTTER);
    const pp = film7.cam(TAKE_F(hookT)); world.setPrevCamera(pp.P, pp.T, pp.fov, T - T3D > 0.03 ? 1 : 0);
    hookT = T; ringT = T;
    fountOut = fountain.update(T);
    film7.update(F0 + nt7);
    // the new skill glows on the wall while Fabio presents it, and swells before its drop leaves
    {
      const Fo = K.FOUNT, P0 = K.STANDS.find((q) => q.id === 'present').inAt;
      const g = envl(T, P0 - 0.1, P0 + 0.9, Fo.drop[0], Fo.drop[0] + 0.4, 'outCubic', 'inOutSine') * (0.62 + 0.18 * Math.sin(T * 2.6)) + 0.9 * envl(T, Fo.glowCard, Fo.drop[0] - 0.05, Fo.drop[0], Fo.drop[0] + 0.3);
      halo.visible = g > 0.005; halo.material.uniforms.uA.value = g; halo.material.uniforms.uT.value = T;
      const nc = film7.newCard; if (nc.visible && g > 0.005) { const b = nc.userData.body.material; b.emissive.setHex(0xffb347); b.emissiveIntensity = Math.max(b.emissiveIntensity, Math.min(1.3, g * 1.3)); }
    }
    // the three pillars (the nivelamento of the opening) stay underground until the fountain raises them
    film7.PILLARS.forEach((p, k) => {
      const t0 = K.FOUNT.pillars[k], u = seg(T, t0, t0 + 0.95);
      if (T < t0) { p.g.visible = false; film7.aoPil[k].visible = false; return; }
      p.g.position.y = -210 * (1 - E.outBack(u, 1.2));
      const ao = film7.aoPil[k]; ao.visible = true; ao.material.opacity = ao.userData.k * clamp(1 - Math.abs(p.g.position.y) / 90);
    });
    // the fountain's light on the film
    if (fountOut.energy > 0 || fountOut.flash > 0) {
      world.bloom.strength += 0.14 * fountOut.energy;
      world.grade.uniforms.uFlashCol.value.set(1, 0.9, 0.72); world.grade.uniforms.uFlash.value = Math.max(world.grade.uniforms.uFlash.value, fountOut.flash);
    }
    world.plaza.material.emissiveIntensity = 1.0 + 0.9 * fountOut.energy + 1.4 * pulse(T, K.FOUNT.drop[1], 0.05, 0.8) + 1.1 * pulse(T, K.FOUNT.drain[0], 0.3, 0.9);
    // Fabio
    const s = standAt(T), cam = world.camera;
    fab.visible = fring.visible = sparks.visible = shadow.visible = !!s;
    vis(num1, false);
    if (s) {
      cam.updateMatrixWorld(true);
      const g = geomOf(s), [x, , z] = s.pos, yaw = Math.atan2(cam.position.x - x, cam.position.z - z);
      fab.rotation.set(0, yaw, 0);
      fab.position.set(x + Math.cos(yaw) * g.cx, g.cy, z - Math.sin(yaw) * g.cx);
      fab.scale.set(g.w, g.h, 1);
      fabMat.uniforms.uFeet.value = 1 - g.M.sole / g.M.h; fabMat.uniforms.uTop.value = 1 - g.M.top / g.M.h;
      // the fountain warms him (and rims him with its gold)
      const warm = s.id === 'welcome' ? fountOut.energy : 0;
      fabMat.uniforms.uGain.value.set(0.98 + 0.06 * warm, 0.95 + 0.02 * warm, 0.99 - 0.08 * warm);
      fabMat.uniforms.uRimK.value = 0.45 + 0.5 * warm;
      const rin = E.inOutSine(seg(T, s.inAt, s.inAt + 0.95)), rout = s.outAt < 900 ? E.inOutSine(seg(T, s.outAt, s.outAt + 0.6)) : 0;
      fabMat.uniforms.uRev.value = rout > 0 ? 1 - rout : rin;
      fabMat.uniforms.uA.value = 1;
      const rv = fabMat.uniforms.uRev.value;
      shadow.position.set(x, 0.6, z); shadow.scale.set(s.h * 0.95, s.h * 0.42, 1); shadow.material.opacity = 0.5 * rv; shadow.rotation.z = -yaw;
      const ra = Math.max(pulse(T, s.inAt + 0.2, 0.25, 1.3), s.outAt < 900 ? pulse(T, s.outAt + 0.2, 0.2, 0.8) : 0);
      fring.position.set(x, 0.8, z); fring.scale.set(s.h * 1.5, s.h * 1.5, 1); ringMat.uniforms.uA.value = ra * 1.3; ringMat.uniforms.uR.value = 0.35 + 0.45 * E.outCubic(seg(T, s.inAt, s.inAt + 1.4));
      {
        const a = spGeo.attributes, R = rng(31 + s.id.length), t0 = s.inAt, t1 = s.outAt;
        for (let i = 0; i < NS; i++) {
          const az = R() * Math.PI * 2, rr = s.h * (0.18 + R() * 0.32), v = s.h * (0.5 + R() * 0.9), l = 0.9 + R() * 0.9, d0 = R() * 0.5;
          const dt = T - t0 - d0, dt2 = T - t1 - d0;
          let on = dt > 0 && dt < l, tt = dt; if (!on && t1 < 900 && dt2 > 0 && dt2 < l) { on = true; tt = dt2; }
          a.position.array.set([x + Math.cos(az + tt * 0.8) * rr, tt * v * (1 - 0.3 * tt), z + Math.sin(az + tt * 0.8) * rr], i * 3);
          a.a.array[i] = on ? Math.sin(Math.PI * tt / l) : 0;
        }
        a.position.needsUpdate = true; a.a.needsUpdate = true;
      }
      // focus on him while the camera is with him (unless the shot keeps its own focus)
      const dist = Math.hypot(cam.position.x - x, cam.position.y - s.h * 0.6, cam.position.z - z);
      // (the focus eases onto him over a second and eases off before he leaves: no focus pop)
      const fIn = s.a <= T3D + 1e-6 ? 1 : E.inOutSine(seg(T, s.a, s.a + 1.0)), fOut = 1 - E.inOutSine(seg(T, s.b - 1.0, s.b));
      const u = world.dof.uniforms; u.focus.value = lerp(u.focus.value, dist, 0.85 * fIn * fOut);
      // the golden Nº 1 over his raised finger (the ranking)
      if (s.id === K.NUM1.at && g.M.finger) {
        fab.updateMatrixWorld(true);
        const loc = new THREE.Vector3(g.M.finger[0] / g.M.w - 0.5, 0.5 - g.M.finger[1] / g.M.h, 0).applyMatrix4(fab.matrixWorld);
        loc.y += s.h * 0.12;
        const p = project([loc.x, loc.y, loc.z]);
        const u2 = seg(T, K.NUM1.t, K.NUM1.t + 0.55), o = u2 > 0 ? 1 - E.inOutSine(seg(T, s.outAt - 0.3, s.outAt + 0.3)) : 0;
        vis(num1, o > 0.01 && p.vis);
        if (o > 0.01) {
          num1.style.left = `${p.x.toFixed(1)}px`; num1.style.top = `${p.y.toFixed(1)}px`; num1.style.opacity = o.toFixed(3);
          num1.style.transform = `translate(-50%, -100%) scale(${(E.outBack(u2, 2.2) * (1 + 0.03 * Math.sin(T * 3))).toFixed(3)})`;
          num1.querySelector('.rays').style.transform = `translate(-50%, -50%) rotate(${(T * 18).toFixed(1)}deg)`;
        }
      }
    }
    const fc = focusCam(T);
    if (fc && fc.w > 0) { const u = world.dof.uniforms, d = Math.hypot(cam.position.x - fc.at[0], cam.position.y - fc.at[1], cam.position.z - fc.at[2]); u.focus.value = lerp(u.focus.value, d, fc.w); }
    return {};
  }

  // what a frame needs loaded: the plate frame, and Fabio's pose frame
  const needs = (T) => {
    const s = T >= T3D ? standAt(T) : null;
    return { plate: T < IRIS.t + IRIS.dur ? plateSrc(T) : null, pose: s ? `fabio_poses/${s.pose}/p_${pad(poseIdx(s, T), 3)}.png` : null };
  };
  const cache = new Map();
  const getImg = async (src) => {
    let img = cache.get(src);
    if (!img) { img = new Image(); img.src = src; await img.decode(); cache.set(src, img); if (cache.size > 12) cache.delete(cache.keys().next().value); }
    return img;
  };
  const load = async (T) => {
    const n = needs(T);
    if (n.plate && plateImg.getAttribute('src') !== n.plate) { plateImg.src = n.plate; await plateImg.decode(); }
    if (n.pose) { let img; try { img = await getImg(n.pose); } catch (e) { img = await getImg(n.pose.replace(/p_\d+\.png$/, 'p_001.png')); } setFab(img, n.pose); }
  };
  const nt7 = (T) => (T >= T3D ? TAKE_F(T) : null);
  return { duration: DURATION, update, load, nt7 };
}
