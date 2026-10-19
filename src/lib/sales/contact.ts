const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True when the contact is an e-mail address (used for replyTo and thank-you). */
export const isEmailContact = (value: string): boolean => EMAIL.test(value.trim());
