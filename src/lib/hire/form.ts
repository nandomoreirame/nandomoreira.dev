/**
 * The human form on /contato posts here without JavaScript, as
 * application/x-www-form-urlencoded with pt-BR field names. This maps it onto
 * the same payload an agent sends, so one schema validates both.
 */
const FIELD_MAP: Record<string, string> = {
  nome: 'from',
  email: 'contact',
  mensagem: 'brief',
  empresa: 'company',
  orcamento: 'budget',
};

const OPTIONAL = new Set(['company', 'budget']);

export const formToPayload = (params: URLSearchParams): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of params) {
    if (key === 'interesse') continue;
    const target = FIELD_MAP[key] ?? key;
    if (OPTIONAL.has(target) && value.trim() === '') continue;
    payload[target] = value;
  }

  const interests = params.getAll('interesse').filter((value) => value.trim() !== '');
  if (interests.length > 0) payload.interests = interests;

  return payload;
};

/** Where the form lands after a submission; the page reads `envio`. */
export type FormOutcome = 'ok' | 'invalido' | 'limite' | 'erro';

export const formRedirect = (outcome: FormOutcome): Response =>
  new Response(null, {
    status: 303,
    headers: { location: `/contato?envio=${outcome}#envio`, 'cache-control': 'no-store' },
  });
