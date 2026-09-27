// "After Effects" layer: animated line icons (trim paths), shape-layer bursts and
// ripples, iris wipes, cinematic letterbox, step tracker and a focus frame that
// tracks 3D fields. Every value is set from the film clock, like the 3D.
import { E, clamp, lerp, seg, pulse, env as envl } from './util.js';
import { ICONS } from './icons.js';

export const ico = (name, cls = '', sw = 2) => `<svg class="mgi ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
export function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
export const vis = (node, on) => { node.style.display = on ? '' : 'none'; return on; };

// ---- trim paths
export function drawable(root) {
  return [...root.querySelectorAll('path,circle,rect,line,polyline,ellipse')].map((e) => {
    let L = 60; try { L = e.getTotalLength(); } catch (_) { /* keep default */ }
    L = Math.max(1, L); e.style.strokeDasharray = `${L} ${L}`; e.style.strokeDashoffset = `${L}`; return { e, L };
  });
}
export function draw(list, u, stagger = 0.3) {
  const n = list.length;
  list.forEach((d, i) => { const a = n > 1 ? (i / (n - 1)) * stagger : 0; const uu = clamp((u - a) / (1 - stagger)); d.e.style.strokeDashoffset = `${d.L * (1 - uu)}`; });
}

// ---- shape-layer burst: radial strokes + two ripples (center at left/top of the node)
export function burstFx(parent, { n = 10, color = '#fff', size = 420 } = {}) {
  const lines = Array.from({ length: n }, (_, i) => `<line data-a="${(i / n) * Math.PI * 2 + 0.2}"/>`).join('');
  const node = el(`<svg class="mgfx" viewBox="${-size / 2} ${-size / 2} ${size} ${size}" width="${size}" height="${size}" style="margin:${-size / 2}px 0 0 ${-size / 2}px"><g stroke="${color}" stroke-linecap="round" fill="none">${lines}<circle class="q1"/><circle class="q2"/></g></svg>`);
  parent.appendChild(node);
  const L = [...node.querySelectorAll('line')], q1 = node.querySelector('.q1'), q2 = node.querySelector('.q2');
  return {
    node,
    set(t, t0, x, y, { r0 = 46, r1 = 150, w = 6, dur = 0.55 } = {}) {
      const u = seg(t, t0, t0 + dur);
      if (!vis(node, u > 0 && u < 1)) return;
      node.style.left = `${x}px`; node.style.top = `${y}px`;
      const ro = lerp(r0, r1, E.outCubic(u)), ri = lerp(r0, r1, E.inCubic(u));
      L.forEach((l) => { const a = +l.dataset.a; l.setAttribute('x1', Math.cos(a) * ri); l.setAttribute('y1', Math.sin(a) * ri); l.setAttribute('x2', Math.cos(a) * ro); l.setAttribute('y2', Math.sin(a) * ro); l.setAttribute('stroke-width', w * (1 - u) + 0.5); });
      const u1 = seg(t, t0, t0 + dur * 1.1), u2 = seg(t, t0 + dur * 0.2, t0 + dur * 1.4);
      q1.setAttribute('r', lerp(r0 * 0.7, r1 * 1.05, E.outCubic(u1))); q1.setAttribute('stroke-width', 5 * (1 - u1) + 0.3); q1.style.opacity = 1 - u1;
      q2.setAttribute('r', lerp(r0 * 0.6, r1 * 1.35, E.outCubic(u2))); q2.setAttribute('stroke-width', 3 * (1 - u2) + 0.3); q2.style.opacity = (1 - u2) * 0.8;
    },
  };
}

// ---- iris wipe in a pillar colour: grows from the badge, holds, opens a hole
export function irisWipe(parent) {
  const node = el('<div class="mg-iris"></div>'); parent.appendChild(node);
  return {
    node,
    set(t, b, color, cx = 960, cy = 540) {
      const c0 = b - 0.3, c1 = b - 0.05, o0 = b + 0.2, o1 = b + 0.62;
      if (!vis(node, t > c0 && t < o1)) return;
      node.style.background = color;
      if (t < o0) {
        const R = lerp(64, 1250, E.inOutQuart(seg(t, c0, c1)));
        node.style.clipPath = `circle(${R}px at ${cx}px ${cy}px)`; node.style.webkitMaskImage = 'none'; node.style.maskImage = 'none';
      } else {
        const R = lerp(0, 1250, E.inOutCubic(seg(t, o0, o1)));
        const m = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${R}px, #000 ${R + 1.5}px)`;
        node.style.clipPath = 'none'; node.style.webkitMaskImage = m; node.style.maskImage = m;
      }
    },
  };
}

// ---- pillar medallion: pops at the centre, draws its icon, rides the wipe, flies to its pill
export function pillarBadge(parent, { icon, color, label }) {
  const node = el(`<div class="mg-badge" style="--c:${color}"><div class="disc">${ico(icon, 'bi', 1.8)}</div><div class="bl">${label}</div></div>`);
  parent.appendChild(node);
  const strokes = drawable(node.querySelector('.bi'));
  const fx = burstFx(parent, { n: 12, color });
  return {
    node,
    set(t, b, pill) {
      const t0 = b - 0.62, t1 = b + 1.25;
      fx.set(t, t0 + 0.12, 960, 540, { r0: 70, r1: 230, w: 8 });
      if (!vis(node, t > t0 && t < t1)) return;
      const pop = E.outBack(seg(t, t0, t0 + 0.42), 2.2);
      draw(strokes, seg(t, t0 + 0.12, t0 + 0.62), 0.35);
      const fly = E.inOutCubic(seg(t, b + 0.62, b + 1.15));
      const x = lerp(960, pill.x, fly), y = lerp(540, pill.y, fly) - Math.sin(fly * Math.PI) * 120;
      const s = pop * lerp(1, 0.28, fly) * (1 + pulse(t, b - 0.05, 0.05, 0.2) * 0.12);
      node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s}) rotate(${(1 - pop) * -40 + Math.sin(fly * Math.PI) * 25}deg)`;
      node.style.opacity = 1 - seg(t, t1 - 0.1, t1);
      node.querySelector('.bl').style.opacity = envl(t, t0 + 0.35, t0 + 0.6, b + 0.5, b + 0.7);
    },
  };
}

// ---- 2.39:1 letterbox bars
export function letterbox(parent) {
  const top = el('<div class="mg-bar top"></div>'), bot = el('<div class="mg-bar bot"></div>');
  parent.append(top, bot);
  return { set(k) { const h = 138 * clamp(k); top.style.height = bot.style.height = `${h}px`; vis(top, h > 0.2); vis(bot, h > 0.2); } };
}

// ---- step tracker: six icon chips; active one glows, completed ones draw a check
export function stepTracker(parent, steps) {
  const chips = steps.map((s) => `<div class="chip">${ico(s.icon, 'si', 2)}${ico('check', 'ck', 3)}</div>`).join('');
  const node = el(`<div class="mg-steps"><div class="lab"><b>PASSO 1/6</b><span></span></div><div class="chips">${chips}</div></div>`);
  parent.appendChild(node);
  const cs = [...node.querySelectorAll('.chip')].map((c) => ({ c, ck: drawable(c.querySelector('.ck')), si: c.querySelector('.si') }));
  const lb = node.querySelector('.lab b'), ls = node.querySelector('.lab span');
  const fxs = steps.map(() => burstFx(parent, { n: 8, color: '#ffb866', size: 200 }));
  return {
    node,
    set(t, op) {
      if (!vis(node, op > 0.003)) { fxs.forEach((f) => vis(f.node, false)); return; }
      node.style.opacity = op;
      let cur = 0; steps.forEach((s, k) => { if (t >= s.a) cur = k; });
      lb.textContent = `PASSO ${cur + 1}/6`; ls.textContent = steps[cur].name;
      const r = node.querySelector('.chips').getBoundingClientRect();
      cs.forEach((o, k) => {
        const s = steps[k];
        const act = t >= s.a && t < s.b, done = t >= s.b;
        o.c.className = `chip${act ? ' on' : ''}${done ? ' done' : ''}`;
        const popA = act ? 1 + 0.22 * E.outBack(seg(t, s.a, s.a + 0.35), 3) * (1 - 0.3 * seg(t, s.a + 0.35, s.a + 0.7)) + Math.sin(t * 6) * 0.02 : 1;
        const popD = done ? 1 + 0.35 * pulse(t, s.b, 0.06, 0.18) : 1;
        o.c.style.transform = `scale(${popA * popD})`;
        draw(o.ck, done ? seg(t, s.b, s.b + 0.3) : 0, 0);
        o.si.style.opacity = done ? 1 - seg(t, s.b, s.b + 0.12) : 1;
        fxs[k].set(t, s.b, r.left + 20 + k * 50, r.top + 20, { r0: 18, r1: 48, w: 3.5, dur: 0.45 });
      });
    },
  };
}

// ---- focus frame: four brackets that track a screen rect and snap between targets
export function focusFrame(parent, color = '#ffb347') {
  const node = el(`<svg class="mg-focus" width="1920" height="1080" viewBox="0 0 1920 1080"><g fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path class="b0"/><path class="b1"/><path class="b2"/><path class="b3"/></g><rect class="glow" fill="${color}" rx="14"/></svg>`);
  parent.appendChild(node);
  const B = [0, 1, 2, 3].map((i) => node.querySelector(`.b${i}`)), glow = node.querySelector('.glow');
  return {
    node,
    set(rect, op, k = 1) {
      if (!vis(node, op > 0.003 && rect)) return;
      node.style.opacity = op;
      const pad = 12 * k, x0 = rect.x0 - pad, y0 = rect.y0 - pad, x1 = rect.x1 + pad, y1 = rect.y1 + pad;
      const c = Math.min(26, (x1 - x0) / 4, (y1 - y0) / 2.5);
      B[0].setAttribute('d', `M${x0},${y0 + c} V${y0} H${x0 + c}`);
      B[1].setAttribute('d', `M${x1 - c},${y0} H${x1} V${y0 + c}`);
      B[2].setAttribute('d', `M${x1},${y1 - c} V${y1} H${x1 - c}`);
      B[3].setAttribute('d', `M${x0 + c},${y1} H${x0} V${y1 - c}`);
      glow.setAttribute('x', x0); glow.setAttribute('y', y0); glow.setAttribute('width', x1 - x0); glow.setAttribute('height', y1 - y0); glow.style.opacity = 0.07 * op;
    },
  };
}

// helpers for timeline code
export const lerpRect = (a, b, u) => ({ x0: lerp(a.x0, b.x0, u), y0: lerp(a.y0, b.y0, u), x1: lerp(a.x1, b.x1, u), y1: lerp(a.y1, b.y1, u) });
export const rectOf = (pts) => ({ x0: Math.min(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)), x1: Math.max(...pts.map((p) => p.x)), y1: Math.max(...pts.map((p) => p.y)) });
