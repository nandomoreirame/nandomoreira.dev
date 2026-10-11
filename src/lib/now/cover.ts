const SPOTIFY_IMAGE = /^\/image\/([0-9a-f]{40})$/;
const XBOX_IMAGE = /^\/image\/(apps\.\d+\.\d+\.[0-9a-f-]{36}\.[0-9a-f-]{36})$/;
const HEX_40 = /^[0-9a-f]{40}$/;
const XBOX_ID = /^apps\.\d+\.\d+\.[0-9a-f-]{36}\.[0-9a-f-]{36}$/;

/** Local cover route for a known Spotify or Xbox image, or undefined. */
export const coverPathFromUpstream = (url: string): string | undefined => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  if (parsed.protocol === 'https:' && parsed.hostname === 'i.scdn.co') {
    const id = parsed.pathname.match(SPOTIFY_IMAGE)?.[1];
    return id ? `/api/now/cover/spotify/${id}` : undefined;
  }

  if (
    (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
    parsed.hostname === 'store-images.s-microsoft.com'
  ) {
    const id = parsed.pathname.match(XBOX_IMAGE)?.[1];
    return id ? `/api/now/cover/xbox/${id}` : undefined;
  }

  return undefined;
};

/** Rebuilds the upstream image URL from a validated source and id. */
export const upstreamFromCover = (source: string, id: string): string | undefined => {
  if (source === 'spotify' && HEX_40.test(id)) return `https://i.scdn.co/image/${id}`;
  if (source === 'xbox' && XBOX_ID.test(id)) {
    return `https://store-images.s-microsoft.com/image/${id}?w=320&h=320&q=80&format=jpg`;
  }
  return undefined;
};
