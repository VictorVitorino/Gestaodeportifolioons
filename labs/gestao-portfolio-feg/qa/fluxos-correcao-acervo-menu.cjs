/* Acervo: ações por linha (⋯) com resumo rápido; menu lateral com grupos de nível recolhíveis. */
const exemplos = async (p, recarregar, n = 3) => { await p.evaluate(x => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = x; GP.save(); }, n); await recarregar(); };
module.exports = {
  async 'acervo: menu ⋯ por linha com ações, resumo rápido e excluir com desfazer'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/acervo', 300);
    check(await p.locator('[data-acoes]').count() === 14, 'cada linha do acervo deveria ter o botão de ações');
    await p.locator('[data-acoes]').nth(1).click(); await p.waitForTimeout(200);
    check(/#\/acervo/.test(p.url()), 'abrir o menu não deveria abrir a ficha');
    const itens = (await p.locator('.ac-pop [role=menuitem]').allTextContents()).join('|');
    check(/Resumo rápido/.test(itens) && /Editar cadastro/.test(itens) && /Mudar etapa/.test(itens) && /Excluir/.test(itens), 'menu deveria ter resumo, editar, mudar etapa e excluir: ' + itens);
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    check(await p.locator('.ac-pop').count() === 0 && await p.evaluate(() => document.activeElement.matches('[data-acoes]')), 'Esc deveria fechar e devolver o foco ao botão');
    await p.locator('[data-acoes]').nth(1).click(); await p.click('.ac-pop [data-ac="resumo"]'); await p.waitForTimeout(300);
    check(await p.locator('.rr-modal .rr-cel').count() >= 8, 'resumo rápido deveria mostrar os indicadores do projeto');
    await p.click('.rr-modal [data-rr="ficha"]'); await p.waitForTimeout(250);
    check(/#\/projeto\//.test(p.url()), '"Abrir ficha completa" deveria ir para a ficha');
    await ir('#/acervo', 250);
    await p.locator('[data-acoes]').last().scrollIntoViewIfNeeded(); await p.locator('[data-acoes]').last().click(); await p.waitForTimeout(200);
    const bb = await p.locator('.ac-pop').boundingBox();
    check(bb && bb.y >= 0 && bb.y + bb.height <= 900, 'menu da última linha deveria caber na tela');
    await p.keyboard.press('Escape');
    const antes = await p.evaluate(() => GP.projetos.todos().length);
    await p.locator('[data-acoes]').first().click(); await p.click('.ac-pop [data-ac="excluir"]'); await p.waitForTimeout(200); await p.click('.modal [data-ok]'); await p.waitForTimeout(300);
    check(await p.evaluate(() => GP.projetos.todos().length) === antes - 1 && /#\/acervo/.test(p.url()), 'excluir pelo menu deveria remover e continuar no acervo');
    await p.click('.toast .toast-act, .toast button'); await p.waitForTimeout(300);
    check(await p.evaluate(() => GP.projetos.todos().length) === antes, 'Desfazer deveria restaurar o projeto');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/acervo', 300);
    await p.locator('[data-acoes]').first().click(); await p.waitForTimeout(200);
    const b2 = await p.locator('.ac-pop').boundingBox();
    check(b2 && b2.x >= 0 && b2.x + b2.width <= 390, 'no celular o menu deveria caber na largura');
    await p.keyboard.press('Escape'); await p.setViewportSize({ width:1440, height:900 });
  },
  async 'menu lateral: grupos de nível expandem e recolhem e a escolha persiste'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/painel', 250);
    await p.click('.side [data-secao="n2"]'); await p.waitForTimeout(150);
    check(await p.locator('.side [data-grupo="n2"] .nav-item:visible').count() === 0 && await p.getAttribute('.side [data-secao="n2"]', 'aria-expanded') === 'false', 'recolher o Nível 2 deveria esconder seus itens');
    await recarregar(); await ir('#/painel', 250);
    check(await p.locator('.side [data-grupo="n2"].recolhido').count() === 1, 'grupo recolhido deveria persistir');
    await ir('#/ranking', 250);
    check(await p.locator('.side [data-grupo="n2"] .nav-item:visible').count() === 1, 'com o grupo recolhido, a tela atual continua visível');
    await p.click('.side [data-secao="n2"]'); await p.waitForTimeout(150);
    check(await p.locator('.side [data-grupo="n2"] .nav-item:visible').count() >= 4, 'expandir deveria mostrar os itens de novo');
  },
};
