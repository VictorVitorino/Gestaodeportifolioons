// Timing, easing and interpolation helpers. Every animated value in the film
// is a pure function of time, so any frame can be rendered independently.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a));
export const seg = (t, a, b) => invLerp(a, b, t);
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export const E = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
  inOutBack: (t) => {
    const c2 = 1.70158 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  outElastic: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  outBounce: (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

// Keyframe track: keys = [[time, value, easeName?], ...]; value may be a number or array.
// The ease on a key shapes the segment that ARRIVES at that key.
export function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const u = (E[e || 'inOutCubic'] || E.inOutCubic)((t - t0) / (t1 - t0 || 1));
      if (Array.isArray(v0)) return v0.map((a, k) => lerp(a, v1[k], u));
      return lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

// Smooth camera paths: Catmull-Rom through [time, [x,y,z]] keys with eased time.
export function spline(keys, t, ease = 'inOutSine') {
  if (t <= keys[0][0]) return keys[0][1].slice();
  if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1].slice();
  const T0 = keys[0][0], T1 = keys[keys.length - 1][0];
  const g = (E[ease] || E.linear)((t - T0) / (T1 - T0)) * (T1 - T0) + T0;
  let i = 1;
  while (i < keys.length - 1 && g > keys[i][0]) i++;
  const p0 = keys[Math.max(0, i - 2)][1], p1 = keys[i - 1][1], p2 = keys[i][1], p3 = keys[Math.min(keys.length - 1, i + 1)][1];
  const u = (g - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
  const u2 = u * u, u3 = u2 * u;
  return p1.map((_, k) =>
    0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3)
  );
}

// Deterministic pseudo random (mulberry32).
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pulse that rises over `a` seconds and decays over `d` seconds after time t0.
export const pulse = (t, t0, a = 0.08, d = 0.5) =>
  t < t0 ? 0 : t < t0 + a ? (t - t0) / a : Math.exp(-(t - t0 - a) / d);

// 0 -> 1 -> 0 envelope: in over [a,b], hold, out over [c,d].
export const env = (t, a, b, c, d, ein = 'outCubic', eout = 'inCubic') =>
  t < a || t > d ? 0 : t < b ? E[ein]((t - a) / (b - a)) : t <= c ? 1 : 1 - E[eout]((t - c) / (d - c));

export const deg = Math.PI / 180;
