/* =============================================================================
   engine.js · Motor do deck Axon
   Escala do canvas 1280 × 720, navegação e rotas (#A-1 … #B-6), barra-axônio,
   revelações (biblioteca R-xx e <template> local), cartas flip, alternadores,
   portões, notas, apresentador (BroadcastChannel + postMessage), leitura,
   comparação, impressão e ajuda. Sem dependências externas.
   API pública: window.AxonDeck (ver COMPONENTES.md).
   ========================================================================== */
(function () {
  'use strict';

  const W = 1280, H = 720;
  const DECK_LABEL = { A: 'A · GMO', B: 'B · TMO' };
  const DECK_NAME = { A: 'Proposta A · GMO', B: 'Proposta B · TMO' };
  const STORE_KEY = 'axon-deck/v1';
  const SYNC_SEL = 'button, [role="button"], [data-reveal]';
  const POP_MARGIN = 12, POP_GAP = 10, POP_MAX_H = 520;

  const qs = (s, r) => (r || document).querySelector(s);
  const qsa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} });
  const mqReduce = mq('(prefers-reduced-motion: reduce)');
  const reduced = () => mqReduce.matches || document.documentElement.classList.contains('force-reduce');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const collapse = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad2 = (n) => String(n).padStart(2, '0');

  let params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = { get: () => null }; }
  const IS_PRESENTER = params.get('presenter') === '1';
  const WIN_ID = Math.random().toString(36).slice(2, 10);

  const state = {
    booted: false, deck: 'A', index: 1, scale: 1,
    visited: { A: new Set(), B: new Set() },
    notes: false, reading: false, presenterInline: false, compare: false,
    autoReading: false, userLeftReading: false, readingIndex: 1,
    printPrepared: false, printAuto: false
  };
  const hooks = new Map();
  const decks = { A: [], B: [] };
  const byId = new Map();
  const pristine = new Map();
  const gateState = new Map();
  let els = {};
  let visit = null;           // { id, el, ctrl, fx }
  let pop = { open: false };  // estado do popover
  let gateCloseTimer = 0;
  let axAnim = null;          // animação do impulso da barra
  let axTimers = [];
  let applyingRemote = false;
  let syncOn = IS_PRESENTER;
  let presenterWin = null;
  let msgSeq = 0;
  const seenMsg = new Set();
  let cloneRO = null;

  /* ---------------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------------ */
  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function frag(html) {
    const t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
  }
  function dispatch(target, type, detail) {
    if (!target) return;
    target.dispatchEvent(new CustomEvent(type, { bubbles: true, detail: detail || {} }));
  }
  function currentEl() { return (decks[state.deck] || [])[state.index - 1] || null; }
  function count(deck) { return (decks[deck || state.deck] || []).length; }
  function store() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ deck: state.deck, index: state.index })); } catch (e) { /* sem armazenamento */ }
  }
  function restore() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (v && (v.deck === 'A' || v.deck === 'B')) return { deck: v.deck, index: Number(v.index) || 1 };
    } catch (e) { /* sem armazenamento */ }
    return null;
  }
  function parseHash() {
    const m = /^#([AaBb])-(\d{1,2})$/.exec(location.hash || '');
    return m ? { deck: m[1].toUpperCase(), index: Number(m[2]) } : null;
  }
  function labelOf(el) {
    const l = el.getAttribute('data-label') || el.getAttribute('aria-label') || collapse(el.textContent);
    return l.length > 110 ? l.slice(0, 107).trim() + '…' : l;
  }
  function slideOf(el) { return el && el.closest ? el.closest('.slide') : null; }
  function emphHTML(txt) {
    const parts = String(txt).split('+').map((s) => s.trim()).filter(Boolean);
    return '<span class="emph" aria-label="Ênfase: ' + esc(txt) + '">' + parts.map((p, i) =>
      (i ? '<b class="plus" aria-hidden="true">+</b>' : '') +
      '<b class="' + (/^GMO$/i.test(p) ? 'g' : /^PMO$/i.test(p) ? 'p' : 'plus') + '" aria-hidden="true">' + esc(p) + '</b>').join('') + '</span>';
  }

  /* ---------------------------------------------------------------------------
     Hooks e efeitos (fx)
     ------------------------------------------------------------------------ */
  function register(id, hk) {
    if (!id || !hk) return;
    hooks.set(id, Object.assign({}, hooks.get(id) || {}, hk));
    if (state.booted && typeof hk.init === 'function' && byId.get(id)) callHook(id, 'init', byId.get(id), baseCtx(byId.get(id)));
  }
  function callHook(id, name, el, ctx) {
    const hk = hooks.get(id);
    const fn = hk && hk[name];
    if (typeof fn !== 'function') return;
    try {
      const r = fn.call(hk, el, ctx);
      if (r && typeof r.then === 'function') r.then(null, (err) => console.error('[AxonDeck] ' + id + '.' + name + '():', err));
    } catch (err) {
      console.error('[AxonDeck] ' + id + '.' + name + '():', err);
    }
  }
  function baseCtx(el) {
    return {
      id: el.id, el, deck: el.dataset.deck, index: Number(el.dataset.index),
      reduced: reduced(), fx: fxProxy, reveal: revealAPI,
      on(target, type, fn, opts) { target.addEventListener(type, fn, opts); }
    };
  }

  function makeFx(signal) {
    const never = () => new Promise(() => {});
    const live = () => !signal.aborted;
    const anims = new Set();
    signal.addEventListener('abort', () => { anims.forEach((a) => { try { a.cancel(); } catch (e) { /* */ } }); anims.clear(); });
    const sc = () => state.scale || 1;
    function run(el, frames, opts) {
      if (!live()) return never();
      let a;
      try { a = el.animate(frames, Object.assign({ fill: 'forwards' }, opts)); } catch (e) { return Promise.resolve(); }
      anims.add(a);
      return a.finished.then(() => { anims.delete(a); return live() ? undefined : never(); }, () => never());
    }
    function refOf(dot) { return dot.offsetParent || dot.parentElement; }
    function local(ref, cx, cy) {
      const r = ref.getBoundingClientRect();
      return { x: (cx - r.left) / sc() - (ref.clientLeft || 0), y: (cy - r.top) / sc() - (ref.clientTop || 0) };
    }
    function center(el, ref) {
      const r = el.getBoundingClientRect();
      return local(ref || refOf(el), r.left + r.width / 2, r.top + r.height / 2);
    }
    const T = (p) => 'translate(' + p.x.toFixed(2) + 'px, ' + p.y.toFixed(2) + 'px)';
    function prep(dot) { dot.style.left = '0px'; dot.style.top = '0px'; dot.style.margin = '0'; dot.style.marginLeft = '-' + (dot.offsetWidth / 2) + 'px'; dot.style.marginTop = '-' + (dot.offsetHeight / 2) + 'px'; }
    function toPts(dot, targets) {
      const ref = refOf(dot);
      return targets.map((t) => (t && t.nodeType === 1 ? center(t, ref) : t)).filter(Boolean);
    }
    function travel(dot, targets, o) {
      o = o || {};
      if (!live()) return never();
      if (!dot) return Promise.resolve();
      const pts = toPts(dot, targets || []);
      if (!pts.length) return Promise.resolve();
      prep(dot);
      dot.classList.add('is-on');
      const last = pts[pts.length - 1];
      if (reduced() || pts.length === 1 || o.duration === 0) {
        return run(dot, [{ transform: T(last), opacity: o.hide ? 0 : 1 }], { duration: 1 });
      }
      let total = 0; const d = [0];
      for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); d.push(total); }
      const frames = pts.map((p, i) => ({ transform: T(p), opacity: 1, offset: total ? d[i] / total : i / (pts.length - 1) }));
      return run(dot, frames, { duration: o.duration || 900, easing: o.easing || 'ease-in-out' })
        .then(() => (o.hide ? run(dot, [{ transform: T(last), opacity: 1 }, { transform: T(last), opacity: 0 }], { duration: 220 }) : undefined));
    }
    function hop(dot, from, to, o) {
      o = o || {};
      if (!live()) return never();
      const [a, b] = toPts(dot, [from, to]);
      if (!a || !b) return Promise.resolve();
      prep(dot);
      dot.classList.add('is-on');
      if (reduced()) return run(dot, [{ transform: T(b), opacity: 1 }], { duration: 1 });
      const hgt = o.height == null ? 22 : o.height;
      const frames = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        frames.push({ transform: T({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - hgt * 4 * t * (1 - t) }), opacity: 1, offset: t });
      }
      return run(dot, frames, { duration: o.duration || 450, easing: o.easing || 'ease-out' });
    }
    function along(dot, path, o) {
      o = o || {};
      if (!live()) return never();
      if (!path || typeof path.getTotalLength !== 'function') return Promise.resolve();
      const ref = refOf(dot);
      const len = path.getTotalLength();
      const m = path.getScreenCTM();
      const n = clamp(Math.round(len / 8), 12, 120);
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const p = path.getPointAtLength(len * (o.reverse ? 1 - i / n : i / n));
        const sp = m ? new DOMPoint(p.x, p.y).matrixTransform(m) : p;
        pts.push(local(ref, sp.x, sp.y));
      }
      return travel(dot, pts, { duration: o.duration || 1200, easing: o.easing || 'ease-in-out', hide: o.hide });
    }
    function pulse(el, o) {
      o = o || {};
      if (!live()) return never();
      if (!el || reduced()) return Promise.resolve();
      return run(el, [
        { boxShadow: '0 0 0 0 rgba(247,140,22,.65)' },
        { boxShadow: '0 0 0 ' + (o.size || 14) + 'px rgba(247,140,22,0)' }
      ], { duration: o.duration || 700, easing: 'ease-out', fill: 'none' });
    }
    function wait(ms) {
      if (!live()) return never();
      return new Promise((res) => {
        const t = setTimeout(res, reduced() ? 0 : ms);
        signal.addEventListener('abort', () => clearTimeout(t), { once: true });
      }).then(() => (live() ? undefined : never()));
    }
    async function light(list, o) {
      o = o || {};
      const arr = Array.from(list || []);
      for (let i = 0; i < arr.length; i++) {
        if (i && !reduced()) await wait(o.stagger == null ? 150 : o.stagger);
        if (!live()) return never();
        arr[i].classList.add(o.cls || 'is-lit');
      }
    }
    function show(el, o) {
      o = o || {};
      if (!live()) return never();
      if (!el) return Promise.resolve();
      if (reduced()) return run(el, [{ opacity: 1 }], { duration: 1 });
      return run(el, [{ opacity: 0, transform: 'translateY(' + (o.dy == null ? 6 : o.dy) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: o.duration || 300, easing: 'ease-out' });
    }
    return {
      travel, hop, along, pulse, wait, light, show, center,
      cancel() { anims.forEach((a) => { try { a.cancel(); } catch (e) { /* */ } }); anims.clear(); },
      get signal() { return signal; }
    };
  }
  const deadFx = makeFx((() => { const c = new AbortController(); return c.signal; })());
  const fxProxy = new Proxy({}, {
    get(_, k) {
      const f = visit ? visit.fx : deadFx;
      const v = f[k];
      return typeof v === 'function' ? v.bind(f) : v;
    }
  });

  /* ---------------------------------------------------------------------------
     Preparação dos slides
     ------------------------------------------------------------------------ */
  function prepareSlide(el) {
    const deck = el.dataset.deck, idx = Number(el.dataset.index);
    if (!qs(':scope > .brand', el)) el.insertAdjacentHTML('afterbegin', '<span class="brand">Alvarez &amp; Marsal</span>');
    if (!qs(':scope > .pgnum', el)) {
      const em = el.dataset.emphasis;
      el.insertAdjacentHTML('beforeend', '<span class="pgnum">' + (em ? emphHTML(em) : '') + '<span class="pgnum-n">' + idx + '</span></span>');
    }
    el.setAttribute('role', 'group');
    el.setAttribute('aria-roledescription', 'slide');
    el.setAttribute('aria-label', DECK_LABEL[deck] + ', slide ' + idx + ' de ' + count(deck) + ': ' + (el.dataset.title || ''));
    fillIncludes(el, deck, 'compact');
  }
  /** Fase 2 (depois do init dos hooks): papéis ARIA de gatilhos, cartas e alternadores. */
  function prepareInteractive(el) {
    fillIncludes(el, el.dataset.deck, 'compact', true);
    qsa('[data-reveal]', el).forEach((t) => {
      if (t.tagName !== 'BUTTON') { t.setAttribute('role', 'button'); if (!t.hasAttribute('tabindex')) t.tabIndex = 0; }
      t.setAttribute('aria-haspopup', 'dialog');
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-controls', 'rvpop');
    });
    qsa('.flip', el).forEach((f) => {
      if (f.tagName !== 'BUTTON') { f.setAttribute('role', 'button'); if (!f.hasAttribute('tabindex')) f.tabIndex = 0; }
      f.setAttribute('aria-pressed', 'false');
    });
    qsa('.seg', el).forEach((s) => {
      if (!s.hasAttribute('role')) s.setAttribute('role', 'group');
      const first = qs('button[data-value]', s);
      const v = s.dataset.default || (first && first.dataset.value);
      if (v) setSeg(s, v, false); // estado padrão já no snapshot (leitura/impressão)
    });
    qsa('button:not([type])', el).forEach((b) => { b.type = 'button'; });
    el.inert = true;
    el.setAttribute('aria-hidden', 'true');
  }

  function validate() {
    ['A', 'B'].forEach((d) => {
      const list = decks[d];
      if (list.length !== 6) console.warn('[AxonDeck] deck ' + d + ' tem ' + list.length + ' slides (esperado: 6).');
      list.forEach((el, i) => {
        if (Number(el.dataset.index) !== i + 1) console.warn('[AxonDeck] ' + el.id + ': data-index fora de ordem.');
        if (el.id !== d + (i + 1)) console.warn('[AxonDeck] slide ' + (el.id || '(sem id)') + ': id esperado ' + d + (i + 1) + '.');
        if (!el.dataset.title) console.warn('[AxonDeck] ' + el.id + ': falta data-title.');
        if (!qs(':scope > aside.notes', el)) console.warn('[AxonDeck] ' + el.id + ': falta <aside class="notes">.');
        if (!qs(':scope > .keymsg', el)) console.warn('[AxonDeck] ' + el.id + ': falta <p class="keymsg" hidden>.');
        if (d === 'B' && !el.dataset.emphasis) console.warn('[AxonDeck] ' + el.id + ': falta data-emphasis (selo GMO/PMO).');
      });
    });
  }

  /** Preenche [data-include="R-xx"] com conteúdo da biblioteca. */
  function fillIncludes(root, deck, ctxFormat, onlyNew) {
    const L = window.AxonReveals;
    if (!L) return;
    qsa('[data-include]', root).forEach((el) => {
      if (onlyNew && el.hasAttribute('data-filled')) return;
      el.setAttribute('data-filled', '');
      const key = el.getAttribute('data-include');
      if (!L.has(key)) { console.warn('[AxonDeck] data-include desconhecido: ' + key); return; }
      const format = el.getAttribute('data-format') || ctxFormat || 'compact';
      el.innerHTML = L.render(key, {
        format,
        pick: el.getAttribute('data-pick') || '',
        variant: el.getAttribute('data-variant') || deck,
        part: el.getAttribute('data-part') || ''
      });
    });
  }

  /** Converte checkboxes em caixas estáticas (leitura/impressão). */
  function staticize(root) {
    qsa('.gate', root).forEach((g) => g.classList.add('gate--static'));
    qsa('.gate label', root).forEach((lab) => {
      const li = lab.parentElement;
      const txt = qs('.gate-txt', lab) || h('span', 'gate-txt', esc(collapse(lab.textContent)));
      li.replaceChildren(h('span', 'gate-box'), txt);
      qs('.gate-box', li).setAttribute('aria-hidden', 'true');
    });
    qsa('.gate-status', root).forEach((s) => s.remove());
    qsa('input, button', root).forEach((b) => { b.setAttribute('tabindex', '-1'); b.disabled = true; });
    qsa('[id]', root).forEach((x) => x.removeAttribute('id'));
  }

  /* ---------------------------------------------------------------------------
     Escala do canvas
     ------------------------------------------------------------------------ */
  function fit() {
    if (!els.stage || !els.canvas) return;
    const r = els.stage.getBoundingClientRect();
    const pad = window.innerWidth < 760 ? 16 : 24;
    const s = Math.max(0.05, Math.min((r.width - 2 * pad) / W, (r.height - 2 * pad) / H));
    const x = Math.round((r.width - W * s) / 2), y = Math.round((r.height - H * s) / 2);
    els.canvas.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + s + ')';
    state.scale = s;
    if (pop.open) positionPop();
    placeImpulse(state.index, true);
  }

  /* ---------------------------------------------------------------------------
     Navegação
     ------------------------------------------------------------------------ */
  function go(deck, index, o) {
    o = o || {};
    deck = String(deck || state.deck).toUpperCase() === 'B' ? 'B' : 'A';
    const n = count(deck);
    if (!n) return;
    index = clamp(Math.round(Number(index)) || 1, 1, n);
    const prevEl = state.booted ? currentEl() : null;
    const el = decks[deck][index - 1];
    if (prevEl === el && !o.force) { syncChrome(); if (!o.fromHash) writeHash(o); return; }
    const deckChanged = state.booted && deck !== state.deck;
    const from = state.booted && !deckChanged ? state.index : null;
    closeReveal({ silent: true });
    if (prevEl) leaveSlide(prevEl);
    state.deck = deck; state.index = index;
    els.canvas.style.setProperty('--fade', reduced() ? '150ms' : deckChanged ? '300ms' : '220ms');
    enterSlide(el);
    state.visited[deck].add(index);
    updateAxon(from, index, !state.booted || deckChanged);
    syncChrome();
    if (!o.fromHash) writeHash(o);
    store();
    announce();
    if (!o.remote) send({ type: 'nav', deck, index });
    if (state.reading && !o.fromReading) {
      if (deckChanged || o.rerenderReading) renderReading();
      scrollReadingTo(index);
    }
    if (state.compare) renderCompare();
    document.dispatchEvent(new CustomEvent('axondeck:change', { detail: { deck, index, id: el.id } }));
  }
  function next() { if (state.index < count()) go(state.deck, state.index + 1); }
  function prev() { if (state.index > 1) go(state.deck, state.index - 1); }
  function setDeck(d) { go(d, state.reading ? state.readingIndex : state.index, { rerenderReading: true }); }

  function leaveSlide(el) {
    callHook(el.id, 'leave', el, visit && visit.id === el.id ? visit.ctx : baseCtx(el));
    dispatch(el, 'slide:leave', { id: el.id });
    if (visit && visit.id === el.id) { visit.ctrl.abort(); visit = null; }
    el.classList.remove('is-active');
    el.inert = true;
    el.setAttribute('aria-hidden', 'true');
  }
  function enterSlide(el) {
    resetSlide(el);
    el.inert = false;
    el.removeAttribute('aria-hidden');
    el.classList.remove('is-active');
    void el.offsetWidth;
    el.classList.add('is-active');
    const ctrl = new AbortController();
    const fx = makeFx(ctrl.signal);
    const ctx = Object.assign(baseCtx(el), {
      fx, signal: ctrl.signal,
      on(target, type, fn, opts) { target.addEventListener(type, fn, Object.assign({}, opts || {}, { signal: ctrl.signal })); }
    });
    visit = { id: el.id, el, ctrl, fx, ctx };
    callHook(el.id, 'enter', el, ctx);
    dispatch(el, 'slide:enter', { id: el.id });
  }
  function resetSlide(el) {
    el.classList.add('is-resetting');
    qsa('.flip.is-flipped', el).forEach((f) => setFlip(f, false));
    qsa('.seg', el).forEach((s) => {
      const first = qs('button[data-value]', s);
      const v = s.dataset.default || (first && first.dataset.value);
      if (v) setSeg(s, v, false);
    });
    Array.from(gateState.keys()).forEach((k) => { if (k.indexOf(el.id + '|') === 0) gateState.delete(k); });
    qsa('.gate', el).forEach((g) => { qsa('input[type="checkbox"]', g).forEach((c) => { c.checked = false; }); updateGateUI(g); g.classList.remove('is-open'); });
    qsa('.is-open', el).forEach((t) => { if (t.matches('[data-reveal], .gate-mark')) t.classList.remove('is-open'); });
    qsa('[data-reveal][aria-expanded="true"]', el).forEach((t) => t.setAttribute('aria-expanded', 'false'));
    void el.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-resetting')));
  }
  function writeHash(o) {
    const hsh = '#' + state.deck + '-' + state.index;
    if (location.hash === hsh) return;
    try {
      if (o.replace || o.initial || !state.booted) location.replace(hsh);
      else location.hash = hsh;
    } catch (e) { /* file:// restrito */ }
  }
  function announce() {
    if (!els.live) return;
    const el = currentEl();
    els.live.textContent = DECK_LABEL[state.deck] + ', slide ' + state.index + ' de ' + count() + ': ' + (el ? el.dataset.title || '' : '');
  }

  function syncChrome() {
    const el = currentEl();
    document.body.dataset.deck = state.deck;
    qsa('.deckseg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.deck === state.deck)));
    if (els.axDeck) els.axDeck.textContent = DECK_LABEL[state.deck];
    if (els.axCount) els.axCount.textContent = pad2(state.index) + ' / ' + pad2(count());
    if (els.axTitle) els.axTitle.textContent = el ? el.dataset.title || '' : '';
    if (els.prevBtn) els.prevBtn.disabled = state.index <= 1;
    if (els.nextBtn) els.nextBtn.disabled = state.index >= count();
    renderNotes();
    renderPresenter();
  }

  /* ---------------------------------------------------------------------------
     Barra-axônio: nódulos, bainhas e impulso saltatório
     ------------------------------------------------------------------------ */
  function buildAxon() {
    const f = els.fiber;
    if (!f) return;
    f.replaceChildren();
    const n = Math.max(count('A'), count('B'), 1);
    f.appendChild(h('div', 'ax-line'));
    for (let i = 0; i < n - 1; i++) {
      const s = h('span', 'ax-sheath');
      s.style.left = 'calc(' + (i * 100 / (n - 1)) + '% + 9px)';
      s.style.width = 'calc(' + (100 / (n - 1)) + '% - 18px)';
      f.appendChild(s);
    }
    for (let i = 1; i <= n; i++) {
      const b = h('button', 'ax-node');
      b.type = 'button';
      b.dataset.i = String(i);
      b.style.left = (n > 1 ? (i - 1) * 100 / (n - 1) : 50) + '%';
      f.appendChild(b);
    }
    els.axImpulse = h('span', 'ax-impulse');
    els.axImpulse.setAttribute('aria-hidden', 'true');
    f.appendChild(els.axImpulse);
    els.axTip = h('div', 'ax-tip');
    els.axTip.setAttribute('role', 'tooltip');
    els.axTip.id = 'ax-tip';
    f.appendChild(els.axTip);
    f.addEventListener('click', (e) => {
      const b = e.target.closest('.ax-node');
      if (b) go(state.deck, Number(b.dataset.i));
    });
    const showTip = (b) => {
      const i = Number(b.dataset.i);
      const sl = decks[state.deck][i - 1];
      els.axTip.textContent = pad2(i) + ' · ' + (sl ? sl.dataset.title || '' : '');
      els.axTip.style.left = b.style.left;
      els.axTip.classList.add('is-on');
      b.setAttribute('aria-describedby', 'ax-tip');
    };
    const hideTip = () => els.axTip.classList.remove('is-on');
    f.addEventListener('pointerover', (e) => { const b = e.target.closest('.ax-node'); if (b) showTip(b); });
    f.addEventListener('pointerout', (e) => { if (e.target.closest('.ax-node')) hideTip(); });
    f.addEventListener('focusin', (e) => { const b = e.target.closest('.ax-node'); if (b) showTip(b); });
    f.addEventListener('focusout', hideTip);
  }
  function nodeX(i) {
    const w = els.fiber ? els.fiber.clientWidth : 0;
    const n = count();
    return n > 1 ? (i - 1) * w / (n - 1) : w / 2;
  }
  function stopAxAnim() {
    if (axAnim) { try { axAnim.cancel(); } catch (e) { /* */ } axAnim = null; }
    axTimers.forEach(clearTimeout);
    axTimers = [];
  }
  function placeImpulse(i, keepAnim) {
    if (!els.axImpulse) return;
    if (keepAnim && axAnim && axAnim.playState === 'running') return;
    els.axImpulse.style.transform = 'translateX(' + nodeX(i).toFixed(1) + 'px)';
  }
  function updateAxon(from, to, jump) {
    const nodes = qsa('.ax-node', els.fiber);
    const n = count();
    nodes.forEach((b, k) => {
      const i = k + 1;
      b.hidden = i > n;
      const sl = decks[state.deck][i - 1];
      b.classList.toggle('is-current', i === to);
      b.classList.toggle('is-visited', i !== to && (i < to || state.visited[state.deck].has(i)));
      b.classList.remove('is-lit');
      b.setAttribute('aria-label', 'Slide ' + i + ': ' + (sl ? sl.dataset.title || '' : ''));
      if (i === to) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    stopAxAnim();
    const imp = els.axImpulse;
    if (!imp) return;
    const last = to === n && n > 1;
    if (last) return axFinale(nodes, n);
    if (reduced() || jump || !from || from === to) { placeImpulse(to); return; }
    const k = Math.abs(to - from), dir = to > from ? 1 : -1;
    const per = k === 1 ? 450 : Math.max(200, Math.round(560 / Math.sqrt(k)));
    const frames = [];
    for (let j = 0; j < k; j++) {
      const xa = nodeX(from + dir * j), xb = nodeX(from + dir * (j + 1));
      for (let s = (j === 0 ? 0 : 1); s <= 12; s++) {
        const t = s / 12;
        frames.push({ transform: 'translate(' + (xa + (xb - xa) * t).toFixed(1) + 'px, ' + (-12 * 4 * t * (1 - t)).toFixed(1) + 'px)', offset: (j + t) / k });
      }
    }
    imp.style.transform = 'translateX(' + nodeX(to).toFixed(1) + 'px)';
    try { axAnim = imp.animate(frames, { duration: per * k, easing: k === 1 ? 'ease-out' : 'linear' }); } catch (e) { /* */ }
  }
  function axFinale(nodes, n) {
    const imp = els.axImpulse;
    const lightAll = () => nodes.forEach((b, k) => { if (k < n) b.classList.add('is-lit'); });
    imp.style.transform = 'translateX(' + nodeX(n).toFixed(1) + 'px)';
    if (reduced()) { lightAll(); return; }
    const dur = 1300;
    try {
      axAnim = imp.animate([
        { transform: 'translateX(' + nodeX(1).toFixed(1) + 'px)', opacity: 0, offset: 0 },
        { transform: 'translateX(' + nodeX(1).toFixed(1) + 'px)', opacity: 1, offset: .08 },
        { transform: 'translateX(' + nodeX(n).toFixed(1) + 'px)', opacity: 1, offset: 1 }
      ], { duration: dur, easing: 'ease-in-out' });
    } catch (e) { lightAll(); return; }
    for (let i = 1; i <= n; i++) {
      const t = 0.08 + 0.92 * (i - 1) / (n - 1);
      axTimers.push(setTimeout(() => { const b = nodes[i - 1]; if (b) b.classList.add('is-lit'); }, Math.round(dur * t)));
    }
  }

  /* ---------------------------------------------------------------------------
     Revelações (popover)
     ------------------------------------------------------------------------ */
  function readOpts(trg, deck, format) {
    return {
      format,
      pick: trg.getAttribute('data-pick') || '',
      variant: trg.getAttribute('data-variant') || deck,
      part: trg.getAttribute('data-part') || ''
    };
  }
  function buildRevealContent(trg, slide, format, deck) {
    const spec = collapse(trg.getAttribute('data-reveal'));
    if (!spec) return null;
    let title = trg.getAttribute('data-reveal-title') || '';
    let selo = trg.getAttribute('data-selo') || '';
    let w = Number(trg.getAttribute('data-w')) || 0;
    let node;
    if (spec.charAt(0) === '#') {
      let tpl = null;
      try { tpl = (slide && slide.querySelector(spec)) || document.querySelector(spec); } catch (e) { tpl = null; }
      if (!tpl || tpl.tagName !== 'TEMPLATE') { console.warn('[AxonDeck] template não encontrado: ' + spec); return null; }
      node = tpl.content.cloneNode(true);
      fillIncludes(node, deck, format === 'annex' ? 'annex' : 'pop');
      title = title || tpl.getAttribute('data-title') || '';
      selo = selo || tpl.getAttribute('data-selo') || '';
      w = w || Number(tpl.getAttribute('data-w')) || 0;
    } else {
      const L = window.AxonReveals;
      if (!L || !L.has(spec)) { console.warn('[AxonDeck] revelação desconhecida: ' + spec); return null; }
      node = frag(L.render(spec, readOpts(trg, deck, format)));
      title = title || L.title(spec);
      selo = selo || L.selo(spec);
      w = w || L.width(spec);
    }
    if (!title) title = labelOf(trg);
    if (format !== 'pop') staticize(node);
    return { spec, title, selo, w: clamp(w || 380, 320, 420), node };
  }

  function openReveal(trg, o) {
    o = o || {};
    if (!trg) return;
    const nested = !!(trg.closest && trg.closest('#rvpop'));
    if (pop.open && pop.trigger === trg && !o.force) { closeReveal({ restoreFocus: true }); return; }
    const anchor = o.anchor || (nested ? pop.anchor : trg);
    const slide = o.slide || (nested ? pop.slide : slideOf(anchor) || slideOf(trg) || currentEl());
    const deck = slide ? slide.dataset.deck : state.deck;
    const c = buildRevealContent(trg, slide, 'pop', deck);
    if (!c) return;
    closeReveal({ silent: true });
    const p = els.pop;
    els.popTitle.textContent = c.title;
    if (c.selo) { els.popSelo.textContent = c.selo; els.popSelo.hidden = false; } else { els.popSelo.hidden = true; }
    els.popBody.replaceChildren(c.node);
    els.popBody.scrollTop = 0;
    p.style.width = c.w + 'px';
    p.style.left = '0px'; p.style.top = '0px';
    p.hidden = false;
    p.classList.remove('is-in');
    pop = { open: true, trigger: trg, anchor, slide, spec: c.spec };
    qsa('.gate', els.popBody).forEach((g) => bindGate(g, slide));
    positionPop();
    void p.offsetWidth;
    if (!reduced()) p.classList.add('is-in');
    if (trg.setAttribute && trg.isConnected) trg.setAttribute('aria-expanded', 'true');
    try { p.focus({ preventScroll: true }); } catch (e) { /* */ }
    dispatch(slide, 'reveal:open', { key: c.spec, trigger: trg });
  }
  /** Abre uma revelação sem gatilho real, ancorada a qualquer elemento do slide. */
  function showReveal(spec, anchor, opts) {
    opts = opts || {};
    const v = document.createElement('span');
    v.setAttribute('data-reveal', spec);
    ['pick', 'variant', 'part'].forEach((k) => { if (opts[k]) v.setAttribute('data-' + k, opts[k]); });
    if (opts.title) v.setAttribute('data-reveal-title', opts.title);
    if (opts.selo) v.setAttribute('data-selo', opts.selo);
    if (opts.w) v.setAttribute('data-w', opts.w);
    openReveal(v, { anchor, slide: slideOf(anchor), force: true });
  }
  function positionPop() {
    if (!pop.open) return;
    const p = els.pop, a = pop.anchor;
    if (!a || !a.isConnected) { closeReveal({ silent: true }); return; }
    const s = state.scale || 1;
    const cr = els.canvas.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    const t = { l: (r.left - cr.left) / s, t: (r.top - cr.top) / s, r: (r.right - cr.left) / s, b: (r.bottom - cr.top) / s };
    p.style.maxHeight = Math.min(POP_MAX_H, H - 2 * POP_MARGIN) + 'px';
    const w = p.offsetWidth, hh = p.offsetHeight;
    const cx = (t.l + t.r) / 2, cy = (t.t + t.b) / 2;
    const cX = (x) => clamp(x, POP_MARGIN, W - POP_MARGIN - w);
    const cY = (y) => clamp(y, POP_MARGIN, H - POP_MARGIN - hh);
    const cands = [
      { x: cX(cx - w / 2), y: t.b + POP_GAP, ok: t.b + POP_GAP + hh <= H - POP_MARGIN },
      { x: cX(cx - w / 2), y: t.t - POP_GAP - hh, ok: t.t - POP_GAP - hh >= POP_MARGIN },
      { x: t.r + POP_GAP, y: cY(cy - hh / 2), ok: t.r + POP_GAP + w <= W - POP_MARGIN },
      { x: t.l - POP_GAP - w, y: cY(cy - hh / 2), ok: t.l - POP_GAP - w >= POP_MARGIN }
    ];
    let c = cands.find((k) => k.ok);
    if (!c) {
      // gatilho grande: sobrepõe na lateral com mais espaço, sempre contido
      const spaceR = W - t.r, spaceL = t.l;
      c = { x: cX(spaceR >= spaceL ? W - POP_MARGIN - w : POP_MARGIN), y: cY(cy - hh / 2) };
    }
    p.style.left = Math.round(cX(c.x)) + 'px';
    p.style.top = Math.round(cY(c.y)) + 'px';
  }
  function closeReveal(o) {
    o = o || {};
    if (!pop.open) return;
    const trg = pop.trigger, slide = pop.slide;
    els.pop.hidden = true;
    els.pop.classList.remove('is-in');
    els.popBody.replaceChildren();
    if (trg && trg.setAttribute) trg.setAttribute('aria-expanded', 'false');
    pop = { open: false };
    clearTimeout(gateCloseTimer);
    if (o.silent) return;
    if (o.restoreFocus && trg && trg.isConnected && typeof trg.focus === 'function') {
      try { trg.focus({ preventScroll: true }); } catch (e) { /* */ }
    }
    dispatch(slide, 'reveal:close', {});
    if (!o.remote) send({ type: 'close' });
  }
  const revealAPI = { open: openReveal, show: showReveal, close: closeReveal, isOpen: () => pop.open, reposition: positionPop };

  /* ---------------------------------------------------------------------------
     Portões (checklists)
     ------------------------------------------------------------------------ */
  function gateKey(slide, g) { return (slide ? slide.id : '?') + '|' + g; }
  function gateOwner(gateEl) { return slideOf(gateEl) || (els.pop.contains(gateEl) ? pop.slide : null); }
  function bindGate(gateEl, slide) {
    const set = gateState.get(gateKey(slide, gateEl.dataset.gate)) || new Set();
    qsa('input[type="checkbox"]', gateEl).forEach((cb, i) => { cb.dataset.i = String(i); cb.checked = set.has(i); });
    updateGateUI(gateEl);
  }
  function updateGateUI(gateEl) {
    const boxes = qsa('input[type="checkbox"]', gateEl);
    const n = boxes.filter((b) => b.checked).length;
    const open = boxes.length > 0 && n === boxes.length;
    gateEl.classList.toggle('is-open', open);
    const st = qs('.gate-status', gateEl);
    if (st) st.textContent = open ? 'Portão aberto' : n + ' de ' + boxes.length + ' critérios';
    return { open, n, total: boxes.length };
  }
  function gateTriggers(slide, code) {
    if (!slide) return [];
    const L = window.AxonReveals;
    const nc = L ? L.normalize(code) : code;
    return qsa('[data-reveal][data-pick], [data-gate]:not(.gate)', slide).filter((t) => {
      const v = t.getAttribute('data-gate') || t.getAttribute('data-pick');
      return (L ? L.normalize(v) : v) === nc;
    });
  }
  function onGateChange(cb, remote) {
    const gateEl = cb.closest('.gate');
    if (!gateEl) return;
    const slide = gateOwner(gateEl);
    const code = gateEl.dataset.gate || '';
    const k = gateKey(slide, code);
    const boxes = qsa('input[type="checkbox"]', gateEl);
    const set = new Set();
    boxes.forEach((b, i) => { if (b.checked) set.add(i); });
    gateState.set(k, set);
    const wasOpen = gateEl.classList.contains('is-open');
    const st = updateGateUI(gateEl);
    dispatch(slide, 'gate:check', { gate: code, checked: st.n, total: st.total });
    if (!remote) send({ type: 'gatecheck', slide: slide && slide.id, gate: code, i: Number(cb.dataset.i), checked: cb.checked });
    const trigs = gateTriggers(slide, code);
    if (st.open && !wasOpen) {
      trigs.forEach((t) => t.classList.add('is-open'));
      trigs.forEach((t) => { const d = qs('.diamond', t) || t; fxProxy.pulse(d, { size: 16 }); });
      dispatch(slide, 'gate:open', { gate: code, trigger: trigs[0] || null });
      const trg = pop.open && els.pop.contains(gateEl) ? pop.trigger : null;
      const auto = !trg || !trg.getAttribute || trg.getAttribute('data-gate-autoclose') !== 'false';
      if (trg && auto) {
        clearTimeout(gateCloseTimer);
        gateCloseTimer = setTimeout(() => closeReveal({ remote: true }), reduced() ? 300 : 900);
      }
    } else if (!st.open && wasOpen) {
      trigs.forEach((t) => t.classList.remove('is-open'));
      dispatch(slide, 'gate:close', { gate: code });
    }
  }

  /* ---------------------------------------------------------------------------
     Cartas flip e alternadores
     ------------------------------------------------------------------------ */
  function setFlip(f, on) {
    if (f.classList.contains('is-flipped') === on) { f.setAttribute('aria-pressed', String(on)); return; }
    const slide = slideOf(f);
    const animate = !reduced() && !(slide && slide.classList.contains('is-resetting'));
    if (animate) {
      f.classList.add('is-turning');
      clearTimeout(f.__turnT);
      f.__turnT = setTimeout(() => f.classList.remove('is-turning'), 560);
    }
    f.classList.toggle('is-flipped', on);
    f.setAttribute('aria-pressed', String(on));
  }
  function toggleFlip(f, force) {
    const on = force === undefined ? !f.classList.contains('is-flipped') : !!force;
    if (on && !f.closest('[data-flip-multi]')) {
      const scope = f.closest('.flip-group') || slideOf(f);
      if (scope) qsa('.flip.is-flipped', scope).forEach((o) => { if (o !== f) setFlip(o, false); });
    }
    setFlip(f, on);
    dispatch(slideOf(f), 'flip', { flip: f, flipped: on });
  }
  function segTarget(seg) {
    const sel = seg.getAttribute('data-target');
    if (!sel) return null;
    const slide = slideOf(seg);
    try { return (slide && slide.querySelector(sel)) || document.querySelector(sel); } catch (e) { return null; }
  }
  function setSeg(seg, value, fire) {
    qsa('button[data-value]', seg).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
    seg.dataset.value = value;
    const target = segTarget(seg);
    if (target) {
      target.dataset.state = value;
      qsa('[data-when]', target).forEach((e) => e.classList.toggle('is-on', e.getAttribute('data-when').split(/\s+/).indexOf(value) >= 0));
    }
    if (fire) dispatch(slideOf(seg), 'seg:change', { seg, value, target });
  }

  /* ---------------------------------------------------------------------------
     Clones estáticos (leitura, comparar, apresentador, impressão)
     ------------------------------------------------------------------------ */
  let sheet;
  function getSheet() {
    if (sheet !== undefined) return sheet;
    sheet = null;
    try { if ('adoptedStyleSheets' in Document.prototype) { const s = new CSSStyleSheet(); s.replaceSync(cssTextForShadow()); sheet = s; } } catch (e) { sheet = null; }
    return sheet;
  }
  function cssTextForShadow() {
    const css = (qs('#axon-css') || {}).textContent || '';
    return css.replace(/@font-face\s*{[^}]*}/g, '');
  }
  function makeClone(id, scaleFixed) {
    const host = h('div', 'slide-clone');
    host.setAttribute('aria-hidden', 'false');
    const root = host.attachShadow({ mode: 'open' });
    const sh = getSheet();
    if (sh) root.adoptedStyleSheets = [sh];
    else { const st = document.createElement('style'); st.textContent = cssTextForShadow(); root.appendChild(st); }
    const wrap = h('div', 'clone-canvas');
    wrap.innerHTML = pristine.get(id) || '';
    const sec = wrap.firstElementChild;
    if (sec) {
      sec.classList.add('is-static');
      sec.classList.remove('is-active');
      sec.removeAttribute('inert');
      sec.removeAttribute('aria-hidden');
      qsa('button, [tabindex], input, a[href]', sec).forEach((x) => x.setAttribute('tabindex', '-1'));
      qsa('template, .notes, .keymsg', sec).forEach((x) => x.remove());
    }
    root.appendChild(wrap);
    if (scaleFixed != null) host.style.setProperty('--clone-scale', String(scaleFixed));
    else {
      if (!cloneRO && 'ResizeObserver' in window) {
        cloneRO = new ResizeObserver((entries) => entries.forEach((en) => {
          const w = en.contentRect.width;
          if (w > 0) en.target.style.setProperty('--clone-scale', String(w / W));
        }));
      }
      if (cloneRO) cloneRO.observe(host);
      requestAnimationFrame(() => { if (host.clientWidth) host.style.setProperty('--clone-scale', String(host.clientWidth / W)); });
    }
    return host;
  }

  /* ---------------------------------------------------------------------------
     Anexo (revelações estáticas do slide)
     ------------------------------------------------------------------------ */
  function annexNode(src, deck) {
    const box = document.createElement('div');
    box.appendChild(src.cloneNode(true));
    fillIncludes(box, deck, 'annex');
    staticize(box);
    qsa('.flip-tag', box).forEach((x) => x.remove());
    const f = document.createDocumentFragment();
    const inner = box.firstElementChild;
    Array.from(inner ? inner.childNodes : []).forEach((n) => f.appendChild(n));
    return f;
  }
  function collectAnnex(slide) {
    const deck = slide.dataset.deck;
    const L = window.AxonReveals;
    const out = [];
    const seen = new Map();
    const usedLib = new Set();
    const shownTexts = [];
    const noteLib = (root) => qsa('[data-include]', root).forEach((x) => usedLib.add(x.getAttribute('data-include')));
    qsa('[data-reveal], .flip, .seg[data-target], [data-annex], template.annex', slide).forEach((n) => {
      if (n.matches('template.annex')) {
        const node = n.content.cloneNode(true);
        noteLib(node);
        fillIncludes(node, deck, 'annex');
        staticize(node);
        out.push({ label: n.getAttribute('data-title') || 'Detalhe', title: '', selo: n.getAttribute('data-selo') || '', node });
        return;
      }
      if (n.matches('[data-reveal]')) {
        const spec = collapse(n.getAttribute('data-reveal'));
        const key = [spec, n.getAttribute('data-pick') || '', n.getAttribute('data-variant') || '', n.getAttribute('data-part') || ''].join('|');
        const label = labelOf(n);
        if (seen.has(key)) {
          const it = seen.get(key);
          if (it.labels.indexOf(label) < 0) { it.labels.push(label); it.label = it.labels.join(' · '); }
        } else {
          const c = buildRevealContent(n, slide, 'annex', deck);
          if (c) {
            const it = { label, labels: [label], title: c.title, selo: c.selo, node: c.node };
            seen.set(key, it);
            out.push(it);
            if (spec.charAt(0) !== '#') usedLib.add(spec);
            else { try { const tpl = slide.querySelector(spec); if (tpl) noteLib(tpl.content); } catch (e) { /* */ } }
          }
        }
      }
      if (n.matches('.flip')) {
        const front = qs('.flip-front', n), back = qs('.flip-back', n);
        if (back) {
          noteLib(back);
          const label = n.getAttribute('data-label') || labelOf(front || n);
          shownTexts.push(collapse(front ? front.textContent : '').toLowerCase());
          out.push({ label, title: n.getAttribute('data-annex-title') || '', node: annexNode(back, deck) });
        }
      }
      if (n.matches('.seg[data-target]')) {
        const target = segTarget(n);
        if (target) {
          const box = h('div', 'rv-dl');
          qsa('button[data-value]', n).forEach((b) => {
            const parts = qsa('[data-when]', target).filter((e) => e.getAttribute('data-when').split(/\s+/).indexOf(b.dataset.value) >= 0);
            if (!parts.length) return;
            const txt = collapse(parts.map((e) => e.textContent).join(' '));
            const lab = collapse(b.textContent);
            const p = h('p');
            p.innerHTML = (txt.toLowerCase().indexOf(lab.toLowerCase()) === 0 ? '' : '<strong>' + esc(lab) + ':</strong> ') + esc(txt);
            box.appendChild(p);
          });
          if (box.childNodes.length) out.push({ label: n.getAttribute('aria-label') || 'Alternador', title: '', node: box });
        }
      }
      if (n.hasAttribute('data-annex')) {
        out.push({ label: labelOf(n), title: '', node: h('p', '', esc(n.getAttribute('data-annex'))) });
      }
    });
    if (L) {
      usedLib.forEach((k) => (L.readingOnly(k) || []).forEach((x) => {
        const m = collapse(strip(x.match || x.label)).toLowerCase();
        if (shownTexts.some((t) => t.indexOf(m) >= 0)) return;
        out.push({ label: x.label, title: x.title || '', selo: 'modo leitura', node: frag(x.html) });
      }));
    }
    return out;
  }
  function strip(s) { return String(s || '').replace(/<[^>]+>/g, ' '); }

  function buildAnnex(slide, o) {
    o = o || {};
    const deck = slide.dataset.deck;
    const items = collectAnnex(slide);
    const notesEl = qs(':scope > aside.notes', slide);
    const keyEl = qs(':scope > .keymsg', slide);
    const withNotes = !!o.notes && !!(notesEl || keyEl);
    if (!items.length && !withNotes) return null;
    const sec = h('section', 'annex');
    sec.setAttribute('aria-label', 'Anexo do slide ' + slide.dataset.index);
    const head = h('header', 'annex-head');
    if (o.print) {
      head.innerHTML = '<p class="annex-kicker">Anexo · ' + esc(DECK_NAME[deck]) + ' · slide ' + esc(slide.dataset.index) + '</p>' +
        '<h3 class="annex-title">' + esc(slide.dataset.title || '') + '</h3>';
    } else {
      head.innerHTML = '<p class="annex-kicker">Revelações e detalhes do slide ' + esc(slide.dataset.index) + '</p>';
    }
    sec.appendChild(head);
    if (withNotes) {
      const nb = h('div', 'annex-notes');
      if (keyEl) nb.appendChild(h('p', 'annex-key', '<span class="annex-lbl">Mensagem-chave</span>' + esc(collapse(keyEl.textContent))));
      if (notesEl) { const d = h('div', 'annex-note', '<span class="annex-lbl">Nota do apresentador</span>'); d.insertAdjacentHTML('beforeend', notesEl.innerHTML); nb.appendChild(d); }
      sec.appendChild(nb);
    }
    if (items.length) {
      const list = h('div', 'annex-items');
      items.forEach((it) => {
        const art = h('article', 'annex-item');
        const hh = h('h4', 'annex-h');
        hh.innerHTML = '<span class="annex-trg">' + esc(it.label) + '</span>' +
          (it.title && collapse(it.title).toLowerCase() !== collapse(it.label).toLowerCase()
            ? '<span class="annex-sep" aria-hidden="true">›</span><span class="annex-ttl">' + esc(it.title) + '</span>' : '') +
          (it.selo ? '<span class="selo">' + esc(it.selo) + '</span>' : '');
        art.appendChild(hh);
        art.appendChild(it.node);
        list.appendChild(art);
      });
      sec.appendChild(list);
    }
    return sec;
  }

  /* ---------------------------------------------------------------------------
     Modo leitura (L)
     ------------------------------------------------------------------------ */
  let readingIO = null;
  function setReading(on, o) {
    o = o || {};
    on = !!on;
    if (on === state.reading) return;
    state.reading = on;
    document.body.classList.toggle('is-reading', on);
    els.reading.hidden = !on;
    setPressed('reading', on);
    if (on) {
      closeReveal({ silent: true });
      if (state.compare) setCompare(false);
      state.readingIndex = state.index;
      renderReading();
      requestAnimationFrame(() => scrollReadingTo(state.index, true));
    } else {
      if (readingIO) { readingIO.disconnect(); readingIO = null; }
      els.rdList.replaceChildren();
      if (o.user && window.innerWidth < 760) state.userLeftReading = true;
      state.autoReading = false;
      const idx = state.readingIndex;
      fit();
      if (idx !== state.index) go(state.deck, idx, { fromReading: true });
    }
  }
  function renderReading() {
    if (!els.rdList) return;
    if (readingIO) { readingIO.disconnect(); readingIO = null; }
    els.rdTitle.textContent = 'Modo leitura · ' + DECK_NAME[state.deck];
    const notes = !!(els.rdNotes && els.rdNotes.checked);
    const list = els.rdList;
    list.replaceChildren();
    decks[state.deck].forEach((sl, i) => {
      const art = h('article', 'rd-slide');
      art.dataset.index = String(i + 1);
      art.id = 'rd-' + sl.id;
      art.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + (sl.dataset.title || ''));
      art.appendChild(h('h2', 'rd-h', pad2(i + 1) + ' · ' + esc(sl.dataset.title || '')));
      art.appendChild(makeClone(sl.id));
      const ax = buildAnnex(sl, { notes });
      if (ax) art.appendChild(ax);
      list.appendChild(art);
    });
    if ('IntersectionObserver' in window) {
      readingIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) state.readingIndex = Number(en.target.dataset.index) || state.readingIndex; });
      }, { root: els.reading, rootMargin: '-35% 0px -55% 0px' });
      qsa('.rd-slide', list).forEach((a) => readingIO.observe(a));
    }
  }
  function scrollReadingTo(i, instant) {
    const a = qs('.rd-slide[data-index="' + i + '"]', els.rdList);
    if (!a) return;
    state.readingIndex = i;
    const top = a.offsetTop - (els.rdBar ? els.rdBar.offsetHeight : 0) - 8;
    els.reading.scrollTo({ top: Math.max(0, top), behavior: instant || reduced() ? 'auto' : 'smooth' });
  }
  function checkNarrow() {
    if (IS_PRESENTER) return;
    const narrow = window.innerWidth < 760;
    if (narrow && !state.reading && !state.userLeftReading) { setReading(true); state.autoReading = true; }
    if (!narrow) {
      state.userLeftReading = false;
      if (state.autoReading && state.reading) setReading(false);
      state.autoReading = false;
    }
  }

  /* ---------------------------------------------------------------------------
     Notas (N) e apresentador (P)
     ------------------------------------------------------------------------ */
  function notesOf(el) {
    const n = el && qs(':scope > aside.notes', el);
    const k = el && qs(':scope > .keymsg', el);
    return { notes: n ? n.innerHTML : '', key: k ? collapse(k.textContent) : '' };
  }
  function setNotes(on) {
    state.notes = !!on;
    els.notes.hidden = !state.notes;
    setPressed('notes', state.notes);
    renderNotes();
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--drawer-h', state.notes ? els.notes.offsetHeight + 'px' : '0px');
      fit();
    });
  }
  function renderNotes() {
    if (!state.notes || !els.notes) return;
    const c = notesOf(currentEl());
    els.notesKey.textContent = c.key || '—';
    els.notesBody.innerHTML = c.notes || '<p>—</p>';
    requestAnimationFrame(() => { document.documentElement.style.setProperty('--drawer-h', els.notes.offsetHeight + 'px'); fit(); });
  }

  let timer = { start: 0, acc: 0, running: false, iv: 0 };
  function setPresenterLayout(on) {
    document.body.classList.toggle('presenter', on);
    els.presenter.hidden = !on;
    qsa('[data-presenter-only]').forEach((x) => { x.hidden = !on; });
    if (on) {
      if (state.notes) setNotes(false);
      timer = { start: Date.now(), acc: 0, running: true, iv: timer.iv };
      clearInterval(timer.iv);
      timer.iv = setInterval(tick, 1000);
      tick();
      renderPresenter();
    } else {
      clearInterval(timer.iv);
    }
    requestAnimationFrame(fit);
  }
  function tick() {
    const now = new Date();
    if (els.prClock) els.prClock.textContent = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
    const ms = timer.acc + (timer.running ? Date.now() - timer.start : 0);
    const s = Math.floor(ms / 1000);
    if (els.prTimer) els.prTimer.textContent = (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60);
  }
  function renderPresenter() {
    if (!els.presenter || els.presenter.hidden) return;
    const el = currentEl();
    const c = notesOf(el);
    els.prKey.textContent = c.key || '—';
    els.prNotes.innerHTML = c.notes || '<p>—</p>';
    els.prPos.textContent = DECK_LABEL[state.deck] + ' · slide ' + state.index + ' de ' + count();
    const nx = decks[state.deck][state.index];
    els.prNext.replaceChildren(nx ? makeClone(nx.id) : h('p', 'pr-end', 'Fim da proposta'));
    els.prNextTitle.textContent = nx ? pad2(state.index + 1) + ' · ' + (nx.dataset.title || '') : '';
  }
  function togglePresenter() {
    if (IS_PRESENTER) return;
    if (state.presenterInline) { state.presenterInline = false; setPresenterLayout(false); setPressed('presenter', false); return; }
    if (presenterWin && !presenterWin.closed) { try { presenterWin.focus(); } catch (e) { /* */ } return; }
    let w = null;
    try {
      const base = location.href.split('#')[0].replace(/([?&])presenter=1(&|$)/, '$1').replace(/[?&]$/, '');
      const url = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'presenter=1#' + state.deck + '-' + state.index;
      w = window.open(url, 'axon-presenter', 'popup,width=1280,height=800');
    } catch (e) { w = null; }
    if (w) { presenterWin = w; syncOn = true; }
    else { state.presenterInline = true; setPresenterLayout(true); setPressed('presenter', true); }
  }

  /* ---------------------------------------------------------------------------
     Sincronização entre janelas (BroadcastChannel + postMessage)
     ------------------------------------------------------------------------ */
  let bc = null;
  try { bc = new BroadcastChannel('axon-deck'); bc.onmessage = (e) => receive(e.data); } catch (e) { bc = null; }
  function send(msg) {
    if (!syncOn || applyingRemote) return;
    const m = Object.assign({ ns: 'axon-deck', id: WIN_ID + ':' + (++msgSeq), src: WIN_ID, presenter: IS_PRESENTER }, msg);
    try { if (bc) bc.postMessage(m); } catch (e) { /* */ }
    [presenterWin, window.opener].forEach((w) => { if (w && !w.closed) { try { w.postMessage(m, '*'); } catch (e) { /* */ } } });
  }
  function receive(m) {
    if (!m || m.ns !== 'axon-deck' || m.src === WIN_ID || seenMsg.has(m.id)) return;
    seenMsg.add(m.id);
    if (seenMsg.size > 400) seenMsg.clear();
    if (m.presenter) syncOn = true;
    if (!syncOn) return;
    applyingRemote = true;
    try {
      switch (m.type) {
        case 'hello':
          if (!IS_PRESENTER) { applyingRemote = false; send({ type: 'nav', deck: state.deck, index: state.index }); }
          break;
        case 'nav':
          if (state.reading) { state.readingIndex = m.index; }
          go(m.deck, m.index, { remote: true });
          break;
        case 'click': {
          const sl = byId.get(m.slide);
          if (sl && sl === currentEl()) { const el = qsa(SYNC_SEL, sl)[m.idx]; if (el) el.click(); }
          break;
        }
        case 'popclick': {
          const el = qsa('[data-reveal]', els.pop)[m.idx];
          if (el) el.click();
          break;
        }
        case 'close':
          closeReveal({ remote: true });
          break;
        case 'gatecheck': {
          if (!pop.open || !pop.slide || pop.slide.id !== m.slide) break;
          const g = qsa('.gate', els.pop).find((x) => x.dataset.gate === m.gate);
          const cb = g && qsa('input[type="checkbox"]', g)[m.i];
          if (cb && cb.checked !== m.checked) { cb.checked = m.checked; onGateChange(cb, true); }
          break;
        }
        default: break;
      }
    } catch (err) {
      console.error('[AxonDeck] sincronização:', err);
    } finally { applyingRemote = false; }
  }
  window.addEventListener('message', (e) => { if (e.data && e.data.ns === 'axon-deck') receive(e.data); });

  /* ---------------------------------------------------------------------------
     Comparar (C), ajuda (?), tela cheia (F), impressão
     ------------------------------------------------------------------------ */
  function setCompare(on) {
    state.compare = !!on;
    els.compare.hidden = !state.compare;
    setPressed('compare', state.compare);
    if (state.compare) { closeReveal({ silent: true }); renderCompare(); }
    else els.cmpRow.replaceChildren();
  }
  function renderCompare() {
    const i = state.index;
    els.cmpTitle.textContent = 'Comparar · slide ' + i + ' nas duas propostas';
    els.cmpRow.replaceChildren();
    ['A', 'B'].forEach((d) => {
      const sl = decks[d][i - 1];
      const fig = h('figure', 'cmp-fig');
      fig.appendChild(h('figcaption', '', esc(DECK_LABEL[d]) + (sl ? ' · ' + esc(sl.dataset.title || '') : '')));
      if (sl) fig.appendChild(makeClone(sl.id));
      els.cmpRow.appendChild(fig);
    });
    const b = decks.B[i - 1], a = decks.A[i - 1];
    const diff = (b && b.getAttribute('data-compare')) || (a && a.getAttribute('data-compare')) || '';
    els.cmpDiff.textContent = diff;
    els.cmpDiff.hidden = !diff;
  }
  function toggleHelp() {
    const d = els.help;
    if (!d) return;
    if (d.open) d.close();
    else { closeReveal({ silent: true }); try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
  }
  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* */ }
  }
  function openPrint() {
    const d = els.printDlg;
    if (!d) { preparePrint({ decks: state.deck }); window.print(); return; }
    const r = qs('input[name="pp-deck"][value="' + state.deck + '"]', d);
    if (r) r.checked = true;
    closeReveal({ silent: true });
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  }
  function preparePrint(o) {
    o = o || {};
    const which = String(o.decks || state.deck).toUpperCase();
    const list = which === 'AB' ? ['A', 'B'] : [which === 'B' ? 'B' : 'A'];
    const root = els.printRoot;
    root.replaceChildren();
    let pages = 0;
    list.forEach((d) => decks[d].forEach((sl) => {
      const pg = h('div', 'pp-page pp-slide');
      pg.appendChild(makeClone(sl.id, 1));
      root.appendChild(pg);
      pages++;
      const ax = buildAnnex(sl, { notes: !!o.notes, print: true });
      if (ax) { const ap = h('div', 'pp-page pp-annex'); ap.appendChild(ax); root.appendChild(ap); pages++; }
    }));
    state.printPrepared = true;
    document.documentElement.classList.add('is-printing');
    return pages;
  }
  function endPrint() {
    if (els.printRoot) els.printRoot.replaceChildren();
    state.printPrepared = false;
    state.printAuto = false;
    document.documentElement.classList.remove('is-printing');
  }

  function setPressed(act, on) {
    qsa('[data-act="' + act + '"]').forEach((b) => b.setAttribute('aria-pressed', String(!!on)));
  }

  /* ---------------------------------------------------------------------------
     Eventos
     ------------------------------------------------------------------------ */
  function onKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const tag = t && t.tagName;
    const typing = (tag === 'INPUT' && !/^(checkbox|radio|button|submit)$/i.test(t.type)) || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable);
    if (typing) return;
    if (qs('dialog[open]')) return; // diálogos tratam as próprias teclas (Esc nativo)
    const k = e.key;
    if (k === 'Escape') {
      if (pop.open) { e.preventDefault(); closeReveal({ restoreFocus: true }); return; }
      if (state.compare) { setCompare(false); return; }
      if (state.notes) { setNotes(false); return; }
      if (state.reading) { setReading(false, { user: true }); return; }
      if (state.presenterInline) { togglePresenter(); return; }
      return;
    }
    if ((k === 'Enter' || k === ' ') && t && t.getAttribute && t.getAttribute('role') === 'button' && tag !== 'BUTTON') {
      e.preventDefault(); t.click(); return;
    }
    if ((k === 'Enter' || k === ' ') && t && t.closest && t.closest('button, a[href], input, select, summary, label')) return;
    if (k === '?') { e.preventDefault(); toggleHelp(); return; }
    const lower = k.length === 1 ? k.toLowerCase() : k;
    switch (lower) {
      case 'a': setDeck('A'); return;
      case 'b': setDeck('B'); return;
      case 'l': setReading(!state.reading, { user: true }); return;
      case 'n': if (!document.body.classList.contains('presenter')) setNotes(!state.notes); return;
      case 'p': togglePresenter(); return;
      case 'f': toggleFullscreen(); return;
      case 'c': setCompare(!state.compare); return;
      default: break;
    }
    if (state.reading) {
      if (/^[1-9]$/.test(k) && Number(k) <= count()) { scrollReadingTo(Number(k)); }
      return; // rolagem nativa no modo leitura
    }
    switch (k) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Spacebar':
        e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); go(state.deck, 1); break;
      case 'End': e.preventDefault(); go(state.deck, count()); break;
      default:
        if (/^[1-9]$/.test(k) && Number(k) <= count()) { e.preventDefault(); go(state.deck, Number(k)); }
    }
  }

  function bindEvents() {
    document.addEventListener('keydown', onKey);

    // difusão de cliques para a outra janela (fase de captura)
    document.addEventListener('click', (e) => {
      if (applyingRemote || !syncOn || !e.target || !e.target.closest) return;
      const inPop = e.target.closest('#rvpop [data-reveal]');
      if (inPop) { send({ type: 'popclick', idx: qsa('[data-reveal]', els.pop).indexOf(inPop) }); return; }
      const slide = e.target.closest('.slide.is-active');
      if (!slide) return;
      const el = e.target.closest(SYNC_SEL);
      if (!el || !slide.contains(el)) return;
      const idx = qsa(SYNC_SEL, slide).indexOf(el);
      if (idx >= 0) send({ type: 'click', slide: slide.id, idx });
    }, true);

    // ações dentro do canvas
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.rvpop-x')) { closeReveal({ restoreFocus: true }); return; }
      const trg = t.closest('[data-reveal]');
      if (trg && (trg.closest('.slide.is-active') || trg.closest('#rvpop'))) { e.preventDefault(); openReveal(trg); return; }
      const segBtn = t.closest('.seg button[data-value]');
      if (segBtn && segBtn.closest('.slide.is-active')) { setSeg(segBtn.closest('.seg'), segBtn.dataset.value, true); return; }
      const flip = t.closest('.flip');
      if (flip && flip.closest('.slide.is-active')) {
        const inner = t.closest('button, a[href], input, label, [data-reveal]');
        if (inner && inner !== flip && flip.contains(inner)) return;
        toggleFlip(flip);
      }
    });

    // checkboxes de portão
    document.addEventListener('change', (e) => {
      const cb = e.target;
      if (cb && cb.matches && cb.matches('.gate input[type="checkbox"]') && !applyingRemote) onGateChange(cb, false);
    });

    // fechar popover ao clicar fora
    document.addEventListener('pointerdown', (e) => {
      if (!pop.open) return;
      const t = e.target;
      if (els.pop.contains(t)) return;
      if (pop.trigger && pop.trigger.contains && pop.trigger.contains(t)) return;
      if (t.closest && t.closest('.slide.is-active [data-reveal]')) return;
      closeReveal();
    }, true);

    // barra superior, barra-axônio e painéis
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-act], [data-nav], .deckseg button');
      if (!b) return;
      if (b.matches('.deckseg button')) { setDeck(b.dataset.deck); return; }
      if (b.dataset.nav === 'prev') { prev(); return; }
      if (b.dataset.nav === 'next') { next(); return; }
      switch (b.dataset.act) {
        case 'notes': setNotes(!state.notes); break;
        case 'reading': setReading(!state.reading, { user: true }); break;
        case 'presenter': togglePresenter(); break;
        case 'compare': setCompare(!state.compare); break;
        case 'fullscreen': toggleFullscreen(); break;
        case 'print': openPrint(); break;
        case 'help': toggleHelp(); break;
        case 'close-notes': setNotes(false); break;
        case 'close-compare': setCompare(false); break;
        case 'close-help': els.help && els.help.close(); break;
        case 'exit-reading': setReading(false, { user: true }); break;
        case 'exit-presenter': if (state.presenterInline) togglePresenter(); else window.close(); break;
        case 'timer-toggle':
          if (timer.running) { timer.acc += Date.now() - timer.start; timer.running = false; b.textContent = 'Retomar'; }
          else { timer.start = Date.now(); timer.running = true; b.textContent = 'Pausar'; }
          tick(); break;
        case 'timer-reset': timer.acc = 0; timer.start = Date.now(); tick(); break;
        default: break;
      }
    });

    if (els.rdNotes) els.rdNotes.addEventListener('change', () => { const i = state.readingIndex; renderReading(); scrollReadingTo(i, true); });

    // diálogo de impressão
    if (els.printDlg) {
      els.printDlg.addEventListener('close', () => {
        if (els.printDlg.returnValue !== 'print') return;
        const r = qs('input[name="pp-deck"]:checked', els.printDlg);
        const notes = !!qs('#pp-notes', els.printDlg).checked;
        preparePrint({ decks: r ? r.value : state.deck, notes });
        setTimeout(() => { try { window.print(); } catch (err) { /* */ } }, 60);
      });
    }
    window.addEventListener('beforeprint', () => { if (!state.printPrepared) { preparePrint({ decks: state.deck }); state.printAuto = true; } });
    window.addEventListener('afterprint', () => endPrint());

    // gestos de toque
    let touch = null;
    els.stage.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { touch = null; return; }
      const p = e.touches[0];
      touch = { x: p.clientX, y: p.clientY, t: Date.now() };
    }, { passive: true });
    els.stage.addEventListener('touchend', (e) => {
      if (!touch) return;
      const p = e.changedTouches[0];
      const dx = p.clientX - touch.x, dy = p.clientY - touch.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy) && Date.now() - touch.t < 900) { if (dx < 0) next(); else prev(); }
      touch = null;
    }, { passive: true });

    // rotas e redimensionamento
    window.addEventListener('hashchange', () => {
      const r = parseHash();
      if (r && (r.deck !== state.deck || r.index !== state.index)) go(r.deck, r.index, { fromHash: true, rerenderReading: true });
    });
    let rz = 0;
    window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fit(); checkNarrow(); }); });
    if ('ResizeObserver' in window) new ResizeObserver(() => fit()).observe(els.stage);
    document.addEventListener('fullscreenchange', () => setPressed('fullscreen', !!document.fullscreenElement));
    const onMotion = () => document.documentElement.classList.toggle('rm', reduced());
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', onMotion);
    onMotion();
  }

  /* ---------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    if (state.booted) return;
    els = {
      stage: qs('#stage'), canvas: qs('#canvas'),
      pop: qs('#rvpop'), popTitle: qs('#rvpop-title'), popSelo: qs('#rvpop-selo'), popBody: qs('#rvpop-body'),
      fiber: qs('#ax-fiber'), axDeck: qs('#ax-deck'), axCount: qs('#ax-count'), axTitle: qs('#ax-title'),
      prevBtn: qs('[data-nav="prev"]'), nextBtn: qs('[data-nav="next"]'),
      notes: qs('#notes'), notesKey: qs('#notes-key'), notesBody: qs('#notes-body'),
      presenter: qs('#presenter'), prClock: qs('#pr-clock'), prTimer: qs('#pr-timer'), prKey: qs('#pr-key'),
      prNotes: qs('#pr-notes'), prNext: qs('#pr-next'), prNextTitle: qs('#pr-next-title'), prPos: qs('#pr-pos'),
      reading: qs('#reading'), rdList: qs('#rd-list'), rdTitle: qs('#rd-title'), rdNotes: qs('#rd-notes'), rdBar: qs('.rd-bar'),
      compare: qs('#compare'), cmpRow: qs('#cmp-row'), cmpTitle: qs('#cmp-title'), cmpDiff: qs('#cmp-diff'),
      help: qs('#help'), printDlg: qs('#print-dlg'), printRoot: qs('#print-root'), live: qs('#sr-live')
    };
    if (!els.stage || !els.canvas) { console.error('[AxonDeck] estrutura do shell ausente (#stage/#canvas).'); return; }

    qsa('.deck').forEach((dk) => {
      const d = dk.dataset.deck === 'B' ? 'B' : 'A';
      qsa(':scope > section.slide', dk).forEach((s) => { if (!s.dataset.deck) s.dataset.deck = d; decks[d].push(s); });
      decks[d].sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
    });
    const ids = new Set();
    qsa('.deck [id]').forEach((x) => { if (ids.has(x.id)) console.warn('[AxonDeck] id duplicado: #' + x.id); ids.add(x.id); });
    ['A', 'B'].forEach((d) => decks[d].forEach((s) => byId.set(s.id, s)));
    validate();
    ['A', 'B'].forEach((d) => decks[d].forEach(prepareSlide));
    ['A', 'B'].forEach((d) => decks[d].forEach((s) => callHook(s.id, 'init', s, baseCtx(s))));
    ['A', 'B'].forEach((d) => decks[d].forEach(prepareInteractive));
    ['A', 'B'].forEach((d) => decks[d].forEach((s) => pristine.set(s.id, s.outerHTML)));

    buildAxon();
    bindEvents();

    if (IS_PRESENTER) {
      document.body.classList.add('is-presenter-window');
      document.title = 'Apresentador · ' + document.title;
      setPresenterLayout(true);
    }
    const r = parseHash() || restore() || { deck: 'A', index: 1 };
    fit();
    go(r.deck, r.index, { initial: true, replace: true });
    state.booted = true;
    checkNarrow();
    document.documentElement.classList.add('axon-ready');
    if (IS_PRESENTER) send({ type: 'hello' });
  }

  window.AxonDeck = {
    version: '1.0.0',
    register, boot, go, next, prev, setDeck,
    current: () => { const el = currentEl(); return { deck: state.deck, index: state.index, id: el ? el.id : null, el }; },
    slide: (id) => byId.get(id) || null,
    slides: (d) => (decks[d || state.deck] || []).slice(),
    fx: fxProxy,
    reveal: revealAPI,
    flip: (el, on) => toggleFlip(el, on),
    seg: (el, value) => setSeg(el, value, true),
    gate: {
      isOpen: (slideId, code) => { const s = gateState.get(slideId + '|' + code); const g = window.AxonReveals && window.AxonReveals.gate(code); return !!(s && g && s.size >= (g.items.length + (g.keys ? g.keys.length : 0))); },
      reset: (slideId) => { const s = byId.get(slideId); if (s) resetSlide(s); }
    },
    reducedMotion: reduced,
    setNotes, setReading: (on) => setReading(on, { user: true }), togglePresenter, toggleHelp, setCompare, toggleFullscreen,
    openPrint, preparePrint, endPrint,
    buildAnnex: (id, o) => { const s = byId.get(id); return s ? buildAnnex(s, o) : null; },
    get scale() { return state.scale; },
    get state() { return { deck: state.deck, index: state.index, reading: state.reading, notes: state.notes, compare: state.compare, presenter: document.body.classList.contains('presenter') }; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
