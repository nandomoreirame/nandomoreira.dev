# Runbook: ligar contrate.nandomoreira.dev

As páginas de vendas (`docs/specs/sales-landing/SPEC.md`) respondem hoje em
`https://nandomoreira.dev/servicos`. Este roteiro move a landing para o subdomínio próprio.
Enquanto `SALES_HOST_LIVE` estiver `false`, nada aqui muda o comportamento do site.

Para revisar antes, sem ligar nada: `http://contrate.nandomoreira.local:4321` no `astro dev`
(com `contrate.nandomoreira.local` no `/etc/hosts`) e `http://contrate.nandomoreira.home` na
homologação (`bash scripts/deploy-staging.sh`).

1. Firebase console → App Hosting → backend `nandomoreira-dev` → Settings → Domains → Add custom domain `contrate.nandomoreira.dev`.
2. Criar no DNS os registros que o console mostrar e esperar o certificado ficar `ACTIVE`.
3. Confirmar que o domínio já chega ao backend: `curl -s -o /dev/null -w '%{http_code}' https://contrate.nandomoreira.dev/` responde 200 (com a flag desligada, ele serve a home do site).
4. Em `src/lib/sales/host.ts`, trocar `SALES_HOST_LIVE` para `true`; rodar `npx vitest run` e `npm run build`.
5. Push em `main` e, depois do rollout, conferir:
   - `curl -s https://contrate.nandomoreira.dev/ | grep -c 'id="hero-title"'` → 1
   - `curl -s -o /dev/null -w '%{http_code}' https://contrate.nandomoreira.dev/site-institucional` → 200
   - `curl -sI https://nandomoreira.dev/servicos | grep -i '^location'` → `https://contrate.nandomoreira.dev/`
   - Enviar o formulário em `https://contrate.nandomoreira.dev/` e ver `?envio=ok`. Um 403 aqui é o `security.allowedDomains` do `astro.config.mjs`.
6. O sitemap do domínio principal deixa de listar `/servicos` sozinho. Um sitemap próprio do subdomínio fica para depois, se o Search Console pedir.

Para voltar atrás: `SALES_HOST_LIVE = false` e push. O 301 some, e `/servicos` volta a responder no domínio principal.
