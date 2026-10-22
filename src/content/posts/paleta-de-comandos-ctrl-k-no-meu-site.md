---
slug: paleta-de-comandos-ctrl-k-no-meu-site
title: "Ctrl+K no meu site: uma paleta de comandos que só baixa quando alguém aperta a tecla"
summary: "Busca no site inteiro, atalhos G + letra e ações de uma tecla só, em TypeScript puro e sem biblioteca. Quem nunca abre a paleta não baixa nada dela, e o que mais custou bytes foi o carregador, não a paleta."
date: "2026-10-22"
markers:
  - front-end
  - javascript
  - acessibilidade
  - performance
extras:
  - "Paleta em cerca de 3 KB gzip, baixada no primeiro Ctrl+K"
  - "TypeScript · <dialog> · Vitest · happy-dom"
keyPoints:
  - "A paleta é um arquivo à parte: quem nunca aperta Ctrl+K não baixa um byte dela."
  - "Pra uma centena de itens, tirar acento e exigir todos os termos resolve; uma lib de busca fuzzy estouraria o orçamento."
  - "O que pesou foi o import(): o auxiliar do Vite custou uns 717 B gzip e o orçamento do script subiu para 2304 B."
snapshot:
  items:
    - label: "Framework"
      value: "Astro 7"
    - label: "Paleta"
      value: "TypeScript, sem dependência"
    - label: "Índice"
      value: "/search.json no build"
    - label: "Orçamento"
      value: "4 KB gzip"
    - label: "Testes"
      value: "Vitest + happy-dom"
art: wireframe
draft: true
---

Aperta `Ctrl+K` em qualquer página deste site (ou `⌘K`, no Mac). Abre um campo escrito "Digite um comando ou busque…", e dali dá pra achar um post digitando o título sem acento, copiar o link da página com `L` ou ir pro blog com `G` e depois `B`, sem nem abrir a paleta. A ideia veio do [zenorocha.com](https://zenorocha.com), que faz isso com o [kbar](https://github.com/timc1/kbar), uma biblioteca em React.

Aqui não tem React no navegador, e nem pode ter. O site só aceita JavaScript de cliente por exceção com nome, e um teste reprova o build se aparecer qualquer script fora da lista (contei essa regra no [post do site que conversa via MCP](/como-construi-meu-site-que-conversa-com-ia-via-mcp)). Então a pergunta que eu tinha era quanto uma paleta de comandos custa pra quem nunca vai abrir ela, e a resposta que eu queria era zero. Se o seu site baixa a busca inteira no primeiro acesso pra servir as poucas pessoas que apertam `Ctrl+K`, todo mundo está pagando por elas.

## A paleta mora num arquivo que ninguém baixa sem pedir

Antes da paleta, o site tinha um script só em todas as páginas, o do efeito do ponteiro, com orçamento de 1536 bytes gzip e 1158 usados. Sobravam 378 bytes, e uma paleta de comandos não cabe nisso.

Estender esse script ficou de fora, carregar a paleta sempre também, e um segundo script em toda página idem. **O script do ponteiro ganhou só o carregador:** ele escuta o `Ctrl+K`, o clique no botão e a letra `G`, e na primeira vez faz um `import()` do módulo da paleta, que o build separa num arquivo próprio.

```ts
const palette = () => import('../../scripts/palette');
// ...
if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
  event.preventDefault();
  palette().then((module) => module.open(document.activeElement as HTMLElement));
}
```

O módulo virou a terceira exceção do [portão de JavaScript](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/design-system/no-client-js.build-test.ts): até 4 KB gzip, e só como arquivo baixado sob demanda. Se um dia ele aparecer como `<script>` direto na página, o teste reprova. No build de hoje, o [`palette.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/scripts/palette.ts) sai com 3050 bytes gzip.

O conteúdo da busca segue a mesma lógica. O índice é um `/search.json` gerado no build com as páginas, os posts atuais, os do arquivo, os cases e os serviços (hoje são cem itens, e rascunho não entra). A paleta busca esse arquivo na primeira vez que abre e reaproveita nas seguintes. Embutir o índice no HTML pesaria em toda página, e uma busca no servidor por requisição perderia o cache da CDN, que o arquivo estático aproveita. Se o `fetch` falhar, a paleta continua com as ações e o "Ir para", e avisa que a busca está indisponível.

E sem JavaScript a paleta simplesmente não existe: o botão e a dica nascem escondidos, e quem mostra os dois é o carregador. Pensei numa página `/busca` renderizada no servidor e descartei, porque é mais código pra manter e o site já navega sem paleta nenhuma.

## O byte que eu não tinha contado

O plano supunha que o carregador cabia nos 378 bytes livres. Não coube. O Vite envolve todo `import()` de cliente num auxiliar chamado `__vitePreload`, que sozinho custa uns 717 bytes gzip, e o script do ponteiro foi pra 2040 bytes, acima dos 1536 do orçamento.

O portão parou o build, que é o trabalho dele. Daí tinha três caminhos:

| Opção | O que aconteceu |
|---|---|
| Arrancar o auxiliar com um plugin do Vite | Descartada |
| Um segundo script em todas as páginas | Descartada, a regra continua sendo um script por página |
| Subir o orçamento do script do ponteiro | Escolhida: 2304 bytes gzip, desde 19/10/2026 |

A mudança ficou escrita na spec e no `CLAUDE.md` do projeto, com a data, o motivo (o `__vitePreload`) e o número novo, que o teste passou a cobrar. Coisa nova que for pendurada nesse script tem que caber nos mesmos 2304 bytes, ou pede outra decisão registrada.

## Busca sem biblioteca

O kbar tem busca fuzzy, e o reflexo seria pegar um [Fuse.js](https://www.fusejs.io) da vida. Pra uma centena de itens isso é peso morto, e a dependência sozinha estouraria os 4 KB. A busca inteira é esta função, em [`match.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/search/match.ts):

```ts
export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const scoreOf = (item: Searchable, query: string): number => {
  const words = terms(query);
  if (words.length === 0) return 0;
  const title = normalize(item.title);
  const keywords = normalize((item.keywords ?? []).join(' '));
  const summary = normalize(item.summary ?? '');
  let score = 0;
  for (const word of words) {
    const hit = (title.includes(word) ? 3 : 0) + (keywords.includes(word) ? 2 : 0) + (summary.includes(word) ? 1 : 0);
    if (hit === 0) return 0;
    score += hit;
  }
  return score;
};
```

Tudo vira minúscula e sem acento, todo termo digitado precisa aparecer, e o título pesa mais que as tags, que pesam mais que o resumo. Quem digita "sessoes" acha o post das sessões do Red Dead Online, e num blog em português esse é o caso que mais importa. Os posts de 2015 a 2019 também entram no índice, sempre por último e no grupo "Arquivo".

## Atalhos de uma letra, que eu tinha evitado

A primeira versão da spec só tinha a sequência `G` + letra (`G H` pra home, `G B` pro blog, `G P` pro portfólio e por aí vai), com um segundo de janela entre as duas teclas. Tecla solta ficou de fora de propósito, pra ninguém disparar uma ação sem querer no meio da leitura.

No meio da implementação mudei de ideia e fiquei com os atalhos curtos, como no site do Zeno. Hoje, fora de qualquer campo de texto, uma letra sozinha faz isto:

| Tecla | Ação |
|---|---|
| `L` | Copia o link da página |
| `E` | Vai pro contato |
| `M` | Abre a versão `.md` da página |
| `I` | Abre a versão para IA (ou volta pra humana) |
| `S` | Abre o código-fonte do site no GitHub, numa aba nova |
| `T` | Troca o tema entre Noir e Paper |

Nenhuma letra dispara com `Ctrl`, `Alt` ou `Meta`, nem dentro de um campo. Em tela de toque (`hover: none`) os atalhos de letra somem, mesmo com teclado plugado, e só o botão abre a paleta. O hero da home perdeu os botões que tinha e ficou só com a dica "Pressione Ctrl K", e o portão que exigia exatamente um botão principal na home passou a aceitar zero.

A paleta é um `<dialog>` modal, com o campo como `combobox` ligado a uma `listbox`: as setas movem a opção ativa (por `aria-activedescendant`), o `Enter` escolhe, o `Esc` fecha e devolve o foco a quem abriu, e uma região `aria-live` anuncia quantos resultados há. As transições são só CSS, com `@starting-style`, e com `prefers-reduced-motion` ela abre e fecha sem animação. Pra testar abrir, fechar, foco e teclado sem depender de screenshot, entrou o [happy-dom](https://github.com/capricorn86/happy-dom) como dependência de desenvolvimento, usado só no teste do módulo da paleta.

## O que quebrou depois de pronto

A feature fechou com 15 tarefas e a revisão sem nenhum achado aberto. Mesmo assim, três bugs apareceram depois, e os três passavam pelo carregador, a parte com menos bytes.

O primeiro apareceu no mesmo dia. Um segundo `Ctrl+K` com a paleta aberta apagava o que já estava digitado, e as letras digitadas enquanto o módulo ainda baixava se perdiam: numa rede lenta, um `G B` rápido não ia pra lugar nenhum. Agora essas letras esperam numa fila e são entregues assim que o módulo chega.

O segundo veio no dia seguinte, junto com o tema Paper. Coloquei o `T` na paleta pra trocar o tema, mas o carregador só baixava o módulo quando a letra era `G`, `L`, `E`, `M`, `S` ou `I`. Numa página recém-aberta, o `T` caía no vazio. O teste do carregador passou a tirar a lista de letras do próprio controlador da paleta, em vez de repetir a lista à mão.

O terceiro apareceu três dias depois da paleta. Escrevi um app pra Dev Toolbar do Astro (só no `astro dev`) em que eu grifo um trecho de post e escrevo a revisão numa caixa de texto. Toda letra digitada naquela caixa chegava na paleta como atalho. O carregador olhava o `event.target` pra saber se a tecla vinha de um campo, mas a toolbar vive dentro de um shadow DOM, e um listener no `document` recebe como alvo o elemento hospedeiro do shadow, não a `textarea` lá dentro. Pra ele, eu estava digitando na página. A correção foi olhar o primeiro elemento do `composedPath()`, que atravessa o shadow e devolve o campo de verdade ([`bare-letter.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/search/bare-letter.ts)):

```ts
/**
 * A bare letter reaches the palette unless it was typed in a field.
 * The caller passes `composedPath()[0]`: a document listener's `target` is the
 * shadow host, so a textarea in the dev toolbar would look like the page.
 */
export const forwardBareLetter = (origin: Origin, event: KeyEvent, touch: boolean): boolean => {
  const field = !!origin && (origin.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(origin.tagName));
  return !event.ctrlKey && !event.metaKey && !event.altKey && /^[a-z]$/i.test(event.key) && !touch && !field;
};
```

Se você tem atalho global de teclado no seu site e algum web component com campo de texto (um widget de chat, um formulário embutido), vale conferir se está olhando o `target` ou o `composedPath()`.

## O que fica

A paleta fica como está: um arquivo baixado sob demanda, uma busca de 35 linhas sem dependência e um orçamento que subiu uma vez, com data e motivo escritos. A próxima feature que mexe no mesmo script é a tradução do site, e ela vai ter que caber nos mesmos 2304 bytes. O código está no [repositório do site](https://github.com/nandomoreirame/nandomoreira.dev), pra quem quiser levar a ideia pro seu.

`dialog.close()`
