/* =========================================================================
   Painel — visão geral do portfólio (cresce com o nível)
   Extensão: GP.painelBlocos — {nivel, ordem, render() → html} (ex.: capacidade no nível 3)
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt, hoje } = GP.util, icon = GP.icon;
  GP.painelBlocos = GP.painelBlocos || [];
  const dias = d => d ? Math.round((Date.now() - new Date(d + 'T00:00:00').getTime()) / 864e5) : null;

  /** Itens que pedem atenção (cada um com link para resolver) */
  function atencao(nivel){
    const ps = P.todos(), h = hoje(), itens = [];
    ps.filter(p => p.etapa === 'entrada' && dias(p.dataEntrada) > 30).forEach(p => itens.push({ tom:'warn', txt:`${p.codigo} aguarda o checklist de entrada há ${dias(p.dataEntrada)} dias`, href:'#/funil' }));
    ps.filter(p => p.etapa === 'triagem').forEach(p => itens.push({ tom:'warn', txt:`${p.codigo} está em triagem: ${(p.entrada && p.entrada.motivos || ['falta informação']).join(' ')}`, href:'#/projeto/' + p.id }));
    ps.filter(p => p.etapa === 'execucao' && p.fimPrevisto && p.fimPrevisto < h).forEach(p => itens.push({ tom:'bad', txt:`${p.codigo} em execução com fim previsto vencido (${fmt.data(p.fimPrevisto)})`, href:'#/projeto/' + p.id }));
    ps.filter(p => ['aprovado', 'execucao'].includes(p.etapa) && !p.responsavel).forEach(p => itens.push({ tom:'warn', txt:`${p.codigo} sem responsável definido`, href:'#/novo/' + p.id }));
    if(nivel >= 2) ps.filter(p => p.etapa === 'aprovado' && !M.pontuar(p).completo).forEach(p => itens.push({ tom:'info', txt:`${p.codigo} aprovado e ainda sem avaliação de prioridade`, href:'#/avaliar/' + p.id }));
    return itens;
  }

  function boasVindas(el){
    el.innerHTML = U.pageHead({ titulo:'Boas-vindas à Gestão de Portfólio da FEG', sub:'Um lugar único para registrar os projetos, decidir o que entra e definir prioridades.' }) +
      `<div class="grid g3">${[
        ['novo', '1. Cadastre', 'Registre cada projeto ou demanda com as informações mínimas.', '#/novo', 'Novo projeto'],
        ['funil', '2. Decida a entrada', 'Responda 6 perguntas simples: entra, não entra ou falta informação.', '#/funil', 'Funil de entrada'],
        ['ranking', '3. Priorize', 'No nível 2, responda as perguntas de prioridade e veja o ranking.', null, 'Entenda os níveis'],
      ].map(([ic, t, d, href, b]) => `<div class="card stack" style="gap:10px"><div class="empty" style="padding:0;text-align:left"><div class="ic" style="margin:0">${icon(ic, 22)}</div></div><h3>${t}</h3><p class="muted" style="margin:0">${d}</p>
          <div>${href ? `<a class="btn btn-ghost btn-sm" href="${href}">${b} →</a>` : `<button class="btn btn-ghost btn-sm" data-ajuda-nivel>${b} →</button>`}</div></div>`).join('')}</div>
      <div class="card row" style="margin-top:16px;justify-content:space-between"><div><b>Quer ver como fica com dados?</b><div class="muted" style="font-size:13px">Carregue 14 projetos fictícios. Depois remova em Dados e configurações.</div></div>
        <div class="row"><a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Cadastrar projeto</a><button class="btn btn-ghost" data-exemplos>Carregar exemplos</button></div></div>`;
  }

  function tela(el){
    const ps = P.todos(), nivel = GP.nivel();
    if(!ps.length) return boasVindas(el);
    const n = f => ps.filter(f).length, grupo = g => p => M.etapa(p.etapa).grupo === g;
    const ativos = ps.filter(grupo('andamento'));
    const itens = atencao(nivel);
    const porGer = M.CAT.gerencias.map((g, i) => ({ label:g.id, value: ativos.filter(p => p.gerencia === g.id).length, color: GP.charts.PAL[i] })).filter(x => x.value);
    const porTipo = M.CAT.tipos.map(t => ({ label:t, value: ativos.filter(p => p.tipo === t).length })).filter(x => x.value);
    const etapas = ['entrada', 'triagem', 'aprovado', 'execucao', 'espera'].map((id, i) => ({ label: M.etapa(id).nome, value: n(p => p.etapa === id), color: i < 2 ? '#C6DCA4' : '#3E6801' }));
    const rk = nivel >= 2 ? M.ranking(ps.filter(p => p.etapa === 'aprovado')).slice(0, 5) : [];
    const extras = GP.painelBlocos.filter(b => b.nivel <= nivel).sort((a, b) => (a.ordem || 50) - (b.ordem || 50));
    el.innerHTML = U.pageHead({ titulo:'Painel do portfólio', sub:`Situação em ${fmt.data(hoje())}. Projetos de exemplo entram nas contas enquanto não forem removidos.`,
        acoes:`${GP.botaoPDF()}<a class="btn btn-primary" href="#/novo">${icon('novo', 16)} Novo projeto</a>` }) +
      `<div class="grid g4">
        ${U.kpi({ rotulo:'Projetos no acervo', valor: ps.length, sub:`${n(grupo('concluido'))} concluído(s) · ${n(grupo('fora'))} fora do portfólio` })}
        ${U.kpi({ rotulo:'Na fila de entrada', valor: n(p => p.etapa === 'entrada' || p.etapa === 'triagem'), sub:`${n(p => p.etapa === 'triagem')} em triagem`, cor: n(p => p.etapa === 'entrada' || p.etapa === 'triagem') ? 'var(--warn)' : '' })}
        ${U.kpi({ rotulo:'Aprovados aguardando início', valor: n(p => p.etapa === 'aprovado'), sub: nivel >= 2 ? `${n(p => p.etapa === 'aprovado' && M.pontuar(p).completo)} com prioridade definida` : 'entraram no portfólio' })}
        ${U.kpi({ rotulo:'Em execução', valor: n(p => p.etapa === 'execucao'), sub:`${fmt.n(ps.filter(p => p.etapa === 'execucao').reduce((a, p) => a + (p.esforcoFte || 0), 0), 1)} pessoas (FTE) alocadas`, cor:'var(--green)' })}
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card">${U.secH('Projetos por etapa', 'Projetos em andamento.', '<a class="link" href="#/funil">Ver funil →</a>')}${GP.charts.hbar(etapas)}</div>
        <div class="card">${U.secH(`Precisa de atenção (${itens.length})`, itens.length ? 'Clique para resolver.' : 'Nada pendente. Bom trabalho!')}
          <div class="stack" style="gap:8px;max-height:260px;overflow:auto">${itens.map(i => `<a class="att t-${i.tom}" href="${i.href}">${icon(i.tom === 'bad' ? 'alerta' : 'info', 15)}<span>${esc(i.txt)}</span></a>`).join('') || `<div class="callout"><span class="ic">${icon('check', 16)}</span><div>Fila de entrada em dia e projetos com responsável.</div></div>`}</div></div>
        <div class="card">${U.secH('Em andamento por gerência')}${porGer.length ? GP.charts.donut(porGer, { centro: ativos.length, rotulo:'em andamento' }) : '<span class="dim">Sem projetos em andamento.</span>'}</div>
        <div class="card">${U.secH('Em andamento por tipo')}${porTipo.length ? GP.charts.hbar(porTipo) : '<span class="dim">Sem projetos em andamento.</span>'}</div>
        ${nivel >= 2 ? `<div class="card">${U.secH('Top 5 da prioridade', 'Aprovados aguardando início, pela nota de valor.', '<a class="link" href="#/ranking">Ranking completo →</a>')}
          ${rk.length ? `<div class="stack" style="gap:2px">${rk.map(x => `<a class="row" style="flex-wrap:nowrap;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);text-decoration:none;color:inherit" href="#/projeto/${x.p.id}"><b style="width:16px">${x.pos}</b>${GP.notaHtml(x.s.valor)}<span style="font-size:13px">${esc(x.p.codigo)} · ${esc(x.p.titulo)}</span><span class="spacer"></span>${GP.quadPill(x.s.quadrante)}</a>`).join('')}</div>` : '<span class="dim">Avalie os projetos aprovados para ver a prioridade.</span>'}</div>` : ''}
        ${extras.map(b => `<div class="card">${b.render()}</div>`).join('')}
      </div>
      ${nivel < 3 ? `<div class="card row" style="margin-top:16px;justify-content:space-between"><div><b>Próximo nível: ${esc(GP.NIVEIS[nivel].nome)}</b><div class="muted" style="font-size:13px">${esc(GP.NIVEIS[nivel].resumo)}</div></div><button class="btn btn-ghost" data-ajuda-nivel>Entender os níveis</button></div>` : ''}`;
  }

  GP.painelAtencao = atencao;
  GP.tela({ id:'painel', nivel:1, ordem:1, titulo:'Painel', icone:'painel', render: tela });
})();
