import { FORM_HONEYPOT } from '../hire/form';
import { readLimitedText } from '../hire/read-body';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import { subscribeSchema } from './schema';
import type { ThankYouSender } from '../mail/thank-you';
import { thankYouMail } from '../mail/thank-you';
import type { SubscriberNotifier } from './mail';
import { subscriberMail } from './mail';
import { type SubscriberStore, type SubscriptionSave, statusOf } from './store';

export type SubscribeOutcome = 'ok' | 'invalido' | 'limite' | 'erro';

/** Sends the one-time confirmation link. The notice and the thank-you wait for the click. */
export type ConfirmationSender = (email: string, token: string) => Promise<void>;

export interface SubscribeDependencies {
  store: SubscriberStore;
  limiter: Pick<Limiter, 'check'>;
  now: () => Date;
  /** Optional: tells me about a subscriber who just confirmed. */
  notify?: SubscriberNotifier;
  /** Optional: thank-you to a subscriber who just confirmed. */
  thankYou?: ThankYouSender;
  /** Optional: confirmation link for an address that is not on the list yet. */
  sendConfirmation?: ConfirmationSender;
}

/**
 * Pages that carry the card and read `assinatura`. The form names its page in
 * ?origem on the action, so the answer comes back even before the body is read
 * (the rate limit); anything off this list falls back to /posts, so the field
 * is never an open redirect.
 */
const ORIGINS = new Set(['/', '/posts', '/setup']);

const originOf = (request: Request): string => {
  const origem = new URL(request.url).searchParams.get('origem') ?? '';
  return ORIGINS.has(origem) ? origem : '/posts';
};

const backTo =
  (origin: string) =>
  (outcome: SubscribeOutcome): Response =>
    new Response(null, {
      status: 303,
      headers: { location: `${origin}?assinatura=${outcome}#novidades`, 'cache-control': 'no-store' },
    });

const isForm = (request: Request): boolean =>
  (request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded');

const RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;

/** A pending address may get another confirmation link after a day. Confirmed passes null and never does. */
export const mayResendConfirmation = (lastSentAt: Date | null, now: Date): boolean =>
  lastSentAt !== null && now.getTime() - lastSentAt.getTime() >= RESEND_WINDOW_MS;

/** One notice and one thank-you per address, even if the link is opened twice in this process. */
const welcomed = new Set<string>();

export const confirmedBy = async ({
  email,
  notify,
  thankYou,
}: {
  email: string;
  notify: SubscriberNotifier;
  thankYou: ThankYouSender;
}) => {
  if (welcomed.has(email)) return;
  welcomed.add(email);
  await notify(await subscriberMail({ email, origin: '/posts', at: new Date().toISOString() }));
  await thankYou(email, await thankYouMail({ name: null, kind: 'newsletter' }));
};

export const handleSubscribe = async (
  request: Request,
  { store, limiter, now, sendConfirmation }: SubscribeDependencies,
): Promise<Response> => {
  const origin = originOf(request);
  const back = backTo(origin);
  if (request.method !== 'POST' || !isForm(request)) return back('erro');
  if (!limiter.check(clientIpOf(request.headers))) return back('limite');

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(await readLimitedText(request));
  } catch {
    return back('erro');
  }

  // A filled trap is answered as a success, so the bot never learns which field it is.
  if ((params.get(FORM_HONEYPOT) ?? '').trim() !== '') return back('ok');

  const result = subscribeSchema.safeParse({ email: params.get('email') ?? '' });
  if (!result.success) return back('invalido');

  const at = now();
  let saved: SubscriptionSave;
  try {
    saved = await store.save(result.data.email, at);
  } catch {
    return back('erro');
  }

  // A new address only gets the confirmation link. The notice and the thank-you
  // wait until the link is opened, so a bot cannot mail a stranger or the author.
  // A failed send never changes the answer, since the address is already stored.
  if (saved.isNew && saved.token && sendConfirmation) {
    try {
      await sendConfirmation(result.data.email, saved.token);
    } catch {
      console.warn('newsletter: confirmation could not be sent');
    }
  } else if (!saved.isNew && sendConfirmation && store.lookup && store.reissue) {
    try {
      const existing = await store.lookup(result.data.email);
      const pending = existing !== null && statusOf(existing) === 'pending';
      const sentAt = pending && typeof existing?.confirmSentAt === 'string' ? new Date(existing.confirmSentAt) : null;
      if (pending && (sentAt === null || mayResendConfirmation(sentAt, at))) {
        const token = await store.reissue(result.data.email, at);
        await sendConfirmation(result.data.email, token);
      }
    } catch {
      console.warn('newsletter: confirmation could not be sent');
    }
  }

  return back('ok');
};
