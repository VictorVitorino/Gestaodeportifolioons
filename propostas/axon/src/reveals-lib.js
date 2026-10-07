/* =============================================================================
   reveals-lib.js · Biblioteca compartilhada de revelações R-01 … R-19
   Fonte: 02-roteiro-propostas.md, seção 1.9 (texto copiado, sem resumo).
   Expõe window.AxonReveals. Não depende do motor; o motor a consome.

   Formatos de renderização (opção `format`):
     'pop'     → popover (tabelas viram registros empilhados; portões interativos)
     'compact' → dentro do slide (ex.: verso de carta); sem títulos de linha
                 quando há uma única linha selecionada
     'annex'   → modo leitura e impressão (tabelas reais + registros para tela
                 estreita; portões estáticos; itens "só no modo leitura")
   Outras opções: pick ("Prontidão;Autonomia", "2", "@A6", "◆1", "G3"),
                  variant ('A' | 'B' | 'all'), part ('front' | 'back' | 'both').
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- utilidades ---------- */
  const strip = (s) => String(s == null ? '' : s).replace(/<[^>]+>/g, ' ');
  const norm = (s) => strip(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[“”"'‘’]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function splitPick(p) {
    if (p == null || p === '') return null;
    return String(p).split(/\s*;\s*/).map((x) => x.trim()).filter(Boolean);
  }

  /** Seleciona itens/linhas por chave, índice (1…n) ou filtro de deck (@A6). */
  function pickFrom(list, pick, keyOf, ctx) {
    const ps = splitPick(pick);
    if (!ps) return list.slice();
    const out = [];
    const add = (x) => { if (x && !out.includes(x)) out.push(x); };
    for (const p of ps) {
      if (p[0] === '@') {
        const d = p.slice(1).toUpperCase();
        list.forEach((x) => { if ((x.decks || []).includes(d)) add(x); });
        continue;
      }
      if (/^\d+$/.test(p)) { add(list[Number(p) - 1]); continue; }
      const np = norm(p);
      const hit = list.find((x) => norm(keyOf(x)) === np)
        || list.find((x) => norm(keyOf(x)).startsWith(np))
        || list.find((x) => norm(keyOf(x)).includes(np));
      if (hit) add(hit);
      else console.warn('[AxonReveals] ' + ctx + ': seleção sem correspondência: "' + p + '"');
    }
    return out;
  }

  /* ---------- renderizadores compartilhados ---------- */
  function sub(t) { return t ? '<p class="rv-sub">' + t + '</p>' : ''; }

  function recs(cols, rows, showKey) {
    return '<div class="rv-recs">' + rows.map((r) =>
      '<div class="rv-rec">' + (showKey ? '<p class="rv-rec-k">' + r.cells[0] + '</p>' : '') +
      '<dl>' + cols.slice(1).map((c, i) => '<dt>' + c + '</dt><dd>' + r.cells[i + 1] + '</dd>').join('') + '</dl></div>'
    ).join('') + '</div>';
  }

  function table(cols, rows) {
    return '<div class="rv-tbl-wrap"><table class="rv-tbl"><thead><tr>' +
      cols.map((c) => '<th scope="col">' + c + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r) => '<tr' + (r.em ? ' class="is-em"' : '') + '>' + r.cells.map((c, i) =>
        i === 0 ? '<th scope="row">' + c + '</th>' : '<td>' + c + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }

  /** Entrada do tipo tabela: { cols, rows:[{cells, decks?, em?}], sub? } */
  function renderTable(e, o) {
    const rows = pickFrom(e.rows, o.pick, (r) => r.key || r.cells[0], e.code);
    const single = rows.length === 1;
    if (o.part && o.part !== 'both' && o.format !== 'annex') {
      // uma coluna só (ex.: data-part="Fórmula" no verso de um tile)
      const ci = e.cols.findIndex((c) => norm(c) === norm(o.part));
      if (ci > 0) {
        return rows.map((r) => (single ? '' : '<p class="rv-rec-k">' + r.cells[0] + '</p>') +
          '<p class="rv-cell">' + r.cells[ci] + '</p>').join('');
      }
      console.warn('[AxonReveals] ' + e.code + ': coluna desconhecida em data-part: "' + o.part + '"');
    }
    if (o.format === 'annex') {
      return sub(e.sub) + table(e.cols, rows) + recs(e.cols, rows, true);
    }
    if (o.format === 'compact') {
      return recs(e.cols, rows, !single);
    }
    return (single ? '' : sub(e.sub)) + recs(e.cols, rows, true);
  }

  /* ---------- portões (R-16) ---------- */
  function gateHTML(g, interactive, noHead) {
    let i = 0;
    const li = (t) => interactive
      ? '<li><label><input type="checkbox" data-i="' + (i++) + '"><span class="gate-txt">' + t + '</span></label></li>'
      : '<li><span class="gate-box" aria-hidden="true"></span><span class="gate-txt">' + t + '</span></li>';
    const glyph = g.code.charAt(0) === '◆';
    let h = '<div class="gate' + (interactive ? '' : ' gate--static') + '" data-gate="' + esc(g.code) + '">' +
      (noHead ? '' : '<p class="gate-head">' + (glyph ? '' : '<span class="diamond" aria-hidden="true"></span>') +
      '<span class="gate-code">' + (glyph ? '<span class="gate-glyph">◆</span>' + g.code.slice(1) : g.code) + '</span><span class="gate-name">' + g.name + '</span></p>');
    if (g.keys) {
      h += '<p class="gate-sub">Três chaves</p><ol class="gate-list gate-list--keys">' + g.keys.map(li).join('') + '</ol>';
      h += '<p class="gate-sub">Mais</p>';
    }
    h += '<ul class="gate-list">' + g.items.map(li).join('') + '</ul>';
    if (interactive) h += '<p class="gate-status" aria-live="polite"></p>';
    return h + '</div>';
  }

  /* ===========================================================================
     CONTEÚDO (roteiro, seção 1.9)
     ======================================================================== */
  const LIB = {

    'R-01': {
      title: 'Evidências do MVP', w: 380,
      items: [
        { key: 'mvp', html: 'MVP em produção com 2 times pioneiros (ex.: Hidrologia).' },
        { key: 'teste', html: 'Teste reportado: 176&nbsp;mil casos em ~2&nbsp;h, contra ~3&nbsp;dias estimados no processo atual.' },
        { key: 'ambicao', html: 'Ambição: ~150 usuários em 6 a 12 meses.' },
        { key: 'custo', html: 'Custo por rodada visível antes de executar (exemplo citado: menos de US$&nbsp;0,01 em fan-out).' }
      ],
      render(o) {
        const its = pickFrom(this.items, o.pick, (x) => x.key, 'R-01');
        return '<p class="rv-flag">Informado pelo time do produto, a validar no diagnóstico.</p>' +
          '<ul class="rv-facts">' + its.map((x) => '<li>' + x.html + '</li>').join('') + '</ul>' +
          '<p>No diagnóstico, esses indícios viram linha de base medida.</p>';
      }
    },

    'R-02': {
      title: 'Por que mielina?', w: 360,
      render() {
        return '<p>O axônio conduz o impulso entre neurônios. A mielina é a bainha que o envolve: acelera a condução e evita a perda de sinal. O Axon já conduz; a gestão de mudanças é a mielina, o que faz o novo jeito de trabalhar chegar rápido e sem perda a cada pessoa. E, como na biologia, ela se forma com uso repetido: prática, não apresentação.</p>';
      }
    },

    'R-03': {
      title: 'Por que sistema nervoso?', w: 360,
      render() {
        return '<p>O TMO é a mielina mais a coordenação central. Além de acelerar a adoção, sincroniza os sinais que vêm do produto, das pessoas e dos legados. As ondas funcionam como a condução saltatória: o impulso salta de nódulo em nódulo. Cada onda é um nódulo; cada portão, um salto autorizado. Nada salta sem que os três sinais estejam prontos.</p>';
      }
    },

    'R-04': {
      title: 'Fórmulas e fontes dos indicadores', w: 420, kind: 'table',
      sub: 'Linha de base, metas e periodicidade pactuadas no diagnóstico.',
      cols: ['Indicador', 'Fórmula', 'Fonte'],
      rows: [
        { cells: ['Prontidão', 'Pessoas da onda com critérios ADKAR atendidos ÷ pessoas da onda × 100', 'Pulso anônimo e checklist por onda'], decks: ['A6'] },
        { cells: ['Adoção efetiva', 'Rodadas elegíveis executadas no Axon ÷ total de rodadas elegíveis × 100', 'Registros de execução + inventário do diagnóstico'], decks: ['A6', 'B3'] },
        { cells: ['Autonomia', 'Pessoas aprovadas na prova prática sem apoio ÷ pessoas capacitadas × 100', 'Avaliação prática por perfil'], decks: ['A6'] },
        { cells: ['Protagonismo', 'Pessoas de legado com novo papel ativo ÷ pessoas de legado mapeadas × 100', 'Rotas 4R pactuadas'], decks: ['A6'] },
        { cells: ['Tempo por processo', '(Tempo de ciclo na linha de base − tempo de ciclo no Axon) ÷ tempo de ciclo na linha de base × 100, por processo', 'Cronometragem no diagnóstico + rodadas espelho + registros do Axon'], decks: ['A6', 'B3', 'B5'] },
        { cells: ['Sombra no legado', 'Rodadas repetidas no legado “por garantia” ÷ rodadas no Axon × 100 (quanto menor, melhor)', 'Registros dos dois ambientes'], decks: ['A6'] },
        { cells: ['Times ativos', 'Times com ao menos uma rodada própria no período ÷ times previstos na onda × 100', 'Registros de execução por projeto'], decks: ['B3'] },
        { cells: ['Inquietações e respostas', 'Abertas, em análise e resolvidas, por tipo (bug, dúvida, ideia, receio); tempo até a primeira resposta', 'Radar de Inquietações'], decks: ['B3'] },
        { cells: ['Você disse, nós fizemos', 'Inquietações com resposta publicada ÷ inquietações recebidas × 100', 'Backlog'], decks: ['B3'] },
        { cells: ['Qualidade das rodadas', 'Rodadas com divergência ou reexecução ÷ rodadas executadas × 100', 'Registros de execução e chamados'], decks: ['B5'] },
        { cells: ['Desvio de custo por rodada', '|Custo realizado − custo previsto| ÷ custo previsto × 100', 'Custo por rodada exibido no Axon'], decks: ['B3', 'B5'] },
        { cells: ['Consumo do orçamento', 'Custo realizado no período ÷ orçamento do time no período × 100', 'Orçamento configurado no Axon'], decks: ['B5'] },
        { cells: ['Funções de legado absorvidas', 'Funções do legado executadas no Axon ÷ funções inventariadas × 100', 'Inventário de legados + atas do comitê'], decks: ['B5'] }
      ],
      render(o) { return renderTable(this, o); }
    },

    'R-05': {
      title: 'Trilhas por perfil e prova de autonomia', w: 420, kind: 'table',
      sub: 'Formato comum: escada Ver › Fazer junto › Fazer sozinho › Ensinar; aprender migrando um estudo real do próprio time.',
      cols: ['Trilha', 'Módulos', 'Prova de autonomia'],
      rows: [
        { key: 'Construtor', cells: ['Construtor', 'Padrão de documentação do container; contrato de entrada e saída; builds, logs e segurança; versionamento; “documentação = realidade do código”.', 'Publicar um container documentado cuja caixinha rode num pipeline real.'] },
        { key: 'Arquiteto de estudos', cells: ['Arquiteto de estudos', 'Pipeline low code; tela de parâmetros (faixa, número, seleção, data, texto, tabela); duplicar e salvar estudos; copiloto de IA com revisão.', 'Migrar um estudo do próprio time, substituindo os arquivos de definição.'] },
        { key: 'Executor', cells: ['Executor', 'Executar; acompanhar status; entender um erro; achar a saída (download, catálogo, Axon Drive); reportar no Radar.', 'Rodar sozinho o estudo da rotina e localizar a saída.'] },
        { key: 'Consulta', cells: ['Consulta', 'Axon Drive; catálogo de dados corporativo; permissões por projeto.', 'Encontrar o resultado de um estudo sem pedir a ninguém.'] },
        { key: 'Gestor de orçamento', cells: ['Gestor de orçamento', 'Custo por rodada; escolha de máquina; fan-out consciente; orçamento mensal e anual; leitura de desvio.', 'Configurar o orçamento do time e explicar um desvio.'] },
        { key: 'Rede Sinapse', em: true, cells: ['<em>Rede Sinapse (transversal)</em>', 'Facilitação de clínicas; escuta e registro de inquietações; primeira linha de dúvida.', 'Conduzir uma clínica com o próprio time.'] },
        { key: 'Liderança', em: true, cells: ['<em>Liderança (transversal)</em>', 'Conversa de transição; patrocínio visível; reconhecimento; leitura do Axon Live.', 'Pactuar as rotas 4R do time com Pessoas/RH.'] }
      ],
      render(o) {
        const single = splitPick(o.pick) && splitPick(o.pick).length === 1;
        if (o.format === 'pop' && single) return '<p class="rv-sub">' + this.sub + '</p>' + renderTable(this, o);
        return renderTable(this, o);
      }
    },

    'R-06': {
      title: 'Mito × Fato', w: 380, kind: 'myths',
      items: [
        { front: '“Vou perder meu posicionamento.”', back: 'Quem domina o legado é quem melhor ensina o Axon: vira Guardião, valida a equivalência e assina os casos de teste. Autoria é posicionamento. Cenários de quadro só com evidência, pela liderança e por Pessoas/RH.' },
        { front: '“Vão desligar meu sistema amanhã.”', back: 'Desligamento gradual, função por função, depois de autonomia comprovada e de rodadas espelho aceitas. Precedente interno: o Workfront absorveu sistemas satélites aos poucos.' },
        { front: '“A IA vai decidir por mim.”', back: 'A IA, via MCP, preenche parâmetros quando você pede. Você revisa, aprova e continua respondendo pelo estudo.' },
        { front: '“Orçamento de nuvem não é comigo.”', back: 'Cada time passa a ver o custo por rodada e a gerir o próprio orçamento. Antes disso, trilha de gestor de orçamento e orçamento de treino.' },
        { front: '“Low code é para quem não sabe modelar.”', back: 'O low code tira o repetitivo; o conhecimento do modelo continua sendo o diferencial, e o contrato que o construtor escreve vira a caixinha que todos usam.', readingOnly: true }
      ],
      render(o) {
        const base = splitPick(o.pick) ? this.items : this.items.filter((x) => !x.readingOnly || o.format === 'annex');
        const its = pickFrom(base, o.pick, (x) => x.front, 'R-06');
        const part = o.part || 'both';
        if (part === 'back') return its.map((x) => '<p class="rv-myth-b">' + x.back + '</p>').join('');
        if (part === 'front') return its.map((x) => '<p class="rv-myth-f">' + x.front + '</p>').join('');
        return '<div class="rv-myths">' + its.map((x) =>
          '<div class="rv-myth"><p class="rv-myth-f">' + x.front + '</p><p class="rv-myth-b">' + x.back + '</p></div>').join('') + '</div>';
      },
      readingOnly() {
        return this.items.filter((x) => x.readingOnly).map((x) => ({
          label: x.front, title: 'Mito × Fato',
          html: '<p class="rv-myth-b">' + x.back + '</p>', match: x.front
        }));
      }
    },

    'R-07': {
      title: 'Três perguntas por perfil', w: 420, kind: 'table',
      cols: ['Perfil', 'Deixa de fazer', 'Passa a fazer', 'Precisa aprender'],
      rows: [
        { cells: ['Operam rodadas e mantêm legados', 'Rodar, atualizar e conferir manualmente', 'Guardião do Legado; arquiteto de estudos; mais tempo de análise', 'Contratos de entrada e saída, pipelines, critérios de equivalência'] },
        { cells: ['Preparam estudos de vez em quando', 'Editar arquivos de definição', 'Montar estudos na tela de parâmetros, duplicar, revisar a IA', 'Tela de parâmetros, pipelines, copiloto'] },
        { cells: ['Só executam e conferem', 'Disparos manuais e conferência solta', 'Executar e acompanhar com poucos cliques', 'Rodar, ler status e erro, achar as saídas'] },
        { cells: ['Consultam resultados', 'Pedir arquivo a alguém', 'Buscar no Axon Drive e no catálogo de dados corporativo', 'Onde está, quem tem acesso'] },
        { cells: ['Constroem modelos e containers', 'Manter interface e configuração próprias por sistema', 'Publicar containers documentados que viram caixinhas arrastáveis', 'Padrão de documentação, contratos, builds, logs, segurança'] },
        { cells: ['Gerem orçamento de nuvem', 'Conviver com custo invisível', 'Definir e acompanhar o orçamento do time', 'Custo por rodada, escolha de máquina, fan-out'] },
        { cells: ['Agentes do setor (externos)', 'Receber ligações e e-mails de validação', 'Receber o retorno automático via Caixa de Entrada', 'Ler o novo relatório, no mesmo canal'] }
      ],
      render(o) { return renderTable(this, o); }
    },

    'R-08': {
      title: 'Rodada espelho', w: 380,
      render(o) {
        return (o.format === 'compact' ? '' : sub('Protocolo')) + '<ol class="rv-steps">' +
          '<li>O time escolhe <strong>seu</strong> primeiro processo a espelhar.</li>' +
          '<li>O Guardião do Legado define os casos de teste, inclusive as exceções que só ele conhece.</li>' +
          '<li>O mesmo estudo roda no sistema atual e no Axon, com registro do tempo de ciclo nos dois.</li>' +
          '<li>O Guardião aceita ou devolve o resultado. Testa-se o sistema, nunca a pessoa.</li>' +
          '<li>Aceite registrado: o processo acende no Axon Live, o tempo por processo entra no painel e o critério de desligamento avança.</li>' +
          '</ol>';
      }
    },

    'R-09': {
      title: 'Passagem de bastão', w: 400,
      render(o) {
        return (o.format === 'compact' ? '' : sub('Desligamento gradual de um legado ou função')) + '<ol class="rv-steps">' +
          '<li>Inventário de funções do legado, feito com quem o mantém (escuta, não auditoria).</li>' +
          '<li>Memória do Legado: exceções, regras implícitas e “pulos do gato” registrados com autoria.</li>' +
          '<li>Convivência com fim combinado: sombra no legado em queda e autonomia comprovada.</li>' +
          '<li>Última rodada em paralelo, conferida pelo Guardião.</li>' +
          '<li>Desligamento da função, com crédito público a quem a manteve e o novo papel dela já ativo.</li>' +
          '</ol><p class="rv-note"><em>Precedente interno: o Workfront absorveu aos poucos as responsabilidades de sistemas satélites, com business case de desligamento ao longo do ano. Calendário sempre sujeito à validação técnica.</em></p>';
      }
    },

    'R-10': {
      title: 'Radar de Inquietações', w: 400,
      render(o) {
        return (o.format === 'compact' ? '' : sub('Um botão, quatro vozes')) +
          '<p>O reporte de bug que já existe (captura de sessão, print, versão, link e área, com triagem por agente de IA e aprovação humana antes da produção) ganha três novas vozes: dúvida, ideia e receio.</p>' +
          '<ul class="rv-voices">' +
          '<li><strong>Bug</strong> segue a esteira atual do produto.</li>' +
          '<li><strong>Dúvida</strong> vira resposta ou receita no Guia de Bolso.</li>' +
          '<li><strong>Ideia</strong> vira item de backlog.</li>' +
          '<li><strong>Receio</strong> vira ação de mudança (conversa, ajuste de plano, Mito × Fato).</li>' +
          '</ul><p>Toda resposta volta ao Axon Live: “você disse, nós fizemos”.</p>';
      }
    },

    'R-11': {
      title: 'Copiloto de parâmetros (IA via MCP)', w: 400, selo: 'ilustrativo',
      render() {
        return '<ul class="rv-frames">' +
          '<li><span class="rv-frame-k">Quadro 1</span>A pessoa digita “Rodar o estudo de previsão de carga para o próximo mês, com o horizonte padrão”.</li>' +
          '<li><span class="rv-frame-k">Quadro 2</span>Os campos de data, horizonte e seleção se preenchem, com custo estimado visível.</li>' +
          '<li><span class="rv-frame-k">Quadro 3</span>Botão “Revisar e aprovar”.</li>' +
          '</ul><p><strong>Regras:</strong> a IA propõe, a pessoa aprova; nenhuma rodada parte sem confirmação; uso opcional e registrado; regras de segurança e de dados definidas com a TI antes da Onda 0.</p>';
      }
    },

    'R-12': {
      title: 'Guia de Bolso do Axon', w: 380,
      render() {
        return '<div class="rv-cover"><span class="rv-cover-t">Guia de Bolso do Axon</span><span class="rv-cover-s">manual friendly</span></div>' +
          '<p>Não é manual técnico: responde “o que muda para mim”.</p>' +
          '<p class="rv-k">Sumário</p><ol class="rv-toc">' +
          '<li>O que muda na sua semana, uma página por perfil</li>' +
          '<li>Suas primeiras receitas: duplicar um estudo, ajustar um parâmetro, rodar, achar o resultado</li>' +
          '<li>Quanto custa sua rodada</li>' +
          '<li>Peça ajuda à IA, e quando não pedir</li>' +
          '<li>Tenho uma inquietação</li>' +
          '<li>Quem decide o quê na transição</li>' +
          '<li>O que não muda</li>' +
          '</ol><p>Vive dentro do Axon (botão “?”) e em versão de bolso para oficinas.</p>';
      }
    },

    'R-13': {
      title: '4R: o que a pessoa sente e o que a liderança faz', w: 420, kind: 'table',
      sub: 'Bridges aplicado',
      cols: ['R', 'Tempo de Bridges', 'O que a pessoa sente', 'O que a liderança faz'],
      rows: [
        { cells: ['Reconhecer', 'Finais', 'Perda, apego ao domínio do legado, medo de irrelevância', 'Nomeia o que termina, honra quem construiu, conversa antes de qualquer anúncio'] },
        { cells: ['Requalificar', 'Zona neutra', 'Confusão, queda de ritmo, mas também criatividade', 'Protege tempo de prática, aceita erro, mantém o paralelo com fim combinado'] },
        { cells: ['Realocar', 'Novos começos', 'Insegurança sobre o novo lugar', 'Constrói a rota com Pessoas/RH, com evidência e conversa individual'] },
        { cells: ['Reinventar', 'Novos começos', 'Energia, nova identidade profissional: do “eu rodo” ao “eu desenho, valido e analiso”', 'Reconhece em público, consolida papéis, celebra a primeira rodada solo'] }
      ],
      render(o) { return renderTable(this, o); }
    },

    'R-14': {
      title: 'Ficha de impacto', w: 400,
      fields: ['Gerência', 'perfil', 'atividade', 'sistema ou legado', 'hoje × amanhã', 'o que permanece', 'intensidade', 'pessoas e papéis', 'criticidade operacional', 'ação', 'responsável', 'evidência de tratamento'],
      tmo: ['legado relacionado', 'onda'],
      render(o) {
        const tmo = o.variant === 'B' || o.variant === 'all';
        const f = (k, cls) => '<div class="rv-ficha-f' + (cls ? ' ' + cls : '') + '"><span class="rv-ficha-k">' + k + '</span><span class="rv-ficha-v">—</span></div>';
        return '<p class="rv-selo-line"><span class="selo">a preencher com evidência no diagnóstico</span></p>' +
          '<div class="rv-ficha">' + this.fields.map((k) => f(k)).join('') + (tmo ? this.tmo.map((k) => f(k, 'is-tmo')).join('') : '') + '</div>' +
          (tmo ? '<p class="rv-note"><em>No TMO, dois campos a mais, em laranja: legado relacionado · onda.</em></p>' : '');
      }
    },

    'R-15': {
      title: 'Riscos de pessoas', w: 420, kind: 'table',
      sub: 'Hipótese → resposta proposta → evidência de tratamento',
      cols: ['Hipótese de risco', 'Resposta proposta', 'Evidência de tratamento'],
      rows: [
        { cells: ['Receio de perder posicionamento', 'Papel de Guardião nomeado antes de qualquer desligamento; crédito público de autoria', 'Pessoas de legado com papel ativo'] },
        { cells: ['Perda de conhecimento tácito', 'Memória do Legado; exceções viram casos de teste assinados', 'Rotinas críticas transferidas e aceitas'] },
        { cells: ['Sobrecarga na convivência', 'Capacidade planejada por onda; paralelo com fim combinado', 'Ondas validadas com as lideranças'] },
        { cells: ['Controles paralelos que não se desligam', 'Medir a sombra no legado; encerrar cópias com o dono do processo', 'Controles paralelos encerrados'] },
        { cells: ['Quem não quer mudar', 'Conversa individual com liderança e Pessoas/RH; tempo, mentoria em dupla e alternativas reais', 'Plano individual pactuado e documentado'] }
      ],
      render(o) { return renderTable(this, o); }
    },

    'R-16': {
      title: 'Portões', w: 400, kind: 'gates',
      A: [
        { code: '◆1', name: 'Antes da Onda 0', items: ['linha de base de tempo medida', 'ambiente, acessos e permissões prontos', 'casos de teste definidos com os Guardiões', 'regras de uso da IA validadas com a TI'] },
        { code: '◆2', name: 'Antes de cada onda', items: ['autonomia validada por perfil', 'Rede Sinapse ativa na gerência', 'inquietações críticas respondidas', 'agentes do setor comunicados, quando aplicável'] },
        { code: '◆3', name: 'Antes de desligar um legado', items: ['rodadas espelho aceitas pelos Guardiões', 'sombra no legado em queda', 'controles paralelos encerrados', 'recomendação levada ao patrocínio (a decisão técnica é do ONS)'] }
      ],
      B: [
        { code: 'G0', name: 'Piloto', items: ['linha de base de tempo e custo medida', 'ambiente, acessos e permissões prontos', 'cenários de prática definidos', 'responsáveis nomeados'] },
        { code: 'G1', name: 'Onda', items: ['autonomia validada em cenários críticos por perfil', 'suporte e escalonamento definidos', 'funcionalidades da onda liberadas pelo produto', 'públicos comunicados, inclusive agentes do setor'] },
        { code: 'G2', name: 'Paralelo', items: ['mesmos estudos rodados no Axon e no legado pelos ciclos acordados', 'divergências explicadas ou corrigidas', 'aceite dos Guardiões e do dono do processo'] },
        { code: 'G3', name: 'Desligamento', keys: ['A função está coberta pelo produto', 'As pessoas estão capacitadas e com rota 4R pactuada', 'A evidência foi aceita'], items: ['interfaces migradas', 'plano de reversão testado', 'aceite do dono do processo, da TI e do patrocinador'] },
        { code: 'G4', name: 'Sustentação', items: ['período de observação concluído sem divergência aberta', 'indicadores estáveis', 'lições registradas'] }
      ],
      all() { return this.A.concat(this.B); },
      find(code) { const n = norm(code); return this.all().find((g) => norm(g.code) === n || norm(g.code).replace('◆', '') === n); },
      /** Um único portão selecionado: o título vira "Portão G3 · Desligamento" (o cabeçalho interno sai do popover). */
      single(o) { const ps = splitPick(o && o.pick); return ps && ps.length === 1 ? this.find(ps[0]) || null : null; },
      titleFor(o) { const g = this.single(o); return g ? 'Portão ' + g.code + ' · ' + g.name : this.title; },
      render(o) {
        let list;
        const ps = splitPick(o.pick);
        if (ps) list = ps.map((p) => this.find(p)).filter(Boolean);
        else list = o.variant === 'B' ? this.B : o.variant === 'all' ? this.all() : this.A;
        if (ps && !list.length) console.warn('[AxonReveals] R-16: portão desconhecido: ' + o.pick);
        const interactive = o.format === 'pop';
        const noHead = interactive && list.length === 1 && !!this.single(o);
        return list.map((g) => gateHTML(g, interactive, noHead)).join('');
      }
    },

    'R-17': {
      title: 'RAID vivo', w: 420, kind: 'table',
      sub: 'Hipóteses iniciais; dono indicado',
      cols: ['Item', 'Resposta', 'Dono · evidência'],
      rows: [
        ['R', 'Roadmap fora do ritmo das ondas', 'Onda só dispara com funcionalidade liberada (G1); replanejamento quinzenal', 'PMO + produto · portões cumpridos'],
        ['R', 'Demanda acima da capacidade do produto', 'Funil-escudo; dúvidas resolvidas com receitas; prioridade por onda', 'PMO · tempo de resposta do backlog acompanhado'],
        ['R', 'Divergência de resultados no paralelo', 'Mais ciclos antes do G2; Guardiões explicam exceções', 'PMO + GMO · aceite registrado'],
        ['R', 'Receio de perder posicionamento', 'Guardiões, Memória do Legado e crédito público', 'GMO · rotas 4R pactuadas'],
        ['R', 'Custo de nuvem fora do previsto em rodadas massivas', 'Orçamento de treino, alertas e trilha de gestor de orçamento', 'GMO + times · previsto × realizado por time'],
        ['R', 'Segurança e uso de IA', 'A IA propõe, a pessoa aprova; regras definidas com a TI', 'PMO + TI · aprovações registradas'],
        ['A', 'Premissas', 'Patrocínio ativo; donos de processo disponíveis para os portões', 'Patrocínio'],
        ['I', 'Problemas', 'Registrados a partir da execução', 'TMO'],
        ['D', 'Dependências', 'Capacidade do time do produto; ambientes e segurança (TI); decisões de Pessoas/RH; comunicação com agentes do setor via Caixa de Entrada; integrações futuras (ex.: Organon)', 'TMO']
      ].map((r) => ({ key: r[1], letter: r[0], cells: ['<span class="rv-raid">' + r[0] + '</span> ' + r[1], r[2], r[3]] })),
      render(o) { return renderTable(this, o); }
    },

    'R-18': {
      title: 'Pautas de governança', w: 400,
      items: [
        { key: 'Semanal', label: { A: 'Semanal · Execução', B: 'Semanal · Execução' },
          pauta: { A: 'uso, inquietações da semana, incidentes, ações', B: 'uso, inquietações da semana, incidentes, ações' },
          part: { A: 'GMO e Rede Sinapse', B: 'TMO, Rede Sinapse e dono do produto' } },
        { key: 'Quinzenal', label: { A: 'Quinzenal · Adoção', B: 'Quinzenal · Produto e adoção' },
          pauta: { A: 'prontidão, impactos, rotas 4R, orçamento de nuvem e regras de uso da IA', B: 'prontidão, impactos, rotas 4R, orçamento de nuvem e regras de uso da IA; backlog priorizado e RAID' },
          part: { A: 'gerências, produto, TI e Pessoas/RH', B: 'gerências, produto, TI e Pessoas/RH' } },
        { key: 'Mensal', label: { A: 'Mensal · Patrocínio', B: 'Mensal · Comitê' },
          pauta: { A: 'ondas, riscos e transição', B: 'portões, ondas, desligamentos e benefícios' } }
      ],
      render(o) {
        const its = pickFrom(this.items, o.pick, (x) => x.key, 'R-18');
        const vs = o.variant === 'all' ? ['A', 'B'] : [o.variant === 'B' ? 'B' : 'A'];
        const one = (x, v, tag) => '<div class="rv-gov"><p class="rv-gov-h">' + (tag ? '<span class="rv-gov-tag">' + tag + '</span>' : '') + x.label[v] + '</p>' +
          '<p><span class="rv-k">Pauta:</span> ' + x.pauta[v] + '.</p>' +
          (x.part ? '<p><span class="rv-k">Participantes:</span> ' + x.part[v] + '.</p>' : '') + '</div>';
        return its.map((x) => vs.map((v) => one(x, v, vs.length > 1 ? (v === 'A' ? 'A · GMO' : 'B · TMO') + ' · ' : '')).join('')).join('') +
          '<p class="rv-rule">Regra comum: <strong>a reunião acontece em cima do Axon Live</strong>, não de slides montados à mão.</p>';
      }
    },

    'R-19': {
      title: 'Axon Live', w: 400,
      render(o) {
        return (o.format === 'compact' ? '' : sub('Vitrine do Axon')) +
          '<p>Página viva, alimentada pelos registros da própria plataforma: movimentos (rodadas, estudos e pipelines por gerência), chamados abertos e resolvidos, inquietações e respostas, “você disse, nós fizemos”, tempo por processo, nuvem previsto × realizado, e a <strong>rodada do mês</strong> (um caso real contado por quem o fez). Mostra também o que ainda não funciona bem: transparência gera confiança. Agregados apenas; comparações entre gerências ficam no fórum de governança.</p>';
      }
    }
  };

  Object.keys(LIB).forEach((k) => { LIB[k].code = k; });

  /* ---------- API pública ---------- */
  const API = {
    data: LIB,
    keys: () => Object.keys(LIB),
    has: (k) => Object.prototype.hasOwnProperty.call(LIB, k),
    title: (k) => (LIB[k] ? LIB[k].title : ''),
    /** Título conforme a seleção (ex.: R-16 com um único portão); padrão: title(k). */
    titleFor(k, opts) {
      const e = LIB[k];
      if (!e) return '';
      if (typeof e.titleFor === 'function') { try { return e.titleFor(opts || {}) || e.title; } catch (err) { return e.title; } }
      return e.title;
    },
    selo: (k) => (LIB[k] && LIB[k].selo) || '',
    width: (k) => (LIB[k] && LIB[k].w) || 380,
    /** Renderiza uma entrada como HTML. */
    render(k, opts) {
      const e = LIB[k];
      if (!e) { console.warn('[AxonReveals] chave desconhecida: ' + k); return ''; }
      const o = Object.assign({ format: 'pop', variant: 'A' }, opts || {});
      try { return e.render(o); } catch (err) { console.error('[AxonReveals] erro ao renderizar ' + k, err); return ''; }
    },
    /** Itens que só aparecem no modo leitura/impressão (ex.: R-06, item 5). */
    readingOnly(k) { const e = LIB[k]; return e && typeof e.readingOnly === 'function' ? e.readingOnly() : []; },
    /** Linha de tabela por chave: AxonReveals.row('R-05', 'Executor') → { cells:[…] } */
    row(k, key) { const e = LIB[k]; if (!e || !e.rows) return null; const r = pickFrom(e.rows, key, (x) => x.key || x.cells[0], k); return r[0] || null; },
    /** Lista de linhas (cópia) com seleção opcional. */
    rows(k, pick) { const e = LIB[k]; return e && e.rows ? pickFrom(e.rows, pick, (x) => x.key || x.cells[0], k) : []; },
    /** Portão por código ('◆1', 'G3'). */
    gate(code) { return LIB['R-16'].find(code) || null; },
    /** Mito × Fato por índice (1…5). */
    myth(n) { return LIB['R-06'].items[Number(n) - 1] || null; },
    normalize: norm
  };

  window.AxonReveals = API;
})();
