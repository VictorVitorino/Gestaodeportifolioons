/* =========================================================================
   Gestão de Portfólio FEG — modelo de dados
   Catálogos, estado inicial, migração, operações sobre projetos e exemplos.
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, { hoje, uid } = GP.util;
  const VERSAO = 1;

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
    { id:'aprovado', nome:'Aprovado · aguardando', tom:'ok',      grupo:'andamento', ordem:3, desc:'Entrou no portfólio e aguarda priorização/início.' },
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
    { id:'E2', tipo:'barreira', pergunta:'Está no escopo da FE (ferramentas eletroenergéticas e sua governança)?',
      seNao:'Fora do escopo da FE: encaminhar à área responsável.' },
    { id:'E3', tipo:'barreira', pergunta:'Não repete um projeto que já está no acervo?',
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

  /* --------------------------------------------------------------- estado */
  function estadoInicial(){
    return { v: VERSAO, projetos: [], seq: 0, ui: { nivel: 1, menuMini: false } };
  }
  function migrar(S){
    S.ui = Object.assign({ nivel: 1, menuMini: false }, S.ui || {});
    S.projetos = S.projetos || [];
    S.seq = S.seq || 0;
    S.v = VERSAO;
    return S;
  }

  /* ------------------------------------------------------------- projetos */
  const S = () => GP.state();
  const CAMPOS = {
    titulo:'Título', descricao:'Descrição / problema', beneficio:'Benefício esperado', gerencia:'Gerência', area:'Área ou comunidade',
    ferramenta:'Ferramenta', demandante:'Demandante', patrocinador:'Patrocinador', responsavel:'Responsável', tipo:'Tipo', origem:'Origem',
    obrigatorio:'Obrigatório (lei/regulação)', esforcoFte:'Esforço (pessoas/FTE)', duracaoMeses:'Duração (meses)', custo:'Custo estimado (R$)',
    inicioPrevisto:'Início previsto', fimPrevisto:'Fim previsto', link:'Link (ADO/Jira)', observacoes:'Observações', etapa:'Etapa',
  };
  const OBRIGATORIOS = ['titulo', 'descricao', 'gerencia', 'demandante', 'tipo'];
  /** Valida um projeto. Retorna {campo: mensagem} (vazio = ok). */
  function validar(p){
    const e = {};
    OBRIGATORIOS.forEach(k => { if(!String(p[k] ?? '').trim()) e[k] = 'Campo obrigatório.'; });
    if(p.titulo && p.titulo.trim().length < 5) e.titulo = 'Use pelo menos 5 caracteres.';
    if(p.link){ try { new URL(p.link); } catch(x) { e.link = 'Informe um endereço completo (https://…).'; } }
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
      registrar(p, 'Cadastro', 'Projeto cadastrado como nova demanda.');
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
  const PESSOAS = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Rocha', 'Elisa Prado', 'Fábio Nunes'];
  function carregarExemplos(){
    let n = 0;
    EXEMPLOS.forEach((x, i) => {
      if(S().projetos.some(p => p.titulo === x[0] + ' (exemplo)')) return;
      const [titulo, gerencia, area, ferramenta, tipo, origem, obrigatorio, et, esforcoFte, duracaoMeses, custo, inicioPrevisto, fimPrevisto, beneficio] = x;
      const r = projetos.criar({ titulo: titulo + ' (exemplo)', descricao: 'Projeto fictício para demonstrar o sistema. ' + beneficio, beneficio, gerencia, area, ferramenta, tipo, origem, obrigatorio,
        demandante: 'Área usuária de ' + area, patrocinador: i === 4 ? '' : 'Gerente ' + gerencia, responsavel: PESSOAS[i % PESSOAS.length], esforcoFte, duracaoMeses, custo, inicioPrevisto, fimPrevisto,
        dataEntrada: `2026-0${1 + (i % 9)}-1${i % 9}`, exemplo: true });
      if(!r.ok) return; n++;
      const id = r.projeto.id, sim = Object.fromEntries(ENTRADA.map(q => [q.id, 'sim']));
      if(et === 'nao_entra') projetos.registrarEntrada(id, Object.assign({}, sim, { E1:'nao' }), 'Ajuste cosmético, sem entrega de projeto.');
      else if(et === 'triagem') projetos.registrarEntrada(id, Object.assign({}, sim, { E5:'nao' }));
      else if(et !== 'entrada'){ projetos.registrarEntrada(id, sim); if(et !== 'aprovado') projetos.mudarEtapa(id, et); }
    });
    GP.save(); return n;
  }

  GP.modelo = { VERSAO, CAT, ETAPAS, etapa, CAMPOS, OBRIGATORIOS, ENTRADA, RESULTADO_ENTRADA, avaliarEntrada, estadoInicial, migrar, validar, carregarExemplos };
  GP.projetos = projetos;
})();
