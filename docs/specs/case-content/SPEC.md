# Spec: Conteúdo dos cases

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 3, `case-content`
> **PRD:** F1 (home) e F2 (catálogo) já renderizam; esta feature produz o que elas mostram
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

O site está no ar com a estrutura das sprints 2 a 4 e **um único case**. O
`MVP-SCOPE.md` pede oito, dois por bloco nos quatro blocos, e classifica "começar
pelo hero bonito" como a armadilha do projeto. Hoje o projeto está exatamente
dentro dela: a casca existe, a evidência não.

O inventário levantado mostra por que isso é mais grave do que parece. O acervo
com tração pública **não é** o acervo que sustenta o posicionamento:

| Métrica | Valor |
|---|---|
| Repositórios públicos próprios | 99 |
| Estrelas totais | 964 |
| Em 8 temas Jekyll e Nuxt de 2017-2021 | **764 (79%)** |
| Nos outros 91 repositórios | 200 |

Os quatro maiores fora dos temas são `motivaai` (22, 2019), `vovo-juju-ipsum`
(21, 2019), `lorem-gemidao-do-zap-ipsum` (19, 2017) e `app-whatsapp-url`
(16, 2018). O primeiro item que sustenta o posicionamento atual é `forja`
(11, 2026), quinto colocado.

Isso é o RISK-004 do BRIEF confirmado com número: exibir "964 estrelas no
GitHub" seria verdade aritmética e mentira de posicionamento. O catálogo precisa
carregar a evidência que o número não carrega.

## Goals

- Publicar sete cases novos, fechando os oito do `MVP-SCOPE.md`.
- Cada case com problema, decisão técnica e resultado, nessa ordem, derivados do
  projeto real e não de release notes.
- Nenhum resultado inflado: contagem de estrela baixa dita como é, uso próprio
  dito como uso próprio.
- Destravar o bloco `professional`, que hoje é impossível de preencher pelo schema.

## Context

O schema de `projects` já existe e é o portão. Todo case declara `slug`, `title`,
`block`, `summary`, `problem`, `decisions`, `outcome`, `tech`, `featured`,
`confidential` e `date`, e o build falha com qualquer campo ausente ou inválido.

Duas regras do schema colidem no bloco `professional`:

1. `repoUrl` e `liveUrl` não podem ser ambos nulos, porque "um case sem link não
   tem evidência verificável".
2. Um case `confidential: true` não pode identificar o cliente em `slug`,
   `liveUrl` nem `repoUrl`.

Os repositórios do cliente são privados e o domínio público dele contém o nome do
cliente. Um case confidencial fica sem link possível pela regra 2 e sem
permissão de existir pela regra 1. **Nenhum case de cliente cabe no schema hoje.**

### Inventário verificado (2026-08-09)

| Candidato | Bloco | Repositório | Link público |
|---|---|---|---|
| `forja` | ai-tooling | público, 11★ | `github.com/nandomoreirame/forja` (publicado) |
| `amnesia-claude-code` | ai-tooling | público, Python | repositório |
| `bragstack.app` | ai-product | **privado** | `https://bragstack.app` (HTTP 200) |
| `portfoliosnap.app` | ai-product | **privado** | `https://portfoliosnap.app` **HTTP 525** |
| `tumodori` | systems-cli | público, Rust | repositório |
| `hypr-switcher` | systems-cli | público, Rust | repositório |
| `flipclock-app` | systems-cli | público, Go | repositório (reserva) |
| `mousai.gallery` | — | **privado** | `https://mousai.gallery` (HTTP 200) |
| Liquid (2 cases) | professional | privado | nenhum admissível |

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| 964 estrelas, 764 em 8 temas antigos | API do GitHub, duas páginas de 100 | sim |
| `bragstack.app`, `portfoliosnap.app`, `mousai.gallery` são privados | `api.github.com/repos/...` devolve 404 | sim |
| `portfoliosnap.app` responde HTTP 525 | `curl` ao domínio | sim |
| `bragstack.app` e `mousai.gallery` respondem HTTP 200 | `curl` ao domínio | sim |
| `tumodori`, `hypr-switcher`, `flipclock-app`, `amnesia-claude-code` são públicos | API devolve 200 | sim |
| O schema exige ao menos um link | `src/content/schemas/project.ts`, primeiro `refine` | sim |
| O schema proíbe cliente identificado em case confidencial | mesmo arquivo, segundo `refine` | sim |
| O cliente tem 16 projetos e 36 bases | `~/dev/clients/liquid/` | sim |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um case é publicado ENTÃO ele DEVE declarar problema, decisão técnica e resultado, e NÃO PODE apresentar resultado que o link não permita conferir.
2. **[REQ-002]** QUANDO um case não confidencial é cadastrado ENTÃO ele DEVE declarar ao menos um entre `repoUrl` e `liveUrl`, mantendo a regra atual sem afrouxamento.
3. **[REQ-003]** QUANDO um case confidencial é cadastrado ENTÃO ele PODE omitir os dois links, e nesse caso DEVE declarar explicitamente que a evidência não é pública.
4. **[REQ-004]** QUANDO um case omite os dois links ENTÃO o build DEVE falhar se `confidential` for falso, preservando a regra para todo o resto do catálogo.
5. **[REQ-005]** QUANDO um case confidencial sem link é renderizado ENTÃO a superfície humana DEVE marcá-lo como trabalho sob confidencialidade, para o leitor não procurar um link que não existe.
6. **[REQ-006]** QUANDO um `repoUrl` é declarado ENTÃO o repositório DEVE ser público, porque um link privado devolve 404 ao visitante e não é evidência.
7. **[REQ-007]** QUANDO o catálogo é publicado ENTÃO ele DEVE conter **ao menos** oito cases, **ao menos** dois em cada um dos quatro blocos. *(Emendado em 2026-08-09: a primeira redação dizia "oito" e "dois", e o portão foi escrito como igualdade, virando teto. Publicar o nono case quebrava o build sem motivo. O `MVP-SCOPE.md` pede um piso.)*
8. **[REQ-008]** QUANDO um case do bloco `ai-product` é publicado ENTÃO ele DEVE ser produto próprio, e o rótulo do bloco NÃO PODE prometer IA que nem todos os cases entregam. *(Emendado em 2026-08-09: o rótulo virou "Produtos SaaS" quando `mousai` entrou, e `croonos` reforça a mudança. O bloco agora agrupa produto próprio, com ou sem IA, e pertence a laboratório.)*
9. **[REQ-009]** QUANDO um case do bloco `systems-cli` é publicado ENTÃO ele DEVE ser escrito em Rust ou Go, conforme o rótulo do bloco.
10. **[REQ-010]** QUANDO um resultado é declarado com número ENTÃO ele DEVE vir com a narrativa que o contextualiza, e contagem de estrela abaixo de duas dezenas NÃO PODE ser apresentada como tração.
11. **[REQ-011]** QUANDO o site menciona o total de estrelas do GitHub ENTÃO ele DEVE declarar que 79% vêm de temas de 2017 a 2021, ou não mencionar o total.
12. **[REQ-012]** QUANDO os oito cases estão publicados ENTÃO os sete portões existentes DEVEM continuar passando, incluindo a validação cruzada entre serviço anunciado e case que o comprove.

13. **[REQ-017]** QUANDO um projeto foi desligado ENTÃO ele PODE omitir os dois links, e a página DEVE apresentar um selo de descontinuado no lugar do botão, porque link morto promete evidência e entrega erro de conexão.
14. **[REQ-018]** QUANDO um case declara `discontinued` ENTÃO nenhum link externo do projeto PODE ser renderizado, mesmo que a URL tenha ficado no frontmatter.

### P2 (Should Have)

 1. **[REQ-013]** QUANDO um case tem imagem ENTÃO ela DEVE ter texto alternativo que descreva o que a tela mostra, e não o nome do produto.
 2. **[REQ-014]** QUANDO um case é marcado `featured` ENTÃO ele DEVE estar entre os cinco que a home lista, e o conjunto marcado NÃO PODE exceder cinco.
 3. **[REQ-015]** QUANDO o campo `date` é preenchido ENTÃO ele DEVE refletir o início do trabalho, e `updatedAt` a última alteração real, ambos conferidos no histórico do repositório quando ele for público.

### P3 (Nice to Have)

 1. **[REQ-016]** QUANDO um case cita uma decisão técnica ENTÃO ele PODE citar a alternativa descartada, que é o que separa decisão de escolha.

## Edge Cases

- **`portfoliosnap.app` continua fora do ar** — Sem repositório público e sem
  domínio respondendo, ele não passa em REQ-002. O case fica bloqueado por
  dependência externa; a alternativa registrada é `mousai.gallery`, que responde
  200, ao custo de esticar a definição do bloco `ai-product` (REQ-008).
- **Case confidencial sem link e sem confidencialidade real** — REQ-004 impede:
  omitir os links só é permitido com `confidential: true`, que por sua vez aciona
  a redação de nome de cliente e métricas na camada de acesso.
- **Repositório público hoje, privado amanhã** — REQ-006 é verificável no momento
  da escrita, não continuamente. Um portão que consulte a API do GitHub a cada
  build tornaria o build dependente de rede, o que é pior que o problema.
- **Serviço anunciado sem case correspondente** — A validação cruzada de
  `Services.astro` já quebra o build. Ao trocar quais cases existem, os `caseSlug`
  dos serviços precisam acompanhar.
- **Oito cases e cinco destaques** — REQ-014 limita, mas o portão de CTA único da
  home não cobre isso. Ou entra portão, ou fica como convenção declarada.
- **Estrela sobe depois da publicação** — O texto do resultado envelhece. Preferir
  formulação que não precise de manutenção ("uso diário próprio") a número solto.

## Architecture Decisions

1. **Afrouxar o link obrigatório só para case confidencial** — O primeiro `refine`
   passa a aceitar os dois links nulos quando `confidential: true`. Alternativa
   descartada: manter a regra e nomear o cliente, que foi oferecida ao autor e
   recusada. Alternativa descartada: um campo `evidenceNote` livre substituindo o
   link, que criaria um segundo caminho para "provar" um case sem nada verificável.
2. **A troca é declarada na superfície, não escondida** — REQ-005 obriga o case
   confidencial sem link a se marcar como tal. Sem isso, o afrouxamento transforma
   silenciosamente "evidência verificável" em "declaração do autor", que é
   exatamente o modo de falha que o catálogo inteiro existe para evitar.
3. **Repositório privado não serve como `repoUrl`** — O schema hoje aceita
   qualquer URL bem formada. Um repositório privado devolve 404 para o visitante,
   o que é pior que a ausência do link, porque promete evidência e entrega erro.
   Daí REQ-006 e o uso de `liveUrl` para `bragstack.app` e `mousai.gallery`.
4. **O total de estrelas só aparece com a fração declarada** — REQ-011. O número
   agregado é o ativo mais tentador do acervo e o mais enganoso. Alternativa
   descartada: omitir o GitHub da trajetória, que jogaria fora um sinal real.
5. **`portfoliosnap.app` bloqueia em vez de degradar** — O case não entra com link
   quebrado nem com link para repositório privado. Ou o domínio volta, ou a
   alternativa assume o lugar. Alternativa descartada: publicar sem link marcando
   como confidencial, que usaria a exceção de REQ-003 para contornar um problema
   de infraestrutura, e não de confidencialidade.

## Constraints

- O schema só muda no ponto descrito em AD-001. Os demais campos e regras ficam.
- Os sete portões existentes não podem ser relaxados para acomodar conteúdo.
- Conteúdo humano em pt-BR; identificadores, slugs e nomes de arquivo em inglês.
- Nenhum número sem narrativa: `StatItem` já lança, e REQ-010 estende a regra ao
  corpo dos cases.
- Nenhum dado de cliente nas rotas de máquina, que já têm portão de vazamento.

## Out of Scope

- Consertar o SSL de `portfoliosnap.app`, que é infraestrutura de outro projeto.
- Escrever notas (`notes`), que é feature própria e já implementada, sem conteúdo.
- Tornar públicos os repositórios hoje privados.
- Portão que verifique continuamente se um `repoUrl` segue público.

## Decisões pendentes do autor

Registradas aqui em vez de assumidas, porque mudam quais arquivos o plano cria:

1. **Quais dois projetos do cliente** viram os cases de `professional`. Proposta,
   pelos 16 projetos e 36 bases inventariados: o pipeline de ETL multi-base, pela
   escala, e a plataforma de dados, pela proximidade com o posicionamento.
2. **Segundo case de `ai-product`** caso `portfoliosnap.app` siga fora do ar.
3. **`mousai.gallery` entra ou não** nos oito, e em que bloco.
