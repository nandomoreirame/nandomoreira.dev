import { validate } from '@jsonresume/schema';
import { describe, expect, it } from 'vitest';
import { buildResume } from '../../src/lib/aeo/resume';
import { getAllProjects, getProfile } from '../../src/lib/content';

const site = new URL('https://nandomoreira.dev');

interface ValidationResult {
  error: unknown;
  valid: boolean;
}

/** The published validator is callback-based; wrap it once instead of at each use. */
const validateResume = (resume: unknown): Promise<ValidationResult> =>
  new Promise(resolve => {
    validate(resume, (error: unknown, valid: boolean) => resolve({ error, valid }));
  });

describe('the résumé validates against the published JSON Resume schema', () => {
  it('accepts the payload built from the real content', async () => {
    const resume = buildResume({
      site,
      profile: await getProfile(),
      projects: await getAllProjects(),
    });

    const { error, valid } = await validateResume(resume);

    expect(valid, JSON.stringify(error)).toBe(true);
  });

  it('accepts the extension block, which is why it lives in a root key', async () => {
    const resume = buildResume({
      site,
      profile: await getProfile(),
      projects: await getAllProjects(),
    });

    expect(resume.x_agent).toBeDefined();
    expect((await validateResume(resume)).valid).toBe(true);
  });

  it('proves the gate bites: a malformed basics block is rejected', async () => {
    // Without this, a validator that silently approved everything would look
    // identical to a passing suite.
    const resume = buildResume({
      site,
      profile: await getProfile(),
      projects: await getAllProjects(),
    });

    const broken = { ...resume, basics: { ...resume.basics, url: 'not-a-url' } };

    expect((await validateResume(broken)).valid).toBe(false);
  });
});
