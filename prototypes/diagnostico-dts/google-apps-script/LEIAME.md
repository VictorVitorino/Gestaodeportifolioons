# Base de respostas no Google Planilhas

Tudo o que cada pessoa preenche no Caderno de Nivelamento DTS chega numa planilha do Google:
a etiqueta (nome completo, e-mail e a frase sobre IA), cada página concluída e o resultado final.
Leva uns 10 minutos para montar, e só uma vez.

```
Caderno (index.html) ──POST──▶ App da Web (Apps Script) ──▶ Planilha
   fila no navegador              uma gravação por vez          Participantes · Etapas · Resultados · Resumo
   reenvia se a rede cair         atualiza a mesma linha
```

## 1. Criar a planilha e colar o script

1. Abra [sheets.new](https://sheets.new) e dê um nome, por exemplo **Caderno DTS · Respostas**.
2. Menu **Extensões → Apps Script**.
3. Clique em **Projeto sem título** (topo do editor) e renomeie para **Caderno DTS**.
4. Apague o que estiver no editor, cole todo o conteúdo de [`Codigo.gs`](Codigo.gs) e clique em **Salvar** (ícone de disquete).

## 2. Preparar as abas (uma vez)

1. No topo do editor, escolha a função **configurarPlanilha** e clique em **Executar**.
2. O Google pede autorização: **Revisar permissões** → escolha sua conta → **Avançado** →
   **Acessar Caderno DTS (não seguro)** → **Permitir**. O aviso aparece porque o script é seu e não passou por
   verificação pública; ele só mexe nesta planilha.
3. Volte à planilha: as abas **Participantes**, **Etapas**, **Resultados** e **Resumo** foram criadas.

## 3. Publicar o link

1. No editor: **Implantar → Nova implantação**.
2. Na engrenagem de "Selecionar tipo", escolha **App da Web**.
3. Preencha:
   - **Executar como:** Eu (seu e-mail)
   - **Quem pode acessar:** **Qualquer pessoa**, obrigatório: quem responde o caderno não faz login no Google
4. **Implantar** e copie o **URL do App da Web**. Ele termina em **`/exec`** (não use o que termina em `/dev`).
5. Teste: cole o link no navegador. Deve aparecer `{"sucesso":true,"mensagem":"Caderno de Nivelamento DTS · base de respostas ativa."…}`.

## 4. Ligar o caderno à planilha

Abra o `index.html` num editor de texto (Bloco de Notas, VS Code). Logo no começo do arquivo, procure:

```html
<script id="dts-config">
  window.DTS_CONFIG = {
    sheetsEndpoint: ''
  };
</script>
```

Cole o link entre as aspas e salve:

```js
    sheetsEndpoint: 'https://script.google.com/macros/s/SEU_ID/exec'
```

Pronto. Distribua esse `index.html`. Sem link, o caderno funciona igual e guarda tudo só no navegador de quem responde.

## 5. Conferir de ponta a ponta

- Rápido: no editor do Apps Script, execute **testarEnvio**. Aparece uma linha "Teste do Caderno" em Participantes e
  Etapas. Depois execute **apagarLinhasDeTeste**.
- Completo: responda o caderno uma vez e acompanhe as linhas chegando. Com `#facilitador` no fim do endereço do caderno,
  o painel interno mostra a fila, o último envio confirmado e o último erro.

## O que chega em cada aba

| Aba | Uma linha por | Quando chega | Principais colunas |
|---|---|---|---|
| **Participantes** | pessoa | ao preencher a etiqueta e a cada página concluída | ID da sessão · Nome completo · E-mail · *Para mim, trazer IA para dentro dos projetos de DTS é…* · Status · Páginas concluídas (de 7) · Página mais avançada · Identificado em · Concluído em |
| **Etapas** | pessoa **e** página (P01 a P07) | ao sair de cada página concluída | Página · Experiência · Respostas (texto legível, na ordem escolhida) · Leitura interna (0–100) · Detalhe (JSON) |
| **Resultados** | pessoa | ao chegar ao encerramento (e de novo se a pessoa mudar algo depois) | respostas da P01 (0–3) · declarado bruto/final/trava/faixa · escolhas e leituras de P02 a P07 · rascunhos nº 1 e nº 2 · índices demonstrado, consolidado (30/70), gap e alinhamento · 8 dimensões (declarado × demonstrado) · Estado completo (JSON) |
| **Resumo** | — | fórmulas, atualiza sozinho | pessoas identificadas, concluídas e em andamento · médias dos índices · quantas pessoas em cada faixa declarada |

Todas as abas ganham **Recebido em** (hora do servidor). Colunas novas aparecem sozinhas se o caderno evoluir.

**Nunca duplica:** a mesma pessoa (ID da sessão) e a mesma página sempre atualizam a mesma linha. Se a pessoa voltar e mudar
uma resposta, a linha é corrigida. "Recomeçar diagnóstico" cria uma sessão nova (linha nova); a antiga fica registrada.

**Nada se perde:** se a internet cair, as respostas ficam numa fila no navegador e seguem sozinhas quando a conexão volta,
quando o caderno é reaberto ou pelo botão "Tentar agora" no encerramento.

## Se alterar o script depois

**Implantar → Gerenciar implantações** → lápis → em **Versão**, escolha **Nova versão** → **Implantar**.
O link `/exec` continua o mesmo; sem "Nova versão", a alteração não vale para o link publicado.

## Quando algo não chega

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Painel mostra "Resposta inesperada" | acesso diferente de "Qualquer pessoa" ou link `/dev` | reimplante com **Qualquer pessoa** e use o link `/exec` |
| Mudou o script e nada mudou | faltou publicar nova versão | veja "Se alterar o script depois" |
| "Envios sem confirmação" acima de zero | a rede da empresa escondeu a resposta do Google | confira se as linhas estão na planilha; se não, teste em outra rede |
| Nada chega e o painel diz "sem link" | `sheetsEndpoint` vazio ou sem `https://` | cole o link completo entre as aspas |
| A opção "Qualquer pessoa" não aparece | a conta corporativa bloqueia apps públicos | crie a planilha numa conta que permita, ou peça liberação ao administrador do Google Workspace |

## Privacidade

- A planilha fica no seu Google Drive. Compartilhe só com quem facilita o nivelamento.
- O link `/exec` só **grava** linhas; ninguém consegue **ler** a planilha por ele.
- Textos que começam com `=`, `+`, `-` ou `@` entram como texto (não viram fórmula).
- O índice consolidado e o alinhamento são internos: aparecem na planilha e no painel `#facilitador`, nunca para o participante.
