import { describe, expect, it } from 'vitest';
import { nestedIncrements } from '../../src/lib/analytics/store';

describe('nestedIncrements', () => {
  it('turns field paths into the nested object a merge set expects', () => {
    const tag = (by: number) => `+${by}`;
    expect(
      nestedIncrements(
        [
          ['traffic', 'human'],
          ['pages', '%2Flab'],
          ['mcp', 'tools', 'get_profile'],
          ['mcp', 'methods', 'tools%2Fcall'],
        ],
        tag,
      ),
    ).toEqual({
      traffic: { human: '+1' },
      pages: { '%2Flab': '+1' },
      mcp: { tools: { get_profile: '+1' }, methods: { 'tools%2Fcall': '+1' } },
    });
  });

  it('sums repeated paths into one increment, for a batch of events', () => {
    const tag = (by: number) => `+${by}`;
    expect(
      nestedIncrements(
        [
          ['mcp', 'methods', 'ping'],
          ['mcp', 'methods', 'ping'],
          ['traffic', 'ai_agent'],
        ],
        tag,
      ),
    ).toEqual({
      mcp: { methods: { ping: '+2' } },
      traffic: { ai_agent: '+1' },
    });
  });
});
