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
  /** Cores dos quadrantes = tokens de design.css (--ons, --slate, --teal, --copper). O âmbar fica reservado a pendência. */
  const QUADRANTES = {
    rapido:     { nome:'Ganho rápido', desc:'Alto valor e baixo esforço: fazer primeiro.', cor:'#3E6801' },
    estrategico:{ nome:'Estratégico', desc:'Alto valor e alto esforço: planejar e fatiar.', cor:'#477b91' },
    complementar:{ nome:'Complementar', desc:'Baixo valor e baixo esforço: encaixar se sobrar capacidade.', cor:'#188787' },
    repensar:   { nome:'Repensar', desc:'Baixo valor e alto esforço: questionar antes de fazer.', cor:'#ac7044' },
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
  /**
   * "Por que esta nota?": contribuição de cada pergunta, com a mesma normalização de notaEixo.
   * Retorna [{id, nome, eixo, peso, resp, pontos, max}] (pontos e max em pontos da nota 0-100 do eixo; resp null = sem resposta).
   * Aceita um projeto ({avaliacao:{respostas}}) ou o próprio objeto de respostas em {respostas}.
   */
  function decompor(p, crit = criterios(), eixo){
    const resp = (p && p.avaliacao && p.avaliacao.respostas) || (p && p.respostas) || {};
    const tot = { valor:0, esforco:0 }; crit.forEach(c => { if(c.peso > 0) tot[c.eixo] += c.peso; });
    return crit.filter(c => c.peso > 0 && (!eixo || c.eixo === eixo)).map(c => {
      const max = tot[c.eixo] ? c.peso / tot[c.eixo] * 100 : 0, r = resp[c.id] == null ? null : +resp[c.id];
      return { id:c.id, nome:c.nome, eixo:c.eixo, peso:c.peso, resp:r, pontos: r == null ? 0 : r / 3 * max, max };
    });
  }
  /** Priorizáveis (ETAPAS_PRIORIZAVEIS) sem pontuação completa: a fila de avaliação. Ordem: aprovados, em execução, em espera, em triagem; depois código. */
  function pendentesAvaliacao(lista = (GP.state() && GP.state().projetos) || [], crit = criterios()){
    return lista.filter(p => ETAPAS_PRIORIZAVEIS.includes(p.etapa) && !pontuar(p, crit).completo)
      .sort((a, b) => ETAPAS_PRIORIZAVEIS.indexOf(a.etapa) - ETAPAS_PRIORIZAVEIS.indexOf(b.etapa) || String(a.codigo).localeCompare(String(b.codigo)));
  }

  /* --------------------------------------------- capacidade e carteira (nível 3) */
  /** periodo é o rótulo legível ('2027' ou 'jul/2026 a jun/2027'), mantido por compatibilidade; o cálculo usa periodoIni e periodoFim (AAAA-MM). */
  const CAPACIDADE_PADRAO = { periodo:'2027', periodoIni:'2027-01', periodoFim:'2027-12', fte:10, reservaPct:15, orcamento:4000000, descontarExecucao:true };
  const MES_RE = /^(\d{4})-(0[1-9]|1[0-2])$/, MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], MAX_PERIODO = 60;
  const mesIdx = s => +String(s).slice(0, 4) * 12 + (+String(s).slice(5, 7) - 1);
  const deIdx = i => `${Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`;
  const rotuloMes = s => `${MESES_CURTOS[+s.slice(5, 7) - 1]}/${s.slice(0, 4)}`;
  const rotuloPeriodo = (ini, fim) => ini.slice(5) === '01' && fim.slice(5) === '12' ? (ini.slice(0, 4) === fim.slice(0, 4) ? ini.slice(0, 4) : `${ini.slice(0, 4)} a ${fim.slice(0, 4)}`) : `${rotuloMes(ini)} a ${rotuloMes(fim)}`;
  /**
   * Período da capacidade {ini, fim, rotulo}. Usa periodoIni/periodoFim (AAAA-MM); sem eles, lê o texto antigo 'periodo'
   * ('2027' → jan a dez/2027; '2026-2027' → jan/2026 a dez/2027). Texto sem ano válido → ano corrente. Limite de 60 meses.
   */
  function periodoCap(cap = {}){
    let ini = MES_RE.test(cap.periodoIni) ? cap.periodoIni : '', fim = MES_RE.test(cap.periodoFim) ? cap.periodoFim : '';
    if(!ini && !fim){
      if(cap.periodo == null || cap.periodo === ''){ ini = CAPACIDADE_PADRAO.periodoIni; fim = CAPACIDADE_PADRAO.periodoFim; }
      else { const anos = (String(cap.periodo).match(/\d{4}/g) || []).map(Number).filter(a => a >= 2000 && a <= 2100).sort((a, b) => a - b);
        const a0 = anos.length ? anos[0] : new Date().getFullYear(), a1 = anos.length ? anos[anos.length - 1] : a0; ini = `${a0}-01`; fim = `${a1}-12`; }
    }
    if(!ini) ini = fim.slice(0, 4) + '-01';
    if(!fim) fim = ini.slice(0, 4) + '-12';
    if(mesIdx(fim) < mesIdx(ini)) [ini, fim] = [fim, ini];
    if(mesIdx(fim) - mesIdx(ini) + 1 > MAX_PERIODO) fim = deIdx(mesIdx(ini) + MAX_PERIODO - 1);
    return { ini, fim, rotulo: rotuloPeriodo(ini, fim) };
  }
  /* DENTRO: na carteira (ocupa capacidade). CABE: na carteira sem estourar; fixado_estoura está na carteira mas NÃO cabe. */
  const DENTRO = ['cabe', 'fixado', 'fixado_estoura'], CABE = ['cabe', 'fixado'], FORA = ['nao_cabe', 'cabe_a_partir', 'obrigatorio_deslocado'];
  /**
   * Monta a carteira que cabe, mês a mês, dentro do período da capacidade. É a ÚNICA fonte das respostas sobre capacidade:
   * carteira, pauta, painel, roadmap, sinais de risco e indicadores leem os números daqui.
   * - Capacidade efetiva = FTE × (1 − reserva). Em execução (se descontarExecucao) ocupa os meses das suas datas previstas.
   * - Percorre o ranking dos aprovados (fixados pelo comitê primeiro). Um projeto cabe se, em todos os meses da sua duração
   *   dentro do período, a demanda acumulada continuar ≤ capacidade efetiva, e se o orçamento acumulado couber.
   * - Projeto sem datas ocupa o período inteiro. Projeto inteiramente fora do período fica como 'fora_periodo'.
   * - Quem fica de fora é medido contra a carteira FINAL (acumFte = pico se entrasse; falta = quanto passa da capacidade),
   *   e 'cabe_a_partir' (aPartir, AAAA-MM) só é dado se couber junto com a carteira e com os adiados de maior prioridade.
   * - 'obrigatorio_deslocado': obrigatório que caberia sem as fixações do comitê.
   * forcar: {id:'in'|'out'} - decisão manual do comitê (fixar ou excluir).
   * Números do período (todos no MESMO mês de pico da carteira selecionada = execução + quem entrou):
   *   pico {mes, total, execucao, carteira}; comprometido = execução nesse mês; livre = efetiva − comprometido (pessoas para novos);
   *   usadoFte = carteira nesse mês; sobraFte = efetiva − total. execucaoMax/folgaMin = mês mais carregado só pela execução;
   *   excesso = quanto a execução sozinha passa da capacidade. cabem = cabe + fixado (sem os fixados que estouram, contados em estouram).
   * demanda[k] = {mes, execucao, carteira, total, aguardando, planejada}: aguardando = quem ficou de fora, nas datas previstas;
   *   planejada = total + aguardando (a demanda se todos os aprovados começarem como planejado). picoPlanejado idem.
   */
  function montarCarteira(lista, cap = CAPACIDADE_PADRAO, forcar = {}, crit){
    forcar = forcar || {}; cap = cap || CAPACIDADE_PADRAO;
    const per = periodoCap(cap), i0 = mesIdx(per.ini), n = mesIdx(per.fim) - i0 + 1;
    const meses = Array.from({ length:n }, (_, k) => deIdx(i0 + k));
    const efetiva = Math.max(0, +cap.fte || 0) * (1 - Math.min(60, Math.max(0, +cap.reservaPct || 0)) / 100);
    const janela = p => janelaCap(p, i0, n);
    const exec = new Array(n).fill(0), semDatas = [];
    if(cap.descontarExecucao) lista.filter(p => p.etapa === 'execucao').forEach(p => { const j = janela(p); if(j && p.esforcoFte){ if(j.semDatas) semDatas.push(p); for(let k = j.a; k <= j.b; k++) exec[k] += +p.esforcoFte; } });
    const pico = v => { let m = -Infinity, k0 = 0; v.forEach((x, k) => { if(x > m + 1e-9){ m = x; k0 = k; } }); return { k:k0, v:Math.max(0, m) }; };
    const pkExec = pico(exec), execucaoMax = pkExec.v;
    const excesso = Math.max(0, execucaoMax - efetiva), orc = +cap.orcamento || 0;
    const rk = ranking(lista.filter(p => p.etapa === 'aprovado'), {}, crit);
    const cabeEm = (v, a, b, f) => { for(let k = a; k <= b; k++) if(v[k] + f > efetiva + 1e-9) return false; return true; };
    const encaixar = usarFixos => {
      const dem = exec.slice(), cart = new Array(n).fill(0); let custo = 0;
      const fixo = x => usarFixos && forcar[x.p.id] === 'in';
      const ordem = [...rk.filter(fixo), ...rk.filter(x => !fixo(x))];   // fixados entram primeiro, na ordem do ranking
      const jan = new Map();
      const itens = ordem.map(x => {
        const p = x.p, f = p.esforcoFte, c = p.custo || 0, j = f == null ? null : janela(p); let status, falta = null, aPartir = null, acumFte = null, picoMes = null;
        if(forcar[p.id] === 'out') status = 'excluido';
        else if(f == null) status = 'sem_estimativa';
        else if(!j) status = 'fora_periodo';
        else {
          const okF = cabeEm(dem, j.a, j.b, f), okO = !orc || custo + c <= orc + 1e-9;
          if(fixo(x)) status = okF && okO ? 'fixado' : 'fixado_estoura';
          else if(okF && okO) status = 'cabe';
          else { status = 'nao_cabe'; falta = { tipo: okF ? 'R$' : 'FTE', valor:0, orcOk:okO }; }
          if(DENTRO.includes(status)){
            for(let k = j.a; k <= j.b; k++){ dem[k] += f; cart[k] += f; } custo += c;
            const pk = pico(dem); acumFte = pk.v; picoMes = meses[pk.k];   // pico real da carteira até aqui (só cresce)
          }
        }
        const it = Object.assign({}, x, { status, falta, aPartir, fixado:fixo(x), acumFte, picoMes, acumCusto: DENTRO.includes(status) ? custo : null });
        if(j) jan.set(it, j); return it;
      });
      // quem ficou de fora: medido contra a carteira final; "cabe a partir de" considera os adiados de maior prioridade
      const adiados = dem.slice();
      itens.filter(it => it.status === 'nao_cabe').forEach(it => {
        const j = jan.get(it), f = it.p.esforcoFte, c = it.p.custo || 0;
        const pk = pico(dem.map((v, k) => k >= j.a && k <= j.b ? v + f : v)); it.acumFte = pk.v; it.picoMes = meses[pk.k]; it.acumCusto = custo + c;
        if(it.falta.tipo === 'R$'){ it.falta = { tipo:'R$', valor:custo + c - orc }; return; }
        let m = 0, km = j.a; for(let k = j.a; k <= j.b; k++) if(dem[k] + f - efetiva > m + 1e-9){ m = dem[k] + f - efetiva; km = k; }
        const orcOk = it.falta.orcOk; it.falta = { tipo:'FTE', valor:m, mes:meses[km] };
        if(orcOk && !j.semDatas) for(let s = Math.max(0, j.a0 + 1); s < n; s++){ const b = Math.min(n - 1, s + j.dur - 1);
          if(cabeEm(adiados, s, b, f)){ it.aPartir = meses[s]; it.status = 'cabe_a_partir'; for(let k = s; k <= b; k++) adiados[k] += f; break; } }
      });
      return { itens, dem, cart, custo, jan };
    };
    const r = encaixar(true); let deslocados = [];
    if(rk.some(x => forcar[x.p.id] === 'in')){
      const sem = new Set(encaixar(false).itens.filter(i => DENTRO.includes(i.status)).map(i => i.p.id));
      deslocados = r.itens.filter(i => FORA.includes(i.status) && sem.has(i.p.id));
      deslocados.forEach(i => { if(i.p.obrigatorio) i.status = 'obrigatorio_deslocado'; });
    }
    const agu = new Array(n).fill(0);
    r.itens.filter(i => FORA.includes(i.status)).forEach(i => { const j = r.jan.get(i); for(let k = j.a; k <= j.b; k++) agu[k] += i.p.esforcoFte; });
    const pk = pico(r.dem), dentro = r.itens.filter(i => DENTRO.includes(i.status)), cabem = r.itens.filter(i => CABE.includes(i.status)).length;
    const usadoFte = r.cart[pk.k] || 0, picoTotal = r.dem[pk.k] || 0, comprometido = exec[pk.k] || 0;
    const planejada = r.dem.map((v, k) => v + agu[k]), pkP = pico(planejada);
    // mês mais carregado só pela execução (primeira sequência de meses no máximo)
    let ateK = pkExec.k; while(ateK + 1 < n && Math.abs(exec[ateK + 1] - execucaoMax) < 1e-9) ateK++;
    const barra = r.itens.find(i => i.falta && FORA.includes(i.status));
    r.itens.forEach(i => { if(i.falta) delete i.falta.orcOk; });
    dentro.forEach(i => { const j = r.jan.get(i); if(j && j.semDatas) semDatas.push(i.p); });
    return { periodo:{ ini:per.ini, fim:per.fim, rotulo:per.rotulo, meses }, efetiva, descontarExecucao: !!cap.descontarExecucao,
      comprometido, livre: Math.max(0, efetiva - comprometido), execucaoMax, excesso, folgaMin:{ valor: Math.max(0, efetiva - execucaoMax), de: meses[pkExec.k], ate: meses[ateK] },
      orcamento: orc, usadoFte, usadoCusto: r.custo, sobraFte: efetiva - picoTotal, sobraOrc: orc - r.custo,
      pico:{ mes:meses[pk.k], total:picoTotal, execucao:comprometido, carteira:usadoFte },
      picoPlanejado:{ mes:meses[pkP.k], total:planejada[pkP.k] || 0 },
      demanda: meses.map((mes, k) => ({ mes, execucao:exec[k], carteira:r.cart[k], total:r.dem[k], aguardando:agu[k], planejada:planejada[k] })),
      restricao: barra ? (barra.falta.tipo === 'FTE' ? 'pessoas' : 'orcamento') : r.itens.some(i => i.status === 'fixado_estoura') ? 'pessoas' : '',
      deslocados, itens:r.itens, dentro, cabem, estouram: dentro.length - cabem, semDatas, candidatos: rk.length,
      semNota: lista.filter(p => p.etapa === 'aprovado' && !pontuar(p, crit).completo) };
  }
  /** Meses do projeto no período {a, b} (índices), a0 (início real, pode ser < 0), dur (meses), semDatas; null = fora do período. */
  function janelaCap(p, i0, n){
    const dataOk = v => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])/.test(v);
    if(!dataOk(p.inicioPrevisto) || !dataOk(p.fimPrevisto) || p.fimPrevisto < p.inicioPrevisto) return { a:0, b:n - 1, a0:0, dur:n, semDatas:true };
    const a0 = mesIdx(p.inicioPrevisto) - i0, b0 = mesIdx(p.fimPrevisto) - i0;
    if(b0 < 0 || a0 > n - 1) return null;
    return { a:Math.max(0, a0), b:Math.min(n - 1, b0), a0, dur:b0 - a0 + 1, semDatas:false };
  }
  /**
   * Pessoas por mês de uma janela qualquer (roadmap, painel), lidas da carteira c = montarCarteira(...):
   * {mes, noPeriodo, execucao, carteira, total, aguardando, planejada}. Dentro do período os números são exatamente os de c.demanda
   * (inclusive projetos sem datas, que ocupam o período inteiro); fora dele, as datas previstas dos mesmos projetos.
   * total = execução + carteira selecionada (a pergunta "a carteira cabe?"); aguardando = aprovados fora da carteira (exceto
   * excluídos pelo comitê) nas datas previstas; planejada = total + aguardando ("e se todos começarem como planejado?").
   */
  function demandaCarteira(lista, c, de, ate, max = 120){
    const i0 = mesIdx(c.periodo.ini), n = c.periodo.meses.length, st = {}; c.itens.forEach(i => { st[i.p.id] = i.status; });
    const temDatas = p => p.inicioPrevisto && p.fimPrevisto && p.fimPrevisto >= p.inicioPrevisto;
    const soma = (ps, mes) => ps.reduce((a, p) => a + (temDatas(p) && p.inicioPrevisto.slice(0, 7) <= mes && p.fimPrevisto.slice(0, 7) >= mes ? +p.esforcoFte || 0 : 0), 0);
    const exec = c.descontarExecucao ? lista.filter(p => p.etapa === 'execucao' && p.esforcoFte) : [];
    const dentro = c.dentro.map(i => i.p);
    const fora = lista.filter(p => p.etapa === 'aprovado' && p.esforcoFte != null && !DENTRO.includes(st[p.id]) && st[p.id] !== 'excluido' && st[p.id] !== 'sem_estimativa');
    const semItem = fora.filter(p => !(p.id in st));   // aprovados sem avaliação completa: não entram na conta da carteira
    const out = []; for(let k = mesIdx(de); k <= mesIdx(ate) && out.length < max; k++){
      const mes = deIdx(k), kp = k - i0;
      if(kp >= 0 && kp < n){ const d = c.demanda[kp], ag = d.aguardando + soma(semItem, mes); out.push({ mes, noPeriodo:true, execucao:d.execucao, carteira:d.carteira, total:d.total, aguardando:ag, planejada:d.total + ag }); }
      else { const e = soma(exec, mes), ca = soma(dentro, mes), ag = soma(fora, mes); out.push({ mes, noPeriodo:false, execucao:e, carteira:ca, total:e + ca, aguardando:ag, planejada:e + ca + ag }); }
    }
    return out;
  }
  /** fora: aprovado que ficou fora da carteira por capacidade (o roadmap o desenha hachurado). */
  const STATUS_CARTEIRA = {
    cabe:{ nome:'Cabe', tom:'ok' }, fixado:{ nome:'Fixado pelo comitê', tom:'ok' }, fixado_estoura:{ nome:'Fixado, mas estoura', tom:'bad', fora:true },
    nao_cabe:{ nome:'Não cabe agora', tom:'warn', fora:true }, cabe_a_partir:{ nome:'Cabe mais tarde', tom:'warn', fora:true },
    obrigatorio_deslocado:{ nome:'Obrigatório fora pelas fixações', tom:'bad', fora:true },
    excluido:{ nome:'Excluído pelo comitê', tom:'neutral' }, sem_estimativa:{ nome:'Sem estimativa de FTE', tom:'warn' }, fora_periodo:{ nome:'Fora do período', tom:'neutral' },
  };
  /** Pessoas (FTE) alocadas por mês, considerando projetos com início e fim previstos. max limita a quantidade de meses (janela do roadmap). */
  function demandaMensal(lista, de, ate, max = 120){
    const meses = []; let [y, m] = de.split('-').map(Number); const [y2, m2] = ate.split('-').map(Number);
    while((y < y2 || (y === y2 && m <= m2)) && meses.length < max){ meses.push(`${y}-${String(m).padStart(2, '0')}`); m++; if(m > 12){ m = 1; y++; } }
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
    const per = periodoCap({ periodoIni: c.periodoIni, periodoFim: c.periodoFim, periodo: typeof c.periodo === 'string' || typeof c.periodo === 'number' ? txt(c.periodo, 40) : null });   // '2027' antigo vira jan a dez/2027
    S.capacidade = { periodo: per.rotulo, periodoIni: per.ini, periodoFim: per.fim, fte: numOuNull(c.fte) ?? CAPACIDADE_PADRAO.fte, reservaPct: Math.min(60, numOuNull(c.reservaPct) ?? CAPACIDADE_PADRAO.reservaPct),
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
      registrar(p, 'Priorização', s.completo ? `Valor ${GP.util.fmt.n(s.valor, 1)} · esforço ${GP.util.fmt.n(s.esforco, 1)} · ${QUADRANTES[s.quadrante].nome}` : `Avaliação parcial (faltam ${s.faltam} ${s.faltam === 1 ? 'resposta' : 'respostas'}).`);
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

  GP.modelo = { VERSAO, CAT, ETAPAS, etapa, CAMPOS, OBRIGATORIOS, ENTRADA, RESULTADO_ENTRADA, avaliarEntrada, CRITERIOS_PADRAO, EIXOS, CORTE, QUADRANTES, ETAPAS_PRIORIZAVEIS, criterios, sugestao, notaEixo, pontuar, ranking, decompor, pendentesAvaliacao, CAPACIDADE_PADRAO, STATUS_CARTEIRA, montarCarteira, demandaMensal, demandaCarteira, estadoInicial, migrar, validar, carregarExemplos };
  GP.projetos = projetos;
})();

