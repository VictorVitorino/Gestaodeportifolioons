// Gera public/portfolio-feg.html — arquivo único e offline (CSS, JS, logos e bibliotecas de PDF embutidos).
// Uso: node labs/portfolio-feg/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'public', 'portfolio-feg.html');
const read = p => readFileSync(join(here, p), 'utf8');
const dataUri = p => 'data:image/png;base64,' + readFileSync(join(here, p)).toString('base64');
const safe = js => js.replace(/<\/script/gi, '<\\/script').replace(/\/\/# sourceMappingURL=.*$/gm, '');

const modules = ['src/core.js', 'src/data.js', 'src/calc.js', 'src/globais.js', 'src/nivel1.js', 'src/perguntas-n1.js', 'src/nivel2.js', 'src/perguntas-n2.js', 'src/nivel3.js', 'src/perguntas-n3.js'].filter(p => existsSync(join(here, p)));
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Portfólio FEG</title>
<meta name="description" content="Sistema didático de gestão de portfólio da FEG/ONS em 3 níveis — dados fictícios.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>
<style>
${read('src/styles.css')}
</style>
</head>
<body>
<div id="app"></div>
<script>window.PF = { LOGO_MAESTRO: ${JSON.stringify(dataUri('assets/maestro.png'))}, LOGO_ONS: ${JSON.stringify(dataUri('assets/ons.png'))} };</script>
${modules.map(p => `<script>/* ${p} */\n${safe(read(p))}\n</script>`).join('\n')}
<script>PF.start();</script>
<!-- Bibliotecas embutidas para exportar PDF offline: html2canvas 1.4.1 (MIT) e jsPDF 2.5.1 (MIT) -->
<script>${safe(read('vendor/html2canvas.min.js'))}</script>
<script>${safe(read('vendor/jspdf.umd.min.js'))}</script>
</body>
</html>
`;
writeFileSync(out, html);
console.log(`ok: ${out} (${(html.length / 1024).toFixed(0)} KB; módulos: ${modules.join(', ')})`);
