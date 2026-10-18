import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MORE_WORK, TESTIMONIALS } from '../../src/lib/sales/proof';
import { inventedNumbersIn } from '../helpers/invented-numbers';

describe('TESTIMONIALS', () => {
  it('keeps the two real testimonials word for word', () => {
    expect(TESTIMONIALS.map((item) => `${item.name} (${item.company})`)).toEqual([
      'Yara Santiago (Ateliê éh Pique)',
      'Edson Luiz (Contador)',
    ]);
    expect(TESTIMONIALS[1]!.text).toBe(
      'Trabalho com o Fernando há pelo menos 15 anos. Nesse tempo, ele já desenvolveu vários projetos pra mim e para minhas empresas, e sempre entregou tudo com uma qualidade acima da expectativa.',
    );
  });
});

describe('MORE_WORK', () => {
  it('lists only client work, each with a real image', () => {
    expect(MORE_WORK.length).toBe(10);
    for (const work of MORE_WORK) {
      expect(existsSync(`public/servicos/trabalhos/${work.slug}.webp`), work.slug).toBe(true);
      expect(work.alt.length, work.slug).toBeGreaterThan(10);
    }
  });

  it('links only what is still online', () => {
    expect(MORE_WORK.filter((work) => work.url).map((work) => work.slug)).toEqual(['coletivo-inclusao']);
  });

  it('never shows a template, a theme or a personal project as client work', () => {
    const slugs = MORE_WORK.map((work) => work.slug).join(' ');
    expect(slugs).not.toMatch(/nutritionist|grgit|theme|tema|sob-medida|beholddy|blog-nandomoreira/);
  });

  it('carries no year and no invented figure', () => {
    // "Agenda Rio 2030" is the product name (UN SDG brand), not a project date.
    const withoutBrandYears = JSON.stringify(MORE_WORK).replace(
      /Agenda Rio 2030|agenda-rio-2030/g,
      '',
    );
    expect(withoutBrandYears).not.toMatch(/\b20\d\d\b/);
    expect(inventedNumbersIn(JSON.stringify({ MORE_WORK, TESTIMONIALS }))).toEqual([]);
  });
});
