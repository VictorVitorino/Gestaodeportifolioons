/* Manual interativo · Gestão de Portfólio FEG
   Cada módulo é um clipe guiado por uma linha do tempo: a câmera aproxima o ponto da tela, o fundo escurece,
   desfoca ou fica transparente, uma seta com texto aponta o alvo, o cursor demonstra o clique e as dicas
   numeradas abrem tooltips. Tudo é função do tempo, então pausar, voltar, avançar e arrastar a linha do tempo
   mostram sempre o quadro certo. Dados: window.MANUAL (cenas + imagens) e window.MANUAL_CONTEUDO. */
(function(){
  'use strict';
  const D = window.MANUAL, C = window.MANUAL_CONTEUDO;
  const W = 1440, H = 900, APP = 'gestao-portfolio-feg.html';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const reduzMov = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- ícones */
  const IC = Object.assign({}, D.icones, {
    play: '<path d="M8 5.5v13a1 1 0 001.5.86l10.2-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
    reiniciar: '<path d="M4 12a8 8 0 108-8 8.2 8.2 0 00-5.7 2.4L4 8.7"/><path d="M4 4v4.7h4.7"/>',
    ant: '<path d="M6 5v14"/><path d="M18 6l-8.5 6 8.5 6z" fill="currentColor"/>',
    prox: '<path d="M18 5v14"/><path d="M6 6l8.5 6L6 18z" fill="currentColor"/>',
    zmais: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4M8.5 11h5M11 8.5v5"/>',
    zmenos: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4M8.5 11h5"/>',
    ajustar: '<path d="M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4M20 15v4a1 1 0 01-1 1h-4M9 20H5a1 1 0 01-1-1v-4"/>',
    tela: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    sairtela: '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>',
    cc: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M10.2 10.2a2.2 2.2 0 100 3.6M16.6 10.2a2.2 2.2 0 100 3.6"/>',
    voz: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>',
    mudo: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    externo: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    lista: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    teclado: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7 14h10"/>',
    escurecer: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 000 16z" fill="currentColor"/>',
    desfocar: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" stroke-dasharray="2 2.6"/><circle cx="12" cy="12" r="9.5" stroke-dasharray="1.5 3"/>',
    transparente: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h5v5H4zM9 4h5v5H9zM14 9h6v5h-6zM9 14h5v6H9z" fill="currentColor" stroke="none" opacity=".45"/>',
    normal: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 15l5-4.5 4 3.5 3-2.5 5 4"/>',
    cursor: '<path d="M5 3.5l13 7.2-5.6 1.4 3.4 6.4-2.4 1.2-3.3-6.4L5.8 17z"/>',
    trofeu: '<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  });
  const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${IC[n] || IC.info || ''}</svg>`;

  /* ---------------------------------------------------------------- estado persistido */
  const CHAVE = 'gp-manual-v1';
  const P = (() => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch(e){ return {}; } })();
  P.visto = P.visto || {}; P.quiz = P.quiz || {}; P.pref = Object.assign({ modo: 'escurecer', cc: true, narr: false, vel: 1 }, P.pref || {});
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(P)); } catch(e){} };

  const NIVEL = { 1: { nome: 'Operação', amb: 'operacao' }, 2: { nome: 'Priorizar', amb: 'priorizacao' }, 3: { nome: 'Planejar', amb: 'planejamento' } };
  const MODOS = [
    { id: 'escurecer', nome: 'Escurecer', dica: 'Escurece o resto da tela e mantém o ponto explicado aceso' },
    { id: 'desfocar', nome: 'Desfocar', dica: 'Desfoca o resto da tela para destacar o contexto' },
    { id: 'transparente', nome: 'Transparente', dica: 'Remove o fundo: só o trecho explicado fica visível, como um recorte' },
    { id: 'normal', nome: 'Normal', dica: 'Tela inteira sem efeito, só com o contorno do alvo' },
  ];
  const VELS = [0.75, 1, 1.25, 1.5, 2];
  const ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3];

  /* duração de cada cena: tempo das animações + leitura confortável do texto + uma janela por dica */
  const MODS = D.modulos.map((m, mi) => {
    let ini = 0;
    const cenas = m.cenas.map((c, i) => {
      const palavras = (c.titulo + ' ' + c.texto).split(/\s+/).length;
      const dur = Math.max(c.dur || 0, 5.6 + palavras * 0.34 + c.dicas.length * 3.1);
      const o = Object.assign({}, c, { i, ini, dur }); ini += dur; return o;
    });
    return Object.assign({}, m, { mi, cenas, total: ini });
  });
  const modPorId = id => MODS.find(m => m.id === id);
  const TEMPO_TOTAL = MODS.reduce((a, m) => a + m.total, 0);

  /* ---------------------------------------------------------------- casca */
  const raiz = document.getElementById('manual');
  const totalVistos = () => MODS.filter(m => P.visto[m.id]).length;
  function casca(){
    raiz.innerHTML = `
      <a class="skip" href="#mt-main">Pular para o conteúdo</a>
      <header class="mt-top">
        <a class="mt-brand" href="#/" aria-label="Início do manual">
          <svg class="mono" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#3E6801"/><text x="20" y="25.5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Segoe UI,Inter,Arial,sans-serif" letter-spacing=".5">FEG</text></svg>
          <span><b>Manual interativo</b><small>Gestão de Portfólio FEG</small></span>
        </a>
        <div class="mt-top-prog" title="Módulos assistidos até o fim">
          <span class="anel" data-prog-anel></span><span data-prog-txt></span>
        </div>
        <div class="mt-top-acoes">
          <button type="button" class="mt-ghost" data-atalhos>${ic('teclado')}<span>Atalhos</span></button>
          <a class="mt-btn-app" href="${APP}" target="_blank" rel="noopener">${ic('externo', 16)}<span>Abrir o sistema</span></a>
          <img class="ons" src="${D.logoOns}" alt="ONS" width="64" height="32">
        </div>
      </header>
      <div class="mt-shell">
        <nav class="mt-side" aria-label="Módulos do manual" data-side></nav>
        <main id="mt-main" class="mt-main" tabindex="-1" data-main></main>
      </div>`;
    $('[data-atalhos]').onclick = abrirAtalhos;
  }
  function atualizarProgresso(){
    const n = totalVistos(), pct = n / MODS.length;
    const a = $('[data-prog-anel]'); if(a) a.innerHTML = `<svg width="30" height="30" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(25,53,47,.12)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="#3E6801" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(94.25 * pct).toFixed(1)} 94.25" transform="rotate(-90 18 18)"/></svg>`;
    const t = $('[data-prog-txt]'); if(t) t.innerHTML = `<b>${n} de ${MODS.length}</b> módulos`;
  }
  function lateral(atual){
    const s = $('[data-side]');
    s.innerHTML = `<a class="side-home ${!atual ? 'on' : ''}" href="#/">${ic('painel', 17)}<span>Visão geral do treinamento</span></a>` +
      C.trilhas.map(tr => `<div class="side-trilha n${tr.nivel}">
        <div class="side-tt"><i></i>${esc(tr.titulo)}<small>Nível ${tr.nivel} · ${NIVEL[tr.nivel].nome}</small></div>
        <ol>${tr.modulos.map(id => { const m = modPorId(id); const ok = P.visto[id];
          return `<li><a href="#/${id}" class="side-mod ${atual === id ? 'on' : ''} ${ok ? 'ok' : ''}" ${atual === id ? 'aria-current="page"' : ''}>
            <span class="side-ic">${ic(m.icone, 17)}</span>
            <span class="side-txt"><b>${esc(m.titulo)}</b><small>${m.cenas.length} passos · ${mmss(m.total)}</small></span>
            <span class="side-ok" aria-label="${ok ? 'Assistido' : 'Não assistido'}">${ok ? ic('check', 14) : ''}</span></a></li>`; }).join('')}</ol></div>`).join('');
    atualizarProgresso();
  }

  /* ---------------------------------------------------------------- visão geral */
  function inicio(){
    player.parar(true);
    document.documentElement.dataset.ambiente = 'gerencial';
    lateral(null);
    const ultimo = P.ultimo && modPorId(P.ultimo.mod);
    const prox = MODS.find(m => !P.visto[m.id]) || MODS[0];
    const thumb = m => D.mini[m.cenas[0].id] || D.img[m.cenas[0].id];
    $('[data-main]').innerHTML = `
      <section class="hm-hero">
        <div class="hm-hero-txt">
          <span class="eyebrow"><i></i>Treinamento · ${MODS.length} módulos · ${MODS.reduce((a, m) => a + m.cenas.length, 0)} passos · ${Math.round(TEMPO_TOTAL / 60)} min</span>
          <h1>Aprenda o sistema vendo, <em>fazendo</em> e confirmando.</h1>
          <p>Cada módulo é um clipe curto, gravado na tela real do sistema. A câmera aproxima o ponto certo, a seta mostra onde clicar e as dicas numeradas explicam cada detalhe. Pause, volte, aproxime e experimente quando quiser.</p>
          <div class="hm-cta">
            <a class="mt-btn" href="#/${(ultimo || prox).id}">${ic('play', 16)}<span>${ultimo && !P.visto[ultimo.id] ? 'Continuar' : totalVistos() ? 'Próximo módulo' : 'Começar'}: ${esc((ultimo && !P.visto[ultimo.id] ? ultimo : prox).titulo)}</span></a>
            <a class="mt-btn-sec" href="#trilhas">${ic('lista', 16)}<span>Ver as trilhas</span></a>
          </div>
        </div>
        <div class="hm-hero-vis" aria-hidden="true">
          <div class="hm-tela"><img src="${thumb(MODS[0]) }" alt=""><span class="hm-foco"></span><span class="hm-cur">${ic('cursor', 26)}</span></div>
          <div class="hm-ctrl">${['reiniciar', 'play', 'stop'].map(n => `<span>${ic(n, 15)}</span>`).join('')}<i></i></div>
        </div>
      </section>

      <section class="hm-metodo" aria-labelledby="hm-met">
        <div class="hm-sec-h"><span class="eyebrow"><i></i>Modelo de treinamento</span><h2 id="hm-met">Microaprendizagem guiada em três tempos</h2>
          <p>Em vez de uma apostila longa, cada tarefa do dia a dia vira um clipe de um a dois minutos. Quem aprende assiste, faz no sistema e confirma, no próprio ritmo.</p></div>
        <ol class="hm-passos">${C.metodo.map(m => `<li><span class="n">${m.n}</span><b>${esc(m.titulo)}</b><p>${esc(m.texto)}</p><small>${esc(m.tempo)}</small></li>`).join('')}</ol>
        <div class="hm-legenda" aria-label="Recursos do player">
          ${[['play', 'Play e pause', 'Barra de espaço'], ['stop', 'Parar e reiniciar', 'Teclas S e R'], ['zmais', 'Zoom in e zoom out', 'Teclas + e −'], ['transparente', 'Fundo escuro, desfocado ou transparente', 'Tecla B'], ['seta', 'Setas, textos e cursor', 'Mostram onde clicar'], ['voz', 'Narração e legendas', 'Teclas N e C']].map(([i, t, s]) => `<div><span>${ic(i, 18)}</span><b>${t}</b><small>${s}</small></div>`).join('')}
        </div>
      </section>

      <section class="hm-trilhas" id="trilhas" aria-labelledby="hm-tri">
        <div class="hm-sec-h"><span class="eyebrow"><i></i>Trilhas por perfil</span><h2 id="hm-tri">Escolha por onde começar</h2>
          <p>As trilhas seguem os níveis do sistema. Quem cadastra começa pela essencial; quem prioriza e planeja segue para as próximas.</p></div>
        ${C.trilhas.map(tr => { const ms = tr.modulos.map(modPorId), feitos = ms.filter(m => P.visto[m.id]).length;
          return `<div class="hm-trilha n${tr.nivel}">
          <div class="hm-tr-h"><span class="nv">Nível ${tr.nivel} · ${NIVEL[tr.nivel].nome}</span><h3>${esc(tr.titulo)}</h3><p>${esc(tr.publico)}</p>
            <div class="hm-tr-meta"><span>${ms.length} módulos · ${Math.round(ms.reduce((a, m) => a + m.total, 0) / 60)} min</span><span class="barra"><i style="width:${(feitos / ms.length * 100).toFixed(0)}%"></i></span><span>${feitos}/${ms.length}</span></div></div>
          <div class="hm-cards">${ms.map(m => `<a class="hm-card ${P.visto[m.id] ? 'ok' : ''}" href="#/${m.id}">
            <span class="hm-thumb"><img src="${thumb(m)}" alt="" loading="lazy"><span class="hm-play">${ic('play', 18)}</span><span class="hm-dur">${mmss(m.total)}</span></span>
            <span class="hm-card-b"><span class="hm-ic">${ic(m.icone, 16)}</span><b>${esc(m.titulo)}</b><small>${esc(m.subtitulo)}</small>
            <span class="hm-card-f">${m.cenas.length} passos${P.visto[m.id] ? `<span class="ok">${ic('check', 13)} Assistido</span>` : ''}${P.quiz[m.id] ? `<span class="ok">${ic('trofeu', 13)} Confirmado</span>` : ''}</span></span></a>`).join('')}</div></div>`; }).join('')}
      </section>
      <footer class="hm-rodape">Manual do sistema Gestão de Portfólio FEG · ONS. As telas mostram dados de exemplo. Funciona sem internet e guarda o seu progresso neste navegador.</footer>`;
  }

  /* ---------------------------------------------------------------- player */
  const player = (() => {
    let mod = null, T = 0, tocando = false, raf = 0, ultimoTs = 0, idx = -1, fim = false;
    let uz = 1, pan = { x: 0, y: 0 }, posHot = [], rCallout = null, hoverDica = null, fixaDica = null, falando = false, ladoCache = {};
    let el = {};

    const cenaEm = t => { const cs = mod.cenas; for(let i = cs.length - 1; i >= 0; i--) if(t >= cs[i].ini) return cs[i]; return cs[0]; };

    function montar(m, i0, tocar){
      parar(true);
      mod = m; T = i0 ? m.cenas[clamp(i0, 0, m.cenas.length - 1)].ini : 0; idx = -1; fim = false; uz = 1; pan = { x: 0, y: 0 }; ladoCache = {};
      P.ultimo = { mod: m.id }; salvar();
      document.documentElement.dataset.ambiente = NIVEL[m.nivel] ? NIVEL[m.nivel].amb : 'gerencial';
      lateral(m.id);
      const q = C.quiz[m.id], prox = MODS[m.mi + 1];
      $('[data-main]').innerHTML = `
      <section class="pl" data-modo="${P.pref.modo}" aria-labelledby="pl-tt">
        <div class="pl-head">
          <div class="pl-tt">
            <span class="pl-eyebrow n${m.nivel}"><span class="nv">Nível ${m.nivel} · ${NIVEL[m.nivel].nome}</span>Módulo ${m.mi + 1} de ${MODS.length} · ${m.cenas.length} passos · ${mmss(m.total)}</span>
            <h1 id="pl-tt">${esc(m.titulo)}</h1><p>${esc(m.subtitulo)}</p>
          </div>
          <div class="pl-fundo" role="radiogroup" aria-label="Fundo durante a explicação">
            <span class="pl-fundo-l">Fundo</span>
            ${MODOS.map(o => `<button type="button" role="radio" aria-checked="${P.pref.modo === o.id}" data-modo="${o.id}" aria-label="${o.nome}" title="${esc(o.dica)}">${ic(o.id, 16)}<span>${o.nome}</span></button>`).join('')}
          </div>
        </div>

        <div class="pl-frame" data-frame>
          <div class="stage" data-stage tabindex="0" role="region" aria-roledescription="clipe" aria-label="Clipe do módulo ${esc(m.titulo)}. Barra de espaço toca ou pausa.">
            <div class="cam" data-cam>
              <img class="lay base" data-base alt="" draggable="false">
              <div class="lay foco" data-foco><img data-foco-img alt="" draggable="false"></div>
              <img class="lay prev" data-prev alt="" draggable="false">
            </div>
            <svg class="ovl" data-ovl aria-hidden="true">
              <rect class="halo" data-halo rx="16"/><rect class="ring" data-ring rx="14"/>
              <path class="arrow" data-arrow/><path class="arrow-h" data-arrow-h/>
            </svg>
            <div class="callout" data-callout aria-hidden="true"></div>
            <div class="hots" data-hots></div>
            <div class="tipcard" data-tip role="tooltip" id="pl-tip" hidden></div>
            <div class="cursor" data-cursor aria-hidden="true">${ic('cursor', 30)}<i class="ripple" data-ripple></i></div>
            <div class="zoom-ind" data-zind aria-live="polite"></div>
            <div class="pausa-ind" data-pind aria-hidden="true">${ic('pause', 26)}</div>
            <div class="cover" data-cover></div>
          </div>
          <div class="caption" data-caption aria-live="polite"></div>
          <div class="ctrl" role="group" aria-label="Controles do clipe">
            <div class="tl" data-tl role="slider" tabindex="0" aria-label="Linha do tempo do módulo" aria-valuemin="0" aria-valuemax="${Math.round(m.total)}">
              ${m.cenas.map(c => `<span class="tl-seg" style="flex-grow:${c.dur.toFixed(2)}" data-seg="${c.i}" title="Passo ${c.i + 1}: ${esc(c.titulo)}"><i data-fill></i></span>`).join('')}
              <span class="tl-knob" data-knob></span><span class="tl-hover" data-tlh hidden></span>
            </div>
            <div class="ctrl-row">
              <div class="ctrl-g">
                <button type="button" class="cb" data-acao="reiniciar" title="Reiniciar o módulo (R)" aria-label="Reiniciar">${ic('reiniciar')}</button>
                <button type="button" class="cb" data-acao="ant" title="Passo anterior (←)" aria-label="Passo anterior">${ic('ant')}</button>
                <button type="button" class="cb cb-play" data-acao="play" title="Tocar (espaço)" aria-label="Tocar">${ic('play', 20)}</button>
                <button type="button" class="cb" data-acao="stop" title="Parar e voltar ao início (S)" aria-label="Parar">${ic('stop')}</button>
                <button type="button" class="cb" data-acao="prox" title="Próximo passo (→)" aria-label="Próximo passo">${ic('prox')}</button>
                <span class="tempo" data-tempo></span>
              </div>
              <div class="ctrl-g">
                <span class="zoom-g" role="group" aria-label="Zoom">
                  <button type="button" class="cb" data-acao="zmenos" title="Zoom out (−)" aria-label="Diminuir zoom">${ic('zmenos')}</button>
                  <button type="button" class="cb cb-txt" data-acao="ajustar" title="Ajustar ao clipe (0)" aria-label="Ajustar zoom" data-zval>100%</button>
                  <button type="button" class="cb" data-acao="zmais" title="Zoom in (+)" aria-label="Aumentar zoom">${ic('zmais')}</button>
                </span>
                <button type="button" class="cb cb-txt" data-acao="vel" title="Velocidade" aria-label="Velocidade" data-vel></button>
                <button type="button" class="cb" data-acao="cc" title="Legendas (C)" aria-label="Legendas" aria-pressed="${P.pref.cc}">${ic('cc')}</button>
                <button type="button" class="cb" data-acao="narr" title="Narração em voz (N)" aria-label="Narração" aria-pressed="${P.pref.narr}" data-narr>${ic(P.pref.narr ? 'voz' : 'mudo')}</button>
                <button type="button" class="cb" data-acao="tela" title="Tela cheia (F)" aria-label="Tela cheia" data-tela>${ic('tela')}</button>
              </div>
            </div>
          </div>
        </div>

        <ol class="pl-steps" data-steps aria-label="Passos do módulo">${m.cenas.map(c => `<li><button type="button" data-ir="${c.i}"><span class="n">${c.i + 1}</span><span class="t">${esc(c.titulo)}</span></button></li>`).join('')}</ol>

        <div class="pl-below">
          <section class="roteiro" aria-labelledby="rot-h">
            <h2 id="rot-h">${ic('lista', 18)} Roteiro do módulo</h2>
            <ol>${m.cenas.map(c => `<li data-rot="${c.i}"><span class="n">${c.i + 1}</span><div><b>${esc(c.titulo)}</b><p>${esc(c.texto)}</p>
              ${c.dicas.length ? `<ul class="rot-dicas">${c.dicas.map((d, j) => `<li><span>${j + 1}</span><b>${esc(d.titulo)}:</b> ${esc(d.texto)}</li>`).join('')}</ul>` : ''}
              <div class="rot-acoes"><button type="button" class="lnk" data-ir="${c.i}">${ic('play', 13)} Ver este passo</button>
              <a class="lnk" href="${APP}${esc(c.rota)}" target="_blank" rel="noopener" title="Abre o sistema nesta tela${c.nivel > 1 ? `. Se a tela não aparecer, ligue o nível ${c.nivel} no topo do sistema` : ''}">${ic('externo', 13)} Experimente no sistema</a></div></div></li>`).join('')}</ol>
          </section>
          <aside class="quiz" data-quiz aria-labelledby="quiz-h">${q ? quizHtml(m, q) : ''}</aside>
        </div>
        <nav class="pl-nav" aria-label="Navegação entre módulos">
          ${m.mi > 0 ? `<a href="#/${MODS[m.mi - 1].id}" class="pl-nav-a">${ic('voltar', 16)}<span><small>Anterior</small>${esc(MODS[m.mi - 1].titulo)}</span></a>` : '<span></span>'}
          ${prox ? `<a href="#/${prox.id}" class="pl-nav-a prox"><span><small>Próximo</small>${esc(prox.titulo)}</span>${ic('seta', 16)}</a>` : `<a href="#/" class="pl-nav-a prox"><span><small>Fim do treinamento</small>Voltar à visão geral</span>${ic('seta', 16)}</a>`}
        </nav>
      </section>`;
      el = {}; 'stage cam base foco foco-img prev ovl halo ring arrow arrow-h callout hots tip cursor ripple zind pind cover caption tl knob tlh tempo zval vel narr tela frame'.split(' ').forEach(k => { el[k] = $(`[data-${k}]`); });
      el.play = $('[data-acao="play"]'); el.fills = $$('[data-fill]', el.tl);
      ligar();
      $('.pl').classList.toggle('sem-cc', !P.pref.cc);
      el.vel.textContent = String(P.pref.vel).replace('.', ',') + '×';
      if(!vozDisponivel()) { el.narr.disabled = true; el.narr.title = 'Narração indisponível: este navegador não tem voz em português'; }
      if(tocar) tocarClipe(); else { cobrir(i0 ? null : 'inicio'); pintar(); }
    }

    function quizHtml(m, q){
      const feito = P.quiz[m.id];
      return `<h2 id="quiz-h">${ic('trofeu', 18)} Confirme o que ficou</h2>
        <p class="quiz-p">${esc(q.p)}</p>
        <div class="quiz-o" role="radiogroup" aria-label="${esc(q.p)}">${q.o.map((o, i) => `<button type="button" role="radio" aria-checked="false" data-resp="${i}" ${feito && i === q.c ? 'class="certo"' : ''}><span class="l">${'ABC'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
        <div class="quiz-r" data-quiz-r aria-live="polite">${feito ? `<b class="certo">${ic('check', 15)} Você já confirmou este módulo.</b> ${esc(q.e)}` : ''}</div>`;
    }

    /* ---------- camera ---------- */
    function zoomAlvo(c){
      const a = c.alvo; if(!a) return 1; const pad = 44;
      const zFit = Math.min(W * .88 / (a.w + pad * 2), H * .8 / (a.h + pad * 2));
      return clamp(Math.min(c.zoom || 1, zFit), 1, 2.6);
    }
    /* estado da câmera no instante t da cena: zoom, centro e intensidade dos efeitos */
    function estado(c, t){
      const Dd = c.dur, entra = ease(ramp(t, .35, 1.85)), sai = ease(ramp(t, Dd - 1.15, Dd - .05));
      let z = 1, cx = W / 2, cy = H / 2;
      if(c.alvo){
        const zt = zoomAlvo(c), k = entra * (1 - sai), ax = c.alvo.x + c.alvo.w / 2, ay = c.alvo.y + c.alvo.h / 2;
        z = 1 + (zt - 1) * k; cx = W / 2 + (ax - W / 2) * k; cy = H / 2 + (ay - H / 2) * k;
      } else if(!reduzMov) z = 1 + .045 * ramp(t, 0, Dd);
      const fx = c.alvo ? ramp(t, .9, 1.9) * (1 - ramp(t, Dd - 1.15, Dd - .4)) : 0;
      const ov = c.alvo ? ramp(t, 1.5, 2.0) * (1 - ramp(t, Dd - 1.25, Dd - .65)) : 0;
      return { z, cx, cy, fx, ov };
    }
    function camera(z, cx, cy){
      const sw = el.stage.clientWidth, sh = el.stage.clientHeight, fit = Math.min(sw / W, sh / H), k = fit * z;
      const vw = sw / k, vh = sh / k;
      const ox = vw >= W ? (W - vw) / 2 : clamp(cx - vw / 2, 0, W - vw), oy = vh >= H ? (H - vh) / 2 : clamp(cy - vh / 2, 0, H - vh);
      return { k, ox, oy, sw, sh, p: (x, y) => [(x - ox) * k, (y - oy) * k] };
    }
    const projRect = (cam, r, pad = 0) => { const [x, y] = cam.p(r.x - pad, r.y - pad); return { x, y, w: (r.w + pad * 2) * cam.k, h: (r.h + pad * 2) * cam.k }; };

    /* ---------- quadro ---------- */
    function pintar(){
      if(!mod || !el.stage) return;
      const c = cenaEm(T), t = T - c.ini;
      if(c.i !== idx) trocarCena(c);
      const e = estado(c, t), z = clamp(e.z * uz, 1, 4);
      const cam = camera(z, e.cx + pan.x, e.cy + pan.y);
      el.cam.style.transform = `translate(${(-cam.ox * cam.k).toFixed(2)}px,${(-cam.oy * cam.k).toFixed(2)}px) scale(${cam.k.toFixed(4)})`;
      // fundo: escurecer / desfocar / transparente / normal
      const modo = P.pref.modo, fx = e.fx;
      el.base.style.filter = modo === 'escurecer' ? `brightness(${(1 - .64 * fx).toFixed(3)}) saturate(${(1 - .45 * fx).toFixed(3)})`
        : modo === 'desfocar' ? `blur(${(5 * fx).toFixed(2)}px) brightness(${(1 - .12 * fx).toFixed(3)})` : 'none';
      el.base.style.opacity = modo === 'transparente' ? (1 - .93 * fx).toFixed(3) : '1';
      el.stage.style.setProperty('--xadrez', modo === 'transparente' ? fx.toFixed(3) : '0');
      if(c.alvo){
        const a = c.alvo, pd = 10;
        Object.assign(el.foco.style, { left: (a.x - pd) + 'px', top: (a.y - pd) + 'px', width: (a.w + pd * 2) + 'px', height: (a.h + pd * 2) + 'px', opacity: modo === 'normal' ? 0 : fx.toFixed(3) });
        el['foco-img'].style.transform = `translate(${-(a.x - pd)}px,${-(a.y - pd)}px)`;
      } else el.foco.style.opacity = 0;
      // transição entre cenas
      const prevOp = c.i > 0 ? 1 - ramp(t, 0, .5) : 0; el.prev.style.opacity = prevOp.toFixed(3); el.prev.style.visibility = prevOp > 0 ? 'visible' : 'hidden';
      sobreposicoes(c, t, e, cam);
      // linha do tempo e tempo
      el.fills.forEach((f, i) => { const s = mod.cenas[i]; f.style.width = (clamp((T - s.ini) / s.dur, 0, 1) * 100).toFixed(2) + '%'; });
      el.knob.style.left = (T / mod.total * 100).toFixed(3) + '%';
      el.tl.setAttribute('aria-valuenow', Math.round(T)); el.tl.setAttribute('aria-valuetext', `${mmss(T)} de ${mmss(mod.total)}, passo ${c.i + 1}: ${c.titulo}`);
      el.tempo.textContent = `${mmss(T)} / ${mmss(mod.total)}`;
      el.zval.textContent = Math.round(uz * 100) + '%';
    }

    function sobreposicoes(c, t, e, cam){
      const Dd = c.dur, sw = cam.sw, sh = cam.sh;
      // contorno do alvo
      if(c.alvo && e.ov > 0){
        const r = projRect(cam, c.alvo, 8);
        for(const [n, g] of [[el.ring, 0], [el.halo, 5]]) { n.setAttribute('x', r.x - g); n.setAttribute('y', r.y - g); n.setAttribute('width', Math.max(0, r.w + g * 2)); n.setAttribute('height', Math.max(0, r.h + g * 2)); }
        el.ring.style.opacity = e.ov; el.halo.style.opacity = e.ov * .55;
      } else { el.ring.style.opacity = 0; el.halo.style.opacity = 0; }
      // seta + texto
      seta(c, t, e, cam);
      // cursor demonstrando o movimento ou o clique
      if(c.cursor && c.alvo){
        const r = projRect(cam, c.alvo), tx = r.x + r.w / 2, ty = r.y + r.h / 2, sx = sw * .86, sy = sh * .92;
        const mv = ease(ramp(t, 2.4, 3.6)); let x = sx + (tx - sx) * mv, y = sy + (ty - sy) * mv;
        if(c.cursor === 'mover' && t > 3.6) { x += Math.sin((t - 3.6) * 1.5) * Math.min(r.w * .32, 140); y += Math.sin((t - 3.6) * 3) * 4; }
        const op = ramp(t, 2.2, 2.55) * (1 - ramp(t, Dd - 1.25, Dd - .7));
        const clk = c.cursor === 'clique' ? ramp(t, 3.75, 4.5) : 0, aperta = c.cursor === 'clique' && t > 3.65 && t < 3.95;
        el.cursor.style.opacity = op.toFixed(3);
        el.cursor.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${aperta ? .82 : 1})`;
        el.ripple.style.opacity = clk > 0 && clk < 1 ? (1 - clk).toFixed(3) : 0;
        el.ripple.style.transform = `translate(-50%,-50%) scale(${(.3 + clk * 1.9).toFixed(3)})`;
      } else el.cursor.style.opacity = 0;
      // dicas numeradas com tooltip
      const fimD = Dd - 1.25;
      let auto = null;
      c.dicas.forEach((d, j) => {
        const b = el.hots.children[j]; if(!b) return;
        const ini = 4.1 + j * 3.1;
        // número no canto superior direito da área; se esse canto estiver fora do quadro, usa o esquerdo
        let [x0, y0] = cam.p(d.x + Math.min(d.w - 16, d.w * .92), d.y + Math.min(16, d.h / 2));
        if(x0 > sw - 8) [x0, y0] = cam.p(d.x + Math.min(16, d.w / 2), d.y + Math.min(16, d.h / 2));
        const x = clamp(x0, 14, sw - 14), y = clamp(y0, 14, sh - 14);
        posHot[j] = [x, y]; const naTela = x0 > 4 && y0 > 4 && x0 < sw - 4 && y0 < sh - 4;
        const vis = naTela && t >= ini - .2 && t < fimD;
        b.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${vis ? 1 : .2})`;
        b.style.opacity = vis ? 1 : 0; b.tabIndex = vis ? 0 : -1; b.setAttribute('aria-hidden', !vis);
        if(vis && t >= ini && t < ini + 3.1) auto = j;
        b.classList.toggle('ativa', (fixaDica ?? hoverDica ?? auto) === j);
      });
      const j = fixaDica ?? hoverDica ?? (tocando || t > 0 ? auto : null);
      mostrarTip(c, j, cam);
      // aviso de pausa
      el.pind.classList.toggle('on', !tocando && !fim && T > 0 && !el.cover.classList.contains('on'));
    }

    function seta(c, t, e, cam){
      const sw = cam.sw, sh = cam.sh;
      rCallout = null;
      if(!c.alvo || !c.seta || e.ov <= 0){ el.callout.style.opacity = 0; el.arrow.style.opacity = 0; el['arrow-h'].style.opacity = 0; return; }
      if(el.callout.dataset.cena !== c.id){ el.callout.dataset.cena = c.id; el.callout.innerHTML = `<small>Passo ${c.i + 1}</small><b>${esc(c.titulo)}</b>`; }
      const bw = el.callout.offsetWidth, bh = el.callout.offsetHeight;
      // o lado é escolhido com a câmera já aproximada, para não pular durante a animação
      const chave = `${c.id}|${uz}|${Math.round(sw)}x${Math.round(sh)}|${pan.x},${pan.y}`;
      if(!ladoCache[chave]){
        const ef = estado(c, 2.2), cf = camera(clamp(ef.z * uz, 1, 4), ef.cx + pan.x, ef.cy + pan.y), r = projRect(cf, c.alvo, 8);
        const esp = { direita: sw - (r.x + r.w) - bw - 50, esquerda: r.x - bw - 50, baixo: sh - (r.y + r.h) - bh - 46, cima: r.y - bh - 46 };
        const ok = Object.entries(esp).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
        ladoCache[chave] = ok.length ? ok[0][0] : 'dentro';
      }
      const lado = ladoCache[chave], r = projRect(cam, c.alvo, 8), mx = r.x + r.w / 2, my = r.y + r.h / 2;
      let bx, by, sx, sy, tx, ty;
      if(lado === 'direita'){ bx = r.x + r.w + 56; by = clamp(my - bh / 2 - 34, 10, sh - bh - 10); sx = bx; sy = by + bh / 2; tx = r.x + r.w + 4; ty = clamp(my, r.y + 6, r.y + r.h - 6); }
      else if(lado === 'esquerda'){ bx = r.x - 56 - bw; by = clamp(my - bh / 2 - 34, 10, sh - bh - 10); sx = bx + bw; sy = by + bh / 2; tx = r.x - 4; ty = clamp(my, r.y + 6, r.y + r.h - 6); }
      else if(lado === 'baixo'){ bx = clamp(mx - bw / 2 + 40, 10, sw - bw - 10); by = r.y + r.h + 48; sx = bx + bw / 2; sy = by; tx = clamp(mx, r.x + 8, r.x + r.w - 8); ty = r.y + r.h + 4; }
      else if(lado === 'cima'){ bx = clamp(mx - bw / 2 + 40, 10, sw - bw - 10); by = r.y - 48 - bh; sx = bx + bw / 2; sy = by + bh; tx = clamp(mx, r.x + 8, r.x + r.w - 8); ty = r.y - 4; }
      else { bx = clamp(r.x + 18, 10, sw - bw - 10); by = clamp(r.y + 18, 10, sh - bh - 10); sx = tx = 0; }
      bx = clamp(bx, 8, sw - bw - 8); by = clamp(by, 8, sh - bh - 8);
      const opB = ramp(t, 1.9, 2.35) * e.ov;
      el.callout.style.opacity = opB.toFixed(3); el.callout.style.transform = `translate(${bx.toFixed(1)}px,${(by + (1 - ramp(t, 1.9, 2.35)) * 8).toFixed(1)}px)`;
      el.callout.dataset.lado = lado; if(opB > .05) rCallout = { x: bx, y: by, w: bw, h: bh };
      if(lado === 'dentro'){ el.arrow.style.opacity = 0; el['arrow-h'].style.opacity = 0; return; }
      // curva com leve arco, desenhada progressivamente
      const dx = tx - sx, dy = ty - sy, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, curva = len * .22 * ((lado === 'direita' || lado === 'baixo') ? 1 : -1);
      const qx = sx + dx / 2 + nx * curva, qy = sy + dy / 2 + ny * curva;
      const pr = ease(ramp(t, 1.95, 2.85));
      el.arrow.setAttribute('d', `M${sx.toFixed(1)},${sy.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`);
      const L = el.arrow.getTotalLength();
      el.arrow.style.strokeDasharray = `${L.toFixed(1)} ${L.toFixed(1)}`; el.arrow.style.strokeDashoffset = (L * (1 - pr)).toFixed(1); el.arrow.style.opacity = e.ov;
      if(pr > .02){
        const pt = el.arrow.getPointAtLength(L * pr), p2 = el.arrow.getPointAtLength(Math.max(0, L * pr - 3)), ang = Math.atan2(pt.y - p2.y, pt.x - p2.x), s = 11;
        const a1 = [pt.x - s * Math.cos(ang - .45), pt.y - s * Math.sin(ang - .45)], a2 = [pt.x - s * Math.cos(ang + .45), pt.y - s * Math.sin(ang + .45)];
        el['arrow-h'].setAttribute('d', `M${a1[0].toFixed(1)},${a1[1].toFixed(1)} L${pt.x.toFixed(1)},${pt.y.toFixed(1)} L${a2[0].toFixed(1)},${a2[1].toFixed(1)}`);
        el['arrow-h'].style.opacity = e.ov;
      } else el['arrow-h'].style.opacity = 0;
    }

    function mostrarTip(c, j, cam){
      const tip = el.tip;
      if(j == null || !c.dicas[j]){ if(!tip.hidden){ tip.hidden = true; tip.dataset.k = ''; } return; }
      const d = c.dicas[j], k = c.id + ':' + j;
      if(tip.dataset.k !== k){ tip.dataset.k = k; tip.innerHTML = `<span class="tn">${j + 1}</span><div><b>${esc(d.titulo)}</b><p>${esc(d.texto)}</p></div>`; }
      tip.hidden = false;
      const [hx, hy] = posHot[j] || [0, 0], tw = tip.offsetWidth, th = tip.offsetHeight;
      // tenta à direita, à esquerda, abaixo e acima do número, evitando cobrir o texto da seta
      const cands = [[hx + 22, hy - 18], [hx - 22 - tw, hy - 18], [hx - tw / 2, hy + 24], [hx - tw / 2, hy - 24 - th]];
      const dentro = ([x, y]) => x >= 8 && y >= 8 && x + tw <= cam.sw - 8 && y + th <= cam.sh - 8;
      const cobre = ([x, y]) => rCallout && x < rCallout.x + rCallout.w + 6 && x + tw > rCallout.x - 6 && y < rCallout.y + rCallout.h + 6 && y + th > rCallout.y - 6;
      const ra = c.alvo ? projRect(cam, c.alvo, 8) : null;
      const tapa = ([x, y]) => ra && ra.w * ra.h < cam.sw * cam.sh * .35 && x < ra.x + ra.w && x + tw > ra.x && y < ra.y + ra.h && y + th > ra.y;
      const rd = projRect(cam, d), propria = ([x, y]) => x < rd.x + rd.w && x + tw > rd.x && y < rd.y + rd.h && y + th > rd.y && rd.w * rd.h < cam.sw * cam.sh * .3;
      let [x, y] = cands.find(p => dentro(p) && !cobre(p) && !tapa(p) && !propria(p)) || cands.find(p => dentro(p) && !cobre(p) && !propria(p)) || cands.find(p => dentro(p) && !propria(p)) || cands.find(p => dentro(p) && !cobre(p)) || cands.find(dentro) || cands[0];
      x = clamp(x, 10, cam.sw - tw - 10); y = clamp(y, 10, cam.sh - th - 10);
      tip.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    }

    function trocarCena(c){
      const anterior = idx; idx = c.i;
      el.base.src = el['foco-img'].src = D.img[c.id];
      if(c.i > 0) el.prev.src = D.img[mod.cenas[c.i - 1].id];
      el.base.alt = `Tela do sistema: ${c.titulo}`;
      el.hots.innerHTML = c.dicas.map((d, j) => `<button type="button" class="hot" data-hot="${j}" aria-describedby="pl-tip" aria-label="Dica ${j + 1}: ${esc(d.titulo)}" tabindex="-1"><span>${j + 1}</span></button>`).join('');
      hoverDica = fixaDica = null; el.callout.dataset.cena = '';
      el.caption.innerHTML = `<div class="cap-top"><span class="cap-n">Passo ${c.i + 1} de ${mod.cenas.length}</span><b>${esc(c.titulo)}</b>
        <a class="cap-exp" href="${APP}${esc(c.rota)}" target="_blank" rel="noopener" title="Abrir o sistema nesta tela">${ic('externo', 14)}<span>Experimente</span></a></div><p>${esc(c.texto)}</p>`;
      $$('[data-steps] button').forEach((b, i) => { b.classList.toggle('on', i === c.i); b.classList.toggle('feito', i < c.i); b.setAttribute('aria-current', i === c.i ? 'step' : 'false'); });
      $$('[data-rot]').forEach((li, i) => li.classList.toggle('on', i === c.i));
      try { history.replaceState(null, '', `#/${mod.id}/${c.i + 1}`); } catch(e){}
      if(anterior !== -1 || tocando) falar(c);
    }

    /* ---------- narração ---------- */
    let vozes = [];
    const carregarVozes = () => { try { vozes = speechSynthesis.getVoices().filter(v => /^pt/i.test(v.lang)); } catch(e){ vozes = []; } };
    if('speechSynthesis' in window){ carregarVozes(); speechSynthesis.onvoiceschanged = () => { carregarVozes(); const n = el.narr; if(n && vozDisponivel()){ n.disabled = false; n.title = 'Narração em voz (N)'; } }; }
    function vozDisponivel(){ return 'speechSynthesis' in window && vozes.length > 0; }
    function calar(){ falando = false; try { speechSynthesis.cancel(); } catch(e){} }
    function falar(c){
      calar(); if(!P.pref.narr || !tocando || !vozDisponivel()) return;
      const u = new SpeechSynthesisUtterance(`${c.titulo}. ${c.texto}`);
      u.voice = vozes.find(v => /pt-BR/i.test(v.lang)) || vozes[0]; u.lang = u.voice.lang; u.rate = clamp(P.pref.vel, .8, 1.6);
      u.onstart = () => { falando = true; }; u.onend = u.onerror = () => { falando = false; };
      falando = true; speechSynthesis.speak(u);
    }

    /* ---------- relógio ---------- */
    function quadro(ts){
      if(!tocando) return;
      const dt = Math.min(.1, (ts - (ultimoTs || ts)) / 1000); ultimoTs = ts;
      const c = cenaEm(T), t = T - c.ini;
      const segura = P.pref.narr && falando && t >= c.dur - 1.2 && c.i === idx;   // espera a narração terminar antes de sair da cena
      if(!segura) T += dt * P.pref.vel;
      if(T >= mod.total){ T = mod.total - .001; pintar(); terminar(); return; }
      pintar(); raf = requestAnimationFrame(quadro);
    }
    function tocarClipe(){
      if(!mod) return;
      if(fim || T >= mod.total - .01){ T = 0; idx = -1; fim = false; }
      cobrir(null); tocando = true; ultimoTs = 0; atualizarPlay(); enquadrar();
      if(P.pref.narr && vozDisponivel()){ try { if(speechSynthesis.paused) speechSynthesis.resume(); } catch(e){} if(!falando) { const c = cenaEm(T); if(c.i === idx && T - c.ini < c.dur - 2) falar(c); } }
      cancelAnimationFrame(raf); raf = requestAnimationFrame(quadro);
    }
    /* ao tocar, garante o player inteiro visível (palco, legenda e controles) */
    function enquadrar(){ const r = el.frame.getBoundingClientRect(); if(r.top < 70 || r.bottom > innerHeight + 4) el.frame.scrollIntoView({ block: 'start', behavior: reduzMov ? 'auto' : 'smooth' }); }
    function pausar(){ if(!tocando) return; tocando = false; cancelAnimationFrame(raf); try { speechSynthesis.pause(); } catch(e){} calarSuave(); atualizarPlay(); pintar(); }
    function calarSuave(){ /* alguns navegadores não retomam bem uma fala pausada: ao pausar, encerra e repete a cena na retomada */ calar(); }
    function parar(silencioso){
      tocando = false; cancelAnimationFrame(raf); calar();
      if(!mod || silencioso === true) return;
      T = 0; fim = false; uz = 1; pan = { x: 0, y: 0 }; idx = -1; cobrir('inicio'); atualizarPlay(); pintar();
    }
    function irPara(t, manterTocando = true){
      if(!mod) return;
      const eraTocando = tocando; T = clamp(t, 0, mod.total - .001); fim = false;
      const c = cenaEm(T); if(c.i !== idx){ calar(); }
      cobrir(null); pintar();
      if(eraTocando && manterTocando){ const c2 = cenaEm(T); if(!falando && T - c2.ini < c2.dur - 2) falar(c2); }
    }
    function irCena(i, tocar){ if(!mod) return; i = clamp(i, 0, mod.cenas.length - 1); idx = -2; irPara(mod.cenas[i].ini + .001); if(tocar && !tocando) tocarClipe(); }
    function terminar(){
      tocando = false; fim = true; cancelAnimationFrame(raf); atualizarPlay();
      if(!P.visto[mod.id]){ P.visto[mod.id] = true; salvar(); lateral(mod.id); }
      cobrir('fim');
    }
    function atualizarPlay(){
      if(!el.play) return;
      el.play.innerHTML = ic(tocando ? 'pause' : 'play', 20);
      el.play.setAttribute('aria-label', tocando ? 'Pausar' : fim ? 'Rever' : 'Tocar'); el.play.title = tocando ? 'Pausar (espaço)' : 'Tocar (espaço)';
      el.stage && el.stage.classList.toggle('tocando', tocando);
    }

    /* ---------- capas: início e fim ---------- */
    function cobrir(tipo){
      const cv = el.cover; if(!cv) return;
      if(!tipo){ cv.classList.remove('on'); cv.innerHTML = ''; return; }
      const m = mod, prox = MODS[m.mi + 1];
      cv.classList.add('on'); cv.dataset.tipo = tipo;
      cv.style.setProperty('--capa', `url("${D.mini[m.cenas[0].id] || D.img[m.cenas[0].id]}")`);
      cv.innerHTML = tipo === 'inicio' ? `
        <div class="cv-in">
          <span class="cv-eyebrow">Módulo ${m.mi + 1} · Nível ${m.nivel} · ${NIVEL[m.nivel].nome}</span>
          <h2>${esc(m.titulo)}</h2><p>${esc(m.subtitulo)}</p>
          <button type="button" class="cv-play" data-cv="play" aria-label="Tocar o clipe">${ic('play', 34)}</button>
          <span class="cv-meta">${m.cenas.length} passos · ${mmss(m.total)} · pause, aproxime e experimente quando quiser</span>
        </div>` : `
        <div class="cv-in">
          <span class="cv-ok">${ic('check', 30)}</span>
          <h2>Módulo concluído</h2><p>Você viu os ${m.cenas.length} passos de <b>${esc(m.titulo)}</b>. Agora repita no sistema e confirme o que ficou.</p>
          <div class="cv-acoes">
            ${C.quiz[m.id] && !P.quiz[m.id] ? `<button type="button" class="mt-btn" data-cv="quiz">${ic('trofeu', 16)}<span>Confirmar o que ficou</span></button>` : ''}
            ${prox ? `<a class="mt-btn ${C.quiz[m.id] && !P.quiz[m.id] ? 'sec' : ''}" href="#/${prox.id}" data-cv="prox">${ic('seta', 16)}<span>Próximo: ${esc(prox.titulo)}</span></a>` : `<a class="mt-btn" href="#/">${ic('trofeu', 16)}<span>Concluir o treinamento</span></a>`}
            <button type="button" class="mt-btn sec" data-cv="rever">${ic('reiniciar', 16)}<span>Rever</span></button>
            <a class="mt-btn sec" href="${APP}${esc(m.cenas[0].rota)}" target="_blank" rel="noopener">${ic('externo', 16)}<span>Experimente no sistema</span></a>
          </div>
        </div>`;
    }

    /* ---------- zoom manual ---------- */
    function zoomar(dir){
      const i = ZOOMS.findIndex(z => z >= uz - .001);
      uz = dir === 0 ? 1 : ZOOMS[clamp((i < 0 ? 0 : i) + dir, 0, ZOOMS.length - 1)];
      if(uz === 1) pan = { x: 0, y: 0 };
      el.zind.textContent = dir === 0 ? 'Zoom ajustado ao clipe' : `Zoom ${Math.round(uz * 100)}%${uz > 1 ? ' · arraste para mover' : ''}`;
      el.zind.classList.add('on'); clearTimeout(zoomar.t); zoomar.t = setTimeout(() => el.zind.classList.remove('on'), 1400);
      el.stage.classList.toggle('arrastavel', uz > 1);
      pintar();
    }

    /* ---------- tela cheia ---------- */
    function telaCheia(){
      const f = el.frame;
      if(document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
      else if(f.requestFullscreen) f.requestFullscreen().catch(() => f.classList.toggle('cheia'));
      else f.classList.toggle('cheia');
    }
    document.addEventListener('fullscreenchange', () => { if(!el.tela) return; const on = !!document.fullscreenElement; el.tela.innerHTML = ic(on ? 'sairtela' : 'tela'); el.tela.setAttribute('aria-label', on ? 'Sair da tela cheia' : 'Tela cheia'); ladoCache = {}; requestAnimationFrame(pintar); });

    /* ---------- eventos ---------- */
    function ligar(){
      $('.pl').addEventListener('click', ev => {
        const a = ev.target.closest('[data-acao]'); if(a){ acao(a.dataset.acao); return; }
        const ir = ev.target.closest('[data-ir]'); if(ir){ irCena(+ir.dataset.ir, true); el.stage.scrollIntoView({ block: 'nearest', behavior: reduzMov ? 'auto' : 'smooth' }); return; }
        const md = ev.target.closest('.pl-fundo [data-modo]'); if(md){ definirModo(md.dataset.modo); return; }
        const cv = ev.target.closest('[data-cv]');
        if(cv){ const k = cv.dataset.cv;
          if(k === 'play') tocarClipe(); else if(k === 'rever'){ T = 0; idx = -1; fim = false; tocarClipe(); }
          else if(k === 'quiz'){ const q = $('[data-quiz]'); q.scrollIntoView({ block: 'center', behavior: reduzMov ? 'auto' : 'smooth' }); const b = $('[data-resp]', q); b && b.focus({ preventScroll: true }); }
          else if(k === 'prox'){ proximoAutoplay = true; }
          return; }
        if(ev.target.closest('.cover[data-tipo="inicio"]')){ tocarClipe(); return; }
        const hot = ev.target.closest('[data-hot]');
        if(hot){ const j = +hot.dataset.hot; fixaDica = fixaDica === j ? null : j; if(fixaDica != null) pausar(); pintar(); return; }
        const resp = ev.target.closest('[data-resp]'); if(resp){ responder(+resp.dataset.resp); return; }
        if(ev.target.closest('[data-stage]') && !ev.target.closest('.cover') && !arrastou){ fixaDica = null; tocando ? pausar() : tocarClipe(); }
      });
      el.hots.addEventListener('pointerover', ev => { const h = ev.target.closest('[data-hot]'); if(h){ hoverDica = +h.dataset.hot; pintar(); } });
      el.hots.addEventListener('pointerout', ev => { if(ev.target.closest('[data-hot]')){ hoverDica = null; pintar(); } });
      el.hots.addEventListener('focusin', ev => { const h = ev.target.closest('[data-hot]'); if(h){ hoverDica = +h.dataset.hot; pintar(); } });
      el.hots.addEventListener('focusout', () => { hoverDica = null; pintar(); });
      // linha do tempo: clique e arraste
      const tl = el.tl, posT = ev => { const r = tl.getBoundingClientRect(); return clamp((ev.clientX - r.left) / r.width, 0, 1) * mod.total; };
      let arrastaTl = false;
      tl.addEventListener('pointerdown', ev => { arrastaTl = true; tl.setPointerCapture(ev.pointerId); irPara(posT(ev)); });
      tl.addEventListener('pointermove', ev => {
        const t = posT(ev), c = cenaEm(t), r = tl.getBoundingClientRect();
        el.tlh.hidden = false; el.tlh.textContent = `${mmss(t)} · Passo ${c.i + 1}: ${c.titulo}`;
        el.tlh.style.left = clamp(ev.clientX - r.left, 80, r.width - 80) + 'px';
        if(arrastaTl) irPara(t);
      });
      tl.addEventListener('pointerup', () => { arrastaTl = false; });
      tl.addEventListener('pointerleave', () => { el.tlh.hidden = true; });
      tl.addEventListener('keydown', ev => {
        const passo = ev.shiftKey ? 10 : 5;
        if(ev.key === 'ArrowRight'){ irPara(T + passo); ev.preventDefault(); ev.stopPropagation(); }
        else if(ev.key === 'ArrowLeft'){ irPara(T - passo); ev.preventDefault(); ev.stopPropagation(); }
        else if(ev.key === 'Home'){ irPara(0); ev.preventDefault(); } else if(ev.key === 'End'){ irPara(mod.total - .5); ev.preventDefault(); }
      });
      // arrastar a imagem quando há zoom manual
      let ini = null; arrastou = false;
      el.stage.addEventListener('pointerdown', ev => { if(uz <= 1 || ev.target.closest('.hot,.cover,button,a')) return; ini = { x: ev.clientX, y: ev.clientY, px: pan.x, py: pan.y }; arrastou = false; el.stage.setPointerCapture(ev.pointerId); });
      el.stage.addEventListener('pointermove', ev => {
        if(!ini) return; const sw = el.stage.clientWidth, k = Math.min(sw / W, el.stage.clientHeight / H) * uz;
        const dx = ev.clientX - ini.x, dy = ev.clientY - ini.y; if(Math.abs(dx) + Math.abs(dy) > 4) arrastou = true;
        pan.x = ini.px - dx / k; pan.y = ini.py - dy / k; ladoCache = {}; pintar();
      });
      el.stage.addEventListener('pointerup', () => { ini = null; setTimeout(() => { arrastou = false; }, 0); });
      el.stage.addEventListener('wheel', ev => { if(!ev.ctrlKey) return; ev.preventDefault(); zoomar(ev.deltaY < 0 ? 1 : -1); }, { passive: false });
    }
    let arrastou = false, proximoAutoplay = false;

    function acao(k){
      if(k === 'play') tocando ? pausar() : tocarClipe();
      else if(k === 'stop') parar();
      else if(k === 'reiniciar'){ T = 0; idx = -1; fim = false; uz = 1; pan = { x: 0, y: 0 }; calar(); tocarClipe(); }
      else if(k === 'ant'){ const c = cenaEm(T); irCena(T - c.ini > 1.5 ? c.i : c.i - 1); }
      else if(k === 'prox'){ const c = cenaEm(T); if(c.i < mod.cenas.length - 1) irCena(c.i + 1); else { T = mod.total - .001; pintar(); terminar(); } }
      else if(k === 'zmais') zoomar(1); else if(k === 'zmenos') zoomar(-1); else if(k === 'ajustar') zoomar(0);
      else if(k === 'vel'){ P.pref.vel = VELS[(VELS.indexOf(P.pref.vel) + 1) % VELS.length]; salvar(); el.vel.textContent = String(P.pref.vel).replace('.', ',') + '×'; aviso(`Velocidade ${String(P.pref.vel).replace('.', ',')}×`); if(falando){ calar(); falar(cenaEm(T)); } }
      else if(k === 'cc'){ P.pref.cc = !P.pref.cc; salvar(); $('.pl').classList.toggle('sem-cc', !P.pref.cc); $('[data-acao="cc"]').setAttribute('aria-pressed', P.pref.cc); aviso(P.pref.cc ? 'Legendas ligadas' : 'Legendas desligadas'); requestAnimationFrame(pintar); }
      else if(k === 'narr'){ if(!vozDisponivel()){ aviso('Este navegador não tem voz em português'); return; } P.pref.narr = !P.pref.narr; salvar(); el.narr.innerHTML = ic(P.pref.narr ? 'voz' : 'mudo'); el.narr.setAttribute('aria-pressed', P.pref.narr); aviso(P.pref.narr ? 'Narração ligada' : 'Narração desligada'); if(P.pref.narr && tocando) falar(cenaEm(T)); else calar(); }
      else if(k === 'tela') telaCheia();
    }
    function aviso(txt){ el.zind.textContent = txt; el.zind.classList.add('on'); clearTimeout(zoomar.t); zoomar.t = setTimeout(() => el.zind.classList.remove('on'), 1300); }
    function definirModo(m){
      P.pref.modo = m; salvar(); $('.pl').dataset.modo = m;
      $$('.pl-fundo [data-modo]').forEach(b => b.setAttribute('aria-checked', b.dataset.modo === m));
      aviso('Fundo: ' + MODOS.find(o => o.id === m).nome); pintar();
    }
    function ciclarModo(){ const i = MODOS.findIndex(o => o.id === P.pref.modo); definirModo(MODOS[(i + 1) % MODOS.length].id); }
    function responder(i){
      const q = C.quiz[mod.id], box = $('[data-quiz]'), certo = i === q.c;
      $$('[data-resp]', box).forEach((b, j) => { b.setAttribute('aria-checked', j === i); b.classList.toggle('errado', j === i && !certo); b.classList.toggle('certo', certo && j === q.c); });
      $('[data-quiz-r]', box).innerHTML = certo ? `<b class="certo">${ic('check', 15)} Isso mesmo.</b> ${esc(q.e)}` : `<b class="errado">Ainda não.</b> Reveja o clipe ou tente outra opção.`;
      if(certo && !P.quiz[mod.id]){ P.quiz[mod.id] = true; if(!P.visto[mod.id]) P.visto[mod.id] = true; salvar(); lateral(mod.id); if(fim) cobrir('fim'); }
    }
    function teclado(ev){
      if(!mod || !el.stage || !document.body.contains(el.stage)) return;
      if(ev.target.closest('input,textarea,select,[contenteditable]') || ev.metaKey || ev.altKey || ev.ctrlKey) return;
      if(document.querySelector('.mt-modal')) return;
      const k = ev.key, emBotao = ev.target.closest('button,a');
      if(k === ' ' || k === 'k' || k === 'K'){ if(emBotao && k === ' ') return; ev.preventDefault(); acao('play'); }
      else if(k === 'ArrowRight' && !ev.target.closest('[data-tl]')){ ev.preventDefault(); acao('prox'); }
      else if(k === 'ArrowLeft' && !ev.target.closest('[data-tl]')){ ev.preventDefault(); acao('ant'); }
      else if(k === 's' || k === 'S') acao('stop'); else if(k === 'r' || k === 'R') acao('reiniciar');
      else if(k === '+' || k === '=') acao('zmais'); else if(k === '-' || k === '_') acao('zmenos'); else if(k === '0') acao('ajustar');
      else if(k === 'f' || k === 'F') acao('tela'); else if(k === 'n' || k === 'N') acao('narr'); else if(k === 'c' || k === 'C') acao('cc');
      else if(k === 'b' || k === 'B') ciclarModo();
      else if(k === 'Escape' && fixaDica != null){ fixaDica = null; pintar(); }
      else if(/^[1-9]$/.test(k)){ const i = +k - 1; if(i < mod.cenas.length) irCena(i); }
    }
    document.addEventListener('keydown', teclado);
    window.addEventListener('resize', () => { ladoCache = {}; pintar(); });
    document.addEventListener('visibilitychange', () => { if(document.hidden) pausar(); });

    return { montar, parar, get autoplay(){ const a = proximoAutoplay; proximoAutoplay = false; return a; }, estado: () => ({ T, tocando, fim, idx, uz, modo: P.pref.modo, total: mod && mod.total, mod: mod && mod.id }), irPara, irCena, acao };
  })();

  /* ---------------------------------------------------------------- atalhos */
  function abrirAtalhos(){
    const ant = document.activeElement;
    const m = document.createElement('div'); m.className = 'mt-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'at-h');
    const L = [[['Espaço', 'K'], 'Tocar e pausar'], [['S'], 'Parar e voltar ao início'], [['R'], 'Reiniciar o módulo'], [['←', '→'], 'Passo anterior e próximo'], [['1', '9'], 'Ir direto a um passo', ' a '], [['+', '−', '0'], 'Zoom in, zoom out e ajustar'], [['Ctrl', 'roda do mouse'], 'Zoom no clipe', ' + '], [['B'], 'Trocar o fundo: escurecer, desfocar, transparente ou normal'], [['C'], 'Legendas'], [['N'], 'Narração em voz'], [['F'], 'Tela cheia']];
    m.innerHTML = `<div class="mt-modal-c"><h2 id="at-h">${ic('teclado', 20)} Atalhos do player</h2><dl>${L.map(([ks, v, sep]) => `<div><dt>${ks.map(k => `<kbd>${esc(k)}</kbd>`).join(sep || ' ')}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="muted">Dica: passe o mouse sobre os números do clipe para abrir as explicações. Clique num número para fixar a dica e pausar.</p>
      <button type="button" class="mt-btn" data-fechar>Entendi</button></div>`;
    document.body.appendChild(m);
    const fechar = () => { m.remove(); ant && ant.focus && ant.focus(); };
    m.addEventListener('click', ev => { if(ev.target === m || ev.target.closest('[data-fechar]')) fechar(); });
    m.addEventListener('keydown', ev => { if(ev.key === 'Escape') fechar(); if(ev.key === 'Tab'){ ev.preventDefault(); $('[data-fechar]', m).focus(); } });
    $('[data-fechar]', m).focus();
  }

  /* ---------------------------------------------------------------- rotas */
  function rota(){
    const h = location.hash.replace(/^#\/?/, '');
    if(h === 'trilhas'){ return; }
    const [id, passo] = h.split('/'), m = id && modPorId(id);
    if(!m){ inicio(); if(h === '') window.scrollTo(0, 0); return; }
    const atual = player.estado();
    if(atual.mod === m.id && passo && document.querySelector('[data-stage]')) return;   // replaceState do próprio player
    player.montar(m, passo ? (+passo - 1) : 0, player.autoplay);
    window.scrollTo(0, 0); const main = $('[data-main]'); main && main.focus({ preventScroll: true });
  }
  casca();
  window.addEventListener('hashchange', rota);
  rota();
  window.MANUAL_PLAYER = player;
})();
