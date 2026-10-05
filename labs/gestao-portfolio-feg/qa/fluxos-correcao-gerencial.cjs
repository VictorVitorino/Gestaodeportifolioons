/* Regressão das correções da frente gerencial (verificação adversarial): índices 6, 25, 34, 35, 37, 38, 39, 43 e transversais 15/16. */
const fs = require('fs'), path = require('path');
const exemplos = async (p, recarregar, nivel = 3, extra = {}) => { await p.evaluate(([n, x]) => { GP.modelo.carregarExemplos(); Object.assign(GP.state().ui, { nivel:n }, x); GP.save(); }, [nivel, extra]); await recarregar(); };
const disco = p => p.evaluate(() => localStorage.getItem(GP.storageKey));

module.exports = {
  async 'correção gerencial #6: abrir uma segunda aba não grava a carteira nem põe a primeira em conflito'({ p, ir, check, APP, recarregar }){
    await exemplos(p, recarregar, 1); await ir('#/acervo', 300);
    const antes = await disco(p), revA = JSON.parse(antes).meta.revisao;
    // a migração é idempotente: o estado salvo sai igual, byte a byte
    check(await p.evaluate(raw => JSON.stringify(GP.modelo.migrar(JSON.parse(raw))) === raw, antes), '#6: migrar() sobre o estado salvo deveria devolver o mesmo JSON (sem reordenar chaves)');
    const B = await p.context().newPage(); const errosB = []; B.on('pageerror', e => errosB.push(e.message));
    for(const r of ['#/acervo', '#/painel', '#/indicadores']){ await B.goto(APP + r); await B.waitForTimeout(350); }
    const depois = await disco(p);
    check(depois === antes, `#6: só abrir e ler na aba B não deveria gravar (revisão ${revA} → ${JSON.parse(depois).meta.revisao})`);
    const stA = await p.evaluate(() => GP.storage);
    check(stA.ok && !stA.conflito, '#6: a aba A não deveria entrar em conflito: ' + JSON.stringify(stA));
    check(!JSON.parse(depois).ui.ultimaVisita && !!(await B.evaluate(() => localStorage.getItem(GP.storageKey + '-visita'))), '#6: a visita fica numa chave própria, fora do estado da carteira');
    // a aba A continua salvando as próprias alterações
    await p.evaluate(() => GP.setNivel(2)); await p.waitForTimeout(150);
    const r = await p.evaluate(() => { const x = GP.projetos.criar({ titulo:'Cadastro feito na aba A', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto' }); const d = JSON.parse(localStorage.getItem(GP.storageKey)); return { ok:x.ok, nivel:d.ui.nivel, tem:d.projetos.some(q => q.titulo === 'Cadastro feito na aba A'), st:GP.storage }; });
    check(r.ok && r.nivel === 2 && r.tem && !r.st.conflito, '#6: nível e cadastro feitos na aba A deveriam ir para o disco: ' + JSON.stringify(r));
    // uma alteração real na aba B continua sendo detectada na aba A (o aviso de conflito segue valendo)
    await B.reload(); await B.waitForTimeout(350);
    check(await B.evaluate(() => GP.projetos.todos().some(q => q.titulo === 'Cadastro feito na aba A')), '#6: a aba B recarregada vê o cadastro da aba A');
    await B.evaluate(() => GP.projetos.criar({ titulo:'Cadastro feito na aba B', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto' })); await p.waitForTimeout(300);
    check(await p.evaluate(() => GP.storage.conflito), '#6: alteração de dados na aba B ainda marca conflito na aba A');
    check(errosB.length === 0, '#6: aba B sem erros: ' + errosB.join(' | '));
    await B.close();
  },
  async 'correção gerencial #25/#34/#43: faixa, próximo passo e pendências usam a mesma fila de avaliação'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2); await ir('#/painel', 400);
    const r = await p.evaluate(() => { const pend = GP.modelo.pendentesAvaliacao(GP.projetos.todos()), passo = [...document.querySelectorAll('.gx-flow .gx-step')].find(s => /Avalia/.test(s.textContent));
      return { pend: pend.map(x => x.codigo + ':' + x.etapa), triagem: pend.filter(x => x.etapa === 'triagem').length, passo: passo ? passo.textContent.replace(/\s+/g, ' ').trim() : '',
        att: document.querySelector('.gx-atencao').textContent.replace(/\s+/g, ' '), next: document.querySelector('.gx-next').textContent.replace(/\s+/g, ' ') }; });
    check(r.pend.length === 1 && new RegExp('^Avaliação\\s*' + r.pend.length + '\\s*aguarda', 'i').test(r.passo), '#25: a faixa conta a fila de avaliação da priorização: ' + r.passo + ' / ' + r.pend);
    check(!/aprovados? sem nota/.test(r.passo) && /aguarda avaliação/.test(r.passo) && (!r.triagem || /em triagem/.test(r.passo)), '#25/#34: rótulo coerente com a contagem (e avisa quem está em triagem): ' + r.passo);
    check(/aguarda avaliação/.test(r.att) && !/Aprovados com avaliação completa/.test(r.att), '#34: "Pontos para acompanhamento" concorda com a faixa: ' + r.att.slice(0, 200));
    check(new RegExp('Avaliar ' + r.pend[0].split(':')[0]).test(r.next), '#34: o próximo passo lista a avaliação pendente: ' + r.next.slice(0, 260));
    // cenário mínimo do achado #43: PRJ em execução sem nota e registro em triagem com falta de informação
    const [cA, cB] = await p.evaluate(() => { const S = GP.state(), M = GP.modelo, P = GP.projetos; S.projetos = []; S.riscos = []; S.ui.nivel = 2; GP.save();
      const sim = Object.fromEntries(M.ENTRADA.map(q => [q.id, 'sim']));
      const a = P.criar({ titulo:'Execução sem avaliação', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto', responsavel:'Ana', inicioPrevisto:'2026-01-05', fimPrevisto:'2030-12-31', progresso:10 }).projeto;
      P.registrarEntrada(a.id, sim); P.mudarEtapa(a.id, 'execucao');
      const b = P.criar({ titulo:'Triagem com falta de informação', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto' }).projeto;
      P.registrarEntrada(b.id, Object.assign({}, sim, { E5:'nao' })); GP.refresh(); return [a.codigo, b.codigo]; });
    await ir('#/acervo', 100); await ir('#/painel', 400);
    const m = await p.evaluate(() => ({ next: document.querySelector('.gx-next').textContent.replace(/\s+/g, ' '), ok: !!document.querySelector('.gx-next-ok'), att: document.querySelectorAll('.gx-att .attention-item').length,
      passo: [...document.querySelectorAll('.gx-flow .gx-step')].find(s => /Avalia/.test(s.textContent)).textContent.replace(/\s+/g, ' ').trim() }));
    check(!m.ok && m.next.includes('Completar a triagem de ' + cB) && m.next.includes('Avaliar ' + cA), '#43: com pendências, o próximo passo não diz "Tudo em dia": ' + m.next.slice(0, 260));
    check(/^Avaliação\s*2\s*aguardam avaliação · 1 em triagem$/i.test(m.passo), '#43: faixa "2 aguardam avaliação" sem dizer "aprovados": ' + m.passo);
    // "Tudo em dia" só quando a mesma tela não lista pendências
    await p.evaluate(() => { const P = GP.projetos; P.todos().forEach(x => P.avaliar(x.id, Object.fromEntries(['V1','V2','V3','V4','V5','V6','C1','C2','C3'].map(k => [k, 2])))); GP.state().projetos = P.todos().filter(x => x.etapa === 'execucao'); GP.save(); GP.refresh(); });
    await p.waitForTimeout(250);
    const t = await p.evaluate(() => ({ ok: !!document.querySelector('.gx-next-ok'), att: document.querySelectorAll('.gx-att .attention-item').length }));
    check(t.ok && t.att === 0, '#43: carteira sem pendências mostra "Tudo em dia" e nenhum ponto de acompanhamento: ' + JSON.stringify(t));
    await p.evaluate(() => { GP.projetos.todos()[0].responsavel = ''; GP.save(); GP.refresh(); }); await p.waitForTimeout(250);
    const u = await p.evaluate(() => ({ ok: !!document.querySelector('.gx-next-ok'), att: document.querySelectorAll('.gx-att .attention-item').length, next: document.querySelector('.gx-next').textContent.replace(/\s+/g, ' ') }));
    check(!u.ok && u.att > 0 && /sem responsável/.test(u.next), '#43: pendência de acompanhamento vira o próximo passo em vez de "Tudo em dia": ' + JSON.stringify(u).slice(0, 220));
  },
  async 'correção gerencial #35: tabela de Indicadores cabe em 1440 com o menu expandido'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3, { menuMini:false }); await p.setViewportSize({ width:1440, height:900 });
    for(const aba of ['visao', 'riscos']){
      await p.evaluate(a => { GP.state().ui.abaIndicadores = a; GP.save(); }, aba); await ir('#/indicadores', 400);
      const r = await p.evaluate(() => { const w = document.querySelector('.gx-tabela .tbl-wrap'), th = [...w.querySelectorAll('thead th')].pop(), td = w.querySelector('tbody tr td:last-child');
        return { sw: w.scrollWidth, cw: w.clientWidth, prazo: th.textContent.trim(), dentro: th.getBoundingClientRect().right <= w.getBoundingClientRect().right + 1, ano: /\d{2}\/\d{2}\/\d{4}|^-$/.test(td.textContent.trim()) }; });
      check(r.sw <= r.cw + 1 && r.dentro && r.ano, `#35: ${aba}: as 8 colunas cabem sem rolagem e o prazo aparece inteiro: ` + JSON.stringify(r));
    }
  },
  async 'correção gerencial #37: tendência da fila só com histórico real'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/painel', 400);
    const r = await p.evaluate(() => ({ t: GP.analytics.tendencia(GP.projetos.todos()), chip: (document.querySelector('.gx-flow .gx-step .gx-delta') || {}).textContent || '' }));
    check(r.t.fila === null && r.chip === '', '#37: exemplos datados na carga não geram "−10 em 30 dias": ' + JSON.stringify(r));
    await ir('#/indicadores', 300);
    const k = await p.evaluate(() => { const m = [...document.querySelectorAll('#conteudo .metric')].find(x => /Fila de entrada/.test(x.textContent)); return m ? !!m.querySelector('.metric-delta') : null; });
    check(k === false, '#37: KPI "Fila de entrada" sem chip de variação quando o histórico não cobre os 30 dias');
    // com histórico real (base registrada há 60 dias), a variação volta e é coerente
    await p.evaluate(() => { const d = new Date(Date.now() - 60 * 864e5).toISOString(); GP.projetos.todos().forEach(x => { x.criadoEm = d; (x.historico || []).forEach(h => { h.data = d; }); }); GP.save(); });
    const v = await p.evaluate(() => GP.analytics.tendencia(GP.projetos.todos()).fila);
    check(v === 0, '#37: base com histórico de 60 dias e fila estável dá variação 0 (veio ' + v + ')');
    // registro retroativo que ainda está na fila: a data de entrada basta
    const w = await p.evaluate(() => { const d = new Date(Date.now() - 40 * 864e5), iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      GP.projetos.criar({ titulo:'Demanda registrada com atraso', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto', natureza:'demanda', dataEntrada:iso }); return GP.analytics.tendencia(GP.projetos.todos()).fila; });
    check(w === 0, '#37: demanda retroativa que segue na fila conta nos dois lados (veio ' + w + ')');
  },
  async 'correção gerencial #38: Sistemas é tabela em 1024 e cartão compacto no celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1);
    for(const [w, h] of [[1024, 768], [1280, 800]]){
      await p.setViewportSize({ width:w, height:h }); await ir('#/sistemas', 400);
      const r = await p.evaluate(() => { const t = document.querySelector('.gx-sis-tbl'), wr = t.closest('.tbl-wrap'), tr = t.querySelector('tbody tr');
        return { tabela: getComputedStyle(tr).display === 'table-row', sw: wr.scrollWidth, cw: wr.clientWidth, dir: [...t.querySelectorAll('td.r')].every(td => getComputedStyle(td).textAlign === 'right') }; });
      check(r.tabela && r.sw <= r.cw + 1 && r.dir, `#38: em ${w} a tabela continua tabela, sem rolagem e com números à direita: ` + JSON.stringify(r));
    }
    await p.setViewportSize({ width:390, height:844 }); await ir('#/sistemas', 400);
    const m = await p.evaluate(() => { const t = document.querySelector('.gx-sis-tbl'), tr = t.querySelector('tbody tr'), td = tr.querySelector('td[data-label="Custo estimado"]'), n = td.querySelector('.gx-num');
      const nums = ['Iniciativas', 'Abertas', 'Em execução'].map(l => tr.querySelector(`td[data-label="${l}"]`)).map(c => { const r = document.createRange(); r.selectNodeContents(c); const rs = [...r.getClientRects()]; return Math.round(rs[rs.length - 1].bottom); });
      return { cartao: getComputedStyle(tr).display === 'grid', altura: Math.round(tr.getBoundingClientRect().height), recuo: Math.round(n.getBoundingClientRect().left - td.getBoundingClientRect().left), nums, pagina: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth }; });
    check(m.cartao && m.altura < 260 && m.pagina < 3800 && m.sw <= 392, '#38: em 390 cartões compactos (antes 380px cada, página de 4.826px): ' + JSON.stringify(m));
    check(Math.abs(m.recuo) <= 1, '#38: no cartão o custo alinha com o rótulo (recuo ' + m.recuo + 'px)');
    check(Math.max(...m.nums) - Math.min(...m.nums) <= 2, '#38: os três números do cartão ficam na mesma linha: ' + m.nums);
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'correção gerencial #39: matriz de exposição da aba Riscos com "Ver dados em tabela"'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3, { abaIndicadores:'riscos' }); await ir('#/indicadores', 400);
    const r = await p.evaluate(() => { const card = [...document.querySelectorAll('.rk-overview > .card')].find(c => c.querySelector('.rk-mtz')), d = card && card.querySelector('details.chart-data');
      const esperado = GP.riscos.todos().filter(x => ['aberto', 'em_tratamento'].includes(x.status) && x.probabilidade && x.impacto).length;
      const linhas = d ? [...d.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim())) : [];
      const celulas = card ? [...card.querySelectorAll('.rk-mtz .rk-cel .rk-n')].length : -1;
      return { tem: !!d, resumo: d ? d.querySelector('summary').textContent : '', soma: linhas.reduce((s, l) => s + (+l[4] || 0), 0), esperado, linhas: linhas.length, celulas }; });
    check(r.tem && /Ver dados em tabela/.test(r.resumo), '#39: o cartão da matriz oferece "Ver dados em tabela"');
    check(r.soma === r.esperado && r.linhas === r.celulas, '#39: a tabela soma os riscos ativos avaliados e tem uma linha por célula ocupada: ' + JSON.stringify(r));
    // G3 estendido: todo gráfico das abas de Indicadores tem a tabela de apoio
    const sem = await p.evaluate(() => [...document.querySelectorAll('.gx-ind .card')].filter(c => c.querySelector('.percent-bars, svg.chart, .gx-heat, .rk-mtz') && !c.querySelector('details.chart-data')).map(c => (c.querySelector('h2,h3') || {}).textContent));
    check(sem.length === 0, '#39: gráficos sem "Ver dados em tabela": ' + sem.join(', '));
  },
  async 'correção gerencial transversal: textos ≥ 11px, sem cor antiga, zeros sem opacidade e alvos de 44px no celular'({ p, ir, check, recarregar }){
    const css = fs.readFileSync(path.join(__dirname, '../src/telas/gerencial.css'), 'utf8');
    check(!/#71857e|#788e86|#8a908b/i.test(css), 'transversal: gerencial.css sem as cores antigas (#71857e, #788e86, #8A908B)');
    check(!/color-mix\(/.test(css), 'transversal: gerencial.css sem color-mix()');
    await exemplos(p, recarregar, 3);
    const pequenos = [];
    for(const [r, aba] of [['#/painel'], ['#/indicadores', 'visao'], ['#/indicadores', 'riscos'], ['#/sistemas'], ['#/governanca'], ['#/config']]){
      if(aba) await p.evaluate(a => { GP.state().ui.abaIndicadores = a; GP.save(); }, aba);
      await ir(r, 400);
      pequenos.push(...await p.evaluate(rt => [...document.querySelectorAll('#conteudo *')].filter(e => { const t = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); const b = e.getBoundingClientRect();
        return t && b.width && b.height && !e.closest('.sr-only, details:not([open]) > :not(summary), svg') && parseFloat(getComputedStyle(e).fontSize) < 10.95; }).map(e => `${rt} ${e.className} "${e.textContent.trim().slice(0, 16)}" ${getComputedStyle(e).fontSize}`), r + (aba || '')));
    }
    check(pequenos.length === 0, 'transversal: textos abaixo de 11px nas telas gerenciais: ' + pequenos.slice(0, 6).join(' | '));
    await p.evaluate(() => { GP.state().ui.abaIndicadores = 'visao'; GP.save(); }); await ir('#/indicadores', 400);
    const z = await p.evaluate(() => { const row = [...document.querySelectorAll('.gx-heat-row.is-zero')][0], bar = [...document.querySelectorAll('.gx-bars .percent-row.is-zero')][0];
      const op = el => { let o = 1; for(let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
      const sonda = document.createElement('span'); sonda.style.color = 'var(--dim)'; document.getElementById('conteudo').appendChild(sonda); const dim = getComputedStyle(sonda).color; sonda.remove();
      return { dim, heat: row ? [op(row.querySelector('.gx-heat-lbl')), getComputedStyle(row.querySelector('.gx-heat-lbl')).color] : null, bar: bar ? [op(bar.querySelector('.count')), getComputedStyle(bar.querySelector('.count')).color] : null }; });
    check(z.heat && z.heat[0] === 1 && z.heat[1] === z.dim && z.bar && z.bar[0] === 1 && z.bar[1] === z.dim, 'transversal: linhas zeradas em var(--dim), sem opacidade: ' + JSON.stringify(z));
    await p.setViewportSize({ width:360, height:740 });
    const baixos = [];
    for(const r of ['#/painel', '#/indicadores', '#/sistemas', '#/governanca', '#/config']){
      await ir(r, 400);
      baixos.push(...await p.evaluate(rt => [...document.querySelectorAll('#conteudo a, #conteudo button, #conteudo summary, #conteudo select, #conteudo input:not([type=checkbox]), #conteudo label:has(> input[type=checkbox])')].filter(e => {
        const b = e.getBoundingClientRect(); if(!b.width || !b.height) return false;
        if(e.closest('details:not([open]) > :not(summary), thead, .gx-sintese, .sample-banner p, .chart-footnote, .gx-cfg-nota, .muted, p')) return false;   // links no meio do texto (exceção da regra de alvo)
        return b.height < 43.5; }).map(e => `${rt} ${e.tagName.toLowerCase()}.${e.className} "${(e.textContent || '').trim().slice(0, 18)}" ${Math.round(e.getBoundingClientRect().height)}`), r));
    }
    check(baixos.length === 0, 'transversal: alvos abaixo de 44px em 360px: ' + baixos.slice(0, 6).join(' | '));
    await p.setViewportSize({ width:1440, height:900 });
  },
};
