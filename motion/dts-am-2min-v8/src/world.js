// Renderer, lighting, sky, plaza and post-processing. A&M clean look (2:00 cut): soft navy-to-pale sky with
// faint stars, A&M navy plaza with thin champagne rings, neutral daylight, no act-light washes, low bloom.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { DOFPass } from './dofpass.js';
import { MotionBlurPass } from './mblur.js';
import { rng } from './util.js';

const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }`;

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.32 }, uTime: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Vector3(1, 0.95, 0.86) }, uWarm: { value: 1 }, uAberr: { value: 0.0 }, uSharp: { value: 0.32 }, uTexel: { value: new THREE.Vector2(1 / 1920, 1 / 1080) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig, uFade, uFlash, uWarm, uAberr, uSharp; uniform vec2 uTexel; uniform vec3 uFlashCol; varying vec2 vUv;
    void main(){
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec3 c;
      c.r = texture2D(tDiffuse, vUv + d * uAberr * r2 * 4.0).r;
      c.g = texture2D(tDiffuse, vUv).g;
      c.b = texture2D(tDiffuse, vUv - d * uAberr * r2 * 4.0).b;
      // gentle unsharp mask: restores micro-contrast lost to MSAA resolve and post blurs
      vec3 nb = (texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb + texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.0)).rgb
               + texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb + texture2D(tDiffuse, vUv - vec2(0.0, uTexel.y)).rgb) * 0.25;
      c = max(c + (c - nb) * uSharp, 0.0);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      vec3 shadowTint = vec3(0.975, 0.99, 1.03), highTint = vec3(1.015, 1.0, 0.985);
      c *= mix(shadowTint, highTint, smoothstep(0.15, 0.85, l) * uWarm + (1.0 - uWarm) * 0.5);
      c = mix(vec3(l), c, 0.98);
      c = (c - 0.5) * 1.04 + 0.5;
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.08);
      float vig = smoothstep(0.95, 0.25, sqrt(r2) * 1.25);
      c *= mix(1.0 - uVig, 1.0, vig);
      c = mix(c, uFlashCol, uFlash);
      c *= 1.0 - uFade;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class World {
  constructor(canvas, W, H) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true }));
    r.setPixelRatio(1); r.setSize(W, H, false); canvas.style.width = '1920px'; canvas.style.height = '1080px';
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.maxAniso = r.capabilities.getMaxAnisotropy();
    const sc = (this.scene = new THREE.Scene());
    sc.fog = new THREE.FogExp2(0x2c3f7c, 0.00009);
    this.camera = new THREE.PerspectiveCamera(30, W / H, 4, 30000);
    this.uni = { uTime: { value: 0 } };
    this.buildSky(); this.buildLights(); this.buildPlaza(); this.buildAtmosphere();
    sc.environment = this.sunsetEnv(r);
    const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
    const comp = (this.composer = new EffectComposer(r, rt));
    comp.setPixelRatio(1); comp.setSize(W, H);
    this.renderPass = new RenderPass(sc, this.camera); comp.addPass(this.renderPass);
    this.dof = new DOFPass(sc, this.camera, { focus: 800, aperture: 0.00006, maxblur: 0.009 });
    comp.addPass(this.dof);
    this.mblur = new MotionBlurPass(sc, this.camera, this.dof, W, H);
    comp.addPass(this.mblur);
    this.prevCam = this.camera.clone();
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.2, 0.3, 1.5);
    comp.addPass(this.bloom);
    comp.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.grade.uniforms.uTexel.value.set(1 / W, 1 / H);
    comp.addPass(this.grade);
    this.mblur.mat.uniforms.uMaxPx.value = 14 * (W / 1920);
  }

  buildSky() {
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.uni,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vDir; uniform float uTime; ${NOISE}
        vec3 C(float r,float g,float b){ return vec3(r,g,b)/255.0; }
        vec3 S(float r,float g,float b){ return pow(vec3(r,g,b)/255.0, vec3(2.2)); }
        void main(){
          float e = vDir.y; float az = atan(vDir.x, -vDir.z);
          // A&M clean sky (sRGB design values -> linear): navy zenith, soft blue-grey, pale warm-white horizon
          vec3 zen = S(12.0,26.0,74.0), hi = S(26.0,52.0,124.0), mid = S(56.0,86.0,162.0), low = S(128.0,142.0,198.0), hor = S(214.0,206.0,210.0);
          vec3 col = mix(hor, low, smoothstep(0.0, 0.035, e));
          col = mix(col, mid, smoothstep(0.03, 0.12, e));
          col = mix(col, hi, smoothstep(0.10, 0.32, e));
          col = mix(col, zen, smoothstep(0.30, 0.75, e));
          if (e < 0.0) col = mix(hor, S(30.0,48.0,104.0), smoothstep(0.0, 0.2, -e));
          float sunA = exp(-pow(az / 0.6, 2.0)) * exp(-pow(e / 0.18, 2.0));
          col += S(240.0,226.0,214.0) * sunA * 0.12;
          float cl = fbm(vec2(az * 3.0 + uTime * 0.01, e * 9.0));
          float band = smoothstep(0.03, 0.10, e) * (1.0 - smoothstep(0.14, 0.34, e));
          col = mix(col, mix(col, S(214.0,212.0,226.0), 0.35), smoothstep(0.55, 0.85, cl) * band * 0.6);
          // faint stars in the upper sky (as in the Mundo Flows references)
          vec2 gs = vec2(az * 260.0, e * 260.0); vec2 idc = floor(gs); vec2 fc = fract(gs) - 0.5;
          float hs = hash(idc), h2 = hash(idc + 17.31);
          vec2 off = vec2(h2 - 0.5, fract(h2 * 7.13) - 0.5) * 0.6;
          float star = step(0.986, hs) * smoothstep(0.10, 0.0, length(fc - off)) * (0.65 + 0.35 * sin(uTime * 1.3 + h2 * 40.0));
          col += vec3(0.9, 0.93, 1.0) * star * smoothstep(0.12, 0.45, e) * 0.8;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.skyMat = m;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 64, 32), m);
    sky.userData.noDepth = true; this.scene.add(sky);
  }

  sunsetEnv(r) {
    // Reflections come from the film's own sunset sky plus two soft light cards,
    // so glossy props mirror warm horizon colours instead of a white studio.
    const es = new THREE.Scene();
    const skyM = this.skyMat.clone();
    skyM.uniforms = { uTime: { value: 0 } };
    skyM.fragmentShader = skyM.fragmentShader.replace('gl_FragColor = vec4(col, 1.0);', 'gl_FragColor = vec4(col * 0.8, 1.0);');
    const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), skyM);
    es.add(sky);
    const card = (color, intensity, pos, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); es.add(m); };
    card(0xffffff, 1.25, [-22, 30, 26], 26, 16);
    card(0xfff3e6, 0.45, [6, 8, -46], 40, 10);
    card(0xdde8ff, 0.7, [40, 20, 10], 14, 20);
    const pm = new THREE.PMREMGenerator(r);
    return pm.fromScene(es, 0.02, 0.1, 200).texture;
  }

  buildLights() {
    const key = (this.key = new THREE.DirectionalLight(0xfff5ea, 1.9));
    key.position.set(-700, 1300, 900); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -1100, right: 1100, top: 1100, bottom: -1100, near: 50, far: 4000 });
    key.shadow.radius = 5; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.6;
    this.scene.add(key); this.scene.add(key.target);
    const sun = (this.sun = new THREE.DirectionalLight(0xe4ecff, 0.6));
    sun.position.set(200, 1900, -1700); // high cool rim light: no specular hot spot on the plaza floor this.scene.add(sun);
    const hemi = (this.hemi = new THREE.HemisphereLight(0xc9d7ff, 0x10204a, 0.7));
    this.scene.add(hemi);
  }

  plazaTexture() {
    const S = 4096, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, '#1f4a9c'); g.addColorStop(0.55, '#143879'); g.addColorStop(1, '#0a2456');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    const R = rng(4);
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(255,255,255,${R() * 0.018})`; x.fillRect(R() * S, R() * S, 2 + R() * 6, 2 + R() * 6); }
    const ring = (rr, w, a) => { x.strokeStyle = `rgba(236,210,158,${a})`; x.lineWidth = w; x.beginPath(); x.arc(S / 2, S / 2, rr, 0, Math.PI * 2); x.stroke(); };
    const k = S / 2 / 1400;
    ring(190 * k, 3.5, 0.9); ring(560 * k, 3, 0.55); ring(930 * k, 3, 0.45); ring(1330 * k, 6, 0.78); ring(1300 * k, 2, 0.4);
    x.strokeStyle = 'rgba(236,210,158,0.0)'; x.lineWidth = 3;
    if (false) for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; x.beginPath(); x.moveTo(S / 2 + Math.cos(a) * 230 * k, S / 2 + Math.sin(a) * 230 * k); x.lineTo(S / 2 + Math.cos(a) * 1290 * k, S / 2 + Math.sin(a) * 1290 * k); x.stroke(); }
    x.fillStyle = 'rgba(236,210,158,0.0)';
    if (false) for (let i = 0; i < 180; i++) { const a = (i / 180) * Math.PI * 2; x.save(); x.translate(S / 2 + Math.cos(a) * 1260 * k, S / 2 + Math.sin(a) * 1260 * k); x.rotate(a); x.fillRect(-10, -3, 20, 6); x.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = this.maxAniso;
    return t;
  }

  buildPlaza() {
    const mat = new THREE.MeshPhysicalMaterial({ map: this.plazaTexture(), roughness: 0.58, metalness: 0, clearcoat: 0.14, clearcoatRoughness: 0.45, envMapIntensity: 0.34 });
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(1400, 160), mat);
    plaza.rotation.x = -Math.PI / 2; plaza.receiveShadow = true; this.scene.add(plaza);
    const rim = (this.rim = new THREE.Mesh(new THREE.TorusGeometry(1400, 7, 16, 256), new THREE.MeshStandardMaterial({ color: 0xf0d49a, emissive: 0xe8bf72, emissiveIntensity: 1.2, roughness: 0.3 })));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 2; this.scene.add(rim);
    const side = new THREE.Mesh(new THREE.CylinderGeometry(1400, 1380, 50, 160, 1, true), new THREE.MeshStandardMaterial({ color: 0x0a2456, roughness: 0.6 }));
    side.position.y = -25; this.scene.add(side);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshStandardMaterial({ color: 0x172a5e, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -52; ground.receiveShadow = true; this.scene.add(ground);
  }

  buildAtmosphere() {
    // floating dust motes catching the light
    const R = rng(21), n = 900, pos = new Float32Array(n * 3), ph = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (R() - 0.5) * 2600; pos[i * 3 + 1] = 20 + R() * 700; pos[i * 3 + 2] = (R() - 0.5) * 2600; ph[i] = R() * 100; sz[i] = 1.5 + R() * 3.5; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1)); g.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: this.uni, fog: false,
      vertexShader: `attribute float ph; attribute float sz; varying float vA; uniform float uTime;
        void main(){ vec3 p = position; p.x += sin(uTime*0.21+ph)*26.0; p.y += sin(uTime*0.33+ph*1.7)*18.0; p.z += cos(uTime*0.18+ph)*26.0;
          vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv;
          float d = -mv.z; gl_PointSize = clamp(sz * 700.0 / d, 1.0, 14.0);
          vA = (0.35 + 0.65*abs(sin(uTime*0.7+ph))) * smoothstep(40.0, 260.0, d) * (1.0 - smoothstep(1500.0, 2600.0, d)); }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(1.0,0.95,0.86)*a*vA*0.32, 1.0); }`,
    });
    const dust = new THREE.Points(g, m); dust.userData.noDepth = true; dust.renderOrder = 20; this.scene.add(dust);
    // soft god rays from the sun, billboarded fans behind the library
    const rayMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { ...this.uni, uA: { value: 1 }, uTint: { value: new THREE.Color(1, 0.78, 0.5) } }, fog: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uA; uniform vec3 uTint; ${NOISE}
        void main(){ float x = vUv.x - 0.5; float beams = 0.0;
          for (int i=0;i<7;i++){ float fi = float(i); float cx = sin(fi*12.9+uTime*0.05)*0.35; float w = 0.02 + 0.03*fract(fi*0.37);
            beams += exp(-pow((x - cx*(1.0-vUv.y*0.6))/w, 2.0)) * (0.5+0.5*sin(uTime*0.4+fi)); }
          float fade = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
          gl_FragColor = vec4(uTint * beams * fade * 0.10 * uA, 1.0); }`,
    });
    this.rayMat = rayMat;
    const rays = new THREE.Mesh(new THREE.PlaneGeometry(5200, 2600), rayMat);
    rays.position.set(0, 1000, -2300); rays.rotation.x = 0.35; rays.userData.noDepth = true; rays.renderOrder = 15;
    this.scene.add(rays);
  }

  set({ time = 0, focus = 800, aperture = 0.00006, maxblur = 0.009, bloom = 0.2, fade = 0, flash = 0, flashCol = [1, 0.95, 0.86], vig = 0.18, exposure = 1.0, rays = 0 }) {
    this.grade.uniforms.uFlashCol.value.set(...flashCol);
    this.uni.uTime.value = time;
    const u = this.dof.uniforms; u.focus.value = focus; u.aperture.value = aperture; u.maxblur.value = maxblur;
    this.bloom.strength = bloom;
    this.grade.uniforms.uFade.value = fade; this.grade.uniforms.uFlash.value = flash; this.grade.uniforms.uVig.value = vig;
    this.renderer.toneMappingExposure = exposure;
    this.rayMat.uniforms.uA.value = rays;
  }
  // act light: the environment leans toward the pillar colour (backlight, plaza rim, sun rays)
  setAccent(color, amount = 0) {
    return; // A&M clean: the pillars keep their own colours; the environment no longer washes over at each step
    const k = Math.min(1, Math.max(0, amount));
    if (!this._base) this._base = { sun: this.sun.color.clone(), rim: this.rim.material.emissive.clone(), ray: new THREE.Color(1, 0.78, 0.5), hemi: this.hemi.color.clone() };
    const B = this._base;
    this.sun.color.copy(B.sun).lerp(color, k * 0.45); // tint only: brighter backlight blew out its floor glint
    this.rim.material.emissive.copy(B.rim).lerp(color, k); this.rim.material.emissiveIntensity = 1.6 + k * 0.9;
    this.rayMat.uniforms.uTint.value.copy(B.ray).lerp(color, k * 0.6);
    this.hemi.color.copy(B.hemi).lerp(color, k * 0.18);
  }
  // swap the rendered scene (studio ident uses its own stage, lights and environment)
  useScene(s) { this.renderPass.scene = s; this.dof.scene = s; this.mblur.scene = s; }
  // camera pose half a frame earlier (180° shutter) for the motion blur pass
  setPrevCamera(P, T, fov, amount = 1) {
    const c = this.prevCam; c.aspect = this.camera.aspect; c.near = this.camera.near; c.far = this.camera.far;
    c.position.set(...P); c.up.set(0, 1, 0); c.lookAt(...T); c.fov = fov; c.updateProjectionMatrix(); c.updateMatrixWorld(true);
    this.mblur.setPrev(c); this.mblur.amount = amount;
  }
  render() { this.composer.render(); }
}
