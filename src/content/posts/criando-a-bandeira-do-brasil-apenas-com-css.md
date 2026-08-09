---
slug: criando-a-bandeira-do-brasil-apenas-com-css
title: Criando a bandeira do Brasil 🇧🇷 apenas com CSS
summary: Hoje eu vou demonstrar nesse artigo como eu criei a bandeira do Brasil usando apenas com CSS
date: "2016-01-23"
markers:
  - css
  - css3
  - html
archived: true
cover:
  src: ../../assets/posts/2016/bandeira-do-brasil-com-css.png
  alt: Criando a bandeira do Brasil 🇧🇷 apenas com CSS
---

Olá terráqueo, como vai?

Recentemente eu contribui com um projeto chamado [Flags-in-CSS](https://github.com/pattle/Flags-in-CSS) enviando a bandeira do Brasil [pra coleção](http://pattle.github.io/Flags-in-CSS/).

Eu vou demonstrar nesse artigo como eu criei ela usando apenas com <abbr title="Cascading Style Sheets">CSS</abbr>

## O Retângulo verde

Isso é muito simples. Primeiro criei uma `div` com a classe `.brasil-flag`, por enquanto vazia.

```html
<div class="brasil-flag">
  <!-- empty -->
</div>
```

E no CSS eu apliquei o seguinte código:

```css
.brasil-flag {
  position: relative;
  background-color: #16b83e;
  width: 250px;
  height: 150px;
}
```

Com isso nós temos o **retângulo verde** da bandeira.

## O Losango amarelo

Logo dentro da div nós criaremos mais uma `div` com a classe `.losangue`, mais ou menos assim:

```html
<div class="brasil-flag">
  <div class="losangue"></div>
</div>
```

E no CSS eu apliquei o seguinte código:

```css
.brasil-flag .losangue:before,
.brasil-flag .losangue:after {
  position: absolute;
}

.brasil-flag .losangue {
  width: 100%;
  height: 100%;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.brasil-flag .losangue:before,
.brasil-flag .losangue:after {
  content: '';
  width: 0;
  height: 0;
  left: 20px;
  right: 20px;
}

.brasil-flag .losangue:before {
  border-left: 105px solid transparent;
  border-right: 105px solid transparent;
  border-bottom: 65px solid #ffe11f;
  top: 10px;
}

.brasil-flag .losangue:after {
  border-left: 105px solid transparent;
  border-right: 105px solid transparent;
  border-top: 65px solid #ffe11f;
  bottom: 10px;
}
```

Já conseguimos ver o **losango amarelo** da bandeira.

## O Círculo azul

Logo após vamos adicionar mais uma `div` com a classe `.circle`, mais ou menos assim:

```html
<div class="brasil-flag">
  <div class="losangue"></div>
  <div class="circle"></div>
</div>
```

```css
.brasil-flag .circle {
  overflow: hidden;
  z-index: 2;
  display: block;
  background-color: #1651b8;
  height: 80px;
  width: 80px;
  margin-top: -40px;
  margin-left: -40px;

  top: 50%;
  left: 50%;
  position: absolute;
  border-radius: 50%;
  -webkit-border-radius: 50%;
  -moz-border-radius: 50%;
}
```

Isso já nos trás o **círculo azul** da bandeira.

## A faixa branca

Ainda utilizando a classe `.circle` vamos criar a faixa branca da bandeira.

```css
.brasil-flag .circle,
.brasil-flag .circle:before,
.brasil-flag .circle:after {
  top: 50%;
  left: 50%;
  position: absolute;
  border-radius: 50%;
  -webkit-border-radius: 50%;
  -moz-border-radius: 50%;
}

.brasil-flag .circle:before,
.brasil-flag .circle:after {
  width: 90px;
  height: 40px;
  -ms-transform: rotate(14deg);
  -webkit-transform: rotate(14deg);
  transform: rotate(14deg);
}

.brasil-flag .circle:before {
  z-index: 3;
  content: '';
  margin-top: -20px;
  margin-left: -45px;
  background: #fff;
}

.brasil-flag .circle:after {
  z-index: 4;
  content: '';
  margin-top: -10px;
  margin-left: -48px;
  background-color: #1651b8;
}
```

## O resultado final

[![Bandeira do Brasil 🇧🇷 apenas com CSS](https://codepen.io/oknoblich/pen/zrRRwx/image/large.png)](https://codepen.io/nandomoreirame/pen/zrRRwx)

Ainda falta fazer as estrelas que, ao aceitar o meu [_pull request_](https://github.com/pattle/Flags-in-CSS/pull/5), o [Christopher Pattle](https://github.com/pattle) perguntou se não seria legal coloca-las, bem... Eu estou pensando ainda se coloco. :D

/end
