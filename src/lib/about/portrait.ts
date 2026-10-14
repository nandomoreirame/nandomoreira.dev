/**
 * The illustrated portrait on /sobre. Variants are pre-generated into
 * public/profile/ (the page is SSR, so astro:assets would resize at runtime on
 * every cold start); the JPEG is the fallback and the image the Person
 * JSON-LD points at.
 */
export const PORTRAIT = {
  width: 960,
  height: 960,
  fallback: '/profile/fernando-moreira-v2-960.jpg',
  sources: [
    {
      type: 'image/avif',
      srcset: '/profile/fernando-moreira-v2-480.avif 480w, /profile/fernando-moreira-v2-960.avif 960w',
    },
    {
      type: 'image/webp',
      srcset: '/profile/fernando-moreira-v2-480.webp 480w, /profile/fernando-moreira-v2-960.webp 960w',
    },
  ],
} as const;

export const portraitUrl = (site: string): string => `${site.replace(/\/+$/, '')}${PORTRAIT.fallback}`;
