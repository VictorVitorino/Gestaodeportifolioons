# Cineverse

Jogo em HTML de arquivo único (`index.html`), sem dependências. Abra direto no navegador ou, com o servidor do projeto, acesse `/cineverse/index.html` (`npm run dev`).

## Fluxo

| Etapa | O que acontece |
| --- | --- |
| **Tela 1 · Escolha** | Quatro cards holográficos. "Ver Sinopse" centraliza o card e prepara a sinopse. |
| **Transição** | Quando a sinopse fica pronta (evento `cineverse:select`), o card avança em direção à câmera e o mundo do filme aparece. |
| **Tela 2 · Sinopse** | Contexto do filme com a identidade visual dele: título, sinopse, três fichas (mundo, heróis, ameaça) e a missão. |
| **Voltar** | Retorna à seleção. Os cards voltam aos seus lugares e o foco fica no card de origem. |
| **Avançar** | Toca o momento de confirmação do filme e segue para a próxima fase. |

## Os quatro universos

| Universo | Direção visual | Detalhes de identidade |
| --- | --- | --- |
| O Senhor dos Anéis | Ouro derretido, Montanha da Perdição | Brasas subindo, o Anel pulsando na arte, inscrição em Língua Negra girando. |
| Os Vingadores | Nova York em ruínas, energia do Tesseract | Portal e feixe azul, relâmpagos, cinzas, painel HUD da S.H.I.E.L.D. com a equipe. |
| Missão: Impossível | Dossiê da IMF, câmera de segurança do cofre | Sinopse datilografada, relógio ao vivo, carimbo "Desautorizado", pavio aceso até o Avançar. |
| Mix de Filmes | Cabine de projeção holográfica | Card holográfico que reage ao mouse, película com todos os universos, contagem regressiva de filme. |

## Atalhos

- `←` / `→`: navegam entre os cards na Tela 1. Na Tela 2, fazem Voltar e Avançar.
- `Enter`: abre o card em foco.
- `Esc`: volta uma etapa.

## Onde editar

- **Textos da Tela 2**: bloco `TELA 2 · UNIVERSOS` no HTML, com um `<section class="world world--{id}">` por filme.
- **Textos do momento de Avançar**: objeto `MOMENTS` no script da Tela 2.
- **Estilos**: bloco CSS `TELA 2 · UNIVERSOS`. Cada filme tem os próprios tokens (`--w-accent`, `--w-bg`…) em `.world--{id}`.

## Conectar a Tela 3

Sem uma próxima fase configurada, o Avançar mostra "Próxima fase · Em breve", com as opções de rever a sinopse ou escolher outro universo. Há duas formas de conectar a próxima fase:

```html
<!-- 1) Uma URL por universo, declarada antes do script da Tela 2 -->
<script>window.CINEVERSE_NEXT = { lotr: 'fase3-lotr.html', mi: 'fase3-mi.html' };</script>
```

```js
// 2) Assumir a navegação pelo evento (cancelável)
addEventListener('cineverse:advance', e => {
  e.preventDefault();        // impede a tela "Em breve"
  abrirFase3(e.detail.id);   // detail = { id, title }
});
```

## Notas técnicas

- As imagens dos cenários foram recortadas para remover ícones de interface capturados junto, ampliadas com nitidez e embutidas como WebP. O fundo difuso já sai desfocado do arquivo, então o navegador não calcula desfoque em tempo real.
- O Mix reaproveita as artes já embutidas nos cards, sem bytes extras.
- Com a Tela 2 aberta, a Tela 1 para de ser desenhada. Com a Tela 2 fechada, ela não consome nada.
- A preferência de movimento reduzido do sistema é respeitada: sem partículas, sem parallax e sem digitação.
- Correções na Tela 1:
  - a fonte "Share Tech Mono" tinha sido traduzida para "Share Tecnologia Mono" e não carregava;
  - os rótulos que ainda estavam em inglês foram traduzidos;
  - `lang="pt-BR"`.
