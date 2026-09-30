"""Consolida a extração bruta (extrair_comites.py) no dataset do painel executivo.

Regras (DECISAO_FUNCIONAL_PRODUTO, documentadas no README):
- Status de atividade = exatamente o ícone reportado no deck; nada é inferido.
- Numa reunião cuja capa está visível (edição vigente), slides ocultos são cópias de trabalho que
  não foram apresentadas e são ignorados; em reuniões arquivadas (capa oculta) todos os slides contam.
- Dentro de uma mesma reunião, se a atividade aparece em mais de um slide, vale a primeira
  ocorrência (os decks Master empilham o retrato mais recente primeiro).
- Consolidação entre reuniões pela descrição normalizada (acentos/pontuação/caixa ignorados).
- Variantes de redação da mesma atividade são unificadas só quando: nunca coexistem na mesma
  reunião, similaridade >= 0,93, mesmo verbo inicial (4 letras) e os mesmos números
  (evita juntar "Agendamento" x "Realização" ou "3ª" x "4ª Sessão"). Cada junção fica em `aliases`.
- Pontos de atenção consolidados pelo início normalizado da descrição (60 caracteres).
"""


def mesma_atividade(a, b):
    na, nb = norm(a['atividade']), norm(b['atividade'])
    ea = {h['edicao'] for h in a['historico']}
    eb = {h['edicao'] for h in b['historico']}
    if ea & eb or not na or not nb:
        return False
    if na.split()[0][:4] != nb.split()[0][:4]:
        return False
    if re.findall(r'\d+', na) != re.findall(r'\d+', nb):
        return False
    return difflib.SequenceMatcher(None, na, nb).ratio() >= 0.93


def unificar(lista):
    lista = sorted(lista, key=lambda a: a['historico'][0]['edicao'])
    out = []
    for a in lista:
        alvo = next((b for b in out if b['historico'][-1]['edicao'] < a['historico'][0]['edicao'] and mesma_atividade(b, a)), None)
        if alvo is None:
            a.setdefault('aliases', [])
            out.append(a)
            continue
        alvo['aliases'].append(alvo['atividade']) if alvo['atividade'] not in alvo['aliases'] else None
        alvo['historico'] += a['historico']
        alvo['atividade'] = a['atividade']
        alvo['frente'] = a['frente'] or alvo['frente']
    for i, a in enumerate(out, start=1):
        a['id'] = a['id'].split('-a')[0] + f'-a{i:03d}'
    return out
import difflib
import json
import re
import sys
import unicodedata
from datetime import date

STATUS_ATV = {'concluido', 'em_andamento', 'em_atraso', 'nao_iniciado'}


def norm(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def status_ponto(s):
    n = norm(s)
    if n.startswith('fechad') or n.startswith('encerrad') or n.startswith('concluid'):
        return 'fechado'
    if 'acompanhamento' in n:
        return 'em_acompanhamento'
    return n.replace(' ', '_') or 'sem_status'


def iso(y, dm):
    m = re.search(r'(\d{1,2})/(\d{1,2})', dm or '')
    if not m:
        return None
    return date(y, int(m.group(2)), int(m.group(1))).isoformat()


def apresentado(item, edicao):
    """Slide oculto dentro de uma edição vigente = backup não apresentado."""
    return edicao['oculto'] or not item['oculto']


def build(raw_comite, key, cadencia):
    eds = sorted(raw_comite['edicoes'], key=lambda e: e['data'])
    edicoes = [{
        'id': e['data'], 'rotulo': e['rotulo'][:5], 'data': e['data'],
        'slides': [e['slides'][0], e['slides'][-1]], 'slide_capa': e['slide_capa'],
        'oculto_no_deck': e['oculto'],
        'slides_ignorados': sorted({x['slide'] for x in e['atividades'] + e['pontos_atencao'] if not apresentado(x, e)}),
    } for e in eds]

    # --- atividades: retrato por reunião (1ª ocorrência) + consolidação ---
    atividades = {}
    for e in eds:
        y = int(e['data'][:4])
        vistos = set()
        for a in e['atividades']:
            if not apresentado(a, e):
                continue
            k = norm(a['atividade'])
            if k in vistos:
                continue
            vistos.add(k)
            st = a['status'] if a['status'] in STATUS_ATV else 'sem_status'
            reg = atividades.setdefault(k, {
                'id': f'{key}-a{len(atividades) + 1:03d}', 'atividade': clean(a['atividade']),
                'frente': clean(a['frente']).title().replace(' Das ', ' das ').replace(' E ', ' e ').replace(' De ', ' de '),
                'historico': [],
            })
            reg['atividade'] = clean(a['atividade'])  # texto mais recente
            if a['frente']:
                reg['frente'] = clean(a['frente']).title().replace(' Das ', ' das ').replace(' E ', ' e ').replace(' De ', ' de ')
            reg['historico'].append({'edicao': e['data'], 'status': st, 'prazo': clean(a['prazo']),
                                     'prazo_iso': iso(y, a['prazo']), 'slide': a['slide'],
                                     'obs': clean(a['observacoes']) if clean(a['observacoes']) not in ('-', '') else ''})

    # --- pontos de atenção ---
    pontos = {}
    for e in eds:
        for p in e['pontos_atencao']:
            if not apresentado(p, e):
                continue
            k = norm(p['descricao'])[:60]
            reg = pontos.setdefault(k, {'id': f'{key}-p{len(pontos) + 1:02d}', 'descricao': clean(p['descricao']),
                                        'historico': []})
            reg['descricao'] = clean(p['descricao'])
            y = int(e['data'][:4])
            reg['historico'].append({'edicao': e['data'], 'status': status_ponto(p['status']),
                                     'status_texto': clean(p['status']), 'responsavel': clean(p['responsavel']),
                                     'prazo': clean(p['prazo']), 'prazo_iso': iso(y, p['prazo']),
                                     'plano_acao': clean(p['plano_acao']), 'slide': p['slide']})

    riscos = []
    legenda_imp = {'92D050': 'dentro_do_plano', 'FFC000': 'risco_moderado', 'FF0000': 'impacto_relevante'}
    for e in eds:
        for r in e['riscos_anexo']:
            fills = [f for grp in r['status_icones'] for f in grp]
            imp = next((legenda_imp[f] for f in fills if f in legenda_imp), 'sem_classificacao')
            riscos.append({'n': r['n'], 'descricao': clean(r['descricao']), 'impacto': imp,
                           'responsavel': clean(r['responsavel']), 'prazo': clean(r['prazo']),
                           'plano_acao': clean(r['plano_acao']), 'slide': r['slide'], 'edicao_base': e['data']})

    return {
        'id': key, 'nome': raw_comite['comite'], 'cadencia': cadencia,
        'arquivo_fonte': raw_comite['arquivo'], 'total_slides': raw_comite['total_slides'],
        'edicoes': edicoes,
        'atividades': unificar(list(atividades.values())),
        'pontos_atencao': list(pontos.values()),
        'riscos_anexo': riscos,
    }


def consolidar(raw, nomes, gerado_em):
    return {
        'projeto': 'Projeto Maestro — Operação Assistida',
        'gerado_em': gerado_em,
        'comites': [
            build(dict(raw['gestor'], arquivo=nomes.get('gestor', raw['gestor']['arquivo'])), 'gestor', 'semanal'),
            build(dict(raw['executivo'], arquivo=nomes.get('executivo', raw['executivo']['arquivo'])), 'executivo', 'quinzenal'),
        ],
    }


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('bruto', help='JSON gerado por extrair_comites.py')
    ap.add_argument('-o', '--saida', required=True)
    ap.add_argument('--gerado-em', default=date.today().isoformat())
    a = ap.parse_args()
    out = consolidar(json.load(open(a.bruto)), {}, a.gerado_em)
    json.dump(out, open(a.saida, 'w'), ensure_ascii=False, indent=1)
    for c in out['comites']:
        print(c['nome'], len(c['edicoes']), 'reuniões |', len(c['atividades']), 'atividades |',
              len(c['pontos_atencao']), 'pontos |', len(c['riscos_anexo']), 'riscos anexo')
