---
slug: como-exibir-calendario-do-terminal
title: Como exibir o calendário rápido direto do terminal
summary: Uma dica rápida e super útil para visualizar o calendário completo de qualquer ano diretamente no terminal
date: "2018-01-17"
archived: true
cover:
  src: ../../assets/posts/2018/Untitled.png
  alt: "Terminal exibindo a saída do comando cal com o calendário de junho de 2024 e o dia 9 destacado."
markers:
  - terminal
  - dicas
  - shell
---

Você tá focado no código, apenas com algumas ferramentas abertas e não quer procurar o calendário na listagem de programas instalados no seu computador, ou ir até a barra de ferramentas e clicar na data pra poder ver o calendário completo do mês ou do ano?

Essa será uma dica bem curta e rápida, assim como o comando que você vai executar direto pelo terminal e que vai te ajudar a visualizar o calendário completo de qualquer ano.

Basta que você digite o comando `cal`, sim isso mesmo.

```bash
cal
```

O comando acima sem nenhum paramentro exibe o mês atual completo pra você.

![Comando `cal`direto do terminal](../../assets/posts/2018/Untitled.png)

Se você quiser escolher o Mês para ser exibido você precisa passar o número do mês (de 1 a 12) e o ano, assim:

```bash
cal 3 2017
```

Isso vai imprimir o mês excolhido.

![Comando `cal 3 2017` irá exibir o mês de março do ano de 2017](../../assets/posts/2018/Untitled 1.png)

Caso você queira apenas o ano

```bash
cal 2018
```

![O comando `cal 2018` irá imprimir o ano inteiro de 2018](../../assets/posts/2018/Untitled 2.png)

O comando `cal 2018` irá imprimir o ano inteiro de 2018

---

That’s it! [Aqui está um link para uma simples doc](https://ss64.com/bash/cal.html)

Espero que use e abuse!

Até mais 👋🏼
