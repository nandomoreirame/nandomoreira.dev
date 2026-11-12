import type { LiveBarItem } from './config';

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ITEM =
  'group inline-flex min-h-10 items-center gap-md whitespace-nowrap text-caption text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary';
const BADGE = 'rounded-sm border border-primary/50 px-sm font-mono text-caption tracking-wide text-primary uppercase';
const GROUP = 'live-bar-group flex min-w-screen shrink-0 items-center justify-around gap-xl px-lg';

const item = (entry: LiveBarItem, copy: boolean): string => {
  const badge = entry.badge ? `<span class="${BADGE}">${escape(entry.badge)}</span>` : '';
  const label = entry.href
    ? `<span class="underline-offset-4 group-hover:underline group-focus-visible:underline">${escape(entry.text)}</span><span>→</span>`
    : `<span>${escape(entry.text)}</span>`;
  const inner = `<span aria-hidden="true" class="contents">${badge}${label}</span>`;

  if (!entry.href) return `<span class="${ITEM}">${inner}</span>`;

  const attrs = [
    `href="${escape(entry.href)}"`,
    'target="_blank"',
    'rel="noopener"',
    copy ? 'tabindex="-1"' : `aria-label="${escape(entry.text.replace(/[.!?]$/, ''))}. Abre em nova aba"`,
  ];

  return `<a ${attrs.join(' ')} class="${ITEM}">${inner}</a>`;
};

/** The sliding track: the items twice, the second copy hidden from assistive tech (global.css animates it). */
export const liveBarHtml = (items: readonly LiveBarItem[]): string =>
  [false, true]
    .map(
      copy =>
        `<div class="${GROUP}"${copy ? ' aria-hidden="true"' : ''}>${items.map(entry => item(entry, copy)).join('')}</div>`,
    )
    .join('');
