---
slug: como-converter-todos-arquivos-scss-de-um-diretorio-para-extensao-sass
title: Como converter todos arquivos .scss de um diretório para extensão .sass
summary: "Iremos usar o comando sass-convert do próprio SASS para realizar a conversão dos arquivos, mas já sabemos que ele converte apenas um único arquivo"
date: "2016-07-05"
markers:
  - scss
  - sass
  - css
archived: true
cover:
  src: ../../assets/posts/2015/xx-conhecendo-o-pre-processador-sass.jpg
  alt: "Logotipo do Sass em letra cursiva branca sobre gradiente azul e rosa, com a palavra Architecture abaixo."
---

Iremos usar o comando `sass-convert` do próprio SASS para realizar a conversão dos arquivos, mas já sabemos que ele converte apenas um único arquivo, então vamos usar o terminal e com um simples loop iremos converter todos os arquivos de um diretório (ou vários diretórios) de uma só vez.

## Em sistemas Unix (Mac e Linux)

Abra o terminal e execute o seguinte comando.

```bash
for file in path/to/scss/**/*.scss; do sass-convert $file ${file%scss}sass && rm $file; done
```

## No Windows

```bash
for /r path\to\scss %I in (*) do sass-convert "%I" "%~dpnI.sass"
del /f /s /q path\to\scss\*.scss
```

Não esqueça de trocar `path/to/scss/` para o caminho onde estão os seus arquivos sass.

Eu não testei no Linux nem no Windows então se você executou os comandos e algo não deu certo comenta ai e vamos resolver juntos.

---

Espero ter ajudado, Abraço!

😎
