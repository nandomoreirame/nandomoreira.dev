---
slug: meus-scripts-de-gitflow-de-31-linhas-a-uma-skill
title: "Meus scripts de Gitflow: de 31 linhas em Bash a uma skill do Claude Code"
summary: "Lá por 2019 eu escrevi uns scripts pra não digitar o mesmo fluxo de git toda vez que abria uma branch. Eles cresceram, foram reescritos com IA e hoje moram numa skill. A ideia continua a mesma."
date: "2026-10-26"
publishedAt: "2026-10-26T13:05:54-03:00"
markers:
  - git
  - shell
  - produtividade
art: gitflow
snapshot:
  items:
    - label: "Primeira versão"
      value: "feature.sh, 31 linhas"
    - label: "Dependência"
      value: "git-flow (gitflow-avh)"
    - label: "Biblioteca"
      value: "lib/gitflow.sh"
    - label: "Release"
      value: "git-release, 867 linhas"
    - label: "Changelog"
      value: "Conventional Commits"
    - label: "Hoje"
      value: "skill /git + release.sh"
---

`feature DEV-123`. Era isso que eu digitava pra começar qualquer tarefa: um comando, o ID do card, e o script fazia o resto. Guardava o que eu tinha de alteração, atualizava a branch de desenvolvimento, criava a branch da feature, publicava no remoto e devolvia as minhas alterações. Eram 31 linhas de Bash que eu escrevi lá por 2019, 2020, muito antes de ter IA no terminal.

Não vou discutir se o Gitflow ainda faz sentido em 2026 (tem gente que ama, tem gente que odeia, como quase tudo no git). O ponto aqui é outro: se você repete a mesma sequência de cinco ou seis comandos toda vez que abre uma branch, essa sequência é um script esperando pra ser escrito. **Mesmo que você seja o único no projeto.** Os meus sempre foram pessoais, ninguém mais usava, e mesmo assim foram uma baita ideia (modéstia à parte).

## O Gitflow em uma frase, e por que ele cansa

O Gitflow é um modelo de branches: cada tarefa nasce numa branch `feature/` a partir da branch de desenvolvimento (`develop`, ou `staging` em alguns projetos), volta pra ela no fim, e de tempos em tempos uma branch `release/` leva tudo pra `main` (ou `master`) com uma tag de versão. Correções urgentes saem da produção numa `hotfix/` e voltam pros dois lados.

O modelo é simples de explicar. O cansativo é executar: atualizar as duas branches, criar a nova a partir da certa, publicar, depois fazer o merge sem fast-forward, criar a tag, mandar tudo pro remoto, apagar a branch local e a remota. Esquecer um passo é fácil, e o passo esquecido costuma ser a tag.

## A primeira versão cabia numa tela

Antes de usar IA no terminal, eu resolvia esse tipo de coisa com shell script. O de feature era assim, inteiro:

```bash
#!/bin/bash

if [ -z "$1" ]; then
    echo "❌ Erro: o ID do Jira é obrigatório"
    echo "Uso: ./scripts/git-flow/feature.sh <id_do_jira>"
    echo "Exemplo: ./scripts/git-flow/feature.sh DEV-123"
    exit 1
fi

_JIRA_ID="$1"

git stash
git fetch --all
git checkout staging
git pull origin staging

git flow feature start $_JIRA_ID
git push origin feature/$_JIRA_ID
git stash pop
```

(Tirei só os `echo` de cabeçalho que ele imprimia entre um passo e outro.)

Repara no caminho de uso: `./scripts/git-flow/feature.sh`. Ele nasceu dentro de uma pasta `scripts/` de projeto. Os de `bugfix` e `hotfix` eram o mesmo arquivo com outro prefixo. Ele dependia do [git-flow](https://github.com/petervanderdoes/gitflow-avh), a extensão do git que dá os comandos `git flow feature start` e companhia.

O de release era o que mais valia, com 77 linhas. Ele atualizava a `master` e a `staging`, abria a release, subia a versão do `package.json` com `jq`, commitava, publicava e finalizava:

```bash
git flow release start $NEW_VERSION staging

jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
git add package.json && git commit -m "chore: prepare release v$NEW_VERSION" --no-verify

git flow release publish $NEW_VERSION
git flow release finish $NEW_VERSION
```

E terminava imprimindo os dois comandos de push, pra eu rodar na mão:

```text
git push origin staging
git push origin master --tags
```

Nada de esperto ali. Era a sequência que eu fazia todo dia, com os comentários em português explicando o que o `git flow release finish` fazia por baixo (mescla na `master`, cria a tag, mescla de volta na `develop`, apaga a branch). Pra quem tá começando, esse é o melhor jeito de escrever o primeiro script: copie do seu histórico de terminal a sequência que você já faz e cole num arquivo.

## Depois que vieram pro dotfiles, cresceram

Quando os scripts foram pro meu dotfiles, viraram comandos no PATH (`git-feature`, `git-bugfix`, `git-hotfix`, `git-release`) e foram reescritos com IA. Três mudanças valem contar.

A primeira foi largar a extensão git-flow. Hoje tudo é git puro, e as partes comuns aos três tipos de branch moram numa biblioteca só, `lib/gitflow.sh`. Ela traz proteções que a versão de 31 linhas não tinha. Uma lista de branches que nunca podem ser "finalizadas":

```bash
# Protected branches that cannot be used for finish
PROTECTED_BRANCHES=("main" "master" "staging" "develop" "dev")
```

E o stash ficou condicional. O original rodava `git stash` sempre; se não houvesse nada pra guardar, o `git stash pop` do fim podia reaplicar uma alteração antiga que estivesse na pilha. Agora ele só guarda se houver alteração de fato:

```bash
_auto_stash() {
    if ! git diff-index --quiet HEAD --; then
        git stash push -m "auto-stash before git flow operation"
        return 0
    fi
    return 1
}
```

A segunda foi a detecção. O script descobre sozinho se a produção é `main` ou `master` e se o desenvolvimento é `staging`, `develop` ou `dev`, então o mesmo comando serve em projeto novo e em projeto antigo. O `finish` também detecta a release pela branch atual, sem precisar repetir a versão.

A terceira foi o changelog. O `git-release` lê os commits desde a última tag, entende o formato do [Conventional Commits](https://www.conventionalcommits.org/) (`feat(scope): descrição`, com ou sem emoji na frente) e separa em adicionado, corrigido, modificado e removido:

```bash
if [[ "$clean_msg" =~ ^(feat|fix|refactor|perf|docs|test|chore|sec|security|remove|removed|deprecate|deprecated)(\(.+\))?:[[:space:]]*(.+)$ ]]; then
```

Ele também atualiza todo `package.json` que o git rastreia (não só o da raiz) e valida a versão no formato semântico antes de começar. A brincadeira foi de 77 pra 867 linhas, boa parte delas validação e mensagem de ajuda.

## Hoje quem roda é o Claude

Por um tempo, o Claude Code usava esses mesmos scripts: eu pedia uma release e ele chamava o `git-release`. Hoje eu não uso mais os comandos direto. Tudo foi pra uma skill, o `/git`, e a skill de Gitflow ganhou o seu próprio `release.sh`.

O que a skill acrescenta é a parte que pedia julgamento. Ela descobre o modelo de branch do repositório (se existe `develop`, é Gitflow; se não, é trunk-based), calcula a próxima versão a partir da última tag (patch por padrão, `0.1.0` se for a primeira) e gera o changelog com IA, em vez da regex. O resto, criar a branch, fazer o merge, a tag e o push, ainda é script.

A ideia de 2019 é a mesma: um comando pra um fluxo inteiro, sem eu ter que lembrar a ordem dos passos. O que mudou foi quem digita o comando.

## Se você quiser fazer o seu

1. Abra o histórico do terminal depois de uma semana de trabalho e procure a sequência de git que se repete.
2. Cole num arquivo, troque o nome da branch por `$1` e valide o argumento logo no começo.
3. Ponha a pasta no PATH, pra chamar de qualquer projeto.
4. Só depois disso pense em detecção de branch, changelog e proteções. A versão de 31 linhas resolveu meu problema por anos.

Esse foi só um dos scripts que eu carrego há anos. Juntei os outros, de áudio, backup, janelas e instalação, num [compilado dos scripts do meu dotfiles](/scripts-que-automatizam-meu-linux), pra servir de inspiração.

`git push origin master --tags`
