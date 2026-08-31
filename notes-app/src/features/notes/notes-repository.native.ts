import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import type { Note, NoteDraft, NoteId, NotesRepository } from './model';

interface NoteRow {
  id: number;
  title: string;
  body_file_uri: string;
  event_date: string;
  event_time: string;
  created_at: number;
  updated_at: number;
}

const notesDirectory = new Directory(Paths.document, 'druzhba-notes');
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('druzhba-notes.db').then(async (database) => {
      notesDirectory.create({ idempotent: true, intermediates: true });
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          body_file_uri TEXT NOT NULL,
          event_date TEXT NOT NULL,
          event_time TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      return database;
    });
  }

  return databasePromise;
}

async function hydrate(row: NoteRow): Promise<Note> {
  const bodyFile = new File(row.body_file_uri);
  const body = bodyFile.exists ? await bodyFile.text() : '';

  return {
    id: row.id,
    title: row.title,
    body,
    eventDate: row.event_date,
    eventTime: row.event_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function matches(note: Note, query: string) {
  const haystack = [note.title, note.body, note.eventDate, note.eventTime]
    .join(' ')
    .toLocaleLowerCase('ru-RU');
  return haystack.includes(query.toLocaleLowerCase('ru-RU'));
}

export const notesRepository: NotesRepository = {
  async list(query = '') {
    const database = await getDatabase();
    const rows = await database.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY updated_at DESC');
    const notes = await Promise.all(rows.map(hydrate));
    const normalizedQuery = query.trim();
    return normalizedQuery ? notes.filter((note) => matches(note, normalizedQuery)) : notes;
  },

  async create(draft: NoteDraft) {
    const database = await getDatabase();
    const now = Date.now();
    const bodyFile = new File(notesDirectory, `note-${now}-${Math.random().toString(36).slice(2)}.txt`);
    bodyFile.create({ intermediates: true });
    bodyFile.write(draft.body);

    try {
      const result = await database.runAsync(
        `INSERT INTO notes (title, body_file_uri, event_date, event_time, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [draft.title, bodyFile.uri, draft.eventDate, draft.eventTime, now, now],
      );
      return { id: result.lastInsertRowId, ...draft, createdAt: now, updatedAt: now };
    } catch (error) {
      if (bodyFile.exists) bodyFile.delete();
      throw error;
    }
  },

  async update(id: NoteId, draft: NoteDraft) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
    if (!row) throw new Error('Заметка не найдена.');

    const bodyFile = new File(row.body_file_uri);
    if (!bodyFile.exists) bodyFile.create({ intermediates: true });
    bodyFile.write(draft.body);

    const updatedAt = Date.now();
    await database.runAsync(
      `UPDATE notes
       SET title = ?, event_date = ?, event_time = ?, updated_at = ?
       WHERE id = ?`,
      [draft.title, draft.eventDate, draft.eventTime, updatedAt, id],
    );

    return { id, ...draft, createdAt: row.created_at, updatedAt };
  },

  async remove(id: NoteId) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
    if (!row) return;

    await database.runAsync('DELETE FROM notes WHERE id = ?', [id]);
    const bodyFile = new File(row.body_file_uri);
    if (bodyFile.exists) bodyFile.delete();
  },
};
