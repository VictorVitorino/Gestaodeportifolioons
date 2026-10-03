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
};
