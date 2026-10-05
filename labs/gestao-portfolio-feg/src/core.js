/* =========================================================================
   Gestão de Portfólio FEG - núcleo (estado, rotas, layout, componentes)
   Telas se registram com GP.tela({id, nivel, titulo, icone, menu, render(el, rota)})
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP = window.GP || {};
  const KEY = 'gestao-portfolio-feg-v1';

  /* ------------------------------------------------------------- utilidades */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const nf = d => new Intl.NumberFormat('pt-BR', {minimumFractionDigits:d, maximumFractionDigits:d});
  const fmt = {
    n: (v, d=0) => v == null || isNaN(v) ? '-' : nf(d).format(v),
    pct: (v, d=0) => v == null || isNaN(v) ? '-' : nf(d).format(v * 100) + '%',
    brl: v => v == null || v === '' || isNaN(v) ? '-' : 'R$ ' + nf(0).format(v),
    mi: v => v == null || v === '' || isNaN(v) ? '-' : 'R$ ' + nf(2).format(v / 1e6) + ' mi',
    data: v => { if(!v) return '-'; const [y,m,d] = String(v).slice(0,10).split('-'); return d && m && y ? `${esc(d)}/${esc(m)}/${esc(y)}` : esc(v); },
    dataHora: v => { const d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : '-'; },
    /** número para campo de texto no formato brasileiro (sem separador de milhar) */
    campo: v => v == null || v === '' || isNaN(v) ? '' : String(v).replace('.', ','),
  };
  const sum = (a, f = x => x) => a.reduce((s, x) => s + (+f(x) || 0), 0);
  /** Data de hoje no fuso local (AAAA-MM-DD) */
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  /** Número no formato brasileiro: "150.000" → 150000; "1,5" → 1.5; "1.234,56" → 1234.56; "" → ''; inválido → NaN */
  const numBR = v => {
    if(typeof v === 'number') return v;
    let s = String(v ?? '').trim().replace(/R\$|\s/g, ''); if(!s) return '';
    if(s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if(s.includes(',')){ if((s.match(/,/g) || []).length > 1) return NaN; s = s.replace(',', '.'); }
    else if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return /^-?\d+(\.\d+)?$/.test(s) ? +s : NaN;
  };
  /** Texto para busca/comparação sem acento e sem caixa */
  const normTxt = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  /** Plural em português: plural(1,'dia','dias') → '1 dia'; plural(3,'dia','dias') → '3 dias' */
  const plural = (n, sing, plur) => `${fmt.n(n)} ${Math.abs(+n) === 1 ? sing : plur}`;
  GP.util = { esc, clone, fmt, sum, hoje, uid, numBR, normTxt, plural };

  /* ------------------------------------------------------------------ ícones */
  const I = {
    painel:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    novo:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    acervo:'<path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3z"/><path d="M10 11h4"/>',
    funil:'<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
    avaliar:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9"/>',
    ranking:'<path d="M8 21V11M12 21V5M16 21v-7M4 21h16"/>',
    matriz:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/>',
    pesos:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    carteira:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M3 12h18"/>',
    roadmap:'<path d="M3 6h8M7 12h10M13 18h8"/><circle cx="3" cy="6" r="0.5"/>',
    config:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 010-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 014 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z"/>',
    ajuda:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.2-1.5 2.5"/><path d="M12 17v.5"/>',
    recolher:'<path d="M15 6l-6 6 6 6"/><path d="M20 4v16"/>',
    expandir:'<path d="M9 6l6 6-6 6"/><path d="M4 4v16"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    busca:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    editar:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    arquivo:'<path d="M3 7h18v13H3z"/><path d="M3 7l2-4h14l2 4"/><path d="M9 12h6"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x:'<path d="M6 6l12 12M18 6L6 18"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
    alerta:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4"/><path d="M12 17v.5"/>',
    seta:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    voltar:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    download:'<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 20h16"/>',
    upload:'<path d="M12 20V9M7 14l5-5 5 5"/><path d="M4 4h16"/>',
    pdf:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/>',
    lixo:'<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    relogio:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    estrela:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  };
  const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || I.info}</svg>`;
  GP.icon = icon;

  /** Monograma FEG (só a sigla) */
  GP.logoFEG = (s = 36) => `<svg class="feg" width="${s}" height="${s}" viewBox="0 0 40 40" role="img" aria-label="FEG"><rect width="40" height="40" rx="9" fill="#3E6801"/><text x="20" y="25.5" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="13.5" font-weight="800" letter-spacing=".5" fill="#fff">FEG</text></svg>`;

  /* ------------------------------------------------------------------ estado */
  /* Estado local com recuperação e cópia portátil do HTML. Mantém a chave v1. */
  let S = null, ultimoDisco = null, ultimaBase = '', avisoFalha = false;
  GP.state = () => S;
  GP.storageKey = KEY;
  GP.storage = { ok:true, conflito:false, salvoEm:null, recuperado:false };
  const assinaturaDados = s => JSON.stringify({projetos:s.projetos,riscos:s.riscos,criterios:s.criterios,capacidade:s.capacidade,forcar:s.forcar});
  const estadoValido = raw => { try { const j = JSON.parse(raw); return j && j.v && Array.isArray(j.projetos) ? j : null; } catch(e){ return null; } };
  const pintarSalvamento = () => {
    const b = document.querySelector('[data-storage-status]'); if(!b) return;
    const st = GP.storage, txt = st.conflito ? 'Outra aba atualizou' : st.ok ? 'Salvo no navegador' : 'Salvar cópia agora';
    b.classList.toggle('error', !st.ok || st.conflito);
    b.innerHTML = `<i></i><span>${txt}</span>`;
    b.setAttribute('aria-label',txt + '. Abrir dados e configurações');
    b.title = st.conflito ? 'Exporte uma cópia das alterações desta sessão ou carregue a versão da outra aba.' : st.ok ? 'Último salvamento: ' + fmt.dataHora(st.salvoEm) + '. Clique para ver as opções de backup.' : 'O navegador não conseguiu salvar. Baixe o backup ou o HTML atualizado para guardar as alterações.';
  };
  GP.pintarSalvamento = pintarSalvamento;
  GP.save = () => {
    if(!S) return false;
    try {
      const disco = localStorage.getItem(KEY);
      if(disco !== ultimoDisco){
        GP.storage.ok = false; GP.storage.conflito = true; pintarSalvamento();
        if(!avisoFalha){ avisoFalha = true; setTimeout(() => GP.toast('Outra aba atualizou a carteira. Guarde suas alterações em uma cópia ou carregue a versão mais recente em Dados e configurações.'),0); }
        return false;
      }
      const base = assinaturaDados(S);
      if(JSON.stringify(S) === ultimoDisco){ GP.storage.ok = true; pintarSalvamento(); return true; }
      if(ultimoDisco && base !== ultimaBase) localStorage.setItem(KEY + '-anterior', ultimoDisco);
      S.meta = Object.assign({},S.meta,{revisao:(+S.meta?.revisao || 0)+1,salvoEm:new Date().toISOString()});
      const bruto = JSON.stringify(S); localStorage.setItem(KEY, bruto);
      ultimoDisco = bruto; ultimaBase = base; avisoFalha = false;
      GP.storage = {ok:true,conflito:false,salvoEm:S.meta.salvoEm,recuperado:GP.storage.recuperado};
      pintarSalvamento(); window.dispatchEvent(new CustomEvent('gp:saved'));
      return true;
    } catch(e){
      GP.storage.ok = false; GP.storage.conflito = false; pintarSalvamento();
      if(!avisoFalha){ avisoFalha = true; setTimeout(() => GP.toast('O navegador não conseguiu guardar os dados. Baixe um backup ou o HTML atualizado em Dados e configurações.'),0); }
      return false;
    }
  };
  GP.resetState = estado => { S = GP.modelo.migrar(estado); return GP.save(); };
  GP.loadLatest = () => {
    try {
      const raw = localStorage.getItem(KEY), est = estadoValido(raw);
      if(!est){ GP.toast('A versão do navegador não está disponível. Restaure um backup.'); return false; }
      S = GP.modelo.migrar(est); ultimoDisco = raw; ultimaBase = assinaturaDados(S); avisoFalha = false;
      GP.storage = {ok:true,conflito:false,salvoEm:S.meta.salvoEm,recuperado:false};
      GP.refresh(); GP.toast('Versão mais recente carregada.'); return true;
    } catch(e){ GP.toast('Não foi possível acessar o armazenamento do navegador.'); return false; }
  };
  function load(){
    const snap = document.getElementById('gp-snapshot');
    GP.snapshot = snap ? estadoValido(snap.textContent) : null;
    let bruto = null, atual = null, anterior = null;
    try {
      bruto = localStorage.getItem(KEY); atual = estadoValido(bruto);
      if(bruto && !atual){
        localStorage.setItem(KEY + '-corrompido', bruto);
        anterior = estadoValido(localStorage.getItem(KEY + '-anterior'));
        GP.storage.recuperado = !!anterior;
      }
    } catch(e){ GP.storage.ok = false; }
    ultimoDisco = bruto;
    const arquivo = GP.snapshot;
    if(arquivo && (!atual || (arquivo.meta?.datasetId === atual.meta?.datasetId && +arquivo.meta?.revisao > +atual.meta?.revisao))){
      if(atual){ try { localStorage.setItem(KEY + '-anterior',bruto); } catch(e){} }
      S = GP.util.clone(arquivo);
    } else S = atual || anterior || GP.modelo.estadoInicial();
    GP.snapshotDisponivel = !!(arquivo && atual && (arquivo.meta?.datasetId !== atual.meta?.datasetId || assinaturaDados(arquivo) !== assinaturaDados(atual)));
    S = GP.modelo.migrar(S); ultimaBase = assinaturaDados(S);
    GP.storage.salvoEm = S.meta.salvoEm || null; GP.save();
    if(GP.storage.recuperado) setTimeout(() => GP.toast('O último salvamento estava ilegível. A cópia anterior foi recuperada automaticamente.'),0);
    if(GP.snapshotDisponivel) setTimeout(() => GP.toast('Este HTML contém uma cópia da carteira. Consulte Dados e configurações para carregar os dados do arquivo quando precisar.'),0);
  }
  window.addEventListener('storage',e => {
    if(e.key !== KEY || e.newValue === ultimoDisco || !S) return;
    GP.storage.conflito = true; GP.storage.ok = false; pintarSalvamento();
    GP.toast('A carteira mudou em outra aba. Consulte Dados e configurações para carregar a nova versão.');
  });
  document.addEventListener('visibilitychange',() => { if(document.visibilityState === 'hidden') GP.save(); });
  window.addEventListener('beforeunload',e => { if(!GP.save()){ e.preventDefault(); e.returnValue = ''; } });

  /* ------------------------------------------------------------------- telas */
  const TELAS = [];
  GP.tela = t => { const i = TELAS.findIndex(x => x.id === t.id); if(i >= 0) TELAS[i] = t; else TELAS.push(t); TELAS.sort((a, b) => (a.ordem || 50) - (b.ordem || 50)); };
  GP.telas = () => TELAS;
  GP.NIVEIS = [
    { n:1, nome:'Operação do portfólio', curto:'Operação',
      resumo:'Cadastrar ou importar iniciativas, salvar o trabalho e conduzir a entrada no portfólio.',
      faz:['Cadastrar ou importar projetos e demandas', 'Salvar automaticamente e continuar por backup', 'Consultar o acervo e conduzir o checklist de entrada'],
      quando:'Para começar a operar o sistema com segurança e manter a base atualizada.' },
    { n:2, nome:'Análise e priorização', curto:'Priorizar',
      resumo:'Avaliar valor e esforço, acompanhar riscos e organizar a ordem de prioridade da carteira.',
      faz:['Avaliar iniciativas com critérios de valor e esforço', 'Acompanhar indicadores de qualidade e riscos', 'Consultar ranking e matriz de priorização'],
      quando:'Quando há mais projetos aprovados do que a equipe consegue fazer.' },
    { n:3, nome:'Capacidade e cenários', curto:'Planejar',
      resumo:'Simular capacidade, orçamento e sequência de execução a partir da carteira priorizada.',
      faz:['Simular a carteira que cabe na capacidade e no orçamento', 'Comparar decisões e restrições da carteira', 'Construir roadmap e pauta de deliberação'],
      quando:'No planejamento anual ou trimestral e antes das decisões de carteira.' },
  ];
  GP.nivel = () => S.ui.nivel || 1;
  GP.setNivel = n => { n = Math.max(1, Math.min(3, +n || 1)); S.ui.nivel = n; GP.save(); fecharMenuMovel(); render(); toast(`Nível ${n} · ${GP.NIVEIS[n-1].nome}`); };

  /* ------------------------------------------------------------------ rotas */
  const parse = () => {
    const raw = (location.hash || '#/painel').replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const query = {}; (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    const partes = path.split('/');
    return { id: partes[0] || 'painel', arg: partes.slice(1).join('/') || null, query };
  };
  GP.rota = parse;
  GP.go = h => { if(location.hash === h) render(); else location.hash = h; };
  GP.refresh = () => render(true);
  window.addEventListener('hashchange', () => { closeModal(); fecharMenuMovel(); render(); });

  /* ------------------------------------------------------------- componentes */
  const pill = (txt, tom = 'neutral') => `<span class="pill t-${tom}"><i></i>${esc(txt)}</span>`;
  const pageHead = ({titulo, sub, acoes}) => `<div class="page-h"><div><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${acoes ? `<div class="actions">${acoes}</div>` : ''}</div>`;
  const secH = (titulo, sub, acoes) => `<div class="sec-h"><div><h3>${titulo}</h3>${sub ? `<p>${sub}</p>` : ''}</div>${acoes ? `<div class="actions">${acoes}</div>` : ''}</div>`;
  const kpi = ({rotulo, valor, unidade, sub, cor}) => `<div class="card kpi"><span class="lbl">${esc(rotulo)}</span><span class="val" ${cor ? `style="color:${cor}"` : ''}>${valor}${unidade ? `<small>${esc(unidade)}</small>` : ''}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</div>`;
  const callout = (html, tipo = '') => `<div class="callout ${tipo}"><span class="ic">${icon(tipo === 'warn' ? 'alerta' : 'info', 16)}</span><div>${html}</div></div>`;
  const vazio = (titulo, texto, acao = '') => `<div class="card empty"><div class="ic">${icon('acervo', 22)}</div><h3>${esc(titulo)}</h3><p>${texto}</p>${acao}</div>`;
  const tabs = (base, itens, atual) => `<div class="tabs" role="tablist">${itens.map(([k, l]) => `<a class="tab ${k === atual ? 'on' : ''}" href="${base}?aba=${encodeURIComponent(k)}" role="tab">${esc(l)}</a>`).join('')}</div>`;
  /** Tabela ordenável: cols [{key, label, align, fmt(v,row), sortVal(row), sort:false}], rows, id (para lembrar ordenação), rowAttr(row) */
  const table = ({cols, rows, id, rowAttr, vazioTxt = 'Nenhum registro.'}) => {
    const sk = id ? S.ui['sort:' + id] : null; let rs = rows.slice();
    if(sk){ const c = cols.find(c => c.key === sk.key); if(c){ const g = c.sortVal || (r => r[c.key]);
      rs.sort((a, b) => { const x = g(a), y = g(b); const r = (typeof x === 'number' || typeof y === 'number') ? (x ?? -Infinity) - (y ?? -Infinity) : String(x ?? '').localeCompare(String(y ?? ''), 'pt-BR', { sensitivity:'base', numeric:true }); return r * sk.dir; }); } }
    return `<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr>${cols.map(c => { const s = id && c.sort !== false; return `<th class="${c.align || ''} ${s ? 'sort' : ''} ${c.hm ? 'hm' : ''}" ${s ? `data-sort="${esc(id)}|${esc(c.key)}" tabindex="0" aria-sort="${sk && sk.key === c.key ? (sk.dir > 0 ? 'ascending' : 'descending') : 'none'}"` : ''}>${esc(c.label)}${sk && sk.key === c.key ? (sk.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`; }).join('')}</tr></thead>
      <tbody>${rs.length ? rs.map(r => `<tr ${rowAttr ? rowAttr(r) : ''}>${cols.map(c => `<td class="${c.align || ''} ${c.hm ? 'hm' : ''}" data-label="${esc(c.label)}">${c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('') : `<tr class="vazio"><td colspan="${cols.length}" class="dim" style="text-align:center;padding:28px">${esc(vazioTxt)}</td></tr>`}</tbody></table></div>`;
  };
  GP.ui = { pill, pageHead, secH, kpi, callout, vazio, tabs, table, icon };

  /* ------------------------------------------------------- modal, toast, tip */
  let focoAntes = null;
  function modal(html, {largo} = {}){ const ant = document.activeElement; closeModal(); focoAntes = ant; const d = document.createElement('div'); d.className = 'modal-bg'; d.dataset.close = '1';
    d.innerHTML = `<div class="modal ${largo ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(d);
    const f = d.querySelector('input, select, textarea, .btn-primary'); if(f) f.focus(); return d.querySelector('.modal'); }
  function closeModal(){ const tinha = document.querySelector('.modal-bg'); document.querySelectorAll('.modal-bg').forEach(m => m.remove());
    if(tinha && focoAntes && document.contains(focoAntes)) try { focoAntes.focus(); } catch(e){} focoAntes = null; }
  function toast(msg){ if(GP.storage && !GP.storage.ok && /salv[ao]|cadastrad|importad|restaurad|atualizad/i.test(String(msg))) msg += '<br>As alterações estão nesta sessão. Baixe uma cópia para guardá-las.'; let t = document.querySelector('.toast'); if(!t){ t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 3200); }
  function busy(on, msg = 'Processando…'){ document.querySelectorAll('.busy').forEach(b => b.remove()); if(!on) return;
    const d = document.createElement('div'); d.className = 'busy'; d.innerHTML = `<div><i></i>${esc(msg)}</div>`; document.body.appendChild(d); }
  /** Confirmação não bloqueante (window.confirm é bloqueado em visualizadores) */
  const confirmar = (titulo, html, rotuloOk, onOk, {perigo} = {}) => {
    const m = modal(`<h3>${esc(titulo)}</h3><div class="muted">${html}</div><div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" data-ok="1">${esc(rotuloOk)}</button></div>`);
    m.querySelector('[data-ok]').addEventListener('click', () => { closeModal(); onOk(); });
  };
  Object.assign(GP, { modal, closeModal, toast, busy, confirmar });
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close]'); if(c && (c === e.target || c.tagName === 'BUTTON')){ closeModal(); return; }
    const s = e.target.closest('[data-sort]');
    if(s){ const [id, key] = s.dataset.sort.split('|'); const cur = S.ui['sort:' + id]; S.ui['sort:' + id] = cur && cur.key === key ? (cur.dir > 0 ? {key, dir:-1} : null) : {key, dir:1}; GP.save(); GP.refresh();
      const n = document.querySelector(`th[data-sort="${CSS.escape(s.dataset.sort)}"]`); if(n) n.focus(); }
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){ if(document.querySelector('.modal-bg')) closeModal(); else fecharMenuMovel(); return; }
    if(e.key === 'Tab'){ const m = document.querySelector('.modal-bg .modal'); if(m){ const f = [...m.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
      if(f.length){ const a = f[0], z = f[f.length - 1]; if(!m.contains(document.activeElement)){ e.preventDefault(); a.focus(); } else if(e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); } } } }
    if((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('th[data-sort]')){ e.preventDefault(); e.target.click(); }
  });
  const fecharMenuMovel = () => { const s = document.querySelector('.side.open'); if(s){ s.classList.remove('open'); const b = document.querySelector('.side-backdrop'); if(b) b.remove(); } };
  GP.fecharMenuMovel = fecharMenuMovel;
  // Tooltip do menu recolhido
  let tipEl = null;
  const showTip = el => { if(!document.querySelector('.shell.mini') || window.innerWidth <= 900) return; hideTip(); const r = el.getBoundingClientRect();
    tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.textContent = el.dataset.tip; const side = el.closest('.side'); tipEl.style.left = ((side ? side.getBoundingClientRect().right : r.right) + 12) + 'px'; tipEl.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(tipEl); };
  const hideTip = () => { if(tipEl){ tipEl.remove(); tipEl = null; } };
  document.addEventListener('mouseover', e => { const el = e.target.closest('[data-tip]'); if(el) showTip(el); else hideTip(); });
  document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if(el) showTip(el); });
  document.addEventListener('focusout', hideTip);

  // Dica dos gráficos: qualquer marca com data-tt (linhas separadas por quebra) mostra o valor ao passar o mouse ou focar
  let ttEl = null, ttSrc = null;
  const hideTT = () => { if(ttEl){ ttEl.remove(); ttEl = null; ttSrc = null; } };
  const placeTT = (x, y) => { const w = ttEl.offsetWidth, h = ttEl.offsetHeight, vw = window.innerWidth;
    ttEl.style.left = Math.max(8, Math.min(vw - w - 8, x + 14)) + 'px'; ttEl.style.top = Math.max(8, y - h - 12) + 'px'; };
  const showTT = (el, x, y) => { if(!ttEl){ ttEl = document.createElement('div'); ttEl.className = 'gp-tt'; ttEl.setAttribute('role', 'tooltip'); document.body.appendChild(ttEl); }
    if(ttSrc !== el){ ttSrc = el; const [t, ...linhas] = el.getAttribute('data-tt').split('\n'); ttEl.innerHTML = `<b>${esc(t)}</b>${linhas.map(l => `<span>${esc(l)}</span>`).join('')}`; }
    placeTT(x, y); };
  document.addEventListener('mousemove', e => { const el = e.target.closest && e.target.closest('[data-tt]'); if(el) showTT(el, e.clientX, e.clientY); else if(ttEl) hideTT(); }, { passive:true });
  document.addEventListener('focusin', e => { const el = e.target.closest && e.target.closest('[data-tt]'); if(el){ const r = el.getBoundingClientRect(); showTT(el, r.left + r.width / 2, r.top); } });
  document.addEventListener('focusout', hideTT); window.addEventListener('scroll', hideTT, { passive:true });

  /* ------------------------------------------------------------- gráficos */
  const PAL = ['#6b8f2a', '#3a74a8', '#d5a32d', '#00908f', '#b8642c', '#859c98', '#a06137', '#899b67'];
  const niceMax = v => { if(!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  GP.charts = {
    PAL,
    /** Barras horizontais: [{label, value, color, title}] */
    hbar(items, {max, fmtv = v => fmt.n(v)} = {}){
      const m = max ?? Math.max(1e-9, ...items.map(i => i.value));
      return `<div class="hbars">${items.map(it => `<div class="hb" data-tt="${esc(it.title || it.label)}&#10;${esc(fmtv(it.value, it))}"><span class="lb">${esc(it.label)}</span><span class="tr"><i style="width:${Math.max(0, Math.min(100, it.value / m * 100))}%;background:${it.color || PAL[0]}"></i></span><span class="v">${fmtv(it.value, it)}</span></div>`).join('')}</div>`;
    },
    /** Rosca: [{label, value, color}] */
    donut(items, {size = 150, centro = '', rotulo = ''} = {}){
      const tot = sum(items, i => i.value) || 1, r = size / 2 - 12, c = size / 2; let a0 = -Math.PI / 2, g = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#F1F1EF" stroke-width="18"/>`;
      items.forEach((it, i) => { const f = it.value / tot; if(f <= 0) return; const a1 = a0 + f * 2 * Math.PI, lg = a1 - a0 > Math.PI ? 1 : 0;
        const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1 - 1e-6), y1 = c + r * Math.sin(a1 - 1e-6);
        g += `<path d="M${x0} ${y0} A${r} ${r} 0 ${lg} 1 ${x1} ${y1}" stroke="${it.color || PAL[i % PAL.length]}" stroke-width="18" fill="none"><title>${esc(it.label)}: ${it.value}</title></path>`; a0 = a1; });
      g += `<text x="${c}" y="${c + 2}" text-anchor="middle" font-size="24" font-weight="700" fill="#1E2420">${esc(centro)}</text><text x="${c}" y="${c + 20}" text-anchor="middle" font-size="11" fill="#5E655F">${esc(rotulo)}</text>`;
      return `<div class="row" style="gap:18px;flex-wrap:nowrap;align-items:center"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex:none" role="img" aria-label="${esc(items.map(i => i.label + ': ' + i.value).join(', '))}">${g}</svg>
        <div class="legend" style="flex-direction:column;align-items:flex-start;gap:6px">${items.map((it, i) => `<span><i style="background:${it.color || PAL[i % PAL.length]}"></i>${esc(it.label)} <b style="color:#1E2420">${fmt.n(it.value)}</b></span>`).join('')}</div></div>`;
    },
    /** Matriz/dispersão: pontos [{x, y, r, label, color, id}], eixos 0..xMax/yMax, linhas de corte qx/qy, rótulos de quadrante [tl,tr,bl,br] */
    matriz(pts, o = {}){
      const W = o.w || 640, H = o.h || 420, L = 48, R = 16, T = 16, B = 42, pw = W - L - R, ph = H - T - B;
      const xMax = o.xMax ?? niceMax(Math.max(1, ...pts.map(p => p.x))), yMax = o.yMax ?? niceMax(Math.max(1, ...pts.map(p => p.y)));
      const X = v => L + v / xMax * pw, Y = v => T + (1 - v / yMax) * ph;
      let g = `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" rx="14" fill="rgba(255,255,255,.75)" stroke="#dfe7e2"/>`;
      if(o.qx != null){ g += `<path d="M${L + 14} ${T}H${X(o.qx)}V${Y(o.qy)}H${L}V${T + 14}Q${L} ${T} ${L + 14} ${T}Z" fill="#eef5e4"/><line x1="${X(o.qx)}" y1="${T}" x2="${X(o.qx)}" y2="${T + ph}" stroke="#bfd3a3" stroke-width="1.5"/><line x1="${L}" y1="${Y(o.qy)}" x2="${L + pw}" y2="${Y(o.qy)}" stroke="#bfd3a3" stroke-width="1.5"/>`;
        const q = o.quadrantes || []; const lab = (x, y, t, a) => t ? `<text x="${x}" y="${y}" font-size="11" font-weight="600" fill="#8A908B" text-anchor="${a}">${esc(t)}</text>` : '';
        g += lab(L + 8, T + 16, q[0], 'start') + lab(L + pw - 8, T + 16, q[1], 'end') + lab(L + 8, T + ph - 8, q[2], 'start') + lab(L + pw - 8, T + ph - 8, q[3], 'end'); }
      [0, .25, .5, .75, 1].forEach(t => { g += `<text x="${X(xMax * t)}" y="${T + ph + 16}" font-size="10.5" fill="#8A908B" text-anchor="middle">${fmt.n(xMax * t, xMax * t % 1 ? 1 : 0)}</text><text x="${L - 8}" y="${Y(yMax * t) + 4}" font-size="10.5" fill="#8A908B" text-anchor="end">${fmt.n(yMax * t, yMax * t % 1 ? 1 : 0)}</text>`; });
      if(o.xLabel) g += `<text x="${L + pw / 2}" y="${H - 6}" font-size="12" fill="#5E655F" text-anchor="middle">${esc(o.xLabel)} →</text>`;
      if(o.yLabel) g += `<text x="14" y="${T + ph / 2}" font-size="12" fill="#5E655F" text-anchor="middle" transform="rotate(-90 14 ${T + ph / 2})">${esc(o.yLabel)} →</text>`;
      pts.forEach(p => { const rr = p.r || 8; g += `<g ${p.id ? `data-ponto="${esc(p.id)}" style="cursor:pointer"` : ''} data-tt="${esc(p.title || p.label)}"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${rr + 8}" fill="transparent"/><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${rr}" fill="${p.color || PAL[0]}" stroke="#fff" stroke-width="2"/><text x="${X(p.x) + rr + 4}" y="${Y(p.y) + 4}" font-size="11.5" fill="#1E2420">${esc(p.label)}</text></g>`; });
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || `${o.yLabel || 'Valor'} × ${o.xLabel || 'Esforço'}: ${pts.map(p => p.label).join(', ')}`)}">${g}</svg>`;
    },
    /** Barras verticais simples: cats, series [{name, values, color}] */
    barras(cats, series, {h = 220, fmtv = v => fmt.n(v)} = {}){
      const W = 640, H = h, L = 40, B = 30, T = 12, pw = W - L - 8, ph = H - B - T, m = niceMax(Math.max(1e-9, ...series.flatMap(s => s.values)));
      const gw = pw / cats.length, bw = Math.min(26, (gw - 14) / series.length); let g = '';
      [0, .5, 1].forEach(t => { const y = T + ph * (1 - t); g += `<line x1="${L}" y1="${y}" x2="${W - 8}" y2="${y}" stroke="${t ? '#e3eae6' : '#c9d6cf'}"/><text x="${L - 6}" y="${y + 4}" font-size="10.5" fill="#8A908B" text-anchor="end">${fmtv(m * t)}</text>`; });
      cats.forEach((c, ci) => { const x0 = L + ci * gw + (gw - bw * series.length) / 2;
        series.forEach((s, si) => { const v = s.values[ci] || 0, hh = Math.max(0, ph * v / m), x = x0 + si * bw + 1, w = Math.max(2, bw - 2), y = T + ph - hh, rr = Math.min(4, hh, w / 2);
          if(hh > 0) g += `<path d="M${x} ${T + ph}V${y + rr}Q${x} ${y} ${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${T + ph}Z" fill="${s.color || PAL[si]}" data-tt="${esc(c)}&#10;${esc(s.name)}: ${esc(fmtv(v))}"/>`; });
        g += `<text x="${L + ci * gw + gw / 2}" y="${H - 10}" font-size="11" fill="#5E655F" text-anchor="middle">${esc(c)}</text>`; });
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>${series.length > 1 ? `<div class="legend" style="margin-top:6px">${series.map((s, i) => `<span><i style="background:${s.color || PAL[i]}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''}`;
    },
  };

  /* ----------------------------------------------------------------- layout */
  let ultimaChave = '';
  function render(manterScroll){
    const app = document.getElementById('app'); if(!app) return;
    const r = parse(), nivel = GP.nivel();
    const tela = TELAS.find(t => t.id === r.id) || TELAS.find(t => t.id === 'painel');
    const mini = !!S.ui.menuMini, aberto = document.querySelector('.side.open') && window.innerWidth <= 900;
    document.title = `${tela ? tela.titulo : 'Início'} · Gestão de Portfólio FEG`;
    app.innerHTML = `<div class="shell ${mini ? 'mini' : ''}">
      <aside class="side ${aberto ? 'open' : ''}" aria-label="Menu">${menu(r, tela, nivel)}</aside>
      <div class="main">
        <header class="topbar">
          <button class="menu-btn" data-menu aria-label="Abrir menu">${icon('menu')}</button>
          <div class="ttl"><small><span class="crumb">${esc(tela ? tela.titulo : '')}</span><span class="when">${esc(dataLonga())}</span></small><b>${esc(saudacao())}</b></div>
          <div class="right">
            <button class="storage-btn" data-storage-status title="Dados e configurações"><i></i><span>Salvo no navegador</span></button>
            <div class="levels"><div class="seg" role="group" aria-label="Nível do sistema">${GP.NIVEIS.map(L => `<button class="${L.n === nivel ? 'on' : ''}" data-nivel="${L.n}" aria-pressed="${L.n === nivel}" title="Nível ${L.n} · ${esc(L.nome)}"><b>${L.n}</b><span>${esc(L.curto)}</span></button>`).join('')}</div>
              <button class="icon-btn" data-ajuda-nivel title="O que cada nível faz" aria-label="O que cada nível faz">${icon('ajuda', 16)}</button></div>
            <img class="ons" src="${GP.LOGO_ONS || ''}" alt="ONS">
          </div>
        </header>
        <main class="content" id="conteudo"></main>
      </div>${dock(tela)}</div>`;
    const el = document.getElementById('conteudo');
    try {
      if(!tela) el.innerHTML = vazio('Tela não encontrada', 'Volte ao painel.');
      else if(tela.nivel > nivel) telaBloqueada(el, tela);
      else tela.render(el, r);
    } catch(err){ console.error(err); el.innerHTML = callout(`<p><b>Erro ao montar a tela.</b> ${esc(err && err.message)}</p>`, 'warn'); }
    const chave = r.id + '/' + (r.arg || '');
    if(!manterScroll || chave !== ultimaChave) window.scrollTo({top:0});
    ultimaChave = chave;
    el.querySelectorAll('table.tbl:not(.tbl-cards)').forEach(t => { const ths = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim());
      if(!ths.length) return; t.classList.add('tbl-cards'); t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if(!td.hasAttribute('data-label')) td.setAttribute('data-label', ths[i] || ''); })); });
    const nav = app.querySelector('.side-nav'), ativo = nav && nav.querySelector('.nav-item.on');
    if(ativo && (ativo.offsetTop + ativo.offsetHeight > nav.scrollTop + nav.clientHeight - 24 || ativo.offsetTop < nav.scrollTop)) nav.scrollTop = ativo.offsetTop - nav.clientHeight / 2 + ativo.offsetHeight / 2;
    GP.pintarSalvamento();
    if(GP.afterRender) GP.afterRender(el,r);
  }
  /* Saudação e data do cabeçalho */
  function saudacao(){
    const h = new Date().getHours(), oi = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    let nome = ''; try { const u = GP.auth && GP.auth.usuario && GP.auth.usuario(); nome = u && u.nome ? String(u.nome).trim().split(/\s+/)[0] : ''; } catch(e) {}
    return nome ? `${oi}, ${nome}` : oi;
  }
  function dataLonga(){ const t = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' }); return t.charAt(0).toUpperCase() + t.slice(1); }
  /** Dock inferior do celular: atalhos para as tarefas mais frequentes */
  function dock(tela){
    const id = tela ? tela.id : '', it = (href, ic, lbl, cls = '') => `<a class="dock-item ${cls} ${id === href.slice(2) ? 'on' : ''}" href="${href}" aria-label="${lbl}">${icon(ic, 19)}<span>${lbl}</span></a>`;
    return `<nav class="dock" aria-label="Atalhos">${it('#/painel', 'painel', 'Painel')}${it('#/acervo', 'acervo', 'Projetos')}${it('#/novo', 'novo', 'Novo', 'add')}${it('#/funil', 'funil', 'Funil')}<button class="dock-item" data-menu aria-label="Abrir menu completo">${icon('menu', 19)}<span>Menu</span></button></nav>`;
  }
  function menu(r, tela, nivel){
    const item = t => `<a class="nav-item ${tela && tela.id === t.id ? 'on' : ''}" href="#/${t.id}" data-tip="${esc(t.titulo)}" aria-label="${esc(t.titulo)}"><span class="ic">${icon(t.icone)}</span><span class="lbl">${esc(t.titulo)}</span></a>`;
    let h = `<a class="brand" href="#/painel" data-tip="Gestão de Portfólio FEG">${GP.logoFEG(36)}<span class="txt"><b>Gestão de Portfólio</b><span>FEG · ONS · Maestro</span></span></a>
      <div class="nav-heading"><span>Navegação</span><button class="nav-toggle" data-recolher data-tip="${S.ui.menuMini ? 'Expandir menu' : 'Recolher menu'}" aria-label="${S.ui.menuMini ? 'Expandir menu' : 'Recolher menu'}" aria-expanded="${!S.ui.menuMini}">${icon(S.ui.menuMini ? 'expandir' : 'recolher',16)}</button></div>
      <nav class="side-nav" aria-label="Áreas do portfólio"><div class="nav-sec">Visão gerencial</div>${TELAS.filter(t => t.gerencial).map(item).join('')}`;
    GP.NIVEIS.forEach(L => { if(L.n > nivel) return; const ts = TELAS.filter(t => t.menu !== false && t.nivel === L.n && !t.rodape && !t.gerencial); if(!ts.length) return;
      h += `<div class="nav-sec" title="Nível ${L.n} · ${esc(L.nome)}">Nível ${L.n} · ${esc(L.curto)}</div>` + ts.map(item).join(''); });
    if(nivel < 3) h += `<div class="nav-sec">Mais recursos</div><button class="nav-item" data-nivel="${nivel + 1}" data-tip="Ativar nível ${nivel + 1}" aria-label="Ativar nível ${nivel + 1}"><span class="ic">${icon('estrela')}</span><span class="lbl">Ativar nível ${nivel + 1}</span></button>`;
    h += `</nav><div class="side-foot">${TELAS.filter(t => t.rodape).map(item).join('')}
      <div class="side-note">PORTFÓLIO FEG / MAESTRO</div></div>`;
    return h;
  }
  function telaBloqueada(el, tela){
    const L = GP.NIVEIS[tela.nivel - 1];
    el.innerHTML = `<div class="card empty" style="max-width:620px;margin:40px auto"><div class="ic">${icon(tela.icone, 22)}</div>
      <h3>${esc(tela.titulo)} faz parte do nível ${L.n} · ${esc(L.nome)}</h3><p>${esc(L.resumo)}</p>
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn btn-primary" data-nivel="${L.n}">Ativar nível ${L.n}</button><a class="btn btn-ghost" href="#/painel">Voltar ao painel</a></div></div>`;
  }
  GP.explicarNiveis = () => {
    const nv = GP.nivel();
    modal(`<h3>Níveis do sistema</h3><p class="muted" style="margin:0 0 14px">Comece pelo nível 1. Ative os próximos quando precisar de mais recursos; nada do que foi cadastrado se perde ao trocar de nível.</p>
      <div class="lvl-cards">${GP.NIVEIS.map(L => `<div class="lvl-card ${L.n === nv ? 'on' : ''}"><div class="row"><span class="n">${L.n}</span><h4>${esc(L.nome)}</h4></div><p>${esc(L.resumo)}</p>
        <ul>${L.faz.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p><b>Quando usar:</b> ${esc(L.quando)}</p>
        <button class="btn ${L.n === nv ? 'btn-ghost' : 'btn-primary'} btn-sm" data-nivel="${L.n}" ${L.n === nv ? 'disabled' : ''}>${L.n === nv ? 'Nível atual' : 'Usar nível ' + L.n}</button></div>`).join('')}</div>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Fechar</button></div>`, {largo:true});
  };
  document.addEventListener('click', e => {
    const nv = e.target.closest('[data-nivel]'); if(nv){ closeModal(); GP.setNivel(+nv.dataset.nivel); return; }
    if(e.target.closest('[data-storage-status]')){ GP.go('#/config'); return; }
    if(e.target.closest('[data-ajuda-nivel]')){ GP.explicarNiveis(); return; }
    if(e.target.closest('[data-recolher]')){ S.ui.menuMini = !S.ui.menuMini; GP.save(); hideTip(); render(true); return; }
    if(e.target.closest('[data-menu]')){ const s = document.querySelector('.side'); if(s.classList.contains('open')) fecharMenuMovel(); else { s.classList.add('open'); const b = document.createElement('div'); b.className = 'side-backdrop'; b.addEventListener('click', fecharMenuMovel); document.body.appendChild(b); const f = s.querySelector('.nav-item'); if(f) f.focus(); } return; }
    if(e.target.closest('.side .nav-item') && window.innerWidth <= 900) fecharMenuMovel();
  });

  GP.start = () => { load(); render(); };
})();

