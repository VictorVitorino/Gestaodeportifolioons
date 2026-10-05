/* =========================================================================
   Nível 1 - Cadastro: Novo/Editar projeto, Acervo e Ficha do projeto
   Extensões: GP.fichaSecoes (seções da ficha) e GP.acervoColunas (colunas extras)
   Utilitários das telas de Operação: GP.operacao (toast com ação, dias na etapa, menu ⋯, passos)
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt } = GP.util, icon = GP.icon;
  const plural = GP.util.plural || ((n, s, p) => `${n} ${Math.abs(+n) === 1 ? s : p}`);
  GP.fichaSecoes = GP.fichaSecoes || [];      // {id, nivel, ordem, titulo, render(p) → html, bind(el, p)}
  GP.acervoColunas = GP.acervoColunas || [];  // {nivel, coluna:{key,label,fmt,sortVal,align}}
  const etapaPill = id => { const e = M.etapa(id); return U.pill(e.nome, e.tom); };
  GP.etapaPill = etapaPill;

  /* ------------------------------------------- utilitários das telas de Operação */
  const OP = GP.operacao = GP.operacao || {};
  const svg = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  OP.ic = {
    esq: s => svg('<path d="M15 6l-6 6 6 6"/>', s), dir: s => svg('<path d="M9 6l6 6-6 6"/>', s),
    mais: s => svg('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>', s),
  };
  OP.plural = plural;
  /** Esconde o aviso flutuante para não cobrir o rodapé de um modal recém-aberto */
  OP.ocultarToast = () => { const t = document.querySelector('.toast.on'); if(t) t.classList.remove('on'); };
  /** Estado vazio com ícone de contexto (usa o 4º parâmetro do U.vazio quando existir) */
  OP.vazio = (titulo, texto, acao = '', ic = 'acervo') => { const h = U.vazio(titulo, texto, acao, ic); return ic === 'acervo' ? h : h.replace(icon('acervo', 22), icon(ic, 22)); };
  /** Toast com ação (ex.: Desfazer). Usa {acao,onAcao,ms} do núcleo; sem suporte, acrescenta o botão aqui. */
  OP.toast = (msg, acao, onAcao, ms = 8000) => {
    GP.toast(msg, { acao, onAcao, ms });
    const t = document.querySelector('.toast'); if(!t || !acao || t.querySelector('.toast-act, [data-op-acao]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'op-toast-act'; b.dataset.opAcao = '1'; b.textContent = acao;
    b.addEventListener('click', () => { t.classList.remove('on'); onAcao(); });
    t.appendChild(b); clearTimeout(GP.toast._t); GP.toast._t = setTimeout(() => t.classList.remove('on'), ms);
  };
  /** Dias inteiros desde uma data (AAAA-MM-DD local ou ISO) */
  OP.dias = d => { if(!d) return null; const t = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T00:00:00').getTime() : Date.parse(d); return isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 864e5)); };
  /** Data em que o projeto entrou na etapa atual (última mudança de etapa no histórico) */
  OP.desdeEtapa = p => { const h = (p.historico || []).filter(x => /^Etapa/.test(x.acao)).pop(); return h ? h.data : (p.dataEntrada || p.criadoEm); };
  OP.diasNaEtapa = p => OP.dias(OP.desdeEtapa(p));
  OP.txtNaEtapa = p => { const d = OP.diasNaEtapa(p); return d == null ? '' : d < 1 ? 'Entrou hoje na etapa' : plural(d, 'dia', 'dias') + ' na etapa'; };
  OP.iniciais = n => { const w = String(n || '').trim().split(/\s+/).filter(Boolean); return w.length ? (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase() : ''; };
  /** Menu ⋯ (itens são botões). inline:true mostra os itens como botões no computador e vira menu no celular. */
  OP.menu = (itens, { rotulo = 'Mais ações', inline = false } = {}) => `<div class="op-mais ${inline ? 'op-mais-inline' : ''}" data-op-mais><button type="button" class="icon-btn op-mais-btn" aria-haspopup="true" aria-expanded="false" aria-label="${esc(rotulo)}" title="${esc(rotulo)}">${OP.ic.mais(18)}</button><div class="op-mais-menu">${itens}</div></div>`;
  const fecharMenus = (exceto) => document.querySelectorAll('[data-op-mais].open').forEach(m => { if(m !== exceto){ m.classList.remove('open'); const b = m.querySelector('.op-mais-btn'); if(b) b.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('click', e => {
    const b = e.target.closest('.op-mais-btn');
    if(b){ const m = b.closest('[data-op-mais]'), abre = !m.classList.contains('open'); fecharMenus(m); m.classList.toggle('open', abre); b.setAttribute('aria-expanded', String(abre));
      if(abre){ const f = m.querySelector('.op-mais-menu button, .op-mais-menu a'); if(f) f.focus(); } return; }
    if(e.target.closest('.op-mais-menu button, .op-mais-menu a')){ fecharMenus(); return; }
    if(!e.target.closest('[data-op-mais]')) fecharMenus();
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.querySelector('[data-op-mais].open')){ const m = document.querySelector('[data-op-mais].open'); fecharMenus(); const b = m.querySelector('.op-mais-btn'); if(b) b.focus(); } });
  /** Cartão de primeiros passos (painel vazio e funil vazio) */
  OP.passos = ({ titulo, sub, passos, extra = '' }) => `<section class="card op-onboard" aria-label="${esc(titulo)}">
      <div class="op-onboard-h"><h2>${esc(titulo)}</h2><p>${sub}</p></div>
      <ol class="op-passos">${passos.map(([ic, t, d], i) => `<li><span class="op-passo-ic">${icon(ic, 20)}</span><span class="op-passo-n">Passo ${i + 1}</span><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
      <div class="op-onboard-acoes"><a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo cadastro</a><button class="btn btn-ghost" data-exemplos>Carregar exemplos</button>${extra}</div></section>`;

  /* --------------------------------------------------------- formulário */
  const OPCIONAIS = ['esforcoFte', 'duracaoMeses', 'custo', 'progresso', 'inicioPrevisto', 'fimPrevisto', 'link', 'observacoes'];
  const opt = (lista, sel, vazio = 'Selecione…') => `<option value="">${vazio}</option>` + lista.map(o => { const v = typeof o === 'string' ? o : o.id, l = typeof o === 'string' ? o : o.nome; return `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
  /** Campo acessível: rótulo com for, ajuda e erro fora do rótulo, ligados por aria-describedby */
  const campo = (k, html, {full, ajuda, hint} = {}) => {
    const req = M.OBRIGATORIOS.includes(k), desc = [ajuda ? `f-${k}-ajuda` : '', hint ? `f-${k}-hint` : '', `f-${k}-err`].filter(Boolean).join(' ');
    const ctrl = html.replace(/^<(input|select|textarea)/, m => `${m} id="f-${k}" aria-describedby="${desc}"${req ? ' required aria-required="true"' : ''}`);
    return `<div class="field ${full ? 'full' : ''}" data-campo="${k}"><label class="lbl" for="f-${k}">${esc(M.CAMPOS[k])}${req ? '<span class="req" aria-hidden="true">*</span>' : ''}</label>${ajuda ? `<small id="f-${k}-ajuda">${esc(ajuda)}</small>` : ''}${ctrl}${hint ? `<span class="hint" id="f-${k}-hint" data-hint="${k}" aria-live="polite"></span>` : ''}<span class="err-msg" id="f-${k}-err" data-err="${k}"></span></div>`;
  };
  const numeroCampo = (k, v, ph) => `<input class="input" name="${k}" value="${esc(fmt.campo(v))}" inputmode="decimal" autocomplete="off" placeholder="${ph}" data-numero="${k}">`;
  const NUM_FMT = { esforcoFte: n => fmt.n(n, n % 1 ? 1 : 0) + (n === 1 ? ' pessoa em tempo integral' : ' pessoas em tempo integral'), duracaoMeses: n => fmt.n(n, n % 1 ? 1 : 0) + (n === 1 ? ' mês' : ' meses'), custo: n => 'R$ ' + fmt.n(n, n % 1 ? 2 : 0) };
  const inp = (k, v, attrs = '') => `<input class="input" name="${k}" value="${esc(v ?? '')}" ${attrs}>`;
  const focarCampo = (el, k) => {
    const i = el.querySelector(`[name="${k}"]`); if(!i) return false;
    const d = i.closest('details'); if(d) d.open = true;
    const fld = i.closest('[data-campo]'); if(fld){ fld.classList.add('op-destaque'); setTimeout(() => fld.classList.remove('op-destaque'), 2400); }
    try { i.focus({ preventScroll:true }); } catch(e){ i.focus(); }
    i.scrollIntoView({ block:'center' }); return true;
  };

  function telaForm(el, r){
    const p = r.arg ? P.get(r.arg) : null;
    if(r.arg && !p){ el.innerHTML = OP.vazio('Projeto não encontrado', 'Ele pode ter sido excluído.', '<a class="btn btn-primary" href="#/acervo">Ir para o acervo</a>'); return; }
    const draftKey = p ? p.id : 'novo';
    const draft = GP.state().ui.rascunhos?.[draftKey];
    const v = draft ? Object.assign({},p || {},draft) : p || {};
    const abreOpc = OPCIONAIS.some(k => v[k] != null && v[k] !== '') || OPCIONAIS.includes(r.query.campo);
    el.innerHTML = `<div class="op-form-pg">` + U.pageHead({ titulo: p ? `Editar ${esc(p.codigo)}` : 'Novo cadastro',
        sub: p ? esc(p.titulo) : 'Cadastre o projeto ou demanda com as informações mínimas. Ele entra como <b>Nova demanda</b> e segue para o checklist de entrada.' }) +
      `<form class="op-form" novalidate data-form id="op-form">
        <div class="op-form-main stack">
        <div data-resumo-erros></div>
        ${draft ? '<div class="callout"><span class="ic">'+icon('relogio',16)+'</span><p>Rascunho recuperado. Revise os campos e salve o cadastro para incluí-lo nos indicadores. <button type="button" class="link" data-descartar-rascunho>Descartar rascunho</button></p></div>' : ''}
        <fieldset class="fieldset"><legend>O que é</legend><div class="form">
          ${campo('natureza', `<select class="select" name="natureza"><option value="projeto" ${v.natureza !== 'demanda' ? 'selected' : ''}>Projeto</option><option value="demanda" ${v.natureza === 'demanda' ? 'selected' : ''}>Demanda</option></select>`, {ajuda:'Classificação usada na comparação dos indicadores'})}
          ${campo('dataEntrada', inp('dataEntrada', v.dataEntrada || GP.util.hoje(), 'type="date" min="2000-01-01" max="2100-12-31"'), {ajuda:'Referência dos filtros de período e das entradas mensais'})}
          ${campo('titulo', inp('titulo', v.titulo, 'maxlength="140" placeholder="Ex.: Automação de testes dos modelos hidrológicos"'), {full:true})}
          ${campo('descricao', `<textarea class="input" name="descricao" maxlength="1200" placeholder="Qual problema resolve? O que será entregue?">${esc(v.descricao || '')}</textarea>`, {full:true})}
          ${campo('beneficio', inp('beneficio', v.beneficio, 'maxlength="300" placeholder="Ex.: reduzir em 30% o tempo das rodadas"'), {full:true, ajuda:'Resultado concreto esperado'})}
          ${campo('tipo', `<select class="select" name="tipo">${opt(M.CAT.tipos, v.tipo)}</select>`)}
          ${campo('origem', `<select class="select" name="origem">${opt(M.CAT.origens, v.origem, 'Não informada')}</select>`)}
          <label class="op-toggle full"><input type="checkbox" name="obrigatorio" ${v.obrigatorio ? 'checked' : ''}><span><b>Obrigatório por lei ou regulação</b><small>Passa à frente na fila da priorização.</small></span></label>
        </div></fieldset>
        <fieldset class="fieldset"><legend>Quem</legend><div class="form">
          ${campo('gerencia', `<select class="select" name="gerencia">${opt(M.CAT.gerencias, v.gerencia)}</select>`)}
          ${campo('area', inp('area', v.area, 'maxlength="120" placeholder="Ex.: Recursos Hidrológicos"'))}
          ${campo('ferramenta', inp('ferramenta', v.ferramenta, 'maxlength="80" placeholder="Ex.: NEWAVE, DESSEM, ANAREDE"'), {ajuda:'Ativo principal impactado pela iniciativa. Não substitui o inventário técnico.'})}
          ${campo('demandante', inp('demandante', v.demandante, 'maxlength="120" placeholder="Pessoa ou área que pediu"'))}
          ${campo('patrocinador', inp('patrocinador', v.patrocinador, 'maxlength="120" placeholder="Quem apoia e responde pela iniciativa"'))}
          ${campo('responsavel', inp('responsavel', v.responsavel, 'maxlength="120" placeholder="Quem conduz a execução"'))}
        </div></fieldset>
        <details class="fieldset op-opc" data-opcional ${abreOpc ? 'open' : ''}><summary><span class="op-opc-t">Quanto e quando</span><span class="op-opc-s">(opcional) · estimativas, datas e link</span><span class="op-opc-chev">${OP.ic.dir(16)}</span></summary><div class="form">
          ${campo('esforcoFte', numeroCampo('esforcoFte', v.esforcoFte, 'Ex.: 1,5'), {ajuda:'Pessoas em tempo integral', hint:true})}
          ${campo('duracaoMeses', numeroCampo('duracaoMeses', v.duracaoMeses, 'Ex.: 6'), {hint:true})}
          ${campo('custo', numeroCampo('custo', v.custo, 'Ex.: 150.000'), {ajuda:'Estimativa total, sem representar gasto realizado', hint:true})}
          ${campo('progresso', inp('progresso', v.progresso, 'inputmode="decimal" placeholder="Ex.: 45"'), {ajuda:'De 0 a 100, informado pelo responsável. Pode ficar em branco.'})}
          ${campo('inicioPrevisto', inp('inicioPrevisto', v.inicioPrevisto, 'type="date" min="2000-01-01" max="2100-12-31"'))}
          ${campo('fimPrevisto', inp('fimPrevisto', v.fimPrevisto, 'type="date" min="2000-01-01" max="2100-12-31"'))}
          ${campo('link', inp('link', v.link, 'maxlength="300" placeholder="https://…"'), {ajuda:'Item no Azure DevOps ou Jira', full:true})}
          ${campo('observacoes', `<textarea class="input" name="observacoes" maxlength="1200">${esc(v.observacoes || '')}</textarea>`, {full:true})}
        </div></details>
        </div>
        <aside class="op-form-aside" aria-label="Resumo do cadastro">
          <div class="op-form-resumo">
            <span class="op-eyebrow">Resumo do cadastro</span>
            <div class="op-prog"><div class="op-prog-n"><b data-prog-n>0 de ${M.OBRIGATORIOS.length}</b> obrigatórios preenchidos</div><div class="op-prog-tr" role="progressbar" aria-label="Campos obrigatórios preenchidos" aria-valuemin="0" aria-valuemax="${M.OBRIGATORIOS.length}" aria-valuenow="0" data-prog-tr><i data-prog-bar></i></div></div>
            <ul class="op-prog-lista">${M.OBRIGATORIOS.map(k => `<li data-req="${k}"><span class="op-prog-ok">${icon('check', 13)}</span>${esc(M.CAMPOS[k])}</li>`).join('')}</ul>
            <p class="op-depois">${p ? 'As alterações ficam registradas no histórico do projeto.' : 'Depois: entra como <b>Nova demanda</b> → checklist de entrada (6 perguntas, cerca de 1 minuto).'}</p>
          </div>
          <div class="op-form-acoes"><button class="btn btn-primary" type="submit">${icon('check', 16)} ${p ? 'Salvar alterações' : 'Cadastrar'}</button>
            <a class="btn btn-ghost" href="${p ? '#/projeto/' + p.id : '#/acervo'}">Cancelar</a><span class="op-obrig-nota"><span class="req" aria-hidden="true">*</span> obrigatório</span></div>
        </aside>
      </form></div>`;
    const f = el.querySelector('[data-form]');
    const progresso = () => {
      let n = 0; M.OBRIGATORIOS.forEach(k => { const i = f.elements.namedItem(k), ok = !!(i && String(i.value).trim()); if(ok) n++; const li = el.querySelector(`[data-req="${k}"]`); if(li) li.classList.toggle('ok', ok); });
      const t = M.OBRIGATORIOS.length; el.querySelector('[data-prog-n]').textContent = `${n} de ${t}`; el.querySelector('[data-prog-bar]').style.width = (n / t * 100) + '%'; el.querySelector('[data-prog-tr]').setAttribute('aria-valuenow', n);
    };
    const guardarRascunho = () => { const d = Object.fromEntries(new FormData(f).entries()); d.obrigatorio=f.elements.namedItem('obrigatorio').checked; (GP.state().ui.rascunhos ||= {})[draftKey]=d; GP.save(); };
    f.addEventListener('input', e => { guardarRascunho(); progresso(); limparErro(e.target); }); f.addEventListener('change', e => { guardarRascunho(); progresso(); limparErro(e.target); });
    const descartar = el.querySelector('[data-descartar-rascunho]'); if(descartar) descartar.onclick=()=>{ delete GP.state().ui.rascunhos[draftKey]; GP.save(); GP.refresh(); };
    const dica = i => { const n = GP.util.numBR(i.value), h = el.querySelector(`[data-hint="${i.dataset.numero}"]`); if(h) h.textContent = n === '' ? '' : isNaN(n) || n < 0 ? 'Valor não reconhecido' : '= ' + NUM_FMT[i.dataset.numero](n); };
    el.querySelectorAll('[data-numero]').forEach(i => { dica(i); i.addEventListener('input', () => dica(i)); });
    function limparErro(i){ if(!i || !i.classList || !i.classList.contains('err') || !String(i.value).trim()) return; i.classList.remove('err'); i.removeAttribute('aria-invalid'); const s = el.querySelector(`[data-err="${i.name}"]`); if(s) s.textContent = ''; }
    progresso();
    el.querySelector('[data-resumo-erros]').addEventListener('click', e => { const a = e.target.closest('[data-ir-campo]'); if(a){ e.preventDefault(); focarCampo(el, a.dataset.irCampo); } });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f).entries()); d.obrigatorio = f.elements.namedItem('obrigatorio').checked;
      ['esforcoFte', 'duracaoMeses', 'custo', 'progresso'].forEach(k => { d[k] = GP.util.numBR(d[k]); });
      const res = p ? P.atualizar(p.id, d) : P.criar(d);
      el.querySelectorAll('[data-err]').forEach(x => x.textContent = ''); el.querySelectorAll('.err').forEach(x => { x.classList.remove('err'); x.removeAttribute('aria-invalid'); });
      const resumo = el.querySelector('[data-resumo-erros]'); resumo.innerHTML = '';
      if(!res.ok){
        const ks = Object.keys(res.erros).filter(k => f.elements[k]);
        ks.forEach(k => { const s = el.querySelector(`[data-err="${k}"]`); if(s) s.innerHTML = `${icon('alerta', 13)}<span>${esc(res.erros[k])}</span>`; const i = f.elements[k]; if(i && i.classList){ i.classList.add('err'); i.setAttribute('aria-invalid', 'true'); const dt = i.closest('details'); if(dt) dt.open = true; } });
        const soObrig = ks.every(k => res.erros[k] === 'Campo obrigatório.');
        resumo.innerHTML = `<div class="op-erros" role="alert"><span class="ic">${icon('alerta', 18)}</span><div><b>${soObrig ? `Faltam ${plural(ks.length, 'campo obrigatório', 'campos obrigatórios')}:` : `Revise ${plural(ks.length, 'campo', 'campos')} antes de ${p ? 'salvar' : 'cadastrar'}:`}</b>
          <p>${ks.map(k => `<a href="#f-${k}" data-ir-campo="${k}">${esc(M.CAMPOS[k])}</a>`).join(', ')}</p></div></div>`;
        const first = f.querySelector('.err'); if(first) first.focus();
        if(!ks.length) GP.toast(esc(Object.values(res.erros)[0] || 'Revise os campos.'));
        return;
      }
      delete GP.state().ui.rascunhos?.[draftKey]; GP.save();
      const id = res.projeto.id;
      GP.go('#/projeto/' + id);
      if(p) GP.toast('Alterações salvas.');
      else OP.toast(`Registro <b>${esc(res.projeto.codigo)}</b> cadastrado como Nova demanda.`, 'Fazer o checklist agora', () => GP.abrirEntrada && GP.abrirEntrada(id), 9000);
    });
    if(r.query.campo){ const k = r.query.campo; focarCampo(el, k); setTimeout(() => { const i = el.querySelector(`[name="${k}"]`); if(i && document.activeElement !== i) focarCampo(el, k); }, 80); }
  }

  /* ---------------------------------------------------------------- acervo */
  const GRUPOS = [['todos', 'Todos'], ['andamento', 'Em andamento'], ['concluido', 'Concluídos'], ['fora', 'Não entram / cancelados']];
  const FILTROS_SEL = ['gerencia', 'etapa', 'tipo'];
  function filtrar(lista, f){
    const q = GP.util.normTxt((f.q || '').trim());
    return lista.filter(p => (!f.grupo || f.grupo === 'todos' || M.etapa(p.etapa).grupo === f.grupo)
      && (!f.etapa || p.etapa === f.etapa) && (!f.gerencia || p.gerencia === f.gerencia) && (!f.tipo || p.tipo === f.tipo)
      && (!q || GP.util.normTxt([p.codigo, p.titulo, p.area, p.ferramenta, p.responsavel, p.demandante].join(' ')).includes(q)));
  }
  const filtroAtual = () => { const S = GP.state(); return S.ui.filtroAcervo = Object.assign({ grupo:'todos', q:'', gerencia:'', tipo:'', etapa:'' }, S.ui.filtroAcervo); };
  const rotuloFiltro = (k, v) => k === 'etapa' ? M.etapa(v).nome : v;
  /** Colunas do acervo (as mesmas usadas para ordenar a navegação da ficha) */
  function colunasAcervo(){
    return [
      { key:'titulo', label:'Projeto', align:'op-c-proj', fmt:(v, r) => { const sub = [r.gerencia, r.area, r.ferramenta].filter(Boolean).join(' · ');
        return `<span class="op-proj"><span class="op-tit" title="${esc(r.codigo)} · ${esc(v)}"><span class="code">${esc(r.codigo)}</span> <b>${esc(v)}</b></span>${sub ? `<small class="op-sub" title="${esc(sub)}">${esc(sub)}</small>` : ''}</span>`; } },
      { key:'gerencia', label:'Gerência', align:'op-hide-lg' },
      { key:'tipo', label:'Tipo', align:'op-hide-lg op-c-tipo', fmt:(v, r) => `${esc(v)}${r.obrigatorio ? ' <span class="tag" title="Obrigatório por lei ou regulação">obrigatório</span>' : ''}` },
      { key:'etapa', label:'Etapa', align:'op-c-etapa', fmt:v => etapaPill(v), sortVal:r => M.etapa(r.etapa).ordem },
      ...GP.acervoColunas.filter(c => c.nivel <= GP.nivel()).map(c => c.coluna),
      { key:'responsavel', label:'Responsável', align:'op-c-resp', fmt:(v, r) => `${v ? esc(v) : '<span class="dim">Sem responsável</span>'}<small class="op-fim-sub">${r.fimPrevisto ? 'até ' + fmt.data(r.fimPrevisto) : 'sem prazo'}</small>` },
      { key:'fimPrevisto', label:'Fim previsto', align:'op-c-fim op-show-xl', fmt:v => v ? fmt.data(v) : '<span class="dim">Sem data</span>' },
    ];
  }
  /** Mesma ordenação do U.table (chave S.ui['sort:acervo']) */
  function ordenar(rows, cols, sk){
    const c = sk && cols.find(x => x.key === sk.key); if(!c) return rows.slice();
    const g = c.sortVal || (r => r[c.key]);
    return rows.slice().sort((a, b) => { const x = g(a), y = g(b); const r = (typeof x === 'number' || typeof y === 'number') ? (x ?? -Infinity) - (y ?? -Infinity) : String(x ?? '').localeCompare(String(y ?? ''), 'pt-BR', { sensitivity:'base', numeric:true }); return r * sk.dir; });
  }
  function descreverFiltro(f){
    const partes = [];
    if(f.grupo && f.grupo !== 'todos') partes.push((GRUPOS.find(g => g[0] === f.grupo) || [])[1]);
    FILTROS_SEL.forEach(k => { if(f[k]) partes.push(rotuloFiltro(k, f[k])); });
    if(f.q) partes.push(`“${f.q}”`);
    return partes.filter(Boolean).join(' · ');
  }
  function folhaFiltros(){
    const f = filtroAtual();
    const sel = (k, todos, opcoes) => `<label class="field"><span class="lbl">${esc(M.CAMPOS[k])}</span><select class="select" data-ff="${k}"><option value="">${todos}</option>${opcoes.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    const m = GP.modal(`<h3>Filtros</h3><p class="muted" style="margin:0 0 14px">Combine os filtros para encontrar projetos no acervo.</p><div class="stack" style="gap:14px">
        ${sel('gerencia', 'Todas as gerências', M.CAT.gerencias.map(g => [g.id, g.nome]))}
        ${sel('etapa', 'Todas as etapas', M.ETAPAS.map(e => [e.id, e.nome]))}
        ${sel('tipo', 'Todos os tipos', M.CAT.tipos.map(t => [t, t]))}</div>
      <div class="m-act"><button class="btn btn-ghost" data-ff-limpar>Limpar</button><button class="btn btn-primary" data-ff-ok>Aplicar</button></div>`);
    m.querySelector('[data-ff-limpar]').onclick = () => { FILTROS_SEL.forEach(k => f[k] = ''); GP.save(); GP.closeModal(); GP.refresh(); };
    m.querySelector('[data-ff-ok]').onclick = () => { m.querySelectorAll('[data-ff]').forEach(s => f[s.dataset.ff] = s.value); GP.save(); GP.closeModal(); GP.refresh(); };
  }
  function telaAcervo(el){
    const f = filtroAtual();
    const todos = P.todos();
    const head = acoes => U.pageHead({ titulo:'Acervo', sub:'Todos os projetos e demandas, em qualquer etapa do fluxo.', acoes });
    if(!todos.length){
      el.innerHTML = `<div class="op-acervo">${head('')}` +
        OP.vazio('Nenhum projeto cadastrado ainda', 'Comece cadastrando um projeto ou demanda, ou carregue exemplos fictícios para conhecer o sistema.',
          `<div class="row" style="justify-content:center;margin-top:12px"><a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo cadastro</a><button class="btn btn-ghost" data-importar-csv>${icon('upload', 16)} Importar planilha</button><button class="btn btn-ghost" data-exemplos>Carregar exemplos</button></div>`) + '</div>';
      return;
    }
    const lista = filtrar(todos, f), cols = colunasAcervo();
    const ativos = FILTROS_SEL.filter(k => f[k]);
    const algum = !!(f.q || ativos.length);
    el.innerHTML = `<div class="op-acervo">` + head(OP.menu(`<button class="btn btn-ghost" data-importar-csv>${icon('upload', 16)} Importar</button><button class="btn btn-ghost" data-exportar-csv>${icon('download', 16)} Exportar para Excel</button>`, { rotulo:'Importar ou exportar', inline:true }) + `<a class="btn btn-primary op-novo" href="#/novo">${icon('novo', 16)} <span>Novo cadastro</span></a>`) +
      `<div class="op-chips-row"><div class="chips scroll-fade op-chips" role="group" aria-label="Filtrar por situação">${GRUPOS.map(([k, l]) => `<button class="chip ${f.grupo === k ? 'on' : ''}" data-grupo="${k}" aria-pressed="${f.grupo === k}">${l} <b>${filtrar(todos, {grupo:k}).length}</b></button>`).join('')}</div>
        <span class="op-count" aria-live="polite">${lista.length === todos.length ? plural(lista.length, 'projeto', 'projetos') : `${plural(lista.length, 'projeto', 'projetos')} de ${todos.length}`}</span></div>
      <div class="filters op-filtros">
        <div class="search"><span class="ic">${icon('busca', 16)}</span><input class="input" type="search" data-f="q" value="${esc(f.q)}" placeholder="Buscar por nome, código ou pessoa" aria-label="Buscar por nome, código ou pessoa"></div>
        <select class="select op-f-sel" data-f="gerencia" aria-label="Gerência"><option value="">Todas as gerências</option>${M.CAT.gerencias.map(g => `<option value="${g.id}" ${f.gerencia === g.id ? 'selected' : ''}>${g.id}</option>`).join('')}</select>
        <select class="select op-f-sel" data-f="etapa" aria-label="Etapa"><option value="">Todas as etapas</option>${M.ETAPAS.map(e => `<option value="${e.id}" ${f.etapa === e.id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}</select>
        <select class="select op-f-sel" data-f="tipo" aria-label="Tipo"><option value="">Todos os tipos</option>${M.CAT.tipos.map(t => `<option ${f.tipo === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
        <button class="btn btn-ghost op-f-btn" type="button" data-filtros-folha aria-haspopup="dialog" aria-label="Filtros${ativos.length ? ` (${ativos.length} ativos)` : ''}">${icon('funil', 16)}<span class="op-f-rot">Filtros</span>${ativos.length ? `<span class="op-f-n">(${ativos.length})</span>` : ''}</button>
        ${algum ? `<button class="btn btn-ghost btn-sm op-f-limpar" data-limpar>Limpar filtros</button>` : ''}
      </div>
      ${ativos.length ? `<div class="op-acervo-info"><span class="dim">Filtros:</span>${ativos.map(k => `<button class="op-fchip" data-rm-filtro="${k}" aria-label="Remover filtro ${esc(rotuloFiltro(k, f[k]))}">${esc(rotuloFiltro(k, f[k]))} ${icon('x', 12)}</button>`).join('')}</div>` : ''}
      ${lista.length ? `<div class="op-acervo-tbl">${U.table({ id:'acervo', cartoes:'sm', cols, rows:lista, rowAttr:r => `class="click" data-abrir="${r.id}" tabindex="0"`, vazioTxt:'Nenhum projeto com estes filtros.' })}</div>`
        : OP.vazio('Nenhum projeto encontrado', algum ? 'Nenhum projeto combina com a busca e os filtros. Tente outro termo ou limpe os filtros.' : 'Não há projetos nesta situação.', algum ? `<div class="row" style="justify-content:center;margin-top:12px"><button class="btn btn-ghost" data-limpar>${icon('x', 15)} Limpar filtros</button></div>` : '', algum ? 'busca' : 'acervo')}</div>`;
    el.querySelectorAll('[data-grupo]').forEach(b => b.onclick = () => { f.grupo = b.dataset.grupo; GP.save(); GP.refresh(); });
    el.querySelectorAll('[data-f]').forEach(i => { const ev = i.tagName === 'INPUT' ? 'input' : 'change';
      i.addEventListener(ev, () => { f[i.dataset.f] = i.value; GP.save(); clearTimeout(telaAcervo._t); telaAcervo._t = setTimeout(() => { const pos = i.selectionStart; GP.refresh(); const n = document.querySelector(`[data-f="${i.dataset.f}"]`); if(n && ev === 'input'){ n.focus(); try { n.setSelectionRange(pos, pos); } catch(e){} } }, ev === 'input' ? 250 : 0); }); });
    el.querySelectorAll('[data-limpar]').forEach(lp => lp.onclick = () => { Object.assign(f, { q:'', gerencia:'', tipo:'', etapa:'' }); GP.save(); GP.refresh(); });
    el.querySelectorAll('[data-rm-filtro]').forEach(b => b.onclick = () => { f[b.dataset.rmFiltro] = ''; GP.save(); GP.refresh(); });
    el.querySelector('[data-filtros-folha]').onclick = folhaFiltros;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-abrir]'); if(a){ GP.go('#/projeto/' + a.dataset.abrir); return; }
    if(e.target.closest('[data-exemplos]')){ const n = GP.modelo.carregarExemplos(); GP.toast(n ? `${plural(n, 'projeto de exemplo carregado', 'projetos de exemplo carregados')}.` : 'Os exemplos já estão carregados.'); GP.refresh(); }
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ const a = e.target.closest && e.target.closest('[data-abrir]'); if(a) GP.go('#/projeto/' + a.dataset.abrir); }
    if(e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && GP.rota().id === 'projeto' && !document.querySelector('.modal-bg')){
      const t = e.target; if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const b = document.querySelector(`[data-nav="${e.key === 'ArrowLeft' ? 'ant' : 'prox'}"]`);
      e.preventDefault(); if(b && !b.disabled) b.click();
    }
  });

  /* ----------------------------------------------------------------- ficha */
  const FLUXO = ['entrada', 'triagem', 'aprovado', 'execucao', 'concluido'], SAIDAS = ['espera', 'nao_entra', 'cancelado'];
  const MOTIVO_OBRIG = ['nao_entra', 'cancelado'];
  /** Campos que cada pergunta de informação do checklist pede */
  const CAMPOS_ENTRADA = { E4:['descricao', 'beneficio'], E5:['demandante', 'patrocinador'], E6:['esforcoFte', 'duracaoMeses'] };
  OP.CAMPOS_ENTRADA = CAMPOS_ENTRADA;
  const vazioCampo = v => v == null || String(v).trim() === '';
  function navegacao(p){
    const S = GP.state(), f = filtroAtual(), cols = colunasAcervo(), sk = S.ui['sort:acervo'];
    let lista = ordenar(filtrar(P.todos(), f), cols, sk), filtro = descreverFiltro(f);
    if(!lista.some(x => x.id === p.id)){ lista = ordenar(P.todos(), cols, sk); filtro = ''; }
    const i = lista.findIndex(x => x.id === p.id);
    return { i, n:lista.length, ant:lista[i - 1], prox:lista[i + 1], filtro };
  }
  function proximoPasso(p){
    const sec = (tom, ic, titulo, texto, acoes = '', extra = '') => `<section class="op-proximo t-${tom}" aria-label="Próximo passo"><span class="op-proximo-ic">${icon(ic, 20)}</span><div class="op-proximo-txt"><span class="op-eyebrow">Próximo passo</span><b>${titulo}</b><p>${texto}</p>${extra}</div>${acoes ? `<div class="op-proximo-acoes">${acoes}</div>` : ''}</section>`;
    const btnChecklist = rot => `<button class="btn btn-primary" data-entrada="${p.id}">${icon('funil', 16)} ${rot}</button>`;
    if(p.etapa === 'entrada') return sec('info', 'funil', 'Responda o checklist de entrada', '6 perguntas de Sim ou Não, cerca de 1 minuto. O resultado indica se entra no portfólio, se falta informação ou se não entra.', btnChecklist('Fazer o checklist'));
    if(p.etapa === 'triagem'){
      const resp = (p.entrada && p.entrada.respostas) || {};
      const pedidas = Object.keys(CAMPOS_ENTRADA).filter(q => resp[q] === 'nao').flatMap(q => CAMPOS_ENTRADA[q]);
      const faltam = [...new Set(pedidas.length ? pedidas : Object.values(CAMPOS_ENTRADA).flat())].filter(k => vazioCampo(p[k]));
      const links = faltam.length ? `<ul class="op-faltam">${faltam.map(k => `<li><a href="#/novo/${p.id}?campo=${k}">${icon('editar', 14)} ${esc(M.CAMPOS[k])}</a></li>`).join('')}</ul>` : '';
      return sec('warn', 'alerta', faltam.length ? `Falta informação: complete ${plural(faltam.length, 'campo', 'campos')}` : 'Informações completadas: reavalie a entrada',
        faltam.length ? 'Complete os campos abaixo com o demandante e depois reavalie o checklist.' : 'Os campos pedidos no checklist já foram preenchidos. Refaça o checklist para registrar a decisão.', btnChecklist('Reavaliar'), links);
    }
    if(p.etapa === 'aprovado'){
      const n2 = GP.nivel() >= 2, s = M.pontuar(p);
      if(s.completo){
        // já avaliado: informa a posição entre os admitidos (mesma ordem do ranking) em vez de pedir nova avaliação
        const rk = M.ranking(P.todos().filter(x => x.etapa === 'aprovado'), { obrigatoriosNoTopo: GP.state().ui.rankObrig !== false }), x = rk.find(y => y.p.id === p.id);
        const Q = M.QUADRANTES[s.quadrante], nota = `Valor ${fmt.n(s.valor, 1)} · esforço ${fmt.n(s.esforco, 1)}${Q ? ' · ' + esc(Q.nome) : ''}.`;
        if(!n2) return sec('ok', 'relogio', 'Avaliado: aguarda início', `${nota} A ordem de início entre os admitidos aparece no ranking, disponível no nível 2.`, `<button class="btn btn-ghost" data-ajuda-nivel>Entender os níveis</button>`);
        return sec('ok', 'ranking', x ? `Avaliado: ${x.pos}º de ${rk.length} no ranking` : 'Avaliado: aguarda início', `${nota} Aguarda a decisão de início; quando começar, mude a etapa para Em execução.`,
          `<a class="btn btn-ghost" href="#/ranking" data-ver-ranking="${p.id}">${icon('ranking', 16)} Ver no ranking</a>`);
      }
      const parcial = s.faltam && Object.keys((p.avaliacao && p.avaliacao.respostas) || {}).length;
      return sec('ok', 'ranking', parcial ? `Avaliação incompleta: ${s.faltam === 1 ? 'falta 1 resposta' : `faltam ${s.faltam} respostas`}` : 'Aguarda priorização (nível 2)',
        n2 ? (parcial ? 'Conclua as perguntas de prioridade para que o projeto entre no ranking.' : 'Responda as perguntas de prioridade para que o projeto entre no ranking.') : 'Entrou no portfólio. A ordem de início é definida na priorização, disponível no nível 2.',
        n2 ? `<a class="btn btn-primary" href="#/avaliar/${p.id}">${icon('avaliar', 16)} ${parcial ? 'Concluir avaliação' : 'Avaliar prioridade'}</a>` : `<button class="btn btn-ghost" data-ajuda-nivel>Entender os níveis</button>`);
    }
    if(p.etapa === 'execucao') return sec('ok', 'relogio', 'Mantenha o avanço atualizado', p.progresso == null ? 'O avanço físico ainda não foi informado.' : `Avanço físico informado: ${fmt.n(p.progresso, p.progresso % 1 ? 1 : 0)}%.`, `<a class="btn btn-ghost" href="#/novo/${p.id}?campo=progresso">${icon('editar', 16)} Atualizar avanço</a>`);
    if(p.etapa === 'espera') return sec('neutral', 'relogio', 'Pausado por decisão', 'Retome o projeto quando a condição que motivou a pausa mudar.');
    return '';
  }
  function stepper(p){
    const idx = FLUXO.indexOf(p.etapa), saida = SAIDAS.includes(p.etapa);
    return `<div class="op-stepper-wrap"><ol class="op-stepper" aria-label="Etapas do fluxo">${FLUXO.map((id, i) => { const cls = idx < 0 ? '' : i < idx ? 'feito' : i === idx ? 'atual' : '';
        return `<li class="${cls}" ${cls === 'atual' ? 'aria-current="step"' : ''}><span class="op-step-dot">${cls === 'feito' ? icon('check', 12) : i + 1}</span><span class="op-step-nome">${esc(M.etapa(id).nome)}</span></li>`; }).join('')}</ol>
      ${saida ? `<span class="op-step-saida" aria-current="step"><span class="dim">Saída do fluxo:</span> ${etapaPill(p.etapa)}</span>` : ''}</div>`;
  }
  /** Histórico: junta a mudança de etapa automática ao evento de Entrada e corrige textos antigos */
  function historico(p){
    const itens = [];
    (p.historico || []).forEach(h => { const ant = itens[itens.length - 1];
      if(ant && h.acao === 'Etapa' && ant.acao === 'Entrada' && !ant.sub && Math.abs(Date.parse(h.data) - Date.parse(ant.data)) <= 2000){ ant.sub = String(h.detalhe || '').split('. Motivo:')[0]; return; }
      itens.push(Object.assign({}, h)); });
    const det = h => { let d = String(h.detalhe || '').replace(/(\d+)\s+([A-Za-zÀ-ÿ]+)\(s\)/g, (m, n, w) => `${n} ${+n === 1 ? w : w + 's'}`);
      if(h.acao === 'Priorização') d = d.replace(/(\d)\.(\d)/g, '$1,$2'); return d; };
    return itens.reverse().map(h => `<li class="op-hist-item"><span class="op-hist-dot" aria-hidden="true"></span><div><div class="op-hist-h"><b>${esc(h.acao)}</b><time class="dim">${fmt.dataHora(h.data)}</time></div>${h.detalhe ? `<div class="op-hist-d">${esc(det(h))}</div>` : ''}${h.sub ? `<div class="op-hist-sub">${icon('seta', 13)} Etapa: ${esc(h.sub)}</div>` : ''}</div></li>`).join('');
  }
  function dados(p){
    const val = (k, v) => ({ k, v });
    const periodo = !p.inicioPrevisto && !p.fimPrevisto ? null : p.inicioPrevisto && p.fimPrevisto ? `${fmt.data(p.inicioPrevisto)} a ${fmt.data(p.fimPrevisto)}` : p.inicioPrevisto ? `a partir de ${fmt.data(p.inicioPrevisto)}` : `até ${fmt.data(p.fimPrevisto)}`;
    const grupos = [
      ['Pessoas', [['Demandante', p.demandante && esc(p.demandante)], ['Patrocinador', p.patrocinador && esc(p.patrocinador)], ['Responsável', p.responsavel && esc(p.responsavel)]]],
      ['Estimativas', [['Esforço', p.esforcoFte != null ? fmt.n(p.esforcoFte, p.esforcoFte % 1 ? 1 : 0) + (p.esforcoFte === 1 ? ' pessoa (FTE)' : ' pessoas (FTE)') : null], ['Duração', p.duracaoMeses != null ? fmt.n(p.duracaoMeses, p.duracaoMeses % 1 ? 1 : 0) + (p.duracaoMeses === 1 ? ' mês' : ' meses') : null],
        ['Custo estimado', p.custo != null && p.custo !== '' ? fmt.brl(p.custo) : null], ['Avanço físico', p.etapa === 'concluido' ? '100% (concluído)' : p.progresso != null ? fmt.n(p.progresso, p.progresso % 1 ? 1 : 0) + '%' : null]]],
      ['Datas', [['Entrada', p.dataEntrada ? fmt.data(p.dataEntrada) : null], ['Período previsto', periodo || '<span class="dim">Sem datas previstas</span>']]],
    ];
    const extras = [['Link', p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link)}</a>` : null], ['Observações', p.observacoes ? esc(p.observacoes) : null]].filter(x => x[1]);
    const faltam = ['beneficio', 'area', 'ferramenta', 'origem', 'demandante', 'patrocinador', 'responsavel', 'esforcoFte', 'duracaoMeses', 'custo', 'inicioPrevisto', 'fimPrevisto'].filter(k => vazioCampo(p[k]));
    return `<div class="card op-o-dados">${U.secH('Dados')}
      ${grupos.map(([g, ls]) => { const v = ls.filter(x => x[1]); return v.length ? `<div class="op-dgrupo"><h4>${g}</h4><dl>${v.map(([r, x]) => `<div><dt>${r}</dt><dd>${x}</dd></div>`).join('')}</dl></div>` : ''; }).join('')}
      ${extras.length ? `<div class="op-dgrupo"><h4>Mais</h4><dl>${extras.map(([r, x]) => `<div><dt>${r}</dt><dd>${x}</dd></div>`).join('')}</dl></div>` : ''}
      ${faltam.length ? `<a class="op-completar" href="#/novo/${p.id}?campo=${faltam[0]}">${icon('editar', 15)} Completar ${plural(faltam.length, 'campo', 'campos')}</a>` : ''}</div>`;
  }
  function telaFicha(el, r){
    const p = P.get(r.arg);
    if(!p){ el.innerHTML = OP.vazio('Projeto não encontrado', 'Ele pode ter sido excluído.', '<a class="btn btn-primary" href="#/acervo">Ir para o acervo</a>'); return; }
    const g = M.CAT.gerencias.find(x => x.id === p.gerencia);
    const secoes = GP.fichaSecoes.filter(s => s.nivel <= GP.nivel()).sort((a, b) => a.ordem - b.ordem);
    const nav = navegacao(p), prox = proximoPasso(p), temPrimario = /btn-primary/.test(prox);
    const chips = [['Gerência', g ? g.nome : p.gerencia], ['Área', p.area], ['Ferramenta', p.ferramenta], ['Natureza', p.natureza === 'demanda' ? 'Demanda' : 'Projeto'], ['Origem', p.origem]].filter(x => x[1]);
    el.innerHTML = `<div class="op-ficha">
      <div class="op-ficha-top"><a class="link op-voltar" href="#/acervo">${icon('voltar', 16)} Acervo</a>
        ${nav.n > 1 ? `<div class="op-nav" role="group" aria-label="Navegar entre os projetos do acervo">${nav.filtro ? `<span class="op-nav-filtro" title="Filtro do acervo">Filtro: ${esc(nav.filtro)}</span>` : ''}
          <button class="icon-btn" data-nav="ant" aria-label="${nav.ant ? 'Projeto anterior: ' + esc(nav.ant.codigo) : 'Não há projeto anterior'}" title="Anterior (Alt + ←)" ${nav.ant ? '' : 'disabled'}>${OP.ic.esq(18)}</button>
          <span class="op-nav-pos" aria-live="polite"><b>${nav.i + 1}</b> de ${nav.n}</span>
          <button class="icon-btn" data-nav="prox" aria-label="${nav.prox ? 'Próximo projeto: ' + esc(nav.prox.codigo) : 'Não há próximo projeto'}" title="Próximo (Alt + →)" ${nav.prox ? '' : 'disabled'}>${OP.ic.dir(18)}</button></div>` : ''}</div>
      <div class="page-h op-ficha-h"><div class="op-ficha-tt"><span class="op-eyebrow code">${esc(p.codigo)}</span><h1 title="${esc(p.titulo)}">${esc(p.titulo)}</h1>
          <p class="op-ficha-sub">${etapaPill(p.etapa)}${p.tipo ? `<span>${esc(p.tipo)}</span>` : ''}${p.obrigatorio ? '<span class="tag">obrigatório por lei/regulação</span>' : ''}${p.exemplo ? '<span class="tag">exemplo fictício</span>' : ''}</p></div>
        <div class="actions"><a class="btn btn-ghost" href="#/novo/${p.id}">${icon('editar', 16)} Editar</a><button class="btn ${temPrimario ? 'btn-ghost' : 'btn-primary'}" data-etapa>${icon('seta', 16)} Mudar etapa</button>${OP.menu(`<button class="op-mais-item op-perigo" data-excluir>${icon('lixo', 16)} Excluir cadastro</button>`, { rotulo:'Mais ações' })}</div></div>
      ${stepper(p)}
      ${prox}
      ${chips.length ? `<ul class="op-chips-resumo" aria-label="Resumo">${chips.map(([k, v]) => `<li><small>${k}</small><span>${esc(v)}</span></li>`).join('')}</ul>` : ''}
      <div class="op-ficha-grid">
        <div class="op-ficha-main">
          <div class="card op-o-desc">${U.secH('Descrição')}<p class="op-desc">${esc(p.descricao)}</p>${p.beneficio ? `<p class="op-benef"><b>Benefício esperado</b>${esc(p.beneficio)}</p>` : ''}</div>
          ${secoes.map(s => `<div class="card op-o-sec op-o-${esc(s.id)}" data-secao="${s.id}">${U.secH(s.titulo)}${s.render(p)}</div>`).join('')}
          <div class="card op-o-hist">${U.secH('Histórico', 'Tudo o que aconteceu com o projeto, do mais recente ao mais antigo.')}
            ${(p.historico || []).length ? `<ol class="op-hist">${historico(p)}</ol>` : '<span class="dim">Sem registros.</span>'}</div>
        </div>
        <aside class="op-ficha-aside">${dados(p)}</aside></div></div>`;
    secoes.forEach(s => { if(s.bind) s.bind(el.querySelector(`[data-secao="${s.id}"]`), p); });
    el.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { const alvo = b.dataset.nav === 'ant' ? nav.ant : nav.prox; if(alvo) GP.go('#/projeto/' + alvo.id); });
    el.querySelector('[data-excluir]').onclick = () => GP.confirmar('Excluir cadastro?', `<p><b>${esc(p.codigo)} · ${esc(p.titulo)}</b> será removido do acervo, com seu histórico. Use apenas para cadastros feitos por engano; para projetos interrompidos, mude a etapa para <b>Cancelado</b>.</p>`, 'Excluir', () => {
      const S = GP.state(), pos = S.projetos.findIndex(x => x.id === p.id), copia = GP.util.clone(p);
      P.excluir(p.id); GP.go('#/acervo');
      OP.toast(`<b>${esc(p.codigo)}</b> excluído.`, 'Desfazer', () => { const S2 = GP.state(); if(S2.projetos.some(x => x.id === copia.id)) return;
        S2.projetos.splice(Math.max(0, Math.min(pos, S2.projetos.length)), 0, copia); GP.save(); GP.go('#/projeto/' + copia.id); GP.toast(`<b>${esc(copia.codigo)}</b> restaurado.`); });
    }, {perigo:true});
    el.querySelector('[data-etapa]').onclick = () => modalEtapa(p);
    const vr = el.querySelector('[data-ver-ranking]');
    if(vr && GP.priorizacao && GP.priorizacao.verNoRanking) vr.onclick = e => { e.preventDefault(); GP.priorizacao.verNoRanking(p.id); };
  }

  /* ------------------------------------------------------ mudar etapa */
  function modalEtapa(p){
    OP.ocultarToast();
    const sugerida = p.etapa === 'espera' ? 'execucao' : FLUXO[FLUXO.indexOf(p.etapa) + 1] || null;
    const opc = id => { const e = M.etapa(id); return `<label class="op-et-opc"><input type="radio" name="et" value="${e.id}" ${e.id === p.etapa ? 'checked' : ''}><span class="op-et-txt"><span class="op-et-nome"><b>${esc(e.nome)}</b>${e.id === p.etapa ? '<span class="op-selo">atual</span>' : ''}${e.id === sugerida ? '<span class="op-selo t-ok">Próxima etapa sugerida</span>' : ''}</span><small>${esc(e.desc)}</small></span></label>`; };
    const m = GP.modal(`<h3>Mudar etapa</h3><p class="muted" style="margin:0 0 14px">Etapa atual: ${etapaPill(p.etapa)}</p>
      <div class="op-et-grupos"><fieldset class="op-et-grupo"><legend>Seguir no fluxo</legend>${FLUXO.map(opc).join('')}</fieldset>
        <fieldset class="op-et-grupo"><legend>Encerrar ou pausar</legend>${SAIDAS.map(opc).join('')}</fieldset></div>
      <div data-aviso-checklist></div>
      <div class="field op-motivo"><label class="lbl" for="op-motivo">Motivo <span class="op-motivo-tag" data-motivo-tag></span></label>
        <input class="input" id="op-motivo" name="motivo" maxlength="200" aria-describedby="op-motivo-err" placeholder="Fica registrado no histórico"><span class="err-msg" id="op-motivo-err" data-err-motivo></span></div>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn btn-primary" data-ok>Salvar</button></div>`);
    m.classList.add('op-etapa-modal');
    const mot = m.querySelector('[name=motivo]'), err = m.querySelector('[data-err-motivo]');
    const sel = () => (m.querySelector('input[name=et]:checked') || {}).value;
    const atualizar = () => {
      const v = sel(), obrig = MOTIVO_OBRIG.includes(v);
      const tag = m.querySelector('[data-motivo-tag]'); tag.textContent = obrig ? '(obrigatório para Não entra e Cancelado)' : '(opcional, fica no histórico)'; tag.classList.toggle('obrig', obrig);
      if(obrig) mot.setAttribute('aria-required', 'true'); else mot.removeAttribute('aria-required');
      if(!obrig){ err.textContent = ''; mot.classList.remove('err'); mot.removeAttribute('aria-invalid'); }
      const aviso = ['entrada', 'triagem'].includes(p.etapa) && ['aprovado', 'execucao'].includes(v) && !p.entrada;
      const caixa = m.querySelector('[data-aviso-checklist]'), tinha = !!caixa.firstElementChild;
      caixa.innerHTML = aviso ? `<div class="callout warn op-aviso-check"><span class="ic">${icon('alerta', 16)}</span><div><p><b>Sem checklist de entrada.</b> O projeto vai entrar no portfólio sem a decisão registrada (entra, falta informação ou não entra).</p><button class="btn btn-sm btn-primary" type="button" data-fazer-checklist>${icon('funil', 15)} Fazer checklist agora</button></div></div>` : '';
      const b = m.querySelector('[data-fazer-checklist]'); if(b) b.onclick = () => { GP.closeModal(); if(GP.abrirEntrada) GP.abrirEntrada(p.id); };
      // o aviso aparece abaixo das opções: rola o modal até ele ficar inteiro acima do rodapé fixo (Cancelar/Salvar)
      if(aviso && !tinha) requestAnimationFrame(() => {
        const c = caixa.firstElementChild, act = m.querySelector('.m-act'); if(!c || !act) return;
        const cr = c.getBoundingClientRect(), limite = Math.min(act.getBoundingClientRect().top, m.getBoundingClientRect().bottom, innerHeight) - 12;
        const delta = Math.min(cr.bottom - limite, cr.top - m.getBoundingClientRect().top - 12);
        if(delta > 0) m.scrollBy({ top: delta, behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    };
    m.addEventListener('change', e => { if(e.target.name === 'et') atualizar(); });
    mot.addEventListener('input', () => { if(mot.value.trim()){ err.textContent = ''; mot.classList.remove('err'); mot.removeAttribute('aria-invalid'); } });
    atualizar();
    m.querySelector('[data-ok]').onclick = () => {
      const v = sel(), motivo = mot.value.trim(), de = p.etapa;
      if(MOTIVO_OBRIG.includes(v) && !motivo){ err.innerHTML = `${icon('alerta', 13)}<span>Informe o motivo para “${esc(M.etapa(v).nome)}”.</span>`; mot.classList.add('err'); mot.setAttribute('aria-invalid', 'true'); mot.focus(); return; }
      GP.closeModal();
      if(P.mudarEtapa(p.id, v, motivo)){
        GP.refresh();
        OP.toast(`Etapa atualizada: <b>${esc(M.etapa(de).nome)}</b> → <b>${esc(M.etapa(v).nome)}</b>.`, 'Desfazer', () => {
          const q = P.get(p.id); if(!q || q.etapa !== v) return;
          q.etapa = de; q.atualizadoEm = new Date().toISOString(); P.registrar(q, 'Etapa revertida', `${M.etapa(v).nome} → ${M.etapa(de).nome}`); GP.save(); GP.refresh(); GP.toast('Etapa revertida.');
        });
      } else GP.refresh();
    };
  }
  GP.mudarEtapa = id => { const p = P.get(id); if(p) modalEtapa(p); };

  GP.tela({ id:'novo', nivel:1, ordem:2, titulo:'Novo cadastro', icone:'novo', render: telaForm });
  GP.tela({ id:'acervo', nivel:1, ordem:3, titulo:'Acervo', icone:'acervo', render: telaAcervo });
  GP.tela({ id:'projeto', nivel:1, titulo:'Projeto', icone:'acervo', menu:false, render: telaFicha });
})();
