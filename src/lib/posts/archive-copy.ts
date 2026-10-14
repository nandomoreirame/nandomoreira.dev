/**
 * Meta description of a yearly archive page: how many texts and what they were
 * about, from the posts' own markers. "Textos publicados em 2017." told a
 * search result nothing (SEO audit 2026-10-13, item 11).
 */
export const archiveYearDescription = (year: string, posts: readonly { markers: readonly string[] }[]): string => {
  const counts = new Map<string, number>();
  for (const post of posts) for (const marker of post.markers) counts.set(marker, (counts.get(marker) ?? 0) + 1);

  // Most used first; ties keep the order the markers first appeared in.
  const subjects = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([marker]) => marker);
  const list = subjects.length > 1 ? `${subjects.slice(0, -1).join(', ')} e ${subjects.at(-1)}` : subjects[0];
  const noun = posts.length === 1 ? 'texto' : 'textos';
  const kept = posts.length === 1 ? 'mantido' : 'mantidos';

  return `${posts.length} ${noun} de ${year} sobre ${list}, ${kept} como registro.`;
};
