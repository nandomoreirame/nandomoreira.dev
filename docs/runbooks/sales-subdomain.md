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

## Versão inglesa

O subdomínio atende a landing em `/en`, com par em `/`. O caminho interno é `/en/services`; no host principal, ele responde 301 para o subdomínio e preserva a query. Os hosts local e de staging usam o mesmo mapa.

| pt-BR | Inglês |
|---|---|
| `/site-institucional` | `/en/website` |
| `/landing-page` | `/en/landing-page` |
| `/blog` | `/en/blog` |
| `/loja-virtual` | `/en/online-store` |
| `/produto-web` | `/en/web-product` |
| `/automacao-ia` | `/en/ai-automation` |

O catálogo contém os seis serviços. Uma rota de detalhe só existe quando o serviço tem `detail` escrito nos dois idiomas; atualmente, apenas `website`/`site-institucional`. Os demais continuam como cards e âncoras da landing. O seletor mantém o visitante no mesmo host.

Os formulários usam `landing-en` e o slug inglês como origem. Quando os slugs coincidem (`blog` e `landing-page`), a origem inglesa recebe `-en`; origens de detalhes ainda não publicados são rejeitadas. O interesse automático salvo no lead continua em pt-BR.

Rollback: `EN_LIVE = false` desliga as rotas inglesas, a reescrita `/en` do subdomínio e os alternados/seletor das vendas. As páginas pt-BR continuam no endereço atual.

### Verificação local

`npm run verify` valida tipos, testes e build. O script `scripts/verify-i18n-routes.sh` também confere os hosts de vendas e um formulário inválido por HTTP. Essa prova usa um projeto de demonstração no emulador Firestore, nunca o banco de produção.

Inicie o emulador com projeto `demo-i18n-sales`, host `127.0.0.1` e porta `9499` (ou passe `FIRESTORE_EMULATOR_HOST` para outra porta local), depois rode `bash scripts/verify-i18n-routes.sh`. O servidor de prova usa credenciais fictícias de e-mail e desabilita o captcha; a entrada inválida não envia mensagem nem grava lead. A marca final é `I18N ROUTES PASSED`.
