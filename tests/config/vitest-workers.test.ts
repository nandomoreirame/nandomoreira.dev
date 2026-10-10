import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Left unset, Vitest opens a worker for almost every core and pins the CPU at
// 100% while the suite runs. Half the cores keeps the desktop usable.
describe.each(['vitest.config.ts', 'vitest.build.config.ts'])('%s', (file) => {
  it('caps the workers at half the cores', () => {
    const config = readFileSync(file, 'utf8');
    expect(config).toMatch(/maxWorkers:\s*'50%'/);
    expect(config).toMatch(/minWorkers:\s*1/);
  });
});
