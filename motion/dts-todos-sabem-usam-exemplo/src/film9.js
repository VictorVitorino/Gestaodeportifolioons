// FLOWS · O Fio Dourado (v9) — Fabio's journey in one flow (2:16).
// The footage runs as one scene: the theme written in light around Fabio, his walk, his touch on the
// Biblioteca de Skills, the portal into the FLOWS universe, the skills orbiting him, the Publicar skill
// button he offers us. The press opens a golden iris into the 3D FLOWS, which plays as one continuous
// take (the v7 film at a calm, readable pace): the camera never cuts, it only leaves the form to find
// Fabio, who now stands in the world in full body (his model sheet: presenting, arms open, pointing at
// the one, waving goodbye). He appears the way the portal works: built from the feet up by golden
// light, with a ring on the floor and sparks. Every value is a pure function of time T.
import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { E, clamp, lerp, seg, env as envl, pulse, rng } from './util.js';
import * as MG from './mg.js';
import * as O from './objects.js';
import { FPS, CLIPS, SHOTS, DURATION, TAKE_F, T3D, IRIS, SHOW, STANDS, NUM1, SUBS_FOOT, SUBS_TAKE, LOCK9, COUNT441, STREAKS, FLASHES } from './cut9.js';

const deg = Math.PI / 180;
const mixv = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);

export function buildFilm9({ world, film7, hud, imgs, meta, project }) {
  const F0 = film7.film0;
  const SHUTTER = film7.SHUTTER;
  hud.classList.add('v9');
  const TAKE = SHOTS.find((s) => s.kind === '3d');
  const TAKE_END = TAKE.b;
  const inv = (nt) => { let lo = T3D, hi = TAKE_END; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (TAKE_F(m) < nt) lo = m; else hi = m; } return (lo + hi) / 2; };
  const SUBS = [...SUBS_FOOT, ...SUBS_TAKE.map(([a, b, s, k]) => [inv(a), inv(b), s, k])].sort((x, y) => x[0] - y[0]);

  // ---------------------------------------------------------------- layers
  const foot = document.createElement('div'); foot.id = 'footwrap'; foot.innerHTML = '<img class="fb" alt=""><img class="fa" alt="">'; // fb: the shot it dissolves from (under)
  hud.parentNode.insertBefore(foot, hud);
  const imgA = foot.querySelector('.fa'), imgB = foot.querySelector('.fb');
  const h9 = document.createElement('div'); h9.id = 'hud8'; hud.parentNode.appendChild(h9);
  h9.innerHTML = `
    <div class="t8"><div class="kk">DTS · Digital &amp; Technology Services</div>
      <div class="ln" style="--c:#b9d8ff;--g:rgba(61,139,255,.75)"><b>TODOS SABEM</b><i></i></div>
      <div class="ln" style="--c:#ffc58a;--g:rgba(255,138,31,.75)"><b>TODOS USAM</b><i></i></div>
      <div class="ln" style="--c:#ffe2a0;--g:rgba(242,181,68,.8)"><b>SOMOS EXEMPLO</b><i></i></div></div>
    <div class="title8"><div class="kk mk"><span>DTS · Digital &amp; Technology Services</span></div><div class="rl"></div>
      <div class="tl mk"><span><em class="c1">Todos Sabem</em><em class="dot"> · </em><em class="c2">Todos Usam</em><em class="dot"> · </em><em class="c3">Somos Exemplo</em></span></div></div>
    <div class="c441"><div class="n mk"><span>441</span></div><div class="l mk"><span>skills prontas para reuso</span></div></div>
    <div class="lockup"><div class="lk-k mk"><span></span></div><div class="lk-ln"></div><div class="lk-d mk"><span></span></div></div>
    <div class="sub"><div class="plate"><div class="kick"><span></span></div><div class="s"><span class="in"></span></div></div></div>
    <div class="num1"><div class="rays"></div><b>Nº 1</b></div>
    <div class="iris"></div>
    <div class="streak8"><i></i></div><div class="flash8"></div>`;
  const $ = (s) => h9.querySelector(s);
  const t8 = $('.t8'), t8k = t8.querySelector('.kk'), t8L = [...t8.querySelectorAll('.ln')];
  const ti = $('.title8'), tiK = ti.querySelector('.kk span'), tiR = ti.querySelector('.rl'), tiL = ti.querySelector('.tl span');
  const c441 = $('.c441'), c441n = c441.querySelector('.n span'), c441N = c441.querySelector('.n'), c441l = c441.querySelector('.l span');
  const lock = $('.lockup'), lkK = lock.querySelector('.lk-k span'), lkLn = lock.querySelector('.lk-ln'), lkD = lock.querySelector('.lk-d span');
  const sub = $('.sub'), subP = sub.querySelector('.plate'), subIn = sub.querySelector('.in'), subS = sub.querySelector('.s'), subK = sub.querySelector('.kick span'), subKW = sub.querySelector('.kick');
  const num1 = $('.num1'), iris = $('.iris'), streak = $('.streak8'), flash = $('.flash8');
  const rise = (el, u) => { el.style.transform = `translateY(${((1 - u) * 108).toFixed(2)}%)`; };
  const vis = MG.vis;

  // ---------------------------------------------------------------- Fabio in the world (full body)
  // drawn after depth of field and motion blur (he is the focus), before bloom and grade (so he shares
  // the film's light and colour); a billboard standing on the floor, turned to the camera
  const fg = new THREE.Scene();
  const fgPass = new RenderPass(fg, world.camera); fgPass.clear = false; fgPass.clearDepth = true;
  world.composer.insertPass(fgPass, 3);
  const fabTex = new THREE.Texture(); fabTex.colorSpace = THREE.SRGBColorSpace; fabTex.premultiplyAlpha = true;
  fabTex.minFilter = THREE.LinearMipmapLinearFilter; fabTex.generateMipmaps = true; fabTex.anisotropy = world.maxAniso || 8;
  const fabMat = new THREE.ShaderMaterial({
    transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: false,
    uniforms: { map: { value: fabTex }, uGain: { value: new THREE.Vector3(1, 1, 1) }, uRim: { value: new THREE.Color(1.0, 0.74, 0.42) }, uA: { value: 1 }, uRev: { value: 1 }, uFeet: { value: 0.02 }, uTop: { value: 0.97 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    // premultiplied texels; a warm light wrap on the soft edge; darker toward the floor; the reveal is a
    // band of golden light climbing from his feet to his head
    fragmentShader: `uniform sampler2D map; uniform vec3 uGain; uniform vec3 uRim; uniform float uA, uRev, uFeet, uTop; varying vec2 vUv;
      void main(){ vec4 c = texture2D(map, vUv); float a = c.a; vec3 rgb = c.rgb * uGain;
        float edge = smoothstep(0.0, 0.5, a) * (1.0 - smoothstep(0.5, 1.0, a));
        rgb += uRim * edge * a * 0.45;
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
  // the ring of light on the floor at his feet, and the sparks that rise as he appears
  const ringMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uA: { value: 0 }, uR: { value: 0.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float uA, uR; void main(){ float r = length(vUv - 0.5) * 2.0; float ring = exp(-pow((r - uR) / 0.035, 2.0)) + 0.35 * exp(-pow((r - uR * 0.72) / 0.02, 2.0)); float disc = exp(-r * r / 0.18) * 0.25; gl_FragColor = vec4(vec3(1.0, 0.78, 0.42) * (ring + disc) * uA, 1.0); }' });
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 1; ring.frustumCulled = false; fg.add(ring);
  const NS = 110, spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3)); spGeo.setAttribute('a', new THREE.BufferAttribute(new Float32Array(NS), 1));
  const spMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uS: { value: 7 } },
    vertexShader: 'attribute float a; varying float vA; uniform float uS; void main(){ vA = a; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(uS * 900.0 / -mv.z, 1.0, 16.0) * (0.5 + 0.5*a); }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float k = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(1.0,0.82,0.5) * k * vA * 2.0, 1.0); }' });
  const sparks = new THREE.Points(spGeo, spMat); sparks.renderOrder = 3; sparks.frustumCulled = false; fg.add(sparks);
  // his contact shadow lives in the world (so it is blurred and graded with the floor)
  const shadow = O.contactShadow(1, 1, 0.55); world.scene.add(shadow); shadow.visible = false;
  let fabShown = '';
  const setFab = (img, key) => { if (fabShown === key) return; fabTex.image = img; fabTex.needsUpdate = true; fabShown = key; };

  // which stand (and which pose frame) at T; frames loop back and forth at 24 fps
  const standAt = (T) => STANDS.find((s) => T >= s.a && T < s.b);
  const poseIdx = (s, T) => {
    const [f0, f1] = s.frames, L = f1 - f0, k = Math.max(0, Math.floor((T - s.a) * FPS)), m = k % (2 * L);
    return m <= L ? f0 + m : f1 - (m - L);
  };
  // the stand's geometry from the pose's matte (meta): canvas size, where the soles and the feet are
  const geomOf = (s) => {
    const M = meta[s.pose], k = s.h / (M.sole - M.top), w = M.w * k, h = M.h * k;
    return { w, h, cx: (M.w / 2 - M.footX) * k, cy: h / 2 - (M.h - M.sole) * k, k, M };
  };

  // ---------------------------------------------------------------- camera detours
  // the take's camera is blended toward a detour camera (and back) when Fabio is on screen
  const detourAt = (T) => {
    for (const s of STANDS) {
      const c = s.cam; if (!c || T < c.a || T > c.b) continue;
      const wIn = E.inOutSine(seg(T, c.a, c.a + c.fin)), wOut = c.fout > 0 ? 1 - E.inOutSine(seg(T, c.b - c.fout, c.b)) : 1;
      const u = E.inOutSine(seg(T, c.a, c.b));
      return { s, w: Math.min(wIn, wOut), P: mixv(c.from.P, c.to.P, u), T: mixv(c.from.T, c.to.T, u), fov: c.fov };
    }
    return null;
  };
  let hookT = 0;
  window.__camHook = (nt, pose) => {
    const d = detourAt(hookT); if (!d || d.w <= 0) return null;
    return { P: mixv(pose.P, d.P, d.w), T: mixv(pose.T, d.T, d.w), fov: lerp(pose.fov, d.fov, d.w), aperture: lerp(pose.aperture, 1.1e-4, d.w) };
  };

  // ---------------------------------------------------------------- graphics layer
  const highlight = (s) => s.replace(/\*([^*]+)\*/g, '<b class="hl">$1</b>');
  let subKey = null, lockKey = null;
  function graphics(T) {
    // 1. the theme written in light (on Fabio's light spiral), then carried into the spiral
    {
      const on = T < 4.25; vis(t8, on);
      if (on) {
        t8k.style.opacity = (E.outCubic(seg(T, 0.45, 1.0)) * (1 - seg(T, 3.3, 3.9))).toFixed(3);
        t8L.forEach((ln, i) => {
          const a = 0.85 + i * 0.72, u = E.inOutSine(seg(T, a, a + 0.62));
          const b = ln.querySelector('b'), bar = ln.querySelector('i'), w = b.offsetWidth || 560;
          b.style.clipPath = `inset(-40px ${((1 - u) * 100).toFixed(2)}% -40px -10px)`;
          bar.style.left = `${(u * w).toFixed(1)}px`; bar.style.opacity = (Math.sin(Math.PI * clamp(u)) * 0.95).toFixed(3);
          const out = E.inCubic(seg(T, 3.35 + i * 0.1, 4.1 + i * 0.05));
          ln.style.opacity = (1 - out).toFixed(3);
          ln.style.transform = `translateX(${(-out * 120).toFixed(1)}px) scale(${(1 + out * 0.25).toFixed(3)})`;
          ln.style.filter = `blur(${(out * 10).toFixed(2)}px)`;
        });
      }
    }
    // 2. the title line under the FLOWS logo
    {
      const o = envl(T, 5.0, 5.4, 7.7, 8.1, 'outCubic', 'inOutSine'); vis(ti, o > 0.003);
      if (o > 0.003) {
        ti.style.opacity = o.toFixed(3);
        rise(tiK, E.outCubic(seg(T, 5.0, 5.7))); tiR.style.width = `${(E.inOutCubic(seg(T, 5.25, 6.1)) * 360).toFixed(1)}px`;
        rise(tiL, E.outCubic(seg(T, 5.4, 6.2)));
      }
    }
    // 3. the library counter over the orbit of skills
    {
      const { a, b, n } = COUNT441, o = envl(T, a, a + 0.5, b - 0.5, b, 'outCubic', 'inOutSine'); vis(c441, o > 0.003);
      if (o > 0.003) {
        c441.style.opacity = o.toFixed(3);
        rise(c441N, E.outCubic(seg(T, a, a + 0.7))); rise(c441l, E.outCubic(seg(T, a + 0.35, a + 1.0)));
        c441n.textContent = String(Math.round(lerp(330, n, E.outCubic(seg(T, a + 0.1, a + 1.3)))));
        c441.style.transform = `scale(${(1 + 0.02 * seg(T, a, b)).toFixed(4)})`;
      }
    }
    // 4. pillar lockups
    {
      const L = LOCK9.find(([a, b]) => T > a - 0.05 && T < b + 0.6);
      if (vis(lock, !!L)) {
        const [a, b, k, d, c, pos] = L;
        if (lockKey !== k) { lockKey = k; lkK.textContent = k; lkD.textContent = d; lock.style.setProperty('--c', c[0]); lock.style.setProperty('--c2', c[1]); lock.className = `lockup ${pos}`; }
        rise(lkK, E.outCubic(seg(T, a, a + 0.55))); lkLn.style.width = `${(E.inOutCubic(seg(T, a + 0.15, a + 0.85)) * 240).toFixed(1)}px`;
        rise(lkD, E.outCubic(seg(T, a + 0.25, a + 0.85))); lock.style.opacity = (1 - E.inOutSine(seg(T, b, b + 0.55))).toFixed(3);
      }
    }
    // 5. subtitles with their step: the line rises out of its mask, key terms are underlined, lines of one
    //    step swap in place (the step label stays)
    {
      const i = SUBS.findIndex(([a, b]) => T >= a && T < b), cur = SUBS[i], prv = SUBS[i - 1], nxt = SUBS[i + 1];
      if (vis(sub, !!cur)) {
        const [a, b, s, k] = cur, cIn = prv && Math.abs(prv[1] - a) < 0.05, cOut = nxt && Math.abs(nxt[0] - b) < 0.05;
        if (subKey !== s) { subKey = s; subIn.innerHTML = highlight(s); subK.textContent = k || ''; subKW.style.display = k ? '' : 'none'; }
        subS.style.setProperty('--hl', T < 23.9 ? '#5ea2ff' : T < inv(126.6) ? '#ff9a3c' : '#f5b847');
        rise(subIn, E.outCubic(seg(T, a, a + 0.6)));
        subIn.style.opacity = (1 - E.inCubic(seg(T, b - 0.25, b))).toFixed(3);
        const kIn = cIn && prv[3] === k, kOut = cOut && nxt[3] === k;
        subK.style.opacity = Math.min(kIn ? 1 : E.outCubic(seg(T, a, a + 0.5)), kOut ? 1 : 1 - E.inCubic(seg(T, b - 0.25, b))).toFixed(3);
        subP.style.opacity = Math.min(cIn ? 1 : E.outCubic(seg(T, a, a + 0.35)), cOut ? 1 : 1 - E.inCubic(seg(T, b - 0.3, b))).toFixed(3);
        subIn.querySelectorAll('.hl').forEach((h, j) => { const t0 = a + 0.6 + j * 0.45; h.style.backgroundSize = `${(E.inOutCubic(seg(T, t0, t0 + 0.7)) * 100).toFixed(1)}% 3px`; });
      }
    }
    // 6. the golden thread across the big cuts, and the flashes
    {
      let o = 0;
      for (const [t0, x0, x1, y] of STREAKS) {
        const u = seg(T, t0 - 0.32, t0 + 0.32); if (u <= 0 || u >= 1) continue;
        o = Math.sin(Math.PI * u); streak.style.setProperty('--x', `${lerp(x0, x1, E.inOutSine(u)).toFixed(1)}px`); streak.style.setProperty('--y', `${y}px`);
      }
      vis(streak, o > 0.01); streak.style.opacity = o.toFixed(3);
      let f = 0;
      for (const [tp, r, d, k] of FLASHES) f = Math.max(f, k * (T <= tp ? E.inQuad(seg(T, tp - r, tp)) : 1 - E.outQuad(seg(T, tp, tp + d))));
      vis(flash, f > 0.01); flash.style.opacity = f.toFixed(3);
    }
  }

  // ---------------------------------------------------------------- footage
  const clipSrc = (id, ct) => { const c = CLIPS[id]; const n = Math.min(c.n, Math.max(1, Math.round(ct * c.fps) + 1)); return `${c.dir}/${c.pfx}${String(n).padStart(3, '0')}.jpg`; };
  const footShots = SHOTS.filter((s) => s.kind === 'foot');
  // the frame(s) the footage layer shows at T: the top shot, and the one it dissolves from
  const footAt = (T) => {
    let top = null; for (const s of footShots) if (T >= s.a && T < s.b) top = s;
    if (!top) return null;
    const prev = footShots[footShots.indexOf(top) - 1];
    const mix = top.mixIn && prev && T < top.a + top.mixIn ? E.inOutSine(seg(T, top.a, top.a + top.mixIn)) : 1;
    return { top, a: clipSrc(top.clip, top.f(T)), b: mix < 1 ? clipSrc(prev.clip, prev.f(T)) : null, mix };
  };

  // ---------------------------------------------------------------- update
  function update(T) {
    graphics(T);
    const F = footAt(T), in3d = T >= T3D;
    // the footage (full frame) above the 3D canvas; under the iris it opens onto the 3D take
    vis(foot, !!F);
    if (F) {
      imgA.style.opacity = F.mix.toFixed(3); vis(imgB, !!F.b);
      const fade = E.inOutSine(seg(T, 0, 0.6));
      foot.style.filter = `saturate(1.04) contrast(1.02) brightness(${fade.toFixed(3)})`;
      const u = seg(T, IRIS.t, IRIS.t + IRIS.dur);
      if (u > 0) {
        const R = E.inCubic(u) * 2300;
        const m = `radial-gradient(circle at ${IRIS.x}px ${IRIS.y}px, transparent ${Math.max(0, R - 1).toFixed(1)}px, #000 ${(R + 1.5).toFixed(1)}px)`;
        foot.style.webkitMaskImage = m; foot.style.maskImage = m;
      } else { foot.style.webkitMaskImage = 'none'; foot.style.maskImage = 'none'; }
    }
    {
      const u = seg(T, IRIS.t - 0.05, IRIS.t + IRIS.dur), on = u > 0 && u < 1; vis(iris, on);
      if (on) {
        const R = E.inCubic(seg(T, IRIS.t, IRIS.t + IRIS.dur)) * 2300;
        iris.style.left = `${IRIS.x}px`; iris.style.top = `${IRIS.y}px`; iris.style.width = iris.style.height = `${(2 * R + 4).toFixed(1)}px`;
        iris.style.opacity = (Math.min(1, u * 12) * (1 - E.inQuad(seg(T, IRIS.t + IRIS.dur * 0.55, IRIS.t + IRIS.dur)))).toFixed(3);
      }
    }
    if (!in3d) { hud.classList.add('off'); fab.visible = ring.visible = sparks.visible = shadow.visible = false; vis(num1, false); return { skip3d: true }; }
    hud.classList.remove('off');
    const nt7 = TAKE_F(T);
    for (const k of ['k', 'rank', 'end']) hud.classList.toggle(`show-${k}`, SHOW.some(([id, a, b]) => id === k && nt7 >= a && nt7 < b));
    // the previous camera first (motion blur on this film's clock), then the current one
    hookT = Math.max(T3D, T - SHUTTER);
    const pp = film7.cam(TAKE_F(hookT)); world.setPrevCamera(pp.P, pp.T, pp.fov, T - T3D > 0.03 ? 1 : 0);
    hookT = T;
    film7.update(F0 + nt7);
    // Fabio
    const s = standAt(T), cam = world.camera;
    fab.visible = ring.visible = sparks.visible = shadow.visible = !!s;
    vis(num1, false);
    if (s) {
      cam.updateMatrixWorld(true);
      const g = geomOf(s), [x, , z] = s.pos, yaw = Math.atan2(cam.position.x - x, cam.position.z - z);
      fab.rotation.set(0, yaw, 0);
      fab.position.set(x + Math.cos(yaw) * g.cx, g.cy, z - Math.sin(yaw) * g.cx);
      fab.scale.set(g.w, g.h, 1);
      fabMat.uniforms.uFeet.value = 1 - g.M.sole / g.M.h; fabMat.uniforms.uTop.value = 1 - g.M.top / g.M.h;
      fabMat.uniforms.uGain.value.set(...(s.gain || [0.98, 0.95, 0.99]));
      // he is built from the feet up by golden light (and taken back up into it when he leaves)
      const rin = E.inOutSine(seg(T, s.inAt, s.inAt + 0.95)), rout = s.outAt < 900 ? E.inOutSine(seg(T, s.outAt, s.outAt + 0.6)) : 0;
      fabMat.uniforms.uRev.value = rout > 0 ? 1 - rout : rin;
      fabMat.uniforms.uA.value = 1;
      const rv = fabMat.uniforms.uRev.value;
      shadow.position.set(x, 0.6, z); shadow.scale.set(s.h * 0.95, s.h * 0.42, 1); shadow.material.opacity = 0.5 * rv; shadow.rotation.z = -yaw;
      // the floor ring and the sparks of his arrival (and of his exit)
      const ra = Math.max(pulse(T, s.inAt + 0.2, 0.25, 1.3), s.outAt < 900 ? pulse(T, s.outAt + 0.2, 0.2, 0.8) : 0);
      ring.position.set(x, 0.8, z); ring.scale.set(s.h * 1.5, s.h * 1.5, 1); ringMat.uniforms.uA.value = ra * 1.3; ringMat.uniforms.uR.value = 0.35 + 0.45 * E.outCubic(seg(T, s.inAt, s.inAt + 1.4));
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
      // focus on him while the camera is with him
      const d = detourAt(T);
      if (d && d.w > 0) {
        const dist = Math.hypot(cam.position.x - x, cam.position.y - s.h * 0.6, cam.position.z - z);
        const u = world.dof.uniforms; u.focus.value = lerp(u.focus.value, dist, d.w); u.maxblur.value = lerp(u.maxblur.value, 0.007, d.w);
      }
      // the golden Nº 1 over his raised finger (the ranking)
      if (s.id === NUM1.at && g.M.finger) {
        fab.updateMatrixWorld(true);
        const loc = new THREE.Vector3(g.M.finger[0] / g.M.w - 0.5, 0.5 - g.M.finger[1] / g.M.h, 0).applyMatrix4(fab.matrixWorld);
        loc.y += s.h * 0.12;
        const p = project([loc.x, loc.y, loc.z]);
        const u = seg(T, NUM1.t, NUM1.t + 0.55), o = u > 0 ? 1 - E.inOutSine(seg(T, s.outAt - 0.3, s.outAt + 0.3)) : 0;
        vis(num1, o > 0.01 && p.vis);
        if (o > 0.01) {
          num1.style.left = `${p.x.toFixed(1)}px`; num1.style.top = `${p.y.toFixed(1)}px`; num1.style.opacity = o.toFixed(3);
          num1.style.transform = `translate(-50%, -100%) scale(${(E.outBack(u, 2.2) * (1 + 0.03 * Math.sin(T * 3))).toFixed(3)})`;
          num1.querySelector('.rays').style.transform = `translate(-50%, -50%) rotate(${(T * 18).toFixed(1)}deg)`;
        }
      }
    }
    return {};
  }
  // what a frame needs loaded: footage frames, and Fabio's pose frame
  const needs = (T) => {
    const F = footAt(T), s = T >= T3D ? standAt(T) : null;
    return { foot: F ? [F.a, F.b].filter(Boolean) : [], pose: s ? `fabio_poses/${s.pose}/p_${String(poseIdx(s, T)).padStart(3, '0')}.png` : null };
  };
  const cache = new Map();
  const getImg = async (src) => {
    let img = cache.get(src);
    if (!img) { img = new Image(); img.src = src; await img.decode(); cache.set(src, img); if (cache.size > 16) cache.delete(cache.keys().next().value); }
    return img;
  };
  const load = async (T) => {
    const n = needs(T);
    const F = footAt(T);
    if (F) {
      const a = await getImg(F.a); if (imgA.getAttribute('src') !== F.a) { imgA.src = F.a; await imgA.decode(); }
      if (F.b) { await getImg(F.b); if (imgB.getAttribute('src') !== F.b) { imgB.src = F.b; await imgB.decode(); } }
      void a;
    }
    if (n.pose) {
      // (while the mattes are being made, a missing frame falls back to the pose's first frame)
      let img; try { img = await getImg(n.pose); } catch (e) { img = await getImg(n.pose.replace(/p_\d+\.png$/, 'p_001.png')); }
      setFab(img, n.pose);
    }
  };
  const nt7 = (T) => (T >= T3D ? TAKE_F(T) : null);
  return { duration: DURATION, update, load, nt7 };
}
