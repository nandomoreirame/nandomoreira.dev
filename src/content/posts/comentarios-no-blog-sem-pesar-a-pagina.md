---
slug: comentarios-no-blog-sem-pesar-a-pagina
title: "Comentários no blog sem pesar a página: o Giscus só entra quando você chega no fim"
summary: "O blog ganhou comentários pelo GitHub Discussions. Quem lê o post e fecha a aba não baixa nada do Giscus: um carregador de uns 1 KB espera a seção chegar perto da tela, e um teste reprova o build se ele passar de 2 KB."
date: "2026-10-28"
markers:
  - front-end
  - javascript
  - performance
  - github
  - privacidade
extras:
  - "Carregador de 1045 B gzip, teto de 2048 B no build"
  - "Giscus · GitHub Discussions · IntersectionObserver"
keyPoints:
  - "O script e o iframe do Giscus só entram quando a seção de comentários fica a 240 px da tela; antes disso, nada do giscus.app."
  - "O carregador é a quinta exceção do portão de JavaScript, com marca própria e teto de 2048 B gzip. Qualquer outro script reprova o build."
  - "O Giscus responde 'Discussion not found' pra todo post sem comentário. Tratar isso como erro mostrava a mensagem de falha no blog inteiro."
snapshot:
  items:
    - label: "Comentários"
      value: "Giscus"
    - label: "Armazenamento"
      value: "GitHub Discussions"
    - label: "Categoria"
      value: "Blog (Announcements)"
    - label: "Carregador"
      value: "1045 B gzip, teto 2048 B"
    - label: "Gatilho"
      value: "IntersectionObserver, 240px"
    - label: "Timeout"
      value: "8 s"
draft: true
---

Desde 22/10 os posts novos deste blog terminam numa seção chamada "Deixe seu comentário e vamos discutir sobre esse artigo". Se você ler até o meio e fechar a aba, o seu navegador não pediu nada ao [Giscus](https://giscus.app): o script dele e o iframe com a caixa de comentário só entram quando a seção chega perto da tela. Até lá, o que existe na página é um carregador que, no build daquele dia, saiu com 1045 bytes gzip.

Todo tutorial de comentários responde qual ferramenta usar. Essa é a parte fácil. A pergunta que eu tinha era quanto um widget de comentários custa pra quem só veio ler, porque um embed de terceiro carregado junto com o texto cobra de todo mundo, inclusive de quem nunca rola até o fim. **Comentário é a última coisa do post, então é a última coisa que a página deveria baixar.** Se o seu blog carrega o Disqus ou outro widget no topo da página, é isso que está acontecendo aí.

## Por que o Giscus, e por que uma categoria só pra ele

O Giscus guarda cada conversa no [GitHub Discussions](https://docs.github.com/pt/discussions) do próprio repositório do site. Pra comentar, a pessoa entra com a conta do GitHub, e eu modero lá mesmo. Não tem API de comentários minha, nem banco, nem segredo no código: o que vai pro navegador são dois identificadores públicos, o do repositório e o da categoria, que estão em [`giscus-config.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/posts/giscus-config.ts) pra quem quiser olhar.

O [utterances](https://utteranc.es) faz a mesma coisa em cima de Issues. Ficou de fora. Eu queria as conversas dos posts num espaço que não se misturasse com bug e tarefa do site, e Discussions dá isso. Pelo mesmo motivo criei uma categoria própria, `Blog`, do tipo Announcements: nela só a integração abre tópico novo, e quem chega comenta dentro do tópico do post.

Cada post acha a sua conversa pelo caminho da URL, em modo estrito, porque sem ele o Giscus faz uma busca aproximada e pode juntar dois posts de slug parecido na mesma discussão. Tem um preço. Se um slug mudar, a conversa antiga fica pra trás e só volta com uma migração feita na mão. Topei esse preço de propósito: prefiro perder o vínculo a misturar conversa de post errado.

Os comentários só aparecem nos posts atuais. O arquivo de 2015 a 2019 fica sem, e os comentários antigos do Disqus daquela época não foram importados (migrar aquelas conversas é outro trabalho).

## O carregador espera a seção chegar perto

A seção sai pronta do build, com a configuração em atributos `data-*`, e um script pequeno decide a hora de chamar o Giscus. Quem decide é um [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), a API do navegador que avisa quando um elemento entra (ou chega perto) da área visível, sem ficar escutando o scroll:

```ts
const observer = new view.IntersectionObserver(
  entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    load();
  },
  { rootMargin: '240px 0px' },
);
observer.observe(section);
```

O `rootMargin` de 240 px faz o carregamento começar um pouco antes da seção aparecer, pra caixa já estar lá quando você chegar. O `load()` monta o `<script src="https://giscus.app/client.js">` com os atributos da seção, põe na página e liga um timer de 8 segundos. Se o script falhar ou o Giscus não responder nesse tempo, aparece um aviso curto e o post continua lá, inteiro. O código todo está em [`giscus-loader.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/src/lib/posts/giscus-loader.ts).

O Giscus conversa com a página por `postMessage`, e o carregador ignora qualquer mensagem que não venha de `https://giscus.app`. É uma linha (`if (event.origin !== GISCUS_ORIGIN) return;`), e sem ela qualquer iframe da página poderia fingir ser o widget.

O site tem dois temas, Noir e Paper, e o widget precisa acompanhar a troca sem recarregar. Um `MutationObserver` olha o atributo `data-theme` do `<html>` e manda o tema novo pro iframe. Tem um segundo observando a própria seção, e é o detalhe menos óbvio: o iframe nasce depois do script, e se alguém troca o tema nesse intervalo, a troca se perde. Com o segundo observador, o tema vai junto quando o iframe aparece.

## O portão não deixa ninguém pendurar mais nada

Este site só aceita JavaScript de cliente por exceção com nome. Um teste de build reprova qualquer script fora da lista (o orçamento e o porquê estão no [post da paleta de comandos](/paleta-de-comandos-ctrl-k-no-meu-site)), e o carregador do Giscus virou a quinta exceção: marcado por `data-giscus-loader`, só nos posts atuais, com teto de 2048 bytes gzip. O widget de verdade, o que vem do giscus.app, não entra nessa conta porque nunca faz parte da página que o servidor entrega.

O trecho do [helper do portão](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/helpers/client-scripts.ts) que cobra isso:

```ts
if (script.includes(GISCUS_MARKER)) {
  const size = gzipSync(script).length;
  return size > GISCUS_BUDGET_BYTES
    ? [`${route}: giscus loader is ${size} B gzip, budget ${GISCUS_BUDGET_BYTES}`]
    : [];
}
```

E o [teste de build](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/design-system/no-client-js.build-test.ts) passou a aceitar, na pasta de assets, só arquivo que carregue uma das marcas conhecidas. Se amanhã eu quiser pôr reação, contador ou qualquer firula na seção, ou cabe nos 2048 bytes, ou é outra decisão escrita no `CLAUDE.md` do projeto, com data e motivo.

## A caixa que não carregava em localhost

Com a implementação pronta, abri um post em `localhost:4321` e a caixa de comentário não estava lá. Minha primeira suspeita foi o localhost, e a pergunta que eu fiz pro agente foi literalmente essa: por que a caixa não carrega em localhost?

O localhost não tinha nada a ver. O carregador não injeta o widget se faltar o id do repositório ou o da categoria, e a categoria `Blog` ainda não existia no GitHub. Criei a categoria, pedi o id, e na primeira busca ela estava no lugar errado. Com o id certo na configuração, a caixa continuou sem aparecer, agora com um erro diferente: o Giscus respondia 403, "giscus is not installed on this repository". Faltava instalar o app do Giscus no repositório. Depois disso, apareceu.

O engraçado (ou nem tanto) é que a spec já sabia. Na tabela de afirmações verificadas, a linha "o repositório é público, Discussions está habilitado e o app Giscus tem acesso" era a única marcada como suposição, e foi exatamente ela que travou. Os testes rodam com ids fixos e um Giscus de mentira, então nenhum deles tinha como saber que, do lado do GitHub, a categoria e o app ainda não existiam.

## Post sem comentário não é erro

Com a caixa aparecendo, veio o segundo problema. A mensagem de falha estava em todo post. O Giscus, quando a página ainda não tem discussão, manda pelo `postMessage` um erro `Discussion not found`, e o carregador tratava qualquer erro como falha. Como nenhum post tinha comentário ainda, o blog inteiro dizia que os comentários não tinham carregado.

A correção foi separar os dois casos. `Discussion not found` vira estado vazio (a caixa de comentário continua lá, funcionando), e só o resto vira falha:

```ts
if (giscus.error === GISCUS_EMPTY_DISCUSSION_ERROR) {
  clearTimer();
  showEmpty();
  return;
}
if (giscus.error) {
  fail();
  return;
}
```

O texto de falha eu já tinha trocado antes, logo na primeira olhada: era "Os comentários não carregaram. O texto do post continua disponível." e virou "Oops, erro ao carregar os comentários, volte aqui mais tarde.". O vazio, que eu pedi como "nenhum comentário foi enviado ainda, seja você o primeiro" ou algo assim, ficou "Nenhum comentário ainda. Seja o primeiro a escrever.", em itálico. E o título da seção deixou de ser "Comentários".

## O lugar da seção

A spec dizia que a seção vinha logo depois do bloco do autor, e a primeira versão até veio depois dele, só que fora do `<article>`, desalinhada do texto. Eu mesmo movi pra dentro, abaixo do `AuthorBox`, alinhada com o artigo. Hoje um teste confere a ordem: a seção fica dentro do `<article>`, depois do bloco do autor e antes dos posts relacionados.

## O que ficou

- Comentários pelo GitHub Discussions, numa categoria só do blog, uma conversa por caminho de post, sem backend e sem segredo no navegador.
- Nada do Giscus antes da seção chegar a 240 px da tela, e um teto de 2048 bytes gzip pro carregador, cobrado no build.
- A política de privacidade passou a dizer que, quando a seção chega perto, o navegador pede o script ao giscus.app, e que o comentário fica público no GitHub.

O código está no [repositório do site](https://github.com/nandomoreirame/nandomoreira.dev), e as conversas, nas [Discussions dele](https://github.com/nandomoreirame/nandomoreira.dev/discussions).

`observer.disconnect()`
