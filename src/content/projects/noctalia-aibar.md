---
slug: noctalia-aibar
title: AI Bar
block: systems-cli
art: usage
summary: "Plugin para o Noctalia Shell que mostra na barra quanto do plano do Claude Code e do Grok já foi usado: a porcentagem da janela mais crítica, o tempo até ela reiniciar e uma barra de progresso. No painel, cada janela aparece com o ritmo de uso, adiantado ou atrasado em relação ao tempo que passou."
problem: |
  Saber quanto do plano de uso do Claude Code e do Grok ainda restava exigia
  abrir uma página de cada serviço, e o limite costumava aparecer só quando já
  tinha estourado, no meio do trabalho.
decisions: |
  Plugin do próprio shell, na barra que já fica à vista, seguindo a arquitetura
  do Daybar: a lógica toda em funções JavaScript puras testadas com Vitest, e o
  QML só como tela. As credenciais das CLIs são apenas lidas, nunca gravadas,
  copiadas ou renovadas, e o token vai só no cabeçalho da requisição. Uma
  requisição que falha mantém o último dado bom marcado como desatualizado, em
  vez de esvaziar a barra. O ritmo compara a porcentagem usada com a
  porcentagem do tempo que já passou na janela. Endpoints e armadilhas vieram do
  ai-usagebar, do Fabio Akita, sem reaproveitar o código.
outcome: |
  Uso próprio no meu desktop com CachyOS, publicado em licença MIT, com 36
  testes. Avisa uma vez quando uma janela passa de 97%. Testado no Noctalia
  4.7.7; o port para o Noctalia v5 está planejado.
tech:
  - QML
  - JavaScript
  - Noctalia Shell
  - Vitest
repoUrl: https://github.com/nandomoreirame/noctalia-aibar
liveUrl: null
images:
  - src: /lab/noctalia-aibar/panel.webp
    alt: "Barra mostrando o uso do Claude Code em 69% com reinício em 40 minutos, e o painel aberto com as janelas de sessão e semanal do Claude Code, o uso extra e a janela semanal do Grok, cada uma com a porcentagem, o tempo até reiniciar e o ritmo em pontos adiantado ou atrasado"
    width: 600
    height: 448
featured: false
confidential: false
date: "2026-10-10"
---
