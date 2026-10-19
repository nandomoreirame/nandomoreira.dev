import { describe, expect, it } from 'vitest';
import { isEmailContact } from '../../src/lib/sales/contact';

describe('isEmailContact', () => {
  it.each(['ada@exemplo.com', '  ada@exemplo.com.br  '])('accepts %j', value => {
    expect(isEmailContact(value)).toBe(true);
  });

  it.each(['11 91234-5678', 'ada@', 'ada exemplo.com', ''])('rejects %j', value => {
    expect(isEmailContact(value)).toBe(false);
  });
});
