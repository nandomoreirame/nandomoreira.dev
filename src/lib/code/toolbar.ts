import { icons } from '@iconify-json/lucide';
import type { Element, ElementContent, Properties } from 'hast';
import type { ShikiTransformer } from 'shiki';

/**
 * Text actions on a bar above every code block, added at build time by Shiki.
 * Raw is a checkbox read by CSS (no script); Copy reuses the [data-copy]
 * handler of the site's single script, which swaps the first span for the
 * confirmation.
 */
export const CODE_TOOLBAR_LABELS = {
  raw: 'Raw',
  copy: 'Copiar',
  copied: 'Copiado',
  /** Header label of a block with neither a title nor a language. */
  plain: 'texto',
} as const;

const PLAIN_LANGS = new Set(['text', 'plaintext', 'txt', 'plain']);

/** `title="..."` from the fence meta (```bash title="bin/x.sh"), if any. */
export const fenceTitle = (meta: string | undefined): string | undefined =>
  meta?.match(/title="([^"]+)"/)?.[1];

const headerLabel = (meta: string | undefined, lang: string | undefined): string =>
  fenceTitle(meta) ?? (lang && !PLAIN_LANGS.has(lang) ? lang : CODE_TOOLBAR_LABELS.plain);

const element = (tagName: string, properties: Properties, children: ElementContent[] = []): Element => ({
  type: 'element',
  tagName,
  properties,
  children,
});

const camel = (name: string): string => name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

/**
 * Parses a Lucide icon body (well-formed SVG markup: elements and attributes,
 * nothing else) into hast. Small on purpose, so the build does not lean on a
 * transitive HTML parser.
 */
export const svgBody = (markup: string): ElementContent[] => {
  const root: ElementContent[] = [];
  const stack: Element[] = [];
  const tag = /<(\/?)([a-z]+)([^>]*?)(\/?)>/g;

  for (const [, closing, name, rawAttributes, selfClosing] of markup.matchAll(tag)) {
    if (closing) {
      stack.pop();
      continue;
    }
    const properties: Properties = {};
    for (const [, key, value] of rawAttributes.matchAll(/([a-z-]+)="([^"]*)"/g)) {
      properties[camel(key)] = value;
    }
    const node = element(name, properties);
    (stack.at(-1)?.children ?? root).push(node);
    if (!selfClosing) stack.push(node);
  }

  return root;
};

export const icon = (name: string, className: string): Element => {
  const data = icons.icons[name];
  if (!data) throw new Error(`Unknown Lucide icon "${name}"`);
  return element(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${icons.width ?? 24} ${icons.height ?? 24}`,
      className: [className],
      ariaHidden: 'true',
      focusable: 'false',
    },
    svgBody(data.body),
  );
};

let sequence = 0;

export const codeToolbar = (): ShikiTransformer => ({
  name: 'code-toolbar',
  root(root) {
    const pre = root.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'pre',
    );
    if (!pre) return;

    sequence += 1;
    const id = `code-${sequence}`;
    pre.properties.id = id;

    const label = headerLabel(this.options.meta?.__raw, this.options.lang);

    const raw = element('label', { className: ['code-action'] }, [
      element('input', { type: 'checkbox', className: ['code-raw-toggle', 'sr-only'] }),
      { type: 'text', value: CODE_TOOLBAR_LABELS.raw },
    ]);

    // The site script swaps the text of the first <span> for "Copiado".
    const copy = element(
      'button',
      {
        type: 'button',
        className: ['code-action'],
        dataCopy: id,
        dataLabelCopied: CODE_TOOLBAR_LABELS.copied,
        ariaLive: 'polite',
        hidden: true,
      },
      [element('span', {}, [{ type: 'text', value: CODE_TOOLBAR_LABELS.copy }])],
    );

    root.children = [
      element('div', { className: ['code-block'], dataCodeBlock: '' }, [
        element('div', { className: ['code-header'] }, [
          element('span', { className: ['code-dot'], ariaHidden: 'true' }),
          element('span', { className: ['code-title'] }, [{ type: 'text', value: label }]),
          element('div', { className: ['code-actions'] }, [raw, copy]),
        ]),
        pre,
      ]),
    ];
  },
});
