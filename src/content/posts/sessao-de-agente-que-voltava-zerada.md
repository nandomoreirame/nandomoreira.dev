---
slug: sessao-de-agente-que-voltava-zerada
title: "A sessão de agente que voltava zerada: quando o cache da interface decide a vida do processo"
summary: "No Forja, trocar de projeto embaralhava o terminal e, na volta, o Claude Code aparecia com 0 tokens. O processo nunca tinha sido morto pelo backend: quem esquecia a sessão era um cache de interface com prazo de validade de cinco minutos."
date: "2026-10-11"
art: timer
markers:
  - electron
  - terminal
  - agentes
draft: true
---

No fim de março, trocar de projeto no [Forja](https://github.com/nandomoreirame/forja) tinha dois efeitos colaterais. O terminal voltava com texto sobreposto, linhas quebradas e conteúdo espalhado pela área. E, se a troca demorasse um pouco, a sessão do Claude Code voltava com "0 tokens": uma sessão nova, sem o histórico da conversa.

O Forja é o cliente desktop que eu fiz para rodar CLIs de agente (Claude Code, Codex, Gemini, Cursor Agent e um terminal comum) com abas, painéis e projetos lado a lado. Nessa época ele rodava em Electron, com xterm.js desenhando o terminal e node-pty segurando o processo. A pergunta óbvia diante de uma sessão zerada é "quem está matando o processo?". A resposta era ninguém, e antes dela vieram três correções em volta do mesmo lugar.

## Três consertos antes do certo

Cada um corrigiu algo real. Nenhum resolveu o sintoma.

Em 18 de março, o cache de terminais do frontend deixou de matar o processo no backend quando expirava. A ideia era que a sessão sobrevivesse ao cache e pudesse ser reconectada depois pelo `pty:has-session` e pelo buffer circular.

Em 25 de março, o terminal "estacionado" (aba escondida) passou a agrupar as escritas por quadro de animação. Os TUIs feitos com Ink mandam o redesenho da tela em vários pedaços, e escrever cada pedaço direto no xterm deixava estados intermediários corrompendo o buffer interno.

Em 30 de março, apareceu uma condição de corrida: durante uma ida e volta assíncrona por IPC, o projeto ativo podia mudar, e o layout do projeto A era salvo na configuração do projeto B. Na mesma noite, a integração com tmux para persistir sessões saiu do backend, 1.637 linhas apagadas. [[PREENCHER: por que o tmux saiu, e se ele fazia parte da tentativa de segurar as sessões]]

O plano de correção, datado do mesmo 30 de março, ainda descrevia os dois sintomas.

## O backend nunca matou nada

Esse plano começa por uma constatação que muda o problema de lugar: o `pty.ts` não mata processo nenhum durante a troca de projeto. O `Map` de sessões do backend mantém todas vivas. **O problema era só do frontend: o cache expirava o terminal, os handlers de saída sumiam junto e o estado da aba deixava de bater com a realidade.**

A cadeia completa, como está no plano:

1. O cache de terminais tinha TTL de cinco minutos (`CACHE_TTL_MS = 5 * 60 * 1000`). Ao expirar, ele descartava o terminal e também desregistrava o handler de saída daquela aba no dispatcher de eventos do PTY.
2. Sem handler, se o processo terminasse por qualquer motivo (crash, timeout de ociosidade, sinal do sistema), o evento era descartado em silêncio. A aba continuava marcada como `isRunning: true` com um processo morto por trás.
3. Na volta ao projeto, `pty:has-session` respondia `false` e um processo novo era criado.
4. O `--resume` só entrava se o ID da sessão da CLI tivesse sido detectado antes de a aba ser estacionada. Se não tinha, a sessão começava do zero.
5. E mesmo com o ID em mãos, a aba que ainda se dizia em execução caía no caminho de "aba ativa nova" e subia sem os argumentos de resume.

Ou seja: um cache cujo trabalho era economizar recursos de desenho tinha virado, sem ninguém decidir isso, o dono do ciclo de vida da sessão.

## O terminal embaralhado tinha três causas

A corrupção visual era outra cadeia, também no frontend.

O `TerminalBlock`, que liga o layout de painéis ao componente do terminal, passava `isVisible={true}` fixo. O efeito que recuperava o terminal quando ele voltava a ficar visível dependia de `isVisible` mudar, e um valor que é sempre `true` nunca muda. O código de recuperação existia e nunca rodava.

O primeiro `fitAddon.fit()`, feito na inicialização, não conferia se o contêiner tinha largura e altura. O handler do `ResizeObserver` tinha essa guarda; o caminho de inicialização, não. Durante a transição do layout, o terminal podia ser dimensionado contra um contêiner de 0x0.

Na volta do cache, a tela só era limpa quando as dimensões mudavam. Só que o terminal estacionado recebia escritas enquanto estava fora do DOM, e isso já corrompia o canvas mesmo com as dimensões iguais.

## A correção

Saiu em dois commits na manhã de 31 de março e entrou na v1.9.3, de 1º de abril.

Do lado da sessão, o dispatcher ganhou um handler de saída permanente, que recebe o evento quando a aba não tem handler próprio:

```ts
handleExit(payload) {
  const tabHandler = exitHandlers.get(payload.tab_id);
  if (tabHandler) {
    tabHandler(payload.code);
  } else {
    permanentExitHandler?.(payload.tab_id, payload.code);
  }
},
```

E o TTL do cache passou a perguntar antes de descartar: se a aba ainda existe no store, o usuário vai voltar, então o prazo é reagendado em vez de o terminal ser jogado fora. Para as abas de CLI que terminaram sem ID de sessão conhecido, entrou uma tentativa de `--resume latest`.

Do lado do desenho: o `isVisible={true}` saiu, o `fit()` inicial ganhou a guarda de dimensão, a tela passou a ser limpa sempre que uma sessão de CLI volta do cache, e o terminal que monta escondido adia a criação do processo até o primeiro redimensionamento válido.

## O contrato que ficou

Na tarde do mesmo dia veio o segundo plano, que transformou a correção em regra. A frase de arquitetura dele: tratar o tempo de vida do PTY e o tempo de vida da interface como preocupações separadas.

Os requisitos ficaram travados por escrito: trocar de projeto não mata PTY, trocar de workspace não mata PTY, esconder uma aba não mata PTY. Só fechar a janela e remover o projeto podem encerrar uma sessão, e os dois só depois de persistir o que é preciso para restaurá-la no mesmo projeto, na mesma aba e na mesma posição do layout.

Para segurar isso veio uma matriz de regressão com 1.005 linhas de teste acrescentadas em oito arquivos, cobrindo troca de projeto e de workspace, o salvamento no `beforeunload`, metadados de sessão de cada CLI (Claude, Codex, Gemini e terminal) e a limpeza de blocos órfãos do layout. A revisão desse trabalho ainda achou uma divergência: a ativação de workspace restaurava abas sem a guarda `hasBlock` que a restauração do boot usava, o que podia duplicar blocos. Os dois caminhos foram unificados num só.

A decisão, no fim, cabe numa linha: cache de interface pode descartar o que desenha, nunca o que sabe sobre o processo. Quem decide quando uma sessão acaba é o usuário, fechando a janela ou removendo o projeto.

`pty.kill()`
