import { getCollection, type CollectionEntry } from 'astro:content';
import type { Note } from '../../content/schemas/note';
import { assertUniqueSlugs } from './validate';

export type NoteEntry = CollectionEntry<'notes'>;

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

const loadEntries = async (): Promise<NoteEntry[]> => {
  const entries = await getCollection('notes');
  const published = entries.filter((entry) => entry.data.draft !== true);

  assertUniqueSlugs(
    published.map((entry) => entry.data),
    'note',
  );

  return published.sort((a, b) => {
    const byDate = b.data.date.localeCompare(a.data.date);
    return byDate !== 0 ? byDate : 0;
  });
};

const load = async (): Promise<Note[]> =>
  sortNotes(publishedNotes((await getCollection('notes')).map((entry) => entry.data)));

export const getAllNotes = async (): Promise<Note[]> => load();

export const getNote = async (slug: string): Promise<Note | undefined> =>
  (await load()).find((note) => note.slug === slug);

/** Full collection entry for body rendering; drafts already excluded. */
export const getAllNoteEntries = async (): Promise<NoteEntry[]> => loadEntries();

export const getNoteEntry = async (slug: string): Promise<NoteEntry | undefined> =>
  (await loadEntries()).find((entry) => entry.data.slug === slug);
