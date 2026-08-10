/**
 * `@jsonresume/schema` ships no type declarations, and there is no
 * `@types/jsonresume__schema` on the registry. Declaring the one function the
 * schema gate uses keeps `astro check` authoritative instead of forcing the
 * import to `any` at the call site.
 */
declare module '@jsonresume/schema' {
  export function validate(
    resume: unknown,
    callback: (error: unknown, valid: boolean) => void,
  ): void;

  export function validateSync(resume: unknown): { valid: boolean; errors?: unknown };
}
