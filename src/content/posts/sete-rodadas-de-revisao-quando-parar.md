---
slug: sete-rodadas-de-revisao-quando-parar
title: "Sete rodadas de revisão: quando parar"
summary: "Num dia, uma revisão foi de nove achados a zero em sete rodadas. No outro, outra passou seis rodadas oscilando entre dois e quatro. O número de rodadas não diz quando parar; a forma da contagem e o lugar onde o achado cai dizem."
date: "2026-10-28"
markers:
  - code review
  - agentes
  - qualidade
extras:
  - "9, 3, 1, 1, 2, 1, 0 achados em sete rodadas"
  - "Codex · Claude Code · Grok"
keyPoints:
  - "A rodada com um achado baixo só não era a última: a seguinte achou uma corrida que deixava servidor e tela discordando."
  - "Quando o achado sai do código e cai no teste que prova a correção, falta uma rodada, com o escopo fechado."
  - "A minha regra de parada pegava correção repetida na mesma linha. Contagem que não cai é outro problema, e só o teto segurou."
snapshot:
  items:
    - label: "Implementadores"
      value: "Codex · Grok"
    - label: "Revisores"
      value: "Claude Code · Codex"
    - label: "Trilha"
      value: "<slug>.rounds.jsonl"
    - label: "Parada"
      value: "3 correções na mesma linha"
    - label: "Teto"
      value: "6 rodadas"
art: usage
draft: true
---

O prompt que o Codex escreveu pra terceira rodada já chamava a revisão de final. O Claude devolveu um achado baixo só: depois de uma recusa, redigitar o valor que já estava salvo deixava o campo marcado como inválido. Na quarta rodada ele achou uma corrida em que o servidor ficava com um valor, a tela mostrava outro e o status dizia "Salvo". Depois disso a revisão ainda andou mais três rodadas até o `NONE`.

Quantas rodadas são suficientes é a pergunta errada. Se você põe um agente pra implementar e outro pra revisar em laço, alguém decide quando o laço acaba, e "quando o revisor disser que não achou nada" parece a resposta certa. Já escrevi sobre [por que um segundo modelo acha o que o primeiro não vê](/revisao-cruzada-entre-modelos); este texto é sobre o passo seguinte, quando o segundo modelo já está no laço. **A contagem de rodadas não diz quando parar. O que diz é a forma da curva e onde o achado cai.**

## Sete rodadas em doze minutos

Dia 27 de outubro, no contrateum.dev (um projeto meu que liga vaga a dev). O Codex implementou duas features juntas: o vínculo da conta com a empresa e a área de configurações da empresa (salvamento campo a campo, exclusão de conta). O agy, que hoje é o meu revisor externo, estava indisponível, e o Codex não revisa o próprio código, então quem revisou foi o Claude. Sem ferramenta nenhuma. Ele recebia as specs e o código dentro do prompt e devolvia linhas `severidade | arquivo:linha | problema | correção`, ou exatamente `NONE`.

| Rodada | Achados | Onde caíram | Duração | Tokens de saída |
|---|---|---|---|---|
| 1 | 9 (4 médios, 5 baixos) | banco, sessão, docs, tela | 84 s | 15,9 mil |
| 2 | 3 (2 médios, 1 baixo) | docs e um `aria-describedby` | 60 s | 11,3 mil |
| 3 | 1 baixo | `onBlur` do campo | 61 s | 10,3 mil |
| 4 | 1 médio | `onBlur` do campo | 28 s | 5,1 mil |
| 5 | 2 baixos | teste | 42 s | 7,7 mil |
| 6 | 1 baixo | teste | 20 s | 3,5 mil |
| 7 | 0 | | 5 s | 300 |

Do começo da primeira ao fim da sétima foram doze minutos, contando as correções do Codex entre uma e outra. Uma oitava rodada, no dia seguinte, também voltou zerada.

A primeira rodada foi a única que viu tudo, e não foi tudo certeiro: na segunda, o próprio prompt contestou quatro achados (docs que já estavam lá, fallback de fixture no preview, trigger no banco, cascata de exclusão) com o argumento de que contrariavam a arquitetura, e eles saíram. O resto virou correção.

## A rodada final que não era

A terceira rodada é a que mais ensina. Um achado baixo, num campo de formulário, depois de duas rodadas que já tinham limpado o grosso. Pela contagem, dava pra parar ali.

A quarta achou isto, no mesmo `onBlur`: a pessoa edita o campo pra "A" e sai, o que dispara o POST de "A". Antes da resposta, ela volta ao valor original e sai de novo. Como o valor na tela é igual ao último confirmado, nada é enviado. Aí a resposta de "A" chega com sucesso: o servidor guardou "A", a tela mostra o original e nenhum erro aparece. A correção foi guardar o último valor enviado e comparar com ele, não com o último confirmado.

Ou seja, a severidade subiu de baixa pra média depois de uma rodada que parecia o fim. Cada correção mexe em código que ninguém revisou ainda, e esse componente tinha levado correção nas três rodadas anteriores.

## Quando o achado cai no teste, falta uma

Da quinta rodada em diante, nenhum achado era em código de produção. A quinta apontou que o teste da corrida passava mesmo com o bug, porque a asserção final conferia um valor que já estava certo desde antes da segunda resposta (o mesmo [verde que não prova nada](/o-falso-verde) de sempre). A sexta pediu uma asserção que faltava. A sétima respondeu `NONE` em cinco segundos.

Não foi a primeira vez que a cauda teve essa cara. Três dias antes, as telas do lado do dev passaram por sete rodadas com o mesmo par Codex e Claude, numa contagem de 3, 0, 6, 5, 3, 1 e 0 (com um zero na segunda rodada que não fechou nada, porque a terceira voltou com seis). A sexta rodada ali também caiu num arquivo de teste, e a sétima zerou.

Quando o achado sai do código e vai pro teste que prova a correção, o código convergiu. Falta uma rodada, com o escopo fechado no que foi pedido, e acabou.

## Seis rodadas que não iam fechar

No dia 28 o Grok pegou cinco planos do mesmo projeto em sequência (`--sequential --agentic`), com o Codex revisando, já que o agy continuava fora. Eram as features do lado de quem busca: ler uma vaga, revisar o que foi lido, cruzar com os perfis, mostrar o resultado e guardar o histórico.

Com 2h44 de execução, pedi pro Claude ver se o Grok não estava travado em loop. Não estava: cada commit era diferente do anterior, o último tinha saído segundos antes, e quatro das cinco features estavam implementadas, 30 das 39 tarefas. As três que já tinham fechado o ciclo de revisão fecharam em duas rodadas cada (6 achados e depois 0, 1 e depois 0, 3 e depois 0). Cada feature levava entre 30 e 70 minutos, revisão incluída.

A quarta, a página de resultado, foi outra história:

| Rodada | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Achados | 3 | 4 | 2 | 3 | 4 | 2 |

Seis rodadas, quase uma hora entre revisão e correção, e a contagem não caiu. Bateu no teto de seis com dois achados médios abertos: com uma correção concorrente, o resumo podia sair de uma versão da busca e o ranking de outra; e o snapshot gravava todos os itens numa instrução só, que acima de uns 13 mil itens passa do limite de parâmetros do PostgreSQL e derruba a transação. Os dois foram corrigidos mesmo depois do teto, porque o fluxo manda corrigir a causa de qualquer achado válido, mas a revisão ficou registrada como pendente, sem ninguém declarar resolvido.

## A minha regra de parada olhava pra outra coisa

Cada rodada vira uma linha num arquivo de trilha ao lado da revisão (`docs/reviews/<slug>.rounds.jsonl`): quem implementou, quem revisou, os `arquivo:linha` abertos. O laço lê essa trilha pra decidir se gasta mais uma rodada:

```python
#: Rounds a finding must OUTLIVE to count as stalled. Two corrections is the point
#: where "not finished yet" stops being the better explanation.
WARN_AFTER_SURVIVED = 2
STOP_AFTER_SURVIVED = 3
```

O mesmo `arquivo:linha` aberto depois de duas correções gera um aviso pro implementador (ataque a causa ou discorde com evidência). Depois de três, o laço para. O comentário do script conta por que não é dois: testado contra um ciclo real de sete rodadas, parar em dois teria largado a revisão na terceira, num achado cujas três correções fecharam três portas diferentes na mesma linha. Já o mesmo arquivo em linhas que mudam é sinal fraco e nunca para nada, porque também descreve progresso honesto num arquivo com vários defeitos de verdade.

Na página de resultado, nenhum `arquivo:linha` se repetiu de uma rodada pra outra. Nenhum. Os achados andavam pelo mesmo arquivo em linhas diferentes, que é exatamente o sinal fraco, e pela definição da regra o Grok não estava travado (e não estava mesmo), só que a revisão também não ia convergir. A regra pega o agente que repete a mesma correção; uma contagem que sobe e desce ela não enxerga. Quem parou o ciclo foi o teto de seis rodadas, que só conta tentativas.

Lendo os dois dias lado a lado, a trilha mostra três situações diferentes:

| O que a trilha mostra | O que aconteceu |
|---|---|
| Contagem caindo, achado no código | Mais uma rodada achou coisa séria (a corrida da rodada 4) |
| Achado só no teste | Uma rodada de escopo fechado e `NONE` |
| Contagem sem cair por seis rodadas | Teto, revisão pendente, correção fora do ciclo |

## Mais uma rodada fica barata, e esse é o problema

No ciclo que convergiu, cada rodada custou menos que a anterior: de 84 segundos e 15,9 mil tokens de saída na primeira pra 5 segundos e 300 tokens na última. Ninguém deixa de pedir uma oitava rodada por 300 tokens (e a oitava veio). O custo de verdade está do outro lado, no implementador corrigindo entre uma e outra, e na página de resultado foi quase uma hora pra uma feature que, nas vizinhas, fechava inteira em 30 a 70 minutos.

## Onde eu posso estar errado

A curva que caiu até zero não é só mérito do código. Quem escreveu os prompts de revisão foi o Codex, o implementador. Na sexta rodada o pedido dizia, com essas palavras: "Verify ONLY resolution of these two findings. Do not expand scope. Output exactly NONE if resolved". A sétima foi ainda mais estreita. Um revisor que só pode dizer se duas asserções existem vai dizer `NONE` assim que elas existirem, e esse `NONE` vale pra duas asserções, não pra feature.

A minha regra diz que quem escreveu o código não lidera o julgamento. Ali ele não julgou, mas decidiu o tamanho do que seria julgado, e na segunda rodada ainda argumentou contra quatro achados. O fluxo permite discordar com evidência, e o histórico da revisão registra os quatro como reavaliados, mas a convergência das últimas rodadas foi em parte fabricada pelo escopo. O que segura a conclusão é que a primeira rodada viu as duas specs e o diff inteiro, e as outras foram estreitando a partir dali, não do zero.

[[PREENCHER: a decisão que você tira disso para o fluxo (por exemplo, parar quando a contagem não cai em três rodadas, ou o prompt de revisão deixar de ser escrito pelo implementador), ou cortar este parágrafo se nada mudou]]

`NONE`
