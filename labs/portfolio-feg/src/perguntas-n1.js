/* =========================================================================
   Portfólio FEG — PERGUNTAS DO NÍVEL 1 (perguntas-n1.js) · §5.4 da especificação
   23 perguntas graduadas: 9 conceituais, 9 de análise (sobre PF.base) e 5 de decisão.
   Roda depois de nivel1.js e anexa com PF.level(1).questions.push(...). Gabaritos sempre calculados por PF.calc sobre d.
   Errar não revela a resposta (o core mostra só a dica); a dica por alternativa explica por que aquela escolha não serve,
   sem apontar a correta. Justificativa das perguntas de análise: Resposta · Como calculei · Leitura · Cuidado · Próximo passo.
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF || {}, L = PF.level && PF.level(1);
  if(!L || !PF.calc || !PF.n1){ console.error('perguntas-n1.js: o Nível 1 (nivel1.js) precisa carregar antes.'); return; }
  const { esc, fmt } = PF.util, C = PF.calc, N = PF.n1;
  const pill = N.pillCor, nomeCor = N.nomeCor, curto = N.curto, pc = N.pc, n2 = N.n2, nn = N.nn, mes = N.mes;
  const lista = ids => ids.length ? ids.join(', ') : 'nenhuma';
  const nomeT = (d, s) => N.nomeTipo(d, s);
  const CAMPO = { objetivoEstrategicoId:'objetivo estratégico', dataPlanejada:'data planejada (baseline)', categoria:'categoria', bac:'BAC', dataPrevistaAtual:'data prevista',
    titulo:'título', descricaoObjetivo:'descrição', gerenciaId:'gerência', comunidadeId:'comunidade', responsavel:'responsável' };
  /** Modelo de justificativa (DFP): Resposta · Como calculei · Leitura · Cuidado · Próximo passo · Data do dado. */
  const J = (d, o) => `<div class="stack" style="gap:6px">${[['Resposta', o.r], ['Como calculei', o.c], ['Leitura', o.l], ['Cuidado', o.k], ['Próximo passo', o.p]].filter(x => x[1])
    .map(([t, v]) => `<p style="margin:0"><b>${t}:</b> ${v}</p>`).join('')}<p class="dim" style="margin:0;font-size:12.5px">Data do dado: referência ${fmt.date(C.ref(d))} (ilustrativa) · conjunto de exemplo original.</p></div>`;
  /** Dica por alternativa: ao errar, o core mostra q.dica; este getter devolve a explicação da opção escolhida. */
  const comDicas = q => { if(q.dicas){ const geral = q.dica; Object.defineProperty(q, 'dica', { configurable:true, enumerable:true,
    get(){ const r = ((PF.state() || {}).respostas || {})[q.id], v = r && !r.retry && !r.ok ? r.val : null; return (v != null && q.dicas[String(v)]) || geral; } }); } return q; };
  const opA = d => C.emExecucao(d).map(i => ({ id:i.id, label:`${i.id} · ${curto(i.titulo, 72)}` }));
  const pool = d => (C.regra(d, 'R41') || {}).valor || [];

  /* ---------------------------------------------------------------- N1-C09 · Rótulo certo (§2.2) */
  const ROT = { PROP:'Proposta A&M · a validar', AVF:'A validar FEG', DFP:'Decisão de produto (DFP)', ILU:'Ilustrativo', ONS:'Fonte ONS (documento aprovado)' };
  /** Rótulo esperado pela precedência da §2.2, lido da própria regra (contradição → A validar FEG; proposta do deck → Proposta A&M; …). */
  const rotuloDe = r => !r ? 'AVF' : r.contradicao ? 'AVF' : r.origemRegra === 'FONTE_ONS' && r.tipoFonte === 'DOCUMENTO_ONS_APROVADO' ? 'ONS'
    : r.origemRegra === 'A_VALIDAR_FEG' && r.tipoFonte === 'PROPOSTA_CONSULTORIA' ? 'PROP' : r.origemRegra === 'A_VALIDAR_FEG' ? 'AVF' : r.origemRegra === 'DECISAO_FUNCIONAL_PRODUTO' ? 'DFP' : 'ILU';
  const itensC09 = d => { const e05 = C.ini(d, 'E05'), L13 = C.param(d, 'R13');
    return [
      { id:1, txt:'O deck A&M v25 (s4) propõe quatro gerências na FE: FEG, FEL, FEN e FER', regra:'R01', prec:'regra 3: afirmação descritiva do deck' },
      { id:2, txt:`Desvio de ${L13.vermelhoDesvioMeses} meses ou mais deixa a iniciativa vermelha`, regra:'R13', prec:'regra 2: parâmetro usado em cálculo, sem documento ONS' },
      { id:3, txt:'Arquivar em vez de apagar; o histórico só recebe acréscimos', regra:'R06', prec:'regra 5: mecânica do repositório' },
      { id:4, txt:'O deck traz o Planejamento do Portfólio como semestral (s127) e como anual (s205)', regra:'R05b', prec:'regra 1: contradição entre fontes' },
      { id:5, txt:'O sistema classifica o horizonte em 30/60/90 reproduzindo a função já implementada no repositório', regra:'R08', prec:'regra 5: mecânica do repositório' },
      { id:6, txt:'O sistema usa as categorias Obrigatória/Sustentação/Evolução/Inovação para calcular o mix', regra:'R12', prec:'regra 2: taxonomia usada em cálculo' },
      { id:7, txt:'Segundo o deck (s129), o Fórum de Acompanhamento é mensal e coordenado pela FEG', regra:'R05a', prec:'regra 3: afirmação descritiva do deck' },
      { id:8, txt:`E05 tem orçamento de R$ ${fmt.n(C.bac(d, e05), 2)} mi e ${fmt.n(e05.percentualFisicoReal)}% de avanço físico`, regra:null, prec:'regra 8: dado de iniciativa' },
    ].map(x => Object.assign(x, { certo: x.regra ? rotuloDe(C.regra(d, x.regra)) : 'ILU' })); };
  const MIN9 = 6;
  const AULA_PREC = `<div class="callout conceito"><span class="ic">${PF.icon('book', 16)}</span><div><p><b>Aula rápida · precedência dos rótulos (de cima para baixo)</b></p>
    <ol style="margin:4px 0 0;padding-left:18px;font-size:13.5px"><li>Contradição entre fontes → A validar FEG (o app mostra as duas).</li><li>Parâmetro ou regra usada em cálculo, sem documento ONS → A validar FEG.</li>
    <li>Afirmação descritiva do deck (estrutura, papéis, fóruns) → Proposta A&amp;M · a validar.</li><li>Comentário de revisão do deck → Rascunho de revisão (aparece a partir do N2).</li>
    <li>Mecânica do repositório ou escolha de projeto da trilha → Decisão de produto (DFP).</li><li>Fórmula de mercado → DFP + Ref. de mercado.</li><li>Artefato interno (Afinação FEG) → A validar FEG.</li>
    <li>Dados de iniciativas, valores, datas e pessoas → Ilustrativo.</li><li>Fonte ONS → só com documento ONS aprovado e citado.</li></ol></div></div>`;

  /* ---------------------------------------------------------------- DC1-01 · triagem da fila */
  const notaTri = (g) => g.saida === 'DEVOLVER' ? ' Escopo e fluxo próprio estão confirmados nos campos; falta o que permite analisar.' : '';
  const tabelaTri = (d, esc_) => { const fila = C.demandas(d), r = C.avaliarTriagem(d, esc_ || {}, { ids:fila.map(i => i.id) });
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Demanda</th><th>Saída pela precedência</th>${esc_ ? '<th>Sua escolha</th><th class="r">Pontos</th>' : ''}</tr></thead><tbody>${fila.map(i => { const g = C.triagemSugerida(d, i), x = r.porDemanda.find(y => y.id === i.id);
      return `<tr><td><b>${esc(i.id)}</b></td><td>${esc(nomeT(d, g.saida))}${g.destino ? ' → ' + esc(g.destino) : g.vinculo ? ' (vínculo com ' + esc(g.vinculo) + ')' : ''}${g.observacao ? ' · ' + esc(g.observacao) : ''}<small>${esc(g.motivo + notaTri(g))}</small></td>
        ${esc_ ? `<td>${x.escolhida ? esc(nomeT(d, x.escolhida)) : '—'}</td><td class="r num">${fmt.n(x.pontos, x.pontos % 1 ? 1 : 0)}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>`; };

  const Q = [
  /* ============================================================ (a) Conceituais (9) */
  { id:'N1-C01', titulo:'O que é portfólio', tipo:'conceito', formato:'mc', regra:'R30', conceito:'Portfólio e fronteira', ver:'#/fontes?aba=glossario',
    enunciado:'Qual frase descreve melhor um portfólio?',
    alternativas:[{ id:'A', texto:'Projetos inter-relacionados, coordenados para obter benefícios que isolados não teriam' }, { id:'B', texto:'O cronograma consolidado de todas as tarefas e entregas da gerência no ano' },
      { id:'C', texto:'Projetos, programas e operações gerenciados em conjunto para atingir objetivos estratégicos' }, { id:'D', texto:'A lista de itens de trabalho do Azure DevOps ordenada pela data de entrega' }], correta:'C',
    dica:'Pense em “fazer as coisas certas”: o que se escolhe para atingir objetivos, não como se executa.',
    dicas:{ A:'Essa frase descreve um programa: projetos coordenados para gerar benefícios conjuntos. O portfólio é mais amplo.', B:'Cronograma de tarefas é execução: fica nas ferramentas de execução, não no portfólio.', D:'Lista de itens do ADO é execução, não portfólio.' },
    justificativa:'<p><b>Portfólio: projetos, programas e operações gerenciados em conjunto para atingir objetivos estratégicos.</b> “Projetos inter-relacionados com benefícios conjuntos” descreve <b>programa</b>. Cronograma de tarefas e lista de itens do ADO são <b>execução</b>, que fica nas ferramentas de execução (ADO, Jira, ITSM). Referência de mercado: PMI.</p>' },
  { id:'N1-C02', titulo:'Tarefas no portfólio?', tipo:'conceito', formato:'mc', regra:'R06', conceito:'Portfólio e fronteira', ver:'#/n1/mapa?aba=fronteira',
    enunciado:'Uma squad quer acompanhar no sistema de portfólio as tarefas da sprint e os chamados. O que responder?',
    alternativas:[{ id:'A', texto:'Tarefas e chamados ficam no ADO, Jira ou ITSM; o portfólio guarda a iniciativa, os dados consolidados e o link' }, { id:'B', texto:'Cadastrar cada tarefa como iniciativa, para que o painel mostre o andamento completo da squad' },
      { id:'C', texto:'Manter uma planilha paralela com as tarefas e anexá-la à ficha de cada iniciativa no sistema' }, { id:'D', texto:'Cadastrar só os chamados críticos, porque os demais não interessam à gerência executiva' }], correta:'A',
    dica:'Releia a aba Fronteira do Mapa da FE: o que o app recebe das ferramentas de execução?',
    dicas:{ B:'Tarefa não é iniciativa: o painel ficaria cheio de itens que não se escolhem no portfólio.', C:'Planilha paralela duplica o dado e perde a rastreabilidade.', D:'Chamado crítico continua sendo chamado: o lugar dele é o ITSM.' },
    justificativa:'<p><b>Tarefas e chamados ficam no ADO, Jira ou ITSM.</b> Princípio do repositório: o sistema não substitui ADO, Jira nem ITSM. O portfólio guarda a iniciativa, os dados consolidados e o link do registro de origem.</p>' },
  { id:'N1-C03', titulo:'Fórum de Acompanhamento', tipo:'conceito', formato:'mc', regra:'R05a', conceito:'Estrutura e fóruns', ver:'#/n1/mapa?aba=foruns',
    enunciado:'Segundo a proposta do deck A&M (s129), quem coordena o Fórum de Acompanhamento de Portfólio e com que periodicidade?',
    alternativas:[{ id:'A', texto:'O Líder de Comunidade, a cada trimestre' }, { id:'B', texto:'A Diretoria, uma vez por ano' }, { id:'C', texto:'O Product Owner, ao final de cada sprint' }, { id:'D', texto:'A FEG, mensalmente' }], correta:'D',
    dica:'Veja a linha do s129 na aba Fóruns do Mapa da FE.',
    justificativa:d => { const r = C.param(d, 'R05a') || {}; return `<p><b>A FEG, mensalmente.</b> s129 (proposta): responsável ${esc(r.coordenacao || 'FEG')}, periodicidade ${esc(r.periodicidade || 'mensal')}. Saídas: painel de status, registro de riscos e desvios, histórico de escalonamentos. É proposta de consultoria: a FEG ainda valida.</p>`; } },
  { id:'N1-C04', titulo:'Blocos do Pool', tipo:'conceito', formato:'multi', regra:['R41','R42'], conceito:'Estrutura e fóruns', ver:'#/n1/mapa?aba=pool',
    enunciado:'Segundo o organograma proposto (s56/s57), quais blocos compõem o Pool de Recursos de Governança?',
    opcoes:d => pool(d).map((p, k) => ({ id:'P' + (k + 1), label:p })).concat([{ id:'X1', label:'Interface institucional e regulatória' }, { id:'X2', label:'Product Owner' }]),
    corretas:d => pool(d).map((p, k) => 'P' + (k + 1)),
    dica:'Separe o que é bloco do Pool (deck, s56/s57) do que é papel de aprendizagem do Afinação FEG ou papel da squad.',
    justificativa:d => `<p><b>${pool(d).map(esc).join(' · ')}.</b> “Interface institucional e regulatória” é papel de aprendizagem do Afinação FEG (R42), não bloco do Pool. O PO atua nas squads.</p>` },
  { id:'N1-C05', titulo:'Sem baseline', tipo:'conceito', formato:'mc', regra:'R13', conceito:'Sinal e baseline', ver:'#/n1/saude?aba=sinal',
    enunciado:'E06 não tem data planejada (baseline). Qual sinal o sistema mostra?',
    alternativas:[{ id:'A', texto:'Verde, porque a previsão atual (abr/2027) ainda está longe' }, { id:'B', texto:'Cinza, com pendência de cadastro para registrar a baseline' },
      { id:'C', texto:'Amarelo, por precaução, até a baseline ser informada' }, { id:'D', texto:'Vermelho, porque falta um dado obrigatório do cadastro' }], correta:'B',
    dica:'A cor compara com uma referência. O que acontece quando a referência não existe?',
    dicas:{ A:'Verde sem referência é opinião e passaria falsa segurança.', C:'Amarelo “por precaução” também é uma cor inventada.', D:'Falta de dado não é desempenho ruim: a cor precisa mostrar que não há referência.' },
    justificativa:d => { const s = C.sinal(d, 'E06'); return `<p><b>Cinza, com pendência de cadastro.</b> ${s ? esc(s.motivo) + '.' : ''} A cor compara com uma referência; sem baseline, qualquer cor é opinião. Verde passaria falsa segurança. Registre a pendência de baseline com responsável e prazo.</p>`; } },
  { id:'N1-C06', titulo:'Arquivar', tipo:'conceito', formato:'mc', regra:'R06', conceito:'Portfólio e fronteira', ver:'#/inventario',
    enunciado:'O que significa arquivar uma iniciativa no sistema?',
    alternativas:[{ id:'A', texto:'Apagar o registro para manter o inventário limpo' }, { id:'B', texto:'Mover os dados para uma planilha de histórico' }, { id:'C', texto:'Pintar a iniciativa de cinza no painel de saúde' },
      { id:'D', texto:'Marcar como inativa, preservando dados, decisões e histórico' }], correta:'D',
    dica:'No Inventário, ligue “Incluir arquivadas”: o que acontece com X01?',
    dicas:{ A:'No repositório não existe apagar: a história precisa continuar consultável.', B:'Os dados continuam no próprio sistema, não em planilha.', C:'Cinza é o sinal sem referência, não arquivamento.' },
    justificativa:'<p><b>Marcar como inativa, preservando dados, decisões e histórico.</b> <code>archive_initiative</code> (migrations 0012/0017) e regra 4 do <code>data-model.md</code>: arquivar (ativo: não), nunca apagar. X01 só aparece com “Incluir arquivadas”.</p>' },
  { id:'N1-C07', titulo:'63% é bom?', tipo:'conceito', formato:'mc', regra:'R30', conceito:'Orçamento e progresso', ver:'#/indicadores?k=I1.5',
    enunciado:d => `Execução orçamentária de ${fmt.pct(C.execucaoOrcamentaria(d).valor, 0)} na carteira em execução: isso é bom?`,
    alternativas:[{ id:'A', texto:'Depende: é preciso comparar com o progresso físico e com o planejado até a data' }, { id:'B', texto:'Sim: sobra dinheiro e a carteira está claramente sob controle' },
      { id:'C', texto:'Não: gastar pouco indica que as iniciativas estão atrasadas' }, { id:'D', texto:'Sim, desde que o número fique abaixo de 70% até o fim do ano' }], correta:'A',
    dica:'Um número de gasto sozinho não diz se a iniciativa andou.',
    dicas:{ B:'Sobrar dinheiro pode ser paralisação: falta comparar com o avanço físico.', C:'Gastar pouco também pode ser eficiência: falta comparar com o avanço físico.', D:'Não existe limiar de 70% para esse indicador.' },
    justificativa:d => { const x = C.execucaoOrcamentaria(d); return `<p><b>Depende: compare com o progresso físico e com o planejado até a data.</b> ${n2(x.ac)} ÷ ${n2(x.bac)} = ${pc(x.valor)}. Gastar pouco pode ser eficiência ou paralisação; só o físico desfaz a dúvida (índice progresso × gasto, I1.6).</p>`; } },
  { id:'N1-C08', titulo:'Squad válida', tipo:'conceito', formato:'mc', regra:'R06', conceito:'Estrutura e fóruns', ver:'#/n1/mapa?aba=estrutura',
    enunciado:'Ao cadastrar uma iniciativa na comunidade PPE (FEN), qual squad o sistema aceita?',
    alternativas:[{ id:'A', texto:'RP-B, porque é a squad com mais capacidade livre' }, { id:'B', texto:'Qualquer squad ativa, de qualquer gerência' }, { id:'C', texto:'PPE-B, porque pertence à comunidade PPE' },
      { id:'D', texto:'Nenhuma: a squad é obrigatória e precisa ser criada antes' }], correta:'C',
    dica:'Veja a hierarquia Gerência → Comunidade → Squad na aba Estrutura.',
    dicas:{ A:'Capacidade livre não muda a hierarquia: RP-B é de outra comunidade.', B:'A squad precisa ser da mesma comunidade da iniciativa.', D:'A squad é opcional no cadastro.' },
    justificativa:d => { const b = { titulo:'x', descricaoObjetivo:'x', gerenciaId:'FEN', comunidadeId:'PPE', responsavel:'x' }, v = s => PF.validar('iniciativas', Object.assign({}, b, s ? { squadId:s } : {}), d);
      const e1 = v('RP-B')[0] || {}; return `<p><b>PPE-B, porque pertence à comunidade PPE.</b> Testado na validação do sistema: com RP-B aparece <span title="${esc(e1.codigo || '')}">“${esc(e1.msg || '—')}”</span> (o código técnico fica só no tooltip); com PPE-B ${v('PPE-B').length ? 'há erro' : 'é aceita'}; sem squad ${v(null).length ? 'há erro' : 'é aceita'}: a squad é opcional.</p>`; } },
  { id:'N1-C09', titulo:'Rótulo certo', tipo:'conceito', formato:'custom', regra:{ origemRegra:'DECISAO_FUNCIONAL_PRODUTO', tipoFonte:'ARTEFATO_INTERNO', referencia:'Precedência dos rótulos de origem (§2.2), decisão de produto da trilha' },
    conceito:'Rótulos de origem', ver:'#/fontes?aba=rotulos',
    enunciado:'Classifique cada afirmação com o rótulo que a interface mostra.', contexto:() => AULA_PREC + `<p class="muted" style="margin:10px 0 0">Ok com pelo menos ${MIN9} de 8.</p>`,
    dica:'Siga a precedência de cima para baixo: a primeira regra que se aplica define o rótulo. Contradição vem antes de tudo.',
    render(el, d, answer){
      const it = itensC09(d), sel = PF.ui_state('q:N1-C09', {}) || {};
      el.innerHTML = `<div class="stack" style="gap:10px">${it.map(x => `<div class="pf1-q9"><span class="muted">${x.id}.</span><span>${esc(x.txt)}</span><select class="select" data-q9="${x.id}" aria-label="Rótulo da afirmação ${x.id}"><option value="">Escolha o rótulo…</option>${Object.entries(ROT).map(([k, l]) => `<option value="${k}" ${sel[x.id] === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`).join('')}
        <div class="row"><button class="btn btn-primary btn-sm" data-q9-ok>Conferir rótulos</button></div></div>`;
      el.querySelectorAll('[data-q9]').forEach(s => s.onchange = () => { const v = Object.assign({}, PF.ui_state('q:N1-C09', {}) || {}); v[s.dataset.q9] = s.value; PF.set_ui('q:N1-C09', v); });
      el.querySelector('[data-q9-ok]').onclick = () => { const v = PF.ui_state('q:N1-C09', {}) || {}; if(it.some(x => !v[x.id])){ PF.toast('Escolha um rótulo para cada afirmação.'); return; }
        const n = it.filter(x => v[x.id] === x.certo).length; if(n >= MIN9) PF.award('m-rotulo', 'Rótulo certo'); PF.set_ui('q:N1-C09', {}); answer(n >= MIN9, { sel:v, acertos:n }); };
    },
    renderDone(el, d, rec){ const v = (rec.val && rec.val.sel) || {}, mostra = rec.ok || rec.revelada;
      el.innerHTML = `<ol class="pf1-ul" style="list-style:decimal">${itensC09(d).map(x => `<li>${esc(x.txt)} → <b>${esc(ROT[v[x.id]] || '—')}</b>${mostra ? (v[x.id] === x.certo ? ' <span class="tone-ok">✓</span>' : ' <span class="tone-bad">✗</span>') : ''}</li>`).join('')}</ol>
        <p class="muted" style="margin:8px 0 0">Acertos: <b>${rec.val && rec.val.acertos != null ? rec.val.acertos : '—'}</b> de 8${mostra ? '' : ' · quais estão certos aparece ao acertar ou ao ver a resposta'}.</p>`; },
    justificativa:d => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Afirmação</th><th>Rótulo</th><th>Regra de precedência</th></tr></thead><tbody>${itensC09(d).map(x => `<tr><td>${x.id}. ${esc(x.txt)}</td><td><b>${esc(ROT[x.certo])}</b></td><td>${esc(x.prec)}${x.regra ? ` <span class="dim">(${esc(x.regra)})</span>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <p style="margin:8px 0 0">Nenhum item é “Fonte ONS”: hoje não há documento ONS aprovado citado no sistema.</p>` },

  /* ============================================================ (b) Análise do portfólio (9), sobre PF.base */
  { id:'AQ1-01', titulo:'Quem está vermelha', tipo:'analise', formato:'multi', regra:'R13', conceito:'Sinal e baseline', ver:'#/n1/saude?aba=sinal',
    enunciado:'Quais iniciativas em execução estão vermelhas pela regra calculada?', opcoes:opA, corretas:d => C.sinais(d).filter(s => s.cor === 'VERMELHO').map(s => s.id),
    dica:'Aplique a regra do sinal a cada uma: vale a pior dimensão entre desvio de prazo (meses de calendário) e índice progresso × gasto.',
    justificativa:d => { const s = C.sinais(d), v = s.filter(x => x.cor === 'VERMELHO'), p = C.pctOrcamentoVermelho(d), cz = s.filter(x => x.cor === 'CINZA').map(x => x.id);
      return J(d, { r:`<b>${esc(lista(v.map(x => x.id)))}</b>.`, c:`Sinal calculado (R13) de cada iniciativa em execução, pior dimensão: ${v.map(x => `${esc(x.id)}: ${esc(x.motivo)}`).join('; ')}.`,
        l:`${v.length} de ${s.length} em execução estão vermelhas e somam ${pc(p.valor)} do orçamento em execução.`, k:`${cz.length ? esc(lista(cz)) + ' é Cinza (sem referência), não verde nem vermelha. ' : ''}A regra é didática e a validar: não usar em reporte.`,
        p:'Levar as vermelhas ao fórum, começando pela causa raiz.' }); } },
  { id:'AQ1-02', titulo:'% do orçamento em vermelho', tipo:'analise', formato:'num', regra:'R13', conceito:'Orçamento e progresso', ver:'#/indicadores?k=I1.4',
    enunciado:'Que % do orçamento em execução está em iniciativas com sinal vermelho?', calc:d => { const v = C.pctOrcamentoVermelho(d).valor; return v == null ? null : Math.round(1000 * v) / 10; }, tolerancia:0.5, unidade:'%', casas:1,
    dica:'Some o BAC das vermelhas e divida pelo BAC de todas as iniciativas em execução. Use o valor (R$), não a contagem.',
    justificativa:d => { const p = C.pctOrcamentoVermelho(d);
      return J(d, { r:`<b>${pc(p.valor)}</b> (por contagem, ${pc(p.porContagem)}).`, c:`(${p.ids.map(id => n2(C.bac(d, id))).join(' + ')}) ÷ ${n2(p.denominador)}: BAC das vermelhas (${esc(lista(p.ids))}) ÷ BAC de todas em execução (I1.4).`,
        l:`Por valor o peso do vermelho é ${p.valor > p.porContagem ? 'maior' : 'menor'} do que por contagem: contagem e valor contam histórias diferentes.`, k:'O limiar do vermelho é regra didática a validar (R13); o BAC só soma linhas com fonte e período.',
        p:'Usar o % em R$ para dimensionar a pauta por exceção do fórum.' }); } },
  { id:'AQ1-03', titulo:'Divergência de sinal', tipo:'analise', formato:'pick', regra:'R13', conceito:'Sinal e baseline', ver:'#/n1/saude?aba=sinal',
    enunciado:'Em qual iniciativa o sinal declarado diverge do calculado?', opcoes:opA, correta:d => C.divergenciaSinal(d).ids[0],
    dica:'Compare, linha a linha, a coluna Declarado com a Calculado. Declarado vazio não diverge.',
    justificativa:d => { const x = C.divergenciaSinal(d), id = x.ids[0], s = C.sinal(d, id), h = (d.historico || []).filter(y => y.entidadeId === id && y.campoAlterado === 'ragDeclarado').slice(-1)[0];
      return J(d, { r:`<b>${esc(id)}</b>: declarado ${nomeCor(s.declarado)} × calculado ${nomeCor(s.cor)}.`, c:`Declarado ≠ vazio e ≠ calculado: ${x.n} de ${x.total} com sinal declarado (${pc(x.valor)}).`,
        l:h ? `O histórico mostra a mudança de ${esc(nomeCor(h.valorAnterior))} para ${esc(nomeCor(h.valorNovo))} em ${fmt.date(String(h.alteradoEm).slice(0, 10))} ${h.justificativa ? 'com justificativa' : '<b>sem justificativa</b>'}: status melancia.` : 'Status melancia: declarado melhor do que o calculado.',
        k:'Não corrija a cor na mão: a divergência vira pendência com responsável e prazo.', p:`Registrar em ${esc(id)} uma pendência do tipo <span title="DIVERGENCIA_STATUS">“Divergência de status”</span>, com responsável e prazo.` }); } },
  { id:'AQ1-04', titulo:'Campos obrigatórios vazios', tipo:'analise', formato:'multi', regra:['R10a','R10b'], conceito:'Cadastro', ver:'#/inventario',
    enunciado:'Quais iniciativas em execução têm campo obrigatório vazio?', opcoes:opA, corretas:d => Array.from(new Set(C.completude(d).faltas.map(f => f.id))),
    dica:'Confira os 5 campos do repositório (R10a) e os 5 da trilha (R10b) em cada iniciativa em execução; o ícone de pendência no Inventário ajuda.',
    justificativa:d => { const x = C.completude(d);
      return J(d, { r:`<b>${x.faltas.map(f => `${esc(f.id)}: ${esc(CAMPO[f.campo] || f.campo)}`).join('; ')}</b>.`, c:`Campos de R10a + R10b em cada iniciativa em execução: ${x.preenchidos} de ${x.total} preenchidos (${pc(x.pct)}).`,
        l:'Completude alta, mas cada buraco muda uma leitura: sem baseline a iniciativa fica Cinza; sem objetivo, não se sabe por que ela existe.', k:'Não invente valor para fechar o dado: registre pendência com responsável e prazo.',
        p:'Registrar as pendências de cadastro (passo 1 do desafio).' }); } },
  { id:'AQ1-05', titulo:'Desvio mediano de prazo', tipo:'analise', formato:'num', regra:'R14', conceito:'Prazos', ver:'#/indicadores?k=I1.7',
    enunciado:'Qual o desvio mediano de prazo das iniciativas com baseline, em meses de calendário?', calc:d => C.desvios(d).mediana, tolerancia:0.15, unidade:'meses', casas:1,
    dica:'Desvio = (12 × ano + mês previsto) − (12 × ano + mês planejado), só para quem tem baseline. Ordene a lista e pegue o valor do meio.',
    justificativa:d => { const x = C.desvios(d);
      return J(d, { r:`<b>${nn(x.mediana)} ${mes(x.mediana)}</b> (média ${fmt.n(x.media, 1)}).`, c:`${x.lista.map(y => `${esc(y.id)} ${y.desvio}`).join(' · ')} → ordenados ${x.valores.slice().sort((a, b) => a - b).join(', ')}; mediana é o do meio.`,
        l:'A média fica acima da mediana porque poucos casos grandes puxam a média.', k:'Previsão já vencida usa a data de referência (R14); chamar o desvio de “atraso” é a validar.', p:'Mostrar a distribuição no fórum, não só a média.' }); } },
  { id:'AQ1-06', titulo:'Entregas em até 90 dias', tipo:'analise', formato:'multi', regra:'R08', conceito:'Prazos', ver:'#/n1/saude?aba=prazos',
    enunciado:'Quais iniciativas em execução entregam em até 90 dias?', opcoes:opA, corretas:d => C.horizontes(d).itens.filter(x => /_DIAS$/.test(x.faixa)).map(x => x.id),
    dica:'Conte dias corridos da data de referência até a data prevista atual; até 90 dias, inclusive, entra.',
    justificativa:d => { const h = C.horizontes(d), it = h.itens.filter(x => /_DIAS$/.test(x.faixa));
      return J(d, { r:`<b>${it.map(x => `${esc(x.id)} (${x.dias} d)`).join(' e ')}</b>.`, c:`Dias corridos até a data prevista atual, faixas 30/60/90 inclusivas (R08): ${h.itens.map(x => `${esc(x.id)} ${x.dias == null ? 'sem data' : x.dias + ' d'}`).join(' · ')}.`,
        l:'É o que pode entregar no trimestre; o resto está além de 90 dias.', k:'A própria data de referência cai na faixa de 30 dias; data já passada conta como Vencido e iniciativa sem data fica em Sem data.', p:'Confirmar com os PO se as entregas do trimestre seguem de pé.' }); } },
  { id:'AQ1-07', titulo:'Riscos abertos', tipo:'analise', formato:'num', regra:'R09', conceito:'Riscos e dependências', ver:'#/n1/saude?aba=riscos',
    enunciado:'Quantos riscos e impedimentos das iniciativas em execução estão abertos?', calc:d => C.riscosAbertos(d).length, tolerancia:0, unidade:'riscos e impedimentos', casas:0,
    dica:'Só fecha com RESOLVIDO, CONCLUIDO ou FECHADO. Leia o status literal de cada registro, inclusive os estranhos.',
    justificativa:d => { const a = C.riscosAbertos(d), est = a.filter(r => r.status == null || r.status === '' || !['ABERTO'].includes(String(r.status).toUpperCase()));
      return J(d, { r:`<b>${a.length}</b> (${esc(lista(a.map(r => r.id)))}); ${a.filter(r => r.vencido).length} vencido.`, c:'Contei os registros das iniciativas em execução cujo status não é RESOLVIDO, CONCLUIDO nem FECHADO; status vazio conta como aberto (regra literal do repositório).',
        l:`${new Set(a.map(r => r.iniciativaId)).size} iniciativas têm algum risco ou impedimento aberto.`, k:`${est.map(r => `${esc(r.id)} (${r.status ? '“' + esc(r.status) + '”' : 'status vazio'})`).join(' e ')} contam como abertos.`,
        p:'Escalar primeiro o que está vencido.' }); } },
  { id:'AQ1-08', titulo:'Bloqueio por vermelha', tipo:'analise', formato:'pick', regra:'R09', conceito:'Riscos e dependências', ver:'#/n1/saude?aba=riscos',
    enunciado:'Qual iniciativa vermelha bloqueia outra em execução?', opcoes:opA, correta:d => (C.bloqueios(d).find(b => b.porVermelha) || {}).por,
    dica:'Leia as dependências abertas como “X é bloqueada por Y” e confira a cor de Y.',
    justificativa:d => { const b = C.bloqueios(d).find(x => x.porVermelha) || {};
      return J(d, { r:`<b>${esc(b.por || '—')}</b>, que bloqueia ${esc(b.bloqueada || '—')} via ${esc(b.dependenciaId || '—')}.`, c:'Dependências abertas (status fora de RESOLVIDA, CONCLUIDA e FECHADA) cuja iniciativa bloqueadora está com sinal calculado vermelho.',
        l:'Efeito cascata: parte do problema da bloqueada vem de quem bloqueia.', k:'Escalar só a bloqueada não destrava nada.', p:`Levar ${esc(b.por || '—')} ao fórum como causa raiz.` }); } },
  { id:'AQ1-09', titulo:'Demandas envelhecidas', tipo:'analise', formato:'multi', regra:'R16', conceito:'Triagem', ver:'#/n1/triagem',
    enunciado:d => `Quais demandas aguardam decisão há mais de ${C.idadeDemandas(d).limiar} dias?`, opcoes:d => C.demandas(d).map(i => ({ id:i.id, label:`${i.id} · ${curto(i.titulo, 72)}` })),
    corretas:d => C.idadeDemandas(d).acima, dica:'Idade = dias corridos da data de entrada até a data de referência. Mais que o limiar, não igual.',
    justificativa:d => { const x = C.idadeDemandas(d);
      return J(d, { r:`<b>${esc(lista(x.acima.map(id => `${id} (${x.lista.find(y => y.id === id).dias} d)`)))}</b>.`, c:`Dias da data de entrada até a referência: ${x.lista.map(y => `${esc(y.id)} ${y.dias} d`).join(' · ')}; limiar ${x.limiar} dias (R16).`,
        l:`Mediana de ${nn(x.mediana)} dias. Demanda envelhecida é decisão evitada.`, k:'O limiar de alerta é premissa a validar (R16); a idade conta até a data de referência, não até hoje.', p:'Priorizar a triagem das mais antigas.' }); } },

  /* ============================================================ (c) Decisão de escolha (5) */
  { id:'DC1-01', titulo:'Triagem da fila', tipo:'decisao', formato:'custom', regra:'R17', conceito:'Triagem', ver:'#/n1/triagem',
    enunciado:'Recomende a triagem de cada demanda da fila.',
    contexto:d => `<p class="muted" style="margin:0">Leia o checklist T1–T6 na ordem T1 → T4 → T5 → T2/T3/T6: a primeira falha define a saída. Cada acerto vale 1 ponto; precisa de pelo menos ${Math.min(4, C.demandas(d).length)} de ${C.demandas(d).length}.</p>`,
    dica:'Para cada demanda, ache a primeira falha na ordem T1 → T4 → T5 → T2/T3/T6. Estimativa em outra unidade conta como estimativa.',
    render(el, d, answer){
      const fila = C.demandas(d), sel = PF.ui_state('q:DC1-01', {}) || {}, dst = PF.ui_state('q:DC1-01d', {}) || {};
      el.innerHTML = `<div class="stack" style="gap:10px">${fila.map(i => { const ck = C.checklistTriagem(d, i);
        return `<div class="card stack" style="gap:8px;padding:14px"><div class="row"><b>${esc(i.id)}</b><span class="muted" style="font-size:13px">${esc(curto(i.titulo, 90))}</span></div>
          <div class="pf1-ck">${ck.map(x => `<span title="${esc(x.pergunta)}"><b>${x.id}</b> ${esc(x.campo)}: ${N.vtxt(x.valor)}</span>`).join('')}</div>
          <div class="row"><select class="select" data-dc1="${esc(i.id)}" aria-label="Saída para ${esc(i.id)}"><option value="">Escolha a saída…</option>${C.TRIAGEM.map(s => `<option value="${s}" ${sel[i.id] === s ? 'selected' : ''}>${esc(nomeT(d, s))}</option>`).join('')}</select>
          <input class="input" data-dc1d="${esc(i.id)}" value="${esc(dst[i.id] || '')}" placeholder="destino ou vínculo (opcional)" style="flex:1;min-width:160px"></div></div>`; }).join('')}
        <div class="row"><button class="btn btn-primary btn-sm" data-dc1-ok>Conferir recomendações</button><span class="dim" style="font-size:12.5px">Só confere a resposta; o registro simulado fica na tela Triagem.</span></div></div>`;
      const guarda = (k, a, b) => { const v = Object.assign({}, PF.ui_state(k, {}) || {}); v[a] = b; PF.set_ui(k, v); };
      el.querySelectorAll('[data-dc1]').forEach(s => s.onchange = () => guarda('q:DC1-01', s.dataset.dc1, s.value));
      el.querySelectorAll('[data-dc1d]').forEach(s => s.onchange = () => guarda('q:DC1-01d', s.dataset.dc1d, s.value));
      el.querySelector('[data-dc1-ok]').onclick = () => { const v = PF.ui_state('q:DC1-01', {}) || {}; if(fila.some(i => !v[i.id])){ PF.toast('Escolha uma saída para cada demanda.'); return; }
        const r = C.avaliarTriagem(d, v, { ids:fila.map(i => i.id) }), dd = PF.ui_state('q:DC1-01d', {}) || {}; PF.set_ui('q:DC1-01', {}); PF.set_ui('q:DC1-01d', {});
        answer(r.ok, { escolhas:v, destinos:dd, nota:r.nota, max:r.max }); };
    },
    renderDone(el, d, rec){ const v = (rec.val && rec.val.escolhas) || {}, ds = (rec.val && rec.val.destinos) || {}, mostra = rec.ok || rec.revelada;
      el.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Demanda</th><th>Sua recomendação</th></tr></thead><tbody>${Object.keys(v).map(id => `<tr><td><b>${esc(id)}</b></td><td>${esc(nomeT(d, v[id]))}${ds[id] ? `<small>${esc(ds[id])}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>
        <p class="muted" style="margin:6px 0 0">Pontos: <b>${rec.val ? fmt.n(rec.val.nota, rec.val.nota % 1 ? 1 : 0) : '—'}</b> de ${rec.val ? rec.val.max : '—'}${mostra ? '' : ' · o detalhe por demanda aparece ao acertar ou ao ver a resposta'}.</p>`; },
    justificativa:(d, resp) => `<p style="margin:0 0 8px">Saída pela precedência do checklist (R17), calculada sobre a referência. Devolver numa admissão com evidência pendente vale meio ponto.</p>${tabelaTri(d, resp && resp.escolhas)}
      <p style="margin:8px 0 0">A analista recomenda; quem decide é o PO da squad (proposta s143). O registro real acontece no ITSM/ADO.</p>` },
  { id:'DC1-02', titulo:'Pauta do fórum de outubro', tipo:'decisao', formato:'decisao', regra:['R13','R05a'], conceito:'Gestão por exceção', ver:'#/dashboard?aba=n1',
    enunciado:'Pauta do [Simulado] Fórum de Acompanhamento de out/2026: quais iniciativas entram na discussão aprofundada?',
    contexto:() => `<p style="margin:0">Há 30 minutos para discussão aprofundada de <b>no máximo 2</b> iniciativas ${PF.badge('ILUSTRATIVO')}. As demais entram no informe geral.</p>`,
    itens:d => C.emExecucao(d).map(i => { const s = C.sinal(d, i); return { id:i.id, label:`${i.id} · ${curto(i.titulo, 54)}`, cols:{ sinal:s.cor, declarado:i.ragDeclarado || null, bac:C.bac(d, i), desvio:s.desvio, n:1 } }; }),
    colunas:[{ key:'sinal', label:'Sinal calculado', fmt:v => pill(v) }, { key:'declarado', label:'Declarado', fmt:v => v ? pill(v) : '<span class="dim">—</span>' },
      { key:'bac', label:'BAC (R$ mi)', fmt:v => n2(v) }, { key:'desvio', label:'Desvio (meses)', fmt:v => v == null ? '<span class="dim">sem baseline</span>' : fmt.n(v) }],
    limites:[{ key:'n', label:'Itens na pauta', max:2, casas:0 }],
    dica:'Gestão por exceção: comece pelo que está fora da tolerância. Pendência de cadastro e amarela entram no informe.',
    avaliar(sel, d){
      if(sel.length > 2) return { ok:false, nota:0, feedback:'<p>Passou do limite: no máximo 2 iniciativas cabem nos 30 minutos.</p>' };
      const r = C.avaliarPauta(d, sel), s = C.sinais(d), p = C.pctOrcamentoVermelho(d), mel = C.divergenciaSinal(d).ids, fb = [];
      if(r.caso === 'EXCECAO') fb.push(`Gestão por exceção: as duas vermelhas somam ${pc(p.valor)} do orçamento${mel.length ? `, e ${mel.join(', ')} ainda é melancia` : ''}.`);
      sel.forEach(id => { const x = s.find(y => y.id === id); if(!x) return;
        if(x.cor === 'CINZA') fb.push(`${id} é pendência de cadastro: resolve-se fora da pauta, com responsável e prazo.`);
        else if(x.cor === 'AMARELO') fb.push(`${id} está amarela, com desvio de ${x.desvio} ${mes(x.desvio)} e índice ${n2(x.indice)}: entra como informe.`);
        else if(x.cor === 'VERDE') fb.push(`${id} está verde: não pede discussão aprofundada.`); });
      if(r.caso === 'INCOMPLETA') fb.push('Ainda há iniciativa fora da tolerância sem lugar na pauta.');
      return { ok:r.ok, nota:r.nota, feedback:fb.map(x => `<p>${esc(x)}</p>`).join('') };
    },
    gabarito:d => `<p>${esc(lista(C.pctOrcamentoVermelho(d).ids))}: as vermelhas.</p>`,
    justificativa:d => { const p = C.pctOrcamentoVermelho(d); return J(d, { r:`<b>${esc(lista(p.ids))}</b>.`, c:'Gestão por exceção: entram as que estão fora da tolerância (sinal vermelho), na ordem vermelhas → divergências → Cinza.',
      l:`Juntas somam ${pc(p.valor)} do orçamento em execução.`, k:'Cinza e amarelas entram no informe; pendência de cadastro se resolve fora da pauta.', p:'Gravar o rascunho da pauta no Dashboard (passo 5 do desafio).' }); } },
  { id:'DC1-03', titulo:'O que levar primeiro', tipo:'decisao', formato:'mc', regra:['R05a','R09'], conceito:'Riscos e dependências', ver:'#/n1/saude?aba=riscos',
    enunciado:'E05 está vermelha, tem impedimento vencido (R2) e bloqueia E02 (Dep2). O que você leva primeiro ao fórum?',
    alternativas:[{ id:'A', texto:'E02, porque é a iniciativa com status melancia' }, { id:'B', texto:'E05, a causa raiz: R2 vencido trava E05 e, pela dependência, E02' },
      { id:'C', texto:'Nenhuma; esperar a próxima consolidação mensal' }, { id:'D', texto:'As duas juntas, como um ponto de “atenção geral”' }], correta:'B',
    dica:'Procure a causa raiz: quem trava quem?',
    dicas:{ A:'E02 precisa de registro, mas parte do desvio dela vem de E05.', C:'Esperar deixa o impedimento vencido sem dono por mais um mês.', D:'Escalonamento sem foco não gera decisão.' },
    justificativa:'<p><b>E05, a causa raiz.</b> A analista identifica e escala impedimentos, conflitos de prioridade e dependências críticas (s74, proposta). Resolver E05 destrava E02 pela Dep2; E02 entra com a pendência de divergência registrada.</p>' },
  { id:'DC1-04', titulo:'D2 sem evidência', tipo:'decisao', formato:'mc', regra:'R17', conceito:'Triagem', ver:'#/n1/triagem',
    enunciado:'D2 pede adequação regulatória, tem patrocinador e objetivo, mas o documento do requisito não foi anexado. A estimativa veio em horas. O que você recomenda?',
    alternativas:[{ id:'A', texto:'Marcar como Obrigatória e enviar direto para a execução da squad' }, { id:'B', texto:'Arquivar até que o documento seja anexado ao registro de origem' },
      { id:'C', texto:'Devolver e encerrar a demanda; o canal reabre quando houver documento' }, { id:'D', texto:'Admitir para análise como “candidata a obrigatória: evidência pendente”' }], correta:'D',
    dica:'O checklist passa? A falta do documento muda a entrada ou só a classificação?',
    dicas:{ A:'Obrigatória sem evidência é inventar regra.', B:'Arquivar tira a janela regulatória do radar.', C:'Perde a janela regulatória e a rastreabilidade.' },
    justificativa:'<p><b>Admitir para análise como “candidata a obrigatória: evidência pendente”.</b> O checklist T1–T6 passa: estimativa em horas conta (a unidade se resolve na qualificação, sem conversão inventada). A obrigatoriedade fica “candidata, evidência pendente”. Quem prioriza demandas no escopo do CT PMO-PLD é tema do Nível 2.</p>' },
  { id:'DC1-05', titulo:'Baseline “confie em mim”', tipo:'decisao', formato:'mc', regra:'R13', conceito:'Sinal e baseline', ver:'#/n1/saude?aba=sinal',
    enunciado:'A responsável por E06 diz: “Está verde, confie em mim. Grave a previsão atual (30/04/2027) como baseline para fechar o dado.”',
    alternativas:[{ id:'A', texto:'Manter Cinza e abrir pendência de baseline com responsável e prazo; a baseline precisa de aprovação registrada' }, { id:'B', texto:'Aceitar Verde, porque a responsável conhece a iniciativa melhor que o painel' },
      { id:'C', texto:'Gravar a baseline igual à previsão atual para fechar o dado ainda hoje' }, { id:'D', texto:'Arquivar E06 até que a baseline seja aprovada pelo fórum competente' }], correta:'A',
    dica:'Quem aprova uma baseline? E o que acontece com o desvio se a baseline for igual à previsão?',
    dicas:{ B:'Sinal declarado não substitui a comparação com referência.', C:'Baseline retroativa igual à previsão zera o desvio por construção: é maquiagem.', D:'Arquivar tira do radar uma iniciativa em execução.' },
    justificativa:'<p><b>Manter Cinza e abrir pendência de baseline.</b> Cinza mostra que falta referência. A baseline precisa de aprovação registrada pela instância; a analista abre a pendência com responsável e prazo e recomenda.</p>' },
  ].map(comDicas);

  L.questions.push(...Q);
})();
