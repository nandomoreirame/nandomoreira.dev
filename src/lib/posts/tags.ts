/**
 * A post marker shown as a tag: "open source" -> "#open-source". Lowercased and
 * hyphenated so a multi-word marker still reads as one tag, and so the same
 * string can later key tag search and grouping.
 */
export const toHashtag = (marker: string): string =>
  `#${marker.trim().toLowerCase().split(/\s+/).join('-')}`;
