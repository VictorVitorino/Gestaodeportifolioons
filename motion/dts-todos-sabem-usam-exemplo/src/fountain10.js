// v10 · the fountain of light: the skill Fabio published falls as a drop of light into the centre of the
// plaza, a basin of light opens, the central jet erupts and a crown of jets arcs out to the whole library;
// every card a jet reaches lights up (the skill helps everyone). Every value is a pure function of T.
import * as THREE from 'three';
import { E, clamp, lerp, seg, pulse, rng } from './util.js';

const VS_UV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }';

export function buildFountain({ world, ring, slotPos, TARGET, F }) {
  const scene = world.scene;
  const C = new THREE.Vector3(...F.c);
  const root = new THREE.Group(); scene.add(root);

  // ---------------------------------------------------------------- the basin (rises from the floor)
  const basin = new THREE.Group(); basin.position.copy(C); root.add(basin);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xffc46e, emissive: 0xffa640, emissiveIntensity: 2.3, roughness: 0.28, metalness: 0.25 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(182, 8, 16, 160), rimMat); rim.rotation.x = -Math.PI / 2; rim.position.y = 14; basin.add(rim);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(184, 196, 26, 128, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x172a74, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 0.6, side: THREE.DoubleSide }));
  wall.position.y = 1; basin.add(wall);
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uT: { value: 0 }, uA: { value: 0 }, uW: { value: 0 } },
    vertexShader: VS_UV,
    fragmentShader: `varying vec2 vUv; uniform float uT, uA, uW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0; if (r > 1.0) discard;
        float rip = 0.5 + 0.5 * sin(r * 34.0 - uT * (4.0 + 5.0 * uW));
        rip *= 0.5 + 0.5 * sin(r * 13.0 - uT * 2.3 + atan(p.y, p.x) * 3.0);
        float caus = 0.5 + 0.5 * sin(p.x * 60.0 + uT * 1.7 + sin(p.y * 40.0 - uT)) * sin(p.y * 52.0 - uT * 1.3);
        float core = exp(-r * r / 0.05) * (0.8 + 1.6 * uW);
        float edge = smoothstep(0.82, 1.0, r) * 0.6;
        vec3 gold = vec3(1.0, 0.72, 0.34), white = vec3(1.0, 0.94, 0.8);
        vec3 c = gold * (0.22 + 0.34 * rip + 0.18 * caus + edge) + white * core;
        gl_FragColor = vec4(c * uA * (1.0 - smoothstep(0.96, 1.0, r) * 0.6), 1.0); }`,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(180, 96), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = 10; water.renderOrder = 8; water.userData.noDepth = true; basin.add(water);
  // the light of the fountain on the plaza, the pillars and the podium
  const light = new THREE.PointLight(0xffc27a, 0, 2600, 1.6); light.position.set(C.x, 300, C.z); root.add(light);

  // ---------------------------------------------------------------- the central jet's column of light
  const colMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 }, uA: { value: 0 }, uH: { value: 1 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float uT, uA, uH;
      void main(){ float y = vUv.y; if (y > uH) discard;
        float fres = pow(1.0 - abs(dot(vN, vV)), 1.6);
        float flow = 0.6 + 0.4 * sin(y * 40.0 - uT * 16.0 + vUv.x * 6.2831 * 2.0);
        float top = smoothstep(uH, uH - 0.25, y);
        vec3 c = mix(vec3(1.0, 0.95, 0.82), vec3(1.0, 0.7, 0.32), y);
        gl_FragColor = vec4(c * (0.35 + 0.9 * fres) * flow * top * uA, 1.0); }`,
  });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(16, 34, 1, 32, 24, true), colMat);
  column.position.set(C.x, 0.5, C.z); column.renderOrder = 9; column.userData.noDepth = true; root.add(column);

  // ---------------------------------------------------------------- the crown of jets (tubes of light + droplets)
  const R = rng(77), J = F.jets, jets = [];
  const holes = ring.holeSet;
  for (let j = 0; j < J; j++) {
    const a = (j / J) * Math.PI * 2 + (R() - 0.5) * 0.08;
    const col = ((Math.round((a / (Math.PI * 2)) * 64) % 64) + 64) % 64;
    let row = 1 + Math.floor(R() * 5), i = row * 64 + col;
    for (let k = 0; k < 7 && (holes.has(i) || i === TARGET); k++) { row = (row + 1) % 7; i = row * 64 + col; }
    const sl = ring.slots[i];
    const end = sl.pos.clone().add(new THREE.Vector3(0, 0, 1).applyQuaternion(sl.q).multiplyScalar(10));
    const start = C.clone().add(new THREE.Vector3(Math.sin(a) * 34, 40, -Math.cos(a) * 34));
    const dist = Math.hypot(end.x - start.x, end.z - start.z);
    const H = 360 + 0.13 * dist + R() * 120;
    const P = (u, out = new THREE.Vector3()) => out.set(lerp(start.x, end.x, u), lerp(start.y, end.y, u) + 4 * H * u * (1 - u), lerp(start.z, end.z, u));
    const pts = []; for (let k = 0; k <= 48; k++) pts.push(P(k / 48));
    const curve = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uHead: { value: 0 }, uTail: { value: 0 }, uA: { value: 1 }, uT: { value: 0 } },
      vertexShader: VS_UV,
      fragmentShader: `varying vec2 vUv; uniform float uHead, uTail, uA, uT;
        void main(){ float x = vUv.x; if (x > uHead || x < uTail) discard;
          float head = smoothstep(uHead - 0.09, uHead, x), tail = smoothstep(uTail, uTail + 0.06, x);
          float flow = 0.7 + 0.3 * sin(x * 70.0 - uT * 22.0);
          float across = 1.0 - abs(vUv.y - 0.5) * 2.0; across = pow(across, 0.6);
          vec3 c = mix(vec3(1.0, 0.6, 0.2), vec3(1.0, 0.9, 0.7), head * 0.8 + across * 0.2);
          gl_FragColor = vec4(c * (0.5 * flow + 2.0 * head) * tail * across * uA, 1.0); }`,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 5.5, 8, false), m);
    tube.renderOrder = 12; tube.userData.noDepth = true; tube.frustumCulled = false; root.add(tube);
    // the wave of launches travels from the new card's side of the hall around to the front
    const da = Math.abs(Math.atan2(Math.sin(a - Math.atan2(slotPos.x, -slotPos.z)), Math.cos(a - Math.atan2(slotPos.x, -slotPos.z)))) / Math.PI;
    const s = F.crown[0] + da * (F.crown[1] - F.crown[0] - F.jetLife) + R() * 0.12;
    const c = F.calm[0] + da * (F.calm[1] - F.calm[0]) * 0.55 + R() * 0.1;
    jets.push({ a, i, start, end, P, tube, m, s, c, ph: R(), life: F.jetLife * (0.92 + R() * 0.16) });
  }

  // ---------------------------------------------------------------- particles: droplets, the drop, sparks
  const NC = 1100, NJ = 34, NT = 60, NB = 12, NS = 110;
  const N = NC + J * NJ + NT + 1 + J * NB + NS;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), alp = new Float32Array(N), siz = new Float32Array(N), hot = new Float32Array(N);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('a', new THREE.BufferAttribute(alp, 1));
  geo.setAttribute('s', new THREE.BufferAttribute(siz, 1)); geo.setAttribute('h', new THREE.BufferAttribute(hot, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute float a; attribute float s; attribute float h; varying float vA; varying float vH;
      void main(){ vA = a; vH = h; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(s * 520.0 / -mv.z, 1.0, 96.0); }`,
    fragmentShader: `varying float vA; varying float vH; void main(){ float d = length(gl_PointCoord - 0.5); float k = smoothstep(0.5, 0.0, d); k = k * k * (0.55 + 0.45 * smoothstep(0.25, 0.0, d));
      vec3 c = mix(vec3(1.0, 0.74, 0.36), vec3(1.0, 0.96, 0.86), vH); gl_FragColor = vec4(c * k * vA * 2.2, 1.0); }`,
  });
  const points = new THREE.Points(geo, pMat); points.renderOrder = 30; points.frustumCulled = false; points.userData.noDepth = true; root.add(points);
  const seeds = Array.from({ length: NC }, () => ({ az: R() * Math.PI * 2, vy: 900 + R() * 560, vr: 30 + R() * 240, ph: R(), s: 10 + R() * 12, h: R() }));
  const G = 1500;
  // the shock ring on the floor where the drop lands
  const shock = new THREE.Mesh(new THREE.RingGeometry(0.93, 1.0, 128), new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  shock.rotation.x = -Math.PI / 2; shock.position.set(C.x, 3, C.z); shock.renderOrder = 7; shock.userData.noDepth = true; root.add(shock);
  const shock2 = shock.clone(); shock2.material = shock.material.clone(); root.add(shock2);

  // the drop's path: from the new card (a little in front of it) down into the basin
  const d0 = slotPos.clone().add(new THREE.Vector3(0, 0, 60)), d1 = C.clone().add(new THREE.Vector3(0, 14, 0));
  const dropAt = (u, out = new THREE.Vector3()) => out.set(lerp(d0.x, d1.x, u), lerp(d0.y, d1.y, u) + 4 * 620 * u * (1 - u), lerp(d0.z, d1.z, u));
  const V = new THREE.Vector3();

  // ---------------------------------------------------------------- per frame
  // returns the light of the moment (for the grade, the plaza and Fabio)
  function update(T) {
    const on = T > F.glowCard - 0.2 && T < F.drain[1] + 0.8; root.visible = on;
    const out = { energy: 0, flash: 0, cards: null };
    if (!on) { light.intensity = 0; return out; }
    alp.fill(0);
    let k = 0;
    // the basin: rises as the drop lands, sinks as the podium comes
    const up = E.outBack(seg(T, F.basin[0], F.basin[1]), 1.6), down = E.inCubic(seg(T, F.drain[0], F.drain[1]));
    basin.position.y = -40 * (1 - up) - 44 * down; basin.visible = up > 0.001 && down < 0.999;
    const erupt = E.outCubic(seg(T, F.jet[0], F.jet[1])), calm = E.inOutSine(seg(T, F.calm[0], F.calm[1]));
    const energy = Math.max(0, erupt * (1 - calm));
    out.energy = energy;
    waterMat.uniforms.uT.value = T; waterMat.uniforms.uA.value = (0.25 + 0.75 * up) * (1 - down) * (0.55 + 0.45 * energy) * (up > 0 ? 1 : 0);
    waterMat.uniforms.uW.value = energy;
    rimMat.emissiveIntensity = 2.3 + 1.6 * energy + 3.0 * pulse(T, F.drop[1], 0.05, 0.5);
    light.intensity = 2600 * (0.2 * up + 0.8 * energy) * (1 - down) + 6000 * pulse(T, F.drop[1], 0.04, 0.35);
    // the central column
    {
      const hgt = 520 * erupt * (1 - 0.35 * calm) + 180 * pulse(T, F.jet[0], 0.25, 0.5);
      column.visible = energy > 0.01;
      column.scale.set(1 + 0.4 * energy, Math.max(1, hgt), 1 + 0.4 * energy); column.position.y = Math.max(1, hgt) / 2 + 6 - 44 * down;
      colMat.uniforms.uT.value = T; colMat.uniforms.uA.value = energy * 0.5; colMat.uniforms.uH.value = 1;
    }
    // central droplets: continuous emission while the fountain plays; the first burst is the highest
    for (let i = 0; i < NC; i++, k++) {
      const s = seeds[i], life = (2 * s.vy) / G, per = life + 0.15;
      const age = (((T - F.jet[0] - s.ph * per) % per) + per) % per, birth = T - age;
      if (birth < F.jet[0] || birth > F.calm[1] - 0.6 || age > life) continue;
      const boost = 1 + 0.35 * (1 - seg(birth, F.jet[0], F.jet[0] + 0.9));
      const vy = s.vy * boost * (1 - 0.45 * seg(birth, F.calm[0], F.calm[1]));
      const y = vy * age - 0.5 * G * age * age; if (y < 0) continue;
      const r = s.vr * age + 20;
      pos[k * 3] = C.x + Math.cos(s.az) * r; pos[k * 3 + 1] = y + 20 + basin.position.y; pos[k * 3 + 2] = C.z + Math.sin(s.az) * r;
      alp[k] = 0.55 * Math.min(1, age * 6) * (1 - 0.6 * (age / life)); siz[k] = s.s; hot[k] = s.h;
    }
    // the crown: each jet's tube grows from the basin to its card, then flows; droplets ride along it
    const cards = [];
    for (const jt of jets) {
      const tau = (T - jt.s) / jt.life, tauC = (jt.c - jt.s) / jt.life;
      const head = clamp(tau), tail = clamp(tau - tauC);
      const vis = tau > 0 && tail < 1;
      jt.tube.visible = vis;
      jt.m.uniforms.uHead.value = head; jt.m.uniforms.uTail.value = tail; jt.m.uniforms.uT.value = T + jt.ph * 5;
      jt.m.uniforms.uA.value = 0.9;
      for (let q = 0; q < NJ; q++, k++) {
        if (!vis) continue;
        const u = ((tau - q / NJ) % 1 + 1) % 1, te = tau - u;
        if (te < 0 || te > tauC) continue;
        jt.P(u, V);
        const w = Math.sin(q * 12.9 + jt.ph * 40) * 15, w2 = Math.cos(q * 7.3 + jt.ph * 20) * 15;
        pos[k * 3] = V.x + w; pos[k * 3 + 1] = V.y + w2; pos[k * 3 + 2] = V.z - w;
        alp[k] = 0.75 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 0.12; siz[k] = 12 + (q % 3) * 4; hot[k] = (q % 4) / 4;
      }
      // the card it reaches lights up (a flash, then it stays lit while the stream flows, then glows softly)
      if (tau >= 1) {
        const tA = jt.s + jt.life, g = 1.3 * pulse(T, tA, 0.06, 0.7) + 0.55 * (1 - seg(T, jt.c + jt.life, jt.c + jt.life + 1.2)) + 0.28;
        cards.push([jt.i, g, 36 * pulse(T, tA, 0.08, 0.5)]);
      }
      // sparks where it lands
      const tA = jt.s + jt.life, dtb = T - tA;
      for (let q = 0; q < NB; q++, k++) {
        if (dtb < 0 || dtb > 0.9) continue;
        const az = q * 2.39996 + jt.ph * 6, el = 0.3 + (q % 5) * 0.25, sp = 150 + (q % 4) * 60;
        const dr = (1 - Math.exp(-3 * dtb)) / 3;
        pos[k * 3] = jt.end.x + Math.cos(az) * Math.cos(el) * sp * dr; pos[k * 3 + 1] = jt.end.y + Math.sin(el) * sp * dr - 300 * dtb * dtb; pos[k * 3 + 2] = jt.end.z + Math.sin(az) * Math.cos(el) * sp * dr;
        alp[k] = 0.7 * (1 - dtb / 0.9); siz[k] = 9; hot[k] = 1;
      }
    }
    out.cards = cards;
    // the drop and its trail
    {
      const u = seg(T, F.drop[0], F.drop[1]), ue = E.inQuad(u) * 0.35 + u * 0.65;
      for (let q = 0; q < NT; q++, k++) {
        if (u <= 0 || u >= 1) continue;
        const uu = ue - q * 0.0075; if (uu < 0) continue;
        dropAt(uu, V); pos[k * 3] = V.x; pos[k * 3 + 1] = V.y; pos[k * 3 + 2] = V.z;
        alp[k] = 0.9 * (1 - q / NT); siz[k] = 70 * (1 - q / NT) + 10; hot[k] = 1 - q / NT;
      }
      if (u > 0 && u < 1) { dropAt(ue, V); pos[k * 3] = V.x; pos[k * 3 + 1] = V.y; pos[k * 3 + 2] = V.z; alp[k] = 1.6; siz[k] = 170; hot[k] = 1; }
      else if (T > F.glowCard && u <= 0) { pos[k * 3] = d0.x; pos[k * 3 + 1] = d0.y; pos[k * 3 + 2] = d0.z; alp[k] = 1.5 * E.inOutSine(seg(T, F.glowCard, F.drop[0])); siz[k] = 80 + 90 * seg(T, F.glowCard, F.drop[0]); hot[k] = 1; }
      k++;
    }
    // the splash where it lands
    {
      const dt = T - F.drop[1];
      for (let q = 0; q < NS; q++, k++) {
        if (dt < 0 || dt > 1.3) continue;
        const az = q * 2.39996, el = 0.5 + (q % 7) * 0.13, sp = 260 + (q % 5) * 90;
        const dr = (1 - Math.exp(-2.6 * dt)) / 2.6;
        pos[k * 3] = C.x + Math.cos(az) * Math.cos(el) * sp * dr; pos[k * 3 + 1] = 14 + Math.sin(el) * sp * dr * 1.4 - 520 * dt * dt; pos[k * 3 + 2] = C.z + Math.sin(az) * Math.cos(el) * sp * dr;
        if (pos[k * 3 + 1] < 2) continue;
        alp[k] = 0.85 * (1 - dt / 1.3); siz[k] = 10; hot[k] = 0.8;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.a.needsUpdate = true; geo.attributes.s.needsUpdate = true; geo.attributes.h.needsUpdate = true;
    // the shock rings on the floor (the drop lands; the eruption)
    {
      const u = seg(T, F.drop[1], F.drop[1] + 1.4), u2 = seg(T, F.jet[0], F.jet[0] + 1.6);
      shock.visible = u > 0 && u < 1; shock.scale.setScalar(40 + 900 * E.outCubic(u)); shock.material.opacity = 0.9 * (1 - u);
      shock2.visible = u2 > 0 && u2 < 1; shock2.scale.setScalar(60 + 1250 * E.outCubic(u2)); shock2.material.opacity = 0.7 * (1 - u2);
    }
    out.flash = pulse(T, F.drop[1], 0.03, 0.3) * 0.16 + pulse(T, F.jet[0], 0.08, 0.5) * 0.08;
    return out;
  }
  window.__fountJets = jets.map((j) => [+(j.s + j.life).toFixed(3), +j.a.toFixed(3), +j.s.toFixed(3), +j.c.toFixed(3)]);
  return { update, root, jets };
}
