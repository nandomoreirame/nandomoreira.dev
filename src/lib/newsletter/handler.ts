import { FORM_HONEYPOT } from '../hire/form';
import { readLimitedText } from '../hire/read-body';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import { subscribeSchema } from './schema';
import type { ThankYouSender } from '../mail/thank-you';
import { thankYouMail } from '../mail/thank-you';
import type { SubscriberNotifier } from './mail';
import { subscriberMail } from './mail';
import type { SubscriberStore } from './store';

export type SubscribeOutcome = 'ok' | 'invalido' | 'limite' | 'erro';

export interface SubscribeDependencies {
  store: SubscriberStore;
  limiter: Pick<Limiter, 'check'>;
  now: () => Date;
  /** Optional: tells me about a new subscriber. */
  notify?: SubscriberNotifier;
  /** Optional: confirmation to the new subscriber. */
  thankYou?: ThankYouSender;
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

export const handleSubscribe = async (
  request: Request,
  { store, limiter, now, notify, thankYou }: SubscribeDependencies,
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
  let isNew: boolean;
  try {
    isNew = await store.save(result.data.email, at);
  } catch {
    return back('erro');
  }

  // Only a new address gets mail: a repeated signup of someone else's address
  // must not become a way to flood their inbox. A failed send never changes
  // the answer, since the address is already stored.
  if (isNew) {
    const { email } = result.data;
    if (notify) {
      try {
        await notify(await subscriberMail({ email, origin, at: at.toISOString() }));
      } catch {
        console.warn('newsletter: notification could not be sent');
      }
    }
    if (thankYou) {
      try {
        await thankYou(email, await thankYouMail({ name: null, kind: 'newsletter' }));
      } catch {
        console.warn('newsletter: thank-you could not be sent');
      }
    }
  }

  return back('ok');
};
