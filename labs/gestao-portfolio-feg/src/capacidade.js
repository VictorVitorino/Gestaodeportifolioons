/* =========================================================================
   Nível 3 - Carteira e capacidade (o que cabe) e Roadmap (quando acontece)
   APIs expostas: GP.charts.capacidade(opcoes) e GP.capacidadeResumo().
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt, hoje } = GP.util, icon = GP.icon;
  const plural = GP.util.plural || ((n, s, p) => n + ' ' + (n === 1 ? s : p));
  const r1 = v => Math.round((+v || 0) * 10) / 10 + 0;
  const f1 = v => fmt.n(r1(v), 1);
  const ST = M.STATUS_CARTEIRA, DENTRO = ['cabe', 'fixado', 'fixado_estoura'], CABE = ['cabe', 'fixado'];   // DENTRO: na carteira; CABE: na carteira sem estourar
  const fora = s => !!(ST[s] && ST[s].fora);

  /* ------------------------------------------------------------- meses */
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const mesIdx = s => +String(s).slice(0, 4) * 12 + (+String(s).slice(5, 7) - 1);
  const deIdx = i => `${Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`;
  const rotMes = s => s ? `${MESES[+String(s).slice(5, 7) - 1]}/${String(s).slice(0, 4)}` : '';
  /** 'mar–dez/2026' ou 'fev/2026–abr/2027' */
  const intervalo = (a, b) => { if(!a || !b) return 'sem datas'; a = a.slice(0, 7); b = b.slice(0, 7);
    if(a === b) return rotMes(a); return a.slice(0, 4) === b.slice(0, 4) ? `${MESES[+a.slice(5) - 1]}–${rotMes(b)}` : `${rotMes(a)}–${rotMes(b)}`; };
  const rotPeriodo = (ini, fim) => ini.slice(5) === '01' && fim.slice(5) === '12' ? (ini.slice(0, 4) === fim.slice(0, 4) ? ini.slice(0, 4) : `${ini.slice(0, 4)} a ${fim.slice(0, 4)}`) : `${rotMes(ini)} a ${rotMes(fim)}`;
  const lerMes = v => { v = String(v || '').trim(); let m = v.match(/^(\d{4})-(\d{1,2})$/) || null; if(m) return +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 2000 && +m[1] <= 2100 ? `${m[1]}-${String(+m[2]).padStart(2, '0')}` : '';
    m = v.match(/^(\d{1,2})\/(\d{4})$/); return m && +m[1] >= 1 && +m[1] <= 12 && +m[2] >= 2000 && +m[2] <= 2100 ? `${m[2]}-${String(+m[1]).padStart(2, '0')}` : ''; };

  /* ------------------------------------------------------------- ícones locais */
  const svg = (d, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    pino: '<path d="M9.5 3.5h5l-.8 6 3.3 3.3H7l3.3-3.3z"/><path d="M12 12.8V21"/>',
    auto: '<path d="M4 6.5h9M4 12h6M4 17.5h3"/><path d="M17.5 5v14M14.5 16l3 3 3-3"/>',
    excluir: '<circle cx="12" cy="12" r="8.2"/><path d="M8.6 15.4l6.8-6.8"/>',
  };

  /* ------------------------------------------------------- estado da tela */
  let extra = 0;            // simulação "e se": FTE a mais, sem gravar
  let premAberto = null;    // premissas recolhidas no celular
  const capSim = () => { const cap = GP.state().capacidade; return extra ? Object.assign({}, cap, { fte: r1((+cap.fte || 0) + extra) }) : cap; };
  const carteira = (cap = GP.state().capacidade, forcar = GP.state().forcar) => M.montarCarteira(P.todos(), cap, forcar);
  /** Cenários salvos (S.ui.cenarios), higienizados na leitura porque podem vir de um backup. */
  function cenarios(){
    const S = GP.state(), ids = new Set(P.todos().map(p => p.id)), num = (v, d) => Number.isFinite(+v) && +v >= 0 ? +v : d;
    const lista = Array.isArray(S.ui.cenarios) ? S.ui.cenarios : [];
    return lista.filter(x => x && typeof x === 'object' && x.capacidade && typeof x.capacidade === 'object').slice(0, 3).map(x => {
      const c = x.capacidade, f = {}; Object.entries(x.forcar && typeof x.forcar === 'object' ? x.forcar : {}).forEach(([k, v]) => { if(ids.has(k) && (v === 'in' || v === 'out')) f[k] = v; });
      return { nome: String(x.nome || 'Cenário').slice(0, 40), capacidade: { periodoIni: lerMes(c.periodoIni), periodoFim: lerMes(c.periodoFim), periodo: String(c.periodo || '').slice(0, 40),
        fte: num(c.fte, 0), reservaPct: Math.min(60, num(c.reservaPct, 0)), orcamento: num(c.orcamento, 0), descontarExecucao: !!c.descontarExecucao }, forcar: f };
    });
  }
  /** Aviso com ação (Desfazer). Usa o toast com opções do núcleo e, sem ele, acrescenta o botão ao aviso. */
  function avisar(msg, acao, onAcao){
    GP.toast(msg, { acao, onAcao });
    const t = document.querySelector('.toast'); if(!acao || !t || t.querySelector('.toast-act, [data-cart-desfazer]')) return;
    t.style.pointerEvents = 'auto'; t.insertAdjacentHTML('beforeend', ` <button type="button" class="link" data-cart-desfazer style="color:#cfe3a6;margin-left:8px">${esc(acao)}</button>`);
    t.querySelector('[data-cart-desfazer]').onclick = () => { t.classList.remove('on'); onAcao(); };
  }

  /* --------------------------------------------- gráfico: uso da capacidade */
  /**
   * Barra empilhada de 0 ao FTE total: reserva, em execução, nova carteira, livre e excesso (além da marca da capacidade total).
   * o: {total, reserva, reservaPct, execucao, carteira, orcamento:{limite, usado}, restricao:'pessoas'|'orcamento'|'', mes, compacto}
   */
  function graficoCapacidade(o = {}){
    const tot = Math.max(0, +o.total || 0), res = Math.min(tot, Math.max(0, +o.reserva || 0)), ex = Math.max(0, +o.execucao || 0), ca = Math.max(0, +o.carteira || 0);
    const ef = Math.max(0, tot - res), uso = ex + ca, livre = Math.max(0, ef - uso), exc = Math.max(0, uso - ef), escala = Math.max(tot, res + uso, 1e-9);
    const exV = Math.min(ex, ef), caV = Math.min(ca, Math.max(0, ef - exV));
    const segs = [
      { k:'res', nome:`Reserva${o.reservaPct != null ? ` (${fmt.n(o.reservaPct)}%)` : ''}`, v:res, w:res },
      { k:'exec', nome:'Em execução', v:ex, w:exV },
      { k:'cart', nome:'Nova carteira', v:ca, w:caV },
      { k:'livre', nome:'Livre', v:livre, w:livre },
      { k:'exc', nome:'Excesso', v:exc, w:exc },
    ];
    let l = 0; segs.forEach(s => { s.l = l / escala * 100; s.p = s.w / escala * 100; l += s.w; });
    const mark = tot / escala * 100, quando = o.mes ? ` em ${rotMes(o.mes)}` : '';
    const aria = `Uso da capacidade${quando}: ${segs.filter(s => s.v > 0).map(s => `${s.nome} ${f1(s.v)} FTE`).join(', ')}, de ${f1(tot)} FTE no total.`;
    const restr = o.restricao === 'orcamento' ? 'orçamento' : o.restricao === 'pessoas' ? 'pessoas' : '';
    const orc = o.orcamento && +o.orcamento.limite > 0 ? (() => { const lim = +o.orcamento.limite, us = Math.max(0, +o.orcamento.usado || 0), es = Math.max(lim, us), pu = Math.min(us, lim) / es * 100, pe = Math.max(0, us - lim) / es * 100;
      return `<div class="capm-orc"><div class="capm-orc-h"><span>Orçamento para novos projetos</span><b>${fmt.mi(us)} <span class="dim">de ${fmt.mi(lim)}</span></b></div>
        <div class="capm-bar capm-bar-orc"><div class="capm-segs"><i class="capm-s capm-cart" style="left:0;width:${pu}%" data-tt="Orçamento usado&#10;${esc(fmt.mi(us))} de ${esc(fmt.mi(lim))}"></i>${pe ? `<i class="capm-s capm-exc" style="left:${pu}%;width:${pe}%" data-tt="Acima do orçamento&#10;${esc(fmt.mi(us - lim))}"></i>` : ''}</div><b class="capm-mark" style="left:${lim / es * 100}%"></b></div></div>`; })()
      : o.orcamento ? '<p class="capm-orc-sem dim">Sem limite de orçamento: só as pessoas restringem a carteira.</p>' : '';
    return `<div class="capm${o.compacto ? ' capm-c' : ''}">
      ${o.compacto ? '' : `<div class="capm-top"><span class="capm-tit">${o.mes ? `Mês de pico: <b>${esc(rotMes(o.mes))}</b>` : ''}</span>${o.restricao != null ? `<span class="capm-restr">Restrição que limita: <b>${restr || 'nenhuma'}</b></span>` : ''}</div>`}
      <div class="capm-plot" role="img" aria-label="${esc(aria)}">
        <div class="capm-lbls" aria-hidden="true">${segs.filter(s => s.w > 0 && s.p >= (o.compacto ? 9 : 6)).map(s => `<span class="capm-l-${s.k}" style="left:${s.l}%;width:${s.p}%">${s.k === 'exc' ? '+' : ''}${f1(s.v)}</span>`).join('')}</div>
        <div class="capm-bar"><div class="capm-segs">${segs.filter(s => s.w > 0).map(s => `<i class="capm-s capm-${s.k}" style="left:${s.l}%;width:${s.p}%" data-tt="${esc(s.nome)}${esc(quando)}&#10;${f1(s.v)} FTE"></i>`).join('')}</div><b class="capm-mark" style="left:${mark}%" data-tt="Capacidade total&#10;${f1(tot)} FTE"></b></div>
        <div class="capm-eixo" aria-hidden="true"><span style="left:0">0</span><span class="capm-eixo-m" style="left:${mark}%">${f1(tot)} FTE</span></div>
      </div>
      <div class="capm-leg">${segs.filter(s => s.k !== 'exc' || s.v > 0).map(s => `<span><i class="capm-sw capm-${s.k}"></i>${esc(s.nome)} <b>${f1(s.v)}</b></span>`).join('')}</div>
      ${orc}</div>`;
  }
  const dadosGrafico = (c, cap, extras = {}) => Object.assign({ total: +cap.fte || 0, reserva: (+cap.fte || 0) * (+cap.reservaPct || 0) / 100, reservaPct: cap.reservaPct,
    execucao: c.pico.execucao, carteira: c.pico.carteira, mes: c.pico.mes, restricao: c.restricao, orcamento: { limite: c.orcamento, usado: c.usadoCusto } }, extras);
  GP.charts.capacidade = graficoCapacidade;

  /* -------------------------------------------------- carteira e capacidade */
  function telaCarteira(el){
    const S = GP.state(), cap = S.capacidade;
    const larg = el.clientWidth || window.innerWidth, largo = larg >= 760; if(largo) premAberto = true; else if(premAberto == null) premAberto = larg >= 560;
    el.innerHTML = U.pageHead({ titulo:'Carteira e capacidade', sub:'Informe as pessoas e o orçamento do período. O sistema percorre o ranking, mês a mês, e mostra o que cabe. O comitê pode fixar ou excluir projetos.',
        acoes:`${GP.botaoPDF()}<button class="btn btn-ghost" data-pauta>${icon('acervo', 16)} Pauta do comitê</button>` }) +
      `<div class="cart-wrap"><div class="cart-avisos" data-cart-avisos></div>
      <div class="cart-top">
        <details class="card cart-prem ${largo ? 'largo' : ''}" data-cart-prem ${premAberto ? 'open' : ''}>
          <summary><span class="cart-prem-t">Premissas do período</span><span class="cart-prem-m">Ajustar premissas</span><span class="cart-prem-r" data-cart-prem-resumo></span></summary>
          <div class="cart-prem-grid">
            <label class="field">Início<input class="input" type="month" data-cap="periodoIni" value="${esc(cap.periodoIni)}" min="2000-01" max="2100-12"></label>
            <label class="field">Fim<input class="input" type="month" data-cap="periodoFim" value="${esc(cap.periodoFim)}" min="2000-01" max="2100-12"></label>
            <label class="field">Pessoas disponíveis<span class="cart-suf"><input class="input" inputmode="decimal" data-cap="fte" data-num="1" value="${esc(fmt.campo(cap.fte))}" aria-describedby="cart-fte-h"><i>FTE</i></span><small id="cart-fte-h">Equipe dedicada a projetos</small></label>
            <label class="field">Orçamento para novos<span class="cart-suf cart-pre"><i>R$</i><input class="input" inputmode="decimal" data-cap="orcamento" data-num="1" value="${esc(fmt.n(cap.orcamento))}" aria-describedby="cart-orc-h"></span><small id="cart-orc-h">0 = sem limite</small></label>
            <div class="field cart-full cart-reserva"><label for="cart-reserva">Reserva <output data-res-out for="cart-reserva">${fmt.n(cap.reservaPct)}%</output></label>
              <input id="cart-reserva" type="range" min="0" max="60" step="1" data-cap="reservaPct" data-range value="${esc(Math.round(cap.reservaPct))}" aria-describedby="cart-res-h">
              <small id="cart-res-h" data-res-hint></small></div>
            <label class="check-row cart-full"><input type="checkbox" data-cap="descontarExecucao" ${cap.descontarExecucao ? 'checked' : ''}><span>Descontar as pessoas dos projetos em execução, nos meses em que eles ocorrem</span></label>
            <div class="cart-full"><button type="button" class="link" data-cap-padrao>Restaurar valores sugeridos</button></div>
          </div>
        </details>
        <div class="cart-res">
          <div data-cart-sim></div>
          <div class="cart-kpis" data-cart-kpis></div>
          <div class="card cart-med" data-cart-medidor></div>
          <div class="card cart-cen" data-noprint>
            <div class="cart-cen-h"><div><h3>E se tivermos mais pessoas?</h3><p>Simule sem alterar os dados salvos.</p></div>
              <div class="cart-cen-ctl"><input type="range" min="0" max="10" step="0.5" value="${extra}" data-cen-extra aria-label="Pessoas a mais na simulação (FTE)"><output data-cen-out>+${f1(extra)} FTE</output></div></div>
            <p class="cart-cen-dica" data-cen-dica></p>
            <div class="cart-cen-acoes"><button type="button" class="btn btn-ghost btn-sm" data-cen-salvar>Salvar como cenário</button><button type="button" class="link" data-cen-zerar>Voltar aos dados atuais</button></div>
            <div data-cen-comp></div>
          </div>
        </div>
      </div>
      <div class="cart-tabela" data-cart-tbl></div></div>`;
    const prem = el.querySelector('[data-cart-prem]'); prem.addEventListener('toggle', () => { premAberto = prem.open; });
    let tRes;
    const salvarCap = () => { S.meta.capacidadeConfirmada = true; GP.save(); pintar(el); };
    el.querySelectorAll('[data-cap]').forEach(i => {
      if(i.type === 'range'){
        const mostrar = () => { el.querySelector('[data-res-out]').textContent = i.value + '%'; };
        i.addEventListener('input', () => { mostrar(); clearTimeout(tRes); tRes = setTimeout(() => { cap.reservaPct = Math.min(60, Math.max(0, +i.value || 0)); salvarCap(); }, 150); });
        i.addEventListener('change', () => { clearTimeout(tRes); mostrar(); cap.reservaPct = Math.min(60, Math.max(0, +i.value || 0)); salvarCap(); });
        return;
      }
      i.addEventListener('change', () => {
        const k = i.dataset.cap;
        if(i.type === 'checkbox') cap[k] = i.checked;
        else if(k === 'periodoIni' || k === 'periodoFim'){
          const v = lerMes(i.value); if(!v){ GP.toast('Informe o mês como AAAA-MM (ex.: 2027-01).'); i.value = cap[k]; return; }
          cap[k] = v; const outro = k === 'periodoIni' ? 'periodoFim' : 'periodoIni';
          if(cap.periodoFim < cap.periodoIni) cap[outro] = v;
          if(mesIdx(cap.periodoFim) - mesIdx(cap.periodoIni) + 1 > 60){ if(k === 'periodoIni') cap.periodoFim = deIdx(mesIdx(v) + 59); else cap.periodoIni = deIdx(mesIdx(v) - 59); GP.toast('O período vai até 60 meses.'); }
          const o = el.querySelector(`[data-cap="${outro}"]`); if(o) o.value = cap[outro];
          cap.periodo = rotPeriodo(cap.periodoIni, cap.periodoFim);
        }
        else if(i.dataset.num){ const n = GP.util.numBR(i.value); if(n === '' || isNaN(n) || n < 0){ GP.toast('Valor não reconhecido. Use números como 10 ou 1,5.'); i.value = k === 'orcamento' ? fmt.n(cap[k]) : fmt.campo(cap[k]); return; } cap[k] = n; if(k === 'orcamento') i.value = fmt.n(n); }
        salvarCap();
      });
    });
    el.querySelector('[data-cap-padrao]').onclick = () => {
      const antes = Object.assign({}, S.capacidade), conf = S.meta.capacidadeConfirmada;
      S.capacidade = Object.assign({}, M.CAPACIDADE_PADRAO); S.meta.capacidadeConfirmada = false; GP.save(); GP.refresh();
      avisar('Valores sugeridos restaurados.', 'Desfazer', () => { const T = GP.state(); T.capacidade = antes; T.meta.capacidadeConfirmada = conf; GP.save(); GP.refresh(); GP.toast('Capacidade anterior restaurada.'); });
    };
    el.querySelector('[data-pauta]').onclick = () => pauta();
    // simulação "e se"
    const sl = el.querySelector('[data-cen-extra]'); let tSim;
    sl.addEventListener('input', () => { el.querySelector('[data-cen-out]').textContent = `+${f1(+sl.value)} FTE`; clearTimeout(tSim); tSim = setTimeout(() => { extra = +sl.value || 0; pintar(el); }, 60); });
    el.querySelector('[data-cen-zerar]').onclick = () => { extra = 0; sl.value = 0; el.querySelector('[data-cen-out]').textContent = '+0,0 FTE'; pintar(el); };
    el.querySelector('[data-cen-salvar]').onclick = () => salvarCenario(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-forcar]'); if(b && el.contains(b)){ decidir(el, b.dataset.forcar, b.dataset.v || ''); return; }
      const x = e.target.closest('[data-cen-remover]'); if(x){ const T = GP.state(), i = +x.dataset.cenRemover, lista = cenarios(), rem = lista.splice(i, 1)[0]; T.ui.cenarios = lista; GP.save(); pintar(el);
        avisar(`Cenário "${esc(rem ? rem.nome : '')}" removido.`, 'Desfazer', () => { const L = cenarios(); L.splice(i, 0, rem); GP.state().ui.cenarios = L.slice(0, 3); GP.save(); if(document.contains(el)) pintar(el); }); }
    });
    pintar(el);
  }

  /** Repinta só os resultados (avisos, KPIs, medidor, cenários e tabela), sem tirar o foco dos controles. */
  function pintar(el){
    const S = GP.state(), cap = S.capacidade, cs = capSim(), c = carteira(cs), plural0 = plural;
    // premissas: textos derivados
    const hint = el.querySelector('[data-res-hint]'); if(hint) hint.textContent = `${f1((+cap.fte || 0) * (+cap.reservaPct || 0) / 100)} FTE para sustentação, urgências e imprevistos (0 a 60%)`;
    const resumo = el.querySelector('[data-cart-prem-resumo]'); if(resumo) resumo.textContent = `${rotPeriodo(cap.periodoIni, cap.periodoFim)} · ${f1(cap.fte)} FTE · reserva ${fmt.n(cap.reservaPct)}%`;
    // avisos
    const obrig = c.itens.filter(i => i.status === 'obrigatorio_deslocado'), estouram = c.itens.filter(i => i.status === 'fixado_estoura');
    el.querySelector('[data-cart-avisos]').innerHTML =
      (obrig.length ? `<div class="callout bad" role="alert"><span class="ic">${icon('alerta', 16)}</span><div><p><b>As fixações deixaram ${plural0(obrig.length, 'projeto obrigatório', 'projetos obrigatórios')} fora (${obrig.map(i => esc(i.p.codigo)).join(', ')}).</b> Revise as decisões do comitê ou aumente a capacidade.</p></div></div>` : '') +
      (estouram.length ? `<div class="callout bad"><span class="ic">${icon('alerta', 16)}</span><div><p><b>${plural0(estouram.length, 'projeto fixado estoura', 'projetos fixados estouram')} a capacidade</b> (${estouram.map(i => esc(i.p.codigo)).join(', ')}): o pico chega a ${f1(c.pico.total)} FTE para ${f1(c.efetiva)} FTE efetivos.</p></div></div>` : '') +
      (c.excesso > 0 ? U.callout(`<p><b>Atenção:</b> os projetos em execução já ocupam ${f1(c.execucaoMax)} FTE em ${esc(intervalo(c.folgaMin.de, c.folgaMin.ate))}, ${f1(c.excesso)} a mais do que a capacidade disponível (${f1(c.efetiva)} FTE após a reserva). Não há espaço para novos projetos nesses meses.</p>`, 'warn') : '');
    // simulação
    el.querySelector('[data-cart-sim]').innerHTML = extra ? `<div class="cart-sim-faixa" role="status"><b>Simulação:</b> ${f1(cs.fte)} FTE (+${f1(extra)} sobre os ${f1(cap.fte)} salvos). Nada foi gravado.</div>` : '';
    // KPIs
    const deficit = c.sobraFte < -0.05, cobre = '#93461d', aPartir = c.itens.filter(i => i.status === 'cabe_a_partir').length;
    // mesma base do medidor: tudo no mês de pico da carteira selecionada; o mês mais apertado da execução vem como ressalva
    const folga = c.folgaMin.valor < c.livre - 0.05 ? ` · mín. ${f1(c.folgaMin.valor)} em ${esc(intervalo(c.folgaMin.de, c.folgaMin.ate))}` : '';
    el.querySelector('[data-cart-kpis]').innerHTML =
      U.kpi({ rotulo:'Pessoas para novos projetos', valor:f1(c.livre), unidade:'FTE', sub:`em ${esc(rotMes(c.pico.mes))} (pico): ${f1(cs.fte)} − ${fmt.n(cs.reservaPct)}% reserva − ${f1(c.comprometido)} em execução${folga}` }) +
      U.kpi({ rotulo:'Usadas pela carteira', valor:f1(c.usadoFte), unidade:'FTE', cor: deficit ? cobre : '', sub: deficit ? `<b style="color:${cobre}">excede em ${f1(-c.sobraFte)} FTE</b> em ${esc(rotMes(c.pico.mes))}` : `sobram ${f1(c.sobraFte)} FTE no pico (${esc(rotMes(c.pico.mes))})` }) +
      U.kpi({ rotulo:'Orçamento usado', valor: fmt.n(c.usadoCusto / 1e6, 2), unidade:'R$ mi', cor: c.orcamento && c.sobraOrc < 0 ? cobre : '', sub: c.orcamento ? (c.sobraOrc < 0 ? `<b style="color:${cobre}">excede em ${fmt.mi(-c.sobraOrc)}</b>` : `de ${fmt.mi(c.orcamento)}`) : 'sem limite de orçamento' }) +
      U.kpi({ rotulo:'Projetos que cabem', valor:`${c.cabem}<small>/ ${c.candidatos}</small>`, cor: c.estouram ? cobre : '',
        sub: ['aprovados e avaliados', c.estouram ? `<b style="color:${cobre}">+ ${plural0(c.estouram, 'fixado estoura', 'fixados estouram')}</b>` : '', aPartir ? `${plural0(aPartir, 'cabe', 'cabem')} mais tarde` : ''].filter(Boolean).join(' · ') });
    // medidor
    const res = (+cs.fte || 0) * (+cs.reservaPct || 0) / 100, formula = `${f1(cs.fte)} − ${f1(res)} (reserva ${fmt.n(cs.reservaPct)}%) − ${f1(c.pico.execucao)} (execução) − ${f1(c.pico.carteira)} (nova carteira) = ${deficit ? `<b class="cart-exc">excede em ${f1(-c.sobraFte)} FTE</b>` : `<b>${f1(Math.max(0, c.sobraFte))} FTE livres</b>`}`;
    el.querySelector('[data-cart-medidor]').innerHTML = `${U.secH('Uso da capacidade no mês mais carregado', `Período ${esc(c.periodo.rotulo)}. A carteira cabe se nenhum mês passar da capacidade.`, `<a class="link" href="#/roadmap">Ver mês a mês no roadmap →</a>`)}
      ${graficoCapacidade(dadosGrafico(c, cs))}<p class="cart-formula">${formula}</p>`;
    // cenários
    pintarCenarios(el, c, cs);
    // tabela
    pintarTabela(el, c, cs);
  }

  function margem(c, cs){
    const prox = c.itens.find(i => (i.status === 'nao_cabe' || i.status === 'cabe_a_partir' || i.status === 'obrigatorio_deslocado') && i.falta && i.falta.tipo === 'FTE');
    if(!prox) return null;
    const S = GP.state(), cabeCom = d => CABE.includes((M.montarCarteira(P.todos(), Object.assign({}, cs, { fte: (+cs.fte || 0) + d }), S.forcar).itens.find(i => i.p.id === prox.p.id) || {}).status);
    let alto = null; for(let d = 0.5; d <= 30; d += 0.5) if(cabeCom(d)){ alto = d; break; }
    if(alto == null) return { p:prox.p };
    let d = Math.max(0.1, alto - 0.4); while(d < alto - 1e-9 && !cabeCom(d)) d = r1(d + 0.1);
    return { p:prox.p, d: r1(Math.min(d, alto)) };
  }
  function pintarCenarios(el, c, cs){
    const S = GP.state(), mg = margem(c, cs);
    el.querySelector('[data-cen-dica]').innerHTML = mg ? (mg.d != null ? `${icon('info', 15)} <span>Com <b>+${f1(mg.d)} FTE</b>${extra ? ' além da simulação' : ''}, o <b>${esc(mg.p.codigo)}</b> caberia na sua vez do ranking. É o próximo da fila por prioridade.</span>` : `${icon('info', 15)} <span>O <b>${esc(mg.p.codigo)}</b> não cabe nem com +30 FTE: revise as datas ou o orçamento.</span>`)
      : `${icon('check', 15)} <span>Todos os candidatos com estimativa cabem${extra ? ' nesta simulação' : ''}.</span>`;
    const salvos = cenarios(), base = carteira(S.capacidade);
    const col = (nome, cc, cap, rem) => ({ nome, cc, cap, rem });
    const cols = [col('Dados atuais', base, S.capacidade), ...(extra ? [col(`Simulação +${f1(extra)}`, c, cs)] : []), ...salvos.map((x, i) => col(x.nome, M.montarCarteira(P.todos(), x.capacidade, x.forcar), x.capacidade, i))];
    el.querySelector('[data-cen-comp]').innerHTML = cols.length > 1 ? `<div class="cart-comp" role="table" aria-label="Comparação de cenários" style="--cols:${cols.length}">
      <div class="cart-comp-row cart-comp-head" role="row"><span role="columnheader">Indicador</span>${cols.map(k => `<span role="columnheader">${esc(k.nome)}${k.rem != null ? ` <button type="button" class="cart-comp-x" data-cen-remover="${k.rem}" aria-label="Remover cenário ${esc(k.nome)}">${icon('x', 12)}</button>` : ''}</span>`).join('')}</div>
      ${[['Pessoas (FTE)', k => f1(k.cap.fte)], ['FTE livre para novos', k => f1(k.cc.livre)], ['Projetos que cabem', k => `${k.cc.cabem} / ${k.cc.candidatos}${k.cc.estouram ? ` (+${k.cc.estouram} estoura)` : ''}`], ['Orçamento usado', k => fmt.mi(k.cc.usadoCusto)], ['Pico mensal', k => `${f1(k.cc.pico.total)} de ${f1(k.cc.efetiva)}`]]
        .map(([n, fn]) => `<div class="cart-comp-row" role="row"><span role="rowheader">${n}</span>${cols.map(k => `<span role="cell">${fn(k)}</span>`).join('')}</div>`).join('')}</div>`
      : `<p class="cart-cen-vazio dim">Salve até 3 cenários para compará-los lado a lado.</p>`;
    const bs = el.querySelector('[data-cen-salvar]'); if(bs) bs.disabled = salvos.length >= 3;
  }
  function salvarCenario(el){
    const S = GP.state(), lista = cenarios(); if(lista.length >= 3){ GP.toast('Já há 3 cenários salvos. Remova um para salvar outro.'); return; }
    const cs = capSim(), sug = `Cenário ${lista.length + 1}: ${f1(cs.fte)} FTE`;
    const m = GP.modal(`<h3>Salvar cenário</h3><p class="muted">Guarda a capacidade e as decisões do comitê para comparar depois. Os dados da carteira não mudam.</p>
      <label class="field">Nome do cenário<input class="input" data-cen-nome maxlength="40" value="${esc(sug)}"></label>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn btn-primary" data-ok>Salvar cenário</button></div>`);
    const ok = () => { const nome = (m.querySelector('[data-cen-nome]').value || sug).trim().slice(0, 40) || sug;
      lista.push({ nome, capacidade: Object.assign({}, cs), forcar: Object.assign({}, S.forcar) }); S.ui.cenarios = lista; GP.save(); GP.closeModal(); if(document.contains(el)) pintar(el); GP.toast(`Cenário "${esc(nome)}" salvo.`); };
    m.querySelector('[data-ok]').onclick = ok; m.querySelector('[data-cen-nome]').addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); ok(); } });
  }

  /** Controle segmentado da decisão do comitê (mantém data-forcar). */
  const decisao = p => { const v = GP.state().forcar[p.id] || '';
    return `<div class="cart-seg" role="group" aria-label="Decisão do comitê para ${esc(p.codigo)}">${[['', 'auto', 'Automático', 'Segue o ranking e a capacidade'], ['in', 'pino', 'Fixar na carteira', 'Entra antes do ranking, mesmo sem caber'], ['out', 'excluir', 'Excluir', 'Fica fora da carteira deste período']]
      .map(([k, ic, nome, desc]) => `<button type="button" data-forcar="${esc(p.id)}" data-v="${k}" aria-pressed="${v === k}" aria-label="${nome}: ${esc(p.codigo)}" data-tt="${nome}&#10;${desc}">${svg(IC[ic], 15)}</button>`).join('')}</div>`; };

  function pintarTabela(el, c, cs){
    const box = el.querySelector('[data-cart-tbl]');
    if(!c.itens.length){ box.innerHTML = U.vazio('Sem candidatos', 'A carteira usa os projetos aprovados com avaliação de prioridade completa.', '<a class="btn btn-primary" href="#/avaliar">Avaliar projetos</a>', 'carteira') + semNota(c); return; }
    const maxAc = Math.max(c.efetiva, ...c.itens.map(i => i.acumFte || 0), 1e-9);
    const acum = i => { if(i.acumFte == null) return '<span class="dim">-</span>';
      const dentro = DENTRO.includes(i.status), ok = Math.min(i.acumFte, c.efetiva) / maxAc * 100, ex = Math.max(0, i.acumFte - c.efetiva) / maxAc * 100;
      return `<div class="cart-ac ${dentro ? '' : 'hip'}" data-tt="${dentro ? `Pico mensal da carteira até ${esc(i.p.codigo)}` : `Pico mensal se ${esc(i.p.codigo)} entrasse na carteira selecionada`}&#10;${f1(i.acumFte)} FTE em ${esc(rotMes(i.picoMes))}&#10;Capacidade efetiva: ${f1(c.efetiva)} FTE"><span class="cart-ac-t"><i style="width:${ok}%"></i>${ex > 0.01 ? `<i class="ex" style="left:${ok}%;width:${ex}%"></i>` : ''}<b style="left:${c.efetiva / maxAc * 100}%"></b></span><small>${f1(i.acumFte)} de ${f1(c.efetiva)}</small></div>`; };
    const sit = i => { const s = ST[i.status]; const nome = i.status === 'cabe_a_partir' ? `Cabe a partir de ${rotMes(i.aPartir)}` : s.nome;
      const det = i.falta ? (i.falta.tipo === 'FTE' ? `faltam ${f1(i.falta.valor)} FTE${i.falta.mes ? ` em ${rotMes(i.falta.mes)}` : ''}` : `faltam ${fmt.mi(i.falta.valor)} de orçamento`) : i.status === 'fora_periodo' ? 'datas fora do período' : '';
      return U.pill(nome, s.tom) + (det ? `<small>${esc(det)}</small>` : ''); };
    const linha = (i, k) => `<tr data-id="${esc(i.p.id)}" class="${fora(i.status) ? 'is-fora' : ''}">
        <td class="c-ord" data-label="Ordem"><b>${k + 1}</b></td>
        <td class="c-rank" data-label="Rank">${i.pos}º</td>
        <td class="c-proj" data-label="Projeto"><a class="cart-p" href="#/projeto/${esc(i.p.id)}"><span class="code">${esc(i.p.codigo)}</span> <b>${esc(i.p.titulo)}</b></a>${i.p.obrigatorio ? ' <span class="tag cart-obr">obrigatório</span>' : ''}<small>${esc(i.p.gerencia || '-')} · ${esc(i.p.tipo || '-')} · ${esc(intervalo(i.p.inicioPrevisto, i.p.fimPrevisto))}</small></td>
        <td class="c-val" data-label="Valor">${GP.notaHtml ? GP.notaHtml(i.s.valor) : fmt.n(i.s.valor)}</td>
        <td class="c-num" data-label="FTE">${i.p.esforcoFte != null ? f1(i.p.esforcoFte) : '-'}</td>
        <td class="c-num" data-label="Custo">${fmt.mi(i.p.custo)}</td>
        <td class="c-ac" data-label="Acumulado">${acum(i)}</td>
        <td class="c-sit" data-label="Situação">${sit(i)}</td>
        <td class="c-dec" data-label="Decisão do comitê">${decisao(i.p)}</td></tr>`;
    // linhas por grupo: fixados → pelo ranking quem entrou → linha de corte → quem aguarda → fora da conta (excluídos, sem estimativa, fora do período).
    // Acima da linha o Acumulado é o pico real da carteira e só cresce; abaixo, é o pico se o projeto entrasse na carteira selecionada.
    const fixados = c.itens.filter(i => i.fixado), rank = c.itens.filter(i => !i.fixado), grupos = fixados.length > 0;
    const entram = rank.filter(i => DENTRO.includes(i.status)), aguardam = rank.filter(i => fora(i.status)), foraConta = rank.filter(i => !DENTRO.includes(i.status) && !fora(i.status));
    const grp = (txt, ic) => `<tr class="cart-grp"><th colspan="9" scope="rowgroup">${ic ? svg(IC.pino, 13) + ' ' : ''}${txt}</th></tr>`;
    let k = 0, corpo = '';
    if(grupos){ corpo += grp(`Fixados pelo comitê · ${fixados.length}`, true); fixados.forEach(i => { corpo += linha(i, k++); }); corpo += grp(`Pelo ranking · ${rank.length}`); }
    entram.forEach(i => { corpo += linha(i, k++); });
    if(aguardam.length){
      const excede = c.sobraFte < -0.05, temCima = entram.length || fixados.length;
      const cima = !temCima ? '' : `<span>▲ ${c.estouram ? 'Na carteira' : 'Cabem na capacidade'}${c.pico.mes ? ` · ${excede ? `pico excede em ${f1(-c.sobraFte)} FTE (${rotMes(c.pico.mes)})` : `sobram ${f1(Math.max(0, c.sobraFte))} FTE no pico (${rotMes(c.pico.mes)})`}` : ''}</span>`;
      corpo += `<tr class="cart-corte"><td colspan="9"><div class="cart-corte-l">${cima}<span>▼ Aguardam capacidade · acumulado se entrasse</span></div></td></tr>`;
      aguardam.forEach(i => { corpo += linha(i, k++); });
    }
    if(foraConta.length){ corpo += grp(`Fora da conta · ${foraConta.length}`); foraConta.forEach(i => { corpo += linha(i, k++); }); }
    box.innerHTML = `<div class="card cart-tbl-card"><div class="cart-tbl-h">${U.secH('Candidatos aprovados', 'Ordem de entrada: fixados pelo comitê → ranking de prioridade (obrigatórios primeiro). Quem não cabe é pulado, o próximo é testado e o pulado desce para abaixo da linha de corte. Sem estimativa de pessoas não entra na conta.')}</div>
      <div class="cart-tbl-wrap"><table class="cart-tbl"><thead><tr><th class="c-ord" scope="col">Ordem</th><th class="c-rank" scope="col">Rank</th><th scope="col">Projeto</th><th class="c-val" scope="col">Valor</th><th class="c-num" scope="col">FTE</th><th class="c-num" scope="col">Custo</th><th scope="col">Acumulado</th><th scope="col">Situação</th><th class="c-dec" scope="col">Decisão do comitê</th></tr></thead>
      <tbody>${corpo}</tbody></table></div></div>${semNota(c)}`;
  }
  const semNota = c => c.semNota.length ? `<p class="dim cart-semnota">${plural(c.semNota.length, 'aprovado sem avaliação completa não entra', 'aprovados sem avaliação completa não entram')} na conta: ${c.semNota.map(p => `<a class="link" href="#/avaliar/${esc(p.id)}">${esc(p.codigo)}</a>`).join(', ')}.</p>` : '';

  /** Decisão do comitê. Fixar que estoura a capacidade ou tira alguém da carteira pede confirmação com o impacto. */
  function decidir(el, id, v){
    const S = GP.state(), atual = S.forcar[id] || ''; if(v === atual) return;
    const aplicar = () => { const T = GP.state(); if(v) T.forcar[id] = v; else delete T.forcar[id]; GP.save(); if(!document.contains(el)) return; pintar(el);
      const b = el.querySelector(`[data-forcar="${CSS.escape(id)}"][data-v="${v}"]`); if(b) b.focus(); };
    if(v === 'in'){
      const cs = capSim(), antes = M.montarCarteira(P.todos(), cs, S.forcar), depois = M.montarCarteira(P.todos(), cs, Object.assign({}, S.forcar, { [id]:'in' }));
      const dentroAntes = new Set(antes.dentro.map(i => i.p.id)), estAntes = new Set(antes.itens.filter(i => i.status === 'fixado_estoura').map(i => i.p.id));
      const saem = depois.itens.filter(i => i.p.id !== id && dentroAntes.has(i.p.id) && fora(i.status));
      const estoura = depois.itens.filter(i => i.status === 'fixado_estoura' && !estAntes.has(i.p.id));
      const p = P.get(id);
      if(saem.length || estoura.length){
        GP.confirmar(`Fixar ${p ? p.codigo : ''} na carteira?`, `<p>Fixar este projeto muda a carteira de ${esc(depois.periodo.rotulo)}:</p><ul class="cart-impacto">
          ${saem.map(i => `<li><b>${esc(i.p.codigo)}</b>${i.p.obrigatorio ? ' <b class="cart-obr-t">[OBRIGATÓRIO]</b>' : ''} sai da carteira · ${esc(i.p.titulo)}</li>`).join('')}
          ${estoura.length ? `<li>O pico passa a <b>${f1(depois.pico.total)} FTE</b> em ${esc(rotMes(depois.pico.mes))}, para ${f1(depois.efetiva)} FTE efetivos: excede em ${f1(Math.max(0, -depois.sobraFte))} FTE.</li>` : ''}</ul>
          <p>Para desfazer, escolha Automático na linha do projeto.</p>`, 'Fixar mesmo assim', aplicar);
        return;
      }
    }
    aplicar();
  }

  /* --------------------------------------------------- pauta do comitê */
  function pauta(){
    const S = GP.state(), cap = S.capacidade, c = carteira(cap), sim = extra ? carteira(capSim()) : null;
    const para = c.itens.filter(i => i.status === 'cabe' || i.status === 'fixado'), estouram = c.itens.filter(i => i.status === 'fixado_estoura');
    const desloc = c.itens.filter(i => i.status === 'obrigatorio_deslocado'), aguardam = c.itens.filter(i => i.status === 'nao_cabe' || i.status === 'cabe_a_partir');
    const semEst = c.itens.filter(i => i.status === 'sem_estimativa');
    const obr = i => i.p.obrigatorio ? ' [OBRIGATÓRIO]' : '';
    const sitTxt = i => i.status === 'cabe_a_partir' ? `cabe a partir de ${rotMes(i.aPartir)}` : i.falta ? (i.falta.tipo === 'FTE' ? `faltam ${f1(i.falta.valor)} FTE` : `faltam ${fmt.mi(i.falta.valor)}`) : ST[i.status].nome.toLowerCase();
    const fila = P.todos().filter(p => p.etapa === 'entrada' || p.etapa === 'triagem'), at = GP.painelAtencao ? GP.painelAtencao(3) : [];
    // mesmos números da tela: tudo no mês de pico da carteira selecionada; fixado que estoura não conta como "cabe"
    const resumoCap = `${f1(cap.fte)} FTE, reserva de ${fmt.n(cap.reservaPct)}%, ${f1(c.comprometido)} FTE em execução no mês de pico (${rotMes(c.pico.mes)}) → ${f1(c.livre)} FTE para novos projetos nesse mês${c.folgaMin.valor < c.livre - 0.05 ? ` (no mês mais carregado pela execução, ${intervalo(c.folgaMin.de, c.folgaMin.ate)}, sobram ${f1(c.folgaMin.valor)})` : ''}.`;
    const quantos = cc => cc.estouram ? `${plural(cc.cabem, 'projeto cabe', 'projetos cabem')} e ${plural(cc.estouram, 'fixado estoura', 'fixados estouram')} a capacidade` : plural(cc.cabem, 'projeto cabe', 'projetos cabem');
    const proposta = `${quantos(c)}, com pico de ${f1(c.pico.total)} de ${f1(c.efetiva)} FTE (${rotMes(c.pico.mes)})${c.sobraFte < -0.05 ? `, ${f1(-c.sobraFte)} acima da capacidade` : ''} e ${fmt.mi(c.usadoCusto)}.`;
    const cenTxt = sim ? `Cenário em análise (não salvo): com +${f1(extra)} FTE (${f1(capSim().fte)} no total), ${quantos(sim)} de ${sim.candidatos}; pico de ${f1(sim.pico.total)} de ${f1(sim.efetiva)} FTE.` : '';
    // texto
    const L = [];
    L.push(`PAUTA DO COMITÊ DE PORTFÓLIO · FEG · período ${c.periodo.rotulo}`, `Gerada em ${fmt.data(hoje())}`, '');
    L.push(`Capacidade: ${resumoCap}`, `Proposta: ${proposta}`); if(cenTxt) L.push(cenTxt); L.push('');
    L.push('1. Para aprovar início (cabem na capacidade):'); para.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo} · valor ${fmt.n(i.s.valor)} · ${f1(i.p.esforcoFte)} FTE · ${intervalo(i.p.inicioPrevisto, i.p.fimPrevisto)}${i.status === 'fixado' ? ' · fixado pelo comitê' : ''}${obr(i)}`)); if(!para.length) L.push('   - nenhum');
    if(estouram.length){ L.push('', '1a. Fixados que estouram a capacidade (decisão necessária):'); estouram.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo} · ${f1(i.p.esforcoFte)} FTE · pico de ${f1(i.acumFte)} FTE em ${rotMes(i.picoMes)}${obr(i)}`)); }
    if(desloc.length){ L.push('', '1b. Obrigatórios fora da carteira por causa das fixações (decisão necessária):'); desloc.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo} · ${sitTxt(i)}${obr(i)}`)); }
    L.push('', '2. Aguardam capacidade (ordem de prioridade):'); aguardam.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo} · valor ${fmt.n(i.s.valor)} · ${f1(i.p.esforcoFte)} FTE · ${sitTxt(i)}${obr(i)}`)); if(!aguardam.length) L.push('   - nenhum');
    L.push('', `3. Fila de entrada: ${plural(fila.length, 'demanda aguardando', 'demandas aguardando')} checklist.`);
    L.push('', '4. Pontos de atenção:'); at.forEach(a => L.push('   - ' + a.txt)); if(!at.length) L.push('   - nenhum');
    const txt = L.join('\n');
    // documento (estilos em linha para colar no e-mail)
    const th = 'text-align:left;padding:7px 10px;background:#f1f6ea;color:#2e4f00;font-size:12px;border-bottom:1px solid #c6dca4', td = 'padding:7px 10px;border-bottom:1px solid #e4ebe6;vertical-align:top;font-size:13px';
    const tabela = (titulo, itens, colunas, vazio) => `<h4 style="margin:18px 0 6px;font-size:14px;color:#17302b">${esc(titulo)}</h4>${itens.length ? `<table style="border-collapse:collapse;width:100%"><thead><tr>${colunas.map(([n]) => `<th style="${th}">${esc(n)}</th>`).join('')}</tr></thead><tbody>${itens.map(i => `<tr>${colunas.map(([, fn]) => `<td style="${td}">${fn(i)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : `<p style="margin:0;color:#566b64;font-size:13px">${esc(vazio)}</p>`}`;
    const projCol = ['Projeto', i => `<b>${esc(i.p.codigo)}</b> · ${esc(i.p.titulo)}${i.p.obrigatorio ? ' <b style="color:#93461d">[OBRIGATÓRIO]</b>' : ''}`];
    const efv = c.efetiva || 1e-9, tot = Math.max(+cap.fte || 0, (+cap.fte || 0) * cap.reservaPct / 100 + c.pico.total, 1e-9), resv = (+cap.fte || 0) * cap.reservaPct / 100;
    const seg = (v, cor) => v > 0.001 ? `<td style="width:${v / tot * 100}%;height:10px;background:${cor};padding:0;font-size:1px;line-height:1px">&nbsp;</td>` : '';
    const exV = Math.min(c.pico.execucao, efv), caV = Math.min(c.pico.carteira, Math.max(0, efv - exV)), livre = Math.max(0, efv - c.pico.total), exc = Math.max(0, c.pico.total - efv);
    const medidor = `<table role="presentation" style="border-collapse:collapse;width:100%;margin:6px 0 4px"><tr>${seg(resv, '#b5cad3')}${seg(exV, '#254e47')}${seg(caV, '#3E6801')}${seg(livre, '#e4ebe6')}${seg(exc, '#b8642c')}</tr></table>
      <p style="margin:0;font-size:12px;color:#566b64">Reserva ${f1(resv)} · Em execução ${f1(c.pico.execucao)} · Nova carteira ${f1(c.pico.carteira)} · ${exc > 0 ? `<b style="color:#93461d">Excesso ${f1(exc)}</b>` : `Livre ${f1(livre)}`} FTE (mês de pico: ${esc(rotMes(c.pico.mes))})</p>`;
    const decisoes = [...estouram.map(i => Object.assign({ motivo:`Fixado que estoura: pico de ${f1(i.acumFte)} FTE em ${rotMes(i.picoMes)}` }, i)), ...desloc.map(i => Object.assign({ motivo:`Obrigatório fora por causa das fixações (${sitTxt(i)})` }, i)), ...semEst.map(i => Object.assign({ motivo:'Sem estimativa de pessoas: não entra na conta' }, i))];
    const doc = `<div style="font-family:'Segoe UI',Arial,sans-serif;color:#17302b;line-height:1.5;max-width:860px">
      <div style="border-bottom:2px solid #3E6801;padding-bottom:10px;margin-bottom:12px"><div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#566b64;font-weight:700">Comitê de portfólio · FEG</div>
        <div style="font-size:20px;font-weight:700;margin:2px 0">Pauta da carteira · ${esc(c.periodo.rotulo)}</div><div style="font-size:12.5px;color:#566b64">Gerada em ${fmt.data(hoje())} · ${esc(resumoCap)}</div></div>
      ${medidor}<p style="margin:10px 0 0;font-size:13.5px"><b>Proposta:</b> ${esc(proposta)}</p>${cenTxt ? `<p style="margin:6px 0 0;font-size:13px;color:#2f5f84"><b>Cenário em análise:</b> ${esc(cenTxt.replace(/^Cenário em análise \(não salvo\): /, ''))} Nada foi gravado.</p>` : ''}
      ${tabela('Para aprovar início', para, [['#', i => String(i.pos) + 'º'], projCol, ['Valor', i => fmt.n(i.s.valor)], ['FTE', i => f1(i.p.esforcoFte)], ['Período', i => esc(intervalo(i.p.inicioPrevisto, i.p.fimPrevisto))], ['Custo', i => fmt.mi(i.p.custo)]], 'Nenhum projeto cabe na capacidade atual.')}
      ${tabela('Aguardam capacidade', aguardam, [['#', i => String(i.pos) + 'º'], projCol, ['Valor', i => fmt.n(i.s.valor)], ['FTE', i => f1(i.p.esforcoFte)], ['Situação', i => esc(sitTxt(i))]], 'Nenhum aprovado aguarda capacidade.')}
      ${tabela('Decisões necessárias', decisoes, [projCol, ['Motivo', i => esc(i.motivo)]], 'Nenhuma decisão pendente sobre a capacidade.')}
      <h4 style="margin:18px 0 6px;font-size:14px">Fila de entrada e pontos de atenção</h4><ul style="margin:0;padding-left:18px;font-size:13px"><li>${esc(plural(fila.length, 'demanda aguardando', 'demandas aguardando'))} checklist de entrada.</li>${at.map(a => `<li>${esc(a.txt)}</li>`).join('')}</ul></div>`;
    const m = GP.modal(`<h3>Pauta do comitê</h3><p class="muted">Documento gerado a partir da carteira atual. Copie para o e-mail ou a ata.</p>
      <div class="pauta-abas" role="tablist" aria-label="Formato da pauta"><button type="button" role="tab" aria-selected="true" data-pauta-aba="doc">Documento</button><button type="button" role="tab" aria-selected="false" data-pauta-aba="txt">Texto</button></div>
      <div class="pauta-doc" data-pauta-painel="doc" role="tabpanel" tabindex="0" aria-label="Pauta formatada">${doc}</div>
      <div data-pauta-painel="txt" role="tabpanel" hidden><textarea class="input pauta-txt" readonly data-txt aria-label="Pauta em texto">${esc(txt)}</textarea></div>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Fechar</button><button class="btn btn-ghost" data-copiar>${icon('check', 16)} Copiar texto</button><button class="btn btn-primary" data-copiar-email>${icon('acervo', 16)} Copiar para e-mail</button></div>`, { largo:true });
    m.querySelectorAll('[data-pauta-aba]').forEach(b => b.onclick = () => { m.querySelectorAll('[data-pauta-aba]').forEach(x => x.setAttribute('aria-selected', String(x === b)));
      m.querySelectorAll('[data-pauta-painel]').forEach(x => { x.hidden = x.dataset.pautaPainel !== b.dataset.pautaAba; }); });
    const copiarTexto = async () => { try { await navigator.clipboard.writeText(txt); GP.toast('Pauta copiada como texto.'); } catch(e){ const ta = m.querySelector('[data-txt]'); m.querySelector('[data-pauta-aba="txt"]').click(); ta.select(); try { document.execCommand('copy'); GP.toast('Pauta copiada como texto.'); } catch(x){ GP.toast('Selecione o texto e copie com Ctrl+C.'); } } };
    m.querySelector('[data-copiar]').onclick = copiarTexto;
    m.querySelector('[data-copiar-email]').onclick = async () => {
      try {
        if(!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) throw new Error('sem ClipboardItem');
        await navigator.clipboard.write([new window.ClipboardItem({ 'text/html': new Blob([doc], { type:'text/html' }), 'text/plain': new Blob([txt], { type:'text/plain' }) })]);
        GP.toast('Pauta copiada. Cole no e-mail para manter as tabelas.');
      } catch(e){
        try { const painel = m.querySelector('[data-pauta-painel="doc"]'); if(painel.hidden) m.querySelector('[data-pauta-aba="doc"]').click();
          const r = document.createRange(); r.selectNodeContents(painel); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          const ok = document.execCommand('copy'); sel.removeAllRanges(); if(!ok) throw new Error('cópia recusada'); GP.toast('Pauta copiada. Cole no e-mail para manter as tabelas.'); }
        catch(x){ copiarTexto(); }
      }
    };
    const aba = m.querySelector('[data-pauta-aba="doc"]'); if(aba) aba.focus();
  }

  /* ------------------------------------------------------------- roadmap */
  const JANELA = 72;
  /** Situação de um projeto no roadmap, lida da carteira. cls define o desenho da barra. */
  function situacao(p, it){
    if(p.etapa === 'execucao') return { cls:'exec', nome:'Em execução', tom:'ok' };
    if(p.etapa === 'concluido') return { cls:'concl', nome:'Concluído', tom:'neutral' };
    if(p.etapa === 'espera') return { cls:'espera', nome:'Em espera', tom:'neutral' };
    if(p.etapa === 'aprovado'){
      if(!it) return { cls:'aprov', nome:'Aprovado · sem avaliação completa', tom:'neutral' };
      const s = it.status, fixado = s === 'fixado' || s === 'fixado_estoura';
      if(s === 'cabe' || s === 'fixado') return { cls:'cabe', nome: fixado ? 'Fixado pelo comitê · cabe na capacidade' : 'Aprovado · cabe na capacidade', tom:'ok', fixado };
      // fixado que estoura está NA carteira (soma no histograma); não é "aguarda capacidade"
      if(s === 'fixado_estoura') return { cls:'estoura', nome:'Fixado, mas estoura a capacidade', tom:'bad', fixado };
      if(fora(s)) return { cls:'fora', nome: s === 'cabe_a_partir' ? `Aguarda capacidade · cabe a partir de ${rotMes(it.aPartir)}` : s === 'obrigatorio_deslocado' ? 'Obrigatório fora pelas fixações' : 'Aguarda capacidade', tom: ST[s].tom, fora:true, fixado };
      if(s === 'excluido') return { cls:'excl', nome:'Excluído pelo comitê', tom:'neutral' };
      return { cls:'aprov', nome:`Aprovado · ${ST[s].nome.toLowerCase()}`, tom:'neutral' };
    }
    return { cls:'outro', nome: M.etapa(p.etapa).nome, tom:'neutral' };
  }
  const LEGENDA = { exec:'Em execução (parte escura = concluída)', cabe:'Aprovado e cabe', estoura:'Fixado, mas estoura a capacidade', fora:'Aguarda capacidade', aprov:'Aprovado sem avaliação', espera:'Em espera', excl:'Excluído pelo comitê', concl:'Concluído', outro:'Outras etapas' };
  function telaRoadmap(el, r){
    const S = GP.state(), mostrar = r.query.ver === 'todos' ? 'todos' : 'ativos', soCabe = r.query.cabe === '1';
    const c = carteira(), porId = {}; c.itens.forEach(i => { porId[i.p.id] = i; });
    const sitDe = {}; P.todos().forEach(p => { sitDe[p.id] = situacao(p, porId[p.id]); });
    let base = P.todos().filter(p => mostrar === 'todos' ? true : ['aprovado', 'execucao', 'espera'].includes(p.etapa));
    const ocultos = soCabe ? base.filter(p => sitDe[p.id].fora).length : 0;
    if(soCabe) base = base.filter(p => !sitDe[p.id].fora);
    const com = base.filter(p => p.inicioPrevisto && p.fimPrevisto).sort((a, b) => a.inicioPrevisto.localeCompare(b.inicioPrevisto) || a.codigo.localeCompare(b.codigo));
    const sem = base.filter(p => !(p.inicioPrevisto && p.fimPrevisto));
    const q = (ver, cabe) => `#/roadmap?ver=${ver}${cabe ? '&cabe=1' : ''}`;
    let html = U.pageHead({ titulo:'Roadmap', sub:'Quando cada projeto acontece e quantas pessoas ele ocupa por mês. Usa as datas previstas do cadastro e a situação da carteira.', acoes: GP.botaoPDF() }) +
      `<div class="rm-filtros" data-noprint><div class="chips">${[['ativos', 'Aprovados e em execução'], ['todos', 'Todos com datas']].map(([k, l]) => `<a class="chip ${mostrar === k ? 'on' : ''}" href="${q(k, soCabe)}" ${mostrar === k ? 'aria-current="true"' : ''}>${l}</a>`).join('')}</div>
        <a class="chip rm-so ${soCabe ? 'on' : ''}" href="${q(mostrar, !soCabe)}" aria-pressed="${soCabe}">${soCabe ? icon('check', 14) + ' ' : ''}Só o que cabe</a></div>`;
    if(!com.length){ el.innerHTML = html + U.vazio('Sem projetos com datas', 'Informe início e fim previstos no cadastro para ver o roadmap.', '<a class="btn btn-primary" href="#/acervo">Ir ao acervo</a>', 'roadmap') + semDatas(sem); return; }
    let ini = com.map(p => p.inicioPrevisto.slice(0, 7)).sort()[0], fim = com.map(p => p.fimPrevisto.slice(0, 7)).sort().at(-1);
    if(mesIdx(fim) - mesIdx(ini) + 1 > JANELA){ const h0 = Math.max(mesIdx(ini), Math.min(mesIdx(hoje().slice(0, 7)) - 12, mesIdx(fim) - JANELA + 1)); ini = deIdx(h0); fim = deIdx(h0 + JANELA - 1); }
    const n = mesIdx(fim) - mesIdx(ini) + 1;
    const visiveis = com.filter(p => !(p.fimPrevisto.slice(0, 7) < ini || p.inicioPrevisto.slice(0, 7) > fim));
    const cortados = com.filter(p => p.inicioPrevisto.slice(0, 7) < ini || p.fimPrevisto.slice(0, 7) > fim);
    // histograma: a mesma conta da carteira (execução + carteira selecionada), mês a mês; quem aguarda aparece hachurado por cima,
    // rotulado como "se começar como planejado" (outra pergunta). Sem "Só o que cabe", a parte hachurada some junto com as barras.
    const dm = M.demandaCarteira(P.todos(), c, ini, fim, JANELA), mostraAg = !soCabe, ag = x => mostraAg ? x.aguardando : 0;
    const pos = d => { const dia = +d.slice(8, 10) || 1; return (mesIdx(d) - mesIdx(ini) + (dia - 1) / 31) / n * 100; };
    const capMes = c.efetiva, maxDem = Math.max(0, ...dm.map(x => x.total + ag(x)));
    const tk = Math.max(capMes, maxDem) <= 6 ? 2 : Math.max(capMes, maxDem) <= 15 ? 5 : Math.max(capMes, maxDem) <= 40 ? 10 : 20;
    const maxF = Math.max(Math.ceil(Math.max(capMes, maxDem, 1) * 1.1 / tk) * tk, Math.max(capMes, maxDem, 1) * 1.1);
    const mesHoje = hoje().slice(0, 7), hojeIdx = mesHoje >= ini && mesHoje <= fim ? mesIdx(mesHoje) - mesIdx(ini) : null, hojePos = hojeIdx != null ? pos(hoje()) : null;
    const X = f => `calc(var(--lbl) + var(--gap) + (100% - var(--lbl) - var(--gap)) * ${(f / 100).toFixed(5)})`;
    const tt = (p, s) => `${p.codigo} · ${p.titulo}&#10;${fmt.data(p.inicioPrevisto)} a ${fmt.data(p.fimPrevisto)}&#10;${p.esforcoFte != null ? f1(p.esforcoFte) + ' FTE' : 'FTE não informado'}${p.etapa === 'execucao' && p.progresso != null ? ` · ${fmt.n(p.progresso)}% concluído` : ''}&#10;Situação: ${s.nome}`;
    const ttAttr = (p, s) => esc(tt(p, s)).replace(/&amp;#10;/g, '&#10;');
    // cabeçalho: anos com o span dos seus meses e meses (inicial abaixo de 30px por coluna)
    const anos = []; dm.forEach((x, i) => { const y = x.mes.slice(0, 4); if(!anos.length || anos[anos.length - 1].y !== y) anos.push({ y, i0:i, k:0 }); anos[anos.length - 1].k++; });
    const grade = dm.map((x, i) => i ? `<i class="${x.mes.endsWith('-01') ? 'ano' : ''}" style="left:${X(i / n * 100)}"></i>` : '').join('');
    const barra = p => { const s = sitDe[p.id], l = Math.max(0, pos(p.inicioPrevisto)), r0 = Math.min(100, pos(p.fimPrevisto) + 100 / n / 31), w = Math.max(1.2, r0 - l);
      const feito = s.cls === 'exec' && p.progresso != null ? `<i class="gb-feito" style="width:${Math.max(0, Math.min(100, p.progresso))}%"></i>` : '';
      const txt = s.cls === 'fora' ? `aguarda capacidade${p.esforcoFte != null ? ' · ' + f1(p.esforcoFte) + ' FTE' : ''}` : p.esforcoFte != null ? f1(p.esforcoFte) + ' FTE' : '';
      return `<span class="g-bar gb-${s.cls}" style="left:${l}%;width:${w}%" data-tt="${ttAttr(p, s)}">${feito}<span class="gb-t">${s.fixado ? svg(IC.pino, 11) : ''}${esc(txt)}</span></span>`; };
    const linhas = visiveis.map(p => `<a class="g-row rm-row" href="#/projeto/${esc(p.id)}"><div class="g-lbl" data-tt="${ttAttr(p, sitDe[p.id])}"><span class="code">${esc(p.codigo)}</span> ${esc(p.titulo)}</div><div class="g-track">${barra(p)}</div></a>`).join('');
    const vals = new Set(); const pk = dm.reduce((a, x, i) => x.total > dm[a].total + 1e-9 ? i : a, 0); if(dm[pk] && dm[pk].total > 0) vals.add(pk); dm.forEach((x, i) => { if(x.total > capMes + 1e-9) vals.add(i); });
    const difCap = v => v > capMes + 1e-9 ? `${f1(v - capMes)} acima da capacidade` : `${f1(capMes - v)} abaixo da capacidade`;
    const cols = dm.map((x, i) => { const over = x.total > capMes + 1e-9, a = ag(x), h = x.total / maxF * 100, ha = a / maxF * 100, agOver = x.total + a > capMes + 1e-9;
      const dica = `${rotMes(x.mes)}${x.noPeriodo ? '' : ' · fora do período da capacidade'}&#10;Execução + carteira selecionada: ${f1(x.total)} FTE (${difCap(x.total)})${a > 0 ? `&#10;Se os que aguardam começarem como planejado: ${f1(x.total + a)} FTE (${difCap(x.total + a)})` : ''}&#10;Capacidade efetiva: ${f1(capMes)} FTE`;
      return `<span class="g-col ${over ? 'over' : ''}" style="left:${i / n * 100}%;width:${100 / n}%" data-tt="${dica}">${a > 0 ? `<i class="ag${agOver ? ' ag-over' : ''}" style="height:${ha}%"></i>` : ''}<i class="b" style="height:${h}%"></i>${vals.has(i) ? `<b style="bottom:${h + ha}%">${f1(x.total)}</b>` : ''}</span>`; }).join('');
    // faixa do período da capacidade (onde a carteira é decidida)
    const pi = dm.findIndex(x => x.noPeriodo), pf = dm.length - 1 - [...dm].reverse().findIndex(x => x.noPeriodo);
    const faixaPer = pi >= 0 ? `<i class="rm-per" style="left:${pi / n * 100}%;width:${(pf - pi + 1) / n * 100}%" data-tt="Período da capacidade: ${esc(c.periodo.rotulo)}"></i>` : '';
    const ticks = []; for(let t = 0; t <= maxF * 0.92; t += tk) ticks.push(t);
    const capPct = capMes / maxF * 100;
    // meses acima da capacidade agrupados em faixas
    const agrupar = v => { const fx = []; dm.forEach((x, i) => { const y = v(x); if(y > capMes + 1e-9){ const u = fx[fx.length - 1]; if(u && u.b === i - 1){ u.b = i; u.max = Math.max(u.max, y); } else fx.push({ a:i, b:i, max:y }); } }); return fx; };
    const faixas = agrupar(x => x.total), faixasAg = mostraAg ? agrupar(x => x.aguardando > 0 ? x.total + x.aguardando : 0) : [];
    const faixaTxt = f => `${intervalo(dm[f.a].mes, dm[f.b].mes)} (pico ${f1(f.max)} FTE)`;
    const notaAg = faixasAg.length ? `<p class="rm-lista-dem rm-dem-ag">${icon('info', 15)} <span><b>Se os que aguardam capacidade começarem como planejado</b> (barras hachuradas, fora da carteira): ${faixasAg.map(faixaTxt).join('; ')} passaria da capacidade.</span></p>` : '';
    const notas = [!c.descontarExecucao ? 'A carteira não desconta as pessoas em execução (premissa da carteira), então o histograma também não as soma.' : '',
      c.semDatas.length ? `${plural(c.semDatas.length, 'projeto sem datas entra', 'projetos sem datas entram')} na conta ocupando o período inteiro (${c.semDatas.map(p => esc(p.codigo)).join(', ')}).` : ''].filter(Boolean);
    const temAg = dm.some(x => ag(x) > 0), presentes = [...new Set(visiveis.map(p => sitDe[p.id].cls))], ordemLeg = ['exec', 'cabe', 'estoura', 'fora', 'aprov', 'espera', 'excl', 'concl', 'outro'];
    html += `<div class="card rm-card">
      <div class="rm-gantt"><div class="rm-scroll-box"><div class="gantt-wrap rm-scroll" data-rm-scroll><div class="gantt rm-g" style="min-width:calc(var(--lbl) + var(--gap) + ${n * 40}px)">
        <div class="rm-grade" aria-hidden="true">${grade}</div>
        <div class="g-head rm-head"><div class="g-lbl"><span class="dim">Projeto</span></div><div class="g-track rm-anos">${anos.map(a => `<span class="${a.i0 ? 'vira' : ''}" style="left:${a.i0 / n * 100}%;width:${a.k / n * 100}%"><b class="rm-ano-t">${a.y}</b></span>`).join('')}</div></div>
        <div class="g-head rm-head rm-head2"><div class="g-lbl"></div><div class="g-track rm-meses">${dm.map((x, i) => `<span class="${x.mes.endsWith('-01') && i ? 'vira' : ''} ${x.mes === mesHoje ? 'hoje' : ''}" style="left:${i / n * 100}%;width:${100 / n}%"><span class="mf">${MESES[+x.mes.slice(5) - 1]}</span><span class="mi" aria-hidden="true">${MESES[+x.mes.slice(5) - 1][0].toUpperCase()}</span></span>`).join('')}</div></div>
        ${linhas}
        <div class="g-row g-dem rm-dem"><div class="g-lbl rm-dem-lbl"><b>Pessoas por mês</b><span class="dim">execução + carteira selecionada · capacidade ${f1(capMes)} FTE</span><span class="rm-ticks" aria-hidden="true">${ticks.map(t => `<i style="bottom:${t / maxF * 100}%">${fmt.n(t)}</i>`).join('')}</span></div>
          <div class="g-track rm-dem-track" role="img" aria-label="Pessoas por mês, execução mais carteira selecionada: ${esc(dm.map(x => `${rotMes(x.mes)} ${f1(x.total)}${ag(x) > 0 ? ` (${f1(x.total + ag(x))} se os que aguardam começarem como planejado)` : ''}`).join(', '))}. Capacidade ${f1(capMes)} FTE.">
            ${faixaPer}<i class="rm-acima" style="bottom:${capPct}%"></i>${ticks.map(t => `<i class="rm-tick" style="bottom:${t / maxF * 100}%"></i>`).join('')}
            ${cols}<i class="g-cap" style="bottom:${capPct}%"><span>${f1(capMes)} FTE</span></i></div></div>
        ${hojePos != null ? `<i class="rm-hoje" style="left:${X(hojePos)}" aria-hidden="true"><b>Hoje</b></i>` : ''}
      </div></div></div><p class="rm-dica" aria-hidden="true">arraste para ver mais →</p></div>
      <div class="rm-lista">${visiveis.map(p => { const s = sitDe[p.id], l = Math.max(0, pos(p.inicioPrevisto)), w = Math.max(2, Math.min(100, pos(p.fimPrevisto) + 100 / n / 31) - l);
        return `<a class="rm-item" href="#/projeto/${esc(p.id)}"><div class="rm-item-t"><span class="code">${esc(p.codigo)}</span> <b>${esc(p.titulo)}</b></div>
          <div class="rm-item-m"><span>${esc(intervalo(p.inicioPrevisto, p.fimPrevisto))}</span><span>${p.esforcoFte != null ? f1(p.esforcoFte) + ' FTE' : 'FTE não informado'}</span>${U.pill(s.fixado ? s.nome.replace(/^Fixado pelo comitê · /, 'Fixado · ') : s.nome, s.tom)}</div>
          <div class="rm-mini" aria-hidden="true"><i class="rm-mb gb-${s.cls}" style="left:${l}%;width:${w}%"></i>${hojePos != null ? `<i class="rm-mini-hoje" style="left:${hojePos}%"></i>` : ''}</div></a>`; }).join('')}
        </div>
      <p class="rm-lista-dem ${faixas.length ? 'acima' : ''}">${faixas.length ? `${icon('alerta', 15)} <span><b>Execução + carteira selecionada acima da capacidade (${f1(capMes)} FTE):</b> ${faixas.map(faixaTxt).join('; ')}.</span>` : `${icon('check', 15)} <span>Execução + carteira selecionada dentro da capacidade (${f1(capMes)} FTE) em todos os meses.</span>`}</p>${notaAg}
      ${notas.map(t => `<p class="rm-nota">${t}</p>`).join('')}
      ${cortados.length ? `<p class="rm-nota">Mostrando ${n} meses (${esc(rotMes(ini))} a ${esc(rotMes(fim))}). ${plural(cortados.length, 'projeto passa', 'projetos passam')} dessa janela e ${cortados.length === 1 ? 'aparece cortado' : 'aparecem cortados'}: ${cortados.map(p => `${esc(p.codigo)} (${esc(intervalo(p.inicioPrevisto, p.fimPrevisto))})`).join(', ')}.</p>` : ''}
      ${soCabe && ocultos ? `<p class="rm-nota">${plural(ocultos, 'projeto que aguarda', 'projetos que aguardam')} capacidade ${ocultos === 1 ? 'está oculto' : 'estão ocultos'}. <a class="link" href="${q(mostrar, false)}">Mostrar todos</a></p>` : ''}
      <div class="legend rm-leg">${ordemLeg.filter(k => presentes.includes(k)).map(k => `<span><i class="rm-sw gb-${k}">${k === 'exec' ? '<i class="gb-feito" style="width:50%"></i>' : ''}</i>${LEGENDA[k]}${k === 'fora' && temAg ? ' (no histograma: se começar como planejado)' : ''}</span>`).join('')}${visiveis.some(p => sitDe[p.id].fixado) ? `<span>${svg(IC.pino, 13)} Fixado pelo comitê</span>` : ''}${temAg && !presentes.includes('fora') ? '<span><i class="rm-sw rm-sw-ag"></i>Aguarda capacidade, se começar como planejado</span>' : ''}<span><i class="rm-sw rm-sw-over"></i>Carteira acima da capacidade</span>${pi >= 0 ? `<span><i class="rm-sw rm-sw-per"></i>Período da capacidade (${esc(c.periodo.rotulo)})</span>` : ''}${hojePos != null ? '<span><i class="rm-sw rm-sw-hoje"></i>Hoje</span>' : ''}</div></div>`;
    html += semDatas(sem);
    el.innerHTML = html;
    // rolagem: começa 2 meses antes de hoje, máscara na borda direita enquanto houver conteúdo à direita
    const sc = el.querySelector('[data-rm-scroll]'), box = el.querySelector('.rm-gantt'); if(!sc || !box) return;
    const g = sc.querySelector('.rm-g'), lbl = g.querySelector('.g-lbl'), lblW = lbl ? lbl.getBoundingClientRect().width + 12 : 0, trackW = g.scrollWidth - lblW;
    if(trackW > 0 && trackW / n < 30) g.classList.add('rm-ini');
    if(hojeIdx != null && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = Math.max(0, (hojeIdx - 2) / n * trackW);
    const marcar = () => box.classList.toggle('mais', sc.scrollWidth - sc.clientWidth - sc.scrollLeft > 4);
    sc.addEventListener('scroll', marcar, { passive:true }); marcar();
  }
  const semDatas = sem => sem.length ? `<div class="card rm-sem">${U.secH(`Sem datas previstas (${sem.length})`, 'Informe início e fim no cadastro para que apareçam no roadmap.')}<div class="chips">${sem.map(p => `<a class="chip" href="#/novo/${esc(p.id)}" title="${esc(p.codigo)} · ${esc(p.titulo)}">${esc(p.codigo)} · ${esc(p.titulo)}</a>`).join('')}</div></div>` : '';

  /* ----------------------------------------- resumo de capacidade (painel nível 3) */
  /** Cartão de vidro com o medidor compacto, a demanda de 12 meses contra a capacidade e o alerta de pico. O pacote do painel o insere no nível 3. */
  GP.capacidadeResumo = () => {
    // mesma fonte da Carteira (montarCarteira): a pergunta principal é "a carteira selecionada cabe?"; a demanda de quem aguarda
    // aparece separada, rotulada como "se começar como planejado".
    const S = GP.state(), cap = S.capacidade, c = carteira();
    const ate = deIdx(Math.min(mesIdx(c.periodo.fim), mesIdx(c.periodo.ini) + 11));
    const dm = M.demandaCarteira(P.todos(), c, c.periodo.ini, ate, 12), capMes = c.efetiva, max = Math.max(capMes, ...dm.map(x => x.planejada), 1) * 1.12;
    const W = 240, H = 56, bw = W / dm.length, y = v => H - v / max * H;
    const coluna = (xx, w, y0, h, r) => `M${xx.toFixed(1)} ${(y0 + h).toFixed(1)}V${(y0 + r).toFixed(1)}Q${xx.toFixed(1)} ${y0.toFixed(1)} ${(xx + r).toFixed(1)} ${y0.toFixed(1)}H${(xx + w - r).toFixed(1)}Q${(xx + w).toFixed(1)} ${y0.toFixed(1)} ${(xx + w).toFixed(1)} ${(y0 + r).toFixed(1)}V${(y0 + h).toFixed(1)}Z`;
    const barras = dm.map((x, i) => { const h = x.total / max * H, ha = x.aguardando / max * H, over = x.total > capMes + 1e-9, w = Math.min(14, bw - 4), xx = i * bw + (bw - w) / 2;
      const dica = `${rotMes(x.mes)}&#10;Execução + carteira selecionada: ${f1(x.total)} FTE${x.aguardando > 0 ? `&#10;Se os que aguardam começarem como planejado: ${f1(x.planejada)} FTE` : ''}&#10;Capacidade: ${f1(capMes)} FTE`;
      return (ha > 0 ? `<path d="${coluna(xx, w, H - h - ha, ha, h > 0 ? 0 : Math.min(3, ha, w / 2))}" fill="#fbeee6" stroke="#b8642c" stroke-width="1" stroke-dasharray="2 2" data-tt="${dica}"/>` : '')
        + (h > 0 ? `<path d="${coluna(xx, w, H - h, h, ha > 0 ? 0 : Math.min(3, h, w / 2))}" fill="${over ? '#b8642c' : '#6b8f2a'}" data-tt="${dica}"/>` : ''); }).join('');
    const acima = c.sobraFte < -0.05, agOver = c.picoPlanejado.total > capMes + 1e-9 && c.picoPlanejado.total > c.pico.total + 1e-9;
    const aguardam = c.itens.filter(i => ['nao_cabe', 'cabe_a_partir', 'obrigatorio_deslocado'].includes(i.status));
    const quem = aguardam.length === 1 ? `o ${esc(aguardam[0].p.codigo)}, que aguarda capacidade,` : `os ${aguardam.length} que aguardam capacidade`;
    const principal = c.pico.total > 0
      ? (acima ? `A carteira selecionada passa da capacidade: pico de <b>${f1(c.pico.total)} FTE</b> em ${esc(rotMes(c.pico.mes))}, ${f1(-c.sobraFte)} acima de ${f1(capMes)} FTE${c.estouram ? ` (${plural(c.estouram, 'fixado estoura', 'fixados estouram')})` : ''}.`
        : `A carteira selecionada cabe: pico de <b>${f1(c.pico.total)} de ${f1(capMes)} FTE</b> em ${esc(rotMes(c.pico.mes))}.`)
      : 'Sem demanda de pessoas no período.';
    const hipotese = agOver && aguardam.length ? `<p class="cap-resumo-alerta cap-resumo-se">${icon('info', 15)} <span>Se ${quem} começar${aguardam.length === 1 ? '' : 'em'} como planejado, ${esc(rotMes(c.picoPlanejado.mes))} chegaria a ${f1(c.picoPlanejado.total)} FTE (barras tracejadas).</span></p>` : '';
    const rot = (m, a) => `<span${a ? ' class="fim"' : ''}>${esc(rotMes(m))}</span>`;
    const cabemTxt = `${c.cabem} de ${c.candidatos} aprovados cabem na carteira${c.estouram ? ` · ${plural(c.estouram, 'fixado estoura', 'fixados estouram')}` : ''}.`;
    return `<section class="card cap-resumo" aria-label="Capacidade do período">
      ${U.secH(`Capacidade · ${esc(c.periodo.rotulo)}`, cabemTxt, '<a class="link" href="#/carteira">Carteira →</a>')}
      ${graficoCapacidade(dadosGrafico(c, cap, { compacto:true, orcamento:null }))}
      <div class="cap-resumo-dem"><span class="dim">Pessoas por mês: execução + carteira selecionada${dm.some(x => x.aguardando > 0) ? ' · tracejado: quem aguarda' : ''}</span>
        <svg class="cap-spark" viewBox="0 0 ${W} ${H + 2}" role="img" aria-label="Execução mais carteira selecionada por mês: ${esc(dm.map(x => `${rotMes(x.mes)} ${f1(x.total)}`).join(', '))}; capacidade ${f1(capMes)} FTE">
          <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="#dfe7e2"/>${barras}<line x1="0" y1="${y(capMes).toFixed(1)}" x2="${W}" y2="${y(capMes).toFixed(1)}" stroke="#254e47" stroke-width="1.2" stroke-dasharray="4 3"/></svg>
        <div class="cap-spark-x" aria-hidden="true">${rot(dm[0] ? dm[0].mes : c.periodo.ini)}${rot(dm.length ? dm[dm.length - 1].mes : ate, true)}</div></div>
      <p class="cap-resumo-alerta ${acima ? 'acima' : ''}">${icon(acima ? 'alerta' : 'check', 15)} <span>${principal} <a class="link" href="#/roadmap">Ver roadmap →</a></span></p>${hipotese}
    </section>`;
  };

  /* ------------------------------------- atalho na tela Entrada e triagem (nível 3) */
  GP.painelBlocos.push({ nivel:3, ordem:10, render: () => { const c = carteira();
    return `<div class="cap-atalho"><span class="cap-atalho-ic">${icon('carteira', 18)}</span><div><b>Capacidade · ${esc(c.periodo.rotulo)}</b><p class="muted">${plural(c.cabem, 'aprovado cabe', 'aprovados cabem')} de ${c.candidatos} na carteira do período.</p></div><a class="link" href="#/carteira">Ver capacidade →</a></div>`; } });

  GP.tela({ id:'carteira', nivel:3, ordem:20, titulo:'Carteira e capacidade', icone:'carteira', render: telaCarteira });
  GP.tela({ id:'roadmap', nivel:3, ordem:21, titulo:'Roadmap', icone:'roadmap', render: telaRoadmap });
})();
