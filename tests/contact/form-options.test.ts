import { describe, expect, it } from 'vitest';
import { BUDGET_OPTIONS, INTEREST_OPTIONS, outcomeMessage } from '../../src/lib/contact/form-options';
import { BUDGETS, INTERESTS } from '../../src/lib/hire/schema';

describe('contact form options', () => {
  it('offers exactly the budgets the API accepts, in order', () => {
    expect(BUDGET_OPTIONS.map(option => option.value)).toEqual([...BUDGETS]);
  });

  it('offers exactly the interests the API accepts, in order', () => {
    expect(INTEREST_OPTIONS.map(option => option.value)).toEqual([...INTERESTS]);
  });

  it('labels the budgets in reais', () => {
    expect(BUDGET_OPTIONS.find(option => option.value === '10k-30k')?.label).toBe('R$ 10–30 mil');
  });
});

describe('outcomeMessage', () => {
  it('announces success politely and failures assertively', () => {
    expect(outcomeMessage('ok')?.role).toBe('status');
    for (const outcome of ['invalido', 'limite', 'erro']) {
      expect(outcomeMessage(outcome)?.role).toBe('alert');
    }
  });

  it('ignores anything that is not a known outcome', () => {
    expect(outcomeMessage(null)).toBeUndefined();
    expect(outcomeMessage('<script>')).toBeUndefined();
    expect(outcomeMessage('toString')).toBeUndefined();
  });

  it('offers consultoria and no longer AEO as an interest', () => {
    expect(INTEREST_OPTIONS).toContainEqual({ value: 'consulting', label: 'Consultoria' });
    expect(INTEREST_OPTIONS.map(option => option.value)).not.toContain('aeo');
  });
});
