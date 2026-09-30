# DTS · Todos Sabem, Todos Usam, Somos Exemplo — 2:00 · GMO TECH

Esta é a mesma versão de **2 min 00 s** que o time recebeu (*DTS - AI Flows - Cinematic 3D Animation*): o corte
de 2:00 da v7 (`bb65650`), nas cores originais. A única mudança é o texto das skills de GMO,
que agora usa a sigla **GMO TECH**, como no FLOWS (gravações de tela `Video_GMO_TECH` e `Video_GMO_TECH - CARD`).

| Entrega | Arquivo |
|---|---|
| Filme 2:00 · GMO TECH (1920×1080, 24 fps, qualidade máxima, ~90 MB) | `video/DTS_2min_GMO_TECH.mp4` |
| Mesmo filme em 1920×1080 para envio (~29 MB) | `video/DTS_2min_GMO_TECH_1080p_envio.mp4` |
| Mesmo filme em 1280×720 (formato do arquivo enviado) | `video/DTS_2min_GMO_TECH_720p.mp4` |
| Antes/depois de cada trecho alterado | `video/antes_depois.jpg` |

## O que mudou (e só isso)

| Tempo | Onde | Antes | Agora |
|---|---|---|---|
| 0:26–0:31 | Tour · print da Biblioteca de Skills | `[DTS] - Experience Builder \| Gamificação, Team Building, Escape Room - GMO (Gestão da Mudança)` e mais 3 cards com `- GMO (Gestão da Mudança)` | `[DTS] - GMO TECH - Experience Builder \| Gamificação, Team Building, Escape Room`, `[DTS] - GMO TECH - Culture & Stakeholder Diagnostic Builder`, `[DTS] - GMO TECH - Mapa de Impactos`, `[DTS] - GMO TECH - Plano de Comunicação Estrutura Completa` |
| 0:36–0:40 | Cards 3D em destaque | idem | idem |
| 0:49–0:51 | Nome digitado no formulário | `[DTS] - Change Management - Mapa de Impactos` | `[DTS] - GMO TECH - Mapa de Impactos` (digitado na mesma janela de tempo) |
| 0:52–0:56 | Anatomia do nome | Service Line = *Change Management* | Service Line = **GMO TECH** |
| 0:53–0:56 | Rótulos da anatomia | com *GMO TECH* (nome curto), *2 · Service Line* ficava por cima de *1 · Prefixo da Área* | *Service Line* desliza para a direita só o necessário; o conector continua em *GMO TECH* |
| 0:56–1:02 | Formulário (nome no topo) | `[DTS] - Change Management - Mapa de Impactos` | `[DTS] - GMO TECH - Mapa de Impactos` |
| 1:10–1:16 | Detalhes · Título | idem | idem |
| 1:11–1:15 | Legenda do passo 6 | *Em Detalhes, classifique como Template.* | *Em Detalhes, escolha a classificação.* (mesmo tempo e mesmo sublinhado) |
| 1:29–1:36 | Card NOVA publicado e 442 | idem | idem |
| ao fundo | Cards pequenos da parede da Biblioteca (1:41–1:44, quase imperceptível) | títulos GMO antigos | títulos GMO TECH (coerentes com os cards em destaque) |

**Conferência quadro a quadro com o vídeo enviado** (`tools/fullcheck.py`, os 2.880 quadros): a imagem só muda em
0:26,5–0:31,3 · 0:36,3–0:40,2 · 0:49,3–1:02,1 · 1:11,3–1:16,9 · 1:30,0–1:35,7 (e em 27 px de um card pequeno da
parede em 1:44,1). Em todo o resto (abertura, pilares, contador 441, rótulo do 442, ranking e cartela), a
diferença é só ruído de compressão (média de 1–2 níveis de cor). O antes/depois de cada trecho está em
`video/antes_depois.jpg`.

Nada mais foi tocado: roteiro, câmera, legendas, trilha e tempos são os mesmos, quadro a quadro.
- **Mesma minutagem:** o filme tem os mesmos 2.880 quadros. Cada quadro mostra o mesmo instante da v7 que mostrava
  antes (mapa quadro a quadro reconstruído por `tools/mkmap.py`, resíduo médio 0,22 em miniaturas).
- **Mesmo áudio:** a trilha foi copiada bit a bit do arquivo enviado (sem recodificar).
- **Mesmo render:** a abertura do Fabio (0:00–0:09,5) é o próprio vídeo original. Todo o trecho 3D foi
  re-renderizado pelo pipeline da v7 (`49161cd`), agora com os textos novos. O contador 442 mantém o rótulo
  do vídeo enviado (*+1 skill de DTS na Biblioteca*). O pipeline
  reproduz a v7 original: diferença média de 0,05 nível de cor após a mesma codificação (ruído de compressão).
- **Descrições das skills:** mantidas como no FLOWS. Por exemplo, *Change Impact Assessment* segue igual na
  gravação `Video_GMO_TECH - CARD`.

## Como foi feito

1. **Textos (fonte v7):** `patch/gmo_tech.diff` troca os títulos dos 4 cards GMO (`src/ui.js`), o nome da skill
   (`bake.mjs` e `bake.htm`: digitação, anatomia, Detalhes e card NOVA) e o tamanho do nome digitado
   (`src/timeline.js`: 44 → 35 caracteres, na mesma janela de tempo).
2. **Print da Biblioteca (tour):** `tools/edit_screen.py` apaga os títulos antigos e redesenha os novos em Inter 600.
   Tamanho, espaçamento e posição foram ajustados card a card a partir dos títulos originais (`tools/fit_lines.py`,
   correlação 0,83–0,94). O card *Mapa de Impactos* agora tem título de 1 linha, e o conteúdo sobe uma linha, como
   no FLOWS. Resultado: `tex/screen_biblioteca.webp`. O anel laranja da nota desse card (0:28) subiu junto, os mesmos
   22 px (`src/pace.js`, `tour.rings`), e envolve o **98** como nos outros cards.
3. **Render:** `node bake.mjs`, depois `node render.mjs list 24 <w> 4 rend list.json` (modo novo: só os quadros
   da v7 que o corte de 2:00 usa, 2.652).
4. **Montagem:** `tools/encode_v12.py` lê a v7 e os quadros novos na ordem do mapa. Codificação em 2 passes, com o
   áudio copiado do vídeo enviado.
