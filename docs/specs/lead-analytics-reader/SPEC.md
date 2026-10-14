# Spec: Leitor dos dados de leads (`lead-analytics-reader`)

> **Status:** aprovada (2026-10-14)
> **Origem:** pedido do autor, continuação do `lead-analytics` (o leitor ficou de fora daquela spec de propósito)
> **Profundidade:** standard

## Problem Statement

O `lead-analytics` grava visitas, cliques de saída, downloads de currículo, briefings e
chamadas MCP no Firestore, mas não há como ler esses dados além do console do Google Cloud
e do percurso que chega no e-mail de cada lead. Sem um leitor, as perguntas que motivaram a
medição ficam sem resposta: onde divulgar, o que escrever, quais visitas viram contato e
quanto os agentes usam o MCP.

## Goals

- Ver as visitas chegando com no máximo 30 s de atraso, ou 5 s no modo tempo real.
- Ver o funil (chegou, viu evidência, agiu, virou lead) para hoje, 7 dias e 30 dias, e quanto cada canal de chegada converte.
- Abrir um lead e ver quem é, o que pediu e o que leu antes de entrar em contato.
- Ficar dentro do plano gratuito do Firestore em uso normal: algumas centenas de leituras por sessão.

## Non-Goals

- Escrever no Firestore, de qualquer forma. A TUI é só leitura.
- Publicar ou expor os dados: roda só na máquina do autor.
- Períodos maiores que 30 dias (os totais diários duram 24 meses, mas ficam para depois).

## Context

- Os dados seguem o Data Contract de `docs/specs/lead-analytics/SPEC.md`: `analytics_events` (evento bruto, TTL de 30 dias) e `analytics_daily/<YYYY-MM-DD>` (contadores do dia, TTL de 24 meses).
- O código do visitante (`visitor`) é um HMAC com chave diária: o mesmo visitante tem códigos diferentes em dias diferentes. O funil por pessoa só existe dentro de um dia.
- Evento bruto só existe para `human` e `ai_agent`; os robôs entram apenas nos contadores do dia.
- Conversões de currículo e briefing guardam o id do registro em `conversion.refId`, que aponta para `cv_downloads` ou `hire_requests`.
- O autor já tem Rust 1.96 e usa ratatui 0.30 com crossterm 0.29 (edition 2024) no `tumodori`.
- A máquina já tem credencial padrão do gcloud (ADC) em `~/.config/gcloud/application_default_credentials.json`.
- O build do site (App Hosting) roda só `npm`; código Rust em `tools/` não entra nele.

## Verified Claims

| Claim | Source (file:line) | Verified |
|---|---|---|
| Coleção de eventos brutos é `analytics_events` | `src/lib/analytics/store.ts:5` (`EVENTS_COLLECTION`) | yes |
| Coleção de contadores diários é `analytics_daily` | `src/lib/analytics/store.ts:6` (`DAILY_COLLECTION`) | yes |
| Só `human` e `ai_agent` geram evento bruto | `src/lib/analytics/event.ts:179` (`keepsRawEvent`) | yes |
| `pathKey`/`targetKey` são `encodeURIComponent` com `.` como `%2E` e `__` inicial como `%5F_` | `src/lib/analytics/event.ts:138` (`counterKey`) | yes |
| Downloads de currículo ficam em `cv_downloads` com `name`, `email`, `receivedAt` | `src/lib/cv/download.ts:37` (`CV_COLLECTION`), `src/lib/cv/download.ts:89` (`toCvDownload`) | yes |
| Briefings ficam em `hire_requests` com `from`, `contact`, `brief`, `company`, `budget`, `interests`, `receivedAt` | `src/lib/hire/firestore.ts:38` (`HIRE_COLLECTION`), `src/lib/hire/store.ts:50` (`toStoredBriefing`) | yes |
| Consulta com filtro de intervalo num único campo (`at > X`) usa o índice automático, sem índice composto | regra do Firestore | assumption |
| A API REST do Firestore aceita credencial de usuário (ADC) desde que haja projeto de cota | comportamento das APIs Google | assumption |

## Requirements

### P1 (MVP)

1. [REQ-001] QUANDO a TUI abre ENTÃO o sistema DEVE obter um token pela credencial padrão do gcloud (ADC) antes de desenhar qualquer tela; sem credencial válida (ausente, expirada ou revogada) DEVE rodar `gcloud auth application-default login` no próprio terminal, esperar o fim e continuar; se o login falhar ou for cancelado DEVE sair com a mensagem do erro.
2. [REQ-002] QUANDO a credencial vem sem projeto de cota ENTÃO o sistema DEVE rodar `gcloud auth application-default set-quota-project <projeto>` antes da primeira leitura.
3. [REQ-003] QUANDO a TUI está aberta ENTÃO o sistema DEVE atualizar a cada 30 s, buscando só os eventos com `at` posterior ao último visto e o documento `analytics_daily` de hoje.
4. [REQ-004] QUANDO o autor aperta `r` ENTÃO o sistema DEVE alternar entre atualização a cada 30 s e o modo tempo real de 5 s, e a barra de status DEVE mostrar qual está ativo.
5. [REQ-005] QUANDO o modo de 5 s está ligado há 30 minutos ENTÃO o sistema DEVE voltar para 30 s e avisar na barra de status ("tempo real desligado após 30 min"); apertar `r` de novo religa e recomeça a contagem.
6. [REQ-006] QUANDO a aba Ao vivo está aberta ENTÃO o sistema DEVE mostrar o feed de eventos (horário de São Paulo, classe, 6 primeiros caracteres do visitante, página, canal, país), com conversões e chamadas MCP em destaque, e um cabeçalho com os totais de hoje lidos do contador do dia.
7. [REQ-007] QUANDO a aba Funil está aberta ENTÃO o sistema DEVE contar, para o período escolhido e só para visitantes `human`, os pares (dia, visitante) em cada etapa: chegou (alguma `pageview`), viu evidência (página de evidência), agiu (conversão `outbound`), virou lead (conversão `cv` ou `hire`); DEVE mostrar a quantidade e a porcentagem de passagem da etapa anterior, no total e numa tabela por canal de chegada.
8. [REQ-008] QUANDO o sistema classifica uma página ENTÃO página de evidência DEVE ser um case (`/portfolio/<slug>` ou `/lab/<slug>`) ou um post (caminho de um único segmento fora da lista de páginas fixas: `/`, `/sobre`, `/contato`, `/now`, `/setup`, `/mcp`, `/privacidade`, `/curriculo`, `/posts`, `/portfolio`, `/lab`, `/eu`).
9. [REQ-009] QUANDO o sistema calcula o canal de chegada de um visitante num dia ENTÃO DEVE usar o canal da primeira `pageview` daquele dia que não seja `internal`; sem nenhuma, `direct`.
10. [REQ-010] QUANDO o autor aperta `[` ou `]` ENTÃO o sistema DEVE trocar o período das abas Funil, Tráfego e MCP entre hoje, 7 dias e 30 dias.
11. [REQ-011] QUANDO a aba Tráfego está aberta ENTÃO o sistema DEVE somar os contadores diários do período e mostrar as páginas mais vistas, canais, países e destinos do `/go` mais clicados, com as chaves decodificadas (`counterKey` revertido).
12. [REQ-012] QUANDO a aba MCP está aberta ENTÃO o sistema DEVE somar os contadores diários do período e mostrar chamadas por tool, por cliente e por método, mais `conversions.mcp` (só `tools/call`).
13. [REQ-013] QUANDO o autor aperta `Enter` sobre um lead na aba Funil ENTÃO o sistema DEVE buscar o registro por `conversion.refId` em `cv_downloads` ou `hire_requests` e mostrar nome, contato, briefing (quando houver) e as páginas que aquele visitante viu naquele dia, sem gravar nada em disco.
14. [REQ-014] QUANDO uma leitura falha durante o uso (rede, cota, token) ENTÃO o sistema DEVE manter os últimos dados na tela, mostrar o erro na barra de status e tentar de novo no ciclo seguinte, sem fechar.
15. [REQ-015] QUANDO o autor aperta `q` ou Ctrl-C, ou o programa entra em pânico, ENTÃO o sistema DEVE restaurar o terminal (sair da tela alternativa e do modo raw).
16. [REQ-016] QUANDO o autor troca de aba com `1` a `4` ou `Tab` ENTÃO o sistema DEVE mostrar Ao vivo, Funil, Tráfego ou MCP.

### P2 (Should Have)

17. [REQ-017] QUANDO o terminal suporta true color ENTÃO o sistema DEVE usar a paleta do site (fundo `#110f0d`, texto `#efebe2`, destaque `#f0c36f`); sem true color DEVE cair para as 16 cores ANSI.
18. [REQ-018] QUANDO o autor passa `--project <id>` ENTÃO o sistema DEVE ler desse projeto; o padrão é `nandomoreira-dev`.

### P3 (Nice to Have)

Nenhum.

## Edge Cases

- **Dia sem documento diário** (nenhuma visita ainda): os totais aparecem zerados, sem erro.
- **Virada da meia-noite em São Paulo:** o "hoje" do cabeçalho e o documento diário mudam de dia; o feed continua contínuo.
- **Evento sem `at` válido** (documento editado à mão, escrita futura): é ignorado no feed e no funil, sem derrubar a tela.
- **Lead cujo registro expirou ou foi apagado** (`refId` sem documento): o detalhe mostra "registro não encontrado" e o percurso mesmo assim.
- **Briefing enviado por agente via API:** normalmente não há percurso naquele dia; o detalhe mostra o registro sem páginas.
- **Visitante que trocou de IP ou de rede no meio do dia:** aparece como dois visitantes no funil. Limitação herdada do `lead-analytics`.
- **Muitos eventos no primeiro carregamento de 30 dias:** a busca é paginada; enquanto carrega, a aba mostra o progresso.
- **Credencial que expira com a TUI aberta:** a renovação é automática; se falhar, vale o REQ-014.
- **Consulta por intervalo exigir índice composto** (premissa não verificada): se o Firestore recusar, o erro traz o link para criar o índice, e o plano decide entre criar o índice e ajustar a consulta.
- **Contadores de dias anteriores ao deploy do `lead-analytics` (2026-10-14):** não existem; períodos que os incluem só somam os dias que existem.

## Architecture Decisions

- **TUI em Rust (ratatui 0.30, crossterm 0.29, tokio), não script `.sh`:** permite navegar entre abas, períodos e o detalhe de lead com o teclado; é a stack dos utilitários do autor (`tumodori`).
- **Código em `tools/stats/` deste repositório, binário `nm-stats`:** o leitor fica versionado junto do contrato que lê; mudar o formato no site e no leitor acontece no mesmo commit. Rodado com `cargo run --release` ou instalado com `cargo install --path tools/stats`. Sem script no `package.json`.
- **API REST do Firestore com a credencial padrão do gcloud:** sem SDK do Firebase e sem conta de serviço. O login, quando preciso, é o próprio `gcloud auth application-default login` rodado pela TUI; o `firebase login` não serve, porque guarda uma credencial que a API não lê pelo caminho padrão.
- **Funil por visitante e por dia, a partir dos eventos brutos:** liga as etapas à mesma pessoa, o que os contadores diários não fazem. O preço é o limite de 30 dias e o corte na meia-noite.
- **Tráfego e MCP a partir dos contadores diários:** uma leitura por dia do período, em vez de varrer eventos.
- **Atualização incremental:** cada ciclo busca só eventos com `at` maior que o último visto, mais o documento de hoje. Descartada a releitura completa a cada ciclo, que custaria uma leitura por evento.
- **30 s por padrão, 5 s sob demanda com desligamento em 30 min:** o modo rápido serve a um momento específico (logo depois de publicar) e é fácil esquecer ligado; o limite segura o custo em cerca de 360 leituras por ativação.
- **Agentes de IA fora do funil:** o funil é de pessoas; agentes aparecem no feed e na aba MCP.
- **Dados pessoais só em memória:** o detalhe de lead lê nome, contato e briefing sob demanda e não grava cache.

## Constraints

- Sem escrita no Firestore, nem por engano: a TUI só usa leitura (`get`, `runQuery`, `batchGet`).
- Rust edition 2024; `cargo clippy` e `cargo fmt` limpos.
- Nenhum teste depende de rede.
- `tools/stats/target/` no `.gitignore`.
- Interface em pt-BR (rótulos, mensagens); código, identificadores e comentários em inglês.

## Out of Scope

| Item | Reason |
|------|--------|
| Períodos maiores que 30 dias | Os contadores existem por 24 meses, mas a primeira versão cobre o que o funil cobre; entra depois. |
| Exportar CSV/JSON | Nenhuma decisão depende disso agora. |
| Alertas e notificações (lead novo) | O e-mail do lead já avisa. |
| Escrita, correção ou exclusão de dados | A TUI é só leitura. |
| Gráficos de série temporal | A primeira versão mostra tabelas e contagens. |
| Uso por outras pessoas ou em servidor | Ferramenta pessoal, local. |

## Test Strategy

- **Unit (Rust, `cargo test` em `tools/stats`):**
  - conversão do JSON da API REST do Firestore (`fields`, `mapValue`, `integerValue`, `timestampValue`) para os tipos do contrato;
  - decodificação das chaves de contador (`%2F`, `%2E`, `%5F_`, `%00`);
  - classificação de página de evidência;
  - canal de chegada por visitante-dia;
  - contagem do funil e porcentagens, com fixtures de eventos;
  - soma de contadores diários de um período;
  - máquina de estados do intervalo (30 s, 5 s, desligamento em 30 min) com relógio injetado.
- **Integração:** nenhuma automatizada contra o Firestore; a verificação final é rodar `nm-stats` contra produção e conferir os totais com o console.
- **E2E:** não se aplica.

## Grilling Log

Decisões levantadas e resolvidas na pesquisa (2026-10-14).

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | Formato do leitor | TUI em Rust (ratatui + tokio) | Navegação por teclado; stack do autor. |
| 2 | Onde fica o código | `tools/stats/` neste repositório | Versionado junto do contrato que lê. |
| 3 | Processo | Spec via RPI antes de implementar | Convenção do projeto. |
| 4 | Definição do funil | Por visitante-dia: chegou, viu evidência, agiu, virou lead; por canal | Liga as etapas à mesma pessoa. |
| 5 | Frequência de atualização | 30 s padrão; `r` liga 5 s | Custo baixo por padrão, imediato quando preciso. |
| 6 | Esquecer o modo de 5 s ligado | Desliga sozinho 30 min depois de ligado, com aviso | Limita o custo; regra fácil de explicar. |
| 7 | Telas | Abas Ao vivo, Funil, Tráfego, MCP; períodos hoje, 7 e 30 dias | Cobre as quatro perguntas da medição. |
| 8 | Autenticação | ADC do gcloud; a TUI roda o login e o projeto de cota quando faltam | Sem conta de serviço nem segredo novo. |
| 9 | Identificar o lead | `Enter` abre nome, contato, briefing e percurso, só em memória | O que já chega por e-mail, junto do funil. |
| 10 | Nome e execução | `nm-stats`, via `cargo`, sem script npm | Pedido do autor. |
| 11 | Visitante no feed | 6 primeiros caracteres do código do dia | Acompanhar a mesma pessoa sem identificá-la. |
| 12 | Falha de rede | Mantém dados, erro na barra, tenta de novo | A TUI não fecha por instabilidade. |
| 13 | Cores | Paleta do site, fallback ANSI | Coerência visual. |
| 14 | Agentes de IA | Feed e MCP, fora do funil | O funil é de pessoas. |
| 15 | Testes | Unitários com fixtures, sem rede | Determinismo. |

## Requirement Traceability

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| REQ-001 | Autenticação ADC com login automático | P1 | Pending |
| REQ-002 | Projeto de cota | P1 | Pending |
| REQ-003 | Atualização incremental a cada 30 s | P1 | Pending |
| REQ-004 | Modo tempo real de 5 s com `r` | P1 | Pending |
| REQ-005 | Desligamento do tempo real em 30 min | P1 | Pending |
| REQ-006 | Aba Ao vivo | P1 | Pending |
| REQ-007 | Aba Funil por visitante-dia e canal | P1 | Pending |
| REQ-008 | Página de evidência | P1 | Pending |
| REQ-009 | Canal de chegada por visitante-dia | P1 | Pending |
| REQ-010 | Períodos hoje, 7 e 30 dias | P1 | Pending |
| REQ-011 | Aba Tráfego | P1 | Pending |
| REQ-012 | Aba MCP | P1 | Pending |
| REQ-013 | Detalhe de lead | P1 | Pending |
| REQ-014 | Falha de leitura não fecha a TUI | P1 | Pending |
| REQ-015 | Restaurar o terminal | P1 | Pending |
| REQ-016 | Troca de abas | P1 | Pending |
| REQ-017 | Paleta do site com fallback ANSI | P2 | Pending |
| REQ-018 | `--project` | P2 | Pending |
