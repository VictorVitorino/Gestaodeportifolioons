#!/usr/bin/env node
/* =============================================================================
   shoot.cjs · QA visual e de layout do deck Axon (Playwright + Chromium)

   Uso:
     node shoot.cjs <arquivo.html> <pastaSaida> [--deck A|B|AB] [--reveals] [--mobile]
                    [--print] [--notes] [--only A3,B4] [--wait 1200]

   (a) Abre o HTML via file:// em 1600 × 900, navega pela rota de cada slide,
       espera as animações e salva <saida>/<id>.png do canvas.
   (b) Audita cada slide: elementos fora do canvas 1280 × 720, texto cortado ou
       transbordando da caixa, sobreposição entre blocos irmãos de texto e erros
       de console.
   (c) --reveals: abre cada gatilho [data-reveal] (<id>-rv<n>.png), verifica se o
       popover cabe no canvas e não corta texto; marca os checklists de portão e
       confere o evento gate:open; vira cada .flip (<id>-flip<n>.png) e confere o
       verso; alterna cada .seg (<id>-seg<n>.png).
   (d) --mobile: 390 × 844, confere o modo leitura automático e a ausência de
       rolagem horizontal (mobile-<deck>.png e mobile-<deck>-full.png).
   (e) --print: prepara a impressão "Ambas" (A e depois B), gera print-AB.pdf e
       informa o número de páginas (com --notes, inclui as notas).
   Saída: JSON resumido no stdout; relatório completo em <saida>/report.json.
   ========================================================================== */
'use strict';
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const fs = require('fs');
const path = require('path');

/* ---------- argumentos ---------- */
const argv = process.argv.slice(2);
const opts = { deck: 'AB', reveals: false, mobile: false, print: false, notes: false, only: null, wait: 1200 };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--deck') opts.deck = String(argv[++i] || 'AB').toUpperCase();
  else if (a === '--only') opts.only = String(argv[++i] || '').toUpperCase().split(',').filter(Boolean);
  else if (a === '--wait') opts.wait = Number(argv[++i]) || 1200;
  else if (a === '--reveals') opts.reveals = true;
  else if (a === '--mobile') opts.mobile = true;
  else if (a === '--print') opts.print = true;
  else if (a === '--notes') opts.notes = true;
  else if (a === '--help' || a === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 22).join('\n')); process.exit(0); }
  else pos.push(a);
}
if (!pos[0]) { console.error('uso: node shoot.cjs <arquivo.html> <pastaSaida> [--deck A|B|AB] [--reveals] [--mobile] [--print]'); process.exit(2); }
const HTML = path.resolve(pos[0]);
const OUT = path.resolve(pos[1] || 'qa-out');
if (!fs.existsSync(HTML)) { console.error('arquivo não encontrado: ' + HTML); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const URL = 'file://' + HTML;
const DECKS = opts.deck === 'AB' ? ['A', 'B'] : [opts.deck === 'B' ? 'B' : 'A'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- auditoria executada na página ---------- */
function auditSlide(id) {
  const slide = document.getElementById(id);
  const res = { overflow: [], clipped: [], overlap: [] };
  if (!slide) { res.missing = true; return res; }
  const s = (window.AxonDeck && window.AxonDeck.scale) || 1;
  const sr = slide.getBoundingClientRect();
  const R = (el) => { const r = el.getBoundingClientRect(); return { l: (r.left - sr.left) / s, t: (r.top - sr.top) / s, r: (r.right - sr.left) / s, b: (r.bottom - sr.top) / s }; };
  const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10) / 10]));
  const desc = (el) => {
    let d = el.tagName.toLowerCase();
    if (el.id) d += '#' + el.id;
    const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.') : '';
    if (c) d += '.' + c;
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return t ? d + ' «' + t + '»' : d;
  };
  const inSvg = (el) => el.parentElement && el.parentElement.closest('svg');
  const skip = (el) => el.closest('.notes, .keymsg, template, [data-qa-ignore], .flip-back, .impulse') || inSvg(el) || /^(SCRIPT|STYLE|TEMPLATE|BR)$/.test(el.tagName);
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5;
  };
  const els = Array.from(slide.querySelectorAll('*')).filter((el) => !skip(el) && vis(el));
  const hasText = (el) => (el.textContent || '').trim().length > 0;

  // 1. fora do canvas
  const outSet = new Set();
  for (const el of els) {
    const r = R(el);
    if (r.l < -1 || r.t < -1 || r.r > 1281 || r.b > 721) {
      let p = el.parentElement, dup = false;
      while (p && p !== slide) { if (outSet.has(p)) { dup = true; break; } p = p.parentElement; }
      outSet.add(el);
      if (!dup) res.overflow.push({ el: desc(el), rect: round(r) });
    }
  }
  // 2. texto cortado / transbordando da própria caixa
  const cands = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' || cs.display === 'contents') continue;
    if (el.matches('.flip, .fiber, svg, .slide-clone') || !hasText(el)) continue;
    const dh = el.scrollHeight - el.clientHeight, dw = el.scrollWidth - el.clientWidth;
    if (el.clientHeight === 0 && el.clientWidth === 0) continue;
    if (dh > 1 || dw > 1) {
      const clip = /(hidden|clip|auto|scroll)/.test(cs.overflowX + cs.overflowY);
      cands.push({ el, info: { el: desc(el), kind: clip ? 'cortado' : 'transborda', dh: Math.round(dh / 1), dw: Math.round(dw / 1) } });
    }
  }
  for (const c of cands) {
    if (!cands.some((o) => o !== c && c.el.contains(o.el))) res.clipped.push(c.info);
  }
  // 3. sobreposição entre irmãos com texto
  const parents = new Set(els.map((e) => e.parentElement).filter(Boolean));
  parents.add(slide);
  for (const p of parents) {
    const kids = Array.from(p.children).filter((k) => els.includes(k) && hasText(k) &&
      !k.matches('.flip-front, .flip-back, [data-when], .impulse, .node, [data-qa-overlap]') &&
      !/^(inline|contents)$/.test(getComputedStyle(k).display));
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = R(kids[i]), b = R(kids[j]);
        const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (w > 1.5 && h > 1.5) res.overlap.push({ a: desc(kids[i]), b: desc(kids[j]), area: Math.round(w * h) });
      }
    }
  }
  return res;
}

/* menor fonte (px) entre elementos do anexo que têm texto próprio; devolve { px, el } */
const MIN_FONT = () => {
  window.__minFont = (root) => {
    let min = 99, who = '';
    root.querySelectorAll('.annex *').forEach((e) => {
      if (!Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const px = parseFloat(cs.fontSize);
      if (px < min) { min = px; who = e.tagName.toLowerCase() + '.' + String(e.className).trim().split(/\s+/).join('.') + ' «' + e.textContent.trim().slice(0, 30) + '»'; }
    });
    return { px: min, el: who };
  };
};

function popState() {
  const p = document.getElementById('rvpop');
  if (!p || p.hidden) return { open: false };
  const c = document.getElementById('canvas').getBoundingClientRect();
  const s = window.AxonDeck.scale;
  const r = p.getBoundingClientRect();
  const b = p.querySelector('.rvpop-body');
  const t = p.querySelector('.rvpop-title');
  const tl = (r.left - c.left) / s, tt = (r.top - c.top) / s;
  return {
    open: true, title: t.textContent,
    rect: { x: Math.round(tl), y: Math.round(tt), w: Math.round(r.width / s), h: Math.round(r.height / s) },
    inside: r.left >= c.left - 1 && r.top >= c.top - 1 && r.right <= c.right + 1 && r.bottom <= c.bottom + 1,
    scrolls: b.scrollHeight > b.clientHeight + 1,
    hClip: b.scrollWidth > b.clientWidth + 1,
    titleClip: t.scrollWidth > t.clientWidth + 1,
    empty: !b.textContent.trim(),
    gates: b.querySelectorAll('.gate input[type="checkbox"]').length
  };
}

/* ---------- execução ---------- */
(async () => {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await pw.chromium.launch(proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {});
  const report = { file: HTML, out: OUT, options: opts, slides: {}, console: [], pageErrors: [], warnings: [], network: [], mobile: null, print: null };
  let cur = 'boot';
  const watch = (page, tag) => {
    page.on('console', (m) => {
      const t = m.type();
      if (t === 'error') report.console.push({ where: tag + ':' + cur, text: m.text() });
      else if (t === 'warning') report.warnings.push({ where: tag + ':' + cur, text: m.text() });
    });
    page.on('pageerror', (e) => report.pageErrors.push({ where: tag + ':' + cur, text: String(e && e.message || e) }));
    page.on('requestfailed', (r) => report.network.push({ where: tag, url: r.url(), err: r.failure() && r.failure().errorText }));
  };

  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  watch(page, 'desktop');
  await page.goto(URL + '#' + DECKS[0] + '-1', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* */ } });
  await sleep(500);
  report.fontsLoaded = await page.evaluate(() => (document.fonts ? Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family) : []));
  report.engine = await page.evaluate(() => !!(window.AxonDeck && window.AxonDeck.current().el));

  for (const d of DECKS) {
    for (let i = 1; i <= 6; i++) {
      const id = d + i;
      if (opts.only && !opts.only.includes(id)) continue;
      cur = id;
      const before = report.console.length + report.pageErrors.length;
      await page.evaluate((h) => { location.hash = h; }, '#' + d + '-' + i);
      await sleep(opts.wait);
      const active = await page.evaluate(() => window.AxonDeck.current().id);
      await page.locator('#canvas').screenshot({ path: path.join(OUT, id + '.png') });
      const a = await page.evaluate(auditSlide, id);
      const entry = { active: active === id, overflow: a.overflow, clipped: a.clipped, overlap: a.overlap, reveals: [], flips: [], segs: [] };

      if (opts.reveals) {
        await page.evaluate((sid) => {
          window.__gates = [];
          const sl = document.getElementById(sid);
          if (!sl.__qa) { sl.addEventListener('gate:open', (e) => window.__gates.push(e.detail.gate)); sl.__qa = true; }
        }, id);
        const n = await page.evaluate((sid) => document.getElementById(sid).querySelectorAll('[data-reveal]').length, id);
        let shot = 0;
        for (let k = 0; k < n; k++) {
          const info = await page.evaluate(([sid, k]) => {
            const t = document.getElementById(sid).querySelectorAll('[data-reveal]')[k];
            const r = t.getBoundingClientRect();
            const cs = getComputedStyle(t);
            return { visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !t.closest('[data-when]:not(.is-on)'),
              spec: t.getAttribute('data-reveal'), pick: t.getAttribute('data-pick') || '',
              label: (t.getAttribute('data-label') || t.getAttribute('aria-label') || t.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) };
          }, [id, k]);
          if (!info.visible) { entry.reveals.push(Object.assign(info, { skipped: 'invisível' })); continue; }
          const h = (await page.$$('#' + id + ' [data-reveal]'))[k];
          let covered = false;
          try { await h.click({ timeout: 1500 }); } catch (e) {
            covered = true;
            await page.evaluate(([sid, k]) => document.getElementById(sid).querySelectorAll('[data-reveal]')[k].click(), [id, k]);
          }
          await sleep(320);
          const st = await page.evaluate(popState);
          shot++;
          await page.locator('#canvas').screenshot({ path: path.join(OUT, id + '-rv' + shot + '.png') });
          const item = Object.assign(info, { n: shot, covered, popover: st });
          const prob = [];
          if (!st.open) prob.push('não abriu');
          else {
            if (!st.inside) prob.push('popover fora do canvas');
            if (st.hClip) prob.push('texto cortado na horizontal');
            if (st.titleClip) prob.push('título cortado');
            if (st.empty) prob.push('popover vazio');
            if (st.rect.w < 319 || st.rect.w > 421) prob.push('largura fora de 320–420 px');
            if (st.rect.h > 521) prob.push('altura acima de 520 px');
          }
          if (covered) prob.push('gatilho coberto por outro elemento (clique real falhou)');
          if (st.open && st.gates) {
            await page.evaluate(() => document.querySelectorAll('#rvpop .gate input[type="checkbox"]').forEach((c) => { if (!c.checked) c.click(); }));
            await sleep(450);
            const g = await page.evaluate(() => window.__gates.slice());
            item.gateOpened = g.length > 0;
            if (!item.gateOpened) prob.push('portão não disparou gate:open');
            await page.locator('#canvas').screenshot({ path: path.join(OUT, id + '-rv' + shot + '-gate.png') });
            await page.evaluate(() => { window.__gates = []; });
            await sleep(700);
          }
          item.problems = prob;
          entry.reveals.push(item);
          await page.keyboard.press('Escape');
          await sleep(120);
          const still = await page.evaluate(() => !document.getElementById('rvpop').hidden);
          if (still) { item.problems.push('Esc não fechou'); await page.evaluate(() => window.AxonDeck.reveal.close()); }
        }
        // cartas flip
        const nf = await page.evaluate((sid) => document.getElementById(sid).querySelectorAll('.flip').length, id);
        for (let k = 0; k < nf; k++) {
          await page.evaluate(([sid, k]) => document.getElementById(sid).querySelectorAll('.flip')[k].click(), [id, k]);
          await sleep(650);
          await page.locator('#canvas').screenshot({ path: path.join(OUT, id + '-flip' + (k + 1) + '.png') });
          const f = await page.evaluate(([sid, k]) => {
            const fl = document.getElementById(sid).querySelectorAll('.flip')[k];
            const b = fl.querySelector('.flip-back'), fr = fl.querySelector('.flip-front');
            const ov = (x) => x ? { dh: x.scrollHeight - x.clientHeight, dw: x.scrollWidth - x.clientWidth } : null;
            return { flipped: fl.classList.contains('is-flipped'), pressed: fl.getAttribute('aria-pressed'), back: ov(b), front: ov(fr),
              label: (fl.getAttribute('data-label') || (fr ? fr.textContent : '')).replace(/\s+/g, ' ').trim().slice(0, 60) };
          }, [id, k]);
          f.problems = [];
          if (!f.flipped || f.pressed !== 'true') f.problems.push('não virou');
          if (f.back && (f.back.dh > 1 || f.back.dw > 1)) f.problems.push('verso cortado (' + f.back.dh + ' px)');
          if (f.front && (f.front.dh > 1 || f.front.dw > 1)) f.problems.push('frente cortada (' + f.front.dh + ' px)');
          entry.flips.push(f);
          await page.evaluate(([sid, k]) => document.getElementById(sid).querySelectorAll('.flip')[k].click(), [id, k]);
          await sleep(560);
        }
        // alternadores
        const ns = await page.evaluate((sid) => Array.from(document.getElementById(sid).querySelectorAll('.seg')).map((s) => s.querySelectorAll('button[data-value]').length), id);
        for (let k = 0; k < ns.length; k++) {
          for (let b = 1; b < ns[k]; b++) {
            await page.evaluate(([sid, k, b]) => document.getElementById(sid).querySelectorAll('.seg')[k].querySelectorAll('button[data-value]')[b].click(), [id, k, b]);
            await sleep(400);
            const tag = id + '-seg' + (k + 1) + (ns[k] > 2 ? '-' + (b + 1) : '');
            await page.locator('#canvas').screenshot({ path: path.join(OUT, tag + '.png') });
            const a2 = await page.evaluate(auditSlide, id);
            entry.segs.push({ seg: k + 1, option: b + 1, clipped: a2.clipped, overlap: a2.overlap, overflow: a2.overflow });
          }
          await page.evaluate(([sid, k]) => document.getElementById(sid).querySelectorAll('.seg')[k].querySelector('button[data-value]').click(), [id, k]);
          await sleep(200);
        }
      }
      entry.consoleErrors = report.console.length + report.pageErrors.length - before;
      report.slides[id] = entry;
    }
  }

  /* ---------- celular ---------- */
  if (opts.mobile) {
    report.mobile = {};
    for (const d of DECKS) {
      const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      const mp = await mctx.newPage();
      cur = 'mobile-' + d;
      watch(mp, 'mobile');
      await mp.goto(URL + '#' + d + '-1', { waitUntil: 'load' });
      await mp.evaluate(() => document.fonts && document.fonts.ready);
      await sleep(1200);
      await mp.evaluate(MIN_FONT);
      const m = await mp.evaluate(() => {
        const rd = document.getElementById('reading');
        return {
          reading: document.body.classList.contains('is-reading') && !rd.hidden,
          pageHScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
          readingHScroll: rd.scrollWidth > rd.clientWidth + 1,
          slides: rd.querySelectorAll('.rd-slide').length,
          annexes: rd.querySelectorAll('.annex').length,
          minAnnexFont: window.__minFont(rd)
        };
      });
      await mp.screenshot({ path: path.join(OUT, 'mobile-' + d + '.png') });
      await mp.addStyleTag({ content: 'html,body{overflow:visible!important;height:auto!important}#reading{position:static!important;overflow:visible!important}.topbar{position:static!important}' });
      await sleep(300);
      await mp.screenshot({ path: path.join(OUT, 'mobile-' + d + '-full.png'), fullPage: true });
      m.problems = [];
      if (!m.reading) m.problems.push('não entrou no modo leitura');
      if (m.pageHScroll || m.readingHScroll) m.problems.push('rolagem horizontal');
      if (m.minAnnexFont.px < 15) m.problems.push('fonte do anexo abaixo de 15 px: ' + m.minAnnexFont.px + ' em ' + m.minAnnexFont.el);
      report.mobile[d] = m;
      await mctx.close();
    }
  }

  /* ---------- impressão ---------- */
  if (opts.print) {
    cur = 'print';
    const expected = await page.evaluate((n) => window.AxonDeck.preparePrint({ decks: 'AB', notes: n }), opts.notes);
    await sleep(300);
    // o PDF vem antes dos screenshots: capturar elementos sob emulação de impressão
    // antes de page.pdf faz o Chromium gerar uma página só
    const pdfPath = path.join(OUT, 'print-AB.pdf');
    await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
    const buf = fs.readFileSync(pdfPath).toString('latin1');
    const pages = (buf.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
    const rasters = [];
    try {
      const { execFileSync } = require('child_process');
      execFileSync('pdftoppm', ['-png', '-r', '48', '-f', '1', '-l', '6', pdfPath, path.join(OUT, 'pdf-p')], { stdio: 'ignore' });
      fs.readdirSync(OUT).filter((f) => /^pdf-p-\d+\.png$/.test(f)).sort().forEach((f) => rasters.push(f));
    } catch (e) { /* pdftoppm indisponível: sem rasterização */ }
    // page.pdf dispara afterprint (o motor limpa a raiz); prepara de novo para os screenshots
    await page.evaluate((n) => window.AxonDeck.preparePrint({ decks: 'AB', notes: n }), opts.notes);
    await page.emulateMedia({ media: 'print' });
    await sleep(400);
    const shots = [];
    for (const [sel, name] of [['.pp-slide', 'print-slide'], ['.pp-annex', 'print-annex']]) {
      const cnt = await page.locator('#print-root ' + sel).count();
      for (const k of [0, Math.min(5, cnt - 1)]) {
        if (k < 0 || k >= cnt) continue;
        const f = name + (k + 1) + '.png';
        if (shots.includes(f)) continue;
        await page.locator('#print-root ' + sel).nth(k).screenshot({ path: path.join(OUT, f) });
        shots.push(f);
      }
    }
    await page.evaluate(MIN_FONT);
    const minFont = await page.evaluate(() => window.__minFont(document.getElementById('print-root')));
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.AxonDeck.endPrint());
    report.print = { pdf: pdfPath, pages, pagesPrepared: expected, notes: opts.notes, minAnnexFont: minFont, shots, rasters, problems: [] };
    if (pages < expected) report.print.problems.push('PDF com menos páginas que o preparado');
    if (minFont.px < 15) report.print.problems.push('fonte do anexo abaixo de 15 px: ' + minFont.px + ' em ' + minFont.el);
  }

  await browser.close();

  /* ---------- resumo ---------- */
  const totals = { overflow: 0, clipped: 0, overlap: 0, consoleErrors: report.console.length + report.pageErrors.length, revealProblems: 0, flipProblems: 0, segProblems: 0 };
  const per = {};
  for (const [id, e] of Object.entries(report.slides)) {
    const rp = e.reveals.filter((r) => r.problems && r.problems.length).length;
    const fp = e.flips.filter((f) => f.problems.length).length;
    const sp = e.segs.filter((s) => s.clipped.length || s.overlap.length || s.overflow.length).length;
    totals.overflow += e.overflow.length; totals.clipped += e.clipped.length; totals.overlap += e.overlap.length;
    totals.revealProblems += rp; totals.flipProblems += fp; totals.segProblems += sp;
    per[id] = {
      overflow: e.overflow.length, clipped: e.clipped.length, overlap: e.overlap.length, console: e.consoleErrors,
      problems: e.overflow.length + e.clipped.length + e.overlap.length + e.consoleErrors + rp + fp + sp
    };
    if (opts.reveals) {
      per[id].reveals = (e.reveals.length - rp) + '/' + e.reveals.length + ' ok';
      per[id].flips = (e.flips.length - fp) + '/' + e.flips.length + ' ok';
      if (e.segs.length) per[id].segs = (e.segs.length - sp) + '/' + e.segs.length + ' ok';
    }
    if (!e.active) per[id].problems++, per[id].inactive = true;
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const summary = {
    file: HTML, out: OUT, fontsLoaded: report.fontsLoaded.length > 0, engine: report.engine,
    totals, slides: per,
    consoleErrors: report.console.concat(report.pageErrors).slice(0, 10),
    warnings: report.warnings.length,
    networkFailures: report.network.length,
    mobile: report.mobile, print: report.print, report: path.join(OUT, 'report.json')
  };
  console.log(JSON.stringify(summary, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
