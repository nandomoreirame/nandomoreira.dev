---
slug: revisao-cruzada-entre-modelos
title: "Revisão cruzada entre modelos: por que um segundo agente acha o que o primeiro não vê"
summary: "Modelos diferentes erram em lugares diferentes. Como pus um segundo modelo para revisar o código que o primeiro escreveu, como junto os achados dos dois, o que o Codex pegou neste site e por que hoje quem revisa é o agy."
date: "2026-10-18"
publishedAt: "2026-10-18T18:55:59-03:00"
markers:
  - code review
  - agentes
  - qualidade
art: mosaic
extras:
  - "6 revisores, 2 modelos, 1 agregador"
  - "Claude Code · agy · Codex"
keyPoints:
  - "Um revisor só se prende ao primeiro assunto; seis revisores com um assunto cada passam pelo diff em paralelo."
  - "Um achado apontado por dois modelos diferentes pesa mais: a coincidência fica bem mais difícil de ser acaso."
  - "O sandbox do agy não impede escrita, então ele revisa uma cópia descartável do repositório e nunca o de verdade."
snapshot:
  items:
    - label: "Principal"
      value: "Claude Code"
    - label: "Revisor externo"
      value: "agy"
    - label: "Antes"
      value: "Codex"
    - label: "Agregador"
      value: "review_aggregate.py"
    - label: "Tempo limite"
      value: "540 segundos"
---

Fechar o servidor [MCP](https://modelcontextprotocol.io) deste site num `finally` em volta do `handleRequest` é o jeito óbvio, e está errado. O `handleRequest` resolve assim que a `Response` existe, antes de alguém ler o corpo, então o fechamento derruba o stream no meio e o cliente recebe corpo vazio. Não fechar inverte o problema: um servidor vazado por requisição, numa instância que aceita 80 ao mesmo tempo.

A saída foi pendurar o fechamento no fim do stream, disparando uma vez só em conclusão, cancelamento ou erro (`src/lib/mcp/lifecycle.ts`). No arquivo de estado da feature, essa decisão tem uma nota no fim: achado do Codex, revisando um código que ele não escreveu. Se você deixa o mesmo modelo escrever e revisar, ele concorda consigo mesmo até no erro, e é por isso que o meu revisor principal vem de outra família de modelo.

## Um revisor só ancora

Até junho a revisão de código do meu framework era um agente só. Ele recebia o diff e passava, em sequência, por segurança, performance e arquitetura. O problema, que anotei na spec do painel: um agente fazendo tudo numa passada se prende ao primeiro assunto que olha e passa raso pelo resto. E a acessibilidade nem estava na lista do caminho de pull request.

Troquei por um painel. São seis revisores, cada um com um assunto só (lógica de negócio, segurança, testes, tipos, efeitos colaterais e o revisor geral), disparados em paralelo na mesma mensagem e lendo o mesmo arquivo de contexto com o diff e o plano, pra ninguém reler a árvore inteira.

**Cada revisor devolve linhas, não prosa:** `severidade | arquivo:linha | problema | correção sugerida`, com severidade entre Critical, High, Medium e Low. Isso é o que torna o resto possível.

## Juntar os achados é código, não opinião

As linhas vão pra um agregador em Python (`review_aggregate.py`), que faz duas passadas. Na primeira, tira duplicatas do mesmo revisor. Na segunda, junta achados de revisores diferentes no mesmo `arquivo:linha` num achado só: guarda a severidade mais alta, concatena os textos distintos e anota quem contribuiu. Quando segurança discorda de outro revisor sobre o mesmo ponto, segurança vence.

O campo de contribuintes é o que interessa. Um achado apontado por dois revisores independentes pesa mais do que um apontado por um só, e quando os dois revisores são de modelos diferentes a coincidência fica bem mais difícil de ser acaso.

## O segundo modelo

Em julho entrei com o Codex nesse painel, como revisor independente ao lado dos revisores do Claude, e também no fluxo de implementação, revisando o diff de cada tarefa. Ele rodava pela CLI em sandbox somente leitura (`codex exec -s read-only`): podia ler e rodar comandos de leitura, mas nunca escrevia um arquivo. As regras de revisão que os revisores do Claude carregam como skills chegavam pra ele embutidas no próprio prompt.

O ponto de usar outro modelo é simples: modelos treinados de jeitos diferentes erram em lugares diferentes. O implementador e o revisor do mesmo modelo tendem a concordar sobre o que parece certo, inclusive quando está errado.

## O que ele pegou aqui

O MCP não foi caso isolado. Os arquivos de estado das features deste site registram o autor de cada decisão, e "achado do Codex" aparece várias vezes:

| Feature | Achado |
|---|---|
| Endpoint de contratação | O rate limit confiava no primeiro IP do `x-forwarded-for`. O balanceador do Google acrescenta o cliente real no fim, então quem mandasse o próprio cabeçalho girava identidades à vontade e passava direto pelo limite |
| Endpoint de contratação (High) | O mapa do limiter limpava entradas por validade. Um atacante mandando chaves distintas mantinha todas frescas, nada expirava e o mapa crescia até a instância morrer. Virou teto duro com evicção LRU |
| Endpoint de contratação | O limite de 16 KB no corpo não cobria o cliente lento, que fica abaixo do teto pra sempre segurando um slot. A leitura ganhou prazo de 10 segundos |
| Currículo estruturado | Datas validadas por regex aceitavam `2024-99-99`. Trocou pra `z.iso.date()` |
| Portão de teclado | O portão aceitava "tem box-shadow" como prova de indicador de foco, o que deixaria passar uma sombra decorativa com o foco removido. Provei depois com essa sabotagem exata |

Nenhum desses é bug de sintaxe. São todos de "o que acontece quando alguém usa isso de um jeito que eu não imaginei", que é justamente o tipo de coisa que o modelo que escreveu o código também não imaginou.

## Quando o segundo modelo some

A revisão cruzada depende de uma assinatura que eu não controlo. O Codex ficou sem cota até novembro, e por um tempo as revisões deste site foram feitas pelo Claude sozinho. O fluxo prevê isso: o helper classifica a falha (sem login, sem cota, rate limit, rede, tempo esgotado) com um código de saída próprio, e o orquestrador cai pro painel do Claude sem parar a tarefa.

Funciona, mas eu sei o que perdi. É a mesma família de modelo conferindo a si mesma.

Aprendi também o limite do outro lado. Em agosto tirei o Codex do fluxo de commit: dei a ele uma lista com um arquivo só pra commitar, e ele fez cinco commits, o pedido mais quatro grupos de mudanças que não tinham nada a ver. Instrução no prompt não restringe agente com permissão de escrita. Pra revisar, somente leitura, e aí ele era ótimo.

## O agy no lugar do Codex

Em 18 de outubro troquei o Codex pelo `agy`, a [CLI do Antigravity](https://antigravity.google/product/antigravity-cli), que roda um modelo Gemini. Não foi a cota: o Codex estava alucinando demais nas revisões, e um revisor que inventa achado custa mais tempo do que economiza. O agy entrou porque já vem no meu plano Google AI Pro, e ainda estou testando e avaliando.

O agy não lê as minhas regras do Claude, então as skills de revisão chegam pra ele do mesmo jeito que chegavam pro Codex: embutidas no prompt. A diferença que mais deu trabalho foi outra. **O modo `--sandbox` do agy não impede escrita**: numa rodada de teste, ele criou um arquivo no workspace. Depois da lição do Codex com os commits, isso bastou pra eu não deixar ele perto do repositório de verdade. O helper clona o repositório numa cópia descartável (o mesmo `HEAD`, mais o diff que ainda não foi commitado), roda o agy lá dentro e apaga a cópia no fim. Ele também desliga as skills do agy (`--disable-slash-commands`), pra ele não achar a skill de revisão e chamar um revisor dentro do revisor.

As primeiras rodadas neste site foram um lembrete de que o segundo modelo ainda some. Nas duas revisões da nova página de post, ele estourou o tempo de 540 segundos e o fluxo seguiu só com o Claude. Na terceira, com um diff menor, respondeu em poucos minutos e sem achados.

## O principal fica, os secundários giram

O meu agente principal é o Claude Code. Os outros são rotativos: o Codex entrou em julho e saiu em outubro, o agy entrou agora, e vou trocar sempre que for necessário. A troca sai barata porque o revisor externo fica atrás de um helper com código de saída próprio e de um contrato de linhas (`severidade | arquivo:linha | problema | correção sugerida`): trocar o modelo é trocar um script, e o agregador nem percebe.

`// LGTM`
