# Spec: Restyle sobre o astro-starter-portfolio

> **Roadmap:** `docs/specs/00-roadmap.md` — fora das seis sprints originais
> **PRD:** F1 (home), F2 (catálogo), F4 (rotas de máquina). Não cria feature nova no PRD
> **Status:** draft
> **Criado:** 2026-08-09

## Problem Statement

O visual atual é terminal escuro com acento âmbar, e o próprio `DESIGN-GUIDELINES.md`
admite que essa é a estética mais batida do portfólio de desenvolvedor: "a
diferenciação aqui não vem da paleta e sim do conteúdo". A estrutura das listagens
também é a mais previsível possível, um grid de cards.

O tema [astro-starter-portfolio](https://github.com/BracoZS/astro-starter-portfolio)
(MIT, Astro 7, Tailwind 4, sem ilhas) resolve os dois com uma linguagem diferente:
listagem em linha com data, título, resumo e tags numa grade de três colunas, e
cabeçalho de seção com sobrescrito monoespaçado e contador. É mais denso, mais
escaneável e mais próximo de "densidade técnica é a estética", que é o princípio 3 do
próprio documento.

## Goals

- Adotar a estrutura e a linguagem de composição do tema, mantendo paleta e tipografia atuais.
- Substituir o grid de cards por listagem em linha nas três listagens do site.
- Separar portfólio de laboratório sem tocar no schema nem recadastrar conteúdo.
- Tirar About da home para página própria, dando espaço ao texto longo.
- Terminar com os sete portões existentes passando, sem relaxar nenhum.

## Context

Sprints 1 a 4 estão concluídas. Existem sete componentes em `src/components/ui/`, três
de catálogo, seis de home, um de layout, e as rotas `/`, `/projetos`,
`/projetos/<slug>`, `/404` mais as quatro de máquina. Tudo isso consome o design system
implementado em `design-system-foundation` e a camada de acesso de `content-data-layer`.

O que se manteria, por decisão do autor no início desta feature: **as cores e as
fontes**. O tema traz `--paper/--ink/--signal`, que mapeiam um a um nos tokens
atuais e por isso não precisam entrar.

> **Revogado em 2026-08-09, pelo autor.** Depois de ver o restyle no ar, ele optou
> por adotar a paleta e a tipografia de um **terceiro** tema, `Exquisitus for
> Starlight` (`anaxite/starlight-theme-exquisitus`): rampa âmbar/mel sobre
> near-black escrita em OKLCH, e o trio Literata (serifada, leitura) + Alegreya
> Sans (sem serifa, registro) + JetBrains Mono (máquina, que já era a do projeto).
> A estrutura de composição continua vindo do `astro-starter-portfolio`; só a
> superfície visual passou a vir do Exquisitus. Ver REQ-027 e REQ-028, a AD-011 e
> a seção de cor e tipografia do `DESIGN-GUIDELINES.md`.

O que se adota do tema: composição do hero, ordem e enxugamento das seções da home,
página `/sobre` própria, rodapé, e sobretudo o padrão de linha da seção "Selected work".

Duas coisas do tema **não** entram: `ClientRouter` de `astro:transitions` e o
`ThemeToggle`. Ambos embarcam JavaScript de cliente e reprovariam
`no-client-js.build-test.ts`; o segundo é irrelevante num site de tema escuro exclusivo.

O padrão de linha exige um dado que a collection não tem hoje: a **data** do projeto,
exibida à esquerda em `MM/AAAA`. Entra como campo novo no schema.

## Verified Claims

| Claim | Source (file:line) | Verified |
|-------|--------------------|----------|
| O tema é MIT, Astro 7, Tailwind 4, sem React/Vue/Svelte nas dependências | `package.json` do repositório do tema | yes (lista completa inspecionada) |
| O tema embarca JS via `ClientRouter` e via o script do `ThemeToggle` | `src/components/BaseHead.astro`, `src/components/ThemeToggle.astro` do tema | yes |
| O `WorkRow` usa grade de três colunas com data, título/resumo e tags/seta | `src/components/WorkRow.astro` do tema | yes |
| O `SectionHeading` usa sobrescrito monoespaçado, `tracking` largo e contador com zero à esquerda | `src/components/SectionHeading.astro` do tema | yes |
| O schema de `projects` não tem campo de data | `src/content/schemas/project.ts` | yes |
| Não existe componente de rodapé no projeto | `src/components/` | yes |
| Os quatro blocos são `ai-tooling`, `ai-product`, `systems-cli`, `professional` | `src/content/blocks.ts` | yes |

## Requirements

### P1 (MVP)

1. **[REQ-001]** QUANDO qualquer superfície é renderizada ENTÃO ela DEVE usar a paleta e as famílias tipográficas atuais, e NÃO PODE introduzir cor ou família vinda do tema.
2. **[REQ-002]** QUANDO uma listagem de itens é renderizada ENTÃO ela DEVE usar o padrão de linha, com título e resumo ao centro, marcadores mais indicador de avanço à direita, e data à esquerda quando o item tiver uma para exibir.
3. **[REQ-003]** QUANDO uma linha de listagem é renderizada em viewport abaixo de 640px ENTÃO o resumo DEVE ser omitido, e abaixo de 768px os marcadores DEVEM ser omitidos, preservando título e indicador.
4. **[REQ-022]** QUANDO um item de listagem não expõe data ENTÃO a linha DEVE colapsar a coluna de data em vez de reservar espaço vazio, mantendo o alinhamento das demais colunas dentro da mesma listagem.
4. **[REQ-004]** QUANDO um título ou resumo excede a largura disponível ENTÃO ele DEVE ser truncado sem quebrar a grade nem gerar scroll horizontal.
5. **[REQ-005]** QUANDO um cabeçalho de seção é renderizado ENTÃO ele DEVE apresentar um sobrescrito monoespaçado em caixa alta e, quando houver contagem, o total com zero à esquerda em duas casas.
6. **[REQ-006]** QUANDO um projeto é cadastrado ENTÃO ele DEVE declarar uma data, e a listagem DEVE ordenar do mais recente para o mais antigo.
7. **[REQ-007]** QUANDO a home é renderizada ENTÃO ela DEVE apresentar hero, portfólio, laboratório, trajetória, serviços, sobre resumido e contato, nessa ordem, mantendo exatamente um CTA primário. *(Emendado em 2026-08-09: a seção única "trabalho selecionado" virou duas, uma por coleção — ver REQ-034.)*
8. **[REQ-008]** QUANDO uma seção de coleção da home é renderizada ENTÃO ela DEVE listar no máximo cinco itens **da sua própria coleção**, priorizando os destacados, e oferecer link para a listagem correspondente com o total.
9. **[REQ-009]** QUANDO um visitante acessa `/sobre` ENTÃO o sistema DEVE apresentar a bio completa, a stack e um canal de contato, derivados do perfil.
10. **[REQ-010]** QUANDO a seção sobre da home é renderizada ENTÃO ela DEVE trazer um resumo curto e um link para `/sobre`, sem duplicar o texto no código.
11. **[REQ-011]** QUANDO o catálogo é apresentado ENTÃO ele DEVE separar portfólio (`professional`) de laboratório (`ai-tooling`, `ai-product`, `systems-cli`), sem alterar o schema nem o cadastro existente. *(Emendado em 2026-08-09: o critério passou a ser trabalho de cliente contra produto próprio. A divisão anterior deixava dois SaaS próprios em portfólio e um terceiro em laboratório, sem nada que os separasse.)*
12. **[REQ-012]** QUANDO um visitante acessa `/portfolio` ou `/lab` ENTÃO o sistema DEVE listar os projetos do agrupamento correspondente no padrão de linha.
13. **[REQ-013]** QUANDO qualquer página é renderizada ENTÃO ela DEVE apresentar um rodapé com aviso de direito autoral, canais sociais derivados do perfil e link de retorno ao topo.
14. **[REQ-014]** QUANDO o rodapé é renderizado ENTÃO ele NÃO PODE conter crédito ao autor do tema nem link para o X.
15. **[REQ-015]** QUANDO o build conclui ENTÃO os sete portões existentes DEVEM continuar passando sem alteração de critério, incluindo zero JavaScript de cliente e ausência de valor arbitrário.
16. **[REQ-016]** QUANDO o tema exige um valor tipográfico ou de espaçamento fora da escala atual ENTÃO ele DEVE ser acrescentado como token nomeado, e NÃO PODE aparecer como valor arbitrário em componente.
17. **[REQ-017]** QUANDO as rotas mudam ENTÃO `sitemap.xml` e `llms.txt` DEVEM refletir o novo conjunto, e a rota antiga `/projetos` DEVE redirecionar em vez de responder 404.
18. **[REQ-023]** QUANDO qualquer página é renderizada ENTÃO o container DEVE limitar-se a 768px, substituindo os 1200px de `design-system-foundation`.
19. **[REQ-024]** QUANDO o cabeçalho é renderizado ENTÃO ele DEVE apresentar o nome do perfil como marca à esquerda, ligado à home, e a navegação alinhada à borda oposta.
20. **[REQ-025]** QUANDO o cabeçalho ou o rodapé é renderizado ENTÃO sua régua DEVE atravessar a viewport inteira, com o container aplicado à linha interna.
21. **[REQ-026]** QUANDO o cabeçalho é renderizado ENTÃO ele NÃO PODE conter alternador de tema, preservando o tema escuro exclusivo e o zero JavaScript de cliente.
22. **[REQ-027]** QUANDO um token de cor é declarado ENTÃO ele DEVE vir da rampa escura do `Exquisitus for Starlight`, convertida de OKLCH para hex sRGB, e nenhum par pode cair abaixo do contraste que tinha antes da troca.
23. **[REQ-028]** QUANDO uma superfície é tipografada ENTÃO ela DEVE usar Literata para leitura e título de peso, Alegreya Sans para registro e interface, e JetBrains Mono para voz de máquina, servidas do próprio domínio.
24. **[REQ-029]** QUANDO o cabeçalho apresenta a marca ENTÃO ele DEVE usar o campo `wordmark` do perfil quando houver, e o nome legal DEVE permanecer nas superfícies de máquina, no currículo e no aviso de direito autoral.
25. **[REQ-030]** QUANDO o visitante rola a página ENTÃO o cabeçalho DEVE permanecer fixo no topo, com fundo translúcido e desfoque, sem custar JavaScript de cliente.
26. **[REQ-031]** QUANDO uma tag global limita o transbordo horizontal ENTÃO ela DEVE usar `clip`, e NÃO PODE usar `hidden`, que criaria contêiner de rolagem e quebraria o cabeçalho fixo.
27. **[REQ-032]** QUANDO um link aponta para uma âncora da mesma página ENTÃO a rolagem DEVE ser suave e parar abaixo do cabeçalho fixo, respeitando `prefers-reduced-motion`.
28. **[REQ-033]** QUANDO um visitante acessa `/contato` ENTÃO o sistema DEVE apresentar um formulário rotulado e limitado em tamanho, com o envio desligado e declarado como tal, mantendo o canal direto na mesma página.
29. **[REQ-034]** QUANDO a home apresenta cases ENTÃO ela DEVE separar portfólio de laboratório em duas seções, com portfólio primeiro, cada uma com sua âncora, seu contador e seu link para a listagem correspondente.
30. **[REQ-035]** QUANDO uma seção de coleção recebe um case de outra coleção ENTÃO a renderização DEVE falhar, porque a linha montaria um link para rota inexistente.

### P2 (Should Have)

18. **[REQ-018]** QUANDO o hero é renderizado ENTÃO ele DEVE exibir a disponibilidade declarada no perfil como indicador de estado, com marcador visual acompanhado de rótulo textual.
19. **[REQ-019]** QUANDO a página `/sobre` é renderizada ENTÃO ela DEVE apresentar a stack como lista de rótulos, reutilizando o componente de tecnologia existente.
20. **[REQ-020]** QUANDO uma linha é focada por teclado ENTÃO o indicador de foco DEVE ser visível com o mesmo contraste do restante do site.

### P3 (Nice to Have)

21. **[REQ-021]** QUANDO uma linha recebe ponteiro ou foco ENTÃO o indicador de avanço PODE deslocar-se, respeitando `prefers-reduced-motion`.

## Edge Cases

- **Projeto sem data no cadastro atual** — Só existe um projeto cadastrado (`forja`). Tornar o campo obrigatório quebra o build até ele receber data, o que é o comportamento correto e detectado imediatamente.
- **Listagem com menos de cinco itens na home** — Renderiza os que houver e omite o link "ver todos" quando não há mais nada além do exibido.
- **Agrupamento vazio** — `/portfolio` ou `/lab` sem nenhum projeto renderiza o estado vazio explícito, como o catálogo já faz hoje, em vez de página em branco.
- **Título muito longo em 320px** — Truncado por REQ-004. A grade tem coluna de data fixa, então o título é a coluna elástica.
- **Projeto sem tecnologias** — Impossível: o schema exige ao menos uma.
- **Rota `/projetos` já indexada** — Redirecionar, não 404. Um 404 numa rota que já está no `sitemap.xml` publicado desperdiça a descoberta que `aeo-base` construiu.
- **Case confidencial na listagem** — A camada de acesso já redige antes de entregar; a linha renderiza o que recebeu, sem lógica própria.
- **`prefers-reduced-motion` ativo** — O deslocamento do indicador é suprimido pela regra global que já existe, sem código adicional.

## Architecture Decisions

1. **Reimplementar o tema dentro do sistema, não instalá-lo por cima** — Os sete portões e os tokens são o ativo do projeto; o tema é referência de composição. Alternativa descartada: copiar os componentes do tema e adaptar os tokens depois, que inverteria a dependência e quebraria os portões durante a transição.
2. **Manter paleta e fontes** — Decisão explícita do autor. O acento periwinkle do tema e a Astro Fonts API ficam de fora. *(Revogada em 2026-08-09: ver AD-011. O periwinkle e a Astro Fonts API seguem de fora; o que mudou foi a adoção da paleta e do trio tipográfico do Exquisitus.)*
3. **Separação portfólio/laboratório por reagrupamento, não por campo novo** — Os quatro blocos já carregam a informação. Um campo novo exigiria recadastrar tudo e criaria duas taxonomias concorrentes para o mesmo fato.
4. **Data como campo obrigatório** — O padrão de linha exibe data com destaque, e um campo opcional produziria linhas visualmente inconsistentes. Um case sem data também é um case sem contexto temporal, o que enfraquece a evidência.
5. **`/sobre` como página, com resumo na home** — O tema faz assim e o texto longo ganha espaço. A home mantém um resumo curto, derivado do mesmo campo do perfil, para não duplicar conteúdo.
6. **Rodapé novo, não adaptado** — Não existe rodapé hoje. Entra derivando os canais do perfil, como o resto do site já faz.
7. **Sem `ClientRouter` e sem `ThemeToggle`** — Ambos embarcam JavaScript de cliente. View Transitions, se desejadas depois, entram pela regra `@view-transition` em CSS puro, que não custa JavaScript. *(Reconfirmado pelo autor em 2026-08-09, ao comparar o resultado com a referência: o botão do alternador foi descartado de novo, em vez de relaxar o portão. Um alternador funcional exigiria `localStorage` para sobreviver à troca de página, além de uma paleta clara inteira validada em contraste, e o custo não se paga num site de tema único.)*
9. **Container reduzido a 768px** — A referência limita toda superfície a `max-w-3xl`; os 1200px herdados de `design-system-foundation` produziam uma linha 1,62 vez mais larga. Como paleta, tipografia e componentes já estavam corretos, a largura era o que restava fazendo o resultado parecer outro layout. Emenda REQ-015 daquela feature. Alternativa descartada: manter 1200px e reduzir só as listagens, que criaria duas medidas concorrentes na mesma página.
10. **Régua da borda separada do container** — Cabeçalho e rodapé carregam a borda; a linha interna carrega o `max-w-page`. Alternativa descartada: um único wrapper em volta de tudo, que era o arranjo anterior e recortava as duas réguas na medida do texto.
11. **Superfície visual do Exquisitus, estrutura do `astro-starter-portfolio`** — Os dois temas entram por portas diferentes e não competem: o primeiro dá cor e tipografia, o segundo dá composição. A rampa é convertida de OKLCH para hex porque o portão de contraste parseia hex; manter OKLCH exigiria ensinar `contrastRatio` a converter, e o ganho perceptual do OKLCH está na *autoria* da rampa, que já foi feita a montante. Alternativa descartada: adotar também o tamanho base de 106,25% e a medida de ~74ch do Exquisitus, que são calibrados para coluna de documentação e brigariam com o container de 768px.
12. **Trio de fontes na distribuição do tema estrutural** — O Exquisitus é tema de documentação e põe serifada no corpo, sem serifa nos títulos. Num portfólio a coluna de leitura é pequena, e o `astro-starter-portfolio` marca como serifada justamente a marca, o `h1` do hero e os títulos de case. Adotado o *pareamento* do Exquisitus na *distribuição* do estrutural. Alternativa descartada: inverter (títulos em Alegreya Sans), que deixaria a Literata quase invisível na home.
13. **`/contato` com formulário, sem contrariar o PRD** — O PRD (linha 138) exige "pelo menos um canal direto de contato, sem formulário **obrigatório**", o que proíbe o formulário ser o único caminho, não sua existência. A home mantém os canais diretos e ganhou um ponteiro para a página; `/contato` traz o formulário **e** repete o canal direto. A copy da home, que dizia "Sem formulário. Escreva direto.", passou a dizer onde o formulário está, porque a frase antiga passaria a ser falsa. Alternativa descartada: substituir a seção de contato da home pela página, que deixaria a home sem canal direto e violaria a linha 138.
14. **Envio desligado com o controle desabilitado, não com um botão mudo** — O `<form>` fica sem `action` e sem `method`, e o submit vem `disabled` com a razão escrita ao lado. Um botão habilitado que não faz nada, ou um `action` apontando para a rota futura `/api/hire` (que ainda não existe), produziriam falha silenciosa ou 404 na cara de quem escreveu a mensagem. Os `maxlength` já entram agora para que o endpoint da sprint 5 nunca encontre um campo sem limite.
8. **Tokens novos em vez de valores arbitrários** — O `tracking` largo do sobrescrito e o tamanho reduzido das tecnologias viram tokens nomeados, mantendo REQ-002 do design system intacto.

## Constraints

- ~~Paleta e famílias tipográficas atuais são inalteráveis.~~ *(Revogada em 2026-08-09.)* A paleta e as três famílias agora vêm do Exquisitus. **O que permanece inalterável é o portão**: qualquer par de cor continua obrigado a passar 4,5:1, e a troca não pode reduzir contraste nenhum abaixo do que já era.
- Zero JavaScript de cliente, tema escuro exclusivo, motion contido, WCAG AA: todos permanecem invioláveis.
- Os sete portões existentes não podem ser relaxados para acomodar o tema.
- O schema de `projects` só muda para acrescentar a data; os demais campos ficam.
- `project-catalog`, `home-page` e `aeo-base` estão concluídas e consomem os componentes atuais: a API dos componentes reutilizados deve ser preservada ou as três features atualizadas junto.
- O tema é MIT: a atribuição sai do rodapé, mas a licença permanece no repositório.

## Out of Scope

| Item | Reason |
|------|--------|
| Notas | Feature própria (`notes`), F14 promovida a P0 por decisão do autor. Esta feature só entrega o padrão de linha que a listagem de notas consome |
| Paleta OKLCH | Ideia registrada do EmDash Starter; não pedida e mexeria nas cores, que devem ficar |
| Astro Fonts API | As fontes atuais são locais e ficam |
| View Transitions | Só entrariam em CSS puro; não pedidas |
| `@tailwindcss/typography` | O `Prose` atual já resolve a medida de linha |
| Conteúdo dos 8 cases | Sprint 3, `case-content` |
| CSP e Playwright | Ideias registradas do EmDash; candidatas a `launch-hardening` |

## Test Strategy

- **Unit:** o agrupamento portfólio/laboratório a partir dos quatro blocos, e a formatação da data para `MM/AAAA`. São as duas decisões de lógica da feature.
- **Integration:** renderização da linha via `experimental_AstroContainer`, cobrindo truncamento, omissão responsiva de resumo e tecnologias, e presença do indicador de foco. Renderização do cabeçalho de seção com e sem contagem, conferindo o zero à esquerda.
- **Integration:** home com a nova ordem de seções, o teto de cinco itens e o link para a listagem completa; `/sobre` derivando bio, stack e contato do perfil.
- **Contract:** o rodapé não contém `BracoZS` nem link para o X, e contém os canais do perfil. É uma remoção pedida explicitamente, então vira asserção e não conferência visual.
- **Gates:** os sete portões atuais rodam sem alteração. O de valor arbitrário é o que mais provavelmente acusa durante a transição, e é onde REQ-016 se prova.
- **Manual, uma vez:** leitura em 320px real e navegação por teclado nas três listagens.

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Paleta e fontes atuais preservadas | P1 | Pending |
| REQ-002 | Listagem no padrão de linha | P1 | Pending |
| REQ-003 | Omissão responsiva de resumo e tecnologias | P1 | Pending |
| REQ-004 | Truncamento sem quebrar a grade | P1 | Pending |
| REQ-005 | Cabeçalho com sobrescrito e contador | P1 | Pending |
| REQ-006 | Data obrigatória e ordenação decrescente | P1 | Pending |
| REQ-007 | Ordem das seções da home, um CTA primário | P1 | Pending |
| REQ-008 | Teto de cinco itens e link para o total | P1 | Pending |
| REQ-009 | Página `/sobre` derivada do perfil | P1 | Pending |
| REQ-010 | Resumo na home com link, sem duplicar texto | P1 | Pending |
| REQ-011 | Separação portfólio/laboratório por reagrupamento | P1 | Pending |
| REQ-012 | Rotas `/portfolio` e `/lab` | P1 | Pending |
| REQ-013 | Rodapé com direitos, sociais e topo | P1 | Pending |
| REQ-014 | Sem crédito ao autor do tema e sem X | P1 | Pending |
| REQ-015 | Sete portões continuam passando | P1 | Pending |
| REQ-016 | Token nomeado em vez de valor arbitrário | P1 | Pending |
| REQ-017 | Rotas de máquina atualizadas e `/projetos` redirecionando | P1 | Pending |
| REQ-018 | Disponibilidade no hero | P2 | Pending |
| REQ-019 | Stack como rótulos em `/sobre` | P2 | Pending |
| REQ-020 | Foco visível na linha | P2 | Pending |
| REQ-021 | Deslocamento do indicador | P3 | Pending |
| REQ-022 | Coluna de data colapsa quando o item não tem data | P1 | Pending |
| REQ-023 | Container em 768px | P1 | Done |
| REQ-024 | Marca à esquerda, navegação à direita no cabeçalho | P1 | Done |
| REQ-025 | Régua de cabeçalho e rodapé atravessa a viewport | P1 | Done |
| REQ-026 | Nenhum alternador de tema no cabeçalho | P1 | Done |
| REQ-027 | Paleta do Exquisitus, sem perda de contraste | P1 | Done |
| REQ-028 | Trio Literata / Alegreya Sans / JetBrains Mono | P1 | Done |
| REQ-029 | Marca do cabeçalho separada do nome legal | P1 | Done |
| REQ-030 | Cabeçalho fixo, translúcido, com desfoque | P1 | Done |
| REQ-031 | `overflow-x: clip` em vez de `hidden` | P1 | Done |
| REQ-032 | Rolagem suave até âncora, abaixo do cabeçalho | P2 | Done |
| REQ-033 | `/contato` com formulário desligado e canal direto | P2 | Done |
| REQ-034 | Home separa portfólio de laboratório | P1 | Done |
| REQ-035 | Seção rejeita case de outra coleção | P1 | Done |
