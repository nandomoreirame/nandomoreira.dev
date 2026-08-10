# Plano: Endurecimento e cutover

> **Spec:** `docs/specs/launch-hardening/SPEC.md`
> **Slug:** `launch-hardening` · **Criado:** 2026-08-09
> **Profundidade:** Deep (13 requisitos) — três lotes com dependência declarada
> **Tarefas:** 11
> **Bloqueado por:** `mcp-server` T12 (o PRD amarra o cutover à validação com cliente real)

## Defaults aplicados nas decisões pendentes da spec

| Pendente | Default do plano | Tarefa |
|---|---|---|
| Quem roda o Lighthouse | Entra `@lhci/cli` como dependência de desenvolvimento, executado sob demanda e não em CI | T1 |
| Onde o site antigo está hospedado | O plano não presume; T9 começa descobrindo pelo DNS e pelos cabeçalhos | T9 |
| URLs do site antigo a redirecionar | Levantadas em T9 a partir do sitemap antigo, se houver | T9 |

## Ordem e dependências

```
Lote 1 (medir)      T1 → T2 → T3 → T4
Lote 2 (corrigir)   T5, T6 (só o que a medição achar)
Lote 3 (cutover)    T7 → T8 → T9 → T10 → T11
```

**T7 não começa antes de o lote 1 fechar**: apontar o domínio para um build não medido
inverte a ordem que F8.6 exige.

---

## Lote 1 — Medir o que ninguém mediu

### T1 — Ferramenta de auditoria

**REQ:** REQ-001, REQ-013
**Arquivos:** `package.json` · `scripts/audit-lighthouse.sh` (criar)

```bash
npm install --save-dev @lhci/cli
```

O script recebe a URL como argumento e roda contra a **URL servida**, nunca contra
`astro dev`: medir desenvolvimento mede o servidor de desenvolvimento.

```bash
bash scripts/audit-lighthouse.sh https://nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app
```

**Aquecer antes de medir:** o backend tem `minInstances: 0`, então a primeira requisição
paga cold start e derruba Performance. O script faz duas requisições descartadas antes da
medição, e isso fica escrito nele.

**Team:** track `qa` · implementador `infra-engineer` ·
skills `bash-linux` · painel `consequences-reviewer`

---

### T2 — Medir e registrar

**REQ:** REQ-001, REQ-002
**Arquivos:** `docs/audits/2026-XX-XX-lighthouse.md` (criar)
**Depende de:** T1

Rodar contra as rotas que representam os três tipos de página: home, um case e um post.

Registrar em arquivo versionado, com data, URL medida, commit servindo e as três notas.
Um número dito em conversa não permite comparar a próxima medição (AD-002 da spec).

**Critério:** Performance, Acessibilidade e SEO acima de 90. Abaixo disso, o achado vira
tarefa no lote 2, não uma nota renegociada.

**Team:** track `qa` · implementador `infra-engineer` · painel `consequences-reviewer`

---

### T3 — Percorrer o site por teclado

**REQ:** REQ-003, REQ-011
**Arquivos:** `docs/audits/2026-XX-XX-keyboard.md` (criar)

Percorrer com Tab, Shift+Tab e Enter, registrando por rota:

- o skip link aparece no primeiro Tab e leva ao `main`;
- a ordem de tabulação segue a ordem de leitura;
- o foco é visível em todo alvo, incluindo o rodapé e o breadcrumb, que ficaram
  discretos por decisão de estilo;
- nenhuma armadilha de foco.

Rotas: `/`, `/portfolio`, `/lab`, um case, `/posts`, `/posts/arquivo`, um post, `/sobre`,
`/contato`, `/404`.

**Team:** track `qa` · implementador `frontend-engineer` ·
skills `accessibility-guardrails` · painel `consequences-reviewer`

---

### T4 — Portão de 320px

**REQ:** REQ-004
**Arquivos:** `tests/design-system/no-horizontal-scroll.build-test.ts` (criar)

O portão existente proíbe `min-w-dvw` na camada base, o que impede a causa mais comum,
mas ninguém verifica o efeito. Sem navegador, a verificação possível é estática: varrer o
CSS **construído** procurando largura fixa maior que 320px fora de contêiner com
`overflow-x: auto`.

**Step 5 — Provar que morde**

```bash
# adicionar uma regra com width: 400px a um componente
npm run build && npx vitest run --config vitest.build.config.ts   # espera exit 1
```

Se o portão estático não for capaz de morder de forma confiável, **não fingir que é
portão**: registrar em `docs/audits/` como verificação manual, como T3.

**Team:** track `tests` · implementador `frontend-engineer` ·
painel `test-reviewer`, `consequences-reviewer`

---

## Lote 2 — Corrigir o que a medição achar

### T5 — Fechar os achados de acessibilidade

**REQ:** REQ-003, REQ-011
**Depende de:** T2, T3

Uma tarefa por achado, cada uma com o teste que a trava. **Nenhum portão existente pode
ser relaxado para atingir nota** (restrição da spec).

**Team:** track `frontend` · implementador `frontend-engineer` ·
skills `accessibility-guardrails`, `test-driven-development` ·
painel `business-logic-reviewer`

---

### T6 — Fechar os achados de performance e SEO

**REQ:** REQ-001
**Depende de:** T2

Idem. Otimização que exija mudar arquitetura, como pré-renderizar rotas hoje em SSR,
está fora do escopo da spec: vira decisão nova, não tarefa deste plano.

**Team:** track `frontend` · implementador `frontend-engineer` ·
painel `consequences-reviewer`

---

## Lote 3 — Cutover

### T7 — Baixar o TTL antes de qualquer mudança

**REQ:** REQ-009
**Arquivos:** `docs/runbooks/cutover.md` (criar)

Primeiro passo do runbook, e o que torna a reversão uma operação de minutos: baixar o TTL
dos registros de `nandomoreira.dev` no Cloudflare para 5 minutos (ou `Auto`) e **esperar
o TTL antigo expirar** antes de seguir.

É barato antes e impossível depois.

**Team:** track `infra` · implementador `infra-engineer` ·
skills `cloud-cli` · painel `consequences-reviewer`

---

### T8 — Domínio customizado no App Hosting

**REQ:** REQ-005, REQ-007, REQ-010
**Depende de:** T7

Adicionar `nandomoreira.dev` e `www.nandomoreira.dev` ao backend e criar os registros que
a plataforma pedir.

**Os dois pontos onde o Cloudflare quebra isso, e que a spec já registra:**

1. **Proxy laranja ligado** durante a validação: o App Hosting valida por DNS e o
   registro apontado não é o que ele espera. Desligar o proxy (nuvem cinza) até o
   certificado emitir.
2. **SSL em modo Flexible**: gera laço de redirecionamento contra uma origem que já força
   HTTPS. Precisa ser **Full (strict)**.

Confirmar a emissão antes de seguir:

```bash
curl -sI https://nandomoreira.dev | head -1
openssl s_client -connect nandomoreira.dev:443 -servername nandomoreira.dev < /dev/null 2>/dev/null | openssl x509 -noout -issuer -dates
```

**Team:** track `infra` · implementador `infra-engineer` ·
skills `cloud-cli` · painel `security-reviewer`, `consequences-reviewer`

---

### T9 — Inventário do site antigo e redirecionamentos

**REQ:** REQ-008
**Arquivos:** `astro.config.mjs` · `tests/pages/legacy-redirects.test.ts`

Antes de desativar, levantar o que o site antigo servia:

```bash
curl -s https://nandomoreira.dev/sitemap.xml | grep -oE '<loc>[^<]+</loc>'
```

Para cada URL: se há equivalente no site novo, entra em `redirects` do
`astro.config.mjs`, como `/notas` e `/projetos` já fazem. Se não há, responde 404
honesto, **nunca** redirecionamento para a home, que é pior que 404 para quem procurava
uma página específica.

O teste trava os pares levantados. O portão de status real continua sendo
`verify-local-server.sh`, que já checa 301 contra o build rodando.

**Team:** track `frontend` · implementador `frontend-engineer` ·
painel `consequences-reviewer`, `business-logic-reviewer`

---

### T10 — Trocar o apex e desativar o antigo

**REQ:** REQ-005, REQ-008
**Depende de:** T8, T9

Nesta ordem, que a spec fixa em AD-004:

1. Apontar `nandomoreira.dev` e `www` para o App Hosting.
2. Confirmar que o domínio serve o site novo (título, `/posts`, `/api/health`).
3. **Só então** desativar o site antigo.

Inverter cria uma janela sem site.

**Verificação**

```bash
for r in / /portfolio /lab /posts /sobre /contato /llms.txt /sitemap.xml /api/health; do
  printf "%-18s %s\n" "$r" "$(curl -s -o /dev/null -w '%{http_code}' https://nandomoreira.dev$r)"
done
```

**Team:** track `infra` · implementador `infra-engineer` ·
skills `cloud-cli` · painel `consequences-reviewer`

---

### T11 — Domínio final nas superfícies derivadas

**REQ:** REQ-012
**Arquivos:** `astro.config.mjs` (`site`) · testes de `sitemap`, `llms-txt`, `agents-md`,
JSON-LD

`site` já é `https://nandomoreira.dev`, então as superfícies derivadas devem estar
corretas. **Confirmar em vez de presumir**: nenhuma pode declarar a URL `.hosted.app`.

```bash
curl -s https://nandomoreira.dev/sitemap.xml | grep -c "hosted.app"   # espera 0
curl -s https://nandomoreira.dev/llms.txt   | grep -c "hosted.app"    # espera 0
```

**Team:** track `backend` · implementador `backend-engineer` ·
painel `consequences-reviewer`

---

## Riscos deste plano

| Risco | Mitigação |
|---|---|
| Apontar o domínio para um build não medido | O lote 3 não começa antes de o lote 1 fechar, e T2 registra a medição |
| Proxy do Cloudflare impedindo a emissão do certificado | T8 trata como passo explícito, não como surpresa |
| SSL Flexible gerando laço de redirecionamento | Mesmo T8, com o modo exigido escrito |
| Reversão lenta por TTL alto | T7 baixa o TTL antes de qualquer mudança |
| Janela sem site ao desativar o antigo cedo demais | T10 fixa a ordem: apontar, confirmar, só então desativar |
| Prometer portão de Lighthouse que a infra não sustenta | T1 deixa a auditoria sob demanda; T4 admite virar verificação manual se o portão estático não morder |
| Cutover antes do MCP validado | O plano declara o bloqueio no cabeçalho, conforme o critério de aceite de F8 |
