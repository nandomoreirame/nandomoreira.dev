/** One step of the work, with an optional text label for the approval steps. */
export interface SalesStep {
  title: string;
  text: string;
  youDo: string;
  highlight?: string;
}

const STEPS: readonly SalesStep[] = [
  { title: 'Entrevista', text: 'Uma conversa para entender o seu negócio, o seu cliente e o seu objetivo.', youDo: 'Você só precisa contar a sua história.' },
  { title: 'Pesquisa', text: 'Estudo o seu mercado, os concorrentes e o que o seu cliente procura.', youDo: 'Você tira as dúvidas que eu tiver sobre o seu público.' },
  { title: 'Design', text: 'Desenho as telas antes de escrever qualquer código, para você ver como vai ficar.', youDo: 'Você vê o visual e dá as primeiras impressões.', highlight: 'Você aprova antes' },
  { title: 'Aprovação', text: 'Você revisa, pede ajustes e só seguimos quando estiver do seu jeito.', youDo: 'Você dá o sinal verde para a construção.', highlight: 'Sem surpresas' },
  { title: 'Desenvolvimento', text: 'Construo o site ou sistema de verdade, com atualizações para você acompanhar.', youDo: 'Você acompanha pelos links de teste.' },
  { title: 'Testes', text: 'Testo em celular, computador e diferentes navegadores, e verifico velocidade e segurança.', youDo: 'Você navega e experimenta a versão final.' },
  { title: 'Entrega', text: 'Publico no ar com o seu domínio, explico como usar e fico por perto nos primeiros dias.', youDo: 'Você recebe os acessos e começa a divulgar.' },
];

/** Fixed text of the sales landing (sales-landing, Anexos A e B). Visible copy, so pt-BR. */
export const SALES_COPY = {
  hero: {
    eyebrow: 'Sites, lojas e sistemas para o seu negócio',
    title: 'Seu site, sua loja ou seu sistema, do primeiro papo até estar no ar.',
    lead: 'Você me conta o que o seu negócio precisa, mesmo que ainda não saiba o nome disso. Eu traduzo em um projeto, desenho, construo e entrego funcionando.',
    primary: 'Quero conversar sobre meu projeto',
    secondary: 'Ver como funciona',
    proofs: ['15 anos de código em produção', 'Design aprovado antes da programação', 'Sem jargão técnico'],
  },
  situationsHeader: {
    eyebrow: 'Ponto de partida',
    title: 'Não sabe por onde começar? Comece pela sua situação.',
    lead: 'Você não precisa conhecer termos técnicos nem saber qual tecnologia contratar. Escolha a frase que mais parece com o seu momento.',
  },
  situations: [
    { label: 'Presença', quote: 'Quero que me encontrem no Google', service: 'site-institucional' },
    { label: 'Divulgação', quote: 'Preciso de uma página para divulgar uma oferta ou um evento', service: 'landing-page' },
    { label: 'Vendas', quote: 'Quero vender pela internet sem depender do WhatsApp', service: 'loja-virtual' },
    { label: 'Autoridade', quote: 'Quero escrever e atrair clientes com conteúdo', service: 'blog' },
    { label: 'Aplicativo', quote: 'Tenho uma ideia de aplicativo ou sistema', service: 'produto-web' },
    { label: 'Tempo', quote: 'Perco horas com tarefas repetitivas e planilhas', service: 'automacao-ia' },
  ],
  servicesHeader: {
    eyebrow: 'Soluções sob medida',
    title: 'Serviços pensados para o momento do seu negócio',
    lead: 'Tudo explicado sem enrolação: o que é, para quem serve e o que você recebe.',
  },
  stepsHeader: {
    eyebrow: 'Transparência total',
    title: 'Como eu trabalho',
    lead: 'Um processo simples e previsível. Você sempre sabe em que pé está o projeto e o que precisa fazer.',
  },
  steps: STEPS,
  stepsNote: 'As etapas 03 e 04 garantem que nada é construído sem a sua aprovação.',
  toolsHeader: {
    eyebrow: 'Infraestrutura explicada',
    title: 'As ferramentas por trás, explicadas sem complicação',
    lead: 'Pense na tecnologia como uma loja física. Eu uso o Firebase, a plataforma do Google, e cada peça dela faz um papel conhecido.',
  },
  tools: [
    { name: 'Firebase Hosting', analogy: 'O endereço e a vitrine', text: 'Hospeda sites que não mudam a cada visita, como o institucional, a landing page e o blog. Rápido no mundo todo, com cadeado de segurança incluso e custo que costuma ficar perto de zero.' },
    { name: 'Firebase App Hosting', analogy: 'A loja com atendente', text: 'Para sites que montam cada página na hora, com conteúdo que muda, área de cliente e integrações.' },
    { name: 'Firestore', analogy: 'O arquivo e o estoque', text: 'Banco de dados que guarda produtos, pedidos e cadastros, e atualiza tudo em tempo real.' },
    { name: 'Authentication', analogy: 'O porteiro', text: 'Login com e-mail ou conta Google, para cada pessoa ver só o que é dela.' },
    { name: 'Cloud Functions', analogy: 'O funcionário dos bastidores', text: 'Tarefas automáticas no servidor, como enviar o e-mail de confirmação, processar um pagamento ou gerar um relatório.' },
    { name: 'Cloud Storage', analogy: 'O depósito', text: 'Fotos, PDFs e arquivos enviados por você ou pelos seus clientes.' },
    { name: 'Gemini', analogy: 'O assistente', text: 'A inteligência artificial do Google, para resumos, textos e automações dentro do seu produto.' },
  ],
  toolsNote: 'Infraestrutura do Google, a mesma usada por grandes empresas, com custo que cresce junto com o seu negócio.',
  projectsHeader: {
    eyebrow: 'Casos concretos',
    title: 'Projetos reais',
    lead: 'Alguns trabalhos feitos do zero e que estão no ar.',
  },
  projects: [
    { slug: 'encantos-brincantes', kind: 'Vitrine online', text: 'Levou para a web a venda de recursos lúdicos para educação infantil, que antes dependia de mensagem direta.', alt: 'Página inicial da vitrine Encantos Brincantes, com produtos lúdicos para educação infantil' },
    { slug: 'portfoliosnap', kind: 'Produto web com IA', text: 'Professores registram atividades em segundos e a inteligência artificial gera o relatório pedagógico do mês.', alt: 'Tela do PortfolioSnap com o registro de atividades de uma turma' },
    { slug: 'bragstack', kind: 'Aplicativo web com Firebase', text: 'Registro de conquistas profissionais em poucos toques, organizado pela inteligência artificial.', alt: 'Tela inicial do BragStack, aplicativo de registro de conquistas' },
    { slug: 'mousai', kind: 'Produto web', text: 'Mural de referências visuais para artistas, compartilhado por um código curto.', alt: 'Galeria de referências visuais no Mousai' },
  ],
  about: {
    name: 'Fernando Moreira',
    role: 'Desenvolvedor de software sênior em São Paulo, atendendo todo o Brasil de forma remota.',
    photoAlt: 'Foto de Fernando Moreira, de óculos e barba, sorrindo',
    points: [
      { title: '15 anos construindo software', text: 'com passagem por grandes empresas de tecnologia, como Itaú Unibanco, Pipefy e Skyone.' },
      { title: 'Você fala direto com quem constrói', text: 'sem intermediário e sem telefone sem fio. A sua necessidade é entendida na raiz.' },
      { title: 'O acompanhamento continua depois da entrega', text: 'fico por perto com suporte, ajustes e evolução conforme o seu negócio cresce.' },
    ],
  },
  faqHeader: {
    eyebrow: 'Respostas sem rodeios',
    title: 'Dúvidas frequentes',
    lead: 'As perguntas mais comuns de quem está dando o primeiro passo.',
  },
  faq: [
    { question: 'Preciso entender de tecnologia?', answer: 'Não. Você conta como funciona o seu negócio e o que espera do site; a parte técnica é comigo, e explico cada escolha em português claro.' },
    { question: 'Quanto custa?', answer: 'Depende do que o seu projeto precisa e do que você quer incluir. Depois da primeira conversa, montamos o escopo juntos e eu envio uma proposta; o valor varia conforme o que entra agora e o que fica para depois.' },
    { question: 'Quanto tempo leva?', answer: 'Também depende do projeto. O prazo vem na proposta, com a data de cada etapa, e você acompanha o andamento pelo link de teste.' },
    { question: 'Vou conseguir atualizar sozinho?', answer: 'Pequenas trocas de texto e foto ficam por minha conta no acompanhamento. Se preferir editar sozinho, o site pode ganhar um painel de edição simples, como opcional.' },
    { question: 'O site fica no meu nome?', answer: 'Sim. O domínio, as contas e o projeto ficam no seu nome, e você nunca fica preso a mim.' },
    { question: 'E depois da entrega, você continua ajudando?', answer: 'Sim. Continuo acompanhando o projeto, com suporte, ajustes e evolução conforme o seu negócio cresce.' },
  ],
  contact: {
    eyebrow: 'Primeiro passo',
    title: 'Vamos tirar sua ideia do papel?',
    lead: 'A primeira conversa é sem compromisso. Você conta, eu escuto e te digo o caminho mais simples.',
    note: 'Respondo pessoalmente, pelo canal que você escolher.',
    submit: 'Quero conversar sobre meu projeto',
    whatsapp: 'Prefiro conversar pelo WhatsApp',
  },
} as const;
