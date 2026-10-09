import { type FormOutcome, formRedirect, formToPayload } from './form';
import type { Notifier } from './notify';
import { BodyTimeoutError, BodyTooLargeError, readLimitedText } from './read-body';
import { type Limiter, clientIpOf } from './rate-limit';
import { hireSchema, isHoneypotFilled } from './schema';
import { type BriefingStore, toStoredBriefing } from './store';

export interface Dependencies {
  store: BriefingStore;
  notifier: Notifier;
  limiter: Limiter;
  now: () => Date;
  /** Overridable so a test can prove the slow-read cutoff without waiting for it. */
  readTimeoutMs?: number;
}

/**
 * Every response body is built from this table, never from a caught error.
 * A driver message, a stack or a collection name must never reach the caller
 * (REQ-007), and the only way to guarantee that is to never interpolate one.
 */
const RESPONSES = {
  methodNotAllowed: [405, 'Method not allowed. POST a JSON briefing.'],
  tooLarge: [413, 'Request body is too large.'],
  malformed: [400, 'Request body must be valid JSON.'],
  timeout: [408, 'Request body took too long to arrive.'],
  invalid: [400, 'Request body does not match the expected fields.'],
  rateLimited: [429, 'Too many requests. Try again later.'],
  unavailable: [503, 'The briefing could not be stored. Try again later.'],
} as const;

const json = (status: number, payload: Record<string, unknown>): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** The human form gets a redirect back to /contato instead of a JSON body. */
const FORM_OUTCOMES: Record<keyof typeof RESPONSES, FormOutcome> = {
  methodNotAllowed: 'erro',
  tooLarge: 'invalido',
  malformed: 'invalido',
  timeout: 'erro',
  invalid: 'invalido',
  rateLimited: 'limite',
  unavailable: 'erro',
};

const isForm = (request: Request): boolean =>
  (request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded');

/**
 * Shaped like a Firestore document id, because a fixed placeholder would make
 * the honeypot response observably different from a real one and reveal the
 * trap after a single probe (REQ-004).
 */
const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const syntheticId = (): string =>
  Array.from(
    { length: 20 },
    () => ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)],
  ).join('');

export const handleHire = async (
  request: Request,
  { store, notifier, limiter, now, readTimeoutMs }: Dependencies,
): Promise<Response> => {
  const fromForm = isForm(request);

  const fail = (kind: keyof typeof RESPONSES): Response => {
    if (fromForm) return formRedirect(FORM_OUTCOMES[kind]);
    const [status, message] = RESPONSES[kind];

    return json(status, { error: message });
  };

  // 202: received and stored. Delivery of the notification is not the caller's problem.
  const accepted = (id: string): Response =>
    fromForm
      ? formRedirect('ok')
      : json(202, { status: 'accepted', id, message: 'Briefing received.' });

  if (request.method !== 'POST') return fail('methodNotAllowed');

  const sourceIp = clientIpOf(request.headers);

  if (!limiter.check(sourceIp)) return fail('rateLimited');

  let raw: string;
  try {
    raw = await readLimitedText(request, readTimeoutMs);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return fail('tooLarge');
    if (error instanceof BodyTimeoutError) return fail('timeout');

    return fail('malformed');
  }

  let parsed: unknown;
  try {
    parsed = fromForm ? formToPayload(new URLSearchParams(raw)) : JSON.parse(raw);
  } catch {
    return fail('malformed');
  }

  const result = hireSchema.safeParse(parsed);

  // The Zod issue list is deliberately not echoed: it repeats the field names
  // and limits, which is a map of the validation for whoever is probing.
  if (!result.success) return fail('invalid');

  /**
   * A filled honeypot is answered as if accepted. Rejecting it would tell the
   * attacker which field is the trap, and the next attempt would omit it
   * (REQ-004). Nothing is stored and nothing is sent.
   */
  if (isHoneypotFilled(result.data)) {
    return accepted(syntheticId());
  }

  const briefing = toStoredBriefing({
    payload: result.data,
    sourceIp,
    userAgent: request.headers.get('user-agent'),
    now: now(),
  });

  let id: string;
  try {
    id = await store.save(briefing);
  } catch {
    // Without persistence there is nothing to notify about, so the error is
    // honest here, unlike a failed notification below (REQ-002, REQ-007).
    return fail('unavailable');
  }

  try {
    await notifier.send(briefing, id);
    await store.markNotified(id);
  } catch {
    /**
     * The briefing survived and says `notified: false`, so it can be recovered.
     * Punishing the caller for the mail provider's outage would make them
     * retry and duplicate a record that was already stored (REQ-006).
     */
  }

  return accepted(id);
};
