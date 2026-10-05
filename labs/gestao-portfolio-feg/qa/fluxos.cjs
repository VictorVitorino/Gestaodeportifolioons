/* Fluxos verificados pelo QA, acrescentados a cada passo. Cada fluxo começa com o armazenamento limpo. */
module.exports = {
  /* Passo 1 — base visual, menu recolhível, níveis */
  async 'passo1: logos e marca'({ p, ir, check }){
    check(await p.locator('.topbar img.ons').count() === 1, 'logo ONS ausente no topo');
    check(await p.locator('.brand svg.feg').count() === 1, 'logo FEG ausente no menu');
    check(await p.locator('img[src*="maestro" i], img[alt*="maestro" i]').count() === 0, 'logo do Maestro não deveria aparecer');
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
    await p.click('[data-opcional] > summary');
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
    await p.click('.op-mais-btn'); await p.click('[data-excluir]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
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
    await p.click('th[data-sort="acervo|titulo"]'); await p.click('th[data-sort="acervo|titulo"]'); await p.waitForTimeout(150);
    check(/Relatórios gerenciais/.test(await p.locator('tbody tr').first().textContent()), 'ordenação decrescente por título falhou');
    await ir('#/config'); await p.click('[data-exemplos]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.projetos.todos().length) === 14, 'carregar exemplos duas vezes não pode duplicar');
  },
  /* Passo 3 — funil de entrada */
  async 'passo3: checklist decide entra / falta informação / não entra'({ p, ir, check }){
    const id = await p.evaluate(() => GP.projetos.criar({ titulo:'Projeto funil QA', descricao:'d', beneficio:'b', gerencia:'FEN', demandante:'x', tipo:'Projeto' }).projeto.id);
    await ir('#/funil');
    check(await p.locator(`[data-entrada="${id}"]`).count() === 1, 'projeto novo deveria estar na fila de entrada');
    await p.click(`[data-entrada="${id}"]`); await p.waitForTimeout(150);
    check(await p.locator('.modal [data-registrar][disabled]').count() === 1, 'registrar deveria ficar bloqueado sem respostas');
    check(/O cadastro indica: <b>Não<\/b>/.test(await p.innerHTML('.modal')), 'sugestão do cadastro (patrocinador ausente) não apareceu');
    for(const q of ['E1','E2','E3','E4','E6']) await p.click(`.modal [data-q="${q}"][data-v="sim"]`);
    await p.click('.modal [data-q="E5"][data-v="nao"]');
    check(/Falta informação/.test(await p.textContent('.modal [data-resultado]')), 'resultado deveria ser "Falta informação"');
    await p.click('.modal [data-registrar]'); await p.waitForTimeout(200);
    check(await p.evaluate(i => GP.projetos.get(i).etapa, id) === 'triagem', 'falta de informação deveria levar a "Em triagem"');
    await p.click(`[data-entrada="${id}"]`); await p.waitForTimeout(150);
    await p.click('.modal [data-q="E5"][data-v="sim"]');
    check(/Entra no portfólio/.test(await p.textContent('.modal [data-resultado]')), 'todas "Sim" deveria dar "Entra"');
    await p.click('.modal [data-registrar]'); await p.waitForTimeout(200);
    check(await p.evaluate(i => GP.projetos.get(i).etapa, id) === 'aprovado', '"Entra" deveria aprovar o projeto');
    check(await p.locator(`[data-entrada="${id}"]`).count() === 0, 'projeto aprovado deveria sair da fila');
    await ir('#/projeto/' + id);
    check(/Entrada no portfólio/.test(await p.textContent('#conteudo')) && /Entra no portfólio/.test(await p.textContent('#conteudo')), 'ficha deveria mostrar o resultado da entrada');
    await p.click(`[data-entrada="${id}"]`); await p.click('.modal [data-q="E2"][data-v="nao"]'); await p.fill('.modal [name=obs]', 'Pertence a outra diretoria');
    await p.click('.modal [data-registrar]'); await p.waitForTimeout(200);
    const t = await p.textContent('#conteudo');
    check(/Fora do escopo/.test(t) && /Pertence a outra diretoria/.test(t), 'motivo e observação do "Não entra" deveriam ir para o histórico');
  },
  async 'passo3: funil com exemplos e quadro por etapa'({ p, ir, check }){
    await p.evaluate(() => GP.modelo.carregarExemplos());
    await ir('#/funil');
    check(await p.locator('[data-entrada]').count() === 3, 'fila deveria ter 3 (2 novas demandas + 1 em triagem)');
    await ir('#/funil?aba=quadro');
    check(await p.locator('.quadro .col').count() === 8, 'quadro deveria ter 8 colunas (etapas)');
    check(await p.locator('.quadro .kcard').count() === 14, 'quadro deveria mostrar os 14 projetos');
  },
  /* Passo 4 — priorização */
  async 'passo4: avaliar projeto calcula nota e vai ao ranking'({ p, ir, check }){
    await p.evaluate(() => { const S = GP.state(); S.ui.nivel = 2; GP.save(); });
    const id = await p.evaluate(() => { const r = GP.projetos.criar({ titulo:'Projeto prioridade QA', descricao:'d', beneficio:'b', gerencia:'FEN', demandante:'x', patrocinador:'y', tipo:'Projeto', esforcoFte:2, duracaoMeses:6 }).projeto; GP.projetos.mudarEtapa(r.id, 'aprovado'); return r.id; });
    await ir('#/avaliar');
    check(await p.locator(`[data-avaliar="${id}"]`).count() === 1, 'projeto aprovado deveria estar na lista de avaliação');
    await ir('#/avaliar/' + id);
    check(await p.locator('.escala button.sug[data-c="C1"][data-v="2"]').count() === 1, 'C1 deveria vir sugerido como 2 (12 pessoas-mês)');
    check(/Faltam 8/.test(await p.textContent('[data-resultado]')), 'resultado parcial deveria indicar 8 faltando');
    for(const [c, v] of [['V1',3],['V2',2],['V3',3],['V4',1],['V5',3],['V6',0],['C1',2],['C2',1],['C3',1]]) await p.click(`.escala [data-c="${c}"][data-v="${v}"]`);
    const res = await p.textContent('[data-resultado]');
    check(/73/.test(res) && /47/.test(res), 'nota deveria ser valor 73 / esforço 47: ' + res.replace(/\s+/g, ' ').slice(0, 80));
    check(/Ganho rápido/.test(res), 'quadrante deveria ser "Ganho rápido"');
    await p.click('[data-salvar]'); await p.waitForTimeout(250);
    check(/#\/ranking/.test(p.url()), 'após salvar deveria ir ao ranking');
    check(/Projeto prioridade QA/.test(await p.locator('tbody tr').first().textContent()), 'projeto deveria estar no topo do ranking');
    await ir('#/projeto/' + id);
    check(/Priorização/.test(await p.textContent('#conteudo')) && /Ganho rápido/.test(await p.textContent('#conteudo')), 'ficha deveria mostrar a priorização no nível 2');
  },
  async 'passo4: pesos precisam somar 100% e mudam o ranking'({ p, ir, check }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 2; GP.save(); });
    await ir('#/ranking');
    const antes = await p.locator('tbody tr').count();
    check(antes === 5, `ranking de aprovados deveria ter 5 (veio ${antes})`);
    check(/requisito regulatório/.test(await p.locator('tbody tr').first().textContent()), 'obrigatório deveria estar no topo');
    await p.click('[data-topo]'); await p.waitForTimeout(150);
    check(/requisito regulatório/.test(await p.locator('tbody tr').first().textContent()), 'sem "obrigatórios no topo" ele ainda lidera pela nota (73)');
    await ir('#/criterios');
    await p.$eval('[data-peso="V1"]', i => { i.value = 40; i.dispatchEvent(new Event('input')); });
    check(await p.locator('[data-salvar-pesos][disabled]').count() === 1, 'soma ≠ 100% deveria bloquear salvar');
    check(/115%/.test(await p.textContent('[data-soma="valor"]')), 'soma deveria mostrar 115%');
    await p.$eval('[data-peso="V2"]', i => { i.value = 5; i.dispatchEvent(new Event('input')); });
    check(await p.locator('[data-salvar-pesos][disabled]').count() === 0, 'soma = 100% deveria liberar salvar');
    await p.click('[data-salvar-pesos]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().criterios.find(c => c.id === 'V1').peso) === 40, 'peso não foi salvo');
    await p.click('[data-restaurar]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().criterios.find(c => c.id === 'V1').peso) === 25, 'restaurar sugestão falhou');
    await ir('#/matriz');
    check(await p.locator('[data-ponto]').count() === 5, 'matriz deveria mostrar 5 pontos (aprovados)');
    await p.click('[data-escopo="ativos"]'); await p.waitForTimeout(150);
    check(await p.locator('[data-ponto]').count() === 9, 'matriz "todos os ativos" deveria mostrar 9');
    await ir('#/acervo');
    check(/Valor/.test(await p.textContent('thead')), 'acervo no nível 2 deveria ter coluna Valor');
  },
  /* Passo 5 — painel */
  async 'passo5: painel vazio orienta e com exemplos mostra indicadores'({ p, ir, check }){
    await ir('#/painel');
    check(/Seu portfólio começa aqui/.test(await p.textContent('#conteudo')), 'painel vazio deveria orientar o primeiro cadastro');
    await p.click('#conteudo [data-exemplos]'); await p.waitForTimeout(250);
    const t = await p.textContent('#conteudo');
    check(/Registros na base\s*14/.test(t), 'KPI de registros deveria ser 14');
    check(/Fila de entrada\s*3/.test(t), 'KPI fila de entrada deveria ser 3');
    check(/Em execução\s*3/.test(t), 'KPI em execução deveria ser 3');
    check(/Pontos para acompanhamento/.test(t), 'bloco "Pontos para acompanhamento" ausente');
    await p.click('.seg [data-nivel="2"]'); await p.waitForTimeout(200);
    const n = await p.locator('#conteudo a.attention-item').count();
    check(n >= 1, `acompanhamento deveria listar itens (veio ${n})`);
    await p.locator('#conteudo a.attention-item').first().click(); await p.waitForTimeout(200);
    check(!/#\/painel/.test(p.url()), 'item de acompanhamento deveria levar à tela de resolução');
  },
  /* Passo 6 — capacidade e roadmap */
  async 'passo6: carteira encaixa pelo ranking e respeita decisões do comitê'({ p, ir, check }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 3; GP.save(); });
    await ir('#/carteira');
    let t = await p.textContent('#conteudo');
    check(/Pessoas para novos projetos\s*7,0/.test(t), 'FTE livre deveria ser 7,0 (10 − 15% − 1,5 em execução no período 2027)');
    check(/Projetos que cabem\s*4\s*\/\s*5/.test(t), 'deveriam caber 4 de 5 (encaixe mês a mês)');
    await p.uncheck('[data-cap="descontarExecucao"]'); await p.waitForTimeout(200);
    t = await p.textContent('#conteudo');
    check(/Projetos que cabem\s*4\s*\/\s*5/.test(t), 'sem descontar execução deveriam caber 4 de 5');
    const id14 = await p.evaluate(() => GP.projetos.todos().find(x => x.codigo === 'PRJ-014').id);
    await p.click(`[data-forcar="${id14}"][data-v="in"]`); await p.waitForTimeout(200);
    if(await p.locator('.modal [data-ok]').count()){ await p.click('.modal [data-ok]'); await p.waitForTimeout(200); }
    check(/Fixado/.test(await p.locator('tbody tr[data-id]').first().textContent()), 'projeto fixado deveria ir para o topo');
    await p.fill('[data-cap="fte"]', '20'); await p.press('[data-cap="fte"]', 'Tab'); await p.waitForTimeout(200);
    check(/Projetos que cabem\s*5\s*\/\s*5/.test(await p.textContent('#conteudo')), 'com 20 FTE deveriam caber todos');
    await p.click('[data-pauta]'); await p.waitForTimeout(150);
    const pauta = await p.inputValue('.modal [data-txt]');
    check(/PAUTA DO COMITÊ/.test(pauta) && /PRJ-014/.test(pauta), 'pauta do comitê incompleta');
    await p.keyboard.press('Escape');
    await p.click('[data-cap-padrao]'); await p.waitForTimeout(150);
    check(await p.evaluate(() => GP.state().capacidade.fte) === 10, 'restaurar capacidade falhou');
  },
  async 'passo6: roadmap mostra barras, demanda mensal e itens sem data'({ p, ir, check }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 3; GP.save(); });
    await ir('#/roadmap');
    const barras = await p.locator('.g-bar').count();
    check(barras === 8, `roadmap deveria ter 8 barras (aprovados/execução com datas), veio ${barras}`);
    check(await p.locator('.g-col').count() > 6, 'demanda mensal ausente');
    check(/Sem datas previstas \(1\)/.test(await p.textContent('#conteudo')), 'deveria listar 1 projeto sem datas (em espera)');
  },
  /* Passo 7 — importar/exportar e PDF */
  async 'passo7: planilha exporta e reimporta (ida e volta)'({ p, ir, check }){
    const fs = require('fs'), os = require('os'), path = require('path');
    await p.evaluate(() => GP.modelo.carregarExemplos());
    await ir('#/acervo');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-exportar-csv]')]);
    const arq = path.join(os.tmpdir(), 'qa-portfolio.csv'); await dl.saveAs(arq);
    const txt = fs.readFileSync(arq, 'utf8');
    check(txt.charCodeAt(0) === 0xFEFF, 'CSV deveria ter BOM (acentos no Excel)');
    check(txt.split('\r\n').length === 15, 'CSV deveria ter cabeçalho + 14 linhas');
    check(/;Nota de valor;/.test(txt) && /73,3/.test(txt), 'CSV deveria trazer nota de valor com vírgula decimal');
    // apaga tudo e reimporta
    await p.evaluate(() => { const S = GP.state(); S.projetos = []; S.seq = 0; GP.save(); });
    await ir('#/acervo');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#conteudo [data-importar-csv]')]);
    await fc.setFiles(arq); await p.waitForTimeout(300);
    check(/14 prontas para importar/.test(await p.textContent('.modal')), 'prévia deveria indicar 14 linhas válidas');
    await p.click('.modal [data-confirmar]'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ n: GP.projetos.todos().length, et: GP.projetos.todos().every(x => x.etapa === 'entrada'), fte: GP.projetos.todos().find(x => /nuvem/.test(x.titulo)).esforcoFte, ini: GP.projetos.todos().find(x => /nuvem/.test(x.titulo)).inicioPrevisto, obr: GP.projetos.todos().filter(x => x.obrigatorio).length }));
    check(r.n === 14 && r.et, 'reimportação deveria criar 14 projetos como Nova demanda');
    check(r.fte === 3 && r.ini === '2026-03-01' && r.obr === 1, 'números, datas e obrigatório deveriam sobreviver à ida e volta');
  },
  async 'passo7: importação aponta erros por linha'({ p, ir, check }){
    const fs = require('fs'), os = require('os'), path = require('path');
    const arq = path.join(os.tmpdir(), 'qa-erros.csv');
    fs.writeFileSync(arq, '﻿Título;Descrição;Gerência;Demandante;Tipo;Esforço (FTE);Início previsto\r\nProjeto válido de teste;desc;FEN;área;Projeto;1,5;01/02/2027\r\nX;desc;ABC;área;Tipo inventado;abc;31/31/2027\r\n');
    await ir('#/acervo');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#conteudo [data-importar-csv]')]);
    await fc.setFiles(arq); await p.waitForTimeout(300);
    const t = await p.textContent('.modal');
    check(/1 prontas para importar/.test(t) && /1 com erro/.test(t), 'deveria separar 1 válida e 1 com erro');
    check(/não reconhecida/.test(t) && /Número inválido/.test(t) && /Data inválida/.test(t), 'erros por campo não detalhados: ' + t.slice(0, 120));
    await p.click('.modal [data-confirmar]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.projetos.todos()[0].esforcoFte) === 1.5, '"1,5" deveria virar 1.5');
  },
  async 'passo7: backup e restauração preservam tudo'({ p, ir, check }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.state().criterios[0].peso = 30; GP.state().criterios[1].peso = 15; GP.save(); });
    await ir('#/config');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-backup]')]);
    const arq = require('path').join(require('os').tmpdir(), 'qa-backup.json'); await dl.saveAs(arq);
    await p.click('[data-apagar]'); await p.fill('.modal [data-confirma-texto]', 'APAGAR'); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
    check(await p.evaluate(() => GP.projetos.todos().length) === 0, 'apagar tudo deveria zerar');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-restaurar-backup]')]);
    await fc.setFiles(arq); await p.waitForTimeout(200); await p.click('.modal [data-ok]'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => ({ n: GP.projetos.todos().length, peso: GP.state().criterios[0].peso, aval: GP.projetos.todos().filter(x => x.avaliacao).length }));
    check(r.n === 14 && r.peso === 30 && r.aval === 10, 'backup não restaurou projetos, pesos e avaliações: ' + JSON.stringify(r));
  },
  async 'passo7: PDF dos indicadores e do ranking'({ p, ir, check, recarregar }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = 2; GP.save(); });
    await recarregar();
    for(const rota of ['#/indicadores', '#/ranking']){
      await ir(rota, 250);
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('[data-pdf]')]);
      check(/\.pdf$/.test(dl.suggestedFilename()), 'PDF não gerado em ' + rota);
    }
  },
  /* Passo 8 — regressões dos defeitos do QA independente */
  async 'qa8-01: backup malformado não trava o app'({ p, ir, check }){
    const arq = require('path').join(require('os').tmpdir(), 'qa-bk-ruim.json');
    require('fs').writeFileSync(arq, JSON.stringify({ tipo:'BACKUP_GESTAO_PORTFOLIO_FEG', exportadoEm:'xx', estado:{ projetos:[null, 5, { id:'ok-1', titulo:'Projeto válido do backup', etapa:'xyz', gerencia:'FEN', esforcoFte:'abc', link:'javascript:alert(1)' }] } }));
    await ir('#/config');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-restaurar-backup]')]);
    await fc.setFiles(arq); await p.waitForTimeout(200);
    const t = await p.textContent('.modal');
    check(/sem data/.test(t) && /1 projeto válido/.test(t) && /2 registros inválidos/.test(t), 'confirmação deveria explicar validos/descartados e data ausente: ' + t.slice(0, 160));
    await p.click('.modal [data-ok]'); await p.waitForTimeout(250);
    for(const r of ['#/painel', '#/acervo', '#/config', '#/funil']){ await ir(r); check(!/Erro ao montar/.test(await p.textContent('#conteudo')), 'tela quebrou após backup ruim: ' + r); }
    const pr = await p.evaluate(() => GP.projetos.todos()[0]);
    check(pr.etapa === 'entrada' && pr.esforcoFte === null && pr.link === '', 'projeto do backup deveria ser higienizado');
  },
  async 'qa8-02: números no formato brasileiro no cadastro'({ p, ir, check }){
    await ir('#/novo');
    await p.fill('[name=titulo]', 'Projeto números BR'); await p.fill('[name=descricao]', 'd'); await p.selectOption('[name=gerencia]', 'FEG');
    await p.fill('[name=demandante]', 'x'); await p.selectOption('[name=tipo]', 'Projeto');
    await p.click('[data-opcional] > summary');
    await p.fill('[name=custo]', '150.000'); await p.fill('[name=esforcoFte]', '1,5'); await p.fill('[name=duracaoMeses]', '6');
    check(/R\$ 150\.000/.test(await p.textContent('[data-hint="custo"]')), 'dica deveria mostrar R$ 150.000');
    await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const x = GP.projetos.todos()[0]; return [x.custo, x.esforcoFte, x.duracaoMeses]; });
    check(r[0] === 150000 && r[1] === 1.5 && r[2] === 6, 'valores gravados errados: ' + JSON.stringify(r));
    await p.click('a.btn:has-text("Editar")'); await p.waitForTimeout(150);
    check(await p.inputValue('[name=esforcoFte]') === '1,5', 'edição deveria mostrar 1,5');
    await p.fill('[name=custo]', '12,3,4'); await p.click('[data-form] button[type=submit]'); await p.waitForTimeout(150);
    check(/número/.test(await p.textContent('[data-err="custo"]')), 'número inválido deveria ser recusado');
  },
  async 'qa8-03: datas absurdas recusadas e roadmap com janela'({ p, ir, check }){
    const e = await p.evaluate(() => GP.modelo.validar({ titulo:'Datas teste', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto', inicioPrevisto:'2026-01-01', fimPrevisto:'9999-12-31' }));
    check(!!e.fimPrevisto, 'fim 9999 deveria ser recusado');
    await p.evaluate(() => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 3; const x = S.projetos.find(q => q.codigo === 'PRJ-002'); x.inicioPrevisto = '2020-01-01'; x.fimPrevisto = '2035-12-31'; GP.save(); });
    await ir('#/roadmap');
    const fora = await p.$$eval('.g-bar', bs => bs.filter(b => parseFloat(b.style.left) > 100 || parseFloat(b.style.left) < 0).length);
    check(fora === 0, 'barras não deveriam sair do quadro');
    check(await p.locator('.g-col').count() > 0 && /Mostrando 72 meses/.test(await p.textContent('#conteudo')), 'roadmap deveria limitar a janela e manter a demanda mensal');
  },
  async 'qa8-04: data de hoje no fuso local'({ p, check }){
    const ctx = await p.context().browser().newContext({ timezoneId:'America/Sao_Paulo' }); const q = await ctx.newPage();
    await q.clock.setFixedTime(new Date('2026-10-04T01:30:00Z'));   // 03/10 22:30 em Brasília
    await q.goto(p.url().split('#')[0] + '#/painel'); await q.waitForTimeout(200);
    check(await q.evaluate(() => GP.util.hoje()) === '2026-10-03', 'hoje() deveria usar a data local');
    await ctx.close();
  },
  async 'qa8-05: backup não executa HTML injetado'({ p, ir, check }){
    const arq = require('path').join(require('os').tmpdir(), 'qa-bk-xss.json');
    const x = '<img src=x onerror="window.__xss=1">';
    require('fs').writeFileSync(arq, JSON.stringify({ tipo:'BACKUP_GESTAO_PORTFOLIO_FEG', estado:{ ui:{ nivel:3 }, capacidade:{ reservaPct:x, fte:x, periodo:x }, forcar:{}, criterios:[{ id:x, eixo:'valor', peso:x, nome:x, pergunta:x, niveis:[x,x,x,x] }],
      projetos:[{ id:'a"><img src=x onerror=window.__xss=2>', codigo:x, titulo:'Projeto '+x, etapa:'aprovado', gerencia:'FEN', tipo:x, esforcoFte:1 }] } }));
    await ir('#/config');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-restaurar-backup]')]);
    await fc.setFiles(arq); await p.waitForTimeout(200); await p.click('.modal [data-ok]'); await p.waitForTimeout(200);
    await p.evaluate(() => { GP.state().ui.nivel = 3; GP.save(); });
    for(const r of ['#/painel', '#/acervo', '#/carteira', '#/criterios', '#/ranking', '#/funil?aba=quadro']){ await ir(r, 150); }
    const id = await p.evaluate(() => GP.projetos.todos()[0].id); await ir('#/projeto/' + id, 150);
    check(await p.evaluate(() => window.__xss === undefined), 'HTML injetado via backup foi executado');
  },
  async 'qa8-06: menu no celular fecha com Esc e clique fora'({ p, ir, check }){
    await p.setViewportSize({ width:390, height:844 }); await ir('#/acervo');
    await p.click('[data-menu]'); await p.waitForTimeout(150);
    check(await p.locator('.side.open').count() === 1 && await p.locator('.side-backdrop').count() === 1, 'menu deveria abrir com fundo');
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    check(await p.locator('.side.open').count() === 0, 'Esc deveria fechar o menu');
    await p.click('[data-menu]'); await p.waitForTimeout(100); await p.mouse.click(370, 600); await p.waitForTimeout(150);
    check(await p.locator('.side.open').count() === 0, 'clique fora deveria fechar o menu');
    await p.click('[data-menu]'); await p.waitForTimeout(100); await p.click('.side [data-nivel="2"]'); await p.waitForTimeout(150);
    check(await p.locator('.side.open').count() === 0, 'trocar de nível deveria fechar o menu');
    await p.setViewportSize({ width:1440, height:900 });
  },
  async 'qa8-07: pergunta sem resposta não aparece como Não'({ p, ir, check }){
    const id = await p.evaluate(() => { const r = GP.projetos.criar({ titulo:'Projeto parcial', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto' }).projeto; GP.projetos.registrarEntrada(r.id, { E2:'nao' }); return r.id; });
    await ir('#/projeto/' + id);
    const t = await p.textContent('[data-secao="entrada"]');
    check((t.match(/Sem resposta/g) || []).length === 5 && (t.match(/Não/g) || []).length >= 1, 'deveria mostrar 5 "Sem resposta"');
  },
  async 'qa8-08: teclado — ordenar, foco na carteira e modal'({ p, ir, check }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = 3; GP.save(); });
    await ir('#/acervo');
    await p.focus('th[data-sort="acervo|titulo"]'); await p.keyboard.press('Enter'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    check(/Relatórios gerenciais/.test(await p.locator('tbody tr').first().textContent()), 'ordenar pelo teclado falhou');
    await ir('#/carteira');
    await p.fill('[data-cap="fte"]', '12'); await p.press('[data-cap="fte"]', 'Tab'); await p.waitForTimeout(200);
    check(await p.evaluate(() => document.activeElement && document.activeElement.dataset && !!document.activeElement.dataset.cap), 'foco deveria continuar nos campos da carteira');
    await p.click('[data-pauta]'); await p.waitForTimeout(100);
    for(let i = 0; i < 6; i++) await p.keyboard.press('Tab');
    check(await p.evaluate(() => !!document.activeElement.closest('.modal')), 'foco deveria ficar preso no modal');
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    check(await p.evaluate(() => document.activeElement && document.activeElement.matches('[data-pauta]')), 'foco deveria voltar ao botão que abriu o modal');
  },
  async 'qa8-09: títulos longos não estouram o layout'({ p, ir, check }){
    const id = await p.evaluate(() => GP.projetos.criar({ titulo:'A'.repeat(140), descricao:'B'.repeat(800), gerencia:'FEG', demandante:'x', tipo:'Projeto' }).projeto.id);
    for(const r of ['#/projeto/' + id, '#/funil', '#/acervo']){ await ir(r, 150); const sw = await p.evaluate(() => document.documentElement.scrollWidth); check(sw <= 1442, `rolagem horizontal em ${r} (${sw})`); }
  },
  async 'qa8-10: link só aceita http/https'({ p, check }){
    const e = await p.evaluate(() => GP.modelo.validar({ titulo:'Link teste', descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto', link:'javascript:alert(1)' }));
    check(!!e.link, 'javascript: deveria ser recusado');
  },
  async 'qa8-11: capacidade não fica negativa e avisa'({ p, ir, check }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); const S = GP.state(); S.ui.nivel = 3; S.capacidade.fte = 0; GP.save(); });
    await ir('#/carteira');
    const t = await p.textContent('#conteudo');
    check(/Pessoas para novos projetos\s*0,0/.test(t) && /Atenção:/.test(t) && !/-\d/.test(t.replace(/PRJ-\d+/g, '').replace(/\d+-\d+/g, '')), 'capacidade deveria ser 0 com aviso, sem negativos');
  },
  async 'qa8-12: busca ignora acentos e ordenação em português'({ p, ir, check }){
    await p.evaluate(() => ['Árvore de decisão teste', 'abacaxi teste', 'Bravo teste', 'Égua teste'].forEach(t => GP.projetos.criar({ titulo:t, descricao:'d', gerencia:'FEG', demandante:'x', tipo:'Projeto' })));
    await ir('#/acervo'); await p.fill('[data-f="q"]', 'arvore'); await p.waitForTimeout(400);
    check(await p.locator('tbody tr').count() === 1, 'busca "arvore" deveria achar "Árvore"');
    await p.fill('[data-f="q"]', ''); await p.waitForTimeout(400);
    await p.click('th[data-sort="acervo|titulo"]'); await p.waitForTimeout(150);
    const ord = await p.$$eval('tbody tr td:nth-child(1) b', bs => bs.map(b => b.textContent.split(' ')[0]));
    check(ord.join(',') === 'abacaxi,Árvore,Bravo,Égua', 'ordenação deveria seguir o português: ' + ord.join(','));
  },
  async 'qa8-13: planilha ANSI (Excel) e manter etapa'({ p, ir, check }){
    const arq = require('path').join(require('os').tmpdir(), 'qa-ansi.csv');
    const txt = 'Título;Descrição;Gerência;Demandante;Tipo;Etapa\r\nAção de integração do módulo;Descrição com acentuação;FEN;Área de estudos;Projeto;Em execução\r\n';
    require('fs').writeFileSync(arq, Buffer.from(txt, 'latin1'));
    await ir('#/acervo');
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#conteudo [data-importar-csv]')]);
    await fc.setFiles(arq); await p.waitForTimeout(250);
    check(/1 prontas/.test(await p.textContent('.modal')), 'CSV ANSI deveria ser lido');
    await p.check('.modal [data-manter-etapa]'); await p.click('.modal [data-confirmar]'); await p.waitForTimeout(250);
    const r = await p.evaluate(() => [GP.projetos.todos()[0].titulo, GP.projetos.todos()[0].etapa]);
    check(r[0] === 'Ação de integração do módulo' && r[1] === 'execucao', 'acentos/etapa da planilha: ' + JSON.stringify(r));
  },
  async 'qa8-14: PDF da carteira'({ p, ir, check, recarregar }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = 3; GP.save(); }); await recarregar();
    await ir('#/carteira', 250);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout:60000 }), p.click('[data-pdf]')]);
    check(/\.pdf$/.test(dl.suggestedFilename()), 'PDF da carteira não gerado');
  },
  /* Redesenho R2 - cabeçalho com saudação e dock do celular */
  async 'r2: saudação no cabeçalho e dock só no celular'({ p, ir, check }){
    check(/^(Bom dia|Boa tarde|Boa noite)/.test((await p.textContent('.topbar .ttl b')).trim()), 'cabeçalho deveria trazer a saudação');
    check(!(await p.locator('.dock').isVisible()), 'dock não deveria aparecer no computador');
    await ir('#/ranking'); check((await p.textContent('.topbar .ttl .crumb')).trim() === 'Ranking', 'cabeçalho deveria trazer o nome da tela (usado no título do PDF)');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/painel');
    check(await p.locator('.dock').isVisible(), 'dock deveria aparecer no celular');
    await p.click('.dock .dock-item.add'); await p.waitForTimeout(200);
    check(/#\/novo$/.test(p.url()) && await p.locator('.dock .dock-item.on.add').count() === 1, 'atalho Novo do dock deveria abrir o cadastro');
    await p.click('.dock button[data-menu]'); await p.waitForTimeout(150);
    check(await p.locator('.side.open').count() === 1, 'Menu do dock deveria abrir o menu completo');
    await p.keyboard.press('Escape');
    await p.setViewportSize({ width:1440, height:900 });
  },
  /* Redesenho R3 - painel em bento e dicas dos gráficos */
  async 'r3: painel em bento, medidores e dica ao passar o mouse'({ p, ir, check, recarregar }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = 2; GP.save(); });
    await recarregar(); await ir('#/painel', 250);
    check(await p.locator('.bento .b-hero h1').count() === 1 && await p.locator('.bento .gx-next').count() === 1, 'painel deveria estar em bento com manchete e próximo passo');
    check(await p.locator('.metric .ring').count() >= 2, 'KPIs com proporção deveriam ter medidor radial');
    check(await p.locator('.donut-layout .arc').count() === 0, 'painel não deveria repetir a rosca de 2 fatias');
    await ir('#/indicadores', 250);
    await p.locator('.percent-row >> nth=0').scrollIntoViewIfNeeded(); await p.waitForTimeout(120);
    await p.hover('.percent-row >> nth=0', { position:{ x:30, y:10 } }); await p.waitForTimeout(80);
    check(/Nova demanda/.test(await p.locator('.gp-tt').textContent().catch(() => '')), 'dica da barra deveria mostrar a etapa');
    await p.locator('.chart-cols').scrollIntoViewIfNeeded(); await p.waitForTimeout(120);
    await p.hover('.chart-cols .hit >> nth=0', { force:true }); await p.waitForTimeout(80);
    check(/Projetos: \d+/.test(await p.locator('.gp-tt').textContent().catch(() => '')), 'dica da coluna deveria mostrar projetos e demandas');
    await p.mouse.move(5, 5); await p.waitForTimeout(80);
    check(await p.locator('.gp-tt').count() === 0, 'dica deveria sumir ao sair do gráfico');
    await p.click('.percent-row[data-value="execucao"]'); await p.waitForTimeout(200);
    check(/#\/indicadores/.test(p.url()) || await p.evaluate(() => GP.state().ui.filtroIndicadores && GP.state().ui.filtroIndicadores.etapa === 'execucao'), 'clicar na barra deveria filtrar pela etapa');
  },
  /* Redesenho R4 - tabelas em cartões e modais em folha inferior no celular */
  async 'r4: celular mostra tabela em cartões e modal em folha inferior'({ p, ir, check, recarregar }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.save(); });
    await recarregar(); await p.setViewportSize({ width:390, height:844 }); await ir('#/acervo', 250);
    check(await p.locator('.tbl-cards thead').evaluate(t => { const r = t.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; }), 'cabeçalho da tabela deveria sumir no celular (fica só para leitor de tela)');
    const tr = await p.locator('.tbl-cards tbody tr').first().evaluate(e => getComputedStyle(e).display);
    check(tr === 'grid', 'linha da tabela deveria virar cartão (grid), veio ' + tr);
    check(await p.locator('.tbl-cards td[data-label="Etapa"]').count() === 14, 'células deveriam ter rótulo da coluna');
    await p.locator('.tbl-cards tbody tr').first().click(); await p.waitForTimeout(200);
    check(/#\/projeto\//.test(p.url()), 'tocar no cartão deveria abrir a ficha');
    await p.click('.menu-btn'); await p.waitForTimeout(120); await p.keyboard.press('Escape');
    await p.evaluate(() => GP.explicarNiveis()); await p.waitForTimeout(350);
    const r = await p.locator('.modal').boundingBox();
    check(r && Math.abs(r.y + r.height - 844) <= 2 && r.width >= 388, 'modal deveria abrir como folha inferior em largura total');
    await p.keyboard.press('Escape');
    await p.setViewportSize({ width:1440, height:900 }); await ir('#/acervo', 200);
    check(await p.locator('.tbl-cards thead').isVisible(), 'no computador a tabela mantém o cabeçalho');
  },
  /* R5 - regressões dos defeitos do QA independente do redesenho */
  async 'r5: PDF mantém barras, capas legíveis, selos e acessibilidade'({ p, ir, check, recarregar }){
    await p.evaluate(() => { GP.modelo.carregarExemplos(); GP.state().ui.nivel = 3; GP.save(); });
    await recarregar(); await ir('#/indicadores', 250);
    await p.evaluate(() => { const orig = window.html2canvas; window.__pdfBarras = -1; window.html2canvas = (w, o) => { window.__pdfBarras = w.querySelectorAll('.percent-row').length; return orig(w, o); }; });
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout:60000 }), p.click('[data-pdf]')]);
    check(/\.pdf$/.test(dl.suggestedFilename()), 'PDF não gerado');
    check(await p.evaluate(() => window.__pdfBarras) >= 20, 'PDF deveria manter as barras dos gráficos (veio ' + await p.evaluate(() => window.__pdfBarras) + ')');
    await ir('#/relatorios', 200);
    check(await p.locator('.report-cover h2').first().evaluate(e => getComputedStyle(e).color) === 'rgb(255, 255, 255)', 'título da capa do relatório deveria ser branco');
    await ir('#/entrada-resumo', 200);
    const w = await p.locator('.row > .score').first().evaluate(e => e.getBoundingClientRect().width);
    check(w >= 40, 'selo da nota não deveria ser espremido (largura ' + Math.round(w) + ')');
    check(await p.locator('.seg [data-nivel="3"][aria-pressed="true"]').count() === 1, 'nível ativo deveria ter aria-pressed');
    await ir('#/roadmap', 200);
    check(await p.evaluate(() => { const n = document.querySelector('.side-nav'), a = n.querySelector('.nav-item.on'); return a.offsetTop >= n.scrollTop && a.offsetTop + a.offsetHeight <= n.scrollTop + n.clientHeight; }), 'item ativo do menu deveria ficar visível');
    await p.focus('.bento-painel, #conteudo .btn >> nth=0').catch(() => {}); await p.keyboard.press('Tab');
    check(await p.evaluate(() => { const a = document.activeElement; return a && getComputedStyle(a).outlineStyle !== 'none'; }), 'foco do teclado deveria ter contorno visível');
    await ir('#/painel', 200);
    check(!(await p.locator('.chart-cols text').allTextContents()).some(t => /,/.test(t)), 'eixo do gráfico de entradas deveria ter só números inteiros');
    await p.setViewportSize({ width:390, height:844 }); await ir('#/governanca', 250);
    check(await p.locator('.tbl-cards tbody tr').first().evaluate(e => getComputedStyle(e).display) === 'grid', 'tabela da governança deveria virar cartões no celular');
    await p.setViewportSize({ width:1440, height:900 });
  },
};
