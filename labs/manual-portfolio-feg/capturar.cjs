/* Captura as cenas do manual a partir do sistema real (public/gestao-portfolio-feg.html).
   Para cada cena: estado limpo com exemplos e nível definido → rota → prep → mede alvo e dicas → captura PNG → WebP.
   Uso: node labs/manual-portfolio-feg/capturar.cjs [filtro-de-id]
   Saída: labs/manual-portfolio-feg/frames/<id>.webp e labs/manual-portfolio-feg/cenas.json */
const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const AQUI = __dirname, RAIZ = path.resolve(AQUI, '../..');
const APP = 'file://' + RAIZ + '/public/gestao-portfolio-feg.html';
const FRAMES = path.join(AQUI, 'frames'); fs.mkdirSync(FRAMES, { recursive: true });
const W = 1440, H = 900;
const MODULOS = require('./cenas.cjs');
const filtro = process.argv[2] ? new RegExp(process.argv[2]) : null;

(async () => {
  const b = await chromium.launch();
  const DSF = +(process.env.DSF || 2);   // capturas com mais pixels deixam o zoom do player nítido
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  const anterior = fs.existsSync(path.join(AQUI, 'cenas.json')) ? JSON.parse(fs.readFileSync(path.join(AQUI, 'cenas.json'), 'utf8')) : null;
  const saida = [];
  for(const m of MODULOS){
    const mod = { id: m.id, nivel: m.nivel, titulo: m.titulo, subtitulo: m.subtitulo, icone: m.icone, cenas: [] };
    for(const c of m.cenas){
      if(filtro && !filtro.test(c.id)){ const old = anterior && anterior.flatMap(x => x.cenas).find(x => x.id === c.id); if(old){ mod.cenas.push(Object.assign(old, { titulo: c.titulo, texto: c.texto })); continue; } }
      const nivel = c.nivel || m.nivel || 3;
      // estado limpo: exemplos carregados, nível e menu definidos antes do carregamento (sem avisos na tela)
      await p.goto(APP); await p.evaluate(() => localStorage.clear()); await p.reload();
      await p.evaluate(n => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = n; S.ui.menuMini = false; S.ui.menuSecoes = {}; GP.save(); }, nivel);
      const h = await p.evaluate(() => { const t = GP.projetos.todos(); return { idAprovado: (t.find(x => x.etapa === 'aprovado') || t[0]).id }; });
      let rota = c.rota === 'ficha' ? '#/projeto/' + h.idAprovado : c.rota === 'avaliar-aprovado' ? '#/avaliar/' + h.idAprovado : c.rota;
      await p.goto(APP + rota); await p.reload(); await p.waitForTimeout(900);
      await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.classList.remove('on')));
      if(c.prep) await c.prep(p, h);
      await p.waitForTimeout(350);
      // traz o alvo para a área visível quando estiver fora (elementos fixos não rolam)
      if(c.alvo) await p.evaluate(sel => { const e = [...document.querySelectorAll(sel)].find(x => x.offsetParent || getComputedStyle(x).position === 'fixed'); if(!e) return;
        const r = e.getBoundingClientRect(); if(r.top < 90 || r.bottom > innerHeight - 10) e.scrollIntoView({ block: r.height > innerHeight - 140 ? 'start' : 'center' }); }, c.alvo);
      await p.mouse.move(W - 4, H - 4); await p.waitForTimeout(500);
      await p.evaluate(() => { document.querySelectorAll('.tip,.gp-tt').forEach(t => t.remove()); document.querySelectorAll('.toast').forEach(t => t.classList.remove('on')); });
      const medir = sel => p.evaluate(sel => { const e = [...document.querySelectorAll(sel)].find(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if(!e) return null;
        const r = e.getBoundingClientRect(), x = Math.max(0, r.left), y = Math.max(0, r.top); return { x: Math.round(x), y: Math.round(y), w: Math.round(Math.min(innerWidth, r.right) - x), h: Math.round(Math.min(innerHeight, r.bottom) - y) }; }, sel);
      const alvo = c.alvo ? await medir(c.alvo) : null;
      if(c.alvo && !alvo) console.warn(`⚠ ${c.id}: alvo não encontrado (${c.alvo})`);
      const dicas = [];
      for(const d of (c.dicas || [])){ const r = await medir(d.sel); if(r && r.h > 0) dicas.push(Object.assign(r, { titulo: d.titulo, texto: d.texto })); else console.warn(`⚠ ${c.id}: dica não encontrada (${d.sel})`); }
      const png = path.join(FRAMES, c.id + '.png'), webp = path.join(FRAMES, c.id + '.webp');
      await p.screenshot({ path: png });
      execSync(`python3 -c "from PIL import Image; Image.open('${png}').convert('RGB').save('${webp}', 'WEBP', quality=${process.env.Q || 58}, method=6)"`); fs.unlinkSync(png);
      mod.cenas.push({ id: c.id, titulo: c.titulo, texto: c.texto, rota: c.rota === 'ficha' || c.rota === 'avaliar-aprovado' ? (c.rota === 'ficha' ? '#/acervo' : '#/avaliar') : c.rota, nivel,
        img: 'frames/' + c.id + '.webp', alvo, dicas, zoom: c.zoom == null ? 1 : c.zoom, seta: !!c.seta, cursor: c.cursor || null, dur: c.dur || 0 });
      console.log(`✓ ${c.id} ${alvo ? `${alvo.w}×${alvo.h}@${alvo.x},${alvo.y}` : 'sem alvo'} · ${dicas.length} dica(s) · ${(fs.statSync(webp).size / 1024).toFixed(0)} KB`);
    }
    saida.push(mod);
  }
  fs.writeFileSync(path.join(AQUI, 'cenas.json'), JSON.stringify(saida, null, 1));
  if(erros.length) console.warn('erros na página:', erros.slice(0, 5));
  await b.close();
})();
