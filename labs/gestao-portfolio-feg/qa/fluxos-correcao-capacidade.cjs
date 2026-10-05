/* Regressão da correção "capacidade": uma única fonte (montarCarteira, mês a mês) para Carteira, Pauta, Painel, Roadmap,
   sinais de risco e aba Custos; linha de corte; fixado que estoura; matriz de riscos vazia; tipografia e alvos de toque.
   Cada fluxo começa com o armazenamento limpo. */
const exemplos = async (p, recarregar, extra) => {
  await p.evaluate(x => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 3; if(x) Object.assign(S.capacidade, x); GP.save(); }, extra || null);
  await recarregar();
};
const idDe = (p, cod) => p.evaluate(c => GP.projetos.todos().find(x => x.codigo === c).id, cod);
const txt = async (p, sel) => (await p.innerText(sel) || '').replace(/\s+/g, ' ');

module.exports = {
  async 'cap 11/44: painel, riscos, roadmap, carteira e pauta respondem com o mesmo pico'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    const c = await p.evaluate(() => { const S = GP.state(), c = GP.modelo.montarCarteira(GP.projetos.todos(), S.capacidade, S.forcar); return { mes:c.pico.mes, total:c.pico.total, ef:c.efetiva, pp:c.picoPlanejado }; });
    check(c.mes === '2027-03' && c.total === 8.5 && c.pp.mes === '2027-04' && c.pp.total === 10.5, 'modelo: pico da carteira mar/2027 8,5 e demanda planejada abr/2027 10,5: ' + JSON.stringify(c));
    // painel
    await ir('#/painel', 500);
    const pn = await txt(p, '.cap-resumo');
    check(/A carteira selecionada cabe: pico de 8,5 de 8,5 FTE em mar\/2027/.test(pn) && !/acima da capacidade/.test(pn), 'painel deveria dizer que a carteira cabe com pico em mar/2027: ' + pn);
    check(/Se o PRJ-014, que aguarda capacidade, começar como planejado, abr\/2027 chegaria a 10,5 FTE/.test(pn), 'painel deveria rotular o excesso de abr/2027 como hipótese do PRJ-014');
    check(await p.$$eval('.cap-spark path[fill="#b8642c"]', x => x.length) === 0, 'mini-histograma do painel não deveria ter barras cobre quando a carteira cabe');
    // riscos
    await ir('#/riscos', 400);
    const rk = await txt(p, '.rk-sinais');
    check(!/acima da capacidade/.test(rk) && /chegaria a 10,5 de 8,5 FTE/.test(rk), 'sinais não deveriam afirmar carteira acima da capacidade: ' + rk.slice(0, 300));
    // roadmap
    await ir('#/roadmap', 400);
    check(await p.locator('.g-col.over').count() === 0, 'roadmap: nenhum mês da carteira selecionada acima da capacidade');
    const abr = await p.$$eval('.g-col', c => { const x = c.find(y => /^abr\/2027/.test(y.dataset.tt)); return x ? { tt:x.dataset.tt, ag:!!x.querySelector('i.ag.ag-over') } : null; });
    check(abr && /carteira selecionada: 8,5 FTE/.test(abr.tt) && /como planejado: 10,5 FTE/.test(abr.tt) && abr.ag, 'roadmap: abr/2027 com 8,5 da carteira e 10,5 hachurado como hipótese: ' + JSON.stringify(abr));
    check(/Pessoas por mês/.test(await txt(p, '.rm-dem-lbl')) && /carteira selecionada/.test(await txt(p, '.rm-dem-lbl')), 'histograma deveria dizer que mostra execução + carteira selecionada');
    await p.click('.rm-so'); await p.waitForTimeout(300);
    check(await p.locator('.g-col i.ag').count() === 0, '"Só o que cabe" deveria esconder também a parte hachurada do histograma');
    // carteira e pauta
    await ir('#/carteira', 300);
    const k = await txt(p, '.cart-kpis');
    check(/sobram 0,0 FTE no pico \(mar\/2027\)/.test(k) && /Pessoas para novos projetos 7,0 ?FTE em mar\/2027 \(pico\)/.test(k), 'carteira: KPIs no mesmo mês de pico: ' + k);
    await p.click('[data-pauta]'); await p.waitForTimeout(200);
    const pauta = await p.inputValue('.modal [data-txt]');
    check(/Proposta: 4 projetos cabem, com pico de 8,5 de 8,5 FTE \(mar\/2027\)/.test(pauta), 'pauta: mesmo pico da carteira');
    await p.keyboard.press('Escape');
  },
  async 'cap 36: aba Custos usa o mesmo uso da capacidade (pico da carteira) e avisa estouro'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await p.evaluate(() => { GP.state().ui.abaIndicadores = 'custos'; GP.save(); }); await ir('#/indicadores', 500);
    const ms = await p.$$eval('.metric', m => m.map(x => x.innerText.replace(/\s+/g, ' ')));
    const uso = ms.find(x => /Uso da capacidade/.test(x)) || '';
    check(/Uso da capacidade no pico 100%/.test(uso) && /8,5 de 8,5 FTE em mar\/2027/.test(uso), 'uso da capacidade deveria ser o pico da carteira (100%, mar/2027): ' + uso);
    check(ms.some(x => /FTE em execução hoje 6,5/.test(x) && /1,5 no pico de 2027/.test(x)), 'FTE em execução deveria explicitar o recorte "hoje" e o valor no pico do período');
    // estouro: anel cobre com rótulo
    await p.evaluate(() => { const S = GP.state(), id = c => GP.projetos.todos().find(x => x.codigo === c).id; S.capacidade.fte = 6; S.forcar[id('PRJ-013')] = 'in'; S.forcar[id('PRJ-014')] = 'in'; GP.save(); GP.refresh(); }); await p.waitForTimeout(400);
    const uso2 = (await p.$$eval('.metric', m => m.map(x => x.innerText.replace(/\s+/g, ' ')))).find(x => /Uso da capacidade/.test(x)) || '';
    check(/118%/.test(uso2) && /Acima da capacidade em abr\/2027/.test(uso2), 'com fixado que estoura o uso deveria passar de 100% com aviso: ' + uso2);
  },
  async 'cap 31: período jul/2026–jun/2027 com KPIs, fórmula e pauta na mesma base'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, { periodoIni:'2026-07', periodoFim:'2027-06', periodo:'jul/2026 a jun/2027' });
    await ir('#/carteira', 300);
    const k = await txt(p, '.cart-kpis'), f = await txt(p, '.cart-formula');
    const livre = +(k.match(/Pessoas para novos projetos ([\d,]+)/) || [])[1].replace(',', '.'), usada = +(k.match(/Usadas pela carteira ([\d,]+)/) || [])[1].replace(',', '.');
    check(livre === 7 && usada === 7 && /sobram 0,0 FTE no pico \(mar\/2027\)/.test(k), `livre (${livre}) e usada (${usada}) deveriam estar no mesmo mês de pico: ` + k);
    check(/mín\. 2,0 em jul–dez\/2026/.test(k), 'KPI deveria explicar o mês mais carregado pela execução: ' + k);
    check(/− 1,5 \(execução\) − 7,0 \(nova carteira\) = 0,0 FTE livres/.test(f), 'fórmula do medidor deveria bater com os KPIs: ' + f);
    await p.click('[data-pauta]'); await p.waitForTimeout(200);
    const pauta = await p.inputValue('.modal [data-txt]');
    check(/1,5 FTE em execução no mês de pico \(mar\/2027\) → 7,0 FTE para novos projetos/.test(pauta) && /sobram 2,0/.test(pauta), 'pauta deveria usar a mesma base: ' + pauta.split('\n').slice(3, 5).join(' | '));
    await p.keyboard.press('Escape');
  },
  async 'cap 32: fixado que estoura não conta como "cabe" (KPI, pauta, painel, roadmap)'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, { fte:6 });
    await ir('#/carteira', 300);
    for(const cod of ['PRJ-013', 'PRJ-014']){ const id = await idDe(p, cod); await p.click(`[data-forcar="${id}"][data-v="in"]`); await p.waitForTimeout(200); if(await p.locator('.modal [data-ok]').count()){ await p.click('.modal [data-ok]'); await p.waitForTimeout(250); } }
    const m = await p.evaluate(() => { const S = GP.state(), c = GP.modelo.montarCarteira(GP.projetos.todos(), S.capacidade, S.forcar); return { cabem:c.cabem, estouram:c.estouram, dentro:c.dentro.length }; });
    check(m.cabem === 1 && m.estouram === 1 && m.dentro === 2, 'modelo: 1 cabe e 1 fixado estoura: ' + JSON.stringify(m));
    const k = await txt(p, '.cart-kpis');
    check(/Projetos que cabem 1 ?\/ ?5/.test(k) && /\+ 1 fixado estoura/.test(k), 'KPI deveria separar quem cabe do fixado que estoura: ' + k);
    const corte = await txt(p, '.cart-corte');
    check(!/Cabem na capacidade/.test(corte) && /Na carteira · pico excede em 0,9 FTE/.test(corte), 'linha de corte não deveria dizer "Cabem na capacidade" com estouro: ' + corte);
    await p.click('[data-pauta]'); await p.waitForTimeout(200);
    const pauta = await p.inputValue('.modal [data-txt]');
    check(/Proposta: 1 projeto cabe e 1 fixado estoura a capacidade, com pico de 6,0 de 5,1 FTE \(abr\/2027\), 0,9 acima da capacidade/.test(pauta), 'pauta: proposta coerente com o estouro: ' + (pauta.match(/Proposta:[^\n]*/) || [''])[0]);
    await p.keyboard.press('Escape');
    await ir('#/painel', 400);
    const pn = await txt(p, '.cap-resumo');
    check(/1 de 5 aprovados cabem na carteira · 1 fixado estoura/.test(pn) && /A carteira selecionada passa da capacidade: pico de 6,0 FTE em abr\/2027/.test(pn), 'painel deveria mostrar o estouro do fixado: ' + pn);
    await ir('#/roadmap', 400);
    const b14 = await p.$$eval('.rm-row', rs => { const r = rs.find(x => /PRJ-014/.test(x.textContent)); return r ? r.querySelector('.g-bar').className + ' ' + r.querySelector('.g-bar').textContent : ''; });
    check(/gb-estoura/.test(b14) && !/aguarda capacidade/.test(b14), 'roadmap: fixado que estoura não é "aguarda capacidade": ' + b14);
  },
  async 'cap 7: projeto pulado desce para abaixo da linha de corte e o acumulado só cresce'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await p.evaluate(() => { const r = GP.projetos.criar({ titulo:'Projeto X', descricao:'d', gerencia:'FER', demandante:'M', tipo:'Projeto', esforcoFte:1.5 }); r.projeto.etapa = 'execucao'; GP.save(); });
    await ir('#/carteira', 400);
    const linhas = await p.$$eval('.cart-tbl tbody tr', trs => trs.map(tr => tr.classList.contains('cart-corte') ? { corte:true } : tr.dataset.id ? { cod:tr.querySelector('.code').textContent, ac:parseFloat((tr.querySelector('.cart-ac small') || { textContent:'' }).textContent.replace(',', '.')), fora:tr.classList.contains('is-fora'), sit:tr.querySelector('.c-sit').textContent } : { grp:true }));
    const ic = linhas.findIndex(l => l.corte), acima = linhas.slice(0, ic).filter(l => l.cod), abaixo = linhas.slice(ic + 1).filter(l => l.cod);
    check(ic > 0 && acima.every(l => !l.fora && /Cabe|Fixado/.test(l.sit)), 'acima da linha só quem cabe: ' + JSON.stringify(linhas));
    check(acima.every((l, i) => !i || l.ac >= acima[i - 1].ac - 1e-9), 'acumulado acima da linha deveria só crescer: ' + acima.map(l => l.ac));
    check(abaixo.some(l => l.cod === 'PRJ-003') && abaixo.every(l => l.fora), 'PRJ-003 (pulado) deveria ficar abaixo da linha: ' + JSON.stringify(abaixo));
    const p03 = abaixo.find(l => l.cod === 'PRJ-003') || {};
    check(p03.ac === 10 && /faltam 1,5 FTE em mar\/2027/.test(p03.sit), 'PRJ-003: pico se entrasse na carteira final (10,0) e falta coerente (1,5): ' + JSON.stringify(p03));
    check(/Projetos que cabem\s*3\s*\/\s*5/.test(await txt(p, '.cart-kpis')), 'KPI deveria contar 3 de 5');
  },
  async 'cap 33: matriz de riscos vazia mostra as 5 colunas em 1440 e 1280'({ p, ir, check }){
    await p.evaluate(() => { GP.state().ui.nivel = 3; GP.save(); });
    for(const w of [1440, 1280, 1024]){
      await p.setViewportSize({ width:w, height:900 }); await ir('#/riscos', 300);
      const r = await p.evaluate(() => { const bx = document.querySelector('.rk-vazio .rk-mtz-box'), b = bx.getBoundingClientRect(), cels = [...bx.querySelectorAll('.rk-cel')];
        const ax = [...bx.querySelectorAll('.rk-ax-x')].map(a => a.getBoundingClientRect()); let enc = 0; for(let i = 1; i < ax.length; i++) if(ax[i].left < ax[i - 1].right - 0.5) enc++;
        return { n:cels.length, cortadas:cels.filter(c => { const q = c.getBoundingClientRect(); return q.right > b.right + 1 || q.left < b.left - 1; }).length, rola:bx.scrollWidth > bx.clientWidth + 1, enc }; });
      check(r.n === 25 && r.cortadas === 0 && !r.rola && r.enc === 0, `matriz vazia em ${w}px deveria caber inteira, sem rótulos encostados: ` + JSON.stringify(r));
    }
    await p.setViewportSize({ width:1440, height:900 });
    const lado = await p.evaluate(() => { const m = document.querySelector('.rk-vazio .rk-mtz-box').getBoundingClientRect(), t = document.querySelector('.rk-vazio-t').getBoundingClientRect(); return t.left >= m.right - 1; });
    check(lado, 'em 1440 a matriz vazia deveria ficar ao lado do CTA');
  },
  async 'cap 15/16: textos ≥ 11px e alvos de toque ≥ 44px nas telas de capacidade'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    const SEL = '.cart-tbl th,.cart-tbl small,.capm-lbls span,.capm-eixo span,.cart-ac small,.rm-g .rm-meses span,.rm-ticks i,.rm-hoje b,.g-cap span,.g-col b,.rk-ax,.rk-n,.cap-spark-x span';
    for(const r of ['#/carteira', '#/roadmap', '#/riscos', '#/painel']){
      await ir(r, 400);
      const peq = await p.$$eval(SEL, es => es.filter(e => e.offsetParent && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 10.95).map(e => e.className + ' ' + getComputedStyle(e).fontSize));
      check(peq.length === 0, `${r}: textos abaixo de 11px: ` + peq.slice(0, 5).join(' | '));
    }
    await p.setViewportSize({ width:360, height:740 });
    for(const r of ['#/carteira', '#/riscos', '#/roadmap']){
      await ir(r, 400);
      if(r === '#/riscos') await p.evaluate(() => document.querySelectorAll('.rk-mais').forEach(d => { d.open = true; }));
      const bad = await p.evaluate(() => { const vis = e => { for(let n = e; n; n = n.parentElement){ const c = getComputedStyle(n); if(c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
        return [...document.querySelectorAll('.cart-wrap button,.cart-wrap input:not([type=checkbox]),.rk-wrap button,.rk-wrap summary,.rm-filtros a,.rm-sem a')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && vis(e) && r.height < 43.5 && !(e.tagName === 'A' && getComputedStyle(e).display === 'inline'); })
          .map(e => (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().height)); });
      check(bad.length === 0, `${r} em 360px: alvos abaixo de 44px: ` + bad.slice(0, 6).join(' | '));
    }
    await p.setViewportSize({ width:1440, height:900 });
  },
};
