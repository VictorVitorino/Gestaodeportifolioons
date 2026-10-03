/* Fluxos verificados pelo QA, acrescentados a cada passo. Cada fluxo começa com o armazenamento limpo. */
module.exports = {
  /* Passo 1 — base visual, menu recolhível, níveis */
  async 'passo1: logos e marca'({ p, ir, check }){
    check(await p.locator('.topbar img.ons').count() === 1, 'logo ONS ausente no topo');
    check(await p.locator('.brand svg.feg').count() === 1, 'logo FEG ausente no menu');
    const html = await p.content();
    check(!/maestro/i.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'ainda há referência a "maestro" na interface');
  },
  async 'passo1: menu recolhível com tooltip e persistência'({ p, ir, check, recarregar }){
    check(await p.locator('.shell.mini').count() === 0, 'menu deveria começar expandido');
    await p.click('[data-recolher]'); await p.waitForTimeout(150);
    check(await p.locator('.shell.mini').count() === 1, 'menu não recolheu');
    await p.hover('.nav-item[href="#/acervo"]'); await p.waitForTimeout(100);
    const tip = await p.locator('.tip').textContent().catch(() => '');
    check(/Acervo/.test(tip), 'tooltip não apareceu no menu recolhido');
    await recarregar();
    check(await p.locator('.shell.mini').count() === 1, 'estado recolhido não persistiu após recarregar');
    await p.click('[data-recolher]'); await p.waitForTimeout(100);
    check(await p.locator('.shell.mini').count() === 0, 'menu não expandiu de novo');
  },
  async 'passo1: níveis mostram/ocultam telas e explicam'({ p, ir, check }){
    check(await p.locator('.nav-item[href="#/ranking"]').count() === 0, 'nível 1 não deveria mostrar Ranking');
    await p.click('.seg [data-nivel="2"]'); await p.waitForTimeout(150);
    check(await p.locator('.nav-item[href="#/ranking"]').count() === 1, 'nível 2 deveria mostrar Ranking');
    check(await p.locator('.nav-item[href="#/carteira"]').count() === 0, 'nível 2 não deveria mostrar Carteira');
    await p.click('[data-ajuda-nivel]'); await p.waitForTimeout(100);
    check(await p.locator('.modal .lvl-card').count() === 3, 'explicação dos 3 níveis não abriu');
    await p.click('.modal [data-nivel="3"]'); await p.waitForTimeout(150);
    check(await p.locator('.nav-item[href="#/carteira"]').count() === 1, 'nível 3 deveria mostrar Carteira');
    await p.click('.seg [data-nivel="1"]'); await ir('#/carteira', 150);
    check(/nível 3/i.test(await p.textContent('#conteudo')), 'tela de nível superior deveria pedir ativação do nível');
  },
  /* Passo 2 — cadastro e acervo */
  async 'passo2: cadastro valida, cria, persiste e edita'({ p, ir, check, recarregar }){
    await ir('#/novo');
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(150);
    check(/obrigatório/.test(await p.textContent('[data-err="titulo"]')), 'cadastro vazio deveria mostrar erro no título');
    check(await p.evaluate(() => GP.projetos.todos().length) === 0, 'cadastro inválido não deveria criar projeto');
    await p.fill('[name=titulo]', 'Projeto QA de teste');
    await p.fill('[name=descricao]', 'Descrição de teste');
    await p.selectOption('[name=gerencia]', 'FEN');
    await p.fill('[name=demandante]', 'Área QA');
    await p.selectOption('[name=tipo]', 'Projeto');
    await p.fill('[name=link]', 'link-invalido');
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(150);
    check(/endereço/.test(await p.textContent('[data-err="link"]')), 'link inválido deveria ser recusado');
    await p.fill('[name=link]', 'https://dev.azure.com/ons/feg/1');
    await p.fill('[name=esforcoFte]', '1.5');
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(250);
    check(/#\/projeto\//.test(p.url()), 'após cadastrar deveria abrir a ficha');
    check(/PRJ-001/.test(await p.textContent('#conteudo')), 'código PRJ-001 não aparece na ficha');
    check(/Nova demanda/.test(await p.textContent('#conteudo')), 'projeto novo deveria estar em "Nova demanda"');
    await recarregar();
    check(/Projeto QA de teste/.test(await p.textContent('#conteudo')), 'projeto não persistiu após recarregar');
    await p.click('a.btn:has-text("Editar")'); await p.waitForTimeout(150);
    await p.fill('[name=titulo]', 'Projeto QA editado');
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(250);
    const txt = await p.textContent('#conteudo');
    check(/Projeto QA editado/.test(txt) && /Alterado: Título/.test(txt), 'edição não registrou no histórico');
  },
  async 'passo2: etapa exige motivo para não entra; exclusão confirma'({ p, ir, check }){
    const id = await p.evaluate(() => GP.projetos.criar({ titulo:'Projeto etapa QA', descricao:'x', gerencia:'FEG', demandante:'y', tipo:'Projeto' }).projeto.id);
    await ir('#/projeto/' + id);
    await p.click('[data-etapa]'); await p.check('input[name=et][value=nao_entra]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(150);
    check(await p.evaluate(i => GP.projetos.get(i).etapa, id) === 'entrada', '"Não entra" sem motivo não deveria ser aceito');
    await p.fill('.modal [name=motivo]', 'Fora do escopo da FE'); await p.click('.modal [data-ok]'); await p.waitForTimeout(150);
    check(await p.evaluate(i => GP.projetos.get(i).etapa, id) === 'nao_entra', 'mudança de etapa não aplicada');
    check(/Fora do escopo da FE/.test(await p.textContent('#conteudo')), 'motivo não aparece no histórico');
    await p.click('[data-excluir]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.projetos.todos().length) === 0, 'exclusão não removeu o projeto');
  },
  async 'passo2: acervo com exemplos, grupos, busca, filtro e ordenação'({ p, ir, check }){
    await ir('#/acervo');
    check(/Nenhum projeto cadastrado/.test(await p.textContent('#conteudo')), 'acervo vazio deveria orientar');
    await p.click('[data-exemplos]'); await p.waitForTimeout(250);
    const n = await p.evaluate(() => GP.projetos.todos().length);
    check(n === 14, `deveria carregar 14 exemplos (veio ${n})`);
    check(await p.locator('tbody tr').count() === 14, 'tabela do acervo deveria listar 14');
    await p.click('[data-grupo="fora"]'); await p.waitForTimeout(150);
    check(await p.locator('tbody tr').count() === 1, 'grupo "Não entram" deveria ter 1');
    await p.click('[data-grupo="todos"]'); await p.waitForTimeout(150);
    await p.fill('[data-f="q"]', 'DESSEM'); await p.waitForTimeout(450);
    check(await p.locator('tbody tr').count() === 3, 'busca por DESSEM deveria achar 3 (inclui PREV CARGA DESSEM)');
    check(await p.evaluate(() => document.activeElement && document.activeElement.dataset.f) === 'q', 'busca perdeu o foco ao digitar');
    await p.click('[data-limpar]'); await p.waitForTimeout(150);
    await p.selectOption('[data-f="gerencia"]', 'FEL'); await p.waitForTimeout(150);
    check(await p.locator('tbody tr').count() === 2, 'filtro FEL deveria achar 2');
    await p.click('[data-limpar]'); await p.waitForTimeout(150);
    await p.click('th[data-sort="acervo|codigo"]'); await p.click('th[data-sort="acervo|codigo"]'); await p.waitForTimeout(150);
    check(/PRJ-014/.test(await p.locator('tbody tr').first().textContent()), 'ordenação decrescente por código falhou');
    await ir('#/config'); await p.click('[data-exemplos]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.projetos.todos().length) === 14, 'carregar exemplos duas vezes não pode duplicar');
  },
  /* Passo 3 — funil de entrada */
  async 'passo3: checklist decide entra / falta informação / não entra'({ p, ir, check }){
    const id = await p.evaluate(() => GP.projetos.criar({ titulo:'Projeto funil QA', descricao:'d', beneficio:'b', gerencia:'FEN', demandante:'x', tipo:'Projeto' }).projeto.id);
    await ir('#/funil');
    check(await p.locator(`[data-entrada="${id}"]`).count() === 1, 'projeto novo deveria estar na fila de entrada');
    await p.click(`[data-entrada="${id}"]`); await p.waitForTimeout(150);
    check(await p.locator('.modal [data-registrar][disabled]').count() === 1, 'registrar deveria ficar bloqueado sem respostas');
    check(/O cadastro indica: <b>Não<\/b>/.test(await p.innerHTML('.modal')), 'sugestão do cadastro (patrocinador ausente) não apareceu');
    for(const q of ['E1','E2','E3','E4','E6']) await p.click(`.modal [data-q="${q}"][data-v="sim"]`);
    await p.click('.modal [data-q="E5"][data-v="nao"]');
    check(/Falta informação/.test(await p.textContent('.modal [data-resultado]')), 'resultado deveria ser "Falta informação"');
    await p.click('.modal [data-registrar]'); await p.waitForTimeout(200);
    check(await p.evaluate(i => GP.projetos.get(i).etapa, id) === 'triagem', 'falta de informação deveria levar a "Em triagem"');
    await p.click(`[data-entrada="${id}"]`); await p.waitForTimeout(150);
    await p.click('.modal [data-q="E5"][data-v="sim"]');
    check(/Entra no portfólio/.test(await p.textContent('.modal [data-resultado]')), 'todas "Sim" deveria dar "Entra"');
    await p.click('.modal [data-registrar]'); await p.waitForTimeout(200);
    check(await p.evaluate(i => GP.projetos.get(i).etapa, id) === 'aprovado', '"Entra" deveria aprovar o projeto');
    check(await p.locator(`[data-entrada="${id}"]`).count() === 0, 'projeto aprovado deveria sair da fila');
    await ir('#/projeto/' + id);
    check(/Entrada no portfólio/.test(await p.textContent('#conteudo')) && /Entra no portfólio/.test(await p.textContent('#conteudo')), 'ficha deveria mostrar o resultado da entrada');
    await p.click(`[data-entrada="${id}"]`); await p.click('.modal [data-q="E2"][data-v="nao"]'); await p.fill('.modal [name=obs]', 'Pertence a outra diretoria');
    await p.click('.modal [data-registrar]'); await p.waitForTimeout(200);
    const t = await p.textContent('#conteudo');
    check(/Fora do escopo da FE/.test(t) && /Pertence a outra diretoria/.test(t), 'motivo e observação do "Não entra" deveriam ir para o histórico');
  },
  async 'passo3: funil com exemplos e quadro por etapa'({ p, ir, check }){
    await p.evaluate(() => GP.modelo.carregarExemplos());
    await ir('#/funil');
    check(await p.locator('[data-entrada]').count() === 3, 'fila deveria ter 3 (2 novas demandas + 1 em triagem)');
    await ir('#/funil?aba=quadro');
    check(await p.locator('.quadro .col').count() === 8, 'quadro deveria ter 8 colunas (etapas)');
    check(await p.locator('.quadro .kcard').count() === 14, 'quadro deveria mostrar os 14 projetos');
  },
  /* Passo 4 — priorização */
  async 'passo4: avaliar projeto calcula nota e vai ao ranking'({ p, ir, check }){
    await p.evaluate(() => { const S = GP.state(); S.ui.nivel = 2; GP.save(); });
    const id = await p.evaluate(() => { const r = GP.projetos.criar({ titulo:'Projeto prioridade QA', descricao:'d', beneficio:'b', gerencia:'FEN', demandante:'x', patrocinador:'y', tipo:'Projeto', esforcoFte:2, duracaoMeses:6 }).projeto; GP.projetos.mudarEtapa(r.id, 'aprovado'); return r.id; });
    await ir('#/avaliar');
    check(await p.locator(`[data-avaliar="${id}"]`).count() === 1, 'projeto aprovado deveria estar na lista de avaliação');
    await ir('#/avaliar/' + id);
    check(await p.locator('.escala button.on[data-c="C1"][data-v="2"]').count() === 1, 'C1 deveria vir sugerido como 2 (12 pessoas-mês)');
    check(/Faltam 8/.test(await p.textContent('[data-resultado]')), 'resultado parcial deveria indicar 8 faltando');
    for(const [c, v] of [['V1',3],['V2',2],['V3',3],['V4',1],['V5',3],['V6',0],['C2',1],['C3',1]]) await p.click(`.escala [data-c="${c}"][data-v="${v}"]`);
    const res = await p.textContent('[data-resultado]');
    check(/73/.test(res) && /47/.test(res), 'nota deveria ser valor 73 / esforço 47: ' + res.replace(/\s+/g, ' ').slice(0, 80));
    check(/Ganho rápido/.test(res), 'quadrante deveria ser "Ganho rápido"');
    await p.click('[data-salvar]'); await p.waitForTimeout(250);
    check(/#\/ranking/.test(p.url()), 'após salvar deveria ir ao ranking');
    check(/Projeto prioridade QA/.test(await p.locator('tbody tr').first().textContent()), 'projeto deveria estar no topo do ranking');
    await ir('#/projeto/' + id);
    check(/Priorização/.test(await p.textContent('#conteudo')) && /Ganho rápido/.test(await p.textContent('#conteudo')), 'ficha deveria mostrar a priorização no nível 2');
  },
  async 'passo4: pesos precisam somar 100% e mudam o ranking'({ p, ir, check }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 2; GP.save(); });
    await ir('#/ranking');
    const antes = await p.locator('tbody tr').count();
    check(antes === 5, `ranking de aprovados deveria ter 5 (veio ${antes})`);
    check(/requisito regulatório/.test(await p.locator('tbody tr').first().textContent()), 'obrigatório deveria estar no topo');
    await p.click('[data-topo]'); await p.waitForTimeout(150);
    check(/requisito regulatório/.test(await p.locator('tbody tr').first().textContent()), 'sem "obrigatórios no topo" ele ainda lidera pela nota (73)');
    await ir('#/criterios');
    await p.$eval('[data-peso="V1"]', i => { i.value = 40; i.dispatchEvent(new Event('input')); });
    check(await p.locator('[data-salvar-pesos][disabled]').count() === 1, 'soma ≠ 100% deveria bloquear salvar');
    check(/115%/.test(await p.textContent('[data-soma="valor"]')), 'soma deveria mostrar 115%');
    await p.$eval('[data-peso="V2"]', i => { i.value = 5; i.dispatchEvent(new Event('input')); });
    check(await p.locator('[data-salvar-pesos][disabled]').count() === 0, 'soma = 100% deveria liberar salvar');
    await p.click('[data-salvar-pesos]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().criterios.find(c => c.id === 'V1').peso) === 40, 'peso não foi salvo');
    await p.click('[data-restaurar]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().criterios.find(c => c.id === 'V1').peso) === 25, 'restaurar sugestão falhou');
    await ir('#/matriz');
    check(await p.locator('[data-ponto]').count() === 5, 'matriz deveria mostrar 5 pontos (aprovados)');
    await p.click('[data-escopo="ativos"]'); await p.waitForTimeout(150);
    check(await p.locator('[data-ponto]').count() === 9, 'matriz "todos os ativos" deveria mostrar 9');
    await ir('#/acervo');
    check(/Valor/.test(await p.textContent('thead')), 'acervo no nível 2 deveria ter coluna Valor');
  },
  /* Passo 5 — painel */
  async 'passo5: painel vazio orienta e com exemplos mostra indicadores'({ p, ir, check }){
    await ir('#/painel');
    check(/Boas-vindas/.test(await p.textContent('#conteudo')), 'painel vazio deveria mostrar boas-vindas');
    await p.click('#conteudo [data-exemplos]'); await p.waitForTimeout(250);
    const t = await p.textContent('#conteudo');
    check(/Projetos no acervo\s*14/.test(t), 'KPI de acervo deveria ser 14');
    check(/Na fila de entrada\s*3/.test(t), 'KPI fila de entrada deveria ser 3');
    check(/Em execução\s*3/.test(t), 'KPI em execução deveria ser 3');
    check(/Precisa de atenção \(\d+\)/.test(t), 'bloco "Precisa de atenção" ausente');
    check(!/Top 5 da prioridade/.test(t), 'Top 5 só deveria aparecer no nível 2');
    await p.click('.seg [data-nivel="2"]'); await p.waitForTimeout(200);
    check(/Top 5 da prioridade/.test(await p.textContent('#conteudo')), 'Top 5 deveria aparecer no nível 2');
    const n = await p.locator('#conteudo a.att').count();
    check(n >= 3, `atenção deveria listar itens (veio ${n})`);
    await p.locator('#conteudo a.att').first().click(); await p.waitForTimeout(200);
    check(!/#\/painel/.test(p.url()), 'item de atenção deveria levar à tela de resolução');
  },
};
