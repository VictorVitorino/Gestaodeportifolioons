/* slides-B.js · STUB DO MOTOR (provisório). */

/* B1 · ▶ Sincronizar: três impulsos em velocidades diferentes; o ◆ só acende quando o terceiro chega */
AxonDeck.register('B1', {
  init(el) {
    const plan = el.querySelector('.b1-plan');
    el.querySelector('.b1-run').addEventListener('click', async () => {
      plan.classList.remove('is-sync');
      const fx = AxonDeck.fx;
      const rails = Array.from(el.querySelectorAll('.b1-rail'));
      const target = plan.querySelector('.diamond');
      const runs = rails.map((r, i) => {
        const dot = r.querySelector('.impulse');
        const fib = r.querySelector('.b1-fib');
        return fx.travel(dot, [{ x: 0, y: 6 }, { x: fib.offsetWidth, y: 6 }], { duration: [900, 1300, 1800][i], hide: true });
      });
      await Promise.all(runs);
      plan.classList.add('is-sync');
      fx.pulse(target, { size: 18 });
    });
  },
  enter(el) { el.querySelector('.b1-plan').classList.remove('is-sync'); }
});

/* B2 · heatmap compacto gerado no init; perfis de maior intensidade esperada marcados como hipótese */
AxonDeck.register('B2', {
  init(el) {
    const hm = el.querySelector('.b2-hm');
    const perfis = [
      ['Operam rodadas e mantêm legados', true],
      ['Preparam estudos', false],
      ['Só executam', false],
      ['Consultam resultados', false],
      ['Constroem modelos', true],
      ['Gerem orçamento de nuvem', false],
      ['Agentes do setor', false]
    ];
    hm.insertAdjacentHTML('beforeend', perfis.map(([p, hi]) =>
      '<button class="hm-rowh rv' + (hi ? ' is-hi' : '') + '" data-reveal="R-07" data-pick="' + p + '">' + p + '</button>' +
      [0, 1, 2, 3, 4].map(() => '<button class="hm-cell rv' + (hi ? ' is-hi' : '') + '" data-reveal="R-14" data-label="Célula gerência × perfil" aria-label="Célula ' + p + ': a mapear"></button>').join('')
    ).join(''));
  }
});

/* B4 · impulso percorre a raia Pessoas e para no G0; cada portão aberto faz o impulso saltar */
AxonDeck.register('B4', {
  init(el) {
    el.addEventListener('gate:open', (e) => {
      const gates = Array.from(el.querySelectorAll('.b4-gm'));
      const i = gates.findIndex((g) => g.dataset.pick === e.detail.gate);
      if (i < 0) return;
      const fib = el.querySelector('.b4-fiber');
      const dot = fib.querySelector('.impulse');
      const at = (g) => ({ x: g.offsetLeft, y: 6 });
      const to = gates[i + 1] ? at(gates[i + 1]) : { x: fib.offsetWidth, y: 6 };
      AxonDeck.fx.hop(dot, at(gates[i]), to, { height: 24 });
    });
  },
  async enter(el, ctx) {
    const fib = el.querySelector('.b4-fiber');
    const g0 = el.querySelector('.b4-gm');
    await ctx.fx.wait(400);
    await ctx.fx.travel(fib.querySelector('.impulse'), [{ x: 0, y: 6 }, { x: g0.offsetLeft, y: 6 }], { duration: 1000 });
    ctx.fx.pulse(g0.querySelector('.diamond'));
  }
});

/* B5 · simulação ilustrativa: a inquietação desce o funil */
AxonDeck.register('B5', {
  init(el) {
    el.querySelector('.b5-sim').addEventListener('click', () => {
      const layers = Array.from(el.querySelectorAll('.b5-layers li'));
      AxonDeck.fx.travel(el.querySelector('.b5-imp'), layers.slice(0, 2), { duration: 900, hide: true });
    });
  }
});

/* B6 · passar o mouse (ou focar) numa linha acende os meses na mini linha do tempo */
AxonDeck.register('B6', {
  init(el) {
    const ticks = Array.from(el.querySelectorAll('.b6-mini span'));
    const lit = (tr) => {
      const [a, b] = (tr ? tr.dataset.m : '0-0').split('-').map(Number);
      ticks.forEach((t, i) => t.classList.toggle('is-hi', !!tr && i + 1 >= a && i + 1 <= b));
    };
    el.querySelectorAll('.b6-tbl tbody tr').forEach((tr) => {
      tr.addEventListener('mouseenter', () => lit(tr));
      tr.addEventListener('focusin', () => lit(tr));
      tr.addEventListener('mouseleave', () => lit(null));
    });
  }
});
