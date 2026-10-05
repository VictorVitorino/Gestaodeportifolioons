/* Regressão: botão de expandir/recolher o trilho visível e funcional em larguras de notebook (901–1279px). */
module.exports = {
  async 'trilho: em notebook (1024 e 1280) o botão de expandir aparece, expande, persiste e recolhe'({ p, ir, check, recarregar }){
    for(const w of [1024, 1279]){
      await p.setViewportSize({ width:w, height:768 }); await recarregar(); await ir('#/painel', 250);
      check(await p.locator('.shell.mini').count() === 1, `${w}px: trilho deveria abrir recolhido por padrão`);
      check(await p.locator('.side .nav-toggle').isVisible(), `${w}px: botão de expandir deveria estar visível no trilho recolhido`);
      await p.click('.side .nav-toggle'); await p.waitForTimeout(200);
      check(await p.locator('.shell.mini').count() === 0, `${w}px: clicar deveria expandir o trilho`);
      check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${w}px: trilho expandido não deveria gerar rolagem horizontal`);
      await recarregar(); await ir('#/painel', 250);
      check(await p.locator('.shell.mini').count() === 0, `${w}px: escolha de expandir deveria persistir após recarregar`);
      await p.click('.side .nav-toggle'); await p.waitForTimeout(200);
      check(await p.locator('.shell.mini').count() === 1, `${w}px: clicar de novo deveria recolher`);
    }
    await p.setViewportSize({ width:1440, height:900 });
  },
};
