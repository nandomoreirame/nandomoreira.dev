import type { Element, ElementContent, Properties } from 'hast';
import type { HastPluginDefinition } from 'satteri';
import { icon } from '../code/toolbar';

/**
 * Build-time plugins for the post body (Sätteri, the Astro 7 markdown
 * processor). Both rewrite the HTML once at build, so nothing ships to the
 * browser: the lightbox is the Popover API, like the case pages.
 */

const SITE_HOSTS = new Set(['nandomoreira.dev', 'www.nandomoreira.dev']);

const isExternal = (href: string): boolean => {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return !SITE_HOSTS.has(new URL(href).hostname);
  } catch {
    return false;
  }
};

/** External links open in a new tab and pass no ranking or referrer. */
export const externalLinks = (): HastPluginDefinition => ({
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || !isExternal(href)) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', ['nofollow', 'noopener', 'noreferrer']);
    },
  },
});

const element = (tagName: string, properties: Properties, children: ElementContent[] = []): Element => ({
  type: 'element',
  tagName,
  properties,
  children,
});

/**
 * Wraps every table in a div that scrolls and draws the frame. The table
 * itself stays display: table at full width, so its rows always fill the
 * frame; a table made display: block to scroll shrinks to its content and
 * leaves the rules stopping short of the border.
 */
export const tableFrames = (): HastPluginDefinition => ({
  name: 'table-frames',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      const parent = ctx.parent(node);
      if (parent?.type === 'element' && parent.tagName === 'div') return;
      ctx.replaceNode(node, element('div', { className: ['table-frame'] }, [node]));
    },
  },
});

const FOCUS_RING = ['focus-visible:outline-2', 'focus-visible:outline-offset-2', 'focus-visible:outline-primary'];

// Per document: the counter lives on the compile's data bag, so every post
// starts again at post-image-1 and ids never collide within a page.
const counters = new WeakMap<object, number>();

/**
 * Wraps every body image in a button that opens a full-size copy in a popover,
 * the same markup as the case pages (CaseArticle.astro). Spans, not divs, so
 * the markup stays valid inside the paragraph that holds the image. The images
 * carry no class: Astro re-emits an optimised image's className as a stray
 * attribute, so global.css styles them through their parents instead.
 */
export const lightboxImages = (): HastPluginDefinition => ({
  name: 'lightbox-images',
  element: {
    filter: ['img'],
    visit(node, ctx) {
      const properties = node.properties ?? {};
      // Skip an image that is already a link, and the two copies this plugin
      // just placed (inside the button and inside the popover).
      const parent = ctx.parent(node);
      if (parent?.type === 'element' && ['a', 'button', 'span'].includes(parent.tagName)) return;

      const count = (counters.get(ctx.data) ?? 0) + 1;
      counters.set(ctx.data, count);
      const id = `post-image-${count}`;
      const alt = typeof properties.alt === 'string' ? properties.alt : '';
      const image = { ...properties, loading: 'lazy', decoding: 'async' };

      ctx.replaceNode(
        node,
        element('span', { className: ['post-figure'] }, [
          element(
            'button',
            {
              type: 'button',
              popovertarget: id,
              ariaLabel: alt ? `Ampliar imagem: ${alt}` : 'Ampliar imagem',
              className: ['block', 'w-full', 'cursor-zoom-in', 'rounded-md', ...FOCUS_RING],
            },
            [element('img', image)],
          ),
          element('span', { id, popover: '', role: 'dialog', ariaLabel: alt || 'Imagem', className: ['lightbox'] }, [
            element('img', image),
            element(
              'button',
              {
                type: 'button',
                popovertarget: id,
                popovertargetaction: 'hide',
                ariaLabel: 'Fechar',
                className: [
                  'lightbox-close',
                  'inline-flex',
                  'size-11',
                  'items-center',
                  'justify-center',
                  'rounded-md',
                  'border',
                  'border-border-strong',
                  'bg-background',
                  'text-foreground',
                  'hover:border-primary',
                  ...FOCUS_RING,
                ],
              },
              [icon('x', 'size-5')],
            ),
          ]),
        ]),
      );
    },
  },
});
