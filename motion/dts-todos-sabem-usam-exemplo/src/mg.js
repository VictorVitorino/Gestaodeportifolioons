// "After Effects" layer (v4, calm): animated line icons (trim paths), cinematic
// letterbox, step tracker and a focus frame that tracks 3D fields. No bursts, no
// wipes: things ease in, settle and stay still while they are read. Every value is
// set from the film clock, like the 3D.
import { E, clamp, lerp, seg } from './util.js';
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

// ---- 2.39:1 letterbox bars
export function letterbox(parent) {
  const top = el('<div class="mg-bar top"></div>'), bot = el('<div class="mg-bar bot"></div>');
  parent.append(top, bot);
  return { set(k) { const h = 138 * clamp(k); top.style.height = bot.style.height = `${h}px`; vis(top, h > 0.2); vis(bot, h > 0.2); } };
}

// ---- step tracker: six icon chips; the active one glows, completed ones draw a check
export function stepTracker(parent, steps) {
  const chips = steps.map((s) => `<div class="chip">${ico(s.icon, 'si', 2)}${ico('check', 'ck', 2.6)}</div>`).join('');
  const node = el(`<div class="mg-steps"><div class="lab"><b>PASSO 1/6</b><span></span></div><div class="chips">${chips}</div></div>`);
  parent.appendChild(node);
  const cs = [...node.querySelectorAll('.chip')].map((c) => ({ c, ck: drawable(c.querySelector('.ck')), si: c.querySelector('.si') }));
  const lb = node.querySelector('.lab b'), ls = node.querySelector('.lab span');
  return {
    node,
    set(t, op) {
      if (!vis(node, op > 0.003)) return;
      node.style.opacity = op;
      let cur = 0; steps.forEach((s, k) => { if (t >= s.a) cur = k; });
      lb.textContent = `PASSO ${cur + 1}/6`; ls.textContent = steps[cur].name;
      cs.forEach((o, k) => {
        const s = steps[k];
        const act = t >= s.a && t < s.b, done = t >= s.b;
        o.c.className = `chip${act ? ' on' : ''}${done ? ' done' : ''}`;
        const g = act ? E.outCubic(seg(t, s.a, s.a + 0.4)) : 0;
        o.c.style.transform = `scale(${1 + 0.1 * g})`;
        o.c.style.setProperty('--g', g.toFixed(3));
        draw(o.ck, done ? E.inOutCubic(seg(t, s.b, s.b + 0.4)) : 0, 0);
        o.si.style.opacity = done ? 1 - seg(t, s.b, s.b + 0.15) : 1;
      });
    },
  };
}

// ---- focus frame: four brackets that track a screen rect and snap between targets
export function focusFrame(parent, color = '#ffb347') {
  const node = el(`<svg class="mg-focus" width="1920" height="1080" viewBox="0 0 1920 1080"><g fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path class="b0"/><path class="b1"/><path class="b2"/><path class="b3"/></g><rect class="glow" fill="${color}" rx="14"/></svg>`);
  parent.appendChild(node);
  const B = [0, 1, 2, 3].map((i) => node.querySelector(`.b${i}`)), glow = node.querySelector('.glow');
  return {
    node,
    set(rect, op, k = 1) {
      if (!vis(node, op > 0.003 && rect)) return;
      node.style.opacity = op;
      const pad = 12 * k, x0 = rect.x0 - pad, y0 = rect.y0 - pad, x1 = rect.x1 + pad, y1 = rect.y1 + pad;
      const c = Math.min(22, (x1 - x0) / 4, (y1 - y0) / 2.5);
      B[0].setAttribute('d', `M${x0},${y0 + c} V${y0} H${x0 + c}`);
      B[1].setAttribute('d', `M${x1 - c},${y0} H${x1} V${y0 + c}`);
      B[2].setAttribute('d', `M${x1},${y1 - c} V${y1} H${x1 - c}`);
      B[3].setAttribute('d', `M${x0 + c},${y1} H${x0} V${y1 - c}`);
      glow.setAttribute('x', x0); glow.setAttribute('y', y0); glow.setAttribute('width', x1 - x0); glow.setAttribute('height', y1 - y0); glow.style.opacity = 0.05 * op;
    },
  };
}

// helpers for timeline code
export const lerpRect = (a, b, u) => ({ x0: lerp(a.x0, b.x0, u), y0: lerp(a.y0, b.y0, u), x1: lerp(a.x1, b.x1, u), y1: lerp(a.y1, b.y1, u) });
export const rectOf = (pts) => ({ x0: Math.min(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)), x1: Math.max(...pts.map((p) => p.x)), y1: Math.max(...pts.map((p) => p.y)) });
