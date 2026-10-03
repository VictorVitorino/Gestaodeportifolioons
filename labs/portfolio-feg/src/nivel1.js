/* =========================================================================
   Portfólio FEG — NÍVEL 1 · PARTITURA · FUNDAMENTOS (nivel1.js) · "Ler o portfólio"
   Telas: Saúde & Prazos #/n1/saude (Sinal | Prazos 30/60/90 | Riscos & Dependências)
          Triagem #/n1/triagem (Fila | Registro) · Mapa da FE #/n1/mapa (Estrutura | Pool e papéis | Fóruns | Fronteira)
   Registra também: blocos do Dashboard (aba N1), KPIs I1.1–I1.16, abas da ficha (Sinal 20 · Riscos & Dependências 30),
   glossário do N1 (§8.3) e o desafio (§5.5). As 23 perguntas ficam em perguntas-n1.js (usa PF.n1).
   Telas leem PF.db() (trabalho) e gravam só por PF.write/append. Gabaritos do desafio: PF.calc sobre PF.base.
   Nada aqui é regra ONS; dados fictícios.
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF = window.PF || {};
  if(!PF.util || !PF.calc || !PF.registerLevel){ console.error('nivel1.js: core.js e calc.js precisam carregar antes.'); return; }
  const { esc, fmt } = PF.util;
  const icon = PF.icon, ui = PF.ui, C = PF.calc;
  const B = c => (PF.globais && PF.globais.badge ? PF.globais.badge(c) : PF.badge(c));
  const meta = d => (PF.globais && PF.globais.metaLine ? PF.globais.metaLine(d) : '');
  const st1 = () => PF.modState(1);
  const hoje = () => new Date().toISOString().slice(0, 10);
  const byId = (arr, id) => (arr || []).find(x => x.id === id) || null;
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const n2 = v => v == null ? 'n/d' : fmt.n(v, 2);
  const pc = (v, c = 1) => v == null ? 'n/d' : fmt.pct(v, c);
  const nn = v => v == null ? 'n/d' : fmt.n(v, v % 1 ? 1 : 0);
  const mes = n => Math.abs(n) === 1 ? 'mês' : 'meses';
  const ILU = () => PF.badge('ILUSTRATIVO');
  const DFP = ref => PF.badge({ origemRegra:'DECISAO_FUNCIONAL_PRODUTO', tipoFonte:'ARTEFATO_INTERNO', referencia:ref });
  const PROP = s => PF.badge({ origemRegra:'A_VALIDAR_FEG', tipoFonte:'PROPOSTA_CONSULTORIA', referencia:`Deck A&M Etapa 3 v25, ${s} (proposta de consultoria, não aprovada)` });
  const AVF = ref => PF.badge({ origemRegra:'A_VALIDAR_FEG', tipoFonte:'PREMISSA_ILUSTRATIVA', referencia:ref });
  const SIN = { VERDE:['Verde','ok','check'], AMARELO:['Amarelo','warn','risk'], VERMELHO:['Vermelho','bad','x'], CINZA:['Cinza','dim','question'] };
  /** Sinal sempre com texto e ícone, nunca só cor (§1.1). */
  const pillCor = (cor, title) => { const s = SIN[cor]; return s ? `<span class="pill tone-${s[1]} pf1-cor" title="${esc(title || s[0])}">${icon(s[2], 12)}${s[0]}</span>` : '<span class="dim">não informado</span>'; };
  const nomeCor = c => (SIN[c] || [c || '—'])[0];
  const DIDAT = '<span class="tag fonte-A_VALIDAR_FEG pf1-didat" title="Cards derivados do sinal calculado (R13)">Regra didática a validar: não usar em reporte</span>';
  const aula = (txt, titulo = 'Aula rápida') => ui.callout('conceito', `<p>${txt}</p>`, titulo);
  const curto = (t, n = 60) => { t = String(t || '').replace(/ \(fictício\)$/, ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const linkFicha = (id, txt, aba) => `<a href="#/inventario?ini=${esc(id)}" data-n1-ficha="${esc(id)}"${aba ? ` data-n1-aba="${esc(aba)}"` : ''}>${txt || `<b>${esc(id)}</b>`}</a>`;
  const iniCel = i => `${linkFicha(i.id)}<small class="pf1-tit" title="${esc(i.titulo)}">${esc(curto(i.titulo, 48))}</small>`;
  const nomeTipo = (d, c) => ((((d.catalogos || {}).tiposDecisao) || []).find(x => x.codigo === c) || {}).nome || c;
  const nomeFase = (d, c) => (byId(d.statusConfiguracao, c) || {}).nome || c || '—';
  const linhasTxt = t => { t = String(t || '').replace(/\s+$/, ''); return t ? t.split(/\r?\n/).length : 0; };
  /** Valor de um campo do checklist em texto simples. */
  const vtxt = v => v == null || v === '' ? '<span class="dim">(vazio)</span>' : v === true ? 'sim' : v === false ? 'não'
    : typeof v === 'object' ? Object.entries(v).map(([k, x]) => `${esc(k)}: <b>${x === true ? 'sim' : x === false ? 'não' : esc(x ?? '—')}</b>`).join(' · ') : esc(v);
  /** Recorte do Dashboard por gerência: cópia rasa com as iniciativas filtradas (as funções de PF.calc são puras). */
  const recorte = (d, g) => g ? Object.assign({}, d, { iniciativas: (d.iniciativas || []).filter(i => i.gerenciaId === g) }) : d;

  /* ------------------------------------------------------------------ estilo próprio (classes pf1-*) */
  const CSS = `.pf1-cor svg{flex:none}.pf1-lk{text-decoration:none}.pf1-didat{white-space:normal;text-align:left}.pf1-motivo{font-size:12.5px;color:var(--muted);display:block;min-width:190px}.tbl td small.pf1-tit{min-width:160px;max-width:240px}
.pf1-cklist{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px}.pf1-cklist>div{display:grid;grid-template-columns:32px minmax(0,1fr) minmax(0,.9fr);gap:4px 10px;padding:9px 12px;border-bottom:1px solid var(--line);font-size:13.5px}
.pf1-cklist>div:last-child{border-bottom:0}.pf1-cklist small{display:block;color:var(--dim);font-size:11.5px}.pf1-cklist code{overflow-wrap:anywhere;font-size:11.5px}.pf1-cklist .v{overflow-wrap:anywhere}
.pf1-ul{margin:0;padding-left:18px;color:var(--muted);font-size:13.5px}.pf1-ul li{margin:3px 0}
.pf1-steps{display:flex;gap:8px;flex-wrap:wrap;margin:0;padding:0;list-style:none;counter-reset:none}
.pf1-steps a{display:inline-flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:999px;border:1px solid var(--line-2);color:var(--muted);text-decoration:none;font-size:13px}
.pf1-steps a:hover{border-color:var(--lime);color:#fff}.pf1-steps .n{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;border:1.5px solid var(--line-2)}
.pf1-steps .ok a{color:#fff}.pf1-steps .ok .n{background:var(--lime);border-color:var(--lime);color:var(--ink)}
.pf1-kpi .val small{font-size:15px;color:var(--muted);margin-left:4px}.pf1-kpi .btn-text{font-size:12px;margin-top:auto}.pf1-kpi .lbl{flex-wrap:wrap}
.pf1-det summary{cursor:pointer;color:var(--lime);font-family:var(--display)}.pf1-det[open] summary{margin-bottom:8px}
.pf1-agir{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}.pf1-agir li{font-size:13.5px}.pf1-agir .muted{display:block;font-size:12.5px}
.pf1-op{display:grid;grid-template-columns:auto auto auto minmax(0,1fr);gap:4px 10px;align-items:center;padding:8px 12px;border:1px solid var(--line);border-radius:12px;cursor:pointer}
.pf1-op.on{border-color:var(--lime);background:var(--lime-soft)}.pf1-op small{grid-column:2/-1;color:var(--dim);font-size:12px}.pf1-pauta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pf1-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}.pf1-form .full{grid-column:1/-1}.pf1-form .input,.pf1-form .select{width:100%}
.pf1-form textarea{resize:vertical}.pf1-err{color:#F3A39A;font-size:12.5px}.pf1-err:empty{display:none}.field.pf1-bad .input,.field.pf1-bad .select{border-color:var(--bad)}
.pf1-ck{display:flex;flex-wrap:wrap;gap:6px}.pf1-ck span{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:3px 9px;color:var(--muted)}
.pf1-ck .y{border-color:rgba(156,203,91,.5);color:var(--ok)}.pf1-ck .n{border-color:rgba(228,103,90,.5);color:var(--bad)}
.pf1-flow{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:14px;align-items:center}
.pf1-box{border:1px solid var(--line-2);border-radius:12px;padding:12px 14px;background:rgba(0,0,0,.12)}.pf1-box b{display:block;font-family:var(--display);font-weight:500}
.pf1-box.hl{border-color:var(--lime-line);background:var(--lime-soft)}.pf1-arr{color:var(--lime);text-align:center;font-size:12.5px;display:flex;flex-direction:column;align-items:center;gap:4px}
.pf1-venc td{background:rgba(228,103,90,.08)}.pf1-blq td{background:rgba(233,180,76,.08)}
.pf1-step{border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}.pf1-step.ok{border-color:rgba(156,203,91,.55)}
.pf1-step h4{font-family:var(--display);font-size:17px;font-weight:400;margin:0}.pf1-chk{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;font-size:13.5px}
.pf1-chk .y{color:var(--ok)}.pf1-chk .n{color:var(--muted)}.pf1-contas{display:grid;grid-template-columns:minmax(0,1fr) 150px 60px;gap:8px 12px;align-items:center}
.pf1-contas .input{width:100%}.pf1-ger{font-family:var(--display);font-size:24px;font-weight:300;color:var(--lime)}
.pf1-kv{width:100%;border-collapse:collapse;font-size:13.5px}.pf1-kv td{padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}.pf1-kv td:first-child{color:var(--dim);width:38%}
.pf1-q9{display:grid;grid-template-columns:22px minmax(0,1fr) minmax(180px,250px);gap:8px 10px;align-items:center}.pf1-q9 .select{width:100%}.pf1-q9>span{min-width:0;overflow-wrap:anywhere}
@media (max-width:980px){.pf1-pauta{grid-template-columns:1fr}}
@media (max-width:640px){.pf1-form{grid-template-columns:minmax(0,1fr)}.pf1-flow{grid-template-columns:minmax(0,1fr)}.pf1-arr{flex-direction:row}
.pf1-contas{grid-template-columns:minmax(0,1fr) 110px}.pf1-contas .r{grid-column:1/-1}.pf1-q9{grid-template-columns:22px minmax(0,1fr)}.pf1-q9 .select{grid-column:2}.pf1-motivo{min-width:160px}}`;
  if(typeof document !== 'undefined' && !document.getElementById('pf1-css')){ const s = document.createElement('style'); s.id = 'pf1-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ------------------------------------------------------------------ roteiro da Partitura (persistido em PF.modState(1)) */
  const PASSOS = [['mapa','Mapa da FE','#/n1/mapa'],['inventario','Inventário','#/inventario'],['saude','Saúde & Prazos','#/n1/saude'],['indicadores','Indicadores','#/indicadores'],['triagem','Triagem','#/n1/triagem'],['trilha','Trilha do nível','#/n1/trilha']];
  const marcar = k => { const s = st1(); s.roteiro = s.roteiro || {}; if(!s.roteiro[k]){ s.roteiro[k] = new Date().toISOString(); PF.save(); } };
  const marcaHash = () => { const h = location.hash;
    if(/^#\/inventario/.test(h)) marcar('inventario'); else if(/^#\/indicadores/.test(h)) marcar('indicadores'); else if(/^#\/n1\/(trilha|perguntas|desafio)/.test(h)) marcar('trilha'); };
  window.addEventListener('hashchange', marcaHash); window.addEventListener('load', marcaHash);   // também quando a página abre direto numa dessas telas

  /* ------------------------------------------------------------------ atalhos para a ficha da iniciativa (globais.js) */
  /** Abre a ficha já no formulário de pendência, com tipo e campo sugeridos. */
  function abrirPendencia(id, tipo, campo){
    if(!PF.abrirFicha){ location.hash = '#/inventario?ini=' + encodeURIComponent(id); return; }
    PF.abrirFicha(id, 'sinal', { pendencia:{ tipo, campo } });   /* globais.js abre direto no formulário, com tipo e campo sugeridos */
  }
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-n1-ficha]'); if(f && PF.abrirFicha){ e.preventDefault(); PF.abrirFicha(f.dataset.n1Ficha, f.dataset.n1Aba || undefined); return; }
    const p = e.target.closest('[data-n1-pend]'); if(p){ e.preventDefault(); abrirPendencia(...p.dataset.n1Pend.split('|')); return; }
    const s = e.target.closest('[data-n1-passo]'); if(s) marcar(s.dataset.n1Passo);
    if(e.target.closest('[data-n1-pauta-salvar]')) salvarPauta(e.target.closest('[data-n1-pauta]'));
  });

  /* ================================================================== SAÚDE & PRAZOS */
  function telaSaude(el, ctx){
    marcar('saude');
    const d = ctx.dados, q = ctx.route.query.aba, aba = ['sinal','prazos','riscos'].includes(q) ? q : 'sinal';
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 1 · Ler o portfólio', title:'Saúde & Prazos', sub:'As iniciativas em execução: sinal calculado × declarado, prazos de entrega e o que segue aberto em riscos e dependências.' })
      + meta(d) + ui.tabs('#/n1/saude', [['sinal','Sinal'],['prazos','Prazos 30/60/90'],['riscos','Riscos & Dependências']], aba) + '<div data-n1-aba></div>';
    const host = el.querySelector('[data-n1-aba]');
    (aba === 'prazos' ? abaPrazos : aba === 'riscos' ? abaRiscos : abaSinal)(host, d);
  }

  function abaSinal(el, d){
    const A = C.emExecucao(d), L = C.param(d, 'R13'), so = !!PF.ui_state('n1:sodiv', false), ordem = { VERMELHO:0, AMARELO:1, CINZA:2, VERDE:3 };
    const rows = A.map(i => { const s = C.sinal(d, i); return { id:i.id, i, s, fis:C.num(i.percentualFisicoReal), ac:C.ac(d, i), bac:C.bac(d, i), idx:s.indice, desvio:s.desvio, cor:s.cor, dec:s.declarado }; });
    const vis = so ? rows.filter(r => r.s.divergente) : rows, ct = C.distribuicaoSinal(d).contagem, nd = rows.filter(r => r.s.divergente).length;
    const cols = [
      { key:'id', label:'Iniciativa', fmt:(v, r) => iniCel(r.i) },
      { key:'dec', label:'Declarado', sortVal:r => r.dec || '', fmt:v => v ? pillCor(v) : '<span class="dim">não informado</span>' },
      { key:'cor', label:'Calculado', sortVal:r => ordem[r.cor], fmt:(v, r) => pillCor(v, r.s.motivo) + (r.s.divergente ? `<small><b class="tone-warn" style="font-weight:500">diverge do declarado</b></small><button class="btn btn-ghost btn-sm" style="margin-top:6px" data-n1-pend="${esc(r.id)}|DIVERGENCIA_STATUS|ragDeclarado">${icon('plus', 13)} Registrar divergência</button>` : '') },
      { key:'fis', label:'% físico', align:'r', fmt:v => v == null ? '—' : fmt.n(v) + '%' },
      { key:'ac', label:'AC / BAC (R$ mi)', align:'r', sortVal:r => C.div(r.ac, r.bac) ?? -1, fmt:(v, r) => `${n2(r.ac)} / ${n2(r.bac)}<small>${pc(C.div(r.ac, r.bac), 0)} gasto</small>` },
      { key:'idx', label:'Índice', align:'r', sortVal:r => r.idx ?? -1, fmt:v => n2(v) },
      { key:'desvio', label:'Desvio', align:'r', sortVal:r => r.desvio ?? -99, fmt:(v, r) => (v == null ? '<span class="dim">sem baseline</span>' : fmt.n(v)) + (r.s.previsaoVencida ? '<small>previsão vencida</small>' : '') },
      { key:'motivo', label:'Motivo da cor', sort:false, fmt:(v, r) => `<span class="pf1-motivo">${esc(r.s.motivo)}</span>` },
    ];
    /** Cor da barra = cor daquela dimensão no sinal; sem referência (Cinza) a barra fica neutra, nunca verde. */
    const tomDim = c => c ? SIN[c][1] : 'dim';
    const g1 = PF.charts.hbar(rows.map(r => ({ label:r.id, value:r.idx || 0, nd:r.idx == null, color:tomDim(r.s.custo), mark:L.vermelhoIndiceAbaixoDe, markTitle:'limiar do vermelho (R13)', title:`${r.id}: índice ${n2(r.idx)}${r.s.custo ? '' : ' · sinal Cinza (sem referência)'}` })),
      { max:Math.max(1.2, ...rows.map(r => r.idx || 0)), fmt:(v, it) => it.nd ? 'n/d' : n2(v) });
    const g2 = PF.charts.hbar(rows.map(r => ({ label:r.id, value:Math.max(0, r.desvio || 0), nd:r.desvio == null, color:tomDim(r.s.prazo), mark:L.vermelhoDesvioMeses, markTitle:'limiar do vermelho (R13)', title:`${r.id}: desvio ${r.desvio == null ? 'sem baseline' : r.desvio}` })),
      { max:Math.max(L.vermelhoDesvioMeses + 1, ...rows.map(r => r.desvio || 0)), fmt:(v, it) => it.nd ? 'sem base' : fmt.n(v) });
    el.innerHTML = aula('Cor é comparação com uma referência. Sem baseline, Cinza. A pior dimensão (prazo ou custo) define a cor. O desvio conta meses de calendário: (12 × ano + mês previsto) − (12 × ano + mês planejado).')
      + `<div class="grid g2" style="margin:16px 0">
        <div class="card stack" style="gap:8px">${ui.section('Regra do sinal', 'Vale a pior dimensão entre prazo e custo.')}<div class="row">${B('R13')}${B('R14')}${DIDAT}</div>
          <ul class="pf1-ul"><li><b class="tone-bad">Vermelho</b>: desvio ≥ ${L.vermelhoDesvioMeses} meses ou índice &lt; ${n2(L.vermelhoIndiceAbaixoDe)}.</li>
          <li><b class="tone-warn">Amarelo</b>: desvio de ${L.amareloDesvioMeses} a ${L.vermelhoDesvioMeses - 1} meses ou índice de ${n2(L.vermelhoIndiceAbaixoDe)} a &lt; ${n2(L.amareloIndiceAbaixoDe)}.</li>
          <li><b class="tone-ok">Verde</b>: desvio &lt; ${L.amareloDesvioMeses} mês e índice ≥ ${n2(L.amareloIndiceAbaixoDe)}.</li>
          <li><b>Cinza</b>: sem baseline, BAC ou AC. Nunca vira verde por omissão. ${DFP('§3.10: dado faltante → Cinza')}</li></ul>
          <p class="dim" style="margin:0;font-size:12.5px">Índice progresso × gasto = % físico ÷ (AC ÷ BAC). ${B('R37')}</p></div>
        <div class="card stack" style="gap:10px">${ui.section('Retrato em execução', `${A.length} iniciativas · contagem, não nota de saúde.`)}
          ${PF.charts.stack(['VERDE','AMARELO','VERMELHO','CINZA'].map(k => ({ label:nomeCor(k), value:ct[k] || 0, color:SIN[k][1] })))}
          <div class="row">${['VERMELHO','AMARELO','VERDE','CINZA'].map(k => `${pillCor(k)} <b class="num">${ct[k] || 0}</b>`).join('<span class="dim">·</span>')}</div>
          <p class="muted" style="margin:0">${nd} ${nd === 1 ? 'divergência' : 'divergências'} entre o declarado e o calculado. Divergência vira pendência, não correção de cor.</p></div></div>
        <div class="row" style="margin-bottom:10px"><label class="row" style="cursor:pointer;font-size:13.5px;color:var(--muted)"><input type="checkbox" data-n1-sodiv ${so ? 'checked' : ''}> Só divergências</label><span class="dim" style="font-size:12.5px">${vis.length} de ${rows.length}</span></div>
        <p class="dim" style="margin:0 0 8px;font-size:12.5px">Índice = progresso × gasto (% físico ÷ fração do BAC gasta). Desvio em meses de calendário.</p>
        ${ui.table({ cols, rows:vis, id:'n1sinal', empty:'Nenhuma divergência entre declarado e calculado.' })}
        <div class="grid g2" style="margin-top:16px"><div class="card">${ui.section('Índice progresso × gasto', 'Barra branca: limiar do vermelho. Tabela equivalente: coluna “Índice” acima.')}${g1}</div>
        <div class="card">${ui.section('Desvio de prazo (meses de calendário)', 'Barra branca: limiar do vermelho. Tabela equivalente: coluna “Desvio” acima.')}${g2}</div></div>`;
    const cb = el.querySelector('[data-n1-sodiv]'); if(cb) cb.onchange = () => { PF.set_ui('n1:sodiv', cb.checked); PF.refresh(); };
  }

  /** Topo do eixo em múltiplo de 4: as 4 linhas de grade caem em números inteiros (contagens). */
  const maxContagem = c => Math.max(4, Math.ceil(Math.max(0, ...Object.values(c)) / 4) * 4);
  const FX = { VENCIDO:'Vencido', '30_DIAS':'Até 30 dias', '60_DIAS':'31 a 60 dias', '90_DIAS':'61 a 90 dias', ACIMA_90:'Acima de 90 dias', SEM_DATA:'Sem data' };
  function abaPrazos(el, d){
    const s = st1(), base = C.ref(d), refL = /^\d{4}-\d{2}-\d{2}$/.test(s.refPrazos || '') ? s.refPrazos : base, instr = !!PF.state().instrutor, todas = instr && !!PF.ui_state('n1:todas', false);
    const h = C.horizontes(d, { ref:refL, todasAtivas:todas }), ks = Object.keys(h.contagem), rotF = k => FX[k] || k;
    const itens = h.itens.map(x => Object.assign({ i:byId(d.iniciativas, x.id) }, x)), ordF = k => ks.indexOf(k);
    const porFaixa = ks.map(k => ({ k, n:h.contagem[k], ids:itens.filter(x => x.faixa === k).map(x => x.id) }));
    el.innerHTML = aula('A faixa conta dias corridos até a data prevista. A própria data de referência cai na faixa de 30 dias. Data já passada conta como <span title="VENCIDO">Vencido</span>; sem data, fica em <span title="SEM_DATA">Sem data</span>.')
      + `<div class="card stack" style="margin:16px 0;gap:10px"><div class="row" style="align-items:flex-end">
          <label class="field">Data de referência desta aba<input class="input" type="date" data-n1-ref value="${esc(refL)}"></label>
          ${refL !== base ? `<button class="btn btn-ghost btn-sm" data-n1-ref-reset>${icon('reset', 14)} Voltar para ${fmt.date(base)}</button>` : ''}${B('R07')}${B('R08')}
          ${instr ? `<label class="row" style="cursor:pointer;font-size:13px;color:var(--muted)"><input type="checkbox" data-n1-todas ${todas ? 'checked' : ''}> Todas ativas (como a RPC get_horizonte_datas) · modo instrutor</label>` : ''}</div>
        ${refL !== base ? ui.callout('atencao', `<p>Você mudou a data de referência para <b>${fmt.date(refL)}</b>. Os números desta aba deixam de bater com o gabarito das perguntas, que usa ${fmt.date(base)}. A mudança vale só aqui.</p>`) : ''}</div>
      <div class="grid g2"><div class="card">${ui.section(todas ? 'Todas as iniciativas ativas por faixa' : 'Iniciativas em execução por faixa', `Contagem pela data prevista atual · referência ${fmt.date(refL)}`)}
          ${PF.charts.bars(ks.map(rotF), [{ name:todas ? 'Todas ativas' : 'Em execução', values:ks.map(k => h.contagem[k]), color:'lime' }], { height:220, max:maxContagem(h.contagem) })}</div>
        <div class="card">${ui.section('Tabela equivalente', 'Mesmos números do gráfico.')}
          ${ui.table({ cols:[{ key:'k', label:'Faixa', fmt:v => esc(rotF(v)) }, { key:'n', label:'Nº', align:'r' }, { key:'ids', label:'Iniciativas', sort:false, fmt:v => v.length ? v.map(id => linkFicha(id)).join(', ') : '<span class="dim">—</span>' }], rows:porFaixa })}</div></div>
      <div style="margin-top:16px">${ui.table({ id:'n1prazos', rows:itens, cols:[
        { key:'id', label:'Iniciativa', fmt:(v, r) => r.i ? iniCel(r.i) : esc(v) },
        ...(todas ? [{ key:'fase', label:'Fase', sortVal:r => r.i ? r.i.statusId : '', fmt:(v, r) => esc(r.i ? nomeFase(d, r.i.statusId) : '—') }] : []),
        { key:'prev', label:'Data prevista atual', sortVal:r => r.i && r.i.dataPrevistaAtual || '9', fmt:(v, r) => r.i && r.i.dataPrevistaAtual ? fmt.date(r.i.dataPrevistaAtual) : '<span class="dim">sem data</span>' },
        { key:'dias', label:'Dias corridos até a data', align:'r', sortVal:r => r.dias ?? 1e9, fmt:v => v == null ? '—' : fmt.n(v) },
        { key:'faixa', label:'Faixa', sortVal:r => ordF(r.faixa), fmt:v => `<span class="pill tone-${v === 'VENCIDO' ? 'bad' : v === 'SEM_DATA' ? 'dim' : v === 'ACIMA_90' ? 'paper' : 'lime'}">${esc(rotF(v))}</span>` }] })}</div>`;
    const inp = el.querySelector('[data-n1-ref]'); if(inp) inp.onchange = () => { if(/^\d{4}-\d{2}-\d{2}$/.test(inp.value)){ st1().refPrazos = inp.value; PF.save(); PF.refresh(); } };
    const rs = el.querySelector('[data-n1-ref-reset]'); if(rs) rs.onclick = () => { delete st1().refPrazos; PF.save(); PF.refresh(); };
    const tg = el.querySelector('[data-n1-todas]'); if(tg) tg.onchange = () => { PF.set_ui('n1:todas', tg.checked); PF.refresh(); };
  }

  function abaRiscos(el, d){
    const A = C.emExecucao(d), ids = A.map(i => i.id), F = C.param(d, 'R09');
    const rs = (d.riscosImpedimentos || []).filter(r => ids.includes(r.iniciativaId)).map(r => Object.assign({}, r, { aberto:C.riscoAberto(d, r), vencido:C.riscoVencido(d, r) }));
    const ab = rs.filter(r => r.aberto), venc = ab.filter(r => r.vencido), comAb = new Set(ab.map(r => r.iniciativaId));
    const deps = (d.dependencias || []).filter(x => ids.includes(x.iniciativaOrigemId)).map(x => { const y = x.iniciativaDependenciaId ? byId(d.iniciativas, x.iniciativaDependenciaId) : null, sy = y ? C.sinal(d, y) : null;
      return Object.assign({}, x, { aberta:C.dependenciaAberta(d, x), y, sy, vermelha:!!(sy && sy.cor === 'VERMELHO') }); });
    const dAb = deps.filter(x => x.aberta), bl = dAb.filter(x => x.vermelha);
    const leitura = ok => ok ? '<span class="pill tone-warn">Aberto</span>' : '<span class="pill tone-ok">Fechado</span>';
    el.innerHTML = aula(`Só está fechado o risco com status ${F.riscos.join(', ')} (na dependência, ${F.dependencias.join(', ')}). Vazio ou qualquer outro texto, como “EM TRATAMENTO”, conta como aberto. Risco pode acontecer; impedimento já trava.`)
      + `<div class="row" style="margin:16px 0">${ui.pill(`${ab.length} riscos e impedimentos abertos`, 'warn')}${ui.pill(`${venc.length} vencido${venc.length === 1 ? '' : 's'}`, 'bad')}${ui.pill(`${comAb.size} iniciativas com algum aberto`, 'paper')}
        ${ui.pill(`${dAb.length} dependências abertas`, 'warn')}${ui.pill(`${bl.length} bloqueio${bl.length === 1 ? '' : 's'} por vermelha`, 'bad')}${B('R09')}</div>
      ${ui.section('Riscos e impedimentos das iniciativas em execução', `Leitura pela regra literal do repositório; prazo anterior a ${fmt.date(C.ref(d))} = vencido.`)}
      ${ui.table({ id:'n1riscos', rows:rs, rowAttr:r => r.vencido ? 'class="pf1-venc"' : '', cols:[
        { key:'id', label:'Registro', fmt:v => `<b>${esc(v)}</b>` },
        { key:'iniciativaId', label:'Iniciativa', fmt:v => linkFicha(v) },
        { key:'natureza', label:'Natureza', fmt:v => v === 'IMPEDIMENTO' ? '<span class="pill tone-bad">Impedimento</span>' : '<span class="pill tone-info">Risco</span>' },
        { key:'descricao', label:'Descrição e ação', fmt:(v, r) => `${esc(v)}<small>Ação: ${esc(r.acao || '—')}</small>` },
        { key:'status', label:'Status no registro', fmt:v => v == null || v === '' ? '<span class="tone-warn">(vazio)</span>' : `<code>${esc(v)}</code>` },
        { key:'aberto', label:'Leitura pela regra', sortVal:r => r.aberto ? 0 : 1, fmt:v => leitura(v) },
        { key:'prazo', label:'Prazo', sortVal:r => r.prazo || '9', fmt:(v, r) => (v ? fmt.date(v) : '—') + (r.vencido ? '<small><b class="tone-bad" style="font-weight:500">vencido</b></small>' : '') }] })}
      <div style="margin-top:20px">${ui.section('Dependências das iniciativas em execução', 'Leia como “X é bloqueada por Y”. Destaque quando Y está vermelha: efeito cascata.')}
      ${ui.table({ id:'n1deps', rows:deps, rowAttr:r => r.aberta && r.vermelha ? 'class="pf1-blq"' : '', cols:[
        { key:'id', label:'Registro', fmt:v => `<b>${esc(v)}</b>` },
        { key:'iniciativaOrigemId', label:'Leitura', fmt:(v, r) => `${linkFicha(v)} é bloqueada por ${r.y ? linkFicha(r.y.id) : `comunidade <b>${esc(r.comunidadeDependenciaId || '—')}</b>`}<small>${esc(r.descricao || '')}</small>` },
        { key:'tipo', label:'Tipo', fmt:v => esc(v || '—') },
        { key:'status', label:'Status no registro', fmt:v => v == null || v === '' ? '<span class="tone-warn">(vazio)</span>' : `<code>${esc(v)}</code>` },
        { key:'aberta', label:'Leitura pela regra', sortVal:r => r.aberta ? 0 : 1, fmt:v => leitura(v) },
        { key:'sy', label:'Sinal de quem bloqueia', sort:false, fmt:(v, r) => v ? pillCor(v.cor, v.motivo) : '<span class="dim">comunidade</span>' },
        { key:'dataEsperada', label:'Data esperada', fmt:v => v ? fmt.date(v) : '—' }] })}</div>`;
  }

  /* ================================================================== TRIAGEM */
  const instTriagem = d => ((((d.catalogos || {}).instancias || {}).triagem) || [])[0] || 'PO da squad (R): s143, leitura do texto extraído';
  const papeis = d => ((d.catalogos || {}).papeisRegistrantes) || ['Analista: Gestão de Portfólio/PMO'];
  const triagensDe = d => (d.decisoes || []).filter(x => C.TRIAGEM.includes(x.tipoDecisao));
  const COM_DESTINO = ['REDIRECIONAR_EXECUCAO','ENCAMINHAR_EXPLORATORIO','ARQUIVAR'];
  let triForm = { id:null, vals:{}, erros:{} }, corrForm = { id:null, vals:{}, erros:{} }, rolarDetalhe = false;
  const errHtml = (erros, k) => `<small class="pf1-err">${(erros && erros[k]) || ''}</small>`;
  const campo = (label, ctrl, erros, k, full) => `<label class="field${full ? ' full' : ''}${erros && erros[k] ? ' pf1-bad' : ''}">${label}${ctrl}${errHtml(erros, k)}</label>`;
  const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(v) === String(cur ?? '') ? 'selected' : ''}>${esc(l)}</option>`;
  const destinoTxt = x => x.vinculoIniciativaId ? `vínculo com ${x.vinculoIniciativaId}` : x.destino || '';

  /** Texto do efeito simulado "se a instância acatar" (§5.2.6). */
  function efeitoTxt(dec){
    const t = dec.tipoDecisao, dst = destinoTxt(dec);
    return ({ ADMITIR:'a demanda passa para a fase Em análise.', DEVOLVER:'continua Demanda, com uma pendência para completar o cadastro.',
      REDIRECIONAR_EXECUCAO:`sai do portfólio (inativa) e segue no fluxo de execução${dst ? ': ' + dst : ''}.`, ENCAMINHAR_EXPLORATORIO:`sai do portfólio (inativa) e vai para o escopo exploratório${dst ? ': ' + dst : ''}.`,
      ARQUIVAR:`arquivada (inativa)${dst ? ', ' + dst : ''}.` })[t] || '—';
  }
  function feedbackTriagem(d, dec){
    const i = byId(d.iniciativas, dec.iniciativaId); if(!i) return '';
    const g = C.triagemSugerida(d, i), ok = g.saida === dec.tipoDecisao, meio = !ok && g.observacao === 'evidência pendente' && dec.tipoDecisao === 'DEVOLVER';
    const vig = C.decisoesVigentes(d).some(x => x.id === dec.id), ck = C.checklistTriagem(d, i);
    return `<div class="feedback ${ok ? 'ok' : 'err'}"><h4>${ok ? icon('check', 16) + ' Confere com a precedência' : meio ? 'Meio acerto' : 'Difere da saída sugerida'} <span class="muted" style="font-weight:400;font-size:13px">· ${esc(dec.id)} · ${esc(i.id)}</span></h4>
      <p>Sua recomendação: <b>${esc(nomeTipo(d, dec.tipoDecisao))}</b>${destinoTxt(dec) ? ' → ' + esc(destinoTxt(dec)) : ''}. Saída sugerida pela precedência ${B('R17')}: <b>${esc(nomeTipo(d, g.saida))}</b>${g.destino ? ' → ' + esc(g.destino) : g.vinculo ? ' (vínculo com ' + esc(g.vinculo) + ')' : ''}${g.observacao ? ' · ' + esc(g.observacao) : ''}.</p>
      <p class="muted">${esc(g.motivo)}${meio ? ' Devolver vale meio acerto: perde a janela regulatória, mas não inventa conversão.' : ''}</p>
      <div class="pf1-ck" style="margin:6px 0">${ck.map(x => `<span class="${x.ok ? 'y' : 'n'}" title="${esc(x.pergunta)}">${x.ok ? '✓' : '✗'} ${x.id}</span>`).join('')}</div>
      <p>Efeito simulado, se a instância acatar: ${esc(efeitoTxt(dec))}</p>
      ${!ok && vig ? `<a class="btn btn-ghost btn-sm pf1-lk" href="#/n1/triagem?aba=registro" data-n1-corr-abrir="${esc(dec.id)}">${icon('edit', 13)} Corrigir triagem</a>` : ''}</div>`;
  }

  function telaTriagem(el, ctx){
    marcar('triagem');
    const d = ctx.dados, aba = ctx.route.query.aba === 'registro' ? 'registro' : 'fila', fila = C.demandas(d), tri = triagensDe(d), vig = new Set(C.decisoesVigentes(d).map(x => x.id));
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 1 · Ler o portfólio', title:'Triagem', sub:'A fila de demandas, como espelho do registro de origem. Você recomenda uma das cinco saídas; o PO da squad decide.' }) + meta(d)
      + ui.callout('dica', `<p><b>Adaptação didática</b> ${DFP('Triagem como admissibilidade ao portfólio (adaptação didática do s142)')} ${B('R17')}: no deck (s142) as saídas da triagem levam ao backlog da squad. Aqui elas são usadas como admissibilidade ao portfólio (a validar). O registro e a triagem reais acontecem no canal oficial (ITSM/ADO); aqui se treina a leitura e a recomendação.</p>`)
      + `<div style="margin:12px 0 16px">${aula('Triagem não é priorização: decide se a demanda entra na análise do portfólio. A analista recomenda; o PO da squad é o responsável (proposta s143). Leia o checklist na ordem T1 → T4 → T5 → T2/T3/T6; a primeira falha define a saída.')}</div>`
      + ui.tabs('#/n1/triagem', [['fila', `Fila (${fila.length})`], ['registro', `Registro (${tri.length})`]], aba) + '<div data-n1-aba></div>';
    const host = el.querySelector('[data-n1-aba]');
    if(aba === 'registro') abaRegistro(host, d, tri, vig); else abaFila(host, d, fila);
    el.onclick = e => cliqueTriagem(e, d);
    el.onkeydown = e => { const r = e.target.closest('[data-n1-dem]'); if(r && e.key === 'Enter'){ PF.set_ui('n1:dem', r.dataset.n1Dem); rolarDetalhe = true; PF.refresh(); } };
    if(rolarDetalhe){ rolarDetalhe = false; const det = el.querySelector('[data-n1-detalhe]'); if(det && window.innerWidth <= 980 && det.scrollIntoView) det.scrollIntoView({ block:'start' }); }
    el.onsubmit = e => { e.preventDefault(); const f = e.target; if(f.dataset.n1Tri) enviarTriagem(f, d); else if(f.dataset.n1Corr) enviarCorrecao(f, d); };
  }

  const regrasTriagem = d => { const R = C.param(d, 'R17') || {}, nome = s => esc(nomeTipo(d, s));
    return `<div class="card stack" style="gap:8px">${ui.section('Como decidir', 'Precedência do checklist: a primeira falha define a saída.')}<div class="row">${B('R17')}${B('R18')}</div>
      <ul class="pf1-ul"><li>T1 falha → ${nome('REDIRECIONAR_EXECUCAO')}.</li><li>T4 falha por nova metodologia → ${nome('ENCAMINHAR_EXPLORATORIO')} (Comunidade Técnica); por outro fluxo → ${nome('REDIRECIONAR_EXECUCAO')}.</li>
      <li>T5 falha → ${nome('ARQUIVAR')} (vínculo com a iniciativa redundante).</li><li>T2, T3 ou T6 falham → ${nome('DEVOLVER')}.</li><li>Tudo certo → ${nome('ADMITIR')}.</li></ul>
      <p class="dim" style="margin:0;font-size:12.5px">Ordem: ${esc((R.precedencia || []).join(' → '))} → Admitir.</p></div>`; };

  function abaFila(el, d, fila){
    const st = st1(), lim = C.param(d, 'R16');
    let sel = PF.ui_state('n1:dem', null); if(!fila.some(i => i.id === sel)) sel = fila[0] && fila[0].id;
    const u0 = st.ultimaTriagem && byId(d.decisoes, st.ultimaTriagem), ult = u0 && !(u0.iniciativaId === sel && (C.triagemVigente(d, sel) || {}).id === u0.id) ? u0 : null;
    const rows = fila.map(i => ({ id:i.id, i, canal:i.canalEntrada, entrada:i.dataEntrada, idade:C.idadeDemanda(d, i), vig:C.triagemVigente(d, i.id) }));
    const canal = c => ((((d.catalogos || {}).canalEntrada) || []).find(x => x.codigo === c) || {}).nome || c || '—';
    el.innerHTML = (ult ? `<div class="stack" style="gap:6px;margin-bottom:16px"><div class="row"><b>Última recomendação registrada</b><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-n1-ult-fechar>${icon('x', 13)} Fechar</button></div>${feedbackTriagem(d, ult)}</div>` : '')
      + `<div class="grid g2" style="align-items:start"><div class="stack" style="gap:10px;min-width:0">${ui.section('Fila de demandas', `Fase Demanda · idade em dias até ${fmt.date(C.ref(d))}; acima de ${lim} dias pede atenção ${B('R16')}`)}
        ${ui.table({ id:'n1fila', rows, empty:'Fila vazia: todas as demandas têm recomendação registrada. Veja a aba Registro.', rowAttr:r => `class="click ${r.id === sel ? 'sel' : ''}" data-n1-dem="${esc(r.id)}" tabindex="0" aria-label="Analisar ${esc(r.id)}"`, cols:[
          { key:'id', label:'Demanda', fmt:(v, r) => `<b>${esc(v)}</b><small title="${esc(r.i.titulo)}">${esc(curto(r.i.titulo, 46))}</small><small>canal: ${esc(canal(r.canal))}</small>` },
          { key:'idade', label:'Idade (dias)', align:'r', fmt:v => v == null ? '—' : `<b class="${v > lim ? 'tone-warn' : ''}">${fmt.n(v)}</b>` },
          { key:'vig', label:'Recomendação vigente', sortVal:r => r.vig ? r.vig.tipoDecisao : '', fmt:v => v ? `${esc(nomeTipo(d, v.tipoDecisao))}<small>${esc(v.id)}</small>` : '<span class="dim">aguardando</span>' }] })}
        ${regrasTriagem(d)}</div>
        <div style="min-width:0" data-n1-detalhe>${sel ? detalheDemanda(d, byId(d.iniciativas, sel)) : `<div class="card"><p class="muted" style="margin:0">Nenhuma demanda na fila. As recomendações estão na aba Registro, onde “Corrigir triagem” devolve uma demanda à fila.</p></div>`}</div></div>`;
  }

  function detalheDemanda(d, i){
    const ck = C.checklistTriagem(d, i), v = C.triagemVigente(d, i.id), R = C.param(d, 'R17') || {}, dica = id => ((R.itens || []).find(x => x.id === id) || {}).dica;
    const e = i.estimativaInformada, obj = i.objetivoEstrategicoId && byId(d.objetivosEstrategicos, i.objetivoEstrategicoId);
    const valor = x => x.id === 'T6' ? (e ? `${fmt.n(e.valor, e.valor % 1 ? 1 : 0)} ${esc(String(e.unidade || '').toLowerCase())}${e.custo != null ? ' · custo ' + fmt.mi(e.custo) : ''}` : vtxt(null))
      : x.id === 'T3' && obj ? `${esc(obj.id)} · ${esc(obj.nome)}` : x.id === 'T1' && i.triagem && i.triagem.nota ? `${vtxt(x.valor)} <small>${esc(i.triagem.nota)}</small>` : vtxt(x.valor);
    const f = triForm.id === i.id ? triForm : { vals:{}, erros:{} }, vals = f.vals, ers = f.erros;
    const tec = (d.comunidades || []).filter(c => c.tipo === 'TECNICA').map(c => 'Comunidade Técnica ' + c.id);
    const sugestoes = [`ITSM/ADO da ${i.squadId || i.comunidadeId}`, ...tec, ...(d.iniciativas || []).filter(x => x.ativo !== false && x.id !== i.id && x.statusId !== 'DEMANDA').map(x => x.id)];
    const origem = `<code>${esc(i.linkOperacional || '—')}</code> <span style="display:inline-block;cursor:not-allowed" title="link fictício (domínio .invalid, reservado)"><button class="btn btn-ghost btn-sm" disabled aria-disabled="true">${icon('arrow', 13)} Abrir registro de origem</button></span>`;
    return `<div class="card stack" style="gap:12px"><div><div class="eyebrow">Demanda ${esc(i.id)} · espelho do registro de origem</div><h3 style="font-size:19px;margin:4px 0">${esc(i.titulo)}</h3>
        <div class="row" style="font-size:12.5px"><span class="dim">Entrada ${fmt.date(i.dataEntrada)} · ${fmt.n(C.idadeDemanda(d, i))} dias</span>${linkFicha(i.id, 'ficha completa')}</div><div class="row" style="margin-top:6px">${origem}</div></div>
      <div><div class="row" style="margin-bottom:6px"><b>Checklist</b>${B('R17')}<span class="dim" style="font-size:12.5px">pergunta · campo que comprova · valor no registro</span></div>
        <div class="pf1-cklist">${ck.map(x => `<div><b>${x.id}</b><span>${esc(x.pergunta)}${dica(x.id) ? `<small>${esc(dica(x.id))}</small>` : ''}<small><code>${esc(x.campo)}</code></small></span><span class="v">${valor(x)}</span></div>`).join('')}</div></div>
      ${v ? `${feedbackTriagem(d, v)}<p class="dim" style="margin:0;font-size:12.5px">Para trocar esta recomendação, use “Corrigir triagem”: a correção é um novo registro que aponta para o anterior.</p>`
      : `<form class="pf1-form" data-n1-tri="${esc(i.id)}" novalidate>
        ${campo('Saída recomendada *', `<select class="select" name="saida"><option value="">Escolha…</option>${C.TRIAGEM.map(s => opt(s, nomeTipo(d, s), vals.saida)).join('')}</select>`, ers, 'saida')}
        ${campo('Destino ou vínculo', `<input class="input" name="destino" list="pf1-dest" value="${esc(vals.destino || '')}" placeholder="destino ou código da iniciativa"><datalist id="pf1-dest">${sugestoes.map(s => `<option value="${esc(s)}">`).join('')}</datalist><small class="dim">Obrigatório para redirecionar, encaminhar e arquivar.</small>`, ers, 'destino')}
        ${campo('Justificativa * (mínimo 20 caracteres)', `<textarea class="input" name="just" rows="3">${esc(vals.just || '')}</textarea>`, ers, 'just', true)}
        ${campo('Quem registra *', `<select class="select" name="papel">${papeis(d).map(p => opt(p, p, vals.papel || papeis(d)[0])).join('')}</select>`, ers, 'papel')}
        ${campo(`Instância que decide ${B('R38')}`, `<span class="pf1-box" style="font-size:13px">${esc(instTriagem(d))}</span>`, ers, 'inst')}
        <div class="full row"><span class="dim" style="font-size:12.5px">A saída sugerida pelo sistema aparece só depois do registro.</span><span class="spacer"></span><button type="submit" class="btn btn-primary btn-sm">Registrar recomendação</button></div></form>`}</div>`;
  }

  function enviarTriagem(form, d){
    const fd = new FormData(form), get = k => String(fd.get(k) ?? '').trim(), id = form.dataset.n1Tri, i = byId(d.iniciativas, id); if(!i) return;
    const vals = { saida:get('saida'), destino:get('destino'), just:get('just'), papel:get('papel') }, erros = {};
    if(!C.TRIAGEM.includes(vals.saida)) erros.saida = PF.msgHtml('REQUIRED', { campo:'a saída recomendada' });
    if(vals.just.length < 20) erros.just = PF.msgHtml('JUSTIFICATIVA', { min:20 });
    if(!vals.papel) erros.papel = PF.msgHtml('REQUIRED', { campo:'quem registra' });
    if(COM_DESTINO.includes(vals.saida) && !vals.destino) erros.destino = PF.msgHtml('REQUIRED', { campo:'o destino ou vínculo' });
    if(vals.saida === 'ARQUIVAR' && vals.destino && (!byId(d.iniciativas, vals.destino.toUpperCase()) || vals.destino.toUpperCase() === id)) erros.destino = PF.msgHtml('VALIDATION_ERROR', { texto:'No arquivamento, informe o código de outra iniciativa, a redundante (ex.: E01).' });
    if(Object.keys(erros).length){ triForm = { id, vals, erros }; PF.refresh(); return; }
    const { dec, efeito } = registrarTriagem(d, i, vals); triForm = { id:null, vals:{}, erros:{} };
    st1().ultimaTriagem = dec.id; PF.save();
    PF.toast(efeito.ok ? `[SIMULAÇÃO] Recomendação <b>${esc(dec.id)}</b> registrada para ${esc(i.id)}.` : `[SIMULAÇÃO] Recomendação <b>${esc(dec.id)}</b> registrada, mas o efeito simulado não foi aplicado: ${esc((efeito.errors[0] || {}).msg || 'cadastro inválido')}`); PF.refresh();
  }
  /** Grava a recomendação (append-only) e o efeito simulado "se a instância acatar", com histórico. */
  function registrarTriagem(d, i, v){
    const extra = v.saida === 'ARQUIVAR' ? { vinculoIniciativaId:v.destino.toUpperCase() } : v.destino ? { destino:v.destino } : {};
    const dec = PF.append('decisoes', Object.assign({ iniciativaId:i.id, tipoDecisao:v.saida, tipoRitoForum:'TRIAGEM', forumId:null, nivel:1, decididoEm:hoje(),
      decisao:`Recomendação de triagem: ${nomeTipo(d, v.saida)}${v.destino ? ' → ' + (extra.vinculoIniciativaId ? 'vínculo com ' + extra.vinculoIniciativaId : v.destino) : ''}`,
      justificativa:v.just, responsavel:v.papel, papelRegistrante:v.papel, instancia:instTriagem(d), recomendacao:true }, extra));
    const J = `[SIMULAÇÃO] Efeito da triagem ${dec.id}, se a instância acatar`; let efeito = { ok:true, errors:[] };
    if(v.saida === 'ADMITIR') efeito = PF.write('iniciativas', i.id, { statusId:'EM_ANALISE' }, { justificativa:J });
    else if(v.saida === 'DEVOLVER'){
      const falta = C.checklistTriagem(d, i).filter(x => ['T2','T3','T6'].includes(x.id) && !x.ok)[0], cmp = falta ? ({ T2:'patrocinador', T3:'objetivoEstrategicoId', T6:'estimativaInformada' })[falta.id] : 'outro';
      const prazo = new Date(Date.parse(C.ref(d) + 'T00:00:00Z') + 30 * 864e5).toISOString().slice(0, 10);
      const p = PF.append('pendencias', { iniciativaId:i.id, tipo:'CAMPO_VAZIO', campo:cmp, descricao:`Devolvida na triagem ${dec.id}: ${v.just}`, responsavel:i.responsavel || v.papel, prazo, status:'ABERTA', origemDecisaoId:dec.id });
      PF.append('historico', { entidade:'pendencias', entidadeId:p.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:p.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:J });
    } else efeito = PF.write('iniciativas', i.id, { ativo:false }, { justificativa:J });
    return { dec, efeito };
  }

  function abaRegistro(el, d, tri, vig){
    const corrs = (d.decisoes || []).filter(x => x.tipoDecisao === 'CORRECAO_REGISTRO' && tri.some(t => t.id === x.refDecisaoAnteriorId)), corrPor = {};
    corrs.forEach(x => corrPor[x.refDecisaoAnteriorId] = x.id);
    const rows = tri.concat(corrs).map(x => Object.assign({ _q:String(x.registradoEm || x.decididoEm || '') }, x)).sort((a, b) => b._q.localeCompare(a._q));
    const foi = id => (PF.base.iniciativas || []).some(i => i.id === id && i.statusId === 'DEMANDA') || tri.some(t => t.iniciativaId === id);
    const orfas = (d.iniciativas || []).filter(i => foi(i.id) && !C.triagemVigente(d, i.id) && (i.ativo === false || i.statusId !== 'DEMANDA'));
    const cf = corrForm.id && vig.has(corrForm.id) ? byId(d.decisoes, corrForm.id) : null;
    el.innerHTML = (orfas.length ? ui.callout('atencao', `<p>Fora da fila sem recomendação vigente (correção feita em outra tela): ${orfas.map(i => `<b>${esc(i.id)}</b> <button class="btn btn-ghost btn-sm" data-n1-reativar="${esc(i.id)}">Devolver à fila</button>`).join(' ')}</p>`) : '')
      + (cf ? `<div class="card stack" style="margin-bottom:16px;gap:10px"><div class="eyebrow">Corrigir triagem · ${esc(cf.id)} · ${esc(cf.iniciativaId)}</div>
        <p class="muted" style="margin:0">A correção é um novo registro (<span title="CORRECAO_REGISTRO">correção de registro</span>) que aponta para ${esc(cf.id)}. A demanda volta à fila (reativada, na fase Demanda) para uma nova recomendação.</p>
        <form class="pf1-form" data-n1-corr="${esc(cf.id)}" novalidate>${campo('Justificativa da correção * (mínimo 20 caracteres)', `<textarea class="input" name="just" rows="2">${esc(corrForm.vals.just || '')}</textarea>`, corrForm.erros, 'just', true)}
          ${campo('Quem registra *', `<select class="select" name="papel">${papeis(d).map(p => opt(p, p, corrForm.vals.papel || papeis(d)[0])).join('')}</select>`, corrForm.erros, 'papel')}
          <div class="row" style="align-self:end;justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-n1-corr-cancel>Cancelar</button><button type="submit" class="btn btn-primary btn-sm">Registrar correção</button></div></form></div>` : '')
      + ui.table({ id:'n1reg', rows, empty:'Nenhuma recomendação de triagem registrada ainda.', cols:[
        { key:'_q', label:'Registro', fmt:(v, r) => `<b>${esc(r.id)}</b><small>${esc(fmt.date(String(r.decididoEm || v).slice(0, 10)))}</small>` },
        { key:'iniciativaId', label:'Demanda', fmt:v => linkFicha(v) },
        { key:'tipoDecisao', label:'Recomendação', fmt:(v, r) => v === 'CORRECAO_REGISTRO' ? `Correção<small>corrige ${esc(r.refDecisaoAnteriorId)} (${esc(r.tipoDecisaoCorrigido || '')})</small>` : `${esc(nomeTipo(d, v))}${destinoTxt(r) ? `<small>${esc(destinoTxt(r))}</small>` : ''}` },
        { key:'justificativa', label:'Justificativa', fmt:(v, r) => `${r.simulacao ? '<b class="lime">[SIMULAÇÃO]</b> ' : ''}${esc(v || '')}` },
        { key:'papelRegistrante', label:'Quem registra → instância', fmt:(v, r) => `${esc(v || '—')}<small>recomendação → ${esc(r.instancia || '—')}</small>` },
        { key:'_s', label:'Situação', sortVal:r => vig.has(r.id) ? 0 : 1, fmt:(v, r) => r.tipoDecisao === 'CORRECAO_REGISTRO' ? '<span class="pill tone-info">Correção</span>' : vig.has(r.id) ? ui.pill('Vigente', 'ok') : `${ui.pill('Corrigida', 'warn')}<small>por ${esc(corrPor[r.id] || '—')}</small>` },
        { key:'_a', label:'', sort:false, fmt:(v, r) => r.tipoDecisao !== 'CORRECAO_REGISTRO' && vig.has(r.id) ? `<button class="btn btn-ghost btn-sm" data-n1-corr-abrir="${esc(r.id)}">${icon('edit', 13)} Corrigir triagem</button>` : '' }] })
      + `<p class="dim" style="font-size:12.5px;margin-top:10px">Append-only: nada se apaga. Imutabilidade simulada no navegador; a garantia real é do banco. ${B('R06')}</p>`;
  }

  function cliqueTriagem(e, d){
    const t = e.target;
    if(t.closest('[data-n1-ult-fechar]')){ delete st1().ultimaTriagem; PF.save(); PF.refresh(); return; }
    const ca = t.closest('[data-n1-corr-abrir]'); if(ca){ corrForm = { id:ca.dataset.n1CorrAbrir, vals:{}, erros:{} }; if(ca.tagName === 'BUTTON') PF.refresh(); return; }
    if(t.closest('[data-n1-corr-cancel]')){ corrForm = { id:null, vals:{}, erros:{} }; PF.refresh(); return; }
    const re = t.closest('[data-n1-reativar]'); if(re){ const i = byId(d.iniciativas, re.dataset.n1Reativar), p = {}; if(!i) return; if(i.statusId !== 'DEMANDA') p.statusId = 'DEMANDA'; if(i.ativo === false) p.ativo = true;
      const r = PF.write('iniciativas', i.id, p, { justificativa:`[SIMULAÇÃO] ${i.id} devolvida à fila de triagem` }); PF.toast(r.ok ? `${esc(i.id)} voltou à fila.` : esc((r.errors[0] || {}).msg || 'Não foi possível gravar.')); PF.refresh(); return; }
    const row = t.closest('[data-n1-dem]'); if(row && !t.closest('a,button,input,select,textarea')){ PF.set_ui('n1:dem', row.dataset.n1Dem); rolarDetalhe = true; PF.refresh(); }
  }
  function enviarCorrecao(form, d){
    const fd = new FormData(form), id = form.dataset.n1Corr, dec = byId(d.decisoes, id); if(!dec) return;
    const vals = { just:String(fd.get('just') ?? '').trim(), papel:String(fd.get('papel') ?? '').trim() }, erros = {};
    if(vals.just.length < 20) erros.just = PF.msgHtml('JUSTIFICATIVA', { min:20 });
    if(!vals.papel) erros.papel = PF.msgHtml('REQUIRED', { campo:'quem registra' });
    if(Object.keys(erros).length){ corrForm = { id, vals, erros }; PF.refresh(); return; }
    const corr = PF.append('decisoes', { iniciativaId:dec.iniciativaId, tipoDecisao:'CORRECAO_REGISTRO', refDecisaoAnteriorId:dec.id, tipoDecisaoCorrigido:dec.tipoDecisao, tipoRitoForum:'TRIAGEM', forumId:null, nivel:1, decididoEm:hoje(),
      decisao:`Triagem ${dec.id} corrigida: a demanda volta à fila para nova recomendação`, justificativa:vals.just, responsavel:vals.papel, papelRegistrante:vals.papel, instancia:instTriagem(d), recomendacao:true });
    const i = byId(d.iniciativas, dec.iniciativaId), p = {}, J = `[SIMULAÇÃO] Corrigir triagem ${dec.id}: demanda reativada e devolvida à fila`;
    if(i && i.statusId !== 'DEMANDA') p.statusId = 'DEMANDA'; if(i && i.ativo === false) p.ativo = true;
    const r = i && Object.keys(p).length ? PF.write('iniciativas', i.id, p, { justificativa:J }) : { ok:true };
    (d.pendencias || []).filter(x => x.origemDecisaoId === dec.id && x.status !== 'RESOLVIDA').forEach(x => PF.write('pendencias', x.id, { status:'RESOLVIDA', resolvidaEm:hoje() }, { justificativa:J }));
    corrForm = { id:null, vals:{}, erros:{} }; if(st1().ultimaTriagem === dec.id){ delete st1().ultimaTriagem; PF.save(); }
    PF.toast(r.ok ? `[SIMULAÇÃO] Correção <b>${esc(corr.id)}</b> registrada; ${esc(dec.iniciativaId)} voltou à fila.` : esc((r.errors[0] || {}).msg || 'Correção registrada, mas a demanda não pôde ser reativada.'));
    PF.set_ui('n1:dem', dec.iniciativaId); PF.refresh();
  }

  /* ================================================================== MAPA DA FE */
  function telaMapa(el, ctx){
    marcar('mapa');
    const d = ctx.dados, q = ctx.route.query.aba, aba = ['estrutura','pool','foruns','fronteira'].includes(q) ? q : 'estrutura';
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 1 · Ler o portfólio', title:'Mapa da FE', sub:'Somente leitura. Estrutura, Pool, fóruns e fronteira do sistema como aparecem na proposta do deck A&M v25: a FEG ainda valida. Cada quadro traz o seu rótulo.' })
      + meta(d) + ui.tabs('#/n1/mapa', [['estrutura','Estrutura'],['pool','Pool e papéis'],['foruns','Fóruns'],['fronteira','Fronteira']], aba) + '<div data-n1-aba></div>';
    const host = el.querySelector('[data-n1-aba]');
    host.innerHTML = aba === 'pool' ? mapaPool(d) : aba === 'foruns' ? mapaForuns(d) : aba === 'fronteira' ? mapaFronteira() : mapaEstrutura(d);
  }
  function mapaEstrutura(d){
    const G = d.gerencias || [], Cm = d.comunidades || [], S = d.squads || [], Fr = d.ferramentas || [];
    const rows = Cm.map(c => ({ id:c.id, c, ger:c.gerenciaId, tipo:c.tipo, sq:S.filter(s => s.comunidadeId === c.id), fe:Fr.filter(f => f.comunidadeId === c.id) }));
    return aula('Hierarquia: Gerência → Comunidade → Squad → Ferramenta. Toda iniciativa tem gerência e comunidade; a squad é opcional, mas precisa ser da mesma comunidade. Sigla marcada como didática não é oficial.')
      + `<div class="row" style="margin:16px 0">${ui.pill(`${G.length} gerências`, 'lime')}${ui.pill(`${Cm.length} comunidades`, 'paper')}${ui.pill(`${S.length} squads`, 'paper')}${ui.pill(`${Fr.length} ferramentas no catálogo`, 'paper')}${B('R01')}${B('R02')}</div>
      <div class="grid g4">${G.map(g => { const cs = Cm.filter(c => c.gerenciaId === g.id); return `<div class="card stack" style="gap:6px"><div class="row"><span class="pf1-ger">${esc(g.sigla)}</span><span class="spacer"></span>${B('R01')}</div>
        <div>${esc(g.nomeProposto || g.nome)}</div><small class="dim">${cs.length} comunidade${cs.length === 1 ? '' : 's'} · ${S.filter(s => cs.some(c => c.id === s.comunidadeId)).length} squads${cs.some(c => c.tipo === 'TECNICA') ? ' · técnicas por premissa (R03)' : ''}</small></div>`; }).join('')}</div>
      <div style="margin:16px 0">${ui.callout('dica', `<p>O deck propõe uma <b>matriz equilibrada</b> (s8–s12): gerências de área com comunidades de entrega, e comunidades técnicas que atravessam as gerências (s13). ${PROP('s8–s12, s13')} O vínculo das comunidades técnicas à FEG é premissa a validar ${B('R03')}.</p>`)}</div>
      ${ui.table({ id:'n1estr', rows, cols:[
        { key:'ger', label:'Gerência', fmt:v => `<b>${esc(v)}</b>` },
        { key:'id', label:'Comunidade', fmt:(v, r) => `<b>${esc(v)}</b> · ${esc(r.c.nome)}<small>${r.c.siglaDidatica ? 'sigla didática, não oficial' : r.c.siglaDeck ? 'sigla no deck: ' + esc(r.c.siglaDeck) : 'sigla do deck'}${r.c.lideranca ? ' · liderança ' + esc(r.c.lideranca) : ''}</small>` },
        { key:'tipo', label:'Tipo', fmt:v => v === 'TECNICA' ? `Técnica ${B('R03')}` : 'Entrega' },
        { key:'sq', label:'Squads', sortVal:r => r.sq.length, fmt:v => v.length ? v.map(s => `${esc(s.id)} <span class="dim">${esc(s.nome)}</span>`).join('<br>') : '<span class="dim">—</span>' },
        { key:'fe', label:'Ferramentas (vínculo de catálogo)', sortVal:r => r.fe.length, fmt:v => v.length ? esc(v.map(f => f.nome).join(', ')) : '<span class="dim">—</span>' }] })}
      <p class="dim" style="font-size:12.5px;margin-top:10px">Siglas didáticas ${DFP('Siglas didáticas da trilha, não oficiais')} servem só para o exercício. As ferramentas aparecem como vínculo de catálogo: status e números das iniciativas são fictícios.</p>`;
  }
  function mapaPool(d){
    const pool = (PF.regra('R41') || {}).valor || [], pap = (PF.regra('R42') || {}).valor || [];
    const cob = [{ label:'HCs de PMO propostos (s111–s118)', value:4, color:'lime' }, { label:'Analistas no exercício', value:3, color:'paper' }];
    return aula('O Pool de Recursos de Governança é proposta do deck (s56/s57): blocos que atendem a FE inteira, em atuação transversal. Os papéis de aprendizagem do Afinação FEG são outra coisa: servem para dividir o estudo entre vocês.')
      + `<div class="grid g2" style="margin-top:16px;align-items:start"><div class="card stack" style="gap:10px">${ui.section('Quadro 1 · Pool de Recursos de Governança', 'Organograma proposto (s56/s57) · atuação transversal')}<div class="row">${B('R41')}</div>
          <div class="stack" style="gap:6px">${pool.map(p => `<div class="pf1-box"><b>${esc(p)}</b><small class="dim">atuação transversal</small></div>`).join('')}</div>
          <div class="pf1-box"><b>Cobertura proposta de PMO ${PROP('s111–s118')}</b><span class="muted" style="font-size:13px">4 HCs para 4 carteiras (Elétricas, Energéticas, Recursos e Carga, Técnicas), contra 3 analistas no exercício.</span>
          <div style="margin-top:8px">${PF.charts.hbar(cob, { max:5, fmt:v => fmt.n(v) })}</div>
          <table class="pf1-kv" style="margin-top:8px"><tbody>${cob.map(c => `<tr><td>${esc(c.label)}</td><td class="num">${c.value}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="card stack" style="gap:10px">${ui.section('Quadro 2 · Papéis de aprendizagem (Afinação FEG)', 'Artefato interno, não consta no deck')}<div class="row">${B('R42')}</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Papel de aprendizagem</th><th>Naipes</th></tr></thead><tbody>${pap.map(p => `<tr><td>${esc(p.papel)}</td><td>${esc((p.naipes || []).join(' + '))}</td></tr>`).join('')}</tbody></table></div>
          ${ui.callout('atencao', '<p>INST/REG são atribuições da FEG (s63) e do Analista de Planejamento e Estratégia (s73), não um bloco do Pool.</p>')}
          <p class="muted" style="margin:0">Alocação das 3 analistas aos papéis: a validar ${AVF('Alocação das analistas aos papéis de aprendizagem (a validar)')}.</p></div></div>
      <p class="dim" style="font-size:12.5px;margin-top:12px">A tabela de RACI (“Quem decide”) fica no Nível 2, no Exercício de Gate.</p>`;
  }
  function mapaForuns(d){
    const a = (PF.regra('R05a') || {}).valor || {}, conf = (PF.regra('R05b') || {}).valor || [];
    const per = nome => { const c = conf.find(x => x.forum === nome); return c ? `<b class="tone-warn">em conflito</b> ${B('R05b')}<small>${esc(c.fonteA)} × ${esc(c.fonteB)}</small>` : '—'; };
    const F = [
      { nome:'Fórum Estratégico', s:'s126', nivel:'estratégico', per:per('Estratégico'), resp:'conferir no slide original', saidas:'conferir no slide original', b:PROP('s126') },
      { nome:'Fórum de Planejamento do Portfólio', s:'s127', nivel:'tático (portfólio)', per:per('Planejamento do Portfólio'), resp:'FEG coordena; tomadores de decisão no s205: Diretores/GEs (deliberação a validar)', saidas:'carteira balanceada e diretrizes de capacidade do ciclo', b:PROP('s127, s205') },
      { nome:'Fórum de Planejamento e Evolução', s:'s128', nivel:'tático (evolução)', per:per('Planejamento e Evolução'), resp:'conferir no slide original', saidas:'mapa de dependências e registro de decisões de priorização', b:PROP('s128') },
      { nome:'Fórum de Acompanhamento de Portfólio', s:'s129', nivel:'tático-operacional', per:esc(a.periodicidade || 'mensal'), resp:esc(a.coordenacao || 'FEG'), saidas:'painel de status, registro de riscos e desvios, histórico de escalonamentos', b:B('R05a') }];
    return aula('Fórum é o ritmo da decisão. O de Acompanhamento (mensal, proposta s129) usa o que o Nível 1 prepara: sinal, riscos e pauta por exceção. Quando duas fontes do deck discordam, o app mostra as duas e não escolhe.')
      + `<div class="tbl-wrap" style="margin-top:16px"><table class="tbl"><thead><tr><th>Fórum</th><th>Nível (inferido)</th><th>Periodicidade</th><th>Responsável</th><th>Saídas</th><th>Rótulo</th></tr></thead><tbody>
        ${F.map(f => `<tr><td><b>${esc(f.nome)}</b><small>${esc(f.s)}</small></td><td>${esc(f.nivel)}</td><td>${f.per}</td><td>${f.resp}</td><td>${esc(f.saidas)}</td><td>${f.b}</td></tr>`).join('')}</tbody></table></div>
      <ul class="pf1-ul" style="margin-top:12px"><li>O nível de cada fórum é inferência do layout do s125: conferir no slide original.</li><li>s130–s131 não são reproduzidos nesta versão: conferir no deck.</li>
        <li>Os fóruns do app levam o prefixo [Simulado]: são exercício, não fórum real.</li></ul>`;
  }
  function mapaFronteira(){
    const fora = [['Tarefas e sprints','ADO, Jira ou GitHub Projects'], ['Chamados e incidentes','ITSM'], ['Contratos e execução financeira','ERP']];
    return aula('O portfólio decide o que fazer; a execução acontece no ADO, Jira, GitHub Projects ou ITSM. O app recebe dados consolidados e o link do registro de origem, nunca tarefas.')
      + `<div class="card" style="margin-top:16px"><div class="pf1-flow"><div class="stack" style="gap:8px">${fora.map(([o, f]) => `<div class="pf1-box"><b>${esc(f)}</b><span class="muted" style="font-size:13px">${esc(o)}</span></div>`).join('')}</div>
        <div class="pf1-arr">${icon('arrow', 22)}<span>dados consolidados<br>+ link de origem</span></div>
        <div class="pf1-box hl"><b>Portfólio FEG (este app)</b><span class="muted" style="font-size:13px">Iniciativas, sinal calculado, pendências, decisões e fotografias de fórum.</span></div></div></div>
      <div class="tbl-wrap" style="margin-top:16px"><table class="tbl"><thead><tr><th>O que fica fora do app</th><th>Onde fica</th><th>O que o app recebe</th></tr></thead><tbody>
        ${fora.map(([o, f]) => `<tr><td>${esc(o)}</td><td>${esc(f)}</td><td>dado consolidado e link ao registro de origem</td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:12px">${B('R06')}<span class="muted" style="font-size:13px">Princípio do repositório: o sistema não substitui as ferramentas de execução. Links fictícios usam o domínio reservado <code>.invalid</code> e ficam desabilitados.</span></div>`;
  }

  /* ================================================================== DASHBOARD (aba Execução · N1) */
  const MISSOES = [['Gestão de Portfólio/PMO','Montar o rascunho de pauta por exceção e o resumo de 5 linhas.'],
    ['Governança, Riscos e Conformidade','Achar no histórico a alteração sem justificativa (E02, 28/09), os status fora do catálogo (R3, R6) e o registro corrigido DEC-004 → DEC-005.'],
    ['Contratos e Fornecedores','Explicar gasto × progresso de E02 e E05; ligar R2 ao fornecedor Alfa.'],
    ['Estratégia e Inovação','Tratar E04 sem objetivo; ler a pausa formal de H01 (Gate 2) e o seu gatilho.'],
    ['Interface institucional e regulatória','Conferir a evidência de E03 e a ausência dela em D2.']];
  PF.registerDash({ id:'n1-roteiro', nivel:1, ordem:5, render(){
    if(PF.levelDone(1)) return '';
    const r = st1().roteiro || {}, feitos = PASSOS.filter(p => r[p[0]]).length;
    return `<div class="card stack" style="gap:12px">${ui.section('Roteiro da Partitura', `${feitos} de ${PASSOS.length} etapas visitadas. O roteiro some quando o nível for concluído.`)}
      <ol class="pf1-steps">${PASSOS.map(([k, t, h], n) => `<li class="${r[k] ? 'ok' : ''}"><a href="${h}" data-n1-passo="${k}"><span class="n">${r[k] ? '✓' : n + 1}</span>${esc(t)}</a></li>`).join('')}</ol>
      <details class="pf1-det"><summary>Missões por papel</summary><div class="row" style="margin-bottom:8px">${B('R42')}<span class="dim" style="font-size:12.5px">Papéis de aprendizagem do Afinação, a validar. Não contam nota.</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Papel</th><th>Missão no Nível 1</th></tr></thead><tbody>${MISSOES.map(([p, m]) => `<tr><td>${esc(p)}</td><td>${esc(m)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
  } });

  const kcard = (k, label, valor, sub, regra, extra = '') => `<div class="card kpi pf1-kpi"><div class="lbl"><span>${esc(label)}</span>${B(regra)}</div><div class="val">${valor}</div><div class="sub">${sub}</div>${extra}<a class="btn-text" href="#/indicadores?k=${k}">ficha do indicador →</a></div>`;
  PF.registerDash({ id:'n1-cards', nivel:1, ordem:10, render(d0, g){
    const d = recorte(d0, g), A = C.emExecucao(d), p = C.pctOrcamentoVermelho(d), dv = C.desvios(d), cp = C.completude(d), ra = C.riscosAbertos(d), id = C.idadeDemandas(d);
    return `${g ? `<p class="dim" style="margin:0 0 10px;font-size:12.5px">Recorte: gerência <b>${esc(g)}</b>.</p>` : ''}<div class="grid g3">
      ${kcard('I1.1', 'Em execução', fmt.n(A.length), '<span title="EM_EXECUCAO">ativas na fase Em execução</span>', 'R06')}
      ${kcard('I1.4', '% do orçamento em sinal vermelho', pc(p.valor), `${pc(p.porContagem)} por contagem`, 'R13', `<div>${DIDAT}</div>`)}
      ${kcard('I1.7', 'Desvio mediano de prazo', dv.mediana == null ? 'n/d' : `${nn(dv.mediana)}<small>${mes(dv.mediana)}</small>`, dv.media == null ? 'sem iniciativa com baseline' : `média ${fmt.n(dv.media, 1)} · meses de calendário`, 'R14')}
      ${kcard('I1.10', 'Completude cadastral', pc(cp.pct), `${fmt.n(cp.preenchidos)} de ${fmt.n(cp.total)} campos`, 'R10b')}
      ${kcard('I1.15', 'Riscos e impedimentos abertos', fmt.n(ra.length), `${ra.filter(r => r.vencido).length} vencido${ra.filter(r => r.vencido).length === 1 ? '' : 's'}`, 'R09')}
      ${kcard('I1.11', `Demandas com mais de ${id.limiar} dias`, fmt.n(id.acima.length), id.mediana == null ? 'sem demandas na fila' : `mediana ${fmt.n(id.mediana)} dias`, 'R16')}</div>`;
  } });

  PF.registerDash({ id:'n1-sinal', nivel:1, ordem:20, largura:'meia', titulo:'Sinal calculado', sub:'Por contagem e por valor (R$ mi) das iniciativas em execução.', render(d0, g){
    const d = recorte(d0, g), A = C.emExecucao(d), s = C.sinais(d, A); if(!A.length) return '<p class="muted">Nenhuma iniciativa em execução neste recorte.</p>';
    const bt = C.soma(A, i => C.bac(d, i)), lin = ['VERMELHO','AMARELO','VERDE','CINZA'].map(k => { const ids = s.filter(x => x.cor === k).map(x => x.id); return { k, n:ids.length, ids, b:C.soma(ids, x => C.bac(d, x)) }; });
    return `<div class="row" style="margin-bottom:10px">${B('R13')}${DIDAT}</div>${PF.charts.stack(lin.map(x => ({ label:nomeCor(x.k), value:x.n, color:SIN[x.k][1] })))}
      <div style="margin:14px 0">${PF.charts.hbar(lin.map(x => ({ label:nomeCor(x.k) + ' (R$ mi)', value:x.b, color:SIN[x.k][1] })), { fmt:v => n2(v) })}</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Sinal</th><th class="r">Nº</th><th class="r">% nº</th><th class="r">R$ mi</th><th class="r">% R$</th><th>Iniciativas</th></tr></thead><tbody>
      ${lin.map(x => `<tr><td>${pillCor(x.k)}</td><td class="r num">${x.n}</td><td class="r num">${pc(C.div(x.n, A.length))}</td><td class="r num">${n2(x.b)}</td><td class="r num">${pc(C.div(x.b, bt))}</td><td>${x.ids.map(id => linkFicha(id)).join(', ') || '—'}</td></tr>`).join('')}</tbody></table></div>`;
  } });

  PF.registerDash({ id:'n1-prazos', nivel:1, ordem:30, largura:'meia', titulo:'Prazos 30/60/90', sub:'Iniciativas em execução pela data prevista atual.', render(d0, g){
    const d = recorte(d0, g), h = C.horizontes(d), ks = Object.keys(h.contagem); if(!h.itens.length) return '<p class="muted">Nenhuma iniciativa em execução neste recorte.</p>';
    return `<div class="row" style="margin-bottom:6px">${B('R08')}<span class="dim" style="font-size:12.5px">dias corridos até a data prevista; a referência cai na faixa de 30</span></div>
      ${PF.charts.bars(ks.map(k => FX[k] || k), [{ name:'Em execução', values:ks.map(k => h.contagem[k]), color:'lime' }], { height:200, max:maxContagem(h.contagem) })}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Faixa</th><th class="r">Nº</th><th>Iniciativas (dias)</th></tr></thead><tbody>
      ${ks.map(k => { const it = h.itens.filter(x => x.faixa === k); return `<tr><td>${esc(FX[k] || k)}</td><td class="r num">${h.contagem[k]}</td><td>${it.map(x => `${linkFicha(x.id)}${x.dias != null ? ` <span class="dim">${fmt.n(x.dias)} d</span>` : ''}`).join(', ') || '—'}</td></tr>`; }).join('')}</tbody></table></div>`;
  } });

  PF.registerDash({ id:'n1-mix', nivel:1, ordem:40, largura:'meia', titulo:'Mix por categoria', sub:'Contagem e valor contam histórias diferentes.', render(d0, g){
    const d = recorte(d0, g), m = C.mixCategoria(d); if(!m.total) return '<p class="muted">Nenhuma iniciativa em execução neste recorte.</p>';
    const cats = (d.categorias || []).map(c => c.codigo).concat(Object.keys(m.contagem).filter(k => !(d.categorias || []).some(c => c.codigo === k)));
    const nome = k => ((d.categorias || []).find(c => c.codigo === k) || {}).nome || (k === 'SEM_CATEGORIA' ? 'Sem categoria' : k);
    return `<div class="row" style="margin-bottom:6px">${B('R12')}${B('R37')}</div>
      ${PF.charts.bars(cats.map(nome), [{ name:'% da contagem', values:cats.map(k => (m.pctContagem[k] || 0) * 100), color:'lime' }, { name:'% do valor (R$)', values:cats.map(k => (m.pctValor[k] || 0) * 100), color:'info' }], { height:200, max:100, fmt:v => fmt.n(v) + '%' })}
      <div class="tbl-wrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Categoria</th><th class="r">Nº</th><th class="r">% nº</th><th class="r">R$ mi</th><th class="r">% R$</th></tr></thead><tbody>
      ${cats.map(k => `<tr><td>${esc(nome(k))}</td><td class="r num">${m.contagem[k] || 0}</td><td class="r num">${pc(m.pctContagem[k] || 0)}</td><td class="r num">${n2(m.valor[k] || 0)}</td><td class="r num">${pc(m.pctValor[k] || 0)}</td></tr>`).join('')}</tbody></table></div>`;
  } });

  PF.registerDash({ id:'n1-agir', nivel:1, ordem:50, largura:'meia', titulo:'Onde agir', sub:'Exceções na ordem de leitura: vermelhas → divergências → Cinza → riscos vencidos → bloqueios por vermelha → demandas envelhecidas.', render(d0, g){
    const d = recorte(d0, g), s = C.sinais(d), it = [], idd = C.idadeDemandas(d);
    s.filter(x => x.cor === 'VERMELHO').forEach(x => it.push(['Vermelha', 'bad', x.id, x.motivo]));
    s.filter(x => x.divergente).forEach(x => it.push(['Divergência', 'warn', x.id, `declarado ${nomeCor(x.declarado)} × calculado ${nomeCor(x.cor)}: registre a pendência`]));
    s.filter(x => x.cor === 'CINZA').forEach(x => it.push(['Cinza', 'dim', x.id, x.motivo]));
    C.riscosAbertos(d).filter(r => r.vencido).forEach(r => it.push(['Risco vencido', 'bad', r.iniciativaId, `${r.id} · ${r.descricao} · prazo ${fmt.date(r.prazo)}`]));
    C.bloqueios(d).filter(b => b.porVermelha).forEach(b => it.push(['Bloqueio por vermelha', 'warn', b.bloqueada, `${b.bloqueada} é bloqueada por ${b.por} (${b.dependenciaId})`]));
    idd.lista.filter(x => x.dias > idd.limiar).forEach(x => it.push([`Demanda com mais de ${idd.limiar} dias`, 'info', x.id, `${x.dias} dias aguardando triagem`]));
    return `<div class="row" style="margin-bottom:10px">${B('R13')}${B('R09')}${B('R16')}${DIDAT}</div>` + (it.length ? `<ol class="pf1-agir">${it.map(([c, t, id, m]) => `<li><span class="pill tone-${t}">${esc(c)}</span> ${linkFicha(id)}<span class="muted">${esc(m)}</span></li>`).join('')}</ol>`
      : '<p class="muted">Nada fora da tolerância neste recorte.</p>');
  } });

  PF.registerDash({ id:'n1-pauta', nivel:1, ordem:60, render(d){ return blocoPauta(d); } });
  function blocoPauta(d){
    const fr = byId(d.foruns, 'FR-OUT'); if(!fr) return '';
    const A = C.emExecucao(d), dr = PF.ui_state('n1:pauta', null), sel = dr ? dr.itens : (fr.pautaItens || []), obs = dr ? dr.obs : (fr.observacoes || ''), nl = linhasTxt(obs);
    return `<div class="card stack" data-n1-pauta style="gap:12px">${ui.seloExercicio()}${ui.section('Rascunho da pauta · ' + fr.nome, `Data de corte ${fmt.date(fr.dataCorte)} · em preparação · grava em foruns (${esc(fr.id)}) com histórico`)}
      <p class="muted" style="margin:0">Há 30 minutos para discussão aprofundada de <b>no máximo 2</b> iniciativas ${ILU()}. Marque quem entra e escreva um resumo de até 5 linhas ${ILU()} para o fórum ${B('R05a')}.</p>
      <div class="pf1-pauta">${A.map(i => { const s = C.sinal(d, i), on = sel.includes(i.id); return `<label class="pf1-op ${on ? 'on' : ''}"><input type="checkbox" data-n1-pauta-item="${esc(i.id)}" ${on ? 'checked' : ''}><b>${esc(i.id)}</b>${pillCor(s.cor, s.motivo)}<span class="dim" style="font-size:12.5px">BAC ${n2(C.bac(d, i))} · desvio ${s.desvio == null ? 'n/d' : s.desvio}</span><small>${esc(curto(i.titulo, 80))}</small></label>`; }).join('')}</div>
      <label class="field">Resumo para o fórum (até 5 linhas)<textarea class="input" rows="5" data-n1-pauta-obs placeholder="Uma linha por ponto; cite as iniciativas pelo código.">${esc(obs)}</textarea><small data-n1-pauta-cont class="${nl > 5 ? 'tone-bad' : 'dim'}">${nl} de 5 linhas</small></label>
      <div class="row"><button class="btn btn-primary btn-sm" data-n1-pauta-salvar>${icon('check', 14)} Salvar rascunho</button>${dr ? '<span class="tone-warn" style="font-size:12.5px">alterações ainda não salvas</span>' : ''}
        <span class="dim" style="font-size:12.5px">Gravado: ${(fr.pautaItens || []).length ? esc(fr.pautaItens.join(', ')) : 'nenhum item'} · ${linhasTxt(fr.observacoes)} linha(s). O Nível 2 retoma este rascunho na pauta do Fórum Mensal.</span></div></div>`;
  }
  const pautaLer = box => ({ itens:Array.from(box.querySelectorAll('[data-n1-pauta-item]')).filter(x => x.checked).map(x => x.dataset.n1PautaItem), obs:(box.querySelector('[data-n1-pauta-obs]') || {}).value || '' });
  document.addEventListener('change', e => { const cb = e.target.closest('[data-n1-pauta-item]'); if(!cb) return; const box = cb.closest('[data-n1-pauta]'), v = pautaLer(box);
    if(v.itens.length > 2){ cb.checked = false; PF.toast('No máximo 2 iniciativas cabem nos 30 minutos de discussão aprofundada.'); v.itens = v.itens.filter(x => x !== cb.dataset.n1PautaItem); }
    cb.closest('.pf1-op').classList.toggle('on', cb.checked); PF.set_ui('n1:pauta', v); });
  document.addEventListener('input', e => { const ta = e.target.closest('[data-n1-pauta-obs]'); if(!ta) return; const box = ta.closest('[data-n1-pauta]'), n = linhasTxt(ta.value), c = box.querySelector('[data-n1-pauta-cont]');
    if(c){ c.textContent = `${n} de 5 linhas`; c.className = n > 5 ? 'tone-bad' : 'dim'; } PF.set_ui('n1:pauta', pautaLer(box)); });
  function salvarPauta(box){
    if(!box) return; const v = pautaLer(box), fr = byId(PF.db().foruns, 'FR-OUT'); if(!fr) return;
    if(v.itens.length > 2){ PF.toast('No máximo 2 iniciativas na discussão aprofundada.'); return; }
    if(linhasTxt(v.obs) > 5){ PF.toast(`O resumo tem ${linhasTxt(v.obs)} linhas: o limite é 5.`); return; }
    const patch = {}; if(JSON.stringify(fr.pautaItens || []) !== JSON.stringify(v.itens)) patch.pautaItens = v.itens; if((fr.observacoes || '') !== v.obs.replace(/\s+$/, '')) patch.observacoes = v.obs.replace(/\s+$/, '');
    if(!Object.keys(patch).length){ PF.set_ui('n1:pauta', null); PF.toast('Nada mudou no rascunho.'); PF.refresh(); return; }
    const r = PF.write('foruns', 'FR-OUT', patch, { justificativa:'[SIMULAÇÃO] Rascunho de pauta por exceção do fórum simulado de outubro' });
    if(!r.ok){ PF.toast(esc((r.errors[0] || {}).msg || 'Não foi possível gravar.')); return; }
    PF.set_ui('n1:pauta', null); PF.toast('[SIMULAÇÃO] Rascunho da pauta gravado em FR-OUT, com histórico.'); PF.refresh();
  }

  /* ================================================================== INDICADORES I1.1–I1.16 (§5.3) */
  const finData = d => { const ds = (d.financeiro || []).filter(f => C.emExecucao(d).some(i => i.id === f.iniciativaId) && f.dataReferencia).map(f => f.dataReferencia).sort();
    return `Financeiro: consolidação ilustrativa de ${ds.length ? fmt.date(ds[ds.length - 1]) : '—'} · data de referência ${fmt.date(C.ref(d))} (ilustrativa) · dados de trabalho`; };
  const lista = ids => ids.length ? ids.join(', ') : 'nenhuma';
  const K = o => PF.registerKpi(Object.assign({ nivel:1 }, o));
  K({ id:'I1.1', nome:'Em execução', unidade:'nº', essencial:true, regra:['R06','R11'], valor:d => C.emExecucao(d).length, fmt:v => fmt.n(v),
    formula:'|A|, A = iniciativas ativas na fase Em execução', conta:d => { const A = C.emExecucao(d); return `${esc(lista(A.map(i => i.id)))} → <b>${A.length}</b>`; },
    interpretacao:'Tamanho da carteira ativa. É o denominador de quase todos os indicadores do Nível 1.', armadilha:'Arquivadas (ativo: não), em espera e encerradas não entram. Iniciativa fora do inventário consome capacidade sem ter sido escolhida.' });
  K({ id:'I1.2', nome:'Mix por categoria', unidade:'%', regra:['R12','R37'], valor:d => { const m = C.mixCategoria(d); if(!m.total) return null; const k = Object.keys(m.pctValor).sort((a, b) => (m.pctValor[b] || 0) - (m.pctValor[a] || 0))[0];
      return { m, k, sig:((d.categorias || []).find(c => c.codigo === k) || {}).sigla || k }; },
    fmt:x => `${esc(x.sig)} ${pc(x.m.pctValor[x.k])} do R$`,
    formula:'count(A_k) ÷ |A| e Σbac(A_k) ÷ Σbac(A), por categoria k', dataDado:finData, motivo:'Nenhuma iniciativa em execução: não há mix para medir.',
    conta:d => { const m = C.mixCategoria(d), nome = k => ((d.categorias || []).find(c => c.codigo === k) || {}).nome || (k === 'SEM_CATEGORIA' ? 'Sem categoria' : k); return `<table class="pf1-kv"><tbody>${Object.keys(m.contagem).map(k => `<tr><td>${esc(nome(k))}</td><td>${m.contagem[k]} de ${m.total} = ${pc(m.pctContagem[k])} · R$ ${n2(m.valor[k])} ÷ ${n2(m.bacTotal)} = ${pc(m.pctValor[k])}</td></tr>`).join('')}</tbody></table>`; },
    interpretacao:'Contagem e valor contam histórias diferentes: uma categoria pode ter muitas iniciativas e pouco dinheiro.', armadilha:'A taxonomia de categorias é premissa a validar (R12); “Obrigatória” pode ser categoria ou condição.' });
  K({ id:'I1.3', nome:'Distribuição do sinal', unidade:'%', regra:'R13', didatico:true, valor:d => { const x = C.distribuicaoSinal(d); return x.total ? x : null; },
    fmt:x => `${x.contagem.VERDE} V · ${x.contagem.AMARELO} A · ${x.contagem.VERMELHO} Vm · ${x.contagem.CINZA} C`, formula:'count(A, sinal = cor) ÷ |A|, com Cinza no denominador', motivo:'Nenhuma iniciativa em execução.',
    conta:d => { const x = C.distribuicaoSinal(d); return Object.keys(x.contagem).map(k => `${nomeCor(k)}: ${x.contagem[k]} ÷ ${x.total} = ${pc(x.pct[k])}`).join('<br>'); },
    interpretacao:'Retrato do momento, não nota de saúde. Não existe índice agregado de saúde do portfólio.', armadilha:'Tirar o Cinza do denominador infla as outras cores e esconde o dado faltante.' });
  K({ id:'I1.4', nome:'% do orçamento em vermelho', unidade:'%', essencial:true, regra:['R13','R37'], didatico:true, valor:d => C.pctOrcamentoVermelho(d).valor, fmt:v => pc(v), dataDado:finData,
    formula:'Σbac(A, sinal Vermelho) ÷ Σbac(A)', conta:d => { const p = C.pctOrcamentoVermelho(d), A = C.emExecucao(d);
      return `(${p.ids.map(id => n2(C.bac(d, id))).join(' + ') || '0'}) ÷ ${n2(p.denominador)} = <b>${pc(p.valor)}</b> <span class="dim">(${esc(lista(p.ids))})</span><br>Por contagem: ${p.ids.length} ÷ ${A.length} = ${pc(p.porContagem)}`; },
    interpretacao:'Quanto do dinheiro em execução está sob sinal vermelho. Dimensiona a pauta por exceção.', armadilha:'Por contagem o retrato muda: compare as duas leituras antes de concluir. O limiar do vermelho é regra didática a validar.' });
  K({ id:'I1.5', nome:'Execução orçamentária', unidade:'%', regra:'R37', valor:d => C.execucaoOrcamentaria(d).valor, fmt:v => pc(v), dataDado:finData,
    formula:'Σac(A) ÷ Σbac(A)', conta:d => { const x = C.execucaoOrcamentaria(d); return `${n2(x.ac)} ÷ ${n2(x.bac)} = <b>${pc(x.valor)}</b>`; },
    interpretacao:'Sozinho não diz nada: compare com o avanço físico e com o planejado até a data.', armadilha:'Gastar pouco pode ser eficiência ou paralisação; só o físico desfaz a dúvida.' });
  K({ id:'I1.6', nome:'Índice progresso × gasto', unidade:'índice', regra:['R37','R13'], valor:d => { const e = Object.entries(C.indices(d)).filter(x => x[1] != null).sort((a, b) => a[1] - b[1]); return e.length ? { id:e[0][0], v:e[0][1] } : null; },
    fmt:x => `${esc(x.id)} ${n2(x.v)} (menor)`, formula:'div(%físico real, AC ÷ BAC), por iniciativa de A', dataDado:finData, motivo:'Nenhuma iniciativa em execução com BAC, AC e % físico.',
    conta:d => C.emExecucao(d).map(i => { const a = C.ac(d, i), b = C.bac(d, i); return `${esc(i.id)}: ${i.percentualFisicoReal == null ? '—' : fmt.n(i.percentualFisicoReal) + '%'} ÷ (${n2(a)} ÷ ${n2(b)}) = <b>${n2(C.indice(d, i))}</b>`; }).join('<br>'),
    interpretacao:'Abaixo de 1: gastou mais do que avançou. É a prévia do CPI do Nível 2.', armadilha:'% físico é informado pelo PO; sem conferir a fonte, o índice herda o otimismo do declarado.' });
  K({ id:'I1.7', nome:'Desvio de prazo (mediana)', unidade:'meses', essencial:true, regra:'R14', valor:d => C.desvios(d).mediana, fmt:v => `${nn(v)} ${mes(v)}`, motivo:'Nenhuma iniciativa em execução com baseline (data planejada).',
    formula:'mesIdx(prevEf) − mesIdx(dataPlanejada), só com baseline; prevEf = max(data prevista, referência)', convencao:'Meses de calendário: (12 × ano + mês previsto) − (12 × ano + mês planejado). Previsão já vencida usa a data de referência (R14). Chamar de “atraso” é a validar.',
    conta:d => { const x = C.desvios(d), sem = C.emExecucao(d).filter(i => !i.dataPlanejada).map(i => i.id);
      return `${x.lista.map(y => `${esc(y.id)} ${y.desvio}`).join(' · ')}<br>Ordenados: ${x.valores.slice().sort((a, b) => a - b).join(', ')} → mediana <b>${nn(x.mediana)}</b>; média ${x.valores.join(' + ')} ÷ ${x.valores.length} = ${fmt.n(x.media, 1)}${sem.length ? `<br>Fora (sem baseline): ${esc(sem.join(', '))}` : ''}`; },
    interpretacao:'Mostre a distribuição, não só a média: um caso extremo puxa a média para cima.', armadilha:'Contar dias e dividir por 30 dá outro número; a convenção da trilha é mês de calendário.' });
  K({ id:'I1.8', nome:'% no prazo', unidade:'%', regra:['R15','R14'], valor:d => C.pctNoPrazo(d), fmt:v => pc(v), motivo:'Nenhuma iniciativa em execução com baseline.',
    formula:'count(desvio ≤ tolerância) ÷ count(com baseline); tolerância = R15', conta:d => { const v = C.desvios(d).valores, t = C.param(d, 'R15');
      return `Tolerância vigente ${t} ${mes(t)}: ${v.filter(x => x <= t).length} ÷ ${v.length} = <b>${pc(C.pctNoPrazo(d, t))}</b><br>Com tolerância ${t + 1}: ${v.filter(x => x <= t + 1).length} ÷ ${v.length} = ${pc(C.pctNoPrazo(d, t + 1))}`; },
    interpretacao:'Depende da tolerância: a mesma carteira parece pior ou melhor conforme o parâmetro.', armadilha:'A tolerância de prazo é premissa a validar (R15); declare sempre qual foi usada.' });
  K({ id:'I1.9', nome:'% vinculadas a objetivo', unidade:'%', regra:'R04', valor:d => C.pctVinculadas(d).valor, fmt:v => pc(v), motivo:'Nenhuma iniciativa em execução.',
    formula:'count(objetivoEstrategicoId ≠ vazio) ÷ |A|', conta:d => { const x = C.pctVinculadas(d); return `${x.n} ÷ ${x.total} = <b>${pc(x.valor)}</b>; sem vínculo: ${esc(lista(x.sem))}`; },
    interpretacao:'Sem vínculo com objetivo, por que a iniciativa existe? Pede pendência, não vínculo inventado.', armadilha:'Os objetivos OE-1 a OE-3 são fictícios; os reais devem vir de documento ONS (R04).' });
  K({ id:'I1.10', nome:'Completude cadastral', unidade:'%', essencial:true, regra:['R10a','R10b'], valor:d => C.completude(d).pct, fmt:v => pc(v), motivo:'Nenhuma iniciativa em execução.',
    formula:'campos de R10a + R10b preenchidos ÷ (|A| × nº de campos)', conta:d => { const x = C.completude(d), n = C.camposObrigatorios(d).length;
      return `${x.preenchidos} ÷ (${C.emExecucao(d).length} × ${n}) = <b>${pc(x.pct)}</b><br>Faltam: ${x.faltas.length ? x.faltas.map(f => `${esc(f.id)} (${esc(f.campo)})`).join(', ') : 'nada'}`; },
    interpretacao:'Pré-condição para qualquer análise: campo vazio vira Cinza ou some do cálculo.', armadilha:'Preencher para “fechar o dado” (baseline igual à previsão) zera o desvio por construção. Registre pendência.' });
  K({ id:'I1.11', nome:'Idade das demandas', unidade:'dias', essencial:true, regra:'R16', valor:d => { const x = C.idadeDemandas(d); return x.lista.length ? x : null; },
    fmt:x => `${nn(x.mediana)} d · ${x.acima.length} acima de ${x.limiar}`, formula:'mediana(dias(ref − dataEntrada)); count(idade > R16) das demandas na fila', motivo:'Não há demandas na fila (fase Demanda).',
    conta:d => { const x = C.idadeDemandas(d); return `${x.lista.map(y => `${esc(y.id)} ${y.dias} d`).join(' · ')}<br>Mediana <b>${nn(x.mediana)} dias</b>; acima de ${x.limiar}: ${esc(lista(x.acima))}`; },
    interpretacao:'Demanda envelhecida é decisão evitada.', armadilha:'O limiar de alerta é premissa a validar (R16). A idade conta até a data de referência, não até hoje.' });
  K({ id:'I1.12', nome:'Divergência de sinal', unidade:'%', regra:'R13', didatico:true, valor:d => C.divergenciaSinal(d).valor, fmt:v => pc(v), motivo:'Nenhuma iniciativa em execução com sinal declarado.',
    formula:'count(declarado ≠ vazio e ≠ calculado) ÷ count(declarado ≠ vazio)', conta:d => { const x = C.divergenciaSinal(d), s = C.sinais(d);
      return `${x.n} ÷ ${x.total} = <b>${pc(x.valor)}</b>${x.ids.map(id => { const y = s.find(z => z.id === id); return `<br>${esc(id)}: declarado ${nomeCor(y.declarado)} × calculado ${nomeCor(y.cor)}`; }).join('')}`; },
    interpretacao:'Status melancia: declarado verde, calculado vermelho. Pede pendência de divergência.', armadilha:'Declarado vazio não diverge, mas também não informa: é outro problema de cadastro.' });
  K({ id:'I1.13', nome:'Concentração top-2', unidade:'%', regra:'R37', valor:d => C.concentracaoTop(d, 2).valor, fmt:v => pc(v), dataDado:finData, motivo:'Nenhuma iniciativa em execução com BAC.',
    formula:'Σbac das 2 maiores ÷ Σbac(A)', conta:d => { const x = C.concentracaoTop(d, 2), t = C.soma(C.emExecucao(d), i => C.bac(d, i)); return `(${x.ids.map(id => `${n2(C.bac(d, id))} <span class="dim">${esc(id)}</span>`).join(' + ')}) ÷ ${n2(t)} = <b>${pc(x.valor)}</b>`; },
    interpretacao:'Foco de acompanhamento: duas iniciativas concentram boa parte do dinheiro.', armadilha:'Concentração alta não é problema em si; vira risco se as maiores estiverem vermelhas.' });
  K({ id:'I1.14', nome:'Horizonte 30/60/90', unidade:'nº', regra:'R08', valor:d => { const h = C.horizontes(d); return h.itens.length ? h : null; },
    fmt:h => `${h.itens.filter(x => /_DIAS$/.test(x.faixa)).length} em até 90 d`, formula:'faixa R08 sobre a data prevista atual das iniciativas de A', motivo:'Nenhuma iniciativa em execução.',
    convencao:'Dias corridos; faixas inclusivas; a própria data de referência cai em 30 dias; data passada = Vencido; sem data = Sem data.',
    conta:d => { const h = C.horizontes(d); return Object.keys(h.contagem).map(k => `${esc(FX[k] || k)}: ${h.contagem[k]}${h.contagem[k] ? ` (${h.itens.filter(x => x.faixa === k).map(x => `${esc(x.id)}${x.dias != null ? ' ' + x.dias + ' d' : ''}`).join(', ')})` : ''}`).join('<br>'); },
    interpretacao:'O que entrega no trimestre.', armadilha:'A RPC do repositório conta todas as ativas; aqui a leitura padrão é só em execução.' });
  K({ id:'I1.15', nome:'Riscos e impedimentos abertos', unidade:'nº', essencial:true, regra:'R09', valor:d => C.riscosAbertos(d), fmt:a => { const v = a.filter(r => r.vencido).length; return `${a.length} · ${v} vencido${v === 1 ? '' : 's'}`; },
    formula:'count(upper(status ?? "ABERTO") ∉ {RESOLVIDO, CONCLUIDO, FECHADO}) das iniciativas de A; vencido = prazo < referência',
    conta:d => { const a = C.riscosAbertos(d); return `${a.map(r => `${esc(r.id)} <span class="dim">${esc(r.status == null || r.status === '' ? '(vazio)' : r.status)}${r.vencido ? ' · vencido' : ''}</span>`).join(' · ')} → <b>${a.length}</b>; ${new Set(a.map(r => r.iniciativaId)).size} iniciativas com algum aberto`; },
    interpretacao:'Regra literal do repositório: o que não está fechado está aberto.', armadilha:'“EM TRATAMENTO” e status vazio contam como abertos.' });
  K({ id:'I1.16', nome:'Dependências abertas', unidade:'nº', regra:'R09', valor:d => ({ a:C.dependenciasAbertas(d), bl:C.bloqueios(d).filter(b => b.porVermelha).length }), fmt:x => `${x.a.length} · ${x.bl} por vermelha`,
    formula:'count(upper(status ?? "ABERTA") ∉ {RESOLVIDA, CONCLUIDA, FECHADA}) com origem em A; bloqueio quando quem bloqueia está vermelha',
    conta:d => { const a = C.dependenciasAbertas(d), b = C.bloqueios(d); return `${a.map(x => esc(x.id)).join(', ') || 'nenhuma'} → <b>${a.length}</b>${b.map(x => `<br>${esc(x.bloqueada)} é bloqueada por ${esc(x.por)} (${esc(x.dependenciaId)}; ${nomeCor(x.corPor)})`).join('')}`; },
    interpretacao:'Efeito cascata: a iniciativa bloqueada herda o problema de quem bloqueia.', armadilha:'Escalar a bloqueada sem tratar a causa raiz não destrava nada.' });

  /* ================================================================== FICHA DA INICIATIVA: abas do N1 */
  function fichaSinal(ini, d){
    const pv = C.previsaoEfetiva(d, ini);
    if(ini.statusId !== 'EM_EXECUCAO' || ini.ativo === false)
      return `<p class="muted">O sinal calculado ${B('R13')} vale só para iniciativas ativas em execução. ${esc(ini.id)} está em <b>${esc(nomeFase(d, ini.statusId))}</b>${ini.ativo === false ? ' (arquivada)' : ''}.</p>`
        + (pv.vencida ? ui.callout('atencao', `<p>Previsão vencida ${B('R14')}: a data prevista (${fmt.date(ini.dataPrevistaAtual)}) já passou e a fase não é terminal. Atualize a previsão ou registre uma pendência.</p>`) : '')
        + (ini.ragDeclarado ? `<p>Sinal declarado: ${pillCor(ini.ragDeclarado)}</p>` : '');
    const s = C.sinal(d, ini), L = C.param(d, 'R13'), b = C.bac(d, ini), a = C.ac(d, ini), base = ini.dataPlanejada, pe = pv.data;
    const conta = base && pe ? `(12 × ${pe.slice(0, 4)} + ${+pe.slice(5, 7)}) − (12 × ${base.slice(0, 4)} + ${+base.slice(5, 7)}) = <b>${s.desvio}</b>` : 'sem baseline: não há desvio';
    return `<div class="row" style="margin-bottom:8px"><span class="dim">Declarado</span>${ini.ragDeclarado ? pillCor(ini.ragDeclarado) : '<span class="dim">não informado</span>'}<span class="dim">→ calculado</span>${pillCor(s.cor, s.motivo)}${DIDAT}</div>
      <p style="margin:0 0 10px"><b>Motivo:</b> ${esc(s.motivo)}</p>
      ${s.divergente ? `<div style="margin-bottom:10px">${ui.callout('atencao', `<p>Declarado ${nomeCor(s.declarado)} × calculado ${nomeCor(s.cor)}. Não corrija a cor: registre uma pendência do tipo <span title="DIVERGENCIA_STATUS">“Divergência de status”</span> com responsável e prazo.</p><div style="margin-top:6px"><button class="btn btn-ghost btn-sm" data-ficha-acao="pendencia">${icon('plus', 13)} Registrar pendência</button></div>`)}</div>` : ''}
      <table class="pf1-kv"><tbody>
        <tr><td>Baseline (data planejada)</td><td>${base ? fmt.date(base) : '<span class="tone-warn">vazia → Cinza</span>'}</td></tr>
        <tr><td>Data prevista atual</td><td>${ini.dataPrevistaAtual ? fmt.date(ini.dataPrevistaAtual) : '—'}${pv.vencida ? ` <small>previsão vencida: usa ${fmt.date(pv.data)} ${B('R14')}</small>` : ''}</td></tr>
        <tr><td>Desvio (meses de calendário)</td><td>${conta} · prazo ${s.prazo ? pillCor(s.prazo) : '—'}</td></tr>
        <tr><td>BAC · AC (R$ mi)</td><td>${n2(b)} · ${n2(a)} → gasto ${pc(C.div(a, b), 0)} ${B('R37')}</td></tr>
        <tr><td>% físico real</td><td>${ini.percentualFisicoReal == null ? '—' : fmt.n(ini.percentualFisicoReal) + '%'}</td></tr>
        <tr><td>Índice progresso × gasto</td><td>${ini.percentualFisicoReal == null ? '—' : fmt.n(ini.percentualFisicoReal) + '%'} ÷ ${pc(C.div(a, b), 1)} = <b>${n2(s.indice)}</b> · custo ${s.custo ? pillCor(s.custo) : '—'}</td></tr></tbody></table>
      <p class="dim" style="font-size:12.5px;margin:10px 0 0">Vale a pior dimensão. Vermelho: desvio ≥ ${L.vermelhoDesvioMeses} ou índice &lt; ${n2(L.vermelhoIndiceAbaixoDe)} ${B('R13')} · <a href="#/n1/saude?aba=sinal" data-pf-close="1">ver todas em Saúde & Prazos →</a></p>`;
  }
  function fichaRiscos(ini, d){
    const rs = (d.riscosImpedimentos || []).filter(r => r.iniciativaId === ini.id), deps = (d.dependencias || []).filter(x => x.iniciativaOrigemId === ini.id || x.iniciativaDependenciaId === ini.id);
    const leit = a => a ? '<span class="pill tone-warn">Aberto</span>' : '<span class="pill tone-ok">Fechado</span>';
    const outro = x => x.iniciativaOrigemId === ini.id ? (x.iniciativaDependenciaId ? `é bloqueada por ${linkFicha(x.iniciativaDependenciaId)}` : `depende da comunidade <b>${esc(x.comunidadeDependenciaId || '—')}</b>`) : `bloqueia ${linkFicha(x.iniciativaOrigemId)}`;
    const corDe = x => { const y = x.iniciativaOrigemId === ini.id ? x.iniciativaDependenciaId : null, yi = y && byId(d.iniciativas, y); return yi && yi.statusId === 'EM_EXECUCAO' ? pillCor(C.sinal(d, yi).cor) : ''; };
    return `<div class="row" style="margin-bottom:8px">${B('R09')}<span class="dim" style="font-size:12.5px">Fechado só com ${esc(C.param(d, 'R09').riscos.join(', '))}; vazio ou outro texto = aberto.</span></div>
      ${rs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Registro</th><th>Descrição</th><th>Status no registro</th><th>Leitura</th><th>Prazo</th></tr></thead><tbody>${rs.map(r => { const ab = C.riscoAberto(d, r), v = C.riscoVencido(d, r);
        return `<tr class="${v ? 'pf1-venc' : ''}"><td><b>${esc(r.id)}</b><small>${r.natureza === 'IMPEDIMENTO' ? 'impedimento' : 'risco'}</small></td><td>${esc(r.descricao)}<small>Ação: ${esc(r.acao || '—')}</small></td><td>${r.status == null || r.status === '' ? '<span class="tone-warn">(vazio)</span>' : `<code>${esc(r.status)}</code>`}</td><td>${leit(ab)}</td><td>${r.prazo ? fmt.date(r.prazo) : '—'}${v ? '<small><b class="tone-bad" style="font-weight:500">vencido</b></small>' : ''}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">Nenhum risco ou impedimento registrado.</p>'}
      <h4 class="eyebrow" style="margin:16px 0 8px">Dependências</h4>
      ${deps.length ? `<ul class="pf1-ul">${deps.map(x => `<li><b>${esc(x.id)}</b> · ${linkFicha(x.iniciativaOrigemId === ini.id ? ini.id : x.iniciativaOrigemId)} ${x.iniciativaOrigemId === ini.id ? outro(x) : `é bloqueada por ${esc(ini.id)}`} ${corDe(x)} ${leit(C.dependenciaAberta(d, x))}<br><small class="dim">${esc(x.descricao || '')} · status <code>${esc(x.status ?? '(vazio)')}</code>${x.dataEsperada ? ' · esperada ' + fmt.date(x.dataEsperada) : ''}</small></li>`).join('')}</ul>` : '<p class="muted">Nenhuma dependência registrada.</p>'}`;
  }
  PF.registerFichaTab({ id:'sinal', nivel:1, titulo:'Sinal', ordem:20, render:fichaSinal });
  PF.registerFichaTab({ id:'riscos', nivel:1, titulo:'Riscos & Dependências', ordem:30, render:fichaRiscos });

  /* ================================================================== GLOSSÁRIO DO N1 (§8.3; o mínimo §1.5 vem de globais.js) */
  PF.registerGlossario(1, [
    ['Inventário único', 'Lista única de todas as iniciativas, em qualquer fase. Iniciativa invisível consome capacidade sem ter sido escolhida.'],
    ['Cinza (sinal)', 'Sinal de quem não tem referência para comparar (sem baseline, BAC ou AC). Não é verde nem vermelho: é dado faltante.', 'R13'],
    ['Gestão por exceção', 'O painel destaca o que está fora da tolerância: primeiro o vermelho, depois divergências e Cinza. O resto segue no informe.'],
    ['Dependência', 'Quando uma iniciativa precisa de outra (ou de uma comunidade) para avançar. Fica aberta até o status dizer RESOLVIDA, CONCLUIDA ou FECHADA.', 'R09'],
    ['Triagem', 'Decide se a demanda entra na análise do portfólio, em uma de cinco saídas. Não é priorização.', 'R17'],
    ['Pendência', 'Registro do que falta ou não confere (campo vazio, divergência, dado inconsistente), com responsável e prazo. Não inventa valor.'],
    ['Arquivar', 'Marcar como inativa com justificativa, preservando dados, decisões e histórico. Não existe apagar.', 'R06'],
    ['Sinal declarado', 'Cor informada pelo responsável da iniciativa. O app compara com o sinal calculado.'],
    ['Índice progresso × gasto', '% físico real dividido pela fração do orçamento já gasta (AC ÷ BAC). Abaixo de 1: gastou mais do que avançou.', 'R37'],
    ['Previsão vencida', 'A data prevista já passou e a fase não terminou: o cálculo usa a data de referência como previsão mínima.', 'R14'],
    ['Mediana', 'Valor do meio da lista ordenada. Resiste a extremos melhor que a média: em 0, 0, 1, 3, 10 a mediana é 1 e a média, 2,8.'],
  ].map(([termo, def, regra]) => Object.assign({ termo, def, fonte:'§8.3' }, regra ? { regra } : {})));

  /* ================================================================== DESAFIO (§5.5) */
  /** Cinco contas "e se?": variantes que não aparecem em nenhuma tela, calculadas por PF.calc sobre cópias de PF.base. */
  function contasDesafio(){
    const b = PF.base, A = C.emExecucao(b), vm = C.pctOrcamentoVermelho(b).ids, alt = fn => C.comAlteracao(b, fn), ach = (arr, id) => arr.find(x => x.id === id);
    return [
      { id:'a', txt:'% do orçamento em execução sob sinal vermelho se E03 também ficar vermelha', unid:'%', tol:0.5, v:100 * C.div(C.soma(Array.from(new Set(vm.concat('E03'))), id => C.bac(b, id)), C.soma(A, i => C.bac(b, i))) },
      { id:'b', txt:'Índice progresso × gasto de E05 se o realizado (AC) subir para R$ 1,40 mi', unid:'índice', tol:0.02, v:C.indice(alt(x => x.financeiro.filter(f => f.iniciativaId === 'E05').forEach(f => { f.realizado = 1.40; })), 'E05') },
      { id:'c', txt:'Desvio mediano de prazo se E02 terminar exatamente na baseline', unid:'meses', tol:0.15, v:C.desvios(alt(x => { const i = ach(x.iniciativas, 'E02'); i.dataPrevistaAtual = i.dataPlanejada; })).mediana },
      { id:'d', txt:'Completude cadastral se E04 receber um objetivo estratégico', unid:'%', tol:0.5, v:100 * C.completude(alt(x => { ach(x.iniciativas, 'E04').objetivoEstrategicoId = 'OE-1'; })).pct },
      { id:'e', txt:'Riscos e impedimentos abertos se R3 for marcado RESOLVIDO', unid:'nº', tol:0, v:C.riscosAbertos(alt(x => { ach(x.riscosImpedimentos, 'R3').status = 'RESOLVIDO'; })).length },
    ];
  }
  /** Estado de cada passo, lido dos dados de trabalho; gabaritos calculados sobre PF.base. */
  function passosDesafio(d){
    const b = PF.base, pend = d.pendencias || [], aberta = p => p.status !== 'RESOLVIDA', tem = x => String(x || '').trim() !== '';
    const p1 = C.completude(b).faltas.map(f => ({ f, pend:pend.some(p => p.iniciativaId === f.id && p.tipo === 'CAMPO_VAZIO' && p.campo === f.campo && aberta(p) && tem(p.responsavel) && tem(p.prazo)),
      vazio:(() => { const i = byId(d.iniciativas, f.id); return !!i && (f.campo === 'bac' ? C.bac(d, i) == null : C.vazio(i[f.campo])); })() }));
    const p2 = C.divergenciaSinal(b).ids.map(id => ({ id, ok:pend.some(p => p.iniciativaId === id && p.tipo === 'DIVERGENCIA_STATUS' && String(p.descricao || '').trim().length >= 20) }));
    const resp = ((st1().desafio || {}).contas) || {}, contas = contasDesafio().map(x => Object.assign(x, { resp:resp[x.id], ok:resp[x.id] != null && Math.abs(resp[x.id] - x.v) <= x.tol + 1e-9 }));
    const fila = C.demandas(b).map(i => i.id), esc_ = {}, vigs = {};
    fila.forEach(id => { const v = C.triagemVigente(d, id); vigs[id] = v; if(v && v.recomendacao === true && tem(v.instancia) && v.instancia !== v.papelRegistrante) esc_[id] = v.tipoDecisao; });
    const av = C.avaliarTriagem(b, esc_, { ids:fila });
    const fr = byId(d.foruns, 'FR-OUT') || {}, vm = C.pctOrcamentoVermelho(b).ids, it = fr.pautaItens || [], obs = fr.observacoes || '', nl = linhasTxt(obs);
    const c5 = { pauta:it.length === vm.length && vm.every(x => it.includes(x)), linhas:nl > 0 && nl <= 5, cita:vm.every(x => new RegExp('\\b' + x + '\\b', 'i').test(obs)), ilu:norm(obs).includes('ilustrativo') };
    return { p1, p2, contas, fila, vigs, av, c5, vm,
      ok:[p1.length > 0 && p1.every(x => x.pend && x.vazio), p2.length > 0 && p2.every(x => x.ok), contas.every(x => x.ok), !!av.ok, c5.pauta && c5.linhas && c5.cita && c5.ilu] };
  }
  const chk = (ok, txt) => `<li class="${ok ? 'y' : 'n'}">${ok ? '✓' : '○'} ${txt}</li>`;
  const CAMPO_ROT = { objetivoEstrategicoId:'objetivo estratégico', dataPlanejada:'data planejada (baseline)', categoria:'categoria', bac:'BAC', dataPrevistaAtual:'data prevista' };
  function renderDesafio(el, ctx, done){
    const d = PF.db(), P = passosDesafio(d), nOk = P.ok.filter(Boolean).length, nota = Math.round(100 * nOk / 5), aprovado = P.ok[0] && P.ok[3] && P.ok[4] && nOk >= 4;
    if(P.ok[1]) PF.award('m-melancia', 'Caçadora de melancias');
    const ROT_PASSO = { 1:['R10a','R10b'], 2:'R13', 3:'ILUSTRATIVO', 4:'R17', 5:['R05a','R13'] };
    const step = (n, titulo, corpo, acoes = '') => `<div class="pf1-step ${P.ok[n - 1] ? 'ok' : ''}"><div class="row"><span class="pill tone-${P.ok[n - 1] ? 'ok' : 'dim'}">${P.ok[n - 1] ? '✓ Feito' : 'Pendente'}</span><h4>Passo ${n} · ${titulo}</h4>${[1, 4, 5].includes(n) ? '<span class="dim" style="font-size:12px">obrigatório</span>' : ''}<span class="spacer"></span>${B(ROT_PASSO[n])}</div>${corpo}${acoes ? `<div class="row">${acoes}</div>` : ''}</div>`;
    const btnP = (id, tipo, cmp, t) => `<button class="btn btn-ghost btn-sm" data-n1-pend="${esc(id)}|${tipo}|${cmp}">${icon('plus', 13)} ${esc(t)}</button>`;
    const nome = s => esc(nomeTipo(d, s));
    el.innerHTML = `${ui.callout('dica', '<p>O checklist é vivo: cada passo confere os seus dados de trabalho. Os passos 1, 4 e 5 são obrigatórios; conclua pelo menos 4 de 5 e entregue. As contas do passo 3 são variantes que não aparecem em nenhuma tela.</p>')}
      <div class="stack" style="margin-top:14px;gap:12px">
      ${step(1, 'Pendências de cadastro', `<p class="muted" style="margin:0">Registre uma pendência do tipo campo vazio para cada campo obrigatório que falta nas iniciativas em execução, com responsável e prazo. Não preencha o campo: ele deve continuar vazio.</p>
        <ul class="pf1-chk">${P.p1.map(x => chk(x.pend, `${esc(x.f.id)} · pendência de ${esc(CAMPO_ROT[x.f.campo] || x.f.campo)} registrada`) + chk(x.vazio, `${esc(x.f.id)} · o campo continua vazio`)).join('')}</ul>`,
        P.p1.map(x => btnP(x.f.id, 'CAMPO_VAZIO', x.f.campo, `Pendência em ${x.f.id}`)).join(''))}
      ${step(2, 'Divergência de sinal', `<p class="muted" style="margin:0">Registre a divergência entre o sinal declarado e o calculado (pendência do tipo <span title="DIVERGENCIA_STATUS">“Divergência de status”</span>, descrição com pelo menos 20 caracteres).</p>
        <ul class="pf1-chk">${P.p2.map(x => chk(x.ok, `Pendência de divergência em ${esc(x.id)}`)).join('')}</ul>`, P.p2.map(x => btnP(x.id, 'DIVERGENCIA_STATUS', 'ragDeclarado', `Divergência em ${x.id}`)).join(''))}
      ${step(3, 'Cinco contas “e se?”', `<p class="muted" style="margin:0">Calcule com as fórmulas das fichas de indicador. Use vírgula ou ponto; percentuais em %, com uma casa.</p>
        <div class="pf1-contas">${P.contas.map(x => `<label for="pf1-c-${x.id}">${x.id.toUpperCase()}) ${esc(x.txt)}</label><input class="input num" id="pf1-c-${x.id}" type="text" inputmode="decimal" data-n1-conta="${x.id}" value="${x.resp == null ? '' : esc(String(x.resp).replace('.', ','))}" placeholder="${esc(x.unid)}">
          <span class="r">${x.resp == null ? '<span class="dim">—</span>' : x.ok ? '<b class="tone-ok">✓ certo</b>' : '<b class="tone-bad">✗ revise</b>'}</span>`).join('')}</div>`, `<button class="btn btn-ghost btn-sm" data-n1-contas>${icon('check', 13)} Conferir contas</button>`)}
      ${step(4, 'Triagem da fila', `<p class="muted" style="margin:0">A recomendação <b>vigente</b> de cada demanda precisa conferir com a precedência em pelo menos 4 de ${P.fila.length} (Devolver numa admissão com evidência pendente vale meio ponto), com instância preenchida e diferente de quem registra.</p>
        <ul class="pf1-chk">${P.av.porDemanda.map(x => chk(x.pontos === 1, `${esc(x.id)} · ${x.escolhida ? nome(x.escolhida) : P.vigs[x.id] ? 'recomendação sem instância válida' : 'sem recomendação vigente'}${x.pontos === 0.5 ? ' · meio ponto' : ''}`)).join('')}</ul>
        <p style="margin:0">Pontos: <b>${fmt.n(P.av.nota, 1)}</b> de ${P.av.max} (mínimo 4).</p>`, `<a class="btn btn-ghost btn-sm pf1-lk" href="#/n1/triagem">${icon('flow', 13)} Ir para a Triagem</a>`)}
      ${step(5, 'Pauta e resumo do fórum', `<p class="muted" style="margin:0">No Dashboard, grave o rascunho da pauta do [Simulado] Fórum de out/2026: as iniciativas que pedem discussão aprofundada e um resumo de até 5 linhas que cite cada uma delas e deixe claro que os dados são ilustrativos.</p>
        <ul class="pf1-chk">${chk(P.c5.pauta, 'Pauta com as iniciativas fora da tolerância')}${chk(P.c5.linhas, 'Resumo gravado, com até 5 linhas')}${chk(P.c5.cita, 'O resumo cita as iniciativas da pauta')}${chk(P.c5.ilu, 'O resumo contém a palavra “ilustrativo”')}</ul>`,
        `<a class="btn btn-ghost btn-sm pf1-lk" href="#/dashboard?aba=n1">${icon('dashboard', 13)} Ir para o Dashboard</a>`)}
      <div class="dec-total"><span class="t">Passos concluídos<b class="num">${nOk} de 5</b></span><span class="t">Nota<b class="num">${nota}</b></span><span class="t">Obrigatórios (1, 4, 5)<b>${P.ok[0] && P.ok[3] && P.ok[4] ? '✓' : 'pendente'}</b></span>
        <span class="spacer"></span><button class="btn btn-primary btn-sm" data-n1-entregar>${icon('trophy', 14)} Entregar desafio</button></div>
      ${aprovado ? '' : '<p class="dim" style="margin:0;font-size:12.5px">Pode entregar a qualquer momento: a tentativa fica registrada e você pode refazer.</p>'}</div>`;
    const cb = el.querySelector('[data-n1-contas]'); if(cb) cb.onclick = () => { const s = st1(); s.desafio = s.desafio || {}; s.desafio.contas = {};
      el.querySelectorAll('[data-n1-conta]').forEach(i => { const v = parseFloat(String(i.value).trim().replace('%', '').replace(',', '.')); if(!isNaN(v)) s.desafio.contas[i.dataset.n1Conta] = v; });
      PF.save(); PF.refresh(); };
    const eb = el.querySelector('[data-n1-entregar]'); if(eb) eb.onclick = () => { const Q = passosDesafio(PF.db()), k = Q.ok.filter(Boolean).length;
      done({ ok:Q.ok[0] && Q.ok[3] && Q.ok[4] && k >= 4, nota:Math.round(100 * k / 5), detalhe:Q.ok.map((o, i) => ({ passo:i + 1, ok:o })) }); };
  }

  /* ================================================================== REGISTRO DO NÍVEL */
  const r36b = ((PF.base && PF.base.regras) || []).find(r => r.codigo === 'R36b');
  PF.registerLevel({
    id:1, nome:'Partitura · Fundamentos', subtitulo:'Ler o portfólio', pergunta:'O que temos, como está e o que pede atenção neste mês?',
    objetivos:['Distinguir portfólio, programa, projeto e operação, e dizer o que fica no ADO, Jira ou ITSM.',
      'Localizar iniciativas em Gerência → Comunidade → Squad → Ferramenta e reconhecer uma hierarquia inválida.',
      'Classificar por fase e categoria e apontar lacunas de cadastro sem inventar valor.', 'Aplicar a regra de sinal, identificar Cinza e divergências.',
      'Calcular e interpretar contagem × valor, média × mediana, gasto × progresso e 30/60/90.', 'Listar riscos e dependências abertos pela regra literal.',
      'Recomendar a triagem de uma demanda em uma de cinco saídas, com justificativa e instância.', 'Reconhecer os blocos do Pool e os fóruns propostos no deck, sabendo que são proposta.',
      'Rotular afirmações pela precedência de origem.'],
    unlock:{ minPct: r36b && typeof r36b.valor === 'number' ? Math.round(r36b.valor * 100) : 70, desafio:true },
    screens:[
      { id:'saude', titulo:'Saúde & Prazos', icone:'gauge', render:telaSaude },
      { id:'triagem', titulo:'Triagem', icone:'flow', escreve:true, render:telaTriagem },
      { id:'mapa', titulo:'Mapa da FE', icone:'people', render:telaMapa },
    ],
    questions:[],
    desafio:{ titulo:'Partitura limpa para o fórum simulado de outubro', descricao:'Pendências de cadastro e de divergência, cinco contas “e se?”, triagem da fila e o rascunho da pauta por exceção, conferidos nos seus dados de trabalho.', render:renderDesafio },
  });

  /** Utilitários para perguntas-n1.js. */
  PF.n1 = { pillCor, nomeCor, B, curto, vtxt, nomeTipo, linhasTxt, DIDAT, n2, pc, nn, mes, SIN };
})();
