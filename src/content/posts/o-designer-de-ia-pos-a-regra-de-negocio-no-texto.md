---
slug: o-designer-de-ia-pos-a-regra-de-negocio-no-texto
title: "O designer de IA pôs a regra de negócio no texto: quem mandou foi o meu prompt"
summary: "O Google Stitch desenhou bem as telas de dois projetos meus e escreveu nelas o que eu só queria que ele respeitasse. Como eu separo agora a instrução pro designer do texto pro cliente."
date: "2026-10-28"
markers:
  - ia
  - design
  - agentes
extras:
  - "17 rotas auditadas contra o Stitch por screenshot"
  - "Google Stitch · Grok · Playwright · Vitest"
keyPoints:
  - "O Stitch decide layout e visual. Texto, número e dado vêm do produto, escritos no prompt ou na spec, nunca inventados por ele."
  - "Restrição de design sem destino declarado vira texto na tela: o bloco precisa dizer que não vira faixa, selo nem legenda."
  - "Número inventado pelo designer só sai de vez da página quando vira teste que consegue falhar."
snapshot:
  items:
    - label: "Designer"
      value: "Google Stitch"
    - label: "Prompts"
      value: "Grok + Claude Code"
    - label: "Porte"
      value: "skill stitch-fidelity"
    - label: "Diff visual"
      value: "Playwright · compare.py"
    - label: "Portão de números"
      value: "Vitest"
art: storefront
draft: true
---

A landing do contrateum.dev voltou do [Google Stitch](https://stitch.withgoogle.com) (o gerador de interfaces do Google, que desenha telas a partir de um prompt) com uma faixa assim: um selo `BLIND MATCH` e, do lado, "Critério cego: proibido foto, nome, iniciais, GitHub ou repositório." O resto do layout estava bonito. Aquela frase era a regra de privacidade do produto escrita pro visitante, com cara de placa de obra.

Minha primeira reação foi reclamar do Stitch: "ele colocou a regra de negócio implícita nos textos, Critério cego? não vamos nos comunicar tão agressivamente". Só que a frase da faixa é quase palavra por palavra a última linha do prompt que eu tinha mandado. Perguntar se o designer de IA é bom não leva a lugar nenhum (as telas eram boas). A pergunta que serve é o que do seu prompt vai parar na tela, porque se você usa um gerador desses pra tirar um produto do papel, tudo o que escreve pra ele pode aparecer pro cliente, inclusive o que era só pra ele respeitar. A minha posição, depois de dez dias e dois projetos com o Stitch: **o designer de IA decide o layout, e o texto e os dados são do produto.**

## Primeiro vieram os números

Em 18/10 eu pedi ao Claude Code um prompt pro Stitch desenhar a página de vendas do meu site, pensada pra quem não é técnico e não sabe direito o que quer: site institucional, loja virtual, blog, produto web, o meu fluxo de trabalho e as ferramentas do Firebase explicadas sem jargão. As telas vieram ótimas e cheias de número que ninguém mediu: `99.98% no ar`, `R$ 14.890 hoje`, `< 1.5s`, `99.99% Uptime`, `100 pontos de presença`, "Retorno em 24 horas úteis", até um `© 2025` no rodapé. As imagens dos projetos também eram inventadas.

Nada disso é meu. Eu não vendo serviço com valor fechado ("sempre vai depender da negociação e do que o cliente quer, o valor vai variar muito"), e prazo de retorno eu nunca prometi. A spec da página ganhou a regra: o texto vem do prompt aprovado e da tela, e todo número, métrica, preço, prazo e selo que o Stitch inventou fica de fora. As imagens viraram screenshots reais dos sites no ar.

Regra que mora só na spec some no terceiro ajuste de copy. Virou teste. O [`tests/helpers/invented-numbers.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/helpers/invented-numbers.ts) procura no texto visível das páginas de vendas porcentagem, valor em reais, métrica de tempo e "uptime". E o primeiro caso do [`tests/sales/copy.test.ts`](https://github.com/nandomoreirame/nandomoreira.dev/blob/main/tests/sales/copy.test.ts) prova que o portão consegue reprovar, usando os próprios números do Stitch:

```ts
it('can fail: it catches every figure the Stitch made up', () => {
  for (const sample of [
    '99.98% no ar',
    'R$ 14.890 hoje',
    '< 1.5s',
    'Retorno em até 24 horas úteis',
    '99.99% Uptime',
  ]) {
    expect(inventedNumbersIn(sample), sample).not.toEqual([]);
  }
});
```

Número de verdade entra por exceção com nome. Em 21/10 eu passei as condições de pagamento, e elas ficaram liberadas só como aquele texto exato: uma porcentagem em qualquer outro canto da página continua reprovando. A página está no ar em [contrate.nandomoreira.dev](https://contrate.nandomoreira.dev).

## Depois, quem escreveu a regra na tela fui eu

O contrateum.dev é um projeto meu que liga vaga e dev pela stack. No centro dele mora uma regra de privacidade, e ela é simples de dizer em termos gerais: parte do que identifica o dev só aparece pra empresa num momento certo do fluxo. Segura o produto. Não vende nada.

Em 23/10 eu pedi ao Grok um prompt pro Stitch refazer a landing em cima dessa regra. O prompt saiu caprichado (cores em hex, anatomia do cartão, dados fictícios, ordem das seções) e com três problemas que eu não vi antes de colar:

- o H1 era a própria regra: "A vaga encontra o perfil técnico. A identidade, não.";
- o subtítulo explicava quem vê o quê e quando, com "desbloqueio autorizado" no meio da frase;
- a última linha pedia: "Anote na própria tela o que é proibido no cartão: foto, nome, iniciais, GitHub, repositório."

O Stitch fez exatamente o que a última linha pedia. Pegou a lista, inventou o rótulo `BLIND MATCH` e o nome "Critério cego" e pôs a anotação na página como se fosse conteúdo. Quando mandei corrigir, o próprio Grok achou a causa no prompt: a instrução foi lida ao pé da letra, e o "desbloqueio autorizado" também tinha saído de lá. A parte do Stitch foi o rótulo em inglês e o tom de placa. O resto foi escrito por um agente a meu pedido, e quem aprovou e colou fui eu.

A correção no hero, lado a lado:

| | Primeiro prompt | Prompt corrigido |
|---|---|---|
| H1 | "A vaga encontra o perfil técnico. A identidade, não." | "A vaga encontra a stack que você domina." |
| Linha de confiança | "Grátis para devs · Identidade protegida · Match por vaga" | "Grátis para devs · Pela stack · Por vaga" |
| Última linha | "Anote na própria tela o que é proibido no cartão" | "Não anote a regra de privacidade em cima do layout." |

A resposta que eu dei quando a tela nova chegou foi "ficou ótimo, curti demais".

## Como eu escrevo o prompt agora

O modelo que desenha não diferencia "regra que você me deu" de "texto que você quer na página": tudo o que entra no prompt é material. A versão que funcionou separa o prompt em blocos, cada um com um destino dito por escrito.

1. Tom, em uma linha do que a pessoa ganha: "Fale do que a pessoa ganha: a vaga certa, a stack que bate, o que falta, o score daquele encaixe. Não ameace, não proíba, não anuncie regra."
2. **Restrições do designer, num bloco que se declara invisível.** É o bloco que faltava no primeiro prompt. A primeira frase do bloco diz pra onde ele não vai:

```text
Estas restrições são suas, na hora de desenhar. Não viram texto, faixa,
selo, badge, legenda nem anotação na tela:

- Não escreva "Critério cego", "Blind match", "proibido", "é proibido",
  "não pode", "identidade protegida" ...
```

3. A regra do produto aparece num lugar só, escolhido por mim. No contrateum ficou num dos passos de "Como funciona", e o prompt fecha a porta pro resto: "No resto da página, não repita."
4. Copy literal: cada texto visível vai escrito no prompt, embaixo de "Não reescreva estes textos." O Stitch fica com o resto.
5. Proibição de inventar: "Não invente preço em reais, porcentagem, depoimento, logo de cliente ou estatística." A lição da página de vendas, agora no prompt antes da tela, e não depois.
6. O que não existe não ganha lugar. Um campo que o cartão não mostra não vira um campo borrado: "Não borre esses campos e não desenhe o espaço deles." Um borrão também comunica a regra, só que em pixel.

Se você for testar isso no seu projeto, comece pelo item 2. É o que separa a regra que o designer respeita da regra que ele publica.

## Um documento só, colado em toda chamada

Na mesma noite eu pedi as telas do app, e aí apareceu outro ruído: cada ajuste virava um prompt novo, e o prompt novo corrigia demais. Pedi pra esconder uma parte do nome do dev antes da hora certa, e o prompt seguinte escondeu o nome inteiro, inicial inclusive. Tive que escrever de novo o que podia aparecer.

Quando sentei pra revisar as telas do Stitch contra o que estava planejado, antes de implementar, o diagnóstico foi meu e curto: "os prompts foram tentativas de fazer ajustes nas telas do Stitch, por isso elas se contradizem". Os quatro prompts anteriores viraram histórico, e um documento de ajustes passou a mandar. Ele tem a regra principal do produto no topo, uma seção por tela e um bloco de contexto que vai colado no começo de toda chamada ao Stitch: o produto em um parágrafo, as cores, a fonte, os cabeçalhos e os mesmos dados fictícios em todas as telas. Assim a tela de perfil e a de busca saem com a mesma versão da regra.

O inventário do projeto chegou a 35 telas registradas no Stitch. As versões mobile de onze delas eu decidi não gerar ("pode deixar que faremos durante o desenvolvimento"), e o mobile de cada rota saiu no código.

## Do Stitch pro código sem reinterpretar

O Stitch exporta HTML com classes do Tailwind. O agente que implementou as primeiras telas reescreveu tudo "inspirado" no desenho, e o resultado divergiu do jeito que eu descrevi na hora: o cadastro da empresa "tá grotesco", o login tinha o cabeçalho do app quando no Stitch era só o formulário centralizado, e o onboarding do dev estava esticado. Até um estado de exemplo do Stitch vazou pro código: o passo 2 do onboarding abria ativo ("acho que o Stitch colocou o step 2 ativo como exemplo").

Pedi pra procurar uma skill pública que fizesse o agente seguir o desenho e, se não tivesse uma que servisse, criar. Virou a `stitch-fidelity`, uma skill minha que roda no Claude Code, no Grok e no Codex. Ela parte de uma divisão que é a mesma do prompt: "Stitch decides layout and visuals; the project decides data and copy. Never import Stitch's invented data, tabs or policies."

O porte copia o markup do export e troca só o que é do projeto: cor e fonte pelos tokens, ícones, dados e texto, links e interação. Depois um script com o [Playwright](https://playwright.dev) (que abre a página num navegador de verdade) tira o screenshot da rota e compara com o PNG do Stitch:

```bash
uv run --with playwright==1.58.0 --with pillow python <skill>/scripts/compare.py \
  --url http://localhost:4321/<rota> --ref docs/design/stitch/screens/<tela>.png \
  --width 1280 --out .stitch-diff/<tela>
```

Saem dois números. O `layout_diff` mede o quanto as bordas dos dois screenshots não batem (0 é a mesma estrutura, 1 é outra página). O `content_x` diz onde o conteúdo começa e termina na horizontal, e é o que pega formulário esticado na hora. Uma terceira métrica, a diferença de pixels, foi pro lixo: no tema escuro toda tela dava entre 3 e 8% e não dizia nada.

A auditoria de 25/10 passou por 17 rotas. A primeira causa raiz era uma constante só: um container global de 1200px aplicado em todas as páginas, quando o Stitch define a largura tela a tela. No Stitch o cadastro da empresa ocupava de 384 a 862px; depois do porte, de 408 a 838px. O `layout_diff` daquela rota caiu de 0,90 pra 0,77. Não chega a zero, e parte do que sobra é texto e dado do produto, que eu quero diferentes mesmo.

## O que eu decidi

- O Stitch desenha. Texto, número e dado saem de mim, escritos no prompt ou na spec.
- Restrição de design vai num bloco que diz, na primeira frase, que não vira texto.
- A regra do produto aparece no lugar que eu escolho, uma vez.
- Número numa página de vendas passa por um teste que já provou que reprova.

`edit_screens()`
