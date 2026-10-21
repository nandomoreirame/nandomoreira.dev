import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FaqList from '../../src/components/sales/FaqList.astro';
import SalesContact from '../../src/components/sales/SalesContact.astro';
import { BUDGET_OPTIONS } from '../../src/lib/contact/form-options';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import { SALES_COPY } from '../../src/lib/sales/copy';

const render = async (component: Parameters<AstroContainer['renderToString']>[0], props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(component, { props });

describe('FaqList', () => {
  it('uses native details/summary for every question', async () => {
    const html = await render(FaqList, { items: SALES_COPY.faq, id: 'duvidas' });
    expect(html.match(/<details/g)).toHaveLength(SALES_COPY.faq.length);
    expect(html.match(/<summary/g)).toHaveLength(SALES_COPY.faq.length);
    const details = html.match(/<details[^>]*>/)?.[0] ?? '';
    expect(details).toContain('hover:border-primary');
    expect(details).not.toContain('hover:border-border-strong');
  });
});

describe('SalesContact', () => {
  const props = { origin: 'landing', outcome: null, preselect: undefined };

  it('posts to /api/hire with its origin in the query', async () => {
    expect(await render(SalesContact, props)).toContain('action="/api/hire?origem=landing"');
  });

  it('asks for name, a text contact, the service and an optional message', async () => {
    const html = await render(SalesContact, props);
    expect(html).toMatch(/<input[^>]*name="nome"[^>]*required/);
    expect(html).toMatch(/<input[^>]*name="contato"[^>]*type="text"|<input[^>]*type="text"[^>]*name="contato"/);
    expect(html).toContain('name="servico"');
    expect(html).not.toMatch(/<textarea[^>]*required/);
    expect(html).toContain(`name="${FORM_HONEYPOT}"`);
  });

  it('asks for the same optional budget ranges as /contato, defaulting to not saying', async () => {
    const html = await render(SalesContact, props);
    const select = html.match(/<select[^>]*name="orcamento"[\s\S]*?<\/select>/)?.[0] ?? '';
    expect(select).not.toMatch(/required/);
    expect(select).toMatch(/<option value=""[^>]*>Prefiro não dizer agora<\/option>/);
    for (const option of BUDGET_OPTIONS) expect(select).toContain(`value="${option.value}"`);
  });

  it('labels every control', async () => {
    const html = await render(SalesContact, props);
    const ids = [...html.matchAll(/<(?:input|textarea|select)[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
    for (const id of ids) expect(html, id).toMatch(new RegExp(`<label[^>]*for="${id}"`));
  });

  it('preselects the service of a detail page', async () => {
    expect(await render(SalesContact, { ...props, preselect: 'website' })).toMatch(
      /<option[^>]*value="website"[^>]*selected/,
    );
  });

  it('shows the outcome in a live region and replaces the form on success', async () => {
    const html = await render(SalesContact, { ...props, outcome: 'ok' });
    expect(html).toMatch(/role="status"/);
    expect(html).not.toContain('<form');
  });

  it('keeps the form and alerts on failure', async () => {
    const html = await render(SalesContact, { ...props, outcome: 'invalido' });
    expect(html).toMatch(/role="alert"/);
    expect(html).toContain('<form');
  });

  it('offers WhatsApp through /go', async () => {
    expect(await render(SalesContact, props)).toContain('href="/go/contato/whatsapp"');
  });

  it('promises no reply time', async () => {
    expect(await render(SalesContact, props)).not.toMatch(/horas úteis/);
  });
});
