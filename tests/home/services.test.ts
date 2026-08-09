import { describe, expect, it } from 'vitest';
import { assertServicesHaveCases } from '../../src/lib/home/services';

const services = [
  { title: 'Tooling com agentes', description: 'd', caseSlug: 'forja' },
  { title: 'Produtos com IA', description: 'd', caseSlug: 'bragstack' },
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
