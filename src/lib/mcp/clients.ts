import { absoluteUrl } from '../aeo/urls';
import type { Locale } from '../i18n/locale';
import { MCP_TOOLS } from './catalog';

export interface McpClient {
  name: string;
  steps: string[];
  code: string;
  after: string;
}

const CLIENTS_PT = (endpoint: string): McpClient[] => [
  {
    name: 'Claude Code',
    steps: ['No terminal, adicione o servidor:'],
    code: `claude mcp add --transport http nandomoreira ${endpoint}`,
    after: 'Depois pergunte: o que o Fernando já colocou em produção?',
  },
  {
    name: 'Claude',
    steps: ['Em Configurações, Conectores, adicione um conector personalizado e cole o endereço:'],
    code: endpoint,
    after: 'Conecte e peça para ele avaliar os cases.',
  },
  {
    name: 'ChatGPT',
    steps: ['Em Configurações, Apps e conectores, ative o modo desenvolvedor e crie um conector com o endereço:'],
    code: endpoint,
    after: 'Peça para ele chamar get_resume ou check_availability.',
  },
  {
    name: 'Qualquer cliente MCP',
    steps: ['Cadastre um servidor Streamable HTTP com o endereço:'],
    code: endpoint,
    after: `Rode tools/list para ver as ${MCP_TOOLS.length} tools.`,
  },
];

const CLIENTS_EN = (endpoint: string): McpClient[] => [
  {
    name: 'Claude Code',
    steps: ['In the terminal, add the server:'],
    code: `claude mcp add --transport http nandomoreira ${endpoint}`,
    after: 'Then ask: what has Fernando already shipped to production?',
  },
  {
    name: 'Claude',
    steps: ['In Settings, Connectors, add a custom connector and paste the address:'],
    code: endpoint,
    after: 'Connect and ask it to review the cases.',
  },
  {
    name: 'ChatGPT',
    steps: ['In Settings, Apps and connectors, turn on developer mode and create a connector with the address:'],
    code: endpoint,
    after: 'Ask it to call get_resume or check_availability.',
  },
  {
    name: 'Any MCP client',
    steps: ['Register a Streamable HTTP server with the address:'],
    code: endpoint,
    after: `Run tools/list to see the ${MCP_TOOLS.length} tools.`,
  },
];

/** How to connect, per client. Shown on /mcp and published as its HowTo. */
export const mcpClients = (endpoint: string, locale: Locale = 'pt-BR'): McpClient[] =>
  locale === 'en' ? CLIENTS_EN(endpoint) : CLIENTS_PT(endpoint);

interface HowToStep {
  '@type': 'HowToStep';
  text: string;
}

export interface McpHowToLd {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  inLanguage: Locale;
  step: Array<{ '@type': 'HowToSection'; name: string; itemListElement: HowToStep[] }>;
}

const HOW_TO_META = {
  'pt-BR': {
    name: 'Como conectar este portfólio a um agente de IA via MCP',
    description:
      'Adicione o servidor MCP do site ao seu cliente e o agente passa a ler perfil, cases, currículo e disponibilidade.',
  },
  en: {
    name: 'How to connect this portfolio to an AI agent via MCP',
    description:
      'Add the site MCP server to your client and the agent can read profile, cases, resume and availability.',
  },
} as const;

/** One section per client: the alternatives are clients, the steps are sequential. */
export const mcpHowToLd = (site: URL, locale: Locale = 'pt-BR'): McpHowToLd => {
  const meta = HOW_TO_META[locale];
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: meta.name,
    description: meta.description,
    inLanguage: locale,
    step: mcpClients(absoluteUrl(site, '/api/mcp'), locale).map(client => ({
      '@type': 'HowToSection',
      name: client.name,
      itemListElement: [
        ...client.steps.map(text => ({
          '@type': 'HowToStep' as const,
          text: `${text} ${client.code}`,
        })),
        { '@type': 'HowToStep' as const, text: client.after },
      ],
    })),
  };
};
