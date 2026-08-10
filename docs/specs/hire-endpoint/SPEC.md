# Spec: Canal de contratação por agente

> **Roadmap:** `docs/specs/00-roadmap.md` — sprint 5
> **PRD:** F7 (F7.1–F7.6) · **User stories:** US-009
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

Depois de ler o perfil, o catálogo, o currículo e as tools do MCP, o agente que concluiu
que vale conversar não tem para onde ir. O único contato publicado é humano: o e-mail na
home e o formulário de `/contato`, que sequer envia.

`/api/hire` responde **404** em produção. Sem ele, a cadeia "agente lê, agente decide,
agente age" quebra no último passo, que é justamente o que o produto afirma resolver.

Um endpoint público que escreve em banco e dispara e-mail é também a única superfície de
escrita do site, e portanto a única com superfície de abuso real.

## Goals

- Receber briefing de projeto enviado por agente, validado com rigor no servidor.
- Persistir antes de notificar, para que o registro sobreviva à falha de entrega.
- Rejeitar as quatro formas de abuso previstas sem revelar como a rejeição funciona.

## Context

### O que existe

`src/pages/api/health.ts` é a única rota de API, e serve de precedente para
`content-type`, `cache-control: no-store` e formato de resposta.

`src/pages/contato.astro` tem o formulário humano, ainda sem envio. Esta feature **não**
o liga: o canal humano e o canal de agente têm requisitos diferentes, e misturá-los
traria captcha para dentro de um endpoint feito para ser chamado por máquina.

### Infra que ainda não existe

Não há Firestore criado no projeto, nem `firebase-admin` nas dependências, nem chave de
serviço de e-mail no ambiente. Tudo isso entra com esta feature.

O PRD fixa a região do Firestore em `us-east4`, co-locada com o backend.

### Notificação

**Decisão do autor (2026-08-09):** Resend. API HTTP simples, adequada a serverless, com
chave em variável de ambiente do App Hosting.

### Rate limit

RISK-002 do roadmap já registra que a plataforma não oferece rate limit nativo e que a
resposta aceita é um contador em memória **por instância**, assumidamente aproximado.
Com `maxInstances: 2`, o limite efetivo é até o dobro do configurado. Cloud Armor fica
como escalada, fora do MVP.

### Modelo de dados

O PRD define `hire_requests` com `receivedAt`, `from`, `contact`, `brief`, `sourceIp`,
`notified`. Escrita apenas pelo backend; nenhuma regra permite leitura pública.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| `/api/hire` responde 404 em produção | `curl` contra o backend | sim |
| `src/pages/api/` só tem `health.ts` | `find` no repositório | sim |
| `firebase-admin` não é dependência do projeto | `package.json` | sim |
| `firebase-admin` está em 14.2.0 | `npm view` | sim |
| `resend` está em 6.18.1 | `npm view` | sim |
| `maxInstances: 2`, `concurrency: 80` | `apphosting.yaml` | sim |
| O formulário de `/contato` não envia | `src/pages/contato.astro` | sim |
| RISK-002 aceita rate limit por instância como aproximado | `00-roadmap.md` | sim |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um agente envia briefing válido a `/api/hire` ENTÃO o sistema DEVE validar no servidor, persistir no Firestore e só então tentar notificar.
2. **[REQ-002]** QUANDO o payload é inválido ENTÃO o sistema DEVE responder 400 e NÃO PODE persistir nada.
3. **[REQ-003]** QUANDO o corpo excede o limite de tamanho ENTÃO o sistema DEVE rejeitar com 413 **antes** de fazer o parse do JSON.
4. **[REQ-004]** QUANDO o campo honeypot vem preenchido ENTÃO o sistema DEVE responder como se tivesse aceitado, e NÃO PODE persistir nem notificar.
5. **[REQ-005]** QUANDO um mesmo IP excede o limite de requisições na janela ENTÃO o sistema DEVE responder 429.
6. **[REQ-006]** QUANDO a notificação por e-mail falha ENTÃO o registro DEVE permanecer persistido, `notified` DEVE ficar falso e o chamador NÃO PODE receber erro.
7. **[REQ-007]** QUANDO qualquer resposta é emitida ENTÃO ela NÃO PODE conter stack trace, mensagem de driver, caminho de arquivo ou nome de coleção.
8. **[REQ-008]** QUANDO as regras do Firestore são publicadas ENTÃO elas DEVEM negar toda leitura pública de `hire_requests`.
9. **[REQ-009]** QUANDO o endpoint recebe método diferente de POST ENTÃO ele DEVE responder 405.
10. **[REQ-010]** QUANDO a chave do serviço de e-mail está ausente ENTÃO o build ou o boot DEVE falhar de forma explícita, e NÃO PODE degradar em silêncio para "nunca notifica".

### P2 (Should Have)

11. **[REQ-011]** QUANDO o briefing é aceito ENTÃO a resposta DEVE trazer um identificador que o agente possa citar depois.
12. **[REQ-012]** QUANDO o e-mail é enviado ENTÃO ele DEVE conter o briefing íntegro, para que a caixa de entrada baste sem consultar o banco.
13. **[REQ-013]** QUANDO `AGENTS.md` descreve as superfícies ENTÃO ele DEVE documentar `/api/hire`, o formato aceito e os limites.

### P3 (Nice to Have)

14. **[REQ-014]** QUANDO um briefing é persistido ENTÃO o sistema PODE registrar o `User-Agent` declarado, para distinguir agente de script.

## Edge Cases

- **`Content-Length` ausente** — não dá para confiar no cabeçalho; o limite precisa ser
  aplicado na leitura do corpo, não só no cabeçalho declarado.
- **JSON sintaticamente válido, semanticamente vazio** — `brief` com espaços em branco
  é inválido.
- **IP atrás de proxy** — o App Hosting encaminha `x-forwarded-for`; o primeiro valor é
  o cliente, e usar o IP do socket contaria todas as requisições como uma só origem.
- **Instância reciclada** — o contador em memória zera. É a imprecisão que RISK-002 já
  aceita, e precisa estar escrita no código, não descoberta depois.
- **Duas instâncias ativas** — o limite efetivo dobra. Mesma aceitação.
- **Firestore indisponível** — sem persistência não há o que salvar, então aqui o erro
  é honesto: 503, sem enviar e-mail.
- **Honeypot preenchido por agente honesto** — o campo precisa de nome que nenhum
  cliente legítimo preencheria, e não pode ser exigido.

## Architecture Decisions

1. **Persistir antes de notificar** — REQ-006 exige que o registro sobreviva à falha do
   e-mail. A ordem inversa perde o briefing quando o provedor cai, que é justamente
   quando ele importa.
2. **Resend como serviço de e-mail** — Decisão do autor. Alternativa recusada: a
   extensão Trigger Email do Firebase, que satisfaria REQ-006 naturalmente mas exige
   configurar SMTP e instalar extensão, com mais partes móveis fora do repositório.
3. **Limite de tamanho aplicado na leitura, não no `Content-Length`** — Um cliente
   hostil omite ou mente no cabeçalho. REQ-003 fala em rejeitar antes do parse, e é a
   leitura que precisa cortar.
4. **Rate limit em memória, por instância, assumidamente aproximado** — Herdado de
   RISK-002. O código declara a limitação em comentário, para o próximo leitor não
   tratar como garantia.
5. **Honeypot responde sucesso** — Rejeitar com erro ensina o atacante qual campo é a
   armadilha. REQ-004 pede descarte silencioso.
6. **Firestore via `firebase-admin` com credencial padrão do ambiente** — O App Hosting
   já roda com identidade de serviço; chave em arquivo seria segredo desnecessário.
7. **Falha explícita se a chave do e-mail faltar** — REQ-010. O modo de falha silencioso
   ("persistiu, nunca notificou") é o pior possível: o autor só descobre quando perde
   um contato.

## Constraints

- Nenhum reCAPTCHA: contradiz o propósito de ser chamado por agente (PRD, "o que NÃO usar").
- Nenhum Cloud Armor no MVP.
- Nada de e-mail exposto nas rotas de máquina; o endereço de destino vive em variável
  de ambiente, nunca no repositório.
- Resposta em inglês, como as demais superfícies de máquina.
- Nenhuma leitura pública de `hire_requests`, em nenhuma circunstância.

## Out of Scope

- Ligar o formulário humano de `/contato`.
- Painel de leitura dos briefings recebidos.
- Resposta automática ao remetente.
- Anti-abuso além dos quatro casos previstos.
- Deduplicação de briefings repetidos.

## Decisões pendentes do autor

1. **Endereço de destino da notificação** e **domínio verificado no Resend**. O plano
   assume variáveis de ambiente e não fixa valor.
2. **Limite numérico da janela de rate limit**. O plano usa 5 requisições por 10 minutos
   por IP como padrão documentado.
3. **Limite de tamanho do corpo**. O plano usa 16 KB como padrão documentado.
