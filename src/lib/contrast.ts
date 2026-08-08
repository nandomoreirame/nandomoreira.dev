/** WCAG 2.1 relative luminance and contrast ratio. */

const parseHex = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    throw new Error(`Expected a 6-digit hex color, received "${hex}"`);
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255,
  ];
};

const linearize = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = parseHex(hex).map(linearize) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number => {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
};
