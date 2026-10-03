/* Telas provisórias do Passo 1 (substituídas nos próximos passos) */
(function(){
  'use strict';
  const GP = window.GP, U = GP.ui;
  const provisoria = (id, nivel, titulo, icone, extra = {}) => GP.tela(Object.assign({ id, nivel, titulo, icone,
    render(el){ el.innerHTML = U.pageHead({ titulo, sub: GP.NIVEIS[nivel - 1].nome }) + U.vazio('Em construção', 'Esta tela será entregue nos próximos passos.'); } }, extra));
  provisoria('painel', 1, 'Painel', 'painel');
  provisoria('novo', 1, 'Novo projeto', 'novo');
  provisoria('acervo', 1, 'Acervo de projetos', 'acervo');
  provisoria('funil', 1, 'Funil de entrada', 'funil');
  provisoria('avaliar', 2, 'Avaliar projetos', 'avaliar');
  provisoria('ranking', 2, 'Ranking', 'ranking');
  provisoria('matriz', 2, 'Matriz valor × esforço', 'matriz');
  provisoria('criterios', 2, 'Critérios e pesos', 'pesos');
  provisoria('carteira', 3, 'Carteira e capacidade', 'carteira');
  provisoria('roadmap', 3, 'Roadmap', 'roadmap');
  provisoria('config', 1, 'Dados e configurações', 'config', { rodape: true });
})();
