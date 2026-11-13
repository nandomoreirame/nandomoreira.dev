import type { Locale } from '../i18n/locale';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[\d\s()+-]+$/;

/** True when the contact is an e-mail address (used for replyTo and thank-you). */
export const isEmailContact = (value: string): boolean => EMAIL.test(value.trim());

/**
 * A lead with no way to answer is a lost lead (sales-landing, REQ-023): the
 * sales form takes an e-mail or a Brazilian phone, 10 to 13 digits once the
 * punctuation people type is ignored (with or without the 55 country code).
 */
export const isReachableContact = (value: string): boolean => {
  const trimmed = value.trim();
  if (isEmailContact(trimmed)) return true;
  if (!PHONE_CHARS.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 13;
};

/** Only copy changes; the destination remains the profile-owned address. */
export const whatsappDestination = (destination: string, locale: Locale): string => {
  if (locale !== 'en') return destination;
  const url = new URL(destination);
  if (url.protocol !== 'https:' || url.hostname !== 'wa.me') return destination;
  url.searchParams.set('text', 'Hi, Fernando! I came from your services page.');
  return url.toString();
};

export const salesWhatsappPath = (locale: Locale = 'pt-BR'): string =>
  `/go/contato/whatsapp${locale === 'en' ? '?locale=en' : ''}`;
