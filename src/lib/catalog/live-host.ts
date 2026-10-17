/** The host a case is live on, as shown in the listing (REQ-012). */
export const liveHost = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};
