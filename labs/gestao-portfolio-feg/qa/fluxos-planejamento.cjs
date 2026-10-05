/* Fluxos do pacote planejamento: carteira e capacidade, roadmap, riscos, resumo de capacidade e pauta do comitê.
   Cada fluxo começa com o armazenamento limpo. */
const exemplos = async (p, recarregar, extra) => {
  await p.evaluate(x => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 3; if(x) Object.assign(S.capacidade, x); GP.save(); }, extra || null);
  await recarregar();
};
const idDe = (p, cod) => p.evaluate(c => GP.projetos.todos().find(x => x.codigo === c).id, cod);
const contraste = (a, b) => { const l = c => { const v = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  const [x, y] = [l(a), l(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };

module.exports = {
  async 'planejamento L1: período antigo migra e carteira concorda com o roadmap'({ p, ir, check, recarregar }){
    await p.evaluate(() => { localStorage.setItem(GP.storageKey, JSON.stringify({ v:2, projetos:[], forcar:{}, capacidade:{ periodo:'2027', fte:10, reservaPct:15, orcamento:4000000, descontarExecucao:true }, ui:{ nivel:3 } })); });
    await recarregar(); await ir('#/carteira', 250);
    const cap = await p.evaluate(() => GP.state().capacidade);
    check(cap.periodoIni === '2027-01' && cap.periodoFim === '2027-12' && cap.periodo === '2027', 'período "2027" antigo deveria virar jan a dez/2027: ' + JSON.stringify(cap));
    check(!/Erro ao montar/.test(await p.textContent('#conteudo')), 'carteira com estado antigo não deveria dar erro');
    await exemplos(p, recarregar);
    const c = await p.evaluate(() => { const S = GP.state(), c = GP.modelo.montarCarteira(GP.projetos.todos(), S.capacidade, S.forcar); return { compr:c.comprometido, cabem:c.cabem }; });
    check(c.compr === 1.5, 'PRJ-001 e PRJ-006 (até dez/2026) não deveriam ocupar 2027; comprometido = ' + c.compr);
    await ir('#/carteira', 250);
    check(/Projetos que cabem\s*4\s*\/\s*5/.test(await p.textContent('#conteudo')), 'deveriam caber 4 de 5 aprovados');
    check(/Ver mês a mês no roadmap/.test(await p.textContent('.cart-med')), 'card do medidor deveria levar ao roadmap');
    await ir('#/roadmap', 300);
    const cabe = await p.locator('.rm-g .g-bar.gb-cabe').count(), fora = await p.locator('.rm-g .g-bar.gb-fora').count();
    check(cabe === c.cabem && fora === 1, `roadmap deveria ter ${c.cabem} barras que cabem e 1 aguardando (veio ${cabe} e ${fora})`);
  },
  async 'planejamento L2/L3: medidor, fixação com impacto, aviso de obrigatório e pauta'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await ir('#/carteira', 250);
    const segs = await p.$$eval('.cart-med .capm-s', s => s.map(x => x.className.replace('capm-s ', '')));
    check(['capm-res', 'capm-exec', 'capm-cart'].every(k => segs.includes(k)) && !segs.includes('capm-exc'), 'medidor deveria mostrar reserva, execução e carteira sem excesso: ' + segs);
    const leg = await p.textContent('.cart-med .capm-leg');
    check(/Reserva \(15%\)\s*1,5/.test(leg) && /Em execução\s*1,5/.test(leg) && /Nova carteira\s*7,0/.test(leg) && /Livre\s*0,0/.test(leg), 'legenda do medidor deveria somar 10 FTE: ' + leg);
    check(/10,0 − 1,5 \(reserva 15%\)/.test(await p.textContent('.cart-formula')), 'fórmula da capacidade ausente');
    // FTE = 8: fixar PRJ-013 e PRJ-014 tira o obrigatório PRJ-002
    await p.evaluate(() => { GP.state().capacidade.fte = 8; GP.save(); GP.refresh(); }); await p.waitForTimeout(250);
    const i13 = await idDe(p, 'PRJ-013'), i14 = await idDe(p, 'PRJ-014');
    await p.click(`[data-forcar="${i13}"][data-v="in"]`); await p.waitForTimeout(200);
    if(await p.locator('.modal [data-ok]').count()){ await p.click('.modal [data-ok]'); await p.waitForTimeout(200); }
    await p.click(`[data-forcar="${i14}"][data-v="in"]`); await p.waitForTimeout(200);
    const modal = await p.locator('.modal').count() ? await p.textContent('.modal') : '';
    check(/PRJ-002/.test(modal) && /OBRIGATÓRIO/.test(modal), 'fixar PRJ-014 deveria pedir confirmação citando PRJ-002: ' + modal.slice(0, 160));
    check(await p.evaluate(i => !GP.state().forcar[i], i14), 'fixação não deveria valer antes da confirmação');
    await p.click('.modal [data-ok]'); await p.waitForTimeout(250);
    check(await p.evaluate(i => GP.state().forcar[i] === 'in', i14), 'botão Fixar deveria gravar S.forcar como o select fazia');
    check(/As fixações deixaram 1 projeto obrigatório fora \(PRJ-002\)/.test(await p.textContent('.cart-avisos')), 'aviso de obrigatório fora ausente');
    const grupos = await p.$$eval('.cart-grp th', t => t.map(x => x.textContent));
    check(grupos.some(g => /Fixados pelo comitê/.test(g)) && grupos.some(g => /Pelo ranking/.test(g)), 'tabela deveria agrupar fixados e ranking');
    check(await p.locator('.cart-tbl thead th', { hasText:/^Ordem$/ }).count() === 1 && await p.locator('.cart-tbl thead th', { hasText:/^Rank$/ }).count() === 1, 'colunas Ordem e Rank ausentes');
    // FTE = 6: fixado estoura; excesso cobre além da marca e KPI "excede em"
    await p.evaluate(() => { GP.state().capacidade.fte = 6; GP.save(); GP.refresh(); }); await p.waitForTimeout(250);
    check(await p.locator('.cart-med .capm-s.capm-exc').count() === 1, 'medidor deveria desenhar o excesso');
    const kpi = await p.textContent('.cart-kpis');
    check(/excede em/.test(kpi) && !/sobram -/.test(kpi), 'KPI deveria dizer "excede em": ' + kpi);
    const verdes = await p.$$eval('.cart-kpis .val', v => v.filter(x => getComputedStyle(x).color === 'rgb(62, 104, 1)').length);
    check(verdes === 0, 'nenhum KPI deveria aparecer verde em déficit');
    await p.click('[data-pauta]'); await p.waitForTimeout(200);
    const txt = await p.inputValue('.modal [data-txt]'), s1 = txt.split('1a.')[0].split('1. Para aprovar')[1] || '';
    check(/1a\. Fixados que estouram a capacidade/.test(txt) && !/PRJ-014/.test(s1), 'pauta não deveria listar fixado que estoura em "cabem na capacidade"');
    check(/\[OBRIGATÓRIO\]/.test(txt), 'pauta deveria marcar obrigatórios');
  },
  async 'planejamento L8/L9: acumulado, linha de corte, controle segmentado e premissas ao vivo'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await ir('#/carteira', 250);
    check(await p.locator('.cart-tbl tr[data-id] .cart-ac').count() === 5, 'coluna Acumulado deveria ter mini-barras');
    const ordem = await p.$$eval('.cart-tbl tbody tr', trs => trs.map(t => t.classList.contains('cart-corte') ? 'CORTE' : (t.querySelector('.code') || {}).textContent));
    check(ordem.indexOf('CORTE') === ordem.indexOf('PRJ-004') + 1 && ordem.indexOf('CORTE') === ordem.indexOf('PRJ-014') - 1, 'linha de corte deveria ficar entre PRJ-004 e PRJ-014: ' + ordem);
    const i03 = await idDe(p, 'PRJ-003');
    await p.click(`[data-forcar="${i03}"][data-v="out"]`); await p.waitForTimeout(200);
    check(await p.evaluate(i => GP.state().forcar[i] === 'out', i03) && await p.locator(`[data-forcar="${i03}"][data-v="out"][aria-pressed="true"]`).count() === 1, 'Excluir deveria gravar S.forcar e marcar aria-pressed');
    await p.click(`[data-forcar="${i03}"][data-v=""]`); await p.waitForTimeout(200);
    check(await p.evaluate(i => !GP.state().forcar[i], i03), 'Automático deveria limpar a decisão');
    // unidades e reserva ao vivo
    check((await p.$$eval('.cart-suf i', x => x.map(y => y.textContent))).join(' ') === 'FTE R$' && /%/.test(await p.textContent('[data-res-out]')), 'campos deveriam mostrar as unidades');
    await p.focus('[data-cap="reservaPct"]');
    for(let i = 0; i < 5; i++) await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(450);
    check(await p.evaluate(() => GP.state().capacidade.reservaPct) === 20, 'arrastar a reserva deveria gravar 20%');
    check(await p.evaluate(() => document.activeElement && document.activeElement.dataset.cap === 'reservaPct'), 'foco deveria continuar na reserva');
    check(/Reserva \(20%\)\s*2,0/.test(await p.textContent('.cart-med .capm-leg')), 'medidor deveria refletir a nova reserva sem sair do campo');
    // restaurar com desfazer
    await p.fill('[data-cap="fte"]', '12'); await p.press('[data-cap="fte"]', 'Tab'); await p.waitForTimeout(200);
    await p.click('[data-cap-padrao]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.state().capacidade.fte) === 10, 'restaurar deveria voltar a 10 FTE');
    await p.click('.toast .toast-act, .toast [data-cart-desfazer]'); await p.waitForTimeout(250);
    check(await p.evaluate(() => GP.state().capacidade.fte) === 12, 'Desfazer deveria restaurar a capacidade anterior');
    // 1024: nada cortado e "Decisão do comitê" inteiro
    await p.setViewportSize({ width:1024, height:768 }); await ir('#/carteira', 300);
    const cortadas = await p.$$eval('.cart-tbl tr[data-id] td', tds => tds.filter(td => td.offsetParent && td.scrollWidth > td.clientWidth + 1).length);
    check(cortadas === 0, `em 1024 nenhuma célula deveria ser cortada (${cortadas})`);
    check(await p.$eval('.cart-tbl tr[data-id] td.c-dec', td => /Decisão do comitê/.test(getComputedStyle(td, '::before').content) || td.closest('table').querySelector('thead th.c-dec').getBoundingClientRect().width >= td.closest('table').querySelector('thead th.c-dec').scrollWidth), 'rótulo "Decisão do comitê" deveria aparecer inteiro');
    // 390: medidor antes das premissas
    await p.setViewportSize({ width:390, height:844 }); await ir('#/carteira', 300);
    const ys = await p.evaluate(() => [document.querySelector('.cart-med').getBoundingClientRect().top, document.querySelector('.cart-prem').getBoundingClientRect().top]);
    check(ys[0] < ys[1], 'no celular o medidor deveria vir antes das premissas');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'planejamento L16/L17: cenário "e se" sem gravar, comparação, margem e pauta em documento'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await ir('#/carteira', 250);
    check(/\+2,4 FTE/.test(await p.textContent('[data-cen-dica]')) && /PRJ-014/.test(await p.textContent('[data-cen-dica]')), 'dica de margem deveria indicar +2,4 FTE para o PRJ-014');
    const mover = v => p.$eval('[data-cen-extra]', (e, x) => { e.value = x; e.dispatchEvent(new Event('input', { bubbles:true })); }, v);
    await mover('2.5'); await p.waitForTimeout(300);
    check(/Projetos que cabem\s*5\s*\/\s*5/.test(await p.textContent('.cart-kpis')), 'com +2,5 FTE deveriam caber 5 de 5');
    check(await p.evaluate(() => GP.state().capacidade.fte) === 10, 'simulação não deveria alterar S.capacidade');
    await p.click('[data-pauta]'); await p.waitForTimeout(200);
    check(/Cenário em análise/.test(await p.inputValue('.modal [data-txt]')), 'pauta deveria citar o cenário ativo');
    check(await p.locator('.modal .pauta-doc table').count() >= 2 && /Para aprovar início/.test(await p.textContent('.modal .pauta-doc')), 'pauta deveria abrir como documento com tabelas');
    await p.evaluate(() => { window.__tipos = null; Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{ write: async itens => { window.__tipos = itens[0].types; }, writeText: async () => {} } }); });
    await p.click('.modal [data-copiar-email]'); await p.waitForTimeout(200);
    const tipos = await p.evaluate(() => window.__tipos);
    check(Array.isArray(tipos) && tipos.includes('text/html') && tipos.includes('text/plain'), 'Copiar para e-mail deveria gravar text/html e text/plain: ' + JSON.stringify(tipos));
    await p.click('.modal [data-pauta-aba="txt"]'); await p.waitForTimeout(100);
    check(await p.locator('.modal [data-txt]').isVisible() && /PAUTA DO COMITÊ/.test(await p.inputValue('.modal [data-txt]')), 'aba Texto deveria manter a pauta em texto');
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    for(const nome of ['Cenário A', 'Cenário B']){
      await p.click('[data-cen-salvar]'); await p.waitForTimeout(150); await p.fill('.modal [data-cen-nome]', nome); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
      await mover('4'); await p.waitForTimeout(250);
    }
    const cab = await p.$$eval('.cart-comp-head [role=columnheader]', h => h.map(x => x.textContent.trim()));
    check(cab.some(x => /Cenário A/.test(x)) && cab.some(x => /Cenário B/.test(x)), 'dois cenários salvos deveriam aparecer lado a lado: ' + cab);
    await recarregar(); await ir('#/carteira', 250);
    check(/Projetos que cabem\s*4\s*\/\s*5/.test(await p.textContent('.cart-kpis')) && await p.evaluate(() => GP.state().capacidade.fte) === 10, 'depois de recarregar a carteira deveria voltar aos dados salvos');
    check(await p.evaluate(() => GP.state().ui.cenarios.length) === 2, 'cenários salvos deveriam persistir');
  },
  async 'planejamento L4–L7: gantt fixo, cabeçalho, barras por situação, histograma e celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await p.setViewportSize({ width:1440, height:900 }); await ir('#/roadmap', 350);
    const hoje = await p.evaluate(() => { const h = document.querySelector('.rm-meses .hoje'), s = document.querySelector('.rm-scroll'); if(!h) return false; const a = h.getBoundingClientRect(), b = s.getBoundingClientRect(); return a.left >= b.left && a.right <= b.right; });
    check(hoje, 'em 1440 o mês atual deveria aparecer na carga');
    check(await p.locator('.rm-g .g-bar.gb-exec').count() === 3 && await p.locator('.rm-g .g-bar.gb-exec .gb-feito').count() === 3, 'execução deveria aparecer sólida com a parte concluída');
    const lbl = p.locator('.rm-row .g-lbl').first(); await lbl.hover(); await p.waitForTimeout(120);
    const tit = await p.evaluate(() => GP.projetos.todos().find(x => x.codigo === 'PRJ-006').titulo);
    check(await p.locator('.gp-tt').count() === 1 && (await p.textContent('.gp-tt')).includes(tit), 'dica do rótulo deveria mostrar o título completo');
    check(await p.$$eval('.g-col', c => c.filter(x => x.hasAttribute('title')).length) === 0, 'nenhum title nativo em .g-col');
    const abr = await p.$$eval('.g-col', c => c.findIndex(x => /^abr\/2027/.test(x.dataset.tt)));
    await p.locator('.g-col').nth(abr).hover(); await p.waitForTimeout(120);
    const dicaAbr = await p.textContent('.gp-tt');
    check(/carteira selecionada: 8,5 FTE/.test(dicaAbr) && /como planejado: 10,5 FTE/.test(dicaAbr), 'dica de abr/2027 deveria mostrar 8,5 FTE da carteira e 10,5 FTE se o aguardando começar como planejado: ' + dicaAbr);
    check(/8,5 FTE/.test(await p.textContent('.g-cap')), 'linha de capacidade deveria ter rótulo');
    const linha = await p.evaluate(() => { const h = document.querySelector('.rm-hoje').getBoundingClientRect(), c = document.querySelector('.rm-head').getBoundingClientRect(), d = document.querySelector('.rm-dem-track').getBoundingClientRect(); return document.querySelectorAll('.rm-hoje').length === 1 && h.top <= c.top + 1 && h.bottom >= d.bottom - 1; });
    check(linha, 'linha Hoje deveria ser única e contínua do cabeçalho ao histograma');
    check(await p.$$eval('.rm-meses > span', s => s.length) === await p.locator('.g-col').count(), 'histograma deveria cobrir todos os meses do cabeçalho');
    // Só o que cabe
    await p.click('.rm-so'); await p.waitForTimeout(250);
    check(await p.locator('.rm-g .g-bar.gb-fora').count() === 0 && await p.locator('.rm-g .g-bar.gb-cabe').count() === 4, 'Só o que cabe deveria ocultar os hachurados');
    // 1024: ano inteiro e rótulos fixos ao rolar
    await p.setViewportSize({ width:1024, height:768 }); await ir('#/roadmap', 350);
    const anos = await p.$$eval('.rm-anos .rm-ano-t', a => a.map(x => [x.textContent, x.getBoundingClientRect().width >= x.scrollWidth]));
    check(anos.length >= 2 && anos.every(([t, ok]) => /^\d{4}$/.test(t) && ok), 'anos do cabeçalho deveriam aparecer inteiros: ' + JSON.stringify(anos));
    const fixo = await p.evaluate(() => { const s = document.querySelector('.rm-scroll'); s.scrollLeft = s.scrollWidth; const l = document.querySelector('.rm-row .g-lbl').getBoundingClientRect(), b = s.getBoundingClientRect(); return Math.abs(l.left - b.left) < 2; });
    check(fixo, 'nomes dos projetos deveriam ficar fixos ao rolar');
    // 390: lista de cartões
    await p.setViewportSize({ width:390, height:844 }); await ir('#/roadmap', 300);
    check(await p.locator('.rm-lista .rm-item:visible').count() === 8 && !(await p.locator('.rm-gantt').isVisible()), 'no celular o roadmap deveria virar 8 cartões');
    await p.setViewportSize({ width:360, height:780 }); await ir('#/roadmap', 300);
    const vaza = await p.$$eval('.rm-sem .chip', cs => cs.filter(c => c.getBoundingClientRect().right > c.closest('.card').getBoundingClientRect().right + 1).length);
    check(vaza === 0, 'chips "Sem datas previstas" não deveriam vazar do card em 360');
    await p.setViewportSize({ width:1440, height:900 });
    // L7: projeto longo não é cortado sem aviso
    await p.evaluate(() => { const x = GP.projetos.todos().find(q => q.codigo === 'PRJ-014'); x.fimPrevisto = '2031-06-30'; GP.save(); GP.refresh(); });
    await p.waitForTimeout(300);
    const meses = await p.$$eval('.rm-meses > span', s => s.length), ultimo = await p.$$eval('.g-col', c => c[c.length - 1].dataset.tt);
    const fim14 = await p.$$eval('.rm-row', rs => { const r = rs.find(x => /PRJ-014/.test(x.textContent)); const b = r.querySelector('.g-bar'); return parseFloat(b.style.left) + parseFloat(b.style.width); });
    check(/^jun\/2031/.test(ultimo) && meses === await p.locator('.g-col').count() && fim14 > 99 || /Mostrando/.test(await p.textContent('.rm-card')), 'barra do PRJ-014 deveria terminar em jun/2031 ou mostrar a nota de corte');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout:60000 }), p.click('[data-pdf]')]);
    check(/\.pdf$/.test(dl.suggestedFilename()), 'PDF do roadmap não gerado');
  },
  async 'planejamento L10–L14: riscos de exemplo, matriz, filtros, cartões e sinais'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    const m = await p.evaluate(() => { const r = GP.riscos.medir(); return { n:r.n, crit:r.criticos.length, altos:r.altos.length, venc:r.vencidos.length, semResp:r.semResponsavel.length }; });
    check(m.n === 6 && m.crit === 1 && m.altos === 3 && m.venc === 1 && m.semResp === 1, 'exemplos deveriam criar 6 riscos (1 crítico, 2 altos, 1 vencido, 1 sem responsável): ' + JSON.stringify(m));
    await ir('#/riscos', 300);
    const t = await p.textContent('#conteudo');
    // a carteira selecionada cabe (pico 8,5 de 8,5 em mar/2027): nada "acima da capacidade"; o excesso de abr–jun/2027 é hipótese de quem aguarda
    check(!/acima da capacidade/.test(t) && /Aprovados aguardando capacidade/.test(t) && /Se começarem como planejado, abr–jun\/2027 chegaria a 10,5 de 8,5 FTE/.test(t), 'sinais deveriam tratar o excesso de abr–jun/2027 como hipótese dos aguardando, não como carteira acima da capacidade');
    check(await p.locator('[data-risk-signal][data-risk-category="capacidade"]').count() >= 1, 'sinais de capacidade deveriam permitir registrar avaliação');
    const mtz = await p.textContent('.rk-mtz');
    check(!/·/.test(mtz) && !/P\d × I\d/.test(mtz), 'matriz não deveria mostrar "·" nem "P5 × I1" visíveis');
    check(await p.locator('.rk-overview .rk-leg .rk-leg-i').count() === 4, 'legenda deveria ter 4 faixas');
    check(/Probabilidade 5 muito alta, impacto 1 leve: 0 riscos/.test(await p.getAttribute('[data-risk-cell="5,1"]', 'aria-label')), 'leitor de tela deveria anunciar probabilidade, impacto e quantidade');
    const cores = await p.evaluate(() => ['critico', 'alto'].map(k => { const n = document.querySelector(`.rk-mtz .rk-l-${k} .rk-n`); return n ? [getComputedStyle(n).color, getComputedStyle(n).backgroundColor] : null; }));
    check(cores.every(c => c && contraste(c[0], c[1]) >= 4.5), 'contraste do número nas células alto e crítico deveria ser ≥ 4,5: ' + JSON.stringify(cores));
    const kp = await p.$$eval('.rk-kpis > *', k => k.map(x => Math.round(x.getBoundingClientRect().top)));
    check(kp.length === 3 && new Set(kp).size === 1, 'os 3 KPIs deveriam ocupar uma linha em 1440');
    check(await p.$$eval('.rk-acoes', a => a.every(x => x.getBoundingClientRect().height < 48)), 'ações do cartão não deveriam quebrar linha');
    check(await p.locator('.risk-item .pill.t-bad', { hasText:/Vencido há \d+ dias?/ }).count() === 1, 'prazo vencido deveria aparecer como pílula');
    // célula clicada: lista na vista e chip de filtro
    await p.click('[data-risk-cell="4,3"]'); await p.waitForTimeout(900);
    const vista = await p.evaluate(() => { const r = document.querySelector('.scope-line').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
    check(vista && /Filtro: Prob\. 4 × Imp\. 3/.test(await p.textContent('.rk-filtro-ativo')) && await p.locator('.risk-item').count() === 1, 'clicar na célula deveria filtrar, rolar até a lista e mostrar o chip');
    await p.click('.rk-filtro-ativo button'); await p.waitForTimeout(250);
    check(await p.locator('.rk-filtro-ativo').count() === 0 && await p.locator('.risk-item').count() === 6, 'o ✕ deveria remover o filtro da célula');
    await p.click('[data-rk-lacuna="sem_responsavel"]'); await p.waitForTimeout(400);
    check(await p.locator('.risk-item').count() === m.semResp, 'chip "Sem responsável" deveria filtrar a lista');
    await p.click('[data-rk-lacuna="sem_responsavel"]'); await p.waitForTimeout(250);
    // menu ⋯
    await p.click('.rk-mais > summary >> nth=0'); await p.waitForTimeout(100);
    check(await p.locator('.rk-menu [data-risk-history]').first().isVisible(), 'menu ⋯ deveria mostrar Histórico e Excluir');
    // formulário: clicar na matriz define P e I
    await p.click('[data-risk-new]'); await p.waitForTimeout(200);
    await p.click('.modal [data-rk-sel="4,3"]'); await p.waitForTimeout(100);
    const fv = await p.evaluate(() => [document.querySelector('.modal [name=probabilidade]').value, document.querySelector('.modal [name=impacto]').value, document.querySelector('.modal [data-risk-preview]').textContent, document.querySelector('.modal [data-risk-preview]').className]);
    check(fv[0] === '4' && fv[1] === '3' && /12 · Alto/.test(fv[2]) && /rk-l-alto/.test(fv[3]), 'clicar na matriz do formulário deveria definir P e I: ' + fv);
    await p.keyboard.press('Escape');
    // painel nível 2 com mini-heatmap; remover exemplos remove os riscos de exemplo
    await p.evaluate(() => GP.setNivel(2)); await ir('#/painel', 300);
    check(await p.locator('#conteudo .rk-mini .rk-cel').count() === 25, 'painel deveria mostrar o mini-heatmap 5×5');
    await p.evaluate(() => { GP.state().projetos = GP.projetos.todos().filter(x => !x.exemplo); GP.save(); });
    check(await p.evaluate(() => GP.riscos.todos().length) === 0, 'remover os exemplos deveria remover os riscos de exemplo');
  },
  async 'planejamento L10/L11: sem riscos, estado vazio único; sem sinais, card compacto'({ p, ir, check }){
    await p.evaluate(() => { GP.state().ui.nivel = 3; GP.save(); }); await ir('#/riscos', 250);
    check(await p.locator('.rk-vazio .rk-mtz-box.vazia').count() === 1 && await p.locator('.rk-vazio [data-risk-new]').count() === 1 && await p.locator('.rk-kpis').count() === 0, 'sem riscos deveria haver um estado vazio único com matriz esmaecida e CTA');
    const h = await p.evaluate(() => [document.querySelector('.rk-sinais').getBoundingClientRect().height, document.querySelector('.rk-vazio').getBoundingClientRect().height]);
    check(await p.locator('.rk-sinais-vazio').count() === 1 && h[0] < h[1], 'sem sinais o card não deveria esticar até a altura da matriz');
  },
  async 'planejamento L15: resumo de capacidade e atalho na entrada'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    const html = await p.evaluate(() => GP.capacidadeResumo());
    // mesmo pico da Carteira (mar/2027, 8,5 de 8,5); os 10,5 de abr/2027 só como hipótese rotulada do PRJ-014 aguardando
    check(/cap-resumo/.test(html) && /capm-bar/.test(html) && /A carteira selecionada cabe: pico de <b>8,5 de 8,5 FTE<\/b> em mar\/2027/.test(html) && /Se o PRJ-014, que aguarda capacidade, começar como planejado, abr\/2027 chegaria a 10,5 FTE/.test(html), 'GP.capacidadeResumo() deveria trazer medidor, demanda e o pico da carteira, com o excesso de quem aguarda rotulado como hipótese');
    check(await p.evaluate(h => { const d = document.createElement('div'); d.innerHTML = h; return d.querySelectorAll('section.cap-resumo').length === 1 && d.innerHTML.length > 500; }, html), 'HTML do resumo deveria ser válido');
    check(typeof await p.evaluate(() => typeof GP.charts.capacidade) === 'string' && await p.evaluate(() => typeof GP.charts.capacidade) === 'function', 'GP.charts.capacidade deveria existir');
    await ir('#/entrada-resumo', 250);
    const t = await p.textContent('#conteudo');
    check(/Ver capacidade/.test(t) && !/Pessoas livres/.test(t), 'entrada deveria trazer só o atalho de capacidade');
  },
};
