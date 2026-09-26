// The film: every value below is a pure function of global time t (seconds).
import { E, clamp, lerp, seg, track, spline, env as envl, pulse, deg } from './util.js';
import * as UI from './ui.js';
import { icon, cursorSvg } from './icons.js';

export const DURATION = 72;
const VIEWS = ['v1', 'v8', 'v7', 'v6', 'v5', 'v4', 'v3', 'v2'];

export function buildTimeline(ctx) {
  const { THREE, env, cam, actor, place, project, character, fx, ov, grade, hudTop, hudBot, scene3, CSS3DObject } = ctx;
  const S = 180 / ctx.SHEET_H; // world units per sheet px
  const L = ctx.LOGICAL;

  // ---------------------------------------------------------------- actors
  const home = {
    bg: actor(Object.assign(document.createElement('div'), { className: 'appbg' }), { zoom: 1 }),
    side: actor(UI.sidebar(), { zoom: 1.6 }),
    top: actor(UI.topbar(), { zoom: 1.4 }),
    greet: actor(UI.greet(), { zoom: 1.5 }),
    lib: actor(UI.moduleCard('lib'), { zoom: 2.2 }),
    met: actor(UI.moduleCard('met'), { zoom: 2 }),
    prj: actor(UI.moduleCard('prj'), { zoom: 2 }),
    rank: actor(UI.ranking(), { zoom: 1.3 }),
  };
  // flat layout (px in the 1672x941 screenshot) -> exploded 3D layout
  const FLAT = { side: [8, 8], top: [296, 12], greet: [300, 96], lib: [318, 248], met: [766, 248], prj: [1215, 248], rank: [318, 426] };
  const BOOM = {
    side: { p: [-370, 168, -170], r: [0, 34, 0], w: 92 },
    top: { p: [0, 372, -300], r: [0, 0, 0], w: 360 },
    greet: { p: [0, 306, -280], r: [0, 0, 0], w: 380 },
    lib: { p: [-205, 196, -175], r: [0, 16, 0], w: 188 },
    met: { p: [0, 208, -225], r: [0, 0, 0], w: 188 },
    prj: { p: [205, 196, -175], r: [0, -16, 0], w: 188 },
    rank: { p: [430, 176, -80], r: [0, -46, 0], w: 290 },
  };
  const FLAT_C = [0, 250, -430], FLAT_W = 600, FLAT_S = FLAT_W / 1672;

  const RING_N = 16, RING_R = 820;
  const ring = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < RING_N; i++) {
    const s = UI.SKILLS[(i * 3 + row * 5) % UI.SKILLS.length];
    const a = actor(UI.skillCard(s), { zoom: 1 });
    a.outer.classList.add('bf');
    a.ang = ((i + row * 0.5) / RING_N) * 360 + 10;
    a.row = row;
    ring.push(a);
  }
  const libHead = actor(UI.libHeader(), { zoom: 1.4 });
  const chips = [['Origem', 'Todas'], ['Categoria', 'Todas'], ['Status', 'Todos os status'], ['Qualidade', 'Todas'], ['Especialização', 'Todas', 1]].map((c) => actor(UI.filterChip(c[0], c[1], !!c[2]), { zoom: 1.4 }));

  const pedEl = document.createElement('div');
  pedEl.innerHTML = `<div style="width:220px;height:300px;position:relative">
    <div style="position:absolute;left:0;right:0;bottom:0;height:270px;border-radius:0 0 110px 110px/0 0 34px 34px;background:linear-gradient(90deg,#141b4f 0%,#2b3a8f 38%,#3a4bb0 50%,#22307a 72%,#10164a 100%);box-shadow:inset 0 -10px 30px rgba(0,0,0,.35)"></div>
    <div style="position:absolute;left:0;right:0;top:0;height:68px;border-radius:50%;background:radial-gradient(ellipse at 50% 45%,#3b4fb8,#1f2c78 70%);box-shadow:0 0 0 4px rgba(255,205,120,.95),0 0 30px rgba(255,190,90,.9),inset 0 4px 10px rgba(255,255,255,.25)"></div></div>`;
  const ped = actor(pedEl, { zoom: 1 });
  const shareBtn = actor(UI.shareButton(), { zoom: 1.2 });
  const modalEl = UI.shareModal();
  const measBox = document.createElement('div'); measBox.style.cssText = 'position:absolute;left:-30000px;top:0'; document.body.appendChild(measBox);
  measBox.appendChild(modalEl);
  const MR = modalEl.fieldRects();
  const modal = actor(modalEl, { zoom: 2.3 });
  const models = [['Claude Haiku 4.5', 'H'], ['Claude Opus 4', 'O'], ['Claude Sonnet 4.5', 'S'], ['Claude Opus 4.5', 'O'], ['Claude Sonnet 5', 'S'], ['Claude Sonnet 4', 'S'], ['Claude Haiku 3.5', 'H']];
  const pills = models.map((m) => actor(UI.modelPill(m[0], m[1]), { zoom: 1.3 }));
  const SEL = 4;
  const files = [['SKILL.md', 'file', 1], ['README.md', 'file'], ['LICENSE', 'file'], ['scripts/', 'dir'], ['references/', 'dir'], ['assets/', 'dir']].map((f) => actor(UI.fileChip(f[0], f[1], !!f[2]), { zoom: 1.3 }));
  const newCardData = { t: '[DTS] - Change Management - Mapa de Impactos', area: ['network', 'DTS'], sc: 'Novo', d: 'Mapa de impactos da mudança: testada em Flows / Claude com Claude Sonnet 5. Pacote SKILL.zip com SKILL.md na raiz.', a: 'Vitorino, Victor', dt: '26/09/2026', s: [0, 0, 0] };
  const newCard = actor(UI.skillCard(newCardData, '<span class="new">NOVA</span>'), { zoom: 2 });
  newCard.outer.classList.add('bf');
  newCard.el.querySelector('.chip.score').innerHTML = `${icon('sparkles')}Nova`;

  // ZIP box: a hierarchy of CSS3D faces
  const box = new THREE.Group(); scene3.add(box);
  const BW = 70, BH = 52, BD = 58;
  const face = (w, h, cls, html = '') => {
    const d = document.createElement('div'); d.className = 'face ' + cls; d.style.width = w + 'px'; d.style.height = h + 'px'; d.innerHTML = html;
    const o = new CSS3DObject(d); o.rotation.order = 'YXZ'; box.add(o); return o;
  };
  const K = 4; // css px per world unit on box faces
  const fFront = face(BW * K, BH * K, 'cardboard', `<div class="zlabel">SKILL.zip</div>`);
  const fBack = face(BW * K, BH * K, 'cardboard dark');
  const fLeft = face(BD * K, BH * K, 'cardboard dark');
  const fRight = face(BD * K, BH * K, 'cardboard');
  const fBottom = face(BW * K, BD * K, 'cardboard dark');
  const flapF = new THREE.Group(), flapB = new THREE.Group(); box.add(flapF); box.add(flapB);
  const mkFlap = (g) => { const d = document.createElement('div'); d.className = 'face cardboard'; d.style.width = BW * K + 'px'; d.style.height = (BD / 2) * K + 'px'; d.innerHTML = '<div class="tape" style="top:0;height:100%;left:44%;right:44%"></div>'; const o = new CSS3DObject(d); o.scale.setScalar(1 / K); g.add(o); o.position.set(0, 0, BD / 4); o.rotation.x = -Math.PI / 2; return o; };
  mkFlap(flapF); mkFlap(flapB);
  for (const [o, p, r] of [[fFront, [0, 0, BD / 2], [0, 0, 0]], [fBack, [0, 0, -BD / 2], [0, 180, 0]], [fLeft, [-BW / 2, 0, 0], [0, -90, 0]], [fRight, [BW / 2, 0, 0], [0, 90, 0]], [fBottom, [0, -BH / 2, 0], [90, 0, 0]]]) {
    o.position.set(...p); o.rotation.set(r[0] * deg, r[1] * deg, r[2] * deg); o.scale.setScalar(1 / K);
  }
  box.visible = false;
  const boxParts = [fFront, fBack, fLeft, fRight, fBottom];

  // Character (canvas billboard) + contact shadow
  const cw = (L.x1 - L.x0) * S, chh = (L.y1 - L.y0) * S;
  const charWrap = document.createElement('div');
  character.canvas.style.width = cw + 'px'; character.canvas.style.height = chh + 'px'; character.canvas.style.display = 'block';
  charWrap.appendChild(character.canvas);
  const charObj = new CSS3DObject(charWrap); scene3.add(charObj);
  const shadow = actor(Object.assign(document.createElement('div'), { className: 'shadow' }), { zoom: 1 });

  // ---------------------------------------------------------------- overlays
  const OV = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); const el = d.firstElementChild; ov.appendChild(el); return el; };
  const titleTxt = 'Como compartilhar uma Skill';
  const kicker = OV(`<div class="title-kicker" style="top:470px">UM CURTA FLOWS</div>`);
  const title = OV(`<div class="title-main" style="top:500px">${[...titleTxt].map((c) => `<span class="ch">${c}</span>`).join('')}</div>`);
  const titleChars = [...title.querySelectorAll('.ch')];
  const logoWrap = OV(`<div class="logowrap" style="position:absolute;left:0;right:0;top:250px;perspective:900px"></div>`);
  const logoEl = UI.logo3d(); logoWrap.appendChild(logoEl);
  const logoLetters = [...logoEl.querySelectorAll('.l')], logoO = logoEl.querySelector('.o');
  const ringMain = logoO.querySelector('.ring-main'), ringHi = logoO.querySelector('.ring-hi');
  const RING_LEN = 2 * Math.PI * 38;
  ringMain.style.strokeDasharray = RING_LEN; ringHi.style.strokeDasharray = RING_LEN;
  const counter = OV(`<div class="count-wrap" style="left:0;width:1920px;top:250px"><div class="count-num">0</div><div class="count-lbl">skills na <b>Biblioteca</b> da comunidade</div></div>`);
  const countNum = counter.querySelector('.count-num');
  const callPrefix = OV(`<div class="callout"><span class="dot">${icon('sparkles')}</span>prefixo da área</div>`);
  const callWhere = OV(`<div class="callout soft"><span class="dot">${icon('check', '', 3)}</span>contexto da validação</div>`);
  const callReq = OV(`<div class="callout left"><span class="dot">*</span>obrigatório</div>`);
  const callOpt = OV(`<div class="callout soft"><span class="dot">${icon('clock')}</span>opcional · minutos na mão</div>`);
  const tree = OV(`<div class="tree" style="left:1380px;top:60px">
    <div class="row t0">${icon('folderzip')}<b>SKILL.zip</b></div>
    <div class="row t1">├─ <span class="hl">SKILL.md</span><span class="tag">RAIZ</span></div>
    <div class="row t2">├─ README.md</div><div class="row t3">├─ LICENSE</div>
    <div class="row t4">├─ scripts/</div><div class="row t5">├─ references/</div><div class="row t6">└─ assets/</div></div>`);
  const treeRows = [...tree.querySelectorAll('.row')];
  const toast = OV(`<div class="toast"><span class="ok">${icon('check', '', 3)}</span><div>Skill publicada para o time<small>Biblioteca de Skills · 442 skills</small></div></div>`);
  const outro1 = OV(`<div class="outro-line" style="top:430px">${['Compartilhe.', 'Valide.', 'Escale.'].map((w) => `<span class="w">${w} </span>`).join('')}</div>`);
  const outroWords = [...outro1.querySelectorAll('.w')];
  const outro2 = OV(`<div class="outro-sub" style="top:555px">Sua skill agora faz parte da Biblioteca do FLOWS</div>`);
  const cursor = OV(`<div class="cursor" style="position:absolute;left:0;top:0">${cursorSvg()}</div>`);
  const ripple = OV(`<div class="ripple"></div>`);

  grade.innerHTML = `<div class="vig" style="position:absolute;inset:0;background:radial-gradient(ellipse 75% 80% at 50% 50%,rgba(0,0,0,0) 55%,rgba(10,6,30,.55) 100%)"></div>
    <div class="flash" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#fff7e6,#ffe2b0 60%,#ffd08a);opacity:0"></div>
    <div class="fade" style="position:absolute;inset:0;background:#000;opacity:1"></div>`;
  const gFlash = grade.querySelector('.flash'), gFade = grade.querySelector('.fade');

  hudTop.innerHTML = `<div class="hud-brand"><b>FLOWS</b><span>Como compartilhar uma Skill</span></div>
    <div class="hud-prog"><span class="lbl">GUIA ANIMADO</span>${'<i><em></em></i>'.repeat(6)}</div>`;
  const hudLbl = hudTop.querySelector('.lbl'), hudBars = [...hudTop.querySelectorAll('.hud-prog em')];
  const hudBrand = hudTop.querySelector('.hud-brand'), hudProg = hudTop.querySelector('.hud-prog');
  hudBot.innerHTML = `<div class="hud-step"></div><div class="hud-sub"></div>`;
  const hudStep = hudBot.querySelector('.hud-step'), hudSub = hudBot.querySelector('.hud-sub');

  const SUBS = [
    [6.6, 12.8, 0, 'Tudo começa no Início: skills, métodos e projetos em um só lugar.'],
    [13.2, 17.4, 0, 'Abra a Biblioteca de Skills.'],
    [18.4, 25.8, 0, 'Na Biblioteca, a comunidade já reúne 441 skills prontas para reuso.'],
    [26.2, 31.3, 1, 'Clique em Compartilhar Skill.'],
    [31.6, 38.3, 2, 'Dê à skill um nome claro, com o prefixo da área.'],
    [38.6, 43.3, 3, 'Informe onde ela foi testada.'],
    [43.6, 49.3, 4, 'Escolha o modelo testado. O campo é obrigatório.'],
    [49.6, 56.8, 5, 'Envie tudo em um único ZIP, com o SKILL.md na raiz.'],
    [57.1, 63.6, 6, 'Avance em Próximo e publique para o time.'],
  ];
  let subKey = '';

  // ---------------------------------------------------------------- helpers
  const V = (a, b, u) => a.map((x, i) => lerp(x, b[i], u));
  const setCam = (pos, tgt, fov = 28, roll = 0) => {
    cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(0, 1, 0); cam.lookAt(tgt[0], tgt[1], tgt[2]);
    if (roll) cam.rotateZ(roll * deg);
    cam.fov = fov;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
  };
  const faceYaw = (p, c) => Math.atan2(c[0] - p[0], c[2] - p[2]) / deg;
  const camPos = () => [cam.position.x, cam.position.y, cam.position.z];
  // modal local px (1x) -> world
  const MODAL = { p: [335, 228, -110], yaw: -6, w: 270 };
  const PED = [150, 0, 70];
  const modalPt = (x, y) => {
    const s = MODAL.w / MR.W; const lx = (x - MR.W / 2) * s, ly = -(y - MR.H / 2) * s;
    const r = MODAL.yaw * deg;
    return [MODAL.p[0] + lx * Math.cos(r), MODAL.p[1] + ly, MODAL.p[2] - lx * Math.sin(r)];
  };
  const modalNormal = () => [Math.sin(MODAL.yaw * deg), 0, Math.cos(MODAL.yaw * deg)];
  const fieldC = (f, dx = 0, dy = 0) => modalPt(MR[f].x + MR[f].w / 2 + dx, MR[f].y + MR[f].h / 2 + dy);
  const camOnPoint = (pt, dist, yawOff = 0, pitch = 0, side = 0) => {
    const n = modalNormal(); const r = yawOff * deg;
    const dir = [n[0] * Math.cos(r) + n[2] * Math.sin(r), Math.sin(pitch * deg), -n[0] * Math.sin(r) + n[2] * Math.cos(r)];
    return [pt[0] + dir[0] * dist + side, pt[1] + dir[1] * dist, pt[2] + dir[2] * dist];
  };
  const posOv = (el, x, y, op = 1, sc = 1, ax = 0, ay = 0.5) => {
    el.style.opacity = op; el.style.display = op > 0.003 ? '' : 'none';
    if (op > 0.003) el.style.transform = `translate(${x}px,${y}px) translate(${-ax * 100}%,${-ay * 100}%) scale(${sc})`;
  };

  // character state computed per frame
  function drawCharacter(t, st) {
    const p = st.pos;
    const cp = camPos();
    const phi = Math.atan2(cp[0] - p[0], cp[2] - p[2]) / deg;
    let alpha = (((st.yaw || 0) - phi) % 360 + 540) % 360 - 180; // (-180,180]
    const idx = ((Math.round(alpha / 45) % 8) + 8) % 8;
    const view = st.view || VIEWS[idx];
    const visible = (st.op ?? 1) > 0.003;
    charObj.visible = visible;
    if (!visible) { shadow.o.visible = false; return; }
    const bob = st.bob || 0;
    charObj.position.set(p[0], p[1] + bob + 445 * S * (st.scale || 1), p[2]);
    charObj.rotation.set(0, phi * deg, 0);
    charObj.scale.setScalar(st.scale || 1);
    const top = project([p[0], p[1] + 180, p[2]]), bot = project([p[0], p[1], p[2]]);
    const hpx = Math.abs(bot.y - top.y) * (st.scale || 1);
    const k = clamp((hpx / ctx.SHEET_H) * 1.25, 0.2, 2.1);
    character.render({ view, pose: st.pose, k, squash: st.squash, lean: st.lean, rim: st.rim ?? 1, flash: st.flash || 0, fogAmt: st.fog || 0, expo: st.expo || 1 });
    charWrap.style.opacity = (st.op ?? 1) >= 0.999 ? '' : st.op;
    place(shadow, { p: [p[0], p[1] + 0.6, p[2]], r: [-90, 0, 0], w: 150 * (1 - clamp(bob / 120) * 0.5), op: (st.op ?? 1) * (st.shadowOp ?? 1) * (1 - clamp(bob / 160)), aa: false });
  }

  // idle micro-motion + gestures (degrees)
  const idlePose = (t) => ({ head: Math.sin(t * 0.9) * 1.2, uA: Math.sin(t * 1.1) * 1.5, fA: 2 + Math.sin(t * 1.3) * 1.5, uB: -Math.sin(t * 1.05 + 1) * 1.5, fB: -2 - Math.sin(t * 1.2 + 2) * 1.5, hA: 0, hB: 0 });
  const mix = (a, b, u) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] || 0, b[k] || 0, u); return o; };
  const WAVE = (t) => ({ uA: 118, fA: 62 + Math.sin(t * 11) * 17, hA: Math.sin(t * 11 - 0.6) * 8, head: -3 });
  const POINT_L = { uA: 112, fA: 8, hA: 6, head: -4 };
  const REACH_R = { uB: -74, fB: -12, hB: -8, head: 3 };
  const PRESENT_R = { uB: -52, fB: -40, hB: -12, head: 4 };
  const CHEER = (t) => ({ uA: 128 + Math.sin(t * 9) * 5, fA: 38 + Math.sin(t * 9) * 8, uB: -128 - Math.sin(t * 9 + 0.5) * 5, fB: -38 - Math.sin(t * 9 + 0.5) * 8, head: Math.sin(t * 4.5) * 3 });
  const gesture = (t, base, g, a, b, c, d) => mix(base, typeof g === 'function' ? g(t) : g, envl(t, a, b, c, d, 'inOutCubic', 'inOutCubic'));

  // ---------------------------------------------------------------- update
  function update(t) {
    fx.clear();
    const waves = []; let beam = 0, flash = 0, fade = 0, bloom = 0.85, spot = [0, 0, 170, 0.5];
    let camShake = pulse(t, 28.3, 0.04, 0.18) * 1.2 + pulse(t, 61.2, 0.05, 0.3) * 0.8;

    // ======== CAMERA
    if (t < 13) {
      const P = spline([[0, [0, 1150, 4300]], [3, [0, 560, 2750]], [6.2, [0, 290, 1500]], [8.6, [0, 212, 930]], [10.8, [60, 198, 720]], [13, [130, 192, 610]]], t, 'linear');
      const T = spline([[0, [0, 640, 0]], [3, [0, 330, 0]], [6.2, [0, 200, 0]], [8.6, [0, 182, -120]], [10.8, [-10, 168, -120]], [13, [-50, 160, -120]]], t, 'linear');
      setCam(P, T, 28);
    } else if (t < 18) {
      const u = seg(t, 13, 18);
      const libP = [-205, 196, -175];
      const cardFly = E.inOutCubic(seg(t, 14.6, 16.2));
      const base = [130, 192, 610], baseT = [-50, 160, -120];
      const cardPos = V(libP, [20, 190, 330], cardFly);
      const push = E.inExpo(seg(t, 16.1, 17.7));
      const P = V(V(base, [100, 192, 600], E.inOutSine(seg(t, 13, 16))), [cardPos[0] + 4, cardPos[1] + 2, cardPos[2] + 70], push);
      const T = V(V(baseT, cardPos, cardFly * 0.7), cardPos, push);
      setCam(P, T, 28 + push * 6);
    } else if (t < 26) {
      const P = spline([[18, [0, 2900, 70]], [20.2, [240, 1500, 560]], [22.8, [170, 430, 590]], [26, [110, 214, 560]]], t, 'inOutSine');
      const T = spline([[18, [0, 0, 0]], [20.2, [0, 60, -40]], [22.8, [0, 200, -260]], [26, [70, 185, -150]]], t, 'inOutSine');
      setCam(P, T, track([[18, 36], [21, 30], [26, 28]], t));
    }

    // ======== CAMERA S4..S10
    if (t >= 26 && t < 31.5) {
      const P = spline([[26, [110, 214, 560]], [27.6, [70, 190, 470]], [29.0, [120, 208, 560]], [30.5, [210, 236, 880]], [31.5, [250, 250, 560]]], t, 'inOutSine');
      const T = spline([[26, [70, 185, -150]], [27.6, [85, 145, 0]], [29.0, [170, 175, -20]], [30.5, [250, 222, -100]], [31.5, [300, 280, -100]]], t, 'inOutSine');
      setCam(P, T, 28);
    }
    if (t >= 31.5 && t < 49.5) {
      const nameP = fieldC('name', -60), whereP = fieldC('where', -40), modelP = fieldC('model', 0), timeP = fieldC('time', -40);
      const camName = camOnPoint(nameP, 300, 16, 4), camWhere = camOnPoint(whereP, 310, -12, 6), camModel = camOnPoint(V(modelP, [modelP[0] + 120, modelP[1], modelP[2]], 0.6), 420, 10, 3), camTime = camOnPoint(timeP, 330, -8, 2);
      const P = spline([[31.5, [250, 250, 560]], [32.6, camName], [37.8, V(camName, camOnPoint(nameP, 260, 10, 2), 1)], [39.2, camWhere], [43.2, camOnPoint(whereP, 290, -4, 4)], [44.4, camModel], [47.6, camOnPoint(V(modelP, modalPt(MR.W + 60, MR.model.y + MR.model.h / 2), 0.5), 430, 4, 2)], [48.4, camTime], [49.5, camOnPoint(timeP, 320, -4, 2)]], t, 'linear');
      const T = spline([[31.5, [300, 280, -100]], [32.6, nameP], [37.8, nameP], [39.2, whereP], [43.2, whereP], [44.4, V(modelP, modalPt(MR.W + 120, MR.model.y + MR.model.h / 2), 0.5)], [47.6, V(modelP, modalPt(MR.W + 60, MR.model.y + MR.model.h / 2), 0.5)], [48.4, timeP], [49.5, timeP]], t, 'linear');
      setCam(P, T, 28);
    }
    if (t >= 49.5 && t < 57) {
      const fileP = fieldC('file'), boxP = [PED[0], 100 + BH / 2, PED[2]];
      const mid = V(fileP, boxP, 0.45);
      const P = spline([[49.5, camOnPoint(fieldC('time', -40), 320, -4, 2)], [50.6, [mid[0] - 40, 230, 520]], [54.2, [mid[0] - 10, 215, 480]], [55.4, camOnPoint(fileP, 330, -6, 3)], [57, camOnPoint(fieldC('next'), 360, -4, 2)]], t, 'linear');
      const T = spline([[49.5, fieldC('time', -40)], [50.6, [mid[0] + 10, 170, mid[2]]], [54.2, [mid[0] + 20, 165, mid[2]]], [55.4, fileP], [57, fieldC('next')]], t, 'linear');
      setCam(P, T, 28);
    }
    if (t >= 57 && t < 64) {
      const nextP = fieldC('next');
      const mC = modalPt(MR.W / 2, MR.H * 0.45);
      const P = spline([[57, camOnPoint(nextP, 360, -4, 2)], [57.95, camOnPoint(nextP, 345, 0, 2)], [58.75, camOnPoint(mC, 930, 0, 3)], [59.8, [260, 250, 560]], [61.2, [120, 225, 600]], [64, [40, 250, 640]]], t, 'linear');
      const T = spline([[57, nextP], [57.95, nextP], [58.75, mC], [59.8, [120, 230, -300]], [61.2, [30, 185, -300]], [64, [0, 190, -300]]], t, 'linear');
      setCam(P, T, 28 + seg(t, 59.5, 61) * 4);
    }
    if (t >= 64) {
      const P = spline([[64, [40, 250, 640]], [66.5, [0, 700, 700]], [72, [0, 1500, 900]]], t, 'inOutSine');
      const T = spline([[64, [0, 190, -300]], [66.5, [0, 160, -380]], [72, [0, 60, -300]]], t, 'inOutSine');
      setCam(P, T, 32);
    }

    if (camShake > 0.001) {
      const sh = camShake * 3;
      cam.position.x += Math.sin(t * 90) * sh; cam.position.y += Math.cos(t * 77) * sh;
      cam.updateMatrixWorld(true);
    }

    // ======== S0 intro
    fade = 1 - E.outQuad(seg(t, 0, 1.4));
    fx.star(t, 0.5, 1.55, [260, 1900, -600], [0, 60, 0]);
    if (t > 1.55 && t < 4.5) waves.push([0, 0, E.outCubic(seg(t, 1.55, 3.9)) * 1000, 1 - seg(t, 1.6, 4.4)]);
    beam = envl(t, 1.5, 1.75, 2.0, 3.0, 'outQuad', 'inOutQuad') * 0.42;
    const logoIn = (i) => E.outBack(seg(t, 2.8 + i * 0.13, 3.35 + i * 0.13));
    const titleOut = E.inCubic(seg(t, 5.6, 6.3));
    {
      const k = envl(t, 1.3, 2.1, 5.5, 6.1);
      kicker.style.opacity = k; kicker.style.letterSpacing = `${0.42 + (1 - E.outCubic(seg(t, 1.3, 2.4))) * 0.5}em`;
      kicker.style.display = k > 0.003 ? '' : 'none';
      titleChars.forEach((c, i) => {
        const u = E.outCubic(seg(t, 1.75 + i * 0.028, 2.45 + i * 0.028));
        const o = u * (1 - E.inCubic(seg(t, 5.55 + i * 0.012, 6.0 + i * 0.012)));
        c.style.opacity = o; c.style.transform = `translateY(${(1 - u) * 34 + E.inCubic(seg(t, 5.55 + i * 0.012, 6.0 + i * 0.012)) * -26}px)`;
        c.style.filter = u < 0.999 ? `blur(${(1 - u) * 8}px)` : '';
      });
      title.style.display = t > 1.7 && t < 6.3 ? '' : 'none';
      logoWrap.style.display = t > 2.7 && t < 6.4 ? '' : 'none';
      logoLetters.forEach((l, i) => {
        const u = logoIn(i < 2 ? i : i + 1);
        l.style.opacity = clamp(u * 1.5);
        l.style.transform = `translateY(${(1 - u) * -120}px) rotateX(${(1 - u) * 80}deg) scale(${0.7 + 0.3 * u})`;
      });
      const ru = E.inOutCubic(seg(t, 3.0, 3.9));
      ringMain.style.strokeDashoffset = RING_LEN * (1 - ru); ringHi.style.strokeDashoffset = RING_LEN * (1 - ru);
      logoO.style.transform = `rotate(${-90 + ru * 90 + Math.sin(t * 1.5) * 4}deg) scale(${0.8 + 0.2 * E.outBack(seg(t, 3.0, 3.6))})`;
      const lo = 1 - titleOut;
      logoWrap.style.opacity = lo;
      logoWrap.style.transform = `translateY(${Math.sin(t * 1.2) * 4 - titleOut * 60}px) scale(${1 - titleOut * 0.2})`;
      if (t > 3.8 && t < 4.6) fx.flare(960, 300, 1.1, pulse(t, 3.9, 0.06, 0.25));
    }

    // ======== HUD
    const hudIn = E.outCubic(seg(t, 4.6, 5.6)) * (1 - E.inCubic(seg(t, 70.0, 71.0)));
    hudBrand.style.opacity = hudIn; hudProg.style.opacity = hudIn;
    hudBrand.style.transform = `translateX(${(1 - hudIn) * -30}px)`;
    let stepIdx = 0;
    for (const s of SUBS) if (t >= s[0] - 0.2 && s[2]) stepIdx = s[2];
    const stepsDone = t > 63.8 ? 6 : stepIdx;
    hudLbl.textContent = stepIdx && t < 64 ? `PASSO ${stepIdx} DE 6` : 'GUIA ANIMADO';
    hudBars.forEach((b, i) => {
      let fill = 0;
      for (const s of SUBS) if (s[2] === i + 1) fill = E.outCubic(seg(t, s[0] - 0.2, s[0] + 0.5));
      if (t > 63.8) fill = 1;
      b.style.width = `${fill * 100}%`;
      b.style.opacity = i + 1 === stepIdx && t < 64 ? 1 : 0.72;
    });
    {
      let cur = null;
      for (const s of SUBS) if (t >= s[0] && t <= s[1]) cur = s;
      const key = cur ? cur[3] : '';
      if (key !== subKey) {
        subKey = key;
        hudSub.innerHTML = key ? key.split(' ').map((w) => `<span class="w">${w} </span>`).join('') : '';
        hudStep.textContent = cur && cur[2] ? `PASSO ${cur[2]}` : '';
      }
      if (cur) {
        const ws = [...hudSub.querySelectorAll('.w')];
        ws.forEach((w, i) => { const u = E.outCubic(seg(t, cur[0] + i * 0.045, cur[0] + 0.35 + i * 0.045)); w.style.opacity = u * (1 - seg(t, cur[1] - 0.25, cur[1])); w.style.transform = `translateY(${(1 - u) * 12}px)`; });
        hudStep.style.opacity = E.outCubic(seg(t, cur[0], cur[0] + 0.4)) * (1 - seg(t, cur[1] - 0.25, cur[1]));
        hudStep.style.letterSpacing = `${0.32 + (1 - E.outCubic(seg(t, cur[0], cur[0] + 0.6))) * 0.3}em`;
      }
    }

    // ======== HOME (S1/S2)
    const homeOn = t > 5.6 && t < 18.2;
    const flatIn = E.outCubic(seg(t, 5.9, 7.0));
    const boom = (i) => E.inOutBack(seg(t, 7.1 + i * 0.1, 8.5 + i * 0.1));
    const homeOut = E.inCubic(seg(t, 15.0, 16.4));
    const keys = ['side', 'top', 'greet', 'lib', 'met', 'prj', 'rank'];
    const libGlow = envl(t, 13.6, 14.2, 16.4, 17.0);
    if (homeOn) {
      place(home.bg, { p: [FLAT_C[0], FLAT_C[1] - (1 - flatIn) * 40 - E.inCubic(seg(t, 7.1, 8.3)) * 60, FLAT_C[2] - E.inCubic(seg(t, 7.1, 8.3)) * 200], w: FLAT_W, op: flatIn * (1 - seg(t, 7.2, 8.2)) });
      home.bg.el.style.clipPath = `inset(0 0 ${(1 - flatIn) * 100}% 0 round 26px)`;
      keys.forEach((k, i) => {
        const a = home[k];
        const fl = FLAT[k];
        const fx0 = FLAT_C[0] + (fl[0] + a.w / 2 - 836) * FLAT_S, fy0 = FLAT_C[1] - (fl[1] + a.h / 2 - 470) * FLAT_S;
        const flatP = [fx0, fy0, FLAT_C[2] + 2], flatW = a.w * FLAT_S;
        const b = BOOM[k];
        const u = boom(i);
        let p = V(flatP, b.p, u), r = V([0, 0, 0], b.r, u), w = lerp(flatW, b.w, u);
        p = [p[0], p[1] + Math.sin(t * 0.8 + i) * 3 * u, p[2]];
        let op = flatIn * (1 - homeOut);
        let dof = 0;
        if (k === 'lib') {
          const fly = E.inOutCubic(seg(t, 14.6, 16.2));
          p = V(p, [20, 190, 330], fly);
          const cp = camPos();
          const yawTo = faceYaw(p, cp);
          r = [0, lerp(r[1], yawTo, fly), 0];
          w = lerp(w, 170, fly);
          op = flatIn;
          a.el.style.boxShadow = libGlow > 0.01 ? `0 0 0 ${3 * libGlow}px rgba(255,190,90,${0.9 * libGlow}),0 0 ${60 * libGlow}px rgba(255,180,80,${0.8 * libGlow}),0 18px 40px rgba(24,50,110,.16)` : '';
        } else {
          dof = seg(t, 14.4, 15.4) * 3;
          p = [p[0] + (p[0] - 0) * homeOut * 0.6, p[1] - homeOut * 30, p[2] - homeOut * 200];
        }
        place(a, { p, r, w, op, dof });
      });
    } else { home.bg.o.visible = false; keys.forEach((k) => (home[k].o.visible = false)); }
    // click on the Biblioteca card
    let curOp = 0, curX = 0, curY = 0, rip = -1, ripX = 0, ripY = 0;
    if (t > 13.6 && t < 15.2) {
      const tgtS = project([-214, 210, -172]);
      const u = E.inOutCubic(seg(t, 13.6, 14.3));
      curX = lerp(1500, tgtS.x, u); curY = lerp(700, tgtS.y, u);
      curOp = envl(t, 13.6, 13.8, 14.7, 15.1);
      if (t > 14.35) { rip = seg(t, 14.35, 14.9); ripX = tgtS.x; ripY = tgtS.y; }
    }
    if (t > 16.8 && t < 18.8) flash = Math.max(flash, envl(t, 16.8, 17.55, 17.7, 18.8, 'inQuad', 'outQuad'));

    // ======== LIBRARY ring (S3 → S10)
    const ringOn = t > 17.4;
    const ringRise = (i) => E.outBack(seg(t, 18.2 + (i % RING_N) * 0.05 + ring[i].row * 0.2, 19.2 + (i % RING_N) * 0.05 + ring[i].row * 0.2));
    ring.forEach((a, i) => {
      if (!ringOn) { a.o.visible = false; return; }
      const ang = a.ang * deg, u = ringRise(i);
      const R = RING_R + (1 - u) * 180;
      const y = (a.row ? 262 : 124) - (1 - u) * 160 + Math.sin(t * 0.7 + i) * 3;
      const p = [Math.sin(ang) * R, y, -Math.cos(ang) * R];
      const yaw = Math.atan2(-p[0], -p[2]) / deg;
      place(a, { p, r: [-10, yaw, 0], w: 172, op: clamp(u * 1.4) * (1 - seg(t, 70.5, 71.5)), dof: t > 31 && t < 57.5 ? 1.6 : 0 });
    });
    // Library header + chips
    {
      const hi = E.outBack(seg(t, 21.0, 22.0)), ho = 1 - seg(t, 64.3, 65.0);
      const hp = [0, 392 + (1 - hi) * 60, -600];
      place(libHead, { p: hp, r: [0, 0, 0], w: 470, op: hi * ho * (t > 17.8 ? 1 : 0), dof: t > 31 && t < 57.5 ? 1.2 : 0 });
      const cnt = t < 61.1 ? 441 : 442;
      libHead.el.querySelector('.cn').textContent = cnt;
      libHead.el.querySelector('.cnt').style.boxShadow = t > 61.1 && t < 62.6 ? `0 0 0 ${6 * (1 - seg(t, 61.1, 62.6))}px rgba(52,196,124,.7)` : '';
      chips.forEach((c, i) => {
        const u = E.outBack(seg(t, 21.4 + i * 0.1, 22.2 + i * 0.1));
        const x = (i - 2) * 118;
        place(c, { p: [x, 340 - (1 - u) * 40, -560], r: [0, 0, 0], w: c.w / 330 * 110, op: u * ho * (t > 17.8 ? 1 : 0), dof: t > 31 && t < 57.5 ? 1.2 : 0 });
      });
    }
    // 441 counter overlay
    {
      const u = E.outExpo(seg(t, 18.7, 20.9));
      const inn = E.outCubic(seg(t, 18.5, 19.1)), out = E.inCubic(seg(t, 21.6, 22.4));
      countNum.textContent = Math.round(441 * u);
      const tgt = project([0, 410, -600]);
      const x = lerp(0, tgt.x - 960, out), y = lerp(0, tgt.y - 330, out);
      counter.style.display = inn > 0.003 && out < 0.999 ? '' : 'none';
      counter.style.opacity = inn * (1 - out);
      counter.style.transform = `translate(${x}px,${y}px) scale(${lerp(0.9 + 0.1 * inn, 0.25, out)})`;
    }

    // ======== CHARACTER
    let cst = { pos: [0, 0, 0], yaw: 0, pose: idlePose(t), op: 0 };
    if (t >= 1.7) {
      const app = E.outBack(seg(t, 1.75, 2.5));
      cst.op = clamp(seg(t, 1.7, 2.0) * 1.2);
      cst.flash = 1 - seg(t, 1.8, 2.7);
      cst.squash = [lerp(0.6, 1, app), lerp(1.35, 1, app)];
      let pose = idlePose(t);
      pose = gesture(t, pose, WAVE, 8.7, 9.2, 10.3, 10.8);
      pose = gesture(t, pose, POINT_L, 13.1, 13.6, 14.9, 15.5);
      pose = gesture(t, pose, REACH_R, 27.2, 28.2, 28.6, 29.4);
      pose = gesture(t, pose, PRESENT_R, 29.6, 30.2, 31.2, 31.8);
      pose = gesture(t, pose, PRESENT_R, 49.7, 50.2, 50.9, 51.4);
      pose = gesture(t, pose, CHEER, 61.0, 61.4, 63.2, 63.9);
      cst.pose = pose;
      // hops for the cheer
      const hop = Math.max(0, Math.sin(seg(t, 61.2, 62.0) * Math.PI)) * 34 + Math.max(0, Math.sin(seg(t, 62.05, 62.6) * Math.PI)) * 16;
      cst.bob = hop;
      if (t > 61 && t < 62.8) {
        const sq = pulse(t, 61.15, 0.05, 0.12) - pulse(t, 61.9, 0.05, 0.12) * 0.6;
        cst.squash = [1 + sq * 0.08, 1 - sq * 0.08];
      }
      // turn toward the Biblioteca card and back (head/eyes read)
      cst.yaw = 0;
      cst.rim = 1;
      cst.fog = t > 18 && t < 23 ? 0.12 * (1 - seg(t, 20, 23)) : 0;
    }
    if (t > 16.4 && t < 18.3) cst.op *= 1 - seg(t, 16.4, 17.0);
    // character stands still at center for the whole film
    drawCharacter(t, cst);

    // ======== STEP 1: pedestal + button
    {
      const rise = E.outBack(seg(t, 26.2, 27.1)), sink = E.inBack(seg(t, 56.5, 57.3));
      const on = t > 26.1 && t < 57.4;
      const pedH = 100;
      const py = -pedH * (1 - rise) - sink * pedH;
      const cp = camPos();
      if (on) {
        place(ped, { p: [PED[0], py + pedH * 0.5 + 12, PED[2]], r: [0, faceYaw(PED, cp), 0], w: 64, op: clamp(rise * 3) });
      } else ped.o.visible = false;
      const bIn = E.outBack(seg(t, 26.7, 27.4)), bOut = E.inCubic(seg(t, 29.0, 29.6));
      const press = pulse(t, 28.25, 0.06, 0.22);
      if (t > 26.6 && t < 29.7) {
        place(shareBtn, { p: [PED[0], py + pedH + 38 - press * 6 + Math.sin(t * 2) * 2, PED[2] + press * -4], r: [-10, faceYaw(PED, cp), 0], w: 150 * (1 - press * 0.06) * (1 - bOut * 0.6), op: bIn * (1 - bOut) });
        shareBtn.el.style.filter = press > 0.01 ? `brightness(${1 + press * 0.5})` : '';
      } else shareBtn.o.visible = false;
      if (t > 28.2 && t < 30) {
        waves.push([PED[0], PED[2], E.outCubic(seg(t, 28.25, 29.6)) * 520, 1 - seg(t, 28.3, 29.7)]);
        fx.sparks(t, 28.25, [PED[0] - 20, py + pedH + 40, PED[2]], { n: 46, seed: 5, speed: 300 });
        fx.flare(project([PED[0] - 20, pedH + 40, PED[2]]).x, project([PED[0] - 20, pedH + 40, PED[2]]).y, 0.8, pulse(t, 28.25, 0.04, 0.3));
      }
      if (on) spot = [PED[0], PED[2], 90, 0.6 * rise * (1 - sink)];
    }

    // ======== MODAL (S4..S9)
    const mIn = E.outBack(seg(t, 28.8, 29.9)), mFold = E.inBack(seg(t, 58.9, 59.45));
    if (t > 28.7 && t < 59.75) {
      const from = [PED[0], 150, PED[2]];
      const p = V(from, MODAL.p, mIn);
      const flip = (1 - mIn) * 80;
      const nb = fieldC('next');
      place(modal, { p: V(p, [nb[0], nb[1], nb[2] + 10], clamp(mFold)), r: [0, MODAL.yaw + flip, 0], w: MODAL.w * lerp(0.15, 1, clamp(mIn)) * (1 - clamp(mFold) * 0.8), op: clamp(mIn * 2) * (1 - seg(t, 59.3, 59.45)) });
      if (t > 59.2 && t < 60.3) { const s0 = project(nb); fx.flare(s0.x, s0.y, 1.3, pulse(t, 59.4, 0.05, 0.4)); fx.sparks(t, 59.4, nb, { n: 36, seed: 31, speed: 220 }); }
    } else modal.o.visible = false;

    // modal state machine
    {
      const name = '[DTS] - Change Management - Mapa de Impactos';
      const nameN = Math.floor(clamp(seg(t, 32.3, 36.2)) * name.length);
      const whereTxt = t < 40.9 ? 'Flows / Claude'.slice(0, Math.floor(clamp(seg(t, 38.9, 39.45)) * 3)) : 'Flows / Claude';
      const caret = Math.floor(t * 2.4) % 2 === 0 || (t > 32.3 && t < 36.3) || (t > 38.9 && t < 39.5) || (t > 48.2 && t < 48.8);
      let focus = '';
      if (t > 31.9 && t < 37.9) focus = 'name';
      else if (t > 38.7 && t < 41.3) focus = 'where';
      else if (t > 44.2 && t < 47.6) focus = 'model';
      else if (t > 48.0 && t < 49.4) focus = 'time';
      const st = {
        name: name.slice(0, nameN), where: t > 38.85 ? whereTxt : '', whereFilled: t > 40.9, whereHint: t > 41.5 && t < 43.4,
        dd: t > 39.5 && t < 41.2 ? E.outCubic(seg(t, 39.5, 39.75)) * (1 - seg(t, 40.95, 41.2)) : 0,
        ddHi: t > 40.2 ? 1 : 0,
        model: t > 47.82 ? 'Claude Sonnet 5' : '', modelOk: t > 47.86, reqPulse: t > 43.6 && t < 44.8 ? Math.abs(Math.sin((t - 43.6) * 7)) : 0,
        time: '120'.slice(0, Math.floor(clamp(seg(t, 48.2, 48.75)) * 3)),
        mode: E.inOutCubic(seg(t, 50.0, 50.35)), file: t > 55.3 ? 'SKILL.zip' : '',
        stepP: E.inOutCubic(seg(t, 58.0, 58.6)), press: pulse(t, 57.9, 0.05, 0.2), focus, caret, pfx: t > 36.3 && t < 38.3,
      };
      modal.el.setState(st);
    }

    // callouts
    {
      const pre = project(modalPt(MR.name.x + 34, MR.name.y + MR.name.h));
      posOv(callPrefix, pre.x - 34, pre.y + 22, E.outBack(seg(t, 36.4, 36.9)) * (1 - seg(t, 37.9, 38.3)), 1, 0, 0);
      const wh = project(modalPt(MR.where.x + MR.where.w * 0.12, MR.where.y + MR.where.h));
      posOv(callWhere, wh.x - 34, wh.y + 70, E.outBack(seg(t, 41.6, 42.1)) * (1 - seg(t, 43.0, 43.4)), 1, 0, 0);
      const rq = project(modalPt(MR.model.x + 128, MR.model.y - 16));
      posOv(callReq, rq.x + 24, rq.y, E.outBack(seg(t, 43.7, 44.1)) * (1 - seg(t, 44.8, 45.2)), 1, 0, 0.5);
      const op = project(modalPt(MR.time.x + MR.time.w * 0.18, MR.time.y + MR.time.h));
      posOv(callOpt, op.x - 34, op.y + 20, E.outBack(seg(t, 48.4, 48.9)) * (1 - seg(t, 49.2, 49.6)), 1, 0, 0);
    }

    // ======== MODEL drum (S7)
    {
      const on = t > 44.3 && t < 48.2;
      const open = E.outBack(seg(t, 44.35, 44.95)), close = E.inCubic(seg(t, 47.5, 48.1));
      const spin = t < 44.9 ? 0 : E.outQuint(seg(t, 44.9, 46.9));
      const rot = lerp(-3.2, 0, spin); // in item units (drum angle)
      const center = modalPt(MR.W + 175, MR.model.y + MR.model.h / 2);
      const n = modalNormal();
      pills.forEach((a, i) => {
        if (!on) { a.o.visible = false; return; }
        const k = i - SEL + rot;
        const ang = k * 34;
        const Rr = 150;
        const y = center[1] + Math.sin(-ang * deg) * Rr * 0.95;
        const z = Math.cos(ang * deg) * Rr - Rr;
        const p = [center[0] + n[0] * (z + 30) , y, center[2] + n[2] * (z + 30)];
        const vis = Math.abs(ang) < 95;
        const selFly = i === SEL ? E.inOutCubic(seg(t, 47.3, 47.8)) : 0;
        const pf = V(p, fieldC('model', -40), selFly);
        place(a, { p: pf, r: [ang * (1 - selFly), MODAL.yaw, 0], w: 200 * (1 - selFly * 0.3), op: (vis ? clamp(open * 1.3) : 0) * (i === SEL ? 1 - seg(t, 47.72, 47.82) : 1 - close) * clamp(1 - Math.abs(ang) / 100) });
        a.el.classList.toggle('on', i === SEL && t > 46.7);
      });
      if (t > 46.7 && t < 47.4) { const c = project(center); fx.flare(c.x, c.y, 0.6, pulse(t, 46.75, 0.05, 0.3)); }
    }

    // ======== ZIP box + files (S8)
    {
      const on = t > 49.7 && t < 55.8;
      box.visible = on;
      boxParts.forEach((o) => (o.visible = on)); flapF.children[0].visible = on; flapB.children[0].visible = on;
      if (on) {
        const pop = E.outBack(seg(t, 49.75, 50.35));
        const toField = E.inOutCubic(seg(t, 54.6, 55.5));
        const land = (i) => pulse(t, 50.95 + i * 0.44, 0.05, 0.15);
        let bounce = 0; for (let i = 0; i < 6; i++) bounce += land(i);
        const base = [PED[0], 100 + BH / 2, PED[2]];
        const fp = fieldC('file', -120);
        const p = V(base, fp, toField);
        const cp = camPos();
        box.position.set(p[0], p[1] + Math.sin(t * 2.2) * 1.5 - bounce * 3, p[2]);
        box.rotation.set(0, (faceYaw(base, cp) - 22 + Math.sin(t * 0.8) * 3) * deg, 0);
        const sc = pop * (1 - toField * 0.8);
        box.scale.set(sc * (1 + bounce * 0.05), sc * (1 - bounce * 0.05), sc * (1 + bounce * 0.05));
        const lid = E.inOutBack(seg(t, 53.7, 54.3));
        flapF.position.set(0, BH / 2, BD / 2); flapB.position.set(0, BH / 2, -BD / 2);
        flapF.rotation.x = (-lerp(110, 0, lid)) * deg; flapB.rotation.x = (180 + lerp(110, 0, lid)) * deg;
        if (t > 54.3 && t < 55.2) fx.sparks(t, 54.3, [p[0], p[1] + 40, p[2]], { n: 30, seed: 9, speed: 200, col: '140,255,190' });
      }
      files.forEach((a, i) => {
        const t0 = 50.5 + i * 0.44, t1 = t0 + 0.5;
        if (t < t0 - 0.05 || t > t1 + 0.1) { a.o.visible = false; return; }
        const u = E.inOutCubic(seg(t, t0, t1));
        const start = modalPt(MR.file.x + 40 + i * 50, MR.file.y - 120 - (i % 3) * 60);
        const end = [PED[0], 100 + BH * 0.9, PED[2]];
        const mid = V(start, end, 0.5); mid[1] += 120;
        const q = (a0, b0, c0, uu) => a0.map((_, k) => (1 - uu) * (1 - uu) * a0[k] + 2 * (1 - uu) * uu * b0[k] + uu * uu * c0[k]);
        const p = q(start, mid, end, u);
        place(a, { p, r: [0, faceYaw(p, camPos()), (1 - u) * 12 - u * 8], w: (i === 0 ? 120 : 100) * (1 - u * 0.65), op: clamp(seg(t, t0 - 0.05, t0 + 0.1)) * (1 - seg(t, t1 - 0.05, t1 + 0.05)) });
        if (u > 0.05 && u < 0.98) {
          const pts = []; for (let j = 0; j < 10; j++) { const s = project(q(start, mid, end, Math.max(0, u - j * 0.03))); pts.push([s.x, s.y]); }
          fx.trail(pts.reverse(), 0.6, 8);
        }
      });
      // tree overlay
      const tIn = E.outCubic(seg(t, 50.4, 50.9)) * (1 - seg(t, 54.7, 55.1));
      tree.style.display = tIn > 0.003 ? '' : 'none'; tree.style.opacity = tIn;
      tree.style.transform = `translateX(${(1 - tIn) * 40}px)`;
      treeRows.forEach((r, i) => { const u = i === 0 ? 1 : E.outCubic(seg(t, 50.95 + (i - 1) * 0.44, 51.25 + (i - 1) * 0.44)); r.style.opacity = u; r.style.transform = `translateX(${(1 - u) * 16}px)`; });
    }

    // ======== Próximo click + publish (S9)
    if (t > 57.0 && t < 58.4) {
      const tgtS = project(fieldC('next'));
      const u = E.inOutCubic(seg(t, 57.0, 57.8));
      curX = lerp(tgtS.x + 380, tgtS.x + 10, u); curY = lerp(tgtS.y + 260, tgtS.y + 6, u);
      curOp = envl(t, 57.0, 57.2, 58.0, 58.4);
      if (t > 57.9) { rip = seg(t, 57.9, 58.4); ripX = tgtS.x; ripY = tgtS.y; }
    }
    {
      // new card: born from the folded modal, flies into the ring slot
      const born = t > 59.3, slotAng = 4 * deg, slotP = [Math.sin(slotAng) * (RING_R - 40), 190, -Math.cos(slotAng) * (RING_R - 40)];
      if (born && t < 71.6) {
        const u = E.inOutCubic(seg(t, 59.8, 61.1));
        const from = fieldC('next');
        const mid = [lerp(from[0], slotP[0], 0.5), 420, lerp(from[2], slotP[2], 0.5)];
        const q = (a0, b0, c0, uu) => a0.map((_, k) => (1 - uu) * (1 - uu) * a0[k] + 2 * (1 - uu) * uu * b0[k] + uu * uu * c0[k]);
        const p = q(from, mid, slotP, u);
        const yawEnd = Math.atan2(-slotP[0], -slotP[2]) / deg;
        const glow = pulse(t, 61.1, 0.05, 0.8);
        newCard.el.style.boxShadow = `0 0 0 ${3 + 3 * glow}px rgba(255,200,110,${0.6 + 0.4 * glow}),0 0 ${40 + 80 * glow}px rgba(255,180,80,${0.5 + 0.4 * glow})`;
        const popIn = E.outBack(seg(t, 59.4, 59.8));
        place(newCard, { p, r: [-12 * u, lerp(MODAL.yaw, yawEnd, u) + Math.sin(u * Math.PI) * 25, Math.sin(u * Math.PI) * -8], w: lerp(150, 172, u) * lerp(0.3, 1, popIn), op: clamp(seg(t, 59.4, 59.5)) * (1 - seg(t, 70.5, 71.5)) });
        if (u > 0.02 && u < 0.99) {
          const pts = []; for (let j = 0; j < 14; j++) { const s = project(q(from, mid, slotP, Math.max(0, u - j * 0.025))); pts.push([s.x, s.y]); }
          fx.trail(pts.reverse(), 0.9, 14);
        }
        if (t > 61.0 && t < 62.6) { fx.sparks(t, 61.1, slotP, { n: 60, seed: 12, speed: 320 }); const s = project(slotP); fx.flare(s.x, s.y, 1.0, pulse(t, 61.1, 0.05, 0.4)); }
      } else newCard.o.visible = false;
      if (t > 61.2 && t < 64.8) fx.confetti(t, 61.25, [0, 200, 0], { n: 140, seed: 21, spread: 380, life: 3.4 });
      if (t > 61.1 && t < 63.5) waves.push([0, 0, E.outCubic(seg(t, 61.15, 63.0)) * 1050, 1 - seg(t, 61.2, 63.3)]);
      const tIn = E.outBack(seg(t, 61.5, 62.0)) * (1 - seg(t, 63.4, 63.8));
      const s = project([slotP[0], slotP[1] + 90, slotP[2]]);
      posOv(toast, s.x, s.y - 40, tIn, 0.9 + 0.1 * tIn, 0.5, 1);
    }

    // cursor & ripple
    posOv(cursor, curX, curY, curOp, 1 - pulse(t, 14.35, 0.05, 0.15) * 0.15 - pulse(t, 57.9, 0.05, 0.15) * 0.15, 0.08, 0.05);
    if (rip >= 0 && rip < 1) { ripple.style.display = ''; const r = 10 + rip * 70; ripple.style.width = ripple.style.height = r * 2 + 'px'; ripple.style.transform = `translate(${ripX - r}px,${ripY - r}px)`; ripple.style.opacity = 1 - rip; }
    else ripple.style.display = 'none';

    // ======== OUTRO (S10)
    {
      const lIn = E.outBack(seg(t, 64.9, 65.8)), lOut = 1 - seg(t, 70.4, 71.4);
      if (t > 64.8) {
        logoWrap.style.display = ''; logoWrap.style.top = '205px';
        logoWrap.style.opacity = clamp(lIn) * lOut; logoWrap.style.transform = `scale(${0.8 + 0.2 * lIn})`;
        logoLetters.forEach((l) => { l.style.opacity = 1; l.style.transform = ''; });
        ringMain.style.strokeDashoffset = 0; ringHi.style.strokeDashoffset = 0;
        logoO.style.transform = `rotate(${(t - 64.8) * 40}deg)`;
      } else if (t > 6.4) { logoWrap.style.top = '250px'; }
      outroWords.forEach((w, i) => { const u = E.outCubic(seg(t, 65.6 + i * 0.3, 66.3 + i * 0.3)); w.style.opacity = u * lOut; w.style.transform = `translateY(${(1 - u) * 40}px)`; w.style.filter = u < 0.99 ? `blur(${(1 - u) * 10}px)` : ''; });
      outro1.style.display = t > 65.5 ? '' : 'none';
      const s2 = E.outCubic(seg(t, 66.9, 67.6)) * lOut;
      outro2.style.opacity = s2; outro2.style.display = s2 > 0.003 ? '' : 'none';
      if (t > 64) { bloom = 0.85 + seg(t, 64, 67) * 0.3; }
      fade = Math.max(fade, E.inQuad(seg(t, 70.6, 72)));
    }

    // ======== environment + grade
    env.set({ time: t, waves, spot, beam, bokeh: 1, glow: 1 + pulse(t, 61.1, 0.1, 0.8) * 0.8, dim: 0, bloom });
    fx.rays(t > 17.5 && t < 22 ? 0.15 : 0.45, t);
    gFlash.style.opacity = flash;
    gFade.style.opacity = fade;
  }

  return { duration: DURATION, update };
}
