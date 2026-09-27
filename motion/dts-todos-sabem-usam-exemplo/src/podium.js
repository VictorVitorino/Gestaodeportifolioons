// Somos Exemplo: the FLOWS areas ranking as a toy podium. DTS #1 (1557 pts),
// M&A Services #2 (1054), Operations #3 (951). Blocks rise, trophies drop in,
// confetti and spotlights celebrate; labels/counters live in the HUD.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { E, clamp, lerp, seg, pulse, env as envl, rng } from './util.js';
import * as O from './objects.js';

export const AREAS = [
  { rank: 2, code: 'MA_SERVICES', name: 'M&A Services', pts: 1054, color: 0x3d8bff, x: -345, h: 240, t: 70.2, icon: 'medal' },
  { rank: 1, code: 'DTS', name: 'DTS', pts: 1557, color: 0xffa726, x: 0, h: 300, t: 71.9, icon: 'trophy' },
  { rank: 3, code: 'OPERATIONS', name: 'Operations', pts: 951, color: 0x1f3f8a, x: 345, h: 210, t: 69.3, icon: 'trophy' },
];
const Z = 60, W = 300, D = 230, CW = 272, CH = CW * 400 / 520;
export const fmtPts = (n) => n.toLocaleString('pt-BR');

function cup({ scale = 1, body = O.brightGold(), base = 0x14264f } = {}) {
  const g = new THREE.Group();
  const prof = [[0, 0], [30, 0], [30, 6], [12, 12], [9, 40], [14, 48], [40, 70], [52, 112], [54, 128], [48, 128], [44, 116], [34, 80], [0, 74]].map(([x, y]) => new THREE.Vector2(x, y));
  const c = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), body); c.position.y = 34; g.add(c);
  for (const s of [-1, 1]) { const hnd = new THREE.Mesh(new THREE.TorusGeometry(20, 5.5, 14, 40, Math.PI * 1.25), body); hnd.position.set(s * 50, 34 + 96, 0); hnd.rotation.set(0, 0, s > 0 ? -Math.PI * 0.62 : Math.PI * 1.62); g.add(hnd); }
  const b = new THREE.Mesh(new RoundedBoxGeometry(84, 34, 64, 4, 8), O.glossy(base, { roughness: 0.3 })); b.position.y = 17; g.add(b);
  O.shadowed(g); g.scale.setScalar(scale);
  return g;
}
function medal() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 11, 64), new THREE.MeshPhysicalMaterial({ color: 0xcfe0ff, metalness: 0.85, roughness: 0.25, clearcoat: 0.6, envMapIntensity: 0.9 }));
  disc.rotation.x = Math.PI / 2; g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(46, 4, 12, 64), O.glossy(0x3d8bff, { roughness: 0.25 })); g.add(rim);
  const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 12 : 28; const p = [Math.cos(a) * r, Math.sin(a) * r]; i ? s.lineTo(...p) : s.moveTo(...p); }
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.2, bevelSegments: 3 }), O.glossy(0x3d8bff, { roughness: 0.2 }));
  star.position.z = 5; g.add(star);
  for (const sgn of [-1, 1]) { const rb = new THREE.Mesh(new RoundedBoxGeometry(26, 70, 3, 2, 1), O.glossy(sgn < 0 ? 0x3d8bff : 0x0b2a66, { roughness: 0.4 })); rb.position.set(sgn * 16, 72, -4); rb.rotation.z = sgn * 0.35; g.add(rb); }
  O.shadowed(g);
  return g;
}

export function buildPodium({ scene, imgs, manifest }) {
  const root = new THREE.Group(); scene.add(root);
  const blocks = AREAS.map((a) => {
    const g = new THREE.Group(); root.add(g);
    const col = new THREE.Color(a.color);
    const body = new THREE.Mesh(new RoundedBoxGeometry(W, a.h, D, 6, 22), O.glossy(a.color, { roughness: 0.24, clearcoatRoughness: 0.08 }));
    body.position.y = a.h / 2; g.add(body);
    const cap = new THREE.Mesh(new RoundedBoxGeometry(W + 24, 22, D + 24, 4, 10), O.glossy(a.rank === 1 ? 0xfff2d6 : 0xf3f6fb, { roughness: 0.3 }));
    cap.position.y = a.h + 6; g.add(cap);
    const trim = new THREE.Mesh(new RoundedBoxGeometry(W - 30, 8, 6, 3, 3), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.8, roughness: 0.4 }));
    trim.position.set(0, a.h - 26, D / 2 + 2); g.add(trim);
    // the FLOWS ranking card on the block front; its points are drawn live (counter)
    const img = imgs[`rank_${a.rank}`], NR = manifest._rankNum, k2 = img.width / NR.W;
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d');
    const ctex = new THREE.CanvasTexture(cv); ctex.colorSpace = THREE.SRGBColorSpace; ctex.anisotropy = 8;
    const paint = (v) => { cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0); cx.font = `900 ${Math.round(88 * k2)}px Inter`; cx.fillStyle = '#0d1e46'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(fmtPts(v), (NR.x + NR.w / 2) * k2, (NR.y + NR.h / 2 + 4) * k2); ctex.needsUpdate = true; };
    paint(0);
    const bez = new THREE.Mesh(new RoundedBoxGeometry(CW + 14, CH + 14, 6, 4, 6), O.glossy(0xffffff, { roughness: 0.25 }));
    bez.position.set(0, a.h - 16 - CH / 2, D / 2 + 1); g.add(bez);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), new THREE.MeshBasicMaterial({ map: ctex, toneMapped: false, transparent: true }));
    card.material.color.setScalar(0.96);
    card.position.set(0, a.h - 16 - CH / 2, D / 2 + 4.3); g.add(card);
    const num = { v: -1, paint };
    O.shadowed(g); trim.castShadow = false; card.castShadow = false;
    const glow = new THREE.PointLight(a.color, 0, 700, 2); glow.position.set(0, a.h + 160, 160); g.add(glow);
    g.position.set(a.x, 0, Z);
    const aoM = O.contactShadow(W * 1.55, D * 1.7, 0.6); aoM.position.set(a.x, 0.6, Z); root.add(aoM);
    return { a, g, body, trim, num, glow, card, aoM };
  });
  const trophy1 = cup({ scale: 0.95 }); root.add(trophy1);
  const trophy3 = cup({ scale: 0.72, body: new THREE.MeshPhysicalMaterial({ color: 0xf2f6ff, metalness: 0.9, roughness: 0.16, clearcoat: 0.8, envMapIntensity: 1.5, emissive: 0x1a2440, emissiveIntensity: 0.4 }), base: 0x1f3f8a }); root.add(trophy3);
  const medal2 = medal(); root.add(medal2);

  // confetti: instanced paper chips from two cannons
  const N = 150, R = rng(31);
  const cGeo = new THREE.PlaneGeometry(11, 7);
  const cMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.55, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0.12 });
  const conf = new THREE.InstancedMesh(cGeo, cMat, N); conf.frustumCulled = false; root.add(conf);
  const pal = [0x3d8bff, 0xff8a1f, 0xf2b544, 0xffffff, 0x0085ca, 0xffd27a];
  const seeds = Array.from({ length: N }, (_, i) => {
    const side = i % 2 ? 1 : -1; const c = new THREE.Color(pal[Math.floor(R() * pal.length)]); conf.setColorAt(i, c);
    return { side, t0: 72.9 + R() * 0.3, vx: -side * (100 + R() * 300), vy: 420 + R() * 360, vz: (R() - 0.3) * 200, spin: 2.5 + R() * 4.5, ax: R() * 6, ay: R() * 6, ph: R() * 6, life: 2.8 + R() * 1.4 };
  });
  conf.instanceColor.needsUpdate = true;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), EU = new THREE.Euler(), P = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), S0 = new THREE.Vector3(0.0001, 0.0001, 0.0001);

  // fake volumetric spotlight cones
  const coneMat = (c) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, uniforms: { uC: { value: new THREE.Color(c) }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform vec3 uC; uniform float uA; void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); float fall = smoothstep(0.0, 0.35, vUv.y) * (0.35 + 0.65*vUv.y); gl_FragColor = vec4(uC * edge * fall * uA * 0.22, 1.0); }' });
  const cones = [0xfff1d0, 0xd7e7ff, 0xfff1d0].map((c) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(14, 230, 1100, 48, 1, true), coneMat(c)); m.userData.noDepth = true; m.renderOrder = 14; root.add(m); return m; });
  const spot = new THREE.SpotLight(0xfff0d0, 0, 2400, 0.32, 0.6, 2); spot.position.set(0, 1150, Z + 120); spot.target.position.set(0, 300, Z); root.add(spot, spot.target);

  const topOf = (k) => { const b = blocks[k]; return [b.a.x, b.g.position.y + b.a.h + 17, Z]; };
  function update(t, sparksArr, burst) {
    const on = t > 69.0 && t < 76.8; root.visible = on;
    if (!on) return;
    const sink = E.inBack(seg(t, 75.9, 76.6));
    blocks.forEach((b) => {
      const u = seg(t, b.a.t, b.a.t + (b.a.rank === 1 ? 1.0 : 0.8));
      const y = -(b.a.h + 40) * (1 - E.outBack(u, b.a.rank === 1 ? 1.3 : 1.15)) - sink * (b.a.h + 60);
      b.g.position.y = y; b.g.visible = u > 0;
      { const kk = clamp(1 - Math.abs(y) / 90); b.aoM.visible = u > 0 && kk > 0.01; b.aoM.material.opacity = 0.6 * kk; }
      const land = pulse(t, b.a.t + (b.a.rank === 1 ? 0.55 : 0.45), 0.03, 0.2) * Math.cos((t - b.a.t) * 18);
      b.g.scale.set(1 + land * 0.025, 1 - land * 0.035, 1 + land * 0.025);
      const win = b.a.rank === 1 ? envl(t, 72.8, 73.1, 75.4, 76.0) : 0;
      b.trim.material.emissiveIntensity = 1.6 + win * 2.4 + pulse(t, b.a.t + 0.5, 0.1, 0.6) * 1.4;
      b.glow.intensity = (b.a.rank === 1 ? win * 2.8e4 : 0) + pulse(t, b.a.t + 0.5, 0.1, 0.7) * 0.9e4;
      b.glow.visible = b.glow.intensity > 50; // inactive lights cost every lit fragment
      const c0 = b.a.t + 0.45, c1 = c0 + (b.a.rank === 1 ? 1.0 : 0.85);
      const v = Math.round(b.a.pts * E.outCubic(seg(t, c0, c1)));
      if (v !== b.num.v) { b.num.v = v; b.num.paint(v); }
    });
    // trophies: #3 drops in, #2 medal spins in, #1 gold cup lands with squash
    // trophies are lowered into place (ease out, one soft settle) instead of bouncing
    const drop = (obj, k, t0, h0 = 420, spin = 0) => {
      const tp = topOf(k); const u = seg(t, t0, t0 + 0.75);
      obj.visible = t > t0;
      const y = tp[1] + h0 * (1 - E.outCubic(u));
      const sq = pulse(t, t0 + 0.7, 0.05, 0.16) * Math.cos((t - t0 - 0.7) * 16) * 0.4;
      obj.position.set(tp[0], y, tp[2]); obj.rotation.set(0, spin * (1 - E.outCubic(u)) + Math.sin(t * 1.2 + k) * 0.12, 0);
      obj.userData.s = sq;
    };
    drop(trophy3, 2, 70.0, 300, 1.2); trophy3.scale.set(0.72 * (1 + trophy3.userData.s * 0.12), 0.72 * (1 - trophy3.userData.s * 0.16), 0.72 * (1 + trophy3.userData.s * 0.12));
    drop(medal2, 0, 70.95, 300, 2.0); medal2.position.y += 58; medal2.rotation.y += Math.sin(t * 0.9) * 0.25;
    drop(trophy1, 1, 72.7, 380, 1.6); trophy1.scale.set(0.95 * (1 + trophy1.userData.s * 0.16), 0.95 * (1 - trophy1.userData.s * 0.22), 0.95 * (1 + trophy1.userData.s * 0.16));
    // cones sweep, then converge on #1
    const conv = E.inOutCubic(seg(t, 72.3, 72.9)), aC = envl(t, 69.1, 69.8, 75.6, 76.2);
    cones.forEach((c, k) => {
      const base = [(k - 1) * 520, 1060, Z - 60];
      const sweep = Math.sin(t * 0.7 + k * 2.1) * 160;
      const tgt = [lerp(AREAS[[0, 1, 2][k]].x + sweep, 0, conv), 0, Z];
      c.position.set((base[0] + tgt[0]) / 2, (base[1] + tgt[1]) / 2, (base[2] + tgt[2]) / 2);
      const dir = new THREE.Vector3(base[0] - tgt[0], base[1] - tgt[1], base[2] - tgt[2]).normalize();
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      c.material.uniforms.uA.value = aC * (0.55 + 0.3 * conv) * (1 - sink);
    });
    spot.intensity = envl(t, 72.8, 73.0, 75.6, 76.2) * 6e5; spot.visible = spot.intensity > 50;
    // confetti
    for (let i = 0; i < N; i++) {
      const s = seeds[i], dt = t - s.t0;
      if (dt < 0 || dt > s.life) { M.compose(P.set(0, -999, 0), Q.identity(), S0); conf.setMatrixAt(i, M); continue; }
      const drag = (1 - Math.exp(-1.6 * dt)) / 1.6;
      P.set(s.side * 470 + s.vx * drag + Math.sin(dt * 2.2 + s.ph) * 22, 40 + s.vy * drag - 105 * dt * dt, Z + 40 + s.vz * drag);
      if (P.y < 2) P.y = 2;
      EU.set(s.ax + dt * s.spin, s.ay + dt * s.spin * 0.7, Math.sin(dt * 3 + s.ph)); Q.setFromEuler(EU);
      M.compose(P, Q, S1); conf.setMatrixAt(i, M);
    }
    conf.instanceMatrix.needsUpdate = true;
    // dust puffs on landings
    if (sparksArr) blocks.forEach((b, k) => burst(sparksArr, t, b.a.t + 0.45, [b.a.x, 10, Z + D / 2], { n: 12, seed: 40 + k, speed: 170, life: 0.8, up: 0.2 }));
  }
  // world-space anchors for tracked HUD graphics
  const cardPt = (k, u, v) => { const b = blocks[k]; return [b.a.x + (u - 0.5) * CW, b.g.position.y + b.a.h - 16 - v * CH, Z + D / 2 + 6]; };
  return { root, update, blocks, topOf, cardPt, trophy1 };
}
