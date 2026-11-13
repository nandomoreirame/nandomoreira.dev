import type { Messages } from './index';

export const en: Messages = {
  layout: {
    skipToContent: 'Skip to content',
    rssTitle: "Fernando Moreira's blog",
  },
  language: {
    names: { 'pt-BR': 'Português', en: 'English' },
    switchTo: 'Read in English',
    suggestion: 'This page is also available in English.',
    suggestionLink: 'Read in English',
    dismiss: 'Dismiss',
  },
  nav: {
    blog: 'Blog',
    portfolio: 'Portfolio',
    lab: 'Lab',
    setup: 'Setup',
    now: 'Now',
    about: 'About',
    mcp: 'MCP',
    contact: 'Contact',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNavigation: 'Main navigation',
    menu: 'Menu',
    mobileNavigation: 'Main menu (mobile)',
  },
  posts: {
    readingTime: (minutes: number) => `${minutes} min read`,
    draft: 'Draft',
    quickPreview: 'Quick preview',
    readFull: 'Read full article',
    keyPoints: 'TL;DR // KEY POINTS',
    summarizeWithAi: 'Summarize with AI:',
    opensInNewTab: (label: string) => `${label}, opens in a new tab`,
    opensInNewTabHint: 'opens in a new tab',
  },
  home: {
    hero: {
      aboutCta: 'Learn more about me',
    },
    services: {
      title: 'What I build for you',
      description: 'Each offering with a case that proves it.',
      salesLead: 'For your business: a site, an online store or a system, explained without jargon.',
      salesLink: 'See the services',
      proofLink: 'See the case that proves it',
    },
    trajectory: {
      title: 'Trajectory and numbers',
    },
    latestPosts: {
      title: 'RECENT POSTS',
      seeAll: 'See all posts on the blog',
    },
    about: {
      title: 'About',
      readMore: 'Read more about me',
    },
    contact: {
      title: 'Contact',
      description: 'Write me directly, or use the form on /en/contact.',
      email: 'Email',
    },
    collection: {
      seeAll: 'See all',
      portfolio: {
        title: 'Portfolio',
        description:
          'Own SaaS products with AI and client work shipped for companies and organizations: AI data platforms, an online store and institutional sites. Each case shows the problem, the technical decisions and the outcome.',
        empty: 'No portfolio case published yet.',
      },
      lab: {
        title: 'Lab',
        description:
          'Open source tools I built to scratch my own itches: apps and plugins for my Linux desktop, CLIs, automations and tooling for AI agents, much of it written alongside the agents themselves.',
        empty: 'No experiment published yet.',
      },
    },
    agentBrief: {
      heading: 'Hire me through your agent.',
      body: 'Paste this brief into ChatGPT, Claude or your own harness. Any agent can read it and start the conversation for you, through the API.',
      contractBefore: 'The full contract is in',
      copyLabel: 'Copy the AGENTS.md brief',
    },
  },

  footer: {
    privacy: 'Privacy',
    channels: 'Channels',
    links: 'Links',
    rss: 'RSS',
    agents: 'AGENTS.md',
    opensInNewTab: (label: string) => `${label}, opens in a new tab`,
    versionLabel: (version: string) => `Version ${version}: the releases of this version`,
    pageView: 'Page view',
  },
  notFound: {
    title: 'Page not found',
    description: 'The requested page does not exist.',
    heading: 'Page not found',
    body: 'The address you opened does not match any page on this site.',
    copyCurl: 'Copy the curl command',
    backHome: 'Back to home',
    explorePortfolio: 'Explore portfolio',
    viewLab: 'View lab',
  },
  chrome: {
    backToTop: 'Back to top',
    backToTopShort: 'Top',
    opensInNewTab: (label: string) => `${label}. Opens in a new tab`,
  },
};
