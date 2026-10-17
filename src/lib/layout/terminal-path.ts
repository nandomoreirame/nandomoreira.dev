/** A page path as a terminal prompt path (REQ-007): "/posts/arquivo/" -> "~/posts/arquivo". */
export const terminalPath = (pathname: string): string => {
  const trimmed = pathname.toLowerCase().replace(/\/+$/, '');
  return `~${trimmed === '' ? '/' : trimmed}`;
};
