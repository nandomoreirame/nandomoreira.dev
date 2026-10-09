/** One icon per contact channel, shared by the footer, the home and /sobre. */
const CONTACT_ICONS: Record<string, string> = {
  email: 'lucide:mail',
  github: 'simple-icons:github',
  linkedin: 'simple-icons:linkedin',
  site: 'lucide:globe',
};

export const contactIconFor = (kind: string): string | undefined => CONTACT_ICONS[kind];
