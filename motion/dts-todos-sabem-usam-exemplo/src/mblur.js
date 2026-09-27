// Camera motion blur (180° shutter): reprojects each pixel with the camera pose
// half a frame earlier using the DOF pass's packed depth, then averages along
// that screen-space velocity. Objects flagged userData.mbHold (things the camera
// rides with, e.g. the flying skill card) are masked out so they stay crisp.
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const Shader = {
  uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, tMask: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uPrevVP: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1920, 1080) }, uAmt: { value: 1 }, uMaxPx: { value: 30 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `#include <packing>
    uniform sampler2D tDiffuse, tDepth, tMask; uniform mat4 uInvProj, uCamWorld, uPrevVP; uniform vec2 uRes; uniform float uAmt, uMaxPx; varying vec2 vUv;
    void main(){
      float d = unpackRGBAToDepth(texture2D(tDepth, vUv));
      vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); v /= v.w;
      vec4 pr = uPrevVP * (uCamWorld * v); pr /= pr.w;
      vec2 vel = (vUv - (pr.xy * 0.5 + 0.5)) * uAmt * (1.0 - texture2D(tMask, vUv).r);
      float px = length(vel * uRes); if (px > uMaxPx) vel *= uMaxPx / px;
      vec4 c = texture2D(tDiffuse, vUv);
      if (px < 0.5) { gl_FragColor = c; return; }
      vec4 acc = vec4(0.0);
      for (int i = 0; i < 12; i++) { float f = float(i) / 11.0 - 0.5; acc += texture2D(tDiffuse, vUv - vel * f); }
      gl_FragColor = acc / 12.0;
    }`,
};

export class MotionBlurPass extends Pass {
  constructor(scene, camera, dof, W, H) {
    super();
    this.scene = scene; this.camera = camera; this.dof = dof;
    this.mat = new THREE.ShaderMaterial({ ...Shader, uniforms: THREE.UniformsUtils.clone(Shader.uniforms) });
    this.mat.uniforms.uRes.value.set(W, H);
    this.quad = new FullScreenQuad(this.mat);
    this.maskRT = new THREE.WebGLRenderTarget(Math.round(W / 2), Math.round(H / 2));
    this.maskMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.prevVP = new THREE.Matrix4(); this.amount = 1;
  }
  setPrev(cam) { this.prevVP.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); }
  render(renderer, writeBuffer, readBuffer) {
    const u = this.mat.uniforms;
    // mask: only objects the camera travels with
    const keep = []; let any = false;
    this.scene.traverse((o) => { if (o.userData.mbHold && o.visible) any = true; });
    renderer.setRenderTarget(this.maskRT); renderer.setClearColor(0x000000, 1); renderer.clear();
    if (any) {
      this.scene.traverse((o) => { if ((o.isMesh || o.isPoints || o.isSprite || o.isLine) && o.visible) { let h = false; for (let p = o; p; p = p.parent) if (p.userData.mbHold) { h = true; break; } if (!h) { keep.push(o); o.visible = false; } } });
      const bg = this.scene.background; this.scene.background = null;
      this.scene.overrideMaterial = this.maskMat; renderer.render(this.scene, this.camera); this.scene.overrideMaterial = null;
      this.scene.background = bg; for (const o of keep) o.visible = true;
    }
    u.tDiffuse.value = readBuffer.texture; u.tDepth.value = this.dof.renderTargetDepth.texture; u.tMask.value = this.maskRT.texture;
    u.uInvProj.value.copy(this.camera.projectionMatrixInverse); u.uCamWorld.value.copy(this.camera.matrixWorld); u.uPrevVP.value.copy(this.prevVP); u.uAmt.value = this.amount;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
}
