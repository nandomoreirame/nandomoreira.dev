---
slug: sessoes-do-red-dead-online-p2p-relays-e-nat-duplo
title: "Meu estudo sobre as sessões do Red Dead Online: P2P, relays da Rockstar e o NAT duplo que eu mesmo criei"
seoTitle: "Sessões do Red Dead Online: P2P, relays e o NAT duplo"
summary: "Passei dez dias olhando o tráfego do meu Xbox para entender como uma sessão do Red Dead Online se forma. Aprendi a separar jogador de relay numa captura, descobri que o meu gateway tinha derrubado o tipo de NAT para Moderado e que esconder o IP de casa custa um ajuste de MTU."
date: "2026-10-13"
publishedAt: "2026-10-13T00:12:00-03:00"
markers:
  - redes
  - linux
  - homelab
  - xbox
art: terminal
---

Com dois colegas na sessão, a captura devolveu quatro IPs. Dois deles trocaram 1.805 e 1.664 pacotes com o meu Xbox; os outros dois, seis e quatro. Eu esperava três endereços (eu e mais dois), e foi o quarto que me fez parar de tratar o Red Dead Online como uma caixa preta.

A ferramenta que nasceu disso, o rdo-solo, já tem [post próprio](/rdo-solo-red-dead-online-sozinho-pelo-gateway). Aqui o assunto é o que eu aprendi sobre a rede no caminho: como a sessão conversa, quem é quem numa captura, e o que a minha rede de casa fez com o tipo de NAT do console quando eu coloquei um gateway Linux no meio.

## Duas conversas ao mesmo tempo

Uma sessão pública do Red Dead Online tem duas camadas de tráfego. Uma é com os servidores da Rockstar, em TCP 80 e 443, e é ela que mantém o console online. A outra é direta entre os jogadores, em UDP: a porta 6672 e a faixa de 61455 a 61458, que o Red Dead divide com o GTA Online porque os dois usam o mesmo netcode.

O tic-tac (o interruptor no cabo de rede que eu usava) corta as duas de uma vez, por um instante. A sessão esvazia, e como eu mesmo descrevia, "ficamos alguns minutos na sessão limpa até que comece entrar outros jogadores". Derrubando só as portas UDP no gateway, o efeito muda de figura: os outros jogadores sumiram da minha sessão e ela continuou viva, porque o canal com a Rockstar nunca caiu.

A regra precisa morder as portas nos dois sentidos e como origem e destino ao mesmo tempo, porque o console usa essas portas como locais e os outros jogadores também. São quatro combinações por faixa, e o script tem as quatro.

**Uma sessão também não é só "eu e os outros jogadores".** Ela é uma malha P2P com um host, que é um dos jogadores, e relays da Rockstar por baixo, e o host migra de tempos em tempos. Foi não saber disso que matou a minha primeira tentativa de deixar só os amigos entrarem, e essa história está no outro post.

## Quem é jogador e quem é a Rockstar

Voltando aos quatro IPs: os dois com mais de mil e seiscentos pacotes eram os meus colegas, com PTR de provedor residencial brasileiro. Os dois de meia dúzia de pacotes estavam no mesmo `/24`, sem DNS reverso nenhum, num bloco registrado como `RSGEWR`. RSG de Rockstar Games, EWR de Newark (eles nomeiam os datacenters pelo código do aeroporto). No dia seguinte apareceram outros com final `RSGSJC`, San Jose.

Os dois são parte da `RSONET-NA1`, a faixa `192.81.240.0/21`, a rede online da Rockstar na América do Norte. Esses relays batem na porta do console o tempo todo, de um a quatro pacotes por intervalo, então o log do modo solo era quase só Rockstar. Eu cheguei a perguntar se dava para deixar essa faixa passar e bloquear o resto. Dava, mas os relays também carregam tráfego de jogador que não conseguiu conexão direta, e liberar a faixa abriria justamente a porta que o modo solo fecha. Decidi continuar bloqueando e só esconder a faixa do log.

A heurística do PTR funcionou bem nessa primeira captura e falhou na seguinte. Com 14 jogadores na sessão (contados na tela do jogo), a TUI marcou dois como `player` e o resto como `?`. **Jogador de console quase nunca tem DNS reverso**, então exigir um PTR com cara de residencial deixava todo mundo como desconhecido, e o temporizador que devia parar na entrada do primeiro jogador seguia contando. A regra virou outra: na lista da sessão, todo peer P2P direto que não é Rockstar nem datacenter conta como jogador, com um piso de cinco pacotes para ignorar sonda isolada. A tela passou a mostrar 17 peers: os jogadores, dois relays e conexões transitórias do próprio console.

E a captura pega todo mundo que está na sessão naquele instante. Quando testei a captura do bando, vieram três amigos e dois endereços dos Estados Unidos que eu jurava ser da Rockstar. Não eram: um era banda larga residencial e o outro uma rede móvel, dois desconhecidos que estavam na mesma sessão pública. Foi daí que saiu o botão de remover um IP por vez da lista salva.

## O gateway que não fazia NAT

O desenho inicial era simples. O Xbox ganhou IP fixo fora da faixa do DHCP do modem e passou a usar o homelab como gateway. O homelab só encaminha, sem NAT, e a volta vem do modem direto para o console. A ideia de não mascarar nada era justamente não mexer no tipo de NAT do Xbox.

Isso tem uma exigência: `send_redirects` desligado no homelab. Ligado, o kernel percebe que o console e o modem estão na mesma rede e avisa o console para falar direto com o modem, e todas as regras do filtro viram decoração sem nenhum erro aparecer.

Funcionou até a noite de 29 de setembro, quando reiniciei o homelab, o modem e o Deco. O Xbox ficou sem internet. Os contadores do iptables contavam a história: o console mandava mais de 200 mil pacotes para fora e recebia zero. Depois dos reboots, o modem da Vivo passou a descartar pacotes com o IP do console saindo pelo MAC do homelab, um endereço que ele nunca tinha entregado por DHCP. A correção foi um `MASQUERADE` só para o console, que eu deixei persistente no boot.

No dia seguinte, os meus amigos começaram a reclamar que não conseguiam entrar na minha sessão. Dava erro de conexão mesmo com o modo solo desligado, e não toda vez: às vezes eu conectava normalmente. Tentei o caminho óbvio, tirar o masquerade e voltar ao encaminhamento puro. A internet do Xbox ficou péssima na hora e o Discord desconectou, então o masquerade voltou em seguida.

Foi aí que liguei os pontos: o problema tinha começado de um dia para o outro, exatamente a noite do masquerade. O teste de rede do Xbox fechou o diagnóstico com **NAT Moderado**. O masquerade do homelab somado ao NAT do modem é um NAT duplo, e o console caiu de categoria. Com Moderado eu conecto com quase todo mundo e falho com quem está em NAT Estrito, que é exatamente o padrão intermitente que os amigos viam. Até a VPN, a escolha era uma que eu não queria ter que fazer:

| Gateway do Xbox | Modo solo | Jogar com amigos |
|---|---|---|
| homelab | funciona | instável (NAT duplo, Moderado) |
| modem | não tem efeito | funciona (NAT simples) |

A correção de verdade estaria no modem: amarrar o IP do console ao MAC do homelab, ou achar e desligar a proteção (provavelmente anti-spoofing) que os reboots religaram. Não cheguei a fazer, porque a VPN da próxima seção mudou o caminho do console: desde que o Xbox sai pelo túnel, jogar em bando ficou estável. O Moderado que sobrou é da VPN sem port forwarding, não mais do modem.

## Esconder o IP de casa custa MTU

O P2P tem um efeito colateral que eu descobri quando ouvi falar dos "painéis": todo mundo na sessão vê o IP de casa de todo mundo, e existe quem pegue esse IP e mande um DDoS no jogador. A defesa é o tráfego do jogo sair por um IP que não é o meu, numa infraestrutura que aguente o flood.

A primeira tentativa, em 25 de setembro, foi rotear o Xbox por um exit node do Tailscale numa VPS gratuita da Oracle. O túnel tem MTU 1280 e a rede de casa, 1500. Sem MSS clamping, o handshake TLS abre (pacote pequeno) e o pacote grande do certificado morre em silêncio. O sintoma é confuso: jogos com ícone de alerta na biblioteca, Discord que não conecta, navegação meio online. Um `ping -M do -s` a partir do roteador falhava acima de 1240 bytes, e o clamp em 1240 (1280 menos 40 de cabeçalho IP e TCP) resolveu. Funcionou, e mesmo assim desisti e desfiz tudo na mesma noite ("achei que era mais fácil e não parece que vai ser tão fácil assim"). A sobra dessa tentativa foi a tabela de rotas do Tailscale que depois engoliu o tráfego do console.

Em 3 de outubro o assunto deixou de ser teórico. Comecei a receber ameaças de jogadores dizendo que iam derrubar a minha internet, e aí ficou claro que isolar as sessões com o meu bando não bastava. O filtro decide quem entra na sessão, mas não apaga o IP que alguém já viu numa sessão pública, e um DDoS não precisa do jogo para chegar no modem. O que aconteceu com as ameaças fica para outro texto.

Dessa vez fui de VPN comercial (AirVPN, por WireGuard) subindo no homelab e uma regra de rota que manda só o IP do Xbox para o túnel. O Xbox ganhou o IP da VPN, o teste de rede deu NAT Moderado e todos os serviços disponíveis. Aí abri o Red Dead e ele ficou travado na tela de carregamento.

O primeiro diagnóstico, do Claude, que me acompanhou nessa investigação toda, foi que Red Dead e Xbox Live não combinam com VPN de datacenter, e a recomendação foi tirar a VPN do console. Eu não aceitei, porque eu tinha contratado a VPN exatamente para isso. A causa real era a mesma da primeira tentativa: faltava o MSS clamp, agora num túnel de MTU 1320. Com as duas regras `TCPMSS --clamp-mss-to-pmtu` no `PostUp`, o jogo abriu rápido e fui jogar com o bando.

A partir de 4 de outubro a saída deixou de ser São Paulo e passou a rodar entre Estados Unidos e Canadá, trocando todo dia às 5h da manhã. Escolhi a madrugada porque trocar de servidor reinicia o túnel, o IP de saída muda e a sessão P2P cai junto. O NAT continua Moderado; o próximo passo para melhorá-lo é abrir as portas UDP do jogo no painel da VPN e fazer o DNAT para o console, e isso eu ainda não fiz.

## O ponto cego do IPv6

Todo o filtro é IPv4. O Xbox Series pega IPv6 do modem por anúncio de roteador, e esse tráfego nunca passa pelo homelab. O login de cliente do modem da Vivo não expõe controle de IPv6, e o Xbox Series tirou a opção que o Xbox One tinha. A consequência visível é que o console resolve DNS pelo modem via IPv6, passando por fora do Pi-hole: abri o navegador do Xbox e a página veio cheia de anúncio que o Pi-hole bloqueia em qualquer outro aparelho da casa.

Quando olhei, o console não estava usando IPv6 para o P2P do jogo, e a TUI do rdo-solo avisa no cabeçalho se isso mudar. Deixei como está, sabendo que é um buraco, porque fechar de verdade depende de pedir para a operadora ou de separar o console num segmento de rede próprio.

## O que ficou decidido

- Modo solo ligado para ficar sozinho, desligado para jogar em bando. Missões, séries e confrontos já são instanciados só para o bando.
- Os relays da Rockstar continuam bloqueados no modo solo; só somem do log.
- O Xbox sai pela VPN, e não pelo modem, então o NAT duplo deixou de atrapalhar o bando. A correção no modem ficou sem fazer.
- A VPN passa só o Xbox, sempre com MSS clamp, e troca de país de madrugada.

`0 packets dropped by kernel`
