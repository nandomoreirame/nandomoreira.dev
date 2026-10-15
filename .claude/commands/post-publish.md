---
name: post-publish
description: "Publica um post do blog e o leva para produção: tira o draft e grava o publishedAt de um rascunho (por slug ou título), commita o que falta pelo /git commit, faz git push origin main, espera o rollout servir o post e copia para o clipboard o post do LinkedIn que o divulga (o salvo em ~/dev/career/linkedin/ ou um novo, pela skill linkedin-post-writer)."
argument-hint: "[slug ou título do post]"
disable-model-invocation: true
---

# /post-publish: rascunho publicado em produção, post do LinkedIn no clipboard

Rodar o comando é o consentimento para o commit e para o `git push origin main`, e para
nada além disso: sem pull, sem push forçado, sem deploy manual, sem
`scripts/deploy-staging.sh`. Em qualquer falha, relate e pare.

## 1. Qual post

Os candidatos são os rascunhos (`/usr/bin/grep -l '^draft: true' src/content/posts/*.md`)
e os posts já publicados que ainda não chegaram em `origin/main` (sujos em
`git status --porcelain -- src/content/posts` ou em
`git diff --name-only origin/main..HEAD -- src/content/posts`).

- **Com `$ARGUMENTS`:** compare com o `slug` e o `title` do frontmatter de cada candidato,
  sem diferenciar maiúscula nem acento. Slug exato vence; senão, o título que contém todas
  as palavras do argumento. Um só: siga. Nenhum ou mais de um: liste os candidatos (título
  e slug) e pare.
- **Sem argumento:** liste os candidatos (título, slug, rascunho ou publicado) e pare.

## 2. Publicar o rascunho

Só se o post escolhido tem `draft: true`; já publicado, pule para o passo 3.

1. **Imagem:** o post precisa de `cover` ou de `art` (seção 7 da skill
   `blog-post-writer`). Sem nenhum dos dois, ou com um `art` que outro post publicado sem
   capa já usa (`/usr/bin/grep -h '^art:' src/content/posts/*.md | sort`), pare e diga.
2. **Frontmatter:** remova a linha `draft: true`. Pegue o instante com
   `date +%Y-%m-%dT%H:%M:%S%:z`, grave `publishedAt` com ele (logo depois de `date`) e troque
   a `date` pelo dia desse instante: o schema exige que os dois caiam no mesmo dia, e o post
   sai como o mais recente.
3. **Ordem dos posts:** `tests/content/posts-access.test.ts` fixa os três primeiros posts
   reais. Ponha o slug publicado em `first`, desloque os outros dois (`second` recebe o
   antigo `first`, `third` o antigo `second`) e tire o comentário de empate que não valer
   mais.
4. **Testes:** `npx vitest run tests/content tests/posts`. Se a suíte não enxergar a mudança
   (o post ainda conta como rascunho), o store de conteúdo é o do dev server: rode
   `npx astro dev stop`, rode os testes de novo e suba `npm run dev` depois. Vermelho por
   outro motivo: pare e mostre a falha.

## 3. Commit, se houver o que commitar

Com a árvore suja, invoque o `/git commit` (skill `git`, subcomando `commit`), que aplica o
`git-commit` e o gitmoji do projeto. O escopo é o post e o que vai junto com ele: o `.md`,
as imagens que ele referencia em `src/assets/posts/` e o teste de ordem. Outros arquivos
sujos ficam de fora; cite-os no relatório. A mensagem de publicação segue as anteriores:
`📝 docs(posts): publish the <assunto> post`. Se o passo 2 não rodou, rode antes os testes
de conteúdo; vermelho, pare. Nada do post a commitar: siga.

## 4. Push

`git push origin main`. Rejeitado por divergência: diga e pare (o `/git pull` é dele).
Nada a enviar (`origin/main` já tem o `HEAD`): siga para o passo 5 do mesmo jeito.

## 5. Espere o rollout antes de abrir o link

**Não faça `curl` na URL pública antes de o build servir o post.** O CDN do Firebase
Hosting guarda o 404 do rascunho por até 10 minutos, e foi isso que aconteceu com o post
do analytics em 2026-10-14.

1. Ache o build do commit: `GET $BASE/builds` (receita no `CLAUDE.md`, seção Deploy), o
   mais recente com `source.codebase.hash` igual a `git rev-parse HEAD`.
2. Espere `state: READY` e `traffic.current.splits[].build` apontando para ele, com o
   Monitor ou um laço com `until`, nunca `sleep` solto. Leva cerca de 3 minutos; passou de
   10, relate e pare.
3. Só então: `curl -s -o /dev/null -w '%{http_code}' https://nandomoreira.dev/<slug>`
   precisa dar 200.

## 6. Post do LinkedIn no clipboard

Procure `~/dev/career/linkedin/*-<slug>.md`.

- **Existe:** releia o post publicado, ajuste o texto do LinkedIn ao que mudou desde que
  foi escrito (título, fatos, trechos citados), troque "pendente" por "200 em
  AAAA-MM-DD" na linha do link e salve. Copie o bloco do post para o clipboard como a
  seção 4 da skill `linkedin-post-writer` manda (`wl-copy -n` de um arquivo, conferindo o
  `md5sum`).
- **Não existe:** invoque a skill `linkedin-post-writer` com o slug. Ela escreve, salva o
  arquivo e copia.

## 7. Relatório

O que foi publicado (título, slug, `publishedAt`), o commit (ou "nada a commitar"), o push, o build servindo, o 200 do link, o caminho do
arquivo do LinkedIn e o post em bloco de código, dizendo que está no clipboard.
