import { describe, expect, it } from 'vitest';
import { aiPathFor, humanPathFor, mdPathFor } from '../../src/lib/ai-view/paths';

describe('aiPathFor', () => {
  it('maps the home path to /ia', () => {
    expect(aiPathFor('/')).toBe('/ia');
  });

  it('appends /ia to a human path', () => {
    expect(aiPathFor('/sobre')).toBe('/sobre/ia');
    expect(aiPathFor('/lab/forja')).toBe('/lab/forja/ia');
    expect(aiPathFor('/posts/arquivo/2017')).toBe('/posts/arquivo/2017/ia');
  });

  it('tolerates a trailing slash', () => {
    expect(aiPathFor('/sobre/')).toBe('/sobre/ia');
  });
});

describe('mdPathFor', () => {
  it('maps the home path to /index.md', () => {
    expect(mdPathFor('/')).toBe('/index.md');
  });

  it('appends .md to a human path', () => {
    expect(mdPathFor('/sobre')).toBe('/sobre.md');
    expect(mdPathFor('/lab/forja')).toBe('/lab/forja.md');
  });
});

describe('humanPathFor', () => {
  it('strips the /ia suffix', () => {
    expect(humanPathFor('/ia')).toBe('/');
    expect(humanPathFor('/sobre/ia')).toBe('/sobre');
    expect(humanPathFor('/lab/forja/ia')).toBe('/lab/forja');
  });

  it('returns the path unchanged when it is not an AI view', () => {
    expect(humanPathFor('/sobre')).toBe('/sobre');
    expect(humanPathFor('/')).toBe('/');
  });
});
