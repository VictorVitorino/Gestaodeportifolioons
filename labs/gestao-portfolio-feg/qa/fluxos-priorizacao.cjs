/* Fluxos do pacote "priorizacao": avaliar, ranking, matriz e critérios. Cada fluxo começa com o armazenamento limpo. */
const exemplos = async (p, recarregar, nivel = 2) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.save(); }, nivel); await recarregar(); };
const idDe = (p, cod) => p.evaluate(c => GP.projetos.todos().find(x => x.codigo === c).id, cod);
const responderTudo = async (p, mapa) => { for(const [c, v] of Object.entries(mapa)) await p.click(`.escala [data-c="${c}"][data-v="${v}"]`); };
const TUDO = { V1:0, V2:3, V3:2, V4:2, V5:1, V6:1, C1:1, C2:2, C3:1 };
const naTela = (p, sel) => p.evaluate(s => { const n = [...document.querySelectorAll(s)].find(x => x.offsetParent); if(!n) return false; const r = n.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }, sel);

module.exports = {
  async 'priorizacao P1: salvar avaliação completa abre o ranking com a linha destacada'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); const id = await idDe(p, 'PRJ-005');
    await ir('#/avaliar/' + id); await responderTudo(p, TUDO);
    await p.click('[data-salvar]'); await p.waitForTimeout(900);
    check(/#\/ranking/.test(p.url()), 'avaliação completa deveria abrir o ranking');
    // Correção 42: o escopo "ativos" (necessário para mostrar a triagem) vale só nesta visita, com aviso, e não é gravado
    check(await p.evaluate(() => GP.state().ui.rankEscopo) == null && await p.locator('[data-escopo="ativos"].on').count() === 1 && await p.locator('.pz-escopo-temp').count() === 1, 'escopo deveria mostrar "ativos" (triagem) só nesta visita, com aviso');
    check(await p.locator(`tr.destaque[data-rank-id="${id}"]`).count() === 1, 'linha do PRJ-005 deveria estar destacada');
    check(await naTela(p, `tr[data-rank-id="${id}"]`), 'linha do PRJ-005 deveria estar visível na tela');
  },
  async 'priorizacao P1: parcial volta à fila e "Salvar e avaliar o próximo" segue a fila'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); const id = await idDe(p, 'PRJ-005');
    const outro = await p.evaluate(() => { const r = GP.projetos.criar({ titulo:'Outro pendente QA', descricao:'d', gerencia:'FEN', demandante:'x', tipo:'Projeto' }).projeto; GP.projetos.mudarEtapa(r.id, 'aprovado'); return r.id; });
    await ir('#/avaliar/' + id); await p.click('.escala [data-c="V1"][data-v="2"]');
    check(!(await p.locator('[data-salvar-proximo]').isVisible()), '"Salvar e avaliar o próximo" só aparece com a avaliação completa');
    await p.click('[data-salvar]'); await p.waitForTimeout(300);
    check(/#\/avaliar$/.test(p.url()), 'avaliação parcial deveria voltar para #/avaliar');
    check(/faltam 8 respostas/.test(await p.textContent('.toast')), 'aviso deveria dizer quantas respostas faltam');
    await ir('#/avaliar/' + id); await responderTudo(p, TUDO);
    check(await p.locator('[data-salvar-proximo]').isVisible(), '"Salvar e avaliar o próximo" deveria aparecer');
    await p.click('[data-salvar-proximo]'); await p.waitForTimeout(300);
    check(p.url().endsWith('#/avaliar/' + outro), 'deveria abrir o próximo pendente');
    await p.click('.toast .toast-act'); await p.waitForTimeout(800);
    check(/#\/ranking/.test(p.url()) && await p.locator(`tr.destaque[data-rank-id="${id}"]`).count() === 1, '"Ver no ranking" deveria destacar o projeto salvo');
  },
  async 'priorizacao P2/P8: fila com pendentes no topo, pílulas distintas e cores da paleta'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/avaliar');
    const h = await p.locator('.av-grupo .sec-h h3').allTextContents();
    check(h[0] === 'A avaliar (1)' && /^Avaliados \(9\)$/.test(h[1] || ''), 'grupos deveriam ser "A avaliar (1)" e "Avaliados (9)": ' + h.join(' | '));
    check(/PRJ-005/.test(await p.locator('.av-grupo').first().locator('tbody tr').first().textContent()), 'PRJ-005 deveria abrir a fila');
    const nPend = await p.evaluate(() => GP.modelo.pendentesAvaliacao().length);
    check(nPend === 1 && /1 pendente/.test(await p.textContent('.av-prog')), 'contagem de pendentes deveria bater com M.pendentesAvaliacao()');
    check(!/\(s\)/.test(await p.textContent('#conteudo')), 'não deveria haver "(s)"');
    const pend = p.locator('[data-avaliar] .qpill.q-nao'), comp = p.locator('tr', { hasText:'PRJ-004' }).locator('.qpill.q-complementar');
    check(await pend.count() === 1 && await comp.count() === 1, 'PRJ-005 com "Não avaliado" e PRJ-004 com Complementar');
    const est = await p.evaluate(() => { const a = document.querySelector('.qpill.q-nao'), b = document.querySelector('.qpill.q-complementar'), s = x => getComputedStyle(x);
      return { bordaA: s(a).borderStyle, bordaB: s(b).borderStyle, fundoA: s(a).backgroundColor, fundoB: s(b).backgroundColor, gA: a.querySelector('svg').innerHTML, gB: b.querySelector('svg').innerHTML }; });
    check(est.bordaA === 'dashed' && est.bordaB !== 'dashed' && est.fundoA !== est.fundoB && est.gA !== est.gB, 'pílulas deveriam ter cor, borda e glifo distintos');
    check(await p.locator('.qpill:not(.q-sug)').evaluateAll(xs => xs.every(x => x.querySelector('svg.qg'))), 'toda pílula de quadrante deveria ter ícone');
    const fora = await p.evaluate(() => { const css = getComputedStyle(document.documentElement), tokens = ['--ons', '--slate', '--teal', '--copper'].map(t => css.getPropertyValue(t).trim().toLowerCase());
      return Object.values(GP.modelo.QUADRANTES).map(q => q.cor.toLowerCase()).filter(c => !tokens.includes(c)); });
    check(fora.length === 0, 'cores de QUADRANTES fora dos tokens de design.css: ' + fora.join(', '));
    check(await p.locator('.av-data').count() === 9, 'cada avaliado deveria mostrar a data da avaliação');
  },
  async 'priorizacao P3: matriz larga em 1024, lista realça a bolha'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await p.setViewportSize({ width:1024, height:768 }); await ir('#/matriz', 300);
    const w = await p.evaluate(() => document.querySelector('[data-mtz] svg').getBoundingClientRect().width);
    check(w >= 600, 'em 1024 o gráfico deveria ter pelo menos 600px (veio ' + Math.round(w) + ')');
    const item = p.locator('[data-mtz-item]').first(), id = await item.getAttribute('data-mtz-item');
    await item.hover(); await p.waitForTimeout(80);
    check(await p.locator(`[data-mtz] [data-ponto="${id}"].hl`).count() >= 1, 'passar o mouse no item deveria realçar a bolha');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/matriz', 300);
    check(await p.locator('.mtz-quads .mtz-q').count() === 4, 'cartões dos 4 quadrantes abaixo do gráfico');
    check(await p.evaluate(() => [...document.querySelectorAll('.mq-l a')].every(a => parseFloat(getComputedStyle(a).fontSize) >= 11)), 'lista dos quadrantes legível (≥ 11px)');
    await p.setViewportSize({ width:1440, height:900 });
    await p.evaluate(() => { GP.state().ui.rankEscopo = 'aguardando'; GP.state().projetos.forEach(x => delete x.avaliacao); GP.save(); }); await ir('#/painel'); await ir('#/matriz', 200);
    check(await p.locator('.mtz-fantasma .mf-q').count() === 4, 'matriz vazia deveria mostrar os 4 quadrantes fantasmas');
  },
  async 'priorizacao P4: ranking compacto em 1024 e cartões no celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await p.setViewportSize({ width:1024, height:768 }); await ir('#/ranking', 250);
    // Em 1024 o ranking aparece como tabela ou como lista compacta, conforme a largura útil (com ou sem o menu recolhido)
    const m = await p.evaluate(() => [...document.querySelectorAll('.rk-tabela tbody tr, .rank-cards .rc')].filter(x => x.offsetParent).map(tr => { const l = tr.querySelector('.rk-l1, .rc-t'); return { h: tr.getBoundingClientRect().height, linhas: Math.round(l.getBoundingClientRect().height / parseFloat(getComputedStyle(l).lineHeight)) }; }));
    check(m.length === 5 && m.every(x => x.h <= 110 && x.linhas <= 2), 'linhas do ranking em 1024 deveriam ter ≤110px e título ≤2 linhas: ' + JSON.stringify(m));
    await p.setViewportSize({ width:360, height:780 }); await ir('#/ranking', 250);
    const c = await p.evaluate(() => [...document.querySelectorAll('.rank-cards .rc')].map(a => { const pos = a.querySelector('.rc-pos').getBoundingClientRect(), cod = a.querySelector('.rc-h .code').getBoundingClientRect(); return { h: a.getBoundingClientRect().height, mesmaLinha: Math.abs(pos.top + pos.height / 2 - (cod.top + cod.height / 2)) < 6 }; }));
    check(c.length === 5 && c.every(x => x.h <= 200 && x.mesmaLinha), 'cartões em 360 deveriam ter ≤200px e a posição na linha do código: ' + JSON.stringify(c));
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'priorizacao P5/P6/P13: peso legível, esforço em ardósia e sugestões a confirmar'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); const id = await idDe(p, 'PRJ-005');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/avaliar/' + id, 250);
    const hs = await p.locator('.peso-chip').evaluateAll(xs => xs.map(x => Math.round(x.getBoundingClientRect().height)));
    check(hs.length === 9 && hs.every(h => h >= 18 && h <= 26), 'etiquetas de peso deveriam ter 1 linha (18-26px): ' + hs.join(','));
    await p.setViewportSize({ width:1440, height:900 });
    check(/^Peso 25% · vale até 25 pts$/.test((await p.locator('.peso-chip').first().textContent()).trim()), 'chip deveria dizer "Peso 25% · vale até 25 pts"');
    check(await p.locator('.aval-bloco .sec-h p', { hasText:'pesos somam 100%' }).count() === 2, 'cada eixo deveria indicar que os pesos somam 100%');
    check(/1 de 9/.test(await p.textContent('.crit-n')), 'perguntas deveriam ser numeradas');
    check(await p.locator('.escala button.sug[data-c="C1"] .es-sug').isVisible(), '"Esforço da equipe" deveria abrir com a sugestão tracejada');
    check(/Faltam 8/.test(await p.textContent('[data-resultado]')) && /1 sugestão a confirmar/.test(await p.textContent('[data-resultado]')), 'contador deveria separar sugestões');
    await p.click('[data-aceitar-sug]'); await p.waitForTimeout(80);
    check(await p.locator('.escala button.on[data-c="C1"][data-v="1"]').count() === 1 && !/sugestão a confirmar/.test(await p.textContent('[data-resultado]')), '"Aceitar sugestões" deveria virar resposta');
    const cor = await p.evaluate(() => getComputedStyle(document.querySelector('.escala button.on[data-c="C1"]')).borderTopColor);
    check(cor === 'rgb(71, 123, 145)', 'opção marcada no esforço deveria ser ardósia (veio ' + cor + ')');
    await responderTudo(p, { C2:1, C3:1 });
    check(/quanto menor, melhor/.test(await p.textContent('[data-resultado]')), 'resultado deveria dizer "quanto menor, melhor"');
  },
  async 'priorizacao P7: escala com uma parada de Tab por pergunta, setas e teclas 0 a 3'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); const id = await idDe(p, 'PRJ-005'); await ir('#/avaliar/' + id, 250);
    check(await p.locator('.escala [data-c][tabindex="0"]').count() === 9, '9 perguntas → 9 paradas de Tab');
    await p.focus('.escala [data-c="V2"][tabindex="0"]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(60);
    check(await p.evaluate(() => document.activeElement.dataset.c === 'V2' && document.activeElement.dataset.v === '1' && document.activeElement.classList.contains('on')), 'ArrowRight deveria mover foco e seleção');
    await p.keyboard.press('2'); await p.waitForTimeout(60);
    check(await p.locator('.escala button.on[data-c="V2"][data-v="2"]').count() === 1, 'tecla "2" deveria marcar a opção 2');
    check(await p.locator('.escala button.on[data-c="V2"] .es-ok').isVisible(), 'opção marcada deveria mostrar o check');
    check(await p.locator('[data-resultado] [aria-live="polite"][aria-atomic="true"]').count() === 1, 'resultado deveria ter região viva');
    await responderTudo(p, TUDO);
    check(/^Valor \d+, Esforço \d+, quadrante /.test(await p.textContent('[data-ar-frase]')), 'região viva deveria anunciar valor, esforço e quadrante');
  },
  async 'priorizacao P9: resultado abaixo do cabeçalho e barra fixa no celular'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); const id = await idDe(p, 'PRJ-005'); await ir('#/avaliar/' + id, 250);
    await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(150);
    const r = await p.evaluate(() => ({ res: document.querySelector('.aval-res').getBoundingClientRect().top, top: document.querySelector('.topbar').getBoundingClientRect().bottom }));
    check(r.res >= r.top, 'cartão Resultado deveria ficar abaixo do cabeçalho: ' + JSON.stringify(r));
    await p.setViewportSize({ width:390, height:844 }); await ir('#/painel'); await ir('#/avaliar/' + id, 250);
    await p.click('.escala [data-c="V1"][data-v="1"]');
    check(await p.locator('.aval-barra').isVisible() && /1\/9/.test(await p.textContent('.aval-barra')), 'barra fixa deveria mostrar o progresso');
    check(await naTela(p, '[data-salvar-barra]'), 'Salvar da barra deveria estar visível sem rolar');
    await p.click('[data-ar-abrir]'); await p.waitForTimeout(150);
    check(await p.locator('.modal .aval-folha').count() === 1, 'resumo da barra deveria abrir o resultado completo');
    await p.click('.modal .m-act [data-close]'); await p.waitForTimeout(100);
    await p.click('[data-salvar-barra]'); await p.waitForTimeout(250);
    check(/#\/avaliar$/.test(p.url()) && await p.evaluate(i => GP.projetos.get(i).avaliacao.respostas.V1 === 1, id), 'Salvar da barra deveria gravar a avaliação');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'priorizacao P10/P17: guarda de saída, prévia, barra de pesos, Desfazer e versões'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/criterios', 200);
    check(!(await p.locator('[data-normalizar="valor"]').isVisible()), 'com soma 100% o "Ajustar para 100%" não aparece');
    await p.$eval('[data-peso="V1"]', i => { i.value = 40; i.dispatchEvent(new Event('input')); });
    check(await p.locator('[data-normalizar="valor"]').isVisible(), 'com soma ≠ 100% o "Ajustar para 100%" aparece');
    check(await p.locator('[data-barra="valor"] .pb-excesso').count() === 1, 'excesso deveria aparecer hachurado na barra');
    check(await p.locator('[data-barra="valor"] .pb-seg').count() === 6, 'barra deveria ter um trecho por pergunta');
    await p.click('.nav-item[href="#/ranking"]'); await p.waitForTimeout(200);
    check(await p.locator('.modal', { hasText:'Descartar pesos não salvos?' }).count() === 1, 'sair com rascunho deveria pedir confirmação');
    await p.click('.modal .m-act [data-close]'); await p.waitForTimeout(150);
    check(/#\/criterios/.test(p.url()) && /115%/.test(await p.textContent('[data-soma="valor"]')), 'cancelar deveria manter o rascunho');
    await p.evaluate(() => { location.hash = '#/painel'; }); await p.waitForTimeout(200);
    check(await p.locator('.modal', { hasText:'Descartar pesos não salvos?' }).count() === 1 && /#\/criterios/.test(p.url()) && /115%/.test(await p.textContent('[data-soma="valor"]')), 'troca de rota fora do menu deveria voltar aos critérios com o rascunho e pedir confirmação');
    await p.click('.modal .m-act [data-close]'); await p.waitForTimeout(150);
    await p.$eval('[data-peso="V2"]', i => { i.value = 5; i.dispatchEvent(new Event('input')); });
    check(await p.locator('.crit-previa .tag', { hasText:'obrigatório' }).count() >= 1 && /Projetos aprovados \(5\)/.test(await p.textContent('.crit-previa')), 'prévia deveria listar os aprovados com a tag obrigatório');
    await p.$eval('[data-peso="V3"]', i => { i.value = 0; i.dispatchEvent(new Event('input')); });
    await p.$eval('[data-peso="V6"]', i => { i.value = 30; i.dispatchEvent(new Event('input')); });
    check(await p.locator('.crit-previa .pv-mov.sobe, .crit-previa .pv-mov.desce').count() >= 1, 'prévia deveria mostrar setas de movimento');
    await p.fill('[name=motivo]', 'Teste v1'); await p.click('[data-salvar-pesos]'); await p.waitForTimeout(200);
    await p.$eval('[data-peso="V6"]', i => { i.value = 20; i.dispatchEvent(new Event('input')); });
    await p.$eval('[data-peso="V3"]', i => { i.value = 10; i.dispatchEvent(new Event('input')); });
    await p.click('[data-salvar-pesos]'); await p.waitForTimeout(200);
    const vs = await p.evaluate(() => GP.state().ui.versoesPesos.map(v => [v.n, v.motivo, !!v.data]));
    check(vs.length === 2 && vs[0][0] === 1 && vs[1][0] === 2 && vs[0][1] === 'Teste v1' && vs[1][2], 'salvar duas vezes deveria gerar v1 e v2: ' + JSON.stringify(vs));
    await ir('#/ranking'); check(/Pesos v2 · \d\d\/\d\d\/\d{4}/.test(await p.textContent('.pz-versao')), 'ranking deveria mostrar o selo da versão atual');
    await ir('#/criterios'); await p.click('[data-restaurar-versao="1"]'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => ({ v3: GP.state().ui.versoesPesos.at(-1).n, v6: GP.state().criterios.find(c => c.id === 'V6').peso }));
    check(r.v3 === 3 && r.v6 === 30, 'restaurar a v1 deveria reaplicar os pesos e criar a v3: ' + JSON.stringify(r));
    await p.click('[data-restaurar]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().criterios.find(c => c.id === 'V1').peso) === 25, 'restaurar sugestão deveria voltar aos pesos iniciais');
    await p.click('.toast .toast-act'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().criterios.find(c => c.id === 'V1').peso) === 40, 'Desfazer deveria restaurar os pesos anteriores');
    await p.$eval('[data-peso="V1"]', i => { i.value = 41; i.dispatchEvent(new Event('input')); });
    await p.click('.nav-item[href="#/ranking"]'); await p.waitForTimeout(150); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
    check(/#\/ranking/.test(p.url()), 'confirmar o descarte deveria seguir para a tela escolhida');
  },
  async 'priorizacao P11/P12/P15: escopos, pendentes como lista, classes, empates, síntese e pódio'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/ranking', 200);
    for(const esc of ['aguardando', 'todos']){
      await p.evaluate(e => { GP.state().ui.rankEscopo = e; GP.save(); }, esc); await ir('#/painel'); await ir('#/ranking', 200);
      const pend = await p.locator('.pz-pend').textContent().catch(() => '');
      check(!/PRJ-011|PRJ-007|PRJ-010/.test(pend), `escopo ${esc}: não entra/entrada não deveriam aparecer como sem avaliação`);
      check(await p.locator('.pz-pend .chip').count() === 0, 'pendentes não deveriam usar .chip');
      check(await p.locator('details').count() === 0, 'não deveria sobrar <details>');
    }
    check(!/Ordem sugerida/.test(await p.textContent('.page-h')) && /PRJ-009/.test(await p.textContent('.rk-tabela')), 'histórico mostra o PRJ-009 sem chamar de ordem sugerida para começar');
    check(await p.locator('.pz-podio').count() === 0, 'histórico não deveria ter pódio');
    await p.evaluate(() => { GP.state().ui.rankEscopo = 'ativos'; GP.save(); }); await ir('#/painel'); await ir('#/ranking', 200);
    const linhas = await p.locator('.rk-tabela tbody tr').evaluateAll(trs => trs.map(tr => ({ pos: tr.querySelector('.rk-pos').textContent, eq: !!tr.querySelector('.rk-eq'), letra: !!tr.querySelector('.nota .nota-l'), marcas: tr.querySelectorAll('.rk-meter b').length })));
    check(linhas.every(l => l.letra), 'cada nota deveria ter a letra da classe');
    check([5, 6, 7].every(i => linhas[i] && linhas[i].eq) && !linhas[4].eq && !linhas[8].eq, 'posições 6 a 8 (empate em 42) deveriam mostrar "=": ' + JSON.stringify(linhas.map(l => l.pos)));
    check(linhas.every(l => l.marcas === 2), 'barra de valor deveria ter marcas em 40 e 70');
    check(/A ≥70 · B ≥40/.test(await p.textContent('.rk-tabela thead')), 'cabeçalho deveria trazer a legenda das classes');
    check(await p.locator('.rk-tabela thead th').evaluateAll(ths => ths.every(t => t.textContent.trim())), 'nenhuma coluna sem título');
    const pod = await p.locator('.pd-card .code').allTextContents(), top = await p.locator('.rk-tabela tbody tr .code').evaluateAll(xs => xs.slice(0, 3).map(x => x.textContent));
    check(JSON.stringify(pod) === JSON.stringify(top), 'pódio deveria mostrar os 3 primeiros do ranking atual');
    await p.locator('.rk-tabela tbody tr .nota').first().hover(); await p.waitForTimeout(80);
    const tt = await p.locator('.gp-tt').textContent().catch(() => '');
    check(/Maiores contribuições/.test(tt) && (tt.match(/\+\d+/g) || []).length === 3, 'dica do selo deveria trazer as 3 maiores contribuições: ' + tt);
    const seg = p.locator('.ps-seg[data-filtro-q="estrategico"]'), n = +(await seg.textContent());
    await seg.click(); await p.waitForTimeout(150);
    check(await p.locator('.rk-tabela tbody tr').count() === n && await p.locator('.rk-tabela .qpill.q-estrategico').count() === n, 'clicar no segmento deveria filtrar pelo quadrante');
    await ir('#/matriz', 250);
    check(await p.locator('.pz-sintese').count() === 1 && await p.locator('[data-mtz] [data-ponto]').count() === n, 'matriz deveria abrir com a síntese e respeitar o filtro');
    await p.click('.pz-fq'); await p.waitForTimeout(150);
    check(await p.locator('[data-mtz] [data-ponto]').count() === 9, 'remover o filtro deveria mostrar os 9 ativos');
  },
  async 'priorizacao P14/P16: "Por que esta nota?" soma a nota e histórico com vírgula'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); const id = await idDe(p, 'PRJ-001');
    await ir('#/projeto/' + id, 200);
    const soma = await p.evaluate(() => [...document.querySelectorAll('.ficha-dc .dc-valor .dc-slot')].reduce((a, s) => a + +s.dataset.pontos, 0));
    check(Math.abs(soma - 65) <= 0.5, 'segmentos do valor do PRJ-001 deveriam somar 65 (veio ' + soma + ')');
    await ir('#/avaliar/' + id, 200);
    const antes = await p.evaluate(() => [...document.querySelectorAll('[data-resultado] .dc-valor .dc-slot')].map(s => s.dataset.pontos).join());
    await p.click('.escala [data-c="V1"][data-v="3"]');
    const depois = await p.evaluate(() => [...document.querySelectorAll('[data-resultado] .dc-valor .dc-slot')].map(s => s.dataset.pontos).join());
    check(antes && antes !== depois, 'barra deveria mudar a cada clique');
    check(/Maior oportunidade/.test(await p.textContent('[data-resultado]')), 'decomposição deveria apontar a maior oportunidade');
    await p.click('[data-salvar]'); await p.waitForTimeout(300);
    const h = await p.evaluate(i => GP.projetos.get(i).historico.filter(x => x.acao === 'Priorização').at(-1).detalhe, id);
    check(/^Valor \d+,\d · esforço \d+,\d · /.test(h), 'histórico deveria gravar com vírgula: ' + h);
  },
};
