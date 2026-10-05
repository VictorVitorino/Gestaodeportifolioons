/* Ambientes de cor por área: cada área muda o clima do canvas e do trilho, dentro da paleta. */
module.exports = {
  async 'ambiente: cada área tem seu clima de cor e ele muda ao trocar de tela'({ p, ir, check }){
    await p.evaluate(() => GP.setNivel(3));
    const esperado = { '#/painel':'gerencial', '#/acervo':'operacao', '#/ranking':'priorizacao', '#/carteira':'planejamento', '#/config':'config' };
    const fundos = {};
    for(const [r, amb] of Object.entries(esperado)){
      await ir(r, 900);
      const v = await p.evaluate(() => ({ amb: document.documentElement.dataset.ambiente, bot: getComputedStyle(document.documentElement).getPropertyValue('--amb-bot').trim() }));
      check(v.amb === amb, `${r} deveria usar o ambiente ${amb} (veio ${v.amb})`);
      fundos[amb] = v.bot;
    }
    check(new Set(Object.values(fundos)).size === 5, 'os 5 ambientes deveriam ter fundos diferentes: ' + JSON.stringify(fundos));
  },
};
