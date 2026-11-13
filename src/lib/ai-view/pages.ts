import type { Post } from '../../content/schemas/post';
import { GITHUB_REPOSITORIES_URL, type OpenSourceRepo } from '../catalog/open-source';
import type { Profile } from '../../content/schemas/profile';
import type { Project } from '../../content/schemas/project';
import { formatPeriod } from '../about/period';
import { collectionOfBlock, type CatalogCollection } from '../catalog/groups';
import type { ArchiveYear } from '../content';
import { colophon } from '../about/colophon';
import { absoluteUrl } from '../aeo/urls';
import { MCP_TOOLS } from '../mcp/catalog';
import { mcpClients } from '../mcp/clients';
import type { Locale } from '../i18n/locale';
import { withLocale } from '../i18n/locale';
import { messagesFor } from '../i18n/messages';
import { routeFor } from '../i18n/routes';

const frontmatter = (title: string, url: string): string[] => ['---', `title: ${title}`, `url: ${url}`, '---', ''];

const situationOf = (project: Project, locale: Locale): string[] => {
  const t = messagesFor(locale).catalog;
  return [
    ...(project.discontinued ? [t.discontinued] : []),
    ...(project.confidential ? [t.confidential] : []),
  ];
};

const caseHref = (project: Project, locale: Locale): string =>
  withLocale(`/${collectionOfBlock(project.block)}/${project.slug}`, locale);

export const homeMarkdown = ({
  site,
  profile,
  portfolio,
  lab,
  locale = 'pt-BR',
}: {
  site: URL;
  profile: Profile;
  portfolio: readonly Project[];
  lab: readonly Project[];
  locale?: Locale;
}): string => {
  const t = messagesFor(locale);
  const homePath = routeFor('/', locale);
  const lines: string[] = [
    ...frontmatter(profile.headline, absoluteUrl(site, homePath)),
    `# ${profile.headline}`,
    '',
    profile.positioning.trim(),
    '',
    `**${t.aiView.availability[profile.availability.status]}**`,
    '',
  ];

  const collections: Array<{ label: string; path: CatalogCollection; items: readonly Project[] }> = [
    { label: t.home.collection.portfolio.title, path: 'portfolio', items: portfolio },
    { label: t.home.collection.lab.title, path: 'lab', items: lab },
  ];

  for (const { label, path, items } of collections) {
    lines.push(`## ${label}`, '');
    const shown = items.slice(0, 5);
    if (shown.length === 0) {
      lines.push(`- ${t.catalog.empty}`, '');
      continue;
    }
    for (const project of shown) {
      const href = withLocale(`/${path}/${project.slug}`, locale);
      lines.push(`- [${project.title}](${absoluteUrl(site, href)}): ${project.summary}`);
    }
    lines.push('');
  }

  lines.push(`## ${t.aiView.services}`, '');
  for (const service of profile.services) {
    lines.push(`### ${service.title}`, '', service.description.trim(), '');
  }

  return lines.join('\n');
};

export const aboutMarkdown = ({
  site,
  profile,
  projects,
  locale = 'pt-BR',
}: {
  site: URL;
  profile: Profile;
  projects: readonly Project[];
  locale?: Locale;
}): string => {
  const t = messagesFor(locale);
  const aboutPath = routeFor('/sobre', locale);
  const bySlug = new Map(projects.map(project => [project.slug, project]));
  const siteColophon = colophon(locale);
  const lines: string[] = [
    ...frontmatter(`${t.about.title} | ${profile.name}`, absoluteUrl(site, aboutPath)),
    `# ${profile.headline}`,
    '',
    profile.bio.trim(),
    '',
    profile.positioning.trim(),
    '',
    `## ${t.about.results.title}`,
    '',
  ];

  for (const stat of profile.trajectory) {
    lines.push(`- **${stat.value}** (${stat.label}): ${stat.context.trim()}`);
  }

  lines.push('', `## ${t.about.help.title}`, '');
  for (const service of profile.services) {
    lines.push(`### ${service.title}`, '', service.description.trim());
    const project = bySlug.get(service.caseSlug);
    if (project) {
      lines.push(
        '',
        `- ${t.aiView.caseLabel}: [${project.title}](${absoluteUrl(site, caseHref(project, locale))})`,
      );
    }
    lines.push('');
  }

  if (profile.work && profile.work.length > 0) {
    lines.push(`## ${t.about.experience.title}`, '');
    for (const job of profile.work) {
      lines.push(
        `### ${job.position}`,
        '',
        `- ${formatPeriod(job.startDate, job.endDate, locale)} · ${job.name}`,
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
    lines.push(`## ${t.about.education.title}`, '');
    for (const entry of profile.education) {
      lines.push(
        `- ${formatPeriod(entry.startDate, entry.endDate, locale)}: ${t.about.education.line(entry.studyType, entry.area, entry.institution)}`,
      );
    }
    lines.push('');
  }

  lines.push(`## ${t.about.stack}`, '');
  for (const item of profile.stack) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  lines.push(`## ${siteColophon.title}`, '', siteColophon.intro, '');
  for (const item of siteColophon.items) {
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
  locale = 'pt-BR',
}: {
  site: URL;
  collection: CatalogCollection;
  title: string;
  description: string;
  projects: readonly Project[];
  /** The lab closes with the open repositories that have no case. */
  openSource?: readonly OpenSourceRepo[];
  locale?: Locale;
}): string => {
  const t = messagesFor(locale);
  const collectionPath = routeFor(`/${collection}`, locale);
  const lines: string[] = [
    ...frontmatter(title, absoluteUrl(site, collectionPath)),
    `# ${title}`,
    '',
    description.trim(),
    '',
  ];

  for (const project of projects) {
    const path = collectionOfBlock(project.block);
    const situation = situationOf(project, locale);
    const mdHref = withLocale(`/${path}/${project.slug}.md`, locale);
    lines.push(`## ${project.title}`, '', project.summary, '');
    lines.push(`- ${t.aiView.stackLabel}: ${project.tech.join(', ')}`);
    if (situation.length > 0) {
      lines.push(`- ${t.aiView.situationLabel}: ${situation.join(', ')}`);
    }
    lines.push(
      `- ${t.aiView.markdownLabel}: [${project.slug}.md](${absoluteUrl(site, mdHref)})`,
      '',
    );
  }

  if (openSource.length > 0) {
    lines.push(`## ${t.catalog.openSourceHeading}`, '');
    for (const repo of openSource) {
      const descriptionText = locale === 'en' ? repo.descriptionEn : repo.description;
      lines.push(`- [${repo.name}](${repo.url}): ${descriptionText} (${repo.language}, ${repo.year})`);
    }
    lines.push('', `${t.aiView.allRepos}: ${GITHUB_REPOSITORIES_URL}`, '');
  }

  return lines.join('\n');
};

const postListLines = (site: URL, posts: readonly Post[], locale: Locale): string[] => {
  const lines: string[] = [];
  for (const post of posts) {
    const href = withLocale(`/${post.slug}`, locale);
    lines.push(`- ${post.date}: [${post.title}](${absoluteUrl(site, href)}): ${post.summary}`);
  }
  return lines;
};

export const postsMarkdown = ({
  site,
  posts,
  locale = 'pt-BR',
}: {
  site: URL;
  posts: readonly Post[];
  locale?: Locale;
}): string => {
  const t = messagesFor(locale).aiView;
  const postsPath = routeFor('/posts', locale);
  const lines: string[] = [
    ...frontmatter(t.postsTitle, absoluteUrl(site, postsPath)),
    `# ${t.postsTitle}`,
    '',
    ...postListLines(site, posts, locale),
    '',
  ];
  return lines.join('\n');
};

export const archiveMarkdown = ({
  site,
  years,
  locale = 'pt-BR',
}: {
  site: URL;
  years: readonly ArchiveYear[];
  locale?: Locale;
}): string => {
  const t = messagesFor(locale).aiView;
  const lines: string[] = [
    ...frontmatter(t.archiveTitle, absoluteUrl(site, '/posts/arquivo')),
    `# ${t.archiveTitle}`,
    '',
  ];

  for (const entry of years) {
    lines.push(
      `- [${entry.year}](${absoluteUrl(site, `/posts/arquivo/${entry.year}`)}): ${t.archiveCount(entry.count)}`,
    );
  }
  lines.push('');
  return lines.join('\n');
};

export const archiveYearMarkdown = ({
  site,
  year,
  posts,
  locale = 'pt-BR',
}: {
  site: URL;
  year: string;
  posts: readonly Post[];
  locale?: Locale;
}): string => {
  const t = messagesFor(locale).aiView;
  const lines: string[] = [
    ...frontmatter(`${t.archiveTitle} ${year}`, absoluteUrl(site, `/posts/arquivo/${year}`)),
    `# ${t.archiveTitle} ${year}`,
    '',
    ...postListLines(site, posts, locale),
    '',
  ];
  return lines.join('\n');
};

export const contactMarkdown = ({
  site,
  profile,
  locale = 'pt-BR',
}: {
  site: URL;
  profile: Profile;
  locale?: Locale;
}): string => {
  const t = messagesFor(locale);
  const contactPath = routeFor('/contato', locale);
  const mcpPath = routeFor('/mcp', locale);
  const github = profile.contacts.find(contact => contact.kind === 'github');
  const linkedin = profile.contacts.find(contact => contact.kind === 'linkedin');

  const lines: string[] = [
    ...frontmatter(t.contactPage.title, absoluteUrl(site, contactPath)),
    `# ${t.contactPage.title}`,
    '',
    t.aiView.contactLead,
    '',
    `## ${t.aiView.contactProfiles}`,
    '',
  ];

  if (github) lines.push(`- GitHub: ${github.value}`);
  if (linkedin) lines.push(`- LinkedIn: ${linkedin.value}`);

  lines.push(
    '',
    `## ${t.aiView.contactAgents}`,
    '',
    `- \`POST /api/hire\`: ${t.aiView.contactHire}`,
    `- [${mcpPath}](${absoluteUrl(site, mcpPath)}): ${t.aiView.contactMcpLink}`,
    '',
  );

  return lines.join('\n');
};

export const connectMarkdown = ({
  site,
  locale = 'pt-BR',
}: {
  site: URL;
  locale?: Locale;
}): string => {
  const t = messagesFor(locale).mcpPage;
  const ai = messagesFor(locale).aiView;
  const mcpPath = routeFor('/mcp', locale);
  const endpoint = absoluteUrl(site, '/api/mcp');
  const clients = mcpClients(endpoint, locale);
  const lines: string[] = [
    ...frontmatter(t.title, absoluteUrl(site, mcpPath)),
    `# ${t.heading}`,
    '',
    t.lead,
    '',
    `## ${t.endpointHeading}`,
    '',
    `\`${endpoint}\``,
    '',
    t.endpointHint,
    '',
    `## ${t.connectHeading}`,
    '',
  ];

  for (const client of clients) {
    lines.push(`### ${client.name}`, '');
    for (const step of client.steps) lines.push(step, '');
    lines.push('```', client.code, '```', '', client.after, '');
  }

  lines.push(`## ${ai.toolsHeading}`, '');
  for (const tool of MCP_TOOLS) {
    lines.push(`- \`${tool.name}\`: ${t.tools[tool.name]}`);
  }

  lines.push(
    '',
    `## ${t.briefingHeading}`,
    '',
    `${t.briefingBeforeCode} \`POST /api/hire\`.`,
    '',
  );

  return lines.join('\n');
};
