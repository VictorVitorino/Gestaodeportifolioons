// BokehPass variant: objects with userData.noDepth are hidden while the depth
// buffer is rendered (particles, glows, sky) so they don't smear the blur.
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
export class DOFPass extends BokehPass {
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    const hidden = [];
    this.scene.traverse((o) => { if (o.visible && o.userData.noDepth) { hidden.push(o); o.visible = false; } });
    this.scene.overrideMaterial = this.materialDepth;
    renderer.getClearColor(this._oldClearColor);
    const oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(0xffffff);
    renderer.setClearAlpha(1.0);
    renderer.setRenderTarget(this.renderTargetDepth);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    for (const o of hidden) o.visible = true;
    this.uniforms['tColor'].value = readBuffer.texture;
    this.uniforms['nearClip'].value = this.camera.near;
    this.uniforms['farClip'].value = this.camera.far;
    if (this.renderToScreen) { renderer.setRenderTarget(null); this.fsQuad.render(renderer); }
    else { renderer.setRenderTarget(writeBuffer); renderer.clear(); this.fsQuad.render(renderer); }
    this.scene.overrideMaterial = null;
    renderer.setClearColor(this._oldClearColor);
    renderer.setClearAlpha(oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
}
