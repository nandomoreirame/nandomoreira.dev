# Plano: reescrever na voz do Fernando os posts redigidos pelo Claude

> **Criado:** 2026-10-10
> **Skill:** `blog-post-writer` (seção 2, traços de voz tirados do arquivo de 2015 a 2019)

## Por que

Os posts de outubro de 2026 foram redigidos pelo Claude a partir do material do Fernando.
Os fatos são dele e estão certos; a voz não é. Um leitor atento percebe a cadência de
modelo, e o próprio blog defende que o trabalho dele é verificável. Um texto que soa
gerado contradiz isso.

**Princípio da reescrita: os fatos ficam, a voz troca.** Nenhum fato novo entra sem fonte,
e nenhum fato sai sem decisão dele.

## Escopo

| Post | Situação | Prioridade |
|---|---|---|
| `fluxo-rpi-claude-code-grok-codex` | Publicado | 1 |
| `como-construi-meu-site-que-conversa-com-ia-via-mcp` | Publicado | 2 |
| `de-cinco-dias-para-trinta-minutos` | Rascunho, texto completo | 3 |
| `o-falso-verde` | Rascunho escrito (2026-10-11) | 4 (escrever do zero) |
| `memoria-para-agentes-em-4-camadas` | Rascunho escrito (2026-10-11) | 5 (escrever do zero) |
| `revisao-cruzada-entre-modelos` | Rascunho escrito (2026-10-11) | 6 (escrever do zero) |

Fora do escopo: os sete posts republicados do blog da A's Code (são cópia do original
creditado) e o arquivo de 2015 a 2019 (escrito por ele).

## Processo, por post

1. **Inventário de fatos.** Listar cada afirmação do texto atual com a fonte (spec,
   STATE.md, commit, lição do `CLAUDE.md`, currículo). O que não tiver fonte vira pergunta.
2. **Entrevista.** De 3 a 5 perguntas, de uma vez (listadas abaixo para cada post). As
   respostas dele, com as palavras dele, são a matéria-prima da voz.
3. **Reescrita.** Com a skill `blog-post-writer`, usando os traços: honestidade sobre o que
   doeu, número que ele contou, humor curto entre parênteses, opinião assumida. Um ou dois
   traços por seção, sem caricatura.
4. **Conferência de fatos.** Comparar o inventário do passo 1 com o texto novo: nada
   inventado, nada perdido sem decisão.
5. **Revisão dele e publicação.** Post já publicado mantém `slug`, `date` e `publishedAt`,
   para a URL e a ordem não mudarem. Rascunho só perde `draft: true` quando ele pedir.

## Perguntas por post

### 1. Fluxo RPI com três agentes

- Qual foi o projeto ou o erro que te fez separar Research, Plan e Implement? Lembra da cena?
- Quando o Grok parou na tarefa 7 da visão IA, o que você fez na hora? Percebeu de cara ou só pelo STATE.md?
- Com que frequência o Codex acha algo que o Claude não acharia? Tem um caso além do servidor MCP?
- O que te irrita nesse fluxo hoje, o que você mudaria?
- Uma opinião sua que outro dev discordaria (por exemplo, sobre revisão por outro modelo valer mais que teste).

### 2. O site que conversa com IA via MCP

- O que te fez decidir reconstruir o site desse jeito? Teve um momento específico (uma vaga, uma triagem feita por IA)?
- Quando você rodou o `claude mcp add` pela primeira vez contra o site no ar, o que o agente respondeu?
- Qual dos bugs (redirect 200, 403 atrás do proxy, Firestore mudo, honeypot do 1Password) te custou mais tempo, e qual foi o primeiro diagnóstico errado?
- Você acha que MCP em portfólio é demonstração ou tendência? O que você cortaria se começasse hoje?

### 3. De cinco dias para trinta minutos

- Onde exatamente a IA entrou na extração e na pré-normalização? O que ela decide e o que fica com regra fixa?
- Qual foi a primeira base que passou em meia hora? Como o time reagiu?
- O que quebrou durante a migração para o Play Manager?
- O que você faria diferente?
- Confirmar o que pode ser dito publicamente agora que o vínculo terminou (sem cliente, sem dado).

### 4 a 6. Rascunhos só com roteiro

Escrever do zero com a skill, a partir das fontes de cada roteiro, depois de uma
entrevista própria:

- **O falso verde:** em que projeto o `PASS` com sete testes vermelhos apareceu, e quem percebeu?
- **Memória em 4 camadas:** qual esquecimento do agente te fez construir o backbone? Como era o amnesia antes?
- **Revisão cruzada:** um segundo caso, além do servidor MCP, em que o modelo revisor achou um problema real.

## Critério de pronto

- [ ] Toda afirmação tem fonte, e as fontes foram listadas para ele.
- [ ] Nenhum item da lista "o que denuncia texto de máquina" da skill.
- [ ] Pelo menos uma cena contada com as palavras dele (vinda da entrevista).
- [ ] Ele leu e aprovou. A voz é dele quando ele diz que é.
- [ ] `npm run verify` verde e, no caso de publicação, o post aparece em produção.

## Ordem

Os dois publicados primeiro (1 e 2), porque já estão no ar. Depois o rascunho completo (3),
e por fim os roteiros (4 a 6), um por vez, cada um com a sua entrevista.
