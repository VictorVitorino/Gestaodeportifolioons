/* =========================================================================
   Extras transversais (pacote inovação): paleta de comandos, atalhos de teclado,
   cadastro rápido e modo comitê. Tudo entra por APIs públicas e GP.afterRender.

   APIs expostas:
   - GP.comandos.abrir() / fechar() / aberta()     paleta de comandos (Ctrl/Cmd+K ou '/')
   - GP.cadastroRapido(pre = {})                    modal com os 5 campos obrigatórios + natureza
   - GP.atalhos.ajuda() / ligados() / alternar()    folha de atalhos ('?') e liga/desliga
   - GP.comite.abrir(origem) / fechar() / aberto()  modo comitê em tela cheia
   Gatilhos declarativos (qualquer tela pode usar, sem depender da ordem dos scripts):
   <button data-cmdk>, <button data-cadastro-rapido>, <button data-comite="carteira">
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP; if(!GP || !GP.util || !GP.modelo) return;
  const M = GP.modelo, P = GP.projetos, { esc, fmt } = GP.util, icon = GP.icon;
  const norm = GP.util.normTxt || (s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  const plural = GP.util.plural || ((n, s, p) => n + ' ' + (n === 1 ? s : p));
  const S = () => GP.state();
  const ui = () => S().ui;
  const f1 = v => fmt.n(v, 1);
  const MAC = /Mac|iPhone|iPad/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '');
  const TECLA_K = MAC ? '⌘ K' : 'Ctrl K';
  const atalhosLigados = () => !!S() && ui().atalhos !== false;
  const emCampo = t => !!(t && t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
  const modalAberto = () => !!document.querySelector('.modal-bg');
  const bloqueado = () => !S() || !!document.querySelector('.auth-gate');
  const carteira = () => M.montarCarteira(P.todos(), S().capacidade, S().forcar);
  const tela = id => GP.telas().find(t => t.id === id);

  /** Aviso com ação. Usa {acao, onAcao} do núcleo; se a versão do aviso não tiver botão, põe um link no texto. */
  function avisar(msg, {acao = '', onAcao = null, href = '', tipo = '', ms = null} = {}){
    let t = null;
    try { t = GP.toast(msg, acao || tipo ? { acao, onAcao, tipo, ms: ms != null ? ms : (acao ? 7000 : null) } : undefined); } catch(e){ t = null; }
    if(acao && href && !(t && t.querySelector && t.querySelector('.toast-act'))) GP.toast(`${msg} <a class="link" href="${esc(href)}">${esc(acao)}</a>`);
  }
  /** Aciona um controle existente (data-*) pelo mesmo caminho do clique, sem duplicar a lógica de outro módulo. */
  function disparar(attr){
    const b = document.createElement('button'); b.type = 'button'; b.hidden = true; b.setAttribute(attr, '');
    document.body.appendChild(b); try { b.click(); } finally { b.remove(); }
  }
  /** Marca, no texto original, os trechos que casam com a busca (sem acento e sem caixa). */
  function marcar(txt, toks){
    txt = String(txt ?? ''); if(!toks.length) return esc(txt);
    const chars = [...txt], mapa = []; let n = '';
    chars.forEach((c, i) => { for(const x of norm(c)){ n += x; mapa.push(i); } });
    const on = chars.map(() => false);
    toks.forEach(t => { let i = n.indexOf(t); while(i >= 0){ for(let j = i; j < i + t.length; j++) on[mapa[j]] = true; i = n.indexOf(t, i + t.length); } });
    let h = '', aberto = false;
    chars.forEach((c, i) => { if(on[i] && !aberto){ h += '<mark>'; aberto = true; } if(!on[i] && aberto){ h += '</mark>'; aberto = false; } h += esc(c); });
    return h + (aberto ? '</mark>' : '');
  }

  /* =====================================================================
     I1 · Paleta de comandos
     ===================================================================== */
  const PALAVRAS = {
    painel:'inicio home dashboard resumo central', indicadores:'graficos analise kpi numeros', relatorios:'pdf ppt powerpoint exportar relatorio apresentacao',
    governanca:'administracao modelo regras guardia', sistemas:'ativos ferramentas modelos inventario', 'entrada-resumo':'triagem entrada fila',
    acervo:'projetos demandas lista buscar todos', funil:'entrada triagem checklist admitir quadro', avaliar:'avaliacao nota perguntas pontuar',
    ranking:'prioridade ordem fila classificacao', matriz:'valor esforco quadrantes dispersao', criterios:'pesos regras pontuacao', riscos:'risco ameaca problema',
    carteira:'capacidade fte orcamento pessoas cabe', roadmap:'cronograma gantt calendario datas', config:'backup dados configuracoes restaurar usuarios apagar exemplos',
  };
  const recentes = () => (S() && Array.isArray(ui().cmdRecentes) ? ui().cmdRecentes : []).filter(k => typeof k === 'string').slice(0, 6);
  const lembrar = k => { if(!k || /^x:/.test(k)) return; ui().cmdRecentes = [k, ...recentes().filter(x => x !== k)].slice(0, 6); GP.save(); };

  /** Pontua um item contra a busca: null = não casa; maior = melhor. */
  function pontuar(it, toks, q){
    if(!toks.length) return 0;
    if(!toks.every(t => it.hay.includes(t))) return null;
    const tit = norm(it.titulo); let s = 1;
    if(it.cod){ const c = norm(it.cod); if(c === q) s = 12; else if(c.startsWith(q)) s = 8; else if(/^\d+$/.test(q) && +(c.match(/(\d+)$/) || [0, -1])[1] === +q) s = 9; }
    if(tit === q) s = Math.max(s, 7); else if(tit.startsWith(q)) s = Math.max(s, 5); else if((' ' + tit).includes(' ' + toks[0])) s = Math.max(s, 3); else if(tit.includes(toks[0])) s = Math.max(s, 2);
    return s;
  }
  function itemProjeto(p){
    const nv = GP.nivel(), s = nv >= 2 ? M.pontuar(p) : null;
    const pill = GP.etapaPill ? GP.etapaPill(p.etapa) : esc(M.etapa(p.etapa).nome);
    const nota = s && s.completo ? `<span class="cmdk-nota" title="Nota de valor (0 a 100)"><small>Nota</small>${fmt.n(s.valor)}</span>` : '';
    return { key:'p:' + p.id, grupo:'Projetos', cod:p.codigo, titulo:p.titulo, icone:'acervo', navega:true,
      sub:[p.area || p.gerencia, p.ferramenta, p.responsavel].filter(Boolean).join(' · '), meta: pill + nota,
      hay: norm([p.codigo, p.titulo, p.area, p.ferramenta, p.responsavel, p.demandante, p.gerencia].join(' ')),
      exec: () => GP.go('#/projeto/' + p.id) };
  }
  function itemTela(t){
    const nv = GP.nivel(), acima = (t.nivel || 1) > nv;
    return { key:'t:' + t.id, grupo:'Telas', titulo:t.titulo, icone:t.icone || 'painel', navega:true, acima,
      sub: acima ? `Faz parte do nível ${t.nivel} · ${GP.NIVEIS[t.nivel - 1].nome}` : t.gerencial ? 'Visão gerencial' : t.rodape ? 'Configuração' : `Nível ${t.nivel || 1}`,
      meta: acima ? `<span class="cmdk-nivel">Ativar nível ${t.nivel}</span>` : '',
      hay: norm([t.titulo, t.id, PALAVRAS[t.id] || ''].join(' ')),
      exec: () => { if(acima) GP.setNivel(t.nivel); GP.go('#/' + t.id); } };
  }
  function acoes(q){
    const nv = GP.nivel(), A = [
      { id:'rapido', titulo:'Cadastro rápido', sub:'Os 5 campos obrigatórios, sem sair da tela', icone:'novo', tecla:'N', kw:'novo nova projeto demanda cadastrar criar rapido registrar', exec: () => cadastroRapido() },
      { id:'novo', titulo:'Novo cadastro', sub:'Formulário completo, com estimativas e datas', icone:'editar', kw:'novo nova projeto demanda cadastrar criar formulario completo', exec: () => GP.go('#/novo') },
      { id:'comite', titulo:'Modo comitê', sub: nv < 2 ? 'Faz parte do nível 2 · Análise e priorização' : 'Um projeto por lâmina, em tela cheia, com registro da decisão', icone:'carteira', nivel:2, kw:'comite reuniao apresentar apresentacao decisao decidir aprovar carteira tela cheia', exec: () => { if(GP.nivel() < 2) GP.setNivel(2); abrirComite('paleta'); } },
      { id:'importar', titulo:'Importar planilha', sub:'Arquivo CSV do Excel com vários registros', icone:'upload', kw:'importar csv excel planilha carregar', exec: () => disparar('data-importar-csv') },
      { id:'backup', titulo:'Baixar cópia (backup)', sub:'Arquivo com toda a carteira, para guardar ou levar a outro computador', icone:'download', kw:'backup copia baixar salvar json exportar guardar', exec: () => disparar('data-backup') },
      { id:'nivel', titulo:'Trocar nível', sub:`Atual: nível ${nv} · ${GP.NIVEIS[nv - 1].nome}`, icone:'estrela', kw:'nivel niveis operacao priorizar planejar recursos', exec: () => GP.explicarNiveis() },
      { id:'atalhos', titulo:'Atalhos de teclado', sub:'Teclas para navegar e cadastrar', icone:'ajuda', tecla:'?', kw:'teclado atalhos ajuda teclas', exec: () => ajudaAtalhos() },
      { id:'atalhos-onoff', titulo: atalhosLigados() ? 'Desativar atalhos' : 'Ativar atalhos', sub: atalhosLigados() ? 'G, N, / e ? deixam de agir; Ctrl K continua' : 'Liga G, N, / e ? para navegar e cadastrar', icone:'config', kw:'atalhos teclado desligar ligar desativar ativar teclas', exec: () => alternarAtalhos() },
    ];
    if(document.querySelector('#conteudo [data-pdf]')) A.splice(5, 0, { id:'pdf', titulo:'Salvar PDF desta tela', sub:'Mesmo arquivo do botão Salvar PDF', icone:'pdf', kw:'pdf imprimir salvar relatorio', exec: () => { const b = document.querySelector('#conteudo [data-pdf]'); if(b) b.click(); } });
    if(!P.todos().length) A.push({ id:'exemplos', titulo:'Carregar projetos de exemplo', sub:'Registros fictícios para conhecer o sistema', icone:'acervo', kw:'exemplos demonstracao ficticios carregar', exec: () => disparar('data-exemplos') });
    const lista = A.map(a => ({ key:'a:' + a.id, grupo:'Ações', titulo:a.titulo, sub:a.sub, icone:a.icone, tecla:a.tecla,
      meta: a.nivel && a.nivel > nv ? `<span class="cmdk-nivel">Ativar nível ${a.nivel}</span>` : a.tecla && atalhosLigados() ? `<kbd>${a.tecla}</kbd>` : '',
      hay: norm(a.titulo + ' ' + a.kw), exec: a.exec }));
    // Busca sem projeto correspondente: oferece cadastrar com esse título
    const t = String(q || '').trim();
    if(t.length >= 5 && !P.todos().some(p => norm(p.titulo) === norm(t)))
      lista.push({ key:'x:criar', grupo:'Ações', titulo:`Cadastrar “${t.slice(0, 80)}”`, sub:'Cadastro rápido com este título', icone:'novo', meta:'', hay:norm(t), sempre:true, exec: () => cadastroRapido({ titulo:t.slice(0, 140) }) });
    return lista;
  }
  /** Monta os grupos visíveis para a busca atual. */
  function resultados(q){
    const qn = norm(q).trim(), toks = qn.split(/\s+/).filter(Boolean), nv = GP.nivel();
    const telas = GP.telas().filter(t => t.menu !== false && t.id !== 'novo');
    const A = acoes(q);
    if(!toks.length){
      const mapa = {}; P.todos().forEach(p => { mapa['p:' + p.id] = p; });
      const rec = recentes().map(k => k.startsWith('p:') ? (mapa[k] ? itemProjeto(mapa[k]) : null) : k.startsWith('t:') ? (tela(k.slice(2)) && tela(k.slice(2)).menu !== false ? itemTela(tela(k.slice(2))) : null) : A.find(a => a.key === k) || null).filter(Boolean);
      const usados = new Set(rec.map(r => r.key));
      return [
        rec.length ? { nome:'Recentes', itens: rec.map(r => Object.assign({}, r, { grupo:'Recentes' })) } : null,
        { nome:'Ações', itens: A.filter(a => !usados.has(a.key) && ['a:rapido', 'a:novo', 'a:comite', 'a:importar', 'a:exemplos'].includes(a.key)) },
        { nome:'Telas', itens: telas.filter(t => (t.nivel || 1) <= nv).map(itemTela).filter(t => !usados.has(t.key)) },
      ].filter(g => g && g.itens.length);
    }
    const filtra = (lista, max) => { const r = lista.map((it, i) => ({ it, i, s: it.sempre ? 0.5 : pontuar(it, toks, qn) })).filter(x => x.s != null).sort((a, b) => b.s - a.s || a.i - b.i);
      return { itens: r.slice(0, max).map(x => x.it), total: r.length, melhor: r.length ? r[0].s : 0 }; };
    const gp = filtra(P.todos().map(itemProjeto), 8), gt = filtra(telas.map(itemTela), 8), ga = filtra(gp.total ? A.filter(a => a.key !== 'x:criar') : A, 8);
    return [
      { nome:'Projetos', ...gp, ordem:0 }, { nome:'Telas', ...gt, ordem:1 }, { nome:'Ações', ...ga, ordem:2 },
    ].filter(g => g.itens.length).sort((a, b) => (b.melhor >= 3 ? 1 : 0) - (a.melhor >= 3 ? 1 : 0) || b.melhor - a.melhor || a.ordem - b.ordem);
  }

  let pal = null; // { bg, input, lista, status, itens, ativo, foco }
  function pintarPaleta(){
    const q = pal.input.value, grupos = resultados(q), toks = norm(q).trim().split(/\s+/).filter(Boolean);
    pal.itens = []; let h = '';
    grupos.forEach((g, gi) => {
      const extra = g.total > g.itens.length ? ` <span>${g.itens.length} de ${g.total}</span>` : '';
      h += `<div class="cmdk-grupo" role="group" aria-labelledby="cmdk-g${gi}"><div class="cmdk-grupo-t" id="cmdk-g${gi}" role="presentation">${esc(g.nome)}${extra}</div>`;
      g.itens.forEach(it => { const i = pal.itens.push(it) - 1;
        h += `<div class="cmdk-item${it.acima ? ' acima' : ''}" role="option" id="cmdk-op${i}" data-i="${i}" aria-selected="false">
          <span class="cmdk-ic" aria-hidden="true">${icon(it.icone, 17)}</span>
          <span class="cmdk-txt"><b>${it.cod ? `<span class="cmdk-cod">${marcar(it.cod, toks)}</span>` : ''}${marcar(it.titulo, toks)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span>
          ${it.meta ? `<span class="cmdk-meta">${it.meta}</span>` : ''}</div>`; });
      h += '</div>';
    });
    if(!pal.itens.length) h = `<div class="cmdk-vazio"><b>Nada encontrado para “${esc(q.trim())}”.</b><span>Tente o código (PRJ-013), uma palavra do título, a área ou o responsável.</span></div>`;
    pal.lista.innerHTML = h;
    pal.status.textContent = pal.itens.length ? plural(pal.itens.length, 'resultado', 'resultados') : 'Nenhum resultado';
    ativar(pal.itens.length ? 0 : -1, false);
  }
  function ativar(i, rolar = true){
    if(!pal) return; const n = pal.itens.length;
    pal.ativo = n ? (i + n) % n : -1;
    pal.lista.querySelectorAll('.cmdk-item').forEach(x => { const on = +x.dataset.i === pal.ativo; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    if(pal.ativo >= 0){ pal.input.setAttribute('aria-activedescendant', 'cmdk-op' + pal.ativo); const el = pal.lista.querySelector(`[data-i="${pal.ativo}"]`); if(el && rolar) el.scrollIntoView({ block:'nearest' }); }
    else pal.input.removeAttribute('aria-activedescendant');
  }
  function abrirPaleta(){
    if(bloqueado() || com) return;
    if(pal){ pal.input.focus(); pal.input.select(); return; }
    const foco = document.activeElement, bg = document.createElement('div');
    bg.className = 'cmdk-bg';
    bg.innerHTML = `<div class="cmdk" role="dialog" aria-modal="true" aria-label="Buscar projetos, telas e ações">
      <div class="cmdk-campo"><span class="cmdk-lupa" aria-hidden="true">${icon('busca', 19)}</span>
        <input class="cmdk-input" type="text" role="combobox" aria-expanded="true" aria-controls="cmdk-lista" aria-autocomplete="list" aria-haspopup="listbox" aria-label="Buscar projeto, tela ou ação" placeholder="Buscar projeto, tela ou ação…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
        <button type="button" class="cmdk-fechar" tabindex="-1" data-cmdk-fechar aria-label="Fechar busca">Esc</button></div>
      <div class="cmdk-lista" id="cmdk-lista" role="listbox" aria-label="Resultados"></div>
      <div class="cmdk-rodape" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span>${atalhosLigados() ? '<span class="cmdk-r-dir"><kbd>?</kbd> atalhos</span>' : ''}</div>
      <p class="cmdk-sr" aria-live="polite" data-cmdk-status></p></div>`;
    document.body.appendChild(bg);
    pal = { bg, input: bg.querySelector('.cmdk-input'), lista: bg.querySelector('.cmdk-lista'), status: bg.querySelector('[data-cmdk-status]'), itens: [], ativo: -1, foco };
    document.documentElement.classList.add('cmdk-on');
    const app = document.getElementById('app'); if(app) app.setAttribute('inert', '');
    pal.input.addEventListener('input', pintarPaleta);
    bg.addEventListener('mousedown', e => { if(e.target === bg) e.preventDefault(); });
    bg.addEventListener('click', e => {
      if(e.target === bg || e.target.closest('[data-cmdk-fechar]')){ fecharPaleta(true); return; }
      const it = e.target.closest('.cmdk-item'); if(it) executar(+it.dataset.i);
    });
    pal.lista.addEventListener('mousemove', e => { const it = e.target.closest('.cmdk-item'); if(it && +it.dataset.i !== pal.ativo) ativar(+it.dataset.i, false); });
    pintarPaleta();
    pal.input.focus();
  }
  function fecharPaleta(devolver = true){
    if(!pal) return; const p0 = pal; pal = null;
    p0.bg.remove(); document.documentElement.classList.remove('cmdk-on');
    const app = document.getElementById('app'); if(app && !modalAberto() && !com) app.removeAttribute('inert');
    if(devolver && p0.foco && p0.foco !== document.body && document.contains(p0.foco)) try { p0.foco.focus({ preventScroll:true }); } catch(e){}
  }
  function executar(i){
    const it = pal && pal.itens[i]; if(!it) return;
    lembrar(it.key);
    fecharPaleta(!it.navega);
    try { it.exec(); } catch(e){ console.error(e); GP.toast('Não foi possível concluir esta ação.'); }
  }
  function teclaPaleta(e){
    const k = e.key;
    if(k === 'Escape'){ e.preventDefault(); e.stopPropagation(); fecharPaleta(true); return; }
    if((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'K')){ e.preventDefault(); e.stopPropagation(); fecharPaleta(true); return; }
    if(k === 'ArrowDown' || k === 'ArrowUp'){ e.preventDefault(); e.stopPropagation(); ativar(pal.ativo + (k === 'ArrowDown' ? 1 : -1)); return; }
    if((k === 'Home' || k === 'End') && e.ctrlKey){ e.preventDefault(); ativar(k === 'Home' ? 0 : pal.itens.length - 1); return; }
    if(k === 'PageDown' || k === 'PageUp'){ e.preventDefault(); ativar(Math.max(0, Math.min(pal.itens.length - 1, pal.ativo + (k === 'PageDown' ? 5 : -5)))); return; }
    if(k === 'Enter'){ e.preventDefault(); e.stopPropagation(); if(pal.ativo >= 0) executar(pal.ativo); return; }
    if(k === 'Tab'){ e.preventDefault(); e.stopPropagation(); pal.input.focus(); return; }
    if(k === '?' && !pal.input.value){ e.preventDefault(); fecharPaleta(true); ajudaAtalhos(); }
  }
  GP.comandos = { abrir: abrirPaleta, fechar: () => fecharPaleta(true), aberta: () => !!pal };
  window.addEventListener('hashchange', () => { if(pal) fecharPaleta(false); });

  /* =====================================================================
     I2 · Cadastro rápido
     ===================================================================== */
  const CAMPOS_R = ['natureza', 'titulo', 'descricao', 'gerencia', 'demandante', 'tipo'];
  function cadastroRapido(pre = {}){
    if(bloqueado()) return null;
    if(pal) fecharPaleta(true);
    if(com) fecharComite();
    const rasc = (ui().rascunhos && ui().rascunhos.rapido) || null;
    const v = Object.assign({ natureza:'demanda' }, rasc || {}, pre || {});
    const rot = k => esc((M.CAMPOS && M.CAMPOS[k]) || k);
    const req = ' <span class="req" aria-hidden="true">*</span>';
    const err = k => `<span class="err-msg" id="rap-err-${k}" data-err-r="${k}"></span>`;
    const opt = (lista, sel) => `<option value="">Selecione…</option>` + lista.map(o => { const val = typeof o === 'string' ? o : o.id, l = typeof o === 'string' ? o : o.nome; return `<option value="${esc(val)}" ${val === sel ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
    const m = GP.modal(`<h3>Cadastro rápido</h3>
      <p class="muted">Registre agora com os campos obrigatórios. O registro entra em <b>Nova demanda</b> e a ficha pode ser completada depois.</p>
      ${rasc ? `<div class="rapido-rasc" data-rapido-aviso>${icon('relogio', 15)}<span>Rascunho recuperado.</span><button type="button" class="link" data-rapido-descartar>Descartar</button></div>` : ''}
      <form class="rapido-form" novalidate data-rapido>
        <fieldset class="rapido-nat"><legend>${rot('natureza')}</legend>
          ${[['demanda', 'Demanda', 'Pedido que ainda vai ser avaliado'], ['projeto', 'Projeto', 'Iniciativa com escopo, início e fim']].map(([val, l, d]) => `<label><input type="radio" name="natureza" value="${val}" ${v.natureza === val ? 'checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}
        </fieldset>
        <label class="field rapido-full"><span class="rapido-rot">${rot('titulo')}${req}</span><input class="input" name="titulo" maxlength="140" value="${esc(v.titulo || '')}" placeholder="Ex.: Automação de testes dos modelos hidrológicos" aria-describedby="rap-err-titulo" autocomplete="off">${err('titulo')}</label>
        <label class="field rapido-full"><span class="rapido-rot">${rot('descricao')}${req}</span><textarea class="input" name="descricao" rows="2" maxlength="1200" placeholder="Qual problema resolve? O que será entregue?" aria-describedby="rap-err-descricao">${esc(v.descricao || '')}</textarea>${err('descricao')}</label>
        <label class="field"><span class="rapido-rot">${rot('gerencia')}${req}</span><select class="select" name="gerencia" aria-describedby="rap-err-gerencia">${opt(M.CAT.gerencias, v.gerencia)}</select>${err('gerencia')}</label>
        <label class="field"><span class="rapido-rot">${rot('tipo')}${req}</span><select class="select" name="tipo" aria-describedby="rap-err-tipo">${opt(M.CAT.tipos, v.tipo)}</select>${err('tipo')}</label>
        <label class="field rapido-full"><span class="rapido-rot">${rot('demandante')}${req}</span><input class="input" name="demandante" maxlength="120" value="${esc(v.demandante || '')}" placeholder="Pessoa ou área que pediu" aria-describedby="rap-err-demandante" autocomplete="off">${err('demandante')}</label>
        <p class="err-msg rapido-geral" data-err-r="geral" role="alert"></p>
        <div class="m-act rapido-act"><button type="button" class="btn btn-ghost rapido-completo" data-rapido-completo>Abrir formulário completo</button>
          <button type="button" class="btn btn-ghost" data-close="1">Cancelar</button><button type="submit" class="btn btn-primary">${icon('check', 16)} Cadastrar</button></div>
      </form>`);
    if(!m) return null;
    m.classList.add('rapido');
    const f = m.querySelector('[data-rapido]');
    const dados = () => { const d = {}; CAMPOS_R.forEach(k => { const el = f.elements.namedItem(k); d[k] = el ? (el.value ?? '') : ''; }); return d; };
    let tm = null;
    const guardar = () => { clearTimeout(tm); tm = setTimeout(() => { tm = null; if(!document.contains(f)) return; const d = dados(), vazio = !['titulo', 'descricao', 'gerencia', 'demandante', 'tipo'].some(k => String(d[k]).trim());
      const R = ui().rascunhos || (ui().rascunhos = {}); if(vazio) delete R.rapido; else R.rapido = d; GP.save(); }, 300); };
    f.addEventListener('input', guardar); f.addEventListener('change', guardar);
    const limparErros = () => { f.querySelectorAll('[data-err-r]').forEach(x => { x.textContent = ''; }); f.querySelectorAll('.err').forEach(x => { x.classList.remove('err'); x.removeAttribute('aria-invalid'); }); };
    const desc = m.querySelector('[data-rapido-descartar]');
    if(desc) desc.onclick = () => { clearTimeout(tm); tm = null; if(ui().rascunhos) delete ui().rascunhos.rapido; GP.save();
      ['titulo', 'descricao', 'gerencia', 'demandante', 'tipo'].forEach(k => { const el = f.elements.namedItem(k); if(el) el.value = ''; });
      const nat = f.querySelector('input[name=natureza][value=demanda]'); if(nat) nat.checked = true;
      const a = m.querySelector('[data-rapido-aviso]'); if(a) a.remove(); limparErros(); f.elements.namedItem('titulo').focus(); };
    f.addEventListener('keydown', e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable:true })); } });
    f.addEventListener('submit', e => {
      e.preventDefault(); clearTimeout(tm); tm = null; limparErros();
      const res = P.criar(dados());
      if(!res.ok){
        let primeiro = null;
        Object.entries(res.erros || {}).forEach(([k, msg]) => {
          const s = f.querySelector(`[data-err-r="${k}"]`), el = CAMPOS_R.includes(k) ? f.elements.namedItem(k) : null;
          if(s && k !== 'natureza') s.textContent = msg; else { const g = f.querySelector('[data-err-r="geral"]'); g.textContent = (g.textContent ? g.textContent + ' ' : '') + `${(M.CAMPOS && M.CAMPOS[k]) || k}: ${msg}`; }
          if(el && el.classList){ el.classList.add('err'); el.setAttribute('aria-invalid', 'true'); if(!primeiro) primeiro = el; }
        });
        if(primeiro) primeiro.focus();
        return;
      }
      if(ui().rascunhos) delete ui().rascunhos.rapido; GP.save();
      GP.closeModal(); GP.refresh();
      const p = res.projeto;
      avisar(`Cadastrado: <b>${esc(p.codigo)}</b> em Nova demanda.`, { acao:'Completar ficha →', onAcao: () => GP.go('#/novo/' + p.id), href:'#/novo/' + p.id, tipo:'ok' });
    });
    m.querySelector('[data-rapido-completo]').onclick = () => {
      clearTimeout(tm); tm = null; const d = dados(), R = ui().rascunhos || (ui().rascunhos = {});
      R.novo = Object.assign({}, R.novo || {}, Object.fromEntries(Object.entries(d).filter(([, x]) => String(x).trim()))); delete R.rapido; GP.save();
      GP.closeModal(); GP.go('#/novo');
    };
    const foco = f.elements.namedItem(pre && pre.titulo ? 'descricao' : 'titulo');
    if(foco) setTimeout(() => { if(document.contains(foco)) foco.focus(); }, 0);
    return m;
  }
  GP.cadastroRapido = cadastroRapido;

  /* =====================================================================
     I3 · Atalhos de teclado
     ===================================================================== */
  const IR = { p:'painel', a:'acervo', f:'funil', r:'ranking', c:'carteira' };
  const kbd = t => `<kbd>${esc(t)}</kbd>`;
  function ajudaAtalhos(){
    if(bloqueado()) return;
    if(pal) fecharPaleta(true);
    const nv = GP.nivel(), lig = atalhosLigados();
    const linha = (teclas, txt, nota = '') => `<div class="atalho-l"><dt>${teclas}</dt><dd>${txt}${nota ? ` <small>${nota}</small>` : ''}</dd></div>`;
    const ir = Object.entries(IR).map(([k, id]) => { const t = tela(id); if(!t) return ''; return linha(`${kbd('G')}<span>depois</span>${kbd(k.toUpperCase())}`, esc(t.titulo), (t.nivel || 1) > nv ? `nível ${t.nivel}` : ''); }).join('');
    const m = GP.modal(`<h3>Atalhos de teclado</h3>
      <p class="muted">Funcionam fora dos campos de texto e com nenhuma janela aberta. A busca abre em qualquer situação com ${kbd(TECLA_K)}.</p>
      <div class="atalhos-grid">
        <section><h4>Ir para</h4><dl>${ir}</dl></section>
        <section><h4>Fazer</h4><dl>${linha(kbd(TECLA_K), 'Buscar projeto, tela ou ação')}${linha(kbd('/'), 'Buscar (atalho curto)')}${linha(kbd('N'), 'Cadastro rápido')}${linha(kbd('?'), 'Esta lista de atalhos')}${linha(kbd('Esc'), 'Fechar janela ou busca')}</dl>
          <h4>Na busca e no modo comitê</h4><dl>${linha(kbd('↑') + kbd('↓'), 'Escolher resultado')}${linha(kbd('Enter'), 'Abrir')}${linha(kbd('←') + kbd('→'), 'Lâmina anterior / seguinte')}</dl></section>
      </div>
      <div class="atalhos-estado"><span data-atalhos-txt>${lig ? 'Atalhos de letra ativados.' : 'Atalhos de letra desativados. Só a busca continua.'}</span><button type="button" class="btn btn-ghost btn-sm" data-atalhos-onoff>${lig ? 'Desativar' : 'Ativar'}</button></div>
      <div class="m-act"><button type="button" class="btn btn-primary" data-close="1">Entendi</button></div>`, { largo:true });
    if(!m) return;
    m.classList.add('atalhos-modal');
    m.querySelector('[data-atalhos-onoff]').onclick = e => { alternarAtalhos(true); const on = atalhosLigados();
      m.querySelector('[data-atalhos-txt]').textContent = on ? 'Atalhos de letra ativados.' : 'Atalhos de letra desativados. Só a busca continua.'; e.currentTarget.textContent = on ? 'Desativar' : 'Ativar'; };
  }
  function alternarAtalhos(silencioso){
    ui().atalhos = !atalhosLigados(); GP.save(); decorar();
    if(!silencioso) GP.toast(atalhosLigados() ? 'Atalhos de teclado ativados. Tecle ? para ver a lista.' : `Atalhos de letra desativados. ${TECLA_K} continua abrindo a busca.`);
  }
  GP.atalhos = { ajuda: ajudaAtalhos, ligados: atalhosLigados, alternar: () => alternarAtalhos() };

  let gEm = 0, seqEl = null, seqT = null;
  const esconderSeq = () => { clearTimeout(seqT); if(seqEl){ seqEl.remove(); seqEl = null; } };
  function mostrarSeq(){
    esconderSeq(); const nv = GP.nivel();
    seqEl = document.createElement('div'); seqEl.className = 'atalho-seq'; seqEl.setAttribute('aria-hidden', 'true');
    seqEl.innerHTML = `${kbd('G')}<span>Ir para</span>` + Object.entries(IR).map(([k, id]) => { const t = tela(id); return t ? `<span class="${(t.nivel || 1) > nv ? 'off' : ''}">${kbd(k.toUpperCase())} ${esc(t.titulo.split(' ')[0])}</span>` : ''; }).join('');
    document.body.appendChild(seqEl); seqT = setTimeout(() => { gEm = 0; esconderSeq(); }, 1500);
  }
  function irPara(id){
    const t = tela(id); if(!t) return;
    if((t.nivel || 1) > GP.nivel()){ avisar(`${esc(t.titulo)} faz parte do nível ${t.nivel}.`, { acao:`Ativar nível ${t.nivel}`, onAcao: () => { GP.setNivel(t.nivel); GP.go('#/' + id); }, href:'#/' + id }); return; }
    GP.go('#/' + id);
  }
  window.addEventListener('keydown', e => {
    if(!S()) return;
    if(pal){ teclaPaleta(e); return; }
    if(com){ teclaComite(e); return; }
    if(e.isComposing) return;
    const k = e.key || '', mod = e.ctrlKey || e.metaKey;
    if(mod && !e.altKey && !e.shiftKey && (k === 'k' || k === 'K')){
      if(bloqueado() || modalAberto()) return;
      e.preventDefault(); e.stopPropagation(); gEm = 0; esconderSeq(); abrirPaleta(); return;
    }
    if(mod || e.altKey){ gEm = 0; return; }
    if(!atalhosLigados() || bloqueado() || modalAberto() || emCampo(e.target)){ gEm = 0; return; }
    const kl = k.length === 1 ? k.toLowerCase() : k;
    if(gEm){ const dentro = Date.now() - gEm < 1500; gEm = 0; esconderSeq(); if(dentro && IR[kl]){ e.preventDefault(); irPara(IR[kl]); return; } if(dentro && kl.length === 1) return; }
    if(e.repeat) return;
    if(kl === 'g' && !e.shiftKey){ e.preventDefault(); gEm = Date.now(); mostrarSeq(); return; }
    if(kl === 'n'){ e.preventDefault(); cadastroRapido(); return; }
    if(k === '/'){ e.preventDefault(); abrirPaleta(); return; }
    if(k === '?'){ e.preventDefault(); ajudaAtalhos(); }
  }, true);

  /* =====================================================================
     I4 · Modo comitê
     ===================================================================== */
  const DEC = {
    in:  { nome:'Aprovar início', sub:'Fixa na carteira deste período', icone:'check', tom:'ok' },
    '':  { nome:'Seguir o ranking', sub:'Automático: entra se couber na capacidade', icone:'ranking', tom:'auto' },
    out: { nome:'Não priorizar', sub:'Fica fora da carteira deste período', icone:'x', tom:'bad' },
  };
  /* Situação na carteira: a mesma semântica de GP.modelo.montarCarteira/STATUS_CARTEIRA usada na tela Carteira
     (capacidade mês a mês; o pico inclui os projetos em execução e é comparado com a capacidade efetiva). */
  const DENTRO = ['cabe', 'fixado', 'fixado_estoura'];
  /** Aguardam capacidade: fora da carteira por falta de pessoas/orçamento (nao_cabe, cabe_a_partir, obrigatorio_deslocado) */
  const aguardaCap = s => !!(M.STATUS_CARTEIRA[s] && M.STATUS_CARTEIRA[s].fora) && !DENTRO.includes(s);
  const tomStatus = s => (M.STATUS_CARTEIRA[s] && M.STATUS_CARTEIRA[s].tom) || 'neutral';
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const rotMes = s => s ? `${MESES[+String(s).slice(5, 7) - 1]}/${String(s).slice(0, 4)}` : '';
  const nomeStatus = it => !it ? 'Sem situação' : it.status === 'cabe_a_partir' && it.aPartir ? `Cabe a partir de ${rotMes(it.aPartir)}` : (M.STATUS_CARTEIRA[it.status] || {}).nome || 'Sem situação';
  /** Quanto falta (texto curto, igual ao da tabela da carteira) */
  const faltaTxt = it => !it || !it.falta ? '' : it.falta.tipo === 'FTE' ? `faltam ${f1(it.falta.valor)} FTE${it.picoMes ? ` em ${rotMes(it.picoMes)}` : ''}` : `faltam ${fmt.mi(it.falta.valor)} de orçamento`;
  /** Situação para a ata, com a redação da pauta do comitê da carteira */
  const sitAta = it => it.status === 'cabe_a_partir' ? `cabe a partir de ${rotMes(it.aPartir)}${it.falta ? ` (${faltaTxt(it)} nas datas previstas)` : ''}`
    : it.status === 'obrigatorio_deslocado' ? `fora da carteira por causa das fixações do comitê${it.falta ? `, ${faltaTxt(it)}` : ''} (decisão necessária)`
    : it.falta ? faltaTxt(it) : ((M.STATUS_CARTEIRA[it.status] || {}).nome || '').toLowerCase();
  const obrTxt = p => p && p.obrigatorio ? ' [OBRIGATÓRIO]' : '';
  let com = null; // { el, ids, i, origem, log, foco, inicio, msg, fs, conf }

  function abrirComite(origem = 'paleta'){
    if(com || bloqueado()) return;
    if(pal) fecharPaleta(false);
    if(modalAberto()) GP.closeModal();
    const c = carteira();
    com = { ids: c.itens.map(x => x.p.id), i:0, origem: String(origem || 'paleta'), log:[], foco: document.activeElement, inicio: new Date(), msg:'', fs:false };
    const el = document.createElement('div');
    el.className = 'comite'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Modo comitê'); el.tabIndex = -1;
    document.body.appendChild(el); com.el = el;
    document.documentElement.classList.add('comite-on');
    const app = document.getElementById('app'); if(app) app.setAttribute('inert', '');
    el.addEventListener('click', cliqueComite);
    pintarComite('titulo');
    try { if(el.requestFullscreen){ const r = el.requestFullscreen({ navigationUI:'hide' }); if(r && r.then) r.then(() => { if(com && com.el === el) com.fs = true; }, () => {}); } } catch(e){}
  }
  function fecharComite(){
    if(!com) return; const c0 = com; com = null;
    try { if(document.fullscreenElement && document.exitFullscreen){ const r = document.exitFullscreen(); if(r && r.catch) r.catch(() => {}); } } catch(e){}
    c0.el.remove(); document.documentElement.classList.remove('comite-on');
    const app = document.getElementById('app'); if(app && !modalAberto()) app.removeAttribute('inert');
    if(c0.log.length) GP.refresh();
    const volta = c0.foco && document.contains(c0.foco) ? c0.foco
      : c0.foco && c0.foco.matches && c0.foco.matches('[data-comite]') ? document.querySelector('#conteudo [data-comite]')
      : c0.foco && c0.foco.matches && c0.foco.matches('.cmdk-pill') ? document.querySelector('.topbar .cmdk-pill') : null;
    if(volta) try { volta.focus({ preventScroll:true }); } catch(e){}
    if(c0.log.length) GP.toast(`${plural(c0.log.length, 'decisão registrada', 'decisões registradas')} no modo comitê.`);
  }
  document.addEventListener('fullscreenchange', () => { if(com && com.fs && document.fullscreenElement !== com.el) fecharComite(); });

  const decisaoAtual = id => { const l = com.log.find(x => x.id === id); if(l) return l.v; const f = S().forcar[id]; return f === 'in' || f === 'out' ? f : null; };
  function pintarComite(focar){
    if(!com) return;
    const c = carteira(), cap = S().capacidade, n = com.ids.length, total = n + 1;
    com.i = Math.max(0, Math.min(total - 1, com.i));
    const pct = c.livre > 0 ? Math.min(100, c.usadoFte / c.livre * 100) : (c.usadoFte > 0 ? 100 : 0), estoura = c.sobraFte < -1e-9;
    const topo = `<header class="comite-topo">
        <div class="comite-marca">${GP.logoFEG ? GP.logoFEG(30) : ''}<div><b>Comitê de portfólio</b><span>Período ${esc(cap.periodo)} · ${esc(new Date().toLocaleDateString('pt-BR'))}</span></div></div>
        <div class="comite-fte${estoura ? ' estoura' : ''}" aria-live="polite" aria-atomic="true">
          <div class="comite-fte-l"><span>Carteira</span><b>${f1(c.usadoFte)}</b><span>de ${f1(c.livre)} FTE</span></div>
          <div class="comite-fte-bar" aria-hidden="true"><i style="width:${pct.toFixed(1)}%"></i></div>
          <small>${plural(c.cabem, 'projeto cabe', 'projetos cabem')} de ${c.candidatos} · ${fmt.mi(c.usadoCusto)}${c.orcamento ? ' de ' + fmt.mi(c.orcamento) : ''}</small></div>
        <button type="button" class="comite-sair" data-comite-sair aria-label="Sair do modo comitê">${icon('x', 18)}<span>Sair</span><kbd>Esc</kbd></button>
      </header>`;
    const corpo = com.i < n ? laminaProjeto(c, com.ids[com.i]) : laminaResumo(c);
    const nav = `<footer class="comite-nav">
        <button type="button" class="comite-seta" data-comite-ant ${com.i === 0 ? 'disabled' : ''} aria-label="Lâmina anterior">${icon('voltar', 18)}<span>Anterior</span></button>
        <div class="comite-prog"><span class="comite-cont">${com.i < n ? `Projeto ${com.i + 1} de ${n}` : 'Resumo da sessão'}</span>
          <div class="comite-pontos" aria-hidden="true">${Array.from({ length: total }, (_, j) => `<i class="${j === com.i ? 'on' : ''}${j < n && decisaoAtual(com.ids[j]) ? ' dec' : ''}${j === n ? ' fim' : ''}"></i>`).join('')}</div></div>
        <button type="button" class="comite-seta prox" data-comite-prox ${com.i >= total - 1 ? 'disabled' : ''} aria-label="${com.i === n - 1 ? 'Ir para o resumo' : 'Próxima lâmina'}"><span>${com.i === n - 1 ? 'Resumo' : 'Próximo'}</span>${icon('seta', 18)}</button>
      </footer>`;
    com.el.innerHTML = topo + `<main class="comite-palco">${corpo}</main>` + nav;
    if(focar === 'titulo'){ const h = com.el.querySelector('.comite-tit'); if(h) try { h.focus({ preventScroll:true }); } catch(e){} }
    else if(focar){ const b = com.el.querySelector(focar); if(b && !b.disabled) b.focus({ preventScroll:true }); else { const h = com.el.querySelector('.comite-tit'); if(h) h.focus({ preventScroll:true }); } }
  }
  /** Situação na capacidade com a mesma base da tabela da carteira: pico mensal (execução + carteira) contra a capacidade efetiva. */
  function situacaoTxt(c, it){
    if(!it) return 'Fora da lista de candidatos (etapa ou avaliação mudou).';
    const exec = it.picoMes ? (((c.demanda || []).find(d => d.mes === it.picoMes) || {}).execucao || 0) : 0;
    const pico = entrou => it.acumFte == null ? '' : `${entrou ? 'Pico mensal com este projeto' : 'Pico mensal se entrar'}: ${f1(it.acumFte)} de ${f1(c.efetiva)} FTE efetivos${it.picoMes ? ` (${rotMes(it.picoMes)})` : ''}${exec > 0 ? `, contando ${f1(exec)} FTE em execução` : ''}.`;
    const falta = faltaTxt(it);
    switch(it.status){
      case 'cabe': case 'fixado': return pico(true);
      case 'fixado_estoura': return it.acumFte != null && it.acumFte > c.efetiva + 1e-9
        ? `Fixado pelo comitê, mas o pico chega a ${f1(it.acumFte)} de ${f1(c.efetiva)} FTE efetivos${it.picoMes ? ` em ${rotMes(it.picoMes)}` : ''}: excede em ${f1(it.acumFte - c.efetiva)} FTE.`
        : `Fixado pelo comitê, mas o custo acumulado passa o orçamento em ${fmt.mi(Math.max(0, (it.acumCusto || 0) - (c.orcamento || 0)))}.`;
      case 'nao_cabe': return `Não cabe nas datas previstas${falta ? `: ${falta}` : ''}. ${pico(false)}`.trim();
      case 'cabe_a_partir': return `${falta ? falta[0].toUpperCase() + falta.slice(1) + ' nas datas previstas' : 'Não cabe nas datas previstas'} · cabe se começar em ${rotMes(it.aPartir)}.`;
      case 'obrigatorio_deslocado': return `Obrigatório que caberia sem as fixações do comitê${falta ? ` (${falta})` : ''}. Revise as decisões ou aumente a capacidade.`;
      case 'sem_estimativa': return 'Sem estimativa de pessoas: não entra na conta.';
      case 'excluido': return 'Não ocupa capacidade.';
      case 'fora_periodo': return `Datas previstas fora do período${c.periodo ? ' ' + c.periodo.rotulo : ''}: não entra na conta.`;
      default: return pico(DENTRO.includes(it.status));
    }
  }
  function laminaProjeto(c, id){
    const p = P.get(id); if(!p) return `<article class="comite-lamina"><h2 class="comite-tit" tabindex="-1">Registro removido</h2></article>`;
    const it = c.itens.find(x => x.p.id === id), s = M.pontuar(p), q = s.quadrante && M.QUADRANTES[s.quadrante];
    const dec = decisaoAtual(id), ger = M.CAT.gerencias.find(g => g.id === p.gerencia);
    let decomp = '';
    if(typeof M.decompor === 'function'){
      try {
        const linhas = M.decompor(p, M.criterios(), 'valor') || [], mx = Math.max(1e-9, ...linhas.map(l => l.max || 0));
        if(linhas.length) decomp = `<section class="comite-decomp" aria-label="Composição da nota de valor"><h3>De onde vem a nota de valor</h3>
          ${linhas.map(l => `<div class="comite-dl"><span class="comite-dl-n">${esc(l.nome)}</span>
            <span class="comite-dl-t" style="width:${(l.max / mx * 100).toFixed(1)}%" aria-hidden="true"><i style="width:${l.max ? (l.pontos / l.max * 100).toFixed(1) : 0}%"></i></span>
            <span class="comite-dl-v">${l.resp == null ? 'sem resposta' : `${fmt.n(l.pontos, l.pontos % 1 ? 1 : 0)} <small>de ${fmt.n(l.max)}</small>`}</span></div>`).join('')}</section>`;
      } catch(e){ decomp = ''; }
    }
    const fato = (r, v) => `<div><dt>${r}</dt><dd>${v}</dd></div>`;
    const capTxt = situacaoTxt(c, it);
    return `<article class="comite-lamina" aria-roledescription="lâmina" aria-label="Projeto ${com.i + 1} de ${com.ids.length}">
      <div class="comite-esq">
        <div class="comite-pos"><span>Posição</span><b>${it ? it.pos : '–'}</b><small>no ranking</small></div>
        <p class="comite-cod"><span class="code">${esc(p.codigo)}</span>${ger ? ` · ${esc(ger.id)}` : ''}${p.tipo ? ` · ${esc(p.tipo)}` : ''}${p.obrigatorio ? ' <span class="comite-tag">obrigatório</span>' : ''}</p>
        <h2 class="comite-tit" tabindex="-1">${esc(p.titulo)}</h2>
        ${p.beneficio || p.descricao ? `<p class="comite-desc">${esc(p.beneficio || p.descricao)}</p>` : ''}
        <div class="comite-notas">
          <div class="comite-nota"><b>${s.valor == null ? '–' : fmt.n(s.valor)}</b><span>Valor <small>0 a 100</small></span></div>
          <div class="comite-nota alt"><b>${s.esforco == null ? '–' : fmt.n(s.esforco)}</b><span>Esforço <small>0 a 100</small></span></div>
          ${q ? `<div class="comite-quad"><span>Quadrante</span><b>${esc(q.nome)}</b><small>${esc(q.desc)}</small></div>` : ''}
        </div>
        ${decomp}
      </div>
      <div class="comite-dir">
        <dl class="comite-fatos">${fato('Pessoas (FTE)', p.esforcoFte != null ? f1(p.esforcoFte) : 'Sem estimativa')}${fato('Custo estimado', fmt.mi(p.custo))}${fato('Duração', p.duracaoMeses != null ? plural(p.duracaoMeses, 'mês', 'meses') : '-')}${fato('Período previsto', p.inicioPrevisto ? `${fmt.data(p.inicioPrevisto)} a ${fmt.data(p.fimPrevisto)}` : 'Sem datas')}${fato('Responsável', esc(p.responsavel || '-'))}</dl>
        <div class="comite-cap cap-${it ? tomStatus(it.status) : 'neutral'}"><span class="comite-cap-r">Situação na capacidade</span><b><i aria-hidden="true"></i>${esc(nomeStatus(it))}</b><small>${esc(capTxt)}</small></div>
        ${com.conf && com.conf.id === id ? painelConfirmacao(com.conf) : `<div class="comite-dec" role="group" aria-label="Decisão do comitê para ${esc(p.codigo)}">
          ${['in', '', 'out'].map(v => `<button type="button" class="comite-db dec-${DEC[v].tom}" data-decidir="${v}" aria-pressed="${dec === (v || 'aguardar') ? 'true' : 'false'}"><span class="comite-db-ic" aria-hidden="true">${icon(DEC[v].icone, 18)}</span><span><b>${DEC[v].nome}</b><small>${DEC[v].sub}</small></span></button>`).join('')}
        </div>`}
        <p class="comite-msg" role="status">${esc(com.msg || (dec ? '' : 'Sem decisão registrada: segue o ranking e a capacidade.'))}</p>
      </div>
    </article>`;
  }
  /** Confirmação do impacto dentro do próprio modo comitê (em tela cheia o modal da página não aparece) */
  function painelConfirmacao(cf){
    return `<section class="comite-conf" role="alertdialog" aria-modal="false" aria-labelledby="comite-conf-t" aria-describedby="comite-conf-d">
        <h3 id="comite-conf-t" class="comite-conf-t" tabindex="-1">Aprovar início de ${esc(cf.codigo)} mesmo assim?</h3>
        <p id="comite-conf-d">Fixar este projeto muda a carteira de ${esc(cf.periodo)}:</p>
        <ul class="comite-conf-l">
          ${cf.saem.map(i => `<li><b>${esc(i.codigo)}</b>${i.obrigatorio ? ' <b class="comite-conf-obr">[OBRIGATÓRIO]</b>' : ''} sai da carteira · ${esc(i.titulo)}</li>`).join('')}
          ${cf.estoura ? `<li>O pico passa a <b>${f1(cf.estoura.total)} FTE</b> em ${esc(rotMes(cf.estoura.mes))}, para ${f1(cf.estoura.efetiva)} FTE efetivos: excede em ${f1(cf.estoura.excede)} FTE.</li>` : ''}
        </ul>
        <p class="comite-conf-n">Para desfazer, escolha “Seguir o ranking” nesta lâmina.</p>
        <div class="comite-conf-acoes"><button type="button" class="comite-btn prim" data-comite-conf-ok>Aprovar mesmo assim</button><button type="button" class="comite-btn" data-comite-conf-nao>Cancelar</button></div>
      </section>`;
  }
  function laminaResumo(c){
    const cont = { in:0, aguardar:0, out:0 }; com.log.forEach(l => { cont[l.v] = (cont[l.v] || 0) + 1; });
    const nomeDec = v => DEC[v === 'aguardar' ? '' : v].nome;
    const semCand = !com.ids.length;
    return `<article class="comite-lamina comite-resumo" aria-roledescription="lâmina" aria-label="Resumo da sessão">
      <div class="comite-res-cab"><p class="comite-cod">Fim da pauta</p><h2 class="comite-tit" tabindex="-1">${semCand ? 'Nenhum projeto para deliberar' : 'Resumo da sessão'}</h2>
        <p class="comite-desc">${semCand ? 'O modo comitê usa os projetos admitidos (aguardando início) com avaliação de prioridade completa. Avalie os projetos e volte aqui.' : `${plural(com.log.length, 'decisão registrada', 'decisões registradas')} em ${plural(com.ids.length, 'projeto apresentado', 'projetos apresentados')}. Cada decisão ficou no histórico do projeto.`}</p></div>
      <div class="comite-res-kpis">
        <div class="dec-ok"><b>${cont.in}</b><span>${DEC.in.nome}</span></div><div class="dec-auto"><b>${cont.aguardar}</b><span>${DEC[''].nome}</span></div><div class="dec-bad"><b>${cont.out}</b><span>${DEC.out.nome}</span></div>
        <div class="dec-fte"><b>${f1(c.usadoFte)}<small> / ${f1(c.livre)}</small></b><span>FTE na carteira</span></div></div>
      ${alertasCarteira(c).map(a => `<p class="comite-res-alerta"><i aria-hidden="true"></i>${esc(a)}</p>`).join('')}
      ${com.log.length ? `<ol class="comite-res-lista">${com.log.map(l => `<li><span class="code">${esc(l.codigo)}</span><span class="t">${esc(l.titulo)}</span><span class="comite-res-d dec-${DEC[l.v === 'aguardar' ? '' : l.v].tom}"><i aria-hidden="true"></i>${esc(nomeDec(l.v))}</span></li>`).join('')}</ol>` : `<p class="comite-res-vazio">${semCand ? '' : 'Nenhuma decisão registrada nesta sessão.'}</p>`}
      <div class="comite-res-acoes">${semCand ? `<button type="button" class="comite-btn prim" data-comite-ir="#/avaliar">Avaliar projetos</button>` : `<button type="button" class="comite-btn prim" data-comite-ata>${icon('check', 16)} Copiar ata</button>`}<button type="button" class="comite-btn" data-comite-sair>Encerrar sessão</button></div>
      <p class="comite-msg" role="status">${esc(com.msg || '')}</p>
      <textarea class="comite-ata-txt" readonly hidden aria-label="Texto da ata"></textarea>
    </article>`;
  }
  /** Avisos da carteira que pedem decisão (os mesmos da tela Carteira): obrigatório deslocado e fixado que estoura */
  function alertasCarteira(c){
    const a = [], desl = c.itens.filter(i => i.status === 'obrigatorio_deslocado'), est = c.itens.filter(i => i.status === 'fixado_estoura');
    if(desl.length) a.push(`As fixações deixaram ${plural(desl.length, 'projeto obrigatório', 'projetos obrigatórios')} fora (${desl.map(i => i.p.codigo).join(', ')}). Revise as decisões ou aumente a capacidade.`);
    if(est.length) a.push(`${plural(est.length, 'projeto fixado estoura', 'projetos fixados estouram')} a capacidade (${est.map(i => i.p.codigo).join(', ')}).`);
    return a;
  }
  /**
   * Grava a decisão pelo mesmo caminho do controle data-forcar da carteira (capacidade.js): 'Aprovar início' que tira
   * alguém da carteira ou estoura a capacidade pede confirmação com o impacto, aqui dentro do modo comitê.
   */
  function decidir(v, confirmado = false){
    if(!com) return; const id = com.ids[com.i], p = P.get(id); if(!p) return;
    const chave = v || 'aguardar', T = S();
    com.conf = null;
    if(com.log.some(l => l.id === id && l.v === chave)){ com.msg = 'Esta decisão já foi registrada.'; pintarComite(`[data-decidir="${v}"]`); return; }
    const antes = carteira(), dentroAntes = new Set(antes.dentro.map(i => i.p.id));
    if(v === 'in' && T.forcar[id] !== 'in' && !confirmado){
      const depois = M.montarCarteira(P.todos(), T.capacidade, Object.assign({}, T.forcar, { [id]:'in' }));
      const estAntes = new Set(antes.itens.filter(i => i.status === 'fixado_estoura').map(i => i.p.id));
      const saem = depois.itens.filter(i => i.p.id !== id && dentroAntes.has(i.p.id) && aguardaCap(i.status));
      const estoura = depois.itens.some(i => i.status === 'fixado_estoura' && !estAntes.has(i.p.id));
      if(saem.length || estoura){
        com.conf = { id, codigo:p.codigo, periodo: depois.periodo ? depois.periodo.rotulo : T.capacidade.periodo,
          saem: saem.map(i => ({ codigo:i.p.codigo, titulo:i.p.titulo, obrigatorio:!!i.p.obrigatorio })),
          estoura: estoura ? { total:depois.pico.total, mes:depois.pico.mes, efetiva:depois.efetiva, excede:Math.max(0, -depois.sobraFte) } : null };
        com.msg = '';
        pintarComite('.comite-conf-t');
        const cx = com.el.querySelector('.comite-conf'); if(cx && cx.scrollIntoView) cx.scrollIntoView({ block:'nearest' });
        return;
      }
    }
    if(v) T.forcar[id] = v; else delete T.forcar[id];
    const c = carteira(), it = c.itens.find(x => x.p.id === id), s = M.pontuar(p);
    const saiu = c.itens.filter(i => i.p.id !== id && dentroAntes.has(i.p.id) && aguardaCap(i.status)).map(i => i.p.codigo);
    const det = `${DEC[v].nome}. Posição ${it ? it.pos : '-'} no ranking${s.valor != null ? ` · valor ${fmt.n(s.valor)}` : ''}${p.esforcoFte != null ? ` · ${f1(p.esforcoFte)} FTE` : ''}${it ? ` · situação: ${nomeStatus(it)}` : ''}${saiu.length ? ` · saem da carteira: ${saiu.join(', ')}` : ''}. Período ${T.capacidade.periodo}.`;
    if(typeof P.registrar === 'function') P.registrar(p, 'Decisão do comitê', det); else (p.historico || (p.historico = [])).push({ data: new Date().toISOString(), acao:'Decisão do comitê', detalhe: det });
    p.atualizadoEm = new Date().toISOString();
    GP.save();
    com.log = com.log.filter(l => l.id !== id).concat({ id, codigo:p.codigo, titulo:p.titulo, v:chave, saem:saiu, data:new Date() });
    com.msg = `Decisão registrada: ${DEC[v].nome}${it ? ` (situação: ${nomeStatus(it)})` : ''}.${saiu.length ? ` ${plural(saiu.length, 'projeto saiu', 'projetos saíram')} da carteira: ${saiu.join(', ')}.` : ''}`;
    pintarComite(`[data-decidir="${v}"]`);
  }
  function cancelarConfirmacao(){ if(!com || !com.conf) return; com.conf = null; com.msg = 'Decisão não registrada.'; pintarComite('[data-decidir="in"]'); }
  function ataTexto(){
    const c = carteira(), T = S(), cap = T.capacidade, agora = new Date(), L = [];
    L.push('ATA · COMITÊ DE PORTFÓLIO FEG', `Data: ${agora.toLocaleDateString('pt-BR')} · ${agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })} · Período: ${cap.periodo}`, '');
    L.push(`Capacidade: ${f1(cap.fte)} FTE, reserva de ${fmt.n(cap.reservaPct)}%, ${f1(c.comprometido)} FTE em execução → ${f1(c.livre)} FTE para novos projetos.`);
    L.push(`Carteira após as decisões: ${plural((c.dentro || []).length || c.cabem, 'projeto', 'projetos')}${c.estouram ? ` (${plural(c.estouram, 'fixado estoura', 'fixados estouram')} a capacidade)` : ''}, ${f1(c.usadoFte)} de ${f1(c.livre)} FTE para novos projetos e ${fmt.mi(c.usadoCusto)}${c.pico && c.pico.mes ? `; pico de ${f1(c.pico.total)} de ${f1(c.efetiva)} FTE efetivos em ${rotMes(c.pico.mes)}, com a execução` : ''}.`);
    alertasCarteira(c).forEach(a => L.push('ATENÇÃO: ' + a));
    L.push('');
    const item = id => c.itens.find(i => i.p.id === id);
    L.push(`1. Decisões registradas nesta sessão (${com.log.length}):`);
    if(com.log.length) com.log.forEach(l => { const p = P.get(l.id), s = p ? M.pontuar(p) : null, it = item(l.id);
      L.push(`   - ${l.codigo} · ${l.titulo} · ${DEC[l.v === 'aguardar' ? '' : l.v].nome}${s && s.valor != null ? ` · valor ${fmt.n(s.valor)}` : ''}${p && p.esforcoFte != null ? ` · ${f1(p.esforcoFte)} FTE` : ''}${it ? ` → situação após as decisões: ${nomeStatus(it)}` : ''}${l.saem && l.saem.length ? ` · tirou da carteira: ${l.saem.join(', ')}` : ''}`); });
    else L.push('   - nenhuma');
    L.push('', '2. Na carteira do período:'); c.dentro.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo} · ${f1(i.p.esforcoFte)} FTE${i.status === 'fixado' ? ' · fixado pelo comitê' : ''}${i.status === 'fixado_estoura' ? ' · ATENÇÃO: estoura a capacidade' : ''}${obrTxt(i.p)}`)); if(!c.dentro.length) L.push('   - nenhum');
    // Mesmo critério da pauta: não cabe agora, cabe mais tarde e obrigatório deslocado pelas fixações
    const aguardam = c.itens.filter(i => aguardaCap(i.status)); L.push('', '3. Aguardam capacidade (ordem de prioridade):');
    aguardam.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo}${i.s && i.s.valor != null ? ` · valor ${fmt.n(i.s.valor)}` : ''} · ${f1(i.p.esforcoFte)} FTE · ${sitAta(i)}${obrTxt(i.p)}`)); if(!aguardam.length) L.push('   - nenhum');
    const exc = c.itens.filter(i => i.status === 'excluido'); if(exc.length){ L.push('', '4. Não priorizados neste período:'); exc.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo}${obrTxt(i.p)}`)); }
    const semConta = c.itens.filter(i => i.status === 'sem_estimativa' || i.status === 'fora_periodo');
    if(semConta.length){ L.push('', `${exc.length ? 5 : 4}. Fora da conta da capacidade:`); semConta.forEach(i => L.push(`   - ${i.p.codigo} · ${i.p.titulo} · ${i.status === 'sem_estimativa' ? 'sem estimativa de pessoas' : 'datas previstas fora do período'}${obrTxt(i.p)}`)); }
    return L.join('\n');
  }
  async function copiarAta(){
    if(!com) return; const txt = ataTexto(); GP.comite.ultimaAta = txt; let ok = false;
    try { if(navigator.clipboard && navigator.clipboard.writeText){ await navigator.clipboard.writeText(txt); ok = true; } } catch(e){ ok = false; }
    if(!ok && com){ const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.className = 'comite-ata-tmp'; com.el.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch(e){ ok = false; } ta.remove(); }
    if(!com) return;
    com.msg = ok ? 'Ata copiada. Cole no e-mail ou no documento da reunião.' : 'Não foi possível copiar automaticamente. Selecione o texto abaixo e copie com Ctrl+C.';
    pintarComite('[data-comite-ata]');
    if(!ok){ const ta = com.el.querySelector('.comite-ata-txt'); if(ta){ ta.hidden = false; ta.value = txt; ta.focus(); ta.select(); } }
  }
  function ir(delta, focar){ if(!com) return; const total = com.ids.length + 1, j = Math.max(0, Math.min(total - 1, com.i + delta)); if(j === com.i) return; com.i = j; com.msg = ''; com.conf = null; pintarComite(focar); }
  function cliqueComite(e){
    const b = e.target.closest('button'); if(!b || !com) return;
    if(b.hasAttribute('data-comite-sair')){ fecharComite(); return; }
    if(b.hasAttribute('data-comite-ant')){ ir(-1, com.i - 1 === 0 ? 'titulo' : '[data-comite-ant]'); return; }
    if(b.hasAttribute('data-comite-prox')){ ir(1, com.i + 1 >= com.ids.length ? 'titulo' : '[data-comite-prox]'); return; }
    if(b.hasAttribute('data-decidir')){ decidir(b.dataset.decidir); return; }
    if(b.hasAttribute('data-comite-conf-ok')){ if(com.conf) decidir('in', true); return; }
    if(b.hasAttribute('data-comite-conf-nao')){ cancelarConfirmacao(); return; }
    if(b.hasAttribute('data-comite-ata')){ copiarAta(); return; }
    if(b.dataset.comiteIr){ const h = b.dataset.comiteIr; fecharComite(); GP.go(h); }
  }
  function teclaComite(e){
    const k = e.key, t = e.target, campo = t && t.tagName === 'TEXTAREA';
    if(k === 'Escape'){ e.preventDefault(); e.stopPropagation(); if(com.conf) cancelarConfirmacao(); else fecharComite(); return; }
    if(k === 'Tab'){ const f = [...com.el.querySelectorAll('button:not([disabled]), textarea:not([hidden]), [tabindex="0"]')].filter(x => x.offsetParent !== null || x === document.activeElement);
      if(!f.length){ e.preventDefault(); return; } const a = f[0], z = f[f.length - 1];
      if(!com.el.contains(document.activeElement) || (e.shiftKey && document.activeElement === a)){ e.preventDefault(); (e.shiftKey ? z : a).focus(); }
      else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } return; }
    if(campo || e.ctrlKey || e.metaKey || e.altKey) return;
    if(k === 'ArrowRight' || k === 'PageDown'){ e.preventDefault(); ir(1, 'titulo'); return; }
    if(k === 'ArrowLeft' || k === 'PageUp'){ e.preventDefault(); ir(-1, 'titulo'); return; }
    if(k === 'Home'){ e.preventDefault(); ir(-com.i, 'titulo'); return; }
    if(k === 'End'){ e.preventDefault(); ir(com.ids.length - com.i, 'titulo'); }
  }
  GP.comite = { abrir: abrirComite, fechar: fecharComite, aberto: () => !!com, ata: () => (com ? ataTexto() : ''), ultimaAta: '' };

  /* =====================================================================
     Integração: botões no topo, no dock e nas telas; dicas de tecla no trilho
     ===================================================================== */
  function decorar(el, r){
    if(!S()) return;
    const right = document.querySelector('.topbar .right');
    if(right && !right.querySelector('.cmdk-pill'))
      right.insertAdjacentHTML('afterbegin', `<button type="button" class="cmdk-pill" data-cmdk aria-label="Buscar projetos, telas e ações (${TECLA_K})" aria-keyshortcuts="${MAC ? 'Meta+K' : 'Control+K'}" title="Buscar projetos, telas e ações (${TECLA_K})">${icon('busca', 16)}<span class="cmdk-pill-t">Buscar</span><kbd>${TECLA_K}</kbd></button>`);
    const dock = document.querySelector('.dock');
    if(dock && !dock.querySelector('.dock-busca')){
      const menu = dock.querySelector('[data-menu]'), h = `<button type="button" class="dock-item dock-busca" data-cmdk aria-label="Buscar projetos, telas e ações">${icon('busca', 19)}<span>Busca</span></button>`;
      if(menu) menu.insertAdjacentHTML('beforebegin', h); else dock.insertAdjacentHTML('beforeend', h);
    }
    const lig = atalhosLigados();
    Object.entries(IR).forEach(([k, id]) => { document.querySelectorAll(`.side .nav-item[href="#/${id}"]`).forEach(a => {
      const base = a.dataset.tipBase || a.dataset.tip || a.getAttribute('aria-label') || ''; a.dataset.tipBase = base;
      a.dataset.tip = lig ? `${base} · G ${k.toUpperCase()}` : base;
      if(lig) a.setAttribute('aria-keyshortcuts', `G ${k.toUpperCase()}`); else a.removeAttribute('aria-keyshortcuts'); }); });
    // Acesso ao modo comitê nas telas de decisão (quando a própria tela ainda não oferece)
    const c = document.getElementById('conteudo');
    if(r && c && (r.id === 'carteira' || r.id === 'ranking') && !c.querySelector('[data-comite]')){
      const t = tela(r.id), head = c.querySelector('.page-h');
      if(t && (t.nivel || 1) <= GP.nivel() && head){
        let act = head.querySelector(':scope > .actions'); if(!act){ act = document.createElement('div'); act.className = 'actions'; head.appendChild(act); }
        act.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-ghost" data-comite="${esc(r.id)}" title="Apresentar a carteira ao comitê, um projeto por lâmina">${icon('carteira', 16)} Modo comitê</button>`);
      }
    }
  }
  const anterior = GP.afterRender;
  GP.afterRender = (el, r) => { if(anterior) anterior(el, r); try { decorar(el, r); } catch(e){ console.error(e); } };
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-cmdk], [data-cadastro-rapido], [data-comite]'); if(!t || (pal && pal.bg.contains(t)) || (com && com.el.contains(t))) return;
    if(t.hasAttribute('data-cmdk')){ e.preventDefault(); abrirPaleta(); return; }
    if(t.hasAttribute('data-cadastro-rapido')){ e.preventDefault(); cadastroRapido(); return; }
    if(t.hasAttribute('data-comite')){ e.preventDefault(); abrirComite(t.getAttribute('data-comite') || 'tela'); }
  });
})();
