/**
 * The illustrated portrait. Variants are pre-generated into public/profile/
 * (the pages are SSR, so astro:assets would resize at runtime on every cold
 * start). The drawing is cut out of its background, which the page draws in
 * SVG; the transparent PNG is the fallback for browsers without AVIF/WebP,
 * and the opaque JPEG is what the Person JSON-LD points at, since a share
 * card or a search result has no page behind it.
 */
export const PORTRAIT = {
  width: 960,
  height: 960,
  fallback: '/profile/fernando-moreira-v3-960.png',
  share: '/profile/fernando-moreira-v3-share.jpg',
  sources: [
    {
      type: 'image/avif',
      srcset: '/profile/fernando-moreira-v3-480.avif 480w, /profile/fernando-moreira-v3-960.avif 960w',
    },
    {
      type: 'image/webp',
      srcset: '/profile/fernando-moreira-v3-480.webp 480w, /profile/fernando-moreira-v3-960.webp 960w',
    },
  ],
} as const;

export const portraitUrl = (site: string): string => `${site.replace(/\/+$/, '')}${PORTRAIT.share}`;
