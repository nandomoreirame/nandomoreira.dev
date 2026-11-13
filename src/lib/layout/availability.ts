import type { Profile } from '../../content/schemas/profile';
import type { Locale } from '../i18n/locale';
import { messagesFor } from '../i18n/messages';

type Status = Profile['availability']['status'];

/** Shared by the header pill, the hero pill and the AI view. */
export const availabilityLabel = (status: Status, locale: Locale = 'pt-BR'): string =>
  messagesFor(locale).availability.label[status];

/** One word for the header pill, which has room for little on phones and tablets. */
export const availabilityShort = (status: Status, locale: Locale = 'pt-BR'): string =>
  messagesFor(locale).availability.short[status];

/** Invitation under the status when the card links to contact. */
export const availabilityCta = (locale: Locale = 'pt-BR'): string =>
  messagesFor(locale).availability.cta;

/** pt-BR labels kept as constants for call sites that have not taken a locale yet. */
export const AVAILABILITY_LABEL: Record<Status, string> = {
  open: availabilityLabel('open'),
  limited: availabilityLabel('limited'),
  closed: availabilityLabel('closed'),
};

export const AVAILABILITY_SHORT: Record<Status, string> = {
  open: availabilityShort('open'),
  limited: availabilityShort('limited'),
  closed: availabilityShort('closed'),
};

/** Text colour, so a dot painted with bg-current takes the status tone. */
export const AVAILABILITY_TONE: Record<Status, string> = {
  open: 'text-success',
  limited: 'text-warning',
  closed: 'text-destructive',
};
