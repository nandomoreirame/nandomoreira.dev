const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[\d\s()+-]+$/;

/**
 * A lead with no way to answer is a lost lead (sales-landing, REQ-023): the
 * sales form takes an e-mail or a Brazilian phone, 10 to 13 digits once the
 * punctuation people type is ignored (with or without the 55 country code).
 */
export const isReachableContact = (value: string): boolean => {
  const trimmed = value.trim();
  if (EMAIL.test(trimmed)) return true;
  if (!PHONE_CHARS.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 13;
};
