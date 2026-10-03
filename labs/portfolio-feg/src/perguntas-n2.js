/* =========================================================================
   Portfólio FEG — PERGUNTAS DO NÍVEL 2 · ARRANJO · PRIORIZAÇÃO (perguntas-n2.js)
   Spec §6.6: 28 perguntas (13 conceituais, 10 de análise, 5 de decisão); 27 graduadas (N2-C13 depende de conferir a fonte).
   Roda depois de nivel2.js e anexa via PF.level(2).questions.push(...). Gabaritos de análise e decisão são calculados por
   PF.calc sobre o d recebido (PF.base, a referência congelada). Nada aqui é regra ONS; dados fictícios.
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF;
  if(!PF || !PF.level || !PF.level(2) || !PF.calc) return;
  const { esc, fmt } = PF.util, C = PF.calc, N2 = PF.n2 || {};
  const n1 = v => fmt.n(v, 1), n2 = v => fmt.n(v, 2), pc = (v, c = 1) => fmt.pct(v, c), mi = (v, c = 2) => fmt.mi(v, c);
  const sn = (v, c = 2) => v == null ? 'n/d' : (v > 1e-9 ? '+' : '') + fmt.n(v, c);
  const J = N2.J || (o => `<p><b>Resposta:</b> ${o.r}</p><p><b>Como calculei:</b> ${o.c}</p><p><b>Leitura:</b> ${o.l}</p><p><b>Cuidado:</b> ${o.k}</p><p><b>Próximo passo:</b> ${o.p}</p>`);
  const tit = (d, id) => N2.tit ? N2.tit(d, id) : id;
  const QV = (d, t, k) => N2.QV ? N2.QV(d, t, k) : k;
  const rows = d => C.linhasCandidatas(d), row = (d, id) => rows(d).find(r => r.id === id) || {};
  const opIni = (d, lista) => lista.map(r => ({ id:r.id, label:`${r.id} · ${tit(d, r.id)}` }));
  const MAP = N2.MAP_VE_VR || { FAZER_PRIMEIRO:'PEROLA', PLANEJAR:'OSTRA', COMPLEMENTAR:'PAO_COM_MANTEIGA', QUESTIONAR:'ELEFANTE_BRANCO' };
  const tab = (head, linhas) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const alt = (id, texto) => ({ id, texto });
  const COR = { VERDE:'Verde', AMARELO:'Amarelo', VERMELHO:'Vermelho', CINZA:'Cinza' }, cor = k => COR[k] || k || '—';

  /* ---------------------------------------------------------------- (a) conceituais (13; N2-C13 conferirFonte) */
  const conceituais = [
    { id:'N2-C01', titulo:'Calcular S e N', tipo:'conceito', formato:'mc', regra:'R21', conceito:'Score e normalização', ver:'#/n2/pontuacao?aba=grade',
      enunciado:'Pesos 0,30 / 0,25 / 0,20 / 0,15 / 0,10 e notas (4, 4, 3, 4, 4). Quanto valem S e N?',
      alternativas:[alt('A', 'S = 3,80 e N = 76,0'), alt('B', 'S = 4,00 e N = 75,0'), alt('C', 'S = 3,60 e N = 65,0'), alt('D', 'S = 3,80 e N = 70,0')], correta:'D',
      dica:'Multiplique cada nota pelo peso e some (isso é S). Depois normalize: N = (S − 1) ÷ 4 × 100.',
      justificativa:d => { const w = { C1:0.30, C2:0.25, C3:0.20, C4:0.15, C5:0.10 }, nt = { C1:4, C2:4, C3:3, C4:4, C5:4 }, S = C.score(nt, w), N = C.normalizar(d, S);
        return `<p>${Object.keys(w).map(k => `${fmt.n(w[k], 2)} × ${nt[k]}`).join(' + ')} = <b>${n2(S)}</b>; (${n2(S)} − 1) ÷ 4 × 100 = <b>${n2(N)}</b>. São as notas e os pesos de P06 na referência.</p>`; } },
    { id:'N2-C02', titulo:'Para que serve a rubrica', tipo:'conceito', formato:'mc', regra:'R19', conceito:'Rubrica ancorada', ver:'#/n2/criterios',
      enunciado:'Para que serve a rubrica ancorada?',
      alternativas:[alt('A', 'Para que o mesmo “4” signifique o mesmo para avaliadoras diferentes'), alt('B', 'Para substituir os pesos, já que a âncora define a importância'), alt('C', 'Para deixar o processo mais formal, com as notas ainda livres'), alt('D', 'Para garantir que toda iniciativa tenha pelo menos nota 3')], correta:'A',
      dica:'Abra a tabela de rubricas em Critérios & Pesos e veja o que está escrito em cada nota.',
      justificativa:'Sem âncora, o “4” de uma é o “3” de outra. A âncora reduz subjetividade e inflação de notas; o peso continua dizendo quanto cada critério importa.' },
    { id:'N2-C03', titulo:'Escala ordinal', tipo:'conceito', formato:'mc', regra:'R21', conceito:'Escala ordinal', ver:'#/n2/pontuacao?aba=grade',
      enunciado:'É correto dizer que P06 (N 70) vale cerca de 1,5 vez P04 (N 46,25)?',
      alternativas:[alt('A', 'Sim, porque N já está normalizado de 0 a 100'), alt('B', 'Sim, desde que os pesos somem exatamente 100%'), alt('C', 'Não: a escala diz a ordem (e no máximo diferenças), não proporções'), alt('D', 'Não, porque P04 é de inovação e P06 é de evolução')], correta:'C',
      dica:'Normalizar muda a régua, mas não muda o tipo de escala das notas de 1 a 5.',
      justificativa:d => `<p>N(P06) = ${n2(row(d, 'P06').N)} e N(P04) = ${n2(row(d, 'P04').N)}. As notas são ordinais: dizem a ordem e, no máximo, diferenças. Afirmar “1,5 vez” trata a escala como razão, o que ela não é.</p>` },
    { id:'N2-C04', titulo:'Dupla contagem', tipo:'conceito', formato:'mc', regra:'R19', conceito:'Independência dos critérios', ver:'#/n2/criterios',
      enunciado:'Que par de medidas do caso tem risco de dupla contagem?',
      alternativas:[alt('A', 'C1 (alinhamento) e C3 (urgência)'), alt('B', 'C5 (viabilidade técnica) e o risco de execução P×I'), alt('C', 'C2 (criticidade sistêmica) e o custo estimado'), alt('D', 'C4 (redução de risco) e o FTE estimado')], correta:'B',
      dica:'Procure duas medidas que penalizam a mesma incerteza.',
      justificativa:'C5 baixa e P×I alto penalizam a mesma incerteza técnica: a candidata perde duas vezes pelo mesmo motivo. O checklist de independência existe para isso.' },
    { id:'N2-C05', titulo:'Obrigatória no processo', tipo:'conceito', formato:'mc', regra:'R24', conceito:'Obrigatórias primeiro', ver:'#/n2/selecao?aba=1',
      enunciado:'Como P01 (obrigatória) entra no processo de seleção?',
      alternativas:[alt('A', 'Compete no ranking como as demais, com bônus de 10 pontos'), alt('B', 'Fica de fora, porque o valor por FTE é baixo (28,75)'), alt('C', 'Entra só se sobrar capacidade depois das discricionárias'), alt('D', 'Entra antes do ranking e reduz o disponível para 7 FTE e R$ 2,8 mi')], correta:'D',
      dica:'Compare, no passo 1 de Capacidade & Seleção, a capacidade do ciclo com a capacidade discricionária.',
      justificativa:d => { const x = C.discricionaria(d); return `<p>Entra antes do ranking. Capacidade ${n1(C.capacidadeTotal(d))} FTE − ${n1(row(d, 'P01').fte)} = <b>${n1(x.fte)} FTE</b>; orçamento ${n2(C.orcamentoCiclo(d))} − ${n2(row(d, 'P01').custo)} = <b>${mi(x.custo)}</b>. O que conta como obrigatória, e com que evidência, está a validar (R12).</p>`; } },
    { id:'N2-C06', titulo:'Matriz decisória (s165)', tipo:'conceito', formato:'mc', regra:'R26', conceito:'Faixas de capacidade', ver:'#/n2/selecao?aba=1',
      enunciado:'Na matriz decisória proposta no deck (s165), capacidade utilizada entre 90% e 100% indica:',
      alternativas:[alt('A', 'Executar o roadmap estruturado'), alt('B', 'Reduzir escopo e modularizar entregas'), alt('C', 'Ativar tanque e repriorizar o backlog'), alt('D', 'Investir em autonomia e dívida técnica')], correta:'B',
      dica:'Olhe a tabela de faixas no passo 1 de Capacidade & Seleção.',
      justificativa:d => `<p>Faixa de 90% a 100%: “${esc(((C.param(d, 'R26') || {}).acoes || {}).REDUZIR || 'Reduzir escopo + modularizar entregas')}”. É proposta do deck v25; adotar como regra é a R26, a validar.</p>` },
    { id:'N2-C07', titulo:'Critérios do deck', tipo:'conceito', formato:'mc', regra:'R19', conceito:'Critérios do deck', ver:'#/n2/criterios',
      enunciado:'Qual destes NÃO está entre os critérios de priorização técnica e institucional citados no deck (s138/s140)?',
      alternativas:[alt('A', 'Criticidade sistêmica'), alt('B', 'Custo cognitivo'), alt('C', 'Maior retorno financeiro no ano'), alt('D', 'Janela regulatória e operacional')], correta:'C',
      dica:'Releia o aviso sobre a relação com o deck em Critérios & Pesos.',
      justificativa:'O deck cita criticidade sistêmica, custo cognitivo, janela regulatória e operacional, e curto × longo prazo. Não define pesos. Retorno financeiro no ano não aparece.' },
    { id:'N2-C08', titulo:'Score alto sem patrocinador', tipo:'conceito', formato:'mc', regra:'R17', conceito:'Must-meet × should-meet', ver:'#/n2/gate',
      enunciado:'Uma candidata tem S = 4,6, mas não tem patrocinador. O que você recomenda ao comitê?',
      alternativas:[alt('A', 'Go, porque o score alto compensa a falta'), alt('B', 'Recycle ou devolução até cumprir o must-meet'), alt('C', 'Kill imediato, sem possibilidade de retorno'), alt('D', 'Go condicionado a indicar o patrocinador depois')], correta:'B',
      dica:'Lembre da triagem do Nível 1: ter patrocinador é critério eliminatório ou classificatório?',
      justificativa:'Must-meet vem antes de should-meet: sem patrocinador, a candidata nem compete por mérito. Go condicionado não substitui um eliminatório; Kill descarta algo que pode voltar completo.' },
    { id:'N2-C09', titulo:'Limite FEG × CT PMO-PLD', tipo:'conceito', formato:'mc', regra:'R34', conceito:'Limites em aberto', ver:'#/n2/gate?aba=raci',
      enunciado:'P01 envolve o CT PMO-PLD. Sobre quem prioriza demandas nesse escopo, o material disponível permite afirmar que:',
      alternativas:[alt('A', 'A FEG prioriza sozinha, porque coordena os fóruns de portfólio'), alt('B', 'O PO decide, porque é R/A na priorização da squad'), alt('C', 'O limite FEG × CT ainda está a validar; o slide fala em executar o backlog (s63)'), alt('D', 'A Diretoria decide, porque o CT é um fórum externo à FE')], correta:'C',
      dica:'Veja a última linha da RACI e o rótulo dela.',
      justificativa:'A ideia de que a Comissão Gestora prioriza vem de comentário de revisão (rascunho). O slide diz que a FEG executa e operacionaliza o backlog (s63). Reconhecer um ponto em aberto é competência de GRC.' },
    { id:'N2-C10', titulo:'Reavaliação de P05', tipo:'conceito', formato:'mc', regra:'R06', conceito:'Avaliação append-only', ver:'#/n2/pontuacao?aba=grade',
      enunciado:'P05 recebeu nova avaliação em 18/09 (C4 de 4 para 5). O que acontece com a de 15/06?',
      alternativas:[alt('A', 'Fica preservada; a mais recente vale e a decisão grava a versão usada'), alt('B', 'É sobrescrita, porque só a avaliação mais recente importa'), alt('C', 'É apagada depois de 30 dias para não confundir o comitê'), alt('D', 'Vira média com a nova, para suavizar mudanças de opinião')], correta:'A',
      dica:'Veja a linha do tempo das avaliações na Grade.',
      justificativa:d => { const w = C.pesosEfetivos(d), avs = (d.avaliacoes || []).filter(a => a.iniciativaId === 'P05').slice().sort((a, b) => String(a.registradoEm).localeCompare(String(b.registradoEm))), N = a => n2(C.normalizar(d, C.score(a.notasCriterios, w)));
        return `<p>Avaliação não se apaga nem se sobrescreve: a nova vale e a antiga fica guardada. A reavaliação levou N de ${avs.map(N).join(' para ')} e criou o empate com P08 (N ${n2(row(d, 'P08').N)}).</p>`; } },
    { id:'N2-C11', titulo:'Erro em fotografia fechada', tipo:'conceito', formato:'mc', regra:'R06', conceito:'Fotografia imutável', ver:'#/n2/forum?aba=foto',
      enunciado:'A fotografia de set/2026 está FECHADA e tem um erro de digitação. O que fazer?',
      alternativas:[alt('A', 'Editar a fotografia, registrando o motivo no histórico'), alt('B', 'Apagar a fotografia e gerar outra com o dado certo'), alt('C', 'Pedir ao instrutor para reabri-la como ABERTO'), alt('D', 'Registrar uma correção como novo registro ou gerar nova versão')], correta:'D',
      dica:'Releia a aula rápida da aba Fotografia, no Fórum Mensal.',
      justificativa:'O que foi apresentado no fórum não muda (SNAPSHOT_LOCKED). Corrige-se com novo registro ou nova versão, que aponta para a anterior.' },
    { id:'N2-C12', titulo:'Mais iniciativas em paralelo', tipo:'conceito', formato:'mc', regra:'R30', conceito:'WIP', ver:'#/n2/evm',
      enunciado:'Aumentar o número de iniciativas em paralelo, com a mesma capacidade, tende a:',
      alternativas:[alt('A', 'Reduzir o prazo médio, porque mais coisas andam juntas'), alt('B', 'Não ter efeito, se a capacidade total for a mesma'), alt('C', 'Aumentar o prazo médio e a troca de contexto'), alt('D', 'Aumentar a vazão na mesma proporção do WIP')], correta:'C',
      dica:'Se a vazão não muda, o que acontece com o tempo de cada item quando há mais itens na fila?',
      justificativa:'Mais WIP com a mesma vazão significa mais prazo para cada item, além da troca de contexto (referência: Lean Portfolio Management).' },
    { id:'N2-C13', titulo:'RACI: quem aprova esforço', tipo:'conceito', formato:'mc', regra:'R38', conceito:'RACI (conferir no slide)', ver:'#/n2/gate?aba=raci', conferirFonte:true,
      enunciado:'Na RACI de estruturação e priorização (leitura do s143), quem aprova (A) a avaliação de esforço e capacidade?',
      alternativas:[alt('A', 'PO da squad'), alt('B', 'PMO (Analista de Governança e Portfólio)'), alt('C', 'Área usuária'), alt('D', 'Líder da Comunidade')], correta:'D',
      dica:'Veja a linha “Avaliação de esforço e capacidade” em Quem decide (RACI).',
      justificativa:'Na leitura do texto extraído, o Líder da Comunidade é “A”. É reconstrução: conferir no slide original. Por isso esta pergunta não conta para o desbloqueio.' },
  ];

  /* ---------------------------------------------------------------- (b) análise (10), sobre PF.base */
  const analise = [
    { id:'AQ2-01', titulo:'Maior valor por FTE', tipo:'analise', formato:'pick', regra:'R21', conceito:'Valor por FTE', ver:'#/n2/pontuacao?aba=grade',
      enunciado:'Qual candidata tem o maior valor por FTE (N ÷ FTE)?', opcoes:d => opIni(d, rows(d)), correta:d => rows(d).slice().sort((a, b) => b.nFte - a.nFte)[0].id,
      dica:'Divida N pelo FTE de cada candidata. Candidata pequena com N razoável pode render muito por FTE.',
      justificativa:d => { const o = rows(d).slice().sort((a, b) => b.nFte - a.nFte); return J({ r:`<b>${o[0].id}</b> (${n2(o[0].nFte)} pontos por FTE); depois ${o[1].id} (${n2(o[1].nFte)}) e ${o[2].id} (${n2(o[2].nFte)}).`,
        c:`N ÷ fte de cada candidata (FTE do ciclo 2027, só linhas em FTE). ${o[0].id}: ${n2(o[0].N)} ÷ ${n1(o[0].fte)} = ${n2(o[0].nFte)}.`, l:'É a régua do método guloso: mais valor por unidade do recurso escasso.',
        k:'A razão ignora o tamanho: escolher só por N/FTE pode deixar FTE ocioso e perder valor.', p:'Compare o guloso com o ótimo exato em Capacidade & Seleção.' }); } },
    { id:'AQ2-02', titulo:'Capacidade discricionária', tipo:'analise', formato:'num', regra:'R24', conceito:'Capacidade discricionária', ver:'#/n2/selecao?aba=1', unidade:'FTE', casas:1, tolerancia:0,
      enunciado:'Quanto sobra de capacidade discricionária, em FTE, depois das obrigatórias?', calc:d => C.discricionaria(d).fte,
      dica:'Capacidade do ciclo menos o FTE das obrigatórias.',
      justificativa:d => { const x = C.discricionaria(d), ob = rows(d).filter(r => r.obrigatoria); return J({ r:`<b>${n1(x.fte)} FTE</b> (e ${mi(x.custo)} no orçamento).`, c:`${n1(C.capacidadeTotal(d))} FTE − ${ob.map(r => `${r.id} ${n1(r.fte)}`).join(' − ')} = ${n1(x.fte)}.`,
        l:'É o que as candidatas discricionárias disputam por mérito.', k:'Linhas em horas (H01, 880 h) ficam fora da soma: o app não converte horas em FTE.', p:'Veja como cada método usa esses FTE no passo 2.' }); } },
    { id:'AQ2-03', titulo:'Quadrante “questionar”', tipo:'analise', formato:'pick', regra:'R22', conceito:'Quadrantes', ver:'#/n2/pontuacao?aba=ve',
      enunciado:'Qual candidata cai em “questionar” (N < 60 e FTE > 2)?', opcoes:d => opIni(d, rows(d)), correta:d => (rows(d).find(r => r.qVE === 'QUESTIONAR') || {}).id,
      dica:'Procure valor abaixo de 60 e esforço acima de 2 FTE ao mesmo tempo.',
      justificativa:d => { const r = rows(d).find(x => x.qVE === 'QUESTIONAR'); return J({ r:`<b>${r.id}</b> (N ${n2(r.N)}; ${n1(r.fte)} FTE).`, c:'Limiares R22: valor alto N ≥ 60; esforço alto FTE > 2.', l:'Valor baixo com esforço alto pede pergunta, não condenação.',
        k:'Questionar não é matar: P02 pode habilitar P08 (dependência a confirmar).', p:'No gate, considere Hold com gatilho em vez de Kill.' }); } },
    { id:'AQ2-04', titulo:'Valor da melhor carteira', tipo:'analise', formato:'num', regra:'R24', conceito:'Ótimo exato', ver:'#/n2/selecao?aba=2', unidade:'pts', casas:2, tolerancia:0.05,
      enunciado:'Qual o valor (ΣN) da melhor carteira que cabe em 10 FTE e R$ 4,0 mi, com P01 obrigatória?', calc:d => C.otimizar(d).valor,
      dica:'Teste combinações: a melhor carteira não é necessariamente a que segue o ranking.',
      justificativa:d => { const o = C.otimizar(d); return J({ r:`<b>${n2(o.valor)}</b> pontos: ${o.ids.join(', ')}.`, c:`Enumeração das ${fmt.n(o.avaliadas)} combinações; ${fmt.n(o.viaveis)} cabem. A melhor usa ${n1(o.fte)} FTE e ${mi(o.custo)}.`,
        l:'É o teto de valor com estas restrições: a régua para medir a eficiência dos outros métodos.', k:`O ótimo em valor tem D = ${fmt.n(o.D * 100, 1)} pp: zera a Sustentação.`, p:'Confira o mix no passo 3 de Capacidade & Seleção.' }); } },
    { id:'AQ2-05', titulo:'Risco crítico sem mitigação', tipo:'analise', formato:'pick', regra:'R22', conceito:'Risco P×I', ver:'#/n2/gate',
      enunciado:'Qual candidata tem R ≥ 15 e nenhuma mitigação registrada?', opcoes:d => opIni(d, rows(d)),
      correta:d => { const L = C.param(d, 'R22'); return (rows(d).find(r => r.R >= L.riscoCritico && !r.acao) || {}).id; },
      dica:'Calcule R = P × I e confira a coluna de ação (mitigação) do risco.',
      justificativa:d => { const L = C.param(d, 'R22'), r = rows(d).find(x => x.R >= L.riscoCritico && !x.acao), o = rows(d).filter(x => x.R >= L.riscoCritico && x.id !== r.id);
        return J({ r:`<b>${r.id}</b> (P ${r.P} × I ${r.I} = R ${r.R}; ação vazia).`, c:`R = P × I do maior risco aberto; crítico se R ≥ ${L.riscoCritico} (R22).${o.length ? ` ${o.map(x => `${x.id} também tem R ${x.R}, mas com mitigação`).join('; ')}.` : ''}`,
          l:'Ostra sem mitigação: valor alto, risco alto, sem plano.', k:'Aprovar sem mitigação é aprovar o risco às cegas.', p:'No gate, avalie Recycle em fases com mitigação.' }); } },
    { id:'AQ2-06', titulo:'Índice D da carteira ótima', tipo:'analise', formato:'num', regra:'R28', conceito:'Índice D', ver:'#/n2/selecao?aba=3', unidade:'pp', casas:1, tolerancia:0.5,
      enunciado:'Qual o índice D (em pontos percentuais) da carteira ótima?', calc:d => C.otimizar(d).D * 100,
      dica:'Só a parte discricionária (sem P01), em R$. D = metade da soma das diferenças absolutas entre real e alvo.',
      justificativa:d => { const o = C.otimizar(d), a = C.param(d, 'R28').alvo, m = o.mix || {}; return J({ r:`<b>${fmt.n(o.D * 100, 1)} pp</b>.`,
        c:`½ × (${Object.keys(a).map(k => `|${pc(m[k] || 0)} − ${pc(a[k], 0)}|`).join(' + ')}); custo discricionário em R$ (sem a obrigatória).`, l:'A carteira de maior valor zera a Sustentação.', k:'O alvo (30/50/20) e a tolerância de 15 pp estão a validar (R28).', p:'Decidir se o mix vira restrição é tema do Nível 3 (custo da política).' }); } },
    { id:'AQ2-07', titulo:'CPI do portfólio', tipo:'analise', formato:'num', regra:'R30', conceito:'EVM', ver:'#/n2/evm', casas:2, tolerancia:0.01,
      enunciado:'Qual o CPI do portfólio em execução (ΣEV ÷ ΣAC)?', calc:d => C.evmPortfolio(d).cpi,
      dica:'EV = % físico real × BAC de cada iniciativa em execução. Some os EV e divida pela soma dos AC.',
      justificativa:d => { const p = C.evmPortfolio(d), it = p.itens.filter(e => e.cpi != null).sort((a, b) => a.cpi - b.cpi); return J({ r:`<b>${n2(p.cpi)}</b> (${n2(p.ev)} ÷ ${n2(p.ac)}).`,
        c:`EV por iniciativa = físico × BAC; soma das ${p.itens.length} em execução.`, l:`Cada R$ 1 gasto gerou R$ ${n2(p.cpi)} de valor. ${it.slice(0, 2).map(e => `${e.id} (CPI ${n2(e.cpi)})`).join(' e ')} puxam o índice: o EVM confirma as vermelhas do Nível 1.`,
        k:'O agregado esconde quem: olhe a tabela por iniciativa.', p:'Leve E02 e E05 ao Fórum Mensal com o EAC.' }); } },
    { id:'AQ2-08', titulo:'Ociosidade do guloso', tipo:'analise', formato:'num', regra:'R24', conceito:'Método guloso', ver:'#/n2/selecao?aba=2', unidade:'FTE', casas:1, tolerancia:0,
      enunciado:'Quantos FTE o método guloso por N/FTE deixa ociosos (10 FTE, R$ 4,0 mi, P01 obrigatória)?', calc:d => C.guloso(d).ociosidade,
      dica:'Ordene por N/FTE, inclua quem couber (pulando quem não cabe) e veja quanto sobra.',
      justificativa:d => { const g = C.guloso(d), o = C.otimizar(d), R = id => row(d, id), entrou = g.ids.filter(id => !o.ids.includes(id)), faltou = o.ids.filter(id => !g.ids.includes(id));
        return J({ r:`<b>${n1(g.ociosidade)} FTE</b>.`, c:`Obrigatória primeiro, depois maior N/FTE que cabe: ${g.ordem.join(', ')} = ${n1(g.fte)} FTE; ${n1(g.cap)} − ${n1(g.fte)} = ${n1(g.ociosidade)}.`,
        l: entrou.length ? `${entrou.map(id => `${id} (${n1(R(id).fte)} FTE; N/FTE ${n2(R(id).nFte)})`).join(', ')} entrou cedo pela razão; ${faltou.map(id => `${id} (${n1(R(id).fte)} FTE)`).join(', ')}, que está na melhor carteira, não coube nos ${n1(g.ociosidade)} FTE restantes.` : 'Aqui o guloso coincide com o ótimo exato.',
        k:'Eficiência por unidade não garante o melhor conjunto.', p:`Compare com o ótimo exato, que usa ${n1(o.fte)} FTE e vale ${n2(o.valor)} pontos.` }); } },
    { id:'AQ2-09', titulo:'Quem piorou desde setembro', tipo:'analise', formato:'pick', regra:'R13', conceito:'O que mudou', ver:'#/n2/forum?aba=mudou',
      enunciado:'Desde a fotografia FECHADA de set/2026, qual iniciativa piorou de sinal calculado?', opcoes:d => opIni(d, C.emExecucao(d)),
      correta:d => { const b = C.ultimaFotografiaFechada(d, 'FR-SET'); return b ? C.diffFotografia(b, C.conteudoFotografia(d)).pioraram[0] : null; },
      dica:'Compare o sinal calculado de cada iniciativa na fotografia de setembro com o de hoje.',
      justificativa:d => { const b = C.ultimaFotografiaFechada(d, 'FR-SET'), df = C.diffFotografia(b, C.conteudoFotografia(d)), x = df.iniciativas.find(i => i.piorou), dec = (b.iniciativasJson || []).find(i => i.id === x.id) || {};
        return J({ r:`<b>${x.id}</b> (${cor(x.antes)} → ${cor(x.depois)}).`, c:`Mesma função de fotografia nos dois lados (${b.id} × estado atual). Campos que mudaram: ${x.campos.map(k => N2.campoNome ? N2.campoNome(k) : k).join(', ')}.`,
          l:`O declarado foi de ${cor(dec.ragDeclarado)} para ${cor((d.iniciativas.find(i => i.id === x.id) || {}).ragDeclarado)} enquanto o calculado piorou: status melancia.`, k:'A mudança do declarado foi feita sem justificativa (veja o histórico).', p:'Registre a divergência e leve ao fórum.' }); } },
    { id:'AQ2-10', titulo:'Matrizes diferentes', tipo:'analise', formato:'pick', regra:'R22', conceito:'Matrizes', ver:'#/n2/pontuacao?aba=vr',
      enunciado:d => `Qual candidata muda de grupo entre as matrizes valor × esforço e valor × risco? Considere equivalentes: ${Object.keys(MAP).map(k => `“${esc(QV(d, 'VE', k))}” ↔ “${esc(QV(d, 'VR', MAP[k]))}”`).join(', ')}.`, opcoes:d => opIni(d, rows(d)),
      correta:d => { const m = rows(d).filter(r => MAP[r.qVE] !== r.qVR); return m.length === 1 ? m[0].id : null; },
      dica:'Compare as duas tabelas de classificação: procure valor alto com pouco esforço e risco alto.',
      justificativa:d => { const r = rows(d).find(x => MAP[x.qVE] !== x.qVR);
        return J({ r:`<b>${r.id}</b>: ${QV(d, 'VE', r.qVE)} (N ${n2(r.N)}; ${n1(r.fte)} FTE) e ${QV(d, 'VR', r.qVR)} (R ${r.R}).`, c:'V×E: N ≥ 60 e FTE ≤ 2. V×R: N ≥ 60 e R ≥ 12 (R22).',
          l:'Fácil de fazer não quer dizer seguro: as matrizes respondem a perguntas diferentes.', k:`R = ${r.R} está exatamente no limiar de risco alto (${C.param(d, 'R22').riscoAlto}); o limiar está a validar.`, p:'No gate, condicione à mitigação (confirmar a dependência e o acordo de dados).' }); } },
  ];

  /* ---------------------------------------------------------------- (c) decisão de escolha (5) */
  const OPC01 = [['A', ['P03', 'P06', 'P07']], ['B', ['P05']], ['C', ['P03', 'P06']], ['D', ['P06', 'P08']]];
  const res01 = d => { const rs = rows(d); return OPC01.map(([id, ids]) => ({ id, ids, r: C.resumoCarteira(d, ids, { rows:rs, cap:4, orc:1.6 }) })); };
  const decisao = [
    { id:'DC2-01', titulo:'Ciclo menor: 4 FTE', tipo:'decisao', formato:'pick', regra:'R24', conceito:'Seleção com restrições', ver:'#/n2/selecao?aba=2',
      enunciado:'Num exercício de ciclo menor, restam 4 FTE e R$ 1,6 mi para escolher entre P03, P05, P06, P07 e P08. Qual combinação você recomenda?',
      opcoes:d => res01(d).map(x => ({ id:x.id, label:`${x.ids.join(' + ')} (${n1(x.r.fte)} FTE; ${mi(x.r.custo)})` })),
      correta:d => res01(d).filter(x => x.r.viavel).sort((a, b) => b.r.valor - a.r.valor)[0].id,
      dica:'Todas cabem: compare o valor total (ΣN) de cada combinação e o que sobra de FTE.',
      /* feedback da alternativa errada (§6.6); a correta nunca recebe dica */
      dicas:d => { const xs = res01(d), best = xs.filter(x => x.r.viavel).sort((a, b) => b.r.valor - a.r.valor)[0], by = id => xs.find(x => x.id === id).r;
        const t = { B:`Vale ${n2(best.r.valor - by('B').valor)} pontos a menos que a melhor combinação que cabe. Só se defende como política explícita contra dívida técnica, com o custo registrado; prefira Recycle em fases.`,
          C:`Deixa ${n1(by('C').ociosidade)} FTE ocioso.`, D:'Menor valor com o mesmo recurso.', A:'Compare o valor total (ΣN) com as outras combinações que cabem.' }; delete t[best.id]; return t; },
      justificativa:d => { const xs = res01(d), best = xs.filter(x => x.r.viavel).sort((a, b) => b.r.valor - a.r.valor)[0];
        const fb = { A:'maior valor, cabe e inclui uma sustentação barata', B:`vale ${n2(best.r.valor - xs[1].r.valor)} pontos a menos; só se defende como política explícita contra dívida técnica, com o custo registrado (prefira Recycle em fases)`, C:`deixa ${n1(xs[2].r.ociosidade)} FTE ocioso`, D:'menor valor com o mesmo recurso' };
        return `<p>Correta: <b>${best.ids.join(' + ')}</b> (${n2(best.r.valor)} pontos).</p>` + tab(['Opção', 'FTE', 'R$ mi', 'Valor', 'Leitura'], xs.map(x => [x.ids.join(' + '), n1(x.r.fte), n2(x.r.custo), `<b>${n2(x.r.valor)}</b>`, esc(fb[x.id])])); } },
    { id:'DC2-02', titulo:'Monte a carteira do ciclo', tipo:'decisao', formato:'decisao', regra:'R24', conceito:'Seleção com restrições', ver:'#/n2/selecao?aba=2',
      enunciado:'Monte a carteira do Ciclo Exemplo 2027: 10 FTE e R$ 4,0 mi, com P01 obrigatória.',
      contexto:d => `<p class="muted" style="margin:0">Clique nas linhas para marcar as candidatas. P01 já entra (obrigatória). A nota é o seu valor dividido pelo melhor valor possível × 100. ${PF.badge('R24')} ${PF.badge('R21')}</p>`,
      itens:d => rows(d).map(r => ({ id:r.id, label:`${r.id} · ${tit(d, r.id)}`, cols:{ cat:(N2.CAT || {})[r.categoria] || r.categoria, n:r.N, fte:r.fte, custo:r.custo, R:r.R, q:QV(d, 'VE', r.qVE) } })),
      colunas:[{ key:'cat', label:'Categoria', fmt:v => esc(v) }, { key:'n', label:'N', fmt:v => n2(v) }, { key:'fte', label:'FTE', fmt:v => n1(v) }, { key:'custo', label:'R$ mi', fmt:v => n2(v) }, { key:'R', label:'R', fmt:v => esc(v) }, { key:'q', label:'Quadrante V×E', fmt:v => esc(v) }],
      limites:d => [{ key:'fte', label:'FTE', max:C.capacidadeTotal(d), casas:1 }, { key:'custo', label:'R$ mi', max:C.orcamentoCiclo(d), casas:2 }], totais:[{ key:'n', label:'Valor ΣN', casas:2 }],
      preSel:['P01'], fixos:['P01'],
      avaliar:(sel, d) => { const r = C.avaliarSelecao(d, sel); return { ok:r.ok, nota:r.nota, feedback:`<p>${esc(r.feedback)}</p>` }; },
      gabarito:d => { const o = C.otimizar(d); return `<p>Ótimo exato: <b>${o.ids.join(', ')}</b> = ${n2(o.valor)} pontos (${n1(o.fte)} FTE; ${mi(o.custo)}); D ${fmt.n(o.D * 100, 1)} pp.</p>`; },
      dica:'Use a capacidade inteira: veja o que ainda cabe nos FTE que sobram.',
      justificativa:(d, sel) => { const r = C.avaliarSelecao(d, sel || []), o = C.otimizar(d);
        const leitura = r.caso === 'MIX' ? 'Você trocou valor por um mix dentro da tolerância: é defensável se registrado; o custo dessa política é tema do Nível 3.'
          : `Valor e equilíbrio são objetivos diferentes: esta carteira tem D = ${r.D == null ? 'n/d' : fmt.n(r.D * 100, 1) + ' pp'}${r.D != null && r.D > C.param(d, 'R28').toleranciaD + 1e-9 ? ', acima da tolerância: registre a escolha e o mix que fica de fora' : ''}.`;
        return `<p>Sua carteira: ${(sel || []).join(', ')} = <b>${n2(r.valor)}</b> pontos (${n1(r.fte)} FTE; ${mi(r.custo)}); eficiência ${pc(r.eficiencia)}; D ${r.D == null ? 'n/d' : fmt.n(r.D * 100, 1) + ' pp'}; exposição ${n2(r.exposicao)}.</p><p>Ótimo exato: <b>${o.ids.join(', ')}</b> = ${n2(o.valor)} pontos. ${leitura}</p>`; } },
    { id:'DC2-03', titulo:'Empate na linha de corte', tipo:'decisao', formato:'mc', regra:'R23', conceito:'Desempate', ver:'#/n2/pontuacao?aba=grade',
      enunciado:'Na linha de corte, P05 e P08 empatam em 63,75 na 4ª posição. O que fazer?',
      alternativas:[alt('A', 'Escolher a preferida da equipe e registrar a escolha'), alt('B', 'Aplicar a regra de desempate registrada (menor risco: P08, R 12 < 16) e anotar o empate técnico'), alt('C', 'Sortear, porque empate técnico não tem critério'), alt('D', 'Levar as duas, estourando a capacidade em 2 FTE')], correta:'B',
      dica:'Veja a coluna Desempate da Grade e a regra citada nela.',
      justificativa:d => { const m = C.metodos(d); return `<p>Com P05 primeiro, a linha de corte levaria ${m.corteSemDesempate.ids.join(', ')}: o mesmo valor (${n2(m.corteSemDesempate.valor)}), mas ${n1(m.corteSemDesempate.fte)} FTE e exposição ${n2(m.corteSemDesempate.exposicao)}. Com o desempate: ${m.corte.ids.join(', ')} (${n1(m.corte.fte)} FTE; exposição ${n2(m.corte.exposicao)}). O desempate muda a carteira, não o valor; por isso precisa ser regra escrita. O empate só existe desde a reavaliação de P05 em 18/09.</p>`; } },
    { id:'DC2-04', titulo:'Ostra sem mitigação', tipo:'decisao', formato:'mc', regra:'R22', conceito:'Recomendação de gate', ver:'#/n2/gate',
      enunciado:'O comitê decide hoje. P05 é ostra (valor alto, R 16) e não tem mitigação registrada. Que recomendação você registra?',
      alternativas:[alt('A', 'Recycle: fase 1 menor (diagnóstico de dívida técnica, ~1 FTE), com mitigação, de volta no próximo gate'), alt('B', 'Go, porque o valor é alto e a sustentação está zerada'), alt('C', 'Go condicionado, com a mitigação a ser elaborada depois da aprovação'), alt('D', 'Kill, porque risco 16 é inaceitável')], correta:'A',
      dica:'Abra P05 no Exercício de Gate: leia os blocos E (Risco) e F (Carteira) e a aula sobre as saídas de gate.',
      dicas:{ B:'Sem mitigação, aprova-se o risco às cegas.', C:'Condicionante sem plano definido não é condicionante. Incluir P05 (4 FTE) tira P04 e P08 e reduz a carteira de 331,25 para 285,00.', D:'Descarta a única sustentação com C4 = 5; o risco de dívida técnica continua.' },
      justificativa:d => { const o = C.otimizar(d), f = C.otimizar(d, { forcar:['P05'] }), r = row(d, 'P05');
        return `<p>Recycle em fases com mitigação. Go aprova o risco às cegas. Go condicionado sem plano não é condicionante, e incluir P05 (${n1(r.fte)} FTE) tira ${o.ids.filter(k => !f.ids.includes(k)).join(' e ')} e reduz a carteira de ${n2(o.valor)} para ${n2(f.valor)}. Kill descarta a única sustentação com C4 = ${(r.notas || {}).C4}; o risco de dívida técnica continua.</p>`; } },
    { id:'DC2-05', titulo:'E05 no fórum de outubro', tipo:'decisao', formato:'mc', regra:'R05a', conceito:'Escalonamento', ver:'#/n2/evm',
      enunciado:d => { const e = C.evm(d, 'E05'); return `E05: SPI ${n2(e.spi)}, CPI ${n2(e.cpi)} e EAC ${mi(e.eac)} contra previsão declarada de ${mi(e.previsao)}. O que vai para o fórum simulado de outubro?`; },
      alternativas:[alt('A', 'Seguir sem registro, porque falta pouco para terminar'), alt('B', 'A analista decide interromper E05 e comunica o fórum'), alt('C', 'Trocar a previsão declarada pelo EAC e manter o sinal atual'), alt('D', 'ESCALAR com três opções (nova baseline, corte de escopo, interrupção), custo restante pelo EAC (≈ R$ 0,87 mi) e efeito em E02 (Dep2)')], correta:'D',
      dica:'Releia a aula da aba Ata e escalonamentos (Fórum Mensal) e a linha de E05 em Desempenho (EVM).',
      dicas:{ A:'Com CPI 0,65, o custo final previsto passa a previsão em R$ 0,37 mi.', B:'O PMO consolida, recomenda e escala (s74, s129); não decide interromper.', C:'Previsão é declaração do responsável. A diferença é informação, não erro a esconder.' },
      justificativa:d => { const e = C.evm(d, 'E05'), bl = C.bloqueios(d).filter(b => b.por === 'E05');
        return `<p>ESCALAR com opções e números: custo restante pelo EAC = ${n2(e.eac)} − ${n2(e.ac)} = <b>${mi(e.etc)}</b>; o EAC passa a previsão em ${mi(e.eacMenosPrevisao)}${bl.length ? `; E05 bloqueia ${bl.map(b => `${b.bloqueada} (${b.dependenciaId})`).join(', ')}` : ''}. A analista não decide interromper (o PMO consolida, recomenda e escala: s74, s129), nem troca a previsão declarada, que é do responsável. Instância: a validar (a FEG coordena o fórum, s129).</p>`; } },
  ];

  PF.level(2).questions.push(...conceituais, ...analise, ...decisao);
})();
