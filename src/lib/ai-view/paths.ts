/** Strip a trailing slash; keep a lone `/` as home. */
const normalise = (path: string): string => {
  if (path === '/' || path === '') return '/';
  return path.replace(/\/+$/, '') || '/';
};

export const aiPathFor = (humanPath: string): string => {
  const path = normalise(humanPath);
  return path === '/' ? '/ia' : `${path}/ia`;
};

export const mdPathFor = (humanPath: string): string => {
  const path = normalise(humanPath);
  return path === '/' ? '/index.md' : `${path}.md`;
};

export const humanPathFor = (aiPath: string): string => {
  const path = normalise(aiPath);
  if (path === '/ia') return '/';
  if (path.endsWith('/ia')) return path.slice(0, -3) || '/';
  return path;
};
