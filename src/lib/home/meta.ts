import type { Profile } from '../../content/schemas/profile';
import { displayNameOf } from '../content/display-name';
import { TITLE_SEPARATOR } from '../seo/meta';

/** AEO and search snippets read these bounds off the home page. */
const MAX_TITLE = 70;
const MAX_DESCRIPTION = 200;

/**
 * Home <title> and meta description. The bio is the page's lead, not its
 * summary: at 600+ characters it gets truncated by every consumer, so the
 * one-paragraph positioning is the description.
 */
export const homeMeta = (
  profile: Pick<Profile, 'name' | 'displayName' | 'headline' | 'positioning'>,
) => {
  const name = displayNameOf(profile);
  const full = `${name}${TITLE_SEPARATOR}${profile.headline}`;
  const short = `${name}${TITLE_SEPARATOR}${profile.headline.split(',')[0].trim()}`;
  const title = full.length <= MAX_TITLE ? full : short.length <= MAX_TITLE ? short : name;

  const text = profile.positioning.replace(/\s+/g, ' ').trim();
  const description =
    text.length <= MAX_DESCRIPTION
      ? text
      : `${text.slice(0, MAX_DESCRIPTION - 1).replace(/\s+\S*$/, '')}…`;

  return { title, description };
};
