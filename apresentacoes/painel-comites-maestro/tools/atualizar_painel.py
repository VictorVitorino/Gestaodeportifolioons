"""Regenera o painel a partir dos decks Master dos comitês.

Uso (na raiz do repositório):
    python3 apresentacoes/painel-comites-maestro/tools/atualizar_painel.py \
        --gestor docs/fontes/comites-maestro/AM_Comite_Gestor_Op_Assistida_Master.pptx \
        --executivo docs/fontes/comites-maestro/AM_Comite_Executivo_Op_Assistida_Master.pptx

Passos: extrai (extrair_comites.py) -> consolida (consolidar_dados.py) -> grava
dados/dados-comites.json e injeta o mesmo JSON no bloco <script id="dados-comites"> do index.html.
Requer python3 e lxml.
"""
import argparse
import json
import os
import re
import sys
from datetime import date

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from extrair_comites import extrair  # noqa: E402
from consolidar_dados import consolidar  # noqa: E402

PAINEL = os.path.join(AQUI, '..', 'index.html')
DADOS = os.path.join(AQUI, '..', 'dados', 'dados-comites.json')
BLOCO = re.compile(r'(<script type="application/json" id="dados-comites">)(.*?)(</script>)', re.S)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--gestor', required=True)
    ap.add_argument('--executivo', required=True)
    ap.add_argument('--gerado-em', default=date.today().isoformat())
    a = ap.parse_args()

    bruto = extrair(a.gestor, a.executivo)
    geo = [(k, e['rotulo'], x['slide']) for k, v in bruto.items() for e in v['edicoes']
           for x in e['atividades'] if x['metodo_status'] != 'ordem']
    if geo:
        print('ATENÇÃO: status mapeado por geometria (contagem de ícones ≠ linhas) — conferir nos slides:',
              sorted(set(geo)))
    dados = consolidar(bruto, {'gestor': os.path.basename(a.gestor), 'executivo': os.path.basename(a.executivo)},
                       a.gerado_em)
    os.makedirs(os.path.dirname(DADOS), exist_ok=True)
    with open(DADOS, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=1)
        f.write('\n')

    html = open(PAINEL, encoding='utf-8').read()
    payload = json.dumps(dados, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    novo, n = BLOCO.subn(lambda m: m.group(1) + payload + m.group(3), html)
    if n != 1:
        sys.exit('bloco <script id="dados-comites"> não encontrado no index.html')
    with open(PAINEL, 'w', encoding='utf-8') as f:
        f.write(novo)
    for c in dados['comites']:
        print(f"{c['nome']}: {len(c['edicoes'])} reuniões · {len(c['atividades'])} atividades · "
              f"{len(c['pontos_atencao'])} pontos de atenção · {len(c['riscos_anexo'])} riscos (anexo)")
    print('painel atualizado:', os.path.relpath(PAINEL), '| dados:', os.path.relpath(DADOS))


if __name__ == '__main__':
    main()
