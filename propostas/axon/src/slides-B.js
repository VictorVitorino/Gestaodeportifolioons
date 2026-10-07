/* =============================================================================
   slides-B.js · Proposta B · TMO · hooks por slide (B1 … B6)
   DOM estrutural só no init; enter/leave mudam estado. Efeitos via AxonDeck.fx
   (cancelados ao sair do slide; instantâneos em movimento reduzido).
   ========================================================================== */

const popBody = () => AxonDeck.reveal.body;

/** Destaca, no popover aberto, o parágrafo [data-k] do gatilho clicado (classe .rv-mark do motor). */
function markPop(k) { if (k) AxonDeck.reveal.mark('[data-k="' + k + '"]'); }

/* ---------------------------------------------------------------------------
   B1 · ▶ Sincronizar: três impulsos em velocidades diferentes; o ◆ Plano Mestre
   só acende quando o terceiro chega ("um sinal sozinho não dispara").
   ------------------------------------------------------------------------ */
AxonDeck.register('B1', {
  init(el) {
    const plan = el.querySelector('.b1-plan');
    const cap = el.querySelector('.b1-cap');
    const keys = ['produto', 'pessoas', 'legados'];
    const dur = { produto: 800, pessoas: 1250, legados: 1750 };
    el.querySelector('.b1-run').addEventListener('click', async () => {
      if (el.__b1run) return;
      el.__b1run = true;
      const fx = AxonDeck.fx;
      plan.classList.remove('is-sync');
      el.querySelectorAll('.b1-rail').forEach((r) => r.classList.remove('is-ready'));
      cap.classList.add('is-on');
      await Promise.all(keys.map((k) =>
        fx.along(el.querySelector('.b1-imp[data-k="' + k + '"]'), el.querySelector('.b1-path[data-k="' + k + '"]'), { duration: dur[k], hide: true })
          .then(() => el.querySelector('.b1-rail[data-k="' + k + '"]').classList.add('is-ready'))));
      plan.classList.add('is-sync');
      fx.pulse(plan.querySelector('.diamond'), { size: 20 });
      el.__b1run = false;
    });
    el.addEventListener('reveal:open', (e) => {
      if (e.detail.key === '#tpl-b1-trilhos' && e.detail.trigger) markPop(e.detail.trigger.getAttribute('data-k'));
    });
    el.addEventListener('gate:open', (e) => {
      if (e.detail.gate !== 'Plano Mestre') return;
      el.querySelectorAll('.b1-rail').forEach((r) => r.classList.add('is-ready'));
    });
  },
  enter(el) {
    el.__b1run = false;
    el.classList.add('b1-armed');
    el.querySelector('.b1-plan').classList.remove('is-sync');
    el.querySelector('.b1-cap').classList.remove('is-on');
    el.querySelectorAll('.b1-rail').forEach((r) => r.classList.remove('is-ready'));
  }
});

/* ---------------------------------------------------------------------------
   B2 · heatmap compacto (35 células "a mapear"), alternador que acende os
   perfis de maior intensidade esperada e "+ onda": a linha tracejada leva a
   ficha ao Plano Mestre (slide 4).
   ------------------------------------------------------------------------ */
AxonDeck.register('B2', {
  init(el) {
    const G = ['PE', 'PR', 'PL', 'OS', 'PD'];
    const escB = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    el.querySelectorAll('.b2-p').forEach((p) => {
      const hi = p.hasAttribute('data-hi');
      // nome completo do perfil: o título do template da linha (a linha mostra a versão curta)
      const tpl = el.querySelector(p.getAttribute('data-reveal'));
      const name = (tpl && tpl.getAttribute('data-title')) || p.textContent.replace(/\s+/g, ' ').trim();
      p.insertAdjacentHTML('afterend', G.map((g, c) =>
        '<button class="hm-cell rv' + (hi ? ' is-hi' : '') + '" style="--c:' + c + '" data-reveal="#tpl-b2-ficha"' +
        ' data-reveal-title="Ficha de impacto · ' + g + '" data-ger="' + g + '" data-perfil="' + escB(name) + '"' +
        ' data-label="Célula do mapa (gerência × perfil)" aria-label="' + g + ' × ' + escB(name) + ': a mapear"></button>').join(''));
    });
    // a ficha nasce identificada: gerência e perfil preenchidos (mesmo comportamento do A2)
    el.addEventListener('reveal:open', (e) => {
      const t = e.detail && e.detail.trigger;
      const body = popBody();
      if (!t || !t.dataset || !t.dataset.ger || !body) return;
      const v = body.querySelectorAll('.rv-ficha-f .rv-ficha-v');
      [[0, t.dataset.ger], [1, t.dataset.perfil]].forEach(([i, txt]) => {
        if (!v[i]) return;
        v[i].textContent = txt;
        v[i].parentElement.classList.add('is-set');
      });
      AxonDeck.reveal.reposition();
    });
    el.querySelector('.b2-onda').addEventListener('click', () => b2Link(el));
    el.querySelector('.b2-next').addEventListener('click', () => AxonDeck.go('B', 4));
  },
  async enter(el, ctx) {
    el.classList.remove('b2-linked');
    el.querySelector('.b2-next').tabIndex = -1;
    // 4R: o impulso desce a fibra e acende os nódulos, um salto por destino
    const fib = el.querySelector('.b2-fib');
    const nodes = Array.from(fib.querySelectorAll('.node'));
    const dot = fib.querySelector('.impulse');
    el.classList.add('b2-armed');
    nodes.forEach((n) => n.classList.remove('is-lit'));
    await ctx.fx.wait(720);
    await ctx.fx.travel(dot, [nodes[0]], { duration: 0 });
    nodes[0].classList.add('is-lit');
    for (let i = 1; i < nodes.length; i++) {
      await ctx.fx.wait(90);
      await ctx.fx.travel(dot, [nodes[i - 1], nodes[i]], { duration: 210, easing: 'ease-out' });
      nodes[i].classList.add('is-lit');
    }
    await ctx.fx.travel(dot, [nodes[nodes.length - 1]], { duration: 0, hide: true });
    el.classList.remove('b2-armed');
  },
  leave(el) { el.classList.remove('b2-linked', 'b2-armed'); }
});

function b2Link(el) {
  const fx = AxonDeck.fx;
  const chip = el.querySelector('.b2-onda');
  const c = fx.center(chip, el);
  const x0 = Math.round(c.x + chip.offsetWidth / 2 + 3), y0 = Math.round(c.y);
  const xg = 715, yb = 645, x1 = 1226;
  const d = 'M' + x0 + ' ' + y0 + ' H' + xg + ' V' + yb + ' H' + x1;
  el.classList.remove('b2-linked');
  el.querySelector('.b2-link-p').setAttribute('d', d);
  el.querySelector('.b2-link-m').setAttribute('d', d);
  el.querySelector('.b2-link-h').setAttribute('d', 'M' + (x1 - 7) + ' ' + (yb - 5) + ' L' + x1 + ' ' + yb + ' L' + (x1 - 7) + ' ' + (yb + 5));
  void el.offsetWidth;
  requestAnimationFrame(() => el.classList.add('b2-linked'));
  el.querySelector('.b2-next').tabIndex = 0;
  fx.along(el.querySelector('.b2-imp'), el.querySelector('.b2-link-p'), { duration: 900, hide: true });
}

/* ---------------------------------------------------------------------------
   B3 · os quadros do Axon Live acendem um a um com o impulso; ao trocar de
   perfil, o impulso sobe a escada e os degraus fazem uma transição curta.
   ------------------------------------------------------------------------ */
AxonDeck.register('B3', {
  init(el) {
    el.addEventListener('seg:change', (e) => { if (e.detail.seg && e.detail.seg.classList.contains('b3-seg')) b3Climb(el); });
    el.addEventListener('reveal:open', (e) => {
      if (e.detail.key === '#tpl-b3-escada' && e.detail.trigger) markPop(e.detail.trigger.getAttribute('data-k'));
    });
  },
  async enter(el, ctx) {
    const tiles = Array.from(el.querySelectorAll('.b3-tile'));
    const dot = el.querySelector('.b3-imp');
    el.querySelector('.b3-stairs').classList.remove('is-climb');
    el.classList.add('b3-dim');
    tiles.forEach((t) => t.classList.remove('is-lit'));
    await ctx.fx.wait(150);
    await ctx.fx.travel(dot, [tiles[0]], { duration: 0 });
    tiles[0].classList.add('is-lit');
    for (let i = 1; i < tiles.length; i++) {
      await ctx.fx.travel(dot, [tiles[i - 1], tiles[i]], { duration: 150, easing: 'linear' });
      tiles[i].classList.add('is-lit');
    }
    await ctx.fx.travel(dot, [tiles[tiles.length - 1]], { duration: 0, hide: true });
    el.classList.remove('b3-dim');
  },
  leave(el) { el.classList.remove('b3-dim'); }
});

function b3Climb(el) {
  const st = el.querySelector('.b3-stairs');
  st.classList.remove('is-climb');
  void st.offsetWidth;
  st.classList.add('is-climb');
  const steps = Array.from(st.querySelectorAll('.b3-st'));
  const pts = steps.map((s) => ({ x: s.offsetLeft + s.offsetWidth / 2, y: s.offsetTop + 3 }));
  AxonDeck.fx.travel(st.querySelector('.b3-simp'), pts, { duration: 420, easing: 'ease-out', hide: true });
}

/* ---------------------------------------------------------------------------
   B4 · o impulso percorre a raia Pessoas e para no G0; cada portão aberto
   (checklist completo) faz o impulso saltar para o segmento seguinte.
   G3: três chaves giram; o "Legado A" só esmaece quando as três giram.
   ------------------------------------------------------------------------ */
const B4_GATES = ['G0', 'G1', 'G2', 'G3', 'G4'];

AxonDeck.register('B4', {
  init(el) {
    el.addEventListener('gate:open', (e) => b4Gate(el, e.detail.gate));
    el.addEventListener('reveal:open', (e) => {
      el.querySelectorAll('.b4-step.is-current').forEach((b) => b.classList.remove('is-current'));
      if (e.detail.key === '#tpl-b4-chaves') b4Keys(el);
      const code = e.detail.trigger && e.detail.trigger.getAttribute('data-pick');
      const card = code && el.querySelector('.b4-step[data-open="' + code + '"]');
      if (card) card.classList.add('is-current');
    });
    // também no fechamento silencioso (troca de slide, outra revelação, modos): o destaque não fica preso
    el.addEventListener('reveal:close', () => el.querySelectorAll('.b4-step.is-current').forEach((b) => b.classList.remove('is-current')));
    // cartões G0, G1, G2 e G4: abrem o checklist do mesmo portão, ancorado ao losango no plano;
    // ao fechar, o foco volta ao cartão (returnFocus), que anuncia aria-expanded
    el.querySelectorAll('.b4-step[data-open]').forEach((b) => {
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', () => {
        const gm = el.querySelector('.b4-gm[data-pick="' + b.dataset.open + '"]');
        if (gm) AxonDeck.reveal.open(gm, { returnFocus: b });
      });
    });
  },
  async enter(el, ctx) {
    el.__b4at = 0;
    el.__b4keys = new Set();
    el.classList.remove('b4-keys-done');
    el.querySelectorAll('.b4-step').forEach((b) => b.classList.remove('is-current', 'is-open'));
    const fib = el.querySelector('.b4-fiber');
    fib.querySelectorAll('.node').forEach((n) => n.classList.remove('is-lit'));
    el.querySelectorAll('.b4-gl').forEach((g) => g.classList.remove('is-open'));
    await ctx.fx.wait(450);
    await ctx.fx.travel(fib.querySelector('.impulse'), [{ x: 0, y: 6 }, b4X(fib, 0)], { duration: 950 });
    ctx.fx.pulse(el.querySelector('.b4-gm .diamond'), { size: 16 });
  }
});

/** Posição do portão k (0…4) na fibra; k = 5 é o fim da raia. */
function b4X(fib, k) { return { x: k >= 5 ? fib.clientWidth : fib.clientWidth * (k + 1) / 6, y: 6 }; }

function b4Gate(el, code) {
  const k = B4_GATES.indexOf(code);
  if (k < 0) return;
  const fib = el.querySelector('.b4-fiber');
  fib.querySelectorAll('.node')[k].classList.add('is-lit');
  el.querySelectorAll('.b4-gl')[k].classList.add('is-open');
  const at = el.__b4at || 0;
  if (k < at) return;
  el.__b4at = k + 1;
  AxonDeck.fx.hop(fib.querySelector('.impulse'), b4X(fib, Math.min(at, 4)), b4X(fib, k + 1), { height: 26, duration: 520 });
}

function b4Keys(el) {
  const body = popBody();
  const box = body && body.querySelector('[data-b4k]');
  if (!box) return;
  const keys = Array.from(box.querySelectorAll('.b4k-key'));
  const msg = box.querySelector('.b4k-msg');
  box.classList.toggle('is-instant', AxonDeck.reducedMotion());
  const on = el.__b4keys || (el.__b4keys = new Set());
  const paint = () => {
    keys.forEach((b) => b.setAttribute('aria-pressed', String(on.has(b.dataset.i))));
    const done = on.size === keys.length;
    box.classList.toggle('is-done', done);
    el.classList.toggle('b4-keys-done', done);
    return done;
  };
  keys.forEach((b) => b.addEventListener('click', () => {
    if (on.has(b.dataset.i)) on.delete(b.dataset.i); else on.add(b.dataset.i);
    if (paint()) AxonDeck.fx.pulse(msg, { size: 12 });
    AxonDeck.reveal.reposition();
  }));
  paint();
  AxonDeck.reveal.reposition();
}

/* ---------------------------------------------------------------------------
   B5 · funil-escudo: ao entrar, um ponto por tipo de voz desce o funil
   (dúvida sai cedo, receio desvia para a GMO, ideia e bug chegam ao produto).
   ▶ Solte uma inquietação (ilustrativo): três inquietações, uma por clique.
   ------------------------------------------------------------------------ */
const B5_TICKETS = [
  { t: 'duvida', q: '“Não sei onde ficou a saída do estudo”', r: ['dúvida', 'Guia de Bolso'] },
  { t: 'receio', q: '“Vou perder meu papel?”', r: ['receio', 'ação de mudança (GMO)'] },
  { t: 'ideia', q: '“Quero rodar com mais casos sem estourar o orçamento”', r: ['ideia', 'backlog'] }
];

function b5Route(el, t) {
  const box = el.querySelector('.b5-left');
  const fx = AxonDeck.fx;
  const L1 = el.querySelector('.b5-L1'), L2 = el.querySelector('.b5-L2');
  const cx = fx.center(L1, box).x;
  const top = { x: cx, y: L1.offsetTop + el.querySelector('.b5-funnel').offsetTop - 10 };
  const l2 = { x: cx, y: fx.center(L2, box).y };
  if (t === 'duvida' || t === 'receio') {
    const ex = el.querySelector('.b5-exit[data-x="' + t + '"]');
    const ec = fx.center(ex, box);
    return [top, l2, { x: ec.x - ex.offsetWidth / 2 - 30, y: ec.y }, { x: ec.x - ex.offsetWidth / 2 + 10, y: ec.y }];
  }
  const base = fx.center(el.querySelector('.b5-base'), box);
  return [top, l2, { x: cx, y: base.y }];
}

function b5Hit(el, t) {
  const target = t === 'duvida' || t === 'receio' ? el.querySelector('.b5-exit[data-x="' + t + '"]') : el.querySelector('.b5-base');
  target.classList.add('is-hit');
  clearTimeout(target.__t);
  target.__t = setTimeout(() => target.classList.remove('is-hit'), 1400);
}

AxonDeck.register('B5', {
  init(el) {
    const q = el.querySelector('.b5-tq'), r = el.querySelector('.b5-tr');
    const dot = el.querySelector('.b5-dot--tk'), cap = el.querySelector('.b5-cap');
    const run = async () => {
      el.__b5busy = true;
      const n = el.__b5n || 0;
      const tk = B5_TICKETS[n % B5_TICKETS.length];
      el.__b5n = n + 1;
      q.textContent = tk.q;
      q.setAttribute('data-t', tk.t);
      dot.setAttribute('data-t', tk.t);
      r.innerHTML = '';
      await AxonDeck.fx.travel(dot, b5Route(el, tk.t), { duration: 1150, hide: true });
      r.innerHTML = '<span class="gt" aria-hidden="true">›</span>' + tk.r[0] + '<span class="gt" aria-hidden="true">›</span>' + tk.r[1];
      b5Hit(el, tk.t);
      if (n % B5_TICKETS.length === B5_TICKETS.length - 1) cap.classList.add('is-on');
      el.__b5busy = false;
      if (el.__b5q > 0) { el.__b5q--; run(); }
    };
    el.querySelector('.b5-sim').addEventListener('click', () => {
      if (el.__b5busy) { el.__b5q = Math.min((el.__b5q || 0) + 1, B5_TICKETS.length); return; }
      run();
    });
  },
  async enter(el, ctx) {
    el.__b5busy = false;
    el.__b5q = 0;
    el.__b5n = 0;
    el.querySelector('.b5-tq').textContent = '';
    el.querySelector('.b5-tq').removeAttribute('data-t');
    el.querySelector('.b5-tr').innerHTML = '';
    el.querySelector('.b5-cap').classList.remove('is-on');
    await ctx.fx.wait(550);
    await Promise.all(['duvida', 'receio', 'ideia', 'bug'].map(async (t, i) => {
      await ctx.fx.wait(i * 230);
      await ctx.fx.travel(el.querySelector('.b5-dot--' + t), b5Route(el, t), { duration: 1050, hide: true });
      b5Hit(el, t);
    }));
  }
});

/* ---------------------------------------------------------------------------
   B6 · linha da tabela: acende os meses na mini linha do tempo (passar o
   mouse ou focar) e, ao clicar, liga as células GMO e PMO com uma linha
   laranja. Fechamento (CSS): três trilhos alinhados e a assinatura por 2 s.
   ------------------------------------------------------------------------ */
AxonDeck.register('B6', {
  init(el) {
    const ticks = Array.from(el.querySelectorAll('.b6-mini span:not(.b6-mini-l)'));
    const rows = Array.from(el.querySelectorAll('.b6-tbl tbody tr'));
    const link = el.querySelector('.b6-link');
    const lit = (tr) => {
      const [a, b] = tr ? tr.dataset.m.split('-').map(Number) : [0, 0];
      ticks.forEach((t, i) => t.classList.toggle('is-hi', !!tr && i + 1 >= a && i + 1 <= b));
    };
    const unlink = () => {
      rows.forEach((r) => r.classList.remove('is-linked'));
      link.classList.remove('is-on');
      el.__b6row = null;
      lit(null);
    };
    el.__b6unlink = unlink;
    rows.forEach((tr) => {
      tr.addEventListener('mouseenter', () => lit(tr));
      tr.addEventListener('focusin', () => lit(tr));
      tr.addEventListener('mouseleave', () => lit(el.__b6row || null));
      tr.addEventListener('focusout', () => lit(el.__b6row || null));
    });
    el.addEventListener('reveal:open', (e) => {
      const trg = e.detail.trigger;
      unlink();
      const tr = trg && trg.closest ? trg.closest('tr.rv-row') : null;
      if (!tr) return;
      const tbl = tr.closest('table');
      const pmo = tr.children[2];
      el.__b6row = tr;
      tr.classList.add('is-linked');
      link.style.top = (tbl.offsetTop + tr.offsetTop + tr.offsetHeight / 2) + 'px';
      link.style.left = (tbl.offsetLeft + pmo.offsetLeft - 24) + 'px';
      void link.offsetWidth;
      link.classList.add('is-on');
      lit(tr);
    });
    el.addEventListener('reveal:close', unlink);
  },
  async enter(el, ctx) {
    if (el.__b6unlink) el.__b6unlink();
    // movimento reduzido: a animação CSS da assinatura vira troca de opacidade por 2 s (como no A6)
    const sig = el.querySelector('.b6-sig');
    sig.classList.remove('is-on');
    if (!ctx.reduced) return;
    await new Promise((res) => { const t = setTimeout(res, 200); ctx.signal.addEventListener('abort', () => clearTimeout(t), { once: true }); });
    if (ctx.signal.aborted) return;
    sig.classList.add('is-on');
    await new Promise((res) => { const t = setTimeout(res, 2000); ctx.signal.addEventListener('abort', () => clearTimeout(t), { once: true }); });
    if (!ctx.signal.aborted) sig.classList.remove('is-on');
  },
  leave(el) { el.querySelector('.b6-sig').classList.remove('is-on'); }
});
