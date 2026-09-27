import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { World } from './world.js';
import { buildFilm } from './timeline.js';
import { buildIdent, IDENT } from './ident.js';

const W = 1920, H = 1080;
// ?q=0.5 renders the 3D at half resolution for fast motion previews (HUD stays 1080p)
const Q = +(new URLSearchParams(location.search).get('q') || 1);
const world = new World(document.getElementById('gl'), Math.round(W * Q), Math.round(H * Q));
const cam = world.camera;
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + src)); i.src = src; });

export function project(p) {
  const v = new THREE.Vector3(p[0], p[1], p[2]);
  const d = v.clone().applyMatrix4(cam.matrixWorldInverse);
  v.project(cam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, depth: -d.z, vis: -d.z > 1 };
}

async function boot() {
  await Promise.all(['500 20px Inter', '600 20px Inter', '700 20px Inter', '800 20px Inter', '900 20px Inter', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"', '400 20px "Liberation Sans"', '700 20px "Liberation Sans"'].map((f) => document.fonts.load(f)));
  const manifest = await (await fetch('tex/manifest.json')).json();
  // the ~80 modal states are large (sharp close-ups): they load on demand, a few at a time
  const texNames = Object.keys(manifest).filter((k) => !k.startsWith('_') && !k.startsWith('m_') && !k.startsWith('d_'));
  const imgs = {};
  await Promise.all(texNames.map(async (n) => { imgs[n] = await loadImg(`tex/${n}.png`); }));
  imgs.m_empty = await loadImg('tex/m_empty.png');
  const lru = [];
  const ensure = async (n) => {
    if (!imgs[n]) imgs[n] = await loadImg(`tex/${n}.png`);
    const i = lru.indexOf(n); if (i >= 0) lru.splice(i, 1); lru.push(n);
    while (lru.length > 8) { const old = lru.shift(); if (old !== 'm_empty') delete imgs[old]; }
  };
  // prints of the real FLOWS screens (Início, Catálogo de Métodos, Biblioteca de Skills) for the tour
  for (const n of ['screen_inicio', 'screen_catalogo', 'screen_biblioteca']) imgs[n] = await loadImg(`tex/${n}.webp`);
  const fontJson = await new Promise((res, rej) => new TTFLoader().load('fonts/Nunito-900.ttf', res, undefined, rej));
  const font = new Font(fontJson);
  const tex = (n) => { const t = new THREE.Texture(imgs[n]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = world.maxAniso; t.needsUpdate = true; return t; };
  const ctx = { THREE, world, cam, project, font, imgs, tex, manifest, W, H, hud: document.getElementById('hud') };
  const svgText = await (await fetch('tex/am_mark.svg')).text();
  const ident = buildIdent({ world, svgText, cam });
  const film = buildFilm({ ...ctx, ident, svgText });
  window.DURATION = film.duration; window.__IDENT = IDENT; window.__FILM0 = film.film0;
  window.__world = world; window.__THREE = THREE;
  window.seek = async (t) => {
    const n = film.needs(t);
    if (n && n.tex) for (const k of n.tex) await ensure(k);
    if (n && n.clip !== undefined) await film.loadClip(n.clip); // Fabio's intro clip frame
    const r = film.update(t) || {};
    if (!r.skip3d) world.render();
    return true;
  };
  window.__film = film;
  await window.seek(0);
  window.ready = true;
}
boot().catch((e) => { console.error(e); window.bootError = String((e && e.stack) || e); });
