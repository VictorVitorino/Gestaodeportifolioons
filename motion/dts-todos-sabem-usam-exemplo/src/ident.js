// Studio ident (v4): Alvarez & Marsal. A calm, executive opening on a deep-navy stage.
// A data constellation drifts far behind, soft motes hang in the air, light trails glide
// over a glossy floor and converge into a ring; a digital grid spreads from it, and the
// monogram materializes out of that light (a scan band where it crosses the floor). The
// letters fade in, one soft sweep of light crosses the mark, the typography rises from a
// mask, and the finished frame is allowed to rest before a dip to black.
// The mark keeps its official proportions: pieces only rise, fade and catch light.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { E, clamp, lerp, seg, env as envl, rng, path } from './util.js';

export const IDENT = 9.0; // v6: the final rest is 0.6 s shorter
export const ID_TYPE = { a: 5.8, out: 8.35 }; // typography in, and when the picture starts to leave
const AM_BLUE = 0x0085ca, WARM = 0xff9a3c;

function studioEnv(renderer) {
  const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: 0x05142b, side: THREE.BackSide })));
  const card = (color, k, pos, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); es.add(m); };
  card(0xffffff, 1.5, [0, 40, 18], 30, 10);
  card(0xdfeaff, 0.8, [-38, 14, 20], 10, 26);
  card(0x7fc6ff, 1.0, [36, 12, -24], 8, 30);
  card(0x0085ca, 0.8, [0, -6, -40], 60, 8);
  card(WARM, 0.45, [42, 6, 14], 6, 18);
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(es, 0.03, 0.1, 200).texture;
}

// additive soft points (motes, network nodes, pulses)
function softPoints(n, { size = 10, color = 0xffffff, gain = 2, max = 60 } = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('a', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('s', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  g.setAttribute('c', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uS: { value: size }, uC: { value: new THREE.Color(color) }, uG: { value: gain }, uMax: { value: max } },
    vertexShader: `attribute float a; attribute float s; attribute vec3 c; varying float vA; varying vec3 vC; uniform float uS, uMax;
      void main(){ vA = a; vC = c; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(uS * s * 400.0 / -mv.z, 1.0, uMax); }`,
    fragmentShader: `varying float vA; varying vec3 vC; uniform vec3 uC; uniform float uG;
      void main(){ float d = length(gl_PointCoord-0.5); float k = smoothstep(0.5, 0.0, d); k *= k; gl_FragColor = vec4(uC * vC * k * vA * uG, 1.0); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.noDepth = true; p.renderOrder = 30;
  return p;
}

export function buildIdent({ world, svgText, cam }) {
  const scene = new THREE.Scene();
  scene.environment = studioEnv(world.renderer);
  scene.fog = new THREE.FogExp2(0x031229, 0.00021);
  world.renderer.localClippingEnabled = true;
  const uni = { uT: { value: 0 }, uGlow: { value: 0 } };
  const R = rng(77);

  // ---------------------------------------------------------------- backdrop: deep navy, a soft halo behind the mark
  const bg = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: uni,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform float uT; uniform float uGlow;
      void main(){
        float e = vD.y; float az = atan(vD.x, -vD.z);
        // horizon = fog colour, so the glossy floor melts into the dark with no visible line
        vec3 hor = vec3(0.0011,0.0068,0.0245), mid = vec3(0.0026,0.016,0.05), top = vec3(0.0012,0.006,0.02);
        float lift = smoothstep(0.0, 0.1, e);   // exactly the fog colour at the horizon: no seam
        vec3 c = mix(hor, mid, smoothstep(0.02, 0.24, e)); c = mix(c, top, smoothstep(0.24, 0.78, e));
        float halo = exp(-pow(az/0.42,2.0)) * exp(-pow((e-0.14)/0.15,2.0)) * lift;
        c += vec3(0.0,0.28,0.55) * halo * (0.03 + 0.13*uGlow);
        float warm = exp(-pow((az-0.9)/0.35,2.0)) * exp(-pow((e-0.04)/0.05,2.0));
        c += vec3(1.0,0.5,0.16) * warm * 0.018 * uGlow * lift;
        if (e < 0.0) c = hor;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  bg.userData.noDepth = true; scene.add(bg);

  // ---------------------------------------------------------------- lights: white key, blue rim, restrained warm rim
  const key = new THREE.SpotLight(0xffffff, 3.4e6, 0, 0.68, 0.55, 2); // wide enough that the A&M letters sit in full light
  key.position.set(-520, 1000, 900); key.target.position.set(40, 150, 0); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.radius = 6; key.shadow.camera.near = 200; key.shadow.camera.far = 3200;
  scene.add(key, key.target);
  const rimL = new THREE.DirectionalLight(0x3fb4ff, 2.0); rimL.position.set(-900, 300, -700); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(WARM, 0.0); rimR.position.set(950, 380, -560); scene.add(rimR);
  const fill = new THREE.HemisphereLight(0x5a7fb8, 0x020812, 0.5); scene.add(fill);
  const ringLight = new THREE.PointLight(0x4fb8ff, 0, 1100, 2); ringLight.position.set(0, 60, 120); scene.add(ringLight);

  // ---------------------------------------------------------------- floor: glossy navy + a digital grid that spreads from the ring
  const gridU = { uGridR: { value: 0 }, uGridI: { value: 0 } };
  const floorM = new THREE.MeshPhysicalMaterial({ color: 0x051733, roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.55, transparent: true, opacity: 0.86 });
  floorM.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, gridU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uGridR; uniform float uGridI;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec2 gq = vWP.xz / 150.0; vec2 fw = fwidth(gq);
        vec2 gd = abs(fract(gq - 0.5) - 0.5) / max(fw, 1e-4);
        float gl = (1.0 - min(min(gd.x, gd.y), 1.0)) * (1.0 - smoothstep(0.25, 0.6, max(fw.x, fw.y)));
        float gr = length(vWP.xz);
        float reveal = smoothstep(uGridR, uGridR - 700.0, gr);
        float front = exp(-pow((gr - uGridR + 120.0) / 160.0, 2.0)) * step(10.0, uGridR);
        totalEmissiveRadiance += vec3(0.06, 0.45, 0.8) * gl * (reveal * 0.4 + front * 1.2) * exp(-gr / 2600.0) * uGridI;`);
  };
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8800, 128), floorM);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.renderOrder = 2; scene.add(floor);
  // pool of light under the mark
  const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(120,200,255,1)'); g.addColorStop(0.35, 'rgba(40,140,230,0.35)'); g.addColorStop(1, 'rgba(0,60,140,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.8; pool.userData.noDepth = true; pool.renderOrder = 3; scene.add(pool);
  // the ring the trails converge into (thin, luminous) and a fainter outer ring
  const ringMat = (w) => new THREE.MeshBasicMaterial({ color: new THREE.Color(AM_BLUE).multiplyScalar(2.4), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const ring1 = new THREE.Mesh(new THREE.RingGeometry(300, 303.5, 200), ringMat()); ring1.rotation.x = -Math.PI / 2; ring1.position.y = 1.0; ring1.userData.noDepth = true; scene.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(352, 353.5, 200), ringMat()); ring2.rotation.x = -Math.PI / 2; ring2.position.y = 1.0; ring2.userData.noDepth = true; scene.add(ring2);

  // ---------------------------------------------------------------- light trails gliding into the ring (4 blue, 1 warm)
  // [start angle (0 = straight behind the mark), start radius, sweep, colour, t0]; they end on the visible front of the ring
  const trailDefs = [[-0.5, 3800, -1.8, AM_BLUE, 1.2], [0.45, 4000, 1.85, AM_BLUE, 1.35], [-1.0, 3000, -0.6, 0x39aef0, 1.55], [0.9, 3400, 0.6, WARM, 1.75], [0.15, 4600, 2.75, 0x5fc3ff, 1.95]];
  const trails = trailDefs.map(([a0, r0, sweep, color, t0]) => {
    const pts = []; for (let i = 0; i <= 48; i++) { const s = i / 48; const r = lerp(r0, 301, Math.pow(s, 0.75)); const a = a0 + sweep * (1 - Math.pow(1 - s, 1.6)); pts.push(new THREE.Vector3(Math.sin(a) * r, 1.4, -Math.cos(a) * r)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uH: { value: 0 }, uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uH, uA; uniform vec3 uC;
        void main(){ float x = vUv.x; if (x > uH) discard;
          float tail = smoothstep(uH - 0.42, uH, x), head = smoothstep(uH - 0.025, uH, x);
          gl_FragColor = vec4(uC * (tail * 1.1 + head * 3.6) * uA, 1.0); }`,
    });
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, 3.2, 6, false), m); mesh.userData.noDepth = true; mesh.renderOrder = 12; scene.add(mesh);
    return { mesh, m, t0, curve };
  });
  const heads = softPoints(trails.length, { size: 34, color: 0xffffff, gain: 2.2, max: 70 }); scene.add(heads);
  trails.forEach((tr, i) => { const c = new THREE.Color(trailDefs[i][3]).lerp(new THREE.Color(0xffffff), 0.35); heads.geometry.attributes.c.array.set([c.r, c.g, c.b], i * 3); });

  // ---------------------------------------------------------------- data constellation (connectivity, cloud, AI) far behind
  const NET = new THREE.Group(); scene.add(NET);
  const nodes = [];
  for (let i = 0; i < 240; i++) nodes.push(new THREE.Vector3((R() - 0.5) * 9000, 260 + Math.pow(R(), 0.8) * 3400, -1900 - R() * 4600));
  const edges = [];
  nodes.forEach((p, i) => {
    const near = nodes.map((q, j) => [p.distanceToSquared(q), j]).filter(([d, j]) => j !== i && d < 820 * 820).sort((a, b) => a[0] - b[0]).slice(0, 2);
    near.forEach(([, j]) => { if (!edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) edges.push([i, j]); });
  });
  {
    const pos = new Float32Array(edges.length * 6), al = new Float32Array(edges.length * 2);
    edges.forEach(([a, b], k) => { pos.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], k * 6); const v = 0.35 + R() * 0.65; al[k * 2] = v; al[k * 2 + 1] = v; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('a', new THREE.BufferAttribute(al, 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uA: { value: 0 } },
      vertexShader: 'attribute float a; varying float vA; varying float vD; void main(){ vA = a; vec4 mv = modelViewMatrix*vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'varying float vA; varying float vD; uniform float uA; void main(){ float f = exp(-max(vD - 3000.0, 0.0) / 3200.0); gl_FragColor = vec4(vec3(0.16, 0.55, 0.9) * vA * uA * f * 0.32, 1.0); }' });
    const lines = new THREE.LineSegments(g, m); lines.userData.noDepth = true; lines.renderOrder = 5; lines.frustumCulled = false; NET.add(lines);
    NET.userData.lineMat = m;
  }
  const nodePts = softPoints(nodes.length, { size: 15, color: 0x8fd3ff, gain: 2.4, max: 16 }); NET.add(nodePts);
  const nodeSeeds = nodes.map(() => ({ ph: R() * 10, s: 0.5 + R() * 1.1 }));
  nodes.forEach((p, i) => { nodePts.geometry.attributes.position.array.set([p.x, p.y, p.z], i * 3); nodePts.geometry.attributes.s.array[i] = nodeSeeds[i].s; });
  nodePts.geometry.attributes.position.needsUpdate = true; nodePts.geometry.attributes.s.needsUpdate = true;
  // data pulses travelling along a few links
  const PULSES = Array.from({ length: 22 }, (_, k) => ({ e: edges[Math.floor(R() * edges.length)], t0: 0.8 + k * 0.38 + R() * 0.3, d: 1.5 + R() * 1.2, rev: R() < 0.5 }));
  const pulsePts = softPoints(PULSES.length, { size: 22, color: 0xcff0ff, gain: 2.2, max: 26 }); NET.add(pulsePts);

  // ---------------------------------------------------------------- air: soft motes and a few out-of-focus bokeh discs
  const MOTES = Array.from({ length: 460 }, () => ({ x: (R() - 0.5) * 3600, y: R() * 1100, z: -1300 + R() * 2500, v: 5 + R() * 12, ph: R() * 10, s: 0.5 + R(), warm: R() < 0.06 }));
  const motes = softPoints(MOTES.length, { size: 7, color: 0xffffff, gain: 1.4, max: 10 }); scene.add(motes);
  MOTES.forEach((m, i) => { const c = m.warm ? [1, 0.72, 0.42] : [0.72, 0.88, 1]; motes.geometry.attributes.c.array.set(c, i * 3); motes.geometry.attributes.s.array[i] = m.s; });
  const BOKEH = Array.from({ length: 12 }, () => ({ x: (R() < 0.5 ? -1 : 1) * (700 + R() * 900), y: 120 + R() * 700, z: 300 + R() * 700, ph: R() * 10, s: 0.7 + R() * 0.8 }));
  const bokeh = softPoints(BOKEH.length, { size: 180, color: 0x6fb8ff, gain: 0.35, max: 150 }); scene.add(bokeh);
  BOKEH.forEach((b, i) => { bokeh.geometry.attributes.s.array[i] = b.s; });

  // ---------------------------------------------------------------- a soft vertical light shaft behind the mark
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1300, 2600), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float uA; void main(){ float x = (vUv.x - 0.5) * 2.0; float w = mix(0.18, 0.62, vUv.y); float b = exp(-pow(x / w, 2.0)); float f = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y)); gl_FragColor = vec4(vec3(0.35, 0.7, 1.0) * b * f * uA * 0.12, 1.0); }',
  }));
  shaft.position.set(0, 1150, -420); shaft.userData.noDepth = true; shaft.renderOrder = 4; scene.add(shaft);

  // ---------------------------------------------------------------- the monogram
  const S = 5.2, W = 75.667, H = 66.898, DEPTH = 7.5;
  const up = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)], down = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)];
  const fx = { uSweep: { value: -9999 }, uShineW: { value: 60 }, uShineI: { value: 0 }, uScanI: { value: 0 }, uScanW: { value: 9 } };
  // the letters are revealed by a line of light that runs down the stack, A, & then M (opaque, no fade sorting)
  const rv = { uRevealY: { value: -10 }, uRevealOn: { value: 1 }, uRevealGlow: { value: 0 } };
  const markMat = (base, clip, extra = {}, reveal = false) => {
    const m = new THREE.MeshPhysicalMaterial({ ...base, clippingPlanes: clip, ...extra });
    const mirror = clip === down;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, fx);
      if (reveal) {
        Object.assign(sh.uniforms, rv);
        sh.fragmentShader = sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if (uRevealOn > 0.5 && abs(vWP.y) < uRevealY) discard;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(0.45, 0.82, 1.0) * exp(-pow((uRevealY - abs(vWP.y)) / 5.0, 2.0)) * uRevealGlow;');
      }
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uSweep, uShineW, uShineI, uScanI, uScanW;' + (reveal ? ' uniform float uRevealY, uRevealOn, uRevealGlow;' : ''))
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float sd = (vWP.x + 0.55 * abs(vWP.y)) - uSweep; totalEmissiveRadiance += vec3(0.75, 0.9, 1.0) * exp(-sd*sd/(uShineW*uShineW)) * uShineI;
          totalEmissiveRadiance += vec3(0.35, 0.78, 1.0) * exp(-pow(abs(vWP.y) / uScanW, 2.0)) * uScanI;`);
      if (mirror) sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb *= exp(-abs(vWP.y) / 110.0);');
    };
    // same onBeforeCompile source for every variant: without a distinct key three.js would reuse the first
    // compiled program (the mirror fade was leaking onto the letters and greying them)
    m.customProgramCacheKey = () => `am-mark:${mirror ? 1 : 0}:${reveal ? 1 : 0}`;
    return m;
  };
  const FACE = { color: 0xf5f8fc, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.0 };
  const SIDE = { color: 0xbccde3, roughness: 0.3, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.2 };
  const faceM = markMat(FACE, up), sideM = markMat(SIDE, up), faceR = markMat(FACE, down), sideR = markMat(SIDE, down);
  // letters fade in one after another, so each gets its own (transparent) materials
  const LM = { face: markMat(FACE, up, {}, true), side: markMat(SIDE, up, {}, true), faceR: markMat(FACE, down, {}, true), sideR: markMat(SIDE, down, {}, true) };
  const data = new SVGLoader().parse(svgText);
  const pieces = {};
  for (const p of data.paths) {
    const id = p.userData.node.id;
    const letter = /Path_3[678]/.test(id);
    const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), letter
      ? { depth: DEPTH * 0.55, bevelEnabled: true, bevelThickness: 0.28, bevelSize: 0.16, bevelSegments: 3, curveSegments: 16 }
      : { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.55, bevelSegments: 5, curveSegments: 12 });
    // SVG is y-down: rotate 180° about x (y and z negated) so winding stays valid
    geo.scale(S, -S, -S);
    geo.translate(-W / 2 * S, H * S, (letter ? DEPTH * 0.55 : DEPTH) * S / 2);
    geo.computeBoundingBox();
    const bb = geo.boundingBox, c = new THREE.Vector3(); bb.getCenter(c);
    const pivot = letter ? c.clone() : new THREE.Vector3(c.x, 0, c.z);
    geo.translate(-pivot.x, -pivot.y, -pivot.z);
    const lm = letter ? LM : null;
    const mesh = new THREE.Mesh(geo, letter ? [lm.face, lm.side] : [faceM, sideM]); mesh.castShadow = true; mesh.receiveShadow = !letter; // letters stay clean white
    const holder = new THREE.Group(); holder.position.copy(pivot); holder.add(mesh);
    pieces[id] = { holder, mesh, pivot, h: bb.max.y - bb.min.y, letter, lm };
  }
  const mark = new THREE.Group(); scene.add(mark);
  const order = ['Path_40-2', 'Path_39-2', 'Path_41-2', 'Path_36-2', 'Path_37-2', 'Path_38-2'];
  for (const id of order) mark.add(pieces[id].holder);
  // mirrored copy for the floor reflection (clipped to below the floor)
  const refl = new THREE.Group(); refl.scale.y = -1; scene.add(refl);
  const reflPieces = order.map((id) => { const p = pieces[id]; const hh = new THREE.Group(); hh.add(new THREE.Mesh(p.mesh.geometry, p.letter ? [p.lm.faceR, p.lm.sideR] : [faceR, sideR])); refl.add(hh); return hh; });

  // ---------------------------------------------------------------- choreography
  const RISE = { 'Path_40-2': 2.45, 'Path_39-2': 2.7, 'Path_41-2': 2.95 }, RISE_D = 2.1;
  const CAM_P = [[0, [-340, 150, 2800]], [3.2, [-150, 166, 2120]], [6.4, [-26, 178, 1690]], [IDENT, [0, 182, 1600]]];
  const CAM_T = [[0, [-60, 150, 0]], [3.2, [-22, 136, 0]], [6.4, [0, 116, 0]], [IDENT, [0, 112, 0]]];
  const camAt = (t) => ({ P: path(CAM_P, t), T: path(CAM_T, t) });

  function update(t) {
    uni.uT.value = t;
    const { P, T } = camAt(t);
    cam.position.set(...P); cam.up.set(0, 1, 0); cam.lookAt(...T); cam.fov = 30; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);

    // trails glide in and fade once they reach the ring
    trails.forEach((tr, i) => {
      const u = E.inOutSine(seg(t, tr.t0 - 0.9, tr.t0 + 1.1));
      tr.m.uniforms.uH.value = u * 1.02;
      tr.m.uniforms.uA.value = E.outCubic(seg(t, tr.t0 - 0.9, tr.t0 - 0.4)) * (1 - E.inOutSine(seg(t, tr.t0 + 1.0, tr.t0 + 1.9)));
      tr.mesh.visible = tr.m.uniforms.uA.value > 0.003 && u > 0;
      const hp = tr.curve.getPoint(Math.min(1, u));
      heads.geometry.attributes.position.array.set([hp.x, hp.y + 1, hp.z], i * 3);
      heads.geometry.attributes.a.array[i] = u > 0 && u < 1 ? tr.m.uniforms.uA.value * 0.9 : u >= 1 ? tr.m.uniforms.uA.value * 0.5 : 0;
    });
    heads.geometry.attributes.position.needsUpdate = true; heads.geometry.attributes.a.needsUpdate = true;
    // the ring forms, the grid spreads outward from it
    const ringK = E.outCubic(seg(t, 2.0, 3.1));
    ring1.material.opacity = ringK * 0.75 * (1 - 0.35 * seg(t, 5.5, 7.5)); ring1.scale.setScalar(0.94 + 0.06 * ringK);
    ring2.material.opacity = E.outCubic(seg(t, 2.6, 3.8)) * 0.3;
    ringLight.intensity = 0; ringLight.visible = false; // (its specular hot spot on the floor read as a flare)
    gridU.uGridR.value = lerp(250, 5200, E.inOutSine(seg(t, 2.3, 6.2))); gridU.uGridI.value = E.outCubic(seg(t, 2.3, 3.2));
    pool.material.opacity = E.inOutSine(seg(t, 2.2, 4.6)) * 0.22;

    // columns materialize through the floor (clipped below it); the scan band glows where they cross
    order.forEach((id, k) => {
      const p = pieces[id], r = reflPieces[k];
      if (!p.letter) {
        const u = E.inOutCubic(seg(t, RISE[id], RISE[id] + RISE_D));
        p.holder.position.set(p.pivot.x, p.pivot.y - p.h * 1.01 * (1 - u), p.pivot.z);
        p.holder.visible = t > RISE[id];
      } else { p.holder.position.copy(p.pivot); p.holder.visible = t > 4.7; }
      r.position.copy(p.holder.position); r.visible = p.holder.visible;
    });
    fx.uScanI.value = envl(t, 2.45, 2.9, 4.6, 5.8, 'outCubic', 'inOutSine') * 1.4 + 0.1 * seg(t, 5.0, 6.0);
    // letters: a line of light runs down the stack and leaves A, & and M behind it
    rv.uRevealY.value = lerp(200, -8, E.inOutSine(seg(t, 4.7, 5.9)));
    rv.uRevealOn.value = t < 6.0 ? 1 : 0;
    rv.uRevealGlow.value = envl(t, 4.7, 4.85, 5.75, 6.0, 'outCubic', 'inOutSine') * 2.2;
    // one soft sweep of light across the finished mark
    fx.uSweep.value = lerp(-560, 680, E.inOutSine(seg(t, 5.4, 6.9))); fx.uShineI.value = envl(t, 5.4, 5.8, 6.5, 6.9, 'inOutSine', 'inOutSine') * 0.75;
    rimR.intensity = E.inOutSine(seg(t, 4.2, 6.4)) * 0.85; rimR.visible = rimR.intensity > 0.01;
    uni.uGlow.value = E.inOutSine(seg(t, 1.8, 6.0));

    // constellation: fades up, drifts, carries a few data pulses
    NET.userData.lineMat.uniforms.uA.value = E.inOutSine(seg(t, 0.3, 3.4));
    NET.position.set(-40 + t * 6, 0, 0); NET.rotation.y = 0.02 * Math.sin(t * 0.12);
    { const a = nodePts.geometry.attributes; nodeSeeds.forEach((s, i) => { a.a.array[i] = E.inOutSine(seg(t, 0.2, 3.0)) * (0.55 + 0.25 * Math.sin(t * 0.6 + s.ph)); }); a.a.needsUpdate = true; }
    { const a = pulsePts.geometry.attributes; PULSES.forEach((pu, k) => { const u = seg(t, pu.t0, pu.t0 + pu.d); const [i0, i1] = pu.rev ? [pu.e[1], pu.e[0]] : pu.e; const p0 = nodes[i0], p1 = nodes[i1]; a.position.array.set([lerp(p0.x, p1.x, u), lerp(p0.y, p1.y, u), lerp(p0.z, p1.z, u)], k * 3); a.a.array[k] = u > 0 && u < 1 ? Math.sin(u * Math.PI) * 0.9 : 0; }); a.position.needsUpdate = true; a.a.needsUpdate = true; }
    // air
    { const a = motes.geometry.attributes; MOTES.forEach((m, i) => { const y = (m.y + t * m.v) % 1100; a.position.array.set([m.x + Math.sin(t * 0.2 + m.ph) * 20, y, m.z], i * 3); a.a.array[i] = E.inOutSine(seg(t, 0.2, 2.2)) * (0.35 + 0.25 * Math.sin(t * 0.8 + m.ph)) * Math.sin(Math.PI * y / 1100); }); a.position.needsUpdate = true; a.a.needsUpdate = true; }
    { const a = bokeh.geometry.attributes; BOKEH.forEach((b, i) => { a.position.array.set([b.x + Math.sin(t * 0.15 + b.ph) * 30, b.y + Math.sin(t * 0.2 + b.ph) * 20, b.z], i * 3); a.a.array[i] = E.inOutSine(seg(t, 0.5, 3.0)) * (0.5 + 0.3 * Math.sin(t * 0.3 + b.ph)); }); a.position.needsUpdate = true; a.a.needsUpdate = true; }
    shaft.material.uniforms.uA.value = E.inOutSine(seg(t, 1.0, 5.5));

    const fade = Math.max(1 - E.outQuad(seg(t, 0, 1.5)), E.inQuad(seg(t, ID_TYPE.out, IDENT)));
    const focus = Math.hypot(T[0] - P[0], T[1] - P[1], T[2] - P[2]);
    return { focus, fade, aperture: 0.000011, maxblur: 0.0024, bloom: 0.46 };
  }
  return { scene, update, camAt, duration: IDENT };
}
