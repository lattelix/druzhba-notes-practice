import type { Note, NoteDraft, NoteId, NotesRepository } from './model';

const STORAGE_KEY = 'druzhba-notes-v1';

function readNotes(): Note[] {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as Note[]) : [];
  } catch {
    return [];
  }
}

function writeNotes(notes: Note[]) {
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function matches(note: Note, query: string) {
  const haystack = [note.title, note.body, note.eventDate, note.eventTime]
    .join(' ')
    .toLocaleLowerCase('ru-RU');
  return haystack.includes(query.toLocaleLowerCase('ru-RU'));
}

export const notesRepository: NotesRepository = {
  async list(query = '') {
    const notes = readNotes().sort((a, b) => b.updatedAt - a.updatedAt);
    const normalizedQuery = query.trim();
    return normalizedQuery ? notes.filter((note) => matches(note, normalizedQuery)) : notes;
  },

  async create(draft: NoteDraft) {
    const notes = readNotes();
    const now = Date.now();
    const id = notes.reduce((maxId, note) => Math.max(maxId, note.id), 0) + 1;
    const note: Note = { id, ...draft, createdAt: now, updatedAt: now };
    writeNotes([note, ...notes]);
    return note;
  },

  async update(id: NoteId, draft: NoteDraft) {
    const notes = readNotes();
    const current = notes.find((note) => note.id === id);
    if (!current) throw new Error('Заметка не найдена.');

    const updated: Note = { ...current, ...draft, updatedAt: Date.now() };
    writeNotes(notes.map((note) => (note.id === id ? updated : note)));
    return updated;
  },

  async remove(id: NoteId) {
    writeNotes(readNotes().filter((note) => note.id !== id));
  },
};
