---
slug: terminal-noir
title: Terminal Noir
block: systems-cli
art: panels
summary: "Tema open-source extraído deste site para dar a mesma identidade visual ao sistema inteiro e aos aplicativos que uso: superfícies quase pretas e frias, escalonadas por luminância, um único acento âmbar e um verde-esmeralda para status. Os tokens de design saíram do CSS do nandomoreira.dev e viraram ports para shell, compositor, terminal, editor, navegador e ferramentas de linha de comando, com uma variante clara em tons de papel."
problem: |
  O site tinha uma identidade visual definida, mas o desktop em volta dele não:
  cada app tinha o próprio tema escuro, com pretos, cinzas e acentos diferentes,
  e ajustar uma cor significava caçar o mesmo hex em uma dúzia de arquivos de
  configuração.
decisions: |
  Extrair os tokens de design do CSS do site para uma paleta só, em
  palette.json, com as cores nomeadas por papel (surface.base, text.muted,
  accent.primary) e não por valor. Os papéis de sintaxe ficam em
  syntax.json e apontam para nomes da paleta, nunca para hex solto. Cada port é
  gerado a partir dela por um script em bash e jq, então mudar uma cor é editar
  um arquivo e rodar make build. Os testes em bats conferem a paleta, o
  mapeamento de cada port e se os arquivos gerados estão em dia com a fonte. O
  site em Astro lê a mesma paleta e o README de cada port no build, para nunca
  divergir do tema.
outcome: |
  Publicado em licença MIT com 11 ports: Noctalia, niri, Ghostty, VS Code e
  Cursor, GTK 4 e libadwaita, Google Chrome, bat e delta, btop, fzf,
  Powerlevel10k e Obsidian. Noctalia e Ghostty já têm a variante clara. É o tema
  que uso no meu desktop com CachyOS, Niri e Noctalia, de onde saíram todos os
  prints abaixo.
tech:
  - Bash
  - jq
  - bats
  - Astro
  - Firebase Hosting
repoUrl: https://github.com/nandomoreirame/terminalnoir
liveUrl: https://terminalnoir.web.app
images:
  - src: /lab/terminal-noir/noctalia.webp
    alt: "Desktop com Niri e a barra do Noctalia no Terminal Noir: código TypeScript num terminal à esquerda e, à direita, as 16 cores ANSI, a lista de ports e o histórico do git, tudo sobre fundo quase preto com bordas âmbar"
    width: 1400
    height: 591
  - src: /lab/terminal-noir/ghostty.webp
    alt: "Ghostty no Terminal Noir mostrando as 16 cores ANSI em amostras, os arquivos da paleta, a lista de ports e o log do git com hashes em âmbar"
    width: 1271
    height: 700
  - src: /lab/terminal-noir/vscode.webp
    alt: "VS Code no Terminal Noir com o explorador de arquivos do projeto e o palette.ts aberto: palavras-chave em âmbar, strings em verde e tipos em lilás"
    width: 1303
    height: 1076
  - src: /lab/terminal-noir/bat.webp
    alt: "bat exibindo site/src/lib/palette.ts com o tema Terminal Noir: números de linha apagados, palavras-chave em âmbar e strings em verde"
    width: 1271
    height: 880
  - src: /lab/terminal-noir/obsidian.webp
    alt: "Obsidian no Terminal Noir: nota com links em âmbar, um callout em verde-azulado, checklist marcada em âmbar, bloco de código e uma tabela de cores"
    width: 943
    height: 900
  - src: /lab/terminal-noir/gtk.webp
    alt: "Gerenciador de arquivos GTK 4 no Terminal Noir listando a pasta do projeto, com pastas em âmbar e a linha selecionada destacada em âmbar escuro"
    width: 1025
    height: 650
  - src: /lab/terminal-noir/chrome.webp
    alt: "Google Chrome no Terminal Noir abrindo terminalnoir.web.app: o título \"A noir theme for everything you type in.\", o botão Browse ports em âmbar e uma janela de terminal de exemplo"
    width: 1303
    height: 1076
featured: false
confidential: false
date: "2026-10-20"
---
