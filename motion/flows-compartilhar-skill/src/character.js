// 2.5D character: eight turnaround views as sprites + a skinned cut-out rig of the
// front view (shoulder / elbow / wrist bones, like an After Effects Puppet/DUIK rig).
// Rendered with WebGL into a canvas that lives inside the CSS3D scene.
const VS = `#version 300 es
in vec2 aPos; in vec2 aUv; uniform mat3 uM; out vec2 vUv;
void main(){ vec3 p = uM * vec3(aPos,1.0); gl_Position = vec4(p.xy,0.0,1.0); vUv = aUv; }`;
const FS = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uTex; uniform float uAlpha; out vec4 o;
void main(){ o = texture(uTex, vUv) * uAlpha; }`;
const VS2 = `#version 300 es
in vec2 aPos; out vec2 vUv; void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;
const FS2 = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uTex; uniform vec2 uPx; uniform vec2 uLight;
uniform vec3 uRim; uniform vec3 uRim2; uniform vec3 uTint; uniform vec3 uFog; uniform float uFogAmt; uniform float uExpo; uniform float uFlash; out vec4 o;
void main(){
  vec4 c = texture(uTex, vUv);
  if (c.a < 0.002) { o = vec4(0.0); return; }
  float r = 0.0, r2 = 0.0;
  for (int i = 1; i <= 4; i++) {
    float f = float(i);
    r += (1.0 - texture(uTex, vUv + uLight * uPx * f * 1.6).a) * (1.4 - f * 0.25);
    r2 += (1.0 - texture(uTex, vUv - vec2(uLight.x, -uLight.y) * uPx * f * 1.4).a) * (1.4 - f * 0.25);
  }
  r = clamp(r / 3.4, 0.0, 1.0) * c.a; r2 = clamp(r2 / 3.4, 0.0, 1.0) * c.a;
  vec3 col = c.rgb / c.a;
  col = pow(col, vec3(0.97)) * uTint * uExpo;
  col += uRim * r * 0.95 + uRim2 * r2 * 0.55;
  col = mix(col, uFog, uFogAmt);
  col = mix(col, vec3(1.0, 0.93, 0.8), uFlash);
  o = vec4(col * c.a, c.a);
}`;

function compile(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const LOGICAL = { x0: -390, x1: 390, y0: -930, y1: 40 }; // sheet px around the ground anchor
export const SHEET_H = 785; // character height in sheet px (v1)

export class Character {
  async init(base) {
    this.meta = await (await fetch(base + 'meta.json')).json();
    this.rig = await (await fetch(base + 'rig_v1.json')).json();
    const names = ['v1_torso', 'v1_armA', 'v1_armB', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'hero'];
    const imgs = await Promise.all(names.map((n) => loadImg(base + n + '.png')));
    this.imgs = Object.fromEntries(names.map((n, i) => [n, imgs[i]]));
    const c = (this.canvas = document.createElement('canvas'));
    c.width = 400; c.height = 500;
    const gl = (this.gl = c.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: true, preserveDrawingBuffer: true }));
    this.p1 = compile(gl, VS, FS);
    this.p2 = compile(gl, VS2, FS2);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    this.tex = {};
    for (const n of names) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.imgs[n]);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.tex[n] = t;
    }
    this.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.vbo = gl.createBuffer(); this.ibo = gl.createBuffer();
    this.fbo = null; this.fboTex = null; this.fw = 0; this.fh = 0;
    this.buildRig();
  }

  alphaOf(name) {
    const img = this.imgs[name];
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, img.width, img.height).data;
    const a = new Uint8Array(img.width * img.height);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
    return { a, w: img.width, h: img.height };
  }

  // Grid mesh over the opaque region of a layer; weights(xImg, yImg) -> [w0..w7]
  gridMesh(name, weights, cell = 5) {
    const { a, w, h } = this.alphaOf(name);
    const cw = Math.ceil(w / cell), ch = Math.ceil(h / cell);
    const used = new Uint8Array(cw * ch);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] > 3) used[((y / cell) | 0) * cw + ((x / cell) | 0)] = 1;
    const dil = used.slice();
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) if (used[j * cw + i]) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < cw && jj < ch) dil[jj * cw + ii] = 1;
    }
    const vid = new Int32Array((cw + 1) * (ch + 1)).fill(-1);
    const rest = [], uv = [], wts = [], idx = [];
    const m = this.meta.v1;
    const vtx = (i, j) => {
      const k = j * (cw + 1) + i;
      if (vid[k] < 0) {
        const X = Math.min(i * cell, w), Y = Math.min(j * cell, h);
        vid[k] = rest.length / 2;
        rest.push(X - m.ax, Y - m.ay); uv.push(X / w, Y / h); wts.push(weights(X, Y));
      }
      return vid[k];
    };
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) if (dil[j * cw + i]) {
      const a0 = vtx(i, j), a1 = vtx(i + 1, j), a2 = vtx(i, j + 1), a3 = vtx(i + 1, j + 1);
      idx.push(a0, a1, a2, a1, a3, a2);
    }
    return { name, rest: new Float32Array(rest), uv: new Float32Array(uv), w: wts, idx: new Uint32Array(idx), out: new Float32Array(rest.length) };
  }

  buildRig() {
    const R = this.rig, m = this.meta.v1;
    const L = (p) => [p[0] - m.ax, p[1] - m.ay];
    this.J = {
      N: L(R.head.N), SA: L(R.armA.S), EA: L(R.armA.E), WA: L(R.armA.W), SB: L(R.armB.S), EB: L(R.armB.E), WB: L(R.armB.W),
    };
    const cutSide = (cut, E) => {
      const [p0, p1] = cut; const dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const len = Math.hypot(dx, dy);
      let nx = -dy / len, ny = dx / len;
      if ((E[0] - p0[0]) * nx + (E[1] - p0[1]) * ny < 0) { nx = -nx; ny = -ny; }
      return (x, y) => (x - p0[0]) * nx + (y - p0[1]) * ny;
    };
    const dA = cutSide(R.armA.cut, R.armA.E), dB = cutSide(R.armB.cut, R.armB.E);
    const armW = (d, E, Wr, base) => (x, y) => {
      const wr = 1 - sstep(0, 24, d(x, y));
      const wf = sstep(E[1] - 14, E[1] + 14, y);
      const wh = sstep(Wr[1] - 6, Wr[1] + 10, y);
      const up = 1 - wr;
      const out = [wr, 0, 0, 0, 0, 0, 0, 0];
      out[base] = up * (1 - wf); out[base + 1] = up * wf * (1 - wh); out[base + 2] = up * wf * wh;
      return out;
    };
    // bones: 0 root, 1 head, 2 upperA, 3 foreA, 4 handA, 5 upperB, 6 foreB, 7 handB
    this.meshes = [
      this.gridMesh('v1_torso', (x, y) => { const wh = 1 - sstep(R.head.y0, R.head.y1, y); return [1 - wh, wh, 0, 0, 0, 0, 0, 0]; }, 6),
      this.gridMesh('v1_armA', armW(dA, R.armA.E, R.armA.W, 2), 4),
      this.gridMesh('v1_armB', armW(dB, R.armB.E, R.armB.W, 5), 4),
    ];
  }

  // pose angles in degrees (screen space, positive = clockwise on screen)
  skin(pose) {
    const rot = (a, c) => { const r = (a * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r); return (x, y) => [c[0] + (x - c[0]) * cs - (y - c[1]) * sn, c[1] + (x - c[0]) * sn + (y - c[1]) * cs]; };
    const J = this.J;
    const head = rot(pose.head || 0, J.N);
    const uA = rot(pose.uA || 0, J.SA), fA0 = rot(pose.fA || 0, J.EA), hA0 = rot(pose.hA || 0, J.WA);
    const uB = rot(pose.uB || 0, J.SB), fB0 = rot(pose.fB || 0, J.EB), hB0 = rot(pose.hB || 0, J.WB);
    const fA = (x, y) => uA(...fA0(x, y)), hA = (x, y) => fA(...hA0(x, y));
    const fB = (x, y) => uB(...fB0(x, y)), hB = (x, y) => fB(...hB0(x, y));
    const bones = [(x, y) => [x, y], head, uA, fA, hA, uB, fB, hB];
    for (const me of this.meshes) {
      const n = me.rest.length / 2;
      for (let i = 0; i < n; i++) {
        const x = me.rest[i * 2], y = me.rest[i * 2 + 1], w = me.w[i];
        let ox = 0, oy = 0;
        for (let b = 0; b < 8; b++) if (w[b] > 1e-4) { const p = bones[b](x, y); ox += p[0] * w[b]; oy += p[1] * w[b]; }
        me.out[i * 2] = ox; me.out[i * 2 + 1] = oy;
      }
    }
  }

  ensureSize(k) {
    const gl = this.gl, L = LOGICAL;
    const W = Math.max(64, Math.round((L.x1 - L.x0) * k)), H = Math.max(64, Math.round((L.y1 - L.y0) * k));
    if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H; }
    if (this.fw !== W || this.fh !== H) {
      if (this.fbo) { gl.deleteFramebuffer(this.fbo); gl.deleteTexture(this.fboTex); }
      this.fboTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
      this.fw = W; this.fh = H;
    }
    return [W, H];
  }

  drawMesh(verts, uv, idx, tex, M, alpha) {
    const gl = this.gl, p = this.p1;
    gl.useProgram(p);
    const n = verts.length / 2, inter = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { inter[i * 4] = verts[i * 2]; inter[i * 4 + 1] = verts[i * 2 + 1]; inter[i * 4 + 2] = uv[i * 2]; inter[i * 4 + 3] = uv[i * 2 + 1]; }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo); gl.bufferData(gl.ARRAY_BUFFER, inter, gl.STREAM_DRAW);
    const aPos = gl.getAttribLocation(p, 'aPos'), aUv = gl.getAttribLocation(p, 'aUv');
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STREAM_DRAW);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(p, 'uTex'), 0);
    gl.uniformMatrix3fv(gl.getUniformLocation(p, 'uM'), false, M);
    gl.uniform1f(gl.getUniformLocation(p, 'uAlpha'), alpha);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
  }

  quadFor(name) {
    const m = this.meta[name];
    let s = 1, ax = m.ax, ay = m.ay;
    if (name === 'hero') s = SHEET_H / (m.ay - m.top);
    const x0 = -ax * s, y0 = -ay * s, x1 = (m.w - ax) * s, y1 = (m.h - ay) * s;
    return { v: new Float32Array([x0, y0, x1, y0, x0, y1, x1, y1]), uv: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), i: new Uint32Array([0, 1, 2, 1, 3, 2]) };
  }

  // st: {view:'v1'..'v8'|'hero', pose, k (px per sheet px), squash:[sx,sy], lean, rim, flash, fogAmt, blend:{view, a}}
  render(st) {
    const gl = this.gl, L = LOGICAL;
    const [W, H] = this.ensureSize(st.k || 1);
    // logical -> clip: x in [x0,x1] -> [-1,1]; y down in logical -> y up in clip
    const sx = st.squash ? st.squash[0] : 1, sy = st.squash ? st.squash[1] : 1;
    const lean = ((st.lean || 0) * Math.PI) / 180, cs = Math.cos(lean), sn = Math.sin(lean);
    const ax = 2 / (L.x1 - L.x0), ay = -2 / (L.y1 - L.y0);
    const bx = -1 - L.x0 * ax, by = 1 - L.y0 * ay;
    // M = clip * rot(lean) * scale(sx,sy)   (column-major 3x3)
    const a = cs * sx, b = sn * sx, c = -sn * sy, d = cs * sy;
    const M = new Float32Array([ax * a, ay * b, 0, ax * c, ay * d, 0, bx, by, 1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const drawView = (view, alpha) => {
      if (view === 'v1' && st.rig !== false) {
        this.skin(st.pose || {});
        for (const me of this.meshes) this.drawMesh(me.out, me.uv, me.idx, this.tex[me.name], M, alpha);
      } else {
        const q = this.quadFor(view);
        this.drawMesh(q.v, q.uv, q.i, this.tex[view], M, alpha);
      }
    };
    drawView(st.view || 'v1', 1);
    if (st.blend && st.blend.a > 0.001) drawView(st.blend.view, st.blend.a);
    // composite pass with rim light and grading
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    const p = this.p2; gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const loc = gl.getAttribLocation(p, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    const U = (n) => gl.getUniformLocation(p, n);
    gl.uniform1i(U('uTex'), 0);
    const px = Math.max(1.0, (st.k || 1) * 1.2);
    gl.uniform2f(U('uPx'), px / W, px / H);
    const li = st.light || [-0.62, 0.78];
    gl.uniform2f(U('uLight'), li[0], li[1]);
    const rim = st.rim ?? 1;
    gl.uniform3f(U('uRim'), 1.0 * rim, 0.72 * rim, 0.38 * rim);
    gl.uniform3f(U('uRim2'), 0.45 * rim, 0.55 * rim, 1.0 * rim);
    const tint = st.tint || [1.02, 0.99, 0.97];
    gl.uniform3f(U('uTint'), ...tint);
    gl.uniform3f(U('uFog'), 0.62, 0.55, 0.72);
    gl.uniform1f(U('uFogAmt'), st.fogAmt || 0);
    gl.uniform1f(U('uExpo'), st.expo || 1.0);
    gl.uniform1f(U('uFlash'), st.flash || 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
