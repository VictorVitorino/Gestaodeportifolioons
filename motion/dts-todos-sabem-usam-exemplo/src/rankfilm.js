// v5.1 · Somos Exemplo -> the FLOWS Ranking screen (replaces the v5 podium).
// The real screen (src/rankscreen.js, baked in layers by bake.mjs) rises from the plaza in the
// same kind of 3D frame as the Início screen of act 1, powers on behind a line of golden light
// and builds itself in the order the viewer should read it: the interface, the title, position
// and points (the three podium cards land on the screen as glass slabs and count up), then the
// publication, adoption and "Novo na temporada" indicators. Every value is a pure function of
// u = film time since the scene started (RANK.a in pace.js).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { E, clamp, lerp, seg, pulse } from './util.js';
import * as O from './objects.js';
import { RK_CARDS } from './rankscreen.js';

// placement in the plaza (the v5 podium stood here) and size of the screen in world units
export const RK = { x: 0, y: 330, z: 40, w: 960 };
// the scene's clock (u, seconds): what appears when
export const RKT = {
  rise: [1.5, 2.7], sweep: [2.5, 3.4], shell: [3.05, 3.65], sideItems: 3.0,
  title: 4.0, lead: 4.35, meta: 4.65, you: 5.5, tabs: 5.9, uline: 6.3,
  cards: { c3: 7.5, c2: 8.1, c1: 9.1 }, // then they count up; DTS lands on the reveal (the fanfare)
  table: 12.6, row: 12.8, rpts: 13.1, rstat: 13.4, // publications and adoptions
  rnew: 15.3, pills: { n3: 15.5, n2: 15.65, n1: 15.8 }, // "Novo na temporada": the season's evolution, last
};
const SIDE = ['sb_top', 'sb_s0', 'sb_i0', 'sb_i1', 'sb_s1', 'sb_i2', 'sb_i3', 'sb_i4', 'sb_i5', 'sb_s2', 'sb_i6', 'sb_i7', 'sb_bot'];

export function buildRankScreen({ scene, imgs, manifest, world }) {
  const M = manifest._rks, S = M.S, SW = M.W, SH = M.H, PAD = 40;
  const k = RK.w / SW, FW = RK.w, FH = SH * k;
  const L = M.L, img = (n) => imgs[`rk_${n}`];
  // screen canvas (2x): the whole screen except the three cards
  const cv = document.createElement('canvas'); cv.width = SW * S; cv.height = SH * S;
  const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = world.maxAniso;
  const frame = O.uiFrame(tex, { w: FW, h: FH, bezel: 16, depth: 16, radius: 24, screenRadius: 0.022 });
  scene.add(frame);
  const FRONT = 16 / 2 + 0.7; // glass plane of the frame (local z)
  const local = (px, py, dz = 0) => new THREE.Vector3((px / SW - 0.5) * FW, -(py / SH - 0.5) * FH, FRONT + dz);
  // the screen at rest (camera framing is solved on this pose)
  const rest = new THREE.Object3D(); rest.position.set(RK.x, RK.y, RK.z); rest.updateMatrixWorld(true);
  const restPt = (px, py, dz = 0) => rest.localToWorld(local(px, py, dz)).toArray();
  const livePt = (px, py, dz = 0) => frame.localToWorld(local(px, py, dz)).toArray();

  // a line of golden light that powers the screen on (additive: it blooms)
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(26, FH + 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA; void main(){ float x = abs(vUv.x - 0.5) * 2.0; float y = abs(vUv.y - 0.5) * 2.0;
      float core = exp(-x*x*18.0), halo = exp(-x*x*2.5) * 0.35; float fall = 1.0 - smoothstep(0.82, 1.0, y);
      gl_FragColor = vec4(vec3(1.0, 0.78, 0.42) * (core * 2.6 + halo) * fall * uA, 1.0); }`,
  }));
  beam.userData.noDepth = true; beam.renderOrder = 20; beam.visible = false; frame.add(beam);

  // soft shadow on the plaza under the floating screen
  const ao = O.contactShadow(FW * 1.15, 330, 0.42); scene.add(ao);

  // ---- podium cards: glass slabs that land on the screen and count up (figures drawn live)
  const cards = RK_CARDS.map((c) => {
    const r = L[c.k], nr = M.num[c.k], pr = L[`n${c.rank}`];
    const ccv = document.createElement('canvas'); ccv.width = r.w * S; ccv.height = r.h * S;
    const ctx = ccv.getContext('2d');
    const ctex = new THREE.CanvasTexture(ccv); ctex.colorSpace = THREE.SRGBColorSpace; ctex.anisotropy = world.maxAniso;
    const g = new THREE.Group(); frame.add(g);
    const D = 5;
    const body = new THREE.Mesh(new RoundedBoxGeometry(c.w * k, c.h * k, D, 4, 2.4), O.glossy(c.rank === 1 ? 0xffefd6 : 0xe8effb, { roughness: 0.3, transparent: true }));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(r.w * k, r.h * k), new THREE.MeshBasicMaterial({ map: ctex, transparent: true, toneMapped: false, depthWrite: false }));
    face.material.color.setScalar(0.93);
    // the face covers the layer box (card + room for its glow); the body sits under the card itself
    const ox = ((r.x + r.w / 2) - (c.x + c.w / 2)) * k, oy = -((r.y + r.h / 2) - (c.y + c.h / 2)) * k;
    face.position.set(ox, oy, D / 2 + 0.4); face.renderOrder = 8;
    g.add(body, face); O.shadowed(body, true, false);
    const home = local(c.x + c.w / 2, c.y + c.h / 2, D / 2 + 0.6);
    let key = '';
    const paint = (v, pill, glint) => {
      const kk = `${v}|${pill.toFixed(3)}|${glint.toFixed(3)}`; if (kk === key) return; key = kk;
      ctx.clearRect(0, 0, ccv.width, ccv.height);
      ctx.drawImage(img(c.k), 0, 0);
      // the figure, where the replica has it (Inter 900, 54 px)
      ctx.save(); ctx.font = `900 ${54 * S}px Inter`; ctx.letterSpacing = `${-0.54 * S}px`; ctx.fillStyle = '#0c1b44'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(v), (nr.x - r.x + nr.w / 2) * S, (nr.y - r.y + nr.h / 2 + 19.5) * S); ctx.restore();
      if (pill > 0.002) {
        const e = E.outBack(clamp(pill), 1.6), pw = pr.w * S, ph = pr.h * S, px = (pr.x - r.x) * S, py = (pr.y - r.y) * S;
        ctx.save(); ctx.globalAlpha = clamp(pill * 1.6); ctx.translate(px + pw / 2, py + ph / 2); ctx.scale(0.86 + 0.14 * e, 0.86 + 0.14 * e);
        ctx.drawImage(img(`n${c.rank}`), -pw / 2, -ph / 2); ctx.restore();
      }
      if (glint > 0 && glint < 1) {
        // a diagonal glint crosses the card once (only where the card is)
        const W2 = ccv.width, H2 = ccv.height, gx = lerp(-0.3, 1.3, glint) * W2;
        ctx.save(); ctx.globalCompositeOperation = 'source-atop';
        const gr = ctx.createLinearGradient(gx - 110 * S, 0, gx + 110 * S, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,250,235,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.setTransform(1, 0, -0.35, 1, 0.35 * H2 / 2, 0); ctx.fillStyle = gr; ctx.fillRect(-W2, 0, W2 * 3, H2); ctx.restore();
      }
      ctex.needsUpdate = true;
    };
    paint(0, 0, 0);
    return { c, g, body, face, home, paint };
  });
  // the DTS card's moment: a warm halo around the card (additive, it blooms) and a key light
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uA: { value: 0 }, uS: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA; uniform vec2 uS; void main(){
      vec2 p = (vUv - 0.5) * uS, b = uS * 0.5 - vec2(70.0); vec2 q = abs(p) - b; float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
      float g = exp(-max(d, 0.0) / 22.0) * smoothstep(-40.0, 0.0, d) + exp(-max(d, 0.0) / 60.0) * 0.18;
      gl_FragColor = vec4(vec3(1.0, 0.68, 0.26) * g * uA, 1.0); }`,
  }));
  { const c = RK_CARDS[1], W = c.w * k + 140, H = c.h * k + 140; halo.scale.set(W, H, 1); halo.material.uniforms.uS.value.set(W, H); halo.position.copy(local(c.x + c.w / 2, c.y + c.h / 2, 1.2)); }
  halo.userData.noDepth = true; halo.renderOrder = 7; halo.visible = false; frame.add(halo);
  const glow = new THREE.PointLight(0xffb84a, 0, 900, 2); frame.add(glow);
  { const c = RK_CARDS[1]; glow.position.copy(local(c.x + c.w / 2, c.y + c.h * 0.4, 170)); }

  // ---- screen composition (2x canvas; redrawn only when something moves)
  const tight = (n) => { const r = L[n], p = ['page', 'sb', 'main'].includes(n) ? 0 : PAD; return { x: r.x + p, y: r.y + p, w: r.w - 2 * p, h: r.h - 2 * p }; };
  // draw a layer: a = opacity, dx/dy = offset (css px), rise = masked rise (0..1), wipe = left-to-right reveal (0..1), sc = scale about its centre
  const lay = (n, { a = 1, dx = 0, dy = 0, rise = 1, wipe = 1, sc = 1 } = {}) => {
    if (a <= 0.003 || rise <= 0.001 || wipe <= 0.001) return;
    const r = L[n], t = tight(n);
    cx.save(); cx.globalAlpha = clamp(a);
    if (rise < 1 || wipe < 1) { cx.beginPath(); cx.rect((wipe < 1 ? t.x - 6 : r.x) * S, (rise < 1 ? t.y - 4 : r.y) * S, (wipe < 1 ? (t.w + 12) * wipe : r.w) * S, (rise < 1 ? t.h + 10 : r.h) * S); cx.clip(); }
    const oy = rise < 1 ? (1 - rise) * (t.h + 8) : 0;
    if (sc !== 1) { const cX = (t.x + t.w / 2) * S, cY = (t.y + t.h / 2) * S; cx.translate(cX, cY); cx.scale(sc, sc); cx.translate(-cX, -cY); }
    cx.drawImage(img(n), (r.x + dx) * S, (r.y + dy + oy) * S);
    cx.restore();
  };
  let scrKey = '';
  function compose(u) {
    const q = (v) => (Math.round(v * 400) / 400).toFixed(4);
    const sweep = E.inOutCubic(seg(u, ...RKT.sweep));
    const params = [sweep, ...SIDE.map((_, i) => seg(u, RKT.sideItems + i * 0.07, RKT.sideItems + i * 0.07 + 0.5)), seg(u, ...RKT.shell),
      seg(u, RKT.title, RKT.title + 0.75), seg(u, RKT.lead, RKT.lead + 0.7), seg(u, RKT.meta, RKT.meta + 0.6), seg(u, RKT.you, RKT.you + 0.7),
      seg(u, RKT.tabs, RKT.tabs + 0.6), seg(u, RKT.uline, RKT.uline + 0.6), seg(u, RKT.table, RKT.table + 0.6), seg(u, RKT.row, RKT.row + 0.6),
      seg(u, RKT.rpts, RKT.rpts + 0.5), seg(u, RKT.rstat, RKT.rstat + 0.7), seg(u, RKT.rnew, RKT.rnew + 0.45)];
    const key = params.map(q).join('|');
    if (key === scrKey) return; scrKey = key;
    const [sw, ...rest2] = params, side = rest2.slice(0, SIDE.length), [shell, ti, le, me, yo, ta, ul, tb, ro, rp, rs, rn] = rest2.slice(SIDE.length);
    const W = SW * S, H = SH * S;
    // screen off: deep navy glass
    const off = cx.createLinearGradient(0, 0, W, H); off.addColorStop(0, '#0d1a3f'); off.addColorStop(1, '#070f2a');
    cx.globalAlpha = 1; cx.fillStyle = off; cx.fillRect(0, 0, W, H);
    // the interface powers on behind the line of light
    const xs = lerp(-60, SW + 60, sw);
    if (sw > 0) { cx.save(); cx.beginPath(); cx.rect(0, 0, Math.max(0, xs) * S, H); cx.clip(); lay('page'); lay('sb'); cx.restore(); }
    if (sw > 0 && sw < 1) {
      cx.save(); cx.globalCompositeOperation = 'lighter';
      const g = cx.createLinearGradient((xs - 90) * S, 0, (xs + 20) * S, 0);
      g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(0.8, 'rgba(255,205,120,.55)'); g.addColorStop(1, 'rgba(255,240,210,0)');
      cx.fillStyle = g; cx.fillRect((xs - 90) * S, 0, 110 * S, H); cx.restore();
    }
    const eo = (v) => E.outCubic(clamp(v));
    lay('main', { a: eo(shell), dy: (1 - eo(shell)) * 16 });
    SIDE.forEach((n, i) => lay(n, { a: eo(side[i]), dx: (1 - eo(side[i])) * -14 }));
    lay('title', { rise: eo(ti) }); lay('lead', { rise: eo(le) }); lay('meta', { rise: eo(me), a: eo(me * 1.4) });
    lay('you', { a: eo(yo), dy: (1 - eo(yo)) * 14, sc: 0.985 + 0.015 * eo(yo) });
    lay('tabs', { a: eo(ta), dy: (1 - eo(ta)) * 10 }); lay('seg', { a: eo(ta), dy: (1 - eo(ta)) * 10 });
    lay('uline', { wipe: E.inOutCubic(clamp(ul)) });
    lay('tbl', { a: eo(tb), dy: (1 - eo(tb)) * 18 }); lay('row', { a: eo(ro), dy: (1 - eo(ro)) * 14 });
    lay('rpts', { a: eo(rp), dx: (1 - eo(rp)) * 16 });
    lay('rstat', { wipe: E.inOutCubic(clamp(rs)) });
    lay('rnew', { a: clamp(rn * 1.6), sc: 0.86 + 0.14 * E.outBack(clamp(rn), 1.6) });
    tex.needsUpdate = true;
  }

  function update(u, { reveal, sink }) {
    const on = u > RKT.rise[0] - 0.05 && u < sink + 1.0;
    frame.visible = on; ao.visible = on;
    if (!on) { glow.visible = false; return; }
    const R0 = RKT.rise[0], hide = RK.y + FH / 2 + 60;
    const up = 1 - E.outBack(seg(u, R0, RKT.rise[1]), 1.12), down = E.inBack(seg(u, sink, sink + 0.6), 1.2);
    frame.position.set(RK.x, RK.y - up * hide - down * hide, RK.z);
    frame.rotation.set(0.05 * up, 0.04 * up, 0);
    frame.updateMatrixWorld(true);
    { const bottom = frame.position.y - FH / 2 - 16, kk = clamp(1 - Math.max(0, bottom - 40) / 400) * (bottom > -20 ? 1 : 0); ao.position.set(RK.x, 0.6, RK.z); ao.material.opacity = 0.42 * kk; ao.visible = kk > 0.01; }
    compose(u);
    // the line of light rides the power-on sweep
    const sw = seg(u, ...RKT.sweep); beam.visible = sw > 0 && sw < 1;
    if (beam.visible) { const xs = lerp(-60, SW + 60, E.inOutCubic(sw)); beam.position.copy(local(xs, SH / 2, 2)); beam.material.uniforms.uA.value = Math.sin(Math.PI * sw) * 0.9; }
    // cards
    cards.forEach((o) => {
      const t0 = RKT.cards[o.c.k], big = o.c.rank === 1;
      const land = seg(u, t0, t0 + (big ? 0.95 : 0.8)), a = E.outCubic(seg(u, t0, t0 + 0.45));
      o.g.visible = a > 0.003;
      if (!o.g.visible) return;
      // the card flies in and settles on the glass (no overshoot in depth: it would dip behind the screen)
      const lift = (big ? 110 : 80) * (1 - E.outCubic(land));
      const settle = 1 + 0.018 * Math.sin(Math.PI * seg(land, 0.7, 1));
      const proud = big ? 8 * E.inOutSine(seg(u, reveal - 0.1, reveal + 0.6)) : 0; // DTS stays slightly proud of the screen
      o.g.position.set(o.home.x, o.home.y - (1 - E.outCubic(land)) * 18, o.home.z + lift + proud);
      o.g.rotation.set((1 - E.outCubic(land)) * 0.14, 0, 0); o.g.scale.setScalar(settle);
      o.face.material.opacity = a; o.body.material.opacity = a;
      const c0 = t0 + 0.2, c1 = big ? reveal : t0 + 1.25;
      const v = Math.round(o.c.pts * E.outCubic(seg(u, c0, c1)));
      const pill = seg(u, RKT.pills[`n${o.c.rank}`], RKT.pills[`n${o.c.rank}`] + 0.45);
      const glint = big ? seg(u, reveal + 0.05, reveal + 0.95) : 0;
      o.paint(v, pill, glint);
      const gl = big ? pulse(u, reveal, 0.08, 0.7) : pulse(u, c1, 0.06, 0.4) * 0.35;
      o.face.material.color.setScalar(0.93 + 0.04 * Math.min(1, gl));
    });
    const gp = pulse(u, reveal, 0.08, 0.9);
    { const on2 = RKT.cards.c1 + 0.5, hold = clamp((u - on2) / 0.8) * (1 - seg(u, sink - 0.2, sink + 0.3));
      halo.material.uniforms.uA.value = gp * 1.1 + hold * 0.4; halo.visible = halo.material.uniforms.uA.value > 0.01;
      halo.position.z = local(0, 0, 1.2).z + (cards[1].g.position.z - cards[1].home.z) * 0.5; }
    glow.intensity = gp * 1.4e4 + 0.35e4 * clamp((u - reveal) / 0.6) * (1 - seg(u, sink - 0.4, sink + 0.3));
    glow.visible = glow.intensity > 50;
  }
  return { frame, update, restPt, livePt, local, k, FW, FH, SW, SH };
}
