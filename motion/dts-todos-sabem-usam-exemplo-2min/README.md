# DTS · Todos Sabem, Todos Usam, Somos Exemplo — versão 2:00

Corte de **2 min 00 s** (1920×1080, 24 fps, H.264 + AAC) da **v7** (a versão que abre com a **entrada do Fabio**,
commit `49161cd`, 2:54). Mesmo conteúdo, mesma ordem, mesmos quadros renderizados. Nada foi redesenhado.

| Entrega | Arquivo |
|---|---|
| Filme 2:00 | `video/DTS_Todos_Sabem_Usam_Exemplo_3D_2min.mp4` |
| Folha de contato | `video/storyboard_2min.png` |

## Como foi encurtado (sem estragar)

- **Entrada do Fabio (0:00–0:09,5): intocada**, quadro a quadro e com o som original.
- **Retime por movimento:** cada quadro da v7 recebeu uma velocidade conforme o quanto a imagem se move.
  Trechos parados (holds dos pilares, pausas, cartela) encurtam mais. Câmera, cursor e digitação encurtam menos.
  As rampas são suavizadas, sem trancos.
- **Piso de leitura:** toda legenda e todo lockup de pilar fica no ar ≥ 0,45 s + caracteres/17 (padrão de legendagem).
- **Insertos** (tour do FLOWS, anatomia do nome, Detalhes) em ritmo uniforme: 14,2→10,4 s, 6,8→4,8 s, 20,2→18,1 s.
- **Trilha regenerada, não cortada:** a nova curva de ritmo (`retime/pace_2min.js`, 539 chaves) alimenta o
  `audio/soundtrack.py` original da v7. Música, crescendos dos pilares e efeitos caem no quadro certo.

| Trecho | v7 | 2:00 |
|---|---|---|
| Entrada do Fabio | 0:00 (9,5 s) | 0:00 (9,5 s) |
| Todos Sabem + Início | 0:09,5 (16,8 s) | 0:09,5 (10,2 s) |
| Tour do FLOWS | 0:26,3 (14,2 s) | 0:19,7 (10,4 s) |
| 441 skills | 0:40,5 (13,6 s) | 0:30,1 (10,1 s) |
| Pilar Todos Usam + passos 1–2 | 0:54,1 (19,4 s) | 0:40,2 (11,1 s) |
| Anatomia do nome | 1:13,5 (6,8 s) | 0:51,3 (4,8 s) |
| Passos 3–5 | 1:20,3 (25,2 s) | 0:56,1 (15,2 s) |
| Detalhes | 1:45,5 (20,2 s) | 1:11,3 (18,1 s) |
| Card → 442 | 2:05,7 (9,7 s) | 1:29,4 (6,0 s) |
| Pilar Somos Exemplo | 2:15,4 (9,9 s) | 1:35,4 (6,5 s) |
| Ranking de Áreas | 2:25,3 (20,3 s) | 1:41,9 (14,2 s) |
| Cartela final | 2:45,6 (8,2 s) | 1:56,0 (4,0 s) |

## Reproduzir

Na fonte da v7 (`git worktree add <dir> 49161cd`):
1. `python3 retime/plan.py` → mapa de quadros (`map.npy`) e nova curva (`newpace.json`)
2. troque o `PACE` e o `INTRO.out` de `src/pace.js` (resultado em `retime/pace_2min.js`) e rode `python3 audio/soundtrack.py soundtrack_2min.wav`
3. `python3 retime/encode.py` → lê os quadros da v7 em ordem e grava o filme de 2:00 com a trilha nova
