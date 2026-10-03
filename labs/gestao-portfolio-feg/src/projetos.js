/* =========================================================================
   Nível 1 — Cadastro: Novo/Editar projeto, Acervo e Ficha do projeto
   Extensões: GP.fichaSecoes (seções da ficha) e GP.acervoColunas (colunas extras)
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt } = GP.util, icon = GP.icon;
  GP.fichaSecoes = GP.fichaSecoes || [];      // {id, nivel, ordem, titulo, render(p) → html, bind(el, p)}
  GP.acervoColunas = GP.acervoColunas || [];  // {nivel, coluna:{key,label,fmt,sortVal,align}}
  const etapaPill = id => { const e = M.etapa(id); return U.pill(e.nome, e.tom); };
  GP.etapaPill = etapaPill;

  /* --------------------------------------------------------- formulário */
  const opt = (lista, sel, vazio = 'Selecione…') => `<option value="">${vazio}</option>` + lista.map(o => { const v = typeof o === 'string' ? o : o.id, l = typeof o === 'string' ? o : o.nome; return `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
  const campo = (k, html, {full, ajuda} = {}) => `<label class="field ${full ? 'full' : ''}" data-campo="${k}">${esc(M.CAMPOS[k])}${M.OBRIGATORIOS.includes(k) ? ' <span class="req">*</span>' : ''}${ajuda ? `<small>${esc(ajuda)}</small>` : ''}${html}<span class="err-msg" data-err="${k}"></span></label>`;
  const inp = (k, v, attrs = '') => `<input class="input" name="${k}" value="${esc(v ?? '')}" ${attrs}>`;

  function telaForm(el, r){
    const p = r.arg ? P.get(r.arg) : null;
    if(r.arg && !p){ el.innerHTML = U.vazio('Projeto não encontrado', 'Ele pode ter sido excluído.', '<a class="btn btn-primary" href="#/acervo">Ir para o acervo</a>'); return; }
    const v = p || {};
    el.innerHTML = U.pageHead({ titulo: p ? `Editar ${esc(p.codigo)}` : 'Novo projeto',
        sub: p ? esc(p.titulo) : 'Cadastre a demanda com as informações mínimas. Ela entra como <b>Nova demanda</b> e depois passa pelo funil de entrada.' }) +
      `<form class="stack" novalidate data-form>
        <fieldset class="fieldset"><legend>O que é</legend><div class="form">
          ${campo('titulo', inp('titulo', v.titulo, 'maxlength="140" placeholder="Ex.: Automação de testes dos modelos hidrológicos"'), {full:true})}
          ${campo('descricao', `<textarea class="input" name="descricao" maxlength="1200" placeholder="Qual problema resolve? O que será entregue?">${esc(v.descricao || '')}</textarea>`, {full:true})}
          ${campo('beneficio', inp('beneficio', v.beneficio, 'maxlength="300" placeholder="Ex.: reduzir em 30% o tempo das rodadas"'), {full:true, ajuda:'Resultado concreto esperado'})}
          ${campo('tipo', `<select class="select" name="tipo">${opt(M.CAT.tipos, v.tipo)}</select>`)}
          ${campo('origem', `<select class="select" name="origem">${opt(M.CAT.origens, v.origem, 'Não informada')}</select>`)}
          <label class="field full row" style="flex-direction:row;align-items:center;font-weight:500"><input type="checkbox" name="obrigatorio" ${v.obrigatorio ? 'checked' : ''}> É obrigatório por lei ou regulação (fura a fila na priorização)</label>
        </div></fieldset>
        <fieldset class="fieldset"><legend>Quem</legend><div class="form">
          ${campo('gerencia', `<select class="select" name="gerencia">${opt(M.CAT.gerencias, v.gerencia)}</select>`)}
          ${campo('area', inp('area', v.area, 'maxlength="120" placeholder="Ex.: Recursos Hidrológicos"'))}
          ${campo('ferramenta', inp('ferramenta', v.ferramenta, 'maxlength="80" placeholder="Ex.: NEWAVE, DESSEM, ANAREDE"'))}
          ${campo('demandante', inp('demandante', v.demandante, 'maxlength="120" placeholder="Pessoa ou área que pediu"'))}
          ${campo('patrocinador', inp('patrocinador', v.patrocinador, 'maxlength="120"'))}
          ${campo('responsavel', inp('responsavel', v.responsavel, 'maxlength="120"'))}
        </div></fieldset>
        <fieldset class="fieldset"><legend>Quanto e quando (estimativas)</legend><div class="form">
          ${campo('esforcoFte', inp('esforcoFte', v.esforcoFte, 'type="number" min="0" step="0.5" inputmode="decimal"'), {ajuda:'Pessoas em tempo integral'})}
          ${campo('duracaoMeses', inp('duracaoMeses', v.duracaoMeses, 'type="number" min="0" step="1"'))}
          ${campo('custo', inp('custo', v.custo, 'type="number" min="0" step="1000"'), {ajuda:'Opcional'})}
          ${campo('inicioPrevisto', inp('inicioPrevisto', v.inicioPrevisto, 'type="date"'))}
          ${campo('fimPrevisto', inp('fimPrevisto', v.fimPrevisto, 'type="date"'))}
          ${campo('link', inp('link', v.link, 'maxlength="300" placeholder="https://…"'), {ajuda:'Item no Azure DevOps ou Jira'})}
          ${campo('observacoes', `<textarea class="input" name="observacoes" maxlength="1200">${esc(v.observacoes || '')}</textarea>`, {full:true})}
        </div></fieldset>
        <div class="row"><button class="btn btn-primary" type="submit">${icon('check', 16)} ${p ? 'Salvar alterações' : 'Cadastrar projeto'}</button>
          <a class="btn btn-ghost" href="${p ? '#/projeto/' + p.id : '#/acervo'}">Cancelar</a><span class="dim" style="font-size:12.5px"><span class="req" style="color:var(--bad)">*</span> obrigatório</span></div>
      </form>`;
    const f = el.querySelector('[data-form]');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f).entries()); d.obrigatorio = f.obrigatorio.checked;
      const res = p ? P.atualizar(p.id, d) : P.criar(d);
      el.querySelectorAll('[data-err]').forEach(x => x.textContent = ''); el.querySelectorAll('.input.err,.select.err').forEach(x => x.classList.remove('err'));
      if(!res.ok){
        Object.entries(res.erros).forEach(([k, m]) => { const s = el.querySelector(`[data-err="${k}"]`); if(s) s.textContent = m; const i = f.elements[k]; if(i && i.classList) i.classList.add('err'); });
        const first = el.querySelector('.err'); if(first) first.focus(); GP.toast('Revise os campos destacados.'); return;
      }
      GP.toast(p ? 'Alterações salvas.' : `Projeto <b>${esc(res.projeto.codigo)}</b> cadastrado.`);
      GP.go('#/projeto/' + res.projeto.id);
    });
  }

  /* ---------------------------------------------------------------- acervo */
  const GRUPOS = [['todos', 'Todos'], ['andamento', 'Em andamento'], ['concluido', 'Concluídos'], ['fora', 'Não entram / cancelados']];
  function filtrar(lista, f){
    const q = (f.q || '').trim().toLowerCase();
    return lista.filter(p => (!f.grupo || f.grupo === 'todos' || M.etapa(p.etapa).grupo === f.grupo)
      && (!f.etapa || p.etapa === f.etapa) && (!f.gerencia || p.gerencia === f.gerencia) && (!f.tipo || p.tipo === f.tipo)
      && (!q || [p.codigo, p.titulo, p.area, p.ferramenta, p.responsavel, p.demandante].join(' ').toLowerCase().includes(q)));
  }
  function telaAcervo(el){
    const S = GP.state(), f = S.ui.filtroAcervo = Object.assign({ grupo:'todos', q:'', gerencia:'', tipo:'', etapa:'' }, S.ui.filtroAcervo);
    const todos = P.todos();
    if(!todos.length){
      el.innerHTML = U.pageHead({ titulo:'Acervo de projetos', sub:'Todos os projetos cadastrados: em andamento, concluídos e os que não entraram.' }) +
        U.vazio('Nenhum projeto cadastrado ainda', 'Comece cadastrando um projeto ou carregue exemplos fictícios para conhecer o sistema.',
          `<div class="row" style="justify-content:center;margin-top:12px"><a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo projeto</a><button class="btn btn-ghost" data-exemplos>Carregar exemplos</button></div>`);
      return;
    }
    const lista = filtrar(todos, f);
    const cols = [
      { key:'codigo', label:'Código', fmt:(v, r) => `<span class="code">${esc(v)}</span>` },
      { key:'titulo', label:'Projeto', fmt:(v, r) => `<b style="font-weight:600">${esc(v)}</b><small>${esc([r.area, r.ferramenta].filter(Boolean).join(' · ') || '—')}</small>` },
      { key:'gerencia', label:'Gerência' },
      { key:'tipo', label:'Tipo', fmt:(v, r) => `${esc(v)}${r.obrigatorio ? ' <span class="tag" title="Obrigatório por lei/regulação">obrigatório</span>' : ''}` },
      { key:'etapa', label:'Etapa', fmt:v => etapaPill(v), sortVal:r => M.etapa(r.etapa).ordem },
      ...GP.acervoColunas.filter(c => c.nivel <= GP.nivel()).map(c => c.coluna),
      { key:'responsavel', label:'Responsável', fmt:v => esc(v || '—') },
      { key:'fimPrevisto', label:'Fim previsto', fmt:v => fmt.data(v) },
    ];
    el.innerHTML = U.pageHead({ titulo:'Acervo de projetos', sub:'Todos os projetos cadastrados: em andamento, concluídos e os que não entraram.',
        acoes:`<a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo projeto</a>` }) +
      `<div class="chips" style="margin-bottom:12px">${GRUPOS.map(([k, l]) => `<button class="chip ${f.grupo === k ? 'on' : ''}" data-grupo="${k}">${l} <b>${filtrar(todos, {grupo:k}).length}</b></button>`).join('')}</div>
      <div class="filters">
        <div class="search"><span class="ic">${icon('busca', 16)}</span><input class="input" data-f="q" value="${esc(f.q)}" placeholder="Buscar por código, título, área, ferramenta, pessoa…" aria-label="Buscar"></div>
        <select class="select" data-f="gerencia" aria-label="Gerência"><option value="">Todas as gerências</option>${M.CAT.gerencias.map(g => `<option value="${g.id}" ${f.gerencia === g.id ? 'selected' : ''}>${g.id}</option>`).join('')}</select>
        <select class="select" data-f="etapa" aria-label="Etapa"><option value="">Todas as etapas</option>${M.ETAPAS.map(e => `<option value="${e.id}" ${f.etapa === e.id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}</select>
        <select class="select" data-f="tipo" aria-label="Tipo"><option value="">Todos os tipos</option>${M.CAT.tipos.map(t => `<option ${f.tipo === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
        ${f.q || f.gerencia || f.tipo || f.etapa ? `<button class="btn btn-ghost btn-sm" data-limpar>Limpar filtros</button>` : ''}
      </div>
      <div class="dim" style="font-size:12.5px;margin-bottom:8px">${lista.length} de ${todos.length} projeto(s)</div>
      ${U.table({ id:'acervo', cols, rows:lista, rowAttr:r => `class="click" data-abrir="${r.id}" tabindex="0"`, vazioTxt:'Nenhum projeto com estes filtros.' })}`;
    el.querySelectorAll('[data-grupo]').forEach(b => b.onclick = () => { f.grupo = b.dataset.grupo; GP.save(); GP.refresh(); });
    el.querySelectorAll('[data-f]').forEach(i => { const ev = i.tagName === 'INPUT' ? 'input' : 'change';
      i.addEventListener(ev, () => { f[i.dataset.f] = i.value; GP.save(); clearTimeout(telaAcervo._t); telaAcervo._t = setTimeout(() => { const pos = i.selectionStart; GP.refresh(); const n = document.querySelector(`[data-f="${i.dataset.f}"]`); if(n && ev === 'input'){ n.focus(); try { n.setSelectionRange(pos, pos); } catch(e){} } }, ev === 'input' ? 250 : 0); }); });
    const lp = el.querySelector('[data-limpar]'); if(lp) lp.onclick = () => { Object.assign(f, { q:'', gerencia:'', tipo:'', etapa:'' }); GP.save(); GP.refresh(); };
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-abrir]'); if(a){ GP.go('#/projeto/' + a.dataset.abrir); return; }
    if(e.target.closest('[data-exemplos]')){ const n = GP.modelo.carregarExemplos(); GP.toast(`${n} projeto(s) de exemplo carregado(s).`); GP.refresh(); }
  });
  document.addEventListener('keydown', e => { if(e.key === 'Enter'){ const a = e.target.closest && e.target.closest('[data-abrir]'); if(a) GP.go('#/projeto/' + a.dataset.abrir); } });

  /* ----------------------------------------------------------------- ficha */
  const linha = (rot, val) => `<div><div class="dim" style="font-size:12px">${esc(rot)}</div><div>${val}</div></div>`;
  function telaFicha(el, r){
    const p = P.get(r.arg);
    if(!p){ el.innerHTML = U.vazio('Projeto não encontrado', 'Ele pode ter sido excluído.', '<a class="btn btn-primary" href="#/acervo">Ir para o acervo</a>'); return; }
    const g = M.CAT.gerencias.find(x => x.id === p.gerencia);
    const secoes = GP.fichaSecoes.filter(s => s.nivel <= GP.nivel()).sort((a, b) => a.ordem - b.ordem);
    el.innerHTML = `<a class="link" href="#/acervo" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:10px">${icon('voltar', 16)} Acervo</a>` +
      U.pageHead({ titulo: `<span class="code" style="color:var(--green)">${esc(p.codigo)}</span> · ${esc(p.titulo)}`,
        sub: `${etapaPill(p.etapa)} &nbsp;${esc(p.tipo || '')}${p.obrigatorio ? ' · <b>obrigatório por lei/regulação</b>' : ''}${p.exemplo ? ' · <span class="tag">exemplo fictício</span>' : ''}`,
        acoes: `<a class="btn btn-ghost" href="#/novo/${p.id}">${icon('editar', 16)} Editar</a><button class="btn btn-ghost" data-etapa>Mudar etapa</button><button class="btn btn-danger" data-excluir>${icon('lixo', 16)} Excluir</button>` }) +
      `<div class="grid ficha-grid">
        <div class="stack">
          <div class="card stack" style="gap:12px">${U.secH('Descrição')}<p style="margin:0;white-space:pre-wrap">${esc(p.descricao)}</p>${p.beneficio ? `<p style="margin:0"><b>Benefício esperado:</b> ${esc(p.beneficio)}</p>` : ''}</div>
          ${secoes.map(s => `<div class="card" data-secao="${s.id}">${U.secH(s.titulo)}${s.render(p)}</div>`).join('')}
          <div class="card">${U.secH('Histórico', 'Tudo o que aconteceu com o projeto.')}
            <div class="stack" style="gap:10px">${(p.historico || []).slice().reverse().map(h => `<div class="row" style="align-items:flex-start;flex-wrap:nowrap"><span class="ic" style="color:var(--green);margin-top:2px">${icon('relogio', 15)}</span><div><b>${esc(h.acao)}</b> <span class="dim" style="font-size:12px">${fmt.dataHora(h.data)}</span><div class="muted" style="font-size:13px">${esc(h.detalhe)}</div></div></div>`).join('') || '<span class="dim">Sem registros.</span>'}</div></div>
        </div>
        <div class="card stack" style="gap:12px">${U.secH('Dados')}
          ${linha('Gerência', esc(g ? g.nome : p.gerencia))}${linha('Área / comunidade', esc(p.area || '—'))}${linha('Ferramenta', esc(p.ferramenta || '—'))}
          ${linha('Demandante', esc(p.demandante || '—'))}${linha('Patrocinador', esc(p.patrocinador || '—'))}${linha('Responsável', esc(p.responsavel || '—'))}
          ${linha('Origem', esc(p.origem || '—'))}${linha('Entrada', fmt.data(p.dataEntrada))}
          ${linha('Esforço', p.esforcoFte != null ? fmt.n(p.esforcoFte, 1) + ' FTE' : '—')}${linha('Duração', p.duracaoMeses != null ? fmt.n(p.duracaoMeses) + ' meses' : '—')}
          ${linha('Custo estimado', fmt.brl(p.custo))}${linha('Período previsto', `${fmt.data(p.inicioPrevisto)} a ${fmt.data(p.fimPrevisto)}`)}
          ${linha('Link', p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link)}</a>` : '—')}
          ${p.observacoes ? linha('Observações', esc(p.observacoes)) : ''}
        </div></div>`;
    secoes.forEach(s => { if(s.bind) s.bind(el.querySelector(`[data-secao="${s.id}"]`), p); });
    el.querySelector('[data-excluir]').onclick = () => GP.confirmar('Excluir projeto?', `<p><b>${esc(p.codigo)} · ${esc(p.titulo)}</b> será removido do acervo, com seu histórico. Use apenas para cadastros feitos por engano; para projetos interrompidos, mude a etapa para <b>Cancelado</b>.</p>`, 'Excluir', () => { P.excluir(p.id); GP.toast('Projeto excluído.'); GP.go('#/acervo'); }, {perigo:true});
    el.querySelector('[data-etapa]').onclick = () => {
      const m = GP.modal(`<h3>Mudar etapa</h3><p class="muted" style="margin:0 0 12px">Etapa atual: ${etapaPill(p.etapa)}</p>
        <div class="stack" style="gap:8px">${M.ETAPAS.map(e => `<label class="row" style="flex-wrap:nowrap;align-items:flex-start;cursor:pointer;border:1px solid var(--line);border-radius:10px;padding:10px"><input type="radio" name="et" value="${e.id}" ${e.id === p.etapa ? 'checked' : ''} style="margin-top:2px"><span><b>${esc(e.nome)}</b><br><span class="muted" style="font-size:12.5px">${esc(e.desc)}</span></span></label>`).join('')}</div>
        <label class="field" style="margin-top:12px">Motivo (opcional, fica no histórico)<input class="input" name="motivo" maxlength="200"></label>
        <div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn btn-primary" data-ok>Salvar</button></div>`);
      m.querySelector('[data-ok]').onclick = () => { const v = m.querySelector('input[name=et]:checked').value; const mot = m.querySelector('[name=motivo]').value.trim();
        if(v === 'nao_entra' && !mot){ GP.toast('Informe o motivo para "Não entra".'); return; }
        GP.closeModal(); if(P.mudarEtapa(p.id, v, mot)) GP.toast('Etapa atualizada.'); GP.refresh(); };
    };
  }

  GP.tela({ id:'novo', nivel:1, ordem:2, titulo:'Novo projeto', icone:'novo', render: telaForm });
  GP.tela({ id:'acervo', nivel:1, ordem:3, titulo:'Acervo de projetos', icone:'acervo', render: telaAcervo });
  GP.tela({ id:'projeto', nivel:1, titulo:'Projeto', icone:'acervo', menu:false, render: telaFicha });
})();
