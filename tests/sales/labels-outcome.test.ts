import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/lib/hire/schema';
import { SERVICE_LABELS, SERVICE_OPTIONS, isService } from '../../src/lib/sales/service-labels';

describe('SERVICE_LABELS', () => {
  it('labels every service in pt-BR', () => {
    expect(Object.keys(SERVICE_LABELS).sort()).toEqual([...SERVICES].sort());
    expect(SERVICE_LABELS.undecided).toBe('Ainda não sei');
    expect(SERVICE_LABELS.website).toBe('Site institucional');
  });

  it('offers the options in the schema order', () => {
    expect(SERVICE_OPTIONS.map((option) => option.value)).toEqual([...SERVICES]);
  });
});

describe('isService', () => {
  it('accepts a known service slug', () => {
    expect(isService('website')).toBe(true);
  });

  it.each(['toString', 'constructor', '', undefined, 42] as const)(
    'rejects %j',
    (value) => {
      expect(isService(value)).toBe(false);
    },
  );
});
