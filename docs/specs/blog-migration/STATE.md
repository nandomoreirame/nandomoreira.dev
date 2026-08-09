# STATE: blog-migration

```yaml
slug: blog-migration
phase: plan-complete
spec_path: docs/specs/blog-migration/SPEC.md
plan_path: docs/plans/2026-08-09-blog-migration.md
created: 2026-08-09
prd: F14 (notas) reestruturada em blog com arquivo
depth: Deep
requirements: 18
tasks: 16
```

## Acervo a migrar

| Origem | Anos | Textos | Imagens |
|---|---|---|---|
| Gatsby `content/blog` | 2015-2019 | 38 | 55 referenciadas (54 existem) + 15 co-locadas |
| Notion export | 2024 | 2 | 8 |

Distribuição: 2015 (17), 2016 (11), 2017 (4), 2018 (4), 2019 (2), 2024 (2).

Material baixado em `~/dev/projects/blog-import-gatsby/` e `~/Downloads/posts/`.
As imagens de origem estão no tarball extraído, em `content/assets/<ano>/<mês>/`.

## Decisões pendentes, com default aplicado no plano

O autor aprovou a spec sem responder as duas. O plano assume e registra:

| Pendente | Default | Tarefa |
|---|---|---|
| Qual versão do texto sobre o calendário | A do Notion (2024), por ser a revisão do autor; a de 2016 fica fora | T6 |
| Quais textos são correntes | Os 2 do Notion; os 38 do Gatsby entram arquivados | T6 |

## Próximo passo

`/rpi:implement blog-migration`
