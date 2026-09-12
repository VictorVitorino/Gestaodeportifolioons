# Modelo de Dados — Portfólio FE

## Entidades
- `gerencias`: FEG, FEL, FEN, FER.
- `comunidades`: entrega ou técnica.
- `squads`: vinculadas à comunidade.
- `ferramentas`: inventário real da FE.
- `status_configuracao`: catálogo configurável.
- `iniciativas`: unidade mínima do portfólio.
- `avaliacoes`: critérios capturados separadamente.
- `dependencias`: relações entre iniciativas/comunidades.
- `riscos_impedimentos`.
- `capacidades` e `demandas_capacidade`.
- `financeiro`.
- `foruns`, `decisoes`, `snapshots_forum`.
- `parametros_sistema`.
- `historico`.
- `perfis`, `acoes`, `perfil_acoes`, `usuarios_perfis`.

## Regras de integridade
1. Comunidade deve pertencer à gerência escolhida.
2. Squad deve pertencer à comunidade.
3. Auto-dependência é proibida.
4. Iniciativa com histórico/decisão/snapshot deve ser arquivada, não apagada por fluxo comum.
5. Financeiro sem fonte/período não alimenta indicador oficial.
6. Capacidade não gera taxa derivada sem unidade e método compatíveis.
7. Avaliações devem preservar histórico; score futuro deve registrar versão da regra.

## Convenções
- IDs: UUID.
- Datas técnicas: `timestamptz`.
- Banco: `snake_case`.
- UI/Domain: `camelCase`, com mappers centralizados.
