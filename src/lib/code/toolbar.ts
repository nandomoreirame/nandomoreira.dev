import { icons } from '@iconify-json/lucide';
import type { Element, ElementContent, Properties } from 'hast';
import type { ShikiTransformer } from 'shiki';

/**
 * Icon actions on every code block, added at build time by Shiki. Raw is a
 * checkbox read by CSS (no script); Copy reuses the [data-copy] handler of the
 * site's single script, which swaps the tooltip text for the confirmation.
 */
export const CODE_TOOLBAR_LABELS = {
  raw: 'Raw',
  copy: 'Copiar',
  copied: 'Copiado',
} as const;

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

const tooltip = (label: string): Element =>
  element('span', { className: ['code-tooltip'] }, [{ type: 'text', value: label }]);

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

    const raw = element('label', { className: ['code-action'] }, [
      element('input', { type: 'checkbox', className: ['code-raw-toggle', 'sr-only'] }),
      icon('file-text', 'code-icon'),
      tooltip(CODE_TOOLBAR_LABELS.raw),
    ]);

    const copy = element(
      'button',
      {
        type: 'button',
        className: ['code-action', 'group/copy'],
        dataCopy: id,
        dataLabelCopied: CODE_TOOLBAR_LABELS.copied,
        ariaLive: 'polite',
        hidden: true,
      },
      [
        icon('copy', 'code-icon group-data-copied/copy:hidden'),
        icon('check', 'code-icon hidden text-success group-data-copied/copy:block'),
        tooltip(CODE_TOOLBAR_LABELS.copy),
      ],
    );

    root.children = [
      element('div', { className: ['code-block'], dataCodeBlock: '' }, [
        element('div', { className: ['code-toolbar'] }, [raw, copy]),
        pre,
      ]),
    ];
  },
});
