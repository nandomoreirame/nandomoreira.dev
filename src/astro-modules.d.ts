// Astro 7 types `.astro` imports only through `astro check`'s language
// service. Plain `tsc` (the tier-1 gate) needs this shape for the tests that
// import components and pages; `astro check` resolves the real files first.
declare module '*.astro' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

  const Component: AstroComponentFactory;
  export default Component;
  /** Present on dynamic pages, which the tests call directly. */
  export const getStaticPaths: () => Promise<
    Array<{ params: Record<string, string | undefined>; props?: Record<string, unknown> }>
  >;
}
