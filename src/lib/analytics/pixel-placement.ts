/**
 * Only where middleware cannot see the visit (REQ-002). An SSR page with the
 * pixel would be counted twice; the AI view is a machine surface, counted by
 * middleware as such.
 */
export const showsPixel = ({ isPrerendered, view }: { isPrerendered: boolean; view: string | undefined }): boolean =>
  isPrerendered && view !== 'ai';
