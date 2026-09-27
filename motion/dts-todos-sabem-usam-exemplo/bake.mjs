// Bakes FLOWS UI replicas into high-res PNG textures (transparent corners).
import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = process.cwd();
const types = { '.htm': 'text/html', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json' };
const srv = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(9602);
const executablePath = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
if (!executablePath) { console.error('Defina CHROME_PATH com o caminho de um Chromium/Chrome.'); process.exit(1); }
const b = await chromium.launch({ executablePath });
const out = path.join(root, 'tex'); fs.mkdirSync(out, { recursive: true });
async function page(scale) {
  const pg = await b.newPage({ viewport: { width: 1600, height: 2400 }, deviceScaleFactor: scale });
  pg.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await pg.goto('http://localhost:9602/bake.htm'); await pg.waitForFunction(() => window.ready === true);
  return pg;
}
async function snap(pg, name, kind, arg) {
  const { w, h } = await pg.evaluate(([k, a]) => window.show(k, a), [kind, arg]);
  await pg.screenshot({ path: path.join(out, name + '.png'), clip: { x: 0, y: 0, width: w, height: h }, omitBackground: true });
  return { w, h };
}
const manifest = {};
// ---- modal state sequence
const NAME = '[DTS] - Change Management - Mapa de Impactos';
const base = { name: '', where: '', whereFilled: false, whereHint: false, dd: 0, ddHi: 0, model: '', modelOk: false, reqPulse: 0, time: '', mode: 0, file: '', stepP: 0, press: 0, focus: '', caret: true, pfx: false };
const S = [];
S.push(['m_empty', { ...base }]);
for (let i = 0; i <= NAME.length; i++) S.push([`m_name_${String(i).padStart(2, '0')}`, { ...base, name: NAME.slice(0, i), focus: 'name' }]);
const afterName = { ...base, name: NAME };
// v5: name anatomy, one segment at a time: [Prefixo da Área] - [Service Line] - [Produto/Entregável]
for (const k of [1, 2, 3]) S.push([`m_name_seg${k}`, { ...afterName, seg: k }]);
S.push(['m_name_segall', { ...afterName, seg: 'all' }]);
S.push(['m_name_done', { ...afterName }]);
['', 'F', 'Fl', 'Flo'].forEach((w, i) => S.push([`m_where_${i}`, { ...afterName, where: w, focus: 'where' }]));
S.push(['m_where_dd', { ...afterName, where: 'Flo', focus: 'where', dd: 1 }]);
S.push(['m_where_ddhi', { ...afterName, where: 'Flo', focus: 'where', dd: 1, ddHi: 1 }]);
const afterWhere = { ...afterName, where: 'Flows / Claude', whereFilled: true };
S.push(['m_where_done', { ...afterWhere }]);
S.push(['m_where_hint', { ...afterWhere, whereHint: true }]);
S.push(['m_model_focus', { ...afterWhere, focus: 'model' }]);
S.push(['m_model_req', { ...afterWhere, focus: 'model', reqPulse: 1 }]);
const afterModel = { ...afterWhere, model: 'Claude Sonnet 5', modelOk: true };
S.push(['m_model_done', { ...afterModel }]);
['', '1', '12', '120'].forEach((w, i) => S.push([`m_time_${i}`, { ...afterModel, time: w, focus: 'time' }]));
const afterTime = { ...afterModel, time: '120' };
S.push(['m_time_done', { ...afterTime }]);
S.push(['m_zip', { ...afterTime, mode: 1 }]);
S.push(['m_zip_file', { ...afterTime, mode: 1, file: 'SKILL.zip' }]);
S.push(['m_next_press', { ...afterTime, mode: 1, file: 'SKILL.zip', press: 1 }]);
// ---- v5: step 2 (Detalhes), from the real FLOWS screen recording
const DESC = 'Entregável: Mapa de Impactos Organizacionais, separando por categoria de impacto, análise organizacional, mapa de riscos, ações de mitigação, heatmap.\nResultado Final/Produto: Arquivo Excel, Apresentação em PPT.';
const DTS_AREA = 'DTS — Performance (DTS)';
const P1 = 'domingues', P2 = 'talita', A1 = 'Domingues, Alexandre', A2 = 'Galvao, Talita';
const D = [];
const d0 = { title: NAME, tpl: 0, area: '', people: [], pq: '', desc: '', caret: true };
D.push(['d_base', { ...d0 }]);
D.push(['d_tpl_hov', { ...d0, tplHover: 1 }]);
const dT = { ...d0, tpl: 1 };
D.push(['d_tpl', { ...dT }]);
for (const k of [0, 1, 2, 3]) D.push([`d_area_hi${k}`, { ...dT, areaOpen: 1, areaHi: k, areaFocus: 1 }]);
const dA = { ...dT, area: DTS_AREA };
D.push(['d_area_act', { ...dA, areaFocus: 1 }]);
D.push(['d_area', { ...dA }]);
for (let i = 0; i <= P1.length; i++) D.push([`d_p1_${i}`, { ...dA, pq: P1.slice(0, i), pfocus: 1 }]);
D.push(['d_p1_sugg', { ...dA, pq: P1, pfocus: 1, sugg: A1 }]);
D.push(['d_p1_hov', { ...dA, pq: P1, pfocus: 1, sugg: A1, suggHov: 1 }]);
for (let i = 0; i <= P2.length; i++) D.push([`d_p2_${i}`, { ...dA, people: [A1], pq: P2.slice(0, i), pfocus: 1 }]);
D.push(['d_p2_sugg', { ...dA, people: [A1], pq: P2, pfocus: 1, sugg: A2 }]);
D.push(['d_p2_hov', { ...dA, people: [A1], pq: P2, pfocus: 1, sugg: A2, suggHov: 1 }]);
const dP = { ...dA, people: [A1, A2] };
D.push(['d_people', { ...dP }]);
// the description is typed word by word (the real field is a textarea)
const words = DESC.split(/(?<=\s)/);
D.push(['d_desc_00', { ...dP, dfocus: 1 }]);
for (let i = 1; i <= words.length; i++) D.push([`d_desc_${String(i).padStart(2, '0')}`, { ...dP, desc: words.slice(0, i).join('').replace(/\s+$/, ''), dfocus: 1 }]);
D.push(['d_desc_hl1', { ...dP, desc: DESC, dfocus: 1, caret: false, dhl: 1 }]);
D.push(['d_desc_hl2', { ...dP, desc: DESC, dfocus: 1, caret: false, dhl: 2 }]);
const dD = { ...dP, desc: DESC };
D.push(['d_done', { ...dD }]);
D.push(['d_press', { ...dD, press: 1 }]);
{
  // 3.2x: the modal fills the frame in the close-ups, so its text must hold at 1080p
  const pg = await page(3.2);
  for (const [name, st] of S) manifest[name] = await snap(pg, name, 'modal', st);
  // field rects (css px) for camera targeting
  manifest._modalRects = await pg.evaluate(() => { const m = window._modal; return m.fieldRects(); });
  await pg.evaluate((st) => window.show('modal', st), { ...afterName, seg: 1 });
  manifest._nameSegs = await pg.evaluate(() => window._modal.segRects());
  // step 2 (Detalhes): full-height images; the film composes header + scrolled body + footer
  for (const [name, st] of D) manifest[name] = await snap(pg, name, 'det', st);
  const lay = async (st) => { await pg.evaluate((a) => window.show('det', a), st); return pg.evaluate(() => window._det.detLayout()); };
  const L0 = await lay(d0), LA = await lay({ ...dT, areaOpen: 1, areaHi: 3, areaFocus: 1 }), LS = await lay({ ...dA, pq: P1, pfocus: 1, sugg: A1 });
  L0.rects.optDTS = LA.rects.optDTS; L0.rects.sugg = LS.rects.sugg; L0.nsteps = D.length; L0.words = words.length;
  manifest._det = L0;
  await pg.close();
}
{
  const pg = await page(4);
  for (let i = 0; i < 8; i++) manifest[`card_${i}`] = await snap(pg, `card_${i}`, 'card', i);
  manifest.card_new = await snap(pg, 'card_new', 'newcard');
  manifest.libhead_441 = await snap(pg, 'libhead_441', 'libhead', '441');
  manifest.libhead_442 = await snap(pg, 'libhead_442', 'libhead', '442');
  manifest.rank = await snap(pg, 'rank', 'rank');
  manifest.sharebtn = await snap(pg, 'sharebtn', 'sharebtn');
  await pg.close();
}
{
  const pg = await page(4);
  manifest.logo = await snap(pg, 'logo', 'logo', 120);
  await pg.close();
}
{
  // v5.1: the FLOWS Ranking screen (Áreas · Todos os tempos). Each data-l element becomes a
  // transparent layer at 2x, cropped to its box (+ room for shadows and glows); the film
  // assembles the screen from these layers, one reveal at a time.
  const RS = 2, PAD = 40;
  const pg = await b.newPage({ viewport: { width: 1680, height: 960 }, deviceScaleFactor: RS });
  pg.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await pg.goto('http://localhost:9602/bake.htm'); await pg.waitForFunction(() => window.ready === true);
  await pg.evaluate(() => window.show('rks', {}));
  const lay = await pg.evaluate((PAD) => {
    const root = document.querySelector('.rks'), O = root.getBoundingClientRect(), W = O.width, H = O.height;
    const painted = (e) => { const cs = getComputedStyle(e); return cs.backgroundImage !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none'; };
    const L = {};
    for (const el of root.querySelectorAll('[data-l]')) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const acc = (r) => { if (r.width <= 0 || r.height <= 0) return; x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); };
      if (painted(el) || !el.children.length) acc(el.getBoundingClientRect());
      for (const d of el.querySelectorAll('*')) { const own = d.closest('[data-l]'); if (own === el) acc(d.getBoundingClientRect()); }
      const p = ['page', 'sb', 'main'].includes(el.dataset.l) ? 0 : PAD;
      const x = Math.max(0, Math.floor(x0 - O.left - p)), y = Math.max(0, Math.floor(y0 - O.top - p));
      L[el.dataset.l] = { x, y, w: Math.min(W, Math.ceil(x1 - O.left + p)) - x, h: Math.min(H, Math.ceil(y1 - O.top + p)) - y };
    }
    const num = {};
    for (const n of root.querySelectorAll('[data-num]')) { const r = n.getBoundingClientRect(); num[n.dataset.num] = { x: r.left - O.left, y: r.top - O.top, w: r.width, h: r.height }; }
    return { W, H, L, num };
  }, PAD);
  for (const [name, r] of Object.entries(lay.L)) {
    await pg.evaluate((l) => window.show('rks', { layer: l }), name);
    await pg.screenshot({ path: path.join(out, `rk_${name}.png`), clip: { x: r.x, y: r.y, width: r.w, height: r.h }, omitBackground: true });
    manifest[`rk_${name}`] = { w: r.w, h: r.h };
  }
  manifest._rks = { ...lay, S: RS };
  await pg.close();
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log('baked', Object.keys(manifest).length);
await b.close(); srv.close();
