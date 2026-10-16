---
slug: de-cinco-dias-para-trinta-minutos
title: "De cinco dias para trinta minutos: IA numa esteira de ETL"
summary: "Como a preparação de uma base de dados passou de quase uma semana de trabalho manual para meia hora: automação por API, IA onde ela ajuda, testes onde ela pode errar e o prazo como regra do produto."
date: "2026-10-15"
publishedAt: "2026-10-15T21:38:38-03:00"
art: gantt
markers:
  - etl
  - dados
  - ia
---

Quando assumi a operação de dados na Liquid AI, receber a base de um cliente e entregá-la pronta na pipeline levava em torno de cinco dias. Quando saí, em setembro de 2026, levava até trinta minutos.

Esse número costuma provocar a pergunta errada: "qual modelo vocês usaram?". O ganho não veio de um modelo. Veio de tirar o trabalho manual do caminho, pôr a IA onde ela de fato ajuda, cercar com testes o que ela pode errar e transformar o prazo numa regra do sistema, e não numa planilha.

Este texto conta como foi, sem nomes de cliente e sem dados. O que importa aqui é a arquitetura e as decisões.

## O problema

A esteira transforma bases de incorporadoras em indicadores de financiamento imobiliário dentro dos produtos da empresa. São mais de vinte clientes, e cada um manda seus dados do seu jeito: formatos diferentes, colunas com nomes diferentes, convenções diferentes para a mesma informação.

Antes, cada base era um pequeno projeto. Alguém recebia o arquivo, entendia o formato daquela vez, extraía, ajustava, normalizava e só então colocava na pipeline. Caso a caso, à mão. Na prática, a maioria dos clientes mandava um .xlsx, às vezes até um .txt, e o tratamento era um projeto inteiro de notebooks Jupyter rodados no VS Code, um cliente de cada vez. Só alguns tinham a base extraída por nós, num desses notebooks conectado direto no banco do cliente. O conhecimento de "como a base do cliente X costuma vir" morava na cabeça de quem já tinha feito.

E o controle de tudo isso vivia numa ferramenta de terceiros, desconectada do trabalho. Saber em que fase estava cada base, quem era o responsável e se ia atrasar dependia de alguém atualizar um quadro.

Cinco dias não eram cinco dias de processamento. Eram cinco dias de fila, de espera e de retrabalho.

![Fluxo de antes, de cima para baixo: o cliente manda a base, quase sempre um arquivo .xlsx e às vezes até um .txt, alguém entende o formato daquela vez, abre o arquivo ou, para os poucos clientes com acesso ao banco, extrai com um notebook Jupyter, ajusta e normaliza em mais notebooks rodados no VS Code, cliente por cliente, sobe o arquivo e dispara a pipeline à mão, a pipeline gera os indicadores (a única parte automática) e a validação, que manda o erro de volta para a extração. Entre as etapas, esperas por pessoas. Ao lado, o controle num quadro de terceiros atualizado à mão. Total: cerca de cinco dias](../../assets/posts/2026/esteira-etl-antes.svg)

## Primeiro, a automação. Depois, a IA

A tentação, em 2026, é começar pela IA. Eu comecei pelo contrário: automatizar por API tudo o que era determinístico.

Extração e pré-normalização viraram serviços, disparados por chamada e não por pessoa. A engine de pré-normalização é escrita em Python, com FastAPI e Polars, roda no Cloud Run e segue arquitetura hexagonal com DDD. Essa escolha não é estética: com fontes heterogêneas, o que muda de um cliente para outro precisa ficar nas bordas, nos adaptadores, e o domínio da normalização precisa ficar estável no meio. Cliente novo vira adaptador novo, não um `if` a mais no meio da regra.

A IA entra depois, assistindo a extração e a pré-normalização naquilo que é ambíguo: o que uma regra fixa não resolve bem porque cada cliente descreve a mesma coisa de um jeito. Ela acelera a parte que antes exigia uma pessoa interpretando o arquivo. O que é determinístico continua determinístico.

Essa ordem importa. IA em cima de um processo manual só deixa o processo manual mais rápido de errar. IA em cima de um processo automatizado resolve a sobra que a automação não alcança.

## A operação ganhou um produto

O segundo movimento foi tirar o controle da ferramenta de terceiros e trazer para dentro de casa. Construí o Play Manager, um produto interno que virou a fonte da verdade da operação: fase, responsável, prazo e saúde de cada base, num lugar só, para o time e para a liderança.

Ele é feito em React 19, com API própria em Hono sobre Firebase, controle de acesso por papel e um editor de insights assistido por IA.

O passo que fez diferença foi levar a automação para dentro dele. Extração e pré-normalização passaram a ser disparadas pela própria interface, e não por alguém rodando um script. Por baixo, três propriedades sustentam isso:

- **Fila.** Cada base entra numa fila em vez de competir por atenção, e nada se perde porque alguém esqueceu.
- **Idempotência.** Disparar duas vezes a mesma etapa não duplica resultado. Isso parece detalhe até alguém clicar duas vezes num botão, ou até uma etapa falhar no meio e precisar ser repetida.
- **Enfileiramento automático.** Quando uma etapa termina, a próxima entra na fila sozinha. A esteira anda sem alguém empurrar.

É aqui que boa parte dos cinco dias desaparece. Não porque algo processa mais rápido, mas porque a base não fica parada esperando a próxima pessoa.

## Como as peças se conectam

![Arquitetura de depois, de cima para baixo: o Play Manager (React 19, Hono e Firebase) é a fonte da verdade. Um botão no card ou o encadeamento automático põe a base na fila de extração (uma por fonte) e na fila de pré-normalização (duas por vez). As duas alimentam a engine de pré-normalização (Python, FastAPI e Polars no Cloud Run), hexagonal: nas bordas, o arquivo subido pelo card, três adaptadores de fonte e a IA, o domínio estável no meio e a saída no contrato da pipeline, com mais de 4.800 testes. O arquivo sobe sem o gatilho e entra na fila de gatilho, que libera uma base por vez, só sem job em voo e de forma idempotente por base e mês. A pipeline de indicadores roda, e cada passo concluído avança o card e enfileira o próximo. Validação reprovada vira alerta, não trava. Resultado: até 30 minutos](../../assets/posts/2026/esteira-etl-depois.svg)

A maioria dos clientes continua mandando um arquivo, que sobe pelo próprio card. A decisão que desenhou o resto foi onde morar a extração dos que não mandam. Cada fonte de dados espera de um jeito: uma dispara um serviço e só depois deixa ler o resultado, outra roda de forma assíncrona e com duração variável, a terceira é uma API REST paginada. Pus essa fachada dentro da engine de pré-normalização, e não no Play Manager. A engine já tinha o padrão de tarefa, consulta e download, a chave de API e o registro de configuração de cada cliente. O app passou a falar com uma API só, e não ganhou credencial de nuvem nenhuma.

Nem o botão do card nem o encadeamento automático chamam a engine na hora: todo trabalho passa por uma fila, e cada fila tem a vazão que o gargalo dela permite. A extração anda uma por fonte, porque uma das fontes recusa chamadas concorrentes. A pré-normalização roda duas por vez. E a fila de gatilho libera uma base por vez para a pipeline de indicadores, só quando nenhum processamento está em andamento.

Uma base que falha na extração ou na pré-normalização não segura as outras, porque essas filas seguem andando. E validação reprovada ou volume diferente do esperado não travam a esteira: viram alerta no card. **O controle é a ação aparecer só quando dá para executá-la**, em vez de um bloqueio que alguém precisa destravar.

## O prazo virou regra do produto

Prazo em planilha é uma intenção. Descobre-se o atraso depois que ele aconteceu.

No Play Manager, o prazo de entrega é regra do sistema. Cada etapa tem um orçamento de tempo, e cada base é classificada automaticamente em uma de três situações: **no prazo**, **em risco** ou **atrasada**.

![A esteira de oito etapas no card: 1 receber a base, 2 pré-normalizar, 3 sincronizar os dados, 4 gerar os indicadores, 5 gerar a base, 6 gerar o relatório, 7 gerar os insights com o editor assistido por IA, 8 enviar o relatório, e concluída. As etapas 1 a 3 são do ETL e as de 4 a 8 dos analistas, e as de 1 a 4 são disparadas do card. O responsável troca sozinho quando a base muda de etapa. Cada etapa tem um orçamento de tempo, e o card mostra no prazo, em risco ou atrasada](../../assets/posts/2026/esteira-etl-etapas.svg)

São oito etapas, e cada uma tem dono: as três primeiras são do ETL, da quarta em diante são dos analistas. O responsável troca sozinho quando a base muda de etapa, então ninguém precisa lembrar de passar o bastão.

A diferença entre "em risco" e "atrasada" é o ponto todo. Com ela, a gestão vê o atraso chegando enquanto ainda dá para agir, em vez de constatá-lo depois do vencimento. A conversa deixa de ser "por que atrasou?" e vira "o que fazemos com essa que está em risco?".

## Onde a IA pode errar, testes

Uma esteira de dados tem um modo de falha cruel: ela não quebra, ela entrega errado. Um número normalizado de um jeito sutilmente diferente passa por todas as etapas, chega ao indicador e ninguém percebe.

Por isso a velocidade veio junto com uma rede de testes:

- A engine de pré-normalização é sustentada por mais de **4.800 casos de teste**, entre unitários, integração, regressão e paridade. Os de paridade são os que mais importam numa mudança assim: comparam resultados para garantir que uma alteração não muda o que deveria continuar igual.
- Dois pipelines de extração e integração rodavam em produção **sem nenhum teste automatizado**. Escrevi 920 casos e levei a cobertura de 0% para **84% e 92%**, com portão de cobertura no CI a cada pull request e deploy bloqueado quando a suíte falha.

Com IA no meio do processo, isso deixa de ser boa prática e vira requisito. O teste é o que permite deixar a IA ajudar sem ter que conferir cada saída à mão.

## A virada sem trauma

Ferramenta nova costuma falhar por um motivo que não é técnico: o time precisa reaprender a trabalhar.

Conduzi a migração replicando no Play Manager os padrões de interação que o time já dominava na ferramenta anterior. Quem usava o sistema antigo encontrava no novo os mesmos caminhos. A carteira inteira migrou sem nenhuma divergência que bloqueasse a operação.

Não foi a parte mais interessante tecnicamente, mas foi uma das que mais pesaram no resultado. Um produto melhor que ninguém adota não reduz prazo nenhum.

## Como o código é escrito

Por trás de tudo isso havia uma forma de trabalhar. Desenvolvi com um framework próprio de desenvolvimento assistido por IA sobre o Claude Code: cada mudança passava por pesquisa, plano e implementação, com teste escrito antes do código e portões de lint, tipos, testes e build antes de cada commit.

Isso importa aqui por um motivo específico: numa esteira de dados, a pressa é o que introduz o erro silencioso. Ter o portão como ferramenta, e não como disciplina, é o que deixa ir rápido sem quebrar o que já funciona. Escrevi sobre esse fluxo em [Fluxo RPI com três agentes](/fluxo-rpi-claude-code-grok-codex).

## O que fica

Se eu tivesse que resumir em três decisões:

1. **Automatizar antes de pôr IA.** A IA resolve a sobra ambígua; o que é determinístico vira código.
2. **Tirar a fila da cabeça das pessoas.** Fila, idempotência e enfileiramento automático fazem a base andar sozinha.
3. **Transformar intenção em regra.** Prazo com orçamento por etapa, cobertura com portão no CI. O que depende de alguém lembrar acaba esquecido.

Os cinco dias não sumiram porque um modelo ficou mais esperto. Sumiram porque o trabalho parou de esperar.

`sys.exit(0)`
