---
slug: job-radar-radar-de-vagas-em-python-puro
title: "job-radar: um radar de vagas em Python puro que só me mostra o que passou nos meus cortes"
summary: "Sete fontes de vagas, filtros que descartam antes da nota, o currículo como lista de qualificações e um canal do Discord que recebe só o que sobrou. Sem nenhuma dependência para rodar, e com o código aberto."
date: "2026-10-11"
markers:
  - python
  - automação
  - open source
art: storefront
draft: true
---

Algumas vezes por dia, um canal do Discord recebe as vagas que sobreviveram aos meus cortes. Quem varre os sites é o [job-radar](https://github.com/nandomoreirame/job-radar): ele lê sete fontes, joga fora o que eu não me candidataria, dá nota de 0 a 100 para o resto e publica as melhores. Roda em Python 3.12 só com a biblioteca padrão, e em 8 de outubro o repositório ganhou licença MIT.

A ideia é parar de rolar lista de vaga. Ele não se candidata a nada por mim, e o README pede para ninguém usar o código para candidatura automática em massa. O trabalho dele termina quando a vaga chega no canal; dali para frente sou eu lendo a descrição.

## Primeiro descarta, depois ordena

O pipeline tem três scripts que conversam por arquivos JSON: `collect.py` busca, `triage.py` filtra e pontua, `notify.py` publica. A decisão que segura o resto é separar filtro de nota.

Os **filtros duros** respondem "eu me candidataria a isso?" e são binários: senioridade pelo título, modalidade, idade da vaga, empresa bloqueada, salário quando o anúncio declara, quantas qualificações minhas aparecem no texto. A **pontuação** só ordena o que passou. **Separar os dois evita que uma vaga ruim suba por acumular pontos em critérios secundários.** Vaga presencial não tem nota que a salve: ela é descartada antes de ser pontuada.

Dentro da nota, qualificação pesa mais que título. O comentário no `scoring.py` diz o motivo em quatro palavras: "título mente".

Os filtros começam desligados. Sem configuração no `.env`, nenhum deles descarta nada, porque prefiro um radar que deixa passar a um que esconde vaga por um valor que ninguém escolheu.

## O currículo é a lista de qualificações

O casamento de qualificações sai do meu currículo em markdown, da tabela `## Stack técnica`, com uma expansão de sinônimos por cima. Não existe uma lista de skills separada, e isso foi de propósito: lista paralela envelhece escondida, e o currículo eu já mantenho.

## Os filtros aprenderam com anúncio de verdade

Cada regex do `filters.py` tem um comentário explicando o anúncio que a obrigou a existir. Alguns deles:

- `SR`, `JR` e `PL` aparecem sem ponto na maioria dos anúncios, então o ponto é opcional. Só que `PL` em "PL/SQL" é a linguagem da Oracle, e não "pleno".
- `java` não pode casar dentro de "javascript", e tem teste travando isso. Uma menção a Java como diferencial numa vaga de Python também não reprova: linguagem conta por peso, não por presença.
- "Banco de talentos" é cadastro de currículo, e não vaga. Não tem posição aberta, mas ocupava espaço no canal como se tivesse.
- A função (QA, por exemplo) só é lida no título. Citar "o time de QA" na descrição é rotina em vaga de desenvolvimento.
- Vaga afirmativa, reservada a um grupo do qual eu não faço parte, sai do canal para não ocupar o lugar de quem a vaga busca. A primeira versão procurava os termos soltos na frase e leu como restrição o anúncio de um banco que dizia "vagas sinalizadas como exclusivas ou não para pessoas com deficiência", que é um convite. Hoje o filtro exige a construção completa ("vaga exclusiva para X"), e quando a fonte declara o dado num campo estruturado, o campo vence o texto.

Tudo que é descartado vai para `data/discarded.tsv` com título, empresa, URL e motivo. É de lá que eu audito regex agressivo.

## A mesma vaga, três vezes

A deduplicação usa três chaves, da mais barata para a mais cara:

1. Fingerprint de empresa mais título normalizados (sem acento, sem sufixo jurídico, sem a cidade enfiada no título).
2. URL canônica, sem `www.` e sem parâmetro de rastreio, para a mesma vaga com `?utm_source=` não voltar.
3. SimHash da descrição, com distância de Hamming de até 5 bits numa janela de 90 dias. Esse pega a consultoria republicando a vaga do cliente com outro nome de empresa.

O SimHash é um port do `fingerprint-core.mjs` do [career-ops](https://github.com/career-ops-hq/career-ops), também MIT, com o aviso original mantido no arquivo.

## O que quebrou no caminho

Na Gupy, a API antiga, `employability-portal.gupy.io/api/v1/jobs`, passou a responder 404. A busca agora é renderizada no servidor em `portal.gupy.io/job-search`, e o HTML traz um `<script id="__NEXT_DATA__">` com a lista de vagas dentro. O formato de cada item era o mesmo que o parser já lia, então a correção foi trocar a busca, e não reescrever o conector.

Havia também um problema mais silencioso: cada conector engolia erro de rede e devolvia uma lista vazia, e o aviso de "nada encontrado" não tinha como saber se a fonte estava fora ou se simplesmente não havia vaga. Ganhou um `health.py` que conta, por fonte, requisições, erros, vagas degradadas (empresa vazia, HTML no título, URL inválida) e respostas que vieram com status 200 mas sem o payload esperado, que é o sinal de que o contrato mudou. Quando a varredura não acha nada, o canal recebe o funil da rodada. **Silêncio passou a significar "não rodou", nunca "rodou e não achou"**, que são problemas diferentes e indistinguíveis sem isso.

No Discord foram dois. O Cloudflare na frente do webhook responde 403 ao User-Agent padrão do urllib (`Python-urllib/3.x`), então um User-Agent identificável é obrigatório. E sem `wait=true` na URL o Discord responde vazio, a mensagem fica órfã e o webhook não consegue apagá-la depois, porque só apaga o que postou se tiver guardado o ID.

## Fixture gravada, nunca imaginada

Os testes de conector rodam contra respostas reais gravadas em `tests/fixtures/`: o HTML da busca da Gupy, o JSON dos boards do Greenhouse, do Lever e do Ashby, a listagem da Sólides. A suíte tem 328 funções de teste, e a regra que mais vale entre elas está no README: uma fixture escrita a partir do formato que você imagina que a API devolve produz suíte verde com produção quebrada.

## Como testar

Precisa de Python 3.12 ou mais novo, um webhook do Discord e o seu currículo em markdown com uma seção `## Stack técnica`.

```bash
git clone https://github.com/nandomoreirame/job-radar && cd job-radar
cp .env.example .env     # webhook e os seus critérios
mkdir -p profile && cp /caminho/do/seu/curriculo.md profile/profile.md
./run.sh
```

O `run.sh` roda as três etapas. Para ver o que seria publicado sem postar nada, rode `notify.py` com `--dry-run`. Para rodar sozinho, um cron ou um timer do systemd apontando para o `run.sh` resolvem; com timer de usuário, lembre do `loginctl enable-linger $USER`, senão ele só roda com sessão aberta.

As fontes que vêm configuradas são brasileiras ou têm filtro de país: Gupy, os repositórios de vagas no GitHub (frontendbr/vagas, backend-br/vagas e afins), Programathor, Sólides e os boards públicos de Greenhouse, Lever e Ashby, um slug por empresa. Fonte nova precisa respeitar o `robots.txt`, se identificar por User-Agent e esperar entre requisições; o cliente HTTP compartilhado já faz as três coisas.

A regra do repositório que não muda é a do começo: nenhuma dependência para rodar. `pytest`, `ruff` e `mypy` existem só no ambiente de desenvolvimento, e o que vai para o timer é a biblioteca padrão.

`exit()`
