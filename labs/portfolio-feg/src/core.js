/* =========================================================================
   Portfólio FEG — NÚCLEO COMUM (core.js)
   -------------------------------------------------------------------------
   Contrato para os módulos de nível (nivel1.js, nivel2.js, nivel3.js):

   PF.registerLevel({
     id: 1,                         // 1 | 2 | 3
     nome: 'Fundamentos',           // nome do módulo
     subtitulo: '...',              // frase curta
     pergunta: '...',               // pergunta-guia do nível
     objetivos: ['...'],            // objetivos de aprendizagem
     unlock: { minPct: 70, desafio: true },   // regra para liberar o próximo nível
     screens: [                     // telas que o nível ADICIONA ao menu
       { id:'dashboard', titulo:'Dashboard', icone:'dashboard',
         render(el, ctx){ el.innerHTML = '...'; } }   // ctx = {dados, nivel, go, refresh, st}
     ],
     questions: [ ... ],            // banco de perguntas (ver PF.quiz abaixo)
     desafio: { titulo, descricao, render(el, ctx, done) }  // done({nota:0..100, ok:true, detalhe})
   })

   O núcleo adiciona automaticamente a cada nível as telas
   "Perguntas & Respostas" (#/nN/perguntas) e "Desafio" (#/nN/desafio).

   Dados: PF.base (conjunto ilustrativo imutável, definido em data.js) e
   PF.db() (cópia de trabalho editável e persistida). Use sempre PF.db() nas telas.

   Tipos de pergunta (PF.quiz):
     {id, tipo:'conceito'|'analise'|'decisao', formato:'mc', enunciado, alternativas:[..], correta: idx, justificativa}
     {formato:'num', calc:(d)=>number, tolerancia:0.5 | {rel:0.02}, unidade:'FTE', justificativa:(d,resp)=>html}
     {formato:'pick', opcoes:(d)=>[{id,label}], correta:(d)=>id}
     {formato:'multi', opcoes:(d)=>[{id,label}], corretas:(d)=>[ids]}
     {formato:'decisao', itens:(d)=>[{id,label,cols:{..}}], colunas:[{key,label,fmt}],
        limites:[{key:'fte', label:'FTE', max:12}], avaliar:(selIds,d)=>({ok, nota, feedback})}
     {formato:'custom', render(el, d, answer)}   // answer(ok, valor)
   Campos opcionais: contexto:(d)=>html, fonte:'FONTE_ONS'|'DECISAO_FUNCIONAL_PRODUTO'|'A_VALIDAR_FEG',
     ver:'#/n1/inventario' (link "ver no sistema"), conceito:'texto curto', dica:'...'.
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
  const freshState = () => ({ v:1, instrutor:false, respostas:{}, desafios:{}, medalhas:{}, work:null, mod:{}, ui:{}, nome:'' });
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
  PF.fonteLabel = { FONTE_ONS:'Fonte ONS', DECISAO_FUNCIONAL_PRODUTO:'Decisão de produto', A_VALIDAR_FEG:'A validar FEG', ILUSTRATIVO:'Ilustrativo' };

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
  PF.levelStats = id => {
    const L = lvl(id); if(!L) return {total:0, ok:0, feitas:0, pct:0};
    const qs = L.questions, total = qs.length;
    const ok = qs.filter(q => S.respostas[q.id] && S.respostas[q.id].ok).length;
    const feitas = qs.filter(q => S.respostas[q.id]).length;
    return { total, ok, feitas, pct: total ? ok/total : 0, desafio: S.desafios[id] || null };
  };
  PF.levelDone = id => {
    const L = lvl(id); if(!L) return false;
    const st = PF.levelStats(id);
    return st.pct*100 >= L.unlock.minPct && (!L.unlock.desafio || !L.desafio || !!(st.desafio && st.desafio.feito));
  };
  PF.unlocked = id => id === 1 || S.instrutor || PF.levelDone(id-1);
  PF.currentLevel = () => { let c = 1; LEVELS.forEach(L => { if(PF.unlocked(L.id)) c = L.id; }); return c; };
  PF.award = (id, label) => { if(!S.medalhas[id]){ S.medalhas[id] = {label, ts: new Date().toISOString()}; save(); toast(`${icon('trophy',16)} Medalha: <b>${esc(label)}</b>`); } };
  const checkLevelMedals = () => LEVELS.forEach(L => { if(PF.levelDone(L.id)) PF.award('nivel-'+L.id, `Nível ${L.id} concluído — ${L.nome}`); });

  /* ---------------------------------------------------------------- router */
  const parse = () => {
    const h = (location.hash || '#/inicio').replace(/^#\/?/, '');
    const [a, b] = h.split('/');
    if(/^n[1-3]$/.test(a)) return { nivel: +a.slice(1), screen: b || null };
    return { nivel: 0, screen: a || 'inicio' };
  };
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

  /* ------------------------------------------------------------------ quiz */
  const TYPE_LABEL = { conceito:'Conceito', analise:'Análise do portfólio', decisao:'Decisão de escolha' };
  const answerOf = qid => S.respostas[qid];
  const record = (q, ok, val) => { const prev = S.respostas[q.id]; S.respostas[q.id] = { ok:!!ok, val, n:(prev?prev.n:0)+1, ts:new Date().toISOString() }; save(); checkLevelMedals(); };
  const resolve = (x, d, extra) => typeof x === 'function' ? x(d, extra) : x;
  const near = (v, ans, tol) => { if(tol && typeof tol==='object' && tol.rel!=null) return Math.abs(v-ans) <= Math.abs(ans)*tol.rel + 1e-9; return Math.abs(v-ans) <= (tol ?? 0.01) + 1e-9; };

  function renderQuestion(host, q, level){
    const d = PF.db(), prev = answerOf(q.id), done = !!prev;
    const head = `<div class="qh"><span class="qtype ${q.tipo}">${TYPE_LABEL[q.tipo]||q.tipo}</span>${tag(q.fonte)}${q.conceito?`<span class="dim" style="font-size:12px">· ${esc(q.conceito)}</span>`:''}<span class="spacer"></span>${q.ver?`<a class="btn-text" href="${esc(q.ver)}">ver no sistema →</a>`:''}</div>
      <h2>${resolve(q.enunciado, d)}</h2>${q.contexto?`<div>${resolve(q.contexto, d)}</div>`:''}`;
    let body = '';
    const fb = (ok, html) => `<div class="feedback ${ok?'ok':'err'}"><h4>${ok?'Correto!':'Ainda não.'}</h4>${html||''}</div>`;
    const just = (resp) => { const j = resolve(q.justificativa, d, resp); return j ? `<p>${j}</p>` : ''; };
    const retry = `<div class="row"><button class="btn btn-ghost btn-sm" data-q-retry="1">${icon('reset',14)} Tentar de novo</button><span class="dim" style="font-size:12px">Tentativas: ${prev?prev.n:0}</span></div>`;
    const f = q.formato || 'mc';
    if(f === 'mc' || f === 'pick'){
      const opts = f==='mc' ? q.alternativas.map((t,i)=>({id:i, label:t})) : resolve(q.opcoes, d);
      const correct = f==='mc' ? q.correta : resolve(q.correta, d);
      body = `<div class="opts">${opts.map((o,i)=>{ const cls = done ? (o.id===correct ? 'right' : (prev.val===o.id ? 'wrong' : '')) : '';
        return `<button class="opt ${cls}" data-q-opt="${esc(o.id)}" ${done?'disabled':''}><span class="l">${'ABCDEFGHIJ'[i]||''}</span><span>${o.html || esc(o.label)}</span></button>`; }).join('')}</div>`;
      if(done) body += fb(prev.ok, just(prev.val)) + retry;
    } else if(f === 'multi'){
      const opts = resolve(q.opcoes, d), corr = resolve(q.corretas, d).map(String);
      const sel = done ? (prev.val||[]).map(String) : (PF.ui_state('multi:'+q.id, [])||[]);
      body = `<p class="dim" style="margin:0">Marque todas as que se aplicam.</p><div class="opts">${opts.map((o,i)=>{ const id=String(o.id), on=sel.includes(id);
        const cls = done ? (corr.includes(id) ? 'right' : (on ? 'wrong' : '')) : (on?'sel':'');
        return `<button class="opt ${cls}" data-q-multi="${esc(id)}" ${done?'disabled':''}><span class="l">${on?'☑':'☐'}</span><span>${o.html || esc(o.label)}</span></button>`; }).join('')}</div>`;
      body += done ? fb(prev.ok, just(prev.val)) + retry : `<div><button class="btn btn-primary btn-sm" data-q-submit-multi="1">Responder</button></div>`;
    } else if(f === 'num'){
      const ans = resolve(q.calc, d);
      body = `<div class="row"><input class="input num" type="number" step="any" data-q-num="1" style="width:180px" value="${done?esc(prev.val):''}" ${done?'disabled':''} placeholder="sua resposta">${q.unidade?`<span class="muted">${esc(q.unidade)}</span>`:''}
        ${done?'':'<button class="btn btn-primary btn-sm" data-q-submit-num="1">Responder</button>'}</div>${q.dica && !done?`<p class="dim" style="margin:0;font-size:13px">Dica: ${esc(q.dica)}</p>`:''}`;
      if(done) body += fb(prev.ok, `<p>Resposta esperada: <b class="lime">${fmt.n(ans, q.casas ?? 1)}${q.unidade?' '+esc(q.unidade):''}</b>.</p>` + just(prev.val)) + retry;
    } else if(f === 'decisao'){
      const itens = resolve(q.itens, d), lim = resolve(q.limites, d) || [], cols = q.colunas || [];
      const sel = done ? (prev.val||[]) : (PF.ui_state('dec:'+q.id, [])||[]);
      const tot = k => sum(itens.filter(i=>sel.includes(i.id)), i=>i.cols[k]);
      body = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Iniciativa</th>${cols.map(c=>`<th class="r">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>
        ${itens.map(it=>`<tr class="click ${sel.includes(it.id)?'sel':''}" data-q-dec="${esc(it.id)}"><td class="c"><input type="checkbox" ${sel.includes(it.id)?'checked':''} ${done?'disabled':''} tabindex="-1"></td><td>${esc(it.label)}${it.sub?`<small>${esc(it.sub)}</small>`:''}</td>${cols.map(c=>`<td class="r num">${c.fmt?c.fmt(it.cols[c.key], it):esc(it.cols[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="dec-total">${lim.map(l=>{ const t=tot(l.key), over = l.max!=null && t>l.max+1e-9; return `<span class="t ${over?'over':''}">${esc(l.label)}<b class="num">${fmt.n(t, l.casas??1)}${l.max!=null?` / ${fmt.n(l.max, l.casas??1)}`:''}</b></span>`; }).join('')}
          ${(q.totais||[]).map(k=>`<span class="t">${esc(k.label)}<b class="num">${fmt.n(tot(k.key), k.casas??1)}</b></span>`).join('')}
          <span class="spacer"></span>${done?'':`<button class="btn btn-primary btn-sm" data-q-submit-dec="1">Registrar decisão</button>`}</div>`;
      if(done){ const r = q.avaliar(prev.val, d); body += `<div class="feedback ${r.ok?'ok':'err'}"><h4>${r.ok?'Boa decisão!':'Dá para melhorar.'} ${r.nota!=null?`<span class="muted" style="font-weight:400">· nota ${fmt.n(r.nota)}/100</span>`:''}</h4>${r.feedback||''}</div>` + retry; }
    } else if(f === 'custom'){
      body = `<div data-q-custom="1"></div>`;
      if(done) body += fb(prev.ok, just(prev.val)) + retry;
    }
    host.innerHTML = `<div class="qcard">${head}${body}</div>`;
    const answer = (ok, val) => { record(q, ok, val); PF.refresh(); };
    if(f==='custom' && !done) q.render(host.querySelector('[data-q-custom]'), d, answer);
    if(f==='custom' && done && q.renderDone) q.renderDone(host.querySelector('[data-q-custom]'), d, prev);
    host.onclick = e => {
      const t = e.target;
      if(t.closest('[data-q-retry]')){ delete S.respostas[q.id]; save(); PF.refresh(); return; }
      const o = t.closest('[data-q-opt]');
      if(o && !done){ const opts = f==='mc' ? null : resolve(q.opcoes, d); const raw = o.dataset.qOpt;
        const val = f==='mc' ? +raw : (opts.find(x=>String(x.id)===raw)||{}).id; const correct = f==='mc' ? q.correta : resolve(q.correta, d);
        answer(String(val)===String(correct), val); return; }
      const m = t.closest('[data-q-multi]');
      if(m && !done){ const id = m.dataset.qMulti; let s = (PF.ui_state('multi:'+q.id, [])||[]).slice(); s = s.includes(id) ? s.filter(x=>x!==id) : [...s, id]; PF.set_ui('multi:'+q.id, s); PF.refresh(); return; }
      if(t.closest('[data-q-submit-multi]')){ const s = (PF.ui_state('multi:'+q.id, [])||[]).map(String), c = resolve(q.corretas, d).map(String);
        if(!s.length){ toast('Marque ao menos uma alternativa.'); return; }
        PF.set_ui('multi:'+q.id, []); answer(s.length===c.length && s.every(x=>c.includes(x)), s); return; }
      if(t.closest('[data-q-submit-num]')){ const inp = host.querySelector('[data-q-num]'); const v = parseFloat(String(inp.value).replace(',','.'));
        if(isNaN(v)){ toast('Digite um número.'); inp.focus(); return; } answer(near(v, resolve(q.calc, d), q.tolerancia), v); return; }
      const dr = t.closest('[data-q-dec]');
      if(dr && !done){ const id = dr.dataset.qDec; let s = (PF.ui_state('dec:'+q.id, [])||[]).slice(); s = s.includes(id) ? s.filter(x=>x!==id) : [...s, id]; PF.set_ui('dec:'+q.id, s); PF.refresh(); return; }
      if(t.closest('[data-q-submit-dec]')){ const s = PF.ui_state('dec:'+q.id, [])||[]; if(!s.length){ toast('Selecione ao menos uma iniciativa.'); return; }
        const r = q.avaliar(s, d); PF.set_ui('dec:'+q.id, []); answer(r.ok, s); return; }
    };
    const inp = host.querySelector('[data-q-num]'); if(inp && !done) inp.addEventListener('keydown', e=>{ if(e.key==='Enter') host.querySelector('[data-q-submit-num]').click(); });
  }

  function screenQuiz(el, L){
    const qs = L.questions, st = PF.levelStats(L.id);
    let cur = PF.ui_state('quiz:'+L.id, qs[0] && qs[0].id); if(!qs.find(q=>q.id===cur)) cur = qs[0] && qs[0].id;
    const groups = ['conceito','analise','decisao'];
    const list = groups.map(g => { const gq = qs.filter(q=>q.tipo===g); if(!gq.length) return '';
      return `<div class="grp">${TYPE_LABEL[g]}</div>` + gq.map(q => { const a = answerOf(q.id); const n = qs.indexOf(q)+1;
        return `<button class="${q.id===cur?'on':''}" data-q-go="${esc(q.id)}"><span class="st ${a?(a.ok?'ok':'err'):''}">${a?(a.ok?'✓':'!'):n}</span><span>${esc(q.titulo || ('Pergunta '+n))}</span></button>`; }).join(''); }).join('');
    const idx = qs.findIndex(q=>q.id===cur);
    el.innerHTML = PF.ui.pageHead({ eyebrow:`Nível ${L.id} · ${esc(L.nome)}`, title:'Perguntas &amp; Respostas',
        sub:`Conceitos, análise do portfólio e decisões de escolha. Acerte <b class="lime">${L.unlock.minPct}%</b> ${L.desafio && L.unlock.desafio?'e conclua o desafio ':''}para liberar o próximo nível.`,
        actions:`<span class="pill tone-lime"><i></i>${st.ok}/${st.total} corretas · ${fmt.pct(st.pct)}</span>` }) +
      `<div class="bar" style="margin:-6px 0 18px"><i style="width:${st.pct*100}%"></i></div>
       <div class="quiz"><nav class="qlist" aria-label="Perguntas">${list}</nav><div><div data-q-host></div>
       <div class="row" style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-q-nav="-1" ${idx<=0?'disabled':''}>← Anterior</button><span class="spacer"></span>
       <button class="btn btn-ghost btn-sm" data-q-nav="1" ${idx>=qs.length-1?'disabled':''}>Próxima →</button></div></div></div>`;
    const q = qs[idx]; if(q) renderQuestion(el.querySelector('[data-q-host]'), q, L);
    el.querySelector('.qlist').onclick = e => { const b = e.target.closest('[data-q-go]'); if(b){ PF.set_ui('quiz:'+L.id, b.dataset.qGo); PF.refresh(); } };
    el.querySelectorAll('[data-q-nav]').forEach(b => b.onclick = () => { const n = qs[idx + (+b.dataset.qNav)]; if(n){ PF.set_ui('quiz:'+L.id, n.id); PF.refresh(); } });
  }
  PF.quiz = { renderQuestion, screenQuiz, record };

  function screenDesafio(el, L){
    const st = PF.levelStats(L.id), D = L.desafio, des = S.desafios[L.id];
    if(!D){ el.innerHTML = PF.ui.pageHead({title:'Desafio', sub:'Este nível não tem desafio.'}); return; }
    el.innerHTML = PF.ui.pageHead({ eyebrow:`Nível ${L.id} · Desafio`, title: esc(D.titulo), sub: D.descricao,
        actions: des && des.feito ? `<span class="pill tone-ok"><i></i>Concluído · nota ${fmt.n(des.nota)}</span> <button class="btn btn-ghost btn-sm" data-des-reset="1">${icon('reset',14)} Refazer</button>` : '' }) + `<div data-des-host></div>`;
    const host = el.querySelector('[data-des-host]');
    D.render(host, ctx(L.id), (r) => { S.desafios[L.id] = Object.assign({ feito: r.ok !== false, nota: r.nota ?? 100, ts: new Date().toISOString() }, r); save(); checkLevelMedals();
      toast(r.ok !== false ? `${icon('trophy',16)} Desafio do nível ${L.id} concluído!` : 'Desafio registrado. Revise o feedback e tente de novo.'); PF.refresh(); });
    const rb = el.querySelector('[data-des-reset]'); if(rb) rb.onclick = () => { delete S.desafios[L.id]; save(); PF.refresh(); };
  }

  /* ------------------------------------------------------------- PDF export */
  /** PF.exportPDF(element, 'arquivo.pdf', {title}) — usa html2canvas + jsPDF embutidos */
  PF.exportPDF = async (el, file='portfolio-feg.pdf', {title}={}) => {
    if(!window.html2canvas || !window.jspdf){ toast('Exportação indisponível: abra o arquivo completo (versão em arquivo único).'); return; }
    busy(true, 'Gerando PDF…');
    try{
      if(document.fonts && document.fonts.ready) await document.fonts.ready;
      const wrap = document.createElement('div'); wrap.className='pdf-capture'; wrap.style.cssText='position:absolute;left:-20000px;top:0;width:1280px';
      wrap.innerHTML = `<div style="display:flex;align-items:center;gap:18px;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:12px;margin-bottom:18px"><img src="${PF.LOGO_MAESTRO||''}" style="height:24px"><div style="display:flex;flex-direction:column;padding-left:18px;border-left:1px solid rgba(255,255,255,.12)"><span class="eyebrow">${esc(PF.APP_NAME)}</span><span style="font-family:Outfit,sans-serif;font-weight:300;font-size:16px">${esc(title||document.title)} · ${new Date().toLocaleDateString('pt-BR')}</span></div><img src="${PF.LOGO_ONS||''}" style="height:36px;margin-left:auto"></div>`;
      const c = el.cloneNode(true); c.querySelectorAll('button, .actions, [data-noprint]').forEach(b=>b.remove()); wrap.appendChild(c);
      document.body.appendChild(wrap);
      const cv = await window.html2canvas(wrap, {scale:2, backgroundColor:'#54575C', logging:false, windowWidth:1320});
      wrap.remove();
      const pdf = new window.jspdf.jsPDF({orientation:'landscape', unit:'pt', format:'a4', compress:true});
      const PW = pdf.internal.pageSize.getWidth(), PH = pdf.internal.pageSize.getHeight();
      const pxPerPage = cv.width * PH / PW; let y = 0, page = 0;
      while(y < cv.height){ const h = Math.min(pxPerPage, cv.height - y); const part = document.createElement('canvas'); part.width = cv.width; part.height = h;
        part.getContext('2d').drawImage(cv, 0, y, cv.width, h, 0, 0, cv.width, h);
        if(page) pdf.addPage(); pdf.setFillColor(84,87,92); pdf.rect(0,0,PW,PH,'F');
        pdf.addImage(part.toDataURL('image/jpeg', .9), 'JPEG', 0, 0, PW, h * PW / cv.width); y += h; page++; }
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
  function screenHome(el){
    const cur = PF.currentLevel();
    const medals = Object.values(S.medalhas);
    el.innerHTML = `<section class="hero">${circuit()}
        <div class="eyebrow">${esc(PF.APP_SUB)}</div>
        <h1>Gestão de portfólio,<br><b>do simples ao avançado.</b></h1>
        <p>${PF.HOME_LEAD || 'Três módulos progressivos. Cada nível adiciona telas ao menu, novas perguntas e um desafio de decisão. Os dados são fictícios e servem para aprender — regras oficiais dependem de validação da FEG.'}</p>
        <div class="row" style="margin-top:18px"><a class="btn btn-primary" href="#/n${cur}/${(lvl(cur)&&lvl(cur).screens[0]?lvl(cur).screens[0].id:'perguntas')}">${Object.keys(S.respostas).length?'Continuar':'Começar'} no nível ${cur} →</a>
        <a class="btn btn-ghost" href="#/fontes">${icon('info',16)} Fontes e premissas</a></div></section>
      <div class="levels">${LEVELS.map(L=>{ const st = PF.levelStats(L.id), un = PF.unlocked(L.id), dn = PF.levelDone(L.id);
        return `<article class="lvl ${L.id===cur?'current':''} ${un?'':'locked'}">
          <div class="row" style="justify-content:space-between"><span class="n">${L.id}</span>${dn?PF.ui.pill('Concluído','ok'):un?PF.ui.pill('Disponível','lime'):PF.ui.pill('Bloqueado','dim')}</div>
          <div><div class="eyebrow">Nível ${L.id}</div><h3>${esc(L.nome)}</h3>${L.subtitulo?`<div class="dim" style="font-size:13px">${esc(L.subtitulo)}</div>`:''}</div>
          <div class="q">“${esc(L.pergunta||'')}”</div>
          <ul>${(L.objetivos||[]).slice(0,4).map(o=>`<li>${esc(o)}</li>`).join('')}</ul>
          <div><div class="row" style="justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:6px"><span>${st.ok}/${st.total} perguntas</span><span>${L.desafio?(st.desafio&&st.desafio.feito?'desafio ✓':'desafio pendente'):''}</span></div><div class="bar"><i style="width:${st.pct*100}%"></i></div></div>
          <div class="foot">${un?`<a class="btn btn-primary btn-sm" href="#/n${L.id}/${L.screens[0]?L.screens[0].id:'perguntas'}">Entrar →</a>`:`<span class="dim" style="font-size:12.5px">${icon('lock',14)} Conclua o nível ${L.id-1}: ${lvl(L.id-1)?lvl(L.id-1).unlock.minPct:70}% + desafio</span>`}
            <span class="dim" style="font-size:12px">${L.screens.length} telas · ${st.total} perguntas</span></div></article>`; }).join('')}</div>
      ${medals.length?`<div class="card" style="margin-top:18px"><div class="sec-h"><div><h3>Medalhas</h3></div></div><div class="medals">${medals.map(m=>`<span class="medal">${icon('trophy',14)} ${esc(m.label)}</span>`).join('')}</div></div>`:''}`;
  }
  function screenFontes(el){
    const F = PF.FONTES_NOTA || '';
    el.innerHTML = PF.ui.pageHead({eyebrow:'Transparência', title:'Fontes e premissas', sub:'O sistema separa o que vem de fonte oficial do que é decisão de produto ou ainda precisa ser validado pela FEG. Os dados de exemplo são fictícios.'}) +
      `<div class="grid g2">${['FONTE_ONS','DECISAO_FUNCIONAL_PRODUTO','A_VALIDAR_FEG','ILUSTRATIVO'].map(k=>`<div class="card"><div class="row" style="margin-bottom:8px">${tag(k)}</div><div class="muted">${esc(({
        FONTE_ONS:'Conteúdo extraído de documento oficial (ex.: deck A&M Etapa 3 do novo modelo organizacional da FE, modelo de dados do Portfólio FE). Citado com a origem.',
        DECISAO_FUNCIONAL_PRODUTO:'Escolha de desenho deste sistema para fins didáticos (ex.: fórmula de um indicador, escala de 1 a 5). Não é regra ONS.',
        A_VALIDAR_FEG:'Pesos, limites, critérios e periodicidades que precisam ser validados pela FEG antes de qualquer uso oficial.',
        ILUSTRATIVO:'Dados fictícios de iniciativas, pessoas, valores e datas, criados apenas para exercícios.'})[k])}</div></div>`).join('')}</div>${F?`<div class="card" style="margin-top:16px">${F}</div>`:''}`;
  }
  function screenConfig(el){
    el.innerHTML = PF.ui.pageHead({eyebrow:'Configurações', title:'Progresso e dados', sub:'Tudo fica salvo apenas neste navegador.'}) +
      `<div class="grid g2"><div class="card stack"><h3>Modo instrutor</h3><p class="muted" style="margin:0">Libera todos os níveis sem precisar concluir os anteriores (útil para demonstração e facilitação).</p>
        <label class="row" style="cursor:pointer"><input type="checkbox" data-cfg-instr ${S.instrutor?'checked':''}> Ativar modo instrutor</label></div>
      <div class="card stack"><h3>Dados de exemplo</h3><p class="muted" style="margin:0">As telas permitem editar o portfólio. Restaure o conjunto original quando quiser.</p><div><button class="btn btn-ghost btn-sm" data-cfg-db>${icon('reset',14)} Restaurar dados de exemplo</button></div></div>
      <div class="card stack"><h3>Progresso</h3><p class="muted" style="margin:0">Apaga respostas, desafios e medalhas. Os dados do portfólio não são afetados.</p><div class="row">${LEVELS.map(L=>`<button class="btn btn-ghost btn-sm" data-cfg-lvl="${L.id}">${icon('reset',14)} Nível ${L.id}</button>`).join('')}<button class="btn btn-ghost btn-sm" data-cfg-all>${icon('reset',14)} Tudo</button></div></div>
      <div class="card stack"><h3>Exportar</h3><p class="muted" style="margin:0">Baixe o progresso e o portfólio de trabalho em JSON.</p><div><button class="btn btn-ghost btn-sm" data-cfg-json>${icon('download',14)} Exportar JSON</button></div></div></div>`;
    el.querySelector('[data-cfg-instr]').onchange = e => { S.instrutor = e.target.checked; save(); PF.refresh(); toast(S.instrutor?'Modo instrutor ativado: todos os níveis liberados.':'Modo instrutor desativado.'); };
    el.querySelector('[data-cfg-db]').onclick = () => PF.confirm('Restaurar dados de exemplo?', 'As edições feitas no portfólio serão descartadas.', 'Restaurar', () => { PF.resetDb(); toast('Dados de exemplo restaurados.'); PF.refresh(); });
    el.querySelectorAll('[data-cfg-lvl]').forEach(b => b.onclick = () => { const id = +b.dataset.cfgLvl; PF.confirm(`Reiniciar o nível ${id}?`, 'Apaga as respostas e o desafio deste nível.', 'Reiniciar', () => {
      (lvl(id).questions||[]).forEach(q=>delete S.respostas[q.id]); delete S.desafios[id]; delete S.medalhas['nivel-'+id]; save(); toast(`Nível ${id} reiniciado.`); PF.refresh(); }); });
    el.querySelector('[data-cfg-all]').onclick = () => PF.confirm('Apagar todo o progresso?', 'Respostas, desafios e medalhas dos 3 níveis.', 'Apagar', () => { S.respostas={}; S.desafios={}; S.medalhas={}; S.mod={}; save(); toast('Progresso apagado.'); PF.refresh(); });
    el.querySelector('[data-cfg-json]').onclick = () => { const b = new Blob([JSON.stringify({exportado:new Date().toISOString(), estado:S}, null, 2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='portfolio-feg-progresso.json'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},300); };
  }

  /* ---------------------------------------------------------------- render */
  const ctx = (nivel) => ({ dados: PF.db(), nivel, go: PF.go, refresh: PF.refresh, st: PF.modState(nivel) });
  PF.ctx = ctx;
  let lastKey = '';
  function render(keepScroll){
    const app = document.getElementById('app'); if(!app) return;
    const r = parse();
    const L = r.nivel ? lvl(r.nivel) : null;
    const scr = L ? (L.screens.find(s=>s.id===r.screen) || (r.screen==='perguntas'||r.screen==='desafio' ? {id:r.screen} : L.screens[0])) : null;
    const key = r.nivel+'/'+(scr?scr.id:r.screen);
    const title = L ? `Nível ${L.id} · ${scr && scr.titulo ? scr.titulo : (r.screen==='desafio'?'Desafio':'Perguntas & Respostas')}` : ({inicio:'Início', fontes:'Fontes e premissas', config:'Configurações'})[r.screen] || 'Início';
    document.title = `${title} — ${PF.APP_NAME}`;
    const sideOpen = document.querySelector('.side.open');
    app.innerHTML = `<div class="shell"><aside class="side ${sideOpen?'open':''}" aria-label="Menu">${sidebar(r)}</aside>
      <div class="main"><header class="topbar"><button class="menu-btn" data-pf-menu aria-label="Abrir menu">${icon('menu',18)}</button>
        <div class="crumb"><span class="eyebrow">${L?`Nível ${L.id} · ${esc(L.nome)}`:esc(PF.APP_NAME)}</span><b>${esc(title.replace(/^Nível \d · /,''))}</b></div>
        <div class="right"><span class="ilustrativo">${icon('info',13)} Dados fictícios para aprendizagem</span><img class="logo-o" src="${PF.LOGO_ONS||''}" alt="ONS — Operador Nacional do Sistema Elétrico"></div></header>
        <main class="content" id="pf-content"></main></div></div>`;
    const el = document.getElementById('pf-content');
    try{
      if(L && !PF.unlocked(L.id)) lockScreen(el, L);
      else if(L && scr.id==='perguntas') screenQuiz(el, L);
      else if(L && scr.id==='desafio') screenDesafio(el, L);
      else if(L) scr.render(el, ctx(L.id));
      else if(r.screen==='fontes') screenFontes(el);
      else if(r.screen==='config') screenConfig(el);
      else screenHome(el);
    } catch(err){ console.error(err); el.innerHTML = `<div class="callout atencao"><span class="ic">${icon('risk',16)}</span><div><p><b>Erro ao montar a tela.</b></p><p class="dim">${esc(err && err.message)}</p></div></div>`; }
    el.querySelectorAll('[data-pf-pdf]').forEach(b => b.addEventListener('click', () => PF.exportPDF(el, `portfolio-feg-${key.replace(/[^a-z0-9]+/gi,'-')}.pdf`, {title})));
    if(!keepScroll || key !== lastKey) window.scrollTo({top:0});
    lastKey = key;
  }
  function sidebar(r){
    const item = (href, ic, label, on, locked) => locked ? `<span class="nav-item locked" title="Bloqueado">${`<span class="ic">${icon('lock',16)}</span>`}${esc(label)}</span>` : `<a class="nav-item ${on?'on':''}" href="${href}"><span class="ic">${icon(ic,16)}</span>${esc(label)}</a>`;
    let h = `<div class="brand" onclick="location.hash='#/inicio'"><img src="${PF.LOGO_MAESTRO||''}" alt="maestro"><span>${esc(PF.APP_NAME)}</span></div>`;
    h += item('#/inicio','home','Início', r.nivel===0 && r.screen==='inicio');
    LEVELS.forEach(L => { const un = PF.unlocked(L.id), st = PF.levelStats(L.id);
      h += `<div class="nav-group ${un?'':'locked'}"><div class="nav-group-h"><span><b>Nível ${L.id}</b> · ${esc(L.nome)}</span><span class="pct">${un?fmt.pct(st.pct):icon('lock',12)}</span></div>`;
      if(!un){ h += `<div class="nav-lock">Conclua o nível ${L.id-1} para liberar: ${L.screens.map(s=>esc(s.titulo)).join(', ')}.</div></div>`; return; }
      L.screens.forEach(s => h += item(`#/n${L.id}/${s.id}`, s.icone||'dashboard', s.titulo, r.nivel===L.id && r.screen===s.id));
      h += item(`#/n${L.id}/perguntas`, 'question', 'Perguntas & Respostas', r.nivel===L.id && r.screen==='perguntas');
      if(L.desafio) h += item(`#/n${L.id}/desafio`, 'trophy', 'Desafio do nível', r.nivel===L.id && r.screen==='desafio');
      h += `</div>`; });
    h += `<div class="side-foot">${item('#/fontes','info','Fontes e premissas', r.screen==='fontes')}${item('#/config','settings','Configurações', r.screen==='config')}</div>`;
    return h;
  }
  function lockScreen(el, L){
    const prev = lvl(L.id-1), st = prev ? PF.levelStats(prev.id) : null;
    el.innerHTML = `<div class="lockscreen"><span class="ic">${icon('lock',30)}</span><div class="eyebrow">Nível ${L.id} · ${esc(L.nome)}</div><h2>Este módulo ainda está bloqueado</h2>
      <p class="muted">Para liberar, conclua o nível ${prev.id} (${esc(prev.nome)}): acerte <b class="lime">${prev.unlock.minPct}%</b> das perguntas${prev.desafio&&prev.unlock.desafio?' e conclua o desafio':''}. Hoje: ${st.ok}/${st.total} corretas (${fmt.pct(st.pct)})${prev.desafio?` · desafio ${st.desafio&&st.desafio.feito?'✓':'pendente'}`:''}.</p>
      <div class="row" style="justify-content:center"><a class="btn btn-primary" href="#/n${prev.id}/perguntas">Ir para as perguntas do nível ${prev.id}</a>${prev.desafio?`<a class="btn btn-ghost" href="#/n${prev.id}/desafio">Desafio do nível ${prev.id}</a>`:''}</div>
      <p class="dim" style="font-size:12.5px">Facilitador? Ative o modo instrutor em <a href="#/config">Configurações</a>.</p></div>`;
  }
  document.addEventListener('click', e => {
    if(e.target.closest('[data-pf-menu]')){ document.querySelector('.side').classList.toggle('open'); return; }
    if(e.target.closest('.side .nav-item') && window.innerWidth <= 980){ const s = document.querySelector('.side'); if(s) s.classList.remove('open'); }
  });

  PF.start = () => { checkLevelMedals(); render(); };
})();
