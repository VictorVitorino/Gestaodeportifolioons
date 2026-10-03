/* =========================================================================
   Portfólio FEG — TELAS GLOBAIS (globais.js)
   Dashboard #/dashboard · Indicadores #/indicadores · Inventário #/inventario · Decisões #/decisoes · Fontes e premissas #/fontes (rodapé)
   Contrato para os módulos de nível (complementa CONTRATO.md):
   - PF.registerDash({nivel, ordem, titulo?, sub?, largura?:'meia', render(d, gerencia)}) → html. d = PF.db(); gerencia = id da gerência
     filtrada no Dashboard ('FEN') ou null. Com `titulo`, o bloco entra num .card com cabeçalho; sem ele, o html entra como está.
     largura:'meia' divide a linha com o bloco vizinho no desktop.
   - PF.registerKpi({id, nivel, nome, unidade, essencial?, regra:'R13'|['R13','R08'], valor(d), fmt?(v), formula, conta?(d), interpretacao,
       armadilha, motivo? (texto ou d=>texto quando valor é null), dataDado? (texto ou d=>texto), convencao?, didatico?:true})
     Sem fmt, unidade '%' trata o valor como fração (0,439 → 43,9%).
   - PF.registerFichaTab({id, nivel, titulo, ordem, render(ini, d)}) → html. Base daqui: Dados (10), Decisões (40), Histórico (50) e Rótulos (sempre a última).
     Sugestão: N1 Sinal 20 e Riscos & Dependências 30; N2 e N3 a partir de 60.
   - Atalhos: PF.abrirFicha(id, aba?, {pendencia:{tipo, campo}}?); links '#/inventario?ini=E05', '#/indicadores?k=I1.4', '#/decisoes?ini=E05'.
   - PF.globais.{badge, metaLine}: badge com contradição entre fontes (R05b, R33) e marca ILUSTRATIVO (R07, R24); linha de metadados.
   Nada aqui é regra ONS; dados fictícios; nunca muta PF.base (só lê PF.db() e grava por PF.write/append/arquivar).
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF = window.PF || {};
  const { esc, fmt } = PF.util;
  const icon = PF.icon, ui = PF.ui;
  const C = () => PF.calc;
  const hoje = () => new Date().toISOString().slice(0, 10);
  const vazio = v => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
  const byId = (arr, id) => (arr || []).find(x => x.id === id) || null;
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const natural = (a, b) => String(a).localeCompare(String(b), 'pt-BR', { numeric:true });
  const dia = v => String(v || '').slice(0, 10);
  const dataHora = v => { if(!v) return '—'; const s = String(v); if(s.length <= 10) return fmt.date(s);
    const t = new Date(s); return isNaN(t) ? s : t.toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }); };
  const tirarQuery = key => { try { const h = location.hash.replace(new RegExp('([?&])' + key + '=[^&]*&?'), '$1').replace(/[?&]$/, '');
    history.replaceState(null, '', location.pathname + location.search + h); } catch(e){ /* sem history: segue */ } };

  /* ------------------------------------------------------------------ estilo próprio (classes pfg-*) */
  const CSS = `.pfg-dash{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pfg-dash>*{grid-column:1/-1;min-width:0}.pfg-dash>.meia{grid-column:auto}
.pfg-md{display:grid;grid-template-columns:minmax(250px,330px) minmax(0,1fr);gap:18px;align-items:start}
.pfg-list{display:flex;flex-direction:column;gap:4px;position:sticky;top:84px;max-height:calc(100vh - 110px);overflow:auto;padding-right:4px}
.pfg-li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;text-align:left;padding:9px 11px;border-radius:10px;border:1px solid transparent;color:#E1E2E3;font-size:13px;width:100%}
.pfg-li:hover{background:rgba(255,255,255,.05)}.pfg-li.on{border-color:var(--lime-line);background:var(--lime-soft)}
.pfg-li .v{font-family:var(--display);font-size:15px;color:#fff;font-variant-numeric:tabular-nums;white-space:nowrap}.pfg-li .b{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.pfg-grp{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);padding:10px 10px 2px}
.pfg-big{font-family:var(--display);font-size:46px;font-weight:300;line-height:1;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pfg-big small{font-size:17px;color:var(--muted);margin-left:6px}
.pfg-kv{width:100%;border-collapse:collapse;font-size:13.5px}.pfg-kv td{padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}
.pfg-kv td:first-child{color:var(--dim);width:34%}.pfg-kv small{display:block;color:var(--dim);font-size:11.5px}
.pfg-h4{font-family:var(--display);font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--lime);margin:18px 0 4px;font-weight:500}
.pfg-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:44px 20px;border:1px dashed var(--line-2);border-radius:var(--radius);background:rgba(0,0,0,.08)}
.pfg-empty .ic{width:58px;height:58px;border-radius:16px;display:grid;place-items:center;background:var(--lime-soft);color:var(--lime)}.pfg-empty h3{font-size:22px;font-weight:300}.pfg-empty p{margin:0;max-width:560px}
.pfg-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 14px}.pfg-form .full{grid-column:1/-1}.pfg-form textarea{resize:vertical}.pfg-form .input,.pfg-form .select{width:100%;min-width:0}
.pfg-err{color:#F3A39A;font-size:12.5px}.pfg-err:empty{display:none}.field.err .input,.field.err .select{border-color:var(--bad)}
.pfg-ico{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.06);margin-right:3px;vertical-align:middle}
.pfg-tree details{margin:2px 0 2px 12px;padding-left:10px;border-left:1px solid var(--line)}.pfg-tree>details{margin-left:0}
.pfg-tree summary{cursor:pointer;padding:6px 4px;border-radius:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pfg-tree summary:hover{background:rgba(255,255,255,.04)}
.pfg-n{margin-left:auto;font-size:12px;color:var(--ink);background:var(--lime);border-radius:999px;padding:0 8px;font-weight:600}.pfg-n.zero{background:rgba(255,255,255,.1);color:var(--dim)}
.pfg-leaf{display:block;width:100%;text-align:left;padding:6px 8px;margin:2px 0;border-radius:8px;font-size:13px;color:#E1E2E3}.pfg-leaf:hover{background:var(--lime-soft)}
.pfg-fer{font-size:12.5px;color:var(--muted);display:flex;gap:6px;align-items:center;margin:6px 0 0 4px;flex-wrap:wrap}.pfg-nota{font-size:12px;margin:6px 0 4px 4px}
.pfg-off{display:inline-block;cursor:not-allowed}.pfg-dec{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px}
.pfg-gl{display:grid;grid-template-columns:minmax(150px,240px) minmax(0,1fr);gap:8px 16px;margin:0}.pfg-gl dt{font-weight:600}.pfg-gl dd{margin:0;color:var(--muted)}
.pfg-filters .field{flex:1 1 150px;min-width:0}.pfg-filters .input,.pfg-filters .select{width:100%}.pfg-chk{font-size:13px;color:var(--muted);cursor:pointer;padding-bottom:9px}
details.pfg-conta{border:1px solid var(--line);border-radius:12px;padding:10px 14px;background:rgba(0,0,0,.12)}details.pfg-conta summary{cursor:pointer;color:var(--lime);font-family:var(--display)}
.pfg-legend>span{flex-wrap:wrap;row-gap:4px}.pfg-filters .input,.pfg-filters .select{min-height:40px}
.pfg-ul{margin:0;padding-left:18px;color:var(--muted)}.pfg-ul li{margin:4px 0}.pfg-modal-tabs .tab{cursor:pointer}
@media (max-width:980px){.pfg-md{grid-template-columns:minmax(0,1fr)}.pfg-list{position:static;max-height:340px}.pfg-dash{grid-template-columns:1fr}.pfg-dash>.meia{grid-column:1/-1}}
@media (max-width:640px){.pfg-form{grid-template-columns:minmax(0,1fr)}.pfg-big{font-size:36px}.pfg-gl{grid-template-columns:minmax(0,1fr)}.pfg-kv td:first-child{width:40%}}`;
  if(typeof document !== 'undefined' && !document.getElementById('pfg-css')){ const s = document.createElement('style'); s.id = 'pfg-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ------------------------------------------------------------------ rótulos e metadados */
  /** Badge da regra; contradição entre fontes vira "A validar FEG" (§2.2 regra 1) e a marca ILUSTRATIVO entra ao lado (R07, R24). */
  const bdg = code => {
    if(!code) return '';
    if(Array.isArray(code)) return code.map(bdg).join(' ');
    if(typeof code !== 'string' || !/^R\d/.test(code)) return PF.badge(code);
    const r = PF.regra(code); let h = PF.badge(code);
    if(r && r.contradicao && !/conflito/i.test(h)) h = `<span class="tag fonte-A_VALIDAR_FEG" data-pf-regra="${esc(code)}" style="cursor:pointer" title="${esc(code + ' · ' + (r.referencia || ''))}">A validar FEG · fontes em conflito</span>`;
    if(r && r.marca && !/>Ilustrativo</.test(h)) h += ' ' + PF.badge(r.marca);
    return h;
  };
  /** Badge só visual (sem abrir a ficha da regra): usado dentro de botões, onde um elemento clicável aninhado capturaria o clique. */
  const semClique = h => String(h).replace(/ data-pf-regra="[^"]*"/g, '').replace(/ style="cursor:pointer"/g, '');
  const refData = d => (C() && C().ref) ? C().ref(d) : (d.dataReferencia || '2026-10-03');
  const metaLine = d => `<div class="meta-line">${icon('calendar', 13)}<span>Data de referência <b>${fmt.date(refData(d))}</b> (ilustrativa)</span>${bdg('R07')}<span>· Parâmetros ${esc(PF.versaoParametros ? PF.versaoParametros(d) : (d.versaoParametros || 'v1'))}</span><span>· Dados ilustrativos</span></div>`;
  const aula = (txt, titulo = 'Aula rápida') => ui.callout('conceito', `<p>${txt}</p>`, titulo);
  const vazioCard = (ic, titulo, txt, extra = '') => `<div class="pfg-empty"><span class="ic">${icon(ic, 26)}</span><h3>${esc(titulo)}</h3><p class="muted">${txt}</p>${extra}</div>`;

  /* ------------------------------------------------------------------ nomes e catálogos */
  const nomeFase = (d, c) => (byId(d.statusConfiguracao, c) || {}).nome || c || '—';
  const ordemFase = (d, c) => (byId(d.statusConfiguracao, c) || {}).ordem || 99;
  const nomeCat = (d, c) => (byId(d.categorias, c) || {}).nome || c || '—';
  const catalogo = (d, k, c) => (((d.catalogos || {})[k]) || []).find(x => x && x.codigo === c) || null;
  const nomeTipo = (d, c) => (catalogo(d, 'tiposDecisao', c) || {}).nome || c;
  const SINAL = { VERDE:['Verde','ok'], AMARELO:['Amarelo','warn'], VERMELHO:['Vermelho','bad'], CINZA:['Cinza','dim'] };
  const sinalDe = (d, i) => (i.statusId === 'EM_EXECUCAO' && i.ativo !== false && C()) ? C().sinal(d, i) : null;
  const pillSinal = s => s && SINAL[s.cor] ? ui.pill(SINAL[s.cor][0], SINAL[s.cor][1]) : '';

  /* ------------------------------------------------------------------ campos da iniciativa */
  const GRUPOS = [
    ['Identificação', [['codigo','Código'],['titulo','Título'],['descricaoObjetivo','Descrição / objetivo'],['statusId','Fase'],['faseDesde','Na fase desde'],['ativo','Situação']]],
    ['Estrutura: Gerência → Comunidade → Squad → Ferramenta', [['gerenciaId','Gerência'],['comunidadeId','Comunidade'],['squadId','Squad'],['ferramentaId','Ferramenta']]],
    ['Pessoas e origem', [['responsavel','Responsável'],['patrocinador','Patrocinador'],['areaClienteOrigem','Área cliente / origem'],['origemDemanda','Origem da demanda'],['canalEntrada','Canal de entrada'],['envolveCtPmoPld','Envolve CT PMO-PLD']]],
    ['Classificação', [['categoria','Categoria'],['objetivoEstrategicoId','Objetivo estratégico'],['ciclo','Ciclo'],['horizonteInovacao','Horizonte de inovação'],['horizontePrazo','Horizonte de prazo'],['criticidade','Criticidade'],['impacto','Impacto'],['trlEsperado','TRL esperado'],['obrigatoria','Obrigatória'],['candidataObrigatoria','Candidata a obrigatória'],['evidenciaObrigatoriedade','Evidência de obrigatoriedade'],['pessoasChave','Pessoas-chave'],['grupoExclusividade','Grupo de exclusividade']]],
    ['Datas e execução', [['dataEntrada','Data de entrada'],['dataPlanejada','Data planejada (baseline)'],['dataPrevistaAtual','Data prevista atual'],['percentualFisicoReal','% físico real'],['percentualFisicoPlanejado','% físico planejado'],['ragDeclarado','Sinal declarado']]],
    ['Demanda e triagem', [['estimativaInformada','Estimativa informada'],['triagem','Campos da triagem']]],
    ['Benefício, notas e link', [['beneficioEsperado','Benefício esperado'],['observacoes','Observações'],['linkOperacional','Link operacional']]],
    ['Registro', [['rowVersion','Versão do registro (rowVersion)'],['createdAt','Criado em'],['updatedAt','Atualizado em'],['origemDado','Origem do dado']]],
  ];
  const ROT = Object.assign(Object.fromEntries(GRUPOS.flatMap(g => g[1])), { bac:'BAC (orçamento)' });
  const rotulo = k => ROT[k] || k;
  const OCULTOS = ['id','ilustrativo'];
  const nada = '<span class="dim">vazio</span>';

  const linkFicticio = v => { let inv = true; try { inv = /\.invalid$/i.test(new URL(v).hostname); } catch(e){ inv = true; }
    return `<code>${esc(v)}</code> ` + (inv ? `<span class="pfg-off" title="link fictício (domínio .invalid, reservado)"><button class="btn btn-ghost btn-sm" disabled aria-disabled="true">${icon('arrow', 13)} Abrir</button></span>`
      : `<a class="btn btn-ghost btn-sm" href="${esc(v)}" target="_blank" rel="noopener noreferrer">${icon('arrow', 13)} Abrir</a>`); };

  function valCampo(d, i, k){
    const v = i[k];
    if(k === 'ativo') return v === false ? ui.pill('Arquivada (ativo: não)', 'dim') : ui.pill('Ativa', 'ok');
    if(vazio(v)) return nada;
    switch(k){
      case 'statusId': return `${esc(nomeFase(d, v))} <small>${esc(v)}</small> ${bdg('R11')}`;
      case 'gerenciaId': { const g = byId(d.gerencias, v); return `${esc(v)}${g && g.nomeProposto ? ' · ' + esc(g.nomeProposto) : ''} ${bdg('R01')}`; }
      case 'comunidadeId': { const c = byId(d.comunidades, v); if(!c) return esc(v);
        return `${esc(c.id)} · ${esc(c.nome)} ${bdg(c.tipo === 'TECNICA' ? 'R03' : 'R02')}<small>${c.tipo === 'TECNICA' ? 'comunidade técnica' : 'comunidade de entrega'}${c.siglaDidatica ? ' · sigla didática, não oficial' : ''}</small>`; }
      case 'squadId': { const s = byId(d.squads, v); return s ? `${esc(s.id)} · ${esc(s.nome)}` : esc(v); }
      case 'ferramentaId': { const f = byId(d.ferramentas, v), c = f && f.comunidadeId !== i.comunidadeId;
        return `${esc(f ? f.nome : v)} ${bdg('R02')}<small>vínculo de catálogo; status e números são fictícios${c ? ' · ferramenta de outra comunidade no catálogo (aceito, com aviso)' : ''}</small>`; }
      case 'categoria': return `${esc(nomeCat(d, v))} ${bdg('R12')}`;
      case 'objetivoEstrategicoId': { const o = byId(d.objetivosEstrategicos, v); return `${esc(v)}${o ? ' · ' + esc(o.nome) : ''} ${bdg('R04')}`; }
      case 'origemDemanda': case 'canalEntrada': { const x = catalogo(d, k, v); return esc(x ? x.nome : v); }
      case 'ciclo': { const c = byId(d.ciclos, v); return esc(c ? c.nome : v); }
      case 'evidenciaObrigatoriedade': return `${esc(v.documento || '—')} · ${v.anexada ? 'anexada' : '<b class="tone-warn">pendente</b>'}`;
      case 'estimativaInformada': { const h = String(v.unidade || '').toUpperCase() === 'HORAS';
        return `${fmt.n(v.valor, v.valor % 1 ? 2 : 0)} ${esc(String(v.unidade || '').toLowerCase())}${v.custo != null ? ' · custo ' + fmt.mi(v.custo) : ''}${h ? `<small>em horas: o app não converte em FTE ${bdg('R25')}</small>` : ''}`; }
      case 'triagem': return Object.entries(v).map(([a, b]) => `${esc(a)}: <b>${esc(b === true ? 'sim' : b === false ? 'não' : b ?? '—')}</b>`).join(' · ');
      case 'linkOperacional': return linkFicticio(v);
      case 'percentualFisicoReal': case 'percentualFisicoPlanejado': return fmt.n(v) + '%';
      case 'ragDeclarado': return `${SINAL[v] ? ui.pill(SINAL[v][0], SINAL[v][1]) : esc(v)} <small>declarado pelo PO (o calculado fica na aba Sinal)</small>`;
      case 'origemDado': return `${esc(v)} ${PF.badge('ILUSTRATIVO')}`;
      case 'createdAt': case 'updatedAt': return esc(dataHora(v));
    }
    if(/^data|faseDesde/.test(k)) return esc(fmt.date(dia(v)));
    if(typeof v === 'boolean') return v ? 'sim' : 'não';
    if(Array.isArray(v)) return esc(v.join(', '));
    if(typeof v === 'object') return `<code>${esc(JSON.stringify(v))}</code>`;
    return esc(v);
  }

  /** Ícones de pendência: dado sem fonte, unidade incompatível, campo obrigatório vazio (R10a sempre; R10b da execução em diante) e pendência registrada. */
  const R10B_FASES = ['EM_EXECUCAO','EM_ESPERA','ENCERRADA'];
  const camposVaziosIni = (d, i) => { const c = C(); if(!c) return []; const all = c.camposVazios(d, i) || [], a = c.param(d, 'R10a') || [];
    return R10B_FASES.includes(i.statusId) ? all : all.filter(k => a.includes(k)); };
  function pendencias(d, i){
    const out = [], sf = (d.financeiro || []).filter(f => f.iniciativaId === i.id && (vazio(f.fonte) || vazio(f.periodo)));
    if(sf.length) out.push({ ic:'money', tone:'warn', cod:'SOURCE_REQUIRED', txt:`${PF.msg('SOURCE_REQUIRED')} (${sf.map(f => f.id).join(', ')})` });
    const un = (d.demandasCapacidade || []).filter(x => x.iniciativaId === i.id && String(x.unidade || '').toUpperCase() !== 'FTE');
    if(un.length) out.push({ ic:'scale', tone:'warn', cod:'INCOMPATIBLE_UNIT', txt:`Estimativa em ${un.map(x => fmt.n(x.capacidadeRequerida) + ' ' + String(x.unidade || '?').toLowerCase()).join(', ')}: fica fora da soma em FTE. O app não converte horas em FTE.` });
    const cv = camposVaziosIni(d, i);
    if(cv.length) out.push({ ic:'list', tone:'info', cod:'REQUIRED', txt:`Campo obrigatório vazio: ${cv.map(rotulo).join(', ')}.` });
    const pa = (d.pendencias || []).filter(p => p.iniciativaId === i.id && p.status !== 'RESOLVIDA');
    if(pa.length) out.push({ ic:'risk', tone:'bad', cod:'PENDENCIA_ABERTA', txt:`${pa.length} pendência(s) registrada(s) em aberto.` });
    return out;
  }
  const icoPend = p => `<span class="pfg-ico tone-${p.tone}" title="${esc(p.txt + ' (' + p.cod + ')')}" aria-label="${esc(p.txt)}">${icon(p.ic, 14)}</span>`;

  /* ================================================================== DASHBOARD */
  const ABAS = { 1:'Execução (N1)', 2:'Ciclo Exemplo 2027 (N2)', 3:'Recomendação (N3)' };
  const AULA_DASH = {
    1:'Gestão por exceção: o painel não mostra tudo, mostra o que está fora da tolerância. Comece pelo vermelho, depois pelas divergências e pelo cinza. Os números deste painel saem de regras didáticas a validar: não use em reporte.',
    2:'Escolher cabe na capacidade: compare demanda × oferta antes de olhar o ranking. A proposta de carteira é recomendação da analista; quem decide é a instância. CPI e SPI mostram se o que já está em execução cabe no plano.',
    3:'Painel candidato e descritivo (a validar): só contagens e somas, sem semáforo nem score agregado. Uma recomendação robusta aguenta os cenários e mostra quanto custa cada política adotada.' };
  function telaDashboard(el, ctx){
    const d = PF.db(), q = ctx.route.query, niveis = [1, 2, 3].filter(n => PF.unlocked(n));
    let aba = +String(q.aba || '').replace(/\D/g, '') || PF.currentLevel(); if(!niveis.includes(aba)) aba = niveis.includes(PF.currentLevel()) ? PF.currentLevel() : niveis[niveis.length - 1];
    const g0 = PF.ui_state('dash:ger', ''), ger = (d.gerencias || []).some(g => g.id === g0) ? g0 : '';
    const blocos = PF.dash.filter(b => (b.nivel || 1) === aba);
    const L = PF.level(aba);
    const corpo = blocos.length ? `<div class="pfg-dash">${blocos.map((b, k) => { let h;
        try { h = b.render(d, ger || null); } catch(err){ console.error(err); h = ui.callout('atencao', `<p>Não foi possível montar este bloco.</p><p class="dim">${esc(err && err.message)}</p>`); }
        const inner = b.titulo ? `<div class="card">${ui.section(b.titulo, b.sub || '')}${h || ''}</div>` : (h || '');
        return `<div class="${b.largura === 'meia' ? 'meia' : ''}" data-bloco="${esc(b.id || aba + '-' + k)}">${inner}</div>`; }).join('')}</div>`
      : vazioCard('dashboard', 'Ainda não há blocos nesta aba', `Os quadros de “${esc(ABAS[aba])}” chegam com o módulo do Nível ${aba}${L ? ' · ' + esc(L.nome) : ''}. Enquanto isso, os dados já podem ser explorados nas telas globais.`,
          `<div class="row" style="justify-content:center"><a class="btn btn-ghost btn-sm" href="#/indicadores">${icon('chart', 15)} Indicadores</a><a class="btn btn-ghost btn-sm" href="#/inventario">${icon('list', 15)} Inventário</a>${L ? `<a class="btn btn-ghost btn-sm" href="#/n${aba}/trilha">${icon('question', 15)} Trilha do nível ${aba}</a>` : ''}</div>`);
    const citadas = Array.from(new Set((corpo.match(/data-pf-regra="([^"]+)"/g) || []).map(x => x.slice(15, -1)))).filter(c => { const r = PF.regra(c); return r && r.origemRegra === 'A_VALIDAR_FEG'; }).sort(natural);
    const aviso = citadas.length ? `<div style="margin-top:16px">${ui.callout('atencao', `<p>${PF.msgHtml('RULE_NOT_VALIDATED', { lista:citadas.join(', ') })}</p><p class="dim" style="font-size:12.5px">Nenhuma regra deste painel é oficial; o PDF sai com marca d’água de exercício.</p>`)}</div>` : '';
    el.innerHTML = ui.seloExercicio() + ui.pageHead({ eyebrow:'Visão executiva · exercício', title:'Dashboard',
        sub:'Um retrato por nível liberado. É um exercício de home executiva: os quadros usam dados fictícios e regras didáticas a validar pela FEG.', actions: PF.pdfButton('Salvar PDF do dashboard') }) +
      metaLine(d) + ui.tabs('#/dashboard', niveis.map(n => ['n' + n, ABAS[n]]), 'n' + aba) +
      `<div class="row" style="margin-bottom:14px" data-noprint><span class="dim" style="font-size:12.5px">Gerência:</span>
        ${[['', 'Todas'], ...(d.gerencias || []).map(g => [g.id, g.id])].map(([id, l]) => `<button class="chip ${id === ger ? 'on' : ''}" data-dash-ger="${esc(id)}" aria-pressed="${id === ger}">${esc(l)}</button>`).join('')}
        ${bdg('R01')}<span class="dim" style="font-size:12px">Blocos que não usam o filtro mostram o portfólio inteiro.</span></div>` +
      corpo + aviso + `<div style="margin-top:18px">${aula(AULA_DASH[aba])}</div>`;
    el.querySelectorAll('[data-dash-ger]').forEach(b => b.onclick = () => { PF.set_ui('dash:ger', b.dataset.dashGer); PF.refresh(); });
  }

  /* ================================================================== INDICADORES */
  const valorKpi = (k, d) => { let v, erro = null; try { v = k.valor ? k.valor(d) : null; } catch(err){ console.error(err); v = null; erro = err && err.message; }
    if(v == null || (typeof v === 'number' && !isFinite(v))) return { v:null, txt:'n/d', erro };
    let txt; try { txt = k.fmt ? k.fmt(v) : typeof v === 'number' ? (k.unidade === '%' ? fmt.pct(v, 1) : fmt.n(v, Number.isInteger(v) ? 0 : 2)) : 'ver ficha'; } catch(err){ txt = String(v); }
    return { v, txt, erro }; };
  const txtOuFn = (x, d) => { try { return typeof x === 'function' ? x(d) : x; } catch(err){ console.error(err); return null; } };
  const regrasKpi = k => [].concat(k.regra || [], k.regras || []).filter(Boolean);
  function telaIndicadores(el, ctx){
    const d = PF.db(), cur = PF.currentLevel(), q = ctx.route.query;
    const lib = PF.kpis.filter(k => PF.unlocked(k.nivel || 1));
    if(q.k){ const k = lib.find(x => x.id === q.k); if(k){ PF.set_ui('ind:sel', k.id); if((k.nivel || 1) !== cur && !(PF.ui_state('ind:filtro', 'atual') === 'essenciais' && k.essencial)) PF.set_ui('ind:filtro', 'todos'); } tirarQuery('k'); }
    const filtro = PF.ui_state('ind:filtro', 'atual');
    const lista = (filtro === 'essenciais' ? lib.filter(k => k.essencial) : filtro === 'todos' ? lib : lib.filter(k => (k.nivel || 1) === cur))
      .slice().sort((a, b) => ((a.nivel || 1) - (b.nivel || 1)) || natural(a.id, b.id));
    let sel = PF.ui_state('ind:sel', null); if(!lista.some(k => k.id === sel)) sel = lista[0] && lista[0].id;
    const chips = [['atual', `Nível atual (N${cur})`], ['essenciais', 'Essenciais'], ['todos', 'Todos liberados']]
      .map(([id, l]) => `<button class="chip ${id === filtro ? 'on' : ''}" data-ind-f="${id}" aria-pressed="${id === filtro}">${esc(l)}</button>`).join('');
    let corpo;
    if(!lista.length) corpo = vazioCard('chart', lib.length ? 'Nenhum indicador neste filtro' : 'Ainda não há indicadores registrados',
      lib.length ? 'Troque o filtro para “Todos liberados” para ver os indicadores dos níveis já liberados.' : 'Os indicadores chegam com os módulos de nível. Cada um traz fórmula, a conta com os dados, interpretação, armadilha e o rótulo de origem.');
    else {
      let grp = null;
      const itens = lista.map(k => { const r = valorKpi(k, d), n = k.nivel || 1; let h = '';
        if(n !== grp){ grp = n; h += `<div class="pfg-grp">Nível ${n}${PF.level(n) ? ' · ' + esc(PF.level(n).nome) : ''}</div>`; }
        return h + `<button class="pfg-li ${k.id === sel ? 'on' : ''}" data-ind="${esc(k.id)}"><span><span class="dim" style="font-size:11.5px">${esc(k.id)}</span> ${esc(k.nome)}</span><span class="v">${r.v == null ? '<span class="dim">n/d</span>' : r.txt}</span><span class="b">${semClique(bdg(regrasKpi(k)[0]))}${k.essencial ? '<span class="dim" style="font-size:11px">essencial</span>' : ''}</span></button>`; }).join('');
      corpo = `<div class="pfg-md"><nav class="pfg-list" aria-label="Indicadores">${itens}</nav><div data-ind-ficha>${fichaKpi(lista.find(k => k.id === sel), d)}</div></div>`;
    }
    el.innerHTML = ui.pageHead({ eyebrow:'Painel', title:'Indicadores', sub:'Lista compacta à esquerda; clique para ver a ficha completa: valor, fórmula, a conta com os dados, como interpretar, armadilha e rótulo de origem. Os de nível bloqueado ficam ocultos.' }) +
      metaLine(d) + `<div class="row" style="margin-bottom:16px" data-noprint>${chips}<span class="dim" style="font-size:12.5px">${lista.length} de ${lib.length} liberados</span></div>` + corpo;
    el.querySelectorAll('[data-ind-f]').forEach(b => b.onclick = () => { PF.set_ui('ind:filtro', b.dataset.indF); PF.refresh(); });
    el.querySelectorAll('[data-ind]').forEach(b => b.onclick = () => { PF.set_ui('ind:sel', b.dataset.ind); el.querySelectorAll('[data-ind]').forEach(x => x.classList.toggle('on', x === b));
      PF.patch(el, '[data-ind-ficha]', fichaKpi(lista.find(k => k.id === b.dataset.ind), d)); if(window.innerWidth <= 980){ const f = el.querySelector('[data-ind-ficha]'); if(f && f.scrollIntoView) f.scrollIntoView({ block:'start', behavior:'smooth' }); } });
  }
  function fichaKpi(k, d){
    if(!k) return '';
    const r = valorKpi(k, d), rs = regrasKpi(k), conta = k.conta ? txtOuFn(k.conta, d) : null;
    const params = rs.map(c => { const x = PF.regra(c); return x ? `<div>${esc(c)} · ${esc(x.nome || x.chave || '')} · versão ${esc(x.rotuloVersao || x.versao || 1)}${x.vigente === false ? ' (não vigente)' : ''} ${bdg(c)}</div>` : `<div>${esc(c)} ${bdg(c)}</div>`; }).join('');
    const motivo = r.v == null ? (txtOuFn(k.motivo, d) || (r.erro ? 'O cálculo falhou com estes dados: ' + r.erro : 'Divisão sem base (denominador zero) ou dado ausente: o indicador fica n/d em vez de inventar um número.')) : null;
    const dataDado = txtOuFn(k.dataDado, d) || `Data de referência ${fmt.date(refData(d))} (ilustrativa) · dados de trabalho`;
    return `<div class="card stack">
      <div class="row"><span class="eyebrow">Nível ${k.nivel || 1} · ${esc(k.id)}</span>${bdg(rs)}${k.didatico ? '<span class="tag fonte-A_VALIDAR_FEG" style="white-space:normal">Regra didática a validar: não usar em reporte</span>' : ''}${k.essencial ? ui.pill('Essencial', 'lime') : ''}</div>
      <h2 style="font-size:26px;font-weight:300">${esc(k.nome)}</h2>
      <div class="pfg-big">${r.v == null ? '<span class="dim">n/d</span>' : r.txt}${k.unidade && r.v != null && !k.fmt && k.unidade !== '%' ? `<small>${esc(k.unidade)}</small>` : ''}</div>
      ${motivo ? ui.callout('atencao', `<p>${esc(motivo)}</p>`, 'Por que n/d') : ''}
      <table class="pfg-kv"><tbody>
        <tr><td>Unidade</td><td>${esc(k.unidade || '—')}</td></tr>
        <tr><td>Fórmula</td><td><code style="white-space:pre-wrap">${esc(k.formula || '—')}</code></td></tr>
        ${k.convencao ? `<tr><td>Convenção</td><td>${esc(k.convencao)}</td></tr>` : ''}
        <tr><td>Parâmetros usados</td><td>${params || '—'}</td></tr>
        <tr><td>Data do dado</td><td>${esc(dataDado)}</td></tr></tbody></table>
      ${conta ? `<details class="pfg-conta"><summary>Mostrar a conta</summary><div style="margin-top:8px" class="num">${conta}</div></details>` : ''}
      ${k.interpretacao ? ui.callout('dica', `<p>${esc(k.interpretacao)}</p>`, 'Como interpretar') : ''}
      ${k.armadilha ? ui.callout('atencao', `<p>${esc(k.armadilha)}</p>`, 'Armadilha') : ''}
      ${rs[0] ? `<div><button class="btn btn-ghost btn-sm" data-pf-regra="${esc(rs[0])}">${icon('info', 14)} Ficha da regra ${esc(rs[0])}</button></div>` : ''}</div>`;
  }

  /* ================================================================== INVENTÁRIO */
  const casa = (d, i, busca) => { if(!busca) return true; const f = byId(d.ferramentas, i.ferramentaId), b = norm(busca);
    return [i.id, i.titulo, i.responsavel, i.squadId, f && f.nome, i.comunidadeId].some(x => norm(x).includes(b)); };
  function telaInventario(el, ctx){
    const d = PF.db(), q = ctx.route.query, aba = q.aba === 'arvore' ? 'arvore' : 'tabela';
    const f = Object.assign({ ger:'', com:'', tipo:'', fase:'', cat:'', arq:false }, PF.ui_state('inv:f', {}));
    let busca = PF.ui_state('inv:busca', '');
    const coms = (d.comunidades || []).filter(c => !f.ger || c.gerenciaId === f.ger);
    if(f.com && !coms.some(c => c.id === f.com)) f.com = '';
    const todas = d.iniciativas || [];
    const filtrar = () => todas.filter(i => (f.arq || i.ativo !== false) && (!f.ger || i.gerenciaId === f.ger) && (!f.com || i.comunidadeId === f.com)
      && (!f.tipo || (byId(d.comunidades, i.comunidadeId) || {}).tipo === f.tipo) && (!f.fase || i.statusId === f.fase)
      && (!f.cat || (f.cat === '_' ? !i.categoria : i.categoria === f.cat)) && casa(d, i, busca));
    const resultado = () => { const l = filtrar(), ocultas = f.arq ? 0 : todas.filter(i => i.ativo === false).length;
      return `<div class="dim" style="font-size:12.5px;margin-bottom:8px">${l.length} iniciativa(s)${ocultas ? ` · ${ocultas} arquivada(s) oculta(s): ligue “Incluir arquivadas”` : ''}</div>` + (aba === 'arvore' ? arvore(d, l) : tabelaInv(d, l)); };
    const sel = (k, label, opts) => `<label class="field">${esc(label)}<select class="select" data-inv-f="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(f[k]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    el.innerHTML = ui.seloExercicio() + ui.pageHead({ eyebrow:'Inventário único', title:'Inventário', sub:'Todas as iniciativas, com fase, estrutura e pendências. Clique numa linha para abrir a ficha (editar, registrar pendência, arquivar).' }) +
      metaLine(d) + ui.tabs('#/inventario', [['tabela', 'Tabela'], ['arvore', 'Árvore']], aba) +
      `<div class="filters pfg-filters" data-noprint>
        <label class="field">Buscar<input class="input" type="search" data-inv-busca value="${esc(busca)}" placeholder="código, título, responsável…"></label>
        ${sel('ger', 'Gerência', [['', 'Todas'], ...(d.gerencias || []).map(g => [g.id, g.id])])}
        ${sel('com', 'Comunidade', [['', 'Todas'], ...coms.map(c => [c.id, c.id + ' · ' + c.nome])])}
        ${sel('tipo', 'Tipo de comunidade', [['', 'Todos'], ['ENTREGA', 'Entrega'], ['TECNICA', 'Técnica']])}
        ${sel('fase', 'Fase', [['', 'Todas'], ...(d.statusConfiguracao || []).slice().sort((a, b) => a.ordem - b.ordem).map(s => [s.codigo, s.nome])])}
        ${sel('cat', 'Categoria', [['', 'Todas'], ...(d.categorias || []).map(c => [c.codigo, c.nome]), ['_', '(sem categoria)']])}
        <label class="row pfg-chk"><input type="checkbox" data-inv-f="arq" ${f.arq ? 'checked' : ''}> Incluir arquivadas</label>
        <button class="btn-text" style="padding-bottom:9px" data-inv-limpar>Limpar filtros</button></div>
      <div data-inv-res>${resultado()}</div><div style="margin-top:18px">${aula('Inventário único: iniciativa invisível consome capacidade sem ter sido escolhida. Arquivar preserva a história; apagar não existe.')}</div>`;
    el.querySelectorAll('[data-inv-f]').forEach(s => s.onchange = () => { f[s.dataset.invF] = s.type === 'checkbox' ? s.checked : s.value; PF.set_ui('inv:f', f); PF.refresh(); });
    const bi = el.querySelector('[data-inv-busca]');
    bi.addEventListener('input', () => { busca = bi.value; PF.patch(el, '[data-inv-res]', resultado()); });
    bi.addEventListener('change', () => PF.set_ui('inv:busca', bi.value));
    el.querySelector('[data-inv-limpar]').onclick = () => { PF.set_ui('inv:f', {}); PF.set_ui('inv:busca', ''); PF.refresh(); };
    el.onclick = e => { const r = e.target.closest('[data-inv-ini]'); if(r && !e.target.closest('[data-pf-regra]')) abrirFicha(r.dataset.invIni); };
    el.onkeydown = e => { const r = (e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-inv-ini]') ? e.target : null; if(r){ e.preventDefault(); abrirFicha(r.dataset.invIni); } };
    if(q.ini){ const id = q.ini; tirarQuery('ini'); if(!document.querySelector('.modal-bg')) abrirFicha(id); }
  }
  function tabelaInv(d, lista){
    const ordS = { VERMELHO:0, AMARELO:1, CINZA:2, VERDE:3 };
    const rows = lista.map(i => { const s = sinalDe(d, i), c = byId(d.comunidades, i.comunidadeId), fe = byId(d.ferramentas, i.ferramentaId);
      return { id:i.id, codigo:i.id, titulo:i.titulo, ativo:i.ativo, statusId:i.statusId, fase:nomeFase(d, i.statusId), gerenciaId:i.gerenciaId, comunidadeId:i.comunidadeId,
        tipoCom: c ? (c.tipo === 'TECNICA' ? 'técnica' : 'entrega') : '', squadId:i.squadId || '', ferramenta: fe ? fe.nome : '', categoria: i.categoria ? nomeCat(d, i.categoria) : '', sinal:s, pend:pendencias(d, i) }; });
    const cols = [
      { key:'codigo', label:'Código', fmt:v => `<b>${esc(v)}</b>` },
      { key:'titulo', label:'Título', fmt:(v, r) => `${esc(v)}${r.ativo === false ? ' <span class="tag fonte-ILUSTRATIVO">arquivada</span>' : ''}` },
      { key:'fase', label:'Fase', sortVal:r => ordemFase(d, r.statusId) },
      { key:'gerenciaId', label:'Gerência' },
      { key:'comunidadeId', label:'Comunidade', fmt:(v, r) => `${esc(v)}<small>${esc(r.tipoCom)}</small>` },
      { key:'squadId', label:'Squad', fmt:v => v ? esc(v) : '<span class="dim">—</span>' },
      { key:'ferramenta', label:'Ferramenta', fmt:v => v ? `${esc(v)}<small>vínculo de catálogo</small>` : '<span class="dim">—</span>' },
      { key:'categoria', label:'Categoria', fmt:v => v ? esc(v) : '<span class="dim">—</span>' },
      { key:'sinal', label:'Sinal calculado', sortVal:r => r.sinal ? ordS[r.sinal.cor] : 9, fmt:(v) => v ? `<span title="${esc(v.motivo)}">${pillSinal(v)}</span>` : '<span class="dim">—</span>' },
      { key:'pend', label:'Pendências', sort:false, fmt:v => v.length ? v.map(icoPend).join('') : '<span class="dim">—</span>' },
    ];
    return ui.table({ cols, rows, id:'inv', rowAttr:r => `class="click" data-inv-ini="${esc(r.id)}" tabindex="0"`, empty:'Nenhuma iniciativa com estes filtros.' }) +
      `<div class="legend pfg-legend" style="margin-top:10px">
        <span>${icoPend({ ic:'money', tone:'warn', cod:'SOURCE_REQUIRED', txt:'Valor sem fonte ou período' })} sem fonte ou período</span>
        <span>${icoPend({ ic:'scale', tone:'warn', cod:'INCOMPATIBLE_UNIT', txt:'Unidade diferente de FTE' })} unidade incompatível</span>
        <span>${icoPend({ ic:'list', tone:'info', cod:'REQUIRED', txt:'Campo obrigatório vazio' })} campo obrigatório vazio ${bdg(['R10a', 'R10b'])}</span>
        <span>${icoPend({ ic:'risk', tone:'bad', cod:'PENDENCIA_ABERTA', txt:'Pendência registrada' })} pendência registrada</span>
        <span>Sinal só para quem está em execução ${bdg('R13')} regra didática: não usar em reporte</span></div>`;
  }
  function arvore(d, lista){
    const leaf = i => `<button class="pfg-leaf" data-inv-ini="${esc(i.id)}"><b>${esc(i.id)}</b> ${esc(i.titulo)} <span class="dim">· ${esc(nomeFase(d, i.statusId))}${i.ativo === false ? ' · arquivada' : ''}</span></button>`;
    const n = k => `<span class="pfg-n ${k ? '' : 'zero'}">${k}</span>`;
    const sig = c => c.siglaDidatica ? ` <span class="tag fonte-DECISAO_FUNCIONAL_PRODUTO" title="Sigla criada para o exercício (decisão de produto)">sigla didática, não oficial</span>` : '';
    const porFerr = (l, c) => { const g = {}; l.forEach(i => (g[i.ferramentaId || ''] ||= []).push(i));
      return Object.keys(g).sort(natural).map(fid => { const fe = byId(d.ferramentas, fid);
        return `<div class="pfg-fer">${icon('layers', 13)} ${fid ? esc(fe ? fe.nome : fid) + ' <small class="dim">vínculo de catálogo</small>' + (fe && fe.comunidadeId !== c.id ? ' <small class="dim">(de outra comunidade)</small>' : '') : '<i>sem ferramenta</i>'} ${n(g[fid].length)}</div>${g[fid].map(leaf).join('')}`; }).join(''); };
    return `<div class="row" style="margin-bottom:8px"><span class="dim" style="font-size:12.5px">Estrutura proposta pelo deck A&amp;M (a validar):</span>${bdg(['R01', 'R02'])}</div><div class="pfg-tree">${(d.gerencias || []).map(g => {
      const lg = lista.filter(i => i.gerenciaId === g.id);
      return `<details ${lg.length ? 'open' : ''}><summary><b class="lime">${esc(g.id)}</b> ${esc(g.nomeProposto || g.nome)} ${n(lg.length)}</summary>${(d.comunidades || []).filter(c => c.gerenciaId === g.id).map(c => {
        const lc = lg.filter(i => i.comunidadeId === c.id), sqs = (d.squads || []).filter(s => s.comunidadeId === c.id);
        const grupos = [...sqs.map(s => [s, lc.filter(i => i.squadId === s.id)]), [null, lc.filter(i => !sqs.some(s => s.id === i.squadId))]].filter(([s, l]) => s || l.length);
        const livres = (d.ferramentas || []).filter(fe => fe.comunidadeId === c.id && !lc.some(i => i.ferramentaId === fe.id));
        return `<details ${lc.length ? 'open' : ''}><summary><b>${esc(c.id)}</b> ${esc(c.nome)} <small class="dim">${c.tipo === 'TECNICA' ? 'técnica' : 'entrega'}</small>${sig(c)} ${n(lc.length)}</summary>
          ${grupos.map(([s, l]) => `<details ${l.length ? 'open' : ''}><summary>${s ? `Squad <b>${esc(s.id)}</b> ${esc(s.nome)}` : '<i>sem squad</i>'} ${n(l.length)}</summary>${l.length ? porFerr(l, c) : '<div class="dim pfg-nota">nenhuma iniciativa</div>'}</details>`).join('')}
          ${livres.length ? `<div class="dim pfg-nota">Ferramentas do catálogo sem iniciativa aqui: ${livres.map(x => esc(x.nome)).join(', ')}</div>` : ''}</details>`; }).join('')}</details>`; }).join('')}</div>`;
  }

  /* ------------------------------------------------------------------ ficha da iniciativa (modal) */
  const tabsFicha = () => { const t = PF.fichaTabs.filter(x => PF.unlocked(x.nivel || 1)); return t.filter(x => !x.ultima).concat(t.filter(x => x.ultima)); };
  const ROT_REQ = { titulo:'o título', descricaoObjetivo:'a descrição/objetivo', gerenciaId:'a gerência', comunidadeId:'a comunidade', responsavel:'o responsável' };
  const msgErro = e => ['REQUIRED', 'INVALID_URL', 'HIERARCHY_MISMATCH'].includes(e.codigo)
    ? PF.msgHtml(e.codigo, { campo: e.codigo === 'HIERARCHY_MISMATCH' ? e.campo : (ROT_REQ[e.campo] || rotulo(e.campo)) }) : `<span title="${esc(e.codigo || '')}">${esc(e.msg || PF.msg(e.codigo))}</span>`;
  const op = (o, v) => `<option value="${esc(o[0])}" ${String(o[0]) === String(v ?? '') ? 'selected' : ''}>${esc(o[1])}</option>`;
  const selF = (k, v, opts, vz) => `<select class="select" name="${k}">${vz != null ? `<option value="">${esc(vz)}</option>` : ''}${opts.map(o => o.grupo ? `<optgroup label="${esc(o.grupo)}">${o.itens.map(x => op(x, v)).join('')}</optgroup>` : op(o, v)).join('')}</select>`;
  const inpF = (k, v, type = 'text', extra = '') => `<input class="input" name="${k}" type="${type}" value="${esc(v ?? '')}" ${extra}>`;
  const areaF = (k, v, rows = 2) => `<textarea class="input" name="${k}" rows="${rows}">${esc(v ?? '')}</textarea>`;
  const campoF = (k, label, ctrl, st, full) => `<label class="field${full ? ' full' : ''}${st.erros && st.erros[k] ? ' err' : ''}">${esc(label)}${ctrl}<small class="pfg-err">${(st.erros && st.erros[k]) || ''}</small></label>`;

  /** abrirFicha(id, aba?, {pendencia:{tipo, campo, descricao}}?) — com `pendencia`, abre direto no formulário com os valores sugeridos. */
  function abrirFicha(id, aba, opts = {}){
    const st = { aba: aba || PF.ui_state('ficha:aba', 'dados'), modo:'ver', erros:null, vals:null, geral:'' };
    if(opts && opts.pendencia){ st.modo = 'pendencia'; st.vals = Object.assign({}, opts.pendencia); }
    const m = PF.modal('<div class="dim">Carregando…</div>', { wide:true });
    const draw = () => { const d = PF.db(), ini = byId(d.iniciativas, id);
      m.innerHTML = ini ? fichaHtml(ini, d, st) : `<h3>Iniciativa não encontrada</h3><p class="muted">${esc(id)} não existe nos dados de trabalho.</p><div class="m-act"><button class="btn btn-primary btn-sm" data-pf-close="1">Fechar</button></div>`;
      const f = m.querySelector('form .input, form .select'); if(f && st.modo !== 'ver') f.focus(); };
    const depois = (msg, aba2) => { st.modo = 'ver'; st.erros = null; st.vals = null; st.geral = ''; if(aba2) st.aba = aba2; PF.toast(msg); PF.refresh(); draw(); };
    m.addEventListener('click', e => {
      const t = e.target;
      const a = t.closest('[data-ficha-aba]'); if(a){ st.aba = a.dataset.fichaAba; PF.set_ui('ficha:aba', st.aba); draw(); return; }
      const ac = t.closest('[data-ficha-acao]'); if(ac){ st.modo = ac.dataset.fichaAcao; st.erros = null; st.vals = null; st.geral = ''; draw(); m.scrollTop = 0; return; }
      const pr = t.closest('[data-pend-resolver]'); if(pr){ pr.parentElement.innerHTML = `<span class="dim" style="font-size:12.5px">Marcar como resolvida?</span> <button class="btn btn-primary btn-sm" data-pend-ok="${esc(pr.dataset.pendResolver)}">Sim, resolver</button> <button class="btn btn-ghost btn-sm" data-pend-nao>Não</button>`; return; }
      if(t.closest('[data-pend-nao]')){ draw(); return; }
      const ok = t.closest('[data-pend-ok]'); if(ok){ const r = PF.write('pendencias', ok.dataset.pendOk, { status:'RESOLVIDA', resolvidaEm:hoje() }, { justificativa:'Pendência marcada como resolvida no exercício' });
        if(r.ok) depois('Pendência marcada como resolvida (histórico gravado).'); else PF.toast(esc((r.errors[0] || {}).msg || 'Não foi possível gravar.')); }
    });
    m.addEventListener('submit', e => { e.preventDefault(); const form = e.target, d = PF.db(), ini = byId(d.iniciativas, id); if(!ini) return;
      const tipo = form.dataset.form, r = tipo === 'editar' ? salvarEdicao(ini, form, st, d) : tipo === 'pendencia' ? salvarPendencia(ini, form, st, d) : tipo === 'arquivar' ? salvarArquivo(ini, form, st) : null;
      if(r && r.ok) depois(r.msg, r.aba); else { draw(); m.scrollTop = 0; } });
    draw();
    return m;
  }
  PF.abrirFicha = abrirFicha;

  function fichaHtml(ini, d, st){
    const s = sinalDe(d, ini), tabs = tabsFicha(); if(!tabs.some(t => t.id === st.aba)) st.aba = tabs[0] ? tabs[0].id : 'dados';
    const head = `<div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><div style="min-width:0"><div class="eyebrow">Ficha da iniciativa · ${esc(ini.id)}</div>
        <h3 style="margin:4px 0 8px">${esc(ini.titulo)}</h3><div class="row">${ui.pill(nomeFase(d, ini.statusId), 'lime')}${ini.ativo === false ? ui.pill('Arquivada', 'dim') : ''}${s ? `<span title="${esc(s.motivo)}">${pillSinal(s)}</span>` : ''}
        <span class="dim" style="font-size:12.5px">${esc(ini.gerenciaId)} → ${esc(ini.comunidadeId)}${ini.squadId ? ' → ' + esc(ini.squadId) : ''} · versão ${esc(ini.rowVersion || 1)}</span></div></div>
        <button class="btn btn-ghost btn-sm" data-pf-close="1" aria-label="Fechar ficha">${icon('x', 14)}</button></div>`;
    let body;
    if(st.modo === 'editar') body = formEditar(ini, d, st);
    else if(st.modo === 'pendencia') body = formPendencia(ini, d, st);
    else if(st.modo === 'arquivar') body = formArquivar(ini, d, st);
    else { const t = tabs.find(x => x.id === st.aba); let h = '';
      try { h = t ? t.render(ini, d) : ''; } catch(err){ console.error(err); h = ui.callout('atencao', `<p>Não foi possível montar esta aba.</p><p class="dim">${esc(err && err.message)}</p>`); }
      body = `<div class="row" style="margin:12px 0">
          <button class="btn btn-ghost btn-sm" data-ficha-acao="editar">${icon('edit', 14)} Editar</button>
          <button class="btn btn-ghost btn-sm" data-ficha-acao="pendencia">${icon('plus', 14)} Registrar pendência</button>
          ${ini.ativo !== false ? `<button class="btn btn-ghost btn-sm" data-ficha-acao="arquivar">${icon('download', 14)} Arquivar</button>` : ''}
          <span class="spacer"></span>${ini.linkOperacional ? linkFicticio(ini.linkOperacional) : ''}</div>
        <div class="tabs pfg-modal-tabs" role="tablist">${tabs.map(x => `<button class="tab ${x.id === st.aba ? 'on' : ''}" data-ficha-aba="${esc(x.id)}" role="tab" aria-selected="${x.id === st.aba}">${esc(x.titulo)}</button>`).join('')}</div>
        <div data-ficha-body>${h || '<p class="muted">Sem conteúdo.</p>'}</div>`; }
    return head + `<div style="margin-top:12px">${ui.seloExercicio()}</div>` + (st.geral ? ui.callout('atencao', `<p>${st.geral}</p>`) : '') + body;
  }

  /* ---- abas base da ficha */
  function abaDados(ini, d){
    const c = C(), pend = pendencias(d, ini), conhecidos = new Set(GRUPOS.flatMap(g => g[1].map(x => x[0])).concat(OCULTOS));
    const outros = Object.keys(ini).filter(k => !conhecidos.has(k));
    let h = pend.length ? ui.callout('atencao', `<ul class="pfg-ul">${pend.map(p => `<li title="${esc(p.cod)}">${esc(p.txt)}</li>`).join('')}</ul>`, 'Pontos de atenção do cadastro') : '';
    h += GRUPOS.map(([g, cs]) => { const linhas = cs.filter(([k]) => k in ini); return linhas.length ? `<div class="pfg-h4">${esc(g)}</div><table class="pfg-kv"><tbody>${linhas.map(([k, l]) => `<tr><td>${esc(l)}</td><td>${valCampo(d, ini, k)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('');
    if(outros.length) h += `<div class="pfg-h4">Outros campos</div><table class="pfg-kv"><tbody>${outros.map(k => `<tr><td>${esc(k)}</td><td>${valCampo(d, ini, k)}</td></tr>`).join('')}</tbody></table>`;
    const fin = (d.financeiro || []).filter(f => f.iniciativaId === ini.id);
    if(fin.length) h += `<div class="pfg-h4">Financeiro (R$ mi) ${bdg('R37')}</div>${c ? `<p class="muted" style="margin:4px 0 8px;font-size:13px">BAC ${fmt.n(c.bac(d, ini), 2)} · AC ${fmt.n(c.ac(d, ini), 2)} · previsão no término ${fmt.n(c.previsao(d, ini), 2)} <span class="dim">(só linhas com fonte e período)</span></p>` : ''}
      ${ui.table({ cols:[{ key:'periodo', label:'Período', fmt:v => esc(fmt.date(v)) }, { key:'orcamentoPlanejado', label:'Planejado', align:'r', fmt:v => fmt.n(v, 2) }, { key:'realizado', label:'Realizado', align:'r', fmt:v => fmt.n(v, 2) },
        { key:'previsao', label:'Previsão', align:'r', fmt:v => fmt.n(v, 2) }, { key:'fonte', label:'Fonte', fmt:(v, r) => vazio(v) || vazio(r.periodo) ? PF.msgHtml('SOURCE_REQUIRED') : esc(v) }, { key:'dataReferencia', label:'Data do dado', fmt:v => esc(fmt.date(v)) }], rows:fin })}`;
    const cap = (d.demandasCapacidade || []).filter(x => x.iniciativaId === ini.id);
    if(cap.length) h += `<div class="pfg-h4">Estimativa de capacidade</div><ul class="pfg-ul">${cap.map(x => `<li>${fmt.n(x.capacidadeRequerida, x.capacidadeRequerida % 1 ? 2 : 0)} ${esc(String(x.unidade || '').toLowerCase())} · ${esc(fmt.date(x.periodo))} · ${esc(x.fonte || '')}${String(x.unidade || '').toUpperCase() !== 'FTE' ? ' · ' + PF.msgHtml('INCOMPATIBLE_UNIT') : ''}</li>`).join('')}</ul>`;
    const pr = (d.pendencias || []).filter(p => p.iniciativaId === ini.id);
    h += `<div class="pfg-h4">Pendências registradas (${pr.length})</div>` + (pr.length ? pr.map(p => `<div class="pfg-dec"><div class="row"><b>${esc(p.tipo)}</b><span class="dim">· ${esc(rotulo(p.campo))} · prazo ${esc(fmt.date(p.prazo))} · ${esc(p.responsavel)}</span><span class="spacer"></span>
        ${p.status === 'RESOLVIDA' ? ui.pill('Resolvida', 'ok') : `${ui.pill('Aberta', 'warn')}<span><button class="btn btn-ghost btn-sm" data-pend-resolver="${esc(p.id)}">Resolver</button></span>`}</div><div class="muted" style="font-size:13.5px">${p.simulacao ? '[SIMULAÇÃO] ' : ''}${esc(p.descricao)}</div></div>`).join('') : '<p class="dim" style="margin:4px 0">Nenhuma. Use “Registrar pendência” para apontar campo vazio, divergência ou dado inconsistente.</p>');
    return h;
  }
  const quando = x => dia(x.decididoEm || x.registradoEm);
  function abaDecisoes(ini, d){
    const vig = new Set((C() ? C().decisoesVigentes(d) : (d.decisoes || [])).map(x => x.id));
    const ds = (d.decisoes || []).filter(x => x.iniciativaId === ini.id).slice().sort((a, b) => quando(b).localeCompare(quando(a)) || natural(b.id, a.id));
    if(!ds.length) return `<p class="muted">Nenhuma decisão registrada para ${esc(ini.id)}.</p>`;
    return ds.map(x => `<div class="pfg-dec"><div class="row"><b>${esc(x.id)}</b><span class="dim">${esc(fmt.date(quando(x)))}</span><span class="tag fonte-ILUSTRATIVO">${esc(nomeTipo(d, x.tipoDecisao))}</span>
        ${vig.has(x.id) ? ui.pill('Vigente', 'ok') : ui.pill('Corrigida', 'warn')}${x.refDecisaoAnteriorId ? `<span class="dim" style="font-size:12.5px">${x.tipoDecisao === 'CORRECAO_REGISTRO' ? 'corrige' : 'refere-se a'} ${esc(x.refDecisaoAnteriorId)}</span>` : ''}</div>
      <div style="margin:4px 0">${x.simulacao ? '<b class="lime">[SIMULAÇÃO]</b> ' : ''}${esc(x.decisao)}</div><small class="dim">${x.recomendacao ? 'Recomendação' : 'Decisão'} · registra: ${esc(x.papelRegistrante || x.responsavel || '—')} → instância: ${esc(x.instancia || '—')}</small></div>`).join('') +
      `<div class="row" style="margin-top:6px">${bdg('R18')}<a class="btn-text" href="#/decisoes?ini=${esc(ini.id)}" data-pf-close="1">Abrir no registro de decisões →</a></div>`;
  }
  function abaHistorico(ini, d){
    const rel = new Set([ini.id]); ['financeiro', 'riscosImpedimentos', 'avaliacoes', 'pendencias', 'demandasCapacidade'].forEach(k => (d[k] || []).forEach(x => { if(x.iniciativaId === ini.id) rel.add(x.id); }));
    (d.dependencias || []).forEach(x => { if(x.iniciativaOrigemId === ini.id) rel.add(x.id); });
    const hs = (d.historico || []).filter(h => rel.has(h.entidadeId)).slice().sort((a, b) => String(b.alteradoEm).localeCompare(String(a.alteradoEm)));
    if(!hs.length) return `<p class="muted">Sem alterações registradas para ${esc(ini.id)}.</p>`;
    const v = x => x == null || x === '' ? '<span class="dim">vazio</span>' : esc(typeof x === 'object' ? JSON.stringify(x) : x);
    return `<p class="dim" style="font-size:12.5px;margin:0 0 8px">Append-only: cada alteração vira uma linha; nada se apaga. Imutabilidade simulada no navegador; a garantia real é do banco.</p>` +
      ui.table({ cols:[{ key:'alteradoEm', label:'Quando', fmt:x => esc(dataHora(x)) }, { key:'entidade', label:'Registro', fmt:(x, r) => `${esc(r.entidadeId)}<small>${esc(x)}</small>` },
        { key:'campoAlterado', label:'Campo', fmt:(x, r) => x ? esc(rotulo(x)) : `<i>${r.operacao === 'INSERCAO' || !x ? 'inclusão' : ''}</i>` },
        { key:'valorAnterior', label:'Antes → depois', fmt:(x, r) => r.campoAlterado ? `${v(x)} → ${v(r.valorNovo)}` : '—' },
        { key:'usuarioId', label:'Quem', fmt:(x, r) => `${esc(x || '—')}<small>${r.origemAlteracao === 'APP_TRILHA' ? 'exercício' : esc(r.origemAlteracao || '')}</small>` },
        { key:'justificativa', label:'Justificativa', fmt:x => x ? esc(x) : '<span class="tone-warn">sem justificativa</span>' }], rows:hs });
  }
  function abaRotulos(ini, d){
    const c = byId(d.comunidades, ini.comunidadeId), L = [['R06', 'Arquivar em vez de apagar; histórico e versão do registro'], ['R01', 'Gerência da iniciativa'], ['R02', 'Catálogo de comunidades, squads e ferramentas'],
      ['R11', 'Fase da iniciativa'], ['R10a', 'Campos obrigatórios do repositório'], ['R10b', 'Campos obrigatórios da trilha'], ['R37', 'BAC, AC e previsão no término']];
    if(c && c.tipo === 'TECNICA') L.push(['R03', 'Comunidade técnica vinculada à FEG']);
    if(ini.categoria) L.push(['R12', 'Categoria']);
    if(ini.objetivoEstrategicoId) L.push(['R04', 'Objetivo estratégico (fictício)']);
    if(ini.statusId === 'EM_EXECUCAO') L.push(['R13', 'Sinal calculado'], ['R14', 'Previsão vencida'], ['R15', 'Tolerância de prazo'], ['R08', 'Faixas 30/60/90'], ['R09', 'Status que fecham riscos e dependências']);
    if(ini.statusId === 'DEMANDA') L.push(['R17', 'Checklist e precedência da triagem'], ['R16', 'Idade de demanda para alerta']);
    if((d.decisoes || []).some(x => x.iniciativaId === ini.id) || ini.statusId === 'DEMANDA') L.push(['R18', 'Tipos de decisão']);
    if(ini.ciclo === 'EX-2027' && ['EM_ANALISE', 'APROVADA'].includes(ini.statusId)) L.push(['R19', 'Critérios C1–C5'], ['R20', 'Pesos'], ['R21', 'Escala e normalização'], ['R22', 'Limiares das matrizes'], ['R24', 'Capacidade do ciclo']);
    if((ini.estimativaInformada && String(ini.estimativaInformada.unidade).toUpperCase() === 'HORAS') || (d.demandasCapacidade || []).some(x => x.iniciativaId === ini.id && String(x.unidade).toUpperCase() !== 'FTE')) L.push(['R25', 'O app não converte horas em FTE']);
    if(ini.ferramentaId) L.push(['R40', 'Classe de sourcing da ferramenta']);
    if(ini.horizonteInovacao) L.push(['R31', 'Horizontes de inovação']);
    return `<p class="muted" style="margin:0 0 10px">Rótulos de origem das regras usadas para ler esta iniciativa. Clique no rótulo para ver a ficha da regra. Nenhuma é regra ONS aprovada.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Rótulo</th><th>Regra</th><th>Onde entra</th></tr></thead><tbody>
      <tr><td>${PF.badge('ILUSTRATIVO')}</td><td>Dados da iniciativa</td><td>Título, datas, valores, pessoas e fornecedores são fictícios (${esc(ini.origemDado || 'TRILHA_FEG_FICTICIO')})</td></tr>
      ${L.filter(([k]) => PF.regra(k)).map(([k, t]) => `<tr><td>${bdg(k)}</td><td>${esc(k)} · ${esc(PF.regra(k).nome || '')}</td><td>${esc(t)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  PF.registerFichaTab({ id:'dados', nivel:1, titulo:'Dados', ordem:10, render:abaDados });
  PF.registerFichaTab({ id:'decisoes', nivel:1, titulo:'Decisões', ordem:40, render:abaDecisoes });
  PF.registerFichaTab({ id:'historico', nivel:1, titulo:'Histórico', ordem:50, render:abaHistorico });
  PF.registerFichaTab({ id:'rotulos', nivel:1, titulo:'Rótulos', ordem:99, ultima:true, render:abaRotulos });

  /* ---- formulários da ficha */
  const EDIT = ['titulo','descricaoObjetivo','responsavel','patrocinador','gerenciaId','comunidadeId','squadId','ferramentaId','categoria','objetivoEstrategicoId','dataPlanejada','dataPrevistaAtual','percentualFisicoReal','ragDeclarado','linkOperacional','observacoes'];
  function formEditar(ini, d, st){
    const v = st.vals || Object.fromEntries(EDIT.map(k => [k, ini[k] ?? ''])), gs = d.gerencias || [];
    const coms = gs.map(g => ({ grupo:g.id, itens:(d.comunidades || []).filter(c => c.gerenciaId === g.id).map(c => [c.id, c.id + ' · ' + c.nome]) }));
    const sqs = (d.comunidades || []).map(c => ({ grupo:c.id, itens:(d.squads || []).filter(s => s.comunidadeId === c.id).map(s => [s.id, s.id + ' · ' + s.nome]) })).filter(g => g.itens.length);
    const fes = (d.comunidades || []).map(c => ({ grupo:c.id, itens:(d.ferramentas || []).filter(f => f.comunidadeId === c.id).map(f => [f.id, f.nome]) })).filter(g => g.itens.length);
    return `<h4 class="pfg-h4">Editar ${esc(ini.id)}</h4>${ui.callout('dica', '<p>Gravar registra o histórico campo a campo e aumenta a versão do registro. A comunidade precisa pertencer à gerência e a squad à comunidade. A fase muda por decisão registrada, não por edição.</p>')}
      <form class="pfg-form" data-form="editar" novalidate style="margin-top:12px">
        ${campoF('titulo', 'Título *', inpF('titulo', v.titulo), st, true)}
        ${campoF('descricaoObjetivo', 'Descrição / objetivo *', areaF('descricaoObjetivo', v.descricaoObjetivo), st, true)}
        ${campoF('gerenciaId', 'Gerência *', selF('gerenciaId', v.gerenciaId, gs.map(g => [g.id, g.id + ' · ' + (g.nomeProposto || g.nome)]), 'Escolha…'), st)}
        ${campoF('comunidadeId', 'Comunidade *', selF('comunidadeId', v.comunidadeId, coms, 'Escolha…'), st)}
        ${campoF('squadId', 'Squad', selF('squadId', v.squadId, sqs, '(sem squad)'), st)}
        ${campoF('ferramentaId', 'Ferramenta (vínculo de catálogo)', selF('ferramentaId', v.ferramentaId, fes, '(sem ferramenta)'), st)}
        ${campoF('responsavel', 'Responsável *', inpF('responsavel', v.responsavel), st)}
        ${campoF('patrocinador', 'Patrocinador', inpF('patrocinador', v.patrocinador), st)}
        ${campoF('categoria', 'Categoria', selF('categoria', v.categoria, (d.categorias || []).map(c => [c.codigo, c.nome]), '(sem categoria)'), st)}
        ${campoF('objetivoEstrategicoId', 'Objetivo estratégico', selF('objetivoEstrategicoId', v.objetivoEstrategicoId, (d.objetivosEstrategicos || []).map(o => [o.id, o.id + ' · ' + o.nome]), '(sem objetivo)'), st)}
        ${campoF('dataPlanejada', 'Data planejada (baseline)', inpF('dataPlanejada', v.dataPlanejada, 'date'), st)}
        ${campoF('dataPrevistaAtual', 'Data prevista atual', inpF('dataPrevistaAtual', v.dataPrevistaAtual, 'date'), st)}
        ${campoF('percentualFisicoReal', '% físico real (0 a 100)', inpF('percentualFisicoReal', v.percentualFisicoReal, 'number', 'min="0" max="100" step="any"'), st)}
        ${campoF('ragDeclarado', 'Sinal declarado', selF('ragDeclarado', v.ragDeclarado, [['VERDE', 'Verde'], ['AMARELO', 'Amarelo'], ['VERMELHO', 'Vermelho']], '(não declarado)'), st)}
        ${campoF('linkOperacional', 'Link operacional (registro de origem)', inpF('linkOperacional', v.linkOperacional, 'text', 'inputmode="url"'), st, true)}
        ${campoF('observacoes', 'Observações', areaF('observacoes', v.observacoes), st, true)}
        ${campoF('justificativa', 'Justificativa da alteração * (mínimo 10 caracteres)', areaF('justificativa', st.vals ? st.vals.justificativa : ''), st, true)}
        <div class="full row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-ficha-acao="ver">Cancelar</button><button type="submit" class="btn btn-primary btn-sm">Gravar alteração</button></div></form>`;
  }
  const nul = x => x === '' || x === undefined ? null : x;
  const igual = (a, b) => JSON.stringify(nul(a) ?? null) === JSON.stringify(nul(b) ?? null);
  function salvarEdicao(ini, form, st, d){
    const fd = new FormData(form), get = k => String(fd.get(k) ?? ''), erros = {}, novo = {};
    st.vals = Object.fromEntries(EDIT.concat('justificativa').map(k => [k, get(k)]));
    ['titulo','descricaoObjetivo','responsavel','gerenciaId','comunidadeId'].forEach(k => novo[k] = get(k).trim());
    ['patrocinador','squadId','ferramentaId','categoria','objetivoEstrategicoId','dataPlanejada','dataPrevistaAtual','ragDeclarado','linkOperacional'].forEach(k => novo[k] = get(k).trim() || null);
    novo.observacoes = get('observacoes').trim();
    const pf = get('percentualFisicoReal').trim().replace(',', '.');
    novo.percentualFisicoReal = pf === '' ? null : Number(pf);
    if(pf !== '' && !(novo.percentualFisicoReal >= 0 && novo.percentualFisicoReal <= 100)) erros.percentualFisicoReal = PF.msgHtml('VALIDATION_ERROR', { texto:'O % físico vai de 0 a 100.' });
    const just = get('justificativa').trim(); if(just.length < 10) erros.justificativa = PF.msgHtml('JUSTIFICATIVA', { min:10 });
    const patch = {}; Object.keys(novo).forEach(k => { if(!igual(ini[k], novo[k])) patch[k] = novo[k]; });
    PF.validar('iniciativas', Object.assign({}, ini, patch), d).forEach(e => { if(!erros[e.campo]) erros[e.campo] = msgErro(e); });
    if(!Object.keys(patch).length && !Object.keys(erros).length){ st.geral = 'Nada mudou: altere algum campo antes de gravar.'; st.erros = null; return null; }
    if(Object.keys(erros).length){ st.erros = erros; st.geral = 'Corrija os campos destacados.'; return null; }
    const r = PF.write('iniciativas', ini.id, patch, { justificativa:just });
    if(!r.ok){ r.errors.forEach(e => { if(e.campo) erros[e.campo] = msgErro(e); else st.geral = msgErro(e); }); st.erros = erros; return null; }
    const fe = patch.ferramentaId && byId(d.ferramentas, patch.ferramentaId), comF = fe && fe.comunidadeId !== (patch.comunidadeId || ini.comunidadeId);
    const n = Object.keys(patch).length;
    return { ok:true, aba:'historico', msg:`Alteração gravada em <b>${esc(ini.id)}</b>: ${n} campo${n > 1 ? 's' : ''}, histórico registrado.${comF ? ' Aviso: a ferramenta é de outra comunidade no catálogo (aceito, como no repositório).' : ''}` };
  }
  const TIPOS_PEND = { CAMPO_VAZIO:'Campo vazio', DIVERGENCIA_STATUS:'Divergência de status (declarado × calculado)', DADO_INCONSISTENTE:'Dado inconsistente' };
  function formPendencia(ini, d, st){
    const v = st.vals || {}, tipos = ((d.catalogos || {}).tiposPendencia || Object.keys(TIPOS_PEND)).map(t => [t, TIPOS_PEND[t] || t]);
    const campos = GRUPOS.flatMap(g => g[1]).filter(([k]) => !['codigo', 'rowVersion', 'createdAt', 'updatedAt', 'origemDado'].includes(k)).concat([['financeiro', 'Linha financeira'], ['capacidade', 'Estimativa de capacidade'], ['outro', 'Outro']]);
    const sug = [ini.responsavel, ini.patrocinador, ...(((d.catalogos || {}).papeisRegistrantes) || [])].filter(Boolean);
    const ref = refData(d);
    return `<h4 class="pfg-h4">Registrar pendência em ${esc(ini.id)}</h4>${ui.callout('dica', '<p>Pendência aponta o que falta ou não confere, sem inventar valor. Todos os campos são obrigatórios. O registro é simulado e fica nos dados de trabalho.</p>')}
      <form class="pfg-form" data-form="pendencia" novalidate style="margin-top:12px">
        ${campoF('tipo', 'Tipo *', selF('tipo', v.tipo, tipos, 'Escolha…'), st)}
        ${campoF('campo', 'Campo *', selF('campo', v.campo, campos, 'Escolha…'), st)}
        ${campoF('descricao', 'Descrição * (o que falta ou não confere)', areaF('descricao', v.descricao, 3), st, true)}
        ${campoF('responsavel', 'Responsável *', inpF('responsavel', v.responsavel, 'text', 'list="pfg-resp"') + `<datalist id="pfg-resp">${sug.map(s => `<option value="${esc(s)}">`).join('')}</datalist>`, st)}
        ${campoF('prazo', `Prazo * (a partir de ${fmt.date(ref)})`, inpF('prazo', v.prazo, 'date', `min="${esc(ref)}"`), st)}
        <div class="full row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-ficha-acao="ver">Cancelar</button><button type="submit" class="btn btn-primary btn-sm">Registrar pendência</button></div></form>`;
  }
  function salvarPendencia(ini, form, st, d){
    const fd = new FormData(form), get = k => String(fd.get(k) ?? '').trim(), erros = {}, ref = refData(d);
    st.vals = { tipo:get('tipo'), campo:get('campo'), descricao:get('descricao'), responsavel:get('responsavel'), prazo:get('prazo') };
    const v = st.vals, req = { tipo:'o tipo', campo:'o campo', descricao:'a descrição', responsavel:'o responsável', prazo:'o prazo' };
    Object.keys(req).forEach(k => { if(!v[k]) erros[k] = PF.msgHtml('REQUIRED', { campo:req[k] }); });
    if(v.descricao && v.descricao.length < 10) erros.descricao = PF.msgHtml('VALIDATION_ERROR', { texto:'Descreva a pendência com pelo menos 10 caracteres.' });
    if(v.prazo && !/^\d{4}-\d{2}-\d{2}$/.test(v.prazo)) erros.prazo = PF.msgHtml('VALIDATION_ERROR', { texto:'Informe uma data válida.' });
    else if(v.prazo && v.prazo < ref) erros.prazo = PF.msgHtml('VALIDATION_ERROR', { texto:`O prazo não pode ser anterior à data de referência (${fmt.date(ref)}).` });
    if(Object.keys(erros).length){ st.erros = erros; st.geral = 'Preencha os campos destacados.'; return null; }
    const p = PF.append('pendencias', { iniciativaId:ini.id, tipo:v.tipo, campo:v.campo, descricao:v.descricao, responsavel:v.responsavel, prazo:v.prazo, status:'ABERTA' });
    PF.append('historico', { entidade:'pendencias', entidadeId:p.id, operacao:'INSERCAO', campoAlterado:null, valorAnterior:null, valorNovo:null, alteradoEm:p.registradoEm, origemAlteracao:'APP_TRILHA', justificativa:'Pendência registrada: ' + v.descricao.slice(0, 80) });
    if(v.tipo === 'DIVERGENCIA_STATUS' && ini.id === 'E02') PF.award('m-melancia', 'Caçadora de melancias');
    return { ok:true, aba:'dados', msg:`[SIMULAÇÃO] Pendência registrada em <b>${esc(ini.id)}</b>.` };
  }
  function formArquivar(ini, d, st){
    return `<h4 class="pfg-h4">Arquivar ${esc(ini.id)}</h4>${ui.callout('atencao', '<p>Arquivar não é apagar: a iniciativa sai das listas e dos indicadores, mas continua no inventário com “Incluir arquivadas” ligado, com todo o histórico. Não existe excluir.</p>')}
      <form class="pfg-form" data-form="arquivar" novalidate style="margin-top:12px">${campoF('justificativa', 'Justificativa * (mínimo 10 caracteres)', areaF('justificativa', st.vals ? st.vals.justificativa : '', 3), st, true)}
        <div class="full row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-ficha-acao="ver">Cancelar</button><button type="submit" class="btn btn-primary btn-sm">Arquivar</button></div></form>`;
  }
  function salvarArquivo(ini, form, st){
    const just = String(new FormData(form).get('justificativa') ?? '').trim(); st.vals = { justificativa:just };
    if(just.length < 10){ st.erros = { justificativa:PF.msgHtml('JUSTIFICATIVA', { min:10 }) }; return null; }
    const r = PF.arquivar(ini.id, just);
    if(!r.ok){ st.erros = {}; r.errors.forEach(e => { if(e.campo) st.erros[e.campo] = msgErro(e); }); st.geral = r.errors.map(msgErro).join(' ') + ' Corrija o cadastro antes de arquivar.'; return null; }
    return { ok:true, aba:'historico', msg:`<b>${esc(ini.id)}</b> arquivada. Ela continua no inventário com “Incluir arquivadas” ligado.` };
  }

  /* ================================================================== DECISÕES */
  const TRIAGEM = ['ADMITIR','DEVOLVER','REDIRECIONAR_EXECUCAO','ENCAMINHAR_EXPLORATORIO','ARQUIVAR'], GATE = ['GO','GO_CONDICIONADO','HOLD','RECYCLE','KILL'];
  /** Nível de uma decisão: campo `nivel`, senão inferido (N3: classe/cenário/custos; N2: gate e acompanhamento do exercício; N1: triagem e sementes). */
  function nivelDecisao(d, x, k = 0){
    if(x.nivel) return +x.nivel;
    if(x.tipoDecisao === 'CORRECAO_REGISTRO'){ const a = byId(d.decisoes, x.refDecisaoAnteriorId); return a && k < 8 ? nivelDecisao(d, a, k + 1) : 1; }
    if(x.classeRecomendacao || x.cenarioId || (x.custosRestricao || []).length) return 3;
    const semente = /semente/i.test(String(x.usuarioId || ''));
    if(!semente && (GATE.includes(x.tipoDecisao) || ['ESCALAR','REPLANEJAR','REGISTRAR_DESVIO'].includes(x.tipoDecisao))) return 2;
    return 1;
  }
  function telaDecisoes(el, ctx){
    const d = PF.db(), q = ctx.route.query;
    if(q.ini){ PF.set_ui('dec:f', Object.assign({}, PF.ui_state('dec:f', {}), { ini:q.ini })); tirarQuery('ini'); }
    const f = Object.assign({ ini:'', tipo:'', nivel:'', vig:false }, PF.ui_state('dec:f', {}));
    const todas = d.decisoes || [], vig = new Set((C() ? C().decisoesVigentes(d) : todas).map(x => x.id)), corrPor = {};
    todas.forEach(x => { if(x.tipoDecisao === 'CORRECAO_REGISTRO' && x.refDecisaoAnteriorId) (corrPor[x.refDecisaoAnteriorId] ||= []).push(x.id); });
    const niveis = [1, 2, 3].filter(n => PF.unlocked(n));
    const lista = todas.filter(x => (!f.ini || x.iniciativaId === f.ini) && (!f.tipo || x.tipoDecisao === f.tipo) && (!f.nivel || nivelDecisao(d, x) === +f.nivel) && (!f.vig || vig.has(x.id)));
    const rows = lista.map(x => Object.assign({}, x, { _q:quando(x), _n:nivelDecisao(d, x) }));
    const iniOpts = Array.from(new Set(todas.map(x => x.iniciativaId).filter(Boolean))).sort(natural);
    const tipoOpts = Array.from(new Set(todas.map(x => x.tipoDecisao))).sort(natural);
    const sel = (k, label, opts) => `<label class="field">${esc(label)}<select class="select" data-dec-f="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(f[k]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    const cols = [
      { key:'_q', label:'Registro', fmt:(v, r) => `<b>${esc(r.id)}</b><small>${esc(fmt.date(v))} · N${r._n}</small>` },
      { key:'iniciativaId', label:'Iniciativa', fmt:v => v ? `<a href="#/inventario?ini=${esc(v)}">${esc(v)}</a>` : '—' },
      { key:'tipoDecisao', label:'Tipo', fmt:v => `<span title="${esc(v)}">${esc(nomeTipo(d, v))}</span>` },   /* código só no tooltip (CONTRATO D7) */
      { key:'decisao', label:'Decisão ou recomendação', fmt:(v, r) => `${r.simulacao ? '<b class="lime">[SIMULAÇÃO]</b> ' : ''}${esc(v)}${r.justificativa ? `<small>Justificativa: ${esc(r.justificativa)}</small>` : ''}` },
      { key:'papelRegistrante', label:'Quem registra → instância', fmt:(v, r) => `${esc(v || r.responsavel || '—')}<small>${r.recomendacao ? 'recomendação' : 'decisão'} → ${esc(r.instancia || '—')}</small>` },
      { key:'_sit', label:'Situação', sortVal:r => vig.has(r.id) ? 0 : 1, fmt:(v, r) => (vig.has(r.id) ? ui.pill('Vigente', 'ok') : `${ui.pill('Corrigida', 'warn')}<small>por ${esc((corrPor[r.id] || []).join(', '))}</small>`) + (r.refDecisaoAnteriorId ? (r.tipoDecisao === 'CORRECAO_REGISTRO' ? `<small>corrige ${esc(r.refDecisaoAnteriorId)}${r.tipoDecisaoCorrigido ? ` (<span title="${esc(r.tipoDecisaoCorrigido)}">${esc(nomeTipo(d, r.tipoDecisaoCorrigido))}</span>)` : ''}</small>` : `<small>refere-se a ${esc(r.refDecisaoAnteriorId)}</small>`) : '') },
      { key:'_ac', label:'', sort:false, fmt:(v, r) => vig.has(r.id) ? `<button class="btn btn-ghost btn-sm" data-dec-corrigir="${esc(r.id)}">${icon('edit', 13)} Corrigir</button>` : '' },
    ];
    const nSim = todas.filter(x => !/semente/i.test(String(x.usuarioId || ''))).length;
    el.innerHTML = ui.seloExercicio() + ui.pageHead({ eyebrow:'Registro append-only', title:'Decisões', sub:'Todas as decisões e recomendações, das sementes ilustrativas e do seu exercício. Nada se apaga: uma correção é um novo registro que aponta para o anterior.' }) +
      metaLine(d) + `<div class="row" style="margin-bottom:12px">${ui.pill(todas.length + ' registros', 'paper')}${ui.pill(vig.size + ' vigentes', 'ok')}${ui.pill((todas.length - vig.size) + ' corrigidos', 'warn')}${ui.pill(nSim + ' do exercício', 'lime')}${bdg('R18')}</div>` +
      `<div class="filters pfg-filters" data-noprint>${sel('ini', 'Iniciativa', [['', 'Todas'], ...iniOpts.map(i => [i, i])])}${sel('tipo', 'Tipo', [['', 'Todos'], ...tipoOpts.map(t => [t, nomeTipo(d, t)])])}
        ${sel('nivel', 'Nível', [['', 'Todos'], ...niveis.map(n => [String(n), 'Nível ' + n])])}<label class="row pfg-chk"><input type="checkbox" data-dec-f="vig" ${f.vig ? 'checked' : ''}> Só vigentes</label></div>` +
      ui.table({ cols, rows:rows.slice().sort((a, b) => b._q.localeCompare(a._q) || natural(b.id, a.id)), id:'dec', empty:'Nenhuma decisão com estes filtros.' }) +
      `<div style="margin-top:18px">${aula('Decisão errada não se apaga: registra-se a correção, que aponta para o registro anterior. A analista registra a recomendação; quem decide é a instância (proposta a validar).')}</div>`;
    el.querySelectorAll('[data-dec-f]').forEach(s => s.onchange = () => { f[s.dataset.decF] = s.type === 'checkbox' ? s.checked : s.value; PF.set_ui('dec:f', f); PF.refresh(); });
    el.querySelectorAll('[data-dec-corrigir]').forEach(b => b.onclick = () => corrigirDecisao(b.dataset.decCorrigir));
  }
  function corrigirDecisao(id){
    const d = PF.db(), o = byId(d.decisoes, id); if(!o) return;
    const inst = Array.from(new Set([o.instancia, ...Object.values(((d.catalogos || {}).instancias) || {}).flat()].filter(Boolean)));
    const papeis = ((d.catalogos || {}).papeisRegistrantes) || [];
    const triagem = TRIAGEM.includes(o.tipoDecisao), st = { erros:null, vals:{ instancia:o.instancia || '', recomendacao:true } };
    const html = () => `<div class="eyebrow">Corrigir registro · ${esc(o.id)}</div><h3 title="CORRECAO_REGISTRO">Nova correção de registro</h3>${ui.seloExercicio()}
      <div class="pfg-dec"><div class="row"><b>${esc(o.id)}</b><span class="dim">${esc(fmt.date(quando(o)))} · ${esc(o.iniciativaId || '—')}</span><span class="tag fonte-ILUSTRATIVO">${esc(nomeTipo(d, o.tipoDecisao))}</span></div><div class="muted" style="font-size:13.5px">${o.simulacao ? '[SIMULAÇÃO] ' : ''}${esc(o.decisao)}</div></div>
      ${triagem ? ui.callout('dica', '<p>Correção de triagem: o novo registro guarda o tipo corrigido. Para devolver a demanda à fila, use Triagem → Registro → “Corrigir triagem”.</p>') : ''}
      <form class="pfg-form" data-form="corrigir" novalidate style="margin-top:12px">
        ${campoF('decisao', 'Registro correto * (o que passa a valer)', areaF('decisao', st.vals.decisao, 3), st, true)}
        ${campoF('justificativa', 'Justificativa * (mínimo 20 caracteres)', areaF('justificativa', st.vals.justificativa, 2), st, true)}
        ${campoF('papelRegistrante', 'Quem registra *', selF('papelRegistrante', st.vals.papelRegistrante, papeis.map(p => [p, p]), 'Escolha…'), st)}
        ${campoF('instancia', 'Instância que decide *', selF('instancia', st.vals.instancia, inst.map(p => [p, p]), 'Escolha…'), st)}
        <label class="row pfg-chk full"><input type="checkbox" name="recomendacao" ${st.vals.recomendacao ? 'checked' : ''}> É recomendação da analista (a instância decide)</label>
        <div class="full row" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-pf-close="1">Cancelar</button><button type="submit" class="btn btn-primary btn-sm">Registrar correção</button></div></form>`;
    const m = PF.modal(html());
    m.addEventListener('submit', e => { e.preventDefault(); const fd = new FormData(e.target), get = k => String(fd.get(k) ?? '').trim();
      st.vals = { decisao:get('decisao'), justificativa:get('justificativa'), papelRegistrante:get('papelRegistrante'), instancia:get('instancia'), recomendacao:fd.get('recomendacao') != null };
      const er = {}; if(!st.vals.decisao) er.decisao = PF.msgHtml('REQUIRED', { campo:'o registro correto' });
      if(st.vals.justificativa.length < 20) er.justificativa = PF.msgHtml('JUSTIFICATIVA', { min:20 });
      if(!st.vals.papelRegistrante) er.papelRegistrante = PF.msgHtml('REQUIRED', { campo:'quem registra' });
      if(!st.vals.instancia) er.instancia = PF.msgHtml('REQUIRED', { campo:'a instância' });
      if(Object.keys(er).length){ st.erros = er; m.innerHTML = html(); return; }
      const n = PF.append('decisoes', { iniciativaId:o.iniciativaId || null, tipoDecisao:'CORRECAO_REGISTRO', refDecisaoAnteriorId:o.id, tipoDecisaoCorrigido:o.tipoDecisao,
        decisao:st.vals.decisao, justificativa:st.vals.justificativa, responsavel:st.vals.papelRegistrante, papelRegistrante:st.vals.papelRegistrante, instancia:st.vals.instancia,
        recomendacao:st.vals.recomendacao, forumId:o.forumId || null, tipoRitoForum:o.tipoRitoForum || null, decididoEm:hoje(), nivel:nivelDecisao(d, o) });
      PF.closeModal(); PF.toast(`[SIMULAÇÃO] Correção <b>${esc(n.id)}</b> registrada; ${esc(o.id)} deixa de ser vigente.`); PF.refresh(); });
  }

  /* ================================================================== FONTES E PREMISSAS */
  const corta = (s, n = 90) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  const numTxt = x => fmt.n(x, Number.isInteger(x) ? 0 : 2);
  const resumo = v => { if(v === null) return 'null: o app não converte'; if(v === undefined) return '—';
    if(typeof v === 'number') return numTxt(v); if(typeof v === 'string') return /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmt.date(v) : v;
    if(Array.isArray(v)) return v.every(x => x == null || typeof x !== 'object') ? v.join(', ') : `${v.length} itens`;
    const p = Object.entries(v).filter(([, x]) => x == null || typeof x !== 'object').map(([k, x]) => `${k}: ${typeof x === 'number' ? numTxt(x) : x}`);
    return p.length ? p.join(' · ') : `${Object.keys(v).length} grupos`; };
  const ORIGENS = [['FONTE_ONS', 'Conteúdo de documento ONS aprovado e citado. Hoje nenhum item do app atende esse critério.'],
    ['A_VALIDAR_FEG', 'Pesos, limites, critérios, periodicidades e conteúdo de proposta de consultoria (deck A&M) que a FEG precisa validar.'],
    ['DECISAO_FUNCIONAL_PRODUTO', 'Escolha de desenho deste sistema para fins didáticos (ex.: fórmula de um indicador). Não é regra ONS.'],
    ['ILUSTRATIVO', 'Dados fictícios de iniciativas, valores, datas e papéis, criados apenas para exercícios.']];
  function telaFontes(el, ctx){
    const d = PF.db(), aba = ['regras', 'rotulos', 'glossario', 'validar', 'proximas'].includes(ctx.route.query.aba) ? ctx.route.query.aba : 'regras';
    const tabs = ui.tabs('#/fontes', [['regras', 'Painel de Regras'], ['rotulos', 'Rótulos de origem'], ['glossario', 'Glossário'], ['validar', 'Ilustrativo × a validar'], ['proximas', 'Próximas versões']], aba);
    el.innerHTML = ui.pageHead({ eyebrow:'Transparência', title:'Fontes e premissas', sub:'O sistema separa o que vem de fonte oficial do que é decisão de produto ou ainda precisa ser validado pela FEG. Nenhuma regra deste app é oficial; os dados de exemplo são fictícios.' }) +
      metaLine(d) + tabs + `<div data-fontes></div>`;
    const host = el.querySelector('[data-fontes]');
    if(aba === 'regras') fontesRegras(host, d); else if(aba === 'rotulos') host.innerHTML = fontesRotulos(); else if(aba === 'glossario') fontesGlossario(host);
    else if(aba === 'validar') host.innerHTML = fontesValidar(); else host.innerHTML = fontesProximas();
  }
  function fontesRegras(host, d){
    const f = PF.ui_state('fr:origem', ''); let busca = '';
    const regras = (d.regras || []).slice().sort((a, b) => natural(a.codigo, b.codigo) || (a.versao || 1) - (b.versao || 1));
    const cont = o => regras.filter(r => r.origemRegra === o && r.vigente !== false).length;
    const tabela = () => { const b = norm(busca), l = regras.filter(r => (!f || r.origemRegra === f) && (!b || [r.codigo, r.nome, r.chave, r.referencia].some(x => norm(x).includes(b))));
      return ui.table({ id:'fr', rows:l.map(r => Object.assign({}, r, { _v:corta(resumo(r.valor)) })), empty:'Nenhuma regra com este filtro.', rowAttr:r => `class="click" data-fr="${esc(r.codigo)}" tabindex="0"`, cols:[
        { key:'codigo', label:'Código', sortVal:r => r.codigo.replace(/\d+/, n => n.padStart(3, '0')), fmt:v => `<b>${esc(v)}</b>` },
        { key:'nome', label:'Regra', fmt:(v, r) => `${esc(v || r.chave)}<small>${esc(corta(r.referencia || '', 110))}</small>` },
        { key:'_v', label:'Valor resumido', fmt:v => `<span class="muted">${esc(v)}</span>` },
        { key:'origemRegra', label:'Rótulo', fmt:(v, r) => bdg(r.codigo) },
        { key:'versao', label:'Versão', fmt:(v, r) => `${esc(r.rotuloVersao || 'v' + (v || 1))}${r.vigente === false ? '<small>não vigente</small>' : ''}${r.editavel ? '<small>editável (R43)</small>' : ''}` }] }); };
    host.innerHTML = `<div class="row" style="margin-bottom:12px">${ui.pill(cont('A_VALIDAR_FEG') + ' a validar pela FEG', 'warn')}${ui.pill(cont('DECISAO_FUNCIONAL_PRODUTO') + ' decisões de produto', 'info')}${ui.pill(cont('FONTE_ONS') + ' fonte ONS', 'dim')}
        <span class="dim" style="font-size:12.5px">Clique numa linha para abrir a ficha da regra.</span></div>
      <div class="filters pfg-filters" data-noprint><label class="field">Buscar<input class="input" type="search" data-fr-busca placeholder="código, nome ou slide (s129)…"></label>
        <label class="field">Origem<select class="select" data-fr-origem>${[['', 'Todas'], ['A_VALIDAR_FEG', 'A validar FEG'], ['DECISAO_FUNCIONAL_PRODUTO', 'Decisão de produto'], ['FONTE_ONS', 'Fonte ONS']].map(([v, l]) => `<option value="${v}" ${v === f ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div data-fr-res>${tabela()}</div>
      <p class="dim" style="font-size:12.5px;margin-top:10px">Promoção real de regra só acontece fora do app, com documento ONS aprovado (documento, versão, data, trecho e instância). Parâmetros editáveis: só a lista fechada da R43.</p>`;
    const bi = host.querySelector('[data-fr-busca]'); bi.addEventListener('input', () => { busca = bi.value; PF.patch(host, '[data-fr-res]', tabela()); });
    host.querySelector('[data-fr-origem]').onchange = e => { PF.set_ui('fr:origem', e.target.value); PF.refresh(); };
    host.onclick = e => { const r = e.target.closest('[data-fr]'); if(r && !e.target.closest('[data-pf-regra]')) PF.fichaRegra(r.dataset.fr); };
    host.onkeydown = e => { if((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[data-fr]')){ e.preventDefault(); PF.fichaRegra(e.target.dataset.fr); } };
  }
  function fontesRotulos(){
    const ex = [[bdg('R05a'), 'Proposta A&M v25 · sNN · a validar', 'Afirmação descritiva do deck: estrutura, papéis, fóruns, RACI, catálogo (A validar FEG + proposta de consultoria).', 'R05a, R01, R41'],
      [bdg('R13'), 'A validar FEG', 'Parâmetro numérico ou regra de cálculo sem documento ONS aprovado; premissa da trilha; artefato interno.', 'R13, R20, R42'],
      [bdg('R05b'), 'A validar FEG · fontes em conflito', 'Fontes se contradizem: o app mostra as duas e não escolhe (regra 1 da precedência).', 'R05b, R33'],
      [bdg('R34'), 'Rascunho de revisão · a validar', 'Comentário de revisão do deck, ainda não consolidado. O app não mostra nomes de pessoas.', 'R34'],
      [bdg('R08'), 'Decisão de produto', 'Mecânica do repositório ou escolha de desenho da trilha (hierarquia, arquivar, 30/60/90, desempate).', 'R06, R08, R21'],
      [bdg('R30'), 'Decisão de produto · Ref. mercado', 'Fórmula de mercado adotada (EVM, AHP, Spearman, Pareto).', 'R30'],
      [PF.badge('ILUSTRATIVO'), 'Ilustrativo', 'Marca de dado fictício: iniciativas, valores, datas, notas, pessoas e fornecedores.', 'R07, R24 (marca)'],
      [`<span class="tag fonte-A_VALIDAR_FEG" style="border-style:dashed">Exercício</span>`, 'Exercício: registro simulado', 'Faixa em toda tela que grava (pendência, decisão, edição) ou gera PDF. Decisões levam o prefixo [SIMULAÇÃO].', '—'],
      [PF.badge({ origemRegra:'FONTE_ONS', tipoFonte:'DOCUMENTO_ONS_APROVADO' }), 'Fonte ONS · documento aprovado', 'Só com documento ONS aprovado e citado. Existe apenas aqui: hoje nenhum item atende.', 'nenhum']];
    const prec = ['Há contradição entre fontes? → A validar FEG, mostrando as duas fontes.', 'Parâmetro numérico ou regra de cálculo sem documento ONS aprovado → A validar FEG (com o slide, se vier do deck).',
      'Afirmação descritiva do deck → Proposta A&M · sNN · a validar.', 'Comentário de revisão do deck → Rascunho de revisão · a validar.', 'Mecânica do repositório ou escolha de projeto da trilha → Decisão de produto.',
      'Fórmula de mercado (EVM, AHP, Spearman, Pareto) → Decisão de produto · Ref. de mercado.', 'Conteúdo de artefato interno (naipes do Afinação FEG) → A validar FEG.', 'Dados de iniciativas, valores, datas, pessoas e fornecedores → Ilustrativo.', 'Fonte ONS → só com documento ONS aprovado. Hoje não existe nenhum item.'];
    return `<div class="grid g2" style="margin-bottom:16px">${ORIGENS.map(([k, t]) => `<div class="card"><div class="row" style="margin-bottom:8px">${ui.tag(k)}</div><div class="muted">${esc(t)}</div></div>`).join('')}</div>
      <div class="grid g2"><div class="card">${ui.section('Precedência', 'Aplique de cima para baixo; vale a primeira que servir.')}<ol class="pfg-ul">${prec.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>
        <div class="card">${ui.section('Onde o rótulo é obrigatório')}<ul class="pfg-ul"><li>Em todo número, limiar, pergunta e opção de decisão (badge clicável → ficha da regra).</li><li>Na linha de metadados das telas com número: data de referência, versão dos parâmetros e “dados ilustrativos”.</li><li>Em cards derivados do sinal calculado: “regra didática a validar: não usar em reporte”.</li><li>No PDF: marca d’água “exercício didático · dados fictícios” em todas as páginas.</li></ul></div></div>
      <div class="card" style="margin-top:16px">${ui.section('Rótulos que você vai ver')}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Rótulo</th><th>Significa</th><th>Quando aparece</th><th>Exemplos</th></tr></thead><tbody>
        ${ex.map(([b, n, q, e]) => `<tr><td>${b}</td><td>${esc(n)}</td><td>${esc(q)}</td><td class="dim">${esc(e)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function fontesGlossario(host){
    const vistos = new Set(), itens = PF.glossario.filter(x => PF.unlocked(x.nivel || 1) && x.termo).filter(x => { const k = norm(x.termo); if(vistos.has(k)) return false; vistos.add(k); return true; });
    let busca = '';
    const lista = () => { const b = norm(busca), l = itens.filter(x => !b || norm(x.termo + ' ' + x.def).includes(b));
      if(!l.length) return '<p class="muted">Nenhum termo encontrado.</p>';
      return [1, 2, 3].map(n => { const g = l.filter(x => (x.nivel || 1) === n).slice().sort((a, b2) => a.termo.localeCompare(b2.termo, 'pt-BR')); if(!g.length) return '';
        return `<div class="card" style="margin-bottom:16px">${ui.section(`Nível ${n}${PF.level(n) ? ' · ' + PF.level(n).nome : ''}`, `${g.length} termo(s)`)}<dl class="pfg-gl">${g.map(x => `<dt>${esc(x.termo)} ${x.regra ? bdg(x.regra) : ''}</dt><dd>${esc(x.def || '')}</dd>`).join('')}</dl></div>`; }).join(''); };
    host.innerHTML = `<div class="filters pfg-filters" data-noprint><label class="field">Buscar termo<input class="input" type="search" data-gl-busca placeholder="ex.: baseline, FTE, Cinza…"></label></div>
      <p class="dim" style="font-size:12.5px;margin:-4px 0 12px">Mostra os termos dos níveis liberados. O glossário cresce a cada nível.</p><div data-gl-res>${lista()}</div>`;
    const bi = host.querySelector('[data-gl-busca]'); bi.addEventListener('input', () => { busca = bi.value; PF.patch(host, '[data-gl-res]', lista()); });
  }
  function fontesValidar(){
    const card = (titulo, sub, itens) => `<div class="card">${ui.section(titulo, sub)}<ul class="pfg-ul">${itens.map(([t, r]) => `<li>${esc(t)} ${r ? bdg(r) : ''}</li>`).join('')}</ul></div>`;
    return `<div class="grid g2">
      ${card('Ilustrativo: substituir, não validar', 'Dados fictícios criados para os exercícios. Num uso real, entram dados reais.', [['As 22 iniciativas: títulos, datas, % físico, BAC, AC, previsões, sinais declarados, notas, FTE e custos.'], ['Fornecedores Alfa, Beta e Gama; especialista K; responsáveis e patrocinadores como papéis.'], ['Requisitos regulatórios R-00, R-01 e R-02 e seus documentos fictícios.'], ['Benefícios BEN-01..03 e medições; programa A–D/M.'], ['Capacidade de 10,0 FTE e orçamento de R$ 4,0 mi do Ciclo Exemplo 2027.', 'R24'], ['Data de referência 03/10/2026.', 'R07'], ['Fotografia SN-SET, decisões DEC-001..005 e histórico HS-01..07.']])}
      ${card('Proposta do deck A&M v25: a FEG precisa validar', 'Conteúdo de consultoria, não aprovado.', [['Estrutura: 4 gerências, 10 comunidades, 13 squads e catálogo de ferramentas.', 'R02'], ['Pool de Recursos de Governança: 5 blocos e cobertura de 4 HCs de PMO.', 'R41'], ['Fóruns, periodicidades e saídas.', 'R05a'], ['RACI e quadrantes do s168, reconstruídos do texto extraído: conferir no slide.', 'R38'], ['Faixas de capacidade (s165) e reserva de 15–20% (s166).', 'R26'], ['70/20/10 e handover em TRL 7; classes de sourcing.', 'R31']])}
      ${card('Hipóteses e decisões em aberto', 'A validar FEG.', [['Catálogo de fases e transições.', 'R11'], ['Taxonomia de categorias; “Obrigatória” é categoria ou condição?', 'R12'], ['Limiares do sinal e tolerância de prazo; se o sinal deve existir fora do exercício.', 'R13'], ['Critérios C1–C5, rubricas e pesos.', 'R20'], ['Capacidade: unidade, método, fungibilidade e conversão horas → FTE.', 'R25'], ['Mix-alvo e tolerância do índice D.', 'R28'], ['Periodicidades em conflito entre fontes.', 'R05b'], ['Direito decisório do PMO na priorização: C (s143) × A (s149).', 'R33'], ['Limite FEG × Comissão Gestora do CT PMO-PLD.', 'R34'], ['Tipos de decisão, alçadas e instâncias.', 'R18'], ['Os “7 KPIs” da home executiva: o painel do N3 é só candidato.'], ['Papéis de aprendizagem × blocos do Pool; alocação das 3 analistas.', 'R42'], ['Objetivos estratégicos reais (documento ONS).', 'R04'], ['Limiares de núcleo robusto; nota mínima de 70%.', 'R36b'], ['Convenções financeiras: moeda e “previsão no término”.', 'R37']])}
      ${card('Decisões de produto (DFP)', 'Não dependem de validação ONS, mas a FEG pode revisar.', [['Mecânicas do repositório: hierarquia, arquivar, 30/60/90, fotografia, append-only, rowVersion.', 'R06'], ['Normalização 0–100, desempates, meses de calendário, divisão por zero.', 'R21'], ['Regra de desbloqueio (mecânica).', 'R36a'], ['Triagem como recomendação; fórmulas de mercado adotadas.', 'R30']])}
      </div><div class="card hl" style="margin-top:16px">${ui.section('Fonte ONS', 'Nenhum item hoje.')}<p class="muted" style="margin:0">Um item só passa a “Fonte ONS” fora do app, por revisão de seed ou migration, com documento ONS aprovado citado (documento, versão, data, trecho e instância).</p></div>`;
  }
  function fontesProximas(){
    const it = [['branch', 'Caminho crítico (CPM)', 'Folga e caminho crítico do programa da cadeia hidrometeorológica, só em nível de marco (nunca tarefas).', 'R30'],
      ['spark', 'Opção real', 'Valor de esperar e o p* da PoC de inovação, como aprofundamento do N3.', null],
      ['people', 'HHI e concentração', 'Concentração por fornecedor com o índice HHI e seu limiar.', 'R32'],
      ['check', 'Simular promoção de regra', 'Registro simulado que mostraria “VALIDADO (simulação local, sem efeito oficial)” ao lado da origem original. A promoção real continua fora do app.', null],
      ['layers', 'Integração com o Portfólio FE real', 'Importação consolidada (CSV/JSON) vinda de ADO, Jira ou ITSM, sem substituir essas ferramentas. Todo importador deve rejeitar registros com ilustrativo:true.', null],
      ['sliders', 'Alternância Trabalho × Referência e modo exercício', 'Ficaram fora da v1 por simplicidade: as telas usam os dados de trabalho e as perguntas, a referência original.', null]];
    return `<p class="muted" style="margin:0 0 14px">Fora desta versão (v1 essencial). Ficam registrados para as próximas versões.</p><div class="grid g-auto">${it.map(([ic, t, x, r]) => `<div class="card stack" style="gap:8px"><div class="row"><span class="lime">${icon(ic, 18)}</span><b>${esc(t)}</b>${r ? bdg(r) : ''}</div><p class="muted" style="margin:0">${esc(x)}</p></div>`).join('')}</div>`;
  }

  /* ================================================================== glossário mínimo (§1.5) e registro das telas */
  PF.registerGlossario(1, [
    ['Portfólio', 'Projetos, programas e operações gerenciados em conjunto para atingir objetivos estratégicos (“fazer as coisas certas”).'],
    ['Programa / Projeto', 'Programa: projetos relacionados, coordenados para gerar benefícios conjuntos. Projeto: esforço temporário com entrega única (“fazer certo as coisas”).'],
    ['Iniciativa', 'Unidade do portfólio no app: projeto, programa, evolução ou PoC. Não é tarefa nem chamado.'],
    ['Demanda', 'Pedido ainda não decidido. No app é um espelho do registro de origem (ITSM ou ADO).'],
    ['Baseline (data planejada)', 'Referência aprovada de prazo e custo. Sem baseline não há sinal confiável.'],
    ['Sinal calculado (RAG)', 'Verde, Amarelo, Vermelho ou Cinza por regra didática (a validar). Comparado ao sinal declarado.', 'R13'],
    ['Status melancia', 'Declarado verde, calculado vermelho.'],
    ['BAC / AC', 'BAC: orçamento total da iniciativa. AC: custo realizado até a data.'],
    ['% físico', 'Avanço físico informado (real) ou planejado até a data.'],
    ['pp', 'Ponto percentual: diferença entre duas porcentagens.'],
    ['FTE / HC', 'FTE: equivalente em tempo integral (capacidade). HC: pessoa no quadro.'],
    ['Data de referência', 'Data em que o retrato é calculado (03/10/2026 no gabarito).', 'R07'],
    ['30/60/90', 'Faixa de entrega pela data prevista em relação à data de referência.', 'R08'],
    ['Risco × impedimento', 'Risco: algo que pode acontecer. Impedimento: algo que já trava a iniciativa.'],
    ['Fotografia (snapshot)', 'Retrato do portfólio na data de corte de um fórum. Depois de FECHADA, não muda.'],
    ['Recomendação', 'Decisão registrada pela analista para a instância decidir.'],
    ['Rótulo de origem', 'Proposta A&M a validar · A validar FEG · Decisão de produto (DFP) · Ilustrativo · Fonte ONS (só com documento aprovado).'],
  ].map(([termo, def, regra]) => Object.assign({ termo, def, fonte:'§1.5' }, regra ? { regra } : {})));

  PF.registerGlobal({ id:'dashboard', titulo:'Dashboard', icone:'dashboard', ordem:1, render:telaDashboard });
  PF.registerGlobal({ id:'indicadores', titulo:'Indicadores', icone:'chart', ordem:2, render:telaIndicadores });
  PF.registerGlobal({ id:'inventario', titulo:'Inventário', icone:'list', ordem:3, render:telaInventario });
  PF.registerGlobal({ id:'decisoes', titulo:'Decisões', icone:'gavel', ordem:4, render:telaDecisoes });
  PF.registerGlobal({ id:'fontes', titulo:'Fontes e premissas', icone:'info', ordem:90, rodape:true, render:telaFontes });
  PF.globais = { badge:bdg, metaLine, nivelDecisao, pendencias, abrirFicha };
})();
