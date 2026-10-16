import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ReaderMode from '../../src/components/posts/ReaderMode.astro';
import { contrastRatio } from '../../src/lib/contrast';
import { READER_SETTINGS, READER_SWITCH_ID, readerInputId } from '../../src/lib/posts/reader';

const css = readFileSync('src/styles/global.css', 'utf8');
const page = readFileSync('src/pages/[slug].astro', 'utf8');
const script = readFileSync('src/components/art/PointerField.astro', 'utf8');

const render = async () => (await AstroContainer.create()).renderToString(ReaderMode);

/** The declarations of the first rule whose selector is exactly `selector`. */
const rule = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
};

const on = `:root:has(#${READER_SWITCH_ID}:checked)`;

describe('reader settings', () => {
  it('offers background, text size, line height and width', () => {
    expect(READER_SETTINGS.map((setting) => setting.name)).toEqual(['theme', 'size', 'leading', 'width']);
  });

  it('starts every setting on one of its own choices', () => {
    for (const setting of READER_SETTINGS) {
      expect(setting.choices.map((choice) => choice.value)).toContain(setting.initial);
    }
  });

  it('starts on the site as it is: dark background, the prose size and measure', () => {
    const initial = Object.fromEntries(READER_SETTINGS.map((setting) => [setting.name, setting.initial]));
    expect(initial).toEqual({ theme: 'dark', size: '18', leading: '17', width: '640' });
  });

  it('steps size, line height and width by number, with no word labels', () => {
    const steppers = READER_SETTINGS.filter((setting) => setting.kind === 'stepper');
    expect(steppers.map((setting) => setting.name)).toEqual(['size', 'leading', 'width']);
    for (const setting of steppers) {
      const values = setting.choices.map((choice) => Number(choice.value));
      expect(values, setting.name).toEqual([...values].sort((a, b) => a - b));
      expect(setting.choices.length, setting.name).toBeGreaterThanOrEqual(5);
    }
  });

  it('labels size and width in px', () => {
    for (const name of ['size', 'width']) {
      for (const choice of READER_SETTINGS.find((setting) => setting.name === name)!.choices) {
        expect(choice.label).toBe(`${choice.value}px`);
      }
    }
  });
});

describe('ReaderMode', () => {
  it('is a switch, so a screen reader hears whether reading mode is on', async () => {
    const html = await render();
    expect(html).toMatch(new RegExp(`<input[^>]*type="checkbox"[^>]*role="switch"[^>]*id="${READER_SWITCH_ID}"`));
    expect(html).toContain('Modo leitura');
  });

  it('groups each setting under a legend, one radio per choice, the initial one checked', async () => {
    const html = await render();
    for (const setting of READER_SETTINGS) {
      expect(html).toContain(`<legend`);
      expect(html).toContain(setting.legend);
      for (const choice of setting.choices) {
        const id = readerInputId(setting.name, choice.value);
        const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] ?? '';
        expect(input, id).toContain('type="radio"');
        expect(input, id).toContain(`name="reader-${setting.name}"`);
        expect(input.includes('checked'), id).toBe(choice.value === setting.initial);
      }
    }
  });

  it('gives each stepper value a minus and a plus pointing at its neighbours', async () => {
    const html = await render();
    for (const setting of READER_SETTINGS.filter((setting) => setting.kind === 'stepper')) {
      setting.choices.forEach((choice, index) => {
        const id = readerInputId(setting.name, choice.value);
        const step = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>\\s*<div[^>]*data-step[^>]*>([\\s\\S]*?)</div>`))?.[1] ?? '';
        expect(step, id).not.toBe('');
        const prev = setting.choices[index - 1];
        const next = setting.choices[index + 1];
        if (prev) expect(step, id).toContain(`for="${readerInputId(setting.name, prev.value)}"`);
        if (next) expect(step, id).toContain(`for="${readerInputId(setting.name, next.value)}"`);
        expect(step, id).toContain('−');
        expect(step, id).toContain('+');
      });
    }
  });

  it('shows the line height in px of the chosen text size', () => {
    expect(css).toMatch(/counter-reset:\s*reader-leading calc\(var\(--reader-px, 18\) \* var\(--text-prose--line-height\)\)/);
    expect(css).toContain('content: counter(reader-leading) "px"');
  });

  it('keeps the settings in a native disclosure, with a spoken name', async () => {
    const html = await render();
    expect(html).toMatch(/<details[\s\S]*<summary[\s\S]*Ajustes de leitura/);
  });
});

describe('reading mode styles', () => {
  it('hides the site around the article, the main image included', () => {
    expect(css).toContain(`${on} :is([data-site-header], [data-reader-hide])`);
    expect(rule(`${on} :is([data-site-header], [data-reader-hide])`)).toMatch(/display:\s*none/);
    // The dot grid and its glow are page texture, not text.
    expect(rule(`${on} [data-pointer-field]::before,\n${on} [data-pointer-field]::after`)).toMatch(/display:\s*none/);
  });

  it('marks the post chrome and the cover or art for hiding', () => {
    expect(page).toContain('<ReaderMode');
    // Breadcrumb, cover, art banner and related posts.
    expect(page.match(/data-reader-hide/g)?.length).toBe(4);
    expect(readFileSync('src/components/layout/SiteFooter.astro', 'utf8')).toContain('data-reader-hide');
    expect(readFileSync('src/components/ai-view/AiSwitcher.astro', 'utf8')).toContain('data-reader-hide');
  });

  it('has a rule for every choice that is not the initial one', () => {
    for (const setting of READER_SETTINGS) {
      for (const choice of setting.choices.filter((choice) => choice.value !== setting.initial)) {
        expect(css, choice.value).toContain(`${on}:has(#${readerInputId(setting.name, choice.value)}:checked)`);
      }
    }
  });

  it('applies the choices only while reading mode is on', () => {
    // A choice left checked must not restyle the page after leaving the mode.
    for (const match of css.matchAll(/:has\(#reader-(theme|size|leading|width)-[a-z]+:checked\)/g)) {
      const line = css.slice(css.lastIndexOf('\n', match.index) + 1, css.indexOf('{', match.index));
      expect(line, match[0]).toContain(`#${READER_SWITCH_ID}:checked`);
    }
  });

  it('stops the entrance animation around the controls, so fixed means the viewport', () => {
    // enter-rise animates transform, which makes the animated ancestor the
    // containing block of the pinned controls (measured: pinned to the header).
    expect(rule(`${on} :has([data-reader])`)).toMatch(/animation:\s*none/);
  });

  it('is unlayered, so hiding wins over the display utilities', () => {
    // Rules inside @layer or @media are indented in this file; top-level ones are not.
    expect(css).toContain(`\n${on} :is([data-site-header], [data-reader-hide]) {`);
  });
});

describe('reading mode palettes', () => {
  const themes = READER_SETTINGS.find((setting) => setting.name === 'theme')!.choices.filter(
    (choice) => choice.value !== 'dark',
  );

  const palette = (value: string) => {
    const body = rule(`${on}:has(#${readerInputId('theme', value)}:checked)`);
    const color = (name: string) => {
      const hex = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(body)?.[1];
      expect(hex, `${value} --color-${name}`).toBeTruthy();
      return hex!;
    };
    return color;
  };

  it.each(themes.map((choice) => choice.value))('%s keeps every text colour above WCAG AA', (value) => {
    const color = palette(value);
    for (const ground of ['background', 'surface']) {
      for (const ink of ['foreground', 'muted-foreground', 'primary']) {
        expect(contrastRatio(color(ink), color(ground)), `${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each(themes.map((choice) => choice.value))('%s keeps the control outline perceivable', (value) => {
    const color = palette(value);
    expect(contrastRatio(color('border-strong'), color('background'))).toBeGreaterThanOrEqual(3);
  });
});

describe('reading mode script', () => {
  it('remembers the choices, tolerating storage that throws', () => {
    expect(script).toContain('[data-reader]');
    expect(script).toMatch(/localStorage\.getItem\(input\.name\)/);
    expect(script).toMatch(/localStorage\.setItem\(input\.name, input\.value\)/);
    expect(script.match(/try \{[\s\S]*?localStorage/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('leaves the mode with Escape and gives focus back to the switch', () => {
    expect(script).toContain("event.key === 'Escape'");
    expect(script).toMatch(/reader\.checked = false;\s*reader\.focus\(\)/);
  });
});
