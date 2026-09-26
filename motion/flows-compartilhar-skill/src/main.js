import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { Env } from './env.js';
import { Character, LOGICAL, SHEET_H } from './character.js';
import { FX } from './fx2d.js';
import { buildTimeline } from './timeline.js';

const VW = 1920, VH = 804;
const viewport = document.getElementById('viewport');
const env = new Env(document.getElementById('gl'), VW, VH);
const cam = env.camera;
const css = new CSS3DRenderer();
css.setSize(VW, VH);
css.domElement.id = 'css3d';
viewport.insertBefore(css.domElement, document.getElementById('fx'));
const scene3 = new THREE.Scene();

const meas = document.createElement('div');
meas.style.cssText = 'position:absolute;left:-20000px;top:0;';
document.body.appendChild(meas);

const tmpV = new THREE.Vector3();
export function project(p) {
  tmpV.set(p[0], p[1], p[2]);
  const d = tmpV.clone().applyMatrix4(cam.matrixWorldInverse);
  tmpV.project(cam);
  const depth = -d.z;
  const f = VH / 2 / Math.tan((cam.fov * Math.PI) / 360);
  return { x: (tmpV.x * 0.5 + 0.5) * VW, y: (-tmpV.y * 0.5 + 0.5) * VH, depth, vis: depth > 1, s: depth > 1 ? f / depth : 0, f };
}

const DEG = Math.PI / 180;
export function actor(el, { zoom = 1, order = 'YXZ' } = {}) {
  meas.appendChild(el);
  const w = el.offsetWidth, h = el.offsetHeight;
  const outer = document.createElement('div'); outer.className = 'obj';
  const z = document.createElement('div'); z.className = 'z'; z.style.zoom = zoom;
  z.appendChild(el); outer.appendChild(z);
  const o = new CSS3DObject(outer); o.rotation.order = order; o.visible = false;
  scene3.add(o);
  return { o, el, outer, w, h, zoom, lastF: '', lastO: '' };
}

// Place an actor: p world position (cm), r rotation (deg), w world width, op opacity, dof screen blur px
export function place(a, { p = [0, 0, 0], r = [0, 0, 0], w = 100, op = 1, dof = 0, aa = true, s = 1 } = {}) {
  const vis = op > 0.004;
  a.o.visible = vis;
  if (!vis) return;
  a.o.position.set(p[0], p[1], p[2]);
  a.o.rotation.set(r[0] * DEG, r[1] * DEG, r[2] * DEG);
  const sc = (w / (a.w * a.zoom)) * s;
  a.o.scale.set(sc, sc, sc);
  const opS = op >= 0.999 ? '' : op.toFixed(3);
  if (opS !== a.lastO) { a.outer.style.opacity = opS; a.lastO = opS; }
  const pr = project(p);
  let blur = 0;
  if (pr.vis) {
    const ratio = (w * s * pr.s) / (a.w * a.zoom); // screen px per css px
    const aaB = aa && ratio < 0.75 ? 0.42 / ratio - 0.4 : 0;
    const dofB = dof > 0 ? dof / Math.max(ratio, 0.05) : 0;
    blur = Math.sqrt(aaB * aaB + dofB * dofB);
  }
  const f = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : '';
  if (f !== a.lastF) { a.outer.style.filter = f; a.lastF = f; }
}

async function boot() {
  const fams = ['400 20px Inter', '500 20px Inter', '600 20px Inter', '700 20px Inter', '800 20px Inter', '900 20px Inter', 'italic 600 20px Fraunces', '500 20px "JetBrains Mono"'];
  await Promise.all(fams.map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  const character = new Character();
  await character.init('assets/char/');
  const fx = new FX(document.getElementById('fx'), project);
  const ctx = { THREE, env, cam, css, scene3, actor, place, project, character, fx, VW, VH, LOGICAL, SHEET_H, CSS3DObject, ov: document.getElementById('ov'), grade: document.getElementById('grade'), hudTop: document.getElementById('hud-top'), hudBot: document.getElementById('hud-bot') };
  const tl = buildTimeline(ctx);
  window.DURATION = tl.duration;
  window.seek = (t) => {
    tl.update(t);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    env.render();
    css.render(scene3, cam);
    return true;
  };
  window.seek(0);
  window.ready = true;
}
boot().catch((e) => { console.error(e); window.bootError = String(e && e.stack || e); });
