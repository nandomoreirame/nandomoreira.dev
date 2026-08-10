---
slug: structured-resume
phase: none
spec_path: docs/specs/structured-resume/SPEC.md
plan_path: docs/plans/2026-08-09-structured-resume.md
updated: 2026-08-10
---

# Estado: structured-resume

Fase atual: none. Implementado em 2026-08-10, 12 tarefas, 9 commits.

## Decisoes tomadas na implementacao

- **T3 entregue sem conteudo.** O autor nao forneceu o historico profissional, e o plano
  proibe inventar empregador, cargo ou data. `work` e `education` ficam ausentes do
  `profile.md`; o schema os aceita como opcionais e o payload segue valido. Escrever o
  historico e conteudo, nao codigo.
- **Conflito de REQ-012 resolvido a favor da spec mais nova.** `aeo-base` REQ-012 mantinha
  toda rota de maquina fora do `sitemap.xml`; `structured-resume` REQ-012 exige as duas
  rotas de curriculo dentro. A exclusao foi estreitada para o que e de fato nao indexavel:
  paginas de erro, os proprios arquivos de descoberta, `/api/health` e `/api/hire`.
  `robots.txt` ja fazia `Allow: /`, entao nao havia contradicao.
- **Datas usam `z.iso.date()`, nao regex de formato.** Uma regex aceita `2024-99-99` e o
  carrega para dentro do payload. Achado do Codex na revisao do lote 1.
- **A quebra de linha do `.txt` isenta token indivisivel.** Uma URL partida em duas linhas
  deixa de ser URL, entao a largura e garantia sobre quebra de palavra, nao limite duro de
  coluna. Documentado no codigo e travado por teste.

## Pendencias do autor

- Historico `work` e `education` em `src/content/profile/profile.md`.

## Achado fora de escopo

- `src/lib/aeo/agents-md.ts` aponta cada servico para `/projetos/<slug>`, que e caminho
  legado e responde 301. As rotas reais sao `/portfolio/<slug>` e `/lab/<slug>`. Corrigir
  exige passar `projects` para o gerador, o que muda a assinatura, entao ficou fora desta
  feature.
