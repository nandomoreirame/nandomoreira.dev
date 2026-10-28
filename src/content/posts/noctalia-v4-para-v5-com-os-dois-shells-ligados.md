---
slug: noctalia-v4-para-v5-com-os-dois-shells-ligados
title: "Do Noctalia v4 para a v5: portei os plugins com os dois shells ligados"
seoTitle: "Noctalia v4 para v5: migrar plugins QML para Luau"
summary: "Em dez dias troquei o shell do meu desktop e reescrevi três plugins de QML para Luau com a v4 sempre a um comando de distância. O que segurou tudo foi uma regra: a v4 não podia parar de funcionar até a v5 assumir."
date: "2026-10-28"
markers:
  - linux
  - noctalia
  - niri
  - luau
extras:
  - "3 plugins portados, v4 removida em 10 dias"
  - "Noctalia v5 · Luau · bash · git worktree"
keyPoints:
  - "Um comando trocava de shell e um despachante traduzia cada atalho do Niri pra v4 ou pra v5, sem o atalho saber qual estava rodando."
  - "Todo plano de plugin carregava a mesma regra: o plugin da v4 continua carregando até a v5 assumir. O QML antigo mora na branch legacy-v4."
  - "No Luau, os.time com tabela devolve UTC. O plano assumia hora local, e um teste pegou antes de virar lembrete no horário errado."
snapshot:
  items:
    - label: "Compositor"
      value: "Niri"
    - label: "Shell antigo"
      value: "Noctalia 4.7.7 (QML)"
    - label: "Shell novo"
      value: "Noctalia 5.2.1"
    - label: "Plugins"
      value: "Luau 0.742"
    - label: "Troca de shell"
      value: "nocta · noctalia-switch"
    - label: "Testes"
      value: "bats · Luau"
draft: true
---

No dia 11 de outubro uma atualização do Qt, da 6.11 pra 6.12, quebrou o meu desktop. O `noctalia-qs`, base da v4 do [Noctalia](https://github.com/noctalia-dev/noctalia), precisou ser recompilado aqui com um patch trazido de uma versão mais nova, e o Qt 6.12 ganhou um singleton `Color` que passou por cima do `Color` do Noctalia. A saída foi fixar `import QtQuick 6.11` em todo arquivo QML, do shell e dos meus plugins, com um `sed` rodando como root em cima de `/etc/xdg`. Funcionou, e eu fiquei sabendo que o próximo Qt ia quebrar tudo de novo: a branch da v4 está sem suporte desde 29 de agosto. Dez dias depois a v4 não existia mais nesta máquina.

A pergunta óbvia era como reescrever quatro plugins de QML pra [Luau](https://luau.org). A que me importava era outra: como continuar trabalhando no computador enquanto o shell inteiro (barra, launcher, notificações, tela de bloqueio) e os plugins mudavam por baixo. Se você também tem um desktop montado à mão, sabe que ficar uma tarde sem barra e sem atalho é o dia perdido. **Rodar as duas versões lado a lado custou mais código do que trocar de uma vez, e foi esse código que me deixou trocar sem medo.**

Este texto continua o post sobre [os quatro plugins que criei para o Noctalia](/criei-quatro-plugins-para-o-noctalia-100-com-ia-no-meu-cachyos), que eram todos da v4.

## O que muda da v4 pra v5

A v5 é outro programa. A v4 roda sobre o [Quickshell](https://quickshell.org) (Qt e QML); a v5 é um shell nativo em C++ com OpenGL ES, sem Qt nenhum, e veio pronta no repositório do CachyOS. O que mais pesou pra mim:

| | v4 | v5 |
|---|---|---|
| Binário | `qs -c noctalia-shell` | `noctalia` |
| Config | `settings.json`, que o próprio shell reescreve | vários `.toml`, que ele nunca reescreve |
| IPC | `qs -c noctalia-shell ipc call <alvo> <função>` | `noctalia msg <comando>` |
| Plugin | QML com janelas livres | `plugin.toml` e scripts Luau isolados, interface declarativa, sem janela livre |

A linha da config pesa pra quem versiona dotfiles: na v4 eu chegava a fazer commit do `settings.json` só porque o shell tinha reescrito ele sozinho. A linha do plugin é a que dá trabalho: nada do QML se aproveita, e o que era janela solta vira painel.

O bom é que os dois pacotes convivem. A v4 só lê `settings.json`, a v5 só lê `*.toml`, então os dois dividem a mesma pasta de config sem pisar um no outro.

## Migração primeiro, plugins depois, um plugin por vez

Quando pedi o plano, a frase foi esta: "quero entender como entregar valor por etapas e poder testar o mais rápido possível, sem falar que o meu plano do Claude não vai dar pra implementar de uma só vez, será migração primeiro, plugins depois e um plugin por vez".

Virou um plano com 13 etapas. Uma por arquivo, e cada uma terminando em algo que dá pra testar na mão, porque eu ia puxar uma etapa por vez com o `/rpi:implement` e a cota do plano tinha que durar. A configuração da v5, o comando de troca, a camada de atalhos e o kit de testes vieram antes de qualquer plugin. A v4 ficava de reserva até a última etapa, a que remove tudo.

A outra decisão foi minha também: "eu não quero um monorepo, eu quero que cada plugin continue com seu próprio repositório com uma branch `legacy-v4` e a main sendo a v5". Cada plugin seguiu seu próprio ciclo de spec, plano e implementação dentro do repositório dele, no [fluxo RPI](/fluxo-rpi-claude-code-grok-codex), com o Grok implementando e o Claude revisando (o Codex estava sem cota naqueles dias).

## Um comando pra trocar de shell

O primeiro script de verdade foi o `noctalia-switch`. Ele para o shell que está rodando, espera ele sair (com `SIGKILL` se passar de cinco segundos), sobe o outro pelo `niri msg action spawn`, roda de novo o script que devolve os ícones da bandeja e grava a escolha:

```bash
$ noctalia-switch v5
$ noctalia-switch status
persisted: v5 running: v5
```

O `noctalia-session` lê essa escolha no login. O [Niri](https://github.com/YaLTeR/niri) passou a ter uma única linha de autostart, que chama o `noctalia-session`, e ele sobe a v4 ou a v5 conforme a última troca. Com isso dava pra usar a v5 e, se algo travasse, voltar pra v4 com um comando. Sem editar config nenhuma.

## Atalho nenhum sabe qual shell está rodando

Meus atalhos do Niri chamavam o IPC da v4 direto, e a sintaxe da v5 é outra pra quase tudo. Em vez de manter dois `config.kdl`, escrevi o `nocta`, um despachante em bash: o atalho pede uma ação com nome de gente, e o `nocta` traduz pro shell que está vivo.

| Ação | v4 | v5 |
|---|---|---|
| `nocta launcher` | `launcher toggle` | `panel-toggle launcher` |
| `nocta lock` | `sessionMenu lock` | `session lock` |
| `nocta dnd on` | `notifications enableDND` | `notification-dnd-set on` |
| `nocta plugin <nome> <evento>` | `plugin:<nome> <evento>` | `plugin nandomoreirame/<nome>:<entry> <alvo> <evento>` |

No `config.kdl` o atalho fica assim, igual pros dois shells:

```kdl
Mod+Space hotkey-overlay-title="Daybar: captura rápida" { spawn-sh "~/.dotfiles/bin/utils/nocta plugin daybar capture"; }
```

A última linha da tabela é a que segurou a migração dos plugins. Na v5 cada plugin tem entradas com nome próprio (o aibar responde na `usage`, o daybar na `core`, o rdo-solo na `live`), e o `nocta` guarda esse mapa numa variável. Plugin que ainda não foi portado sai com código 4 e a mensagem `plugin <nome> not migrated to v5`, em vez de falhar calado. O Gistbar está nesse estado até hoje: `Mod+G` devolve 4 até a versão Luau sair.

Os scripts que conversam com o shell (o `nocta-hold`, o `game-mode`, o `noctalia-restart`) passaram pelo `nocta` também. A v4 deu um susto aqui: o `qs ipc call state all` derrubava o socket, então `nocta dnd status` falhava na v4 e os scripts tratavam o não perturbe como desligado. Ficou anotado como problema conhecido, porque a v4 ia sair mesmo.

Quando a v4 saiu, o `nocta` perdeu o ramo dela e ficou. Os atalhos não mudaram uma linha.

## Um kit de testes antes do primeiro plugin

Os plugins da v4 tinham a lógica em JavaScript puro testada com Vitest. Eu queria o mesmo na v5, e o Luau de linha de comando não ajuda: não tem `io`, não tem `os.execute`, o `_G` é só leitura e não dá pra listar arquivo. Um teste em Luau não consegue nem ler do disco o script do plugin que ele quer testar.

A saída foi deixar o bash fazer o que o Luau não faz. O `run-tests` descobre os testes, e antes de rodar gera, pra cada script do plugin, um módulo que só devolve o código-fonte como string. O carregador de testes faz `require` desse módulo, compila a string e roda o script num ambiente falso, com um mock de `noctalia.*` que grava cada chamada de HTTP, arquivo, estado e processo. A regra de layout vem junto: lógica pura em `lib/*.luau`, sem tocar em `noctalia`, e o script de entrada fino.

Isso mora num template no meu dotfiles, que é privado, mas a cópia está em cada plugin: o [`run-tests`](https://github.com/nandomoreirame/noctalia-aibar/blob/main/run-tests) e o [`tests/support/`](https://github.com/nandomoreirame/noctalia-aibar/tree/main/tests/support) do aibar são exatamente isso. Dois scripts fecham o kit:

- `noctalia-plugin-scaffold <repo>` copia o kit e o workflow de CI pra dentro do repositório do plugin. Rodar de novo atualiza o kit sem encostar no código do plugin.
- `noctalia-plugins-link` cria um link simbólico de cada repositório já portado em `~/.local/share/noctalia/plugins/`, que é onde a v5 procura plugins locais e de onde ela recarrega sozinha quando o arquivo muda. Repositório ainda em QML (sem `plugin.toml`) e worktree `-v4` ficam de fora.

## A regra que todo plano carregava

Antes do primeiro commit que tirasse QML da `main` de um plugin, três coisas: a branch `legacy-v4` com a última versão QML, um `git worktree` dessa branch numa pasta `<plugin>-v4` ao lado do repositório, e o link da v4 apontando pro worktree. A v5 lia a `main`, a v4 lia o worktree. Mesmo repositório, dois checkouts, nenhum clone duplicado.

E a regra escrita em cada plano de plugin: **o plugin da v4 nunca para de funcionar.** Nenhuma tarefa podia quebrar ele. Correção que a v4 precisasse durante a migração ia pra `legacy-v4`, nunca pra `main`. Isso me deixava trocar de shell a qualquer hora no meio de um port pela metade, e foi o que eu fiz.

## Três plugins, três tamanhos

O [aibar](https://github.com/nandomoreirame/noctalia-aibar) foi o primeiro, no dia 14, e era o que segurava a troca de shell padrão. Tinha umas mil linhas de QML na v4 e saiu com 147 testes em Luau e 7 em shell, com o painel mostrando o uso do Claude Code e do Grok na barra da v5 no mesmo dia. O README dele tem uma seção de lacunas conhecidas, com o que a API da v5 não deixa fazer: o widget da barra não fica destacado com o painel aberto, e o painel não acompanha a altura do conteúdo.

Aí o plano mudou. No dia 19 eu escrevi: "se a gente pular os plugins dá pra usar o v5 sem eles? e implementar depois?". A resposta virou uma etapa nova, que deixou a v5 usável sem plugin nenhum (bloqueio que espera a senha, tela apagando no mesmo tempo da v4, papel de parede trocando, a barra copiando a da v4), e os plugins foram pra depois da troca. "Preciso me acostumar com ele, das poucas vezes que usei achei muito diferente do v4."

O [daybar](https://github.com/nandomoreirame/noctalia-daybar) era o grande, com 4,1 mil linhas de QML. O port saiu no dia 19: a lógica toda reescrita em módulos Luau, o serviço cuidando de todo o I/O (arquivo, `khal`, HTTP, som) e as janelas livres viradas painéis. Os dados da v4 são importados uma vez no primeiro start. A lista de lacunas dele é maior: sem a janela flutuante do timer (o relógio de mesa substitui), confirmação numa linha em vez de balão, alarme que toca uma vez e não para antes.

O rdo-solo, que mostra na barra o modo do filtro do meu homelab, ganhou repositório próprio no dia 18 e foi portado no dia 19, com 69 testes. Ele não precisou de worktree: a v4 continuou carregando a cópia que já estava no dotfiles.

Dos outros dois plugins do post anterior, o Gistbar ficou pra depois e o Desktop Sticky Notes eu descontinuei.

## O que quebrou

### `os.time` com tabela é UTC no Luau

O plano do daybar dizia que `os.time` e `os.date` trabalham em hora local, como no Lua de referência (o PUC-Rio). Um teste mostrou o contrário: no Luau de linha de comando, `os.time` com uma tabela de data lê a tabela como UTC, e não como hora de São Paulo. Errado por três horas. O `os.date` sem `!` continua usando o fuso do processo, então as duas funções não fazem o caminho de volta uma da outra. Num plugin com agenda, lembrete e pomodoro, isso põe cada horário fora do lugar (São Paulo é UTC-3).

A correção é medir o deslocamento e somar:

```lua
local asUtc = os.time({ year = year, month = month, day = day, hour = h, min = mi, sec = s })
local probe = math.max(asUtc, 86400)
local parts = os.date("*t", probe)
local wallAsUtc = os.time({ year = parts.year, month = parts.month, day = parts.day,
  hour = parts.hour, min = parts.min, sec = parts.sec or 0 })
return asUtc + (probe - wallAsUtc)
```

O `math.max` com 86400 existe porque, a oeste de Greenwich, 1º de janeiro de 1970 em hora local cai antes da época Unix. Tudo no daybar passa pelo [`lib/dates.luau`](https://github.com/nandomoreirame/noctalia-daybar/blob/main/lib/dates.luau), nenhum módulo chama `os.time` com tabela direto, e o `run-tests` exporta `TZ=America/Sao_Paulo` pra os testes não dependerem da máquina. O plano estava errado. Os prompts das tarefas seguintes pro Grok já saíram com a correção, senão ele ia seguir o plano e repetir o erro em cada módulo de data.

### Padrão do Lua não é regex

O parser de datas do daybar (o que entende "reunião sexta 15h-16h") era cheio de regex com alternativa, tipo `(?:-|até|às|as)` pro separador de horário. No Lua não existe `|`: dentro de um `string.match` ele é só um caractere, e `*`, `+` e `?` não se aplicam a um grupo entre parênteses. Colar a regex do JavaScript dá um padrão que compila e não acha nada.

O [`lib/when.luau`](https://github.com/nandomoreirame/noctalia-daybar/blob/main/lib/when.luau) virou um tokenizador: quebra o texto em palavras e procura cada uma em tabelas (`RELATIVE_DAYS` com `hoje`, `amanha` e `depois de amanha`, `WEEKDAYS` com os dias da semana), com as chaves sem acento pra "amanhã" e "amanha" darem no mesmo. Dá mais código que a regex, e cada caso do teste da v4 foi portado junto.

### O `game-mode` congelava a v5

O `game-mode` congela tudo o que não é jogo enquanto eu jogo, menos uma lista de processos. O shell está na lista porque o IPC precisa responder. Só que a lista dizia `qs`, o nome do processo da v4. Com a v5 rodando como `noctalia`, o modo jogo congelava o shell novo junto. Isso só apareceu no dia da limpeza, quando o código da v4 saiu dos scripts, e a correção foi trocar `qs` por `noctalia` numa expressão regular. Uma camada como o `nocta` resolve a sintaxe; ela não ajuda quando o nome do processo está escrito à mão em outro script.

## 21 de outubro: a v4 sai

O plano pedia sete dias com a v5 como padrão antes de remover a v4. A troca padrão foi no dia 18, e a última vez que eu voltei pra v4 foi no dia 19. No dia 21 eu escrevi: "acho que usei o noctalia v5 o suficiente para aprovar ele como default e descartar a instalação do noctalia-shell v4". Não esperei os sete dias.

Saiu tudo de uma vez: o ramo da v4 do `nocta` e dos scripts, o `noctalia-switch` e o `noctalia-session` (o Niri voltou a subir o `noctalia` direto), a config em JSON, os esquemas de cor antigos, os dois pacotes e 1,6 GB de cache do rebuild do `noctalia-qs`. Antes guardei um backup da config da v4 num tarball. Os worktrees `-v4` foram apagados, as branches `legacy-v4` ficaram: o QML do [aibar](https://github.com/nandomoreirame/noctalia-aibar/tree/legacy-v4) e do [daybar](https://github.com/nandomoreirame/noctalia-daybar/tree/legacy-v4) continua lá, congelado, pra quem ainda usa a v4.

O `noctalia-switch` viveu sete dias, do dia 14 ao 21. Foi ele que deixou eu portar o daybar no dia 19 com a v5 aberta e a v4 a um comando de distância, e saiu junto com a v4. O que ficou da migração é o `nocta` e o kit de testes, à espera do port do Gistbar.

`pacman -Rns noctalia-shell noctalia-qs`
