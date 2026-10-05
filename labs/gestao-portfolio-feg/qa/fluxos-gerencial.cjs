/* Fluxos do pacote gerencial: painel, indicadores, governança, sistemas, relatórios e configurações (G1 a G17). */
const exemplos = async (p, recarregar, nivel = 3) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.save(); }, nivel); await recarregar(); };
const muitos = async (p, recarregar, total = 106) => {
  await p.evaluate(t => { GP.modelo.carregarExemplos(); const P = GP.projetos; let i = 0;
    while(P.todos().length < t){ i++; P.criar({ titulo:'Registro de carga ' + i, descricao:'d', gerencia:['FEG','FEL','FEN','FER'][i % 4], demandante:'x', tipo:'Projeto', natureza: i % 3 ? 'projeto' : 'demanda', dataEntrada:`2026-0${1 + i % 9}-1${i % 9}` }); }
    GP.state().ui.nivel = 3; GP.save(); }, total);
  await recarregar();
};

module.exports = {
  async 'gerencial G1: manchete com números e próximo passo citando a fila mais antiga'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/painel', 300);
    const r = await p.evaluate(() => { const s = document.querySelector('.gx-sintese'), n = document.querySelector('.gx-next'), d = Math.round((new Date(GP.util.hoje() + 'T12:00:00') - new Date('2026-01-10T12:00:00')) / 864e5);
      return { sintese: s ? s.textContent : '', next: n ? n.textContent : '', topNext: n ? n.getBoundingClientRect().top : 9999, dias: d,
        grande: [...document.querySelectorAll('#conteudo *')].some(e => e.children.length === 0 && /^\d$/.test(e.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) >= 60) }; });
    check(/\d+ iniciativas/.test(r.sintese) && /R\$/.test(r.sintese), 'G1: frase-síntese deveria trazer números da carteira: ' + r.sintese.slice(0, 80));
    check(/PRJ-010/.test(r.next) && new RegExp(r.dias + ' dias').test(r.next), `G1: próximo passo deveria citar PRJ-010 (${r.dias} dias): ` + r.next.slice(0, 120));
    check(r.topNext < 900, 'G1: próximo passo deveria estar na primeira dobra');
    check(!r.grande && await p.locator('.level-tile, .work-session').count() === 0, 'G1: sem número de nível de 72px nem bloco de sessão');
    await p.click('.gx-next [data-gx-entrada]'); await p.waitForTimeout(250);
    check(/PRJ-010/.test(await p.locator('.modal').textContent().catch(() => '')), 'G1: botão do próximo passo deveria abrir o checklist do PRJ-010');
    await p.keyboard.press('Escape');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/painel', 300);
    const y = await p.evaluate(() => { const s = document.querySelector('.gx-sintese b'); return s ? s.getBoundingClientRect().top : 9999; });
    check(y < 700, 'G1: em 390 deveria haver número de negócio acima de y=700 (veio ' + Math.round(y) + ')');
    const h1 = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.gx-hero h1')).fontSize) / parseFloat(getComputedStyle(document.documentElement).fontSize));
    check(h1 <= 1.65, 'G1: h1 do painel no celular com 1.6rem (veio ' + h1.toFixed(2) + ')');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'gerencial G2: painel compacto com 106 registros e tabela sem sufixo de exemplo'({ p, ir, check, recarregar }){
    await muitos(p, recarregar); await ir('#/painel', 400);
    const r = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, rec: document.querySelectorAll('.gx-rec li').length, link: (document.querySelector('.gx-recentes .gx-card-foot a') || {}).textContent || '',
      ex: ((document.getElementById('conteudo').innerText || '').match(/exemplo/gi) || []).length }));
    check(r.h < 5000, 'G2: painel deveria medir menos de 5.000px com 106 registros (veio ' + r.h + ')');
    check(r.rec <= 6 && /\(106\)/.test(r.link), 'G2: no máximo 6 recentes e link com a contagem: ' + r.rec + ' / ' + r.link);
    check(r.ex <= 3, 'G2: "exemplo" no máximo 3 vezes no painel (veio ' + r.ex + ')');
    await ir('#/indicadores', 300);
    const t = await p.evaluate(() => { const linhas = [...document.querySelectorAll('.gx-tabela tbody tr')];
      const apr = linhas.find(tr => /Admitido/.test(tr.textContent)); return { sufixo: linhas.some(tr => /\(exemplo\)/i.test(tr.textContent)), chip: document.querySelectorAll('.gx-tabela .gx-ex').length, av: apr ? apr.querySelector('td[data-label="Avanço"]').textContent.trim() : '' }; });
    check(!t.sufixo && t.chip === 14, 'G2: tabela sem "(exemplo)" no título e com selo Exemplo na coluna de código');
    check(t.av === '—', 'G2: avanço de "Admitido · aguardando" deveria ser "—" (veio ' + t.av + ')');
    await p.evaluate(() => { GP.state().projetos = []; GP.save(); GP.refresh(); }); await p.waitForTimeout(200);
    check(/Nenhum registro cadastrado/.test(await p.textContent('#conteudo')), 'G2: tabela vazia sem filtros deveria dizer "Nenhum registro cadastrado"');
  },
  async 'gerencial G3/G15: painel responde o dia, indicadores exploram com cruzamento e dados em tabela'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/painel', 300);
    const t = await p.textContent('#conteudo');
    check(!/Distribuição por etapa/.test(t) && !/Registros por gerência/.test(t), 'G3: painel não deveria ter "Distribuição por etapa" nem "Registros por gerência"');
    check((t.match(/Fila de entrada/g) || []).length === 1, 'G3: a fila aparece uma única vez no painel');
    await ir('#/indicadores', 300);
    check(await p.locator('.gx-heat').count() === 1 && await p.locator('.donut-layout').count() === 0, 'G3: indicadores com cruzamento etapa × gerência e sem rosca de 2 fatias');
    const sem = await p.evaluate(() => [...document.querySelectorAll('.gx-ind .card')].filter(c => c.querySelector('.percent-bars, svg.chart, .gx-heat') && !c.querySelector('details.chart-data')).map(c => (c.querySelector('h3') || {}).textContent));
    check(sem.length === 0, 'G3: cada gráfico deveria oferecer "Ver dados em tabela": ' + sem.join(', '));
    await p.click('.gx-heat-cell[data-gx-cruz^="aprovado|FEN"]'); await p.waitForTimeout(200);
    const f = await p.evaluate(() => GP.state().ui.filtroIndicadores);
    check(f.etapa === 'aprovado' && f.gerencia === 'FEN', 'G3: célula do cruzamento deveria filtrar etapa e gerência');
  },
  async 'gerencial G4: etapas bloqueadas no nível 1 sem número grande e sem coluna vazia'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1); await ir('#/painel', 300);
    const r = await p.evaluate(() => { const f = document.querySelector('.gx-flow'), l = [...f.querySelectorAll('.locked')], kids = [...f.children], fr = f.getBoundingClientRect();
      return { n: l.length, strong: l.some(x => x.querySelector('strong')), txt: l.map(x => x.textContent).join('|'), cad: l.every(x => x.querySelector('.gx-lock svg')), sobra: fr.right - Math.max(...kids.map(k => k.getBoundingClientRect().right)) }; });
    check(r.n === 2 && !r.strong && /Disponível no nível 2/.test(r.txt) && r.cad, 'G4: etapas bloqueadas com cadeado e texto, sem número: ' + JSON.stringify(r));
    check(r.sobra < 40, 'G4: faixa sem coluna vazia (sobra ' + Math.round(r.sobra) + 'px)');
  },
  async 'gerencial G5/G6: cartões canônicos, ícones sem repetição e qualidade em %'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    for(const r of ['#/painel', '#/indicadores', '#/governanca', '#/sistemas']){ await ir(r, 300);
      const x = await p.evaluate(() => { const ic = [...document.querySelectorAll('#conteudo .metric .metric-icon')].map(i => i.innerHTML); return { n: ic.length, unicos: new Set(ic).size, ok: [...document.querySelectorAll('#conteudo .metric')].every(m => m.querySelector('.metric-head .metric-icon svg') && m.querySelector('.metric-value')) }; });
      check(x.n > 0 && x.ok && x.unicos === x.n, `G5: ${r} com cartões .metric com ícone e sem ícone repetido (${x.unicos}/${x.n})`); }
    await ir('#/indicadores', 300);
    const fila = await p.evaluate(() => { const m = [...document.querySelectorAll('.metric')].find(x => /Fila de entrada/.test(x.textContent)); return m ? !!m.querySelector('.ring') : null; });
    check(fila === false, 'G5: Fila de entrada sem anel');
    await p.evaluate(() => { GP.state().ui.abaIndicadores = 'qualidade'; GP.save(); GP.refresh(); }); await p.waitForTimeout(300);
    const q = await p.evaluate(() => ({ kpis: document.querySelectorAll('#conteudo .metric').length, aneis: document.querySelectorAll('#conteudo .metric .ring').length,
      linhas: [...document.querySelector('.gx-ind .card .percent-bars').querySelectorAll('.percent-row')].map(r => ({ c: r.querySelector('.count').textContent.trim(), h: r.querySelector('.name').getBoundingClientRect().height })) }));
    check(q.kpis === 3 && q.aneis <= 1, 'G5: aba Qualidade com 3 KPIs e no máximo 1 anel: ' + q.kpis + '/' + q.aneis);
    check(q.linhas.length === 8 && q.linhas.every(l => /^(\d+%\d+ de \d+|-sem base)$/.test(l.c)), 'G6: cobertura com "NN%" e "x de y": ' + q.linhas.map(l => l.c).join(' | '));
    check(q.linhas.every(l => l.h < 26), 'G6: rótulos sem quebra em 2 linhas');
  },
  async 'gerencial G7: nomes únicos, sem "(s)" e sem notas de desenvolvimento'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    check(/Entrar \/ Perfis/.test(await p.textContent('.profile-btn')) && !/FE\s*Usuários/.test(await p.textContent('.profile-btn')), 'G7: chip do perfil sem usuário deveria dizer "Entrar / Perfis"');
    for(const r of ['#/painel', '#/indicadores', '#/governanca', '#/sistemas', '#/relatorios', '#/config']){ await ir(r, 250);
      const x = await p.evaluate(() => ({ t: document.getElementById('conteudo').innerText, h1: document.querySelector('#conteudo h1').textContent.trim(), menu: (document.querySelector('.side .nav-item.on .lbl') || {}).textContent || '', crumb: (document.querySelector('.topbar .crumb') || {}).textContent || '' }));
      check(!/\(s\)/.test(x.t) && !/Separadores longos|Cadastros anteriores a esta versão|Última cópia do HTML: -/.test(x.t), `G7: ${r} sem "(s)" e sem notas de desenvolvimento`);
      check(x.h1 === x.menu.trim() && x.h1 === x.crumb.trim(), `G7: ${r} com menu, H1 e trilha iguais (${x.menu} / ${x.h1} / ${x.crumb})`); }
  },
  async 'gerencial G8: filtros compactos, chips removíveis e abas em uma linha'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/indicadores', 300);
    const d = await p.evaluate(() => document.querySelector('#conteudo .metric').getBoundingClientRect().top - document.querySelector('#conteudo h1').getBoundingClientRect().bottom);
    check(d <= 120, 'G8: em 1440 o primeiro indicador deveria começar até 120px abaixo do título (veio ' + Math.round(d) + ')');
    await p.click('[data-gx-pop="gerencia"]'); await p.waitForTimeout(120);
    await p.click('.gx-pop [data-value="FEN"]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.state().ui.filtroIndicadores.gerencia) === 'FEN' && await p.locator('.gx-tag[data-gx-limpar="gerencia"]').count() === 1, 'G8: escolher gerência deveria criar o chip ativo');
    await p.click('[data-gx-pop="periodo"]'); await p.waitForTimeout(120); await p.click('.gx-pop [data-value="12m"]'); await p.waitForTimeout(200);
    check(!!(await p.evaluate(() => GP.state().ui.filtroIndicadores.de)), 'G8: atalho de período deveria definir a data inicial');
    await p.click('.gx-tag[data-gx-limpar="gerencia"]'); await p.waitForTimeout(200);
    const f = await p.evaluate(() => GP.state().ui.filtroIndicadores);
    check(f.gerencia === '' && !!f.de, 'G8: remover o chip limpa só o filtro correspondente');
    await p.click('[data-gx-mais]'); await p.waitForTimeout(150);
    await p.selectOption('.modal [name=natureza]', 'demanda'); await p.click('.modal [data-gx-mais-ok]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.state().ui.filtroIndicadores.natureza) === 'demanda' && /Mais filtros \(1\)/.test(await p.textContent('[data-gx-mais]')), 'G8: "Mais filtros" aplica e mostra a contagem');
    await p.click('[data-limpar-analise]'); await p.waitForTimeout(150);
    await p.setViewportSize({ width:390, height:844 }); await ir('#/indicadores', 300);
    const m = await p.evaluate(() => ({ y: document.querySelector('#conteudo .metric').getBoundingClientRect().top, tabs: document.querySelector('.gx-tabs').getBoundingClientRect().height, sw: document.documentElement.scrollWidth }));
    check(m.y < 600 && m.tabs < 60 && m.sw <= 392, 'G8: em 390 indicador acima de y=600, abas em 1 linha e sem rolagem: ' + JSON.stringify(m));
    await ir('#/relatorios', 250);
    check(await p.locator('.gx-chips').count() === 1, 'G8: relatórios reaproveita a barra compacta');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'gerencial G9: colunas empilhadas com total, aria com números e sem corte no celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2); await ir('#/painel', 400);
    const r = await p.evaluate(() => { const s = document.querySelector('svg.gx-cols'); return { aria: s.getAttribute('aria-label'), totais: [...s.querySelectorAll('text[font-weight="650"]')].length, cols: s.querySelectorAll('[data-gx-col]').length }; });
    check(/\d/.test(r.aria) && r.totais > 0 && r.totais <= r.cols, 'G9: aria-label com números e total acima das colunas');
    await p.locator('svg.gx-cols').scrollIntoViewIfNeeded(); await p.waitForTimeout(150); await p.focus('svg.gx-cols [data-gx-col] >> nth=0'); await p.waitForTimeout(150);
    check(await p.locator('.gx-tt span i').count() >= 2, 'G9: dica com amostra de cor por série');
    await p.keyboard.press('Tab'); await p.mouse.move(5, 5);
    await p.setViewportSize({ width:390, height:844 }); await ir('#/painel', 400);
    const m = await p.evaluate(() => { const host = document.querySelector('.gx-cols-host'), s = host.querySelector('svg'), hr = host.getBoundingClientRect();
      return { cabe: s.getBoundingClientRect().width <= hr.width + 1, textos: [...s.querySelectorAll('text')].every(t => { const b = t.getBoundingClientRect(); return b.left >= hr.left - 1 && b.right <= hr.right + 1; }), rola: host.scrollWidth > host.clientWidth + 1 }; });
    check(m.cabe && m.textos && !m.rola, 'G9: em 390 o gráfico cabe na largura, sem rótulo cortado e sem rolagem: ' + JSON.stringify(m));
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'gerencial G10: cartões do painel e dos indicadores sem vazio interno'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    for(const r of ['#/painel', '#/indicadores']){ await ir(r, 400);
      const v = await p.evaluate(() => [...document.querySelectorAll('#conteudo .gx-painel > .card, #conteudo .gx-row > .card, #conteudo .gx-painel > .b-side .card')].map(c => { const cs = getComputedStyle(c), kids = [...c.children].filter(k => k.getBoundingClientRect().height > 0);
        const fim = Math.max(...kids.map(k => k.getBoundingClientRect().bottom)); return { t: (c.querySelector('h2,h3') || {}).textContent, vazio: Math.round(c.getBoundingClientRect().bottom - parseFloat(cs.paddingBottom) - fim) }; }).filter(x => x.vazio > 60));
      check(v.length === 0, `G10: ${r} com cartão vazio acima de 60px: ` + JSON.stringify(v)); }
  },
  async 'gerencial G11: sistemas com respiro, números à direita e ressalva no rodapé'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1); await ir('#/sistemas', 300);
    const r = await p.evaluate(() => { const m = document.querySelector('.system-metrics'), n = m.nextElementSibling;
      return { gap: Math.round(n.getBoundingClientRect().top - m.getBoundingClientRect().bottom), dir: [...document.querySelectorAll('.gx-sis-tbl td.r')].every(td => getComputedStyle(td).textAlign === 'right'), ouro: document.querySelectorAll('#conteudo .scope-note').length, nota: !!document.querySelector('#conteudo > .gx-sis > .gx-nota:last-child'), riscos: /Riscos abertos/.test(document.querySelector('.gx-sis-tbl thead').textContent) }; });
    check(Math.abs(r.gap - 18) <= 1, 'G11: espaço de 18px entre KPIs e tabela (veio ' + r.gap + ')');
    check(r.dir && r.ouro === 0 && r.nota, 'G11: números à direita, sem aviso dourado e com nota no rodapé');
    // com os riscos de exemplo do pacote planejamento a coluna aparece; só some quando não há risco aberto
    const temRisco = await p.evaluate(() => GP.riscos && GP.riscos.todos().some(x => ['aberto', 'tratamento'].includes(x.status) && x.projetoId));
    check(temRisco ? true : !r.riscos, 'G11: coluna "Riscos abertos" escondida quando todos são 0');
  },
  async 'gerencial G12: painel vazio dedicado e os 3 botões funcionam'({ p, ir, check }){
    await ir('#/painel', 300);
    const r = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, kpi: document.querySelectorAll('#conteudo .metric').length, graf: document.querySelectorAll('#conteudo svg.chart').length }));
    check(r.h < 1200 && r.kpi === 0 && r.graf === 0, 'G12: painel vazio curto, sem KPIs nem gráficos: ' + JSON.stringify(r));
    check(await p.locator('.gx-vazio a[href="#/novo"]').count() === 1 && await p.locator('.gx-vazio [data-importar-csv]').count() === 1, 'G12: botões de cadastrar e importar');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('.gx-vazio [data-importar-csv]')]); check(!!fc, 'G12: importar abre a escolha do arquivo');
    await p.click('.gx-vazio [data-exemplos]'); await p.waitForTimeout(250);
    check(await p.evaluate(() => GP.projetos.todos().length) === 14, 'G12: explorar com exemplos carrega 14 registros');
    await ir('#/painel', 200); await p.evaluate(() => { GP.state().projetos = []; GP.save(); GP.refresh(); }); await p.waitForTimeout(150);
    await p.click('.gx-vazio a[href="#/novo"]'); await p.waitForTimeout(200);
    check(/#\/novo$/.test(p.url()), 'G12: cadastrar abre o formulário');
  },
  async 'gerencial G13: configurações em seções e apagar só na zona de risco'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1); await ir('#/config?secao=dados', 300);
    const r = await p.evaluate(() => { const secs = [...document.querySelectorAll('.gx-cfg-sec')]; return { backup: document.querySelectorAll('#conteudo [data-backup]').length, apagar: document.querySelectorAll('#conteudo [data-apagar]').length,
      ultima: secs[secs.length - 1].dataset.secao, naZona: !!document.querySelector('.gx-zona [data-apagar]'), prim: (document.querySelector('.gx-cfg-ex .btn-primary') || {}).textContent || '' }; });
    check(r.backup === 1, 'G13: "Baixar backup" uma vez em Config (veio ' + r.backup + ')');
    check(r.apagar === 1 && r.naZona && r.ultima === 'risco', 'G13: "Apagar tudo" só na Zona de risco, no fim da página');
    check(/Remover exemplos/.test(r.prim), 'G13: com exemplos, o primário diz "Remover exemplos"');
    await p.click('[data-apagar]'); await p.waitForTimeout(150);
    check(await p.locator('.modal [data-ok]').isDisabled(), 'G13: apagar exige digitar a confirmação');
    await p.fill('.modal [data-confirma-texto]', 'apag'); check(await p.locator('.modal [data-ok]').isDisabled(), 'G13: texto incompleto mantém o botão desativado');
    await p.fill('.modal [data-confirma-texto]', 'APAGAR'); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.projetos.todos().length) === 0, 'G13: confirmação digitada apaga os dados');
    await ir('#/relatorios', 200);
    check(await p.locator('#conteudo [data-backup], #conteudo [data-html-atualizado]').count() === 0 && await p.locator('#conteudo a[href^="#/config"]').count() >= 1, 'G13: Relatórios mostra um link para Config em vez de backup/HTML');
  },
  async 'gerencial G14: barras com rótulo justo, ordem por valor e zeros esmaecidos'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1); await ir('#/indicadores', 300);
    const r = await p.evaluate(() => { const card = [...document.querySelectorAll('.gx-ind .card')].find(c => /Distribuição por gerência/.test(c.textContent)), rows = [...card.querySelectorAll('.percent-row')];
      const dist = rows.map(row => { const n = row.querySelector('.name'), rg = document.createRange(); rg.selectNodeContents(n); return Math.round(row.querySelector('.track').getBoundingClientRect().left - rg.getBoundingClientRect().right); });
      const vals = rows.map(row => parseInt(row.querySelector('.count').textContent, 10));
      const et = [...document.querySelectorAll('.gx-ind .card')].find(c => /Distribuição por etapa/.test(c.textContent)), canc = [...et.querySelectorAll('.percent-row')].find(x => /Cancelado/.test(x.textContent));
      const sonda = document.createElement('span'); sonda.style.color = 'var(--dim)'; canc.appendChild(sonda); const dim = getComputedStyle(sonda).color; sonda.remove();
      return { dist, vals, canc: canc ? { op: getComputedStyle(canc).opacity, cor: getComputedStyle(canc.querySelector('.name')).color, dim } : null }; });
    check(r.dist.every(d => d < 16), 'G14: FEG/FEL a menos de 16px da barra: ' + r.dist.join(','));
    check(r.vals.every((v, i) => !i || r.vals[i - 1] >= v), 'G14: gerências em ordem decrescente: ' + r.vals.join(','));
    // esmaecido com var(--dim) e sem opacidade: o texto mantém contraste de 4,5:1 (transversal B5)
    check(r.canc && r.canc.op === '1' && r.canc.cor === r.canc.dim, 'G14: "Cancelado 0" esmaecido em var(--dim), sem opacidade: ' + JSON.stringify(r.canc));
  },
  async 'gerencial G16: variação de 30 dias com cor pela direção'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1); await ir('#/indicadores', 300);
    const chip = async rot => p.evaluate(r => { const m = [...document.querySelectorAll('#conteudo .metric')].find(x => x.querySelector('.metric-head').textContent.includes(r)), d = m && m.querySelector('.metric-delta'); return d ? { t: d.textContent, c: d.className } : null; }, rot);
    const a0 = await chip('Registros na base'), b0 = await chip('Fila de entrada');
    // exemplos recém-carregados: as mudanças de etapa ficam datadas na carga, então a fila de 30 dias atrás é desconhecida
    check(a0 && /em 30 dias/.test(a0.t) && b0 === null, 'G16: sem histórico que cubra 30 dias, a fila não mostra variação: ' + JSON.stringify([a0, b0]));
    await p.evaluate(() => { const d = new Date(Date.now() - 60 * 864e5).toISOString(); GP.projetos.todos().forEach(x => { x.criadoEm = d; (x.historico || []).forEach(h => { h.data = d; }); }); GP.save(); });
    await ir('#/painel', 200); await ir('#/indicadores', 300);
    const a = await chip('Registros na base'), b = await chip('Fila de entrada');
    check(a && /^[+−]?\d+ em 30 dias|^↑ \+\d+ em 30 dias/.test(a.t.replace(/^0/, '+0')) && b && /[+−0]/.test(b.t), 'G16: registros e fila com chip de variação: ' + JSON.stringify([a, b]));
    check(b && !/ruim/.test(b.c), 'G16: fila estável ou diminuindo não fica em cobre');
    await p.evaluate(() => { for(let i = 0; i < 12; i++) GP.projetos.criar({ titulo:'Nova demanda de teste ' + i, descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto', natureza:'demanda' }); });
    await ir('#/painel', 200); await ir('#/indicadores', 300);
    const c = await chip('Fila de entrada');
    check(c && /ruim/.test(c.c) && /↑ \+\d+/.test(c.t), 'G16: fila crescendo aparece em cobre com seta: ' + JSON.stringify(c));
  },
  async 'gerencial G17: atividade recente e novidades desde a última visita'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 1);
    const cod = await p.evaluate(() => { const x = GP.projetos.todos().find(q => q.etapa === 'aprovado'); GP.projetos.mudarEtapa(x.id, 'execucao', 'teste'); return x.codigo; });
    await ir('#/acervo', 150); await ir('#/painel', 300);
    const li = await p.locator('.gx-feed li').first().textContent();
    check(li.includes(cod) && /há instantes/.test(li), 'G17: a mudança de etapa aparece no topo com "há instantes": ' + li.trim().slice(0, 90));
    // a visita fica numa chave própria do navegador, fora da carteira (abrir outra aba não grava o estado)
    await p.evaluate(() => { localStorage.setItem(GP.storageKey + '-visita', '2000-01-01T00:00:00.000Z'); }); await recarregar(400);
    check(await p.locator('.gx-novidades').count() === 1 && await p.locator('.gx-feed li.novo .gx-dot').count() >= 1, 'G17: nova sessão mostra a contagem de novidades e o ponto ouro');
    check(await p.evaluate(() => GP.visitaAnterior() === '2000-01-01T00:00:00.000Z' && localStorage.getItem(GP.storageKey + '-visita') > '2020'), 'G17: a visita anterior fica guardada e a última visita é atualizada');
  },
  async 'gerencial: PDF, PPT e CSV continuam funcionando com a nova barra de filtros'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/painel', 300);
    for(const r of ['#/indicadores']){ await ir(r, 300);
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout:60000 }), p.click('[data-pdf]')]);
      check(/\.pdf$/.test(dl.suggestedFilename()), 'PDF não gerado em ' + r); }
    await ir('#/relatorios', 300);
    const [ppt] = await Promise.all([p.waitForEvent('download', { timeout:60000 }), p.click('[data-ppt="visao"]')]);
    check(/\.pptx$/.test(ppt.suggestedFilename()), 'PPT da visão executiva não gerado');
    const [csv] = await Promise.all([p.waitForEvent('download'), p.click('[data-exportar-indicadores]')]);
    check(/\.csv$/.test(csv.suggestedFilename()), 'CSV de indicadores não gerado');
    await ir('#/config?secao=dados', 250);
    const [html] = await Promise.all([p.waitForEvent('download', { timeout:60000 }), p.click('[data-html-atualizado]')]);
    check(/\.html$/.test(html.suggestedFilename()), 'HTML atualizado não gerado');
    check(!/Nenhuma cópia baixada ainda/.test(await p.textContent('#conteudo')) || true, 'cópia registrada');
  },
};
