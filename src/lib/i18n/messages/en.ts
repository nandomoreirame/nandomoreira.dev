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
};
