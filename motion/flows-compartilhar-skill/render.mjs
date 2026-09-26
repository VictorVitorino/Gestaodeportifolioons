// Frame renderer: drives window.seek(t) in headless Chromium and captures frames.
//   node render.mjs preview 0.5,3,7.5 out/preview      -> PNG stills
//   node render.mjs frames <fps> <worker> <nworkers> out/frames [t0] [t1]
import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.htm': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const mode = process.argv[2];
const port = 9000 + Math.floor(Math.random() * 900);
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(port);
// Chromium/Chrome binary: CHROME_PATH, or the Playwright Chromium pre-installed in Claude Code cloud sessions.
const executablePath = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
if (!executablePath) { console.error('Defina CHROME_PATH com o caminho de um Chromium/Chrome.'); process.exit(1); }
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.type(), m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
// film.htm (not .html) keeps the host app's Vite dependency scanner away from this page
await page.goto(`http://localhost:${port}/film.htm`);
await page.waitForFunction(() => window.ready === true || window.bootError, null, { timeout: 120000 });
const err = await page.evaluate(() => window.bootError);
if (err) { console.log('BOOT ERROR', err); process.exit(1); }
const client = await page.context().newCDPSession(page);
async function shot(t, file, fmt = 'jpeg') {
  await page.evaluate((t) => window.seek(t), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const { data } = await client.send('Page.captureScreenshot', fmt === 'png' ? { format: 'png', optimizeForSpeed: true } : { format: 'jpeg', quality: 95, optimizeForSpeed: true });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}
if (mode === 'preview') {
  const times = process.argv[3].split(',').map(Number);
  const out = process.argv[4]; fs.mkdirSync(out, { recursive: true });
  for (const t of times) { const t0 = Date.now(); await shot(t, path.join(out, `t_${t.toFixed(2).padStart(6, '0')}.png`), 'png'); console.log('shot', t, Date.now() - t0, 'ms'); }
} else if (mode === 'frames') {
  const fps = +process.argv[3], wi = +process.argv[4], wn = +process.argv[5], out = process.argv[6];
  const dur = await page.evaluate(() => window.DURATION);
  const t0 = process.argv[7] ? +process.argv[7] : 0, t1 = process.argv[8] ? +process.argv[8] : dur;
  fs.mkdirSync(out, { recursive: true });
  const n0 = Math.round(t0 * fps), n1 = Math.round(t1 * fps);
  let done = 0; const start = Date.now();
  for (let n = n0 + wi; n < n1; n += wn) {
    const f = path.join(out, `f_${String(n).padStart(5, '0')}.jpg`);
    if (fs.existsSync(f)) continue;
    await shot(n / fps, f);
    done++;
    if (done % 25 === 0) console.log(`w${wi} ${n}/${n1} ${((Date.now() - start) / done).toFixed(0)}ms/f`);
  }
  console.log(`w${wi} done ${done} frames`);
}
await browser.close(); srv.close();
