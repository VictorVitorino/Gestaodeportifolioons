"""Extrai atividades e pontos de atenção (com status) dos decks A&M Comitê Gestor / Executivo.

Status de atividades é codificado por ícones sobrepostos à coluna "Status" da tabela;
o mapeamento é feito por geometria (offsets EMU, alturas de linha do XML, transformações de grupo).
"""
import json
import re
import sys
import zipfile
from lxml import etree

NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}
RELNS = '{http://schemas.openxmlformats.org/package/2006/relationships}'
MONTHS = {'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4, 'maio': 5, 'junho': 6,
          'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12}


def riscado(run):
    rpr = run.find('a:rPr', NS)
    return rpr is not None and rpr.get('strike') in ('sngStrike', 'dblStrike')


def text_of(el, ignorar_riscado=False):
    """Texto do elemento; com ignorar_riscado, descarta runs tachados (ex.: prazo antigo 04/09 riscado ao lado do novo)."""
    paras = []
    for p in el.iter('{%s}p' % NS['a']):
        partes = []
        for r in p:
            tag = etree.QName(r).localname
            if tag not in ('r', 'fld'):
                continue
            if ignorar_riscado and riscado(r):
                continue
            partes.extend(t.text or '' for t in r.iter('{%s}t' % NS['a']))
        paras.append(''.join(partes))
    return '\n'.join(x for x in paras if x.strip()).strip()


def slide_order(z):
    pres = etree.fromstring(z.read('ppt/presentation.xml'))
    rels = etree.fromstring(z.read('ppt/_rels/presentation.xml.rels'))
    rmap = {r.get('Id'): r.get('Target') for r in rels.iter(RELNS + 'Relationship')}
    out = []
    for sid in pres.find('p:sldIdLst', NS):
        rid = sid.get('{%s}id' % NS['r'])
        out.append('ppt/' + rmap[rid].lstrip('/').replace('ppt/', ''))
    return out


class Xf:
    """Affine transform child->slide (scale + translate), composed for nested groups."""

    def __init__(self, sx=1.0, sy=1.0, tx=0.0, ty=0.0):
        self.sx, self.sy, self.tx, self.ty = sx, sy, tx, ty

    def apply(self, x, y):
        return self.sx * x + self.tx, self.sy * y + self.ty

    def compose_group(self, grpSpPr):
        xfrm = grpSpPr.find('a:xfrm', NS)
        if xfrm is None:
            return self
        off, ext = xfrm.find('a:off', NS), xfrm.find('a:ext', NS)
        choff, chext = xfrm.find('a:chOff', NS), xfrm.find('a:chExt', NS)
        ox, oy = int(off.get('x')), int(off.get('y'))
        cx, cy = int(ext.get('cx')), int(ext.get('cy'))
        chx, chy = int(choff.get('x')), int(choff.get('y'))
        chcx, chcy = int(chext.get('cx')) or 1, int(chext.get('cy')) or 1
        gsx, gsy = cx / chcx, cy / chcy
        # child -> group parent space: x' = ox + (x - chx) * gsx
        ltx, lty = ox - chx * gsx, oy - chy * gsy
        return Xf(self.sx * gsx, self.sy * gsy, self.sx * ltx + self.tx, self.sy * lty + self.ty)


def color_of(fill_parent):
    """Return a color token for the shape fill: hex, scheme:<name>, 'none' or None."""
    if fill_parent is None:
        return None
    if fill_parent.find('a:noFill', NS) is not None:
        return 'none'
    sf = fill_parent.find('a:solidFill', NS)
    if sf is None:
        return None
    c = sf[0]
    tag = etree.QName(c).localname
    if tag == 'srgbClr':
        return c.get('val').upper()
    if tag == 'schemeClr':
        return 'scheme:' + c.get('val')
    return tag


def shape_info(sp, xf):
    spPr = sp.find('p:spPr', NS)
    if spPr is None:
        return None
    xfrm = spPr.find('a:xfrm', NS)
    if xfrm is None:
        # placeholder herdando posição do layout: mantém só o texto
        return {'name': sp.find('.//p:cNvPr', NS).get('name'), 'geom': None, 'fill': None, 'line': None,
                'x0': 0, 'y0': 0, 'x1': 0, 'y1': 0, 'text': text_of(sp), 'placeholder': True}
    off, ext = xfrm.find('a:off', NS), xfrm.find('a:ext', NS)
    x, y = int(off.get('x')), int(off.get('y'))
    cx, cy = int(ext.get('cx')), int(ext.get('cy'))
    x0, y0 = xf.apply(x, y)
    x1, y1 = xf.apply(x + cx, y + cy)
    geom = spPr.find('a:prstGeom', NS)
    fill = color_of(spPr)
    style_fill = None
    st = sp.find('p:style', NS)
    if st is not None and st.find('a:fillRef', NS) is not None and len(st.find('a:fillRef', NS)):
        c = st.find('a:fillRef', NS)[0]
        style_fill = (c.get('val') or '').upper() if etree.QName(c).localname == 'srgbClr' else 'scheme:' + (c.get('val') or '')
    ln = spPr.find('a:ln', NS)
    line = color_of(ln) if ln is not None else None
    name = sp.find('.//p:cNvPr', NS).get('name')
    return {
        'name': name, 'geom': geom.get('prst') if geom is not None else None,
        'fill': fill if fill is not None else style_fill, 'line': line,
        'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1, 'text': text_of(sp),
    }


def walk(tree_parent, xf, out, group_id=None, counter=[0]):
    for ch in tree_parent:
        tag = etree.QName(ch).localname
        if tag == 'sp':
            info = shape_info(ch, xf)
            if info:
                info['group'] = group_id
                out.append(info)
        elif tag == 'grpSp':
            counter[0] += 1
            gid = counter[0]
            nxf = xf.compose_group(ch.find('p:grpSpPr', NS))
            walk(ch, nxf, out, gid if group_id is None else group_id, counter)
        elif tag == 'graphicFrame':
            out.append({'frame': ch, 'xf': xf})
        elif tag == 'pic':
            pass


def tables(frames):
    res = []
    for fr in frames:
        g = fr['frame']
        tbl = g.find('.//a:tbl', NS)
        if tbl is None:
            continue
        xfrm = g.find('p:xfrm', NS)
        off = xfrm.find('a:off', NS)
        ox, oy = fr['xf'].apply(int(off.get('x')), int(off.get('y')))
        cols = [int(c.get('w')) for c in tbl.find('a:tblGrid', NS)]
        rows = []
        y = oy
        for tr in tbl.findall('a:tr', NS):
            h = int(tr.get('h'))
            cells = []
            for tc in tr.findall('a:tc', NS):
                tcPr = tc.find('a:tcPr', NS)
                cells.append({
                    'text': text_of(tc, ignorar_riscado=True),
                    'fill': color_of(tcPr) if tcPr is not None else None,
                    'rowSpan': int(tc.get('rowSpan', 1)), 'vMerge': tc.get('vMerge') == '1',
                    'gridSpan': int(tc.get('gridSpan', 1)), 'hMerge': tc.get('hMerge') == '1',
                })
            rows.append({'y0': y, 'y1': y + h, 'cells': cells})
            y += h
        xs = [ox]
        for w in cols:
            xs.append(xs[-1] + w)
        res.append({'x': xs, 'rows': rows})
    return res


def classify(parts):
    """parts: shapes that make up one status icon."""
    fills = [p['fill'] for p in parts]
    geoms = [p['geom'] for p in parts]
    has_arc = any(g in ('arc', 'chord', 'pie', 'blockArc') for g in geoms)
    greens = {'92D050', '00B050', '70AD47', '00B04F'}
    yellows = {'FFC000', 'FFFF00', 'FFD966', 'FCBF00'}
    reds = {'FF0000', 'C00000', 'BC0404', 'E23500'}
    if any(f in greens for f in fills):
        return 'concluido'
    if any(f in yellows for f in fills):
        return 'em_atraso' if has_arc else 'amarelo_cheio'
    if any(f in reds for f in fills):
        return 'vermelho'
    if has_arc:
        return 'em_andamento'
    if all(g == 'ellipse' for g in geoms):
        return 'nao_iniciado'
    return 'desconhecido:' + ','.join(f'{g}/{f}' for g, f in zip(geoms, fills))


def icons_in_column(shapes, x0, x1, y0, y1):
    """Group icon shapes whose centre lies within the column band."""
    cand = []
    for s in shapes:
        if 'frame' in s:
            continue
        if s['geom'] not in ('ellipse', 'arc', 'chord', 'pie', 'blockArc', 'flowChartConnector', 'donut'):
            continue
        cx, cy = (s['x0'] + s['x1']) / 2, (s['y0'] + s['y1']) / 2
        w = s['x1'] - s['x0']
        if not (x0 <= cx <= x1 and y0 <= cy <= y1):
            continue
        if w > (x1 - x0) * 0.9:
            continue
        cand.append(dict(s, cx=cx, cy=cy))
    # cluster by overlapping centre (icons are oval+arc stacked)
    clusters = []
    for s in sorted(cand, key=lambda s: s['cy']):
        for c in clusters:
            if abs(c[0]['cy'] - s['cy']) < 60000 and abs(c[0]['cx'] - s['cx']) < 60000:
                c.append(s)
                break
        else:
            clusters.append([s])
    return clusters


def parse_date_br(s, year_hint):
    m = re.search(r'(\d{1,2})/(\d{1,2})', s or '')
    if not m:
        return None
    d, mth = int(m.group(1)), int(m.group(2))
    return f'{year_hint:04d}-{mth:02d}-{d:02d}'


def main(path, label):
    z = zipfile.ZipFile(path)
    order = slide_order(z)
    editions, cur = [], None
    slides_meta = []
    for idx, part in enumerate(order, start=1):
        root = etree.fromstring(z.read(part))
        hidden = root.get('show') == '0'
        spTree = root.find('.//p:cSld/p:spTree', NS)
        shapes = []
        walk(spTree, Xf(), shapes)
        frames = [s for s in shapes if 'frame' in s]
        shapes = [s for s in shapes if 'frame' not in s]
        alltext = ' '.join(s['text'] for s in shapes if s.get('text'))
        title = ''
        for s in sorted(shapes, key=lambda s: (s['y0'], s['x0'])):
            if s['text'] and len(s['text']) > 6 and not s['text'].isdigit():
                title = s['text'].split('\n')[0]
                break
        m = re.search(r'(\d{1,2}) de (\w+) (?:de )?(20\d\d)', alltext)
        if 'Projeto Maestro' in alltext and m:
            dd, mm, yy = int(m.group(1)), MONTHS[m.group(2).lower()], int(m.group(3))
            cur = {'data': f'{yy:04d}-{mm:02d}-{dd:02d}', 'rotulo': f'{dd:02d}/{mm:02d}/{yy}', 'slide_capa': idx,
                   'oculto': hidden, 'slides': [], 'atividades': [], 'pontos_atencao': [], 'riscos_anexo': []}
            editions.append(cur)
        slides_meta.append({'n': idx, 'part': part, 'oculto': hidden, 'titulo': title,
                            'edicao': cur['data'] if cur else None})
        if cur is not None:
            cur['slides'].append(idx)
        year = int(cur['data'][:4]) if cur else 2026
        for t in tables(frames):
            hdr = [c['text'].replace('\n', ' ') for c in t['rows'][0]['cells']]
            hdr_l = [h.lower() for h in hdr]
            if 'atividade' in hdr_l and 'status' in hdr_l:
                si = hdr_l.index('status')
                x0, x1 = t['x'][si], t['x'][si + 1]
                body = t['rows'][1:]
                legend_words = ('Não Iniciado', 'Em Andamento', 'Em Atraso', 'Concluído', 'LEGENDA')
                legend_groups = {sh['group'] for sh in shapes if sh.get('group') and any(w.lower() in (sh.get('text') or '').lower() for w in legend_words)}
                icon_shapes = [sh for sh in shapes if sh.get('group') not in legend_groups or sh.get('group') is None]
                clusters = icons_in_column(icon_shapes, x0 - 150000, x1 + 150000, body[0]['y0'] - 200000, 6858000)
                act_rows = [ri for ri, r in enumerate(body) if r['cells'][hdr_l.index('atividade')]['text'].strip()]
                row_status, metodo = {}, 'ordem'
                if len(clusters) == len(act_rows):
                    # ícones posicionados visualmente no PowerPoint: a ordem vertical é o sinal confiável
                    for ri, c in zip(act_rows, clusters):
                        row_status[ri] = [classify(c)]
                else:
                    metodo = 'geometria'
                    for c in clusters:
                        cy = sum(sh['cy'] for sh in c) / len(c)
                        best = next((ri for ri, r in enumerate(body) if r['y0'] <= cy <= r['y1']), None)
                        if best is None:
                            best = min(range(len(body)), key=lambda ri: abs((body[ri]['y0'] + body[ri]['y1']) / 2 - cy))
                        row_status.setdefault(best, []).append(classify(c))
                frente = ''
                ai, pi = hdr_l.index('atividade'), next((i for i, h in enumerate(hdr_l) if h.startswith('prazo')), None)
                oi = next((i for i, h in enumerate(hdr_l) if h.startswith('próximos') or 'observa' in h), None)
                fi = next((i for i, h in enumerate(hdr_l) if 'frente' in h), None)
                for ri, r in enumerate(body):
                    cells = r['cells']
                    if fi is not None and cells[fi]['text'] and not cells[fi]['vMerge']:
                        frente = cells[fi]['text'].replace('\n', ' ')
                    atv = cells[ai]['text'].replace('\n', ' ').strip()
                    if not atv:
                        continue
                    sts = row_status.get(ri, [])
                    cur['atividades'].append({
                        'slide': idx, 'oculto': hidden, 'frente': frente, 'atividade': atv,
                        'prazo': cells[pi]['text'].strip() if pi is not None else '',
                        'prazo_iso': parse_date_br(cells[pi]['text'], year) if pi is not None else None,
                        'status': sts[0] if len(sts) == 1 else ('ausente' if not sts else 'multiplo:' + '+'.join(sts)),
                        'observacoes': cells[oi]['text'].replace('\n', ' ').strip() if oi is not None else '',
                        'metodo_status': metodo, 'icones_detectados': len(clusters), 'linhas_atividade': len(act_rows),
                    })
            elif 'descrição' in hdr_l and 'status' in hdr_l:
                si = hdr_l.index('status')
                di = hdr_l.index('descrição')
                pli = next((i for i, h in enumerate(hdr_l) if h.startswith('plano')), None)
                rsi = next((i for i, h in enumerate(hdr_l) if h.startswith('respons')), None)
                pzi = next((i for i, h in enumerate(hdr_l) if h.startswith('prazo')), None)
                is_risk_annex = 'Gestão de riscos' in title
                body = t['rows'][1:]
                x0, x1 = t['x'][si], t['x'][si + 1]
                clusters = icons_in_column(shapes, x0 - 150000, x1 + 150000, body[0]['y0'] - 200000, body[-1]['y1'] + 50000)
                row_icons = {}
                for c in clusters:
                    cy = sum(s['cy'] for s in c) / len(c)
                    best = next((ri for ri, r in enumerate(body) if r['y0'] <= cy <= r['y1']), None)
                    if best is None:
                        best = min(range(len(body)), key=lambda ri: abs((body[ri]['y0'] + body[ri]['y1']) / 2 - cy))
                    row_icons.setdefault(best, []).append([s['fill'] for s in c])
                for ri, r in enumerate(body):
                    cells = r['cells']
                    desc = cells[di]['text'].replace('\n', ' ').strip()
                    if not desc:
                        continue
                    item = {
                        'slide': idx, 'oculto': hidden, 'n': cells[0]['text'].strip(), 'descricao': desc,
                        'status': cells[si]['text'].replace('\n', ' ').strip(),
                        'status_fill': cells[si]['fill'], 'status_icones': row_icons.get(ri, []),
                        'plano_acao': cells[pli]['text'].replace('\n', ' ').strip() if pli is not None else '',
                        'responsavel': cells[rsi]['text'].strip() if rsi is not None else '',
                        'prazo': cells[pzi]['text'].strip() if pzi is not None else '',
                    }
                    (cur['riscos_anexo'] if is_risk_annex else cur['pontos_atencao']).append(item)
    return {'comite': label, 'arquivo': path.split('/')[-1], 'total_slides': len(order),
            'edicoes': editions, 'slides': slides_meta}


def extrair(gestor, executivo):
    return {'gestor': main(gestor, 'Comitê Gestor'), 'executivo': main(executivo, 'Comitê Executivo')}


if __name__ == '__main__':
    import argparse
    from collections import Counter
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--gestor', required=True, help='deck Master do Comitê Gestor (.pptx)')
    ap.add_argument('--executivo', required=True, help='deck Master do Comitê Executivo (.pptx)')
    ap.add_argument('-o', '--saida', required=True, help='JSON bruto de saída')
    a = ap.parse_args()
    out = extrair(a.gestor, a.executivo)
    json.dump(out, open(a.saida, 'w'), ensure_ascii=False, indent=1)
    for v in out.values():
        print('==', v['comite'], v['total_slides'], 'slides')
        for e in v['edicoes']:
            c = Counter(x['status'] for x in e['atividades'])
            geo = sum(1 for x in e['atividades'] if x['metodo_status'] != 'ordem')
            print(f"  {e['rotulo']} slides {e['slides'][0]}-{e['slides'][-1]} atividades={len(e['atividades'])} {dict(c)}"
                  f" pontos={len(e['pontos_atencao'])} riscos_anexo={len(e['riscos_anexo'])}" + (f' VERIFICAR({geo} por geometria)' if geo else ''))
