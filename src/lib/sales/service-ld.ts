interface Input {
  name: string;
  description: string;
  url: string;
}

/** schema.org Service for a sales page; serialised by serialiseJsonLd, never by hand. */
export const serviceLd = ({ name, description, url }: Input) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  description,
  url,
  serviceType: name,
  areaServed: { '@type': 'Country', name: 'Brasil' },
  provider: { '@type': 'Person', name: 'Fernando Moreira', url: 'https://nandomoreira.dev' },
});
