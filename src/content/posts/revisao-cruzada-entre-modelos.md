---
slug: revisao-cruzada-entre-modelos
title: "Revisão cruzada entre modelos: por que um segundo agente acha o que o primeiro não vê"
summary: "Modelos diferentes erram em lugares diferentes. Como pus o Codex para revisar o código que outro modelo escreveu, como junto os achados dos dois e o que ele pegou neste site."
date: "2026-10-11"
markers:
  - code review
  - agentes
draft: true
---

Fechar o servidor MCP deste site num `finally` em volta do `handleRequest` é o jeito óbvio, e está errado. O `handleRequest` resolve assim que a `Response` existe, antes de alguém ler o corpo, então o fechamento derruba o stream no meio e o cliente recebe corpo vazio. Não fechar inverte o problema: um servidor vazado por requisição, numa instância que aceita 80 ao mesmo tempo.

A saída foi pendurar o fechamento no fim do stream, disparando uma vez só em conclusão, cancelamento ou erro (`src/lib/mcp/lifecycle.ts`). No arquivo de estado da feature, essa decisão tem uma nota no fim: achado do Codex, revisando um código que ele não escreveu.

## Um revisor só ancora

Até junho a revisão de código do meu framework era um agente só. Ele recebia o diff e passava, em sequência, por segurança, performance e arquitetura. O problema, que anotei na spec do painel: um agente fazendo tudo numa passada se prende ao primeiro assunto que olha e passa raso pelo resto. E a acessibilidade nem estava na lista do caminho de pull request.

Troquei por um painel. São seis revisores, cada um com um assunto só (lógica de negócio, segurança, testes, tipos, efeitos colaterais e o revisor geral), disparados em paralelo na mesma mensagem e lendo o mesmo arquivo de contexto com o diff e o plano, para ninguém reler a árvore inteira.

**Cada revisor devolve linhas, não prosa:** `severidade | arquivo:linha | problema | correção sugerida`, com severidade entre Critical, High, Medium e Low. Isso é o que torna o resto possível.

## Juntar os achados é código, não opinião

As linhas vão para um agregador em Python (`review_aggregate.py`), que faz duas passadas. Na primeira, tira duplicatas do mesmo revisor. Na segunda, junta achados de revisores diferentes no mesmo `arquivo:linha` num achado só: guarda a severidade mais alta, concatena os textos distintos e anota quem contribuiu. Quando segurança discorda de outro revisor sobre o mesmo ponto, segurança vence.

O campo de contribuintes é o que interessa. Um achado apontado por dois revisores independentes pesa mais do que um apontado por um só, e quando os dois revisores são de modelos diferentes a coincidência fica bem mais difícil de ser acaso.

## O segundo modelo

Em julho entrei com o Codex nesse painel, como revisor independente ao lado dos revisores do Claude, e também no fluxo de implementação, revisando o diff de cada tarefa. Ele roda pela CLI em sandbox somente leitura (`codex exec -s read-only`). Pode ler e rodar comandos de leitura, mas nunca escreve um arquivo. As regras de revisão que os revisores do Claude carregam como skills chegam para ele embutidas no próprio prompt.

O ponto de usar outro modelo é simples: modelos treinados de jeitos diferentes erram em lugares diferentes. O implementador e o revisor do mesmo modelo tendem a concordar sobre o que parece certo, inclusive quando está errado.

## O que ele pegou aqui

O MCP não foi caso isolado. Os arquivos de estado das features deste site registram o autor de cada decisão, e "achado do Codex" aparece várias vezes:

| Feature | Achado |
|---|---|
| Endpoint de contratação | O rate limit confiava no primeiro IP do `x-forwarded-for`. O balanceador do Google acrescenta o cliente real no fim, então quem mandasse o próprio cabeçalho girava identidades à vontade e passava direto pelo limite |
| Endpoint de contratação (High) | O mapa do limiter limpava entradas por validade. Um atacante mandando chaves distintas mantinha todas frescas, nada expirava e o mapa crescia até a instância morrer. Virou teto duro com evicção LRU |
| Endpoint de contratação | O limite de 16 KB no corpo não cobria o cliente lento, que fica abaixo do teto para sempre segurando um slot. A leitura ganhou prazo de 10 segundos |
| Currículo estruturado | Datas validadas por regex aceitavam `2024-99-99`. Trocou para `z.iso.date()` |
| Portão de teclado | O portão aceitava "tem box-shadow" como prova de indicador de foco, o que deixaria passar uma sombra decorativa com o foco removido. Provei depois com essa sabotagem exata |

Nenhum desses é bug de sintaxe. São todos de "o que acontece quando alguém usa isso de um jeito que eu não imaginei", que é justamente o tipo de coisa que o modelo que escreveu o código também não imaginou.

## Quando o segundo modelo some

A revisão cruzada depende de uma assinatura que eu não controlo. O Codex está sem cota até novembro, e a revisão da última feature deste site foi feita pelo Claude sozinho. O fluxo prevê isso: o helper do Codex classifica a falha (sem login, sem cota, rate limit, rede) com um código de saída próprio, e o orquestrador cai para o painel do Claude sem parar a tarefa.

Funciona, mas eu sei o que perdi. É a mesma família de modelo conferindo a si mesma.

Também aprendi o limite do outro lado. Em agosto tirei o Codex do fluxo de commit: dei a ele uma lista com um arquivo só para commitar, e ele fez cinco commits, o pedido mais quatro grupos de mudanças que não tinham nada a ver. Instrução no prompt não restringe agente com permissão de escrita. Para revisar, somente leitura, e aí ele é ótimo.

`// LGTM`
