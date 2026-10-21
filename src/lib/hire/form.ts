import { HONEYPOT_FIELD } from './schema';

/**
 * The human form on /contato posts here without JavaScript, as
 * application/x-www-form-urlencoded with pt-BR field names. This maps it onto
 * the same payload an agent sends, so one schema validates both.
 */
/**
 * The honeypot's name on the human form. Deliberately meaningless: a name that
 * autofill recognises (website, url, email...) gets filled by password
 * managers, and the visitor's real message is then dropped as spam while the
 * page says it was sent (seen in production on 2026-10-09). The API keeps
 * `website`, since agents do not autofill.
 */
export const FORM_HONEYPOT = 'hp_ref';

const FIELD_MAP: Record<string, string> = {
  [FORM_HONEYPOT]: HONEYPOT_FIELD,
  nome: 'from',
  email: 'contact',
  // The sales form asks for "e-mail ou WhatsApp" in one field.
  contato: 'contact',
  mensagem: 'brief',
  empresa: 'company',
  orcamento: 'budget',
  servico: 'service',
};

const OPTIONAL = new Set(['company', 'budget', 'service']);

export const formToPayload = (params: URLSearchParams): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of params) {
    if (key === 'interesse') continue;
    const target = FIELD_MAP[key] ?? key;
    if (OPTIONAL.has(target) && value.trim() === '') continue;
    payload[target] = value;
  }

  // Deduplicated: on a phone the chips give way to a <select multiple> with the
  // same name, and a visitor who resizes mid-form can send a value from both.
  const interests = [...new Set(params.getAll('interesse').filter(value => value.trim() !== ''))];
  if (interests.length > 0) payload.interests = interests;

  return payload;
};

/** Where the form lands after a submission; the page reads `envio`. */
export type FormOutcome = 'ok' | 'invalido' | 'limite' | 'erro';

/**
 * Where the form lands after a submission; the page reads `envio`. `base` is
 * a sales page chosen from a closed list (src/lib/sales/form.ts), never a
 * value taken from the request.
 */
export const formRedirect = (outcome: FormOutcome, base = '/contato'): Response =>
  new Response(null, {
    status: 303,
    headers: { location: `${base}?envio=${outcome}#envio`, 'cache-control': 'no-store' },
  });
