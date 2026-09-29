# Base de respostas e diagnóstico no Google Planilhas

Tudo o que cada pessoa preenche no Caderno de Nivelamento DTS chega numa planilha do Google, **uma linha por pessoa e
uma coluna por questão**. A própria planilha calcula o **nível diagnosticado** de cada pessoa a partir das respostas.
Leva uns 10 minutos para montar, e só uma vez.

```
Caderno (index.html) ──POST──▶ App da Web (Apps Script) ──▶ Planilha
   fila no navegador              uma gravação por vez          Diagnóstico  → 1 linha por pessoa, 1 coluna por questão
   reenvia se a rede cair         atualiza a mesma linha        Regras       → pesos, travas e faixas (editáveis)
                                  escreve as fórmulas            Resumo       → painel que se atualiza sozinho
```

## 1. Criar a planilha e colar o script

1. Abra [sheets.new](https://sheets.new) e dê um nome, por exemplo **Caderno DTS · Diagnóstico**.
2. Menu **Extensões → Apps Script**.
3. Clique em **Projeto sem título** (topo do editor) e renomeie para **Caderno DTS**.
4. Apague o que estiver no editor, cole todo o conteúdo de [`Codigo.gs`](Codigo.gs) e clique em **Salvar** (ícone de disquete).

## 2. Preparar as abas (uma vez)

1. No topo do editor, escolha a função **configurarPlanilha** e clique em **Executar**.
2. O Google pede autorização: **Revisar permissões** → escolha sua conta → **Avançado** →
   **Acessar Caderno DTS (não seguro)** → **Permitir**. O aviso aparece porque o script é seu e não passou por
   verificação pública; ele só mexe nesta planilha.
3. Volte à planilha: as abas **Diagnóstico**, **Regras** e **Resumo** já estão prontas, com todas as colunas criadas,
   antes de qualquer resposta.

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

- **Rápido:** no editor do Apps Script, execute **testarEnvio**. Aparece a pessoa "Teste do Caderno" na aba Diagnóstico
  com **Nível diagnosticado = Autonomia** (índice 78,35) e **"✓ confere"** na coluna de conferência. Isso prova que as
  fórmulas estão funcionando na sua planilha. Depois execute **apagarLinhasDeTeste**.
- **Completo:** responda o caderno uma vez e acompanhe a linha se preenchendo página a página. Com `#facilitador` no fim
  do endereço do caderno, o painel interno mostra a fila, o último envio confirmado e o último erro.

## Como a aba Diagnóstico se organiza

Linha 1 é uma faixa colorida com as seções; linha 2 tem o nome de cada coluna (passe o mouse no cabeçalho para ver a
pergunta completa). Nome e ID ficam congelados ao rolar para o lado.

| Seção | Colunas |
|---|---|
| **Identificação** | ID da sessão · Nome completo · E-mail · *Para mim, trazer IA para dentro dos projetos de DTS é…* · Status · Páginas concluídas (de 7) · Iniciado em · Concluído em · Duração (min) |
| **Diagnóstico** (fórmulas) | **Nível diagnosticado** · Índice consolidado · Próximo passo · Nível declarado · Índice declarado · Nível demonstrado · Índice demonstrado · Declarado − demonstrado · Leitura do alinhamento |
| **P01 · Meu ponto de partida** | uma coluna por pergunta (P01.1 Claude Desktop … P01.6 Compartilhamento), no formato `2 · texto escolhido` · índice bruto · trava de coerência |
| **P02 · O que chama sua atenção?** | 1ª, 2ª e 3ª pista (na ordem investigada) · leitura |
| **P03 · Quem está mais perto?** | 1ª e 2ª peça ligadas ao Prompt · leitura |
| **P04 · Por onde você iria?** | caminho escolhido · perfil · leitura |
| **P05 · A Skill que ninguém merece** | 1º, 2º e 3º elemento · leitura |
| **P06 · Salve este Prompt** | 1ª, 2ª e 3ª peça · leitura |
| **P07 · Retrato Falado DTS** | pessoa retratada · rascunho nº 1 · estrutura nº 1 · rascunho nº 2 · estrutura nº 2 · evolução · leitura |
| **Dimensões** | 8 dimensões, declarado × demonstrado |
| **Conferência e registro** | Índice consolidado (caderno) · **Confere com o caderno?** · Versão · Estado completo (JSON) · Recebido em |

A linha se preenche **enquanto a pessoa responde**: o nível declarado aparece assim que ela termina a página 01; o
diagnosticado, quando termina a página 07. Os níveis ganham cores na mesma escala da régua do caderno.

## Como o nível é calculado (aba Regras)

Tudo na aba **Regras**, com os valores editáveis em laranja:

1. **Índice declarado (página 01):** soma de (resposta ÷ 3 × peso). Pesos: Claude Desktop 10, FLOWS 20, Skills 20,
   Métodos 20, Reutilização 15, Compartilhamento 15. Travas de coerência: sem FLOWS ≥ 2 e (Skills ≥ 2 ou Métodos ≥ 2),
   para em 60; sem FLOWS, Skills, Métodos e Compartilhamento ≥ 2 (e um deles = 3), para em 80.
2. **Índice demonstrado (páginas 02 a 07):** média ponderada das leituras de cada página (15 · 20 · 20 · 15 · 15 · 15).
   Cada leitura (0–100) vem do caderno, que conhece o mapa de conceitos e analisa o texto do rascunho.
3. **Índice consolidado:** 30% declarado + 70% demonstrado.
4. **Nível:** o índice arredondado cai numa faixa: Ponto de partida (0–20) · Exploração (21–40) · Evolução (41–60) ·
   Autonomia (61–80) · Multiplicação (81–100). Cada faixa traz o próximo passo.
5. **Alinhamento:** declarado − demonstrado. Até 10 pontos é "Alinhado"; acima, "Declarou acima do que demonstrou";
   abaixo, "Demonstrou mais do que declarou".

**Quer recalibrar?** Mude um peso, uma trava ou o início de uma faixa na aba Regras: todos os níveis se recalculam na
hora, inclusive de quem já respondeu. A coluna "Confere com o caderno?" passa a mostrar "≠ revisar", o que é esperado
depois de uma recalibração. Para voltar ao original, execute **restaurarRegras**. Se alguém apagar uma fórmula sem querer,
execute **recalcularTudo**.

## Resumo

Pessoas identificadas, concluídas e em andamento · pessoas por **nível diagnosticado** (com % de quem concluiu) ·
médias dos índices · quantas pessoas estão alinhadas, declararam acima ou demonstraram mais.

**Nunca duplica:** a mesma pessoa (ID da sessão) sempre atualiza a mesma linha; se ela voltar e mudar uma resposta, a
linha é corrigida. "Recomeçar diagnóstico" cria uma sessão nova (linha nova); a antiga fica registrada.

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
| Nível aparece como `#NAME?` ou `#REF!` | a aba Regras foi apagada ou renomeada | execute **restaurarRegras** e depois **recalcularTudo** |

## Privacidade

- A planilha fica no seu Google Drive. Compartilhe só com quem facilita o nivelamento.
- O link `/exec` só **grava** linhas; ninguém consegue **ler** a planilha por ele.
- Textos que começam com `=`, `+`, `-` ou `@` entram como texto (não viram fórmula). As colunas de diagnóstico são
  sempre fórmulas da planilha: o caderno não consegue escrever nelas.
- O nível diagnosticado, o índice consolidado e o alinhamento são internos: aparecem na planilha e no painel
  `#facilitador`, nunca para o participante.
