/* Fluxos de integração entre pacotes (base, operação, priorização, planejamento, gerencial, inovação). */
const exemplos = async (p, recarregar, nivel = 3) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.save(); }, nivel); await recarregar(); };

module.exports = {
  async 'int: painel usa os status novos da carteira, pendentes da priorização e abre o modo comitê'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3); await ir('#/painel', 400);
    const esperado = await p.evaluate(() => GP.modelo.pendentesAvaliacao(GP.projetos.todos()).length);
    const fluxo = await p.evaluate(() => { const a = [...document.querySelectorAll('.operation-flow a, .gx-fluxo a, #conteudo a[href="#/avaliar"]')].find(x => /Avalia/i.test(x.textContent)); return a ? a.textContent : ''; });
    check(fluxo === '' || fluxo.includes(String(esperado)), `contagem de avaliação do painel deveria seguir pendentesAvaliacao (${esperado}): ${fluxo.replace(/\s+/g, ' ')}`);
    check(await p.locator('#conteudo .rk-mini .rk-cel').count() === 25, 'cartão de riscos do painel deveria trazer o mapa 5×5');
    const btn = p.locator('#conteudo .gx-dec [data-comite="painel"]');
    check(await btn.count() === 1, 'decisões pendentes deveriam oferecer o modo comitê');
    await btn.click(); await p.waitForTimeout(400);
    check(await p.evaluate(() => GP.comite && GP.comite.aberto()), 'botão deveria abrir o modo comitê');
    await p.evaluate(() => GP.comite.fechar()); await p.waitForTimeout(200);
  },
  async 'int: simulação de inícios em Indicadores conhece os status da carteira mês a mês'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 3);
    await p.evaluate(() => { GP.state().ui.abaIndicadores = 'custos'; GP.save(); }); await ir('#/indicadores', 400);
    const r = await p.evaluate(() => { const c = GP.modelo.montarCarteira(GP.projetos.todos(), GP.state().capacidade, GP.state().forcar);
      const conhecidos = Object.keys(GP.modelo.STATUS_CARTEIRA), soma = c.itens.filter(i => conhecidos.includes(i.status)).length;
      const txt = document.getElementById('conteudo').textContent; return { soma, n:c.itens.length, temAPartir: c.itens.some(i => i.status === 'cabe_a_partir'), mostra: /Cabe mais tarde/.test(txt), erro: /Erro ao montar/.test(txt) }; });
    check(!r.erro && r.soma === r.n, 'todos os status da carteira deveriam ser conhecidos: ' + JSON.stringify(r));
    check(!r.temAPartir || r.mostra, '"Cabe mais tarde" deveria aparecer na simulação quando existir');
  },
  async 'int: atalhos e paleta de comandos convivem com o foco do shell'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar, 2); await ir('#/acervo', 300);
    await p.keyboard.press('Control+k'); await p.waitForTimeout(250);
    check(await p.evaluate(() => GP.comandos && GP.comandos.aberta()), 'Ctrl+K deveria abrir a paleta de comandos');
    await p.keyboard.type('ranking'); await p.waitForTimeout(150); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    check(/#\/ranking/.test(p.url()), 'escolher "Ranking" na paleta deveria navegar');
    check(await p.evaluate(() => !document.getElementById('app').hasAttribute('inert')), 'fundo não deveria ficar inerte depois de fechar a paleta');
    const foco = await p.evaluate(() => document.activeElement && (document.activeElement.tagName + ':' + document.activeElement.textContent.trim().slice(0, 30)));
    check(/^H1:/.test(foco), 'depois de navegar o foco deveria ir para o título da tela (veio ' + foco + ')');
  },
};
