/* =========================================================================
   Nível 3 - Carteira e capacidade (o que cabe) e Roadmap (quando acontece)
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt, hoje } = GP.util, icon = GP.icon;
  const f1 = v => fmt.n(v, 1);
  const st = s => U.pill(M.STATUS_CARTEIRA[s].nome, M.STATUS_CARTEIRA[s].tom);
  const carteira = () => { const S = GP.state(); return M.montarCarteira(P.todos(), S.capacidade, S.forcar); };

  /* -------------------------------------------------- carteira e capacidade */
  function telaCarteira(el){
    const S = GP.state(), cap = S.capacidade, c = carteira();
    const pctUso = c.livre > 0 ? Math.min(1, c.usadoFte / c.livre) : (c.usadoFte > 0 ? 1 : 0);
    el.innerHTML = U.pageHead({ titulo:'Carteira e capacidade', sub:'Informe quantas pessoas e quanto orçamento existem. O sistema percorre o ranking e mostra o que cabe. O comitê pode fixar ou excluir projetos.',
        acoes:`${GP.botaoPDF()}<button class="btn btn-ghost" data-pauta>${icon('acervo', 16)} Pauta do comitê</button>` }) +
      `<div class="grid cap-grid">
        <div class="card stack" style="gap:12px">${U.secH('Capacidade do período')}
          <label class="field">Período<input class="input" data-cap="periodo" value="${esc(cap.periodo)}" maxlength="20"></label>
          <label class="field">Pessoas disponíveis (FTE)<small>Total da equipe dedicada a projetos</small><input class="input" inputmode="decimal" data-cap="fte" data-num="1" value="${esc(fmt.campo(cap.fte))}"></label>
          <label class="field">Reserva (%)<small>Para sustentação, demandas urgentes e imprevistos (0 a 60)</small><input class="input" inputmode="decimal" data-cap="reservaPct" data-num="1" value="${esc(fmt.campo(cap.reservaPct))}"></label>
          <label class="field">Orçamento para novos projetos (R$)<small>Ex.: 4.000.000. Use 0 para não limitar por orçamento</small><input class="input" inputmode="decimal" data-cap="orcamento" data-num="1" value="${esc(fmt.n(cap.orcamento))}"></label>
          <label class="check-row"><input type="checkbox" data-cap="descontarExecucao" ${cap.descontarExecucao ? 'checked' : ''}><span>Descontar pessoas já alocadas em projetos em execução</span></label>
          <button class="btn btn-ghost btn-sm" data-cap-padrao>Restaurar valores sugeridos</button>
        </div>
        <div class="stack">
          <div class="grid g4">
            ${U.kpi({ rotulo:'Pessoas para novos projetos', valor:f1(c.livre), unidade:'FTE', sub:`${f1(cap.fte)} − ${fmt.n(cap.reservaPct)}% reserva − ${f1(c.comprometido)} em execução` })}
            ${U.kpi({ rotulo:'Usadas pela carteira', valor:f1(c.usadoFte), unidade:'FTE', sub:`sobram ${f1(c.sobraFte)} FTE`, cor: c.sobraFte < 0 ? 'var(--bad)' : 'var(--green)' })}
            ${U.kpi({ rotulo:'Orçamento usado', valor: fmt.n(c.usadoCusto / 1e6, 2), unidade:'R$ mi', sub: c.orcamento ? `de ${fmt.mi(c.orcamento)}` : 'sem limite de orçamento' })}
            ${U.kpi({ rotulo:'Projetos que cabem', valor:`${c.cabem}<small>/ ${c.candidatos}</small>`, sub:'aprovados e avaliados' })}
          </div>
          <div class="card">${U.secH('Uso da capacidade')}<div class="bar" style="height:14px"><i style="width:${pctUso * 100}%;background:${c.sobraFte < 0 ? 'var(--bad)' : 'var(--green)'}"></i></div>
            <div class="row" style="justify-content:space-between;font-size:12.5px;margin-top:6px" class="muted"><span>${fmt.pct(c.livre > 0 ? c.usadoFte / c.livre : 0)} das pessoas disponíveis</span><span>${f1(c.usadoFte)} de ${f1(c.livre)} FTE</span></div></div>
          ${c.excesso > 0 ? U.callout(`<p><b>Atenção:</b> os projetos em execução já ocupam ${f1(c.comprometido)} FTE, ${f1(c.excesso)} a mais do que a capacidade disponível (${f1(c.efetiva)} FTE após a reserva). Não há espaço para novos projetos.</p>`, 'warn') : ''}
          ${U.callout('<p>Ordem: projetos <b>fixados pelo comitê</b> → ranking de prioridade (obrigatórios primeiro). Um projeto que não cabe é pulado e o próximo é testado. Projetos sem estimativa de pessoas não entram na conta.</p>')}
        </div></div>
      <div style="margin-top:16px">${c.itens.length ? U.table({ cols:[
          { key:'pos', label:'#', fmt:v => `<b>${v}</b>` },
          { key:'p', label:'Projeto', fmt:v => `<span class="code">${esc(v.codigo)}</span> · <b style="font-weight:600">${esc(v.titulo)}</b>${v.obrigatorio ? ' <span class="tag">obrigatório</span>' : ''}<small>${esc(v.gerencia)} · ${esc(v.tipo)}</small>` },
          { key:'s', label:'Valor', align:'c', fmt:v => GP.notaHtml(v.valor) },
          { key:'fte', label:'FTE', align:'r', fmt:(v, r) => r.p.esforcoFte != null ? f1(r.p.esforcoFte) : '-' },
          { key:'custo', label:'Custo', align:'r', fmt:(v, r) => `<span style="white-space:nowrap">${fmt.mi(r.p.custo)}</span>` },
          { key:'status', label:'Situação', fmt:(v, r) => st(v) + (r.falta ? `<small>faltam ${r.falta.tipo === 'FTE' ? f1(r.falta.valor) + ' FTE' : fmt.mi(r.falta.valor)}</small>` : '') },
          { key:'acao', label:'Decisão do comitê', fmt:(v, r) => `<select class="select" style="width:auto;padding:6px 8px;font-size:13px" data-forcar="${r.p.id}" aria-label="Decisão para ${esc(r.p.codigo)}">
              <option value="" ${!S.forcar[r.p.id] ? 'selected' : ''}>Automático</option><option value="in" ${S.forcar[r.p.id] === 'in' ? 'selected' : ''}>Fixar na carteira</option><option value="out" ${S.forcar[r.p.id] === 'out' ? 'selected' : ''}>Excluir</option></select>` },
        ], rows: c.itens.map(i => Object.assign({}, i, { fte:'', custo:'', acao:'' })) })
        : U.vazio('Sem candidatos', 'A carteira usa os projetos aprovados com avaliação de prioridade completa.', '<a class="btn btn-primary" href="#/avaliar">Avaliar projetos</a>')}
      ${c.semNota.length ? `<p class="dim" style="font-size:12.5px">${c.semNota.length} aprovado(s) sem avaliação completa não entram na conta: ${c.semNota.map(p => `<a class="link" href="#/avaliar/${p.id}">${esc(p.codigo)}</a>`).join(', ')}.</p>` : ''}</div>`;
    el.querySelectorAll('[data-cap]').forEach(i => i.addEventListener('change', () => {
      const k = i.dataset.cap;
      if(i.type === 'checkbox') cap[k] = i.checked;
      else if(i.dataset.num){ const n = GP.util.numBR(i.value); if(n === '' || isNaN(n) || n < 0){ GP.toast('Valor não reconhecido. Use números como 10 ou 1,5.'); i.value = k === 'orcamento' ? fmt.n(cap[k]) : fmt.campo(cap[k]); return; } cap[k] = k === 'reservaPct' ? Math.min(60, n) : n; }
      else cap[k] = i.value.slice(0, 20);
      S.meta.capacidadeConfirmada = true; GP.save(); const foco = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.cap : null; GP.refresh();
      const alvo = document.querySelector(`[data-cap="${foco || k}"]`); if(alvo) alvo.focus(); }));
    el.querySelectorAll('[data-forcar]').forEach(s => s.addEventListener('change', () => { if(s.value) S.forcar[s.dataset.forcar] = s.value; else delete S.forcar[s.dataset.forcar]; GP.save(); GP.refresh(); const a = document.querySelector(`[data-forcar="${s.dataset.forcar}"]`); if(a) a.focus(); }));
    el.querySelector('[data-cap-padrao]').onclick = () => { S.capacidade = Object.assign({}, M.CAPACIDADE_PADRAO); S.meta.capacidadeConfirmada = false; GP.save(); GP.refresh(); };
    el.querySelector('[data-pauta]').onclick = () => pauta(c);
  }
  /** Pauta do comitê: texto pronto para copiar */
  function pauta(c){
    const S = GP.state(), linhas = [];
    linhas.push(`PAUTA DO COMITÊ DE PORTFÓLIO · FEG · período ${S.capacidade.periodo}`, '');
    linhas.push(`Capacidade: ${f1(S.capacidade.fte)} FTE, reserva de ${S.capacidade.reservaPct}%, ${f1(c.comprometido)} FTE em execução → ${f1(c.livre)} FTE para novos projetos.`);
    linhas.push(`Proposta: ${c.cabem} projeto(s) cabem, usando ${f1(c.usadoFte)} FTE e ${fmt.mi(c.usadoCusto)}.`, '');
    linhas.push('1. Para aprovar início (cabem na capacidade):'); c.dentro.forEach(i => linhas.push(`   - ${i.p.codigo} · ${i.p.titulo} · valor ${fmt.n(i.s.valor)} · ${f1(i.p.esforcoFte)} FTE${i.status === 'fixado_estoura' ? ' · ATENÇÃO: estoura a capacidade' : ''}`));
    const fora = c.itens.filter(i => i.status === 'nao_cabe'); linhas.push('', '2. Aguardam capacidade (ordem de prioridade):'); fora.forEach(i => linhas.push(`   - ${i.p.codigo} · ${i.p.titulo} · valor ${fmt.n(i.s.valor)} · ${f1(i.p.esforcoFte)} FTE`)); if(!fora.length) linhas.push('   - nenhum');
    const fila = P.todos().filter(p => p.etapa === 'entrada' || p.etapa === 'triagem'); linhas.push('', `3. Fila de entrada: ${fila.length} demanda(s) aguardando checklist.`);
    const at = GP.painelAtencao(3); linhas.push('', '4. Pontos de atenção:'); at.forEach(a => linhas.push('   - ' + a.txt)); if(!at.length) linhas.push('   - nenhum');
    const txt = linhas.join('\n');
    const m = GP.modal(`<h3>Pauta do comitê</h3><p class="muted" style="margin:0 0 10px">Gerada a partir da carteira atual. Copie e cole no e-mail ou na ata.</p>
      <textarea class="input" style="min-height:320px;font-family:ui-monospace,Menlo,monospace;font-size:12.5px" readonly data-txt>${esc(txt)}</textarea>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Fechar</button><button class="btn btn-primary" data-copiar>${icon('check', 16)} Copiar texto</button></div>`, {largo:true});
    m.querySelector('[data-copiar]').onclick = async () => { const ta = m.querySelector('[data-txt]'); ta.select();
      try { await navigator.clipboard.writeText(txt); GP.toast('Pauta copiada.'); } catch(e){ try { document.execCommand('copy'); GP.toast('Pauta copiada.'); } catch(x){ GP.toast('Selecione o texto e copie com Ctrl+C.'); } } };
  }

  /* ------------------------------------------------------------- roadmap */
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function telaRoadmap(el, r){
    const S = GP.state(), mostrar = r.query.ver || 'ativos';
    const base = P.todos().filter(p => mostrar === 'todos' ? true : ['aprovado', 'execucao', 'espera'].includes(p.etapa));
    const com = base.filter(p => p.inicioPrevisto && p.fimPrevisto).sort((a, b) => a.inicioPrevisto.localeCompare(b.inicioPrevisto));
    const sem = base.filter(p => !(p.inicioPrevisto && p.fimPrevisto));
    let html = U.pageHead({ titulo:'Roadmap', sub:'Quando cada projeto acontece e quantas pessoas ele ocupa por mês. Use as datas previstas do cadastro.', acoes: GP.botaoPDF() }) +
      `<div class="chips" style="margin-bottom:14px">${[['ativos', 'Aprovados e em execução'], ['todos', 'Todos com datas']].map(([k, l]) => `<a class="chip ${mostrar === k ? 'on' : ''}" href="#/roadmap?ver=${k}">${l}</a>`).join('')}</div>`;
    if(!com.length){ el.innerHTML = html + U.vazio('Sem projetos com datas', 'Informe início e fim previstos no cadastro para ver o roadmap.', '<a class="btn btn-primary" href="#/acervo">Ir ao acervo</a>'); return; }
    let ini = com.map(p => p.inicioPrevisto.slice(0, 7)).sort()[0], fim = com.map(p => p.fimPrevisto.slice(0, 7)).sort().at(-1);
    const mesIdx = s => +s.slice(0, 4) * 12 + (+s.slice(5, 7) - 1), deIdx = i => `${Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`;
    const JANELA = 72; let cortado = false;
    if(mesIdx(fim) - mesIdx(ini) + 1 > JANELA){ cortado = true; const h0 = Math.max(mesIdx(ini), Math.min(mesIdx(hoje().slice(0, 7)) - 12, mesIdx(fim) - JANELA + 1)); ini = deIdx(h0); fim = deIdx(h0 + JANELA - 1); }
    const dm = M.demandaMensal(com.filter(p => p.etapa !== 'concluido' && p.etapa !== 'cancelado' && p.etapa !== 'nao_entra'), ini, fim), n = dm.length;
    const pos = d => { const [y, m] = d.slice(0, 7).split('-').map(Number), [y0, m0] = ini.split('-').map(Number); const dia = +d.slice(8, 10) || 1; return ((y - y0) * 12 + (m - m0) + (dia - 1) / 31) / n * 100; };
    const capMes = +S.capacidade.fte * (1 - S.capacidade.reservaPct / 100), maxF = Math.max(capMes, ...dm.map(x => x.fte), 1);
    const hojePos = hoje().slice(0, 7) >= ini && hoje().slice(0, 7) <= fim ? pos(hoje()) : null;
    html += `<div class="card"><div class="gantt-wrap"><div class="gantt" style="min-width:${150 + n * 34}px">
        <div class="g-head"><div class="g-lbl"></div><div class="g-track">${dm.map((x, i) => `<span style="left:${i / n * 100}%;width:${100 / n}%">${MESES[+x.mes.slice(5) - 1]}${x.mes.endsWith('-01') || i === 0 ? `<b>${x.mes.slice(0, 4)}</b>` : ''}</span>`).join('')}</div></div>
        ${com.map(p => { const e = M.etapa(p.etapa), l0 = pos(p.inicioPrevisto), r0 = pos(p.fimPrevisto) + 100 / n / 31, l = Math.max(0, l0), w = Math.max(1.5, Math.min(100, r0) - l);
          if(p.fimPrevisto.slice(0, 7) < ini || p.inicioPrevisto.slice(0, 7) > fim) return '';
          return `<a class="g-row" href="#/projeto/${p.id}"><div class="g-lbl"><span class="code">${esc(p.codigo)}</span> ${esc(p.titulo)}</div><div class="g-track">${hojePos != null ? `<i class="g-hoje" style="left:${hojePos}%"></i>` : ''}<span class="g-bar t-${e.tom}" style="left:${l}%;width:${w}%" title="${esc(p.codigo)} · ${fmt.data(p.inicioPrevisto)} a ${fmt.data(p.fimPrevisto)} · ${esc(e.nome)}">${p.esforcoFte != null ? f1(p.esforcoFte) + ' FTE' : ''}</span></div></a>`; }).join('')}
        <div class="g-row g-dem"><div class="g-lbl"><b>Pessoas por mês</b><br><span class="dim" style="font-size:11.5px">linha = capacidade (${f1(capMes)} FTE)</span></div><div class="g-track" style="height:70px">
          <i class="g-cap" style="bottom:${capMes / maxF * 100}%"></i>${dm.map((x, i) => `<span class="g-col ${x.fte > capMes + 1e-9 ? 'over' : ''}" style="left:${i / n * 100 + 0.4}%;width:${100 / n - 0.8}%;height:${x.fte / maxF * 100}%" title="${x.mes}: ${f1(x.fte)} FTE"></span>`).join('')}</div></div>
      </div></div>
      ${cortado ? `<p class="dim" style="font-size:12.5px;margin:8px 0 0">Mostrando ${JANELA} meses (${esc(ini)} a ${esc(fim)}). Projetos fora dessa janela não aparecem; confira datas muito distantes no cadastro.</p>` : ''}
      <div class="legend" style="margin-top:10px"><span><i style="background:var(--ok-bg);border:1px solid var(--ok)"></i>Aprovado / em execução</span><span><i style="background:var(--neutral-bg);border:1px solid var(--muted)"></i>Em espera / concluído</span><span><i style="background:var(--bad)"></i>Mês acima da capacidade</span>${hojePos != null ? '<span><i style="background:var(--green)"></i>Hoje</span>' : ''}</div></div>`;
    if(sem.length) html += `<div class="card" style="margin-top:16px">${U.secH(`Sem datas previstas (${sem.length})`, 'Informe início e fim no cadastro para que apareçam no roadmap.')}<div class="chips">${sem.map(p => `<a class="chip" href="#/novo/${p.id}">${esc(p.codigo)} · ${esc(p.titulo.slice(0, 50))}${p.titulo.length > 50 ? '…' : ''}</a>`).join('')}</div></div>`;
    el.innerHTML = html;
  }

  /* ------------------------------------------------ bloco no painel (nível 3) */
  GP.painelBlocos.push({ nivel:3, ordem:10, render: () => { const c = carteira(), S = GP.state();
    return `${U.secH('Capacidade · ' + esc(S.capacidade.periodo), 'Projetos aprovados que cabem nas pessoas disponíveis.', '<a class="link" href="#/carteira">Carteira →</a>')}
      <div class="row" style="justify-content:space-around;text-align:center"><div><div class="dim" style="font-size:12px">Pessoas livres</div><div style="font-size:28px;font-weight:700">${f1(c.livre)}</div></div>
        <div><div class="dim" style="font-size:12px">Usadas</div><div style="font-size:28px;font-weight:700;color:var(--green)">${f1(c.usadoFte)}</div></div>
        <div><div class="dim" style="font-size:12px">Cabem</div><div style="font-size:28px;font-weight:700">${c.cabem}<span class="dim" style="font-size:15px">/${c.candidatos}</span></div></div></div>`; } });

  GP.tela({ id:'carteira', nivel:3, ordem:20, titulo:'Carteira e capacidade', icone:'carteira', render: telaCarteira });
  GP.tela({ id:'roadmap', nivel:3, ordem:21, titulo:'Roadmap', icone:'roadmap', render: telaRoadmap });
})();

