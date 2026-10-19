import { z } from 'zod';
import { SERVICES } from '../hire/schema';

const item = z.object({ title: z.string().min(1), text: z.string().min(1) });

const detailSchema = z.object({
  hero: z.object({ title: z.string().min(1), lead: z.string().min(1), cta: z.string().min(1) }),
  anatomy: z.array(item.extend({ note: z.string().min(1) })).length(4),
  fit: z.array(item).length(4),
  included: z.array(item).min(1),
  addons: z.array(item).min(1),
  underTheHood: z.array(z.string().min(1)).min(1),
  comparison: z.object({
    caption: z.string().min(1),
    columns: z.array(z.string()).length(3),
    rows: z.array(z.object({ criterion: z.string(), values: z.array(z.string()).length(3) })).min(1),
  }),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
});

const serviceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  service: z.enum(SERVICES),
  icon: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  audience: z.string().min(1),
  receives: z.array(z.string().min(1)).min(3).max(4),
  detail: detailSchema.optional(),
});

export type SalesService = z.infer<typeof serviceSchema>;
export type ServiceDetail = z.infer<typeof detailSchema>;

const SITE_INSTITUCIONAL: ServiceDetail = {
  hero: {
    title: 'Site institucional: seu cartão de visita que trabalha 24 horas.',
    lead: 'O endereço oficial do seu negócio na internet, feito para transmitir credibilidade a quem acabou de conhecer você. Sem depender de rede social nem de mensagens soltas para explicar o que você faz.',
    cta: 'Quero um site assim',
  },
  anatomy: [
    {
      title: 'Início',
      text: 'A primeira impressão: quem você é, o que faz e para quem, com um convite para conversar.',
      note: 'Impacto imediato e clareza',
    },
    {
      title: 'Sobre você ou a empresa',
      text: 'Sua história, seus princípios e o seu método. Constrói confiança antes da compra.',
      note: 'Confiança e reputação',
    },
    {
      title: 'Serviços ou produtos',
      text: 'O que você entrega, com clareza. Responde às dúvidas mais comuns antes do primeiro contato.',
      note: 'Explicação sem rodeio',
    },
    {
      title: 'Contato',
      text: 'Caminho direto para falar com você: botão de WhatsApp e um formulário simples.',
      note: 'Canal aberto sem atrito',
    },
  ],
  fit: [
    {
      title: 'Indicações perdidas no meio do caminho',
      text: 'Você depende de indicação boca a boca e perde clientes que procuram o seu nome antes de fechar.',
    },
    {
      title: 'Tempo gasto em explicações repetitivas',
      text: 'Você explica o seu método e responde às mesmas dúvidas em cada primeiro contato.',
    },
    {
      title: 'Buscas no Google sem encontrar você',
      text: 'Você quer aparecer quando alguém da sua cidade procura pelo que você faz, sem depender só de anúncio pago.',
    },
    {
      title: 'Superar a cara de amadorismo',
      text: 'Você quer passar mais segurança do que um perfil de rede social ou um cartão digital genérico.',
    },
  ],
  included: [
    { title: 'Design exclusivo feito sob medida', text: 'Nada de modelo pronto ou site genérico de construtor.' },
    { title: 'Versão para celular', text: 'Layout pensado para celular, tablet e computador.' },
    { title: 'Domínio próprio configurado', text: 'O seu endereço oficial, registrado no seu nome.' },
    { title: 'Cadeado de segurança HTTPS', text: 'Conexão protegida e o cadeado no navegador do visitante.' },
    { title: 'Otimização para o Google', text: 'Estrutura e informações que ajudam o Google a entender o seu site.' },
    { title: 'Botão de WhatsApp', text: 'O visitante começa a conversa com uma mensagem pronta.' },
    { title: 'Formulário de contato simples', text: 'As mensagens chegam organizadas no seu e-mail.' },
    { title: 'Publicação no Firebase Hosting', text: 'Hospedagem rápida e segura na infraestrutura do Google.' },
  ],
  addons: [
    { title: 'Blog integrado', text: 'Espaço para artigos que atraem visitantes pelo Google.' },
    { title: 'Área do cliente', text: 'Acesso com login para materiais, propostas ou consultas.' },
    { title: 'Agendamento online', text: 'O cliente marca um horário direto na sua agenda.' },
    { title: 'Textos escritos por mim', text: 'Escrevo as páginas se você não quiser escrever nada.' },
    { title: 'Versão em inglês', text: 'Para atender clientes de fora do Brasil.' },
    { title: 'Painel de edição', text: 'Para você trocar textos e fotos sozinho, quando quiser.' },
  ],
  underTheHood: [
    'A analogia da vitrine: em vez de pagar o aluguel de um servidor ligado o tempo todo, o seu site funciona como uma vitrine sempre acesa.',
    'Ele é publicado no Firebase Hosting, do Google: uma rede de servidores espalhada pelo mundo, que entrega o site rápido onde o visitante estiver.',
    'Na prática, o site abre rápido em qualquer celular, já vem com o cadeado de segurança e tem um custo de manutenção que costuma ficar perto de zero.',
  ],
  comparison: {
    caption: 'Site institucional, landing page e loja virtual lado a lado',
    columns: ['Site institucional', 'Landing page', 'Loja virtual'],
    rows: [
      {
        criterion: 'Para que serve',
        values: [
          'Apresentar o negócio inteiro e passar credibilidade.',
          'Vender uma única oferta ou captar contatos de uma campanha.',
          'Vender produtos com carrinho de compras.',
        ],
      },
      {
        criterion: 'Quantidade de páginas',
        values: ['De uma a quatro seções ou páginas.', 'Uma página única e focada.', 'Muitas páginas de catálogo.'],
      },
      {
        criterion: 'Foco principal',
        values: [
          'Autoridade, clareza e contato.',
          'Conversão de quem chega por anúncio.',
          'Venda concluída no checkout.',
        ],
      },
      {
        criterion: 'Quando escolher',
        values: [
          'Você presta serviços, tem escritório ou consultoria.',
          'Você vai rodar uma campanha específica.',
          'Você vende mercadorias e precisa de frete e estoque.',
        ],
      },
    ],
  },
  faq: [
    {
      question: 'Quantas páginas ou seções meu site institucional pode ter?',
      answer:
        'Normalmente cabe em uma página com as quatro partes (início, sobre, serviços e contato) ou em até quatro páginas. Se precisar de mais, isso entra na proposta.',
    },
    {
      question: 'Eu mesmo vou conseguir trocar textos e fotos depois?',
      answer:
        'Pequenas trocas de texto e foto ficam por minha conta no acompanhamento. Se preferir editar sozinho, o site pode ganhar um painel de edição simples, como opcional.',
    },
    {
      question: 'O domínio e o site ficam registrados em meu nome?',
      answer: 'Sim. Se você ainda não tem domínio, eu registro no seu nome, e as contas do site também ficam com você.',
    },
    {
      question: 'Quanto tempo leva para ficar pronto?',
      answer:
        'Em geral, de 5 a 30 dias úteis de trabalho, conforme o que o site precisa ter. O prazo exato vem na proposta, com a data de cada etapa.',
    },
  ],
};

/** Landing order. Parsed at load, so a malformed entry fails the build, not a visit. */
export const SALES_SERVICES: readonly SalesService[] = z.array(serviceSchema).parse([
  {
    slug: 'site-institucional',
    service: 'website',
    icon: 'lucide:app-window',
    title: 'Site institucional',
    summary: 'Seu cartão de visita que trabalha 24 horas: explica quem você é, o que oferece e como falar com você.',
    audience: 'Empresas, clínicas e profissionais que precisam de uma presença confiável no Google.',
    receives: [
      'Design sob medida',
      'Feito para ser encontrado no Google',
      'Rápido no celular',
      'Botão de contato direto',
    ],
    detail: SITE_INSTITUCIONAL,
  },
  {
    slug: 'landing-page',
    service: 'landing-page',
    icon: 'lucide:mouse-pointer-click',
    title: 'Landing page',
    summary: 'Uma página focada em um único objetivo: transformar visitantes em contatos ou vendas.',
    audience: 'Lançamentos de produtos, campanhas de anúncios e divulgação de serviços pontuais.',
    receives: [
      'Texto claro e persuasivo',
      'Carregamento rápido',
      'Integração com WhatsApp',
      'Medição de quem virou contato',
    ],
  },
  {
    slug: 'blog',
    service: 'blog',
    icon: 'lucide:newspaper',
    title: 'Blog',
    summary:
      'Seu espaço próprio para publicar artigos, ensinar o seu público e construir autoridade sem depender dos algoritmos das redes.',
    audience: 'Especialistas, consultores e marcas que querem ser encontrados no Google pelo conteúdo.',
    receives: ['Painel simples de escrita', 'Categorias e busca', 'Leitura confortável', 'Compartilhamento fácil'],
  },
  {
    slug: 'loja-virtual',
    service: 'online-store',
    icon: 'lucide:shopping-bag',
    title: 'Loja virtual',
    summary: 'Sua vitrine online com catálogo organizado, carrinho e pagamento seguro.',
    audience: 'Quem quer vender produtos físicos ou digitais sem depender do WhatsApp.',
    receives: [
      'Catálogo fácil de atualizar',
      'Pagamento seguro com Pix e cartão',
      'Cálculo de frete',
      'Painel de pedidos',
    ],
  },
  {
    slug: 'produto-web',
    service: 'web-product',
    icon: 'lucide:layout-dashboard',
    title: 'Produto web completo',
    summary:
      'Um sistema com login, cadastro de usuários e dados guardados com segurança, como um aplicativo, só que direto no navegador.',
    audience: 'Empreendedores e empresas com uma ideia de serviço digital ou plataforma própria.',
    receives: [
      'Área logada com login',
      'Painel administrativo',
      'Banco de dados em tempo real',
      'Cresce junto com o uso',
    ],
  },
  {
    slug: 'automacao-ia',
    service: 'automation',
    icon: 'lucide:bot',
    title: 'Automação e IA',
    summary: 'Rotinas inteligentes que cuidam das tarefas repetitivas da sua operação para liberar o seu tempo.',
    audience: 'Negócios que gastam horas alimentando planilhas, triando e-mails ou respondendo mensagens.',
    receives: [
      'Integração entre as ferramentas que você já usa',
      'Assistente com inteligência artificial',
      'Relatórios automáticos',
      'Menos erros manuais',
    ],
  },
]);

/**
 * The detail pages stay reachable by URL, but the cards do not link to them
 * until they are reviewed in production (sales-landing-tweaks, REQ-010).
 * Flip to true to show "Entender em detalhes" again.
 */
export const SHOW_DETAIL_LINKS = false;

export const serviceAnchor = (slug: string): string => `servico-${slug}`;

export const detailFor = (slug: string): (SalesService & { detail: ServiceDetail }) | undefined => {
  const found = SALES_SERVICES.find(service => service.slug === slug);
  return found?.detail ? (found as SalesService & { detail: ServiceDetail }) : undefined;
};

export const detailSlugs = (): string[] =>
  SALES_SERVICES.filter(service => service.detail).map(service => service.slug);
