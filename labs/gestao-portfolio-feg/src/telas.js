/* Telas provisórias (substituídas a cada passo). A ordem do menu vem de "ordem". */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui;
  const provisoria = (id, nivel, ordem, titulo, icone) => GP.tela({ id, nivel, ordem, titulo, icone,
    render(el){ el.innerHTML = U.pageHead({ titulo, sub: GP.NIVEIS[nivel - 1].nome }) + U.vazio('Em construção', 'Esta tela será entregue nos próximos passos.'); } });
  provisoria('painel', 1, 1, 'Painel', 'painel');
  provisoria('avaliar', 2, 10, 'Avaliar projetos', 'avaliar');
  provisoria('ranking', 2, 11, 'Ranking', 'ranking');
  provisoria('matriz', 2, 12, 'Matriz valor × esforço', 'matriz');
  provisoria('criterios', 2, 13, 'Critérios e pesos', 'pesos');
  provisoria('carteira', 3, 20, 'Carteira e capacidade', 'carteira');
  provisoria('roadmap', 3, 21, 'Roadmap', 'roadmap');
})();
