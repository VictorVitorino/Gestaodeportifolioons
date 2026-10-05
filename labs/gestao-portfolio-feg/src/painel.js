/* =========================================================================
   Painel - visão geral do portfólio (cresce com o nível)
   Extensão: GP.painelBlocos - {nivel, ordem, render() → html} (ex.: capacidade no nível 3)
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt, hoje } = GP.util, icon = GP.icon;
  const OP = GP.operacao || {}, plural = GP.util.plural || ((n, s, p) => `${n} ${n === 1 ? s : p}`);
  GP.painelBlocos = GP.painelBlocos || [];
  const dias = d => d ? Math.round((Date.now() - new Date(String(d).slice(0, 10) + 'T00:00:00').getTime()) / 864e5) : null;
  const PESO_TOM = { bad:0, warn:1, info:2 };

  /** Itens que pedem atenção (cada um com link para resolver), do mais grave e mais antigo ao mais leve */
  function atencao(nivel){
    const ps = P.todos(), h = hoje(), itens = [];
    ps.filter(p => p.etapa === 'entrada' && dias(p.dataEntrada) > 30).forEach(p => { const d = dias(p.dataEntrada); itens.push({ tom: d > 90 ? 'bad' : 'warn', dias:d, txt:`${p.codigo} aguarda o checklist de entrada há ${plural(d, 'dia', 'dias')}`, href:'#/funil' }); });
    ps.filter(p => p.etapa === 'triagem').forEach(p => itens.push({ tom:'warn', dias: dias(p.entrada && p.entrada.data) ?? dias(p.dataEntrada) ?? 0, txt:`${p.codigo} está em triagem: ${(p.entrada && p.entrada.motivos || ['falta informação']).join(' ')}`, href:'#/projeto/' + p.id }));
    ps.filter(p => p.etapa === 'execucao' && p.fimPrevisto && p.fimPrevisto < h).forEach(p => itens.push({ tom:'bad', dias: dias(p.fimPrevisto), txt:`${p.codigo} em execução com fim previsto vencido (${fmt.data(p.fimPrevisto)})`, href:'#/projeto/' + p.id }));
    ps.filter(p => ['aprovado', 'execucao'].includes(p.etapa) && !p.responsavel).forEach(p => itens.push({ tom:'warn', dias:0, txt:`${p.codigo} sem responsável definido`, href:'#/novo/' + p.id + '?campo=responsavel' }));
    if(nivel >= 2) ps.filter(p => p.etapa === 'aprovado' && !M.pontuar(p).completo).forEach(p => itens.push({ tom:'info', dias:0, txt:`${p.codigo} aprovado e ainda sem avaliação de prioridade`, href:'#/avaliar/' + p.id }));
    return itens.sort((a, b) => (PESO_TOM[a.tom] - PESO_TOM[b.tom]) || ((b.dias || 0) - (a.dias || 0)));
  }

  function boasVindas(el){
    const passos = [['novo', 'Cadastre', 'Registre cada projeto ou demanda com as informações mínimas.'], ['funil', 'Decida a entrada', 'Responda 6 perguntas simples: entra, não entra ou falta informação.'], ['ranking', 'Priorize', 'No nível 2, responda as perguntas de prioridade e veja o ranking.']];
    el.innerHTML = U.pageHead({ titulo:'Boas-vindas à Gestão de Portfólio da FEG', sub:'Um lugar único para registrar os projetos, decidir o que entra e definir prioridades.' }) +
      (OP.passos ? OP.passos({ titulo:'Comece em três passos', sub:'Quer ver como fica com dados? Carregue 14 projetos fictícios e remova depois em Dados e configurações.', passos, extra:'<button class="btn btn-ghost" data-ajuda-nivel>Entender os níveis</button>' })
        : `<div class="card"><a class="btn btn-primary" href="#/novo">Novo cadastro</a> <button class="btn btn-ghost" data-exemplos>Carregar exemplos</button></div>`);
  }

  /** Métrica canônica (GP.ui.metric) com recuo para o KPI simples */
  const metrica = o => U.metric ? U.metric(o) : U.kpi({ rotulo:o.label, valor:o.valor, sub:o.sub, cor:o.cor });

  function tela(el){
    const ps = P.todos(), nivel = GP.nivel();
    if(!ps.length) return boasVindas(el);
    const n = f => ps.filter(f).length, grupo = g => p => M.etapa(p.etapa).grupo === g;
    const ativos = ps.filter(grupo('andamento'));
    const itens = atencao(nivel);
    const cor1 = '#6b8f2a';
    const ordenado = arr => arr.filter(x => x.value).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'pt-BR'));
    const porGer = ordenado(M.CAT.gerencias.map(g => ({ label:g.id, title:g.nome, value: ativos.filter(p => p.gerencia === g.id).length, color:cor1 })));
    const porTipo = ordenado(M.CAT.tipos.map(t => ({ label:t, value: ativos.filter(p => p.tipo === t).length, color:cor1 })));
    const GRUPO_COR = [['Na fila de entrada', '#d5a32d', ['entrada', 'triagem']], ['No portfólio', '#3E6801', ['aprovado', 'execucao']], ['Pausado', '#477b91', ['espera']]];
    const corDe = id => GRUPO_COR.find(g => g[2].includes(id))[1];
    const etapas = ['entrada', 'triagem', 'aprovado', 'execucao', 'espera'].map(id => ({ label: M.etapa(id).nome, value: n(p => p.etapa === id), color: corDe(id) }));
    const fmtProj = v => fmt.n(v);
    const rk = nivel >= 2 ? M.ranking(ps.filter(p => p.etapa === 'aprovado')).slice(0, 5) : [];
    const extras = GP.painelBlocos.filter(b => b.nivel <= nivel).sort((a, b) => (a.ordem || 50) - (b.ordem || 50));
    const fila = n(p => p.etapa === 'entrada' || p.etapa === 'triagem'), triagem = n(p => p.etapa === 'triagem');
    const fte = ps.filter(p => p.etapa === 'execucao').reduce((a, p) => a + (p.esforcoFte || 0), 0);
    const att = itens.map(i => `<a class="att t-${i.tom}" href="${i.href}">${icon(i.tom === 'info' ? 'info' : 'alerta', 15)}<span>${esc(i.txt)}</span></a>`).join('');
    el.innerHTML = `<div class="op-painel">` + U.pageHead({ titulo:'Entrada e triagem', sub:`Situação em ${fmt.data(hoje())}. Projetos de exemplo entram nas contas enquanto não forem removidos.`,
        acoes:`${GP.botaoPDF ? GP.botaoPDF() : ''}<a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo cadastro</a>` }) +
      `<div class="grid g4 op-kpis">
        ${metrica({ label:'Projetos no acervo', rotulo:'Projetos no acervo', valor: ps.length, icone:'acervo', sub:`${plural(n(grupo('concluido')), 'concluído', 'concluídos')} · ${n(grupo('fora'))} fora do portfólio` })}
        ${metrica({ label:'Na fila de entrada', valor: fila, icone:'funil', tom: fila ? '#A8701A' : '', cor: fila ? 'var(--warn)' : '', sub:`${triagem} em triagem` })}
        ${metrica({ label:'Admitidos aguardando início', valor: n(p => p.etapa === 'aprovado'), icone:'relogio', sub: nivel >= 2 ? `${n(p => p.etapa === 'aprovado' && M.pontuar(p).completo)} com prioridade definida` : 'entraram no portfólio' })}
        ${metrica({ label:'Em execução', valor: n(p => p.etapa === 'execucao'), icone:'check', tom:'#3E6801', cor:'var(--green)', sub:`${fmt.n(fte, 1)} ${fte === 1 ? 'pessoa (FTE) alocada' : 'pessoas (FTE) alocadas'}` })}
      </div>
      <div class="bento op-bento">
        <div class="card b-8 op-att">${U.secH(`Precisa de atenção <span class="op-cnt">${itens.length}</span>`, itens.length ? 'Do mais urgente ao mais leve. Clique para resolver.' : 'Nada pendente. Bom trabalho!')}
          <div class="op-att-lista">${att || `<div class="callout"><span class="ic">${icon('check', 16)}</span><div>Fila de entrada em dia e projetos com responsável.</div></div>`}</div></div>
        <div class="card b-4">${U.secH('Projetos por etapa', 'Em andamento, por grupo de situação.', '<a class="link" href="#/funil">Ver funil →</a>')}${GP.charts.hbar(etapas, { fmtv: fmtProj })}
          <div class="legend op-legenda">${GRUPO_COR.map(([l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join('')}</div></div>
        <div class="card b-6">${U.secH('Em andamento por gerência', 'Ordenado pela quantidade de projetos.')}${porGer.length ? GP.charts.hbar(porGer, { fmtv: fmtProj }) : '<span class="dim">Sem projetos em andamento.</span>'}</div>
        <div class="card b-6">${U.secH('Em andamento por tipo', 'Ordenado pela quantidade de projetos.')}${porTipo.length ? GP.charts.hbar(porTipo, { fmtv: fmtProj }) : '<span class="dim">Sem projetos em andamento.</span>'}</div>
        ${nivel >= 2 ? `<div class="card b-6">${U.secH('Top 5 da prioridade', 'Admitidos aguardando início, pela nota de valor.', '<a class="link" href="#/ranking">Ranking completo →</a>')}
          ${rk.length ? `<div class="stack" style="gap:2px">${rk.map(x => `<a class="row op-top" href="#/projeto/${x.p.id}"><b style="width:16px">${x.pos}</b>${GP.notaHtml(x.s.valor)}<span style="font-size:13px">${esc(x.p.codigo)} · ${esc(x.p.titulo)}</span><span class="spacer"></span>${GP.quadPill(x.s.quadrante)}</a>`).join('')}</div>` : '<span class="dim">Avalie os projetos admitidos para ver a prioridade.</span>'}</div>` : ''}
        ${extras.map(b => `<div class="card b-6">${b.render()}</div>`).join('')}
      </div>
      ${nivel < 3 ? `<div class="card row op-prox-nivel"><div><b>Próximo nível: ${esc(GP.NIVEIS[nivel].nome)}</b><div class="muted" style="font-size:13px">${esc(GP.NIVEIS[nivel].resumo)}</div></div><button class="btn btn-ghost" data-ajuda-nivel>Entender os níveis</button></div>` : ''}</div>`;
  }

  GP.painelAtencao = atencao;
  GP.tela({ id:'entrada-resumo', nivel:1, ordem:1, titulo:'Entrada e triagem', icone:'painel', render: tela });
})();
