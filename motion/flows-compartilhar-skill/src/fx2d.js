// Screen-space FX drawn on a 2D canvas over the 3D layers: sparks, confetti,
// shooting star, flares, light trails. Everything is a pure function of time.
import { rng, clamp, E } from './util.js';

export class FX {
  constructor(canvas, project) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.project = project;
    this.W = canvas.width; this.H = canvas.height;
  }
  clear() { this.x.clearRect(0, 0, this.W, this.H); }

  glow(x, y, r, col, a) {
    const g = this.x.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.35, `rgba(${col},${a * 0.35})`); g.addColorStop(1, `rgba(${col},0)`);
    this.x.fillStyle = g; this.x.fillRect(x - r, y - r, r * 2, r * 2);
  }

  flare(x, y, s, a) {
    if (a <= 0.001) return;
    const X = this.x; X.save(); X.globalCompositeOperation = 'lighter';
    this.glow(x, y, 180 * s, '255,210,140', 0.55 * a);
    this.glow(x, y, 50 * s, '255,245,220', 0.9 * a);
    const g = X.createLinearGradient(x - 700 * s, y, x + 700 * s, y);
    g.addColorStop(0, 'rgba(120,160,255,0)'); g.addColorStop(0.5, `rgba(255,236,200,${0.55 * a})`); g.addColorStop(1, 'rgba(120,160,255,0)');
    X.fillStyle = g; X.fillRect(x - 700 * s, y - 2.5 * s, 1400 * s, 5 * s);
    X.restore();
  }

  // Shooting star from p0 to p1 (world), head position eased over [t0,t1]
  star(t, t0, t1, p0, p1) {
    if (t < t0 || t > t1 + 0.4) return;
    const X = this.x; X.save(); X.globalCompositeOperation = 'lighter';
    const u = E.inQuad(clamp((t - t0) / (t1 - t0)));
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const uu = Math.max(0, u - i * 0.018);
      const w = p0.map((a, k) => a + (p1[k] - a) * uu);
      const s = this.project(w); if (s.vis) pts.push([s.x, s.y]);
    }
    const fade = t > t1 ? 1 - (t - t1) / 0.4 : 1;
    for (let i = pts.length - 1; i > 0; i--) {
      X.strokeStyle = `rgba(255,${200 + i},${150 + i * 3},${(1 - i / pts.length) * 0.8 * fade})`;
      X.lineWidth = 6 * (1 - i / pts.length) + 1; X.lineCap = 'round';
      X.beginPath(); X.moveTo(pts[i][0], pts[i][1]); X.lineTo(pts[i - 1][0], pts[i - 1][1]); X.stroke();
    }
    if (pts[0] && t <= t1) { this.glow(pts[0][0], pts[0][1], 60, '255,230,180', 0.9); this.glow(pts[0][0], pts[0][1], 16, '255,255,255', 1); }
    X.restore();
  }

  // Radial spark burst from world point o
  sparks(t, t0, o, { n = 40, seed = 1, speed = 260, life = 1.1, g = 380, col = '255,205,120', up = 0.6, size = 1 } = {}) {
    const dt = t - t0; if (dt < 0 || dt > life + 0.6) return;
    const R = rng(seed), X = this.x; X.save(); X.globalCompositeOperation = 'lighter'; X.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const az = R() * Math.PI * 2, el = (R() * 2 - 1 + up) * 0.9, v = speed * (0.35 + R() * 0.9), l = life * (0.5 + R() * 0.6);
      if (dt > l) { R(); continue; }
      const vx = Math.cos(az) * Math.cos(el) * v, vz = Math.sin(az) * Math.cos(el) * v, vy = Math.sin(el) * v + speed * 0.3;
      const drag = (tt) => (1 - Math.exp(-2.2 * tt)) / 2.2;
      const P = (tt) => [o[0] + vx * drag(tt), o[1] + vy * drag(tt) - 0.5 * g * tt * tt, o[2] + vz * drag(tt)];
      const a = this.project(P(dt)), b = this.project(P(Math.max(0, dt - 0.045)));
      if (!a.vis || !b.vis) continue;
      const k = 1 - dt / l;
      X.strokeStyle = `rgba(${col},${0.95 * k})`; X.lineWidth = (2.2 + R() * 2.2) * size * (0.6 + a.s * 0.4);
      X.beginPath(); X.moveTo(b.x, b.y); X.lineTo(a.x, a.y); X.stroke();
    }
    X.restore();
  }

  confetti(t, t0, o, { n = 120, seed = 3, spread = 420, life = 3.2 } = {}) {
    const dt = t - t0; if (dt < 0 || dt > life) return;
    const R = rng(seed), X = this.x;
    const cols = ['#ffcf6e', '#f2a93b', '#ffffff', '#3d6fe0', '#0f2a5e', '#ff8a3d', '#9ad0ff'];
    for (let i = 0; i < n; i++) {
      const az = R() * Math.PI * 2, v = spread * (0.4 + R() * 0.8), vy = 380 + R() * 420, spin = (R() - 0.5) * 14, ph = R() * 6.28;
      const w = 6 + R() * 7, hgt = 10 + R() * 9, c = cols[(R() * cols.length) | 0], delay = R() * 0.15;
      const tt = dt - delay; if (tt < 0) continue;
      const drag = (1 - Math.exp(-1.6 * tt)) / 1.6;
      const p = [o[0] + Math.cos(az) * v * drag + Math.sin(tt * 2 + ph) * 18, o[1] + vy * drag - 0.5 * 260 * tt * tt * 0.55, o[2] + Math.sin(az) * v * drag];
      if (p[1] < 0) continue;
      const s = this.project(p); if (!s.vis) continue;
      const fade = clamp((life - dt) / 0.6);
      X.save(); X.translate(s.x, s.y); X.rotate(spin * tt + ph);
      X.scale(Math.cos(tt * spin * 0.7 + ph) * s.s, s.s);
      X.globalAlpha = fade; X.fillStyle = c; X.fillRect(-w / 2, -hgt / 2, w, hgt); X.restore();
    }
  }

  trail(pts, a, width = 10) {
    if (pts.length < 2 || a <= 0) return;
    const X = this.x; X.save(); X.globalCompositeOperation = 'lighter'; X.lineCap = 'round'; X.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const k = i / pts.length;
      X.strokeStyle = `rgba(255,${190 + 50 * k | 0},${110 + 100 * k | 0},${a * k * 0.8})`;
      X.lineWidth = width * k;
      X.beginPath(); X.moveTo(pts[i - 1][0], pts[i - 1][1]); X.lineTo(pts[i][0], pts[i][1]); X.stroke();
    }
    X.restore();
  }

  rays(a, t) {
    if (a <= 0.001) return;
    const X = this.x; X.save(); X.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) {
      const x0 = -200 + i * 260 + Math.sin(t * 0.3 + i) * 30;
      const g = X.createLinearGradient(x0, 0, x0 + 600, 804);
      g.addColorStop(0, `rgba(255,226,180,${0.10 * a})`); g.addColorStop(1, 'rgba(255,226,180,0)');
      X.fillStyle = g; X.beginPath(); X.moveTo(x0, -10); X.lineTo(x0 + 120 + i * 20, -10); X.lineTo(x0 + 900, 820); X.lineTo(x0 + 600, 820); X.closePath(); X.fill();
    }
    X.restore();
  }
}
