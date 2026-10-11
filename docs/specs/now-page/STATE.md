---
feature: now-page
phase: plan-complete
started_at: 2026-10-11
depth: standard
spec_path: docs/specs/now-page/SPEC.md
plan_path: docs/plans/2026-10-11-now-page.md
---

# Estado: now-page

Research em andamento. Página `/now` ("Agora") no menu principal: projetos em andamento,
jogos no Xbox, Spotify em tempo real e seções extras a definir.

Spec aprovada e plano gerado em 2026-10-11: 14 tarefas em 4 lotes.
Pendências do autor antes do push: criar os cinco segredos (Task 12), revisar a copy curada e `NOW_GAMES`.

## Segredos antes do push

O commit que declara os cinco segredos em `apphosting.yaml` não pode chegar em `origin/main` enquanto eles não existirem no Secret Manager. Um segredo declarado e inexistente quebra o rollout do App Hosting.

Criar cada um e conceder acesso ao backend `nandomoreira-dev`:

- `now-spotify-client-id` (`SPOTIFY_CLIENT_ID`)
- `now-spotify-client-secret` (`SPOTIFY_CLIENT_SECRET`)
- `now-spotify-refresh-token` (`SPOTIFY_REFRESH_TOKEN`)
- `now-openxbl-api-key` (`OPENXBL_API_KEY`)
- `now-github-token` (`GITHUB_TOKEN`)

```bash
firebase apphosting:secrets:set <nome>
firebase apphosting:secrets:grantaccess <nome> --backend nandomoreira-dev
```

A ausência em runtime degrada a seção, não o boot. Homologação continua sem esses segredos.

2026-10-11: `/code-review` sobre `6d3c881..977bbf8` achou 10 problemas, mais 1 na leitura (link do post). Plano de correção em `docs/plans/2026-10-11-now-page-fixes.md`, 10 tarefas. Não fazer push antes de fechá-lo.

2026-10-11: segunda entrega planejada (REQ-020 a REQ-026): capas por rota própria, artistas do mês, progresso de gamerscore. Plano em `docs/plans/2026-10-11-now-media.md`, 9 tarefas.

2026-10-11: prévia de áudio implementada pelo Claude (REQ-027 a REQ-031), fora de plano, com o Grok sem cota: Deezer por ISRC, rota `/api/now/preview/<isrc>`, script só em `/now`. Links da loja do Xbox via catálogo público da Microsoft (titleId para productId).
