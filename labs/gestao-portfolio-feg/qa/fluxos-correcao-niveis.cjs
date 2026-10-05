/* Níveis: clicar de novo no nível ativo desativa o módulo (volta ao anterior); o nível 1 fica sempre ativo. */
module.exports = {
  async 'níveis: segundo clique no nível ativo desativa e volta ao anterior'({ p, ir, check }){
    await ir('#/painel', 200);
    await p.click('.topbar .seg [data-nivel="3"]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.nivel()) === 3, 'clicar no 3 deveria ativar o nível 3');
    check(/clique de novo para desativar/.test(await p.getAttribute('.topbar .seg [data-nivel="3"]', 'title')), 'nível ativo deveria explicar que um novo clique desativa');
    await p.click('.topbar .seg [data-nivel="3"]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.nivel()) === 2, 'clicar de novo no 3 deveria voltar ao nível 2');
    check(/Nível 3 desativado/.test(await p.locator('.toast').first().textContent()), 'aviso deveria confirmar a desativação');
    await p.click('.topbar .seg [data-nivel="2"]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.nivel()) === 1, 'clicar de novo no 2 deveria voltar ao nível 1');
    await p.click('.topbar .seg [data-nivel="1"]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.nivel()) === 1, 'o nível 1 não pode ser desativado');
    await p.evaluate(() => GP.setNivel(2)); await p.waitForTimeout(150);
    await p.evaluate(() => GP.explicarNiveis()); await p.waitForTimeout(200);
    await p.click('.modal button:has-text("Desativar nível 2")'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.nivel()) === 1, 'botão "Desativar nível 2" do guia deveria voltar ao nível 1');
  },
};
