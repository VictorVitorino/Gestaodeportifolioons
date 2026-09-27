// Studio ident: the Alvarez & Marsal monogram rises like a skyline on a night-blue
// stage, guided by a spark of light (A&M blue). The mark keeps its official
// proportions: pieces only rise, pop and catch light; they are never distorted.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { E, clamp, lerp, seg, pulse, env as envl, rng, spline } from './util.js';

export const IDENT = 6.0;
const AM_BLUE = 0x0085ca, AM_NAVY = 0x00244a;

function studioEnv(renderer) {
  const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: 0x06162e, side: THREE.BackSide })));
  const card = (color, k, pos, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); es.add(m); };
  card(0xffffff, 1.6, [0, 40, 18], 30, 10);
  card(0xdfeaff, 0.9, [-38, 14, 20], 10, 26);
  card(0x7fc6ff, 1.1, [36, 12, -24], 8, 30);
  card(0x0085ca, 0.8, [0, -6, -40], 60, 8);
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(es, 0.03, 0.1, 200).texture;
}

export function buildIdent({ world, svgText, cam }) {
  const scene = new THREE.Scene();
  scene.environment = studioEnv(world.renderer);
  scene.fog = new THREE.FogExp2(0x041328, 0.00022);
  const uni = { uT: { value: 0 }, uGlow: { value: 0 } };

  // backdrop: A&M navy night with a soft blue halo behind the mark
  const bg = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: uni,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform float uT; uniform float uGlow;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        float e = vD.y; float az = atan(vD.x, -vD.z);
        vec3 top = vec3(0.003,0.016,0.045), mid = vec3(0.0,0.06,0.15), hor = vec3(0.01,0.07,0.16);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.14, e)); c = mix(c, top, smoothstep(0.2, 0.7, e));
        float halo = exp(-pow(az/0.55,2.0)) * exp(-pow((e-0.13)/0.17,2.0));
        c += vec3(0.0,0.52,0.79) * halo * (0.12 + 0.24*uGlow);
        vec2 q = vec2(az, e) * 400.0; vec2 g = floor(q); vec2 f = fract(q) - 0.5; float s = h(g); float tw = 0.55+0.45*sin(uT*2.0+s*40.0);
        c += vec3(0.75,0.88,1.0) * step(0.996, s) * smoothstep(0.5, 0.0, length(f)) * smoothstep(0.08,0.5,e) * tw * 0.9;
        if (e < 0.0) c = mix(vec3(0.014,0.07,0.15), vec3(0.0,0.02,0.05), smoothstep(0.0, 0.25, -e));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  bg.userData.noDepth = true; scene.add(bg);

  // lights
  const key = new THREE.SpotLight(0xffffff, 3.2e6, 0, 0.5, 0.65, 2);
  key.position.set(-420, 900, 780); key.target.position.set(0, 150, 0); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.radius = 6; key.shadow.camera.near = 200; key.shadow.camera.far = 3000;
  scene.add(key, key.target);
  const rimL = new THREE.DirectionalLight(0x3fb4ff, 2.2); rimL.position.set(-900, 300, -700); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0x9fd8ff, 1.6); rimR.position.set(900, 420, -600); scene.add(rimR);
  const fill = new THREE.HemisphereLight(0x5a7fb8, 0x020812, 0.55); scene.add(fill);
  const sparkLight = new THREE.PointLight(0x55c8ff, 0, 700, 2); scene.add(sparkLight);

  // floor: glossy navy, semi-transparent over a mirrored copy of the mark (fake reflection)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8800, 128), new THREE.MeshPhysicalMaterial({ color: 0x06193a, roughness: 0.2, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.55, transparent: true, opacity: 0.84 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.renderOrder = 2; scene.add(floor);
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(AM_BLUE).multiplyScalar(2.2), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(300, 306, 160), ringMat); floorRing.rotation.x = -Math.PI / 2; floorRing.position.y = 0.6; floorRing.userData.noDepth = true; scene.add(floorRing);

  // the monogram
  const S = 5.2, W = 75.667, H = 66.898, DEPTH = 7.5;
  const faceM = new THREE.MeshPhysicalMaterial({ color: 0xf5f8fc, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.0 });
  const sideM = new THREE.MeshPhysicalMaterial({ color: 0xc9d9ec, roughness: 0.28, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
  const shine = { uSweep: { value: -9999 }, uShineW: { value: 48 } };
  for (const m of [faceM, sideM]) m.onBeforeCompile = (sh) => {
    sh.uniforms.uSweep = shine.uSweep; sh.uniforms.uShineW = shine.uShineW;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uSweep; uniform float uShineW;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float sd = (vWP.x + 0.55 * abs(vWP.y)) - uSweep; totalEmissiveRadiance += vec3(0.75, 0.9, 1.0) * exp(-sd*sd/(uShineW*uShineW)) * 1.05;');
  };
  const flareTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.08, 'rgba(200,235,255,0.9)'); g.addColorStop(0.3, 'rgba(60,170,240,0.25)'); g.addColorStop(1, 'rgba(0,80,160,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (const [w, h] of [[256, 6], [6, 256]]) { const gl = x.createLinearGradient(w > h ? 0 : 128, w > h ? 128 : 0, w > h ? 256 : 128, w > h ? 128 : 256); gl.addColorStop(0, 'rgba(160,220,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(160,220,255,0)'); x.fillStyle = gl; x.fillRect(128 - w / 2, 128 - h / 2, w, h); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
  star.userData.noDepth = true; star.renderOrder = 40; scene.add(star);
  const data = new SVGLoader().parse(svgText);
  const pieces = {};
  for (const path of data.paths) {
    const id = path.userData.node.id;
    const letter = /Path_3[678]/.test(id);
    const shapes = SVGLoader.createShapes(path);
    const geo = new THREE.ExtrudeGeometry(shapes, letter
      ? { depth: DEPTH * 0.55, bevelEnabled: true, bevelThickness: 0.28, bevelSize: 0.16, bevelSegments: 3, curveSegments: 16 }
      : { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.9, bevelSize: 0.55, bevelSegments: 5, curveSegments: 12 });
    // SVG is y-down: rotate 180° about x (y and z negated) so winding stays valid
    geo.scale(S, -S, -S);
    geo.translate(-W / 2 * S, H * S, (letter ? DEPTH * 0.55 : DEPTH) * S / 2);
    geo.computeBoundingBox();
    const bb = geo.boundingBox, c = new THREE.Vector3(); bb.getCenter(c);
    const pivot = letter ? c.clone() : new THREE.Vector3(c.x, 0, c.z);
    geo.translate(-pivot.x, -pivot.y, -pivot.z);
    const mesh = new THREE.Mesh(geo, [faceM, sideM]); mesh.castShadow = true; mesh.receiveShadow = true;
    const holder = new THREE.Group(); holder.position.copy(pivot); holder.add(mesh);
    pieces[id] = { holder, mesh, pivot, h: bb.max.y - bb.min.y };
  }
  const mark = new THREE.Group(); scene.add(mark);
  const order = ['Path_40-2', 'Path_39-2', 'Path_41-2', 'Path_36-2', 'Path_37-2', 'Path_38-2'];
  for (const id of order) mark.add(pieces[id].holder);
  // mirrored copy for the floor reflection
  const refl = new THREE.Group(); refl.scale.y = -1; scene.add(refl);
  const reflPieces = order.map((id) => { const p = pieces[id]; const hh = new THREE.Group(); const m = new THREE.Mesh(p.mesh.geometry, [faceM, sideM]); hh.add(m); refl.add(hh); return hh; });
  refl.renderOrder = 1;

  // spark + trail + sparkle dust
  const mkPts = (n, size, color) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('a', new THREE.BufferAttribute(new Float32Array(n), 1));
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uS: { value: size }, uC: { value: new THREE.Color(color) } },
      vertexShader: 'attribute float a; varying float vA; uniform float uS; void main(){ vA = a; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(uS*400.0/-mv.z, 1.0, 90.0)*(0.35+0.65*a); }',
      fragmentShader: 'varying float vA; uniform vec3 uC; void main(){ float d = length(gl_PointCoord-0.5); float k = smoothstep(0.5,0.0,d); k = k*k; gl_FragColor = vec4(uC*k*vA*2.6 + vec3(1.0)*pow(k,6.0)*vA*1.5, 1.0); }' });
    const p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.noDepth = true; p.renderOrder = 30; scene.add(p); return p;
  };
  const core = mkPts(1, 48, 0x7fd2ff);
  const trail = mkPts(70, 26, 0x39aef0);
  const dust = mkPts(220, 9, 0xbfe6ff);

  // spark flight path [t, [x,y,z]]
  const PATH = [
    [0.35, [-900, 520, 260]], [0.95, [-420, 150, 160]], [1.25, [-150, 60, 120]], [1.55, [-20, 70, 110]], [1.85, [110, 60, 110]],
    [2.2, [210, 120, 90]], [2.45, [175, 200, 70]], [2.62, [175, 150, 70]], [2.8, [175, 95, 70]], [3.05, [60, 300, 90]], [3.35, [15, 372, 40]],
  ];
  const sparkAt = (t) => spline(PATH, clamp(t, PATH[0][0], PATH[PATH.length - 1][0]), 'linear');
  const R = rng(77);
  const dustSeeds = Array.from({ length: 220 }, () => ({ t0: 0.5 + R() * 2.9, vx: (R() - 0.5) * 60, vy: 20 + R() * 50, vz: (R() - 0.5) * 60, life: 0.8 + R() * 1.1 }));

  // rise schedule (skyline) and letter pops
  const RISE = { 'Path_40-2': 1.2, 'Path_39-2': 1.45, 'Path_41-2': 1.75 };
  const POP = { 'Path_36-2': 2.45, 'Path_37-2': 2.62, 'Path_38-2': 2.8 };

  function camAt(t) {
    return {
      P: spline([[0, [-420, 70, 560]], [1.3, [-250, 105, 720]], [2.5, [90, 150, 960]], [3.7, [0, 182, 1260]], [6.0, [0, 196, 1370]]], t, 'linear'),
      T: spline([[0, [-170, 90, 0]], [1.3, [-40, 120, 0]], [2.5, [70, 160, 0]], [3.7, [0, 130, 0]], [6.0, [0, 124, 0]]], t, 'linear'),
    };
  }
  function update(t) {
    uni.uT.value = t;
    // camera: low tracking shot following the spark, cranes back into the hero frame
    const { P, T } = camAt(t);
    cam.position.set(...P); cam.up.set(0, 1, 0); cam.lookAt(...T); cam.fov = 30; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);

    // pieces
    order.forEach((id, k) => {
      const p = pieces[id], r = reflPieces[k];
      let y = 0, s = 1, rz = 0;
      if (RISE[id] !== undefined) {
        const u = seg(t, RISE[id], RISE[id] + 0.75);
        y = -p.h * 1.02 * (1 - E.outBack(u, 1.5));
        const land = pulse(t, RISE[id] + 0.42, 0.03, 0.18) * Math.cos((t - RISE[id] - 0.42) * 20);
        s = 1 + land * 0.035;
      } else {
        const u = seg(t, POP[id], POP[id] + 0.5);
        s = u <= 0 ? 0.0001 : E.outBack(u, 2.6);
        rz = (1 - E.outCubic(u)) * 0.6;
      }
      p.holder.position.set(p.pivot.x, p.pivot.y + y, p.pivot.z);
      p.holder.scale.set(RISE[id] !== undefined ? 1 / Math.sqrt(s) : s, s, RISE[id] !== undefined ? 1 : s);
      p.holder.rotation.z = rz;
      p.holder.visible = s > 0.001 && (RISE[id] === undefined || t > RISE[id]);
      r.position.copy(p.holder.position); r.scale.copy(p.holder.scale); r.rotation.copy(p.holder.rotation); r.visible = p.holder.visible;
    });
    // light sweep across the mark (a moving hot spot on the clearcoat)
    const sweep = seg(t, 3.3, 4.3);
    sparkLight.position.set(...(t < 3.4 ? sparkAt(t) : [lerp(-320, 320, E.inOutSine(sweep)), 240, 260]));
    sparkLight.intensity = (t < 3.4 ? envl(t, 0.4, 0.8, 3.1, 3.45) * 2.2e4 : 0); sparkLight.visible = sparkLight.intensity > 20;
    faceM.emissive.setHex(AM_BLUE); faceM.emissiveIntensity = pulse(t, 3.35, 0.05, 0.5) * 0.25;
    shine.uSweep.value = lerp(-520, 620, E.inOutSine(sweep));
    { const k = envl(t, 3.3, 3.42, 3.6, 4.15); const apex = [pieces['Path_39-2'].pivot.x + 22, 350, 20]; star.position.set(...apex); star.visible = k > 0.003; star.material.opacity = k; const sc = 90 + 170 * E.outBack(seg(t, 3.3, 3.6)) * (1 - 0.25 * seg(t, 3.6, 4.15)); star.scale.set(sc, sc, 1); star.material.rotation = t * 0.6; }
    uni.uGlow.value = E.outCubic(seg(t, 1.2, 3.4));
    ringMat.opacity = envl(t, 1.25, 1.6, 4.6, 5.6) * 0.55; floorRing.scale.setScalar(0.6 + E.outCubic(seg(t, 1.25, 2.6)) * 0.45);

    // spark
    const alive = t > 0.35 && t < 3.55;
    const sp = sparkAt(t);
    core.visible = alive || (t >= 3.35 && t < 4.2);
    { const a = core.geometry.attributes; a.position.array.set(sp); a.a.array[0] = t < 3.35 ? envl(t, 0.35, 0.55, 3.3, 3.4) : Math.max(0, 1 - (t - 3.35) / 0.7) * (1 + pulse(t, 3.35, 0.04, 0.2) * 2); a.position.needsUpdate = true; a.a.needsUpdate = true; }
    { const a = trail.geometry.attributes; const n = 70; for (let k = 0; k < n; k++) { const tk = t - k * 0.011; const p = sparkAt(tk); a.position.array.set(p, k * 3); a.a.array[k] = tk > 0.36 && tk < 3.36 ? (1 - k / n) * 0.8 : 0; } a.position.needsUpdate = true; a.a.needsUpdate = true; trail.visible = alive; }
    { const a = dust.geometry.attributes; dustSeeds.forEach((d, k) => { const dt = t - d.t0; const o = sparkAt(d.t0); if (dt < 0 || dt > d.life) { a.a.array[k] = 0; return; } a.position.array.set([o[0] + d.vx * dt, o[1] + d.vy * dt - 70 * dt * dt, o[2] + d.vz * dt], k * 3); a.a.array[k] = (1 - dt / d.life) * (0.5 + 0.5 * Math.sin(t * 30 + k)); }); a.position.needsUpdate = true; a.a.needsUpdate = true; }

    const fade = Math.max(1 - E.outQuad(seg(t, 0, 0.7)), E.inQuad(seg(t, 5.25, 5.95)));
    return { focus: Math.hypot(T[0] - P[0], T[1] - P[1], T[2] - P[2]), fade };
  }
  return { scene, update, camAt, duration: IDENT };
}
