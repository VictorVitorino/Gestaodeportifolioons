// FLOWS · O Fio Dourado (v8) — a cinematic re-cut under 1:30. Fabio's footage opens the film while
// the theme is written in light around him; the v7 3D world is re-edited shot by shot (new cameras,
// speed ramps, montage); Fabio is composited into that world (his finger snap summons the
// Compartilhar Skill button; he looks on as the trophy lands on DTS); a new graphics layer carries
// the text. The golden thread (the light trail of his footage) stitches the cuts.
// Every value is a pure function of time T (seconds of this film).
import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { E, clamp, lerp, seg, env as envl, pulse, rng } from './util.js';
import * as MG from './mg.js';
import * as O from './objects.js';
import { FPS, SHOTS, DURATION, SUBS8, LOCK8, STREAKS, FLASHES, SNAP } from './cut8.js';

const deg = Math.PI / 180;

// ------------------------------------------------------------------ the cut
// kind: 'foot' = a clip frame (full frame); '3d' = the v7 film at v7 time nt7 = f(T) (map keys
// [[T, nt7]], monotone cubic: speed ramps without jumps); 'comp' = the same plus Fabio composited
// into the world (fab: his clip time range, placement), with the shot's own camera (cam).
// show: v7 graphics kept in the shot (k = counters, rank = ranking plates, end = end card).
export function buildFilm8({ world, film7, hud, imgs }) {
  const F0 = film7.film0;
  const SHUTTER = film7.SHUTTER;
  hud.classList.add('v8');
  // ---------------------------------------------------------------- layers
  const foot = document.createElement('div'); foot.id = 'footwrap'; foot.innerHTML = '<img alt="">';
  hud.parentNode.insertBefore(foot, hud);
  const footImg = foot.querySelector('img');
  const h8 = document.createElement('div'); h8.id = 'hud8'; hud.parentNode.appendChild(h8);
  h8.innerHTML = `
    <div class="t8"><div class="kk">DTS · Digital &amp; Technology Services</div>
      <div class="ln" style="--c:#b9d8ff;--g:rgba(61,139,255,.75)"><b>TODOS SABEM</b><i></i></div>
      <div class="ln" style="--c:#ffc58a;--g:rgba(255,138,31,.75)"><b>TODOS USAM</b><i></i></div>
      <div class="ln" style="--c:#ffe2a0;--g:rgba(242,181,68,.8)"><b>SOMOS EXEMPLO</b><i></i></div></div>
    <div class="title8"><div class="kk mk"><span>DTS · Digital &amp; Technology Services</span></div><div class="rl"></div>
      <div class="tl mk"><span><em class="c1">Todos Sabem</em><em class="dot"> · </em><em class="c2">Todos Usam</em><em class="dot"> · </em><em class="c3">Somos Exemplo</em></span></div></div>
    <div class="lockup"><div class="lk-k mk"><span></span></div><div class="lk-ln"></div><div class="lk-d mk"><span></span></div></div>
    <div class="sub"><div class="plate"><div class="s"><span class="in"></span></div></div></div>
    <div class="streak8"><i></i></div><div class="flash8"></div>`;
  const $ = (s) => h8.querySelector(s);
  const t8 = $('.t8'), t8k = t8.querySelector('.kk'), t8L = [...t8.querySelectorAll('.ln')];
  const ti = $('.title8'), tiK = ti.querySelector('.kk span'), tiR = ti.querySelector('.rl'), tiL = ti.querySelector('.tl span');
  const lock = $('.lockup'), lkK = lock.querySelector('.lk-k span'), lkLn = lock.querySelector('.lk-ln'), lkD = lock.querySelector('.lk-d span');
  const sub = $('.sub'), subP = sub.querySelector('.plate'), subIn = sub.querySelector('.in'), subS = sub.querySelector('.s');
  const streak = $('.streak8'), flash = $('.flash8');
  const rise = (el, u) => { el.style.transform = `translateY(${((1 - u) * 108).toFixed(2)}%)`; };
  const vis = MG.vis;

  // ---------------------------------------------------------------- Fabio in the world
  // drawn after depth of field and motion blur (he is the focus), before bloom and grade (so he
  // shares the film's light and colour); a rig follows the camera and holds him in screen space
  const fg = new THREE.Scene(); fg.environment = world.scene.environment;
  fg.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a2b58, 1.1));
  const fgKey = new THREE.DirectionalLight(0xffe2c0, 2.2); fgKey.position.set(-400, 600, 900); fg.add(fgKey);
  const fgPass = new RenderPass(fg, world.camera); fgPass.clear = false; fgPass.clearDepth = true;
  world.composer.insertPass(fgPass, 3);
  const rig = new THREE.Group(); rig.matrixAutoUpdate = false; fg.add(rig);
  const fabTex = new THREE.Texture(); fabTex.colorSpace = THREE.SRGBColorSpace; fabTex.premultiplyAlpha = true;
  const fabMat = new THREE.ShaderMaterial({
    transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: false,
    uniforms: { map: { value: fabTex }, uGain: { value: new THREE.Vector3(1.16, 1.12, 1.06) }, uRim: { value: new THREE.Color(1.0, 0.72, 0.42) }, uA: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    // premultiplied texels; a warm light wrap on the soft edge ties him to the golden-hour world
    fragmentShader: `uniform sampler2D map; uniform vec3 uGain; uniform vec3 uRim; uniform float uA; varying vec2 vUv;
      void main(){ vec4 c = texture2D(map, vUv); float a = c.a; vec3 rgb = c.rgb * uGain;
        float edge = smoothstep(0.0, 0.5, a) * (1.0 - smoothstep(0.5, 1.0, a));
        rgb += uRim * edge * a * 0.35;
        gl_FragColor = vec4(rgb, a) * uA; }`,
  });
  const fab = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fabMat); fab.renderOrder = 1; rig.add(fab);
  // the button his snap summons, and the sparks of the snap
  const btnTex = new THREE.Texture(imgs.sharebtn); btnTex.colorSpace = THREE.SRGBColorSpace; btnTex.needsUpdate = true;
  const btn = O.capsuleButton(btnTex, { w: 58, h: 15, d: 11 }); btn.renderOrder = 2; rig.add(btn);
  const NS = 90, spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3)); spGeo.setAttribute('a', new THREE.BufferAttribute(new Float32Array(NS), 1));
  const spMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uS: { value: 7 } },
    vertexShader: 'attribute float a; varying float vA; uniform float uS; void main(){ vA = a; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(uS * 300.0 / -mv.z, 1.0, 28.0) * (0.5 + 0.5*a); }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float k = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(1.0,0.82,0.5) * k * vA * 2.2, 1.0); }' });
  const sparks = new THREE.Points(spGeo, spMat); sparks.renderOrder = 3; sparks.frustumCulled = false; rig.add(sparks);
  const flareMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float uA; void main(){ vec2 p = vUv - 0.5; float r = length(p); float g = exp(-r*r/0.004) + 0.35*exp(-r*r/0.03); float streak = exp(-p.y*p.y/0.0004) * exp(-abs(p.x)*5.0) * 0.8; gl_FragColor = vec4(vec3(1.0,0.85,0.55) * (g + streak) * uA, 1.0); }' });
  const flare = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flareMat); flare.renderOrder = 4; rig.add(flare);
  const fabN = (T, sh) => { // clip frame (1-based) for film time T in a composite shot
    const u = clamp((T - sh.a) / (sh.b - sh.a)); const ct = lerp(sh.fab.from, sh.fab.to, u);
    return Math.min(116, Math.max(1, Math.round(ct * FPS) + 1));
  };
  let fabShown = -1;
  const setFab = (img, n) => { if (fabShown === n) return; fabTex.image = img; fabTex.needsUpdate = true; fabShown = n; };

  // composite cameras (shot-local time u, the v7 pose at that moment)
  const CAMS = {
    // Todos Usam: low and close by the pillar; the orange word soft behind Fabio's left shoulder
    usam: (u) => ({ P: [150 - u * 8, 132, 190 - u * 12], T: [-140, 104, -470], fov: 30, aperture: 1.6e-4 }),
    // ranking: the podium to the right, room for Fabio in the left foreground
    rank: (u, p) => ({ P: [-330 + u * 6, 250, 1160 - u * 10], T: [-150, 262, 60], fov: 30, aperture: 7e-5 }),
  };

  // ---------------------------------------------------------------- helpers
  const shotAt = (T) => SHOTS.find((s) => T >= s.a && T < s.b) || SHOTS[SHOTS.length - 1];
  let hook = null;
  window.__camHook = (nt, pose) => {
    if (!hook || !hook.sh.cam) return null;
    return CAMS[hook.sh.cam](hook.T - hook.sh.a, pose);
  };
  const highlight = (s) => s.replace(/\*([^*]+)\*/g, '<b class="hl">$1</b>');
  let subKey = null, lockKey = null;

  // ---------------------------------------------------------------- graphics layer
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
    // 3. pillar lockups
    {
      const L = LOCK8.find(([a, b]) => T > a - 0.05 && T < b + 0.6);
      if (vis(lock, !!L)) {
        const [a, b, k, d, c, pos] = L;
        if (lockKey !== k) { lockKey = k; lkK.textContent = k; lkD.textContent = d; lock.style.setProperty('--c', c[0]); lock.style.setProperty('--c2', c[1]); lock.className = `lockup ${pos}`; }
        rise(lkK, E.outCubic(seg(T, a, a + 0.55))); lkLn.style.width = `${(E.inOutCubic(seg(T, a + 0.15, a + 0.85)) * 240).toFixed(1)}px`;
        rise(lkD, E.outCubic(seg(T, a + 0.25, a + 0.85))); lock.style.opacity = (1 - E.inOutSine(seg(T, b, b + 0.55))).toFixed(3);
      }
    }
    // 4. subtitles: the line rises out of its mask, key terms are underlined, consecutive lines swap in place
    {
      const i = SUBS8.findIndex(([a, b]) => T >= a && T < b), cur = SUBS8[i], prv = SUBS8[i - 1], nxt = SUBS8[i + 1];
      if (vis(sub, !!cur)) {
        const [a, b, s] = cur, cIn = prv && Math.abs(prv[1] - a) < 0.05, cOut = nxt && Math.abs(nxt[0] - b) < 0.05;
        if (subKey !== s) { subKey = s; subIn.innerHTML = highlight(s); }
        subS.style.setProperty('--hl', T < 24 ? '#5ea2ff' : T < 56.4 ? '#ff9a3c' : '#f5b847');
        rise(subIn, E.outCubic(seg(T, a, a + 0.6)));
        subIn.style.opacity = (1 - E.inCubic(seg(T, b - 0.25, b))).toFixed(3);
        subP.style.opacity = Math.min(cIn ? 1 : E.outCubic(seg(T, a, a + 0.35)), cOut ? 1 : 1 - E.inCubic(seg(T, b - 0.3, b))).toFixed(3);
        subIn.querySelectorAll('.hl').forEach((h, k) => { const t0 = a + 0.6 + k * 0.45; h.style.backgroundSize = `${(E.inOutCubic(seg(T, t0, t0 + 0.7)) * 100).toFixed(1)}% 3px`; });
      }
    }
    // 5. the golden thread across the big cuts, and the flashes
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

  // ---------------------------------------------------------------- update
  function update(T) {
    const sh = shotAt(T);
    graphics(T);
    if (sh.kind === 'foot') {
      vis(foot, true); hud.classList.add('off');
      footImg.style.filter = `saturate(1.04) contrast(1.02) brightness(${E.inOutSine(seg(T, 0, 0.6)).toFixed(3)})`;
      rig.visible = false;
      return { skip3d: true };
    }
    vis(foot, false); hud.classList.remove('off');
    for (const k of ['k', 'rank', 'end']) hud.classList.toggle(`show-${k}`, !!(sh.show && sh.show.includes(k)));
    const nt7 = sh.f(T);
    hook = { sh, T };
    film7.update(F0 + nt7);
    // motion blur on this film's clock (speed ramps), never across a cut
    const Tp = Math.max(sh.a, T - SHUTTER); hook = { sh, T: Tp };
    const pp = film7.cam(sh.f(Tp)); world.setPrevCamera(pp.P, pp.T, pp.fov, T - sh.a > 0.03 ? 1 : 0);
    hook = { sh, T };
    // composite: Fabio in front of the world, focus on him
    rig.visible = sh.kind === 'comp';
    if (sh.kind === 'comp') {
      const cam = world.camera; cam.updateMatrixWorld(true); rig.matrix.copy(cam.matrixWorld); rig.matrixWorldNeedsUpdate = true;
      const { dist, x, s } = sh.fab, fh = 2 * dist * Math.tan(cam.fov * deg / 2), fw = fh * cam.aspect, h = fh * s, w = h * 16 / 9;
      fab.position.set(x * fw, -fh / 2 + h / 2, -dist); fab.scale.set(w, h, 1);
      world.dof.uniforms.focus.value = dist; world.dof.uniforms.maxblur.value = 0.009;
      const inShot = (T - sh.a) / (sh.b - sh.a);
      fabMat.uniforms.uA.value = 1;
      // the snap (Todos Usam): sparks at his fingers, the button pops out of the light
      const snapOn = sh.cam === 'usam';
      const hand = [x * fw + (-0.215) * w, -fh / 2 + h / 2 + 0.03 * h, -dist + 20]; // his raised right hand at the snap
      btn.visible = snapOn && T > SNAP + 0.08;
      if (btn.visible) {
        const u = E.outBack(seg(T, SNAP + 0.08, SNAP + 0.5), 1.6);
        btn.position.set(hand[0] - 36, hand[1] + 20 - (1 - u) * 8, hand[2] - 12); btn.scale.setScalar(Math.max(0.001, u));
        btn.rotation.set(-0.12, 0.35 - u * 0.25 + Math.sin(T * 2) * 0.02, 0.05);
      }
      {
        const a = spGeo.attributes, R = rng(77), dt = T - SNAP;
        for (let i = 0; i < NS; i++) {
          const az = R() * Math.PI * 2, el = (R() - 0.3) * 2.2, v = 60 + R() * 160, l = 0.5 + R() * 0.7;
          const on = snapOn && dt > 0 && dt < l, d = (1 - Math.exp(-3 * Math.max(0, dt))) / 3;
          a.position.array.set([hand[0] + Math.cos(az) * Math.cos(el) * v * d, hand[1] + Math.sin(el) * v * d - 30 * dt * dt, hand[2] + Math.sin(az) * v * d * 0.4], i * 3);
          a.a.array[i] = on ? (1 - dt / l) : 0;
        }
        a.position.needsUpdate = true; a.a.needsUpdate = true; sparks.visible = snapOn;
        flare.visible = snapOn; flare.position.set(...hand); flare.scale.set(220, 220, 1);
        flareMat.uniforms.uA.value = snapOn ? pulse(T, SNAP, 0.04, 0.35) * 1.4 : 0;
      }
    }
    return {};
  }
  // what a frame needs loaded: a clip frame, or Fabio's matte
  const needs = (T) => {
    const sh = shotAt(T);
    if (sh.kind === 'foot') return { foot: `clips/${sh.clip}/r_${String(Math.min(313, Math.max(1, Math.round(sh.f(T) * FPS) + 1))).padStart(3, '0')}.jpg` };
    if (sh.kind === 'comp') return { fab: fabN(T, sh) };
    return null;
  };
  let footSrc = '';
  const loadFoot = async (src) => { if (src === footSrc) return; footImg.src = src; await footImg.decode(); footSrc = src; };
  const fabCache = new Map();
  const loadFab = async (n) => {
    let img = fabCache.get(n);
    if (!img) { img = new Image(); img.src = `fabio_matte/e_${String(n).padStart(3, '0')}.png`; await img.decode(); fabCache.set(n, img); if (fabCache.size > 12) fabCache.delete(fabCache.keys().next().value); }
    setFab(img, n);
  };
  const nt7 = (T) => { const sh = shotAt(T); return sh.kind === 'foot' ? null : sh.f(T); };
  return { duration: DURATION, update, needs, loadFoot, loadFab, nt7 };
}
