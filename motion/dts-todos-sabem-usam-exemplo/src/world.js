// Renderer, lighting, sky, plaza and post-processing: the "Pixar golden hour" look.
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
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.32 }, uTime: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Vector3(1, 0.95, 0.86) }, uWarm: { value: 1 }, uAberr: { value: 0.0006 }, uSharp: { value: 0.32 }, uTexel: { value: new THREE.Vector2(1 / 1920, 1 / 1080) } },
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
      vec3 shadowTint = vec3(0.92, 0.97, 1.08), highTint = vec3(1.06, 1.0, 0.92);
      c *= mix(shadowTint, highTint, smoothstep(0.15, 0.85, l) * uWarm + (1.0 - uWarm) * 0.5);
      c = mix(vec3(l), c, 1.06);
      c = (c - 0.5) * 1.08 + 0.5;
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
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
    sc.fog = new THREE.FogExp2(0x6a5a93, 0.00016);
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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.38, 0.35, 1.4);
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
        void main(){
          float e = vDir.y; float az = atan(vDir.x, -vDir.z);
          vec3 zen = C(28.0,30.0,78.0), mid = C(92.0,78.0,150.0), rose = C(214.0,140.0,150.0), peach = C(255.0,186.0,140.0), gold = C(255.0,214.0,160.0);
          vec3 col = mix(gold, peach, smoothstep(0.0, 0.05, e));
          col = mix(col, rose, smoothstep(0.04, 0.14, e));
          col = mix(col, mid, smoothstep(0.12, 0.34, e));
          col = mix(col, zen, smoothstep(0.30, 0.75, e));
          if (e < 0.0) col = mix(gold, C(60.0,48.0,100.0), smoothstep(0.0, 0.2, -e));
          float sunA = exp(-pow(az / 0.55, 2.0)) * exp(-pow(e / 0.22, 2.0));
          col += C(255.0,190.0,120.0) * sunA * 0.55;
          float cl = fbm(vec2(az * 3.0 + uTime * 0.01, e * 9.0));
          float band = smoothstep(0.05, 0.14, e) * (1.0 - smoothstep(0.16, 0.42, e));
          col = mix(col, col * 1.18 + C(40.0,20.0,10.0), smoothstep(0.55, 0.85, cl) * band * 0.6);
          col = mix(col, col * 0.9, smoothstep(0.35, 0.6, fbm(vec2(az * 6.0, e * 20.0))) * band * 0.25);
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
    skyM.fragmentShader = skyM.fragmentShader.replace('gl_FragColor = vec4(col, 1.0);', 'gl_FragColor = vec4(col * 0.62, 1.0);');
    const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), skyM);
    es.add(sky);
    const card = (color, intensity, pos, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); es.add(m); };
    card(0xfff0dc, 1.1, [-22, 30, 26], 26, 16);
    card(0xffb070, 0.7, [6, 8, -46], 40, 10);
    card(0x9cc0ff, 0.6, [40, 20, 10], 14, 20);
    const pm = new THREE.PMREMGenerator(r);
    return pm.fromScene(es, 0.02, 0.1, 200).texture;
  }

  buildLights() {
    const key = (this.key = new THREE.DirectionalLight(0xffe2c0, 1.7));
    key.position.set(-700, 1300, 900); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -1100, right: 1100, top: 1100, bottom: -1100, near: 50, far: 4000 });
    key.shadow.radius = 5; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.6;
    this.scene.add(key); this.scene.add(key.target);
    const sun = (this.sun = new THREE.DirectionalLight(0xff9a50, 1.5));
    sun.position.set(200, 500, -1800); this.scene.add(sun);
    const hemi = (this.hemi = new THREE.HemisphereLight(0x9cbcff, 0x3a2b58, 0.6));
    this.scene.add(hemi);
  }

  plazaTexture(glowOnly = false) {
    const S = 4096, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, '#3b4aa8'); g.addColorStop(0.55, '#26327f'); g.addColorStop(1, '#161c52');
    x.fillStyle = glowOnly ? '#000' : g; x.fillRect(0, 0, S, S);
    const R = rng(4);
    if (!glowOnly) for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(255,255,255,${R() * 0.025})`; x.fillRect(R() * S, R() * S, 2 + R() * 6, 2 + R() * 6); }
    const G = glowOnly ? 0.62 : 1; // (emissive: a little dimmer than the lines, the bloom does the rest)
    const ring = (rr, w, a) => { x.strokeStyle = `rgba(255,196,110,${a * G})`; x.lineWidth = w; x.beginPath(); x.arc(S / 2, S / 2, rr, 0, Math.PI * 2); x.stroke(); };
    const k = S / 2 / 1400;
    ring(190 * k, 5, 0.9); ring(560 * k, 4, 0.55); ring(930 * k, 4, 0.45); ring(1330 * k, 8, 0.8); ring(1300 * k, 3, 0.5);
    if (glowOnly) {
      // sparkles along the rings (the footage's floor twinkles with them)
      const R2 = rng(12);
      for (const rr of [190, 560, 930, 1300, 1330]) for (let i = 0; i < rr * 0.9; i++) {
        const a = R2() * Math.PI * 2, d = (R2() - 0.5) * 26 * k, s = 2 + R2() * 5;
        x.fillStyle = `rgba(255,${200 + R2() * 50},${130 + R2() * 90},${0.35 + R2() * 0.6})`;
        x.beginPath(); x.arc(S / 2 + Math.cos(a) * (rr * k + d), S / 2 + Math.sin(a) * (rr * k + d), s, 0, Math.PI * 2); x.fill();
      }
    }
    x.strokeStyle = `rgba(255,196,110,${0.18 * G})`; x.lineWidth = 3;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; x.beginPath(); x.moveTo(S / 2 + Math.cos(a) * 230 * k, S / 2 + Math.sin(a) * 230 * k); x.lineTo(S / 2 + Math.cos(a) * 1290 * k, S / 2 + Math.sin(a) * 1290 * k); x.stroke(); }
    x.fillStyle = 'rgba(255,200,120,0.7)';
    for (let i = 0; i < 180; i++) { const a = (i / 180) * Math.PI * 2; x.save(); x.translate(S / 2 + Math.cos(a) * 1260 * k, S / 2 + Math.sin(a) * 1260 * k); x.rotate(a); x.fillRect(-10, -3, 20, 6); x.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = this.maxAniso;
    return t;
  }

  buildPlaza() {
    const mat = new THREE.MeshPhysicalMaterial({ map: this.plazaTexture(), roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35, envMapIntensity: 0.45 });
    const plaza = (this.plaza = new THREE.Mesh(new THREE.CircleGeometry(1400, 160), mat));
    plaza.rotation.x = -Math.PI / 2; plaza.receiveShadow = true; this.scene.add(plaza);
    const rim = (this.rim = new THREE.Mesh(new THREE.TorusGeometry(1400, 7, 16, 256), new THREE.MeshStandardMaterial({ color: 0xffc46e, emissive: 0xffa640, emissiveIntensity: 1.6, roughness: 0.3 })));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 2; this.scene.add(rim);
    const side = new THREE.Mesh(new THREE.CylinderGeometry(1400, 1380, 50, 160, 1, true), new THREE.MeshStandardMaterial({ color: 0x151a4a, roughness: 0.6 }));
    side.position.y = -25; this.scene.add(side);
    const ground = (this.ground = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshStandardMaterial({ color: 0x241f4a, roughness: 0.95 })));
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
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vec3(1.0,0.86,0.62)*a*vA*0.55, 1.0); }`,
    });
    this.dustMat = m;
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


  // v10 · the Biblioteca at night: the same hall as Fabio's footage (navy sky full of stars, soft nebulae,
  // light falling from the zenith, glowing golden rings on the floor). Called once, before the first frame.
  night() {
    const sc = this.scene;
    sc.fog.color.set(0x111a48); sc.fog.density = 0.00013;
    this.skyMat.fragmentShader = `varying vec3 vDir; uniform float uTime; ${NOISE}
      vec3 C(float r,float g,float b){ return vec3(r,g,b)/255.0; }
      float star(vec3 d, float sc, float thr, float seed){
        vec2 uv = vec2(atan(d.x, -d.z) / 6.2831853 * 2.0, asin(clamp(d.y, -1.0, 1.0)) / 3.14159265) * sc;
        vec2 id = floor(uv), f = fract(uv) - 0.5; float h = hash(id + seed);
        if (h < thr) return 0.0;
        vec2 o = vec2(hash(id + seed + 3.1), hash(id + seed + 7.7)) - 0.5;
        float r = length(f - o * 0.7);
        float tw = 0.55 + 0.45 * sin(uTime * (1.2 + h * 2.5) + h * 60.0);
        return smoothstep(0.16, 0.0, r) * tw * (0.35 + 0.65 * fract(h * 37.0)); }
      void main(){
        vec3 d = normalize(vDir); float e = d.y; float az = atan(d.x, -d.z);
        vec3 zen = C(9.0,14.0,44.0), mid = C(20.0,31.0,88.0), hor = C(40.0,52.0,124.0), low = C(12.0,17.0,50.0);
        vec3 col = mix(hor, mid, smoothstep(0.0, 0.22, e));
        col = mix(col, zen, smoothstep(0.22, 0.85, e));
        if (e < 0.0) col = mix(hor, low, smoothstep(0.0, 0.18, -e));
        // nebulae: violet and blue veils, strongest a little above the horizon
        float n1 = fbm(vec2(az * 2.2 + 11.0, e * 5.5) + uTime * 0.004), n2 = fbm(vec2(az * 4.3 - 3.0, e * 9.0 + 5.0));
        float band = smoothstep(0.02, 0.2, e) * (1.0 - smoothstep(0.45, 0.9, e));
        col += C(74.0, 46.0, 140.0) * smoothstep(0.48, 0.85, n1) * 0.55 * band;
        col += C(40.0, 82.0, 190.0) * smoothstep(0.55, 0.9, n2) * 0.35 * band;
        // light falling from the zenith, and a faint warm glow on the horizon (the library's own light)
        float z = acos(clamp(e, -1.0, 1.0));
        col += C(120.0, 150.0, 255.0) * exp(-pow(z / 0.42, 2.0)) * 0.22;
        col += C(255.0, 190.0, 120.0) * exp(-pow(e / 0.05, 2.0)) * 0.10;
        // stars (three layers; the dense small ones only high in the sky)
        float st = star(d, 150.0, 0.972, 1.0) + star(d, 320.0, 0.982, 9.0) * smoothstep(0.05, 0.3, e) + star(d, 70.0, 0.992, 21.0) * 1.4;
        col += vec3(0.86, 0.9, 1.0) * st * smoothstep(-0.02, 0.1, e);
        gl_FragColor = vec4(col, 1.0);
      }`;
    this.skyMat.needsUpdate = true;
    // lights: a warm key (the stage light), a cool backlight, a navy fill
    this.key.color.set(0xffe4c4); this.key.intensity = 1.45;
    this.sun.color.set(0x7f97ff); this.sun.intensity = 1.05; this.sun.position.set(200, 700, -1800);
    this.hemi.color.set(0x6f87dd); this.hemi.groundColor.set(0x0b1030); this.hemi.intensity = 0.55;
    sc.environment = this.nightEnv(this.renderer);
    // the floor's rings glow (an emissive copy of the plaza's lines), the ground beyond is the night
    const m = this.plaza.material; m.emissiveMap = this.plazaTexture(true); m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 1.0; m.needsUpdate = true;
    m.color.setRGB(0.86, 0.9, 1.0);
    this.ground.material.color.set(0x0c1234);
    this.rim.material.emissiveIntensity = 2.2;
    this.rayMat.uniforms.uTint.value.setRGB(0.62, 0.72, 1.0);
    this._base = null; // setAccent re-reads the base colours from the night
    this.isNight = true;
  }

  nightEnv(r) {
    const es = new THREE.Scene();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vD; void main(){ float e = vD.y; vec3 c = mix(vec3(0.10,0.13,0.32), vec3(0.03,0.05,0.16), smoothstep(0.0, 0.8, e)); if (e < 0.0) c = mix(vec3(0.10,0.13,0.32), vec3(0.05,0.06,0.16), smoothstep(0.0, 0.3, -e)); gl_FragColor = vec4(c, 1.0); }' }));
    es.add(sky);
    const card = (color, intensity, pos, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); es.add(m); };
    card(0xffe6c8, 1.0, [-22, 30, 26], 26, 16);
    card(0xffb45a, 0.55, [0, 6, -46], 60, 6);
    card(0x8fa8ff, 0.7, [40, 20, 10], 14, 20);
    card(0xc9d6ff, 0.35, [0, 46, 0], 30, 30);
    const pm = new THREE.PMREMGenerator(r);
    return pm.fromScene(es, 0.02, 0.1, 200).texture;
  }

  set({ time = 0, focus = 800, aperture = 0.00006, maxblur = 0.009, bloom = 0.38, fade = 0, flash = 0, flashCol = [1, 0.95, 0.86], vig = 0.32, exposure = 1.0, rays = 1 }) {
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
