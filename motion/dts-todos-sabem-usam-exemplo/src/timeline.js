// DTS · Todos Sabem, Todos Usam, Somos Exemplo (v5) — every value is a pure function of time.
// The v3 choreography is kept intact on its own clock ("story time" t) and replayed through
// the pacing curve in pace.js (film time nt): slower moves, reading holds, and a
// MOVE -> SETTLE -> READ -> ABSORB -> TRANSITION beat for each pillar. Overlays that must stay
// still while they are read (pillar lockups, act light) run on the film clock.
// v5: three "inserts" (flat segments of PACE) freeze the story while new scenes play on the
// film clock: a short FLOWS tour (Início -> Catálogo de Métodos -> Início -> Biblioteca),
// the anatomy of the skill name and the real step 2 of the form (Detalhes).
import * as THREE from 'three';
import { E, clamp, lerp, seg, path, track, env as envl, pulse, rng, deg, warp } from './util.js';
import * as O from './objects.js';
import * as MG from './mg.js';
import { buildPodium, AREAS } from './podium.js';
import { IDENT, ID_TYPE } from './ident.js';
import { PACE, PILLAR_SEQ, INSERTS, INTRO, SUBS as STORY_SUBS, SCHED } from './pace.js';

export const FILM = PACE[PACE.length - 1][0];
// global clock: [A&M ident [0, ID)] -> Fabio's intro clip [ID, FILM0) -> the film (nt = T - FILM0)
export const ID = INTRO.ident ? IDENT : 0; // the A&M ident is optional (off in v6)
export const FILM0 = ID + INTRO.dur;
export const DURATION = FILM0 + FILM;
const SHUTTER = 1 / 64; // ~135° shutter: motion reads smooth without smearing
const S = warp(PACE);
const BLUE = 0x3d8bff, ORANGE = 0xff8a1f, GOLD = 0xf2b544;
const ACCENT = [0x4d8dff, 0xff8a2a, 0xffc24a];

export function buildFilm(ctx) {
  const { world, cam, project, font, tex, manifest, hud, imgs, ident } = ctx;
  const scene = world.scene;
  const add = (o) => { scene.add(o); return o; };
  const mixv = (a, b, u) => a.map((x, i) => lerp(x, b[i], u));
  const off3 = (a, d) => a.map((x, i) => x + d[i]);

  // ------------------------------------------------------------ library ring (441 skills)
  const atlas = O.canvasTex(1720, 600, (x) => { x.imageSmoothingQuality = 'high'; for (let k = 0; k < 8; k++) x.drawImage(imgs[`card_${k}`], (k % 4) * 430, (k < 4 ? 0 : 300), 430, 300); }, world.maxAniso);
  const TARGET = 64;
  const ring = O.libraryRing(atlas, { holes: [TARGET, 150, 211, 290, 333, 379, 418] });
  add(ring.body); add(ring.face);
  const slotPos = ring.slots[TARGET].pos.clone(), slotQ = ring.slots[TARGET].q.clone();
  const SL = [slotPos.x, slotPos.y, slotPos.z];

  // ------------------------------------------------------------ DTS emblem + pillar podiums
  const emblem = add(new THREE.Group());
  const embBase = O.shadowed(new THREE.Mesh(new THREE.CylinderGeometry(270, 285, 26, 96), O.glossy(0x132c6b, { roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.35 })));
  embBase.position.y = 13; emblem.add(embBase);
  const embRing = new THREE.Mesh(new THREE.TorusGeometry(278, 4, 12, 160), new THREE.MeshStandardMaterial({ color: 0xffc46e, emissive: 0xffa640, emissiveIntensity: 2.2 }));
  embRing.rotation.x = -Math.PI / 2; embRing.position.y = 26.5; emblem.add(embRing);
  const dts = O.word3d(font, 'DTS', { size: 150, depth: 44, faceMat: O.glossy(0x15367a, { roughness: 0.22 }), sideMat: O.gold(), spacing: 0.05 });
  dts.group.position.y = 26; emblem.add(dts.group);
  emblem.position.set(0, 0, 60);

  const mkPillar = (text, color, side, pos, rotY) => {
    const g = add(new THREE.Group());
    const pod = O.podium(color); g.add(pod);
    const c = new THREE.Color(color);
    const w = O.word3d(font, text, { size: 46, depth: 18, faceMat: O.glossy(color, { roughness: 0.25 }), sideMat: O.glossy(c.clone().multiplyScalar(0.55).getHex(), { roughness: 0.35 }), spacing: 0.03 });
    // each letter owns its face material, so a glint of light can travel across the word
    w.letters.forEach((l) => { l.face = l.mesh.material[0].clone(); l.face.emissive.set(color); l.face.emissiveIntensity = 0; l.mesh.material = [l.face, l.mesh.material[1]]; });
    w.group.position.set(0, 70, 10); g.add(w.group);
    const light = new THREE.PointLight(color, 0, 1100, 2); light.position.set(0, 250, 200); g.add(light);
    // a soft halo of light behind the word for its moment (strongest, golden, on Somos Exemplo)
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1500, 900), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uA: { value: 0 }, uT: { value: 0 }, uC: { value: c.clone().lerp(new THREE.Color(0xffffff), 0.25) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uA, uT; uniform vec3 uC;
        void main(){ vec2 p = vUv - vec2(0.5, 0.28); p.x *= 1.65; float r = length(p);
          float glow = exp(-r*r/0.035) * 0.8 + exp(-r*r/0.22) * 0.3;
          float ang = atan(p.x, p.y), beams = 0.0;
          for (int i = 0; i < 9; i++) { float fi = float(i); float a0 = (fi - 4.0) * 0.27 + sin(uT * 0.13 + fi) * 0.03; beams += exp(-pow((ang - a0) / 0.05, 2.0)) * (0.65 + 0.35 * sin(uT * 0.45 + fi * 1.7)); }
          beams *= smoothstep(0.04, 0.22, r) * (1.0 - smoothstep(0.3, 0.72, r)) * smoothstep(-0.05, 0.1, p.y);
          gl_FragColor = vec4(uC * (glow * 0.5 + beams * 0.3) * uA, 1.0); }`,
    }));
    halo.position.set(0, 200, -250); halo.userData.noDepth = true; halo.renderOrder = 6; halo.visible = false; g.add(halo);
    g.position.set(...pos); g.rotation.y = rotY * deg;
    return { g, pod, word: w, light, color, side, halo };
  };
  const P_S = mkPillar('TODOS SABEM', BLUE, 'S', [-560, 0, -360], 20);
  const P_U = mkPillar('TODOS USAM', ORANGE, 'U', [0, 0, -500], 0);
  const P_E = mkPillar('SOMOS EXEMPLO', GOLD, 'E', [560, 0, -360], -20);
  const PILLARS = [P_S, P_U, P_E];
  window.__dbg = { dts, P_S, P_U, emblem }; // debug handles (camera matching tools)

  // ------------------------------------------------------------ UI frames
  // the FLOWS screen in its 3D frame is a canvas: real screenshots (Início, Catálogo de Métodos,
  // Biblioteca de Skills) cross-dissolve, and highlight rings are drawn in screen pixels
  const SW = 1672, SH = 941, FW = 780, FH = 439;
  const scrCanvas = document.createElement('canvas'); scrCanvas.width = SW; scrCanvas.height = SH;
  const scrCtx = scrCanvas.getContext('2d');
  const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = world.maxAniso;
  const inicio = add(O.uiFrame(scrTex, { w: FW, h: FH, bezel: 14, depth: 14 }));
  let scrKey = '';
  const drawScreen = (a, b, k, rings) => {
    const key = `${a}|${b}|${k.toFixed(3)}|${rings.map((r) => r.join(',')).join(';')}`;
    if (key === scrKey) return; scrKey = key;
    const x = scrCtx; x.globalAlpha = 1; x.drawImage(imgs[a], 0, 0, SW, SH);
    if (b && k > 0.001) { x.globalAlpha = k; x.drawImage(imgs[b], 0, 0, SW, SH); x.globalAlpha = 1; }
    for (const [x0, y0, x1, y1, o] of rings) {
      if (o < 0.01) continue;
      const p = 7, r = Math.min(18, (y1 - y0) / 2 + p);
      x.save(); x.globalAlpha = o; x.shadowColor = 'rgba(255,150,40,.95)'; x.shadowBlur = 24; x.strokeStyle = '#ffa733'; x.lineWidth = 6.5;
      O.roundRect(x, x0 - p, y0 - p, x1 - x0 + 2 * p, y1 - y0 + 2 * p, r); x.stroke(); x.shadowBlur = 0; x.lineWidth = 3; x.strokeStyle = '#ffe2b0'; x.stroke();
      x.globalAlpha = o * 0.1; x.fillStyle = '#ffb347'; x.fill(); x.restore();
    }
    scrTex.needsUpdate = true;
  };
  // screen pixel -> frame local -> world (the frame's pose at story time t, or its live pose)
  const scrLocal = (px, py, dz = 8) => new THREE.Vector3((px / SW - 0.5) * FW, -(py / SH - 0.5) * FH, dz);
  const framePose = (t) => { const o = new THREE.Object3D(); o.position.set(0, 285, -120); o.rotation.set(-0.04 + Math.sin(t * 0.8) * 0.01, Math.sin(t * 0.5) * 0.03, 0); o.updateMatrixWorld(true); return o; };

  const MR = manifest._modalRects;
  const MODAL = { c: [0, 330, -40], w: 330 };
  const MS = MODAL.w / MR.W, MH = MR.H * MS;
  const modalTex = new THREE.Texture(imgs.m_empty); modalTex.colorSpace = THREE.SRGBColorSpace; modalTex.anisotropy = world.maxAniso; modalTex.needsUpdate = true;
  let modalImg = 'm_empty';
  const modal = add(O.uiFrame(modalTex, { w: MODAL.w, h: MH, bezel: 10, depth: 12, body: 0xe9eef8, alpha: true, glass: true, radius: 18 }));
  const mpt = (u, v, dz = 7) => [MODAL.c[0] + (u - MR.W / 2) * MS, MODAL.c[1] - (v - MR.H / 2) * MS, MODAL.c[2] + dz];
  const fieldC = (f, du = 0) => mpt(MR[f].x + MR[f].w / 2 + du, MR[f].y + MR[f].h / 2);
  // step 2 (Detalhes): the baked full-height page is composed like the real modal: fixed
  // header, scrolled body, fixed footer and a thin scrollbar; it dissolves in from step 1
  const DL = manifest._det, DZ = imgs.m_empty.width / MR.W, DSC = DL.H - MR.H; // DSC: full scroll
  const mCanvas = document.createElement('canvas'); mCanvas.width = imgs.m_empty.width; mCanvas.height = imgs.m_empty.height;
  const mCtx = mCanvas.getContext('2d');
  const mCanvasTex = new THREE.CanvasTexture(mCanvas); mCanvasTex.colorSpace = THREE.SRGBColorSpace; mCanvasTex.anisotropy = world.maxAniso;
  const scrM = modal.userData.screen.material;
  const useMap = (tx) => { if (scrM.map !== tx) { scrM.map = tx; scrM.needsUpdate = true; } };
  let detKey = '';
  const composeDet = (name, scroll, under, k) => {
    const img = imgs[name], low = under && imgs[under];
    const key = `${name}|${scroll.toFixed(2)}|${under}|${k.toFixed(3)}`;
    if (!img || key === detKey) return; detKey = key;
    const x = mCtx, W = mCanvas.width, H = mCanvas.height, hd = Math.round(DL.head * DZ), ft = Math.round(DL.foot * DZ), bh = H - hd - ft;
    x.clearRect(0, 0, W, H); x.globalAlpha = 1;
    if (low && k < 0.999) x.drawImage(low, 0, 0, W, H);
    x.globalAlpha = k;
    x.drawImage(img, 0, 0, W, hd, 0, 0, W, hd);
    x.drawImage(img, 0, hd + scroll * DZ, W, bh, 0, hd, W, bh);
    x.drawImage(img, 0, img.height - ft, W, ft, 0, H - ft, W, ft);
    const total = img.height / DZ - DL.head - DL.foot, vis = MR.H - DL.head - DL.foot, max = total - vis;
    if (max > 1) { const th = (vis * vis) / total, ty = DL.head + 5 + (scroll / max) * (vis - th - 10); x.fillStyle = 'rgba(112,122,145,.42)'; O.roundRect(x, (MR.W - 9) * DZ, ty * DZ, 4.5 * DZ, th * DZ, 2.25 * DZ); x.fill(); }
    x.globalAlpha = 1; mCanvasTex.needsUpdate = true;
  };
  // a Detalhes element in modal-window CSS px (body scrolls; the footer button stays put)
  const detRect = (n, scroll) => { const r = DL.rects[n]; return { x: r.x, y: n === 'share' ? r.y - DSC : r.y - scroll, w: r.w, h: r.h }; };
  const detC = (n, scroll, dz = 7) => { const r = detRect(n, scroll); return mpt(r.x + r.w / 2, r.y + r.h / 2, dz); };

  // ------------------------------------------------------------ step props
  const btnPed = add(O.pedestal({ r: 80, h: 110 }));
  const btn = add(O.capsuleButton(tex('sharebtn'), { w: 380, h: 96, d: 72 }));
  const cursor = add(O.cursor3d());
  const keys = ['[', 'D', 'T', 'S', ']'].map((k) => add(O.keycap(k, { s: 50 })));
  const models = [['Claude Haiku 4.5', 'H'], ['Claude Opus 4', 'O'], ['Claude Sonnet 4.5', 'S'], ['Claude Opus 4.5', 'O'], ['Claude Sonnet 5', 'S'], ['Claude Sonnet 4', 'S'], ['Claude Haiku 3.5', 'H']];
  const SEL = 4;
  const drum = add(O.rolodex(models, { w: 300, h: 66, r: 92 }));
  const chip = add(O.skillSlab(O.labelTex('Flows / Claude', { w: 1024, h: 220, font: '700 104px Inter', color: '#0f2556', bg: '#eceefe', radius: 70 }), { w: 150, h: 32, depth: 7 }));
  const boxPed = add(O.pedestal({ r: 95, h: 90 }));
  const box = add(O.cardboardBox({ w: 150, h: 104, d: 128 }));
  const fileDefs = [['SKILL.md', { gold: true }], ['README.md', { tint: 0xd8e6ff }], ['LICENSE', { tint: 0xd9f3e6 }], ['scripts/', { dir: true }], ['references/', { dir: true }], ['assets/', { dir: true }]];
  const files = fileDefs.map(([n, o]) => add(O.docFile(n, o)));
  const newCard = add(O.skillSlab(tex('card_new'), { w: 172, h: 120, depth: 6 }));
  // the fly-along camera rides with the new card: it is masked out of the motion blur during the flight
  const heroCards = [4, 5, 2].map((k) => add(O.skillSlab(tex(`card_${k}`), { w: 250, h: 174, depth: 7 })));
  const threads = [];
  { const R = rng(5); const picks = new Set(); while (picks.size < 34) { const i = Math.floor(R() * ring.N); const a = ring.slots[i].a; const da = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (!ring.holeSet.has(i) && Math.abs(i - TARGET) > 2 && da < 1.9 && da > 0.08) picks.add(i); }
    for (const i of picks) { const th = O.thread(slotPos.clone(), ring.slots[i].pos.clone(), 250 + R() * 500); th.userData.tile = i; th.userData.delay = R() * 1.6; add(th); threads.push(th); } }
  const shock = add(O.glowRing(0xffc46e));
  const podium = buildPodium({ scene, imgs, manifest });
  // contact shadows (fade in as each prop reaches the floor)
  const ao = (w, d, k) => add(O.contactShadow(w, d, k));
  const aoEmb = ao(820, 820, 0.5), aoPil = PILLARS.map((p) => { const m = ao(700, 380, 0.55); m.position.set(p.g.position.x, 0.6, p.g.position.z); m.rotation.z = -p.g.rotation.y; return m; });
  const aoBtn = ao(330, 330, 0.55), aoBox = ao(360, 360, 0.55);
  const aoSet = (m, restY, x, z) => { const k = clamp(1 - Math.abs(restY) / 90); m.visible = k > 0.01; m.material.opacity = m.userData.k * k; if (x !== undefined) m.position.set(x, 0.6, z); };

  // sparks (3D points), flight trail, golden motes around the Somos Exemplo pillar
  const mkPoints = (n, size, color, gain = 2.2) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('a', new THREE.BufferAttribute(new Float32Array(n), 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uS: { value: size }, uC: { value: new THREE.Color(color) }, uG: { value: gain } },
      vertexShader: `attribute float a; varying float vA; uniform float uS; void main(){ vA = a; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(uS * 400.0 / -mv.z, 1.0, 40.0) * (0.4 + 0.6*a); }`,
      fragmentShader: `varying float vA; uniform vec3 uC; uniform float uG; void main(){ float d = length(gl_PointCoord-0.5); float k = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(uC * k * vA * uG, 1.0); }` });
    const p = new THREE.Points(g, m); p.userData.noDepth = true; p.renderOrder = 30; p.frustumCulled = false; add(p);
    return p;
  };
  const sparks = mkPoints(200, 12, 0xffd08a, 1.7);
  const trail = mkPoints(60, 20, 0xffc46e, 1.8);
  const motes = mkPoints(80, 16, 0xffd58a, 2.0);
  const moteSeeds = Array.from({ length: 80 }, (_, i) => { const R = rng(900 + i); return { a: R() * Math.PI * 2, r: 90 + R() * 420, y0: R() * 460, v: 16 + R() * 26, ph: R() * 10 }; });
  const burst = (arr, t, t0, o, { n = 60, seed = 1, speed = 320, life = 1.1, g = 420, up = 0.7 } = {}) => {
    const dt = t - t0; if (dt < 0 || dt > life + 0.3) return 0;
    const R = rng(seed); let k = arr.i;
    for (let i = 0; i < n; i++) {
      const az = R() * Math.PI * 2, el = (R() * 2 - 1 + up) * 0.9, v = speed * (0.35 + R() * 0.9), l = life * (0.5 + R() * 0.6);
      if (dt > l || k >= arr.n) { continue; }
      const drag = (1 - Math.exp(-2.4 * dt)) / 2.4;
      arr.pos[k * 3] = o[0] + Math.cos(az) * Math.cos(el) * v * drag;
      arr.pos[k * 3 + 1] = o[1] + (Math.sin(el) * v + speed * 0.25) * drag - 0.5 * g * dt * dt;
      arr.pos[k * 3 + 2] = o[2] + Math.sin(az) * Math.cos(el) * v * drag;
      arr.a[k] = (1 - dt / l) * 0.8; k++;
    }
    arr.i = k; return 1;
  };

  // ------------------------------------------------------------ HUD (motion graphics)
  hud.innerHTML = `<div class="band"></div>
    <svg class="spot" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><mask id="spotm"><rect width="1920" height="1080" fill="#fff"/><rect class="hole" rx="22" fill="#000"/></mask></defs><rect width="1920" height="1080" fill="rgba(5,8,30,.62)" mask="url(#spotm)"/></svg>
    <div class="bug"><div class="am"><img src="tex/am_mark.svg" alt=""><i></i></div><div class="m">DTS</div><div class="t"><small>Digital &amp; Technology Services</small>Todos Sabem · Todos Usam · Somos Exemplo</div></div>
    <div class="pillars"><div class="pill" style="--c:#3d8bff"><i></i>Todos Sabem<em></em></div><div class="pill" style="--c:#ff8a1f"><i></i>Todos Usam<em></em></div><div class="pill" style="--c:#f2b544"><i></i>Somos Exemplo<em></em></div></div>
    <div class="sub"><div class="plate"><div class="k"></div><div class="s"><span class="in"></span></div></div></div>
    <div class="tag t-dts" style="top:835px;font-size:30px">Digital &amp; Technology Services</div>
    <div class="hbd"></div>
    <div class="headline h-open" style="top:356px"></div>
    <div class="tag t-open" style="top:458px">Compartilhar uma Skill no FLOWS · 6 passos</div>
    <div class="lockup"><div class="lk-k mk"><span></span></div><div class="lk-ln"></div><div class="lk-d mk"><span></span></div></div>
    <div class="kin k-count" style="top:200px"><div class="kic"></div><div class="big">0</div><div class="kl"></div><div class="lbl"></div></div>
    <div class="seg-lbl" style="--c:#f2a93b"><b>1</b>Prefixo da Área</div><div class="seg-lbl" style="--c:#3d8bff"><b>2</b>Service Line</div><div class="seg-lbl" style="--c:#20aa64"><b>3</b>Produto/Entregável</div>
    <div class="clk"></div>
    <div class="callout soft c-where"><span class="dot">✓</span>contexto da validação</div>
    <div class="callout c-req"><span class="dot">*</span>obrigatório</div>
    <div class="callout soft c-opt"><span class="dot">⏱</span>opcional · minutos na mão</div>
    <div class="callout c-root"><span class="dot">★</span>SKILL.md na raiz</div>
    <div class="endcard" style="top:170px"><div class="l1"><span class="mk"><span class="c1">Todos Sabem.</span></span> <span class="mk"><span class="c2">Todos Usam.</span></span> <span class="mk"><span class="c3">Somos Exemplo.</span></span></div>
      <div class="l2">DTS · Digital &amp; Technology Services</div>
      <div class="l3"><img src="tex/logo.png" alt="">Compartilhe sua skill no FLOWS</div></div>
    <div class="pd-head"><span class="c1">${MG.ico('chart')}Ranking de Áreas · Todos os tempos</span><span class="c2">${MG.ico('users')}12 áreas no placar</span></div>
    <div class="pd-stamp">${MG.ico('crown', '', 2)}<div><b>Nº 1</b><small>entre 12 áreas no placar</small></div></div>
    <div class="pd-stats"><div class="s1">${MG.ico('upload')}<b>0</b><small>publicações</small></div><div class="s2">${MG.ico('download')}<b>0</b><small>adoções</small></div></div>
    <div class="ho-glow"></div>
    <div class="intro-t"><div class="cov"></div><div class="h"></div><div class="tg">Compartilhar uma Skill no FLOWS · 6 passos</div></div>
    <div class="id-cap"><div class="n mk"><span>ALVAREZ &amp; MARSAL</span></div><div class="ln"></div><div class="s mk"><span>Digital &amp; Technology Services · apresenta</span></div></div>
    <div class="am-sign"><img src="tex/am_mark.svg" alt=""><span>Alvarez &amp; Marsal</span><i></i><span class="d">DTS · Digital &amp; Technology Services</span></div>`;
  const $ = (s) => hud.querySelector(s);
  const bug = $('.bug'), pillBox = $('.pillars'), pills = [...hud.querySelectorAll('.pill')], pillFill = pills.map((p) => p.querySelector('em'));
  const subK = $('.sub .k'), subS = $('.sub .s'), subIn = $('.sub .in'), subP = $('.sub .plate'), band = $('.band');
  const tDts = $('.t-dts'), hOpen = $('.h-open'), tOpen = $('.t-open'), hBd = $('.hbd');
  hOpen.innerHTML = 'Como DTS compartilha conhecimento'.split(' ').map((w) => `<span class="mk"><span class="w">${w}</span></span> `).join('');
  const hOpenW = [...hOpen.querySelectorAll('.w')];
  const lock = $('.lockup'), lkK = lock.querySelector('.lk-k span'), lkLn = lock.querySelector('.lk-ln'), lkD = lock.querySelector('.lk-d span');
  const LOCK = [['Pilar 01', 'Onde está o conhecimento', '#d3e6ff', '#3d8bff'], ['Pilar 02', 'O passo a passo no dia a dia', '#ffe1c2', '#ff8a1f'], ['Pilar 03', 'Quem compartilha, lidera pelo exemplo', '#ffecc2', '#f2b544']];
  const kC = $('.k-count'), kCBig = kC.querySelector('.big'), kCLbl = kC.querySelector('.lbl'), kIc = kC.querySelector('.kic'), kL = kC.querySelector('.kl');
  const segLbl = [...hud.querySelectorAll('.seg-lbl')], clk = $('.clk'), spot = $('.spot'), spotHole = spot.querySelector('.hole'), cWhere = $('.c-where'), cReq = $('.c-req'), cOpt = $('.c-opt'), cRoot = $('.c-root');
  const endc = $('.endcard'), endSpans = [...endc.querySelectorAll('.l1 .mk > span')], endL2 = endc.querySelector('.l2'), endL3 = endc.querySelector('.l3');
  const show = (el, op, x = null, y = null, ax = 0, ay = 0, sc = 1) => {
    el.style.opacity = op; el.style.display = op > 0.003 ? '' : 'none';
    if (op > 0.003 && x !== null) el.style.transform = `translate(${x}px,${y}px) translate(${-ax * 100}%,${-ay * 100}%) scale(${sc})`;
  };
  const rise = (inner, u) => { inner.style.transform = `translateY(${((1 - u) * 108).toFixed(2)}%)`; };
  // ---- motion-graphics layer (After Effects style, calm)
  const HLC = ['#5ea2ff', '#ff9a3c', '#f5b847'];
  const tracker = MG.stepTracker(hud, [
    { icon: 'upload', name: 'Compartilhar', a: 26.0, b: 30.6 }, { icon: 'type', name: 'Nome', a: 30.6, b: 37.5 }, { icon: 'flask', name: 'Onde testou', a: 37.5, b: 42.5 },
    { icon: 'cpu', name: 'Modelo', a: 42.5, b: 48.5 }, { icon: 'folderzip', name: 'Arquivos', a: 48.5, b: 55.5 }, { icon: 'rocket', name: 'Detalhes · Publicar', a: 55.5, b: 58.2 }]);
  const focus = MG.focusFrame(hud);
  const FOCUS = [['name', 31.25, 37.3], ['where', 37.6, 42.3], ['model', 42.6, 46.9], ['time', 47.2, 48.5], ['file', 54.5, 55.5], ['next', 55.7, 57.0]];
  const DFOCUS = SCHED.det.focus;
  const bars = MG.letterbox(hud);
  const pdHead = $('.pd-head'), pdStamp = $('.pd-stamp'), pdStats = $('.pd-stats');
  const pdLink = MG.el('<svg class="pd-link" width="1920" height="1080" viewBox="0 0 1920 1080"><path fill="none" stroke="#ffd27a" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 0"/><circle r="7" fill="#ffd27a" stroke="#fff" stroke-width="2.5"/></svg>');
  hud.appendChild(pdLink); const pdLinkD = MG.drawable(pdLink); pdLinkD[1].e.style.strokeDasharray = 'none';
  const segLn = MG.el('<svg class="seg-ln" width="1920" height="1080" viewBox="0 0 1920 1080"><g fill="none" stroke-width="2.5" stroke-linecap="round"><path stroke="#f2a93b"/><path stroke="#3d8bff"/><path stroke="#20aa64"/></g></svg>');
  hud.appendChild(segLn); const segPath = [...segLn.querySelectorAll('path')];
  // ---- Fabio's intro clip (DOM layer under the HUD): frames are loaded on demand by main.js
  const clipWrap = document.createElement('div'); clipWrap.id = 'clipwrap';
  clipWrap.innerHTML = '<img alt="">'; hud.parentNode.insertBefore(clipWrap, hud);
  const clipImg = clipWrap.querySelector('img');
  let clipN = -1;
  const loadClip = async (n) => {
    if (n === clipN) return;
    clipImg.src = INTRO.frames.replace('%03d', String(n).padStart(3, '0'));
    await clipImg.decode(); clipN = n;
  };
  const clipIndex = (u) => Math.min(Math.round(INTRO.dur * INTRO.fps) - 1, Math.max(0, Math.floor(u * INTRO.fps + 1e-6)));
  const clipScale = (u) => 1 + (INTRO.zoom[2] - 1) * E.inOutSine(seg(u, INTRO.zoom[0], INTRO.zoom[1]));
  const hoGlow = $('.ho-glow');
  const introT = $('.intro-t'), introCov = introT.querySelector('.cov'), introH = introT.querySelector('.h'), introTg = introT.querySelector('.tg');
  introH.innerHTML = 'Como DTS compartilha conhecimento'.split(' ').map((w) => `<span class="mk"><span class="w">${w}</span></span> `).join('');
  const introW = [...introH.querySelectorAll('.w')];
  // u: clip time (continues after the cut). v7: the title stays up through the cut, over the pillar
  // (the camera settles a little high, so the word sits clear below it), and leaves only once it has
  // been read (INTRO.out): the tag first, then the words drop back into their masks one by one, then
  // the frosted panel dissolves; the camera then comes down onto the pillar and its lockup rises.
  const introTitle = (u) => {
    const a = INTRO.cover, o0 = INTRO.dur + INTRO.out[0], o1 = INTRO.dur + INTRO.out[1];
    const panel = 1 - E.inOutSine(seg(u, o0 + 0.35, o1));
    const o = E.inOutSine(seg(u, a[0], a[1])) * panel;
    if (!MG.vis(introT, o > 0.003)) return;
    introT.style.transform = `scale(${clipScale(u).toFixed(4)})`;
    introCov.style.opacity = o.toFixed(3); introCov.style.transform = `scale(${(0.985 + 0.015 * o).toFixed(4)})`;
    introW.forEach((w, i) => { const d = o0 + 0.1 + i * 0.06; rise(w, E.outCubic(seg(u, INTRO.title + i * 0.08, INTRO.title + 0.6 + i * 0.08)) * (1 - E.inCubic(seg(u, d, d + 0.45)))); });
    introH.style.opacity = (1 - seg(u, o1 - 0.12, o1)).toFixed(3);
    const tg = E.outCubic(seg(u, INTRO.title + 0.55, INTRO.title + 1.1)), tgOut = E.inOutSine(seg(u, o0, o0 + 0.35));
    introTg.style.opacity = (tg * (1 - tgOut)).toFixed(3);
    introTg.style.transform = `translateY(${((1 - tg) * 10 + tgOut * 8).toFixed(2)}px)`;
  };
  const idCap = $('.id-cap'), idN = idCap.querySelector('.n span'), idLine = idCap.querySelector('.ln'), idS = idCap.querySelector('.s span'), amSign = $('.am-sign');
  // subtitles run on the film clock: story lines are placed through the pacing curve, and
  // the inserts add their own lines; chained lines keep the plate up and swap the text
  const NT_TAB = []; for (let x = 0; x <= FILM + 1e-6; x += 1 / 96) NT_TAB.push(S(x));
  const NT = (st) => { let lo = 0, hi = NT_TAB.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (NT_TAB[m] < st) lo = m + 1; else hi = m; } return lo / 96; };
  const SUBS = STORY_SUBS.map(([a, b, k, txt]) => ({ a: NT(a), b: NT(b), k, s: txt, c: a < 24 ? 0 : a < 62 ? 1 : 2 }));
  const isub = (q, u0, u1, k, txt, ul, c = 1) => ({ a: q.a + u0 / q.k, b: q.a + u1 / q.k, k, s: txt, c, ul: ul && ul.map((x) => q.a + x / q.k) });
  INSERTS.forEach((q) => SCHED[q.id].subs.forEach(([u0, u1, k, txt, ul]) => SUBS.push(isub(q, u0, u1, k, txt, ul, q.id === 'tour' ? 0 : 1))));
  SUBS.sort((x, y) => x.a - y.a);
  for (let i = 1; i < SUBS.length; i++) { const g = SUBS[i].a - SUBS[i - 1].b; if (g >= 0 && g < 0.35) SUBS[i].a = SUBS[i - 1].b; }
  const chained = (x, y) => x && y && Math.abs(x.b - y.a) < 1e-6;
  let subKey = null;

  // ------------------------------------------------------------ helpers
  const setCam = (pos, tgt, fov = 30) => { cam.position.set(...pos); cam.up.set(0, 1, 0); cam.lookAt(...tgt); cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); };
  const riseY = (t, t0, dur = 0.8, from = -220, s = 1.3) => from * (1 - E.outBack(seg(t, t0, t0 + dur), s));
  const sinkY = (t, t0, dur = 0.7, to = -260) => to * E.inBack(seg(t, t0, t0 + dur), 1.2);
  const squash = (t, t0, amt = 0.12, d = 0.18) => { const p = pulse(t, t0, 0.03, d) * Math.cos((t - t0) * 18); return [1 + amt * 0.8 * p, 1 - amt * p]; };
  const letterPop = (letters, t, t0, stagger = 0.07, dur = 0.6, drop = 60) => {
    letters.forEach((l, i) => {
      const a = t0 + i * stagger; const u = seg(t, a, a + dur);
      const y = drop * (1 - E.outBack(u, 1.4));
      const sq = squash(t, a + dur * 0.55, 0.1, 0.16);
      l.holder.position.y = u <= 0 ? -9999 : y;
      l.holder.scale.set(sq[0], sq[1] * clamp(u * 4), sq[0]);
      l.holder.visible = u > 0;
    });
  };
  const vis = (o, v) => { o.visible = v; return v; };

  // ------------------------------------------------------------ camera
  // One continuous path per act boundary (story-time keys, monotone Hermite: no speed jumps,
  // no overshoot). v3's framings are kept at every key; the hidden cuts that v3 covered with
  // iris wipes and flashes are now real camera moves.
  const podCam = (p, back) => { const dir = [Math.sin(p.g.rotation.y), 0, Math.cos(p.g.rotation.y)]; const o = p.g.position; return [[o.x + dir[0] * back, 190, o.z + dir[2] * back], [o.x + dir[0] * 10, 64, o.z + dir[2] * 10]]; }; // word sits above centre, lockup below
  const [sp, st] = podCam(P_S, 800), [up, ut] = podCam(P_U, 800), [ep, et] = podCam(P_E, 1080);
  const nameC = fieldC('name'), whereC = fieldC('where'), modelC = fieldC('model'), timeC = fieldC('time'), fileC = fieldC('file'), nextC = fieldC('next');
  // hand-off from Fabio's clip: the clip's last pan reaches the Todos Sabem pillar; the film's
  // camera picks it up mid-move (same framing and direction, still moving) and settles on the
  // pillar. 'pre' is a virtual key that only sets the camera's speed at the cut.
  // (solved from the clip's last frame: podium strip, the emblem's D and its gold ring line up on the cut)
  const HANDOFF = window.__handoff || {pre: [[-324.4, 413.8, 1518.1], [-191.4, 92.5, -184.3]], at: [[-301.6, 279.5, 842.3], [-410.5, 75.4, -284.1]], fov: 27};
  // v7: the pan settles a little high and wide on the pillar (spHi: the word sits clear below the
  // opening title, still up after the cut), drifts in while the title is read, then cranes down onto
  // the pillar's usual framing (sp) once the title has left, and the lockup rises
  const VU = st.map((x, i) => x - sp[i]).map((x, _, v) => x / Math.hypot(...v));
  const HI = window.__hi || [68, 90, 12]; // [raise, pull back, drift in] in world units
  const spHi = sp.map((x, i) => x - VU[i] * HI[1] + (i === 1 ? HI[0] : 0)), stHi = off3(st, [0, HI[0], 0]);
  const spHi2 = spHi.map((x, i) => x + VU[i] * HI[2]);
  const CAM_P = [
    [9.4, HANDOFF.pre[0]], [10, HANDOFF.at[0]], [10.9, spHi], [11.0, spHi2],
    [11.2, sp], [12.0, off3(sp, [15, 5, -20])], [12.9, [-30, 290, 1020]], [15.9, [70, 272, 700]], [18.6, [520, 900, 1350]], [20.6, [260, 460, 980]], [24, [0, 270, 900]],
    [24.9, up], [26.0, off3(up, [0, 4, -15])], [26.9, [-150, 225, 640]], [27.5, [-200, 215, 560]], [28.4, [-130, 195, 420]], [30.2, [0, 300, 920]],
    [31.4, [-175, 490, 640]], [35.2, [-170, 484, 620]], [36.4, [nameC[0] - 10, nameC[1] + 6, 360]], [37.4, [nameC[0] + 10, nameC[1], 350]],
    [38.2, [whereC[0] - 20, whereC[1] + 12, 350]], [42.3, [whereC[0] + 30, whereC[1] - 6, 330]], [43.2, [modelC[0] + 150, modelC[1] + 40, 760]], [46.4, [modelC[0] + 160, modelC[1] + 20, 690]],
    [47.3, [timeC[0] + 20, timeC[1] + 20, 380]], [48.4, [timeC[0] + 30, timeC[1] + 6, 360]], [49.4, [-170, 250, 800]], [53.6, [-190, 230, 700]],
    [54.6, [fileC[0] - 40, fileC[1] + 20, 400]], [55.5, [fileC[0] - 20, fileC[1] + 10, 380]], [56.4, [nextC[0] + 20, nextC[1] + 30, 420]], [57.2, [0, 330, 980]], [58.4, [0, 330, 820]],
    [62.0, off3(SL, [150, 190, 1260])], [62.9, ep], [63.7, off3(ep, [-8, 3, -12])], [65.2, [0, 520, 200]], [68.5, [-260, 560, 120]], [69.5, [0, 330, 1480]], [71.4, [-60, 300, 1330]],
    [72.6, [20, 215, 1080]], [73.5, [-40, 235, 1120]], [75.7, [-290, 290, 1220]], [77.3, [40, 420, 1150]], [78.8, [0, 540, 1700]], [82.2, [0, 760, 2250]],
  ];
  const CAM_T = [
    [9.4, HANDOFF.pre[1]], [10, HANDOFF.at[1]], [10.9, stHi], [11.0, stHi],
    [11.2, st], [12.0, st], [12.9, [0, 270, -120]], [15.9, [-40, 262, -120]], [18.6, [0, 300, -900]], [20.6, [0, 320, -1500]], [22.2, [0, 262, 300]], [24, [0, 262, 300]],
    [24.9, ut], [26.0, ut], [26.9, [0, 150, 80]], [27.5, [0, 152, 80]], [28.4, [0, 158, 80]], [30.2, [0, 320, -40]],
    [31.4, [-175, 476, -20]], [35.2, [-170, 476, -20]], [36.4, nameC], [37.4, nameC],
    [38.2, [whereC[0], whereC[1] - 20, whereC[2]]], [42.3, [whereC[0], whereC[1] - 24, whereC[2]]], [43.2, [modelC[0] + 170, modelC[1], 0]], [46.4, [modelC[0] + 150, modelC[1], 0]],
    [47.3, timeC], [48.4, timeC], [49.4, [-150, 170, 20]], [53.6, [-170, 160, 20]],
    [54.6, fileC], [55.5, fileC], [56.4, nextC], [57.2, [0, 330, -40]], [58.4, [0, 320, -200]],
    [62.0, off3(SL, [0, 20, 0])], [62.9, et], [63.7, et], [65.2, [0, 330, -2000]], [68.5, [60, 360, -2000]], [69.5, [0, 215, 60]], [71.4, [0, 225, 60]],
    [72.6, [0, 285, 60]], [73.5, [0, 280, 60]], [75.7, [0, 255, 60]], [77.3, [0, 250, -200]], [78.8, [0, 270, -400]], [82.2, [0, 320, -500]],
  ];
  // after the landing: rest on the slot, drift back, then a long, smooth pull-back that
  // reveals the Somos Exemplo pillar (replaces v3's iris cut); starts and ends at rest
  const LAND_P = [[60.2, off3(SL, [90, 110, 760])], [62.0, off3(SL, [150, 190, 1260])], [62.9, ep]];
  const LAND_T = [[60.2, off3(SL, [0, -10, -300])], [61.4, off3(SL, [0, 20, 0])], [62.0, off3(SL, [0, 20, 0])], [62.9, et]];
  // depth of field: aperture per shot, blended (x0.75 vs v3: more of each frame stays crisp)
  const APT = [[0, 3e-5], [3, 3e-5], [3.8, 1.4e-5], [10, 1.4e-5], [10.6, 1.6e-5], [16, 1.6e-5], [16.6, 8e-6], [20.6, 8e-6], [21.2, 1.6e-5], [24, 1.6e-5], [24.6, 2.2e-5],
    [58.2, 2.2e-5], [58.8, 1.2e-5], [62.0, 1.2e-5], [62.9, 1.4e-5], [64.5, 1.4e-5], [65.0, 7e-6], [68.8, 7e-6], [69.4, 1.2e-5], [76, 1.2e-5], [76.6, 1.6e-5]];
  const flight = (t) => {
    const from = new THREE.Vector3(...MODAL.c), mid = from.clone().lerp(slotPos, 0.5); mid.y += 520;
    return new THREE.QuadraticBezierCurve3(from, mid, slotPos);
  };
  const FLIGHT = flight();
  function camPose(t) {
    let P = path(CAM_P, t), T = path(CAM_T, t);
    // deep focus right after the cut from the clip (its frame is sharp front to back), then the film's lens
    const aperture = track(APT, t) * 0.75 * (t < 10.95 ? 0.3 + 0.7 * E.inOutSine(seg(t, 10.0, 10.95)) : 1);
    // the clip is pushed in (x1.12) at the cut: start narrower and ease back to the film's lens
    const fov = 30 + E.inOutSine(seg(t, 76.6, 82.2)) * 4 - (t < 10.95 ? (30 - HANDOFF.fov) * (1 - E.inOutSine(seg(t, 10.0, 10.95))) : 0);
    if (t > 58.3 && t < 60.2) {
      // fly-along: the camera rides behind the new card all the way to the library slot
      const u = E.inOutQuad(seg(t, 58.3, 60.2)), cp = FLIGHT.getPoint(u);
      const settle = E.inOutCubic(seg(t, 59.2, 60.2));
      const off = [lerp(0, 90, settle), lerp(90, 110, settle), lerp(520, 760, settle)];
      const follow = [cp.x + off[0], cp.y + off[1], cp.z + off[2]], look = [cp.x, cp.y - 10, cp.z - 300];
      const w0 = E.inOutCubic(seg(t, 58.3, 59.2)); // v6: a longer hand-off into the fly-along
      P = mixv(P, follow, w0); T = mixv(T, look, w0);
    } else if (t >= 60.2 && t < 62.9) { P = path(LAND_P, t); T = path(LAND_T, t); }
    return { P, T, fov, aperture };
  }
  // insert cameras (film clock): each starts and ends on the frozen story pose, at rest.
  // Shots frame a box of UI inside the frame's safe area (below the top bug, above the
  // subtitle plate): px per unit s fits the box in 1560x700 px, the box centre sits at y=500.
  const SAFE = { w: 1560, h: 700, dy: 40 }, PXU = 1080 / (2 * Math.tan(15 * deg)); // distance = PXU / s
  const INS_CAM = {};
  const uIns = (q, nt) => (nt - q.a) * q.k; // film time -> the insert's design clock
  const keysOf = (K) => ({ P: K.map(([u, v]) => [u, v[0]]), T: K.map(([u, v]) => [u, v[1]]) });
  const drift = ([P, T], f) => [P.map((x, i) => x + (T[i] - x) * f), T]; // a slow push-in during a hold
  {
    // FLOWS tour: boxes in screenshot px on the frame at its frozen pose (story 15.0)
    const q = INSERTS[0], b = camPose(q.at), fr = framePose(q.at), U = FW / SW;
    const fp = (px, py) => fr.localToWorld(scrLocal(px, py, 0)).toArray();
    const V = b.P.map((x, i) => x - b.T[i]), L = Math.hypot(...V), dir = V.map((x) => x / L);
    const box = (x0, y0, x1, y1) => { const sc = Math.min(SAFE.w / ((x1 - x0) * U), SAFE.h / ((y1 - y0) * U)), T = fp((x0 + x1) / 2, (y0 + y1) / 2 + SAFE.dy / (sc * U)); return [T.map((x, i) => x + dir[i] * PXU / sc), T]; };
    // v7: one framing per line of text, held (with a slow push-in) while it is read: Início (métodos
    // and skills), the Catálogo wide enough for the DTS filter, the DTS row and the breadcrumb, Início
    // again, the Biblioteca's scores; the moves happen as a line changes
    const home = box(260, 120, 1672, 520), catW = box(250, 0, 1650, 710), bib = box(290, 330, 1650, 940);
    INS_CAM.tour = keysOf([[0, [b.P, b.T]], [1.5, home], [3.7, drift(home, 0.012)], [4.8, catW], [7.5, drift(catW, 0.012)], [8.6, home], [9.1, drift(home, 0.006)],
      [10.3, bib], [12.85, drift(bib, 0.015)], [q.d, [b.P, b.T]]]);
  }
  // modal boxes (window CSS px): the modal faces +z; small offsets add a little parallax
  const mbox = (x0, y0, x1, y1, ox = 0, oy = 0) => { const U = MS, sc = Math.min(SAFE.w / ((x1 - x0) * U), SAFE.h / ((y1 - y0) * U)), T = mpt((x0 + x1) / 2, (y0 + y1) / 2 + SAFE.dy / (sc * U), 0); return [[T[0] + ox, T[1] + oy, T[2] + PXU / sc], T]; };
  {
    // name anatomy: the whole name, a slow truck from the prefix to the deliverable
    const q = INSERTS[1], b = camPose(q.at), NS = manifest._nameSegs, n = MR.name;
    const shot = (k) => { const [P, T] = mbox(n.x - 12, n.y - 30, n.x + n.w + 12, n.y + n.h + 70); const dx = k < 0 ? 0 : (NS[k].x + NS[k].w / 2 - (n.x + n.w / 2)) * MS * 0.22; return [[P[0] + dx, P[1], P[2]], [T[0] + dx, T[1], T[2]]]; };
    INS_CAM.name = keysOf([[0, [b.P, b.T]], [1.1, shot(0)], [2.8, shot(1)], [4.5, shot(2)], [5.6, shot(-1)], [q.d, [b.P, b.T]]]);
  }
  {
    // Detalhes: classification -> area -> people -> description -> button, then back
    const q = INSERTS[2], b = camPose(q.at);
    // v7 (k = 1): each field is framed as its line of text starts and held while it is filled and read
    INS_CAM.det = keysOf([[0, [b.P, b.T]], [1.4, mbox(31, 165, 569, 480, 16, 8)], [3.5, mbox(31, 175, 569, 485, 8, 6)], [4.35, mbox(31, 140, 569, 590, 0, 8)],
      [5.5, mbox(31, 142, 569, 592, 0, 6)], [6.6, mbox(31, 480, 569, 590, -8, 6)], [7.2, mbox(31, 482, 569, 592, -10, 6)], [8.1, mbox(31, 470, 569, 775, 8, 6)],
      [11.35, mbox(31, 475, 569, 780, 0, 4)], [12.35, mbox(31, 775, 569, 945, 0, -6)], [16.4, mbox(31, 780, 569, 945, 0, -6)], [17.35, mbox(20, 790, 580, 1015, 14, -8)],
      [18.6, mbox(20, 792, 580, 1017, 10, -8)], [q.d, [b.P, b.T]]]);
  }
  function poseAt(nt) {
    const pose = camPose(S(nt));
    for (const q of INSERTS) {
      if (nt > q.a && nt < q.b) { const c = INS_CAM[q.id], u = uIns(q, nt); pose.P = path(c.P, u); pose.T = path(c.T, u); }
      pose.aperture *= 1 - 0.5 * envl(nt, q.a - 0.4, q.a + 0.6, q.b - 0.6, q.b + 0.4, 'inOutSine', 'inOutSine');
    }
    return pose;
  }

  // ------------------------------------------------------------ modal texture state (pure)
  function modalState(t) {
    const NAME = 44;
    let img = 'm_empty';
    if (t > 31.2) img = `m_name_${String(Math.min(NAME, t < 32.6 ? Math.floor(seg(t, 31.4, 32.6) * 5.999) : 5 + Math.floor(seg(t, 32.6, 35.3) * 39))).padStart(2, '0')}`;
    if (t > 35.4) img = t < 36.2 ? 'm_name_44' : 'm_name_done'; // v5: the anatomy insert takes over at 36.9
    if (t > 37.5) img = 'm_where_0';
    if (t > 37.95) img = 'm_where_1'; if (t > 38.15) img = 'm_where_2'; if (t > 38.35) img = 'm_where_3';
    if (t > 38.7) img = 'm_where_dd'; if (t > 39.3) img = 'm_where_ddhi';
    if (t > 40.25) img = 'm_where_done'; if (t > 40.6 && t < 42.4) img = 'm_where_hint';
    if (t > 42.5) img = 'm_model_focus';
    if (t > 42.8 && t < 44.7) img = 'm_model_req'; // steady (v3 blinked it); v7: held with its callout
    if (t > 46.6) img = 'm_model_done';
    if (t > 47.25) img = 'm_time_0'; if (t > 47.45) img = 'm_time_1'; if (t > 47.65) img = 'm_time_2'; if (t > 47.85) img = 'm_time_3';
    if (t > 48.45) img = 'm_time_done';
    if (t > 49.0) img = 'm_zip';
    if (t > 54.55) img = 'm_zip_file';
    if (t > 56.55 && t < 56.8) img = 'm_next_press';
    if (t > 56.8) img = 'm_zip_file';
    return img;
  }
  // ---- inserts (film clock u = nt - insert start)
  const [I_TOUR, I_NAME, I_DET] = INSERTS;
  // v7: the insert schedules live in pace.js (SCHED), shared with the soundtrack
  const SN = SCHED.name, SD = SCHED.det, ST = SCHED.tour;
  const NAME_TL = SN.tl;
  const DET_TL = SD.tl.slice();
  for (const [pre, i0, i1, t0, dt, pad] of SD.typ) for (let i = i0; i <= i1; i++) DET_TL.push([t0 + (i - i0) * dt, pre + String(i).padStart(pad, '0')]);
  DET_TL.sort((x, y) => x[0] - y[0]);
  const stepTL = (tl, u) => { let v = tl[0][1]; for (const [a, n] of tl) if (u >= a) v = n; return v; };
  const DET_SC1 = 110;
  const detScroll = (u) => lerp(0, DET_SC1, E.inOutCubic(seg(u, ...SD.scroll[0]))) + (DSC - DET_SC1) * E.inOutCubic(seg(u, ...SD.scroll[1]));
  // what the modal shows: a baked state, or the composed Detalhes page (+ what it dissolves from)
  function modalPlan(t, nt) {
    if (nt >= I_NAME.a && nt <= I_NAME.b) return { img: stepTL(NAME_TL, uIns(I_NAME, nt)) };
    if (nt >= I_DET.a) {
      const u = Math.min(uIns(I_DET, nt), I_DET.d);
      const k = E.inOutSine(seg(u, 0.05, 0.45));
      return { det: true, img: nt > I_DET.b ? 'd_done' : stepTL(DET_TL, u), scroll: detScroll(u), under: k < 1 ? 'm_zip_file' : null, k };
    }
    return { img: modalState(t) };
  }
  // FLOWS tour: screen dissolves, highlight rings (screen px + envelope) and the cursor's path
  const TOUR_SCR = ST.scr;
  const tourScreen = (u) => { let cur = 'screen_inicio'; for (const [u0, u1, from, to] of TOUR_SCR) { if (u >= u1) cur = to; else if (u > u0) return [from, to, E.inOutSine(seg(u, u0, u1))]; } return [cur, null, 0]; };
  const TOUR_RINGS = ST.rings, TOUR_CUR = ST.cur, TOUR_CLK = ST.clk;
  // Detalhes: cursor in modal-window CSS px (the page scrolls under it)
  const DET_CUR = SD.cur, DET_CLK = SD.clk;
  const pressAt = (u, clk) => clk.reduce((m, c) => Math.max(m, pulse(u, c - 0.05, 0.05, 0.12)), 0);
  const tourCurPt = (u, dz = 16) => { const [px, py] = track(TOUR_CUR, u); return inicio.localToWorld(scrLocal(px, py, dz)).toArray(); };
  const detCurPt = (u, dz = 16) => { const [x, y] = track(DET_CUR, u); return mpt(x, y, dz); };

  // ------------------------------------------------------------ update
  function updateFilm(t, nt) {
    // ============ CAMERA (computed first: projections below depend on it)
    const { P, T, fov, aperture } = poseAt(nt);
    setCam(P, T, fov);
    const focusD = Math.hypot(T[0] - P[0], T[1] - P[1], T[2] - P[2]);

    // ============ ENVIRONMENT + act light (film clock)
    const fade = Math.max(1 - E.outQuad(seg(t, 0, 1.4)), E.inQuad(seg(t, 81.0, 82.2)));
    const lit = PILLAR_SEQ.map((q) => E.inOutSine(seg(nt, q.move[0] + 0.8, q.hold[0] + 0.2)) * (1 - E.inOutSine(seg(nt, q.hold[1] - 0.3, q.hold[1] + 1.8))));
    {
      const a = PILLAR_SEQ.map((q) => E.inOutSine(seg(nt, q.move[0], q.hold[0])));
      const col = new THREE.Color(ACCENT[0]).lerp(new THREE.Color(ACCENT[1]), a[1]).lerp(new THREE.Color(ACCENT[2]), a[2]);
      const amt = 0.28 * a[0] * (1 - E.inQuad(seg(t, 80.2, 82.2))) + 0.32 * Math.max(...lit) + 0.08 * lit[2];
      world.setAccent(col, amt);
      // the low golden backlight glints on the glossy plaza right beside Somos Exemplo: ease it down there
      world.sun.intensity = 1.5 * (1 - 0.65 * lit[2]);
    }
    const bloom = 0.38 + 0.06 * lit[2] + 0.04 * envl(t, 72.8, 73.2, 75.4, 76.0, 'inOutSine', 'inOutSine');
    const rays = 1 + 0.9 * lit[2];

    // ============ EMBLEM
    {
      const up1 = seg(t, 1.2, 1.9);
      let y = riseY(t, 1.2, 0.9, -240, 1.2);
      if (t > 11.55) y = sinkY(t, 11.55, 0.9, -300);
      if (t > 76.5) y = riseY(t, 76.5, 1.1, -300, 1.15);
      emblem.position.y = y; vis(emblem, t > 1.15 && !(t > 12.45 && t < 76.5));
      aoSet(aoEmb, emblem.visible ? y : 999, 0, 60);
      dts.letters.forEach((l, i) => {
        const a = 1.4 + i * 0.18; const u = seg(t, a, a + 0.7);
        const sq = squash(t, a + 0.42, 0.12, 0.2);
        let ly = 170 * (1 - E.outBack(u, 1.35)) - (u <= 0 ? 400 : 0);
        if (t > 76.5) { const a2 = 76.9 + i * 0.12; const u2 = seg(t, a2, a2 + 0.7); ly = u2 <= 0 ? 0 : Math.sin(u2 * Math.PI) * 22; }
        l.holder.position.y = ly + Math.sin(nt * 1.1 + i) * 2 * up1;
        l.holder.scale.set(sq[0], sq[1], sq[0]);
        l.holder.rotation.y = (1 - E.outCubic(u)) * 0.45 * (i - 1);
      });
    }
    // ============ PODIUMS + WORDS
    PILLARS.forEach((p, k) => {
      const t0 = 4.2 + k * 0.3;
      p.g.position.y = riseY(t, t0, 0.9, -200, 1.15);
      vis(p.g, t > t0);
      aoSet(aoPil[k], p.g.visible ? p.g.position.y : 999);
      if (k === 0) letterPop(p.word.letters, nt, -0.06, 0.05, 0.5, 60); // Todos Sabem: pops as the camera arrives, continuing the clip
      else if (k === 1) letterPop(p.word.letters, nt, 0.3, 0.05, 0.5, 60); // Todos Usam wakes up right after (it is hidden behind the emblem's glow at the cut)
      else letterPop(p.word.letters, t, t0 + 0.6, 0.06, 0.6, 60);
      const L = lit[k], end = t > 76.7 ? E.outCubic(seg(t, 76.7 + k * 0.25, 77.5 + k * 0.25)) : 0;
      const glow = 0.8 + L * (k === 2 ? 3.2 : 2.3) + end * 1.4 + (t > 4.5 && t < 7.5 ? pulse(t, t0 + 0.9, 0.08, 0.6) * 1.2 : 0);
      // Todos Usam sits behind the emblem's glow at the cut (the clip has no pillar there): its strip lights up a beat later
      p.pod.userData.strip.material.emissiveIntensity = (1.2 + glow) * (k === 1 && nt < 1.2 ? 0.15 + 0.85 * E.inOutSine(seg(nt, 0.25, 1.2)) : 1);
      p.light.intensity = Math.max(0, glow - 0.8) * (k === 2 ? 2200 : 1800); p.light.visible = p.light.intensity > 20;
      // as the camera settles, a glint of light travels once across the letters, then they stay softly lit
      const g0 = PILLAR_SEQ[k].hold[0] - 0.35;
      p.word.letters.forEach((l, i) => { const x = (nt - (g0 + i * 0.07)) / 0.24; l.face.emissiveIntensity = L * (0.1 + Math.exp(-x * x) * 0.7) + end * 0.12; });
      p.halo.material.uniforms.uA.value = L * (k === 2 ? 1.0 : 0.45); p.halo.material.uniforms.uT.value = nt; p.halo.visible = L > 0.005;
    });
    // golden motes rise around Somos Exemplo during its moment
    {
      const L = lit[2]; motes.visible = L > 0.01;
      if (motes.visible) {
        const a = motes.geometry.attributes, o = P_E.g.position;
        moteSeeds.forEach((m, i) => {
          const y = (m.y0 + nt * m.v) % 460, ang = m.a + nt * 0.04;
          a.position.array.set([o.x + Math.cos(ang) * m.r, 16 + y, o.z + 70 + Math.sin(ang) * m.r * 0.55], i * 3);
          a.a.array[i] = L * Math.sin(Math.PI * y / 460) * (0.65 + 0.35 * Math.sin(nt * 1.1 + m.ph));
        });
        a.position.needsUpdate = true; a.a.needsUpdate = true;
      }
    }

    // ============ TODOS SABEM: Início frame + ring wave + hero cards
    {
      // rises once the camera has turned toward it (v3: 11.9, while the pillar was still framed)
      const on = t > 12.3 && t < 16.8;
      vis(inicio, on);
      if (on) {
        const y = 285 + riseY(t, 12.3, 0.95, -420, 1.15) - (t > 15.9 ? E.inBack(seg(t, 15.9, 16.7), 1.2) * 520 : 0);
        inicio.position.set(0, y, -120); inicio.rotation.set(-0.04 + Math.sin(t * 0.8) * 0.01, Math.sin(t * 0.5) * 0.03, 0);
        inicio.updateMatrixWorld(true);
        // the tour (insert 1): Início -> Catálogo de Métodos -> Início -> Biblioteca de Skills
        const u = uIns(I_TOUR, nt), inTour = u > 0 && nt < I_TOUR.b;
        const [a, b, k] = nt >= I_TOUR.b ? ['screen_biblioteca', null, 0] : u > 0 ? tourScreen(u) : ['screen_inicio', null, 0];
        drawScreen(a, b, k, inTour ? TOUR_RINGS.map(([r, e]) => [...r, envl(u, ...e, 'inOutSine', 'inOutSine')]) : []);
      }
      // wave around the ring: tiles lean toward the center and glow as the counter runs
      for (let i = 0; i < ring.N; i++) {
        const sl = ring.slots[i];
        const da = Math.abs(((sl.a + Math.PI) % (2 * Math.PI)) - Math.PI) / Math.PI;
        const tt = 16.2 + da * 2.6 + sl.r * 0.05;
        const wv = pulse(t, tt, 0.16, 0.4);
        let glow = wv * 0.7, lift = wv * 42;
        if (t > 60.2 && t < 62.5) { const d = sl.pos.distanceTo(slotPos); const w2 = pulse(t, 60.2 + d / 2600, 0.08, 0.34); glow += w2 * 0.7; lift += w2 * 22; }
        ring.set(i, 1, lift, glow);
      }
      heroCards.forEach((c, k) => {
        const t0 = 20.7 + k * 0.18, t1 = 23.3 + k * 0.08;
        const on2 = t > t0 && t < t1 + 0.8; vis(c, on2);
        if (!on2) return;
        const from = [(k - 1) * 700, 330, -2150], to = [(k - 1) * 290, 262, 300];
        const u = E.inOutCubic(seg(t, t0, t0 + 1.2));
        const out = E.inBack(seg(t, t1, t1 + 0.7), 1.2);
        const p = mixv(from, to, u); p[1] += Math.sin(u * Math.PI) * 150 - out * 60; p[2] -= out * 900;
        c.position.set(...p);
        c.rotation.set(0, (1 - u) * Math.PI * (k - 1) * 0.5 + Math.sin(t * 1.3 + k) * 0.04, (1 - u) * 0.25 * (k - 1));
        c.scale.setScalar(1 - out * 0.5);
      });
    }

    // ============ STEP PROPS
    // Passo 1: pedestal + capsule button + cursor press
    {
      const on = t > 26.3 && t < 31.2; vis(btnPed, on); vis(btn, on);
      if (!on) aoBtn.visible = false;
      if (on) {
        const y = riseY(t, 26.35, 0.9, -300, 1.2) + (t > 30.2 ? sinkY(t, 30.2, 0.8, -300) : 0);
        btnPed.position.set(0, y, 80);
        aoSet(aoBtn, y, 0, 80);
        const press = pulse(t, 28.0, 0.06, 0.3), sq = squash(t, 28.02, 0.12, 0.2);
        btn.position.set(0, y + 110 + 50 - press * 12 + Math.sin(t * 2.2) * 1.5, 80);
        btn.rotation.set(-0.32, Math.sin(t * 0.9) * 0.04, 0);
        btn.scale.set(sq[0], sq[1], sq[0]);
        btn.userData.cap.material.emissive.setHex(0xff7a00); btn.userData.cap.material.emissiveIntensity = press * 1.2;
      }
      shock.visible = t > 28.0 && t < 29.4;
      if (shock.visible) { const u = E.outCubic(seg(t, 28.0, 29.3)); shock.position.set(0, 2, 80); shock.scale.setScalar(0.6 + u * 3.6); shock.material.opacity = (1 - u) * 0.8; }
    }
    // Cursor (Passo 1 press + Passo 6 Próximo)
    {
      let on = false, p = [0, 0, 0], rotZ = 0.25;
      if (t > 26.6 && t < 29.0) {
        on = true;
        const u = E.inOutCubic(seg(t, 26.6, 27.9)), press = pulse(t, 27.95, 0.06, 0.25);
        p = mixv([160, 420, 260], [30, 228, 128], u); p[1] -= press * 14; p[2] -= press * 7;
        if (t > 28.4) { const w = E.inCubic(seg(t, 28.4, 29.0)); p = mixv(p, [260, 520, 300], w); }
      } else if (t > 55.6 && t < 57.2) {
        on = true;
        const nc = fieldC('next', 30);
        const u = E.inOutCubic(seg(t, 55.6, 56.5)), press = pulse(t, 56.55, 0.06, 0.25);
        p = mixv([nc[0] + 190, nc[1] - 120, nc[2] + 220], [nc[0] + 6, nc[1] - 4, nc[2] + 14], u); p[2] -= press * 9;
        if (t > 56.8) { const w = E.inCubic(seg(t, 56.8, 57.2)); p = mixv(p, [nc[0] + 240, nc[1] - 160, nc[2] + 260], w); }
        rotZ = 0.2;
      }
      let sc = 1.25;
      // inserts: the cursor visits the FLOWS screens (tour) and the Detalhes fields
      const [tv0, tv1, tv2, tv3] = ST.curVis, [dv0, dv1, dv2, dv3] = SD.curVis;
      if (uIns(I_TOUR, nt) > tv0 && uIns(I_TOUR, nt) < tv3 && nt < I_TOUR.b) {
        const u = uIns(I_TOUR, nt); on = true; rotZ = 0.22;
        p = tourCurPt(u, 16 - pressAt(u, TOUR_CLK) * 8);
        sc = 1.0 * E.outBack(seg(u, tv0, tv1), 1.4) * (1 - E.inBack(seg(u, tv2, tv3), 1.2));
      } else if (uIns(I_DET, nt) > dv0 && uIns(I_DET, nt) < dv3 && nt < I_DET.b) {
        const u = uIns(I_DET, nt); on = true; rotZ = 0.2;
        p = detCurPt(u, 16 - pressAt(u, DET_CLK) * 8);
        sc = 0.9 * E.outBack(seg(u, dv0, dv1), 1.4) * (1 - E.inBack(seg(u, dv2, dv3), 1.2));
      }
      vis(cursor, on && sc > 0.01);
      if (on) { cursor.position.set(...p); cursor.rotation.set(-0.35, 0.3, rotZ); cursor.scale.setScalar(Math.max(0.001, sc)); }
    }
    // modal frame lifecycle
    {
      let mScale = E.outBack(seg(t, 28.6, 29.9), 1.15);
      const mPos = mixv([0, 190, 80], MODAL.c, E.outCubic(seg(t, 28.6, 29.7)));
      let mRotY = (1 - E.outCubic(seg(t, 28.6, 29.8))) * Math.PI * 0.5;
      const fold = E.inOutCubic(seg(t, 57.4, 58.2));
      if (t > 57.4) { mScale = lerp(1, 172 / MODAL.w, fold); mRotY = fold * Math.PI * 2; }
      const on = t > 28.6 && t < 58.0;
      vis(modal, on);
      modal.position.set(mPos[0], mPos[1] + Math.sin(t * 0.7) * 1.5, mPos[2]);
      modal.rotation.set(0, mRotY, 0);
      modal.scale.setScalar(Math.max(0.001, mScale));
      const plan = modalPlan(t, nt);
      if (plan.det) { useMap(mCanvasTex); composeDet(plan.img, plan.scroll, plan.under, plan.k); }
      else { useMap(modalTex); if (plan.img !== modalImg && imgs[plan.img]) { modalTex.image = imgs[plan.img]; modalTex.needsUpdate = true; modalImg = plan.img; } }
    }
    // keycaps (Passo 2)
    keys.forEach((k, i) => {
      const t0 = 30.9 + i * 0.07, on = t > t0 && t < 36.4; vis(k, on);
      if (!on) return;
      const base = [-404 + i * 58, 438, 24];
      const inU = E.outBack(seg(t, t0, t0 + 0.55), 1.3), outU = E.inBack(seg(t, 35.8 + i * 0.05, 36.3 + i * 0.05), 1.2);
      const pressT = 31.4 + (i + 1) * 0.24 - 0.12;
      const pr = pulse(t, pressT, 0.04, 0.16);
      k.position.set(base[0], base[1] - (1 - inU) * 200 - outU * 260 - pr * 14 + Math.sin(t * 2 + i) * 2, base[2]);
      k.rotation.set(1.05, 0.25, 0);
      const sq = squash(t, pressT, 0.1, 0.14); k.scale.set(sq[0], sq[1], sq[0]);
      k.userData.cap.material.emissive.setHex(0xff8a1f); k.userData.cap.material.emissiveIntensity = pr * 0.7;
    });
    // chip Flows / Claude (Passo 3)
    {
      const on = t > 39.85 && t < 40.4; vis(chip, on);
      if (on) { const u = E.inOutCubic(seg(t, 39.85, 40.3)); const a = mpt(130, MR.where.y + 100, 26), b = fieldC('where', -170); b[2] += 10; const p = mixv(a, b, u); p[1] += Math.sin(u * Math.PI) * 24; chip.position.set(...p); chip.rotation.set(0, 0, (1 - u) * 0.12); chip.scale.setScalar(1 - u * 0.35); }
    }
    // model drum (Passo 4): one and a quarter calm turns, then the choice flies to the field
    {
      const on = t > 43.1 && t < 47.3; vis(drum, on);
      if (on) {
        const mc = fieldC('model');
        const y = mc[1] + riseY(t, 43.1, 0.8, -340, 1.15) + (t > 46.6 ? sinkY(t, 46.6, 0.7, -420) : 0);
        const aSel = (SEL / drum.userData.n) * Math.PI * 2;
        const spin = E.inOutCubic(seg(t, 43.7, 45.9));
        drum.position.set(mc[0] + 350, y, 10);
        drum.rotation.x = aSel + (1 - spin) * Math.PI * 2 * 1.25;
        drum.userData.slats.forEach((s, i) => {
          const sel = i === SEL && t > 45.9;
          s.body.material.emissive.setHex(0xffb347); s.body.material.emissiveIntensity = sel ? 0.3 + pulse(t, 45.9, 0.08, 0.45) * 0.7 : 0;
          const fly = sel ? E.inOutCubic(seg(t, 46.15, 46.6)) : 0;
          s.s.visible = !(sel && t > 46.58);
          if (sel) { const tgtW = fieldC('model', -60); const loc = drum.worldToLocal(new THREE.Vector3(tgtW[0], tgtW[1], tgtW[2] + 12)); const home = new THREE.Vector3(0, Math.sin(s.a) * 92, Math.cos(s.a) * 92); s.s.position.lerpVectors(home, loc, fly); s.s.scale.setScalar(1 - fly * 0.35); }
          else { s.s.position.set(0, Math.sin(s.a) * 92, Math.cos(s.a) * 92); s.s.scale.setScalar(1); }
        });
      }
    }
    // box + files (Passo 5)
    {
      const on = t > 48.6 && t < 54.7; vis(boxPed, on); vis(box, on);
      if (!on) aoBox.visible = false;
      const bp = [-330, 0, 70];
      if (on) {
        const y = riseY(t, 48.6, 0.9, -300, 1.2);
        boxPed.position.set(bp[0], y, bp[2]);
        aoSet(aoBox, y, bp[0], bp[2]);
        let land = 0; for (let i = 0; i < 6; i++) land += pulse(t, 50.35 + i * 0.5, 0.04, 0.14);
        const close = E.inOutCubic(seg(t, 52.9, 53.5));
        const sqc = squash(t, 53.5, 0.1, 0.2);
        const fly = E.inOutCubic(seg(t, 54.0, 54.6));
        const fc = fieldC('file', -150);
        const p = mixv([bp[0], y + 90, bp[2]], [fc[0], fc[1] - 20, fc[2] + 10], fly);
        box.position.set(p[0], p[1] - land * 3.5, p[2]);
        box.rotation.set(0, 0.45 + Math.sin(t * 0.8) * 0.04 - fly * 0.45, 0);
        const s = 1 - fly * 0.72;
        box.scale.set(s * sqc[0] * (1 + land * 0.035), s * sqc[1] * (1 - land * 0.04), s * sqc[0] * (1 + land * 0.035));
        box.userData.flaps.forEach((f) => { f.hinge.rotation.x = f.sgn * lerp(-2.05, 0, close); });
        box.userData.tape.visible = t > 53.55;
      }
      files.forEach((f, i) => {
        const t0 = 49.8 + i * 0.5, t1 = t0 + 0.6; const on2 = t > t0 && t < t1 + 0.04; vis(f, on2);
        if (!on2) return;
        const u = E.inOutSine(seg(t, t0, t1));
        const a = [380 + (i % 3) * 30, 150 + (i % 2) * 90, 120], b = [bp[0], 120 + 60, bp[2]];
        const m = mixv(a, b, 0.5); m[1] += 240;
        const q = (x, y, z, uu) => x.map((_, k) => (1 - uu) * (1 - uu) * x[k] + 2 * (1 - uu) * uu * y[k] + uu * uu * z[k]);
        f.position.set(...q(a, m, b, u)); f.rotation.set(u * 1.0, (1 - u) * 2.0, (1 - u) * 0.5); f.scale.setScalar(1 - u * 0.35);
      });
    }
    // new card: born from the folded modal, flies into the ring slot
    {
      const on = t > 57.95 && t < 81.2; vis(newCard, on);
      newCard.userData.mbHold = t > 58.2 && t < 60.8;
      if (on) {
        const u = E.inOutQuad(seg(t, 58.3, 60.2));
        const p = FLIGHT.getPoint(u);
        newCard.position.copy(p);
        const qq = new THREE.Quaternion().slerp(slotQ.clone(), E.inOutCubic(seg(t, 58.3, 60.0)));
        newCard.quaternion.copy(qq);
        newCard.rotateZ(Math.sin(u * Math.PI) * 0.28);
        const s0 = MODAL.w / 172;
        newCard.scale.setScalar(t < 58.3 ? lerp(s0 * 0.5, s0, E.outBack(seg(t, 57.95, 58.3), 1.2)) : lerp(s0, 1, E.inOutQuad(seg(t, 58.3, 60.2))));
        const g = pulse(t, 60.2, 0.1, 1.3) * 0.8 + (t > 64 && t < 70 ? 0.45 + 0.1 * Math.sin(nt * 1.6) : 0);
        newCard.userData.face.material.color.setScalar(1 + Math.min(g, 1) * 0.16);
        newCard.userData.body.material.emissive.setHex(0xffb347); newCard.userData.body.material.emissiveIntensity = Math.min(g, 1.2) * 1.2;
        if (u > 0.01 && u < 1) {
          const n = 60; trail.geometry.attributes.position.array.fill(0);
          for (let k = 0; k < n; k++) { const uu = Math.max(0, u - k * 0.006); const pp = FLIGHT.getPoint(uu); trail.geometry.attributes.position.array.set([pp.x, pp.y, pp.z], k * 3); trail.geometry.attributes.a.array[k] = (1 - k / n) * 0.8; }
          trail.geometry.attributes.position.needsUpdate = true; trail.geometry.attributes.a.needsUpdate = true; trail.visible = true;
        } else trail.visible = false;
      } else trail.visible = false;
    }
    // sparks (fewer and softer than v3)
    {
      const arr = { pos: sparks.geometry.attributes.position.array, a: sparks.geometry.attributes.a.array, i: 0, n: 200 };
      arr.a.fill(0);
      burst(arr, t, 28.0, [0, 190, 90], { n: 24, seed: 3, speed: 240 });
      burst(arr, t, 53.7, [-330, 230, 70], { n: 16, seed: 7, speed: 170 });
      burst(arr, t, 57.95, [0, 330, -20], { n: 24, seed: 9, speed: 210 });
      burst(arr, t, 60.2, [slotPos.x, slotPos.y, slotPos.z + 20], { n: 44, seed: 11, speed: 340, life: 1.5 });
      burst(arr, t, 1.9, [0, 60, 60], { n: 18, seed: 13, speed: 190, life: 0.9 });
      podium.update(t, arr, burst);
      sparks.geometry.attributes.position.needsUpdate = true; sparks.geometry.attributes.a.needsUpdate = true;
    }
    // threads of reuse (Somos Exemplo)
    threads.forEach((th) => {
      const t0 = 64.4 + th.userData.delay, u = E.inOutCubic(seg(t, t0, t0 + 1.4));
      th.visible = t > t0 && t < 81.2;
      th.material.uniforms.uP.value = u; th.material.uniforms.uA.value = 0.62 + 0.14 * Math.sin(nt * 1.3 + th.userData.delay * 7);
      if (u >= 1) { const i = th.userData.tile; const g = pulse(t, t0 + 1.4, 0.08, 0.9) * 1.0 + 0.25; ring.set(i, 1, g * 24, g); }
    });
    ring.commit();

    // ============ HUD
    const hudIn = E.outCubic(seg(t, 7.4, 8.2)) * (1 - E.inCubic(seg(t, 77.7, 78.3)));
    bug.style.opacity = hudIn; pillBox.style.opacity = hudIn;
    bars.set(t < 0 ? 1 : (1 - E.inOutCubic(seg(t, 1.2, 2.3))) + E.inOutCubic(seg(t, 77.7, 78.5)));
    // pills: the active pillar lights up (film clock) and fills as its act plays (story clock)
    {
      const ON = [[PILLAR_SEQ[0].hold[0] - 0.2, PILLAR_SEQ[1].move[0] + 1.4], [PILLAR_SEQ[1].hold[0] - 0.2, PILLAR_SEQ[2].move[0] + 2.2], [PILLAR_SEQ[2].hold[0] - 0.2, 1e9]];
      pills.forEach((p, k) => {
        p.style.setProperty('--on', envl(nt, ON[k][0], ON[k][0] + 0.9, ON[k][1], ON[k][1] + 0.9, 'inOutSine', 'inOutSine').toFixed(3));
        pillFill[k].style.width = `${(k === 0 ? seg(t, 10.6, 24) : k === 1 ? seg(t, 25.1, 62) : seg(t, 63.1, 77.5)) * 100}%`;
      });
    }
    // pillar lockup: kicker, a drawn rule and the pillar's line; still while it is read
    {
      let k = -1; PILLAR_SEQ.forEach((q, i) => { if (nt > q.hold[0] - 0.65 && nt < q.hold[1] + 0.35) k = i; });
      if (!MG.vis(lock, k >= 0) || k < 0) { /* hidden */ } else {
        const q = PILLAR_SEQ[k], a = q.hold[0] - 0.6, b = q.hold[1] - 0.3; // v7: up as the camera settles, read through the hold
        if (lock.dataset.k !== String(k)) { lock.dataset.k = String(k); lkK.textContent = LOCK[k][0]; lkD.textContent = LOCK[k][1]; lock.style.setProperty('--c', LOCK[k][2]); lock.style.setProperty('--c2', LOCK[k][3]); lock.classList.toggle('hero', k === 2); }
        rise(lkK, E.outCubic(seg(nt, a, a + 0.75)));
        lkLn.style.width = `${E.inOutCubic(seg(nt, a + 0.3, a + 1.2)) * (k === 2 ? 320 : 240)}px`;
        rise(lkD, E.outCubic(seg(nt, a + 0.5, a + 1.35)));
        lock.style.opacity = (1 - E.inOutSine(seg(nt, b, b + 0.6))).toFixed(3);
      }
    }
    tracker.set(t, envl(t, 25.8, 26.4, 61.6, 62.1) * hudIn);
    // focus frame: brackets track the active field and glide to the next one (step 1 on the
    // story clock; the Detalhes page on the insert clock, following its scroll)
    {
      const proj = (x0, y0, x1, y1) => MG.rectOf([project(mpt(x0, y0)), project(mpt(x1, y0)), project(mpt(x0, y1)), project(mpt(x1, y1))]);
      const fr = (f) => { const r = MR[f]; return proj(r.x, r.y, r.x + r.w, r.y + r.h); };
      const run = (list, time, rectOf) => {
        const i = list.findIndex(([, a, b]) => time >= a && time < b);
        if (i >= 0) {
          const [f, a, b] = list[i];
          let rect = rectOf(f), k = 1;
          const prev = list[i - 1], ch = prev && a - prev[2] < 0.6;
          const u = seg(time, a, a + 0.45);
          if (ch && u < 1) rect = MG.lerpRect(rectOf(prev[0]), rect, E.inOutCubic(u));
          else k = 1 + (1 - E.outCubic(seg(time, a, a + 0.45))) * 0.35;
          const next = list[i + 1], chN = next && next[1] - b < 0.6;
          return [rect, (ch ? 1 : E.outCubic(seg(time, a, a + 0.35))) * (chN ? 1 : 1 - seg(time, b - 0.25, b)), k];
        }
        const j = list.findIndex(([, , b], n) => list[n + 1] && time >= b && time < list[n + 1][1] && list[n + 1][1] - b < 0.6);
        return j >= 0 ? [rectOf(list[j][0]), 1, 1] : null;
      };
      let res;
      if (nt > I_DET.a && nt < I_DET.b) {
        const u = uIns(I_DET, nt), sc = detScroll(u);
        res = run(DFOCUS, u, (names) => { const rs = names.map((n) => detRect(n, sc)); return proj(Math.min(...rs.map((r) => r.x)), Math.min(...rs.map((r) => r.y)), Math.max(...rs.map((r) => r.x + r.w)), Math.max(...rs.map((r) => r.y + r.h))); });
      } else {
        res = run(FOCUS, t, fr);
        if (res && nt > I_NAME.a - 0.3 && nt < I_NAME.b + 0.3) res[1] *= 1 - 0.7 * envl(nt, I_NAME.a - 0.3, I_NAME.a + 0.2, I_NAME.b - 0.2, I_NAME.b + 0.3, 'inOutSine', 'inOutSine');
      }
      if (res) focus.set(res[0], res[1] * hudIn, res[2]); else focus.set(null, 0);
    }
    // name anatomy (insert 2): a label under each part of the name, one at a time, then all
    {
      const u = uIns(I_NAME, nt), on = u > 0.1 && nt < I_NAME.b;
      const NS = manifest._nameSegs, T0 = SN.t0, out = 1 - E.inOutSine(seg(u, SN.out[0], SN.out[1]));
      // a soft spotlight on the name field; the labels sit on the dimmed page
      const so = on ? envl(u, ...SN.spot, 'inOutSine', 'inOutSine') : 0;
      if (MG.vis(spot, so > 0.01)) {
        const n = MR.name, r = MG.rectOf([project(mpt(n.x, n.y)), project(mpt(n.x + n.w, n.y)), project(mpt(n.x, n.y + n.h)), project(mpt(n.x + n.w, n.y + n.h))]);
        spotHole.setAttribute('x', r.x0 - 16); spotHole.setAttribute('y', r.y0 - 16); spotHole.setAttribute('width', r.x1 - r.x0 + 32); spotHole.setAttribute('height', r.y1 - r.y0 + 32); spot.style.opacity = so.toFixed(3);
      }
      segLbl.forEach((el, k) => {
        const a = E.outCubic(seg(u, T0[k], T0[k] + 0.4)), dim = u < SN.all && k < 2 && u > T0[k + 1];
        const o = on ? a * out : 0;
        el.style.filter = dim ? 'saturate(.35) brightness(.72)' : '';
        const r = NS[k], top = project(mpt(r.x + r.w / 2, r.y + r.h + 4)), bot = project(mpt(r.x + r.w / 2, MR.name.y + MR.name.h + 6));
        show(el, o, top.x, bot.y + 30 + (1 - a) * 12, 0.5, 0, 1);
        segPath[k].setAttribute('d', `M${top.x},${top.y} V${bot.y + 30}`); segPath[k].style.opacity = o;
      });
      MG.vis(segLn, on);
    }
    // click ripple where the cursor clicks (inserts)
    {
      let o = 0, x = 0, y = 0, r = 0;
      for (const [q, list, pt] of [[I_TOUR, TOUR_CLK, tourCurPt], [I_DET, DET_CLK, detCurPt]]) for (const c of list) {
        const d = uIns(q, nt) - c;
        if (d >= 0 && d < 0.5) { const p = project(pt(c, 10)); x = p.x; y = p.y; r = d / 0.5; o = 1 - r; }
      }
      if (MG.vis(clk, o > 0.01)) { clk.style.opacity = E.outQuad(o).toFixed(3); clk.style.transform = `translate(${x}px,${y}px) scale(${(0.35 + E.outCubic(r) * 1.15).toFixed(3)})`; }
    }
    // subtitles (film clock): the line rises out of a mask; key terms get a drawn underline.
    // Chained lines (one ends where the next begins) keep the plate up and swap the text.
    {
      let ci = -1; SUBS.forEach((x, i) => { if (nt >= x.a && nt < x.b) ci = i; });
      const cur = ci >= 0 ? SUBS[ci] : null, prv = ci > 0 ? SUBS[ci - 1] : null, nxt = ci >= 0 ? SUBS[ci + 1] : null;
      const cIn = chained(prv, cur), cOut = chained(cur, nxt);
      const key = cur ? cur.s : '';
      if (key !== subKey) { subKey = key; subIn.innerHTML = key.replace(/\*([^*]+)\*/g, '<b class="hl">$1</b>'); subK.textContent = cur ? cur.k : ''; subK.style.display = cur && cur.k ? '' : 'none'; }
      let sv = 0;
      if (cur) {
        subS.style.setProperty('--hl', HLC[cur.c]);
        const u = E.outCubic(seg(nt, cur.a, cur.a + 0.6)), o = 1 - E.inCubic(seg(nt, cur.b - 0.3, cur.b));
        rise(subIn, u); subIn.style.opacity = cOut ? (1 - E.inCubic(seg(nt, cur.b - 0.22, cur.b))).toFixed(3) : 1;
        sv = Math.min(cIn ? 1 : E.outCubic(seg(nt, cur.a, cur.a + 0.35)), cOut ? 1 : o); MG.vis(subP, true); subP.style.opacity = sv;
        subIn.querySelectorAll('.hl').forEach((h, i) => { const a = cur.ul && cur.ul[i] !== undefined ? cur.ul[i] : cur.a + 0.55 + i * 0.3; h.style.backgroundSize = `${(E.inOutCubic(seg(nt, a, a + 0.7)) * 100).toFixed(1)}% 3px`; });
        const kSame = cIn && prv.k === cur.k && cur.k;
        subK.style.opacity = (kSame ? 1 : E.outCubic(seg(nt, cur.a, cur.a + 0.5))) * (cOut && nxt.k === cur.k ? 1 : cOut ? 1 - seg(nt, cur.b - 0.22, cur.b) : o);
      } else MG.vis(subP, false);
      band.style.opacity = 0.6 + 0.4 * sv;
    }
    // opening typography
    show(tDts, envl(t, 2.5, 3.2, 4.4, 5.0), 0, 0);
    tDts.style.letterSpacing = `${0.42 + (1 - E.outCubic(seg(t, 2.5, 4.2))) * 0.28}em`;
    {
      const on = t > 6.8 && t < 9.35; hOpen.style.display = on ? '' : 'none';
      if (on) { hOpen.style.opacity = 1 - E.inCubic(seg(t, 8.95, 9.35)); hOpenW.forEach((w, i) => rise(w, E.outCubic(seg(t, 6.8 + i * 0.08, 7.4 + i * 0.08)))); }
    }
    show(tOpen, envl(t, 7.5, 8.1, 8.95, 9.35), 0, (1 - E.outCubic(seg(t, 7.5, 8.1))) * 10);
    show(hBd, envl(t, 6.6, 7.4, 8.95, 9.4, 'inOutSine', 'inOutSine'), 0, 0);
    // counters (441 and 442): the number counts up calmly under a drawn gold rule
    {
      let o = 0, n = 0, lbl = '', icn = '', t0 = 0;
      if (t > 16.6 && t < 20.4) { o = envl(t, 16.6, 17.1, 19.9, 20.4); n = Math.round(441 * E.outCubic(seg(t, 16.7, 19.3))); lbl = 'skills prontas para <b>reuso</b>'; icn = 'library'; t0 = 16.6; }
      if (t > 60.25 && t < 62.25) { o = envl(t, 60.25, 60.55, 61.9, 62.25); n = 442; lbl = '<b>+1</b> skill de DTS na Biblioteca'; icn = 'sparkles'; t0 = 60.25; }
      show(kC, o, 0, (t > 60 ? -60 : 0) + (1 - o) * 14);
      if (o > 0) {
        kCBig.textContent = n; if (kCLbl.innerHTML !== lbl) kCLbl.innerHTML = lbl;
        if (kIc.dataset.n !== icn) { kIc.innerHTML = MG.ico(icn, '', 1.6); kIc.dataset.n = icn; }
        kIc.style.opacity = E.outCubic(seg(t, t0 + 0.1, t0 + 0.7));
        kL.style.width = `${E.inOutCubic(seg(t, t0 + 0.2, t0 + 1.0)) * 180}px`;
      }
    }
    // callouts anchored to 3D points (soft fade and rise)
    {
      const pop = (el, o, x, y, ax = 0, ay = 0) => show(el, o, x, y + (1 - o) * 8, ax, ay, 0.96 + 0.04 * o);
      const wh = project(mpt(MR.where.x + 60, MR.where.y + MR.where.h + 40));
      pop(cWhere, envl(t, 40.55, 40.95, 42.15, 42.45), wh.x - 36, wh.y + 22);
      const rq = project(mpt(MR.model.x + 128, MR.model.y - 14));
      pop(cReq, envl(t, 42.75, 43.15, 44.7, 45.1), rq.x + 18, rq.y, 0, 0.5);
      const tm = project(mpt(MR.time.x + 60, MR.time.y + MR.time.h + 6));
      pop(cOpt, envl(t, 47.3, 47.65, 48.75, 49.1), tm.x - 36, tm.y + 22);
      const rb = project([-330, 215, 70]);
      pop(cRoot, envl(t, 50.3, 50.7, 52.4, 52.8), rb.x, rb.y - 40, 0.5, 1);
    }
    // ranking (Somos Exemplo): header chips, Nº 1 plate with a drawn connector, stats
    {
      const hOn = envl(t, 69.1, 69.6, 75.7, 76.1);
      show(pdHead, hOn, 0, 0);
      pdHead.querySelectorAll('span').forEach((sp2, i) => { const u = E.outCubic(seg(t, 69.1 + i * 0.25, 69.7 + i * 0.25)); sp2.style.opacity = u; sp2.style.transform = `translateY(${(1 - u) * -10}px)`; });
      const sx = 1480, sy = 268;
      const so = envl(t, 73.0, 73.4, 75.7, 76.1), sIn = E.outCubic(seg(t, 73.0, 73.55));
      show(pdStamp, so, sx, sy, 0.5, 0.5, lerp(1.07, 1, sIn));
      { const cr = project(podium.cardPt(1, 0.92, 0.1)); const u = E.inOutCubic(seg(t, 73.35, 74.05)) * so;
        MG.vis(pdLink, u > 0.01); if (u > 0.01) { const x0 = sx - 150, y0 = sy + 40; pdLink.querySelector('path').setAttribute('d', `M${x0},${y0} C${x0 - 60},${y0 + 90} ${cr.x + 80},${cr.y - 60} ${cr.x},${cr.y}`); const c = pdLink.querySelector('circle'); c.setAttribute('cx', cr.x); c.setAttribute('cy', cr.y); c.style.opacity = E.outCubic(seg(t, 73.9, 74.2)); MG.draw(pdLinkD.slice(0, 1), u, 0); pdLink.style.opacity = so; } }
      const stv = envl(t, 73.7, 74.15, 75.7, 76.1);
      show(pdStats, stv, sx - 110, sy + 92 + (1 - stv) * 10, 0, 0, 1);
      if (stv > 0) { pdStats.querySelector('.s1 b').textContent = Math.round(87 * E.outCubic(seg(t, 73.8, 75.0))); pdStats.querySelector('.s2 b').textContent = Math.round(142 * E.outCubic(seg(t, 74.0, 75.2))); }
    }
    // the warm haze the clip shows around the emblem at the cut, carried for a moment into the film
    {
      const g = nt >= 0 ? 1 - E.inOutSine(seg(nt, 0.05, 0.7)) : 0, c = project([-330, 118, 40]);
      show(hoGlow, g * 0.95, c.x, c.y, 0, 0, 1 + 0.25 * (1 - g));
    }
    // end card + A&M signature inside the letterbox
    {
      const o = Math.min(E.outCubic(seg(t, 78.0, 78.5)), 1 - E.inCubic(seg(t, 81.6, 82.1)));
      endc.style.display = o > 0.003 ? '' : 'none'; endc.style.opacity = o;
      endSpans.forEach((s, i) => rise(s, E.outCubic(seg(t, 78.1 + i * 0.42, 78.85 + i * 0.42))));
      endL2.style.opacity = E.outCubic(seg(t, 79.1, 79.6)); endL3.style.opacity = E.outCubic(seg(t, 79.45, 80.0));
      show(amSign, envl(t, 79.0, 79.6, 81.6, 82.1), 0, 0);
    }

    world.set({ time: nt, focus: focusD, aperture, maxblur: 0.0055, bloom, fade, flash: 0, exposure: 1.0, rays });
  }
  // ident typography (A&M): masked reveals, a drawn rule, then it simply stays
  const identHud = (T) => {
    const on = INTRO.ident && T < IDENT && T > ID_TYPE.a - 0.1;
    MG.vis(idCap, on);
    if (!on) return;
    const a = ID_TYPE.a;
    rise(idN, E.outCubic(seg(T, a, a + 0.85)));
    idN.style.letterSpacing = `${0.34 + (1 - E.outCubic(seg(T, a, a + 1.6))) * 0.08}em`;
    idLine.style.width = `${E.inOutCubic(seg(T, a + 0.35, a + 1.25)) * 420}px`;
    rise(idS, E.outCubic(seg(T, a + 0.6, a + 1.45)));
    idCap.style.opacity = 1 - E.inQuad(seg(T, ID_TYPE.out, IDENT));
  };
  function update(T) {
    if (T < ID) {
      MG.vis(clipWrap, false); MG.vis(introT, false);
      updateFilm(-1, -1);
      world.useScene(ident.scene);
      const r = ident.update(T);
      world.set({ time: T, focus: r.focus, aperture: r.aperture, maxblur: r.maxblur, bloom: r.bloom, fade: r.fade, flash: 0, vig: 0.4, exposure: 1.0, rays: 0 });
      world.setAccent(new THREE.Color(ACCENT[0]), 0);
      identHud(T);
      const pc = ident.camAt(Math.max(0, T - SHUTTER));
      world.setPrevCamera(pc.P, pc.T, 30, T > 0.02 ? 1 : 0);
      return {};
    }
    if (T < FILM0) {
      // Fabio's intro: the clip fills the frame (no 3D this frame); our HUD fades in exactly where
      // the clip's own overlay would, and our corrected headline rises over the clip's
      const u = T - ID;
      updateFilm(-1, -1); identHud(T);
      bars.set(0);
      MG.vis(clipWrap, true);
      clipImg.style.transform = `scale(${clipScale(u).toFixed(4)})`;
      clipImg.style.filter = `brightness(${E.inOutSine(seg(u, 0, INTRO.fadeIn)).toFixed(3)})`;
      const h = E.outCubic(seg(u, INTRO.hud[0], INTRO.hud[1]));
      bug.style.opacity = h; pillBox.style.opacity = h;
      introTitle(u);
      return { skip3d: true };
    }
    MG.vis(clipWrap, false);
    world.useScene(world.scene);
    identHud(T);
    const nt = T - FILM0;
    updateFilm(S(nt), nt);
    introTitle(INTRO.dur + nt);
    const pp = poseAt(nt - SHUTTER);
    // the cut from the clip happens mid-pan: keep the camera's motion blur from the first frame
    world.setPrevCamera(pp.P, pp.T, pp.fov, 1);
    return {};
  }
  // the modal image a frame needs (loaded on demand by main.js before rendering it)
  const needs = (T) => {
    if (T < ID) return null;
    if (T < FILM0) return { clip: clipIndex(T - ID) };
    const nt = T - FILM0, t = S(nt);
    if (!(t > 28.5 && t < 58.1)) return null;
    const p = modalPlan(t, nt); return { tex: p.under ? [p.under, p.img] : [p.img] };
  };
  return { duration: DURATION, film0: FILM0, update, needs, loadClip, cam: (nt) => poseAt(nt), story: S };
}
