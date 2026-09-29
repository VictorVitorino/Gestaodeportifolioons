// Renders card titles over a background image with Inter (the FLOWS font), for the Biblioteca screenshot.
//   node titles.mjs <bg.png> <spec.json> <out.png>
import { chromium } from 'playwright-core';
import fs from 'fs'; import path from 'path';
const [bg, specf, out] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specf, 'utf8'));
const FD = path.resolve('v7src/motion/dts-todos-sabem-usam-exemplo/fonts');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] });
const pg = await b.newPage({ viewport: { width: spec.W, height: spec.H }, deviceScaleFactor: 1 });
const bgUrl = 'data:image/png;base64,' + fs.readFileSync(bg).toString('base64');
const face = (w) => `@font-face{font-family:I;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FD, `Inter-normal-${w}-latin.woff2`)).toString('base64')}) format('woff2');}
@font-face{font-family:I;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FD, `Inter-normal-${w}-latin-ext.woff2`)).toString('base64')}) format('woff2');unicode-range:U+0100-02AF,U+1E00-1EFF;}`;
const html = `<html><head><style>${face(500)}${face(600)}${face(700)}
body{margin:0;width:${spec.W}px;height:${spec.H}px;background:${spec.transparent ? 'transparent' : `url(${bgUrl}) 0 0/100% 100% no-repeat`};-webkit-font-smoothing:antialiased}
.t{position:absolute;font-family:I;color:${spec.color};white-space:normal;overflow-wrap:normal}</style></head><body>
${spec.items.map((it) => `<div class="t" style="left:${it.x}px;top:${it.y}px;width:${it.w}px;font-size:${it.size}px;line-height:${it.lh}px;font-weight:${it.wt};letter-spacing:${it.ls || 0}px">${it.text}</div>`).join('')}
</body></html>`;
await pg.setContent(html); await pg.evaluate(() => document.fonts.ready);
const lines = await pg.evaluate(() => [...document.querySelectorAll('.t')].map((d) => { const r = document.createRange(); r.selectNodeContents(d); return [...r.getClientRects()].map((q) => [q.left, q.top, q.right, q.bottom].map((v) => +v.toFixed(1))); }));
fs.writeFileSync(out + '.json', JSON.stringify(lines));
await pg.screenshot({ path: out, omitBackground: !!spec.transparent });
await b.close();
