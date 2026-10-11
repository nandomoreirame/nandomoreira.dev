import { describe, expect, it } from 'vitest';
import { isAllowedUrl, leaksToMachine, machineText } from '../../src/lib/now/safe';

describe('machineText', () => {
  it('turns raw HTML into inert text', () => {
    expect(machineText('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert\\(1\\)&gt;');
  });

  it('neutralises markdown link syntax', () => {
    expect(machineText('[x](javascript:alert(1))')).toBe('\\[x\\]\\(javascript:alert\\(1\\)\\)');
  });

  it('keeps plain text intact', () => {
    expect(machineText('Red Dead Redemption 2')).toBe('Red Dead Redemption 2');
  });
});

describe('isAllowedUrl', () => {
  it('accepts only https on the expected host', () => {
    expect(isAllowedUrl('https://github.com/nandomoreirame/forja', 'github.com')).toBe(true);
    expect(isAllowedUrl('javascript:alert(1)', 'github.com')).toBe(false);
    expect(isAllowedUrl('http://github.com/x', 'github.com')).toBe(false);
    expect(isAllowedUrl('https://github.com.evil.io/x', 'github.com')).toBe(false);
  });
});

describe('leaksToMachine', () => {
  it('flags e-mail, absolute path, key-like text and private IP', () => {
    for (const text of ['fale em x@y.com', 'roda em /Users/u/x', 'api_key= abc', 'ip 192.168.0.2']) {
      expect(leaksToMachine(text), text).toBe(true);
    }
    expect(leaksToMachine('CLI de normalização de dados')).toBe(false);
  });
});
