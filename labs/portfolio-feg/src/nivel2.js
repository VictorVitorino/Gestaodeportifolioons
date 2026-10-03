/* =========================================================================
   Portfólio FEG — NÍVEL 2 · ARRANJO · PRIORIZAÇÃO (nivel2.js)
   Telas (spec §6): A · Escolher → Critérios & Pesos, Pontuação & Matrizes, Capacidade & Seleção, Exercício de Gate;
                    B · Acompanhar → Desempenho (EVM), Fórum Mensal. Mais: blocos do Dashboard (§6.4), KPIs I2.x (§6.5),
   abas da ficha (Avaliação & Risco; Capacidade, Custo & EVM), glossário N2 (§8.3) e desafio (§6.7).
   As perguntas (§6.6) ficam em perguntas-n2.js, que anexa a PF.level(2).questions.
   Regras: telas leem PF.db() (trabalho); perguntas e desafio conferem contra PF.base. Todo cálculo vem de PF.calc.
   Pesos/parâmetros: só os da R43, sempre como NOVA versão nas regras do trabalho. Avaliação às cegas: PF.modState(2).cegas.
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
  const MS = () => PF.modState(2);
  const T = {};                                   // estado transitório de formulários (não persiste)
  const hoje = () => new Date().toISOString().slice(0, 10);
  const byId = (arr, id) => (arr || []).find(x => x.id === id) || null;
  const vazio = v => v == null || (typeof v === 'string' && !v.trim());
  const soma = (a, f = x => x) => (a || []).reduce((s, x) => s + (+f(x) || 0), 0);
  const n1 = v => fmt.n(v, 1), n2 = v => fmt.n(v, 2), pc = (v, c = 1) => fmt.pct(v, c), mi = (v, c = 2) => fmt.mi(v, c);
  const pp = v => v == null ? 'n/d' : fmt.n(v * 100, 1) + ' pp';
  const sn = (v, c = 2) => v == null ? 'n/d' : (v > EPS ? '+' : '') + fmt.n(v, c);
  const aula = (txt, t = 'Aula rápida') => ui.callout('conceito', `<p>${txt}</p>`, t);
  const refM = t => `<span class="pf2-ref" title="Marca de interface: referência de mercado (não é regra ONS)">Ref.: ${esc(t)}</span>`;
  const ILU = () => PF.badge('ILUSTRATIVO');
  const DECK = s => `Deck A&M Etapa 3 v25, ${s} (proposta de consultoria, não aprovada)`;
  const PROP = s => PF.badge({ origemRegra:'A_VALIDAR_FEG', tipoFonte:'PROPOSTA_CONSULTORIA', referencia: DECK(s) });
  const AVF = ref => PF.badge({ origemRegra:'A_VALIDAR_FEG', tipoFonte:'PREMISSA_ILUSTRATIVA', referencia: ref || 'Premissa da trilha (a validar FEG)' });
  const tit = (d, id) => { const i = byId(d.iniciativas, id); return i ? String(i.titulo).replace(/ \(fictício\)$/, '') : id; };
  const CAT = { OBRIGATORIA:'Obrigatória', SUSTENTACAO:'Sustentação', EVOLUCAO:'Evolução', INOVACAO:'Inovação' };
  const CATCOR = { OBRIGATORIA:'info', SUSTENTACAO:'warn', EVOLUCAO:'lime', INOVACAO:'#C9B8E8' };
  const GATE = ['GO','GO_CONDICIONADO','HOLD','RECYCLE','KILL'];
  const GNOME = { GO:'Go', GO_CONDICIONADO:'Go condicionado', HOLD:'Hold', RECYCLE:'Recycle', KILL:'Kill' };
  const ACOMP = ['ESCALAR','REPLANEJAR','REGISTRAR_DESVIO'], ANOME = { ESCALAR:'Escalar', REPLANEJAR:'Replanejar', REGISTRAR_DESVIO:'Registrar desvio' };
  const SN = { VERDE:['Verde','ok'], AMARELO:['Amarelo','warn'], VERMELHO:['Vermelho','bad'], CINZA:['Cinza','dim'] };
  const pillS = c => SN[c] ? ui.pill(SN[c][0], SN[c][1]) : esc(c || '—');
  const QV = (d, t, k) => ((((d.catalogos || {}).quadrantes) || {})[t === 'VR' ? 'valorRisco' : 'valorEsforco'] || {})[k] || k;
  const papeis = d => ((d.catalogos || {}).papeisRegistrantes) || [];
  const instancias = (d, k) => ((((d.catalogos || {}).instancias) || {})[k]) || [];
  const faseNome = (d, k) => { const x = (d.statusConfiguracao || []).find(z => z.codigo === k); return `<span title="${esc(k || '')}">${esc((x && (x.nome || x.rotulo)) || k || '—')}</span>`; };
  const versaoPesos = d => { const r = C().regra(d, 'R20'); return r ? (r.rotuloVersao || 'v' + (r.versao || 1)) : 'v1'; };
  const CAMPO = { sinal:'sinal calculado', ragDeclarado:'sinal declarado', desvioMeses:'desvio de prazo (meses)', indice:'índice progresso × gasto', fisico:'% físico', ac:'AC', bac:'BAC', dataPrevistaAtual:'data prevista' };
  const campoNome = k => CAMPO[k] || k;
  /** Rótulos simples das folhas numéricas dos parâmetros editáveis (R43); a chave técnica fica no tooltip. */
  const ROT_PAR = { vermelhoDesvioMeses:'Vermelho: atraso a partir de (meses)', amareloDesvioMeses:'Amarelo: atraso a partir de (meses)', vermelhoIndiceAbaixoDe:'Vermelho: índice abaixo de', amareloIndiceAbaixoDe:'Amarelo: índice abaixo de',
    valorAltoN:'Valor alto: N a partir de', esforcoAltoFteAcimaDe:'Esforço alto: FTE acima de', riscoAlto:'Risco alto: R a partir de', riscoCritico:'Risco crítico: R a partir de',
    tanqueAcimaDe:'Tanque: utilização acima de', reduzirAPartirDe:'Reduzir escopo: utilização a partir de', roadmapAPartirDe:'Roadmap: utilização a partir de',
    'alvo.SUSTENTACAO':'Alvo: Sustentação', 'alvo.EVOLUCAO':'Alvo: Evolução', 'alvo.INOVACAO':'Alvo: Inovação', toleranciaD:'Tolerância do índice D',
    indice:'SPI ou CPI: atenção abaixo de', tcpi:'TCPI: atenção acima de', robustezNucleo:'Núcleo robusto: frequência mínima', limiarHhi:'Concentração (HHI): limiar' };
  const TIPO_PEND = { CAMPO_VAZIO:'campo vazio', DIVERGENCIA_STATUS:'divergência de sinal', DADO_INCONSISTENTE:'dado inconsistente' };
  const LIM_EAC = 0.10;   /* seção 4 da pauta: EAC acima da previsão em mais de 10% (limiar didático a validar) */
  const MAP_VE_VR = { FAZER_PRIMEIRO:'PEROLA', PLANEJAR:'OSTRA', COMPLEMENTAR:'PAO_COM_MANTEIGA', QUESTIONAR:'ELEFANTE_BRANCO' };

  /* ------------------------------------------------------------------ estilo próprio (classes pf2-*) */
  const CSS = `.pf2-a{text-decoration:none}.pf2-a.btn-ghost{color:var(--white)}.pf2-a.btn-primary{color:var(--ink)}
.pf2-ref{font-size:11px;color:var(--dim);font-style:italic;white-space:nowrap}
.pf2-kv{width:100%;border-collapse:collapse;font-size:13px}.pf2-kv td{padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}.pf2-kv td:first-child{color:var(--dim);width:46%}.pf2-kv tr:last-child td{border-bottom:0}
.pf2-ids{display:flex;gap:4px;flex-wrap:wrap}.pf2-id{font-size:12px;border:1px solid var(--line-2);border-radius:6px;padding:1px 6px;font-variant-numeric:tabular-nums}.pf2-id.in{border-color:var(--lime);color:var(--lime)}.pf2-id.out{opacity:.45}
.pf2-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.pf2-m{display:flex;flex-direction:column;gap:10px}
.pf2-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}.pf2-form .full{grid-column:1/-1}.pf2-form .input,.pf2-form .select{width:100%;min-width:0}.pf2-form textarea{resize:vertical}
.pf2-err{color:#F3A39A;font-size:12.5px}.pf2-err:empty{display:none}.field.pf2-bad .input,.field.pf2-bad .select{border-color:var(--bad)}
.pf2-ev{display:block;font-size:12.5px;color:#E1E2E3;font-style:italic;margin:2px 0 4px}.pf2-cg .select{width:100%;min-width:0}
.pf2-step{border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;background:rgba(0,0,0,.08)}.pf2-step.ok{border-color:rgba(156,203,91,.55)}.pf2-step.err{border-color:rgba(228,103,90,.55)}
.pf2-step h4{font-size:16px;font-weight:400;margin:0}.pf2-mini{font-size:12px;color:var(--dim)}.pf2-ok{color:var(--ok)}.pf2-no{color:var(--bad)}
.pf2-in{width:120px}.pf2-grid-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.pf2-grid-in .input{width:100%}
.pf2-sec{border-left:3px solid var(--lime-line);padding:4px 0 4px 12px;margin:10px 0}.pf2-sec h4{font-size:15px;font-weight:500;margin:0 0 4px}.pf2-sec ul{margin:0;padding-left:18px;color:var(--muted)}.pf2-sec li{margin:3px 0}
.pf2-chips{display:flex;gap:6px;flex-wrap:wrap}.pf2-tbl td,.pf2-tbl th{white-space:nowrap}.pf2-tbl td.wrap{white-space:normal;min-width:180px}
.pf2-lock{display:inline-flex;gap:6px;align-items:center}.pf2-blk{display:flex;flex-direction:column;gap:6px}.pf2-blk h4{font-family:var(--display);font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--lime);margin:0;font-weight:500}
@media (max-width:1180px){.pf2-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.pf2-cards{grid-template-columns:minmax(0,1fr)}.pf2-form{grid-template-columns:minmax(0,1fr)}.pf2-kv td:first-child{width:50%}}`;
  if(typeof document !== 'undefined' && !document.getElementById('pf2-css')){ const s = document.createElement('style'); s.id = 'pf2-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ------------------------------------------------------------------ cálculos compartilhados (tudo via PF.calc) */
  /** Pacote de cálculo das candidatas sobre d (o: opções do otimizador, ex. {cap:8}). */
  function pack(d, o = {}){ const c = C(), rows = c.linhasCandidatas(d), O = Object.assign({ rows }, o);
    return { d, rows, O, rk: c.ranking(d, O), M: c.metodos(d, O), util: c.utilizacaoDemanda(d, O), disc: c.discricionaria(d, O), cap: c.capacidadeTotal(d) * 1, orc: c.orcamentoCiclo(d) }; }
  const row = (P, id) => P.rows.find(r => r.id === id) || null;
  /** Linha de corte: até onde foi e por que parou (mesma ordem do PF.calc: obrigatórias, depois ranking com desempate R23). */
  function foraCorte(P){ let f = soma(P.rows.filter(r => r.obrigatoria), r => r.fte), c = soma(P.rows.filter(r => r.obrigatoria), r => r.custo); const cap = P.M.corte.cap, orc = P.M.corte.orc, out = [];
    let parou = null; P.rk.filter(r => !r.obrigatoria).forEach(r => { if(parou){ out.push({ id:r.id, txt:'abaixo da linha de corte' }); return; }
      if(f + r.fte <= cap + EPS && c + r.custo <= orc + EPS){ f += r.fte; c += r.custo; } else { parou = r.id; out.push({ id:r.id, txt:`não cabe (${n1(r.fte)} FTE; sobravam ${n1(cap - f)}): a linha de corte para aqui` }); } });
    return out; }
  /** Guloso N/FTE: quem não cabia quando chegou a vez. */
  function foraGuloso(P){ const rk = P.rk.map(r => r.id), ord = P.rows.filter(r => !r.obrigatoria).slice().sort((a, b) => (b.nFte || 0) - (a.nFte || 0) || rk.indexOf(a.id) - rk.indexOf(b.id));
    let f = soma(P.rows.filter(r => r.obrigatoria), r => r.fte), c = soma(P.rows.filter(r => r.obrigatoria), r => r.custo); const cap = P.M.guloso.cap, orc = P.M.guloso.orc, out = [];
    ord.forEach(r => { if(f + r.fte <= cap + EPS && c + r.custo <= orc + EPS){ f += r.fte; c += r.custo; } else out.push({ id:r.id, txt:`N/FTE ${n2(r.nFte)}: não cabia na vez dela (${n1(r.fte)} FTE; sobravam ${n1(cap - f)})` }); });
    return out; }
  /** Saída de gate sugerida (só aparece DEPOIS do registro; apoio didático, não gabarito oficial). */
  function gateSugerido(d, id, P){
    P = P || pack(d); const c = C(), r = row(P, id); if(!r) return null; const L = c.param(d, 'R22'), deps = c.depsLogicas(d), ot = P.M.otimo;
    const origem = deps.filter(x => x[0] === id).map(x => x[1]), alvo = deps.filter(x => x[1] === id).map(x => x[0]);
    if(r.R >= L.riscoCritico && !r.acao) return { tipo:'RECYCLE', aceitas:['HOLD'], motivo:`R ${r.R} ≥ ${L.riscoCritico} e nenhuma mitigação registrada: fase 1 menor, com mitigação, de volta no próximo gate.` };
    if(r.obrigatoria) return { tipo:'GO', aceitas:['GO_CONDICIONADO'], motivo:'Obrigatória com evidência anexada: entra antes do ranking. O que conta como obrigatória ainda está a validar (R12).' };
    if(ot.ids.includes(id)) return origem.length ? { tipo:'GO_CONDICIONADO', aceitas:['GO'], motivo:`Está na melhor carteira que cabe, mas depende de ${origem.join(', ')} (dependência a confirmar): condicione à confirmação.` }
      : { tipo:'GO', aceitas:['GO_CONDICIONADO'], motivo:'Está na melhor carteira que cabe (ótimo exato) e o risco tem tratamento ou é baixo.' };
    if(alvo.length) return { tipo:'HOLD', aceitas:['RECYCLE'], motivo:`Valor baixo, mas pode habilitar ${alvo.join(', ')}: questionar não é matar. Gatilho: dependência confirmada.` };
    return { tipo:'HOLD', aceitas:['RECYCLE'], motivo:'Não cabe na melhor carteira com a capacidade atual: segure com gatilho (capacidade liberada) em vez de matar.' };
  }
  /** Pauta por exceção do Fórum Mensal (5 seções) + rascunho do N1 + itens gerados no EVM. */
  function pauta(d){
    const c = C(), A = c.emExecucao(d), s = c.sinais(d, A), nome = k => (SN[k] || [k])[0];
    const s1 = s.filter(x => x.cor === 'VERMELHO' || x.divergente).map(x => ({ id:x.id, html:`<b>${esc(x.id)}</b> ${pillS(x.cor)}${x.divergente ? ` <span class="tone-warn">declarado ${esc(nome(x.declarado))}${x.declarado === 'VERDE' && x.cor === 'VERMELHO' ? ' (status melancia)' : ' (divergência)'}</span>` : ''} <span class="pf2-mini">${esc(x.motivo)}</span>` }));
    const s2 = c.riscosAbertos(d).filter(r => r.vencido).map(r => ({ id:r.id, html:`<b>${esc(r.id)}</b> (${esc(r.iniciativaId)}) · ${esc(r.descricao)} · prazo ${esc(fmt.date(r.prazo))}` }));
    const s3 = c.bloqueios(d).filter(b => b.porVermelha).map(b => ({ id:b.dependenciaId, html:`<b>${esc(b.por)}</b> (vermelha) bloqueia <b>${esc(b.bloqueada)}</b> · ${esc(b.dependenciaId)}` }));
    const s4 = A.map(i => c.evm(d, i)).filter(e => e.eacPctPrevisao != null && e.eacPctPrevisao > LIM_EAC + EPS).map(e => ({ id:e.id, html:`<b>${esc(e.id)}</b> · EAC ${n2(e.eac)} × previsão declarada ${n2(e.previsao)} (${sn(e.eacMenosPrevisao)}; ${sn(e.eacPctPrevisao * 100, 0)}%)` }));
    const pend = (d.pendencias || []).filter(p => p.status !== 'RESOLVIDA'), dem = c.idadeDemandas(d);
    const s5 = pend.map(p => ({ id:p.id, html:`Pendência <b>${esc(p.iniciativaId)}</b> · <span title="${esc(p.tipo || '')}">${esc(TIPO_PEND[p.tipo] || String(p.tipo || '').toLowerCase().replace(/_/g, ' '))}</span> · ${esc(p.descricao)}` })).concat(dem.lista.filter(x => dem.acima.includes(x.id)).map(x => ({ id:x.id, html:`Demanda <b>${esc(x.id)}</b> com ${x.dias} dias na fila` })));
    const fr = byId(d.foruns, 'FR-OUT') || {}, extra = (MS().pautaExtra || []).filter(id => byId(d.iniciativas, id));
    const secoes = [
      { n:1, titulo:'Vermelhas e divergências', regra:'R13', itens:s1 }, { n:2, titulo:'Riscos e impedimentos vencidos', regra:'R09', itens:s2 },
      { n:3, titulo:'Bloqueios por iniciativa vermelha', regra:'R09', itens:s3 }, { n:4, titulo:`EAC acima da previsão declarada em mais de ${fmt.n(LIM_EAC * 100)}%`, regra:'R37', itens:s4, limiar:true },
      { n:5, titulo:`Pendências de dados abertas e demandas com mais de ${dem.limiar} dias`, regra:'R16', itens:s5 } ];
    return { secoes, total: soma(secoes, x => x.itens.length), rascunho:{ itens: (fr.pautaItens || []).map(x => typeof x === 'string' ? x : (x && x.id) || '').filter(Boolean), obs: fr.observacoes || '' }, extra };
  }
  const fotos = (d, forumId) => (d.snapshotsForum || []).filter(s => !forumId || s.forumId === forumId).slice().sort((a, b) => String(a.forumId).localeCompare(String(b.forumId)) || (a.versao || 1) - (b.versao || 1));
  const conteudoHash = s => PF.hash({ indicadoresJson:s.indicadoresJson, iniciativasJson:s.iniciativasJson, decisoesPendentesJson:s.decisoesPendentesJson, filtrosJson:s.filtrosJson });
  const gatesN2 = d => C().decisoesVigentes(d).filter(x => GATE.includes(x.tipoDecisao) && (+x.nivel === 2 || x.forumId === 'FR-GATE'));
  const recValida = x => String(x.justificativa || '').trim().length >= 30 && !vazio(x.versaoPesos) && !vazio(x.instancia) && x.instancia !== x.papelRegistrante && x.recomendacao === true;

  /* ------------------------------------------------------------------ pedaços de interface */
  const sel = (name, v, opts, vz, extra = '') => `<select class="select" name="${name}" ${extra}>${vz != null ? `<option value="">${esc(vz)}</option>` : ''}${opts.map(o => { const [k, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(k)}" ${String(k) === String(v ?? '') ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
  const campo = (k, label, ctrl, er, full) => `<label class="field${full ? ' full' : ''}${er && er[k] ? ' pf2-bad' : ''}">${label}${ctrl}<small class="pf2-err">${(er && er[k]) || ''}</small></label>`;
  const area = (k, v, rows = 2, ph = '') => `<textarea class="input" name="${k}" rows="${rows}" placeholder="${esc(ph)}">${esc(v ?? '')}</textarea>`;
  const inp = (k, v, type = 'text', extra = '') => `<input class="input" name="${k}" type="${type}" value="${esc(v ?? '')}" ${extra}>`;
  const kv = linhas => `<table class="pf2-kv"><tbody>${linhas.filter(Boolean).map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table>`;
  const idsChips = (P, ids) => `<div class="pf2-ids">${P.rows.map(r => `<span class="pf2-id ${ids.includes(r.id) ? 'in' : 'out'}" title="${esc(r.id + ' · ' + tit(P.d, r.id))}">${esc(r.id)}</span>`).join('')}</div>`;
  const okTxt = (ok, t) => `<span class="${ok ? 'pf2-ok' : 'pf2-no'}">${ok ? '✓' : '✗'} ${t}</span>`;
  const steps = (base, tabs, cur) => { const i = tabs.findIndex(t => t[0] === cur), a = tabs[i - 1], b = tabs[i + 1];
    return `<div class="row" style="margin-top:18px">${a ? `<a class="pf2-a btn btn-ghost btn-sm" href="${base}?aba=${a[0]}">← ${esc(a[1])}</a>` : ''}<span class="spacer"></span>${b ? `<a class="pf2-a btn btn-primary btn-sm" href="${base}?aba=${b[0]}">Próximo: ${esc(b[1])} →</a>` : ''}</div>`; };
  const legCat = () => CH.legend(['OBRIGATORIA','SUSTENTACAO','EVOLUCAO','INOVACAO'].map(k => ({ label:CAT[k], color: CH.color(CATCOR[k]) })));

  /* ================================================================== A1 · CRITÉRIOS & PESOS */
  function telaCriterios(el, ctx){
    const d = ctx.dados, aba = ctx.route.query.aba === 'parametros' ? 'parametros' : 'criterios';
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 2 · A · Escolher', title:'Critérios & Pesos', sub:'O que conta para priorizar, como dar nota sem “achismo” e quanto cada critério pesa. Critérios, rubricas e pesos estão a validar pela FEG.' }) +
      META(d) + ui.tabs('#/n2/criterios', [['criterios', 'Critérios e rubricas'], ['parametros', 'Parâmetros']], aba) + '<div data-n2></div>';
    const host = el.querySelector('[data-n2]');
    if(aba === 'parametros') abaParametros(host, d); else host.innerHTML = abaCriterios(d);
  }
  function abaCriterios(d){
    const c = C(), crit = c.param(d, 'R19') || [], w = c.pesosEfetivos(d), rub = (d.catalogos || {}).rubricas || {}, vp = versaoPesos(d);
    const t1 = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Crit.</th><th>Nome</th><th>Relação aproximada com o deck (interpretação DFP)</th><th>Onde a nota é gravada</th><th class="r">Peso ${esc(vp)}</th></tr></thead><tbody>
      ${crit.map(k => `<tr><td><b>${esc(k.id)}</b></td><td>${esc(k.nome)}</td><td class="muted">${esc(k.relacaoDeck)}</td><td><code>${esc(k.campo)}</code></td><td class="r num">${pc(w[k.id], 0)}</td></tr>`).join('')}
      <tr><td colspan="4" class="r dim">Soma dos pesos</td><td class="r num">${pc(soma(Object.values(w)), 0)}</td></tr></tbody></table></div>`;
    const t2 = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nota</th>${crit.map(k => `<th>${esc(k.id)}</th>`).join('')}</tr></thead><tbody>${[1, 2, 3, 4, 5].map(n => `<tr><td><b>${n}</b></td>${crit.map(k => `<td class="muted">${esc((rub[k.id] || [])[n - 1] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const indep = [['C5 (viabilidade técnica) × risco de execução P×I', 'As duas penalizam a mesma incerteza técnica: dupla contagem. Use uma ou registre a escolha.', true],
      ['C4 (redução de risco) × riscosResumo', 'C4 mede o benefício de reduzir risco; riscosResumo descreve o risco de execução. Não misture.', false],
      ['C3 (urgência) × requisitoRegulatorioInstitucional', 'O requisito é só evidência de obrigatoriedade, não nota de C3.', false],
      ['C1 (alinhamento) × C2 (criticidade)', 'Perguntas diferentes: “contribui para o objetivo?” × “o que acontece com o sistema?”.', false]];
    return `<div class="stack">${aula('<b>Critério</b> diz o que importa na escolha; a <b>rubrica</b> descreve o que vale cada nota de 1 a 5, para que o mesmo número signifique o mesmo para avaliadoras diferentes; o <b>peso</b> diz quanto cada critério conta. Pesos não são regra oficial: mudar um peso muda a ordem das candidatas, por isso eles têm versão e estão a validar. A conta com as notas fica na tela Pontuação & Matrizes.')}
      <div class="card">${ui.section('Critérios C1–C5', `Pesos da versão vigente (${esc(vp)}) ${B('R20')} · critérios ${B('R19')} · escala ${B('R21')}`)}${t1}</div>
      ${ui.callout('atencao', `<p>O deck lista quatro critérios de priorização técnica e institucional (s138/s140): criticidade sistêmica, custo cognitivo, janela regulatória e operacional, e curto × longo prazo. Cobertos aqui: C2 e C3. Curto × longo prazo é tratado como propriedade da carteira (mix e horizontes). <b>Custo cognitivo não está coberto: pendência a validar.</b> C1, C4 e C5 são escolhas didáticas.</p><div class="row">${PROP('s138/s140')}</div>`, 'Relação com o deck (proposta A&M, a validar)')}
      <div class="card">${ui.section('Rubricas ancoradas', `Cada nota tem uma âncora observável ${B('R19')}`)}${t2}</div>
      <div class="card">${ui.section('Checklist de independência', 'Dois critérios que medem a mesma coisa contam duas vezes.')}<ul class="pf2-sec" style="list-style:none;padding-left:12px">${indep.map(([a, b, al]) => `<li style="margin:6px 0">${al ? '<b class="tone-warn">Alerta:</b> ' : ''}<b>${esc(a)}</b><div class="muted">${esc(b)}</div></li>`).join('')}</ul></div>
      <details class="card"><summary style="cursor:pointer" class="lime">Missões por papel (texto estático; papéis de aprendizagem a validar) ${B('R42')}</summary><ul class="muted" style="margin:10px 0 0;padding-left:18px">
        <li><b>PMO:</b> carteira pelos três métodos, explicando a diferença; conduzir a pauta.</li><li><b>GRC:</b> achar a dupla contagem; garantir versão de pesos e instância em toda decisão; fechar a fotografia.</li>
        <li><b>Contratos e Fornecedores:</b> EVM de E02 e E05; EAC × previsão declarada; R2 com o fornecedor Alfa.</li><li><b>Estratégia e Inovação:</b> diagnóstico de mix (D) e o papel de P04 e P05.</li>
        <li><b>Interface institucional e regulatória:</b> P01 e o limite FEG × CT (R34); C3 nas regulatórias.</li></ul></details></div>`;
  }
  /* ---- Parâmetros: lista de regras; R43 editáveis como NOVA versão (a anterior fica SUBSTITUIDO) */
  const folhas = (v, pre = '') => typeof v === 'number' ? [[pre, v]] : (v && typeof v === 'object' && !Array.isArray(v)) ? Object.entries(v).flatMap(([k, x]) => folhas(x, pre ? pre + '.' + k : k)) : [];
  const setPath = (o, path, val) => { if(!path) return val; const ks = path.split('.'); let t = o; ks.slice(0, -1).forEach(k => t = t[k]); t[ks[ks.length - 1]] = val; return o; };
  const FRAC = { R20:/./, R27:/^$/, R28:/./, R29:/^indice$/, R32:/./, R13:/Indice/, R26:/AbaixoDe|APartirDe|AcimaDe/ }, INTEIRO = { R15:'meses', R16:'dias' };
  const STATUS_REGRA = { A_VALIDAR:'a validar', SUBSTITUIDO:'substituída', VALIDADO:'validada' };
  const stRegra = v => `<span title="${esc(v || 'A_VALIDAR')}">${esc(STATUS_REGRA[v || 'A_VALIDAR'] || String(v).toLowerCase().replace(/_/g, ' '))}</span>`;
  const resumo = v => { if(v === null) return 'null (não converte)'; if(typeof v === 'number') return fmt.n(v, Number.isInteger(v) ? 0 : 2); if(typeof v === 'string') return v;
    if(Array.isArray(v)) return v.every(x => x == null || typeof x !== 'object') ? v.join(', ') : `${v.length} itens`;
    const p = folhas(v).map(([k, x]) => `${ROT_PAR[k] || k}: ${fmt.n(x, Number.isInteger(x) ? 0 : 2)}`); return p.length ? p.join(' · ') : `${Object.keys(v).length} campos`; };
  function abaParametros(host, d){
    const c = C(), editaveis = c.param(d, 'R43') || [], regras = (d.regras || []).slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true }) || (a.versao || 1) - (b.versao || 1));
    const ed = T.param && editaveis.includes(T.param.codigo) ? T.param : null;
    const linhas = regras.map(r => `<tr><td><b>${esc(r.codigo)}</b></td><td title="${esc(r.chave || '')}">${esc(r.nome || r.chave)}</td><td class="muted wrap" style="max-width:340px">${esc(resumo(r.valor))}</td>
        <td>${esc(r.rotuloVersao || 'v' + (r.versao || 1))}<small>${r.vigente === false ? 'não vigente · ' + stRegra(r.statusValidacao) : stRegra(r.statusValidacao)}</small></td><td>${B(r.codigo)}</td>
        <td>${editaveis.includes(r.codigo) && r.vigente !== false ? `<button class="btn btn-ghost btn-sm" data-par-ed="${esc(r.codigo)}">${icon('edit', 13)} Nova versão</button>` : '<span class="pf2-mini">somente leitura</span>'}</td></tr>`).join('');
    host.innerHTML = `<div class="stack">${aula('Parâmetro é um número que a regra usa (limiar, peso, faixa). Mudar um parâmetro não apaga o anterior: cria uma <b>nova versão</b>, com justificativa e histórico, e a anterior fica “substituída”. Só os parâmetros da lista fechada (R43) são editáveis. As perguntas continuam usando a referência original.')}
      ${ed ? formParametro(d, ed) : ''}
      <div class="card">${ui.section('Parâmetros do sistema (registro de regras)', `Editáveis: ${esc(editaveis.join(', '))} ${B('R43')}`)}<div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Código</th><th>Parâmetro</th><th>Valor</th><th>Versão</th><th>Rótulo</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div></div></div>`;
    host.onclick = e => { const b = e.target.closest('[data-par-ed]'); if(b){ T.param = { codigo:b.dataset.parEd, vals:null, erros:null }; PF.refresh(); return; }
      if(e.target.closest('[data-par-cancel]')){ T.param = null; PF.refresh(); return; }
      if(e.target.closest('[data-par-v1]')){ const r1 = C().regra(PF.base, T.param.codigo); T.param.vals = Object.fromEntries(folhas(r1.valor).map(([k, x]) => [k, String(T.param.codigo === 'R20' ? +(x * 100).toFixed(4) : x)])); T.param.erros = null; PF.refresh(); } };
    host.onsubmit = e => { e.preventDefault(); salvarParametro(e.target, d); };
  }
  function formParametro(d, ed){
    const r = C().regra(d, ed.codigo), pct = ed.codigo === 'R20', fs = folhas(r.valor), er = ed.erros || {}, crit = C().param(d, 'R19') || [];
    const rot = k => !k ? (r.nome || r.chave) : pct ? `${k} · ${((crit.find(c => c.id === k) || {}).nome) || ''}` : (ROT_PAR[k] || k);
    const vals = ed.vals || Object.fromEntries(fs.map(([k, x]) => [k, String(pct ? +(x * 100).toFixed(4) : x)]));
    return `<div class="card hl">${ui.section(`Nova versão de ${r.codigo} · ${r.nome}`, `Versão atual: ${esc(r.rotuloVersao || 'v' + (r.versao || 1))} ${B(r.codigo)}`)}
      <p class="muted" style="margin:0 0 10px">${pct ? 'Pesos em %: precisam somar 100%.' : INTEIRO[r.codigo] ? `Número inteiro de ${INTEIRO[r.codigo]}.` : FRAC[r.codigo] && fs.some(([k]) => FRAC[r.codigo].test(k) && !/AcimaDe/.test(k)) ? 'Frações: 0,15 = 15%. Textos e listas desta regra ficam como estão.' : 'Textos e listas desta regra ficam como estão.'}</p>
      ${er._geral ? ui.callout('atencao', `<p>${er._geral}</p>`) : ''}
      ${pct ? ui.callout('dica', `<p>Os pesos vigentes também valem no Planejamento do Ciclo (N3), que usa a v1 no Ciclo Exemplo 2027 e avisa quando a versão vigente é outra. Depois de fechada a fotografia do ciclo, uma versão nova nasce não vigente, para o próximo ciclo. ${B('R35')}</p>`) : ''}
      <form class="pf2-form" data-par-form="${esc(r.codigo)}" novalidate>${fs.map(([k]) => campo('v:' + k, `<span title="${esc(k || r.chave)}">${esc(rot(k))}${pct ? ' (%)' : ''}</span>`, inp('v:' + k, vals[k], 'text', 'inputmode="decimal"'), er)).join('')}
        ${campo('justificativa', 'Justificativa * (mínimo 20 caracteres)', area('justificativa', ed.just || '', 2), er, true)}
        <div class="full row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-par-v1>Preencher com a v1</button><button type="button" class="btn btn-ghost btn-sm" data-par-cancel>Cancelar</button><button type="submit" class="btn btn-primary btn-sm">Gravar nova versão</button></div></form></div>`;
  }
  function salvarParametro(form, d){
    const ed = T.param, r = C().regra(d, ed.codigo), pct = ed.codigo === 'R20', fs = folhas(r.valor), fd = new FormData(form), er = {}; let novo = C().clone(r.valor);
    ed.vals = Object.fromEntries(fs.map(([k]) => [k, String(fd.get('v:' + k) ?? '').trim()])); ed.just = String(fd.get('justificativa') ?? '').trim();
    fs.forEach(([k]) => { const x = Number(String(ed.vals[k]).replace(',', '.')); if(ed.vals[k] === '' || !Number.isFinite(x) || x < 0) { er['v:' + k] = PF.msgHtml('VALIDATION_ERROR', { texto:'Informe um número maior ou igual a zero.' }); return; }
      const v = pct ? x / 100 : x; if(!pct && FRAC[ed.codigo] && FRAC[ed.codigo].test(k) && v > 1 + EPS && !/AcimaDe/.test(k)) er['v:' + k] = PF.msgHtml('VALIDATION_ERROR', { texto:'Use fração entre 0 e 1 (0,15 = 15%).' });
      if(INTEIRO[ed.codigo] && !Number.isInteger(v)) er['v:' + k] = PF.msgHtml('VALIDATION_ERROR', { texto:`Use um número inteiro de ${INTEIRO[ed.codigo]}.` });
      novo = setPath(novo, k, v); });   /* setPath devolve o valor novo quando a regra é um número simples (R15, R16, R27) */
    if(!Object.keys(er).length){
      if(pct){ const s = soma(Object.values(novo)); if(Math.abs(s - 1) > 0.0005) er._geral = PF.msgHtml('VALIDATION_ERROR', { texto:`Os pesos precisam somar 100% (hoje: ${fmt.n(s * 100, 1)}%).` }); }
      if(ed.codigo === 'R28'){ const s = soma(Object.values(novo.alvo || {})); if(Math.abs(s - 1) > 0.0005) er._geral = PF.msgHtml('VALIDATION_ERROR', { texto:`O mix-alvo precisa somar 100% (hoje: ${fmt.n(s * 100, 1)}%).` }); }
      if(ed.codigo === 'R26' && !(novo.roadmapAPartirDe < novo.reduzirAPartirDe && novo.reduzirAPartirDe <= novo.tanqueAcimaDe)) er._geral = PF.msgHtml('VALIDATION_ERROR', { texto:'As faixas precisam crescer: roadmap < reduzir ≤ tanque.' });
      if(ed.codigo === 'R13' && !(novo.amareloDesvioMeses < novo.vermelhoDesvioMeses && novo.vermelhoIndiceAbaixoDe < novo.amareloIndiceAbaixoDe)) er._geral = PF.msgHtml('VALIDATION_ERROR', { texto:'O limiar amarelo precisa ficar entre o verde e o vermelho.' });
      if(ed.codigo === 'R22' && !(novo.valorAltoN <= 100 && novo.riscoAlto <= novo.riscoCritico && novo.riscoCritico <= 25)) er._geral = PF.msgHtml('VALIDATION_ERROR', { texto:'Valor alto vai de 0 a 100; o risco alto precisa ser menor ou igual ao crítico, e o crítico no máximo 25 (5 × 5).' });
      if(!er._geral && PF.hash(novo) === PF.hash(r.valor)) er._geral = 'Nada mudou: altere algum valor antes de gravar.';
    }
    if(ed.just.length < 20) er.justificativa = PF.msgHtml('JUSTIFICATIVA', { min:20 });
    if(Object.keys(er).length){ ed.erros = er; PF.refresh(); return; }
    /* rótulo = maior versão já registrada do código + 1 (não repete a "v2" de uma candidata do N3) */
    const v = Math.max(1, ...(d.regras || []).filter(x => x.codigo === r.codigo).map(x => +x.versao || 1)) + 1, rotulo = 'v' + v;
    /* R35: com a fotografia FR-CICLO FECHADA, pesos novos nascem não vigentes (valem para o próximo ciclo) e a versão do ciclo continua valendo */
    const congelada = r.codigo === 'R20' && (d.snapshotsForum || []).some(z => z.forumId === 'FR-CICLO' && z.status === 'FECHADO');
    if(!congelada){ const w = PF.write('regras', r.id, { vigente:false, statusValidacao:'SUBSTITUIDO' }, { justificativa:`Substituída por ${rotulo}: ${ed.just}` });
      if(!w.ok){ ed.erros = { _geral: esc((w.errors[0] || {}).msg || 'Não foi possível gravar.') }; PF.refresh(); return; } }
    const base = C().clone(r); delete base.registradoEm; delete base.usuarioId;
    const n = PF.append('regras', Object.assign(base, { id:`${r.codigo}-v${v}`, versao:v, rotuloVersao:rotulo, valor:novo, vigente:!congelada, statusValidacao:'A_VALIDAR', atualizadoPor:(PF.perfil().nome || 'Aprendiz (perfil local)'), atualizadoEm:hoje(), justificativa:ed.just, versaoAnteriorId:r.id },
      congelada ? { vigencia:'próximo ciclo (R35): a fotografia FR-CICLO fechada congelou os pesos do Ciclo Exemplo 2027' } : {}));
    PF.append('historico', { entidade:'regras', entidadeId:n.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:n.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:`Nova versão ${rotulo} de ${r.codigo}: ${ed.just}` });
    T.param = null; PF.toast(congelada ? `[SIMULAÇÃO] <b>${esc(r.codigo)} ${rotulo}</b> gravada como não vigente: a fotografia do ciclo já foi fechada (R35), então ela vale para o próximo ciclo.`
      : `[SIMULAÇÃO] <b>${esc(r.codigo)} ${rotulo}</b> gravada; a versão anterior ficou substituída. As perguntas continuam na referência.`); PF.refresh();
  }

  /* ================================================================== A2 · PONTUAÇÃO & MATRIZES */
  function telaPontuacao(el, ctx){
    const d = ctx.dados, abas = [['grade', 'Grade'], ['cegas', 'Avaliação às cegas'], ['ve', 'Valor × Esforço'], ['vr', 'Valor × Risco']], aba = abas.some(a => a[0] === ctx.route.query.aba) ? ctx.route.query.aba : 'grade', P = pack(d);
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 2 · A · Escolher', title:'Pontuação & Matrizes', sub:'Notas C1–C5 das candidatas P01–P08 do Ciclo Exemplo 2027, o score S, o valor N e duas matrizes que respondem a perguntas diferentes.' }) +
      META(d) + ui.tabs('#/n2/pontuacao', abas, aba) + '<div data-n2></div>';
    const host = el.querySelector('[data-n2]');
    if(aba === 'cegas'){ host.innerHTML = abaCegas(d); bindCegas(host, true); }
    else if(aba === 've') host.innerHTML = matriz(d, P, 'VE'); else if(aba === 'vr') host.innerHTML = matriz(d, P, 'VR'); else host.innerHTML = abaGrade(d, P);
  }
  function abaGrade(d, P){
    const c = C(), w = c.pesosEfetivos(d), rub = (d.catalogos || {}).rubricas || {}, crit = Object.keys(w), lim = (c.param(d, 'R23') || {}).empateTecnicoDeltaN || 1;
    const infl = P.rows.filter(r => r.notas && soma(crit, k => r.notas[k]) / crit.length > 4 + EPS), emp = P.rk.filter(r => r.empateTecnicoCom.length);
    const pares = []; emp.forEach(r => r.empateTecnicoCom.forEach(o => { const k = [r.id, o].sort().join('×'); if(!pares.includes(k)) pares.push(k); }));
    const linhas = P.rk.map(r => { const ac = r.empateTecnicoCom.length ? `empate técnico com ${r.empateTecnicoCom.join(', ')} · desempate: R ${r.R}${r.empateTecnicoCom.map(o => { const x = row(P, o); return x ? ` × ${x.R}` : ''; }).join('')}` : '—';
      return `<tr><td class="num"><b>${r.posicao}º</b></td><td title="${esc(r.titulo)}"><b>${esc(r.id)}</b><small>${esc(CAT[r.categoria] || r.categoria)}${r.obrigatoria && r.categoria !== 'OBRIGATORIA' ? ' · obrigatória' : ''}</small></td>
        ${crit.map(k => { const n = (r.notas || {})[k]; return `<td class="c num" title="${esc(k + ' = ' + n + ': ' + ((rub[k] || [])[n - 1] || ''))}">${n ?? '—'}</td>`; }).join('')}
        <td class="r num">${n2(r.S)}</td><td class="r num"><b>${n2(r.N)}</b></td><td class="r num">${n2(r.nFte)}</td><td class="r num">${n1(r.nCusto)}</td><td class="r num">${r.R}</td><td class="wrap pf2-mini">${esc(ac)}</td></tr>`; }).join('');
    const p05 = (d.avaliacoes || []).filter(a => a.iniciativaId && (d.avaliacoes || []).filter(b => b.iniciativaId === a.iniciativaId).length > 1);
    const grupos = Array.from(new Set(p05.map(a => a.iniciativaId))).sort();
    const linhaTempo = grupos.map(id => { const avs = p05.filter(a => a.iniciativaId === id).slice().sort((a, b) => String(a.registradoEm).localeCompare(String(b.registradoEm))), vig = c.avaliacaoVigente(d, id);
      return `<div class="pf2-sec"><h4>${esc(id)} · ${esc(tit(d, id))}</h4><ul>${avs.map(a => { const S = c.score(a.notasCriterios, w); return `<li>${esc(fmt.date(String(a.registradoEm).slice(0, 10)))} · notas ${crit.map(k => a.notasCriterios[k]).join(', ')} → S ${n2(S)} · N <b>${n2(c.normalizar(d, S))}</b> · pesos ${esc(a.versaoPesos || '—')} · ${esc(a.registradoPor || a.usuarioId || '')}${a === vig ? ' ' + ui.pill('vigente', 'ok') : ' <span class="pf2-mini">(preservada)</span>'}</li>`; }).join('')}</ul></div>`; }).join('');
    return `<div class="stack">${aula('Cada candidata recebe notas de 1 a 5 em C1–C5. O <b>score</b> S soma nota × peso; o <b>valor</b> N = (S − 1) ÷ 4 × 100 põe S de 0 a 100. A escala é <b>ordinal</b>: diz a ordem, não “quantas vezes melhor”. Quando duas candidatas ficam quase iguais, vale a regra de desempate escrita (coluna Desempate).')}
      <div class="card">${ui.section('Grade de pontuação (ranking com desempate)', `S = Σ wⱼ·Cⱼ ${B('R20')} · N ${B('R21')} · R = P × I ${B('R22')} · desempate ${B('R23')} · notas ${ILU()}`)}
        <div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Pos.</th><th>Cand.</th>${crit.map(k => `<th class="c" title="peso ${pc(w[k], 0)}">${k}<br><small>${pc(w[k], 0)}</small></th>`).join('')}<th class="r">S</th><th class="r">N</th><th class="r">N/FTE</th><th class="r">N/R$ mi</th><th class="r">R</th><th>Desempate</th></tr></thead><tbody>${linhas}</tbody></table></div>
        <p class="pf2-mini" style="margin:8px 0 0">Passe o mouse sobre uma nota para ver a âncora da rubrica. Pesos da versão ${esc(versaoPesos(d))}.</p></div>
      <div class="grid g2"><div class="card">${ui.section('Alertas de qualidade da pontuação')}
        ${infl.length ? ui.callout('atencao', `<p><b>Notas infladas</b> (média > 4): ${infl.map(r => `${esc(r.id)} (${n1(soma(crit, k => r.notas[k]) / crit.length)})`).join(', ')}. Confira as âncoras: nota alta precisa de evidência alta.</p>`) : '<p class="muted">Nenhuma candidata com média de notas acima de 4.</p>'}
        <div style="margin-top:10px">${pares.length ? ui.callout('atencao', `<p><b>Empate técnico</b> (|ΔN| < ${n1(lim)}): ${pares.map(esc).join(', ')}. A regra de desempate muda a carteira, não o valor.</p><div class="row">${B('R23')}</div>`) : '<p class="muted">Sem empate técnico.</p>'}</div></div>
        <div class="card">${ui.section('Linha do tempo das avaliações', `Avaliação não se apaga: a nova vale e a antiga fica guardada ${B('R06')}`)}${linhaTempo || '<p class="muted">Nenhuma candidata com mais de uma avaliação.</p>'}</div></div></div>`;
  }
  /* ---- Avaliação às cegas: grava só em PF.modState(2).cegas; botão separado registra no trabalho */
  const CEGAS = ['P03','P05','P06'];
  function cegasForm(d, semRef){   /* semRef: no desafio a comparação com a referência nunca aparece ao lado das notas */
    const s = MS(), cg = s.cegas || {}, rub = (PF.base.catalogos || {}).rubricas || {}, crit = C().param(PF.base, 'R19') || [], ev = id => ((byId(PF.base.evidenciasAvaliacao, 'EV-' + id) || {}).evidencias) || {};
    const ref = id => C().notasVigentes(PF.base, id) || {}, cmp = !semRef && !!s.cegasCmp, w = C().pesosEfetivos(PF.base);
    return `<div class="grid g3 pf2-cg">${CEGAS.map(id => { const notas = cg[id] || {}, rf = ref(id), completo = crit.every(k => notas[k.id] != null);
      const Sa = completo ? C().score(notas, w) : null, Sr = C().score(rf, w);
      return `<div class="card stack" style="gap:10px"><div><b>${esc(id)}</b> <span class="pf2-mini">${esc(tit(d, id))}</span></div>
        ${crit.map(k => { const v = notas[k.id];
          return `<label class="field"><span><b>${esc(k.id)}</b> · ${esc(k.nome)}</span><span class="pf2-ev">“${esc(ev(id)[k.id] || '—')}”</span>
            <select class="select" data-cg="${esc(id)}|${esc(k.id)}" aria-label="${esc(id + ' ' + k.id)}"><option value="">nota…</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${+v === n ? 'selected' : ''}>${n} · ${esc((rub[k.id] || [])[n - 1] || '')}</option>`).join('')}</select>
            ${cmp && v != null ? `<span class="pf2-mini">${okTxt(Math.abs(v - rf[k.id]) <= 1, `referência ${rf[k.id]} (±1)`)}</span>` : ''}</label>`; }).join('')}
        <div class="pf2-mini">S (sua nota): <b class="num">${Sa == null ? '—' : n2(Sa)}</b>${cmp ? ` · referência ${n2(Sr)} ${Sa == null ? '' : okTxt(Math.abs(Sa - Sr) <= 0.3 + EPS, '±0,30')}` : ''}</div></div>`; }).join('')}</div>`;
  }
  function abaCegas(d){
    const s = MS(), conf = s.cegasCmp ? C().conferirCegas(PF.base, s.cegas || {}) : null;
    return `<div class="stack">${aula('Avaliar “às cegas” é dar a nota só pela evidência e pela âncora da rubrica, sem olhar a nota do comitê. Depois compare: diferença de até 1 ponto é aceitável. Se você e o comitê divergem muito, a âncora ou a evidência estão fracas.')}
      ${ui.callout('dica', `<p>Escolha a nota de cada critério para P03, P05 e P06. A comparação usa a avaliação vigente da referência. Este exercício fica só no seu progresso: não muda as avaliações do comitê nem os dados de trabalho. ${ILU()} ${B('R19')}</p>`)}
      <div data-cg-host>${cegasForm(d)}</div>
      <div class="row"><button class="btn btn-primary btn-sm" data-cg-cmp>Comparar com a referência</button><button class="btn btn-ghost btn-sm" data-cg-limpar>${icon('reset', 13)} Limpar</button></div>
      <div data-cg-res>${conf ? ui.callout(conf.ok ? 'dica' : 'atencao', `<p><b>${conf.notasOk} de ${conf.totalNotas}</b> notas a ±1 da referência; S a ±0,30: ${CEGAS.map(id => `${id} ${conf.sOk[id] ? '✓' : '✗'}`).join(' · ')}. ${conf.ok ? 'Boa calibragem.' : 'Revise as âncoras onde ficou fora.'}</p>`) : ''}</div></div>`;
  }
  /** Avaliação às cegas: grava só em PF.modState(2).cegas (spec §6.2.2, PED-04): nunca em avaliacoes. */
  function bindCegas(host, comBotoes){
    host.addEventListener('change', e => { const s0 = e.target.closest('[data-cg]'); if(!s0) return; const [id, k] = s0.dataset.cg.split('|'), s = MS();
      s.cegas = s.cegas || {}; (s.cegas[id] = s.cegas[id] || {})[k] = s0.value ? +s0.value : null; if(!s0.value) delete s.cegas[id][k]; s.cegasCmp = false; PF.save();
      const h = host.querySelector('[data-cg-host]'); if(h){ PF.patch(host, '[data-cg-host]', cegasForm(PF.db(), !comBotoes)); const n = host.querySelector(`[data-cg="${id}|${k}"]`); if(n) n.focus(); } PF.patch(host, '[data-cg-res]', ''); });
    if(!comBotoes) return;
    host.addEventListener('click', e => { const s = MS();
      if(e.target.closest('[data-cg-cmp]')){ s.cegasCmp = true; PF.save(); PF.refresh(); return; }
      if(e.target.closest('[data-cg-limpar]')){ s.cegas = {}; s.cegasCmp = false; PF.save(); PF.refresh(); } });
  }
  /* ---- Matrizes (bolha + tabela de classificação ao lado) */
  function matriz(d, P, tipo){
    const c = C(), L = c.param(d, 'R22'), ve = tipo === 'VE', k = ve ? 'qVE' : 'qVR';
    const pts = P.rows.map(r => ({ id:r.id, label:r.id, x: ve ? r.fte : r.R, y:r.N, r:r.custo, color:CATCOR[r.categoria], title:`${r.id} · N ${n2(r.N)} · ${ve ? 'FTE ' + n1(r.fte) : 'R ' + r.R} · R$ ${n2(r.custo)} mi · ${QV(d, tipo, r[k])}` }));
    const ql = ve ? [QV(d, 'VE', 'FAZER_PRIMEIRO'), QV(d, 'VE', 'PLANEJAR'), QV(d, 'VE', 'COMPLEMENTAR'), QV(d, 'VE', 'QUESTIONAR')] : [QV(d, 'VR', 'PEROLA') + 's', QV(d, 'VR', 'OSTRA') + 's', QV(d, 'VR', 'PAO_COM_MANTEIGA'), QV(d, 'VR', 'ELEFANTE_BRANCO')];
    const graf = CH.bubble(pts, { xLabel: ve ? 'Esforço (FTE)' : 'Risco de execução R = P × I', yLabel:'Valor N', qx: ve ? L.esforcoAltoFteAcimaDe : L.riscoAlto, qy:L.valorAltoN, xMin:0, xMax: ve ? Math.max(6, Math.ceil(Math.max(0, ...P.rows.map(r => r.fte || 0)) / 2) * 2 + 2) : (Math.max(0, ...P.rows.map(r => r.R || 0)) > 19 ? 28 : 20), yMin:0, yMax:100, quadLabels:ql, height:380 });
    const ordem = ve ? ['FAZER_PRIMEIRO', 'PLANEJAR', 'COMPLEMENTAR', 'QUESTIONAR'] : ['PEROLA', 'OSTRA', 'PAO_COM_MANTEIGA', 'ELEFANTE_BRANCO'];
    const tab = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cand.</th><th class="r">N</th><th class="r">${ve ? 'FTE' : 'R'}</th><th>${ve ? 'Quadrante' : 'Grupo'}</th></tr></thead><tbody>${P.rows.slice().sort((a, b) => ordem.indexOf(a[k]) - ordem.indexOf(b[k]) || b.N - a.N).map(r => `<tr><td><b>${esc(r.id)}</b></td><td class="r num">${n2(r.N)}</td><td class="r num">${ve ? n1(r.fte) : r.R}</td><td>${esc(QV(d, tipo, r[k]))}${r.id === 'P02' ? '<small>questionar não é matar</small>' : ''}</td></tr>`).join('')}</tbody></table></div>`;
    const regraTxt = ve ? `Fronteira: N ≥ ${fmt.n(L.valorAltoN)} = valor alto; FTE > ${fmt.n(L.esforcoAltoFteAcimaDe)} = esforço alto.` : `Fronteira: N ≥ ${fmt.n(L.valorAltoN)} = valor alto; R ≥ ${fmt.n(L.riscoAlto)} = risco alto. Tamanho da bolha = custo; cor = categoria.`;
    const nota = ve ? ui.callout('atencao', `<p>O deck (s168) cruza esforço técnico × impacto sistêmico e usa quick wins, evoluções incrementais, projetos estruturantes e possíveis dispersões. Aqui N é aproximação (decisão de produto), e a posição dos quadrantes foi inferida do layout. P02 está em “questionar”, o que não a torna dispersão: ela pode habilitar outra candidata.</p><div class="row">${B('R39')}${refM('matriz valor × esforço')}</div>`)
      : ui.callout('dica', `<p>Bolha de Cooper ${refM('Cooper, valor × risco')}: pérolas (valor alto, risco baixo), ostras (valor alto, risco alto: precisam de mitigação), pão com manteiga (valor e risco baixos) e elefante branco (valor baixo, risco alto: questionar, não matar).</p>`);
    const au = ve ? aula('Matriz valor × esforço: quanto a candidata entrega (N) contra quanto ela consome (FTE). “Fazer primeiro” é valor alto com pouco esforço; “questionar” é valor baixo com muito esforço. Os quadrantes ajudam a conversar, não decidem: a seleção ainda depende da capacidade.')
      : aula('Risco de execução (chance de dar errado) não é redução de risco (benefício, C4). A escala é ordinal: diz a ordem, não “quantas vezes melhor”. As duas matrizes respondem a perguntas diferentes: P08 é fácil de fazer, mas arriscada.');
    return `<div class="stack">${au}<div class="grid g2"><div class="card">${ui.section(ve ? 'Valor × Esforço' : 'Valor × Risco (bolha)', `${regraTxt} ${B('R22')}`)}${graf}${legCat()}</div>
      <div class="card">${ui.section('Tabela de classificação (equivalente ao gráfico)', esc(regraTxt))}${tab}</div></div>${nota}</div>`;
  }

  /* ================================================================== A3 · CAPACIDADE & SELEÇÃO (assistente em 3 passos) */
  const PASSOS = [['1', '1 · Demanda × oferta'], ['2', '2 · Métodos lado a lado'], ['3', '3 · Conferir e salvar']];
  function telaSelecao(el, ctx){
    const d = ctx.dados, aba = PASSOS.some(a => a[0] === ctx.route.query.aba) ? ctx.route.query.aba : '1', P = pack(d);
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 2 · A · Escolher', title:'Capacidade & Seleção', sub:'Assistente em 3 passos: quanto cabe, como escolher a carteira e como conferir antes de levar ao fórum. A proposta é recomendação da analista; quem decide é a instância.' }) +
      META(d) + ui.tabs('#/n2/selecao', PASSOS, aba) + '<div data-n2></div>' + steps('#/n2/selecao', PASSOS, aba);
    const host = el.querySelector('[data-n2]');
    if(aba === '2'){ host.innerHTML = passoMetodos(d, P); bindMetodos(host); } else if(aba === '3'){ host.innerHTML = passoConferir(d, P); bindConferir(host, d); } else host.innerHTML = passoDemanda(d, P);
  }
  function passoDemanda(d, P){
    const c = C(), u = P.util, ds = P.disc, ob = P.rows.filter(r => r.obrigatoria), inc = c.unidadesIncompativeis(d), sf = c.semFonte(d), F = c.param(d, 'R26');
    const fx = u.faixa || {}, faixas = [['TANQUE', `u > ${pc(F.tanqueAcimaDe, 0)}`], ['REDUZIR', `${pc(F.reduzirAPartirDe, 0)} ≤ u ≤ ${pc(F.tanqueAcimaDe, 0)}`], ['ROADMAP', `${pc(F.roadmapAPartirDe, 0)} ≤ u < ${pc(F.reduzirAPartirDe, 0)}`], ['AUTONOMIA', `u < ${pc(F.roadmapAPartirDe, 0)}`]];
    return `<div class="stack">${aula('<b>Demanda × oferta</b>: some o que as candidatas pedem e compare com o que existe. Acima de 100%, não cabe tudo: é hora de escolher. As <b>obrigatórias</b> entram primeiro e o que sobra é a <b>capacidade discricionária</b>, disputada pelas demais. FTE e horas não se somam: o app não converte uma na outra.')}
      <div class="grid g2"><div class="card">${ui.section('Utilização da demanda', `Σ candidatas ÷ capacidade do ciclo ${B('R24')}`)}
        <div class="row" style="justify-content:space-around">${CH.gauge(u.pctFte, { max:2, display:pc(u.pctFte), label:'FTE pedidos ÷ disponíveis', tone: u.pctFte > 1 ? 'bad' : 'lime' })}${CH.gauge(u.pctCusto, { max:2, display:pc(u.pctCusto), label:'R$ pedidos ÷ orçamento', tone: u.pctCusto > 1 ? 'bad' : 'lime' })}</div>
        <p class="pf2-mini" style="text-align:center;margin:4px 0 0">Escala dos medidores: 0 a 200%.</p></div>
        <div class="card">${ui.section('Tabela equivalente', `Capacidade e orçamento do Ciclo Exemplo 2027 ${B('R24')}`)}${kv([['Demanda (8 candidatas)', `<span class="num">${n1(u.fte)} FTE · ${mi(u.custo)}</span>`], ['Oferta', `<span class="num">${n1(u.cap)} FTE · ${mi(u.orc, 1)}</span>`], ['Utilização (FTE)', `<b class="num">${pc(u.pctFte)}</b>`], ['Utilização (R$)', `<b class="num">${pc(u.pctCusto)}</b>`]])}</div></div>
      <div class="card">${ui.section('Faixa da matriz decisória (proposta A&M, agregada)', `${B('R26')}`)}
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Faixa</th><th>Utilização</th><th>Ação proposta</th></tr></thead><tbody>${faixas.map(([k, t]) => `<tr class="${fx.id === k ? 'sel' : ''}"><td>${fx.id === k ? '<b class="lime">▶ hoje</b>' : ''}</td><td>${esc(t)}</td><td>${esc((F.acoes || {})[k] || k)}</td></tr>`).join('')}</tbody></table></div>
        <p class="pf2-mini" style="margin:8px 0 0">Hoje a demanda está em ${pc(u.pctFte)}: “${esc(fx.acao || '')}”. A utilização por gerência e a reserva de 15% ficam no Nível 3.</p></div>
      <div class="grid g2"><div class="card">${ui.section('Obrigatórias primeiro', `O que conta como obrigatória ainda está a validar ${B('R12')}`)}
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th class="r">FTE</th><th class="r">R$ mi</th></tr></thead><tbody><tr><td>Capacidade do ciclo</td><td class="r num">${n1(P.cap)}</td><td class="r num">${n2(P.orc)}</td></tr>
          ${ob.map(r => `<tr><td>− ${esc(r.id)} (obrigatória${(byId(d.iniciativas, r.id) || {}).evidenciaObrigatoriedade && byId(d.iniciativas, r.id).evidenciaObrigatoriedade.anexada ? '; evidência anexada' : ''})</td><td class="r num">${n1(r.fte)}</td><td class="r num">${n2(r.custo)}</td></tr>`).join('')}
          <tr class="sel"><td><b>= Capacidade discricionária</b></td><td class="r num"><b>${n1(ds.fte)}</b></td><td class="r num"><b>${n2(ds.custo)}</b></td></tr></tbody></table></div></div>
        <div class="card">${ui.section('Alertas de qualidade dos dados')}
          ${inc.map(x => ui.callout('atencao', `<p><b>${esc(x.iniciativaId || x.referenciaId)}</b>: ${fmt.n(x.valor)} ${esc(String(x.unidade).toLowerCase())} · ${PF.msgHtml('INCOMPATIBLE_UNIT')}</p><div class="row">${B('R25')}</div>`)).join('')}
          ${sf.map(x => `<div style="margin-top:8px">${ui.callout('atencao', `<p><b>${esc(x.iniciativaId)}</b> (${esc(x.id)}): ${PF.msgHtml('SOURCE_REQUIRED')}</p><div class="row">${B('R37')}</div>`)}</div>`).join('')}
          ${!inc.length && !sf.length ? '<p class="muted">Nenhum alerta.</p>' : ''}</div></div></div>`;
  }
  function cardMetodo(P, nome, sub, m, fora){
    return `<div class="card pf2-m"><div class="row"><b>${esc(nome)}</b>${sub || ''}</div>${idsChips(P, m.ids)}
      ${kv([['FTE', `<span class="num">${n1(m.fte)} / ${n1(m.cap)}</span>`], ['R$ mi', `<span class="num">${n2(m.custo)} / ${n2(m.orc)}</span>`], ['Valor ΣN', `<b class="num">${n2(m.valor)}</b>`], ['Ociosidade', `<span class="num">${n1(m.ociosidade)} FTE</span>`], ['Eficiência (÷ ótimo)', `<span class="num">${m.eficiencia == null ? 'n/d' : pc(m.eficiencia)}</span>`]])}
      ${fora ? `<div class="pf2-blk"><h4>Por que ficou de fora</h4>${fora}</div>` : ''}</div>`;
  }
  const listaFora = l => l.length ? `<ul class="pf2-mini" style="margin:0;padding-left:16px">${l.map(x => `<li><b>${esc(x.id)}</b>: ${esc(x.txt)}</li>`).join('')}</ul>` : '<span class="pf2-mini">Nada ficou de fora.</span>';
  function passoMetodos(d, P){
    const c = C(), M = P.M, s = MS(), man = Array.from(new Set((s.manual || []).filter(id => row(P, id)).concat(P.rows.filter(r => r.obrigatoria).map(r => r.id))));
    const mr = Object.assign(c.resumoCarteira(d, man, P.O), { eficiencia: c.div(c.resumoCarteira(d, man, P.O).valor, M.otimo.valor) }), av = c.avaliarSelecao(d, man, P.O);
    const pq = T.porque ? c.porQueFora(d, P.O) : null;
    const foraOt = pq ? listaFora(pq.map(x => ({ id:x.id, txt: x.viavel ? `se entrar à força, a melhor carteira cai para ${n2(M.otimo.valor + x.deltaV)} (${sn(x.deltaV)} pontos); sai(em): ${x.saem.join(', ') || '—'}` : `barrada por ${x.motivo}` }))) : `<p class="pf2-mini" style="margin:0">Coloca cada excluída à força e recalcula a melhor carteira.</p><div><button class="btn btn-ghost btn-sm" data-porque>${icon('question', 13)} Calcular</button></div>`;
    const manual = `<div class="card pf2-m"><div class="row"><b>Seleção manual</b>${ILU()}</div><div class="pf2-chips">${P.rows.map(r => `<label class="chip ${man.includes(r.id) ? 'on' : ''}" style="cursor:${r.obrigatoria ? 'default' : 'pointer'}"><input type="checkbox" data-man="${esc(r.id)}" ${man.includes(r.id) ? 'checked' : ''} ${r.obrigatoria ? 'disabled' : ''} aria-label="${esc(r.id)}">${esc(r.id)}${r.obrigatoria ? ' (fixa)' : ''}</label>`).join('')}</div>
      ${kv([['FTE', `<span class="num ${mr.estouro.fte ? 'tone-bad' : ''}">${n1(mr.fte)} / ${n1(mr.cap)}</span>`], ['R$ mi', `<span class="num ${mr.estouro.custo ? 'tone-bad' : ''}">${n2(mr.custo)} / ${n2(mr.orc)}</span>`], ['Valor ΣN', `<b class="num">${n2(mr.valor)}</b>`], ['Ociosidade', `<span class="num">${n1(mr.ociosidade)} FTE</span>`], ['Eficiência (÷ ótimo)', `<span class="num">${pc(mr.eficiencia)}</span>`]])}
      <p class="pf2-mini" style="margin:0">${mr.viavel ? esc(av.feedback) : `<span class="tone-bad">${esc(av.feedback)}</span>`}</p></div>`;
    const tab = [['Linha de corte', M.corte], ['Linha de corte sem desempate', M.corteSemDesempate], ['Guloso N/FTE', M.guloso], ['Ótimo exato', M.otimo], ['Seleção manual', mr]];
    return `<div class="stack">${aula('Três jeitos de escolher sob limite de recursos (a “mochila”): a <b>linha de corte</b> segue o ranking e para no primeiro que não cabe; o <b>guloso</b> pega primeiro quem rende mais valor por FTE; o <b>ótimo exato</b> testa todas as combinações e fica com a de maior valor que cabe. Compare valor, ociosidade e eficiência (valor ÷ valor do ótimo).')}
      ${ui.callout('dica', `<p>Capacidade ${n1(P.cap)} FTE e orçamento ${mi(P.orc, 1)} ${B('R24')}; obrigatórias primeiro ${B('R12')}; valor N ${B('R21')}; desempate ${B('R23')}; ótimo exato por enumeração de ${fmt.n(M.otimo.avaliadas)} combinações (${fmt.n(M.otimo.viaveis)} cabem) ${refM('problema da mochila')}</p>`)}
      <div class="pf2-cards">${cardMetodo(P, 'Linha de corte', B('R23'), M.corte, listaFora(foraCorte(P)))}${cardMetodo(P, 'Guloso N/FTE', '', M.guloso, listaFora(foraGuloso(P)))}
        ${cardMetodo(P, 'Ótimo exato', `<span class="pf2-mini">${M.otimo.segunda ? `2ª melhor: ${n2(M.otimo.segunda.valor)}` : ''}</span>`, M.otimo, foraOt)}${manual}</div>
      ${ui.callout('atencao', `<p>Sem a regra de desempate, a linha de corte levaria ${esc(M.corteSemDesempate.ids.join(', '))}: o mesmo valor (${n2(M.corteSemDesempate.valor)}), mas ${n1(M.corteSemDesempate.fte)} FTE e exposição a risco ${n2(M.corteSemDesempate.exposicao)} contra ${n2(M.corte.exposicao)}. O desempate muda a carteira, não o valor.</p>`)}
      <div class="grid g2"><div class="card">${ui.section('Valor por método', 'Marca branca = valor do ótimo exato')}${CH.hbar(tab.map(([n, m], i) => ({ label:n, value:m.valor, mark:M.otimo.valor, color: m === M.otimo ? 'lime' : i === 4 ? 'info' : 'olive' })), { max: Math.max(M.otimo.valor, mr.valor) * 1.05, fmt:v => n2(v) })}</div>
        <div class="card">${ui.section('Tabela equivalente (comparação)', `${B('R28')} D = desbalanceamento do mix`)}<div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Método</th><th class="r">FTE</th><th class="r">R$ mi</th><th class="r">Valor</th><th class="r">Ocioso</th><th class="r">Efic.</th><th class="r">D</th></tr></thead><tbody>
          ${tab.map(([n, m]) => `<tr><td title="${esc(m.ids.join(', '))}">${esc(n)}</td><td class="r num">${n1(m.fte)}</td><td class="r num">${n2(m.custo)}</td><td class="r num">${n2(m.valor)}</td><td class="r num">${n1(m.ociosidade)}</td><td class="r num">${m.eficiencia == null ? 'n/d' : pc(m.eficiencia)}</td><td class="r num">${pp(m.D)}</td></tr>`).join('')}</tbody></table></div></div></div></div>`;
  }
  function bindMetodos(host){
    host.addEventListener('change', e => { const m = e.target.closest('[data-man]'); if(!m) return; const s = MS(), id = m.dataset.man; s.manual = (s.manual || []).filter(x => x !== id); if(m.checked) s.manual.push(id); PF.save(); PF.refresh(); });
    host.addEventListener('click', e => { if(e.target.closest('[data-porque]')){ T.porque = true; PF.refresh(); } });
  }
  function carteiraEscolhida(d, P){ const s = MS(), m = s.conferir || 'otimo';
    if(m === 'manual'){ const ids = Array.from(new Set((s.manual || []).filter(id => row(P, id)).concat(P.rows.filter(r => r.obrigatoria).map(r => r.id)))); return { metodo:'manual', nome:'Seleção manual', r: C().resumoCarteira(d, ids, P.O) }; }
    const nome = { corte:'Linha de corte', guloso:'Guloso N/FTE', otimo:'Ótimo exato' }[m] || 'Ótimo exato'; return { metodo:m in P.M ? m : 'otimo', nome, r:P.M[m in P.M ? m : 'otimo'] }; }
  const whatif = (d, x) => { const P = pack(d, { cap:x }), M = P.M;
    return `<div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Com ${n1(x)} FTE</th><th>Carteira</th><th class="r">FTE</th><th class="r">Valor</th><th class="r">Ocioso</th><th>Faixa R26</th></tr></thead><tbody>
      ${[['Linha de corte', M.corte], ['Guloso N/FTE', M.guloso], ['Ótimo exato', M.otimo]].map(([n, m]) => `<tr><td>${esc(n)}</td><td class="wrap">${esc(m.ids.join(', ') || '—')}</td><td class="r num">${n1(m.fte)}</td><td class="r num">${m.valor == null ? 'n/d' : n2(m.valor)}</td><td class="r num">${n1(m.ociosidade)}</td><td>${esc((m.faixa || {}).acao || '—')}</td></tr>`).join('')}</tbody></table></div>`; };
  function passoConferir(d, P){
    const c = C(), s = MS(), esc0 = carteiraEscolhida(d, P), r = esc0.r, alvo = c.param(d, 'R28').alvo, tol = c.param(d, 'R28').toleranciaD, L = c.param(d, 'R22'), x = s.whatif || P.cap || 10, props = s.propostas || [];
    const cats = Object.keys(alvo), real = cats.map(k => ({ label:CAT[k] || k, value:(r.mix || {})[k] || 0, color:CATCOR[k] })), al = cats.map(k => ({ label:CAT[k] || k, value:alvo[k], color:CATCOR[k] }));
    const crit = P.rows.filter(z => r.ids.includes(z.id) && z.R >= L.riscoCritico).map(z => z.id);
    return `<div class="stack">${aula('Antes de levar a proposta, confira três coisas: o <b>mix</b> (índice D: quanto a parte discricionária se afasta do alvo; 0 = igual ao alvo), a <b>exposição a risco</b> (R médio ponderado pelo custo) e a <b>faixa de utilização</b>. Depois teste a sensibilidade à capacidade: o que muda com mais ou menos FTE?')}
      <div class="row" data-noprint><span class="pf2-mini">Proposta a conferir:</span>${[['otimo', 'Ótimo exato'], ['guloso', 'Guloso N/FTE'], ['corte', 'Linha de corte'], ['manual', 'Seleção manual']].map(([k, l]) => `<button class="chip ${esc0.metodo === k ? 'on' : ''}" data-conf="${k}" aria-pressed="${esc0.metodo === k}">${esc(l)}</button>`).join('')}</div>
      <div class="grid g2"><div class="card">${ui.section(`Mix da parcela discricionária · ${esc0.nome}`, `D = ½ Σ |real − alvo| ${B('R28')}`)}
          <p class="pf2-mini" style="margin:0 0 4px">Real (custo discricionário R$ ${n2(r.mix ? c.indiceD(d, r.ids, P.O).custoDisc : 0)} mi)</p>${CH.stack(real)}<p class="pf2-mini" style="margin:12px 0 4px">Alvo</p>${CH.stack(al)}
          <p style="margin:12px 0 0">D = <b class="num ${r.D != null && r.D > tol + EPS ? 'tone-warn' : 'tone-ok'}">${pp(r.D)}</b> <span class="pf2-mini">(tolerância ${pp(tol)})</span></p></div>
        <div class="card">${ui.section('Tabela equivalente e outros controles')}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Categoria</th><th class="r">Real</th><th class="r">Alvo</th><th class="r">|dif.|</th></tr></thead><tbody>${cats.map(k => `<tr><td>${esc(CAT[k] || k)}</td><td class="r num">${pc((r.mix || {})[k] || 0)}</td><td class="r num">${pc(alvo[k])}</td><td class="r num">${pp(Math.abs(((r.mix || {})[k] || 0) - alvo[k]))}</td></tr>`).join('')}</tbody></table></div>
          ${kv([['Carteira', esc(r.ids.join(', '))], ['Valor ΣN', `<b class="num">${n2(r.valor)}</b>`], ['Exposição ponderada', `<span class="num">${n2(r.exposicao)}</span> ${B('R22')}`], ['% do custo em risco crítico', `<span class="num">${pc(r.pctCritico)}</span> ${crit.length ? `<small>R ≥ ${L.riscoCritico}: ${esc(crit.join(', '))}</small>` : ''}`], ['Faixa da proposta', `<span class="num">${pc(r.u, 0)}</span> · ${esc((r.faixa || {}).acao || '—')} ${B('R26')}`], ['Viável', r.viavel ? '<span class="pf2-ok">sim</span>' : '<span class="pf2-no">não: estoura</span>']])}</div></div>
      <div class="card">${ui.section('E se a capacidade fosse outra? (what-if)', `De 6 a 12 FTE; orçamento fixo em ${mi(P.orc, 1)} ${B('R24')}`)}
        <label class="field" style="max-width:520px">Capacidade: <b data-wi-lbl>${n1(x)} FTE</b><input type="range" min="6" max="12" step="0.5" value="${x}" data-wi aria-label="Capacidade em FTE para o what-if"></label><div data-wi-res style="margin-top:10px">${whatif(d, x)}</div></div>
      <div class="card">${ui.section('Salvar proposta', 'Grava no seu progresso (não muda os dados de trabalho).')}
        <div class="row"><button class="btn btn-primary btn-sm" data-salvar-prop>${icon('download', 14)} Salvar proposta v${props.length + 1} (${esc(esc0.nome)})</button>${!r.viavel ? '<span class="tone-bad pf2-mini">A carteira estoura a capacidade ou o orçamento.</span>' : ''}</div>
        ${props.length ? `<div class="tbl-wrap" style="margin-top:12px"><table class="tbl pf2-tbl"><thead><tr><th>Versão</th><th>Método</th><th>Carteira</th><th class="r">Valor</th><th class="r">Efic.</th><th class="r">Ocioso</th><th class="r">D</th><th>Pesos</th><th>Salva em</th></tr></thead><tbody>${props.slice().reverse().map(p => `<tr><td>v${p.versao}</td><td>${esc(p.nome)}</td><td class="wrap">${esc(p.ids.join(', '))}</td><td class="r num">${n2(p.valor)}</td><td class="r num">${pc(p.eficiencia)}</td><td class="r num">${n1(p.ociosidade)}</td><td class="r num">${pp(p.D)}</td><td>${esc(p.versaoPesos)}</td><td>${esc(fmt.date(String(p.salvoEm).slice(0, 10)))}</td></tr>`).join('')}</tbody></table></div>` : ''}</div></div>`;
  }
  function bindConferir(host, d){
    host.addEventListener('input', e => { const s = e.target.closest('[data-wi]'); if(!s) return; const x = +s.value; PF.patch(host, '[data-wi-res]', whatif(PF.db(), x)); PF.patch(host, '[data-wi-lbl]', n1(x) + ' FTE'); });
    host.addEventListener('change', e => { const s = e.target.closest('[data-wi]'); if(s){ MS().whatif = +s.value; PF.save(); } });
    host.addEventListener('click', e => { const b = e.target.closest('[data-conf]'); if(b){ MS().conferir = b.dataset.conf; PF.save(); PF.refresh(); return; }
      if(e.target.closest('[data-salvar-prop]')){ const dd = PF.db(), P = pack(dd), e0 = carteiraEscolhida(dd, P), r = e0.r, s = MS(); s.propostas = s.propostas || [];
        const p = { versao:s.propostas.length + 1, metodo:e0.metodo, nome:e0.nome, ids:r.ids.slice(), fte:r.fte, custo:r.custo, valor:r.valor, ociosidade:r.ociosidade, eficiencia:C().div(r.valor, P.M.otimo.valor), D:r.D, exposicao:r.exposicao, viavel:r.viavel, cap:r.cap, versaoPesos:versaoPesos(dd), salvoEm:new Date().toISOString(), simulacao:true };
        s.propostas.push(p); PF.save(); PF.toast(`[SIMULAÇÃO] Proposta <b>v${p.versao}</b> salva (${esc(p.nome)}: ${esc(p.ids.join(', '))}).`); PF.refresh(); } });
  }

  /* ================================================================== A4 · EXERCÍCIO DE GATE */
  function telaGate(el, ctx){
    const d = ctx.dados, aba = ctx.route.query.aba === 'raci' ? 'raci' : 'assistente';
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 2 · A · Escolher', title:'Exercício de Gate', sub:`Sessão de gate simulada do Ciclo Exemplo 2027. ${refM('Stage-Gate (Cooper)')} A analista registra recomendações; a instância decide.` }) +
      META(d) + ui.tabs('#/n2/gate', [['assistente', 'Assistente'], ['raci', 'Quem decide (RACI)']], aba) + '<div data-n2></div>';
    const host = el.querySelector('[data-n2]');
    if(aba === 'raci') host.innerHTML = abaRaci(d); else { host.innerHTML = abaGateAssist(d); bindGate(host); }
  }
  function avisoRaci(d, inst){
    if(!inst) return '<p class="pf2-mini">Escolha a instância para ver o aviso de RACI (não bloqueia).</p>';
    if(/PO da squad/i.test(inst)) return ui.callout('atencao', `<p><b>Contexto “squad”.</b> Leituras em conflito sobre o papel do PMO na priorização: <b>s143</b>: PMO “C” (consultado) × <b>s149</b>: PMO “A” (aprova) em demandas de sustentação. O app mostra as duas e não escolhe. Leitura do texto extraído; conferir no slide.</p><div class="row">${B('R33')}${B('R38')}</div>`);
    if(/Planejamento do Portf/i.test(inst)) return ui.callout('atencao', `<p><b>Contexto “ciclo”.</b> Deliberação: Fórum de Planejamento do Portfólio (s127); tomadores de decisão segundo o s205: Diretores/GEs. A validar.</p><div class="row">${B('R38')}${PROP('s127, s205')}</div>`);
    return ui.callout('atencao', `<p><b>Sessão de gate simulada.</b> O s153 descreve um mecanismo, não um fórum: a instância que decide está a validar. Registre como recomendação.</p><div class="row">${PROP('s153')}</div>`);
  }
  function abaGateAssist(d){
    const c = C(), P = pack(d), s = MS(), id = row(P, s.gateSel) ? s.gateSel : (P.rows[0] || {}).id; if(!id) return '<p class="muted">Sem candidatas no ciclo.</p>';
    const i = byId(d.iniciativas, id), r = row(P, id), L = c.param(d, 'R22'), ot = P.M.otimo, noOt = ot.ids.includes(id), ben = (d.beneficios || []).filter(b => b.iniciativaId === id);
    const ev = i.evidenciaObrigatoriedade, deps = c.depsLogicas(d), dOrig = deps.filter(x => x[0] === id), dAlvo = deps.filter(x => x[1] === id);
    let fx; if(r.obrigatoria) fx = 'Obrigatória: entra antes do ranking em qualquer carteira.';
    else if(noOt){ const sem = c.otimizar(d, Object.assign({}, P.O, { proibir:[id] })); fx = `Está no ótimo exato. Sem ela: ${sem.viavel ? `valor ${n2(sem.valor)} (${sn(sem.valor - ot.valor)} pontos), D ${pp(sem.D)}` : 'não há carteira viável'}.`; }
    else { const com = c.otimizar(d, Object.assign({}, P.O, { forcar:[id] })); fx = `Fora do ótimo exato. Forçando a entrada: ${com.viavel ? `valor ${n2(com.valor)} (${sn(com.valor - ot.valor)} pontos), D ${pp(com.D)}; sai(em) ${ot.ids.filter(k => !com.ids.includes(k)).join(', ') || '—'}` : 'não cabe com as restrições'}.`; }
    const tv = T.gate && T.gate.id === id ? T.gate : { id, vals:{}, erros:null }, v = tv.vals || {}, er = tv.erros || {};
    const recs = (d.decisoes || []).filter(x => x.iniciativaId === id && GATE.includes(x.tipoDecisao)), vig = new Set(c.decisoesVigentes(d).map(x => x.id));
    const ultimo = T.gateUltimo && byId(d.decisoes, T.gateUltimo) && byId(d.decisoes, T.gateUltimo).iniciativaId === id ? byId(d.decisoes, T.gateUltimo) : null, sug = ultimo ? gateSugerido(d, id, P) : null;
    const blk = (l, t, h) => `<div class="card pf2-blk"><h4>${l} · ${esc(t)}</h4>${h}</div>`;
    return `<div class="stack">${aula('<b>Gate</b> é um ponto de decisão entre fases: Go (segue), Go condicionado (segue se cumprir condições), Hold (pausa com gatilho), Recycle (volta menor ou refeita) e Kill (encerra). Primeiro os eliminatórios (<b>must-meet</b>), depois o mérito (<b>should-meet</b>). A analista recomenda e registra a versão dos pesos; quem decide é a instância.')}
      <div class="row" data-noprint><span class="pf2-mini">Candidata:</span>${P.rows.map(x => `<button class="chip ${x.id === id ? 'on' : ''}" data-gsel="${esc(x.id)}" aria-pressed="${x.id === id}">${esc(x.id)}</button>`).join('')}</div>
      <div class="card hl"><div class="eyebrow">${esc(id)} · ${esc(CAT[r.categoria] || r.categoria)}</div><h3 style="font-size:20px;font-weight:300;margin:4px 0 0">${esc(tit(d, id))}</h3></div>
      <div class="grid g3">
        ${blk('A', 'Admissibilidade (do N1)', kv([['Patrocinador', i.patrocinador ? okTxt(true, esc(i.patrocinador)) : okTxt(false, 'vazio')], ['Objetivo', i.objetivoEstrategicoId ? okTxt(true, esc(i.objetivoEstrategicoId)) : okTxt(false, 'vazio')], ['Estimativa', r.fte > 0 ? okTxt(true, n1(r.fte) + ' FTE') : okTxt(false, 'sem FTE')], ['Fase', faseNome(d, i.statusId)]]) + `<div class="row">${B('R17')}</div>`)}
        ${blk('B', 'Obrigatoriedade e evidência', kv([['Obrigatória', r.obrigatoria ? 'sim' : 'não'], ['Evidência', ev ? `${esc(ev.documento || '—')} · ${ev.anexada ? okTxt(true, 'anexada') : okTxt(false, 'pendente')}` : '—']]) + `<div class="row">${B('R12')}</div>`)}
        ${blk('C', 'Valor', kv([['S · N', `<span class="num">${n2(r.S)} · <b>${n2(r.N)}</b></span> (${(P.rk.find(x => x.id === id) || {}).posicao}º)`], ['Benefício esperado', esc(i.beneficioEsperado || '—')], ['KPI, base e meta', ben.length ? ben.map(b => `${esc(b.kpi)}: base ${fmt.n(b.linhaBase)} → meta ${fmt.n(b.meta)} ${esc(b.unidade || '')}`).join('<br>') : '<span class="tone-warn">não definidos: condicionante natural</span>']]) + `<div class="row">${B('R21')}${ILU()}</div>`)}
        ${blk('D', 'Esforço e capacidade', kv([['FTE · R$ mi', `<span class="num">${n1(r.fte)} · ${n2(r.custo)}</span>`], ['N/FTE · N/R$', `<span class="num">${n2(r.nFte)} · ${n1(r.nCusto)}</span>`], ['Discricionária do ciclo', `<span class="num">${n1(P.disc.fte)} FTE · ${mi(P.disc.custo, 1)}</span>`]]) + `<div class="row">${B('R24')}</div>`)}
        ${blk('E', 'Risco', kv([['P · I · R', `<span class="num">${r.P ?? '—'} · ${r.I ?? '—'} · <b class="${r.R >= L.riscoCritico ? 'tone-bad' : r.R >= L.riscoAlto ? 'tone-warn' : ''}">${r.R}</b></span>`], ['Mitigação', r.acao ? esc(r.acao) : '<span class="tone-bad">nenhuma registrada</span>'], ['Dupla contagem?', `C5 = ${(r.notas || {}).C5 ?? '—'} (viabilidade) e R = ${r.R}. Se os dois medem a mesma incerteza técnica, ela conta duas vezes.`]]) + `<div class="row">${B('R22')}${B('R19')}</div>`)}
        ${blk('F', 'Carteira', `<p class="muted" style="margin:0">${esc(fx)}</p>${dOrig.length ? `<p class="tone-warn pf2-mini" style="margin:0">Depende de ${esc(dOrig.map(x => x[1]).join(', '))} (lógica, a confirmar).</p>` : ''}${dAlvo.length ? `<p class="pf2-mini" style="margin:0">Pode habilitar ${esc(dAlvo.map(x => x[0]).join(', '))}.</p>` : ''}<div class="row">${B('R28')}${B('R24')}</div>`)}</div>
      <div class="card">${ui.section(`Registrar recomendação de gate para ${id}`, `Catálogo ${B('R18')} · pesos ${esc(versaoPesos(d))} ${B('R20')} · cenário C0 · [Simulado] Sessão de gate`)}
        ${tv.geral ? ui.callout('atencao', `<p>${tv.geral}</p>`) : ''}
        <form class="pf2-form" data-gate-form="${esc(id)}" novalidate>
          ${campo('tipo', 'Recomendação *', sel('tipo', v.tipo, GATE.map(k => [k, GNOME[k]]), 'Escolha…'), er)}
          ${campo('proximaRevisao', 'Próxima revisão (obrigatória em Go condicionado, Hold e Recycle)', inp('proximaRevisao', v.proximaRevisao, 'date'), er)}
          ${campo('justificativa', 'Justificativa * (mínimo 30 caracteres)', area('justificativa', v.justificativa, 2, 'por que esta saída, com os números dos blocos C a F'), er, true)}
          ${campo('condicionantes', 'Condicionantes (obrigatórias em Go condicionado)', area('condicionantes', v.condicionantes, 2, 'o que precisa estar cumprido e até quando'), er, true)}
          ${campo('gatilhoReativacao', 'Gatilho de reativação (obrigatório em Hold)', inp('gatilhoReativacao', v.gatilhoReativacao, 'text', 'placeholder="ex.: Dep4 confirmada"'), er, true)}
          ${campo('papelRegistrante', 'Quem registra *', sel('papelRegistrante', v.papelRegistrante, papeis(d), 'Escolha…'), er)}
          ${campo('instancia', 'Instância que decide *', sel('instancia', v.instancia, instancias(d, 'gate'), 'Escolha…', 'data-gate-inst'), er)}
          <div class="full" data-raci-aviso>${avisoRaci(d, v.instancia)}</div>
          <div class="full row" style="justify-content:flex-end"><span class="pf2-mini">Grava como recomendação (a instância decide) · [SIMULAÇÃO]</span><button type="submit" class="btn btn-primary btn-sm">Registrar recomendação</button></div></form></div>
      ${ultimo ? `<div class="card">${ui.section('Recomendação registrada', 'A saída sugerida aparece só depois do registro.')}
        ${ui.callout(ultimo.tipoDecisao === sug.tipo ? 'dica' : (sug.aceitas.includes(ultimo.tipoDecisao) ? 'dica' : 'atencao'), `<p>Você recomendou <b>${esc(GNOME[ultimo.tipoDecisao])}</b>. Saída sugerida pelo sistema: <b>${esc(GNOME[sug.tipo])}</b>${sug.aceitas.length ? ` (também defensável: ${esc(sug.aceitas.map(k => GNOME[k]).join(', '))})` : ''}. ${esc(sug.motivo)}</p><p class="pf2-mini">Sugestão didática, não gabarito oficial: a decisão é da instância.</p>`)}</div>` : ''}
      ${recs.length ? `<div class="card">${ui.section(`Recomendações de gate de ${id}`)}${recs.slice().reverse().map(x => `<div class="pf2-sec"><b class="lime">[SIMULAÇÃO]</b> ${esc(x.id)} · <b>${esc(GNOME[x.tipoDecisao] || x.tipoDecisao)}</b> · ${esc(fmt.date(String(x.decididoEm || x.registradoEm).slice(0, 10)))} ${vig.has(x.id) ? ui.pill('vigente', 'ok') : ui.pill('corrigida', 'warn')}<div class="pf2-mini">${esc(x.justificativa || '')} · registra ${esc(x.papelRegistrante || '—')} → ${esc(x.instancia || '—')} · pesos ${esc(x.versaoPesos || '—')}</div></div>`).join('')}</div>` : ''}
      ${resumoSessao(d, P)}</div>`;
  }
  function resumoSessao(d, P){
    const g = gatesN2(d), ult = {}; g.slice().sort((a, b) => String(a.registradoEm || a.decididoEm).localeCompare(String(b.registradoEm || b.decididoEm))).forEach(x => ult[x.iniciativaId] = x);
    const ids = Object.keys(ult).sort(), go = ids.filter(id => ['GO', 'GO_CONDICIONADO'].includes(ult[id].tipoDecisao) && row(P, id)), r = C().resumoCarteira(d, go, P.O);
    return `<div class="card">${ui.section('Proposta de carteira da sessão de gate', 'Última recomendação vigente por candidata; a carteira soma Go e Go condicionado.')}
      ${ids.length ? `<div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Cand.</th><th>Recomendação</th><th>Instância</th><th>Pesos</th></tr></thead><tbody>${ids.map(id => `<tr><td><b>${esc(id)}</b></td><td>${esc(GNOME[ult[id].tipoDecisao])}</td><td class="wrap">${esc(ult[id].instancia || '—')}</td><td>${esc(ult[id].versaoPesos || '—')}</td></tr>`).join('')}</tbody></table></div>
        <p style="margin:10px 0 0">Carteira (Go + Go condicionado): <b>${esc(go.join(', ') || '—')}</b> · ${n1(r.fte)} / ${n1(r.cap)} FTE · ${mi(r.custo)} / ${mi(r.orc, 1)} · valor ${n2(r.valor)} (ótimo ${n2(P.M.otimo.valor)}) ${r.viavel ? okTxt(true, 'cabe') : okTxt(false, 'estoura')}</p>` : '<p class="muted">Nenhuma recomendação de gate registrada ainda.</p>'}</div>`;
  }
  function bindGate(host){
    host.addEventListener('click', e => { const b = e.target.closest('[data-gsel]'); if(b){ MS().gateSel = b.dataset.gsel; PF.save(); T.gateUltimo = null; PF.refresh(); } });
    host.addEventListener('change', e => { if(e.target.matches('[data-gate-inst]')) PF.patch(host, '[data-raci-aviso]', avisoRaci(PF.db(), e.target.value)); });
    host.addEventListener('submit', e => { e.preventDefault(); const f = e.target; if(!f.dataset.gateForm) return; const id = f.dataset.gateForm, d = PF.db(), fd = new FormData(f), get = k => String(fd.get(k) ?? '').trim();
      const v = { tipo:get('tipo'), justificativa:get('justificativa'), condicionantes:get('condicionantes'), proximaRevisao:get('proximaRevisao'), gatilhoReativacao:get('gatilhoReativacao'), papelRegistrante:get('papelRegistrante'), instancia:get('instancia') }, er = {};
      if(!v.tipo) er.tipo = PF.msgHtml('REQUIRED', { campo:'a recomendação' });
      if(v.justificativa.length < 30) er.justificativa = PF.msgHtml('JUSTIFICATIVA', { min:30 });
      if(v.tipo === 'GO_CONDICIONADO' && !v.condicionantes) er.condicionantes = PF.msgHtml('REQUIRED', { campo:'as condicionantes' });
      if(['GO_CONDICIONADO', 'HOLD', 'RECYCLE'].includes(v.tipo) && !v.proximaRevisao) er.proximaRevisao = PF.msgHtml('REQUIRED', { campo:'a próxima revisão' });
      else if(v.proximaRevisao && v.proximaRevisao <= C().ref(d)) er.proximaRevisao = PF.msgHtml('VALIDATION_ERROR', { texto:`A próxima revisão precisa ser depois da data de referência (${fmt.date(C().ref(d))}).` });
      if(v.tipo === 'HOLD' && !v.gatilhoReativacao) er.gatilhoReativacao = PF.msgHtml('REQUIRED', { campo:'o gatilho de reativação' });
      if(!v.papelRegistrante) er.papelRegistrante = PF.msgHtml('REQUIRED', { campo:'quem registra' });
      if(!v.instancia) er.instancia = PF.msgHtml('REQUIRED', { campo:'a instância' }); else if(v.instancia === v.papelRegistrante) er.instancia = PF.msgHtml('VALIDATION_ERROR', { texto:'A instância precisa ser diferente de quem registra.' });
      if(Object.keys(er).length){ T.gate = { id, vals:v, erros:er, geral:'Corrija os campos destacados.' }; PF.refresh(); return; }
      const x = PF.append('decisoes', { iniciativaId:id, tipoDecisao:v.tipo, decisao:`Recomendação de gate: ${GNOME[v.tipo]} para ${id}${v.condicionantes ? ' · condicionantes: ' + v.condicionantes : ''}`, justificativa:v.justificativa, responsavel:v.papelRegistrante,
        papelRegistrante:v.papelRegistrante, instancia:v.instancia, recomendacao:true, condicionantes:v.condicionantes || null, proximaRevisao:v.proximaRevisao || null, gatilhoReativacao:v.gatilhoReativacao || null,
        versaoPesos:versaoPesos(d), cenarioId:'C0', forumId:'FR-GATE', tipoRitoForum:'SESSAO_GATE_SIMULADA', decididoEm:hoje(), nivel:2 });
      T.gate = null; T.gateUltimo = x.id; PF.toast(`[SIMULAÇÃO] Recomendação <b>${esc(GNOME[v.tipo])}</b> registrada para ${esc(id)} (${esc(x.id)}).`); PF.refresh(); });
  }
  /** Badge da linha da RACI com o slide da própria linha (o da regra R38 citaria sempre o s143); o clique abre a ficha da regra. */
  const badgeLinha = r => r.origemRegra ? `<span data-pf-regra="${esc(r.regra || 'R38')}" style="cursor:pointer">${PF.badge({ origemRegra:r.origemRegra, tipoFonte:r.tipoFonte, referencia:r.referencia || r.fonte })}</span>` : B(r.regra || 'R38');
  function abaRaci(d){
    const rs = d.raci || [];
    return `<div class="stack">${aula('<b>RACI</b> diz quem executa (R), quem responde pela decisão (A), quem é consultado (C) e quem é informado (I). Aqui a RACI foi reconstruída do texto extraído do deck: é proposta a conferir no slide original, e onde as fontes se contradizem o app mostra as duas. O PMO consolida, recomenda e escala; a instância decide.')}
      <div class="card">${ui.section('Quem decide (proposta A&M · reconstrução do texto extraído · conferir no slide)', `${B('R38')}`)}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Atividade</th><th>Leitura proposta</th><th>Fonte</th><th>Rótulo</th></tr></thead><tbody>
        ${rs.map(r => `<tr><td>${esc(r.atividade)}</td><td class="muted">${esc(r.leitura)}</td><td>${esc(r.fonte)}</td><td>${badgeLinha(r)}${r.conflito ? ' ' + B(r.conflito) : ''}</td></tr>`).join('')}</tbody></table></div></div>
      ${ui.callout('dica', `<p>Escalonar impedimentos e registrar pendências são atribuições da analista (s74): ficam fora do aviso de RACI. A linha do CT PMO-PLD vem de comentário de revisão (rascunho) ${B('R34')}.</p>`)}</div>`;
  }

  /* ================================================================== B1 · DESEMPENHO (EVM) */
  function telaEvm(el, ctx){
    const d = ctx.dados, c = C(), A = c.emExecucao(d), ev = A.map(i => c.evm(d, i)), port = c.evmPortfolio(d, A), L = c.param(d, 'R29'), extra = MS().pautaExtra || [];
    const baixo = v => v != null && v < L.indice - EPS, cel = (v, f = n2) => `<td class="r num ${baixo(v) ? 'tone-bad' : ''}">${v == null ? 'n/d' : f(v)}${baixo(v) ? ' ▼' : ''}</td>`;
    const dest = ev.filter(e => baixo(e.spi) || baixo(e.cpi));
    const linhas = ev.map(e => `<tr><td><b>${esc(e.id)}</b><small>${esc(tit(d, e.id).slice(0, 48))}</small></td><td class="r num">${n2(e.bac)}</td><td class="r num">${e.pv == null ? 'n/d' : n2(e.pv)}</td><td class="r num">${n2(e.ev)}</td><td class="r num">${n2(e.ac)}</td>${cel(e.spi)}${cel(e.cpi)}<td class="r num">${n2(e.eac)}</td><td class="r num">${n2(e.previsao)}</td><td class="r num ${e.eacPctPrevisao > LIM_EAC ? 'tone-warn' : ''}">${sn(e.eacMenosPrevisao)}<small>${e.eacPctPrevisao == null ? '' : sn(e.eacPctPrevisao * 100, 0) + '%'}</small></td>
      <td>${baixo(e.spi) || baixo(e.cpi) ? (extra.includes(e.id) ? '<span class="pf2-mini">na pauta</span>' : `<button class="btn btn-ghost btn-sm" data-pauta-add="${esc(e.id)}" title="Gerar item de pauta para o Fórum Mensal">${icon('plus', 13)} Pauta</button>`) : ''}</td></tr>`).join('');
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 2 · B · Acompanhar', title:'Desempenho (EVM)', sub:`Valor agregado das iniciativas em execução: o que foi planejado, o que foi feito e quanto custou. ${refM('PMI · gerenciamento do valor agregado')}` }) + META(d) +
      `<div class="stack">${aula('<b>EV</b> = % físico × BAC: o valor do que já foi feito. <b>CPI</b> = EV ÷ AC: quanto valor cada R$ 1 gerou. <b>SPI</b> = EV ÷ PV: quanto do planejado foi feito. <b>EAC</b> = BAC ÷ CPI: quanto deve custar no fim se nada mudar. Índice abaixo de 0,85 pede atenção.')}
        <div class="grid g4">${ui.kpi({ label:'CPI do portfólio', value:n2(port.cpi), sub:`ΣEV ${n2(port.ev)} ÷ ΣAC ${n2(port.ac)}`, tone: baixo(port.cpi) ? 'bad' : '' })}${ui.kpi({ label:'SPI do portfólio', value:n2(port.spi), sub:`ΣEV ${n2(port.evSpi)} ÷ ΣPV ${n2(port.pv)} · fora: ${esc(port.foraSpi.join(', ') || '—')} (sem baseline)`, tone: baixo(port.spi) ? 'bad' : '' })}
          ${ui.kpi({ label:'Abaixo de ' + n2(L.indice), value:String(dest.length), sub:esc(dest.map(e => e.id).join(', ') || 'nenhuma'), tone: dest.length ? 'warn' : '' })}${ui.kpi({ label:'Em execução', value:String(A.length), sub:'fase “Em execução”' })}</div><div class="row">${B('R30')}${B('R29')}${ILU()}<span class="pf2-mini">Índices: fórmula de mercado; limiar 0,85 a validar; dados fictícios.</span></div>
        <div class="card">${ui.section('EVM por iniciativa (R$ mi)', `Fórmulas ${B('R30')} · limiar ${B('R29')} · convenções ${B('R37')} · dados ${ILU()}`)}
          <div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Inic.</th><th class="r">BAC</th><th class="r">PV</th><th class="r">EV</th><th class="r">AC</th><th class="r">SPI</th><th class="r">CPI</th><th class="r">EAC</th><th class="r">Previsão</th><th class="r">EAC − prev.</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div>
          <p class="pf2-mini" style="margin:8px 0 0">PV = % físico planejado × BAC. Sem baseline ou sem % planejado (E06), PV e SPI ficam n/d e a iniciativa sai do SPI do portfólio. “Previsão” = previsão no término declarada pelo responsável.</p></div>
        <details class="card"><summary style="cursor:pointer" class="lime">Aprofundamento: VAC e TCPI (não cai nas perguntas)</summary><div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Inic.</th><th class="r">VAC = BAC − EAC</th><th class="r">TCPI = (BAC − EV) ÷ (BAC − AC)</th></tr></thead><tbody>
          ${ev.map(e => `<tr><td>${esc(e.id)}</td><td class="r num">${sn(e.vac)}</td><td class="r num ${e.tcpi != null && e.tcpi > L.tcpi ? 'tone-bad' : ''}">${e.tcpi == null ? esc(e.tcpiMotivo || 'n/d') : n2(e.tcpi)}</td></tr>`).join('')}</tbody></table></div><p class="pf2-mini">TCPI acima de ${n2(L.tcpi)} indica que o restante teria de render bem mais do que rendeu até agora ${B('R29')}.</p></details>
        <div class="grid g2"><div class="card">${ui.section('PV, EV e AC por iniciativa', 'R$ mi')}${CH.bars(ev.map(e => e.id), [{ name:'PV', values:ev.map(e => e.pv || 0), color:'paper' }, { name:'EV', values:ev.map(e => e.ev || 0), color:'lime' }, { name:'AC', values:ev.map(e => e.ac || 0), color:'bad' }], { fmt:v => n2(v) })}<p class="pf2-mini" style="margin:6px 0 0">Tabela equivalente: colunas PV, EV e AC da tabela acima (E06 sem PV).</p></div>
          <div class="card">${ui.section('Destaques (SPI ou CPI abaixo de ' + n2(L.indice) + ')', 'Leve ao Fórum Mensal com o EAC')}${dest.length ? dest.map(e => `<div class="pf2-sec"><h4>${esc(e.id)} · SPI ${n2(e.spi)} · CPI ${n2(e.cpi)}</h4><div class="muted">EAC ${mi(e.eac)} contra previsão declarada ${mi(e.previsao)} (${sn(e.eacMenosPrevisao)}). Custo restante pelo EAC: ${mi(e.etc)}.</div></div>`).join('') : '<p class="muted">Nenhuma.</p>'}
            ${extra.length ? `<p class="pf2-mini">Na pauta do fórum: ${esc(extra.join(', '))} · <a href="#/n2/forum?aba=pauta">abrir pauta →</a></p>` : ''}</div></div></div>`;
    el.addEventListener('click', e => { const b = e.target.closest('[data-pauta-add]'); if(!b) return; const s = MS(); s.pautaExtra = Array.from(new Set((s.pautaExtra || []).concat(b.dataset.pautaAdd))); PF.save(); PF.toast(`Item de pauta gerado para <b>${esc(b.dataset.pautaAdd)}</b>.`); PF.go('#/n2/forum?aba=pauta'); });
  }

  /* ================================================================== B2 · FÓRUM MENSAL */
  const ABAS_F = [['pauta', 'Pauta'], ['mudou', 'O que mudou'], ['ata', 'Ata e escalonamentos'], ['foto', 'Fotografia']];
  function telaForum(el, ctx){
    const d = ctx.dados, aba = ABAS_F.some(a => a[0] === ctx.route.query.aba) ? ctx.route.query.aba : 'pauta', fr = byId(d.foruns, 'FR-OUT') || {};
    el.innerHTML = ui.pageHead({ eyebrow:'Nível 2 · B · Acompanhar', title:'Fórum Mensal', sub:`${esc(fr.nome || '[Simulado] Fórum de Acompanhamento de Portfólio: out/2026')} · data de corte ${esc(fmt.date(fr.dataCorte))}. Pauta por exceção, o que mudou, escalonamentos e fotografia.`, actions: PF.pdfButton('Exportar exercício (PDF)') }) +
      META(d) + `<div class="row" style="margin:-6px 0 14px">${B('R05a')}<span class="pf2-mini">Fórum mensal coordenado pela FEG (proposta s129, a validar)</span></div>` + ui.tabs('#/n2/forum', ABAS_F, aba) + '<div data-n2></div>';
    const host = el.querySelector('[data-n2]');
    if(aba === 'mudou'){ host.innerHTML = abaMudou(d); host.addEventListener('click', e => { const b = e.target.closest('[data-mudou]'); if(b){ T.mudouBase = b.dataset.mudou; PF.refresh(); } }); } else if(aba === 'ata'){ host.innerHTML = abaAta(d); bindAta(host); } else if(aba === 'foto'){ host.innerHTML = abaFoto(d); bindFoto(host); } else { host.innerHTML = abaPauta(d); bindPauta(host); }
  }
  function abaPauta(d){
    const p = pauta(d);
    return `<div class="stack">${aula('<b>Pauta por exceção</b>: o fórum discute o que saiu da tolerância, não tudo. Cinco seções, nesta ordem: vermelhas e divergências; riscos vencidos; bloqueios causados por vermelhas; EAC acima da previsão; pendências e demandas antigas. Cada item pede uma saída: seguir, escalar, replanejar ou registrar desvio.')}
      <div class="row">${ui.pill(p.total + ' itens na pauta', 'lime')}${B('R13')}<span class="pf2-mini">Sinal: regra didática a validar, não usar em reporte.</span></div>
      ${p.secoes.map(s => `<div class="card"><div class="pf2-sec" style="margin:0;border:0;padding:0"><h4>${s.n} · ${esc(s.titulo)} ${B(s.regra)}${s.limiar ? ' ' + AVF('Limiar didático de 10% para EAC × previsão (a validar FEG)') : ''}</h4>${s.itens.length ? `<ul>${s.itens.map(x => `<li>${x.html}</li>`).join('')}</ul>` : '<p class="muted" style="margin:0">Nada nesta seção.</p>'}</div></div>`).join('')}
      <div class="grid g2"><div class="card">${ui.section('Rascunho importado do Nível 1', 'Dashboard N1 → rascunho da pauta (FR-OUT)')}${p.rascunho.itens.length || p.rascunho.obs ? `${p.rascunho.itens.length ? `<p style="margin:0 0 6px">Discussão aprofundada: <b>${esc(p.rascunho.itens.join(', '))}</b></p>` : ''}${p.rascunho.obs ? `<p class="muted" style="white-space:pre-wrap;margin:0">${esc(p.rascunho.obs)}</p>` : ''}` : '<p class="muted">Nenhum rascunho salvo no Nível 1 (a lista de itens e as observações de FR-OUT estão vazias).</p>'}</div>
        <div class="card">${ui.section('Itens gerados no EVM')}${p.extra.length ? `<ul class="muted" style="margin:0;padding-left:18px">${p.extra.map(id => `<li><b>${esc(id)}</b> · ${esc(tit(d, id))} <button class="btn-text" data-pauta-rm="${esc(id)}">remover</button></li>`).join('')}</ul>` : '<p class="muted">Nenhum. Use o botão “Pauta” nas iniciativas destacadas da tela Desempenho (EVM).</p>'}</div></div></div>`;
  }
  function bindPauta(host){ host.addEventListener('click', e => { const b = e.target.closest('[data-pauta-rm]'); if(!b) return; const s = MS(); s.pautaExtra = (s.pautaExtra || []).filter(x => x !== b.dataset.pautaRm); PF.save(); PF.refresh(); }); }
  const ROT_IND = { emExecucao:'Em execução', pctVermelhoContagem:'% em vermelho (contagem)', pctOrcamentoVermelho:'% do orçamento em vermelho', riscosAbertos:'Riscos e impedimentos abertos', dependenciasAbertas:'Dependências abertas', divergencias:'Divergências de sinal', cpiPortfolio:'CPI do portfólio' };
  const fmtInd = (k, v) => v == null ? 'n/d' : /^pct/.test(k) ? pc(v) : k === 'cpiPortfolio' ? n2(v) : fmt.n(v);
  const fmtDelta = (k, v) => v == null ? '—' : /^pct/.test(k) ? sn(v * 100, 1) + ' pp' : k === 'cpiPortfolio' ? sn(v) : sn(v, 0);
  function abaMudou(d){
    const c = C(), fechadas = (d.snapshotsForum || []).filter(s => s.status === 'FECHADO'), base = (T.mudouBase && byId(fechadas, T.mudouBase)) || c.ultimaFotografiaFechada(d, 'FR-SET') || c.ultimaFotografiaFechada(d);
    if(!base) return '<p class="muted">Não há fotografia FECHADA para comparar.</p>';
    const df = c.diffFotografia(base, c.conteudoFotografia(d));
    return `<div class="stack">${aula('“O que mudou” compara a última fotografia FECHADA com o estado atual, usando a mesma função de cálculo dos dois lados. Assim o fórum vê o que piorou desde a reunião anterior, e não só o retrato de hoje. Uma iniciativa pode piorar no calculado enquanto o declarado melhora.')}
      <div class="row" data-noprint><span class="pf2-mini">Comparar com:</span>${fechadas.map(s => `<button class="chip ${s.id === base.id ? 'on' : ''}" data-mudou="${esc(s.id)}" aria-pressed="${s.id === base.id}">${esc(s.id)} · ${esc(s.forumId)} v${s.versao || 1}</button>`).join('')}${B('R06')}</div>
      <div class="grid g2"><div class="card">${ui.section(`Indicadores: ${base.id} (${fmt.date(base.geradoEm)}) → hoje`, `Mesma função de fotografia ${B('R13')} ${B('R30')}`)}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Indicador</th><th class="r">Antes</th><th class="r">Hoje</th><th class="r">Δ</th></tr></thead><tbody>
          ${df.indicadores.map(x => `<tr class="${x.mudou ? 'sel' : ''}"><td>${esc(ROT_IND[x.chave] || x.chave)}</td><td class="r num">${fmtInd(x.chave, x.antes)}</td><td class="r num">${fmtInd(x.chave, x.depois)}</td><td class="r num">${fmtDelta(x.chave, x.delta)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="card">${ui.section('Sinal calculado por iniciativa', 'Linhas destacadas mudaram')}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Inic.</th><th>Antes</th><th>Hoje</th><th>Campos que mudaram</th></tr></thead><tbody>
          ${df.iniciativas.map(x => `<tr class="${x.mudou || x.campos.length ? 'sel' : ''}"><td><b>${esc(x.id)}</b>${x.piorou ? '<small class="tone-bad">piorou</small>' : x.melhorou ? '<small class="tone-ok">melhorou</small>' : ''}</td><td>${pillS(x.antes)}</td><td>${pillS(x.depois)}</td><td class="pf2-mini">${x.campos.length ? x.campos.map(k => `<span title="${esc(k)}">${esc(campoNome(k))}</span>`).join(', ') : '—'}</td></tr>`).join('')}</tbody></table></div>
          <p class="pf2-mini" style="margin:8px 0 0">Pioraram: <b>${esc(df.pioraram.join(', ') || 'nenhuma')}</b>.</p></div></div></div>`;
  }
  function abaAta(d){
    const c = C(), A = c.emExecucao(d), vig = new Set(c.decisoesVigentes(d).map(x => x.id)), regs = (d.decisoes || []).filter(x => x.forumId === 'FR-OUT').slice().reverse(), tv = T.ata || { vals:{}, erros:null }, v = tv.vals || {}, er = tv.erros || {};
    return `<div class="stack">${aula('A ata registra o que o fórum encaminhou. <b>Escalar</b> é levar a quem decide, com opções e números (atribuição da analista). <b>Replanejar</b> e <b>registrar desvio</b> são recomendações: a instância aprova. Toda linha diz quem registra e qual instância decide.')}
      <div class="card">${ui.section('Registrar encaminhamento', `Tipos de acompanhamento ${B('R18')} · fórum ${B('R05a')}`)}${tv.geral ? ui.callout('atencao', `<p>${tv.geral}</p>`) : ''}
        <form class="pf2-form" data-ata-form novalidate>
          ${campo('tipo', 'Tipo *', sel('tipo', v.tipo, ACOMP.map(k => [k, ANOME[k]]), 'Escolha…'), er)}
          ${campo('iniciativaId', 'Iniciativa *', sel('iniciativaId', v.iniciativaId, A.map(i => [i.id, i.id + ' · ' + tit(d, i.id).slice(0, 50)]), 'Escolha…'), er)}
          ${campo('decisao', 'Encaminhamento * (opções, números e efeito em dependentes)', area('decisao', v.decisao, 3, 'ex.: três opções (nova baseline, corte de escopo, interrupção), custo restante pelo EAC e efeito em E02'), er, true)}
          ${campo('justificativa', 'Justificativa * (mínimo 20 caracteres)', area('justificativa', v.justificativa, 2), er, true)}
          ${campo('papelRegistrante', 'Quem registra *', sel('papelRegistrante', v.papelRegistrante, papeis(d), 'Escolha…'), er)}
          ${campo('instancia', 'Instância *', sel('instancia', v.instancia, instancias(d, 'acompanhamento'), 'Escolha…'), er)}
          <div class="full row" style="justify-content:flex-end"><span class="pf2-mini">Replanejar e registrar desvio gravam como recomendação · [SIMULAÇÃO]</span><button type="submit" class="btn btn-primary btn-sm">Registrar na ata</button></div></form></div>
      <div class="card">${ui.section('Registro de decisões do fórum (FR-OUT)', '<a href="#/decisoes">ver todas em Decisões →</a>')}${regs.length ? regs.map(x => `<div class="pf2-sec"><b class="lime">[SIMULAÇÃO]</b> ${esc(x.id)} · <b>${esc(ANOME[x.tipoDecisao] || x.tipoDecisao)}</b> · ${esc(x.iniciativaId || '—')} ${vig.has(x.id) ? ui.pill('vigente', 'ok') : ui.pill('corrigida', 'warn')}<div class="muted">${esc(x.decisao)}</div><div class="pf2-mini">${x.recomendacao ? 'Recomendação' : 'Ato da analista'} · registra ${esc(x.papelRegistrante || '—')} → instância ${esc(x.instancia || '—')}</div></div>`).join('') : '<p class="muted">Nenhum encaminhamento registrado para FR-OUT.</p>'}</div></div>`;
  }
  function bindAta(host){
    host.addEventListener('submit', e => { e.preventDefault(); if(!e.target.matches('[data-ata-form]')) return; const fd = new FormData(e.target), get = k => String(fd.get(k) ?? '').trim();
      const v = { tipo:get('tipo'), iniciativaId:get('iniciativaId'), decisao:get('decisao'), justificativa:get('justificativa'), papelRegistrante:get('papelRegistrante'), instancia:get('instancia') }, er = {};
      if(!v.tipo) er.tipo = PF.msgHtml('REQUIRED', { campo:'o tipo' }); if(!v.iniciativaId) er.iniciativaId = PF.msgHtml('REQUIRED', { campo:'a iniciativa' }); if(!v.decisao) er.decisao = PF.msgHtml('REQUIRED', { campo:'o encaminhamento' });
      if(v.justificativa.length < 20) er.justificativa = PF.msgHtml('JUSTIFICATIVA', { min:20 }); if(!v.papelRegistrante) er.papelRegistrante = PF.msgHtml('REQUIRED', { campo:'quem registra' });
      if(!v.instancia) er.instancia = PF.msgHtml('REQUIRED', { campo:'a instância' }); else if(v.instancia === v.papelRegistrante) er.instancia = PF.msgHtml('VALIDATION_ERROR', { texto:'A instância precisa ser diferente de quem registra.' });
      if(Object.keys(er).length){ T.ata = { vals:v, erros:er, geral:'Corrija os campos destacados.' }; PF.refresh(); return; }
      const x = PF.append('decisoes', { iniciativaId:v.iniciativaId, tipoDecisao:v.tipo, decisao:v.decisao, justificativa:v.justificativa, responsavel:v.papelRegistrante, papelRegistrante:v.papelRegistrante, instancia:v.instancia,
        recomendacao: v.tipo !== 'ESCALAR', forumId:'FR-OUT', tipoRitoForum:'ACOMPANHAMENTO_PORTFOLIO', decididoEm:hoje(), nivel:2 });
      T.ata = null; PF.toast(`[SIMULAÇÃO] ${esc(ANOME[v.tipo])} de <b>${esc(v.iniciativaId)}</b> registrado na ata (${esc(x.id)}).`); PF.refresh(); });
  }
  function abaFoto(d){
    const todas = fotos(d), fr = byId(d.foruns, 'FR-OUT') || {}, out = todas.filter(s => s.forumId === 'FR-OUT'), aberta = out.find(s => s.status === 'ABERTO'), fechada = out.filter(s => s.status === 'FECHADO').pop(), ultV = out.reduce((m, s) => Math.max(m, s.versao || 1), 0);
    const card = s => { const ind = s.indicadoresJson || {}, lock = T.fotoLock === s.id, fech = s.status === 'FECHADO';
      return `<div class="card stack" style="gap:10px"><div class="row"><b>${esc(s.id)}</b><span class="pf2-mini">${esc(s.forumId)} · v${s.versao || 1} · gerada para ${esc(fmt.date(s.geradoEm))}</span>${fech ? ui.pill('FECHADO', 'ok') : ui.pill('ABERTO', 'warn')}${s.simulacao ? '<b class="lime pf2-mini">[SIMULAÇÃO]</b>' : ''}${s.refSnapshotAnteriorId ? `<span class="pf2-mini">corrige ${esc(s.refSnapshotAnteriorId)}</span>` : ''}</div>
        ${kv(Object.keys(ROT_IND).map(k => [esc(ROT_IND[k]), `<span class="num">${fmtInd(k, ind[k])}</span>`]).concat([['Sinais', (s.iniciativasJson || []).map(x => `${esc(x.id)} ${pillS(x.sinal)}`).join(' ')], ['Decisões pendentes', esc((s.decisoesPendentesJson || []).join('; ') || '—')], ['Hash do conteúdo', s.hashConteudo ? `<code>${esc(s.hashConteudo)}</code>` : '<span class="pf2-mini">calculado ao fechar</span>'], ['Pesos', esc(s.versaoPesos || '—')]]))}
        ${lock ? ui.callout('atencao', `<p>${PF.msgHtml('SNAPSHOT_LOCKED')}</p><div class="row">${B('R06')}</div>`) : ''}
        <div class="row" data-noprint>${fech ? `<button class="btn btn-ghost btn-sm" data-foto-ed="${esc(s.id)}">${icon('edit', 13)} Editar</button>${s.forumId === 'FR-OUT' && (s.versao || 1) === ultV ? `<button class="btn btn-ghost btn-sm" data-foto-v2="${esc(s.id)}">${icon('plus', 13)} Corrigir: gerar nova versão</button>` : ''}`
          : `<button class="btn btn-ghost btn-sm" data-foto-regen="${esc(s.id)}">${icon('reset', 13)} Regenerar (ABERTO)</button><button class="btn btn-primary btn-sm" data-foto-fechar="${esc(s.id)}">${icon('lock', 13)} Fechar fotografia</button>`}</div></div>`; };
    return `<div class="stack">${aula('A <b>fotografia</b> congela o retrato do portfólio na data de corte do fórum. Enquanto está ABERTA pode ser regenerada; depois de FECHADA não muda mais (o hash do conteúdo prova isso). Erro numa fotografia fechada se corrige gerando uma nova versão, nunca editando a antiga. Imutabilidade simulada no navegador; a garantia real é do banco.')}
      <div class="card">${ui.section(`Fotografia de ${esc(fr.codigo || 'FR-OUT')}`, `Gerar (ABERTO) → revisar → FECHAR ${B('R06')}`)}<div class="row">${aberta ? `<span class="pf2-mini">Há uma fotografia ABERTA (${esc(aberta.id)}): revise e feche.</span>` : fechada ? `<span class="pf2-mini">A fotografia de FR-OUT já está FECHADA (${esc(fechada.id)}, v${fechada.versao || 1}). Para corrigir, use “Corrigir: gerar nova versão” no card dela.</span>` : `<button class="btn btn-primary btn-sm" data-foto-gerar>${icon('plus', 14)} Gerar fotografia de FR-OUT (ABERTO)</button>`}</div></div>
      <div class="grid g2">${todas.slice().reverse().map(card).join('')}</div></div>`;
  }
  function gerarFoto(d, ref){
    const fr = byId(d.foruns, 'FR-OUT') || {}, vs = fotos(d, 'FR-OUT'), v = vs.length ? Math.max(...vs.map(s => s.versao || 1)) + 1 : 1;
    const s = PF.append('snapshotsForum', Object.assign({ forumId:'FR-OUT', geradoEm: fr.dataCorte || C().ref(d), versao:v, status:'ABERTO', versaoPesos:versaoPesos(d), hashConteudo:null, refSnapshotAnteriorId: ref || null, nivel:2 }, C().conteudoFotografia(d)));
    PF.append('historico', { entidade:'snapshotsForum', entidadeId:s.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:s.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:`Fotografia FR-OUT v${v} gerada (ABERTO)${ref ? ' para corrigir ' + ref : ''}` });
    return s;
  }
  function bindFoto(host){
    host.addEventListener('click', e => { const d = PF.db(), t = e.target;
      if(t.closest('[data-foto-gerar]')){ if(fotos(d, 'FR-OUT').length){ PF.refresh(); return; } const s = gerarFoto(d); PF.toast(`[SIMULAÇÃO] Fotografia <b>${esc(s.id)}</b> gerada (ABERTO).`); PF.refresh(); return; }
      const ed = t.closest('[data-foto-ed]'); if(ed){ T.fotoLock = ed.dataset.fotoEd; PF.refresh(); return; }
      const v2 = t.closest('[data-foto-v2]'); if(v2){ if(fotos(d, 'FR-OUT').some(s => s.status === 'ABERTO')){ PF.toast('Feche a fotografia ABERTA antes de gerar outra versão.'); return; } const s = gerarFoto(d, v2.dataset.fotoV2); T.fotoLock = null; PF.toast(`[SIMULAÇÃO] Nova versão <b>v${s.versao}</b> gerada (ABERTO).`); PF.refresh(); return; }
      const rg = t.closest('[data-foto-regen]'); if(rg){ const s = byId(d.snapshotsForum, rg.dataset.fotoRegen); if(!s || s.status === 'FECHADO'){ T.fotoLock = rg.dataset.fotoRegen; PF.refresh(); return; }
        const r = PF.write('snapshotsForum', s.id, C().conteudoFotografia(d), { justificativa:'Fotografia ABERTA regenerada com o estado atual' }); PF.toast(r.ok ? 'Fotografia regenerada com o estado atual.' : esc((r.errors[0] || {}).msg || 'Falhou.')); PF.refresh(); return; }
      const fc = t.closest('[data-foto-fechar]'); if(fc){ const id = fc.dataset.fotoFechar;
        PF.confirm('Fechar a fotografia?', 'Depois de FECHADA ela não muda mais: correções viram uma nova versão. O hash do conteúdo é calculado agora.', 'Fechar', () => { const dd = PF.db(), s = byId(dd.snapshotsForum, id);
          if(!s || s.status === 'FECHADO'){ PF.toast(PF.msgHtml('SNAPSHOT_LOCKED')); return; }
          const r = PF.write('snapshotsForum', id, { status:'FECHADO', hashConteudo:conteudoHash(s), fechadoEm:hoje() }, { justificativa:'Fotografia fechada no fórum simulado' });
          if(r.ok){ PF.award('m-fotografia', 'Fórum fechado'); PF.toast(`[SIMULAÇÃO] Fotografia <b>${esc(id)}</b> FECHADA.`); } PF.refresh(); }); } });
  }

  /* ================================================================== DASHBOARD (aba "Ciclo Exemplo 2027 (N2)") */
  const dash = (o) => PF.registerDash(Object.assign({ nivel:2 }, o));
  dash({ id:'n2-demanda', ordem:10, titulo:'Demanda × oferta', sub:'Candidatas do Ciclo Exemplo 2027 (portfólio inteiro)', largura:'meia', render(d){ const u = C().utilizacaoDemanda(d);
    return `<div class="row" style="justify-content:space-around">${CH.gauge(u.pctFte, { max:2, display:pc(u.pctFte), label:'FTE', tone:u.pctFte > 1 ? 'bad' : 'lime' })}${CH.gauge(u.pctCusto, { max:2, display:pc(u.pctCusto), label:'R$', tone:u.pctCusto > 1 ? 'bad' : 'lime' })}</div>
      ${kv([['Demanda', `${n1(u.fte)} FTE · ${mi(u.custo)}`], ['Oferta', `${n1(u.cap)} FTE · ${mi(u.orc, 1)} ${B('R24')}`], ['Faixa', `${esc((u.faixa || {}).acao || '—')} ${B('R26')}`]])}`; } });
  dash({ id:'n2-disc', ordem:20, titulo:'Capacidade discricionária', sub:'Depois das obrigatórias', largura:'meia', render(d){ const x = C().discricionaria(d);
    return `<div class="grid g2">${ui.kpi({ label:'FTE livres', value:n1(x.fte), sub:'capacidade − obrigatórias' })}${ui.kpi({ label:'R$ mi livres', value:n2(x.custo), sub:'orçamento − obrigatórias' })}</div><p class="pf2-mini" style="margin:8px 0 0">Obrigatórias: ${esc(x.obrigatorias.join(', ') || '—')} ${B('R12')} ${B('R24')}</p>`; } });
  dash({ id:'n2-prop', ordem:30, titulo:'Proposta salva', sub:'Última proposta do assistente de seleção', largura:'meia', render(d){ const ps = MS().propostas || [], p = ps[ps.length - 1];
    return p ? `${kv([['Versão · método', `v${p.versao} · ${esc(p.nome)}`], ['Carteira', esc(p.ids.join(', '))], ['Valor ΣN', `<b class="num">${n2(p.valor)}</b> ${B('R21')}`], ['Eficiência (÷ ótimo)', pc(p.eficiencia)], ['Ociosidade', n1(p.ociosidade) + ' FTE'], ['D (mix)', `${pp(p.D)} ${B('R28')}`]])}<p class="pf2-mini" style="margin:6px 0 0">[SIMULAÇÃO] Pesos ${esc(p.versaoPesos)}</p>`
      : `<p class="muted">Nenhuma proposta salva ainda.</p><a class="pf2-a btn btn-ghost btn-sm" href="#/n2/selecao?aba=3">${icon('scale', 14)} Abrir Capacidade & Seleção</a>`; } });
  dash({ id:'n2-evm', ordem:40, titulo:'CPI e SPI do portfólio', sub:'Iniciativas em execução (respeita o filtro de gerência)', largura:'meia', render(d, ger){ const c = C(), A = c.emExecucao(d).filter(i => !ger || i.gerenciaId === ger), p = c.evmPortfolio(d, A), L = c.param(d, 'R29');
    if(!A.length) return `<p class="muted">Nenhuma iniciativa em execução na gerência ${esc(ger)}.</p>`;
    return `<div class="grid g2">${ui.kpi({ label:'CPI', value:p.cpi == null ? 'n/d' : n2(p.cpi), sub:`ΣEV ${n2(p.ev)} ÷ ΣAC ${n2(p.ac)}`, tone:p.cpi != null && p.cpi < L.indice ? 'bad' : '' })}${ui.kpi({ label:'SPI', value:p.spi == null ? 'n/d' : n2(p.spi), sub:`fora: ${esc(p.foraSpi.join(', ') || '—')}`, tone:p.spi != null && p.spi < L.indice ? 'bad' : '' })}</div><p class="pf2-mini" style="margin:8px 0 0">${A.length} em execução${ger ? ' na ' + esc(ger) : ''} · limiar ${n2(L.indice)} ${B('R29')} ${B('R30')}</p>`; } });
  dash({ id:'n2-mudou', ordem:50, titulo:'O que mudou desde set/2026', sub:'Diferença para a fotografia FECHADA SN-SET', largura:'meia', render(d){ const c = C(), b = c.ultimaFotografiaFechada(d, 'FR-SET'); if(!b) return '<p class="muted">Sem fotografia FECHADA de setembro.</p>';
    const df = c.diffFotografia(b, c.conteudoFotografia(d)), mud = df.indicadores.filter(x => x.mudou);
    return `<p style="margin:0 0 8px">Pioraram: ${df.pioraram.length ? df.iniciativas.filter(x => x.piorou).map(x => `<b>${esc(x.id)}</b> ${pillS(x.antes)} → ${pillS(x.depois)}`).join(' · ') : '<b>nenhuma</b>'}</p>${kv(mud.map(x => [esc(ROT_IND[x.chave] || x.chave), `${fmtInd(x.chave, x.antes)} → <b>${fmtInd(x.chave, x.depois)}</b> (${fmtDelta(x.chave, x.delta)})`]))}<div class="row" style="margin-top:6px">${B('R13')}<a class="btn-text" href="#/n2/forum?aba=mudou">detalhes →</a></div>`; } });
  dash({ id:'n2-pauta', ordem:60, titulo:'Próxima pauta (FR-OUT)', sub:'Itens por exceção', largura:'meia', render(d){ const p = pauta(d);
    return `<div class="row" style="align-items:flex-end;gap:16px"><div class="num" style="font-family:var(--display);font-size:46px;font-weight:300;line-height:1">${p.total}</div><span class="muted">itens em 5 seções</span></div>${kv(p.secoes.map(s => [`${s.n} · ${esc(s.titulo)}`, `<span class="num">${s.itens.length}</span>`]))}<a class="btn-text" href="#/n2/forum?aba=pauta">abrir pauta →</a>`; } });

  /* ================================================================== INDICADORES I2.x (§6.5) */
  const K = o => PF.registerKpi(Object.assign({ nivel:2 }, o));
  const rowsOf = d => C().linhasCandidatas(d), top = (rows, f, n = 2, c = 2, desc = true) => rows.filter(r => f(r) != null).slice().sort((a, b) => desc ? f(b) - f(a) : f(a) - f(b)).slice(0, n).map(r => `${r.id} ${fmt.n(f(r), c)}`).join(' · ');
  const met = d => C().metodos(d, { rows:rowsOf(d) }), MNOME = { corte:'Linha de corte', guloso:'Guloso', otimo:'Ótimo exato' };
  K({ id:'I2.1', nome:'Score (S) das candidatas', unidade:'1–5', regra:['R20','R21'], valor:d => rowsOf(d), fmt:v => top(v, r => r.S), formula:'S = Σ wⱼ·Cⱼ (avaliação vigente; pesos vigentes)',
    conta:d => { const w = C().pesosEfetivos(d), r = rowsOf(d).find(x => x.id === 'P06') || rowsOf(d)[0]; return `${esc(r.id)}: ${Object.keys(w).map(k => `${fmt.n(w[k], 2)}×${r.notas[k]}`).join(' + ')} = <b>${n2(r.S)}</b>`; },
    interpretacao:'Soma ponderada das notas de 1 a 5. Serve para ordenar, não para dizer “quantas vezes melhor”.', armadilha:'Pesos a validar: mudar um peso muda a ordem. Toda decisão grava a versão dos pesos usada.' });
  K({ id:'I2.2', nome:'Valor normalizado (N)', unidade:'0–100', essencial:true, regra:'R21', valor:d => rowsOf(d), fmt:v => top(v, r => r.N), formula:'N = (S − 1) ÷ 4 × 100',
    conta:d => { const r = rowsOf(d).find(x => x.id === 'P06') || rowsOf(d)[0]; return `${esc(r.id)}: (${n2(r.S)} − 1) ÷ 4 × 100 = <b>${n2(r.N)}</b>`; }, interpretacao:'Põe o score de 0 a 100 para somar valor de carteiras.', armadilha:'A escala continua ordinal: N 70 não vale “1,5 vez” N 46.' });
  K({ id:'I2.3', nome:'Valor por FTE', unidade:'pts/FTE', regra:'R21', valor:d => rowsOf(d), fmt:v => top(v, r => r.nFte), formula:'N ÷ fte(i)', conta:d => rowsOf(d).slice().sort((a, b) => b.nFte - a.nFte).map(r => `${esc(r.id)} ${n2(r.N)} ÷ ${n1(r.fte)} = <b>${n2(r.nFte)}</b>`).join('<br>'),
    interpretacao:'Quanto valor cada FTE compra. É a régua do método guloso.', armadilha:'Olhar só a razão ignora o tamanho: uma candidata pequena e eficiente pode deixar FTE ocioso.' });
  K({ id:'I2.4', nome:'Valor por R$', unidade:'pts/R$ mi', regra:'R21', valor:d => rowsOf(d), fmt:v => top(v, r => r.nCusto, 2, 1), formula:'N ÷ custo(i) do ciclo', conta:d => rowsOf(d).slice().sort((a, b) => b.nCusto - a.nCusto).map(r => `${esc(r.id)} ${n2(r.N)} ÷ ${n2(r.custo)} = <b>${n1(r.nCusto)}</b>`).join('<br>'),
    interpretacao:'Quanto valor cada R$ 1 mi compra.', armadilha:'Custo é estimativa de ordem de grandeza (ilustrativa).' });
  K({ id:'I2.5', nome:'Utilização da demanda', unidade:'%', essencial:true, regra:['R24','R26'], valor:d => C().utilizacaoDemanda(d), fmt:u => `${pc(u.pctFte)} FTE · ${pc(u.pctCusto)} R$`, formula:'Σfte(C) ÷ capacidade; Σcusto(C) ÷ orçamento',
    conta:d => { const u = C().utilizacaoDemanda(d); return `${n1(u.fte)} ÷ ${n1(u.cap)} = <b>${pc(u.pctFte)}</b> · ${n2(u.custo)} ÷ ${n2(u.orc)} = <b>${pc(u.pctCusto)}</b> → ${esc((u.faixa || {}).acao || '')}`; },
    interpretacao:'Acima de 100% não cabe tudo: é preciso escolher. A faixa da matriz decisória (s165) é proposta a validar.', armadilha:'Linhas em horas ficam fora da soma em FTE (o app não converte).' });
  K({ id:'I2.6', nome:'Capacidade discricionária', unidade:'FTE', essencial:true, regra:['R24','R12'], valor:d => C().discricionaria(d), fmt:x => `${n1(x.fte)} FTE · ${mi(x.custo, 1)}`, formula:'cap − Σfte(obrigatórias); orç − Σcusto(obrigatórias)',
    conta:d => { const c = C(), x = c.discricionaria(d), ob = rowsOf(d).filter(r => r.obrigatoria); return `${n1(c.capacidadeTotal(d))} − ${ob.map(r => n1(r.fte)).join(' − ')} = <b>${n1(x.fte)} FTE</b> · ${n2(c.orcamentoCiclo(d))} − ${ob.map(r => n2(r.custo)).join(' − ')} = <b>${mi(x.custo)}</b>`; },
    interpretacao:'É o que sobra para as candidatas que competem por mérito.', armadilha:'O que conta como obrigatória (e com que evidência) está a validar.' });
  K({ id:'I2.7', nome:'Ociosidade por método', unidade:'FTE', regra:'R24', valor:d => met(d), fmt:M => `corte ${n1(M.corte.ociosidade)} · guloso ${n1(M.guloso.ociosidade)} · ótimo ${n1(M.otimo.ociosidade)}`, formula:'cap − Σfte(selecionadas)',
    conta:d => { const M = met(d); return ['corte', 'guloso', 'otimo'].map(k => `${MNOME[k]}: ${n1(M[k].cap)} − ${n1(M[k].fte)} = <b>${n1(M[k].ociosidade)}</b>`).join('<br>'); }, interpretacao:'FTE que ficam sem uso na carteira escolhida.', armadilha:'Ociosidade zero não garante o melhor valor.' });
  K({ id:'I2.8', nome:'Valor da carteira por método', unidade:'pts', essencial:true, regra:['R21','R23'], valor:d => met(d), fmt:M => `corte ${n2(M.corte.valor)} · guloso ${n2(M.guloso.valor)} · ótimo ${n2(M.otimo.valor)}`, formula:'ΣN(selecionadas)',
    conta:d => { const M = met(d), rows = rowsOf(d); return ['corte', 'guloso', 'otimo'].map(k => `${MNOME[k]} (${M[k].ids.join(', ')}): ${M[k].ids.map(id => n2((rows.find(r => r.id === id) || {}).N)).join(' + ')} = <b>${n2(M[k].valor)}</b>`).join('<br>'); },
    interpretacao:'O ótimo exato testa todas as combinações que cabem e fica com a de maior valor.', armadilha:'Valor alto com mix desequilibrado pode não ser defensável (veja o índice D).' });
  K({ id:'I2.9', nome:'Eficiência dos métodos', unidade:'%', regra:'R21', valor:d => met(d), fmt:M => `corte ${pc(M.corte.eficiencia)} · guloso ${pc(M.guloso.eficiencia)} · ótimo 100%`, formula:'V ÷ V* (mesmas restrições)',
    conta:d => { const M = met(d); return `corte ${n2(M.corte.valor)} ÷ ${n2(M.otimo.valor)} = <b>${pc(M.corte.eficiencia)}</b> · guloso ${n2(M.guloso.valor)} ÷ ${n2(M.otimo.valor)} = <b>${pc(M.guloso.eficiencia)}</b>`; }, interpretacao:'Quanto do melhor valor possível cada método captura.', armadilha:'Com outra capacidade (8 FTE) a ordem entre corte e guloso se inverte.' });
  K({ id:'I2.10', nome:'Risco de execução (R)', unidade:'1–25', regra:'R22', valor:d => rowsOf(d), fmt:v => top(v, r => r.R, 2, 0), formula:'R = P × I (maior risco aberto da candidata)', conta:d => rowsOf(d).slice().sort((a, b) => b.R - a.R).map(r => `${esc(r.id)} ${r.P ?? '—'} × ${r.I ?? '—'} = <b>${r.R}</b>${r.acao ? '' : ' (sem mitigação)'}`).join('<br>'),
    interpretacao:'R ≥ 12 é risco alto; R ≥ 15 é crítico (limiares a validar).', armadilha:'Risco de execução não é redução de risco (C4). E C5 × P×I pode contar duas vezes.' });
  K({ id:'I2.11', nome:'Exposição ponderada a risco', unidade:'1–25', regra:'R22', valor:d => { const r = rowsOf(d); return { cand:C().exposicao(r, r.map(x => x.id)), ot:met(d).otimo.exposicao }; }, fmt:v => `candidatas ${n2(v.cand)} · ótimo ${n2(v.ot)}`, formula:'ΣR·custo ÷ Σcusto',
    conta:d => { const r = rowsOf(d); return `(${r.map(x => `${x.R}×${n2(x.custo)}`).join(' + ')}) ÷ ${n2(soma(r, x => x.custo))} = <b>${n2(C().exposicao(r, r.map(x => x.id)))}</b>`; }, interpretacao:'Risco médio pesado pelo dinheiro em jogo.', armadilha:'Média esconde a cauda: olhe também o % em risco crítico.' });
  K({ id:'I2.12', nome:'% do custo em risco crítico', unidade:'%', regra:'R22', valor:d => { const r = rowsOf(d); return { cand:C().pctCustoCritico(d, r, r.map(x => x.id)), ot:met(d).otimo.pctCritico }; }, fmt:v => `candidatas ${pc(v.cand)} · ótimo ${pc(v.ot)}`, formula:'Σcusto(R ≥ 15) ÷ Σcusto',
    conta:d => { const r = rowsOf(d), L = C().param(d, 'R22'), k = r.filter(x => x.R >= L.riscoCritico); return `(${k.map(x => `${x.id} ${n2(x.custo)}`).join(' + ')}) ÷ ${n2(soma(r, x => x.custo))} = <b>${pc(C().pctCustoCritico(d, r, r.map(x => x.id)))}</b>`; }, interpretacao:'Quanto do orçamento está em candidatas com risco crítico.', armadilha:'O limiar de 15 está a validar.' });
  K({ id:'I2.13', nome:'Desbalanceamento do mix (D)', unidade:'pp', essencial:true, regra:'R28', valor:d => met(d), fmt:M => `ótimo ${pp(M.otimo.D)} · corte ${pp(M.corte.D)} · guloso ${pp(M.guloso.D)}`, formula:'D = ½ Σₖ |custoₖ ÷ custo_disc − alvoₖ| (só parcela discricionária)',
    conta:d => { const M = met(d), a = C().param(d, 'R28').alvo, m = M.otimo.mix || {}; return `ótimo: ½ × (${Object.keys(a).map(k => `|${pc(m[k] || 0)} − ${pc(a[k], 0)}|`).join(' + ')}) = <b>${pp(M.otimo.D)}</b>`; },
    interpretacao:'0 = mix igual ao alvo. Acima da tolerância (15 pp), a carteira deixa uma categoria de lado.', armadilha:'O ótimo em valor zera a Sustentação: valor e equilíbrio são objetivos diferentes.', motivo:'D fica n/d quando o custo discricionário é zero.' });
  K({ id:'I2.14', nome:'Faixa da proposta (agregada)', unidade:'%', regra:'R26', valor:d => met(d), fmt:M => `corte ${pc(M.corte.u, 0)} · guloso ${pc(M.guloso.u, 0)} · ótimo ${pc(M.otimo.u, 0)}`, formula:'Σfte(sel) ÷ cap → faixa R26',
    conta:d => { const M = met(d); return ['corte', 'guloso', 'otimo'].map(k => `${MNOME[k]}: ${n1(M[k].fte)} ÷ ${n1(M[k].cap)} = <b>${pc(M[k].u, 0)}</b> → ${esc((M[k].faixa || {}).acao || '')}`).join('<br>'); }, interpretacao:'Onde a proposta cai na matriz decisória do deck (s165).', armadilha:'É faixa agregada: a utilização por gerência fica no Nível 3.' });
  K({ id:'I2.15', nome:'EVM por iniciativa', unidade:'índice', regra:['R30','R29'], valor:d => C().emExecucao(d).map(i => C().evm(d, i)), fmt:v => { const m = v.filter(e => e.cpi != null).sort((a, b) => a.cpi - b.cpi)[0]; return m ? `menor CPI: ${m.id} ${n2(m.cpi)}` : 'n/d'; },
    formula:'EV = físico·BAC; PV = planejado·BAC; SPI = EV/PV; CPI = EV/AC; EAC = BAC/CPI', conta:d => C().emExecucao(d).map(i => { const e = C().evm(d, i); return `${esc(e.id)}: CPI ${n2(e.ev)} ÷ ${n2(e.ac)} = <b>${n2(e.cpi)}</b> · SPI ${e.spi == null ? 'n/d' : n2(e.spi)} · EAC ${n2(e.eac)}`; }).join('<br>'),
    interpretacao:'CPI e SPI abaixo de 0,85 pedem atenção (limiar a validar).', armadilha:'Sem baseline (E06) não há PV nem SPI.', convencao:'R$ mi; previsão = previsão no término (R37).' });
  K({ id:'I2.16', nome:'CPI e SPI do portfólio', unidade:'índice', essencial:true, regra:['R30','R29'], valor:d => C().evmPortfolio(d), fmt:p => `CPI ${n2(p.cpi)} · SPI ${n2(p.spi)}`, formula:'CPI = ΣEV ÷ ΣAC; SPI = ΣEV ÷ ΣPV (só com baseline)',
    conta:d => { const p = C().evmPortfolio(d); return `CPI = ${n2(p.ev)} ÷ ${n2(p.ac)} = <b>${n2(p.cpi)}</b> · SPI = ${n2(p.evSpi)} ÷ ${n2(p.pv)} = <b>${n2(p.spi)}</b> (fora: ${esc(p.foraSpi.join(', ') || '—')})`; },
    interpretacao:'Agregado do que está em execução: R$ 1 gasto gerou R$ 0,80 de valor.', armadilha:'Duas vermelhas (E02, E05) puxam o índice; o agregado esconde quem.' });
  K({ id:'I2.17', nome:'EAC × previsão declarada', unidade:'R$ mi', regra:['R37','R30'], valor:d => C().emExecucao(d).map(i => C().evm(d, i)).filter(e => e.eacMenosPrevisao != null && e.eacMenosPrevisao > EPS), fmt:v => v.length ? v.map(e => `${e.id} ${sn(e.eacMenosPrevisao)}`).join(' · ') : 'nenhuma acima',
    formula:'EAC − financeiro.previsao', conta:d => C().emExecucao(d).map(i => C().evm(d, i)).filter(e => e.eacMenosPrevisao != null).map(e => `${esc(e.id)}: ${n2(e.eac)} − ${n2(e.previsao)} = <b>${sn(e.eacMenosPrevisao)}</b>`).join('<br>'),
    interpretacao:'Quando o custo final previsto pelo desempenho passa a previsão declarada, há informação para o fórum.', armadilha:'A previsão é declaração do responsável; a diferença é informação, não erro a esconder.' });
  K({ id:'I2.18', nome:'O que mudou desde a última fotografia', unidade:'—', regra:['R06','R13'], valor:d => { const c = C(), b = c.ultimaFotografiaFechada(d, 'FR-SET'); return b ? c.diffFotografia(b, c.conteudoFotografia(d)) : null; },
    fmt:x => `${x.pioraram.length} piorou (${x.pioraram.join(', ') || '—'})`, formula:'diff(fotografia FECHADA SN-SET, estado atual) pela mesma função', motivo:'Sem fotografia FECHADA de setembro para comparar.',
    conta:d => { const c = C(), b = c.ultimaFotografiaFechada(d, 'FR-SET'); if(!b) return 'n/d'; return c.diffFotografia(b, c.conteudoFotografia(d)).indicadores.filter(x => x.mudou).map(x => `${esc(ROT_IND[x.chave] || x.chave)}: ${fmtInd(x.chave, x.antes)} → <b>${fmtInd(x.chave, x.depois)}</b>`).join('<br>'); },
    interpretacao:'O fórum vê o que piorou desde a reunião anterior.', armadilha:'E02 piorou no calculado enquanto o declarado foi de Amarelo para Verde.' });
  K({ id:'I2.19', nome:'Decisões por tipo', unidade:'nº', regra:'R18', valor:d => C().decisoesPorTipo(d), fmt:x => `${x.total} registros · KILL ${pc(x.taxaKill, 0)}`, formula:'count por tipoDecisao; taxa de KILL',
    conta:d => Object.entries(C().decisoesPorTipo(d).contagem).map(([k, n]) => `${esc(k)}: <b>${n}</b>`).join(' · '), interpretacao:'Mostra o que o portfólio tem decidido (sementes + exercício).', armadilha:'Taxa de KILL baixa demais pode indicar que nada é encerrado.' });
  K({ id:'I2.20', nome:'WIP (em execução)', unidade:'nº', regra:'R30', valor:d => C().emExecucao(d).length, fmt:v => String(v), formula:'contagem de iniciativas na fase “Em execução”', conta:d => `${esc(C().emExecucao(d).map(i => i.id).join(', '))} = <b>${C().emExecucao(d).length}</b>`,
    interpretacao:'Mais iniciativas em paralelo com a mesma capacidade tendem a aumentar o prazo médio.', armadilha:'WIP alto parece produtividade, mas troca de contexto custa.' });

  /* ================================================================== ABAS DA FICHA (N2) */
  PF.registerFichaTab({ id:'n2-aval', nivel:2, titulo:'Avaliação & Risco', ordem:60, render(ini, d){
    const c = C(), w = c.pesosEfetivos(d), avs = (d.avaliacoes || []).filter(a => a.iniciativaId === ini.id).slice().sort((a, b) => String(a.registradoEm).localeCompare(String(b.registradoEm))), vig = c.avaliacaoVigente(d, ini.id);
    const r = c.linhasCandidatas(d).find(x => x.id === ini.id), rs = (d.riscosImpedimentos || []).filter(x => x.iniciativaId === ini.id), L = c.param(d, 'R22');
    let h = `<div class="pf2-blk"><h4>Linha do tempo das avaliações ${B('R06')}</h4>` + (avs.length ? `<div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Data</th>${Object.keys(w).map(k => `<th class="c">${k}</th>`).join('')}<th class="r">S</th><th class="r">N</th><th>Pesos</th><th>Registro</th></tr></thead><tbody>
      ${avs.map(a => { const S = c.score(a.notasCriterios, w); return `<tr><td>${esc(fmt.date(String(a.registradoEm).slice(0, 10)))}${a === vig ? ' ' + ui.pill('vigente', 'ok') : ''}</td>${Object.keys(w).map(k => `<td class="c num">${(a.notasCriterios || {})[k] ?? '—'}</td>`).join('')}<td class="r num">${n2(S)}</td><td class="r num">${n2(c.normalizar(d, S))}</td><td>${esc(a.versaoPesos || '—')}</td><td class="wrap pf2-mini">${a.simulacao ? '[SIMULAÇÃO] ' : ''}${esc(a.registradoPor || a.usuarioId || '')}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">Sem avaliação registrada: só as candidatas do ciclo são pontuadas.</p>') + '</div>';
    if(r) h += `<div class="pf2-blk" style="margin-top:12px"><h4>Matrizes ${B('R22')}</h4>${kv([['Valor × esforço', `${esc(QV(d, 'VE', r.qVE))} (N ${n2(r.N)}; FTE ${n1(r.fte)})`], ['Valor × risco', `${esc(QV(d, 'VR', r.qVR))} (R ${r.R})`]])}</div>`;
    h += `<div class="pf2-blk" style="margin-top:12px"><h4>Riscos e impedimentos ${B('R09')}</h4>` + (rs.length ? `<div class="tbl-wrap"><table class="tbl pf2-tbl"><thead><tr><th>Id</th><th>Natureza</th><th>Descrição</th><th class="r">P×I</th><th>Mitigação</th><th>Status</th></tr></thead><tbody>${rs.map(x => { const R = x.probabilidade != null && x.impactoNota != null ? x.probabilidade * x.impactoNota : null;
      return `<tr><td>${esc(x.id)}</td><td>${esc(x.natureza)}</td><td class="wrap">${esc(x.descricao)}</td><td class="r num ${R != null && R >= L.riscoCritico ? 'tone-bad' : ''}">${R == null ? '—' : `${x.probabilidade}×${x.impactoNota} = ${R}`}</td><td class="wrap">${x.acao ? esc(x.acao) : '<span class="tone-warn">vazia</span>'}</td><td>${esc(x.status || '(vazio = aberto)')}${c.riscoAberto(d, x) ? '' : '<small>fechado</small>'}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">Nenhum risco ou impedimento registrado.</p>') + '</div>';
    return h; } });
  PF.registerFichaTab({ id:'n2-cap', nivel:2, titulo:'Capacidade, Custo & EVM', ordem:70, render(ini, d){
    const c = C(), dc = (d.demandasCapacidade || []).filter(x => x.iniciativaId === ini.id), r = c.linhasCandidatas(d).find(x => x.id === ini.id), L = c.param(d, 'R29');
    let h = `<div class="pf2-blk"><h4>Demanda de capacidade ${B('R24')}</h4>` + (dc.length ? `<ul class="muted" style="margin:0;padding-left:18px">${dc.map(x => `<li>${fmt.n(x.capacidadeRequerida, x.capacidadeRequerida % 1 ? 1 : 0)} ${esc(String(x.unidade || '').toLowerCase())} · ${esc(fmt.date(x.periodo))} · ${esc(x.fonte || '')}${String(x.unidade).toUpperCase() !== 'FTE' ? ' · ' + PF.msgHtml('INCOMPATIBLE_UNIT') : ''}</li>`).join('')}</ul>` : '<p class="muted">Sem estimativa de capacidade no ciclo.</p>') + '</div>';
    if(r) h += `<div class="pf2-blk" style="margin-top:12px"><h4>Custo e valor no ciclo ${B('R21')}</h4>${kv([['FTE · custo', `${n1(r.fte)} FTE · ${mi(r.custo)}`], ['N · N/FTE · N/R$', `${n2(r.N)} · ${n2(r.nFte)} · ${n1(r.nCusto)}`], ['Na carteira ótima?', met(d).otimo.ids.includes(r.id) ? 'sim' : 'não']])}</div>`;
    if(ini.statusId === 'EM_EXECUCAO'){ const e = c.evm(d, ini); h += `<div class="pf2-blk" style="margin-top:12px"><h4>EVM (R$ mi) ${B('R30')} ${B('R29')}</h4>${kv([['BAC · PV · EV · AC', `<span class="num">${n2(e.bac)} · ${e.pv == null ? 'n/d' : n2(e.pv)} · ${n2(e.ev)} · ${n2(e.ac)}</span>`], ['SPI · CPI', `<span class="num ${e.spi != null && e.spi < L.indice ? 'tone-bad' : ''}">${e.spi == null ? 'n/d (sem PV)' : n2(e.spi)}</span> · <span class="num ${e.cpi != null && e.cpi < L.indice ? 'tone-bad' : ''}">${n2(e.cpi)}</span>`], ['EAC × previsão declarada', `${n2(e.eac)} × ${n2(e.previsao)} (${sn(e.eacMenosPrevisao)})`]])}</div>`; }
    else if(!r) h += '<p class="muted" style="margin-top:12px">EVM só para iniciativas em execução.</p>';
    return h; } });

  /* ================================================================== GLOSSÁRIO N2 (§8.3; FTE/HC e fotografia já estão no §1.5) */
  PF.registerGlossario(2, [
    ['Critério', 'Aspecto usado para comparar candidatas (C1–C5 no app; a validar).', 'R19'], ['Rubrica', 'Âncora observável de cada nota de 1 a 5, para o mesmo “4” valer o mesmo entre avaliadoras.', 'R19'],
    ['Peso', 'Quanto cada critério importa no score. Versionado e a validar.', 'R20'], ['Score (S)', 'Soma ponderada das notas: S = Σ peso × nota.', 'R20'], ['Normalização (N)', 'N = (S − 1) ÷ 4 × 100: o score de 0 a 100.', 'R21'],
    ['Escala ordinal', 'Diz a ordem, não proporções: N 70 não vale “1,5 vez” N 46.', 'R21'], ['Must-meet / should-meet', 'Eliminatório (precisa cumprir) / classificatório (quanto mais, melhor). O eliminatório vem antes.', 'R17'],
    ['Quadrantes', 'Classificação em duas dimensões (valor × esforço; valor × risco) por limiares a validar.', 'R22'], ['Bolha de Cooper', 'Matriz valor × risco: pérola, ostra, pão com manteiga, elefante branco. Ref. de mercado.', 'R22'],
    ['Capacidade discricionária', 'Capacidade que sobra depois das obrigatórias.', 'R24'], ['Mochila', 'Problema de escolher itens de maior valor sob limite de recursos.', 'R30'], ['Linha de corte', 'Segue o ranking e para no primeiro que não cabe.', 'R23'],
    ['Guloso', 'Escolhe primeiro quem rende mais valor por FTE, pulando quem não cabe.', 'R21'], ['Ótimo exato', 'Testa todas as combinações que cabem e fica com a de maior valor.', 'R23'], ['Índice D', 'Desbalanceamento do mix: ½ Σ |real − alvo| na parcela discricionária.', 'R28'],
    ['PV', 'Valor planejado: % físico planejado × BAC.', 'R30'], ['EV', 'Valor agregado: % físico real × BAC.', 'R30'], ['SPI', 'EV ÷ PV: quanto do planejado foi feito.', 'R29'], ['CPI', 'EV ÷ AC: quanto valor cada R$ 1 gerou.', 'R29'],
    ['EAC', 'BAC ÷ CPI: custo final previsto se nada mudar. VAC e TCPI ficam como aprofundamento.', 'R30'], ['Go / Go condicionado / Hold / Recycle / Kill', 'Saídas de gate (Stage-Gate, ref. de mercado): seguir, seguir com condições, pausar com gatilho, refazer menor, encerrar.', 'R18'],
    ['Escalonamento', 'Levar um impedimento ou conflito a quem decide, com opções e números.', 'R05a'], ['WIP', 'Trabalho em andamento: iniciativas em execução ao mesmo tempo.', 'R30'], ['RACI', 'Quem executa (R), responde (A), é consultado (C) e informado (I). No app, reconstruída e a conferir.', 'R38'],
  ].map(([termo, def, regra]) => ({ termo, def, regra, fonte:'§8.3' })));

  /* ================================================================== DESAFIO (§6.7) */
  const FOR_SET = () => (byId(PF.base.foruns, 'FR-SET') || {}).dataCorte || '2026-09-04';
  function gabaritoDesafio(){
    const c = C(), b = PF.base, M8 = c.metodos(b, { rows:c.linhasCandidatas(b), cap:8 }), alvo = c.param(b, 'R28').alvo, mix = M8.otimo.mix || {};
    const e = c.evm(c.estadoEm(b, FOR_SET()), 'E02');
    return { M8, D:M8.otimo.D, zeradas: Object.keys(alvo).filter(k => !(mix[k] > EPS)).sort(), cpi:e.cpi, eac:e.eac };
  }
  function conferirDesafio(){
    const c = C(), s = MS(), x = s.des || {}, g = gabaritoDesafio(), num = v => { const n = Number(String(v ?? '').replace(',', '.')); return String(v ?? '').trim() === '' || !Number.isFinite(n) ? null : n; }, near = (v, a, t) => v != null && a != null && Math.abs(v - a) <= t + EPS;
    const p1 = c.conferirCegas(PF.base, s.cegas || {}), cg = CEGAS.every(id => s.cegas && s.cegas[id] && Object.keys(s.cegas[id]).length === 5);
    const p2 = c.conferirQuadrantes(PF.base, x.classif || {}, 'VE');
    const p3 = x.p3 || {}, r3 = ['corte', 'guloso', 'otimo'].map(k => ({ k, v: near(num(p3[k + 'V']), g.M8[k].valor, 0.5), o: near(num(p3[k + 'O']), g.M8[k].ociosidade, 0.1) }));
    const p4 = x.p4 || {}, ok4d = near(num(p4.D), g.D * 100, 1), ok4z = (p4.zeradas || []).slice().sort().join() === g.zeradas.join();
    const p5 = x.p5 || {}, ok5 = [near(num(p5.cpi), g.cpi, 0.02), near(num(p5.eac), g.eac, 0.02), String(p5.coment || '').trim().length >= 20];
    const d = PF.db(), gs = gatesN2(d).filter(z => z.simulacao), val = gs.filter(recValida);
    const t6 = { go: val.some(z => z.tipoDecisao === 'GO'), hr: val.some(z => ['HOLD', 'RECYCLE'].includes(z.tipoDecisao) && !vazio(z.proximaRevisao)), gc: val.some(z => z.tipoDecisao === 'GO_CONDICIONADO' && !vazio(z.condicionantes)) };
    const vig = c.decisoesVigentes(d), foto = (d.snapshotsForum || []).find(z => z.forumId === 'FR-OUT' && z.status === 'FECHADO' && !vazio(z.hashConteudo)), escE05 = vig.find(z => z.tipoDecisao === 'ESCALAR' && z.iniciativaId === 'E05' && !vazio(z.instancia) && z.instancia !== z.papelRegistrante);
    const passos = [
      { n:1, ok: cg && p1.ok, txt: cg ? `${p1.notasOk} de ${p1.totalNotas} notas a ±1; S a ±0,30: ${CEGAS.map(id => id + (p1.sOk[id] ? ' ✓' : ' ✗')).join(', ')}` : 'Preencha as 15 notas (P03, P05 e P06).' },
      { n:2, ok: p2.ok, txt: `${p2.corretos} de ${p2.total} classificações corretas (mínimo ${p2.total - 1}).` },
      { n:3, ok: r3.every(z => z.v && z.o), txt: r3.map(z => `${({ corte:'corte', guloso:'guloso', otimo:'ótimo' })[z.k]}: valor ${z.v ? '✓' : '✗'} · ociosidade ${z.o ? '✓' : '✗'}`).join(' | ') },
      { n:4, ok: ok4d && ok4z, txt: `D ${ok4d ? '✓' : '✗'} · categorias zeradas ${ok4z ? '✓' : '✗'}` },
      { n:5, ok: ok5.every(Boolean), txt: `CPI ${ok5[0] ? '✓' : '✗'} · EAC ${ok5[1] ? '✓' : '✗'} · comentário ${ok5[2] ? '✓' : '✗ (mínimo 20 caracteres)'}` },
      { n:6, ok: t6.go && t6.hr && t6.gc, txt: `Go ${t6.go ? '✓' : '✗'} · Hold ou Recycle com próxima revisão ${t6.hr ? '✓' : '✗'} · Go condicionado com condicionantes ${t6.gc ? '✓' : '✗'} (justificativa ≥ 30, versão dos pesos, instância ≠ quem registra, recomendação)` },
      { n:7, ok: !!foto && !!escE05, txt: `Fotografia FR-OUT FECHADA com hash ${foto ? '✓' : '✗'} · ESCALAR de E05 com instância ${escE05 ? '✓' : '✗'}` } ];
    const nOk = passos.filter(p => p.ok).length, ok = nOk >= 6 && passos[5].ok && passos[6].ok;
    return { ok, nota: Math.round(nOk / 7 * 100), passos, nOk };
  }
  const desafio = {
    titulo:'Sessão de gate do Ciclo Exemplo 2027 e fórum simulado de outubro',
    descricao:'Sete passos. Os passos 1 a 5 são conferidos contra a referência e contra duas variantes (8 FTE; E02 em setembro); os passos 6 e 7 conferem os seus registros do exercício. Conclui com pelo menos 6 de 7 passos, sendo 6 e 7 obrigatórios.',
    render(el, ctx, done){
      const s = MS(), x = s.des = s.des || {}, b = PF.base, rows = C().linhasCandidatas(b), L = C().param(b, 'R22'), res = s.desRes || null, st = n => res ? (res.passos[n - 1].ok ? 'ok' : 'err') : '';
      const fb = n => res ? `<p class="pf2-mini" style="margin:0">${res.passos[n - 1].ok ? '<span class="pf2-ok">✓ confere</span>' : '<span class="pf2-no">✗ ainda não</span>'} · ${esc(res.passos[n - 1].txt)}</p>` : '';
      const ninp = (k, v, label) => `<label class="field">${label}<input class="input" data-des="${k}" value="${esc(v ?? '')}" inputmode="decimal" placeholder="número"></label>`;
      const p3 = x.p3 || {}, p4 = x.p4 || {}, p5 = x.p5 || {}, cl = x.classif || {}, alvo = C().param(b, 'R28').alvo;
      el.innerHTML = `<div class="stack">${ui.seloExercicio()}${ui.callout('dica', `<p>Os passos 3 a 5 usam variantes: capacidade de 8 FTE e E02 no estado de setembro. Calcule com as fórmulas das aulas. Consultar o sistema faz parte: o what-if do passo 3 de Capacidade & Seleção mostra cada método com outra capacidade, e o mix (passo 4) você confere pela fórmula de D. ${B('R24')} ${B('R28')} ${B('R30')}</p>`)}
        <div class="pf2-step ${st(1)}"><h4>1 · Avaliação às cegas de P03, P05 e P06</h4><p class="pf2-mini" style="margin:0">Meta: pelo menos 13 das 15 notas a ±1 da referência e S a ±0,30. Fica no seu progresso (mesmo exercício da aba “Avaliação às cegas”).</p><div data-des-cegas><div data-cg-host>${cegasForm(ctx.dados, true)}</div></div>${fb(1)}</div>
        <div class="pf2-step ${st(2)}"><h4>2 · Classifique P01–P08 em valor × esforço</h4><p class="pf2-mini" style="margin:0">Valor alto: N ≥ ${fmt.n(L.valorAltoN)}; esforço alto: FTE > ${fmt.n(L.esforcoAltoFteAcimaDe)} ${B('R22')}. Meta: 7 de 8.</p>
          <div class="pf2-grid-in">${rows.map(r => `<label class="field"><span><b>${esc(r.id)}</b> · N ${n2(r.N)} · ${n1(r.fte)} FTE</span>${sel('q' + r.id, cl[r.id], ['FAZER_PRIMEIRO', 'PLANEJAR', 'COMPLEMENTAR', 'QUESTIONAR'].map(k => [k, QV(b, 'VE', k)]), 'quadrante…', `data-des-q="${esc(r.id)}"`)}</label>`).join('')}</div>${fb(2)}</div>
        <div class="pf2-step ${st(3)}"><h4>3 · Variante: capacidade de 8 FTE</h4><p class="pf2-mini" style="margin:0">R$ 4,0 mi; P01 obrigatória. Informe valor (ΣN) e ociosidade (FTE) de cada método. Tolerância: ±0,5 ponto; ±0,1 FTE.</p>
          <div class="pf2-grid-in">${ninp('p3.corteV', p3.corteV, 'Linha de corte: valor')}${ninp('p3.corteO', p3.corteO, 'Linha de corte: ociosidade')}${ninp('p3.gulosoV', p3.gulosoV, 'Guloso N/FTE: valor')}${ninp('p3.gulosoO', p3.gulosoO, 'Guloso N/FTE: ociosidade')}${ninp('p3.otimoV', p3.otimoV, 'Ótimo exato: valor')}${ninp('p3.otimoO', p3.otimoO, 'Ótimo exato: ociosidade')}</div>${fb(3)}</div>
        <div class="pf2-step ${st(4)}"><h4>4 · Diagnóstico do ótimo com 8 FTE</h4><div class="pf2-grid-in">${ninp('p4.D', p4.D, 'Índice D (pp, ±1)')}</div>
          <div class="row"><span class="pf2-mini">Categorias zeradas na parcela discricionária:</span>${Object.keys(alvo).map(k => `<label class="row pf2-mini" style="gap:6px;cursor:pointer"><input type="checkbox" data-des-z="${k}" ${(p4.zeradas || []).includes(k) ? 'checked' : ''}> ${esc(CAT[k] || k)}</label>`).join('')}</div>${fb(4)}</div>
        <div class="pf2-step ${st(5)}"><h4>5 · Variante: EVM de E02 na fotografia de setembro</h4><p class="pf2-mini" style="margin:0">Use o estado de E02 em ${esc(fmt.date(FOR_SET()))} (${(() => { const x = C().estadoEm(b, FOR_SET()), i = byId(x.iniciativas, 'E02') || {}; return `físico ${fmt.n(i.percentualFisicoReal)}%, AC ${mi(C().ac(x, 'E02'))}`; })()}; BAC e previsão como hoje). Tolerância ±0,02.</p>
          <div class="pf2-grid-in">${ninp('p5.cpi', p5.cpi, 'CPI')}${ninp('p5.eac', p5.eac, 'EAC (R$ mi)')}</div><label class="field">Comentário sobre a piora até hoje (mínimo 20 caracteres)<textarea class="input" rows="2" data-des="p5.coment">${esc(p5.coment || '')}</textarea></label>${fb(5)}</div>
        <div class="pf2-step ${st(6)}"><h4>6 · Três recomendações de gate (obrigatório)</h4><p class="pf2-mini" style="margin:0">Registre no Exercício de Gate: 1 Go; 1 Hold ou Recycle com próxima revisão; 1 Go condicionado com condicionantes. Justificativa ≥ 30 caracteres, instância diferente de quem registra.</p><div><a class="pf2-a btn btn-ghost btn-sm" href="#/n2/gate">${icon('target', 14)} Abrir Exercício de Gate</a></div>${fb(6)}</div>
        <div class="pf2-step ${st(7)}"><h4>7 · Fórum simulado de outubro (obrigatório)</h4><p class="pf2-mini" style="margin:0">No Fórum Mensal: registre ESCALAR de E05 com instância (Ata) e gere e FECHE a fotografia de FR-OUT (o hash é calculado ao fechar).</p><div class="row"><a class="pf2-a btn btn-ghost btn-sm" href="#/n2/forum?aba=ata">${icon('forum', 14)} Ata e escalonamentos</a><a class="pf2-a btn btn-ghost btn-sm" href="#/n2/forum?aba=foto">${icon('lock', 14)} Fotografia</a></div>${fb(7)}</div>
        <div class="row"><button class="btn btn-primary" data-des-conferir>${icon('check', 16)} Conferir desafio</button>${res ? `<span class="pf2-mini">Última conferência: ${res.nOk} de 7 passos${res.ok ? ' · concluído' : ''}.</span>` : ''}</div></div>`;
      const set = (path, val) => { const [a, k] = path.split('.'); if(k){ x[a] = x[a] || {}; x[a][k] = val; } else x[a] = val; PF.save(); };
      bindCegas(el.querySelector('[data-des-cegas]'), false);
      el.addEventListener('input', e => { const t = e.target.closest('[data-des]'); if(t) set(t.dataset.des, t.value); });
      el.addEventListener('change', e => { const t = e.target; if(t.closest('[data-des]')) set(t.dataset.des, t.value);
        if(t.dataset.desQ){ x.classif = Object.assign({}, x.classif, { [t.dataset.desQ]: t.value || undefined }); PF.save(); }
        if(t.dataset.desZ){ const z = new Set((x.p4 || {}).zeradas || []); if(t.checked) z.add(t.dataset.desZ); else z.delete(t.dataset.desZ); x.p4 = Object.assign({}, x.p4, { zeradas:Array.from(z) }); PF.save(); } });
      el.addEventListener('click', e => { if(!e.target.closest('[data-des-conferir]')) return; const r = conferirDesafio(); s.desRes = { ok:r.ok, nOk:r.nOk, passos:r.passos.map(p => ({ ok:p.ok, txt:p.txt })), ts:new Date().toISOString() }; PF.save();
        done({ ok:r.ok, nota:r.nota, detalhe:r.passos.map(p => `${p.n}:${p.ok ? 'ok' : 'não'}`).join(' ') }); });
    } };

  /* ================================================================== REGISTRO DO NÍVEL */
  PF.registerLevel({
    id:2, nome:'Arranjo · Priorização', subtitulo:'Escolher o que cabe e acompanhar', pergunta:'O que fazer primeiro, cabendo na capacidade, e como acompanhar?',
    objetivos:['Aplicar rubricas e calcular S e N', 'Explicar por que os pesos estão a validar e relacionar C1–C5 aos critérios do deck', 'Classificar em valor × esforço e valor × risco (e entender P08)', 'Calcular a capacidade discricionária e a utilização da demanda',
      'Montar e comparar carteiras por linha de corte, guloso e ótimo exato', 'Calcular o índice D do mix', 'Calcular e interpretar PV, EV, AC, SPI, CPI, EAC e EAC × previsão declarada', 'Conduzir o Fórum Mensal: pauta, o que mudou, escalonamento e fotografia FECHADA', 'Registrar recomendações de gate com versão dos pesos e instância'],
    unlock:{ minPct:70, desafio:true },
    screens:[
      { id:'criterios', titulo:'Critérios & Pesos', icone:'sliders', grupo:'A · Escolher', escreve:true, render:telaCriterios },
      { id:'pontuacao', titulo:'Pontuação & Matrizes', icone:'matrix', grupo:'A · Escolher', escreve:true, render:telaPontuacao },
      { id:'selecao', titulo:'Capacidade & Seleção', icone:'scale', grupo:'A · Escolher', escreve:true, render:telaSelecao },
      { id:'gate', titulo:'Exercício de Gate', icone:'target', grupo:'A · Escolher', escreve:true, render:telaGate },
      { id:'evm', titulo:'Desempenho (EVM)', icone:'money', grupo:'B · Acompanhar', render:telaEvm },
      { id:'forum', titulo:'Fórum Mensal', icone:'forum', grupo:'B · Acompanhar', escreve:true, render:telaForum } ],
    questions:[], desafio });

  /** Utilidades para perguntas-n2.js e testes. */
  PF.n2 = { campoNome, pack, pauta, gateSugerido, conferirDesafio, gabaritoDesafio, foraCorte, foraGuloso, tit, CAT, QV, MAP_VE_VR, versaoPesos, LIM_EAC,
    J: o => `<p><b>Resposta:</b> ${o.r}</p><p><b>Como calculei:</b> ${o.c}</p><p><b>Leitura:</b> ${o.l}</p><p><b>Cuidado:</b> ${o.k}</p><p><b>Próximo passo:</b> ${o.p}</p>` };
})();
