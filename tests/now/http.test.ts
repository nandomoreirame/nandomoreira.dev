import { describe, expect, it, vi } from 'vitest';
import { SourceError, fetchJson, logSourceError } from '../../src/lib/now/http';

const okResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response;

describe('fetchJson', () => {
  it('returns the JSON body when the response is ok', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ items: [1] }));
    await expect(fetchJson(fetchImpl, 'https://api.example/x', { method: 'GET' }, 1000)).resolves.toEqual({
      items: [1],
    });
  });

  it('throws SourceError with the status and without the response body', async () => {
    const secretBody = 'Bearer abc123 refresh_token=xyz';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: secretBody }),
      text: async () => secretBody,
    });

    const error = await fetchJson(fetchImpl, 'https://api.example/x').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(SourceError);
    expect(error).toMatchObject({ reason: 'status', status: 401 });
    expect((error as Error).message).not.toContain(secretBody);
    expect((error as Error).message).not.toContain('Bearer');
    expect((error as Error).message).not.toContain('refresh_token');
  });

  it('throws SourceError with reason timeout when the signal aborts', async () => {
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) {
          reject(new Error('missing signal'));
          return;
        }
        if (signal.aborted) {
          reject(signal.reason);
          return;
        }
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    });

    const error = await fetchJson(fetchImpl as typeof fetch, 'https://api.example/x', {}, 10).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(SourceError);
    expect(error).toMatchObject({ reason: 'timeout' });
  });
});

describe('logSourceError', () => {
  it('logs one line with the status and nothing else', () => {
    const logger = { warn: vi.fn() };
    logSourceError('spotify', new SourceError('status', 401), logger);
    expect(logger.warn).toHaveBeenCalledWith('now: spotify unavailable (status 401)');
  });

  it('drops tokens that arrived inside an unexpected error message', () => {
    const logger = { warn: vi.fn() };
    logSourceError('spotify', new Error('upstream Bearer abc123 refresh_token=xyz'), logger);
    const logged = logger.warn.mock.calls.flat().join(' ');
    expect(logged).not.toContain('Bearer abc123');
    expect(logged).not.toContain('refresh_token=xyz');
    expect(logged).toBe('now: spotify unavailable (unexpected error)');
  });
});
