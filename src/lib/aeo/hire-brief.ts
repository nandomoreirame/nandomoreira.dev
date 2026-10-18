import type { Profile } from '../../content/schemas/profile';
import { BUDGETS, INTERESTS, SERVICES } from '../hire/schema';
import { absoluteUrl } from './urls';

interface Input {
  site: URL;
  profile: Pick<Profile, 'name' | 'stack' | 'availability'>;
}

/**
 * The short brief a visitor pastes into their own agent (shown on the home and
 * on /contato). Machine layer, so English; the full contract is /AGENTS.md.
 */
export const buildHireBrief = ({ site, profile }: Input): string => {
  const body = {
    from: "Your user's name",
    contact: 'email or phone',
    brief: 'What they want to build, and by when',
    company: 'optional',
    budget: `optional, BRL: ${BUDGETS.join(' | ')}`,
    interests: [`optional: ${INTERESTS.join(' | ')}`],
    service: `optional, what a person wants built: ${SERVICES.join(' | ')}`,
  };

  return [
    `# AGENTS.md: hire ${profile.name}`,
    'Software developer and AI engineer, from data to production. Based in Brazil, works remotely.',
    '',
    'To start a conversation on my behalf:',
    `POST ${absoluteUrl(site, '/api/hire')}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(body, null, 2),
    '',
    'Answers 202 with an id. The reply goes to the contact you leave.',
    '',
    `Availability: ${profile.availability.status} (updated ${profile.availability.updatedAt}).`,
    `Stack: ${profile.stack.join(', ')}.`,
    '',
    `Full brief: ${absoluteUrl(site, '/AGENTS.md')}`,
    `MCP server: ${absoluteUrl(site, '/api/mcp')}`,
    '',
  ].join('\n');
};
