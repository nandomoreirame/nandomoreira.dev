# Spec: Anti-spam da newsletter e dos formulários

> **Roadmap:** fora do roadmap (correção de abuso em produção, 2026-11-03)
> **Status:** draft
> **Criado:** 2026-11-03

## Problem Statement

Bots enviam endereços reais (aol, verizon, universidades) para `/api/subscribe`. Cada
endereço novo hoje gera dois efeitos: um aviso "Nova assinatura" para o autor e um
e-mail de boas-vindas para um terceiro que nunca pediu nada. O primeiro enche a caixa
de entrada, o segundo prejudica a reputação do domínio no Resend.

As defesas atuais não pegam esse caso. O honeypot (`hp_ref`) só barra bot que preenche
todos os campos, e este bot envia apenas `email`. O limite de 5 requisições por 10
minutos é por IP e em memória por instância, então um botnet com IPs distintos passa.

## Goals

- Só entra na lista endereço cuja posse foi provada por quem clicou no link.
- Bot que não resolve o captcha não gera e-mail, registro nem aviso.
- Formulário humano passa a exigir verificação, sem mudar o contrato do endpoint de agentes.

## Non-Goals

- Não remover o honeypot nem o limite em memória. As novas defesas são complementares.
- Não migrar para Cloud Armor (escalada já registrada em RISK-002).
- Não limpar automaticamente a lista atual. A limpeza é ação manual do autor (ver Ações manuais).

## Context

### Como o fluxo funciona hoje

`/api/subscribe` (`src/pages/api/subscribe.ts`) chama `handleSubscribe`
(`src/lib/newsletter/handler.ts`). Ele grava em `newsletter_subscribers` com id
`sha256(email)` e, para endereço novo, envia `notify` (aviso ao autor) e `thankYou`
(boas-vindas ao assinante). Redireciona com `303` para a página de origem.

O formulário de `/contato` posta em `/api/hire` com `application/x-www-form-urlencoded`,
e o mapeamento para o payload do agente fica em `src/lib/hire/form.ts`. Agentes enviam
JSON para o mesmo endpoint. O PRD (F7.4) e o `MVP-SCOPE.md` descartaram reCAPTCHA no
canal de agente, porque captcha contradiz um endpoint feito para máquina.

### Restrições do projeto

- JavaScript de cliente só por exceção nomeada no `CLAUDE.md`. O portão
  `tests/design-system/no-client-js.build-test.ts` reprova script fora da lista. O widget
  do Turnstile exige um script de `challenges.cloudflare.com`, então a exceção precisa ser
  registrada antes do uso.
- Política de privacidade (`src/pages/privacidade.astro`) precisa citar qualquer
  processador novo que receba dados pessoais, como Cloudflare Turnstile.
- Firestore com TTL: a política de retenção de IP é 30 dias, e o código já grava
  `expiresAt` em coleções de rede.

## Verified Claims

| Claim | Fonte | Verificado |
|-------|-------|------------|
| A inscrição notifica o autor e envia boas-vindas para endereço novo | `src/lib/newsletter/handler.ts` | sim |
| O honeypot da newsletter é `hp_ref` | `src/lib/hire/form.ts` | sim |
| O limite é em memória, por instância | `src/lib/hire/rate-limit.ts` | sim |
| `/contato` posta em `/api/hire` com form-urlencoded | `src/pages/contato.astro` | sim |
| O portão de JS de cliente reprova script fora da lista | `CLAUDE.md`, seção de portões | sim |
| O `firestore.rules` nega leitura de `newsletter_subscribers` | `firestore.rules` | sim |

## Decisões

- **D1 (double opt-in):** endereço novo fica `pending` até clicar no link. Só então há
  aviso ao autor e boas-vindas. Confirmação é o único jeito de provar posse do e-mail.
- **D2 (captcha só em formulário humano):** todo POST `application/x-www-form-urlencoded`
  exige token Turnstile válido quando `TURNSTILE_SECRET_KEY` está configurada. POST JSON
  (agente) não exige. Verificação fica em um único módulo, `src/lib/security/turnstile.ts`.
- **D3 (Origin):** se o cabeçalho `Origin` vier, precisa estar na allowlist. Ausente é
  aceito, porque agentes e `curl` não o enviam. É uma barreira parcial, declarada assim.
- **D4 (contador no Firestore):** limite de 10 requisições por hora por IP, com contador
  no Firestore para compartilhar a janela entre instâncias. O IP é guardado só como hash
  SHA-256, com `expiresAt` de 30 dias.
- **D5 (exceção de JS):** o widget do Turnstile é carregado só em `/contato` e no card da
  newsletter, por `data-` marcado e sob demanda. A exceção é registrada no `CLAUDE.md`.

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO um endereço novo se inscreve ENTÃO o sistema DEVE gravar com
   status `pending`, enviar e-mail de confirmação com link de uso único e NÃO PODE enviar
   aviso ao autor nem boas-vindas.
2. **[REQ-002]** QUANDO o link de confirmação é aberto com token válido e não expirado
   (7 dias) ENTÃO o sistema DEVE marcar o endereço como `confirmed`, enviar aviso e
   boas-vindas uma única vez e redirecionar para a página de origem com `assinatura=ok`.
3. **[REQ-003]** QUANDO o token é inválido, expirado ou malformado ENTÃO o sistema DEVE
   responder de forma idêntica à de token válido para endereço inexistente, sem revelar
   qual dos casos ocorreu, e NÃO PODE alterar o status de nenhum endereço.
4. **[REQ-004]** QUANDO um POST de formulário chega sem token Turnstile válido ENTÃO o
   sistema DEVE responder `captcha` com `303` e NÃO PODE persistir, enviar e-mail ou
   contar a requisição como inscrição.
5. **[REQ-005]** QUANDO um POST chega com `Origin` fora da allowlist ENTÃO o sistema DEVE
   recusar com `erro` antes de ler o corpo.
6. **[REQ-006]** QUANDO o mesmo IP excede 10 requisições por hora ENTÃO o sistema DEVE
   responder `limite`, com o contador persistido no Firestore, de modo que todas as
   instâncias compartilhem a janela. O limite em memória continua valendo.
7. **[REQ-007]** QUANDO um endereço já `confirmed` se inscreve de novo ENTÃO o sistema DEVE
   responder `ok` sem enviar e-mail. QUANDO um endereço `pending` se inscreve de novo
   ENTÃO o sistema DEVE reenviar a confirmação no máximo uma vez a cada 24 horas.
8. **[REQ-008]** QUANDO a política de privacidade é publicada ENTÃO o sistema DEVE citar o
   Cloudflare Turnstile como processador, a finalidade e o prazo de retenção do hash de IP.
9. **[REQ-009]** QUANDO um registro legado sem campo `status` é lido ENTÃO o sistema DEVE
   tratá-lo como `confirmed`, sem migração destrutiva e sem reenviar nada.

## Requirement Traceability

| REQ | Tarefa do plano | Check |
|-----|-----------------|-------|
| REQ-001 | Task 1, Task 3 | C1 |
| REQ-002 | Task 2, Task 3 | C2 |
| REQ-003 | Task 2 | C3 |
| REQ-004 | Task 6, Task 9, Task 10 | C4 |
| REQ-005 | Task 7, Task 9 | C5 |
| REQ-006 | Task 8, Task 9 | C6 |
| REQ-007 | Task 4 | C7 |
| REQ-008 | Task 11 | C8 |
| REQ-009 | Task 5 | C9 |

## Riscos

- **Usuário sem JavaScript:** sem o script, o widget não aparece e o POST recebe `captcha`.
  Aceito como troca explícita: a inscrição exige JS nesses dois formulários. Precisa de
  aprovação do autor antes da implementação.
- **Cota do Firestore:** cada POST passa a gerar leitura e escrita. Com o tráfego atual é
  desprezível, mas o contador precisa de TTL para não crescer.
- **Entrega do e-mail de confirmação:** se o Resend falhar, o endereço fica `pending` e o
  visitante não recebe nada. A resposta ao visitante não muda, pelo mesmo motivo de hoje.

## Ações manuais do autor (fora do plano)

1. Apagar da coleção `newsletter_subscribers` os endereços que você não reconhece.
   Os documentos sem `status` são tratados como confirmados (REQ-009), então a limpeza
   precisa ser feita antes do deploy, e não depois.
2. Criar a chave do Turnstile no painel da Cloudflare e gravar `TURNSTILE_SECRET_KEY` no
   Secret Manager, com `firebase apphosting:secrets:set`.
3. Conferir no Resend o volume de envios e a taxa de bounce dos últimos 30 dias.
