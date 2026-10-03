/* =========================================================================
   Portfólio FEG — CONJUNTO DE EXEMPLO (data.js) · PF.base · versão 1
   Fonte: docs/portfolio-feg-niveis.md §4 (dados ILUSTRATIVOS; nada aqui é regra ONS).
   Convenções: ids estáveis (E01, FEN, PPE-A); camelCase; datas 'AAAA-MM-DD'; valores em R$ mi;
   percentuais físicos de 0 a 100; frações (0,15) em parâmetros. Todo registro tem
   ilustrativo:true e origemDado:'TRILHA_FEG_FICTICIO'. Fase da iniciativa = statusId.
   Coleções: regras (R01…R43, lidas por PF.regra) · gerencias · comunidades · squads · ferramentas ·
   statusConfiguracao · categorias · catalogos{origemDemanda, canalEntrada, tiposDecisao, classeRecomendacao,
   tiposForum, statusFechados, papeisRegistrantes, instancias, tiposPendencia, sinais, faixasHorizonte,
   quadrantes, classesSourcing, horizontesInovacao, rubricas, pessoasChave} · ciclos · fornecedores ·
   objetivosEstrategicos · iniciativas (22) · financeiro · capacidades · demandasCapacidade ·
   riscosImpedimentos · dependencias · avaliacoes · evidenciasAvaliacao · foruns · snapshotsForum ·
   decisoes · historico · pendencias · beneficios · medicoesBeneficio · atividadesCronograma ·
   cenarios · raci · armadilhas · ahpExemplos.
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF = window.PF || {};
  const ORIG = 'TRILHA_FEG_FICTICIO';
  const tag = o => Object.assign(o, { ilustrativo:true, origemDado:ORIG });
  const T = arr => arr.map(tag);
  const ADO = c => 'https://ado.exemplo.invalid/' + c, ITSM = c => 'https://itsm.exemplo.invalid/' + c;

  /* Hash idêntico a PF.hash (FNV-1a 32 bits sobre JSON de chaves ordenadas): usado só para a fotografia semente. */
  const stable = v => Array.isArray(v) ? '['+v.map(stable).join(',')+']' : (v && typeof v==='object') ? '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}' : JSON.stringify(v);
  const fnv = obj => { let h = 0x811c9dc5; const s = stable(obj); for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000'+h.toString(16)).slice(-8); };

  /* ------------------------------------------------ registro de regras (§4.3) */
  const DECK = s => `Deck A&M Etapa 3 v25, ${s} (proposta de consultoria, não aprovada)`;
  const R43 = ['R13','R15','R16','R20','R22','R26','R27','R28','R29','R32'];
  const R = (codigo, chave, nome, valor, origemRegra, tipoFonte, referencia, extra={}) => tag(Object.assign({
    id: codigo, codigo, chave, nome, valor,
    tipo: valor === null ? 'nulo' : Array.isArray(valor) ? 'lista' : typeof valor === 'object' ? 'json' : typeof valor === 'number' ? 'numero' : 'texto',
    origemRegra, tipoFonte, referencia, statusValidacao:'A_VALIDAR', versao:1, vigente:true, editavel: R43.includes(codigo),
    atualizadoPor:'Semente da trilha (ilustrativa)', atualizadoEm:'2026-09-01', justificativa:'' }, extra));
  const AV = 'A_VALIDAR_FEG', DFP = 'DECISAO_FUNCIONAL_PRODUTO';
  const PROP = 'PROPOSTA_CONSULTORIA', PREM = 'PREMISSA_ILUSTRATIVA', REPO = 'REPOSITORIO', MERC = 'REF_MERCADO', REV = 'COMENTARIO_REVISAO', INT = 'ARTEFATO_INTERNO';

  const criterios = [
    { id:'C1', nome:'Alinhamento estratégico', relacaoDeck:'"alinhamento à estratégia tecnológica" (s141), "alinhadas ao roadmap" (s168)', campo:'avaliacoes.notasCriterios.C1 (texto em alinhamentoEstrategico)' },
    { id:'C2', nome:'Criticidade sistêmica / impacto na confiabilidade', relacaoDeck:'"criticidade sistêmica" (s138), "impacto sistêmico" (s168)', campo:'avaliacoes.notasCriterios.C2' },
    { id:'C3', nome:'Urgência / janela regulatória e operacional', relacaoDeck:'"janela regulatória e operacional" (s138), "nível de urgência" (s143)', campo:'avaliacoes.notasCriterios.C3' },
    { id:'C4', nome:'Redução de risco (técnico, de dependência, de lock-in)', relacaoDeck:'dívida técnica (s166), dependência de terceiros (s227)', campo:'avaliacoes.notasCriterios.C4 (não usa riscosResumo)' },
    { id:'C5', nome:'Viabilidade / maturidade técnica', relacaoDeck:'"metodologia conhecida e madura", "complexidade" (s143)', campo:'avaliacoes.notasCriterios.C5' },
  ];

  const regras = [
    R('R01','gerencias','Gerências da FE', ['FEG','FEL','FEN','FER'], AV, PROP, DECK('s4/s56') + '; siglas também no seed 001, que não confirma nomes'),
    R('R02','catalogoFE','Catálogo da FE: comunidades, squads e ferramentas', { comunidades:10, squads:13, ferramentas:16 }, AV, PROP, DECK('s22, s30–s42')),
    R('R03','comunidadesTecnicasNaFEG','Comunidades técnicas vinculadas à FEG', { gerenciaId:'FEG', comunidades:['PEL','PEN','ACO','PLA'], nota:'liderança de PLA pela DTA (s118)' }, AV, PREM, 'Inferência do s117; gerencia_id NN no repositório; liderança de PLA pela DTA (s118)'),
    R('R04','objetivosEstrategicos','Objetivos estratégicos (fictícios)', ['OE-1','OE-2','OE-3'], AV, PREM, 'Premissa: os objetivos reais devem vir de documento ONS'),
    R('R05a','forumAcompanhamento','Fórum de Acompanhamento de Portfólio', { tipoForum:'ACOMPANHAMENTO_PORTFOLIO', periodicidade:'mensal', coordenacao:'FEG' }, AV, PROP, DECK('s129')),
    R('R05b','periodicidadesEmConflito','Periodicidades em conflito entre fontes', [
      { forum:'Estratégico', fonteA:'anual (s126)', fonteB:'quadrienal (s205/s208)' },
      { forum:'Planejamento do Portfólio', fonteA:'semestral (s127)', fonteB:'anual (s125/s205/s208)' },
      { forum:'Planejamento e Evolução', fonteA:'trimestral (s128)', fonteB:'semestral (comentário de revisão)' } ], AV, PROP, 'Contradição entre fontes (§2.2, regra 1): ' + DECK('s125–s128, s205, s208') + ' + comentário de revisão; o app mostra as duas fontes sem escolher',
      { contradicao:true, tipoFonteSecundario:REV }),
    R('R06','mecanicasRepositorio','Mecânicas do repositório', ['hierarquia gerência → comunidade → squad','arquivar em vez de apagar','fotografia FECHADA imutável','avaliação append-only','rowVersion'], DFP, REPO, 'migrations 0012–0017'),
    R('R07','dataReferencia','Data de referência do gabarito', '2026-10-03', DFP, PREM, 'Premissa da trilha (data fixa do gabarito)', { marca:'ILUSTRATIVO' }),
    R('R08','faixasHorizonteDias','Faixas 30/60/90 dias', { faixas:[30,60,90], inclusivo:true, semData:'SEM_DATA', anterior:'VENCIDO', acima:'ACIMA_90' }, DFP, REPO, 'RPC get_horizonte_datas'),
    R('R09','statusFechados','Status que fecham riscos e dependências', { riscos:['RESOLVIDO','CONCLUIDO','FECHADO'], dependencias:['RESOLVIDA','CONCLUIDA','FECHADA'], comparacao:'upper()', nuloEhAberto:true }, DFP, REPO, 'migration 0011'),
    R('R10a','camposObrigatoriosRepo','Campos obrigatórios do repositório', ['titulo','descricaoObjetivo','gerenciaId','comunidadeId','responsavel'], DFP, REPO, 'src/rules/initiativeRules.js'),
    R('R10b','camposObrigatoriosTrilha','Campos obrigatórios da trilha', ['categoria','objetivoEstrategicoId','bac','dataPlanejada','dataPrevistaAtual'], AV, PREM, 'Premissa da trilha'),
    R('R11','fases','Catálogo de fases', ['DEMANDA','EM_ANALISE','APROVADA','EM_EXECUCAO','EM_ESPERA','ENCERRADA','CANCELADA'], AV, PREM, 'Premissa: status_configuracao vazio no repositório'),
    R('R12','categorias','Categorias de iniciativa', ['OBRIGATORIA','SUSTENTACAO','EVOLUCAO','INOVACAO'], AV, PREM, 'Premissa inspirada em s127/s166 (taxonomia usada em cálculo)'),
    R('R13','sinalLimiares','Limiares do sinal calculado', { vermelhoDesvioMeses:3, amareloDesvioMeses:1, vermelhoIndiceAbaixoDe:0.85, amareloIndiceAbaixoDe:0.95, agregacao:'PIOR_DIMENSAO' }, AV, PREM, 'Premissa da trilha (regra didática; não usar em reporte)',
      { descricao:'Vermelho: desvio ≥ 3 meses ou índice < 0,85. Amarelo: desvio de 1–2 meses ou índice de 0,85 a < 0,95. Vale a pior dimensão; sem baseline, BAC ou AC = Cinza.' }),
    R('R14','previsaoVencida','Previsão vencida', { regra:'prevista < referência e fase não terminal → usa a referência como previsão mínima', rotulo:'previsão vencida' }, DFP, PREM, 'Decisão de produto da trilha (§3.10)'),
    R('R15','toleranciaPrazoMeses','Tolerância de prazo (meses)', 0, AV, PREM, 'Premissa da trilha'),
    R('R16','idadeDemandaAlertaDias','Idade de demanda para alerta (dias)', 60, AV, PREM, 'Premissa da trilha'),
    R('R17','checklistTriagem','Checklist e precedência da triagem', {
      itens:[
        { id:'T1', pergunta:'É item de portfólio (não tarefa nem incidente)?', campo:'triagem.itemDePortfolio' },
        { id:'T2', pergunta:'Tem patrocinador?', campo:'patrocinador' },
        { id:'T3', pergunta:'Tem vínculo com objetivo?', campo:'objetivoEstrategicoId' },
        { id:'T4', pergunta:'Está no escopo e não pertence a outro fluxo?', campo:'triagem.outroFluxo, triagem.exigeNovaMetodologia', dica:'Exige nova metodologia ou novo modelo matemático? → escopo exploratório da Comunidade Técnica (s182)' },
        { id:'T5', pergunta:'Não é redundante?', campo:'triagem.redundanteComId' },
        { id:'T6', pergunta:'Tem estimativa mínima?', campo:'estimativaInformada', dica:'Estimativa em outra unidade conta; a unidade se resolve na qualificação' } ],
      precedencia:['T1','T4','T5','T2','T3','T6'],
      saidas:{ T1:'REDIRECIONAR_EXECUCAO', T4_metodologia:'ENCAMINHAR_EXPLORATORIO', T4_fluxo:'REDIRECIONAR_EXECUCAO', T5:'ARQUIVAR', T2:'DEVOLVER', T3:'DEVOLVER', T6:'DEVOLVER', ok:'ADMITIR' },
      destinoExploratorio:{ FEL:'PEL', FEN:'PEN', FER:'PEN', FEG:'PEN' } }, AV, PROP, DECK('s143') + ': T4/T5; saídas da triagem no s142; uso como admissibilidade ao portfólio é adaptação didática (DFP)'),
    R('R18','tiposDecisao','Catálogo de tipos de decisão', ['ADMITIR','DEVOLVER','REDIRECIONAR_EXECUCAO','ENCAMINHAR_EXPLORATORIO','ARQUIVAR','GO','GO_CONDICIONADO','HOLD','RECYCLE','KILL','ESCALAR','REPLANEJAR','REGISTRAR_DESVIO','ENCERRAR','GATE2_PAUSA_FORMAL','GATE3_ENCERRAR','CORRECAO_REGISTRO'], AV, PREM, 'Premissa da trilha (catálogo e alçadas a validar)'),
    R('R19','criterios','Critérios de priorização C1–C5', criterios, AV, PREM, 'Premissa: relação aproximada com s138/s143 (interpretação DFP)'),
    R('R20','pesosCriterios','Pesos dos critérios', { C1:0.30, C2:0.25, C3:0.20, C4:0.15, C5:0.10 }, AV, PREM, 'Premissa da trilha (pesos não são regra oficial)', { rotuloVersao:'v1' }),
    R('R21','escalaNormalizacao','Escala e normalização', { min:1, max:5, formula:'N = (S − 1) / 4 × 100' }, DFP, PREM, 'Decisão de produto: escala 1–5 ancorada, normalizada de 0 a 100'),
    R('R22','limiaresQuadrante','Limiares das matrizes', { valorAltoN:60, esforcoAltoFteAcimaDe:2, riscoAlto:12, riscoCritico:15 }, AV, PREM, 'Premissa da trilha',
      { descricao:'Valor alto: N ≥ 60. Esforço alto: FTE > 2. Risco alto: R ≥ 12. Risco crítico: R ≥ 15.' }),
    R('R23','desempate','Desempate e empate técnico', { ranking:['menor R','maior C1','código'], empateTecnicoDeltaN:1.0, otimizador:['maior V','menor FTE','menor custo','menor risco médio','códigos em ordem'] }, DFP, PREM, 'Decisão de produto da trilha (§3.10)'),
    R('R24','capacidadeCiclo','Capacidade e orçamento do Ciclo Exemplo 2027', { fteTotal:10.0, porGerencia:{ FEL:1.5, FEN:3.5, FER:4.0, FEG:1.0 }, orcamento:4.0, unidade:'FTE', moeda:'R$ mi', periodo:'2027' }, AV, PREM, 'Premissa ilustrativa do Ciclo Exemplo 2027', { marca:'ILUSTRATIVO' }),
    R('R25','fatorHorasPorFte','Fator horas → FTE', null, AV, PREM, 'Premissa: o app não converte horas em FTE'),
    R('R26','faixasCapacidade','Faixas de utilização da capacidade', { tanqueAcimaDe:1.00, reduzirAPartirDe:0.90, roadmapAPartirDe:0.75,
      acoes:{ TANQUE:'Ativar tanque + repriorizar backlog', REDUZIR:'Reduzir escopo + modularizar entregas', ROADMAP:'Executar roadmap estruturado', AUTONOMIA:'Investir em autonomia e dívida técnica' } },
      AV, PROP, DECK('s165') + '; adaptado de Lovelock & Wirtz', { descricao:'u > 100%: tanque; 90% ≤ u ≤ 100%: reduzir escopo; 75% ≤ u < 90%: roadmap; u < 75%: autonomia.' }),
    R('R27','reservaCapacidade','Reserva de capacidade (faixa proposta 15–20%)', 0.15, AV, PROP, DECK('s166')),
    R('R28','mixAlvo','Mix-alvo e tolerância do índice D', { alvo:{ SUSTENTACAO:0.30, EVOLUCAO:0.50, INOVACAO:0.20 }, toleranciaD:0.15, base:'parcela discricionária em R$' }, AV, PREM, 'Premissa da trilha'),
    R('R29','limiaresEvm','Limiares de EVM', { indice:0.85, tcpi:1.1 }, AV, MERC, 'Ref. de mercado: PMI (EVM)'),
    R('R30','formulas','Fórmulas de mercado adotadas', ['EVM','AHP','Spearman','Pareto','CPM','HHI'], DFP, MERC, 'Ref. de mercado: PMI (EVM), Saaty (AHP), Spearman, Pareto, CPM, HHI'),
    R('R31','horizontesInovacao','Horizontes de inovação e handover', { horizontes:{ H1:0.70, H2:0.20, H3:0.10 }, trlHandover:7 }, AV, PROP, DECK('s181, s209/s210; s183')),
    R('R32','robustezNucleo','Limiar de núcleo robusto e de HHI', { robustezNucleo:0.80, limiarHhi:0.25 }, AV, PREM, 'Premissa da trilha'),
    R('R33','papelPmoPriorizacao','Papel do PMO na priorização', { s143:'C', s149:'A', estruturantes:'contribui em estruturantes' }, AV, PROP, 'Contradição entre fontes (§2.2, regra 1): ' + DECK('s143 × s149') + '; RACI reconstruída do texto extraído, conferir no slide',
      { contradicao:true }),
    R('R34','limiteFegCtPmoPld','Limite FEG × CT PMO-PLD', { slide:'FEG executa e operacionaliza o backlog (s63)', comentario:'quem prioriza o escopo do CT está a validar' }, AV, REV, 'Rascunho de revisão do deck v25; s63'),
    R('R35','pesosCongeladosNaFotografia','Pesos congelados na fotografia do ciclo', { regra:'fechar a fotografia do ciclo grava versaoPesos; versões criadas depois ficam vigente:false', selo:'não usada na fotografia FR-CICLO' }, DFP, PREM, 'Decisão de produto da trilha'),
    R('R36a','regraDesbloqueio','Regra de desbloqueio', { regra:'% de graduadas acertadas sem revelação + desafio concluído' }, DFP, REPO, 'labs/portfolio-feg/src/core.js (unlock)'),
    R('R36b','notaMinimaNivel','Nota mínima por nível', 0.70, AV, PREM, 'Premissa da trilha'),
    R('R37','convencoesFinanceiras','Convenções financeiras', { previsao:'previsão no término', bac:'soma das linhas com fonte e período', moeda:'R$ (assumida; 0006 não modela moeda)' }, DFP, PREM, 'Decisão de produto da trilha'),
    R('R38','raciReconstruida','RACI reconstruída', 'linhas da coleção raci (§4.18)', AV, PROP, DECK('s143/s147/s149/s196') + '; reconstrução a partir do texto extraído; conferir no slide original'),
    R('R39','quadrantesS168','Quadrantes do s168', { eixos:'esforço técnico × impacto sistêmico', nomes:['quick wins','evoluções incrementais','projetos estruturantes','possíveis dispersões'] }, AV, PROP, DECK('s168') + '; posição inferida do layout; reconstrução a partir do texto extraído; conferir no slide original'),
    R('R40','classeSourcing','Classes de sourcing das ferramentas', ['NUCLEO_CRITICO','PERIFERICO','MERCADO','LEGADO'], AV, PROP, DECK('s231–s235')),
    R('R41','poolDeck','Pool de Recursos de Governança', ['Gestão de Portfólio/PMO','Governança, Riscos e Conformidade','Gestão de Contratos e Fornecedores','Estratégia e Inovação','Líder de Comunidade Técnica'], AV, PROP, DECK('s56/s57')),
    R('R42','papeisAprendizagem','Papéis de aprendizagem (Afinação FEG)', [
      { papel:'Governança, Riscos e Conformidade', naipes:['GOV','AUD'] }, { papel:'Portfólio/PMO', naipes:['PORT','KPI'] },
      { papel:'Contratos e Fornecedores', naipes:['ORC','CONT'] }, { papel:'Interface institucional e regulatória', naipes:['INST','REG'] },
      { papel:'Estratégia e Inovação', naipes:['INOV','MAT'] } ], AV, INT, 'public/afinacao-feg.html (NAIPES); não consta no deck'),
    R('R43','parametrosEditaveis','Parâmetros editáveis', R43.slice(), DFP, PREM, 'Decisão de produto da trilha (lista fechada)'),
  ];

  /* ------------------------------------------------ estrutura da FE (§4.4) */
  const gerencias = T([
    { id:'FEG', sigla:'FEG', nome:'FEG', nomeProposto:'Governança e Estratégia de Ferramentas Eletroenergéticas', ativo:true },
    { id:'FEL', sigla:'FEL', nome:'FEL', nomeProposto:'Ferramentas Elétricas', ativo:true },
    { id:'FEN', sigla:'FEN', nome:'FEN', nomeProposto:'Ferramentas Energéticas', ativo:true },
    { id:'FER', sigla:'FER', nome:'FER', nomeProposto:'Ferramentas para Recursos e Carga', ativo:true },
  ]);
  const C = (id, nome, tipo, gerenciaId, siglaDidatica, extra={}) => Object.assign({ id, sigla:id, nome, tipo, gerenciaId, lider:'a definir', siglaDidatica, ativo:true }, extra);
  const comunidades = T([
    C('TEM','Transitórios Eletromagnéticos','ENTREGA','FEL',false),
    C('RP','Regime Permanente e Transitórios Eletromecânicos','ENTREGA','FEL',false, { siglaDeck:'RP/TEMec' }),
    C('PPE','Planejamento e Programação Energética','ENTREGA','FEN',false),
    C('HID','Recursos Hidrológicos','ENTREGA','FER',true),
    C('GRV','Geração Renovável Variável','ENTREGA','FER',false),
    C('CRG','Carga e Recursos Energéticos Distribuídos','ENTREGA','FER',true),
    C('PEL','Prospecção e Evolução Técnica das Ferramentas Elétricas','TECNICA','FEG',true, { vinculoRegra:'R03' }),
    C('PEN','Prospecção e Evolução Técnica das Ferramentas Energéticas','TECNICA','FEG',true, { vinculoRegra:'R03' }),
    C('ACO','Acoplamento Eletroenergético','TECNICA','FEG',true, { vinculoRegra:'R03' }),
    C('PLA','Plataformização, Escalabilidade e Performance','TECNICA','FEG',true, { vinculoRegra:'R03', lideranca:'DTA (s118)' }),
  ]);
  const S = (id, nome, comunidadeId) => ({ id, nome, comunidadeId, ativo:true });
  const squads = T([
    S('TEM-A','Simulador EMT','TEM'), S('TEM-B','Base de Dados EMT','TEM'),
    S('RP-A','Regime Permanente','RP'), S('RP-B','Transitórios Eletromecânicos','RP'), S('RP-C','Operação','RP'), S('RP-D','Base de Dados Eletromecânicos','RP'),
    S('PPE-A','Curto e Médio Prazo','PPE'), S('PPE-B','Curtíssimo Prazo','PPE'), S('PPE-C','Simulador de Despacho','PPE'),
    S('HID-A','Vazão e Cenários Hídricos','HID'), S('HID-B','Simulador Hidráulico','HID'),
    S('GRV-A','Fotovoltaica e Eólica','GRV'),
    S('CRG-A','Previsão de Carga e GD/MMGD','CRG'),
  ]);
  const F = (id, nome, comunidadeId, classeSourcing) => ({ id, nome, comunidadeId, classeSourcing, observacao:'vínculo de catálogo; status e números da iniciativa são fictícios', ativo:true });
  const ferramentas = T([
    F('ANAREDE','ANAREDE','RP','NUCLEO_CRITICO'), F('ANAFAS','ANAFAS','RP','NUCLEO_CRITICO'), F('ORGANON','ORGANON','RP','NUCLEO_CRITICO'), F('HARMZS','HARMZS','RP','LEGADO'),
    F('NEWAVE','NEWAVE','PPE','NUCLEO_CRITICO'), F('DECOMP','DECOMP','PPE','NUCLEO_CRITICO'), F('DESSEM','DESSEM','PPE','NUCLEO_CRITICO'), F('BALPONTA','BALPONTA','PPE','NUCLEO_CRITICO'),
    F('GEVAZP','GEVAZP','HID','PERIFERICO'), F('PREVIVAZ','PREVIVAZ','HID','PERIFERICO'), F('SMAP-ONS','SMAP/ONS','HID','PERIFERICO'),
    F('WEOL','WEOL','GRV','PERIFERICO'),
    F('PREV-CARGA-PMO','PREV CARGA PMO','CRG','PERIFERICO'), F('PREV-CARGA-DESSEM','PREV CARGA DESSEM','CRG','PERIFERICO'),
    F('HYPERSIM','HYPERSIM','TEM','MERCADO'), F('PSCAD','PSCAD','TEM','MERCADO'),
  ]);

  /* ------------------------------------------------ catálogos (§4.2) */
  const statusConfiguracao = T([
    ['DEMANDA','Demanda','Pedido ainda não decidido; espelho do registro de origem (ITSM/ADO)',1,false],
    ['EM_ANALISE','Em análise','Admitida para análise do portfólio (candidata)',2,false],
    ['APROVADA','Aprovada','Aprovada pela instância; aguarda início',3,false],
    ['EM_EXECUCAO','Em execução','Em execução; acompanhada no fórum mensal',4,false],
    ['EM_ESPERA','Em espera','Pausada formalmente, com gatilho de reativação',5,false],
    ['ENCERRADA','Encerrada','Entregue; continua ativo:true para o benefício seguir medido (a validar)',6,true],
    ['CANCELADA','Cancelada','Encerrada sem entrega; ativo:false',7,true],
  ].map(([codigo,nome,descricao,ordem,terminal]) => ({ id:codigo, codigo, nome, descricao, ordem, terminal, origemRegra:AV, tipoFonte:PREM, statusValidacao:'A_VALIDAR', ativo:true })));
  const categorias = T([
    { id:'OBRIGATORIA', codigo:'OBRIGATORIA', nome:'Obrigatória', sigla:'OBR', discricionaria:false },
    { id:'SUSTENTACAO', codigo:'SUSTENTACAO', nome:'Sustentação', sigla:'SUS', discricionaria:true },
    { id:'EVOLUCAO', codigo:'EVOLUCAO', nome:'Evolução', sigla:'EVO', discricionaria:true },
    { id:'INOVACAO', codigo:'INOVACAO', nome:'Inovação', sigla:'INO', discricionaria:true },
  ].map(c => Object.assign(c, { origemRegra:AV, tipoFonte:PREM, regra:'R12' })));
  const TD = (codigo, contexto, nome, exige) => ({ codigo, contexto, nome, exige });
  const catalogos = {
    origemDemanda:[{ codigo:'OPERATIVA', nome:'Operativa' }, { codigo:'REGULATORIA', nome:'Regulatória' }, { codigo:'ESTRATEGICA', nome:'Estratégica' }],
    canalEntrada:[{ codigo:'USUARIOS_INTERNOS', nome:'Usuários internos' }, { codigo:'CENTRAL_ATENDIMENTO', nome:'Central de atendimento' }, { codigo:'CT_PMO_PLD', nome:'CT PMO-PLD' }],
    tiposDecisao:[
      TD('ADMITIR','TRIAGEM','Admitir para análise','justificativa ≥ 20 caracteres; instância PO da squad (R)'),
      TD('DEVOLVER','TRIAGEM','Devolver para completar','justificativa ≥ 20 caracteres; pendência com o que falta'),
      TD('REDIRECIONAR_EXECUCAO','TRIAGEM','Redirecionar ao fluxo de execução','justificativa ≥ 20 caracteres; destino'),
      TD('ENCAMINHAR_EXPLORATORIO','TRIAGEM','Encaminhar ao escopo exploratório','justificativa ≥ 20 caracteres; destino (Comunidade Técnica)'),
      TD('ARQUIVAR','TRIAGEM','Arquivar com vínculo','justificativa ≥ 20 caracteres; vínculo com a iniciativa redundante'),
      TD('GO','GATE','Go','—'), TD('GO_CONDICIONADO','GATE','Go condicionado','condicionantes e próxima revisão'),
      TD('HOLD','GATE','Hold','gatilho de reativação'), TD('RECYCLE','GATE','Recycle','próxima revisão'), TD('KILL','GATE','Kill','justificativa'),
      TD('ESCALAR','ACOMPANHAMENTO','Escalar','instância'), TD('REPLANEJAR','ACOMPANHAMENTO','Replanejar','recomendação e instância'),
      TD('REGISTRAR_DESVIO','ACOMPANHAMENTO','Registrar desvio','recomendação e instância'), TD('ENCERRAR','ACOMPANHAMENTO','Encerrar','—'),
      TD('GATE2_PAUSA_FORMAL','INOVACAO','Gate 2: pausa formal','gatilho de reativação'), TD('GATE3_ENCERRAR','INOVACAO','Gate 3: encerrar com lições','—'),
      TD('CORRECAO_REGISTRO','REGISTRO','Correção de registro','refDecisaoAnteriorId; tipoDecisaoCorrigido quando corrige triagem'),
    ],
    classeRecomendacao:[
      { codigo:'NUCLEO', nome:'Núcleo', tipoDecisao:'GO', exige:'—' },
      { codigo:'CONDICIONAL', nome:'Condicional', tipoDecisao:'GO_CONDICIONADO', exige:'condicionante e gatilho obrigatórios' },
      { codigo:'HABILITADORA', nome:'Habilitadora', tipoDecisao:'HOLD', exige:'gatilhoReativacao (ex.: "Dep4 confirmada")' },
      { codigo:'RECYCLE', nome:'Recycle', tipoDecisao:'RECYCLE', exige:'—' },
      { codigo:'KILL', nome:'Kill', tipoDecisao:'KILL', exige:'—' },
    ],
    tiposForum:[
      { codigo:'ACOMPANHAMENTO_PORTFOLIO', nome:'Fórum de Acompanhamento de Portfólio', periodicidade:'mensal', origem:'s129, proposta' },
      { codigo:'PLANEJAMENTO_PORTFOLIO', nome:'Fórum de Planejamento do Portfólio', periodicidade:'em conflito (R05b)', origem:'s127' },
      { codigo:'PLANEJAMENTO_EVOLUCAO', nome:'Fórum de Planejamento e Evolução', periodicidade:'—', origem:'s128' },
      { codigo:'SESSAO_GATE_SIMULADA', nome:'Sessão de gate (simulada)', periodicidade:'sessão de exercício', origem:'s153 descreve um mecanismo, não um fórum; adaptação didática' },
    ],
    statusFechados:{ riscos:['RESOLVIDO','CONCLUIDO','FECHADO'], dependencias:['RESOLVIDA','CONCLUIDA','FECHADA'] },
    papeisRegistrantes:['Analista: Gestão de Portfólio/PMO','Analista: Governança, Riscos e Conformidade','Analista: Contratos e Fornecedores','Analista: Estratégia e Inovação','Analista: Interface institucional e regulatória (papel de aprendizagem)'],
    instancias:{
      triagem:['PO da squad (R): s143, leitura do texto extraído'],
      gate:['PO da squad: gate da squad (s143, a conferir)','[Simulado] Sessão de gate: instância a validar','Fórum de Planejamento do Portfólio (s127): deliberação a validar'],
      acompanhamento:['[Simulado] Fórum de Acompanhamento de Portfólio (FEG coordena, s129): instância a validar','Gerência responsável (a validar)','Gerente Executivo FE: arbitra conflito de prioridade (s71, proposta)'],
      ciclo:['Fórum de Planejamento do Portfólio (s127); tomadores segundo s205: Diretores/GEs. A validar'],
    },
    tiposPendencia:['CAMPO_VAZIO','DIVERGENCIA_STATUS','DADO_INCONSISTENTE'],
    statusPendencia:['ABERTA','RESOLVIDA'],
    naturezaRisco:['RISCO','IMPEDIMENTO'],
    sinais:[{ codigo:'VERDE', nome:'Verde' }, { codigo:'AMARELO', nome:'Amarelo' }, { codigo:'VERMELHO', nome:'Vermelho' }, { codigo:'CINZA', nome:'Cinza (sem referência)' }],
    faixasHorizonte:['VENCIDO','30_DIAS','60_DIAS','90_DIAS','ACIMA_90','SEM_DATA'],
    quadrantes:{
      valorEsforco:{ FAZER_PRIMEIRO:'fazer primeiro', PLANEJAR:'planejar', COMPLEMENTAR:'complementar', QUESTIONAR:'questionar' },
      valorRisco:{ PEROLA:'pérola', OSTRA:'ostra', PAO_COM_MANTEIGA:'pão com manteiga', ELEFANTE_BRANCO:'elefante branco' },
    },
    classesSourcing:[{ codigo:'NUCLEO_CRITICO', nome:'Núcleo crítico' }, { codigo:'PERIFERICO', nome:'Periférico' }, { codigo:'MERCADO', nome:'Mercado' }, { codigo:'LEGADO', nome:'Legado' }],
    horizontesInovacao:[{ codigo:'H1', nome:'H1 · núcleo' }, { codigo:'H2', nome:'H2 · adjacente' }, { codigo:'H3', nome:'H3 · transformacional' }],
    rubricas:{
      C1:['sem vínculo','vínculo genérico','apoia um objetivo em parte','contribui diretamente','contribui diretamente e é marco ou obrigação'],
      C2:['sem efeito','localizado','relevante em uma ferramenta','vários processos ou falha recorrente','estrutural ou falha crítica'],
      C3:['adiar 12 meses não muda nada','incômodo','custo ou risco cresce aos poucos','janela em 6–12 meses','data-limite firme no ciclo'],
      C4:['nenhuma','risco menor','relevante em uma ferramenta','relevante e recorrente','remove risco crítico'],
      C5:['método desconhecido','exige pesquisa','conhecido, com incertezas','a equipe já fez algo parecido','rotina'],
    },
    pessoasChave:[{ codigo:'K', nome:'Especialista K (fictício)' }],
  };
  /* entradas dos catálogos também levam a marca (o contêiner `catalogos` não, para não misturar chaves de dado com listas) */
  Object.values(catalogos).forEach(v => { if(Array.isArray(v)) v.forEach(x => { if(x && typeof x === 'object') tag(x); }); });
  const ciclos = T([
    { id:'EX-2025', nome:'Ciclo Exemplo 2025 (ILUSTRATIVO)' }, { id:'EX-2026', nome:'Ciclo Exemplo 2026 (ILUSTRATIVO)' }, { id:'EX-2027', nome:'Ciclo Exemplo 2027 (ILUSTRATIVO)' },
  ]);
  const fornecedores = T([{ id:'Alfa', nome:'Fornecedor Alfa (fictício)' }, { id:'Beta', nome:'Fornecedor Beta (fictício)' }, { id:'Gama', nome:'Fornecedor Gama (fictício)' }]);
  const objetivosEstrategicos = T([
    { id:'OE-1', codigo:'OE-1', nome:'Continuidade e desempenho das ferramentas', vinculoSugerido:'direcionador "Agilidade e Sustentação Operacional" (s180, proposta)' },
    { id:'OE-2', codigo:'OE-2', nome:'Integração e qualidade de dados', vinculoSugerido:'pilar "Transparência, dados e relação com o setor" (s262, proposta)' },
    { id:'OE-3', codigo:'OE-3', nome:'Atendimento a requisitos regulatórios', vinculoSugerido:'pilar "Governança institucional e regulatória" (s262, proposta)' },
  ].map(o => Object.assign(o, { origemRegra:AV, tipoFonte:PREM, regra:'R04' })));

  /* ------------------------------------------------ iniciativas (§4.6) */
  const BASE_I = { squadId:null, ferramentaId:null, horizontePrazo:null, categoria:null, objetivoEstrategicoId:null, patrocinador:null, origemDemanda:null, canalEntrada:null,
    envolveCtPmoPld:false, percentualFisicoReal:null, percentualFisicoPlanejado:null, ragDeclarado:null, dataPlanejada:null, dataPrevistaAtual:null, faseDesde:null,
    estimativaInformada:null, beneficioEsperado:null, triagem:null, ciclo:null, obrigatoria:false, candidataObrigatoria:false, evidenciaObrigatoriedade:null,
    horizonteInovacao:null, pessoasChave:[], grupoExclusividade:null, criticidade:null, impacto:null, trlEsperado:'n/a', observacoes:'', ativo:true, rowVersion:1 };
  const I = o => tag(Object.assign({}, BASE_I, o, {
    codigo: o.id, titulo: o.titulo + ' (fictício)',
    linkOperacional: (/^D\d/.test(o.id) ? ITSM : ADO)(o.id),
    createdAt: o.dataEntrada + 'T12:00:00Z', updatedAt: (o.updatedAt || o.dataEntrada) + 'T12:00:00Z' }));
  const EVID = (documento, anexada) => ({ documento, versao: anexada ? 'ILUSTRATIVO' : null, data:null, trecho: anexada ? '(trecho ilustrativo)' : null, anexada });
  const iniciativas = [
    /* em execução (EX-2026) */
    I({ id:'E01', titulo:'Ajuste de desempenho em casos de grande porte do modelo de fluxo de potência', statusId:'EM_EXECUCAO', gerenciaId:'FEL', comunidadeId:'RP', squadId:'RP-D', ferramentaId:'ANAREDE',
      categoria:'SUSTENTACAO', objetivoEstrategicoId:'OE-1', responsavel:'PO RP-D (papel fictício)', patrocinador:'Gerente FEL (papel)', areaClienteOrigem:'Área usuária de estudos elétricos (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2026', dataEntrada:'2026-02-10', dataPlanejada:'2026-12-18', dataPrevistaAtual:'2026-12-18',
      criticidade:'média', impacto:'estudos elétricos', percentualFisicoReal:70, percentualFisicoPlanejado:70, ragDeclarado:'VERDE', updatedAt:'2026-09-30',
      descricaoObjetivo:'Reduzir o tempo de execução de casos grandes', beneficioEsperado:'Tempo de execução menor (KPI a definir)' }),
    I({ id:'E02', titulo:'Módulo de relatórios gerenciais de saídas do simulador de despacho', statusId:'EM_EXECUCAO', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-C', ferramentaId:'BALPONTA',
      categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-2', responsavel:'PO PPE-C (papel fictício)', patrocinador:'Gerente FEN (papel)', areaClienteOrigem:'Áreas usuárias do despacho (papel)',
      origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2026', dataEntrada:'2026-01-15', dataPlanejada:'2026-11-27', dataPrevistaAtual:'2027-03-26',
      criticidade:'média', impacto:'áreas usuárias', percentualFisicoReal:50, percentualFisicoPlanejado:70, ragDeclarado:'VERDE', updatedAt:'2026-09-30',
      descricaoObjetivo:'Padronizar relatórios gerenciais de saídas', beneficioEsperado:'Relatórios padronizados para áreas usuárias' }),
    I({ id:'E03', titulo:'Adequação do modelo de previsão de vazões ao requisito regulatório fictício R-00', statusId:'EM_EXECUCAO', gerenciaId:'FER', comunidadeId:'HID', squadId:'HID-A', ferramentaId:'PREVIVAZ',
      categoria:'OBRIGATORIA', objetivoEstrategicoId:'OE-3', responsavel:'PO HID-A (papel fictício)', patrocinador:'Gerente FER (papel)', areaClienteOrigem:'Área de hidrologia (papel)',
      origemDemanda:'REGULATORIA', canalEntrada:'CT_PMO_PLD', envolveCtPmoPld:true, horizonteInovacao:'H1', ciclo:'EX-2026', dataEntrada:'2025-11-20', dataPlanejada:'2027-02-26', dataPrevistaAtual:'2027-03-31',
      criticidade:'alta', impacto:'requisito regulatório', percentualFisicoReal:45, percentualFisicoPlanejado:50, ragDeclarado:'AMARELO', updatedAt:'2026-09-30',
      obrigatoria:true, evidenciaObrigatoriedade:EVID('Documento fictício R-00/2025', true),
      descricaoObjetivo:'Atender requisito fictício R-00', beneficioEsperado:'Cumprir R-00 no prazo' }),
    I({ id:'E04', titulo:'PoC de visualização de resultados de simulações de transitórios eletromagnéticos', statusId:'EM_EXECUCAO', gerenciaId:'FEG', comunidadeId:'PEL',
      categoria:'INOVACAO', objetivoEstrategicoId:null, responsavel:'Líder técnico PEL (papel fictício)', patrocinador:'Gerente FEG (papel)', areaClienteOrigem:'Comunidade técnica PEL (papel)',
      origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H3', ciclo:'EX-2026', dataEntrada:'2026-03-02', dataPlanejada:'2026-12-01', dataPrevistaAtual:'2026-12-01',
      criticidade:'baixa', impacto:'exploratório', trlEsperado:'3→4', percentualFisicoReal:30, percentualFisicoPlanejado:30, ragDeclarado:'VERDE', updatedAt:'2026-09-30',
      descricaoObjetivo:'Testar visualização interativa de resultados EMT', beneficioEsperado:'Avaliar viabilidade' }),
    I({ id:'E05', titulo:'Modernização do ambiente de execução dos modelos energéticos de médio prazo', statusId:'EM_EXECUCAO', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-A', ferramentaId:'NEWAVE',
      categoria:'SUSTENTACAO', objetivoEstrategicoId:'OE-1', responsavel:'PO PPE-A (papel fictício)', patrocinador:'Gerente FEN (papel)', areaClienteOrigem:'Programação energética (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2026', dataEntrada:'2025-10-15', dataPlanejada:'2026-10-30', dataPrevistaAtual:'2027-01-29',
      criticidade:'alta', impacto:'rodadas mensais', percentualFisicoReal:60, percentualFisicoPlanejado:80, ragDeclarado:'VERMELHO', updatedAt:'2026-09-30',
      descricaoObjetivo:'Estabilizar o ambiente de execução', beneficioEsperado:'Ambiente estável para as rodadas mensais' }),
    I({ id:'E06', titulo:'Integração do modelo de previsão de carga de curtíssimo prazo à base corporativa', statusId:'EM_EXECUCAO', gerenciaId:'FER', comunidadeId:'CRG', squadId:'CRG-A', ferramentaId:'PREV-CARGA-DESSEM',
      categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-2', responsavel:'PO CRG-A (papel fictício)', patrocinador:'Gerente FER (papel)', areaClienteOrigem:'Previsão de carga (papel)',
      origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2026', dataEntrada:'2026-04-06', dataPlanejada:null, dataPrevistaAtual:'2027-04-30',
      criticidade:'média', impacto:'carga manual', percentualFisicoReal:35, percentualFisicoPlanejado:null, ragDeclarado:null, updatedAt:'2026-09-30',
      descricaoObjetivo:'Integrar dados de entrada à base corporativa', beneficioEsperado:'Eliminar carga manual' }),
    /* candidatas do Ciclo Exemplo 2027 */
    I({ id:'P01', titulo:'Adequação do modelo de programação diária ao requisito regulatório fictício R-01', statusId:'EM_ANALISE', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-B', ferramentaId:'DESSEM',
      categoria:'OBRIGATORIA', objetivoEstrategicoId:'OE-3', responsavel:'PO PPE-B (papel fictício)', patrocinador:'Gerente FEN (papel)', areaClienteOrigem:'Programação diária (papel)',
      origemDemanda:'REGULATORIA', canalEntrada:'CT_PMO_PLD', envolveCtPmoPld:true, horizonteInovacao:'H1', ciclo:'EX-2027', dataEntrada:'2026-05-20', criticidade:'alta', impacto:'regulatório',
      obrigatoria:true, evidenciaObrigatoriedade:EVID('Ofício fictício R-01/2026', true), descricaoObjetivo:'Atender requisito fictício R-01', beneficioEsperado:'Cumprir R-01' }),
    I({ id:'P02', titulo:'Migração do repositório de dados hidrometeorológicos para nova plataforma', statusId:'EM_ANALISE', gerenciaId:'FER', comunidadeId:'HID', squadId:'HID-A',
      categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-2', responsavel:'PO HID-A (papel fictício)', patrocinador:'Gerente FER (papel)', areaClienteOrigem:'Hidrometeorologia (papel)',
      origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H2', ciclo:'EX-2027', dataEntrada:'2026-06-02', criticidade:'média', impacto:'dados',
      pessoasChave:['K'], descricaoObjetivo:'Migrar o repositório hidrometeorológico', beneficioEsperado:'Base única e versionada' }),
    I({ id:'P03', titulo:'Painel de qualidade dos dados de entrada, fase 2: modelos de médio e curto prazo', statusId:'EM_ANALISE', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-A', ferramentaId:'DECOMP',
      categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-2', responsavel:'PO PPE-A (papel fictício)', patrocinador:'Gerente FEN (papel)', areaClienteOrigem:'Planejamento energético (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2027', dataEntrada:'2026-06-10', criticidade:'média', impacto:'dados de entrada',
      pessoasChave:['K'], descricaoObjetivo:'Validar automaticamente lotes de entrada (fase 2)', beneficioEsperado:'Elevar o % de lotes validados de 60% para 95%' }),
    I({ id:'P04', titulo:'PoC de aprendizado de máquina para previsão de carga', statusId:'EM_ANALISE', gerenciaId:'FEG', comunidadeId:'PEN',
      categoria:'INOVACAO', objetivoEstrategicoId:'OE-1', responsavel:'Líder técnico PEN (papel fictício)', patrocinador:'Gerente FEG (papel)', areaClienteOrigem:'Previsão de carga (papel)',
      origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H3', ciclo:'EX-2027', dataEntrada:'2026-06-25', criticidade:'baixa', impacto:'exploratório', trlEsperado:'3→5',
      grupoExclusividade:'X-AMB', descricaoObjetivo:'PoC com critérios de sucesso e gate de escala', beneficioEsperado:'Avaliar ganho de acurácia' }),
    I({ id:'P05', titulo:'Refatoração do código legado do modelo chuva-vazão', statusId:'EM_ANALISE', gerenciaId:'FER', comunidadeId:'HID', squadId:'HID-A', ferramentaId:'SMAP-ONS',
      categoria:'SUSTENTACAO', objetivoEstrategicoId:'OE-1', responsavel:'PO HID-A (papel fictício)', patrocinador:'Gerente FER (papel)', areaClienteOrigem:'Hidrologia (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2027', dataEntrada:'2026-05-12', criticidade:'alta', impacto:'dívida técnica',
      pessoasChave:['K'], descricaoObjetivo:'Refatorar código sem testes conhecido por uma só pessoa', beneficioEsperado:'Reduzir dívida técnica e dependência' }),
    I({ id:'P06', titulo:'Automação de testes de regressão de versões dos modelos hidrológicos', statusId:'EM_ANALISE', gerenciaId:'FER', comunidadeId:'HID', squadId:'HID-A', ferramentaId:'SMAP-ONS',
      categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-1', responsavel:'PO HID-A (papel fictício)', patrocinador:'Gerente FER (papel)', areaClienteOrigem:'Hidrologia (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2027', dataEntrada:'2026-06-18', criticidade:'média', impacto:'qualidade de versões',
      pessoasChave:['K'], descricaoObjetivo:'Automatizar regressão entre versões', beneficioEsperado:'Menos falhas de regressão' }),
    I({ id:'P07', titulo:'Gestão documental de versões e manuais dos modelos de transitórios eletromagnéticos', statusId:'EM_ANALISE', gerenciaId:'FEL', comunidadeId:'TEM', squadId:'TEM-B',
      categoria:'SUSTENTACAO', objetivoEstrategicoId:'OE-1', responsavel:'PO TEM-B (papel fictício)', patrocinador:'Gerente FEL (papel)', areaClienteOrigem:'Estudos de transitórios (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2027', dataEntrada:'2026-07-01', criticidade:'baixa', impacto:'documentação',
      descricaoObjetivo:'Organizar versões e manuais', beneficioEsperado:'Manuais e versões rastreáveis' }),
    I({ id:'P08', titulo:'Integração de novas fontes de dados meteorológicos às previsões eólicas', statusId:'EM_ANALISE', gerenciaId:'FER', comunidadeId:'GRV', squadId:'GRV-A', ferramentaId:'WEOL',
      categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-2', responsavel:'PO GRV-A (papel fictício)', patrocinador:'Gerente FER (papel)', areaClienteOrigem:'Previsão eólica (papel)',
      origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H2', ciclo:'EX-2027', dataEntrada:'2026-07-08', criticidade:'média', impacto:'previsão eólica',
      pessoasChave:['K'], grupoExclusividade:'X-AMB', descricaoObjetivo:'Incorporar novas fontes meteorológicas', beneficioEsperado:'Previsão eólica melhor' }),
    /* demandas (espelho do registro de origem) */
    I({ id:'D1', titulo:'Corrigir defeito pontual no relatório de saída do modelo de previsão de carga mensal', statusId:'DEMANDA', gerenciaId:'FER', comunidadeId:'CRG', squadId:'CRG-A', ferramentaId:'PREV-CARGA-PMO',
      responsavel:'PO CRG-A (papel fictício)', patrocinador:null, objetivoEstrategicoId:null, areaClienteOrigem:'Previsão de carga (papel)', origemDemanda:'OPERATIVA', canalEntrada:'CENTRAL_ATENDIMENTO',
      dataEntrada:'2026-09-20', descricaoObjetivo:'Correção pontual de defeito', estimativaInformada:null,
      triagem:{ itemDePortfolio:false, exigeNovaMetodologia:false, redundanteComId:null, outroFluxo:true, escopoFEG:true, nota:'correção pontual; registro de origem no ITSM' } }),
    I({ id:'D2', titulo:'Adequar o modelo de geração de cenários de vazões ao requisito regulatório fictício R-02', statusId:'DEMANDA', gerenciaId:'FER', comunidadeId:'HID', squadId:'HID-A', ferramentaId:'GEVAZP',
      responsavel:'PO HID-A (papel fictício)', patrocinador:'Gerente FER (papel)', objetivoEstrategicoId:'OE-3', areaClienteOrigem:'Hidrologia (papel)', origemDemanda:'REGULATORIA', canalEntrada:'CT_PMO_PLD',
      envolveCtPmoPld:true, horizonteInovacao:'H1', dataEntrada:'2026-07-10', criticidade:'alta', impacto:'regulatório', candidataObrigatoria:true, evidenciaObrigatoriedade:EVID('Requisito fictício R-02', false),
      descricaoObjetivo:'Adequação regulatória', beneficioEsperado:'Cumprir R-02', estimativaInformada:{ valor:3200, unidade:'HORAS', custo:0.6 },
      triagem:{ itemDePortfolio:true, exigeNovaMetodologia:false, redundanteComId:null, outroFluxo:false, escopoFEG:true } }),
    I({ id:'D3', titulo:'Avaliar nova metodologia de previsão de vazões com aprendizado profundo', statusId:'DEMANDA', gerenciaId:'FER', comunidadeId:'HID',
      responsavel:'Líder da comunidade HID (papel fictício)', patrocinador:'Gerente FER (papel)', objetivoEstrategicoId:'OE-1', areaClienteOrigem:'Hidrologia (papel)', origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS',
      horizonteInovacao:'H3', dataEntrada:'2026-08-01', trlEsperado:'2→4', descricaoObjetivo:'Nova metodologia de previsão', beneficioEsperado:'Avaliar método', estimativaInformada:{ valor:1.0, unidade:'FTE', custo:null },
      triagem:{ itemDePortfolio:true, exigeNovaMetodologia:true, redundanteComId:null, outroFluxo:false, escopoFEG:true } }),
    I({ id:'D4', titulo:'Painel de validação dos dados de entrada do modelo de programação diária', statusId:'DEMANDA', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-B', ferramentaId:'DESSEM',
      responsavel:'PO PPE-B (papel fictício)', patrocinador:'Gerente FEN (papel)', objetivoEstrategicoId:'OE-2', areaClienteOrigem:'Programação diária (papel)', origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS',
      horizonteInovacao:'H1', dataEntrada:'2026-09-25', descricaoObjetivo:'Validar dados de entrada', estimativaInformada:{ valor:0.5, unidade:'FTE', custo:null },
      triagem:{ itemDePortfolio:true, exigeNovaMetodologia:false, redundanteComId:'P03', outroFluxo:false, escopoFEG:true } }),
    I({ id:'D5', titulo:'Nova saída de sensibilidade no modelo de programação diária, solicitada pela área usuária', statusId:'DEMANDA', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-B', ferramentaId:'DESSEM',
      responsavel:'PO PPE-B (papel fictício)', patrocinador:'Gerente FEN (papel)', objetivoEstrategicoId:'OE-2', areaClienteOrigem:'Área usuária da programação diária (papel)', origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS',
      horizonteInovacao:'H1', dataEntrada:'2026-09-01', descricaoObjetivo:'Nova saída de sensibilidade', estimativaInformada:null,
      triagem:{ itemDePortfolio:true, exigeNovaMetodologia:false, redundanteComId:null, outroFluxo:false, escopoFEG:true } }),
    /* encerrada, em espera e cancelada */
    I({ id:'B01', titulo:'Painel de qualidade dos dados de entrada, fase 1: modelo energético de médio prazo', statusId:'ENCERRADA', faseDesde:'2026-03-31', gerenciaId:'FEN', comunidadeId:'PPE', squadId:'PPE-A', ferramentaId:'NEWAVE',
      categoria:'EVOLUCAO', objetivoEstrategicoId:'OE-2', responsavel:'PO PPE-A (papel fictício)', patrocinador:'Gerente FEN (papel)', areaClienteOrigem:'Planejamento energético (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H1', ciclo:'EX-2025', dataEntrada:'2025-06-02', dataPlanejada:'2026-03-31', dataPrevistaAtual:'2026-03-31',
      criticidade:'média', impacto:'dados de entrada', percentualFisicoReal:100, percentualFisicoPlanejado:100, updatedAt:'2026-03-31',
      descricaoObjetivo:'Validar lotes de entrada (fase 1)', beneficioEsperado:'BEN-01 e BEN-02 (medição por 12 meses)' }),
    I({ id:'H01', titulo:'Estudo de co-simulação EMT–RMS', statusId:'EM_ESPERA', faseDesde:'2026-04-15', gerenciaId:'FEG', comunidadeId:'PEL',
      categoria:'INOVACAO', objetivoEstrategicoId:'OE-1', responsavel:'Líder técnico PEL (papel fictício)', patrocinador:'Gerente FEG (papel)', areaClienteOrigem:'Comunidade técnica PEL (papel)',
      origemDemanda:'ESTRATEGICA', canalEntrada:'USUARIOS_INTERNOS', horizonteInovacao:'H3', ciclo:'EX-2026', dataEntrada:'2026-01-20', dataPlanejada:null, dataPrevistaAtual:'2026-09-15',
      criticidade:'média', impacto:'exploratório', trlEsperado:'2→4', percentualFisicoReal:10, updatedAt:'2026-04-15',
      descricaoObjetivo:'Avaliar co-simulação EMT–RMS', beneficioEsperado:'Avaliar viabilidade', observacoes:'Aguarda base de casos EMT validada (pausa formal, DEC-002).' }),
    I({ id:'X01', titulo:'Customização visual das telas do programa de análise harmônica', statusId:'CANCELADA', faseDesde:'2026-06-10', ativo:false, gerenciaId:'FEL', comunidadeId:'RP', squadId:'RP-D', ferramentaId:'HARMZS',
      categoria:'EVOLUCAO', objetivoEstrategicoId:null, responsavel:'PO RP-D (papel fictício)', patrocinador:'Gerente FEL (papel)', areaClienteOrigem:'Estudos elétricos (papel)',
      origemDemanda:'OPERATIVA', canalEntrada:'CENTRAL_ATENDIMENTO', horizonteInovacao:'H1', ciclo:'EX-2026', dataEntrada:'2026-04-10', criticidade:'baixa', impacto:'cosmético',
      percentualFisicoReal:5, updatedAt:'2026-06-10', descricaoObjetivo:'Nova identidade visual das telas' }),
  ];

  /* ------------------------------------------------ financeiro (§4.6.4 e §4.7) */
  const ERP = 'Consolidação ilustrativa (ERP fictício)', EST = 'Estimativa ilustrativa: ordem de grandeza';
  const FIN = (iniciativaId, periodo, orcamentoPlanejado, realizado, previsao, fonte, dataReferencia, fornecedorPrincipal, sufixo='') =>
    ({ id:'FIN-' + iniciativaId + sufixo, iniciativaId, periodo, orcamentoPlanejado, realizado, previsao, fonte, dataReferencia, fornecedorPrincipal });
  const financeiro = T([
    FIN('E01','2026-01-01',0.80,0.50,0.80,ERP,'2026-09-30','Gama'),
    FIN('E02','2026-01-01',1.50,1.20,1.50,ERP,'2026-09-30','Beta'),
    FIN('E03','2026-01-01',2.00,0.90,2.00,ERP,'2026-09-30','Alfa'),
    FIN('E04','2026-01-01',0.30,0.08,0.30,ERP,'2026-09-30','Beta'),
    FIN('E05','2026-01-01',1.40,1.30,1.80,ERP,'2026-09-30','Alfa'),
    FIN('E06','2026-01-01',0.60,0.20,0.60,ERP,'2026-09-30','Alfa'),
    FIN('B01','2025-07-01',0.35,0.33,0.35,ERP,'2026-09-30','Gama'),
    FIN('H01','2026-01-01',0.40,0.05,0.40,'','2026-09-30',null),
    FIN('X01','2026-01-01',0.15,0.02,null,ERP,'2026-09-30','Beta'),
    ...[['P01',1.20],['P02',0.90],['P03',0.30],['P04',0.50],['P05',1.60],['P06',0.60],['P07',0.25],['P08',0.80]]
      .map(([id, c]) => FIN(id,'2027-01-01',c,0,null,EST,'2026-09-18',null,'-2027')),
  ]);

  /* ------------------------------------------------ capacidade (§4.8) */
  const METODO = 'capacidade livre para novas iniciativas no ciclo, já descontada a continuidade de E02, E03, E05 e E06, antes da reserva';
  const CAP = (nivelOrganizacional, referenciaId, capacidadeDisponivel) => ({ id:'CAP-' + referenciaId, periodo:'2027-01-01', nivelOrganizacional, referenciaId, capacidadeDisponivel,
    unidade:'FTE', fonte:'premissa ilustrativa', metodo:METODO, usoNaTrilha: nivelOrganizacional === 'GERENCIA' ? 'RESTRICAO' : 'INFORMATIVO' });
  const capacidades = T([
    CAP('GERENCIA','FEL',1.5), CAP('GERENCIA','FEN',3.5), CAP('GERENCIA','FER',4.0), CAP('GERENCIA','FEG',1.0),
    CAP('COMUNIDADE','TEM',1.0), CAP('COMUNIDADE','RP',0.5), CAP('COMUNIDADE','PPE',3.5), CAP('COMUNIDADE','HID',2.0), CAP('COMUNIDADE','GRV',2.0),
    CAP('COMUNIDADE','CRG',0.0), CAP('COMUNIDADE','PEN',1.0), CAP('COMUNIDADE','PEL',0), CAP('COMUNIDADE','ACO',0), CAP('COMUNIDADE','PLA',0),
  ]);
  const demandasCapacidade = T([
    ...[['P01',3.0],['P02',2.5],['P03',1.0],['P04',1.5],['P05',4.0],['P06',2.0],['P07',1.0],['P08',2.0]]
      .map(([id, v]) => ({ id:'DCAP-' + id, iniciativaId:id, periodo:'2027-01-01', capacidadeRequerida:v, unidade:'FTE', fonte:'estimativa da squad: ordem de grandeza' })),
    { id:'DCAP-H01', iniciativaId:'H01', periodo:'2027-01-01', capacidadeRequerida:880, unidade:'HORAS', fonte:'estimativa do líder técnico' },
  ]);

  /* ------------------------------------------------ riscos e dependências (§4.9, §4.10) */
  const RI = (id, iniciativaId, natureza, descricao, acao, status, prazo, responsavel, impacto, registradoEm) =>
    ({ id, iniciativaId, natureza, descricao, impacto, responsavel, acao, status, prazo, probabilidade:null, impactoNota:null, registradoEm });
  const RK = (iniciativaId, descricao, probabilidade, impactoNota, acao) =>
    ({ id:'RK-' + iniciativaId, iniciativaId, natureza:'RISCO', descricao, impacto:'execução da candidata', responsavel:'PO da squad (papel fictício)', acao, status:'ABERTO', prazo:null, probabilidade, impactoNota, registradoEm:'2026-08-28' });
  const riscosImpedimentos = T([
    RI('R1','E02','RISCO','Escopo do módulo cresceu sem revisão da baseline (aberto em 20/09)','Revisar escopo e baseline','ABERTO','2026-10-20','PO PPE-C (papel fictício)','prazo e custo','2026-09-20'),
    RI('R2','E05','IMPEDIMENTO','Atraso na entrega de servidores pelo fornecedor Alfa','Escalar ao fornecedor e à gerência','ABERTO','2026-09-30','PO PPE-A (papel fictício)','prazo','2026-08-15'),
    RI('R3','E05','RISCO','Janela de manutenção conflita com as rodadas mensais','Replanejar a janela','EM TRATAMENTO','2026-11-15','PO PPE-A (papel fictício)','prazo','2026-08-20'),
    RI('R4','E03','RISCO','Interpretação do requisito fictício R-00 em discussão','Reunião com a área usuária','ABERTO','2026-12-15','PO HID-A (papel fictício)','escopo','2026-07-10'),
    RI('R5','E01','RISCO','Perda de desempenho em casos grandes','Otimização aplicada','RESOLVIDO',null,'PO RP-D (papel fictício)','desempenho','2026-04-02'),
    RI('R6','E06','IMPEDIMENTO','Acesso à base corporativa pendente','Solicitar liberação',null,'2026-10-15','PO CRG-A (papel fictício)','prazo','2026-08-25'),
    RI('R7','E04','RISCO','Biblioteca de visualização sem suporte','Substituída','FECHADO',null,'Líder técnico PEL (papel fictício)','escopo','2026-05-04'),
    RK('P01','Interpretação do requisito R-01 pode mudar o escopo',3,5,'Validar a interpretação do requisito com a área usuária antes de desenvolver'),
    RK('P02','Volume de dados e regras de transformação indefinidos',4,3,'Detalhar o escopo da migração'),
    RK('P03','Regras de validação podem gerar falsos alertas',1,2,null),
    RK('P04','Dados históricos podem ser insuficientes para treinar o modelo',4,2,'PoC com critérios de sucesso e gate de escala'),
    RK('P05','Comportamento do código legado pouco documentado; conhecido por uma só pessoa',4,4,null),
    RK('P06','Cobertura inicial de casos de teste insuficiente',2,3,null),
    RK('P07','Baixa adesão ao novo padrão documental',1,1,null),
    RK('P08','Fonte externa nova, sem contrato de dados; possível dependência de P02',4,3,'Confirmar com a equipe técnica se depende de P02; negociar acordo de dados'),
  ]);
  const dependencias = T([
    { id:'Dep1', iniciativaOrigemId:'E06', iniciativaDependenciaId:null, comunidadeDependenciaId:'PLA', tipo:'TEMPORAL', descricao:'Liberação de acesso e ambiente de integração', impacto:'prazo', responsavel:'PO CRG-A (papel fictício)', status:'ABERTA', dataEsperada:'2026-10-15', confirmada:true },
    { id:'Dep2', iniciativaOrigemId:'E02', iniciativaDependenciaId:'E05', comunidadeDependenciaId:null, tipo:'TEMPORAL', descricao:'Os relatórios dependem do novo ambiente de execução', impacto:'prazo', responsavel:'PO PPE-C (papel fictício)', status:'ABERTA', dataEsperada:'2027-01-29', confirmada:true },
    { id:'Dep3', iniciativaOrigemId:'E03', iniciativaDependenciaId:null, comunidadeDependenciaId:'PPE', tipo:'TEMPORAL', descricao:'Validação do impacto nos insumos do modelo de médio prazo', impacto:'escopo', responsavel:'PO HID-A (papel fictício)', status:'RESOLVIDA', dataEsperada:null, confirmada:true },
    { id:'Dep4', iniciativaOrigemId:'P08', iniciativaDependenciaId:'P02', comunidadeDependenciaId:null, tipo:'LOGICA', descricao:'A integração usaria a nova plataforma de dados', impacto:'viabilidade da carteira', responsavel:'PO GRV-A (papel fictício)', status:'A CONFIRMAR', dataEsperada:null, confirmada:false },
  ]);

  /* ------------------------------------------------ avaliações (§4.11) */
  const AVL = (id, iniciativaId, registradoEm, n, alinhamentoEstrategico, requisitoRegulatorioInstitucional, trl) => ({
    id, iniciativaId, registradoEm, registradoPor:'Comitê ilustrativo', notasCriterios:{ C1:n[0], C2:n[1], C3:n[2], C4:n[3], C5:n[4] }, alinhamentoEstrategico, requisitoRegulatorioInstitucional,
    criticidade:null, impacto:null, capacidade:null, dependenciasResumo:null, riscosResumo:null, trl, observacoes:'', versaoPesos:'v1', simulacao:true });
  const avaliacoes = T([
    AVL('AV-P01','P01','2026-08-28',[4,5,5,4,4],'contribui diretamente para OE-3','ofício fictício R-01/2026','n/a'),
    AVL('AV-P02','P02','2026-08-28',[3,3,2,4,3],'apoia OE-2 em parte',null,'n/a'),
    AVL('AV-P03','P03','2026-08-28',[3,4,3,4,5],'apoia OE-2 em parte',null,'n/a'),
    AVL('AV-P04','P04','2026-08-28',[4,3,2,2,2],'contribui para OE-1',null,'3→5'),
    AVL('AV-P05a','P05','2026-06-15',[3,4,3,4,3],'apoia OE-1 em parte',null,'n/a'),
    AVL('AV-P05b','P05','2026-09-18',[3,4,3,5,3],'apoia OE-1 em parte',null,'n/a'),
    AVL('AV-P06','P06','2026-08-28',[4,4,3,4,4],'contribui diretamente para OE-1',null,'n/a'),
    AVL('AV-P07','P07','2026-08-28',[2,2,2,3,5],'vínculo genérico',null,'n/a'),
    AVL('AV-P08','P08','2026-08-28',[4,4,3,3,3],'contribui diretamente para OE-2',null,'n/a'),
  ]);
  const evidenciasAvaliacao = T([
    { id:'EV-P06', iniciativaId:'P06', evidencias:{ C1:'contribui diretamente para OE-1', C2:'elimina falha recorrente de regressão em 2 modelos hidrológicos', C3:'sem data-limite; o risco cresce a cada versão', C4:'reduz risco recorrente em várias rodadas', C5:'a equipe já automatizou testes em outro modelo' } },
    { id:'EV-P03', iniciativaId:'P03', evidencias:{ C1:'apoia OE-2 em parte; é fase 2 de solução existente', C2:'melhora os dados de entrada de 2 modelos', C3:'sem data-limite; mantém retrabalho manual', C4:'reduz o risco recorrente de rodar com dado inconsistente', C5:'a fase 1 (B01) foi entregue com a mesma solução' } },
    { id:'EV-P05', iniciativaId:'P05', evidencias:{ C1:'apoia OE-1 em parte', C2:'melhoria relevante em vários processos que usam o modelo chuva-vazão', C3:'o atraso aumenta aos poucos o custo de manutenção', C4:'remove dívida técnica severa: código sem testes, conhecido por uma só pessoa', C5:'refatoração extensa, com incerteza sobre o comportamento legado' } },
  ]);

  /* ------------------------------------------------ fóruns e fotografia (§4.12) */
  const foruns = T([
    { id:'FR-SET', codigo:'FR-SET', nome:'[Simulado] Fórum de Acompanhamento de Portfólio: set/2026', tipoForum:'ACOMPANHAMENTO_PORTFOLIO', periodoReferencia:'2026-09', dataCorte:'2026-09-04', statusPreparacao:'REALIZADO', observacoes:'E05 vermelha (impedimento de servidores); E02 e E03 amarelas; D2 e D3 aguardando triagem.', pautaItens:['E05'] },
    { id:'FR-OUT', codigo:'FR-OUT', nome:'[Simulado] Fórum de Acompanhamento de Portfólio: out/2026', tipoForum:'ACOMPANHAMENTO_PORTFOLIO', periodoReferencia:'2026-10', dataCorte:'2026-10-03', statusPreparacao:'EM_PREPARACAO', observacoes:'', pautaItens:[] },
    { id:'FR-GATE', codigo:'FR-GATE', nome:'[Simulado] Sessão de gate: Ciclo Exemplo 2027', tipoForum:'SESSAO_GATE_SIMULADA', periodoReferencia:'2026-10', dataCorte:'2026-10-30', statusPreparacao:'PLANEJADO', observacoes:'', pautaItens:[] },
    { id:'FR-CICLO', codigo:'FR-CICLO', nome:'[Simulado] Planejamento do Portfólio: Ciclo Exemplo 2027', tipoForum:'PLANEJAMENTO_PORTFOLIO', periodoReferencia:'2026-11', dataCorte:'2026-11-16', statusPreparacao:'PLANEJADO', observacoes:'', pautaItens:[] },
  ]);
  /* SN-SET: indicadoresJson e iniciativasJson = PF.calc.indicadoresFotografia(PF.calc.estadoEm(PF.base,'2026-09-04')) (o teste unitário
     confere campo a campo); decisoesPendentesJson é o texto literal da §4.12; hashConteudo = PF.hash do conteúdo. */
  const snSet = {
    indicadoresJson:{ dataReferencia:'2026-09-04', emExecucao:6, pctVermelhoContagem:0.1667, pctOrcamentoVermelho:0.2121, riscosAbertos:4, dependenciasAbertas:2, divergencias:0, cpiPortfolio:0.878 },
    iniciativasJson:[
      { id:'E01', sinal:'VERDE', ragDeclarado:'VERDE', desvioMeses:0, indice:1.12, fisico:70, ac:0.5, bac:0.8, dataPrevistaAtual:'2026-12-18' },
      { id:'E02', sinal:'AMARELO', ragDeclarado:'AMARELO', desvioMeses:2, indice:0.9, fisico:45, ac:0.75, bac:1.5, dataPrevistaAtual:'2027-01-29' },
      { id:'E03', sinal:'AMARELO', ragDeclarado:'AMARELO', desvioMeses:1, indice:1, fisico:45, ac:0.9, bac:2, dataPrevistaAtual:'2027-03-31' },
      { id:'E04', sinal:'VERDE', ragDeclarado:'VERDE', desvioMeses:0, indice:1.125, fisico:30, ac:0.08, bac:0.3, dataPrevistaAtual:'2026-12-01' },
      { id:'E05', sinal:'VERMELHO', ragDeclarado:'VERMELHO', desvioMeses:3, indice:0.6462, fisico:60, ac:1.3, bac:1.4, dataPrevistaAtual:'2027-01-29' },
      { id:'E06', sinal:'CINZA', ragDeclarado:null, desvioMeses:null, indice:1.05, fisico:35, ac:0.2, bac:0.6, dataPrevistaAtual:'2027-04-30' },
    ],
    decisoesPendentesJson:['D2 e D3 aguardando triagem'],
    filtrosJson:{ fase:'EM_EXECUCAO' },
  };
  const snapshotsForum = T([ Object.assign({ id:'SN-SET', forumId:'FR-SET', geradoEm:'2026-09-04', versao:1, status:'FECHADO', versaoPesos:'v1', simulacao:true }, snSet, { hashConteudo: fnv(snSet) }) ]);

  /* ------------------------------------------------ decisões e histórico semente (§4.13, §4.14) */
  const DEC = o => Object.assign({ forumId:null, tipoRitoForum:null, recomendacao:true, condicionantes:null, proximaRevisao:null, gatilhoReativacao:null, versaoPesos:null, cenarioId:null,
    custosRestricao:[], classeRecomendacao:null, refDecisaoAnteriorId:null, tipoDecisaoCorrigido:null, preMortem:null, usouAjuda:false, simulacao:true,
    usuarioId:'Semente ilustrativa', registradoEm: o.decididoEm + 'T12:00:00Z' }, o);
  const PMO = 'Analista: Gestão de Portfólio/PMO';
  const decisoes = T([
    DEC({ id:'DEC-001', decididoEm:'2026-03-31', iniciativaId:'B01', tipoDecisao:'ENCERRAR', tipoRitoForum:'ACOMPANHAMENTO_PORTFOLIO', decisao:'Entregue; medir o benefício por 12 meses',
      justificativa:'Entrega concluída na baseline; benefícios BEN-01 e BEN-02 passam a ser medidos.', responsavel:'Analista de Governança e Portfólio (papel)', papelRegistrante:PMO, instancia:'[Simulado] Fórum de Acompanhamento de Portfólio' }),
    DEC({ id:'DEC-002', decididoEm:'2026-04-15', iniciativaId:'H01', tipoDecisao:'GATE2_PAUSA_FORMAL', recomendacao:false,
      decisao:'Alinhada às rotas, mas com impedimento conjuntural: falta base de casos EMT validada. Gatilho: base validada e 1 FTE de modeleiro EMT disponível',
      justificativa:'Padrão Gate 2 (s189, proposta): pausa formal com gatilho objetivo de reativação.', responsavel:'Líder técnico PEL (papel)', papelRegistrante:'Líder técnico PEL (R)', instancia:'Inovação (s196, proposta)',
      gatilhoReativacao:'Base de casos EMT validada e 1 FTE de modeleiro EMT disponível' }),
    DEC({ id:'DEC-003', decididoEm:'2026-06-10', iniciativaId:'X01', tipoDecisao:'KILL', decisao:'Melhoria cosmética em ferramenta legado sem investimento estruturante (s231–s235, proposta)',
      justificativa:'Ferramenta legado (HARMZS) sem investimento estruturante; benefício cosmético.', responsavel:'Gerente FEL (papel)', papelRegistrante:PMO, instancia:'Gerente FEL' }),
    DEC({ id:'DEC-004', decididoEm:'2026-09-04', iniciativaId:'E05', tipoDecisao:'REPLANEJAR', forumId:'FR-SET', tipoRitoForum:'ACOMPANHAMENTO_PORTFOLIO', recomendacao:false,
      decisao:'Nova baseline de E05 (29/01/2027) aprovada', justificativa:'Atraso de servidores do fornecedor Alfa.', responsavel:'Analista de Governança e Portfólio', papelRegistrante:PMO, instancia:'Analista de Governança e Portfólio' }),
    DEC({ id:'DEC-005', decididoEm:'2026-09-06', iniciativaId:'E05', tipoDecisao:'CORRECAO_REGISTRO', refDecisaoAnteriorId:'DEC-004', tipoDecisaoCorrigido:'REPLANEJAR', forumId:'FR-SET', tipoRitoForum:'ACOMPANHAMENTO_PORTFOLIO',
      decisao:'Recomendação registrada pela analista; aprovação da baseline cabe à instância (a validar: [Simulado] Fórum de Acompanhamento coordenado pela FEG, s129, ou gerência responsável). Baseline vigente: 30/10/2026',
      justificativa:'A analista recomenda; não aprova baseline. Correção como novo registro.', responsavel:'Analista de Governança e Portfólio (papel)', papelRegistrante:PMO, instancia:'Instância a validar: [Simulado] Fórum de Acompanhamento (FEG coordena, s129) ou gerência responsável' }),
  ]);
  const HS = (id, alteradoEm, entidade, entidadeId, campoAlterado, valorAnterior, valorNovo, justificativa) => ({ id, alteradoEm, entidade, entidadeId,
    operacao: campoAlterado ? 'ALTERACAO' : 'INSERCAO', campoAlterado, valorAnterior, valorNovo, usuarioId:'Analista (perfil ilustrativo)', origemAlteracao:'SEMENTE_ILUSTRATIVA', justificativa });
  const historico = T([
    HS('HS-01','2026-06-10','iniciativas','X01','ativo',true,false,'KILL DEC-003'),
    HS('HS-02','2026-09-18','avaliacoes','AV-P05b',null,null,null,'Reavaliação de C4 após diagnóstico da equipe'),
    HS('HS-03','2026-09-20','iniciativas','E02','dataPrevistaAtual','2027-01-29','2027-03-26','Replanejamento informado pelo PO'),
    HS('HS-04','2026-09-20','riscosImpedimentos','R1',null,null,null,'Escopo cresceu'),
    HS('HS-05','2026-09-28','iniciativas','E02','ragDeclarado','AMARELO','VERDE',''),
    HS('HS-06','2026-09-30','iniciativas','E02','percentualFisicoReal',45,50,'Consolidação mensal'),
    HS('HS-07','2026-09-30','financeiro','FIN-E02','realizado',0.75,1.20,'Consolidação mensal'),
  ]);

  /* ------------------------------------------------ benefícios (§4.15) e cronograma (§4.16) */
  const BEN = o => Object.assign({ dono:'Área usuária (papel fictício)', fonteDado:'log de execução fictício', dataBase:'2026-03-31', dataMeta:'2027-03-31', proposto:false, mesmoKpiDe:null }, o);
  const beneficios = T([
    BEN({ id:'BEN-01', iniciativaId:'B01', kpi:'% de lotes de entrada do modelo energético validados automaticamente', unidade:'%', sentido:'MAIOR_MELHOR', linhaBase:60, meta:90 }),
    BEN({ id:'BEN-02', iniciativaId:'B01', kpi:'Horas médias de preparação manual de lotes por rodada', unidade:'horas', sentido:'MENOR_MELHOR', linhaBase:40, meta:20 }),
    BEN({ id:'BEN-03', iniciativaId:'P03', kpi:'% de lotes de entrada validados automaticamente (fase 2, modelos de médio e curto prazo)', unidade:'%', sentido:'MAIOR_MELHOR', linhaBase:60, meta:95,
      dataBase:null, dataMeta:null, proposto:true, mesmoKpiDe:'BEN-01' }),
  ]);
  const medicoesBeneficio = T([
    { id:'MB-01-3', beneficioId:'BEN-01', data:'2026-06-30', mes:3, planejado:67.5, realizado:70, simulacao:false },
    { id:'MB-01-6', beneficioId:'BEN-01', data:'2026-09-30', mes:6, planejado:75, realizado:78, simulacao:false },
    { id:'MB-02-3', beneficioId:'BEN-02', data:'2026-06-30', mes:3, planejado:35, realizado:39, simulacao:false },
    { id:'MB-02-6', beneficioId:'BEN-02', data:'2026-09-30', mes:6, planejado:30, realizado:36, simulacao:false },
  ]);
  const atividadesCronograma = T([
    { id:'A', iniciativaId:'P06', nome:'Automatizar testes de regressão', duracaoMeses:4, predecessoras:[] },
    { id:'B', iniciativaId:'P05', nome:'Refatorar o código legado (testar antes de refatorar)', duracaoMeses:8, predecessoras:['A'] },
    { id:'C', iniciativaId:'P02', nome:'Migrar o repositório hidrometeorológico', duracaoMeses:6, predecessoras:[] },
    { id:'D', iniciativaId:'P08', nome:'Integrar novas fontes meteorológicas', duracaoMeses:5, predecessoras:['C'] },
    { id:'M', iniciativaId:null, nome:'Marco "Nova versão integrada"', duracaoMeses:0, predecessoras:['B','D'] },
  ].map(a => Object.assign(a, { programa:'Programa da cadeia hidrometeorológica (marcos, não tarefas)' })));

  /* ------------------------------------------------ cenários (§4.17) */
  const P09 = { id:'P09', titulo:'D2 qualificada: adequação ao requisito fictício R-02 (premissa do cenário C5)', fte:2.0, custo:0.6, categoria:'OBRIGATORIA', gerenciaId:'FER', comunidadeId:'HID',
    obrigatoria:true, notas:null, N:0, R:0, horizonteInovacao:'H1', ferramentaId:'GEVAZP', pessoasChave:[], naoPontuada:true };
  const CEN = (id, nome, mudanca, premissas, gatilho, usoRobustez) => ({ id, nome, mudanca, premissas, gatilho, usoRobustez, origemRegra:AV, criadoPor:'Semente da trilha (ilustrativa)' });
  const cenarios = T([
    CEN('C0','Base','—',{},'—',true),
    CEN('C1','Dependência','P08 ⇒ P02',{ deps:[['P08','P02']] },'Confirmação técnica de Dep4',true),
    CEN('C2','Capacidade −2','8 FTE',{ cap:8 },'2 FTE realocados para demanda emergencial',true),
    CEN('C3','Pesos','w4 = 40% (os demais renormalizados)',{ pesos:{ C4:0.40 } },'Fórum decide valorizar redução de risco',true),
    CEN('C4','Mix','D ≤ 15 pp',{ maxD:0.15 },'Política de mix aprovada (s127)',true),
    CEN('C5','Nova obrigatória','P09 = D2 qualificada: re-estimativa bottom-up da squad em 2,0 FTE (1,0 de modeleiro + 1,0 de desenvolvedor por 12 meses) e R$ 0,6 mi. Coincidir com 3.200 h ÷ 1.600 h não valida um fator geral; R25 continua null',
      { extras:[P09], obrig:['P01','P09'] },'Evidência documental do requisito R-02 anexada',true),
    CEN('C6','Pessimista','C1 + C2',{ deps:[['P08','P02']], cap:8 },'Os dois gatilhos (C1 e C2)',true),
    CEN('C7','Capacidade local','Capacidade por gerência (R24)',{ gcap:true },'Gerentes de Área não cedem FTE entre gerências',false),
    CEN('C8','Reserva','8,5 FTE (reserva de 15%, s166)',{ reserva:0.15 },'Adoção da reserva',false),
  ]);

  /* ------------------------------------------------ RACI (§4.18) e armadilhas (§4.19) */
  const RC = (atividade, leitura, fonte, extra={}) => Object.assign({ atividade, leitura, fonte, origemRegra:AV, tipoFonte:PROP, regra:'R38',
    referencia: DECK(fonte) + '; reconstrução a partir do texto extraído; conferir no slide original' }, extra);
  const raci = T([
    RC('Registro e triagem de demanda','PO R · PMO I','s143'),
    RC('Redirecionamento / despriorização','PO R · PMO I','s143'),
    RC('Encaminhar a escopo exploratório','PO R · PMO C','s143'),
    RC('Arquivar com justificativa','PO R · PMO I','s143'),
    RC('Avaliação de esforço e capacidade','PO R · Líder A · PMO C','s143'),
    RC('Avaliação de priorização (gate da squad)','PO R/A · PMO C','s143'),
    RC('Priorização de demanda de monitoramento/sustentação','PO R · PMO A (conflito com s143: R33)','s149', { conflito:'R33' }),
    RC('Aprovação para implantação','PO R · Líder A · PMO C','s147'),
    RC('Inserir iniciativa de inovação no portfólio','Líder da Comunidade Técnica R · PMO I','s196'),
    RC('Decidir produção','Líder de Entrega A','s196'),
    RC('Identificar e escalar impedimentos, conflitos de prioridade e dependências críticas','Atribuição do Analista de Governança e Portfólio','s74'),
    RC('Escalonamento e replanejamento','Fórum de Acompanhamento (FEG coordena) "avalia e propõe"','s129'),
    RC('Arbitrar conflito de prioridade','Gerente Executivo FE','s71'),
    RC('Aprovar o portfólio do ciclo','Fórum de Planejamento do Portfólio (FEG coordena); tomadores de decisão no s205: Diretores/GEs. Deliberação a validar','s127, s205'),
    RC('Priorizar demandas do escopo do CT PMO-PLD','Rascunho de revisão · a validar: o comentário sugere a Comissão Gestora do CT; o slide diz que a FEG executa e operacionaliza o backlog (s63)','comentário de revisão; s63',
      { tipoFonte:REV, regra:'R34', referencia:'Rascunho de revisão do deck v25 (comentário); s63' }),
  ].map((r, i) => Object.assign({ id:'RACI-' + String(i+1).padStart(2,'0') }, r)));
  const AR = (armadilha, onde, licao, niveis) => ({ armadilha, onde, licao, niveis });
  const armadilhas = T([
    AR('Status melancia','E02: declarado Verde (mudado sem justificativa); calculado Vermelho; previsão 1,50 × EAC 2,40','Comparar com referência e registrar a divergência',[1,2]),
    AR('Sem baseline','E06','Cinza não é Verde',[1]),
    AR('Sem objetivo','E04','Abrir pendência, não inventar vínculo',[1]),
    AR('Status fora do catálogo ou vazio','R3 "EM TRATAMENTO", R6 vazio','O que não está fechado está aberto',[1]),
    AR('Prazo vencido','R2','Escalar a causa raiz',[1]),
    AR('Bloqueio em cadeia','Dep2: E05 (vermelha) bloqueia E02','Escalar E05 primeiro',[1]),
    AR('Registro bagunçado','H01: previsão vencida, financeiro sem fonte, 880 h','SOURCE_REQUIRED, INCOMPATIBLE_UNIT',[1,2]),
    AR('Arquivada escondida','X01','Arquivar não é apagar',[1]),
    AR('Cinco saídas de triagem','D1–D5','Cada saída tem um critério',[1]),
    AR('Estimativa em horas','D2 (3.200 h)','Não converter sem método validado',[1,3]),
    AR('Registro com papel errado','DEC-004 → DEC-005','Correção é novo registro; a analista recomenda',[1]),
    AR('Empate criado por reavaliação','P05 × P08 (63,75)','O desempate muda a carteira, não o valor',[2]),
    AR('Possível habilitadora com valor baixo','P02','Questionar não é matar',[2,3]),
    AR('Ostra sem mitigação','P05 (R 16, acao vazia)','Recycle em fases',[2]),
    AR('Matrizes diferentes','P08 é "fazer primeiro" em V×E e "ostra" em V×R','As matrizes respondem a perguntas diferentes',[2]),
    AR('Dupla contagem de critério','C5 × P×I','Independência dos critérios',[2]),
    AR('Ótimo sem sustentação','C0 com D = 30 pp','Diagnóstico de mix',[2]),
    AR('Sobrecarga local','C0: FEN 114%, FEG 150%, FEL 0%','O agregado esconde o local; FTE não é fungível',[3]),
    AR('Dependência a confirmar','P08 ⇒ P02','Carteira possivelmente inviável',[3]),
    AR('Política documental (s168)','P07','Política vira restrição com custo',[3]),
    AR('Pessoa-chave','K em 5 das 8 candidatas','Risco sistêmico',[3]),
    AR('Linha de base de benefício','P03 propõe 60% (deveria ser 78%)','Dupla contagem de benefício',[3]),
    AR('KPI "menor é melhor"','BEN-02','A fórmula funciona nos dois sentidos',[3]),
  ].map((a, i) => Object.assign({ id:'ARM-' + String(i+1).padStart(2,'0') }, a)));

  /* ------------------------------------------------ AHP (§7.4; aprofundamento) */
  const ahpExemplos = T([
    { id:'M1', nome:'M1 · 3×3 consistente', criterios:['C1','C2','C4'], matriz:[[1,1/2,2],[2,1,3],[1/2,1/3,1]] },
    { id:'M2', nome:'M2 · 3×3 com ciclo (C1 > C2 > C4 > C1)', criterios:['C1','C2','C4'], matriz:[[1,3,1/2],[1/3,1,3],[2,1/3,1]] },
    { id:'EQUIPE', nome:'Matriz da equipe 5×5', criterios:['C1','C2','C3','C4','C5'], matriz:[[1,2,2,3,3],[1/2,1,1,2,3],[1/2,1,1,2,2],[1/3,1/2,1/2,1,2],[1/3,1/3,1/2,1/2,1]] },
  ]);

  PF.base = {
    versao:1, ilustrativo:true, origemDado:ORIG, dataReferencia:'2026-10-03', versaoParametros:'v1',
    regras, gerencias, comunidades, squads, ferramentas, statusConfiguracao, categorias, catalogos, ciclos, fornecedores, objetivosEstrategicos,
    iniciativas, financeiro, capacidades, demandasCapacidade, riscosImpedimentos, dependencias, avaliacoes, evidenciasAvaliacao,
    foruns, snapshotsForum, decisoes, historico, pendencias:[], beneficios, medicoesBeneficio, atividadesCronograma, cenarios, raci, armadilhas, ahpExemplos,
  };
})();
