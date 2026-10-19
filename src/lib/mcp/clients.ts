import { absoluteUrl } from '../aeo/urls';
import { MCP_TOOLS } from './catalog';

export interface McpClient {
  name: string;
  steps: string[];
  code: string;
  after: string;
}

/** How to connect, per client. Shown on /mcp and published as its HowTo. */
export const mcpClients = (endpoint: string): McpClient[] => [
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

interface HowToStep {
  '@type': 'HowToStep';
  text: string;
}

export interface McpHowToLd {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  inLanguage: 'pt-BR';
  step: Array<{ '@type': 'HowToSection'; name: string; itemListElement: HowToStep[] }>;
}

/** One section per client: the alternatives are clients, the steps are sequential. */
export const mcpHowToLd = (site: URL): McpHowToLd => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Como conectar este portfólio a um agente de IA via MCP',
  description:
    'Adicione o servidor MCP do site ao seu cliente e o agente passa a ler perfil, cases, currículo e disponibilidade.',
  inLanguage: 'pt-BR',
  step: mcpClients(absoluteUrl(site, '/api/mcp')).map(client => ({
    '@type': 'HowToSection',
    name: client.name,
    itemListElement: [
      ...client.steps.map(text => ({ '@type': 'HowToStep' as const, text: `${text} ${client.code}` })),
      { '@type': 'HowToStep' as const, text: client.after },
    ],
  })),
});
