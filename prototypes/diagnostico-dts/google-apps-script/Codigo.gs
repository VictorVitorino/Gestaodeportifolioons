/**
 * CADERNO DE NIVELAMENTO DTS · base de respostas e diagnóstico no Google Planilhas
 *
 * Passo a passo completo em LEIAME.md (mesma pasta). Em resumo:
 *   1. Na planilha: Extensões → Apps Script. Apague o conteúdo e cole este arquivo.
 *   2. Salve e execute a função configurarPlanilha (autorize quando o Google pedir).
 *   3. Implantar → Nova implantação → App da Web
 *        Executar como: Eu · Quem pode acessar: Qualquer pessoa
 *   4. Copie o link que termina em /exec e cole em sheetsEndpoint no index.html (bloco dts-config).
 *
 * Abas criadas:
 *   Diagnóstico → uma linha por pessoa: identificação, NÍVEL DIAGNOSTICADO (fórmulas) e uma coluna por questão.
 *   Regras      → pesos, travas e faixas usados pelas fórmulas. Mude um valor e todos os níveis se recalculam.
 *   Resumo      → painel que se atualiza sozinho (participação, pessoas por nível, médias, alinhamento).
 *
 * O caderno envia (POST, JSON como texto): { tipo: 'inicio' | 'etapa' | 'resultado_final', versao, linha: {...} }.
 * As chaves de "linha" são os cabeçalhos da aba Diagnóstico. A mesma pessoa (ID da sessão) sempre
 * atualiza a mesma linha: reenviar nunca duplica. As colunas de diagnóstico são sempre fórmulas da
 * planilha, calculadas a partir das respostas daquela linha (o caderno não escreve nelas).
 */

// Vazio = script criado dentro da planilha (Extensões → Apps Script).
// Script avulso: cole o ID da planilha (o trecho entre /d/ e /edit no link dela).
var ID_PLANILHA = '';

var ABA_DIAGNOSTICO = 'Diagnóstico';
var ABA_REGRAS = 'Regras';
var ABA_RESUMO = 'Resumo';
var LINHA_GRUPOS = 1;      // faixa colorida com as seções
var LINHA_CABECALHO = 2;   // nomes das colunas; respostas a partir da linha 3
var CHAVE = 'ID da sessão';
var TIPOS = ['inicio', 'etapa', 'resultado_final'];
var COLUNA_RECEBIDO = 'Recebido em';
var PERGUNTA_IA = 'Para mim, trazer IA para dentro dos projetos de DTS é…';
var ID_TESTE = 'teste-apps-script';
var LIMITE_CELULA = 45000;   // o Google aceita até 50 mil caracteres por célula
var LIMITE_CORPO = 300000;
var LIMITE_COLUNAS = 200;
var COR = {
  navy: '#002B49', aco: '#5E8AB4', acoEscuro: '#33556D', azulClaro: '#BFD0E1', gelo: '#DFE8F0',
  laranja: '#F78C16', pessego: '#FCD1A2', cinza: '#D7DDE2', papel: '#F5F7F9', branco: '#FFFFFF'
};

// Valores iniciais da aba Regras (os mesmos do caderno). Depois de criada, a aba Regras é quem manda.
var REGRAS = {
  pesosP01: [['Claude Desktop', 10], ['FLOWS', 20], ['Skills', 20], ['Métodos', 20], ['Reutilização', 15], ['Compartilhamento', 15]],
  trava60: 60,
  trava80: 80,
  pesosDemonstrado: [['P02 · O que chama sua atenção?', 15], ['P03 · Quem está mais perto?', 20], ['P04 · Por onde você iria?', 20],
    ['P05 · A Skill que ninguém merece', 15], ['P06 · Salve este Prompt', 15], ['P07 · Retrato Falado DTS', 15]],
  pesoDeclarado: 30,
  pesoDemonstrado: 70,
  faixas: [['Ponto de partida', 0, 'Conhecer e experimentar.'], ['Exploração', 21, 'Explorar e praticar.'],
    ['Evolução', 41, 'Reutilizar e consolidar.'], ['Autonomia', 61, 'Construir e compartilhar.'], ['Multiplicação', 81, 'Multiplicar.']],
  tolerancia: 10
};
var CORES_NIVEL = { 'Ponto de partida': COR.gelo, 'Exploração': COR.azulClaro, 'Evolução': COR.aco, 'Autonomia': COR.pessego, 'Multiplicação': COR.laranja };
var LEITURAS_ALINHAMENTO = ['Alinhado', 'Declarou acima do que demonstrou', 'Demonstrou mais do que declarou'];

/* ------------------------------------------------------------------ colunas da aba Diagnóstico */

var T = {
  nivel: 'Nível diagnosticado', consolidado: 'Índice consolidado', passo: 'Próximo passo',
  nivelDeclarado: 'Nível declarado', declarado: 'Índice declarado',
  nivelDemonstrado: 'Nível demonstrado', demonstrado: 'Índice demonstrado',
  diferenca: 'Declarado − demonstrado (pontos)', alinhamento: 'Leitura do alinhamento',
  bruto: 'P01 · índice bruto', trava: 'P01 · trava de coerência',
  caderno: 'Índice consolidado (caderno)', confere: 'Confere com o caderno?'
};
var PERGUNTAS_P01 = [
  ['P01.1 · Claude Desktop', 'Pensando no seu dia a dia, como o Claude Desktop entra na sua rotina hoje?'],
  ['P01.2 · FLOWS', 'Imagine que chegou uma demanda e você quer saber se já existe algo que possa ajudar. Como o FLOWS entra nessa busca hoje?'],
  ['P01.3 · Skills', 'Você encontrou uma Skill relacionada ao que precisa fazer. O que normalmente acontece a partir daí?'],
  ['P01.4 · Métodos', 'Você descobre que existe um Método que organiza as etapas daquela atividade. Como isso entra no seu trabalho hoje?'],
  ['P01.5 · Reutilização', 'Chegou uma nova demanda parecida com algo que talvez já tenha sido feito. Qual costuma ser seu primeiro movimento?'],
  ['P01.6 · Compartilhamento', 'Você criou algo que funcionou bem e pode ser útil novamente. O que você costuma fazer depois?']
];
var LEITURAS = ['P02 · leitura (0–100)', 'P03 · leitura (0–100)', 'P04 · leitura (0–100)', 'P05 · leitura (0–100)', 'P06 · leitura (0–100)', 'P07 · leitura (0–100)'];
var DIMENSOES = ['Uso do ecossistema', 'Compreensão semântica', 'Comportamento de reutilização', 'Maturidade de fluxo de trabalho',
  'Maturidade em Skills & Métodos', 'Maturidade em Prompt & Contexto', 'Maturidade agêntica', 'Criação & compartilhamento'];
var NOTA_LEITURA = 'Leitura da página de 0 a 100, calculada pelo caderno. Entra no Índice demonstrado com o peso da aba Regras.';

// Grupos na ordem das colunas: [nome da seção, fundo, cor do texto, colunas].
// Coluna com "formula" é calculada pela planilha; as demais vêm do caderno.
var GRUPOS_CACHE = null;
function gruposDiagnostico_() {
  if (GRUPOS_CACHE) return GRUPOS_CACHE;
  var faixa = function (ref) { return 'INDEX(Faixas_Nome,MATCH(ROUND(' + ref + ',0),Faixas_Min,1))'; };
  var nivelDe = function (titulo) { return function (r) { return '=IF(' + r(titulo) + '="","",' + faixa(r(titulo)) + ')'; }; };
  var p01 = function (r, i) { return 'LEFT(' + r(PERGUNTAS_P01[i][0]) + ',1)*1'; }; // "2 · texto" → 2
  var col = function (titulo, nota, formula) { return { titulo: titulo, nota: nota || '', formula: formula || null }; };
  GRUPOS_CACHE = [
    ['Identificação', COR.navy, COR.branco, [
      col(CHAVE, 'Uma linha por pessoa. Recomeçar o caderno gera um ID novo.'),
      col('Nome completo'), col('E-mail'),
      col(PERGUNTA_IA, 'Frase que a pessoa completou na etiqueta do caderno.'),
      col('Status'), col('Páginas concluídas (de 7)'), col('Iniciado em'), col('Concluído em'), col('Duração (min)')
    ]],
    ['Diagnóstico · calculado pela planilha', COR.laranja, COR.navy, [
      col(T.nivel, 'Nível do Índice consolidado. Faixas na aba Regras.', nivelDe(T.consolidado)),
      col(T.consolidado, 'Declarado × peso + demonstrado × peso (aba Regras: 30% e 70%).', function (r) {
        return '=IF(OR(' + r(T.declarado) + '="",' + r(T.demonstrado) + '=""),"",ROUND((' + r(T.declarado) + '*Peso_Declarado+' +
          r(T.demonstrado) + '*Peso_Demonstrado)/100,2))';
      }),
      col(T.passo, 'Próximo passo sugerido para o nível diagnosticado (aba Regras).', function (r) {
        return '=IF(' + r(T.nivel) + '="","",INDEX(Faixas_Passo,MATCH(' + r(T.nivel) + ',Faixas_Nome,0)))';
      }),
      col(T.nivelDeclarado, 'O que a pessoa viu no caderno: nível do ponto de partida declarado (página 01).', nivelDe(T.declarado)),
      col(T.declarado, 'Página 01: soma de (resposta ÷ 3 × peso), limitada pelas travas de coerência (aba Regras).', function (r) {
        var ok60 = 'AND(' + p01(r, 1) + '>=2,OR(' + p01(r, 2) + '>=2,' + p01(r, 3) + '>=2))';
        var ok80 = 'AND(' + p01(r, 1) + '>=2,' + p01(r, 2) + '>=2,' + p01(r, 3) + '>=2,' + p01(r, 5) + '>=2,OR(' +
          p01(r, 2) + '=3,' + p01(r, 3) + '=3,' + p01(r, 5) + '=3))';
        return '=IF(' + r(T.bruto) + '="","",MIN(' + r(T.bruto) + ',IF(NOT(' + ok60 + '),Trava_60,IF(NOT(' + ok80 + '),Trava_80,100))))';
      }),
      col(T.nivelDemonstrado, 'Nível do que a pessoa demonstrou nas páginas 02 a 07.', nivelDe(T.demonstrado)),
      col(T.demonstrado, 'Média ponderada das leituras das páginas 02 a 07 (pesos na aba Regras).', function (r) {
        var refs = LEITURAS.map(function (t) { return r(t); });
        var soma = refs.map(function (ref, i) { return ref + '*INDEX(Pesos_Demonstrado,' + (i + 1) + ')'; }).join('+');
        return '=IF(COUNT(' + refs.join(',') + ')<6,"",ROUND((' + soma + ')/100,2))';
      }),
      col(T.diferenca, 'Positivo: declarou acima do que demonstrou. Negativo: demonstrou mais do que declarou.', function (r) {
        return '=IF(' + r(T.consolidado) + '="","",ROUND(' + r(T.declarado) + '-' + r(T.demonstrado) + ',2))';
      }),
      col(T.alinhamento, 'Até a tolerância da aba Regras (10 pontos) conta como alinhado.', function (r) {
        var d = r(T.diferenca);
        return '=IF(' + d + '="","",IF(ABS(' + d + ')<=Tolerancia_Alinhamento,"' + LEITURAS_ALINHAMENTO[0] + '",IF(' + d + '>0,"' +
          LEITURAS_ALINHAMENTO[1] + '","' + LEITURAS_ALINHAMENTO[2] + '")))';
      })
    ]],
    ['P01 · Meu ponto de partida', COR.aco, COR.branco, PERGUNTAS_P01.map(function (p) {
      return col(p[0], p[1] + '\n\nResposta de 0 a 3 (o número vem antes do texto).');
    }).concat([
      col(T.bruto, 'Soma de (resposta ÷ 3 × peso), antes das travas.', function (r) {
        var refs = PERGUNTAS_P01.map(function (p) { return r(p[0]); });
        var soma = PERGUNTAS_P01.map(function (p, i) { return p01(r, i) + '*INDEX(Pesos_P01,' + (i + 1) + ')'; }).join('+');
        return '=IF(COUNTA(' + refs.join(',') + ')<6,"",ROUND((' + soma + ')/3,2))';
      }),
      col(T.trava, 'Valor em que o índice parou por uma trava de coerência ("—" = sem trava).', function (r) {
        return '=IF(' + r(T.bruto) + '="","",IF(' + r(T.bruto) + '>' + r(T.declarado) + ',' + r(T.declarado) + ',"—"))';
      })
    ])],
    ['P02 · O que chama sua atenção?', COR.azulClaro, COR.navy, [
      col('P02.1 · 1ª pista', 'São 17h42 e o Mapa de Impactos precisa sair às 18h. Quais 3 pistas você investigaria primeiro? (na ordem escolhida)'),
      col('P02.2 · 2ª pista'), col('P02.3 · 3ª pista'), col(LEITURAS[0], NOTA_LEITURA)
    ]],
    ['P03 · Quem está mais perto?', COR.gelo, COR.navy, [
      col('P03.1 · 1ª peça ligada ao Prompt', 'A primeira peça é PROMPT. Qual você colocaria mais perto dele? E depois?'),
      col('P03.2 · 2ª peça'), col(LEITURAS[1], NOTA_LEITURA)
    ]],
    ['P04 · Por onde você iria?', COR.azulClaro, COR.navy, [
      col('P04 · caminho escolhido', 'Chegou uma nova demanda. Qual caminho mais se parece com o que você seguiria hoje?'),
      col('P04 · perfil'), col(LEITURAS[2], NOTA_LEITURA)
    ]],
    ['P05 · A Skill que ninguém merece', COR.gelo, COR.navy, [
      col('P05.1 · 1º elemento', 'Se você precisasse usar essa Skill amanhã, quais 3 informações gostaria de encontrar primeiro?'),
      col('P05.2 · 2º elemento'), col('P05.3 · 3º elemento'), col(LEITURAS[3], NOTA_LEITURA)
    ]],
    ['P06 · Salve este Prompt', COR.azulClaro, COR.navy, [
      col('P06.1 · 1ª peça', 'Com pouco tempo, quais 3 coisas você acrescentaria primeiro para o pedido ficar mais claro?'),
      col('P06.2 · 2ª peça'), col('P06.3 · 3ª peça'), col(LEITURAS[4], NOTA_LEITURA)
    ]],
    ['P07 · Retrato Falado DTS', COR.gelo, COR.navy, [
      col('P07 · pessoa retratada', 'Pedido (prompt) para uma caricatura de alguém do time; depois, uma versão melhorada.'),
      col('P07 · rascunho nº 1'), col('P07 · estrutura nº 1 (0–100)'), col('P07 · rascunho nº 2'), col('P07 · estrutura nº 2 (0–100)'),
      col('P07 · evolução entre rascunhos'), col(LEITURAS[5], NOTA_LEITURA + ' Usa o rascunho nº 2 quando existe.')
    ]],
    ['Dimensões · declarado × demonstrado', COR.cinza, COR.navy, DIMENSOES.reduce(function (lista, d) {
      return lista.concat([col(d + ' · declarado'), col(d + ' · demonstrado')]);
    }, [])],
    ['Conferência e registro', COR.acoEscuro, COR.branco, [
      col(T.caderno, 'O mesmo índice calculado pelo caderno, para conferência.'),
      col(T.confere, 'Compara a planilha com o caderno (tolerância de arredondamento: 0,05). Se você mudou a aba Regras, a diferença é esperada.', function (r) {
        return '=IF(OR(' + r(T.consolidado) + '="",' + r(T.caderno) + '=""),"",IF(ABS(' + r(T.consolidado) + '-' + r(T.caderno) +
          ')<=0.05,"✓ confere","≠ revisar"))';
      }),
      col('Versão do caderno'), col('Estado completo (JSON)', 'Tudo o que a pessoa fez, para auditoria ou novas análises.'),
      col(COLUNA_RECEBIDO, 'Hora em que a planilha recebeu a última atualização desta pessoa.')
    ]]
  ];
  return GRUPOS_CACHE;
}

function colunasDiagnostico_() {
  return gruposDiagnostico_().reduce(function (lista, g) {
    return lista.concat(g[3].map(function (c) { return { titulo: c.titulo, nota: c.nota, formula: c.formula, grupo: g[0] }; }));
  }, []);
}
function titulosCalculados_() {
  var mapa = {};
  colunasDiagnostico_().forEach(function (c) { if (c.formula) mapa[c.titulo] = true; });
  return mapa;
}

/* ------------------------------------------------------------------ entrada */

function doPost(e) {
  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(30000); // várias pessoas terminando ao mesmo tempo: uma gravação por vez
    var dados = lerCorpo_(e);
    if (TIPOS.indexOf(dados.tipo) < 0) throw new Error('tipo desconhecido: ' + dados.tipo);
    var gravado = gravarDiagnostico_(abrirPlanilha_(), dados.linha);
    return responder_({ sucesso: true, tipo: dados.tipo, gravado: gravado });
  } catch (erro) {
    return responder_({ sucesso: false, erro: String((erro && erro.message) || erro) });
  } finally {
    trava.releaseLock();
  }
}

// Abrir o link /exec no navegador mostra se a base está no ar.
function doGet() {
  return responder_({ sucesso: true, mensagem: 'Caderno de Nivelamento DTS · base de respostas ativa.', abas: [ABA_DIAGNOSTICO, ABA_REGRAS, ABA_RESUMO] });
}

/* ------------------------------------------------------------------ gravação */

function gravarDiagnostico_(planilha, linha) {
  if (!linha || typeof linha !== 'object' || Array.isArray(linha)) throw new Error('linha inválida');
  var id = linha[CHAVE];
  if (id === undefined || id === null || String(id) === '') throw new Error('faltou "' + CHAVE + '"');
  id = String(id);
  var calculadas = titulosCalculados_();
  var registro = {};
  Object.keys(linha).slice(0, LIMITE_COLUNAS).forEach(function (titulo) {
    var nome = String(titulo).slice(0, 200);
    if (!calculadas[nome]) registro[nome] = celula_(linha[titulo]); // diagnóstico é sempre fórmula da planilha
  });
  registro[CHAVE] = id;
  registro[COLUNA_RECEBIDO] = new Date();

  garantirRegras_(planilha);
  var folha = garantirDiagnostico_(planilha);
  var cabecalho = garantirColunas_(folha, Object.keys(registro));
  var numero = localizarLinha_(folha, cabecalho, id);
  var valores = numero
    ? folha.getRange(numero, 1, 1, cabecalho.length).getValues()[0]
    : cabecalho.map(function () { return ''; });
  if (!numero) numero = Math.max(folha.getLastRow(), LINHA_CABECALHO) + 1;
  cabecalho.forEach(function (titulo, i) {
    if (calculadas[titulo]) valores[i] = '';
    else if (Object.prototype.hasOwnProperty.call(registro, titulo)) valores[i] = registro[titulo];
  });
  folha.getRange(numero, 1, 1, cabecalho.length).setValues([valores]);
  aplicarFormulas_(folha, cabecalho, numero);
  return ABA_DIAGNOSTICO + '!' + numero;
}

// Escreve as fórmulas de diagnóstico da linha, apontando para as células da própria linha.
function formulasDaLinha_(cabecalho, numero) {
  var ref = function (titulo) {
    var i = cabecalho.indexOf(titulo);
    if (i < 0) throw new Error('coluna ausente: ' + titulo);
    return letra_(i + 1) + numero;
  };
  var formulas = {};
  colunasDiagnostico_().forEach(function (c) {
    var i = cabecalho.indexOf(c.titulo);
    if (!c.formula || i < 0) return;
    try { formulas[i] = c.formula(ref); } catch (e) { formulas[i] = ''; } // alguém apagou uma coluna usada na conta
  });
  return formulas;
}
function aplicarFormulas_(folha, cabecalho, numero) {
  var formulas = formulasDaLinha_(cabecalho, numero);
  var indices = Object.keys(formulas).map(Number).sort(function (a, b) { return a - b; });
  for (var inicio = 0; inicio < indices.length;) {
    var fim = inicio;
    while (fim + 1 < indices.length && indices[fim + 1] === indices[fim] + 1) fim++;
    var bloco = indices.slice(inicio, fim + 1).map(function (i) { return formulas[i]; });
    folha.getRange(numero, indices[inicio] + 1, 1, bloco.length).setFormulas([bloco]);
    inicio = fim + 1;
  }
}

// Procura de baixo para cima a linha da pessoa (0 = linha nova).
function localizarLinha_(folha, cabecalho, id) {
  var ultima = folha.getLastRow();
  var primeira = LINHA_CABECALHO + 1;
  if (ultima < primeira) return 0;
  var ids = folha.getRange(primeira, cabecalho.indexOf(CHAVE) + 1, ultima - primeira + 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === id) return i + primeira;
  return 0;
}

// Converte cada valor para a célula: datas ISO viram data, objetos viram JSON,
// e textos que o Planilhas leria como fórmula, número ou data ficam como texto.
function celula_(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'number') return isFinite(valor) ? valor : '';
  if (typeof valor === 'boolean') return valor;
  var texto = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/.test(texto)) return new Date(texto);
  if (texto.length > LIMITE_CELULA) texto = texto.slice(0, LIMITE_CELULA) + '…';
  if (/^[=+\-@]/.test(texto) || /^[\d\s.,:\/%()]+$/.test(texto)) texto = "'" + texto;
  return texto;
}

/* ------------------------------------------------------------------ aba Diagnóstico */

function abrirPlanilha_() {
  if (ID_PLANILHA) return SpreadsheetApp.openById(ID_PLANILHA);
  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (!ativa) throw new Error('script fora de uma planilha: preencha ID_PLANILHA');
  return ativa;
}

function garantirDiagnostico_(planilha) {
  var folha = planilha.getSheetByName(ABA_DIAGNOSTICO) || planilha.insertSheet(ABA_DIAGNOSTICO, 0);
  if (!lerCabecalho_(folha).length) montarCabecalho_(folha);
  return folha;
}

// Faixa de seções (linha 1) + nomes das colunas (linha 2), com cores, notas e níveis coloridos.
function montarCabecalho_(folha) {
  var colunas = colunasDiagnostico_();
  var total = colunas.length;
  folha.getRange(LINHA_CABECALHO, 1, 1, total).setValues([colunas.map(function (c) { return c.titulo; })]);
  folha.getRange(LINHA_CABECALHO, 1, 1, total).setNotes([colunas.map(function (c) { return c.nota; })]);
  var inicio = 1;
  gruposDiagnostico_().forEach(function (g) {
    var largura = g[3].length;
    var faixa = folha.getRange(LINHA_GRUPOS, inicio, 1, largura);
    faixa.setValues([g[3].map(function (c, i) { return i === 0 ? g[0] : ''; })]);
    if (largura > 1) faixa.merge();
    faixa.setBackground(g[1]).setFontColor(g[2]).setFontWeight('bold').setHorizontalAlignment('left');
    folha.getRange(LINHA_CABECALHO, inicio, 1, largura).setBackground(g[1]).setFontColor(g[2]);
    inicio += largura;
  });
  folha.getRange(LINHA_CABECALHO, 1, 1, total).setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
  folha.setFrozenRows(LINHA_CABECALHO);
  folha.setFrozenColumns(2);
  var larguras = { 'Nome completo': 190, 'E-mail': 220 };
  larguras[PERGUNTA_IA] = 320;
  larguras[T.nivel] = 150; larguras[T.passo] = 190; larguras[T.alinhamento] = 230;
  larguras['P07 · rascunho nº 1'] = 320; larguras['P07 · rascunho nº 2'] = 320;
  colunas.forEach(function (c, i) {
    var largura = larguras[c.titulo] || (/^P01\.\d/.test(c.titulo) || /^P0\d \· caminho/.test(c.titulo) ? 240 : 130);
    folha.setColumnWidth(i + 1, largura);
  });
  aplicarCoresDeNivel_(folha, colunas.map(function (c) { return c.titulo; }));
}

// "Heatmap" dos níveis: mesma escala de cores da régua do caderno.
function aplicarCoresDeNivel_(folha, cabecalho) {
  var linhas = Math.max(folha.getMaxRows() - LINHA_CABECALHO, 1);
  var faixaDe = function (titulo) { return folha.getRange(LINHA_CABECALHO + 1, cabecalho.indexOf(titulo) + 1, linhas, 1); };
  var niveis = [T.nivel, T.nivelDeclarado, T.nivelDemonstrado].filter(function (t) { return cabecalho.indexOf(t) >= 0; }).map(faixaDe);
  var regras = [];
  REGRAS.faixas.forEach(function (f) {
    regras.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(f[0]).setBackground(CORES_NIVEL[f[0]])
      .setFontColor(f[0] === 'Evolução' ? COR.branco : COR.navy).setBold(true).setRanges(niveis).build());
  });
  if (cabecalho.indexOf(T.alinhamento) >= 0) {
    var alinhamento = [faixaDe(T.alinhamento)];
    [[LEITURAS_ALINHAMENTO[1], COR.pessego], [LEITURAS_ALINHAMENTO[2], COR.azulClaro]].forEach(function (par) {
      regras.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(par[0]).setBackground(par[1]).setRanges(alinhamento).build());
    });
  }
  folha.setConditionalFormatRules(regras);
}

function lerCabecalho_(folha) {
  var total = folha.getLastColumn();
  if (!total) return [];
  var titulos = folha.getRange(LINHA_CABECALHO, 1, 1, total).getValues()[0].map(function (v) { return String(v); });
  while (titulos.length && !titulos[titulos.length - 1]) titulos.pop();
  return titulos;
}

// Colunas que ainda não existem entram no fim (as do modelo primeiro, na ordem certa).
function garantirColunas_(folha, titulos) {
  var cabecalho = lerCabecalho_(folha);
  var modelo = colunasDiagnostico_().map(function (c) { return c.titulo; });
  var novos = modelo.concat(titulos).filter(function (t, i, lista) { return cabecalho.indexOf(t) < 0 && lista.indexOf(t) === i; });
  if (novos.length) {
    folha.getRange(LINHA_CABECALHO, cabecalho.length + 1, 1, novos.length).setValues([novos])
      .setFontWeight('bold').setWrap(true).setBackground(COR.cinza).setFontColor(COR.navy);
    cabecalho = cabecalho.concat(novos);
  }
  return cabecalho;
}

/* ------------------------------------------------------------------ aba Regras */

// Monta a aba Regras e os intervalos nomeados usados pelas fórmulas. Retorna o mapa nome → [linha, coluna, linhas, colunas].
function layoutRegras_() {
  var linhas = [];
  var nomes = {};
  var secoes = [];
  var editaveis = [];
  var add = function (valores) { linhas.push(valores.concat(['', '', '', '']).slice(0, 4)); return linhas.length; };
  add(['Regras do diagnóstico DTS']);
  add(['Os valores em laranja são editáveis: mude um e todos os níveis da aba Diagnóstico se recalculam na hora.']);
  add([]);
  secoes.push(add(['1 · Ponto de partida declarado (página 01)', 'Peso']));
  var p01 = linhas.length + 1;
  REGRAS.pesosP01.forEach(function (p) { add([p[0], p[1]]); });
  nomes.Pesos_P01 = [p01, 2, REGRAS.pesosP01.length, 1];
  editaveis.push(nomes.Pesos_P01);
  add(['Total (precisa somar 100)', '=SUM(B' + p01 + ':B' + (p01 + REGRAS.pesosP01.length - 1) + ')']);
  add(['Conta: soma de (resposta ÷ 3 × peso). Cada resposta vai de 0 a 3.']);
  nomes.Trava_60 = [add(['Trava 1 · sem FLOWS ≥ 2 e (Skills ≥ 2 ou Métodos ≥ 2), o índice para em', REGRAS.trava60]), 2, 1, 1];
  nomes.Trava_80 = [add(['Trava 2 · sem FLOWS, Skills, Métodos e Compartilhamento ≥ 2 (e um deles = 3), o índice para em', REGRAS.trava80]), 2, 1, 1];
  editaveis.push(nomes.Trava_60, nomes.Trava_80);
  add([]);
  secoes.push(add(['2 · Índice demonstrado (páginas 02 a 07)', 'Peso (%)']));
  var dem = linhas.length + 1;
  REGRAS.pesosDemonstrado.forEach(function (p) { add([p[0], p[1]]); });
  nomes.Pesos_Demonstrado = [dem, 2, REGRAS.pesosDemonstrado.length, 1];
  editaveis.push(nomes.Pesos_Demonstrado);
  add(['Total (precisa somar 100)', '=SUM(B' + dem + ':B' + (dem + REGRAS.pesosDemonstrado.length - 1) + ')']);
  add(['Cada página gera uma leitura de 0 a 100, calculada pelo caderno (pistas, mapa de conceitos, caminho e estrutura do texto).']);
  add([]);
  secoes.push(add(['3 · Índice consolidado', 'Peso (%)']));
  nomes.Peso_Declarado = [add(['Declarado', REGRAS.pesoDeclarado]), 2, 1, 1];
  nomes.Peso_Demonstrado = [add(['Demonstrado', REGRAS.pesoDemonstrado]), 2, 1, 1];
  editaveis.push(nomes.Peso_Declarado, nomes.Peso_Demonstrado);
  add(['Total (precisa somar 100)', '=SUM(B' + nomes.Peso_Declarado[0] + ':B' + nomes.Peso_Demonstrado[0] + ')']);
  add([]);
  secoes.push(add(['4 · Níveis', 'A partir de', 'Até', 'Próximo passo']));
  var fx = linhas.length + 1;
  REGRAS.faixas.forEach(function (f, i) {
    var ultimo = i === REGRAS.faixas.length - 1;
    add([f[0], f[1], ultimo ? 100 : '=B' + (fx + i + 1) + '-1', f[2]]);
  });
  var n = REGRAS.faixas.length;
  nomes.Faixas_Nome = [fx, 1, n, 1];
  nomes.Faixas_Min = [fx, 2, n, 1];
  nomes.Faixas_Passo = [fx, 4, n, 1];
  editaveis.push(nomes.Faixas_Min, nomes.Faixas_Passo);
  add(['O índice é arredondado e procura a faixa (ex.: 60,4 → 60 → Evolução; 60,5 → 61 → Autonomia).']);
  add([]);
  secoes.push(add(['5 · Leitura do alinhamento', 'Pontos']));
  nomes.Tolerancia_Alinhamento = [add(['Diferença entre declarado e demonstrado que ainda conta como "Alinhado" (até)', REGRAS.tolerancia]), 2, 1, 1];
  editaveis.push(nomes.Tolerancia_Alinhamento);
  return { linhas: linhas, nomes: nomes, secoes: secoes, editaveis: editaveis };
}

function garantirRegras_(planilha) {
  if (!planilha.getSheetByName(ABA_REGRAS)) montarRegras_(planilha);
}

function montarRegras_(planilha) {
  var folha = planilha.getSheetByName(ABA_REGRAS) || planilha.insertSheet(ABA_REGRAS);
  folha.clear();
  var layout = layoutRegras_();
  var valores = layout.linhas.map(function (l) { return l.map(function (v) { return String(v).charAt(0) === '=' ? '' : v; }); });
  folha.getRange(1, 1, valores.length, 4).setValues(valores);
  layout.linhas.forEach(function (l, i) {
    l.forEach(function (v, j) { if (String(v).charAt(0) === '=') folha.getRange(i + 1, j + 1).setFormula(v); });
  });
  Object.keys(layout.nomes).forEach(function (nome) {
    var p = layout.nomes[nome];
    try { planilha.removeNamedRange(nome); } catch (e) { /* ainda não existia */ }
    planilha.setNamedRange(nome, folha.getRange(p[0], p[1], p[2], p[3]));
  });
  folha.getRange(1, 1).setFontWeight('bold').setFontSize(14).setFontColor(COR.navy);
  folha.getRange(2, 1).setFontStyle('italic').setFontColor(COR.acoEscuro);
  layout.secoes.forEach(function (n) { folha.getRange(n, 1, 1, 4).setFontWeight('bold').setFontColor(COR.branco).setBackground(COR.navy); });
  layout.editaveis.forEach(function (p) { folha.getRange(p[0], p[1], p[2], p[3]).setBackground(COR.pessego).setFontWeight('bold'); });
  folha.setColumnWidth(1, 560);
  folha.setColumnWidth(2, 110);
  folha.setColumnWidth(3, 70);
  folha.setColumnWidth(4, 220);
  return folha;
}

/* ------------------------------------------------------------------ aba Resumo */

function montarResumo_(planilha) {
  var folha = planilha.getSheetByName(ABA_RESUMO) || planilha.insertSheet(ABA_RESUMO, 0);
  folha.clear();
  var D = "'" + ABA_DIAGNOSTICO + "'";
  var dados = D + '!A' + (LINHA_CABECALHO + 1) + ':ZZ';
  var titulos = D + '!A' + LINHA_CABECALHO + ':ZZ' + LINHA_CABECALHO;
  var coluna = function (titulo) { return 'INDEX(' + dados + ', 0, MATCH("' + titulo + '", ' + titulos + ', 0))'; };
  var contar = function (titulo, criterio) { return '=IFERROR(COUNTIF(' + coluna(titulo) + ', ' + criterio + '), 0)'; };
  var media = function (titulo) { return '=IFERROR(ROUND(AVERAGE(' + coluna(titulo) + '), 1), "—")'; };
  var linhas = [
    ['Caderno de Nivelamento DTS · Resumo', '', ''],
    ['Atualiza sozinho a cada resposta. As contas estão na aba Regras.', '', ''],
    ['', '', ''],
    ['Participação', 'Pessoas', ''],
    ['Identificadas na etiqueta', '=IFERROR(COUNTA(' + coluna(CHAVE) + '), 0)', ''],
    ['Concluíram o caderno', contar('Status', '"Concluído"'), ''],
    ['Ainda em andamento', contar('Status', '"Em andamento"'), ''],
    ['', '', ''],
    ['Nível diagnosticado', 'Pessoas', '% de quem concluiu']
  ];
  var secoes = [4, 9];
  REGRAS.faixas.forEach(function (f) {
    var n = linhas.length + 1;
    linhas.push([f[0], contar(T.nivel, 'A' + n), '=IFERROR(B' + n + '/B6, 0)']);
  });
  linhas.push(['', '', '']);
  secoes.push(linhas.length + 1);
  linhas.push(['Médias (0–100)', 'Média', '']);
  linhas.push(['Índice declarado', media(T.declarado), '']);
  linhas.push(['Índice demonstrado', media(T.demonstrado), '']);
  linhas.push(['Índice consolidado', media(T.consolidado), '']);
  linhas.push(['', '', '']);
  secoes.push(linhas.length + 1);
  linhas.push(['Leitura do alinhamento', 'Pessoas', '']);
  LEITURAS_ALINHAMENTO.forEach(function (l) { linhas.push([l, contar(T.alinhamento, 'A' + (linhas.length + 1)), '']); });
  linhas.forEach(function (l, i) {
    l.forEach(function (v, j) {
      var celula = folha.getRange(i + 1, j + 1);
      if (String(v).charAt(0) === '=') celula.setFormula(v); else if (v !== '') celula.setValue(v);
    });
  });
  folha.getRange(1, 1).setFontWeight('bold').setFontSize(14).setFontColor(COR.navy);
  folha.getRange(2, 1).setFontStyle('italic').setFontColor(COR.acoEscuro);
  secoes.forEach(function (n) { folha.getRange(n, 1, 1, 3).setFontWeight('bold').setFontColor(COR.branco).setBackground(COR.navy); });
  folha.getRange(10, 3, REGRAS.faixas.length, 1).setNumberFormat('0%');
  folha.setColumnWidth(1, 300);
  folha.setColumnWidth(2, 110);
  folha.setColumnWidth(3, 150);
  return folha;
}

/* ------------------------------------------------------------------ preparo e manutenção */

// Rode uma vez pelo editor (Executar → configurarPlanilha): cria as abas Diagnóstico, Regras e Resumo.
// Pode rodar de novo: não mexe nas respostas nem nas Regras já calibradas.
function configurarPlanilha() {
  var planilha = abrirPlanilha_();
  garantirRegras_(planilha);
  garantirDiagnostico_(planilha);
  montarResumo_(planilha);
  return 'Planilha pronta: abas ' + [ABA_DIAGNOSTICO, ABA_REGRAS, ABA_RESUMO].join(', ') + '.';
}

// Volta a aba Regras aos valores originais do caderno (os níveis se recalculam).
function restaurarRegras() {
  montarRegras_(abrirPlanilha_());
  return 'Regras restauradas.';
}

// Reescreve as fórmulas de diagnóstico de todas as linhas (se alguém apagou ou colou por cima).
function recalcularTudo() {
  var folha = garantirDiagnostico_(abrirPlanilha_());
  var cabecalho = lerCabecalho_(folha);
  for (var n = LINHA_CABECALHO + 1; n <= folha.getLastRow(); n++) aplicarFormulas_(folha, cabecalho, n);
  return 'Fórmulas reaplicadas.';
}

/* ------------------------------------------------------------------ teste */

// Executar → testarEnvio: grava uma pessoa de teste com todas as respostas.
// Confira na aba Diagnóstico: Nível diagnosticado "Autonomia" (78,35) e "✓ confere".
function testarEnvio() {
  var linha = {};
  linha[CHAVE] = ID_TESTE;
  linha['Nome completo'] = 'Teste do Caderno';
  linha['E-mail'] = 'teste@exemplo.com';
  linha[PERGUNTA_IA] = 'um teste de envio (pode apagar com apagarLinhasDeTeste).';
  linha['Status'] = 'Concluído';
  linha['Páginas concluídas (de 7)'] = 7;
  [2, 2, 3, 1, 2, 1].forEach(function (v, i) { linha[PERGUNTAS_P01[i][0]] = v + ' · resposta de teste'; });
  [66.67, 100, 80, 71.67, 91.67, 100].forEach(function (v, i) { linha[LEITURAS[i]] = v; });
  linha[T.caderno] = 78.35;
  linha['Versão do caderno'] = 'teste';
  var resposta = doPost({ postData: { contents: JSON.stringify({ tipo: 'resultado_final', versao: 'teste', linha: linha }) } });
  Logger.log(resposta.getContent());
  return resposta.getContent();
}

// Executar → apagarLinhasDeTeste: remove as linhas criadas por testarEnvio.
function apagarLinhasDeTeste() {
  var folha = abrirPlanilha_().getSheetByName(ABA_DIAGNOSTICO);
  if (!folha) return 0;
  var cabecalho = lerCabecalho_(folha);
  var primeira = LINHA_CABECALHO + 1;
  if (folha.getLastRow() < primeira || cabecalho.indexOf(CHAVE) < 0) return 0;
  var ids = folha.getRange(primeira, cabecalho.indexOf(CHAVE) + 1, folha.getLastRow() - primeira + 1, 1).getValues();
  var apagadas = 0;
  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === ID_TESTE) { folha.deleteRow(i + primeira); apagadas++; }
  }
  Logger.log('Linhas de teste apagadas: ' + apagadas);
  return apagadas;
}

/* ------------------------------------------------------------------ utilidades */

function letra_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function lerCorpo_(e) {
  var texto = e && e.postData && e.postData.contents;
  if (!texto) throw new Error('corpo vazio');
  if (texto.length > LIMITE_CORPO) throw new Error('corpo grande demais');
  var dados = JSON.parse(texto);
  if (!dados || typeof dados !== 'object') throw new Error('corpo inválido');
  return dados;
}

function responder_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
