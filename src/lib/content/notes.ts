import { getCollection } from 'astro:content';
import type { Note } from '../../content/schemas/note';
import { assertUniqueSlugs } from './validate';

export const publishedNotes = (notes: readonly Note[]): Note[] =>
  notes.filter((note) => note.draft !== true);

/** Newest first. Equal dates keep insertion order (stable sort). */
export const sortNotes = (notes: readonly Note[]): Note[] =>
  notes
    .map((note, index) => ({ note, index }))
    .sort((a, b) => {
      const byDate = b.note.date.localeCompare(a.note.date);
      return byDate !== 0 ? byDate : a.index - b.index;
    })
    .map(({ note }) => note);

const load = async (): Promise<Note[]> => {
  const entries = await getCollection('notes');
  const notes = entries.map((entry) => entry.data);

  assertUniqueSlugs(notes, 'note');

  return publishedNotes(notes);
};

export const getAllNotes = async (): Promise<Note[]> => sortNotes(await load());

export const getNote = async (slug: string): Promise<Note | undefined> =>
  (await load()).find((note) => note.slug === slug);
