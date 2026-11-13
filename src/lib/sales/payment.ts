import type { Locale } from '../i18n/locale';

/**
 * Payment terms, given by Fernando on 2026-10-21. They are real, so the
 * invented-number gate lets this exact answer through and nothing else
 * (tests/helpers/invented-numbers.ts).
 */
export const PAYMENT_TERMS = {
  deposit: 40,
  onDelivery: 60,
  maxInstallments: 12,
  pixDiscount: 5,
} as const;

const { deposit, onDelivery, maxInstallments, pixDiscount } = PAYMENT_TERMS;

/** The FAQ answer to "Como funciona o pagamento?". Visible copy, so pt-BR. */
export const PAYMENT_ANSWER =
  `${deposit}% de entrada para começar o projeto e ${onDelivery}% na entrega, por Pix ou cartão de crédito. ` +
  `No cartão, dá para parcelar em até ${maxInstallments}x, e nesse caso o valor total é cobrado no início. ` +
  `Quem paga o valor integral por Pix no início ganha ${pixDiscount}% de desconto.`;

export const paymentAnswer = (locale: Locale = 'pt-BR'): string =>
  locale === 'en'
    ? `${deposit}% upfront to start the project and ${onDelivery}% on delivery, by Pix or credit card. Cards allow up to ${maxInstallments} installments, with the full amount charged at the start. Paying the full amount by Pix at the start earns a ${pixDiscount}% discount.`
    : PAYMENT_ANSWER;
