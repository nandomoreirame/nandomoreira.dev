---
slug: o-falso-verde
title: "O falso verde: quando o portão diz PASS e nada rodou"
summary: "Em fluxo com agentes, o erro perigoso não é o teste vermelho, que alguém investiga. É o verde que ninguém questiona."
date: "2026-10-10"
markers:
  - qualidade
  - agentes
draft: true
---

Rascunho. Roteiro:

- O portão que rodava lint, type-check e build, mas não a suíte: `PASS` com sete testes vermelhos.
- Rodando da pasta errada: todas as ferramentas puladas com aviso, zero verificações, `result: PASS`.
- `cmd | tail -12` e o exit code do último estágio do pipeline.
- `prettier --write` que imprime sucesso e não grava.
- A regra: um passo pulado não é um passo verde; evidência é a linha de marca, nunca o exit code.
