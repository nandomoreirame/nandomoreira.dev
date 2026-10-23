---
slug: i18n-sales
status: approved
depth: standard
created: 2026-10-18
depends_on: [i18n-foundation]
siblings: [i18n-foundation, i18n-content]
---

# SPEC: i18n-sales

Versão inglesa da landing de vendas: `contrate.nandomoreira.dev/en` e as seis páginas
de serviço, com o formulário de contato funcionando em inglês.

## Contexto

- Desde 2026-10-18 a landing vive no subdomínio `contrate.nandomoreira.dev` (`SALES_HOST_LIVE = true`). O middleware reescreve `/` → `/servicos` e `/<slug>` → `/servicos/<slug>`, e o host principal responde 301 de `/servicos[/<slug>]` para o subdomínio (`src/lib/sales/host.ts`).
- O formulário posta em `/api/hire?origem=<landing|slug>`. O `salesOriginOf` resolve a página de volta, e o `formRedirect` devolve 303 para `<base>?envio=<resultado>#envio`.
- O texto atual fala com pequeno negócio brasileiro: WhatsApp, "Google da sua cidade". A versão inglesa é tradução fiel, sem adaptar a oferta a outro mercado (fora de escopo).
- **Revisão de 2026-10-23.** A copy em disco não é mais a de 2026-10-18: entraram prazo, pagamento (`src/lib/sales/payment.ts`), situações com orçamento e o formulário de volta na landing. A tradução parte dos arquivos atuais, sem restaurar o texto antigo.

## Decisões

| # | Decisão | Descartado | Por quê |
|---|---------|-----------|---------|
| S1 | No subdomínio: `/en` ↔ `/` e `/en/<slug-en>` ↔ `/<slug-pt>`. Caminho interno: `/en/services[/<slug-en>]` | `/en` no host principal | A landing já tem endereço próprio; o inglês segue o mesmo endereço |
| S2 | Slugs ingleses dos serviços: `website` (site-institucional), `landing-page`, `blog`, `online-store` (loja-virtual), `web-product` (produto-web) e `ai-automation` (automacao-ia) | manter os slugs pt | Mesma regra D2 da fundação: slug traduzido |
| S3 | Copy de vendas por idioma: `SALES_COPY` e o catálogo ganham a versão `en` com a mesma forma validada pelo Zod | campo a campo dentro do mesmo objeto | O schema do catálogo já existe e valida a forma inteira; um segundo objeto validado pelo mesmo schema herda os portões |
| S4 | O formulário inglês posta com `origem=<slug-en>` ou `landing-en`, e o redirect volta para a página inglesa | parâmetro `lang` separado | Um parâmetro só identifica página e idioma, e o `salesOriginOf` já é a tabela de destinos válidos |
| S5 | Os valores de `envio` (`ok`, `erro`, `invalido`, `limite`) continuam os mesmos; só a mensagem exibida muda de idioma | traduzir o parâmetro | É contrato de máquina entre handler e página, e não aparece para o visitante |
| S6 | A mensagem padrão de interesse (`Interesse: <serviço>`) gravada no lead continua em pt-BR | traduzir | É lida pelo Fernando no e-mail de notificação, não pelo visitante |

## Requisitos

- **REQ-001** QUANDO o visitante abre `contrate.nandomoreira.dev/en` ENTÃO o sistema DEVE servir a landing inglesa; `/en/<slug-en>` DEVE servir a página de serviço inglesa, e um slug inexistente DEVE responder 404.
- **REQ-002** QUANDO o host principal recebe `/en/services[/<slug-en>]` com `SALES_HOST_LIVE` ligado ENTÃO o sistema DEVE responder 301 para o mesmo caminho no subdomínio (`/en[/<slug-en>]`), preservando a query.
- **REQ-003** QUANDO `contrate.nandomoreira.local` ou `contrate.nandomoreira.home` recebem `/en[/<slug-en>]` ENTÃO o sistema DEVE reescrever como no subdomínio de produção.
- **REQ-004** QUANDO uma página de vendas é renderizada ENTÃO `<html lang>`, `og:locale`, o JSON-LD `Service` (`inLanguage`), o canonical e o `hreflang` recíproco (pt-BR, en e x-default) DEVEM refletir o idioma e apontar para as URLs do subdomínio.
- **REQ-005** QUANDO o visitante envia o formulário inglês ENTÃO o handler DEVE validar como hoje e redirecionar com 303 para `/en[/<slug-en>]?envio=<resultado>#envio`, e a página DEVE exibir a mensagem do resultado em inglês.
- **REQ-006** QUANDO o `origem` recebido não está na tabela de destinos válidos dos dois idiomas ENTÃO o handler DEVE tratá-lo como hoje (formulário do `/contato`).
- **REQ-007** QUANDO o catálogo inglês é carregado ENTÃO ele DEVE passar no mesmo `serviceSchema` e ter os mesmos `service`, `icon` e a mesma ordem do pt-BR, e cada serviço com `detail` em pt-BR DEVE ter `detail` em inglês.
- **REQ-008** QUANDO a landing inglesa é renderizada ENTÃO nenhum texto visível pode ficar em pt-BR: navegação, FAQ, depoimentos (traduzidos e marcados como tradução), botões, rótulos do formulário, mensagem pronta do WhatsApp e rodapé.
- **REQ-009** QUANDO uma página de vendas é compartilhada ENTÃO a imagem OG inglesa DEVE existir em `/og/en/services[/<slug-en>].png`.
- **REQ-010** QUANDO o sitemap é gerado com `SALES_HOST_LIVE` ligado ENTÃO as páginas de vendas continuam fora dele, como hoje.
- **REQ-011** QUANDO o visitante usa o seletor de idioma na landing ENTÃO ele DEVE ir para o par no outro idioma, no mesmo host.

## Fora de escopo

- Adaptar a oferta, os preços ou os canais (WhatsApp) a um público estrangeiro.
- Traduzir a notificação de lead para o Fernando.

## Critérios de aceite

- `npm run verify` verde.
- Em `astro dev`, com `contrate.nandomoreira.local` no `/etc/hosts`: `/en` e as seis páginas de serviço em inglês respondem 200, e um envio inválido volta para a página inglesa com a mensagem em inglês.

## Grilling Log

| Pergunta | Resolução | Fonte |
|----------|-----------|-------|
| Landing entra? | sim | Fernando, 2026-10-18 |
| Endereço inglês | `/en` no próprio subdomínio | padrão (S1) |
| Slugs de serviço | traduzidos | padrão (S2, segue D2) |
| Adaptar oferta ao mercado estrangeiro? | não, só tradução | padrão (Contexto) |
