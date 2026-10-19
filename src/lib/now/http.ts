export const SOURCE_TIMEOUT_MS = 2500;

export class SourceError extends Error {
  constructor(
    readonly reason: 'timeout' | 'status' | 'network' | 'shape',
    readonly status?: number,
  ) {
    super(status ? `${reason} ${status}` : reason);
  }
}

export const fetchJson = async (
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit = {},
  timeoutMs = SOURCE_TIMEOUT_MS,
): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const name = (error as { name?: string }).name;
    throw new SourceError(name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network');
  }
  if (!response.ok) throw new SourceError('status', response.status);
  return response.json();
};

/** One line per failure, never the token, the key or the body (REQ-013). */
export const logSourceError = (source: string, error: unknown, logger: Pick<Console, 'warn'> = console): void => {
  const detail =
    error instanceof SourceError ? (error.status ? `status ${error.status}` : error.reason) : 'unexpected error';
  logger.warn(`now: ${source} unavailable (${detail})`);
};
