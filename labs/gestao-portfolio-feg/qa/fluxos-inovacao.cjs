/* Fluxos do pacote inovação: paleta de comandos, cadastro rápido, atalhos e modo comitê. Cada fluxo começa com o armazenamento limpo. */
const exemplos = async (p, recarregar, nivel = 1) => { await p.evaluate(n => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = n; GP.save(); }, nivel); await recarregar(); };
const paletaAberta = p => p.evaluate(() => !!document.querySelector('.cmdk-bg'));

module.exports = {
  async 'inovacao I1: Ctrl+K abre a paleta, código abre a ficha e guarda recente'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await ir('#/acervo', 200);
    await p.keyboard.press('Control+k'); await p.waitForTimeout(120);
    check(await paletaAberta(p), 'Ctrl+K deveria abrir a paleta');
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('.cmdk-input[role=combobox]')), 'foco deveria ir para o campo da paleta');
    check(await p.locator('.cmdk [role=listbox] [role=option]').count() > 0, 'paleta vazia deveria sugerir ações e telas');
    await p.keyboard.type('PRJ-013'); await p.waitForTimeout(80);
    const ativo = await p.evaluate(() => { const i = document.querySelector('.cmdk-input'), id = i.getAttribute('aria-activedescendant'); return id && document.getElementById(id) ? document.getElementById(id).textContent : ''; });
    check(/PRJ-013/.test(ativo), 'primeiro resultado ativo deveria ser PRJ-013: ' + ativo.slice(0, 60));
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const id = await p.evaluate(() => GP.projetos.todos().find(x => x.codigo === 'PRJ-013').id);
    check(p.url().endsWith('#/projeto/' + id), 'Enter deveria abrir a ficha de PRJ-013');
    check(!(await paletaAberta(p)), 'paleta deveria fechar depois de executar');
    check(await p.evaluate(i => (GP.state().ui.cmdRecentes || [])[0] === 'p:' + i, id), 'projeto aberto deveria entrar nos recentes');
    await p.keyboard.press('Control+k'); await p.waitForTimeout(100);
    check(/Recentes/i.test(await p.textContent('.cmdk-lista')) && /PRJ-013/.test(await p.textContent('.cmdk-lista')), 'paleta vazia deveria mostrar o recente');
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(40);
    check(await p.evaluate(() => document.querySelector('.cmdk-input').getAttribute('aria-activedescendant') === 'cmdk-op1'), 'seta para baixo deveria mover o item ativo');
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    check(!(await paletaAberta(p)), 'Esc deveria fechar a paleta');
  },
  async 'inovacao I1: tela de nível acima oferece ativar nível e Esc devolve o foco'({ p, ir, check }){
    await ir('#/painel', 200);
    await p.click('.topbar .cmdk-pill'); await p.waitForTimeout(100);
    check(await paletaAberta(p), 'pílula Buscar do topo deveria abrir a paleta');
    await p.keyboard.type('roadmap'); await p.waitForTimeout(80);
    const t = await p.textContent('.cmdk-item.on');
    check(/Roadmap/.test(t) && /Ativar nível 3/.test(t), '"roadmap" no nível 1 deveria mostrar "Ativar nível 3": ' + t.trim().slice(0, 80));
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('.topbar .cmdk-pill')), 'Esc deveria devolver o foco à pílula Buscar');
    await p.keyboard.press('Control+k'); await p.keyboard.type('roadmap'); await p.waitForTimeout(60); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    check(await p.evaluate(() => GP.nivel()) === 3 && /#\/roadmap$/.test(p.url()), 'escolher Roadmap deveria ativar o nível 3 e abrir a tela');
    await p.keyboard.press('Control+k'); await p.keyboard.type('xyzw inexistente'); await p.waitForTimeout(60);
    check(/Cadastrar “xyzw inexistente”/.test(await p.textContent('.cmdk-lista')), 'busca sem resultado deveria oferecer cadastrar com o título');
    await p.keyboard.press('Escape');
  },
  async 'inovacao I1: "/" só abre fora de campos; dock do celular abre a busca'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await ir('#/acervo', 200);
    await p.focus('[data-f="q"]'); await p.keyboard.type('/'); await p.waitForTimeout(80);
    check(!(await paletaAberta(p)), '"/" dentro de um campo não deveria abrir a paleta');
    check((await p.inputValue('[data-f="q"]')).includes('/'), '"/" deveria ser digitado no campo');
    await p.evaluate(() => document.activeElement.blur()); await p.keyboard.type('/'); await p.waitForTimeout(80);
    check(await paletaAberta(p), '"/" fora de campos deveria abrir a paleta');
    await p.keyboard.press('Escape');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/painel', 200);
    check(await p.locator('.dock .dock-busca').isVisible(), 'dock do celular deveria ter o botão Busca');
    check(!(await p.locator('.topbar .cmdk-pill').isVisible()), 'pílula do topo deveria sumir no celular');
    await p.click('.dock .dock-busca'); await p.waitForTimeout(120);
    check(await paletaAberta(p), 'Busca do dock deveria abrir a paleta');
    const r = await p.locator('.cmdk').boundingBox();
    check(r && r.x >= 0 && r.x + r.width <= 390, 'paleta deveria caber na largura do celular');
    await p.keyboard.press('Escape');
    check(await p.evaluate(() => document.documentElement.scrollWidth) <= 392, 'sem rolagem horizontal no celular com o dock ampliado');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'inovacao I2: N abre o cadastro rápido, valida, guarda rascunho e cria em Nova demanda'({ p, ir, check }){
    await ir('#/acervo', 200);
    await p.keyboard.press('n'); await p.waitForTimeout(150);
    check(await p.locator('.modal [data-rapido]').count() === 1, 'N deveria abrir o cadastro rápido');
    const nomes = await p.$$eval('.modal [data-rapido] [name]', l => [...new Set(l.map(x => x.name))]);
    check(nomes.length === 6, 'cadastro rápido deveria ter 6 campos: ' + nomes.join(','));
    check(await p.evaluate(() => document.activeElement && document.activeElement.name === 'titulo'), 'foco deveria começar no título');
    await p.click('.modal [data-rapido] [type=submit]'); await p.waitForTimeout(120);
    check(/obrigatório/i.test(await p.textContent('[data-err-r="titulo"]')) && /obrigatório/i.test(await p.textContent('[data-err-r="demandante"]')), 'envio vazio deveria mostrar erros inline');
    check(await p.evaluate(() => GP.projetos.todos().length) === 0, 'envio inválido não deveria criar registro');
    await p.fill('.modal [name=titulo]', 'Demanda rápida QA'); await p.waitForTimeout(450);
    check(await p.evaluate(() => (GP.state().ui.rascunhos || {}).rapido && GP.state().ui.rascunhos.rapido.titulo === 'Demanda rápida QA'), 'rascunho deveria ser gravado em S.ui.rascunhos.rapido');
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    await p.keyboard.press('n'); await p.waitForTimeout(150);
    check(await p.inputValue('.modal [name=titulo]') === 'Demanda rápida QA' && await p.locator('.modal [data-rapido-aviso]').count() === 1, 'rascunho deveria ser recuperado ao reabrir');
    await p.fill('.modal [name=descricao]', 'Descrição curta');
    await p.selectOption('.modal [name=gerencia]', 'FEN');
    await p.selectOption('.modal [name=tipo]', 'Projeto');
    await p.fill('.modal [name=demandante]', 'Área QA');
    await p.click('.modal [data-rapido] [type=submit]'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const l = GP.projetos.todos(); return { n: l.length, etapa: l[0] && l[0].etapa, nat: l[0] && l[0].natureza, rasc: !!(GP.state().ui.rascunhos || {}).rapido }; });
    check(r.n === 1 && r.etapa === 'entrada' && r.nat === 'demanda', 'cadastro rápido deveria criar 1 registro em Nova demanda: ' + JSON.stringify(r));
    check(!r.rasc, 'rascunho deveria ser limpo depois de cadastrar');
    check(await p.locator('.modal-bg').count() === 0, 'modal deveria fechar ao cadastrar');
    check(/Cadastrado/.test(await p.textContent('.toast')), 'aviso "Cadastrado" deveria aparecer');
    check(/Demanda rápida QA/.test(await p.textContent('#conteudo')), 'registro deveria aparecer no acervo');
  },
  async 'inovacao I2: formulário completo herda o que foi digitado'({ p, ir, check }){
    await ir('#/painel', 200);
    await p.evaluate(() => GP.cadastroRapido()); await p.waitForTimeout(120);
    await p.fill('.modal [name=titulo]', 'Levar ao formulário completo');
    await p.click('.modal [data-rapido-completo]'); await p.waitForTimeout(250);
    check(/#\/novo$/.test(p.url()) && await p.inputValue('[data-form] [name=titulo]') === 'Levar ao formulário completo', 'formulário completo deveria abrir com o título digitado');
  },
  async 'inovacao I3: G+A navega, ? abre a folha, desativar mantém Ctrl+K e campo não navega'({ p, ir, check }){
    await ir('#/painel', 200);
    check(/G A/.test(await p.getAttribute('.side .nav-item[href="#/acervo"]', 'data-tip')), 'dica do trilho deveria trazer o atalho G A');
    await p.keyboard.press('g'); await p.keyboard.press('a'); await p.waitForTimeout(200);
    check(/#\/acervo$/.test(p.url()), 'G depois A deveria abrir o acervo');
    await p.keyboard.type('?'); await p.waitForTimeout(120);
    check(await p.locator('.modal.atalhos-modal kbd').count() > 5, '"?" deveria abrir a folha de atalhos');
    await p.keyboard.press('Escape'); await p.waitForTimeout(80);
    await p.keyboard.press('g'); await p.keyboard.press('r'); await p.waitForTimeout(150);
    check(/#\/acervo$/.test(p.url()) && /nível 2/.test(await p.textContent('.toast')), 'G R no nível 1 não deveria navegar e deveria avisar do nível');
    await ir('#/novo', 200);
    await p.focus('[data-form] [name=titulo]'); await p.keyboard.type('ga'); await p.waitForTimeout(150);
    check(/#\/novo$/.test(p.url()) && await p.inputValue('[data-form] [name=titulo]') === 'ga', 'digitar "g" num campo não deveria navegar');
    await p.evaluate(() => document.activeElement.blur());
    await p.keyboard.press('Control+k'); await p.keyboard.type('desativar atalhos'); await p.waitForTimeout(60); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().ui.atalhos === false), 'ação da paleta deveria gravar S.ui.atalhos = false');
    await p.keyboard.press('g'); await p.keyboard.press('a'); await p.keyboard.type('?'); await p.keyboard.press('n'); await p.waitForTimeout(150);
    check(/#\/novo$/.test(p.url()) && await p.locator('.modal-bg').count() === 0, 'com atalhos desativados as teclas não deveriam agir');
    await p.keyboard.press('Control+k'); await p.waitForTimeout(80);
    check(await paletaAberta(p), 'Ctrl+K deveria continuar abrindo a paleta');
    await p.keyboard.press('Escape');
  },
  async 'inovacao I4: modo comitê pela paleta, decisão altera a carteira e registra histórico; ata copiada'({ p, ir, check, recarregar }){
    await p.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await exemplos(p, recarregar, 3);
    await ir('#/ranking', 200);
    await p.keyboard.press('Control+k'); await p.keyboard.type('modo comitê'); await p.waitForTimeout(80);
    check(/Modo comitê/.test(await p.textContent('.cmdk-item.on')), 'busca "modo comitê" deveria destacar a ação');
    await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    check(await p.locator('.comite[role=dialog]').isVisible(), 'modo comitê deveria abrir em tela cheia');
    const box = await p.locator('.comite').boundingBox();
    check(box && box.width >= 1430 && box.height >= 890, 'modo comitê deveria ocupar a tela toda');
    check(/Projeto 1 de \d+/.test(await p.textContent('.comite-cont')), 'contador deveria começar na lâmina 1');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(120);
    check(/Projeto 2 de \d+/.test(await p.textContent('.comite-cont')), '→ deveria avançar a lâmina');
    const cod = (await p.textContent('.comite-cod .code')).trim();
    const id = await p.evaluate(c => GP.projetos.todos().find(x => x.codigo === c).id, cod);
    const fte0 = await p.textContent('.comite-fte-l b');
    await p.click('.comite [data-decidir="in"]'); await p.waitForTimeout(150);
    check(await p.evaluate(i => GP.state().forcar[i] === 'in', id), '"Aprovar início" deveria gravar S.forcar = in');
    check(await p.getAttribute('.comite [data-decidir="in"]', 'aria-pressed') === 'true', 'botão da decisão deveria ficar marcado');
    check(await p.evaluate(i => { const h = GP.projetos.get(i).historico; return h[h.length - 1].acao === 'Decisão do comitê'; }, id), 'decisão deveria entrar no histórico como "Decisão do comitê"');
    check(typeof fte0 === 'string', 'contador de FTE deveria existir');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    check(await p.locator('.comite').count() === 0, 'Esc deveria sair do modo comitê');
    await ir('#/carteira', 250);
    const naCarteira = await p.evaluate(i => { const s = document.querySelector(`select[data-forcar="${i}"]`); if(s) return s.value === 'in'; return !!document.querySelector(`[data-forcar="${i}"][data-v="in"][aria-pressed="true"]`); }, id);
    check(naCarteira, 'carteira deveria mostrar o projeto fixado pela decisão do comitê');
    check(await p.evaluate(i => ['fixado', 'fixado_estoura'].includes(GP.modelo.montarCarteira(GP.projetos.todos(), GP.state().capacidade, GP.state().forcar).itens.find(x => x.p.id === i).status), id), 'situação na carteira deveria ser "fixado"');
    // botão Modo comitê da carteira + resumo + ata
    await p.click('#conteudo [data-comite]'); await p.waitForTimeout(200);
    check(await p.locator('.comite').count() === 1, 'botão Modo comitê da carteira deveria abrir o modo comitê');
    await p.keyboard.press('End'); await p.waitForTimeout(120);
    check(/Resumo da sessão/.test(await p.textContent('.comite-tit')), 'última lâmina deveria resumir a sessão');
    await p.click('.comite [data-comite-ata]'); await p.waitForTimeout(250);
    const clip = await p.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch(e){ return 'ERRO ' + e.message; } });
    check(/ATA · COMITÊ DE PORTFÓLIO/.test(clip) && /Período/.test(clip), '"Copiar ata" deveria pôr o texto na área de transferência: ' + clip.slice(0, 60));
    check(/Ata copiada/.test(await p.textContent('.comite-msg')), 'deveria confirmar a cópia da ata');
    await p.keyboard.press('Escape'); await p.waitForTimeout(150);
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('#conteudo [data-comite]')), 'foco deveria voltar ao botão Modo comitê');
  },
  async 'inovacao I4: comitê sem candidatos explica o que falta'({ p, check }){
    await p.evaluate(() => { GP.state().ui.nivel = 2; GP.save(); GP.comite.abrir('teste'); }); await p.waitForTimeout(150);
    check(/Nenhum projeto para deliberar/.test(await p.textContent('.comite')), 'sem candidatos deveria explicar');
    await p.click('.comite [data-comite-sair]'); await p.waitForTimeout(100);
    check(await p.locator('.comite').count() === 0 && await p.evaluate(() => !document.getElementById('app').hasAttribute('inert')), 'Sair deveria fechar e liberar a página');
  },
};
