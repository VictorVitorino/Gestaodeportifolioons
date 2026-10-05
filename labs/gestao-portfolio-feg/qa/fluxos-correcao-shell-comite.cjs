/* Regressão da correção "shell-comite": anel de foco do teclado em todos os focáveis, Tab sem paradas invisíveis no modo
   cartão, foco devolvido depois de "Excluir cadastro", nome acessível dos cabeçalhos ordenáveis, modo comitê com a mesma
   semântica da carteira mês a mês (lâmina, ata, confirmação de impacto, "Seguir o ranking") e mínimos de texto/toque
   do CSS do pacote inovação. Cada fluxo começa com o armazenamento limpo. */
const exemplos = async (p, recarregar, nivel = 3) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.save(); }, nivel); await recarregar(); };
// O teste confere o estilo final do foco (cascata), não a animação: transições desligadas
const semTransicao = p => p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
const ANEL = 'rgb(255, 255, 255) 0px 0px 0px 2px, rgb(62, 104, 1) 0px 0px 0px 4px';
const ANEL_ESCURO = 'rgb(25, 53, 47) 0px 0px 0px 2px, rgb(207, 227, 166) 0px 0px 0px 4px';
/** Estado do elemento focado: anel esperado conforme a superfície (trilho, dock e comitê usam o anel escuro) */
const focado = p => p.evaluate(() => {
  const e = document.activeElement; if(!e || e === document.body) return null;
  const campo = e.matches('select, textarea, input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=button]):not([type=submit]):not([type=reset])');
  return { campo, svg: e instanceof SVGElement, fv: e.matches(':focus-visible'), bs: getComputedStyle(e).boxShadow, escuro: !!e.closest('.shell .side, .dock, .level-tile, .comite'),
    cls: (e.getAttribute('class') || '').trim(), tag: e.tagName, txt: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) };
});
const carteira = p => p.evaluate(() => { const c = GP.modelo.montarCarteira(GP.projetos.todos(), GP.state().capacidade, GP.state().forcar);
  return { efetiva: c.efetiva, livre: c.livre, itens: c.itens.map(i => ({ id: i.p.id, cod: i.p.codigo, status: i.status, aPartir: i.aPartir, obr: !!i.p.obrigatorio, acum: i.acumFte })) }; });
const abrirComite = async p => { await p.click('#conteudo [data-comite]'); await p.waitForTimeout(250); };
const irLamina = async (p, k) => { await p.keyboard.press('Home'); await p.waitForTimeout(60); for(let i = 0; i < k; i++){ await p.keyboard.press('ArrowRight'); await p.waitForTimeout(60); } };
const lamina = p => p.evaluate(() => { const c = document.querySelector('.comite-cap'); return { cod: (document.querySelector('.comite-cod .code') || {}).textContent || '', cls: c ? c.className : '', nome: c ? c.querySelector('b').textContent.trim() : '', txt: c ? c.querySelector('small').textContent : '' }; });

module.exports = {
  async 'correção shell: anel de foco visível em todo focável pelo Tab (vence as sombras dos componentes)'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await p.setViewportSize({ width:1440, height:900 });
    const vistos = new Set(), sem = [];
    // os grupos recolhíveis do menu (4) e o botão ⋯ de cada linha do acervo acrescentam paradas de Tab
    for(const [rota, n] of [['#/acervo', 70], ['#/painel', 60], ['#/ranking', 70], ['#/carteira', 50]]){
      await ir(rota, 250); await recarregar(300); await semTransicao(p);
      for(let i = 0; i < n; i++){
        await p.keyboard.press('Tab');
        const a = await focado(p); if(!a || a.svg || a.campo) continue;
        a.cls.split(/\s+/).forEach(c => vistos.add(c)); if(a.tag === 'A') vistos.add('<a>');
        const esperado = a.escuro ? ANEL_ESCURO : ANEL;
        if(!a.fv || a.bs !== esperado) sem.push(`${rota} ${a.tag}.${a.cls} "${a.txt}" → ${a.bs}`);
      }
    }
    check(!sem.length, `todo focável pelo teclado deveria mostrar o anel (--focus/--focus-dark); sem anel: ${sem.slice(0, 6).join(' | ')}`);
    for(const c of ['btn-ghost', 'btn-primary', 'icon-btn', 'nav-item', 'cmdk-pill', 'gx-step', 'pd-card', '<a>'])
      check(vistos.has(c), `o percurso de Tab deveria passar por .${c} (cobertura do teste)`);
    // estados ativos que tinham sombra própria: item ativo do trilho (anel escuro), chip ativo e nível ativo
    await ir('#/acervo', 250); await semTransicao(p);
    for(const [sel, anel] of [['.side .nav-item.on', ANEL_ESCURO], ['#conteudo .chip.on', ANEL], ['.topbar .seg button.on', ANEL], ['.topbar .cmdk-pill', ANEL], ['[data-ajuda-nivel]', ANEL]]){
      await p.keyboard.press('Shift'); await p.focus(sel);
      const a = await focado(p);
      check(a && a.fv && a.bs === anel, `${sel} focado pelo teclado deveria mostrar o anel (veio ${a && a.bs})`);
    }
    // dock do celular: anel escuro
    await p.setViewportSize({ width:390, height:844 }); await ir('#/painel', 250); await semTransicao(p);
    await p.keyboard.press('Shift'); await p.focus('.dock .dock-busca');
    const d = await focado(p);
    check(d && d.fv && d.bs === ANEL_ESCURO, 'botão do dock deveria mostrar o anel escuro (veio ' + (d && d.bs) + ')');
    await p.setViewportSize({ width:1440, height:900 });
    // modo comitê (superfície escura): botões de decisão e navegação com o anel escuro
    await ir('#/carteira', 250); await abrirComite(p); await semTransicao(p);
    const semC = [];
    for(let i = 0; i < 8; i++){ await p.keyboard.press('Tab'); const a = await focado(p); if(a && !a.campo && (!a.fv || a.bs !== ANEL_ESCURO)) semC.push(`${a.cls} "${a.txt}" → ${a.bs}`); }
    check(!semC.length, 'no modo comitê todo botão focado deveria mostrar o anel escuro: ' + semC.slice(0, 4).join(' | '));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  },
  async 'correção shell: no modo cartão o Tab não para nos botões de ordenação escondidos'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await p.setViewportSize({ width:390, height:844 });
    for(const rota of ['#/acervo', '#/avaliar']){
      await ir(rota, 250); await recarregar(300);
      const inv = [];
      for(let i = 0; i < 45; i++){ await p.keyboard.press('Tab');
        const a = await p.evaluate(() => { const e = document.activeElement; if(!e || e === document.body) return null; const r = e.getBoundingClientRect();
          let x = e, clip = false; while(x && x !== document.body){ const cs = getComputedStyle(x); if(cs.clipPath === 'inset(50%)' || cs.clip === 'rect(0px, 0px, 0px, 0px)') clip = true; x = x.parentElement; }
          return { inv: clip || r.width <= 1 || r.height <= 1, d: e.tagName + '.' + e.className + ' ' + e.textContent.trim().slice(0, 20) }; });
        if(a && a.inv) inv.push(a.d); }
      check(!inv.length, `${rota} em 390px: Tab parou em elemento invisível ${inv.length} vez(es): ${inv.slice(0, 4).join(' | ')}`);
      check(await p.locator('#conteudo [data-sort-select]').first().isVisible(), `${rota}: a ordenação no modo cartão deveria seguir no seletor "Ordenar por"`);
    }
    // de volta à tabela: os cabeçalhos ordenáveis voltam a entrar no Tab
    await p.setViewportSize({ width:1440, height:900 }); await p.waitForTimeout(250); await ir('#/acervo', 250);
    await p.keyboard.press('Tab');
    check(await p.evaluate(() => { const b = [...document.querySelectorAll('#conteudo thead .th-sort')]; return b.length > 0 && b.every(x => x.getAttribute('tabindex') === '0'); }), 'em 1440 os cabeçalhos ordenáveis deveriam voltar a ter tabindex=0');
    await p.focus('#conteudo th[data-sort="acervo|titulo"] .th-sort'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    check(await p.getAttribute('th[data-sort="acervo|titulo"]', 'aria-sort') === 'ascending', 'Enter no cabeçalho ainda deveria ordenar');
  },
  async 'correção shell: Esc ou Cancelar em "Excluir cadastro" devolvem o foco ao botão "Mais ações"'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await p.setViewportSize({ width:1366, height:768 });
    const id = await p.evaluate(() => GP.projetos.todos()[0].id);
    for(const modo of ['Esc', 'Enter em Cancelar', 'clique em Cancelar']){
      await ir('#/projeto/' + id, 300);
      await p.focus('.op-mais-btn'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
      check(await p.evaluate(() => /Excluir cadastro/.test(document.activeElement.textContent)), `${modo}: Enter em "Mais ações" deveria focar "Excluir cadastro"`);
      await p.keyboard.press('Enter'); await p.waitForTimeout(200);
      check(await p.evaluate(() => !!document.querySelector('.modal-bg') && document.activeElement.textContent.trim() === 'Cancelar'), `${modo}: o modal deveria abrir com o foco em Cancelar`);
      if(modo === 'Esc') await p.keyboard.press('Escape'); else if(modo === 'Enter em Cancelar') await p.keyboard.press('Enter'); else await p.click('.modal-bg .m-act [data-close]');
      await p.waitForTimeout(200);
      const f = await p.evaluate(() => ({ tag: document.activeElement.tagName, menu: document.activeElement.matches('.op-mais-btn'), modal: !!document.querySelector('.modal-bg') }));
      check(!f.modal && f.menu, `${modo}: o foco deveria voltar a "Mais ações" (veio ${f.tag})`);
    }
    check(await p.evaluate(i => !!GP.projetos.get(i), id), 'cancelar não deveria excluir o projeto');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'correção shell: nome acessível dos cabeçalhos ordenáveis sem a seta'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await ir('#/acervo', 300);
    const nomes = async () => { const c = await p.context().newCDPSession(p); const { nodes } = await c.send('Accessibility.getFullAXTree'); await c.detach();
      return nodes.filter(n => !n.ignored && n.role && ['button', 'columnheader'].includes(n.role.value) && n.name && /^(projeto|etapa|responsável|valor)/i.test(n.name.value)).map(n => n.name.value); };
    let n = await nomes();
    check(n.length >= 3 && n.every(x => !/[↕↑↓]/.test(x)), 'cabeçalhos não deveriam ter seta no nome acessível: ' + n.join(', '));
    await p.click('#conteudo th[data-sort="acervo|titulo"] .th-sort'); await p.waitForTimeout(200);
    n = await nomes();
    check(n.length >= 3 && n.every(x => !/[↕↑↓]/.test(x)) && await p.getAttribute('th[data-sort="acervo|titulo"]', 'aria-sort') === 'ascending', 'depois de ordenar, o estado vem só de aria-sort: ' + n.join(', '));
    check(await p.evaluate(() => getComputedStyle(document.querySelector('th[data-sort="acervo|titulo"] .th-sort'), '::after').content.startsWith('"↑"')), 'a seta continua visível');
  },
  async 'correção comitê: lâmina com a mesma base da carteira e status mês a mês (cabe a partir de, obrigatório deslocado)'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await ir('#/carteira', 300);
    const c = await carteira(p), ef = c.efetiva.toFixed(1).replace('.', ',');
    await abrirComite(p);
    const ids = await p.evaluate(() => [...Array(document.querySelectorAll('.comite-pontos i').length - 1).keys()]);
    for(const k of ids){
      await irLamina(p, k); const l = await lamina(p), it = c.itens.find(x => x.cod === l.cod);
      if(!it) continue;
      if(it.status === 'cabe' || it.status === 'fixado'){
        const m = l.txt.match(/(\d+,\d) de (\d+,\d) FTE efetivos/);
        check(!!m && m[2] === ef && +m[1].replace(',', '.') <= c.efetiva + 1e-9, `${l.cod} "Cabe" deveria comparar com a capacidade efetiva (${ef}) sem passar dela: ${l.txt}`);
        check(/cap-ok/.test(l.cls), `${l.cod} cabe: tom ok`);
      }
      if(it.status === 'cabe_a_partir'){
        const mes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][+it.aPartir.slice(5) - 1] + '/' + it.aPartir.slice(0, 4);
        check(/cap-warn/.test(l.cls) && l.nome.includes('Cabe a partir de ' + mes) && /[Ff]altam \d+,\d FTE em/.test(l.txt), `${l.cod} cabe mais tarde: aviso com o mês e quanto falta (${l.cls} · ${l.nome} · ${l.txt})`);
      }
      check(!/de 7,0 FTE|Acumulado da carteira até aqui/.test(l.txt) || c.livre === c.efetiva, `${l.cod}: lâmina não deveria misturar bases (${l.txt})`);
    }
    check(c.itens.some(i => i.status === 'cabe_a_partir'), 'os exemplos deveriam ter um projeto "cabe a partir de" (pré-condição)');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    // obrigatório deslocado pelas fixações: tom de alerta e texto explícito
    const desloc = await p.evaluate(() => { const S = GP.state(), M = GP.modelo; GP.projetos.todos().filter(x => x.etapa === 'aprovado' && !x.obrigatorio).forEach(x => { S.forcar[x.id] = 'in'; }); GP.save();
      const c = M.montarCarteira(GP.projetos.todos(), S.capacidade, S.forcar); const d = c.itens.find(i => i.status === 'obrigatorio_deslocado'); return d ? d.p.codigo : ''; });
    check(!!desloc, 'fixar todos os não obrigatórios deveria deslocar o obrigatório (pré-condição)');
    await ir('#/carteira', 300); await abrirComite(p);
    for(const k of ids){ await irLamina(p, k); const l = await lamina(p); if(l.cod !== desloc) continue;
      check(/cap-bad/.test(l.cls) && /Obrigatório fora pelas fixações/.test(l.nome) && /Revise as decisões/.test(l.txt), `obrigatório deslocado deveria aparecer em alerta: ${l.cls} · ${l.nome} · ${l.txt}`); }
    const ata = await p.evaluate(() => GP.comite.ata());
    check(new RegExp(`ATENÇÃO: .*obrigatório.*${desloc}`).test(ata), 'ata deveria alertar o obrigatório fora da carteira');
    const sec3 = ata.split('3. Aguardam capacidade')[1] || '';
    check(new RegExp(`${desloc} .*decisão necessária.*\\[OBRIGATÓRIO\\]`).test(sec3), 'ata deveria listar o obrigatório deslocado em "Aguardam capacidade", destacado: ' + sec3.slice(0, 200));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  },
  async 'correção comitê: ata lista quem aguarda capacidade e "Aprovar início" confirma o impacto como na carteira'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await ir('#/carteira', 300);
    const c0 = await carteira(p), mais = c0.itens.find(i => i.status === 'cabe_a_partir');
    check(!!mais, 'pré-condição: um projeto "cabe a partir de"');
    await abrirComite(p);
    let ata = await p.evaluate(() => GP.comite.ata()), sec3 = ata.split('3. Aguardam capacidade')[1] || '';
    check(sec3.includes(mais.cod) && /cabe a partir de \w{3}\/\d{4}/.test(sec3) && !/- nenhum/.test(sec3.split('\n\n')[0]), 'ata sem decisões deveria listar o "cabe a partir de" em Aguardam capacidade: ' + sec3.slice(0, 160));
    // Aprovar início que tira projetos da carteira: confirmação dentro do modo comitê
    const k = c0.itens.findIndex(i => i.id === mais.id); await irLamina(p, k);
    await p.click('.comite [data-decidir="in"]'); await p.waitForTimeout(200);
    const conf = await p.evaluate(() => { const c = document.querySelector('.comite .comite-conf'); return c ? { txt: c.textContent.replace(/\s+/g, ' '), foco: c.contains(document.activeElement), role: c.getAttribute('role') } : null; });
    const c1 = await p.evaluate(i => GP.modelo.montarCarteira(GP.projetos.todos(), GP.state().capacidade, Object.assign({}, GP.state().forcar, { [i]:'in' })), mais.id);
    const saem = await p.evaluate(({ i, antes }) => { const c = GP.modelo.montarCarteira(GP.projetos.todos(), GP.state().capacidade, { [i]:'in' }); return c.itens.filter(x => antes.includes(x.p.id) && ['nao_cabe', 'cabe_a_partir', 'obrigatorio_deslocado'].includes(x.status)).map(x => x.p.codigo); },
      { i: mais.id, antes: c0.itens.filter(x => ['cabe', 'fixado', 'fixado_estoura'].includes(x.status)).map(x => x.id) });
    check(c1 && saem.length > 0, 'pré-condição: aprovar o projeto deveria tirar alguém da carteira');
    check(!!conf && conf.role === 'alertdialog' && conf.foco && saem.every(s => conf.txt.includes(s + ' sai da carteira')), 'Aprovar início deveria pedir confirmação listando quem sai: ' + JSON.stringify(conf));
    check(await p.evaluate(i => !GP.state().forcar[i], mais.id), 'antes de confirmar, nada deveria mudar na carteira');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.comite.aberto() && !document.querySelector('.comite-conf')), 'Esc deveria cancelar só a confirmação, sem sair do modo comitê');
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('.comite [data-decidir="in"]')), 'depois de cancelar o foco deveria voltar a "Aprovar início"');
    await p.click('.comite [data-decidir="in"]'); await p.waitForTimeout(150);
    await p.click('.comite [data-comite-conf-nao]'); await p.waitForTimeout(150);
    check(await p.evaluate(i => !GP.state().forcar[i], mais.id) && /não registrada/.test(await p.textContent('.comite-msg')), 'Cancelar não deveria gravar a decisão');
    await p.click('.comite [data-decidir="in"]'); await p.waitForTimeout(150);
    await p.click('.comite [data-comite-conf-ok]'); await p.waitForTimeout(200);
    check(await p.evaluate(i => GP.state().forcar[i] === 'in', mais.id), '"Aprovar mesmo assim" deveria gravar S.forcar = in');
    const msg = await p.textContent('.comite-msg');
    check(saem.every(s => msg.includes(s)), 'a mensagem deveria dizer quem saiu da carteira: ' + msg);
    check(await p.evaluate(i => /saem da carteira/.test(GP.projetos.get(i).historico.slice(-1)[0].detalhe), mais.id), 'o histórico deveria registrar quem saiu');
    ata = await p.evaluate(() => GP.comite.ata()); sec3 = ata.split('3. Aguardam capacidade')[1] || '';
    check(saem.every(s => sec3.includes(s)), 'depois da decisão, quem saiu deveria aparecer em "Aguardam capacidade": ' + sec3.slice(0, 200));
    check(new RegExp(`${mais.cod} .*Aprovar início.*tirou da carteira: ${saem.join(', ')}`).test(ata), 'a decisão na ata deveria registrar o impacto');
    // decisão sem impacto não pede confirmação
    await irLamina(p, c0.itens.findIndex(i => i.status === 'cabe' && !saem.includes(i.cod)));
    await p.click('.comite [data-decidir="out"]'); await p.waitForTimeout(150);
    check(await p.locator('.comite .comite-conf').count() === 0, '"Não priorizar" não pede confirmação (mesma regra da carteira)');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  },
  async 'correção comitê: "Seguir o ranking" no lugar de "Aguardar", coerente com a ata'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await ir('#/carteira', 300); await abrirComite(p);
    const b = await p.textContent('.comite [data-decidir=""]');
    check(/Seguir o ranking/.test(b) && !/Aguardar/.test(b), 'o botão automático deveria se chamar "Seguir o ranking": ' + b);
    const cod = (await p.textContent('.comite-cod .code')).trim();
    await p.click('.comite [data-decidir=""]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => document.querySelector('.comite [data-decidir=""]').getAttribute('aria-pressed')) === 'true', 'a decisão deveria ficar marcada');
    const ata = await p.evaluate(() => GP.comite.ata());
    const linha = ata.split('\n').find(l => l.includes(cod) && /Seguir o ranking/.test(l)) || '';
    check(!/Aguardar/.test(ata) && /situação após as decisões: Cabe/.test(linha), 'a ata deveria mostrar o efeito real da decisão automática: ' + linha);
    await p.keyboard.press('End'); await p.waitForTimeout(120);
    check(/Seguir o ranking/.test(await p.textContent('.comite-res-kpis')) && !/Aguardar/.test(await p.textContent('.comite-res-kpis')), 'resumo deveria contar "Seguir o ranking"');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  },
  async 'correção inovação (transversal): textos ≥11px e alvos ≥44px no celular na paleta, cadastro rápido e comitê'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    const pequenos = sel => p.evaluate(s => [...document.querySelectorAll(s + ' *')].filter(e => { if(!e.offsetParent && getComputedStyle(e).position !== 'fixed') return false;
      const t = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); return t && parseFloat(getComputedStyle(e).fontSize) < 11; }).map(e => e.className + ':' + getComputedStyle(e).fontSize + ':' + e.textContent.trim().slice(0, 20)), sel);
    const alvos = sel => p.evaluate(s => [...document.querySelectorAll(`${s} button, ${s} a[href], ${s} input, ${s} select, ${s} textarea`)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && (e.type !== 'radio' && e.type !== 'checkbox'); })
      .filter(e => { const r = e.getBoundingClientRect(); return r.height < 44 - 0.5 || r.width < 44 - 0.5; }).map(e => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`), sel);
    await ir('#/ranking', 250);
    await p.keyboard.press('Control+k'); await p.waitForTimeout(150); await p.keyboard.type('PRJ'); await p.waitForTimeout(100);
    check(!(await pequenos('.cmdk')).length, 'paleta: texto abaixo de 11px: ' + (await pequenos('.cmdk')).join(' | '));
    await p.keyboard.press('Escape');
    await ir('#/carteira', 250); await abrirComite(p);
    check(!(await pequenos('.comite')).length, 'comitê: texto abaixo de 11px: ' + (await pequenos('.comite')).join(' | '));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    await p.setViewportSize({ width:360, height:740 });
    await ir('#/carteira', 250); await abrirComite(p);
    check(!(await alvos('.comite')).length, 'comitê no celular: alvo abaixo de 44px: ' + (await alvos('.comite')).join(' | '));
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    await p.click('.dock .dock-busca'); await p.waitForTimeout(150);
    check(!(await alvos('.cmdk-campo')).length, 'paleta no celular: alvo abaixo de 44px: ' + (await alvos('.cmdk-campo')).join(' | '));
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    await p.evaluate(() => GP.cadastroRapido()); await p.waitForTimeout(200);
    const r = (await alvos('.modal.rapido .m-act')).concat(await alvos('.modal.rapido .rapido-rasc'));
    check(!r.length, 'cadastro rápido no celular: alvo abaixo de 44px: ' + r.join(' | '));
    await p.keyboard.press('Escape');
    await p.setViewportSize({ width:1440, height:900 });
  },
};
