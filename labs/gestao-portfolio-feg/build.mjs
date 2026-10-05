// Gera public/gestao-portfolio-feg.html — arquivo único e offline.
// Uso: node labs/gestao-portfolio-feg/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'public', 'gestao-portfolio-feg.html');
const read = p => readFileSync(join(here, p), 'utf8');
const safe = js => js.replace(/<\/script/gi, '<\\/script').replace(/\/\/# sourceMappingURL=.*$/gm, '');
// A ordem dos scripts segue o index.html de desenvolvimento
// Estilos na ordem dos <link> do index.html (styles.css, design.css e os CSS de cada pacote de telas)
const estilos = [...read('index.html').matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
const scripts = [...read('index.html').matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gestão de Portfólio FEG</title>
<meta name="description" content="Sistema de cadastro, entrada e priorização de projetos do portfólio da FEG/ONS.">
<style>
${estilos.map(p => `/* ${p} */\n${read(p).replace(/\s+$/, '')}`).join('\n')}
</style>
</head>
<body>
<div id="app"></div>
${scripts.map(p => `<script>/* ${p} */\n${safe(read(p)).replace(/\s+$/, '')}\n</script>`).join('\n')}
<script>GP.start();</script>
</body>
</html>
`;
writeFileSync(out, html);
console.log(`ok: ${out} (${(html.length / 1024).toFixed(0)} KB; ${scripts.length} scripts)`);
