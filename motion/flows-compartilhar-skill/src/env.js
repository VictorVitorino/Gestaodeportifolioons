// WebGL environment: dusk sky, stars, drifting bokeh, the circular FLOWS stage with
// golden rings and rim, light column, plus a bloom pass (the "glow" of an AE comp).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { rng } from './util.js';

const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }`;

export class Env {
  constructor(canvas, W, H) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }));
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, W / H, 5, 30000);
    this.uni = { uTime: { value: 0 }, uSkyShift: { value: 0 }, uSunDir: { value: new THREE.Vector3(0, 0.08, -1).normalize() }, uDim: { value: 0 } };
    this.buildSky(); this.buildStars(); this.buildBokeh(); this.buildStage(); this.buildBeam();
    const comp = (this.composer = new EffectComposer(r));
    comp.setPixelRatio(1); comp.setSize(W, H);
    comp.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.8, 0.45, 0.93);
    comp.addPass(this.bloom);
    comp.addPass(new OutputPass());
  }

  buildSky() {
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: this.uni,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vDir; uniform float uTime; uniform vec3 uSunDir; uniform float uDim; ${NOISE}
      vec3 C(float r,float g,float b){ return vec3(r,g,b)/255.0; }
      void main(){
        float e = vDir.y;
        vec3 deep = C(20.0,18.0,54.0), indigo = C(50.0,42.0,104.0), lav = C(108.0,86.0,144.0), pink = C(168.0,120.0,148.0), peach = C(206.0,160.0,156.0), cream = C(222.0,184.0,170.0);
        vec3 col;
        if (e > 0.0) {
          col = mix(cream, peach, smoothstep(0.0, 0.06, e));
          col = mix(col, pink, smoothstep(0.05, 0.16, e));
          col = mix(col, lav, smoothstep(0.14, 0.30, e));
          col = mix(col, indigo, smoothstep(0.28, 0.55, e));
          col = mix(col, deep, smoothstep(0.5, 0.9, e));
        } else {
          col = mix(cream, C(150.0,120.0,170.0), smoothstep(0.0, 0.08, -e));
          col = mix(col, C(40.0,36.0,92.0), smoothstep(0.06, 0.35, -e));
        }
        float az = atan(vDir.x, -vDir.z);
        float band = fbm(vec2(az*1.6 + uTime*0.01, e*7.0)) ;
        float wisps = smoothstep(0.45, 0.9, fbm(vec2(az*2.4 - uTime*0.008, e*14.0 + 3.0)));
        col += (band-0.5)*0.05 + wisps*0.05*vec3(1.0,0.85,0.9)*smoothstep(0.0,0.3,e)*(1.0-smoothstep(0.35,0.6,e));
        float sun = max(dot(normalize(vDir), uSunDir), 0.0);
        col += C(255.0,200.0,160.0) * (pow(sun, 40.0)*0.16 + pow(sun, 6.0)*0.05);
        col *= 1.0 - uDim;
        gl_FragColor = vec4(col, 1.0);
      }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 64, 32), m);
    this.scene.add(this.sky);
  }

  buildStars() {
    const R = rng(7), n = 2600, pos = new Float32Array(n * 3), ph = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = R(), v = 0.22 + R() * 0.78, az = u * Math.PI * 2;
      const e = Math.asin(v), rr = 15000;
      pos[i * 3] = Math.cos(e) * Math.sin(az) * rr; pos[i * 3 + 1] = Math.sin(e) * rr; pos[i * 3 + 2] = -Math.cos(e) * Math.cos(az) * rr;
      ph[i] = R() * 6.28; sz[i] = 1.0 + Math.pow(R(), 6) * 3.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
    g.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: this.uni,
      vertexShader: `attribute float ph; attribute float sz; varying float vA; uniform float uTime;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv;
          float e = normalize(position).y; vA = (0.35 + 0.65*sin(uTime*1.7+ph*3.0)*0.5+0.5) * smoothstep(0.2,0.5,e);
          gl_PointSize = sz*1.6; }`,
      fragmentShader: `varying float vA; uniform float uDim; void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c);
        float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vec3(1.0,0.97,0.92)*a*vA*0.9*(1.0-uDim), 1.0); }`,
    });
    this.stars = new THREE.Points(g, m);
    this.scene.add(this.stars);
  }

  buildBokeh() {
    const R = rng(11), n = 110;
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n);
    const warm = [[1.0, 0.78, 0.45], [1.0, 0.86, 0.62], [1.0, 0.7, 0.5], [0.72, 0.74, 1.0], [1.0, 0.9, 0.78]];
    for (let i = 0; i < n; i++) {
      const az = R() * Math.PI * 2, rad = 700 + R() * 2600, y = 120 + Math.pow(R(), 0.8) * 1500;
      pos[i * 3] = Math.sin(az) * rad; pos[i * 3 + 1] = y; pos[i * 3 + 2] = -Math.cos(az) * rad;
      const c = warm[(R() * warm.length) | 0]; col.set(c, i * 3);
      sz[i] = 30 + R() * 90; ph[i] = R() * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('col', new THREE.BufferAttribute(col, 3));
    g.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { ...this.uni, uAmt: { value: 1 } },
      vertexShader: `attribute vec3 col; attribute float sz; attribute float ph; varying vec3 vC; varying float vA; uniform float uTime;
        void main(){ vec3 p = position; p.y += sin(uTime*0.23+ph)*40.0; p.x += cos(uTime*0.17+ph*1.3)*50.0;
          vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv;
          float dist = -mv.z; gl_PointSize = clamp(sz * 900.0 / dist, 6.0, 190.0);
          vC = col; vA = (0.5+0.5*sin(uTime*0.6+ph)) * 0.55 + 0.25; }`,
      fragmentShader: `varying vec3 vC; varying float vA; uniform float uAmt; uniform float uDim; void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c)*2.0;
        float disc = smoothstep(1.0, 0.82, d); float rim = smoothstep(0.7, 0.95, d)*disc*0.5;
        float a = (disc*0.28 + rim*0.35) * vA * uAmt * (1.0-uDim);
        gl_FragColor = vec4(vC*a, 1.0); }`,
    });
    this.bokehMat = m;
    this.bokeh = new THREE.Points(g, m);
    this.bokeh.renderOrder = 10;
    this.scene.add(this.bokeh);
  }

  buildStage() {
    const R = (this.R = 1100);
    this.stageU = {
      ...this.uni,
      uR: { value: R },
      uWaves: { value: [new THREE.Vector4(0, 0, -1, 0), new THREE.Vector4(0, 0, -1, 0), new THREE.Vector4(0, 0, -1, 0)] },
      uGlow: { value: 1 }, uSpot: { value: new THREE.Vector4(0, 0, 160, 0.5) },
    };
    const floor = new THREE.ShaderMaterial({
      uniforms: this.stageU,
      vertexShader: `varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `varying vec2 vP; varying vec3 vW; uniform float uR; uniform float uTime; uniform vec4 uWaves[3]; uniform float uGlow; uniform vec4 uSpot; uniform float uDim; ${NOISE}
        float ringLine(float r, float rr, float w){ return exp(-pow((r-rr)/w, 2.0)); }
        void main(){
          vec2 p = vec2(vW.x, vW.z); float r = length(p); float a = atan(p.y, p.x);
          vec3 base = mix(vec3(0.17,0.22,0.56), vec3(0.09,0.12,0.36), smoothstep(0.0, uR, r));
          base += vec3(0.05,0.05,0.09) * (fbm(p*0.004)-0.5);
          vec3 camDir = normalize(cameraPosition - vW);
          float fres = pow(1.0 - max(camDir.y, 0.0), 3.0);
          base = mix(base, vec3(0.42,0.40,0.66), fres*0.30);
          vec3 gold = vec3(1.0, 0.66, 0.28);
          float lines = 0.0;
          lines += ringLine(r, 150.0, 1.5) * 0.55;
          lines += ringLine(r, 430.0, 1.4) * 0.55;
          lines += ringLine(r, 760.0, 1.4) * 0.45;
          lines += ringLine(r, uR-40.0, 2.0) * 0.75;
          float spokes = 0.0;
          for (int i=0;i<12;i++){ float ang = float(i)*0.5235988; vec2 d = vec2(cos(ang), sin(ang)); float dist = abs(dot(p, vec2(-d.y, d.x))); spokes += exp(-pow(dist/1.4,2.0)) * step(0.0, dot(p,d)) * smoothstep(160.0, 240.0, r) * (1.0 - smoothstep(uR-60.0, uR-40.0, r)); }
          lines += spokes*0.16;
          float ticks = step(0.8, fract(a/6.2831853*96.0)) * smoothstep(uR-80.0, uR-76.0, r) * (1.0-smoothstep(uR-62.0, uR-58.0, r));
          lines += ticks*0.5;
          float w = 0.0;
          for (int i=0;i<3;i++){ if (uWaves[i].z > 0.0) { float rr = length(p - uWaves[i].xy); w += exp(-pow((rr-uWaves[i].z)/(14.0+uWaves[i].z*0.03), 2.0)) * uWaves[i].w; } }
          float spot = exp(-pow(length(p - uSpot.xy)/uSpot.z, 2.0)) * uSpot.w;
          vec3 col = base + gold*lines*0.95*uGlow + vec3(1.0,0.8,0.5)*w*1.6 + vec3(1.0,0.82,0.55)*spot*0.45;
          col *= 1.0 - uDim*0.85;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 256), floor);
    disc.rotation.x = -Math.PI / 2;
    this.scene.add(disc);
    const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.97, 60, 256, 1, true), new THREE.MeshBasicMaterial({ color: 0x151a4a }));
    side.position.y = -30.5; this.scene.add(side);
    const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.45, 0.62) });
    this.rimMat = rimMat;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 5, 12, 360), rimMat);
    rim.rotation.x = -Math.PI / 2; rim.position.y = 1.5; this.scene.add(rim);
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(R - 12, 1.6, 8, 360), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, 0.5) }));
    rim2.rotation.x = -Math.PI / 2; rim2.position.y = 1; this.scene.add(rim2);
  }

  buildBeam() {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uA: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uA; void main(){ float a = pow(1.0 - vUv.y, 1.6) * uA; float edge = 1.0 - abs(vUv.x*2.0-1.0);
        gl_FragColor = vec4(vec3(1.0,0.82,0.52)*a*(0.6+0.4*edge), 1.0); }`,
    });
    this.beamMat = m;
    const g = new THREE.CylinderGeometry(34, 52, 1100, 48, 1, true);
    g.translate(0, 550, 0);
    this.beam = new THREE.Mesh(g, m); this.beam.renderOrder = 5;
    this.scene.add(this.beam);
  }

  set({ time = 0, waves = [], spot = null, beam = 0, bokeh = 1, glow = 1, dim = 0, bloom = 0.85, beamPos = [0, 0] }) {
    this.uni.uTime.value = time;
    this.uni.uDim.value = dim;
    for (let i = 0; i < 3; i++) {
      const w = waves[i];
      this.stageU.uWaves.value[i].set(w ? w[0] : 0, w ? w[1] : 0, w ? w[2] : -1, w ? w[3] : 0);
    }
    if (spot) this.stageU.uSpot.value.set(spot[0], spot[1], spot[2], spot[3]);
    this.stageU.uGlow.value = glow;
    this.beamMat.uniforms.uA.value = beam;
    this.beam.visible = beam > 0.001;
    this.beam.position.set(beamPos[0], 0, beamPos[1]);
    this.bokehMat.uniforms.uAmt.value = bokeh;
    this.bloom.strength = bloom;
  }

  render() { this.composer.render(); }
}
