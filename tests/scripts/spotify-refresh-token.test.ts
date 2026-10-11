import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  assertCallbackState,
  authorizeUrl,
  exchangeCode,
} from '../../scripts/spotify-refresh-token.mjs';

const redirectUri = 'http://127.0.0.1:8888/callback';

describe('spotify refresh token script', () => {
  it('builds an authorize URL with the scope, the encoded callback and the state', () => {
    const url = authorizeUrl({ clientId: 'client', redirectUri, state: 'state-1' });

    expect(url).toContain('scope=user-read-recently-played');
    expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
    expect(url).toContain('state=state-1');
  });

  it('exchanges the code with grant_type=authorization_code and Basic auth', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'access', refresh_token: 'refresh' }),
    });

    const token = await exchangeCode({
      fetch,
      clientId: 'client',
      clientSecret: 'secret',
      code: 'code-1',
      redirectUri,
    });

    expect(token).toBe('refresh');
    const [, init] = fetch.mock.calls[0] as [string, { body: string; headers: { authorization: string } }];
    expect(init.body).toContain('grant_type=authorization_code');
    expect(init.headers.authorization).toBe(
      `Basic ${Buffer.from('client:secret').toString('base64')}`,
    );
  });

  it('rejects a callback whose state does not match', () => {
    expect(() => assertCallbackState('expected', 'other')).toThrow(/state/);
    expect(() => assertCallbackState('expected', 'expected')).not.toThrow();
  });

  it('documents the local command and the callback to register', () => {
    const doc = readFileSync('CLAUDE.md', 'utf8');
    expect(doc).toContain('node scripts/spotify-refresh-token.mjs');
    expect(doc).toContain(redirectUri);
  });
});
