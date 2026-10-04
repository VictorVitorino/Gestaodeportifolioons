/* =========================================================================
   Nível 1 - Funil de entrada: checklist "entra / não entra" e quadro por etapa
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt } = GP.util, icon = GP.icon;
  const resPill = r => r ? U.pill(M.RESULTADO_ENTRADA[r].nome, M.RESULTADO_ENTRADA[r].tom) : U.pill('Não avaliado', 'neutral');

  /* ------------------------------------------------- modal do checklist */
  GP.abrirEntrada = id => {
    const p = P.get(id); if(!p) return;
    const resp = Object.assign({}, p.entrada && p.entrada.respostas);
    const m = GP.modal(`<h3>Entrada no portfólio · ${esc(p.codigo)}</h3><p class="muted" style="margin:0 0 14px">${esc(p.titulo)}</p>
      <div class="stack" style="gap:10px" data-perguntas></div>
      <div data-resultado style="margin-top:14px"></div>
      <label class="field" style="margin-top:12px">Observação (opcional, fica no histórico)<input class="input" name="obs" maxlength="300" value="${esc(p.entrada && p.entrada.obs || '')}"></label>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn btn-primary" data-registrar>Registrar decisão</button></div>`, {largo:true});
    const desenhar = () => {
      m.querySelector('[data-perguntas]').innerHTML = M.ENTRADA.map((q, i) => {
        const sug = q.sugerir ? (q.sugerir(p) ? 'sim' : 'nao') : null;
        return `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:12px;border:1px solid var(--line);border-radius:10px;padding:12px">
          <span class="score" style="background:var(--green-50);color:var(--green-700);min-width:28px;height:28px">${i + 1}</span>
          <div style="flex:1"><div style="font-weight:600">${esc(q.pergunta)}</div>
            <div class="dim" style="font-size:12.5px">${q.tipo === 'barreira' ? 'Se “Não”: não entra.' : 'Se “Não”: falta informação.'}${sug ? ` · O cadastro indica: <b>${sug === 'sim' ? 'Sim' : 'Não'}</b>` : ''}</div></div>
          <div class="seg" role="radiogroup" aria-label="Resposta ${i + 1}">${['sim', 'nao'].map(v => `<button type="button" class="${resp[q.id] === v ? 'on' : ''}" data-q="${q.id}" data-v="${v}" role="radio" aria-checked="${resp[q.id] === v}">${v === 'sim' ? 'Sim' : 'Não'}</button>`).join('')}</div></div>`; }).join('');
      const r = M.avaliarEntrada(resp), R = M.RESULTADO_ENTRADA[r.resultado];
      m.querySelector('[data-resultado]').innerHTML = `<div class="callout ${r.resultado === 'entra' ? '' : 'warn'}"><span class="ic">${icon(r.resultado === 'entra' ? 'check' : 'info', 16)}</span><div>
        <p><b>Resultado: ${esc(R.nome)}</b>${r.resultado === 'incompleto' ? ` · faltam ${r.pendentes.length} resposta(s)` : ''}</p>
        ${r.motivos.length ? `<p>${r.motivos.map(esc).join('<br>')}</p>` : ''}
        ${R.etapa ? `<p class="muted">O projeto irá para: <b>${esc(M.etapa(R.etapa).nome)}</b></p>` : ''}</div></div>`;
      m.querySelector('[data-registrar]').disabled = r.resultado === 'incompleto';
    };
    m.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if(b){ resp[b.dataset.q] = b.dataset.v; desenhar(); } });
    m.querySelector('[data-registrar]').onclick = () => {
      const res = P.registrarEntrada(p.id, resp, m.querySelector('[name=obs]').value);
      if(!res.ok){ GP.toast('Responda todas as perguntas.'); return; }
      GP.closeModal(); GP.toast(`${esc(p.codigo)}: <b>${esc(M.RESULTADO_ENTRADA[res.r.resultado].nome)}</b>`); GP.refresh();
    };
    desenhar();
  };

  /* --------------------------------------------------------------- tela */
  const ORDEM_FUNIL = ['entrada', 'triagem', 'aprovado', 'execucao', 'concluido'];
  const SAIDAS = ['espera', 'nao_entra', 'cancelado'];
  function tela(el, r){
    const todos = P.todos(), aba = r.query.aba || 'fila';
    const cont = id => todos.filter(p => p.etapa === id).length;
    const maxc = Math.max(1, ...ORDEM_FUNIL.map(cont));
    const resumo = `<div class="card">${U.secH('Como o portfólio está fluindo', 'Cada projeto passa por estas etapas. As saídas ficam à direita.')}
      <div class="grid funil-grid">
        <div class="stack" style="gap:8px">${ORDEM_FUNIL.map((id, i) => { const e = M.etapa(id), n = cont(id);
          return `<div class="row" style="flex-wrap:nowrap"><span style="width:170px;flex:none;font-size:13px">${i + 1}. ${esc(e.nome)}</span>
            <span style="flex:1;height:26px;background:var(--soft);border-radius:7px;border:1px solid var(--line);overflow:hidden"><i style="display:block;height:100%;width:${Math.max(n ? 6 : 0, n / maxc * 100)}%;background:${i < 2 ? 'var(--green-200)' : 'var(--green)'}"></i></span>
            <b class="num" style="width:28px;text-align:right">${n}</b></div>`; }).join('')}</div>
        <div class="stack" style="gap:8px">${SAIDAS.map(id => { const e = M.etapa(id); return `<div class="row" style="justify-content:space-between">${U.pill(e.nome, e.tom)}<b class="num">${cont(id)}</b></div>`; }).join('')}</div>
      </div></div>`;
    const fila = todos.filter(p => p.etapa === 'entrada' || p.etapa === 'triagem').sort((a, b) => (a.dataEntrada || '').localeCompare(b.dataEntrada || ''));
    const dias = d => d ? Math.max(0, Math.round((Date.now() - new Date(d + 'T00:00:00').getTime()) / 864e5)) : null;
    const corpoFila = fila.length ? `<div class="stack" style="gap:10px">${fila.map(p => { const d = dias(p.dataEntrada);
        return `<div class="card row" style="padding:14px 16px;align-items:center">
          <div style="flex:1;min-width:200px;max-width:100%"><div style="overflow-wrap:anywhere"><span class="code" style="color:var(--green-700);font-weight:600">${esc(p.codigo)}</span> · <b>${esc(p.titulo)}</b></div>
            <div class="muted" style="font-size:12.5px">${esc(p.gerencia)} · ${esc(p.tipo)} · ${esc(p.demandante || '-')}${d != null ? ` · aguardando há <b>${d} dia(s)</b>` : ''}</div></div>
          ${GP.etapaPill(p.etapa)} ${p.entrada ? resPill(p.entrada.resultado) : ''}
          <button class="btn btn-primary btn-sm" data-entrada="${p.id}">${icon('funil', 15)} ${p.entrada ? 'Reavaliar entrada' : 'Avaliar entrada'}</button>
          <a class="btn btn-ghost btn-sm" href="#/projeto/${p.id}">Abrir</a></div>`; }).join('')}</div>`
      : U.vazio('Fila de entrada vazia', todos.length ? 'Não há novas demandas nem projetos em triagem.' : 'Cadastre projetos para que eles apareçam aqui.', `<a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo projeto</a>`);
    const quadro = `<div class="quadro">${[...ORDEM_FUNIL, ...SAIDAS].map(id => { const e = M.etapa(id), ps = todos.filter(p => p.etapa === id);
        return `<div class="col"><div class="col-h">${U.pill(e.nome, e.tom)}<b class="num">${ps.length}</b></div>
          ${ps.map(p => `<a class="kcard" href="#/projeto/${p.id}"><span class="code">${esc(p.codigo)}</span><span>${esc(p.titulo)}</span><small>${esc(p.gerencia)} · ${esc(p.tipo)}</small></a>`).join('') || '<div class="dim" style="font-size:12.5px;padding:6px">-</div>'}</div>`; }).join('')}</div>`;
    el.innerHTML = U.pageHead({ titulo:'Funil de entrada', sub:'Toda demanda passa por um checklist simples antes de entrar no portfólio. Assim fica claro o que entra, o que não entra e por quê.',
        acoes:`<a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo projeto</a>` }) +
      `<div class="stack">${resumo}
        ${U.callout('<p><b>Regra:</b> perguntas 1 a 3 com “Não” → <b>não entra</b> (com motivo). Perguntas 4 a 6 com “Não” → <b>falta informação</b> (volta ao demandante). Tudo “Sim” → <b>entra</b> e aguarda priorização.</p>')}
        <div>${U.tabs('#/funil', [['fila', `Fila de entrada (${fila.length})`], ['quadro', 'Quadro por etapa']], aba)}${aba === 'quadro' ? quadro : corpoFila}</div></div>`;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-entrada]'); if(b) GP.abrirEntrada(b.dataset.entrada); });

  /* ----------------------------------------------- seção na ficha do projeto */
  GP.fichaSecoes.push({ id:'entrada', nivel:1, ordem:10, titulo:'Entrada no portfólio',
    render: p => {
      const e = p.entrada;
      if(!e) return `<p class="muted" style="margin:0 0 10px">Ainda não passou pelo checklist de entrada.</p><button class="btn btn-primary btn-sm" data-entrada="${p.id}">${icon('funil', 15)} Avaliar entrada</button>`;
      return `<div class="row" style="margin-bottom:10px">${resPill(e.resultado)}<span class="dim" style="font-size:12.5px">em ${fmt.dataHora(e.data)}</span><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-entrada="${p.id}">Reavaliar</button></div>
        ${e.motivos && e.motivos.length ? `<p style="margin:0 0 10px">${e.motivos.map(esc).join('<br>')}</p>` : ''}
        <div class="stack" style="gap:6px">${M.ENTRADA.map((q, i) => `<div class="row" style="flex-wrap:nowrap;align-items:flex-start;font-size:13px"><span style="flex:none;width:96px">${e.respostas[q.id] === 'sim' ? U.pill('Sim', 'ok') : e.respostas[q.id] === 'nao' ? U.pill('Não', q.tipo === 'barreira' ? 'bad' : 'warn') : U.pill('Sem resposta', 'neutral')}</span><span>${i + 1}. ${esc(q.pergunta)}</span></div>`).join('')}</div>
        ${e.obs ? `<p class="muted" style="margin:10px 0 0">Obs.: ${esc(e.obs)}</p>` : ''}`;
    } });

  GP.tela({ id:'funil', nivel:1, ordem:4, titulo:'Funil de entrada', icone:'funil', render: tela });
})();

