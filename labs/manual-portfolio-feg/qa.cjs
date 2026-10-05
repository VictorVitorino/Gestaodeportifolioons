/* QA do manual interativo: controles do player, linha do tempo, zoom, fundo, dicas, quiz, progresso, teclado e celular.
   Uso: node labs/manual-portfolio-feg/build.mjs && node labs/manual-portfolio-feg/qa.cjs */
const path = require('path'), { execSync } = require('child_process');
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const URL = 'file://' + path.resolve(__dirname, '../../public/manual-gestao-portfolio-feg.html');
let ok = 0, falhas = 0;
const checar = (cond, nome, extra) => { if(cond){ ok++; } else { falhas++; console.log('✗ ' + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : '')); } };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if(m.type() === 'error') erros.push(m.text()); });
  const est = () => p.evaluate(() => window.MANUAL_PLAYER.estado());

  // visão geral
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  checar(await p.locator('.hm-hero h1').isVisible(), 'visão geral: título visível');
  checar(await p.locator('.hm-card').count() === 12, 'visão geral: 12 cartões de módulo', await p.locator('.hm-card').count());
  checar(await p.locator('.hm-passos li').count() === 3, 'visão geral: método em 3 tempos');
  checar(await p.locator('.side-mod').count() === 12, 'menu: 12 módulos');
  checar(await p.locator('.mt-top .ons').isVisible(), 'topo: logo ONS');
  const href = await p.locator('.mt-btn-app').getAttribute('href');
  checar(href === 'gestao-portfolio-feg.html', 'topo: link para o sistema', href);

  // abrir módulo pela trilha
  await p.click('.hm-card >> nth=2');
  await p.waitForTimeout(300);
  let s = await est();
  checar(s.mod === 'm2' && !s.tocando && s.T === 0, 'módulo aberto parado no início', s);
  checar(await p.locator('.cover.on[data-tipo="inicio"]').isVisible(), 'capa de início com play');
  checar(await p.locator('.pl-steps button').count() === 6, 'lista de passos do módulo');
  checar(await p.evaluate(() => document.documentElement.dataset.ambiente) === 'operacao', 'ambiente do nível 1');

  // play
  await p.click('.cv-play'); await p.waitForTimeout(1300);
  s = await est();
  checar(s.tocando && s.T > .8, 'play: o tempo avança', s);
  checar(!(await p.locator('.cover.on').count()), 'play: capa some');
  checar(await p.getAttribute('[data-acao="play"]', 'aria-label') === 'Pausar', 'botão vira Pausar');
  // pause
  await p.click('[data-acao="play"]'); const t1 = (await est()).T; await p.waitForTimeout(600); s = await est();
  checar(!s.tocando && Math.abs(s.T - t1) < .01, 'pause: o tempo para', { t1, T: s.T });
  checar(await p.locator('.pausa-ind.on').count() === 1, 'pause: indicador de pausa');
  // próximo / anterior
  await p.click('[data-acao="prox"]'); s = await est();
  checar(s.idx === 1, 'próximo passo', s);
  await p.click('[data-acao="prox"]'); await p.click('[data-acao="ant"]'); s = await est();
  checar(s.idx === 1, 'passo anterior', s);
  checar(/Passo 2 de 6/.test(await p.textContent('.caption')), 'legenda acompanha o passo');
  // stop
  await p.click('[data-acao="stop"]'); s = await est();
  checar(s.T === 0 && !s.tocando && s.idx === 0, 'stop: volta ao início parado', s);
  checar(await p.locator('.cover.on[data-tipo="inicio"]').count() === 1, 'stop: capa de início');
  // reiniciar
  await p.click('[data-acao="reiniciar"]'); await p.waitForTimeout(500); s = await est();
  checar(s.tocando && s.T > 0 && s.T < 1.2, 'reiniciar: toca do começo', s);
  await p.click('[data-acao="play"]');
  // linha do tempo
  const tl = await p.locator('[data-tl]').boundingBox();
  await p.mouse.click(tl.x + tl.width * .5, tl.y + tl.height / 2); s = await est();
  checar(Math.abs(s.T / s.total - .5) < .03, 'linha do tempo: clicar leva ao ponto', s);
  await p.click('.pl-steps button >> nth=4'); await p.waitForTimeout(200); s = await est();
  checar(s.idx === 4 && s.tocando, 'lista de passos: vai ao passo e toca', s);
  await p.click('[data-acao="play"]');

  // zoom manual
  const tr0 = await p.$eval('[data-cam]', e => e.style.transform);
  await p.click('[data-acao="zmais"]'); s = await est();
  checar(s.uz === 1.25, 'zoom in', s.uz);
  const tr1 = await p.$eval('[data-cam]', e => e.style.transform);
  checar(tr0 !== tr1, 'zoom in muda a câmera');
  await p.click('[data-acao="zmais"]'); await p.click('[data-acao="zmenos"]'); s = await est();
  checar(s.uz === 1.25, 'zoom out', s.uz);
  await p.click('[data-acao="ajustar"]'); s = await est();
  checar(s.uz === 1, 'ajustar zoom', s.uz);
  checar(/100%/.test(await p.textContent('[data-zval]')), 'indicador de zoom');

  // fundo
  await p.evaluate(() => { const P = window.MANUAL_PLAYER; P.irCena(3); P.irPara(P.estado().T + 3.5); });
  for(const m of ['escurecer', 'desfocar', 'transparente', 'normal']){
    await p.click(`.pl-fundo [data-modo="${m}"]`);
    const r = await p.evaluate(() => ({ f: document.querySelector('[data-base]').style.filter, o: document.querySelector('[data-base]').style.opacity, foco: document.querySelector('[data-foco]').style.opacity, modo: document.querySelector('.pl').dataset.modo }));
    const esperado = { escurecer: /brightness\(0\.3/, desfocar: /blur\(5/, transparente: /none/, normal: /none/ }[m];
    checar(r.modo === m && esperado.test(r.f), `fundo ${m}: filtro aplicado`, r);
    if(m === 'transparente') checar(+r.o < .2 && +r.foco > .9, 'fundo transparente: só o recorte aparece', r);
    if(m === 'normal') checar(+r.foco === 0, 'fundo normal: sem recorte', r);
  }
  await p.click('.pl-fundo [data-modo="escurecer"]');
  checar(await p.evaluate(() => document.querySelector('.ring').style.opacity) === '1', 'contorno do alvo visível');
  checar(await p.evaluate(() => +document.querySelector('.callout').style.opacity) > .9, 'texto da seta visível');
  checar(await p.evaluate(() => +document.querySelector('.arrow').style.opacity) > .9, 'seta visível');
  checar(await p.evaluate(() => +document.querySelector('[data-cursor]').style.opacity) > .9, 'cursor demonstrando o clique');

  // dicas e tooltip
  await p.evaluate(() => { const P = window.MANUAL_PLAYER; P.irCena(4); P.irPara(P.estado().T + 4.4); });
  checar(await p.locator('.hot').count() === 1, 'dica numerada presente');
  checar(await p.locator('.tipcard:not([hidden])').count() === 1, 'tooltip automático da dica');
  checar(/Veredito/.test(await p.textContent('.tipcard')), 'tooltip com o conteúdo da dica');
  await p.evaluate(() => { const P = window.MANUAL_PLAYER; P.irCena(0); P.irPara(P.estado().T + 3); });
  checar(await p.locator('.tipcard:not([hidden])').count() === 0, 'tooltip some ao trocar de cena');
  await p.evaluate(() => { const P = window.MANUAL_PLAYER; P.irCena(4); P.irPara(P.estado().T + 9); });
  await p.hover('.hot'); await p.waitForTimeout(100);
  checar(await p.locator('.tipcard:not([hidden])').count() === 1, 'tooltip ao passar o mouse');
  await p.click('.hot'); s = await est();
  checar(!s.tocando, 'clicar na dica pausa');

  // velocidade, legenda
  await p.click('[data-acao="vel"]');
  checar(/1,25×/.test(await p.textContent('[data-vel]')), 'velocidade 1,25×');
  await p.click('[data-acao="cc"]');
  checar(!(await p.locator('.caption').isVisible()), 'legenda desligada');
  await p.click('[data-acao="cc"]');
  checar(await p.locator('.caption').isVisible(), 'legenda religada');

  // teclado
  await p.click('[data-acao="stop"]');
  await p.locator('[data-stage]').focus();
  await p.keyboard.press('Space'); await p.waitForTimeout(300); s = await est();
  checar(s.tocando, 'tecla espaço toca', s);
  await p.keyboard.press('Space'); s = await est();
  checar(!s.tocando, 'tecla espaço pausa', s);
  await p.keyboard.press('ArrowRight'); s = await est(); const i0 = s.idx;
  await p.keyboard.press('ArrowRight'); s = await est();
  checar(s.idx === i0 + 1, 'seta direita avança passo', s);
  await p.keyboard.press('3'); s = await est();
  checar(s.idx === 2, 'tecla 3 vai ao passo 3', s);
  await p.keyboard.press('+'); s = await est(); checar(s.uz > 1, 'tecla + aproxima');
  await p.keyboard.press('0'); s = await est(); checar(s.uz === 1, 'tecla 0 ajusta');
  await p.keyboard.press('b'); s = await est(); checar(s.modo === 'desfocar', 'tecla B troca o fundo', s.modo);
  await p.keyboard.press('s'); s = await est(); checar(s.T === 0 && !s.tocando, 'tecla S para');

  // fim do módulo, progresso e quiz
  await p.evaluate(() => { const P = window.MANUAL_PLAYER; P.irPara(P.estado().total - .4); P.acao('play'); });
  await p.waitForTimeout(900); s = await est();
  checar(s.fim, 'fim do clipe', s);
  checar(await p.locator('.cover.on[data-tipo="fim"]').isVisible(), 'capa de módulo concluído');
  checar(await p.locator('.side-mod.on.ok').count() === 1, 'menu marca o módulo como assistido');
  checar(/1 de 12/.test(await p.textContent('[data-prog-txt]')), 'progresso geral 1 de 12');
  await p.click('[data-resp="0"]');
  checar(await p.locator('[data-resp="0"].errado').count() === 1, 'quiz: resposta errada sinalizada');
  await p.click('[data-resp="2"]');
  checar(await p.locator('[data-resp="2"].certo').count() === 1, 'quiz: resposta certa confirmada');
  const salvo = await p.evaluate(() => JSON.parse(localStorage.getItem('gp-manual-v1')));
  checar(salvo.visto.m2 && salvo.quiz.m2 && salvo.pref.modo === 'desfocar', 'progresso e preferências salvos', salvo);
  // próximo módulo pela capa final toca sozinho
  await p.click('.cover [data-cv="prox"]'); await p.waitForTimeout(700); s = await est();
  checar(s.mod === 'm3' && s.tocando, 'próximo módulo abre tocando', s);
  await p.click('[data-acao="play"]');
  // links "Experimente"
  const exp = await p.getAttribute('.cap-exp', 'href');
  checar(/^gestao-portfolio-feg\.html#\//.test(exp), 'Experimente aponta para a tela do sistema', exp);
  // atalhos
  await p.click('[data-atalhos]');
  checar(await p.locator('.mt-modal').isVisible(), 'janela de atalhos');
  await p.keyboard.press('Escape');
  checar(!(await p.locator('.mt-modal').count()), 'Esc fecha a janela de atalhos');
  // persistência ao recarregar
  await p.goto(URL + '#/'); await p.waitForTimeout(300);
  checar(await p.locator('.hm-card.ok').count() === 1, 'visão geral mostra o módulo assistido');
  // cobertura: todas as cenas renderizam sem erro
  const total = await p.evaluate(async () => { let n = 0; for(const m of window.MANUAL.modulos){ location.hash = '#/' + m.id; await new Promise(r => setTimeout(r, 60)); for(let i = 0; i < m.cenas.length; i++){ const P = window.MANUAL_PLAYER; P.irCena(i); P.irPara(P.estado().T + 4.5); n++; } } return n; });
  checar(total === 59, 'todas as cenas percorridas', total);

  // celular
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  m.on('pageerror', e => erros.push('mobile: ' + e.message));
  await m.goto(URL + '#/m1'); await m.waitForTimeout(400);
  const larg = await m.evaluate(() => document.documentElement.scrollWidth);
  checar(larg <= 390, 'celular: sem rolagem horizontal', larg);
  await m.tap('.cv-play'); await m.waitForTimeout(800);
  checar((await m.evaluate(() => window.MANUAL_PLAYER.estado())).tocando, 'celular: toque no play');
  const cb = await m.locator('.ctrl .cb').evaluateAll(es => es.filter(e => e.offsetParent).map(e => e.getBoundingClientRect().height));
  checar(cb.every(h => h >= 38), 'celular: botões com área de toque', cb);
  await m.goto(URL); await m.waitForTimeout(300);
  checar(await m.evaluate(() => document.documentElement.scrollWidth) <= 390, 'celular: visão geral sem rolagem horizontal');

  checar(!erros.length, 'sem erros no console', erros);
  console.log(`QA manual: ${ok} ok · ${falhas} falha(s)`);
  await b.close();
  process.exit(falhas ? 1 : 0);
})();
