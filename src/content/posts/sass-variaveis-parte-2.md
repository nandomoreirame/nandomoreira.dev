---
slug: sass-variaveis-parte-2
title: "#2 - Conhecendo o pré-processador SASS | Variáveis"
summary: Se você está começando agora no mundo do desenvolvimento você precisa ter uma base de como funciona variáveis.
date: "2015-09-02"
markers:
  - sass
  - css
  - pre-processador
archived: true
cover:
  src: ../../assets/posts/2015/conhecendo-o-pre-processador-sass.jpg
  alt: "#2 - Conhecendo o pré-processador SASS | Variáveis"
---

Vamos continuar nossa série **"Conhecendo o pré-processador SASS"**, mas agora falando de **Variáveis**.

> Se você quer saber o que é o SASS e como instalar, por favor leia a parte 1 desse artigo <a href="/conhecendo-o-pre-processador-sass-parte-1/">aqui</a>

## O que são Variáveis?

Se você está começando agora no mundo do desenvolvimento você precisa ter uma base de como funciona variáveis.

O conceito de variáveis no SASS é bem parecido com este na programação em geral.

De acordo com o Google:

> Variável é a característica de interesse que é medida em cada elemento da amostra ou população. Como o nome diz, seus valores variam de elemento para elemento. As variáveis podem ter valores numéricos ou não numéricos.
> <small>Google.com (<a href="https://goo.gl/dlslou">https://goo.gl/dlslou</a>)</small>

Basicamente você cria um espaço na memória, da um nome pra ele e armazena um valor para ser usado em algum lugar ou ser manipulado de alguma forma.. é isso.

---

Vamos testar o seguinte código:

```scss
$cor: #f00;

body {
  bakground-color: $cor;
}
```

Se você rodar `sass --watch style.scss:style.css` e visualizar seu HTML no navegador, você verá o fundo vermelho.

Isso aconteceu porque o a cor que estáva armazenada na _variável_ `$cor` passou a ser o fundo da nossa tag `<body>`

Fácil não?!

---

## Tipos de variáveis no SASS

Pra quem "manja dos parauês" de programação sabe que existem tipos de variáveis.

Se levarmos em consideração que **SASS** também "pode" ser considerada uma linguagem de programação ela teria a [Tipagem fraca](https://pt.wikipedia.org/wiki/Tipo_de_dado), pois a variável pode ter o seu valor automaticamente alterado para outro tipo para possibilitar uma operação.

Uma variável pode ser do tipo inteiro e no meio do caminho se tornar uma string, e vise-versa.

Mas no SASS a coisa é um pouco diferente. Temos tipos próprios de CSS, que não precisam de "aspas" como string.

```scss
$mutable-var: '->'; // variavel do tipo string
$mutable-var: 200; // variavel do tipo inteiro
$mutable-var: 2.2; // variavel do tipo double
$mutable-var: #fff; // variavel do tipo hexadecimal (para cores)
$mutable-var: 150px; // variavel do tipo medida em pixel
$mutable-var: 1em; // variavel do tipo Unidade relativa
$mutable-var: 100%; // variavel do tipo porcentagem

body {
  width: $mutable-var;
}
```

Se você processar o código acima verá que o valor de `width` é de `100%`, o SASS pegou automaticamente o valor setado na ultima linha.

```css
body {
  width: 100%;
}
```

**Pra falar a verdade o SASS aceita qualquer valor que não vai gerar erro nenhum** 😊

---

## Conclusão

Variável é algo muito útil no desenvolvimento com SASS, eu particularmente uso bastante esse recurso.

Eu sempre crio um arquivo chamado **[variables.scss](https://github.com/nandomoreirame/nandomoreira-jekyll-theme/blob/master/_assets/sass/settings/_variables.scss)** para agrupar as variáveis globais do meu projeto.

Se você for usar um determinado valor em vários lugares e/ou arquivos não exite em momento algum, crie uma variável e armazene esse valor, você vai me agradecer mais tarde.

Abraço!

---

1. [Conhecendo o pré-processador SASS - Instalação](/conhecendo-o-pre-processador-sass-parte-1)
2. Conhecendo o pré-processador SASS - Variáveis
3. [Conhecendo o pré processador SASS - Mixins](/sass-parte-3-mixins)
4. [Conhecendo o pré processador SASS - Funções](/sass-parte-4-funcoes)
5. [Conhecendo o pré-processador SASS - Placeholder](/sass-parte-5-placeholder)
