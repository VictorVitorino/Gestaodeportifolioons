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
S.push(['m_name_pfx', { ...afterName, focus: 'name', pfx: true }]);
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
S.push(['m_step2', { ...afterTime, mode: 1, file: 'SKILL.zip', stepP: 1 }]);
{
  const pg = await page(2.2);
  for (const [name, st] of S) manifest[name] = await snap(pg, name, 'modal', st);
  // field rects (css px) for camera targeting
  manifest._modalRects = await pg.evaluate(() => { const m = window._modal; return m.fieldRects(); });
  await pg.close();
}
{
  const pg = await page(2);
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
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log('baked', Object.keys(manifest).length);
await b.close(); srv.close();
