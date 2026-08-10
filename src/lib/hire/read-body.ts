/** 16 KB: a real briefing is prose, not an upload. */
export const MAX_BODY_BYTES = 16 * 1024;

/**
 * A briefing of at most 16 KB has no reason to take longer than this. The cap
 * matters because the size limit alone does not stop a slow client: dribbling
 * a few bytes per minute stays under 16 KB forever while holding one of the
 * instance's concurrency slots.
 */
export const READ_TIMEOUT_MS = 10_000;

export class BodyTooLargeError extends Error {
  constructor() {
    super('Request body exceeds the limit');
    this.name = 'BodyTooLargeError';
  }
}

export class BodyTimeoutError extends Error {
  constructor() {
    super('Request body took too long to arrive');
    this.name = 'BodyTimeoutError';
  }
}

/**
 * Reads the body in chunks and stops as soon as the limit is passed.
 *
 * `Content-Length` is not consulted: a hostile client omits it or lies in it,
 * and REQ-003 requires the rejection to happen BEFORE the JSON is parsed. The
 * read is the only place that knows how many bytes actually arrived.
 */
export const readLimitedText = async (
  request: Request,
  timeoutMs: number = READ_TIMEOUT_MS,
): Promise<string> => {
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;

  /**
   * One deadline for the whole read, not per chunk: a per-chunk timer resets
   * on every byte, which is exactly the pattern a slow client uses.
   */
  const deadline = new Promise<never>((_resolve, reject) => {
    setTimeout(() => reject(new BodyTimeoutError()), timeoutMs).unref?.();
  });

  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);

      if (done) break;

      total += value.byteLength;

      if (total > MAX_BODY_BYTES) {
        throw new BodyTooLargeError();
      }

      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  chunks.push(decoder.decode());

  return chunks.join('');
};
