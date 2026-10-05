/* =========================================================================
   Nível 1 - Funil de entrada: checklist "entra / não entra" e quadro por etapa
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt } = GP.util, icon = GP.icon;
  const OP = GP.operacao, plural = OP.plural;
  const resPill = r => r ? U.pill(M.RESULTADO_ENTRADA[r].nome, M.RESULTADO_ENTRADA[r].tom) : U.pill('Não avaliado', 'neutral');
  /** Identidade visual de cada resultado do checklist */
  const VEREDITO = { entra:{ cls:'t-ok', ic:'check' }, falta_info:{ cls:'t-warn', ic:'info' }, nao_entra:{ cls:'t-bad', ic:'alerta' }, incompleto:{ cls:'t-neutral', ic:'relogio' } };
  const NOME_CAMPO = { descricao:'descrição', beneficio:'benefício esperado', demandante:'demandante', patrocinador:'patrocinador', esforcoFte:'estimativa de esforço', duracaoMeses:'estimativa de duração' };

  /* ---------------------------------------- títulos parecidos (pergunta 3) */
  const STOP = new Set('de da do das dos e a o as os para com em no na nos nas por um uma ao aos exemplo que se sem sob entre novo nova'.split(' '));
  const tokens = s => new Set(GP.util.normTxt(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
  function parecidos(p){
    const a = tokens(p.titulo); if(!a.size) return [];
    return P.todos().filter(x => x.id !== p.id).map(x => { const b = tokens(x.titulo); let c = 0; a.forEach(w => { if(b.has(w)) c++; }); return { x, c, s: c && b.size ? c / Math.sqrt(a.size * b.size) : 0 }; })
      .filter(o => o.c >= 1 && o.s >= .2).sort((m, n) => n.s - m.s).slice(0, 3).map(o => o.x);
  }
  OP.parecidos = parecidos;

  /* ------------------------------------------------- modal do checklist */
  GP.abrirEntrada = id => {
    const p = P.get(id); if(!p) return;
    OP.ocultarToast();
    const resp = Object.assign({}, p.entrada && p.entrada.respostas), sug = {};
    if(!p.entrada) M.ENTRADA.forEach(q => { if(q.sugerir && !resp[q.id]){ resp[q.id] = q.sugerir(p) ? 'sim' : 'nao'; sug[q.id] = true; } });
    const iguais = parecidos(p);
    const m = GP.modal(`<h3>Checklist de entrada · ${esc(p.codigo)}</h3><p class="muted" style="margin:0 0 14px">${esc(p.titulo)}</p>
      <div class="op-qgrupos" data-perguntas></div>
      <div data-resultado class="op-resultado"></div>
      <label class="field op-obs"><span class="lbl">Observação <span class="dim">(opcional, fica no histórico)</span></span><input class="input" name="obs" maxlength="300" value="${esc(p.entrada && p.entrada.obs || '')}"></label>
      <div class="m-act op-entrada-act"><span class="op-vm" data-vered-mini aria-hidden="true"></span><span class="spacer"></span><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn btn-primary" data-registrar>Registrar decisão</button></div>`, {largo:true});
    m.classList.add('op-entrada');
    const aviso = q => {
      if(!q.sugerir || sug[q.id] || !resp[q.id]) return '';
      const indica = q.sugerir(p), campos = (OP.CAMPOS_ENTRADA[q.id] || []);
      if(resp[q.id] === 'sim' && !indica){
        const faltam = campos.filter(k => p[k] == null || String(p[k]).trim() === ''), alvo = faltam[0] || campos[0];
        const lista = q.id === 'E6' ? 'estimativa de esforço nem de duração' : faltam.map(k => NOME_CAMPO[k]).join(' nem ');
        return `<p class="op-q-aviso">${icon('alerta', 14)}<span>O cadastro não tem ${esc(lista)}. <a href="#/novo/${p.id}?campo=${alvo}">Completar agora</a></span></p>`;
      }
      if(resp[q.id] === 'nao' && indica) return `<p class="op-q-aviso">${icon('info', 14)}<span>O cadastro já tem ${esc(campos.filter(k => p[k] != null && String(p[k]).trim() !== '').map(k => NOME_CAMPO[k]).join(' e '))}. Se não basta, explique na observação.</span></p>`;
      return '';
    };
    const linha = (q, i) => {
      const r = resp[q.id], bar = q.tipo === 'barreira';
      const est = r === 'sim' ? 'is-sim' : r === 'nao' ? (bar ? 'is-nao-bar' : 'is-nao-info') : '';
      const indica = q.sugerir ? (q.sugerir(p) ? 'Sim' : 'Não') : null;
      const extra = q.id === 'E3' ? `<div class="op-q-parecidos">${iguais.length ? `<span>Parecidos no acervo:</span><ul>${iguais.map(x => `<li><a href="#/projeto/${x.id}"><span class="code">${esc(x.codigo)}</span> ${esc(x.titulo)}</a></li>`).join('')}</ul>` : '<span>Nenhum título parecido no acervo.</span>'}</div>` : '';
      return `<li class="op-q ${est} ${sug[q.id] ? 'is-sug' : ''}" data-qrow="${q.id}"><span class="op-q-n" aria-hidden="true">${i + 1}</span>
        <div class="op-q-txt"><div class="op-q-p" id="op-q-${q.id}">${i + 1}. ${esc(q.pergunta)}</div>
          ${indica ? `<div class="op-q-dica">O cadastro indica: <b>${indica}</b>${sug[q.id] ? ' <span class="op-selo op-selo-sug">sugerido pelo cadastro · confirme</span>' : ''}</div>` : ''}${aviso(q)}${extra}</div>
        <div class="seg op-seg" role="radiogroup" aria-labelledby="op-q-${q.id}">${['sim', 'nao'].map(v => `<button type="button" class="${r === v ? 'on' : ''} v-${v}" data-q="${q.id}" data-v="${v}" role="radio" aria-checked="${r === v}">${v === 'sim' ? 'Sim' : 'Não'}</button>`).join('')}</div></li>`;
    };
    const grupo = (tipo, titulo, cons, ic) => { const qs = M.ENTRADA.map((q, i) => [q, i]).filter(([q]) => q.tipo === tipo);
      return `<section class="op-qgrupo op-qg-${tipo}"><header><span class="op-qg-ic">${icon(ic, 16)}</span><div><h4>${titulo}</h4><p>${cons}</p></div></header><ol class="op-qs">${qs.map(([q, i]) => linha(q, i)).join('')}</ol></section>`; };
    const desenhar = () => {
      m.querySelector('[data-perguntas]').innerHTML =
        grupo('barreira', 'Critérios eliminatórios (1 a 3)', 'Se alguma resposta for “Não”, a demanda <b>não entra</b> no portfólio.', 'alerta') +
        grupo('informacao', 'Informações mínimas (4 a 6)', 'Se alguma resposta for “Não”, <b>falta informação</b> e a demanda volta ao demandante.', 'info');
      const r = M.avaliarEntrada(resp), R = M.RESULTADO_ENTRADA[r.resultado], V = VEREDITO[r.resultado];
      const total = M.ENTRADA.length, feitas = total - r.pendentes.length;
      m.querySelector('[data-resultado]').innerHTML = `<div class="op-veredito ${V.cls}" role="status"><span class="op-v-ic">${icon(V.ic, 20)}</span><div class="op-v-txt">
        <span class="op-eyebrow">Resultado</span><b class="op-v-nome">${esc(R.nome)}</b>
        ${r.resultado === 'incompleto' ? `<p>${feitas} de ${total} respondidas</p><div class="op-v-prog" aria-hidden="true"><i style="width:${feitas / total * 100}%"></i></div>` : ''}
        ${r.motivos.length ? `<ul class="op-v-motivos">${r.motivos.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${R.etapa ? `<p class="op-v-dest">O projeto vai para <b>${esc(M.etapa(R.etapa).nome)}</b>.</p>` : ''}</div></div>`;
      m.querySelector('[data-vered-mini]').className = `op-vm ${V.cls}`;
      m.querySelector('[data-vered-mini]').innerHTML = `${icon(V.ic, 16)}<span>${esc(R.nome)}${r.resultado === 'incompleto' ? ` · ${feitas}/${total}` : ''}</span>`;
      m.querySelector('[data-registrar]').disabled = r.resultado === 'incompleto';
    };
    m.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if(!b) return;
      resp[b.dataset.q] = b.dataset.v; delete sug[b.dataset.q]; desenhar();
      const n = m.querySelector(`[data-q="${b.dataset.q}"][data-v="${b.dataset.v}"]`); if(n) n.focus(); });
    m.querySelector('[data-registrar]').onclick = () => {
      const res = P.registrarEntrada(p.id, resp, m.querySelector('[name=obs]').value);
      if(!res.ok){ GP.toast('Responda todas as perguntas.'); return; }
      GP.closeModal(); GP.toast(`${esc(p.codigo)}: <b>${esc(M.RESULTADO_ENTRADA[res.r.resultado].nome)}</b>`); GP.refresh();
    };
    desenhar();
  };

  /* --------------------------------------------------------------- tela */
  const ORDEM_FUNIL = ['entrada', 'triagem', 'aprovado', 'execucao', 'concluido'];
  const SAIDAS = ['espera', 'nao_entra', 'cancelado'];
  const REGRA = [
    ['t-ok', 'check', 'Entra', 'Entra no portfólio\nAs 6 respostas são “Sim”.\nVai para Admitido · aguardando priorização.'],
    ['t-warn', 'info', 'Falta informação', 'Falta informação\n“Não” em alguma das perguntas 4 a 6.\nVolta ao demandante, em triagem.'],
    ['t-bad', 'alerta', 'Não entra', 'Não entra\n“Não” em alguma das perguntas 1 a 3.\nO motivo fica registrado no histórico.'],
  ];
  const kcard = p => `<a class="kcard op-kcard" href="#/projeto/${p.id}"><span class="code">${esc(p.codigo)}</span><span class="op-k-tit" title="${esc(p.titulo)}">${esc(p.titulo)}</span><small>${esc([p.gerencia, p.tipo].filter(Boolean).join(' · '))}</small>
    <span class="op-k-pe">${p.responsavel ? `<span class="op-ini" title="Responsável: ${esc(p.responsavel)}" aria-label="Responsável: ${esc(p.responsavel)}">${esc(OP.iniciais(p.responsavel))}</span>` : '<span class="op-ini vazio" title="Sem responsável" aria-label="Sem responsável">?</span>'}<span>${esc(OP.txtNaEtapa(p))}</span></span></a>`;
  function tela(el, r){
    const todos = P.todos(), aba = r.query.aba === 'quadro' ? 'quadro' : 'fila';
    const head = acoes => U.pageHead({ titulo:'Funil de entrada', sub:'Toda demanda passa por um checklist de 6 perguntas antes de entrar no portfólio.', acoes });
    if(!todos.length){
      el.innerHTML = `<div class="op-funil">${head('')}` + OP.passos({ titulo:'O funil começa com o primeiro cadastro', sub:'Cada projeto ou demanda passa por três passos simples antes de entrar no portfólio.',
        passos:[['novo', 'Cadastre', 'Registre o projeto ou demanda com as informações mínimas.'], ['funil', 'Responda o checklist', 'Seis perguntas de Sim ou Não, em cerca de 1 minuto.'], ['check', 'Veja a decisão', 'Entra no portfólio, falta informação ou não entra, sempre com o motivo.']] }) + '</div>';
      return;
    }
    const cont = id => todos.filter(p => p.etapa === id).length;
    const maxc = Math.max(1, ...ORDEM_FUNIL.map(cont));
    const fluxo = `<nav class="operation-flow op-flow" aria-label="Projetos por etapa">${ORDEM_FUNIL.map((id, i) => { const e = M.etapa(id), n = cont(id);
        return `<a href="#/funil?aba=quadro" data-tt="${esc(e.nome)}&#10;${esc(plural(n, 'projeto', 'projetos'))}" aria-label="${esc(e.nome)}: ${esc(plural(n, 'projeto', 'projetos'))}"><span>${i + 1} · ${esc(e.nome)}</span><strong>${n}</strong><i class="op-flow-bar" aria-hidden="true"><b style="width:${n ? Math.max(4, n / maxc * 100) : 0}%"></b></i></a>`; }).join('')}
      <a href="#/funil?aba=quadro" class="op-flow-saidas" aria-label="Saídas: ${SAIDAS.map(id => esc(M.etapa(id).nome) + ' ' + cont(id)).join(', ')}"><span>Saídas</span><ul>${SAIDAS.map(id => { const e = M.etapa(id); return `<li><i class="op-dot t-${e.tom}"></i><em>${esc(e.nome)}</em><b>${cont(id)}</b></li>`; }).join('')}</ul></a></nav>`;
    const fila = todos.filter(p => p.etapa === 'entrada' || p.etapa === 'triagem').sort((a, b) => (a.dataEntrada || '').localeCompare(b.dataEntrada || ''));
    const corpoFila = fila.length ? `<div class="op-fila">${fila.map(p => { const d = OP.dias(p.dataEntrada);
        const sla = d == null ? '' : `<span class="op-sla ${d > 90 ? 't-bad' : d > 30 ? 't-warn' : ''}" title="Na fila desde ${fmt.data(p.dataEntrada)}">${icon('relogio', 13)} ${esc(plural(d, 'dia', 'dias'))} na fila</span>`;
        return `<article class="card op-fila-item"><div class="op-fi-main"><div class="op-fi-tit"><span class="code">${esc(p.codigo)}</span> <b>${esc(p.titulo)}</b></div>
            <div class="op-fi-meta">${esc([p.gerencia, p.tipo, p.demandante].filter(Boolean).join(' · '))}</div></div>
          <div class="op-fi-status">${GP.etapaPill(p.etapa)}${p.entrada ? resPill(p.entrada.resultado) : ''}${sla}</div>
          <div class="op-fi-acoes"><button class="btn btn-primary btn-sm" data-entrada="${p.id}">${icon('funil', 15)} ${p.entrada ? 'Reavaliar entrada' : 'Avaliar entrada'}</button>
            <a class="icon-btn op-fi-abrir" href="#/projeto/${p.id}" aria-label="Abrir ficha de ${esc(p.codigo)}" title="Abrir ficha">${OP.ic.dir(18)}</a></div></article>`; }).join('')}</div>`
      : OP.vazio('Fila de entrada vazia', 'Nenhuma demanda aguarda o checklist. Novos cadastros aparecem aqui.', `<a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo cadastro</a>`, 'funil');
    const coluna = id => { const e = M.etapa(id), ps = todos.filter(p => p.etapa === id);
      return `<section class="col op-col t-${e.tom}" aria-label="${esc(e.nome)}: ${esc(plural(ps.length, 'projeto', 'projetos'))}"><header class="col-h"><span class="op-col-nome" title="${esc(e.nome)}">${esc(e.nome)}</span><b class="op-cnt">${ps.length}</b></header>
        ${ps.map(kcard).join('') || '<div class="op-col-vazia">Nada nesta etapa</div>'}</section>`; };
    const quadro = `<div class="quadro op-quadro"><div class="op-fluxo" data-fluxo>${ORDEM_FUNIL.map(coluna).join('')}</div><div class="op-fluxo-ind" aria-hidden="true"><span data-fluxo-pos>1</span>/${ORDEM_FUNIL.length}</div>
      <div class="op-saidas"><h3>Saídas do fluxo</h3><div class="op-saidas-g">${SAIDAS.map(id => { const e = M.etapa(id), ps = todos.filter(p => p.etapa === id);
        return `<details class="col op-saida" ${ps.length && ps.length <= 6 ? 'open' : ''}><summary><span class="op-col-nome"><i class="op-dot t-${e.tom}"></i>${esc(e.nome)}</span><b class="op-cnt">${ps.length}</b><span class="op-chev">${OP.ic.dir(15)}</span></summary>
          <div class="op-saida-cards">${ps.map(kcard).join('') || '<div class="op-col-vazia">Nenhum projeto</div>'}</div></details>`; }).join('')}</div></div></div>`;
    el.innerHTML = `<div class="op-funil">` + head(`<a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo cadastro</a>`) +
      `<div class="op-funil-bar">${U.tabs('#/funil', [['fila', `Fila de entrada (${fila.length})`], ['quadro', 'Quadro por etapa']], aba)}
        <div class="op-regra"><span class="op-regra-l">Regra do checklist</span>${REGRA.map(([c, ic, t, tt]) => `<span class="op-res ${c}" tabindex="0" data-tt="${esc(tt).replace(/\n/g, '&#10;')}" aria-label="${esc(tt.replace(/\n/g, '. '))}">${icon(ic, 14)}${esc(t)}</span>`).join('')}</div></div>
      ${fluxo}
      <div class="op-funil-corpo">${aba === 'quadro' ? quadro : corpoFila}</div></div>`;
    const fl = el.querySelector('[data-fluxo]'), pos = el.querySelector('[data-fluxo-pos]');
    if(fl && pos) fl.addEventListener('scroll', () => { const c = fl.firstElementChild; if(!c) return; const w = c.getBoundingClientRect().width + 10; pos.textContent = Math.min(ORDEM_FUNIL.length, Math.round(fl.scrollLeft / w) + 1); }, { passive:true });
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-entrada]'); if(b) GP.abrirEntrada(b.dataset.entrada); });

  /* ----------------------------------------------- seção na ficha do projeto */
  GP.fichaSecoes.push({ id:'entrada', nivel:1, ordem:10, titulo:'Entrada no portfólio',
    render: p => {
      const e = p.entrada;
      if(!e) return `<p class="muted" style="margin:0 0 12px">Ainda não passou pelo checklist de entrada.</p><button class="btn btn-ghost btn-sm" data-entrada="${p.id}">${icon('funil', 15)} Avaliar entrada</button>`;
      const V = VEREDITO[e.resultado] || VEREDITO.incompleto;
      return `<div class="op-ent-h"><span class="op-vm ${V.cls}">${icon(V.ic, 16)}<span>${esc(M.RESULTADO_ENTRADA[e.resultado].nome)}</span></span><span class="dim" style="font-size:12.5px">em ${fmt.dataHora(e.data)}</span><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-entrada="${p.id}">Reavaliar</button></div>
        ${e.motivos && e.motivos.length ? `<ul class="op-v-motivos" style="margin:0 0 12px">${e.motivos.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <ol class="op-ent-lista">${M.ENTRADA.map((q, i) => `<li><span class="op-ent-r">${e.respostas[q.id] === 'sim' ? U.pill('Sim', 'ok') : e.respostas[q.id] === 'nao' ? U.pill('Não', q.tipo === 'barreira' ? 'bad' : 'warn') : U.pill('Sem resposta', 'neutral')}</span><span>${i + 1}. ${esc(q.pergunta)}</span></li>`).join('')}</ol>
        ${e.obs ? `<p class="muted" style="margin:10px 0 0">Obs.: ${esc(e.obs)}</p>` : ''}`;
    } });

  GP.tela({ id:'funil', nivel:1, ordem:4, titulo:'Funil de entrada', icone:'funil', render: tela });
})();
