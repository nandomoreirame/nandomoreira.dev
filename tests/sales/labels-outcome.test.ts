import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/lib/hire/schema';
import { SERVICE_LABELS, SERVICE_OPTIONS, isService } from '../../src/lib/sales/service-labels';
import { salesOutcomeMessage } from '../../src/lib/sales/outcome';

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

describe('salesOutcomeMessage', () => {
  it.each([
    ['ok', 'status'],
    ['invalido', 'alert'],
    ['limite', 'alert'],
    ['erro', 'alert'],
  ] as const)('maps %s to role %s', (value, role) => {
    expect(salesOutcomeMessage(value)?.role).toBe(role);
  });

  it('points to WhatsApp when the form fails', () => {
    for (const value of ['limite', 'erro']) {
      expect(salesOutcomeMessage(value)?.text).toContain('WhatsApp');
    }
  });

  it('names the contact rule when the form is invalid', () => {
    expect(salesOutcomeMessage('invalido')?.text).toContain('e-mail ou WhatsApp');
  });

  it.each(['toString', null, '', 'xyz', 'OK'] as const)(
    'shows nothing for unknown value %j',
    (value) => {
      expect(salesOutcomeMessage(value)).toBeUndefined();
    },
  );
});
