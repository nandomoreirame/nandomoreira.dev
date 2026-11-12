import { describe, expect, it } from 'vitest';
import { en } from '../../src/lib/i18n/messages/en';
import { messagesFor } from '../../src/lib/i18n/messages';
import { ptBR } from '../../src/lib/i18n/messages/pt-BR';

/** Every leaf path of a nested object, e.g. "nav.blog". */
const leaves = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key))
    : [prefix];

const values = (value: unknown): unknown[] =>
  typeof value === 'object' && value !== null ? Object.values(value).flatMap(values) : [value];

describe('messages', () => {
  it('has the same keys in both languages (REQ-007)', () => {
    expect(leaves(en).sort()).toEqual(leaves(ptBR).sort());
  });

  it('has no empty string', () => {
    for (const text of [...values(ptBR), ...values(en)]) {
      expect(typeof text === 'string' ? text.trim() : 'fn').not.toBe('');
    }
  });

  it('uses no em dash or en dash in either language', () => {
    for (const text of [...values(ptBR), ...values(en)]) {
      if (typeof text === 'string') expect(text).not.toMatch(/[–—]/);
    }
  });

  it('resolves by locale', () => {
    expect(messagesFor('pt-BR')).toBe(ptBR);
    expect(messagesFor('en')).toBe(en);
  });

  it('proves the parity check can fail', () => {
    expect(leaves({ a: { b: 'x' } })).not.toEqual(leaves({ a: { c: 'x' } }));
  });
});
