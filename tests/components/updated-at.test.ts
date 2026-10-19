import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import UpdatedAt from '../../src/components/ui/UpdatedAt.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(UpdatedAt, { props: { date: '2026-10-16' } });
};

describe('UpdatedAt', () => {
  it('states the date in words, with a machine-readable time', async () => {
    const html = await render();
    expect(html).toMatch(/Atualizada em <time datetime="2026-10-16">16 de outubro de 2026<\/time>\./);
  });

  it('is a mono strip with a clock icon and an amber rule on the left', async () => {
    const html = await render();
    const root = html.match(/^\s*<p[^>]*class="([^"]*)"/)?.[1] ?? '';

    expect(root).toEqual(expect.stringContaining('font-mono'));
    expect(root).toEqual(expect.stringContaining('border-l-2'));
    expect(root).toEqual(expect.stringContaining('border-primary'));
    expect(html).toMatch(
      /data-icon="lucide:clock"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-icon="lucide:clock"/,
    );
  });

  it.each(['src/pages/setup.astro', 'src/pages/now.astro', 'src/pages/privacidade.astro'])(
    '%s uses it through PageHeader',
    file => {
      const source = readFileSync(file, 'utf8');
      expect(source).toMatch(/<PageHeader[^>]*updatedAt=\{/);
      expect(source).not.toContain('Atualizada em <time');
      expect(readFileSync('src/components/ui/PageHeader.astro', 'utf8')).toContain('<UpdatedAt');
    },
  );
});
