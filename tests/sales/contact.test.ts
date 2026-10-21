import { describe, expect, it } from 'vitest';
import { isEmailContact, isReachableContact } from '../../src/lib/sales/contact';

describe('isEmailContact', () => {
  it.each(['ada@exemplo.com', '  ada@exemplo.com.br  '])('accepts %j', value => {
    expect(isEmailContact(value)).toBe(true);
  });

  it.each(['11 91234-5678', 'ada@', 'ada exemplo.com', ''])('rejects %j', value => {
    expect(isEmailContact(value)).toBe(false);
  });
});

describe('isReachableContact', () => {
  it.each([
    'ada@example.com',
    '  ada@example.com  ',
    '11 91234-5678',
    '(11) 91234-5678',
    '+55 11 91234-5678',
    '1132345678',
    '5511912345678',
  ])('accepts %s', value => {
    expect(isReachableContact(value)).toBe(true);
  });

  it.each([
    '',
    'me chama',
    'ada@',
    'ada@example',
    'ada @example.com',
    '   ',
    '91234-5678',
    '+55 11 91234-5678 9',
    '11 9123a-5678',
    '55119123456789',
  ])('rejects %s', value => {
    expect(isReachableContact(value)).toBe(false);
  });
});
