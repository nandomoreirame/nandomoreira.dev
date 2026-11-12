import type { Locale } from '../locale';
import { en } from './en';
import { ptBR } from './pt-BR';

/** Same shape as the source, with every literal widened to string. */
type Shape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends (...args: infer A) => infer R
      ? (...args: A) => R
      : Shape<T[K]>;
};

export type Messages = Shape<typeof ptBR>;

const BY_LOCALE: Record<Locale, Messages> = { 'pt-BR': ptBR, en };

export const messagesFor = (locale: Locale): Messages => BY_LOCALE[locale];
