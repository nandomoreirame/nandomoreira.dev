# Spec: Comentários com Giscus no blog atual

## Problema

O blog atual não tem um sistema ativo de comentários. Quem lê não consegue fazer perguntas ou sugerir correções nos posts atuais, e a política de privacidade diz que os scripts do site são servidos pelo próprio domínio. A feature adicionará comentários com Giscus apenas aos posts atuais e atualizará a política para descrever a integração com o GitHub.

## Objetivos

- Exibir uma discussão do GitHub em cada post publicado e não arquivado, sem exibir o widget em posts arquivados ou rascunhos.
- Manter cada discussão associada a um único caminho de post.
- Preservar a leitura do post quando o GitHub ou o widget Giscus estiver indisponível.
- Manter a política de privacidade correta sobre o serviço externo.

## Contexto

O blog usa Astro. As páginas de detalhe dos posts são pré-renderizadas, e a camada de acesso ao conteúdo já separa posts atuais de arquivados pelo campo `archived`. A feature reutilizará essa regra: posts com `archived: true` ficam de fora, independentemente do ano de publicação. Rascunhos também ficam de fora.

O provedor escolhido é o Giscus, que armazena as discussões no GitHub Discussions e exige autenticação GitHub para comentar. O repositório do blog é `nandomoreirame/nandomoreira.dev`; a integração usará uma categoria própria `Blog`, do tipo `Announcements`. O widget será carregado no navegador, sob demanda, nas páginas de posts atuais.

## Afirmações verificadas

| Afirmação | Fonte (arquivo:linha) | Verificada |
|-----------|-----------------------|------------|
| Posts atuais excluem os que têm `archived: true` | `src/lib/content/posts.ts:45` (`currentOf`) | sim |
| Posts arquivados são separados pelo mesmo campo `archived` | `src/lib/content/posts.ts:49` (`archivedOf`) | sim |
| As páginas de detalhe dos posts são pré-renderizadas e enumeradas no build | `src/pages/[slug].astro:27` (`prerender`) | sim |
| O conteúdo da política de privacidade é definido como dados e serve as versões HTML e Markdown | `src/lib/privacy/policy.ts:17` (`privacySections`) | sim |
| O repositório do Giscus é público, Discussions está habilitado e o app Giscus tem acesso | n/a | suposição |

## Requisitos

### P1 (MVP)

1. **[REQ-001]** QUANDO uma pessoa acessa um post publicado com `archived !== true` ENTÃO o sistema DEVE exibir a seção de comentários do Giscus imediatamente depois de `<AuthorBox />` e antes dos posts relacionados; posts arquivados e rascunhos NÃO DEVEM exibir o widget.
2. **[REQ-002]** QUANDO o Giscus procura a conversa de um post ENTÃO DEVE usar o `pathname`, exigir correspondência estrita e procurar ou criar a discussão somente na categoria `Blog`, do tipo `Announcements`, do repositório configurado.
3. **[REQ-003]** QUANDO uma pessoa envia um comentário ENTÃO o Giscus DEVE exigir autenticação pelo GitHub; o autor do blog DEVE moderar as conversas no GitHub Discussions.
4. **[REQ-004]** QUANDO a seção de comentários se aproxima da área visível ENTÃO o sistema DEVE carregar o iframe e o script externo do Giscus sob demanda, sem carregá-los junto ao conteúdo inicial do post.
5. **[REQ-005]** QUANDO o tema do site for `noir` ou `paper` ENTÃO o Giscus DEVE usar, respectivamente, o tema escuro ou claro e DEVE atualizar quando a pessoa trocar o tema do site, sem recarregar a página. O idioma do widget DEVE ser `pt`.
6. **[REQ-006]** QUANDO a política de privacidade for exibida em HTML ou Markdown ENTÃO DEVE informar que a seção usa GitHub, exige autenticação GitHub e armazena comentários publicamente no GitHub Discussions.
7. **[REQ-007]** QUANDO a integração for configurada ENTÃO DEVE usar no navegador apenas identificadores públicos do repositório e da categoria Giscus; NÃO DEVE adicionar API de comentários, banco de dados ou segredo no cliente.
8. **[REQ-008]** QUANDO o carregamento do GitHub ou do Giscus falhar ou exceder o tempo limite ENTÃO o post DEVE continuar legível e a seção DEVE exibir uma mensagem breve em português sem interromper a página. Bloqueios de extensões que impeçam a execução de todo o JavaScript da página não podem ser detectados pelo site.

### P2 (Desejável)

Nenhum requisito nesta versão.

### P3 (Futuro)

Nenhum requisito nesta versão.

## Casos limite

- **Ainda não existe discussão para o post:** o Giscus cria a discussão na categoria configurada quando alguém interage pela primeira vez.
- **Post arquivado ou rascunho:** o widget é omitido com base nos campos existentes do conteúdo.
- **Serviço externo indisponível, carregamento com erro ou timeout:** a página continua utilizável e apresenta uma mensagem discreta, sem bloquear o texto.
- **Slug do post muda:** o `pathname` muda e a correspondência estrita deixa de encontrar automaticamente a discussão anterior. Reassociar a conversa exige uma migração deliberada do mapeamento.
- **Pré-requisitos do repositório ausentes:** repositório privado, Discussions desabilitado ou falta de acesso do app impedem o carregamento dos comentários. Essas condições precisam ser verificadas antes da ativação em produção.
- **Mudança no provedor:** Giscus e GitHub Discussions são dependências externas, cujas APIs ou comportamentos podem mudar.

## Decisões de arquitetura

1. **Giscus em vez de utterances**: usar GitHub Discussions em vez de GitHub Issues, pois o autor escolheu Giscus e Discussions oferecem um espaço dedicado para conversas sobre os posts. utterances foi considerada e descartada.
2. **Componente Astro dedicado**: encapsular o widget para que a rota pré-renderizada do post forneça apenas os metadados e a regra de visibilidade. A integração não entra no corpo do artigo nem exige backend do blog.
3. **`pathname` com correspondência estrita**: usar o caminho do post como identidade e o modo estrito para impedir que a busca aproximada associe slugs parecidos à discussão errada.
4. **Categoria própria `Blog`, do tipo `Announcements`**: separar as conversas do blog das conversas de desenvolvimento e limitar a criação de tópicos principais à integração.
5. **Carregamento sob demanda e sincronização do tema**: carregar o embed de terceiros próximo à seção e mapear `noir` e `paper` para os temas escuro e claro do Giscus.
6. **Identidade GitHub, sem reações**: exigir login GitHub e manter a primeira versão focada em comentários escritos. Login anônimo, outros provedores e reações ficam de fora.
7. **Atualizar a política com a integração**: a política atual descreve scripts próprios e compartilhamento com terceiros sem citar Giscus. Atualizar a fonte de dados compartilhada para manter as versões HTML e Markdown coerentes.

## Registro do grilling

| # | Decisão | Resolução | Motivo |
|---|---------|-----------|--------|
| 1 | Quais posts recebem comentários | Posts publicados com `archived !== true`; sem rascunhos | Reutiliza a regra existente de post atual e exclui o acervo arquivado até 2019. |
| 2 | Mapeamento da conversa | `pathname` com correspondência estrita | Evita que a busca aproximada associe caminhos de posts parecidos à discussão errada. |
| 3 | Categoria das discussões | Categoria própria `Blog`, do tipo `Announcements` | Separa conversas do blog e limita a criação de tópicos principais. |
| 4 | Identidade e interações extras | Login GitHub; sem reações | Segue o provedor escolhido e mantém a primeira versão focada em comentários. |
| 5 | Carregamento e temas | Carregar sob demanda; sincronizar `noir` e `paper` | Reduz carregamento inicial de terceiros e acompanha o tema escolhido por quem lê. |
| 6 | Idioma do widget | `pt` | É o código de português oferecido pelo Giscus; não há opção separada `pt-BR`. |
| 7 | Política de privacidade | Atualizar junto da feature | Mantém as informações do site corretas quando o navegador se comunica com o GitHub. |

## Restrições

- O repositório GitHub precisa ser público, Discussions precisa estar habilitado e o app Giscus precisa ter acesso ao repositório.
- O repositório precisa ter uma categoria `Blog` do tipo `Announcements` antes da ativação em produção.
- Quem comentar precisa de uma conta GitHub; comentários anônimos e outros provedores não são suportados.
- As páginas Astro continuam pré-renderizadas; os comentários são carregados pelo embed no navegador.
- Nenhum segredo do Giscus, segredo OAuth ou credencial privada pode entrar no código do site.

## Fora de escopo

| Item | Motivo |
|------|--------|
| Comentários em posts arquivados ou rascunhos | A feature atende apenas ao blog atual. |
| Importação dos comentários antigos do Disqus | Migrar conversas históricas é uma tarefa separada. |
| Login anônimo ou provedores diferentes do GitHub | O Giscus exige autorização pelo GitHub para publicar. |
| Reações e votos | Não são necessários na primeira versão. |
| Painel próprio de moderação ou backend | O GitHub Discussions oferece a superfície de moderação. |
| Migração automática da conversa após mudança de slug | A identidade por caminho é intencional; reassociar exige uma mudança explícita. |

## Estratégia de testes

- **Unitários:** ampliar `tests/posts/post-page.test.ts` para confirmar que o Giscus aparece apenas em posts atuais publicados, e verificar caminho, modo estrito, categoria, idioma e identificadores públicos, sem segredos. Testar o carregamento do widget, a atualização de tema e o tratamento de falha no comportamento cliente do componente.
- **Integração:** confirmar que as versões HTML e Markdown da política descrevem o mesmo comportamento de GitHub/Giscus; ampliar `tests/privacy/policy.test.ts`.
- **Build:** confirmar que a saída de posts atuais inclui o widget, a de posts arquivados não inclui e o portão de scripts de cliente aceita apenas o carregador intencional do Giscus.
- **Manual:** com os pré-requisitos do GitHub ativos, verificar login, criação da primeira discussão, separação por post, moderação, carregamento sob demanda, troca de tema e mensagem quando o carregamento falha ou excede o timeout.

## Rastreabilidade dos requisitos

| ID | Descrição | Prioridade | Estado |
|----|-----------|------------|--------|
| REQ-001 | Exibir comentários apenas em posts atuais publicados | P1 | Pendente |
| REQ-002 | Mapear cada post estritamente para sua discussão Blog | P1 | Pendente |
| REQ-003 | Exigir autenticação GitHub e moderar no GitHub Discussions | P1 | Pendente |
| REQ-004 | Carregar o embed sob demanda | P1 | Pendente |
| REQ-005 | Acompanhar os temas do site e usar português | P1 | Pendente |
| REQ-006 | Informar a integração nas versões da política | P1 | Pendente |
| REQ-007 | Não criar backend do blog nem expor segredos no cliente | P1 | Pendente |
| REQ-008 | Preservar leitura quando os comentários falharem | P1 | Pendente |
