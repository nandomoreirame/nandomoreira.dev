# Runbook: cutover de `nandomoreira.dev`

> **Feature:** `launch-hardening` (F8) · tarefas T7, T8, T10, T11
> **Estado:** escrito e não executado. Os passos abaixo mexem em DNS de produção e
> derrubam o site antigo, então são seus.

## Antes de começar, dois bloqueios

1. **O MCP precisa estar validado com cliente real.** Está: a evidência é
   `docs/specs/mcp-server/STATE.md`, protocolo `2025-11-25`, cinco tools chamadas contra o
   build. Reproduzível por `bash scripts/verify-mcp-client.sh`.
2. **A medição da sprint precisa estar registrada.** Está:
   `docs/audits/2026-08-10-lighthouse.md`. Apontar o domínio para um build não medido
   inverte a ordem que F8.6 exige.

Um terceiro item **não** bloqueia o cutover, mas você deve saber: `/api/hire` responde 503
até o Firestore ser provisionado, e os segredos do Resend não existem. Ver
`docs/specs/hire-endpoint/STATE.md`.

## Passo 1 — Baixar o TTL (T7)

**Antes de qualquer outra coisa.** É barato agora e impossível depois: com TTL alto, uma
reversão leva horas em vez de minutos.

No Cloudflare, nos registros de `nandomoreira.dev` e `www`, baixe o TTL para **5 minutos**
(ou `Auto`). **Espere o TTL antigo expirar** antes do passo 2. Confirme:

```bash
dig +noall +answer nandomoreira.dev
dig +noall +answer www.nandomoreira.dev
```

O número na terceira coluna é o TTL restante. Só siga quando ele refletir o valor novo.

## Passo 2 — Domínio customizado no App Hosting (T8)

```bash
firebase apphosting:backends:get nandomoreira-dev --project nandomoreira-dev
```

Adicione `nandomoreira.dev` e `www.nandomoreira.dev` ao backend pelo console do App
Hosting e crie os registros que ele pedir.

**Os dois pontos onde o Cloudflare quebra isso:**

1. **Proxy laranja ligado durante a validação.** O App Hosting valida por DNS e vê o IP do
   Cloudflare, não o registro esperado. Deixe a nuvem **cinza** (DNS only) até o
   certificado emitir. Religue depois, se quiser.
2. **SSL em modo Flexible.** Gera laço de redirecionamento contra uma origem que já força
   HTTPS. Precisa ser **Full (strict)**.

Confirme a emissão antes de seguir:

```bash
curl -sI https://nandomoreira.dev | head -1
openssl s_client -connect nandomoreira.dev:443 -servername nandomoreira.dev < /dev/null 2>/dev/null \
  | openssl x509 -noout -issuer -dates
```

## Passo 3 — Apontar, confirmar, só então desativar (T10)

A ordem é fixa. Inverter cria uma janela sem site.

1. Aponte `nandomoreira.dev` e `www` para o App Hosting.
2. **Confirme que o domínio serve o site novo**, e não pelo console:

```bash
for r in / /portfolio /lab /posts /posts/arquivo /sobre /contato \
         /llms.txt /AGENTS.md /robots.txt /sitemap.xml /rss.xml \
         /api/health /api/resume.json /api/resume.txt; do
  printf "%-22s %s\n" "$r" "$(curl -s -o /dev/null -w '%{http_code}' https://nandomoreira.dev$r)"
done

# O título distingue os dois sites sem ambiguidade.
curl -s https://nandomoreira.dev | grep -oE "<title>[^<]*</title>"
```

O site antigo responde `Fernando Moreira | Desenvolvedor Web Full-Stack & AI Engineer`.
Enquanto esse título aparecer, o cutover não terminou.

3. **Só então** desative o site antigo.

**Nenhum redirecionamento legado é necessário**: o site antigo tem uma única rota. O
levantamento está em `docs/audits/2026-08-10-keyboard-e-320px.md`.

## Passo 4 — Confirmar as superfícies derivadas (T11)

`site` já é `https://nandomoreira.dev` em `astro.config.mjs`, então isto é confirmação, não
correção. Nenhuma superfície pode declarar a URL `.hosted.app`:

```bash
for r in /sitemap.xml /llms.txt /AGENTS.md /rss.xml /api/resume.json; do
  printf "%-20s hosted.app=%s\n" "$r" "$(curl -s https://nandomoreira.dev$r | grep -c 'hosted.app')"
done
```

Todos devem imprimir `0`.

## Passo 5 — Remedir e registrar

```bash
bash scripts/audit-lighthouse.sh https://nandomoreira.dev/ \
  https://nandomoreira.dev/lab/amnesia-claude-code \
  https://nandomoreira.dev/criar-site-completo-com-o-notion
```

Acrescente a tabela a `docs/audits/` com a data nova, comparando com a de 2026-08-10.

## Reversão

Enquanto o TTL estiver em 5 minutos, reverter é apontar os registros de volta para o
destino antigo e esperar o TTL. É por isso que o passo 1 vem primeiro.

Se o problema for o build e não o DNS, reverta o rollout sem tocar no domínio:

```bash
firebase apphosting:rollouts:create nandomoreira-dev --git-commit <sha-bom> --force
```

Rode em background: ele bloqueia de 2 a 3 minutos esperando o build, e um timeout curto
mata a CLI depois de o build já existir no servidor, fazendo o retry cego devolver 409.
