import type { Post } from '../../content/schemas/post';
import { GITHUB_REPOSITORIES_URL, type OpenSourceRepo } from '../catalog/open-source';
import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { formatPeriod } from '../about/period';
import {
  COLLECTION_LABELS,
  collectionOfBlock,
  type CatalogCollection,
} from '../catalog/groups';
import type { ArchiveYear } from '../content';
import { COLOPHON } from '../about/colophon';
import { absoluteUrl } from '../aeo/urls';
import { MCP_TOOLS } from '../mcp/catalog';

const AVAILABILITY_LABEL: Record<Profile['availability']['status'], string> = {
  open: 'Disponível para novos projetos',
  limited: 'Disponibilidade limitada',
  closed: 'Indisponível no momento',
};

const frontmatter = (title: string, url: string): string[] => [
  '---',
  `title: ${title}`,
  `url: ${url}`,
  '---',
  '',
];

const situationOf = (project: Project): string[] => [
  ...(project.discontinued ? ['Descontinuado'] : []),
  ...(project.confidential ? ['Confidencial'] : []),
];

const caseHref = (project: Project): string =>
  `/${collectionOfBlock(project.block)}/${project.slug}`;

export const homeMarkdown = ({
  site,
  profile,
  portfolio,
  lab,
}: {
  site: URL;
  profile: Profile;
  portfolio: readonly Project[];
  lab: readonly Project[];
}): string => {
  const lines: string[] = [
    ...frontmatter(profile.headline, absoluteUrl(site, '/')),
    `# ${profile.headline}`,
    '',
    profile.positioning.trim(),
    '',
    `**${AVAILABILITY_LABEL[profile.availability.status]}**`,
    '',
  ];

  const collections: Array<{ label: string; path: CatalogCollection; items: readonly Project[] }> =
    [
      { label: COLLECTION_LABELS.portfolio, path: 'portfolio', items: portfolio },
      { label: COLLECTION_LABELS.lab, path: 'lab', items: lab },
    ];

  for (const { label, path, items } of collections) {
    lines.push(`## ${label}`, '');
    const shown = items.slice(0, 5);
    if (shown.length === 0) {
      lines.push('- Nenhum case publicado nesta coleção ainda.', '');
      continue;
    }
    for (const project of shown) {
      lines.push(
        `- [${project.title}](${absoluteUrl(site, `/${path}/${project.slug}`)}): ${project.summary}`,
      );
    }
    lines.push('');
  }

  lines.push('## Serviços', '');
  for (const service of profile.services) {
    lines.push(`### ${service.title}`, '', service.description.trim(), '');
  }

  return lines.join('\n');
};

export const aboutMarkdown = ({
  site,
  profile,
  projects,
}: {
  site: URL;
  profile: Profile;
  projects: readonly Project[];
}): string => {
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const lines: string[] = [
    ...frontmatter(`Sobre | ${profile.name}`, absoluteUrl(site, '/sobre')),
    `# ${profile.headline}`,
    '',
    profile.bio.trim(),
    '',
    profile.positioning.trim(),
    '',
    '## Resultados',
    '',
  ];

  for (const stat of profile.trajectory) {
    lines.push(`- **${stat.value}** (${stat.label}): ${stat.context.trim()}`);
  }

  lines.push('', '## Como posso ajudar', '');
  for (const service of profile.services) {
    lines.push(`### ${service.title}`, '', service.description.trim());
    const project = bySlug.get(service.caseSlug);
    if (project) {
      lines.push(
        '',
        `- Case: [${project.title}](${absoluteUrl(site, caseHref(project))})`,
      );
    }
    lines.push('');
  }

  if (profile.work && profile.work.length > 0) {
    lines.push('## Experiência', '');
    for (const job of profile.work) {
      lines.push(
        `### ${job.position}`,
        '',
        `- ${formatPeriod(job.startDate, job.endDate)} · ${job.name}`,
      );
      if (job.summary) lines.push(`- ${job.summary}`);
      if (job.highlights) {
        for (const highlight of job.highlights) {
          lines.push(`- ${highlight}`);
        }
      }
      lines.push('');
    }
  }

  if (profile.education && profile.education.length > 0) {
    lines.push('## Formação', '');
    for (const entry of profile.education) {
      lines.push(
        `- ${formatPeriod(entry.startDate, entry.endDate)}: ${entry.studyType} em ${entry.area}, ${entry.institution}`,
      );
    }
    lines.push('');
  }

  lines.push('## Stack', '');
  for (const item of profile.stack) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  lines.push(`## ${COLOPHON.title}`, '', COLOPHON.intro, '');
  for (const item of COLOPHON.items) {
    const link = item.link ? ` [${item.link.label}](${absoluteUrl(site, item.link.href)})` : '';
    lines.push(`- **${item.label}:** ${item.text}${link}`);
  }
  lines.push('');

  return lines.join('\n');
};

export const collectionMarkdown = ({
  site,
  collection,
  title,
  description,
  projects,
  openSource = [],
}: {
  site: URL;
  collection: CatalogCollection;
  title: string;
  description: string;
  projects: readonly Project[];
  /** The lab closes with the open repositories that have no case. */
  openSource?: readonly OpenSourceRepo[];
}): string => {
  const lines: string[] = [
    ...frontmatter(title, absoluteUrl(site, `/${collection}`)),
    `# ${title}`,
    '',
    description.trim(),
    '',
  ];

  for (const project of projects) {
    const path = collectionOfBlock(project.block);
    const situation = situationOf(project);
    lines.push(`## ${project.title}`, '', project.summary, '');
    lines.push(`- Stack: ${project.tech.join(', ')}`);
    if (situation.length > 0) {
      lines.push(`- Situação: ${situation.join(', ')}`);
    }
    lines.push(
      `- Markdown: [${project.slug}.md](${absoluteUrl(site, `/${path}/${project.slug}.md`)})`,
      '',
    );
  }

  if (openSource.length > 0) {
    lines.push('## Outros projetos abertos', '');
    for (const repo of openSource) {
      lines.push(`- [${repo.name}](${repo.url}): ${repo.description} (${repo.language}, ${repo.year})`);
    }
    lines.push('', `Todos os repositórios: ${GITHUB_REPOSITORIES_URL}`, '');
  }

  return lines.join('\n');
};

const postListLines = (site: URL, posts: readonly Post[]): string[] => {
  const lines: string[] = [];
  for (const post of posts) {
    lines.push(
      `- ${post.date}: [${post.title}](${absoluteUrl(site, `/${post.slug}`)}): ${post.summary}`,
    );
  }
  return lines;
};

export const postsMarkdown = ({
  site,
  posts,
}: {
  site: URL;
  posts: readonly Post[];
}): string => {
  const lines: string[] = [
    ...frontmatter('Posts', absoluteUrl(site, '/posts')),
    '# Posts',
    '',
    ...postListLines(site, posts),
    '',
  ];
  return lines.join('\n');
};

export const archiveMarkdown = ({
  site,
  years,
}: {
  site: URL;
  years: readonly ArchiveYear[];
}): string => {
  const lines: string[] = [
    ...frontmatter('Arquivo', absoluteUrl(site, '/posts/arquivo')),
    '# Arquivo',
    '',
  ];

  for (const entry of years) {
    const label = entry.count === 1 ? '1 texto' : `${entry.count} textos`;
    lines.push(
      `- [${entry.year}](${absoluteUrl(site, `/posts/arquivo/${entry.year}`)}): ${label}`,
    );
  }
  lines.push('');
  return lines.join('\n');
};

export const archiveYearMarkdown = ({
  site,
  year,
  posts,
}: {
  site: URL;
  year: string;
  posts: readonly Post[];
}): string => {
  const lines: string[] = [
    ...frontmatter(`Arquivo ${year}`, absoluteUrl(site, `/posts/arquivo/${year}`)),
    `# Arquivo ${year}`,
    '',
    ...postListLines(site, posts),
    '',
  ];
  return lines.join('\n');
};

export const contactMarkdown = ({
  site,
  profile,
}: {
  site: URL;
  profile: Profile;
}): string => {
  const github = profile.contacts.find((contact) => contact.kind === 'github');
  const linkedin = profile.contacts.find((contact) => contact.kind === 'linkedin');

  const lines: string[] = [
    ...frontmatter('Contato', absoluteUrl(site, '/contato')),
    '# Contato',
    '',
    'Canal direto para humanos e agentes. O e-mail fica na página humana; aqui o caminho é público e sem vazamento.',
    '',
    '## Perfis',
    '',
  ];

  if (github) lines.push(`- GitHub: ${github.value}`);
  if (linkedin) lines.push(`- LinkedIn: ${linkedin.value}`);

  lines.push(
    '',
    '## Para agentes',
    '',
    `- \`POST /api/hire\`: envie um briefing de projeto.`,
    `- [/mcp](${absoluteUrl(site, '/mcp')}): como plugar este site via MCP.`,
    '',
  );

  return lines.join('\n');
};

const MCP_CLIENTS = [
  {
    name: 'Claude Code',
    steps: ['No terminal, adicione o servidor:'],
    code: (endpoint: string) => `claude mcp add --transport http nandomoreira ${endpoint}`,
    after: 'Depois pergunte: o que o Fernando já colocou em produção?',
  },
  {
    name: 'Claude',
    steps: ['Em Configurações, Conectores, adicione um conector personalizado e cole o endereço:'],
    code: (endpoint: string) => endpoint,
    after: 'Conecte e peça para ele avaliar os cases.',
  },
  {
    name: 'ChatGPT',
    steps: [
      'Em Configurações, Apps e conectores, ative o modo desenvolvedor e crie um conector com o endereço:',
    ],
    code: (endpoint: string) => endpoint,
    after: 'Peça para ele chamar get_resume ou check_availability.',
  },
  {
    name: 'Qualquer cliente MCP',
    steps: ['Cadastre um servidor Streamable HTTP com o endereço:'],
    code: (endpoint: string) => endpoint,
    after: `Rode tools/list para ver as ${MCP_TOOLS.length} tools.`,
  },
] as const;

export const connectMarkdown = ({ site }: { site: URL }): string => {
  const endpoint = absoluteUrl(site, '/api/mcp');
  const lines: string[] = [
    ...frontmatter('Conectar via MCP', absoluteUrl(site, '/mcp')),
    '# Este site fala com Agentes de IA',
    '',
    'Adicione este portfólio como conector e o seu agente lê o perfil, os cases e o currículo, e confere a disponibilidade. Sem conta, sem chave e sem cadastro.',
    '',
    '## Endpoint MCP',
    '',
    `\`${endpoint}\``,
    '',
    'Streamable HTTP, protocolo 2025-11-25, só leitura.',
    '',
    '## Como conectar',
    '',
  ];

  for (const client of MCP_CLIENTS) {
    lines.push(`### ${client.name}`, '');
    for (const step of client.steps) lines.push(step, '');
    lines.push('```', client.code(endpoint), '```', '', client.after, '');
  }

  lines.push('## Tools', '');
  for (const tool of MCP_TOOLS) {
    lines.push(`- \`${tool.name}\`: ${tool.description}`);
  }

  lines.push(
    '',
    '## Para propor um projeto',
    '',
    'As tools são só de leitura. Para mandar um briefing, o agente faz um `POST /api/hire`.',
    '',
  );

  return lines.join('\n');
};
