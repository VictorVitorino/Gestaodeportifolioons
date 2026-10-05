(function(){
  'use strict';
  const GP=window.GP,M=GP.modelo,P=GP.projetos,U=GP.ui,{esc,fmt,sum,hoje,clone}=GP.util,icon=GP.icon;
  const plural=GP.util.plural||((n,s,p)=>fmt.n(n)+' '+(Math.abs(+n)===1?s:p));
  /* Séries categóricas: oliva e ouro originais; petróleo, ardósia e cobre em passos validados para daltonismo (ΔE ≥ 13). */
  const PALETTE=['#6b8f2a','#3a74a8','#d5a32d','#00908f','#b8642c','#859c98','#a06137','#899b67'];
  const TOM_ETAPA={andamento:'#6b8f2a',concluido:'#00908f',fora:'#a3b2ac'},UNICA='#6b8f2a',COBRE='#b8642c',TXT='#17302b',TXT2='#566b64';
  GP.charts.PAL.splice(0,GP.charts.PAL.length,...PALETTE);
  const NATUREZAS={projeto:'Projeto',demanda:'Demanda'};
  const CARTEIRA=['aprovado','execucao','espera','concluido'];
  const ABERTOS=['aprovado','execucao','espera'];
  const FILA=['entrada','triagem'];
  const DEF={gerencia:'',natureza:'',etapa:'',tipo:'',origem:'',fonte:'todos',de:'',ate:'',q:'',periodo:''};
  const filtros=()=>GP.state().ui.filtroIndicadores=Object.assign({},DEF,GP.state().ui.filtroIndicadores||{});
  const natureza=p=>p.natureza==='demanda'?'demanda':'projeto';
  const progresso=p=>p.etapa==='concluido'?100:p.progresso==null?null:+p.progresso;
  const divisao=(n,d)=>d?n/d:null;
  /** Título sem o sufixo técnico " (exemplo)": a marcação de exemplo aparece como selo. */
  const semExemplo=t=>String(t||'').replace(/\s*\(exemplo\)\s*$/i,'');
  const dataEntrada=p=>p.dataEntrada||String(p.criadoEm||'').slice(0,10);
  const addDias=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const diasEntre=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);

  /* ------------------------------------------------ ícones por conceito (complementam GP.icon) */
  const EXTRA={
    moeda:'<circle cx="12" cy="12" r="9"/><path d="M15 9.4c-.5-.9-1.6-1.4-3-1.4-1.7 0-3 .9-3 2.1 0 2.9 6 1.4 6 4.3 0 1.2-1.3 2.1-3 2.1-1.4 0-2.6-.6-3.1-1.5M12 6.4V8M12 16v1.6"/>',
    pessoas:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.2c2.3.2 4 1.9 4.6 4.8"/>',
    pessoa:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-6 7-6s6.2 2.4 7 6"/>',
    organograma:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2.5h12V16"/>',
    etiqueta:'<path d="M3 12.5V4h8.5L21 13.5 13.5 21z"/><circle cx="7.6" cy="8.3" r="1.3"/>',
    escudo:'<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    cadeado:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    calendario:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    servidor:'<rect x="4" y="4" width="16" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.5"/><path d="M8 7.25h.01M8 16.75h.01"/>',
    elo:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    pulso:'<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
    medidor:'<path d="M4 16a8 8 0 0116 0"/><path d="M12 16l4.2-4.6"/><path d="M4 20h16"/>',
    mais:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    baixo:'<path d="M6 9l6 6 6-6"/>',
    alvo:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6"/>',
  };
  const ico=(n,s=18)=>EXTRA[n]?`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[n]}</svg>`:icon(n,s);
  GP.iconeGerencial=ico;

  function filtrar(lista,f={}){
    const q=GP.util.normTxt(f.q||'').trim();
    return lista.filter(p=>(!f.gerencia||p.gerencia===f.gerencia)&&(!f.natureza||natureza(p)===f.natureza)&&(!f.etapa||p.etapa===f.etapa)
      &&(!f.tipo||p.tipo===f.tipo)&&(!f.origem||p.origem===f.origem)&&(f.fonte!=='reais'||!p.exemplo)&&(f.fonte!=='exemplos'||p.exemplo)
      &&(!f.de||(p.dataEntrada&&p.dataEntrada>=f.de))&&(!f.ate||(p.dataEntrada&&p.dataEntrada<=f.ate))
      &&(!q||GP.util.normTxt([p.codigo,p.titulo,p.area,p.ferramenta,p.responsavel,p.demandante,p.beneficio].join(' ')).includes(q)));
  }
  const mesIndex=s=>+s.slice(0,4)*12+(+s.slice(5,7)-1);
  const mesISO=i=>`${Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;
  const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  function serieEntrada(lista,f={}){
    const ds=lista.map(p=>p.dataEntrada).filter(Boolean).sort(),fim=f.ate||ds.at(-1)||hoje(),ini=f.de||ds[0]||mesISO(mesIndex(fim)-11)+'-01';
    let a=mesIndex(ini),b=mesIndex(fim); if(b<a) b=a;
    const passo=b-a+1<=18?1:b-a+1<=60?3:12;
    a=Math.floor(a/passo)*passo; b=Math.floor(b/passo)*passo;
    const pontos=[];
    for(let i=a;i<=b;i+=passo){
      const ano=Math.floor(i/12),mes=i%12,ds=lista.filter(p=>p.dataEntrada&&mesIndex(p.dataEntrada)>=i&&mesIndex(p.dataEntrada)<i+passo);
      pontos.push({key:mesISO(i),label:passo===1?MESES[mes]+'/'+String(ano).slice(-2):passo===3?Math.floor(mes/3)+1+'T/'+String(ano).slice(-2):String(ano),
        projetos:ds.filter(p=>natureza(p)==='projeto').length,demandas:ds.filter(p=>natureza(p)==='demanda').length,total:ds.length});
      if(pontos.length>101) break;
    }
    return {pontos,passo,ini:mesISO(a),fim:mesISO(b),semData:lista.filter(p=>!p.dataEntrada).length};
  }

  /* ------------------------------------------------ tendência de 30 dias (entradas e saídas da fila pelo histórico) */
  const NOMES_FILA=new Set(FILA.map(id=>M.etapa(id).nome));
  function saidaDaFila(p){
    for(const h of p.historico||[]){
      if(h.acao!=='Etapa')continue;
      const [de,para]=String(h.detalhe||'').split('. Motivo')[0].split(' → ').map(s=>(s||'').trim());
      if(NOMES_FILA.has(de)&&para&&!NOMES_FILA.has(para))return String(h.data||'').slice(0,10);
    }
    return '';
  }
  function naFilaEm(p,dia){
    const e=dataEntrada(p);if(!e||e>dia)return false;
    if(FILA.includes(p.etapa))return true;
    const s=saidaDaFila(p);return !!s&&s>dia;
  }
  function tendencia(lista){
    const t=hoje(),d30=addDias(t,-30),d60=addDias(t,-60),e=dataEntrada;
    const novos=lista.filter(p=>e(p)>d30&&e(p)<=t).length,antes=lista.filter(p=>e(p)>d60&&e(p)<=d30).length;
    const filaAgora=lista.filter(p=>FILA.includes(p.etapa)).length,filaAntes=lista.filter(p=>naFilaEm(p,d30)).length;
    return {novos,antes,fila:filaAgora-filaAntes};
  }
  const sinal=n=>n>0?'+'+fmt.n(n):n<0?'−'+fmt.n(Math.abs(n)):'0';

  function medir(lista,f={}){
    const n=lista.length,cont=fn=>lista.filter(fn).length,exec=lista.filter(p=>p.etapa==='execucao'),ativos=lista.filter(p=>ABERTOS.includes(p.etapa)),carteira=lista.filter(p=>CARTEIRA.includes(p.etapa));
    const entrada=lista.filter(p=>p.entrada&&['entra','falta_info','nao_entra'].includes(p.entrada.resultado)),entram=entrada.filter(p=>p.entrada.resultado==='entra').length;
    const av=exec.filter(p=>progresso(p)!=null),custo=lista.filter(p=>p.custo!=null),ftes=exec.filter(p=>p.esforcoFte!=null);
    const priorizaveis=lista.filter(p=>M.ETAPAS_PRIORIZAVEIS.includes(p.etapa));
    const atrasados=ativos.filter(p=>p.fimPrevisto&&p.fimPrevisto<hoje());
    const avaliados=lista.filter(p=>M.pontuar(p).completo),priorizados=priorizaveis.filter(p=>M.pontuar(p).completo);
    const capacidade=M.montarCarteira(lista,GP.state().capacidade,GP.state().forcar);
    const porValor=a=>a.slice().sort((x,y)=>y.value-x.value||String(x.label).localeCompare(String(y.label),'pt-BR'));
    return {lista,n,projetos:cont(p=>natureza(p)==='projeto'),demandas:cont(p=>natureza(p)==='demanda'),exemplos:cont(p=>p.exemplo),execucao:exec.length,ativos:ativos.length,
      fila:cont(p=>FILA.includes(p.etapa)),novas:cont(p=>p.etapa==='entrada'),triagem:cont(p=>p.etapa==='triagem'),concluidos:cont(p=>p.etapa==='concluido'),cancelados:cont(p=>p.etapa==='cancelado'),recusados:cont(p=>p.etapa==='nao_entra'),
      aprovados:cont(p=>p.etapa==='aprovado'),espera:cont(p=>p.etapa==='espera'),carteira:carteira.length,entram,entradaAvaliada:entrada.length,taxaEntrada:divisao(entram,entrada.length),
      taxaConclusao:divisao(cont(p=>p.etapa==='concluido'),carteira.length),custo:sum(custo,p=>p.custo),comCusto:custo.length,fteExecucao:sum(ftes,p=>p.esforcoFte),comFteExecucao:ftes.length,
      progresso:av.length?sum(av,progresso)/av.length:null,comProgresso:av.length,atrasados,avaliados:avaliados.length,priorizados:priorizados.length,priorizaveis:priorizaveis.length,
      semDatas:ativos.filter(p=>!(p.inicioPrevisto&&p.fimPrevisto)),
      etapas:M.ETAPAS.map(e=>({key:e.id,label:e.nome,value:cont(p=>p.etapa===e.id),projetos:cont(p=>p.etapa===e.id&&natureza(p)==='projeto'),demandas:cont(p=>p.etapa===e.id&&natureza(p)==='demanda'),color:TOM_ETAPA[e.grupo]||UNICA})),
      gerencias:porValor([...M.CAT.gerencias.map(g=>({key:g.id,label:g.id,nome:g.nome,value:cont(p=>p.gerencia===g.id),color:UNICA})),...(cont(p=>!p.gerencia)?[{key:'',label:'Não informada',value:cont(p=>!p.gerencia),color:'#859c98'}]:[])]),
      tipos:porValor([...new Set([...M.CAT.tipos,...lista.map(p=>p.tipo||'Não informado')])].map(t=>({key:t,label:t,value:cont(p=>(p.tipo||'Não informado')===t),color:UNICA}))),
      origens:porValor([...new Set([...M.CAT.origens,...lista.map(p=>p.origem||'Não informada')])].map(t=>({key:t,label:t,value:cont(p=>(p.origem||'Não informada')===t),color:UNICA}))),
      serie:serieEntrada(lista,f),capacidade,tendencia:tendencia(lista),qualidade:[
        {label:'Responsável definido',num:ativos.filter(p=>p.responsavel).length,den:ativos.length,desc:'Aprovados, em execução e em espera'},
        {label:'Datas previstas completas',num:ativos.filter(p=>p.inicioPrevisto&&p.fimPrevisto).length,den:ativos.length,desc:'Aprovados, em execução e em espera'},
        {label:'Benefício esperado descrito',num:cont(p=>p.beneficio&&p.beneficio.trim()),den:n,desc:'Todos os registros do recorte'},
        {label:'Custo estimado informado',num:custo.length,den:n,desc:'Todos os registros do recorte'},
        {label:'FTE estimado informado',num:cont(p=>p.esforcoFte!=null),den:n,desc:'Todos os registros do recorte'},
        {label:'Priorização completa',num:priorizados.length,den:priorizaveis.length,desc:'Etapas elegíveis para priorização'},
        {label:'Checklist registrado',num:entrada.length,den:n,desc:'Todos os registros do recorte'},
        {label:'Avanço físico informado',num:av.length,den:exec.length,desc:'Somente os registros em execução'}
      ]};
  }
  GP.analytics={filtrar,medir,filtros,natureza,progresso,serieEntrada,tendencia};

  /* ------------------------------------------------ componentes visuais */
  /** Medidor radial: trilho no mesmo tom (16%), preenchimento com ponta arredondada. ratio null = sem dado. */
  function ring(ratio,tone='var(--c1)',size=46,centro=''){
    const sw=size>=80?10:5,r=(size-sw)/2-1,c=size/2,L=2*Math.PI*r,f=ratio==null?0:Math.max(0,Math.min(1,ratio));
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${tone}" stroke-opacity=".16" stroke-width="${sw}" style="stroke:${tone}"/>${f>0?`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${tone}" style="stroke:${tone}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${Math.max(.01,f*L)} ${L}" transform="rotate(-90 ${c} ${c})"/>`:''}${centro?`<text x="${c}" y="${c+size*.07}" text-anchor="middle" font-size="${size*.2}" font-weight="700" fill="${TXT}">${esc(centro)}</text>`:''}</svg>`;
  }
  /** Cartão de indicador: usa GP.ui.metric (pacote base) quando existe, com o mesmo markup no fallback.
      icone aceita os ícones extras; deltaTom 'ruim' (cobre, com seta) ou 'bom' (oliva). */
  function metric(o){
    const {label,valor,sub='',icone='painel',tom=UNICA,tint='#f1f6ea',ratio=null,delta='',deltaTom=''}=o;
    let h=GP.ui.metric?GP.ui.metric({label,valor,sub,icone:'painel',tom,tint,ratio,delta}):
      `<div class="metric" style="--tone:${tom};--tint:${tint}"><div class="metric-head"><span>${esc(label)}</span><i class="metric-icon">${ico(icone,15)}</i></div><div class="metric-body"><strong class="metric-value">${valor??'-'}</strong>${ratio!=null?ring(ratio,tom,46):''}</div>${delta?`<span class="metric-delta">${esc(delta)}</span>`:''}<div class="metric-sub">${sub}</div></div>`;
    h=h.replace(/(<i class="metric-icon"[^>]*>)[\s\S]*?(<\/i>)/,`$1${ico(icone,15)}$2`);
    if(delta)h=h.replace(/class="metric-delta"/,`class="metric-delta gx-delta ${deltaTom?'gx-delta-'+deltaTom:''}"`);
    return h;
  }
  const deltaChip=(n,{ruimSeSobe=true,sufixo='em 30 dias'}={})=>{
    const tom=n===0?'':((n>0)===ruimSeSobe?'ruim':'bom'),seta=n>0?'↑ ':n<0?'↓ ':'';
    return {texto:`${tom==='ruim'?seta:''}${sinal(n)} ${sufixo}`,tom};
  };
  const chartHead=(title,sub='',ic='ranking')=>`<div class="chart-head"><div><h3>${esc(title)}</h3>${sub?`<p>${esc(sub)}</p>`:''}</div><span class="chart-mark">${ico(ic,17)}</span></div>`;
  const sample=m=>m.exemplos?`<div class="sample-banner"><span><b>Dados de demonstração:</b> ${m.exemplos===m.n?`os ${fmt.n(m.n)} registros`:`${m.exemplos} de ${m.n} registros`} são fictícios e entram nos indicadores.</span><button class="link" data-so-reais>Mostrar apenas reais</button></div>`:'';
  /** Tabela de apoio de cada gráfico (GP.charts.dados do pacote base, com fallback local). */
  function dados(titulo,colunas,linhas){
    if(GP.charts.dados)return GP.charts.dados(titulo,colunas,linhas);
    const cols=colunas.map(c=>typeof c==='string'?{label:c}:c);
    return `<details class="chart-data gx-dados" data-noprint><summary>Ver dados em tabela</summary><div class="gx-dados-wrap"><table class="gx-mini"><caption class="sr-only">${esc(titulo)}</caption><thead><tr>${cols.map(c=>`<th scope="col" class="${c.align||''}">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${linhas.map(l=>`<tr>${l.map((v,i)=>`<td class="${(cols[i]&&cols[i].align)||''}">${esc(typeof v==='number'?fmt.n(v,v%1?1:0):v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  }
  /** Barras horizontais. ordem 'valor' (dimensões nominais) ou 'fixa' (processo). modoPct: itens {label,num,den} → '89%' e '8 de 9'.
      Rótulo em coluna única (subgrid) com teto de 180px e reticências; linhas zeradas esmaecidas. */
  function hbars(items,total,{key,monetario=false,modoPct=false,ordem='valor'}={}){
    let its=items.map(it=>modoPct?{...it,value:it.den?it.num/it.den*100:0}:it);
    if(ordem==='valor')its=its.slice().sort((a,b)=>b.value-a.value);
    const max=modoPct?100:Math.max(1e-9,...its.map(i=>i.value));
    return `<div class="percent-bars gx-bars">${its.map(it=>{
      const vazio=modoPct?!it.den:!it.value;
      const count=modoPct?(it.den?fmt.pct(it.num/it.den):'-'):monetario?fmt.mi(it.value):fmt.n(it.value);
      const small=modoPct?(it.den?`${fmt.n(it.num)} de ${fmt.n(it.den)}`:'sem base'):fmt.pct(divisao(it.value,total));
      const attr=key&&it.key!=null?`data-analytics-filter="${key}" data-value="${esc(it.key)}" aria-label="Filtrar por ${esc(it.label)}: ${esc(count)}"`:'';
      const tt=`${esc(it.label)}&#10;${esc(count)} · ${esc(small)}${it.desc?'&#10;'+esc(it.desc):''}`;
      return `<${attr?'button':'div'} class="percent-row ${vazio?'is-zero':''}" ${attr} data-tt="${tt}"><span class="name">${esc(it.label)}</span><span class="track"><i style="width:${Math.max(0,Math.min(100,it.value/max*100))}%;--bar:${it.color||UNICA}"></i></span><span class="count">${count}<small>${small}</small></span></${attr?'button':'div'}>`;}).join('')}</div>`;
  }
  /** Barras empilhadas por etapa: Projetos (c1) e Demandas (c2), 2px de respiro, ponta só no fim. */
  function empilhadas(etapas){
    const max=Math.max(1,...etapas.map(e=>e.value));
    return `<div class="percent-bars gx-bars gx-stack">${etapas.map(e=>{
      const wp=e.projetos/max*100,wd=e.demandas/max*100;
      return `<div class="percent-row ${e.value?'':'is-zero'}" data-tt="${esc(e.label)}&#10;Projetos: ${e.projetos}&#10;Demandas: ${e.demandas}"><span class="name">${esc(e.label)}</span><span class="track gx-stack-track">${e.projetos?`<i class="gx-seg ${e.demandas?'':'fim'}" style="width:${wp}%;--bar:${PALETTE[0]}"></i>`:''}${e.demandas?`<i class="gx-seg fim" style="width:${wd}%;--bar:${PALETTE[1]}"></i>`:''}</span><span class="count">${fmt.n(e.value)}<small>${e.value?`${e.projetos} / ${e.demandas}`:'-'}</small></span></div>`;}).join('')}</div>
      <div class="legend gx-legend"><span><i style="background:${PALETTE[0]}"></i>Projetos</span><span><i style="background:${PALETTE[1]}"></i>Demandas</span></div>`;
  }
  /** Cruzamento etapa × gerência: mapa de calor de matiz único (oliva), valor escrito em cada célula. */
  function cruzamento(m){
    const gers=[...M.CAT.gerencias.map(g=>g.id),...(m.lista.some(p=>!p.gerencia)?['']:[])];
    const max=Math.max(1,...M.ETAPAS.flatMap(e=>gers.map(g=>m.lista.filter(p=>p.etapa===e.id&&(p.gerencia||'')===g).length)));
    const nome=g=>g||'Não inf.';
    let h=`<div class="gx-heat-scroll scroll-fade"><div class="gx-heat" style="--cols:${gers.length}" role="table" aria-label="Registros por etapa e gerência"><div class="gx-heat-row gx-heat-h" role="row"><span role="columnheader">Etapa</span>${gers.map(g=>`<span role="columnheader">${esc(nome(g))}</span>`).join('')}<span role="columnheader">Total</span></div>`;
    M.ETAPAS.forEach(e=>{
      const tot=m.lista.filter(p=>p.etapa===e.id).length;
      h+=`<div class="gx-heat-row ${tot?'':'is-zero'}" role="row"><span class="gx-heat-lbl" role="rowheader">${esc(e.nome)}</span>${gers.map(g=>{
        const v=m.lista.filter(p=>p.etapa===e.id&&(p.gerencia||'')===g).length,a=v?(.12+.78*v/max):0,escuro=a>.55;
        return v?`<button class="gx-heat-cell" role="cell" style="background:rgba(107,143,42,${a.toFixed(2)});color:${escuro?'#fff':TXT}" data-gx-cruz="${e.id}|${esc(g)}" data-tt="${esc(e.nome)} · ${esc(nome(g))}&#10;${plural(v,'registro','registros')}" aria-label="${esc(e.nome)}, ${esc(nome(g))}: ${v}">${v}</button>`:`<span class="gx-heat-cell vazio" role="cell" aria-label="${esc(e.nome)}, ${esc(nome(g))}: 0">·</span>`;}).join('')}<b class="gx-heat-tot" role="cell">${tot}</b></div>`;
    });
    h+=`</div></div><p class="chart-footnote">Intensidade proporcional à quantidade. Clique em uma célula para filtrar etapa e gerência ao mesmo tempo.</p>`;
    return h+dados('Registros por etapa e gerência',['Etapa',...gers.map(g=>({label:nome(g),align:'r'})),{label:'Total',align:'r'}],M.ETAPAS.map(e=>[e.nome,...gers.map(g=>m.lista.filter(p=>p.etapa===e.id&&(p.gerencia||'')===g).length),m.lista.filter(p=>p.etapa===e.id).length]));
  }

  /* ------------------------------------------------ gráfico de entradas: colunas empilhadas desenhadas na largura real */
  const SERIES=[];
  function svgEntradas(serie,W){
    W=Math.max(260,Math.round(W||800));
    const compacto=W<560;let pts=serie.pontos;
    if(compacto&&pts.length>12)pts=pts.slice(-6);
    const H=compacto?230:270,L=compacto?30:40,R=compacto?8:14,T=26,B=34,pw=W-L-R,ph=H-T-B;
    const max=Math.max(2,...pts.map(p=>p.total)),passoY=max<=4?1:Math.ceil(max/4),nY=max<=4?max:4,yMax=passoY*nY;
    const step=pw/Math.max(1,pts.length),bw=Math.max(6,Math.min(24,step*.56)),cada=Math.max(1,Math.ceil((compacto?44:52)/step));
    const cores={projetos:PALETTE[0],demandas:PALETTE[1]},fs=compacto?11:12.5;
    const seg=(x,y,h,topo)=>{if(h<=0)return '';const rr=topo?Math.min(4,h,bw/2):0;return rr?`M${x} ${y+h}V${y+rr}Q${x} ${y} ${x+rr} ${y}H${x+bw-rr}Q${x+bw} ${y} ${x+bw} ${y+rr}V${y+h}Z`:`M${x} ${y+h}V${y}H${x+bw}V${y+h}Z`;};
    let g='';
    for(let k=0;k<=nY;k++){const y=T+ph*(1-k/nY);g+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="${k?'#e3eae6':'#c9d6cf'}" stroke-width="1"/><text x="${L-8}" y="${y+4}" text-anchor="end" font-size="${fs-1}" fill="${TXT2}">${fmt.n(k*passoY)}</text>`;}
    pts.forEach((p,i)=>{
      const x=+(L+step*i+(step-bw)/2).toFixed(1),base=T+ph,hp=p.projetos/yMax*ph,hd=p.demandas/yMax*ph,gap=hp&&hd?2:0;
      const yP=base-hp,yD=yP-gap-hd,topo=hd?yD:yP;
      g+=`<path d="${seg(x,yP,hp,!hd)}" fill="${cores.projetos}"/><path d="${seg(x,yD,hd,true)}" fill="${cores.demandas}"/>`;
      if(p.total)g+=`<text x="${x+bw/2}" y="${topo-6}" text-anchor="middle" font-size="${fs}" font-weight="650" fill="${TXT}">${fmt.n(p.total)}</text>`;
      g+=`<rect class="hit" tabindex="0" x="${(L+step*i).toFixed(1)}" y="${T}" width="${step.toFixed(1)}" height="${ph}" fill="transparent" data-gx-col data-lbl="${esc(p.label)}" data-p="${p.projetos}" data-d="${p.demandas}" data-topo="${Math.min(topo,base).toFixed(1)}" data-cx="${(x+bw/2).toFixed(1)}" aria-label="${esc(p.label)}: ${plural(p.projetos,'projeto','projetos')} e ${plural(p.demandas,'demanda','demandas')}"/>`;
      if(i%cada===0)g+=`<text x="${x+bw/2}" y="${H-12}" text-anchor="middle" font-size="${fs}" fill="${TXT2}">${esc(p.label)}</text>`;
    });
    const unid=serie.passo===1?'mês':serie.passo===3?'trimestre':'ano';
    const aria=`Entradas por ${unid}: `+pts.map(p=>`${p.label} ${p.total} (${p.projetos} projetos, ${p.demandas} demandas)`).join('; ');
    return `<svg class="chart chart-cols gx-cols" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${g}</svg>`;
  }
  function graficoEntradas(serie){
    const idx=SERIES.push(serie)-1;if(SERIES.length>40)SERIES.splice(0,SERIES.length-40);
    const cores={projetos:PALETTE[0],demandas:PALETTE[1]};
    return `<div class="gx-cols-host" data-gx-serie="${idx}">${svgEntradas(serie,800)}</div><div class="legend"><span><i style="background:${cores.projetos}"></i>Projetos</span><span><i style="background:${cores.demandas}"></i>Demandas</span></div><p class="chart-footnote">Data de entrada do cadastro. ${serie.passo===3?'Agrupado por trimestre para permitir a leitura de todo o período.':serie.passo===12?'Agrupado por ano para permitir a leitura de todo o período.':'Quantidade de novos cadastros em cada mês.'}${serie.semData?` ${plural(serie.semData,'registro sem data não aparece','registros sem data não aparecem')} neste gráfico.`:''}</p>`+
      dados('Entradas por período',['Período',{label:'Projetos',align:'r'},{label:'Demandas',align:'r'},{label:'Total',align:'r'}],serie.pontos.map(p=>[p.label,p.projetos,p.demandas,p.total]));
  }
  function desenharEntradas(raiz=document){
    raiz.querySelectorAll('.gx-cols-host[data-gx-serie]').forEach(h=>{
      const s=SERIES[+h.dataset.gxSerie],w=h.clientWidth;if(!s||!w)return;
      if(+h.dataset.w===w)return;h.dataset.w=w;h.innerHTML=svgEntradas(s,w);
    });
  }
  let tmRes;window.addEventListener('resize',()=>{clearTimeout(tmRes);tmRes=setTimeout(()=>desenharEntradas(),120);});
  /* Dica ancorada no topo da coluna, com amostra de cor por série */
  let dica=null;
  const esconderDica=()=>{if(dica){dica.remove();dica=null;}};
  function mostrarDica(hit){
    const svg=hit.ownerSVGElement;if(!svg)return;
    const r=svg.getBoundingClientRect(),k=r.width/(svg.viewBox.baseVal.width||r.width),x=r.left+(+hit.dataset.cx)*k,y=r.top+(+hit.dataset.topo)*k;
    if(!dica){dica=document.createElement('div');dica.className='gp-tt gx-tt';dica.setAttribute('role','tooltip');document.body.appendChild(dica);}
    const p=+hit.dataset.p,d=+hit.dataset.d;
    dica.innerHTML=`<b>${esc(hit.dataset.lbl)}</b><span><i style="background:${PALETTE[0]}"></i>Projetos: ${p}</span><span><i style="background:${PALETTE[1]}"></i>Demandas: ${d}</span><span>Total: ${p+d}</span>`;
    const w=dica.offsetWidth,h=dica.offsetHeight;
    dica.style.left=Math.max(8,Math.min(window.innerWidth-w-8,x-w/2))+'px';dica.style.top=Math.max(8,y-h-10)+'px';
  }
  document.addEventListener('mouseover',e=>{const h=e.target.closest&&e.target.closest('[data-gx-col]');if(h)mostrarDica(h);else esconderDica();},{passive:true});
  document.addEventListener('focusin',e=>{const h=e.target.closest&&e.target.closest('[data-gx-col]');if(h)mostrarDica(h);});
  document.addEventListener('focusout',e=>{if(e.target.closest&&e.target.closest('[data-gx-col]'))esconderDica();});
  window.addEventListener('scroll',()=>{const a=document.activeElement;if(dica&&a&&a.matches&&a.matches('[data-gx-col]'))mostrarDica(a);else esconderDica();},{passive:true});window.addEventListener('hashchange',esconderDica);

  /* ------------------------------------------------ filtros compactos (chips) */
  const PERIODOS={'3m':['Últimos 3 meses','3 meses',3],'6m':['Últimos 6 meses','6 meses',6],'12m':['Últimos 12 meses','12 meses',12],ano:['Este ano','este ano',0]};
  function inicioPeriodo(k){const t=hoje();if(k==='ano')return t.slice(0,4)+'-01-01';const d=new Date(t+'T12:00:00');d.setMonth(d.getMonth()-PERIODOS[k][2]);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  const rotuloPeriodo=f=>f.periodo&&Object.prototype.hasOwnProperty.call(PERIODOS,f.periodo)?PERIODOS[f.periodo][1]:(f.de||f.ate)?`${f.de?fmt.data(f.de):'início'} a ${f.ate?fmt.data(f.ate):'hoje'}`:'todo';
  const MAIS=['natureza','tipo','origem','fonte'];
  const contaMais=f=>MAIS.filter(k=>k==='fonte'?f.fonte!=='todos':!!f[k]).length+((f.de||f.ate)&&!f.periodo?1:0);
  function ativosFiltro(f){
    const a=[];
    if(f.gerencia)a.push(['gerencia','Gerência '+f.gerencia]);if(f.etapa)a.push(['etapa',M.etapa(f.etapa).nome]);
    if(f.de||f.ate)a.push(['periodo','Período: '+rotuloPeriodo(f)]);if(f.natureza)a.push(['natureza',NATUREZAS[f.natureza]+'s']);
    if(f.tipo)a.push(['tipo',f.tipo]);if(f.origem)a.push(['origem','Origem '+f.origem.toLowerCase()]);
    if(f.fonte==='reais')a.push(['fonte','Somente reais']);if(f.fonte==='exemplos')a.push(['fonte','Somente exemplos']);if(f.q)a.push(['q','Busca: '+f.q]);
    return a;
  }
  function barraFiltros(f,{abas=''}={}){
    const chip=(campo,rot,val,on)=>`<button type="button" class="gx-chip ${on?'on':''}" data-gx-pop="${campo}" aria-haspopup="true" aria-expanded="false">${esc(rot)}: <b>${esc(val)}</b>${ico('baixo',14)}</button>`;
    const n=contaMais(f),ativos=ativosFiltro(f);
    return `<div class="gx-toolbar" data-noprint>${abas}<div class="gx-chips" role="group" aria-label="Filtros">
      ${chip('gerencia','Gerência',f.gerencia||'Todas',!!f.gerencia)}${chip('etapa','Etapa',f.etapa?M.etapa(f.etapa).nome:'Todas',!!f.etapa)}${chip('periodo','Período',rotuloPeriodo(f),!!(f.de||f.ate))}
      <button type="button" class="gx-chip ${n?'on':''}" data-gx-mais>${ico('funil',14)} Mais filtros${n?` (${n})`:''}</button></div></div>
      ${ativos.length?`<div class="gx-ativos" data-noprint><span class="gx-ativos-lbl">Filtros ativos</span>${ativos.map(([k,l])=>`<button type="button" class="gx-tag" data-gx-limpar="${k}" aria-label="Remover filtro ${esc(l)}">${esc(l)}${icon('x',13)}</button>`).join('')}<button class="link" data-limpar-analise>Limpar tudo</button></div>`:''}`;
  }
  let pop=null;
  const fecharPop=()=>{if(pop){pop.remove();pop=null;document.querySelectorAll('[data-gx-pop][aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));}};
  function abrirPop(btn){
    const campo=btn.dataset.gxPop,f=filtros();if(pop&&pop.dataset.campo===campo){fecharPop();return;}fecharPop();
    let ops=[];
    if(campo==='gerencia')ops=[['','Todas as gerências'],...M.CAT.gerencias.map(g=>[g.id,g.id+(g.nome&&g.nome!==g.id?' · '+g.nome:'')])];
    if(campo==='etapa')ops=[['','Todas as etapas'],...M.ETAPAS.map(e=>[e.id,e.nome])];
    if(campo==='periodo')ops=[['','Todo o período'],...Object.entries(PERIODOS).map(([k,v])=>[k,v[0]]),['__datas','Escolher datas…']];
    const atual=campo==='periodo'?(f.periodo||(f.de||f.ate?'__datas':'')):f[campo]||'';
    pop=document.createElement('div');pop.className='gx-pop';pop.dataset.campo=campo;pop.setAttribute('role','menu');
    pop.innerHTML=ops.map(([v,l])=>`<button type="button" role="menuitemradio" aria-checked="${v===atual}" class="${v===atual?'on':''}" data-gx-set="${campo}" data-value="${esc(v)}">${v===atual?icon('check',14):'<i></i>'}<span>${esc(l)}</span></button>`).join('');
    document.body.appendChild(pop);btn.setAttribute('aria-expanded','true');
    const r=btn.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
    pop.style.left=Math.max(8,Math.min(window.innerWidth-w-8,r.left))+'px';
    pop.style.top=(r.bottom+6+h>window.innerHeight-8?Math.max(8,r.top-h-6):r.bottom+6)+'px';
    const first=pop.querySelector('.on')||pop.querySelector('button');if(first)first.focus();
  }
  function aplicar(campo,valor){
    const f=filtros();
    if(campo==='periodo'){
      if(valor==='__datas'){fecharPop();maisFiltros(true);return;}
      f.periodo=valor;f.de=valor?inicioPeriodo(valor):'';f.ate='';
    }else if(campo==='q')f.q='';
    else if(campo==='fonte')f.fonte=valor||'todos';
    else f[campo]=valor;
    GP.save();fecharPop();GP.refresh();
  }
  function maisFiltros(focoDatas=false){
    const f=filtros(),sel=(k,ops,vazio)=>`<select class="select" name="${k}">${vazio!=null?`<option value="">${esc(vazio)}</option>`:''}${ops.map(([v,l])=>`<option value="${esc(v)}" ${v===f[k]?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
    const m=GP.modal(`<h3>Mais filtros</h3><p class="muted">Os filtros valem para os cartões, gráficos, tabela e exportações do recorte.</p>
      <form class="form gx-mais-form" data-gx-mais-form>
        <label class="field">Natureza${sel('natureza',Object.entries(NATUREZAS).map(([k,v])=>[k,v+'s']),'Projetos e demandas')}</label>
        <label class="field">Tipo de iniciativa${sel('tipo',M.CAT.tipos.map(t=>[t,t]),'Todos os tipos')}</label>
        <label class="field">Origem${sel('origem',M.CAT.origens.map(t=>[t,t]),'Todas as origens')}</label>
        <label class="field">Base exibida${sel('fonte',[['todos','Todos os registros'],['reais','Somente dados reais'],['exemplos','Somente exemplos fictícios']])}</label>
        <label class="field">Entrada a partir de<input class="input" type="date" name="de" value="${esc(f.de)}" min="2000-01-01" max="2100-12-31"></label>
        <label class="field">Entrada até<input class="input" type="date" name="ate" value="${esc(f.ate)}" min="2000-01-01" max="2100-12-31"></label>
      </form>
      <div class="m-act"><button class="btn btn-ghost" type="button" data-gx-mais-limpar>Limpar estes filtros</button><button class="btn btn-primary" type="button" data-gx-mais-ok>Aplicar</button></div>`,{largo:true});
    if(focoDatas){const d=m.querySelector('[name=de]');if(d)d.focus();}
    m.querySelector('[data-gx-mais-ok]').onclick=()=>{
      const d=Object.fromEntries(new FormData(m.querySelector('form')).entries());
      if(d.de!==f.de||d.ate!==f.ate)f.periodo='';
      Object.assign(f,{natureza:d.natureza||'',tipo:d.tipo||'',origem:d.origem||'',fonte:d.fonte||'todos',de:d.de||'',ate:d.ate||''});
      GP.save();GP.closeModal();GP.refresh();
    };
    m.querySelector('[data-gx-mais-limpar]').onclick=()=>{Object.assign(f,{natureza:'',tipo:'',origem:'',fonte:'todos'});if(!f.periodo){f.de='';f.ate='';}GP.save();GP.closeModal();GP.refresh();};
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-gx-pop]');if(b){abrirPop(b);return;}
    const s=e.target.closest('[data-gx-set]');if(s){aplicar(s.dataset.gxSet,s.dataset.value);return;}
    if(pop&&!e.target.closest('.gx-pop'))fecharPop();
    if(e.target.closest('[data-gx-mais]')){maisFiltros();return;}
    const l=e.target.closest('[data-gx-limpar]');if(l){const k=l.dataset.gxLimpar;if(k==='periodo'){const f=filtros();f.periodo='';f.de='';f.ate='';GP.save();GP.refresh();}else aplicar(k,'');return;}
    const c=e.target.closest('[data-gx-cruz]');if(c){const [et,ger]=c.dataset.gxCruz.split('|');Object.assign(filtros(),{etapa:et,gerencia:ger});GP.save();GP.refresh();return;}
  });
  document.addEventListener('keydown',e=>{
    if(!pop)return;
    if(e.key==='Escape'){const campo=pop.dataset.campo;fecharPop();const b=document.querySelector(`[data-gx-pop="${campo}"]`);if(b)b.focus();e.stopPropagation();return;}
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){const bs=[...pop.querySelectorAll('button')],i=bs.indexOf(document.activeElement);const n=bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length];if(n){n.focus();e.preventDefault();}}
  },true);
  window.addEventListener('hashchange',fecharPop);window.addEventListener('resize',fecharPop);
  function descricaoFiltros(f){
    const partes=[];
    if(f.gerencia)partes.push('Gerência '+f.gerencia);if(f.natureza)partes.push(NATUREZAS[f.natureza]);if(f.etapa)partes.push(M.etapa(f.etapa).nome);
    if(f.tipo)partes.push(f.tipo);if(f.origem)partes.push(f.origem);if(f.de||f.ate)partes.push('Entrada '+(f.de?fmt.data(f.de):'sem início')+' a '+(f.ate?fmt.data(f.ate):'sem fim'));
    if(f.fonte==='reais')partes.push('Somente reais');if(f.fonte==='exemplos')partes.push('Somente exemplos');if(f.q)partes.push('Busca: '+f.q);
    return partes.length?partes.join(' / '):'Todos os registros cadastrados';
  }
  const temFiltro=f=>ativosFiltro(f).length>0;

  /* ------------------------------------------------ tabela gerencial */
  const iconeNatureza=p=>natureza(p)==='demanda'
    ?`<span class="gx-nat gx-nat-d" data-tt="Demanda" aria-label="Demanda" role="img">${ico('etiqueta',16)}</span>`
    :`<span class="gx-nat gx-nat-p" data-tt="Projeto" aria-label="Projeto" role="img">${ico('alvo',16)}</span>`;
  function celulaAvanco(p){
    const v=progresso(p);
    if(p.etapa==='concluido'||((p.etapa==='execucao'||p.etapa==='espera')&&v!=null))return `<div class="progress-cell gx-prog"><span>${fmt.n(v)}%</span><span class="gx-prog-bar"><i style="width:${Math.max(0,Math.min(100,v))}%"></i></span></div>`;
    if(p.etapa==='execucao'||p.etapa==='espera')return '<span class="dim">Não informado</span>';
    return '<span class="dim" aria-label="Não se aplica">—</span>';
  }
  function tabela(lista,f){
    const filtrado=temFiltro(f);
    return `<div class="table-tools"><div><h3>Projetos e demandas do recorte</h3><span class="dim" style="font-size:11px">${plural(lista.length,'registro','registros')}. Clique em um registro para abrir a ficha.</span></div><input class="input" data-af="q" value="${esc(f.q)}" placeholder="Buscar por título, código, área ou pessoa" aria-label="Buscar nos indicadores"></div><div class="portfolio-table gx-tabela">${U.table({id:'analytics',rows:lista,cols:[
      {key:'codigo',label:'Código',fmt:(v,p)=>`<span class="code">${esc(v)}</span>${p.exemplo?'<span class="gx-ex">Exemplo</span>':''}`,sortVal:p=>p.codigo,sort:true},
      {key:'titulo',label:'Registro',main:true,fmt:(v,p)=>`<b class="gx-clamp" title="${esc(semExemplo(v))}">${esc(semExemplo(v))}</b><small>${esc(p.area||p.tipo||'')}</small>`,sortVal:p=>semExemplo(p.titulo)},
      {key:'natureza',label:'Natureza',fmt:(v,p)=>iconeNatureza(p),sortVal:natureza},
      {key:'gerencia',label:'Gerência'},
      {key:'etapa',label:'Etapa',fmt:v=>GP.etapaPill(v),sortVal:p=>M.etapa(p.etapa).ordem},
      {key:'progresso',label:'Avanço',align:'r',fmt:(v,p)=>celulaAvanco(p),sortVal:p=>progresso(p)??-1},
      {key:'custo',label:'Custo',align:'r',fmt:v=>`<span class="gx-num" style="white-space:nowrap">${fmt.brl(v)}</span>`},
      {key:'fimPrevisto',label:'Prazo',fmt:(v,p)=>`<span class="gx-num" title="Fim previsto" style="${ABERTOS.includes(p.etapa)&&v&&v<hoje()?'color:var(--warn);font-weight:600':''}">${fmt.data(v)}</span>`}
    ],rowAttr:p=>`class="click" data-abrir="${p.id}" tabindex="0"`,vazioTxt:filtrado?'Nenhum registro com os filtros selecionados.':'Nenhum registro cadastrado'})}</div>`;
  }

  /* ------------------------------------------------ painel: próximo passo, atenção, atividade */
  function proximosPassos(m){
    const lista=m.lista,nivel=GP.nivel(),t=hoje(),passos=[];
    m.atrasados.slice().sort((a,b)=>a.fimPrevisto.localeCompare(b.fimPrevisto)).slice(0,1).forEach(p=>{const d=diasEntre(p.fimPrevisto,t);
      passos.push({verbo:'Revisar o prazo de',p,motivo:`O fim previsto era ${fmt.data(p.fimPrevisto)}: vencido há ${plural(d,'dia','dias')}.${m.atrasados.length>1?` Outros ${m.atrasados.length-1} estão na mesma situação.`:''}`,acao:{rotulo:'Abrir a ficha',href:'#/projeto/'+p.id}});});
    const fila=lista.filter(p=>FILA.includes(p.etapa)&&dataEntrada(p)&&diasEntre(dataEntrada(p),t)>30).sort((a,b)=>dataEntrada(a).localeCompare(dataEntrada(b)));
    if(fila.length){const p=fila[0],d=diasEntre(dataEntrada(p),t);
      passos.push({verbo:'Decidir a entrada de',p,motivo:`Está na fila há ${plural(d,'dia','dias')}, desde ${fmt.data(dataEntrada(p))}.${fila.length>1?` ${plural(fila.length-1,'outro registro espera','outros registros esperam')} há mais de 30 dias.`:''}`,acao:{rotulo:'Fazer o checklist',entrada:p.id}});}
    if(nivel>=2){
      const semNota=lista.filter(p=>p.etapa==='aprovado'&&!M.pontuar(p).completo);
      if(semNota.length){const p=semNota[0];passos.push({verbo:'Avaliar',p,motivo:`Foi admitido, mas ainda não tem as notas de valor e esforço.${semNota.length>1?` Há mais ${semNota.length-1} na mesma situação.`:''}`,acao:{rotulo:'Avaliar agora',href:'#/avaliar/'+p.id}});}
      const forcar=GP.state().forcar||{},prontos=M.ranking(lista.filter(p=>p.etapa==='aprovado')).filter(x=>!forcar[x.p.id]);
      if(prontos.length)passos.push({verbo:'Levar ao comitê',objeto:plural(prontos.length,'iniciativa priorizada','iniciativas priorizadas'),motivo:'Estão avaliadas e ordenadas no ranking, mas ainda sem decisão de início.',acao:{rotulo:'Abrir o ranking',href:'#/ranking'}});
    }
    if(nivel>=3&&!GP.state().meta.capacidadeConfirmada){const cap=GP.state().capacidade;
      passos.push({verbo:'Confirmar a capacidade de',objeto:String(cap.periodo||'período'),motivo:`A simulação usa valores sugeridos (${fmt.n(cap.fte,1)} FTE e ${cap.reservaPct}% de reserva). Confirme com a equipe.`,acao:{rotulo:'Revisar capacidade',href:'#/carteira'}});}
    return passos;
  }
  const botaoPasso=(a,cls='btn btn-primary')=>a.entrada?`<button class="${cls}" data-gx-entrada="${esc(a.entrada)}">${esc(a.rotulo)}</button>`:`<a class="${cls}" href="${a.href}">${esc(a.rotulo)}</a>`;
  const objetoPasso=s=>s.p?`<span class="code">${esc(s.p.codigo)}</span>`:esc(s.objeto);
  function cartaoProximo(m){
    const ps=proximosPassos(m);
    if(!ps.length)return `<section class="card gx-next gx-next-ok"><span class="gx-eyebrow">Seu próximo passo</span><h2>Tudo em dia</h2><p class="gx-next-why">${icon('check',16)}<span>Nenhuma pendência pelas regras de prazo, fila, avaliação e decisão.</span></p><div class="gx-next-act"><a class="btn btn-primary" href="#/novo">${icon('novo',15)} Nova iniciativa</a></div></section>`;
    const [s,...resto]=ps;
    return `<section class="card gx-next" aria-label="Seu próximo passo"><span class="gx-eyebrow">Seu próximo passo</span>
      <h2>${esc(s.verbo)} ${objetoPasso(s)}</h2>${s.p?`<p class="gx-next-obj">${esc(semExemplo(s.p.titulo))}</p>`:''}
      <p class="gx-next-why">${icon('relogio',16)}<span>${esc(s.motivo)}</span></p>
      <div class="gx-next-act">${botaoPasso(s.acao)}${resto.length?`<details class="gx-mais"><summary>Ver mais ${resto.length}</summary><ul>${resto.map(r=>`<li><span><b>${esc(r.verbo)} ${objetoPasso(r)}</b><small>${esc(r.motivo)}</small></span>${botaoPasso(r.acao,'link')}</li>`).join('')}</ul></details>`:''}</div></section>`;
  }
  /** Regras de acompanhamento: as que falham viram pendências; as que passam aparecem como verificadas. */
  function regrasAtencao(m){
    const nivel=GP.nivel(),semResp=m.lista.filter(p=>ABERTOS.includes(p.etapa)&&!p.responsavel),semAv=m.lista.filter(p=>p.etapa==='execucao'&&progresso(p)==null),semPrior=m.lista.filter(p=>p.etapa==='aprovado'&&!M.pontuar(p).completo);
    const r=[
      {lista:m.atrasados,txt:n=>plural(n,'prazo previsto vencido','prazos previstos vencidos'),ok:'Prazos previstos em dia',desc:'Revise datas e situação com os responsáveis.',href:p=>'#/projeto/'+p.id},
      {lista:semResp,txt:n=>plural(n,'iniciativa sem responsável','iniciativas sem responsável'),ok:'Responsáveis definidos',desc:'Aprovadas, em execução ou em espera.',href:p=>'#/novo/'+p.id},
      ...(nivel>=2?[{lista:semPrior,txt:n=>plural(n,'aprovado sem prioridade completa','aprovados sem prioridade completa'),ok:'Aprovados com avaliação completa',desc:'Conclua a avaliação antes da decisão de início.',href:p=>'#/avaliar/'+p.id}]:[]),
      {lista:semAv,txt:n=>plural(n,'execução sem avanço informado','execuções sem avanço informado'),ok:'Avanço informado nas execuções',desc:'Atualize o percentual de avanço na ficha.',href:p=>'#/novo/'+p.id},
      {lista:m.semDatas,txt:n=>plural(n,'iniciativa sem datas previstas','iniciativas sem datas previstas'),ok:'Datas previstas completas',desc:'Informe início e fim para o planejamento.',href:p=>'#/novo/'+p.id},
    ];
    if(nivel>=2&&GP.riscos&&GP.riscos.medir){const v=GP.riscos.medir().vencidos;r.push({lista:v,txt:n=>plural(n,'ação de risco vencida','ações de risco vencidas'),ok:'Ações de risco no prazo',desc:'Atualize o plano de mitigação.',href:()=>'#/riscos'});}
    return r;
  }
  function itensAtencao(m){
    return regrasAtencao(m).filter(x=>x.lista.length).map(x=>({n:x.lista.length,txt:x.txt(x.lista.length),desc:x.desc,href:x.href(x.lista[0])}));
  }
  function atencoes(m,max=5){
    const rg=regrasAtencao(m),it=itensAtencao(m).slice(0,max),ok=rg.filter(x=>!x.lista.length);
    if(!it.length)return `<div class="attention-list gx-att"><div class="info-empty gx-tudo-ok">${icon('check',22)}<p><b>Tudo em dia</b>${m.n?'Nenhuma pendência pelas regras de prazo, responsável, avanço e datas.':'Cadastre registros para acompanhar as pendências.'}</p></div></div>`;
    return `<div class="attention-list gx-att">${it.map(x=>`<a class="attention-item" href="${x.href}"><span class="ic">${icon('alerta',15)}</span><p><b>${esc(x.txt)}</b>${esc(x.desc)}</p></a>`).join('')}
      ${ok.length&&it.length<4?`<ul class="gx-ok-list" aria-label="Regras verificadas">${ok.map(x=>`<li>${icon('check',14)}<span>${esc(x.ok)}</span></li>`).join('')}</ul>`:''}</div>`;
  }
  /* Atividade recente: históricos de projetos e riscos */
  let visitaRegistrada=false;
  function registrarVisita(){
    if(visitaRegistrada||!GP.state())return;visitaRegistrada=true;
    const ui=GP.state().ui;ui.visitaAnterior=typeof ui.ultimaVisita==='string'&&!isNaN(new Date(ui.ultimaVisita))?ui.ultimaVisita.slice(0,40):'';ui.ultimaVisita=new Date().toISOString();GP.save();
  }
  GP.registrarVisita=registrarVisita;
  const TIPO_EVENTO={Cadastro:'novo',Etapa:'seta',Entrada:'funil','Priorização':'avaliar','Edição':'editar','Importação':'upload',Risco:'alerta'};
  function eventos(){
    const ev=[];
    P.todos().forEach(p=>(p.historico||[]).forEach(h=>ev.push({data:h.data,acao:h.acao,detalhe:h.detalhe,codigo:p.codigo,titulo:semExemplo(p.titulo),href:'#/projeto/'+p.id,tipo:h.acao})));
    if(GP.riscos&&GP.riscos.todos)GP.riscos.todos().forEach(r=>(r.historico||[]).forEach(h=>ev.push({data:h.data,acao:h.acao,detalhe:r.titulo,codigo:r.codigo,titulo:r.titulo,href:'#/riscos',tipo:'Risco'})));
    return ev.filter(e=>e.data&&!isNaN(new Date(e.data))).sort((a,b)=>String(b.data).localeCompare(String(a.data)));
  }
  function relativo(iso){
    const ms=Date.now()-new Date(iso).getTime();if(ms<60e3)return 'há instantes';
    const min=Math.floor(ms/60e3);if(min<60)return `há ${min} min`;const h=Math.floor(min/60);if(h<24)return `há ${h} h`;
    const d=Math.floor(h/24);return d===1?'ontem':d<30?`há ${d} dias`:fmt.data(String(iso).slice(0,10));
  }
  const ACAO_TXT={Cadastro:'Cadastrado',Etapa:'Mudou de etapa',Entrada:'Checklist de entrada','Priorização':'Avaliação registrada','Edição':'Cadastro editado','Importação':'Importado'};
  function atividade(){
    const ev=eventos(),ant=typeof GP.state().ui.visitaAnterior==='string'?GP.state().ui.visitaAnterior:'',novos=ant?ev.filter(e=>e.data>ant).length:0;
    const ult=ev.slice(0,6);
    return `<div class="card b-4 gx-ativ">${chartHead('Atividade recente','Últimas mudanças nos projetos e riscos.','relogio')}
      ${novos?`<span class="gx-novidades"><i></i>${plural(novos,'novidade','novidades')} desde ${fmt.data(ant.slice(0,10)).slice(0,5)}</span>`:''}
      ${ult.length?`<ol class="gx-feed">${ult.map(e=>`<li class="${ant&&e.data>ant?'novo':''}"><span class="gx-feed-ic">${ico(TIPO_EVENTO[e.tipo]||'info',15)}</span><span class="gx-feed-txt"><span class="gx-feed-l1"><a class="code" href="${e.href}">${esc(e.codigo)}</a> ${esc(ACAO_TXT[e.acao]||e.acao)}${ant&&e.data>ant?'<i class="gx-dot" aria-label="Novidade"></i>':''}</span><small title="${esc(e.detalhe||'')}">${esc(e.tipo==='Etapa'?String(e.detalhe||'').split('. Motivo')[0]:e.titulo)}</small></span><time datetime="${esc(e.data)}">${esc(relativo(e.data))}</time></li>`).join('')}</ol>`:`<div class="info-empty">Nenhuma atividade registrada ainda.</div>`}</div>`;
  }
  function recentes(todos){
    const ult=todos.slice().sort((a,b)=>(b.atualizadoEm||b.criadoEm||'').localeCompare(a.atualizadoEm||a.criadoEm||'')).slice(0,6);
    return `<div class="card b-8 gx-recentes">${chartHead('Atualizados recentemente','Os registros alterados por último.','acervo')}
      <ul class="gx-rec">${ult.map(p=>`<li><a href="#/projeto/${p.id}"><span class="code">${esc(p.codigo)}</span><span class="gx-rec-t">${esc(semExemplo(p.titulo))}</span><span class="gx-rec-e">${GP.etapaPill(p.etapa)}</span><span class="gx-rec-d">${fmt.data(String(p.atualizadoEm||p.criadoEm||'').slice(0,10))}</span></a></li>`).join('')}</ul>
      <div class="gx-card-foot"><a class="link" href="#/acervo">Ver todos no acervo (${fmt.n(todos.length)})</a></div></div>`;
  }
  function cartaoDecisoes(m){
    const forcar=GP.state().forcar||{},rk=M.ranking(m.lista.filter(p=>p.etapa==='aprovado')),pend=rk.filter(x=>!forcar[x.p.id]),sem=m.capacidade.semNota.length;
    return `<div class="card b-4 gx-dec">${chartHead('Decisões pendentes','Priorizadas pelo ranking e ainda sem decisão do comitê.','avaliar')}
      ${pend.length?`<ol class="gx-dec-list">${pend.slice(0,3).map(x=>`<li><a href="#/projeto/${x.p.id}"><span class="gx-pos">${x.pos}</span><span class="gx-dec-t"><span class="code">${esc(x.p.codigo)}</span>${esc(semExemplo(x.p.titulo))}</span><b class="gx-num" data-tt="Valor ${fmt.n(x.s.valor)} · esforço ${fmt.n(x.s.esforco)}">${fmt.n(x.s.valor)}</b></a></li>`).join('')}</ol>`:`<div class="info-empty">${icon('check',20)}<p>Nenhuma iniciativa avaliada aguarda decisão.</p></div>`}
      <div class="gx-card-foot">${sem?`<a class="link" href="#/avaliar">${plural(sem,'aprovado aguarda avaliação','aprovados aguardam avaliação')}</a>`:''}<a class="link" href="#/ranking">Abrir o ranking${pend.length>3?` (${pend.length})`:''}</a></div></div>`;
  }
  function cartaoRiscos(){
    if(!GP.riscos||!GP.riscos.medir)return '';
    const r=GP.riscos.medir(),niv={baixo:0,moderado:0,alto:0,critico:0};r.avaliados.forEach(x=>{const k=GP.riscos.nivel(x);if(k in niv)niv[k]++;});
    const cores={baixo:'#6b8f2a',moderado:'#d5a32d',alto:'#b8642c',critico:'#ac7044'},nomes={baixo:'Baixo',moderado:'Moderado',alto:'Alto',critico:'Crítico'},tot=r.avaliados.length;
    const topo=r.avaliados.slice().sort((a,b)=>(GP.riscos.nota(b)||0)-(GP.riscos.nota(a)||0))[0];
    return `<div class="card b-4 gx-risco">${chartHead('Riscos','Exposição dos riscos abertos e em tratamento.','alerta')}
      <div class="gx-risco-nums"><div><strong>${fmt.n(r.ativos.length)}</strong><span>ativos</span></div><div><strong class="${r.altos.length?'gx-cobre':''}">${fmt.n(r.altos.length)}</strong><span>altos ou críticos</span></div><div><strong class="${r.vencidos.length?'gx-cobre':''}">${fmt.n(r.vencidos.length)}</strong><span>ações vencidas</span></div></div>
      ${tot?`<div class="gx-risco-bar" role="img" aria-label="${esc(Object.keys(niv).map(k=>nomes[k]+': '+niv[k]).join(', '))}">${Object.keys(niv).filter(k=>niv[k]).map(k=>`<i style="flex:${niv[k]};background:${cores[k]}" data-tt="${nomes[k]}&#10;${plural(niv[k],'risco','riscos')}"></i>`).join('')}</div><div class="legend legend-mini">${Object.keys(niv).filter(k=>niv[k]).map(k=>`<span><i style="background:${cores[k]}"></i>${nomes[k]} ${niv[k]}</span>`).join('')}</div>`:''}
      ${topo?`<p class="gx-risco-top"><span class="dim">Maior exposição</span><a href="#/riscos"><span class="code">${esc(topo.codigo)}</span> ${esc(topo.titulo)}</a></p>`:`<p class="gx-risco-top dim">${r.n?'Nenhum risco ativo avaliado.':'Nenhum risco registrado ainda.'}</p>`}
      <div class="gx-card-foot"><a class="link" href="#/riscos">${r.n?'Abrir gestão de riscos':'Registrar o primeiro risco'}</a></div></div>`;
  }
  function cartaoCapacidade(m){
    if(GP.capacidadeResumo){try{return `<div class="b-4 gx-cap-host">${GP.capacidadeResumo()}</div>`;}catch(e){console.error(e);}}
    const c=m.capacidade,cap=GP.state().capacidade,uso=c.efetiva?m.fteExecucao/c.efetiva:null,acima=uso!=null&&uso>1;
    return `<div class="card b-4 gx-capf">${chartHead('Capacidade · '+String(cap.periodo||''),'Pessoas disponíveis e novos inícios que cabem.','medidor')}
      <div class="gx-capf-body">${ring(uso==null?null:Math.min(1,uso),acima?COBRE:'var(--c1)',96,uso==null?'-':fmt.pct(uso))}<div><b>${fmt.n(m.fteExecucao,1)} de ${fmt.n(c.efetiva,1)} FTE</b><span class="dim">em execução${acima?' · acima da capacidade':''}</span><b>${plural(c.cabem,'novo início cabe','novos inícios cabem')}</b><span class="dim">de ${c.candidatos} aprovados avaliados</span></div></div>
      <div class="gx-card-foot"><a class="link" href="#/carteira">Abrir carteira e capacidade</a></div></div>`;
  }
  function etapaFluxo(href,rot,n,sub,extra=''){return `<a class="gx-step" href="${href}"><span class="gx-step-lbl">${esc(rot)}</span><strong>${fmt.n(n)}</strong><small>${sub}</small>${extra}</a>`;}
  const etapaBloqueada=(rot,nv)=>`<div class="gx-step locked"><span class="gx-step-lbl">${esc(rot)}</span><span class="gx-lock">${ico('cadeado',16)} Disponível no nível ${nv}</span><button type="button" class="link gx-ativar" data-nivel="${nv}">Ativar nível ${nv}</button></div>`;
  function fluxo(m){
    const nivel=GP.nivel(),todos=m.lista,avaliar=todos.filter(p=>p.etapa==='aprovado'&&!M.pontuar(p).completo).length,prontos=todos.filter(p=>p.etapa==='aprovado'&&M.pontuar(p).completo).length;
    const dl=deltaChip(m.tendencia.fila);
    const chip=`<span class="gx-delta ${dl.tom?'gx-delta-'+dl.tom:''}">${esc(dl.texto)}</span>`;
    return `<section class="b-full operation-flow gx-flow" aria-label="Fluxo do portfólio">
      ${etapaFluxo('#/funil','Fila de entrada',m.fila,`${plural(m.novas,'nova','novas')} · ${fmt.n(m.triagem)} em triagem`,chip)}
      ${nivel>=2?etapaFluxo('#/avaliar','Avaliação',avaliar,avaliar===1?'aprovado sem nota':'aprovados sem nota')+etapaFluxo('#/ranking','Decisão',prontos,prontos===1?'pronta para decisão':'prontas para decisão'):etapaBloqueada('Avaliação e decisão',2)}
      ${etapaFluxo('#/acervo','Em execução',m.execucao,m.atrasados.length?`<span class="gx-cobre">${plural(m.atrasados.length,'prazo vencido','prazos vencidos')}</span>`:m.progresso!=null?`avanço médio de ${fmt.n(m.progresso)}%`:'sem avanço informado')}
      ${nivel>=3?etapaFluxo('#/carteira','Planejamento',m.capacidade.cabem,m.capacidade.cabem===1?'novo início cabe':'novos inícios cabem'):etapaBloqueada('Planejamento',3)}
    </section>`;
  }
  function sintese(m){
    const nivel=GP.nivel(),lk=(h,t)=>`<a href="${h}"><b>${t}</b></a>`,cap=GP.state().capacidade,prontos=m.lista.filter(p=>p.etapa==='aprovado'&&M.pontuar(p).completo).length;
    let s=`A carteira soma ${lk('#/acervo',plural(m.n,'iniciativa','iniciativas'))}${m.comCusto?` e ${lk('#/indicadores',fmt.mi(m.custo))} em custo estimado`:''}. `;
    if(nivel>=2&&prontos){
      s+=`${lk('#/ranking',`${fmt.n(prontos)} ${prontos===1?'está pronta':'estão prontas'} para decisão`)}`;
      if(nivel>=3){const c=m.capacidade.cabem;s+=`${c<prontos?', mas':' e'} a capacidade de ${esc(String(cap.periodo||'período'))} comporta ${lk('#/carteira',plural(c,'novo início','novos inícios'))}`;}
      s+='.';
    }else{
      s+=`${lk('#/acervo',`${fmt.n(m.execucao)} ${m.execucao===1?'está':'estão'} em execução`)}${m.concluidos?` e ${plural(m.concluidos,'foi concluída','foram concluídas')}`:''}.`;
    }
    if(m.atrasados.length)s+=` ${lk('#/projeto/'+m.atrasados[0].id,plural(m.atrasados.length,'prazo venceu','prazos venceram'))}.`;
    return s;
  }
  function kpisPainel(m){
    const t=m.tendencia;
    return `<div class="metric-grid gx-kpis gx-kpis-4 scroll-fade">
      ${metric({label:'Registros na base',valor:fmt.n(m.n),sub:`${plural(m.projetos,'projeto','projetos')} e ${plural(m.demandas,'demanda','demandas')}`,icone:'acervo',delta:`${sinal(t.novos)} em 30 dias`,deltaTom:t.novos>0?'bom':''})}
      ${metric({label:'Admissão na entrada',valor:fmt.pct(m.taxaEntrada),sub:`${m.entram} de ${plural(m.entradaAvaliada,'checklist completo','checklists completos')} admitidos`,icone:'funil',ratio:m.taxaEntrada})}
      ${metric({label:'Conclusão da carteira',valor:fmt.pct(m.taxaConclusao),sub:`${plural(m.concluidos,'concluído','concluídos')} de ${fmt.n(m.carteira)} aceitos`,icone:'check',ratio:m.taxaConclusao})}
      ${metric({label:'Prazos vencidos',valor:fmt.n(m.atrasados.length),sub:'Aceitos e abertos com fim previsto vencido',icone:'relogio',tom:m.atrasados.length?COBRE:UNICA,tint:m.atrasados.length?'#fbeee6':'#f1f6ea'})}
    </div>`;
  }
  function vazioPainel(el){
    el.innerHTML=`<section class="gx-vazio" aria-labelledby="gx-vazio-h">
      <svg class="gx-vazio-art" viewBox="0 0 220 150" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <rect x="18" y="22" width="120" height="96" rx="12" stroke="#3E6801" stroke-width="1.6"/><path d="M34 46h56M34 62h80M34 78h44" stroke="#6b8f2a" stroke-width="1.6"/>
        <path d="M34 100V92M50 100V84M66 100V88M82 100V76" stroke="#6b8f2a" stroke-width="5"/>
        <circle cx="160" cy="64" r="30" stroke="#d5a32d" stroke-width="1.6"/><path d="M160 46v18l12 8" stroke="#d5a32d" stroke-width="1.6"/>
        <path d="M118 128h84" stroke="#3E6801" stroke-width="1.6"/><circle cx="196" cy="30" r="4" stroke="#6b8f2a" stroke-width="1.6"/><circle cx="24" cy="134" r="3" stroke="#d5a32d" stroke-width="1.6"/>
      </svg>
      <div class="gx-vazio-txt"><span class="gx-eyebrow">Painel do portfólio</span><h1 id="gx-vazio-h">Seu portfólio começa aqui</h1>
        <p>O painel mostra o que precisa de atenção assim que houver registros. Comece por um destes caminhos:</p>
        <ol class="gx-passos"><li><b>Cadastrar</b><span>Registre projetos e demandas com gerência, responsável e estimativas.</span></li><li><b>Decidir a entrada</b><span>Use o checklist para dizer o que entra no portfólio.</span></li><li><b>Priorizar</b><span>Avalie valor e esforço e leve o ranking ao comitê.</span></li></ol>
        <div class="actions"><a class="btn btn-primary" href="#/novo">${icon('novo',15)} Cadastrar primeiro registro</a><button class="btn btn-ghost" data-importar-csv>${icon('upload',15)} Importar planilha</button><button class="btn btn-ghost" data-exemplos>${icon('estrela',15)} Explorar com 14 exemplos</button></div>
      </div></section>`;
  }
  function resumo(el){
    registrarVisita();
    const todos=P.todos(),m=medir(todos),nivel=GP.nivel();
    if(!m.n){vazioPainel(el);return;}
    let linha2='';
    if(nivel>=2){
      const caps=nivel>=3?cartaoCapacidade(m):'',risc=cartaoRiscos();
      linha2=nivel>=3?cartaoDecisoes(m)+risc+caps:cartaoDecisoes(m).replace('card b-4','card b-6')+risc.replace('card b-4','card b-6');
    }
    el.innerHTML=`<div class="bento bento-painel gx-painel">
      <section class="b-hero gx-hero"><div class="gx-hero-in"><h1>Painel do portfólio</h1><p class="gx-sintese">${sintese(m)}</p>
        <div class="actions gx-hero-act"><a class="btn btn-ghost" href="#/novo">${icon('novo',15)} Nova iniciativa</a><details class="gx-menu"><summary class="btn btn-ghost gx-menu-btn" aria-label="Mais ações">${ico('mais',18)}</summary><div class="gx-menu-pop" role="menu"><button type="button" role="menuitem" data-importar-csv>${icon('upload',15)} Importar planilha</button><a role="menuitem" href="#/acervo">${icon('acervo',15)} Abrir acervo</a></div></details></div></div></section>
      <aside class="b-side gx-side">${cartaoProximo(m)}</aside>
      ${fluxo(m)}
      ${sample(m)}${kpisPainel(m)}
      ${linha2}
      <div class="card b-8 card-wide gx-entradas">${chartHead('Entrada de projetos e demandas','Novos cadastros por data de entrada.','roadmap')}${graficoEntradas(m.serie)}</div>
      <div class="card b-4 gx-atencao">${chartHead('Pontos para acompanhamento','Pendências calculadas a partir dos registros.','alerta')}${atencoes(m)}<div class="gx-card-foot"><a class="link" href="#/indicadores">Abrir análise completa</a></div></div>
      ${recentes(todos)}${atividade()}
    </div>`;
    desenharEntradas(el);
  }

  /* ------------------------------------------------ indicadores */
  function kpisIndicadores(m){
    const t=m.tendencia,df=deltaChip(t.fila);
    return `<div class="metric-grid gx-kpis scroll-fade">
      ${metric({label:'Registros na base',valor:fmt.n(m.n),sub:`${plural(m.projetos,'projeto','projetos')} e ${plural(m.demandas,'demanda','demandas')}`,icone:'acervo',delta:`${sinal(t.novos)} em 30 dias`,deltaTom:t.novos>0?'bom':''})}
      ${metric({label:'Fila de entrada',valor:fmt.n(m.fila),sub:`${fmt.pct(divisao(m.fila,m.n))} do total cadastrado`,icone:'funil',tom:'#c39127',tint:'#fff7e6',delta:df.texto,deltaTom:df.tom})}
      ${metric({label:'Em execução',valor:fmt.n(m.execucao),sub:`${fmt.pct(divisao(m.execucao,m.n))} do total cadastrado`,icone:'pulso',tom:'#188787',tint:'#e8f4f1'})}
      ${metric({label:'Admissão na entrada',valor:fmt.pct(m.taxaEntrada),sub:`${m.entram} de ${plural(m.entradaAvaliada,'checklist completo','checklists completos')}`,icone:'avaliar',ratio:m.taxaEntrada})}
      ${metric({label:'Conclusão da carteira',valor:fmt.pct(m.taxaConclusao),sub:`${plural(m.concluidos,'concluído','concluídos')} de ${fmt.n(m.carteira)} aceitos`,icone:'check',ratio:m.taxaConclusao})}
      ${metric({label:'Prazos vencidos',valor:fmt.n(m.atrasados.length),sub:'Aceitos e abertos com fim vencido',icone:'relogio',tom:m.atrasados.length?COBRE:UNICA,tint:m.atrasados.length?'#fbeee6':'#f1f6ea'})}
    </div>`;
  }
  function visaoGeral(m,lista){
    const et=m.etapas,chk=['entra','falta_info','nao_entra'].map(k=>({key:k,label:M.RESULTADO_ENTRADA[k].nome,value:lista.filter(p=>p.entrada?.resultado===k).length,color:{entra:'#6b8f2a',falta_info:'#d5a32d',nao_entra:'#b8642c'}[k]}));
    const linhas=it=>it.map(i=>[i.label,i.value,fmt.pct(divisao(i.value,m.n))]);
    const colsQ=(rot)=>[rot,{label:'Registros',align:'r'},{label:'% do recorte',align:'r'}];
    return kpisIndicadores(m)+`
      <div class="card gx-card gx-entradas-ind">${chartHead('Projetos e demandas por período','Entradas do recorte, conforme o período selecionado.','roadmap')}${graficoEntradas(m.serie)}</div>
      <div class="analytics-grid analytics-equal gx-row">
        <div class="card gx-card">${chartHead('Distribuição por etapa','Quantidade e percentual no recorte. Clique para filtrar.','funil')}${hbars(et,m.n,{key:'etapa',ordem:'fixa'})}<div class="gx-card-foot">${dados('Distribuição por etapa',colsQ('Etapa'),linhas(et))}</div></div>
        <div class="card gx-card">${chartHead('Natureza por etapa','Projetos e demandas em cada etapa do processo.','etiqueta')}${empilhadas(et)}<div class="gx-card-foot">${dados('Natureza por etapa',['Etapa',{label:'Projetos',align:'r'},{label:'Demandas',align:'r'},{label:'Total',align:'r'}],et.map(e=>[e.label,e.projetos,e.demandas,e.value]))}</div></div>
      </div>
      <div class="card gx-card gx-cruz">${chartHead('Etapa × gerência','Onde está cada parte da carteira.','organograma')}${cruzamento(m)}</div>
      <div class="analytics-grid analytics-equal gx-row">
        <div class="card gx-card">${chartHead('Distribuição por gerência','Participação no recorte, da maior para a menor.','organograma')}${hbars(m.gerencias,m.n,{key:'gerencia'})}<div class="gx-card-foot">${dados('Distribuição por gerência',colsQ('Gerência'),linhas(m.gerencias))}</div></div>
        <div class="card gx-card">${chartHead('Resultado do checklist de entrada','Checklists completos do recorte.','avaliar')}${hbars(chk,m.entradaAvaliada,{ordem:'fixa'})}<p class="chart-footnote">${plural(m.n-m.entradaAvaliada,'registro sem checklist completo fica','registros sem checklist completo ficam')} fora desta distribuição. A admissão é a razão entre “Entra” e todos os checklists completos.</p><div class="gx-card-foot">${dados('Resultado do checklist',['Resultado',{label:'Registros',align:'r'}],chk.map(c=>[c.label,c.value]))}</div></div>
      </div>
      <div class="analytics-grid analytics-equal gx-row">
        <div class="card gx-card">${chartHead('Origem das iniciativas','Quantidade por origem do cadastro.','estrela')}${hbars(m.origens,m.n,{key:'origem'})}<div class="gx-card-foot">${dados('Origem das iniciativas',colsQ('Origem'),linhas(m.origens))}</div></div>
        <div class="card gx-card">${chartHead('Tipos de iniciativa','Composição do recorte por tipo.','etiqueta')}${hbars(m.tipos,m.n,{key:'tipo'})}<div class="gx-card-foot">${dados('Tipos de iniciativa',colsQ('Tipo'),linhas(m.tipos))}</div></div>
      </div>`;
  }
  function custos(m){
    const c=m.capacidade,cap=GP.state().capacidade,custosGer=m.gerencias.map(g=>({...g,value:sum(m.lista.filter(p=>(p.gerencia||'')===g.key&&p.custo!=null),p=>p.custo)}));
    const ratio=c.efetiva?m.fteExecucao/c.efetiva:null,acima=ratio!=null&&ratio>1;
    const sim=['cabe','fixado','fixado_estoura','nao_cabe','excluido','sem_estimativa'].map(k=>({key:null,label:M.STATUS_CARTEIRA[k].nome,value:c.itens.filter(it=>it.status===k).length,color:{cabe:'#6b8f2a',fixado:'#00908f',fixado_estoura:'#b8642c',nao_cabe:'#d5a32d',excluido:'#a3b2ac',sem_estimativa:'#a3b2ac'}[k]})).filter(x=>x.value);
    return `<div class="metric-grid gx-kpis scroll-fade">
      ${metric({label:'Custo estimado total',valor:m.comCusto?fmt.mi(m.custo):'-',sub:`${m.comCusto} de ${plural(m.n,'registro','registros')} com estimativa`,icone:'moeda'})}
      ${metric({label:'FTE em execução',valor:fmt.n(m.fteExecucao,1),sub:`${m.comFteExecucao} de ${fmt.n(m.execucao)} com FTE informado`,icone:'pessoas',tom:'#188787'})}
      ${metric({label:'Capacidade efetiva',valor:fmt.n(c.efetiva,1),sub:`${fmt.n(cap.fte,1)} FTE menos ${cap.reservaPct}% de reserva`,icone:'carteira',tom:'#477b91'})}
      ${metric({label:'Uso da capacidade',valor:fmt.pct(ratio),sub:acima?'<b class="gx-cobre">Acima da capacidade efetiva</b>':'FTE em execução / capacidade efetiva',icone:'medidor',tom:acima?COBRE:UNICA,tint:acima?'#fbeee6':'#f1f6ea',ratio:ratio==null?null:Math.min(1,ratio)})}
      ${metric({label:'Novos inícios que cabem',valor:fmt.n(c.cabem),sub:`${plural(c.candidatos,'candidato aprovado e avaliado','candidatos aprovados e avaliados')}`,icone:'novo'})}
      ${metric({label:'Avanço em execução',valor:m.progresso==null?'-':fmt.n(m.progresso)+'%',sub:`${m.comProgresso} de ${fmt.n(m.execucao)} com avanço informado`,icone:'pulso',ratio:m.progresso==null?null:m.progresso/100})}
    </div>${U.callout(`<p><b>Simulação de capacidade:</b> período ${esc(cap.periodo)}. ${GP.state().meta.capacidadeConfirmada?'Parâmetros ajustados pelo usuário.':'Os valores iniciais são sugestões e precisam de validação.'} A capacidade é global; a simulação considera somente o recorte dos filtros. <a class="link" href="#/carteira">Ajustar capacidade</a>.</p>`)}
    <div class="analytics-grid analytics-equal gx-row"><div class="card gx-card">${chartHead('Custo estimado por gerência','Soma dos valores informados. Não representa gasto realizado.','moeda')}${hbars(custosGer,m.custo,{monetario:true})}<p class="chart-footnote">${plural(m.n-m.comCusto,'registro sem custo fica','registros sem custo ficam')} fora da soma. Custos de registros em todas as etapas entram na análise.</p><div class="gx-card-foot">${dados('Custo estimado por gerência',['Gerência',{label:'Custo (R$)',align:'r'}],custosGer.map(g=>[g.label,fmt.brl(g.value)]))}</div></div>
    <div class="card gx-card">${chartHead('Simulação de novos inícios','Aprovados com avaliação completa, pelos critérios e pela capacidade atuais.','ranking')}${sim.length?hbars(sim,c.candidatos,{ordem:'fixa'}):'<div class="info-empty">Nenhum candidato aprovado e avaliado neste recorte.</div>'}<p class="chart-footnote">${plural(c.semNota.length,'aprovado sem avaliação completa não participa','aprovados sem avaliação completa não participam')} da simulação. Orçamento de novos projetos: ${cap.orcamento?fmt.mi(cap.orcamento):'sem limite'}.</p><div class="gx-card-foot">${dados('Simulação de novos inícios',['Situação',{label:'Candidatos',align:'r'}],sim.map(s=>[s.label,s.value]))}</div></div></div>`;
  }
  function qualidade(m){
    const q=m.qualidade,comBase=q.filter(x=>x.den),media=comBase.length?sum(comBase,x=>x.num/x.den)/comBase.length:null;
    const pior=comBase.slice().sort((a,b)=>a.num/a.den-b.num/b.den)[0],pend=sum(itensAtencao(m),x=>x.n);
    return `<div class="metric-grid gx-kpis gx-kpis-3 scroll-fade">
      ${metric({label:'Cobertura média',valor:fmt.pct(media),sub:`Média de ${plural(comBase.length,'medida','medidas')} com base no recorte`,icone:'escudo',ratio:media})}
      ${metric({label:'Campo menos preenchido',valor:pior?fmt.pct(pior.num/pior.den):'-',sub:pior?`${esc(pior.label)} · ${pior.num} de ${pior.den}`:'Sem base no recorte',icone:'alerta',tom:pior&&pior.num/pior.den<.6?COBRE:UNICA,tint:pior&&pior.num/pior.den<.6?'#fbeee6':'#f1f6ea'})}
      ${metric({label:'Itens pendentes',valor:fmt.n(pend),sub:'Somados nas pendências para revisão',icone:'relogio',tom:'#477b91',tint:'#ecf2f6'})}
    </div>
      <div class="analytics-grid analytics-equal gx-row"><div class="card gx-card">${chartHead('Cobertura dos campos e avaliações','Percentual de registros com a informação. A base de cada medida varia.','escudo')}${hbars(q.map(x=>({label:x.label,num:x.num,den:x.den,desc:x.desc,color:UNICA})),100,{modoPct:true,ordem:'fixa'})}<p class="chart-footnote">Passe o mouse sobre uma linha para ver a base da medida. Quando a base é vazia, a linha mostra “-”.</p><div class="gx-card-foot">${dados('Cobertura dos campos',['Medida',{label:'Com informação',align:'r'},{label:'Base',align:'r'},{label:'%',align:'r'}],q.map(x=>[x.label,x.num,x.den,x.den?fmt.pct(x.num/x.den):'-']))}</div></div>
      <div class="card gx-card">${chartHead('Pendências para revisão','Registros do recorte que precisam de acompanhamento.','alerta')}${atencoes(m,6)}<p class="chart-footnote">A qualidade mede preenchimento e conclusão das avaliações. Não valida o conteúdo técnico informado.</p></div></div>`;
  }
  function indicadores(el){
    const f=filtros(),todos=P.todos(),lista=filtrar(todos,f),m=medir(lista,f),nivel=GP.nivel(),riscos=nivel>=2&&GP.riscos&&GP.riscos.painel;
    let aba=GP.state().ui.abaIndicadores||'visao';if((aba==='custos'&&nivel<3)||(aba==='riscos'&&!riscos))aba='visao';
    const abas=[['visao','Visão geral'],['qualidade','Qualidade'],...(nivel>=3?[['custos','Custos']]:[]),...(riscos?[['riscos','Riscos']]:[])];
    const abasHtml=`<div class="analysis-tabs gx-tabs scroll-fade" role="tablist" aria-label="Seções dos indicadores">${abas.map(([k,l])=>`<button role="tab" aria-selected="${k===aba}" class="${k===aba?'on':''}" data-analysis-tab="${k}">${l}</button>`).join('')}</div>`;
    let html=`<div class="gx-ind">`+U.pageHead({titulo:'Indicadores',acoes:`<button class="btn btn-ghost" data-dicionario>${icon('info',15)} Regras</button><button class="btn btn-ghost" data-exportar-recorte>${icon('download',15)} Exportar recorte</button>${GP.botaoPDF()}`})+barraFiltros(f,{abas:abasHtml});
    if(f.de&&f.ate&&f.de>f.ate){el.innerHTML=html+U.callout('<p>A data inicial do período deve ser anterior ou igual à data final. Ajuste os filtros para calcular os indicadores.</p>','warn')+'</div>';bindFilters(el);return;}
    html+=`<div class="scope-line gx-scope"><span><b>${fmt.n(m.n)}</b> de ${plural(todos.length,'registro','registros')} · ${esc(descricaoFiltros(f))}</span>${m.exemplos?`<span class="gx-scope-ex">${m.exemplos===m.n?'Todos são exemplos fictícios':`${m.exemplos} exemplos fictícios incluídos`} · <button class="link" data-so-reais>Mostrar apenas reais</button></span>`:''}</div>`;
    if(aba==='custos')html+=custos(m);
    else if(aba==='qualidade')html+=qualidade(m);
    else if(aba==='riscos')html+=GP.riscos.painel(lista);
    else html+=visaoGeral(m,lista);
    html+=tabela(lista,f)+'</div>';el.innerHTML=html;bindFilters(el);desenharEntradas(el);
  }
  function bindFilters(el){
    el.querySelectorAll('[data-af]').forEach(i=>i.addEventListener(i.tagName==='INPUT'&&i.type!=='date'?'input':'change',()=>{
      const f=filtros();f[i.dataset.af]=i.value;GP.save();const pos=i.selectionStart,key=i.dataset.af;
      clearTimeout(bindFilters.timer);bindFilters.timer=setTimeout(()=>{GP.refresh();const n=document.querySelector(`[data-af="${key}"]`);if(n&&key==='q'){n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}}},key==='q'?230:0);
    }));
  }
  const DICIONARIO=[
    ['Projetos e demandas','Quantidade conforme a natureza informada no cadastro. Registros antigos recebem Projeto até que o usuário altere a classificação.'],
    ['Percentual por etapa, gerência ou natureza','Quantidade na categoria dividida pelo total de registros do recorte. Inclui todas as etapas, inclusive concluídos, recusados e cancelados.'],
    ['Fila de entrada','Registros nas etapas Nova demanda ou Em triagem. A etapa é independente da natureza Projeto/Demanda.'],
    ['Variação em 30 dias','Registros: entradas com data nos últimos 30 dias. Fila: tamanho atual da fila menos o tamanho de 30 dias atrás, reconstruído pela data de entrada e pelas mudanças de etapa do histórico. Cobre indica direção ruim.'],
    ['Admissão na entrada','Checklists com resultado Entra divididos pelos checklists completos (Entra, Falta informação ou Não entra). Sem checklist fica fora da base. É uma fotografia do último checklist.'],
    ['Conclusão da carteira','Concluídos divididos por Aprovados, Em execução, Em espera e Concluídos. Recusados, cancelados e fila de entrada ficam fora da base.'],
    ['Prazos vencidos','Aprovados, Em execução ou Em espera com fim previsto anterior à data atual. Representa a data prevista vencida, sem inferir motivo ou desempenho.'],
    ['Avanço em execução','Média simples do avanço físico informado para os registros Em execução. Os itens sem percentual ficam fora da média. Concluído aparece com 100% na ficha.'],
    ['Custo estimado','Soma dos custos informados dos registros do recorte, em todas as etapas. Valor zero é uma estimativa informada. Valor em branco não entra na soma. Não representa gasto realizado.'],
    ['Capacidade e novos inícios','Usa os parâmetros da página Carteira e capacidade e o modelo de priorização existente. Os valores iniciais são sugestões. A simulação do recorte compara com a capacidade global.'],
    ['Entradas por período','Agrupa a Data de entrada por mês, trimestre ou ano, conforme a extensão do período. Não mede entregas nem alterações de etapa.'],
    ['Qualidade dos dados','Cobertura de preenchimento por base aplicável: responsáveis e datas nos aceitos abertos, avanço em execução, priorização nas etapas elegíveis e demais campos em todos os registros.'],
    ['Filtros e exemplos','Os filtros são combinados e valem para cartões, gráficos, tabela e exportação do recorte. Exemplos fictícios ficam identificados e podem ser excluídos dos indicadores.']
  ];
  function dicionario(){GP.modal(`<h3>Regras dos indicadores</h3><p class="muted">Todas as medidas usam os dados cadastrados no sistema. Uma base vazia exibe “-”, sem presumir 0%.</p><table class="dictionary"><thead><tr><th>Indicador</th><th>Regra de cálculo</th></tr></thead><tbody>${DICIONARIO.map(([a,b])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table><div class="m-act"><button class="btn btn-primary" data-close="1">Fechar</button></div>`,{largo:true});}
  function salvarHtml(){
    GP.state().meta.ultimaCopiaHtmlEm=new Date().toISOString();GP.save();
    const doc=document.documentElement.cloneNode(true),app=doc.querySelector('#app');app.innerHTML='';
    doc.querySelectorAll('.modal-bg,.toast,.busy,.tip,.side-backdrop,#gp-snapshot,.gx-pop,.gx-tt,.gp-tt').forEach(x=>x.remove());
    const seed=document.createElement('script');seed.id='gp-snapshot';seed.type='application/json';seed.textContent=JSON.stringify(GP.state()).replace(/</g,'\\u003c');
    const boot=[...doc.querySelectorAll('script')].find(x=>x.textContent.trim()==='GP.start();');boot.before(seed);
    GP.exportar.baixar(`portfolio-feg-atualizado-${hoje()}.html`,'<!doctype html>\n'+doc.outerHTML,'text/html;charset=utf-8');
    GP.toast('HTML atualizado gerado com a carteira, os históricos e as configurações desta sessão.');
  }
  GP.salvarHtml=salvarHtml;
  function csvIndicadores(m){
    const rows=[['Indicador','Valor','Base / regra'],['Data da exportação',new Date().toLocaleString('pt-BR'),'Fotografia da sessão'],['Filtros',descricaoFiltros(filtros()),'Aplicados a todos os indicadores'],
      ['Registros',m.n,'Todos os registros do recorte'],['Projetos',m.projetos,'Natureza Projeto'],['Demandas',m.demandas,'Natureza Demanda'],['Exemplos fictícios',m.exemplos,'Incluídos no recorte'],
      ['Fila de entrada',m.fila,'Nova demanda e Em triagem'],['Em execução',m.execucao,'Etapa Em execução'],['Admissão na entrada (%)',m.taxaEntrada==null?'':(m.taxaEntrada*100).toFixed(2).replace('.',','),`${m.entram} / ${m.entradaAvaliada} checklists completos`],
      ['Conclusão da carteira (%)',m.taxaConclusao==null?'':(m.taxaConclusao*100).toFixed(2).replace('.',','),`${m.concluidos} / ${m.carteira} registros aceitos`],
      ['Prazos vencidos',m.atrasados.length,'Aceitos abertos com fim anterior a hoje'],['Custo estimado (R$)',m.comCusto?String(m.custo).replace('.',','):'',`${m.comCusto} registros com estimativa`],
      ['Avanço médio em execução (%)',m.progresso==null?'':m.progresso.toFixed(2).replace('.',','),`${m.comProgresso} de ${m.execucao} com avanço`],
      ['Variação de registros em 30 dias',m.tendencia.novos,'Entradas nos últimos 30 dias'],['Variação da fila em 30 dias',m.tendencia.fila,'Fila atual menos a de 30 dias atrás'],
      ...m.etapas.map(x=>['Etapa: '+x.label,x.value,m.n+' registros']),...m.gerencias.map(x=>['Gerência: '+x.label,x.value,m.n+' registros']),
      ...m.serie.pontos.map(x=>['Entradas: '+x.label,x.total,x.projetos+' projetos / '+x.demandas+' demandas'])];
    GP.exportar.baixar('indicadores-feg-'+hoje()+'.csv',GP.exportar.csv(rows),'text/csv;charset=utf-8');GP.toast('Indicadores do recorte exportados.');
  }
  GP.exportarIndicadores=()=>csvIndicadores(medir(filtrar(P.todos(),filtros()),filtros()));

  /* ------------------------------------------------ relatórios */
  function relatorios(el){
    const f=filtros(),m=medir(filtrar(P.todos(),f),f);
    el.innerHTML=`<div class="gx-rel">`+U.pageHead({titulo:'Relatórios',sub:'Gere apresentações executivas com os dados atuais e baixe a base do recorte para análise.'})+barraFiltros(f)+
      `<div class="scope-line gx-scope"><span><b>${fmt.n(m.n)}</b> ${m.n===1?'registro':'registros'} nos relatórios · ${esc(descricaoFiltros(f))}</span>${m.exemplos?`<span class="gx-scope-ex">${m.exemplos===m.n?'Todos são exemplos fictícios':`${m.exemplos} exemplos fictícios incluídos`} · <button class="link" data-so-reais-rel>Mostrar apenas reais</button></span>`:`<span>${fmt.data(hoje())}</span>`}</div>
      <div class="report-grid"><div class="report-card"><div class="report-cover"><small>PowerPoint executivo / 6 slides</small><h2>Visão executiva<br>do portfólio</h2><p>Composição, fluxo de entrada e situação da carteira.</p></div><div class="report-body"><ol><li>Visão geral e base da análise</li><li>Composição por gerência e natureza</li><li>Distribuição dos projetos por etapa</li><li>Entrada de projetos e demandas por período</li><li>Avanço, estimativas e prazos previstos</li><li>Pendências para acompanhamento executivo</li></ol><button class="btn btn-primary" data-ppt="visao">${icon('download',16)} Baixar PPT da visão executiva</button></div></div>
      <div class="report-card"><div class="report-cover gold"><small>PowerPoint executivo / 6 slides</small><h2>Priorização e decisões<br>da carteira</h2><p>Ranking, capacidade simulada e pauta do comitê.</p></div><div class="report-body"><ol><li>Base elegível e contexto da decisão</li><li>Prioridade dos projetos aprovados</li><li>Distribuição por valor e esforço</li><li>Capacidade e novos inícios simulados</li><li>Projetos que exigem decisão</li><li>Pauta sugerida para o comitê</li></ol><button class="btn btn-primary" data-ppt="decisao">${icon('download',16)} Baixar PPT de prioridades e decisões</button></div></div></div>
      <p class="report-note">Os PPTs usam o recorte acima e os critérios do modelo sob curadoria da FEG. Textos e gráficos são editáveis. Estimativas e simulações ficam identificadas. As decisões permanecem com as instâncias de governança e exemplos fictícios recebem sinalização.</p>
      <div class="gx-rel-base"><div class="card gx-rel-card">${U.secH('Base do recorte','Cadastros e indicadores para abrir no Excel.')}<div class="row"><button class="btn btn-ghost" data-exportar-recorte>${icon('download',16)} Projetos e demandas (CSV)</button><button class="btn btn-ghost" data-exportar-indicadores>${icon('download',16)} Indicadores (CSV)</button></div></div>
      <a class="card gx-rel-link" href="#/config"><span class="gx-rel-ic">${ico('escudo',20)}</span><span><b>Backup e cópia do sistema</b><small>Backup completo e HTML com os dados atuais ficam em Dados e configurações.</small></span>${icon('seta',16)}</a></div></div>`;
    bindFilters(el);
    if(f.de&&f.ate&&f.de>f.ate){el.querySelectorAll('[data-ppt],[data-exportar-recorte],[data-exportar-indicadores]').forEach(b=>b.disabled=true);el.querySelector('.gx-rel').insertAdjacentHTML('beforeend',U.callout('<p>Ajuste o período: a data inicial deve ser anterior ou igual à data final.</p>','warn'));}
  }

  /* ------------------------------------------------ continuidade (cartão em Dados e configurações) */
  GP.continuidade=()=>{
    const st=GP.storage,meta=GP.state().meta,n=Object.keys(GP.state().ui.rascunhos||{}).length;
    return `<div class="data-status ${!st.ok?'error':''}">${icon(st.ok?'check':'alerta',17)}<b>${st.conflito?'Outra aba atualizou a carteira':st.ok?'Salvamento automático ativo':'O salvamento no navegador está indisponível'}</b></div>
      <p class="muted gx-cfg-p">Último salvamento: ${fmt.dataHora(st.salvoEm)}${n?` · ${plural(n,'rascunho de cadastro','rascunhos de cadastro')}`:''}. ${meta.ultimaCopiaHtmlEm?`Última cópia do HTML: ${fmt.dataHora(meta.ultimaCopiaHtmlEm)}.`:'Nenhuma cópia baixada ainda.'}</p>
      ${st.conflito?'<button class="btn btn-ghost" data-load-latest>Carregar a versão da outra aba</button>':''}
      ${GP.snapshotDisponivel?'<button class="btn btn-ghost" data-load-snapshot>Carregar os dados contidos neste HTML</button>':''}`;
  };
  GP.tela({id:'painel',nivel:1,ordem:0.1,gerencial:true,titulo:'Painel do portfólio',icone:'painel',render:resumo});
  GP.tela({id:'indicadores',nivel:1,ordem:0.2,gerencial:true,titulo:'Indicadores',icone:'ranking',render:indicadores});
  GP.tela({id:'relatorios',nivel:1,ordem:0.3,gerencial:true,titulo:'Relatórios',icone:'download',render:relatorios});
  // O evento original continua sendo a fonte única do download do backup.
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-save-now]')){const ok=GP.save();GP.toast(ok?'Trabalho salvo neste navegador.':'Não foi possível salvar no navegador. Baixe uma cópia para preservar as alterações.');GP.refresh();return;}
    const en=e.target.closest('[data-gx-entrada]');if(en){if(typeof GP.abrirEntrada==='function')GP.abrirEntrada(en.dataset.gxEntrada);else GP.go('#/projeto/'+en.dataset.gxEntrada);return;}
    const mn=e.target.closest('.gx-menu-pop [role=menuitem]');if(mn){const d=mn.closest('details');if(d)d.open=false;}
    document.querySelectorAll('details.gx-menu[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;});
    const b=e.target.closest('[data-analytics-filter]');if(b){const f=filtros(),k=b.dataset.analyticsFilter,aqui=location.hash.startsWith('#/indicadores');if(aqui)f[k]=b.dataset.value;else Object.assign(f,DEF,{[k]:b.dataset.value});GP.save();if(aqui)GP.refresh();else GP.go('#/indicadores');return;}
    if(e.target.closest('[data-so-reais]')){Object.assign(filtros(),DEF,{fonte:'reais'});GP.save();GP.go('#/indicadores');return;}
    if(e.target.closest('[data-so-reais-rel]')){filtros().fonte='reais';GP.save();GP.refresh();return;}
    if(e.target.closest('[data-limpar-analise]')){GP.state().ui.filtroIndicadores={...DEF};GP.save();GP.refresh();return;}
    const tab=e.target.closest('[data-analysis-tab]');if(tab){GP.state().ui.abaIndicadores=tab.dataset.analysisTab;GP.save();GP.refresh();const n=document.querySelector(`[data-analysis-tab="${tab.dataset.analysisTab}"]`);if(n)n.focus();return;}
    if(e.target.closest('[data-dicionario]')){dicionario();return;}
    if(e.target.closest('[data-exportar-recorte]')){P.todos().length?GP.exportar.exportarProjetos(filtrar(P.todos(),filtros())):GP.exportar.exportarProjetos([]);return;}
    if(e.target.closest('[data-exportar-indicadores]')){GP.exportarIndicadores();return;}
    if(e.target.closest('[data-html-atualizado]')){salvarHtml();return;}
    if(e.target.closest('[data-load-latest]')){GP.confirmar('Carregar versão mais recente?','<p>As alterações apenas desta sessão serão substituídas pela carteira salva pela outra aba. Baixe o HTML ou um backup desta sessão para guardar essas alterações antes de continuar.</p>','Carregar versão',()=>GP.loadLatest());return;}
    if(e.target.closest('[data-load-snapshot]')&&GP.snapshot){GP.confirmar('Carregar carteira deste HTML?',`<p>Este arquivo contém ${plural(GP.snapshot.projetos.length,'registro','registros')}. Eles substituirão a carteira exibida. Guarde um backup se desejar manter os dados atuais.</p>`,'Carregar arquivo',()=>{GP.resetState(clone(GP.snapshot));GP.snapshotDisponivel=false;GP.refresh();GP.toast('Carteira do arquivo carregada.');});return;}
    if(e.target.closest('[data-recuperar-anterior]')){
      let ant;try{ant=JSON.parse(localStorage.getItem(GP.storageKey+'-anterior'));}catch(x){}
      if(!ant?.v||!Array.isArray(ant.projetos)){GP.toast('Não há uma cópia anterior disponível neste navegador.');return;}
      GP.confirmar('Recuperar cópia anterior?',`<p>A cópia de ${fmt.dataHora(ant.meta?.salvoEm)} tem ${plural(ant.projetos.length,'registro','registros')} e substituirá a carteira atual. Baixe um backup antes de continuar se desejar preservar o estado atual.</p>`,'Recuperar',()=>{GP.resetState(M.migrar(ant));GP.refresh();GP.toast('Cópia anterior recuperada.');});return;
    }
  });
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest?.('[data-analytics-filter]'))e.target.closest('[data-analytics-filter]').click();});
})();

(function(){
  'use strict';
  const GP=window.GP,M=GP.modelo,A=GP.analytics,{fmt,esc,hoje,sum}=GP.util;
  const C='http://schemas.openxmlformats.org/drawingml/2006/chart',NS='http://schemas.openxmlformats.org/drawingml/2006/main';
  const trunc=(s,n=90)=>String(s||'').length>n?String(s).slice(0,n-1)+'…':String(s||'');
  const percentage=v=>v==null?'Não informado':fmt.pct(v);
  const scope=f=>[f.gerencia,f.natureza?f.natureza==='demanda'?'Demandas':'Projetos':'',f.etapa?M.etapa(f.etapa).nome:'',f.tipo,f.origem,
    f.de||f.ate?'Entrada: '+(f.de?fmt.data(f.de):'sem início')+' a '+(f.ate?fmt.data(f.ate):'sem fim'):'',f.fonte==='reais'?'Somente reais':f.fonte==='exemplos'?'Somente exemplos':'',f.q?'Busca: '+f.q:''].filter(Boolean).join(' / ')||'Todos os registros cadastrados';
  function conteudo(lista,f){
    const m=A.medir(lista,f),c=m.capacidade,cap=GP.state().capacidade,rank=M.ranking(lista.filter(p=>p.etapa==='aprovado')).slice(0,5),av=lista.filter(p=>M.ETAPAS_PRIORIZAVEIS.includes(p.etapa)&&M.pontuar(p).completo);
    const vals={FOOTER:'Projeto Maestro / Governança FEG / '+fmt.data(hoje())+(m.exemplos?' / '+m.exemplos+' exemplos fictícios incluídos':''),SCOPE:trunc(scope(f),225),TOTAL:fmt.n(m.n),EXEC:fmt.n(m.execucao),ENTRY_RATE:percentage(m.taxaEntrada),
      DISCLOSURE:(m.exemplos?`${m.exemplos} de ${m.n} registros são exemplos fictícios. `:'')+`Fotografia do portfólio em ${fmt.dataHora(new Date().toISOString())}. A FEG mantém o modelo e a visão consolidada; responsáveis e instâncias de governança validam conteúdo e decisões.`,
      COMPOSITION_NOTE:`${m.projetos} projetos e ${m.demandas} demandas no recorte. A natureza é informada no cadastro e independe da etapa. Cadastros antigos recebem Projeto até sua revisão.`,
      STAGE_NOTE:`${m.fila} na fila de entrada. ${m.execucao} em execução. ${m.concluidos} concluídos. O gráfico inclui recusados e cancelados. Percentuais têm como base ${m.n} registros.`,
      PERIOD_NOTE:`Data de entrada do cadastro. Agrupamento por ${m.serie.passo===1?'mês':m.serie.passo===3?'trimestre':'ano'}. ${m.serie.semData?m.serie.semData+' registros sem data ficam fora do gráfico.':'Entradas representam novos cadastros, sem medir avanço entre etapas.'}`,
      PROGRESS:m.progresso==null?'Não informado':fmt.n(m.progresso)+'%',COST:m.comCusto?fmt.mi(m.custo):'Não informado',LATE:fmt.n(m.atrasados.length),
      EXECUTION_NOTE:`Avanço médio: ${m.comProgresso} de ${m.execucao} registros em execução têm percentual informado. A média simples considera apenas esses registros.`,
      COST_NOTE:`Custo estimado: ${m.comCusto} de ${m.n} registros têm estimativa. A soma inclui todas as etapas e não representa gasto realizado.`,
      LATE_NOTE:`Prazo vencido: fim previsto anterior à data atual nos registros aprovados, em execução ou em espera. ${m.atrasados.length?'Registros: '+trunc(m.atrasados.map(p=>p.codigo).join(', '),165)+'.':'Nenhum registro atende a essa condição.'}`,
      ACTION_NOTE:'Pendências geradas pelas regras do modelo. Os responsáveis confirmam causas e ações; a FEG acompanha a qualidade e a consistência do portfólio.',
      APPROVED:fmt.n(m.aprovados),RANKED:fmt.n(lista.filter(p=>p.etapa==='aprovado'&&M.pontuar(p).completo).length),FIT:fmt.n(c.cabem),
      RANK_NOTE:`Top ${rank.length} aprovados com avaliação completa. Ordenação: obrigatórios primeiro, valor decrescente e esforço como desempate. ${c.semNota.length} aprovados sem avaliação completa ficam fora.`,
      QUADRANT_NOTE:`Base: ${av.length} registros elegíveis e avaliados. Cortes: valor ${M.CORTE.valor} e esforço ${M.CORTE.esforco}. Complementar: baixo valor e baixo esforço. Repensar: baixo valor e alto esforço.`,
      SELECTED_COST:fmt.mi(c.usadoCusto),CAPACITY_NOTE:`${fmt.n(cap.fte,1)} FTE configurados, ${fmt.n(cap.reservaPct)}% de reserva. Período ${cap.periodo}. Orçamento de novos inícios: ${cap.orcamento?fmt.mi(cap.orcamento):'sem limite'}.`,
      SIMULATION_NOTE:`Simulação do recorte contra a capacidade global. ${GP.state().meta.capacidadeConfirmada?'Parâmetros ajustados pelo usuário.':'Valores iniciais sugeridos, sujeitos à validação.'} ${cap.descontarExecucao?'Desconta os FTE em execução.':'Não desconta os FTE em execução.'} ${c.excesso>0?'A execução já excede a capacidade efetiva em '+fmt.n(c.excesso,1)+' FTE.':''}`,
      DECISION_NOTE:'O modelo indica a situação dos candidatos. A decisão de início ou postergação depende da validação do comitê.',
      AGENDA_NOTE:'Pauta baseada no cadastro atual. Registre as decisões na carteira e atualize as fichas para o próximo acompanhamento.'};
    const semResp=lista.filter(p=>['aprovado','execucao','espera'].includes(p.etapa)&&!p.responsavel).length;
    const semDatas=lista.filter(p=>['aprovado','execucao','espera'].includes(p.etapa)&&!(p.inicioPrevisto&&p.fimPrevisto)).length;
    const actions=[
      `${m.fila} registros na fila de entrada. Concluir o checklist e registrar a decisão para cada demanda.`,
      `${m.atrasados.length} registros com prazo previsto vencido. Revisar as datas e a situação com os responsáveis.`,
      `${semResp} registros aceitos abertos sem responsável. Definir quem acompanha cada entrega.`,
      `${c.semNota.length} aprovados sem avaliação completa. Concluir as perguntas de valor e esforço antes da priorização.`,
      `${semDatas} registros aceitos abertos sem as duas datas previstas. Atualizar o período de planejamento.`];
    actions.forEach((v,i)=>vals['ACTION_'+(i+1)]=v);
    for(let i=0;i<5;i++){
      vals['RANK_TITLE_'+(i+1)]=rank[i]?`${i+1}. ${rank[i].p.codigo} / ${trunc(rank[i].p.titulo,43)}`:i===0?'Nenhum aprovado com avaliação completa no recorte.':'';
      vals['RANK_SCORE_'+(i+1)]=rank[i]?`Valor ${fmt.n(rank[i].s.valor)} / esforço ${fmt.n(rank[i].s.esforco)}${rank[i].p.obrigatorio?' / obrigatório':''}`:'';
    }
    const pend=c.itens.filter(i=>['nao_cabe','fixado_estoura','sem_estimativa'].includes(i.status));
    for(let i=0;i<5;i++)vals['DECISION_'+(i+1)]=pend[i]?`${pend[i].p.codigo} / ${trunc(pend[i].p.titulo,92)}\n${M.STATUS_CARTEIRA[pend[i].status].nome}${pend[i].falta?' / falta '+(pend[i].falta.tipo==='FTE'?fmt.n(pend[i].falta.valor,1)+' FTE':fmt.brl(pend[i].falta.valor)):''}`:i===0?'Nenhum candidato exige ajuste por capacidade segundo os dados disponíveis.':'';
    if(pend.length>5)vals.DECISION_NOTE=`Primeiros 5 de ${pend.length} candidatos com restrição, na ordem do ranking. Consulte a carteira para a lista completa.`;
    const agendas=[
      `Validar os parâmetros do período ${cap.periodo}: ${fmt.n(c.efetiva,1)} FTE efetivos e orçamento ${cap.orcamento?fmt.mi(cap.orcamento):'sem limite'}.`,
      `Deliberar sobre ${c.cabem} novos inícios simulados, com ${fmt.n(c.usadoFte,1)} FTE e ${fmt.mi(c.usadoCusto)} de custo estimado.`,
      `Revisar ${pend.length} candidatos com restrição ou estimativa de FTE ausente e ${c.semNota.length} aprovados sem nota completa.`,
      `Avaliar ${m.fila} registros na entrada e ${m.espera} em espera. Atualizar motivos e critérios para a continuidade.`,
      `Definir responsáveis e próximas datas para ${m.atrasados.length} registros com prazo vencido. Registrar as decisões e atualizar a carteira.`];
    agendas.forEach((v,i)=>vals['AGENDA_'+(i+1)]=v);
    const dados={
      gerencias:{categories:['FEG','FEL','FEN','FER','Não informada'],series:[{name:'Registros',values:['FEG','FEL','FEN','FER',''].map(k=>lista.filter(p=>p.gerencia===k).length)}]},
      naturezas:{categories:['Projetos','Demandas'],series:[{name:'Registros',values:[m.projetos,m.demandas]}]},
      etapas:{categories:['Nova demanda','Em triagem','Aprovado','Em execução','Em espera','Concluído','Não entra','Cancelado'],series:[{name:'Registros',values:m.etapas.map(e=>e.value)}]},
      entradas:{categories:m.serie.pontos.map(p=>p.label),series:[{name:'Projetos',values:m.serie.pontos.map(p=>p.projetos)},{name:'Demandas',values:m.serie.pontos.map(p=>p.demandas)}]},
      ranking:{categories:rank.length?rank.map(r=>r.p.codigo):['Sem aprovados avaliados'],series:[{name:'Valor (0 a 100)',values:rank.length?rank.map(r=>+r.s.valor.toFixed(2)):[0]}]},
      quadrantes:{categories:['Ganho rápido','Estratégico','Complementar','Repensar'],series:[{name:'Avaliados',values:['rapido','estrategico','complementar','repensar'].map(k=>av.filter(p=>M.pontuar(p).quadrante===k).length)}]},
      capacidade:{categories:['Capacidade efetiva','Em execução','Novos inícios'],series:[{name:'FTE',values:[c.efetiva,m.fteExecucao,c.usadoFte]}]}};
    return {vars:vals,dados,m};
  }
  const parseXml=s=>{const d=new DOMParser().parseFromString(s,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('XML inválido na apresentação.');return d;};
  const xml=d=>new XMLSerializer().serializeToString(d);
  const node=(d,name)=>d.createElementNS(C,'c:'+name);
  function ref(d,parent,name,formula,values,numeric=false){
    let root=parent.getElementsByTagNameNS(C,name)[0];if(!root){root=node(d,name);parent.appendChild(root);}root.replaceChildren();
    const r=node(d,numeric?'numRef':'strRef'),f=node(d,'f');f.textContent=formula;r.appendChild(f);
    const cache=node(d,numeric?'numCache':'strCache');if(numeric){const fmtCode=node(d,'formatCode');fmtCode.textContent='General';cache.appendChild(fmtCode);}
    const count=node(d,'ptCount');count.setAttribute('val',String(values.length));cache.appendChild(count);
    values.forEach((v,i)=>{const pt=node(d,'pt');pt.setAttribute('idx',String(i));const vn=node(d,'v');vn.textContent=String(v);pt.appendChild(vn);cache.appendChild(pt);});r.appendChild(cache);root.appendChild(r);
  }
  const colName=n=>{let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
  async function workbook(data){
    const z=new JSZip(),n=data.categories.length,cols=data.series.length+1,cell=(c,r,v,num=false)=>num?`<c r="${c}${r}"><v>${Number.isFinite(+v)?+v:0}</v></c>`:`<c r="${c}${r}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    let rows=`<row r="1">${cell('A',1,'Categoria')}${data.series.map((s,i)=>cell(colName(i+2),1,s.name)).join('')}</row>`;
    data.categories.forEach((v,i)=>{rows+=`<row r="${i+2}">${cell('A',i+2,v)}${data.series.map((s,j)=>cell(colName(j+2),i+2,s.values[i]??0,true)).join('')}</row>`;});
    const h='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    z.file('[Content_Types].xml',h+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    z.file('_rels/.rels',h+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    z.file('xl/workbook.xml',h+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>');
    z.file('xl/_rels/workbook.xml.rels',h+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    z.file('xl/worksheets/sheet1.xml',h+`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${colName(cols)}${n+1}"/><sheetData>${rows}</sheetData></worksheet>`);
    return z.generateAsync({type:'uint8array',compression:'DEFLATE'});
  }
  function resolvePart(base,target){const parts=(base.slice(0,base.lastIndexOf('/')+1)+target).split('/'),out=[];parts.forEach(p=>{if(p==='..')out.pop();else if(p&&p!=='.')out.push(p);});return out.join('/');}
  async function patchChart(zip,path,data){
    const d=parseXml(await zip.file(path).async('string')),sers=[...d.getElementsByTagNameNS(C,'ser')];
    if(sers.length!==data.series.length)throw new Error('Quantidade de séries incompatível.');
    const last=data.categories.length+1;
    sers.forEach((ser,i)=>{const col=colName(i+2);ref(d,ser,'tx',`'Sheet1'!$${col}$1`,[data.series[i].name]);ref(d,ser,'cat',`'Sheet1'!$A$2:$A$${last}`,data.categories);ref(d,ser,'val',`'Sheet1'!$${col}$2:$${col}$${last}`,data.series[i].values,true);});
    const valueAxis=d.getElementsByTagNameNS(C,'valAx')[0];
    if(valueAxis){
      const form=valueAxis.getElementsByTagNameNS(C,'numFmt')[0];if(form)form.setAttribute('formatCode',data.series[0].name==='FTE'?'0.0':'0');
      if(data.series[0].name!=='FTE'){
        const scale=valueAxis.getElementsByTagNameNS(C,'scaling')[0],maxValue=data.series[0].name.includes('0 a 100')?100:Math.max(2,...data.series.flatMap(s=>s.values)),maxNum=Math.ceil(maxValue);
        let maxEl=scale.getElementsByTagNameNS(C,'max')[0];if(!maxEl){maxEl=node(d,'max');scale.insertBefore(maxEl,scale.getElementsByTagNameNS(C,'min')[0]||null);}maxEl.setAttribute('val',String(maxNum));
        let major=valueAxis.getElementsByTagNameNS(C,'majorUnit')[0];if(!major){major=node(d,'majorUnit');valueAxis.appendChild(major);}major.setAttribute('val',String(Math.max(1,Math.ceil(maxNum/5))));
      }
    }
    if(d.getElementsByTagNameNS(C,'barDir')[0]?.getAttribute('val')==='bar'){
      const orientation=d.getElementsByTagNameNS(C,'catAx')[0]?.getElementsByTagNameNS(C,'orientation')[0];if(orientation)orientation.setAttribute('val','maxMin');
    }
    zip.file(path,xml(d));
    const relPath=path.replace(/([^/]+)$/,'_rels/$1.rels'),rf=zip.file(relPath);if(!rf)throw new Error('Planilha do gráfico indisponível.');
    const rel=parseXml(await rf.async('string')),r=[...rel.getElementsByTagName('Relationship')].find(x=>/\/package$/.test(x.getAttribute('Type')||''));
    if(!r)throw new Error('Vínculo com a planilha do gráfico ausente.');
    const wbpath=resolvePart(path,r.getAttribute('Target'));zip.file(wbpath,await workbook(data));
  }
  let gerando=false;
  async function exportarPpt(tipo){
    if(gerando)return;
    const template=window.GP_PPT_TEMPLATES?.[tipo];
    if(!template||!window.JSZip){GP.toast('O modelo de apresentação não está disponível nesta cópia do HTML.');return;}
    const f=A.filtros();if(f.de&&f.ate&&f.de>f.ate){GP.toast('Ajuste o período antes de exportar.');return;}
    gerando=true;GP.busy(true,'Preparando apresentação executiva…');
    try{
      const lista=A.filtrar(GP.projetos.todos(),f),{vars,dados}=conteudo(lista,f),zip=await JSZip.loadAsync(template.base64,{base64:true});
      for(const path of Object.keys(zip.files).filter(x=>/^ppt\/(slides|notesSlides)\/[^/]+\.xml$/.test(x))){
        const d=parseXml(await zip.file(path).async('string'));
        [...d.getElementsByTagNameNS(NS,'t')].forEach(t=>{t.textContent=t.textContent.replace(/\{\{([A-Z0-9_]+)\}\}/g,(_,k)=>{if(vars[k]===undefined)throw new Error('Campo do relatório ausente: '+k);return vars[k];});});
        zip.file(path,xml(d));
      }
      for(const [path,key] of Object.entries(template.charts))await patchChart(zip,path,dados[key]);
      const cp=zip.file('docProps/core.xml');if(cp){const d=parseXml(await cp.async('string'));for(const e of [...d.getElementsByTagName('*')])if(e.localName==='title')e.textContent=tipo==='visao'?'Visão executiva do portfólio FEG':'Priorização e decisões da carteira FEG';zip.file('docProps/core.xml',xml(d));}
      const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6},mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
      GP.exportar.baixar(`feg-${tipo==='visao'?'visao-executiva-portfolio':'priorizacao-decisoes'}-${hoje()}.pptx`,blob,'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      GP.toast('Apresentação gerada com os dados atuais do recorte.');
    }catch(e){console.error(e);GP.toast('Não foi possível gerar o PPT. '+esc(e.message||'Abra o HTML no Chrome ou Edge e tente novamente.'));}
    finally{gerando=false;GP.busy(false);}
  }
  GP.exportarPpt=exportarPpt;GP.conteudoPpt=conteudo;
  document.addEventListener('click',e=>{const b=e.target.closest('[data-ppt]');if(b)exportarPpt(b.dataset.ppt);});
})();

(function(){
  'use strict';
  const GP=window.GP,M=GP.modelo,P=GP.projetos,U=GP.ui,{esc,fmt,hoje,uid}=GP.util,icon=GP.icon;
  const categorias={prazo:'Prazo',capacidade:'Capacidade',orcamento:'Orçamento',dependencias:'Dependências',escopo:'Escopo',governanca:'Governança',dados:'Dados',adocao:'Adoção'};
  const estados={aberto:'Aberto',em_tratamento:'Em tratamento',mitigado:'Mitigado',encerrado:'Encerrado'};
  const niveis={baixo:{nome:'Baixo',color:'#7c9a51',tom:'ok'},moderado:{nome:'Moderado',color:'#b6a647',tom:'warn'},alto:{nome:'Alto',color:'#c39137',tom:'warn'},critico:{nome:'Crítico',color:'#ac7044',tom:'bad'}};
  const prob=['Muito baixa','Baixa','Moderada','Alta','Muito alta'],impacto=['Leve','Baixo','Moderado','Elevado','Crítico'];
  const t=(v,n=1200)=>String(v??'').slice(0,n),id=v=>t(v,60).replace(/[^\w-]/g,''),data=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'';
  const n=v=>v==null||v===''||!Number.isFinite(+v)||+v<1||+v>5?null:Math.round(+v);
  const aberto=r=>['aberto','em_tratamento'].includes(r.status);
  const nota=r=>r.probabilidade&&r.impacto?r.probabilidade*r.impacto:null;
  const nivel=r=>nota(r)==null?'':nota(r)<=4?'baixo':nota(r)<=9?'moderado':nota(r)<=16?'alto':'critico';
  function limpar(r){
    if(!r||typeof r!=='object'||!id(r.id)||typeof r.titulo!=='string')return null;
    return {id:id(r.id),codigo:id(r.codigo)||'RIS-'+id(r.id).slice(-6),titulo:t(r.titulo,140),descricao:t(r.descricao),categoria:categorias[r.categoria]?r.categoria:'governanca',projetoId:id(r.projetoId),responsavel:t(r.responsavel,120),
      probabilidade:n(r.probabilidade),impacto:n(r.impacto),prazo:data(r.prazo),status:estados[r.status]?r.status:'aberto',mitigacao:t(r.mitigacao),criadoEm:t(r.criadoEm,40),atualizadoEm:t(r.atualizadoEm,40),
      historico:Array.isArray(r.historico)?r.historico.filter(h=>h&&typeof h==='object').slice(-100).map(h=>({data:t(h.data,40),acao:t(h.acao,100),por:t(h.por,100)})):[]};
  }
  const migrar=M.migrar;
  M.migrar=function(s){const st=migrar(s),vistos=new Set();st.riscos=(Array.isArray(st.riscos)?st.riscos:[]).map(limpar).filter(r=>r&&!vistos.has(r.id)&&vistos.add(r.id));st.seqRiscos=Math.max(+st.seqRiscos||0,...st.riscos.map(r=>+r.codigo.replace(/^RIS-/, '')||0));return st;};
  const todos=()=>GP.state().riscos||(GP.state().riscos=[]);
  const get=r=>todos().find(x=>x.id===r);
  function salvar(d,riscoId){
    const existente=riscoId?get(riscoId):null;
    if(riscoId&&!existente)throw new Error('Risco não encontrado.');
    if(!String(d.titulo||'').trim())throw new Error('Informe o título do risco.');
    if(d.projetoId&&!P.get(d.projetoId))throw new Error('Selecione um projeto ou demanda existente.');
    if((d.probabilidade!==''&&d.probabilidade!=null&&!n(d.probabilidade))||(d.impacto!==''&&d.impacto!=null&&!n(d.impacto)))throw new Error('Probabilidade e impacto devem ficar entre 1 e 5.');
    if(d.prazo&&(!data(d.prazo)||d.prazo<'2000-01-01'||d.prazo>'2100-12-31'))throw new Error('Informe uma data de ação entre 2000 e 2100.');
    const stamp=new Date().toISOString(),seq=existente?null:(+GP.state().seqRiscos||0)+1;
    const r=limpar({...existente,...d,id:existente?.id||uid('risco'),codigo:existente?.codigo||'RIS-'+String(seq).padStart(3,'0'),titulo:String(d.titulo).trim(),criadoEm:existente?.criadoEm||stamp,atualizadoEm:stamp});
    r.historico=[...(existente?.historico||[]),{data:stamp,acao:existente?'Risco atualizado':'Risco cadastrado',por:GP.auth?.usuario()?.nome||'Sessão local'}].slice(-100);
    if(existente)todos()[todos().indexOf(existente)]=r;else{GP.state().seqRiscos=seq;todos().push(r);}GP.save();return r;
  }
  function medir(lista=todos()){
    const ativos=lista.filter(aberto),avaliados=ativos.filter(r=>nota(r)!=null),altos=avaliados.filter(r=>['alto','critico'].includes(nivel(r))),vencidos=ativos.filter(r=>r.prazo&&r.prazo<hoje());
    return {n:lista.length,ativos,avaliados,altos,vencidos,criticos:avaliados.filter(r=>nivel(r)==='critico'),semResponsavel:ativos.filter(r=>!r.responsavel),semPlano:ativos.filter(r=>!r.mitigacao),semAvaliacao:ativos.filter(r=>nota(r)==null)};
  }
  const filtro=()=>GP.state().ui.filtroRiscos=Object.assign({q:'',status:'ativos',nivel:'',categoria:'',projeto:'',probabilidade:'',impacto:''},GP.state().ui.filtroRiscos||{});
  function filtrar(lista,f={}){const q=GP.util.normTxt(f.q||'');return lista.filter(r=>(!f.status||f.status==='todos'||(f.status==='ativos'?aberto(r):r.status===f.status))&&(!f.nivel||nivel(r)===f.nivel)&&(!f.categoria||r.categoria===f.categoria)&&(!f.projeto||r.projetoId===f.projeto)&&(!f.probabilidade||r.probabilidade===+f.probabilidade)&&(!f.impacto||r.impacto===+f.impacto)&&(!q||GP.util.normTxt([r.codigo,r.titulo,r.responsavel,r.descricao,r.mitigacao,P.get(r.projetoId)?.titulo||''].join(' ')).includes(q)));}
  const opts=(entries,v,first)=>`<option value="">${esc(first)}</option>`+entries.map(([k,label])=>`<option value="${esc(k)}" ${String(v)===String(k)?'selected':''}>${esc(label)}</option>`).join('');
  const projectOptions=()=>P.todos().map(p=>[p.id,p.codigo+' / '+p.titulo]);
  function matriz(lista,{interativa=false}={}){
    let html='<div class="risk-matrix-scroll"><div class="risk-matrix" role="group" aria-label="Matriz de probabilidade por impacto">';
    for(let p=5;p>=1;p--){html+=`<div class="risk-axis">${p} / ${prob[p-1]}</div>`;for(let i=1;i<=5;i++){const cell=lista.filter(r=>aberto(r)&&r.probabilidade===p&&r.impacto===i),score=p*i,lv=nivel({probabilidade:p,impacto:i}),f=filtro();html+=`<${interativa?'button':'div'} class="risk-cell risk-level-${lv} ${interativa&&+f.probabilidade===p&&+f.impacto===i?'on':''}" ${interativa?`data-risk-cell="${p},${i}"`:''} title="Probabilidade ${p}, impacto ${i}, exposição ${score}: ${cell.length} riscos ativos"><b>${cell.length||'·'}</b><small>P${p} × I${i}</small></${interativa?'button':'div'}>`;}}
    html+='<div class="risk-axis">Impacto →</div>'+impacto.map((v,i)=>`<div class="risk-axis">${i+1} / ${v}</div>`).join('')+'</div></div>';
    return html+`<p class="risk-rule"><b>Régua interna sugerida:</b> probabilidade × impacto. Baixo: 1 a 4; moderado: 5 a 9; alto: 10 a 16; crítico: 17 a 25. Só riscos abertos ou em tratamento entram na matriz. Avaliações vazias ficam fora.</p>`;
  }
  const metric=(label,value,desc,tone='#739249')=>`<div class="metric" style="--tone:${tone}"><div class="metric-head"><span>${esc(label)}</span></div><strong class="metric-value">${value}</strong><div class="metric-sub">${esc(desc)}</div></div>`;
  function cards(lista){return lista.length?`<div class="risk-list">${lista.slice().sort((a,b)=>(nota(b)||0)-(nota(a)||0)).map(r=>{
    const lv=niveis[nivel(r)],p=P.get(r.projetoId),late=aberto(r)&&r.prazo&&r.prazo<hoje();
    return `<article class="risk-item" style="--risk-color:${lv?.color||'#85958b'}"><div><div class="risk-meta"><b>${esc(r.codigo)}</b><span>${esc(categorias[r.categoria])}</span>${U.pill(estados[r.status],r.status==='mitigado'?'ok':'neutral')}${lv?U.pill(lv.nome+' / '+nota(r),lv.tom):U.pill('Sem avaliação','neutral')}</div><h3 style="margin-top:10px">${esc(r.titulo)}</h3>${r.descricao?`<p>${esc(r.descricao)}</p>`:''}<div class="risk-meta"><span><b>Vínculo:</b> ${p?`<a class="link" href="#/projeto/${p.id}">${esc(p.codigo)} / ${esc(p.titulo)}</a>`:r.projetoId?'Registro vinculado não disponível':'Portfólio geral'}</span></div><div class="risk-meta" style="margin-top:7px"><span><b>Responsável:</b> ${esc(r.responsavel||'Não definido')}</span><span><b>Prazo da ação:</b> ${r.prazo?fmt.data(r.prazo):'Não informado'}${late?' / Vencido':''}</span></div><p><b>Mitigação:</b> ${esc(r.mitigacao||'Plano ainda não informado.')}</p></div><div class="actions"><button class="btn btn-ghost btn-sm" data-risk-edit="${r.id}">${icon('editar',14)} Editar</button><button class="btn btn-ghost btn-sm" data-risk-history="${r.id}">Histórico</button><button class="icon-btn" aria-label="Excluir ${esc(r.codigo)}" title="Excluir risco" data-risk-delete="${r.id}">${icon('lixo',15)}</button></div></article>`;}).join('')}</div>`:`<div class="risk-empty">Nenhum risco neste recorte. Use <b>Novo risco</b> para registrar um evento possível, avaliar sua exposição e definir uma ação de mitigação.</div>`;}
  function sinais(lista=P.todos()){
    const m=GP.analytics.medir(lista),ativos=lista.filter(p=>['aprovado','execucao','espera'].includes(p.etapa)),itens=[];
    if(m.atrasados.length)itens.push({titulo:'Prazos previstos vencidos',n:m.atrasados.length,desc:'Revise as datas e avalie os impactos sobre as entregas.',categoria:'prazo',projetoId:m.atrasados[0].id});
    const semResp=ativos.filter(p=>!p.responsavel);if(semResp.length)itens.push({titulo:'Entregas sem responsável',n:semResp.length,desc:'Defina quem acompanha a entrega e as decisões.',categoria:'governanca',projetoId:semResp[0].id});
    if(m.capacidade.excesso>0)itens.push({titulo:'Execução acima da capacidade',n:fmt.n(m.capacidade.excesso,1)+' FTE',desc:'A execução excede a capacidade global configurada. Avalie a necessidade de redistribuição.',categoria:'capacidade',projetoId:''});
    if(m.capacidade.semNota.length)itens.push({titulo:'Aprovados sem avaliação completa',n:m.capacidade.semNota.length,desc:'Complete a avaliação antes de priorizar novos inícios.',categoria:'governanca',projetoId:m.capacidade.semNota[0].id});
    return `<div class="card"><div class="chart-head"><div><h3>Sinais da carteira</h3><p>Situações calculadas a partir dos cadastros. A equipe avalia se deve registrá-las como riscos.</p></div><span class="chart-mark">${icon('alerta',18)}</span></div><div class="attention-list">${itens.map(x=>`<div class="attention-item"><span class="ic">${icon('alerta',16)}</span><p><b>${esc(x.n)} / ${esc(x.titulo)}</b>${esc(x.desc)}<br><button class="link" data-risk-signal data-risk-title="${esc(x.titulo)}" data-risk-category="${x.categoria}" data-risk-project="${x.projetoId}">Registrar avaliação de risco</button></p></div>`).join('')||'<p class="info-empty">Nenhum sinal identificado pelas regras de prazo, responsável, capacidade e avaliação.</p>'}</div>${lista.some(p=>p.exemplo)?'<p class="risk-rule">Este recorte contém exemplos fictícios. Os sinais também consideram esses cadastros.</p>':''}</div>`;
  }
  function painel(listaProjetos=P.todos()){
    const ids=new Set(listaProjetos.map(p=>p.id)),lista=todos().filter(r=>!r.projetoId||ids.has(r.projetoId)),m=medir(lista);
    return `<div class="metric-grid">${metric('Riscos ativos',m.ativos.length,'Abertos e em tratamento')}${metric('Altos e críticos',m.altos.length,`${m.avaliados.length} ativos avaliados`,'#c39137')}${metric('Ações com prazo vencido',m.vencidos.length,'Prazos de mitigação dos riscos ativos','#ac7044')}${metric('Sem avaliação',m.semAvaliacao.length,'Ativos sem probabilidade ou impacto')}${metric('Sem responsável',m.semResponsavel.length,'Riscos ativos sem dono')}${metric('Sem plano de ação',m.semPlano.length,'Riscos ativos sem mitigação')}</div><div class="risk-overview"><div class="card">${U.secH('Matriz de exposição','Riscos vinculados ao recorte e riscos gerais do portfólio.')}${matriz(lista)}</div>${sinais(listaProjetos)}</div><p class="risk-rule">Os riscos gerais aparecem em todos os recortes. Riscos vinculados só aparecem quando o projeto ou demanda está no recorte.</p>`;
  }
  function resumoPainel(){const m=medir();return `<section class="risk-alert-card"><div><h3>${icon('alerta',18)}Riscos e governança da carteira</h3><p>${m.n?`<b>${m.ativos.length}</b> riscos ativos / <b>${m.altos.length}</b> altos ou críticos / <b>${m.vencidos.length}</b> ações com prazo vencido.`:'Registre os riscos da carteira, defina responsáveis e acompanhe as ações de mitigação.'}${m.semAvaliacao.length?` ${m.semAvaliacao.length} ativos aguardam avaliação.`:''}</p></div><a class="btn btn-ghost" href="#/riscos">Abrir gestão de riscos</a></section>`;}
  function tela(el,rota){
    const f=filtro();if(rota?.query?.projeto)f.projeto=rota.query.projeto;
    const lista=filtrar(todos(),f),m=medir(),basematriz=todos().filter(r=>(!f.projeto||r.projetoId===f.projeto)&&(!f.categoria||r.categoria===f.categoria));
    el.innerHTML=U.pageHead({titulo:'Riscos do portfólio',sub:'A FEG acompanha a exposição consolidada. O responsável pela iniciativa registra o risco, mantém a resposta e atualiza sua situação.',acoes:`<button class="btn btn-ghost" data-risk-export>${icon('download',15)} Exportar riscos</button><button class="btn btn-primary" data-risk-new>${icon('novo',15)} Novo risco</button>`})+
      `<div class="metric-grid">${metric('Riscos ativos',m.ativos.length,'Abertos e em tratamento')}${metric('Altos e críticos',m.altos.length,'Somente ativos avaliados','#c39137')}${metric('Ações vencidas',m.vencidos.length,'Prazo da mitigação anterior a hoje','#ac7044')}${metric('Sem avaliação',m.semAvaliacao.length,'Probabilidade ou impacto não informado')}${metric('Sem responsável',m.semResponsavel.length,'Riscos ativos sem dono')}${metric('Sem plano de ação',m.semPlano.length,'Riscos ativos sem mitigação')}</div>
      <div class="risk-overview"><div class="card">${U.secH('Probabilidade × impacto','Clique em uma célula para consultar os riscos ativos dessa exposição.')}${matriz(basematriz,{interativa:true})}</div>${sinais()}</div>
      <div class="filter-panel" style="margin-top:22px"><div class="filter-heading">${icon('funil',16)} Consultar riscos<span class="spacer"></span><button class="link" data-risk-clear>Limpar filtros</button></div><div class="filter-controls"><label>Estado<select class="select" data-rf="status">${opts([['ativos','Ativos'],['todos','Todos'],...Object.entries(estados)],f.status,'Todos')}</select></label><label>Exposição<select class="select" data-rf="nivel">${opts(Object.entries(niveis).map(([k,v])=>[k,v.nome]),f.nivel,'Todas')}</select></label><label>Categoria<select class="select" data-rf="categoria">${opts(Object.entries(categorias),f.categoria,'Todas')}</select></label><label>Projeto ou demanda<select class="select" data-rf="projeto">${opts(projectOptions(),f.projeto,'Portfólio e todos os registros')}</select></label><label style="grid-column:1/-1">Busca<input class="input" data-rf="q" value="${esc(f.q)}" placeholder="Código, título, descrição ou responsável"></label></div>${f.probabilidade?`<p class="risk-rule">Célula selecionada: probabilidade ${f.probabilidade}, impacto ${f.impacto}. <button class="link" data-risk-clear-cell>Remover seleção</button></p>`:''}</div><div class="scope-line"><span><b>${lista.length}</b> riscos no recorte / ${todos().length} registrados</span><span>Ordem: maior exposição primeiro</span></div>${cards(lista)}`;
    let timer;
    el.querySelectorAll('[data-rf]').forEach(i=>i.addEventListener(i.dataset.rf==='q'?'input':'change',()=>{const apply=()=>{const pos=i.selectionStart;f[i.dataset.rf]=i.value;if(i.dataset.rf==='projeto'&&rota?.query?.projeto){GP.save();GP.go('#/riscos');}else{GP.save();GP.refresh();const next=document.querySelector(`[data-rf="${i.dataset.rf}"]`);if(next){next.focus();if(i.dataset.rf==='q')next.setSelectionRange(pos,pos);}}};if(i.dataset.rf==='q'){clearTimeout(timer);timer=setTimeout(apply,200);}else apply();}));
  }
  function form(riscoId='',prefill={}){
    const r=riscoId?get(riscoId):null;if(riscoId&&!r){GP.toast('Risco não encontrado.');return;}
    const v={categoria:'governanca',status:'aberto',...r,...prefill};
    const campo=(name,label,inner,full=false)=>`<label class="field ${full?'full':''}">${label}${inner}</label>`;
    const inp=(name,extra='')=>`<input class="input" name="${name}" value="${esc(v[name]??'')}" ${extra}>`,area=name=>`<textarea class="input" name="${name}" maxlength="1200">${esc(v[name]||'')}</textarea>`;
    const modal=GP.modal(`<h3>${r?'Editar '+esc(r.codigo):'Novo risco'}</h3><p class="muted">Descreva o evento possível e a resposta que será acompanhada.</p><form data-risk-form novalidate><div class="form">${campo('titulo','Título do risco *',inp('titulo','required maxlength="140"'),true)}${campo('descricao','Causa e efeito esperado',area('descricao'),true)}${campo('categoria','Categoria',`<select class="select" name="categoria">${opts(Object.entries(categorias),v.categoria,'Selecione')}</select>`)}${campo('projetoId','Vínculo',`<select class="select" name="projetoId">${opts(projectOptions(),v.projetoId,'Risco geral do portfólio')}</select>`)}${campo('probabilidade','Probabilidade (1 a 5)',`<select class="select" name="probabilidade">${opts(prob.map((x,i)=>[i+1,`${i+1} / ${x}`]),v.probabilidade,'Não avaliada')}</select>`)}${campo('impacto','Impacto (1 a 5)',`<select class="select" name="impacto">${opts(impacto.map((x,i)=>[i+1,`${i+1} / ${x}`]),v.impacto,'Não avaliado')}</select>`)}${campo('responsavel','Responsável pela ação',inp('responsavel','maxlength="120"'))}${campo('prazo','Prazo de mitigação',inp('prazo','type="date" min="2000-01-01" max="2100-12-31"'))}${campo('status','Estado',`<select class="select" name="status">${opts(Object.entries(estados),v.status,'Selecione')}</select>`)}<div class="field"><span>Exposição</span><div class="risk-score" data-risk-preview>Não avaliada</div></div>${campo('mitigacao','Plano de mitigação',area('mitigacao'),true)}</div><p class="auth-error" data-risk-error role="alert"></p><div class="m-act"><button class="btn btn-ghost" type="button" data-close="1">Cancelar</button><button class="btn btn-primary" type="submit">Salvar risco</button></div></form>`,{largo:true});
    const f=modal.querySelector('form'),preview=()=>{const x={probabilidade:n(f.elements.namedItem('probabilidade').value),impacto:n(f.elements.namedItem('impacto').value)},lv=niveis[nivel(x)];modal.querySelector('[data-risk-preview]').textContent=lv?`${nota(x)} / ${lv.nome}`:'Não avaliada';};f.addEventListener('change',preview);preview();
    f.addEventListener('submit',e=>{e.preventDefault();try{salvar(Object.fromEntries(new FormData(f).entries()),riscoId);GP.closeModal();GP.refresh();GP.toast('Risco salvo.');}catch(err){modal.querySelector('[data-risk-error]').textContent=err.message;}});
  }
  function exportar(){const lista=filtrar(todos(),filtro()),headers=['Código','Título','Descrição','Categoria','Projeto ou demanda','Responsável','Probabilidade','Impacto','Exposição','Nível','Estado','Prazo de mitigação','Plano de mitigação'];const rows=lista.map(r=>[r.codigo,r.titulo,r.descricao,categorias[r.categoria],P.get(r.projetoId)?.codigo||(r.projetoId?'Vínculo indisponível':'Portfólio geral'),r.responsavel,r.probabilidade,r.impacto,nota(r),niveis[nivel(r)]?.nome||'Não avaliado',estados[r.status],r.prazo,r.mitigacao]);GP.exportar.baixar('riscos-portfolio-feg-'+hoje()+'.csv',GP.exportar.csv([headers,...rows]),'text/csv;charset=utf-8');GP.toast('Riscos do recorte exportados.');}
  GP.riscos={todos,get,salvar,medir,filtrar,nivel,nota,matriz,painel,resumoPainel,form,exportar,categorias,estados};
  GP.tela({id:'riscos',nivel:2,ordem:14,titulo:'Riscos do portfólio',icone:'alerta',render:tela});
  GP.fichaSecoes.push({id:'riscos',nivel:2,ordem:35,titulo:'Riscos vinculados',render:p=>{const list=todos().filter(r=>r.projetoId===p.id);return `<p class="muted">${list.length} riscos vinculados a este registro.</p><div class="chips">${list.map(r=>`<button class="chip" data-risk-edit="${r.id}">${esc(r.codigo)} / ${esc(r.titulo)} / ${niveis[nivel(r)]?.nome||'Sem avaliação'}</button>`).join('')}</div><div class="actions" style="margin-top:15px"><button class="btn btn-ghost btn-sm" data-risk-new-project="${p.id}">Registrar risco desta iniciativa</button><a class="btn btn-ghost btn-sm" href="#/riscos?projeto=${p.id}">Consultar riscos</a></div>`;}});
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-risk-new')){form();return;}if(b.dataset.riskNewProject){form('',{projetoId:b.dataset.riskNewProject});return;}
    if(b.hasAttribute('data-risk-signal')){form('',{titulo:b.dataset.riskTitle,categoria:b.dataset.riskCategory,projetoId:b.dataset.riskProject});return;}
    if(b.dataset.riskEdit){form(b.dataset.riskEdit);return;}if(b.hasAttribute('data-risk-export')){exportar();return;}
    if(b.dataset.riskDelete){const r=get(b.dataset.riskDelete);if(r)GP.confirmar('Excluir '+esc(r.codigo)+'?',`<p>${esc(r.titulo)} será removido do registro de riscos. Os projetos e demandas permanecem na carteira.</p>`,'Excluir risco',()=>{GP.state().riscos=todos().filter(x=>x.id!==r.id);GP.save();GP.refresh();GP.toast('Risco excluído.');},{perigo:true});return;}
    if(b.dataset.riskHistory){const r=get(b.dataset.riskHistory);if(r)GP.modal(`<h3>Histórico / ${esc(r.codigo)}</h3><div class="stack">${r.historico.slice().reverse().map(h=>`<div class="attention-item"><p><b>${esc(h.acao)}</b>${fmt.dataHora(h.data)} / ${esc(h.por)}</p></div>`).join('')||'<p>Sem histórico registrado.</p>'}</div><div class="m-act"><button class="btn btn-ghost" data-close="1">Fechar</button></div>`);return;}
    if(b.dataset.riskCell){const [p,i]=b.dataset.riskCell.split(','),f=filtro();const same=f.probabilidade===p&&f.impacto===i;f.probabilidade=same?'':p;f.impacto=same?'':i;f.status='ativos';GP.save();GP.refresh();return;}
    if(b.hasAttribute('data-risk-clear')){GP.state().ui.filtroRiscos={status:'ativos'};GP.save();GP.go('#/riscos');return;}
    if(b.hasAttribute('data-risk-clear-cell')){const f=filtro();f.probabilidade='';f.impacto='';GP.save();GP.refresh();}
  });
})();

(function(){
  'use strict';
  const GP=window.GP,M=GP.modelo,U=GP.ui,{esc,uid}=GP.util,icon=GP.icon;
  const papeis={administrador:'Administrador',gestor:'Gestor do portfólio',consulta:'Consulta'};
  const enc=new TextEncoder();
  const bytesHex=a=>[...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const randomHex=n=>{const a=new Uint8Array(n);if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(a);else for(let i=0;i<n;i++)a[i]=Math.floor(Math.random()*256);return bytesHex(a);};
  async function hash(senha,salt){
    const material=enc.encode(salt+'|'+senha+'|portfolio-feg-local');
    if(globalThis.crypto?.subtle){let out=material;for(let i=0;i<1200;i++)out=new Uint8Array(await crypto.subtle.digest('SHA-256',out));return bytesHex(out);}
    let h1=2166136261,h2=2246822519;for(let round=0;round<25000;round++)for(const b of material){h1=Math.imul(h1^b^round,16777619);h2=Math.imul(h2+(b^round),3266489917)^(h1>>>13);}return (h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0');
  }
  const safe=(v,n=140)=>String(v??'').trim().slice(0,n),safeId=v=>safe(v,60).replace(/[^\w-]/g,''),email=v=>safe(v,180).toLowerCase();
  function limparUsuario(u){if(!u||typeof u!=='object'||!safeId(u.id)||!safe(u.nome))return null;return{id:safeId(u.id),nome:safe(u.nome),email:email(u.email),papel:papeis[u.papel]?u.papel:'consulta',ativo:u.ativo!==false,salt:safe(u.salt,80),senhaHash:safe(u.senhaHash,160),criadoEm:safe(u.criadoEm,40),atualizadoEm:safe(u.atualizadoEm,40)};}
  const migrar=M.migrar;
  M.migrar=function(s){const st=migrar(s),seen=new Set();st.usuarios=(Array.isArray(st.usuarios)?st.usuarios:[]).map(limparUsuario).filter(u=>u&&!seen.has(u.id)&&seen.add(u.id));const a=st.acesso&&typeof st.acesso==='object'?st.acesso:{};st.acesso={bloqueioLocal:!!a.bloqueioLocal,usuarioInicialId:safeId(a.usuarioInicialId)};if(!st.usuarios.some(u=>u.id===st.acesso.usuarioInicialId))st.acesso.usuarioInicialId='';return st;};
  const usuarios=()=>GP.state().usuarios||(GP.state().usuarios=[]),get=id=>usuarios().find(u=>u.id===id);
  const sessao={id:'',liberada:false};
  const usuario=()=>get(sessao.id)||get(GP.state()?.acesso?.usuarioInicialId)||usuarios().find(u=>u.ativo)||null;
  const iniciais=n=>safe(n).split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'FE';
  async function salvarUsuario(d,id=''){
    const atual=id?get(id):null;if(id&&!atual)throw new Error('Usuário não encontrado.');
    const nome=safe(d.nome),mail=email(d.email),senha=String(d.senha||'');if(!nome)throw new Error('Informe o nome do usuário.');
    if(mail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))throw new Error('Informe um e-mail válido ou deixe o campo vazio.');
    if(usuarios().some(u=>u.id!==id&&mail&&u.email===mail))throw new Error('Este e-mail já está cadastrado.');
    if(!atual&&senha.length<6)throw new Error('A senha inicial deve ter pelo menos 6 caracteres.');if(senha&&senha.length<6)throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    const stamp=new Date().toISOString(),salt=senha?randomHex(16):atual.salt,senhaHash=senha?await hash(senha,salt):atual.senhaHash;
    const u=limparUsuario({...atual,id:atual?.id||uid('usuario'),nome,email:mail,papel:papeis[d.papel]?d.papel:'consulta',ativo:d.ativo!==undefined?!!d.ativo:atual?.ativo!==false,salt,senhaHash,criadoEm:atual?.criadoEm||stamp,atualizadoEm:stamp});
    if(atual)usuarios()[usuarios().indexOf(atual)]=u;else usuarios().push(u);if(!GP.state().acesso.usuarioInicialId)GP.state().acesso.usuarioInicialId=u.id;GP.save();return u;
  }
  async function validar(login,senha){const key=email(login),u=usuarios().find(x=>x.ativo&&(x.email===key||GP.util.normTxt(x.nome)===GP.util.normTxt(login)));if(!u||!u.senhaHash)return null;return await hash(String(senha||''),u.salt)===u.senhaHash?u:null;}
  function form(id=''){
    const u=id?get(id):null;if(id&&!u){GP.toast('Usuário não encontrado.');return;}
    const m=GP.modal(`<h3>${u?'Editar usuário':'Novo usuário'}</h3><p class="muted">Este cadastro organiza os perfis desta cópia local do sistema.</p><form data-user-form><div class="form"><label class="field">Nome *<input class="input" name="nome" value="${esc(u?.nome||'')}" maxlength="140" required></label><label class="field">E-mail<input class="input" name="email" type="email" value="${esc(u?.email||'')}" maxlength="180"></label><label class="field">Papel<select class="select" name="papel">${Object.entries(papeis).map(([k,v])=>`<option value="${k}" ${u?.papel===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="field">${u?'Nova senha':'Senha inicial *'}<div class="password-wrap"><input class="input" name="senha" type="password" minlength="6" autocomplete="new-password" ${u?'':'required'}><button type="button" data-show-password>Mostrar</button></div><small>${u?'Deixe em branco para manter a senha atual.':'Mínimo de 6 caracteres.'}</small></label><label class="field full row" style="flex-direction:row;align-items:center"><input type="checkbox" name="ativo" ${u?.ativo===false?'':'checked'}> Usuário ativo</label></div><p class="auth-error" data-user-error role="alert"></p><div class="m-act"><button class="btn btn-ghost" type="button" data-close="1">Cancelar</button><button class="btn btn-primary" type="submit">Salvar usuário</button></div></form>`,{largo:true});
    m.querySelector('[data-show-password]').onclick=e=>{const i=m.querySelector('[name=senha]'),show=i.type==='password';i.type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar':'Mostrar';};
    m.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('[type=submit]');b.disabled=true;try{const d=Object.fromEntries(new FormData(f).entries());d.ativo=f.elements.namedItem('ativo').checked;await salvarUsuario(d,id);GP.closeModal();GP.refresh();GP.toast('Usuário salvo.');}catch(err){f.querySelector('[data-user-error]').textContent=err.message;}finally{b.disabled=false;}};
  }
  function card(el){const us=usuarios(),a=GP.state().acesso;el.classList.add('setting-card');el.innerHTML=U.secH('Usuários e acesso local','Perfis desta cópia do sistema. As permissões são descritivas nesta versão.',`<button class="btn btn-primary btn-sm" data-user-new>${icon('novo',14)} Novo usuário</button>`)+
    `<div class="user-note"><b>Importante:</b> este é um controle local e simples, adequado para organizar o uso de um HTML individual. Não substitui autenticação corporativa, servidor, Active Directory ou trilha de auditoria centralizada.</div><div class="setting-row"><div><b>Bloqueio ao abrir</b><p>Solicita usuário e senha sempre que esta página é recarregada.</p></div><label class="row"><input type="checkbox" data-local-lock ${a.bloqueioLocal?'checked':''} ${us.some(u=>u.ativo&&u.senhaHash)?'':'disabled'}> Ativar bloqueio</label></div><div class="setting-row"><div><b>Perfil exibido por padrão</b><p>Aparece no topo quando o bloqueio não está ativo.</p></div><select class="select" data-default-user><option value="">Nenhum perfil</option>${us.filter(u=>u.ativo).map(u=>`<option value="${u.id}" ${a.usuarioInicialId===u.id?'selected':''}>${esc(u.nome)} / ${papeis[u.papel]}</option>`).join('')}</select></div><div class="user-list">${us.map(u=>`<div class="user-item"><div class="user-info"><span class="profile-avatar">${iniciais(u.nome)}</span><div><b>${esc(u.nome)}</b><small>${esc(u.email||'Sem e-mail')} / ${papeis[u.papel]} / ${u.ativo?'Ativo':'Inativo'}</small></div></div><div class="actions"><button class="btn btn-ghost btn-sm" data-user-edit="${u.id}">${icon('editar',14)} Editar</button><button class="icon-btn" data-user-delete="${u.id}" aria-label="Excluir ${esc(u.nome)}" title="Excluir usuário">${icon('lixo',14)}</button></div></div>`).join('')||'<p class="risk-empty">Nenhum usuário cadastrado. O sistema continua acessível sem senha.</p>'}</div>`;}
  GP.configCartoes.push({ordem:3,secao:'acesso',render:card});
  function gate(){document.getElementById('app').innerHTML=`<div class="auth-gate"><div class="auth-card"><img class="ons" src="${GP.LOGO_ONS}" alt="ONS"><h1>Acessar o portfólio</h1><p>Use um dos usuários cadastrados nesta cópia local.</p><form data-login><div class="form"><label class="field">Usuário ou e-mail<input class="input" name="login" autocomplete="username" required autofocus></label><label class="field">Senha<div class="password-wrap"><input class="input" name="senha" type="password" autocomplete="current-password" required><button type="button" data-show-password>Mostrar</button></div></label></div><p class="auth-error" data-login-error role="alert"></p><button class="btn btn-primary" type="submit">Entrar</button></form><p class="auth-local-note">A senha protege apenas esta cópia no navegador. Para recuperar o acesso, utilize um backup anterior sem bloqueio ou uma cópia administrada pelo responsável do portfólio.</p></div></div>`;const f=document.querySelector('[data-login]');f.querySelector('[data-show-password]').onclick=e=>{const i=f.elements.namedItem('senha'),show=i.type==='password';i.type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar':'Mostrar';};f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('[type=submit]');b.disabled=true;const u=await validar(f.elements.namedItem('login').value,f.elements.namedItem('senha').value);if(u){sessao.id=u.id;sessao.liberada=true;GP.refresh();}else{f.querySelector('[data-login-error]').textContent='Usuário ou senha não conferem.';b.disabled=false;}};}
  GP.auth={usuario,usuarios,form,validar,salvarUsuario};
  const previous=GP.afterRender;
  GP.afterRender=(el,r)=>{if(previous)previous(el,r);if(GP.state().acesso?.bloqueioLocal&&!sessao.liberada){gate();return;}const right=document.querySelector('.topbar .right'),u=usuario();if(right&&!right.querySelector('.profile-btn'))right.insertAdjacentHTML('beforeend',u?`<button class="profile-btn" data-profile title="Perfil e usuários desta cópia"><span class="profile-avatar">${iniciais(u.nome)}</span><span class="profile-name">${esc(u.nome)}</span></button>`:`<button class="profile-btn gx-perfil-vazio" data-profile title="Cadastrar ou escolher um perfil"><span class="profile-avatar" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-6 7-6s6.2 2.4 7 6"/></svg></span><span class="profile-name">Entrar / Perfis</span></button>`);};
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-profile')){GP.go('#/config?secao=acesso');return;}if(b.hasAttribute('data-user-new')){form();return;}if(b.dataset.userEdit){form(b.dataset.userEdit);return;}if(b.dataset.userDelete){const u=get(b.dataset.userDelete);if(!u)return;GP.confirmar('Excluir usuário?',`<p>${esc(u.nome)} será removido desta cópia local. Os dados da carteira permanecem.</p>`,'Excluir',()=>{GP.state().usuarios=usuarios().filter(x=>x.id!==u.id);if(GP.state().acesso.usuarioInicialId===u.id)GP.state().acesso.usuarioInicialId='';if(!GP.state().usuarios.some(x=>x.ativo&&x.senhaHash))GP.state().acesso.bloqueioLocal=false;GP.save();GP.refresh();GP.toast('Usuário excluído.');},{perigo:true});return;}if(b.hasAttribute('data-local-lock'))return;});
  document.addEventListener('change',e=>{if(e.target.matches('[data-local-lock]')){GP.state().acesso.bloqueioLocal=e.target.checked;GP.save();GP.toast(e.target.checked?'Bloqueio local ativado. Será solicitado ao reabrir o arquivo.':'Bloqueio local desativado.');}if(e.target.matches('[data-default-user]')){GP.state().acesso.usuarioInicialId=e.target.value;GP.save();GP.refresh();}});
})();

(function(){
  'use strict';
  const GP=window.GP,U=GP.ui,M=GP.modelo,P=GP.projetos,{esc,fmt,sum}=GP.util,icon=GP.icon;
  const plural=GP.util.plural||((n,s,p)=>fmt.n(n)+' '+(Math.abs(+n)===1?s:p));
  const ico=(n,s)=>GP.iconeGerencial?GP.iconeGerencial(n,s):icon(n,s);
  /** Cartão de indicador com o markup canônico .metric (GP.ui.metric do pacote base, com fallback local). */
  function metric({label,valor,sub='',icone='painel',tom='#6b8f2a',tint='#f1f6ea',ratio=null}){
    let h=GP.ui.metric?GP.ui.metric({label,valor,sub,icone:'painel',tom,tint,ratio}):
      `<div class="metric" style="--tone:${tom};--tint:${tint}"><div class="metric-head"><span>${esc(label)}</span><i class="metric-icon">${ico(icone,15)}</i></div><div class="metric-body"><strong class="metric-value">${valor}</strong></div><div class="metric-sub">${sub}</div></div>`;
    return h.replace(/(<i class="metric-icon"[^>]*>)[\s\S]*?(<\/i>)/,`$1${ico(icone,15)}$2`);
  }
  const nota=(titulo,html)=>`<aside class="gx-nota"><span class="gx-nota-ic">${icon('info',16)}</span><p><b>${esc(titulo)}</b> ${html}</p></aside>`;

  function governanca(el){
    const lista=P.todos(),abertos=lista.filter(p=>['aprovado','execucao','espera'].includes(p.etapa));
    const semResponsavel=abertos.filter(p=>!p.responsavel).length,semDatas=abertos.filter(p=>!(p.inicioPrevisto&&p.fimPrevisto)).length,semAtivo=lista.filter(p=>!p.ferramenta).length;
    const semPrioridade=lista.filter(p=>M.ETAPAS_PRIORIZAVEIS.includes(p.etapa)&&!M.pontuar(p).completo).length;
    const q=GP.analytics?GP.analytics.medir(lista).qualidade.filter(x=>x.den):[],cob=q.length?sum(q,x=>x.num/x.den)/q.length:null;
    const tomQ=n=>n?{tom:'#c39127',tint:'#fff7e6'}:{tom:'#6b8f2a',tint:'#f1f6ea'};
    el.innerHTML=`<div class="gx-gov">`+U.pageHead({titulo:'Governança do modelo',sub:'Controles da FEG para manter regras, qualidade e continuidade do portfólio.',acoes:`<button class="btn btn-ghost" data-importar-csv>${icon('upload',15)} Importar iniciativas</button>`})+
      `<div class="guardian-banner"><div class="guardian-mark">${icon('config',24)}</div><div><span class="eyebrow">FEG · Guardiã do modelo</span><h2>Quem cuida de quê no portfólio</h2><p>A FEG administra as regras, os critérios, a taxonomia e a qualidade consolidada. As áreas responsáveis mantêm o conteúdo e executam as iniciativas.</p></div></div>
      <div class="metric-grid governance-metrics gx-kpis gx-kpis-5 scroll-fade">
        ${metric({label:'Sem responsável',valor:fmt.n(semResponsavel),sub:'Iniciativas abertas',icone:'pessoa',...tomQ(semResponsavel)})}
        ${metric({label:'Sem datas completas',valor:fmt.n(semDatas),sub:'Iniciativas abertas',icone:'calendario',...tomQ(semDatas)})}
        ${metric({label:'Sem ativo relacionado',valor:fmt.n(semAtivo),sub:'Registros da base',icone:'servidor',...tomQ(semAtivo)})}
        ${metric({label:'Sem prioridade completa',valor:fmt.n(semPrioridade),sub:'Itens elegíveis',icone:'avaliar',...tomQ(semPrioridade)})}
        ${metric({label:'Cobertura dos dados',valor:fmt.pct(cob),sub:'Média das medidas de qualidade',icone:'escudo',ratio:cob})}
      </div>
      <div class="admin-actions">
        <a class="card admin-action" href="#/criterios"><i>${icon('pesos',20)}</i><div><b>Critérios e pesos</b><span>Manter o método de priorização</span></div><small>Nível 2</small></a>
        <a class="card admin-action" href="#/carteira"><i>${icon('carteira',20)}</i><div><b>Capacidade e cenários</b><span>Revisar FTE, reserva e orçamento</span></div><small>Nível 3</small></a>
        <a class="card admin-action" href="#/indicadores"><i>${icon('ranking',20)}</i><div><b>Qualidade e indicadores</b><span>Ver cobertura e pendências da base</span></div><small>Todos</small></a>
        <a class="card admin-action" href="#/config"><i>${icon('config',20)}</i><div><b>Dados e continuidade</b><span>Backup, restauração e usuários locais</span></div><small>Administração</small></a>
      </div>
      <section class="card governance-rules">${U.secH('Responsabilidade operacional','Regras aplicadas ao uso do sistema.')}
        <div class="portfolio-table tbl-wrap"><table class="tbl"><thead><tr><th>Papel</th><th>Responsabilidade no sistema</th><th>Não substitui</th></tr></thead><tbody>
          <tr><td><b>FEG</b></td><td>Administra modelo, critérios, qualidade e visão consolidada</td><td>Decisão colegiada e execução das áreas</td></tr>
          <tr><td><b>Responsável pela iniciativa</b></td><td>Atualiza situação, datas, avanço, dependências e riscos</td><td>Validação do demandante e do patrocinador</td></tr>
          <tr><td><b>Instância de governança</b></td><td>Registra decisões de entrada, prioridade, capacidade e início</td><td>Análise técnica e responsabilidade executiva</td></tr>
        </tbody></table></div></section>
      ${nota('Escopo.','Este sistema centraliza a gestão do portfólio, o histórico e o apoio às decisões. A execução detalhada continua no ADO ou Jira, e o inventário oficial de sistemas permanece em sua fonte corporativa.')}</div>`;
  }

  function sistemas(el){
    const lista=P.todos(),comAtivo=lista.filter(p=>p.ferramenta&&p.ferramenta.trim()),semAtivo=lista.length-comAtivo.length;
    const mapa=new Map();
    comAtivo.forEach(p=>{const nome=p.ferramenta.trim(),key=GP.util.normTxt(nome);if(!mapa.has(key))mapa.set(key,{nome,lista:[]});mapa.get(key).lista.push(p);});
    const ativos=[...mapa.values()].map(a=>{
      const enc=a.lista.filter(p=>['concluido','nao_entra','cancelado'].includes(p.etapa)).length,exec=a.lista.filter(p=>p.etapa==='execucao').length;
      const riscos=(GP.state().riscos||[]).filter(r=>a.lista.some(p=>p.id===r.projetoId)&&['aberto','em_tratamento'].includes(r.status));
      const comCusto=a.lista.filter(p=>p.custo!=null);
      return {...a,abertos:a.lista.length-enc,exec,outrasAbertas:a.lista.length-enc-exec,encerradas:enc,riscos:riscos.length,custo:sum(comCusto,p=>p.custo),temCusto:comCusto.length>0};
    }).sort((a,b)=>b.abertos-a.abertos||b.lista.length-a.lista.length||a.nome.localeCompare(b.nome,'pt-BR'));
    const maxCusto=Math.max(1,...ativos.map(a=>a.custo)),comRiscos=ativos.some(a=>a.riscos>0);
    const COR={exec:'#6b8f2a',abertas:'#3a74a8',enc:'#a3b2ac'};
    const situacao=a=>{const t=a.lista.length;return `<span class="gx-sit" role="img" aria-label="${plural(a.exec,'em execução','em execução')}, ${plural(a.outrasAbertas,'outra aberta','outras abertas')}, ${plural(a.encerradas,'encerrada','encerradas')}" data-tt="${esc(a.nome)}&#10;Em execução: ${a.exec}&#10;Outras abertas: ${a.outrasAbertas}&#10;Encerradas: ${a.encerradas}">${[['exec',a.exec],['abertas',a.outrasAbertas],['enc',a.encerradas]].filter(x=>x[1]).map(([k,v])=>`<i style="flex:${v/t};background:${COR[k]}"></i>`).join('')}</span>`;};
    const rows=ativos.map(a=>`<tr><td><b>${esc(a.nome)}</b></td><td class="r gx-num">${fmt.n(a.lista.length)}</td><td>${situacao(a)}</td><td class="r gx-num">${fmt.n(a.abertos)}</td><td class="r gx-num">${fmt.n(a.exec)}</td>${comRiscos?`<td class="r gx-num">${a.riscos?`<span class="pill t-warn"><i></i>${fmt.n(a.riscos)}</span>`:'0'}</td>`:''}<td class="r"><span class="gx-custo"><span class="gx-num">${a.temCusto?fmt.mi(a.custo):'Não informado'}</span>${a.temCusto?`<span class="gx-custo-bar" aria-hidden="true"><i style="width:${(a.custo/maxCusto*100).toFixed(1)}%"></i></span>`:''}</span></td></tr>`).join('');
    el.innerHTML=`<div class="gx-sis">`+U.pageHead({titulo:'Sistemas e ativos',sub:'Leitura do portfólio pelo sistema, modelo ou ferramenta informado em cada projeto ou demanda.'})+
      `<div class="metric-grid system-metrics gx-kpis gx-kpis-4 scroll-fade">
        ${metric({label:'Ativos relacionados',valor:fmt.n(ativos.length),sub:'Nomes distintos informados',icone:'servidor'})}
        ${metric({label:'Iniciativas vinculadas',valor:fmt.n(comAtivo.length),sub:'Projetos e demandas com o campo preenchido',icone:'elo'})}
        ${metric({label:'Sem ativo relacionado',valor:fmt.n(semAtivo),sub:'Registros a revisar, quando aplicável',icone:'alerta',tom:semAtivo?'#c39127':'#6b8f2a',tint:semAtivo?'#fff7e6':'#f1f6ea'})}
        ${metric({label:'Em execução',valor:fmt.n(comAtivo.filter(p=>p.etapa==='execucao').length),sub:'Iniciativas vinculadas em andamento',icone:'pulso',tom:'#188787',tint:'#e8f4f1'})}
      </div>
      <section class="card gx-sis-card">${U.secH('Carteira por ativo relacionado','Agrupamento pelo texto informado no cadastro. Padronize os nomes para evitar duplicidades.')}
        ${ativos.length?`<div class="legend gx-legend"><span><i style="background:${COR.exec}"></i>Em execução</span><span><i style="background:${COR.abertas}"></i>Outras abertas</span><span><i style="background:${COR.enc}"></i>Encerradas</span></div>
        <div class="portfolio-table tbl-wrap"><table class="tbl gx-sis-tbl"><thead><tr><th>Sistema, modelo ou ferramenta</th><th class="r">Iniciativas</th><th>Situação</th><th class="r">Abertas</th><th class="r">Em execução</th>${comRiscos?'<th class="r">Riscos abertos</th>':''}<th class="r">Custo estimado</th></tr></thead><tbody>${rows}</tbody></table></div>`:U.vazio('Nenhum ativo relacionado','Preencha o campo Sistema, modelo ou ferramenta relacionada nos cadastros aplicáveis.','<a class="btn btn-primary" href="#/novo">Novo cadastro</a>')}
      </section>
      <div class="grid g2 governance-detail"><section class="card">${U.secH('Para manter a visão coerente','Orientações de preenchimento.')}
        <ul class="clean-list"><li>Use o nome oficial e uma grafia única para cada ativo</li><li>Informe o ativo principal impactado pela iniciativa</li><li>Não use este campo para registrar equipe, fornecedor ou tecnologia isolada</li></ul></section>
        <section class="card">${U.secH('Responsabilidade','A associação ao ativo não muda a governança.')}
        <p class="muted">O responsável pela iniciativa atualiza o cadastro. A área técnica valida impactos no sistema, modelo ou ferramenta. A FEG monitora a consistência do portfólio e mantém o padrão de informação.</p></section></div>
      ${nota('Escopo desta visão.','Consolida iniciativas relacionadas ao mesmo ativo. Não representa o inventário oficial, a criticidade operacional ou a propriedade técnica dos sistemas.')}</div>`;
  }

  GP.tela({id:'governanca',nivel:1,ordem:0.25,gerencial:true,titulo:'Governança do modelo',icone:'config',render:governanca});
  GP.tela({id:'sistemas',nivel:1,ordem:0.27,gerencial:true,titulo:'Sistemas e ativos',icone:'carteira',render:sistemas});
})();

(function(){
  'use strict';
  const GP=window.GP,icon=GP.icon;
  GP.configCartoes.push({ordem:2,secao:'interface',render:el=>{const ui=GP.state().ui,scale=ui.escalaInterface||'normal';el.classList.add('setting-card');el.innerHTML=GP.ui.secH('Interface e leitura','Preferências visuais salvas nesta cópia do navegador.')+`<div class="setting-row"><div><b>Tamanho da interface</b><p>Ajusta textos, cartões e controles sem depender do zoom do navegador.</p></div><select class="select" data-ui-scale aria-label="Tamanho da interface"><option value="compacto" ${scale==='compacto'?'selected':''}>Compacto</option><option value="normal" ${scale==='normal'?'selected':''}>Confortável</option><option value="ampliado" ${scale==='ampliado'?'selected':''}>Ampliado</option></select></div><div class="setting-row"><div><b>Menu lateral</b><p>O menu pode ficar recolhido no computador e sempre vira painel deslizante em telas menores.</p></div><button class="btn btn-ghost" data-recolher>${icon(ui.menuMini?'expandir':'recolher',15)} ${ui.menuMini?'Expandir menu':'Recolher menu'}</button></div>`;}});
  const applyScale=()=>{const scale=GP.state()?.ui?.escalaInterface||'normal';document.documentElement.style.setProperty('--ui-font-scale',scale==='compacto'?'.94':scale==='ampliado'?'1.08':'1');};
  const previous=GP.afterRender;GP.afterRender=(el,r)=>{if(previous)previous(el,r);applyScale();if(GP.registrarVisita)GP.registrarVisita();};
  document.addEventListener('change',e=>{if(e.target.matches('[data-ui-scale]')){GP.state().ui.escalaInterface=e.target.value;GP.save();applyScale();GP.refresh();}});
  if(globalThis.ResizeObserver){const observer=new ResizeObserver(entries=>{for(const entry of entries){const el=entry.target;if(el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflowX==='visible')el.classList.add('layout-overflow');else el.classList.remove('layout-overflow');}});document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body));}
})();
