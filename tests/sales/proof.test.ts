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
    expect(MORE_WORK.length).toBe(9);
    expect(MORE_WORK.map((work) => work.slug)).not.toContain('gatman-corp');
    for (const work of MORE_WORK) {
      expect(existsSync(`public/servicos/trabalhos/${work.slug}.webp`), work.slug).toBe(true);
      expect(work.alt.length, work.slug).toBeGreaterThan(10);
    }
  });

  it('ships no image for a work that left the gallery', () => {
    expect(existsSync('public/servicos/trabalhos/gatman-corp.webp')).toBe(false);
    expect(existsSync('public/servicos/trabalhos/gatman-corp-ampliada.webp')).toBe(false);
  });

  it('links nothing: the gallery is a sample, not a list of live sites', () => {
    expect(MORE_WORK.some((work) => 'url' in work)).toBe(false);
  });

  it('has a full-size image for the lightbox of each work', () => {
    for (const work of MORE_WORK) {
      expect(existsSync(`public/servicos/trabalhos/${work.slug}-ampliada.webp`), work.slug).toBe(true);
    }
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
