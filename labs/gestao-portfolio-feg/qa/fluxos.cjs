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
};
