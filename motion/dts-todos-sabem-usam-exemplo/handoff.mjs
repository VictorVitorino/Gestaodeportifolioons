// Hand-off matcher: renders the last intro-clip frame and the first film frames for a candidate
// camera pose (window.__handoff), so the cut can be compared side by side.
//   node handoff.mjs '{"pre":[[..],[..]],"at":[[..],[..]],"fov":27}' out/ho  t1,t2,...
import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.svg': 'image/svg+xml', '.htm': 'text/html', '.webp': 'image/webp', '.ttf': 'font/ttf', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(9700 + Math.floor(Math.random() * 200));
const port = srv.address().port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
pg.on('pageerror', (e) => console.log('[pageerror]', e.message));
const ho = process.argv[2] && process.argv[2] !== '-' ? JSON.parse(process.argv[2]) : null;
if (ho) await pg.addInitScript((h) => { window.__handoff = h; }, ho);
await pg.goto(`http://localhost:${port}/film.htm${process.env.Q ? '?q=' + process.env.Q : ''}`);
await pg.waitForFunction(() => window.ready === true || window.bootError, null, { timeout: 120000 });
const out = process.argv[3]; fs.mkdirSync(out, { recursive: true });
const F0 = await pg.evaluate(() => window.__FILM0);
const times = (process.argv[4] || '-0.0417,0,0.25,0.6,1.0,1.7').split(',').map(Number);
const client = await pg.context().newCDPSession(pg);
for (const dt of times) {
  const t = F0 + dt;
  await pg.evaluate((t) => window.seek(t), t);
  await pg.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const { data } = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  fs.writeFileSync(path.join(out, `h_${(dt >= 0 ? '+' : '') + dt.toFixed(3)}.jpg`), Buffer.from(data, 'base64'));
}
console.log('FILM0', F0);
await b.close(); srv.close();
