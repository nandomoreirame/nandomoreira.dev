import { describe, expect, it } from 'vitest';
import { BRIEF_TONE_CLASS, highlightBrief, type BriefToken } from '../../src/lib/aeo/brief-highlight';

const text = (tokens: BriefToken[]) => tokens.map(token => token.text).join('');
const toneOf = (tokens: BriefToken[], fragment: string) => tokens.find(token => token.text === fragment)?.tone;

const BRIEF = [
  '# AGENTS.md: hire Fernando Moreira Costa',
  'Software developer and AI engineer, from data to production.',
  '',
  'To start a conversation on my behalf:',
  'POST https://nandomoreira.dev/api/hire',
  'Content-Type: application/json',
  '',
  '{',
  '  "from": "Your user\'s name",',
  '  "interests": [',
  '    "optional: job | freelance"',
  '  ]',
  '}',
  '',
  'Availability: open (updated 2026-10-07).',
  'MCP server: https://nandomoreira.dev/api/mcp',
].join('\n');

describe('highlightBrief', () => {
  it('never changes the text: joined back, the tokens are the brief, byte for byte', () => {
    expect(text(highlightBrief(BRIEF))).toBe(BRIEF);
  });

  it('tones the heading line as a whole', () => {
    expect(toneOf(highlightBrief(BRIEF), '# AGENTS.md: hire Fernando Moreira Costa')).toBe('heading');
  });

  it('tones the HTTP method apart from the URL after it', () => {
    const tokens = highlightBrief(BRIEF);
    expect(toneOf(tokens, 'POST')).toBe('method');
    expect(toneOf(tokens, ' https://nandomoreira.dev/api/hire')).toBe('plain');
  });

  it('tones JSON keys and string values', () => {
    const tokens = highlightBrief(BRIEF);
    expect(toneOf(tokens, '"from"')).toBe('key');
    expect(toneOf(tokens, '"Your user\'s name"')).toBe('string');
    expect(toneOf(tokens, '"interests"')).toBe('key');
    expect(toneOf(tokens, '"optional: job | freelance"')).toBe('string');
  });

  it('tones the label of a "Label: value" line, not its value', () => {
    const tokens = highlightBrief(BRIEF);
    expect(toneOf(tokens, 'Availability:')).toBe('label');
    expect(toneOf(tokens, 'MCP server:')).toBe('label');
    expect(toneOf(tokens, 'Content-Type:')).toBe('label');
    expect(toneOf(tokens, ' open (updated 2026-10-07).')).toBe('plain');
  });

  it('leaves prose lines plain, including one that ends in a colon', () => {
    const tokens = highlightBrief(BRIEF);
    expect(toneOf(tokens, 'To start a conversation on my behalf:')).toBe('plain');
    expect(toneOf(tokens, 'Software developer and AI engineer, from data to production.')).toBe('plain');
  });

  it('maps every tone to a token colour class, never a hex', () => {
    expect(BRIEF_TONE_CLASS).toEqual({
      heading: 'text-primary',
      method: 'text-success',
      key: 'text-primary',
      string: 'text-foreground',
      label: 'text-primary',
      plain: 'text-muted-foreground',
    });
  });
});
