/* Fluxos de regressão da correção da frente Operação (defeitos 17 a 23 da verificação adversarial e transversais 15/16). */
const exemplos = async (p, recarregar, nivel = 1) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.state().ui.menuMini = false; GP.save(); }, nivel); await recarregar(); };
const vp = (p, w, h) => p.setViewportSize({ width:w, height:h });
const idDe = (p, c) => p.evaluate(c => GP.projetos.todos().find(x => x.codigo === c).id, c);

module.exports = {
  async 'cor-op 17: aviso "Sem checklist de entrada" visível acima do rodapé do modal Mudar etapa'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1);
    const id = await idDe(p, 'PRJ-007');
    for(const [w, h] of [[1366, 768], [1024, 768], [390, 844]]){
      await vp(p, w, h); await ir('#/projeto/' + id, 250);
      await p.click('[data-etapa]'); await p.waitForTimeout(300);
      await p.check('.modal input[name=et][value=execucao]'); await p.waitForTimeout(800);
      const r = await p.evaluate(() => { const b = document.querySelector('[data-fazer-checklist]'), c = document.querySelector('.op-aviso-check'), act = document.querySelector('.modal .m-act');
        if(!b || !c || !act) return { falta:true }; const br = b.getBoundingClientRect(), el = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
        return { botao: !!el && b.contains(el), acima: c.getBoundingClientRect().bottom <= act.getBoundingClientRect().top + 1, dentro: c.getBoundingClientRect().top >= 0 }; });
      check(!r.falta && r.botao && r.acima && r.dentro, `em ${w}x${h} o aviso e "Fazer checklist agora" deveriam ficar visíveis acima do rodapé: ${JSON.stringify(r)}`);
      await p.evaluate(() => GP.closeModal()); await p.waitForTimeout(150);
    }
    await vp(p, 1440, 900);
  },
  async 'cor-op 18: próximo passo de Admitido já avaliado mostra a posição no ranking'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2);
    const id = await idDe(p, 'PRJ-002');
    await ir('#/projeto/' + id, 300);
    const t = (await p.textContent('.op-proximo')).replace(/\s+/g, ' ');
    const pos = await p.evaluate(i => { const rk = GP.modelo.ranking(GP.projetos.todos().filter(x => x.etapa === 'aprovado')); const x = rk.find(y => y.p.id === i); return x && `${x.pos}º de ${rk.length}`; }, id);
    check(pos && t.includes(pos) && !/Avaliar prioridade|Responda as perguntas/.test(t), `admitido avaliado deveria mostrar "${pos} no ranking" sem pedir avaliação: ${t}`);
    check(await p.locator('.op-proximo [data-ver-ranking]').count() === 1 && await p.locator('.op-ficha-h [data-etapa].btn-primary').count() === 1, 'deveria oferecer "Ver no ranking" e deixar "Mudar etapa" como ação principal');
    await p.click('.op-proximo [data-ver-ranking]'); await p.waitForTimeout(350);
    check(/#\/ranking/.test(p.url()), '"Ver no ranking" deveria abrir o ranking');
    await p.evaluate(i => { const q = GP.projetos.get(i); delete q.avaliacao; GP.save(); }, id);
    await ir('#/projeto/' + id, 300);
    check(await p.locator('.op-proximo a[href^="#/avaliar/"].btn-primary').count() === 1, 'sem avaliação, a faixa deveria voltar a pedir "Avaliar prioridade"');
  },
  async 'cor-op 19: pares do formulário continuam alinhados depois da validação'({ p, ir, check }){
    const pares = [['tipo', 'origem'], ['gerencia', 'area'], ['ferramenta', 'demandante'], ['natureza', 'dataEntrada'], ['patrocinador', 'responsavel'], ['esforcoFte', 'duracaoMeses'], ['custo', 'progresso'], ['inicioPrevisto', 'fimPrevisto']];
    const medir = () => p.evaluate(ps => { const t = k => document.getElementById('f-' + k).getBoundingClientRect().top; return ps.map(([a, b]) => [a + '/' + b, Math.round(Math.abs(t(a) - t(b)))]).filter(x => x[1] > 2); }, pares);
    for(const w of [1440, 1280]){
      await vp(p, w, 900); await ir('#/novo', 250);
      await p.evaluate(() => { const r = GP.state().ui.rascunhos; if(r) delete r.novo; GP.save(); }); await ir('#/novo', 200);
      await p.evaluate(() => { document.querySelector('[data-opcional]').open = true; }); await p.waitForTimeout(150);
      check(!(await medir()).length, `pares desalinhados em repouso (${w}): ${JSON.stringify(await medir())}`);
      await p.fill('[name=custo]', 'abc'); await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(350);
      check(await p.locator('[data-err="tipo"] span').count() === 1, 'validação deveria mostrar o erro de Tipo');
      const d = await medir();
      check(!d.length, `pares desalinhados após a validação (${w}): ${JSON.stringify(d)}`);
    }
    await vp(p, 1440, 900);
  },
  async 'cor-op 20: acervo em 1440 com títulos em 1 linha, linhas ≤ 64px e 9 linhas inteiras'({ p, ir, check, recarregar }){
    await vp(p, 1440, 900); await exemplos(p, recarregar, 1); await ir('#/acervo', 400);
    const r = await p.evaluate(() => { const trs = [...document.querySelectorAll('#conteudo tbody tr')]; const hs = trs.map(t => t.getBoundingClientRect().height);
      const w = document.querySelector('.tbl-wrap');
      return { max:Math.max(...hs), vis:trs.filter(t => t.getBoundingClientRect().bottom <= innerHeight).length, linhas:Math.max(...[...document.querySelectorAll('.op-tit')].map(t => Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)))),
        dica:[...document.querySelectorAll('.op-tit')].every(t => t.title && t.title.length > 10), rola: w.scrollWidth > w.clientWidth + 1 }; });
    check(r.max <= 64 && r.linhas === 1, `linhas do acervo em 1440 deveriam ter ≤ 64px com título em 1 linha (max ${r.max}, linhas ${r.linhas})`);
    check(r.vis >= 9, `deveria haver 9 linhas inteiras visíveis em 1440x900 (veio ${r.vis})`);
    check(r.dica && !r.rola, 'título longo deveria ter dica (title) e a tabela não deveria rolar na horizontal');
  },
  async 'cor-op 21: cartões do acervo no celular sem Gerência e Fim previsto repetidos'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1);
    for(const [w, h] of [[390, 844], [360, 780]]){
      await vp(p, w, h); await ir('#/acervo', 300);
      const r = await p.evaluate(() => { const trs = [...document.querySelectorAll('#conteudo tbody tr')];
        return { vis:[...trs[0].querySelectorAll('td')].filter(td => getComputedStyle(td).display !== 'none').map(td => td.dataset.label), max:Math.max(...trs.map(t => t.getBoundingClientRect().height)),
          dupPrazo:trs.some(t => /sem prazo/.test(t.innerText) && /Sem data/.test(t.innerText)) }; });
      check(!r.vis.includes('Gerência') && !r.vis.includes('Fim previsto') && r.vis.includes('Etapa') && r.vis.includes('Responsável'), `cartão em ${w} deveria mostrar Projeto, Etapa e Responsável sem repetições: ${r.vis.join(', ')}`);
      check(r.max <= 190 && !r.dupPrazo, `cartão em ${w} deveria ter até ~180px e o prazo uma só vez (max ${Math.round(r.max)})`);
    }
    await vp(p, 1440, 900);
  },
  async 'cor-op 22: faixa resumo do funil mostra as contagens das Saídas entre 800 e 1280px'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    for(const w of [800, 1024, 1280, 390]){
      await vp(p, w, 768); await ir('#/funil', 300);
      const r = await p.evaluate(() => { const f = document.querySelector('.op-flow'), fr = f.getBoundingClientRect();
        return { rola: f.scrollWidth > f.clientWidth + 1, nums:[...f.querySelectorAll('.op-flow-saidas b')].every(b => { const x = b.getBoundingClientRect(); return x.width > 0 && x.left >= fr.left && x.right <= fr.right + 0.5 && x.right <= innerWidth; }) }; });
      check(r.nums, `em ${w}px as contagens das Saídas deveriam ficar visíveis`);
      check(w < 641 || !r.rola, `em ${w}px a faixa resumo não deveria rolar na horizontal`);
    }
    await vp(p, 1440, 900);
  },
  async 'cor-op 23: ficha recém-cadastrada no celular com cartões na largura total'({ p, ir, check }){
    await vp(p, 390, 844); await ir('#/novo', 250);
    await p.fill('[name=titulo]', 'Teste curto'); await p.fill('[name=descricao]', 'Desc');
    await p.selectOption('[name=tipo]', { index:1 }); await p.selectOption('[name=gerencia]', { index:1 }); await p.fill('[name=demandante]', 'Ana');
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(450);
    const r = await p.evaluate(() => { const g = document.querySelector('.op-ficha-grid').getBoundingClientRect().width; return [...document.querySelectorAll('.op-ficha-grid .card')].map(c => Math.round(g - c.getBoundingClientRect().width)); });
    check(r.length >= 3 && r.every(d => d <= 1), `cartões da ficha deveriam ocupar a largura toda em 390 (sobras ${r.join(', ')})`);
    await vp(p, 1440, 900);
  },
  async 'cor-op 15/16: telas de Operação sem texto < 11px, sem a cor antiga e com alvos de 44px no celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1);
    const ids = await p.evaluate(() => ['PRJ-005', 'PRJ-007', 'PRJ-002'].map(c => GP.projetos.todos().find(x => x.codigo === c).id));
    const rotas = ['#/novo', '#/acervo', '#/funil', '#/funil?aba=quadro', '#/entrada-resumo', ...ids.map(i => '#/projeto/' + i)];
    const varrer = () => p.evaluate(() => { const ruins = [], antigas = ['rgb(113, 133, 126)', 'rgb(120, 142, 134)', 'rgb(138, 144, 139)'];
      const raiz = document.querySelector('.modal') || document.getElementById('conteudo');
      raiz.querySelectorAll('[class*="op-"], [class*="op-"] *').forEach(e => { if(!e.getClientRects().length) return; if(![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
        // só elementos desenhados pela Operação (notas e seções de outros pacotes têm donos próprios)
        if(e.closest('.nota, .score, [class*="ar-"], [class*="pz-"], [class*="rk-"], [class*="cap-"], [class*="gx-"], [class*="inv-"], [class*="pl-"]')) return;
        const cs = getComputedStyle(e); if(parseFloat(cs.fontSize) < 11 || antigas.includes(cs.color)) ruins.push((e.className || e.tagName) + ' ' + cs.fontSize); });
      return ruins.slice(0, 5); });
    const alvos = () => p.evaluate(() => { const raiz = document.querySelector('.modal') || document.getElementById('conteudo'), ruins = [];
      raiz.querySelectorAll('a, button, summary, select, input:not([type=radio]):not([type=checkbox]), [tabindex="0"]').forEach(e => { const r = e.getBoundingClientRect();
        if(!r.width || e.closest('thead') || (e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.closest('p'))) return;
        if(r.height < 43.5) ruins.push((e.className || e.tagName) + ' ' + Math.round(r.height)); });
      return ruins.slice(0, 5); });
    for(const w of [1440, 390]){
      await vp(p, w, w > 500 ? 900 : 844);
      for(const r of rotas){
        await ir(r, 300);
        if(/quadro/.test(r)) await p.evaluate(() => document.querySelectorAll('.op-saida').forEach(d => d.open = true));
        const f = await varrer(); check(!f.length, `${r} (${w}) com texto < 11px ou cor antiga: ${f.join(' | ')}`);
        if(w === 390){ const a = await alvos(); check(!a.length, `${r} (390) com alvo de toque < 44px: ${a.join(' | ')}`); }
      }
      await ir('#/projeto/' + ids[1], 250); await p.click('[data-etapa]'); await p.waitForTimeout(450); await p.check('.modal input[name=et][value=execucao]'); await p.waitForTimeout(300);
      const fm = await varrer(); check(!fm.length, `modal Mudar etapa (${w}) com texto < 11px: ${fm.join(' | ')}`);
      if(w === 390){ const a = await alvos(); check(!a.length, `modal Mudar etapa (390) com alvo < 44px: ${a.join(' | ')}`); }
      await p.evaluate(() => GP.closeModal()); await p.waitForTimeout(200);
    }
    await vp(p, 1440, 900);
  },
};
