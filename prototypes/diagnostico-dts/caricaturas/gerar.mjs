// Gera as caricaturas do time em SVG (traço de nanquim do caderno) e injeta no index.html.
// Uso: node prototypes/diagnostico-dts/caricaturas/gerar.mjs
// Estilo: cabeça levemente maior, olhos expressivos, sorriso simpático; nunca exagerar traços físicos.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const INK = '#002B49';
const SW = 2.4;

const fillPath = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const line = (d, color = INK, w = SW, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const shape = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const mirror = d => `<g transform="translate(200 0) scale(-1 1)">${d}</g>`;

/* ------------------------------------------------------------ partes do corpo */
const FACE = {
  male: 'M 53 92 C 53 56, 75 36, 100 36 C 125 36, 147 56, 147 92 C 147 124, 130 152, 100 156 C 70 152, 53 124, 53 92 Z',
  female: 'M 55 92 C 55 57, 76 38, 100 38 C 124 38, 145 57, 145 92 C 145 121, 128 148, 100 153 C 72 148, 55 121, 55 92 Z'
};

function neck(p) {
  return fillPath('M 84 142 L 84 180 C 90 187, 110 187, 116 180 L 116 142 Z', p.skin, 'stroke-width="2.2"') +
    shape('M 84 144 C 92 157, 108 157, 116 144 L 116 159 C 108 168, 92 168, 84 159 Z', p.shade, 'opacity=".55"');
}

function ears(p) {
  const ear = fillPath('M 55 92 C 42 86, 39 116, 56 115 Z', p.skin, 'stroke-width="2.2"') +
    line('M 51 97 C 46.5 99.5, 47.5 107, 52 109', p.shade, 1.8) + shape('M 50 101 C 48.5 103, 49 106, 51.5 107 L 52.5 101.5 Z', p.shade, 'opacity=".5"');
  return ear + mirror(ear);
}

// Olhos amendoados, íris com brilho duplo, pálpebra superior marcada e inferior suave.
function eyes(p) {
  const out = [];
  const smile = p.eye === 'smile';
  const calm = p.eye === 'calm';
  out.push(`<radialGradient id="${p.id}-iris" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="${p.irisLight || '#9A6B45'}"/><stop offset=".75" stop-color="${p.iris}"/></radialGradient>`);
  for (const cx of [80, 120]) {
    const cy = 99;
    const top = calm ? 6 : smile ? 6.3 : 7.1;
    const bottom = smile ? 3.9 : calm ? 4.4 : 5.2;
    const almond = `M ${cx - 10} ${cy} C ${cx - 6} ${cy - top * 1.25}, ${cx + 6} ${cy - top * 1.25}, ${cx + 10} ${cy} C ${cx + 6} ${cy + bottom * 1.2}, ${cx - 6} ${cy + bottom * 1.2}, ${cx - 10} ${cy} Z`;
    const id = `${p.id}-eye${cx}`;
    out.push(`<clipPath id="${id}"><path d="${almond}"/></clipPath>`);
    out.push(shape(almond, '#FFFFFF'));
    out.push(`<g clip-path="url(#${id})"><circle cx="${cx}" cy="${cy + 0.4}" r="6.1" fill="url(#${p.id}-iris)"/><circle cx="${cx}" cy="${cy + 0.4}" r="2.8" fill="#1A120D"/>` +
      `<circle cx="${cx + 2.3}" cy="${cy - 1.9}" r="2" fill="#FFFFFF"/><circle cx="${cx - 2}" cy="${cy + 2.4}" r=".9" fill="#FFFFFF" opacity=".85"/>` +
      shape(`M ${cx - 11} ${cy - 8} L ${cx + 11} ${cy - 8} L ${cx + 11} ${cy - top + 1.2} C ${cx + 5} ${cy - top - 1}, ${cx - 5} ${cy - top - 1}, ${cx - 11} ${cy - top + 1.2} Z`, INK, 'opacity=".07"') + '</g>');
    // pálpebra superior (mais grossa no centro, com leve prolongamento no canto externo)
    const s = cx < 100 ? -1 : 1;
    out.push(line(`M ${cx - 10.5} ${cy + 0.4} C ${cx - 6} ${cy - top * 1.32}, ${cx + 6} ${cy - top * 1.32}, ${cx + 10.5} ${cy + 0.4}`, INK, 2.5));
    out.push(line(`M ${cx + s * 10.3} ${cy + 0.2} l ${s * 2.2} -1.6`, INK, 2));
    // pálpebra inferior suave
    out.push(line(`M ${cx - 7.5} ${cy + bottom * 0.95} C ${cx - 3} ${cy + bottom * 1.25}, ${cx + 3} ${cy + bottom * 1.25}, ${cx + 7.5} ${cy + bottom * 0.95}`, p.shade, 1.4));
    if (p.lashes) out.push(line(`M ${cx + s * 9} ${cy - 3.2} l ${s * 3.4} -2.4 M ${cx + s * 6.4} ${cy - 5.4} l ${s * 2.4} -2.6`, INK, 1.5));
  }
  return out.join('');
}

// Sobrancelhas em pincelada: afinam nas pontas.
function brows(p) {
  const t = p.browWidth || 3.4;
  const lift = p.browLift || 0;
  const y = 84.5 - lift;
  const left = `M 68.5 ${y + 1.8} C 73 ${y - 4.2}, 83 ${y - 5.6}, 91.5 ${y - 1.4} C 84 ${y - 3.2 + t * 0.55}, 75 ${y - 1.6 + t * 0.7}, 68.5 ${y + 1.8} Z`;
  const brow = fillPath(left, p.browColor, `stroke="${p.browColor}" stroke-width="${Math.max(0.6, t * 0.35)}"`);
  return brow + mirror(brow);
}

// Nariz arredondado com sombra suave.
function nose(p) {
  return shape('M 100.5 103 C 99.5 109, 97.2 113.5, 98.2 116.8 C 100.4 118.6, 103.6 118.4, 105.6 116.6 C 103 116, 101.3 113.4, 102 103 Z', p.shade, 'opacity=".55"') +
    line('M 96.6 116.4 C 98.6 119.8, 104 119.8, 106 116.6', INK, 1.9) +
    line('M 103.4 106 C 104.6 109.5, 105.8 112.5, 106.2 115', p.shade, 1.4, 'opacity=".8"');
}

function faceShade(p) {
  return shape('M 139 70 C 146 84, 146 110, 137 131 C 131 142, 123 149, 113 153 C 126 144, 137 127, 140 104 C 141 90, 140 80, 139 70 Z', p.shade, 'opacity=".4"') +
    shape('M 62 66 C 74 56, 88 52, 100 52 C 112 52, 126 56, 138 66 C 126 60, 112 58, 100 58 C 88 58, 74 60, 62 66 Z', p.shade, 'opacity=".35"');
}

function cheeks() {
  return `<ellipse cx="84" cy="66" rx="11" ry="4.5" fill="#FFFFFF" opacity=".16"/><ellipse cx="70" cy="117" rx="8.5" ry="4.8" fill="#F08A7A" opacity=".22"/><ellipse cx="130" cy="117" rx="8.5" ry="4.8" fill="#F08A7A" opacity=".22"/>`;
}

function mouth(p) {
  if (p.mouth === 'grin') {
    const lips = p.lips
      ? shape('M 83 127.4 C 89 125, 95 125.4, 100 127 C 105 125.4, 111 125, 117 127.4 C 113 130, 107 130.6, 100 130.4 C 93 130.6, 87 130, 83 127.4 Z', p.lips) +
        shape('M 85.5 131 C 90 142.5, 110 142.5, 114.5 131 C 110 136, 90 136, 85.5 131 Z', p.lips) +
        line('M 95 140.2 C 98 141, 102 141, 105 140.2', '#FFFFFF', 1.2, 'opacity=".45"')
      : '';
    return lips +
      fillPath('M 86 129.2 C 90.5 139.6, 109.5 139.6, 114 129.2 C 106 131, 94 131, 86 129.2 Z', '#8C3A47', 'stroke-width="1.8"') +
      shape('M 87.4 129.9 C 94 131.6, 106 131.6, 112.6 129.9 C 112 132.6, 107.6 133.9, 100 133.9 C 92.4 133.9, 88 132.6, 87.4 129.9 Z', '#FFFFFF') +
      shape('M 93.5 137.2 C 97 135.4, 103 135.4, 106.5 137.2 C 103.5 138.4, 96.5 138.4, 93.5 137.2 Z', '#D46C75') +
      line('M 84 127.6 C 84.6 129.4, 85.6 130.4, 86.8 130.8 M 116 127.6 C 115.4 129.4, 114.4 130.4, 113.2 130.8', p.shade, 1.4);
  }
  if (p.mouth === 'smile') {
    const lips = p.lips ? line('M 89 131.4 C 94.5 136.6, 105.5 136.6, 111 131.4', p.lips, 3.6) : '';
    return lips + line('M 88.5 130.4 C 94 135.8, 106 135.8, 111.5 130.4', INK, 2.2) +
      line('M 86.8 129 C 87.6 130.2, 88.2 130.6, 89.2 130.8 M 113.2 129 C 112.4 130.2, 111.8 130.6, 110.8 130.8', INK, 1.5) +
      line('M 96.5 139.2 C 99 140.2, 101 140.2, 103.5 139.2', p.shade, 1.6);
  }
  return line('M 90.5 131.6 C 96 134.4, 104 134.4, 109.5 131.6', INK, 2.2) + line('M 96.5 138.6 C 99 139.6, 101 139.6, 103.5 138.6', p.shade, 1.6);
}

// Barba mais leve: preenchimento sem contorno pesado por dentro, textura e contorno só por fora.
function beard(p) {
  if (!p.beard) return { base: '', stache: '' };
  const full = { fill: 'M 51 90 C 50 126, 68 163, 100 166 C 132 163, 150 126, 149 90 L 145 90 C 144 108, 139 121, 130 130 C 124 137, 119 143, 112.5 147 C 106 150, 94 150, 87.5 147 C 81 143, 76 137, 70 130 C 61 121, 56 108, 55 90 Z',
    outer: 'M 51 90 C 50 126, 68 163, 100 166 C 132 163, 150 126, 149 90',
    inner: 'M 70 130 C 76 137, 81 143, 87.5 147 C 94 150, 106 150, 112.5 147 C 119 143, 124 137, 130 130' };
  const short = { fill: 'M 52.5 92 C 52.5 124, 69 157, 100 160 C 131 157, 147.5 124, 147.5 92 L 145.5 92 C 144.5 110, 140 123, 132 132 C 126 139, 120 144.5, 113 147.5 C 106 150, 94 150, 87 147.5 C 80 144.5, 74 139, 68 132 C 60 123, 55.5 110, 54.5 92 Z',
    outer: 'M 52.5 92 C 52.5 124, 69 157, 100 160 C 131 157, 147.5 124, 147.5 92',
    inner: 'M 68 132 C 74 139, 80 144.5, 87 147.5 C 94 150, 106 150, 113 147.5 C 120 144.5, 126 139, 132 132' };
  const b = p.beard === 'short' ? short : full;
  const color = p.beardColor || p.hair;
  const tex = p.beardTexture || p.hairShine || p.hairShade;
  const strokes = p.beard === 'short'
    ? 'M 60 122 l 2 4 M 70 138 l 2 3 M 84 151 l 1.5 3 M 100 155 l 0 3 M 116 151 l -1.5 3 M 130 138 l -2 3 M 140 122 l -2 4'
    : 'M 60 118 l 2 6 M 66 130 l 3 5 M 74 140 l 3 4 M 84 150 l 2 4 M 96 156 l 0 4 M 106 154 l -1 5 M 116 150 l -2 4 M 126 140 l -3 4 M 134 130 l -3 5 M 140 118 l -2 6';
  const base = shape(b.fill, color) +
    line(strokes, tex, 1.3, 'opacity=".55"') +
    line(b.outer, INK, 2.2) +
    line(b.inner, color, 1.2, 'opacity=".9"');
  const stache = shape('M 85.5 125.4 C 90.5 120.8, 97 121.2, 100 123 C 103 121.2, 109.5 120.8, 114.5 125.4 C 109.5 126.8, 104 126, 100 126.2 C 96 126, 90.5 126.8, 85.5 125.4 Z', color) +
    line('M 85.5 125.4 C 90.5 120.8, 97 121.2, 100 123 C 103 121.2, 109.5 120.8, 114.5 125.4', INK, 1.4) +
    line('M 90 123.6 l 1.5 1.4 M 95 122.6 l 1 1.8 M 105 122.6 l -1 1.8 M 110 123.6 l -1.5 1.4', tex, 1, 'opacity=".6"');
  return { base, stache };
}

function glasses(p) {
  if (!p.glasses) return '';
  const thick = p.glasses === 'thick';
  const w = thick ? 3.8 : 2;
  const c = thick ? '#15171B' : '#2A2D33';
  const lens = x => `<rect x="${x}" y="${thick ? 88 : 89}" width="${thick ? 30 : 28}" height="${thick ? 21 : 19}" rx="${thick ? 5 : 6.5}" fill="#DFE8F0" fill-opacity=".22" stroke="${c}" stroke-width="${w}"/>`;
  return lens(thick ? 65 : 66) + lens(thick ? 105 : 106) +
    line('M 94.5 97 C 97.5 93.8, 102.5 93.8, 105.5 97', c, w) +
    line(`M ${thick ? 65 : 66} 96 L 54 94`, c, w) + line(`M ${thick ? 135 : 134} 96 L 146 94`, c, w) +
    line(`M ${thick ? 69 : 70} 92.5 l 7 -0.4 M ${thick ? 109 : 110} 92.5 l 7 -0.4`, '#FFFFFF', 1.8, 'opacity=".6"') +
    line(`M ${thick ? 90 : 90} 104 l 2 -2 M ${thick ? 130 : 130} 104 l 2 -2`, '#FFFFFF', 1.4, 'opacity=".45"');
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
    line('M 70 198 C 74 206, 78 214, 79 222 M 130 198 C 126 206, 122 214, 121 222', '#D3DCE5', 1.8);
}

/* ------------------------------------------------------------ cabelos */
const HAIR = {
  receding: {
    front: 'M 52 92 C 50 57, 70 30, 100 30 C 130 30, 150 57, 148 92 L 145 92 C 144 80, 141 70, 135 63 C 127 56, 114 53.5, 100 53.5 C 86 53.5, 73 56, 65 63 C 59 70, 56 80, 55 92 Z',
    lines: 'M 70 44 C 80 38, 92 35.5, 104 35.5 M 112 36.5 C 124 38.5, 134 44, 140 52'
  },
  quiff: {
    sides: 'M 52.5 96 C 50 80, 52 68, 58 60 L 65 64 C 59 72, 56.5 84, 56.5 96 Z',
    front: 'M 55 77 C 52 56, 60 40, 72 32 C 84 23, 100 19, 117 21 C 134 24, 148 35, 150 55 C 151 63, 150 70, 147 75 C 140 67, 128 62, 114 61.5 C 100 61, 86 62, 74 64.5 C 66 66.5, 59 71, 55 77 Z',
    lines: 'M 66 50 C 76 36, 96 26, 118 27 M 76 59 C 88 45, 108 36, 134 40 M 98 61 C 110 51, 128 48, 144 54'
  },
  sidePart: {
    sides: 'M 52.5 96 C 50 80, 52 68, 58 60 L 65 64 C 59 72, 56.5 84, 56.5 96 Z',
    front: 'M 55 77 C 52 52, 66 31, 94 26 C 120 22, 145 33, 149 57 C 150 64, 149 70, 147 75 C 140 67, 128 62.5, 114 62.5 C 102 62.5, 92 60, 84 56.5 C 76 62, 64 69, 55 77 Z',
    lines: 'M 84 56.5 C 81 46, 84 37, 92 31 M 94 46 C 108 37, 126 36, 141 47 M 100 57 C 113 50, 130 51, 144 60'
  },
  textured: {
    sides: 'M 52.5 96 C 50 80, 52 68, 58 60 L 65 64 C 59 72, 56.5 84, 56.5 96 Z',
    front: 'M 55 75 C 50 52, 60 33, 78 25 C 82 19, 90 17, 96 19.5 C 102 15, 112 14.5, 118 18.5 C 126 16.5, 136 20, 140 27 C 149 32, 154 46, 151 59 C 150 65, 149 69, 147 72 C 140 65, 131 61.5, 121 61.5 C 113 64.5, 105 60.5, 97 64 C 89 61, 81 65.5, 73 64 C 65 66, 59 70, 55 75 Z',
    lines: 'M 62 52 C 70 38, 84 29, 100 26 M 78 58 C 90 45, 108 37, 126 38 M 100 60 C 112 52, 128 49, 143 55 M 116 26 C 128 25, 139 31, 146 40 M 90 36 C 100 30, 112 28, 122 29'
  },
  wavy: {
    back: 'M 42 104 C 32 64, 58 24, 100 24 C 142 24, 168 64, 158 104 C 166 128, 160 148, 170 170 C 176 186, 168 204, 154 206 C 150 200, 144 198, 140 202 C 134 194, 130 186, 128 178 L 72 178 C 70 186, 66 194, 60 202 C 56 198, 50 200, 46 206 C 32 204, 24 186, 30 170 C 40 148, 34 128, 42 104 Z',
    front: 'M 45 100 C 38 62, 62 24, 100 24 C 138 24, 160 58, 154 96 L 150 112 C 146 92, 136 76, 120 68 C 104 61, 88 60, 76 64 C 66 70, 60 80, 58 92 L 56 112 Z',
    over: 'M 60 172 C 52 180, 46 190, 48 202 C 50 212, 58 216, 64 212 C 60 204, 62 194, 70 184 Z',
    lines: 'M 60 56 C 72 40, 92 32, 114 33 M 38 122 C 35 142, 43 162, 37 184 M 162 122 C 165 142, 157 162, 163 184 M 126 44 C 140 52, 148 66, 150 82 M 50 150 C 46 164, 50 178, 44 194 M 150 150 C 154 164, 150 178, 156 194 M 84 48 C 96 44, 110 44, 122 50',
    shineWidth: 3.2
  },
  long: {
    back: 'M 42 100 C 36 58, 64 28, 100 28 C 138 28, 164 58, 158 100 L 160 186 C 162 204, 156 216, 146 222 L 128 176 L 72 176 L 54 222 C 44 216, 38 204, 40 186 Z',
    front: 'M 55 116 C 49 78, 58 46, 82 36 C 108 28, 142 38, 150 74 L 150 118 C 146 102, 142 88, 132 76 C 118 64, 98 60, 84 46 C 74 58, 62 76, 58.5 116 Z',
    over: 'M 50 150 C 46 176, 44 200, 47 222 L 64 222 C 61 204, 60 184, 61 164 C 60 158, 56 152, 50 150 Z',
    lines: 'M 92 40 C 108 36, 126 42, 138 56 M 46 162 C 45 182, 46 200, 50 218 M 154 162 C 155 182, 154 200, 150 218 M 100 44 C 114 46, 128 56, 138 70'
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
    nose(p),
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
    hairStyle: 'receding', hair: '#2B2420', hairShade: '#15110E', hairShine: '#4A3F38', browColor: '#2B2420', beard: 'full', beardColor: '#352A24', beardTexture: '#5A4A40',
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
    hairStyle: 'textured', hair: '#BCC1C6', hairShade: '#6F757B', hairShine: '#8A9096', browColor: '#55595F', browWidth: 3.2,
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
