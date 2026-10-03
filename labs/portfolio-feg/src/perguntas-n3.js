/* =========================================================================
   Portfólio FEG — PERGUNTAS DO NÍVEL 3 · REGÊNCIA · OTIMIZAÇÃO (perguntas-n3.js)
   Spec §7.5 com o escopo do CONTRATO D4: saem AQ3-07 (caminho crítico/CPM) e DC3-03 (opção real), que eram aprofundamento.
   Ficam 23 perguntas: 9 conceituais (N3-C02 é aprofundamento), 9 de análise e 5 de decisão; 22 graduadas.
   Roda depois de nivel3.js e anexa via PF.level(3).questions.push(...). Gabaritos de análise e decisão são calculados por
   PF.calc sobre o d recebido (PF.base, a referência congelada, pesos v1). Nada aqui é regra ONS; dados fictícios.
   Corretas das mc (12): A 3 · B 3 · C 3 · D 3.
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF;
  if(!PF || !PF.level || !PF.level(3) || !PF.calc) return;
  const { esc, fmt } = PF.util, C = PF.calc, N3 = PF.n3 || {};
  const n1 = v => v == null ? 'n/d' : fmt.n(v, 1), n2 = v => v == null ? 'n/d' : fmt.n(v, 2), n3 = v => v == null ? 'n/d' : fmt.n(v, 3);
  const pc = (v, c = 1) => v == null ? 'n/d' : fmt.pct(v, c), pp = v => v == null ? 'n/d' : fmt.n(v * 100, 1) + ' pp';
  const pcx = N3.pcx || (v => pc(v, 1));
  const J = N3.J || (o => `<p><b>Resposta:</b> ${o.r}</p><p><b>Como calculei:</b> ${o.c}</p><p><b>Leitura:</b> ${o.l}</p><p><b>Cuidado:</b> ${o.k}</p><p><b>Próximo passo:</b> ${o.p}</p>`);
  const tit = (d, id) => N3.tit ? N3.tit(d, id) : id;
  const nomeCl = (d, k) => N3.classeNome ? N3.classeNome(d, k) : k;
  const alt = (id, texto) => ({ id, texto });
  const rows = d => C.linhasCandidatas(d), row = (d, id) => rows(d).find(r => r.id === id) || {};
  const opIni = d => rows(d).map(r => ({ id:r.id, label:`${r.id} · ${tit(d, r.id)}` }));
  const cen = (d, id) => C.cenario(d, id, { rows:rows(d) });
  const pol = (d, id) => C.custosPolitica(d, { rows:rows(d) }).find(p => p.id === id) || {};
  const ug = (d, ids) => { const o = {}; C.utilizacaoPorGerencia(d, ids, { rows:rows(d) }).forEach(g => o[g.gerenciaId] = g); return o; };
  const tab = (head, linhas) => `<div class="tbl-wrap pf3-qw"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const CLASSES = N3.CLASSES || ['NUCLEO', 'CONDICIONAL', 'HABILITADORA', 'RECYCLE', 'KILL'];

  /* ---------------------------------------------------------------- (a) conceituais (9; N3-C02 aprofundamento) */
  const conceituais = [
    { id:'N3-C01', titulo:'Pareto em valor × FTE', tipo:'conceito', formato:'mc', regra:'R30', conceito:'Fronteira de Pareto', ver:'#/n3/otimizador?aba=fronteira',
      enunciado:'Em valor (N) × FTE, quais candidatas são não dominadas?',
      alternativas:[alt('A', 'P01, P03, P06 e P07'), alt('B', 'P01, P03 e P06'), alt('C', 'Todas as oito candidatas'), alt('D', 'Só P01, a de maior valor')], correta:'B',
      dica:'Uma candidata é dominada quando outra tem valor maior ou igual usando FTE menor ou igual. Compare as que usam o mesmo FTE.',
      justificativa:d => { const f = C.paretoIniciativas(d, 'fte'), cu = C.paretoIniciativas(d, 'custo'), a = row(d, 'P03'), b = row(d, 'P07');
        return `<p>Em valor × FTE, a fronteira é <b>${esc(f.join(', '))}</b>. P03 (N ${n2(a.N)}; ${n1(a.fte)} FTE) domina P07 (N ${n2(b.N)}; ${n1(b.fte)} FTE): mesmo FTE, mais valor. Em valor × custo, a fronteira é ${esc(cu.join(', '))}: P07 entra porque é a mais barata. A fronteira depende do recurso escasso.</p>`; } },
    { id:'N3-C02', titulo:'AHP com CR alto', tipo:'conceito', formato:'mc', regra:'R30', conceito:'AHP e consistência', ver:'#/n3/sensibilidade?aba=ahp', aprofundamento:true,
      enunciado:'Uma matriz AHP 3×3 tem CR = 0,86. O que fazer?',
      alternativas:[alt('A', 'Usar os pesos assim mesmo, porque o CR só importa acima de 1'), alt('B', 'Arredondar os pesos para a dezena mais próxima e seguir'), alt('C', 'Refazer os julgamentos: CR ≥ 0,10 indica inconsistência'), alt('D', 'Remover o critério de menor peso da matriz e recalcular')], correta:'C',
      dica:'Procure o limite de consistência usado no AHP e o que ele indica sobre os julgamentos.',
      justificativa:d => { const m = (d.ahpExemplos || []).find(x => x.id === 'M2'), r = m ? C.ahp(m.matriz) : null;
        return `<p>${r ? `Na matriz M2 do caso, CR = <b>${n3(r.CR)}</b>. ` : ''}Os julgamentos formam um ciclo: C1 &gt; C2 &gt; C4 &gt; C1. Com CR ≥ 0,10 os pesos não são confiáveis: refaça as comparações antes de usar.</p>`; } },
    { id:'N3-C03', titulo:'Ranking muda, carteira não', tipo:'conceito', formato:'mc', regra:'R35', conceito:'Sensibilidade', ver:'#/n3/sensibilidade',
      enunciado:'Com w4 = 30%, P05 sobe no ranking, mas a carteira não muda. Como ler isso?',
      alternativas:[alt('A', 'A seleção resiste a essa mudança de peso, embora o ranking varie'), alt('B', 'A análise falhou, porque o ranking deveria ficar estável com qualquer peso'), alt('C', 'É preciso subir w4 até P05 entrar na carteira, para refletir a mudança'), alt('D', 'Os pesos v1 estão errados e devem ser trocados antes da recomendação')], correta:'A',
      dica:'Na Sensibilidade, compare o selo do ranking com o selo da seleção para w4 = 30%.',
      justificativa:d => { const s = C.sensibilidade(d, { C4:0.30 });
        return `<p>Com w4 = 30%, ρ = ${n3(s.rho)}: o ranking mudou, mas a seleção continua ${esc(s.selecao.join(', '))}. O que importa é a estabilidade da seleção. Subir w4 até P05 entrar seria manipulação; peso novo vira versão candidata (R35).</p>`; } },
    { id:'N3-C04', titulo:'Valor marginal em degraus', tipo:'conceito', formato:'mc', regra:'R30', conceito:'Valor marginal', ver:'#/n3/otimizador?aba=fronteira',
      enunciado:d => { const m = C.fronteira(d).marginal, a = m.find(x => x.de === 9.5) || {}, b = m.find(x => x.de === 10) || {};
        return `Por que ir de 9,5 para 10 FTE acrescenta ${n2(a.delta)}, e de 10 para 10,5 acrescenta ${n2(b.delta)}?`; },
      alternativas:[alt('A', 'Cada candidata entra inteira: só com 10,5 FTE passa a caber mais uma (P07)'), alt('B', 'O otimizador errou a conta nos dois casos e precisa ser recalculado'), alt('C', 'O orçamento acabou em 10 FTE, por isso o salto aparece só depois'), alt('D', 'Cada 0,5 FTE vale sempre o mesmo; a diferença é só arredondamento')], correta:'A',
      dica:'Abra a fronteira e veja quem entra em cada passo de +0,5 FTE.',
      justificativa:d => { const F = C.fronteira(d), p = f => F.pontos.find(x => x.fte === f) || { ids:[] }, ent = p(10.5).ids.filter(x => !p(10).ids.includes(x));
        return `<p>De 9,5 para 10 FTE a carteira continua ${esc(p(10).ids.join(', '))} (nada novo cabe em 0,5 FTE). Com 10,5 FTE entra ${esc(ent.join(', '))} (N ${n2(row(d, ent[0]).N)}). O valor marginal anda em degraus porque cada candidata entra inteira.</p>`; } },
    { id:'N3-C05', titulo:'Custo afundado', tipo:'conceito', formato:'mc', regra:'R30', conceito:'Custo afundado', ver:'#/n3/ciclo',
      enunciado:'Uma iniciativa gastou R$ 1,5 mi de 2,0. Faltam R$ 1,2 mi para um benefício restante de R$ 0,8 mi. “Já gastamos muito” justifica continuar?',
      alternativas:[alt('A', 'Sim, porque abandonar agora desperdiça os R$ 1,5 mi já gastos'), alt('B', 'Sim, se a iniciativa estiver alinhada a um objetivo estratégico'), alt('C', 'Depende do sinal (verde, amarelo ou vermelho) no último fórum'), alt('D', 'Não: compare o custo restante (1,2) com o valor restante (0,8)')], correta:'D',
      dica:'O R$ 1,5 mi já gasto volta, se a iniciativa continuar?',
      justificativa:'<p>Custo afundado: o gasto passado é irrecuperável e não entra na decisão. Olhando para frente, gastar 1,2 para obter 0,8 destrói valor. Continuar só se houver benefício além do estimado.</p>' },
    { id:'N3-C06', titulo:'FTE não é fungível', tipo:'conceito', formato:'mc', regra:'R26', conceito:'Capacidade local', ver:'#/n3/otimizador?aba=capacidade',
      enunciado:d => { const r = C.otimizar(d, { rows:rows(d) }), u = ug(d, r.ids);
        return `A C0 usa ${n1(r.fte)} de ${n1(r.cap)} FTE, mas a FEN fica em ${pc((u.FEN || {}).u, 0)} e a FEL em ${pc((u.FEL || {}).u, 0)}. Por que “mover 1 FTE da FEL para a FEN” não resolve automaticamente?`; },
      alternativas:[alt('A', 'Resolve sempre, porque FTE é uma unidade padrão em todas as áreas'), alt('B', 'FTE não é fungível; balancear entre áreas cabe ao Gerente de Área (s12)'), alt('C', 'Basta a FEL ceder 1 FTE por e-mail e atualizar a capacidade no sistema'), alt('D', 'É erro de cadastro; a FEN deveria ter mais capacidade registrada')], correta:'B',
      dica:'Uma pessoa de ferramentas elétricas faz o trabalho de ferramentas energéticas no dia seguinte?',
      justificativa:'<p>Competência elétrica não substitui energética. Balancear capacidade entre comunidades é atribuição do Gerente de Área (s12, proposta) e pode exigir tanque de terceiros (s165, proposta). O agregado esconde o local.</p>' },
    { id:'N3-C07', titulo:'Gate 2 de inovação', tipo:'conceito', formato:'mc', regra:'R31', conceito:'Gates de inovação', ver:'#/n3/valor?aba=inovacao',
      enunciado:'Uma iniciativa de inovação está alinhada às rotas tecnológicas, mas falta uma base de dados validada. O que o deck propõe (s189)?',
      alternativas:[alt('A', 'Encerrar a iniciativa e registrar as lições aprendidas (Gate 3)'), alt('B', 'Executar assim mesmo e tratar a falta da base de dados como risco'), alt('C', 'Transferir para a comunidade de entrega, que tem mais capacidade'), alt('D', 'Pausar formalmente, com justificativa e gatilho de reativação')], correta:'D',
      dica:'O impedimento é conjuntural: falta algo que pode chegar. Veja o exemplo de H01 na aba Inovação.',
      justificativa:d => { const x = (d.decisoes || []).find(z => z.id === 'DEC-002');
        return `<p>É o Gate 2 proposto: pausa formal com gatilho objetivo. ${x ? `No caso: ${esc(x.iniciativaId)} (${esc(x.id)}), gatilho “${esc(x.gatilhoReativacao)}”.` : ''} Proposta do deck (s189), a validar pela FEG.</p>`; } },
    { id:'N3-C08', titulo:'TRL 7 e 70/20/10', tipo:'conceito', formato:'mc', regra:'R31', conceito:'Horizontes e TRL', ver:'#/n3/valor?aba=inovacao',
      enunciado:'O deck cita a transferência para a entrega a partir do TRL 7 (s183) e a distribuição 70/20/10 entre horizontes (s209). Como o sistema trata essas referências?',
      alternativas:[alt('A', 'Como regra oficial do ONS, já aplicada nos cálculos'), alt('B', 'Como meta individual das analistas de portfólio'), alt('C', 'Como proposta do deck, que só vira regra se a FEG validar'), alt('D', 'Como ilustração sem nenhuma relação com o deck')], correta:'C',
      dica:'Abra a ficha da regra R31 e veja a origem e o status de validação.',
      justificativa:d => { const r = C.regra(d, 'R31');
        return `<p>É afirmação do deck usada como parâmetro: origem ${esc(r ? r.origemRegra : 'A_VALIDAR_FEG')}, status ${esc(r ? r.statusValidacao : 'A_VALIDAR')} (R31). Só vira regra com validação da FEG e documento aprovado.</p>`; } },
    { id:'N3-C09', titulo:'Custos não aditivos', tipo:'conceito', formato:'mc', regra:'R30', conceito:'Custo de restrição', ver:'#/n3/otimizador?aba=restricoes',
      enunciado:d => `A reserva de ${fmt.n(+C.param(d, 'R27') * 100)}% custa ${n2(pol(d, 'RESERVA').custo)} e a política de mix custa ${n2(pol(d, 'MIX').custo)}. Adotadas juntas, quanto custam?`,
      alternativas:[alt('A', '55,0, porque custos de restrição sempre se somam, uma a uma'), alt('B', '27,5: as duas levam à mesma carteira, então o custo não soma'), alt('C', '0, porque uma política anula o efeito da outra na carteira'), alt('D', '13,75, porque o custo combinado é a média das duas políticas')], correta:'B',
      dica:'No Otimizador, ligue as duas chaves juntas e compare o V* com o de cada uma sozinha.',
      justificativa:d => { const rm = pol(d, 'RESERVA_MIX'), dg = pol(d, 'DEP_GCAP'), dp = pol(d, 'DEP'), gc = pol(d, 'GCAP');
        return `<p>Reserva + mix custa <b>${n2(rm.custo)}</b>: as duas levam à carteira ${esc((rm.idsCom || []).join(', '))}. Já dependência + capacidade por gerência custa ${n2(dg.custo)}, mais que ${n2(dp.custo)} + ${n2(gc.custo)} = ${n2(dp.custo + gc.custo)}. Teste as políticas combinadas.</p>`; } },
  ];

  /* ---------------------------------------------------------------- (b) análise (9; AQ3-07/CPM fora da v1) */
  const analise = [
    { id:'AQ3-01', titulo:'Carteira se P08 ⇒ P02', tipo:'analise', formato:'multi', regra:'R24', conceito:'Restrição lógica', ver:'#/n3/otimizador?aba=restricoes',
      enunciado:'Qual a melhor carteira se a dependência P08 ⇒ P02 for confirmada? Marque as candidatas que entram.',
      opcoes:d => opIni(d), corretas:d => C.otimizar(d, { rows:rows(d), deps:[['P08', 'P02']] }).ids,
      dica:'No Otimizador, ligue a chave da dependência: se P08 entra, P02 precisa entrar junto.',
      justificativa:d => { const a = C.otimizar(d, { rows:rows(d) }), b = C.otimizar(d, { rows:rows(d), deps:[['P08', 'P02']] }), sai = a.ids.filter(x => !b.ids.includes(x)), ent = b.ids.filter(x => !a.ids.includes(x));
        return J({ r:`<b>${esc(b.ids.join(', '))}</b> (V* ${n2(b.valor)}; ${n1(b.fte)} FTE).`, c:`Otimizador exato com a restrição “se P08, então P02”: as ${fmt.n(b.avaliadas)} combinações, descartando as que têm P08 sem P02.`,
          l:`Em relação à C0 (${esc(a.ids.join(', '))}; ${n2(a.valor)}), sai ${esc(sai.join(', '))} e entra ${esc(ent.join(', '))}: levar P08 exigiria P02 (${n1(row(d, 'P02').fte)} FTE), e as duas juntas não cabem.`,
          k:'A dependência ainda está “a confirmar”: este é o cenário C1, não a carteira base.', p:'Calcule quanto essa dependência custa (AQ3-02).' }); } },
    { id:'AQ3-02', titulo:'Custo da dependência', tipo:'analise', formato:'num', regra:'R30', conceito:'Custo de restrição', ver:'#/n3/otimizador?aba=restricoes',
      enunciado:'Quanto custa a dependência P08 ⇒ P02, em pontos de valor?', unidade:'pontos', casas:2, tolerancia:0.05,
      calc:d => cen(d, 'C0').valor - cen(d, 'C1').valor,
      dica:'Custo = V*(sem a restrição) − V*(com a restrição). Compare C0 e C1.',
      justificativa:d => { const a = cen(d, 'C0'), b = cen(d, 'C1');
        return J({ r:`<b>${n2(a.valor - b.valor)}</b> pontos (${pc((a.valor - b.valor) / a.valor)} de V*).`, c:`V*(C0) ${n2(a.valor)} − V*(C1) ${n2(b.valor)}.`, l:'É o valor de priorização que se perde se a dependência for confirmada: P08 sai e P02 entra.',
          k:'Custo de restrição é em pontos de N, não em reais.', p:'Compare com o custo da política de mix (AQ3-03).' }); } },
    { id:'AQ3-03', titulo:'Custo do mix', tipo:'analise', formato:'num', regra:'R28', conceito:'Custo de restrição', ver:'#/n3/otimizador?aba=restricoes',
      enunciado:d => `Quanto custa impor D ≤ ${fmt.n(C.param(d, 'R28').toleranciaD * 100)} pp, em pontos de valor?`, unidade:'pontos', casas:2, tolerancia:0.05,
      calc:d => cen(d, 'C0').valor - cen(d, 'C4').valor,
      dica:'Compare o V* da C0 com o da C4 (mix), ou ligue a chave do mix no Otimizador.',
      justificativa:d => { const a = cen(d, 'C0'), b = cen(d, 'C4');
        return J({ r:`<b>${n2(a.valor - b.valor)}</b> pontos (${pc((a.valor - b.valor) / a.valor)}).`, c:`V*(C0) ${n2(a.valor)} − V*(C4) ${n2(b.valor)}; carteira C4: ${esc(b.ids.join(', '))} (D ${pp(b.D)}).`,
          l:'Para ter sustentação na carteira, entra P07 e sai P08: a política troca valor por equilíbrio.', k:'Adotar ou não é decisão da instância; o sistema mostra o preço.', p:'Veja se o custo muda quando a reserva também é adotada (N3-C09).' }); } },
    { id:'AQ3-04', titulo:'Núcleo robusto', tipo:'analise', formato:'multi', regra:'R32', conceito:'Robustez', ver:'#/n3/cenarios',
      enunciado:'Quais iniciativas estão no ótimo de todos os cenários C0–C6?',
      opcoes:d => opIni(d), corretas:d => { const r = C.robustez(d); return Object.keys(r.frequencia).filter(id => r.frequencia[id].pct >= 1 - 1e-9); },
      dica:'Na matriz iniciativa × cenário, procure as linhas com ✓ em C0 a C6.',
      onAnswer:(ok, v, d, rec) => { if(ok && rec && !rec.revelada) PF.award('m-robusto', 'Núcleo robusto'); },   /* gancho do core (§8.1) */
      justificativa:d => { const rr = (PF.state().respostas || {})['AQ3-04']; if(rr && rr.best && !rr.revelada) PF.award('m-robusto', 'Núcleo robusto');
        const r = C.robustez(d), t = Object.keys(r.frequencia).filter(id => r.frequencia[id].pct >= 1 - 1e-9);
        return J({ r:`<b>${esc(t.join(', '))}</b>: 7 de 7 cenários.`, c:`Frequência = nº de cenários C0–C6 com a candidata no ótimo ÷ 7. ${Object.keys(r.frequencia).map(id => `${id} ${pcx(r.frequencia[id].pct)}`).join(' · ')}.`,
          l:`São o núcleo robusto da recomendação (limiar ${pc(r.limiar, 0)}, R32).`, k:'C7 e C8 são políticas, fora da robustez: avalie pelo custo.', p:'Veja se P03 continua no núcleo quando C7 entra na conta (AQ3-10).' }); } },
    { id:'AQ3-05', titulo:'Limiar P05 × P06', tipo:'analise', formato:'num', regra:'R20', conceito:'Limiar de reversão', ver:'#/n3/sensibilidade',
      enunciado:'A partir de que peso de C4 (com os demais pesos reajustados na mesma proporção) a P05 passa a P06? Responda em %.', unidade:'%', casas:0, tolerancia:1,
      calc:d => C.limiarReversao(d, 'P05', 'P06', 'C4').limiar * 100,
      dica:'Na Sensibilidade, escolha C4, compare P05 com P06 e deslize o peso até as duas empatarem em S.',
      justificativa:d => { const L = C.limiarReversao(d, 'P05', 'P06', 'C4');
        return J({ r:`w4 &gt; <b>${pc(L.limiar, 0)}</b> (hoje ${pc(L.pesoAtual, 0)}).`, c:'Diferença S(P05) − S(P06) como função de w4, com os demais pesos reajustados na mesma proporção; o limiar é onde a diferença zera.',
          l:`O peso de C4 teria de ir de ${pc(L.pesoAtual, 0)} para mais de ${pc(L.limiar, 0)} para P05 passar P06: ${L.limiar > 2 * L.pesoAtual ? 'mais que o dobro, então a ordem é estável' : 'uma mudança pequena, então a ordem é frágil'}.`, k:'O limiar serve para medir estabilidade, não para escolher o peso que faz a favorita entrar.', p:'Repita para P05 × P03 (passo 3 do desafio).' }); } },
    { id:'AQ3-06', titulo:'Custo da capacidade local', tipo:'analise', formato:'num', regra:'R24', conceito:'Capacidade local', ver:'#/n3/otimizador?aba=capacidade',
      enunciado:'Quanto custa respeitar a capacidade de cada gerência (C7), em pontos de valor?', unidade:'pontos', casas:2, tolerancia:0.05,
      calc:d => cen(d, 'C0').valor - cen(d, 'C7').valor,
      dica:'Compare o V* da C0 com o da C7 (capacidade por gerência).',
      justificativa:d => { const a = cen(d, 'C0'), b = cen(d, 'C7'), sai = a.ids.filter(x => !b.ids.includes(x)), ent = b.ids.filter(x => !a.ids.includes(x));
        return J({ r:`<b>${n2(a.valor - b.valor)}</b> pontos (${pc((a.valor - b.valor) / a.valor)}).`, c:`V*(C0) ${n2(a.valor)} − V*(C7) ${n2(b.valor)}.`,
          l:`Saem ${sai.map(x => `${x} (${row(d, x).gerenciaId})`).join(' e ')}; entra ${esc(ent.join(', '))}. A FEN fica sem folga depois de P01 e a FEG não comporta P04.`,
          k:'É uma política (Gerentes de Área não cedem FTE), não uma incerteza: fica fora da robustez.', p:'Leve ao fórum as duas opções com custo explícito (DC3-04).' }); } },
    { id:'AQ3-08', titulo:'Benefício atrás da trajetória', tipo:'analise', formato:'pick', regra:'R30', conceito:'Benefício e trajetória', ver:'#/n3/valor',
      enunciado:'Qual benefício está abaixo da trajetória planejada?',
      opcoes:d => C.beneficiosResumo(d).filter(b => b.ultima).map(b => ({ id:b.id, label:`${b.id} · ${b.kpi}` })).concat([{ id:'AMBOS', label:'Os dois benefícios medidos' }, { id:'NENHUM', label:'Nenhum dos benefícios medidos' }]),
      correta:d => { const ab = C.beneficiosResumo(d).filter(b => b.ultima && b.situacao === 'ABAIXO').map(b => b.id); return ab.length === 1 ? ab[0] : ab.length ? 'AMBOS' : 'NENHUM'; },
      dica:'Compare o realizado com o planejado da trajetória na última medição, prestando atenção ao sentido do KPI.',
      justificativa:d => { const bs = C.beneficiosResumo(d).filter(b => b.ultima);
        return J({ r:bs.filter(b => b.situacao === 'ABAIXO').map(b => `<b>${esc(b.id)}</b> (${pc(b.realizacaoTrajetoria, 0)} da trajetória)`).join(', ') || 'nenhum',
          c:bs.map(b => `${esc(b.id)}: (${n1(b.ultima.realizado)} − ${n1(b.base)}) ÷ (${n1(b.ultima.planejado)} − ${n1(b.base)}) = ${pc(b.realizacaoTrajetoria, 0)}`).join('; ') + '.',
          l:'B01 vai bem em um KPI e mal no outro: a mesma iniciativa pode entregar parte do benefício.', k:'BEN-02 é “menor é melhor”: a fórmula funciona porque numerador e denominador ficam negativos.', p:'Registre uma ação para BEN-02 (passo 5 do desafio).' }); } },
    { id:'AQ3-09', titulo:'Linha de base de BEN-03', tipo:'analise', formato:'num', regra:'R30', conceito:'Dupla contagem de benefício', ver:'#/n3/valor',
      enunciado:'Qual deve ser a linha de base do benefício proposto por P03 (mesmo KPI de BEN-01, fase 2)? Responda em %.', unidade:'%', casas:0, tolerancia:0.5,
      calc:d => C.linhaBaseSugerida(d, 'BEN-03'),
      dica:'A fase 2 começa onde a fase 1 está hoje, não onde ela começou.',
      justificativa:d => { const b = C.beneficio(d, 'BEN-01'), p = (d.beneficios || []).find(x => x.id === 'BEN-03') || {};
        return J({ r:`<b>${n1(C.linhaBaseSugerida(d, 'BEN-03'))}</b>%.`, c:`Última medição realizada de BEN-01 (${esc(fmt.date(b.ultima.data))}): ${n1(b.ultima.realizado)}.`,
          l:`A proposta usa ${n1(p.linhaBase)}, a base da fase 1: contaria duas vezes o ganho que a fase 1 já entregou.`, k:'Mesmo KPI em duas iniciativas pede uma linha de base só, a mais recente.', p:'Corrija a linha de base de BEN-03 em Benefícios & Inovação, com justificativa.' }); } },
    { id:'AQ3-10', titulo:'P03 com C7 na conta', tipo:'analise', formato:'num', regra:'R32', conceito:'Robustez', ver:'#/n3/cenarios',
      enunciado:d => `Incluindo C7 na conta, qual a frequência de seleção de P03? Responda em %. Depois pense: com esse valor, P03 continua no núcleo (limiar de ${pc(C.param(d, 'R32').robustezNucleo, 0)})?`, unidade:'%', casas:1, tolerancia:0.5,
      calc:d => C.robustez(d, { incluir:['C7'] }).frequencia.P03.pct * 100,
      dica:'Conte em quantos dos 8 cenários (C0–C6 mais C7) P03 está no ótimo.',
      justificativa:d => { const f = C.robustez(d, { incluir:['C7'] }).frequencia.P03, lim = C.param(d, 'R32').robustezNucleo;
        return J({ r:`<b>${pcx(f.pct)}</b> (${f.n} de ${f.total}).`, c:'Frequência de P03 nos cenários C0–C6 mais C7.', l:`Continua acima de ${pc(lim, 0)}: segue no núcleo, mas com condicionante de capacidade da FEN.`,
          k:'C7 é política, não incerteza: olhe a frequência com e sem C7.', p:'Leve P03 ao ciclo como Núcleo com condicionante de capacidade (DC3-06).' }); } },
  ];

  /* ---------------------------------------------------------------- (c) decisão (5; DC3-03/opção real fora da v1) */
  const decisao = [
    { id:'DC3-01', titulo:'O que invalida o processo', tipo:'decisao', formato:'mc', regra:'R28', conceito:'Custo de política', ver:'#/n3/otimizador?aba=restricoes',
      enunciado:d => { const p = pol(d, 'MIX'); return `Impor D ≤ ${fmt.n(C.param(d, 'R28').toleranciaD * 100)} pp custa ${n2(p.custo)} pontos (${pc(p.pct)}). Qual conduta <b>invalida</b> o processo?`; },
      alternativas:[alt('A', 'Adotar a política e registrar o custo e o motivo'), alt('B', 'Não adotar e registrar o risco aceito (0% de sustentação), com revisão no próximo ciclo'), alt('C', 'Apresentar as duas opções, com os custos, ao fórum'), alt('D', 'Aumentar o peso de C4 até a sustentação entrar no ótimo')], correta:'D',
      dica:'Separe adotar (ou não) uma política com o custo registrado de mexer no critério de avaliação.',
      justificativa:'<p><i>P-hacking</i> decisório: mexer no peso até o resultado desejado aparecer invalida a régua. A, B e C são defensáveis se registradas, com o custo explícito.</p>' },
    { id:'DC3-02', titulo:'Dependência a confirmar', tipo:'decisao', formato:'mc', regra:'R24', conceito:'Restrição lógica', ver:'#/n3/ciclo',
      enunciado:d => { const fr = (d.foruns || []).find(x => x.id === 'FR-CICLO') || {}; return `P08 ⇒ P02 está “a confirmar” e o fórum simulado de planejamento é em ${fmt.date(fr.dataCorte)}. O que recomendar?`; },
      alternativas:[alt('A', 'Núcleo + P08 como Go condicionado à confirmação até uma data; confirmada, aplicar C1'), alt('B', 'Aprovar P08 sem P02 agora e deixar a confirmação da dependência para depois da aprovação'),
        alt('C', 'Aprovar P02 e P08 juntas, por segurança, mesmo sem a confirmação técnica da dependência'), alt('D', 'Recomendar Kill de P08, porque a dependência ainda é incerta e pode atrasar o ciclo inteiro')], correta:'A',
      dica:'O que acontece com a carteira se a dependência for confirmada depois? E quanto custa esperar a confirmação?',
      justificativa:d => { const nu = C.robustez(d).nucleo, f = id => row(d, id).fte || 0, fn = nu.reduce((s, id) => s + f(id), 0), cap = C.capacidadeTotal(d);
        return `<p>Condiciona sem travar: se a confirmação vier, aplica-se C1 (entra P02, sai P08) com o gatilho já registrado.</p>` + tab(['Alternativa', 'Feedback'], [
          ['A', 'Correta.'], ['B', 'Carteira possivelmente inviável: se a dependência for confirmada, P08 não funciona sem P02.'],
          ['C', `Núcleo (${n1(fn)}) + P02 (${n1(f('P02'))}) + P08 (${n1(f('P08'))}) = ${n1(fn + f('P02') + f('P08'))} FTE &gt; ${n1(cap)}: não cabe nem sem P04.`],
          ['D', `Descarta uma ostra de valor ${n2(row(d, 'P08').N)} por uma incerteza que se resolve com uma confirmação.`]]); } },
    { id:'DC3-04', titulo:'FEN e FEG estouram', tipo:'decisao', formato:'mc', regra:'R26', conceito:'Capacidade local', ver:'#/n3/otimizador?aba=capacidade',
      enunciado:d => { const r = C.otimizar(d, { rows:rows(d) }), u = ug(d, r.ids); return `Com capacidade por gerência, a FEN (${pc((u.FEN || {}).u, 0)}) e a FEG (${pc((u.FEG || {}).u, 0)}) estouram na C0. O que recomendar?`; },
      alternativas:[alt('A', 'Ignorar o estouro, porque no agregado ainda sobra 0,5 FTE para absorver a diferença'), alt('B', 'Mover 1 FTE da FEL para a FEN, que tem capacidade ociosa, e manter a carteira C0'), alt('C', 'Levar ao fórum duas opções com custo: recompor por gerência ou manter a C0 com condicionantes'), alt('D', 'Retirar P01 da carteira para aliviar a FEN, que está sobrecarregada, e seguir com o resto')], correta:'C',
      dica:'Veja a aba Capacidade local: olhe gerência por gerência e pense em quem arbitra conflitos entre áreas.',
      justificativa:d => { const b = cen(d, 'C7'), a = cen(d, 'C0');
        return `<p>Duas opções com custo explícito: recompor dentro das capacidades locais (V* ${n2(b.valor)}; −${n2(a.valor - b.valor)}) ou manter a C0 com condicionantes (sequenciar P03 após E05, escalonar P04 ou tanque, s165). O conflito de prioridade é arbitrado pelo Gerente Executivo (s71, proposta).</p>` +
          tab(['Alternativa', 'Feedback'], [['A', 'O agregado esconde o local.'], ['B', 'FTE não é fungível.'], ['C', 'Correta.'], ['D', 'P01 é obrigatória.']]); } },
    { id:'DC3-05', titulo:'Subir w4 até P05 entrar?', tipo:'decisao', formato:'multi', regra:'R35', conceito:'Pesos congelados', ver:'#/n3/sensibilidade',
      enunciado:'No comitê, depois de ver o resultado, alguém pede para subir w4 até P05 entrar. Marque as condutas corretas.',
      opcoes:d => { const L = C.limiarReversao(d, 'P05', 'P06', 'C4'), f = C.robustez(d).frequencia.P05 || {};
        return [{ id:'A', label:'Aceitar e reotimizar com o novo peso' }, { id:'B', label:`Recusar e mostrar o limiar de reversão (${pc(L.limiar, 0)}) e a robustez (P05 em ${f.n}/${f.total})` },
          { id:'C', label:'Abrir uma versão candidata de pesos, com justificativa, que não vale para a fotografia do ciclo' }, { id:'D', label:'Trocar o peso e registrar como correção de erro' }]; },
      corretas:() => ['B', 'C'],
      dica:'Abra a ficha da regra R35 (pesos do ciclo) e pense em como registrar uma proposta de peso sem mexer no ciclo atual.',
      justificativa:'<p>B e C (R35). Mudar o peso depois de ver o resultado é manipulação (A); não é erro de registro (D). Uma versão candidata, com justificativa, pode ser discutida para o próximo ciclo sem alterar a fotografia.</p>' },
    { id:'DC3-06', titulo:'Recomendação do ciclo', tipo:'decisao', formato:'custom', regra:'R32', conceito:'Recomendação do ciclo', ver:'#/n3/ciclo',
      enunciado:'Classifique P01–P08 para a recomendação do Ciclo Exemplo 2027 (ILUSTRATIVO). Conclui com pelo menos 6 de 8 pontos.',
      contexto:d => { const r = C.robustez(d), c0 = C.otimizar(d, { rows:rows(d) }), dl = C.depsLogicas(d);
        return tab(['Candidata', 'Freq. C0–C6', 'Na C0', 'Risco R', 'Mitigação', 'Dependência'], rows(d).map(x => [`<b>${esc(x.id)}</b> <small>${esc(x.gerenciaId)}</small>`, pcx((r.frequencia[x.id] || {}).pct), c0.ids.includes(x.id) ? 'sim' : 'não', fmt.n(x.R), x.acao ? 'sim' : '<b>não</b>',
          esc(dl.filter(z => z.includes(x.id)).map(z => z.join(' ⇒ ')).join(', ') || '—')])) + '<p class="dim" style="font-size:12.5px">Núcleo: robusta nos cenários. Condicional: depende de algo (confirmação, PoC, capacidade). Habilitadora: só vale se outra for confirmada. Recycle: volta menor e com mitigação.</p>'; },
      dica:'Comece pelo núcleo robusto (AQ3-04). Depois veja quem depende de confirmação, quem habilita outra e quem tem risco crítico sem mitigação.',
      render(el, d, answer){ const st = Object.assign({}, PF.ui_state('q:DC3-06', {}));
        el.innerHTML = `<div class="tbl-wrap pf3-qw"><table class="tbl"><thead><tr><th>Candidata</th><th>Classe</th></tr></thead><tbody>${rows(d).map(r => `<tr><td><b>${esc(r.id)}</b> <small>${esc(tit(d, r.id))}</small></td><td><select class="select" data-dc6="${r.id}" aria-label="Classe de ${r.id}"><option value="">Escolha…</option>${CLASSES.map(k => `<option value="${k}" ${st[r.id] === k ? 'selected' : ''}>${esc(nomeCl(d, k))}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>
          <div class="row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-dc6-ok>Responder</button></div>`;
        el.querySelectorAll('[data-dc6]').forEach(s => s.onchange = () => { st[s.dataset.dc6] = s.value; PF.set_ui('q:DC3-06', Object.assign({}, st)); });
        el.querySelector('[data-dc6-ok]').onclick = () => { const ids = rows(d).map(r => r.id); if(ids.some(id => !st[id])){ PF.toast('Classifique as oito candidatas antes de responder.'); return; }
          const r = C.avaliarRecomendacaoCiclo(d, st); PF.set_ui('q:DC3-06', {}); answer(r.ok, { classes:Object.assign({}, st), nota:r.nota }); }; },
      renderDone(el, d, rec){ const v = rec.val || {}, r = C.avaliarRecomendacaoCiclo(d, v.classes || {});
        if(!rec.ok && !rec.revelada){ el.innerHTML = `<p class="muted">Sua classificação fez <b>${fmt.n(r.nota, r.nota % 1 ? 1 : 0)} de ${r.max}</b> pontos (mínimo 6).</p>`; return; }
        el.innerHTML = tab(['Candidata', 'Sua classe', 'Pontos'], r.porIniciativa.map(x => [`<b>${esc(x.id)}</b>`, esc(nomeCl(d, x.escolhida)), fmt.n(x.pontos, x.pontos % 1 ? 1 : 0)])) + `<p class="muted">Total: <b>${fmt.n(r.nota, r.nota % 1 ? 1 : 0)} de ${r.max}</b>.</p>`; },
      gabarito:d => { const g = C.gabaritoCiclo(d); return tab(['Candidata', 'Classe-modelo', 'Também aceito (0,5)', 'Observação'], Object.keys(g).map(id => [`<b>${esc(id)}</b>`, esc(nomeCl(d, g[id].classe)), esc(Object.keys(g[id].aceitas).map(k => nomeCl(d, k)).join(', ') || '—'), esc(g[id].nota || '')])); },
      justificativa:(d, resp) => { const g = C.gabaritoCiclo(d), r = C.avaliarRecomendacaoCiclo(d, (resp && resp.classes) || {});
        return `<p>Sua nota: <b>${fmt.n(r.nota, r.nota % 1 ? 1 : 0)} de ${r.max}</b>. Modelo: Núcleo ${esc(Object.keys(g).filter(k => g[k].classe === 'NUCLEO').join(', '))} (P03 com condicionante de capacidade da FEN); Condicional ${esc(Object.keys(g).filter(k => g[k].classe === 'CONDICIONAL').join(', '))}; Habilitadora ${esc(Object.keys(g).filter(k => g[k].classe === 'HABILITADORA').join(', '))}; Recycle ${esc(Object.keys(g).filter(k => g[k].classe === 'RECYCLE').join(', '))} (fase 1 menor, registrando o risco de dívida técnica e de pessoa-chave). Kill em P05 vale 0.</p>`; } },
  ];

  PF.level(3).questions.push(...conceituais, ...analise, ...decisao);
})();
