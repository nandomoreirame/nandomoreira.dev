import { absoluteUrl } from '../aeo/urls';

/**
 * The privacy policy as data: one source for the page and for its markdown.
 * Every retention period stated here is enforced in code (src/lib/hire/store.ts)
 * or by the platform default, so changing a number here without changing that
 * is how the policy starts to lie.
 */
export const POLICY_UPDATED_AT = '2026-10-14';

export interface PolicySection {
  id: string;
  title: string;
  paragraphs: string[];
}

export const privacySections: PolicySection[] = [
  {
    id: 'responsavel',
    title: 'Quem é o responsável',
    paragraphs: [
      'Este site é pessoal. O responsável pelos dados (o controlador, nos termos da LGPD) sou eu, Fernando Moreira. Os pedidos sobre seus dados vêm direto para mim, pelo canal no fim desta página.',
    ],
  },
  {
    id: 'nao-coletado',
    title: 'O que não é coletado',
    paragraphs: [
      'O site não usa cookies de rastreamento, pixel de anúncio, gravação de sessão nem serviços de analytics de terceiros. A contagem de visitas descrita na seção seguinte roda no próprio servidor e não guarda seu IP nem seu nome. Enquanto você só navega, ela não diz quem você é; se você enviar o formulário ou baixar o currículo, as páginas que viu naquele dia passam a ir junto com o nome e o e-mail que você informou.',
      'Fontes, estilos e o único script são servidos pelo próprio domínio. O script faz o efeito do ponteiro e o botão Copiar, e não envia nada a lugar nenhum.',
      'Uma exceção: um texto antigo do blog exibe uma imagem hospedada no CodePen. Ao abrir esse texto, seu navegador pede a imagem ao CodePen, que recebe seu endereço IP como em qualquer requisição.',
    ],
  },
  {
    id: 'medicao',
    title: 'Contagem de visitas',
    paragraphs: [
      'Para saber quais textos e canais trazem leitores, o servidor conta as visitas sem nenhum script e sem cookie. Nas páginas montadas a cada acesso, a contagem acontece na própria requisição; nos textos e cases, que são arquivos estáticos, uma imagem transparente de 1×1 pixel servida pelo próprio domínio faz a mesma contagem.',
      'Em cada visita guardo a página, o horário, o site de onde você veio (só o domínio, como linkedin.com), os parâmetros utm_source, utm_medium e utm_campaign quando o link os trouxer, o país informado pela Cloudflare, a cidade e o estado aproximados que ela deduz do seu IP (esses dois só no registro de cada visita, apagado em 30 dias, nunca nos totais) e o tipo de visitante (pessoa, agente de IA ou robô).',
      'Para ligar as páginas de uma mesma visita sem cookie, calculo um código a partir do seu IP e do seu navegador, misturados com uma chave secreta que muda todo dia. O IP não é gravado, e o código de um dia não se liga ao do dia seguinte. Se você enviar o formulário ou baixar o currículo, o aviso que eu recebo inclui as páginas que você viu naquele dia.',
      'Os cliques nos meus contatos e nos links dos projetos passam por um endereço /go/ do próprio site antes de seguir para o destino, para que eu saiba quais são usados.',
      'Os registros de cada visita são apagados em 30 dias. Depois disso ficam só totais por dia, sem nenhum código de visitante, por 24 meses. Tudo fica no Firestore, do Google Cloud, nos Estados Unidos. Base legal: legítimo interesse (art. 7º, IX da LGPD).',
    ],
  },
  {
    id: 'registros',
    title: 'Registros técnicos da hospedagem',
    paragraphs: [
      'O site roda no Firebase App Hosting, do Google Cloud, nos Estados Unidos. Como todo servidor, ele registra cada requisição: endereço IP, navegador (user agent), página pedida, horário e resultado.',
      'Esses registros servem para manter o site no ar e investigar abuso, e ficam no Google Cloud Logging por 30 dias, o prazo padrão da plataforma. Base legal: legítimo interesse (art. 7º, IX da LGPD).',
    ],
  },
  {
    id: 'formulario',
    title: 'O que você envia de propósito',
    paragraphs: [
      'Pelo formulário de contato ou pela API para agents (/api/hire) chegam os campos que você preenche: nome, contato, empresa, orçamento, interesses e mensagem. A finalidade é responder você e tratar uma possível proposta de trabalho (art. 7º, V da LGPD).',
      'Junto com a mensagem ficam o endereço IP e o user agent, usados só para limitar abuso e distinguir um agent de um script (legítimo interesse, art. 7º, IX).',
      'A mensagem fica no Firestore, banco do Google Cloud na região us-east4, nos Estados Unidos, e uma cópia chega ao meu e-mail pelo Resend, serviço de envio de e-mail também nos Estados Unidos.',
      'A mensagem é apagada automaticamente 12 meses depois do envio, e a cópia no meu e-mail segue o mesmo prazo. O IP e o user agent ficam em um registro separado, apagado depois de 30 dias, e não vão no e-mail.',
      'Não envie dados sensíveis, como saúde, documentos ou senhas. Nada disso é necessário para começar uma conversa.',
    ],
  },
  {
    id: 'curriculo',
    title: 'Nome e e-mail antes de baixar o currículo',
    paragraphs: [
      'Antes de baixar o currículo, a página /curriculo pede nome e e-mail, os dois opcionais. Eles servem só para eu saber quem baixou e poder retornar o contato, caso faça sentido (legítimo interesse, art. 7º, IX da LGPD). Não entra em lista nenhuma e não recebe newsletter.',
      'Se você pular, nada é gravado: nem nome e e-mail, nem um registro anônimo do download.',
      'Se você deixar nome ou e-mail, eles ficam no Firestore, junto com a data, e uma cópia chega ao meu e-mail pelo Resend. Não guardo o IP nem o user agent desse envio. O registro é apagado automaticamente 12 meses depois, e a cópia no meu e-mail segue o mesmo prazo.',
    ],
  },
  {
    id: 'agentes',
    title: 'Rotas para agents',
    paragraphs: [
      'O servidor MCP, o AGENTS.md, o llms.txt e as versões em markdown das páginas entram na contagem de visitas como as demais páginas. Do MCP guardo o nome do método, da ferramenta chamada e do cliente que se identificou, nunca os argumentos enviados.',
    ],
  },
  {
    id: 'compartilhamento',
    title: 'Com quem os dados são compartilhados',
    paragraphs: [
      'Ninguém compra, recebe ou usa seus dados para marketing. Os únicos que tratam dados em meu nome são o Google Cloud (hospedagem, banco e registros) e o Resend (envio do e-mail de notificação).',
      'Os dois operam nos Estados Unidos, o que é uma transferência internacional de dados, feita para executar o pedido que você fez ao me contatar (art. 33 da LGPD).',
    ],
  },
  {
    id: 'direitos',
    title: 'Seus direitos',
    paragraphs: [
      'Você pode pedir a confirmação de que tenho dados seus, acesso a eles, correção, exclusão antes do prazo, portabilidade e informação sobre com quem foram compartilhados, entre os demais direitos do art. 18 da LGPD. Respondo em até 15 dias.',
      'Se achar que o pedido não foi atendido, você pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
    ],
  },
  {
    id: 'mudancas',
    title: 'Mudanças nesta política',
    paragraphs: [
      'Quando algo mudar no que o site coleta, esta página muda junto, e a data de atualização no topo mostra quando foi.',
    ],
  },
];

export const POLICY_LEAD =
  'Versão curta: este site não usa cookies nem analytics de terceiros. Ele conta visitas no próprio servidor, sem guardar seu IP, e guarda o que você envia de propósito por até 12 meses.';

/** "8 de outubro de 2026", parsed as a calendar date so no timezone shifts it. */
export const formatPolicyDate = (iso: string): string => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

/**
 * The markdown version is a machine surface, so it never prints the e-mail
 * (tests/aeo/no-leak.test.ts); it points at the contact page instead.
 */
export const privacyMarkdown = ({ site }: { site: URL }): string => {
  const lines = [
    '---',
    'title: Política de privacidade',
    `url: ${absoluteUrl(site, '/privacidade')}`,
    `updated: ${POLICY_UPDATED_AT}`,
    '---',
    '',
    '# Política de privacidade',
    '',
    POLICY_LEAD,
    '',
  ];

  for (const section of privacySections) {
    lines.push(`## ${section.title}`, '', ...section.paragraphs.flatMap((paragraph) => [paragraph, '']));
  }

  lines.push(
    '## Contato',
    '',
    `Pedidos sobre seus dados: pelo formulário em ${absoluteUrl(site, '/contato')}.`,
    '',
  );

  return lines.join('\n');
};
