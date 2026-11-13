import type { APIRoute } from 'astro';
import type { Locale } from '../../lib/i18n/locale';
import { liveBarResponse } from '../../lib/live-bar/config';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const locale: Locale = url.searchParams.get('locale') === 'en' ? 'en' : 'pt-BR';

  return liveBarResponse(undefined, locale);
};
