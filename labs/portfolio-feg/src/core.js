/* =========================================================================
   Portfólio FEG — NÚCLEO COMUM (core.js)
   Contrato completo para os módulos: ver labs/portfolio-feg/CONTRATO.md
   Resumo:
   - PF.registerLevel({id, nome, subtitulo, pergunta, objetivos, unlock:{minPct, desafio},
       screens:[{id, titulo, icone, escreve?, render(el, ctx)}], questions:[...], desafio:{titulo, descricao, render(el, ctx, done)}})
   - PF.registerGlobal({id, titulo, icone, ordem, rodape?, render(el, ctx)})   → rota #/<id>
   - Registros compartilhados: PF.registerDash, PF.registerKpi, PF.registerFichaTab, PF.registerGlossario, PF.registerConfigCard
   - Dados: PF.base (referência, congelada) · PF.db() (trabalho) · PF.write/append/arquivar/validar · PF.regra/badge · PF.hash · PF.msg
   - Perguntas: erro não revela a resposta; "Ver resposta" retira o crédito; alternativas embaralhadas por semente.
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF = window.PF || {};
  PF.APP_NAME = PF.APP_NAME || 'Portfólio FEG';
  PF.APP_SUB = PF.APP_SUB || 'Trilha de gestão de portfólio';
  const KEY = 'portfolio-feg-v1';

  /* ------------------------------------------------------------------ util */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const nf = (d=0) => new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d, maximumFractionDigits:d});
  const fmt = {
    n: (v,d=0) => v==null||isNaN(v) ? '—' : nf(d).format(v),
    pct: (v,d=0) => v==null||isNaN(v) ? '—' : nf(d).format(v*100)+'%',
    brl: (v,d=0) => v==null||isNaN(v) ? '—' : 'R$ '+nf(d).format(v),
    mi: (v,d=1) => v==null||isNaN(v) ? '—' : 'R$ '+nf(d).format(v)+' mi',
    date: v => { if(!v) return '—'; const d = new Date(v+'T00:00:00'); return isNaN(d) ? esc(v) : d.toLocaleDateString('pt-BR'); },
  };
  const sum = (arr, f=x=>x) => arr.reduce((a,b)=>a+(+f(b)||0),0);
  const avg = (arr, f=x=>x) => arr.length ? sum(arr,f)/arr.length : 0;
  const groupBy = (arr, f) => arr.reduce((m,x)=>{ const k=typeof f==='function'?f(x):x[f]; (m[k] ||= []).push(x); return m; },{});
  const uid = (p='id') => p+'-'+Math.random().toString(36).slice(2,8);
  PF.util = { esc, clone, fmt, sum, avg, groupBy, uid };

  /* ----------------------------------------------------------------- icons */
  const ICONS = {
    home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    dashboard:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    chart:'<path d="M3 20h18"/><path d="M6 20v-6"/><path d="M11 20V9"/><path d="M16 20v-9"/><path d="M5 9l5-4 4 3 6-5"/>',
    gauge:'<path d="M4 16a8 8 0 1116 0"/><path d="M12 16l4-5"/>',
    scale:'<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7a4 4 0 006 0z"/><path d="M19 7l-3 7a4 4 0 006 0z"/>',
    matrix:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/>',
    bubble:'<circle cx="8" cy="15" r="4"/><circle cx="16" cy="8" r="3"/><circle cx="17" cy="17" r="2"/>',
    people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.6 3.6-5.5 6.5-5.5s5.5 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.6c2.6.2 4.4 2 5.2 4.9"/>',
    flow:'<rect x="3" y="4" width="6" height="5" rx="1.5"/><rect x="15" y="4" width="6" height="5" rx="1.5"/><rect x="9" y="15" width="6" height="5" rx="1.5"/><path d="M6 9v3h12V9M12 12v3"/>',
    branch:'<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10"/><path d="M18 10c0 4-6 3-12 7"/>',
    risk:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4"/><path d="M12 17v.5"/>',
    money:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    forum:'<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    gavel:'<path d="M14 4l6 6"/><path d="M11 7l6 6"/><path d="M12.5 5.5l-6 6 3 3 6-6"/><path d="M8 13l-5 5"/><path d="M13 21h8"/>',
    layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    question:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.2-1.5 2.5"/><path d="M12 17v.5"/>',
    trophy:'<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4"/><path d="M12 13v4M8 21h8M9 17h6"/>',
    lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 017.5-2"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x:'<path d="M6 6l12 12M18 6L6 18"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
    bulb:'<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 00-3.9 10.6c.6.6.9 1.4.9 2.4h6c0-1 .3-1.8.9-2.4A6 6 0 0012 3z"/>',
    book:'<path d="M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4z"/><path d="M20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z"/>',
    pdf:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5"/>',
    reset:'<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v5h5"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    download:'<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 20h16"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  };
  const icon = (n, s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]||ICONS.info}</svg>`;
  PF.icon = icon; PF.ICONS = ICONS;

  /* ----------------------------------------------------------------- state */
  const freshState = () => ({ v:1, instrutor:false, respostas:{}, desafios:{}, concluidos:{}, medalhas:{}, work:null, mod:{}, ui:{}, perfil:{nome:''} });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || freshState(); } catch(e){ S = freshState(); }
  S = Object.assign(freshState(), S);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} };
  PF.state = () => S;
  PF.save = save;
  PF.modState = id => (S.mod[id] ||= {});            // estado livre de cada módulo, persistido
  PF.ui_state = (k, def) => (k in S.ui ? S.ui[k] : def);
  PF.set_ui = (k, v) => { S.ui[k] = v; save(); };

  /* ------------------------------------------------------------------ data */
  PF.base = PF.base || {};                        // definido em data.js
  const dataV = () => (PF.base && PF.base.versao) || 1;
  PF.db = () => { if(!S.work || S.workV !== dataV()) { S.work = clone(PF.base); S.workV = dataV(); save(); } return S.work; };
  PF.saveDb = () => save();
  PF.resetDb = () => { S.work = clone(PF.base); S.workV = dataV(); save(); };
  PF.fonteLabel = { FONTE_ONS:'Fonte ONS · documento aprovado', DECISAO_FUNCIONAL_PRODUTO:'Decisão de produto', A_VALIDAR_FEG:'A validar FEG', ILUSTRATIVO:'Ilustrativo' };

  /* ---------------------------------------------------------------- levels */
  const LEVELS = [];
  PF.levels = () => LEVELS;
  PF.registerLevel = def => {
    def.screens = def.screens || [];
    def.questions = def.questions || [];
    def.unlock = Object.assign({ minPct:70, desafio:true }, def.unlock || {});
    const i = LEVELS.findIndex(l=>l.id===def.id); if(i>=0) LEVELS[i]=def; else LEVELS.push(def);
    LEVELS.sort((a,b)=>a.id-b.id);
  };
  const lvl = id => LEVELS.find(l=>l.id===id);
  PF.level = lvl;
  const graded = q => !q.aprofundamento && !q.conferirFonte;
  const counts = r => !!(r && r.best && !r.revelada);
  PF.levelStats = id => {
    const L = lvl(id); if(!L) return {total:0, ok:0, feitas:0, pct:0};
    const qs = L.questions.filter(graded), total = qs.length;
    const ok = qs.filter(q => counts(S.respostas[q.id])).length;
    const feitas = qs.filter(q => S.respostas[q.id]).length;
    const porTipo = {}; ['conceito','analise','decisao'].forEach(t => { const g = qs.filter(q=>q.tipo===t); porTipo[t] = {total:g.length, ok:g.filter(q=>counts(S.respostas[q.id])).length}; });
    return { total, ok, feitas, pct: total ? ok/total : 0, desafio: S.desafios[id] || null, porTipo };
  };
  PF.levelDone = id => {
    const L = lvl(id); if(!L) return false;
    if(S.concluidos[id]) return true;
    const st = PF.levelStats(id);
    return st.pct*100 >= L.unlock.minPct - 1e-9 && (!L.unlock.desafio || !L.desafio || !!(st.desafio && st.desafio.feito));
  };
  PF.unlocked = id => id === 1 || S.instrutor || PF.levelDone(id-1);
  PF.currentLevel = () => { let c = 1; LEVELS.forEach(L => { if(PF.unlocked(L.id)) c = L.id; }); return c; };
  PF.award = (id, label) => { if(!S.medalhas[id]){ S.medalhas[id] = {label, ts: new Date().toISOString()}; save(); toast(`${icon('trophy',16)} Medalha: <b>${esc(label)}</b>`); } };
  const checkLevelMedals = () => LEVELS.forEach(L => { if(!S.concluidos[L.id] && PF.levelDone(L.id)){ S.concluidos[L.id] = new Date().toISOString(); save(); }
    if(S.concluidos[L.id]) PF.award('nivel-'+L.id, `Nível ${L.id} concluído — ${L.nome}`); });
  PF.resetLevel = id => { LEVELS.filter(L=>L.id>=id).forEach(L => { (L.questions||[]).forEach(q=>delete S.respostas[q.id]); delete S.desafios[L.id]; delete S.concluidos[L.id]; delete S.medalhas['nivel-'+L.id]; }); save(); };

  /* --------------------------------------------------------------- globals */
  const GLOBALS = [];
  PF.globals = () => GLOBALS;
  PF.registerGlobal = def => { const i = GLOBALS.findIndex(g=>g.id===def.id); if(i>=0) GLOBALS[i]=def; else GLOBALS.push(def); GLOBALS.sort((a,b)=>(a.ordem||50)-(b.ordem||50)); };
  /* Registros compartilhados entre telas globais e níveis */
  PF.dash = []; PF.kpis = []; PF.fichaTabs = []; PF.glossario = []; PF.configCards = [];
  PF.registerDash = b => { PF.dash.push(b); PF.dash.sort((a,b)=>(a.nivel-b.nivel)||((a.ordem||50)-(b.ordem||50))); };
  PF.registerKpi = k => { const i = PF.kpis.findIndex(x=>x.id===k.id); if(i>=0) PF.kpis[i]=k; else PF.kpis.push(k); };
  PF.registerFichaTab = t => { PF.fichaTabs.push(t); PF.fichaTabs.sort((a,b)=>(a.nivel-b.nivel)||((a.ordem||50)-(b.ordem||50))); };
  PF.registerGlossario = (nivel, itens) => itens.forEach(x => PF.glossario.push(Object.assign({nivel}, x)));
  PF.registerConfigCard = c => PF.configCards.push(c);

  /* ---------------------------------------------------------------- router */
  const parse = () => {
    const raw = (location.hash || '#/inicio').replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const query = {}; (qs||'').split('&').filter(Boolean).forEach(kv => { const [k,v] = kv.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v||''); });
    const [a, b] = path.split('/');
    if(/^n[1-3]$/.test(a)) return { nivel: +a.slice(1), screen: b || null, query };
    return { nivel: 0, screen: a || 'inicio', query };
  };
  PF.route = parse;
  PF.go = path => { if(location.hash === path) render(); else location.hash = path; };
  PF.refresh = () => render(true);
  window.addEventListener('hashchange', () => render());

  /* -------------------------------------------------------------- ui bits */
  const tag = f => f ? `<span class="tag fonte-${esc(f)}" title="${esc(PF.fonteLabel[f]||f)}">${esc(PF.fonteLabel[f]||f)}</span>` : '';
  const kpi = ({label, value, unit, sub, tone, fonte, title}) => `<div class="card kpi ${tone||''}" ${title?`title="${esc(title)}"`:''}>
      <div class="lbl"><span>${esc(label)}</span>${tag(fonte)}</div>
      <div class="val">${value}${unit?`<small>${esc(unit)}</small>`:''}</div>${sub?`<div class="sub">${sub}</div>`:''}</div>`;
  const pill = (label, tone='dim') => `<span class="pill tone-${tone}"><i></i>${esc(label)}</span>`;
  const callout = (kind, html, title) => `<div class="callout ${kind}"><span class="ic">${icon(kind==='conceito'?'book':kind==='atencao'?'risk':'bulb',16)}</span><div>${title?`<p><b>${esc(title)}</b></p>`:''}${html}</div></div>`;
  const section = (title, sub, actions='') => `<div class="sec-h"><div><h3>${esc(title)}</h3>${sub?`<p>${sub}</p>`:''}</div>${actions?`<div class="row">${actions}</div>`:''}</div>`;
  const pageHead = ({eyebrow, title, sub, actions}) => `<div class="page-h"><div>${eyebrow?`<div class="eyebrow">${eyebrow}</div>`:''}<h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
  /** table({cols:[{key,label,align:'r'|'c',fmt:(v,row)=>html, sort:true}], rows, rowAttr:(r)=>'', id}) — sortable columns persist in ui state */
  const table = ({cols, rows, rowAttr, id, empty='Nenhum registro.'}) => {
    const sk = id ? PF.ui_state('sort:'+id, null) : null;
    let rs = rows.slice();
    if(sk){ const c = cols.find(c=>c.key===sk.key); if(c){ const g = c.sortVal || (r=>r[c.key]);
      rs.sort((a,b)=>{ const x=g(a), y=g(b); return (x>y?1:x<y?-1:0)*(sk.dir); }); } }
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(c=>`<th class="${c.align||''} ${id&&c.sort!==false?'sort':''}" ${id&&c.sort!==false?`data-pf-sort="${esc(id)}|${esc(c.key)}"`:''}>${esc(c.label)}${sk&&sk.key===c.key?(sk.dir>0?' ▲':' ▼'):''}</th>`).join('')}</tr></thead>
      <tbody>${rs.length ? rs.map(r=>`<tr ${rowAttr?rowAttr(r):''}>${cols.map(c=>`<td class="${c.align||''}">${c.fmt?c.fmt(r[c.key], r):esc(r[c.key])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" class="dim" style="text-align:center;padding:24px">${esc(empty)}</td></tr>`}</tbody></table></div>`;
  };
  PF.ui = { esc, tag, kpi, pill, callout, section, pageHead, table, icon };

  /* --------------------------------------------------------- modal/toast */
  function modal(html, {wide}={}){ closeModal(); const d=document.createElement('div'); d.className='modal-bg'; d.dataset.pfClose='1';
    d.innerHTML=`<div class="modal" role="dialog" aria-modal="true" style="${wide?'width:min(900px,100%)':''}">${html}</div>`; document.body.appendChild(d);
    const f = d.querySelector('.btn-primary, input, select'); if(f) f.focus(); return d.querySelector('.modal'); }
  function closeModal(){ document.querySelectorAll('.modal-bg').forEach(m=>m.remove()); }
  function toast(msg){ let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
    t.innerHTML=msg; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'), 3800); }
  function busy(on, msg='Processando…'){ document.querySelectorAll('.busy').forEach(b=>b.remove()); if(!on) return;
    const d=document.createElement('div'); d.className='busy'; d.innerHTML=`<div><i></i>${msg}</div>`; document.body.appendChild(d); }
  PF.modal = modal; PF.closeModal = closeModal; PF.toast = toast; PF.busy = busy;
  /** confirm não bloqueante (window.confirm é bloqueado em visualizadores sandbox) */
  PF.confirm = (title, html, okLabel, onOk) => {
    const m = modal(`<h3>${esc(title)}</h3><div class="muted">${html}</div><div class="m-act"><button class="btn btn-ghost btn-sm" data-pf-close="1">Cancelar</button><button class="btn btn-primary btn-sm" data-pf-ok="1">${esc(okLabel)}</button></div>`);
    m.querySelector('[data-pf-ok]').addEventListener('click', () => { closeModal(); onOk(); });
  };
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-pf-close]'); if(c && (c === e.target || c.tagName==='BUTTON')) { closeModal(); return; }
    const s = e.target.closest('[data-pf-sort]');
    if(s){ const [id, key] = s.dataset.pfSort.split('|'); const cur = PF.ui_state('sort:'+id, null);
      PF.set_ui('sort:'+id, cur && cur.key===key ? (cur.dir>0 ? {key, dir:-1} : null) : {key, dir:1}); PF.refresh(); }
  });
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });

  /* -------------------------------------------------------------- charts */
  const PALETTE = ['#D3CE22','#F2F2F2','#AEAB33','#8EC5D6','#E9B44C','#A9ACB0','#9CCB5B','#E4675A','#7E7C24','#C9B8E8'];
  const TONE = { ok:'#9CCB5B', warn:'#E9B44C', bad:'#E4675A', info:'#8EC5D6', lime:'#D3CE22', olive:'#AEAB33', paper:'#F2F2F2', dim:'#9A9DA2' };
  const color = (c, i) => TONE[c] || c || PALETTE[i % PALETTE.length];
  const niceMax = v => { if(!(v>0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; };
  const charts = {
    PALETTE, TONE, color,
    /** barras horizontais: items [{label, value, color?, title?, mark?}], opts {max, fmt, markLabel} */
    hbar(items, {max, fmt:f=v=>fmt.n(v,1)}={}){
      const m = max ?? Math.max(1e-9, ...items.map(i=>Math.max(i.value, i.mark||0)));
      return `<div class="hbars">${items.map((it,i)=>`<div class="hb" title="${esc(it.title||it.label)}"><span class="lb">${esc(it.label)}</span>
        <span class="tr"><i style="width:${Math.max(0,Math.min(100,it.value/m*100))}%;background:${color(it.color,i)}"></i>${it.mark!=null?`<span class="mark" style="left:${Math.min(100,it.mark/m*100)}%" title="${esc(it.markTitle||'referência')}"></span>`:''}</span>
        <span class="v">${f(it.value, it)}</span></div>`).join('')}</div>`;
    },
    /** barras verticais (agrupadas opcionalmente): cats ['A','B'], series [{name, values:[..], color}] */
    bars(cats, series, {height=220, fmt:f=v=>fmt.n(v,0), max}={}){
      const W = 640, H = height, L = 36, B = 34, T = 14, pw = W-L-8, ph = H-B-T;
      const m = max ?? niceMax(Math.max(...series.flatMap(s=>s.values)));
      const gw = pw/cats.length, bw = Math.min(42, (gw-12)/series.length);
      let g = '';
      [0,.25,.5,.75,1].forEach(t=>{ const y=T+ph*(1-t); g+=`<line x1="${L}" y1="${y}" x2="${W-8}" y2="${y}" stroke="rgba(255,255,255,${t?0.08:0.2})"/><text x="${L-6}" y="${y+4}" fill="#9A9DA2" font-size="10" text-anchor="end">${esc(f(m*t))}</text>`; });
      cats.forEach((c,ci)=>{ const x0 = L + ci*gw + (gw - bw*series.length)/2;
        series.forEach((s,si)=>{ const v=s.values[ci]||0, h=ph*v/m, x=x0+si*bw, y=T+ph-h;
          g+=`<rect x="${x+1}" y="${y}" width="${bw-2}" height="${Math.max(0,h)}" rx="3" fill="${color(s.color,si)}"><title>${esc(s.name)} · ${esc(c)}: ${esc(f(v))}</title></rect>`; });
        g+=`<text x="${L+ci*gw+gw/2}" y="${H-12}" fill="#C3C5C8" font-size="11" text-anchor="middle">${esc(c)}</text>`; });
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>${series.length>1?charts.legend(series.map((s,i)=>({label:s.name,color:color(s.color,i)}))):''}`;
    },
    /** rosca: items [{label, value, color?}], opts {size, centerValue, centerLabel} */
    donut(items, {size=180, centerValue='', centerLabel=''}={}){
      const tot = sum(items, i=>i.value) || 1, r = size/2-10, c = size/2, sw = 22; let a0 = -Math.PI/2, g='';
      items.forEach((it,i)=>{ const frac = it.value/tot; if(frac<=0) return; const a1 = a0 + frac*2*Math.PI;
        const large = a1-a0 > Math.PI ? 1:0, x0=c+r*Math.cos(a0), y0=c+r*Math.sin(a0), x1=c+r*Math.cos(a1-1e-6), y1=c+r*Math.sin(a1-1e-6);
        g += `<path d="M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}" stroke="${color(it.color,i)}" stroke-width="${sw}" fill="none"><title>${esc(it.label)}: ${fmt.n(it.value)} (${fmt.pct(frac)})</title></path>`; a0 = a1; });
      g += `<text x="${c}" y="${c+4}" text-anchor="middle" fill="#fff" font-size="26" font-family="Outfit,sans-serif" font-weight="300">${esc(centerValue)}</text><text x="${c}" y="${c+24}" text-anchor="middle" fill="#9A9DA2" font-size="11">${esc(centerLabel)}</text>`;
      return `<div class="row" style="gap:18px;align-items:center;flex-wrap:nowrap"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" style="flex:none">${g}</svg>
        <div class="legend" style="flex-direction:column;align-items:flex-start;gap:6px">${items.map((it,i)=>`<span><i style="background:${color(it.color,i)}"></i>${esc(it.label)} <b class="num" style="color:#fff;font-weight:500">${fmt.n(it.value)}</b></span>`).join('')}</div></div>`;
    },
    /** barra 100% empilhada: items [{label, value, color}] */
    stack(items){
      const tot = sum(items, i=>i.value) || 1;
      return `<div class="stackbar">${items.map((it,i)=>`<i style="width:${it.value/tot*100}%;background:${color(it.color,i)}" title="${esc(it.label)}: ${fmt.n(it.value)} (${fmt.pct(it.value/tot)})"></i>`).join('')}</div>
        <div class="legend" style="margin-top:8px">${items.map((it,i)=>`<span><i style="background:${color(it.color,i)}"></i>${esc(it.label)} ${fmt.pct(it.value/tot)}</span>`).join('')}</div>`;
    },
    /** dispersão/bolhas: points [{x,y,r?,label,color?,id?,title?}], opts {xLabel,yLabel,xMin,xMax,yMin,yMax, qx, qy, quadLabels:[tl,tr,bl,br], highlight:id, labels:true} */
    bubble(points, o={}){
      const W=o.width||640, H=o.height||400, L=52, R=18, T=18, B=44, pw=W-L-R, ph=H-T-B;
      const xMin=o.xMin??0, xMax=o.xMax??niceMax(Math.max(1,...points.map(p=>p.x))*1.08), yMin=o.yMin??0, yMax=o.yMax??niceMax(Math.max(1,...points.map(p=>p.y))*1.08);
      const X = v => L + (v-xMin)/(xMax-xMin||1)*pw, Y = v => T + (1-(v-yMin)/(yMax-yMin||1))*ph;
      const rMax = Math.max(1, ...points.map(p=>p.r||1));
      let g = `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" rx="8" fill="rgba(0,0,0,.14)"/>`;
      if(o.qx!=null && o.qy!=null){
        g += `<line x1="${X(o.qx)}" y1="${T}" x2="${X(o.qx)}" y2="${T+ph}" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/><line x1="${L}" y1="${Y(o.qy)}" x2="${L+pw}" y2="${Y(o.qy)}" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/>`;
        if(o.quadHi) { const q=o.quadHi; const rx = q.includes('r') ? X(o.qx) : L, ry = q.includes('t') ? T : Y(o.qy), rw = q.includes('r') ? L+pw-X(o.qx) : X(o.qx)-L, rh = q.includes('t') ? Y(o.qy)-T : T+ph-Y(o.qy);
          g += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="rgba(211,206,34,.10)"/>`; }
        const ql = o.quadLabels || [];
        const lab = (x,y,t,a) => t?`<text x="${x}" y="${y}" fill="rgba(255,255,255,.42)" font-size="10.5" letter-spacing="1.4" text-anchor="${a}" font-family="Outfit,sans-serif">${esc(String(t).toUpperCase())}</text>`:'';
        g += lab(L+8,T+16,ql[0],'start') + lab(L+pw-8,T+16,ql[1],'end') + lab(L+8,T+ph-8,ql[2],'start') + lab(L+pw-8,T+ph-8,ql[3],'end');
      }
      const ticks = (a,b) => [0,.25,.5,.75,1].map(t=>a+(b-a)*t);
      ticks(xMin,xMax).forEach(v=>g+=`<text x="${X(v)}" y="${T+ph+16}" fill="#9A9DA2" font-size="10" text-anchor="middle">${esc(o.xFmt?o.xFmt(v):fmt.n(v,v%1?1:0))}</text>`);
      ticks(yMin,yMax).forEach(v=>g+=`<text x="${L-8}" y="${Y(v)+4}" fill="#9A9DA2" font-size="10" text-anchor="end">${esc(o.yFmt?o.yFmt(v):fmt.n(v,v%1?1:0))}</text>`);
      if(o.xLabel) g += `<text x="${L+pw/2}" y="${H-6}" fill="#C3C5C8" font-size="11.5" text-anchor="middle">${esc(o.xLabel)} →</text>`;
      if(o.yLabel) g += `<text x="14" y="${T+ph/2}" fill="#C3C5C8" font-size="11.5" text-anchor="middle" transform="rotate(-90 14 ${T+ph/2})">${esc(o.yLabel)} →</text>`;
      points.slice().sort((a,b)=>(b.r||1)-(a.r||1)).forEach((p,i)=>{ const rr = o.fixedR || (6 + 16*Math.sqrt((p.r||1)/rMax)); const hl = o.highlight && o.highlight===p.id;
        g += `<g ${p.id?`data-pf-point="${esc(p.id)}"`:''} style="cursor:${p.id?'pointer':'default'}"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${rr}" fill="${color(p.color,i)}" fill-opacity="${hl?0.95:0.72}" stroke="${hl?'#fff':'#404347'}" stroke-width="${hl?2.5:1.5}"><title>${esc(p.title||p.label)}</title></circle>
          ${o.labels!==false?`<text x="${X(p.x)+rr+4}" y="${Y(p.y)+4}" fill="#fff" font-size="11">${esc(p.label)}</text>`:''}</g>`; });
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
    },
    /** medidor semicircular: value, {max, label, tone, thresholds:[{v,tone}]} */
    gauge(value, {max=1, label='', tone, display}={}){
      const W=200, H=120, c=100, r=80, f=Math.max(0,Math.min(1,value/max)), a=Math.PI*(1-f);
      const x=c+r*Math.cos(a), y=110-r*Math.sin(a), col = color(tone||'lime');
      return `<svg viewBox="0 0 ${W} ${H}" width="200" role="img"><path d="M20 110 A80 80 0 0 1 180 110" stroke="rgba(255,255,255,.1)" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M20 110 A80 80 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" stroke="${col}" stroke-width="16" fill="none" stroke-linecap="round"/>
        <text x="100" y="96" text-anchor="middle" fill="#fff" font-size="28" font-family="Outfit,sans-serif" font-weight="300">${esc(display ?? fmt.pct(f))}</text>
        <text x="100" y="116" text-anchor="middle" fill="#9A9DA2" font-size="11">${esc(label)}</text></svg>`;
    },
    /** linhas: xLabels [..], series [{name, values, color, dash}] */
    line(xLabels, series, {height=220, fmt:f=v=>fmt.n(v,0), max, min=0, refLine}={}){
      const W=640, H=height, L=40, R=12, T=14, B=30, pw=W-L-R, ph=H-T-B;
      const m = max ?? niceMax(Math.max(...series.flatMap(s=>s.values), refLine?.value||0));
      const X = i => L + (xLabels.length<2?pw/2:i*pw/(xLabels.length-1)), Y = v => T + ph*(1-(v-min)/(m-min||1));
      let g='';
      [0,.25,.5,.75,1].forEach(t=>{ const v=min+(m-min)*t; g+=`<line x1="${L}" y1="${Y(v)}" x2="${W-R}" y2="${Y(v)}" stroke="rgba(255,255,255,${t?0.08:0.2})"/><text x="${L-6}" y="${Y(v)+4}" fill="#9A9DA2" font-size="10" text-anchor="end">${esc(f(v))}</text>`; });
      if(refLine) g+=`<line x1="${L}" y1="${Y(refLine.value)}" x2="${W-R}" y2="${Y(refLine.value)}" stroke="#E4675A" stroke-dasharray="5 4"/><text x="${W-R}" y="${Y(refLine.value)-5}" fill="#E4675A" font-size="10.5" text-anchor="end">${esc(refLine.label||'')}</text>`;
      xLabels.forEach((l,i)=>g+=`<text x="${X(i)}" y="${H-10}" fill="#C3C5C8" font-size="10.5" text-anchor="middle">${esc(l)}</text>`);
      series.forEach((s,si)=>{ const pts = s.values.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
        g+=`<polyline points="${pts}" fill="none" stroke="${color(s.color,si)}" stroke-width="2.4" ${s.dash?'stroke-dasharray="6 4"':''}/>`;
        s.values.forEach((v,i)=>g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="${color(s.color,si)}"><title>${esc(s.name)} · ${esc(xLabels[i])}: ${esc(f(v))}</title></circle>`); });
      return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>${series.length>1||refLine?charts.legend(series.map((s,i)=>({label:s.name,color:color(s.color,i)}))):''}`;
    },
    /** mapa de calor: rows [label], cols [label], cell(ri,ci)=>{v (0..1), text, title} */
    heat(rows, cols, cell){
      return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${cols.map(c=>`<th class="c">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,ri)=>`<tr><td>${esc(r)}</td>${cols.map((c,ci)=>{ const x = cell(ri,ci)||{};
        const v = Math.max(0,Math.min(1,x.v||0)); return `<td class="c" title="${esc(x.title||'')}" style="background:rgba(211,206,34,${(0.05+v*0.75).toFixed(2)});color:${v>.55?'#2C2E31':'#fff'};font-weight:500">${x.text??''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
    },
    legend(items){ return `<div class="legend" style="margin-top:8px">${items.map(i=>`<span><i style="background:${i.color}"></i>${esc(i.label)}</span>`).join('')}</div>`; },
  };
  charts.niceMax = niceMax;
  PF.charts = charts;

  /* ------------------------------------------------------- dados & regras */
  /** Hash FNV-1a 32 bits sobre JSON com chaves ordenadas (detecção de mudança; não é segurança). */
  const stable = v => Array.isArray(v) ? '['+v.map(stable).join(',')+']' : (v && typeof v==='object') ? '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}' : JSON.stringify(v);
  PF.hash = obj => { let h = 0x811c9dc5; const s = stable(obj); for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000'+h.toString(16)).slice(-8); };
  const deepFreeze = o => { if(o && typeof o==='object' && !Object.isFrozen(o)){ Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
  PF.perfil = () => S.perfil || (S.perfil = {nome:''});
  const autor = () => (PF.perfil().nome || '').trim() || 'Aprendiz (perfil local)';

  const MSG = {
    REQUIRED: c => `Preencha ${c.campo || 'o campo obrigatório'}.`,
    INVALID_URL: () => 'O link precisa ser um endereço válido (ex.: https://…).',
    HIERARCHY_MISMATCH: c => c.campo === 'squadId' ? 'A squad escolhida não pertence a esta comunidade.' : 'A comunidade escolhida não pertence a esta gerência.',
    VALIDATION_ERROR: c => c.texto || 'Verifique os dados informados.',
    INCOMPATIBLE_UNIT: () => 'Esta linha está em outra unidade e não entra na soma em FTE. O app não converte horas em FTE.',
    SOURCE_REQUIRED: () => 'Valor sem fonte ou período: fica fora dos indicadores.',
    SNAPSHOT_LOCKED: () => 'Fotografia fechada não muda. Gere uma nova versão ou registre uma correção.',
    RULE_NOT_VALIDATED: c => `Este material usa regras ainda não validadas pela FEG${c.lista?': '+c.lista:''}.`,
    JUSTIFICATIVA: c => `Escreva uma justificativa com pelo menos ${c.min||20} caracteres.`,
  };
  /** Mensagem em linguagem simples; o código técnico vai no tooltip. */
  PF.msg = (codigo, c={}) => (MSG[codigo] ? MSG[codigo](c) : codigo);
  PF.msgHtml = (codigo, c={}) => `<span title="${esc(codigo)}">${esc(PF.msg(codigo, c))}</span>`;

  const ROTULO_CAMPO = { titulo:'o título', descricaoObjetivo:'a descrição/objetivo', gerenciaId:'a gerência', comunidadeId:'a comunidade', responsavel:'o responsável' };
  /** Validação de iniciativas (regras do repositório: initiativeRules.js + hierarquia das migrations 0012/0014). Retorna [{campo, codigo, msg}] */
  PF.validar = (colecao, o, d = PF.db()) => {
    const errs = []; const push = (campo, codigo, extra={}) => errs.push({campo, codigo, msg: PF.msg(codigo, Object.assign({campo: ROTULO_CAMPO[campo]||campo}, extra))});
    if(colecao === 'iniciativas'){
      ['titulo','descricaoObjetivo','gerenciaId','comunidadeId','responsavel'].forEach(k => { if(!String(o[k] ?? '').trim()) push(k, 'REQUIRED'); });
      if(o.linkOperacional){ try{ new URL(o.linkOperacional); } catch(e){ push('linkOperacional', 'INVALID_URL'); } }
      const com = (d.comunidades||[]).find(c=>c.id===o.comunidadeId);
      if(o.comunidadeId && o.gerenciaId && (!com || com.gerenciaId !== o.gerenciaId || com.ativo === false)) push('comunidadeId', 'HIERARCHY_MISMATCH');
      if(o.squadId){ const sq = (d.squads||[]).find(s=>s.id===o.squadId); if(!sq || sq.comunidadeId !== o.comunidadeId || sq.ativo === false) errs.push({campo:'squadId', codigo:'HIERARCHY_MISMATCH', msg:PF.msg('HIERARCHY_MISMATCH',{campo:'squadId'})}); }
    }
    return errs;
  };
  /** Edita um registro do Trabalho: valida, grava histórico por campo, rowVersion++. Retorna {ok, errors}. */
  PF.write = (colecao, id, patch, {justificativa=''}={}) => {
    const d = PF.db(), arr = d[colecao]; const reg = arr && arr.find(x=>x.id===id);
    if(!reg) return { ok:false, errors:[{codigo:'VALIDATION_ERROR', msg:'Registro não encontrado.'}] };
    const merged = Object.assign({}, reg, patch);
    const errors = PF.validar(colecao, merged, d); if(errors.length) return { ok:false, errors };
    const quando = new Date().toISOString(); d.historico = d.historico || [];
    Object.keys(patch).forEach(k => { if(stable(reg[k]) !== stable(patch[k])) d.historico.push({ id: uid('H'), entidade: colecao, entidadeId: id, campoAlterado: k, valorAnterior: reg[k] ?? null, valorNovo: patch[k] ?? null,
      usuarioId: autor(), alteradoEm: quando, origemAlteracao: 'APP_TRILHA', justificativa, simulacao: true }); });
    Object.assign(reg, patch, { rowVersion: (reg.rowVersion||0) + 1, updatedAt: quando }); save();
    return { ok:true, errors:[] };
  };
  /** Acrescenta registro append-only (decisoes, pendencias, avaliacoes, historico, snapshotsForum, medicoesBeneficio…). */
  PF.append = (colecao, reg) => { const d = PF.db(); d[colecao] = d[colecao] || [];
    const r = Object.assign({ id: uid(colecao.slice(0,3).toUpperCase()), registradoEm: new Date().toISOString(), usuarioId: autor(), simulacao: true }, reg);
    d[colecao].push(r); save(); return r; };
  /** Arquivar = ativo:false com justificativa (não existe excluir). */
  PF.arquivar = (id, justificativa) => { if(String(justificativa||'').trim().length < 10) return { ok:false, errors:[{codigo:'VALIDATION_ERROR', msg:PF.msg('JUSTIFICATIVA',{min:10})}] };
    return PF.write('iniciativas', id, { ativo:false }, { justificativa }); };

  /** Regra/parâmetro vigente pelo código (R13…). Lê do Trabalho (parâmetros editáveis) ou da referência. */
  PF.regra = (codigo, {base=false}={}) => { const src = base ? PF.base : PF.db(); const rs = ((src && src.regras) || []).filter(r=>r.codigo===codigo);
    if(!rs.length) return null; const vig = rs.filter(r=>r.vigente !== false); return (vig.length ? vig : rs).slice().sort((a,b)=>(b.versao||1)-(a.versao||1))[0]; };
  const BADGE = r => {
    if(!r) return null;
    const o = r.origemRegra, t = r.tipoFonte;
    if(o === 'ILUSTRATIVO') return { cls:'ILUSTRATIVO', txt:'Ilustrativo' };
    if(o === 'FONTE_ONS' && t === 'DOCUMENTO_ONS_APROVADO') return { cls:'FONTE_ONS', txt:'Fonte ONS · documento aprovado' };
    if(o === 'FONTE_ONS') return { cls:'A_VALIDAR_FEG', txt:'A validar FEG (sem documento aprovado)' };
    if(o === 'A_VALIDAR_FEG' && t === 'PROPOSTA_CONSULTORIA'){ const s = (String(r.referencia||'').match(/\bs\d{1,3}\b/)||[])[0]; return { cls:'A_VALIDAR_FEG', txt:`Proposta A&M${s?' · '+s:''} · a validar` }; }
    if(o === 'A_VALIDAR_FEG' && t === 'COMENTARIO_REVISAO') return { cls:'A_VALIDAR_FEG', txt:'Rascunho de revisão · a validar' };
    if(o === 'A_VALIDAR_FEG') return { cls:'A_VALIDAR_FEG', txt:'A validar FEG' };
    if(o === 'DECISAO_FUNCIONAL_PRODUTO' && t === 'REF_MERCADO') return { cls:'DECISAO_FUNCIONAL_PRODUTO', txt:'Decisão de produto · Ref. mercado' };
    if(o === 'DECISAO_FUNCIONAL_PRODUTO') return { cls:'DECISAO_FUNCIONAL_PRODUTO', txt:'Decisão de produto' };
    return { cls:'ILUSTRATIVO', txt: o || 'Sem rótulo' };
  };
  /** Badge de origem. Aceita código de regra ('R13'), origem ('A_VALIDAR_FEG'|'ILUSTRATIVO'…) ou objeto {origemRegra, tipoFonte, referencia}. Clique abre a ficha da regra. */
  PF.badge = x => {
    if(!x) return '';
    if(Array.isArray(x)) return x.map(PF.badge).join(' ');
    let r = null, code = null;
    if(typeof x === 'string' && /^R\d/.test(x)){ r = PF.regra(x); code = x; if(!r) return `<span class="tag fonte-A_VALIDAR_FEG" title="Regra ${esc(x)} não cadastrada">A validar FEG</span>`; }
    else if(typeof x === 'string') r = { origemRegra: x };
    else r = x;
    const b = BADGE(r);
    return `<span class="tag fonte-${b.cls}" ${code?`data-pf-regra="${esc(code)}" style="cursor:pointer"`:''} title="${esc((code?code+' · ':'')+(r.referencia||PF.fonteLabel[r.origemRegra]||''))}">${esc(b.txt)}</span>`;
  };
  PF.fichaRegra = code => { const r = PF.regra(code); if(!r) return;
    const val = r.valor === undefined ? '—' : (typeof r.valor === 'object' ? `<code style="white-space:pre-wrap">${esc(JSON.stringify(r.valor, null, 1))}</code>` : esc(r.valor));
    modal(`<div class="eyebrow">Ficha da regra · ${esc(r.codigo)}</div><h3>${esc(r.nome || r.chave || r.codigo)}</h3><div class="row" style="margin-bottom:12px">${PF.badge(r.codigo)}</div>
      <div class="tbl-wrap"><table class="tbl"><tbody>
        <tr><td class="dim">Valor</td><td>${val}</td></tr>
        <tr><td class="dim">Origem</td><td>${esc(r.origemRegra||'—')}</td></tr>
        <tr><td class="dim">Tipo de fonte</td><td>${esc(r.tipoFonte||'—')}</td></tr>
        <tr><td class="dim">Status de validação</td><td>${esc(r.statusValidacao||'A_VALIDAR')}</td></tr>
        <tr><td class="dim">Versão</td><td>${esc(r.versao||1)}${r.vigente===false?' (não vigente)':''}</td></tr>
        <tr><td class="dim">Referência</td><td>${esc(r.referencia||'—')}</td></tr>
        ${r.descricao?`<tr><td class="dim">Descrição</td><td>${esc(r.descricao)}</td></tr>`:''}
      </tbody></table></div>
      <p class="dim" style="font-size:12.5px">Nenhuma regra deste app é oficial. Promoção real só fora do app, com documento ONS aprovado.</p>
      <div class="m-act"><button class="btn btn-primary btn-sm" data-pf-close="1">Fechar</button></div>`); };
  PF.ui.badge = PF.badge;
  PF.ui.seloExercicio = () => `<div class="selo-exercicio">${icon('edit',14)} Exercício: registro simulado, sem efeito oficial</div>`;
  /** Atualiza só um contêiner (use em eventos 'input' contínuos, como sliders; PF.refresh fica para 'change'). */
  PF.patch = (root, sel, html) => { const t = (root||document).querySelector(sel); if(t) t.innerHTML = html; };
  document.addEventListener('click', e => { const b = e.target.closest('[data-pf-regra]'); if(b){ e.preventDefault(); e.stopPropagation(); PF.fichaRegra(b.dataset.pfRegra); } }, true);

  /* ------------------------------------------------------------------ quiz */
  const TYPE_LABEL = { conceito:'Conceito', analise:'Análise do portfólio', decisao:'Decisão de escolha' };
  const answerOf = qid => S.respostas[qid];
  const resolve = (x, d, extra) => typeof x === 'function' ? x(d, extra) : x;
  const near = (v, ans, tol) => { if(ans == null || isNaN(ans)) return false; if(tol && typeof tol==='object' && tol.rel!=null) return Math.abs(v-ans) <= Math.abs(ans)*tol.rel + 1e-9; return Math.abs(v-ans) <= (tol ?? 0.01) + 1e-9; };
  const qData = q => q.usaTrabalho ? PF.db() : PF.base;
  /** Registra uma tentativa. best preserva o melhor resultado; revelada retira o crédito. */
  const record = (q, ok, val) => { const p = S.respostas[q.id] || {}; S.respostas[q.id] = { ok:!!ok, best: !!(ok || p.best), n:(p.n||0)+1, val, revelada: !!p.revelada, retry:false, ts:new Date().toISOString() }; save(); checkLevelMedals(); };
  const seeded = seed => { let h = 0x811c9dc5; for(let i=0;i<seed.length;i++){ h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return () => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ t>>>15, t|1); t ^= t + Math.imul(t ^ t>>>7, t|61); return ((t ^ t>>>14) >>> 0) / 4294967296; }; };
  const shuffle = (arr, seed) => { const a = arr.slice(), r = seeded(seed); for(let i=a.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
  /** Normaliza alternativas: strings → ids 'A','B',…; correta numérica → id. */
  const mcOpts = q => (q.alternativas||[]).map((a,i) => typeof a === 'string' ? {id:'ABCDEFGHIJ'[i], label:a} : {id:String(a.id), label:a.texto ?? a.label ?? '', html:a.html});
  const mcCorrect = q => typeof q.correta === 'number' ? 'ABCDEFGHIJ'[q.correta] : String(q.correta);

  function renderQuestion(host, q){
    const d = qData(q), rec = answerOf(q.id) || null;
    const fresh = !rec || rec.retry;                        // nova tentativa
    const showGab = !!(rec && rec.revelada && !rec.retry);   // gabarito revelado
    const showOk = !!(rec && !rec.retry && !rec.revelada && rec.ok);
    const showErr = !!(rec && !rec.retry && !rec.revelada && !rec.ok);
    const locked = !fresh;
    const f = q.formato || 'mc';
    const seed = q.id + ':' + ((rec && rec.n) || 0);
    const head = `<div class="qh"><span class="qtype ${q.tipo}">${TYPE_LABEL[q.tipo]||q.tipo}</span>${q.regra?PF.badge(q.regra):PF.ui.tag(q.fonte)}
        ${q.aprofundamento?'<span class="tag fonte-ILUSTRATIVO">Aprofundamento · não conta</span>':''}${q.conferirFonte?'<span class="tag fonte-ILUSTRATIVO">Conferir fonte · não conta</span>':''}
        ${q.conceito?`<span class="dim" style="font-size:12px">· ${esc(q.conceito)}</span>`:''}<span class="spacer"></span>${q.ver?`<a class="btn-text" href="${esc(q.ver)}">ver no sistema →</a>`:''}</div>
      <h2>${resolve(q.enunciado, d)}</h2>${q.contexto?`<div>${resolve(q.contexto, d)}</div>`:''}
      ${(q.tipo!=='conceito' && !q.usaTrabalho)?'<div class="dim" style="font-size:12px">Calculado sobre os dados de referência (o conjunto de exemplo original).</div>':''}`;
    const just = resp => { const j = resolve(q.justificativa, d, resp); return j ? `<div>${String(j).startsWith('<')?j:`<p>${j}</p>`}</div>` : ''; };
    const okBox = (extra='') => `<div class="feedback ok"><h4>${icon('check',16)} Correto!</h4>${extra}${just(rec && rec.val)}</div>`;
    const errBox = (extra='') => `<div class="feedback err"><h4>Ainda não.</h4>${extra}<p>${esc(q.dica || 'Revise a aula rápida da tela indicada e tente de novo.')}</p></div>`;
    const gabBox = (extra='') => `<div class="feedback"><h4>${icon('info',16)} Resposta revelada <span class="muted" style="font-weight:400;font-size:13px">· esta pergunta não conta para o desbloqueio</span></h4>${extra}${just(rec && rec.val)}</div>`;
    const actions = () => {
      if(showErr) return `<div class="row"><button class="btn btn-primary btn-sm" data-q-retry="1">${icon('reset',14)} Tentar de novo</button><button class="btn btn-ghost btn-sm" data-q-reveal="1">Ver resposta</button><span class="dim" style="font-size:12px">Tentativas: ${rec.n}</span></div>`;
      if(showOk || showGab) return `<div class="row"><button class="btn btn-ghost btn-sm" data-q-retry="1">${icon('reset',14)} Praticar de novo</button><span class="dim" style="font-size:12px">Tentativas: ${rec.n}${rec.best && !rec.revelada ? ' · já acertou' : ''}</span></div>`;
      return rec && rec.n ? `<span class="dim" style="font-size:12px">Tentativas anteriores: ${rec.n}${rec.best && !rec.revelada ? ' · já acertou (crédito mantido)' : ''}</span>` : '';
    };
    let body = '';
    if(f === 'mc' || f === 'pick'){
      const opts = shuffle(f==='mc' ? mcOpts(q) : resolve(q.opcoes, d).map(o=>({id:String(o.id), label:o.label, html:o.html})), seed);
      const correct = String(f==='mc' ? mcCorrect(q) : resolve(q.correta, d));
      const chosen = rec && rec.val != null ? String(rec.val) : null;
      body = `<div class="opts">${opts.map((o,i)=>{ let cls = '';
          if(showOk && o.id===correct) cls = 'right'; else if(showErr && o.id===chosen) cls = 'wrong'; else if(showGab && o.id===correct) cls = 'right'; else if(showGab && o.id===chosen) cls = 'wrong';
          return `<button class="opt ${cls}" data-q-opt="${esc(o.id)}" ${locked?'disabled':''}><span class="l">${'ABCDEFGHIJ'[i]}</span><span>${o.html || esc(o.label)}</span></button>`; }).join('')}</div>`;
      if(showOk) body += okBox(); else if(showErr) body += errBox(); else if(showGab) body += gabBox();
    } else if(f === 'multi'){
      const opts = shuffle(resolve(q.opcoes, d).map(o=>({id:String(o.id), label:o.label, html:o.html})), seed), corr = resolve(q.corretas, d).map(String);
      const sel = fresh ? (PF.ui_state('multi:'+q.id, [])||[]) : ((rec.val||[]).map(String));
      body = `<p class="dim" style="margin:0">Marque todas as que se aplicam.</p><div class="opts">${opts.map((o,i)=>{ const id=o.id, on=sel.includes(id); let cls = fresh ? (on?'sel':'') : (on?'sel':'');
          if(showOk && corr.includes(id)) cls = 'right'; if(showGab) cls = corr.includes(id) ? 'right' : (on ? 'wrong' : '');
          return `<button class="opt ${cls}" data-q-multi="${esc(id)}" ${locked?'disabled':''}><span class="l">${on?'☑':'☐'}</span><span>${o.html || esc(o.label)}</span></button>`; }).join('')}</div>`;
      if(fresh) body += `<div><button class="btn btn-primary btn-sm" data-q-submit-multi="1">Responder</button></div>`;
      if(showOk) body += okBox(); else if(showErr) body += errBox('<p>A combinação marcada não confere (pode faltar ou sobrar alternativa).</p>'); else if(showGab) body += gabBox();
    } else if(f === 'num'){
      const ans = resolve(q.calc, d), cs = q.casas ?? 1;
      body = `<div class="row"><input class="input num" type="number" step="any" data-q-num="1" style="width:180px" value="${!fresh && rec && rec.val!=null ? esc(rec.val) : ''}" ${locked?'disabled':''} placeholder="sua resposta">${q.unidade?`<span class="muted">${esc(q.unidade)}</span>`:''}
        ${fresh?'<button class="btn btn-primary btn-sm" data-q-submit-num="1">Responder</button>':''}</div>`;
      const exp = `<p>Resposta esperada: <b class="lime">${fmt.n(ans, cs)}${q.unidade?' '+esc(q.unidade):''}</b>.</p>`;
      if(showOk) body += okBox(exp); else if(showErr) body += errBox(); else if(showGab) body += gabBox(exp);
    } else if(f === 'decisao'){
      const itens = resolve(q.itens, d), lim = resolve(q.limites, d) || [], cols = q.colunas || [], fixos = (q.fixos||[]).map(String);
      const sel = fresh ? Array.from(new Set([...(PF.ui_state('dec:'+q.id, null) ?? (q.preSel||[])).map(String), ...fixos])) : (rec.val||[]).map(String);
      const tot = k => sum(itens.filter(i=>sel.includes(String(i.id))), i=>i.cols[k]);
      body = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Iniciativa</th>${cols.map(c=>`<th class="r">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>
        ${itens.map(it=>{ const id = String(it.id), fx = fixos.includes(id); return `<tr class="${locked||fx?'':'click'} ${sel.includes(id)?'sel':''}" ${locked||fx?'':`data-q-dec="${esc(id)}"`}><td class="c"><input type="checkbox" ${sel.includes(id)?'checked':''} disabled tabindex="-1" aria-label="${esc(it.label)}"></td><td>${esc(it.label)}${fx?' <span class="tag fonte-ILUSTRATIVO">fixa</span>':''}${it.sub?`<small>${esc(it.sub)}</small>`:''}</td>${cols.map(c=>`<td class="r num">${c.fmt?c.fmt(it.cols[c.key], it):esc(it.cols[c.key])}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>
        <div class="dec-total">${lim.map(l=>{ const t=tot(l.key), over = l.max!=null && t>l.max+1e-9; return `<span class="t ${over?'over':''}">${esc(l.label)}<b class="num">${fmt.n(t, l.casas??1)}${l.max!=null?` / ${fmt.n(l.max, l.casas??1)}`:''}</b></span>`; }).join('')}
          ${(q.totais||[]).map(k=>`<span class="t">${esc(k.label)}<b class="num">${fmt.n(tot(k.key), k.casas??1)}</b></span>`).join('')}
          <span class="spacer"></span>${fresh?`<button class="btn btn-primary btn-sm" data-q-submit-dec="1">Registrar decisão</button>`:''}</div>`;
      if(!fresh){ const r = q.avaliar(rec.val||[], d) || {};
        const fb = `<div class="feedback ${r.ok?'ok':'err'}"><h4>${r.ok?icon('check',16)+' Boa decisão!':'Dá para melhorar.'} ${r.nota!=null?`<span class="muted" style="font-weight:400">· nota ${fmt.n(r.nota)}/100</span>`:''}</h4>${r.feedback||''}${r.ok||showGab?just(rec.val):''}</div>`;
        body += fb + (showGab && !r.ok && q.gabarito ? `<div class="feedback"><h4>Gabarito</h4>${resolve(q.gabarito, d)}</div>` : ''); }
    } else if(f === 'custom'){
      body = `<div data-q-custom="1"></div>`;
      if(showOk) body += okBox(); else if(showErr) body += errBox(); else if(showGab) body += gabBox(q.gabarito ? resolve(q.gabarito, d) : '');
    }
    host.innerHTML = `<div class="qcard">${head}${body}${actions()}</div>`;
    const answer = (ok, val) => { record(q, ok, val); PF.refresh(); };
    const cEl = host.querySelector('[data-q-custom]');
    if(cEl){ if(fresh) q.render(cEl, d, answer); else if(q.renderDone) q.renderDone(cEl, d, rec); }
    host.onclick = e => {
      const t = e.target;
      if(t.closest('[data-q-retry]')){ S.respostas[q.id] = Object.assign({}, S.respostas[q.id], { retry:true }); save();   /* 'revelada' permanece: o crédito não volta */ PF.set_ui('multi:'+q.id, []); PF.set_ui('dec:'+q.id, null); PF.refresh(); return; }
      if(t.closest('[data-q-reveal]')){ PF.confirm('Ver a resposta?', 'Ao ver a resposta, esta pergunta deixa de contar para o desbloqueio do nível (você ainda pode praticar).', 'Ver resposta', () => { S.respostas[q.id] = Object.assign({}, S.respostas[q.id], { revelada:true, retry:false }); save(); PF.refresh(); }); return; }
      if(!fresh) return;
      const o = t.closest('[data-q-opt]');
      if(o){ const id = o.dataset.qOpt; const correct = String(f==='mc' ? mcCorrect(q) : resolve(q.correta, d)); answer(id === correct, id); return; }
      const m = t.closest('[data-q-multi]');
      if(m){ const id = m.dataset.qMulti; let s = (PF.ui_state('multi:'+q.id, [])||[]).slice(); s = s.includes(id) ? s.filter(x=>x!==id) : [...s, id]; PF.set_ui('multi:'+q.id, s); PF.refresh(); return; }
      if(t.closest('[data-q-submit-multi]')){ const s = (PF.ui_state('multi:'+q.id, [])||[]).map(String), c = resolve(q.corretas, d).map(String);
        if(!s.length){ toast('Marque ao menos uma alternativa.'); return; } PF.set_ui('multi:'+q.id, []); answer(s.length===c.length && s.every(x=>c.includes(x)), s); return; }
      if(t.closest('[data-q-submit-num]')){ const inp = host.querySelector('[data-q-num]'); const v = parseFloat(String(inp.value).replace(',','.'));
        if(isNaN(v)){ toast('Digite um número.'); inp.focus(); return; } answer(near(v, resolve(q.calc, d), q.tolerancia), v); return; }
      const dr = t.closest('[data-q-dec]');
      if(dr){ const id = dr.dataset.qDec; let s = (PF.ui_state('dec:'+q.id, null) ?? (q.preSel||[])).map(String).slice(); s = s.includes(id) ? s.filter(x=>x!==id) : [...s, id]; PF.set_ui('dec:'+q.id, s); PF.refresh(); return; }
      if(t.closest('[data-q-submit-dec]')){ const fixos = (q.fixos||[]).map(String); const s = Array.from(new Set([...(PF.ui_state('dec:'+q.id, null) ?? (q.preSel||[])).map(String), ...fixos]));
        if(!s.length){ toast('Selecione ao menos uma iniciativa.'); return; } const r = q.avaliar(s, d) || {}; PF.set_ui('dec:'+q.id, null); answer(!!r.ok, s); return; }
    };
    const inp = host.querySelector('[data-q-num]'); if(inp && fresh) inp.addEventListener('keydown', e=>{ if(e.key==='Enter') host.querySelector('[data-q-submit-num]').click(); });
  }

  const statusIcon = rec => !rec ? null : rec.revelada ? {c:'rev', t:'👁'} : (rec.best ? {c:'ok', t:'✓'} : {c:'err', t:'!'});
  function tabPerguntas(el, L){
    const qs = L.questions, st = PF.levelStats(L.id);
    let cur = PF.ui_state('quiz:'+L.id, qs[0] && qs[0].id); if(!qs.find(q=>q.id===cur)) cur = qs[0] && qs[0].id;
    const list = ['conceito','analise','decisao'].map(g => { const gq = qs.filter(q=>q.tipo===g); if(!gq.length) return '';
      return `<div class="grp">${TYPE_LABEL[g]}</div>` + gq.map(q => { const s = statusIcon(answerOf(q.id)), n = qs.indexOf(q)+1;
        return `<button class="${q.id===cur?'on':''}" data-q-go="${esc(q.id)}"><span class="st ${s?s.c:''}">${s?s.t:n}</span><span>${esc(q.titulo || ('Pergunta '+n))}${q.aprofundamento||q.conferirFonte?' <small class="dim">(extra)</small>':''}</span></button>`; }).join(''); }).join('');
    const idx = qs.findIndex(q=>q.id===cur);
    el.innerHTML = `<div class="row" style="margin-bottom:10px"><span class="pill tone-lime"><i></i>${st.ok}/${st.total} corretas · ${fmt.pct(st.pct)}</span><span class="dim" style="font-size:13px">Meta: ${L.unlock.minPct}%${L.desafio && L.unlock.desafio?' + desafio':''}. Errar não revela a resposta; “Ver resposta” retira o crédito daquela pergunta.</span></div>
      <div class="bar" style="margin-bottom:18px"><i style="width:${st.pct*100}%"></i></div>
      <div class="quiz"><nav class="qlist" aria-label="Perguntas">${list}</nav><div><div data-q-host></div>
       <div class="row" style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-q-nav="-1" ${idx<=0?'disabled':''}>← Anterior</button><span class="spacer"></span>
       <button class="btn btn-ghost btn-sm" data-q-nav="1" ${idx>=qs.length-1?'disabled':''}>Próxima →</button></div></div></div>`;
    const q = qs[idx]; if(q) renderQuestion(el.querySelector('[data-q-host]'), q);
    el.querySelector('.qlist').onclick = e => { const b = e.target.closest('[data-q-go]'); if(b){ PF.set_ui('quiz:'+L.id, b.dataset.qGo); PF.refresh(); } };
    el.querySelectorAll('[data-q-nav]').forEach(b => b.onclick = () => { const n = qs[idx + (+b.dataset.qNav)]; if(n){ PF.set_ui('quiz:'+L.id, n.id); PF.refresh(); } });
  }
  function tabDesafio(el, L){
    const D = L.desafio, des = S.desafios[L.id];
    if(!D){ el.innerHTML = '<p class="muted">Este nível não tem desafio.</p>'; return; }
    const refazendo = des && des.refazendo;
    el.innerHTML = `<div class="sec-h"><div><h3>${esc(D.titulo)}</h3><p>${D.descricao||''}</p></div>
      ${des && des.feito ? `<div class="row"><span class="pill tone-ok"><i></i>Concluído · nota ${fmt.n(des.nota)}</span>${refazendo?'':`<button class="btn btn-ghost btn-sm" data-des-redo="1">${icon('reset',14)} Refazer</button>`}</div>` : ''}</div><div data-des-host></div>`;
    const host = el.querySelector('[data-des-host]');
    D.render(host, ctx(L.id), (r) => {
      const prev = S.desafios[L.id]; const hist = prev ? [...(prev.historico||[]), {feito:prev.feito, nota:prev.nota, ts:prev.ts}] : [];
      const ok = r.ok !== false;
      S.desafios[L.id] = Object.assign({}, r, { feito: ok || !!(prev && prev.feito), nota: ok ? (r.nota ?? 100) : (prev && prev.feito ? prev.nota : (r.nota ?? 0)), ts: new Date().toISOString(), historico: hist, refazendo:false, ultima:{ok, nota:r.nota} });
      save(); checkLevelMedals();
      toast(ok ? `${icon('trophy',16)} Desafio do nível ${L.id} concluído!` : 'Desafio registrado. Revise o feedback e tente de novo.'); PF.refresh(); });
    const rb = el.querySelector('[data-des-redo]'); if(rb) rb.onclick = () => { S.desafios[L.id].refazendo = true; save(); PF.refresh(); };
  }
  function tabDominio(el, L){
    const st = PF.levelStats(L.id), qs = L.questions.filter(graded);
    const conc = {}; qs.forEach(q => { const k = q.conceito || TYPE_LABEL[q.tipo]; (conc[k] ||= {t:0, ok:0}).t++; if(counts(S.respostas[q.id])) conc[k].ok++; });
    const pend = qs.filter(q => { const r = S.respostas[q.id]; return r && !counts(r); });
    el.innerHTML = `<div class="grid g4">${['conceito','analise','decisao'].map(t=>PF.ui.kpi({label:TYPE_LABEL[t], value:`${st.porTipo[t].ok}<small>/ ${st.porTipo[t].total}</small>`, tone: st.porTipo[t].total && st.porTipo[t].ok===st.porTipo[t].total ? 'ok' : ''})).join('')}
        ${PF.ui.kpi({label:'Desafio', value: st.desafio && st.desafio.feito ? '✓' : '—', sub: st.desafio && st.desafio.feito ? 'nota '+fmt.n(st.desafio.nota) : 'pendente', tone: st.desafio && st.desafio.feito ? 'ok' : ''})}</div>
      <div class="grid g2" style="margin-top:16px"><div class="card">${PF.ui.section('Domínio por conceito','Perguntas graduadas acertadas sem revelar a resposta.')}${charts.hbar(Object.entries(conc).map(([k,v])=>({label:k, value:v.t?v.ok/v.t:0, color: v.ok===v.t?'ok':'lime'})), {max:1, fmt:v=>fmt.pct(v)})}</div>
        <div class="card">${PF.ui.section('Para revisar', pend.length ? 'Perguntas com erro ou resposta revelada (marcadas com ! ou 👁).' : 'Nada pendente.')}${pend.length?`<div class="stack" style="gap:6px">${pend.map(q=>`<button class="btn-text" style="text-align:left" data-q-goto="${esc(q.id)}">${esc(q.titulo||q.id)}</button>`).join('')}</div>`:''}
        ${PF.levelDone(L.id)?PF.ui.callout('dica', `<p>Nível concluído${L.id<3?` — o nível ${L.id+1} está liberado.`:'!'}</p>`):''}</div></div>`;
    el.querySelectorAll('[data-q-goto]').forEach(b => b.onclick = () => { PF.set_ui('quiz:'+L.id, b.dataset.qGoto); PF.go(`#/n${L.id}/trilha?aba=perguntas`); });
  }
  function screenTrilha(el, L, aba){
    const st = PF.levelStats(L.id), tabs = [['perguntas','Perguntas & Respostas'], ...(L.desafio?[['desafio','Desafio']]:[]), ['dominio','Domínio']];
    if(!tabs.find(t=>t[0]===aba)) aba = 'perguntas';
    el.innerHTML = PF.ui.pageHead({ eyebrow:`Nível ${L.id} · ${esc(L.nome)}`, title:'Trilha do nível',
        sub:`Conceitos, análise do portfólio e decisões de escolha. Para liberar o próximo nível: <b class="lime">${L.unlock.minPct}%</b> das perguntas graduadas${L.desafio && L.unlock.desafio?' e o desafio concluído':''}.`,
        actions:`<span class="pill tone-lime"><i></i>${fmt.pct(st.pct)} · desafio ${st.desafio && st.desafio.feito ? '✓' : 'pendente'}</span>` }) +
      `<div class="tabs" role="tablist">${tabs.map(([k,l])=>`<a class="tab ${k===aba?'on':''}" href="#/n${L.id}/trilha?aba=${k}" role="tab">${esc(l)}</a>`).join('')}</div><div data-trilha></div>`;
    const host = el.querySelector('[data-trilha]');
    if(aba === 'desafio') tabDesafio(host, L); else if(aba === 'dominio') tabDominio(host, L); else tabPerguntas(host, L);
  }
  PF.quiz = { renderQuestion, record };
  /** Abas simples reutilizáveis: PF.ui.tabs(base, [[id,label]], atual) gera links #base?aba=id */
  PF.ui.tabs = (base, tabs, cur) => `<div class="tabs" role="tablist">${tabs.map(([k,l])=>`<a class="tab ${k===cur?'on':''}" href="${base}?aba=${encodeURIComponent(k)}" role="tab">${esc(l)}</a>`).join('')}</div>`;

  /* ------------------------------------------------------------- PDF export */
  /** PF.exportPDF(element, 'arquivo.pdf', {title}) — html2canvas + jsPDF embutidos; marca d'água de exercício em todas as páginas. */
  PF.exportPDF = async (el, file='portfolio-feg.pdf', {title}={}) => {
    if(!window.html2canvas || !window.jspdf){ toast('Exportação indisponível neste modo. Use o arquivo único public/portfolio-feg.html.'); return; }
    busy(true, 'Gerando PDF…');
    try{
      if(document.fonts && document.fonts.ready) await document.fonts.ready;
      const wrap = document.createElement('div'); wrap.className='pdf-capture'; wrap.style.cssText='position:absolute;left:-20000px;top:0;width:1280px';
      wrap.innerHTML = `<div style="display:flex;align-items:center;gap:18px;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:12px;margin-bottom:18px"><img src="${PF.LOGO_MAESTRO||''}" style="height:24px"><div style="display:flex;flex-direction:column;padding-left:18px;border-left:1px solid rgba(255,255,255,.12)"><span class="eyebrow">${esc(PF.APP_NAME)} · exercício didático</span><span style="font-family:Outfit,sans-serif;font-weight:300;font-size:16px">${esc(title||document.title)} · ${new Date().toLocaleDateString('pt-BR')} · autor: Aprendiz (perfil local)</span></div><img src="${PF.LOGO_ONS||''}" style="height:36px;margin-left:auto"></div>`;
      const c = el.cloneNode(true); c.querySelectorAll('button, .actions, [data-noprint], input[type=range]').forEach(b=>b.remove()); wrap.appendChild(c);
      document.body.appendChild(wrap);
      const cv = await window.html2canvas(wrap, {scale:1.5, backgroundColor:'#54575C', logging:false, windowWidth:1320});
      wrap.remove();
      const pdf = new window.jspdf.jsPDF({orientation:'landscape', unit:'pt', format:'a4', compress:true});
      const PW = pdf.internal.pageSize.getWidth(), PH = pdf.internal.pageSize.getHeight(), FOOT = 22;
      const pxPerPage = cv.width * (PH-FOOT) / PW; let y = 0, page = 0;
      while(y < cv.height){ const h = Math.min(pxPerPage, cv.height - y); const part = document.createElement('canvas'); part.width = cv.width; part.height = h;
        part.getContext('2d').drawImage(cv, 0, y, cv.width, h, 0, 0, cv.width, h);
        if(page) pdf.addPage(); pdf.setFillColor(84,87,92); pdf.rect(0,0,PW,PH,'F');
        pdf.addImage(part.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, PW, h * PW / cv.width); y += h; page++;
        pdf.setFontSize(8); pdf.setTextColor(211,206,34); pdf.text('EXERCICIO DIDATICO - DADOS FICTICIOS - NAO E RECOMENDACAO DA FEG/ONS - regras a validar pela FEG', 18, PH-8);
        pdf.setTextColor(200,200,200); pdf.text(`pag. ${page}`, PW-50, PH-8); }
      pdf.save(file); toast(`PDF <b>${esc(file)}</b> gerado. Se o download não começar, abra o arquivo no Chrome ou Edge.`);
    } catch(err){ console.error(err); toast('Não foi possível gerar o PDF neste visualizador. Abra o arquivo no Chrome ou Edge.'); }
    finally { busy(false); }
  };
  PF.pdfButton = (label='Salvar PDF') => `<button class="btn btn-ghost btn-sm" data-pf-pdf="1">${icon('pdf',15)} ${esc(label)}</button>`;

  /* ----------------------------------------------------------- core screens */
  function circuit(){
    const P=[['y','M0 380H257V311H700'],['w','M0 407H286V338H1267V0'],['y','M0 435H316V366H1299V0'],['y','M348 405H1340V0'],['y','M697 435H1528V0'],['w','M0 460H173V586H1559V0'],['y','M0 484H148V615H957V1080'],['y','M145 646H924V1080']];
    return `<svg class="circuit" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${P.map(p=>`<path d="${p[1]}" fill="none" stroke="${p[0]==='y'?'#D3CE22':'#fff'}" stroke-opacity="${p[0]==='y'?0.35:0.18}" stroke-width="4"/>`).join('')}</svg>`;
  }
  const firstHref = L => L.screens[0] ? `#/n${L.id}/${L.screens[0].id}` : `#/n${L.id}/trilha`;
  function screenHome(el){
    const cur = PF.currentLevel(), medals = Object.values(S.medalhas), started = Object.keys(S.respostas).length > 0;
    el.innerHTML = `<section class="hero">${circuit()}
        <div class="eyebrow">${esc(PF.APP_SUB)}</div>
        <h1>Gestão de portfólio,<br><b>do simples ao avançado.</b></h1>
        <p>${PF.HOME_LEAD || 'Três módulos progressivos. Cada nível adiciona telas ao menu, perguntas e um desafio de decisão. Os dados são fictícios e servem para aprender; nenhuma regra aqui é oficial do ONS.'}</p>
        <div class="row" style="margin-top:18px"><a class="btn btn-primary" href="${lvl(cur)?firstHref(lvl(cur)):'#/inicio'}">${started?'Continuar':'Começar'} no nível ${cur} →</a>
        ${GLOBALS.find(g=>g.id==='dashboard')?`<a class="btn btn-ghost" href="#/dashboard">${icon('dashboard',16)} Dashboard</a>`:''}
        <a class="btn btn-ghost" href="#/fontes">${icon('info',16)} Fontes e premissas</a></div></section>
      <div class="levels">${LEVELS.map(L=>{ const st = PF.levelStats(L.id), un = PF.unlocked(L.id), dn = PF.levelDone(L.id);
        return `<article class="lvl ${L.id===cur?'current':''} ${un?'':'locked'}">
          <div class="row" style="justify-content:space-between"><span class="n">${L.id}</span>${dn?PF.ui.pill('Concluído','ok'):un?PF.ui.pill('Disponível','lime'):PF.ui.pill('Bloqueado','dim')}</div>
          <div><div class="eyebrow">Nível ${L.id}</div><h3>${esc(L.nome)}</h3>${L.subtitulo?`<div class="dim" style="font-size:13px">${esc(L.subtitulo)}</div>`:''}</div>
          <div class="q">“${esc(L.pergunta||'')}”</div>
          <ul>${(L.objetivos||[]).slice(0,4).map(o=>`<li>${esc(o)}</li>`).join('')}</ul>
          <div><div class="row" style="justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:6px"><span>${st.ok}/${st.total} perguntas</span><span>${L.desafio?(st.desafio&&st.desafio.feito?'desafio ✓':'desafio pendente'):''}</span></div><div class="bar"><i style="width:${st.pct*100}%"></i></div></div>
          <div class="foot">${un?`<a class="btn btn-primary btn-sm" href="${firstHref(L)}">Entrar →</a>`:`<span class="dim" style="font-size:12.5px">${icon('lock',14)} Conclua o nível ${L.id-1}: ${lvl(L.id-1)?lvl(L.id-1).unlock.minPct:70}% + desafio</span>`}
            <span class="dim" style="font-size:12px">${L.screens.length} telas · ${L.questions.length} perguntas</span></div></article>`; }).join('')}</div>
      ${medals.length?`<div class="card" style="margin-top:18px"><div class="sec-h"><div><h3>Medalhas</h3></div></div><div class="medals">${medals.map(m=>`<span class="medal">${icon('trophy',14)} ${esc(m.label)}</span>`).join('')}</div></div>`:''}`;
  }
  function screenFontes(el){
    el.innerHTML = PF.ui.pageHead({eyebrow:'Transparência', title:'Fontes e premissas', sub:'O sistema separa o que vem de fonte oficial do que é decisão de produto ou ainda precisa ser validado pela FEG. Os dados de exemplo são fictícios.'}) +
      `<div class="grid g2">${[['FONTE_ONS','Conteúdo de documento ONS aprovado e citado. Hoje nenhum item do app atende esse critério.'],['A_VALIDAR_FEG','Pesos, limites, critérios, periodicidades e conteúdo de proposta de consultoria (deck A&M) que a FEG precisa validar.'],['DECISAO_FUNCIONAL_PRODUTO','Escolha de desenho deste sistema para fins didáticos (ex.: fórmula de um indicador). Não é regra ONS.'],['ILUSTRATIVO','Dados fictícios de iniciativas, valores, datas e papéis, criados apenas para exercícios.']].map(([k,t])=>`<div class="card"><div class="row" style="margin-bottom:8px">${PF.ui.tag(k)}</div><div class="muted">${esc(t)}</div></div>`).join('')}</div>`;
  }
  function screenConfig(el){
    el.innerHTML = PF.ui.pageHead({eyebrow:'Configurações', title:'Perfil, progresso e dados', sub:'Tudo fica salvo apenas neste navegador.'}) +
      `<div class="grid g2"><div class="card stack"><h3>Perfil local</h3><p class="muted" style="margin:0">Usado no histórico das alterações. Nunca é impresso nos PDFs.</p><label class="field">Seu nome<input class="input" data-cfg-nome value="${esc(PF.perfil().nome)}" maxlength="40" placeholder="ex.: Ana"></label></div>
      <div class="card stack"><h3>Modo instrutor</h3><p class="muted" style="margin:0">Libera todos os níveis para demonstração. É um atalho didático, não controle de acesso, e não promove nenhuma regra.</p>
        <label class="row" style="cursor:pointer"><input type="checkbox" data-cfg-instr ${S.instrutor?'checked':''}> Ativar modo instrutor</label></div>
      <div class="card stack"><h3>Dados de trabalho</h3><p class="muted" style="margin:0">Edições, pendências e decisões registradas nas telas ficam nos dados de trabalho. As perguntas usam sempre a referência original.</p><div><button class="btn btn-ghost btn-sm" data-cfg-db>${icon('reset',14)} Restaurar dados de exemplo</button></div></div>
      <div class="card stack"><h3>Progresso</h3><p class="muted" style="margin:0">Reiniciar um nível bloqueia os níveis seguintes. Os dados de trabalho não são afetados.</p><div class="row">${LEVELS.map(L=>`<button class="btn btn-ghost btn-sm" data-cfg-lvl="${L.id}">${icon('reset',14)} Nível ${L.id}</button>`).join('')}<button class="btn btn-ghost btn-sm" data-cfg-all>${icon('reset',14)} Tudo</button></div></div>
      <div class="card stack"><h3>Exportar</h3><p class="muted" style="margin:0">Progresso e dados de trabalho em JSON (marcado como exercício: não importar em sistemas reais).</p><div><button class="btn btn-ghost btn-sm" data-cfg-json>${icon('download',14)} Exportar JSON</button></div></div>
      ${PF.configCards.map((c,i)=>`<div class="card stack" data-cfg-card="${i}"></div>`).join('')}</div>`;
    PF.configCards.forEach((c,i) => { try{ c.render(el.querySelector(`[data-cfg-card="${i}"]`)); } catch(e){ console.error(e); } });
    el.querySelector('[data-cfg-nome]').onchange = e => { PF.perfil().nome = e.target.value.trim(); save(); toast('Perfil salvo.'); };
    el.querySelector('[data-cfg-instr]').onchange = e => { S.instrutor = e.target.checked; save(); PF.refresh(); toast(S.instrutor?'Modo instrutor ativado: todos os níveis liberados.':'Modo instrutor desativado.'); };
    el.querySelector('[data-cfg-db]').onclick = () => PF.confirm('Restaurar dados de exemplo?', 'Edições, pendências e decisões registradas nas telas serão descartadas.', 'Restaurar', () => { PF.resetDb(); toast('Dados de exemplo restaurados.'); PF.refresh(); });
    el.querySelectorAll('[data-cfg-lvl]').forEach(b => b.onclick = () => { const id = +b.dataset.cfgLvl; PF.confirm(`Reiniciar o nível ${id}?`, `Apaga respostas e desafio do nível ${id}${id<LEVELS.length?' e dos níveis seguintes, que voltam a ficar bloqueados':''}.`, 'Reiniciar', () => { PF.resetLevel(id); toast(`Nível ${id} reiniciado.`); PF.refresh(); }); });
    el.querySelector('[data-cfg-all]').onclick = () => PF.confirm('Apagar todo o progresso?', 'Respostas, desafios, conclusões e medalhas dos 3 níveis.', 'Apagar', () => { S.respostas={}; S.desafios={}; S.concluidos={}; S.medalhas={}; S.mod={}; save(); toast('Progresso apagado.'); PF.refresh(); });
    el.querySelector('[data-cfg-json]').onclick = () => { const b = new Blob([JSON.stringify({tipo:'EXERCICIO_TRILHA', naoImportar:true, ilustrativo:true, versaoDados:dataV(), exportadoEm:new Date().toISOString(), progresso:{respostas:S.respostas, desafios:S.desafios, concluidos:S.concluidos, medalhas:S.medalhas}, trabalho:S.work}, null, 2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='portfolio-feg-exercicio.json'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},300); };
  }

  /* ---------------------------------------------------------------- render */
  const ctx = (nivel) => ({ dados: PF.db(), base: PF.base, nivel, go: PF.go, refresh: PF.refresh, st: PF.modState(nivel), route: parse() });
  PF.ctx = ctx;
  let lastKey = '';
  function render(keepScroll){
    const app = document.getElementById('app'); if(!app) return;
    const r = parse();
    const L = r.nivel ? lvl(r.nivel) : null;
    let scrId = r.screen;
    if(L && (scrId === 'perguntas' || scrId === 'desafio')){ r.query.aba = scrId; scrId = 'trilha'; }
    const scr = L ? (L.screens.find(s=>s.id===scrId) || (scrId==='trilha' ? {id:'trilha', titulo:'Trilha do nível'} : L.screens[0] || {id:'trilha', titulo:'Trilha do nível'})) : null;
    const G = !L ? GLOBALS.find(g=>g.id===r.screen) : null;
    const key = r.nivel+'/'+(scr?scr.id:r.screen)+'/'+(r.query.aba||'');
    const title = L ? (scr.titulo || 'Trilha do nível') : G ? G.titulo : (({inicio:'Início', fontes:'Fontes e premissas', config:'Configurações'})[r.screen] || 'Início');
    document.title = `${title} — ${PF.APP_NAME}`;
    const sideOpen = document.querySelector('.side.open');
    app.innerHTML = `<div class="shell"><aside class="side ${sideOpen?'open':''}" aria-label="Menu">${sidebar(r, scr)}</aside>
      <div class="main"><header class="topbar"><button class="menu-btn" data-pf-menu aria-label="Abrir menu">${icon('menu',18)}</button>
        <div class="crumb"><span class="eyebrow">${L?`Nível ${L.id} · ${esc(L.nome)}`:esc(PF.APP_NAME)}</span><b>${esc(title)}</b></div>
        <div class="right"><span class="ilustrativo">${icon('info',13)} Dados fictícios para aprendizagem</span><img class="logo-o" src="${PF.LOGO_ONS||''}" alt="ONS — Operador Nacional do Sistema Elétrico"></div></header>
        <main class="content" id="pf-content"></main></div></div>`;
    const el = document.getElementById('pf-content');
    try{
      if(L && !PF.unlocked(L.id)) lockScreen(el, L);
      else if(L && scr.id==='trilha') screenTrilha(el, L, r.query.aba);
      else if(L){ scr.render(el, ctx(L.id)); if(scr.escreve) el.insertAdjacentHTML('afterbegin', PF.ui.seloExercicio()); }
      else if(G && G.nivelMin && !PF.unlocked(G.nivelMin)) lockScreen(el, lvl(G.nivelMin));
      else if(G) G.render(el, ctx(PF.currentLevel()));
      else if(r.screen==='fontes') screenFontes(el);
      else if(r.screen==='config') screenConfig(el);
      else screenHome(el);
    } catch(err){ console.error(err); el.innerHTML = `<div class="callout atencao"><span class="ic">${icon('risk',16)}</span><div><p><b>Erro ao montar a tela.</b></p><p class="dim">${esc(err && err.message)}</p></div></div>`; }
    el.querySelectorAll('[data-pf-pdf]').forEach(b => b.addEventListener('click', () => PF.exportPDF(el, `portfolio-feg-${key.replace(/[^a-z0-9]+/gi,'-').replace(/-+$/,'')}.pdf`, {title})));
    if(!keepScroll || key !== lastKey) window.scrollTo({top:0});
    lastKey = key;
  }
  function sidebar(r, scr){
    const item = (href, ic, label, on) => `<a class="nav-item ${on?'on':''}" href="${href}"><span class="ic">${icon(ic,16)}</span>${esc(label)}</a>`;
    let h = `<div class="brand" onclick="location.hash='#/inicio'"><img src="${PF.LOGO_MAESTRO||''}" alt="maestro"><span>${esc(PF.APP_NAME)}</span></div>`;
    h += item('#/inicio','home','Início', r.nivel===0 && r.screen==='inicio');
    GLOBALS.filter(g=>!g.rodape).forEach(g => h += item('#/'+g.id, g.icone||'dashboard', g.titulo, r.nivel===0 && r.screen===g.id));
    const cur = PF.currentLevel();
    LEVELS.forEach(L => { const un = PF.unlocked(L.id), st = PF.levelStats(L.id);
      const open = PF.ui_state('navOpen:'+L.id, null) ?? (r.nivel ? r.nivel===L.id : L.id===cur);
      h += `<div class="nav-group ${un?'':'locked'}"><button class="nav-group-h" data-pf-nav="${L.id}" aria-expanded="${open}"><span><b>Nível ${L.id}</b> · ${esc(L.nome)}</span><span class="pct">${un?fmt.pct(st.pct)+(PF.levelDone(L.id)?' ✓':''):icon('lock',12)} ${open?'▾':'▸'}</span></button>`;
      if(!open){ h += `</div>`; return; }
      if(!un){ h += `<div class="nav-lock">Conclua o nível ${L.id-1} para liberar: ${L.screens.map(s=>esc(s.titulo)).join(', ')}.</div></div>`; return; }
      let grupo = null;
      L.screens.forEach(s => { if(s.grupo && s.grupo !== grupo){ grupo = s.grupo; h += `<div class="nav-sub">${esc(grupo)}</div>`; }
        h += item(`#/n${L.id}/${s.id}`, s.icone||'dashboard', s.titulo, r.nivel===L.id && scr && scr.id===s.id); });
      h += item(`#/n${L.id}/trilha`, 'question', 'Trilha do nível', r.nivel===L.id && scr && scr.id==='trilha');
      h += `</div>`; });
    h += `<div class="side-foot">${GLOBALS.filter(g=>g.rodape).map(g=>item('#/'+g.id, g.icone||'info', g.titulo, r.screen===g.id)).join('')}${GLOBALS.find(g=>g.id==='fontes')?'':item('#/fontes','info','Fontes e premissas', r.screen==='fontes')}${item('#/config','settings','Configurações', r.screen==='config')}</div>`;
    return h;
  }
  function lockScreen(el, L){
    const prev = lvl(L.id-1), st = prev ? PF.levelStats(prev.id) : null;
    el.innerHTML = `<div class="lockscreen"><span class="ic">${icon('lock',30)}</span><div class="eyebrow">Nível ${L.id} · ${esc(L.nome)}</div><h2>Este módulo ainda está bloqueado</h2>
      ${L.objetivos && L.objetivos.length ? `<div class="card" style="text-align:left;width:100%"><b>O que você vai aprender:</b><ul style="margin:6px 0 0;padding-left:18px">${L.objetivos.map(o=>`<li class="muted">${esc(o)}</li>`).join('')}</ul></div>`:''}
      ${prev ? `<p class="muted">Para liberar, conclua o nível ${prev.id} (${esc(prev.nome)}): <b class="lime">${prev.unlock.minPct}%</b> das perguntas graduadas${prev.desafio&&prev.unlock.desafio?' e o desafio':''}. Hoje: ${st.ok}/${st.total} (${fmt.pct(st.pct)})${prev.desafio?` · desafio ${st.desafio&&st.desafio.feito?'✓':'pendente'}`:''}.</p>
      <div class="row" style="justify-content:center"><a class="btn btn-primary" href="#/n${prev.id}/trilha?aba=perguntas">Perguntas do nível ${prev.id}</a>${prev.desafio?`<a class="btn btn-ghost" href="#/n${prev.id}/trilha?aba=desafio">Desafio do nível ${prev.id}</a>`:''}</div>` : ''}
      <p class="dim" style="font-size:12.5px">Facilitador? Ative o modo instrutor em <a href="#/config">Configurações</a>.</p></div>`;
  }
  document.addEventListener('click', e => {
    if(e.target.closest('[data-pf-menu]')){ document.querySelector('.side').classList.toggle('open'); return; }
    const ng = e.target.closest('[data-pf-nav]'); if(ng){ const id = +ng.dataset.pfNav; const open = ng.getAttribute('aria-expanded') === 'true'; PF.set_ui('navOpen:'+id, !open); PF.refresh(); return; }
    if(e.target.closest('.side .nav-item') && window.innerWidth <= 980){ const s = document.querySelector('.side'); if(s) s.classList.remove('open'); }
  });

  PF.start = () => { deepFreeze(PF.base); PF.db(); checkLevelMedals(); render(); };
})();
