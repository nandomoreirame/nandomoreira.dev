# stats

Para o autor acompanhar visitas, funil e leads do nandomoreira.dev sem consultar documentos do Firestore um a um, o `stats` reúne os números em uma TUI local e em um painel web que também abre no celular. A TUI atende ao uso no terminal; o painel permite consultar os mesmos dados pelo navegador. Os dados vêm do Firestore do lead-analytics (`analytics_events`, `analytics_daily` e, no detalhe de um lead, `hire_requests` ou `cv_downloads`). O programa só lê: `runQuery`, `batchGet` e `GET`.

## Pré-requisitos

- Rust 1.88 ou superior (edition 2024).
- `gcloud` no `PATH`, com permissão de leitura no projeto `nandomoreira-dev`.

Sem token, o `stats` roda `gcloud auth application-default login` no terminal, antes de desenhar qualquer coisa. Se o arquivo de credencial não tiver projeto de cota, ele define `nandomoreira-dev`. Com a TUI aberta, um token vencido não dispara login de novo: o erro vai para a barra de status.

## Rodar

Abrir o binário já instalado em `~/.cargo/bin`, sem compilar:

```bash
scripts/run-stats.sh
```

`--build` (ou `--install`) instala antes a versão deste checkout, para quando o código
mudou: `scripts/run-stats.sh --build`. Sem binário instalado, a primeira execução instala
sozinha.

Os argumentos vão direto para o `stats` (`scripts/run-stats.sh --project <id>`).

Para abrir num dia só, passe a data (`AAAA-MM-DD`, `hoje` ou `ontem`):

```bash
scripts/run-stats.sh 2026-10-20     # o mesmo que stats --day 2026-10-20
scripts/run-stats.sh ontem
```

Os eventos brutos expiram em 30 dias e os contadores diários em 24 meses. Num dia mais
antigo que 30 dias, Tráfego e MCP mostram os contadores, e funil, vendas e cidades ficam
vazios (a barra de status avisa).

```bash
cargo run --release --manifest-path tools/stats/Cargo.toml
```

Para deixar o binário no `PATH`:

```bash
cargo install --path tools/stats
stats
```

Outro projeto do Google Cloud: `stats --project <id>`.

Dados fictícios, sem login e sem rede, para demonstrar ou tirar print: `stats --demo`
(ou `scripts/run-stats.sh --demo`). São 30 dias gerados com semente fixa, e um evento
novo entra a cada atualização.

Testes, sem rede e sem Firestore:

```bash
cargo test --manifest-path tools/stats/Cargo.toml
```

## Painel web

`stats web` (ou `scripts/run-stats.sh web`) serve em `http://127.0.0.1:7878` e abre o navegador. `--port` muda a porta, `--no-open` impede a abertura e `--demo` usa dados fictícios estáticos, sem credencial nem Firestore. `--bind` muda a interface de escuta e `--host-name` acrescenta um nome permitido ao cabeçalho `Host`. Para ignorar o cache, a opção vem antes do subcomando: `stats --no-cache web`.

As abas são Ao vivo, Funil, Tráfego, MCP e Vendas. Os recortes incluem dia, semana (segunda a domingo), mês, últimos 7 ou 30 dias e intervalo livre, no fuso de São Paulo. A URL guarda o recorte e os filtros. Fora dos 30 dias de eventos brutos, Funil, Vendas, cidades e feed avisam que cobrem só a parte disponível; os contadores diários e a série alcançam até 24 meses.

O servidor busca atualizações a cada 30 segundos enquanto houver página conectada por SSE. O tempo real reduz o intervalo para 5 segundos por até 30 minutos. Sem página conectada, a leitura para.

### Segurança

O servidor só é iniciado por comando explícito e escuta em loopback por padrão. Não há login no app. O cabeçalho `Host` é conferido antes das rotas: nomes fora de `localhost`, `127.0.0.1`, `[::1]` e o nome configurado recebem 421. `POST /fast` recusa uma origem fora dos nomes permitidos; requisições sem `Origin` são aceitas. A CSP permite scripts e estilos do próprio servidor, sem scripts nem estilos inline.

O painel permite consultar os números e abrir nome, contato, briefing e percurso de leads. O detalhe recebe `Cache-Control: no-store`, fica só em memória e nunca entra no cache em disco. O cache de eventos e contadores fica em `$XDG_CACHE_HOME/nandomoreira-stats/<projeto>` (por padrão, `~/.cache/nandomoreira-stats/<projeto>`). A conta de serviço do homelab tem apenas leitura no Firestore.

No homelab, o processo escuta em `0.0.0.0:8080` dentro do container, publicado somente em `127.0.0.1:7879` no host. O Caddy serve `http://stats.home` e responde 403 fora de `100.64.0.0/10` e `fd7a:115c:a1e0::/48`. A barreira de acesso é a rede: qualquer aparelho autorizado no tailnet pode ver os leads. Não há HTTPS no app; o túnel do Tailscale cifra o tráfego entre os aparelhos. Mudar `--bind` para uma interface pública sem essa barreira expõe o painel.

Para relatar uma vulnerabilidade, entre em contato com o mantenedor pela [página de contato](https://nandomoreira.dev/contato), sem publicar credenciais ou dados de leads em issues.

### Homelab, uma vez

Crie a conta de serviço e copie a chave para o homelab. Estes comandos são passos manuais do autor; nunca acrescente a chave ao repositório:

```bash
gcloud iam service-accounts create stats-reader --project nandomoreira-dev \
  --display-name "stats web (homelab, só leitura)"
gcloud projects add-iam-policy-binding nandomoreira-dev \
  --member "serviceAccount:stats-reader@nandomoreira-dev.iam.gserviceaccount.com" \
  --role roles/datastore.viewer
(umask 077 && gcloud iam service-accounts keys create /tmp/stats-sa.json \
  --iam-account stats-reader@nandomoreira-dev.iam.gserviceaccount.com)
ssh homelab 'mkdir -p ~/.config/stats && chmod 700 ~/.config/stats'
scp /tmp/stats-sa.json homelab:.config/stats/sa.json
ssh homelab 'chmod 600 ~/.config/stats/sa.json'
shred -u /tmp/stats-sa.json
```

No painel do Tailscale, abra DNS, Nameservers, Add nameserver, Custom. Informe `100.97.74.108` e habilite "Restrict to domain" para `home` (split DNS).

### Publicar e rotacionar a chave

Em casa, com o Tailscale ligado, execute da raiz do repositório:

```bash
bash scripts/deploy-stats.sh
```

O script copia apenas `tools/stats` e `deploy/stats`, exige a chave com modo `600`, configura Caddy e Pi-hole e prova HTTP 200 pelo Tailscale e 403 pela rede da casa. A evidência de sucesso é a última linha `STATS DEPLOY PASSED`. `STATS_HOST` muda o host SSH (padrão `homelab`) e `STATS_PORT` muda a porta publicada (padrão `7879`).

Rotacione a chave a cada 90 dias: gere outra com `gcloud iam service-accounts keys create`, copie para o mesmo caminho com modo `600`, execute `docker restart stats-web` no homelab e confirme a leitura. Só depois remova a anterior com `gcloud iam service-accounts keys delete <id-antigo>`. Apague com segurança a cópia temporária local da nova chave.

Este leitor fica no repositório do site porque compartilha o contrato das coleções de analytics e acompanha suas mudanças. A TUI continua disponível; o painel web aguarda revisão independente e validação do deploy no homelab. As instruções de agentes na raiz orientam a manutenção; humanos começam por este README e pelo README da raiz.

## Teclas

| Tecla | Efeito |
| --- | --- |
| `1` a `4`, `Tab` | Abas Ao vivo, Funil, Tráfego e MCP |
| `r` | Alterna o tempo real (5 s) e o intervalo de 30 s |
| `[` e `]` | Período: hoje, 7 dias, 30 dias. Num dia só, voltam para hoje |
| `d` | Abre o campo de data na barra de status: `AAAA-MM-DD`, `hoje` ou `ontem`. `Enter` aplica, `Esc` cancela |
| `,` e `.` | Um dia só: o anterior e o seguinte. Chegar a hoje volta ao período "hoje" |
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

Os eventos já lidos ficam em `~/.cache/nandomoreira-stats/<projeto>/events.json` (ou em
`$XDG_CACHE_HOME`), só legível pelo dono, gravado depois da primeira carga e ao sair. Na
abertura seguinte o programa mostra o que está no cache e busca no Firestore só os eventos
mais novos que o último guardado; o que passa de 30 dias sai do arquivo, como sai do
Firestore. O cache não guarda nome, contato nem briefing de lead. `--no-cache` ignora o
arquivo e relê os 30 dias; apagar o arquivo tem o mesmo efeito na próxima abertura.

`r` baixa o intervalo para 5 segundos. O modo dura no máximo 30 minutos e se desliga sozinho, com o aviso na barra de status. Ligar de novo recomeça os 30 minutos.
