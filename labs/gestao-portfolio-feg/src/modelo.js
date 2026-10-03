/* =========================================================================
   Gestão de Portfólio FEG — modelo de dados (catálogos, estado inicial)
   ========================================================================= */
(function(){
  'use strict';
  const GP = window.GP;
  const VERSAO = 1;

  /** Catálogos (sugestões; editáveis no futuro). Gerências conforme o novo modelo da FE. */
  const CAT = {
    gerencias: [
      { id:'FEG', nome:'FEG · Governança e Estratégia de Ferramentas Eletroenergéticas' },
      { id:'FEL', nome:'FEL · Ferramentas Elétricas' },
      { id:'FEN', nome:'FEN · Ferramentas Energéticas' },
      { id:'FER', nome:'FER · Ferramentas para Recursos e Carga' },
    ],
  };

  function estadoInicial(){
    return { v: VERSAO, projetos: [], seq: 0, ui: { nivel: 1, menuMini: false } };
  }
  function migrar(S){
    S.ui = Object.assign({ nivel: 1, menuMini: false }, S.ui || {});
    S.projetos = S.projetos || [];
    S.seq = S.seq || 0;
    S.v = VERSAO;
    return S;
  }
  GP.modelo = { VERSAO, CAT, estadoInicial, migrar };
})();
