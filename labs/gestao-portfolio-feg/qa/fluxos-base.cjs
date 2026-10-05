/* Fluxos do pacote base: shell, acessibilidade, componentes e gráficos compartilhados. Cada fluxo começa com armazenamento limpo. */
const exemplos = async (p, recarregar, nivel = 3) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.save(); }, nivel); await recarregar(); };
const ativo = p => p.evaluate(() => { const a = document.activeElement; return a ? { tag:a.tagName, txt:(a.textContent || '').trim().slice(0, 60), cls:a.className && a.className.baseVal === undefined ? a.className : '', dentroSide:!!a.closest('.side'), dentroModal:!!a.closest('.modal'), dentroConteudo:!!a.closest('#conteudo') } : null; });

module.exports = {
  async 'base B1: pular para o conteúdo, foco no título e região viva'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2);
    await ir('#/acervo', 250); await p.reload(); await p.waitForTimeout(300);
    await p.keyboard.press('Tab');
    let a = await ativo(p);
    check(a && /Ir para o conteúdo/.test(a.txt) && await p.locator('.skip').isVisible(), 'B1: o 1º Tab deveria mostrar "Ir para o conteúdo" (veio ' + JSON.stringify(a) + ')');
    await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    a = await ativo(p);
    check(a && a.dentroConteudo || (a && a.tag === 'MAIN'), 'B1: Enter no link deveria levar o foco ao conteúdo');
    check(/#\/acervo/.test(p.url()), 'B1: o link de pular não deveria trocar a rota');
    await p.focus('.side .nav-item[href="#/ranking"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    a = await ativo(p);
    check(a && a.tag === 'H1', 'B1: depois de Enter no menu o foco deveria estar no h1 da tela nova (veio ' + JSON.stringify(a) + ')');
    check(/Página: Ranking/.test(await p.textContent('#gp-anuncio')), 'B1: a região viva deveria anunciar "Página: Ranking"');
    await p.focus('.topbar .seg [data-nivel="1"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('.topbar .seg [data-nivel="1"]')), 'B1: depois de trocar o nível pelo teclado o foco deveria continuar no botão');
    await p.focus('.topbar .seg [data-nivel="2"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('.topbar .seg [data-nivel="2"]')), 'B1: foco deveria continuar em "2 Priorizar"');
  },
  async 'base B2: gaveta do celular com foco preso, Fechar e seletor de nível'({ p, ir, check }){
    await p.setViewportSize({ width:390, height:844 }); await ir('#/acervo', 250); await p.reload(); await p.waitForTimeout(300);
    let invis = 0;
    for(let i = 0; i < 30; i++){ await p.keyboard.press('Tab');
      const ok = await p.evaluate(() => { const a = document.activeElement; if(!a || a === document.body) return true; const r = a.getBoundingClientRect(); return !a.closest('.side') && r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth; });
      if(!ok) invis++; }
    check(invis === 0, `B2: ${invis} paradas de Tab em elementos invisíveis com a gaveta fechada`);
    check(await p.evaluate(() => document.querySelector('.side').hasAttribute('inert')), 'B2: gaveta fechada deveria ficar inerte');
    const mini0 = await p.evaluate(() => !!GP.state().ui.menuMini);
    await p.click('.topbar [data-menu]'); await p.waitForTimeout(350);
    check(await p.evaluate(() => { const s = document.querySelector('.side'); return s.getAttribute('role') === 'dialog' && s.getAttribute('aria-modal') === 'true'; }), 'B2: gaveta aberta deveria ser diálogo modal');
    check(await p.getAttribute('.topbar [data-menu]', 'aria-expanded') === 'true', 'B2: botão Menu deveria ter aria-expanded=true');
    let fora = 0; for(let i = 0; i < 30; i++){ await p.keyboard.press('Tab'); if(!(await ativo(p)).dentroSide) fora++; }
    check(fora === 0, `B2: o Tab saiu da gaveta ${fora} vez(es)`);
    check(!(await p.locator('.side [data-recolher]').isVisible()), 'B2: não deveria haver botão Recolher na gaveta');
    await p.evaluate(() => document.querySelector('.side [data-recolher]').click()); await p.waitForTimeout(100);
    check(await p.evaluate(() => !!GP.state().ui.menuMini) === mini0, 'B2: a gaveta não deveria gravar o modo mini');
    await p.keyboard.press('Escape'); await p.waitForTimeout(350);
    check(await p.locator('.side.open').count() === 0 && await p.evaluate(() => document.activeElement && document.activeElement.matches('.topbar [data-menu]')), 'B2: Esc deveria fechar e devolver o foco ao botão Menu');
    await p.click('.topbar [data-menu]'); await p.waitForTimeout(350);
    check(await p.locator('.side [data-fechar-menu]').isVisible(), 'B2: botão Fechar (X) deveria aparecer na gaveta');
    await p.click('.side [data-fechar-menu]'); await p.waitForTimeout(350);
    check(await p.locator('.side.open').count() === 0 && await p.evaluate(() => document.activeElement && document.activeElement.matches('.topbar [data-menu]')), 'B2: X deveria fechar e devolver o foco ao botão Menu');
    await p.click('.topbar [data-menu]'); await p.waitForTimeout(350);
    check(await p.locator('.side .side-levels [data-nivel="2"]').isVisible(), 'B2: seletor de nível deveria aparecer na gaveta');
    await p.click('.side .side-levels [data-nivel="2"]'); await p.waitForTimeout(300);
    check(await p.evaluate(() => GP.nivel()) === 2 && await p.locator('.side.open').count() === 0, 'B2: seletor de nível da gaveta deveria trocar o nível e fechar');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'base B3: trilho com item ativo em uma linha, nível 3 visível e mini automático'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await ir('#/governanca', 250);
    const h = await p.evaluate(() => { const a = document.querySelector('.side .nav-item.on'), o = document.querySelector('.side .nav-item:not(.on)'); return [a.getBoundingClientRect().height, o.getBoundingClientRect().height]; });
    check(Math.abs(h[0] - h[1]) <= 1 && h[0] <= 44, 'B3: item ativo deveria ter a mesma altura dos outros (' + h.join(' x ') + ')');
    const vis = await p.evaluate(() => { const n = document.querySelector('.side-nav'), nr = n.getBoundingClientRect();
      return [...n.querySelectorAll('.nav-item')].map(i => { const r = i.getBoundingClientRect(); return { t:i.textContent.trim(), dentro: r.top >= nr.top - 1 && r.bottom <= nr.bottom + 1, fora: r.bottom <= nr.top || r.top >= nr.bottom }; }); });
    check(vis.filter(v => /Carteira|Roadmap|Riscos/.test(v.t)).every(v => v.dentro), 'B3: Carteira, Roadmap e Riscos deveriam estar à vista em 1440x900');
    check(vis.every(v => v.dentro || v.fora), 'B3: nenhum item do trilho deveria aparecer cortado ao meio');
    check(await p.evaluate(() => getComputedStyle(document.querySelector('.side .nav-sec')).color) === 'rgb(179, 203, 196)', 'B3: rótulo de seção do trilho com contraste ≥4,5:1 (#b3cbc4)');
    await p.setViewportSize({ width:1024, height:768 }); await ir('#/acervo', 250);
    check(await p.locator('.shell.mini').count() === 1 && await p.evaluate(() => !GP.state().ui.menuMini), 'B3: em 1024 o trilho deveria abrir em modo mini sem gravar a preferência');
    await p.hover('.side .nav-item[href="#/funil"]'); await p.waitForTimeout(120);
    check(/Funil/.test(await p.locator('.tip').textContent().catch(() => '')), 'B3: tooltip do trilho mini em 1024');
    await p.focus('.side .nav-item[href="#/funil"]'); await p.waitForTimeout(80); await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    check(await p.locator('.tip').count() === 0, 'B14: Esc deveria esconder o tooltip do trilho mini');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'base B4: cabeçalho com título da tela, data inteira e rótulos acessíveis'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2);
    await ir('#/painel', 200);
    check(/^(Bom dia|Boa tarde|Boa noite)/.test((await p.textContent('.topbar .ttl b')).trim()), 'B4: saudação no painel');
    await ir('#/acervo', 200);
    const b = (await p.textContent('.topbar .ttl b')).trim();
    check(b === 'Acervo' && !/Bom dia|Boa tarde|Boa noite/.test(b), 'B4: fora do painel o cabeçalho deveria mostrar o título da tela (veio ' + b + ')');
    check(await p.locator('.topbar .seg [aria-label^="Nível 1, Operação do portfólio"]').count() === 1, 'B4: botão de nível com nome acessível "Nível 1, Operação do portfólio"');
    check(await p.getAttribute('.side .brand', 'aria-label') === 'Gestão de Portfólio FEG, ir para o painel', 'B4: link da marca com nome acessível');
    await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(250);
    check(await p.locator('.topbar.is-scrolled').count() === 1, 'B4: cabeçalho deveria ficar sólido ao rolar');
    check(await p.evaluate(() => { const t = document.querySelector('.topbar'); return parseFloat(getComputedStyle(t).backgroundColor.split(',')[3]) >= .85; }), 'B4: fundo do cabeçalho rolado deveria esconder o texto de trás');
    for(const [w, hh] of [[1280, 800], [1440, 900]]){
      await p.setViewportSize({ width:w, height:hh }); await ir('#/acervo', 250);
      const d = await p.evaluate(() => { const w = document.querySelector('.topbar .when'), sm = document.querySelector('.topbar .ttl small'); const vis = [...w.children].filter(c => getComputedStyle(c).display !== 'none' && c.offsetWidth > 0);
        return { vis: vis.length, txt: vis.map(v => v.textContent).join(''), corta: sm.scrollWidth > sm.clientWidth + 1, ell: getComputedStyle(w).textOverflow }; });
      check(d.vis === 1 && !d.corta && d.ell !== 'ellipsis' && !/…/.test(d.txt), `B4: em ${w}px a data deveria aparecer inteira (${JSON.stringify(d)})`);
    }
    await p.evaluate(() => GP.save());
    check(await p.locator('[data-storage-status] svg').count() === 1, 'B4: status de salvamento deveria ser um ícone, não um ponto');
  },
  async 'base B5: tokens neutros com contraste e paleta de marca intacta'({ p, ir, check }){
    const t = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement), v = k => cs.getPropertyValue(k).trim().toLowerCase(); return { dim:v('--dim'), ons:v('--ons'), gold:v('--gold'), copper:v('--copper'), slate:v('--slate'), teal:v('--teal'), olive:v('--olive'), forest:v('--forest') }; });
    check(t.dim === '#5a6e67', 'B5: --dim deveria ser #5a6e67 (veio ' + t.dim + ')');
    check(t.ons === '#3e6801' && t.gold === '#d5a32d' && t.copper === '#ac7044' && t.slate === '#477b91' && t.teal === '#188787' && t.olive === '#6b8f2a' && t.forest === '#19352f', 'B5: paleta de marca não pode mudar ' + JSON.stringify(t));
    await ir('#/novo', 200);
    const bc = await p.evaluate(() => getComputedStyle(document.querySelector('[name=titulo]')).borderTopColor);
    check(bc === 'rgb(119, 141, 134)', 'B5: borda de campo deveria usar --line-input (veio ' + bc + ')');
    const svg = await p.evaluate(() => GP.charts.matriz([{ x:10, y:20, label:'A' }], { xMax:100, yMax:100, qx:50, qy:50, quadrantes:['a', 'b', 'c', 'd'] }));
    check(!/#8A908B/i.test(svg), 'B5: textos dos gráficos não deveriam usar #8A908B');
  },
  async 'base B6: tabela em cartões em 1024, ordenar no celular e cabeçalho como botão'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2);
    await p.setViewportSize({ width:1024, height:768 }); await ir('#/acervo', 300);
    const tr = await p.locator('.tbl-cards tbody tr').first().evaluate(e => getComputedStyle(e).display);
    const fade = await p.evaluate(() => { const w = document.querySelector('#conteudo .tbl-wrap'); return w.scrollWidth <= w.clientWidth + 2 || w.classList.contains('fade-r'); });
    check(tr === 'grid' || fade, 'B6: em 1024 a tabela deveria virar cartões ou sinalizar a rolagem');
    for(const r of ['#/sistemas', '#/ranking']){ await ir(r, 300);
      const ok = await p.evaluate(() => [...document.querySelectorAll('#conteudo .tbl-wrap')].every(w => { const t = w.querySelector('tbody tr'); return (t && getComputedStyle(t).display === 'grid') || w.scrollWidth <= w.clientWidth + 2 || w.classList.contains('fade-r'); }));
      check(ok, `B6: ${r} em 1024 com coluna cortada sem aviso`); }
    await p.setViewportSize({ width:1280, height:800 }); await ir('#/acervo', 300);
    const alt = await p.evaluate(() => Math.max(...[...document.querySelectorAll('#conteudo .tbl tbody tr')].map(t => t.getBoundingClientRect().height)));
    check(alt <= 140, 'B6: em 1280 nenhuma linha do acervo deveria passar de 140px (veio ' + Math.round(alt) + ')');
    await p.setViewportSize({ width:1440, height:900 }); await ir('#/acervo', 250);
    check(await p.locator('th[data-sort="acervo|titulo"] .th-sort[role="button"]').count() === 1 && await p.getAttribute('th[data-sort="acervo|titulo"]', 'aria-sort') === 'none', 'B6: cabeçalho ordenável como botão com aria-sort');
    await p.click('th[data-sort="acervo|titulo"] .th-sort'); await p.waitForTimeout(150);
    check(await p.getAttribute('th[data-sort="acervo|titulo"]', 'aria-sort') === 'ascending', 'B6: clicar no cabeçalho deveria ordenar (aria-sort ascending)');
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('th[data-sort="acervo|titulo"] .th-sort')), 'B6: foco deveria continuar no cabeçalho ordenado');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/acervo', 250);
    check(await p.locator('[data-sort-select="acervo"]').isVisible(), 'B6: celular deveria mostrar "Ordenar por"');
    check(await p.evaluate(() => { const t = document.querySelector('.tbl-cards thead'); const r = t.getBoundingClientRect(); return r.width <= 1 && r.height <= 1 && getComputedStyle(t).display !== 'none'; }), 'B6: cabeçalho da tabela deveria ficar só para leitor de tela no modo cartão');
    await p.selectOption('[data-sort-select="acervo"]', 'titulo|-1'); await p.waitForTimeout(200);
    const ultimo = await p.evaluate(() => GP.projetos.todos().map(x => x.titulo).sort((a, b) => b.localeCompare(a, 'pt-BR', { sensitivity:'base', numeric:true }))[0]);
    check((await p.locator('tbody tr').first().textContent()).includes(ultimo), 'B6: "Ordenar por" deveria ordenar');
    await recarregar(); await ir('#/acervo', 250);
    check((await p.locator('tbody tr').first().textContent()).includes(ultimo) && await p.inputValue('[data-sort-select="acervo"]') === 'titulo|-1', 'B6: ordenação do celular deveria persistir');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'base B7: modais com rodapé visível, nome acessível, fundo inerte e foco seguro'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1);
    await p.setViewportSize({ width:1366, height:768 }); await ir('#/funil', 250);
    await p.click('[data-entrada] >> nth=0'); await p.waitForTimeout(350);
    const r = await p.evaluate(() => { const a = document.querySelector('.modal .m-act'); const b = a.getBoundingClientRect(); return { bottom:b.bottom, top:b.top, vh:innerHeight, txt:a.textContent }; });
    check(r.bottom <= r.vh + 1 && r.top >= 0, 'B7: rodapé do checklist deveria estar visível sem rolar ' + JSON.stringify(r));
    check(await p.evaluate(() => document.getElementById('app').hasAttribute('inert')), 'B7: fundo deveria ficar inerte com o modal aberto');
    let fora = 0; for(let i = 0; i < 25; i++){ await p.keyboard.press('Tab'); if(!(await ativo(p)).dentroModal) fora++; }
    check(fora === 0, `B7: Tab alcançou o fundo ${fora} vez(es)`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    check(await p.evaluate(() => !document.getElementById('app').hasAttribute('inert') && document.activeElement && document.activeElement.matches('[data-entrada]')), 'B7: Esc deveria fechar, liberar o fundo e devolver o foco ao gatilho');
    await p.setViewportSize({ width:1440, height:900 }); await ir('#/painel', 200);
    await p.click('[data-ajuda-nivel]'); await p.waitForTimeout(200);
    const nome = await p.evaluate(() => { const m = document.querySelector('.modal'), id = m.getAttribute('aria-labelledby'); return id && document.getElementById(id) ? document.getElementById(id).textContent.trim() : ''; });
    check(nome === 'Níveis do sistema' && await p.evaluate(() => document.querySelector('.modal').getAttribute('role')) === 'dialog', 'B7: diálogo deveria se chamar "Níveis do sistema" (veio ' + nome + ')');
    check(await p.evaluate(() => !!document.querySelector('.modal').getAttribute('aria-describedby')), 'B7: diálogo deveria ter descrição');
    await p.keyboard.press('Escape');
    const id = await p.evaluate(() => GP.projetos.todos()[0].id); await ir('#/projeto/' + id, 250);
    if(await p.locator('.op-mais-btn').count()) { await p.click('.op-mais-btn'); await p.waitForTimeout(120); }
    await p.click('[data-excluir]'); await p.waitForTimeout(200);
    const a = await ativo(p);
    check(a && a.dentroModal && a.txt === 'Cancelar', 'B7: em "Excluir projeto" o foco inicial deveria ser Cancelar (veio ' + JSON.stringify(a) + ')');
    await p.keyboard.press('Escape');
  },
  async 'base B8: aviso compatível, com Desfazer, erro persistente e região viva desde o início'({ p, ir, check }){
    check(await p.evaluate(() => { const t = document.querySelector('.toast'); return !!t && t.getAttribute('role') === 'status' && t.getAttribute('aria-live') === 'polite'; }), 'B8: região de aviso deveria existir desde o carregamento');
    await p.evaluate(() => GP.toast('x'));
    check(await p.locator('.toast.on').first().textContent() === 'x', 'B8: GP.toast("x") deveria funcionar como antes');
    await p.evaluate(() => { window.__desfez = 0; GP.toast('Projeto excluído.', { acao:'Desfazer', onAcao:() => { window.__desfez++; } }); });
    await p.click('.toast .toast-act'); await p.waitForTimeout(80);
    check(await p.evaluate(() => window.__desfez) === 1, 'B8: botão Desfazer deveria chamar a função');
    await p.evaluate(() => GP.toast('Falhou ao salvar.', { tipo:'erro' })); await p.waitForTimeout(4400);
    check(await p.locator('.toast-erro.on').count() === 1 && await p.getAttribute('.toast-erro', 'role') === 'alert', 'B8: erro deveria ficar até ser fechado (role=alert)');
    await p.click('.toast-erro .toast-x'); await p.waitForTimeout(80);
    check(await p.locator('.toast-erro.on').count() === 0, 'B8: botão Fechar do erro');
    await p.evaluate(() => GP.toast('rápido', { ms:200 })); await p.waitForTimeout(450);
    check(await p.locator('.toast.on:not(.toast-erro)').count() === 0, 'B8: duração configurável (ms)');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/painel', 200);
    await p.click('.topbar [data-menu]'); await p.waitForTimeout(300); await p.evaluate(() => GP.toast('Aviso com a gaveta aberta')); await p.waitForTimeout(100);
    check(await p.evaluate(() => +getComputedStyle(document.querySelector('.toast')).zIndex < +getComputedStyle(document.querySelector('.side')).zIndex), 'B8: aviso não deveria cobrir a gaveta');
    await p.keyboard.press('Escape'); await p.setViewportSize({ width:1440, height:900 });
  },
  async 'base B9: métrica canônica, estado vazio com ícone e dados em tabela'({ p, ir, check }){
    const r = await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = GP.ui.metric({ label:'Fila', valor:'3', sub:'21% do total', icone:'funil', tom:'#c39127', ratio:.21, delta:'+3 em 30 dias' });
      const m = d.querySelector('.metric'); return { ok: !!(m && m.querySelector('.metric-head .metric-icon svg') && m.querySelector('.metric-body .metric-value') && m.querySelector('.metric-sub')), ring: m.querySelector('.ring').getAttribute('aria-hidden'), delta: (m.querySelector('.metric-delta') || {}).textContent }; });
    check(r.ok && r.ring === 'true' && r.delta === '+3 em 30 dias', 'B9: GP.ui.metric com o markup do painel ' + JSON.stringify(r));
    const v = await p.evaluate(() => [GP.ui.vazio('T', 'texto', '<a>x</a>'), GP.ui.vazio('T', 'texto', '', 'funil')]);
    check(/M4 7h16v13H4z/.test(v[0]) && /<a>x<\/a>/.test(v[0]) && /M3 4h18l-7 8v6l-4 2v-8z/.test(v[1]), 'B9: U.vazio com 3 argumentos igual e com ícone de funil no 4º');
    await p.evaluate(() => { document.getElementById('conteudo').insertAdjacentHTML('beforeend', GP.charts.dados('Teste', ['Etapa', { label:'Qtde', align:'r' }], [['Entrada', 2], ['Triagem', 1]])); });
    await p.focus('#conteudo .chart-data summary'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
    check(await p.evaluate(() => { const d = document.querySelector('#conteudo .chart-data'); return d.open && d.querySelectorAll('tbody tr').length === 2 && /Ver dados em tabela/.test(d.querySelector('summary').textContent); }), 'B9: "Ver dados em tabela" abre pelo teclado com as linhas');
  },
  async 'base B10: gráficos legados na nova linguagem e trilhos alinhados'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await ir('#/entrada-resumo', 300);
    check(await p.locator('#conteudo .hb').count() === 0 && await p.locator('#conteudo .percent-row').count() > 0, 'B10: hbar deveria gerar linhas .percent-row');
    if(await p.locator('#conteudo .donut-core .arc').count()){
      check(await p.locator('#conteudo .donut-core .arc[data-tt]').count() === await p.locator('#conteudo .donut-core .arc').count(), 'B10: arcos da rosca com dica');
      await p.locator('#conteudo .donut-core svg').first().scrollIntoViewIfNeeded(); await p.waitForTimeout(100);
      const pt = await p.evaluate(() => { const r = document.querySelector('#conteudo .donut-core svg').getBoundingClientRect(), k = r.width / 188, a = .12; return { x: r.left + (94 + 72 * Math.sin(a)) * k, y: r.top + (94 - 72 * Math.cos(a)) * k }; });
      await p.mouse.move(pt.x - 3, pt.y); await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(100);
      check(await p.locator('.gp-tt').count() === 1, 'B10: dica escura (.gp-tt) ao passar na rosca');
    }
    await p.evaluate(() => { GP.state().ui.abaIndicadores = 'qualidade'; GP.save(); }); await ir('#/indicadores', 300);
    const xs = await p.evaluate(() => [...document.querySelectorAll('#conteudo .percent-bars')].map(b => [...b.querySelectorAll('.percent-row .track')].map(t => Math.round(t.getBoundingClientRect().right))).filter(a => a.length > 1));
    check(xs.length > 0 && xs.every(a => Math.max(...a) - Math.min(...a) <= 1), 'B10: trilhos deveriam terminar no mesmo x ' + JSON.stringify(xs));
  },
  async 'base B11: matriz legível, navegável por teclado e com quadrantes tingidos'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2);
    await p.evaluate(() => { GP.state().ui.rankEscopo = 'todos'; GP.save(); });
    await ir('#/matriz', 300);
    check(await p.locator('svg.mtz rect[fill-opacity=".06"]').count() === 4, 'B11: os 4 quadrantes deveriam ter fundo tingido');
    const lb = await p.evaluate(() => { const box = t => { const g = [...document.querySelectorAll('svg.mtz g[data-ponto]')].find(x => /^PRJ-0(14|08),/.test(x.getAttribute('aria-label')) && x.getAttribute('aria-label').startsWith(t)); const tx = g && g.querySelector('text.mtz-lbl'); return tx ? tx.getBoundingClientRect() : null; };
      const a = box('PRJ-014'), b = box('PRJ-008'); return { a: !!a, b: !!b, sobre: a && b ? !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top) : null }; });
    check(lb.a && lb.b && lb.sobre === false, 'B11: PRJ-014 e PRJ-008 legíveis sem sobreposição ' + JSON.stringify(lb));
    const nPontos = await p.locator('svg.mtz g[data-ponto][tabindex="0"]').count();
    check(nPontos > 0 && await p.locator('svg.mtz g[data-ponto][role="link"]').count() === nPontos, 'B11: bolhas focáveis com role=link');
    await p.focus('svg.mtz g[data-ponto][tabindex="0"] >> nth=0'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    check(/#\/projeto\//.test(p.url()), 'B11: Enter numa bolha deveria abrir a ficha');
    const tt = await p.evaluate(() => GP.charts.matriz([{ x:50, y:42, fte:2, label:'PRJ-1', id:'x', quadrante:'repensar' }], { xMax:100, yMax:100, qx:50, qy:50, quadrantes:['Ganho rápido', 'Estratégico', 'Complementar', 'Repensar'], w:800 }));
    check(/Valor 42 · Esforço 50 · Repensar · 2,0 FTE/.test(tt), 'B11: dica no formato "Valor 42 · Esforço 50 · Repensar · 2,0 FTE"');
    check(await p.evaluate(() => { try { return /<svg/.test(GP.charts.matriz([{ x:1, y:2, r:8, label:'a', color:'#3E6801' }], {})); } catch(e){ return false; } }), 'B11: chamada antiga sem opções novas deveria funcionar');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/matriz', 300);
    const menor = await p.evaluate(() => { const s = document.querySelector('svg.mtz'), k = s.getBoundingClientRect().width / s.viewBox.baseVal.width; return Math.min(...[...s.querySelectorAll('text')].map(t => parseFloat(t.getAttribute('font-size') || getComputedStyle(t).fontSize) * k)); });
    check(menor >= 10.9, 'B11: em 390 nenhum texto da matriz abaixo de 11px (menor ' + menor.toFixed(1) + ')');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'base B12: alvos de toque de 44px no celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2);
    await p.setViewportSize({ width:360, height:740 });
    for(const r of ['#/painel', '#/indicadores']){ await ir(r, 300);
      const peq = await p.evaluate(() => [...document.querySelectorAll('#app button, #app a[href], #app input:not([type=hidden]), #app select, #app summary, #app [role=button]')].filter(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
        if(r.width === 0 || r.height === 0 || r.bottom <= 0 || cs.visibility === 'hidden' || e.closest('.side:not(.open)')) return false;
        const th = e.closest('thead'); if(th && th.getBoundingClientRect().height <= 1) return false;
        if(e.closest('p, li, small') && e.tagName === 'A') return false; return r.height < 43.5; }).map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height) + ':' + (e.textContent || '').trim().slice(0, 20)));
      check(peq.length === 0, `B12: ${r} em 360px com ${peq.length} alvo(s) abaixo de 44px: ${peq.slice(0, 6).join(' | ')}`);
      check(await p.evaluate(() => document.documentElement.scrollWidth) <= 362, `B12: ${r} com rolagem horizontal em 360px`); }
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'base B13: estado ativo também por aria-current'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1);
    await ir('#/acervo', 200);
    check(await p.getAttribute('.side .nav-item.on', 'aria-current') === 'page' && await p.getAttribute('.dock .dock-item.on', 'aria-current') === 'page', 'B13: menu e dock com aria-current=page');
    await ir('#/funil?aba=quadro', 200);
    check(await p.locator('#conteudo [role=tab], #conteudo [role=tablist]').count() === 0 && await p.getAttribute('#conteudo .tab.on', 'aria-current') === 'page', 'B13: abas de rota como navegação com aria-current');
  },
  async 'base B14: preferências do sistema e linhas de leitura'({ p, ir, check }){
    await p.setViewportSize({ width:1920, height:1080 }); await ir('#/governanca', 250);
    const largos = await p.evaluate(() => [...document.querySelectorAll('#conteudo p')].filter(e => e.textContent.length > 120).map(e => { const s = document.createElement('span'); s.style.cssText = 'font:inherit;white-space:nowrap'; s.textContent = '0'.repeat(76); e.appendChild(s); const lim = s.getBoundingClientRect().width; s.remove(); return e.getBoundingClientRect().width - lim; }).filter(d => d > 2));
    check(largos.length === 0, 'B14: parágrafos da governança em 1920 com no máximo ~75 caracteres por linha (' + largos.length + ' acima)');
    try { await p.emulateMedia({ contrast:'more' }); await ir('#/painel', 200);
      check(await p.evaluate(() => getComputedStyle(document.querySelector('.card, .metric')).backgroundColor) === 'rgb(255, 255, 255)', 'B14: com contraste alto os cartões ficam opacos');
      await p.emulateMedia({ contrast:'no-preference' }); } catch(e){ /* versão do navegador sem emulação de contraste */ }
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'base B15: confirmação "Salvo agora"'({ p, ir, check }){
    await ir('#/painel', 200);
    await p.evaluate(() => { GP.state().ui.qaToque = Date.now(); GP.save(); }); await p.waitForTimeout(120);
    check(/Salvo agora/.test(await p.textContent('[data-storage-status]')), 'B15: pílula deveria mostrar "Salvo agora"');
    await p.waitForTimeout(1100);
    check(/Salvo no navegador/.test(await p.textContent('[data-storage-status]')), 'B15: pílula deveria voltar a "Salvo no navegador"');
  },
};
