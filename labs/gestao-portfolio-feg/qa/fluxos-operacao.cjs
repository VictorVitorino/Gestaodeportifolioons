/* Fluxos do pacote Operação (acervo, cadastro, ficha, funil, checklist e entrada). Cada fluxo começa com o armazenamento limpo. */
const exemplos = async (p, recarregar) => { await p.evaluate(() => GP.modelo.carregarExemplos()); await recarregar(); };
const vp = (p, w, h) => p.setViewportSize({ width:w, height:h });
const novo = (p, dados = {}) => p.evaluate(d => GP.projetos.criar(Object.assign({ titulo:'Projeto operação QA', descricao:'Descrição', gerencia:'FEN', demandante:'Área QA', tipo:'Projeto' }, d)).projeto.id, dados);

module.exports = {
  async 'op-O1: acervo compacto, sem coluna Código e com responsável em 1024'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/acervo', 250);
    const r = await p.evaluate(() => { const trs = [...document.querySelectorAll('.tbl tbody tr')]; const hs = trs.map(t => t.getBoundingClientRect().height);
      return { min:Math.min(...hs), max:Math.max(...hs), vis:trs.filter(t => t.getBoundingClientRect().bottom <= innerHeight).length, th:[...document.querySelectorAll('.tbl th')].filter(t => t.offsetParent).map(t => t.textContent.trim()) }; });
    check(r.min >= 56 && r.max <= 80, `linhas do acervo em 1440 deveriam ter ~60–76px (min ${r.min}, max ${r.max})`);
    check(r.vis >= 9, `deveria haver pelo menos 9 linhas visíveis em 1440x900 (veio ${r.vis})`);
    check(!r.th.some(t => /^Código/i.test(t)), 'coluna Código deveria ter sido incorporada à coluna Projeto');
    for(const w of [1280, 1024]){
      await vp(p, w, 800); await ir('#/acervo', 200);
      const q = await p.evaluate(() => { const wr = document.querySelector('.tbl-wrap'), cards = getComputedStyle(document.querySelector('.tbl tbody tr')).display === 'grid';
        const resp = [...document.querySelectorAll('td[data-label="Responsável"]')][0];
        return { scroll: wr.scrollWidth > wr.clientWidth + 1, cards, resp: !!(resp && resp.offsetParent), fim: /até|sem prazo|\d{2}\/\d{2}\/\d{4}/.test(resp ? resp.textContent : ''), max: Math.max(...[...document.querySelectorAll('.tbl tbody tr')].map(t => t.getBoundingClientRect().height)),
          linhas: Math.max(...[...document.querySelectorAll('.op-tit')].map(t => Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)))) }; });
      check(!q.scroll, `tabela do acervo não deveria rolar na horizontal em ${w}px`);
      check(q.cards || (q.resp && q.fim), `responsável e fim previsto deveriam estar visíveis em ${w}px`);
      check(q.max <= 110 && q.linhas <= 2, `em ${w}px nenhuma linha passa de 110px nem título de 2 linhas (max ${q.max}, linhas ${q.linhas})`);
    }
    await vp(p, 1440, 900);
  },
  async 'op-O2: quadro com fluxo de 5 colunas, saídas abaixo e dias na etapa'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/funil?aba=quadro', 250);
    const r = await p.evaluate(() => { const f = document.querySelector('.op-fluxo'); const nomes = [...f.querySelectorAll('.op-col-nome')];
      const um = [...f.children].find(c => c.querySelectorAll('.kcard').length === 1);
      return { cols:f.children.length, scroll:f.scrollWidth > f.clientWidth + 1, saidas:[...document.querySelectorAll('.op-saida')].map(s => s.textContent.replace(/\s+/g, ' ').trim()),
        cortado: nomes.some(n => n.scrollWidth > n.clientWidth + 1), altUm: um ? um.getBoundingClientRect().height : 0, dias: [...document.querySelectorAll('.kcard')].some(k => /\d+ dias? na etapa/.test(k.textContent)) }; });
    check(r.cols === 5 && !r.scroll, 'fluxo do quadro deveria ter 5 colunas sem rolagem em 1440');
    check(r.saidas.length === 3 && /Em espera/.test(r.saidas[0]) && /Não entra/.test(r.saidas[1]) && /Cancelado/.test(r.saidas[2]), 'saídas deveriam aparecer abaixo em 3 grupos');
    check(!r.cortado, '"Admitido · aguardando" deveria caber em uma linha no cabeçalho');
    check(r.altUm > 0 && r.altUm < 400, `coluna com 1 cartão não deveria esticar (${Math.round(r.altUm)}px)`);
    check(r.dias, 'cartões deveriam mostrar "X dias na etapa"');
    check(!/(^|\s)-(\s|$)/.test(await p.textContent('.op-quadro')), 'quadro não deveria mostrar "-" solto');
    await vp(p, 390, 844); await ir('#/funil?aba=quadro', 250);
    const m = await p.evaluate(() => { const f = document.querySelector('.op-fluxo'); return { snap:getComputedStyle(f).scrollSnapType, ind:!!document.querySelector('.op-fluxo-ind').offsetParent }; });
    check(/x/.test(m.snap) && m.ind, 'no celular as colunas deveriam encaixar (scroll-snap) e mostrar o indicador n/5');
    await vp(p, 1440, 900);
  },
  async 'op-O3/O15: checklist com veredito, cores das respostas, sugestões e parecidos'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    const id = await novo(p, { titulo:'Automação dos testes de regressão hidrológicos', beneficio:'' });
    await ir('#/funil', 200); await p.click(`[data-entrada="${id}"]`); await p.waitForTimeout(200);
    check(await p.locator('.modal .op-qgrupo').count() === 2, 'perguntas deveriam vir em 2 grupos com cabeçalho');
    check(await p.locator('.modal [data-qrow="E4"].is-sug [data-v="nao"].on').count() === 1 && /sugerido pelo cadastro/.test(await p.textContent('.modal [data-qrow="E4"]')), 'E4 deveria vir marcada "Não" com o selo de sugestão');
    check(await p.locator('.modal .op-q-parecidos a').count() >= 1, 'E3 deveria listar títulos parecidos do acervo');
    const cls = async () => p.evaluate(() => { const v = document.querySelector('.modal .op-veredito'); return [v.className, v.querySelector('svg').innerHTML]; });
    const aguardando = await cls();
    check(/t-neutral/.test(aguardando[0]) && /de 6 respondidas/.test(await p.textContent('.modal [data-resultado]')), 'veredito incompleto deveria ser neutro com "x de 6 respondidas"');
    await p.click('.modal [data-q="E1"][data-v="nao"]');
    const nao = await cls();
    check(await p.$eval('.modal [data-q="E1"][data-v="nao"]', b => getComputedStyle(b).backgroundColor) === 'rgb(171, 87, 40)', '"Não" na pergunta 1 deveria ficar cobre');
    for(const q of ['E1', 'E2', 'E3']) await p.click(`.modal [data-q="${q}"][data-v="sim"]`);
    const falta = await cls();
    check(/t-bad/.test(nao[0]) && /t-warn/.test(falta[0]) && nao[1] !== falta[1] && falta[1] !== aguardando[1], 'Não entra, Falta informação e Aguardando deveriam ter cores e ícones diferentes');
    await p.click('.modal [data-q="E4"][data-v="sim"]');
    check(/não tem benefício esperado/.test(await p.textContent('.modal [data-qrow="E4"]')) && await p.locator('.modal [data-qrow="E4"] .op-q-aviso a').count() === 1, 'marcar "Sim" sem benefício deveria mostrar o aviso com link');
    await vp(p, 1366, 768); await p.waitForTimeout(150);
    const vis = await p.evaluate(() => { const b = document.querySelector('.modal [data-registrar]').getBoundingClientRect(), v = document.querySelector('.modal [data-vered-mini]').getBoundingClientRect(); return b.bottom <= innerHeight && v.bottom <= innerHeight && v.width > 0; });
    check(vis, 'em 1366x768 o veredito e o botão Registrar deveriam ficar visíveis no rodapé');
    await vp(p, 390, 844); await p.waitForTimeout(150);
    check(await p.$eval('.modal .op-seg button', b => b.getBoundingClientRect().height) >= 44, 'no celular Sim/Não deveriam ter 44px de altura');
    await p.keyboard.press('Escape'); await vp(p, 1440, 900);
  },
  async 'op-O4: próximo passo, toast com checklist e campos faltantes'({ p, ir, check }){
    await ir('#/novo');
    await p.fill('[name=titulo]', 'Projeto próximo passo QA'); await p.fill('[name=descricao]', 'd'); await p.selectOption('[name=gerencia]', 'FEN');
    await p.fill('[name=demandante]', 'Área'); await p.selectOption('[name=tipo]', 'Projeto');
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(300);
    const b = await p.$eval('.op-proximo [data-entrada]', e => ({ top:e.getBoundingClientRect().bottom <= innerHeight, prim:e.classList.contains('btn-primary') })).catch(() => ({}));
    check(b.top && b.prim && /Próximo passo/i.test(await p.textContent('.op-proximo')), 'ficha nova deveria ter a faixa Próximo passo com o checklist acima da dobra');
    check(await p.locator('.op-stepper li.atual[aria-current="step"]').count() === 1 && /Nova demanda/.test(await p.textContent('.op-stepper li.atual')), 'stepper deveria realçar a etapa atual');
    check(await p.locator('.toast .toast-act, .toast [data-op-acao]').count() === 1, 'toast do cadastro deveria oferecer "Fazer o checklist agora"');
    await p.locator('.toast .toast-act, .toast [data-op-acao]').first().click(); await p.waitForTimeout(200);
    check(await p.locator('.modal.op-entrada').count() === 1, 'ação do toast deveria abrir o checklist');
    for(const q of ['E1','E2','E3','E4','E6']) await p.click(`.modal [data-q="${q}"][data-v="sim"]`);
    await p.click('.modal [data-q="E5"][data-v="nao"]'); await p.click('.modal [data-registrar]'); await p.waitForTimeout(250);
    const links = await p.$$eval('.op-faltam a', as => as.map(a => a.textContent.trim()));
    check(links.includes('Patrocinador'), 'ficha em triagem deveria listar os campos faltantes como links: ' + links.join(','));
    await p.click('.op-faltam a:has-text("Patrocinador")'); await p.waitForTimeout(300);
    check(/#\/novo\/.+\?campo=patrocinador/.test(p.url()) && await p.evaluate(() => document.activeElement && document.activeElement.name) === 'patrocinador', 'link do campo deveria abrir o formulário com foco em Patrocinador');
    await vp(p, 390, 844); const id = await p.evaluate(() => GP.projetos.criar({ titulo:'Projeto celular QA', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto' }).projeto.id);
    await ir('#/projeto/' + id, 250);
    check(await p.$eval('.op-proximo [data-entrada]', e => e.getBoundingClientRect().bottom <= innerHeight - 70), 'em 390 o botão do checklist deveria estar acima da dobra');
    await vp(p, 1440, 900);
  },
  async 'op-O5: formulário com rótulos, erros acessíveis e resumo'({ p, ir, check }){
    for(const w of [1440, 390]){
      await vp(p, w, 900); await ir('#/novo', 200);
      const a = await p.evaluate(() => { const top = k => Math.round(document.querySelector(`[name=${k}]`).getBoundingClientRect().top);
        const l = document.querySelector('[data-campo="titulo"] .lbl'), r = l.querySelector('.req');
        return { req: Math.abs(r.getBoundingClientRect().top - l.getBoundingClientRect().top) < 8, to: Math.abs(top('tipo') - top('origem')), ga: Math.abs(top('gerencia') - top('area')) }; });
      check(a.req, `asterisco deveria ficar na linha do rótulo (${w})`);
      check(w < 641 || (a.to <= 2 && a.ga <= 2), `Tipo/Origem e Gerência/Área deveriam alinhar (${w}): ${a.to}, ${a.ga}`);
    }
    await vp(p, 1440, 900); await ir('#/novo', 200);
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(450);
    const e = await p.evaluate(() => { const bad = 'rgb(171, 87, 40)', c = n => getComputedStyle(document.querySelector(`[name=${n}]`)).borderTopColor, a = document.activeElement;
      return { tipo:c('tipo') === bad, ger:c('gerencia') === bad, foco:a.name, focoBorda:getComputedStyle(a).borderTopColor === bad, inv:a.getAttribute('aria-invalid'), req:a.required, desc:a.getAttribute('aria-describedby'),
        lbl:a.labels && a.labels[0] && a.labels[0].textContent.replace('*', '').trim(), links:document.querySelectorAll('[role=alert] [data-ir-campo]').length, resumo:(document.querySelector('[role=alert]') || {}).textContent || '' }; });
    check(e.tipo && e.ger, 'Tipo e Gerência deveriam ganhar borda cobre');
    check(e.foco === 'titulo' && e.focoBorda, 'Título focado deveria manter a borda cobre');
    check(e.inv === 'true' && e.req && e.lbl === 'Título' && /f-titulo-err/.test(e.desc || ''), 'Título deveria ser anunciado como obrigatório e inválido, com o erro ligado');
    check(e.links === 5 && /Faltam 5 campos obrigatórios/.test(e.resumo), 'resumo no topo deveria listar os 5 campos com links');
    await p.click('[role=alert] [data-ir-campo="gerencia"]'); await p.waitForTimeout(100);
    check(await p.evaluate(() => document.activeElement.name) === 'gerencia', 'link do resumo deveria focar o campo');
  },
  async 'op-O6: mudar etapa com erro inline, realce, aviso de checklist e desfazer'({ p, ir, check }){
    const id = await novo(p);
    await ir('#/projeto/' + id); await p.click('[data-etapa]'); await p.waitForTimeout(150);
    check(/Seguir no fluxo/.test(await p.textContent('.modal')) && /Encerrar ou pausar/.test(await p.textContent('.modal')) && /Próxima etapa sugerida/.test(await p.textContent('.modal')), 'opções deveriam estar agrupadas, com a próxima etapa sugerida');
    await p.check('input[name=et][value=nao_entra]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(150);
    const r = await p.evaluate(() => ({ foco:document.activeElement.name, err:document.querySelector('[data-err-motivo]').textContent, toast:/motivo/i.test((document.querySelector('.toast.on') || {}).textContent || ''),
      borda:getComputedStyle(document.querySelector('input[value=nao_entra]').closest('label')).borderTopColor, tag:document.querySelector('[data-motivo-tag]').textContent }));
    check(r.foco === 'motivo' && /motivo/.test(r.err) && !r.toast, 'erro do motivo deveria aparecer no campo, com foco, sem toast');
    check(r.borda === 'rgb(62, 104, 1)' && /obrigatório para Não entra e Cancelado/.test(r.tag), 'opção marcada deveria ficar realçada e o rótulo dizer quando o motivo é obrigatório');
    await p.check('input[name=et][value=aprovado]'); await p.waitForTimeout(100);
    check(await p.locator('.modal .op-aviso-check [data-fazer-checklist]').count() === 1, 'Nova demanda → Admitido sem checklist deveria mostrar o aviso');
    await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
    check(await p.evaluate(i => GP.projetos.get(i).etapa, id) === 'aprovado', 'etapa deveria mudar');
    await p.locator('.toast .toast-act, .toast [data-op-acao]').first().click(); await p.waitForTimeout(200);
    const d = await p.evaluate(i => { const x = GP.projetos.get(i); return [x.etapa, x.historico[x.historico.length - 1].acao]; }, id);
    check(d[0] === 'entrada' && d[1] === 'Etapa revertida', 'Desfazer deveria devolver a etapa e registrar a reversão: ' + d.join(','));
  },
  async 'op-O7: entrada e triagem com atenção por tom, gerências ordenadas e KPIs 2x2'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/entrada-resumo', 250);
    const r = await p.evaluate(() => { const its = [...document.querySelectorAll('.op-att .att')]; const t = its.map(a => a.textContent);
      const w = document.querySelector('.op-att .att.t-warn'); return { i268:t.findIndex(x => /268 dias/.test(x)), i81:t.findIndex(x => /81 dias/.test(x)), barra:w ? getComputedStyle(w).boxShadow : '', svg:w ? getComputedStyle(w.querySelector('svg')).color : '' }; });
    check(r.i268 >= 0 && r.i81 > r.i268, 'item com 268 dias deveria vir antes do de 81 dias');
    check(/213, 163, 45/.test(r.barra) && r.svg === 'rgb(168, 112, 26)', 'item de atenção deveria ter barra e ícone na cor do tom');
    const ger = await p.$$eval('.b-6:first-of-type .hb, .b-6 .percent-row', els => els.length).catch(() => 0);
    check(await p.evaluate(() => !document.querySelector('.op-painel svg circle[stroke-width="18"]')), 'gerências não deveriam usar a rosca de 4 cores');
    await vp(p, 390, 844); await ir('#/entrada-resumo', 250);
    const k = await p.$$eval('.op-kpis > *', ks => ks.map(x => Math.round(x.getBoundingClientRect().top)));
    check(k.length === 4 && k[0] === k[1] && k[2] === k[3] && k[2] > k[0], 'no celular os 4 KPIs deveriam ficar em 2x2');
    await vp(p, 1440, 900);
  },
  async 'op-O8/O10: funil com fila no topo, SLA e textos sem "(s)"'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/funil', 250);
    const r = await p.evaluate(() => ({ topo:document.querySelector('.op-fila').getBoundingClientRect().top, barras26:[...document.querySelectorAll('#conteudo *')].filter(e => Math.round(e.getBoundingClientRect().height) === 26 && /^(SPAN|I)$/.test(e.tagName) && !e.textContent.trim()).length,
      sla:[...document.querySelectorAll('.op-sla')].find(s => /268/.test(s.textContent)) }));
    check(r.topo < 420, `fila deveria começar acima de y=420 (${Math.round(r.topo)})`);
    check(r.barras26 === 0, 'não deveria restar barra de 26px');
    check(await p.$eval('.op-sla.t-bad', s => /268/.test(s.textContent)).catch(() => false), 'item com 268 dias deveria ter selo cobre');
    check(await p.locator('.op-tabs, .op-funil-bar .tabs').count() === 1 && await p.evaluate(() => document.querySelector('.op-funil-bar').getBoundingClientRect().top < document.querySelector('.op-flow').getBoundingClientRect().top), 'abas deveriam vir logo abaixo do título');
    const id = await p.evaluate(() => GP.projetos.todos()[0].id);
    for(const rota of ['#/novo', '#/acervo', '#/funil', '#/funil?aba=quadro', '#/projeto/' + id, '#/entrada-resumo']){
      await ir(rota, 200); check(!/\(s\)/.test(await p.textContent('#conteudo')), 'texto com "(s)" em ' + rota);
    }
    await ir('#/acervo', 150);
    check((await p.textContent('.nav-item.on')).trim() === 'Acervo' && (await p.textContent('#conteudo h1')).trim() === 'Acervo', 'menu e título deveriam dizer "Acervo"');
    check(/Novo cadastro/.test(await p.textContent('#conteudo .page-h')), 'botão de cadastro deveria dizer "Novo cadastro"');
    await ir('#/projeto/' + id, 150); check(/Acervo/.test(await p.textContent('.op-voltar')), 'voltar da ficha deveria dizer "Acervo"');
    await ir('#/novo', 150); check((await p.textContent('[data-form] button[type=submit]')).trim() === 'Cadastrar', 'envio do formulário deveria dizer "Cadastrar"');
    await vp(p, 390, 844); await ir('#/funil', 250);
    const m = await p.$$eval('.op-fila-item', its => its.map(i => { const b = i.querySelector('.btn-primary').getBoundingClientRect(), c = i.getBoundingClientRect(); return b.width / c.width; }));
    check(m.length && m.every(x => x > .7), 'no celular cada item da fila deveria ter o botão primário em largura total');
    await vp(p, 1440, 900);
  },
  async 'op-O9: ficha limpa, histórico sem duplicatas, menu ⋯ e desfazer exclusão'({ p, ir, check, recarregar }){
    const id = await novo(p, { titulo:'Projeto ficha QA com título longo o bastante para ocupar mais de uma linha no cabeçalho da ficha do projeto' });
    await ir('#/projeto/' + id, 200);
    const t = await p.textContent('#conteudo');
    check(!/- a -/.test(t) && /Sem datas previstas/.test(t), 'ficha nova não deveria mostrar "- a -"');
    check(await p.$$eval('.op-o-dados dd', ds => ds.every(d => d.textContent.trim() !== '-')), 'ficha não deveria listar pares com "-"');
    check(/Completar \d+ campos/.test(t), 'ficha deveria oferecer "Completar N campos"');
    const h1 = await p.$eval('#conteudo h1', h => Math.round(h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight)));
    check(h1 <= 2, `h1 deveria ocupar no máximo 2 linhas (${h1})`);
    await p.evaluate(i => { GP.projetos.registrarEntrada(i, { E1:'sim', E2:'sim', E3:'sim', E4:'sim', E5:'nao', E6:'sim' }); const x = GP.projetos.get(i); x.historico.push({ data:new Date().toISOString(), acao:'Priorização', detalhe:'Valor 65.0 · esforço 40.5 · Ganho rápido' }); GP.save(); }, id);
    await recarregar();
    const hs = await p.$$eval('.op-hist-item', its => its.map(i => i.querySelector('b').textContent + '|' + i.querySelector('time').textContent));
    check(!hs.some((h, i) => i && h === hs[i - 1]) && await p.locator('.op-hist-sub').count() === 1, 'Entrada e Etapa simultâneas deveriam virar um só evento');
    check(/65,0/.test(await p.textContent('.op-hist')) && !/65\.0/.test(await p.textContent('.op-hist')), 'decimais da priorização deveriam usar vírgula');
    check(!(await p.locator('[data-excluir]').isVisible()), '"Excluir" só deveria aparecer no menu ⋯');
    await p.click('.op-mais-btn'); await p.click('[data-excluir]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.projetos.todos().length) === 0, 'exclusão deveria remover');
    await p.locator('.toast .toast-act, .toast [data-op-acao]').first().click(); await p.waitForTimeout(250);
    check(await p.evaluate(i => !!GP.projetos.get(i), id) && new RegExp(id).test(p.url()), 'Desfazer deveria restaurar o projeto e abrir a ficha');
    await vp(p, 390, 844); await ir('#/projeto/' + id, 250);
    check(await p.evaluate(() => document.querySelector('.op-o-dados').getBoundingClientRect().top < document.querySelector('.op-o-hist').getBoundingClientRect().top && document.querySelector('.op-chips-resumo').getBoundingClientRect().top < document.querySelector('.op-o-hist').getBoundingClientRect().top), 'em 390 gerência e responsável deveriam vir antes do histórico');
    await vp(p, 1440, 900);
  },
  async 'op-O11: estados vazios com contexto'({ p, ir, check, recarregar }){
    await ir('#/funil', 200);
    check(await p.locator('.op-onboard .op-passos li').count() === 3 && await p.locator('.op-flow, #conteudo .tabs').count() === 0, 'funil vazio deveria mostrar só o cartão de 3 passos');
    await exemplos(p, recarregar);
    await p.evaluate(() => { GP.projetos.todos().filter(x => x.etapa === 'concluido').forEach(x => GP.projetos.excluir(x.id)); });
    await ir('#/funil?aba=quadro', 200);
    check(/Nada nesta etapa/.test(await p.textContent('.op-fluxo')), 'coluna vazia deveria dizer "Nada nesta etapa"');
    await ir('#/acervo', 200); await p.fill('[data-f="q"]', 'zzzz inexistente'); await p.waitForTimeout(450);
    check(await p.locator('#conteudo .empty [data-limpar]').count() === 1 && await p.locator('#conteudo .empty svg circle[r="7"]').count() === 1, 'busca sem resultado deveria mostrar o ícone de busca e "Limpar filtros"');
    await p.click('#conteudo .empty [data-limpar]'); await p.waitForTimeout(200);
    check(await p.locator('tbody tr').count() === 13, 'Limpar filtros deveria voltar a lista');
  },
  async 'op-O12: acervo no celular compacto, com filtros em folha e chips acessíveis'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await vp(p, 390, 844); await ir('#/acervo', 250);
    check(await p.$eval('.tbl tbody tr', t => t.getBoundingClientRect().top) < 330, 'em 390 o primeiro cartão deveria começar acima de y=330');
    check(await p.locator('[role=group][aria-label="Filtrar por situação"] [aria-pressed]').count() === 4, 'chips de situação deveriam expor aria-pressed');
    check(/projetos/.test(await p.textContent('.op-chips-row')), 'contagem deveria ficar junto aos chips');
    await p.click('[data-filtros-folha]'); await p.waitForTimeout(150);
    await p.selectOption('.modal [data-ff="gerencia"]', 'FEL'); await p.click('.modal [data-ff-ok]'); await p.waitForTimeout(200);
    check(await p.locator('.tbl tbody tr').count() === 2 && /\(1\)/.test(await p.textContent('[data-filtros-folha]')) && await p.locator('[data-rm-filtro="gerencia"]').count() === 1, 'folha de filtros deveria filtrar e mostrar o chip ativo');
    await p.click('.op-mais-btn'); check(await p.locator('.op-mais.open [data-exportar-csv]').isVisible(), 'Importar/Exportar deveriam ficar no menu ⋯');
    await vp(p, 360, 780); await ir('#/acervo', 200);
    check(await p.$$eval('td .pill', ps => ps.every(x => x.scrollWidth <= x.clientWidth + 1 && x.getBoundingClientRect().right <= innerWidth)), 'em 360 a pílula de etapa não deveria ser cortada');
    await vp(p, 1440, 900);
  },
  async 'op-O13: formulário com resumo lateral, progresso e barra fixa no celular'({ p, ir, check }){
    await ir('#/novo', 200);
    const r = await p.evaluate(() => ({ w:document.querySelector('[name=titulo]').getBoundingClientRect().width, prog:document.querySelector('[data-prog-n]').textContent }));
    check(r.w <= 880, `Título não deveria passar de 880px (${Math.round(r.w)})`);
    await p.fill('[name=titulo]', 'Projeto com progresso'); await p.waitForTimeout(100);
    check(await p.textContent('[data-prog-n]') !== r.prog, 'progresso dos obrigatórios deveria mudar ao preencher');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(150);
    check(await p.$eval('[data-form] button[type=submit]', b => { const x = b.getBoundingClientRect(); return x.top >= 0 && x.bottom <= innerHeight; }), 'Cadastrar deveria ficar visível na coluna lateral');
    check(/opcional/.test(await p.textContent('[data-opcional] summary')) && !(await p.locator('[data-opcional]').getAttribute('open')), 'seção "Quanto e quando" deveria vir recolhida e marcada como opcional');
    await vp(p, 390, 844); await ir('#/novo', 200);
    check(await p.$eval('.op-form-acoes', a => getComputedStyle(a).position) === 'fixed', 'no celular a barra de ação deveria ficar fixa');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(150);
    check(await p.evaluate(() => { const bar = document.querySelector('.op-form-acoes').getBoundingClientRect(), last = document.querySelector('[data-opcional]').getBoundingClientRect(); return last.bottom <= bar.top + 1; }), 'barra fixa não deveria cobrir o último campo');
    await vp(p, 1440, 900);
  },
  async 'op-O14: ficha navega pelo acervo filtrado e ordenado'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/acervo', 200);
    await p.click('[data-grupo="andamento"]'); await p.waitForTimeout(150);
    await p.click('[data-sort="acervo|titulo"]'); await p.waitForTimeout(150);
    const ids = await p.$$eval('tbody tr', trs => trs.map(t => t.dataset.abrir));
    await p.locator('tbody tr').first().click(); await p.waitForTimeout(200);
    check(/1\s*de\s*12/.test(await p.textContent('.op-nav-pos')) && /Em andamento/.test(await p.textContent('.op-nav')), 'ficha deveria mostrar "1 de 12" e o filtro');
    check(await p.locator('[data-nav="ant"][disabled]').count() === 1, 'no primeiro, "anterior" deveria ficar desabilitado');
    await p.click('[data-nav="prox"]'); await p.waitForTimeout(200);
    check(p.url().endsWith(ids[1]) && /2\s*de\s*12/.test(await p.textContent('.op-nav-pos')), '"›" deveria levar ao próximo do mesmo filtro e ordem');
    await p.keyboard.press('Alt+ArrowRight'); await p.waitForTimeout(200);
    check(p.url().endsWith(ids[2]), 'Alt+→ deveria avançar');
    await p.goto(p.url().split('#')[0] + '#/projeto/' + ids[ids.length - 1]); await p.waitForTimeout(200);
    check(await p.locator('[data-nav="prox"][disabled]').count() === 1, 'no último, "próximo" deveria ficar desabilitado');
  },
};
