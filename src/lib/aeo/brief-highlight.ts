/**
 * Server-side highlight for the AGENTS.md brief shown on the home and on
 * /contato (Terminal Noir, 2026-10-17). It only splits the text into toned
 * runs; joined back, the runs are the brief byte for byte, so the Copy button
 * (which reads textContent) still copies exactly what buildHireBrief wrote.
 */
export type BriefTone = 'heading' | 'method' | 'key' | 'string' | 'label' | 'plain';

export interface BriefToken {
  text: string;
  tone: BriefTone;
}

/** Token colours only: keys and labels in the accent, the method in success. */
export const BRIEF_TONE_CLASS: Record<BriefTone, string> = {
  heading: 'text-primary',
  method: 'text-success',
  key: 'text-primary',
  string: 'text-foreground',
  label: 'text-primary',
  plain: 'text-muted-foreground',
};

const STRING = /("(?:[^"\\]|\\.)*")/;
const HEADING = /^# /;
const METHOD = /^(GET|POST|PUT|PATCH|DELETE)(\s.*)$/;
const KEY = new RegExp(`^(\\s*)${STRING.source}(:\\s*)(.*)$`);
const ITEM = new RegExp(`^(\\s*)${STRING.source}(,?)$`);
// "Label: value" with a value after it; a prose line ending in a colon stays plain.
const LABEL = /^([A-Z][A-Za-z -]*:)( .+)$/;

const strings = (text: string): BriefToken[] =>
  text
    .split(STRING)
    .filter(Boolean)
    .map((part) => ({ text: part, tone: STRING.test(part) && part.startsWith('"') ? 'string' : 'plain' }));

const lineTokens = (line: string): BriefToken[] => {
  if (HEADING.test(line)) return [{ text: line, tone: 'heading' }];

  const method = METHOD.exec(line);
  if (method) return [{ text: method[1]!, tone: 'method' }, { text: method[2]!, tone: 'plain' }];

  const key = KEY.exec(line);
  if (key) {
    return [
      { text: key[1]!, tone: 'plain' },
      { text: key[2]!, tone: 'key' },
      { text: key[3]!, tone: 'plain' },
      ...strings(key[4]!),
    ];
  }

  const item = ITEM.exec(line);
  if (item) {
    return [
      { text: item[1]!, tone: 'plain' },
      { text: item[2]!, tone: 'string' },
      { text: item[3]!, tone: 'plain' },
    ];
  }

  const label = LABEL.exec(line);
  if (label) return [{ text: label[1]!, tone: 'label' }, { text: label[2]!, tone: 'plain' }];

  return [{ text: line, tone: 'plain' }];
};

export const highlightBrief = (brief: string): BriefToken[] =>
  brief
    .split('\n')
    .flatMap((line, index) => [
      ...(index > 0 ? [{ text: '\n', tone: 'plain' as const }] : []),
      ...lineTokens(line),
    ])
    .filter((token) => token.text.length > 0);
