---
slug: hire-endpoint
phase: implement-blocked
spec_path: docs/specs/hire-endpoint/SPEC.md
plan_path: docs/plans/2026-08-09-hire-endpoint.md
updated: 2026-08-10
---

# Estado: hire-endpoint

Codigo completo e verificado em 2026-08-10 (14 tarefas, 6 commits). **A feature nao esta
no ar**: falta provisionamento e segredos, que sao seus.

## Verificado contra o build, por HTTP

`PORT=<livre> bash scripts/verify-hire-endpoint.sh` termina em `HIRE ENDPOINT PASSED`:

```
OK GET is refused -> 405
OK malformed JSON -> 400
OK empty body -> 400
OK missing fields -> 400
OK unknown key -> 400
OK whitespace-only brief -> 400
OK oversized body -> 413
OK chunked oversized body -> 413
OK honeypot filled -> 202
OK sixth request from one IP -> 429
OK another IP still allowed -> 503
```

Toda resposta e varrida por stack, caminho, `node_modules`, `hire_requests`, nome de
driver e `PERMISSION_DENIED`.

## O que falta, e e seu

1. **Habilitar a API do Firestore e criar o banco em `us-east4`.** A API esta desabilitada
   no projeto `nandomoreira-dev` e nao provisionei recurso cobravel em producao por conta
   propria:

   ```bash
   gcloud services enable firestore.googleapis.com --project=nandomoreira-dev
   gcloud firestore databases create --location=us-east4 --project=nandomoreira-dev
   firebase deploy --only firestore:rules
   ```

2. **Criar os tres segredos.** `apphosting.yaml` ja os declara por nome; os valores nunca
   entram no repositorio:

   ```bash
   firebase apphosting:secrets:set hire-resend-api-key
   firebase apphosting:secrets:set hire-notify-to
   firebase apphosting:secrets:set hire-notify-from
   ```

3. **Verificar o dominio no Resend**, senao `HIRE_NOTIFY_FROM` e recusado no envio.

Enquanto (1) faltar, um briefing valido responde **503**, que e a falha honesta prevista
por REQ-002: sem persistencia nao ha o que salvar, e o endpoint recusa em vez de fingir
que guardou. Enquanto (2) faltar, a rota lanca no boot com a lista das variaveis
ausentes, que e REQ-010 funcionando.

## Decisoes tomadas na implementacao

- **O IP do rate limit e o penultimo hop de `x-forwarded-for`, nao o primeiro.** O
  balanceador do Google **acrescenta** `<cliente>, <lb>` ao que chegou, entao um chamador
  que manda o proprio cabecalho empurra valores falsos para a FRENTE. Confiar no primeiro
  permitiria girar identidades infinitas e passar direto pelo limite. Achado do Codex.
- **O mapa do limiter tem teto duro com evicao LRU.** Limpeza por validade nao resolve:
  um atacante que manda chaves distintas mantem todas frescas, nada expira e o mapa cresce
  ate a instancia morrer. Achado HIGH do Codex.
- **A leitura do corpo tem prazo (10s).** O limite de 16 KB sozinho nao cobre o cliente
  lento, que fica abaixo do teto para sempre segurando um slot de concorrencia. Achado do
  Codex.
- **O honeypot devolve id sintetico com a forma de um id do Firestore.** Um placeholder
  fixo tornaria a resposta distinguivel e revelaria a armadilha na primeira sondagem.
- **`user-agent` e truncado em 256 chars** antes de persistir: e cabecalho controlado pelo
  chamador e vira dado pessoal no banco.
- **`Content-Length` menor nao e a ameaca.** Sobre HTTP real o proprio servidor trunca o
  corpo para o valor declarado, entao a resposta correta e 400. O caso que importa e corpo
  **chunked sem tamanho declarado**, onde so a leitura pode cortar, e e esse que o script
  exercita.

## Auditoria de dependencia

`npm audit`: 6 vulnerabilidades **moderadas**, todas de `uuid@9.0.1`, transitiva de
`firebase-admin@14.2.0` via `@google-cloud/storage`. Nenhuma high ou critical. O conserto
exige `npm audit fix --force`, que troca a major do `firebase-admin`. Mantido, registrado.
