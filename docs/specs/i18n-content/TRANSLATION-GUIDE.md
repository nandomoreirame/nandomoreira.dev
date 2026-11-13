# Guia de tradução (i18n-content)

Controle de voz e terminologia para as traduções em inglês. Sem revisão humana por
arquivo (C5, REQ-011); o guia e os portões são o único filtro antes do push. Leia
inteiro antes da primeira tradução e releia o glossário antes de cada lote.

Arquivos: `src/content/posts-en/<slug-en>.md` e `src/content/projects-en/<slug>.md`.

## 1. Leitor e voz

- Inglês americano.
- Primeira pessoa.
- Frases curtas, direto, técnico sem jargão de marketing.
- O tom é de engenheiro contando o que fez, o que quebrou e por quê, como no original.
- Não "melhore" o texto: traduza o que está lá, com a mesma ordem de ideias e a mesma ênfase.
- Humor e ironia se mantêm.
- Expressão idiomática pt-BR vira a equivalente em inglês, nunca a tradução literal.

## 2. Proibido

- Travessão (U+2014) e meia-risca (U+2013). Use vírgula, ponto, ponto e vírgula ou parênteses.
- Mudar número, data, versão, nome de comando, de arquivo, de flag ou de produto.
- Acrescentar ou cortar parágrafo.
- Traduzir blocos de código, saídas de terminal e nomes de identificador. Comentários
  dentro de código **também ficam como estão** (o portão de paridade exige bloco
  idêntico byte a byte).

## 3. Frontmatter

Só os campos de `postTranslationSchema` e `projectTranslationSchema`. Campos
estruturais (`date`, `draft`, `art`, `cover.src`, `tech`, links, imagens, flags)
vêm da fonte pt-BR na camada de acesso; copiá-los para a tradução é erro de build
(`.strict()`).

### Post (`posts-en`)

| Campo | Regra |
|---|---|
| `slug` | Título inglês em kebab-case, curto (até 6 palavras), sem artigo inicial. Reservados: `ia`, `en`. |
| `translationOf` | Slug pt-BR da fonte. |
| `title`, `summary` | Traduzidos. |
| `seoTitle` | Opcional, até 60 caracteres. |
| `markers` | Inglês, minúsculas; mínimo 3. |
| `coverAlt` | Obrigatório quando a fonte tem `cover`; descreve a imagem para quem não a vê. |
| `extras` | Cada item até 60 caracteres. |
| `keyPoints` | Cada item até 140 caracteres. |
| `snapshot` | Traduzir `label` e `value`; `version` fica como na fonte. |

### Case (`projects-en`)

| Campo | Regra |
|---|---|
| `translationOf` | Slug do case (o arquivo inglês usa o mesmo slug). |
| `title` | Só quando o título pt-BR tem palavra a traduzir; ausente se o nome do produto já lê igual em inglês. |
| `summary`, `problem`, `decisions`, `outcome` | Traduzidos. |
| `imageAlts` | Um por imagem da fonte, na mesma ordem; descreve a imagem para quem não a vê. |
| `shortcutActions` | Um por atalho da fonte, na mesma ordem. |
| `confidentialMetrics` | Traduzidas; a camada de acesso continua removendo-as na leitura pública. Nunca copie `clientName` para fora do fonte. |

## 4. Links

- Externos ficam idênticos (mesmo destino byte a byte).
- Internos apontam para o par inglês quando existe (mapa de rotas da
  `docs/specs/i18n-foundation` e os posts já traduzidos).
- Sem par, mantêm o link pt-BR.
- Traduza posts na ordem do plano para que os pares já existam quando um post
  mais novo linkar um anterior.

## 5. Glossário

| pt-BR | en |
|---|---|
| agente, agentes | agent, agents |
| fluxo RPI | RPI flow |
| revisão cruzada | cross-model review |
| portão | gate |
| rascunho | draft |
| sessão | session |
| homologação | staging |
| esteira (ETL) | pipeline |
| base (cliente ETL) | dataset |
| caderno aberto | open notebook |
| coceira (lab) | itch |
| Agora (página) | Now |
| Sobre | About |
| Contato | Contact |
| freela | freelance |
| CLT/PJ | full-time / contractor |
| homelab | homelab |
| dotfiles | dotfiles |

## 6. Nomes que não se traduzem

Fernando Moreira Costa, nandomoreira.dev, Claude Code, Grok, Codex, agy, Noctalia,
Niri, CachyOS, Forja, Mousai, BragStack, PortfolioSnap, Croonos, Tumodori, Job Radar,
rdo-solo, Liquid AI (sempre no passado), A's Code, e nomes de clientes que já
aparecem em pt-BR público.

## 7. Checklist por arquivo

Antes de marcar a tradução como pronta:

1. `npx vitest run tests/i18n/translation-parity.test.ts` verde para o arquivo.
2. Nenhum travessão nem meia-risca fora de código.
3. Números conferidos um a um contra a fonte.
4. Links internos conferidos (par inglês quando existe).
5. O post renderiza em `/en/<slug>` no `astro dev` (reinicie o dev server depois de
   criar arquivo novo na coleção; arquivo novo não entra no store de um dev já
   rodando).
