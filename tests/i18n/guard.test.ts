import { describe, expect, it } from 'vitest';
import { enStaticPaths } from '../../src/lib/i18n/guard';

describe('enStaticPaths', () => {
  it('builds no English page while the flag is off', async () => {
    expect(await enStaticPaths(async () => [{ params: { slug: 'a' } }], false)).toEqual([]);
  });

  it('builds them once live', async () => {
    expect(await enStaticPaths(async () => [{ params: { slug: 'a' } }], true)).toEqual([{ params: { slug: 'a' } }]);
  });
});
