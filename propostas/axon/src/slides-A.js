/* slides-A.js · STUB DO MOTOR (provisório). Mostra o padrão de hooks:
   init (uma vez; pode gerar DOM), enter (a cada entrada; anima com ctx.fx), leave. */

/* A1 · o impulso desce o fio e acende os três cards; ▶ Rodar percorre os jobs e abre R-01 */
AxonDeck.register('A1', {
  init(el) {
    const run = el.querySelector('.a1-run');
    run.addEventListener('click', async () => {
      const jobs = el.querySelectorAll('.a1-job');
      const dot = el.querySelector('.a1-jobs .impulse');
      await AxonDeck.fx.travel(dot, [jobs[0], jobs[1], jobs[2]], { duration: 1100, hide: true });
      AxonDeck.reveal.show('R-01', run);
    });
  },
  async enter(el, ctx) {
    el.querySelectorAll('.is-lit').forEach((x) => x.classList.remove('is-lit'));
    const dot = el.querySelector('.a1-fiber .impulse');
    const nodes = el.querySelectorAll('.a1-fiber .node');
    const cards = [el.querySelector('.a1-perm'), el.querySelector('.a1-muda'), el.querySelector('.a1-nasce')];
    await ctx.fx.wait(300);
    await ctx.fx.travel(dot, [nodes[0]], { duration: 0 });
    for (let i = 0; i < nodes.length; i++) {
      if (i) await ctx.fx.travel(dot, [nodes[i - 1], nodes[i]], { duration: 240 });
      nodes[i].classList.add('is-lit');
      cards[i].classList.add('is-lit');
      if (i === 1) ctx.fx.pulse(cards[i]);
      await ctx.fx.wait(150);
    }
  },
  leave(el) { el.querySelectorAll('.is-lit').forEach((x) => x.classList.remove('is-lit')); }
});

/* A2 · init gera as 35 células do heatmap (DOM gerado no init entra no modo leitura) */
AxonDeck.register('A2', {
  init(el) {
    const hm = el.querySelector('.a2-hm');
    const rows = [
      ['Operam rodadas e mantêm legados', 'Alta'],
      ['Preparam estudos de vez em quando', 'Média'],
      ['Só executam e conferem', 'Média'],
      ['Consultam resultados', 'Baixa a média'],
      ['Constroem modelos e containers', 'Alta, como ganho'],
      ['Gerem orçamento de nuvem', 'Nova'],
      ['Agentes do setor (externos)', 'Baixa, mesmo canal']
    ];
    const ger = ['PE', 'PR', 'PL', 'OS', 'PD'];
    const html = rows.map(([perfil, hip]) =>
      '<button class="hm-rowh rv" data-reveal="R-07" data-pick="' + perfil + '">' + perfil + '</button>' +
      '<span class="hm-tag">' + hip + '</span>' +
      ger.map((g, c) => '<button class="hm-cell rv" style="--c:' + c + '" data-reveal="R-14" data-label="Célula gerência × perfil" aria-label="' + g + ' × ' + perfil + ': a mapear"></button>').join('')
    ).join('');
    hm.insertAdjacentHTML('beforeend', html); // o motor aplica papéis ARIA depois do init
  }
});

/* A4 · simulação ilustrativa do laço da escuta */
AxonDeck.register('A4', {
  init(el) {
    el.querySelector('.a4-sim').addEventListener('click', async () => {
      const steps = el.querySelectorAll('.a4-loop-row .chip');
      const dot = el.querySelector('.a4-loop-row .impulse');
      await AxonDeck.fx.travel(dot, Array.from(steps), { duration: 1400, hide: true });
    });
  }
});

/* A5 · impulso para no portão ◆1; cada portão aberto faz o impulso saltar ao seguinte */
AxonDeck.register('A5', {
  init(el) {
    el.addEventListener('gate:open', (e) => {
      const gates = Array.from(el.querySelectorAll('.a5-g'));
      const i = gates.findIndex((g) => g.dataset.pick === e.detail.gate);
      const dot = el.querySelector('.a5-fiber .impulse');
      if (i < 0) return;
      const nextTarget = gates[i + 1] || el.querySelector('.a5-fiber');
      const to = gates[i + 1] ? gates[i + 1] : { x: el.querySelector('.a5-fiber').offsetWidth, y: 6 };
      AxonDeck.fx.hop(dot, gates[i], to, { height: 26 });
      if (nextTarget) AxonDeck.fx.pulse(nextTarget.querySelector('.diamond') || nextTarget);
    });
  },
  async enter(el, ctx) {
    const dot = el.querySelector('.a5-fiber .impulse');
    const g1 = el.querySelector('.a5-g');
    await ctx.fx.wait(400);
    await ctx.fx.travel(dot, [{ x: 0, y: 6 }, g1], { duration: 900 });
    ctx.fx.pulse(g1.querySelector('.diamond'));
  }
});

/* A6 · checks da tabela marcam em sequência */
AxonDeck.register('A6', {
  init(el) { el.querySelectorAll('.a6-tbl .ck').forEach((c, i) => c.style.setProperty('--k', i)); }
});
