/* =========================================================================
   Gestão de Portfólio FEG - núcleo (estado, rotas, layout, componentes)
   Telas se registram com GP.tela({id, nivel, titulo, icone, menu, render(el, rota)})

   APIs compartilhadas (os pacotes de tela usam com fallback, ex.: GP.ui.metric && GP.ui.metric(...)):
   - GP.util.plural(n, singular, plural)             → '3 projetos'
   - GP.ui.vazio(titulo, texto, acaoHtml = '', icone = 'acervo')
   - GP.ui.metric({label, valor, sub, icone, tom, tint, ratio, delta})
       Mesmo markup do .metric do painel. ratio 0..1 desenha o anel (aria-hidden); delta vira chip ('+3 em 30 dias').
   - GP.ui.table({cols, rows, id, rowAttr, vazioTxt})
       cols: [{key, label, align, fmt(v,row), sortVal(row), sort:false, hm, hideBelow:'lg'|'md', main}]
       hideBelow 'lg' esconde a coluna abaixo de 1360px de área útil; 'md', abaixo de 1100px (nos cartões ela volta).
       Colunas hm:true seguem 'md' por padrão (hideBelow:false desliga) e somem no celular.
       main marca a coluna principal (largura mínima); por padrão é a coluna 'titulo'.
   - GP.ui.tabs(base, itens, atual, rotulo = 'Seções da tela')  → <nav> com aria-current="page"
   - GP.toast(msg, {tipo:'erro'|'ok', acao, onAcao, ms})
       Sem opções funciona como antes. tipo 'erro' fica até ser fechado. acao mostra um botão (ex.: 'Desfazer').
   - GP.confirmar(titulo, html, rotuloOk, onOk, {perigo})  → com perigo, o foco inicial fica em 'Cancelar'.
   - GP.modal(html, {largo}) → o 1º <h3> nomeia o diálogo; o 1º p.muted o descreve.
   - GP.charts.hbar(itens, {max, fmtv, total}) e GP.charts.donut(itens, {size, centro, rotulo})
   - GP.charts.matriz(pontos, opcoes)
       pontos: [{x, y, r, fte, label, color, id, title, quadrante}]
       opcoes: {w, h, xMax, yMax, qx, qy, xLabel, yLabel, quadrantes:[tl,tr,bl,br], quadrantesCor:[...], numerar, aria}
       w é a largura real em px (o chamador mede); sem w, a largura é estimada pela área de conteúdo.
   - GP.charts.dados(titulo, colunas, linhas) → <details> 'Ver dados em tabela'
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
    nuvem:'<path d="M7.5 19h9.6a4.4 4.4 0 00.6-8.76A6 6 0 006.2 9.3 4.85 4.85 0 007.5 19z"/><path d="M9.6 14.2l1.9 1.9 3.4-3.6"/>',
  };
  const icon = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || I.info}</svg>`;
  GP.icon = icon;

  /** Monograma FEG (só a sigla). decorativo = true quando o nome já está no elemento pai. */
  GP.logoFEG = (s = 36, decorativo = false) => `<svg class="feg" width="${s}" height="${s}" viewBox="0 0 40 40" ${decorativo ? 'aria-hidden="true"' : 'role="img" aria-label="FEG"'}><rect width="40" height="40" rx="9" fill="#3E6801"/><text x="20" y="25.5" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="13.5" font-weight="800" letter-spacing=".5" fill="#fff">FEG</text></svg>`;

  /* ------------------------------------------------------------------ estado */
  /* Estado local com recuperação e cópia portátil do HTML. Mantém a chave v1. */
  let S = null, ultimoDisco = null, ultimaBase = '', avisoFalha = false, iniciado = false;
  GP.state = () => S;
  GP.storageKey = KEY;
  GP.storage = { ok:true, conflito:false, salvoEm:null, recuperado:false };
  const assinaturaDados = s => JSON.stringify({projetos:s.projetos,riscos:s.riscos,criterios:s.criterios,capacidade:s.capacidade,forcar:s.forcar});
  const estadoValido = raw => { try { const j = JSON.parse(raw); return j && j.v && Array.isArray(j.projetos) ? j : null; } catch(e){ return null; } };
  /* Confirmação de salvamento: 'Salvo agora' por cerca de 1 s depois de cada gravação (gp:saved). */
  let salvoAgoraAte = 0, salvoTimer = null;
  const pintarSalvamento = () => {
    const b = document.querySelector('[data-storage-status]'); if(!b) return;
    const st = GP.storage, agora = st.ok && !st.conflito && Date.now() < salvoAgoraAte;
    const txt = st.conflito ? 'Outra aba atualizou' : st.ok ? (agora ? 'Salvo agora' : 'Salvo no navegador') : 'Salvar cópia agora';
    b.classList.toggle('error', !st.ok || st.conflito);
    b.classList.toggle('pulse', agora);
    b.innerHTML = `<span class="st-ic">${icon(st.ok && !st.conflito ? 'nuvem' : 'alerta', 15)}</span><span>${txt}</span>`;
    b.setAttribute('aria-label',txt + '. Abrir dados e configurações');
    b.title = st.conflito ? 'Exporte uma cópia das alterações desta sessão ou carregue a versão da outra aba.' : st.ok ? 'Último salvamento: ' + fmt.dataHora(st.salvoEm) + '. Clique para ver as opções de backup.' : 'O navegador não conseguiu salvar. Baixe o backup ou o HTML atualizado para guardar as alterações.';
  };
  GP.pintarSalvamento = pintarSalvamento;
  window.addEventListener('gp:saved', () => {
    if(!iniciado) return;
    salvoAgoraAte = Date.now() + 900; clearTimeout(salvoTimer);
    // Pinta depois do render síncrono que costuma seguir o GP.save()
    setTimeout(pintarSalvamento, 0); salvoTimer = setTimeout(pintarSalvamento, 950);
  });
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
  window.addEventListener('hashchange', () => { closeModal(); fecharMenuMovel(false); render(); });

  /* ------------------------------------------------------------- componentes */
  const pill = (txt, tom = 'neutral') => `<span class="pill t-${tom}"><i></i>${esc(txt)}</span>`;
  const pageHead = ({titulo, sub, acoes}) => `<div class="page-h"><div><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${acoes ? `<div class="actions">${acoes}</div>` : ''}</div>`;
  const secH = (titulo, sub, acoes) => `<div class="sec-h"><div><h3>${titulo}</h3>${sub ? `<p>${sub}</p>` : ''}</div>${acoes ? `<div class="actions">${acoes}</div>` : ''}</div>`;
  const kpi = ({rotulo, valor, unidade, sub, cor}) => `<div class="card kpi"><span class="lbl">${esc(rotulo)}</span><span class="val" ${cor ? `style="color:${cor}"` : ''}>${valor}${unidade ? `<small>${esc(unidade)}</small>` : ''}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</div>`;
  const callout = (html, tipo = '') => `<div class="callout ${tipo}"><span class="ic">${icon(tipo === 'warn' ? 'alerta' : 'info', 16)}</span><div>${html}</div></div>`;
  /** Estado vazio contextual: o 4º parâmetro escolhe o ícone (padrão 'acervo') */
  const vazio = (titulo, texto, acao = '', icone = 'acervo') => `<div class="card empty"><div class="ic">${icon(I[icone] ? icone : 'acervo', 22)}</div><h3>${esc(titulo)}</h3>${texto ? `<p>${texto}</p>` : ''}${acao}</div>`;
  /** Abas que são links de rota: navegação com aria-current, não role=tablist */
  const tabs = (base, itens, atual, rotulo = 'Seções da tela') => `<nav class="tabs" aria-label="${esc(rotulo)}">${itens.map(([k, l]) => `<a class="tab ${k === atual ? 'on' : ''}" href="${base}?aba=${encodeURIComponent(k)}"${k === atual ? ' aria-current="page"' : ''}>${esc(l)}</a>`).join('')}</nav>`;
  /* hideBelow 'lg' (ou ≥1200) some abaixo de 1360px de área útil; 'md', abaixo de 1100px. Colunas hm (secundárias) seguem 'md' salvo hideBelow:false. */
  const classeOculta = c => c.hideBelow === false ? '' : c.hideBelow ? (c.hideBelow === 'md' || (+c.hideBelow && +c.hideBelow < 1200) ? 'hm-md' : 'hm-lg') : c.hm ? 'hm-md' : '';
  /** Tabela ordenável: cols [{key, label, align, fmt(v,row), sortVal(row), sort:false, hm, hideBelow, main}], rows, id (para lembrar ordenação), rowAttr(row) */
  const table = ({cols, rows, id, rowAttr, vazioTxt = 'Nenhum registro.', cartoes}) => {
    const sk = id ? S.ui['sort:' + id] : null; let rs = rows.slice();
    if(sk){ const c = cols.find(c => c.key === sk.key); if(c){ const g = c.sortVal || (r => r[c.key]);
      rs.sort((a, b) => { const x = g(a), y = g(b); const r = (typeof x === 'number' || typeof y === 'number') ? (x ?? -Infinity) - (y ?? -Infinity) : String(x ?? '').localeCompare(String(y ?? ''), 'pt-BR', { sensitivity:'base', numeric:true }); return r * sk.dir; }); } }
    const cls = c => [c.align || '', c.hm ? 'hm' : '', classeOculta(c), (c.main ?? c.key === 'titulo') ? 'col-main' : ''].filter(Boolean).join(' ');
    const ordenaveis = id ? cols.filter(c => c.sort !== false && c.label) : [];
    // No modo cartão (área estreita) o cabeçalho some; a ordenação passa para este seletor, com a mesma chave
    const barra = ordenaveis.length ? `<div class="tbl-sortbar" data-noprint><label>Ordenar por<select class="select" data-sort-select="${esc(id)}" aria-label="Ordenar por"><option value="">Ordem padrão</option>${ordenaveis.map(c => ['1', '-1'].map(d => `<option value="${esc(c.key)}|${d}" ${sk && sk.key === c.key && String(sk.dir) === d ? 'selected' : ''}>${esc(c.label)} (${d === '1' ? 'crescente' : 'decrescente'})</option>`).join('')).join('')}</select></label></div>` : '';
    return `${barra}<div class="tbl-wrap scroll-fade"><table class="tbl tbl-cards${cartoes === 'sm' ? ' tbl-sm' : ''}"><thead><tr>${cols.map(c => { const s = id && c.sort !== false; const on = sk && sk.key === c.key;
        return `<th class="${cls(c)} ${s ? 'sort' : ''}" ${s ? `data-sort="${esc(id)}|${esc(c.key)}" tabindex="-1" aria-sort="${on ? (sk.dir > 0 ? 'ascending' : 'descending') : 'none'}"` : ''}>${s ? `<span class="th-sort" role="button" tabindex="0">${esc(c.label)}</span>` : esc(c.label)}</th>`; }).join('')}</tr></thead>
      <tbody>${rs.length ? rs.map(r => `<tr ${rowAttr ? rowAttr(r) : ''}>${cols.map(c => `<td class="${cls(c)}" data-label="${esc(c.label)}">${c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('') : `<tr class="vazio"><td colspan="${cols.length}" class="dim" style="text-align:center;padding:28px">${esc(vazioTxt)}</td></tr>`}</tbody></table></div>`;
  };
  /** Medidor radial (o mesmo do painel): trilho no tom a 16% e preenchimento com ponta arredondada. Decorativo: o número já é lido. */
  const anel = (ratio, tom = 'var(--c1)', size = 46) => {
    const sw = size >= 80 ? 10 : 5, r = (size - sw) / 2 - 1, c = size / 2, L = 2 * Math.PI * r, f = ratio == null ? 0 : Math.max(0, Math.min(1, ratio));
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${tom}" stroke-opacity=".16" stroke-width="${sw}" style="stroke:${tom}"/>${f > 0 ? `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${tom}" style="stroke:${tom}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${Math.max(.01, f * L)} ${L}" transform="rotate(-90 ${c} ${c})"/>` : ''}</svg>`;
  };
  /** Métrica canônica (mesmo markup e classes do .metric do painel). valor e sub aceitam HTML já escapado. */
  const metric = ({label, valor, sub = '', icone = 'painel', tom = '#668d27', tint = '#f1f6ea', ratio = null, delta = ''} = {}) =>
    `<div class="metric" style="--tone:${tom};--tint:${tint}"><div class="metric-head"><span>${esc(label)}</span><i class="metric-icon">${icon(icone, 15)}</i></div><div class="metric-body"><strong class="metric-value">${valor ?? '-'}</strong>${ratio != null ? anel(ratio, tom, 46) : ''}</div>${delta ? `<span class="metric-delta">${esc(delta)}</span>` : ''}<div class="metric-sub">${sub}</div></div>`;
  GP.ui = { pill, pageHead, secH, kpi, callout, vazio, tabs, table, icon, metric, anel };

  /* ------------------------------------------------------- modal, toast, tip */
  const FOCAVEIS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focaveis = box => [...box.querySelectorAll(FOCAVEIS)].filter(x => x.offsetParent !== null || x.getClientRects().length);
  /** Mantém o Tab dentro de box (modal ou gaveta) */
  const prenderTab = (e, box) => {
    const f = focaveis(box); if(!f.length){ e.preventDefault(); return; }
    const a = f[0], z = f[f.length - 1], at = document.activeElement;
    if(!box.contains(at)){ e.preventDefault(); (e.shiftKey ? z : a).focus(); }
    else if(e.shiftKey && (at === a || at === box.querySelector('[data-foco-inicial]'))){ e.preventDefault(); z.focus(); }
    else if(!e.shiftKey && at === z){ e.preventDefault(); a.focus(); }
  };
  const appInerte = on => { const app = document.getElementById('app'); if(app){ if(on) app.setAttribute('inert', ''); else app.removeAttribute('inert'); } };
  let focoAntes = null, seqModal = 0;
  function modal(html, {largo} = {}){ const ant = document.activeElement; closeModal(); focoAntes = ant; const d = document.createElement('div'); d.className = 'modal-bg'; d.dataset.close = '1';
    d.innerHTML = `<div class="modal ${largo ? 'wide' : ''}" role="dialog" aria-modal="true"><button type="button" class="m-close" data-close="1" aria-label="Fechar">${icon('x', 18)}</button>${html}</div>`; document.body.appendChild(d);
    const m = d.querySelector('.modal'), n = ++seqModal;
    // Nome e descrição acessíveis: 1º título e 1º parágrafo de apoio
    const t = m.querySelector('h1, h2, h3'); if(t){ t.id = t.id || 'gp-modal-t' + n; m.setAttribute('aria-labelledby', t.id); }
    const desc = m.querySelector('p.muted, div.muted, .muted p'); if(desc){ desc.id = desc.id || 'gp-modal-d' + n; m.setAttribute('aria-describedby', desc.id); }
    appInerte(true); document.body.classList.add('has-modal'); posicionarToast();
    // Foco inicial no título (anuncia o diálogo sem acionar nada por engano)
    const alvo = t || m; alvo.setAttribute('tabindex', '-1'); alvo.setAttribute('data-foco-inicial', ''); try { alvo.focus({preventScroll:true}); } catch(e){ alvo.focus(); }
    return m; }
  function closeModal(){ const tinha = document.querySelector('.modal-bg'); document.querySelectorAll('.modal-bg').forEach(m => m.remove());
    if(tinha){ appInerte(false); document.body.classList.remove('has-modal'); posicionarToast(); }
    if(tinha && focoAntes && document.contains(focoAntes)) try { focoVisivel(focoAntes).focus(); } catch(e){} focoAntes = null; }
  /** O gatilho pode ter ficado escondido (item de um menu suspenso que fechou ao ser escolhido): o foco volta ao botão
      que abre esse menu (aria-haspopup/aria-expanded ou summary), procurando nos ancestrais mais próximos. */
  const visivel = x => !!(x && x.getClientRects && x.getClientRects().length);
  function focoVisivel(el){
    if(visivel(el)) return el;
    for(let a = el.parentElement; a && a !== document.body; a = a.parentElement){
      const g = [...a.querySelectorAll(':scope > summary, :scope > [aria-haspopup], :scope > [aria-expanded], :scope > * > [aria-haspopup]')].find(visivel);
      if(g) return g;
    }
    return el;
  }

  /* Avisos: região viva criada no início (o leitor de tela lê o 1º aviso); erro fica até fechar e usa role=alert */
  let toastEl = null, erroEl = null, toastT = null, toastRest = 0, toastFim = 0;
  const garantirToast = () => {
    if(!toastEl || !document.body.contains(toastEl)){ toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); toastEl.setAttribute('aria-atomic', 'true'); document.body.appendChild(toastEl);
      const pausa = () => { if(toastT){ clearTimeout(toastT); toastT = null; toastRest = Math.max(1200, toastFim - Date.now()); } };
      const segue = () => { if(!toastT && toastEl.classList.contains('on') && !toastEl.contains(document.activeElement)) agendar(toastRest || 2000); };
      toastEl.addEventListener('mouseenter', pausa); toastEl.addEventListener('focusin', pausa);
      toastEl.addEventListener('mouseleave', segue); toastEl.addEventListener('focusout', () => setTimeout(segue, 0)); }
    if(!erroEl || !document.body.contains(erroEl)){ erroEl = document.createElement('div'); erroEl.className = 'toast toast-erro'; erroEl.setAttribute('role', 'alert'); document.body.appendChild(erroEl); }
    return toastEl;
  };
  const agendar = ms => { clearTimeout(toastT); toastFim = Date.now() + ms; toastT = setTimeout(() => { toastT = null; if(toastEl) toastEl.classList.remove('on'); }, ms); };
  function posicionarToast(){
    // Com modal aberto, o aviso sobe para ficar acima da barra de ações do modal (medido depois que o chamador preenche o modal)
    const medir = () => { const act = document.querySelector('.modal-bg .m-act'), b = act ? Math.max(24, window.innerHeight - act.getBoundingClientRect().top + 12) : '';
      if(toastEl) toastEl.style.bottom = b === '' ? '' : b + 'px'; };
    medir(); if(window.requestAnimationFrame) requestAnimationFrame(medir);
  }
  function toast(msg, opcoes = {}){
    const {tipo = '', acao = '', onAcao = null, ms = null} = typeof opcoes === 'object' && opcoes ? opcoes : {};
    if(GP.storage && !GP.storage.ok && /salv[ao]|cadastrad|importad|restaurad|atualizad/i.test(String(msg))) msg += '<br>As alterações estão nesta sessão. Baixe uma cópia para guardá-las.';
    garantirToast(); posicionarToast();
    if(tipo === 'erro'){
      erroEl.innerHTML = `<span class="toast-msg">${msg}</span><button type="button" class="toast-x" aria-label="Fechar aviso">${icon('x', 16)}</button>`;
      erroEl.querySelector('.toast-x').onclick = () => erroEl.classList.remove('on'); erroEl.classList.add('on'); return erroEl; }
    const t = toastEl, chars = String(msg).replace(/<[^>]+>/g, '').length;
    t.classList.toggle('t-ok', tipo === 'ok');
    t.innerHTML = `<span class="toast-msg">${msg}</span>${acao ? `<button type="button" class="toast-act">${esc(acao)}</button>` : ''}`;
    if(acao){ t.querySelector('.toast-act').onclick = ev => { ev.stopPropagation(); t.classList.remove('on'); clearTimeout(toastT); toastT = null; if(typeof onAcao === 'function') onAcao(); }; }
    t.classList.add('on'); agendar(ms != null ? +ms : Math.max(acao ? 6000 : 4000, 70 * chars)); return t; }
  function busy(on, msg = 'Processando…'){ document.querySelectorAll('.busy').forEach(b => b.remove()); const c = document.getElementById('conteudo');
    if(!on){ if(c) c.removeAttribute('aria-busy'); return; }
    if(c) c.setAttribute('aria-busy', 'true');
    const d = document.createElement('div'); d.className = 'busy'; d.setAttribute('role', 'status'); d.setAttribute('aria-live', 'assertive'); d.innerHTML = `<div><i aria-hidden="true"></i>${esc(msg)}</div>`; document.body.appendChild(d); }
  /** Confirmação não bloqueante (window.confirm é bloqueado em visualizadores). Com {perigo:true} o foco começa em 'Cancelar'. */
  const confirmar = (titulo, html, rotuloOk, onOk, {perigo} = {}) => {
    const m = modal(`<h3>${esc(titulo)}</h3><div class="muted">${html}</div><div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" data-ok="1">${esc(rotuloOk)}</button></div>`);
    m.querySelector('[data-ok]').addEventListener('click', () => { closeModal(); onOk(); });
    if(perigo){ const c = m.querySelector('.m-act [data-close]'); if(c) c.focus(); }
    return m;
  };
  Object.assign(GP, { modal, closeModal, toast, busy, confirmar });
  const ordenar = (id, key) => { const cur = S.ui['sort:' + id]; S.ui['sort:' + id] = cur && cur.key === key ? (cur.dir > 0 ? {key, dir:-1} : null) : {key, dir:1}; GP.save(); GP.refresh(); };
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close]'); if(c && (c === e.target || c.tagName === 'BUTTON')){ closeModal(); return; }
    const s = e.target.closest('[data-sort]');
    if(s){ ordenar(...s.dataset.sort.split('|'));
      const n = document.querySelector(`th[data-sort="${CSS.escape(s.dataset.sort)}"] .th-sort`); if(n) n.focus({preventScroll:true}); }
  });
  document.addEventListener('change', e => {
    const s = e.target.closest && e.target.closest('[data-sort-select]'); if(!s) return;
    const id = s.dataset.sortSelect, [key, dir] = s.value.split('|'); S.ui['sort:' + id] = key ? {key, dir:+dir || 1} : null; GP.save(); GP.refresh();
    const n = document.querySelector(`[data-sort-select="${CSS.escape(id)}"]`); if(n) n.focus({preventScroll:true});
  });
  // Cabeçalho ordenável recebe o foco programático (compatível com th[data-sort]) e o repassa ao botão interno
  document.addEventListener('focusin', e => { const t = e.target; if(t && t.matches && t.matches('th[data-sort]')){ const b = t.querySelector('.th-sort'); if(b) b.focus({preventScroll:true}); } });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){ hideTip(); hideTT(); if(document.querySelector('.modal-bg')) closeModal(); else fecharMenuMovel(); return; }
    if(e.key === 'Tab'){ const m = document.querySelector('.modal-bg .modal'); if(m){ prenderTab(e, m); return; }
      const g = document.querySelector('.side.open'); if(g && window.innerWidth <= 900) prenderTab(e, g); }
    if((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('th[data-sort], .th-sort')){ e.preventDefault(); e.target.click(); }
    if(e.key === 'Enter' && e.target.matches && e.target.matches('svg [data-ponto], svg [data-grupo]')){ e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', {bubbles:true})); }
  });
  /* Gaveta do menu (≤900px): fora do Tab quando fechada; diálogo modal quando aberta */
  let menuOrigem = null;
  const ehMovel = () => window.innerWidth <= 900;
  const marcarGaveta = () => {
    const s = document.querySelector('.side'); if(!s) return; const aberto = s.classList.contains('open'), movel = ehMovel();
    const main = document.querySelector('.shell > .main'), dock = document.querySelector('.shell > .dock');
    if(movel && !aberto) s.setAttribute('inert', ''); else s.removeAttribute('inert');
    [main, dock].forEach(x => { if(x){ if(movel && aberto) x.setAttribute('inert', ''); else x.removeAttribute('inert'); } });
    if(movel && aberto){ s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', 'Menu'); }
    else { s.removeAttribute('role'); s.removeAttribute('aria-modal'); s.setAttribute('aria-label', 'Menu'); }
    document.querySelectorAll('[data-menu]').forEach(b => { b.setAttribute('aria-controls', 'gp-side'); b.setAttribute('aria-expanded', String(movel && aberto)); });
  };
  const abrirMenuMovel = origem => {
    const s = document.querySelector('.side'); if(!s) return; menuOrigem = origem || document.activeElement;
    s.classList.add('open'); const b = document.createElement('div'); b.className = 'side-backdrop'; b.addEventListener('click', () => fecharMenuMovel()); document.body.appendChild(b);
    marcarGaveta(); const f = s.querySelector('.side-levels button, .nav-item'); if(f) f.focus({preventScroll:true});
  };
  /** Fecha a gaveta. devolver = false quando a navegação vai mover o foco (troca de rota). */
  const fecharMenuMovel = (devolver = true) => { const s = document.querySelector('.side.open'); if(s){ s.classList.remove('open'); document.querySelectorAll('.side-backdrop').forEach(b => b.remove()); marcarGaveta();
      if(devolver && menuOrigem && document.contains(menuOrigem)) try { menuOrigem.focus({preventScroll:true}); } catch(e){} }
    menuOrigem = null; };
  GP.fecharMenuMovel = fecharMenuMovel;
  // Tooltip do menu recolhido
  let tipEl = null;
  const showTip = el => { if(!document.querySelector('.shell.mini') || window.innerWidth <= 900) return; hideTip(); const r = el.getBoundingClientRect();
    tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.setAttribute('role', 'tooltip'); tipEl.textContent = el.dataset.tip; const side = el.closest('.side'); tipEl.style.left = ((side ? side.getBoundingClientRect().right : r.right) + 12) + 'px'; tipEl.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(tipEl); };
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

  /* Sombras de rolagem: .scroll-fade ganha fade-l / fade-r conforme há conteúdo escondido à esquerda/direita */
  const marcarRolagem = box => { const max = box.scrollWidth - box.clientWidth; box.classList.toggle('rola', max > 2); box.classList.toggle('fade-l', max > 2 && box.scrollLeft > 2); box.classList.toggle('fade-r', max > 2 && box.scrollLeft < max - 2); };
  const marcarRolagens = (raiz = document) => raiz.querySelectorAll('.scroll-fade, .tbl-wrap, .chart-scroll, .chips').forEach(marcarRolagem);
  document.addEventListener('scroll', e => { const t = e.target; if(t && t.classList && (t.matches('.scroll-fade, .tbl-wrap, .chart-scroll, .chips'))) marcarRolagem(t); }, { capture:true, passive:true });
  /* No modo cartão o cabeçalho da tabela fica só para leitor de tela (1px, recortado): os botões de ordenação dele saem da
     ordem do Tab (a ordenação passa para o seletor "Ordenar por") e voltam quando o cabeçalho reaparece. */
  const sincronizarOrdenacao = (raiz = document) => raiz.querySelectorAll('thead').forEach(h => { const b = h.querySelectorAll('.th-sort'); if(!b.length) return;
    const r = h.getBoundingClientRect(), oculto = r.width <= 1 || r.height <= 1, t = oculto ? '-1' : '0';
    b.forEach(x => { if(x.getAttribute('tabindex') !== t) x.setAttribute('tabindex', t); }); });
  // Antes de o navegador mover o foco: cobre telas que repintam só um trecho e mudanças de largura da área útil
  document.addEventListener('keydown', e => { if(e.key === 'Tab') sincronizarOrdenacao(); }, true);
  let rsT = null;
  window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { marcarRolagens(); sincronizarOrdenacao(); aplicarMini(); marcarGaveta(); if(!ehMovel() && document.querySelector('.side.open')) fecharMenuMovel(false); }, 120); }, { passive:true });

  /* ------------------------------------------------------------- gráficos */
  const PAL = ['#6b8f2a', '#3a74a8', '#d5a32d', '#00908f', '#b8642c', '#859c98', '#a06137', '#899b67'];
  const TXT = '#17302b', TXT2 = '#5E655F';
  const niceMax = v => { if(!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  const pctTxt = (v, tot) => tot > 0 ? fmt.pct(v / tot) : '-';
  let seqChart = 0;
  /** Largura útil estimada para gráficos chamados sem largura medida (o.w) */
  const larguraEstimada = () => {
    const c = document.getElementById('conteudo'); const cw = c ? c.clientWidth - 24 : 640;
    if(!(cw > 0)) return 640;
    return Math.max(280, Math.round(cw > 740 ? (cw - 18) * 2 / 3 - 44 : cw - 36));
  };
  GP.charts = {
    PAL,
    /** Barras horizontais finas (mesma linguagem do painel): [{label, value, color, title}]. total define o %, padrão = soma. */
    hbar(items, {max, fmtv = v => fmt.n(v), total} = {}){
      const m = max ?? Math.max(1e-9, ...items.map(i => i.value)), tot = total ?? sum(items, i => i.value);
      return `<div class="percent-bars">${items.map(it => { const v = fmtv(it.value, it), p = pctTxt(it.value, tot);
        return `<div class="percent-row" data-tt="${esc(it.title || it.label)}&#10;${esc(v)} · ${esc(p)}"><span class="name">${esc(it.label)}</span><span class="track"><i style="width:${Math.max(0, Math.min(100, it.value / m * 100))}%;--bar:${it.color || PAL[0]}"></i></span><span class="count">${v}<small>${p}</small></span></div>`; }).join('')}</div>`;
    },
    /** Rosca: [{label, value, color}]. Arcos com respiro de 3px, total no centro e legenda em grade (rótulo, valor, %). */
    donut(items, {size = 150, centro = '', rotulo = ''} = {}){
      const tot = sum(items, i => i.value), r = 72, c = 94, L = 2 * Math.PI * r, vivos = items.filter(i => i.value > 0).length, gap = vivos > 1 ? 3 : 0; let off = 0;
      const arcos = items.map((it, i) => { const len = tot ? it.value / tot * L : 0; if(!len) return '';
        const a = `<circle class="arc" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${it.color || PAL[i % PAL.length]}" stroke-width="18" stroke-dasharray="${Math.max(.01, len - gap)} ${L - len + gap}" stroke-dashoffset="${-off}" transform="rotate(-90 ${c} ${c})" data-tt="${esc(it.label)}&#10;${esc(fmt.n(it.value))} · ${esc(pctTxt(it.value, tot))}"/>`; off += len; return a; }).join('');
      const centroTxt = centro === '' ? fmt.n(tot) : centro;
      return `<div class="donut-layout donut-core"><svg width="${size}" height="${size}" viewBox="0 0 188 188" role="img" aria-label="${esc(items.map(i => i.label + ': ' + i.value).join(', '))}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#e9efeb" stroke-width="18"/>${arcos}<text x="${c}" y="${c + 4}" text-anchor="middle" font-size="38" font-weight="700" fill="${TXT}" letter-spacing="-1">${esc(centroTxt)}</text>${rotulo ? `<text x="${c}" y="${c + 26}" text-anchor="middle" font-size="13" fill="${TXT2}">${esc(rotulo)}</text>` : ''}</svg>
        <div class="donut-grid">${items.map((it, i) => `<div class="dg-row"><span class="dg-lbl"><i style="background:${it.color || PAL[i % PAL.length]}"></i>${esc(it.label)}</span><b>${fmt.n(it.value)}</b><small>${pctTxt(it.value, tot)}</small></div>`).join('')}</div></div>`;
    },
    /** Tabela de apoio de um gráfico, recolhida: colunas ['Rótulo', ...] ou [{label, align}], linhas [[...]] (texto simples) */
    dados(titulo, colunas = [], linhas = []){
      const cols = colunas.map(c => typeof c === 'string' ? {label:c} : c);
      return `<details class="chart-data" data-noprint><summary>Ver dados em tabela</summary><div class="chart-data-wrap"><table class="tbl tbl-mini"><caption class="sr-only">${esc(titulo)}</caption><thead><tr>${cols.map(c => `<th scope="col" class="${c.align || ''}">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${linhas.map(l => `<tr>${l.map((v, i) => `<td class="${(cols[i] && cols[i].align) || ''}">${esc(typeof v === 'number' ? fmt.n(v, v % 1 ? 1 : 0) : v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
    },
    /** Matriz/dispersão: pontos [{x, y, r, fte, label, color, id, title, quadrante}], eixos 0..xMax/yMax, cortes qx/qy, rótulos de quadrante [tl,tr,bl,br].
        Opções novas (todas com padrão): w (largura real em px), h, quadrantesCor, numerar. */
    matriz(pts, o = {}){
      const n = ++seqChart, W = Math.round(o.w || larguraEstimada()), compacto = W < 520, numerar = o.numerar ?? compacto, poucosTicks = W < 720;
      const H = Math.round(o.h || (compacto ? Math.max(280, W * .94) : Math.max(380, Math.min(540, W * .64))));
      const L = compacto ? 38 : 50, R = 14, T = 14, B = compacto ? 40 : 44, pw = W - L - R, ph = H - T - B;
      const xMax = o.xMax ?? niceMax(Math.max(1, ...pts.map(p => p.x))), yMax = o.yMax ?? niceMax(Math.max(1, ...pts.map(p => p.y)));
      const X = v => L + Math.max(0, Math.min(1, v / xMax)) * pw, Y = v => T + (1 - Math.max(0, Math.min(1, v / yMax))) * ph;
      const q = o.quadrantes || [], temCorte = o.qx != null && o.qy != null;
      const QK = ['rapido', 'estrategico', 'complementar', 'repensar'], MQ = GP.modelo && GP.modelo.QUADRANTES;
      const qCor = o.quadrantesCor || (MQ && q.length === 4 ? QK.map(k => MQ[k] && MQ[k].cor) : [PAL[0], PAL[1], PAL[2], PAL[4]]);
      const quadDe = p => temCorte ? (p.y >= o.qy ? (p.x >= o.qx ? 1 : 0) : (p.x >= o.qx ? 3 : 2)) : -1;
      const nomeQ = p => p.quadrante && MQ && MQ[p.quadrante] ? MQ[p.quadrante].nome : (q[quadDe(p)] || '');
      const fs = 12, fsT = 11.5, cw = fs * .6;
      let g = `<defs><clipPath id="mtz-clip-${n}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}" rx="14"/></clipPath></defs>`;
      g += `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" rx="14" fill="#ffffff" fill-opacity=".8" stroke="#dfe7e2"/>`;
      // Quadrantes tingidos a 6% na cor de cada um
      const boxes = [], placed = [];
      if(temCorte){
        const cx = X(o.qx), cy = Y(o.qy), qr = [[L, T, cx - L, cy - T], [cx, T, L + pw - cx, cy - T], [L, cy, cx - L, T + ph - cy], [cx, cy, L + pw - cx, T + ph - cy]];
        g += `<g clip-path="url(#mtz-clip-${n})">${qr.map((r, i) => qCor[i] ? `<rect x="${r[0]}" y="${r[1]}" width="${Math.max(0, r[2])}" height="${Math.max(0, r[3])}" fill="${qCor[i]}" fill-opacity=".06"/>` : '').join('')}</g>`;
        g += `<line x1="${cx}" y1="${T}" x2="${cx}" y2="${T + ph}" stroke="#a9bab3" stroke-width="1"/><line x1="${L}" y1="${cy}" x2="${L + pw}" y2="${cy}" stroke="#a9bab3" stroke-width="1"/>`;
        // Rótulos dos quadrantes com contagem, marcador na cor do quadrante e texto na cor de texto
        const cont = [0, 1, 2, 3].map(i => pts.filter(p => quadDe(p) === i).length);
        const lab = (i, x, y, a) => { if(!q[i]) return ''; const t = compacto ? `${q[i]} · ${cont[i]}` : `${q[i]} · ${cont[i]}`, w = t.length * fsT * .58 + 14, x0 = a === 'end' ? x - w : x;
          boxes.push([x0 - 2, y - fsT, w + 4, fsT + 6]);
          return `<g class="mtz-q"><rect x="${a === 'end' ? x - 8 : x}" y="${y - 8.5}" width="8" height="8" rx="2" fill="${qCor[i] || TXT2}"/><text x="${a === 'end' ? x - 13 : x + 13}" y="${y}" font-size="${fsT}" font-weight="650" fill="${TXT}" text-anchor="${a}">${esc(t)}</text></g>`; };
        g += lab(0, L + 12, T + 22, 'start') + lab(1, L + pw - 12, T + 22, 'end') + lab(2, L + 12, T + ph - 12, 'start') + lab(3, L + pw - 12, T + ph - 12, 'end');
        if(!compacto){ const tCorte = `corte ${fmt.n(o.qy)} · ≥${fmt.n(o.qy)} conta como alto`, wC = tCorte.length * 11 * .56;
          g += `<text class="mtz-corte" x="${L + pw - 12}" y="${cy - 7}" font-size="11" fill="${TXT2}" text-anchor="end">${esc(tCorte)}</text><text class="mtz-corte" x="${cx + 6}" y="${T + ph - 30}" font-size="11" fill="${TXT2}">corte ${fmt.n(o.qx)}</text>`;
          boxes.push([L + pw - 12 - wC, cy - 19, wC, 15], [cx + 4, T + ph - 42, 52, 15]); }
      }
      // Eixos: ticks em 0/25/50/75/100 (só 0/50/100 em telas estreitas)
      (poucosTicks ? [0, .5, 1] : [0, .25, .5, .75, 1]).forEach(t => { g += `<text x="${X(xMax * t)}" y="${T + ph + 17}" font-size="${fsT}" fill="${TXT2}" text-anchor="middle">${fmt.n(xMax * t, xMax * t % 1 ? 1 : 0)}</text><text x="${L - 8}" y="${Y(yMax * t) + 4}" font-size="${fsT}" fill="${TXT2}" text-anchor="end">${fmt.n(yMax * t, yMax * t % 1 ? 1 : 0)}</text>`; });
      if(o.xLabel) g += `<text x="${L + pw / 2}" y="${H - 6}" font-size="12" font-weight="600" fill="${TXT2}" text-anchor="middle">${esc(o.xLabel)} →</text>`;
      if(o.yLabel) g += `<text x="13" y="${T + ph / 2}" font-size="12" font-weight="600" fill="${TXT2}" text-anchor="middle" transform="rotate(-90 13 ${T + ph / 2})">${esc(o.yLabel)} →</text>`;
      // Posições, raio pelo FTE (6 + 4·√FTE) e agrupamento de pontos coincidentes (< 2px)
      const P = pts.map((p, i) => ({ p, i, x: X(p.x), y: Y(p.y), r: Math.min(24, p.fte != null && !isNaN(p.fte) ? 6 + 4 * Math.sqrt(Math.max(0, +p.fte)) : (p.r || 8)) }));
      const grupos = []; P.forEach(a => { const gr = grupos.find(gg => Math.hypot(gg[0].x - a.x, gg[0].y - a.y) < 2); if(gr) gr.push(a); else grupos.push([a]); });
      grupos.sort((a, b) => Math.max(...b.map(x => x.r)) - Math.max(...a.map(x => x.r)));
      const lh = fs + 2, colide = (b) => b[0] < L + 2 || b[1] < T + 2 || b[0] + b[2] > L + pw - 2 || b[1] + b[3] > T + ph - 2 || placed.concat(boxes).some(o2 => b[0] < o2[0] + o2[2] && b[0] + b[2] > o2[0] && b[1] < o2[1] + o2[3] && b[1] + b[3] > o2[1])
        || P.some(c => { const nx = Math.max(b[0], Math.min(c.x, b[0] + b[2])), ny = Math.max(b[1], Math.min(c.y, b[1] + b[3])); return Math.hypot(nx - c.x, ny - c.y) < c.r + 1.5; });
      const fmtFte = v => v != null && !isNaN(v) ? `${fmt.n(+v, 1)} FTE` : '';
      let num = 0; const chave = [];
      const marcas = grupos.map(gr => {
        const a = gr[0], p = a.p, multi = gr.length > 1, qn = nomeQ(p);
        const linha2 = [`Valor ${fmt.n(p.y, p.y % 1 ? 1 : 0)}`, `Esforço ${fmt.n(p.x, p.x % 1 ? 1 : 0)}`, qn, fmtFte(p.fte)].filter(Boolean).join(' · ');
        const cab = String(p.title || p.label || '').split('\n')[0];
        const tt = multi ? `${gr.length} projetos no mesmo ponto\n${gr.map(x => x.p.label).join(', ')}\n${linha2}` : `${cab}\n${linha2}`;
        const aria = multi ? `${gr.length} projetos sobrepostos: ${gr.map(x => x.p.label).join(', ')}. ${linha2}` : `${p.label}, ${linha2.replace(/ · /g, ', ')}`;
        const r = Math.max(...gr.map(x => x.r));
        // Rótulo: tenta direita, esquerda, cima e baixo; sem espaço (ou em tela estreita) vira número dentro da bolha
        let rot = '';
        const txt = multi ? `${p.label} +${gr.length - 1}` : String(p.label || ''), w = txt.length * cw + 2;
        if(!numerar && txt){
          const cand = [[a.x + r + 5, a.y - lh / 2, 'start', a.x + r + 5, a.y + fs * .36], [a.x - r - 5 - w, a.y - lh / 2, 'end', a.x - r - 5, a.y + fs * .36], [a.x - w / 2, a.y - r - 4 - lh, 'middle', a.x, a.y - r - 6], [a.x - w / 2, a.y + r + 3, 'middle', a.x, a.y + r + 3 + fs * .9]];
          const ok = cand.find(c => !colide([c[0], c[1], w, lh]));
          if(ok){ placed.push([ok[0], ok[1], w, lh]); rot = `<text class="mtz-lbl" x="${ok[3]}" y="${ok[4]}" font-size="${fs}" font-weight="600" fill="${TXT}" text-anchor="${ok[2]}" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${esc(txt)}</text>`; }
        }
        let dentro = '';
        if(!rot && txt){ num++; chave.push([num, multi ? gr.map(x => x.p.label).join(', ') : p.label]); dentro = `<text x="${a.x}" y="${a.y + 4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle" pointer-events="none">${num}</text>`; }
        const badge = multi ? `<circle cx="${a.x + r * .75}" cy="${a.y - r * .75}" r="9" fill="${TXT}" stroke="#fff" stroke-width="1.5"/><text x="${a.x + r * .75}" y="${a.y - r * .75 + 3.8}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle" pointer-events="none">+${gr.length - 1}</text>` : '';
        const ocultos = multi ? gr.slice(1).map(x => x.p.id ? `<g data-ponto="${esc(x.p.id)}" display="none"></g>` : '').join('') : '';
        return `<g class="mtz-pt" ${p.id ? `data-ponto="${esc(p.id)}" role="link" tabindex="0" style="cursor:pointer"` : 'tabindex="0" role="img"'} aria-label="${esc(aria)}" data-tt="${esc(tt)}"><circle class="hit" cx="${a.x}" cy="${a.y}" r="${Math.max(22, r + 6)}" fill="transparent"/><circle class="dot" cx="${a.x}" cy="${a.y}" r="${r}" fill="${p.color || PAL[0]}" stroke="#fff" stroke-width="2"/>${dentro}${badge}${rot}</g>${ocultos}`;
      });
      // Rótulos desenhados por cima das bolhas: as marcas vão primeiro (menores por cima) e os textos acompanham cada marca
      g += marcas.join('');
      // Legenda de tamanho (só quando o raio vem do FTE)
      const porFte = pts.some(p => p.fte != null);
      const legTam = porFte ? `<div class="mtz-size" aria-hidden="true"><span>Tamanho = pessoas (FTE)</span>${[1, 2, 4].map(v => { const rr = 6 + 4 * Math.sqrt(v); return `<span><svg width="${rr * 2 + 2}" height="${rr * 2 + 2}" viewBox="0 0 ${rr * 2 + 2} ${rr * 2 + 2}"><circle cx="${rr + 1}" cy="${rr + 1}" r="${rr}" fill="none" stroke="#7f958e" stroke-width="1.2"/></svg>${v}</span>`; }).join('')}</div>` : '';
      const legNum = chave.length ? `<p class="mtz-key">${chave.map(([k, l]) => `<span><b>${k}</b> ${esc(l)}</span>`).join('')}</p>` : '';
      return `<svg class="chart mtz${compacto ? ' mtz-compacta' : ''}" width="${W}" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.aria || `${o.yLabel || 'Valor'} × ${o.xLabel || 'Esforço'}: ${pts.length} pontos. Use Tab para percorrer as bolhas.`)}">${g}</svg>${legNum}${legTam}`;
    },
  };

  /* ----------------------------------------------------------------- layout */
  let ultimaChave = '';
  /** Entre 901 e 1279px (notebooks) o trilho abre recolhido por padrão; o botão continua disponível e a escolha de expandir fica em S.ui.menuExpandido */
  const miniAuto = () => window.innerWidth > 900 && window.innerWidth < 1280;
  const estaMini = () => !!S.ui.menuMini || (miniAuto() && !S.ui.menuExpandido);
  function aplicarMini(){ const sh = document.querySelector('.shell'); if(!sh || !S) return; const antes = sh.classList.contains('mini'); sh.classList.toggle('mini', estaMini());
    if(antes !== estaMini()){ const b = sh.querySelector('.nav-toggle'); if(b){ const t = estaMini() ? 'Expandir menu' : 'Recolher menu'; b.dataset.tip = t; b.setAttribute('aria-label', t); b.setAttribute('aria-expanded', String(!estaMini())); b.innerHTML = icon(estaMini() ? 'expandir' : 'recolher', 16); } } sh.classList.toggle('mini-auto', miniAuto()); }
  /** Seletor estável do elemento com foco, para devolvê-lo depois de um render da mesma rota */
  const ESCOPOS = ['.modal', '.side', '.topbar', '.dock', '#conteudo'];
  function chaveFoco(a){
    const app = document.getElementById('app'); if(!a || a === document.body || !app || !app.contains(a)) return null;
    const q = v => '"' + String(v).replace(/["\\]/g, '\\$&') + '"', tag = a.tagName.toLowerCase(); let sel = null;
    if(a.classList.contains('th-sort')){ const th = a.closest('th[data-sort]'); if(th) sel = `th[data-sort=${q(th.dataset.sort)}] .th-sort`; }
    if(!sel && a.id && a.id !== 'conteudo') sel = '#' + CSS.escape(a.id);
    if(!sel){ const d = [...a.attributes].find(x => /^data-/.test(x.name) && !/^data-(tt|tip|label|foco-inicial)$/.test(x.name)); if(d) sel = `${tag}[${d.name}=${q(d.value)}]`; }
    for(const at of ['name', 'href', 'aria-label']) if(!sel && a.getAttribute(at)) sel = `${tag}[${at}=${q(a.getAttribute(at))}]`;
    if(!sel) return null;
    const esc0 = ESCOPOS.find(s => a.closest(s)) || '#app';
    let lista; try { lista = [...document.querySelectorAll(esc0 + ' ' + sel)]; } catch(e){ return null; }
    return { sel: esc0 + ' ' + sel, i: Math.max(0, lista.indexOf(a)), escopo: esc0 };
  }
  function devolverFoco(k){
    if(!k) return; const at = document.activeElement; if(at && at !== document.body && document.contains(at)) return;
    let lista = []; try { lista = [...document.querySelectorAll(k.sel)]; } catch(e){}
    const alvo = lista[k.i] || lista[0];
    if(alvo) try { alvo.focus({preventScroll:true}); } catch(e){}
    if((!alvo || document.activeElement !== alvo) && k.escopo === '.side' && ehMovel()){ const b = document.querySelector('.topbar [data-menu]'); if(b) b.focus({preventScroll:true}); }
  }
  /** Região viva fora do #app: anuncia a página nova a cada troca de rota */
  function anunciar(txt){ let a = document.getElementById('gp-anuncio');
    if(!a){ a = document.createElement('div'); a.id = 'gp-anuncio'; a.className = 'sr-only'; a.setAttribute('aria-live', 'polite'); a.setAttribute('aria-atomic', 'true'); document.body.appendChild(a); }
    a.textContent = ''; setTimeout(() => { a.textContent = txt; }, 60); }
  function render(manterScroll){
    const app = document.getElementById('app'); if(!app) return;
    const r = parse(), nivel = GP.nivel();
    const tela = TELAS.find(t => t.id === r.id) || TELAS.find(t => t.id === 'painel');
    const chave = r.id + '/' + (r.arg || ''), mudouRota = chave !== ultimaChave, primeira = !ultimaChave;
    const foco = mudouRota ? null : chaveFoco(document.activeElement);
    const mini = estaMini(), aberto = document.querySelector('.side.open') && ehMovel();
    const painel = tela && tela.id === 'painel', titulo = tela ? tela.titulo : '';
    const L = tela && tela.nivel ? GP.NIVEIS[tela.nivel - 1] : null, secao = tela && tela.gerencial ? 'Visão gerencial' : tela && tela.rodape ? 'Configuração' : L ? `Nível ${L.n} · ${L.curto}` : '';
    const [dLonga, dCurta] = datas();
    document.title = `${titulo || 'Início'} · Gestão de Portfólio FEG`;
    // Ambiente de cor por área (percepção de mudança de contexto): gerencial, operação, priorização, planejamento, configurações
    document.documentElement.dataset.ambiente = !tela ? 'gerencial' : tela.rodape ? 'config' : tela.gerencial ? 'gerencial' : ({1:'operacao', 2:'priorizacao', 3:'planejamento'})[tela.nivel] || 'gerencial';
    const quando = `<span class="when"><span class="when-l">${esc(dLonga)}</span><span class="when-s" aria-hidden="true">${esc(dCurta)}</span></span>`;
    const niveis = cls => GP.NIVEIS.map(Lv => `<button type="button" class="${Lv.n === nivel ? 'on' : ''}" data-nivel="${Lv.n}" data-alternar aria-pressed="${Lv.n === nivel}" aria-label="Nível ${Lv.n}, ${esc(Lv.nome)}${Lv.n === nivel && Lv.n > 1 ? ' (ativo; clique para desativar)' : ''}" title="${Lv.n === nivel && Lv.n > 1 ? `Nível ${Lv.n} ativo · clique de novo para desativar e voltar ao nível ${Lv.n - 1}` : `Nível ${Lv.n} · ${esc(Lv.nome)}`}"><b aria-hidden="true">${Lv.n}</b><span aria-hidden="true">${esc(Lv.curto)}</span></button>`).join('');
    app.innerHTML = `<a class="skip" href="#conteudo" data-pular>Ir para o conteúdo</a><div class="shell ${mini ? 'mini' : ''} ${miniAuto() ? 'mini-auto' : ''}">
      <aside class="side ${aberto ? 'open' : ''}" id="gp-side" aria-label="Menu">${menu(r, tela, nivel, niveis)}</aside>
      <div class="main">
        <header class="topbar">
          <button type="button" class="menu-btn" data-menu aria-label="Abrir menu" aria-controls="gp-side" aria-expanded="false">${icon('menu')}</button>
          <div class="ttl">${painel
            ? `<small><span class="crumb">${esc(titulo)}</span>${quando}</small><b>${esc(saudacao())}</b>`
            : `<small>${secao ? `<span class="sec">${esc(secao)}</span>` : ''}${quando}</small><b class="crumb">${esc(titulo)}</b>`}</div>
          <div class="right">
            <button type="button" class="storage-btn" data-storage-status title="Dados e configurações"><span class="st-ic">${icon('nuvem', 15)}</span><span>Salvo no navegador</span></button>
            <div class="levels"><div class="seg" role="group" aria-label="Nível do sistema">${niveis()}</div>
              <button type="button" class="icon-btn" data-ajuda-nivel title="O que cada nível faz" aria-label="O que cada nível faz">${icon('ajuda', 16)}</button></div>
            <img class="ons" src="${GP.LOGO_ONS || ''}" alt="ONS">
          </div>
        </header>
        <main class="content" id="conteudo" tabindex="-1"></main>
      </div>${dock(tela)}</div>`;
    const el = document.getElementById('conteudo');
    try {
      if(!tela) el.innerHTML = vazio('Tela não encontrada', 'Volte ao painel.');
      else if(tela.nivel > nivel) telaBloqueada(el, tela);
      else tela.render(el, r);
    } catch(err){ console.error(err); el.innerHTML = callout(`<p><b>Erro ao montar a tela.</b> ${esc(err && err.message)}</p>`, 'warn'); }
    if(!manterScroll || mudouRota) window.scrollTo({top:0});
    ultimaChave = chave;
    el.querySelectorAll('table.tbl:not(.tbl-cards):not(.tbl-mini)').forEach(t => { const ths = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim());
      if(!ths.length) return; t.classList.add('tbl-cards'); t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if(!td.hasAttribute('data-label')) td.setAttribute('data-label', ths[i] || ''); })); });
    el.querySelectorAll('.tbl-wrap').forEach(w => w.classList.add('scroll-fade'));
    // Item ativo do trilho sempre à vista (com 24px de respiro), sem rolar a página
    const nav = app.querySelector('.side-nav'), ativo = nav && nav.querySelector('.nav-item.on');
    if(ativo){ const m = 24, topo = ativo.offsetTop, base = topo + ativo.offsetHeight;
      if(topo < nav.scrollTop + m) nav.scrollTop = Math.max(0, topo - m);
      else if(base > nav.scrollTop + nav.clientHeight - m) nav.scrollTop = base - nav.clientHeight + m; }
    GP.pintarSalvamento(); marcarGaveta(); topoRolado(); marcarRolagens(el);
    if(GP.afterRender) GP.afterRender(el,r);
    sincronizarOrdenacao(el);
    if(mudouRota){
      anunciar('Página: ' + (titulo || 'Início'));
      // Na troca de rota o foco vai para o título da tela nova (não na 1ª carga: o 1º Tab mostra 'Ir para o conteúdo')
      if(!primeira){ const h = el.querySelector('h1') || el; if(h !== el) h.setAttribute('tabindex', '-1'); try { h.focus({preventScroll:true}); } catch(e){} }
    } else devolverFoco(foco);
  }
  /* Saudação e data do cabeçalho */
  function saudacao(){
    const h = new Date().getHours(), oi = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    let nome = ''; try { const u = GP.auth && GP.auth.usuario && GP.auth.usuario(); nome = u && u.nome ? String(u.nome).trim().split(/\s+/)[0] : ''; } catch(e) {}
    return nome ? `${oi}, ${nome}` : oi;
  }
  /** [longa, curta]: 'Segunda-feira, 5 de outubro' e 'Seg., 5 out.' (a curta entra por container query, sem reticências) */
  function datas(){ const d = new Date(), cap = t => t.charAt(0).toUpperCase() + t.slice(1);
    const longa = cap(d.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' }));
    const sem = cap(d.toLocaleDateString('pt-BR', { weekday:'short' }).replace(/\.$/, '')), mes = d.toLocaleDateString('pt-BR', { month:'short' }).replace(/\.$/, '');
    return [longa, `${sem}., ${d.getDate()} ${mes}.`]; }
  function dataLonga(){ return datas()[0]; }
  GP.dataLonga = dataLonga;
  /* Topo com fundo quando a página rola (o conteúdo não aparece atrás do texto do cabeçalho) */
  function topoRolado(){ const t = document.querySelector('.topbar'); if(t) t.classList.toggle('is-scrolled', window.scrollY > 4); }
  window.addEventListener('scroll', topoRolado, { passive:true });
  /** Dock inferior do celular: atalhos para as tarefas mais frequentes */
  function dock(tela){
    const id = tela ? tela.id : '', it = (href, ic, lbl, cls = '') => { const on = id === href.slice(2); return `<a class="dock-item ${cls} ${on ? 'on' : ''}" href="${href}" aria-label="${lbl}"${on ? ' aria-current="page"' : ''}>${icon(ic, 19)}<span>${lbl}</span></a>`; };
    return `<nav class="dock" aria-label="Atalhos">${it('#/painel', 'painel', 'Painel')}${it('#/acervo', 'acervo', 'Projetos')}${it('#/novo', 'novo', 'Novo', 'add')}${it('#/funil', 'funil', 'Funil')}<button type="button" class="dock-item" data-menu aria-label="Abrir menu completo" aria-controls="gp-side" aria-expanded="false">${icon('menu', 19)}<span>Menu</span></button></nav>`;
  }
  function menu(r, tela, nivel, niveis){
    const item = t => { const on = tela && tela.id === t.id; return `<a class="nav-item ${on ? 'on' : ''}" href="#/${t.id}" data-tip="${esc(t.titulo)}" aria-label="${esc(t.titulo)}"${on ? ' aria-current="page"' : ''}><span class="ic">${icon(t.icone)}</span><span class="lbl">${esc(t.titulo)}</span></a>`; };
    const mini = estaMini();
    let h = `<div class="side-top"><a class="brand" href="#/painel" data-tip="Gestão de Portfólio FEG" aria-label="Gestão de Portfólio FEG, ir para o painel">${GP.logoFEG(36, true)}<span class="txt" aria-hidden="true"><b>Gestão de Portfólio</b><span>FEG · ONS · Maestro</span></span></a>
      <button type="button" class="side-close" data-fechar-menu aria-label="Fechar menu">${icon('x', 20)}</button></div>
      <div class="side-levels" role="group" aria-label="Nível do sistema">${niveis()}</div>
      <div class="nav-heading"><span>Navegação</span><button type="button" class="nav-toggle" data-recolher data-tip="${mini ? 'Expandir menu' : 'Recolher menu'}" aria-label="${mini ? 'Expandir menu' : 'Recolher menu'}" aria-expanded="${!mini}">${icon(mini ? 'expandir' : 'recolher',16)}</button></div>
      <nav class="side-nav" aria-label="Áreas do portfólio"><div class="nav-sec">Visão gerencial</div>${TELAS.filter(t => t.gerencial).map(item).join('')}`;
    GP.NIVEIS.forEach(L => { if(L.n > nivel) return; const ts = TELAS.filter(t => t.menu !== false && t.nivel === L.n && !t.rodape && !t.gerencial); if(!ts.length) return;
      h += `<div class="nav-sec" title="Nível ${L.n} · ${esc(L.nome)}">Nível ${L.n} · ${esc(L.curto)}</div>` + ts.map(item).join(''); });
    if(nivel < 3) h += `<div class="nav-sec">Mais recursos</div><button type="button" class="nav-item" data-nivel="${nivel + 1}" data-tip="Ativar nível ${nivel + 1}" aria-label="Ativar nível ${nivel + 1}"><span class="ic">${icon('estrela')}</span><span class="lbl">Ativar nível ${nivel + 1}</span></button>`;
    h += `</nav><div class="side-foot">${TELAS.filter(t => t.rodape).map(item).join('')}
      <div class="side-note">PORTFÓLIO FEG / MAESTRO</div></div>`;
    return h;
  }
  function telaBloqueada(el, tela){
    const L = GP.NIVEIS[tela.nivel - 1];
    el.innerHTML = `<div class="card empty" style="max-width:620px;margin:40px auto"><div class="ic">${icon(tela.icone, 22)}</div>
      <h1 class="empty-h">${esc(tela.titulo)} faz parte do nível ${L.n} · ${esc(L.nome)}</h1><p>${esc(L.resumo)}</p>
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn btn-primary" data-nivel="${L.n}">Ativar nível ${L.n}</button><a class="btn btn-ghost" href="#/painel">Voltar ao painel</a></div></div>`;
  }
  GP.explicarNiveis = () => {
    const nv = GP.nivel();
    modal(`<h3>Níveis do sistema</h3><p class="muted" style="margin:0 0 14px">Comece pelo nível 1. Ative os próximos quando precisar de mais recursos; nada do que foi cadastrado se perde ao trocar de nível.</p>
      <div class="lvl-cards">${GP.NIVEIS.map(L => `<div class="lvl-card ${L.n === nv ? 'on' : ''}"><div class="row"><span class="n">${L.n}</span><h4>${esc(L.nome)}</h4></div><p>${esc(L.resumo)}</p>
        <ul>${L.faz.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p><b>Quando usar:</b> ${esc(L.quando)}</p>
        ${L.n === nv ? (L.n > 1 ? `<button class="btn btn-ghost btn-sm" data-nivel="${L.n}" data-alternar>Desativar nível ${L.n}</button>` : '<button class="btn btn-ghost btn-sm" disabled>Nível atual (sempre ativo)</button>') : `<button class="btn btn-primary btn-sm" data-nivel="${L.n}">Usar nível ${L.n}</button>`}</div>`).join('')}</div>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Fechar</button></div>`, {largo:true});
  };
  document.addEventListener('click', e => {
    const pular = e.target.closest('[data-pular]'); if(pular){ e.preventDefault(); const c = document.getElementById('conteudo'); if(c){ const h = c.querySelector('h1'); const alvo = h || c; if(h) h.setAttribute('tabindex', '-1'); alvo.focus(); } return; }
    const nv = e.target.closest('[data-nivel]'); if(nv){ closeModal(); let n = +nv.dataset.nivel;
      // Clicar de novo no nível ativo desativa o módulo e volta ao anterior; o nível 1 (cadastro) fica sempre ativo
      if(nv.hasAttribute('data-alternar') && n === GP.nivel() && n > 1){ n -= 1; GP.setNivel(n); GP.toast(`Nível ${n + 1} desativado. Você voltou ao nível ${n} · ${GP.NIVEIS[n - 1].nome}. Nada do que foi cadastrado se perde.`); return; }
      GP.setNivel(n); return; }
    if(e.target.closest('[data-storage-status]')){ GP.go('#/config'); return; }
    if(e.target.closest('[data-ajuda-nivel]')){ GP.explicarNiveis(); return; }
    if(e.target.closest('[data-fechar-menu]')){ fecharMenuMovel(); return; }
    if(e.target.closest('[data-recolher]')){ if(ehMovel()) return;
      if(miniAuto()){ const expandir = estaMini(); S.ui.menuExpandido = expandir; if(expandir) S.ui.menuMini = false; } else S.ui.menuMini = !S.ui.menuMini;
      GP.save(); hideTip(); render(true); return; }
    const mb = e.target.closest('[data-menu]');
    if(mb){ const s = document.querySelector('.side'); if(s.classList.contains('open')) fecharMenuMovel(); else abrirMenuMovel(mb); return; }
    if(e.target.closest('.side .nav-item, .side .brand') && ehMovel()) fecharMenuMovel(false);
  });

  GP.start = () => { load(); garantirToast(); anunciar(''); render(); iniciado = true; };
})();
