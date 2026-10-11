import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPE = 'user-read-recently-played';

export const authorizeUrl = ({ clientId, redirectUri, state }) => {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  return url.toString();
};

export const assertCallbackState = (expected, received) => {
  if (received !== expected) {
    throw new Error('state mismatch');
  }
};

export const exchangeCode = async ({ fetch, clientId, clientSecret, code, redirectUri }) => {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`token exchange failed (${response.status})`);
  }

  const json = await response.json();
  if (typeof json.refresh_token !== 'string' || json.refresh_token.length === 0) {
    throw new Error('token exchange returned no refresh_token');
  }

  return json.refresh_token;
};

const main = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required');
    process.exit(1);
  }

  const state = randomUUID();
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', REDIRECT_URI);
    if (url.pathname !== '/callback') {
      response.writeHead(404);
      response.end();
      return;
    }

    try {
      assertCallbackState(state, url.searchParams.get('state'));
      const code = url.searchParams.get('code');
      if (!code) throw new Error('missing code');
      const refreshToken = await exchangeCode({
        fetch: globalThis.fetch,
        clientId,
        clientSecret,
        code,
        redirectUri: REDIRECT_URI,
      });
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Refresh token printed in the terminal. You can close this tab.');
      console.log(refreshToken);
    } catch (error) {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Authorization rejected.');
      console.error(error instanceof Error ? error.message : 'authorization rejected');
    } finally {
      server.close();
    }
  });

  await new Promise((resolve) => {
    server.listen(8888, '127.0.0.1', () => resolve(undefined));
  });

  console.log(authorizeUrl({ clientId, redirectUri: REDIRECT_URI, state }));
};

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  await main();
}
