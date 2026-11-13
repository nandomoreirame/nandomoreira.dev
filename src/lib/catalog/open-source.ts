/**
 * Public repositories shown at the end of /lab: a short, curated list of what
 * is open on GitHub but has no case of its own. Static on purpose: fetching
 * GitHub at build time would tie every deploy to its rate limit. No star
 * counts (RISK-004): most of them come from 2018 Jekyll themes.
 */
export interface OpenSourceRepo {
  name: string;
  url: string;
  description: string;
  descriptionEn: string;
  language: string;
  /** Year the repository was created. */
  year: string;
}

export const GITHUB_REPOSITORIES_URL = 'https://github.com/nandomoreirame?tab=repositories';

const repo = (
  name: string,
  description: string,
  descriptionEn: string,
  language: string,
  year: string,
): OpenSourceRepo => ({
  name,
  url: `https://github.com/nandomoreirame/${name}`,
  description,
  descriptionEn,
  language,
  year,
});

export const OPEN_SOURCE_REPOS: readonly OpenSourceRepo[] = [
  repo(
    'sextafeirachegou.com.br',
    'Site que responde se já é sexta, com contagem regressiva e drama',
    'Site that says whether it is Friday yet, with a countdown and drama',
    'TypeScript',
    '2026',
  ),
  repo(
    'motivaai',
    'Gerador de frases motivacionais, refeito em Remix',
    'Motivational quote generator, rebuilt in Remix',
    'TypeScript',
    '2019',
  ),
  repo(
    'vovo-juju-ipsum',
    'Gerador de falas da vovó Juju, da animação Irmão do Jorel',
    'Quote generator for Grandma Juju, from the cartoon Irmão do Jorel',
    'Vue',
    '2019',
  ),
  repo(
    'app-whatsapp-url',
    'Gera o link de conversa do WhatsApp para qualquer número',
    'Builds the WhatsApp chat link for any phone number',
    'Vue',
    '2018',
  ),
  repo(
    'nandomoreira.me-nuxt-theme',
    'Uma versão antiga do meu site pessoal, em Vue com Nuxt',
    'An older version of my personal site, in Vue with Nuxt',
    'Vue',
    '2016',
  ),
  repo('end2end', 'Tema Jekyll limpo para blogs', 'Clean Jekyll theme for blogs', 'Sass', '2015'),
  repo('dotX', 'Tema Jekyll simples para blogs', 'Simple Jekyll theme for blogs', 'CSS', '2015'),
  repo('lora', 'Tema Jekyll gratuito para blogs', 'Free Jekyll theme for blogs', 'CSS', '2015'),
];
