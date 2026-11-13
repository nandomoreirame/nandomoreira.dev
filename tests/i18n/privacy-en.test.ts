import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PrivacyPage from '../../src/components/pages/PrivacyPage.astro';
import { POLICY_LEAD, POLICY_UPDATED_AT, privacySections } from '../../src/lib/privacy/policy';
import { POLICY_LEAD_EN, privacySectionsEn, policyFor } from '../../src/lib/privacy/policy-en';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(PrivacyPage, {
    props: { locale },
    request: new Request(
      locale === 'en' ? 'https://nandomoreira.dev/en/privacy' : 'https://nandomoreira.dev/privacidade',
    ),
  });

describe('English privacy policy', () => {
  it('has the same sections and ids in the same order', () => {
    expect(privacySectionsEn.map(section => section.id)).toEqual(privacySections.map(section => section.id));
    expect(privacySectionsEn).toHaveLength(privacySections.length);
  });

  it('shares the update date and is actually translated', () => {
    expect(policyFor('pt-BR').sections).toBe(privacySections);
    expect(policyFor('en').sections).toBe(privacySectionsEn);
    expect(policyFor('en').lead).toBe(POLICY_LEAD_EN);
    expect(policyFor('pt-BR').lead).toBe(POLICY_LEAD);
    expect(POLICY_LEAD_EN).not.toBe(POLICY_LEAD);
    expect(POLICY_UPDATED_AT).toBe('2026-11-04');
    for (let i = 0; i < privacySections.length; i++) {
      expect(privacySectionsEn[i]!.title).not.toBe(privacySections[i]!.title);
      expect(privacySectionsEn[i]!.paragraphs.join('\n')).not.toBe(privacySections[i]!.paragraphs.join('\n'));
    }
  });

  it('has no dash in its prose', () => {
    expect(JSON.stringify(privacySectionsEn) + POLICY_LEAD_EN).not.toMatch(/[\u2013\u2014]/);
  });
});

describe('PrivacyPage', () => {
  it('keeps the pt-BR privacy page byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/privacy.pt.html');
  });

  it('renders the English privacy page', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    // Chrome still ships AvailabilityPill and the language suggestion in the
    // other language; this task owns the privacy body inside <main>.
    // UpdatedAt date copy is still pt-BR until a later pass.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const withoutChrome = main.replace(/<div\b[^>]*\bdata-page-updated\b[^>]*>[\s\S]*?<\/div>/i, '');
    // Domain examples keep a .com TLD that is not Portuguese.
    const cleaned = withoutChrome.replace(/linkedin\.com/gi, ' ');
    expect(ptLeftovers(cleaned)).toEqual([]);
  });
});
