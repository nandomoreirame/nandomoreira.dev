import { createElement as h } from 'react';
import { render, toPlainText } from 'react-email';
import { describe, expect, it } from 'vitest';
import CvNotification from '../../src/emails/cv-notification';
import HireNotification from '../../src/emails/hire-notification';

describe('HireNotification', () => {
  const props = HireNotification.PreviewProps;

  it('renders the briefing in full, so the inbox is enough on its own', async () => {
    const html = await render(h(HireNotification, props));
    expect(html).toContain(props.briefing.from);
    expect(html).toContain(props.briefing.brief.slice(0, 40));
    expect(html).toContain(props.id);
    for (const view of props.journey!.views) expect(html).toContain(view.path);
  });

  it('keeps the IP out of the mail (privacy policy, 30-day network data)', async () => {
    const html = await render(h(HireNotification, props));
    expect(html).not.toContain(props.briefing.sourceIp);
  });

  it('has no reply button: the contact is in the fields (asked on 2026-10-19)', async () => {
    const html = await render(h(HireNotification, props));
    expect(html).not.toContain('data-primary-action');
    expect(html).not.toContain('Responder');
  });

  it('says "não informado" for empty fields and renders without a journey', async () => {
    const html = await render(
      h(HireNotification, {
        ...props,
        briefing: { ...props.briefing, company: null, budget: null },
        journey: undefined,
      }),
    );
    expect(html).toContain('não informado');
    expect(html).not.toContain('Jornada de hoje');
  });

  it('has a readable plain-text version', async () => {
    const text = toPlainText(await render(h(HireNotification, props)));
    expect(text).toContain(props.briefing.from);
    expect(text).not.toMatch(/[–—]/);
  });
});

describe('language', () => {
  it.each([
    ['HireNotification', HireNotification],
    ['CvNotification', CvNotification],
  ] as const)('%s is written in pt-BR', async (_name, Template) => {
    const html = await render(h(Template as never, Template.PreviewProps as never));
    expect(html).toContain('lang="pt-BR"');
    for (const english of [
      'not given',
      'Reply to',
      'Journey today',
      'Received',
      'record ',
      'wants to talk',
      'downloaded your CV',
    ]) {
      expect(html).not.toContain(english);
    }
  });
});

describe('CvNotification', () => {
  const props = CvNotification.PreviewProps;

  it('names who downloaded, with company and e-mail', async () => {
    const html = await render(h(CvNotification, props));
    for (const value of [props.download.name!, props.download.company!, props.download.email!, props.id]) {
      expect(html).toContain(value);
    }
  });

  it('has no reply button and says "não informado" for a missing e-mail', async () => {
    const html = await render(h(CvNotification, props));
    expect(html).not.toContain('data-primary-action');
    expect(html).not.toContain('Responder');
    const without = await render(h(CvNotification, { ...props, download: { ...props.download, email: null } }));
    expect(without).toContain('não informado');
  });
});

describe('receivedAt', () => {
  it('shows the stamp in São Paulo time, the way a person reads it', async () => {
    const { receivedAt } = await import('../../src/emails/_shared/format');
    expect(receivedAt('2026-10-19T14:32:00.000Z')).toBe('19/10/2026 às 11:32');
  });
});
