import { describe, expect, it } from 'vitest';
import { SALES_SERVICES, serviceAnchor } from '../../src/lib/sales/catalog';
import { SALES_COPY } from '../../src/lib/sales/copy';
import { inventedNumbersIn } from '../helpers/invented-numbers';

describe('invented-number gate', () => {
  it('can fail: it catches every figure the Stitch made up', () => {
    for (const sample of ['99.98% no ar', 'R$ 14.890 hoje', '< 1.5s', 'Retorno em até 24 horas úteis', '99.99% Uptime']) {
      expect(inventedNumbersIn(sample), sample).not.toEqual([]);
    }
  });

  it('lets the approved figures of speech through', () => {
    expect(inventedNumbersIn('Seu cartão de visita que trabalha 24 horas. 15 anos de código.')).toEqual([]);
  });

  it('finds nothing in the sales copy or the catalog', () => {
    expect(inventedNumbersIn(JSON.stringify({ SALES_COPY, SALES_SERVICES }))).toEqual([]);
  });
});

describe('SALES_COPY', () => {
  it('has four quote calls, each with its own title and no dashes', () => {
    expect(SALES_COPY.ctas).toHaveLength(4);
    expect(new Set(SALES_COPY.ctas.map((cta) => cta.title)).size).toBe(4);
    for (const cta of SALES_COPY.ctas) expect(`${cta.title} ${cta.text}`).not.toMatch(/[\u2013\u2014]/);
  });

  it('maps each of the 6 situations to an existing service', () => {
    const slugs = SALES_SERVICES.map((service) => service.slug);
    expect(SALES_COPY.situations).toHaveLength(6);
    for (const situation of SALES_COPY.situations) expect(slugs).toContain(situation.service);
  });

  it('has the 7 steps in order, with 03 and 04 labelled', () => {
    expect(SALES_COPY.steps.map((step) => step.title)).toEqual([
      'Entrevista', 'Pesquisa', 'Design', 'Aprovação', 'Desenvolvimento', 'Testes', 'Entrega',
    ]);
    expect(SALES_COPY.steps.filter((step) => step.highlight).map((step) => step.title)).toEqual(['Design', 'Aprovação']);
  });

  it('explains the nine tools by analogy, Firebase first', () => {
    expect(SALES_COPY.tools.map((tool) => tool.name)).toEqual([
      'Firebase Hosting', 'Firebase App Hosting', 'Firestore', 'Authentication', 'Cloud Functions', 'Cloud Storage', 'Gemini', 'Mercado Pago ou Stripe', 'Resend',
    ]);
    expect(SALES_COPY.toolsHeader.lead).not.toMatch(/cada peça dela/);
  });

  it('shows only the four approved projects', () => {
    expect(SALES_COPY.projects.map((project) => project.slug)).toEqual([
      'encantos-brincantes', 'portfoliosnap', 'bragstack', 'mousai',
    ]);
  });

  it('states the delivery range in the hero and in the FAQ', () => {
    expect(SALES_COPY.hero.proofs).toContain('Entrega em 5 a 30 dias úteis');
    const answer = SALES_COPY.faq.find((item) => item.question === 'Quanto tempo leva?')!.answer;
    expect(answer).toContain('de 5 a 30 dias úteis de trabalho');
    expect(answer).toContain('proposta');
  });

  it('answers the six landing questions without promising a fixed price', () => {
    expect(SALES_COPY.faq).toHaveLength(6);
    expect(JSON.stringify(SALES_COPY.faq)).not.toMatch(/valor fechado|preço fixo/i);
  });

  it('builds the anchor the situation cards link to', () => {
    expect(serviceAnchor(SALES_COPY.situations[0]!.service)).toBe('servico-site-institucional');
  });
});
