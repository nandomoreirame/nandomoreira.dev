import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildResume } from '../../src/lib/aeo/resume';
import { getMachineProjects, getProfile } from '../../src/lib/content';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('English résumé', () => {
  it('is built from the English profile', async () => {
    const resume = buildResume({
      site: new URL('https://nandomoreira.dev'),
      profile: await getProfile('en'),
      projects: await getMachineProjects(),
    });
    expect(resume.basics?.label).toBe((await getProfile('en')).headline);
    expect(ptLeftovers(`<p>${JSON.stringify(resume.basics)} ${JSON.stringify(resume.work)}</p>`)).toEqual([]);
  });

  it.each(['src/pages/api/resume.json.ts', 'src/pages/api/resume.txt.ts'])(
    '%s reads the English profile',
    (file) => {
      const source = readFileSync(file, 'utf8');
      expect(source).toContain("getProfile('en')");
      expect(source).toContain('getMachineProjects()');
    },
  );
});
