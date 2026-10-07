#!/usr/bin/env node
/* =============================================================================
   build.mjs · Junta a fonte modular num único HTML autocontido.
   Uso:  node build.mjs [saida.html]
   Padrão de saída: ../axon-propostas.html (pasta propostas/axon)
   Ordem: CSS = base + slides-A + slides-B · JS = reveals-lib + engine + slides-A + slides-B
   Cada arquivo JS é isolado numa IIFE com try/catch (um erro de autor não derruba o motor).
   ========================================================================== */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = resolve(SRC, '..', 'axon-propostas.html');
const out = resolve(process.argv[2] || DEFAULT_OUT);

const warnings = [];
const errors = [];
const warn = (m) => warnings.push(m);

const read = (f, required = true) => {
  const p = resolve(SRC, f);
  if (!existsSync(p)) {
    if (required) errors.push(`arquivo ausente: ${f}`);
    else warn(`arquivo opcional ausente: ${f} (usado vazio)`);
    return '';
  }
  return readFileSync(p, 'utf8');
};

const shell = read('shell.html');
const files = {
  css: ['base.css', 'slides-A.css', 'slides-B.css'],
  js: ['reveals-lib.js', 'engine.js', 'slides-A.js', 'slides-B.js'],
  html: { A: 'slides-A.html', B: 'slides-B.html' }
};
const required = new Set(['base.css', 'reveals-lib.js', 'engine.js', 'slides-A.html', 'slides-B.html']);

for (const m of ['<!--CSS-->', '<!--SLIDES_A-->', '<!--SLIDES_B-->', '<!--JS-->']) {
  if (!shell.includes(m)) errors.push(`marcador ausente no shell.html: ${m}`);
}

const css = files.css.map((f) => `/* ===== ${f} ===== */\n${read(f, required.has(f))}`).join('\n')
  .replace(/<\/style/gi, '<\\/style');

const wrapJs = (name, src) => `/* ===== ${name} ===== */\n;(function () {\ntry {\n${src}\n} catch (err) { console.error('[build] erro ao carregar ${name}:', err); }\n})();\n`;
const js = (files.js.map((f) => wrapJs(f, read(f, required.has(f)))).join('\n') +
  '\n;(function () { if (window.AxonDeck) window.AxonDeck.boot(); })();\n')
  .replace(/<\/script/gi, '<\\/script')
  .replace(/<!--/g, '<\\!--');

const slides = { A: read(files.html.A), B: read(files.html.B) };

/* ---------- validação do contrato de marcação ---------- */
const libSrc = read('reveals-lib.js');
const libKeys = new Set([...libSrc.matchAll(/^\s*'(R-\d{2})':\s*{/gm)].map((m) => m[1]));
const allIds = new Map();
const attr = (tag, name) => { const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag); return m ? m[1] : null; };

for (const deck of ['A', 'B']) {
  const html = slides[deck];
  const file = files.html[deck];
  const sections = [...html.matchAll(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>/g)].map((m) => m[0]);
  if (sections.length !== 6) warn(`${file}: ${sections.length} seções .slide (esperado: 6)`);
  sections.forEach((tag, i) => {
    const id = attr(tag, 'id');
    const want = `${deck}${i + 1}`;
    if (id !== want) warn(`${file}: seção ${i + 1} com id="${id}" (esperado "${want}")`);
    if (attr(tag, 'data-deck') !== deck) warn(`${file}: ${id} sem data-deck="${deck}"`);
    if (attr(tag, 'data-index') !== String(i + 1)) warn(`${file}: ${id} sem data-index="${i + 1}"`);
    if (!attr(tag, 'data-title')) warn(`${file}: ${id} sem data-title`);
    if (deck === 'B' && !attr(tag, 'data-emphasis')) warn(`${file}: ${id} sem data-emphasis (GMO, PMO, GMO + PMO, PMO + GMO)`);
  });
  const notes = (html.match(/<aside\b[^>]*class="[^"]*\bnotes\b/g) || []).length;
  const keys = (html.match(/class="[^"]*\bkeymsg\b/g) || []).length;
  if (notes < sections.length) warn(`${file}: ${notes} <aside class="notes"> para ${sections.length} slides`);
  if (keys < sections.length) warn(`${file}: ${keys} <p class="keymsg"> para ${sections.length} slides`);

  for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
    const id = m[1];
    if (allIds.has(id)) warn(`id duplicado "${id}" (${allIds.get(id)} e ${file})`);
    else allIds.set(id, file);
  }
  const templates = new Set([...html.matchAll(/<template\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/data-(reveal|include)="([^"]+)"/g)) {
    const v = m[2].trim();
    if (v.startsWith('#')) { if (!templates.has(v.slice(1))) warn(`${file}: data-${m[1]}="${v}" sem <template id="${v.slice(1)}">`); }
    else if (!libKeys.has(v)) warn(`${file}: data-${m[1]}="${v}" não existe na biblioteca (R-01 … R-19)`);
  }
  // escopo do CSS do deck
  const dcss = read(`slides-${deck}.css`, false).replace(/\/\*[\s\S]*?\*\//g, '');
  const unscoped = [];
  const stack = [];
  let last = 0;
  for (let i = 0; i < dcss.length; i++) {
    const ch = dcss[i];
    if (ch === '{') {
      const prelude = dcss.slice(last, i).trim();
      const inKf = stack.includes('kf');
      if (prelude.startsWith('@')) stack.push(/^@(-webkit-)?keyframes/.test(prelude) ? 'kf' : 'at');
      else {
        stack.push('rule');
        if (!inKf) {
          for (const s of prelude.split(',').map((x) => x.trim()).filter(Boolean)) {
            if (!new RegExp(`^#${deck}[1-6]\\b`).test(s)) unscoped.push(s);
          }
        }
      }
      last = i + 1;
    } else if (ch === '}') { stack.pop(); last = i + 1; }
    else if (ch === ';' && !stack.includes('rule')) last = i + 1;
  }
  if (unscoped.length) warn(`slides-${deck}.css: ${unscoped.length} seletor(es) fora do escopo #${deck}1…#${deck}6, ex.: ${unscoped.slice(0, 4).join(' | ')}`);
}

if (errors.length) {
  console.error('[build] ERROS:\n  - ' + errors.join('\n  - '));
  process.exit(1);
}

const page = shell
  .split('<!--CSS-->').join(css)
  .split('<!--SLIDES_A-->').join(slides.A)
  .split('<!--SLIDES_B-->').join(slides.B)
  .split('<!--JS-->').join(js);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page, 'utf8');

const kb = (Buffer.byteLength(page, 'utf8') / 1024).toFixed(1);
console.log(`[build] ok → ${relative(process.cwd(), out) || out} (${kb} KB)`);
if (warnings.length) console.log('[build] avisos:\n  - ' + warnings.join('\n  - '));
