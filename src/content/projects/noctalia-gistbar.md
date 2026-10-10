---
slug: noctalia-gistbar
title: Gistbar
block: systems-cli
art: gists
summary: "Plugin para o Noctalia Shell que traz os meus gists do GitHub para a barra: busca por descrição, nome de arquivo, linguagem e conteúdo, cópia pelo teclado, gist novo a partir da área de transferência, prévia e edição, tudo pelo gh CLI."
problem: |
  São 95 gists acumulados, e achar um trecho exigia abrir o GitHub,
  lembrar em qual gist ele estava e copiar à mão. Criar um gist novo com o que
  estava na área de transferência também passava pelo navegador.
decisions: |
  Plugin do próprio shell, na mesma arquitetura e no mesmo kit visual do
  Daybar: a lógica em funções JavaScript puras testadas com Vitest, o QML só
  como tela. Todo acesso ao GitHub passa pelo gh CLI, então o plugin nunca toca
  num token, e o conteúdo vai por stdin, nunca pela linha de comando. A busca
  ignora acento e cobre o conteúdo, que é o motivo de um gist existir, mas
  descrição e nome de arquivo pesam mais. O conteúdo fica em cache local com
  permissão 0600 e só é baixado de novo quando o gist muda. Gist novo nasce
  secreto, porque publicar por engano é a pior falha possível aqui.
outcome: |
  Uso próprio no meu desktop com CachyOS, publicado em licença MIT, com 151
  testes. Testado no Noctalia 4.7.7; o port para o Noctalia v5 está planejado.
tech:
  - QML
  - JavaScript
  - Noctalia Shell
  - GitHub CLI
  - Vitest
shortcuts:
  - keys: "Mod+G"
    action: "abre a busca de gists"
  - keys: "Mod+Ctrl+G"
    action: "cria um gist a partir da área de transferência"
  - keys: "↑/↓"
    action: "navega pela lista"
  - keys: "Enter"
    action: "copia o primeiro arquivo do gist"
  - keys: "Shift+Enter"
    action: "copia o link do gist"
  - keys: "Esc"
    action: "limpa a busca"
  - keys: "Ctrl+E"
    action: "edita a descrição e o arquivo aberto na prévia"
  - keys: "Ctrl+S"
    action: "salva a edição no GitHub"
repoUrl: https://github.com/nandomoreirame/noctalia-gistbar
liveUrl: null
images:
  - src: /lab/noctalia-gistbar/panel.webp
    alt: "Painel do Gistbar com o campo de busca, o botão Novo gist, os filtros Todos (95), Público (70) e Secreto (25) e a lista de gists, cada um com a descrição, os arquivos, o selo da linguagem e há quanto tempo foi atualizado"
    width: 633
    height: 447
featured: false
confidential: false
date: "2026-10-10"
---
