const MACHINE_FILES = new Set([
  '/llms.txt',
  '/llms-full.txt',
  '/AGENTS.md',
  '/ai-index.json',
  '/api/resume.json',
  '/api/resume.txt',
]);

/** Routes written for agents (REQ-007): counted apart from reading. */
export const isMachineSurface = (path: string): boolean =>
  MACHINE_FILES.has(path) || path.endsWith('.md') || path === '/ia' || path.endsWith('/ia');

/** A browser warming a page the visitor may never open. */
const isPrefetch = (headers: Headers): boolean =>
  /prefetch/i.test(headers.get('sec-purpose') ?? '') || /prefetch/i.test(headers.get('purpose') ?? '');

export type Measurement = 'pageview' | 'machine' | null;

export const measurementFor = ({
  method,
  path,
  status,
  contentType,
  headers,
}: {
  method: string;
  path: string;
  status: number;
  contentType: string | null;
  headers: Headers;
}): Measurement => {
  if (method !== 'GET' || status < 200 || status >= 300 || isPrefetch(headers)) return null;
  if (isMachineSurface(path)) return 'machine';
  if ((contentType ?? '').startsWith('text/html')) return 'pageview';
  return null;
};
