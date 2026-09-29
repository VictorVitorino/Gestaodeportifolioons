/**
 * CADERNO DE NIVELAMENTO DTS · base de respostas no Google Planilhas
 *
 * Passo a passo completo em LEIAME.md (mesma pasta). Em resumo:
 *   1. Na planilha: Extensões → Apps Script. Apague o conteúdo e cole este arquivo.
 *   2. Salve e execute a função configurarPlanilha (autorize quando o Google pedir).
 *   3. Implantar → Nova implantação → App da Web
 *        Executar como: Eu · Quem pode acessar: Qualquer pessoa
 *   4. Copie o link que termina em /exec e cole em sheetsEndpoint no index.html (bloco dts-config).
 *
 * O caderno envia (POST, JSON como texto):
 *   { tipo: 'inicio' | 'etapa' | 'resultado_final', versao, participante: {...}, linha: {...} }
 *     participante    → aba Participantes (uma linha por pessoa)
 *     etapa           → aba Etapas (uma linha por pessoa e página)
 *     resultado_final → aba Resultados (uma linha por pessoa, tudo aberto em colunas)
 * As chaves de cada objeto são os cabeçalhos: colunas novas são criadas sozinhas, e a mesma
 * pessoa (e página) sempre atualiza a mesma linha. Reenviar nunca duplica.
 */

// Vazio = script criado dentro da planilha (Extensões → Apps Script).
// Script avulso: cole o ID da planilha (o trecho entre /d/ e /edit no link dela).
var ID_PLANILHA = '';

var ABAS = {
  participante: { nome: 'Participantes', chaves: ['ID da sessão'] },
  etapa: { nome: 'Etapas', chaves: ['ID da sessão', 'Página'] },
  resultado_final: { nome: 'Resultados', chaves: ['ID da sessão'] }
};
var ABA_RESUMO = 'Resumo';
var TIPOS = ['inicio', 'etapa', 'resultado_final'];
var COLUNA_RECEBIDO = 'Recebido em';
var PERGUNTA_IA = 'Para mim, trazer IA para dentro dos projetos de DTS é…';
var FAIXAS = ['Ponto de partida', 'Exploração', 'Evolução', 'Autonomia', 'Multiplicação'];
var ID_TESTE = 'teste-apps-script';
var LIMITE_CELULA = 45000;   // o Google aceita até 50 mil caracteres por célula
var LIMITE_CORPO = 300000;
var LIMITE_COLUNAS = 150;
var COR = { navy: '#002B49', gelo: '#DFE8F0', papel: '#F5F7F9', laranja: '#F78C16' };

/* ------------------------------------------------------------------ entrada */

function doPost(e) {
  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(30000); // várias pessoas terminando ao mesmo tempo: uma gravação por vez
    var dados = lerCorpo_(e);
    if (TIPOS.indexOf(dados.tipo) < 0) throw new Error('tipo desconhecido: ' + dados.tipo);
    var planilha = abrirPlanilha_();
    var gravados = [];
    if (dados.participante) gravados.push(gravar_(planilha, ABAS.participante, dados.participante));
    if (dados.tipo === 'etapa' && dados.linha) gravados.push(gravar_(planilha, ABAS.etapa, dados.linha));
    if (dados.tipo === 'resultado_final' && dados.linha) gravados.push(gravar_(planilha, ABAS.resultado_final, dados.linha));
    if (!gravados.length) throw new Error('nada para gravar');
    return responder_({ sucesso: true, tipo: dados.tipo, gravados: gravados });
  } catch (erro) {
    return responder_({ sucesso: false, erro: String((erro && erro.message) || erro) });
  } finally {
    trava.releaseLock();
  }
}

// Abrir o link /exec no navegador mostra se a base está no ar.
function doGet() {
  return responder_({
    sucesso: true,
    mensagem: 'Caderno de Nivelamento DTS · base de respostas ativa.',
    abas: [ABAS.participante.nome, ABAS.etapa.nome, ABAS.resultado_final.nome, ABA_RESUMO]
  });
}

/* ------------------------------------------------------------------ gravação */

function gravar_(planilha, aba, linha) {
  if (!linha || typeof linha !== 'object' || Array.isArray(linha)) throw new Error('linha inválida para ' + aba.nome);
  var titulos = Object.keys(linha).slice(0, LIMITE_COLUNAS);
  var alvo = aba.chaves.map(function (chave) {
    var valor = linha[chave];
    if (valor === undefined || valor === null || String(valor) === '') throw new Error('faltou "' + chave + '" em ' + aba.nome);
    return String(valor);
  });
  var registro = {};
  titulos.forEach(function (titulo) { registro[String(titulo).slice(0, 200)] = celula_(linha[titulo]); });
  aba.chaves.forEach(function (chave, i) { registro[chave] = alvo[i]; }); // chaves ficam exatamente como chegaram
  registro[COLUNA_RECEBIDO] = new Date();

  var folha = obterAba_(planilha, aba);
  var cabecalho = garantirColunas_(folha, Object.keys(registro));
  var numero = localizarLinha_(folha, cabecalho, aba.chaves, alvo);
  var valores;
  if (numero) {
    valores = folha.getRange(numero, 1, 1, cabecalho.length).getValues()[0];
  } else {
    numero = folha.getLastRow() + 1;
    valores = cabecalho.map(function () { return ''; });
  }
  cabecalho.forEach(function (titulo, i) {
    if (Object.prototype.hasOwnProperty.call(registro, titulo)) valores[i] = registro[titulo];
  });
  folha.getRange(numero, 1, 1, cabecalho.length).setValues([valores]);
  return aba.nome + '!' + numero;
}

// Procura de baixo para cima a linha com as mesmas chaves (0 = linha nova).
function localizarLinha_(folha, cabecalho, chaves, alvo) {
  var ultima = folha.getLastRow();
  if (ultima < 2) return 0;
  var blocos = chaves.map(function (chave) {
    return folha.getRange(2, cabecalho.indexOf(chave) + 1, ultima - 1, 1).getValues();
  });
  for (var i = ultima - 2; i >= 0; i--) {
    var igual = true;
    for (var j = 0; j < chaves.length && igual; j++) igual = String(blocos[j][i][0]) === alvo[j];
    if (igual) return i + 2;
  }
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

/* ------------------------------------------------------------------ abas */

function abrirPlanilha_() {
  if (ID_PLANILHA) return SpreadsheetApp.openById(ID_PLANILHA);
  var ativa = SpreadsheetApp.getActiveSpreadsheet();
  if (!ativa) throw new Error('script fora de uma planilha: preencha ID_PLANILHA');
  return ativa;
}

function obterAba_(planilha, aba) {
  var folha = planilha.getSheetByName(aba.nome);
  if (!folha) {
    folha = planilha.insertSheet(aba.nome);
    garantirColunas_(folha, aba.chaves);
  }
  return folha;
}

function lerCabecalho_(folha) {
  var total = folha.getLastColumn();
  if (!total) return [];
  var titulos = folha.getRange(1, 1, 1, total).getValues()[0].map(function (v) { return String(v); });
  while (titulos.length && !titulos[titulos.length - 1]) titulos.pop();
  return titulos;
}

function garantirColunas_(folha, titulos) {
  var cabecalho = lerCabecalho_(folha);
  var novos = titulos.filter(function (t) { return cabecalho.indexOf(t) < 0; });
  if (novos.length) {
    folha.getRange(1, cabecalho.length + 1, 1, novos.length).setValues([novos]);
    cabecalho = cabecalho.concat(novos);
    folha.getRange(1, 1, 1, cabecalho.length)
      .setFontWeight('bold').setFontColor('#FFFFFF').setBackground(COR.navy)
      .setWrap(true).setVerticalAlignment('middle');
    folha.setFrozenRows(1);
  }
  return cabecalho;
}

/* ------------------------------------------------------------------ preparo e resumo */

// Rode uma vez pelo editor (Executar → configurarPlanilha): cria as abas e o painel "Resumo".
function configurarPlanilha() {
  var planilha = abrirPlanilha_();
  [ABAS.participante, ABAS.etapa, ABAS.resultado_final].forEach(function (aba) { obterAba_(planilha, aba); });
  montarResumo_(planilha);
  return 'Planilha pronta: abas ' + [ABAS.participante.nome, ABAS.etapa.nome, ABAS.resultado_final.nome, ABA_RESUMO].join(', ') + '.';
}

// Painel que se atualiza sozinho: as fórmulas acham cada coluna pelo nome do cabeçalho.
function montarResumo_(planilha) {
  var folha = planilha.getSheetByName(ABA_RESUMO) || planilha.insertSheet(ABA_RESUMO, 0);
  folha.clear();
  var P = "'" + ABAS.participante.nome + "'";
  var R = "'" + ABAS.resultado_final.nome + "'";
  var coluna = function (aba, titulo) { return 'INDEX(' + aba + '!A2:ZZ, 0, MATCH("' + titulo + '", ' + aba + '!A1:ZZ1, 0))'; };
  var contar = function (aba, titulo, criterio) { return '=IFERROR(COUNTIF(' + coluna(aba, titulo) + ', ' + criterio + '), 0)'; };
  var media = function (titulo) { return '=IFERROR(ROUND(AVERAGE(' + coluna(R, titulo) + '), 1), "—")'; };
  var linhas = [
    ['Caderno de Nivelamento DTS · Resumo', ''],
    ['Atualiza sozinho a cada resposta que chega.', ''],
    ['', ''],
    ['Participação', 'Pessoas'],
    ['Identificadas na etiqueta', '=IFERROR(COUNTA(' + coluna(P, 'ID da sessão') + '), 0)'],
    ['Concluíram o caderno', contar(P, 'Status', '"Concluído"')],
    ['Ainda em andamento', contar(P, 'Status', '"Em andamento"')],
    ['', ''],
    ['Médias de quem concluiu (0–100)', 'Média'],
    ['Ponto de partida declarado', media('Declarado · final (%)')],
    ['Índice demonstrado', media('Índice demonstrado')],
    ['Índice consolidado (30/70)', media('Índice consolidado (30/70)')],
    ['Índice de alinhamento', media('Índice de alinhamento')],
    ['', ''],
    ['Faixa declarada', 'Pessoas']
  ];
  FAIXAS.forEach(function (faixa) { linhas.push([faixa, contar(R, 'Faixa declarada', 'A' + (linhas.length + 1))]); });
  linhas.forEach(function (linha, i) {
    folha.getRange(i + 1, 1).setValue(linha[0]);
    if (String(linha[1]).charAt(0) === '=') folha.getRange(i + 1, 2).setFormula(linha[1]);
    else folha.getRange(i + 1, 2).setValue(linha[1]);
  });
  folha.getRange(1, 1).setFontWeight('bold').setFontSize(14).setFontColor(COR.navy);
  folha.getRange(2, 1).setFontStyle('italic').setFontColor('#33556D');
  [4, 9, 15].forEach(function (n) {
    folha.getRange(n, 1, 1, 2).setFontWeight('bold').setFontColor('#FFFFFF').setBackground(COR.navy);
  });
  folha.setColumnWidth(1, 300);
  folha.setColumnWidth(2, 120);
  return folha;
}

/* ------------------------------------------------------------------ teste */

// Executar → testarEnvio: grava uma linha de teste em Participantes e Etapas (veja o log).
function testarEnvio() {
  var participante = {};
  participante['ID da sessão'] = ID_TESTE;
  participante['Nome completo'] = 'Teste do Caderno';
  participante['E-mail'] = 'teste@exemplo.com';
  participante[PERGUNTA_IA] = 'um teste de envio (pode apagar com apagarLinhasDeTeste).';
  participante['Status'] = 'Em andamento';
  var linha = { 'ID da sessão': ID_TESTE, 'Nome completo': 'Teste do Caderno', 'Página': 'P01', 'Experiência': 'Teste', 'Respostas': 'linha de teste' };
  var resposta = doPost({ postData: { contents: JSON.stringify({ tipo: 'etapa', versao: 'teste', participante: participante, linha: linha }) } });
  Logger.log(resposta.getContent());
  return resposta.getContent();
}

// Executar → apagarLinhasDeTeste: remove as linhas criadas por testarEnvio.
function apagarLinhasDeTeste() {
  var planilha = abrirPlanilha_();
  var apagadas = 0;
  [ABAS.participante, ABAS.etapa, ABAS.resultado_final].forEach(function (aba) {
    var folha = planilha.getSheetByName(aba.nome);
    if (!folha || folha.getLastRow() < 2) return;
    var col = lerCabecalho_(folha).indexOf('ID da sessão') + 1;
    if (!col) return;
    var ids = folha.getRange(2, col, folha.getLastRow() - 1, 1).getValues();
    for (var i = ids.length - 1; i >= 0; i--) {
      if (String(ids[i][0]) === ID_TESTE) { folha.deleteRow(i + 2); apagadas++; }
    }
  });
  Logger.log('Linhas de teste apagadas: ' + apagadas);
  return apagadas;
}

/* ------------------------------------------------------------------ utilidades */

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
