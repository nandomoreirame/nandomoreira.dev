import type { Annotation } from './schema';

export type LocatedAnnotation = Annotation & { line: number | null };

export type ReviewDocument = {
  title: string;
  slug: string;
  generatedAt: string;
  annotations: readonly LocatedAnnotation[];
};

const INSTRUCTIONS = [
  'Aplique cada anotação no arquivo do post. A citação é o texto renderizado; no',
  'fonte ela pode ter marcação Markdown. Use o contexto antes/depois para achar o',
  'trecho certo quando ele se repetir. Não mude nada fora dos trechos anotados.',
];

const quoted = (text: string): string =>
  text
    .split('\n')
    .map(line => `> ${line}`.trimEnd())
    .join('\n');

const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

const block = (annotation: LocatedAnnotation, index: number): string =>
  [
    `## ${index + 1}. ${annotation.section ?? 'Abertura'}, ${
      annotation.line === null ? 'linha não localizada' : `linha ${annotation.line}`
    }`,
    '',
    quoted(annotation.quote),
    '',
    `Contexto: «…${oneLine(annotation.prefix)}» [citação] «${oneLine(annotation.suffix)}…»`,
    '',
    `**Pedido:** ${annotation.request.trim() || '(nenhum)'}`,
    '',
    '**Texto novo:**',
    '',
    quoted(annotation.replacement.trim() || '(nenhum)'),
  ].join('\n');

/** The review file Claude reads to edit the post (spec post-review, "Formato da saída"). */
export const renderReview = (review: ReviewDocument): string => {
  const head = [
    `# Revisão: ${review.title}`,
    '',
    `- Post: src/content/posts/${review.slug}.md`,
    `- Gerada em: ${review.generatedAt}`,
    `- Anotações: ${review.annotations.length}`,
    '',
    ...INSTRUCTIONS,
  ].join('\n');
  return `${[head, ...review.annotations.map(block)].join('\n\n')}\n`;
};
