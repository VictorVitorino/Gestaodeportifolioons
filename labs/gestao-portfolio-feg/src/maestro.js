(function(){
  'use strict';
  const GP=window.GP,M=GP.modelo,P=GP.projetos,U=GP.ui,{esc,fmt,sum,hoje,clone}=GP.util,icon=GP.icon;
  /* Séries categóricas: oliva e ouro originais; petróleo, ardósia e cobre em passos validados para daltonismo (ΔE ≥ 13). */
  const PALETTE=['#6b8f2a','#3a74a8','#d5a32d','#00908f','#b8642c','#859c98','#a06137','#899b67'];
  const TOM_ETAPA={andamento:'#6b8f2a',concluido:'#00908f',fora:'#a3b2ac'},UNICA='#6b8f2a';
  GP.charts.PAL.splice(0,GP.charts.PAL.length,...PALETTE);
  const NATUREZAS={projeto:'Projeto',demanda:'Demanda'};
  const ENCERRADOS=['concluido','nao_entra','cancelado'];
  const CARTEIRA=['aprovado','execucao','espera','concluido'];
  const ABERTOS=['aprovado','execucao','espera'];
  const DEF={gerencia:'',natureza:'',etapa:'',tipo:'',origem:'',fonte:'todos',de:'',ate:'',q:''};
  const filtros=()=>GP.state().ui.filtroIndicadores=Object.assign({},DEF,GP.state().ui.filtroIndicadores||{});
  const natureza=p=>p.natureza==='demanda'?'demanda':'projeto';
  const progresso=p=>p.etapa==='concluido'?100:p.progresso==null?null:+p.progresso;
  const divisao=(n,d)=>d?n/d:null;
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
  function medir(lista,f={}){
    const n=lista.length,cont=fn=>lista.filter(fn).length,exec=lista.filter(p=>p.etapa==='execucao'),ativos=lista.filter(p=>ABERTOS.includes(p.etapa)),carteira=lista.filter(p=>CARTEIRA.includes(p.etapa));
    const entrada=lista.filter(p=>p.entrada&&['entra','falta_info','nao_entra'].includes(p.entrada.resultado)),entram=entrada.filter(p=>p.entrada.resultado==='entra').length;
    const av=exec.filter(p=>progresso(p)!=null),custo=lista.filter(p=>p.custo!=null),ftes=exec.filter(p=>p.esforcoFte!=null);
    const priorizaveis=lista.filter(p=>M.ETAPAS_PRIORIZAVEIS.includes(p.etapa));
    const atrasados=ativos.filter(p=>p.fimPrevisto&&p.fimPrevisto<hoje());
    const avaliados=lista.filter(p=>M.pontuar(p).completo),priorizados=priorizaveis.filter(p=>M.pontuar(p).completo);
    const capacidade=M.montarCarteira(lista,GP.state().capacidade,GP.state().forcar);
    return {lista,n,projetos:cont(p=>natureza(p)==='projeto'),demandas:cont(p=>natureza(p)==='demanda'),exemplos:cont(p=>p.exemplo),execucao:exec.length,ativos:ativos.length,
      fila:cont(p=>['entrada','triagem'].includes(p.etapa)),concluidos:cont(p=>p.etapa==='concluido'),cancelados:cont(p=>p.etapa==='cancelado'),recusados:cont(p=>p.etapa==='nao_entra'),
      aprovados:cont(p=>p.etapa==='aprovado'),espera:cont(p=>p.etapa==='espera'),carteira:carteira.length,entram,entradaAvaliada:entrada.length,taxaEntrada:divisao(entram,entrada.length),
      taxaConclusao:divisao(cont(p=>p.etapa==='concluido'),carteira.length),custo:sum(custo,p=>p.custo),comCusto:custo.length,fteExecucao:sum(ftes,p=>p.esforcoFte),comFteExecucao:ftes.length,
      progresso:av.length?sum(av,progresso)/av.length:null,comProgresso:av.length,atrasados,avaliados:avaliados.length,priorizados:priorizados.length,priorizaveis:priorizaveis.length,
      etapas:M.ETAPAS.map(e=>({key:e.id,label:e.nome,value:cont(p=>p.etapa===e.id),color:TOM_ETAPA[e.grupo]||UNICA})),
      gerencias:[...M.CAT.gerencias.map(g=>({key:g.id,label:g.id,value:cont(p=>p.gerencia===g.id),color:UNICA})),...(cont(p=>!p.gerencia)?[{key:'',label:'Não informada',value:cont(p=>!p.gerencia),color:'#859c98'}]:[])],
      tipos:[...new Set([...M.CAT.tipos,...lista.map(p=>p.tipo||'Não informado')])].map((t,i)=>({key:t,label:t,value:cont(p=>(p.tipo||'Não informado')===t),color:UNICA})),
      origens:[...new Set([...M.CAT.origens,...lista.map(p=>p.origem||'Não informada')])].map((t,i)=>({key:t,label:t,value:cont(p=>(p.origem||'Não informada')===t),color:UNICA})),
      serie:serieEntrada(lista,f),capacidade,qualidade:[
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
  GP.analytics={filtrar,medir,filtros,natureza,progresso,serieEntrada};
  /** Medidor radial: trilho no mesmo tom (16%), preenchimento com ponta arredondada. ratio null = sem dado. */
  function ring(ratio,tone='var(--c1)',size=46,centro=''){
    const sw=size>=80?10:5,r=(size-sw)/2-1,c=size/2,L=2*Math.PI*r,f=ratio==null?0:Math.max(0,Math.min(1,ratio));
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${ratio==null?'Sem dado':fmt.pct(f)}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${tone}" stroke-opacity=".16" stroke-width="${sw}" style="stroke:${tone}"/>${f>0?`<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${tone}" style="stroke:${tone}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${Math.max(.01,f*L-(f<1?0:0))} ${L}" transform="rotate(-90 ${c} ${c})"/>`:''}${centro?`<text x="${c}" y="${c+size*.07}" text-anchor="middle" font-size="${size*.2}" font-weight="700" fill="#17302b">${esc(centro)}</text>`:''}</svg>`;
  }
  const legendaEtapas=()=>`<div class="legend legend-mini"><span><i style="background:${TOM_ETAPA.andamento}"></i>Em andamento</span><span><i style="background:${TOM_ETAPA.concluido}"></i>Concluído</span><span><i style="background:${TOM_ETAPA.fora}"></i>Fora do portfólio</span></div>`;
  const metric=(label,value,sub,{tone='#668d27',tint='#f1f6ea',ic='painel',ratio=null}={})=>`<div class="metric" style="--tone:${tone};--tint:${tint}"><div class="metric-head"><span>${esc(label)}</span><i class="metric-icon">${icon(ic,15)}</i></div><div class="metric-body"><strong class="metric-value">${value}</strong>${ratio!=null?ring(ratio,tone,46):''}</div><div class="metric-sub">${sub}</div></div>`;
  const chartHead=(title,sub='',ic='ranking')=>`<div class="chart-head"><div><h3>${esc(title)}</h3>${sub?`<p>${esc(sub)}</p>`:''}</div><span class="chart-mark">${icon(ic,17)}</span></div>`;
  const sample=m=>m.exemplos?`<div class="sample-banner"><span><b>Dados de demonstração:</b> ${m.exemplos} de ${m.n} registros são exemplos fictícios e entram nos indicadores exibidos.</span><button class="link" data-so-reais>Mostrar apenas reais</button></div>`:'';
  function hbars(items,total,{key,monetario=false}={}){
    const max=Math.max(1e-9,...items.map(i=>i.value));
    return `<div class="percent-bars">${items.map(it=>{const count=monetario?fmt.mi(it.value):fmt.n(it.value),percent=fmt.pct(divisao(it.value,total));
      const attr=key&&it.key?`data-analytics-filter="${key}" data-value="${esc(it.key)}" aria-label="Filtrar por ${esc(it.label)}"`:'';
      return `<${attr?'button':'div'} class="percent-row" ${attr} data-tt="${esc(it.label)}&#10;${esc(count)} · ${esc(percent)}"><span class="name">${esc(it.label)}</span><span class="track"><i style="width:${it.value/max*100}%;--bar:${it.color||UNICA}"></i></span><span class="count">${count}<small>${percent}</small></span></${attr?'button':'div'}>`;}).join('')}</div>`;
  }
  function donut(items,total,label='registros',{key}={}){
    const r=72,c=94,L=2*Math.PI*r,vivos=items.filter(i=>i.value>0).length,gap=vivos>1?3:0; let offset=0;
    const arcs=items.map(it=>{const length=total?it.value/total*L:0;if(!length)return '';const v=`<circle class="arc" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${it.color}" stroke-width="18" stroke-dasharray="${Math.max(.01,length-gap)} ${L-length+gap}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${c} ${c})" data-tt="${esc(it.label)}&#10;${it.value} · ${fmt.pct(divisao(it.value,total))}"/>`;offset+=length;return v;}).join('');
    return `<div class="donut-layout"><svg viewBox="0 0 188 188" role="img" aria-label="${esc(items.map(i=>i.label+': '+i.value).join(', '))}"><circle cx="94" cy="94" r="72" fill="none" stroke="#e9efeb" stroke-width="18"/>${arcs}<text x="94" y="98" text-anchor="middle" font-size="38" font-weight="700" fill="#17302b" letter-spacing="-1">${total}</text><text x="94" y="120" text-anchor="middle" font-size="11.5" fill="#566b64">${esc(label)}</text></svg><div class="donut-legend">${items.map(it=>`<${key?'button':'div'} class="legend-line" ${key?`data-analytics-filter="${key}" data-value="${esc(it.key)}" aria-label="Filtrar ${esc(it.label)}"`:''}><i style="background:${it.color}"></i><span>${esc(it.label)}<small>${fmt.pct(divisao(it.value,total))} do total</small></span><b>${it.value}</b></${key?'button':'div'}>`).join('')}</div></div>`;
  }
  function graficoEntradas(serie){
    /* Colunas agrupadas: ≤24px, ponta arredondada de 4px e base reta, 2px de respiro entre o par, grade fina e dica por período. */
    const pts=serie.pontos,W=800,H=260,L=40,R=12,T=18,B=44,pw=W-L-R,ph=H-T-B,max=Math.max(2,...pts.map(p=>Math.max(p.projetos,p.demandas))),step=pw/Math.max(1,pts.length),bw=Math.max(4,Math.min(24,(step-14)/2));
    const yMax=max<=4?max:Math.ceil(max/4)*4,cores={projetos:PALETTE[0],demandas:PALETTE[1]};
    const col=(x,v,cor)=>{if(!v)return '';const h=v/yMax*ph,y=T+ph-h,rr=Math.min(4,h,bw/2);return `<path d="M${x} ${T+ph}V${y+rr}Q${x} ${y} ${x+rr} ${y}H${x+bw-rr}Q${x+bw} ${y} ${x+bw} ${y+rr}V${T+ph}Z" fill="${cor}"/>`;};
    let g=''; [0,.25,.5,.75,1].forEach(t=>{const y=T+ph*(1-t),v=yMax*t;g+=`<line x1="${L}" y1="${y}" x2="${W-R}" y2="${y}" stroke="${t?'#e3eae6':'#c9d6cf'}" stroke-width="1"/><text x="${L-10}" y="${y+5}" text-anchor="end" font-size="14" fill="#71857e">${fmt.n(v,v%1?1:0)}</text>`;});
    const rotulos=pts.length<=10?1:Math.ceil(pts.length/10);
    pts.forEach((p,i)=>{const cx=L+step*(i+.5);g+=col(cx-bw-1,p.projetos,cores.projetos)+col(cx+1,p.demandas,cores.demandas);
      g+=`<rect class="hit" x="${L+step*i}" y="${T}" width="${step}" height="${ph}" fill="transparent" data-tt="${esc(p.label)}&#10;Projetos: ${p.projetos}&#10;Demandas: ${p.demandas}"/>`;
      if(i%rotulos===0)g+=`<text x="${cx}" y="${H-16}" text-anchor="middle" font-size="14" fill="#566b64">${esc(p.label)}</text>`;
    });
    return `<div class="chart-scroll" tabindex="0" aria-label="Gráfico de entradas. Use a rolagem horizontal em telas menores."><svg class="chart chart-cols" viewBox="0 0 ${W} ${H}" role="img" aria-label="Entradas de projetos e demandas por ${serie.passo===1?'mês':serie.passo===3?'trimestre':'ano'}">${g}</svg></div><div class="legend"><span><i style="background:${cores.projetos}"></i>Projetos</span><span><i style="background:${cores.demandas}"></i>Demandas</span></div><p class="chart-footnote">Data de entrada do cadastro. ${serie.passo===3?'Agrupado por trimestre para permitir a leitura de todo o período.':serie.passo===12?'Agrupado por ano para permitir a leitura de todo o período.':'Quantidade de novos cadastros em cada mês.'}${serie.semData?` ${serie.semData} registro(s) sem data não aparecem neste gráfico.`:''}</p>`;
  }
  function opcoes(itens,valor,vazio){return `<option value="">${esc(vazio)}</option>`+itens.map(([v,l])=>`<option value="${esc(v)}" ${v===valor?'selected':''}>${esc(l)}</option>`).join('');}
  function filterPanel(f){
    return `<div class="filter-panel" data-noprint><div class="filter-heading">${icon('funil',16)} Filtros do portfólio<span class="spacer"></span><button class="link" data-limpar-analise>Limpar filtros</button></div><div class="filter-controls">
      <label>Gerência<select class="select" data-af="gerencia">${opcoes(M.CAT.gerencias.map(g=>[g.id,g.id]),f.gerencia,'Todas as gerências')}</select></label>
      <label>Natureza<select class="select" data-af="natureza">${opcoes(Object.entries(NATUREZAS),f.natureza,'Projetos e demandas')}</select></label>
      <label>Etapa<select class="select" data-af="etapa">${opcoes(M.ETAPAS.map(e=>[e.id,e.nome]),f.etapa,'Todas as etapas')}</select></label>
      <label>Tipo de iniciativa<select class="select" data-af="tipo">${opcoes(M.CAT.tipos.map(t=>[t,t]),f.tipo,'Todos os tipos')}</select></label>
      <label>Origem<select class="select" data-af="origem">${opcoes(M.CAT.origens.map(t=>[t,t]),f.origem,'Todas as origens')}</select></label>
      <label>Base exibida<select class="select" data-af="fonte">${[['todos','Todos os registros'],['reais','Somente dados reais'],['exemplos','Somente exemplos fictícios']].map(([k,l])=>`<option value="${k}" ${k===f.fonte?'selected':''}>${l}</option>`).join('')}</select></label>
      <label>Entrada a partir de<input class="input" type="date" data-af="de" value="${esc(f.de)}" min="2000-01-01" max="2100-12-31"></label>
      <label>Entrada até<input class="input" type="date" data-af="ate" value="${esc(f.ate)}" min="2000-01-01" max="2100-12-31"></label>
    </div>${f.q?`<p class="chart-footnote">Busca ativa: <b>${esc(f.q)}</b></p>`:''}</div>`;
  }
  function descricaoFiltros(f){
    const partes=[];
    if(f.gerencia)partes.push('Gerência '+f.gerencia);if(f.natureza)partes.push(NATUREZAS[f.natureza]);if(f.etapa)partes.push(M.etapa(f.etapa).nome);
    if(f.tipo)partes.push(f.tipo);if(f.origem)partes.push(f.origem);if(f.de||f.ate)partes.push('Entrada '+(f.de?fmt.data(f.de):'sem início')+' a '+(f.ate?fmt.data(f.ate):'sem fim'));
    if(f.fonte==='reais')partes.push('Somente reais');if(f.fonte==='exemplos')partes.push('Somente exemplos');if(f.q)partes.push('Busca: '+f.q);
    return partes.length?partes.join(' / '):'Todos os registros cadastrados';
  }
  function kpis(m){return `<div class="metric-grid">
    ${metric('Registros na base',fmt.n(m.n),`${m.projetos} projetos e ${m.demandas} demandas`,{ic:'acervo'})}
    ${metric('Fila de entrada',fmt.n(m.fila),`${fmt.pct(divisao(m.fila,m.n))} do total cadastrado`,{tone:'#c39127',tint:'#fff7e6',ic:'funil',ratio:divisao(m.fila,m.n)})}
    ${metric('Em execução',fmt.n(m.execucao),`${fmt.pct(divisao(m.execucao,m.n))} do total cadastrado`,{tone:'#188787',tint:'#e8f4f1',ic:'carteira',ratio:divisao(m.execucao,m.n)})}
    ${metric('Admissão na entrada',fmt.pct(m.taxaEntrada),`${m.entram} entram / ${m.entradaAvaliada} checklists completos`,{tone:'#60852a',ic:'avaliar',ratio:m.taxaEntrada})}
    ${metric('Conclusão da carteira',fmt.pct(m.taxaConclusao),`${m.concluidos} concluídos / ${m.carteira} aceitos na carteira`,{tone:'#477b91',tint:'#ecf2f6',ic:'check',ratio:m.taxaConclusao})}
    ${metric('Prazos vencidos',fmt.n(m.atrasados.length),'Aprovados, em execução ou em espera com fim vencido',{tone:'#bb7d2c',tint:'#fff1df',ic:'relogio'})}
    </div>`;}
  function tabela(lista,{busca=false,limit=null}={}){
    const rows=limit?lista.slice(0,limit):lista;
    return `<div class="table-tools"><div><h3>Projetos e demandas ${limit?'recentes':'do recorte'}</h3><span class="dim" style="font-size:11px">${rows.length} registro(s)${limit&&lista.length>limit?` de ${lista.length}`:''}. Clique em um registro para abrir a ficha.</span></div>${busca?`<input class="input" data-af="q" value="${esc(filtros().q)}" placeholder="Buscar por título, código, área ou pessoa" aria-label="Buscar nos indicadores">`:'<a class="link" href="#/acervo">Consultar acervo</a>'}</div><div class="portfolio-table">${U.table({id:'analytics',rows,cols:[
      {key:'titulo',label:'Registro',fmt:(v,p)=>`<span class="code">${esc(p.codigo)}</span> <b>${esc(v)}</b><small>${esc(p.area||p.tipo)}${p.exemplo?' / Exemplo fictício':''}</small>`},
      {key:'natureza',label:'Natureza',fmt:(v,p)=>U.pill(NATUREZAS[natureza(p)],natureza(p)==='demanda'?'info':'ok'),sortVal:natureza},
      {key:'gerencia',label:'Gerência'},
      {key:'etapa',label:'Etapa',fmt:v=>GP.etapaPill(v),sortVal:p=>M.etapa(p.etapa).ordem},
      {key:'progresso',label:'Avanço',align:'r',fmt:(v,p)=>`<div class="progress-cell">${progresso(p)==null?'<span class="dim">Não informado</span>':`${fmt.n(progresso(p))}%<div class="bar"><i style="width:${progresso(p)}%"></i></div>`}</div>`,sortVal:p=>progresso(p)??-1},
      {key:'custo',label:'Custo estimado',align:'r',fmt:v=>`<span style="white-space:nowrap">${fmt.brl(v)}</span>`},
      {key:'fimPrevisto',label:'Fim previsto',fmt:(v,p)=>`<span style="${ABERTOS.includes(p.etapa)&&v&&v<hoje()?'color:var(--warn);font-weight:600':''}">${fmt.data(v)}</span>`}
    ],rowAttr:p=>`class="click" data-abrir="${p.id}" tabindex="0"`,vazioTxt:'Nenhum registro com os filtros selecionados.'})}</div>`;
  }
  function resumo(el){
    const todos=P.todos(),m=medir(todos),nivel=GP.nivel(),L=GP.NIVEIS[nivel-1],ultimos=todos.slice().sort((a,b)=>(b.atualizadoEm||b.criadoEm||'').localeCompare(a.atualizadoEm||a.criadoEm||''));
    const novas=todos.filter(p=>p.etapa==='entrada').length,triagem=todos.filter(p=>p.etapa==='triagem').length,avaliar=todos.filter(p=>p.etapa==='aprovado'&&!M.pontuar(p).completo).length,prontos=todos.filter(p=>p.etapa==='aprovado'&&M.pontuar(p).completo).length;
    el.innerHTML=`<div class="bento bento-painel">
      <section class="b-hero hero operational-hero"><div><div class="hero-eyebrow"><i></i>Projeto Maestro / Sistema de Gestão de Portfólio</div><h1>Central do portfólio</h1><p>Cadastre, organize, priorize e acompanhe as iniciativas da FE. A FEG mantém o modelo e a consistência da carteira.</p><div class="actions"><a class="btn btn-primary" href="#/novo">${icon('novo',15)} Nova iniciativa</a><button class="btn btn-ghost" data-importar-csv>${icon('upload',15)} Importar iniciativas</button><a class="btn btn-ghost" href="#/acervo">${icon('acervo',15)} Abrir carteira</a></div></div></section>
      <aside class="b-side"><div class="hero-stat level-tile"><small>Nível de uso ativo</small><div class="level-num"><strong>${nivel}</strong><span class="level-steps" aria-hidden="true">${[1,2,3].map(n=>`<i class="${n<=nivel?'on':''}"></i>`).join('')}</span></div><span>${esc(L.nome)}</span><button class="link" data-ajuda-nivel>Ver ou alterar nível</button></div>
        <section class="work-session"><div class="session-state"><span class="session-dot ${GP.storage.ok?'ok':'warn'}"></span><div><b>${GP.storage.ok?'Trabalho salvo':'Atenção ao salvamento'}</b><small>${GP.storage.ok?'Salvamento automático neste navegador / '+fmt.dataHora(GP.storage.salvoEm):'Baixe uma cópia para preservar as alterações desta sessão.'}</small></div></div><div class="actions"><button class="btn btn-ghost btn-sm" data-save-now>${icon('check',14)} Salvar agora</button><button class="btn btn-ghost btn-sm" data-backup>${icon('download',14)} Baixar cópia</button><button class="btn btn-ghost btn-sm" data-restaurar-backup>${icon('upload',14)} Continuar de backup</button></div></section></aside>
      <section class="b-full operation-flow" aria-label="Fluxo do portfólio"><a href="#/funil"><span>Entrada</span><strong>${novas}</strong><small>novas iniciativas</small></a><a href="#/funil"><span>Triagem</span><strong>${triagem}</strong><small>em análise</small></a>${nivel>=2?`<a href="#/avaliar"><span>Avaliação</span><strong>${avaliar}</strong><small>sem nota completa</small></a><a href="#/ranking"><span>Priorização</span><strong>${prontos}</strong><small>prontas para decisão</small></a>`:`<button data-nivel="2" class="locked"><span>Próxima função</span><strong>2</strong><small>ativar priorização</small></button>`}${nivel>=3?`<a href="#/carteira"><span>Planejamento</span><strong>${m.capacidade.cabem}</strong><small>novos inícios simulados</small></a>`:`<button data-nivel="3" class="locked"><span>Planejamento</span><strong>3</strong><small>ativar capacidade</small></button>`}</section>
      ${sample(m)}${kpis(m)}
      ${!m.n?`<div class="callout b-full"><span class="ic">${icon('info',17)}</span><div><p><b>Seu portfólio começa aqui.</b> Cadastre o primeiro projeto, importe uma planilha ou <button class="link" data-exemplos>carregue exemplos fictícios</button> para conhecer os gráficos. Os indicadores usam somente registros cadastrados.</p></div></div>`:''}
      <div class="card b-7">${chartHead('Distribuição por etapa','Todos os registros, incluindo concluídos e saídas. Clique para filtrar.','funil')}${hbars(m.etapas,m.n,{key:'etapa'})}${legendaEtapas()}</div>
      <div class="card b-5">${chartHead('Projetos e demandas','Natureza informada no cadastro.','carteira')}${donut([{key:'projeto',label:'Projetos',value:m.projetos,color:PALETTE[0]},{key:'demanda',label:'Demandas',value:m.demandas,color:PALETTE[1]}],m.n,'registros',{key:'natureza'})}<p class="chart-footnote">A natureza do registro é independente da etapa. Cadastros anteriores a esta versão recebem a classificação Projeto, que pode ser alterada na ficha.</p></div>
      <div class="card b-8">${chartHead('Entrada de projetos e demandas','Histórico dos cadastros a partir da data de entrada.','roadmap')}${graficoEntradas(m.serie)}</div>
      <div class="card b-4">${chartHead('Pontos para acompanhamento','Pendências calculadas a partir dos registros.','alerta')}${atencoes(m)}<div style="margin-top:15px"><a class="link" href="#/indicadores">Abrir análise completa</a></div></div>
      <div class="card b-6">${chartHead('Registros por gerência','Participação no total cadastrado.','acervo')}${hbars(m.gerencias,m.n,{key:'gerencia'})}</div>
      <div class="card b-6">${chartHead('Avanço e estimativas','Valores informados nos cadastros.','ranking')}<div class="figures"><div class="figure-ring">${ring(m.progresso==null?null:m.progresso/100,'var(--c4)',108,m.progresso==null?'-':fmt.n(m.progresso)+'%')}<div><span class="fig-lbl">Avanço médio em execução</span><span class="fig-sub">${m.comProgresso} de ${m.execucao} com avanço informado</span></div></div><div class="figure-num"><span class="fig-lbl">Custo estimado total</span><strong>${m.comCusto?fmt.mi(m.custo):'-'}</strong><span class="fig-sub">${m.comCusto} de ${m.n} com custo informado</span></div></div><p class="chart-footnote">O custo é uma estimativa dos registros e inclui todas as etapas. O avanço é a média simples dos percentuais informados para os itens em execução.</p></div>
      </div>
      ${tabela(ultimos)}`;
  }
  function atencoes(m){
    const semResp=m.lista.filter(p=>ABERTOS.includes(p.etapa)&&!p.responsavel),semAv=m.lista.filter(p=>p.etapa==='execucao'&&progresso(p)==null),semPrior=m.lista.filter(p=>p.etapa==='aprovado'&&!M.pontuar(p).completo);
    const itens=[...(m.atrasados.length?[{n:m.atrasados.length,title:'Prazos previstos vencidos',desc:'Revise datas e situação com os responsáveis.',key:'etapa',val:'execucao',href:'#/projeto/'+m.atrasados[0].id}]:[]),
      ...(m.fila?[{n:m.fila,title:'Registros na fila de entrada',desc:'Demandas novas ou em triagem aguardam análise.',href:'#/funil'}]:[]),
      ...(semResp.length?[{n:semResp.length,title:'Sem responsável definido',desc:'Aprovados, em execução ou em espera.',href:'#/novo/'+semResp[0].id}]:[]),
      ...(semPrior.length?[{n:semPrior.length,title:'Aprovados sem prioridade completa',desc:'Conclua a avaliação antes da decisão de início.',href:'#/avaliar/'+semPrior[0].id}]:[]),
      ...(semAv.length?[{n:semAv.length,title:'Em execução sem avanço informado',desc:'Atualize o percentual de avanço na ficha.',href:'#/novo/'+semAv[0].id}]:[])];
    return `<div class="attention-list">${itens.slice(0,4).map(it=>`<a class="attention-item" href="${it.href}"><span class="ic">${icon('alerta',15)}</span><p><b>${it.n} ${esc(it.title.toLowerCase())}</b>${esc(it.desc)}</p></a>`).join('')||`<div class="info-empty">${icon('check',22)}<p>${m.n?'Nenhuma pendência identificada por estas regras.':'Cadastre registros para acompanhar as pendências.'}</p></div>`}</div>`;
  }
  function indicadores(el){
    const f=filtros(),todos=P.todos(),lista=filtrar(todos,f),m=medir(lista,f),nivel=GP.nivel();let aba=GP.state().ui.abaIndicadores||'visao';if((aba==='custos'&&nivel<3)||(aba==='riscos'&&nivel<2))aba='visao';
    let html=U.pageHead({titulo:'Indicadores do portfólio',sub:'Análise dos registros da carteira sob governança do modelo Maestro. Os filtros recalculam indicadores, gráficos e base de consulta.',acoes:`<button class="btn btn-ghost" data-dicionario>${icon('info',15)} Regras dos indicadores</button><button class="btn btn-ghost" data-exportar-recorte>${icon('download',15)} Exportar recorte</button>${GP.botaoPDF()}`})+filterPanel(f);
    if(f.de&&f.ate&&f.de>f.ate){el.innerHTML=html+U.callout('<p>A data inicial do período deve ser anterior ou igual à data final. Ajuste os filtros para calcular os indicadores.</p>','warn');bindFilters(el);return;}
    html+=`<div class="scope-line"><span><b>${m.n}</b> de ${todos.length} registros / ${esc(descricaoFiltros(f))}</span><span class="live-dot"><i></i>Atualiza a cada alteração salva</span></div>${sample(m)}
      <div class="analysis-tabs" data-noprint>${[['visao','Visão geral'],['qualidade','Qualidade dos dados'],...(nivel>=3?[['custos','Custos e capacidade']]:[])].map(([k,l])=>`<button class="${k===aba?'on':''}" data-analysis-tab="${k}">${l}</button>`).join('')}${nivel<3?`<button data-nivel="3">Ativar análise de capacidade</button>`:''}</div>`;
    if(aba==='custos')html+=custos(m);
    else if(aba==='qualidade')html+=qualidade(m);
    else html+=kpis(m)+`<div class="analytics-grid"><div class="card">${chartHead('Projetos e demandas por período','Entradas do recorte, conforme o período selecionado.','roadmap')}${graficoEntradas(m.serie)}</div><div class="card">${chartHead('Composição da base','Comparação entre projetos e demandas.','carteira')}${donut([{key:'projeto',label:'Projetos',value:m.projetos,color:PALETTE[0]},{key:'demanda',label:'Demandas',value:m.demandas,color:PALETTE[1]}],m.n,'registros',{key:'natureza'})}</div></div>
      <div class="analytics-grid analytics-equal"><div class="card">${chartHead('Distribuição por etapa','Quantidade e percentual no recorte. Clique para filtrar.','funil')}${hbars(m.etapas,m.n,{key:'etapa'})}</div><div class="card">${chartHead('Distribuição por gerência','Participação no recorte. Clique para filtrar.','acervo')}${hbars(m.gerencias,m.n,{key:'gerencia'})}<div style="margin-top:24px">${chartHead('Origem das iniciativas','Quantidade por origem do cadastro.','estrela')}${hbars(m.origens.filter(i=>i.value),m.n,{key:'origem'})}</div></div></div>
      <div class="analytics-grid analytics-equal"><div class="card">${chartHead('Tipos de iniciativa','Composição do recorte por tipo.','acervo')}${hbars(m.tipos.filter(i=>i.value),m.n,{key:'tipo'})}${!m.n?'<div class="info-empty">Nenhum registro neste recorte.</div>':''}</div><div class="card">${chartHead('Resultado do checklist de entrada','Checklists completos do recorte. Não representa conversão histórica.','avaliar')}${hbars(['entra','falta_info','nao_entra'].map((k,i)=>({label:M.RESULTADO_ENTRADA[k].nome,value:lista.filter(p=>p.entrada?.resultado===k).length,color:{entra:'#6b8f2a',falta_info:'#d5a32d',nao_entra:'#b8642c'}[k]})),m.entradaAvaliada)}<p class="chart-footnote">${m.n-m.entradaAvaliada} registros sem checklist completo ficam fora desta distribuição. A admissão é a razão entre “Entra” e todos os checklists completos.</p></div></div>`;
    html+=tabela(lista,{busca:true});el.innerHTML=html;bindFilters(el);
  }
  function custos(m){
    const c=m.capacidade,cap=GP.state().capacidade,custosGer=m.gerencias.map(g=>({...g,value:sum(m.lista.filter(p=>p.gerencia===g.key&&p.custo!=null),p=>p.custo)}));
    const ratio=c.efetiva?m.fteExecucao/c.efetiva:null;
    return `<div class="metric-grid">
      ${metric('Custo estimado total',m.comCusto?fmt.mi(m.custo):'-',`${m.comCusto} de ${m.n} registros com estimativa`,{ic:'carteira'})}
      ${metric('FTE em execução',fmt.n(m.fteExecucao,1),`${m.comFteExecucao} de ${m.execucao} com FTE informado`,{tone:'#188787',ic:'carteira'})}
      ${metric('Capacidade efetiva',fmt.n(c.efetiva,1),`${fmt.n(cap.fte,1)} FTE menos ${cap.reservaPct}% de reserva`,{tone:'#477b91',ic:'config'})}
      ${metric('Uso em execução',fmt.pct(ratio),'FTE em execução / capacidade efetiva configurada',{tone:'#c39127',ic:'ranking',ratio})}
      ${metric('Novos inícios que cabem',fmt.n(c.cabem),`${c.candidatos} candidatos aprovados e avaliados`,{ic:'avaliar'})}
      ${metric('Avanço em execução',m.progresso==null?'-':fmt.n(m.progresso)+'%',`${m.comProgresso} de ${m.execucao} com avanço informado`,{tone:'#188787',ic:'check',ratio:m.progresso==null?null:m.progresso/100})}
    </div>${U.callout(`<p><b>Simulação de capacidade:</b> período ${esc(cap.periodo)}. ${GP.state().meta.capacidadeConfirmada?'Parâmetros ajustados pelo usuário.':'Os valores iniciais são sugestões e precisam de validação.'} A capacidade é global; a simulação considera somente o recorte dos filtros. <a class="link" href="#/carteira">Ajustar capacidade</a>.</p>`)}
    <div class="analytics-grid analytics-equal"><div class="card">${chartHead('Custo estimado por gerência','Soma dos valores informados. Não representa gasto realizado.','carteira')}${hbars(custosGer,m.custo,{monetario:true})}<p class="chart-footnote">${m.n-m.comCusto} registros sem custo ficam fora da soma. Custos de registros em todas as etapas entram na análise.</p></div><div class="card">${chartHead('Simulação de novos inícios','Aprovados com avaliação completa. Usa os critérios e a capacidade atuais.','ranking')}${hbars(['cabe','fixado','fixado_estoura','nao_cabe','excluido','sem_estimativa'].map((k,i)=>({label:M.STATUS_CARTEIRA[k].nome,value:c.itens.filter(it=>it.status===k).length,color:{cabe:'#6b8f2a',fixado:'#00908f',fixado_estoura:'#b8642c',nao_cabe:'#d5a32d',excluido:'#a3b2ac',sem_estimativa:'#a3b2ac'}[k]})).filter(x=>x.value),c.candidatos)}${!c.candidatos?'<div class="info-empty">Nenhum candidato aprovado e avaliado neste recorte.</div>':''}<p class="chart-footnote">${c.semNota.length} aprovados sem avaliação completa não participam da simulação. Orçamento de novos projetos: ${cap.orcamento?fmt.mi(cap.orcamento):'sem limite'}.</p></div></div>`;
  }
  function qualidade(m){
    const q=m.qualidade;
    return `<div class="metric-grid">${q.slice(0,6).map((x,i)=>metric(x.label,fmt.pct(divisao(x.num,x.den)),`${x.num} de ${x.den} / ${esc(x.desc)}`,{tone:UNICA,ic:'avaliar',ratio:divisao(x.num,x.den)})).join('')}</div>
      <div class="analytics-grid analytics-equal"><div class="card">${chartHead('Cobertura dos campos e avaliações','Percentual de registros com informação. A base de cada indicador varia.','avaliar')}${hbars(q.map((x,i)=>({label:x.label,value:x.den?x.num/x.den*100:0,color:UNICA})),100)}<p class="chart-footnote">Consulte a base de cada medida nas regras dos indicadores. Quando a base é vazia, o cartão exibe “-”. A barra fica vazia.</p></div><div class="card">${chartHead('Pendências para revisão','Registros do recorte que precisam de acompanhamento.','alerta')}${atencoes(m)}<p class="chart-footnote">A qualidade mede preenchimento e conclusão das avaliações. Não valida o conteúdo técnico informado.</p></div></div>`;
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
    doc.querySelectorAll('.modal-bg,.toast,.busy,.tip,.side-backdrop,#gp-snapshot').forEach(x=>x.remove());
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
      ...m.etapas.map(x=>['Etapa: '+x.label,x.value,m.n+' registros']),...m.gerencias.map(x=>['Gerência: '+x.label,x.value,m.n+' registros']),
      ...m.serie.pontos.map(x=>['Entradas: '+x.label,x.total,x.projetos+' projetos / '+x.demandas+' demandas'])];
    GP.exportar.baixar('indicadores-feg-'+hoje()+'.csv',GP.exportar.csv(rows),'text/csv;charset=utf-8');GP.toast('Indicadores do recorte exportados.');
  }
  GP.exportarIndicadores=()=>csvIndicadores(medir(filtrar(P.todos(),filtros()),filtros()));
  function relatorios(el){
    const f=filtros(),m=medir(filtrar(P.todos(),f),f);
    el.innerHTML=U.pageHead({titulo:'Relatórios e exportações',sub:'Gere apresentações executivas com os dados atuais e baixe a base para análise ou continuidade do trabalho.'})+filterPanel(f)+
      `<div class="scope-line"><span><b>${m.n}</b> registros nos relatórios / ${esc(descricaoFiltros(f))}</span><span>${fmt.data(hoje())}</span></div>${sample(m)}
      <div class="report-grid"><div class="report-card"><div class="report-cover"><small>PowerPoint executivo / 6 slides</small><h2>Visão executiva<br>do portfólio</h2><p>Composição, fluxo de entrada e situação da carteira.</p></div><div class="report-body"><ol><li>Visão geral e base da análise</li><li>Composição por gerência e natureza</li><li>Distribuição dos projetos por etapa</li><li>Entrada de projetos e demandas por período</li><li>Avanço, estimativas e prazos previstos</li><li>Pendências para acompanhamento executivo</li></ol><button class="btn btn-primary" data-ppt="visao">${icon('download',16)} Baixar PPT da visão executiva</button></div></div>
      <div class="report-card"><div class="report-cover gold"><small>PowerPoint executivo / 6 slides</small><h2>Priorização e decisões<br>da carteira</h2><p>Ranking, capacidade simulada e pauta do comitê.</p></div><div class="report-body"><ol><li>Base elegível e contexto da decisão</li><li>Prioridade dos projetos aprovados</li><li>Distribuição por valor e esforço</li><li>Capacidade e novos inícios simulados</li><li>Projetos que exigem decisão</li><li>Pauta sugerida para o comitê</li></ol><button class="btn btn-primary" data-ppt="decisao">${icon('download',16)} Baixar PPT de prioridades e decisões</button></div></div></div>
      <p class="report-note">Os PPTs usam o recorte acima e os critérios do modelo sob curadoria da FEG. Textos e gráficos são editáveis. Estimativas e simulações ficam identificadas. As decisões permanecem com as instâncias de governança e exemplos fictícios recebem sinalização.</p>
      <div class="grid g3" style="margin-top:20px"><div class="card stack">${U.secH('Base do recorte','Cadastros e indicadores para abrir no Excel.')}<button class="btn btn-ghost" data-exportar-recorte>${icon('download',16)} Projetos e demandas (CSV)</button><button class="btn btn-ghost" data-exportar-indicadores>${icon('download',16)} Indicadores (CSV)</button></div>
      <div class="card stack">${U.secH('Backup completo','Inclui toda a carteira, mesmo fora do recorte.')}<button class="btn btn-ghost" data-backup>${icon('download',16)} Baixar backup JSON</button><button class="btn btn-ghost" data-restaurar-backup>${icon('upload',16)} Restaurar backup</button></div>
      <div class="card stack">${U.secH('Sistema com os dados atuais','Arquivo HTML completo para reabrir ou transportar.')}<button class="btn btn-primary" data-html-atualizado>${icon('download',16)} Baixar HTML atualizado</button><p class="muted" style="font-size:11px;margin:0">Contém toda a carteira e funciona sem conexão.</p></div></div>`;
    bindFilters(el);
    if(f.de&&f.ate&&f.de>f.ate){el.querySelectorAll('[data-ppt],[data-exportar-recorte],[data-exportar-indicadores]').forEach(b=>b.disabled=true);el.insertAdjacentHTML('beforeend',U.callout('<p>Ajuste o período: a data inicial deve ser anterior ou igual à data final.</p>','warn'));}
  }
  GP.configCartoes.push({ordem:1,render:el=>{
    const st=GP.storage,meta=GP.state().meta,n=Object.keys(GP.state().ui.rascunhos||{}).length;
    el.innerHTML=U.secH('Salvamento e continuidade','Alterações registradas e rascunhos do cadastro ficam neste navegador.')+`<div class="data-status ${!st.ok?'error':''}">${icon(st.ok?'check':'alerta',17)}<b>${st.conflito?'Outra aba atualizou a carteira':st.ok?'Salvamento automático ativo':'O salvamento no navegador está indisponível'}</b></div>
      <p class="muted" style="font-size:12px;margin:0">Último salvamento: ${fmt.dataHora(st.salvoEm)}${n?` / ${n} rascunho(s) de cadastro`:''}.</p>
      <p class="muted" style="font-size:12px;margin:0">Baixe uma cópia do HTML com os dados atuais para continuar em outro computador. O salvamento local depende deste navegador e pode ser removido ao limpar seus dados.</p>
      <div class="row"><button class="btn btn-primary" data-html-atualizado>${icon('download',16)} Baixar HTML atualizado</button><button class="btn btn-ghost" data-backup>Baixar backup</button></div>
      <p class="dim" style="font-size:11px;margin:0">Última cópia do HTML: ${fmt.dataHora(meta.ultimaCopiaHtmlEm)}. Os arquivos exportados são fotografias da carteira no momento do download.</p>
      ${st.conflito?'<button class="btn btn-ghost" data-load-latest>Carregar a versão da outra aba</button>':''}
      ${GP.snapshotDisponivel?'<button class="btn btn-ghost" data-load-snapshot>Carregar os dados contidos neste HTML</button>':''}
      <button class="link" style="text-align:left;font-size:12px" data-recuperar-anterior>Recuperar a cópia local anterior</button>`;
  }});
  GP.tela({id:'painel',nivel:1,ordem:0.1,gerencial:true,titulo:'Painel do portfólio',icone:'painel',render:resumo});
  GP.tela({id:'indicadores',nivel:1,ordem:0.2,gerencial:true,titulo:'Indicadores',icone:'ranking',render:indicadores});
  GP.tela({id:'relatorios',nivel:1,ordem:0.3,gerencial:true,titulo:'Relatórios e exportações',icone:'download',render:relatorios});
  const backupOriginal=GP.exportar.exportarBackup;
  // O evento original continua sendo a fonte única do download do backup.
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-save-now]')){const ok=GP.save();GP.toast(ok?'Trabalho salvo neste navegador.':'Não foi possível salvar no navegador. Baixe uma cópia para preservar as alterações.');GP.refresh();return;}
    const b=e.target.closest('[data-analytics-filter]');if(b){Object.assign(filtros(),DEF,{[b.dataset.analyticsFilter]:b.dataset.value});GP.save();GP.go('#/indicadores');return;}
    if(e.target.closest('[data-so-reais]')){Object.assign(filtros(),DEF,{fonte:'reais'});GP.save();GP.go('#/indicadores');return;}
    if(e.target.closest('[data-limpar-analise]')){GP.state().ui.filtroIndicadores={...DEF};GP.save();GP.refresh();return;}
    const tab=e.target.closest('[data-analysis-tab]');if(tab){GP.state().ui.abaIndicadores=tab.dataset.analysisTab;GP.save();GP.refresh();return;}
    if(e.target.closest('[data-dicionario]')){dicionario();return;}
    if(e.target.closest('[data-exportar-recorte]')){P.todos().length?GP.exportar.exportarProjetos(filtrar(P.todos(),filtros())):GP.exportar.exportarProjetos([]);return;}
    if(e.target.closest('[data-exportar-indicadores]')){GP.exportarIndicadores();return;}
    if(e.target.closest('[data-html-atualizado]')){salvarHtml();return;}
    if(e.target.closest('[data-load-latest]')){GP.confirmar('Carregar versão mais recente?','<p>As alterações apenas desta sessão serão substituídas pela carteira salva pela outra aba. Baixe o HTML ou um backup desta sessão para guardar essas alterações antes de continuar.</p>','Carregar versão',()=>GP.loadLatest());return;}
    if(e.target.closest('[data-load-snapshot]')&&GP.snapshot){GP.confirmar('Carregar carteira deste HTML?',`<p>Este arquivo contém ${GP.snapshot.projetos.length} registros. Eles substituirão a carteira exibida. Guarde um backup se desejar manter os dados atuais.</p>`,'Carregar arquivo',()=>{GP.resetState(clone(GP.snapshot));GP.snapshotDisponivel=false;GP.refresh();GP.toast('Carteira do arquivo carregada.');});return;}
    if(e.target.closest('[data-recuperar-anterior]')){
      let ant;try{ant=JSON.parse(localStorage.getItem(GP.storageKey+'-anterior'));}catch(x){}
      if(!ant?.v||!Array.isArray(ant.projetos)){GP.toast('Não há uma cópia anterior disponível neste navegador.');return;}
      GP.confirmar('Recuperar cópia anterior?',`<p>A cópia de ${fmt.dataHora(ant.meta?.salvoEm)} tem ${ant.projetos.length} registros e substituirá a carteira atual. Baixe um backup antes de continuar se desejar preservar o estado atual.</p>`,'Recuperar',()=>{GP.resetState(M.migrar(ant));GP.refresh();GP.toast('Cópia anterior recuperada.');});return;
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
  GP.configCartoes.push({ordem:3,render:card});
  function gate(){document.getElementById('app').innerHTML=`<div class="auth-gate"><div class="auth-card"><img class="ons" src="${GP.LOGO_ONS}" alt="ONS"><h1>Acessar o portfólio</h1><p>Use um dos usuários cadastrados nesta cópia local.</p><form data-login><div class="form"><label class="field">Usuário ou e-mail<input class="input" name="login" autocomplete="username" required autofocus></label><label class="field">Senha<div class="password-wrap"><input class="input" name="senha" type="password" autocomplete="current-password" required><button type="button" data-show-password>Mostrar</button></div></label></div><p class="auth-error" data-login-error role="alert"></p><button class="btn btn-primary" type="submit">Entrar</button></form><p class="auth-local-note">A senha protege apenas esta cópia no navegador. Para recuperar o acesso, utilize um backup anterior sem bloqueio ou uma cópia administrada pelo responsável do portfólio.</p></div></div>`;const f=document.querySelector('[data-login]');f.querySelector('[data-show-password]').onclick=e=>{const i=f.elements.namedItem('senha'),show=i.type==='password';i.type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar':'Mostrar';};f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('[type=submit]');b.disabled=true;const u=await validar(f.elements.namedItem('login').value,f.elements.namedItem('senha').value);if(u){sessao.id=u.id;sessao.liberada=true;GP.refresh();}else{f.querySelector('[data-login-error]').textContent='Usuário ou senha não conferem.';b.disabled=false;}};}
  GP.auth={usuario,usuarios,form,validar,salvarUsuario};
  const previous=GP.afterRender;
  GP.afterRender=(el,r)=>{if(previous)previous(el,r);if(GP.state().acesso?.bloqueioLocal&&!sessao.liberada){gate();return;}const right=document.querySelector('.topbar .right'),u=usuario();if(right&&!right.querySelector('.profile-btn'))right.insertAdjacentHTML('beforeend',`<button class="profile-btn" data-profile title="Abrir configurações de usuários"><span class="profile-avatar">${iniciais(u?.nome)}</span><span class="profile-name">${esc(u?.nome||'Usuários')}</span></button>`);};
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-profile')){GP.go('#/config');return;}if(b.hasAttribute('data-user-new')){form();return;}if(b.dataset.userEdit){form(b.dataset.userEdit);return;}if(b.dataset.userDelete){const u=get(b.dataset.userDelete);if(!u)return;GP.confirmar('Excluir usuário?',`<p>${esc(u.nome)} será removido desta cópia local. Os dados da carteira permanecem.</p>`,'Excluir',()=>{GP.state().usuarios=usuarios().filter(x=>x.id!==u.id);if(GP.state().acesso.usuarioInicialId===u.id)GP.state().acesso.usuarioInicialId='';if(!GP.state().usuarios.some(x=>x.ativo&&x.senhaHash))GP.state().acesso.bloqueioLocal=false;GP.save();GP.refresh();GP.toast('Usuário excluído.');},{perigo:true});return;}if(b.hasAttribute('data-local-lock'))return;});
  document.addEventListener('change',e=>{if(e.target.matches('[data-local-lock]')){GP.state().acesso.bloqueioLocal=e.target.checked;GP.save();GP.toast(e.target.checked?'Bloqueio local ativado. Será solicitado ao reabrir o arquivo.':'Bloqueio local desativado.');}if(e.target.matches('[data-default-user]')){GP.state().acesso.usuarioInicialId=e.target.value;GP.save();GP.refresh();}});
})();

(function(){
  'use strict';
  const GP=window.GP,U=GP.ui,M=GP.modelo,P=GP.projetos,{esc,fmt,sum}=GP.util,icon=GP.icon;

  function governanca(el){
    const lista=P.todos(),abertos=lista.filter(p=>['aprovado','execucao','espera'].includes(p.etapa));
    const semResponsavel=abertos.filter(p=>!p.responsavel).length,semDatas=abertos.filter(p=>!(p.inicioPrevisto&&p.fimPrevisto)).length,semAtivo=lista.filter(p=>!p.ferramenta).length;
    const semPrioridade=lista.filter(p=>M.ETAPAS_PRIORIZAVEIS.includes(p.etapa)&&!M.pontuar(p).completo).length,nivel=GP.nivel();
    el.innerHTML=U.pageHead({titulo:'Administração do modelo',sub:'Controles da FEG para manter regras, qualidade e continuidade do portfólio.',acoes:`<button class="btn btn-ghost" data-backup>${icon('download',15)} Baixar cópia</button><button class="btn btn-primary" data-importar-csv>${icon('upload',15)} Importar iniciativas</button>`})+
      `<div class="guardian-banner"><div class="guardian-mark">${icon('config',24)}</div><div><span class="eyebrow">FEG / Projeto Maestro</span><h2>Guardiã do modelo de gestão do portfólio</h2><p>A FEG administra as regras, os critérios, a taxonomia e a qualidade consolidada. As áreas responsáveis mantêm o conteúdo e executam as iniciativas.</p></div></div>
      <div class="metric-grid governance-metrics">
        <div class="metric"><span>Nível ativo</span><strong>${nivel}</strong><small>${esc(GP.NIVEIS[nivel-1].nome)}</small></div>
        <div class="metric"><span>Sem responsável</span><strong>${fmt.n(semResponsavel)}</strong><small>iniciativas abertas</small></div>
        <div class="metric"><span>Sem datas completas</span><strong>${fmt.n(semDatas)}</strong><small>iniciativas abertas</small></div>
        <div class="metric"><span>Sem ativo relacionado</span><strong>${fmt.n(semAtivo)}</strong><small>registros da base</small></div>
        <div class="metric"><span>Sem prioridade completa</span><strong>${fmt.n(semPrioridade)}</strong><small>itens elegíveis</small></div>
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
      ${U.callout('<p><b>Escopo:</b> este sistema centraliza a gestão do portfólio, o histórico e o apoio às decisões. A execução detalhada continua no ADO ou Jira, e o inventário oficial de sistemas permanece em sua fonte corporativa.</p>')}`;
  }

  function sistemas(el){
    const lista=P.todos(),comAtivo=lista.filter(p=>p.ferramenta&&p.ferramenta.trim()),semAtivo=lista.length-comAtivo.length;
    const mapa=new Map();
    comAtivo.forEach(p=>{
      const nome=p.ferramenta.trim(),key=GP.util.normTxt(nome);
      if(!mapa.has(key))mapa.set(key,{nome,lista:[]});
      mapa.get(key).lista.push(p);
    });
    const ativos=[...mapa.values()].map(a=>{
      const abertos=a.lista.filter(p=>!['concluido','nao_entra','cancelado'].includes(p.etapa));
      const exec=a.lista.filter(p=>p.etapa==='execucao');
      const riscos=(GP.state().riscos||[]).filter(r=>a.lista.some(p=>p.id===r.projetoId)&&r.status!=='encerrado');
      return {...a,abertos:abertos.length,exec:exec.length,riscos:riscos.length,custo:sum(a.lista.filter(p=>p.custo!=null),p=>p.custo)};
    }).sort((a,b)=>b.abertos-a.abertos||a.nome.localeCompare(b.nome,'pt-BR'));
    const rows=ativos.map(a=>`<tr><td><b>${esc(a.nome)}</b></td><td>${fmt.n(a.lista.length)}</td><td>${fmt.n(a.abertos)}</td><td>${fmt.n(a.exec)}</td><td>${a.riscos?`<span class="pill t-warn"><i></i>${fmt.n(a.riscos)}</span>`:'0'}</td><td>${a.custo?fmt.mi(a.custo):'Não informado'}</td></tr>`).join('');
    el.innerHTML=U.pageHead({titulo:'Sistemas, modelos e ferramentas',sub:'Leitura do portfólio pelo ativo técnico informado em cada projeto ou demanda.'})+
      `<div class="scope-note"><b>Escopo desta visão</b><span>Consolida iniciativas relacionadas ao mesmo ativo. Não representa o inventário oficial, a criticidade operacional ou a propriedade técnica dos sistemas.</span></div>
      <div class="metric-grid system-metrics">
        <div class="metric"><span>Ativos relacionados</span><strong>${fmt.n(ativos.length)}</strong><small>Nomes distintos informados</small></div>
        <div class="metric"><span>Iniciativas vinculadas</span><strong>${fmt.n(comAtivo.length)}</strong><small>Projetos e demandas com o campo preenchido</small></div>
        <div class="metric"><span>Sem ativo relacionado</span><strong>${fmt.n(semAtivo)}</strong><small>Registros a revisar, quando aplicável</small></div>
        <div class="metric"><span>Em execução</span><strong>${fmt.n(comAtivo.filter(p=>p.etapa==='execucao').length)}</strong><small>Iniciativas vinculadas em andamento</small></div>
      </div>
      <section class="card">${U.secH('Carteira por ativo relacionado','Agrupamento pelo texto informado no cadastro. Padronize os nomes para evitar duplicidades.')}
        ${ativos.length?`<div class="portfolio-table"><table class="tbl"><thead><tr><th>Sistema, modelo ou ferramenta</th><th>Iniciativas</th><th>Abertas</th><th>Em execução</th><th>Riscos abertos</th><th>Custo estimado</th></tr></thead><tbody>${rows}</tbody></table></div>`:U.vazio('Nenhum ativo relacionado','Preencha o campo Sistema, modelo ou ferramenta relacionada nos cadastros aplicáveis.','<a class="btn btn-primary" href="#/novo">Novo cadastro</a>')}
      </section>
      <div class="grid g2 governance-detail"><section class="card">${U.secH('Para manter a visão coerente','Orientações de preenchimento.')}
        <ul class="clean-list"><li>Use o nome oficial e uma grafia única para cada ativo</li><li>Informe o ativo principal impactado pela iniciativa</li><li>Não use este campo para registrar equipe, fornecedor ou tecnologia isolada</li></ul></section>
        <section class="card">${U.secH('Responsabilidade','A associação ao ativo não muda a governança.')}
        <p class="muted">O responsável pela iniciativa atualiza o cadastro. A área técnica valida impactos no sistema, modelo ou ferramenta. A FEG monitora a consistência do portfólio e mantém o padrão de informação.</p></section></div>`;
  }

  GP.tela({id:'governanca',nivel:1,ordem:0.25,gerencial:true,titulo:'Administração do modelo',icone:'config',render:governanca});
  GP.tela({id:'sistemas',nivel:1,ordem:0.27,gerencial:true,titulo:'Sistemas e ativos',icone:'carteira',render:sistemas});
})();

(function(){
  'use strict';
  const GP=window.GP,{esc}=GP.util,icon=GP.icon;
  const oldResumo=GP.telas().find(t=>t.id==='painel')?.render;
  if(oldResumo)GP.tela({...GP.telas().find(t=>t.id==='painel'),render(el,r){oldResumo(el,r);if(GP.nivel()>=2){const table=el.querySelector('.table-tools');if(table)table.insertAdjacentHTML('beforebegin',GP.riscos.resumoPainel());}}});
  const oldIndicadores=GP.telas().find(t=>t.id==='indicadores')?.render;
  if(oldIndicadores)GP.tela({...GP.telas().find(t=>t.id==='indicadores'),render(el,r){oldIndicadores(el,r);const tabs=el.querySelector('.analysis-tabs');if(GP.nivel()>=2&&tabs&&!tabs.querySelector('[data-analysis-tab="riscos"]'))tabs.insertAdjacentHTML('beforeend','<button data-analysis-tab="riscos">Riscos</button>');if(GP.nivel()>=2&&GP.state().ui.abaIndicadores==='riscos'){const start=tabs?.nextElementSibling;let node=start;while(node){const next=node.nextElementSibling;if(!node.classList.contains('table-tools')&&!node.classList.contains('portfolio-table'))node.remove();node=next;}tabs.insertAdjacentHTML('afterend',GP.riscos.painel(GP.analytics.filtrar(GP.projetos.todos(),GP.analytics.filtros())));tabs.querySelector('[data-analysis-tab="riscos"]').classList.add('on');}}});
  GP.configCartoes.push({ordem:2,render:el=>{const ui=GP.state().ui,scale=ui.escalaInterface||'normal';el.classList.add('setting-card');el.innerHTML=GP.ui.secH('Interface e leitura','Preferências visuais salvas nesta cópia do navegador.')+`<div class="setting-row"><div><b>Tamanho da interface</b><p>Ajusta textos, cartões e controles sem depender do zoom do navegador.</p></div><select class="select" data-ui-scale><option value="compacto" ${scale==='compacto'?'selected':''}>Compacto</option><option value="normal" ${scale==='normal'?'selected':''}>Confortável</option><option value="ampliado" ${scale==='ampliado'?'selected':''}>Ampliado</option></select></div><div class="setting-row"><div><b>Menu lateral</b><p>O menu pode ficar recolhido no computador e sempre vira painel deslizante em telas menores.</p></div><button class="btn btn-ghost" data-recolher>${icon(ui.menuMini?'expandir':'recolher',15)} ${ui.menuMini?'Expandir menu':'Recolher menu'}</button></div><div class="setting-row"><div><b>Textos e separadores</b><p>Os títulos e descrições usam quebra natural. Separadores longos foram substituídos por hífen simples.</p></div><span class="pill t-ok"><i></i>Revisado</span></div>`;}});
  const applyScale=()=>{const scale=GP.state()?.ui?.escalaInterface||'normal';document.documentElement.style.setProperty('--ui-font-scale',scale==='compacto'?'.94':scale==='ampliado'?'1.08':'1');};
  const previous=GP.afterRender;GP.afterRender=(el,r)=>{if(previous)previous(el,r);applyScale();};
  document.addEventListener('change',e=>{if(e.target.matches('[data-ui-scale]')){GP.state().ui.escalaInterface=e.target.value;GP.save();applyScale();GP.refresh();}});
  if(globalThis.ResizeObserver){const observer=new ResizeObserver(entries=>{for(const entry of entries){const el=entry.target;if(el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflowX==='visible')el.classList.add('layout-overflow');else el.classList.remove('layout-overflow');}});document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body));}
})();

