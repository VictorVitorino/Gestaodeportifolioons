/* =========================================================================
   Dados e configurações (rodapé do menu)
   Extensão: GP.configCartoes — {ordem, render(el)} para cartões extras (ex.: importar/exportar)
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui, icon = GP.icon, { esc } = GP.util;
  GP.configCartoes = GP.configCartoes || [];
  function tela(el){
    const n = GP.projetos.todos().length, ex = GP.projetos.todos().filter(p => p.exemplo).length;
    el.innerHTML = U.pageHead({ titulo:'Dados e configurações', sub:'Os dados ficam salvos neste navegador. Use a exportação para guardar uma cópia ou levar para outro computador.' }) +
      `<div class="grid g2">
        <div class="card stack" style="gap:10px">${U.secH('Projetos de exemplo', 'Projetos fictícios para conhecer o sistema. Ficam marcados como "exemplo".')}
          <p class="muted" style="margin:0">${n} projeto(s) no acervo, ${ex} de exemplo.</p>
          <div class="row"><button class="btn btn-primary" data-exemplos>Carregar exemplos</button><button class="btn btn-ghost" data-remover-exemplos ${ex ? '' : 'disabled'}>Remover exemplos</button></div></div>
        <div class="card stack" style="gap:10px">${U.secH('Apagar tudo', 'Remove todos os projetos e volta às configurações iniciais.')}
          <div><button class="btn btn-danger" data-apagar ${n ? '' : 'disabled'}>${icon('lixo', 16)} Apagar todos os dados</button></div></div>
        <div data-cartoes style="display:contents"></div>
      </div>`;
    const host = el.querySelector('[data-cartoes]');
    GP.configCartoes.slice().sort((a, b) => (a.ordem || 50) - (b.ordem || 50)).forEach(c => { const d = document.createElement('div'); d.className = 'card stack'; d.style.gap = '10px'; host.appendChild(d); c.render(d); });
    el.querySelector('[data-remover-exemplos]').onclick = () => GP.confirmar('Remover projetos de exemplo?', `<p>${ex} projeto(s) marcados como exemplo serão removidos. Seus projetos não são afetados.</p>`, 'Remover', () => {
      GP.state().projetos = GP.projetos.todos().filter(p => !p.exemplo); GP.save(); GP.toast('Exemplos removidos.'); GP.refresh(); });
    el.querySelector('[data-apagar]').onclick = () => GP.confirmar('Apagar todos os dados?', '<p>Todos os projetos, avaliações e configurações serão apagados deste navegador. Recomendamos exportar um backup antes.</p>', 'Apagar tudo', () => {
      const ui = GP.state().ui; const novo = GP.modelo.estadoInicial(); novo.ui.nivel = ui.nivel; novo.ui.menuMini = ui.menuMini; GP.resetState(novo); GP.toast('Dados apagados.'); GP.refresh(); }, {perigo:true});
  }
  GP.tela({ id:'config', nivel:1, ordem:90, rodape:true, titulo:'Dados e configurações', icone:'config', render: tela });
})();
