/**
 * Where the CV lives. Kept apart from download.ts, which pulls Resend and
 * Firestore, so /go can import the file path without them.
 */

/**
 * The one CV the site offers (the full-stack version since 2026-11-14), served
 * from public/ under its name in the career folder.
 */
export const CV_PDF_PATH = '/CV-senior-fullstack-software-engineer-Fernando-Moreira-20261110.pdf';
/** The English counterpart, offered from /en/resume. */
export const CV_PDF_PATH_EN = '/CV-senior-fullstack-software-engineer-en-Fernando-Moreira-20261114.pdf';
export const CV_PAGE = '/curriculo';
