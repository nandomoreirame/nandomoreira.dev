import { describe, expect, it } from 'vitest';
import { initialsFromSlug } from '../../src/lib/image-fallback';

describe('initialsFromSlug', () => {
  it('takes the first letter of each hyphen-separated word', () => {
    expect(initialsFromSlug('amnesia-claude-code')).toBe('AC');
  });

  it('falls back to the first two letters for a single-word slug', () => {
    expect(initialsFromSlug('forja')).toBe('FO');
  });

  it('is deterministic: the same slug always yields the same initials', () => {
    expect(initialsFromSlug('devkit-claude-plugins')).toBe(
      initialsFromSlug('devkit-claude-plugins'),
    );
  });

  it('never returns more than two characters', () => {
    expect(initialsFromSlug('a-b-c-d-e-f')).toHaveLength(2);
  });

  it('rejects an empty slug rather than rendering a blank card', () => {
    expect(() => initialsFromSlug('')).toThrow();
  });
});
