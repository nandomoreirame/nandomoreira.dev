/**
 * Portuguese words left in what should be English (REQ-008 of the foundation,
 * REQ-009 of i18n-content). Reads only visible text: tags, attributes, script,
 * style, code and pre are dropped first. A word list rather than language
 * detection, so a failure always names the word.
 */
/** Markers named by i18n-content REQ-009 (occurrence budget for translated bodies). */
const CONTENT_MARKERS = [
  'não',
  'você',
  'também',
  'então',
  'porque',
  'isso',
  'está',
  'são',
  'já',
  'mas',
  'quando',
  'para',
  'com',
] as const;

/** Broader list for English page chrome (distinct types via ptLeftovers). */
const MARKERS = [
  ...CONTENT_MARKERS,
  'todos',
  'ver',
  'sobre',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'um',
  'uma',
  'seu',
  'sua',
  'leitura',
  'contato',
  'projetos',
  'agora',
  'arquivo',
  'rascunho',
  'próximo',
  'anterior',
  'página',
  'parte',
  'metodologia',
  'vamos',
  'etapas',
  'copiar',
  'copiado',
  'foto',
  'ilustração',
  'retrato',
  'resuma',
  'artigo',
  'leia',
];

/** Proper names that legitimately carry those words. */
const ALLOWED = [
  // Client project name in the sales gallery; proper names are never translated.
  /Canto das Emoções/gi,
  /São Paulo/g,
  /Fernando Moreira Costa/g,
  /Embu das Artes/g,
  /Ateliê [EeÉé]h Pique/gi,
  /Encantos Brincantes/gi,
  /Seu Ateliê Aqui/gi,
  // Product slug keeps "seu"; the English title is "Your Atelier Here".
  /seu-atelie-aqui/gi,
  /Irmão do Jorel/gi,
  /sextafeirachegou\.com\.br/gi,
  // School name in the English about/resume education line.
  /Colégio Estadual do Paraná/g,
  // Setup product names keep Portuguese particles by design (shape parity).
  /Mesa ErgoDesk com regulagem de altura/g,
  /Zsh com Oh My Zsh/g,
  /Gemini no fluxo de implementação/g,
  // Hostnames are not Portuguese; the splitter turns "site.com" into the marker "com".
  /\b[\w-]+\.(?:com|com\.br|dev|io|app|org|net)\b/gi,
];

export const visibleText = (html: string): string => {
  let text = html
    .replace(/<(script|style|code|pre)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ');
  for (const name of ALLOWED) text = text.replace(name, ' ');
  return text;
};

const wordsMatching = (html: string, markers: readonly string[]): string[] =>
  visibleText(html)
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(word => markers.includes(word));

/** Distinct Portuguese marker types left in visible text (page chrome gates). */
export const ptLeftovers = (html: string): string[] => [...new Set(wordsMatching(html, MARKERS))];

/**
 * Occurrence count of the i18n-content REQ-009 markers (not the broader chrome
 * list: that one includes English words like "do").
 */
export const ptMarkerCount = (html: string): number => wordsMatching(html, CONTENT_MARKERS).length;

/** Attributes a person or an agent reads even though they are not visible text. */
const READ_ATTRIBUTES = /\s(alt|title|aria-label|placeholder|data-label-[\w-]+)="([^"]*)"/g;

const decode = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/**
 * Portuguese left where visible text never shows it: alt, aria-label, title,
 * placeholder, data-label-* and the query of every link (a prompt handed to an
 * agent travels in ?q=). Tags marked lang="pt-BR" are Portuguese on purpose
 * (the language switch is labelled in its destination language).
 */
/** Markers that are also English words, too common in English prompts and alt text to mean anything there. */
const ENGLISH_HOMOGRAPHS = new Set(['do']);

export const ptHiddenLeftovers = (html: string): string[] => {
  const found = new Set<string>();
  for (const tag of html.match(/<[a-z][^>]*>/gi) ?? []) {
    if (/\slang="pt-BR"/.test(tag)) continue;
    for (const [, , value] of tag.matchAll(READ_ATTRIBUTES))
      for (const word of ptLeftovers(`<p>${decode(value)}</p>`)) found.add(word);
    for (const [, href] of tag.matchAll(/\shref="([^"]*\?[^"]*)"/g)) {
      let query: URLSearchParams;
      try {
        query = new URL(decode(href), 'https://nandomoreira.dev').searchParams;
      } catch {
        continue;
      }
      for (const value of query.values()) for (const word of ptLeftovers(`<p>${value}</p>`)) found.add(word);
    }
  }
  return [...found].filter(word => !ENGLISH_HOMOGRAPHS.has(word));
};
