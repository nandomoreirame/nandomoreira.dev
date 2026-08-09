import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { serialiseJsonLd } from '../../src/lib/aeo/json-ld';

describe('serialiseJsonLd', () => {
  it('produces parseable JSON', () => {
    expect(() => JSON.parse(serialiseJsonLd({ name: 'Forja' }))).not.toThrow();
  });

  it('escapes < so content can never break out of the script element', () => {
    const output = serialiseJsonLd({ summary: 'quebra </script><img onerror=1> aqui' });

    expect(output).not.toContain('</script>');
    expect(output).not.toContain('<img');
    expect(output).toContain('\\u003c');
  });

  it('round-trips the original text after parsing', () => {
    const parsed = JSON.parse(serialiseJsonLd({ summary: 'a < b' })) as {
      summary: string;
    };

    expect(parsed.summary).toBe('a < b');
  });
});

describe('json-ld serialisation is centralised', () => {
  it('no module re-implements the escape by hand', () => {
    const roots = ['src/lib/home', 'src/lib/catalog'];
    const offenders: string[] = [];

    for (const root of roots) {
      for (const file of readdirSync(root)) {
        const path = join(root, file);
        const source = readFileSync(path, 'utf8');

        if (source.includes("replaceAll('<')")) offenders.push(path);
      }
    }

    expect(offenders).toEqual([]);
  });
});
