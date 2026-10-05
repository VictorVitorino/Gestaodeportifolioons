/* Níveis como módulos: clicar num nível ligado desliga ele e os de cima; num desligado liga até ele; o nível 1 fica sempre ativo. */
module.exports = {
  async 'níveis: interruptores de módulo no seletor do topo e no guia'({ p, ir, check }){
    await ir('#/painel', 200);
    const nivel = () => p.evaluate(() => GP.nivel());
    const ligados = () => p.evaluate(() => [...document.querySelectorAll('.topbar .seg [data-nivel]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.nivel).join(''));
    await p.click('.topbar .seg [data-nivel="3"]'); await p.waitForTimeout(200);
    check(await nivel() === 3 && await ligados() === '123', 'clicar no 3 deveria ligar 1, 2 e 3');
    check(/clique para desativar/.test(await p.getAttribute('.topbar .seg [data-nivel="2"]', 'title')), 'nível ligado deveria explicar que o clique desativa');
    await p.click('.topbar .seg [data-nivel="3"]'); await p.waitForTimeout(200);
    check(await nivel() === 2 && await ligados() === '12', 'clicar de novo no 3 deveria desligar só o 3');
    check(/Nível 3 desativado/.test(await p.locator('.toast').first().textContent()), 'aviso deveria confirmar a desativação');
    await p.click('.topbar .seg [data-nivel="3"]'); await p.waitForTimeout(200);
    await p.click('.topbar .seg [data-nivel="2"]'); await p.waitForTimeout(200);
    check(await nivel() === 1 && await ligados() === '1', 'com o 3 ligado, clicar no 2 deveria desligar 2 e 3');
    await p.click('.topbar .seg [data-nivel="1"]'); await p.waitForTimeout(200);
    check(await nivel() === 1 && /sempre ativo/.test(await p.locator('.toast').first().textContent()), 'o nível 1 não desliga e o aviso explica');
    await p.click('.topbar .seg [data-nivel="2"]'); await p.waitForTimeout(200);
    check(await nivel() === 2, 'clicar no 2 desligado deveria ligá-lo');
    await p.evaluate(() => GP.explicarNiveis()); await p.waitForTimeout(200);
    await p.click('.modal button:has-text("Desativar nível 2")'); await p.waitForTimeout(200);
    check(await nivel() === 1, 'botão "Desativar nível 2" do guia deveria voltar ao nível 1');
  },
};
