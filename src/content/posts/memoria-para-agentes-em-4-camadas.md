---
slug: memoria-para-agentes-em-4-camadas
title: "Memória para agentes: um backbone em quatro camadas"
summary: "Como o Claude Code lembra decisões entre sessões sem carregar tudo no contexto: o que é sempre lido, o que só entra quando alguém pergunta, e a migração que só terminou quando um portão deixou."
date: "2026-10-11"
publishedAt: "2026-10-11T02:01:30-03:00"
art: map
markers:
  - claude code
  - memória
  - agentes
---

Em 1º de junho eu salvei duas memórias no meu Claude Code. Uma dizia que a barra do meu Niri é o Noctalia, e não a Waybar. A outra, que o gerenciador de versões da máquina é o mise, e que ele nunca deve procurar nvm, pyenv ou asdf. Parecem bobas, e existem porque o agente, sem elas, presumia o contrário: toda sessão nova começava do zero, e do zero o palpite padrão para um desktop Linux é Waybar e nvm.

Esse é o problema inteiro da memória para agente: cada sessão começa sem saber nada, e a solução óbvia (jogar tudo no contexto) custa caro e piora conforme a memória cresce.

## Antes: dois sistemas e nenhum dono

Até maio eu tinha duas memórias convivendo. Uma era a memória automática do próprio Claude Code, guardada por projeto. A outra era um plugin chamado amnesia, com comandos `/amnesia:*`, que eu usava para fatos de clientes e subprojetos. Cada uma tinha seu formato e seu caminho, e nenhuma sabia da outra.

Em 19 de maio eu reescrevi isso como um backbone só, com um formato só (frontmatter YAML e corpo em Markdown, com links `[[nome]]` entre memórias) e quatro camadas.

## As quatro camadas

| Camada | Onde fica | Quando carrega | O que guarda |
|---|---|---|---|
| Self | `~/.claude/USER.md` e `SOUL.md` | Sempre | Quem eu sou, como o agente deve soar, preferências |
| Workspace | `<workspace>/.claude/WORKSPACE.md` | Sempre, se existir | Regras comuns a vários projetos do mesmo workspace |
| Entity | `<workspace>/.memory/entities/<id>.md` | Só quando pedida | Fatos de um cliente ou subprojeto específico |
| Project | `<projeto>/.claude/MEMORY.md` | Sempre, dentro do projeto | Decisões do repositório atual |

**A decisão que importa é a terceira linha: Entity é preguiçosa de propósito.** Um workspace pode ter dezenas de entidades, e carregar todas em toda sessão infla o contexto base para responder perguntas que quase nunca são sobre elas. Então ela só entra quando alguém a menciona.

Preguiça tem um risco, e eu escrevi a regra pensando nele: memória preguiçosa vira "preguiçosa e nunca carregada". A regra 14 do framework obriga o agente a chamar `/memory recall <id>` antes de responder sempre que eu citar uma entidade que não está nas camadas já carregadas. Se o nome não bate, ele devolve sugestões parecidas e me pergunta qual era, em vez de adivinhar.

O resto da interface é manual e pequena: `save` (que pergunta a camada antes de gravar), `recall`, `list`, `audit` e `verify`.

## A migração que um portão segurou

Migrar memória sem perder nada era o requisito que eu não queria negociar. O `migrate-memory.sh` roda em três fases (backup, consolidação da memória automática, conversão das entidades do amnesia), tem `--dry-run` e grava um marcador para não rodar duas vezes.

Um detalhe me custou mais do que parecia. O Claude Code guarda a memória automática numa pasta com o caminho do projeto codificado num hash, e decodificar esse hash de volta para o caminho é ambíguo. A saída foi fazer o caminho contrário: percorrer `~/dev`, codificar cada caminho candidato do mesmo jeito e ver qual batia.

A remoção do plugin antigo ficou atrás de um portão: o `--finalize` roda o `audit` e se recusa a continuar se ainda existir alguém chamando `/amnesia`. Na primeira tentativa o audit reclamou de cinco coisas, e nenhuma era real. `USER.md` e `SOUL.md` têm nome de arquivo diferente do campo `name` (de propósito, são arquivos para gente ler), e as skills novas citavam `/amnesia` em texto, justamente para dizer "não use `/amnesia`". O regex não distingue chamada de aviso. Ajustei a lista de exceções, o audit ficou limpo e o `--finalize` rodou. O plugin saiu de vez em 18 de junho.

## O que quebrou

No mesmo 18 de junho achei um bug que comia memória em silêncio. O carregador das camadas tirava o frontmatter contando linhas `---`. Só que `---` também é a linha horizontal do Markdown, então uma memória que usasse esse separador no corpo era cortada ali, e o agente lia metade do arquivo achando que era o arquivo inteiro. A correção foi tirar o frontmatter só quando o arquivo abre com `---` na linha 1, com um teste de regressão em cima.

O pior veio depois, num dia comum. Eu queria mover uma linha de lugar dentro do índice de memória e fiz isso com `grep -v "$LINHA"` seguido de um redirecionamento de volta para o arquivo. A linha começava com `- [`, como todo item de lista Markdown, e o `grep` daqui leu aquilo como opção e morreu. O passo seguinte escrevia no arquivo original a partir de uma saída vazia, e o `MEMORY.md` ficou com zero bytes (o shell trunca o destino antes de rodar o comando, então nem dá tempo de se arrepender).

Hoje a regra é escrever num arquivo temporário, conferir que ele não está vazio e só então mover por cima. E `--` antes de qualquer padrão que veio de uma variável.

## Memória que mente

O último problema é o mais sutil: memória certa no dia em que foi escrita, e errada seis meses depois. Uma memória de projeto que cita `src/lib/qualquer-coisa.ts` continua afirmando isso com toda a confiança depois que o arquivo foi renomeado.

O `/memory verify` existe para isso. Ele lê as memórias da camada Project, pega tudo o que está entre crases (arquivos, funções, flags) e confere se ainda existe no repositório. O que sumiu vira relatório de drift, e eu decido se a memória morre ou se atualiza.

Ficou um sistema pequeno: quatro camadas, cinco comandos e uma regra que obriga o agente a lembrar quando eu cito alguém.

`/clear`
