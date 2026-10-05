/* =========================================================================
   Dados e configurações (rodapé do menu)
   Seções: Dados (cópias, importação e exemplos), Acesso, Interface, Outros e Zona de risco.
   Extensão: GP.configCartoes - {ordem, secao:'dados'|'acesso'|'interface'|'outros', render(el)} para cartões extras.
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, icon = GP.icon, { esc, fmt } = GP.util;
  const plural = GP.util.plural || ((n, s, p) => fmt.n(n) + ' ' + (Math.abs(+n) === 1 ? s : p));
  GP.configCartoes = GP.configCartoes || [];
  const SECOES = [
    ['acesso', 'Acesso', 'Perfis e bloqueio desta cópia local.'],
    ['interface', 'Interface', 'Preferências de leitura salvas neste navegador.'],
    ['outros', 'Outros recursos', ''],
  ];
  const secaoH = (id, titulo, sub) => `<div class="gx-cfg-h"><h2 id="cfg-${id}">${esc(titulo)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`;

  function cartaoCopias(){
    return `${U.secH('Cópias e importação', 'Guarde uma cópia, leve a carteira para outro computador ou traga dados de uma planilha.')}
      ${GP.continuidade ? GP.continuidade() : ''}
      <div class="gx-cfg-grupos">
        <div class="gx-cfg-grupo"><b>${icon('download', 16)} Cópia de segurança</b><p>Projetos, avaliações, pesos, capacidade e riscos. Recomendado toda semana.</p>
          <div class="row"><button class="btn btn-primary" data-backup>${icon('download', 16)} Baixar backup</button><button class="btn btn-ghost" data-restaurar-backup>${icon('upload', 16)} Restaurar backup</button></div></div>
        <div class="gx-cfg-grupo"><b>${icon('arquivo', 16)} Sistema com os dados</b><p>Arquivo único que abre sem conexão, já com a carteira desta sessão.</p>
          <div class="row"><button class="btn btn-ghost" data-html-atualizado>${icon('download', 16)} Baixar HTML atualizado</button></div></div>
        <div class="gx-cfg-grupo"><b>${icon('acervo', 16)} Planilha (Excel)</b><p>Para importar, use o <button class="link" data-modelo-csv>modelo de planilha</button> salvo como “CSV UTF-8”.</p>
          <div class="row"><button class="btn btn-ghost" data-exportar-csv>${icon('download', 16)} Exportar projetos</button><button class="btn btn-ghost" data-importar-csv>${icon('upload', 16)} Importar planilha</button></div></div>
      </div>
      <p class="gx-cfg-nota">O salvamento local depende deste navegador e pode ser removido ao limpar os dados de navegação. Os arquivos exportados são fotografias da carteira no momento do download. <button class="link" data-recuperar-anterior>Recuperar a cópia local anterior</button></p>`;
  }
  function cartaoExemplos(n, ex){
    return `<div class="gx-cfg-ex"><div>${U.secH('Projetos de exemplo', 'Registros fictícios para conhecer o sistema. Ficam marcados e podem ser removidos a qualquer momento.')}
      <p class="muted gx-cfg-p">${plural(n, 'registro', 'registros')} no acervo, ${ex ? `${fmt.n(ex)} ${ex === 1 ? 'fictício' : 'fictícios'}` : 'nenhum fictício'}.</p></div>
      <div class="row">${ex
        ? `<button class="btn btn-primary" data-remover-exemplos>${icon('lixo', 15)} Remover exemplos</button><button class="btn btn-ghost" data-exemplos>Carregar exemplos</button>`
        : `<button class="btn btn-primary" data-exemplos>${icon('estrela', 15)} Carregar exemplos</button><button class="btn btn-ghost" data-remover-exemplos disabled>Remover exemplos</button>`}</div></div>`;
  }
  function tela(el, rota){
    const todos = GP.projetos.todos(), n = todos.length, ex = todos.filter(p => p.exemplo).length, temDados = n || (GP.state().riscos || []).length;
    const grupos = {}; GP.configCartoes.slice().sort((a, b) => (a.ordem || 50) - (b.ordem || 50)).forEach(c => { const s = ['dados', 'acesso', 'interface'].includes(c.secao) ? c.secao : 'outros'; (grupos[s] ||= []).push(c); });
    el.innerHTML = `<div class="gx-cfg">` + U.pageHead({ titulo:'Dados e configurações', sub:'Os dados ficam salvos neste navegador. Guarde cópias com frequência e leve a carteira para outro computador quando precisar.' }) +
      `<section class="gx-cfg-sec" data-secao="dados" aria-labelledby="cfg-dados">${secaoH('dados', 'Dados', 'Cópias, importação e registros de exemplo.')}
        <div class="card stack gx-cfg-copias">${cartaoCopias()}</div>
        <div class="card stack">${cartaoExemplos(n, ex)}</div>
        <div data-cartoes="dados" style="display:contents"></div></section>
      ${SECOES.filter(([id]) => grupos[id] && grupos[id].length).map(([id, t, s]) => `<section class="gx-cfg-sec" data-secao="${id}" aria-labelledby="cfg-${id}">${secaoH(id, t, s)}<div data-cartoes="${id}" style="display:contents"></div></section>`).join('')}
      <section class="gx-cfg-sec gx-zona" data-secao="risco" aria-labelledby="cfg-risco">${secaoH('risco', 'Zona de risco', 'Ações que não podem ser desfeitas.')}
        <div class="card gx-zona-card"><div><b>Apagar todos os dados</b><p>Remove projetos, avaliações, riscos e configurações deste navegador e volta ao estado inicial. Baixe um backup antes.</p></div>
        <button class="btn btn-danger" data-apagar ${temDados ? '' : 'disabled'}>${icon('lixo', 16)} Apagar tudo</button></div></section></div>`;
    Object.entries(grupos).forEach(([s, cs]) => { const host = el.querySelector(`[data-cartoes="${s}"]`); if(!host) return;
      cs.forEach(c => { const d = document.createElement('div'); d.className = 'card stack'; host.appendChild(d); try { c.render(d); } catch(e){ console.error(e); d.remove(); } }); });
    el.querySelector('[data-remover-exemplos]').onclick = () => GP.confirmar('Remover projetos de exemplo?', `<p>${plural(ex, 'registro marcado como exemplo será removido', 'registros marcados como exemplo serão removidos')}. Seus projetos não são afetados.</p>`, 'Remover', () => {
      GP.state().projetos = GP.projetos.todos().filter(p => !p.exemplo); GP.save(); GP.toast('Exemplos removidos.'); GP.refresh(); });
    el.querySelector('[data-apagar]').onclick = confirmarApagar;
    const alvo = rota && rota.query && rota.query.secao ? el.querySelector(`[data-secao="${CSS.escape(rota.query.secao)}"]`) : null;
    if(alvo) setTimeout(() => alvo.scrollIntoView({ block:'start' }), 0);
  }
  /** Confirmação digitada: o botão só fica ativo depois de escrever APAGAR. */
  function confirmarApagar(){
    const m = GP.modal(`<h3>Apagar todos os dados?</h3><p class="muted">Todos os projetos, avaliações, riscos e configurações serão apagados deste navegador. Esta ação não pode ser desfeita.</p>
      <p>Se quiser guardar uma cópia, cancele e use <b>Baixar backup</b> antes.</p>
      <label class="field gx-confirma">Para confirmar, digite APAGAR<input class="input" data-confirma-texto autocomplete="off" spellcheck="false" aria-describedby="gx-confirma-dica"></label><small id="gx-confirma-dica" class="dim">Letras maiúsculas ou minúsculas.</small>
      <div class="m-act"><button class="btn btn-ghost" data-close="1">Cancelar</button><button class="btn btn-danger" data-ok disabled>Apagar tudo</button></div>`);
    const inp = m.querySelector('[data-confirma-texto]'), ok = m.querySelector('[data-ok]');
    const valido = () => inp.value.trim().toUpperCase() === 'APAGAR';
    inp.addEventListener('input', () => { ok.disabled = !valido(); });
    inp.addEventListener('keydown', e => { if(e.key === 'Enter' && valido()){ e.preventDefault(); ok.click(); } });
    ok.addEventListener('click', () => { if(!valido()) return; GP.closeModal();
      const ui = GP.state().ui; const novo = GP.modelo.estadoInicial(); novo.ui.nivel = ui.nivel; novo.ui.menuMini = ui.menuMini; GP.resetState(novo); GP.toast('Dados apagados.'); GP.refresh(); });
  }
  GP.tela({ id:'config', nivel:1, ordem:90, rodape:true, titulo:'Dados e configurações', icone:'config', render: tela });
})();
