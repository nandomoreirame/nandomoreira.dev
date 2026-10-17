import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Setup from '../../src/pages/setup.astro';
import { SETUP_SECTIONS } from '../../src/lib/setup/setup';

describe('/setup sections', () => {
  it('numbers each section in SETUP_SECTIONS order', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Setup);

    SETUP_SECTIONS.forEach((section, index) => {
      const heading = html.match(new RegExp(`<h2[^>]*id="${section.id}"[^>]*>[\\s\\S]*?</h2>`))?.[0] ?? '';
      expect(heading).toContain(`${String(index + 1).padStart(2, '0')} //`);
      expect(heading).toContain(section.title);
    });
  });
});
