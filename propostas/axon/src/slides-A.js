/* =============================================================================
   slides-A.js · Proposta A · GMO · hooks por slide (init / enter / leave)
   - DOM estrutural só no init (heatmap do A2); enter/leave mudam estado.
   - Efeitos com ctx.fx / AxonDeck.fx: cancelados ao sair, instantâneos em
     movimento reduzido. Uma animação por vez por slide (fichas de controle).
   ========================================================================== */
'use strict';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const popEl = () => document.getElementById('rvpop');
const reducedA = () => (window.AxonDeck && AxonDeck.reducedMotion && AxonDeck.reducedMotion()) || false;
/** Espera real (não encolhe no movimento reduzido), cancelada quando o sinal aborta. */
function holdA(ms, signal) {
  return new Promise((res) => {
    const t = setTimeout(res, ms);
    if (signal) signal.addEventListener('abort', () => clearTimeout(t), { once: true });
  });
}
/** Destaca, no popover recém-aberto, o trecho ligado ao gatilho (classe .rv-mark do motor). */
function markInPop(sel) { AxonDeck.reveal.mark(sel); }

/* =============================================================================
   A1 · o impulso desce o fio e acende Permanece › Muda › Nasce;
        ▶ Rodar atravessa Job 1 › Job 2 › Job 3 e abre as evidências do MVP (R-01)
   ========================================================================== */
(function () {
  let runTok = 0;
  AxonDeck.register('A1', {
    init(el) {
      const run = $('.a1-run', el);
      run.addEventListener('click', async () => {
        const my = ++runTok;
        const fx = AxonDeck.fx;
        const strip = $('.a1-jobs', el);
        const jobs = $$('.a1-job', el);
        const dot = $('.a1-jobs .impulse', el);
        jobs.forEach((j) => j.classList.remove('is-done'));
        const y = strip.offsetHeight / 2;
        await fx.travel(dot, [{ x: -6, y }, jobs[0]], { duration: 240 });
        if (my !== runTok) return;
        jobs[0].classList.add('is-done');
        for (let i = 1; i < jobs.length; i++) {
          await fx.travel(dot, [jobs[i - 1], jobs[i]], { duration: 300 });
          if (my !== runTok) return;
          jobs[i].classList.add('is-done');
        }
        const end = fx.center(run, strip);
        await fx.travel(dot, [jobs[2], { x: end.x - run.offsetWidth / 2 - 4, y }], { duration: 200 });
        if (my !== runTok) return;
        fx.travel(dot, [{ x: end.x - run.offsetWidth / 2 - 4, y }], { duration: 0, hide: true });
        fx.pulse(run, { size: 10 });
        AxonDeck.reveal.show('R-01', run);
      });
    },
    async enter(el, ctx) {
      runTok++;
      const box = $('.a1-left', el);
      const cards = [$('.a1-perm', el), $('.a1-muda', el), $('.a1-nasce', el)];
      const nodes = $$('.a1-fiber .node', el);
      const dot = $('.a1-fiber .impulse', el);
      $$('.a1-job', el).forEach((j) => j.classList.remove('is-done'));
      cards.forEach((c) => c.classList.remove('is-lit'));
      nodes.forEach((n) => n.classList.remove('is-lit'));
      box.classList.add('a1-pre');
      const light = (i) => {
        nodes[i].classList.add('is-lit');
        cards[i].classList.add('is-lit');
        if (i === 1) ctx.fx.pulse(cards[i], { size: 12 });
      };
      await ctx.fx.wait(320);
      await ctx.fx.travel(dot, [{ x: 6, y: 0 }, nodes[0]], { duration: 260 });
      light(0);
      for (let i = 1; i < nodes.length; i++) {
        await ctx.fx.wait(150);
        await ctx.fx.travel(dot, [nodes[i - 1], nodes[i]], { duration: 300 });
        light(i);
      }
      await ctx.fx.wait(160);
      await ctx.fx.travel(dot, [nodes[2]], { duration: 0, hide: true });
      box.classList.remove('a1-pre');
    },
    leave(el) {
      runTok++;
      $('.a1-left', el).classList.remove('a1-pre');
      $$('.a1-job', el).forEach((j) => j.classList.remove('is-done'));
    }
  });
})();

/* =============================================================================
   A2 · heatmap (35 células "a mapear"), alternador que transforma os três
        passos um a um, legenda com célula de exemplo e fichas pré-identificadas
   ========================================================================== */
(function () {
  const GER = ['PE', 'PR', 'PL', 'OS', 'PD'];
  const ROWS = [
    ['Operam rodadas e mantêm legados', 'Alta'],
    ['Preparam estudos de vez em quando', 'Média'],
    ['Só executam e conferem', 'Média'],
    ['Consultam resultados', 'Baixa a média'],
    ['Constroem modelos e containers', 'Alta, como ganho'],
    ['Gerem orçamento de nuvem', 'Nova'],
    ['Agentes do setor (externos)', 'Baixa, mesmo canal']
  ];
  const escA = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let segTok = 0, demoTok = 0;

  AxonDeck.register('A2', {
    init(el) {
      const hm = $('.a2-hm', el);
      hm.insertAdjacentHTML('beforeend', ROWS.map(([perfil, hip], r) => {
        const agentes = r === ROWS.length - 1;
        const rowh = agentes
          ? '<button class="hm-rowh rv a2-rowh" data-reveal="#tpl-a2-agentes" data-label="' + escA(perfil) + '"><span>' + escA(perfil) + '</span></button>'
          : '<button class="hm-rowh rv a2-rowh" data-reveal="R-07" data-pick="' + escA(perfil) + '" data-label="' + escA(perfil) + '"><span>' + escA(perfil) + '</span></button>';
        return rowh + '<span class="hm-tag">' + escA(hip) + '</span>' +
          GER.map((g, c) => '<button class="hm-cell rv" style="--c:' + c + '" data-reveal="R-14" data-reveal-title="Ficha de impacto · ' + g + '" data-label="Célula gerência × perfil" data-ger="' + g +
            '" data-perfil="' + escA(perfil) + '" aria-label="' + g + ' × ' + escA(perfil) + ': a mapear"></button>').join('');
      }).join(''));

      // Hoje ⟷ Com Axon: cada passo se transforma, um a um; o macroprocesso (faixa navy) não se mexe
      el.addEventListener('seg:change', async (e) => {
        const t = e.detail && e.detail.target;
        if (!t || t.id !== 'a2-tempo') return;
        const my = ++segTok;
        const steps = $$('.a2-s', el);
        for (let k = 0; k < steps.length; k++) {
          if (k) await AxonDeck.fx.wait(170);
          if (my !== segTok) return;
          steps[k].dataset.face = e.detail.value;
        }
      });

      // Legenda: uma única célula de exemplo percorre a mapear › hipótese › validado
      const demo = $('.a2-demo', el), cell = $('.a2-demo-cell', el);
      const sts = $$('.a2-demo-st [data-st]', el);
      const setSt = (k) => {
        if (k === 'map') cell.removeAttribute('data-state'); else cell.dataset.state = k;
        sts.forEach((s) => s.classList.toggle('is-cur', s.dataset.st === k));
      };
      $('.a2-leg', el).addEventListener('click', async () => {
        const my = ++demoTok;
        const fx = AxonDeck.fx;
        setSt('map');
        demo.classList.add('is-on');
        await fx.wait(650);
        if (my !== demoTok) return;
        setSt('hyp');
        await fx.wait(850);
        if (my !== demoTok) return;
        setSt('val');
        fx.pulse(cell, { size: 8 });
      });

      // Fichas: a revelação nasce identificada (gerência × perfil); o título vem de data-reveal-title
      el.addEventListener('reveal:open', (e) => {
        const t = e.detail && e.detail.trigger;
        const p = popEl();
        if (!t || !t.getAttribute || !p) return;
        if (e.detail.key === 'R-14' && t.dataset.ger) {
          const v = $$('.rv-ficha-f .rv-ficha-v', p);
          [[0, t.dataset.ger], [1, t.dataset.perfil]].forEach(([i, txt]) => {
            if (!v[i]) return;
            v[i].textContent = txt;
            v[i].parentElement.classList.add('is-set');   // gerência e perfil em linhas inteiras
          });
          AxonDeck.reveal.reposition();
        }
      });
    },
    enter(el) {
      segTok++; demoTok++;
      $$('.a2-s', el).forEach((s) => { s.dataset.face = 'hoje'; });
      const demo = $('.a2-demo', el);
      demo.classList.remove('is-on');
      $('.a2-demo-cell', el).removeAttribute('data-state');
      $$('.a2-demo-st [data-st]', el).forEach((s) => s.classList.remove('is-cur'));
    },
    leave() { segTok++; demoTok++; }
  });
})();

/* =============================================================================
   A3 · condução saltatória nos 4R; a faixa Guardiões liga-se a dois riscos
   ========================================================================== */
(function () {
  AxonDeck.register('A3', {
    init(el) {
      el.addEventListener('reveal:open', (e) => {
        const t = e.detail && e.detail.trigger;
        if (t && t.classList && t.classList.contains('a3-band')) el.classList.add('a3-linked');
      });
    },
    async enter(el, ctx) {
      el.classList.remove('a3-linked');
      const box = $('.a3-steps', el);
      const steps = $$('.step', box);
      const chevs = $$(':scope > .chev', box);
      const dot = $(':scope > .impulse', box);
      steps.forEach((s) => s.classList.remove('is-lit'));
      box.classList.add('a3-pre');
      const head = (i) => $('.step-head', steps[i]);
      await ctx.fx.wait(380);
      const h0 = head(0);
      const start = { x: h0.offsetLeft + 4, y: h0.offsetTop + h0.offsetHeight / 2 };
      await ctx.fx.travel(dot, [start], { duration: 0 });
      steps[0].classList.add('is-lit');
      for (let i = 0; i < chevs.length; i++) {
        await ctx.fx.wait(150);
        await ctx.fx.hop(dot, i === 0 ? start : chevs[i - 1], chevs[i], { height: 18, duration: 340 });
        steps[i + 1].classList.add('is-lit');
      }
      await ctx.fx.wait(220);
      await ctx.fx.travel(dot, [chevs[chevs.length - 1]], { duration: 0, hide: true });
      box.classList.remove('a3-pre');
    },
    leave(el) {
      el.classList.remove('a3-linked');
      $('.a3-steps', el).classList.remove('a3-pre');
    }
  });
})();

/* =============================================================================
   A4 · o impulso corre pela sinapse antes de cada revelação; o laço da escuta
        gira uma volta; simulação ilustrativa de duas inquietações
   ========================================================================== */
(function () {
  const SIMS = [
    { msg: '“Não acho o resultado do meu estudo”', tag: 'dúvida', dest: 'Guia de Bolso' },
    { msg: '“Vou perder meu papel?”', tag: 'receio', dest: 'ação de mudança' }
  ];
  let loopTok = 0, simTok = 0, simIdx = 0, simBusy = false, simQueue = 0;

  AxonDeck.register('A4', {
    init(el) {
      const nodes = $$('.a4-n', el);
      const paths = $$('.a4-syn .a4-p', el);
      const dot = $('.a4-dot', el);
      // clique num nó: impulso do centro até o nó e, então, a revelação
      nodes.forEach((n, i) => n.addEventListener('click', async (e) => {
        if (n.getAttribute('aria-expanded') === 'true') return; // o motor fecha (alternância)
        e.preventDefault();
        e.stopPropagation();
        AxonDeck.reveal.close();
        const fx = AxonDeck.fx;
        await fx.along(dot, paths[i], { duration: 240 });
        fx.travel(dot, [n], { duration: 0, hide: true });
        AxonDeck.reveal.open(n);
        fx.pulse(n, { size: 10 });
      }));

      // "Você fala": o laço gira uma volta completa
      const you = $('.a4-s--you', el);
      const ldot = $('.a4-ldot', el);
      const track = $('.a4-track', el);
      const cap = $('.a4-cap', el);
      you.addEventListener('click', async () => {
        if (simBusy) return;
        const my = ++loopTok;
        cap.classList.add('is-on');
        await AxonDeck.fx.along(ldot, track, { duration: 1500, hide: true });
        if (my !== loopTok) return;
        AxonDeck.fx.pulse(you, { size: 10 });
      });

      // Simule uma inquietação (ilustrativo): o cartão percorre o laço e cai no destino
      const sim = $('.a4-sim', el);
      const card = $('.a4-msg', el);
      const loop = $('.a4-loop', el);
      const st = $$('.a4-s', el);
      const out = { msg: $('.a4-o-msg', el), tag: $('.a4-o-tag', el), dest: $('.a4-o-dest', el), chev: $$('.a4-out .chev', el) };
      // um clique durante a animação entra na fila (o passo de build 2 pode chegar antes de o 1 terminar)
      sim.addEventListener('click', () => {
        if (simBusy) { simQueue = Math.min(simQueue + 1, SIMS.length); return; }
        runSim();
      });
      async function runSim() {
        simBusy = true; loopTok++;
        const my = ++simTok;
        const fx = AxonDeck.fx;
        const S = SIMS[simIdx % SIMS.length];
        simIdx++;
        [out.msg, out.tag, out.dest].concat(out.chev).forEach((x) => x.classList.remove('is-on'));
        st.forEach((s) => s.classList.remove('is-hit'));
        cap.classList.remove('is-on');
        card.textContent = S.msg;
        out.msg.textContent = S.msg; out.tag.textContent = S.tag; out.dest.textContent = S.dest;
        const c = st.map((s) => fx.center(s, loop));
        await fx.travel(card, [c[0]], { duration: 0 });
        st[0].classList.add('is-hit');
        out.msg.classList.add('is-on');
        await fx.wait(380);
        await fx.travel(card, [c[0], c[1]], { duration: 420 });
        st[1].classList.add('is-hit');
        out.chev[0].classList.add('is-on'); out.tag.classList.add('is-on');
        await fx.wait(380);
        await fx.travel(card, [c[1], c[2]], { duration: 420 });
        st[2].classList.add('is-hit');
        out.chev[1].classList.add('is-on'); out.dest.classList.add('is-on');
        await fx.wait(300);
        await fx.travel(card, [c[2], c[3]], { duration: 420, hide: true });
        st[3].classList.add('is-hit');
        if (my !== simTok) return;
        simBusy = false;
        if (simQueue > 0) { simQueue--; runSim(); }
      }
    },
    enter(el) {
      loopTok++; simTok++; simBusy = false; simIdx = 0; simQueue = 0;
      $$('.a4-s', el).forEach((s) => s.classList.remove('is-hit'));
      $$('.a4-out > *', el).forEach((x) => x.classList.remove('is-on'));
      $('.a4-cap', el).classList.remove('is-on');
    },
    leave() { loopTok++; simTok++; simBusy = false; simQueue = 0; }
  });
})();

/* =============================================================================
   A5 · o impulso percorre o cronograma e para em cada ◆; só salta quando o
        portão abre (gate:open). Rodada espelho animada no popover da Onda 0.
   ========================================================================== */
(function () {
  let pos = 0, hopTok = 0, chain = Promise.resolve();
  const opened = new Set();
  const PARK = 17;   // o impulso para logo antes do ◆ (o número do portão fica legível)

  function marks(el) { return $$('.a5-axis .a5-g', el); }
  function xAt(el, i) {
    const axis = $('.a5-axis', el);
    const g = marks(el);
    return i < g.length ? axis.offsetWidth * Number(g[i].style.getPropertyValue('--at')) / 6 : axis.offsetWidth;
  }
  function setLit(el, i, instant) {
    const lit = $('.a5-lit', el);
    if (instant) { lit.style.transition = 'none'; void lit.offsetWidth; }
    lit.style.width = xAt(el, i) + 'px';
    if (instant) { void lit.offsetWidth; lit.style.transition = ''; }
  }

  AxonDeck.register('A5', {
    init(el) {
      el.addEventListener('gate:open', (e) => {
        const code = e.detail && e.detail.gate;
        const i = ['◆1', '◆2', '◆3'].indexOf(code);
        if (i < 0) return;
        opened.add(i);
        const my = hopTok;
        chain = chain.then(async () => {
          if (my !== hopTok || !opened.has(pos)) return;
          await holdA(reducedA() ? 0 : 950);          // deixa o popover fechar para o salto ser visto
          const fx = AxonDeck.fx;
          const axis = $('.a5-axis', el), dot = $('.a5-dot', el);
          const y = axis.offsetHeight / 2;
          while (my === hopTok && opened.has(pos) && pos < 3) {
            const from = { x: xAt(el, pos) - PARK, y }, to = { x: xAt(el, pos + 1) - (pos + 1 < 3 ? PARK : 0), y };
            pos++;
            setLit(el, pos);
            await fx.hop(dot, from, to, { height: 26, duration: 450 });
            const nxt = marks(el)[pos];
            if (nxt) fx.pulse($('.diamond', nxt), { size: 12 });
          }
        });
      });

      el.addEventListener('reveal:open', (e) => {
        const t = e.detail && e.detail.trigger;
        const p = popEl();
        if (!t || !p) return;
        if (e.detail.key === '#tpl-a5-escada' && t.dataset.step) markInPop('[data-step="' + t.dataset.step + '"]');
        if (e.detail.key === '#tpl-a5-espelho') mirrorRun(p);
      });
    },
    async enter(el, ctx) {
      hopTok++; pos = 0; opened.clear(); chain = Promise.resolve();
      const axis = $('.a5-axis', el), dot = $('.a5-dot', el);
      setLit(el, 0, true);
      $('.a5-lit', el).style.width = '0px';
      const y = axis.offsetHeight / 2;
      await ctx.fx.wait(450);
      await ctx.fx.travel(dot, [{ x: 0, y }, { x: xAt(el, 0) - PARK, y }], { duration: 700, easing: 'ease-out' });
      setLit(el, 0);
      ctx.fx.pulse($('.diamond', marks(el)[0]), { size: 12 });
    },
    leave() { hopTok++; opened.clear(); }
  });

  /** Rodada espelho (ilustrativa): dois impulsos correm; ao chegar, o aceite e o registro aparecem. */
  async function mirrorRun(p) {
    const fx = AxonDeck.fx;
    const box = $('.a5m', p);
    const fibers = $$('.a5m-f', p);
    if (!box || fibers.length < 2) return;
    box.classList.add('is-running');
    $$('.a5m-end', p).forEach((n) => n.classList.remove('is-lit'));
    await fx.wait(220);
    await Promise.all(fibers.map((f) => fx.travel($('.impulse', f), [{ x: 0, y: 6 }, { x: f.offsetWidth, y: 6 }], { duration: 1150, easing: 'ease-in-out' })));
    $$('.a5m-end', p).forEach((n) => n.classList.add('is-lit'));
    box.classList.remove('is-running');
  }
})();

/* =============================================================================
   A6 · checks em sequência (CSS); assinatura por 2 s no fim do deck;
        critério de aceite destacado conforme a linha clicada
   ========================================================================== */
(function () {
  AxonDeck.register('A6', {
    init(el) {
      $$('.a6-tbl .ck', el).forEach((c, i) => c.style.setProperty('--k', i));
      el.addEventListener('reveal:open', (e) => {
        const t = e.detail && e.detail.trigger;
        if (t && e.detail.key === '#tpl-a6-aceite' && t.dataset.row) markInPop('[data-row="' + t.dataset.row + '"]');
      });
    },
    async enter(el, ctx) {
      const sig = $('.a6-sig', el);
      sig.classList.remove('is-on');
      await holdA(reducedA() ? 200 : 1350, ctx.signal);
      if (ctx.signal.aborted) return;
      sig.classList.add('is-on');
      await holdA(2000, ctx.signal);
      if (ctx.signal.aborted) return;
      sig.classList.remove('is-on');
      await holdA(reducedA() ? 160 : 480, ctx.signal);   // a entrada só "assenta" depois do fade-out
    },
    leave(el) { $('.a6-sig', el).classList.remove('is-on'); }
  });
})();
