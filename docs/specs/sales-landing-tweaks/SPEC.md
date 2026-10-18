# Spec: sales-landing-tweaks

> **Status:** aprovada em 2026-10-18 (decisões tomadas com o Fernando na conversa)
> **Profundidade:** standard
> **Depende de:** `sales-landing` (implementada; revisão final em aberto)

## Objetivo

Ajustes pedidos pelo Fernando depois de revisar a landing em `contrate.nandomoreira.local` e
`contrate.nandomoreira.home`, antes do primeiro deploy em produção: efeitos do hero da home,
header fixo que encolhe, botões flutuantes, prazo de entrega, duas ferramentas a mais, foto,
galeria e cards.

## Decisões

| Tema | Decisão | Descartado e por quê |
|---|---|---|
| Efeitos | As páginas de vendas incluem o `PointerField`, o script único do site (já permitido em toda página pelo portão, até 1,5 KB gzip). O REQ-031 da `sales-landing` passa de "nenhum script" para "só o script do ponteiro" | Só CSS (sem acompanhar o mouse; header encolhendo só em parte dos navegadores) |
| Prazo | "5 a 30 dias úteis de trabalho, conforme o projeto" no hero e nas respostas "Quanto tempo leva?" (landing e Site institucional); o prazo exato continua vindo da proposta | Prazo por serviço (faixas não informadas); só no FAQ |
| Ferramentas | "Mercado Pago / Stripe: o caixa" e "Resend: o carteiro" (9 cards, grade 3x3) | Segurança e análise |
| Detalhe | Só o link "Entender em detalhes" sai, por uma constante; a página `/servicos/site-institucional` continua no ar e no sitemap | Despublicar a rota |
| Botão Conversar compacto | No header encolhido, `min-h-9` (36px): acima dos 24px do WCAG 2.2 AA (2.5.8); o REQ-032 da `sales-landing` (44px) deixa de valer só para esse estado | Manter 44px (não encolhe de verdade) |
| Cor do WhatsApp | Tokens `--color-whatsapp` (#25d366) e `--color-whatsapp-foreground` (#0b0b0c), com o par no portão de contraste; ícone escuro, porque branco sobre esse verde dá 1,98:1 | Ícone branco (reprova contraste) |
| Voltar ao topo | Sempre visível, âncora `#topo` sem script | Aparecer só depois de rolar (dependeria de JS para algo que funciona sem) |

## Requisitos

- **REQ-001** QUANDO a seção "Quem vai construir" renderizar em tela de `sm` para cima ENTÃO a foto DEVE ocupar a altura inteira do conteúdo do card, cortada por `object-cover`; no celular continua acima do texto.
- **REQ-002** QUANDO a galeria "Outros trabalhos" renderizar ENTÃO o Gatman Corp NÃO DEVE aparecer, e as imagens `gatman-corp*.webp` DEVEM sair de `public/servicos/trabalhos/`.
- **REQ-003** QUANDO as páginas de vendas renderizarem ENTÃO o `<body>` DEVE ter `data-pointer-field` e o layout DEVE incluir o `PointerField`, para o fundo de pontos com brilho que segue o mouse; o portão de JavaScript de cliente DEVE seguir verde (só o script do ponteiro).
- **REQ-004** QUANDO o mouse se mover sobre a página ENTÃO a ilustração do hero DEVE reagir como o retrato da home (`data-parallax` e `data-tilt`), com as três janelas em profundidades diferentes (`--depth`) para dar parallax entre camadas; sem JS, em toque ou com movimento reduzido, fica parada.
- **REQ-005** QUANDO o visitante rolar a página ENTÃO o header DEVE ficar fixo no topo (`sticky`, `data-site-header`) e, com `data-scrolled`, encolher a altura, ganhar fundo com desfoque e encolher o botão Conversar.
- **REQ-006** QUANDO a landing renderizar ENTÃO o hero DEVE mostrar "Entrega em 5 a 30 dias úteis" entre os destaques, e as respostas "Quanto tempo leva?" (landing) e "Quanto tempo leva para ficar pronto?" (Site institucional) DEVEM dizer "de 5 a 30 dias úteis de trabalho, conforme o projeto", mantendo que o prazo exato vem na proposta.
- **REQ-007** QUANDO qualquer página de vendas renderizar ENTÃO DEVE haver, fixos no canto inferior direito, um link de WhatsApp (pelo `/go/contato/whatsapp`, com rótulo e dica "Fale comigo no WhatsApp" visível no hover e no foco) e um link "Voltar ao topo" (`#topo`), ambos com ícone, alvo de 44px e foco visível, sem script.
- **REQ-008** QUANDO a seção de ferramentas renderizar ENTÃO DEVE listar também "Mercado Pago / Stripe" (o caixa) e "Resend" (o carteiro), 9 no total, e o texto de abertura DEVE deixar de dizer que tudo é Firebase.
- **REQ-009** QUANDO o mouse passar sobre um card das páginas de vendas ENTÃO a borda DEVE clarear suavemente (`hover:border-border-strong` com transição), sem ser o único sinal de algo interativo.
- **REQ-010** QUANDO os serviços renderizarem ENTÃO o link "Entender em detalhes" NÃO DEVE aparecer enquanto `SHOW_DETAIL_LINKS` (em `src/lib/sales/catalog.ts`) for `false`; a página de detalhe continua respondendo 200.
- **REQ-011** QUANDO uma página de vendas citar os anos de carreira ENTÃO o número DEVE ser calculado no servidor, a cada requisição, como `ano atual - 2011`, e exibido como `+N anos` (em 2026: `+15 anos`); a citação literal do depoimento do Edson Luiz ("há pelo menos 15 anos") não muda.
- **REQ-012** QUANDO o perfil for lido pela camada de acesso (`src/lib/content/profile.ts`) ENTÃO o marcador `{anos}` na bio e na trajetória DEVE virar `+N anos` pelo mesmo cálculo, para que home, `/sobre`, currículo e rotas de máquina mostrem o mesmo número; o contexto "Desde 2010" da trajetória passa a "Desde 2011". Pedido do Fernando em 2026-10-18.
- **REQ-013** QUANDO o card Sobre renderizar ENTÃO DEVE haver o link "Saiba mais sobre mim" com seta para https://nandomoreira.dev/sobre (URL absoluta, porque o subdomínio de vendas não tem /sobre). Pedido do Fernando em 2026-10-18.

## Fora do escopo

- Despublicar a página de detalhe ou tirá-la do sitemap.
- Os achados abertos da revisão da `sales-landing` (o `inputmode` do campo de contato e o teste do middleware): ficam no `docs/reviews/sales-landing.md`.

## Grilling Log

| # | Decisão | Resolução | Motivo |
|---|---|---|---|
| 1 | Script nas páginas de vendas | Reusar o `PointerField` | Mesmo efeito da home, já dentro da exceção nomeada do projeto |
| 2 | Onde vai o prazo | Hero + FAQ | Faixa geral dada pelo Fernando; sem inventar prazo por serviço |
| 3 | Ferramentas novas | Pagamentos e e-mail | Fazem parte de loja e produto, e o Resend é o que este site usa |
| 4 | Página de detalhe | Só some o link | Escolha do Fernando para o primeiro deploy |
| 5 | Botão compacto | 36px no estado encolhido | "Encolher" de fato, ainda acima do mínimo AA |
| 6 | Verde do WhatsApp | Token próprio com ícone escuro | Branco no verde reprova contraste |
| 8 | Anos de carreira | `+N anos` calculado de 2011 no servidor, nas páginas de vendas e no perfil (pela camada de acesso) | Não envelhece; o perfil dizia "desde 2010", corrigido para 2011 |
| 7 | Voltar ao topo | Sempre visível | Funciona sem JS |
