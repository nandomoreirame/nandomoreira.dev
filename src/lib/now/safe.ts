/**
 * Text that reaches /now.md and /now/ia from Spotify, GitHub or OpenXBL is not
 * the author's: /now/ia renders markdown as HTML (marked + set:html), so it is
 * escaped here, and anything that looks like a leak never reaches a machine route.
 */
const HTML: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

export const machineText = (text: string): string =>
  text.replace(/[&<>]/g, char => HTML[char]!).replace(/([\\`*_[\]()#|])/g, '\\$1');

export const isAllowedUrl = (url: string, host: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === host;
  } catch {
    return false;
  }
};

// Same intent as tests/helpers/machine-leaks.ts. The test file stays the
// independent gate; this list only decides what to drop before rendering.
const LEAKS = [
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  /\/(home|Users|var|etc)\//,
  /(api[_-]?key|secret|token|bearer)\s*[:=]/i,
  /\b(?:(?:10|127)(?:\.\d+){3}|192\.168(?:\.\d+){2})\b/,
];

export const leaksToMachine = (text: string): boolean => LEAKS.some(pattern => pattern.test(text));
