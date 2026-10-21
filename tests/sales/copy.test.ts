import { describe, expect, it } from 'vitest';
import { SALES_SERVICES, serviceAnchor } from '../../src/lib/sales/catalog';
import { SALES_COPY } from '../../src/lib/sales/copy';
import { PAYMENT_ANSWER } from '../../src/lib/sales/payment';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

describe('invented-number gate', () => {
  it('can fail: it catches every figure the Stitch made up', () => {
    for (const sample of [
      '99.98% no ar',
      'R$ 14.890 hoje',
      '< 1.5s',
      'Retorno em até 24 horas úteis',
      '99.99% Uptime',
    ]) {
      expect(inventedNumbersIn(sample), sample).not.toEqual([]);
    }
  });

  it('lets the real payment terms through, but no other percentage', () => {
    expect(inventedNumbersIn(PAYMENT_ANSWER)).toEqual([]);
    expect(inventedNumbersIn(`${PAYMENT_ANSWER} Clientes vendem 40% mais.`)).toEqual(['percentage']);
    expect(inventedNumbersIn('40% de entrada')).toEqual(['percentage']);
  });

  it('lets the approved figures of speech through', () => {
    expect(inventedNumbersIn('Seu cartão de visita que trabalha 24 horas. 15 anos de código.')).toEqual([]);
  });

  it('skips only the budget field the visitor picks from, never other text', () => {
    const field = '<select name="orcamento"><option>Até R$ 10 mil</option></select>';
    expect(inventedNumbersIn(visibleText(`<form>${field}</form>`))).toEqual([]);
    expect(inventedNumbersIn(visibleText(`<p>R$ 10 mil</p>${field}`))).toEqual(['brl amount']);
    expect(inventedNumbersIn(visibleText('<select name="servico"><option>R$ 5</option></select>'))).toEqual([
      'brl amount',
    ]);
  });

  it('finds nothing in the sales copy or the catalog', () => {
    expect(inventedNumbersIn(JSON.stringify({ SALES_COPY, SALES_SERVICES }))).toEqual([]);
  });
});

describe('SALES_COPY', () => {
  it('has three quote calls, each with its own title and no dashes', () => {
    expect(SALES_COPY.ctas).toHaveLength(3);
    expect(new Set(SALES_COPY.ctas.map(cta => cta.title)).size).toBe(3);
    for (const cta of SALES_COPY.ctas) expect(`${cta.title} ${cta.text}`).not.toMatch(/[\u2013\u2014]/);
  });

  it('maps each of the 6 situations to an existing service', () => {
    const slugs = SALES_SERVICES.map(service => service.slug);
    expect(SALES_COPY.situations).toHaveLength(6);
    for (const situation of SALES_COPY.situations) expect(slugs).toContain(situation.service);
  });

  it('has the 7 steps in order, with 03 and 04 labelled', () => {
    expect(SALES_COPY.steps.map(step => step.title)).toEqual([
      'Entrevista',
      'Pesquisa',
      'Design',
      'Aprovação',
      'Desenvolvimento',
      'Testes',
      'Entrega',
    ]);
    expect(SALES_COPY.steps.filter(step => step.highlight).map(step => step.title)).toEqual(['Design', 'Aprovação']);
  });

  it('explains the nine tools by analogy, Firebase first', () => {
    expect(SALES_COPY.tools.map(tool => tool.name)).toEqual([
      'Firebase Hosting',
      'Firebase App Hosting',
      'Firestore',
      'Authentication',
      'Cloud Functions',
      'Cloud Storage',
      'Gemini',
      'Mercado Pago ou Stripe',
      'Resend',
    ]);
    expect(SALES_COPY.toolsHeader.lead).not.toMatch(/cada peça dela/);
  });

  it('turns the tools into six plain-language benefits', () => {
    expect(SALES_COPY.toolBenefits.map(benefit => benefit.title)).toEqual([
      'Rápido em qualquer lugar',
      'Seguro desde o primeiro dia',
      'Custo que acompanha o negócio',
      'Pagamento com Pix, cartão e boleto',
      'Avisos e tarefas no automático',
      'Inteligência artificial quando fizer sentido',
    ]);
    const jargon = /Firebase|Firestore|Cloud|Authentication|Gemini|Resend|Stripe/;
    for (const benefit of SALES_COPY.toolBenefits) expect(`${benefit.title} ${benefit.text}`).not.toMatch(jargon);
    expect(`${SALES_COPY.toolsHeader.title} ${SALES_COPY.toolsHeader.lead}`).not.toMatch(jargon);
  });

  it('shows only the four approved projects', () => {
    expect(SALES_COPY.projects.map(project => project.slug)).toEqual([
      'encantos-brincantes',
      'portfoliosnap',
      'bragstack',
      'mousai',
    ]);
  });

  it('states the delivery range in the hero and in the FAQ', () => {
    expect(SALES_COPY.hero.title).toContain('no ar em 5 a 30 dias úteis');
    const answer = SALES_COPY.faq.find(item => item.question === 'Quanto tempo leva?')!.answer;
    expect(answer).toContain('de 5 a 30 dias úteis de trabalho');
    expect(answer).toContain('proposta');
  });

  it('states the real payment terms, and only in the payment answer', () => {
    const answer = SALES_COPY.faq.find(item => item.question === 'Como funciona o pagamento?')!.answer;
    expect(answer).toBe(PAYMENT_ANSWER);
    expect(answer).toMatch(/40% de entrada/);
    expect(answer).toMatch(/60% na entrega/);
    expect(answer).toMatch(/até 12x/);
    expect(answer).toMatch(/valor total é cobrado no início/);
    expect(answer).toMatch(/5% de desconto/);
  });

  it('answers the nine landing questions without promising a fixed price or a guarantee', () => {
    expect(SALES_COPY.faq).toHaveLength(9);
    const questions = SALES_COPY.faq.map(item => item.question);
    expect(questions.indexOf('Como funciona o pagamento?')).toBe(questions.indexOf('Quanto custa?') + 1);
    expect(questions).toContain('Quanto custa manter o site no ar?');
    expect(questions).toContain('E se eu não gostar do design?');
    expect(JSON.stringify(SALES_COPY.faq)).not.toMatch(/valor fechado|preço fixo|não paga|devolv/i);
  });

  it('opens with the delivery range, then who builds it and the design approval', () => {
    expect(SALES_COPY.hero.title).toBe(
      'Seu site ou sua loja no ar em 5 a 30 dias úteis, sem precisar entender de tecnologia.',
    );
    expect(SALES_COPY.hero.lead).toMatch(/direto comigo/);
    expect(SALES_COPY.hero.lead).toMatch(/aprova o design antes/);
    expect(SALES_COPY.hero.lead).not.toMatch(/dias úteis/);
    expect(SALES_COPY.hero.proofs.join(' ')).not.toMatch(/dias úteis|direto comigo/);
    expect(SALES_COPY.hero.proofs.join(' ')).not.toMatch(/produção|jargão/);
  });

  it('names the one action the same way on the hero and on the form', () => {
    expect(SALES_COPY.hero.primary).toBe('Quero meu orçamento');
    expect(SALES_COPY.contact.submit).toBe('Quero meu orçamento');
  });

  it('says "no jargon" only where it answers the objection, not everywhere', () => {
    const elsewhere = JSON.stringify([SALES_COPY.hero, SALES_COPY.situationsHeader, SALES_COPY.contact]);
    expect(elsewhere).not.toMatch(/jargão|termos técnicos/i);
  });

  it('drops the agency adjectives and the unclear phrases', () => {
    const text = JSON.stringify(SALES_COPY);
    expect(text).not.toMatch(
      /Soluções sob medida|Transparência total|simples e previsível|telefone sem fio|empresas de tecnologia|contar a sua história/,
    );
    expect(SALES_COPY.stepsHeader.lead).toMatch(/^Sete etapas/);
  });

  it('builds the anchor the situation cards link to', () => {
    expect(serviceAnchor(SALES_COPY.situations[0]!.service)).toBe('servico-site-institucional');
  });
});
