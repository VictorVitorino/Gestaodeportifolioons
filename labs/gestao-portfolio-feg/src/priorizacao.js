/* =========================================================================
   Nível 2 - Priorização: avaliar (perguntas 0-3), ranking, matriz e pesos
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt } = GP.util, icon = GP.icon;
  const n1 = v => v == null ? '-' : fmt.n(v, 0);
  /** Selo colorido com a nota de valor */
  const notaHtml = v => { if(v == null) return '<span class="score" style="background:var(--neutral-bg);color:var(--muted)">-</span>';
    const cor = v >= M.CORTE.classeA ? ['var(--green)', '#fff'] : v >= M.CORTE.classeB ? ['var(--green-100)', 'var(--green-700)'] : ['var(--neutral-bg)', 'var(--muted)'];
    return `<span class="score" style="background:${cor[0]};color:${cor[1]}" title="Nota de valor (0 a 100)">${n1(v)}</span>`; };
  const quadPill = q => q ? `<span class="pill" style="color:${M.QUADRANTES[q].cor};background:${M.QUADRANTES[q].cor}14"><i></i>${esc(M.QUADRANTES[q].nome)}</span>` : U.pill('Não avaliado', 'neutral');
  GP.notaHtml = notaHtml; GP.quadPill = quadPill;
  const priorizaveis = () => P.todos().filter(p => M.ETAPAS_PRIORIZAVEIS.includes(p.etapa));

  /* ------------------------------------------------------------ avaliar */
  function telaAvaliar(el, r){
    if(r.arg) return formAvaliacao(el, r.arg);
    const lista = priorizaveis(), pend = lista.filter(p => !M.pontuar(p).completo);
    el.innerHTML = U.pageHead({ titulo:'Avaliar projetos', sub:'Responda as perguntas de cada projeto (nota de 0 a 3). O sistema calcula a nota de <b>valor</b> e de <b>esforço</b> com os pesos definidos em Critérios e pesos.' }) +
      (lista.length ? `<div class="row" style="margin-bottom:12px">${U.pill(`${lista.length - pend.length} avaliado(s)`, 'ok')} ${pend.length ? U.pill(`${pend.length} pendente(s)`, 'warn') : ''}</div>` +
      U.table({ id:'avaliar', rows: lista, rowAttr: p => `class="click" data-avaliar="${p.id}" tabindex="0"`, cols:[
        { key:'codigo', label:'Código', fmt:v => `<span class="code">${esc(v)}</span>` },
        { key:'titulo', label:'Projeto', fmt:(v, p) => `<b style="font-weight:600">${esc(v)}</b><small>${esc(p.gerencia)} · ${esc(p.tipo)}${p.obrigatorio ? ' · obrigatório' : ''}</small>` },
        { key:'etapa', label:'Etapa', fmt:v => GP.etapaPill(v), sortVal:p => M.etapa(p.etapa).ordem },
        { key:'valor', label:'Valor', align:'c', fmt:(v, p) => notaHtml(M.pontuar(p).valor), sortVal:p => M.pontuar(p).valor ?? -1 },
        { key:'esforco', label:'Esforço', align:'c', fmt:(v, p) => n1(M.pontuar(p).esforco), sortVal:p => M.pontuar(p).esforco ?? -1 },
        { key:'situacao', label:'Situação', fmt:(v, p) => { const s = M.pontuar(p); return s.completo ? quadPill(s.quadrante) : U.pill(p.avaliacao ? `Faltam ${s.faltam}` : 'Não avaliado', 'warn'); }, sortVal:p => M.pontuar(p).faltam },
        { key:'acao', label:'', sort:false, align:'r', fmt:(v, p) => `<span class="link">${M.pontuar(p).completo ? 'Revisar' : 'Avaliar'} →</span>` },
      ]}) : U.vazio('Nada para avaliar', 'Só são priorizados projetos que entraram no portfólio (aprovados, em execução, em espera) ou que estão em triagem.', '<a class="btn btn-primary" href="#/funil">Ir para o funil de entrada</a>'));
  }
  function formAvaliacao(el, id){
    const p = P.get(id); if(!p){ el.innerHTML = U.vazio('Projeto não encontrado', '', '<a class="btn btn-primary" href="#/avaliar">Voltar</a>'); return; }
    const crit = M.criterios(), resp = Object.assign({}, p.avaliacao && p.avaliacao.respostas);
    crit.forEach(c => { if(resp[c.id] == null){ const s = M.sugestao(p, c.id); if(s != null) resp[c.id] = s; } });
    const bloco = eixo => `<div class="card stack" style="gap:12px">${U.secH(esc(M.EIXOS[eixo]), eixo === 'valor' ? 'Quanto maior, mais importante.' : 'Quanto maior, mais caro e arriscado de fazer.')}
      ${crit.filter(c => c.eixo === eixo).map(c => { const sug = M.sugestao(p, c.id);
        return `<div class="crit"><div class="row" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start"><div><b>${esc(c.nome)}</b><div class="muted" style="font-size:13px">${esc(c.pergunta)}</div></div><span class="tag" title="Peso no eixo">${fmt.n(c.peso)}%</span></div>
          <div class="escala" role="radiogroup" aria-label="${esc(c.nome)}">${c.niveis.map((t, v) => `<button type="button" class="${resp[c.id] === v ? 'on' : ''}" data-c="${c.id}" data-v="${v}" role="radio" aria-checked="${resp[c.id] === v}"><b>${v}</b><span>${esc(t)}</span></button>`).join('')}</div>
          ${sug != null ? `<div class="dim" style="font-size:12px">Sugestão a partir do cadastro: <b>${sug}</b></div>` : ''}</div>`; }).join('')}</div>`;
    el.innerHTML = `<a class="link" href="#/avaliar" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:10px">${icon('voltar', 16)} Avaliar projetos</a>` +
      U.pageHead({ titulo:`Avaliar <span style="color:var(--green)">${esc(p.codigo)}</span>`, sub: esc(p.titulo) + (p.obrigatorio ? ' · <b>obrigatório por lei/regulação</b>' : '') }) +
      `<div class="grid aval-grid"><div class="stack">${bloco('valor')}${bloco('esforco')}
          <label class="field">Observação (opcional)<input class="input" name="obs" maxlength="300" value="${esc(p.avaliacao && p.avaliacao.obs || '')}"></label></div>
        <div class="card stack aval-res" style="gap:12px" data-resultado></div></div>`;
    const desenhar = () => {
      const s = M.pontuar({ avaliacao:{ respostas:resp } }, crit);
      el.querySelectorAll('[data-c]').forEach(b => { const on = resp[b.dataset.c] === +b.dataset.v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      el.querySelector('[data-resultado]').innerHTML = `${U.secH('Resultado')}
        <div class="row" style="justify-content:space-around;text-align:center"><div><div class="dim" style="font-size:12px">Valor</div><div style="font-size:34px;font-weight:700;color:var(--green)">${n1(s.valor)}</div></div>
          <div><div class="dim" style="font-size:12px">Esforço</div><div style="font-size:34px;font-weight:700">${n1(s.esforco)}</div></div></div>
        <div style="text-align:center">${s.completo ? quadPill(s.quadrante) : U.pill(`Faltam ${s.faltam} resposta(s)`, 'warn')}</div>
        ${s.completo ? `<p class="muted" style="margin:0;font-size:13px;text-align:center">${esc(M.QUADRANTES[s.quadrante].desc)}</p>` : ''}
        <button class="btn btn-primary" data-salvar>${icon('check', 16)} Salvar avaliação</button>
        <p class="dim" style="margin:0;font-size:12px">Nota = soma de (resposta ÷ 3 × peso). Pesos sugeridos, a validar pela FEG.</p>`;
      el.querySelector('[data-salvar]').onclick = () => { P.avaliar(p.id, resp, el.querySelector('[name=obs]').value); GP.toast(`Avaliação de <b>${esc(p.codigo)}</b> salva.`); GP.go('#/ranking'); };
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if(b){ resp[b.dataset.c] = +b.dataset.v; desenhar(); } });
    desenhar();
  }
  document.addEventListener('click', e => { const a = e.target.closest('[data-avaliar]'); if(a) GP.go('#/avaliar/' + a.dataset.avaliar); });
  document.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target.closest && e.target.closest('[data-avaliar]')) GP.go('#/avaliar/' + e.target.closest('[data-avaliar]').dataset.avaliar); });

  /* ------------------------------------------------------------ ranking */
  const ESCOPOS = [['aguardando', 'Aguardando início (aprovados)'], ['ativos', 'Todos os ativos'], ['todos', 'Todos os avaliados']];
  const noEscopo = (p, esc_) => esc_ === 'aguardando' ? p.etapa === 'aprovado' : esc_ === 'ativos' ? M.ETAPAS_PRIORIZAVEIS.includes(p.etapa) : true;
  function telaRanking(el){
    const ui = GP.state().ui, escopo = ui.rankEscopo || 'aguardando', topo = ui.rankObrig !== false;
    const base = P.todos().filter(p => noEscopo(p, escopo)), rk = M.ranking(base, { obrigatoriosNoTopo: topo });
    const semNota = base.filter(p => !M.pontuar(p).completo);
    el.innerHTML = U.pageHead({ titulo:'Ranking de prioridade', sub:'Ordem sugerida para a equipe começar os projetos. A decisão final é do comitê; o ranking é o ponto de partida da conversa.',
        acoes:`${GP.botaoPDF()}<a class="btn btn-ghost" href="#/criterios">${icon('pesos', 16)} Ajustar pesos</a>` }) +
      `<div class="filters"><div class="chips">${ESCOPOS.map(([k, l]) => `<button class="chip ${escopo === k ? 'on' : ''}" data-escopo="${k}">${esc(l)}</button>`).join('')}</div>
        <label class="row" style="gap:6px;font-size:13px;cursor:pointer"><input type="checkbox" data-topo ${topo ? 'checked' : ''}> Obrigatórios no topo</label></div>
      ${rk.length ? U.table({ cols:[
          { key:'pos', label:'#', fmt:v => `<b>${v}</b>` },
          { key:'p', label:'Projeto', fmt:(v) => `<span class="code">${esc(v.codigo)}</span> · <b style="font-weight:600">${esc(v.titulo)}</b>${v.obrigatorio ? ' <span class="tag">obrigatório</span>' : ''}<small>${esc(v.gerencia)} · ${esc(v.tipo)} · ${esc(M.etapa(v.etapa).nome)}</small>` },
          { key:'s', label:'Valor', align:'c', fmt:v => notaHtml(v.valor) },
          { key:'barra', label:'', fmt:(v, r) => `<div class="bar" style="width:120px"><i style="width:${r.s.valor}%"></i></div>` },
          { key:'esf', label:'Esforço', align:'c', fmt:(v, r) => n1(r.s.esforco) },
          { key:'q', label:'Quadrante', fmt:(v, r) => quadPill(r.s.quadrante) },
          { key:'fte', label:'FTE', align:'r', fmt:(v, r) => r.p.esforcoFte != null ? fmt.n(r.p.esforcoFte, 1) : '-' },
        ], rows: rk.map(x => Object.assign({}, x, { esf:'', q:'', barra:'', fte:'' })), rowAttr: x => `class="click" data-abrir="${x.p.id}" tabindex="0"` })
        : U.vazio('Ranking vazio', 'Nenhum projeto avaliado neste filtro.', '<a class="btn btn-primary" href="#/avaliar">Avaliar projetos</a>')}
      ${semNota.length ? `<div class="card" style="margin-top:16px">${U.secH(`Sem avaliação completa (${semNota.length})`, 'Não entram no ranking até todas as perguntas serem respondidas.')}
        <div class="chips">${semNota.map(p => `<a class="chip" href="#/avaliar/${p.id}">${esc(p.codigo)} · ${esc(p.titulo.slice(0, 48))}${p.titulo.length > 48 ? '…' : ''}</a>`).join('')}</div></div>` : ''}
      <details class="card" style="margin-top:16px"><summary style="cursor:pointer;font-weight:600">Como a nota é calculada</summary>
        <p class="muted">Cada pergunta recebe nota de 0 a 3. A nota de <b>valor</b> é a soma de (nota ÷ 3 × peso da pergunta), de 0 a 100. Projetos obrigatórios por lei ou regulação podem ficar no topo. Empates são decididos pelo menor esforço.</p>
        <p class="muted" style="margin:0">Classes: <b>A</b> ≥ ${M.CORTE.classeA}, <b>B</b> ≥ ${M.CORTE.classeB}, <b>C</b> abaixo de ${M.CORTE.classeB}. Quadrantes usam corte de ${M.CORTE.valor} em valor e em esforço.</p></details>`;
    el.querySelectorAll('[data-escopo]').forEach(b => b.onclick = () => { ui.rankEscopo = b.dataset.escopo; GP.save(); GP.refresh(); });
    el.querySelector('[data-topo]').onchange = e => { ui.rankObrig = e.target.checked; GP.save(); GP.refresh(); };
  }

  /* ------------------------------------------------------------- matriz */
  function telaMatriz(el){
    const ui = GP.state().ui, escopo = ui.rankEscopo || 'aguardando';
    const rk = M.ranking(P.todos().filter(p => noEscopo(p, escopo)));
    const pts = rk.map(x => ({ x:x.s.esforco, y:x.s.valor, r: 7 + Math.min(10, (x.p.esforcoFte || 1) * 2), label:x.p.codigo, id:x.p.id, color:M.QUADRANTES[x.s.quadrante].cor, title:`${x.p.codigo} · ${x.p.titulo}\nValor ${n1(x.s.valor)} · Esforço ${n1(x.s.esforco)}` }));
    const porQ = k => rk.filter(x => x.s.quadrante === k);
    el.innerHTML = U.pageHead({ titulo:'Matriz valor × esforço', sub:'Onde cada projeto avaliado cai. Comece pelos ganhos rápidos, planeje os estratégicos e questione os do quadrante “repensar”.', acoes: GP.botaoPDF() }) +
      `<div class="filters"><div class="chips">${ESCOPOS.map(([k, l]) => `<button class="chip ${escopo === k ? 'on' : ''}" data-escopo="${k}">${esc(l)}</button>`).join('')}</div></div>
      ${rk.length ? `<div class="grid aval-grid"><div class="card">${GP.charts.matriz(pts, { xMax:100, yMax:100, qx:M.CORTE.esforco, qy:M.CORTE.valor, xLabel:'Esforço', yLabel:'Valor', quadrantes:['Ganho rápido', 'Estratégico', 'Complementar', 'Repensar'] })}
          <p class="dim" style="font-size:12px;margin:6px 0 0">Tamanho da bolha = pessoas (FTE). Clique numa bolha para abrir o projeto.</p></div>
        <div class="stack">${['rapido', 'estrategico', 'complementar', 'repensar'].map(k => `<div class="card" style="padding:14px">${quadPill(k)}<p class="muted" style="margin:6px 0;font-size:12.5px">${esc(M.QUADRANTES[k].desc)}</p>
          ${porQ(k).map(x => `<a class="link" style="display:block;font-size:13px;font-weight:500" href="#/projeto/${x.p.id}">${esc(x.p.codigo)} · ${esc(x.p.titulo)}</a>`).join('') || '<span class="dim" style="font-size:12.5px">Nenhum</span>'}</div>`).join('')}</div></div>`
      : U.vazio('Nenhum projeto avaliado', 'Avalie projetos para vê-los na matriz.', '<a class="btn btn-primary" href="#/avaliar">Avaliar projetos</a>')}`;
    el.querySelectorAll('[data-escopo]').forEach(b => b.onclick = () => { ui.rankEscopo = b.dataset.escopo; GP.save(); GP.refresh(); });
    el.querySelectorAll('[data-ponto]').forEach(g => g.addEventListener('click', () => GP.go('#/projeto/' + g.dataset.ponto)));
  }

  /* ---------------------------------------------------- critérios e pesos */
  function telaCriterios(el){
    const S = GP.state(); const rasc = S.criterios.map(c => ({ id:c.id, peso:c.peso }));
    const soma = eixo => rasc.filter(r => S.criterios.find(c => c.id === r.id).eixo === eixo).reduce((a, r) => a + (+r.peso || 0), 0);
    const bloco = eixo => `<div class="card stack" style="gap:10px">${U.secH(esc(M.EIXOS[eixo]), 'Os pesos deste eixo precisam somar 100%.')}
      ${S.criterios.filter(c => c.eixo === eixo).map(c => `<div class="peso-row"><div><b>${esc(c.nome)}</b><div class="muted" style="font-size:12.5px">${esc(c.pergunta)}</div></div>
        <input type="range" min="0" max="100" step="1" value="${+c.peso}" data-peso="${esc(c.id)}" aria-label="Peso de ${esc(c.nome)} (controle deslizante)">
        <span class="row" style="gap:4px;flex-wrap:nowrap"><input class="input num" style="width:62px;padding:6px 8px;text-align:right" inputmode="numeric" value="${+c.peso}" data-peso-n="${esc(c.id)}" aria-label="Peso de ${esc(c.nome)} em %">%</span></div>`).join('')}
      <div class="row" style="justify-content:space-between"><span class="muted">Soma <button class="btn btn-ghost btn-sm" data-normalizar="${eixo}" style="margin-left:8px">Ajustar para 100%</button></span><b data-soma="${eixo}"></b></div></div>`;
    el.innerHTML = U.pageHead({ titulo:'Critérios e pesos', sub:'Defina a importância (%) de cada pergunta. O ranking muda na hora. Os pesos iniciais são uma sugestão para a FEG validar.',
        acoes:`<button class="btn btn-ghost" data-restaurar>${icon('relogio', 16)} Restaurar sugestão</button>` }) +
      `<div class="grid aval-grid"><div class="stack">${bloco('valor')}${bloco('esforco')}
        <div class="row"><button class="btn btn-primary" data-salvar-pesos>${icon('check', 16)} Salvar pesos</button><span class="dim" data-aviso style="font-size:12.5px"></span></div></div>
        <div class="card stack" style="gap:10px">${U.secH('Prévia do ranking', 'Top 8 aprovados com os pesos ao lado (antes de salvar).')}<div data-previa></div></div></div>`;
    const atualizar = () => {
      const crit = S.criterios.map(c => Object.assign({}, c, { peso: +rasc.find(r => r.id === c.id).peso }));
      ['valor', 'esforco'].forEach(e => { const sm = soma(e), b = el.querySelector(`[data-soma="${e}"]`); b.textContent = sm + '%'; b.style.color = sm === 100 ? 'var(--green)' : 'var(--bad)'; });
      const ok = soma('valor') === 100 && soma('esforco') === 100;
      el.querySelector('[data-salvar-pesos]').disabled = !ok;
      el.querySelector('[data-aviso]').textContent = ok ? '' : 'Ajuste para que cada eixo some exatamente 100%.';
      const rk = M.ranking(P.todos().filter(p => p.etapa === 'aprovado'), {}, crit).slice(0, 8);
      el.querySelector('[data-previa]').innerHTML = rk.length ? rk.map(x => `<div class="row" style="flex-wrap:nowrap;gap:10px;padding:6px 0;border-bottom:1px solid var(--line)"><b style="width:18px">${x.pos}</b>${notaHtml(x.s.valor)}<span style="font-size:13px">${esc(x.p.codigo)} · ${esc(x.p.titulo)}</span></div>`).join('') : '<span class="dim">Avalie projetos aprovados para ver a prévia.</span>';
    };
    const definir = (id, v) => { v = Math.max(0, Math.min(100, Math.round(+v) || 0)); rasc.find(r => r.id === id).peso = v;
      const rg = el.querySelector(`[data-peso="${id}"]`), nb = el.querySelector(`[data-peso-n="${id}"]`); if(rg && +rg.value !== v) rg.value = v; if(nb && document.activeElement !== nb) nb.value = v; atualizar(); };
    el.querySelectorAll('[data-peso]').forEach(i => i.addEventListener('input', () => { definir(i.dataset.peso, i.value); el.querySelector(`[data-peso-n="${i.dataset.peso}"]`).value = i.value; }));
    el.querySelectorAll('[data-peso-n]').forEach(i => { i.addEventListener('input', () => { if(i.value.trim() !== '') definir(i.dataset.pesoN, GP.util.numBR(i.value)); }); i.addEventListener('blur', () => { i.value = rasc.find(r => r.id === i.dataset.pesoN).peso; }); });
    el.querySelectorAll('[data-normalizar]').forEach(b => b.onclick = () => { const ids = S.criterios.filter(c => c.eixo === b.dataset.normalizar).map(c => c.id), rs = rasc.filter(r => ids.includes(r.id)), tot = rs.reduce((a, r) => a + r.peso, 0);
      if(!tot){ rs.forEach((r, i) => r.peso = Math.floor(100 / rs.length) + (i < 100 % rs.length ? 1 : 0)); }
      else { rs.forEach(r => r.peso = Math.floor(r.peso / tot * 100)); let resto = 100 - rs.reduce((a, r) => a + r.peso, 0); rs.slice().sort((a, b) => b.peso - a.peso).forEach(r => { if(resto > 0){ r.peso++; resto--; } }); }
      rs.forEach(r => { el.querySelector(`[data-peso="${r.id}"]`).value = r.peso; el.querySelector(`[data-peso-n="${r.id}"]`).value = r.peso; }); atualizar(); });
    el.querySelector('[data-salvar-pesos]').onclick = () => { S.criterios.forEach(c => c.peso = +rasc.find(r => r.id === c.id).peso); GP.save(); GP.toast('Pesos salvos. O ranking foi recalculado.'); GP.refresh(); };
    el.querySelector('[data-restaurar]').onclick = () => GP.confirmar('Restaurar pesos sugeridos?', '<p>Os pesos voltam aos valores iniciais. As respostas dos projetos não mudam.</p>', 'Restaurar', () => { S.criterios = JSON.parse(JSON.stringify(M.CRITERIOS_PADRAO)); GP.save(); GP.toast('Pesos restaurados.'); GP.refresh(); });
    atualizar();
  }

  /* ---------------------------------------------- ficha e acervo (nível 2) */
  GP.fichaSecoes.push({ id:'priorizacao', nivel:2, ordem:20, titulo:'Priorização',
    render: p => { const s = M.pontuar(p);
      if(!p.avaliacao) return `<p class="muted" style="margin:0 0 10px">Ainda não avaliado.</p><a class="btn btn-primary btn-sm" href="#/avaliar/${p.id}">${icon('avaliar', 15)} Avaliar</a>`;
      const resp = p.avaliacao.respostas;
      return `<div class="row" style="margin-bottom:10px">Valor ${notaHtml(s.valor)} Esforço <b>${n1(s.esforco)}</b> ${quadPill(s.quadrante)}<span class="spacer"></span><a class="btn btn-ghost btn-sm" href="#/avaliar/${p.id}">Revisar</a></div>
        <div class="stack" style="gap:4px">${M.criterios().map(c => `<div class="row" style="flex-wrap:nowrap;font-size:13px;justify-content:space-between"><span>${esc(c.nome)} <span class="dim">(${c.peso}%)</span></span><span>${resp[c.id] != null ? `<b>${resp[c.id]}</b> · ${esc(c.niveis[resp[c.id]])}` : '<span class="dim">sem resposta</span>'}</span></div>`).join('')}</div>`;
    } });
  GP.acervoColunas.push({ nivel:2, coluna:{ key:'valorNota', label:'Valor', align:'c', fmt:(v, p) => notaHtml(M.pontuar(p).valor), sortVal:p => M.pontuar(p).valor ?? -1 } });

  GP.tela({ id:'avaliar', nivel:2, ordem:10, titulo:'Avaliar projetos', icone:'avaliar', render: telaAvaliar });
  GP.tela({ id:'ranking', nivel:2, ordem:11, titulo:'Ranking', icone:'ranking', render: telaRanking });
  GP.tela({ id:'matriz', nivel:2, ordem:12, titulo:'Matriz valor × esforço', icone:'matriz', render: telaMatriz });
  GP.tela({ id:'criterios', nivel:2, ordem:13, titulo:'Critérios e pesos', icone:'pesos', render: telaCriterios });
})();

