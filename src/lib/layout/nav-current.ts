export interface NavLocation {
  /** Path of the page being rendered. */
  current?: string;
  /** Menu item the page belongs to when its path does not say so (posts live at the root). */
  section?: string;
}

/**
 * aria-current for one main-menu item: "page" on the page itself, "true" while
 * the visitor is inside its section (a case under /lab, a post), else nothing.
 */
export const navCurrent = (href: string, { current, section }: NavLocation): 'page' | 'true' | undefined => {
  if (current === href) return 'page';
  if (section === href || current?.startsWith(`${href}/`)) return 'true';
  return undefined;
};
