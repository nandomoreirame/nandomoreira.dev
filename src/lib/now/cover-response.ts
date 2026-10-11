import { upstreamFromCover } from './cover';

const MAX_COVER_BYTES = 524_288;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const notFound = (): Response =>
  new Response(null, {
    status: 404,
    headers: { 'cache-control': 'public, max-age=300' },
  });

const mediaType = (value: string | null): string => (value ?? '').split(';', 1)[0]!.trim().toLowerCase();

/** Reads the body and rejects it once it passes the cap. The header alone is not enough. */
const readAtMost = async (response: Response, max: number): Promise<Uint8Array | undefined> => {
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return bytes.byteLength > max ? undefined : bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      return undefined;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
};

export const serveCover = async ({
  source,
  id,
  fetch: fetchImpl,
}: {
  source: string;
  id: string;
  fetch: typeof fetch;
}): Promise<Response> => {
  const upstream = upstreamFromCover(source, id);
  if (!upstream) return notFound();

  try {
    const origin = await fetchImpl(upstream, {
      redirect: 'error',
      signal: AbortSignal.timeout(2500),
    });
    if (origin.status !== 200) return notFound();

    const type = origin.headers.get('content-type');
    if (!ALLOWED_TYPES.includes(mediaType(type))) return notFound();

    const declared = Number(origin.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_COVER_BYTES) return notFound();

    const body = await readAtMost(origin, MAX_COVER_BYTES);
    if (!body) return notFound();

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': type ?? 'application/octet-stream',
        'cache-control': 'public, max-age=86400, s-maxage=604800, immutable',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return notFound();
  }
};
