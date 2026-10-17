import { describe, expect, it } from 'vitest';
import { terminalPath } from '../../src/lib/layout/terminal-path';

describe('terminalPath', () => {
  it('prefixes the path with ~ in lower case', () => {
    expect(terminalPath('/contato')).toBe('~/contato');
    expect(terminalPath('/Portfolio')).toBe('~/portfolio');
  });

  it('drops a trailing slash and keeps nested segments', () => {
    expect(terminalPath('/posts/arquivo/2018/')).toBe('~/posts/arquivo/2018');
  });

  it('reads the root as ~/', () => {
    expect(terminalPath('/')).toBe('~/');
    expect(terminalPath('')).toBe('~/');
  });
});
