import { describe, expect, it } from 'vitest';
import { assertServicesHaveCases, serviceCaseHref } from '../../src/lib/home/services';

const services = [
  { title: 'Tooling com agentes', description: 'd', caseSlug: 'forja' },
  { title: 'Produtos com IA', description: 'd', caseSlug: 'bragstack' },
];

const projects = [
  { slug: 'forja', block: 'ai-tooling' as const },
  { slug: 'bragstack', block: 'ai-product' as const },
];

describe('assertServicesHaveCases', () => {
  it('accepts services whose cases all exist', () => {
    expect(() =>
      assertServicesHaveCases(services, ['forja', 'bragstack', 'tumodori']),
    ).not.toThrow();
  });

  it('rejects a service advertised with no case behind it', () => {
    expect(() => assertServicesHaveCases(services, ['forja'])).toThrow(/bragstack/);
  });

  it('names the service, not only the missing slug, so the error is actionable', () => {
    expect(() => assertServicesHaveCases(services, ['forja'])).toThrow(
      /Produtos com IA/,
    );
  });

  it('reports every offender at once, not just the first', () => {
    const error = (() => {
      try {
        assertServicesHaveCases(services, []);
        return null;
      } catch (caught) {
        return caught as Error;
      }
    })();

    expect(error?.message).toContain('forja');
    expect(error?.message).toContain('bragstack');
  });

  it('accepts an empty service list', () => {
    expect(() => assertServicesHaveCases([], [])).not.toThrow();
  });
});

describe('serviceCaseHref', () => {
  it('resolves a lab case to /lab/<slug>', () => {
    expect(serviceCaseHref('forja', projects)).toBe('/lab/forja');
  });

  it('resolves a portfolio case to /portfolio/<slug>', () => {
    expect(serviceCaseHref('bragstack', projects)).toBe('/portfolio/bragstack');
  });

  it('returns undefined when the slug is missing from the projects list', () => {
    expect(serviceCaseHref('missing', projects)).toBeUndefined();
  });

  it('never builds the legacy /projetos path', () => {
    expect(serviceCaseHref('forja', projects)).not.toContain('/projetos/');
  });
});
