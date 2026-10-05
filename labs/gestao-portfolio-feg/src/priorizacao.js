/* =========================================================================
   Nível 2 - Priorização: avaliar (perguntas 0-3), ranking, matriz e pesos
   APIs expostas: GP.notaHtml(v, dica?), GP.quadPill(q), GP.priorizacao.{decompHtml, glifo, versaoAtual, verNoRanking}
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt } = GP.util, icon = GP.icon;
  const plural = GP.util.plural || ((n, s, p) => n + ' ' + (n === 1 ? s : p));
  const n1 = v => v == null ? '-' : fmt.n(v, 0);
  const reduzMov = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const rolarSuave = () => reduzMov() ? 'auto' : 'smooth';
  const hexA = (h, a) => { const n = parseInt(String(h).slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  const vazio = (t, x, a, ic) => U.vazio(t, x, a || '', ic);
  const QK = ['rapido', 'estrategico', 'complementar', 'repensar'];
  const classeDe = v => v == null ? null : v >= M.CORTE.classeA ? 'A' : v >= M.CORTE.classeB ? 'B' : 'C';

  /* Aviso com ação (Desfazer, Ver no ranking). Usa a API {acao, onAcao, ms} do núcleo; sem ela, acrescenta o botão ao aviso. */
  function avisar(msg, acao, onAcao, ms = 7000){
    GP.toast(msg, acao ? { acao, onAcao, ms } : { ms });
    if(!acao) return;
    const t = document.querySelector('.toast'); if(!t || t.querySelector('.toast-act')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-act pz-toast-act'; b.textContent = acao;
    b.onclick = ev => { ev.stopPropagation(); t.classList.remove('on'); onAcao(); }; t.appendChild(b);
  }

  /* ---------------------------------------------- selos: quadrante e nota */
  /** Glifo por quadrante: raio (ganho rápido), alvo (estratégico), encaixe (complementar), interrogação (repensar). */
  const GLIFOS = {
    rapido:'<path d="M13.2 2.5L5 13.4h6.1L10.4 21.5l8.4-11.2h-6.2z" fill="currentColor" stroke="none"/>',
    estrategico:'<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    complementar:'<path d="M5 8h3.2a2.6 2.6 0 015.2 0H17v3.4a2.6 2.6 0 010 5.2V20H5z"/>',
    repensar:'<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4a2.7 2.7 0 115.1 1.2c-.6.9-2.5 1.4-2.5 3"/><path d="M12 17.2v.3"/>',
    nao:'<circle cx="12" cy="12" r="8" stroke-dasharray="3.2 3"/>',
  };
  const glifo = (k, s = 13, cor) => `<svg class="qg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cor ? ` style="color:${cor}"` : ''}>${GLIFOS[k] || GLIFOS.nao}</svg>`;
  /** Pílula de quadrante: cor do token, glifo próprio e texto em cor de texto. Sem quadrante: neutra com borda tracejada. */
  const quadPill = q => { const Q = q && M.QUADRANTES[q];
    if(!Q) return `<span class="pill qpill q-nao">${glifo('nao', 12)}<span>Não avaliado</span></span>`;
    return `<span class="pill qpill q-${q}" style="background:${hexA(Q.cor, .1)};border-color:${hexA(Q.cor, .32)}">${glifo(q, 13, Q.cor)}<span>${esc(Q.nome)}</span></span>`; };
  /** Selo da nota de valor com a letra da classe (A ≥70, B ≥40, C). dica (opcional) vira data-tt. */
  const notaHtml = (v, dica) => { if(v == null) return '<span class="score nota nota-x" title="Sem nota">-</span>';
    const c = classeDe(v);
    return `<span class="score nota nota-${c.toLowerCase()}" ${dica ? `data-tt="${esc(dica)}"` : `title="Nota de valor ${n1(v)} de 100 · classe ${c}"`}><span class="nota-l">${c}</span>${n1(v)}</span>`; };
  GP.notaHtml = notaHtml; GP.quadPill = quadPill;
  const priorizaveis = () => P.todos().filter(p => M.ETAPAS_PRIORIZAVEIS.includes(p.etapa));
  const pendentes = lista => M.pendentesAvaliacao ? M.pendentesAvaliacao(lista) : lista.filter(p => M.ETAPAS_PRIORIZAVEIS.includes(p.etapa) && !M.pontuar(p).completo);

  /* -------------------------------------------- "Por que esta nota?" */
  const VERDES = ['#2E4F00', '#3E6801', '#4C7A0B', '#6b8f2a', '#899b67', '#a3b77c'];
  const ARDOSIAS = ['#477b91', '#3a74a8', '#6e97a9', '#8fb0c9'];
  const coresEixo = eixo => eixo === 'esforco' ? ARDOSIAS : VERDES;
  const decompor = (p, crit = M.criterios(), eixo) => M.decompor ? M.decompor(p, crit, eixo) : [];
  /** Barra empilhada 0-100: um trecho por pergunta (largura = pontos possíveis); a parte cheia é o que o projeto obteve, a hachura é o que faltou. */
  function decompHtml(itens, eixo, { titulo = true } = {}){
    if(!itens.length) return '';
    const cores = coresEixo(eixo), tot = itens.reduce((a, x) => a + x.pontos, 0), alguma = itens.some(x => x.resp != null);
    const aria = `${eixo === 'esforco' ? 'Esforço' : 'Valor'} ${fmt.n(tot, 0)} de 100: ` + itens.map(x => `${x.nome} ${x.resp == null ? 'sem resposta' : fmt.n(x.pontos, 0) + ' de ' + fmt.n(x.max, 0)}`).join('; ');
    const bar = `<div class="dc-bar" role="img" aria-label="${esc(aria)}">${itens.map((x, i) => `<span class="dc-slot${x.resp == null ? ' dc-sem' : ''}" style="flex:${x.max.toFixed(3)} 1 0" data-pontos="${x.pontos.toFixed(3)}" data-tt="${esc(x.nome)}&#10;${x.resp == null ? 'Sem resposta' : `Resposta ${x.resp} de 3`}&#10;${fmt.n(x.pontos, 1)} de ${fmt.n(x.max, 0)} pontos"><i style="width:${x.max ? Math.min(100, x.pontos / x.max * 100) : 0}%;background:${cores[i % cores.length]}"></i></span>`).join('')}</div>`;
    const leg = `<div class="dc-leg">${itens.map((x, i) => `<span><i style="background:${cores[i % cores.length]}"></i>${esc(x.nome)} <b>${x.resp == null ? '–' : (x.pontos > 0.05 ? '+' : '') + fmt.n(x.pontos, 0)}</b><small> de ${fmt.n(x.max, 0)}</small></span>`).join('')}</div>`;
    let frase = '';
    if(alguma){
      if(eixo === 'esforco'){ const m = itens.slice().sort((a, b) => b.pontos - a.pontos)[0]; if(m && m.pontos > 0) frase = `Mais pesa no esforço: <b>${esc(m.nome)}</b> (+${fmt.n(m.pontos, 0)}).`; }
      else { const m = itens.filter(x => x.resp != null).sort((a, b) => (b.max - b.pontos) - (a.max - a.pontos))[0];
        frase = m && m.max - m.pontos > 0.5 ? `Maior oportunidade: <b>${esc(m.nome)}</b> (faltam ${fmt.n(m.max - m.pontos, 0)} pontos).` : 'Todas as respostas no máximo.'; }
    }
    return `<div class="dc dc-${eixo}">${titulo ? `<div class="dc-h"><span>${eixo === 'esforco' ? 'Esforço' : 'Valor'}</span><b>${alguma ? fmt.n(tot, 0) : '–'}<small> de 100</small></b></div>` : ''}${bar}${leg}${frase ? `<p class="dc-frase">${frase}</p>` : ''}</div>`;
  }
  /** Dica do selo no ranking: as 3 maiores contribuições do valor */
  const dicaNota = (p, s) => { const d = decompor(p, M.criterios(), 'valor').filter(x => x.pontos > 0.05).sort((a, b) => b.pontos - a.pontos).slice(0, 3);
    return [`${p.codigo} · valor ${n1(s.valor)} (classe ${s.classe})`, d.length ? 'Maiores contribuições:' : 'Nenhuma pergunta pontuou', ...d.map(x => `${x.nome} +${fmt.n(x.pontos, 0)}`)].join('\n'); };
  /** Anel de progresso de respostas */
  const anel = (n, tot, s = 40) => { const r = s / 2 - 4, L = 2 * Math.PI * r, f = tot ? n / tot : 0;
    return `<svg class="pz-anel" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="#e3ebe5" stroke-width="4"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="#3E6801" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(f * L).toFixed(2)} ${L.toFixed(2)}" transform="rotate(-90 ${s / 2} ${s / 2})"/></svg>`; };

  /* ---------------------------------------- versões dos pesos (governança) */
  const versoes = () => { const v = GP.state().ui.versoesPesos; return Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && x.pesos && typeof x.pesos === 'object' && +x.n > 0) : []; };
  const pesosAtuais = () => Object.fromEntries(GP.state().criterios.map(c => [c.id, +c.peso]));
  const mesmosPesos = (a, b) => Object.keys(b).every(k => +a[k] === +b[k]);
  function registrarVersao(motivo){
    const S = GP.state(), vs = versoes(), n = (vs.length ? Math.max(...vs.map(v => +v.n || 0)) : 0) + 1;
    let autor = ''; try { const u = GP.auth && GP.auth.usuario && GP.auth.usuario(); autor = u && u.nome ? String(u.nome) : ''; } catch(e) {}
    vs.push({ n, data: new Date().toISOString(), autor: autor.slice(0, 80), motivo: String(motivo || '').trim().slice(0, 200), pesos: pesosAtuais() });
    S.ui.versoesPesos = vs.slice(-20); return n;
  }
  /** Versão vigente: a última, se os pesos atuais forem os dela */
  const versaoAtual = () => { const vs = versoes(), u = vs[vs.length - 1]; return u && mesmosPesos(u.pesos, pesosAtuais()) ? u : null; };
  const seloVersao = () => { const v = versaoAtual(), padrao = M.CRITERIOS_PADRAO.every(c => { const a = GP.state().criterios.find(x => x.id === c.id); return a && +a.peso === +c.peso; });
    const txt = v ? `Pesos v${v.n} · ${fmt.data(String(v.data).slice(0, 10))}` : padrao ? 'Pesos sugeridos' : 'Pesos ajustados';
    return `<a class="pz-versao" href="#/criterios" title="Ver critérios e versões dos pesos">${icon('pesos', 14)}<span>${esc(txt)}</span></a>`; };

  /* ------------------------------------------------------------ avaliar */
  const SEIS_MESES = 183 * 864e5;
  function telaAvaliar(el, r){
    if(r.arg) return formAvaliacao(el, r.arg);
    const lista = priorizaveis(), pend = pendentes(lista), feitos = lista.filter(p => !pend.includes(p)).sort((a, b) => (M.pontuar(b).valor || 0) - (M.pontuar(a).valor || 0));
    const pct = lista.length ? feitos.length / lista.length : 0;
    el.innerHTML = U.pageHead({ titulo:'Avaliar projetos', sub:'Responda as perguntas de cada projeto (nota de 0 a 3). O sistema calcula a nota de <b>valor</b> e de <b>esforço</b> com os pesos definidos em Critérios e pesos.',
        acoes: pend.length ? `<a class="btn btn-primary" href="#/avaliar/${esc(pend[0].id)}" data-proximo-pendente>${icon('avaliar', 16)} Avaliar próximo pendente</a>` : '' }) +
      (lista.length ? `<div class="card av-prog"><div class="av-prog-t"><b>${fmt.n(feitos.length)} de ${plural(lista.length, 'projeto avaliado', 'projetos avaliados')}</b>
          <span class="${pend.length ? 'av-falta' : 'av-ok'}">${pend.length ? `${plural(pend.length, 'pendente', 'pendentes')}` : `${icon('check', 14)} Fila em dia`}</span></div>
          <div class="pz-meter" role="progressbar" aria-label="Projetos avaliados" aria-valuemin="0" aria-valuemax="${lista.length}" aria-valuenow="${feitos.length}"><i style="width:${(pct * 100).toFixed(1)}%"></i></div></div>` +
      (pend.length ? `<section class="av-grupo">${U.secH(`A avaliar (${pend.length})`, 'Sem avaliação completa: não entram no ranking até todas as perguntas serem respondidas.')}
        ${U.table({ id:'avaliar-pend', rows: pend, rowAttr: p => `class="click" data-avaliar="${p.id}" tabindex="0"`, cols:[
          { key:'codigo', label:'Código', fmt:v => `<span class="code">${esc(v)}</span>` },
          { key:'titulo', label:'Projeto', main:true, fmt:(v, p) => `<b style="font-weight:600">${esc(v)}</b><small>${esc(p.gerencia)} · ${esc(p.tipo)}${p.obrigatorio ? ' · obrigatório' : ''}</small>` },
          { key:'etapa', label:'Etapa', fmt:v => GP.etapaPill(v), sortVal:p => M.etapa(p.etapa).ordem },
          { key:'situacao', label:'Situação', fmt:(v, p) => p.avaliacao && Object.keys(p.avaliacao.respostas || {}).length ? U.pill(`Faltam ${plural(M.pontuar(p).faltam, 'resposta', 'respostas')}`, 'warn') : quadPill(null), sortVal:p => M.pontuar(p).faltam },
          { key:'acao', label:'', sort:false, align:'r', fmt:() => `<span class="link">Avaliar →</span>` },
        ]})}</section>` : '') +
      (feitos.length ? `<section class="av-grupo">${U.secH(`Avaliados (${feitos.length})`, 'Revise a avaliação quando o projeto mudar ou a cada seis meses.')}
        ${U.table({ id:'avaliar', rows: feitos, rowAttr: p => `class="click" data-avaliar="${p.id}" tabindex="0"`, cols:[
          { key:'codigo', label:'Código', fmt:v => `<span class="code">${esc(v)}</span>` },
          { key:'titulo', label:'Projeto', main:true, fmt:(v, p) => `<b style="font-weight:600">${esc(v)}</b><small>${esc(p.gerencia)} · ${esc(p.tipo)}${p.obrigatorio ? ' · obrigatório' : ''}</small>` },
          { key:'etapa', label:'Etapa', fmt:v => GP.etapaPill(v), sortVal:p => M.etapa(p.etapa).ordem },
          { key:'valor', label:'Valor', align:'c', fmt:(v, p) => notaHtml(M.pontuar(p).valor), sortVal:p => M.pontuar(p).valor ?? -1 },
          { key:'esforco', label:'Esforço', align:'c', fmt:(v, p) => n1(M.pontuar(p).esforco), sortVal:p => M.pontuar(p).esforco ?? -1 },
          { key:'situacao', label:'Quadrante', fmt:(v, p) => quadPill(M.pontuar(p).quadrante), sortVal:p => QK.indexOf(M.pontuar(p).quadrante) },
          { key:'data', label:'Avaliado em', fmt:(v, p) => { const d = p.avaliacao && p.avaliacao.data, t = d ? new Date(d).getTime() : NaN, velho = !isNaN(t) && Date.now() - t > SEIS_MESES;
              return `<span class="av-data">${d ? fmt.data(String(d).slice(0, 10)) : '-'}</span>${velho ? ` <span class="pill t-warn av-revisar" title="Avaliada há mais de seis meses">${icon('relogio', 12)} revisar</span>` : ''}`; }, sortVal:p => (p.avaliacao && p.avaliacao.data) || '' },
          { key:'acao', label:'', sort:false, align:'r', fmt:() => `<span class="link">Revisar →</span>` },
        ]})}</section>` : '')
      : vazio('Nada para avaliar', 'Só são priorizados projetos que entraram no portfólio (aprovados, em execução, em espera) ou que estão em triagem.', '<a class="btn btn-primary" href="#/funil">Ir para o funil de entrada</a>', 'avaliar'));
  }

  function formAvaliacao(el, id){
    const p = P.get(id); if(!p){ el.innerHTML = vazio('Projeto não encontrado', '', '<a class="btn btn-primary" href="#/avaliar">Voltar</a>'); return; }
    const crit = M.criterios(), ativos = crit.filter(c => c.peso > 0), total = ativos.length;
    const resp = Object.assign({}, p.avaliacao && p.avaliacao.respostas), sug = {};
    crit.forEach(c => { if(resp[c.id] == null){ const s = M.sugestao(p, c.id); if(s != null) sug[c.id] = s; } });
    const prox = pendentes(P.todos()).find(x => x.id !== p.id);
    const somaEixo = eixo => crit.filter(c => c.eixo === eixo).reduce((a, c) => a + (+c.peso || 0), 0);
    let num = 0;
    const bloco = eixo => { const cs = crit.filter(c => c.eixo === eixo), sm = somaEixo(eixo);
      return `<div class="card stack aval-bloco" data-eixo="${eixo}" style="gap:14px">${U.secH(esc(M.EIXOS[eixo]), `${eixo === 'valor' ? 'Quanto maior, mais importante.' : 'Quanto maior, mais caro e arriscado de fazer: quanto menor, melhor.'} ${plural(cs.length, 'pergunta', 'perguntas')} · pesos somam ${fmt.n(sm)}%${sm !== 100 && sm ? ' (normalizados para 100)' : ''}.`)}
      <div class="regua regua-${eixo}" aria-hidden="true"><span>${eixo === 'valor' ? 'menos importante' : 'mais barato'}</span><i></i><span>${eixo === 'valor' ? 'mais importante' : 'mais caro'}</span></div>
      ${cs.map(c => { num++; const s = M.sugestao(p, c.id), pts = sm ? c.peso / sm * 100 : 0;
        return `<div class="crit" data-crit="${esc(c.id)}"><div class="crit-h"><div class="crit-t"><span class="crit-n">${num} de ${crit.length}</span><b id="q-${esc(c.id)}">${esc(c.nome)}</b><div class="muted crit-p">${esc(c.pergunta)}</div></div>
            <span class="peso-chip"><i class="pc-trilho" aria-hidden="true"><i style="width:${Math.min(100, +c.peso)}%"></i></i>Peso ${fmt.n(c.peso)}% · vale até ${fmt.n(pts, 0)} pts</span></div>
          <div class="escala" role="radiogroup" aria-labelledby="q-${esc(c.id)}">${c.niveis.map((t, v) => `<button type="button" data-c="${esc(c.id)}" data-v="${v}" role="radio" aria-checked="false" tabindex="-1"><b>${v}</b><span>${esc(t)}</span><i class="es-ok" aria-hidden="true">${icon('check', 12)}</i><em class="es-sug">Sugerido</em></button>`).join('')}</div>
          ${s != null ? `<div class="crit-sug">${icon('info', 13)} Sugestão a partir do cadastro: <b>${s}</b>. Clique numa opção para confirmar.</div>` : ''}</div>`; }).join('')}</div>`; };
    el.innerHTML = `<a class="link" href="#/avaliar" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:10px">${icon('voltar', 16)} Avaliar projetos</a>` +
      U.pageHead({ titulo:`Avaliar <span style="color:var(--ons)">${esc(p.codigo)}</span>`, sub: esc(p.titulo) + (p.obrigatorio ? ' · <b>obrigatório por lei/regulação</b>' : '') }) +
      `<div class="grid aval-grid"><div class="stack aval-col">${bloco('valor')}${bloco('esforco')}
          <label class="field">Observação (opcional)<input class="input" name="obs" maxlength="300" value="${esc(p.avaliacao && p.avaliacao.obs || '')}"></label>
          <div class="aval-barra" data-ar-barra><button type="button" class="ab-resumo" data-ar-abrir aria-label="Ver o resultado completo"></button><button type="button" class="btn btn-primary btn-sm" data-salvar-barra>${icon('check', 15)} Salvar</button></div></div>
        <div class="card stack aval-res" data-resultado>
          <div class="ar-h"><h3>Resultado</h3><span class="ar-prog" data-ar-prog></span></div>
          <div class="ar-vivo" data-ar-vivo aria-live="polite" aria-atomic="true"><p class="pz-sr" data-ar-frase></p></div>
          <div class="ar-corpo" data-ar-corpo></div>
          <div class="ar-acoes"><button class="btn btn-primary" data-salvar>${icon('check', 16)} Salvar avaliação</button>
            ${prox ? `<button class="btn btn-ghost" data-salvar-proximo hidden>Salvar e avaliar o próximo ${icon('seta', 15)}</button>` : ''}</div>
          <div class="ar-corpo" data-ar-dc></div>
          <p class="dim ar-nota">Cada resposta vale de 0% a 100% do peso da pergunta (0 = nada, 3 = tudo). A nota de cada eixo vai de 0 a 100. Pesos sugeridos, a validar pela FEG.</p></div></div>`;
    const sugPend = () => Object.keys(sug).filter(k => resp[k] == null);
    const estado = () => { const prev = Object.assign({}, resp); sugPend().forEach(k => prev[k] = sug[k]);
      const conf = M.pontuar({ avaliacao:{ respostas:resp } }, crit), sp = M.pontuar({ avaliacao:{ respostas:prev } }, crit), nSug = sugPend().length;
      return { conf, sp, nSug, prev, feitas: total - conf.faltam, faltamSemSug: conf.faltam - nSug }; };
    const corpo = st => { const { sp, conf, nSug, prev } = st, nenhuma = st.feitas + nSug === 0;
      const dVal = decompor({ respostas:prev }, crit, 'valor'), dEsf = decompor({ respostas:prev }, crit, 'esforco');
      const numeros = nenhuma ? `<div class="ar-inicio">${anel(0, total, 64)}<div><b>0 de ${total} respondidas</b><span>Responda as perguntas ao lado: a nota aparece aqui, ao vivo.</span></div></div>`
        : `<div class="ar-num"><div><span class="ar-l">Valor</span><strong class="ar-v">${sp.valor == null ? '–' : n1(sp.valor)}</strong><span class="ar-s">${sp.valor == null ? `${plural(dVal.filter(x => x.resp == null).length, 'pergunta sem resposta', 'perguntas sem resposta')}` : `classe ${sp.classe} · quanto maior, melhor`}</span></div>
            <div class="ar-esf"><span class="ar-l">Esforço</span><strong class="ar-v">${sp.esforco == null ? '–' : n1(sp.esforco)}</strong><span class="ar-s">${sp.esforco == null ? `${plural(dEsf.filter(x => x.resp == null).length, 'pergunta sem resposta', 'perguntas sem resposta')}` : 'quanto menor, melhor'}</span></div></div>`;
      const status = conf.completo ? `<div class="ar-q">${quadPill(conf.quadrante)}<p>${esc(M.QUADRANTES[conf.quadrante].desc)}</p></div>`
        : `<div class="ar-q">${sp.completo ? `${quadPill(sp.quadrante)}<p>Prévia: confirme ${nSug === 1 ? 'a sugestão' : 'as sugestões'} para fechar a nota.</p>` : ''}
            <div class="ar-falta">${st.faltamSemSug > 0 ? U.pill(`Faltam ${plural(st.faltamSemSug, 'resposta', 'respostas')}`, 'warn') : ''}${nSug ? `<span class="pill qpill q-sug">${plural(nSug, 'sugestão a confirmar', 'sugestões a confirmar')}</span>` : ''}</div>
            ${nSug ? `<button type="button" class="btn btn-ghost btn-sm" data-aceitar-sug>${icon('check', 14)} Aceitar ${nSug === 1 ? 'sugestão' : 'sugestões'}</button>` : ''}</div>`;
      return { topo: numeros + status, dc: nenhuma ? '' : `<div class="ar-dc"><p class="ar-dc-t">Por que esta nota?</p>${decompHtml(dVal, 'valor')}${decompHtml(dEsf, 'esforco')}</div>` }; };
    const frase = st => { const { sp, conf } = st;
      if(conf.completo) return `Valor ${n1(conf.valor)}, Esforço ${n1(conf.esforco)}, quadrante ${M.QUADRANTES[conf.quadrante].nome}.`;
      return `${st.feitas} de ${total} respondidas${st.nSug ? `, ${plural(st.nSug, 'sugestão', 'sugestões')} a confirmar` : ''}. Valor ${sp.valor == null ? 'incompleto' : n1(sp.valor)}, Esforço ${sp.esforco == null ? 'incompleto' : n1(sp.esforco)}.`; };
    const desenhar = () => {
      const st = estado();
      el.querySelectorAll('.escala').forEach(g => { const bs = [...g.querySelectorAll('[data-c]')], c = bs[0] && bs[0].dataset.c; let foco = null;
        bs.forEach(b => { const v = +b.dataset.v, on = resp[c] === v, sg = resp[c] == null && sug[c] === v; b.classList.toggle('on', on); b.classList.toggle('sug', sg); b.setAttribute('aria-checked', on); if(on) foco = b; });
        bs.forEach(b => b.tabIndex = b === (foco || bs[0]) ? 0 : -1); });
      el.querySelector('[data-ar-prog]').innerHTML = `${anel(st.feitas, total, 28)}<span>${st.feitas} de ${total}</span>`;
      const cp = corpo(st); el.querySelector('[data-ar-corpo]').innerHTML = cp.topo; el.querySelector('[data-ar-dc]').innerHTML = cp.dc;
      const fr = el.querySelector('[data-ar-frase]'), txt = frase(st); if(fr.textContent !== txt) fr.textContent = txt;
      const bp = el.querySelector('[data-salvar-proximo]'); if(bp) bp.hidden = !st.conf.completo;
      el.querySelector('[data-ar-abrir]').innerHTML = `<span class="ab-p">${anel(st.feitas, total, 22)}<b>${st.feitas}/${total}</b></span><span>Valor <b>${st.sp.valor == null ? '–' : n1(st.sp.valor)}</b></span><span>Esforço <b>${st.sp.esforco == null ? '–' : n1(st.sp.esforco)}</b></span>`;
    };
    const obsVal = () => el.querySelector('[name=obs]').value;
    const salvar = proximo => {
      const r = P.avaliar(p.id, resp, obsVal()), s = r && r.s; GP.closeModal();
      if(!s || !s.completo){ avisar(`Salvo · faltam ${plural(s ? s.faltam : total, 'resposta', 'respostas')} em <b>${esc(p.codigo)}</b>.`); GP.go('#/avaliar'); return; }
      const outro = pendentes(P.todos()).find(x => x.id !== p.id);
      if(proximo && outro){ GP.go('#/avaliar/' + outro.id); avisar(`Avaliação de <b>${esc(p.codigo)}</b> salva.`, 'Ver no ranking', () => verNoRanking(p.id)); return; }
      verNoRanking(p.id);
      const nP = pendentes(P.todos()).length;
      if(outro) avisar(`Avaliação de <b>${esc(p.codigo)}</b> salva. Ainda ${nP === 1 ? 'falta 1 projeto' : `faltam ${nP} projetos`} na fila.`, 'Avaliar próximo', () => GP.go('#/avaliar/' + outro.id));
      else avisar(`Avaliação de <b>${esc(p.codigo)}</b> salva. Fila de avaliação em dia.`);
    };
    const irProxima = c => { const cs = [...el.querySelectorAll('.crit[data-crit]')], i = cs.findIndex(x => x.dataset.crit === c);
      const alvo = cs.slice(i + 1).find(x => resp[x.dataset.crit] == null); if(!alvo) return;
      const rr = alvo.getBoundingClientRect(); if(rr.top > window.innerHeight * .62 || rr.bottom > window.innerHeight - 90) alvo.scrollIntoView({ block:'center', behavior: rolarSuave() }); };
    const marcar = (c, v, rolar) => { const antes = resp[c]; resp[c] = v; desenhar(); if(rolar && antes == null) irProxima(c); };
    const aceitar = () => { sugPend().forEach(k => resp[k] = sug[k]); desenhar(); };
    el.addEventListener('click', e => {
      const b = e.target.closest('.escala [data-c]'); if(b){ marcar(b.dataset.c, +b.dataset.v, true); return; }
      if(e.target.closest('[data-aceitar-sug]')){ aceitar(); return; }
      if(e.target.closest('[data-salvar]') || e.target.closest('[data-salvar-barra]')){ salvar(false); return; }
      if(e.target.closest('[data-salvar-proximo]')){ salvar(true); return; }
      if(e.target.closest('[data-ar-abrir]')) folha();
    });
    el.addEventListener('keydown', e => {
      const b = e.target.closest && e.target.closest('.escala [data-c]'); if(!b) return;
      const grupo = [...b.parentNode.querySelectorAll('[data-c]')], i = grupo.indexOf(b), k = e.key; let j = null, rolar = false;
      if(k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % grupo.length; else if(k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + grupo.length) % grupo.length;
      else if(k === 'Home') j = 0; else if(k === 'End') j = grupo.length - 1; else if(/^[0-3]$/.test(k) && +k < grupo.length){ j = +k; rolar = true; }
      if(j == null) return; e.preventDefault(); marcar(b.dataset.c, +grupo[j].dataset.v, rolar); grupo[j].focus({ preventScroll: rolar });
    });
    /* Celular: o resumo da barra fixa abre o resultado completo numa folha */
    function folha(){
      const st = estado();
      const m = GP.modal(`<h3>Resultado de ${esc(p.codigo)}</h3><p class="muted">${esc(frase(st))}</p><div class="aval-folha">${corpo(st).topo}${corpo(st).dc}</div>
        <div class="m-act"><button class="btn btn-ghost" data-close="1">Continuar respondendo</button><button class="btn btn-primary" data-salvar-folha>${icon('check', 16)} Salvar avaliação</button></div>`);
      if(!m) return;
      m.addEventListener('click', e => { if(e.target.closest('[data-salvar-folha]')) salvar(false); else if(e.target.closest('[data-aceitar-sug]')){ aceitar(); GP.closeModal(); folha(); } });
    }
    desenhar();
  }
  document.addEventListener('click', e => { const a = e.target.closest('[data-avaliar]'); if(a) GP.go('#/avaliar/' + a.dataset.avaliar); });
  document.addEventListener('keydown', e => { if(e.key === 'Enter' && e.target.closest && e.target.closest('[data-avaliar]')) GP.go('#/avaliar/' + e.target.closest('[data-avaliar]').dataset.avaliar); });

  /* ------------------------------------------------------------ ranking */
  const ESCOPOS = [['aguardando', 'Aguardando início (aprovados)'], ['ativos', 'Todos os ativos'], ['todos', 'Histórico (inclui concluídos)']];
  const noEscopo = (p, e) => e === 'aguardando' ? p.etapa === 'aprovado' : e === 'ativos' ? M.ETAPAS_PRIORIZAVEIS.includes(p.etapa) : true;
  let filtroQ = null, destacar = null;
  /** Leva ao ranking com o projeto visível: ajusta o escopo para um que contenha a etapa, limpa o filtro e destaca a linha. */
  function verNoRanking(id){
    const p = P.get(id), ui = GP.state().ui; if(!p) return;
    if(!noEscopo(p, ui.rankEscopo || 'aguardando')) ui.rankEscopo = M.ETAPAS_PRIORIZAVEIS.includes(p.etapa) ? 'ativos' : 'todos';
    filtroQ = null; destacar = id; GP.save(); GP.go('#/ranking');
  }
  /** Faixa de síntese: prontos para decisão e mistura por quadrante (cada trecho filtra) */
  function sintese(rk, pend){
    const cont = QK.map(k => [k, rk.filter(x => x.s.quadrante === k).length]);
    return `<section class="pz-sintese" aria-label="Síntese da priorização">
      <div class="ps-num"><strong>${fmt.n(rk.length)}</strong><span>${rk.length === 1 ? 'pronto' : 'prontos'} para decisão</span></div>
      <div class="ps-mix"><div class="ps-bar">${rk.length ? cont.filter(([, n]) => n).map(([k, n]) => { const Q = M.QUADRANTES[k], on = filtroQ === k;
          return `<button type="button" class="ps-seg${on ? ' on' : ''}${filtroQ && !on ? ' off' : ''}" data-filtro-q="${k}" style="flex:${n} 1 0;background:${Q.cor}" aria-pressed="${on}" aria-label="${esc(Q.nome)}: ${plural(n, 'projeto', 'projetos')}. ${on ? 'Remover filtro' : 'Filtrar por este quadrante'}" data-tt="${esc(Q.nome)}&#10;${plural(n, 'projeto', 'projetos')}&#10;${on ? 'Clique para remover o filtro' : 'Clique para filtrar'}">${n}</button>`; }).join('') : '<span class="ps-vazia"></span>'}</div>
        <div class="ps-leg">${cont.map(([k, n]) => `<span class="${filtroQ === k ? 'on' : ''}">${glifo(k, 12, M.QUADRANTES[k].cor)}${esc(M.QUADRANTES[k].nome)} <b>${n}</b></span>`).join('')}</div></div>
      <div class="ps-meta">${seloVersao()}${pend.length ? `<a class="ps-pend" href="#/avaliar/${esc(pend[0].id)}">${icon('avaliar', 14)}<span>${plural(pend.length, 'aguarda', 'aguardam')} avaliação</span></a>` : ''}</div></section>`;
  }
  const chipFiltro = () => filtroQ ? `<button type="button" class="chip on pz-fq" data-filtro-q="${filtroQ}" aria-label="Remover filtro de quadrante">${glifo(filtroQ, 12)} ${esc(M.QUADRANTES[filtroQ].nome)} ${icon('x', 13)}</button>` : '';
  const filtros = (escopo, extra = '') => `<div class="filters"><div class="chips" role="group" aria-label="Escopo">${ESCOPOS.map(([k, l]) => `<button class="chip ${escopo === k ? 'on' : ''}" data-escopo="${k}" aria-pressed="${escopo === k}">${esc(l)}</button>`).join('')}</div>${chipFiltro()}${extra}</div>`;
  const ligarFiltros = el => {
    el.querySelectorAll('[data-escopo]').forEach(b => b.onclick = () => { GP.state().ui.rankEscopo = b.dataset.escopo; filtroQ = null; GP.save(); GP.refresh(); });
    el.querySelectorAll('[data-filtro-q]').forEach(b => b.onclick = () => { filtroQ = filtroQ === b.dataset.filtroQ ? null : b.dataset.filtroQ; GP.refresh(); });
  };
  const fteTxt = p => p.esforcoFte != null ? fmt.n(p.esforcoFte, 1) + ' FTE' : 'sem FTE';
  const medidor = v => `<span class="pz-meter rk-meter" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, v || 0))}%"></i><b style="left:${M.CORTE.classeB}%"></b><b style="left:${M.CORTE.classeA}%"></b></span>`;
  const empateTxt = 'Empate em valor; desempate por menor esforço';

  function telaRanking(el){
    const ui = GP.state().ui, escopo = ui.rankEscopo || 'aguardando', topo = ui.rankObrig !== false, hist = escopo === 'todos';
    const base = P.todos().filter(p => noEscopo(p, escopo)), rk = M.ranking(base, { obrigatoriosNoTopo: topo });
    rk.forEach((x, i) => { const eq = y => y && Math.abs(y.s.valor - x.s.valor) < 0.05 && (!topo || !!y.p.obrigatorio === !!x.p.obrigatorio); x.empate = eq(rk[i - 1]) || eq(rk[i + 1]); });
    if(filtroQ && !rk.some(x => x.s.quadrante === filtroQ)) filtroQ = null;
    const linhas = filtroQ ? rk.filter(x => x.s.quadrante === filtroQ) : rk;
    const semNota = pendentes(base), dest = destacar; destacar = null;
    const podio = !hist && linhas.length ? `<div class="pz-podio" aria-label="Três primeiros">${linhas.slice(0, 3).map(x => `<a class="pd-card${x.p.id === dest ? ' destaque' : ''}" href="#/projeto/${esc(x.p.id)}" data-rank-id="${esc(x.p.id)}">
        <span class="pd-pos">${x.pos}º</span><span class="pd-cod"><span class="code">${esc(x.p.codigo)}</span>${x.p.obrigatorio ? ' <span class="tag">obrigatório</span>' : ''}</span>
        <b class="pd-tit">${esc(x.p.titulo)}</b><span class="pd-l">${notaHtml(x.s.valor, dicaNota(x.p, x.s))}${quadPill(x.s.quadrante)}<span class="pd-fte">${fteTxt(x.p)}</span></span></a>`).join('')}</div>` : '';
    const projCel = v => `<div class="rk-proj"><div class="rk-l1"><span class="code">${esc(v.codigo)}</span> <b>${esc(v.titulo)}</b>${v.obrigatorio ? ' <span class="tag">obrigatório</span>' : ''}</div><small>${esc(v.gerencia)} · ${esc(v.tipo)} · ${esc(M.etapa(v.etapa).nome)}</small></div>`;
    el.innerHTML = U.pageHead({ titulo:'Ranking de prioridade', sub: hist ? 'Histórico: todos os projetos avaliados, inclusive concluídos, cancelados e fora da carteira. Serve para consulta, não é a ordem de início.' : 'Ordem sugerida para a equipe começar os projetos. A decisão final é do comitê; o ranking é o ponto de partida da conversa.',
        acoes:`${GP.botaoPDF()}<a class="btn btn-ghost" href="#/criterios">${icon('pesos', 16)} Ajustar pesos</a>` }) +
      sintese(rk, pendentes(P.todos())) +
      filtros(escopo, `<label class="row pz-topo"><input type="checkbox" data-topo ${topo ? 'checked' : ''}> Obrigatórios no topo</label>`) +
      (linhas.length ? podio + `<div class="rk-tabela">${U.table({ cols:[
          { key:'pos', label:'#', sort:false, fmt:(v, x) => `<span class="rk-pos">${v}${x.empate ? `<i class="rk-eq" title="${empateTxt}" aria-label="${empateTxt}">=</i>` : ''}</span>` },
          { key:'p', label:'Projeto', main:true, fmt: projCel },
          { key:'s', label:`Valor · A ≥${M.CORTE.classeA} · B ≥${M.CORTE.classeB}`, fmt:(v, x) => `<div class="rk-val">${notaHtml(v.valor, dicaNota(x.p, v))}${medidor(v.valor)}</div>` },
          { key:'esf', label:'Esforço · FTE', fmt:(v, x) => `<div class="rk-esf" title="Esforço de 0 a 100: menor é melhor"><span><b>${n1(x.s.esforco)}</b><span class="rk-mini" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, x.s.esforco))}%"></i></span></span><small>${fteTxt(x.p)}</small></div>` },
          { key:'q', label:'Quadrante', fmt:(v, x) => quadPill(x.s.quadrante) },
          ...(hist ? [{ key:'et', label:'Etapa', fmt:(v, x) => GP.etapaPill(x.p.etapa) }] : []),
        ], rows: linhas.map(x => Object.assign({}, x, { esf:'', q:'', et:'' })), rowAttr: x => `class="click${x.p.id === dest ? ' destaque' : ''}" data-abrir="${esc(x.p.id)}" data-rank-id="${esc(x.p.id)}" tabindex="0"` })}</div>
        <ol class="rank-cards" aria-label="Ranking">${linhas.map(x => `<li><a class="rc${x.p.id === dest ? ' destaque' : ''}" href="#/projeto/${esc(x.p.id)}" data-rank-id="${esc(x.p.id)}">
          <span class="rc-h"><span class="rc-pos">${x.pos}</span><span class="code">${esc(x.p.codigo)}</span>${x.empate ? `<i class="rk-eq" title="${empateTxt}">=</i>` : ''}${x.p.obrigatorio ? '<span class="tag">obrigatório</span>' : ''}</span>
          <b class="rc-t">${esc(x.p.titulo)}</b>
          <span class="rc-v">Valor ${notaHtml(x.s.valor)}${medidor(x.s.valor)}<span class="rc-sep">·</span>Esforço <b>${n1(x.s.esforco)}</b></span>
          <span class="rc-c">${quadPill(x.s.quadrante)}<span class="rc-fte">${fteTxt(x.p)}</span>${hist ? GP.etapaPill(x.p.etapa) : ''}</span></a></li>`).join('')}</ol>`
        : vazio(filtroQ ? 'Nenhum projeto neste quadrante' : 'Ranking vazio', filtroQ ? 'Remova o filtro de quadrante para ver os demais.' : 'Nenhum projeto avaliado neste filtro.', '<a class="btn btn-primary" href="#/avaliar">Avaliar projetos</a>', 'ranking')) +
      (semNota.length ? `<section class="card pz-pend" style="margin-top:16px">${U.secH(`Aguardando avaliação (${semNota.length})`, 'Entram no ranking quando todas as perguntas forem respondidas.')}
        <ul class="pz-pend-l">${semNota.map(q => { const f = M.pontuar(q).faltam, parcial = q.avaliacao && Object.keys(q.avaliacao.respostas || {}).length;
          return `<li><a href="#/avaliar/${esc(q.id)}"><span class="pp-ic">${icon('avaliar', 16)}</span><span class="pp-t"><span class="code">${esc(q.codigo)}</span> ${esc(q.titulo)}<small>${esc(M.etapa(q.etapa).nome)} · ${parcial ? `faltam ${plural(f, 'resposta', 'respostas')}` : 'não avaliado'}</small></span><span class="link">Avaliar →</span></a></li>`; }).join('')}</ul></section>` : '') +
      comoCalcula();
    ligarFiltros(el);
    el.querySelector('[data-topo]').onchange = e => { ui.rankObrig = e.target.checked; GP.save(); GP.refresh(); };
    if(dest) setTimeout(() => { const alvo = [...el.querySelectorAll(`[data-rank-id="${CSS.escape(dest)}"]`)].find(n => n.offsetParent && !n.closest('.pz-podio')); if(alvo) alvo.scrollIntoView({ block:'center', behavior: rolarSuave() }); }, 90);
  }
  /** Cartão explicativo com minidiagrama: resposta → % do peso → soma → classe → quadrante */
  const comoCalcula = () => `<section class="card pz-como" aria-labelledby="pz-como-t"><div class="pc-h">${icon('info', 18)}<h3 id="pz-como-t">Como a nota é calculada</h3></div>
    <ol class="pz-fluxo">
      <li><b>Resposta</b><span>0 a 3 em cada pergunta</span></li>
      <li><b>% do peso</b><span>0 → 0% · 1 → 33% · 2 → 67% · 3 → 100%</span></li>
      <li><b>Soma</b><span>valor e esforço, cada um de 0 a 100</span></li>
      <li><b>Classe</b><span>A ≥ ${M.CORTE.classeA} · B ≥ ${M.CORTE.classeB} · C abaixo</span></li>
      <li><b>Quadrante</b><span>corte ${M.CORTE.valor} em valor e ${M.CORTE.esforco} em esforço</span></li></ol>
    <p class="muted pc-p">Projetos obrigatórios por lei ou regulação podem ficar no topo. Empates em valor (marcados com <b>=</b>) são decididos pelo menor esforço. Passe o mouse no selo da nota para ver as maiores contribuições.</p></section>`;

  /* ------------------------------------------------------------- matriz */
  let mtzRedesenhar = null, mtzT = null;
  window.addEventListener('resize', () => { clearTimeout(mtzT); mtzT = setTimeout(() => { if(mtzRedesenhar && document.querySelector('[data-mtz]')) mtzRedesenhar(); }, 160); }, { passive:true });
  function telaMatriz(el){
    const ui = GP.state().ui, escopo = ui.rankEscopo || 'aguardando';
    const rkAll = M.ranking(P.todos().filter(p => noEscopo(p, escopo)));
    if(filtroQ && !rkAll.some(x => x.s.quadrante === filtroQ)) filtroQ = null;
    const rk = filtroQ ? rkAll.filter(x => x.s.quadrante === filtroQ) : rkAll;
    const porQ = k => rk.filter(x => x.s.quadrante === k);
    const quadCard = k => { const Q = M.QUADRANTES[k], xs = porQ(k);
      return `<div class="card mtz-q">${quadPill(k)}<p class="muted mq-d">${esc(Q.desc)}</p>
        ${xs.length ? `<ul class="mq-l">${xs.map(x => `<li><a href="#/projeto/${esc(x.p.id)}" data-mtz-item="${esc(x.p.id)}" data-cod="${esc(x.p.codigo)}"><b class="mq-n" hidden></b><span class="code">${esc(x.p.codigo)}</span><span class="mq-t">${esc(x.p.titulo)}</span><span class="mq-v">${n1(x.s.valor)} / ${n1(x.s.esforco)}</span></a></li>`).join('')}</ul>` : '<span class="dim mq-vazio">Nenhum projeto</span>'}</div>`; };
    el.innerHTML = U.pageHead({ titulo:'Matriz valor × esforço', sub:'Onde cada projeto avaliado cai. Comece pelos ganhos rápidos, planeje os estratégicos e questione os do quadrante “repensar”.', acoes: GP.botaoPDF() }) +
      sintese(rkAll, pendentes(P.todos())) + filtros(escopo) +
      (rkAll.length ? `<div class="mtz-layout"><div class="card mtz-card"><div class="mtz-area" data-mtz></div>
          <p class="dim mtz-nota"><span class="mtz-nota-fte">Tamanho da bolha = pessoas (FTE). </span>Clique numa bolha ou num item da lista para abrir o projeto. Nas listas, ao lado de cada projeto: valor / esforço.</p></div>
        <div class="mtz-quads">${QK.map(quadCard).join('')}</div></div>`
      : `<div class="card mtz-vazio"><div class="mtz-fantasma" aria-hidden="true"><span class="mf-y">Valor →</span><span class="mf-x">Esforço →</span>${QK.map(k => `<div class="mf-q mf-${k}" style="background:${hexA(M.QUADRANTES[k].cor, .06)}">${glifo(k, 18, M.QUADRANTES[k].cor)}<b>${esc(M.QUADRANTES[k].nome)}</b><span>${esc(M.QUADRANTES[k].desc)}</span></div>`).join('')}</div>
          <div class="mtz-vazio-t"><h3>Nenhum projeto avaliado neste filtro</h3><p class="muted">Quando os projetos forem avaliados, cada um aparece como uma bolha num destes quatro quadrantes.</p><a class="btn btn-primary" href="#/avaliar">${icon('avaliar', 16)} Avaliar projetos</a></div></div>`);
    ligarFiltros(el);
    const box = el.querySelector('[data-mtz]');
    if(!box){ mtzRedesenhar = null; return; }
    const desenhar = () => {
      const w = Math.max(260, Math.floor(box.clientWidth)), estreito = w < 720;
      const pts = rk.map(x => ({ x:x.s.esforco, y:x.s.valor, r: 7 + Math.min(10, (x.p.esforcoFte || 1) * 2), fte: x.p.esforcoFte, label:x.p.codigo, id:x.p.id, color:M.QUADRANTES[x.s.quadrante].cor, quadrante:x.s.quadrante,
        title:`${x.p.codigo} · ${x.p.titulo}\nValor ${n1(x.s.valor)} · Esforço ${n1(x.s.esforco)}` }));
      box.innerHTML = GP.charts.matriz(pts, { w, numerar: estreito, xMax:100, yMax:100, qx:M.CORTE.esforco, qy:M.CORTE.valor, xLabel:'Esforço', yLabel:'Valor',
        quadrantes: QK.map(k => M.QUADRANTES[k].nome), quadrantesCor: QK.map(k => M.QUADRANTES[k].cor) });
      // Numeração: a legenda numérica do gráfico vira o número de cada item das listas por quadrante
      const mapa = {}; box.querySelectorAll('.mtz-key span').forEach(s => { const b = s.querySelector('b'); if(!b) return; s.textContent.replace(b.textContent, '').split(',').forEach(c => { mapa[c.trim()] = b.textContent.trim(); }); });
      const numerado = Object.keys(mapa).length > 0; box.classList.toggle('mtz-numerada', numerado);
      const nf = el.querySelector('.mtz-nota-fte'); if(nf) nf.hidden = !!box.querySelector('.mtz-size');
      el.querySelectorAll('[data-mtz-item]').forEach(a => { const nb = a.querySelector('.mq-n'), v = mapa[a.dataset.cod]; nb.hidden = !v; nb.textContent = v || ''; });
      box.querySelectorAll('[data-ponto]').forEach(g => g.addEventListener('click', () => GP.go('#/projeto/' + g.dataset.ponto)));
    };
    mtzRedesenhar = desenhar; desenhar();
    const hl = id => { el.querySelectorAll('.hl').forEach(n => n.classList.remove('hl')); box.classList.toggle('tem-hl', !!id);
      if(id) el.querySelectorAll(`[data-ponto="${CSS.escape(id)}"], [data-mtz-item="${CSS.escape(id)}"]`).forEach(n => n.classList.add('hl')); };
    const alvo = e => { const t = e.target.closest && e.target.closest('[data-mtz-item],[data-ponto]'); return t ? (t.dataset.mtzItem || t.dataset.ponto) : null; };
    el.addEventListener('mouseover', e => hl(alvo(e)));
    el.addEventListener('focusin', e => hl(alvo(e)));
    el.addEventListener('focusout', () => hl(null));
  }

  /* ---------------------------------------------------- critérios e pesos */
  let guardaCrit = null, rascGuardado = null;
  const ehCriterios = h => /^#\/?criterios(\?|$)/.test(h || '');
  const hashDe = url => { const k = String(url || '').indexOf('#'); return k < 0 ? '' : String(url).slice(k); };
  const confirmarSaida = destino => GP.confirmar('Descartar pesos não salvos?', '<p>Você mudou pesos e ainda não salvou. Se sair agora, as mudanças se perdem.</p>', 'Descartar e sair',
    () => { guardaCrit = null; rascGuardado = null; location.hash = destino; }, { perigo:true });
  /* Guarda de saída, 1: cliques em links internos (menu, dock, atalhos) com pesos não salvos pedem confirmação antes de navegar. */
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if(!a || !guardaCrit || !document.querySelector('[data-tela-criterios]') || !guardaCrit()) return;
    const destino = a.getAttribute('href'); if(ehCriterios(destino) || e.defaultPrevented) return;
    e.preventDefault(); e.stopPropagation(); confirmarSaida(destino);
  }, true);
  /* Guarda de saída, 2: outras trocas de rota (voltar do navegador, atalhos) reabrem os critérios com o rascunho e pedem confirmação. */
  window.addEventListener('hashchange', e => {
    if(!guardaCrit) return;
    if(!ehCriterios(hashDe(e.oldURL)) || ehCriterios(location.hash)) return;
    if(!guardaCrit()){ guardaCrit = null; return; }
    const destino = location.hash; rascGuardado = guardaCrit.rasc;
    try { history.replaceState(null, '', e.oldURL); } catch(x) {}
    GP.refresh(); confirmarSaida(destino);
  });
  const corPeso = (eixo, i) => coresEixo(eixo)[i % coresEixo(eixo).length];
  function telaCriterios(el){
    const S = GP.state(), ui = S.ui, topo = ui.rankObrig !== false;
    const rasc = S.criterios.map(c => { const g = rascGuardado && rascGuardado.find(r => r.id === c.id); return { id:c.id, peso: g ? g.peso : c.peso }; }); rascGuardado = null;
    const crOf = id => S.criterios.find(c => c.id === id);
    const soma = eixo => rasc.filter(r => crOf(r.id).eixo === eixo).reduce((a, r) => a + (+r.peso || 0), 0);
    const sujo = () => rasc.some(r => +r.peso !== +crOf(r.id).peso);
    guardaCrit = sujo; sujo.rasc = rasc;
    const bloco = eixo => { const cs = S.criterios.filter(c => c.eixo === eixo);
      return `<div class="card stack crit-bloco" style="gap:10px">${U.secH(esc(M.EIXOS[eixo]), `${plural(cs.length, 'pergunta', 'perguntas')}. Os pesos deste eixo precisam somar 100%.`)}
      <div class="pb" data-barra="${eixo}"></div>
      ${cs.map((c, i) => `<div class="peso-row"><div><b><i class="pw-dot" style="background:${corPeso(eixo, i)}"></i>${esc(c.nome)}</b><div class="muted" style="font-size:12.5px">${esc(c.pergunta)}</div></div>
        <input type="range" min="0" max="60" step="1" value="${+(rasc.find(r => r.id === c.id).peso)}" data-peso="${esc(c.id)}" aria-label="Peso de ${esc(c.nome)} (controle deslizante, 0 a 60%)">
        <span class="row" style="gap:4px;flex-wrap:nowrap"><input class="input num" style="width:62px;padding:6px 8px;text-align:right" inputmode="numeric" value="${+(rasc.find(r => r.id === c.id).peso)}" data-peso-n="${esc(c.id)}" aria-label="Peso de ${esc(c.nome)} em %">%</span></div>`).join('')}
      <div class="row pb-soma"><span class="muted">Soma <button class="btn btn-ghost btn-sm" data-normalizar="${eixo}" style="margin-left:8px">Ajustar para 100%</button></span><b data-soma="${eixo}"></b></div></div>`; };
    const vs = versoes().slice().reverse(), atual = versaoAtual();
    el.innerHTML = `<div data-tela-criterios hidden></div>` + U.pageHead({ titulo:'Critérios e pesos', sub:'Defina a importância (%) de cada pergunta. A prévia mostra o efeito no ranking antes de salvar. Os pesos iniciais são uma sugestão para a FEG validar.',
        acoes:`<button class="btn btn-ghost" data-restaurar>${icon('relogio', 16)} Restaurar sugestão</button>` }) +
      `<div class="grid aval-grid crit-grid"><div class="stack">${bloco('valor')}${bloco('esforco')}
        <div class="card crit-salvar"><label class="field">Motivo da mudança (opcional)<input class="input" name="motivo" maxlength="200" placeholder="Ex.: deliberação do comitê de 05/10"></label>
          <div class="row"><button class="btn btn-primary" data-salvar-pesos>${icon('check', 16)} Salvar pesos</button><button type="button" class="btn btn-ghost" data-previa-movel>${icon('ranking', 16)} Efeito no ranking</button><span class="dim" data-aviso style="font-size:12.5px"></span></div></div>
        <div class="card crit-versoes">${U.secH('Versões dos pesos', 'Cada vez que os pesos são salvos, uma versão fica registrada (até 20) para a governança.')}
          ${vs.length ? `<ul class="cv-l">${vs.map(v => `<li class="${atual && atual.n === v.n ? 'atual' : ''}"><span class="cv-n">v${v.n}</span><span class="cv-t"><b>${fmt.data(String(v.data).slice(0, 10))}${v.autor ? ' · ' + esc(v.autor) : ''}</b><small>${v.motivo ? esc(v.motivo) : 'Sem motivo registrado'}</small></span>
              ${atual && atual.n === v.n ? '<span class="pill t-ok"><i></i>Em uso</span>' : `<button type="button" class="btn btn-ghost btn-sm" data-restaurar-versao="${v.n}">Restaurar esta versão</button>`}</li>`).join('')}</ul>`
            : '<p class="dim" style="margin:0">Nenhuma versão salva ainda. Os pesos em uso são os sugeridos.</p>'}</div></div>
        <div class="card stack crit-previa" style="gap:10px" data-previa-card></div></div>`;
    const previaHtml = () => {
      const crit = S.criterios.map(c => Object.assign({}, c, { peso: +rasc.find(r => r.id === c.id).peso }));
      const aprov = P.todos().filter(p => p.etapa === 'aprovado'), antes = {};
      M.ranking(aprov, { obrigatoriosNoTopo: topo }).forEach(x => antes[x.p.id] = x.pos);
      const rk = M.ranking(aprov, { obrigatoriosNoTopo: topo }, crit);
      return U.secH(`Projetos aprovados (${rk.length})`, `Simulação com os pesos ao lado${topo ? ', obrigatórios no topo (como no ranking)' : ''}. ▲ sobe e ▼ desce em relação aos pesos salvos.`) +
        (rk.length ? `<ol class="pv-l">${rk.map(x => { const d = (antes[x.p.id] || x.pos) - x.pos;
          return `<li><b class="pv-pos">${x.pos}</b><span class="pv-mov ${d > 0 ? 'sobe' : d < 0 ? 'desce' : ''}" ${d ? `aria-label="${d > 0 ? 'sobe' : 'desce'} ${Math.abs(d)}"` : 'aria-label="sem mudança"'}>${d > 0 ? '▲' + d : d < 0 ? '▼' + Math.abs(d) : '–'}</span>${notaHtml(x.s.valor)}<span class="pv-t"><span class="code">${esc(x.p.codigo)}</span> ${esc(x.p.titulo)}${x.p.obrigatorio ? ' <span class="tag">obrigatório</span>' : ''}</span></li>`; }).join('')}</ol>`
          : '<span class="dim">Avalie projetos aprovados para ver a prévia.</span>');
    };
    const barra = eixo => { const cs = S.criterios.filter(c => c.eixo === eixo), sm = soma(eixo), esc0 = Math.max(100, sm), w = v => (v / esc0 * 100).toFixed(2) + '%';
      return `<div class="pb-bar" role="img" aria-label="Distribuição dos pesos: ${esc(cs.map(c => `${c.nome} ${rasc.find(r => r.id === c.id).peso}%`).join(', '))}. Soma ${sm}%.">${cs.map((c, i) => { const v = +rasc.find(r => r.id === c.id).peso; return v ? `<span class="pb-seg" style="width:${w(v)};background:${corPeso(eixo, i)}" data-tt="${esc(c.nome)}&#10;${v}%"></span>` : ''; }).join('')}
        ${sm < 100 ? `<span class="pb-falta" style="width:${w(100 - sm)}" data-tt="Faltam ${100 - sm}%"></span>` : ''}${sm > 100 ? `<span class="pb-excesso" style="left:${w(100)};width:${w(sm - 100)}" data-tt="Excesso de ${sm - 100}%"></span>` : ''}<b class="pb-100" style="left:${w(100)}"></b></div>
        <div class="pb-esc"><span>0%</span><span>${sm > 100 ? `<b class="pb-x">${sm - 100}% acima</b>` : sm < 100 ? `faltam ${100 - sm}%` : 'completo'}</span><span>100%</span></div>`; };
    const atualizar = () => {
      ['valor', 'esforco'].forEach(e => { const sm = soma(e), b = el.querySelector(`[data-soma="${e}"]`); b.textContent = sm + '%'; b.style.color = sm === 100 ? 'var(--ons)' : 'var(--bad)';
        el.querySelector(`[data-normalizar="${e}"]`).hidden = sm === 100; el.querySelector(`[data-barra="${e}"]`).innerHTML = barra(e); });
      const ok = soma('valor') === 100 && soma('esforco') === 100;
      el.querySelector('[data-salvar-pesos]').disabled = !ok;
      el.querySelector('[data-aviso]').textContent = ok ? (sujo() ? 'Há mudanças não salvas.' : '') : 'Ajuste para que cada eixo some exatamente 100%.';
      el.querySelector('[data-previa-card]').innerHTML = previaHtml();
    };
    const definir = (id, v) => { v = Math.max(0, Math.min(100, Math.round(+v) || 0)); rasc.find(r => r.id === id).peso = v;
      const rg = el.querySelector(`[data-peso="${id}"]`), nb = el.querySelector(`[data-peso-n="${id}"]`); if(rg && +rg.value !== v) rg.value = v; if(nb && document.activeElement !== nb) nb.value = v; atualizar(); };
    el.querySelectorAll('[data-peso]').forEach(i => i.addEventListener('input', () => { definir(i.dataset.peso, i.value); el.querySelector(`[data-peso-n="${i.dataset.peso}"]`).value = i.value; }));
    el.querySelectorAll('[data-peso-n]').forEach(i => { i.addEventListener('input', () => { if(i.value.trim() !== '') definir(i.dataset.pesoN, GP.util.numBR(i.value)); }); i.addEventListener('blur', () => { i.value = rasc.find(r => r.id === i.dataset.pesoN).peso; }); });
    el.querySelectorAll('[data-normalizar]').forEach(b => b.onclick = () => { const ids = S.criterios.filter(c => c.eixo === b.dataset.normalizar).map(c => c.id), rs = rasc.filter(r => ids.includes(r.id)), tot = rs.reduce((a, r) => a + r.peso, 0);
      if(!tot){ rs.forEach((r, i) => r.peso = Math.floor(100 / rs.length) + (i < 100 % rs.length ? 1 : 0)); }
      else { rs.forEach(r => r.peso = Math.floor(r.peso / tot * 100)); let resto = 100 - rs.reduce((a, r) => a + r.peso, 0); rs.slice().sort((a, b) => b.peso - a.peso).forEach(r => { if(resto > 0){ r.peso++; resto--; } }); }
      rs.forEach(r => { el.querySelector(`[data-peso="${r.id}"]`).value = r.peso; el.querySelector(`[data-peso-n="${r.id}"]`).value = r.peso; }); atualizar(); });
    el.querySelector('[data-salvar-pesos]').onclick = () => { S.criterios.forEach(c => c.peso = +rasc.find(r => r.id === c.id).peso);
      const n = registrarVersao(el.querySelector('[name=motivo]').value); guardaCrit = null; GP.save(); GP.toast(`Pesos salvos como v${n}. O ranking foi recalculado.`); GP.refresh(); };
    el.querySelector('[data-previa-movel]').onclick = () => GP.modal(`<h3>Efeito no ranking</h3><p class="muted">Como a ordem dos aprovados fica com os pesos que você está ajustando.</p><div class="crit-previa-folha">${previaHtml()}</div><div class="m-act"><button class="btn btn-primary" data-close="1">Voltar aos pesos</button></div>`);
    const aplicar = (pesos, motivo, msg, desfazer) => { const antes = pesosAtuais(), vsAntes = (S.ui.versoesPesos || []).slice();
      S.criterios.forEach(c => { if(pesos[c.id] != null) c.peso = +pesos[c.id]; }); registrarVersao(motivo); guardaCrit = null; GP.save(); GP.refresh();
      avisar(msg, 'Desfazer', () => { S.criterios.forEach(c => { if(antes[c.id] != null) c.peso = antes[c.id]; }); S.ui.versoesPesos = vsAntes; GP.save(); GP.refresh(); GP.toast('Pesos anteriores de volta.'); }); };
    el.querySelector('[data-restaurar]').onclick = () => GP.confirmar('Restaurar pesos sugeridos?', '<p>Os pesos voltam aos valores iniciais. As respostas dos projetos não mudam. Você poderá desfazer logo em seguida.</p>', 'Restaurar',
      () => aplicar(Object.fromEntries(M.CRITERIOS_PADRAO.map(c => [c.id, c.peso])), 'Pesos sugeridos restaurados', 'Pesos sugeridos restaurados.'));
    el.querySelectorAll('[data-restaurar-versao]').forEach(b => b.onclick = () => { const v = versoes().find(x => +x.n === +b.dataset.restaurarVersao); if(!v) return;
      aplicar(v.pesos, `Restaurada a v${v.n}`, `Pesos da v${v.n} reaplicados.`); });
    atualizar();
  }

  /* ---------------------------------------------- ficha e acervo (nível 2) */
  GP.fichaSecoes.push({ id:'priorizacao', nivel:2, ordem:20, titulo:'Priorização',
    render: p => { const s = M.pontuar(p);
      if(!p.avaliacao) return `<p class="muted" style="margin:0 0 10px">Ainda não avaliado.</p><a class="btn btn-primary btn-sm" href="#/avaliar/${p.id}">${icon('avaliar', 15)} Avaliar</a>`;
      const resp = p.avaliacao.respostas;
      return `<div class="row" style="margin-bottom:10px">Valor ${notaHtml(s.valor)} Esforço <b>${n1(s.esforco)}</b> ${quadPill(s.quadrante)}<span class="spacer"></span><a class="btn btn-ghost btn-sm" href="#/avaliar/${p.id}">Revisar</a></div>
        ${p.avaliacao.data ? `<p class="dim" style="margin:0 0 10px;font-size:12.5px">Avaliado em ${fmt.data(String(p.avaliacao.data).slice(0, 10))}.</p>` : ''}
        <div class="ficha-dc"><p class="ar-dc-t">Por que esta nota?</p>${decompHtml(decompor(p, M.criterios(), 'valor'), 'valor')}${decompHtml(decompor(p, M.criterios(), 'esforco'), 'esforco')}</div>
        <div class="stack" style="gap:4px">${M.criterios().map(c => `<div class="row" style="flex-wrap:nowrap;font-size:13px;justify-content:space-between"><span>${esc(c.nome)} <span class="dim">(${c.peso}%)</span></span><span>${resp[c.id] != null ? `<b>${resp[c.id]}</b> · ${esc(c.niveis[resp[c.id]])}` : '<span class="dim">sem resposta</span>'}</span></div>`).join('')}</div>`;
    } });
  GP.acervoColunas.push({ nivel:2, coluna:{ key:'valorNota', label:'Valor', align:'c', fmt:(v, p) => notaHtml(M.pontuar(p).valor), sortVal:p => M.pontuar(p).valor ?? -1 } });

  GP.priorizacao = { decompHtml, glifo, versaoAtual, verNoRanking, seloVersao };
  GP.tela({ id:'avaliar', nivel:2, ordem:10, titulo:'Avaliar projetos', icone:'avaliar', render: telaAvaliar });
  GP.tela({ id:'ranking', nivel:2, ordem:11, titulo:'Ranking', icone:'ranking', render: telaRanking });
  GP.tela({ id:'matriz', nivel:2, ordem:12, titulo:'Matriz valor × esforço', icone:'matriz', render: telaMatriz });
  GP.tela({ id:'criterios', nivel:2, ordem:13, titulo:'Critérios e pesos', icone:'pesos', render: telaCriterios });
})();
