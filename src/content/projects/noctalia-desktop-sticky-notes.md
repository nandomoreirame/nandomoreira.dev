---
slug: noctalia-desktop-sticky-notes
title: Desktop Sticky Notes
block: systems-cli
art: mosaic
summary: "Plugin para o Noctalia Shell que prende notas adesivas na área de trabalho como widgets: cada nota pode ser arrastada e redimensionada, tem cor de post-it e texto em Markdown, abre um editor ao clique e pode ficar ligada a um arquivo .md no disco, atualizando quando o arquivo muda."
problem: |
  Lembretes rápidos ficavam espalhados entre arquivos e apps, longe da tela onde
  eu trabalho, e o Noctalia não tinha notas fixadas na própria área de trabalho.
decisions: |
  Cada nota é uma instância de widget de desktop, com texto, cores, tamanho,
  posição e escala próprios, salvos nas configurações do Noctalia para
  sobreviver ao reinício do shell. O clique abre um painel com foco de teclado,
  porque um widget de desktop não recebe digitação. Uma nota pode apontar para
  um arquivo Markdown, que vira a fonte da verdade. A lógica em JavaScript é
  coberta por testes no Vitest; o renderizador de Markdown e o layout do editor
  vêm do plugin sticky-notes de sapjax, também MIT.
outcome: |
  MVP funcionando no meu desktop, testado no Noctalia 4.7.7, em inglês e
  português. Publicado em licença MIT e ainda não enviado ao registro de plugins
  do Noctalia.
tech:
  - QML
  - JavaScript
  - Noctalia Shell
  - Markdown
  - Vitest
shortcuts:
  - keys: "Ctrl+S"
    action: "salva a nota e fecha o editor"
  - keys: "Esc"
    action: "também salva e fecha"
repoUrl: https://github.com/nandomoreirame/noctalia-desktop-sticky-notes
liveUrl: null
images:
  - src: /lab/noctalia-desktop-sticky-notes/settings.webp
    alt: "Nota adesiva amarela na área de trabalho com o painel de configurações aberto: arquivo Markdown vinculado, cor de fundo, cor do texto e tamanho da fonte"
    width: 1600
    height: 793
featured: false
confidential: false
date: "2026-06-09"
updatedAt: "2026-10-09"
---
