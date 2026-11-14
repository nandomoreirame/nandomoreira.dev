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
