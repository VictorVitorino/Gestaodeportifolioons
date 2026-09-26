// DOM replicas of the FLOWS screens (Início, Biblioteca de Skills, Compartilhar Skill).
import { icon, dots, claudeMark } from './icons.js';

const h = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

export function ringO(id, w = 8) {
  return `<svg viewBox="0 0 100 100"><defs>
    <linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd36b"/><stop offset=".5" stop-color="#f7a21b"/><stop offset="1" stop-color="#e2700c"/></linearGradient>
    <linearGradient id="${id}b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c9" stop-opacity=".95"/><stop offset=".45" stop-color="#ffc14a" stop-opacity=".0"/></linearGradient></defs>
    <circle class="ring-main" cx="50" cy="50" r="38" fill="none" stroke="url(#${id}a)" stroke-width="${w + 5}" stroke-linecap="round"/>
    <circle class="ring-hi" cx="50" cy="50" r="38" fill="none" stroke="url(#${id}b)" stroke-width="${w - 2}" stroke-linecap="round"/>
  </svg>`;
}

export function logo(size = 40) {
  return h(`<div class="logo" style="font-size:${size}px"><span>FL</span><span class="o">${ringO('lg' + Math.random().toString(36).slice(2, 7))}</span><span>WS</span></div>`);
}

export function logo3d() {
  const id = 'l3' + Math.random().toString(36).slice(2, 7);
  return h(`<div class="logo3d"><span class="l">F</span><span class="l">L</span><span class="o">${ringO(id, 9)}</span><span class="l">W</span><span class="l">S</span></div>`);
}

// ---------- Início ----------
export function sidebar() {
  return h(`<div class="sidebar">
    <div class="sb-sec">Principal</div>
    <div class="sb-it act">${icon('home')}Início</div>
    <div class="sb-it box">${icon('folder')}Projetos</div>
    <div class="sb-gap"></div>
    <div class="sb-sec">Skills</div>
    <div class="sb-it">${icon('library')}Biblioteca</div>
    <div class="sb-it">${icon('user')}Minhas Skills</div>
    <div class="sb-it"><svg class="ic fav" viewBox="0 0 24 24"><path d="M12 2.8l2.84 5.76 6.36.93-4.6 4.48 1.09 6.33L12 17.3l-5.69 2.99 1.09-6.33-4.6-4.48 6.36-.93z" fill="#f5a524" stroke="#f5a524" stroke-width="1.5" stroke-linejoin="round"/></svg>Favoritas</div>
    <div class="sb-it">${icon('chart')}Ranking</div>
    <div class="sb-gap"></div>
    <div class="sb-sec">Métodos</div>
    <div class="sb-it">${icon('book')}Catálogo</div>
    <div class="sb-it">${icon('listpen')}Meus Métodos</div>
    <div class="sb-bottom">
      <div class="sb-it">${claudeMark()}Usar com Claude</div>
      <div class="sb-it">${icon('lang')}Idioma<span class="kb">PT</span></div>
      <div class="sb-it">${icon('moon')}Tema escuro</div>
      <div class="sb-user"><span class="av">${icon('user')}</span>Vitorino, Victor<span style="margin-left:auto">${icon('updown')}</span></div>
    </div></div>`);
}

export function topbar() {
  const el = h(`<div class="topbar panel">${icon('menu')}<span class="lg"></span><span class="sep"></span></div>`);
  el.querySelector('.lg').replaceWith(logo(34));
  return el;
}

export function greet() {
  return h(`<div class="greet panel"><h1>Olá, Victor</h1>
    <div class="search">${icon('search')}<span>Buscar projetos, skills ou métodos</span><span class="kbd">Ctrl+K</span></div></div>`);
}

export function moduleCard(kind) {
  const d = {
    lib: ['blue', 'library', 'Biblioteca de Skills', '441 skills', 'upload', 'Compartilhar Skill'],
    met: ['orange', 'book', 'Catálogo de Métodos', 'Catálogo de Métodos', 'fileplus', 'Novo Método'],
    prj: ['purple', 'folder', 'Meus Projetos', '0 projetos', 'plus', 'Novo Projeto'],
  }[kind];
  return h(`<div class="mcard panel"><div class="top"><div class="tile ${d[0]}">${icon(d[1])}</div>
    <div><h3>${d[2]}</h3><p>${d[3]}</p></div></div><div class="act">${icon(d[4])}${d[5]}</div></div>`);
}

export function ranking() {
  const rows = [['#1', 'LV', 'lvelame', 600], ['#2', 'BL', 'blomes', 442], ['#3', 'AB', 'abarreto', 410], ['#4', 'AM', 'amanfrinatti', 308], ['#5', 'SC', 'steven.cho', 216]];
  return h(`<div class="rank panel" style="width:1330px"><h2>Ranking</h2><div class="sub">Pessoas · todos os tempos</div>
    <div class="me"><b class="pos">#12</b><span class="v">Você</span><span class="pts">150 pontos</span><span class="hint">6 pontos para alcançar rlauretti</span></div>
    ${rows.map((r) => `<div class="row"><span class="p">${r[0]}</span><span class="av">${r[1]}</span><span class="n">${r[2]}</span><span class="s">${r[3]} pontos</span></div>`).join('')}
    <span class="btn">Ver ranking</span></div>`);
}

// ---------- Biblioteca ----------
export const SKILLS = [
  { t: 'amp-flows-cli', area: ['network', 'DnA - Data &amp; Analytics'], sc: 81, medal: true, d: 'Amp Flows CLI agent skill (/flows): projects, methods, files, skills library; routes DocHub via O que ler quando.', a: 'Froes, Paulo', dt: '31/07/2026', s: [0, 221, 0] },
  { t: '[AMP] Regramento PPT A&amp;M', area: ['network', 'DTS'], sc: 97, feat: true, d: 'Cria apresentações em powerpoint no template oficial A&amp;M: cada slide vem de um layout nomeado do master, com paleta, tipografia Arial Nova, grafismo a 330° e tags padrão.', a: 'Barreto, Abner', dt: '23/09/2026', s: [5, 9, 3] },
  { t: '[DTS] - Experience Builder | Gamificação, Team Building, Escape Room - GMO (Gestão da Mudança)', area: ['network', 'DTS'], sc: 98, d: 'Use to engineer AMP Flows Skills through a fixed contract-driven lifecycle: create a new Skill from a repeatable task or...', a: 'Vitorino, Victor', dt: '03/09/2026', s: [2, 7, 1] },
  { t: '[DTS] - Culture &amp; Stakeholder Diagnostic Builder - GMO (Gestão da Mudança)', area: ['network', 'DTS'], sc: 96, d: 'Use esta skill para desenhar e executar diagnósticos de cultura, prontidão para mudança e stakeholders com base e...', a: 'Vitorino, Victor', dt: '08/09/2026', s: [2, 2, 1] },
  { t: '[DTS] - Mapa de Impactos (Estrutura Completa) - GMO (Gestão da Mudança)', area: ['network', 'DTS'], sc: 98, d: 'Builds and maintains a complete Change Impact Assessment workspace for organizational transformation projects. Use...', a: 'Vitorino, Victor', dt: '06/09/2026', s: [2, 5, 1] },
  { t: '[DTS] - Plano de Comunicação Estrutura Completa - GMO (Gestão da Mudança)', area: ['network', 'DTS'], sc: 91, d: 'Builds and maintains a living communication and engagement workspace for organizational change projects, including...', a: 'Vitorino, Victor', dt: '06/09/2026', s: [3, 7, 1] },
  { t: '[DTS] Análise de Custos de Empresas', area: ['network', 'DTS'], sc: 94, feat: true, d: 'Use esta skill para construir o baseline de custos de uma empresa (target de M&amp;A, cliente e...', a: 'Velame, Lais', dt: '15/09/2026', s: [4, 3, 3] },
  { t: '[DTS] Avaliação de Cibersegurança - IT DD', area: ['network', 'DTS'], sc: 92, feat: true, d: 'Use esta skill para avaliar a maturidade e efetividade de controles de segurança da informação de uma empresa em...', a: 'Velame, Lais', dt: '21/09/2026', s: [4, 3, 2] },
];

export function skillCard(s, extra = '') {
  return h(`<div class="scard panel ${s.feat ? 'feat' : ''}"><div class="bar"></div>${extra}<div class="in">
    <h4>${s.t}</h4>
    <div class="chips"><span class="chip">${icon('share')}Comum</span><span class="chip">${icon(s.area[0])}${s.area[1]}</span><span class="chip score">${icon(s.medal ? 'award' : 'trophy')}${s.sc}</span></div>
    <p class="desc">${s.d}</p>
    <div class="meta"><span>${icon('user')}${s.a}</span><span>${icon('calendar')}${s.dt}</span></div>
    <div class="stats"><span>${icon('heart')}${s.s[0]}</span><span>${icon('download')}${s.s[1]}</span><span>${icon('star')}${s.s[2]}</span></div>
  </div></div>`);
}

export function libHeader() {
  return h(`<div class="libhead panel"><div class="row1"><h2>Biblioteca de Skills</h2><span class="cnt"><span class="cn">441</span> skills</span>
    <span class="btnpub">${icon('uptoline')}Publicar skill</span></div>
    <div class="search">${icon('search')}<span>Buscar por nome, slug, método, criador ou especialização...</span></div></div>`);
}

export function filterChip(label, val, or = false) {
  return h(`<div class="fchip panel ${or ? 'or' : ''}">${dots()}<span>${label}:</span><b>${val}</b><span class="n">441</span>${icon('chevdown')}</div>`);
}

export function shareButton() {
  return h(`<div class="sharebtn">${icon('upload')}Compartilhar Skill</div>`);
}

// ---------- Compartilhar Skill modal ----------
export function shareModal() {
  const el = h(`<div class="modal panel">
    <span class="x">${icon('x')}</span>
    <h2>Compartilhar Skill</h2>
    <p class="lead">Compartilhe uma skill com o time enviando um arquivo ZIP ou arquivos individuais. Requisito: SKILL.md na raiz com frontmatter YAML (name e description). Pode incluir arquivos adicionais como LICENSE, README, scripts, etc.</p>
    <div class="hr"></div>
    <div class="stepper"><span class="st"><span class="c on s1">1</span>Arquivos</span><span class="ln"><i></i></span><span class="st off s2t"><span class="c off s2">2</span>Detalhes</span></div>
    <div class="fld f-name"><label>Nome da skill</label><div class="inp ph"><span class="v">Ex.: [ÁREA] - Nome da skill</span></div></div>
    <div class="fld f-where"><label>Onde foi testada</label><div class="inp ph"><span class="v">Ex.: Cursor, ambiente local, repositório interno...</span></div>
      <div class="hint">Campo separado do nome: indica em que contexto ou ferramenta a skill foi validada.</div>
      <div class="dd" style="display:none"><div class="hd">Sugestões salvas</div><div class="op o1">${icon('clock')}Flows / Claude</div><div class="op o2">${icon('clock')}Claude Code · local</div></div></div>
    <div class="fld f-model"><label>Modelo testado <span class="req">*</span></label><div class="inp ph"><span class="v">Selecione o modelo Anthropic</span><span class="okc">${icon('check', '', 3)}</span><span class="sel">${icon('chevdown')}</span></div>
      <div class="hint">Modelo LLM com o qual a skill foi testada (obrigatório).</div></div>
    <div class="fld f-time"><label>Tempo manual (opcional)</label><div class="inp ph"><span class="v">Ex: 120</span></div>
      <div class="hint">Tempo que a tarefa levava para fazer na mão, em minutos.</div></div>
    <div class="fld f-mode"><label>Modo de Upload</label>
      <div class="radio r1"><span class="r"><i></i></span>${icon('folder')}Selecionar arquivos individuais</div>
      <div class="radio r2"><span class="r"><i></i></span>${icon('folderzip')}Upload de arquivo ZIP</div></div>
    <div class="fld f-file"><label class="fl">Arquivos da Skill</label><div class="file"><span class="cf">Choose File</span><span class="nm"><span class="zipi"></span><span class="fv">No file chosen</span></span></div>
      <div class="hint">Envie um arquivo .zip contendo SKILL.md obrigatório na raiz. Pode incluir outros arquivos (LICENSE, README, etc) e pastas opcionais (scripts/, references/, assets/)</div></div>
    <div class="foot"><span class="lk">Ver biblioteca de skills</span><span class="btn-c">Cancelar</span><span class="btn-n">Próximo${icon('arrowright')}<i class="shine"></i></span></div>
  </div>`);
  const q = (s) => el.querySelector(s);
  const ref = {
    name: q('.f-name .inp'), nameV: q('.f-name .v'),
    where: q('.f-where .inp'), whereV: q('.f-where .v'), whereHint: q('.f-where .hint'), dd: q('.f-where .dd'), o1: q('.o1'), o2: q('.o2'),
    model: q('.f-model .inp'), modelV: q('.f-model .v'), modelOk: q('.f-model .okc'), modelReq: q('.f-model .req'),
    time: q('.f-time .inp'), timeV: q('.f-time .v'),
    r1: q('.r1 .r i'), r2: q('.r2 .r i'), fileLbl: q('.f-file .fl'), fileV: q('.f-file .fv'), zipi: q('.f-file .zipi'), file: q('.f-file .file'),
    s1: q('.s1'), s2: q('.s2'), s2t: q('.s2t'), ln: q('.stepper .ln i'), next: q('.btn-n'),
  };
  const PH = { name: 'Ex.: [ÁREA] - Nome da skill', where: 'Ex.: Cursor, ambiente local, repositório interno...', model: 'Selecione o modelo Anthropic', time: 'Ex: 120' };
  const caret = '<span class="caret"></span>';
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let last = '';
  el.setState = (st) => {
    const key = JSON.stringify(st);
    if (key === last) return;
    last = key;
    const setInp = (box, v, val, ph, focus, car) => {
      box.classList.toggle('ph', !val);
      box.classList.toggle('focus', !!focus);
      v.innerHTML = (val ? esc(val) : ph) + (focus && car ? caret : '');
    };
    setInp(ref.name, ref.nameV, st.name, PH.name, st.focus === 'name', st.caret);
    if (st.name && st.name.startsWith('[DTS]')) ref.nameV.innerHTML = `<span class="pfx${st.pfx ? ' on' : ''}">[DTS]</span>` + esc(st.name.slice(5)) + (st.focus === 'name' && st.caret ? caret : '');
    setInp(ref.where, ref.whereV, st.where, PH.where, st.focus === 'where', st.caret);
    ref.where.classList.toggle('filled2', !!st.whereFilled);
    ref.whereHint.classList.toggle('hl', !!st.whereHint);
    ref.dd.style.display = st.dd > 0.001 ? 'block' : 'none';
    ref.dd.style.opacity = st.dd || 0;
    ref.dd.style.transform = `scaleY(${0.85 + 0.15 * (st.dd || 0)})`;
    ref.o1.classList.toggle('on', st.ddHi === 1);
    ref.o2.classList.toggle('on', st.ddHi === 2);
    setInp(ref.model, ref.modelV, st.model, PH.model, st.focus === 'model', false);
    ref.modelOk.style.display = st.modelOk ? 'grid' : 'none';
    ref.modelReq.style.color = st.reqPulse ? `rgb(${Math.round(18 + 200 * st.reqPulse)},${Math.round(36 + 40 * st.reqPulse)},${Math.round(79 - 40 * st.reqPulse)})` : '';
    setInp(ref.time, ref.timeV, st.time, PH.time, st.focus === 'time', st.caret);
    const m = st.mode || 0;
    ref.r1.style.transform = `scale(${1 - m})`;
    ref.r2.style.transform = `scale(${m})`;
    ref.fileLbl.textContent = m > 0.5 ? 'Arquivo ZIP' : 'Arquivos da Skill';
    ref.fileV.innerHTML = st.file ? `<b>${st.file}</b>` : 'No file chosen';
    ref.zipi.style.display = st.file ? 'inline-block' : 'none';
    ref.file.style.borderColor = st.file ? '#34c47c' : '';
    ref.file.style.boxShadow = st.file ? '0 0 0 4px rgba(52,196,124,.18)' : '';
    const sp = st.stepP || 0;
    ref.ln.style.width = `${sp * 100}%`;
    ref.s1.className = 'c ' + (sp >= 1 ? 'done' : 'on') + ' s1';
    ref.s1.innerHTML = sp >= 1 ? icon('check', '', 3.2) : '1';
    ref.s2.className = 'c ' + (sp >= 1 ? 'on' : 'off') + ' s2';
    ref.s2t.classList.toggle('off', sp < 1);
    ref.next.style.transform = `translateY(${(st.press || 0) * 3}px) scale(${1 - (st.press || 0) * 0.04})`;
    ref.next.style.filter = st.press ? `brightness(${1 + st.press * 0.35})` : '';
  };
  el.fieldRects = () => {
    // Offsets (in modal CSS px, unzoomed) of key rows, for camera framing and callouts.
    const r = el.getBoundingClientRect(), z = el.getBoundingClientRect().width / el.offsetWidth || 1;
    const pick = (s) => {
      const b = el.querySelector(s).getBoundingClientRect();
      return { x: (b.left - r.left) / z, y: (b.top - r.top) / z, w: b.width / z, h: b.height / z };
    };
    return { name: pick('.f-name .inp'), where: pick('.f-where .inp'), model: pick('.f-model .inp'), time: pick('.f-time .inp'), mode: pick('.f-mode'), file: pick('.f-file .file'), next: pick('.btn-n'), stepper: pick('.stepper'), W: el.offsetWidth, H: el.offsetHeight };
  };
  return el;
}

export function modelPill(name, badge) {
  return h(`<div class="mpill"><span class="b">${badge}</span>${name}</div>`);
}

export function fileChip(name, kind = 'file', gold = false) {
  const ic = kind === 'dir' ? icon('folder') : icon('filetext');
  return h(`<div class="fchip3 ${gold ? 'gold' : ''}">${ic}${name}${gold ? '<span class="root">RAIZ</span>' : ''}</div>`);
}
