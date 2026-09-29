// Gera as caricaturas do time em SVG (traço de nanquim do caderno) e injeta no index.html.
// Uso: node prototypes/diagnostico-dts/caricaturas/gerar.mjs
// Estilo: cabeça levemente maior, olhos expressivos, sorriso simpático; nunca exagerar traços físicos.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INK = '#002B49';
const SW = 2.6;

const fillPath = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const line = (d, color = INK, w = SW, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const shape = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const mirror = d => `<g transform="translate(200 0) scale(-1 1)">${d}</g>`;

/* ------------------------------------------------------------ partes do corpo */
const FACE = {
  male: 'M 53 94 C 53 56, 75 36, 100 36 C 125 36, 147 56, 147 94 C 147 125, 129 153, 100 157 C 71 153, 53 125, 53 94 Z',
  female: 'M 54 94 C 54 57, 75 38, 100 38 C 125 38, 146 57, 146 94 C 146 126, 126 152, 100 154 C 74 152, 54 126, 54 94 Z'
};

function neck(p) {
  return fillPath('M 83 144 L 83 180 C 90 188, 110 188, 117 180 L 117 144 Z', p.skin) +
    shape('M 83 146 C 92 158, 108 158, 117 146 L 117 160 C 108 170, 92 170, 83 160 Z', p.shade, 'opacity=".6"');
}

function ears(p) {
  const ear = fillPath('M 54 94 C 40 88, 38 118, 55 116 Z', p.skin) + line('M 50 100 C 46 102, 47 108, 51 110', p.shade, 1.8);
  return ear + mirror(ear);
}

function eyes(p) {
  const out = [];
  for (const cx of [80, 120]) {
    const cy = 98;
    const ry = p.eye === 'smile' ? 5.2 : p.eye === 'calm' ? 5.4 : 6.4;
    const id = `${p.id}-eye${cx}`;
    out.push(`<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="9.6" ry="${ry}"/></clipPath>`);
    out.push(`<ellipse cx="${cx}" cy="${cy}" rx="9.6" ry="${ry}" fill="#FFFFFF"/>`);
    out.push(`<g clip-path="url(#${id})"><circle cx="${cx}" cy="${cy + 0.6}" r="5.1" fill="${p.iris}"/><circle cx="${cx}" cy="${cy + 0.6}" r="2.3" fill="#16110D"/><circle cx="${cx + 1.9}" cy="${cy - 1.3}" r="1.5" fill="#FFFFFF"/></g>`);
    out.push(line(`M ${cx - 10} ${cy - 0.5} C ${cx - 6} ${cy - 7.5}, ${cx + 6} ${cy - 7.5}, ${cx + 10} ${cy - 0.5}`, INK, 2.6));
    if (p.eye === 'smile') out.push(line(`M ${cx - 7.5} ${cy + 4.2} C ${cx - 3} ${cy + 2.4}, ${cx + 3} ${cy + 2.4}, ${cx + 7.5} ${cy + 4.2}`, INK, 1.4));
    if (p.lashes) {
      const s = cx < 100 ? -1 : 1;
      out.push(line(`M ${cx + s * 9.5} ${cy - 1.5} l ${s * 3.6} -2.6`, INK, 1.8));
    }
  }
  return out.join('');
}

function brows(p) {
  const w = p.browWidth || 3.4;
  const lift = p.browLift || 0;
  const left = `M 69 ${85 - lift} C 74 ${80 - lift}, 84 ${79 - lift}, 91 ${83 - lift}`;
  return line(left, p.browColor, w) + mirror(line(left, p.browColor, w));
}

const NOSE = line('M 101 104 C 98 111, 95.5 116, 99.5 118.5 C 101.5 119.6, 104 118.8, 105.4 117', INK, 2.1);

function faceShade(p) {
  return shape('M 139 70 C 146 84, 146 110, 137 131 C 131 142, 123 149, 113 153 C 126 144, 137 127, 140 104 C 141 90, 140 80, 139 70 Z', p.shade, 'opacity=".45"');
}

function cheeks() {
  return `<ellipse cx="71" cy="117" rx="8" ry="4.6" fill="#F08A7A" opacity=".26"/><ellipse cx="129" cy="117" rx="8" ry="4.6" fill="#F08A7A" opacity=".26"/>`;
}

function mouth(p) {
  if (p.mouth === 'grin') {
    const lips = p.lips ? fillPath('M 82 127 C 87 145, 113 145, 118 127 C 110 129.5, 104 126.5, 100 128.2 C 96 126.5, 90 129.5, 82 127 Z', p.lips, 'stroke-width="1.6"') : '';
    return lips +
      fillPath('M 85.5 129 C 90 140, 110 140, 114.5 129 C 106 131.2, 94 131.2, 85.5 129 Z', '#6E2A36', 'stroke-width="2"') +
      shape('M 87 129.8 C 94 131.8, 106 131.8, 113 129.8 C 112.4 132.8, 108 134.2, 100 134.2 C 92 134.2, 87.6 132.8, 87 129.8 Z', '#FFFFFF') +
      shape('M 93 137.4 C 97 135.6, 103 135.6, 107 137.4 C 104 138.6, 96 138.6, 93 137.4 Z', '#C9606B');
  }
  if (p.mouth === 'smile') {
    const lips = p.lips ? line('M 88 130.5 C 94 136.5, 106 136.5, 112 130.5', p.lips, 4) : '';
    return lips + line('M 88 130 C 94 136, 106 136, 112 130', INK, 2.4) + line('M 86.5 128.6 l 2.2 1.8', INK, 1.8) + line('M 113.5 128.6 l -2.2 1.8', INK, 1.8);
  }
  return line('M 90 131.5 C 96 134.5, 104 134.5, 110 131.5', INK, 2.4);
}

function beard(p) {
  if (!p.beard) return { base: '', stache: '' };
  const full = 'M 51 90 C 50 126, 68 163, 100 166 C 132 163, 150 126, 149 90 L 145 90 C 144 108, 139 121, 130 130 C 124 137, 119 143, 112.5 147 C 106 150, 94 150, 87.5 147 C 81 143, 76 137, 70 130 C 61 121, 56 108, 55 90 Z';
  const short = 'M 52.5 92 C 52.5 124, 69 157, 100 160 C 131 157, 147.5 124, 147.5 92 L 145.5 92 C 144.5 110, 140 123, 132 132 C 126 139, 120 144.5, 113 147.5 C 106 150, 94 150, 87 147.5 C 80 144.5, 74 139, 68 132 C 60 123, 55.5 110, 54.5 92 Z';
  const d = p.beard === 'short' ? short : full;
  const base = fillPath(d, p.beardColor || p.hair, 'stroke-width="2"') +
    (p.beard === 'short' ? '' : line('M 62 138 c 3 4, 6 7, 10 9.5 M 128 147.5 c 4 -2.5, 7 -5.5, 10 -9.5 M 94 160 c 4 1, 8 1, 12 0', p.hairShade, 1.6, 'opacity=".8"'));
  const stache = fillPath('M 85.5 125.2 C 90.5 120.4, 97 120.9, 100 122.6 C 103 120.9, 109.5 120.4, 114.5 125.2 C 109.5 126.6, 104 125.8, 100 126 C 96 125.8, 90.5 126.6, 85.5 125.2 Z', p.beardColor || p.hair, 'stroke-width="1.6"');
  return { base, stache };
}

function glasses(p) {
  if (!p.glasses) return '';
  const thick = p.glasses === 'thick';
  const w = thick ? 4 : 2.2;
  const c = thick ? '#15171B' : '#2A2D33';
  const lens = x => `<rect x="${x}" y="${thick ? 87 : 88}" width="${thick ? 30 : 28}" height="${thick ? 21 : 19}" rx="${thick ? 4.5 : 6}" fill="#FFFFFF" fill-opacity=".16" stroke="${c}" stroke-width="${w}"/>`;
  return lens(thick ? 65 : 66) + lens(thick ? 105 : 106) +
    line('M 94.5 96 C 97.5 92.8, 102.5 92.8, 105.5 96', c, w) +
    line(`M ${thick ? 65 : 66} 95 L 53 93`, c, w) + line(`M ${thick ? 135 : 134} 95 L 147 93`, c, w) +
    line(`M ${thick ? 70 : 71} 91 l 6 0`, '#FFFFFF', 1.6, 'opacity=".55"') + line(`M ${thick ? 110 : 111} 91 l 6 0`, '#FFFFFF', 1.6, 'opacity=".55"');
}

/* ------------------------------------------------------------ roupas */
const TORSO = 'M 12 222 C 14 196, 40 182, 76 176 L 124 176 C 160 182, 186 196, 188 222 Z';

function suit(p) {
  const tieClip = `${p.id}-tie`;
  const tieBody = 'M 95.5 190 L 104.5 190 L 110 222 L 90 222 Z';
  let pattern = '';
  if (p.tiePattern === 'stripes') {
    pattern = [0, 1, 2, 3, 4, 5].map(i => line(`M 84 ${196 + i * 7} L 118 ${182 + i * 7}`, p.tieStripe, 2.6)).join('');
  } else if (p.tiePattern === 'dots') {
    pattern = [[98, 196], [103, 202], [97, 208], [103, 214], [99, 219], [106, 208]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#FFFFFF" opacity=".85"/>`).join('');
  } else if (p.tiePattern === 'twill') {
    pattern = [0, 1, 2, 3, 4].map(i => line(`M 86 ${200 + i * 7} L 116 ${190 + i * 7}`, p.tieStripe, 1.2, 'opacity=".7"')).join('');
  }
  return fillPath(TORSO, p.jacket) +
    fillPath('M 77 176 L 100 214 L 123 176 Z', '#FFFFFF') +
    `<clipPath id="${tieClip}"><path d="${tieBody}"/></clipPath>` +
    fillPath(tieBody, p.tie) + `<g clip-path="url(#${tieClip})">${pattern}</g>` + line(tieBody, INK, 2.2) +
    fillPath('M 93.5 181 L 106.5 181 L 104.5 191 L 95.5 191 Z', p.tie, 'stroke-width="2.2"') +
    fillPath('M 79.5 173.5 L 91.5 190 L 100 181.5 Z', '#FFFFFF', 'stroke-width="2"') + mirror(fillPath('M 79.5 173.5 L 91.5 190 L 100 181.5 Z', '#FFFFFF', 'stroke-width="2"')) +
    line('M 77 176 L 88.5 200 L 80.5 204 L 96 222', INK, 2.2) + mirror(line('M 77 176 L 88.5 200 L 80.5 204 L 96 222', INK, 2.2)) +
    line('M 40 196 C 46 204, 50 212, 52 222', p.jacketShade, 2, 'opacity=".7"') + mirror(line('M 40 196 C 46 204, 50 212, 52 222', p.jacketShade, 2, 'opacity=".7"'));
}

function vest(p) {
  return fillPath(TORSO, p.shirt) +
    fillPath('M 32 222 C 36 202, 56 188, 80 183 L 100 213 L 120 183 C 144 188, 164 202, 168 222 Z', p.vest) +
    line('M 100 181 L 100 222', INK, 1.8) +
    [192, 204, 216].map(y => `<circle cx="104" cy="${y}" r="1.6" fill="#E7EBEF"/>`).join('') +
    fillPath('M 80 172.5 L 90 191 L 100 180.5 Z', p.shirt, 'stroke-width="2"') + mirror(fillPath('M 80 172.5 L 90 191 L 100 180.5 Z', p.shirt, 'stroke-width="2"')) +
    line('M 60 202 L 62 214', '#FFFFFF', 1.4, 'opacity=".25"');
}

function lace(p) {
  const wave = x0 => `M ${x0} 205 q 7 -8 14 0 t 14 0 t 14 0 t 14 0 t 14 0 t 14 0 t 14 0 t 14 0 t 14 0 t 14 0 t 14 0`;
  return fillPath(TORSO, p.top) +
    fillPath('M 75 175 C 82 196, 118 196, 125 175 Z', p.skin) +
    shape('M 83 179 C 90 188, 110 188, 117 179 L 117 181 C 110 191, 90 191, 83 181 Z', p.shade, 'opacity=".45"') +
    line(wave(26), '#5A6070', 2.4) + line(wave(26).replace('M 26 205', 'M 26 212'), '#3E4452', 1.4) +
    line('M 75 175 C 82 196, 118 196, 125 175', INK, 2.4);
}

function blouse(p) {
  return fillPath(TORSO, p.top) +
    fillPath('M 80 175 L 100 205 L 120 175 Z', p.skin) +
    shape('M 84 177 L 100 199 L 116 177 L 112 177 L 100 193 L 88 177 Z', p.shade, 'opacity=".4"') +
    line('M 84 180 C 90 193, 110 193, 116 180', p.gold, 1.5) + `<circle cx="100" cy="190.8" r="2.3" fill="${p.gold}" stroke="${INK}" stroke-width=".8"/>` +
    line('M 80 175 L 100 205 L 120 175', INK, 2.3) +
    line('M 46 198 C 54 206, 60 214, 62 222 M 154 198 C 146 206, 140 214, 138 222 M 70 186 C 74 196, 78 206, 80 214', '#C9D4DF', 2);
}

/* ------------------------------------------------------------ cabelos */
const HAIR = {
  receding: {
    front: 'M 52 92 C 50 57, 70 30, 100 30 C 130 30, 150 57, 148 92 L 145 92 C 144 80, 141 70, 135 63 C 127 56, 114 53.5, 100 53.5 C 86 53.5, 73 56, 65 63 C 59 70, 56 80, 55 92 Z',
    lines: 'M 70 44 C 80 38, 92 35.5, 104 35.5 M 112 36.5 C 124 38.5, 134 44, 140 52'
  },
  quiff: {
    sides: 'M 52.5 96 C 50 80, 52 68, 58 60 L 65 64 C 59 72, 56.5 84, 56.5 96 Z',
    front: 'M 55 77 C 52 54, 60 36, 72 28 C 84 19, 100 14, 117 16.5 C 135 19.5, 148 32, 150 54 C 151 62, 150 70, 147 75 C 140 67, 128 62, 114 61.5 C 100 61, 86 62, 74 64.5 C 66 66.5, 59 71, 55 77 Z',
    lines: 'M 66 48 C 76 32, 96 22, 118 23 M 76 58 C 88 42, 108 32, 134 36 M 98 61 C 110 50, 128 46, 144 52'
  },
  sidePart: {
    sides: 'M 52.5 96 C 50 80, 52 68, 58 60 L 65 64 C 59 72, 56.5 84, 56.5 96 Z',
    front: 'M 55 77 C 52 52, 66 31, 94 26 C 120 22, 145 33, 149 57 C 150 64, 149 70, 147 75 C 140 67, 128 62.5, 114 62.5 C 102 62.5, 92 60, 84 56.5 C 76 62, 64 69, 55 77 Z',
    lines: 'M 84 56.5 C 81 46, 84 37, 92 31 M 94 46 C 108 37, 126 36, 141 47 M 100 57 C 113 50, 130 51, 144 60'
  },
  textured: {
    sides: 'M 52.5 96 C 50 80, 52 68, 58 60 L 65 64 C 59 72, 56.5 84, 56.5 96 Z',
    front: 'M 55 75 C 50 48, 66 25, 94 19 C 118 14, 142 21, 150 39 C 154 49, 152 62, 147 72 C 140 65, 131 61.5, 121 61.5 C 113 64.5, 105 60.5, 97 64 C 89 61, 81 65.5, 73 64 C 65 66, 59 70, 55 75 Z',
    lines: 'M 62 52 C 70 38, 84 29, 100 26 M 78 58 C 90 45, 108 37, 126 38 M 100 60 C 112 52, 128 49, 143 55 M 116 26 C 128 25, 139 31, 146 40 M 90 36 C 100 30, 112 28, 122 29'
  },
  wavy: {
    back: 'M 42 104 C 32 64, 58 24, 100 24 C 142 24, 168 64, 158 104 C 166 128, 160 148, 170 170 C 176 186, 168 204, 154 206 C 150 200, 144 198, 140 202 C 134 194, 130 186, 128 178 L 72 178 C 70 186, 66 194, 60 202 C 56 198, 50 200, 46 206 C 32 204, 24 186, 30 170 C 40 148, 34 128, 42 104 Z',
    front: 'M 54 110 C 48 76, 60 44, 88 34 C 114 26, 144 38, 150 70 C 152 84, 150 96, 148 108 C 144 94, 140 82, 130 72 C 120 64, 108 64, 98 58 C 90 70, 76 72, 66 84 C 60 92, 58 100, 58 112 Z',
    over: 'M 58 176 C 50 184, 44 194, 48 204 C 44 208, 44 214, 48 218 C 58 212, 66 200, 70 182 Z',
    lines: 'M 66 64 C 78 50, 96 44, 116 46 M 38 122 C 35 142, 43 162, 37 184 M 162 122 C 165 142, 157 162, 163 184 M 128 54 C 138 60, 146 70, 148 84 M 50 150 C 46 164, 50 178, 44 194 M 150 150 C 154 164, 150 178, 156 194',
    shineWidth: 3.2
  },
  long: {
    back: 'M 42 100 C 36 58, 64 28, 100 28 C 138 28, 164 58, 158 100 L 160 186 C 162 204, 156 216, 146 222 L 128 176 L 72 176 L 54 222 C 44 216, 38 204, 40 186 Z',
    front: 'M 56 116 C 50 78, 58 46, 82 36 C 108 28, 142 38, 150 74 L 150 118 C 146 102, 142 88, 132 76 C 118 64, 98 60, 84 46 C 78 60, 68 78, 62 116 Z',
    over: 'M 48 150 C 44 176, 42 200, 46 222 L 64 222 C 60 204, 60 182, 62 158 Z',
    lines: 'M 92 40 C 108 36, 126 42, 138 56 M 46 162 C 45 182, 46 200, 50 218 M 154 162 C 155 182, 154 200, 150 218 M 66 70 C 62 84, 60 98, 60 110'
  }
};

function hairBack(p) {
  const h = HAIR[p.hairStyle];
  return h && h.back ? fillPath(h.back, p.hair) : '';
}
function hairFront(p) {
  const h = HAIR[p.hairStyle];
  if (p.hairStyle === 'bald') {
    const side = shape('M 52 96 C 50 76, 56 62, 64 56 L 66.5 60 C 60 68, 56.5 80, 56 96 Z', p.hair, 'opacity=".2"');
    return side + mirror(side) + line('M 78 48 C 88 41, 104 40, 116 44', '#FFFFFF', 5, 'opacity=".55"');
  }
  let out = (h.sides ? fillPath(h.sides, p.hairShade) + mirror(fillPath(h.sides, p.hairShade)) : '') +
    fillPath(h.front, p.hair) + line(h.lines, p.hairShine || p.hairShade, h.shineWidth || 2, 'opacity=".9"');
  if (h.over) out += fillPath(h.over, p.hair) + mirror(fillPath(h.over, p.hair));
  return out;
}

/* ------------------------------------------------------------ montagem */
function caricature(p) {
  const top = { suit, vest, lace, blouse }[p.outfit](p);
  const { base, stache } = beard(p);
  const earring = p.earrings === 'drop'
    ? `<ellipse cx="50" cy="121" rx="2.6" ry="4.6" fill="#23252D"/><ellipse cx="150" cy="121" rx="2.6" ry="4.6" fill="#23252D"/>`
    : p.earrings === 'stud' ? `<circle cx="52" cy="117" r="2.5" fill="${p.gold}" stroke="${INK}" stroke-width=".8"/><circle cx="148" cy="117" r="2.5" fill="${p.gold}" stroke="${INK}" stroke-width=".8"/>` : '';
  const body = [
    `<circle cx="100" cy="112" r="96" fill="#DFE8F0"/>`,
    hairBack(p),
    neck(p),
    top,
    p.ears !== false ? ears(p) : '',
    fillPath(FACE[p.face], p.skin),
    faceShade(p),
    cheeks(),
    base,
    brows(p),
    eyes(p),
    NOSE,
    `<g transform="translate(0 ${p.beard ? 2 : 0})">${mouth(p)}</g>`,
    stache,
    glasses(p),
    hairFront(p),
    earring
  ].join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 12 210 210" role="img" aria-label="Caricatura de ${p.name}"><title>${p.name}</title>${body}</svg>`;
}

/* ------------------------------------------------------------ o time */
export const TEAM = [
  { id: 'person01', name: 'Thiago Vieira', face: 'male', skin: '#DDA983', shade: '#C28C68', iris: '#4A3326', eye: 'smile',
    hairStyle: 'receding', hair: '#2B2420', hairShade: '#15110E', hairShine: '#4A3F38', browColor: '#2B2420', beard: 'full',
    glasses: 'thin', mouth: 'grin', outfit: 'suit', jacket: '#2C3440', jacketShade: '#1B2129', tie: '#22385A', tiePattern: 'stripes', tieStripe: '#C9CED6' },
  { id: 'person02', name: 'Ana Paula Costa', face: 'female', skin: '#F2CBAE', shade: '#DDAA8C', iris: '#5A3A22', eye: 'smile', lashes: true,
    hairStyle: 'wavy', hair: '#8A5A36', hairShade: '#6B4428', hairShine: '#D9AA6A', browColor: '#6B4428', browWidth: 2.8, browLift: 1,
    mouth: 'grin', lips: '#C9485F', outfit: 'lace', top: '#1A1C24', earrings: 'drop', ears: false },
  { id: 'person03', name: 'João Lopes', face: 'male', skin: '#EEC6A6', shade: '#D6A787', iris: '#3F2A1E', eye: 'smile',
    hairStyle: 'bald', hair: '#3A2C25', hairShade: '#241A15', browColor: '#3A2C25', beard: 'full',
    mouth: 'grin', outfit: 'suit', jacket: '#383C8C', jacketShade: '#262A66', tie: '#4B2A7B', tiePattern: 'dots' },
  { id: 'person04', name: 'Guilherme Antonialli', face: 'male', skin: '#F0CBAB', shade: '#D8AC8C', iris: '#3A2A20', eye: 'open',
    hairStyle: 'quiff', hair: '#3A2A20', hairShade: '#22180F', hairShine: '#5A463A', browColor: '#2E2119', browWidth: 3.8, beard: 'full',
    mouth: 'smile', outfit: 'suit', jacket: '#2D3035', jacketShade: '#1B1D21', tie: '#B3B9C1', tiePattern: 'twill', tieStripe: '#8E96A1' },
  { id: 'person05', name: 'Talita Galvão', face: 'female', skin: '#EBC09E', shade: '#D3A382', iris: '#3B2416', eye: 'smile', lashes: true,
    hairStyle: 'long', hair: '#3A2218', hairShade: '#241410', hairShine: '#6B4A3A', browColor: '#2E1A12', browWidth: 2.8, browLift: 1,
    mouth: 'grin', lips: '#C9485F', outfit: 'blouse', top: '#FAFAF7', gold: '#D4A74A', earrings: 'stud', ears: false },
  { id: 'person06', name: 'Alexandre Domingues', face: 'male', skin: '#EFC7A6', shade: '#D7A988', iris: '#4A3526', eye: 'open',
    hairStyle: 'sidePart', hair: '#3A2A22', hairShade: '#241A14', hairShine: '#5C4A40', browColor: '#2E2119', beard: 'short', beardColor: '#5B4739',
    mouth: 'smile', outfit: 'suit', jacket: '#56638C', jacketShade: '#3E496A', tie: '#7B2D82' },
  { id: 'person07', name: 'Marcos Massao', face: 'male', skin: '#F1CFB0', shade: '#DCB091', iris: '#2E2420', eye: 'calm',
    hairStyle: 'textured', hair: '#B3B8BD', hairShade: '#6F757B', hairShine: '#81878D', browColor: '#55595F', browWidth: 3.2,
    glasses: 'thick', mouth: 'smile', lips: '#D98C8C', outfit: 'vest', shirt: '#4B5563', vest: '#25304D' }
];

// Personagem neutro do storyboard (página 02): a própria pessoa que responde.
function you() {
  const body = [
    `<circle cx="100" cy="112" r="96" fill="#DFE8F0"/>`,
    fillPath('M 83 144 L 83 180 C 90 188, 110 188, 117 180 L 117 144 Z', '#BFD0E1'),
    fillPath(TORSO, '#BFD0E1'),
    fillPath('M 56 96 C 56 58, 76 40, 100 40 C 124 40, 144 58, 144 96 C 144 128, 126 152, 100 154 C 74 152, 56 128, 56 96 Z', '#BFD0E1'),
    `<text x="100" y="108" text-anchor="middle" font-family="Kalam, 'Segoe Print', cursive" font-size="30" font-weight="700" fill="${INK}">você</text>`
  ].join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 12 210 210" role="img" aria-label="Você"><title>Você</title>${body}</svg>`;
}

const art = { you: you() };
writeFileSync(join(HERE, 'voce.svg'), art.you);
for (const person of TEAM) {
  const svg = caricature(person);
  writeFileSync(join(HERE, `${person.id}.svg`), svg);
  art[person.id] = svg;
}

// Injeta no index.html (bloco entre os marcadores DTS_ART).
const htmlPath = join(HERE, '..', 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const start = '<script id="dts-art">';
const block = `${start}\n/* Caricaturas do time: geradas por caricaturas/gerar.mjs (não editar à mão). */\nwindow.DTS_ART = ${JSON.stringify(art)};\n</script>`;
const re = /<script id="dts-art">[\s\S]*?<\/script>/;
if (re.test(html)) writeFileSync(htmlPath, html.replace(re, block));
else if (process.argv.includes('--inject')) writeFileSync(htmlPath, html.replace('<script id="dts-core">', `${block}\n\n<script id="dts-core">`));
console.log(`caricaturas geradas: ${TEAM.length}`);
