# nm-stats

TUI local que lê as visitas, o funil e os leads do nandomoreira.dev. Os dados vêm do Firestore do lead-analytics (`analytics_events`, `analytics_daily` e, no detalhe de um lead, `hire_requests` ou `cv_downloads`). O programa só lê: `runQuery`, `batchGet` e `GET`.

## Pré-requisitos

- Rust 1.88 ou superior (edition 2024).
- `gcloud` no `PATH`, com permissão de leitura no projeto `nandomoreira-dev`.

Sem token, o `nm-stats` roda `gcloud auth application-default login` no terminal, antes de desenhar qualquer coisa. Se o arquivo de credencial não tiver projeto de cota, ele define `nandomoreira-dev`. Com a TUI aberta, um token vencido não dispara login de novo: o erro vai para a barra de status.

## Rodar

```bash
cargo run --release --manifest-path tools/stats/Cargo.toml
```

Para deixar o binário no `PATH`:

```bash
cargo install --path tools/stats
nm-stats
```

Outro projeto do Google Cloud: `nm-stats --project <id>`.

Testes, sem rede e sem Firestore:

```bash
cargo test --manifest-path tools/stats/Cargo.toml
```

## Teclas

| Tecla | Efeito |
| --- | --- |
| `1` a `4`, `Tab` | Abas Ao vivo, Funil, Tráfego e MCP |
| `r` | Alterna o tempo real (5 s) e o intervalo de 30 s |
| `[` e `]` | Período: hoje, 7 dias, 30 dias |
| `↑` e `↓` | Seleciona um lead na aba Funil |
| `Enter` | Abre o detalhe do lead selecionado |
| `Esc` | Fecha o detalhe |
| `q`, Ctrl-C | Sai e devolve o terminal. Dentro do detalhe, `q` só fecha |

## Funil

Uma visita é um par (dia em São Paulo, visitante) de uma pessoa. Agente não entra.

As etapas, nesta ordem, são Chegou, Viu evidência, Agiu e Virou lead. A visita alcança uma etapa quando fez aquela etapa ou uma posterior, então a contagem não cresce funil abaixo. Quem chegou direto no formulário conta nas quatro. A porcentagem de uma etapa é a passagem sobre a anterior, em número inteiro.

O canal de chegada é o do primeiro pageview que não veio de dentro do site. Sem nenhum, o canal é `direct`.

Evidência é um case (`/portfolio/<slug>` ou `/lab/<slug>`) ou um post (um segmento de caminho que não é página fixa nem arquivo).

## Leituras

Na abertura, o programa carrega os contadores diários dos últimos 30 dias e os eventos desde a meia-noite de São Paulo do primeiro desses dias. Dali em diante, a cada 30 segundos, busca só os eventos novos e o documento de hoje. Os dias anteriores não mudam e não são relidos.

`r` baixa o intervalo para 5 segundos. O modo dura no máximo 30 minutos e se desliga sozinho, com o aviso na barra de status. Ligar de novo recomeça os 30 minutos.
