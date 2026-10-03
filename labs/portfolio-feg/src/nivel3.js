/* =========================================================================
   Portfólio FEG — NÍVEL 3 · REGÊNCIA · OTIMIZAÇÃO (nivel3.js)
   Telas (spec §7.2 com o escopo do CONTRATO D4): Otimizador (Restrições & custos | Fronteira & Pareto | Capacidade local),
   Cenários & Robustez, Sensibilidade (Sensibilidade | Aprofundamento: AHP), Benefícios & Inovação e Planejamento do Ciclo.
   Mais: blocos do Dashboard (§7.3), KPIs I3.x (sem HHI, CPM e opção real), abas da ficha (Benefícios, Cenários), glossário N3 (§8.3)
   e desafio (§7.6). As perguntas (§7.5) ficam em perguntas-n3.js, que anexa a PF.level(3).questions.
   Regras: telas leem PF.db() (trabalho); perguntas e desafio conferem contra PF.base (pesos v1). Todo cálculo vem de PF.calc.
   Pesos novos (sensibilidade/AHP) viram versão CANDIDATA de R20: vigente:false, A_VALIDAR, vigência 2028; a v1 segue vigente (R35).
   Sliders: 'input' atualiza só o resultado (PF.patch); 'change' persiste e chama PF.refresh.
   Nada aqui é regra ONS; dados fictícios; nunca muta PF.base.
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF = window.PF || {};
  const { esc, fmt } = PF.util;
  const ui = PF.ui, icon = PF.icon, CH = PF.charts;
  const C = () => PF.calc;
  const EPS = 1e-9;
  const B = c => (PF.globais && PF.globais.badge) ? PF.globais.badge(c) : PF.badge(c);
  const META = d => (PF.globais && PF.globais.metaLine) ? PF.globais.metaLine(d) : '';
  const MS = () => PF.modState(3);
  const T = {};                                   // estado transitório de formulários (não persiste)
  const hoje = () => new Date().toISOString().slice(0, 10);
  const byId = (arr, id) => (arr || []).find(x => x.id === id) || null;
  const vazio = v => v == null || (typeof v === 'string' && !v.trim());
  const soma = (a, f = x => x) => (a || []).reduce((s, x) => s + (+f(x) || 0), 0);
  const num = v => { const s = String(v ?? '').trim().replace(',', '.'); const n = Number(s); return s === '' || !Number.isFinite(n) ? null : n; };
  const n1 = v => v == null ? 'n/d' : fmt.n(v, 1), n2 = v => v == null ? 'n/d' : fmt.n(v, 2), n3 = v => v == null ? 'n/d' : fmt.n(v, 3);
  const pc = (v, c = 1) => v == null ? 'n/d' : fmt.pct(v, c);
  const pcx = v => v == null ? 'n/d' : fmt.n(v * 100, Math.abs(v * 1000 - Math.round(v * 100) * 10) > 1e-6 ? 1 : 0) + '%';
  const pp = v => v == null ? 'n/d' : fmt.n(v * 100, 1) + ' pp';
  const aula = txt => ui.callout('conceito', `<p>${txt}</p>`, 'Aula rápida');
  const DECK = s => `Deck A&M Etapa 3 v25, ${s} (proposta de consultoria, não aprovada)`;
  const PROP = s => PF.badge({ origemRegra:'A_VALIDAR_FEG', tipoFonte:'PROPOSTA_CONSULTORIA', referencia:DECK(s) });
  const AVF = ref => PF.badge({ origemRegra:'A_VALIDAR_FEG', tipoFonte:'PREMISSA_ILUSTRATIVA', referencia:ref });
  const DFP = ref => PF.badge({ origemRegra:'DECISAO_FUNCIONAL_PRODUTO', tipoFonte:'PREMISSA_ILUSTRATIVA', referencia:ref });
  const ILU = () => PF.badge('ILUSTRATIVO');
  const refM = t => `<span class="pf3-ref" title="Marca de interface: referência de mercado (não é regra ONS)">Ref.: ${esc(t)}</span>`;
  const tit = (d, id) => { const i = byId(d.iniciativas, id); return i ? String(i.titulo).replace(/ \(fictício\)$/, '') : id; };
  const idsH = (arr, ref) => `<span class="pf3-ids">${(arr || []).map(id => `<span class="pf3-id ${ref && !ref.includes(id) ? 'novo' : ''}" title="${esc(id)}">${esc(id)}</span>`).join('') || '<span class="dim">—</span>'}</span>`;
  /** Tabela simples: head = ['Col' | ['Col','r']] (html confiável); linhas = arrays de células já escapadas; linha.cls opcional. */
  const tab = (head, linhas, vazioTxt = 'Nenhum registro.') => `<div class="tbl-wrap"><table class="tbl pf3-tbl"><thead><tr>${head.map(h => { const [l, a] = Array.isArray(h) ? h : [h, '']; return `<th class="${a}">${l}</th>`; }).join('')}</tr></thead><tbody>${
    linhas.length ? linhas.map(l => `<tr class="${l.cls || ''}">${l.map((c, k) => `<td class="${Array.isArray(head[k]) ? head[k][1] : ''}">${c ?? ''}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${head.length}" class="dim">${esc(vazioTxt)}</td></tr>`}</tbody></table></div>`;
  const kc = (label, valor, sub, bdg) => `<div class="pf3-kc"><div class="l">${esc(label)}</div><div class="v num">${valor}</div>${sub ? `<div class="pf3-mini">${sub}</div>` : ''}${bdg ? `<div class="b">${bdg}</div>` : ''}</div>`;
  const err = (T0, k) => `<div class="pf3-err">${(T0 && T0.erros && T0.erros[k]) || ''}</div>`;
  const CAT = { OBRIGATORIA:'Obrigatória', SUSTENTACAO:'Sustentação', EVOLUCAO:'Evolução', INOVACAO:'Inovação' };
  const GATE = ['GO','GO_CONDICIONADO','HOLD','RECYCLE','KILL'];
  const CLASSES = ['NUCLEO','CONDICIONAL','HABILITADORA','RECYCLE','KILL'];
  const catClasse = d => (((d.catalogos || {}).classeRecomendacao) || []);
  const classeNome = (d, k) => (catClasse(d).find(x => x.codigo === k) || {}).nome || k || '—';
  const tipoNome = (d, k) => ((((d.catalogos || {}).tiposDecisao) || []).find(x => x.codigo === k) || {}).nome || k;
  const FX = { TANQUE:'Tanque', REDUZIR:'Reduzir escopo', ROADMAP:'Roadmap', AUTONOMIA:'Autonomia' };
  const classeTipo = (d, k) => (catClasse(d).find(x => x.codigo === k) || {}).tipoDecisao || k;
  const versaoPesos = d => { const r = C().regra(d, 'R20'); return r ? (r.rotuloVersao || 'v' + (r.versao || 1)) : 'v1'; };
  /** Pesos da v1 (referência) e comparação por valor: uma versão nova com os mesmos valores da v1 (ex.: “Preencher com a v1” no N2) vale como v1. */
  const pesosV1 = () => C().pesosEfetivos(PF.base);
  const mesmosPesos = (a, b = pesosV1()) => !!a && Object.keys(a).length === Object.keys(b).length && Object.keys(b).every(k => Math.abs((+a[k] || 0) - b[k]) < 1e-6);
  const pesosOk = x => !!x && (x.versaoPesos === 'v1' || mesmosPesos(x.pesosCiclo));
  const papeis = d => ((d.catalogos || {}).papeisRegistrantes) || [];
  const instCiclo = d => ((((d.catalogos || {}).instancias) || {}).ciclo) || [];
  const autor = () => (PF.perfil().nome || '').trim() || 'Aprendiz (perfil local)';
  const SIT = { ACIMA:['Acima da trajetória','ok'], ABAIXO:['Abaixo da trajetória','bad'], NA_TRAJETORIA:['Na trajetória','lime'], SEM_MEDICAO:['Sem medição','dim'] };
  const J = o => `<p><b>Resposta:</b> ${o.r}</p><p><b>Como calculei:</b> ${o.c}</p><p><b>Leitura:</b> ${o.l}</p><p><b>Cuidado:</b> ${o.k}</p><p><b>Próximo passo:</b> ${o.p}</p>`;
  /** Medalha m-robusto: AQ3-04 acertada sem revelar (o core não tem gancho de resposta; conferido a cada tela do N3 e na justificativa). */
  function medalhas(){ const r = (PF.state().respostas || {})['AQ3-04']; if(r && r.best && !r.revelada) PF.award('m-robusto', 'Núcleo robusto'); }

  /* ------------------------------------------------------------------ estilo próprio (classes pf3-*) */
  const CSS = `.pf3-ids{display:inline-flex;gap:4px;flex-wrap:wrap}.pf3-id{font-size:12px;border:1px solid var(--lime);color:var(--lime);border-radius:6px;padding:1px 6px;font-variant-numeric:tabular-nums}.pf3-id.novo{border-color:var(--info);color:var(--info)}
.pf3-ref{font-size:11px;color:var(--dim);font-style:italic;white-space:nowrap}.pf3-mini{font-size:12px;color:var(--dim)}.pf3-ok{color:var(--ok)}.pf3-no{color:var(--bad)}
.pf3-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.pf3-kc{border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,.10);min-width:0}
.pf3-kc .l{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}.pf3-kc .b{display:flex;gap:4px;flex-wrap:wrap;margin-top:auto;padding-top:2px}.pf3-tbl .pf3-ids{flex-wrap:nowrap}.pf3-kc .b .tag{white-space:normal;max-width:100%;overflow-wrap:anywhere}.pf3-g>*{min-width:0}.pf3-g23{grid-template-columns:minmax(0,2fr) minmax(0,3fr)}.pf3-tagw{white-space:normal;max-width:100%}.pf3-kv td{white-space:normal;overflow-wrap:anywhere}.pf3-kv td:first-child{width:45%}.pf3-kc .v{font-family:var(--display);font-size:24px;font-weight:300;line-height:1.15;overflow-wrap:anywhere}.pf3-kc .v small{font-size:14px;color:var(--muted)}
.pf3-cfg{display:flex;flex-direction:column;gap:9px}.pf3-cfg label{display:flex;gap:8px;align-items:center;flex-wrap:wrap;cursor:pointer;font-size:13.5px}.pf3-cfg label.fix{cursor:default;color:var(--muted)}
.pf3-sl{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.pf3-sl input[type=range]{flex:1 1 180px;width:auto;min-width:0}.pf3-sl b{font-family:var(--display);font-weight:400;font-size:17px;min-width:78px}
.pf3-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}.pf3-form .full{grid-column:1/-1}.pf3-form .input,.pf3-form .select{width:100%;min-width:0}.pf3-form textarea{resize:vertical}
.pf3-err{color:#F3A39A;font-size:12.5px}.pf3-err:empty{display:none}.pf3-tbl td,.pf3-tbl th{white-space:nowrap}.pf3-tbl td.wrap,.pf3-tbl th.wrap{white-space:normal;min-width:170px}.pf3-tbl tr.on td{background:rgba(211,206,34,.08)}
.pf3-tbl .select,.pf3-tbl .input{padding:5px 8px;font-size:13px;min-width:120px}.pf3-mat td,.pf3-mat th{text-align:center}.pf3-mat .select{min-width:64px}
.pf3-step{border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;background:rgba(0,0,0,.08)}.pf3-step.ok{border-color:rgba(156,203,91,.55)}.pf3-step.err{border-color:rgba(228,103,90,.55)}.pf3-step h4{font-size:16px;font-weight:400;margin:0}
.pf3-grid-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.pf3-grid-in .input,.pf3-grid-in .select{width:100%;min-width:0}
.pf3-sec{border-left:3px solid var(--lime-line);padding:4px 0 4px 12px;margin:12px 0}.pf3-sec h4{font-size:15px;font-weight:500;margin:0 0 6px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}.pf3-sec p{margin:0 0 6px;color:var(--muted)}
.pf3-f{border-bottom:1px dotted var(--dim);cursor:help}.pf3-tbl small.pf3-nota{display:block;white-space:normal;min-width:80px}.pf3-cmp .pf3-tbl .pf3-ids{flex-wrap:wrap}.pf3-uso{display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-top:4px}.pf3-uso small{white-space:normal}
.pf3-a{text-decoration:none}.pf3-a.btn-ghost{color:var(--white)}.pf3-chk{display:inline-flex;gap:6px;align-items:center;cursor:pointer;font-size:13px}
@media (max-width:980px){.pf3-qw{max-width:calc(100vw - 72px)}.pf3-g23{grid-template-columns:minmax(0,1fr)}}
@media (max-width:640px){.pf3-form{grid-template-columns:minmax(0,1fr)}.pf3-kc .v{font-size:21px}}`;
  if(typeof document !== 'undefined' && !document.getElementById('pf3-css')){ const s = document.createElement('style'); s.id = 'pf3-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ================================================================== OTIMIZADOR */
  const CFG0 = { cap:null, deps:false, mix:false, gcap:false, reserva:false, excl:false, p07:false };
  const POLK = { deps:'DEP', mix:'MIX', gcap:'GCAP', reserva:'RESERVA', excl:'EXCL', p07:'P07' };
  const cfg = () => Object.assign({}, CFG0, MS().cfg || {});
  /** Opções do PF.calc.otimizar a partir das chaves ligadas na tela. */
  function optsDe(d, k, rows){ const c = C(), O = rows ? { rows } : {};
    if(k.cap != null) O.cap = +k.cap; if(k.deps) O.deps = c.depsLogicas(d); if(k.mix) O.maxD = c.param(d, 'R28').toleranciaD;
    if(k.gcap) O.gcap = true; if(k.reserva) O.reserva = +c.param(d, 'R27'); if(k.excl) O.excl = c.gruposExclusividade(d); if(k.p07) O.forcar = ['P07']; return O; }
  function chaves(d){ const c = C(), deps = c.depsLogicas(d), ex = c.gruposExclusividade(d), tol = c.param(d, 'R28').toleranciaD, res = +c.param(d, 'R27');
    return [
      { k:'deps', nome:`Dependência ${deps.map(x => x.join(' ⇒ ')).join(', ') || '(nenhuma aberta)'} (a confirmar)`, bdg: ILU() + ' ' + B('R09') },
      { k:'mix', nome:`Mix: índice D ≤ ${fmt.n(tol * 100)} pp`, bdg: B('R28') },
      { k:'gcap', nome:'Capacidade por gerência', bdg: B('R24') },
      { k:'reserva', nome:`Reserva de ${fmt.n(res * 100)}% (s166)`, bdg: B('R27') },
      { k:'excl', nome:`Exclusividade ${ex.map(g => '{' + g.join(', ') + '}').join(' ') || '(nenhum grupo)'}`, bdg: ILU() },
      { k:'p07', nome:'P07 prioritária (documentação, s168)', bdg: PROP('s168') } ]; }
  /** Pacote do Otimizador: ótimo da configuração, custo de cada política (base = só a capacidade escolhida) e custo combinado. */
  function pacote(d, k){ const c = C(), rows = c.linhasCandidatas(d), O = optsDe(d, k, rows), base = optsDe(d, { cap:k.cap }, rows);
    return { c, rows, O, base, r: c.otimizar(d, O), custos: c.custosPolitica(d, base), comb: c.custoRestricao(d, base, O), cap: k.cap != null ? +k.cap : c.capacidadeTotal(d) }; }
  function resOtim(d, k, P){
    const r = P.r, lig = Object.keys(POLK).filter(x => k[x]), isol = lig.map(x => P.custos.find(p => p.id === POLK[x])).filter(Boolean);
    if(!r.viavel) return `<div class="card">${ui.callout('atencao', `<p>${esc(r.motivo || 'Nenhuma carteira atende a todas as restrições.')}</p>`, r.desligado ? 'Otimização exata desligada' : 'Sem carteira viável')}</div>`;
    const sIsol = soma(isol, p => p.custo), cb = P.comb.custo;
    const tipo = cb == null ? '' : lig.length < 2 ? '' : Math.abs(cb - sIsol) < 0.005 ? 'aditivo (igual à soma)' : cb < sIsol ? '<b>sub-aditivo</b> (menor que a soma)' : '<b>super-aditivo</b> (maior que a soma)';
    return `<div class="card stack">${ui.section('Carteira ótima da configuração atual', `O otimizador testou as ${fmt.n(r.avaliadas)} combinações possíveis ${DFP('Otimizador exato da trilha (§3.10): enumeração com desempate maior V → menor FTE → menor custo → menor risco → código')}`)}
      <div class="pf3-k">${kc('V* (valor ótimo)', n2(r.valor), '<span class="pf3-f" title="V* = soma dos valores N da melhor carteira">soma dos valores N da carteira</span>', B('R20'))}${kc('FTE', `${n1(r.fte)} <small>/ ${n1(r.cap)}</small>`, 'usados / capacidade efetiva', B('R24'))}
        ${kc('R$ mi', `${n2(r.custo)} <small>/ ${n2(r.orc)}</small>`, 'custo / orçamento', B('R24'))}${kc('Índice D', pp(r.D), 'distância do mix-alvo (discricionárias)', B('R28'))}${kc('Exposição', n2(r.exposicao), '<span class="pf3-f" title="ΣR·custo ÷ Σcusto">risco médio, pesado pelo custo</span>', DFP('Fórmula da trilha: exposição ponderada (I2.11)'))}</div>
      <div><span class="pf3-mini">Carteira:</span> ${idsH(r.ids)}</div>
      <div class="pf3-mini">${r.ids.map(id => `<b>${esc(id)}</b> ${esc(tit(d, id))}`).join(' · ')}</div>
      ${r.empateTecnico ? ui.callout('atencao', `<p>Empate técnico: a 2ª melhor carteira (${esc((r.segunda || {}).ids.join(', '))}) fica a ${n2(r.margem)} ponto(s) ${B('R23')}. O sistema mostra; quem escolhe é a instância.</p>`) : ''}
      ${lig.length ? `<p class="muted" style="margin:0">Restrições ligadas: V*(sem) ${n2(P.comb.vSem)} − V*(com) ${cb == null ? 'inviável' : n2(P.comb.vCom)} = <b class="lime">${n2(cb)}</b> pontos (${pc(P.comb.pct)}). Soma dos custos isolados: ${n2(sIsol)}. ${tipo}</p>` : '<p class="pf3-mini" style="margin:0">Nenhuma restrição extra ligada: esta é a carteira de referência (C0) para a capacidade escolhida.</p>'}
      <div class="row"><button class="btn btn-ghost btn-sm" data-o3-pqf>${icon('question', 14)} ${T.pqf ? 'Ocultar' : 'Por que ficou de fora?'}</button></div>
      ${T.pqf ? porQueForaHtml(d, P) : ''}</div>`;
  }
  function porQueForaHtml(d, P){ const lst = P.c.porQueFora(d, P.O);
    return tab(['Fora da carteira', ['Se forçar a entrada', 'wrap'], ['ΔV', 'r']], lst.map(x => [`<b>${esc(x.id)}</b> <small>${esc(tit(d, x.id))}</small>`,
      x.viavel ? `sai ${esc(x.saem.join(', ') || '—')}${x.entram.length ? '; entra ' + esc(x.entram.join(', ')) : ''}` : `não cabe: ${esc(x.motivo)}`, x.viavel ? n2(x.deltaV) : '—']), 'Todas as candidatas estão na carteira.'); }
  function custosHtml(d, k, P){
    const lig = Object.keys(POLK).filter(x => k[x]).map(x => POLK[x]), its = P.custos.filter(p => p.custo != null).map(p => ({ label:p.nome, value:Math.max(0, p.custo), color: lig.includes(p.id) ? 'lime' : 'olive', title:`${p.nome}: ${n2(p.custo)} pontos` }));
    return `<div class="card">${ui.section('Custo de cada restrição (isolada)', `Base: só a capacidade de ${n1(P.cap)} FTE e o orçamento; V*(sem) = ${n2((P.custos[0] || {}).vSem)}. Custo = V*(sem) − V*(com). Em lima, as ligadas ${B('R30')}`)}
      <div class="grid pf3-g pf3-g23" style="align-items:start"><div>${CH.hbar(its, { fmt:v => n2(v) })}</div>
      <div>${tab([['Política', 'wrap'], ['V* com ela', 'r'], ['Custo', 'r'], ['%', 'r'], ['Carteira', 'wrap']], P.custos.map(p => Object.assign([esc(p.nome), p.vCom == null ? 'inviável' : n2(p.vCom), `<b>${n2(p.custo)}</b>`, pc(p.pct), `<small>${esc((p.idsCom || []).join(', '))}</small>`], { cls: lig.includes(p.id) ? 'on' : '' })))}</div></div>
      <p class="pf3-mini" style="margin:8px 0 0">Reserva + mix e dependência + capacidade por gerência mostram por que custos de política não se somam. A política “Nova obrigatória P09” é o cenário C5 ${PROP('s127')}.</p></div>`;
  }
  function telaOtimizador(el, ctx){
    medalhas();
    const d = ctx.dados, abas = [['restricoes', 'Restrições & custos'], ['fronteira', 'Fronteira & Pareto'], ['capacidade', 'Capacidade local']], aba = abas.some(a => a[0] === ctx.route.query.aba) ? ctx.route.query.aba : 'restricoes';
    const k = cfg(), P = pacote(d, k);
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 3 · Regência', title:'Otimizador', sub:'A melhor combinação de candidatas P01–P08 que cabe nas restrições, quanto custa cada política e onde a capacidade aperta. O otimizador apoia a recomendação; quem decide é a instância.' }) +
      META(d) + ui.tabs('#/n3/otimizador', abas, aba) + '<div data-o3></div>';
    const host = el.querySelector('[data-o3]');
    if(aba === 'fronteira') abaFronteira(host, d, k, P); else if(aba === 'capacidade') abaCapacidade(host, d, k, P); else abaRestricoes(host, d, k, P);
  }
  function abaRestricoes(el, d, k, P){
    const c = P.c, capT = c.capacidadeTotal(d), f = T.salvarCen || (T.salvarCen = { nome:'', gatilho:'', erros:null });
    el.innerHTML = `<div class="grid g2 pf3-g" style="align-items:start"><div class="card stack">${ui.section('Restrições (chaves)', 'Ligue uma de cada vez e compare o V*: a diferença é o custo da política.')}
        <div class="pf3-cfg"><label class="fix"><input type="checkbox" checked disabled> Obrigatórias primeiro (P01) ${B('R12')}</label>
          <label class="fix"><input type="checkbox" checked disabled> Orçamento de R$ ${n2(c.orcamentoCiclo(d))} mi ${B('R24')}</label>
          ${chaves(d).map(x => `<label><input type="checkbox" data-o3-k="${x.k}" ${k[x.k] ? 'checked' : ''}> ${esc(x.nome)} ${x.bdg}</label>`).join('')}</div>
        <div class="pf3-sl"><label for="o3cap">Capacidade total</label><input id="o3cap" type="range" min="4" max="12" step="0.5" value="${P.cap}" data-o3-cap aria-label="Capacidade total em FTE"><b data-o3-capv>${n1(P.cap)} FTE</b>${B('R24')}</div>
        <div class="pf3-mini">Capacidade do ciclo: ${n1(capT)} FTE ${ILU()}${Math.abs(P.cap - capT) > EPS ? ` · <button class="btn-text" data-o3-capreset>voltar para ${n1(capT)} FTE</button>` : ''}</div>
        ${aula('Uma política vira <b>restrição</b> no otimizador. O <b>custo da restrição</b> é quanto o valor ótimo cai quando ela entra: V*(sem) − V*(com). Custos de política <b>não se somam</b>: duas políticas podem levar à mesma carteira, ou juntas custar mais que a soma. O número apoia a recomendação; a escolha é da instância.')}</div>
      <div data-o3-res>${resOtim(d, k, P)}</div></div>
      <div data-o3-custos style="margin-top:16px">${custosHtml(d, k, P)}</div>
      <div class="card stack" style="margin-top:16px">${ui.section('Salvar como cenário', 'Guarda a configuração atual (capacidade e chaves ligadas) como cenário próprio. O gatilho é obrigatório: o que, observado, faria este cenário acontecer?')}
        <form class="pf3-form" data-o3-form novalidate><label class="field">Nome do cenário *<input class="input" name="nome" maxlength="40" value="${esc(f.nome)}" placeholder="ex.: Mix + reserva">${err(f, 'nome')}</label>
          <label class="field">Gatilho observável * (mínimo 15 caracteres)<input class="input" name="gatilho" value="${esc(f.gatilho)}" placeholder="ex.: fórum aprova a política de mix">${err(f, 'gatilho')}</label>
          <div class="full row">${err(f, '_geral')}<span class="spacer"></span><button class="btn btn-primary btn-sm" type="submit">${icon('plus', 14)} Salvar como cenário</button></div></form></div>`;
    el.querySelectorAll('[data-o3-k]').forEach(x => x.onchange = () => { MS().cfg = Object.assign(cfg(), { [x.dataset.o3K]: x.checked }); PF.save(); PF.refresh(); });
    const sl = el.querySelector('[data-o3-cap]');
    sl.oninput = () => { const kk = Object.assign(cfg(), { cap:+sl.value }), PP = pacote(d, kk); PF.patch(el, '[data-o3-capv]', `${n1(+sl.value)} FTE`); PF.patch(el, '[data-o3-res]', resOtim(d, kk, PP)); PF.patch(el, '[data-o3-custos]', custosHtml(d, kk, PP)); };
    sl.onchange = () => { MS().cfg = Object.assign(cfg(), { cap: Math.abs(+sl.value - capT) < EPS ? null : +sl.value }); PF.save(); PF.refresh(); };
    el.onclick = e => { if(e.target.closest('[data-o3-pqf]')){ T.pqf = !T.pqf; PF.refresh(); return; }
      if(e.target.closest('[data-o3-capreset]')){ MS().cfg = Object.assign(cfg(), { cap:null }); PF.save(); PF.refresh(); } };
    const form = el.querySelector('[data-o3-form]');
    form.oninput = () => { f.nome = form.nome.value; f.gatilho = form.gatilho.value; };
    form.onsubmit = e => { e.preventDefault(); f.nome = form.nome.value.trim(); f.gatilho = form.gatilho.value.trim(); const er = {}, kk = cfg(), prem = optsDe(d, kk); delete prem.rows;
      if(kk.cap != null && Math.abs(kk.cap - capT) < EPS) delete prem.cap;
      if(!f.nome) er.nome = PF.msgHtml('REQUIRED', { campo:'o nome do cenário' });
      if(f.gatilho.length < 15) er.gatilho = PF.msgHtml('VALIDATION_ERROR', { texto:'O gatilho precisa ter pelo menos 15 caracteres (algo observável).' });
      if(!Object.keys(prem).length) er._geral = PF.msgHtml('VALIDATION_ERROR', { texto:'Ligue alguma chave ou mude a capacidade: assim o cenário seria igual à base C0.' });
      if(Object.keys(er).length){ f.erros = er; PF.refresh(); return; }
      const mud = [prem.cap != null ? `${n1(prem.cap)} FTE` : null, ...chaves(d).filter(x => kk[x.k]).map(x => x.nome)].filter(Boolean).join(' + ');
      const z = gravarCenario(d, { nome:f.nome, gatilho:f.gatilho, premissas:prem, mudanca:mud });
      T.salvarCen = null; PF.toast(`[SIMULAÇÃO] Cenário <b>${esc(z.id)}</b> salvo. Veja em Cenários & Robustez.`); PF.refresh(); };
  }
  /** Grava cenário próprio (append-only; fora da robustez: não altera o núcleo esperado). */
  function gravarCenario(d, o){ const n = 1 + Math.max(0, ...(d.cenarios || []).map(x => +(/^CX(\d+)$/.exec(x.id) || [])[1] || 0));
    const z = PF.append('cenarios', { id:'CX' + n, nome:o.nome, mudanca:o.mudanca, premissas:o.premissas, gatilho:o.gatilho, usoRobustez:false, proprio:true, origemRegra:'A_VALIDAR_FEG', criadoPor:autor(), nivel:3 });
    PF.append('historico', { entidade:'cenarios', entidadeId:z.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:z.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:`Cenário próprio ${z.id}: ${o.mudanca}. Gatilho: ${o.gatilho}` });
    return z; }
  const nMudancas = z => { const p = (z && z.premissas) || {}; return ['cap','orc','deps','maxD','gcap','reserva','pesos','forcar','proibir','excl','extras','obrig'].filter(k => p[k] != null && p[k] !== false && !(Array.isArray(p[k]) && !p[k].length)).length; };

  function abaFronteira(el, d, k, P){
    const c = P.c, s = MS(), rec = ['fte', 'custo', 'risco'].includes(s.paretoRec) ? s.paretoRec : 'fte';
    let fr = '';
    if(!s.front) fr = `<div class="card stack">${ui.section('Fronteira V* × FTE', 'Quanto valor cabe em cada capacidade, de 4 a 10,5 FTE (14 otimizações).')}<div><button class="btn btn-primary btn-sm" data-o3-front>${icon('chart', 14)} Calcular fronteira</button></div></div>`;
    else {
      const lig = Object.keys(POLK).some(x => k[x]), F = c.fronteira(d, { base:{ rows:P.rows } }), F2 = lig ? c.fronteira(d, { base: optsDe(d, Object.assign({}, k, { cap:null }), P.rows) }) : null;
      const xs = F.pontos.map(p => fmt.n(p.fte, 1)), vp = c.otimizar(d, Object.assign({}, P.base)).valor;
      const series = [{ name:'V* sem políticas', values:F.pontos.map(p => p.valor || 0), color:'lime' }].concat(F2 ? [{ name:'V* com as chaves ligadas', values:F2.pontos.map(p => p.valor || 0), color:'info', dash:true }] : []);
      fr = `<div class="card stack">${ui.section('Fronteira V* × FTE', `P01 obrigatória; o orçamento só restringe acima de 10,5 FTE. Linha tracejada vermelha: a proposta (${n1(P.cap)} FTE) ${B('R24')} ${B('R30')}`, `<button class="btn btn-ghost btn-sm" data-o3-front>Ocultar</button>`)}
        <div class="grid g2 pf3-g" style="align-items:start"><div>${CH.line(xs, series, { fmt:v => fmt.n(v, 0), refLine:{ value:vp || 0, label:`proposta ${n1(P.cap)} FTE: ${n2(vp)}` } })}</div>
        <div>${tab([['FTE', 'r'], ['V*', 'r'], 'Carteira'].concat(F2 ? [['V* com chaves', 'r']] : []), F.pontos.map((p, i) => Object.assign([n1(p.fte), n2(p.valor), idsH(p.ids)].concat(F2 ? [n2(F2.pontos[i].valor)] : []), { cls: Math.abs(p.fte - P.cap) < EPS ? 'on' : '' })))}</div></div>
        <h4 class="pf3-mini" style="margin:6px 0 0">Valor marginal por +0,5 FTE (I3.4)</h4>
        ${tab(['De → até', ['ΔV*', 'r'], 'Entra', 'Sai'], F.marginal.map((m, i) => { const a = F.pontos[i].ids, b = F.pontos[i + 1].ids; return Object.assign([`${n1(m.de)} → ${n1(m.ate)} FTE`, m.delta > EPS ? `<b>+${n2(m.delta)}</b>` : n2(m.delta), esc(b.filter(x => !a.includes(x)).join(', ') || '—'), esc(a.filter(x => !b.includes(x)).join(', ') || '—')], { cls: Math.abs(m.de - P.cap) < EPS ? 'on' : '' }); }))}
        <p class="pf3-mini" style="margin:0">Degraus: a seleção é inteira. Às vezes +0,5 FTE não deixa entrar ninguém (ΔV = 0); no passo seguinte cabe uma candidata inteira e o valor salta.</p></div>`;
    }
    const rows = P.rows.filter(r => !r.extra), nd = c.paretoIniciativas(d, rec, { rows }), g = r => rec === 'risco' ? r.R : r[rec], lbl = { fte:'FTE', custo:'R$ mi', risco:'risco R (P×I)' }[rec];
    const pts = rows.map(r => ({ x:g(r), y:r.N, r:1, label:r.id, id:r.id, color: nd.includes(r.id) ? 'lime' : 'dim', title:`${r.id}: N ${n2(r.N)} · ${lbl} ${n2(g(r))}${nd.includes(r.id) ? ' · não dominada' : ''}` }));
    el.innerHTML = fr + `<div class="card stack" style="margin-top:16px">${ui.section('Pareto por iniciativa', `Não dominada: nenhuma outra tem valor maior ou igual com recurso menor ou igual (e uma das duas estritamente melhor) ${B('R30')}`)}
      <div class="row">${[['fte', 'Valor × FTE'], ['custo', 'Valor × custo'], ['risco', 'Valor × risco']].map(([id, l]) => `<button class="chip ${id === rec ? 'on' : ''}" data-o3-par="${id}" aria-pressed="${id === rec}">${l}</button>`).join('')}</div>
      <div class="grid g2 pf3-g" style="align-items:start"><div>${CH.bubble(pts, { xLabel:lbl, yLabel:'valor N', fixedR:9, yMin:0, yMax:100, xMin:0, xFmt:v => fmt.n(v, rec === 'custo' ? 1 : 0) })}</div>
      <div>${tab(['Candidata', ['N', 'r'], [esc(lbl), 'r'], 'Pareto'], rows.slice().sort((a, b) => b.N - a.N).map(r => Object.assign([`<b title="${esc(tit(d, r.id))}">${esc(r.id)}</b>`, n2(r.N), n2(g(r)), nd.includes(r.id) ? '<b class="lime">não dominada</b>' : '<span class="dim">dominada</span>'], { cls: nd.includes(r.id) ? 'on' : '' })))}
        <p class="pf3-mini">Fronteira em ${esc(lbl)}: ${esc(nd.join(', '))}. A fronteira depende do recurso escasso.</p></div></div>
      ${aula('A <b>fronteira</b> mostra o melhor valor possível para cada capacidade; o <b>valor marginal</b> é quanto +0,5 FTE acrescenta. Como a seleção é inteira, o ganho vem em degraus. No <b>Pareto</b> por iniciativa, uma candidata é dominada quando outra entrega mais valor com menos recurso.')}</div>`;
    el.onclick = e => { const b = e.target.closest('[data-o3-front]'); if(b){ MS().front = !MS().front; PF.save(); PF.refresh(); return; }
      const p = e.target.closest('[data-o3-par]'); if(p){ MS().paretoRec = p.dataset.o3Par; PF.save(); PF.refresh(); } };
  }
  function abaCapacidade(el, d, k, P){
    const c = P.c, r = P.r, res = k.reserva ? +c.param(d, 'R27') : 0, ids = r.ids || [], ug = c.utilizacaoPorGerencia(d, ids, { rows:P.rows, reserva:res }), uc = c.utilizacaoPorComunidade(d, ids, { rows:P.rows });
    const F = c.param(d, 'R26'), pk = c.pessoaChave(d, null, { rows:P.rows }), pkc = c.pessoaChave(d, ids, { rows:P.rows }), sc = c.custoPorSourcing(d, ids, { rows:P.rows }), nomeS = x => (((d.catalogos || {}).classesSourcing || []).find(z => z.codigo === x) || {}).nome || (x === 'SEM_FERRAMENTA' ? 'Sem ferramenta' : x);
    const tone = f => ({ TANQUE:'bad', REDUZIR:'warn', ROADMAP:'lime', AUTONOMIA:'ok' })[f] || 'dim';
    el.innerHTML = `<div class="card stack">${ui.section(`Utilização por gerência (restrição) · carteira ${ids.join(', ') || '—'}`, `Faixas R26: acima de ${pc(F.tanqueAcimaDe, 0)} tanque; ${pc(F.reduzirAPartirDe, 0)}–${pc(F.tanqueAcimaDe, 0)} reduzir escopo; ${pc(F.roadmapAPartirDe, 0)}–${pc(F.reduzirAPartirDe, 0)} roadmap; abaixo, autonomia ${B('R26')} ${B('R24')}`,
        `<button class="btn ${k.reserva ? 'btn-primary' : 'btn-ghost'} btn-sm" data-o3-reserva aria-pressed="${!!k.reserva}">${icon('lock', 14)} ${k.reserva ? 'Reserva de 15% ligada' : 'Reservar 15% (s166)'}</button>`)}
      ${k.reserva ? `<p class="pf3-mini" style="margin:0">Com a reserva ${B('R27')}, cada capacidade fica ×${fmt.n(1 - res, 2)} e o otimizador usa ${n1(c.capacidadeComReserva(d, res))} FTE.</p>` : ''}
      <div class="grid g2 pf3-g" style="align-items:start"><div>${CH.hbar(ug.map(g => ({ label:g.gerenciaId, value:g.u == null ? 0 : g.u, mark:1, markTitle:'100% da capacidade', color:tone(g.faixa && g.faixa.id), title:`${g.gerenciaId}: ${g.u == null ? 'sem capacidade' : pc(g.u)}` })), { fmt:v => pc(v, 0) })}</div>
      <div>${tab(['Gerência', ['FTE', 'r'], ['Capacidade', 'r'], ['Uso', 'r'], ['Faixa R26 (ação)', 'wrap']], ug.map(g => [`<b>${esc(g.gerenciaId)}</b>`, n1(g.fte), n1(g.cap), g.u == null ? 'sem capacidade' : `<b>${pc(g.u)}</b>`, g.faixa ? `${ui.pill(FX[g.faixa.id] || g.faixa.id, tone(g.faixa.id))} <small>${esc(g.faixa.acao)}</small>` : '—']))}</div></div>
      ${aula('<b>FTE não é fungível</b>: competência elétrica não substitui energética. No agregado sobra capacidade, mas a FEN e a FEG estouram enquanto a FEL fica parada. Balancear entre comunidades é atribuição do Gerente de Área (s12, proposta) e pode exigir tanque de terceiros (s165). Ligue “Capacidade por gerência” em Restrições & custos para ver o custo dessa política.')}</div>
      <div class="grid g2 pf3-g" style="margin-top:16px;align-items:start"><div class="card stack">${ui.section('Utilização por comunidade (informativa)', `Só referência: a restrição do N3 é por gerência ${B('R24')}`)}
        ${tab(['Comunidade', ['FTE', 'r'], ['Capacidade', 'r'], ['Uso', 'r']], uc.filter(x => x.fte > 0 || x.cap > 0).map(x => [esc(x.comunidadeId), n1(x.fte), n1(x.cap), x.u == null ? (x.fte > 0 ? 'sem capacidade' : '—') : pc(x.u)]))}</div>
      <div class="card stack">${ui.section('Concentração: pessoa-chave e sourcing', `Pessoa-chave K (fictícia) ${ILU()} · classes de sourcing ${B('R40')}`)}
        <div class="pf3-k">${kc('Candidatas com K', pc(pk.valor), `${pk.n} de ${pk.total}: ${esc(pk.ids.join(', '))}`, DFP('I3.15: count(i com K) ÷ n'))}${kc('Carteira com K', pc(pkc.valor), `${pkc.n} de ${pkc.total}`, DFP('I3.15 sobre a carteira'))}</div>
        ${CH.stack(Object.keys(sc.pct).map((x, i) => ({ label:nomeS(x), value:sc.pct[x] || 0, color:['lime', 'info', 'olive', 'warn'][i % 4] })))}
        ${tab(['Classe da ferramenta', ['% do custo', 'r'], 'Iniciativas'], Object.keys(sc.pct).map(x => [esc(nomeS(x)), pc(sc.pct[x]), esc(sc.porClasse[x].join(', '))]))}
        <p class="pf3-mini" style="margin:0">Diretrizes por classe (núcleo crítico, periférico, mercado, legado) são proposta do deck ${PROP('s231–s235')}. Muitas candidatas dependem da mesma pessoa: é risco sistêmico, não de uma iniciativa só.</p></div></div>`;
    el.onclick = e => { if(e.target.closest('[data-o3-reserva]')){ MS().cfg = Object.assign(cfg(), { reserva: !cfg().reserva }); PF.save(); PF.refresh(); } };
  }

  /* ================================================================== CENÁRIOS & ROBUSTEZ */
  const FATORES = [
    { id:'cap', nome:'Capacidade total (FTE)', tipo:'num', ph:'ex.: 9', min:1, max:20, regra:'R24' },
    { id:'orc', nome:'Orçamento (R$ mi)', tipo:'num', ph:'ex.: 3,5', min:0.5, max:10, regra:'R24' },
    { id:'deps', nome:'Confirmar a dependência lógica (P08 ⇒ P02)', tipo:'nada', regra:'R09' },
    { id:'maxD', nome:'Mix: D máximo (pp)', tipo:'num', ph:'ex.: 20', min:0, max:100, regra:'R28' },
    { id:'gcap', nome:'Capacidade por gerência', tipo:'nada', regra:'R24' },
    { id:'reserva', nome:'Reserva de capacidade (%)', tipo:'num', ph:'ex.: 20', min:0, max:50, regra:'R27' },
    { id:'pesoC4', nome:'Peso de C4 (%), com os demais reajustados na mesma proporção', tipo:'num', ph:'ex.: 25', min:0, max:95, regra:'R20' },
    { id:'proibir', nome:'Retirar uma candidata', tipo:'ini', regra:'R24' },
    { id:'forcar', nome:'Forçar uma candidata', tipo:'ini', regra:'R24' } ];
  function premissaDe(d, f, v, alvo){ const c = C();
    switch(f){ case 'cap': return { cap:v }; case 'orc': return { orc:v }; case 'deps': return { deps:c.depsLogicas(d) }; case 'maxD': return { maxD:v / 100 }; case 'gcap': return { gcap:true };
      case 'reserva': return { reserva:v / 100 }; case 'pesoC4': return { pesos:{ C4:v / 100 } }; case 'proibir': return { proibir:[alvo] }; case 'forcar': return { forcar:[alvo] }; default: return {}; } }
  function telaCenarios(el, ctx){
    medalhas();
    const d = ctx.dados, c = C(), rows = c.linhasCandidatas(d), cens = (d.cenarios || []).slice(), res = cens.map(x => c.cenario(d, x, { rows })), rob = c.robustez(d), rob7 = c.robustez(d, { incluir:['C7'] }), lim = rob.limiar;
    const proprio = x => !!x.proprio || !byId(PF.base.cenarios, x.id), ext = Array.from(new Set(res.flatMap(r => r.ids))).filter(id => !rows.some(r => r.id === id)).sort();
    const linhasIds = rows.map(r => r.id).concat(ext), f = T.cen || (T.cen = { fator:'cap', valor:'', alvo:'', nome:'', gatilho:'', erros:null }), fat = FATORES.find(x => x.id === f.fator) || FATORES[0];
    const cmp = Object.assign({ a:'C0', b:'C1' }, MS().cmp || {}), ra = res[cens.findIndex(x => x.id === cmp.a)] || res[0], rb = res[cens.findIndex(x => x.id === cmp.b)] || res[1] || res[0];
    const valorTxt = (x, r) => `${r.valor == null ? 'inviável' : n2(r.valor)}${(x.premissas || {}).pesos ? ' <small class="pf3-nota">outra escala: não comparar</small>' : ''}${((x.premissas || {}).extras || []).length ? ` <small class="pf3-nota">+ ${esc(x.premissas.extras.map(e => e.id).join(', '))} (não pontuada)</small>` : ''}`;
    const uso = x => `<div class="pf3-uso">${x.usoRobustez ? ui.pill('Robustez', 'ok') : proprio(x) ? `${ui.pill('Cenário próprio', 'info')}<small>fora do núcleo esperado</small>` : `${ui.pill('Fora da robustez', 'warn')}<small>política/estresse: avalie pelo custo</small>`}</div>`;
    const curto = (t, n = 90) => { t = String(t || '—'); return t.length > n ? `<span class="pf3-f" title="${esc(t)}">${esc(t.slice(0, n).replace(/\s+\S*$/, ''))}…</span>` : esc(t); };
    const cols = cens.map(x => x.id).concat(['Freq. C0–C6', 'Com C7', 'Núcleo']);
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 3 · Regência', title:'Cenários & Robustez', sub:'Cada cenário muda uma premissa e tem um gatilho observável. A robustez mede com que frequência cada candidata aparece no ótimo dos cenários de incerteza (C0–C6).' }) + META(d) +
      `<div class="card stack">${ui.section('Cenários e carteira ótima', `Gatilhos a validar ${AVF('Cenários semente da trilha (§4.17): gatilhos a validar pela FEG')} · dados ${ILU()}`)}
        ${tab([['Cenário', 'wrap'], ['Mudança', 'wrap'], ['Gatilho observável', 'wrap'], 'Carteira ótima', ['FTE', 'r'], ['R$ mi', 'r'], ['Valor', 'r'], ['D', 'r']], cens.map((x, i) => { const r = res[i];
          return [`<b>${esc(x.id)}</b> <small>${esc(x.nome)}</small>${uso(x)}`, curto(x.mudanca), curto(x.gatilho), r.viavel ? idsH(r.ids, res[0].ids) : '<span class="pf3-no">inviável</span>', n1(r.fte), n2(r.custo), valorTxt(x, r), pp(r.D)]; }))}
        <p class="pf3-mini" style="margin:0">Em azul, quem entra em relação a C0. C3 muda os pesos (valor em outra escala); C5 inclui P09 = D2 qualificada (re-estimativa em FTE; o app não converte horas, R25 = null).</p></div>
      <div class="card stack" style="margin-top:16px">${ui.section('Matriz iniciativa × cenário e núcleo robusto', `Núcleo robusto: frequência ≥ ${pc(lim, 0)} em C0–C6 ${B('R32')} · fórmula ${refM('frequência de seleção')}`)}
        ${CH.heat(linhasIds, cols, (ri, ci) => { const id = linhasIds[ri];
          if(ci < cens.length){ const on = res[ci].ids.includes(id); return { v:on ? 0.8 : 0, text:on ? '✓' : '·', title:`${id} ${on ? 'está' : 'não está'} no ótimo de ${cens[ci].id}` }; }
          const fq = (ci === cens.length ? rob : rob7).frequencia[id]; if(ci < cens.length + 2) return fq ? { v:fq.pct, text:pcx(fq.pct), title:`${fq.n} de ${fq.total} cenários` } : { v:0, text:'—', title:'fora das candidatas' };
          return rob.nucleo.includes(id) ? { v:1, text:'núcleo', title:`frequência ≥ ${pc(lim, 0)}` } : { v:0, text:'', title:'fora do núcleo' }; })}
        <p class="muted" style="margin:0">Núcleo robusto (C0–C6): <b class="lime">${esc(rob.nucleo.join(', ') || 'nenhuma')}</b>. Com C7 na conta: ${esc(rob7.nucleo.join(', '))}. Cenários próprios aparecem em coluna separada e não mudam o núcleo esperado.</p></div>
      <div class="grid g2 pf3-g" style="margin-top:16px;align-items:start">
        <div class="card stack">${ui.section('Criar cenário', 'Copia a base e muda <b>um</b> fator. Fica fora da robustez.')}
          <form class="pf3-form" data-c3-form novalidate>
            <label class="field full"><span>Fator que muda * ${B(fat.regra)}</span><select class="select" name="fator">${FATORES.map(x => `<option value="${x.id}" ${x.id === f.fator ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
            ${fat.tipo === 'num' ? `<label class="field">Novo valor *<input class="input" name="valor" inputmode="decimal" value="${esc(f.valor)}" placeholder="${esc(fat.ph)}">${err(f, 'valor')}</label>` : ''}
            ${fat.tipo === 'ini' ? `<label class="field">Candidata *<select class="select" name="alvo"><option value="">Escolha…</option>${rows.map(r => `<option value="${r.id}" ${r.id === f.alvo ? 'selected' : ''}>${esc(r.id)} · ${esc(tit(d, r.id))}</option>`).join('')}</select>${err(f, 'alvo')}</label>` : ''}
            ${fat.tipo === 'nada' ? '<p class="pf3-mini full" style="margin:0">Este fator não pede valor: liga a restrição.</p>' : ''}
            <label class="field">Nome *<input class="input" name="nome" maxlength="40" value="${esc(f.nome)}" placeholder="ex.: Orçamento menor">${err(f, 'nome')}</label>
            <label class="field full">Gatilho observável * (mínimo 15 caracteres)<input class="input" name="gatilho" value="${esc(f.gatilho)}" placeholder="ex.: corte de 0,5 mi aprovado no orçamento">${err(f, 'gatilho')}</label>
            <div class="full row"><span class="spacer"></span><button class="btn btn-primary btn-sm" type="submit">${icon('plus', 14)} Criar cenário</button></div></form></div>
        <div class="card stack">${ui.section('Comparar dois cenários', '')}
          <div class="row">${['a', 'b'].map(k => `<label class="field" style="flex:1 1 140px">Cenário ${k.toUpperCase()}<select class="select" data-c3-cmp="${k}">${cens.map(x => `<option value="${x.id}" ${x.id === cmp[k] ? 'selected' : ''}>${esc(x.id)} · ${esc(x.nome)}</option>`).join('')}</select></label>`).join('')}</div>
          <div class="pf3-cmp">${tab(['', esc(ra.cenarioId), esc(rb.cenarioId)], [['Carteira', idsH(ra.ids), idsH(rb.ids, ra.ids)], ['FTE', n1(ra.fte), n1(rb.fte)], ['R$ mi', n2(ra.custo), n2(rb.custo)], ['Valor', n2(ra.valor), n2(rb.valor)], ['Índice D', pp(ra.D), pp(rb.D)],
            ['Entram em B', '', esc(rb.ids.filter(x => !ra.ids.includes(x)).join(', ') || '—')], ['Saem em B', '', esc(ra.ids.filter(x => !rb.ids.includes(x)).join(', ') || '—')]])}</div></div></div>
      <div style="margin-top:16px">${aula('Um <b>cenário</b> muda uma premissa por vez e tem um <b>gatilho</b> observável (o que, se acontecer, torna o cenário real). A <b>robustez</b> mede incerteza: quem aparece no ótimo de C0–C6 em pelo menos 80% das vezes forma o núcleo. C7 e C8 são políticas: avalie pelo custo, não pela frequência.')}</div>`;
    el.querySelectorAll('[data-c3-cmp]').forEach(s => s.onchange = () => { MS().cmp = Object.assign({}, cmp, { [s.dataset.c3Cmp]: s.value }); PF.save(); PF.refresh(); });
    const form = el.querySelector('[data-c3-form]');
    const ler = () => { ['valor', 'alvo', 'nome', 'gatilho'].forEach(k => { if(form[k]) f[k] = form[k].value; }); };
    form.oninput = ler;
    form.fator.onchange = () => { ler(); f.fator = form.fator.value; f.valor = ''; f.alvo = ''; f.erros = null; PF.refresh(); };
    form.onsubmit = e => { e.preventDefault(); ler(); const er = {}, v = num(f.valor);
      if(fat.tipo === 'num' && (v == null || v < fat.min || v > fat.max)) er.valor = PF.msgHtml('VALIDATION_ERROR', { texto:`Informe um número entre ${fmt.n(fat.min, 1)} e ${fmt.n(fat.max)}.` });
      if(fat.tipo === 'ini' && !f.alvo) er.alvo = PF.msgHtml('REQUIRED', { campo:'a candidata' });
      if(!String(f.nome).trim()) er.nome = PF.msgHtml('REQUIRED', { campo:'o nome' });
      if(String(f.gatilho).trim().length < 15) er.gatilho = PF.msgHtml('VALIDATION_ERROR', { texto:'O gatilho precisa ter pelo menos 15 caracteres (algo observável).' });
      if(Object.keys(er).length){ f.erros = er; PF.refresh(); return; }
      const prem = premissaDe(d, fat.id, v, f.alvo), mud = `${fat.nome}${fat.tipo === 'num' ? ': ' + fmt.n(v, 2) : fat.tipo === 'ini' ? ': ' + f.alvo : ''}`;
      const z = gravarCenario(d, { nome:String(f.nome).trim(), gatilho:String(f.gatilho).trim(), premissas:prem, mudanca:mud });
      T.cen = null; PF.toast(`[SIMULAÇÃO] Cenário <b>${esc(z.id)}</b> criado (uma mudança: ${esc(mud)}).`); PF.refresh(); };
  }

  /* ================================================================== SENSIBILIDADE & AHP */
  function telaSensibilidade(el, ctx){
    medalhas();
    const d = ctx.dados, abas = [['sens', 'Sensibilidade'], ['ahp', 'Aprofundamento: AHP']], aba = abas.some(a => a[0] === ctx.route.query.aba) ? ctx.route.query.aba : 'sens';
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 3 · Regência', title:'Sensibilidade', sub:'E se os pesos fossem outros? Veja quando o ranking muda, quando a seleção muda e em que peso uma candidata passa a outra.' }) + META(d) + ui.tabs('#/n3/sensibilidade', abas, aba) + '<div data-s3></div>';
    const host = el.querySelector('[data-s3]');
    if(aba === 'ahp') abaAhp(host, d); else abaSens(host, d);
  }
  const sensSt = d => { const s = MS().sens || {}, w = C().pesosEfetivos(d), k = w[s.k] != null ? s.k : 'C4'; return { k, v: s.v != null && s.k === k ? +s.v : w[k], w }; };
  function resSens(d, k, v){
    const c = C(), w = c.pesosEfetivos(d), S = c.sensibilidade(d, { [k]:v }), base = c.ranking(d), pos = {}; base.forEach(r => pos[r.id] = r);
    return `<div class="grid g2 pf3-g" style="align-items:start"><div class="stack">
        ${tab(['Critério', ['Peso vigente', 'r'], ['Novo peso', 'r']], Object.keys(w).map(j => Object.assign([`${esc(j)}${j === k ? ' <small>ajustado</small>' : ''}`, pc(w[j]), `<b>${pc(S.pesos[j])}</b>`], { cls: j === k ? 'on' : '' })))}
        <div class="row">${ui.pill(`ρ = ${n3(S.rho)}`, 'lime')}${refM('Spearman')}${S.rankingMudou ? ui.pill('Ranking mudou', 'warn') : ui.pill('Ranking igual', 'ok')}${S.selecaoMudou ? ui.pill('Seleção mudou', 'bad') : ui.pill('Seleção igual', 'ok')}</div>
        <div class="pf3-mini">Seleção ótima com os novos pesos: ${idsH(S.selecao, S.selecaoBase)} · valor ${n2(S.valor)}${Math.abs(v - w[k]) > 0.0005 ? ' (nova escala: não compare com o V* vigente)' : ''}. Seleção com os pesos vigentes: ${esc(S.selecaoBase.join(', '))}.</div>
        ${S.empateTecnico ? ui.callout('atencao', `<p><b>Empate técnico:</b> a 2ª melhor carteira (${esc(((S.segunda || {}).ids || []).join(', '))}) fica a ${n2(S.margem)} ponto(s) ${B('R23')}. Diferença dentro do ruído das notas: o sistema mostra e não escolhe.</p>`) : ''}</div>
      <div>${tab([['Nova pos.', 'r'], 'Candidata', ['N novo', 'r'], ['N vigente', 'r'], ['Pos. vigente', 'r']], S.ranking.map(r => { const b = pos[r.id] || {}, dp = (b.posicao || 0) - r.posicao;
        return Object.assign([`${r.posicao}${dp ? ` <small class="${dp > 0 ? 'pf3-ok' : 'pf3-no'}">${dp > 0 ? '▲' : '▼'}${Math.abs(dp)}</small>` : ''}`, `<b>${esc(r.id)}</b>`, n2(r.N), n2(b.N), b.posicao || '—'], { cls: S.selecao.includes(r.id) ? 'on' : '' }); }))}
        <p class="pf3-mini">Em destaque, as selecionadas com os novos pesos.</p></div></div>`;
  }
  function abaSens(el, d){
    const c = C(), st = sensSt(d), rows = c.linhasCandidatas(d), par = Object.assign({ a:'P05', b:'P06' }, MS().par || {}), L = c.limiarReversao(d, par.a, par.b, st.k), f = T.cand || (T.cand = { just:'', erros:null });
    const limTxt = L.limiar == null ? esc(L.motivo || 'Sem limiar.') : !L.valido ? `Com ${esc(st.k)}, a ordem entre ${esc(par.a)} e ${esc(par.b)} não se inverte entre 0% e 100% (ponto matemático: ${pc(L.limiar)}).`
      : `<b>${esc(par.a)}</b> passa <b>${esc(par.b)}</b> quando ${esc(st.k)} ${L.sentido === 'ACIMA' ? '>' : '<'} <b class="lime">${pc(L.limiar)}</b> (hoje ${pc(L.pesoAtual, 0)}; ${L.jaPassa ? 'já passa' : 'ainda não passa'}).`;
    const varr = MS().varr ? c.varreduraPesos(d) : null, mudou = Math.abs(st.v - st.w[st.k]) > 0.0005;
    el.innerHTML = `<div class="card stack">${ui.section('Ajuste um peso', `Os demais pesos são reajustados na mesma proporção para a soma continuar 100% (<span class="pf3-f" title="w′ⱼ = wⱼ · (1 − w′ₖ) ÷ (1 − wₖ)">fórmula</span>) ${B('R20')} · versão vigente ${esc(versaoPesos(d))}`)}
        <div class="row">${Object.keys(st.w).map(j => `<button class="chip ${j === st.k ? 'on' : ''}" data-s3-k="${j}" aria-pressed="${j === st.k}">${esc(j)}</button>`).join('')}<span class="pf3-mini">${esc(((c.param(d, 'R19') || []).find(x => x.id === st.k) || {}).nome || '')}</span></div>
        <div class="pf3-sl"><label for="s3w">Peso de ${esc(st.k)}</label><input id="s3w" type="range" min="0" max="0.8" step="0.01" value="${st.v}" data-s3-w aria-label="Peso de ${esc(st.k)}"><b data-s3-wv>${pc(st.v, 0)}</b>${mudou ? `<button class="btn-text" data-s3-reset>voltar para ${pc(st.w[st.k], 0)}</button>` : ''}</div>
        <div data-s3-res>${resSens(d, st.k, st.v)}</div></div>
      <div class="grid g2 pf3-g" style="margin-top:16px;align-items:start"><div class="card stack">${ui.section('Limiar de reversão', `Menor peso de ${esc(st.k)} (com os demais reajustados) em que a primeira passa a segunda ${DFP('Fórmula da trilha (I3.6): diferença(t) = t·Δk + (1 − t)·Δdemais; o limiar zera a diferença')}`)}
          <div class="row">${['a', 'b'].map(k => `<label class="field" style="flex:1 1 140px">${k === 'a' ? 'Candidata que sobe' : 'Candidata que é passada'}<select class="select" data-s3-par="${k}">${rows.map(r => `<option value="${r.id}" ${r.id === par[k] ? 'selected' : ''}>${esc(r.id)}</option>`).join('')}</select></label>`).join('')}</div>
          <p style="margin:0">${limTxt}</p><p class="pf3-mini" style="margin:0">Deslize o peso acima para conferir: no limiar, as duas empatam em S.</p></div>
        <div class="card stack">${ui.section('Varredura ±15 pp por peso', `Onde a seleção ótima muda (passo de 5 pp) ${B('R20')}`, `<button class="btn btn-ghost btn-sm" data-s3-varr>${varr ? 'Ocultar' : 'Varrer'}</button>`)}
          ${varr ? (varr.mudancas.length ? tab(['Peso', ['Valor', 'r'], 'Entram', 'Saem'], varr.mudancas.map(m => [`${esc(m.criterio)} = ${pc(m.peso, 0)}`, n2(m.valor), esc(m.entram.join(', ')), esc(m.saem.join(', '))])) : '<p class="muted">A seleção não muda em nenhum ponto da varredura.</p>') + `<p class="pf3-mini" style="margin:0">${varr.itens.length} combinações testadas; a seleção muda em ${varr.mudancas.length}.</p>` : '<p class="pf3-mini" style="margin:0">Testa cada peso de −15 a +15 pp e reotimiza.</p>'}</div></div>
      <div class="card stack" style="margin-top:16px">${ui.section('Salvar como versão candidata de pesos', `Grava uma NOVA versão de R20 ${B('R20')} com vigente = não, status A validar e vigência a partir do ciclo 2028. A v1 continua valendo para o Ciclo Exemplo 2027 e para a fotografia FR-CICLO ${B('R35')}`)}
        ${mudou ? `<form class="pf3-form" data-s3-form novalidate><label class="field full">Justificativa * (mínimo 20 caracteres)<textarea class="input" name="just" rows="2" placeholder="Por que este peso merece ser discutido para o próximo ciclo?">${esc(f.just)}</textarea>${err(f, 'just')}</label>
          <div class="full row"><span class="pf3-mini">Pesos: ${Object.keys(st.w).map(j => `${esc(j)} ${pc(c.renormalizar(st.w, { [st.k]:st.v })[j])}`).join(' · ')}</span><span class="spacer"></span><button class="btn btn-primary btn-sm" type="submit">${icon('plus', 14)} Salvar versão candidata</button></div></form>` : '<p class="pf3-mini" style="margin:0">Mova o peso para habilitar.</p>'}
        ${candidatasHtml(d)}</div>
      <div style="margin-top:16px">${aula('<b>Sensibilidade</b> testa se a escolha se sustenta quando os pesos mudam. O ranking pode mudar sem a seleção mudar; o ρ de <b>Spearman</b> mede quanto os dois rankings concordam (1 = igual). O <b>limiar de reversão</b> é o peso a partir do qual uma candidata passa outra. Subir um peso até “a favorita entrar” é manipulação: registre como versão candidata.')}</div>`;
    const sl = el.querySelector('[data-s3-w]');
    sl.oninput = () => { const v = +sl.value; PF.patch(el, '[data-s3-wv]', pc(v, 0)); PF.patch(el, '[data-s3-res]', resSens(d, st.k, v)); };
    sl.onchange = () => { MS().sens = { k:st.k, v:+sl.value }; PF.save(); PF.refresh(); };
    el.querySelectorAll('[data-s3-par]').forEach(s => s.onchange = () => { MS().par = Object.assign({}, par, { [s.dataset.s3Par]: s.value }); PF.save(); PF.refresh(); });
    el.onclick = e => { const k = e.target.closest('[data-s3-k]'); if(k){ MS().sens = { k:k.dataset.s3K, v:null }; PF.save(); PF.refresh(); return; }
      if(e.target.closest('[data-s3-reset]')){ MS().sens = { k:st.k, v:null }; PF.save(); PF.refresh(); return; }
      if(e.target.closest('[data-s3-varr]')){ MS().varr = !MS().varr; PF.save(); PF.refresh(); } };
    const form = el.querySelector('[data-s3-form]');
    if(form){ form.oninput = () => { f.just = form.just.value; };
      form.onsubmit = e => { e.preventDefault(); f.just = form.just.value.trim(); if(f.just.length < 20){ f.erros = { just:PF.msgHtml('JUSTIFICATIVA', { min:20 }) }; PF.refresh(); return; }
        const n = gravarCandidata(d, c.renormalizar(st.w, { [st.k]:st.v }), { fonte:'SENSIBILIDADE', sens:{ criterio:st.k, peso:st.v } }, f.just);
        T.cand = null; PF.toast(`[SIMULAÇÃO] Versão candidata <b>${esc(n.rotuloVersao)}</b> de R20 salva (não vigente). A v1 continua valendo.`); PF.refresh(); }; }
  }
  /** Nova versão CANDIDATA de R20: vigente:false, A_VALIDAR, vigência 2028 (não altera a v1 nem a fotografia; R35). */
  function gravarCandidata(d, pesos, extra, just){
    const c = C(), atual = c.regra(d, 'R20'), rs = (d.regras || []).filter(r => r.codigo === 'R20'), v = Math.max(1, ...rs.map(r => +r.versao || 1)) + 1;
    const valor = Object.assign({}, pesos);           // precisão completa: arredondar só na exibição (§3.10)
    const base = c.clone(atual || {}); delete base.registradoEm; delete base.usuarioId;
    const n = PF.append('regras', Object.assign(base, { id:`R20-cand-v${v}`, codigo:'R20', versao:v, rotuloVersao:'v' + v, valor, vigente:false, statusValidacao:'A_VALIDAR', origemRegra:'A_VALIDAR_FEG', tipoFonte:'PREMISSA_ILUSTRATIVA',
      referencia:`Versão candidata criada no exercício do N3 (${extra.fonte === 'AHP' ? 'AHP' : 'sensibilidade'}); não vale para o Ciclo Exemplo 2027 nem para a fotografia FR-CICLO (R35)`,
      vigenciaDesde:'2028-01-01', vigencia:'a partir do ciclo 2028 (candidata; a validar FEG)', candidata:true, fonteCandidata:extra.fonte, ahp:extra.ahp || null, sensibilidade:extra.sens || null,
      atualizadoPor:autor(), atualizadoEm:hoje(), justificativa:just, versaoAnteriorId:atual ? atual.id : null, nivel:3 }));
    PF.append('historico', { entidade:'regras', entidadeId:n.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:n.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:`Versão candidata ${n.rotuloVersao} de R20 (${extra.fonte}): ${just}` });
    return n;
  }
  function candidatasHtml(d){ const rs = (d.regras || []).filter(r => r.codigo === 'R20').slice().sort((a, b) => (a.versao || 1) - (b.versao || 1));
    return tab(['Versão', 'Situação', ['Pesos C1–C5', 'wrap'], 'Origem', 'Vigência'], rs.map(r => [`<b>${esc(r.rotuloVersao || 'v' + (r.versao || 1))}</b>`, r.vigente === false ? `${ui.pill('Não vigente', 'warn')}<small>${r.candidata ? 'candidata · não usada na fotografia FR-CICLO' : esc(r.statusValidacao || '')}</small>` : ui.pill('Vigente', 'ok'),
      esc(Object.keys(r.valor || {}).map(k => `${k} ${fmt.n(r.valor[k] * 100, 1)}%`).join(' · ')), `${esc(r.fonteCandidata || 'semente')}${r.ahp ? ` <small>CR ${n3(r.ahp.CR)}</small>` : ''}`, esc(r.vigencia || 'Ciclo Exemplo 2027')])); }

  const SAATY = [9, 8, 7, 6, 5, 4, 3, 2, 1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8, 1 / 9];
  const saatyLbl = v => v >= 1 ? String(Math.round(v)) : '1/' + Math.round(1 / v);
  const snap = v => SAATY.reduce((b, x) => Math.abs(Math.log(x) - Math.log(v)) < Math.abs(Math.log(b) - Math.log(v)) ? x : b, 1);
  const CRIT = ['C1', 'C2', 'C3', 'C4', 'C5'];
  function presetAhp(d, id){ const ex = byId(d.ahpExemplos, id) || byId(PF.base.ahpExemplos, id), m = {};
    ex.criterios.forEach((a, i) => ex.criterios.forEach((b, j) => { if(j > i) m[a + '|' + b] = snap(ex.matriz[i][j]); })); return { crit:ex.criterios.slice(), m, preset:id }; }
  const ahpSt = d => { const s = MS().ahp; return s && Array.isArray(s.crit) && s.crit.length >= 3 ? s : presetAhp(d, 'M1'); };
  const matrizDe = s => s.crit.map((a, i) => s.crit.map((b, j) => i === j ? 1 : j > i ? (s.m[a + '|' + b] || 1) : 1 / (s.m[b + '|' + a] || 1)));
  /** Pesos AHP no vetor completo: os critérios da matriz dividem entre si a soma que tinham na versão vigente; os demais mantêm o peso. */
  function pesosDoAhp(d, s){ const c = C(), w = c.pesosEfetivos(d), r = c.ahp(matrizDe(s)), tot = soma(s.crit, k => w[k]), o = Object.assign({}, w); s.crit.forEach((k, i) => o[k] = r.pesos[i] * tot); return { r, pesos:o, w }; }
  function abaAhp(el, d){
    const c = C(), s = ahpSt(d), M = matrizDe(s), A = pesosDoAhp(d, s), r = A.r, ok = r.CR < 0.10 - EPS, S = c.sensibilidade(d, A.pesos), f = T.ahp || (T.ahp = { just:'', erros:null });
    el.innerHTML = `<div class="card stack">${ui.section('Matriz de comparação par a par (Saaty)', `Quanto o critério da linha é mais importante que o da coluna (1 = igual; 9 = extremamente). Os recíprocos são automáticos ${refM('Saaty (AHP)')} ${B('R30')}`)}
        <div class="row"><span class="tag fonte-ILUSTRATIVO pf3-tagw">Aprofundamento · não conta para o desbloqueio</span>${['M1', 'M2', 'EQUIPE'].map(id => `<button class="chip ${s.preset === id ? 'on' : ''}" data-a3-p="${id}">${esc((byId(d.ahpExemplos, id) || {}).nome || id)}</button>`).join('')}</div>
        <div class="row"><span class="pf3-mini">Critérios (3 a 5):</span>${CRIT.map(k => `<label class="pf3-chk"><input type="checkbox" data-a3-c="${k}" ${s.crit.includes(k) ? 'checked' : ''}> ${k}</label>`).join('')}</div>
        <div class="grid g2 pf3-g" style="align-items:start"><div class="tbl-wrap"><table class="tbl pf3-mat"><thead><tr><th></th>${s.crit.map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>${s.crit.map((a, i) => `<tr><th>${a}</th>${s.crit.map((b, j) =>
          `<td>${i === j ? '1' : j > i ? `<select class="select" data-a3-m="${a}|${b}" aria-label="${a} comparado a ${b}">${SAATY.map(v => `<option value="${v}" ${Math.abs(v - M[i][j]) < 1e-9 ? 'selected' : ''}>${saatyLbl(v)}</option>`).join('')}</select>` : `<span class="dim">${saatyLbl(M[i][j])}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="stack">${tab(['Critério', ['Peso AHP', 'r'], ['Peso aplicado', 'r'], ['Vigente', 'r']], CRIT.map(k => { const i = s.crit.indexOf(k); return [esc(k), i >= 0 ? n3(r.pesos[i]) : '—', pc(A.pesos[k]), pc(A.w[k])]; }))}
          <div class="pf3-k">${kc('λmax', n3(r.lambdaMax), `n = ${s.crit.length}`, B('R30'))}${kc('CI', fmt.n(r.CI, 4), '(λmax − n) ÷ (n − 1)', B('R30'))}${kc('CR', n3(r.CR), `CI ÷ RI (RI ${fmt.n(r.RI, 2)})`, B('R30'))}</div>
          ${ok ? ui.callout('dica', `<p>CR ${n3(r.CR)} &lt; 0,10: julgamentos consistentes.</p>`) : ui.callout('atencao', `<p>CR ${n3(r.CR)} ≥ 0,10: os julgamentos se contradizem (por exemplo, C1 &gt; C2 &gt; C4 &gt; C1). Refaça antes de usar os pesos.</p>`)}
          <p class="pf3-mini" style="margin:0">Efeito na carteira: ρ ${n3(S.rho)} com o ranking vigente; seleção ${S.selecaoMudou ? '<b class="pf3-no">muda</b>' : 'não muda'} (${esc(S.selecao.join(', '))}).</p></div></div></div>
      <div class="card stack" style="margin-top:16px">${ui.section('Salvar como versão candidata de pesos', `Só com CR &lt; 0,10. Grava R20 nova, não vigente, a validar, com vigência a partir de 2028 ${B('R35')}`)}
        ${s.preset ? '<p class="pf3-mini" style="margin:0">Esta matriz é um exemplo pronto, sem mudança: serve para estudar. No desafio (passo 4), conta a matriz com os seus julgamentos.</p>' : ''}
        <form class="pf3-form" data-a3-form novalidate><label class="field full">Justificativa * (mínimo 20 caracteres)<textarea class="input" name="just" rows="2" placeholder="Quem fez os julgamentos e por quê">${esc(f.just)}</textarea>${err(f, 'just')}</label>
          <div class="full row">${ok ? '' : `<span class="pf3-err">${PF.msgHtml('VALIDATION_ERROR', { texto:'Bloqueado: CR ≥ 0,10. Refaça os julgamentos.' })}</span>`}<span class="spacer"></span><button class="btn btn-primary btn-sm" type="submit" ${ok ? '' : 'disabled'}>${icon('plus', 14)} Salvar versão candidata</button></div></form>
        ${candidatasHtml(d)}</div>
      <div style="margin-top:16px">${aula('O <b>AHP</b> transforma comparações par a par em pesos (média geométrica de cada linha). O <b>CR</b> (razão de consistência) mede se os julgamentos se contradizem: acima de 0,10, refaça. Pesos novos nunca trocam a v1 do ciclo em andamento: viram versão candidata, a validar.')}</div>`;
    const save = ns => { MS().ahp = ns; PF.save(); PF.refresh(); };
    el.onclick = e => { const p = e.target.closest('[data-a3-p]'); if(p) save(presetAhp(d, p.dataset.a3P)); };
    el.querySelectorAll('[data-a3-m]').forEach(x => x.onchange = () => save(Object.assign({}, s, { m:Object.assign({}, s.m, { [x.dataset.a3M]: +x.value }), preset:null })));
    el.querySelectorAll('[data-a3-c]').forEach(x => x.onchange = () => { const cr = CRIT.filter(k => k === x.dataset.a3C ? x.checked : s.crit.includes(k));
      if(cr.length < 3){ PF.toast('Use pelo menos 3 critérios.'); PF.refresh(); return; } save(Object.assign({}, s, { crit:cr, preset:null })); });
    const form = el.querySelector('[data-a3-form]');
    form.oninput = () => { f.just = form.just.value; };
    form.onsubmit = e => { e.preventDefault(); f.just = form.just.value.trim(); const er = {};
      if(!ok) er.just = PF.msgHtml('VALIDATION_ERROR', { texto:'CR ≥ 0,10: não é possível salvar.' }); else if(f.just.length < 20) er.just = PF.msgHtml('JUSTIFICATIVA', { min:20 });
      if(Object.keys(er).length){ f.erros = er; PF.refresh(); return; }
      const n = gravarCandidata(d, A.pesos, { fonte:'AHP', ahp:{ criterios:s.crit.slice(), matriz:M, CR:r.CR, lambdaMax:r.lambdaMax } }, f.just);
      T.ahp = null; PF.toast(`[SIMULAÇÃO] Versão candidata <b>${esc(n.rotuloVersao)}</b> de R20 salva pelo AHP (CR ${n3(r.CR)}).`); PF.refresh(); };
  }

  /* ================================================================== BENEFÍCIOS & INOVAÇÃO */
  function telaValor(el, ctx){
    medalhas();
    const d = ctx.dados, abas = [['beneficios', 'Benefícios'], ['inovacao', 'Inovação']], aba = abas.some(a => a[0] === ctx.route.query.aba) ? ctx.route.query.aba : 'beneficios';
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 3 · Regência', title:'Benefícios & Inovação', sub:'O valor prometido aparece? Benefícios medidos contra a meta e contra a trajetória planejada, e a lógica proposta para a inovação.' }) + META(d) + ui.tabs('#/n3/valor', abas, aba) + '<div data-v3></div>';
    const host = el.querySelector('[data-v3]');
    if(aba === 'inovacao') abaInovacao(host, d); else abaBeneficios(host, d);
  }
  function cardBeneficio(d, b){
    const c = C(), sit = SIT[b.situacao] || SIT.SEM_MEDICAO, o = byId(d.beneficios, b.id) || {}, ms = b.medicoes || [];
    const meses = [0].concat(ms.map(m => +m.mes)), plan = [b.base].concat(ms.map(m => +m.planejado)), real = [b.base].concat(ms.map(m => +m.realizado));
    const chart = ms.length ? CH.line(meses.map(m => 'mês ' + m), [{ name:'Planejado (trajetória)', values:plan, color:'dim', dash:true }, { name:'Realizado', values:real, color:'lime' }], { fmt:v => fmt.n(v, v % 1 ? 1 : 0), min:0, max:CH.niceMax(Math.max(b.meta, b.base, ...real, ...plan) * 1.05) }) : '<p class="muted">Sem medições: proposta ainda não executada.</p>';
    return `<div class="card stack"><div class="row"><span class="eyebrow">${esc(b.id)} · ${esc(b.iniciativaId)}</span>${ui.pill(sit[0], sit[1])}${o.proposto ? ui.pill('Proposto', 'info') : ''}${ILU()}${B('R30')}</div>
      <h3 style="font-size:18px;font-weight:400">${esc(b.kpi)}</h3>
      <div class="grid g2 pf3-g" style="align-items:start"><div class="stack">
        <table class="tbl pf3-kv"><tbody>
          <tr><td class="dim">Sentido</td><td>${b.sentido === 'MENOR_MELHOR' ? '<b>Menor é melhor</b>' : 'Maior é melhor'}</td></tr>
          <tr><td class="dim">Linha de base → meta</td><td>${n1(b.base)} → ${n1(b.meta)} ${esc(o.unidade || '')}${o.dataMeta ? ` <small>meta em ${esc(fmt.date(o.dataMeta))}</small>` : ''}</td></tr>
          <tr><td class="dim">Dono · fonte</td><td>${esc(o.dono || '—')}<small>${esc(o.fonteDado || '—')}</small></td></tr>
          <tr><td class="dim">Realização × meta (I3.12)</td><td><b>${pc(b.realizacaoMeta, 0)}</b></td></tr>
          <tr><td class="dim">Realização × trajetória (I3.13)</td><td><b class="${b.situacao === 'ABAIXO' ? 'pf3-no' : 'lime'}">${pc(b.realizacaoTrajetoria, 0)}</b></td></tr></tbody></table>
        ${ms.length ? tab([['Mês', 'r'], 'Data', ['Planejado', 'r'], ['Realizado', 'r'], ['× trajetória', 'r']], ms.map(m => [m.mes, esc(fmt.date(m.data)), n1(m.planejado), n1(m.realizado), pc(c.razao(m.realizado - b.base, m.planejado - b.base), 0) + (m.simulacao ? ' <small>[SIMULAÇÃO]</small>' : '')])) : ''}</div>
      <div>${chart}</div></div>
      ${o.mesmoKpiDe ? baseHtml(d, b, o) : ''}</div>`;
  }
  function baseHtml(d, b, o){ const c = C(), sug = c.linhaBaseSugerida(d, b.id), f = T.base || (T.base = { valor:'', just:'', erros:null }), ok = Math.abs((o.linhaBase ?? 0) - sug) < 0.005;
    return `${ui.callout(ok ? 'dica' : 'atencao', `<p>Mesmo KPI de <b>${esc(o.mesmoKpiDe)}</b>, cuja última medição é <b>${n1(sug)}</b>. ${ok ? 'A linha de base já parte do ganho da fase 1: sem dupla contagem.' : `A proposta usa ${n1(o.linhaBase)}: contaria duas vezes o ganho da fase 1.`}</p>`, 'Linha de base sem dupla contagem')}
      <form class="pf3-form" data-v3-base novalidate><label class="field">Nova linha de base *<input class="input" name="valor" inputmode="decimal" value="${esc(f.valor)}" placeholder="${esc(fmt.n(o.linhaBase, 0))}">${err(f, 'valor')}</label>
        <label class="field">Justificativa * (mínimo 20 caracteres)<input class="input" name="just" value="${esc(f.just)}" placeholder="De onde vem o novo valor">${err(f, 'just')}</label>
        <div class="full row"><span class="spacer"></span><button class="btn btn-primary btn-sm" type="submit">${icon('edit', 14)} Corrigir linha de base</button></div></form>`; }
  function abaBeneficios(el, d){
    const c = C(), bs = c.beneficiosResumo(d), med = bs.filter(b => !(byId(d.beneficios, b.id) || {}).proposto), f = T.med || (T.med = { ben:(med[0] || {}).id || '', data:'', mes:'', real:'', erros:null }), bsel = byId(d.beneficios, f.ben), mesN = num(f.mes);
    el.innerHTML = `<div class="stack">${bs.map(b => cardBeneficio(d, b)).join('')}
      <div class="card stack">${ui.section('Lançar medição', 'O registro só acrescenta: uma medição errada se corrige com outra medição, nunca apagando.')}
        <form class="pf3-form" data-v3-med novalidate><label class="field">Benefício *<select class="select" name="ben">${med.map(b => `<option value="${b.id}" ${b.id === f.ben ? 'selected' : ''}>${esc(b.id)} · ${esc(b.kpi)}</option>`).join('')}</select></label>
          <label class="field">Data da medição *<input class="input" type="date" name="data" value="${esc(f.data)}">${err(f, 'data')}</label>
          <label class="field">Mês do acompanhamento (1 a 12) *<input class="input" name="mes" inputmode="numeric" value="${esc(f.mes)}" placeholder="ex.: 9">${err(f, 'mes')}</label>
          <label class="field">Realizado *<input class="input" name="real" inputmode="decimal" value="${esc(f.real)}" placeholder="valor do KPI">${err(f, 'real')}</label>
          <div class="full row"><span class="pf3-mini">Planejado no mês (trajetória linear da base à meta): ${bsel && mesN != null ? n1(c.trajetoriaPlanejada(bsel, mesN)) : '—'} ${DFP('Trajetória planejada linear da trilha (base → meta em 12 meses)')}</span><span class="spacer"></span><button class="btn btn-primary btn-sm" type="submit">${icon('plus', 14)} Lançar medição</button></div></form></div>
      ${aula('Um <b>benefício</b> se mede contra a <b>meta</b> e contra a <b>trajetória</b> planejada até hoje: estar a 20% da meta pode ser normal no mês 6. A fórmula (real − base) ÷ (planejado − base) vale também quando “menor é melhor”. A linha de base de uma fase 2 parte do resultado da fase 1, senão o ganho conta duas vezes.')}</div>`;
    const fm = el.querySelector('[data-v3-med]');
    const lerM = () => { f.ben = fm.ben.value; f.data = fm.data.value; f.mes = fm.mes.value; f.real = fm.real.value; };
    fm.oninput = lerM; fm.ben.onchange = () => { lerM(); PF.refresh(); };
    fm.onsubmit = e => { e.preventDefault(); lerM(); const er = {}, b = byId(d.beneficios, f.ben), m = num(f.mes), r = num(f.real), uM = (c.beneficio(d, f.ben) || {}).ultima || {}, ult = uM.data;
      if(!f.data) er.data = PF.msgHtml('REQUIRED', { campo:'a data' }); else if(ult && f.data <= ult) er.data = PF.msgHtml('VALIDATION_ERROR', { texto:`A data precisa ser posterior à última medição (${fmt.date(ult)}).` });
      if(m == null || m < 1 || m > 12 || !Number.isInteger(m)) er.mes = PF.msgHtml('VALIDATION_ERROR', { texto:'Informe um mês inteiro de 1 a 12.' });
      else if(uM.mes != null && m <= +uM.mes) er.mes = PF.msgHtml('VALIDATION_ERROR', { texto:`O mês precisa ser posterior ao da última medição (mês ${uM.mes}).` });
      if(r == null) er.real = PF.msgHtml('REQUIRED', { campo:'o valor realizado' });
      if(Object.keys(er).length || !b){ f.erros = er; PF.refresh(); return; }
      const x = PF.append('medicoesBeneficio', { beneficioId:b.id, data:f.data, mes:m, planejado: Math.round(c.trajetoriaPlanejada(b, m) * 100) / 100, realizado:r, nivel:3 });
      PF.append('historico', { entidade:'medicoesBeneficio', entidadeId:x.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:x.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:`Medição de ${b.id} no mês ${m}` });
      T.med = null; PF.toast(`[SIMULAÇÃO] Medição de <b>${esc(b.id)}</b> lançada (mês ${m}).`); PF.refresh(); };
    const fb = el.querySelector('[data-v3-base]');
    if(fb){ const f2 = T.base; fb.oninput = () => { f2.valor = fb.valor.value; f2.just = fb.just.value; };
      fb.onsubmit = e => { e.preventDefault(); f2.valor = fb.valor.value; f2.just = fb.just.value.trim(); const er = {}, v = num(f2.valor), o = (d.beneficios || []).find(x => x.mesmoKpiDe);
        if(v == null || v < 0) er.valor = PF.msgHtml('VALIDATION_ERROR', { texto:'Informe um número maior ou igual a zero.' }); else if(o && Math.abs(v - o.linhaBase) < 1e-9) er.valor = PF.msgHtml('VALIDATION_ERROR', { texto:'O valor é igual ao atual: nada mudou.' });
        if(f2.just.length < 20) er.just = PF.msgHtml('JUSTIFICATIVA', { min:20 });
        if(Object.keys(er).length || !o){ f2.erros = er; PF.refresh(); return; }
        const w = PF.write('beneficios', o.id, { linhaBase:v }, { justificativa:f2.just });
        if(!w.ok){ f2.erros = { valor: esc((w.errors[0] || {}).msg || 'Não foi possível gravar.') }; PF.refresh(); return; }
        T.base = null; PF.toast(`[SIMULAÇÃO] Linha de base de <b>${esc(o.id)}</b> corrigida para ${n1(v)} (histórico gravado).`); PF.refresh(); }; }
  }
  function abaInovacao(el, d){
    const c = C(), rows = c.linhasCandidatas(d), c0 = c.otimizar(d, { rows }), mh = c.mixHorizonte(d, c0.ids, { rows }), r31 = c.param(d, 'R31'), d3 = c.triagemSugerida(d, 'D3'), dec2 = byId(d.decisoes, 'DEC-002');
    const trl = (d.iniciativas || []).filter(i => i.ativo !== false && i.trlEsperado && i.trlEsperado !== 'n/a'), alvo = s => +((String(s).match(/→\s*(\d+)/) || [])[1] || 0);
    const hs = ['H1', 'H2', 'H3'].concat(Object.keys(mh.pct).filter(h => !['H1', 'H2', 'H3'].includes(h)));
    el.innerHTML = `<div class="card stack">${ui.callout('dica', `<p>Esta aba resume propostas do deck para inovação. Tudo aqui é <b>proposta a validar pela FEG</b> ${PROP('s181–s210')}: serve para raciocinar, não como regra.</p>`)}
      <div class="pf3-sec"><h4>Árvore inovação × entrega ${PROP('s182')}</h4><p>Se a demanda exige nova metodologia ou novo modelo matemático, vai para o escopo exploratório de uma Comunidade Técnica; se é evolução de solução conhecida, segue na comunidade de entrega.</p>
        <p>Exemplo: <b>D3</b> (${esc(tit(d, 'D3'))}) → ${d3 ? `<b title="${esc(d3.saida)}">${esc(((((d.catalogos || {}).tiposDecisao) || []).find(x => x.codigo === d3.saida) || {}).nome || d3.saida)}</b> (${esc(d3.destino || '')})` : '—'} ${B('R17')}</p></div>
      <div class="pf3-sec"><h4>Transferência para a entrega a partir do TRL ${esc(r31.trlHandover)} ${B('R31')}</h4><p>A iniciativa de inovação só passa à comunidade de entrega quando a maturidade tecnológica chega ao TRL ${esc(r31.trlHandover)} (s183). Antes disso, segue no escopo exploratório.</p>
        ${tab(['Iniciativa', 'Fase', 'TRL esperado', 'Chega ao TRL de transferência?'], trl.map(i => [`<b>${esc(i.id)}</b> <small>${esc(tit(d, i.id))}</small>`, esc(((byId(d.statusConfiguracao, i.statusId) || {}).nome) || i.statusId), esc(i.trlEsperado), alvo(i.trlEsperado) >= r31.trlHandover ? '<b class="pf3-ok">sim</b>' : 'não: segue na inovação']))}</div>
      <div class="pf3-sec"><h4>Gates de inovação ${PROP('s189')}</h4><p><b>Gate 2</b>: alinhada às rotas, mas com impedimento conjuntural → pausa formal, com justificativa e gatilho objetivo de reativação. <b>Gate 3</b>: encerrar com lições aprendidas.</p>
        ${dec2 ? `<p>Exemplo: <b>${esc(dec2.iniciativaId)}</b> · ${esc(dec2.id)} (${esc(fmt.date(dec2.decididoEm))}) · gatilho: “${esc(dec2.gatilhoReativacao || '—')}” ${ILU()}</p>` : ''}</div>
      <div class="pf3-sec"><h4>Mix por horizonte da carteira C0 × referência ${hs.slice(0, 3).map(h => fmt.n((mh.alvo[h] || 0) * 100)).join('/')} ${B('R31')}</h4><p>D_h = ½ Σ |pₕ − alvoₕ| sobre o custo da carteira inteira (${esc(c0.ids.join(', '))}).</p>
        <div class="grid g2 pf3-g" style="align-items:start"><div>${CH.stack(hs.map((h, i) => ({ label:h, value:mh.pct[h] || 0, color:['lime', 'info', '#C9B8E8', 'dim'][i % 4] })))}<p class="muted">D_h = <b class="lime">${pp(mh.Dh)}</b></p></div>
        <div>${tab(['Horizonte', ['% do custo', 'r'], ['Referência', 'r'], ['Diferença', 'r']], hs.map(h => [esc(((((d.catalogos || {}).horizontesInovacao) || []).find(x => x.codigo === h) || {}).nome || h), pc(mh.pct[h]), pc(mh.alvo[h] || 0, 0), pp((mh.pct[h] || 0) - (mh.alvo[h] || 0))]))}</div></div></div></div>
      <div style="margin-top:16px">${aula('<b>TRL</b> mede a maturidade de uma tecnologia (1 a 9). <b>Horizontes</b>: H1 núcleo, H2 adjacente, H3 transformacional. O 70/20/10 do deck é referência a validar, não meta. Um gate de inovação pode pausar com gatilho em vez de matar: o que falta é conjuntural.')}</div>`;
  }

  /* ================================================================== PLANEJAMENTO DO CICLO */
  const cicloSt = d => Object.assign({ classes:{}, cond:{}, gat:{}, cenario:'C0', pols:[], preMortem:'', just:'', papel:(papeis(d)[0] || ''), instancia:(instCiclo(d)[0] || '') }, MS().ciclo || {});
  /** Último lote de recomendação do ciclo registrado (decisões com forumId FR-CICLO e o mesmo loteCiclo). */
  function ultimoLote(d){ const ds = (d.decisoes || []).filter(x => x.forumId === 'FR-CICLO' && x.loteCiclo); if(!ds.length) return null;
    const ult = ds.slice().sort((a, b) => String(a.registradoEm).localeCompare(String(b.registradoEm))).pop(), decs = ds.filter(x => x.loteCiclo === ult.loteCiclo), cl = {}; decs.forEach(x => cl[x.iniciativaId] = x.classeRecomendacao);
    return { id:ult.loteCiclo, decs, classes:cl, custos:ult.custosRestricao || [], versaoPesos:ult.versaoPesos, pesosCiclo:ult.pesosCiclo || null, preMortem:ult.preMortem, justificativa:ult.justificativa, cenarioId:ult.cenarioId, registradoEm:ult.registradoEm }; }
  const conteudoHash = s => PF.hash(Object.assign({ indicadoresJson:s.indicadoresJson, iniciativasJson:s.iniciativasJson, decisoesPendentesJson:s.decisoesPendentesJson, filtrosJson:s.filtrosJson, recomendacaoJson:s.recomendacaoJson, versaoPesos:s.versaoPesos }, s.pesosCiclo ? { pesosCiclo:s.pesosCiclo } : {}));
  const gateAnterior = (d, id) => { const v = C().decisoesVigentes(d).filter(x => x.iniciativaId === id && GATE.includes(x.tipoDecisao) && x.forumId !== 'FR-CICLO');
    return v.slice().sort((a, b) => String(a.registradoEm || a.decididoEm).localeCompare(String(b.registradoEm || b.decididoEm))).pop() || null; };
  /** Missões por papel (§7.8; texto estático, papéis de aprendizagem a validar; HHI, CPM e opção real ficaram fora da v1). */
  function missoesHtml(d){ const c = C(), rows = c.linhasCandidatas(d), c0 = c.otimizar(d, { rows }), pk = c.pessoaChave(d, null, { rows }), sc = c.custoPorSourcing(d, c0.ids || [], { rows });
    const M = [['Gestão de Portfólio/PMO', 'Recomendação robusta, com os custos das políticas adotadas e o cenário usado.'],
      ['Governança, Riscos e Conformidade', 'Simular a trilha de auditoria: versões de pesos, CR do AHP, gatilhos, pre-mortem e fotografia FECHADA.'],
      ['Contratos e Fornecedores', `Concentração: pessoa-chave K em ${pc(pk.valor)} das candidatas; classe de sourcing (núcleo crítico ${pc(sc.pct.NUCLEO_CRITICO || 0)} do custo da C0).`],
      ['Estratégia e Inovação', 'Política de mix; 70/20/10 como referência a validar; P04 em PoC; D3 na árvore inovação × entrega (s182).'],
      ['Interface institucional e regulatória', 'Cenário C5 (P09 = D2) e o seu gatilho; o limite entre FEG e Comunidade Técnica ainda está a validar.']];
    return `<details class="card" style="margin-top:16px"><summary style="cursor:pointer" class="lime">Missões por papel (texto estático; papéis de aprendizagem a validar) ${B('R42')}</summary>
      ${tab(['Papel', ['Missão no Nível 3', 'wrap']], M.map(([p, m]) => [esc(p), esc(m)]))}</details>`; }
  function telaCiclo(el, ctx){
    medalhas();
    const d = ctx.dados, c = C(), s = cicloSt(d), rows = c.linhasCandidatas(d), cens = d.cenarios || [], cen = byId(cens, s.cenario) || byId(cens, 'C0') || cens[0], R = c.cenario(d, cen, { rows }), pols = c.custosPolitica(d, { rows }), adot = pols.filter(p => s.pols.includes(p.id));
    const optsAd = adot.reduce((o, p) => c.combinar(o, p.opts), {}), comb = adot.length ? c.custoRestricao(d, { rows }, optsAd) : null, rob = c.robustez(d), vp = versaoPesos(d), pesosDif = !mesmosPesos(c.pesosEfetivos(d)), er = T.cicloErr || {};
    const ug = c.utilizacaoPorGerencia(d, R.ids || [], { rows, reserva:((cen && cen.premissas) || {}).reserva }), lote = ultimoLote(d), fotos = (d.snapshotsForum || []).filter(z => z.forumId === 'FR-CICLO').slice().sort((a, b) => (a.versao || 1) - (b.versao || 1));
    const av = lote ? c.avaliarRecomendacaoCiclo(PF.base, lote.classes) : null, gab = lote ? c.gabaritoCiclo(PF.base) : null, aberta = fotos.find(z => z.status !== 'FECHADO');
    const tone = f => ({ TANQUE:'bad', REDUZIR:'warn', ROADMAP:'lime', AUTONOMIA:'ok' })[f] || 'dim';
    const corpo = `${pesosDif ? `<div style="margin-bottom:16px">${ui.callout('atencao', `<p>Os pesos vigentes nos seus dados de trabalho são a versão <b>${esc(vp)}</b>, com valores diferentes da v1. O Ciclo Exemplo 2027 usa a v1 ${B('R35')}: uma versão nova vale a partir do próximo ciclo.</p><p class="pf3-mini">Para registrar o ciclo com a v1: em <a href="#/n2/criterios?aba=parametros">Critérios &amp; Pesos → Parâmetros</a> (Nível 2), grave uma versão com os valores da v1 (botão “Preencher com a v1”), ou restaure os dados de exemplo em <a href="#/config">Configurações</a>.</p>`, 'Pesos diferentes da v1')}</div>` : ''}<div class="card stack">${ui.section('1 · Contexto da recomendação', `Cenário usado, políticas adotadas e seus custos, versão dos pesos ${B('R35')} ${B('R20')}`)}
        <div class="grid g2 pf3-g" style="align-items:start"><div class="stack"><label class="field">Cenário usado *<select class="select" data-y3="cenario">${cens.map(x => `<option value="${x.id}" ${x.id === (cen && cen.id) ? 'selected' : ''}>${esc(x.id)} · ${esc(x.nome)}</option>`).join('')}</select></label>
            <div class="pf3-mini">Carteira ótima de ${esc(cen && cen.id)}: ${idsH(R.ids)} · ${n1(R.fte)} FTE · R$ ${n2(R.custo)} mi · V ${n2(R.valor)}</div>
            <div class="row">${ui.pill('Pesos ' + vp + (vp !== 'v1' && !pesosDif ? ' (= v1)' : ''), pesosDif ? 'warn' : 'ok')}<span class="pf3-mini">A fotografia congela esta versão. Versões candidatas (não vigentes) não entram.</span></div></div>
          <div class="stack"><span class="pf3-mini">Políticas adotadas (custos sobre a C0) ${B('R30')} ${B('R28')} ${B('R27')}</span><div class="pf3-cfg">${pols.map(p => `<label><input type="checkbox" data-y3-pol="${p.id}" ${s.pols.includes(p.id) ? 'checked' : ''}> ${esc(p.nome)} <span class="pf3-mini">custo ${n2(p.custo)} (${pc(p.pct)})</span></label>`).join('')}</div>
            ${comb ? `<p class="muted" style="margin:0">Custo combinado das adotadas: <b class="lime">${comb.custo == null ? 'inviável' : n2(comb.custo)}</b> (${pc(comb.pct)}); soma isolada ${n2(soma(adot, p => p.custo))}.</p>` : `<p class="pf3-mini" style="margin:0">Nenhuma política marcada. ${err({ erros:er }, 'pols')}</p>`}</div></div></div>
      <div class="card stack" style="margin-top:16px">${ui.section('2 · Classificação das candidatas', `Núcleo, Condicional, Habilitadora, Recycle ou Kill ${B('R18')} · Condicional exige condicionante e gatilho; Habilitadora exige gatilho ${B('R32')}`)}
        ${tab(['Candidata', ['Freq. C0–C6', 'r'], `No ótimo de ${esc(cen && cen.id)}`, 'Decisão vigente', 'Classe *', ['Condicionante', 'wrap'], ['Gatilho', 'wrap']], rows.map(r => { const v = c.decisaoVigente(d, r.id), fq = rob.frequencia[r.id];
          return [`<b title="${esc(tit(d, r.id))}">${esc(r.id)}</b> <small>${esc(r.gerenciaId)}</small>`, fq ? pcx(fq.pct) : '—', (R.ids || []).includes(r.id) ? '<b class="lime">sim</b>' : 'não',
            v ? `<span title="${esc(v.tipoDecisao + ': ' + (v.decisao || ''))}">${esc(tipoNome(d, v.tipoDecisao))}</span>${v.simulacao ? ' <small>' + esc(v.id) + '</small>' : ''}` : '<span class="dim">—</span>',
            `<select class="select" data-y3-cl="${r.id}" aria-label="Classe de ${r.id}"><option value="">Escolha…</option>${CLASSES.map(k => `<option value="${k}" ${s.classes[r.id] === k ? 'selected' : ''}>${esc(classeNome(d, k))}</option>`).join('')}</select>${err({ erros:er }, 'cl:' + r.id)}`,
            `<input class="input" data-y3-cond="${r.id}" value="${esc(s.cond[r.id] || '')}" placeholder="${s.classes[r.id] === 'CONDICIONAL' ? 'obrigatória' : 'opcional'}">${err({ erros:er }, 'cond:' + r.id)}`,
            `<input class="input" data-y3-gat="${r.id}" value="${esc(s.gat[r.id] || '')}" placeholder="${['CONDICIONAL', 'HABILITADORA'].includes(s.classes[r.id]) ? 'obrigatório' : 'opcional'}">${err({ erros:er }, 'gat:' + r.id)}`]; }))}</div>
      <div class="grid g2 pf3-g" style="margin-top:16px;align-items:start"><div class="card stack">${ui.section(`3 · Diretrizes de capacidade por gerência (${esc(cen && cen.id)})`, `${B('R26')} ${B('R24')}`)}
          ${tab(['Gerência', ['FTE', 'r'], ['Capacidade', 'r'], ['Uso', 'r'], ['Diretriz R26', 'wrap']], ug.map(g => [`<b>${esc(g.gerenciaId)}</b>`, n1(g.fte), n1(g.cap), g.u == null ? 'sem capacidade' : pc(g.u), g.faixa ? `${ui.pill(FX[g.faixa.id] || g.faixa.id, tone(g.faixa.id))} <small>${esc(g.faixa.acao)}</small>` : '—']))}</div>
        <div class="card stack">${ui.section('4 · Pre-mortem, justificativa e registro', `Toda decisão tem quem registra e a instância que decide ${B('R38')}`)}
          <label class="field">Pre-mortem * — “daqui a 12 meses deu errado: por quê?” (mínimo 20 caracteres)<textarea class="input" rows="3" data-y3="preMortem">${esc(s.preMortem)}</textarea>${err({ erros:er }, 'preMortem')}</label>
          <label class="field">Justificativa da recomendação * (mínimo 20 caracteres)<textarea class="input" rows="2" data-y3="just">${esc(s.just)}</textarea>${err({ erros:er }, 'just')}</label>
          <div class="pf3-form"><label class="field">Quem registra *<select class="select" data-y3="papel">${papeis(d).map(p => `<option ${p === s.papel ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
            <label class="field">Instância que decide *<select class="select" data-y3="instancia">${instCiclo(d).map(p => `<option ${p === s.instancia ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>${err({ erros:er }, 'instancia')}</label></div>
          <div class="row">${err({ erros:er }, '_geral')}<span class="spacer"></span><button class="btn btn-primary btn-sm" data-y3-reg>${icon('gavel', 14)} Registrar recomendação do ciclo</button></div></div></div>
      ${lote ? `<div class="card stack" style="margin-top:16px">${ui.section('Recomendação registrada', `[SIMULAÇÃO] lote ${esc(lote.id)} · ${esc(fmt.date(String(lote.registradoEm).slice(0, 10)))} · cenário ${esc(lote.cenarioId)} · pesos ${esc(lote.versaoPesos)} · recomendação da analista; decide a instância`)}
        <p class="muted" style="margin:0">Comparação com o gabarito-modelo (calculado sobre a referência: robustez, dependências, risco e capacidade local): <b class="lime">${fmt.n(av.nota, av.nota % 1 ? 1 : 0)} de ${av.max}</b> ${av.ok ? '<span class="pf3-ok">· conduz bem (≥ 6)</span>' : '<span class="pf3-no">· abaixo de 6: revise</span>'}</p>
        ${tab(['Candidata', 'Sua classe', 'Modelo', ['Pontos', 'r'], ['Observação do modelo', 'wrap']], av.porIniciativa.map(x => [`<b>${esc(x.id)}</b>`, esc(classeNome(d, x.escolhida)), esc(classeNome(d, x.gabarito)), fmt.n(x.pontos, x.pontos % 1 ? 1 : 0), esc((gab[x.id] || {}).nota || '')]))}
        <p class="pf3-mini" style="margin:0">Classe exata vale 1; alternativa aceitável vale 0,5. O modelo é didático e a validar: a decisão real é da instância.</p></div>` : ''}
      <div class="card stack" style="margin-top:16px">${ui.section('5 · Fotografia do FR-CICLO', `ABERTA pode ser regenerada; FECHADA não muda e congela a versão dos pesos ${B('R06')} ${B('R35')}`,
          `${aberta ? `<button class="btn btn-ghost btn-sm" data-y3-regen="${esc(aberta.id)}">${icon('reset', 14)} Regenerar ABERTA</button><button class="btn btn-primary btn-sm" data-y3-fechar="${esc(aberta.id)}">${icon('lock', 14)} Fechar</button>` : `<button class="btn btn-primary btn-sm" data-y3-foto ${lote ? '' : 'disabled title="Registre a recomendação antes"'}>${icon('plus', 14)} Gerar fotografia</button>`}`)}
        ${T.fotoLock ? ui.callout('atencao', `<p>${PF.msgHtml('SNAPSHOT_LOCKED')}</p>`) : ''}
        ${fotos.length ? tab(['Fotografia', 'Status', 'Pesos', ['Hash', 'r'], ['Recomendação', 'wrap']], fotos.map(z => [`<b>${esc(z.id)}</b> <small>v${z.versao || 1} · corte ${esc(fmt.date(z.geradoEm))}</small>`, z.status === 'FECHADO' ? ui.pill('FECHADO', 'ok') : ui.pill('ABERTO', 'warn'), esc(z.versaoPesos || '—'), `<code>${esc(z.hashConteudo || '—')}</code>`,
          esc(Object.entries((z.recomendacaoJson || {}).classes || {}).map(([k, v]) => `${k} ${classeNome(d, v)}`).join(' · ')) + (z.simulacao ? ' <small>[SIMULAÇÃO]</small>' : '')])) : '<p class="pf3-mini" style="margin:0">Nenhuma fotografia do FR-CICLO ainda.</p>'}</div>
      <div class="card stack" style="margin-top:16px">${ui.section('Contexto: roadmap 2026–2030', PROP('s263–s270'))}<p class="muted" style="margin:0">O deck apresenta um roadmap da FE para 2026–2030. Aqui ele é só contexto: a recomendação do Ciclo Exemplo 2027 (ILUSTRATIVO) é um passo dentro desse horizonte, e nada do roadmap entra no cálculo. Conteúdo do deck é proposta de consultoria, a validar pela FEG.</p></div>
      ${missoesHtml(d)}
      <div style="margin-top:16px">${aula('A <b>recomendação do ciclo</b> junta tudo: núcleo robusto, condicionais com gatilho, habilitadoras e Recycle, com os custos das políticas adotadas e o cenário usado. O <b>pre-mortem</b> imagina o fracasso para achar riscos agora. <b>Custo afundado</b> não justifica continuar: compare custo restante com valor restante. A fotografia FECHADA congela a versão dos pesos.')}</div>`;
    const citadas = Array.from(new Set((corpo.match(/data-pf-regra="([^"]+)"/g) || []).map(x => x.slice(15, -1)))).filter(k => { const r = PF.regra(k); return r && r.origemRegra === 'A_VALIDAR_FEG'; }).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric:true }));
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 3 · Regência', title:'Planejamento do Ciclo', sub:'Recomendação de carteira do Ciclo Exemplo 2027 (ILUSTRATIVO) para o Fórum de Planejamento do Portfólio (s127, proposta). A analista recomenda; a instância decide.', actions:PF.pdfButton('Exportar exercício (PDF)') }) + META(d) +
      `<div style="margin-bottom:16px">${ui.callout('atencao', `<p>${PF.msgHtml('RULE_NOT_VALIDATED', { lista:citadas.join(', ') })}</p><p class="pf3-mini">O PDF sai com marca d’água de exercício e esta lista. Nenhuma regra aqui é oficial do ONS.</p>`)}</div>` + corpo;
    const st = () => { MS().ciclo = Object.assign(cicloSt(d), MS().ciclo || {}); return MS().ciclo; };
    el.addEventListener('input', e => { const t = e.target; let x = null;
      if(t.dataset.y3 && t.tagName !== 'SELECT'){ x = st(); x[t.dataset.y3] = t.value; } else if(t.dataset.y3Cond){ x = st(); x.cond = Object.assign({}, x.cond, { [t.dataset.y3Cond]: t.value }); } else if(t.dataset.y3Gat){ x = st(); x.gat = Object.assign({}, x.gat, { [t.dataset.y3Gat]: t.value }); }
      if(x) PF.save(); });
    el.addEventListener('change', e => { const t = e.target, x = st();
      if(t.dataset.y3 && t.tagName === 'SELECT'){ x[t.dataset.y3] = t.value; PF.save(); PF.refresh(); }
      else if(t.dataset.y3Cl){ x.classes = Object.assign({}, x.classes, { [t.dataset.y3Cl]: t.value }); PF.save(); PF.refresh(); }
      else if(t.dataset.y3Pol){ const p = new Set(x.pols || []); if(t.checked) p.add(t.dataset.y3Pol); else p.delete(t.dataset.y3Pol); x.pols = Array.from(p); PF.save(); PF.refresh(); } });
    el.addEventListener('click', e => {
      if(e.target.closest('[data-y3-reg]')) return registrarCiclo(d);
      if(e.target.closest('[data-y3-foto]')){ const L = ultimoLote(d); if(!L) return; gerarFoto(d, L, null); T.fotoLock = null; PF.toast('[SIMULAÇÃO] Fotografia do FR-CICLO gerada (ABERTA).'); PF.refresh(); return; }
      const rg = e.target.closest('[data-y3-regen]'); if(rg){ const z = byId(d.snapshotsForum, rg.dataset.y3Regen), L = ultimoLote(d); if(!z || z.status === 'FECHADO'){ T.fotoLock = true; PF.refresh(); return; }
        if(L) gerarFoto(d, L, z); PF.toast('Fotografia ABERTA regenerada com o estado atual.'); PF.refresh(); return; }
      const fc = e.target.closest('[data-y3-fechar]'); if(fc){ const id = fc.dataset.y3Fechar;
        PF.confirm('Fechar a fotografia do FR-CICLO?', 'Depois de FECHADA ela não muda mais e congela a versão dos pesos. Correções viram nova versão.', 'Fechar', () => { const dd = PF.db(), z = byId(dd.snapshotsForum, id);
          if(!z || z.status === 'FECHADO'){ T.fotoLock = true; PF.refresh(); return; }
          const w = PF.write('snapshotsForum', id, { status:'FECHADO', hashConteudo:conteudoHash(z), fechadoEm:hoje() }, { justificativa:'Fotografia do ciclo fechada no fórum simulado (FR-CICLO)' });
          if(w.ok){ PF.award('m-fotografia', 'Fórum fechado'); PF.toast(`[SIMULAÇÃO] Fotografia <b>${esc(id)}</b> FECHADA (pesos ${esc(z.versaoPesos)}).`); } T.fotoLock = null; PF.refresh(); }); } });
  }
  function registrarCiclo(d){
    const c = C(), s = cicloSt(d), rows = c.linhasCandidatas(d), er = {}, cl = s.classes || {};
    rows.forEach(r => { const k = cl[r.id];
      if(!k) er['cl:' + r.id] = PF.msgHtml('REQUIRED', { campo:'a classe' });
      if(k === 'CONDICIONAL' && String(s.cond[r.id] || '').trim().length < 5) er['cond:' + r.id] = PF.msgHtml('REQUIRED', { campo:'a condicionante' });
      if(['CONDICIONAL', 'HABILITADORA'].includes(k) && String(s.gat[r.id] || '').trim().length < 5) er['gat:' + r.id] = PF.msgHtml('REQUIRED', { campo:'o gatilho' }); });
    if(String(s.preMortem || '').trim().length < 20) er.preMortem = PF.msgHtml('VALIDATION_ERROR', { texto:'Escreva o pre-mortem com pelo menos 20 caracteres.' });
    if(String(s.just || '').trim().length < 20) er.just = PF.msgHtml('JUSTIFICATIVA', { min:20 });
    if(!s.instancia || s.instancia === s.papel) er.instancia = PF.msgHtml('VALIDATION_ERROR', { texto:'A instância que decide precisa ser diferente de quem registra.' });
    if(Object.keys(er).length){ er._geral = PF.msgHtml('VALIDATION_ERROR', { texto:'Há campos a corrigir acima.' }); T.cicloErr = er; PF.refresh(); return; }
    const pols = c.custosPolitica(d, { rows }).filter(p => (s.pols || []).includes(p.id)).map(p => ({ id:p.id, nome:p.nome, custo:p.custo, pct:p.pct })), lote = 'LOTE-' + Date.now().toString(36), vp = versaoPesos(d);
    rows.forEach(r => { const k = cl[r.id], g = gateAnterior(d, r.id);
      PF.append('decisoes', { iniciativaId:r.id, tipoDecisao:classeTipo(d, k), classeRecomendacao:k, decisao:`Recomendação do ciclo: ${classeNome(d, k)} para ${r.id}${s.cond[r.id] ? ' · condicionante: ' + s.cond[r.id] : ''}${s.gat[r.id] ? ' · gatilho: ' + s.gat[r.id] : ''}`,
        justificativa:String(s.just).trim(), responsavel:s.papel, papelRegistrante:s.papel, instancia:s.instancia, recomendacao:true, condicionantes:s.cond[r.id] || null, gatilhoReativacao:s.gat[r.id] || null,
        versaoPesos:vp, pesosCiclo:c.pesosEfetivos(d), cenarioId:s.cenario, custosRestricao:pols, preMortem:String(s.preMortem).trim(), refDecisaoAnteriorId: g ? g.id : null, forumId:'FR-CICLO', tipoRitoForum:'PLANEJAMENTO_PORTFOLIO', decididoEm:hoje(), loteCiclo:lote, nivel:3 }); });
    T.cicloErr = null; PF.toast(`[SIMULAÇÃO] Recomendação do ciclo registrada: ${rows.length} decisões (lote ${esc(lote)}).`); PF.refresh();
  }
  function gerarFoto(d, L, existente){ const c = C(), fr = byId(d.foruns, 'FR-CICLO') || {};
    const cont = Object.assign(c.conteudoFotografia(d), { recomendacaoJson:{ loteId:L.id, classes:L.classes, cenarioId:L.cenarioId, custosRestricao:L.custos, preMortem:L.preMortem, decisoes:L.decs.map(x => x.id) }, versaoPesos:L.versaoPesos }, L.pesosCiclo ? { pesosCiclo:L.pesosCiclo } : {});
    if(existente) return PF.write('snapshotsForum', existente.id, cont, { justificativa:'Fotografia ABERTA do FR-CICLO regenerada' });
    const v = (d.snapshotsForum || []).filter(z => z.forumId === 'FR-CICLO').length + 1;
    const z = PF.append('snapshotsForum', Object.assign({ id:`SN-CICLO-v${v}`, forumId:'FR-CICLO', geradoEm:fr.dataCorte || c.ref(d), versao:v, status:'ABERTO', hashConteudo:null, nivel:3 }, cont));
    PF.append('historico', { entidade:'snapshotsForum', entidadeId:z.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:z.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:`Fotografia FR-CICLO v${v} gerada (ABERTA)` });
    return z; }

  /* ================================================================== DASHBOARD (§7.3) */
  const dash = o => PF.registerDash(Object.assign({ nivel:3 }, o));
  dash({ id:'n3-painel', ordem:10, titulo:'Painel candidato · 7 indicadores descritivos', sub:`Só contagens e somas, sem semáforo nem score agregado. Substitui os cards do N1 e do N2 nesta aba ${AVF('Painel candidato de 7 indicadores descritivos (§7.3): a validar pela FEG')}`, render(d, g){
    const c = C(), at = c.ativas(d).filter(i => !g || i.gerenciaId === g), A = c.emExecucao(d).filter(i => !g || i.gerenciaId === g), ids = A.map(i => i.id), cnt = {}, porG = {};
    at.forEach(i => { cnt[i.statusId] = (cnt[i.statusId] || 0) + 1; porG[i.gerenciaId] = (porG[i.gerenciaId] || 0) + 1; });
    const H = c.horizontes(d, { lista:A }), h = H.contagem, venc = H.itens.filter(x => x.faixa === 'VENCIDO').map(x => x.id), semBase = A.filter(i => !i.dataPlanejada).map(i => i.id);
    const ri = c.riscosAbertos(d, { ids }), dep = c.dependenciasAbertas(d, { ids }), bl = c.bloqueios(d, { ids }), dv = c.desvios(d).lista.filter(x => ids.includes(x.id)), med = c.mediana(dv.map(x => x.desvio));
    const exe = c.div(soma(A, i => c.ac(d, i)), soma(A, i => c.bac(d, i))), rows = c.linhasCandidatas(d).filter(r => !g || r.gerenciaId === g), cap = g ? c.capacidadePorGerencia(d)[g] : c.capacidadeTotal(d), dem = c.div(soma(rows, r => r.fte), cap);
    const fora = Array.from(new Set(c.semFonte(d).map(x => x.iniciativaId).concat(c.unidadesIncompativeis(d).map(x => x.iniciativaId).filter(Boolean)))).filter(id => { const i = byId(d.iniciativas, id); return i && (!g || i.gerenciaId === g); });
    const fase = k => cnt[k] || 0, mes = v => v == null ? 'n/d' : `${fmt.n(v, v % 1 ? 1 : 0)} ${Math.abs(v) === 1 ? 'mês' : 'meses'}`;
    return `<div class="pf3-k">${kc('1 · Por fase e gerência', `${fase('EM_EXECUCAO')} <small>em execução</small>`, `${fase('EM_ANALISE')} em análise · ${fase('DEMANDA')} demandas${fase('EM_ESPERA') ? ' · ' + fase('EM_ESPERA') + ' em espera' : ''}${fase('ENCERRADA') ? ' · ' + fase('ENCERRADA') + ' encerrada' : ''}<br>${Object.keys(porG).sort().map(k => `${esc(k)} ${porG[k]}`).join(' · ')}`, B('R11'))}
      ${kc('2 · 30/60/90 (em execução)', `${(h['30_DIAS'] || 0) + (h['60_DIAS'] || 0) + (h['90_DIAS'] || 0)} <small>em até 90 dias</small>`, `30 d ${h['30_DIAS'] || 0} · 60 d ${h['60_DIAS'] || 0} · 90 d ${h['90_DIAS'] || 0} · acima de 90 d ${h.ACIMA_90 || 0} · sem data ${h.SEM_DATA || 0}`, B('R08'))}
      ${kc('3 · Vencidas e sem data', `${venc.length} <small>vencidas</small>`, `${semBase.length} sem baseline${semBase.length ? ' (' + esc(semBase.join(', ')) + ')' : ''}`, B('R14'))}
      ${kc('4 · Riscos e impedimentos abertos', `${ri.length}`, `${ri.filter(x => x.vencido).length} vencido(s) · status fora do catálogo conta como aberto`, B('R09'))}
      ${kc('5 · Dependências abertas', `${dep.length}`, bl.length ? bl.map(b => `${esc(b.por)} bloqueia ${esc(b.bloqueada)}`).join(' · ') : 'nenhum bloqueio entre iniciativas', B('R09'))}
      ${kc('6 · Desvio de prazo (mediana)', mes(med), '“desvio”, não “atraso”; só com baseline', B('R14'))}
      ${kc('7 · Financeiro e capacidade válidos', `AC/BAC ${pc(exe)}`, `demanda ${pc(dem, 0)} da capacidade${fora.length ? ` · fora da conta: ${esc(fora.join(', '))} (sem fonte ou unidade incompatível)` : ''}`, B('R37') + ' ' + B('R24'))}</div>`; } });
  dash({ id:'n3-rec', ordem:20, largura:'meia', titulo:'Recomendação vigente do ciclo', sub:'Último registro do Planejamento do Ciclo [SIMULAÇÃO]', render(d, g){
    const L = ultimoLote(d); if(!L) return `<p class="muted">Nenhuma recomendação do ciclo registrada ainda.</p><a class="btn btn-ghost btn-sm pf3-a" href="#/n3/ciclo">${icon('calendar', 14)} Planejamento do Ciclo</a>`;
    const ds = L.decs.filter(x => !g || ((byId(d.iniciativas, x.iniciativaId) || {}).gerenciaId === g));
    return tab(['Candidata', 'Classe', ['Condição / gatilho', 'wrap']], ds.map(x => [`<b>${esc(x.iniciativaId)}</b>`, esc(classeNome(d, x.classeRecomendacao)), esc([x.condicionantes, x.gatilhoReativacao].filter(Boolean).join(' · ') || '—')]), 'Nenhuma candidata desta gerência.') +
      `<p class="pf3-mini">Cenário ${esc(L.cenarioId)} · pesos ${esc(L.versaoPesos)} ${B('R35')} ${B('R18')} · [SIMULAÇÃO]</p>`; } });
  dash({ id:'n3-custos', ordem:30, largura:'meia', titulo:'Custos de restrição', sub:'V*(sem) − V*(com) sobre a C0', render(d){
    const c = C(), L = ultimoLote(d), ps = c.custosPolitica(d, { rows:c.linhasCandidatas(d) }), ad = L && L.custos.length ? L.custos.map(x => x.id) : [];
    return `<p class="pf3-mini" style="margin:0 0 6px">${B('R30')} ${B('R28')} ${B('R27')} ${B('R24')}</p>` + tab([['Política', 'wrap'], ['Custo', 'r'], ['%', 'r']], ps.map(p => Object.assign([esc(p.nome) + (ad.includes(p.id) ? ' <small>adotada</small>' : ''), n2(p.custo), pc(p.pct)], { cls: ad.includes(p.id) ? 'on' : '' }))) +
      `<p class="pf3-mini">${ad.length ? 'Em destaque, as adotadas na recomendação vigente.' : 'Nenhuma política adotada ainda: tabela de referência.'} Custos de política não se somam.</p>`; } });
  dash({ id:'n3-ben', ordem:40, largura:'meia', titulo:'Benefícios × trajetória', sub:'Realização × meta (I3.12) e × trajetória (I3.13)', render(d, g){
    const bs = C().beneficiosResumo(d).filter(b => b.ultima && (!g || ((byId(d.iniciativas, b.iniciativaId) || {}).gerenciaId === g)));
    return `<p class="pf3-mini" style="margin:0 0 6px">${B('R30')} ${ILU()}</p>` + tab(['Benefício', ['× meta', 'r'], ['× trajetória', 'r'], 'Situação'], bs.map(b => [`<b title="${esc(b.kpi)}">${esc(b.id)}</b> <small>${esc(b.iniciativaId)}</small>`, pc(b.realizacaoMeta, 0), pc(b.realizacaoTrajetoria, 0), ui.pill((SIT[b.situacao] || SIT.SEM_MEDICAO)[0], (SIT[b.situacao] || SIT.SEM_MEDICAO)[1])]), 'Sem benefícios medidos nesta gerência.'); } });
  dash({ id:'n3-pk', ordem:50, largura:'meia', titulo:'Pessoa-chave e capacidade local (C0)', sub:'I3.15 e I3.16', render(d, g){
    const c = C(), rows = c.linhasCandidatas(d), c0 = c.otimizar(d, { rows }), rs = rows.filter(r => !g || r.gerenciaId === g), pk = c.pessoaChave(d, rs.map(r => r.id), { rows }), ug = c.utilizacaoPorGerencia(d, c0.ids, { rows }).filter(x => !g || x.gerenciaId === g);
    return `<p class="pf3-mini" style="margin:0 0 6px">${B('R26')} ${B('R24')}</p><p class="muted" style="margin:0 0 8px">Candidatas com a pessoa-chave K: <b class="lime">${pc(pk.valor)}</b> (${pk.n} de ${pk.total}${pk.ids.length ? ': ' + esc(pk.ids.join(', ')) : ''}).</p>` +
      CH.hbar(ug.map(x => ({ label:x.gerenciaId, value:x.u == null ? 0 : x.u, mark:1, color: x.u > 1 + EPS ? 'bad' : 'lime' })), { fmt:v => pc(v, 0) }) +
      tab(['Gerência', ['FTE', 'r'], ['Capacidade', 'r'], ['Uso', 'r']], ug.map(x => [esc(x.gerenciaId), n1(x.fte), n1(x.cap), x.u == null ? 'sem capacidade' : pc(x.u)])); } });

  /* ================================================================== INDICADORES I3.x (§7.4; sem I3.9–I3.11 e I3.14, fora da v1) */
  const K = o => PF.registerKpi(Object.assign({ nivel:3 }, o));
  const rowsD = d => C().linhasCandidatas(d);
  K({ id:'I3.1', nome:'Valor ótimo da carteira (C0)', unidade:'pts', essencial:true, regra:['R24', 'R20'], valor:d => C().otimizar(d, { rows:rowsD(d) }).valor, fmt:v => n2(v),
    formula:'V* = max ΣN s.a. ΣFTE ≤ cap; Σcusto ≤ orç; obrigatórias ∈ S; (a ⇒ b) ⇒ b ∈ S; |S ∩ grupo| ≤ 1; D(S) ≤ Dmáx; ΣFTE_g ≤ cap_g',
    conta:d => { const c = C(), rows = rowsD(d); return tab(['Cenário', 'Carteira', ['FTE', 'r'], ['R$ mi', 'r'], ['V*', 'r']], (d.cenarios || []).map(x => { const r = c.cenario(d, x, { rows }); return [esc(x.id), esc(r.ids.join(', ')), n1(r.fte), n2(r.custo), n2(r.valor)]; })); },
    interpretacao:'V* é o maior valor somado (ΣN) que cabe nas restrições. Compare o V* de duas configurações para achar o custo de uma política.', armadilha:'C3 muda os pesos: o valor fica em outra escala e não se compara. C5 inclui P09, que não tem pontuação.' });
  K({ id:'I3.2', nome:'Custo de restrição: mix D ≤ tolerância', unidade:'pts', essencial:true, regra:['R28', 'R30'], valor:d => C().custoRestricao(d, { rows:rowsD(d) }, { maxD:C().param(d, 'R28').toleranciaD }).custo, fmt:v => n2(v),
    formula:'custo = V*(sem) − V*(com); % = custo ÷ V*(sem)', conta:d => tab(['Política', ['V* com ela', 'r'], ['Custo', 'r'], ['%', 'r']], C().custosPolitica(d, { rows:rowsD(d) }).map(p => [esc(p.nome), n2(p.vCom), n2(p.custo), pc(p.pct)])),
    interpretacao:'Quantos pontos de valor (N) a carteira abre mão para cumprir a política. Não é dinheiro: é valor de priorização deixado de lado.', armadilha:'Custos de política não se somam: reserva + mix custa o mesmo que cada uma; dependência + capacidade por gerência custa mais que a soma.' });
  K({ id:'I3.3', nome:'Eficiência da linha de corte', unidade:'%', regra:'R24', valor:d => C().metodos(d, { rows:rowsD(d) }).corte.eficiencia,
    formula:'V(proposta) ÷ V*(mesmas restrições)', conta:d => { const M = C().metodos(d, { rows:rowsD(d) }); return `Linha de corte: ${n2(M.corte.valor)} ÷ ${n2(M.otimo.valor)} = <b>${pc(M.corte.eficiencia)}</b><br>Guloso N/FTE: ${n2(M.guloso.valor)} ÷ ${n2(M.otimo.valor)} = <b>${pc(M.guloso.eficiencia)}</b>`; },
    interpretacao:'Quanto do valor possível a regra simples captura. Abaixo de 100%, há valor deixado na mesa.', armadilha:'Eficiência alta não prova que a carteira é boa: as restrições podem estar erradas.' });
  K({ id:'I3.4', nome:'Valor marginal de +0,5 FTE (a partir da capacidade atual)', unidade:'pts', regra:'R24', valor:d => { const c = C(), cap = c.capacidadeTotal(d), m = c.fronteira(d, { base:{ rows:rowsD(d) } }).marginal.find(x => Math.abs(x.de - cap) < EPS); return m ? m.delta : null; }, fmt:v => (v > EPS ? '+' : '') + n2(v),
    motivo:'A capacidade do ciclo está fora da faixa da fronteira (4 a 10,5 FTE).', formula:'[V*(C + 0,5) − V*(C)] por 0,5 FTE',
    conta:d => tab(['De → até', ['ΔV*', 'r']], C().fronteira(d, { base:{ rows:rowsD(d) } }).marginal.map(m => [`${n1(m.de)} → ${n1(m.ate)}`, n2(m.delta)])),
    interpretacao:'Quanto vale meio FTE a mais. Ajuda a discutir tanque de terceiros ou realocação.', armadilha:'O valor anda em degraus: um passo pode valer 0 e o seguinte, muito.' });
  K({ id:'I3.5', nome:'Núcleo robusto (frequência ≥ limiar em C0–C6)', unidade:'iniciativas', essencial:true, regra:'R32', valor:d => C().robustez(d).nucleo.length, fmt:v => fmt.n(v),
    formula:'frequência(i) = nº de cenários de C0–C6 com i no ótimo ÷ 7; núcleo = frequência ≥ R32',
    conta:d => { const c = C(), a = c.robustez(d), b = c.robustez(d, { incluir:['C7'] }); return tab(['Candidata', ['C0–C6', 'r'], ['Com C7', 'r']], Object.keys(a.frequencia).map(id => [`${esc(id)}${a.nucleo.includes(id) ? ' <b class="lime">núcleo</b>' : ''}`, pcx(a.frequencia[id].pct), pcx((b.frequencia[id] || {}).pct)])); },
    interpretacao:'Quem aparece no ótimo em quase todos os cenários de incerteza é aposta segura para o núcleo da recomendação.', armadilha:'C7 e C8 são políticas, não incerteza: não entram na frequência (avalie pelo custo).' });
  K({ id:'I3.6', nome:'Limiar de reversão: P05 passa P06 (peso de C4)', unidade:'%', regra:'R20', valor:d => { const L = C().limiarReversao(d, 'P05', 'P06', 'C4'); return L.valido ? L.limiar : null; },
    motivo:'P05 ou P06 fora das candidatas, ou a ordem não se inverte entre 0% e 100%.', formula:'menor w4 (renormalizando os demais) com S(P05) > S(P06)',
    conta:d => ['P06', 'P03'].map(b => { const L = C().limiarReversao(d, 'P05', b, 'C4'); return `P05 × ${b}: w4 ${L.sentido === 'ABAIXO' ? '<' : '>'} <b>${pc(L.limiar)}</b>`; }).join('<br>'),
    interpretacao:'O quanto o peso precisaria mudar para inverter a ordem. Longe do peso atual = decisão estável.', armadilha:'Usar o limiar para “achar o peso que faz a favorita entrar” é manipulação.' });
  K({ id:'I3.7', nome:'Estabilidade do ranking (ρ de Spearman, w4 15% → 30%)', unidade:'ρ', regra:'R30', valor:d => C().sensibilidade(d, { C4:0.30 }).rho, fmt:v => n3(v),
    formula:'ρ = correlação de Pearson entre os postos (postos médios nos empates)',
    conta:d => { const c = C(), s = c.sensibilidade(d, { C4:0.30 }), eq = byId(d.ahpExemplos, 'EQUIPE'); return `w4 = 30%: ρ <b>${n3(s.rho)}</b>; seleção ${s.selecaoMudou ? 'muda' : 'não muda'}<br>${eq ? `Pesos AHP da equipe: ρ <b>${n3(c.sensibilidade(d, c.pesosAhp(eq.matriz, eq.criterios)).rho)}</b>` : ''}`; },
    interpretacao:'1 = mesmo ranking. Perto de 1, a mudança de peso mexe pouco na ordem.', armadilha:'O ranking pode mudar sem a seleção mudar: olhe as duas coisas.' });
  K({ id:'I3.8', nome:'Consistência AHP (CR da matriz da equipe) · aprofundamento', unidade:'CR', regra:'R30', valor:d => { const eq = byId(d.ahpExemplos, 'EQUIPE'); return eq ? C().ahp(eq.matriz).CR : null; }, fmt:v => n3(v),
    formula:'CI = (λmax − n) ÷ (n − 1); CR = CI ÷ RI (RI 0,58 / 0,90 / 1,12)', conta:d => tab(['Matriz', ['λmax', 'r'], ['CR', 'r']], (d.ahpExemplos || []).map(x => { const r = C().ahp(x.matriz); return [esc(x.nome), n3(r.lambdaMax), n3(r.CR)]; })),
    interpretacao:'CR < 0,10: julgamentos consistentes. Acima, refaça antes de usar os pesos.', armadilha:'Pesos de AHP não substituem a v1 do ciclo: viram versão candidata (R35).' });
  K({ id:'I3.12', nome:'Realização × meta (pior benefício)', unidade:'%', regra:'R30', valor:d => { const v = C().beneficiosResumo(d).filter(b => b.realizacaoMeta != null).map(b => b.realizacaoMeta); return v.length ? Math.min(...v) : null; },
    motivo:'Nenhum benefício com medição.', formula:'(real − base) ÷ (meta − base)', conta:d => C().beneficiosResumo(d).filter(b => b.ultima).map(b => `${esc(b.id)}: (${n1(b.ultima.realizado)} − ${n1(b.base)}) ÷ (${n1(b.meta)} − ${n1(b.base)}) = <b>${pc(b.realizacaoMeta, 0)}</b>`).join('<br>'),
    interpretacao:'Quanto do caminho até a meta já foi percorrido.', armadilha:'No mês 6 de 12, 20% da meta pode ser normal ou ruim: compare com a trajetória (I3.13).' });
  K({ id:'I3.13', nome:'Realização × trajetória (pior benefício)', unidade:'%', essencial:true, regra:'R30', valor:d => { const v = C().beneficiosResumo(d).filter(b => b.realizacaoTrajetoria != null).map(b => b.realizacaoTrajetoria); return v.length ? Math.min(...v) : null; },
    motivo:'Nenhum benefício com medição.', formula:'(real − base) ÷ (planejado_t − base)', conta:d => C().beneficiosResumo(d).filter(b => b.ultima).map(b => `${esc(b.id)}: (${n1(b.ultima.realizado)} − ${n1(b.base)}) ÷ (${n1(b.ultima.planejado)} − ${n1(b.base)}) = <b>${pc(b.realizacaoTrajetoria, 0)}</b>`).join('<br>'),
    interpretacao:'Abaixo de 100%, o benefício está atrás do planejado para esta data.', armadilha:'A fórmula vale para KPI “menor é melhor” (BEN-02): numerador e denominador ficam negativos.' });
  K({ id:'I3.15', nome:'Pessoa-chave nas candidatas', unidade:'%', regra:'R30', valor:d => C().pessoaChave(d, null, { rows:rowsD(d) }).valor,
    formula:'count(i com K) ÷ n', conta:d => { const c = C(), rows = rowsD(d), a = c.pessoaChave(d, null, { rows }), b = c.pessoaChave(d, c.otimizar(d, { rows }).ids, { rows }); return `Candidatas: ${a.n} ÷ ${a.total} = <b>${pc(a.valor)}</b> (${esc(a.ids.join(', '))})<br>Carteira C0: ${b.n} ÷ ${b.total} = <b>${pc(b.valor)}</b>`; },
    interpretacao:'Muitas iniciativas dependendo da mesma pessoa é risco sistêmico da carteira.', armadilha:'A pessoa-chave K é fictícia; o risco não aparece olhando uma iniciativa por vez.' });
  K({ id:'I3.16', nome:'Maior utilização por gerência (C0)', unidade:'%', regra:['R26', 'R24'], valor:d => { const c = C(), rows = rowsD(d), u = c.utilizacaoPorGerencia(d, c.otimizar(d, { rows }).ids, { rows }).map(x => x.u).filter(x => x != null); return u.length ? Math.max(...u) : null; },
    formula:'Σfte(sel, g) ÷ capacidade(g)', conta:d => { const c = C(), rows = rowsD(d); return c.utilizacaoPorGerencia(d, c.otimizar(d, { rows }).ids, { rows }).map(x => `${esc(x.gerenciaId)}: ${n1(x.fte)} ÷ ${n1(x.cap)} = <b>${x.u == null ? 'sem capacidade' : pc(x.u)}</b> (${esc(x.faixa ? x.faixa.id : '—')})`).join('<br>'); },
    interpretacao:'Acima de 100%, a gerência não comporta a parte dela na carteira, mesmo que o total caiba.', armadilha:'O agregado esconde o local: FTE não é fungível entre gerências.' });
  K({ id:'I3.17', nome:'Mix por horizonte: distância D_h (C0)', unidade:'pp', regra:'R31', valor:d => { const c = C(), rows = rowsD(d); return c.mixHorizonte(d, c.otimizar(d, { rows }).ids, { rows }).Dh; }, fmt:v => pp(v),
    formula:'pₕ = custo por horizonte ÷ custo da carteira; D_h = ½ Σ |pₕ − alvoₕ|', conta:d => { const c = C(), rows = rowsD(d), m = c.mixHorizonte(d, c.otimizar(d, { rows }).ids, { rows }); return Object.keys(m.pct).map(h => `${esc(h)}: ${pc(m.pct[h])} × alvo ${pc(m.alvo[h] || 0, 0)}`).join('<br>') + `<br>D_h = <b>${pp(m.Dh)}</b>`; },
    interpretacao:'Distância entre o mix da carteira e a referência 70/20/10 do deck.', armadilha:'70/20/10 é proposta a validar (s209), não meta oficial.' });
  K({ id:'I3.18', nome:'Custo em núcleo crítico (classe de sourcing, C0)', unidade:'%', regra:'R40', valor:d => { const c = C(), rows = rowsD(d); return c.custoPorSourcing(d, c.otimizar(d, { rows }).ids, { rows }).pct.NUCLEO_CRITICO ?? 0; },
    formula:'custo por classe da ferramenta ÷ custo da carteira', conta:d => { const c = C(), rows = rowsD(d), s = c.custoPorSourcing(d, c.otimizar(d, { rows }).ids, { rows }); return Object.keys(s.pct).map(k => `${esc(k)}: <b>${pc(s.pct[k])}</b> (${esc(s.porClasse[k].join(', '))})`).join('<br>'); },
    interpretacao:'Quanto da carteira mexe em ferramentas de núcleo crítico, onde o deck propõe mais cuidado de sourcing.', armadilha:'A classe vem do vínculo de catálogo da ferramenta; iniciativa sem ferramenta fica “sem ferramenta”.' });

  /* ================================================================== ABAS DA FICHA DA INICIATIVA */
  PF.registerFichaTab({ id:'n3-ben', nivel:3, titulo:'Benefícios', ordem:80, render(ini, d){
    const bs = C().beneficiosResumo(d).filter(b => b.iniciativaId === ini.id);
    if(!bs.length) return `<p class="muted">Sem KPI de benefício registrado para ${esc(ini.id)}.</p>${ini.beneficioEsperado ? `<p>Benefício esperado (texto): <b>${esc(ini.beneficioEsperado)}</b> ${ILU()}</p>` : ''}<p class="pf3-mini">No N3, benefício vira KPI com base, meta, dono e trajetória.</p>`;
    return tab(['Benefício', ['Base → meta', 'r'], ['× meta', 'r'], ['× trajetória', 'r'], 'Situação'], bs.map(b => { const o = byId(d.beneficios, b.id) || {};
      return [`<b>${esc(b.id)}</b>${o.proposto ? ' <small>proposto</small>' : ''}<small>${esc(b.kpi)}</small>`, `${n1(b.base)} → ${n1(b.meta)}`, pc(b.realizacaoMeta, 0), pc(b.realizacaoTrajetoria, 0), ui.pill((SIT[b.situacao] || SIT.SEM_MEDICAO)[0], (SIT[b.situacao] || SIT.SEM_MEDICAO)[1])]; })) +
      `<p class="pf3-mini">${B('R30')} ${ILU()} <a href="#/n3/valor" data-pf-close="1">Abrir Benefícios & Inovação</a></p>`; } });
  PF.registerFichaTab({ id:'n3-dep', nivel:3, titulo:'Dependências lógicas', ordem:85, render(ini, d){
    const c = C(), deps = (d.dependencias || []).filter(x => x.tipo === 'LOGICA' && (x.iniciativaOrigemId === ini.id || x.iniciativaDependenciaId === ini.id)), grp = ini.grupoExclusividade ? c.gruposExclusividade(d).find(g => g.includes(ini.id)) : null;
    if(!deps.length && !grp) return `<p class="muted">${esc(ini.id)} não tem dependência lógica nem grupo de exclusividade: no otimizador, entra ou sai sozinha.</p><p class="pf3-mini">Dependência lógica é uma regra “se A entra, B precisa entrar” ${B('R09')}.</p>`;
    const dep = deps.length ? (c.custosPolitica(d, { rows:c.linhasCandidatas(d) }).find(p => p.id === 'DEP') || {}) : null;
    return (deps.length ? tab(['Regra', 'Situação', ['O que significa', 'wrap']], deps.map(x => [`<b>${esc(x.iniciativaOrigemId)} ⇒ ${esc(x.iniciativaDependenciaId)}</b>`, `${c.dependenciaAberta(d, x) ? ui.pill(x.confirmada ? 'Confirmada' : 'A confirmar', x.confirmada ? 'ok' : 'warn') : ui.pill('Encerrada', 'dim')}`,
        `Se ${esc(x.iniciativaOrigemId)} entrar na carteira, ${esc(x.iniciativaDependenciaId)} precisa entrar junto. <small>${esc(x.descricao || '')}</small>`])) : '') +
      (dep && dep.custo != null ? `<p>Ligada no otimizador, esta dependência custa <b class="lime">${n2(dep.custo)}</b> pontos (${pc(dep.pct)}): é o cenário C1 ${B('R30')}.</p>` : '') +
      (grp ? `<p>Grupo de exclusividade: <b>{${esc(grp.join(', '))}}</b>, no máximo uma delas na carteira ${ILU()}.</p>` : '') +
      `<p class="pf3-mini">${B('R09')} ${ILU()} <a href="#/n3/otimizador?aba=restricoes" data-pf-close="1">Abrir o Otimizador</a></p>`; } });
  PF.registerFichaTab({ id:'n3-cen', nivel:3, titulo:'Cenários', ordem:90, render(ini, d){
    const c = C(), rows = c.linhasCandidatas(d); if(!rows.some(r => r.id === ini.id)) return `<p class="muted">${esc(ini.id)} não é candidata do Ciclo Exemplo 2027: não entra no otimizador nem nos cenários.</p>`;
    const rob = c.robustez(d), fq = rob.frequencia[ini.id] || {}, L = ultimoLote(d), dec = L && L.decs.find(x => x.iniciativaId === ini.id);
    return `<p>Frequência em C0–C6: <b class="lime">${pcx(fq.pct)}</b> (${fq.n} de ${fq.total}) ${rob.nucleo.includes(ini.id) ? ui.pill('Núcleo robusto', 'ok') : ''} ${B('R32')}</p>` +
      tab(['Cenário', 'No ótimo?', ['Valor do ótimo', 'r']], (d.cenarios || []).map(x => { const r = c.cenario(d, x, { rows }); return [`<b>${esc(x.id)}</b> <small>${esc(x.nome)}</small>`, r.ids.includes(ini.id) ? '<b class="lime">sim</b>' : 'não', n2(r.valor)]; })) +
      `<p class="pf3-mini">${dec ? `Recomendação vigente do ciclo: <b>${esc(classeNome(d, dec.classeRecomendacao))}</b> [SIMULAÇÃO]. ` : ''}<a href="#/n3/cenarios" data-pf-close="1">Abrir Cenários & Robustez</a></p>`; } });

  /* ================================================================== GLOSSÁRIO N3 (§8.3; sem os termos que saíram da v1) */
  PF.registerGlossario(3, [
    ['Custo de restrição', 'Quanto o valor ótimo cai quando uma política entra: V*(sem) − V*(com).'], ['Fronteira eficiente', 'O melhor valor possível para cada nível de recurso (V* × FTE).'],
    ['Pareto (não dominada)', 'Candidata que nenhuma outra supera em valor usando menos recurso.'], ['Valor marginal', 'Quanto +0,5 FTE acrescenta ao valor ótimo; anda em degraus porque a seleção é inteira.'],
    ['Cenário', 'Variação de uma premissa (capacidade, dependência, pesos…) para testar a carteira.'], ['Gatilho', 'Fato observável que, se acontecer, torna o cenário real ou reativa uma iniciativa.'],
    ['Robustez', 'Frequência com que uma candidata aparece no ótimo dos cenários de incerteza (C0–C6).'], ['Núcleo robusto', 'Candidatas com frequência acima do limiar (80%, a validar).'],
    ['Sensibilidade', 'Teste do que muda no ranking e na seleção quando um peso muda.'], ['Limiar de reversão', 'Peso a partir do qual uma candidata passa outra.'],
    ['ρ de Spearman', 'Concordância entre dois rankings (1 = iguais).'], ['AHP', 'Método de Saaty: pesos a partir de comparações par a par (aprofundamento).'],
    ['CR (razão de consistência)', 'Mede contradição nos julgamentos do AHP; acima de 0,10, refaça.'], ['TRL', 'Nível de maturidade tecnológica, de 1 a 9; o deck propõe transferir à entrega a partir do 7.'],
    ['Horizontes H1/H2/H3', 'Núcleo, adjacente e transformacional; o 70/20/10 do deck é referência a validar.'], ['Benefício', 'Resultado mensurável esperado, com KPI, base, meta, dono e fonte.'],
    ['Trajetória', 'Caminho planejado do KPI da base até a meta; compara-se o realizado com ele em cada data.'], ['Pessoa-chave', 'Pessoa da qual muitas iniciativas dependem: risco sistêmico.'],
    ['Classe de sourcing', 'Núcleo crítico, periférico, mercado ou legado (proposta s231–s235).'], ['Custo afundado', 'Gasto passado e irrecuperável; não justifica continuar.'],
    ['Pre-mortem', 'Imaginar que deu errado daqui a 12 meses e perguntar por quê, para tratar os riscos agora.'],
  ].map(([termo, def]) => ({ termo, def })));

  /* ================================================================== DESAFIO (§7.6; verificado contra PF.base com pesos v1) */
  /** Gabarito do desafio calculado sobre um conjunto de dados (padrão: a referência PF.base). */
  function gabDesafio(b = PF.base){
    const c = C(), rows = c.linhasCandidatas(b), cp = c.custosPolitica(b, Object.assign({ rows }, c.optsCenario(b, 'C2'))), g = id => (cp.find(p => p.id === id) || {}).custo;
    return { dep:g('DEP'), mix:g('MIX'), gcap:g('GCAP'), nucleo:c.robustez(b).nucleo.slice().sort(), lim:(c.limiarReversao(b, 'P05', 'P03', 'C4').limiar || 0) * 100, muda:c.sensibilidade(b, { C4:0.30 }).selecaoMudou,
      ben:Object.fromEntries(c.beneficiosResumo(b).filter(x => x.ultima).map(x => [x.id, x.situacao])), base3:c.linhaBaseSugerida(b, 'BEN-03'), pk:c.pessoaChave(b, null).valor * 100 }; }
  /** Onde os dados de trabalho diferem da referência naquilo que o desafio usa (pesos, parâmetros, candidatas, dependências, medições). */
  function divergencias(d){ const c = C(), b = PF.base, h = PF.hash, out = [];
    if(!mesmosPesos(c.pesosEfetivos(d))) out.push(`pesos vigentes (${versaoPesos(d)})`);
    const pars = ['R24', 'R26', 'R27', 'R28', 'R32'].filter(k => h(c.param(d, k) ?? null) !== h(c.param(b, k) ?? null)); if(pars.length) out.push('parâmetros ' + pars.join(', '));
    const ck = r => ({ N:+(+r.N).toFixed(4), fte:r.fte, custo:r.custo, g:r.gerenciaId, K:!!r.K, R:r.R, h:r.horizonte || null, s:r.classeSourcing || null });
    const rb = c.linhasCandidatas(b), rd = c.linhasCandidatas(d), ids = Array.from(new Set(rb.map(r => r.id).concat(rd.map(r => r.id))));
    const ini = ids.filter(id => { const x = rb.find(r => r.id === id), y = rd.find(r => r.id === id); return !x || !y || h(ck(x)) !== h(ck(y)); }); if(ini.length) out.push('candidatas ' + ini.join(', '));
    if(h(c.depsLogicas(d)) !== h(c.depsLogicas(b))) out.push('dependências lógicas');
    const ms = (z, id) => h(((c.beneficio(z, id) || {}).medicoes || []).map(m => [m.data, +m.mes, +m.realizado, +m.planejado]));
    const bn = (b.beneficios || []).map(x => x.id).filter(id => ms(d, id) !== ms(b, id)); if(bn.length) out.push('medições de ' + bn.join(', '));
    return out; }
  /** A matriz salva é igual a um dos exemplos prontos (M1, M2, equipe)? Então não é um AHP próprio. */
  function ahpExemplo(a){ if(!a || !Array.isArray(a.criterios) || !Array.isArray(a.matriz)) return false;
    return (PF.base.ahpExemplos || []).some(ex => { const p = presetAhp(PF.base, ex.id), M = matrizDe(p);
      return p.crit.join() === a.criterios.join() && M.every((row, i) => row.every((v, j) => Math.abs(v - +((a.matriz[i] || [])[j])) < 1e-9)); }); }
  function conferirDesafio(){
    const c = C(), s = MS(), x = s.des || {}, d = PF.db(), gB = gabDesafio(PF.base), dv = divergencias(d), gW = dv.length ? gabDesafio(d) : null;
    const near = (v, a, t) => v != null && a != null && Math.abs(v - a) <= t + EPS, ok = a => a.every(Boolean), mk = v => v ? '✓' : '✗';
    const conf = f => !!(f(gB) || (gW && f(gW)));      // aceita a resposta da referência ou a dos dados de trabalho (quando diferem)
    const p1 = [conf(g => near(num(x.dep), g.dep, 0.5)), conf(g => near(num(x.mix), g.mix, 0.5)), conf(g => near(num(x.gcap), g.gcap, 0.5))];
    const prop = (d.cenarios || []).filter(z => (z.proprio || !byId(PF.base.cenarios, z.id)) && String(z.gatilho || '').trim().length >= 15 && nMudancas(z) === 1), p2 = [prop.length > 0, conf(g => (x.nucleo || []).slice().sort().join() === g.nucleo.join())];
    const p3 = [conf(g => near(num(x.lim), g.lim, 1)), conf(g => x.muda === (g.muda ? 'muda' : 'nao'))];
    const cand = (d.regras || []).filter(r => r.codigo === 'R20' && r.vigente === false && r.fonteCandidata === 'AHP' && r.ahp && Array.isArray(r.ahp.matriz) && c.ahp(r.ahp.matriz).CR < 0.10 - EPS), p4 = [cand.length > 0, cand.some(r => !ahpExemplo(r.ahp))];
    const b3 = byId(d.beneficios, 'BEN-03') || {}, hb = (d.historico || []).some(h => h.entidade === 'beneficios' && h.entidadeId === 'BEN-03' && h.campoAlterado === 'linhaBase' && String(h.justificativa || '').trim().length >= 10);
    const p5 = [conf(g => x.ben01 === g.ben['BEN-01'] && x.ben02 === g.ben['BEN-02']), String(x.acao02 || '').trim().length >= 20, conf(g => near(num(b3.linhaBase), g.base3, 0.5)) && hb];
    const p6 = [conf(g => near(num(x.pk), g.pk, 0.5)), String(x.mitig || '').trim().length >= 20];
    const L = ultimoLote(d), av = L ? c.avaliarRecomendacaoCiclo(PF.base, L.classes) : null, avW = L && dv.length ? c.avaliarRecomendacaoCiclo(d, L.classes) : null;
    const fotos = (d.snapshotsForum || []).filter(z => z.forumId === 'FR-CICLO' && z.status === 'FECHADO' && !vazio(z.hashConteudo)), foto = L && fotos.find(z => (z.recomendacaoJson || {}).loteId === L.id && z.hashConteudo === conteudoHash(z) && pesosOk(z));
    const p7 = [!!((av && av.ok) || (avW && avW.ok)), !!L && String(L.justificativa || '').trim().length >= 20, !!L && L.custos.length > 0, pesosOk(L), !!L && String(L.preMortem || '').trim().length >= 20, !!foto];
    const fotoLote = L && fotos.find(z => (z.recomendacaoJson || {}).loteId === L.id);
    const fotoTxt = foto ? '✓' : fotoLote ? (pesosOk(fotoLote) ? '✗ (o conteúdo não confere com o hash)' : '✗ (fechada com pesos diferentes da v1)') : fotos.length && L ? '✗ (a fechada é de outra recomendação: gere e feche a desta)' : '✗';
    const passos = [
      { n:1, ok:ok(p1), txt:`dependência ${mk(p1[0])} · mix ${mk(p1[1])} · capacidade por gerência ${mk(p1[2])} (±0,5)` },
      { n:2, ok:ok(p2), txt:`cenário próprio com uma mudança e gatilho ≥ 15 caracteres ${mk(p2[0])} · núcleo esperado ${mk(p2[1])}` },
      { n:3, ok:ok(p3), txt:`limiar P05 × P03 ${mk(p3[0])} (±1 pp) · seleção com w4 = 30% ${mk(p3[1])}` },
      { n:4, ok:ok(p4), txt:`versão candidata de pesos pelo AHP com CR < 0,10 (não vigente) ${mk(p4[0])} · julgamentos próprios, diferentes dos exemplos prontos ${mk(p4[1])}` },
      { n:5, ok:ok(p5), txt:`situação de BEN-01 e BEN-02 ${mk(p5[0])} · ação para BEN-02 (≥ 20 caracteres) ${mk(p5[1])} · linha de base de BEN-03 corrigida com justificativa ${mk(p5[2])}` },
      { n:6, ok:ok(p6), txt:`% das candidatas com K ${mk(p6[0])} (±0,5) · mitigação (≥ 20 caracteres) ${mk(p6[1])}` },
      { n:7, ok:ok(p7), txt:`classificação ≥ 6 pontos ${mk(p7[0])}${av ? ` (${fmt.n(av.nota, av.nota % 1 ? 1 : 0)})` : ''} · justificativa ${mk(p7[1])} · custos adotados ${mk(p7[2])} · pesos v1 ${mk(p7[3])}${L && !p7[3] ? ` (registrado com ${L.versaoPesos})` : ''} · pre-mortem ${mk(p7[4])} · fotografia FR-CICLO FECHADA desta recomendação ${fotoTxt}` } ];
    const nOk = passos.filter(p => p.ok).length;
    return { ok: nOk >= 6 && passos[6].ok, nota: Math.round(nOk / 7 * 100), passos, nOk, divergencias:dv };
  }
  const desafio = {
    titulo:'Recomendação de carteira do Ciclo Exemplo 2027 (ILUSTRATIVA)',
    descricao:'Sete passos conferidos contra a referência (pesos v1), alguns com variantes que você calcula nas telas (por exemplo, 8 FTE no Otimizador). Conclui com pelo menos 6 de 7, sendo o passo 7 obrigatório. Na v1, o passo 4 é o AHP (caminho crítico e opção real ficaram para as próximas versões) e o passo 6 usa a pessoa-chave (sem HHI).',
    render(el, ctx, done){
      const s = MS(), x = s.des = s.des || {}, b = PF.base, res = s.desRes || null, st = n => res ? (res.passos[n - 1].ok ? 'ok' : 'err') : '', cands = C().linhasCandidatas(b).map(r => r.id);
      const fb = n => res ? `<p class="pf3-mini" style="margin:0">${res.passos[n - 1].ok ? '<span class="pf3-ok">✓ confere</span>' : '<span class="pf3-no">✗ ainda não</span>'} · ${esc(res.passos[n - 1].txt)}</p>` : '';
      const ninp = (k, label) => `<label class="field">${label}<input class="input" data-d3="${k}" value="${esc(x[k] ?? '')}" inputmode="decimal" placeholder="número"></label>`;
      const sel = (k, label, opts) => `<label class="field">${label}<select class="select" data-d3="${k}"><option value="">Escolha…</option>${opts.map(([v, l]) => `<option value="${v}" ${x[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
      const txt = (k, label, ph) => `<label class="field">${label}<textarea class="input" rows="2" data-d3="${k}" placeholder="${esc(ph)}">${esc(x[k] || '')}</textarea></label>`;
      const a = (h, l, ic) => `<a class="btn btn-ghost btn-sm pf3-a" href="${h}">${icon(ic, 14)} ${l}</a>`, sitOpts = [['ACIMA', 'Acima da trajetória'], ['ABAIXO', 'Abaixo da trajetória'], ['NA_TRAJETORIA', 'Na trajetória']];
      const dv = divergencias(PF.db());
      el.innerHTML = `<div class="stack">${ui.seloExercicio()}${ui.callout('dica', `<p>Os passos 1, 3 e 6 pedem números de variantes: use as telas para calcular (o Otimizador aceita outra capacidade). Tudo é conferido contra a referência com os pesos v1 ${B('R20')} ${B('R35')}.</p>`)}
        ${dv.length ? ui.callout('atencao', `<p>Seus dados de trabalho diferem da referência em: <b>${esc(dv.join('; '))}</b>. Por isso alguns números das telas podem não bater com os da referência. Nos passos 1, 2, 3, 5, 6 e 7, a conferência aceita a resposta da referência ou a dos seus dados de trabalho.</p><p class="pf3-mini">Para voltar ao conjunto original: <a href="#/config">Configurações</a> → Restaurar dados de exemplo (apaga também os registros deste exercício: cenários próprios, versões candidatas, decisões e fotografias).</p>`, 'Seus dados mudaram') : ''}
        <div class="pf3-step ${st(1)}"><h4>1 · Variante C2 (8 FTE): quanto custa cada política?</h4><p class="pf3-mini" style="margin:0">Base: C2 (capacidade de 8 FTE) ${B('R24')}. Custo = V*(sem) − V*(com), obtido no Otimizador. Tolerância ±0,5.</p>
          <div class="pf3-grid-in">${ninp('dep', 'Dependência P08 ⇒ P02')}${ninp('mix', 'Mix D ≤ 15 pp')}${ninp('gcap', 'Capacidade por gerência')}</div><div>${a('#/n3/otimizador?aba=restricoes', 'Abrir Otimizador', 'layers')}</div>${fb(1)}</div>
        <div class="pf3-step ${st(2)}"><h4>2 · Um cenário próprio e o núcleo esperado</h4><p class="pf3-mini" style="margin:0">Crie em Cenários & Robustez um cenário com <b>uma</b> mudança e gatilho de pelo menos 15 caracteres. Depois marque o núcleo robusto esperado (C0–C6) ${B('R32')}.</p>
          <div class="row">${cands.map(id => `<label class="pf3-chk"><input type="checkbox" data-d3-nuc="${id}" ${(x.nucleo || []).includes(id) ? 'checked' : ''}> ${id}</label>`).join('')}</div><div>${a('#/n3/cenarios', 'Abrir Cenários', 'branch')}</div>${fb(2)}</div>
        <div class="pf3-step ${st(3)}"><h4>3 · Variante de sensibilidade</h4><p class="pf3-mini" style="margin:0">A partir de que peso de C4 a P05 passa <b>P03</b> (em %, ±1)? E a seleção ótima muda com w4 = 30%? ${B('R20')}</p>
          <div class="pf3-grid-in">${ninp('lim', 'Limiar de w4 (%)')}${sel('muda', 'Com w4 = 30%, a seleção…', [['muda', 'muda'], ['nao', 'não muda']])}</div><div>${a('#/n3/sensibilidade', 'Abrir Sensibilidade', 'compass')}</div>${fb(3)}</div>
        <div class="pf3-step ${st(4)}"><h4>4 · Aprofundamento: AHP próprio</h4><p class="pf3-mini" style="margin:0">Monte uma matriz 3×3 a 5×5 com os <b>seus</b> julgamentos (salvar um exemplo pronto sem mudança não conta), com CR &lt; 0,10, e salve como versão candidata de pesos (fica não vigente; a v1 continua) ${B('R30')}.</p><div>${a('#/n3/sensibilidade?aba=ahp', 'Abrir AHP', 'compass')}</div>${fb(4)}</div>
        <div class="pf3-step ${st(5)}"><h4>5 · Benefícios</h4><div class="pf3-grid-in">${sel('ben01', 'BEN-01 está…', sitOpts)}${sel('ben02', 'BEN-02 está…', sitOpts)}</div>
          ${txt('acao02', 'Ação para BEN-02 (mínimo 20 caracteres)', 'O que fazer para recuperar a trajetória')}<p class="pf3-mini" style="margin:0">E corrija a linha de base de BEN-03 em Benefícios & Inovação, com justificativa (fica nos dados de trabalho).</p><div>${a('#/n3/valor', 'Abrir Benefícios', 'spark')}</div>${fb(5)}</div>
        <div class="pf3-step ${st(6)}"><h4>6 · Concentração em pessoa-chave</h4><div class="pf3-grid-in">${ninp('pk', '% das candidatas com K')}</div>${txt('mitig', 'Mitigação para a pessoa-chave K (mínimo 20 caracteres)', 'ex.: par técnico, documentação, sequenciamento')}<div>${a('#/n3/otimizador?aba=capacidade', 'Abrir Capacidade local', 'layers')}</div>${fb(6)}</div>
        <div class="pf3-step ${st(7)}"><h4>7 · Recomendação final (obrigatório)</h4><p class="pf3-mini" style="margin:0">No Planejamento do Ciclo: classifique P01–P08 (≥ 6 pontos), adote ao menos uma política com custo, justifique, preencha o pre-mortem e registre com os pesos v1. Depois gere e FECHE a fotografia do FR-CICLO desta recomendação (se registrar de novo, feche uma fotografia nova).</p><div>${a('#/n3/ciclo', 'Abrir Planejamento do Ciclo', 'calendar')}</div>${fb(7)}</div>
        <div class="row"><button class="btn btn-primary" data-d3-conferir>${icon('check', 16)} Conferir desafio</button>${res ? `<span class="pf3-mini">Última conferência: ${res.nOk} de 7 passos${res.ok ? ' · concluído' : ''}.</span>` : ''}</div></div>`;
      el.addEventListener('input', e => { const t = e.target.closest('[data-d3]'); if(t){ x[t.dataset.d3] = t.value; PF.save(); } });
      el.addEventListener('change', e => { const t = e.target; if(t.closest('[data-d3]')){ x[t.dataset.d3] = t.value; PF.save(); }
        if(t.dataset.d3Nuc){ const z = new Set(x.nucleo || []); if(t.checked) z.add(t.dataset.d3Nuc); else z.delete(t.dataset.d3Nuc); x.nucleo = Array.from(z); PF.save(); } });
      el.addEventListener('click', e => { if(!e.target.closest('[data-d3-conferir]')) return; const r = conferirDesafio();
        s.desRes = { ok:r.ok, nOk:r.nOk, passos:r.passos.map(p => ({ ok:p.ok, txt:p.txt })), ts:new Date().toISOString() }; PF.save();
        if(r.passos[0].ok) PF.award('m-preco', 'Preço da política');
        done({ ok:r.ok, nota:r.nota, detalhe:r.passos.map(p => `${p.n}:${p.ok ? 'ok' : 'não'}`).join(' ') }); });
    } };

  /* ================================================================== REGISTRO DO NÍVEL */
  PF.registerLevel({
    id:3, nome:'Regência · Otimização', subtitulo:'Decidir com robustez', pergunta:'Qual a melhor combinação, quanto custam nossas políticas e a escolha se sustenta?',
    objetivos:['Formular políticas como restrições e calcular o custo de cada uma, isoladas e combinadas', 'Ler a fronteira e o valor marginal em degraus', 'Construir cenários com gatilho observável e medir a robustez',
      'Testar a sensibilidade de pesos e achar o limiar de reversão', 'Reconhecer a sobrecarga local e que FTE não é fungível', 'Acompanhar benefícios (meta × trajetória) sem dupla contagem',
      'Ver a concentração em pessoa-chave e por classe de sourcing', 'Redigir a recomendação do ciclo e fechar a fotografia com pesos congelados', 'Aprofundamento (fora do desbloqueio): AHP com CR'],
    unlock:{ minPct:70, desafio:true },
    screens:[
      { id:'otimizador', titulo:'Otimizador', icone:'layers', escreve:true, render:telaOtimizador },
      { id:'cenarios', titulo:'Cenários & Robustez', icone:'branch', escreve:true, render:telaCenarios },
      { id:'sensibilidade', titulo:'Sensibilidade', icone:'compass', escreve:true, render:telaSensibilidade },
      { id:'valor', titulo:'Benefícios & Inovação', icone:'spark', escreve:true, render:telaValor },
      { id:'ciclo', titulo:'Planejamento do Ciclo', icone:'calendar', escreve:true, render:telaCiclo } ],
    questions:[], desafio });

  /** Utilidades para perguntas-n3.js e testes. */
  PF.n3 = { tit, J, CLASSES, classeNome, versaoPesos, mesmosPesos, ultimoLote, gabDesafio, conferirDesafio, divergencias, ahpExemplo, pacote, optsDe, medalhas, nMudancas, idsH, tab, pcx };
})();
