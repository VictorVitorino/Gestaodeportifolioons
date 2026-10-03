/* =========================================================================
   Portfólio FEG — CÁLCULOS PUROS (calc.js) · PF.calc
   Regras: toda função recebe d (conjunto de dados: PF.base ou PF.db()) e parâmetros, devolve valores novos
   e NUNCA muta d (arrays de d só são ordenados depois de .slice()). Frações em 0..1 (0,439 = 43,9%);
   o índice D também é fração (0,30 = 30 pp). Datas 'AAAA-MM-DD' com Date.UTC. Valores em R$ mi.
   Fora da v1 (CONTRATO D4): caminho crítico/CPM, opção real e HHI.
   Opções do otimizador (o): { cap, orc, reserva, obrig[], deps[[a,b]] (a ⇒ b), excl[[ids]], maxD, gcap (true|{FEL:1.5…}),
     forcar[], proibir[], pesos (completos ou parciais: os demais são renormalizados), extras[{id,fte,custo,categoria,gerenciaId,obrigatoria,N}], rows }
   ========================================================================= */
(function(){
  'use strict';
  const PF = window.PF = window.PF || {};
  const EPS = 1e-9;
  const DEF = {
    R07:'2026-10-03', R08:{ faixas:[30,60,90] }, R09:{ riscos:['RESOLVIDO','CONCLUIDO','FECHADO'], dependencias:['RESOLVIDA','CONCLUIDA','FECHADA'] },
    R10a:['titulo','descricaoObjetivo','gerenciaId','comunidadeId','responsavel'], R10b:['categoria','objetivoEstrategicoId','bac','dataPlanejada','dataPrevistaAtual'],
    R13:{ vermelhoDesvioMeses:3, amareloDesvioMeses:1, vermelhoIndiceAbaixoDe:0.85, amareloIndiceAbaixoDe:0.95 }, R15:0, R16:60,
    R20:{ C1:0.30, C2:0.25, C3:0.20, C4:0.15, C5:0.10 }, R21:{ min:1, max:5 }, R22:{ valorAltoN:60, esforcoAltoFteAcimaDe:2, riscoAlto:12, riscoCritico:15 },
    R23:{ empateTecnicoDeltaN:1.0 }, R24:{ fteTotal:10, orcamento:4.0, periodo:'2027' },
    R26:{ tanqueAcimaDe:1.00, reduzirAPartirDe:0.90, roadmapAPartirDe:0.75, acoes:{ TANQUE:'Ativar tanque + repriorizar backlog', REDUZIR:'Reduzir escopo + modularizar entregas', ROADMAP:'Executar roadmap estruturado', AUTONOMIA:'Investir em autonomia e dívida técnica' } },
    R27:0.15, R28:{ alvo:{ SUSTENTACAO:0.30, EVOLUCAO:0.50, INOVACAO:0.20 }, toleranciaD:0.15 }, R29:{ indice:0.85, tcpi:1.1 },
    R31:{ horizontes:{ H1:0.70, H2:0.20, H3:0.10 }, trlHandover:7 }, R32:{ robustezNucleo:0.80, limiarHhi:0.25 },
  };
  const TRIAGEM = ['ADMITIR','DEVOLVER','REDIRECIONAR_EXECUCAO','ENCAMINHAR_EXPLORATORIO','ARQUIVAR'];
  const GATE = ['GO','GO_CONDICIONADO','HOLD','RECYCLE','KILL'];
  const COR = { VERDE:0, AMARELO:1, VERMELHO:2 };
  const NOME_COR = { VERDE:'Verde', AMARELO:'Amarelo', VERMELHO:'Vermelho', CINZA:'Cinza' };

  /* ================================================================ utilitários */
  /** Número ou null (vazio, NaN). */
  const num = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
  /** Divisão segura (§3.10): null se a ou b forem nulos, b ≤ 0 ou resultado não finito. */
  const div = (a, b) => { a = num(a); b = num(b); if(a == null || b == null || !(b > 0)) return null; const r = a / b; return Number.isFinite(r) ? r : null; };
  /** Razão com sinal (benefícios "menor é melhor"): null só se b = 0, nulo ou resultado não finito. */
  const razao = (a, b) => { a = num(a); b = num(b); if(a == null || b == null || Math.abs(b) < EPS) return null; const r = a / b; return Number.isFinite(r) ? r : null; };
  /** Arredonda meio para longe do zero, sem ruído binário (1,005 → 1,01). */
  const arred = (x, c = 2) => { x = num(x); if(x == null || !Number.isFinite(x)) return null; const a = Math.abs(x); if(a < EPS) return 0;
    const s = String(+a.toPrecision(12)); const r = s.includes('e') ? Math.round(a * 10 ** c) / 10 ** c : Number(Math.round(Number(s + 'e' + c)) + 'e-' + c); return x < 0 ? -r : r; };
  /** Soma de f(x) ignorando nulos. */
  const soma = (arr, f = x => x) => (arr || []).reduce((s, x) => s + (num(f(x)) || 0), 0);
  const nums = arr => (arr || []).map(num).filter(v => v != null);
  /** Média aritmética (null se vazio). */
  const media = arr => { const v = nums(arr); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  /** Mediana (null se vazio). */
  const mediana = arr => { const v = nums(arr).sort((a, b) => a - b); if(!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m-1] + v[m]) / 2; };
  /** Cópia profunda por JSON (dados do app são JSON puros). */
  const clone = o => JSON.parse(JSON.stringify(o));
  /** Campo vazio: null, '', só espaços ou lista vazia. */
  const vazio = v => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
  const utc = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };
  /** Dias corridos de `de` até `ate` (Date.UTC; nenhuma conta usa hora local). */
  const dias = (de, ate) => { const a = utc(de), b = utc(ate); return a == null || b == null ? null : Math.round((b - a) / 864e5); };
  /** Índice de mês de calendário: 12·ano + mês. */
  const mesIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(String(s || '')); return m ? 12 * +m[1] + +m[2] : null; };
  const dia = s => String(s || '').slice(0, 10);
  const uniq = arr => Array.from(new Set(arr));
  const mesmos = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  const ptBR = (v, c = 2) => v == null ? 'n/d' : arred(v, c).toFixed(c).replace('.', ',');
  const byId = (arr, id) => (arr || []).find(x => x.id === id) || null;

  /* ================================================================ regras e entidades */
  /** Regra vigente (maior versão) pelo código, como PF.regra, mas sobre o conjunto d. */
  const regra = (d, codigo) => { const rs = ((d && d.regras) || []).filter(r => r.codigo === codigo); if(!rs.length) return null;
    const vig = rs.filter(r => r.vigente !== false); return (vig.length ? vig : rs).slice().sort((a, b) => (b.versao || 1) - (a.versao || 1))[0]; };
  /** Valor da regra vigente; objetos são mesclados sobre o padrão da v1. */
  const param = (d, codigo) => { const r = regra(d, codigo), v = r ? r.valor : undefined, def = DEF[codigo];
    if(v && typeof v === 'object' && !Array.isArray(v) && def && typeof def === 'object' && !Array.isArray(def)) return Object.assign({}, def, v);
    return v === undefined ? (def && typeof def === 'object' ? clone(def) : def) : v; };
  /** Data de referência: o.ref → d.dataReferencia → R07. */
  const ref = (d, o) => dia((o && o.ref) || (d && d.dataReferencia) || param(d, 'R07'));
  /** Iniciativa por id. */
  const ini = (d, id) => byId(d.iniciativas, id);
  const asIni = (d, i) => typeof i === 'string' ? ini(d, i) : i;
  const idOf = i => typeof i === 'string' ? i : i && i.id;
  /** Fase terminal pelo catálogo statusConfiguracao. */
  const terminal = (d, codigo) => { const s = (d.statusConfiguracao || []).find(x => x.codigo === codigo); return s ? !!s.terminal : ['ENCERRADA','CANCELADA'].includes(codigo); };
  /** Iniciativas ativas (ativo !== false). */
  const ativas = d => (d.iniciativas || []).filter(i => i.ativo !== false);
  /** A = ativas em EM_EXECUCAO. */
  const emExecucao = d => ativas(d).filter(i => i.statusId === 'EM_EXECUCAO');
  /** Demandas ativas na fila (fase DEMANDA). */
  const demandas = d => ativas(d).filter(i => i.statusId === 'DEMANDA');

  /* ================================================================ financeiro (§3.10, R37) */
  /** Linha financeira válida: fonte e período preenchidos (senão SOURCE_REQUIRED). */
  const linhaValida = f => !vazio(f.fonte) && !vazio(f.periodo);
  const linhas = (d, i, o = {}) => (d.financeiro || []).filter(f => f.iniciativaId === idOf(i) && linhaValida(f) && (!o.periodo || String(f.periodo).startsWith(o.periodo)));
  /** BAC = Σ orcamentoPlanejado das linhas válidas (o.periodo filtra por prefixo, ex. '2027'). */
  const bac = (d, i, o) => { const ls = linhas(d, i, o); return ls.length ? arred(soma(ls, f => f.orcamentoPlanejado), 6) : null; };
  /** AC = Σ realizado, com o mesmo filtro do BAC. */
  const ac = (d, i, o) => { const ls = linhas(d, i, o); return ls.length ? arred(soma(ls, f => f.realizado), 6) : null; };
  /** Previsão no término declarada (Σ previsao das linhas válidas; null se nenhuma). */
  const previsao = (d, i, o) => { const ls = linhas(d, i, o).filter(f => num(f.previsao) != null); return ls.length ? arred(soma(ls, f => f.previsao), 6) : null; };
  /** Linhas financeiras sem fonte ou período (SOURCE_REQUIRED). */
  const semFonte = d => (d.financeiro || []).filter(f => !linhaValida(f)).map(f => ({ id:f.id, iniciativaId:f.iniciativaId, codigo:'SOURCE_REQUIRED' }));

  /* ================================================================ sinal calculado (R13, R14) */
  /** % físico real como fração. */
  const fisico = i => num(i.percentualFisicoReal) == null ? null : num(i.percentualFisicoReal) / 100;
  /** Índice progresso × gasto = div(%físico, AC/BAC). */
  const indice = (d, i) => { i = asIni(d, i); if(!i) return null; return div(fisico(i), div(ac(d, i), bac(d, i))); };
  /** Previsão efetiva (R14): max(prevista, ref) se a fase não é terminal; marca "previsão vencida". */
  const previsaoEfetiva = (d, i, o) => { i = asIni(d, i); const r = ref(d, o), p = i && i.dataPrevistaAtual ? dia(i.dataPrevistaAtual) : null;
    if(!p) return { data:null, vencida:false }; if(p < r && !terminal(d, i.statusId)) return { data:r, vencida:true }; return { data:p, vencida:false }; };
  /** Desvio de prazo em meses de calendário: mesIdx(prevEf) − mesIdx(dataPlanejada); null sem baseline. */
  const desvioMeses = (d, i, o) => { i = asIni(d, i); if(!i || !i.dataPlanejada) return null; const p = previsaoEfetiva(d, i, o).data; return p ? mesIdx(p) - mesIdx(i.dataPlanejada) : null; };
  /** Sinal calculado com motivo: pior dimensão entre prazo e custo; dado faltante → CINZA (nunca Verde por omissão). null se a iniciativa não existe. */
  function sinal(d, i, o = {}){
    i = asIni(d, i); if(!i) return null; const L = param(d, 'R13'), pv = previsaoEfetiva(d, i, o), dv = desvioMeses(d, i, o), B = bac(d, i), A = ac(d, i), ix = indice(d, i);
    const declarado = i.ragDeclarado || null, base = { id:i.id, desvio:dv, indice:ix, previsaoVencida:pv.vencida, declarado };
    const faltas = [];
    if(!i.dataPlanejada) faltas.push('sem baseline (data planejada)'); else if(!pv.data) faltas.push('sem data prevista');
    if(!(B > 0)) faltas.push('sem BAC válido'); else if(!(A > 0)) faltas.push('sem AC (realizado) válido'); else if(ix == null) faltas.push('sem % físico');
    if(faltas.length) return Object.assign(base, { cor:'CINZA', prazo:null, custo:null, divergente: declarado != null && declarado !== 'CINZA', motivo: faltas.join('; ') + ' → Cinza' });
    const mes = n => n === 1 || n === -1 ? 'mês' : 'meses', x = arred(ix, 6);
    const prazo = dv >= L.vermelhoDesvioMeses ? 'VERMELHO' : dv >= L.amareloDesvioMeses ? 'AMARELO' : 'VERDE';
    const custo = x < L.vermelhoIndiceAbaixoDe ? 'VERMELHO' : x < L.amareloIndiceAbaixoDe ? 'AMARELO' : 'VERDE';
    const cor = COR[prazo] >= COR[custo] ? prazo : custo;
    const tp = prazo === 'VERMELHO' ? `desvio ${dv} ${mes(dv)} ≥ ${L.vermelhoDesvioMeses}` : prazo === 'AMARELO' ? `desvio ${dv} ${mes(dv)} (${L.amareloDesvioMeses} a ${L.vermelhoDesvioMeses - 1})` : `desvio ${dv} ${mes(dv)} < ${L.amareloDesvioMeses}`;
    const tc = custo === 'VERMELHO' ? `índice ${ptBR(ix)} < ${ptBR(L.vermelhoIndiceAbaixoDe)}` : custo === 'AMARELO' ? `índice ${ptBR(ix)} (${ptBR(L.vermelhoIndiceAbaixoDe)} a < ${ptBR(L.amareloIndiceAbaixoDe)})` : `índice ${ptBR(ix)} ≥ ${ptBR(L.amareloIndiceAbaixoDe)}`;
    return Object.assign(base, { cor, prazo, custo, divergente: declarado != null && declarado !== cor,
      motivo: `${tp}; ${tc} → ${NOME_COR[cor]}${pv.vencida ? ' (previsão vencida: usa a referência)' : ''}` });
  }
  /** Sinais das iniciativas em execução (ou da lista dada). */
  const sinais = (d, lista, o) => (lista || emExecucao(d)).map(i => sinal(d, i, o));
  /** Divergência declarado × calculado de uma iniciativa (declarado vazio não diverge). */
  const divergencia = (d, i, o) => sinal(d, i, o).divergente;

  /* ================================================================ horizonte 30/60/90 (R08) */
  /** Faixa da data prevista: VENCIDO (antes da ref), 30/60/90_DIAS (inclusivo; a ref cai em 30), ACIMA_90, SEM_DATA. Aceita iniciativa ou data. */
  function horizonte(d, i, o = {}){
    const data = typeof i === 'string' && /^\d{4}-/.test(i) ? i : (asIni(d, i) || {}).dataPrevistaAtual;
    if(!data) return { faixa:'SEM_DATA', dias:null };
    const n = dias(ref(d, o), data), f = param(d, 'R08').faixas || [30, 60, 90];
    if(n < 0) return { faixa:'VENCIDO', dias:n };
    const k = f.find(x => n <= x); return { faixa: k != null ? `${k}_DIAS` : `ACIMA_${f[f.length - 1]}`, dias:n };
  }
  /** Contagem por faixa: em execução (padrão) ou todas as ativas (o.todasAtivas, como a RPC get_horizonte_datas). */
  function horizontes(d, o = {}){
    const f = param(d, 'R08').faixas || [30, 60, 90], lista = o.lista || (o.todasAtivas ? ativas(d) : emExecucao(d));
    const contagem = { VENCIDO:0 }; f.forEach(x => contagem[`${x}_DIAS`] = 0); contagem[`ACIMA_${f[f.length - 1]}`] = 0; contagem.SEM_DATA = 0;
    const itens = lista.map(i => Object.assign({ id:i.id }, horizonte(d, i, o))); itens.forEach(h => contagem[h.faixa]++);
    return { contagem, itens };
  }

  /* ================================================================ completude (R10a/R10b) */
  /** Campos obrigatórios R10a + R10b. */
  const camposObrigatorios = d => [].concat(param(d, 'R10a') || [], param(d, 'R10b') || []);
  /** Campos obrigatórios vazios de uma iniciativa ('bac' usa o BAC válido). */
  const camposVazios = (d, i) => { i = asIni(d, i); if(!i) return null; return camposObrigatorios(d).filter(c => vazio(c === 'bac' ? bac(d, i) : i[c])); };
  /** Completude cadastral: preenchidos / (|lista| × nº de campos) e a lista de faltas. */
  function completude(d, lista){
    lista = lista || emExecucao(d); const n = camposObrigatorios(d).length, faltas = [];
    lista.forEach(i => camposVazios(d, i).forEach(campo => faltas.push({ id:i.id, campo })));
    const total = lista.length * n; return { preenchidos: total - faltas.length, total, pct: div(total - faltas.length, total), faltas };
  }

  /* ================================================================ demandas (R16) */
  /** Idade da demanda em dias até a referência. */
  const idadeDemanda = (d, i, o) => dias((asIni(d, i) || {}).dataEntrada, ref(d, o));
  /** Idades da fila DEMANDA: mediana e as acima do limiar R16. */
  function idadeDemandas(d, o = {}){
    const lim = o.limiar != null ? o.limiar : param(d, 'R16'), lista = demandas(d).map(i => ({ id:i.id, dias: idadeDemanda(d, i, o) }));
    return { lista, mediana: mediana(lista.map(x => x.dias)), limiar:lim, acima: lista.filter(x => x.dias > lim).map(x => x.id) };
  }

  /* ================================================================ riscos e dependências (R09, literais §4.2) */
  const fechados = d => param(d, 'R09');
  const up = (s, def) => String(s == null ? def : s).trim().toUpperCase();
  /** Risco aberto: upper(status ?? 'ABERTO') fora de RESOLVIDO/CONCLUIDO/FECHADO (vazio ou "EM TRATAMENTO" = aberto). */
  const riscoAberto = (d, r) => !(fechados(d).riscos || []).includes(up(r.status, 'ABERTO'));
  /** Risco vencido: aberto e prazo anterior à referência. */
  const riscoVencido = (d, r, o) => riscoAberto(d, r) && !!r.prazo && dia(r.prazo) < ref(d, o);
  /** Riscos e impedimentos abertos das iniciativas de A (ou o.ids). */
  function riscosAbertos(d, o = {}){
    const ids = o.ids || emExecucao(d).map(i => i.id);
    return (d.riscosImpedimentos || []).filter(r => ids.includes(r.iniciativaId) && riscoAberto(d, r)).map(r => Object.assign({}, r, { vencido: riscoVencido(d, r, o) }));
  }
  /** Dependência aberta: upper(status ?? 'ABERTA') fora de RESOLVIDA/CONCLUIDA/FECHADA ("A CONFIRMAR" = aberta). */
  const dependenciaAberta = (d, x) => !(fechados(d).dependencias || []).includes(up(x.status, 'ABERTA'));
  /** Dependências abertas cuja origem está em A (padrão, como I1.16) ou em o.ids; o.todas = todas. */
  function dependenciasAbertas(d, o = {}){
    const ids = o.todas ? null : (o.ids || emExecucao(d).map(i => i.id));
    return (d.dependencias || []).filter(x => dependenciaAberta(d, x) && (!ids || ids.includes(x.iniciativaOrigemId)));
  }
  /** "X é bloqueada por Y": dependências abertas entre iniciativas, com a cor calculada de Y. */
  function bloqueios(d, o = {}){
    return dependenciasAbertas(d, o).filter(x => x.iniciativaDependenciaId && ini(d, x.iniciativaDependenciaId)).map(x => {
      const s = sinal(d, x.iniciativaDependenciaId, o); return { dependenciaId:x.id, bloqueada:x.iniciativaOrigemId, por:x.iniciativaDependenciaId, corPor:s.cor, porVermelha: s.cor === 'VERMELHO' }; });
  }

  /* ================================================================ indicadores N1 */
  /** I1.2 mix por categoria: contagem e Σbac de A. */
  function mixCategoria(d, lista){
    lista = lista || emExecucao(d); const cats = uniq(lista.map(i => i.categoria || 'SEM_CATEGORIA')), tb = soma(lista, i => bac(d, i));
    const contagem = {}, valor = {}, pctContagem = {}, pctValor = {};
    cats.forEach(k => { const g = lista.filter(i => (i.categoria || 'SEM_CATEGORIA') === k); contagem[k] = g.length; valor[k] = arred(soma(g, i => bac(d, i)), 6); pctContagem[k] = div(g.length, lista.length); pctValor[k] = div(valor[k], tb); });
    return { contagem, valor, pctContagem, pctValor, total:lista.length, bacTotal: arred(tb, 6) };
  }
  /** I1.3 distribuição do sinal (Cinza no denominador). o.ref muda a data de referência. */
  function distribuicaoSinal(d, o){ const s = sinais(d, null, o), c = { VERDE:0, AMARELO:0, VERMELHO:0, CINZA:0 }; s.forEach(x => c[x.cor]++);
    const pct = {}; Object.keys(c).forEach(k => pct[k] = div(c[k], s.length)); return { contagem:c, pct, total:s.length }; }
  /** I1.4 % do orçamento em vermelho: Σbac(vermelhas)/Σbac(A); também por contagem. o.ref muda a data de referência. */
  function pctOrcamentoVermelho(d, o){
    const A = emExecucao(d), s = sinais(d, A, o), v = s.filter(x => x.cor === 'VERMELHO').map(x => x.id), num_ = soma(v, id => bac(d, id)), den = soma(A, i => bac(d, i));
    return { valor: div(num_, den), porContagem: div(v.length, A.length), ids:v, numerador: arred(num_, 6), denominador: arred(den, 6) };
  }
  /** I1.5 execução orçamentária Σac/Σbac. */
  function execucaoOrcamentaria(d){ const A = emExecucao(d), a = soma(A, i => ac(d, i)), b = soma(A, i => bac(d, i)); return { valor: div(a, b), ac: arred(a, 6), bac: arred(b, 6) }; }
  /** I1.6 índice progresso × gasto por iniciativa de A. */
  const indices = d => { const o = {}; emExecucao(d).forEach(i => o[i.id] = indice(d, i)); return o; };
  /** I1.7 desvios (só com baseline): lista, média e mediana. */
  function desvios(d, o){ const lista = emExecucao(d).map(i => ({ id:i.id, desvio: desvioMeses(d, i, o) })).filter(x => x.desvio != null);
    const v = lista.map(x => x.desvio); return { lista, valores:v, media: media(v), mediana: mediana(v) }; }
  /** I1.8 % no prazo: desvio ≤ tolerância (R15 por padrão) / com baseline. */
  function pctNoPrazo(d, tol, o){ tol = tol != null ? tol : param(d, 'R15'); const v = desvios(d, o).valores; return div(v.filter(x => x <= tol).length, v.length); }
  /** I1.9 % de A vinculadas a objetivo estratégico. */
  function pctVinculadas(d){ const A = emExecucao(d), n = A.filter(i => !vazio(i.objetivoEstrategicoId)).length; return { valor: div(n, A.length), n, total:A.length, sem: A.filter(i => vazio(i.objetivoEstrategicoId)).map(i => i.id) }; }
  /** I1.12 divergência de sinal: declarado ≠ null e ≠ calculado / declarado ≠ null. */
  function divergenciaSinal(d, o){ const s = sinais(d, null, o).filter(x => x.declarado != null), ids = s.filter(x => x.divergente).map(x => x.id); return { valor: div(ids.length, s.length), n:ids.length, total:s.length, ids }; }
  /** I1.13 concentração top-k: Σbac das k maiores / Σbac(A). */
  function concentracaoTop(d, k = 2){ const A = emExecucao(d).map(i => ({ id:i.id, bac: bac(d, i) || 0 })).sort((a, b) => b.bac - a.bac || (a.id < b.id ? -1 : 1));
    const top = A.slice(0, k); return { valor: div(soma(top, x => x.bac), soma(A, x => x.bac)), ids: top.map(x => x.id) }; }

  /* ================================================================ triagem T1–T6 (R17) */
  /** Checklist T1–T6 de uma demanda, com o campo que comprova cada item. */
  function checklistTriagem(d, i){
    i = asIni(d, i); if(!i) return null; const t = i.triagem || {}, e = i.estimativaInformada, itens = (param(d, 'R17') || {}).itens || [];
    const p = id => (itens.find(x => x.id === id) || {}).pergunta || id;
    return [
      { id:'T1', ok: t.itemDePortfolio === true, campo:'triagem.itemDePortfolio', valor:t.itemDePortfolio ?? null },
      { id:'T2', ok: !vazio(i.patrocinador), campo:'patrocinador', valor:i.patrocinador ?? null },
      { id:'T3', ok: !vazio(i.objetivoEstrategicoId), campo:'objetivoEstrategicoId', valor:i.objetivoEstrategicoId ?? null },
      { id:'T4', ok: !t.outroFluxo && !t.exigeNovaMetodologia && t.escopoFEG !== false, campo:'triagem.outroFluxo, triagem.exigeNovaMetodologia', valor:{ outroFluxo:!!t.outroFluxo, exigeNovaMetodologia:!!t.exigeNovaMetodologia, escopoFEG:t.escopoFEG !== false } },
      { id:'T5', ok: vazio(t.redundanteComId), campo:'triagem.redundanteComId', valor:t.redundanteComId ?? null },
      { id:'T6', ok: !!e && num(e.valor) != null && num(e.valor) > 0, campo:'estimativaInformada', valor: e ? `${e.valor} ${e.unidade}` : null },
    ].map(x => Object.assign(x, { pergunta: p(x.id) }));
  }
  /** Saída sugerida pela precedência T1 → T4 → T5 → T2/T3/T6 → ADMITIR, com destino ou vínculo. */
  function triagemSugerida(d, i){
    i = asIni(d, i); if(!i) return null; const c = {}; checklistTriagem(d, i).forEach(x => c[x.id] = x); const t = i.triagem || {}, R17 = param(d, 'R17') || {};
    if(!c.T1.ok) return { id:i.id, saida:'REDIRECIONAR_EXECUCAO', item:'T1', destino:`ITSM/ADO da ${i.squadId || i.comunidadeId}`, motivo:'Não é item de portfólio (T1): segue no fluxo de execução.' };
    if(!c.T4.ok){
      if(t.exigeNovaMetodologia){ const dest = ((R17.destinoExploratorio || {})[i.gerenciaId]) || 'PEN';
        return { id:i.id, saida:'ENCAMINHAR_EXPLORATORIO', item:'T4', destino:`Comunidade Técnica ${dest}`, motivo:'Exige nova metodologia: escopo exploratório da Comunidade Técnica (T4; s182).' }; }
      return { id:i.id, saida:'REDIRECIONAR_EXECUCAO', item:'T4', destino:`ITSM/ADO da ${i.squadId || i.comunidadeId}`, motivo:'Pertence a outro fluxo ou fora do escopo (T4).' };
    }
    if(!c.T5.ok) return { id:i.id, saida:'ARQUIVAR', item:'T5', vinculo:t.redundanteComId, motivo:`Redundante com ${t.redundanteComId} (T5).` };
    const faltas = ['T2','T3','T6'].filter(k => !c[k].ok);
    if(faltas.length) return { id:i.id, saida:'DEVOLVER', item:faltas[0], faltas, motivo:`Falta ${faltas.map(k => ({ T2:'patrocinador', T3:'objetivo', T6:'estimativa mínima' })[k]).join(', ')} (${faltas.join(', ')}).` };
    const pendente = !!i.candidataObrigatoria && !(i.evidenciaObrigatoriedade && i.evidenciaObrigatoriedade.anexada);
    return { id:i.id, saida:'ADMITIR', item:null, observacao: pendente ? 'evidência pendente' : null,
      motivo: pendente ? 'Admitir como "candidata a obrigatória: evidência pendente"; a unidade da estimativa se resolve na qualificação.' : 'Checklist completo: admitir para análise.' };
  }
  /** Nota da triagem da fila: 1 ponto por acerto; DEVOLVER numa admissão com evidência pendente vale 0,5. o.ids fixa a fila (padrão: demandas ativas de d). */
  function avaliarTriagem(d, escolhas, o = {}){
    const fila = o.ids ? o.ids.map(id => ini(d, id)).filter(Boolean) : demandas(d);
    const por = fila.map(i => { const g = triagemSugerida(d, i), e = (escolhas || {})[i.id] || null;
      const pontos = e === g.saida ? 1 : (g.observacao === 'evidência pendente' && e === 'DEVOLVER') ? 0.5 : 0; return { id:i.id, escolhida:e, gabarito:g.saida, pontos, motivo:g.motivo }; });
    const nota = soma(por, x => x.pontos); return { nota, max: por.length, ok: nota >= Math.min(4, por.length) - EPS, porDemanda: por };
  }

  /* ================================================================ decisões vigentes */
  const quando = x => String(x.registradoEm || x.decididoEm || '');
  /** Decisões não corrigidas (nenhuma CORRECAO_REGISTRO aponta para elas). */
  function decisoesVigentes(d){ const corr = new Set((d.decisoes || []).filter(x => x.tipoDecisao === 'CORRECAO_REGISTRO' && x.refDecisaoAnteriorId).map(x => x.refDecisaoAnteriorId));
    return (d.decisoes || []).filter(x => !corr.has(x.id)); }
  /** Decisão vigente mais recente de uma iniciativa (opcionalmente só dos tipos dados). */
  function decisaoVigente(d, iniciativaId, tipos){ const v = decisoesVigentes(d).filter(x => x.iniciativaId === iniciativaId && (!tipos || tipos.includes(x.tipoDecisao)));
    return v.slice().sort((a, b) => quando(a) < quando(b) ? -1 : quando(a) > quando(b) ? 1 : 0).pop() || null; }
  /** Recomendação de triagem vigente (a última não corrigida). */
  const triagemVigente = (d, id) => decisaoVigente(d, id, TRIAGEM);
  /** I2.19 decisões por tipo e taxa de KILL entre as de gate. */
  function decisoesPorTipo(d){ const c = {}; (d.decisoes || []).forEach(x => c[x.tipoDecisao] = (c[x.tipoDecisao] || 0) + 1);
    const g = soma(GATE, k => c[k] || 0), k = (c.KILL || 0); return { contagem:c, total:(d.decisoes || []).length, taxaKill: div(k, (d.decisoes || []).length), taxaKillGate: div(k, g) }; }

  /* ================================================================ EVM (I2.15–I2.17) */
  /** EVM de uma iniciativa: PV, EV, AC, SPI, CPI, EAC (+ VAC, TCPI, ETC, EAC × previsão). o.fisico/o.ac/o.planejado simulam variantes. */
  function evm(d, i, o = {}){
    i = asIni(d, i); if(!i) return null; const B = bac(d, i), A = o.ac != null ? +o.ac : ac(d, i);
    const f = o.fisico != null ? o.fisico / 100 : fisico(i), pl = o.planejado != null ? +o.planejado : num(i.percentualFisicoPlanejado);
    const pv = pl == null || B == null ? null : pl / 100 * B, ev = f == null || B == null ? null : f * B;
    const cpi = div(ev, A), spi = div(ev, pv), eac = div(B, cpi), resta = B != null && A != null ? B - A : null, P = previsao(d, i);
    return { id:i.id, bac:B, pv, ev, ac:A, spi, cpi, eac, vac: B != null && eac != null ? B - eac : null,
      tcpi: resta != null && resta > EPS && ev != null ? (B - ev) / resta : null, tcpiMotivo: resta != null && resta <= EPS ? 'BAC esgotado (TCPI n/d)' : null,
      etc: eac != null && A != null ? eac - A : null, previsao:P, eacMenosPrevisao: eac != null && P != null ? eac - P : null, eacPctPrevisao: eac != null ? div(eac - P, P) : null };
  }
  /** EVM do portfólio: CPI = ΣEV/ΣAC; SPI = ΣEV/ΣPV só com baseline (e PV). */
  function evmPortfolio(d, lista){
    const e = (lista || emExecucao(d)).map(i => Object.assign(evm(d, i), { baseline: !!asIni(d, i).dataPlanejada }));
    const c = e.filter(x => x.ev != null && x.ac != null), s = e.filter(x => x.baseline && x.pv != null && x.ev != null);
    const EV = soma(c, x => x.ev), AC = soma(c, x => x.ac), EVs = soma(s, x => x.ev), PV = soma(s, x => x.pv);
    return { ev: arred(EV, 6), ac: arred(AC, 6), evSpi: arred(EVs, 6), pv: arred(PV, 6), cpi: div(EV, AC), spi: div(EVs, PV), foraSpi: e.filter(x => !s.includes(x)).map(x => x.id), itens:e };
  }

  /* ================================================================ N2 · notas, valor, risco */
  /** Renormaliza pesos: os fixados mantêm o valor; os demais escalam para somar 1 (w′ⱼ = wⱼ·(1 − Σfix)/(Σ demais)). */
  function renormalizar(pesos, ajuste){
    const ks = Object.keys(pesos); if(!ajuste) return Object.assign({}, pesos);
    const fix = Object.keys(ajuste).filter(k => ks.includes(k));
    if(fix.length === ks.length){ const s = soma(fix, k => ajuste[k]); const o = {}; ks.forEach(k => o[k] = s > 0 ? ajuste[k] / s : 0); return o; }
    const sf = soma(fix, k => ajuste[k]), so = soma(ks.filter(k => !fix.includes(k)), k => pesos[k]), o = {};
    ks.forEach(k => o[k] = fix.includes(k) ? +ajuste[k] : (so > 0 ? pesos[k] * (1 - sf) / so : 0)); return o;
  }
  /** Pesos efetivos: R20 vigente com ajuste opcional (parcial renormaliza os demais). */
  const pesosEfetivos = (d, ajuste) => renormalizar(param(d, 'R20'), ajuste);
  /** Score S = Σ wⱼ·Cⱼ. */
  const score = (notas, pesos) => notas ? arred(Object.keys(pesos).reduce((s, k) => s + pesos[k] * (num(notas[k]) || 0), 0), 10) : null;
  /** N = (S − mín)/(máx − mín) × 100 (R21; escala 1–5 → 0–100). */
  const normalizar = (d, S) => { if(S == null) return null; const e = param(d, 'R21'); return arred((S - e.min) / (e.max - e.min) * 100, 10); };
  /** Avaliação vigente (append-only: a mais recente por registradoEm). */
  const avaliacaoVigente = (d, id) => (d.avaliacoes || []).filter(a => a.iniciativaId === id).slice().sort((a, b) => dia(a.registradoEm) < dia(b.registradoEm) ? -1 : dia(a.registradoEm) > dia(b.registradoEm) ? 1 : 0).pop() || null;
  /** Notas C1–C5 vigentes. */
  const notasVigentes = (d, id) => { const a = avaliacaoVigente(d, id); return a ? a.notasCriterios : null; };
  const periodoCiclo = d => String((param(d, 'R24') || {}).periodo || '2027');
  /** FTE demandado no ciclo (só linhas em FTE; horas ficam fora: INCOMPATIBLE_UNIT). */
  const fte = (d, i) => arred(soma((d.demandasCapacidade || []).filter(x => x.iniciativaId === idOf(i) && up(x.unidade, '') === 'FTE' && String(x.periodo || '').startsWith(periodoCiclo(d))), x => x.capacidadeRequerida), 6);
  /** Custo do ciclo: Σ financeiro do período do ciclo (linhas válidas). */
  const custo = (d, i) => bac(d, i, { periodo: periodoCiclo(d) }) || 0;
  /** Linhas de capacidade/demanda em unidade diferente de FTE (INCOMPATIBLE_UNIT; R25 = null: não converter). */
  const unidadesIncompativeis = d => [].concat(
    (d.demandasCapacidade || []).filter(x => up(x.unidade, '') !== 'FTE').map(x => ({ id:x.id, iniciativaId:x.iniciativaId, valor:x.capacidadeRequerida, unidade:x.unidade, codigo:'INCOMPATIBLE_UNIT' })),
    (d.capacidades || []).filter(x => up(x.unidade, '') !== 'FTE').map(x => ({ id:x.id, referenciaId:x.referenciaId, valor:x.capacidadeDisponivel, unidade:x.unidade, codigo:'INCOMPATIBLE_UNIT' })));
  /** Risco de execução R = máx P×I entre os riscos abertos (com a mitigação desse risco). */
  function riscoDe(d, id){ const rs = (d.riscosImpedimentos || []).filter(r => r.iniciativaId === id && riscoAberto(d, r) && num(r.probabilidade) != null && num(r.impactoNota) != null)
      .map(r => ({ r, R: r.probabilidade * r.impactoNota })).sort((a, b) => b.R - a.R);
    return rs.length ? { R:rs[0].R, P:rs[0].r.probabilidade, I:rs[0].r.impactoNota, acao: vazio(rs[0].r.acao) ? null : rs[0].r.acao, riscoId:rs[0].r.id } : { R:0, P:null, I:null, acao:null, riscoId:null }; }
  /** Candidatas do ciclo (§3.10): ativas, ciclo EX-2027, EM_ANALISE/APROVADA, FTE > 0 e custo > 0. */
  const candidatas = (d, ciclo = 'EX-2027') => ativas(d).filter(i => i.ciclo === ciclo && ['EM_ANALISE','APROVADA'].includes(i.statusId) && fte(d, i) > 0 && custo(d, i) > 0);
  const limiares = d => param(d, 'R22');
  /** Quadrante valor × esforço (R22): N ≥ 60 é valor alto; FTE > 2 é esforço alto. */
  const quadranteVE = (d, r) => { const L = limiares(d), a = r.N >= L.valorAltoN - EPS, e = r.fte > L.esforcoAltoFteAcimaDe + EPS; return a ? (e ? 'PLANEJAR' : 'FAZER_PRIMEIRO') : (e ? 'QUESTIONAR' : 'COMPLEMENTAR'); };
  /** Quadrante valor × risco (bolha de Cooper; R ≥ 12 é risco alto). */
  const quadranteVR = (d, r) => { const L = limiares(d), a = r.N >= L.valorAltoN - EPS, k = r.R >= L.riscoAlto; return a ? (k ? 'OSTRA' : 'PEROLA') : (k ? 'ELEFANTE_BRANCO' : 'PAO_COM_MANTEIGA'); };
  /** Tabela das candidatas: notas, S, N, N/FTE, N/R$, R, mitigação, quadrantes e atributos usados no N3. o.pesos/o.notas/o.extras. */
  function linhasCandidatas(d, o = {}){
    const w = pesosEfetivos(d, o.pesos), cls = id => { const f = byId(d.ferramentas, id); return f ? f.classeSourcing : null; };
    const rows = candidatas(d, o.ciclo).map(i => {
      const notas = (o.notas && o.notas[i.id]) || notasVigentes(d, i.id), S = score(notas, w), N = normalizar(d, S), F = fte(d, i), Cu = custo(d, i), k = riscoDe(d, i.id);
      return { id:i.id, titulo:i.titulo, categoria:i.categoria, gerenciaId:i.gerenciaId, comunidadeId:i.comunidadeId, ferramentaId:i.ferramentaId || null, classeSourcing: cls(i.ferramentaId),
        horizonte:i.horizonteInovacao || null, K: (i.pessoasChave || []).length > 0, grupo:i.grupoExclusividade || null, obrigatoria: !!i.obrigatoria,
        fte:F, custo:Cu, notas, S, N, nFte: div(N, F), nCusto: div(N, Cu), R:k.R, P:k.P, I:k.I, acao:k.acao, extra:false };
    });
    (o.extras || []).forEach(x => rows.push(Object.assign({ notas:null, S:null, N:0, R:0, K:false, grupo:null, obrigatoria:false, titulo:x.id }, x,
      { classeSourcing: cls(x.ferramentaId), horizonte: x.horizonteInovacao || x.horizonte || null, nFte: div(x.N || 0, x.fte), nCusto: div(x.N || 0, x.custo), extra:true })));
    rows.forEach(r => { r.qVE = quadranteVE(d, r); r.qVR = quadranteVR(d, r); });
    return rows;
  }
  /** Comparador do ranking (R23): maior N → menor R → maior C1 → código; sem desempate: N → código. */
  const cmpRanking = desempate => (a, b) => { const dn = (b.N ?? -1e9) - (a.N ?? -1e9); if(Math.abs(dn) > EPS) return dn;
    if(desempate){ if((a.R || 0) !== (b.R || 0)) return (a.R || 0) - (b.R || 0); const c = ((b.notas || {}).C1 || 0) - ((a.notas || {}).C1 || 0); if(c) return c; }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; };
  /** Ranking das candidatas com posição, desempate aplicado e empates técnicos (|ΔN| < R23). */
  function ranking(d, o = {}){
    const rows = (o.rows || linhasCandidatas(d, o)).filter(r => !r.extra).slice().sort(cmpRanking(o.desempate !== false)), lim = (param(d, 'R23') || {}).empateTecnicoDeltaN || 1;
    return rows.map((r, k) => Object.assign({}, r, { posicao:k + 1, empateExato: rows.some(x => x !== r && Math.abs(x.N - r.N) < EPS),
      empateTecnicoCom: rows.filter(x => x !== r && Math.abs(x.N - r.N) < lim - EPS).map(x => x.id) }));
  }

  /* ================================================================ N2 · capacidade (R24–R27) e mix (R28) */
  /** Capacidade por gerência no período do ciclo (linhas GERENCIA em FTE). */
  function capacidadePorGerencia(d){ const o = {}; (d.capacidades || []).filter(x => x.nivelOrganizacional === 'GERENCIA' && up(x.unidade, '') === 'FTE' && String(x.periodo || '').startsWith(periodoCiclo(d)))
      .forEach(x => o[x.referenciaId] = arred((o[x.referenciaId] || 0) + (num(x.capacidadeDisponivel) || 0), 6));
    if(!Object.keys(o).length) Object.assign(o, (param(d, 'R24') || {}).porGerencia || {}); return o; }
  /** Capacidade por comunidade (informativa). */
  function capacidadePorComunidade(d){ const o = {}; (d.capacidades || []).filter(x => x.nivelOrganizacional === 'COMUNIDADE' && up(x.unidade, '') === 'FTE' && String(x.periodo || '').startsWith(periodoCiclo(d)))
      .forEach(x => o[x.referenciaId] = arred((o[x.referenciaId] || 0) + (num(x.capacidadeDisponivel) || 0), 6)); return o; }
  /** Capacidade total do ciclo (Σ gerências; fallback R24). */
  const capacidadeTotal = d => { const g = capacidadePorGerencia(d), s = soma(Object.values(g)); return s > 0 ? arred(s, 6) : num((param(d, 'R24') || {}).fteTotal); };
  /** Orçamento do ciclo (R24). */
  const orcamentoCiclo = d => num((param(d, 'R24') || {}).orcamento);
  const capEf = (d, o = {}) => (o.cap != null ? +o.cap : capacidadeTotal(d)) * (1 - (o.reserva || 0));
  const orcEf = (d, o = {}) => o.orc != null ? +o.orc : orcamentoCiclo(d);
  /** Faixa R26 para a utilização u: TANQUE (> 100%), REDUZIR (90–100%), ROADMAP (75–90%), AUTONOMIA (< 75%). */
  function faixaCapacidade(d, u){ if(u == null) return null; const F = param(d, 'R26'), x = arred(u, 6);
    const id = x > F.tanqueAcimaDe + EPS ? 'TANQUE' : x >= F.reduzirAPartirDe - EPS ? 'REDUZIR' : x >= F.roadmapAPartirDe - EPS ? 'ROADMAP' : 'AUTONOMIA'; return { id, acao: (F.acoes || {})[id] || id }; }
  /** I2.5 utilização da demanda: Σfte(C)/capacidade e Σcusto(C)/orçamento. */
  function utilizacaoDemanda(d, o = {}){ const rows = o.rows || linhasCandidatas(d, o), f = soma(rows, r => r.fte), c = soma(rows, r => r.custo), cap = capEf(d, o), orc = orcEf(d, o);
    return { fte: arred(f, 6), cap, pctFte: div(f, cap), custo: arred(c, 6), orc, pctCusto: div(c, orc), faixa: faixaCapacidade(d, div(f, cap)) }; }
  /** I2.6 capacidade discricionária: capacidade − obrigatórias (FTE e R$). */
  function discricionaria(d, o = {}){ const rows = o.rows || linhasCandidatas(d, o), ob = rows.filter(r => r.obrigatoria);
    return { fte: arred(capEf(d, o) - soma(ob, r => r.fte), 6), custo: arred(orcEf(d, o) - soma(ob, r => r.custo), 6), obrigatorias: ob.map(r => r.id) }; }
  const discr = r => !r.obrigatoria && r.categoria !== 'OBRIGATORIA';
  /** I2.13 índice D = ½ Σ |custoₖ/custo_disc − alvoₖ| na parcela discricionária (null se custo discricionário = 0). */
  function indiceD(d, ids, o = {}){
    const rows = o.rows || linhasCandidatas(d, o), alvo = o.alvo || param(d, 'R28').alvo, sel = rows.filter(r => ids.includes(r.id) && discr(r)), tot = soma(sel, r => r.custo);
    const cats = uniq(Object.keys(alvo).concat(sel.map(r => r.categoria))), pct = {};
    cats.forEach(k => pct[k] = tot > 0 ? soma(sel.filter(r => r.categoria === k), r => r.custo) / tot : null);
    return { D: tot > 0 ? arred(cats.reduce((s, k) => s + Math.abs(pct[k] - (alvo[k] || 0)), 0) / 2, 10) : null, custoDisc: arred(tot, 6), pct, alvo };
  }
  /** I2.11 exposição ponderada ΣR·custo/Σcusto. */
  const exposicao = (rows, ids) => { const s = rows.filter(r => ids.includes(r.id)); return div(soma(s, r => r.R * r.custo), soma(s, r => r.custo)); };
  /** I2.12 % do custo em risco crítico (R ≥ R22.riscoCritico). */
  const pctCustoCritico = (d, rows, ids) => { const s = rows.filter(r => ids.includes(r.id)), L = limiares(d); return div(soma(s.filter(r => r.R >= L.riscoCritico), r => r.custo), soma(s, r => r.custo)); };
  /** Resumo de uma carteira: FTE, R$, valor ΣN, ociosidade, D, exposição, faixa e viabilidade nas restrições de o. */
  function resumoCarteira(d, ids, o = {}){
    const rows = o.rows || linhasCandidatas(d, o), sel = rows.filter(r => ids.includes(r.id)), cap = capEf(d, o), orc = orcEf(d, o);
    const f = soma(sel, r => Math.round(r.fte * 100)) / 100, c = soma(sel, r => Math.round(r.custo * 1000)) / 1000, D = indiceD(d, ids, { rows, alvo:o.alvo });
    return { ids: sel.map(r => r.id).sort(), fte:f, custo:c, valor: arred(soma(sel, r => r.N || 0), 8), ociosidade: arred(cap - f, 6), folgaOrc: arred(orc - c, 6), cap, orc,
      D:D.D, mix:D.pct, exposicao: exposicao(rows, ids), pctCritico: pctCustoCritico(d, rows, ids), u: div(f, cap), faixa: faixaCapacidade(d, div(f, cap)),
      viavel: f <= cap + EPS && c <= orc + EPS, estouro:{ fte: f > cap + EPS ? arred(f - cap, 6) : 0, custo: c > orc + EPS ? arred(c - orc, 6) : 0 } };
  }
  const obrigIds = (rows, o) => o.obrig ? o.obrig.filter(id => rows.some(r => r.id === id)) : rows.filter(r => r.obrigatoria).map(r => r.id);
  const comEficiencia = (d, res, o) => { const v = otimizar(d, o); return Object.assign(res, { otimo: v.valor, eficiencia: div(res.valor, v.valor) }); };
  /** Linha de corte: obrigatórias primeiro; segue o ranking e PARA no primeiro que não cabe (o.desempate=false: sem R23). */
  function linhaDeCorte(d, o = {}){
    const rows = o.rows || linhasCandidatas(d, o), O = Object.assign({}, o, { rows }), capI = Math.floor(capEf(d, o) * 100 + 1e-6), orcI = Math.floor(orcEf(d, o) * 1000 + 1e-6);
    const sel = obrigIds(rows, o); let f = soma(rows.filter(r => sel.includes(r.id)), r => Math.round(r.fte * 100)), c = soma(rows.filter(r => sel.includes(r.id)), r => Math.round(r.custo * 1000));
    const ordem = rows.filter(r => !sel.includes(r.id) && !r.extra).slice().sort(cmpRanking(o.desempate !== false));
    for(const r of ordem){ const df = Math.round(r.fte * 100), dc = Math.round(r.custo * 1000); if(f + df <= capI && c + dc <= orcI){ sel.push(r.id); f += df; c += dc; } else break; }
    return comEficiencia(d, Object.assign({ metodo:'CORTE', ordem: sel.slice() }, resumoCarteira(d, sel, O)), O);
  }
  /** Guloso por N/FTE: obrigatórias primeiro; depois maior N/FTE que ainda cabe (pula o que não cabe). */
  function guloso(d, o = {}){
    const rows = o.rows || linhasCandidatas(d, o), O = Object.assign({}, o, { rows }), capI = Math.floor(capEf(d, o) * 100 + 1e-6), orcI = Math.floor(orcEf(d, o) * 1000 + 1e-6);
    const sel = obrigIds(rows, o); let f = soma(rows.filter(r => sel.includes(r.id)), r => Math.round(r.fte * 100)), c = soma(rows.filter(r => sel.includes(r.id)), r => Math.round(r.custo * 1000));
    const rk = cmpRanking(true), ordem = rows.filter(r => !sel.includes(r.id) && !r.extra).slice().sort((a, b) => { const x = (b.nFte || 0) - (a.nFte || 0); return Math.abs(x) > EPS ? x : rk(a, b); });
    for(const r of ordem){ const df = Math.round(r.fte * 100), dc = Math.round(r.custo * 1000); if(f + df <= capI && c + dc <= orcI){ sel.push(r.id); f += df; c += dc; } }
    return comEficiencia(d, Object.assign({ metodo:'GULOSO', ordem: sel.slice() }, resumoCarteira(d, sel, O)), O);
  }

  /* ================================================================ otimizador exato (N2/N3) */
  const memo = new Map();
  /** Ótimo exato por enumeração (n ≤ 14; inteiros internos: centésimos de FTE e R$ mil). Restrições de o; desempate §3.10. Devolve também a margem para a 2ª melhor carteira (empate técnico). */
  function otimizar(d, o = {}){
    const rows = o.rows || linhasCandidatas(d, o), n = rows.length;
    if(n > 14) return { viavel:false, desligado:true, ids:[], valor:null, avaliadas:0, motivo:'Mais de 14 candidatas: enumeração exata desligada. Use as heurísticas (linha de corte e guloso).' };
    const capI = Math.floor(capEf(d, o) * 100 + 1e-6), orcI = Math.floor(orcEf(d, o) * 1000 + 1e-6), alvo = o.alvo || param(d, 'R28').alvo, idx = id => rows.findIndex(r => r.id === id);
    const gc = o.gcap ? (o.gcap === true ? capacidadePorGerencia(d) : o.gcap) : null, maxD = o.maxD != null ? +o.maxD : null;
    const obrig = obrigIds(rows, o), lim = (param(d, 'R23') || {}).empateTecnicoDeltaN || 1;
    const gs = gc ? uniq(rows.map(r => r.gerenciaId)) : [];
    /* A memória guarda só o resultado da BUSCA (ids e valores). O resumo (D, exposição, faixa R26, % crítico R22…) é refeito
       a cada chamada, para que parâmetros editáveis que não mudam a busca nunca fiquem velhos. */
    const key = JSON.stringify([rows.map(r => [r.id, r.fte, r.custo, r.N, r.R, r.categoria, r.gerenciaId, r.obrigatoria]), capI, orcI, obrig, o.forcar || [], o.proibir || [], o.deps || [], o.excl || [], gc, maxD, alvo]);
    let busca = memo.get(key);
    if(!busca){ busca = buscaExata(rows, { capI, orcI, alvo, gc, gs, maxD, obrig, forcar:o.forcar, proibir:o.proibir, deps:o.deps, excl:o.excl, idx });
      if(memo.size > 400) memo.clear(); memo.set(key, busca); }
    if(!busca.best) return { viavel:false, ids:[], valor:null, avaliadas: 1 << n, viaveis:0, motivo:'Nenhuma carteira atende a todas as restrições (as obrigatórias cabem?).' };
    const best = busca.best, second = busca.second, r = resumoCarteira(d, best.ids, Object.assign({}, o, { rows }));
    return Object.assign(r, { viavel:true, valor: arred(best.v, 8), riscoMedio: best.rm, avaliadas: 1 << n, viaveis: busca.viaveis,
      segunda: second ? { ids: second.ids.slice(), valor: arred(second.v, 8) } : null, margem: second ? arred(best.v - second.v, 8) : null,
      empateTecnico: !!second && best.v - second.v < lim - EPS,
      porGerencia: gs.length ? Object.fromEntries(gs.map(g => [g, soma(rows.filter(x => best.ids.includes(x.id) && x.gerenciaId === g), x => Math.round(x.fte * 100)) / 100])) : null });
  }
  /** Enumeração exata (interna ao otimizador): melhor e 2ª melhor carteira viáveis, com o desempate da §3.10. */
  function buscaExata(rows, p){
    const n = rows.length, { capI, orcI, alvo, gc, gs, maxD, idx } = p;
    const F = rows.map(r => Math.round(r.fte * 100)), Cu = rows.map(r => Math.round(r.custo * 1000)), V = rows.map(r => r.N || 0), Rk = rows.map(r => r.R || 0);
    let must = 0, ban = 0; p.obrig.concat(p.forcar || []).forEach(id => { const k = idx(id); if(k >= 0) must |= 1 << k; }); (p.proibir || []).forEach(id => { const k = idx(id); if(k >= 0) ban |= 1 << k; });
    const deps = []; (p.deps || []).forEach(([a, b]) => { const ia = idx(a), ib = idx(b); if(ia < 0) return; if(ib < 0) ban |= 1 << ia; else deps.push([1 << ia, 1 << ib]); });
    const excl = (p.excl || []).map(g => g.map(idx).filter(k => k >= 0).reduce((m, k) => m | 1 << k, 0));
    const gi = rows.map(r => gs.indexOf(r.gerenciaId)), gCap = gs.map(g => Math.floor((num(gc[g]) || 0) * 100 + 1e-6));
    const cats = uniq(Object.keys(alvo).concat(rows.map(r => r.categoria))), ci = rows.map(r => discr(r) ? cats.indexOf(r.categoria) : -1);
    const bits = m => { let c = 0; while(m){ m &= m - 1; c++; } return c; };
    let best = null, second = null, viaveis = 0;
    const melhor = (a, b) => { if(!b) return true; if(a.v > b.v + EPS) return true; if(a.v < b.v - EPS) return false; if(a.f !== b.f) return a.f < b.f; if(a.c !== b.c) return a.c < b.c;
      if(Math.abs(a.rm - b.rm) > EPS) return a.rm < b.rm; return a.k < b.k; };
    for(let m = 0; m < (1 << n); m++){
      if((m & must) !== must || (m & ban)) continue;
      let f = 0, c = 0, v = 0, rs = 0, q = 0; for(let k = 0; k < n; k++) if(m & (1 << k)){ f += F[k]; c += Cu[k]; v += V[k]; rs += Rk[k]; q++; }
      if(f > capI || c > orcI) continue;
      if(deps.some(([a, b]) => (m & a) && !(m & b))) continue;
      if(excl.some(g => bits(m & g) > 1)) continue;
      if(gc){ const u = gs.map(() => 0); for(let k = 0; k < n; k++) if(m & (1 << k)) u[gi[k]] += F[k]; if(u.some((x, j) => x > gCap[j])) continue; }
      if(maxD != null){ const pc = cats.map(() => 0); let t = 0; for(let k = 0; k < n; k++) if((m & (1 << k)) && ci[k] >= 0){ pc[ci[k]] += Cu[k]; t += Cu[k]; }
        if(!(t > 0)) continue; const D = cats.reduce((s, k, j) => s + Math.abs(pc[j] / t - (alvo[k] || 0)), 0) / 2; if(D > maxD + EPS) continue; }
      viaveis++;
      const ids = rows.filter((r, k) => m & (1 << k)).map(r => r.id).sort(), cand = { m, v, f, c, rm: q ? rs / q : 0, k: ids.join(','), ids };
      if(melhor(cand, best)){ second = best; best = cand; } else if(!second || melhor(cand, second)) second = cand;
    }
    return { best: best && { ids:best.ids, v:best.v, rm:best.rm }, second: second && { ids:second.ids, v:second.v }, viaveis };
  }
  /** Os três métodos lado a lado (N2): corte, corte sem desempate, guloso N/FTE e ótimo exato, com eficiência V/V*. */
  function metodos(d, o = {}){ const rows = o.rows || linhasCandidatas(d, o), O = Object.assign({}, o, { rows }), ot = otimizar(d, O);
    return { corte: linhaDeCorte(d, O), corteSemDesempate: linhaDeCorte(d, Object.assign({}, O, { desempate:false })), guloso: guloso(d, O), otimo: Object.assign(ot, { metodo:'OTIMO', otimo: ot.valor, eficiencia: ot.valor ? 1 : null }) }; }
  /** "Por que ficou de fora": força cada excluída, reotimiza e mostra ΔV e quem sai, ou que restrição a barra. */
  function porQueFora(d, o = {}){
    const rows = o.rows || linhasCandidatas(d, o), O = Object.assign({}, o, { rows }), b = otimizar(d, O);
    return rows.filter(r => !b.ids.includes(r.id) && !(o.proibir || []).includes(r.id)).map(r => {
      const x = otimizar(d, Object.assign({}, O, { forcar: (o.forcar || []).concat(r.id) }));
      if(x.viavel) return { id:r.id, viavel:true, deltaV: arred(x.valor - b.valor, 8), saem: b.ids.filter(k => !x.ids.includes(k)), entram: x.ids.filter(k => !b.ids.includes(k) && k !== r.id), carteira:x.ids };
      const mot = []; const base = obrigIds(rows, o).concat(r.id), s = resumoCarteira(d, base, O);
      if(s.estouro.fte) mot.push('capacidade (FTE)'); if(s.estouro.custo) mot.push('orçamento');
      (o.deps || []).forEach(([a, z]) => { if(a === r.id && !rows.some(k => k.id === z)) mot.push(`depende de ${z}, fora das candidatas`); });
      (o.excl || []).forEach(g => { if(g.includes(r.id) && base.filter(k => g.includes(k)).length > 1) mot.push('exclusividade'); });
      return { id:r.id, viavel:false, motivo: mot.length ? mot.join('; ') : 'combinação das restrições (gerência, mix ou dependência)' };
    });
  }
  /** Avalia uma seleção manual (DC2-02): viabilidade, V/V*, D, exposição e feedback pela regra da §6.6. Nota = V/V* × 100 (0 se inviável). */
  function avaliarSelecao(d, ids, o = {}){
    ids = ids || []; const rows = o.rows || linhasCandidatas(d, o), O = Object.assign({}, o, { rows }), s = resumoCarteira(d, ids, O), v = otimizar(d, O), tol = param(d, 'R28').toleranciaD;
    const faltaObrig = obrigIds(rows, o).filter(id => !ids.includes(id)), r = Object.assign(s, { otimo:v.valor, delta: v.valor != null ? arred(v.valor - s.valor, 8) : null, eficiencia: div(s.valor, v.valor), nota: Math.round((div(s.valor, v.valor) || 0) * 100) });
    if(!s.viavel || faltaObrig.length) return Object.assign(r, { ok:false, nota:0, caso:'INVIAVEL', feedback: faltaObrig.length ? `Falta a obrigatória ${faltaObrig.join(', ')}.` : `Estoura ${s.estouro.fte ? 'FTE em ' + ptBR(s.estouro.fte, 1) : ''}${s.estouro.fte && s.estouro.custo ? ' e ' : ''}${s.estouro.custo ? 'R$ em ' + ptBR(s.estouro.custo, 2) + ' mi' : ''}.` });
    if(r.eficiencia >= 0.95 - EPS) return Object.assign(r, { ok:true, caso:'PROXIMO_OTIMO', feedback:`A ${ptBR(r.delta)} pontos do ótimo; D ${ptBR((s.D || 0) * 100, 1)} pp; exposição ${ptBR(s.exposicao)}.` });
    if(s.D != null && s.D <= tol + EPS) return Object.assign(r, { ok:true, caso:'MIX', feedback:`Você trocou ${ptBR(r.delta)} pontos por um mix dentro da tolerância. É defensável se registrado; custo de política é tema do N3.` });
    return Object.assign(r, { ok:false, caso:'DEIXA_VALOR', feedback:`Deixa ${ptBR(r.delta)} pontos na mesa; veja o que cabe nos ${ptBR(s.ociosidade, 1)} FTE.` });
  }

  /* ================================================================ N3 · cenários, políticas, fronteira, robustez */
  /** Opções do otimizador a partir das premissas de um cenário (id ou objeto). */
  function optsCenario(d, c){ c = typeof c === 'string' ? byId(d.cenarios, c) : c; const p = (c && c.premissas) || {}, o = {};
    ['cap','orc','deps','excl','maxD','gcap','pesos','extras','obrig','reserva','forcar','proibir'].forEach(k => { if(p[k] != null) o[k] = clone(p[k]); }); return o; }
  /** Resultado do ótimo num cenário (sobre o, se dado). */
  function cenario(d, c, base = {}){ const C = typeof c === 'string' ? byId(d.cenarios, c) : c; const r = otimizar(d, combinar(base, optsCenario(d, C)));
    return Object.assign({ cenarioId: C && C.id, nome: C && C.nome, usoRobustez: !!(C && C.usoRobustez) }, r); }
  /** Todos os cenários de d.cenarios. */
  const cenarios = (d, base) => (d.cenarios || []).map(c => cenario(d, c, base));
  /** Junta opções: listas (deps, excl, forcar, proibir, extras, obrig) somam; o resto sobrescreve. */
  function combinar(a = {}, b = {}){ const o = Object.assign({}, a, b); ['deps','excl','forcar','proibir','extras'].forEach(k => { if(a[k] || b[k]) o[k] = [].concat(a[k] || [], b[k] || []); });
    if(a.obrig && b.obrig) o.obrig = uniq(a.obrig.concat(b.obrig)); if(b.pesos || b.extras || b.notas) delete o.rows; return o; }
  /** Robustez (I3.5): frequência de seleção nos cenários de robustez (C0–C6) e núcleo ≥ R32; o.incluir acrescenta (ex. ['C7']). */
  function robustez(d, o = {}){
    const ids = (o.cenarios || (d.cenarios || []).filter(c => c.usoRobustez).map(c => c.id)).concat(o.incluir || []), res = ids.map(id => cenario(d, id, o.base));
    const cand = candidatas(d).map(i => i.id), lim = param(d, 'R32').robustezNucleo, frequencia = {};
    cand.forEach(id => { const n = res.filter(r => r.ids.includes(id)).length; frequencia[id] = { n, total: res.length, pct: div(n, res.length) }; });
    return { cenarios: res.map(r => ({ id:r.cenarioId, ids:r.ids, valor:r.valor })), frequencia, nucleo: cand.filter(id => frequencia[id].pct >= lim - EPS), limiar:lim };
  }
  /** Dependências lógicas abertas entre candidatas ([[origem, dependeDe]]). */
  const depsLogicas = d => (d.dependencias || []).filter(x => x.tipo === 'LOGICA' && x.iniciativaDependenciaId && dependenciaAberta(d, x)).map(x => [x.iniciativaOrigemId, x.iniciativaDependenciaId]);
  /** Grupos de exclusividade (grupoExclusividade com ≥ 2 candidatas). */
  const gruposExclusividade = d => { const g = {}; candidatas(d).forEach(i => { if(i.grupoExclusividade) (g[i.grupoExclusividade] ||= []).push(i.id); }); return Object.values(g).filter(x => x.length > 1); };
  /** Políticas do Otimizador (N3), cada uma como opções de restrição. */
  function politicas(d){
    const deps = depsLogicas(d), tol = param(d, 'R28').toleranciaD, res = num(param(d, 'R27')), c5 = optsCenario(d, 'C5'), ex = gruposExclusividade(d), pc = v => arred(v * 100, 1);
    return [
      { id:'DEP', nome:`Dependência ${deps.map(x => x.join(' ⇒ ')).join(', ')}`, opts:{ deps } },
      { id:'MIX', nome:`Mix D ≤ ${pc(tol)} pp`, opts:{ maxD:tol } },
      { id:'RESERVA', nome:`Reserva de ${pc(res)}%`, opts:{ reserva:res } },
      { id:'RESERVA_MIX', nome:'Reserva + mix', opts:{ reserva:res, maxD:tol } },
      { id:'GCAP', nome:'Capacidade por gerência', opts:{ gcap:true } },
      { id:'DEP_GCAP', nome:'Dependência + capacidade por gerência', opts:{ deps, gcap:true } },
      { id:'P07', nome:'P07 prioritária (documentação, s168)', opts:{ forcar:['P07'] } },
      { id:'EXCL', nome:`Exclusividade ${ex.map(g => '{' + g.join(', ') + '}').join(' ')}`, opts:{ excl:ex } },
      { id:'P09', nome:'Nova obrigatória P09 (C5)', opts:{ extras:c5.extras || [], obrig:c5.obrig || [] } },
    ];
  }
  /** I3.2 custo de uma restrição: V*(sem) − V*(com) e % de V*(sem). */
  function custoRestricao(d, base = {}, extra = {}){ const a = otimizar(d, base), b = otimizar(d, combinar(base, extra)), c = a.valor != null && b.valor != null ? arred(a.valor - b.valor, 8) : null;
    return { vSem:a.valor, vCom:b.valor, custo:c, pct: div(c, a.valor), idsSem:a.ids, idsCom:b.ids, D:b.D, viavel:b.viavel }; }
  /** Custos de todas as políticas sobre a configuração base (o; ex. {cap:8} para a variante do desafio). */
  const custosPolitica = (d, base = {}) => politicas(d).map(p => Object.assign({ id:p.id, nome:p.nome, opts:p.opts }, custoRestricao(d, base, p.opts)));
  /** Fronteira V* × FTE (de 4 a 10,5 em passos de 0,5) e valor marginal por passo (I3.4). */
  function fronteira(d, o = {}){ const de = o.de ?? 4, ate = o.ate ?? 10.5, passo = o.passo ?? 0.5, pts = [];
    for(let k = 0; de + k * passo <= ate + EPS; k++){ const f = arred(de + k * passo, 4), r = otimizar(d, Object.assign({}, o.base || {}, { cap:f })); pts.push({ fte:f, valor:r.valor, ids:r.ids }); }
    return { pontos:pts, marginal: pts.slice(1).map((p, k) => ({ de:pts[k].fte, ate:p.fte, delta: p.valor != null && pts[k].valor != null ? arred(p.valor - pts[k].valor, 8) : null })) }; }
  /** Pareto por iniciativa: não dominadas em valor (N, maior) × recurso ('fte' | 'custo' | 'risco', menor). */
  function paretoIniciativas(d, recurso = 'fte', o = {}){ const rows = (o.rows || linhasCandidatas(d, o)).filter(r => !r.extra && r.N != null), g = r => recurso === 'risco' ? r.R : r[recurso];
    return rows.filter(a => !rows.some(b => b !== a && b.N >= a.N - EPS && g(b) <= g(a) + EPS && (b.N > a.N + EPS || g(b) < g(a) - EPS))).map(r => r.id).sort(); }
  /** I3.16 utilização por gerência de uma carteira, com a faixa R26 (o.reserva reduz cada capacidade). */
  function utilizacaoPorGerencia(d, ids, o = {}){ const rows = o.rows || linhasCandidatas(d, o), caps = capacidadePorGerencia(d), fat = 1 - (o.reserva || 0);
    return Object.keys(caps).map(g => { const f = soma(rows.filter(r => ids.includes(r.id) && r.gerenciaId === g), r => Math.round(r.fte * 100)) / 100, cap = arred(caps[g] * fat, 6), u = cap > 0 ? f / cap : (f > 0 ? Infinity : 0);
      return { gerenciaId:g, fte:f, cap, u: Number.isFinite(u) ? u : null, faixa: Number.isFinite(u) ? faixaCapacidade(d, u) : faixaCapacidade(d, 2) }; }); }
  /** Utilização por comunidade (informativa). */
  function utilizacaoPorComunidade(d, ids, o = {}){ const rows = o.rows || linhasCandidatas(d, o), caps = capacidadePorComunidade(d);
    return Object.keys(caps).map(k => { const f = soma(rows.filter(r => ids.includes(r.id) && r.comunidadeId === k), r => Math.round(r.fte * 100)) / 100; return { comunidadeId:k, fte:f, cap:caps[k], u: caps[k] > 0 ? f / caps[k] : null, semCapacidade: !(caps[k] > 0) && f > 0 }; }); }
  /** Capacidade com reserva (R27): total × (1 − reserva). */
  const capacidadeComReserva = (d, reserva) => arred(capacidadeTotal(d) * (1 - (reserva != null ? reserva : num(param(d, 'R27')))), 6);

  /* ================================================================ N3 · sensibilidade, Spearman, AHP */
  /** ρ de Spearman com postos médios (empates): correlação de Pearson entre os postos; a e b = {id: valor} (maior = melhor). */
  function spearman(a, b){ const ids = Object.keys(a).filter(k => k in b), n = ids.length; if(n < 2) return null;
    const postos = m => { const s = ids.slice().sort((x, y) => m[y] - m[x]), r = {}; let k = 0; while(k < n){ let j = k; while(j + 1 < n && Math.abs(m[s[j + 1]] - m[s[k]]) < EPS) j++; for(let t = k; t <= j; t++) r[s[t]] = (k + j) / 2 + 1; k = j + 1; } return r; };
    const ra = postos(a), rb = postos(b), mu = (n + 1) / 2, sxy = soma(ids, k => (ra[k] - mu) * (rb[k] - mu)), sxx = soma(ids, k => (ra[k] - mu) ** 2), syy = soma(ids, k => (rb[k] - mu) ** 2);
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null; }
  const mapaN = rows => { const o = {}; rows.forEach(r => o[r.id] = r.N); return o; };
  /** Sensibilidade: novo ranking, ρ, "ranking mudou" e "seleção mudou" com pesos ajustados (parcial = renormaliza). */
  function sensibilidade(d, ajuste, o = {}){
    const w = renormalizar(pesosEfetivos(d, o.pesos), ajuste), O = Object.assign({}, o, { pesos:w, rows:null }), b = ranking(d, o), nv = ranking(d, O), sb = otimizar(d, o), sn = otimizar(d, O);
    return { pesos:w, ranking:nv, rho: spearman(mapaN(b), mapaN(nv)), rankingMudou: b.map(r => r.id).join() !== nv.map(r => r.id).join(),
      selecaoBase:sb.ids, selecao:sn.ids, valor:sn.valor, selecaoMudou: !mesmos(sb.ids, sn.ids), empateTecnico: sn.empateTecnico, margem: sn.margem, segunda: sn.segunda };
  }
  /** I3.6 limiar de reversão: menor wₖ (renormalizando os demais) com S(a) > S(b). sentido 'ACIMA' = a passa b acima do limiar. */
  function limiarReversao(d, a, b, k = 'C4', o = {}){
    const w = pesosEfetivos(d, o.pesos), na = (o.notas && o.notas[a]) || notasVigentes(d, a), nb = (o.notas && o.notas[b]) || notasVigentes(d, b), dl = j => (na[j] || 0) - (nb[j] || 0);
    if(!na || !nb || !(1 - w[k] > EPS)) return { limiar:null, sentido:null, pesoAtual:w[k], jaPassa:false, motivo:'Sem notas vigentes ou peso já em 100%.' };
    const c = soma(Object.keys(w).filter(j => j !== k), j => w[j] * dl(j)) / (1 - w[k]), dk = dl(k), diff = t => t * dk + (1 - t) * c;
    if(Math.abs(dk - c) < EPS) return { limiar:null, sentido:null, pesoAtual:w[k], jaPassa: diff(w[k]) > EPS, motivo:'A diferença não depende deste peso.' };
    const t = c / (c - dk); return { limiar:t, sentido: dk - c > 0 ? 'ACIMA' : 'ABAIXO', valido: t > 0 && t < 1, pesoAtual:w[k], jaPassa: diff(w[k]) > EPS };
  }
  /** Varredura ±amplitude por peso (passo de 5 pp por padrão): onde a seleção ótima muda. */
  function varreduraPesos(d, o = {}){
    const amp = o.amplitude ?? 0.15, passo = o.passo ?? 0.05, w = pesosEfetivos(d, o.pesos), base = otimizar(d, { pesos:w }).ids, nS = Math.round(amp / passo), itens = [];
    Object.keys(w).forEach(k => { for(let s = -nS; s <= nS; s++){ if(!s) continue; const t = arred(w[k] + s * passo, 6); if(t < -EPS || t >= 1 - EPS) continue;
      const r = otimizar(d, { pesos: renormalizar(w, { [k]:Math.max(0, t) }) }); itens.push({ criterio:k, peso:Math.max(0, t), ids:r.ids, valor:r.valor, mudou: !mesmos(base, r.ids), entram: r.ids.filter(x => !base.includes(x)), saem: base.filter(x => !r.ids.includes(x)) }); } });
    return { base, itens, mudancas: itens.filter(x => x.mudou) };
  }
  /** AHP (aprofundamento): pesos pela média geométrica, λmax, CI = (λmax − n)/(n − 1), CR = CI/RI (RI 0,58/0,90/1,12). */
  function ahp(matriz){ const n = matriz.length, gm = matriz.map(r => Math.pow(r.reduce((p, x) => p * x, 1), 1 / n)), s = gm.reduce((a, b) => a + b, 0), w = gm.map(g => g / s);
    const lam = matriz.reduce((acc, r, i) => acc + r.reduce((t, x, j) => t + x * w[j], 0) / w[i], 0) / n, RI = { 3:0.58, 4:0.90, 5:1.12, 6:1.24, 7:1.32, 8:1.41, 9:1.45 }[n] || 0;
    const CI = n > 2 ? (lam - n) / (n - 1) : 0, CR = RI ? CI / RI : 0; return { pesos:w, lambdaMax:lam, CI, CR, RI, consistente: CR < 0.10 }; }
  /** Pesos AHP como objeto {C1…} a partir de um exemplo/matriz e da lista de critérios. */
  const pesosAhp = (matriz, criterios) => { const r = ahp(matriz), o = {}; criterios.forEach((c, i) => o[c] = r.pesos[i]); return o; };

  /* ================================================================ N3 · benefícios, pessoa-chave, horizontes, sourcing */
  /** Benefício: última medição, realização × meta e × trajetória (funciona para "menor é melhor"). */
  function beneficio(d, id){
    const b = byId(d.beneficios, id); if(!b) return null;
    const ms = (d.medicoesBeneficio || []).filter(m => m.beneficioId === id).slice().sort((x, y) => dia(x.data) < dia(y.data) ? -1 : 1), u = ms[ms.length - 1] || null;
    const rm = u ? razao(u.realizado - b.linhaBase, b.meta - b.linhaBase) : null, rt = u ? razao(u.realizado - b.linhaBase, u.planejado - b.linhaBase) : null;
    return { id, iniciativaId:b.iniciativaId, kpi:b.kpi, sentido:b.sentido, base:b.linhaBase, meta:b.meta, medicoes:ms, ultima:u, realizacaoMeta:rm, realizacaoTrajetoria:rt,
      situacao: rt == null ? 'SEM_MEDICAO' : rt > 1 + EPS ? 'ACIMA' : rt < 1 - EPS ? 'ABAIXO' : 'NA_TRAJETORIA' };
  }
  /** Todos os benefícios com índices. */
  const beneficiosResumo = d => (d.beneficios || []).map(b => beneficio(d, b.id));
  /** Trajetória planejada linear no mês m (de 0 a 12). */
  const trajetoriaPlanejada = (b, mes, meses = 12) => b.linhaBase + (b.meta - b.linhaBase) * mes / meses;
  /** Linha de base sugerida sem dupla contagem: última medição realizada do benefício de mesmo KPI (mesmoKpiDe). */
  function linhaBaseSugerida(d, id){ const b = byId(d.beneficios, id); if(!b || !b.mesmoKpiDe) return b ? b.linhaBase : null; const r = beneficio(d, b.mesmoKpiDe); return r && r.ultima ? r.ultima.realizado : b.linhaBase; }
  /** I3.15 pessoa-chave: % das iniciativas (candidatas ou ids) com K. */
  function pessoaChave(d, ids, o = {}){ const rows = (o.rows || linhasCandidatas(d, o)).filter(r => !r.extra && (!ids || ids.includes(r.id))), k = rows.filter(r => r.K).map(r => r.id);
    return { valor: div(k.length, rows.length), n:k.length, total:rows.length, ids:k }; }
  /** I3.17 mix por horizonte (custo da carteira inteira) e D_h contra R31. */
  function mixHorizonte(d, ids, o = {}){ const rows = (o.rows || linhasCandidatas(d, o)).filter(r => ids.includes(r.id)), t = soma(rows, r => r.custo), alvo = param(d, 'R31').horizontes, pct = {};
    uniq(Object.keys(alvo).concat(rows.map(r => r.horizonte || 'SEM'))).forEach(h => pct[h] = div(soma(rows.filter(r => (r.horizonte || 'SEM') === h), r => r.custo), t));
    return { pct, Dh: t > 0 ? Object.keys(pct).reduce((s, h) => s + Math.abs((pct[h] || 0) - (alvo[h] || 0)), 0) / 2 : null, alvo }; }
  /** I3.18 custo por classe de sourcing da ferramenta vinculada (SEM_FERRAMENTA quando não há vínculo). */
  function custoPorSourcing(d, ids, o = {}){ const rows = (o.rows || linhasCandidatas(d, o)).filter(r => ids.includes(r.id)), t = soma(rows, r => r.custo), pct = {}, porClasse = {};
    rows.forEach(r => { const k = r.classeSourcing || 'SEM_FERRAMENTA'; (porClasse[k] ||= []).push(r.id); }); Object.keys(porClasse).forEach(k => pct[k] = div(soma(rows.filter(r => porClasse[k].includes(r.id)), r => r.custo), t));
    return { pct, porClasse }; }

  /* ================================================================ fotografia (N2) */
  /** Estado em uma data: reverte o histórico posterior (alterações e inserções), remove registros append-only, riscos/dependências/benefícios registrados depois e iniciativas que entraram depois; ref = data. */
  function estadoEm(d, data){
    const x = clone(d), lim = dia(data), depois = v => !!v && dia(v) > lim;
    (x.historico || []).map((h, k) => ({ h, k })).filter(({ h }) => depois(h.alteradoEm))
      .sort((a, b) => dia(a.h.alteradoEm) < dia(b.h.alteradoEm) ? 1 : dia(a.h.alteradoEm) > dia(b.h.alteradoEm) ? -1 : b.k - a.k)
      .forEach(({ h }) => { const col = x[h.entidade]; if(!Array.isArray(col)) return;
        if(h.operacao === 'INSERCAO' || h.campoAlterado == null) x[h.entidade] = col.filter(e => e.id !== h.entidadeId);
        else { const e = col.find(e => e.id === h.entidadeId); if(e) e[h.campoAlterado] = h.valorAnterior; } });
    x.historico = (x.historico || []).filter(h => !depois(h.alteradoEm));
    x.decisoes = (x.decisoes || []).filter(r => !depois(r.decididoEm || r.registradoEm));
    ['avaliacoes','pendencias','riscosImpedimentos','dependencias','beneficios'].forEach(k => x[k] = (x[k] || []).filter(r => !depois(r.registradoEm)));
    x.medicoesBeneficio = (x.medicoesBeneficio || []).filter(r => !depois(r.data || r.registradoEm));
    x.snapshotsForum = (x.snapshotsForum || []).filter(r => !depois(r.geradoEm));
    x.iniciativas = (x.iniciativas || []).filter(i => !depois(i.dataEntrada || i.createdAt));
    x.dataReferencia = lim; return x;
  }
  /** Indicadores e sinais congelados numa fotografia (mesma função para SN-SET e para as fotografias da aprendiz). */
  function indicadoresFotografia(d){
    const A = emExecucao(d), s = sinais(d, A), p = pctOrcamentoVermelho(d), e = evmPortfolio(d, A);
    return { indicadoresJson:{ dataReferencia: ref(d), emExecucao:A.length, pctVermelhoContagem: arred(p.porContagem, 4), pctOrcamentoVermelho: arred(p.valor, 4),
        riscosAbertos: riscosAbertos(d).length, dependenciasAbertas: dependenciasAbertas(d).length, divergencias: s.filter(x => x.divergente).length, cpiPortfolio: arred(e.cpi, 4) },
      iniciativasJson: A.map((i, k) => ({ id:i.id, sinal:s[k].cor, ragDeclarado:i.ragDeclarado || null, desvioMeses:s[k].desvio, indice: arred(s[k].indice, 4),
        fisico: num(i.percentualFisicoReal), ac: arred(ac(d, i), 4), bac: arred(bac(d, i), 4), dataPrevistaAtual: i.dataPrevistaAtual || null })) };
  }
  /** Demandas aguardando triagem (sem recomendação vigente). */
  const decisoesPendentes = d => demandas(d).filter(i => !triagemVigente(d, i.id)).map(i => `${i.id} aguardando triagem (${idadeDemanda(d, i)} d)`);
  /** Conteúdo completo de uma fotografia (o hash vem de PF.hash sobre este objeto). */
  const conteudoFotografia = d => Object.assign(indicadoresFotografia(d), { decisoesPendentesJson: decisoesPendentes(d), filtrosJson:{ fase:'EM_EXECUCAO' } });
  /** Última fotografia FECHADA (opcionalmente de um fórum). */
  const ultimaFotografiaFechada = (d, forumId) => (d.snapshotsForum || []).filter(s => s.status === 'FECHADO' && (!forumId || s.forumId === forumId))
    .slice().sort((a, b) => dia(a.geradoEm) < dia(b.geradoEm) ? -1 : dia(a.geradoEm) > dia(b.geradoEm) ? 1 : (a.versao || 1) - (b.versao || 1)).pop() || null;
  /** I2.18 "o que mudou": diferença de indicadores e de sinais entre duas fotografias (antes × depois). */
  function diffFotografia(antes, depois){
    const ia = (antes && antes.indicadoresJson) || {}, ib = (depois && depois.indicadoresJson) || {};
    const indicadores = uniq(Object.keys(ia).concat(Object.keys(ib))).filter(k => k !== 'dataReferencia').map(k => ({ chave:k, antes: ia[k] ?? null, depois: ib[k] ?? null,
      delta: typeof ia[k] === 'number' && typeof ib[k] === 'number' ? arred(ib[k] - ia[k], 4) : null, mudou: ia[k] !== ib[k] }));
    const la = (antes && antes.iniciativasJson) || [], lb = (depois && depois.iniciativasJson) || [];
    const iniciativas = uniq(la.map(x => x.id).concat(lb.map(x => x.id))).map(id => { const a = la.find(x => x.id === id) || null, b = lb.find(x => x.id === id) || null;
      const sa = a && a.sinal, sb = b && b.sinal, campos = a && b ? Object.keys(b).filter(k => k !== 'id' && JSON.stringify(a[k]) !== JSON.stringify(b[k])) : [];
      return { id, antes:sa || null, depois:sb || null, mudou: sa !== sb, piorou: sa in COR && sb in COR && COR[sb] > COR[sa], melhorou: sa in COR && sb in COR && COR[sb] < COR[sa], campos }; });
    return { indicadores, iniciativas, pioraram: iniciativas.filter(x => x.piorou).map(x => x.id), melhoraram: iniciativas.filter(x => x.melhorou).map(x => x.id) };
  }

  /* ================================================================ apoio a perguntas e desafios */
  /** Cópia alterada de d para variantes de desafio: comAlteracao(PF.base, x => { … }). */
  const comAlteracao = (d, fn) => { const x = clone(d); fn(x); return x; };
  /** DC1-02: nota da pauta do fórum (vermelhas = 100; Cinza 50; Amarela 60; Verde ≤ 30; só uma vermelha 70; vazia 0). */
  function avaliarPauta(d, ids){
    const s = sinais(d), v = s.filter(x => x.cor === 'VERMELHO').map(x => x.id), cor = id => (s.find(x => x.id === id) || {}).cor;
    if(!ids || !ids.length) return { ok:false, nota:0, caso:'VAZIA' };
    if(mesmos(ids, v)) return { ok:true, nota:100, caso:'EXCECAO' };
    let nota = 100, caso = 'INCOMPLETA'; ids.forEach(id => { const c = cor(id); if(c === 'VERDE'){ nota = Math.min(nota, 30); caso = 'VERDE'; } else if(c === 'CINZA'){ nota = Math.min(nota, 50); if(caso !== 'VERDE') caso = 'CINZA'; } else if(c === 'AMARELO'){ nota = Math.min(nota, 60); if(caso === 'INCOMPLETA') caso = 'AMARELO'; } });
    if(caso === 'INCOMPLETA') nota = 70; return { ok:false, nota, caso };
  }
  /** Desafio N2 passo 1: notas às cegas (±tol) e S (±tolS) contra a avaliação vigente. */
  function conferirCegas(d, cegas, o = {}){ const tol = o.tol ?? 1, tolS = o.tolS ?? 0.3, w = pesosEfetivos(d); let ok = 0, total = 0; const sOk = {};
    Object.keys(cegas || {}).forEach(id => { const ref_ = notasVigentes(d, id), c = cegas[id] || {}; if(!ref_) return; Object.keys(w).forEach(k => { total++; if(num(c[k]) != null && Math.abs(c[k] - ref_[k]) <= tol) ok++; });
      sOk[id] = Object.keys(w).every(k => num(c[k]) != null) && Math.abs(score(c, w) - score(ref_, w)) <= tolS + EPS; });
    return { notasOk:ok, totalNotas:total, sOk, ok: ok >= Math.ceil(total * 13 / 15) && Object.values(sOk).every(Boolean) }; }
  /** Desafio N2 passo 2: classificação nos quadrantes ('VE' ou 'VR') contra a referência. */
  function conferirQuadrantes(d, classif, tipo = 'VE'){ const rows = linhasCandidatas(d), k = tipo === 'VR' ? 'qVR' : 'qVE', certos = rows.filter(r => (classif || {})[r.id] === r[k]).map(r => r.id);
    return { corretos:certos.length, total:rows.length, ok: certos.length >= rows.length - 1, certos }; }
  /** Gabarito-modelo da recomendação do ciclo (DC3-06), derivado de robustez, dependências, risco e capacidade local. */
  function gabaritoCiclo(d){
    const rob = robustez(d), rows = linhasCandidatas(d), c0 = otimizar(d, { rows }), sobre = utilizacaoPorGerencia(d, c0.ids, { rows }).filter(g => g.u == null || g.u > 1 + EPS).map(g => g.gerenciaId);
    const nc = (d.dependencias || []).filter(x => x.tipo === 'LOGICA' && !x.confirmada && dependenciaAberta(d, x)), alvos = nc.map(x => x.iniciativaDependenciaId), origens = nc.map(x => x.iniciativaOrigemId), L = limiares(d), g = {};
    rows.filter(r => !r.extra).forEach(r => {
      if(rob.nucleo.includes(r.id)) g[r.id] = { classe:'NUCLEO', aceitas: !r.obrigatoria && sobre.includes(r.gerenciaId) ? { CONDICIONAL:0.5 } : {}, nota: sobre.includes(r.gerenciaId) && !r.obrigatoria ? `condicionante de capacidade da ${r.gerenciaId}` : null };
      else if(alvos.includes(r.id)) g[r.id] = { classe:'HABILITADORA', aceitas:{}, nota:'só se a dependência for confirmada' };
      else if(r.R >= L.riscoCritico && !r.acao) g[r.id] = { classe:'RECYCLE', aceitas:{ HABILITADORA:0.5 }, nota:'fase 1 menor com mitigação' };
      else g[r.id] = { classe:'CONDICIONAL', aceitas: origens.includes(r.id) ? {} : { HABILITADORA:0.5 }, nota: origens.includes(r.id) ? 'confirmar a dependência' : null };
    });
    return g;
  }
  /** DC3-06: 1 ponto por classe exata, 0,5 por alternativa aceita; ok com ≥ 6 de 8. */
  function avaliarRecomendacaoCiclo(d, classes){ const g = gabaritoCiclo(d), por = Object.keys(g).map(id => { const e = (classes || {})[id] || null, x = g[id];
      return { id, escolhida:e, gabarito:x.classe, pontos: e === x.classe ? 1 : (x.aceitas[e] || 0) }; });
    const nota = soma(por, x => x.pontos); return { nota, max: por.length, ok: nota >= 6 - EPS, porIniciativa: por }; }

  /* ================================================================ painel de indicadores */
  /** Todos os indicadores I1.x, I2.x e I3.x (exceto os fora da v1: I3.9–I3.11 e I3.14) num objeto { 'I1.4': {valor, …} }. */
  function indicadores(d){
    const A = emExecucao(d), sn = sinais(d, A), rows = linhasCandidatas(d), O = { rows }, rk = ranking(d, O), M = metodos(d, O), ot = M.otimo;
    const mapa = f => { const o = {}; rows.forEach(r => o[r.id] = f(r)); return o; }, ids = { corte:M.corte.ids, guloso:M.guloso.ids, otimo:ot.ids };
    const ultima = ultimaFotografiaFechada(d), cen = cenarios(d), cv = {}; cen.forEach(c => cv[c.cenarioId] = { valor:c.valor, ids:c.ids, fte:c.fte, custo:c.custo, D:c.D });
    const ahpEx = {}; (d.ahpExemplos || []).forEach(x => ahpEx[x.id] = ahp(x.matriz).CR);
    const eq = (d.ahpExemplos || []).find(x => x.id === 'EQUIPE'), rob = robustez(d), rob7 = robustez(d, { incluir:['C7'] }), fr = fronteira(d);
    const ev = {}; A.forEach(i => ev[i.id] = evm(d, i)); const ep = evmPortfolio(d, A), ed = {}; A.forEach(i => { const e = ev[i.id]; if(e.eacMenosPrevisao != null) ed[i.id] = { eac:e.eac, previsao:e.previsao, delta:e.eacMenosPrevisao, pct:e.eacPctPrevisao }; });
    const ug = utilizacaoPorGerencia(d, ot.ids, O), ugo = {}; ug.forEach(g => ugo[g.gerenciaId] = g.u);
    const lim = {}; ['P06','P03'].filter(x => rows.some(r => r.id === x)).forEach(x => lim[x] = limiarReversao(d, 'P05', x, 'C4').limiar);
    return {
      'I1.1': { valor:A.length, ids:A.map(i => i.id) },
      'I1.2': mixCategoria(d, A),
      'I1.3': Object.assign({ valor: distribuicaoSinal(d).pct }, distribuicaoSinal(d)),
      'I1.4': pctOrcamentoVermelho(d),
      'I1.5': execucaoOrcamentaria(d),
      'I1.6': { valor: indices(d) },
      'I1.7': Object.assign({ valor: desvios(d).mediana }, desvios(d)),
      'I1.8': { valor: pctNoPrazo(d), tol0: pctNoPrazo(d, 0), tol1: pctNoPrazo(d, 1), tolerancia: param(d, 'R15') },
      'I1.9': pctVinculadas(d),
      'I1.10': Object.assign({ valor: completude(d).pct }, completude(d)),
      'I1.11': Object.assign({ valor: idadeDemandas(d).mediana, nAcima: idadeDemandas(d).acima.length }, idadeDemandas(d)),
      'I1.12': divergenciaSinal(d),
      'I1.13': concentracaoTop(d, 2),
      'I1.14': Object.assign({ valor: horizontes(d).contagem }, horizontes(d), { todasAtivas: horizontes(d, { todasAtivas:true }).contagem }),
      'I1.15': (() => { const r = riscosAbertos(d); return { valor:r.length, vencidos: r.filter(x => x.vencido).length, ids: r.map(x => x.id), idsVencidos: r.filter(x => x.vencido).map(x => x.id), iniciativas: uniq(r.map(x => x.iniciativaId)).length }; })(),
      'I1.16': (() => { const x = dependenciasAbertas(d); return { valor:x.length, ids:x.map(y => y.id), bloqueios: bloqueios(d), bloqueiosPorVermelha: bloqueios(d).filter(b => b.porVermelha) }; })(),
      'I2.1': { valor: mapa(r => r.S) }, 'I2.2': { valor: mapa(r => r.N) }, 'I2.3': { valor: mapa(r => r.nFte) }, 'I2.4': { valor: mapa(r => r.nCusto) },
      'I2.5': (() => { const u = utilizacaoDemanda(d, O); return Object.assign({ valor:u.pctFte }, u); })(),
      'I2.6': (() => { const x = discricionaria(d, O); return Object.assign({ valor:x.fte }, x); })(),
      'I2.7': { valor:{ corte:M.corte.ociosidade, guloso:M.guloso.ociosidade, otimo:ot.ociosidade } },
      'I2.8': { valor:{ corte:M.corte.valor, guloso:M.guloso.valor, otimo:ot.valor }, ids },
      'I2.9': { valor:{ corte:M.corte.eficiencia, guloso:M.guloso.eficiencia, otimo:1 } },
      'I2.10': { valor: mapa(r => r.R) },
      'I2.11': { valor: exposicao(rows, rows.map(r => r.id)), otimo: ot.exposicao },
      'I2.12': { valor: pctCustoCritico(d, rows, rows.map(r => r.id)), otimo: ot.pctCritico },
      'I2.13': { valor:ot.D, otimo:ot.D, corte:M.corte.D, guloso:M.guloso.D, mixOtimo:ot.mix },
      'I2.14': { valor:{ corte:M.corte.faixa, guloso:M.guloso.faixa, otimo:ot.faixa }, u:{ corte:M.corte.u, guloso:M.guloso.u, otimo:ot.u } },
      'I2.15': { valor:ev },
      'I2.16': { valor:ep.cpi, cpi:ep.cpi, spi:ep.spi, ev:ep.ev, ac:ep.ac, pv:ep.pv, evSpi:ep.evSpi, foraSpi:ep.foraSpi },
      'I2.17': { valor:ed },
      'I2.18': ultima ? Object.assign({ valor:null, fotografia:ultima.id }, diffFotografia(ultima, conteudoFotografia(d))) : { valor:null, motivo:'Sem fotografia FECHADA.' },
      'I2.19': Object.assign({ valor:decisoesPorTipo(d).contagem }, decisoesPorTipo(d)),
      'I2.20': { valor:A.length },
      'I3.1': { valor:cv },
      'I3.2': { valor: custosPolitica(d, {}).map(p => ({ id:p.id, nome:p.nome, vCom:p.vCom, custo:p.custo, pct:p.pct, ids:p.idsCom })) },
      'I3.3': { valor:{ corte:M.corte.eficiencia, guloso:M.guloso.eficiencia } },
      'I3.4': { valor: fr.marginal, pontos: fr.pontos },
      'I3.5': { valor: rob.frequencia, nucleo: rob.nucleo, comC7: rob7.frequencia },
      'I3.6': { valor: lim },
      'I3.7': (() => { const r = sensibilidade(d, { C4:0.30 }).rho; return { valor:r, w4_30:r, ahp: eq ? sensibilidade(d, pesosAhp(eq.matriz, eq.criterios)).rho : null }; })(),
      'I3.8': { valor: ahpEx, aprofundamento:true },
      'I3.12': { valor: Object.fromEntries(beneficiosResumo(d).filter(b => b.ultima).map(b => [b.id, b.realizacaoMeta])) },
      'I3.13': { valor: Object.fromEntries(beneficiosResumo(d).filter(b => b.ultima).map(b => [b.id, b.realizacaoTrajetoria])) },
      'I3.15': (() => { const a = pessoaChave(d, null, O), b = pessoaChave(d, ot.ids, O); return { valor:a.valor, candidatas:a, carteira:b }; })(),
      'I3.16': { valor: ugo, itens: ug },
      'I3.17': (() => { const m = mixHorizonte(d, ot.ids, O); return { valor:m.Dh, pct:m.pct, alvo:m.alvo }; })(),
      'I3.18': (() => { const s = custoPorSourcing(d, ot.ids, O); return { valor:s.pct, porClasse:s.porClasse }; })(),
    };
  }

  PF.calc = {
    versao:1, EPS, TRIAGEM, GATE,
    /* utilitários */ num, div, razao, arred, soma, media, mediana, clone, vazio, dias, mesIdx, comAlteracao,
    /* regras e entidades */ regra, param, ref, ini, terminal, ativas, emExecucao, demandas,
    /* financeiro */ linhaValida, bac, ac, previsao, semFonte,
    /* N1 */ fisico, indice, previsaoEfetiva, desvioMeses, sinal, sinais, divergencia, horizonte, horizontes, camposObrigatorios, camposVazios, completude,
    idadeDemanda, idadeDemandas, riscoAberto, riscoVencido, riscosAbertos, dependenciaAberta, dependenciasAbertas, bloqueios,
    mixCategoria, distribuicaoSinal, pctOrcamentoVermelho, execucaoOrcamentaria, indices, desvios, pctNoPrazo, pctVinculadas, divergenciaSinal, concentracaoTop,
    checklistTriagem, triagemSugerida, avaliarTriagem, decisoesVigentes, decisaoVigente, triagemVigente, decisoesPorTipo, avaliarPauta,
    /* N2 */ evm, evmPortfolio, renormalizar, pesosEfetivos, score, normalizar, avaliacaoVigente, notasVigentes, fte, custo, unidadesIncompativeis, riscoDe, candidatas,
    quadranteVE, quadranteVR, linhasCandidatas, ranking, capacidadePorGerencia, capacidadePorComunidade, capacidadeTotal, orcamentoCiclo, faixaCapacidade,
    utilizacaoDemanda, discricionaria, indiceD, exposicao, pctCustoCritico, resumoCarteira, linhaDeCorte, guloso, otimizar, metodos, porQueFora, avaliarSelecao,
    conferirCegas, conferirQuadrantes, estadoEm, indicadoresFotografia, conteudoFotografia, decisoesPendentes, ultimaFotografiaFechada, diffFotografia,
    /* N3 */ optsCenario, cenario, cenarios, combinar, robustez, depsLogicas, gruposExclusividade, politicas, custoRestricao, custosPolitica, fronteira, paretoIniciativas,
    utilizacaoPorGerencia, utilizacaoPorComunidade, capacidadeComReserva, spearman, sensibilidade, limiarReversao, varreduraPesos, ahp, pesosAhp,
    beneficio, beneficiosResumo, trajetoriaPlanejada, linhaBaseSugerida, pessoaChave, mixHorizonte, custoPorSourcing, gabaritoCiclo, avaliarRecomendacaoCiclo,
    /* painel */ indicadores,
  };
})();
