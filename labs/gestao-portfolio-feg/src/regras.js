/* =========================================================================
   Dados e configurações → Regras do portfólio
   Um rascunho das regras (listas do cadastro, checklist de entrada e réguas da priorização) é editado na tela
   e só vale depois de "Salvar e aplicar", que grava uma nova versão (GP.modelo.salvarConfig) e redesenha o sistema.
   Pesos das perguntas e capacidade continuam nas próprias telas; aqui aparecem como atalhos.
   GP.configRegras(host) desenha a aba dentro de host.
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, M = GP.modelo, icon = GP.icon, { esc, fmt } = GP.util;
  const plural = GP.util.plural;
  const clone = o => JSON.parse(JSON.stringify(o));
  let R = null, hostAtual = null;   // rascunho em memória: sobrevive à troca de aba e de tela até salvar ou descartar

  /* ---------------------------------------------------------------- rascunho */
  function novoRascunho(c = GP.state().config){
    return { base: GP.state().config.versao,
      listas: { gerencias: c.listas.gerencias.map(g => ({ id: g.id, nome: g.nome, nova: !GP.state().config.listas.gerencias.some(x => x.id === g.id) })),
        tipos: c.listas.tipos.map(t => ({ v: t, orig: GP.state().config.listas.tipos.includes(t) ? t : null })),
        origens: c.listas.origens.map(t => ({ v: t, orig: GP.state().config.listas.origens.includes(t) ? t : null })) },
      entrada: clone(c.entrada), corte: Object.assign({}, c.corte) };
  }
  const paraConfig = () => ({ listas: { gerencias: R.listas.gerencias.map(g => ({ id: String(g.id).trim().toUpperCase(), nome: String(g.nome).trim() })),
    tipos: R.listas.tipos.map(t => t.v.trim()), origens: R.listas.origens.map(t => t.v.trim()) },
    entrada: R.entrada.map(q => Object.assign({}, q, { pergunta: q.pergunta.trim(), seNao: q.seNao.trim() })), corte: Object.assign({}, R.corte) });
  const renomes = () => { const r = { tipos: {}, origens: {} };
    ['tipos', 'origens'].forEach(k => R.listas[k].forEach(t => { if(t.orig && t.v.trim() && t.v.trim() !== t.orig) r[k][t.orig] = t.v.trim(); })); return r; };
  const mudancas = () => { if(!R) return []; const atual = GP.state().config;
    return M.diffConfig(atual, M.limparConfig(Object.assign(paraConfig(), { versao: atual.versao })), renomes()).resumo; };
  /** Problemas que impedem salvar, em linguagem simples. */
  function problemas(){
    const out = [], c = paraConfig();
    const dup = (xs, rot) => { const vs = new Set(); xs.forEach(x => { const k = x.toLowerCase(); if(vs.has(k)) out.push(`${rot} repetido: “${x}”.`); vs.add(k); }); };
    if(c.listas.gerencias.some(g => !g.id || !/^[A-Z0-9-]{1,12}$/.test(g.id))) out.push('Toda gerência precisa de uma sigla (letras e números, até 12).');
    if(c.listas.gerencias.some(g => !g.nome)) out.push('Toda gerência precisa de um nome.');
    dup(c.listas.gerencias.map(g => g.id), 'Sigla de gerência');
    [['tipos', 'Tipo'], ['origens', 'Origem']].forEach(([k, rot]) => { if(c.listas[k].some(t => !t)) out.push(`Há um ${rot.toLowerCase()} sem nome.`); dup(c.listas[k].filter(Boolean), rot); });
    ['gerencias', 'tipos', 'origens'].forEach(k => { if(!c.listas[k].length) out.push('Cada lista precisa de pelo menos um item.'); });
    if(!c.entrada.some(q => q.ativa)) out.push('Deixe pelo menos uma pergunta do checklist ligada.');
    if(c.entrada.some(q => q.ativa && q.pergunta.length < 5)) out.push('Toda pergunta ligada precisa de um texto.');
    const k = c.corte, int = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
    if(!int(k.valor, 5, 95) || !int(k.esforco, 5, 95)) out.push('Os cortes da matriz vão de 5 a 95.');
    if(!int(k.classeA, 1, 100) || !int(k.classeB, 0, 99)) out.push('As classes usam números inteiros de 0 a 100.');
    else if(k.classeB >= k.classeA) out.push('A classe B precisa começar abaixo da classe A.');
    return [...new Set(out)];
  }

  /* ---------------------------------------------------------------- uso nos projetos */
  const projetos = () => GP.projetos.todos();
  const uso = (campo, v) => v == null ? 0 : projetos().filter(p => p[campo] === v).length;

  /* ---------------------------------------------------------------- peças visuais */
  /** Botão "?" com o efeito da regra e o jeito de alterar (dica do sistema: data-tt, mouse e foco). */
  const ajuda = (titulo, efeito, como) => `<button type="button" class="cfg-ajuda" data-tt="${esc(titulo)}&#10;Efeito: ${esc(efeito)}&#10;Como alterar: ${esc(como)}" aria-label="${esc(`${titulo}. Efeito: ${efeito} Como alterar: ${como}`)}">?</button>`;
  const cab = (n, titulo, sub, aj) => `<header class="cfg-cab"><span class="cfg-n" aria-hidden="true">${n}</span><div><h3>${titulo} ${aj}</h3><p>${sub}</p></div></header>`;

  function cartaoListas(){
    const L = R.listas;
    const ger = L.gerencias.map((g, i) => { const n = g.nova ? 0 : uso('gerencia', g.id);
      return `<li class="cfg-it">${g.nova ? `<input class="input cfg-sigla-in" data-ger-id="${i}" value="${esc(g.id)}" maxlength="12" placeholder="Sigla" aria-label="Sigla da nova gerência">` : `<span class="cfg-sigla" title="A sigla identifica a gerência nos projetos e não muda">${esc(g.id)}</span>`}
        <input class="input" data-ger-nome="${i}" value="${esc(g.nome)}" maxlength="120" aria-label="Nome da gerência ${esc(g.id)}">
        ${remover('gerencias', i, n, `a gerência ${g.id}`)}</li>`; }).join('');
    const coluna = (k, titulo, campo, aj, ph) => `<div class="cfg-col"><h4>${titulo} ${aj}</h4><ul class="cfg-lista">${L[k].map((t, i) => `<li class="cfg-it">
        <input class="input" data-item="${k}:${i}" value="${esc(t.v)}" maxlength="60" aria-label="${titulo}: item ${i + 1}">${remover(k, i, uso(campo, t.orig), `“${t.v}”`)}</li>`).join('')}</ul>
      <div class="cfg-add"><input class="input" data-novo="${k}" maxlength="60" placeholder="${ph}" aria-label="${ph}"><button type="button" class="btn btn-ghost btn-sm" data-add="${k}">${icon('novo', 14)} Incluir</button></div></div>`;
    return `<section class="card cfg-card" aria-labelledby="cfg-t-listas">${cab(1, '<span id="cfg-t-listas">Listas do cadastro</span>', 'As opções que aparecem nos formulários, nos filtros e nos indicadores.',
        ajuda('Listas do cadastro', 'muda as opções dos campos Gerência, Tipo e Origem em todo o sistema (cadastro, filtros, planilha e indicadores).', 'edite o texto, inclua no fim da lista ou remova itens sem uso. Renomear um tipo ou origem atualiza os projetos que já usam o nome antigo.'))}
      <div class="cfg-listas">
        <div class="cfg-col"><h4>Gerências ${ajuda('Gerências', 'define as gerências que podem ser escolhidas e aparecem nos gráficos.', 'mude o nome à vontade. A sigla é fixa depois de salva. Só dá para remover uma gerência sem projetos.')}</h4>
          <ul class="cfg-lista">${ger}</ul>
          <div class="cfg-add cfg-add-ger"><input class="input cfg-sigla-in" data-novo="ger-id" maxlength="12" placeholder="Sigla" aria-label="Sigla da nova gerência"><input class="input" data-novo="ger-nome" maxlength="120" placeholder="Nome da nova gerência" aria-label="Nome da nova gerência"><button type="button" class="btn btn-ghost btn-sm" data-add="gerencias">${icon('novo', 14)} Incluir</button></div></div>
        ${coluna('tipos', 'Tipos', 'tipo', ajuda('Tipos', 'classifica cada registro (projeto, evolução, adequação…) nos filtros e indicadores.', 'edite, inclua ou remova tipos sem uso.'), 'Novo tipo')}
        ${coluna('origens', 'Origens', 'origem', ajuda('Origens', 'indica de onde veio a demanda e aparece nos filtros e indicadores.', 'edite, inclua ou remova origens sem uso.'), 'Nova origem')}
      </div></section>`;
  }
  function remover(k, i, n, nome){
    const so = R.listas[k].length <= 1;
    const dica = n ? `Em uso por ${plural(n, 'projeto', 'projetos')}. Para remover, mude esses projetos antes.` : so ? 'A lista precisa de pelo menos um item.' : `Remover ${nome}`;
    return `<span class="cfg-uso" title="${esc(dica)}">${n ? plural(n, 'projeto', 'projetos') : 'sem uso'}</span><button type="button" class="icon-btn cfg-rem" data-rem="${k}:${i}" aria-label="${esc(dica)}" title="${esc(dica)}" ${n || so ? 'disabled' : ''}>${icon('x', 15)}</button>`;
  }

  function cartaoChecklist(){
    const ativas = R.entrada.filter(q => q.ativa), elim = ativas.filter(q => q.tipo === 'barreira').length;
    const uE = M.ultimaMudanca('entrada'), antigas = uE ? projetos().filter(p => p.entrada && (p.entrada.cfg || 0) < uE).length : 0;
    const efeito = q => q.tipo === 'barreira' ? '<span class="cfg-ef bad">Não → não entra</span>' : '<span class="cfg-ef warn">Não → falta informação</span>';
    const linha = (q, i) => { const ed = R.editando === q.id;
      return `<li class="cfg-q ${q.ativa ? '' : 'off'} ${ed ? 'ed' : ''}">
      <label class="cfg-sw" title="${q.ativa ? 'Desligar' : 'Ligar'} a pergunta ${i + 1}"><input type="checkbox" data-q-ativa="${q.id}" ${q.ativa ? 'checked' : ''}><span class="cfg-sw-t" aria-hidden="true"></span><span class="sr-only">Pergunta ${i + 1} ${q.ativa ? 'ligada' : 'desligada'}</span></label>
      <span class="cfg-qn" aria-hidden="true">${i + 1}</span>
      ${ed ? `<div class="cfg-q-b">
        <label class="cfg-l"><span>Pergunta ${i + 1}</span><textarea class="input" rows="2" maxlength="240" data-q="${q.id}:pergunta">${esc(q.pergunta)}</textarea></label>
        <div class="cfg-q-l2">
          <label class="cfg-l"><span>Se a resposta for “Não”, o que fazer</span><input class="input" maxlength="240" data-q="${q.id}:seNao" value="${esc(q.seNao)}"></label>
          <label class="cfg-l"><span>Efeito do “Não”</span><select class="select" data-q="${q.id}:tipo">
            <option value="barreira" ${q.tipo === 'barreira' ? 'selected' : ''}>Não entra no portfólio</option><option value="informacao" ${q.tipo === 'informacao' ? 'selected' : ''}>Falta informação</option></select></label>
        </div></div>
        <button type="button" class="btn btn-ghost btn-sm cfg-q-bt" data-editar-q="">${icon('check', 14)} Pronto</button>`
      : `<div class="cfg-q-b"><b class="cfg-q-p">${esc(q.pergunta)}</b><span class="cfg-q-m">${efeito(q)}<span>Se “Não”: ${esc(q.seNao)}</span></span></div>
        <button type="button" class="btn btn-ghost btn-sm cfg-q-bt" data-editar-q="${q.id}" ${q.ativa ? '' : 'disabled'} aria-label="Editar a pergunta ${i + 1}">${icon('editar', 14)} Editar</button>`}</li>`; };
    return `<section class="card cfg-card" aria-labelledby="cfg-t-check">${cab(2, '<span id="cfg-t-check">Checklist de entrada</span>', `${ativas.length} de ${R.entrada.length} perguntas ligadas · ${plural(elim, 'eliminatória', 'eliminatórias')} · ${plural(ativas.length - elim, 'de informação mínima', 'de informação mínima')}.`,
        ajuda('Checklist de entrada', 'muda as perguntas de Sim ou Não que decidem se uma demanda entra, não entra ou volta por falta de informação.', 'reescreva a pergunta e a orientação, escolha o efeito do “Não” ou desligue a pergunta. No funil, as eliminatórias aparecem primeiro.'))}
      ${antigas ? `<p class="cfg-nota">${icon('info', 15)} ${plural(antigas, 'decisão de entrada foi tomada', 'decisões de entrada foram tomadas')} com uma versão anterior do checklist. Elas continuam valendo, e a ficha de cada projeto mostra a versão usada.</p>` : ''}
      <ol class="cfg-qs">${R.entrada.map(linha).join('')}</ol></section>`;
  }

  function visReguas(){
    const k = R.corte, ok = Number.isInteger(k.classeA) && Number.isInteger(k.classeB) && k.classeB < k.classeA;
    const av = projetos().map(p => ({ p, s: M.pontuar(p) })).filter(x => x.s.completo);
    const classe = v => v >= k.classeA ? 'A' : v >= k.classeB ? 'B' : 'C';
    const quad = s => s.valor >= k.valor ? (s.esforco < k.esforco ? 'rapido' : 'estrategico') : (s.esforco < k.esforco ? 'complementar' : 'repensar');
    const nC = { A: 0, B: 0, C: 0 }, nQ = { rapido: 0, estrategico: 0, complementar: 0, repensar: 0 };
    av.forEach(x => { nC[classe(x.s.valor)]++; nQ[quad(x.s)]++; });
    const a = ok ? k.classeA : 70, b = ok ? k.classeB : 40;
    const q = id => `<div class="cfg-mq cfg-mq-${id}" style="--q:${M.QUADRANTES[id].cor}"><b>${nQ[id]}</b><span>${M.QUADRANTES[id].nome}</span></div>`;
    return `<div class="cfg-regua" aria-hidden="true"><i class="c" style="width:${b}%"><span>C</span></i><i class="b" style="width:${a - b}%"><span>B</span></i><i class="a" style="width:${100 - a}%"><span>A</span></i></div>
      <div class="cfg-regua-esc" aria-hidden="true"><span>0</span><span style="left:${b}%">${b}</span><span style="left:${a}%">${a}</span><span style="left:100%">100</span></div>
      <div class="cfg-mini-mtz" role="img" aria-label="Prévia dos quadrantes com estas réguas: ${Object.keys(nQ).map(id => `${M.QUADRANTES[id].nome} ${nQ[id]}`).join(', ')}">${q('rapido')}${q('estrategico')}${q('complementar')}${q('repensar')}
        <span class="cfg-mq-y">Valor ≥ ${esc(k.valor)}</span><span class="cfg-mq-x">Esforço ≥ ${esc(k.esforco)}</span></div>
      <p class="cfg-previa" role="status">${av.length ? `Com estas réguas, ${plural(av.length, 'projeto avaliado fica', 'projetos avaliados ficam')}: <b>A ${nC.A}</b> · <b>B ${nC.B}</b> · <b>C ${nC.C}</b>.` : 'Ainda não há projetos avaliados para a prévia.'}</p>`;
  }
  function cartaoReguas(){
    const k = R.corte, campo = (id, rot, min, max, aj) => `<label class="cfg-l cfg-num"><span>${rot} ${aj}</span><input class="input" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" data-corte="${id}" value="${esc(k[id])}"></label>`;
    return `<section class="card cfg-card" aria-labelledby="cfg-t-reguas">${cab(3, '<span id="cfg-t-reguas">Réguas da priorização</span>', 'Onde começam as classes A, B e C e os quadrantes da matriz. Nota de 0 a 100.',
        ajuda('Réguas da priorização', 'muda a classe de prioridade (A, B, C) e o quadrante de cada projeto no ranking, na matriz, no painel e nos relatórios. As notas não mudam.', 'digite os números e veja a prévia ao lado antes de salvar.'))}
      <div class="cfg-reguas">
        <div class="cfg-campos">
          ${campo('classeA', 'Classe A a partir de', 1, 100, ajuda('Classe A', 'projetos com nota de valor igual ou acima deste número são classe A, a prioridade mais alta.', 'digite um número maior que o da classe B.'))}
          ${campo('classeB', 'Classe B a partir de', 0, 99, ajuda('Classe B', 'notas entre este número e o da classe A são classe B; abaixo dele, classe C.', 'digite um número menor que o da classe A.'))}
          ${campo('valor', 'Valor alto a partir de', 5, 95, ajuda('Corte de valor', 'separa, na matriz, os projetos de valor alto (em cima) dos de valor baixo (embaixo).', 'digite de 5 a 95. O padrão é 50, o meio da escala.'))}
          ${campo('esforco', 'Esforço alto a partir de', 5, 95, ajuda('Corte de esforço', 'separa, na matriz, os projetos de esforço alto (à direita) dos de esforço baixo (à esquerda).', 'digite de 5 a 95. O padrão é 50, o meio da escala.'))}
        </div>
        <div class="cfg-reguas-vis" data-reguas-vis>${visReguas()}</div>
      </div></section>`;
  }

  function cartaoOutras(){
    const S = GP.state(), cap = S.capacidade, cs = S.criterios, vp = GP.versaoPesosAtual && GP.versaoPesosAtual();
    const nV = cs.filter(c => c.eixo === 'valor' && c.peso > 0).length, nE = cs.filter(c => c.eixo === 'esforco' && c.peso > 0).length;
    const linha = (ic, titulo, resumo, href, nivel, aj) => `<div class="cfg-link"><span class="cfg-link-ic">${icon(ic, 18)}</span><div><b>${titulo} ${aj}</b><p>${resumo}</p></div>
      ${GP.nivel() >= nivel ? `<a class="btn btn-ghost btn-sm" href="${href}">Abrir ${icon('seta', 14)}</a>` : `<span class="cfg-nivel">Ligue o nível ${nivel}</span>`}</div>`;
    return `<section class="card cfg-card" aria-labelledby="cfg-t-outras">${cab(4, '<span id="cfg-t-outras">Regras com tela própria</span>', 'Estas regras têm prévia e histórico na própria tela. Os atalhos levam direto a elas.', '')}
      <div class="cfg-links">
        ${linha('pesos', 'Pesos das perguntas', `Valor: ${nV} perguntas · Esforço: ${nE} perguntas · ${vp ? `versão ${vp} dos pesos` : 'sugestão inicial'}.`, '#/criterios', 2,
          ajuda('Pesos das perguntas', 'muda quanto cada pergunta vale na nota de valor e de esforço e, com isso, a ordem do ranking.', 'em Critérios e pesos, arraste ou digite os percentuais, confira a prévia e salve.'))}
        ${linha('carteira', 'Capacidade, reserva e orçamento', `${fmt.n(cap.fte, cap.fte % 1 ? 1 : 0)} pessoas (FTE) · reserva de ${fmt.n(cap.reservaPct)}% · orçamento ${fmt.brl(cap.orcamento)} · período ${esc(cap.periodo)}.`, '#/carteira', 3,
          ajuda('Capacidade, reserva e orçamento', 'muda quantos projetos cabem na carteira do período e quando cada um poderia começar.', 'em Carteira e capacidade, ajuste as premissas do período; o resultado aparece na hora.'))}
      </div></section>`;
  }
  function versoes(){
    const vs = (GP.state().configVersoes || []).slice().reverse();
    return `<details class="card cfg-versoes"><summary>${icon('relogio', 16)} Histórico de versões das regras <span class="cfg-cont">${vs.length}</span></summary>
      <ol>${vs.map(v => `<li><span class="cfg-vn">v${v.n}</span><div><time>${v.data ? fmt.dataHora(v.data) : 'início'}</time><ul>${v.resumo.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div></li>`).join('')}</ol>
      <div class="cfg-versoes-pe"><button type="button" class="btn btn-ghost btn-sm" data-padrao>${icon('voltar', 14)} Voltar à sugestão do sistema</button><small>Carrega a sugestão inicial no rascunho. Nada muda até você salvar.</small></div></details>`;
  }
  function barra(){
    const ms = mudancas(), ps = problemas(), v = GP.state().config.versao;
    return `<div class="cfg-barra ${ms.length || ps.length ? 'sujo' : ''}" data-barra role="region" aria-label="Salvar as regras">
      <div class="cfg-barra-txt" aria-live="polite">${ms.length || ps.length
        ? `<b>${ms.length ? plural(ms.length, 'alteração não salva', 'alterações não salvas') : 'Revise antes de salvar'}</b><span class="cfg-barra-lista" title="${esc(ms.join('\n'))}">${esc(ms.slice(0, 2).join(' '))}${ms.length > 2 ? ' …' : ''}</span>${ps.length ? `<span class="cfg-erro">${icon('alerta', 14)} ${esc(ps[0])}</span>` : ''}`
        : `<span class="cfg-ok">${icon('check', 15)} Tudo salvo · versão ${v} em uso</span>`}</div>
      <div class="cfg-barra-acoes"><button type="button" class="btn btn-ghost" data-descartar ${ms.length || ps.length ? '' : 'disabled'}>Descartar</button>
      <button type="button" class="btn btn-primary" data-salvar ${ms.length && !ps.length ? '' : 'disabled'}>${icon('check', 16)} Salvar e aplicar</button></div></div>`;
  }

  /* ---------------------------------------------------------------- tela */
  function desenhar(host){
    hostAtual = host;
    if(!R || R.base !== GP.state().config.versao) R = novoRascunho();
    const c = GP.state().config, vs = GP.state().configVersoes || [], ult = vs[vs.length - 1];
    host.innerHTML = `<div class="cfg-regras">
      <div class="cfg-intro"><span class="cfg-intro-ic">${icon('pesos', 20)}</span><div><b>Estas regras valem para todo o sistema</b>
        <p>Altere o que precisar e clique em <b>Salvar e aplicar</b>. Cada gravação vira uma versão, e cada projeto guarda a versão em que foi cadastrado, decidido na entrada e avaliado.</p></div>
        <span class="cfg-versao" data-tt="Versão das regras em uso&#10;${esc(ult && ult.data ? 'Salva em ' + fmt.dataHora(ult.data) : 'Configuração inicial do sistema')}" tabindex="0">Versão <b>${c.versao}</b></span></div>
      ${cartaoListas()}${cartaoChecklist()}${cartaoReguas()}${cartaoOutras()}${versoes()}${barra()}</div>`;
    ligar(host);
  }
  const atualizarBarra = host => { const b = host.querySelector('[data-barra]'); if(b) b.outerHTML = barra(); };
  function ligar(host){
    const redesenhar = foco => { const y = scrollY; desenhar(host); scrollTo(0, y); if(foco){ const f = host.querySelector(foco); if(f) f.focus({ preventScroll: true }); } };
    host.addEventListener('input', e => {
      const t = e.target, d = t.dataset;
      if(d.gerNome != null) R.listas.gerencias[+d.gerNome].nome = t.value;
      else if(d.gerId != null) R.listas.gerencias[+d.gerId].id = t.value.toUpperCase();
      else if(d.item){ const [k, i] = d.item.split(':'); R.listas[k][+i].v = t.value; }
      else if(d.q){ const [id, campo] = d.q.split(':'); R.entrada.find(q => q.id === id)[campo] = t.value; }
      else if(d.corte){ const v = t.value.trim(); R.corte[d.corte] = v === '' ? NaN : Math.round(+v);
        const vis = host.querySelector('[data-reguas-vis]'); if(vis) vis.innerHTML = visReguas(); }
      else return;
      atualizarBarra(host);
    });
    host.addEventListener('change', e => {
      const t = e.target;
      if(t.dataset.qAtiva){ const q = R.entrada.find(x => x.id === t.dataset.qAtiva); q.ativa = t.checked; if(!t.checked && R.editando === q.id) R.editando = null; redesenhar(`[data-q-ativa="${t.dataset.qAtiva}"]`); }
      else if(t.dataset.q && t.tagName === 'SELECT'){ atualizarBarra(host); }
    });
    const incluir = k => {
      if(k === 'gerencias'){ const si = host.querySelector('[data-novo="ger-id"]'), no = host.querySelector('[data-novo="ger-nome"]'), id = si.value.trim().toUpperCase(), nome = no.value.trim();
        if(!id || !nome){ GP.toast('Informe a sigla e o nome da nova gerência.'); (id ? no : si).focus(); return; }
        if(R.listas.gerencias.some(g => String(g.id).toUpperCase() === id)){ GP.toast(`Já existe a gerência ${id}.`); si.focus(); return; }
        R.listas.gerencias.push({ id, nome, nova: true }); redesenhar('[data-novo="ger-id"]'); return; }
      const inp = host.querySelector(`[data-novo="${k}"]`), v = inp.value.trim();
      if(!v){ inp.focus(); return; }
      if(R.listas[k].some(t => t.v.trim().toLowerCase() === v.toLowerCase())){ GP.toast(`“${v}” já está na lista.`); inp.focus(); return; }
      R.listas[k].push({ v, orig: null }); redesenhar(`[data-novo="${k}"]`);
    };
    host.addEventListener('keydown', e => { const n = e.target.dataset && e.target.dataset.novo; if(n && e.key === 'Enter'){ e.preventDefault(); incluir(n.startsWith('ger') ? 'gerencias' : n); } });
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b || b.disabled) return;
      if(b.dataset.add) incluir(b.dataset.add);
      else if(b.dataset.editarQ != null){ const id = b.dataset.editarQ; R.editando = id || null; redesenhar(id ? `[data-q="${id}:pergunta"]` : null); }
      else if(b.dataset.rem){ const [k, i] = b.dataset.rem.split(':'); R.listas[k].splice(+i, 1); redesenhar(); }
      else if(b.hasAttribute('data-descartar')){ R = null; redesenhar(); GP.toast('Alterações descartadas.'); }
      else if(b.hasAttribute('data-padrao')){ const pad = M.configPadrao(), base = R.base; R = novoRascunho(pad); R.base = base;
        // gerências em uso que não estão na sugestão continuam, para não deixar projetos sem gerência
        GP.state().config.listas.gerencias.forEach(g => { if(!R.listas.gerencias.some(x => x.id === g.id) && uso('gerencia', g.id)) R.listas.gerencias.push({ id: g.id, nome: g.nome, nova: false }); });
        redesenhar(); GP.toast('Sugestão do sistema carregada no rascunho. Confira e salve para aplicar.'); }
      else if(b.hasAttribute('data-salvar')) salvar(host);
    });
  }
  function salvar(host){
    const ms = mudancas(), ps = problemas(); if(!ms.length) return;
    if(ps.length){ GP.toast(ps[0], { tipo: 'erro' }); return; }
    const prox = GP.state().config.versao + 1;
    GP.confirmar(`Salvar as regras como versão ${prox}?`, `<p>O que muda:</p><ul class="cfg-conf">${ms.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
      <p class="muted">Vale para todo o sistema a partir de agora. Os projetos já registrados continuam com a referência da versão em que foram cadastrados, decididos e avaliados.</p>`, 'Salvar e aplicar', () => {
      const r = M.salvarConfig(paraConfig(), renomes());
      if(!r.ok){ GP.toast(r.erro, { tipo: 'erro' }); return; }
      R = null; GP.toast(`Regras salvas na versão ${r.versao} e aplicadas em todo o sistema.`, { tipo: 'ok' }); GP.refresh();
    });
  }
  GP.configRegras = desenhar;

  // rascunho pendente: avisa ao sair da tela e ao fechar a página
  window.addEventListener('hashchange', () => {
    if(!/^#\/?config/.test(location.hash) && mudancas().length) GP.toast('As alterações nas regras ainda não foram salvas.', { acao: 'Voltar e salvar', onAcao: () => GP.go('#/config?secao=regras'), ms: 9000 });
  });
  window.addEventListener('beforeunload', e => { if(mudancas().length){ e.preventDefault(); e.returnValue = ''; } });
})();
