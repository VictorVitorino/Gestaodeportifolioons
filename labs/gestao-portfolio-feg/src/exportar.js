/* =========================================================================
   Importar / exportar: planilha (CSV para Excel), backup JSON e PDF das telas
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, M = GP.modelo, P = GP.projetos, { esc, fmt, hoje } = GP.util, icon = GP.icon;

  /* ----------------------------------------------------------- utilidades */
  function baixar(nome, conteudo, tipo){
    const b = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }
  const nBR = v => v == null || v === '' ? '' : String(v).replace('.', ',');
  const celula = v => { const s = String(v ?? ''); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = linhas => '﻿' + linhas.map(l => l.map(celula).join(';')).join('\r\n');
  /** Lê CSV com separador ; ou , (detectado na 1ª linha), aspas e quebras de linha dentro de aspas. */
  function lerCSV(txt){
    txt = txt.replace(/^﻿/, '');
    const prim = txt.split(/\r?\n/)[0] || '', sep = (prim.match(/;/g) || []).length >= (prim.match(/,/g) || []).length ? ';' : ',';
    const out = []; let linha = [], campo = '', aspas = false;
    for(let i = 0; i < txt.length; i++){
      const c = txt[i];
      if(aspas){ if(c === '"'){ if(txt[i + 1] === '"'){ campo += '"'; i++; } else aspas = false; } else campo += c; continue; }
      if(c === '"') aspas = true; else if(c === sep){ linha.push(campo); campo = ''; }
      else if(c === '\n' || c === '\r'){ if(c === '\r' && txt[i + 1] === '\n') i++; linha.push(campo); out.push(linha); linha = []; campo = ''; }
      else campo += c;
    }
    if(campo !== '' || linha.length){ linha.push(campo); out.push(linha); }
    return out.filter(l => l.some(x => String(x).trim() !== ''));
  }

  /* ------------------------------------------------------- exportar planilha */
  const COLUNAS = [
    ['codigo', 'Código'], ['titulo', 'Título'], ['descricao', 'Descrição'], ['beneficio', 'Benefício esperado'], ['gerencia', 'Gerência'], ['area', 'Área ou comunidade'],
    ['ferramenta', 'Ferramenta'], ['demandante', 'Demandante'], ['patrocinador', 'Patrocinador'], ['responsavel', 'Responsável'], ['tipo', 'Tipo'], ['origem', 'Origem'],
    ['obrigatorio', 'Obrigatório'], ['esforcoFte', 'Esforço (FTE)'], ['duracaoMeses', 'Duração (meses)'], ['custo', 'Custo (R$)'], ['inicioPrevisto', 'Início previsto'],
    ['fimPrevisto', 'Fim previsto'], ['link', 'Link'], ['observacoes', 'Observações'],
  ];
  function exportarProjetos(lista = P.todos()){
    const rk = M.ranking(lista.filter(p => p.etapa === 'aprovado')); const pos = Object.fromEntries(rk.map(x => [x.p.id, x.pos]));
    const cab = [...COLUNAS.map(c => c[1]), 'Etapa', 'Data de entrada', 'Resultado da entrada', 'Motivo da entrada', 'Nota de valor', 'Nota de esforço', 'Quadrante', 'Posição no ranking (aprovados)', 'Exemplo'];
    const linhas = lista.map(p => { const s = M.pontuar(p);
      return [...COLUNAS.map(([k]) => k === 'obrigatorio' ? (p.obrigatorio ? 'Sim' : 'Não') : ['esforcoFte', 'duracaoMeses', 'custo'].includes(k) ? nBR(p[k]) : ['inicioPrevisto', 'fimPrevisto'].includes(k) ? (p[k] ? fmt.data(p[k]) : '') : (p[k] ?? '')),
        M.etapa(p.etapa).nome, fmt.data(p.dataEntrada), p.entrada ? M.RESULTADO_ENTRADA[p.entrada.resultado].nome : '', p.entrada ? (p.entrada.motivos || []).join(' ') : '',
        s.valor != null ? nBR(s.valor.toFixed(1)) : '', s.esforco != null ? nBR(s.esforco.toFixed(1)) : '', s.quadrante ? M.QUADRANTES[s.quadrante].nome : '', pos[p.id] || '', p.exemplo ? 'Sim' : 'Não']; });
    baixar(`portfolio-feg-${hoje()}.csv`, csv([cab, ...linhas]), 'text/csv;charset=utf-8');
    GP.toast(`${lista.length} projeto(s) exportado(s) para planilha.`);
  }
  function baixarModelo(){
    const cab = COLUNAS.filter(c => c[0] !== 'codigo').map(c => c[1]);
    const ex = ['Automação do relatório mensal de rodadas', 'Gerar automaticamente o relatório mensal hoje feito à mão.', 'Reduzir 2 dias de trabalho por mês', 'FEN', 'Planejamento e Programação Energética', 'NEWAVE', 'Área de estudos energéticos', 'Gerente FEN', 'Nome da pessoa', 'Sustentação / melhoria', 'Operacional', 'Não', '1', '3', '150000', '01/03/2027', '31/05/2027', 'https://dev.azure.com/…', ''];
    baixar('modelo-importacao-projetos.csv', csv([cab, ex]), 'text/csv;charset=utf-8');
  }

  /* ------------------------------------------------------- importar planilha */
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const valida = (y, m, d) => { const t = new Date(Date.UTC(+y, +m - 1, +d)); return t.getUTCFullYear() === +y && t.getUTCMonth() === +m - 1 && t.getUTCDate() === +d; };
  const data = s => { s = String(s || '').trim(); if(!s) return ''; let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m) return valida(m[3], m[2], m[1]) ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : 'inválida';
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m && valida(m[1], m[2], m[3]) ? m[0] : 'inválida'; };
  const numero = s => { const n = GP.util.numBR(s); return n === '' ? '' : isNaN(n) || n < 0 ? 'inválido' : n; };
  /** Converte as linhas da planilha em projetos e valida cada um. */
  function prepararImportacao(linhas){
    if(linhas.length < 2) return { erroGeral:'A planilha precisa ter o cabeçalho e pelo menos uma linha.' };
    const cab = linhas[0].map(norm), idx = {};
    COLUNAS.forEach(([k, l]) => { const i = cab.indexOf(norm(l)); if(i >= 0) idx[k] = i; });
    const ie = cab.indexOf('etapa'); if(ie >= 0) idx.etapa = ie;
    if(idx.titulo == null) return { erroGeral:'Não encontrei a coluna "Título". Use o modelo de planilha.' };
    const titulos = new Set(P.todos().map(p => p.titulo.trim().toLowerCase()));
    const itens = linhas.slice(1).map((l, n) => {
      const v = k => idx[k] != null ? String(l[idx[k]] ?? '').trim() : '';
      const ger = M.CAT.gerencias.find(g => norm(g.id) === norm(v('gerencia')) || norm(g.nome) === norm(v('gerencia')));
      const tipo = M.CAT.tipos.find(t => norm(t) === norm(v('tipo'))), orig = M.CAT.origens.find(o => norm(o) === norm(v('origem')));
      const d = { titulo:v('titulo'), descricao:v('descricao'), beneficio:v('beneficio'), gerencia: ger ? ger.id : v('gerencia'), area:v('area'), ferramenta:v('ferramenta'),
        demandante:v('demandante'), patrocinador:v('patrocinador'), responsavel:v('responsavel'), tipo: tipo || v('tipo'), origem: orig || '', obrigatorio: /^(sim|s|x|1|true)$/i.test(v('obrigatorio')),
        esforcoFte: numero(v('esforcoFte')), duracaoMeses: numero(v('duracaoMeses')), custo: numero(v('custo')), inicioPrevisto: data(v('inicioPrevisto')), fimPrevisto: data(v('fimPrevisto')), link:v('link'), observacoes:v('observacoes') };
      const et = idx.etapa != null ? M.ETAPAS.find(e => norm(e.nome) === norm(l[idx.etapa]) || e.id === String(l[idx.etapa] || '').trim()) : null;
      const erros = Object.assign({}, M.validar(d));
      if(d.gerencia && !ger) erros.gerencia = `Gerência "${d.gerencia}" não reconhecida (use FEG, FEL, FEN ou FER).`;
      if(d.tipo && !tipo) erros.tipo = `Tipo "${d.tipo}" não reconhecido.`;
      ['esforcoFte', 'duracaoMeses', 'custo'].forEach(k => { if(d[k] === 'inválido') erros[k] = 'Número inválido.'; });
      ['inicioPrevisto', 'fimPrevisto'].forEach(k => { if(d[k] === 'inválida') erros[k] = 'Data inválida (use dd/mm/aaaa).'; });
      const t = d.titulo.toLowerCase(); if(t && titulos.has(t) && !erros.titulo) erros.titulo = 'Já existe no acervo ou repetido na planilha.'; if(t) titulos.add(t);
      return { linha: n + 2, d, erros, etapa: et ? et.id : null };
    });
    return { itens, validos: itens.filter(i => !Object.keys(i.erros).length) };
  }
  function abrirImportacao(arquivo){
    const r = new FileReader();
    r.onload = () => {
      const res = prepararImportacao(lerCSV(decodificar(r.result)));
      if(res.erroGeral){ GP.toast(esc(res.erroGeral)); return; }
      const inval = res.itens.filter(i => Object.keys(i.erros).length);
      const m = GP.modal(`<h3>Importar planilha</h3><p class="muted" style="margin:0 0 12px">${esc(arquivo.name)} · ${res.itens.length} linha(s)</p>
        <div class="row" style="margin-bottom:12px">${U.pill(`${res.validos.length} prontas para importar`, 'ok')} ${inval.length ? U.pill(`${inval.length} com erro (serão ignoradas)`, 'bad') : ''}</div>
        ${inval.length ? `<div class="tbl-wrap" style="max-height:240px;overflow:auto"><table class="tbl"><thead><tr><th>Linha</th><th>Título</th><th>Problema</th></tr></thead><tbody>${inval.map(i => `<tr><td>${i.linha}</td><td>${esc(i.d.titulo || '—')}</td><td>${Object.entries(i.erros).map(([k, e]) => `<b>${esc(M.CAMPOS[k] || k)}:</b> ${esc(e)}`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${res.itens.some(i => i.etapa && i.etapa !== 'entrada') ? `<label class="check-row" style="margin:6px 0"><input type="checkbox" data-manter-etapa><span>Manter a etapa informada na planilha (coluna “Etapa”). Sem marcar, todos entram como <b>Nova demanda</b> e passam pelo funil.</span></label>` : `<p class="muted" style="font-size:12.5px">Os projetos importados entram como <b>Nova demanda</b> e passam pelo funil de entrada.</p>`}
        <p class="dim" style="font-size:12px;margin:0">A planilha traz os dados do cadastro. Checklist de entrada, avaliações e pesos só voltam por <b>backup</b>.</p>
        <div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn btn-primary" data-confirmar ${res.validos.length ? '' : 'disabled'}>Importar ${res.validos.length} projeto(s)</button></div>`, { largo:true });
      m.querySelector('[data-confirmar]').onclick = () => { const manter = !!(m.querySelector('[data-manter-etapa]') || {}).checked; let n = 0;
        res.validos.forEach(i => { const x = P.criar(i.d); if(x.ok){ n++; P.registrar(x.projeto, 'Importação', `Importado da planilha ${arquivo.name} (linha ${i.linha}).`); if(manter && i.etapa && i.etapa !== 'entrada') P.mudarEtapa(x.projeto.id, i.etapa, 'Etapa trazida da planilha.'); } });
        GP.save(); GP.closeModal(); GP.toast(`${n} projeto(s) importado(s).`); GP.go('#/acervo'); };
    };
    r.readAsArrayBuffer(arquivo);
  }
  /** Lê o arquivo como UTF-8; se não for UTF-8 válido (CSV "ANSI" do Excel), usa Windows-1252. */
  const decodificar = buf => { try { return new TextDecoder('utf-8', { fatal:true }).decode(buf); } catch(e){ return new TextDecoder('windows-1252').decode(buf); } };

  /* ------------------------------------------------------------ backup JSON */
  function exportarBackup(){
    const S = GP.state();
    baixar(`backup-portfolio-feg-${hoje()}.json`, JSON.stringify({ tipo:'BACKUP_GESTAO_PORTFOLIO_FEG', versao:M.VERSAO, exportadoEm:new Date().toISOString(), estado:S }, null, 2), 'application/json');
    GP.toast('Backup gerado.');
  }
  function restaurarBackup(arquivo){
    const r = new FileReader();
    r.onload = () => { let j; try { j = JSON.parse(String(r.result)); } catch(e){ GP.toast('Arquivo inválido: não é um JSON.'); return; }
      if(!j || j.tipo !== 'BACKUP_GESTAO_PORTFOLIO_FEG' || !j.estado || typeof j.estado !== 'object' || !Array.isArray(j.estado.projetos)){ GP.toast('Este arquivo não é um backup do sistema.'); return; }
      let est; try { est = M.migrar(JSON.parse(JSON.stringify(j.estado))); } catch(e){ GP.toast('Backup corrompido: não foi possível ler os dados.'); return; }
      const descartados = j.estado.projetos.length - est.projetos.length;
      const quando = fmt.dataHora(j.exportadoEm);
      GP.confirmar('Restaurar backup?', `<p>Backup ${quando !== '—' ? 'de ' + quando : 'sem data'} com <b>${est.projetos.length} projeto(s) válido(s)</b>${descartados ? ` (${descartados} registro(s) inválido(s) serão descartados)` : ''}. Os dados atuais deste navegador serão substituídos.</p>`, 'Restaurar', () => {
        const ui = GP.state().ui; est.ui = Object.assign({}, est.ui, { nivel: ui.nivel, menuMini: ui.menuMini }); GP.resetState(est); GP.toast('Backup restaurado.'); GP.go('#/painel'); }); };
    r.readAsText(arquivo, 'utf-8');
  }
  const escolherArquivo = (aceita, fn) => { const i = document.createElement('input'); i.type = 'file'; i.accept = aceita; i.style.display = 'none'; i.onchange = () => { if(i.files[0]) fn(i.files[0]); i.remove(); }; document.body.appendChild(i); i.click(); };

  /* ------------------------------------------------------------------ PDF */
  GP.botaoPDF = () => `<button class="btn btn-ghost" data-pdf>${icon('pdf', 16)} Salvar PDF</button>`;
  async function exportarPDF(){
    const el = document.getElementById('conteudo'); if(!el) return;
    if(!window.html2canvas || !window.jspdf){ GP.toast('Exportação de PDF indisponível neste modo.'); return; }
    GP.busy(true, 'Gerando PDF…');
    try {
      if(document.fonts && document.fonts.ready) await document.fonts.ready;
      const titulo = (document.querySelector('.topbar .ttl b') || {}).textContent || 'Portfólio';
      const w = document.createElement('div'); w.style.cssText = 'position:absolute;left:-20000px;top:0;width:1240px;background:#fff;padding:28px';
      w.innerHTML = `<div style="display:flex;align-items:center;gap:14px;border-bottom:1px solid #E4E3E4;padding-bottom:12px;margin-bottom:18px">${GP.logoFEG(34)}<div><b style="font-size:15px">Gestão de Portfólio · FEG</b><div style="font-size:12px;color:#5E655F">${esc(titulo)} · ${fmt.data(hoje())}</div></div><img src="${GP.LOGO_ONS}" style="height:30px;margin-left:auto"></div>`;
      const c = el.cloneNode(true);
      c.querySelectorAll('select').forEach((s, i) => { const o = el.querySelectorAll('select')[i]; const t = document.createElement('span'); t.textContent = o && o.selectedOptions[0] ? o.selectedOptions[0].textContent : ''; s.replaceWith(t); });
      c.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range])').forEach((x, i) => { const t = document.createElement('div'); t.className = 'input'; t.textContent = x.value; x.replaceWith(t); });
      c.querySelectorAll('.actions, button, input[type=range], [data-noprint]').forEach(x => x.remove()); w.appendChild(c); document.body.appendChild(w);
      const escala = 1.6, topo = w.getBoundingClientRect().top;
      const cortes = [...w.querySelectorAll('tr, .card, .page-h, .g-row, .callout, .kpi')].map(x => Math.round((x.getBoundingClientRect().bottom - topo) * escala)).sort((a, b) => a - b);
      const cv = await window.html2canvas(w, { scale:escala, backgroundColor:'#ffffff', logging:false, windowWidth:1300 }); w.remove();
      const pdf = new window.jspdf.jsPDF({ orientation:'landscape', unit:'pt', format:'a4', compress:true });
      const PW = pdf.internal.pageSize.getWidth(), PH = pdf.internal.pageSize.getHeight(), M0 = 20, util = PW - 2 * M0, alt = PH - 2 * M0 - 12;
      const pxPag = cv.width * alt / util; let y = 0, pg = 0;
      while(y < cv.height){ let h = Math.min(pxPag, cv.height - y);
        if(y + h < cv.height){ const bom = cortes.filter(k => k > y + pxPag * 0.5 && k <= y + h).pop(); if(bom) h = bom - y; }
        const part = document.createElement('canvas'); part.width = cv.width; part.height = h; part.getContext('2d').drawImage(cv, 0, y, cv.width, h, 0, 0, cv.width, h);
        if(pg) pdf.addPage(); pdf.addImage(part.toDataURL('image/jpeg', .92), 'JPEG', M0, M0, util, h * util / cv.width); y += h; pg++;
        pdf.setFontSize(8); pdf.setTextColor(120); pdf.text(`Gestão de Portfólio FEG · ${titulo} · ${fmt.data(hoje())} · página ${pg}`, M0, PH - 10); }
      pdf.save(`portfolio-feg-${titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${hoje()}.pdf`);
      GP.toast('PDF gerado. Se o download não começar, abra o arquivo no Chrome ou Edge.');
    } catch(e){ console.error(e); GP.toast('Não foi possível gerar o PDF neste visualizador. Abra o arquivo no Chrome ou Edge.'); }
    finally { GP.busy(false); }
  }

  /* ---------------------------------------------------- ligações na interface */
  document.addEventListener('click', e => {
    if(e.target.closest('[data-pdf]')) exportarPDF();
    else if(e.target.closest('[data-exportar-csv]')) exportarProjetos();
    else if(e.target.closest('[data-modelo-csv]')) baixarModelo();
    else if(e.target.closest('[data-importar-csv]')) escolherArquivo('.csv,text/csv', abrirImportacao);
    else if(e.target.closest('[data-backup]')) exportarBackup();
    else if(e.target.closest('[data-restaurar-backup]')) escolherArquivo('.json,application/json', restaurarBackup);
  });
  GP.configCartoes.push({ ordem:10, render: el => { el.innerHTML = `${U.secH('Planilha (Excel)', 'Exporte o acervo ou importe vários projetos de uma vez.')}
      <div class="row"><button class="btn btn-primary" data-exportar-csv>${icon('download', 16)} Exportar projetos</button><button class="btn btn-ghost" data-importar-csv>${icon('upload', 16)} Importar planilha</button></div>
      <p class="muted" style="margin:0;font-size:12.5px">Para importar, use o <span class="link" data-modelo-csv>modelo de planilha</span>. Salve no Excel como “CSV UTF-8”.</p>`; } });
  GP.configCartoes.push({ ordem:20, render: el => { el.innerHTML = `${U.secH('Backup', 'Cópia completa: projetos, avaliações, pesos e capacidade.')}
      <div class="row"><button class="btn btn-primary" data-backup>${icon('download', 16)} Baixar backup</button><button class="btn btn-ghost" data-restaurar-backup>${icon('upload', 16)} Restaurar backup</button></div>
      <p class="muted" style="margin:0;font-size:12.5px">Recomendado semanalmente. Os dados ficam só neste navegador.</p>`; } });
  GP.exportar = { lerCSV, prepararImportacao, exportarProjetos, exportarPDF };
})();
