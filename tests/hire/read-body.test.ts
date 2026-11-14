import { describe, expect, it } from 'vitest';
import { BodyTooLargeError, MAX_BODY_BYTES, readLimitedText } from '../../src/lib/hire/read-body';

const oversized = () =>
  new Request('https://nandomoreira.dev/api/mcp', { method: 'POST', body: 'a'.repeat(MAX_BODY_BYTES * 4) });

describe('readLimitedText', () => {
  it('rejects an oversized body', async () => {
    await expect(readLimitedText(oversized())).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it('rejects an oversized clone without waiting for the original to be read', async () => {
    // A tee branch's cancel settles only once both branches are cancelled, so
    // awaiting it here hung every MCP request over 16 KB until the platform
    // timed it out.
    const request = oversized();

    await expect(readLimitedText(request.clone(), 1_000)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(await request.text()).toHaveLength(MAX_BODY_BYTES * 4);
  });
});
