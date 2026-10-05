/* Regressão das correções da frente "priorizacao" (verificação adversarial). Cada fluxo começa com o armazenamento limpo. */
const exemplos = async (p, recarregar, nivel = 3) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.state().ui.menuMini = false; GP.save(); }, nivel); await recarregar(); };
const idDe = (p, cod) => p.evaluate(c => GP.projetos.todos().find(x => x.codigo === c).id, cod);
const TUDO = { V1:0, V2:3, V3:2, V4:2, V5:1, V6:1, C1:1, C2:2, C3:1 };
const texto = async (p, sel) => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
const escopo = async (p, ir, e) => { await p.evaluate(x => { GP.state().ui.rankEscopo = x; GP.save(); }, e); await ir('#/painel', 120); };

module.exports = {
  async 'correcao-priorizacao 1/3/10: mini mapa de riscos do painel com altura própria (sem colisão com a barra de esforço do ranking)'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    for(const [w, h] of [[1440, 900], [1024, 768], [390, 844]]){
      await p.setViewportSize({ width:w, height:h }); await ir('#/painel', 450);
      const r = await p.evaluate(() => { const m = document.querySelector('.gx-risco .rk-mtz-box.rk-mini'); if(!m) return null;
        const g = m.querySelector('.rk-mtz').getBoundingClientRect(), n = document.querySelector('.gx-risco-nums').getBoundingClientRect(), cs = getComputedStyle(m);
        return { h: m.getBoundingClientRect().height, gh: g.height, cobre: g.bottom > n.top + 1, fundo: cs.backgroundColor }; });
      check(r && r.h >= r.gh - 1 && r.h > 60, `${w}px: caixa do mini mapa deveria ter a altura da grade (${JSON.stringify(r)})`);
      check(r && !r.cobre, `${w}px: mini mapa não deveria cobrir "ativos / altos ou críticos" (${JSON.stringify(r)})`);
      check(r && r.fundo === 'rgba(0, 0, 0, 0)', `${w}px: mini mapa não deveria herdar o fundo da barra de esforço (${r && r.fundo})`);
    }
    await p.setViewportSize({ width:1440, height:900 });
    await exemplos(p, recarregar, 2); await ir('#/ranking', 300);
    const b = await p.evaluate(() => { const s = document.querySelector('.rk-tabela .rk-esf .rk-esf-bar'); if(!s) return null; const r = s.getBoundingClientRect(); return { w: r.width, h: r.height, mini: !!document.querySelector('.rk-tabela .rk-mini') }; });
    check(b && b.w === 40 && b.h === 4 && !b.mini, 'barra de esforço do ranking deveria usar classe própria (.rk-esf-bar, 40x4): ' + JSON.stringify(b));
  },
  async 'correcao-priorizacao 24: tabela "Avaliados" cabe em 1440 e 1366 com o menu aberto e mostra "Revisar →"'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    for(const [w, h] of [[1440, 900], [1366, 768]]){
      await p.setViewportSize({ width:w, height:h }); await ir('#/avaliar', 500);
      const t = await p.evaluate(() => [...document.querySelectorAll('.av-grupo .tbl-wrap')].map(x => { const dir = x.getBoundingClientRect().right;
        return { sw: x.scrollWidth, cw: x.clientWidth, rev: [...x.querySelectorAll('tbody tr td:last-child .link')].every(l => l.getBoundingClientRect().right <= dir) }; }));
      check(t.length === 2 && t.every(x => x.sw <= x.cw + 1 && x.rev), `${w}px: tabelas da fila sem rolagem e com a ação visível: ` + JSON.stringify(t));
    }
    const cel = await texto(p, '#conteudo .av-res');
    check(/Esforço \d+/.test(cel) && await p.locator('.av-res .qpill').count() === 9, 'célula fundida deveria trazer nota, esforço e quadrante: ' + cel);
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'correcao-priorizacao 26: "prontos para decisão" conta só aprovados avaliados, em qualquer escopo'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    const painel = await p.evaluate(() => GP.projetos.todos().filter(x => x.etapa === 'aprovado' && GP.modelo.pontuar(x).completo).length);
    for(const rota of ['#/ranking', '#/matriz']){
      for(const e of ['aguardando', 'ativos', 'todos']){
        await escopo(p, ir, e); await ir(rota, 300);
        const t = await texto(p, '.pz-sintese .ps-num'), n = +(t.match(/^\d+/) || [])[0];
        const prontos = +((t.match(/(\d+)\s*prontos? para decisão/) || [])[1]);
        check(prontos === painel, `${rota} ${e}: "prontos para decisão" deveria ser ${painel} (como o painel): ${t}`);
        if(e !== 'aguardando') check(/avaliados? neste escopo/.test(t) && n > painel, `${rota} ${e}: número do escopo deveria se chamar "avaliados neste escopo": ${t}`);
      }
    }
  },
  async 'correcao-priorizacao 27/28: ranking em 1024 com linhas ≤110px em todos os escopos e "Esforço N" junto'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await p.setViewportSize({ width:1024, height:768 });
    for(const e of ['aguardando', 'ativos', 'todos']){
      await escopo(p, ir, e); await ir('#/ranking', 350);
      const m = await p.evaluate(() => [...document.querySelectorAll('.rk-tabela tbody tr, .rank-cards .rc')].filter(x => x.offsetParent).map(a => {
        const h = Math.round(a.getBoundingClientRect().height), ve = a.querySelector('.rc-ve'); if(!ve) return { h, junto: true };
        const lbl = document.createRange(); lbl.setStart(ve.firstChild, 0); lbl.setEnd(ve.firstChild, 7);
        const rl = lbl.getBoundingClientRect(), rb = ve.querySelector('b').getBoundingClientRect();
        return { h, junto: Math.abs((rl.top + rl.bottom) / 2 - (rb.top + rb.bottom) / 2) < 4 && rb.left > rl.right }; }));
      check(m.length > 0 && m.every(x => x.h <= 110), `1024 ${e}: linhas deveriam ter ≤110px: ` + m.map(x => x.h).join(','));
      check(m.every(x => x.junto), `1024 ${e}: rótulo "Esforço" e o número deveriam ficar na mesma linha`);
    }
    await escopo(p, ir, 'todos'); await p.setViewportSize({ width:360, height:780 }); await ir('#/ranking', 300);
    check(await p.evaluate(() => document.documentElement.scrollWidth) <= 362, 'histórico em 360 não deveria ter rolagem horizontal');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'correcao-priorizacao 42: "Ver no ranking" troca o escopo só na visita, avisa e não grava'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2); const id = await idDe(p, 'PRJ-005');
    await ir('#/avaliar/' + id, 250);
    for(const [c, v] of Object.entries(TUDO)) await p.click(`.escala [data-c="${c}"][data-v="${v}"]`);
    await p.click('[data-salvar]'); await p.waitForTimeout(800);
    check(/#\/ranking/.test(p.url()) && await p.locator(`tr.destaque[data-rank-id="${id}"]`).count() === 1, 'deveria abrir o ranking com o PRJ-005 destacado');
    check(await p.evaluate(() => GP.state().ui.rankEscopo == null && !/rankEscopo/.test(localStorage.getItem('gestao-portfolio-feg-v1') || '')), 'o escopo da visita não deveria ser gravado');
    check(/Todos os ativos/.test(await texto(p, '[data-escopo].on')) && /PRJ-005/.test(await texto(p, '.pz-escopo-temp')), 'chip "Todos os ativos" ativo e aviso citando o PRJ-005');
    await ir('#/painel', 200); await ir('#/ranking', 250);
    check(await p.locator('.pz-escopo-temp').count() === 0 && /Aguardando início/.test(await texto(p, '[data-escopo].on')), 'voltar ao ranking deveria mostrar o escopo escolhido, sem aviso');
    check(/prontos? para decisão$/.test(await texto(p, '.pz-sintese .ps-num')), 'no escopo escolhido a síntese volta a "prontos para decisão"');
    await p.evaluate(i => GP.priorizacao.verNoRanking(i), id); await p.waitForTimeout(250);
    await p.click('[data-escopo-voltar]'); await p.waitForTimeout(200);
    check(await p.locator('.pz-escopo-temp').count() === 0 && /Aguardando início/.test(await texto(p, '[data-escopo].on')), '"Voltar para…" deveria restaurar o escopo escolhido');
    await p.evaluate(i => GP.priorizacao.verNoRanking(i), id); await p.waitForTimeout(250);
    await p.click('[data-escopo="ativos"]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.state().ui.rankEscopo) === 'ativos' && await p.locator('.pz-escopo-temp').count() === 0, 'escolher um escopo no chip continua gravando a escolha');
  },
  async 'correcao-priorizacao 29: avaliação parcial mostra "parcial" na decomposição e na ficha'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2); const id = await idDe(p, 'PRJ-005');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/avaliar/' + id, 250);
    await p.click('.escala [data-c="V1"][data-v="3"]'); await p.click('[data-ar-abrir]'); await p.waitForTimeout(150);
    const folha = await texto(p, '.modal .aval-folha');
    check(!/no máximo|Maior oportunidade|\d+ de 100/.test(folha), 'folha parcial não deveria mostrar total, "no máximo" nem "maior oportunidade": ' + folha.slice(0, 200));
    check(/parcial/.test(folha) && /Faltam 5 perguntas/.test(folha) && /Faltam 2 perguntas/.test(folha), 'folha parcial deveria dizer "parcial" e quantas perguntas faltam em cada eixo');
    await p.click('.modal .m-act [data-close]'); await p.waitForTimeout(100);
    await p.setViewportSize({ width:1440, height:900 }); await ir('#/avaliar/' + id, 250);
    await p.click('.escala [data-c="V1"][data-v="2"]'); await p.click('[data-salvar]'); await p.waitForTimeout(300);
    await ir('#/projeto/' + id, 300);
    const sec = await p.evaluate(() => { const d = document.querySelector('.ficha-dc'); return d ? d.parentElement.textContent.replace(/\s+/g, ' ') : ''; });
    check(/Avaliação parcial · faltam 8 respostas/.test(sec) && !/Não avaliado/.test(sec), 'ficha deveria dizer "Avaliação parcial · faltam 8 respostas" e não "Não avaliado"');
    check(/Salvo em \d\d\/\d\d\/\d{4}/.test(sec) && !/Avaliado em/.test(sec), 'ficha parcial deveria dizer "Salvo em", não "Avaliado em"');
    check(!/Maior oportunidade|\d+ de 100/.test(sec.split('Por que esta nota?')[1] || ''), 'decomposição parcial na ficha não deveria mostrar total nem "maior oportunidade"');
    const id1 = await idDe(p, 'PRJ-001'); await ir('#/projeto/' + id1, 300);
    const ok = await p.evaluate(() => document.querySelector('.ficha-dc').parentElement.textContent.replace(/\s+/g, ' '));
    check(/Avaliado em/.test(ok) && /65 de 100/.test(ok) && /Maior oportunidade/.test(ok), 'avaliação completa continua com total, data de avaliação e maior oportunidade');
  },
  async 'correcao-priorizacao 15/16: telas do pacote sem texto <11px, sem a cor antiga e com alvos de 44px no celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); const id = await idDe(p, 'PRJ-005'), id1 = await idDe(p, 'PRJ-001');
    const rotas = ['#/acervo', '#/avaliar', '#/avaliar/' + id, '#/ranking', '#/matriz', '#/criterios', '#/projeto/' + id1];
    for(const r of rotas){
      await ir(r, 300);
      const v = await p.evaluate(() => { const out = [], fd = document.querySelector('.ficha-dc');
        const raiz = location.hash.startsWith('#/projeto/') ? fd && fd.parentElement : document.getElementById('conteudo'); if(!raiz) return ['sem a seção Priorização']; // na ficha, só a seção Priorização (as outras são de outros pacotes)
        raiz.querySelectorAll('*').forEach(n => { if(!n.getClientRects().length || ![...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return;
          if(n.closest('.tbl th, .cart-tbl')) return; // cabeçalhos de tabela são do núcleo/outros pacotes
          const cs = getComputedStyle(n); if(parseFloat(cs.fontSize) < 11 || cs.color === 'rgb(113, 133, 126)') out.push((n.className || n.tagName) + ' ' + cs.fontSize + ' ' + cs.color); });
        return [...new Set(out)].slice(0, 5); });
      check(v.length === 0, `${r}: texto abaixo de 11px ou na cor antiga: ` + v.join(' | '));
    }
    await p.setViewportSize({ width:360, height:740 });
    for(const r of ['#/ranking', '#/matriz']){
      await ir(r, 300);
      const peq = await p.evaluate(() => [...document.querySelectorAll('.ps-seg, .pz-versao, .ps-pend, .pz-topo, [data-escopo-voltar]')].filter(n => n.getClientRects().length).map(n => [n.className, Math.round(n.getBoundingClientRect().height)]).filter(x => x[1] < 44));
      check(peq.length === 0, `${r} em 360: alvos de toque abaixo de 44px: ` + JSON.stringify(peq));
    }
    await p.setViewportSize({ width:1440, height:900 });
  },
};
