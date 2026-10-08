import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clientPattern, confidentialClientNames } from './confidential-clients';

const caseFile = (body: string): string => `---\n${body}\n---\n`;

describe('confidentialClientNames', () => {
  it('returns the client of a confidential case and ignores a public one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cases-'));
    writeFileSync(join(dir, 'a.md'), caseFile('confidential: true\nclientName: Acme Corp'));
    writeFileSync(join(dir, 'b.md'), caseFile('confidential: false\nclientName: Public Co'));
    writeFileSync(join(dir, 'c.md'), caseFile('confidential: true'));

    expect(confidentialClientNames(dir)).toEqual(['Acme Corp']);
  });

  it('builds a pattern that catches the name in any casing, which is what the gates rely on', () => {
    expect('built for ACME CORP last year').toMatch(clientPattern('Acme Corp'));
    expect('acmecorporation').not.toMatch(clientPattern('Acme Corp'));
  });
});
