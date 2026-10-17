import { FORM_HONEYPOT } from '../hire/form';
import { readLimitedText } from '../hire/read-body';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import { subscribeSchema } from './schema';
import type { SubscriberStore } from './store';

export type SubscribeOutcome = 'ok' | 'invalido' | 'limite' | 'erro';

export interface SubscribeDependencies {
  store: SubscriberStore;
  limiter: Pick<Limiter, 'check'>;
  now: () => Date;
}

/** The card lives at the end of /posts; the page reads `assinatura`. */
const back = (outcome: SubscribeOutcome): Response =>
  new Response(null, {
    status: 303,
    headers: { location: `/posts?assinatura=${outcome}#novidades`, 'cache-control': 'no-store' },
  });

const isForm = (request: Request): boolean =>
  (request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded');

export const handleSubscribe = async (
  request: Request,
  { store, limiter, now }: SubscribeDependencies,
): Promise<Response> => {
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

  try {
    await store.save(result.data.email, now());
  } catch {
    return back('erro');
  }
  return back('ok');
};
