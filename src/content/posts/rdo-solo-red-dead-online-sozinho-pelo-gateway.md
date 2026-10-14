---
slug: rdo-solo-red-dead-online-sozinho-pelo-gateway
title: "rdo-solo: Red Dead Online sozinho pelo gateway de casa, agora com código aberto"
seoTitle: "rdo-solo: Red Dead Online sozinho pelo gateway de casa"
summary: "Abri o rdo-solo, o controlador que me deixa sozinho numa sessão pública de Red Dead Online no Xbox. O console passa por um gateway Linux, o gateway derruba o P2P do jogo, e dá para ligar e desligar pelo terminal, por uma TUI em Rust ou pelo celular."
date: "2026-10-11"
markers:
  - linux
  - redes
  - open source
art: play
publishedAt: "2026-10-11T10:59:08-03:00"
---

> **Aviso**
>
> Bloquear o tráfego P2P do jogo mexe na sua conexão com os servidores e com outros jogadores. **Isso pode violar os Termos de Serviço da Rockstar/Take-Two e, em tese, levar a punições na conta (inclusive ban).** Use por sua conta e risco, com finalidade pessoal/educacional; leia a seção "Termos de uso" em `homelab/rdo-solo.md`. Esta é uma ferramenta pessoal, extraída de um dotfiles privado e compartilhada como está, **sem garantia**.
>
> O painel `web/` protege o acesso por PIN + sessão assinada, mas foi pensado para **rede local / Tailscale**, não para exposição direta na internet.

O [rdo-solo](https://github.com/nandomoreirame/rdo-solo) está aberto no GitHub, com licença MIT desde 8 de outubro. É o que eu uso para ficar sozinho numa sessão pública de Red Dead Online no Xbox: o console fica cabeado atrás de um gateway Linux, e com o modo solo ligado o gateway derruba as portas UDP do peer-to-peer do jogo (6672 e 61455 a 61458). O tráfego com os servidores da Rockstar continua passando, então a sessão segue viva, só que ninguém consegue abrir conexão direta comigo. Funciona igual no GTA Online, que usa o mesmo netcode.

Serve para quem tem o console passando por uma máquina Linux que controla: um homelab, um mini-PC, um Raspberry Pi. Não precisa ser um servidor: um notebook com Linux, com o Xbox ligado nele por cabo, também funciona, desde que o notebook compartilhe a própria internet (pelo Wi-Fi, por exemplo) com o console. Num PC qualquer que não esteja no caminho do tráfego do console ele não faz nada, porque **o valor está na topologia, e o binário é o de menos**.

## Do tic-tac ao gateway

Tudo começou com um tic-tac que eu montei com um switch, um cabo de rede e um interruptor. O tic-tac é o jeito conhecido de esvaziar uma sessão: um clique corta a rede, e a sessão esvazia. Só que é um pulso, e em poucos minutos ela se repovoa. Foi daí que veio a ideia do script: deixar o bloqueio no gateway, ligado pelo tempo que eu quiser, em vez de ficar clicando no interruptor.

O uso certo é esse mesmo, ficar sozinho no grind de caça e coleta sem ninguém enchendo. Para jogar em bando eu desligo o filtro: missões, séries e confrontos já rodam numa instância privada do bando, e o filtro ligado é justamente o que derruba essas atividades com "falha de rede".

Sobre o risco do aviso lá em cima: o que se relata na comunidade é baixo, nunca zero. Do lado da Rockstar, P2P bloqueado é indistinguível de um NAT restrito ou de internet ruim, e o que pune conta é mexer no estado do jogo (dupe de item, mod injetando conteúdo). Dentro da sessão solo ninguém sai prejudicado. Usar corte de rede em PvP para ficar invulnerável enquanto mata os outros é outra conversa, e aí o prejuízo é de terceiros.

## Como experimentar

Você precisa de um gateway Linux por onde o console roteia (encaminhamento e NAT), root nele, `iptables` e `iproute2`. A TUI pede `tcpdump`; `whois` e um banco GeoLite2 City da MaxMind são opcionais e só enriquecem os IPs.

O mais simples é o script shell, direto no gateway:

```bash
git clone https://github.com/nandomoreirame/rdo-solo.git
cd rdo-solo
sudo ./homelab/rdo-solo on      # liga o bloqueio P2P
./homelab/rdo-solo status       # estado (o único que não pede senha)
sudo ./homelab/rdo-solo off     # desliga
```

O IP do console e a interface de saída ficam em `/etc/rdo-solo.conf` (`CONSOLE_IP`, `WAN_IF`). E ele precisa estar certo, porque o filtro só morde o IP que está lá. Se o console voltar para DHCP, todas as regras carregam, nada é bloqueado e o status responde `ON` alegremente. Por isso o `on` se recusa a rodar quando os dois IPs não batem.

## O que vem no pacote

São três jeitos de mexer no mesmo filtro, e eles dividem o estado em `/var/lib/rdo-solo/`, então `rdo-solo on` e `rdo-solo-tui on` são intercambiáveis.

| Peça | O que faz |
|---|---|
| `homelab/rdo-solo` | O script shell original, que mexe em iptables e rota |
| `tui/` | Porte 1:1 em Rust com ratatui, compilado estático com musl e enviado por SSH, para não depender da glibc do gateway |
| `web/` | Painel em Next.js para ligar e desligar pelo celular, pela rede local ou pelo Tailscale |

Na TUI, com o solo desligado, a aba de jogadores na sessão lista os peers P2P com quem o console está falando, com cidade (GeoIP), tipo (player, datacenter ou Rockstar), provedor e tempo na sessão. Com o solo ligado, a mesma aba vira uma tabela de quem tentou entrar, ordenada por ameaça. Tem histórico que persiste entre sessões (responde "quem me bateu ontem"), aviso quando o Xbox tem IPv6, que fura um filtro que só enxerga IPv4, e no rodapé um `Tempo sozinho na sessão:` que congela no instante em que o primeiro player entra.

Quase sempre eu jogo no escritório, no monitor gamer (o MSI G272 que está no meu [setup](/setup)), com o rdo-solo rodando no notebook ao lado. O painel web existe para quando eu jogo do sofá, na TV, e o notebook fica longe. Ele roda num custom server Node com WebSocket na mesma porta, já que o App Router não faz WebSocket sozinho, e nunca mexe na rede direto: o servidor roda sem privilégio e chama o binário do gateway por um sudo restrito. O acesso é por PIN comparado em tempo constante, sessão assinada por HMAC e limite de tentativas. Ele também percebe quando o jogo me derruba: enquanto conectado, o console conversa sem parar com a rede de serviços da Rockstar (RSONET), e quando esse tráfego some o painel avisa "SESSÃO CAIU" e desliga o solo sozinho, porque com o filtro ligado a reconexão não passa. É uma heurística, bom indício e nada infalível. E ele foi pensado para rede local e Tailscale, nunca para ficar exposto na internet.

## O que eu errei no caminho

O script tinha uma whitelist para deixar os amigos entrarem numa sessão solo. Parecia funcionar: os amigos entravam, a missão começava, e alguns minutos depois o jogo mostrava "Você mudou de sessão devido a uma falha de rede" e me jogava sozinho numa sessão nova, com a missão do bando morta.

Uma sessão de Red Dead Online é uma malha P2P com um host, que é um dos jogadores, e relays da Rockstar por baixo. O jogo exige conexão com o host e com essa espinha dorsal, não só com os amigos. A whitelist bloqueava tudo menos os amigos, então derrubava o host (quase sempre um estranho) e os relays. A malha aguentava até a próxima migração de host para um peer bloqueado, e aí quebrava. Eu não tinha visto antes porque a captura achava os IPs dos amigos, mas nunca o host nem os relays. Em 28 de setembro a whitelist saiu do script.

Outro que me pegou foi o console ficando sem internet com o código `0x50060190`, que tem toda a cara de problema da Rockstar. Era a tabela 52 do Tailscale, sobra de uma tentativa de exit node, engolindo o tráfego encaminhado do Xbox. A correção é uma regra de rota que o `install` e o boot aplicam, e a TUI mostra a saúde da rota no cabeçalho para isso não voltar escondido.

## O que vem agora

O próximo passo é refazer o modo bando do jeito certo, que já está no código e no painel como "SESSÃO EM BANDO": um botão captura os peers da sessão atual, e ao ligar o modo o gateway derruba todo P2P fora dessa lista, **sempre deixando passar os relays da Rockstar**. A aposta é que eu vire o host de uma sessão limpa. Esse modo ainda não foi testado por inteiro. Testei até a captura, que isola os IPs da sessão do bando; o que falta testar é ligar o modo de fato, com o gateway bloqueando todo IP externo que não esteja nessa lista. A spec só considera isso pronto depois de uma sessão real com um amigo sobrevivendo à ativação e à migração de host. Até lá, o README fala só do modo solo. Mais para frente, na lista de desejos, está uma lista de bloqueio para banir só o IP de quem está atacando, sem esvaziar a sessão.

O código está em [github.com/nandomoreirame/rdo-solo](https://github.com/nandomoreirame/rdo-solo) e o resumo do projeto em [/lab/rdo-solo](/lab/rdo-solo). Ferramenta pessoal, extraída do meu dotfiles e compartilhada como está, sem garantia.

`rdo-solo off`
