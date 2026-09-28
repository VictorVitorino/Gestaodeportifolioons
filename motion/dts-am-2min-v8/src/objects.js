// Builders for every physical prop in the film: rounded "toy" geometry, glossy
// clear-coated plastics, UI frames with glass fronts, extruded titles.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export const glossy = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.85, ...o });
export const matte = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, envMapIntensity: 0.5, ...o });
export const gold = (o = {}) => new THREE.MeshPhysicalMaterial({ color: 0xe8a93c, roughness: 0.3, metalness: 0.7, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 0.65, ...o });
export const brightGold = (o = {}) => new THREE.MeshPhysicalMaterial({ color: 0xffc24a, roughness: 0.2, metalness: 0.85, clearcoat: 0.8, clearcoatRoughness: 0.1, envMapIntensity: 1.25, emissive: 0x5a3000, emissiveIntensity: 0.35, ...o });
export const shadowed = (m, cast = true, recv = true) => { m.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = recv; } }); return m; };

export function canvasTex(w, h, draw, aniso = 8) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  return t;
}
export function roundRect(x, X, Y, W, H, R) { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
export function roundedMask(w, h, r) {
  return canvasTex(w, h, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; roundRect(x, 0, 0, w, h, r); x.fill(); });
}
export function labelTex(text, { w = 1024, h = 256, font = '800 120px Inter', color = '#12244f', bg = null, align = 'center', pad = 40, radius = 40, icon = null } = {}) {
  return canvasTex(w, h, (x) => {
    if (bg) { x.fillStyle = bg; roundRect(x, 0, 0, w, h, radius); x.fill(); }
    x.font = font; x.fillStyle = color; x.textBaseline = 'middle'; x.textAlign = align;
    const X = align === 'center' ? w / 2 : align === 'left' ? pad : w - pad;
    x.fillText(text, X, h / 2 + 4);
  });
}

// ---------------------------------------------------------------- extruded words
const geoCache = new Map();
export function word3d(font, text, { size = 60, depth = 20, faceMat, sideMat, spacing = 0.02, bevel = true } = {}) {
  const group = new THREE.Group();
  const scale = size / font.data.resolution;
  const letters = [];
  let x = 0;
  for (const ch of text) {
    const glyph = font.data.glyphs[ch] || font.data.glyphs['?'];
    const adv = glyph.ha * scale;
    if (ch !== ' ') {
      const key = `${ch}|${size}|${depth}|${bevel}`;
      let g = geoCache.get(key);
      if (!g) {
        g = new TextGeometry(ch, { font, size, height: depth, curveSegments: 10, bevelEnabled: bevel, bevelThickness: size * 0.085, bevelSize: size * 0.045, bevelOffset: 0, bevelSegments: 6 });
        g.computeBoundingBox();
        const bb = g.boundingBox;
        g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
        geoCache.set(key, g);
      }
      const m = new THREE.Mesh(g, [faceMat, sideMat || faceMat]);
      m.castShadow = true; m.receiveShadow = true;
      const holder = new THREE.Group(); holder.add(m);
      holder.position.x = x + adv / 2;
      group.add(holder);
      letters.push({ holder, mesh: m, x: x + adv / 2 });
    }
    x += adv + size * spacing;
  }
  const width = x - size * spacing;
  for (const l of letters) { l.holder.position.x -= width / 2; l.x -= width / 2; }
  return { group, letters, width };
}

// ---------------------------------------------------------------- UI frame (device-like slab)
export function uiFrame(tex, { w, h, bezel = 12, depth = 12, radius = 22, body = 0x122a66, screenRadius = 0.035, glass = true, alpha = false, emissive = 0.93 }) {
  const g = new THREE.Group();
  const bodyM = new THREE.Mesh(new RoundedBoxGeometry(w + bezel * 2, h + bezel * 2, depth, 6, Math.min(radius, depth / 2)), glossy(body, { roughness: 0.28, clearcoatRoughness: 0.08 }));
  bodyM.castShadow = true; bodyM.receiveShadow = true;
  g.add(bodyM);
  const mask = alpha ? null : roundedMask(1024, Math.round((1024 * h) / w), Math.round(1024 * screenRadius));
  const scrMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, alphaMap: mask, alphaTest: alpha ? 0.02 : 0 });
  scrMat.color.setScalar(emissive);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), scrMat);
  scr.position.z = depth / 2 + 0.35; g.add(scr);
  let glassM = null;
  if (glass) {
    glassM = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, roughness: 0.08, clearcoat: 1, envMapIntensity: 0.7, depthWrite: false, alphaMap: mask }));
    glassM.position.z = depth / 2 + 0.7; g.add(glassM);
  }
  g.userData = { screen: scr, body: bodyM, glass: glassM, w, h };
  return g;
}

// ---------------------------------------------------------------- props
export function podium(color, { w = 480, h = 70, d = 190 } = {}) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 6, 24), glossy(0x162d70, { roughness: 0.25 }));
  top.position.y = h / 2; g.add(top);
  const strip = new THREE.Mesh(new RoundedBoxGeometry(w - 40, 10, 6, 3, 3), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.25, roughness: 0.4 }));
  strip.position.set(0, h * 0.55, d / 2 + 1); g.add(strip);
  const base = new THREE.Mesh(new RoundedBoxGeometry(w + 30, 16, d + 30, 4, 8), glossy(0x0e1f52, { roughness: 0.4 }));
  base.position.y = 8; g.add(base);
  shadowed(g); strip.castShadow = false;
  g.userData = { strip };
  return g;
}

export function pedestal({ r = 70, h = 110, color = 0x162d70 } = {}) {
  const g = new THREE.Group();
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(r + 8, 0), new THREE.Vector2(r + 8, 8), new THREE.Vector2(r, 14), new THREE.Vector2(r - 6, h - 12), new THREE.Vector2(r + 4, h - 6), new THREE.Vector2(r + 4, h), new THREE.Vector2(0, h)];
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), glossy(color, { roughness: 0.3 }));
  g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 4, 2.4, 12, 96), new THREE.MeshStandardMaterial({ color: 0xf0d49a, emissive: 0xe8bf72, emissiveIntensity: 1.1 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = h + 0.5; g.add(ring);
  shadowed(g);
  return g;
}

export function capsuleButton(tex, { w = 380, h = 96, d = 70 } = {}) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 8, h / 2 - 1), glossy(0xf98a1c, { roughness: 0.22, clearcoatRoughness: 0.06, sheen: 0.4 }));
  cap.castShadow = true; g.add(cap);
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, w * 0.9 * (96 / 452)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  decal.position.z = d / 2 + 0.4; g.add(decal);
  g.userData = { cap, decal };
  return g;
}

export function cursor3d() {
  const s = new THREE.Shape();
  const P = [[0, 0], [0, -46], [11, -35], [19, -52], [27, -48], [19, -32], [34, -32]];
  s.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) s.lineTo(p[0], p[1]); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 6, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 1.6, bevelSegments: 4 });
  geo.translate(0, 0, -3);
  const m = new THREE.Mesh(geo, glossy(0xffffff, { roughness: 0.18 }));
  const edge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0e2352, side: THREE.BackSide }));
  edge.scale.setScalar(1.08); edge.position.set(-1.2, 1.4, -0.5);
  const g = new THREE.Group(); g.add(edge); g.add(m); shadowed(g, true, false);
  return g;
}

export function keycap(label, { s = 72 } = {}) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new RoundedBoxGeometry(s, s * 0.5, s, 5, s * 0.14), glossy(0xfbf7ef, { roughness: 0.35 }));
  g.add(cap);
  const t = labelTex(label, { w: 256, h: 256, font: '800 150px Inter', color: '#12244f' });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.8, s * 0.8), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }));
  face.rotation.x = -Math.PI / 2; face.position.y = s * 0.25 + 0.4; g.add(face);
  shadowed(g);
  g.userData = { cap };
  return g;
}

export function rolodex(items, { w = 420, h = 92, r = 118 } = {}) {
  const g = new THREE.Group();
  const n = items.length, slats = [];
  items.forEach(([name, badge], i) => {
    const s = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, 14, 4, 7), glossy(0xfcf8f1, { roughness: 0.3 }));
    s.add(body);
    const t = canvasTex(1024, 224, (x, W, H) => {
      x.fillStyle = '#fcf8f1'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#efe4cf'; x.beginPath(); x.arc(104, H / 2, 58, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#6a5a3a'; x.font = '900 60px Inter'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(badge, 104, H / 2 + 3);
      x.fillStyle = '#26324f'; x.font = '700 76px Inter'; x.textAlign = 'left'; x.fillText(name, 200, H / 2 + 4);
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.9), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45 }));
    face.position.z = 7.3; s.add(face);
    const a = (i / n) * Math.PI * 2;
    s.position.set(0, Math.sin(a) * r, Math.cos(a) * r); s.rotation.x = -a;
    shadowed(s, true, true);
    g.add(s); slats.push({ s, body, face, a });
  });
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, w + 60, 32), gold());
  axle.rotation.z = Math.PI / 2; g.add(axle);
  g.userData = { slats, n };
  return g;
}

export function cardboardBox({ w = 150, h = 110, d = 130 } = {}) {
  const g = new THREE.Group();
  const card = matte(0xcf9d5c, { roughness: 0.85 });
  const cardIn = matte(0xa9763f, { roughness: 0.9 });
  const t = 5;
  const wall = (W, H, D, x, y, z, m = card) => { const b = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 2, 1.5), m); b.position.set(x, y, z); g.add(b); return b; };
  wall(w, t, d, 0, t / 2, 0, cardIn);
  wall(w, h, t, 0, h / 2, d / 2 - t / 2); wall(w, h, t, 0, h / 2, -d / 2 + t / 2);
  wall(t, h, d, -w / 2 + t / 2, h / 2, 0); wall(t, h, d, w / 2 - t / 2, h / 2, 0);
  const lbl = labelTex('SKILL.zip', { w: 1024, h: 360, font: '700 150px "JetBrains Mono"', color: '#2a1d0c', bg: '#fbf6ee', radius: 60 });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, w * 0.72 * 0.35), new THREE.MeshStandardMaterial({ map: lbl, roughness: 0.7 }));
  label.position.set(0, h * 0.48, d / 2 + 0.6); g.add(label);
  const flaps = [];
  for (const sgn of [1, -1]) {
    const hinge = new THREE.Group(); hinge.position.set(0, h, sgn * (d / 2 - t / 2)); g.add(hinge);
    const f = new THREE.Mesh(new RoundedBoxGeometry(w - 2, t * 0.8, d / 2, 2, 1.5), card);
    f.position.set(0, 0, -sgn * d / 4); hinge.add(f);
    flaps.push({ hinge, sgn });
  }
  const tape = new THREE.Mesh(new RoundedBoxGeometry(26, 2, d + 6, 2, 0.8), matte(0xf0d6a8, { roughness: 0.4 }));
  tape.position.set(0, h + t * 0.5 + 1.2, 0); g.add(tape);
  shadowed(g);
  g.userData = { flaps, tape, label, w, h, d };
  return g;
}

export function docFile(name, o = {}) {
  const { gold: isGold = false, dir = false } = o;
  const g = new THREE.Group();
  const col = isGold ? 0xffd27a : dir ? 0x5b8def : (o.tint || 0xdbe7ff);
  const W = dir ? 124 : 100, H = dir ? 92 : 128;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, dir ? 16 : 6, 4, dir ? 6 : 2.6), glossy(col, { roughness: 0.35 }));
  g.add(body);
  if (dir) { const tab = new THREE.Mesh(new RoundedBoxGeometry(44, 18, 14, 3, 5), glossy(0x4b7de0)); tab.position.set(-W / 2 + 26, H / 2 + 4, -1); g.add(tab); }
  const t = canvasTex(512, 640, (x, w2, h2) => {
    if (!dir) { x.fillStyle = isGold ? '#a86207' : '#9fb2d8'; for (let i = 0; i < 5; i++) { roundRect(x, 70, 150 + i * 62, i === 0 ? 300 : 360 - (i % 2) * 90, 22, 11); x.fill(); } }
    x.fillStyle = isGold ? '#3a2204' : dir ? '#ffffff' : '#12244f'; x.font = `700 ${name.length > 9 ? 64 : 76}px "JetBrains Mono"`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(name, w2 / 2, dir ? h2 * 0.55 : h2 * 0.84);
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, W * 0.92 * 1.25), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }));
  face.position.z = (dir ? 8 : 3) + 0.3; if (dir) face.scale.set(1, 0.62, 1); g.add(face);
  if (isGold) {
    const b = labelTex('RAIZ', { w: 256, h: 110, font: '900 70px Inter', color: '#ffd27a', bg: '#3a2204', radius: 30 });
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(46, 20), new THREE.MeshBasicMaterial({ map: b, transparent: true, toneMapped: false }));
    badge.position.set(26, H / 2 - 4, 4); g.add(badge);
  }
  shadowed(g);
  return g;
}

export function skillSlab(tex, { w = 172, h = 120, depth = 6 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, depth, 4, 3), glossy(0xf7f4ee, { roughness: 0.38 }));
  g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, toneMapped: false }));
  face.position.z = depth / 2 + 0.3; g.add(face);
  shadowed(g, true, false);
  g.userData = { body, face };
  return g;
}

// ---------------------------------------------------------------- the library ring (instanced)
export function libraryRing(atlas, { cols = 64, rows = 7, R0 = 2250, tileW = 172, tileH = 120, fill = 441, holes = [] } = {}) {
  const N = cols * rows;
  const bodyGeo = new RoundedBoxGeometry(tileW, tileH, 8, 3, 3);
  const body = new THREE.InstancedMesh(bodyGeo, glossy(0xf4f0e8, { roughness: 0.4 }), N);
  const faceMat = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.55, alphaTest: 0.5, envMapIntensity: 0.4, emissive: 0xffffff, emissiveMap: atlas, emissiveIntensity: 0.1 });
  faceMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aCell;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = vMapUv * vec2(0.25, 0.5) + aCell;\n#endif\n#ifdef USE_EMISSIVEMAP\n vEmissiveMapUv = vEmissiveMapUv * vec2(0.25, 0.5) + aCell;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance *= vColor.rgb * vColor.rgb;\n#endif');
  };
  const faceGeo = new THREE.PlaneGeometry(tileW, tileH);
  const cell = new Float32Array(N * 2);
  const slots = [];
  const holeSet = new Set(holes);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    const a = ((c + (r % 2) * 0.5) / cols) * Math.PI * 2;
    const rad = R0 + r * 46;
    const pos = new THREE.Vector3(Math.sin(a) * rad, 95 + r * 142, -Math.cos(a) * rad);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, Math.atan2(-pos.x, -pos.z), 0, 'YXZ'));
    slots.push({ pos, q, a, r, c });
    const k = (i * 5 + r * 3) % 8; cell[i * 2] = (k % 4) * 0.25; cell[i * 2 + 1] = k < 4 ? 0.5 : 0;
  }
  faceGeo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 2));
  const face = new THREE.InstancedMesh(faceGeo, faceMat, N);
  body.frustumCulled = false; face.frustumCulled = false;
  const M = new THREE.Matrix4(), S = new THREE.Vector3(), off = new THREE.Vector3(0, 0, 4.4), P = new THREE.Vector3();
  const col = new THREE.Color();
  const api = {
    body, face, slots, N, holeSet,
    // per-tile state: s scale, lift (towards center), glow (0..)
    set(i, s = 1, lift = 0, glow = 0, spin = 0) {
      const sl = slots[i];
      const hidden = holeSet.has(i) || s <= 0.001;
      S.setScalar(hidden ? 0.0001 : s);
      const q = sl.q.clone();
      if (spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), spin));
      const inward = new THREE.Vector3(0, 0, 1).applyQuaternion(sl.q).multiplyScalar(lift);
      P.copy(sl.pos).add(inward);
      M.compose(P, q, S); body.setMatrixAt(i, M);
      const o = off.clone().multiplyScalar(s).applyQuaternion(q);
      M.compose(P.clone().add(o), q, S); face.setMatrixAt(i, M);
      col.setScalar(1 + glow * 1.8); col.r += glow * 0.35; col.b -= glow * 0.25;
      face.setColorAt(i, col);
    },
    commit() { body.instanceMatrix.needsUpdate = true; face.instanceMatrix.needsUpdate = true; if (face.instanceColor) face.instanceColor.needsUpdate = true; },
  };
  for (let i = 0; i < N; i++) api.set(i, 1, 0, 0);
  api.commit();
  return api;
}

// glowing arc drawn progressively (light "thread" of reuse)
export function thread(a, b, lift = 400, color = 0xe9cf98) {
  const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += lift;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const geo = new THREE.TubeGeometry(curve, 80, 2.6, 8, false);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uP: { value: 0 }, uA: { value: 1 }, uC: { value: new THREE.Color(color) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uP; uniform float uA; uniform vec3 uC; void main(){ if (vUv.x > uP) discard; float head = smoothstep(uP - 0.12, uP, vUv.x); gl_FragColor = vec4(uC * (0.7 + head * 1.6) * uA, 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, m); mesh.userData.noDepth = true; mesh.renderOrder = 12;
  return mesh;
}

export function glowRing(color = 0xffc46e) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(100, 3, 12, 128), new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.userData.noDepth = true;
  return m;
}

// soft contact shadow (ambient-occlusion decal) that grounds props on the plaza
let _aoTex = null;
export function contactShadow(w, d, strength = 0.55) {
  if (!_aoTex) _aoTex = canvasTex(256, 256, (x, W, H) => { const g = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.45, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: _aoTex, color: 0x05030f, transparent: true, opacity: strength, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.6; m.renderOrder = 3; m.userData.noDepth = true; m.userData.k = strength;
  return m;
}
