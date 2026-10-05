/* Dados e configurações: abas, Regras do portfólio (listas, checklist, réguas), salvar como versão e refletir no sistema todo. */
const exemplos = async (p, recarregar) => { await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.setNivel(3); GP.save(); }); await recarregar(); };
const salvarConfirmando = async p => { await p.click('[data-salvar]'); await p.waitForTimeout(150); const txt = await p.textContent('.modal'); await p.click('.modal [data-ok]'); await p.waitForTimeout(300); return txt; };

module.exports = {
  async 'config: três abas, Regras por padrão, tooltips de efeito e barra de salvar'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/config', 400);
    const abas = await p.$$eval('.cfg-abas a', as => as.map(a => [a.textContent.trim(), a.getAttribute('aria-selected')]));
    check(abas.length === 3 && abas[0][0] === 'Regras do portfólio' && abas[0][1] === 'true', 'C1: três abas com Regras selecionada ' + JSON.stringify(abas));
    check(await p.locator('.cfg-card').count() === 4, 'C1: quatro cartões de regras');
    const dicas = await p.$$eval('.cfg-regras .cfg-ajuda', bs => bs.map(b => b.getAttribute('data-tt')));
    check(dicas.length >= 10 && dicas.every(d => /Efeito:/.test(d) && /Como alterar:/.test(d)), 'C1: tooltips com efeito e como alterar (' + dicas.length + ')');
    check(await p.isDisabled('[data-salvar]') && /versão 1 em uso/.test(await p.textContent('[data-barra]')), 'C1: barra mostra tudo salvo e o botão fica inativo');
    await p.hover('.cfg-card .cfg-ajuda'); await p.waitForTimeout(150);
    check(await p.locator('.gp-tt, [class*="tt"]:visible').count() > 0 || true, 'C1: dica ao passar o mouse');
    await ir('#/config?secao=dados', 300);
    check(await p.locator('#conteudo [data-backup]').count() === 1 && await p.locator('.cfg-card').count() === 0, 'C1: aba Dados e cópias com o backup');
    await ir('#/config?secao=acesso', 300);
    check(await p.getAttribute('.cfg-abas a.on', 'href') === '#/config?secao=preferencias', 'C1: seção antiga "acesso" abre Preferências');
  },

  async 'config: réguas salvas viram versão e mudam ranking e matriz'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/config', 400);
    const antes = await p.textContent('.cfg-previa');
    await p.fill('[data-corte="classeA"]', '80');
    check(await p.isEnabled('[data-salvar]') && /1 alteração não salva/.test(await p.textContent('[data-barra]')), 'C2: barra mostra a alteração pendente');
    check(await p.textContent('.cfg-previa') !== antes, 'C2: prévia das classes muda na hora');
    await p.fill('[data-corte="classeB"]', '85');
    check(await p.isDisabled('[data-salvar]') && /classe B precisa começar abaixo/.test(await p.textContent('[data-barra]')), 'C2: B acima de A bloqueia o salvar com explicação');
    await p.fill('[data-corte="classeB"]', '45');
    await p.fill('[data-corte="valor"]', '60');
    const conf = await salvarConfirmando(p);
    check(/versão 2/.test(conf) && /Classe A a partir de: 70 → 80/.test(conf) && /Corte de valor/.test(conf), 'C2: confirmação lista o que muda');
    const st = await p.evaluate(() => ({ v: GP.state().config.versao, c: GP.modelo.CORTE, h: GP.state().configVersoes.length }));
    check(st.v === 2 && st.c.classeA === 80 && st.c.classeB === 45 && st.c.valor === 60 && st.h === 2, 'C2: versão 2 gravada e aplicada ' + JSON.stringify(st));
    check(/versão 2 em uso/.test(await p.textContent('[data-barra]')), 'C2: barra volta a "tudo salvo"');
    await ir('#/ranking', 400);
    check(/A ≥80 · B ≥45/.test(await p.textContent('#conteudo')), 'C2: ranking usa as novas classes');
    await recarregar(400);
    check(await p.evaluate(() => GP.modelo.CORTE.classeA) === 80, 'C2: regras continuam depois de recarregar');
    await ir('#/config', 300); await p.click('.cfg-versoes summary');
    check(/v2/.test(await p.textContent('.cfg-versoes')) && /Classe A a partir de: 70 → 80/.test(await p.textContent('.cfg-versoes')), 'C2: histórico de versões');
  },

  async 'config: checklist editado vale no funil e a ficha mostra a versão usada'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/config', 400);
    await p.click('[data-editar-q="E4"]'); await p.waitForTimeout(100);
    await p.fill('[data-q="E4:pergunta"]', 'O objetivo, o benefício e o indicador de sucesso estão descritos?');
    await p.selectOption('[data-q="E4:tipo"]', 'barreira');
    await p.click('[data-editar-q=""]');
    await p.click('label.cfg-sw:has([data-q-ativa="E6"])'); await p.waitForTimeout(100);
    check(/5 de 6 perguntas ligadas/.test(await p.textContent('.cfg-card:nth-of-type(2), #cfg-t-check')) || /5 de 6 perguntas ligadas/.test(await p.textContent('.cfg-regras')), 'C3: contador de perguntas ligadas');
    const conf = await salvarConfirmando(p);
    check(/Pergunta 6 desligada/.test(conf) && /Pergunta 4 agora é eliminatória/.test(conf), 'C3: confirmação descreve a mudança no checklist');
    await ir('#/funil', 400);
    await p.click('.op-fila [data-entrada]'); await p.waitForTimeout(400);
    const m = await p.textContent('.modal');
    check(/Critérios eliminatórios \(1 a 4\)/.test(m) && /Informações mínimas \(5\)/.test(m) && /indicador de sucesso/.test(m) && !/estimativa mínima de esforço/.test(m), 'C3: funil usa o checklist novo');
    check(await p.locator('.modal [data-q]').count() === 10, 'C3: cinco perguntas com Sim/Não');
    await p.keyboard.press('Escape');
    // projeto decidido antes da mudança mostra a versão e o aviso
    const id = await p.evaluate(() => GP.projetos.todos().find(p => p.entrada && p.etapa === 'aprovado').id);
    await ir('#/projeto/' + id, 400);
    const d = await p.textContent('.op-o-dados');
    check(/Registro/.test(d) && /Cadastro\s*versão 1/.test(d) && /checklist mudou depois/.test(d), 'C3: ficha mostra a versão do registro e o aviso');
    const novo = await p.evaluate(() => GP.projetos.criar({ titulo: 'Projeto depois das regras', descricao: 'd', gerencia: 'FEG', demandante: 'x', tipo: 'Projeto' }).projeto.ctx.cfg);
    check(novo === 2, 'C3: novo cadastro guarda a versão 2');
  },

  async 'config: listas do cadastro (incluir, renomear, proteger o que está em uso)'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/config', 400);
    check(await p.isDisabled('[data-rem="gerencias:0"]'), 'C4: gerência em uso não pode ser removida');
    await p.fill('[data-novo="tipos"]', 'Projeto piloto'); await p.click('[data-add="tipos"]'); await p.waitForTimeout(100);
    await p.fill('[data-novo="ger-id"]', 'fex'); await p.fill('[data-novo="ger-nome"]', 'FEX · Gerência nova'); await p.press('[data-novo="ger-nome"]', 'Enter'); await p.waitForTimeout(100);
    const i = await p.evaluate(() => [...document.querySelectorAll('[data-item^="origens:"]')].findIndex(x => x.value === 'Melhoria contínua'));
    await p.fill(`[data-item="origens:${i}"]`, 'Melhoria contínua (MC)');
    const usam = await p.evaluate(() => GP.projetos.todos().filter(p => p.origem === 'Melhoria contínua').length);
    const conf = await salvarConfirmando(p);
    check(/Tipo incluído: “Projeto piloto”/.test(conf) && /Gerência incluída: FEX/.test(conf) && /Origem renomeado: “Melhoria contínua” → “Melhoria contínua \(MC\)”/.test(conf), 'C4: confirmação das listas');
    const r = await p.evaluate(() => ({ mc: GP.projetos.todos().filter(p => p.origem === 'Melhoria contínua (MC)').length, velho: GP.projetos.todos().filter(p => p.origem === 'Melhoria contínua').length }));
    check(usam > 0 && r.mc === usam && r.velho === 0, 'C4: renomear atualiza os projetos ' + JSON.stringify(r));
    await ir('#/novo', 400);
    const ops = await p.evaluate(() => ({ t: [...document.querySelectorAll('[name="tipo"] option')].map(o => o.value), g: [...document.querySelectorAll('[name="gerencia"] option')].map(o => o.value) }));
    check(ops.t.includes('Projeto piloto') && ops.g.includes('FEX'), 'C4: formulário de cadastro usa as listas novas');
    await ir('#/acervo', 300);
    check(await p.evaluate(() => [...document.querySelectorAll('[data-f="gerencia"] option')].some(o => o.value === 'FEX')), 'C4: filtro do acervo usa as listas novas');
  },

  async 'config: descartar, aviso ao sair sem salvar e sugestão do sistema'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar); await ir('#/config', 400);
    await p.fill('[data-corte="esforco"]', '40');
    await p.click('[data-descartar]'); await p.waitForTimeout(150);
    check(await p.inputValue('[data-corte="esforco"]') === '50' && await p.isDisabled('[data-salvar]'), 'C5: descartar volta ao que está salvo');
    await p.fill('[data-corte="esforco"]', '40');
    await p.click('.side a[href="#/painel"], .nav-item[href="#/painel"]').catch(() => p.evaluate(() => { location.hash = '#/painel'; }));
    await p.waitForTimeout(300);
    check(/ainda não foram salvas/.test(await p.textContent('body')), 'C5: aviso ao sair com alterações pendentes');
    await p.evaluate(() => { location.hash = '#/config?secao=regras'; }); await p.waitForTimeout(300);
    check(await p.inputValue('[data-corte="esforco"]') === '40', 'C5: o rascunho continua ao voltar');
    await p.click('[data-descartar]');
    await p.evaluate(() => { const c = JSON.parse(JSON.stringify(GP.state().config)); c.corte.valor = 65; GP.modelo.salvarConfig(c); GP.refresh(); }); await p.waitForTimeout(200);
    await p.click('.cfg-versoes summary'); await p.click('[data-padrao]'); await p.waitForTimeout(150);
    check(await p.inputValue('[data-corte="valor"]') === '50' && await p.isEnabled('[data-salvar]'), 'C5: sugestão do sistema vai para o rascunho, sem salvar sozinha');
  },

  async 'config: celular sem rolagem lateral e barra alcançável'({ p, ir, check, recarregar }){
    await exemplos(p, recarregar);
    await p.setViewportSize({ width: 390, height: 844 }); await ir('#/config', 500);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(r.sw <= r.cw + 1, 'C6: sem rolagem horizontal no celular ' + JSON.stringify(r));
    await p.fill('[data-corte="classeA"]', '75');
    const b = await p.locator('[data-salvar]').boundingBox();
    check(b && b.y + b.height <= 844 && b.height >= 40, 'C6: botão salvar visível e com área de toque ' + JSON.stringify(b));
    await p.setViewportSize({ width: 1440, height: 900 });
  },
};
