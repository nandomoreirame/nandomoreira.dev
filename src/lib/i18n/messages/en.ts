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
  about: {
    title: 'About',
    pagePath: '~/about',
    buildingSince: (year: number) => `Building software since ${year}`,
    contactCta: 'Get in touch',
    resumeCta: 'Download resume (PDF)',
    results: {
      title: 'Results',
      description:
        'What changed, measured in the operations I worked on. Approximations are stated in the context.',
    },
    help: {
      title: 'How I can help',
      description: 'Three offerings, each with a case that proves it.',
    },
    experience: {
      title: 'Experience',
    },
    education: {
      title: 'Education',
      line: (studyType: string, area: string, institution: string) =>
        `${studyType} in ${area}, ${institution}`,
    },
    stack: 'Stack',
    portraitAlt: (name: string) =>
      `Illustration of ${name}: portrait with glasses and a beard on a dark background with amber lines`,
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
  contactPage: {
    title: 'Contact',
    description:
      'Talk to me about a project, a role or a proposal. Tell me what you need and I reply with what is doable and what is not.',
    heading: "Let's talk",
    lead: 'Tell me what you need. I reply with what is doable and what is not.',
    salesLead: 'Have a business and need a site or a system? See the page built for you.',
    salesLink: 'See the services',
    formHeading: 'Contact form',
    requiredHint: 'Fields marked with * are required.',
    sentTitle: 'Message sent',
    sentAriaLabel: 'Message sent',
    sendAnother: 'Send another message',
    name: 'Name',
    email: 'Email',
    company: 'Company',
    budget: 'Budget',
    budgetPreferNot: 'Prefer not to say for now',
    interestLegend: 'I am interested in',
    message: 'Message',
    messagePlaceholder:
      'What you are building, what success looks like for you and when you need it.',
    honeypot: 'Leave this field empty',
    submit: 'Send message',
    preferEmail: 'I prefer email',
    preferChat: 'Prefer to chat by message?',
    whatsapp: 'Chat on WhatsApp',
    aboutService: 'About:',
    mcpHeading: 'MCP',
    mcpBody: 'Connect your MCP client to this site server.',
    mcpCopyLabel: 'Copy the MCP server URL',
    mcpHowTo: 'How to connect',
  },
  chrome: {
    backToTop: 'Back to top',
    backToTopShort: 'Top',
    opensInNewTab: (label: string) => `${label}. Opens in a new tab`,
  },
};
