/* QA de regressão no navegador (Playwright/Chromium). Falha com código 1 se algo quebrar. */
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const APP = 'file://' + ROOT + '/public/gestao-portfolio-feg.html';
const SHOTS = process.env.QA_SHOTS || '';
const ruido = t => /fonts\.g|ERR_CERT|ERR_NAME|ERR_CONN|net::ERR_FAILED/.test(t);
let ok = 0, falhas = [];
const check = (cond, msg) => { if(cond) ok++; else falhas.push(msg); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', e => erros.push('pageerror: ' + e.message));
  p.on('console', m => { if(m.type() === 'error' && !ruido(m.text())) erros.push('console: ' + m.text()); });
  const ir = async (h, w = 200) => { await p.goto(APP + h); await p.waitForTimeout(w); };
  const reset = async () => { await ir('#/painel'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(250); };
  const recarregar = async (w = 250) => { await p.reload(); await p.waitForTimeout(w); };

  /* 1) Apps existentes continuam abrindo */
  for(const f of ['afinacao-feg.html', 'portfolio-feg.html']){
    const q = await ctx.newPage(); const e = [];
    q.on('pageerror', x => e.push(x.message));
    await q.goto('file://' + ROOT + '/public/' + f); await q.waitForTimeout(400);
    check(e.length === 0, `app existente ${f} com erro: ${e.join(' | ')}`);
    await q.close();
  }

  /* 2) Todas as rotas, nível 3 ativo, desktop e celular */
  await reset();
  await p.evaluate(() => { const S = GP.state(); S.ui.nivel = 3; GP.save(); });
  const telas = await p.evaluate(() => GP.telas().map(t => t.id));
  for(const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]){
    await p.setViewportSize(vp);
    for(const id of telas){
      await ir('#/' + id, 180);
      const txt = await p.textContent('#conteudo');
      check(!/Erro ao montar/.test(txt), `rota #/${id} (${vp.width}px) com erro de montagem`);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      check(sw <= vp.width + 2, `rota #/${id} com rolagem horizontal em ${vp.width}px (${sw})`);
      if(SHOTS && vp.width === 1440) await p.screenshot({ path: `${SHOTS}/${id}.png`, fullPage: true });
      if(SHOTS && vp.width === 390) await p.screenshot({ path: `${SHOTS}/m-${id}.png` });
    }
  }
  await p.setViewportSize({ width: 1440, height: 900 });

  /* 3) Fluxos por passo */
  const fluxos = require('./fluxos.cjs');
  for(const [nome, fn] of Object.entries(fluxos)){
    try { await reset(); await fn({ p, ir, check, APP, recarregar }); }
    catch(e){ falhas.push(`fluxo "${nome}" lançou: ${e.message.split('\n')[0]}`); }
  }

  check(erros.length === 0, 'erros de console/página: ' + erros.slice(0, 5).join(' | '));
  await b.close();
  console.log(`QA: ${ok} ok · ${falhas.length} falha(s)`);
  falhas.forEach(f => console.log('  ✗ ' + f));
  process.exit(falhas.length ? 1 : 0);
})();
