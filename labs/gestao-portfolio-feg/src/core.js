/* =========================================================================
   Gestão de Portfólio FEG — núcleo (estado, rotas, layout, componentes)
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
    n: (v, d=0) => v == null || isNaN(v) ? '—' : nf(d).format(v),
    pct: (v, d=0) => v == null || isNaN(v) ? '—' : nf(d).format(v * 100) + '%',
    brl: v => v == null || v === '' || isNaN(v) ? '—' : 'R$ ' + nf(0).format(v),
    mi: v => v == null || v === '' || isNaN(v) ? '—' : 'R$ ' + nf(2).format(v / 1e6) + ' mi',
    data: v => { if(!v) return '—'; const [y,m,d] = String(v).slice(0,10).split('-'); return d && m && y ? `${d}/${m}/${y}` : esc(v); },
    dataHora: v => v ? new Date(v).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'}) : '—',
  };
  const sum = (a, f = x => x) => a.reduce((s, x) => s + (+f(x) || 0), 0);
  const hoje = () => new Date().toISOString().slice(0, 10);
  const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  GP.util = { esc, clone, fmt, sum, hoje, uid };

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
  let S = null;
  GP.state = () => S;
  GP.save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} };
  GP.resetState = estado => { S = estado; GP.save(); };
  function load(){
    try { S = JSON.parse(localStorage.getItem(KEY)); } catch(e) { S = null; }
    if(!S || !S.v) S = GP.modelo.estadoInicial();
    S = GP.modelo.migrar(S);
    GP.save();
  }

  /* ------------------------------------------------------------------- telas */
  const TELAS = [];
  GP.tela = t => { const i = TELAS.findIndex(x => x.id === t.id); if(i >= 0) TELAS[i] = t; else TELAS.push(t); TELAS.sort((a, b) => (a.ordem || 50) - (b.ordem || 50)); };
  GP.telas = () => TELAS;
  GP.NIVEIS = [
    { n:1, nome:'Cadastro e entrada', curto:'Cadastro',
      resumo:'Registrar todos os projetos num só lugar e decidir o que entra no portfólio.',
      faz:['Cadastrar projetos e demandas', 'Consultar o acervo (ativos, concluídos, recusados)', 'Passar cada demanda pelo checklist de entrada: entra, não entra ou falta informação'],
      quando:'Sempre. É a base de tudo: sem cadastro não há portfólio.' },
    { n:2, nome:'Priorização', curto:'Priorização',
      resumo:'Responder algumas perguntas por projeto. O sistema calcula uma nota de 0 a 100 com os pesos combinados e monta o ranking.',
      faz:['Avaliar cada projeto com perguntas simples (nota 0 a 3)', 'Definir o peso (%) de cada pergunta', 'Ver o ranking e a matriz valor × esforço'],
      quando:'Quando há mais projetos aprovados do que a equipe consegue fazer.' },
    { n:3, nome:'Capacidade e planejamento', curto:'Capacidade',
      resumo:'Informar quantas pessoas (FTE) e quanto orçamento existem. O sistema mostra quais projetos do ranking cabem e quando acontecem.',
      faz:['Simular a carteira que cabe na capacidade e no orçamento', 'Ver o roadmap por trimestre', 'Preparar a pauta do comitê'],
      quando:'No planejamento do ano ou do trimestre e antes do comitê de portfólio.' },
  ];
  GP.nivel = () => S.ui.nivel || 1;
  GP.setNivel = n => { S.ui.nivel = n; GP.save(); render(); toast(`Nível ${n} · ${GP.NIVEIS[n-1].nome}`); };

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
  window.addEventListener('hashchange', () => { closeModal(); render(); });

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
    if(sk){ const c = cols.find(c => c.key === sk.key); if(c){ const g = c.sortVal || (r => r[c.key]); rs.sort((a, b) => { const x = g(a), y = g(b); return ((x ?? '') > (y ?? '') ? 1 : (x ?? '') < (y ?? '') ? -1 : 0) * sk.dir; }); } }
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(c => { const s = id && c.sort !== false; return `<th class="${c.align || ''} ${s ? 'sort' : ''}" ${s ? `data-sort="${esc(id)}|${esc(c.key)}"` : ''}>${esc(c.label)}${sk && sk.key === c.key ? (sk.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`; }).join('')}</tr></thead>
      <tbody>${rs.length ? rs.map(r => `<tr ${rowAttr ? rowAttr(r) : ''}>${cols.map(c => `<td class="${c.align || ''}">${c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="dim" style="text-align:center;padding:28px">${esc(vazioTxt)}</td></tr>`}</tbody></table></div>`;
  };
  GP.ui = { pill, pageHead, secH, kpi, callout, vazio, tabs, table, icon };

  /* ------------------------------------------------------- modal, toast, tip */
  function modal(html, {largo} = {}){ closeModal(); const d = document.createElement('div'); d.className = 'modal-bg'; d.dataset.close = '1';
    d.innerHTML = `<div class="modal ${largo ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(d);
    const f = d.querySelector('input, select, textarea, .btn-primary'); if(f) f.focus(); return d.querySelector('.modal'); }
  function closeModal(){ document.querySelectorAll('.modal-bg').forEach(m => m.remove()); }
  function toast(msg){ let t = document.querySelector('.toast'); if(!t){ t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
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
    if(s){ const [id, key] = s.dataset.sort.split('|'); const cur = S.ui['sort:' + id]; S.ui['sort:' + id] = cur && cur.key === key ? (cur.dir > 0 ? {key, dir:-1} : null) : {key, dir:1}; GP.save(); GP.refresh(); }
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
  // Tooltip do menu recolhido
  let tipEl = null;
  const showTip = el => { if(!document.querySelector('.shell.mini') || window.innerWidth <= 900) return; hideTip(); const r = el.getBoundingClientRect();
    tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.textContent = el.dataset.tip; tipEl.style.left = (r.right + 10) + 'px'; tipEl.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(tipEl); };
  const hideTip = () => { if(tipEl){ tipEl.remove(); tipEl = null; } };
  document.addEventListener('mouseover', e => { const el = e.target.closest('[data-tip]'); if(el) showTip(el); else hideTip(); });
  document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if(el) showTip(el); });
  document.addEventListener('focusout', hideTip);

  /* ------------------------------------------------------------- gráficos */
  const PAL = ['#3E6801', '#8FB94B', '#2F6FA3', '#B7791F', '#7A5BA6', '#B9381F', '#5E655F', '#C6DCA4'];
  const niceMax = v => { if(!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  GP.charts = {
    PAL,
    /** Barras horizontais: [{label, value, color, title}] */
    hbar(items, {max, fmtv = v => fmt.n(v)} = {}){
      const m = max ?? Math.max(1e-9, ...items.map(i => i.value));
      return `<div class="hbars">${items.map((it, i) => `<div class="hb" title="${esc(it.title || it.label)}"><span class="lb">${esc(it.label)}</span><span class="tr"><i style="width:${Math.max(0, Math.min(100, it.value / m * 100))}%;background:${it.color || PAL[0]}"></i></span><span class="v">${fmtv(it.value, it)}</span></div>`).join('')}</div>`;
    },
    /** Rosca: [{label, value, color}] */
    donut(items, {size = 150, centro = '', rotulo = ''} = {}){
      const tot = sum(items, i => i.value) || 1, r = size / 2 - 12, c = size / 2; let a0 = -Math.PI / 2, g = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#F1F1EF" stroke-width="18"/>`;
      items.forEach((it, i) => { const f = it.value / tot; if(f <= 0) return; const a1 = a0 + f * 2 * Math.PI, lg = a1 - a0 > Math.PI ? 1 : 0;
        const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1 - 1e-6), y1 = c + r * Math.sin(a1 - 1e-6);
        g += `<path d="M${x0} ${y0} A${r} ${r} 0 ${lg} 1 ${x1} ${y1}" stroke="${it.color || PAL[i % PAL.length]}" stroke-width="18" fill="none"><title>${esc(it.label)}: ${it.value}</title></path>`; a0 = a1; });
      g += `<text x="${c}" y="${c + 2}" text-anchor="middle" font-size="24" font-weight="700" fill="#1E2420">${esc(centro)}</text><text x="${c}" y="${c + 20}" text-anchor="middle" font-size="11" fill="#5E655F">${esc(rotulo)}</text>`;
      return `<div class="row" style="gap:18px;flex-wrap:nowrap;align-items:center"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex:none" role="img">${g}</svg>
        <div class="legend" style="flex-direction:column;align-items:flex-start;gap:6px">${items.map((it, i) => `<span><i style="background:${it.color || PAL[i % PAL.length]}"></i>${esc(it.label)} <b style="color:#1E2420">${fmt.n(it.value)}</b></span>`).join('')}</div></div>`;
    },
    /** Matriz/dispersão: pontos [{x, y, r, label, color, id}], eixos 0..xMax/yMax, linhas de corte qx/qy, rótulos de quadrante [tl,tr,bl,br] */
    matriz(pts, o = {}){
      const W = o.w || 640, H = o.h || 420, L = 48, R = 16, T = 16, B = 42, pw = W - L - R, ph = H - T - B;
      const xMax = o.xMax ?? niceMax(Math.max(1, ...pts.map(p => p.x))), yMax = o.yMax ?? niceMax(Math.max(1, ...pts.map(p => p.y)));
      const X = v => L + v / xMax * pw, Y = v => T + (1 - v / yMax) * ph;
      let g = `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="#FFFFFF" stroke="#E4E3E4"/>`;
      if(o.qx != null){ g += `<rect x="${L}" y="${T}" width="${X(o.qx) - L}" height="${Y(o.qy) - T}" fill="#F1F6EA"/><line x1="${X(o.qx)}" y1="${T}" x2="${X(o.qx)}" y2="${T + ph}" stroke="#C6DCA4" stroke-dasharray="4 4"/><line x1="${L}" y1="${Y(o.qy)}" x2="${L + pw}" y2="${Y(o.qy)}" stroke="#C6DCA4" stroke-dasharray="4 4"/>`;
        const q = o.quadrantes || []; const lab = (x, y, t, a) => t ? `<text x="${x}" y="${y}" font-size="11" font-weight="600" fill="#8A908B" text-anchor="${a}">${esc(t)}</text>` : '';
        g += lab(L + 8, T + 16, q[0], 'start') + lab(L + pw - 8, T + 16, q[1], 'end') + lab(L + 8, T + ph - 8, q[2], 'start') + lab(L + pw - 8, T + ph - 8, q[3], 'end'); }
      [0, .25, .5, .75, 1].forEach(t => { g += `<text x="${X(xMax * t)}" y="${T + ph + 16}" font-size="10.5" fill="#8A908B" text-anchor="middle">${fmt.n(xMax * t, xMax * t % 1 ? 1 : 0)}</text><text x="${L - 8}" y="${Y(yMax * t) + 4}" font-size="10.5" fill="#8A908B" text-anchor="end">${fmt.n(yMax * t, yMax * t % 1 ? 1 : 0)}</text>`; });
      if(o.xLabel) g += `<text x="${L + pw / 2}" y="${H - 6}" font-size="12" fill="#5E655F" text-anchor="middle">${esc(o.xLabel)} →</text>`;
      if(o.yLabel) g += `<text x="14" y="${T + ph / 2}" font-size="12" fill="#5E655F" text-anchor="middle" transform="rotate(-90 14 ${T + ph / 2})">${esc(o.yLabel)} →</text>`;
      pts.forEach(p => { const rr = p.r || 8; g += `<g ${p.id ? `data-ponto="${esc(p.id)}" style="cursor:pointer"` : ''}><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${rr}" fill="${p.color || PAL[0]}" fill-opacity=".85" stroke="#fff" stroke-width="2"><title>${esc(p.title || p.label)}</title></circle><text x="${X(p.x) + rr + 4}" y="${Y(p.y) + 4}" font-size="11.5" fill="#1E2420">${esc(p.label)}</text></g>`; });
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
    },
    /** Barras verticais simples: cats, series [{name, values, color}] */
    barras(cats, series, {h = 220, fmtv = v => fmt.n(v)} = {}){
      const W = 640, H = h, L = 40, B = 30, T = 12, pw = W - L - 8, ph = H - B - T, m = niceMax(Math.max(1e-9, ...series.flatMap(s => s.values)));
      const gw = pw / cats.length, bw = Math.min(40, (gw - 14) / series.length); let g = '';
      [0, .5, 1].forEach(t => { const y = T + ph * (1 - t); g += `<line x1="${L}" y1="${y}" x2="${W - 8}" y2="${y}" stroke="#EDEDED"/><text x="${L - 6}" y="${y + 4}" font-size="10.5" fill="#8A908B" text-anchor="end">${fmtv(m * t)}</text>`; });
      cats.forEach((c, ci) => { const x0 = L + ci * gw + (gw - bw * series.length) / 2;
        series.forEach((s, si) => { const v = s.values[ci] || 0, hh = ph * v / m; g += `<rect x="${x0 + si * bw + 1}" y="${T + ph - hh}" width="${bw - 2}" height="${Math.max(0, hh)}" rx="3" fill="${s.color || PAL[si]}"><title>${esc(s.name)} · ${esc(c)}: ${fmtv(v)}</title></rect>`; });
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
    const mini = !!S.ui.menuMini, aberto = document.querySelector('.side.open');
    document.title = `${tela ? tela.titulo : 'Início'} · Gestão de Portfólio FEG`;
    app.innerHTML = `<div class="shell ${mini ? 'mini' : ''}">
      <aside class="side ${aberto ? 'open' : ''}" aria-label="Menu">${menu(r, tela, nivel)}</aside>
      <div class="main">
        <header class="topbar">
          <button class="menu-btn" data-menu aria-label="Abrir menu">${icon('menu')}</button>
          <div class="ttl"><small>Gestão de Portfólio · FEG</small><b>${esc(tela ? tela.titulo : '')}</b></div>
          <div class="right">
            <div class="levels"><div class="seg" role="group" aria-label="Nível do sistema">${GP.NIVEIS.map(L => `<button class="${L.n === nivel ? 'on' : ''}" data-nivel="${L.n}" title="Nível ${L.n} · ${esc(L.nome)}"><b>${L.n}</b><span>${esc(L.curto)}</span></button>`).join('')}</div>
              <button class="icon-btn" data-ajuda-nivel title="O que cada nível faz" aria-label="O que cada nível faz">${icon('ajuda', 16)}</button></div>
            <img class="ons" src="${GP.LOGO_ONS || ''}" alt="ONS">
          </div>
        </header>
        <main class="content" id="conteudo"></main>
      </div></div>`;
    const el = document.getElementById('conteudo');
    try {
      if(!tela) el.innerHTML = vazio('Tela não encontrada', 'Volte ao painel.');
      else if(tela.nivel > nivel) telaBloqueada(el, tela);
      else tela.render(el, r);
    } catch(err){ console.error(err); el.innerHTML = callout(`<p><b>Erro ao montar a tela.</b> ${esc(err && err.message)}</p>`, 'warn'); }
    const chave = r.id + '/' + (r.arg || '');
    if(!manterScroll || chave !== ultimaChave) window.scrollTo({top:0});
    ultimaChave = chave;
  }
  function menu(r, tela, nivel){
    const item = t => `<a class="nav-item ${tela && tela.id === t.id ? 'on' : ''}" href="#/${t.id}" data-tip="${esc(t.titulo)}" aria-label="${esc(t.titulo)}"><span class="ic">${icon(t.icone)}</span><span class="lbl">${esc(t.titulo)}</span></a>`;
    let h = `<a class="brand" href="#/painel" data-tip="Gestão de Portfólio FEG">${GP.logoFEG(36)}<span class="txt"><b>Gestão de Portfólio</b><span>Gerência FEG · ONS</span></span></a>`;
    GP.NIVEIS.forEach(L => { if(L.n > nivel) return; const ts = TELAS.filter(t => t.menu !== false && t.nivel === L.n && !t.rodape); if(!ts.length) return;
      h += `<div class="nav-sec">${L.n} · ${esc(L.nome)}</div>` + ts.map(item).join(''); });
    if(nivel < 3) h += `<div class="nav-sec">Mais recursos</div><button class="nav-item" data-nivel="${nivel + 1}" data-tip="Ativar nível ${nivel + 1}" aria-label="Ativar nível ${nivel + 1}"><span class="ic">${icon('estrela')}</span><span class="lbl">Ativar nível ${nivel + 1}</span></button>`;
    h += `<div class="side-foot">${TELAS.filter(t => t.rodape).map(item).join('')}
      <button class="collapse-btn" data-recolher data-tip="${S.ui.menuMini ? 'Expandir menu' : 'Recolher menu'}" aria-label="${S.ui.menuMini ? 'Expandir menu' : 'Recolher menu'}">${icon(S.ui.menuMini ? 'expandir' : 'recolher')}<span class="lbl">Recolher menu</span></button></div>`;
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
    if(e.target.closest('[data-ajuda-nivel]')){ GP.explicarNiveis(); return; }
    if(e.target.closest('[data-recolher]')){ S.ui.menuMini = !S.ui.menuMini; GP.save(); hideTip(); render(true); return; }
    if(e.target.closest('[data-menu]')){ document.querySelector('.side').classList.toggle('open'); return; }
    if(e.target.closest('.side .nav-item') && window.innerWidth <= 900){ const s = document.querySelector('.side'); if(s) s.classList.remove('open'); }
  });

  GP.start = () => { load(); render(); };
})();
