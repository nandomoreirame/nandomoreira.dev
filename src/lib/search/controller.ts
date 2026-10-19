import type { SearchItem, SearchKind } from './build-index';
import { GO_TARGETS, PALETTE_COPY } from './copy';
import { scoreOf } from './match';

export interface PaletteOption {
  id: string;
  label: string;
  /** Destination; absent for an in-page action. */
  href?: string;
  action?: 'copy-link';
  /** Keys shown with <kbd>, e.g. ['G', 'B']. */
  keys?: string[];
}

export interface PaletteGroup {
  label: string;
  options: PaletteOption[];
  empty?: boolean;
}

/** The current page's other views, when it has them (docs/specs/ai-view). */
export interface PageViews {
  mdPath?: string;
  aiPath?: string;
  /** Set on the AI view instead of aiPath: the way back to the page. */
  humanPath?: string;
}

const general = ({ mdPath, aiPath, humanPath }: PageViews): PaletteOption[] => [
  { id: 'opt-copy-link', label: PALETTE_COPY.actions.copyLink, action: 'copy-link' },
  { id: 'opt-email', label: PALETTE_COPY.actions.email, href: '/contato' },
  ...(mdPath ? [{ id: 'opt-markdown', label: PALETTE_COPY.actions.markdown, href: mdPath }] : []),
  ...(aiPath ? [{ id: 'opt-ai', label: PALETTE_COPY.actions.ai, href: aiPath }] : []),
  ...(humanPath ? [{ id: 'opt-human', label: PALETTE_COPY.actions.human, href: humanPath }] : []),
];

const GO: PaletteOption[] = GO_TARGETS.map((target) => ({
  id: `opt-go-${target.key}`,
  label: target.label,
  href: target.path,
  keys: ['G', target.key.toUpperCase()],
}));

const ORDER: SearchKind[] = ['post', 'case', 'page', 'service', 'archive'];

const filter = (options: PaletteOption[], query: string) => options.filter((option) => scoreOf({ title: option.label }, query) > 0);

/** What the listbox shows for a query (REQ-007, REQ-008, REQ-009). */
export const viewFor = (index: readonly SearchItem[] | undefined, query: string, views: PageViews = {}): PaletteGroup[] => {
  const GENERAL = general(views);
  if (query.trim() === '') {
    return [
      { label: PALETTE_COPY.groups.general, options: GENERAL },
      { label: PALETTE_COPY.groups.go, options: GO },
    ];
  }
  const groups: PaletteGroup[] = [
    { label: PALETTE_COPY.groups.general, options: filter(GENERAL, query) },
    { label: PALETTE_COPY.groups.go, options: filter(GO, query) },
    ...ORDER.map((kind) => ({
      label: PALETTE_COPY.groups[kind],
      options: (index ?? [])
        .filter((item) => item.kind === kind)
        .map((item) => ({ item, score: scoreOf(item, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }, at) => ({ id: `opt-${kind}-${at}`, label: item.title, href: item.path })),
    })),
  ].filter((group) => group.options.length > 0);
  if (groups.length > 0) return groups;
  return [{ label: PALETTE_COPY.empty, empty: true, options: [{ id: 'opt-contact', label: PALETTE_COPY.actions.contact, href: '/contato' }] }];
};

/** Next active index with wrap-around; -1 when the list is empty. */
export const move = (active: number, delta: number, count: number): number =>
  count === 0 ? -1 : (active + delta + count) % count;
