# Runbook: ligar contrate.nandomoreira.dev

As páginas de vendas (`docs/specs/sales-landing/SPEC.md`) respondem hoje em
`https://nandomoreira.dev/servicos`. Este roteiro move a landing para o subdomínio próprio.
Enquanto `SALES_HOST_LIVE` estiver `false`, nada muda em produção.

Em dev e na homologação o subdomínio já funciona, com a flag ligada ou desligada: o link
"Ver os serviços" da home e de `/contato` aponta para o host de vendas do ambiente
(`salesLink` em `src/lib/sales/host.ts`), e `/servicos` no host principal responde 301 para ele.

| Ambiente | Host principal | Host de vendas |
|---|---|---|
| dev (`astro dev`) | `http://localhost:4321` | `http://contrate.nandomoreira.local:4321` (no `/etc/hosts`) |
| homologação | `http://nandomoreira.home` | `http://contrate.nandomoreira.home` (`bash scripts/deploy-staging.sh`) |
| produção | `https://nandomoreira.dev` | `https://contrate.nandomoreira.dev`, só com `SALES_HOST_LIVE` |

O domínio de produção entra no **Firebase Hosting** (site `nandomoreira-dev`), como o apex,
`www`, `blog` e `links`: o `firebase.json` repassa tudo ao serviço do App Hosting. Na lista de
domínios do backend do App Hosting só existe o `*.hosted.app`.

1. Firebase console → Hosting → site `nandomoreira-dev` → Add custom domain `contrate.nandomoreira.dev` (sem redirecionar). Pela API:
   ```bash
   curl -s -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "x-goog-user-project: nandomoreira-dev" -H 'Content-Type: application/json' -d '{}' \
     "https://firebasehosting.googleapis.com/v1beta1/projects/nandomoreira-dev/sites/nandomoreira-dev/customDomains?customDomainId=contrate.nandomoreira.dev"
   ```
2. No Cloudflare, criar os registros que o console mostrar (em `requiredDnsUpdates` pela API) com a nuvem **cinza** (DNS only) até o certificado ficar `CERT_ACTIVE`; SSL em Full (strict). Depois disso o proxy pode voltar a laranja, como no apex.
3. Confirmar que o domínio já chega ao backend: `curl -s -o /dev/null -w '%{http_code}' https://contrate.nandomoreira.dev/` responde 200 (com a flag desligada, ele serve a home do site).
4. Em `src/lib/sales/host.ts`, trocar `SALES_HOST_LIVE` para `true`; rodar `npx vitest run` e `npm run build`.
5. Push em `main` e, depois do rollout, conferir:
   - `curl -s https://contrate.nandomoreira.dev/ | grep -c 'id="hero-title"'` → 1
   - `curl -s -o /dev/null -w '%{http_code}' https://contrate.nandomoreira.dev/site-institucional` → 200
   - `curl -sI https://nandomoreira.dev/servicos | grep -i '^location'` → `https://contrate.nandomoreira.dev/`
   - Enviar o formulário em `https://contrate.nandomoreira.dev/` e ver `?envio=ok`. Um 403 aqui é o `security.allowedDomains` do `astro.config.mjs`.
6. O sitemap do domínio principal deixa de listar `/servicos` sozinho. Um sitemap próprio do subdomínio fica para depois, se o Search Console pedir.

Para voltar atrás: `SALES_HOST_LIVE = false` e push. O 301 some, e `/servicos` volta a responder no domínio principal.
