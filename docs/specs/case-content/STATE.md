# STATE: case-content

```yaml
slug: case-content
phase: plan-complete
spec_path: docs/specs/case-content/SPEC.md
plan_path: docs/plans/2026-08-09-case-content.md
created: 2026-08-09
sprint: 3
prd: F1 (home), F2 (catálogo) — conteúdo que as duas features já renderizam
depth: Deep
requirements: 16
tasks: 15
```

## Contexto descoberto (2026-08-09)

Inventário levantado de `~/dev/projects/` (10 diretórios) e da API do GitHub
(`nandomoreirame`, duas páginas de 100).

### RISK-004 confirmado com número

| Métrica | Valor |
|---|---|
| Repositórios públicos próprios | 99 |
| Estrelas totais | 964 |
| Em 8 temas Jekyll e Nuxt de 2017-2021 | **764 (79%)** |
| Nos outros 91 repositórios | 200 |

O BRIEF estimava "cerca de 700 das 964". O total está correto e a fração é maior
do que a estimativa. Os quatro maiores fora dos temas são de 2017 a 2019;
`forja` (11, 2026) é o primeiro item que sustenta o posicionamento atual.

### Bloqueios encontrados na pesquisa

1. **Case de cliente é impossível no schema atual.** O primeiro `refine` exige um
   link; o segundo proíbe que um case confidencial identifique o cliente em
   `slug`, `liveUrl` ou `repoUrl`. Repositórios do cliente são privados e o
   domínio dele carrega o nome. As duas regras se fecham uma contra a outra.
   **Resolução do autor:** afrouxar o primeiro `refine` só para
   `confidential: true` (T1), com aviso obrigatório na página (T2).
2. **`portfoliosnap.app` sem evidência verificável.** Repositório privado (404 na
   API) e domínio em HTTP 525, falha de handshake SSL entre Cloudflare e origem.
   **Resolução do autor:** consertar antes; T9 traz `mousai.gallery` como
   caminho alternativo, com emenda do rótulo do bloco.
3. **Repositório privado não serve de `repoUrl`.** Devolve 404 ao visitante, o
   que promete evidência e entrega erro. Virou REQ-006 e o script de T3.

## Decisões pendentes, com default aplicado no plano

O autor aprovou a spec sem responder as três. O plano assume e registra:

| Pendente | Default | Tarefa |
|---|---|---|
| Quais dois projetos do cliente | Normalização financeira e plataforma de data insights | T10, T11 |
| Segundo `ai-product` se o domínio não voltar | `mousai.gallery`, com o bloco relido como "produtos SaaS" | T9 |
| `mousai.gallery` entra nos oito | Só como substituto em T9 | T9 |

## Próximo passo

`/rpi:implement case-content`
