---
slug: o-falso-verde
title: "O falso verde: quando o portão diz PASS e nada rodou"
summary: "Em fluxo com agentes, o teste vermelho alguém investiga. O perigo é o verde que ninguém questiona: o portão que pulou tudo, o pipeline que mascarou o erro, o teste que leu o fonte em vez de fazer a requisição."
date: "2026-10-11"
art: chart
markers:
  - qualidade
  - agentes
draft: true
---

Em agosto, uma rodada de revisão de um projeto fechou com `result: PASS`. Lint verde, type-check verde, build verde. E sete testes vermelhos, quebrando contra uma rota que a própria rodada tinha removido. Quem pegou foi um `npm test` rodado por fora do fluxo.

O teste vermelho não me preocupa. Ele grita, alguém para e investiga. O que me custa caro é o verde que ninguém questiona, e com agente escrevendo código isso piora, porque o agente lê o `PASS` e segue em frente com toda a confiança do mundo.

## O portão que não rodava a suíte

O meu fluxo de implementação tem uma escada de portões, um script (`rpi-gates.sh`) que detecta a stack do projeto e roda as verificações certas. O primeiro degrau, o `tier1`, era o veredito de cada rodada. E até 19 de agosto ele era lint, type-check e build. A suíte de testes só existia no `tier2`, atrás do portão de cobertura.

Ou seja: **por quase dois meses, desde que a escada existia, um relatório de portão verde provava que o código compilava, e só isso.** Os sete testes vermelhos não eram azar. O portão nunca tinha sido desenhado para vê-los.

A correção foi pôr `npm test` dentro do `tier1`, e a lição foi pior que o bug: todo relatório de portão anterior àquela data deixou de valer como evidência de teste passando. (Oito dias depois achei o irmão dele: o `tier1` de TypeScript também não checava formatação, era a única stack sem esse portão.)

## Zero verificações, `result: PASS`

Em setembro o mesmo script me deu dois verdes falsos no mesmo dia. Ele aceita o diretório do projeto como argumento e imprime esse caminho no cabeçalho, bonitinho. Só que procurava o `eslint`, o `tsc` e o `package.json` a partir de onde eu tinha rodado o comando, e eu estava na raiz do workspace, com os projetos em subpastas.

Resultado: todos os portões saíram `WARN, skipped, tool not installed`, e o veredito final foi `result: PASS`. Um PASS com nenhuma verificação executada, lendo exatamente como aprovação.

**Um passo pulado não é um passo verde.** Hoje eu rodo o script de dentro do repositório, e nunca leio o `result` sem conferir que as linhas de cima são verificações que rodaram, não avisos de que algo foi pulado.

## O exit code que mente

Os outros verdes falsos vieram do shell, e esses pegam qualquer um.

O status de um pipeline é o status do último comando. Então `npm run build 2>&1 | tail -12` termina com o status do `tail`, que é sempre zero. A notificação do agente diz "exit code 0" com cara de prova, e o `tail` ainda pode cortar justamente a linha `Failed to compile`. Eu quase reportei um build verde a partir de doze linhas de um aviso de CSS que já existia.

O contrário também acontece. Terminei um script de verificação com `grep -c "Type error"` para contar erros. O build passou, o `grep` não achou nada, e `grep` sem resultado sai com 1. A notificação disse que falhou, e foi justamente o melhor resultado possível que produziu o sinal de falha.

Tem ainda o caso que parece sabotagem. O `npx prettier --write` imprimiu a linha de sucesso de sempre, saiu com zero e deixou o arquivo idêntico, byte por byte. O `./node_modules/.bin/prettier` no mesmo arquivo mudou o md5 na hora. E o nome nu `tsc`, aqui com o mise, resolve para um shim que morre sem versão configurada, enquanto o wrapper que resume a saída imprimia `TypeScript: No errors found` sem o compilador ter rodado.

## O teste que lê o fonte

Esse foi neste site. A página antiga de notas fazia `Astro.redirect('/x', 301)`, e o teste procurava a string `301` no fonte. Verde. Mas a página era pré-renderizada, e página pré-renderizada não manda status HTTP: o redirect virava um documento com `<meta http-equiv="refresh">` servido com 200. No navegador "funcionava", então ninguém via. Para crawler e cache não era redirect nenhum.

Aconteceu duas vezes no mesmo repositório. O teste de fonte não tinha como distinguir uma coisa da outra, por construção. O único portão que pega isso é HTTP de verdade, contra o build rodando:

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/notas/algum-post
```

## O que eu faço hoje

Nenhuma dessas falhas foi exótica. Todas tinham a mesma forma: um sinal de sucesso que não estava amarrado ao que eu queria provar. Então mudei o que conta como evidência.

- **A evidência é uma linha de marca, nunca o exit code.** Os scripts de verificação deste site terminam com `ALL LOCAL CHECKS PASSED`, `AEO ROUTES PASSED`, `STAGING DEPLOY PASSED`. Se a linha não está lá, não passou, diga o código de saída o que disser.
- **Quando preciso do status de um build, ele vai para um arquivo,** e eu capturo o `$?` do build, não do pipe: `npm run build > build.log 2>&1; echo "EXIT=$?"`.
- **Ferramenta pelo binário local** (`./node_modules/.bin/<tool>`), e escrita conferida pelo efeito: `md5sum` antes e depois, ou `git status`.
- **Portão novo precisa ficar vermelho antes de ser aceito.** Está escrito no `CLAUDE.md` deste repositório: um portão que nunca falhou não é portão.

O falso verde não some com disciplina, porque ele aparece justamente quando a disciplina está satisfeita. Some quando o verde só pode ser produzido pela coisa que eu queria verificar.

`exit 0`
