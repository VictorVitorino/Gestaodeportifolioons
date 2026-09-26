// DTS · Todos Sabem, Todos Usam, Somos Exemplo — every value is a pure function of t.
import * as THREE from 'three';
import { E, clamp, lerp, seg, spline, env as envl, pulse, rng, deg } from './util.js';
import * as O from './objects.js';

export const DURATION = 78;
const BLUE = 0x3d8bff, ORANGE = 0xff8a1f, GOLD = 0xf2b544;

export function buildFilm(ctx) {
  const { world, cam, project, font, tex, manifest, hud, imgs } = ctx;
  const scene = world.scene;
  const add = (o) => { scene.add(o); return o; };
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const mixv = (a, b, u) => a.map((x, i) => lerp(x, b[i], u));

  // ------------------------------------------------------------ library ring (441 skills)
  const atlas = O.canvasTex(1720, 600, (x) => { for (let k = 0; k < 8; k++) x.drawImage(imgs[`card_${k}`], (k % 4) * 430, (k < 4 ? 0 : 300), 430, 300); }, world.maxAniso);
  const TARGET = 64;
  const ring = O.libraryRing(atlas, { holes: [TARGET, 150, 211, 290, 333, 379, 418] });
  add(ring.body); add(ring.face);
  const slotPos = ring.slots[TARGET].pos.clone(), slotQ = ring.slots[TARGET].q.clone();

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
    w.group.position.set(0, 70, 10); g.add(w.group);
    const light = new THREE.PointLight(color, 0, 900, 2); light.position.set(0, 160, 160); g.add(light);
    g.position.set(...pos); g.rotation.y = rotY * deg;
    return { g, pod, word: w, light, color, side };
  };
  const P_S = mkPillar('TODOS SABEM', BLUE, 'S', [-560, 0, -360], 20);
  const P_U = mkPillar('TODOS USAM', ORANGE, 'U', [0, 0, -500], 0);
  const P_E = mkPillar('SOMOS EXEMPLO', GOLD, 'E', [560, 0, -360], -20);
  const PILLARS = [P_S, P_U, P_E];

  // ------------------------------------------------------------ UI frames
  const inicio = add(O.uiFrame(tex('screen_inicio'), { w: 780, h: 439, bezel: 14, depth: 14 }));
  const hlTex = O.canvasTex(512, 256, (x, w, h) => { x.shadowColor = '#ff9a2e'; x.shadowBlur = 22; x.strokeStyle = '#ffc070'; x.lineWidth = 14; O.roundRect(x, 20, 20, w - 40, h - 40, 36); x.stroke(); x.stroke(); });
  const hl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hlTex, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  hl.userData.noDepth = true; inicio.add(hl);
  // Biblioteca card region in the 1672x941 screenshot: x 318..748, y 248..403
  { const fw = 780, fh = 439; const cx = ((318 + 748) / 2 / 1672 - 0.5) * fw, cy = -((248 + 403) / 2 / 941 - 0.5) * fh; hl.position.set(cx, cy, 8.2); hl.scale.set((440 / 1672) * fw * 1.06, (165 / 941) * fh * 1.12, 1); }
  const rankF = add(O.uiFrame(tex('rank'), { w: 420, h: 292, bezel: 12, depth: 12, body: 0xf3efe8, alpha: true, glass: false }));

  const MR = manifest._modalRects;
  const MODAL = { c: [0, 330, -40], w: 330 };
  const MS = MODAL.w / MR.W, MH = MR.H * MS;
  const modalTex = new THREE.Texture(imgs.m_empty); modalTex.colorSpace = THREE.SRGBColorSpace; modalTex.anisotropy = world.maxAniso; modalTex.needsUpdate = true;
  let modalImg = 'm_empty';
  const modal = add(O.uiFrame(modalTex, { w: MODAL.w, h: MH, bezel: 10, depth: 12, body: 0xe9eef8, alpha: true, glass: true, radius: 18 }));
  const mpt = (u, v, dz = 7) => [MODAL.c[0] + (u - MR.W / 2) * MS, MODAL.c[1] - (v - MR.H / 2) * MS, MODAL.c[2] + dz];
  const fieldC = (f, du = 0) => mpt(MR[f].x + MR[f].w / 2 + du, MR[f].y + MR[f].h / 2);

  // ------------------------------------------------------------ step props
  const btnPed = add(O.pedestal({ r: 80, h: 110 }));
  const btn = add(O.capsuleButton(tex('sharebtn'), { w: 380, h: 96, d: 72 }));
  const cursor = add(O.cursor3d());
  const keys = ['[', 'D', 'T', 'S', ']'].map((k) => add(O.keycap(k, { s: 50 })));
  const models = [['Claude Haiku 4.5', 'H'], ['Claude Opus 4', 'O'], ['Claude Sonnet 4.5', 'S'], ['Claude Opus 4.5', 'O'], ['Claude Sonnet 5', 'S'], ['Claude Sonnet 4', 'S'], ['Claude Haiku 3.5', 'H']];
  const SEL = 4;
  const drum = add(O.rolodex(models, { w: 300, h: 66, r: 92 }));
  const drumFrame = add(new THREE.Group());
  
  const chip = add(O.skillSlab(O.labelTex('Flows / Claude', { w: 1024, h: 220, font: '700 104px Inter', color: '#0f2556', bg: '#eceefe', radius: 70 }), { w: 150, h: 32, depth: 7 }));
  const boxPed = add(O.pedestal({ r: 95, h: 90 }));
  const box = add(O.cardboardBox({ w: 150, h: 104, d: 128 }));
  const fileDefs = [['SKILL.md', { gold: true }], ['README.md', { tint: 0xd8e6ff }], ['LICENSE', { tint: 0xd9f3e6 }], ['scripts/', { dir: true }], ['references/', { dir: true }], ['assets/', { dir: true }]];
  const files = fileDefs.map(([n, o]) => add(O.docFile(n, o)));
  const newCard = add(O.skillSlab(tex('card_new'), { w: 172, h: 120, depth: 6 }));
  const heroCards = [4, 5, 2].map((k) => add(O.skillSlab(tex(`card_${k}`), { w: 250, h: 174, depth: 7 })));
  const threads = [];
  { const R = rng(5); const picks = new Set(); while (picks.size < 34) { const i = Math.floor(R() * ring.N); const a = ring.slots[i].a; const da = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (!ring.holeSet.has(i) && Math.abs(i - TARGET) > 2 && da < 1.9 && da > 0.08) picks.add(i); }
    for (const i of picks) { const th = O.thread(slotPos.clone(), ring.slots[i].pos.clone(), 250 + R() * 500); th.userData.tile = i; th.userData.delay = R() * 1.6; add(th); threads.push(th); } }
  const shock = add(O.glowRing(0xffc46e));

  // sparks (3D points) and trail
  const mkPoints = (n, size, color) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('a', new THREE.BufferAttribute(new Float32Array(n), 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uS: { value: size }, uC: { value: new THREE.Color(color) } },
      vertexShader: `attribute float a; varying float vA; uniform float uS; void main(){ vA = a; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(uS * 400.0 / -mv.z, 1.0, 40.0) * (0.4 + 0.6*a); }`,
      fragmentShader: `varying float vA; uniform vec3 uC; void main(){ float d = length(gl_PointCoord-0.5); float k = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(uC * k * vA * 2.2, 1.0); }` });
    const p = new THREE.Points(g, m); p.userData.noDepth = true; p.renderOrder = 30; p.frustumCulled = false; add(p);
    return p;
  };
  const sparks = mkPoints(260, 14, 0xffd08a);
  const trail = mkPoints(60, 22, 0xffc46e);
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
      arr.a[k] = 1 - dt / l; k++;
    }
    arr.i = k; return 1;
  };

  // ------------------------------------------------------------ HUD (motion graphics)
  hud.innerHTML = `<div class="band"></div>
    <div class="bug"><div class="m">DTS</div><div class="t"><small>Digital &amp; Technology Services</small>Todos Sabem · Todos Usam · Somos Exemplo</div></div>
    <div class="pillars"><div class="pill" style="--c:#3d8bff"><i></i>Todos Sabem<em></em></div><div class="pill" style="--c:#ff8a1f"><i></i>Todos Usam<em></em></div><div class="pill" style="--c:#f2b544"><i></i>Somos Exemplo<em></em></div></div>
    <div class="steps"><span class="sl">PASSO 1/6</span>${'<b></b>'.repeat(6)}</div>
    <div class="sub"><div class="k"></div><div class="s"></div></div>
    <div class="tag t-dts" style="top:835px;font-size:30px">Digital &amp; Technology Services</div>
    <div class="headline h-open" style="top:360px"></div>
    <div class="tag t-open" style="top:450px">Compartilhar uma Skill no FLOWS · 6 passos</div>
    <div class="kin k-pillar" style="top:170px"><div class="tag" style="position:static;letter-spacing:.5em"></div><div class="lbl" style="font-size:52px;font-weight:800;margin-top:10px"></div></div>
    <div class="kin k-count" style="top:250px"><div class="big">0</div><div class="lbl"></div></div>
    <div class="callout c-pfx"><span class="dot">✦</span>prefixo da área</div>
    <div class="callout soft c-where"><span class="dot">✓</span>contexto da validação</div>
    <div class="callout c-req"><span class="dot">*</span>obrigatório</div>
    <div class="callout soft c-opt"><span class="dot">⏱</span>opcional · minutos na mão</div>
    <div class="callout c-root"><span class="dot">★</span>SKILL.md na raiz</div>
    <div class="endcard" style="top:120px"><div class="l1"><span class="c1">Todos Sabem.</span> <span class="c2">Todos Usam.</span> <span class="c3">Somos Exemplo.</span></div>
      <div class="l2">DTS · Digital &amp; Technology Services</div>
      <div class="l3"><img src="tex/logo.png" alt="">Compartilhe sua skill no FLOWS</div></div>`;
  const $ = (s) => hud.querySelector(s);
  const bug = $('.bug'), pills = [...hud.querySelectorAll('.pill')], pillFill = pills.map((p) => p.querySelector('em'));
  const steps = $('.steps'), stepBars = [...steps.querySelectorAll('b')], stepLbl = steps.querySelector('.sl');
  const subK = $('.sub .k'), subS = $('.sub .s'), band = $('.band');
  const tDts = $('.t-dts'), hOpen = $('.h-open'), tOpen = $('.t-open');
  hOpen.innerHTML = 'Como a DTS compartilha conhecimento'.split(' ').map((w) => `<span class="w">${w} </span>`).join('');
  const hOpenW = [...hOpen.querySelectorAll('.w')];
  const kP = $('.k-pillar'), kPTag = kP.querySelector('.tag'), kPLbl = kP.querySelector('.lbl');
  const kC = $('.k-count'), kCBig = kC.querySelector('.big'), kCLbl = kC.querySelector('.lbl');
  const cPfx = $('.c-pfx'), cWhere = $('.c-where'), cReq = $('.c-req'), cOpt = $('.c-opt'), cRoot = $('.c-root');
  const endc = $('.endcard'), endSpans = [...endc.querySelectorAll('.l1 span')], endL2 = endc.querySelector('.l2'), endL3 = endc.querySelector('.l3');
  const show = (el, op, x = null, y = null, ax = 0, ay = 0, sc = 1) => {
    el.style.opacity = op; el.style.display = op > 0.003 ? '' : 'none';
    if (op > 0.003 && x !== null) el.style.transform = `translate(${x}px,${y}px) translate(${-ax * 100}%,${-ay * 100}%) scale(${sc})`;
  };
  const SUBS = [
    [12.6, 15.9, '', 'Todos sabem onde encontrar: tudo começa no Início do FLOWS.'],
    [16.3, 20.4, '', 'Na Biblioteca, a comunidade já reúne 441 skills prontas para reuso.'],
    [20.7, 23.8, '', 'E todos sabem como contribuir: compartilhar uma skill leva 6 passos.'],
    [26.2, 30.3, 'Passo 1', 'Clique em Compartilhar Skill.'],
    [30.8, 37.3, 'Passo 2', 'Dê à skill um nome claro, com o prefixo da área.'],
    [37.7, 42.3, 'Passo 3', 'Informe onde ela foi testada.'],
    [42.7, 48.3, 'Passo 4', 'Escolha o modelo testado. O campo é obrigatório.'],
    [48.7, 55.3, 'Passo 5', 'Envie tudo em um único ZIP, com o SKILL.md na raiz.'],
    [55.7, 61.8, 'Passo 6', 'Avance em Próximo e publique para o time.'],
    [64.2, 68.8, '', 'Uma skill compartilhada vira referência para todo o time.'],
    [69.2, 72.3, '', 'Cada contribuição conta: o conhecimento da DTS cresce com cada skill.'],
  ];
  const PILLAR_BEATS = [[10.1, 12.1, 'Pilar 1 · Todos Sabem', 'onde está o conhecimento', '#8fc0ff'], [24.1, 26.1, 'Pilar 2 · Todos Usam', 'o passo a passo no dia a dia', '#ffb15c'], [62.1, 64.1, 'Pilar 3 · Somos Exemplo', 'quem compartilha, lidera pelo exemplo', '#ffd27a']];
  let subKey = '', pillarKey = '';

  // ------------------------------------------------------------ helpers
  const setCam = (pos, tgt, fov = 30) => { cam.position.set(...pos); cam.up.set(0, 1, 0); cam.lookAt(...tgt); cam.fov = fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); };
  const riseY = (t, t0, dur = 0.8, from = -220) => from * (1 - E.outBack(seg(t, t0, t0 + dur)));
  const sinkY = (t, t0, dur = 0.7, to = -260) => to * E.inBack(seg(t, t0, t0 + dur));
  const squash = (t, t0, amt = 0.22, d = 0.18) => { const p = pulse(t, t0, 0.03, d) * Math.cos((t - t0) * 18) ; return [1 + amt * 0.8 * p, 1 - amt * p]; };
  const letterPop = (letters, t, t0, stagger = 0.07, dur = 0.55, drop = 90) => {
    letters.forEach((l, i) => {
      const a = t0 + i * stagger; const u = seg(t, a, a + dur);
      const y = drop * (1 - E.outBack(u, 2.2));
      const land = a + dur * 0.55; const sq = squash(t, land, 0.25, 0.16);
      l.holder.position.y = u <= 0 ? -9999 : y;
      l.holder.scale.set(sq[0], sq[1] * clamp(u * 4), sq[0]);
      l.holder.visible = u > 0;
    });
  };
  const letterWave = (letters, t, t0, amp = 22) => letters.forEach((l, i) => { const u = seg(t, t0 + i * 0.05, t0 + i * 0.05 + 0.45); l.holder.position.y += Math.sin(u * Math.PI) * amp; });
  const vis = (o, v) => { o.visible = v; return v; };

  // ------------------------------------------------------------ update
  function update(t) {
    // ============ CAMERA (computed first: projections below depend on it)
    let P, T, fov = 30, focusD = null, aperture = 0.000018, maxblur = 0.008;
    const podCam = (p, back = p === P_E ? 1080 : 800) => { const dir = [Math.sin(p.g.rotation.y), 0, Math.cos(p.g.rotation.y)]; const o = p.g.position; return [[o.x + dir[0] * back, 190, o.z + dir[2] * back], [o.x + dir[0] * 10, 100, o.z + dir[2] * 10]]; };
    if (t < 10) {
      P = spline([[0, [70, 26, 860]], [2.6, [0, 90, 720]], [5.2, [-260, 380, 1400]], [8.2, [-70, 500, 1760]], [10, [-420, 240, 520]]], t, 'linear');
      T = spline([[0, [0, 36, 0]], [2.6, [0, 115, 60]], [5.2, [0, 130, -140]], [8.2, [0, 120, -200]], [10, [-540, 110, -350]]], t, 'linear');
      aperture = t < 3 ? 0.00003 : 0.000014;
    } else if (t < 24) {
      const [sp, st] = podCam(P_S);
      P = spline([[10, [-420, 240, 520]], [11.2, sp], [12.0, mixv(sp, [sp[0] + 30, sp[1] + 10, sp[2] - 40], 1)], [12.9, [-30, 290, 1020]], [15.9, [70, 272, 700]], [18.6, [520, 900, 1350]], [20.6, [260, 460, 980]], [24, [0, 270, 900]]], t, 'linear');
      T = spline([[10, [-540, 110, -350]], [11.2, st], [12.0, st], [12.9, [0, 270, -120]], [15.9, [-40, 262, -120]], [18.6, [0, 300, -900]], [20.6, [0, 320, -1500]], [24, [0, 260, 260]]], t, 'linear');
      if (t > 20.6) { const u = E.inOutCubic(seg(t, 20.6, 22.2)); T = mixv(T, [0, 262, 300], u); }
      aperture = t > 16 && t < 20.6 ? 0.000008 : 0.000016;
    } else if (t < 62) {
      const [up, ut] = podCam(P_U);
      const nameC = fieldC('name'), whereC = fieldC('where'), modelC = fieldC('model'), timeC = fieldC('time'), fileC = fieldC('file'), nextC = fieldC('next');
      const keysC = [-330, 430, 60];
      const mid = (a, b, u = 0.5) => mixv(a, b, u);
      const K = [
        [24, [0, 270, 900], [0, 262, 300]],
        [24.9, up, ut], [26.0, mixv(up, [up[0], up[1] + 8, up[2] - 30], 1), ut],
        [26.7, [-300, 250, 700], [0, 150, 80]], [27.2, [-270, 222, 590], [0, 152, 80]], [28.4, [-130, 195, 420], [0, 158, 80]],
        [30.2, [0, 300, 920], [0, 320, -40]],
        [31.4, [-150, 460, 600], [-150, 446, -20]], [35.2, [-138, 454, 560], [-138, 446, -20]],
        [36.4, [nameC[0] - 10, nameC[1] + 6, 360], nameC], [37.4, [nameC[0] + 10, nameC[1], 350], nameC],
        [38.2, [whereC[0] - 20, whereC[1] + 12, 350], [whereC[0], whereC[1] - 20, whereC[2]]], [42.3, [whereC[0] + 30, whereC[1] - 6, 330], [whereC[0], whereC[1] - 24, whereC[2]]],
        [43.2, [modelC[0] + 150, modelC[1] + 40, 760], [modelC[0] + 170, modelC[1], 0]], [46.4, [modelC[0] + 160, modelC[1] + 20, 690], [modelC[0] + 150, modelC[1], 0]],
        [47.3, [timeC[0] + 20, timeC[1] + 20, 380], timeC], [48.4, [timeC[0] + 30, timeC[1] + 6, 360], timeC],
        [49.4, [-170, 250, 800], [-150, 170, 20]], [53.6, [-190, 230, 700], [-170, 160, 20]], [54.6, [fileC[0] - 40, fileC[1] + 20, 400], fileC], [55.5, [fileC[0] - 20, fileC[1] + 10, 380], fileC],
        [56.4, [nextC[0] + 20, nextC[1] + 30, 420], nextC], [57.2, [0, 330, 980], [0, 330, -40]],
        [58.4, [0, 330, 820], [0, 320, -200]], [62, [140, 380, 860], [90, 250, -1700]],
      ];
      P = spline(K.map((k) => [k[0], k[1]]), t, 'linear');
      T = spline(K.map((k) => [k[0], k[2]]), t, 'linear');
      aperture = 0.000022;
      if (t > 58.3) {
        // fly-along: the camera rides behind the new card all the way to the library slot
        const from = new THREE.Vector3(...MODAL.c), midp = from.clone().lerp(slotPos, 0.5); midp.y += 520;
        const curve = new THREE.QuadraticBezierCurve3(from, midp, slotPos);
        const u = E.inOutCubic(seg(t, 58.3, 60.2));
        const cp = curve.getPoint(u);
        const settle = E.inOutCubic(seg(t, 59.4, 60.6));
        const off = [lerp(0, 90, settle), lerp(90, 110, settle), lerp(520, 760, settle)];
        const follow = [cp.x + off[0], cp.y + off[1], cp.z + off[2]], look = [cp.x, cp.y - 10, cp.z - 300];
        const hold = [slotPos.x + 90, slotPos.y + 110, slotPos.z + 760], holdT = [slotPos.x, slotPos.y, slotPos.z];
        const w0 = E.inOutCubic(seg(t, 58.3, 58.9));
        P = t < 60.2 ? mixv(P, follow, w0) : mixv(hold, [hold[0] + 60, hold[1] + 80, hold[2] + 500], E.inOutSine(seg(t, 60.4, 62)));
        T = t < 60.2 ? mixv(T, look, w0) : mixv(holdT, [holdT[0], holdT[1] + 20, holdT[2]], seg(t, 60.4, 62));
        aperture = 0.000012;
      }
    } else {
      const [ep, et] = podCam(P_E);
      P = spline([[62, [140, 380, 860]], [62.9, ep], [63.5, mixv(ep, [ep[0] - 12, ep[1] + 4, ep[2] - 16], 1)], [64.0, mixv(ep, [ep[0] - 24, ep[1] + 8, ep[2] - 32], 1)], [65.2, [0, 520, 200]], [68.8, [-260, 560, 120]], [69.8, [60, 300, 560]], [72.2, [110, 290, 480]], [73.3, [40, 420, 1150]], [74.8, [0, 540, 1700]], [78, [0, 760, 2250]]], t, 'linear');
      T = spline([[62, [90, 250, -1700]], [62.9, et], [63.5, et], [64.0, et], [65.2, [0, 330, -2000]], [68.8, [60, 360, -2000]], [69.8, [0, 250, -80]], [72.2, [0, 250, -80]], [73.3, [0, 260, -200]], [74.8, [0, 360, -400]], [78, [0, 420, -500]]], t, 'linear');
      aperture = t > 64.5 && t < 69.5 ? 0.000007 : 0.000016;
      fov = 30 + seg(t, 72.5, 78) * 4;
    }
    let shake = pulse(t, 28.0, 0.03, 0.16) * 3 + pulse(t, 60.2, 0.03, 0.25) * 4 + pulse(t, 1.9, 0.03, 0.2) * 1.5;
    if (shake > 0.01) { P = [P[0] + Math.sin(t * 93) * shake, P[1] + Math.cos(t * 71) * shake, P[2]]; }
    setCam(P, T, fov);
    focusD = Math.hypot(T[0] - P[0], T[1] - P[1], T[2] - P[2]);

    // ============ ENVIRONMENT + global light
    let fade = 1 - E.outQuad(seg(t, 0, 1.4)), flash = 0, bloom = 0.38;
    fade = Math.max(fade, E.inQuad(seg(t, 76.8, 78)));
    flash = Math.max(envl(t, 9.7, 10.0, 10.05, 10.5, 'inQuad', 'outQuad') * 0.6, envl(t, 23.7, 24.0, 24.05, 24.5, 'inQuad', 'outQuad') * 0.6, envl(t, 61.8, 62.05, 62.1, 62.5, 'inQuad', 'outQuad') * 0.6, envl(t, 60.1, 60.2, 60.25, 60.8, 'inQuad', 'outQuad') * 0.35);
    const flashCol = t < 17 ? [0.62, 0.8, 1.0] : t < 40 ? [1.0, 0.72, 0.45] : [1.0, 0.88, 0.58];

    // ============ EMBLEM
    {
      const up1 = seg(t, 1.2, 1.9), down = t > 11.4 && t < 72.4 ? 1 : 0;
      let y = riseY(t, 1.2, 0.8, -240);
      if (t > 11.4) y = sinkY(t, 11.4, 0.8, -300);
      if (t > 72.4) y = riseY(t, 72.4, 0.9, -300);
      emblem.position.y = y; vis(emblem, t > 1.15 && !(t > 12.3 && t < 72.4));
      dts.letters.forEach((l, i) => {
        const a = 1.4 + i * 0.18; const u = seg(t, a, a + 0.6);
        const sq = squash(t, a + 0.36, 0.3, 0.2);
        let ly = 170 * (1 - E.outBack(u, 2.4)) - (u <= 0 ? 400 : 0);
        if (t > 72.4) { const a2 = 72.8 + i * 0.12; const u2 = seg(t, a2, a2 + 0.6); ly = u2 <= 0 ? 0 : Math.sin(u2 * Math.PI) * 40; }
        l.holder.position.y = ly + Math.sin(t * 1.6 + i) * 2.5 * up1;
        l.holder.scale.set(sq[0], sq[1], sq[0]);
        l.holder.rotation.y = (1 - E.outCubic(u)) * 0.9 * (i - 1);
      });
    }
    // ============ PODIUMS + WORDS
    PILLARS.forEach((p, k) => {
      const t0 = 4.2 + k * 0.3;
      p.g.position.y = riseY(t, t0, 0.8, -200);
      vis(p.g, t > t0);
      letterPop(p.word.letters, t, t0 + 0.6, 0.06, 0.5, 80);
      const beat = k === 0 ? 10.3 : k === 1 ? 24.3 : 62.3;
      letterWave(p.word.letters, t, beat, 26);
      const glow = 0.8 + envl(t, beat - 0.3, beat, beat + 1.5, beat + 2.2) * 2.4 + (t > 72.6 ? E.outCubic(seg(t, 72.6 + k * 0.25, 73.4 + k * 0.25)) * 1.4 : 0) + (t > 4.5 && t < 7.5 ? pulse(t, t0 + 0.9, 0.05, 0.6) * 2 : 0);
      p.pod.userData.strip.material.emissiveIntensity = 1.2 + glow;
      p.light.intensity = Math.max(0, glow - 0.8) * 2600;
    });

    // ============ TODOS SABEM: Início frame + ring wave + hero cards
    {
      const on = t > 11.9 && t < 16.8;
      vis(inicio, on);
      if (on) {
        const y = 285 + riseY(t, 11.9, 0.9, -420) - (t > 15.9 ? E.inBack(seg(t, 15.9, 16.7)) * 520 : 0);
        inicio.position.set(0, y, -120); inicio.rotation.set(-0.04 + Math.sin(t * 0.8) * 0.01, Math.sin(t * 0.5) * 0.03, 0);
        const hp = envl(t, 13.4, 13.8, 15.6, 15.9);
        hl.visible = hp > 0.01; hl.material.opacity = hp * (0.75 + 0.25 * Math.sin(t * 7)); hl.material.color.setScalar(1.6);
      }
      // wave around the ring: tiles pop toward the center and glow as the counter runs
      const waveT = seg(t, 16.2, 19.4);
      const reach = t > 64 ? 1 : 0;
      for (let i = 0; i < ring.N; i++) {
        const sl = ring.slots[i];
        let da = Math.abs(((sl.a + Math.PI) % (2 * Math.PI)) - Math.PI) / Math.PI; // 0 at front-back axis
        const tt = 16.2 + da * 2.6 + sl.r * 0.05;
        const wv = pulse(t, tt, 0.12, 0.35);
        let glow = wv * 0.8, lift = wv * 60;
        if (t > 60.2 && t < 62.5) { const d = sl.pos.distanceTo(slotPos); const w2 = pulse(t, 60.2 + d / 2600, 0.06, 0.3); glow += w2 * 0.9; lift += w2 * 30; }
        ring.set(i, 1, lift, glow);
      }
      ring.threadGlow = reach;
      // hero cards
      heroCards.forEach((c, k) => {
        const t0 = 20.7 + k * 0.18, t1 = 23.3 + k * 0.08;
        const on2 = t > t0 && t < t1 + 0.8; vis(c, on2);
        if (!on2) return;
        const from = [(k - 1) * 700, 330, -2150], to = [(k - 1) * 290, 262, 300];
        const u = E.inOutCubic(seg(t, t0, t0 + 1.2));
        const out = E.inBack(seg(t, t1, t1 + 0.7));
        const p = mixv(from, to, u); p[1] += Math.sin(u * Math.PI) * 180 - out * 60; p[2] -= out * 900;
        c.position.set(...p);
        c.rotation.set(0, (1 - u) * Math.PI * (k - 1) * 0.6 + Math.sin(t * 1.3 + k) * 0.05, (1 - u) * 0.3 * (k - 1));
        c.scale.setScalar(1 - out * 0.5);
      });
    }

    // ============ STEP PROPS
    // Passo 1: pedestal + capsule button + cursor press
    {
      const on = t > 26.3 && t < 31.2; vis(btnPed, on); vis(btn, on);
      if (on) {
        const y = riseY(t, 26.35, 0.8, -300) + (t > 30.2 ? sinkY(t, 30.2, 0.8, -300) : 0);
        btnPed.position.set(0, y, 80);
        const press = pulse(t, 28.0, 0.05, 0.28), sq = squash(t, 28.02, 0.2, 0.2);
        btn.position.set(0, y + 110 + 50 - press * 14 + Math.sin(t * 2.2) * 2, 80);
        btn.rotation.set(-0.32, Math.sin(t * 0.9) * 0.05, 0);
        btn.scale.set(sq[0], sq[1], sq[0]);
        btn.userData.cap.material.emissive.setHex(0xff7a00); btn.userData.cap.material.emissiveIntensity = press * 1.6;
      }
      shock.visible = t > 28.0 && t < 29.2;
      if (shock.visible) { const u = E.outCubic(seg(t, 28.0, 29.1)); shock.position.set(0, 2, 80); shock.scale.setScalar(0.6 + u * 4.2); shock.material.opacity = 1 - u; }
    }
    // Cursor (Passo 1 press + Passo 6 Próximo)
    {
      let on = false, p = [0, 0, 0], rotZ = 0.25;
      if (t > 26.6 && t < 29.0) {
        on = true;
        const u = E.inOutCubic(seg(t, 26.6, 27.9)), press = pulse(t, 27.95, 0.05, 0.25);
        p = mixv([160, 420, 260], [30, 228, 128], u); p[1] -= press * 16; p[2] -= press * 8;
        if (t > 28.4) { const w = E.inCubic(seg(t, 28.4, 29.0)); p = mixv(p, [260, 520, 300], w); }
      } else if (t > 55.6 && t < 57.2) {
        on = true;
        const nc = fieldC('next', 30);
        const u = E.inOutCubic(seg(t, 55.6, 56.5)), press = pulse(t, 56.55, 0.05, 0.25);
        p = mixv([nc[0] + 190, nc[1] - 120, nc[2] + 220], [nc[0] + 6, nc[1] - 4, nc[2] + 14], u); p[2] -= press * 10;
        if (t > 56.8) { const w = E.inCubic(seg(t, 56.8, 57.2)); p = mixv(p, [nc[0] + 240, nc[1] - 160, nc[2] + 260], w); }
        rotZ = 0.2;
      }
      vis(cursor, on);
      if (on) { cursor.position.set(...p); cursor.rotation.set(-0.35, 0.3, rotZ); cursor.scale.setScalar(1.25); }
    }
    // modal frame lifecycle
    let mScale = 0, mRotY = 0, mPos = MODAL.c.slice();
    {
      const born = E.outBack(seg(t, 28.6, 29.8), 1.4);
      mScale = born;
      mPos = mixv([0, 190, 80], MODAL.c, E.outCubic(seg(t, 28.6, 29.6)));
      mRotY = (1 - E.outCubic(seg(t, 28.6, 29.7))) * Math.PI * 0.5;
      const fold = E.inOutCubic(seg(t, 57.4, 58.2));
      if (t > 57.4) { mScale = lerp(1, 172 / MODAL.w, fold); mRotY = fold * Math.PI * 2; }
      const on = t > 28.6 && t < 58.0;
      vis(modal, on);
      modal.position.set(mPos[0], mPos[1] + Math.sin(t * 0.7) * 2, mPos[2]);
      modal.rotation.set(0, mRotY, 0);
      modal.scale.setScalar(Math.max(0.001, mScale));
      // texture state machine
      const NAME = 44;
      let img = 'm_empty';
      if (t > 31.2) img = `m_name_${String(Math.min(NAME, t < 32.6 ? Math.floor(seg(t, 31.4, 32.6) * 5.999) : 5 + Math.floor(seg(t, 32.6, 35.3) * 39))).padStart(2, '0')}`;
      if (t > 35.4) img = t > 35.7 && t < 37.4 ? 'm_name_pfx' : 'm_name_44';
      if (t > 37.5) img = 'm_where_0';
      if (t > 37.95) img = 'm_where_1'; if (t > 38.15) img = 'm_where_2'; if (t > 38.35) img = 'm_where_3';
      if (t > 38.7) img = 'm_where_dd'; if (t > 39.3) img = 'm_where_ddhi';
      if (t > 40.25) img = 'm_where_done'; if (t > 40.6 && t < 42.4) img = 'm_where_hint';
      if (t > 42.5) img = 'm_model_focus';
      if (t > 42.8 && t < 44.0) img = Math.floor((t - 42.8) * 5) % 2 === 0 ? 'm_model_req' : 'm_model_focus';
      if (t > 46.6) img = 'm_model_done';
      if (t > 47.25) img = 'm_time_0'; if (t > 47.45) img = 'm_time_1'; if (t > 47.65) img = 'm_time_2'; if (t > 47.85) img = 'm_time_3';
      if (t > 48.45) img = 'm_time_done';
      if (t > 49.0) img = 'm_zip';
      if (t > 54.55) img = 'm_zip_file';
      if (t > 56.55 && t < 56.8) img = 'm_next_press';
      if (t > 56.8) img = 'm_step2';
      if (img !== modalImg) { modalTex.image = imgs[img]; modalTex.needsUpdate = true; modalImg = img; }
    }
    // keycaps (Passo 2)
    keys.forEach((k, i) => {
      const t0 = 30.9 + i * 0.07, on = t > t0 && t < 36.4; vis(k, on);
      if (!on) return;
      const base = [-404 + i * 58, 438, 24];
      const inU = E.outBack(seg(t, t0, t0 + 0.5)), outU = E.inBack(seg(t, 35.8 + i * 0.05, 36.3 + i * 0.05));
      const pressT = 31.4 + (i + 1) * 0.24 - 0.12;
      const pr = pulse(t, pressT, 0.04, 0.16);
      k.position.set(base[0], base[1] - (1 - inU) * 200 - outU * 260 - pr * 16 + Math.sin(t * 2 + i) * 3, base[2]);
      k.rotation.set(1.05, 0.25, 0);
      const sq = squash(t, pressT, 0.18, 0.14); k.scale.set(sq[0], sq[1], sq[0]);
      k.userData.cap.material.emissive.setHex(0xff8a1f); k.userData.cap.material.emissiveIntensity = pr * 0.9;
    });
    // chip Flows / Claude (Passo 3)
    {
      const on = t > 39.85 && t < 40.4; vis(chip, on);
      if (on) { const u = E.inOutCubic(seg(t, 39.85, 40.3)); const a = mpt(130, MR.where.y + 100, 26), b = fieldC('where', -170); b[2] += 10; const p = mixv(a, b, u); p[1] += Math.sin(u * Math.PI) * 30; chip.position.set(...p); chip.rotation.set(0, 0, (1 - u) * 0.15); chip.scale.setScalar(1 - u * 0.35); }
    }
    // model drum (Passo 4)
    {
      const on = t > 43.1 && t < 47.3; vis(drum, on); vis(drumFrame, on);
      if (on) {
        const mc = fieldC('model');
        const y = mc[1] + riseY(t, 43.1, 0.7, -340) + (t > 46.6 ? sinkY(t, 46.6, 0.7, -420) : 0);
        const aSel = (SEL / drum.userData.n) * Math.PI * 2;
        const spin = E.outQuint(seg(t, 43.7, 45.9));
        drum.position.set(mc[0] + 350, y, 10); drumFrame.position.copy(drum.position);
        drum.rotation.x = aSel + (1 - spin) * Math.PI * 2 * 2.5;
        drum.userData.slats.forEach((s, i) => {
          const sel = i === SEL && t > 45.9;
          s.body.material.emissive.setHex(0xffb347); s.body.material.emissiveIntensity = sel ? 0.35 + pulse(t, 45.9, 0.05, 0.4) * 1.2 : 0;
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
      const bp = [-330, 0, 70];
      if (on) {
        const y = riseY(t, 48.6, 0.8, -300);
        boxPed.position.set(bp[0], y, bp[2]);
        let land = 0; for (let i = 0; i < 6; i++) land += pulse(t, 50.35 + i * 0.5, 0.03, 0.14);
        const close = E.inOutBack(seg(t, 52.9, 53.5));
        const sqc = squash(t, 53.5, 0.16, 0.2);
        const fly = E.inOutCubic(seg(t, 54.0, 54.6));
        const fc = fieldC('file', -150);
        const p = mixv([bp[0], y + 90, bp[2]], [fc[0], fc[1] - 20, fc[2] + 10], fly);
        box.position.set(p[0], p[1] - land * 5, p[2]);
        box.rotation.set(0, 0.45 + Math.sin(t * 0.8) * 0.05 - fly * 0.45, 0);
        const s = 1 - fly * 0.72;
        box.scale.set(s * sqc[0] * (1 + land * 0.05), s * sqc[1] * (1 - land * 0.06), s * sqc[0] * (1 + land * 0.05));
        box.userData.flaps.forEach((f) => { f.hinge.rotation.x = f.sgn * lerp(-2.05, 0, close); });
        box.userData.tape.visible = t > 53.55;
      }
      files.forEach((f, i) => {
        const t0 = 49.8 + i * 0.5, t1 = t0 + 0.6; const on2 = t > t0 && t < t1 + 0.04; vis(f, on2);
        if (!on2) return;
        const u = E.inOutSine(seg(t, t0, t1));
        const a = [380 + (i % 3) * 30, 150 + (i % 2) * 90, 120], b = [bp[0], 120 + 60, bp[2]];
        const m = mixv(a, b, 0.5); m[1] += 260;
        const q = (x, y, z, uu) => x.map((_, k) => (1 - uu) * (1 - uu) * x[k] + 2 * (1 - uu) * uu * y[k] + uu * uu * z[k]);
        f.position.set(...q(a, m, b, u)); f.rotation.set(u * 1.2, (1 - u) * 2.4, (1 - u) * 0.6); f.scale.setScalar(1 - u * 0.35);
      });
    }
    // new card: born from the folded modal, flies into the ring slot
    {
      const on = t > 57.95 && t < 76.9; vis(newCard, on);
      if (on) {
        const u = E.inOutCubic(seg(t, 58.3, 60.2));
        const from = new THREE.Vector3(...MODAL.c), mid = from.clone().lerp(slotPos, 0.5); mid.y += 520;
        const curve = new THREE.QuadraticBezierCurve3(from, mid, slotPos);
        const p = curve.getPoint(u);
        newCard.position.copy(p);
        const qa = new THREE.Quaternion(); const qb = slotQ.clone();
        const qq = qa.slerp(qb, E.inOutCubic(seg(t, 58.3, 60.0)));
        newCard.quaternion.copy(qq);
        newCard.rotateZ(Math.sin(u * Math.PI) * 0.35);
        const s0 = MODAL.w / 172;
        newCard.scale.setScalar(t < 58.3 ? lerp(s0 * 0.5, s0, E.outBack(seg(t, 57.95, 58.3))) : lerp(s0, 1, E.inOutCubic(seg(t, 58.3, 60.2))));
        const g = pulse(t, 60.2, 0.05, 1.2) + (t > 64 && t < 70 ? 0.5 + 0.3 * Math.sin(t * 4) : 0);
        newCard.userData.face.material.color.setScalar(1 + Math.min(g, 1) * 0.18);
        newCard.userData.body.material.emissive.setHex(0xffb347); newCard.userData.body.material.emissiveIntensity = Math.min(g, 1.5) * 1.4;
        // trail
        if (u > 0.01 && u < 1) {
          const n = 60; trail.geometry.attributes.position.array.fill(0);
          for (let k = 0; k < n; k++) { const uu = Math.max(0, u - k * 0.006); const pp = curve.getPoint(uu); trail.geometry.attributes.position.array.set([pp.x, pp.y, pp.z], k * 3); trail.geometry.attributes.a.array[k] = (1 - k / n) * 0.9; }
          trail.geometry.attributes.position.needsUpdate = true; trail.geometry.attributes.a.needsUpdate = true; trail.visible = true;
        } else trail.visible = false;
      } else trail.visible = false;
    }
    // sparks
    {
      const arr = { pos: sparks.geometry.attributes.position.array, a: sparks.geometry.attributes.a.array, i: 0, n: 260 };
      arr.a.fill(0);
      burst(arr, t, 28.0, [0, 190, 90], { n: 60, seed: 3, speed: 360 });
      burst(arr, t, 53.7, [-330, 230, 70], { n: 40, seed: 7, speed: 240 });
      burst(arr, t, 57.95, [0, 330, -20], { n: 60, seed: 9, speed: 300 });
      burst(arr, t, 60.2, [slotPos.x, slotPos.y, slotPos.z + 20], { n: 90, seed: 11, speed: 520, life: 1.4 });
      burst(arr, t, 1.9, [0, 60, 60], { n: 40, seed: 13, speed: 260, life: 0.9 });
      sparks.geometry.attributes.position.needsUpdate = true; sparks.geometry.attributes.a.needsUpdate = true;
    }
    // threads (Somos Exemplo)
    threads.forEach((th) => {
      const t0 = 64.4 + th.userData.delay, u = E.inOutCubic(seg(t, t0, t0 + 1.4));
      th.visible = t > t0 && t < 76.8;
      th.material.uniforms.uP.value = u; th.material.uniforms.uA.value = 0.6 + 0.4 * Math.sin(t * 3 + th.userData.delay * 7);
      if (u >= 1) { const i = th.userData.tile; const g = pulse(t, t0 + 1.4, 0.05, 0.8) * 1.2 + 0.25; ring.set(i, 1, g * 30, g); }
    });
    ring.commit();
    // ranking frame (Somos Exemplo)
    {
      const on = t > 68.9 && t < 73.0; vis(rankF, on);
      if (on) { const y = 250 + riseY(t, 68.9, 0.9, -460) + (t > 72.2 ? sinkY(t, 72.2, 0.8, -520) : 0); rankF.position.set(0, y, -80); rankF.rotation.set(-0.05, Math.sin(t * 0.6) * 0.05, 0); }
    }

    // ============ HUD
    const hudIn = E.outCubic(seg(t, 7.4, 8.2)) * (1 - E.inCubic(seg(t, 73.6, 74.2)));
    bug.style.opacity = hudIn; pills.forEach((p) => (p.style.opacity = hudIn));
    const active = t < 24 ? 0 : t < 62 ? 1 : 2;
    pills.forEach((p, k) => {
      p.classList.toggle('on', k === active && t > 10);
      const f = k < active ? 1 : k === active ? (k === 0 ? seg(t, 10, 24) : k === 1 ? seg(t, 24, 62) : seg(t, 62, 73)) : 0;
      pillFill[k].style.width = `${f * 100}%`;
    });
    const stepN = t < 26 ? 0 : t < 30.6 ? 1 : t < 37.5 ? 2 : t < 42.5 ? 3 : t < 48.5 ? 4 : t < 55.5 ? 5 : 6;
    const stepsOn = envl(t, 25.8, 26.3, 61.6, 62.1);
    steps.style.opacity = stepsOn * hudIn; steps.style.display = stepsOn > 0.003 ? '' : 'none';
    stepLbl.textContent = `PASSO ${Math.max(1, stepN)}/6`;
    stepBars.forEach((b, k) => { b.className = k + 1 < stepN ? 'done' : k + 1 === stepN ? 'on' : ''; });
    // subtitles
    {
      let cur = null; for (const s of SUBS) if (t >= s[0] && t <= s[1]) cur = s;
      const key = cur ? cur[3] : '';
      if (key !== subKey) { subKey = key; subS.innerHTML = key ? key.split(' ').map((w) => `<span class="w">${w} </span>`).join('') : ''; subK.textContent = cur ? cur[2] : ''; }
      if (cur) {
        [...subS.querySelectorAll('.w')].forEach((w, i) => { const u = E.outCubic(seg(t, cur[0] + i * 0.04, cur[0] + 0.35 + i * 0.04)); w.style.opacity = u * (1 - seg(t, cur[1] - 0.25, cur[1])); w.style.transform = `translateY(${(1 - u) * 14}px)`; });
        subK.style.opacity = E.outCubic(seg(t, cur[0], cur[0] + 0.4)) * (1 - seg(t, cur[1] - 0.25, cur[1]));
      }
      band.style.opacity = cur ? 1 : 0.6;
    }
    // opening typography
    show(tDts, envl(t, 2.5, 3.1, 4.4, 5.0), 0, (1 - E.outCubic(seg(t, 2.5, 3.2))) * 20);
    tDts.style.letterSpacing = `${0.42 + (1 - E.outCubic(seg(t, 2.5, 3.8))) * 0.35}em`;
    { const o = envl(t, 6.8, 7.2, 9.3, 9.7); hOpen.style.display = o > 0.003 ? '' : 'none'; hOpen.style.opacity = o;
      hOpenW.forEach((w, i) => { const u = E.outBack(seg(t, 6.8 + i * 0.08, 7.3 + i * 0.08)); w.style.opacity = clamp(u); w.style.transform = `translateY(${(1 - u) * 40}px)`; }); }
    show(tOpen, envl(t, 7.4, 7.9, 9.3, 9.7), 0, (1 - E.outCubic(seg(t, 7.4, 8.0))) * 16);
    // pillar title beats
    {
      let cur = null; for (const b of PILLAR_BEATS) if (t >= b[0] && t <= b[1]) cur = b;
      if (cur && cur[2] !== pillarKey) { pillarKey = cur[2]; kPTag.textContent = cur[2]; kPTag.style.color = cur[4]; kPLbl.textContent = cur[3]; }
      const o = cur ? envl(t, cur[0], cur[0] + 0.35, cur[1] - 0.35, cur[1]) : 0;
      show(kP, o, 0, (1 - o) * 20);
      if (cur) kPTag.style.letterSpacing = `${0.5 + (1 - E.outCubic(seg(t, cur[0], cur[0] + 0.9))) * 0.4}em`;
    }
    // counters
    {
      let o = 0, n = 0, lbl = '';
      if (t > 16.6 && t < 20.4) { o = envl(t, 16.6, 17.0, 19.9, 20.4); n = Math.round(441 * E.outExpo(seg(t, 16.7, 19.0))); lbl = 'skills prontas para <b>reuso</b>'; }
      if (t > 60.3 && t < 62.0) { o = envl(t, 60.3, 60.6, 61.6, 62.0); n = 442; lbl = '<b>+1</b> skill da DTS na Biblioteca'; }
      show(kC, o, 0, (1 - o) * 30, 0, 0, 0.92 + 0.08 * o);
      if (o > 0) { kCBig.textContent = n; if (kCLbl.innerHTML !== lbl) kCLbl.innerHTML = lbl; }
    }
    // callouts anchored to 3D points
    {
      const nm = project(mpt(MR.name.x + 34, MR.name.y + MR.name.h + 6));
      show(cPfx, envl(t, 35.7, 36.1, 37.0, 37.4), nm.x - 36, nm.y + 22);
      const wh = project(mpt(MR.where.x + 60, MR.where.y + MR.where.h + 40));
      show(cWhere, envl(t, 40.7, 41.1, 41.9, 42.3), wh.x - 36, wh.y + 22);
      const rq = project(mpt(MR.model.x + 128, MR.model.y - 14));
      show(cReq, envl(t, 42.8, 43.2, 43.6, 44.0), rq.x + 18, rq.y, 0, 0.5);
      const tm = project(mpt(MR.time.x + 60, MR.time.y + MR.time.h + 6));
      show(cOpt, envl(t, 47.5, 47.9, 48.1, 48.45), tm.x - 36, tm.y + 22);
      const rb = project([-330, 215, 70]);
      show(cRoot, envl(t, 50.35, 50.7, 51.8, 52.2), rb.x, rb.y - 40, 0.5, 1);
    }
    // end card
    {
      const o = envl(t, 74.0, 74.5, 77.3, 77.9);
      endc.style.display = o > 0.003 ? '' : 'none'; endc.style.opacity = o;
      endSpans.forEach((s, i) => { const u = E.outBack(seg(t, 74.0 + i * 0.35, 74.6 + i * 0.35)); s.style.opacity = clamp(u); s.style.transform = `translateY(${(1 - u) * 36}px) scale(${0.9 + 0.1 * u})`; });
      endL2.style.opacity = E.outCubic(seg(t, 75.2, 75.8)); endL3.style.opacity = E.outCubic(seg(t, 75.7, 76.3));
    }

    world.set({ time: t, focus: focusD, aperture, maxblur, bloom, fade, flash, flashCol, exposure: 1.0, rays: 1 });
  }
  return { duration: DURATION, update };
}
