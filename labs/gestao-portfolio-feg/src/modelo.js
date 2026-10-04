/* =========================================================================
   Gestão de Portfólio FEG - modelo de dados
   Catálogos, estado inicial, migração, operações sobre projetos e exemplos.
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, { hoje, uid } = GP.util;
  const VERSAO = 2;

  /* ------------------------------------------------------------ catálogos */
  const CAT = {
    gerencias: [
      { id:'FEG', nome:'FEG · Governança e Estratégia de Ferramentas Eletroenergéticas' },
      { id:'FEL', nome:'FEL · Ferramentas Elétricas' },
      { id:'FEN', nome:'FEN · Ferramentas Energéticas' },
      { id:'FER', nome:'FER · Ferramentas para Recursos e Carga' },
    ],
    tipos: ['Projeto', 'Evolução de ferramenta', 'Adequação regulatória', 'Inovação / prova de conceito', 'Sustentação / melhoria'],
    origens: ['Regulatória', 'Estratégica', 'Operacional', 'Melhoria contínua'],
  };
  /** Etapas do funil: entrada → triagem → aprovado → execução → concluído (e saídas: não entra, em espera, cancelado) */
  const ETAPAS = [
    { id:'entrada',  nome:'Nova demanda',          tom:'info',    grupo:'andamento', ordem:1, desc:'Cadastrada, ainda não avaliada na entrada.' },
    { id:'triagem',  nome:'Em triagem',            tom:'warn',    grupo:'andamento', ordem:2, desc:'Passando pelo checklist de entrada; pode faltar informação.' },
    { id:'aprovado', nome:'Admitido · aguardando', tom:'ok',      grupo:'andamento', ordem:3, desc:'Entrou no portfólio e aguarda priorização/início.' },
    { id:'execucao', nome:'Em execução',           tom:'ok',      grupo:'andamento', ordem:4, desc:'Em andamento pela equipe responsável.' },
    { id:'espera',   nome:'Em espera',             tom:'neutral', grupo:'andamento', ordem:5, desc:'Pausado por decisão; volta quando a condição mudar.' },
    { id:'concluido',nome:'Concluído',             tom:'neutral', grupo:'concluido', ordem:6, desc:'Entregue. Fica no acervo como histórico.' },
    { id:'nao_entra',nome:'Não entra',             tom:'bad',     grupo:'fora',      ordem:7, desc:'Não atende aos critérios de entrada (motivo registrado).' },
    { id:'cancelado',nome:'Cancelado',             tom:'bad',     grupo:'fora',      ordem:8, desc:'Interrompido depois de aprovado.' },
  ];
  const etapa = id => ETAPAS.find(e => e.id === id) || ETAPAS[0];

  /* ------------------------------------------------ checklist de entrada */
  /** Perguntas Sim/Não. tipo 'barreira' → "Não" = não entra; tipo 'informacao' → "Não" = falta informação. */
  const ENTRADA = [
    { id:'E1', tipo:'barreira', pergunta:'É um projeto (tem início, fim e uma entrega) e não uma tarefa de rotina, chamado ou incidente?',
      seNao:'É atividade de rotina/chamado: tratar no fluxo operacional (Azure DevOps, Jira ou atendimento).' },
    { id:'E2', tipo:'barreira', pergunta:'Está no escopo do portfólio Maestro (sistemas, modelos, ferramentas ou sua governança)?',
      seNao:'Fora do escopo do portfólio Maestro: encaminhar à área responsável.' },
    { id:'E3', tipo:'barreira', pergunta:'É uma demanda nova, que não duplica um projeto do acervo?',
      seNao:'Duplicado: juntar ao projeto que já existe.' },
    { id:'E4', tipo:'informacao', pergunta:'O objetivo e o benefício esperado estão descritos?',
      seNao:'Descrever objetivo e benefício esperado.', sugerir: p => !!(p.descricao && p.beneficio) },
    { id:'E5', tipo:'informacao', pergunta:'Tem demandante e patrocinador identificados?',
      seNao:'Identificar demandante e patrocinador.', sugerir: p => !!(p.demandante && p.patrocinador) },
    { id:'E6', tipo:'informacao', pergunta:'Tem uma estimativa mínima de esforço ou de prazo?',
      seNao:'Informar estimativa de esforço (FTE) ou duração.', sugerir: p => p.esforcoFte != null || p.duracaoMeses != null },
  ];
  /** Resultado do checklist: {resultado:'entra'|'nao_entra'|'falta_info'|'incompleto', motivos:[...], pendentes:[ids]} */
  function avaliarEntrada(resp = {}){
    const pendentes = ENTRADA.filter(q => resp[q.id] !== 'sim' && resp[q.id] !== 'nao').map(q => q.id);
    const barreiras = ENTRADA.filter(q => q.tipo === 'barreira' && resp[q.id] === 'nao');
    if(barreiras.length) return { resultado:'nao_entra', motivos: barreiras.map(q => q.seNao), pendentes };
    if(pendentes.length) return { resultado:'incompleto', motivos: [], pendentes };
    const faltas = ENTRADA.filter(q => q.tipo === 'informacao' && resp[q.id] === 'nao');
    if(faltas.length) return { resultado:'falta_info', motivos: faltas.map(q => q.seNao), pendentes };
    return { resultado:'entra', motivos: [], pendentes };
  }
  const RESULTADO_ENTRADA = {
    entra:      { nome:'Entra no portfólio', tom:'ok',   etapa:'aprovado' },
    falta_info: { nome:'Falta informação',   tom:'warn', etapa:'triagem' },
    nao_entra:  { nome:'Não entra',          tom:'bad',  etapa:'nao_entra' },
    incompleto: { nome:'Aguardando respostas', tom:'neutral', etapa:null },
  };

  /* ------------------------------------------------- critérios de priorização */
  /** Escala 0-3 com âncoras. Eixo "valor" ordena o ranking; eixo "esforco" posiciona na matriz e desempata. Pesos em % sob curadoria da FEG e sujeitos à deliberação da instância de governança. */
  const CRITERIOS_PADRAO = [
    { id:'V1', eixo:'valor', peso:25, nome:'Obrigação regulatória ou legal', pergunta:'Existe exigência regulatória ou legal que depende deste projeto?',
      niveis:['Nenhuma', 'Recomendação ou boa prática', 'Exigência futura (mais de 12 meses)', 'Exigência vigente ou com prazo próximo'] },
    { id:'V2', eixo:'valor', peso:20, nome:'Alinhamento estratégico', pergunta:'Quanto o projeto contribui para os objetivos estratégicos da FE/ONS?',
      niveis:['Sem relação', 'Contribuição indireta', 'Apoia um objetivo estratégico', 'Essencial para um objetivo estratégico'] },
    { id:'V3', eixo:'valor', peso:20, nome:'Risco à operação se não fizer', pergunta:'Se o projeto não for feito, qual o risco para a operação e os estudos?',
      niveis:['Nenhum', 'Baixo', 'Moderado: afeta prazo ou qualidade dos estudos', 'Alto: pode afetar processos críticos da operação'] },
    { id:'V4', eixo:'valor', peso:15, nome:'Ganho de eficiência', pergunta:'Quanto o projeto reduz tempo, retrabalho ou trabalho manual?',
      niveis:['Nenhum', 'Pequeno', 'Relevante e visível', 'Grande: elimina trabalho manual ou reduz muito o tempo'] },
    { id:'V5', eixo:'valor', peso:10, nome:'Abrangência', pergunta:'Quantas pessoas ou áreas se beneficiam?',
      niveis:['Uma pessoa', 'Uma equipe', 'Várias equipes ou áreas', 'Todo o ONS ou agentes externos'] },
    { id:'V6', eixo:'valor', peso:10, nome:'Redução de dependência tecnológica', pergunta:'O projeto reduz dependência de fornecedor ou de tecnologia ultrapassada?',
      niveis:['Nenhuma', 'Pequena', 'Média', 'Elimina uma dependência crítica'] },
    { id:'C1', eixo:'esforco', peso:40, nome:'Esforço da equipe', pergunta:'Quanto trabalho o projeto exige da equipe?',
      niveis:['Até 1 pessoa-mês', 'Até 6 pessoas-mês', 'Até 18 pessoas-mês', 'Mais de 18 pessoas-mês'] },
    { id:'C2', eixo:'esforco', peso:35, nome:'Complexidade e incerteza', pergunta:'Quão conhecida é a solução?',
      niveis:['Solução conhecida', 'Pouca incerteza', 'Alguma incerteza técnica', 'Tecnologia nova ou alta incerteza'] },
    { id:'C3', eixo:'esforco', peso:25, nome:'Dependências', pergunta:'Depende de outras áreas, sistemas ou fornecedores?',
      niveis:['Nenhuma', 'Uma dependência simples', 'Algumas dependências', 'Muitas ou críticas'] },
  ];
  const EIXOS = { valor:'Valor (por que fazer?)', esforco:'Esforço (quanto custa fazer?)' };
  const CORTE = { valor:50, esforco:50, classeA:70, classeB:40 };
  const QUADRANTES = {
    rapido:     { nome:'Ganho rápido', desc:'Alto valor e baixo esforço: fazer primeiro.', cor:'#3E6801' },
    estrategico:{ nome:'Estratégico', desc:'Alto valor e alto esforço: planejar e fatiar.', cor:'#2F6FA3' },
    complementar:{ nome:'Complementar', desc:'Baixo valor e baixo esforço: encaixar se sobrar capacidade.', cor:'#B7791F' },
    repensar:   { nome:'Repensar', desc:'Baixo valor e alto esforço: questionar antes de fazer.', cor:'#B9381F' },
  };
  const criterios = () => (GP.state() && GP.state().criterios) || CRITERIOS_PADRAO;
  /** Sugestões de resposta a partir do cadastro (o usuário confirma). */
  function sugestao(p, id){
    if(id === 'V1') return p.obrigatorio ? 3 : null;
    if(id === 'C1'){ if(p.esforcoFte == null || p.duracaoMeses == null) return null; const pm = p.esforcoFte * p.duracaoMeses; return pm <= 1 ? 0 : pm <= 6 ? 1 : pm <= 18 ? 2 : 3; }
    return null;
  }
  /** Nota de um eixo (0-100) = Σ (resposta/3 × peso) / Σ pesos × 100. null se faltar resposta. */
  function notaEixo(resp, eixo, crit = criterios()){
    const cs = crit.filter(c => c.eixo === eixo && c.peso > 0); const tot = cs.reduce((a, c) => a + c.peso, 0);
    if(!cs.length || !tot) return null;
    if(cs.some(c => resp[c.id] == null)) return null;
    return cs.reduce((a, c) => a + (resp[c.id] / 3) * c.peso, 0) / tot * 100;
  }
  /** Resultado da priorização de um projeto. */
  function pontuar(p, crit = criterios()){
    const resp = (p.avaliacao && p.avaliacao.respostas) || {};
    const valor = notaEixo(resp, 'valor', crit), esforco = notaEixo(resp, 'esforco', crit);
    const faltam = crit.filter(c => c.peso > 0 && resp[c.id] == null).length;
    const quadrante = valor == null || esforco == null ? null : valor >= CORTE.valor ? (esforco < CORTE.esforco ? 'rapido' : 'estrategico') : (esforco < CORTE.esforco ? 'complementar' : 'repensar');
    const classe = valor == null ? null : valor >= CORTE.classeA ? 'A' : valor >= CORTE.classeB ? 'B' : 'C';
    return { valor, esforco, faltam, completo: valor != null && esforco != null, quadrante, classe };
  }
  /** Ranking: avaliados por valor desc; obrigatórios primeiro (opcional); desempate por menor esforço e código. */
  function ranking(lista, { obrigatoriosNoTopo = true } = {}, crit = criterios()){
    return lista.map(p => ({ p, s: pontuar(p, crit) })).filter(x => x.s.completo)
      .sort((a, b) => (obrigatoriosNoTopo ? (b.p.obrigatorio ? 1 : 0) - (a.p.obrigatorio ? 1 : 0) : 0) || b.s.valor - a.s.valor || a.s.esforco - b.s.esforco || a.p.codigo.localeCompare(b.p.codigo))
      .map((x, i) => Object.assign(x, { pos: i + 1 }));
  }
  /** Etapas em que faz sentido priorizar */
  const ETAPAS_PRIORIZAVEIS = ['aprovado', 'execucao', 'espera', 'triagem'];

  /* --------------------------------------------- capacidade e carteira (nível 3) */
  const CAPACIDADE_PADRAO = { periodo:'2027', fte:10, reservaPct:15, orcamento:4000000, descontarExecucao:true };
  /**
   * Monta a carteira que cabe: percorre o ranking dos aprovados e inclui enquanto houver pessoas (FTE) e orçamento.
   * forcar: {id:'in'|'out'} - decisão manual do comitê (fixar ou excluir).
   */
  function montarCarteira(lista, cap = CAPACIDADE_PADRAO, forcar = {}, crit){
    const efetiva = +cap.fte * (1 - (+cap.reservaPct || 0) / 100);
    const execucao = lista.filter(p => p.etapa === 'execucao');
    const comprometido = cap.descontarExecucao ? execucao.reduce((a, p) => a + (p.esforcoFte || 0), 0) : 0;
    const excesso = Math.max(0, comprometido - efetiva), livre = Math.max(0, efetiva - comprometido), orc = +cap.orcamento || 0;
    const rk = ranking(lista.filter(p => p.etapa === 'aprovado'), {}, crit);
    // fixados entram primeiro, na ordem do ranking
    const ordem = [...rk.filter(x => forcar[x.p.id] === 'in'), ...rk.filter(x => forcar[x.p.id] !== 'in')];
    let fte = 0, custo = 0;
    const itens = ordem.map(x => {
      const f = x.p.esforcoFte, c = x.p.custo || 0; let status, falta = null;
      if(forcar[x.p.id] === 'out') status = 'excluido';
      else if(f == null) status = 'sem_estimativa';
      else if(forcar[x.p.id] === 'in'){ status = (fte + f > livre + 1e-9 || (orc && custo + c > orc + 1e-9)) ? 'fixado_estoura' : 'fixado'; fte += f; custo += c; }
      else if(fte + f <= livre + 1e-9 && (!orc || custo + c <= orc + 1e-9)){ status = 'cabe'; fte += f; custo += c; }
      else { status = 'nao_cabe'; falta = fte + f > livre + 1e-9 ? { tipo:'FTE', valor: fte + f - livre } : { tipo:'R$', valor: custo + c - orc }; }
      return Object.assign({}, x, { status, falta, acumFte: fte, acumCusto: custo });
    });
    const dentro = itens.filter(i => ['cabe', 'fixado', 'fixado_estoura'].includes(i.status));
    return { efetiva, comprometido, excesso, livre, orcamento: orc, usadoFte: fte, usadoCusto: custo, sobraFte: livre - fte, sobraOrc: orc - custo,
      itens, dentro, cabem: dentro.length, candidatos: rk.length, semNota: lista.filter(p => p.etapa === 'aprovado' && !pontuar(p, crit).completo) };
  }
  const STATUS_CARTEIRA = {
    cabe:{ nome:'Cabe', tom:'ok' }, fixado:{ nome:'Fixado pelo comitê', tom:'ok' }, fixado_estoura:{ nome:'Fixado, mas estoura', tom:'bad' },
    nao_cabe:{ nome:'Não cabe agora', tom:'warn' }, excluido:{ nome:'Excluído pelo comitê', tom:'neutral' }, sem_estimativa:{ nome:'Sem estimativa de FTE', tom:'warn' },
  };
  /** Pessoas (FTE) alocadas por mês, considerando projetos com início e fim previstos. */
  function demandaMensal(lista, de, ate){
    const meses = []; let [y, m] = de.split('-').map(Number); const [y2, m2] = ate.split('-').map(Number);
    while(y < y2 || (y === y2 && m <= m2)){ meses.push(`${y}-${String(m).padStart(2, '0')}`); m++; if(m > 12){ m = 1; y++; } if(meses.length > 60) break; }
    return meses.map(mes => ({ mes, fte: lista.filter(p => p.inicioPrevisto && p.fimPrevisto && p.inicioPrevisto.slice(0, 7) <= mes && p.fimPrevisto.slice(0, 7) >= mes).reduce((a, p) => a + (p.esforcoFte || 0), 0) }));
  }

  /* --------------------------------------------------------------- estado */
  function estadoInicial(){
    return { v: VERSAO, projetos: [], seq: 0, criterios: JSON.parse(JSON.stringify(CRITERIOS_PADRAO)), capacidade: Object.assign({}, CAPACIDADE_PADRAO), forcar: {}, ui: { nivel: 1, menuMini: false } };
  }
  /* Higienização: tudo o que vem do armazenamento ou de um backup passa por aqui (tipos, ids seguros, catálogos). */
  const idSeguro = v => String(v ?? '').replace(/[^\w-]/g, '').slice(0, 60);
  const txt = (v, max = 2000) => typeof v === 'string' ? v.slice(0, max) : v == null ? '' : String(v).slice(0, max);
  const numOuNull = v => v === '' || v == null || isNaN(v) ? null : Math.max(0, +v);
  const dataOuVazio = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
  function limparProjeto(p){
    if(!p || typeof p !== 'object' || !p.id || typeof p.titulo !== 'string') return null;
    const o = {};
    ['titulo', 'descricao', 'beneficio', 'area', 'ferramenta', 'demandante', 'patrocinador', 'responsavel', 'link', 'observacoes', 'codigo', 'tipo', 'origem'].forEach(k => o[k] = txt(p[k], k === 'titulo' ? 140 : 2000));
    o.id = idSeguro(p.id); o.codigo = idSeguro(p.codigo) || o.id;
    o.gerencia = CAT.gerencias.some(g => g.id === p.gerencia) ? p.gerencia : '';
    o.etapa = ETAPAS.some(e => e.id === p.etapa) ? p.etapa : 'entrada';
    o.obrigatorio = !!p.obrigatorio; o.exemplo = !!p.exemplo;
    o.natureza = p.natureza === 'demanda' ? 'demanda' : 'projeto';
    o.progresso = p.progresso === '' || p.progresso == null || !Number.isFinite(+p.progresso) ? null : Math.max(0,Math.min(100,+p.progresso));
    ['esforcoFte', 'duracaoMeses', 'custo'].forEach(k => o[k] = numOuNull(p[k]));
    ['inicioPrevisto', 'fimPrevisto', 'dataEntrada'].forEach(k => o[k] = dataOuVazio(p[k]));
    if(o.link && !/^https?:\/\//i.test(o.link)) o.link = '';
    ['criadoEm', 'atualizadoEm'].forEach(k => { if(p[k]) o[k] = txt(p[k], 40); });
    o.historico = Array.isArray(p.historico) ? p.historico.filter(h => h && typeof h === 'object').map(h => ({ data: txt(h.data, 40), acao: txt(h.acao, 60), detalhe: txt(h.detalhe, 1000) })) : [];
    if(p.entrada && typeof p.entrada === 'object' && RESULTADO_ENTRADA[p.entrada.resultado]){
      const r = {}; Object.entries(p.entrada.respostas || {}).forEach(([k, v]) => { if(ENTRADA.some(q => q.id === k) && (v === 'sim' || v === 'nao')) r[k] = v; });
      o.entrada = { respostas: r, resultado: p.entrada.resultado, motivos: Array.isArray(p.entrada.motivos) ? p.entrada.motivos.map(m => txt(m, 300)) : [], obs: txt(p.entrada.obs, 300), data: txt(p.entrada.data, 40) };
    }
    if(p.avaliacao && typeof p.avaliacao === 'object'){
      const r = {}; Object.entries(p.avaliacao.respostas || {}).forEach(([k, v]) => { if(/^[\w-]{1,20}$/.test(k) && v !== '' && v != null && !isNaN(v)) r[k] = Math.max(0, Math.min(3, Math.round(+v))); });
      o.avaliacao = { respostas: r, obs: txt(p.avaliacao.obs, 300), data: txt(p.avaliacao.data, 40) };
    }
    return o;
  }
  function limparCriterios(cs){
    if(!Array.isArray(cs) || !cs.length) return JSON.parse(JSON.stringify(CRITERIOS_PADRAO));
    const ok = cs.filter(c => c && typeof c === 'object' && /^[\w-]{1,20}$/.test(c.id) && (c.eixo === 'valor' || c.eixo === 'esforco') && Array.isArray(c.niveis) && c.niveis.length === 4)
      .map(c => ({ id: c.id, eixo: c.eixo, peso: Math.max(0, Math.min(100, Math.round(+c.peso || 0))), nome: txt(c.nome, 80), pergunta: txt(c.pergunta, 200), niveis: c.niveis.map(n => txt(n, 120)) }));
    return ok.some(c => c.eixo === 'valor') && ok.some(c => c.eixo === 'esforco') ? ok : JSON.parse(JSON.stringify(CRITERIOS_PADRAO));
  }
  function migrar(S){
    S = S && typeof S === 'object' ? S : estadoInicial();
    const ui = S.ui && typeof S.ui === 'object' ? S.ui : {};
    S.ui = Object.assign({}, ui, { nivel: Math.max(1, Math.min(3, Math.round(+ui.nivel) || 1)), menuMini: !!ui.menuMini });
    S.criterios = limparCriterios(S.criterios);
    const c = S.capacidade && typeof S.capacidade === 'object' ? S.capacidade : {};
    S.capacidade = { periodo: txt(c.periodo ?? CAPACIDADE_PADRAO.periodo, 20), fte: numOuNull(c.fte) ?? CAPACIDADE_PADRAO.fte, reservaPct: Math.min(60, numOuNull(c.reservaPct) ?? CAPACIDADE_PADRAO.reservaPct),
      orcamento: numOuNull(c.orcamento) ?? CAPACIDADE_PADRAO.orcamento, descontarExecucao: c.descontarExecucao === undefined ? CAPACIDADE_PADRAO.descontarExecucao : !!c.descontarExecucao };
    const vistos = new Set();
    S.projetos = (Array.isArray(S.projetos) ? S.projetos : []).map(limparProjeto).filter(p => p && !vistos.has(p.id) && vistos.add(p.id));
    const f = {}; Object.entries(S.forcar && typeof S.forcar === 'object' ? S.forcar : {}).forEach(([k, v]) => { if(vistos.has(k) && (v === 'in' || v === 'out')) f[k] = v; }); S.forcar = f;
    S.seq = Math.max(Math.round(+S.seq) || 0, ...S.projetos.map(p => +(String(p.codigo).match(/(\d+)$/) || [0, 0])[1] || 0));
    S.meta = Object.assign({}, S.meta && typeof S.meta === 'object' ? S.meta : {}, {datasetId: idSeguro(S.meta?.datasetId) || uid('carteira'), revisao: Math.max(0,Math.floor(+S.meta?.revisao || 0)), salvoEm:txt(S.meta?.salvoEm,40)});
    S.v = VERSAO;
    return S;
  }

  /* ------------------------------------------------------------- projetos */
  const S = () => GP.state();
  const CAMPOS = {
    natureza:'Natureza do registro', progresso:'Avanço físico (%)', dataEntrada:'Data de entrada', titulo:'Título', descricao:'Descrição / problema', beneficio:'Benefício esperado', gerencia:'Gerência', area:'Área ou comunidade',
    ferramenta:'Sistema, modelo ou ferramenta relacionada', demandante:'Demandante', patrocinador:'Patrocinador', responsavel:'Responsável', tipo:'Tipo', origem:'Origem',
    obrigatorio:'Obrigatório (lei/regulação)', esforcoFte:'Esforço (pessoas/FTE)', duracaoMeses:'Duração (meses)', custo:'Custo estimado (R$)',
    inicioPrevisto:'Início previsto', fimPrevisto:'Fim previsto', link:'Link (ADO/Jira)', observacoes:'Observações', etapa:'Etapa',
  };
  const OBRIGATORIOS = ['titulo', 'descricao', 'gerencia', 'demandante', 'tipo'];
  /** Valida um projeto. Retorna {campo: mensagem} (vazio = ok). */
  function validar(p){
    const e = {};
    if(p.progresso !== '' && p.progresso != null && (!Number.isFinite(+p.progresso) || +p.progresso < 0 || +p.progresso > 100)) e.progresso = 'Informe um percentual entre 0 e 100.';
    if(p.natureza && !['projeto','demanda'].includes(p.natureza)) e.natureza = 'Selecione Projeto ou Demanda.';
    if(p.dataEntrada && (!/^\d{4}-\d{2}-\d{2}$/.test(p.dataEntrada) || p.dataEntrada < '2000-01-01' || p.dataEntrada > '2100-12-31')) e.dataEntrada = 'Informe uma data entre 2000 e 2100.';
    OBRIGATORIOS.forEach(k => { if(!String(p[k] ?? '').trim()) e[k] = 'Campo obrigatório.'; });
    if(p.titulo && p.titulo.trim().length < 5) e.titulo = 'Use pelo menos 5 caracteres.';
    if(p.titulo && p.titulo.trim().length > 140) e.titulo = 'Use no máximo 140 caracteres.';
    if(p.link){ let ok = false; try { ok = /^https?:$/.test(new URL(p.link).protocol); } catch(x) {} if(!ok) e.link = 'Informe um endereço completo começando com https:// (ou http://).'; }
    ['inicioPrevisto', 'fimPrevisto'].forEach(k => { if(p[k] && (!/^\d{4}-\d{2}-\d{2}$/.test(p[k]) || p[k] < '2000-01-01' || p[k] > '2100-12-31')) e[k] = 'Informe uma data entre 2000 e 2100.'; });
    ['esforcoFte', 'duracaoMeses', 'custo'].forEach(k => { if(p[k] !== '' && p[k] != null && (isNaN(p[k]) || +p[k] < 0)) e[k] = 'Informe um número maior ou igual a zero.'; });
    if(p.inicioPrevisto && p.fimPrevisto && p.fimPrevisto < p.inicioPrevisto) e.fimPrevisto = 'O fim não pode ser antes do início.';
    const dup = S().projetos.find(x => x.id !== p.id && x.titulo && p.titulo && x.titulo.trim().toLowerCase() === p.titulo.trim().toLowerCase());
    if(dup) e.titulo = `Já existe um projeto com este título (${dup.codigo}).`;
    return e;
  }
  const num = v => v === '' || v == null ? null : +v;
  function normalizar(p){
    const o = Object.assign({}, p);
    ['esforcoFte', 'duracaoMeses', 'custo'].forEach(k => o[k] = num(o[k]));
    ['titulo', 'descricao', 'beneficio', 'area', 'ferramenta', 'demandante', 'patrocinador', 'responsavel', 'link', 'observacoes'].forEach(k => o[k] = (o[k] ?? '').toString().trim());
    o.natureza = o.natureza === 'demanda' ? 'demanda' : 'projeto';
    o.progresso = num(o.progresso);
    o.obrigatorio = !!o.obrigatorio;
    return o;
  }
  const registrar = (p, acao, detalhe = '') => { (p.historico ||= []).push({ data: new Date().toISOString(), acao, detalhe }); };
  const proximoCodigo = () => { S().seq = (S().seq || 0) + 1; return 'PRJ-' + String(S().seq).padStart(3, '0'); };

  const projetos = {
    todos: () => S().projetos,
    get: id => S().projetos.find(p => p.id === id),
    /** Cria um projeto (etapa "Nova demanda"). Retorna {ok, projeto | erros}. */
    criar(dados){
      const p = normalizar(Object.assign({ etapa:'entrada', dataEntrada: hoje() }, dados));
      const erros = validar(p); if(Object.keys(erros).length) return { ok:false, erros };
      p.id = uid('p'); p.codigo = proximoCodigo(); p.criadoEm = new Date().toISOString(); p.historico = [];
      registrar(p, 'Cadastro', (p.natureza === 'demanda' ? 'Demanda' : 'Projeto') + ' cadastrado na fila de entrada.');
      S().projetos.push(p); GP.save(); return { ok:true, projeto:p };
    },
    /** Atualiza campos, registrando no histórico o que mudou. */
    atualizar(id, dados){
      const p = projetos.get(id); if(!p) return { ok:false, erros:{ geral:'Projeto não encontrado.' } };
      const novo = normalizar(Object.assign({}, p, dados)); const erros = validar(novo); if(Object.keys(erros).length) return { ok:false, erros };
      const mudou = Object.keys(CAMPOS).filter(k => k !== 'etapa' && JSON.stringify(p[k] ?? null) !== JSON.stringify(novo[k] ?? null));
      Object.assign(p, novo, { atualizadoEm: new Date().toISOString() });
      if(mudou.length) registrar(p, 'Edição', 'Alterado: ' + mudou.map(k => CAMPOS[k]).join(', ') + '.');
      GP.save(); return { ok:true, projeto:p, mudou };
    },
    mudarEtapa(id, nova, motivo = ''){
      const p = projetos.get(id); if(!p || p.etapa === nova) return false;
      const de = etapa(p.etapa).nome; p.etapa = nova; p.atualizadoEm = new Date().toISOString();
      registrar(p, 'Etapa', `${de} → ${etapa(nova).nome}${motivo ? '. Motivo: ' + motivo : ''}`); GP.save(); return true;
    },
    /** Registra o checklist de entrada e move a etapa conforme o resultado. */
    registrarEntrada(id, respostas, obs = ''){
      const p = projetos.get(id); if(!p) return { ok:false };
      const r = avaliarEntrada(respostas); if(r.resultado === 'incompleto') return { ok:false, r };
      p.entrada = { respostas: Object.assign({}, respostas), resultado: r.resultado, motivos: r.motivos, obs: (obs || '').trim(), data: new Date().toISOString() };
      registrar(p, 'Entrada', `${RESULTADO_ENTRADA[r.resultado].nome}${r.motivos.length ? ': ' + r.motivos.join(' ') : ''}${p.entrada.obs ? ' Obs.: ' + p.entrada.obs : ''}`);
      const alvo = RESULTADO_ENTRADA[r.resultado].etapa;
      if(alvo && p.etapa !== alvo && ['entrada', 'triagem', 'aprovado', 'nao_entra'].includes(p.etapa)) projetos.mudarEtapa(id, alvo, r.motivos.join(' '));
      GP.save(); return { ok:true, r };
    },
    /** Salva as respostas da priorização (0-3 por critério). */
    avaliar(id, respostas, obs = ''){
      const p = projetos.get(id); if(!p) return { ok:false };
      const r = {}; Object.entries(respostas || {}).forEach(([k, v]) => { if(v !== '' && v != null && !isNaN(v)) r[k] = Math.max(0, Math.min(3, +v)); });
      p.avaliacao = { respostas: r, obs: (obs || '').trim(), data: new Date().toISOString() };
      const s = pontuar(p);
      registrar(p, 'Priorização', s.completo ? `Valor ${s.valor.toFixed(1)} · esforço ${s.esforco.toFixed(1)} · ${QUADRANTES[s.quadrante].nome}` : `Avaliação parcial (faltam ${s.faltam} resposta(s)).`);
      GP.save(); return { ok:true, s };
    },
    excluir(id){ const i = S().projetos.findIndex(p => p.id === id); if(i < 0) return false; S().projetos.splice(i, 1); GP.save(); return true; },
    registrar,
  };

  /* ---------------------------------------------- projetos de exemplo (fictícios) */
  const EXEMPLOS = [
    ['Migração do ambiente de execução dos modelos energéticos para nuvem', 'FEN', 'Planejamento e Programação Energética', 'NEWAVE', 'Projeto', 'Estratégica', false, 'execucao', 3, 10, 1800000, '2026-03-01', '2026-12-31', 'Reduzir o tempo das rodadas mensais e a dependência de servidores locais.'],
    ['Adequação do modelo de programação diária a novo requisito regulatório', 'FEN', 'Planejamento e Programação Energética', 'DESSEM', 'Adequação regulatória', 'Regulatória', true, 'aprovado', 2, 6, 650000, '2027-01-04', '2027-06-30', 'Atender à exigência regulatória dentro do prazo.'],
    ['Painel de qualidade dos dados de entrada dos modelos de médio e curto prazo', 'FEN', 'Planejamento e Programação Energética', 'DECOMP', 'Evolução de ferramenta', 'Operacional', false, 'aprovado', 1.5, 5, 400000, '2027-02-01', '2027-06-30', 'Detectar inconsistências antes das rodadas oficiais.'],
    ['Automação de testes de regressão dos modelos hidrológicos', 'FER', 'Recursos Hidrológicos', 'SMAP/ONS', 'Sustentação / melhoria', 'Melhoria contínua', false, 'aprovado', 1, 4, 250000, '2027-03-01', '2027-06-30', 'Reduzir retrabalho e erros em novas versões.'],
    ['Prova de conceito de aprendizado de máquina para previsão de carga', 'FER', 'Carga e Recursos Distribuídos', 'PREV CARGA', 'Inovação / prova de conceito', 'Estratégica', false, 'triagem', 1, 4, 300000, '', '', 'Avaliar ganho de precisão na previsão de carga.'],
    ['Ajuste de desempenho do fluxo de potência em casos de grande porte', 'FEL', 'Regime Permanente e Transitórios Eletromecânicos', 'ANAREDE', 'Evolução de ferramenta', 'Operacional', false, 'execucao', 2, 8, 800000, '2026-02-10', '2026-12-18', 'Diminuir o tempo de simulação dos estudos elétricos.'],
    ['Gestão documental de versões e manuais das ferramentas', 'FEG', 'Governança de ferramentas', '', 'Sustentação / melhoria', 'Melhoria contínua', false, 'entrada', 0.5, 3, 120000, '', '', 'Ter uma fonte única e versionada da documentação.'],
    ['Integração da previsão de carga de curtíssimo prazo à base corporativa', 'FER', 'Carga e Recursos Distribuídos', 'PREV CARGA DESSEM', 'Evolução de ferramenta', 'Operacional', false, 'execucao', 1.5, 7, 550000, '2026-04-06', '2027-04-30', 'Eliminar carga manual de dados.'],
    ['Relatórios gerenciais das saídas do simulador de despacho', 'FEN', 'Planejamento e Programação Energética', 'BALPONTA', 'Evolução de ferramenta', 'Estratégica', false, 'concluido', 1, 6, 350000, '2025-10-01', '2026-03-31', 'Dar visibilidade gerencial aos resultados.'],
    ['Nova saída de análise de sensibilidade no modelo de programação diária', 'FEN', 'Planejamento e Programação Energética', 'DESSEM', 'Evolução de ferramenta', 'Operacional', false, 'entrada', 1, 3, 200000, '', '', 'Atender a pedido recorrente das áreas usuárias.'],
    ['Customização visual das telas do programa de análise harmônica', 'FEL', 'Regime Permanente e Transitórios Eletromecânicos', 'HARMZS', 'Sustentação / melhoria', 'Melhoria contínua', false, 'nao_entra', 0.5, 2, 90000, '', '', 'Melhorar a aparência das telas.'],
    ['Estudo de co-simulação entre transitórios eletromagnéticos e eletromecânicos', 'FEG', 'Prospecção de Ferramentas Elétricas', '', 'Inovação / prova de conceito', 'Estratégica', false, 'espera', 1, 6, 400000, '', '', 'Avaliar viabilidade técnica da integração.'],
    ['Base única de cadastro de usinas para todos os modelos', 'FEG', 'Plataformização', '', 'Projeto', 'Estratégica', false, 'aprovado', 2.5, 9, 1200000, '2027-01-04', '2027-09-30', 'Evitar divergência de cadastro entre modelos.'],
    ['Refatoração do código legado do modelo chuva-vazão', 'FER', 'Recursos Hidrológicos', 'SMAP/ONS', 'Sustentação / melhoria', 'Operacional', false, 'aprovado', 2, 8, 700000, '2027-04-01', '2027-11-30', 'Reduzir risco de falha e facilitar manutenção.'],
  ];
  /** Respostas de exemplo [V1..V6, C1..C3] por índice de EXEMPLOS (null = não avaliado) */
  const AVAL_EX = [[0,3,2,3,2,3,3,2,2],[3,2,3,1,3,0,2,1,1],[0,2,2,2,2,1,1,1,1],[0,1,2,3,1,1,1,0,0],null,[0,2,2,3,2,1,2,2,0],null,[0,2,1,3,2,0,2,1,2],[0,1,1,2,2,0,1,1,0],null,null,[0,2,1,1,1,2,2,3,1],[0,3,2,2,3,2,3,2,2],[0,1,3,1,1,2,2,2,0]];
  const PESSOAS = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Rocha', 'Elisa Prado', 'Fábio Nunes'];
  function carregarExemplos(){
    let n = 0;
    EXEMPLOS.forEach((x, i) => {
      if(S().projetos.some(p => p.titulo === x[0] + ' (exemplo)')) return;
      const [titulo, gerencia, area, ferramenta, tipo, origem, obrigatorio, et, esforcoFte, duracaoMeses, custo, inicioPrevisto, fimPrevisto, beneficio] = x;
      const r = projetos.criar({ titulo: titulo + ' (exemplo)', descricao: 'Projeto fictício para demonstrar o sistema. ' + beneficio, beneficio, gerencia, area, ferramenta, tipo, origem, obrigatorio,
        demandante: 'Área usuária de ' + area, patrocinador: i === 4 ? '' : 'Gerente ' + gerencia, responsavel: PESSOAS[i % PESSOAS.length], esforcoFte, duracaoMeses, custo, inicioPrevisto, fimPrevisto,
        dataEntrada: `2026-0${1 + (i % 9)}-1${i % 9}`, natureza:['entrada','triagem','nao_entra'].includes(et) ? 'demanda' : 'projeto', progresso:et === 'execucao' ? [65,40,80][i % 3] : et === 'concluido' ? 100 : null, exemplo: true });
      if(!r.ok) return; n++;
      const id = r.projeto.id, sim = Object.fromEntries(ENTRADA.map(q => [q.id, 'sim']));
      if(et === 'nao_entra') projetos.registrarEntrada(id, Object.assign({}, sim, { E1:'nao' }), 'Ajuste cosmético, sem entrega de projeto.');
      else if(et === 'triagem') projetos.registrarEntrada(id, Object.assign({}, sim, { E5:'nao' }));
      else if(et !== 'entrada'){ projetos.registrarEntrada(id, sim); if(et !== 'aprovado') projetos.mudarEtapa(id, et); }
      const av = AVAL_EX[i]; if(av) projetos.avaliar(id, Object.fromEntries(['V1','V2','V3','V4','V5','V6','C1','C2','C3'].map((k, j) => [k, av[j]])));
    });
    GP.save(); return n;
  }

  GP.modelo = { VERSAO, CAT, ETAPAS, etapa, CAMPOS, OBRIGATORIOS, ENTRADA, RESULTADO_ENTRADA, avaliarEntrada, CRITERIOS_PADRAO, EIXOS, CORTE, QUADRANTES, ETAPAS_PRIORIZAVEIS, criterios, sugestao, notaEixo, pontuar, ranking, CAPACIDADE_PADRAO, STATUS_CARTEIRA, montarCarteira, demandaMensal, estadoInicial, migrar, validar, carregarExemplos };
  GP.projetos = projetos;
})();

