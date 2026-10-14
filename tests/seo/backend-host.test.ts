import { describe, expect, it } from 'vitest';
import { robotsTagFor } from '../../src/lib/seo/backend-host';

describe('robotsTagFor', () => {
  it('keeps the App Hosting backend domain out of the index', () => {
    expect(robotsTagFor('nandomoreira-dev--nandomoreira-dev.us-east4.hosted.app')).toBe('noindex');
  });

  it('never touches the public domain, staging or local hosts', () => {
    for (const host of ['nandomoreira.dev', 'www.nandomoreira.dev', 'nandomoreira.home', 'localhost']) {
      expect(robotsTagFor(host)).toBeUndefined();
    }
  });
});
