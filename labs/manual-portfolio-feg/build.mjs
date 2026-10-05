// Gera public/manual-gestao-portfolio-feg.html — manual interativo em arquivo único e offline.
// Uso: node labs/manual-portfolio-feg/build.mjs   (as cenas vêm de cenas.json, gerado por capturar.cjs)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..', 'gestao-portfolio-feg');
const out = join(here, '..', '..', 'public', 'manual-gestao-portfolio-feg.html');
const read = p => readFileSync(join(here, p), 'utf8');
const safe = js => js.replace(/<\/script/gi, '<\\/script');

const modulos = JSON.parse(read('cenas.json'));
const img = {};
for(const m of modulos) for(const c of m.cenas) img[c.id] = 'data:image/webp;base64,' + readFileSync(join(here, c.img)).toString('base64');
// miniaturas leves para os cartões da visão geral (a primeira cena de cada módulo), sem decodificar imagens grandes
const ids = modulos.map(m => m.cenas[0].id);
const mini = JSON.parse(execFileSync('python3', ['-c', `
import sys, json, io, base64
from PIL import Image
out = {}
for i in sys.argv[2:]:
    im = Image.open(sys.argv[1] + '/frames/' + i + '.webp').convert('RGB'); im.thumbnail((720, 450), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=70, method=6); out[i] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
print(json.dumps(out))`, here, ...ids], { maxBuffer: 64 << 20 }).toString());
// ícones e logo reaproveitados do sistema, para o manual falar a mesma língua visual
const core = readFileSync(join(app, 'src', 'core.js'), 'utf8');
const icones = Function(`return ${/const I = (\{[\s\S]*?\n {2}\});/.exec(core)[1]}`)();
const logoOns = /LOGO_ONS:\s*'([^']+)'/.exec(readFileSync(join(app, 'assets', 'logos.js'), 'utf8'))[1];
const dados = { modulos: modulos.map(m => ({ ...m, cenas: m.cenas.map(({ img: _, ...c }) => c) })), img, mini, icones, logoOns };

const html = `<!doctype html>
<html lang="pt-BR" data-ambiente="gerencial">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manual interativo · Gestão de Portfólio FEG</title>
<meta name="description" content="Treinamento em clipes guiados do sistema Gestão de Portfólio FEG (ONS): passo a passo por módulo, com zoom, setas, dicas e verificação de aprendizado.">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill="#3E6801"/><path d="M13 27l5-14 5 9 4-5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>')}">
<style>
${read('src/manual.css').replace(/\s+$/, '')}
</style>
</head>
<body>
<div id="manual"></div>
<script>window.MANUAL = ${safe(JSON.stringify(dados))};</script>
<script>/* src/conteudo.js */
${safe(read('src/conteudo.js')).replace(/\s+$/, '')}
</script>
<script>/* src/manual.js */
${safe(read('src/manual.js')).replace(/\s+$/, '')}
</script>
</body>
</html>
`;
writeFileSync(out, html);
console.log(`ok: ${out} (${(html.length / 1024 / 1024).toFixed(2)} MB; ${modulos.length} módulos, ${Object.keys(img).length} cenas)`);
