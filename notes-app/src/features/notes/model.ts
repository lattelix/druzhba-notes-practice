export type NoteId = number;

export interface NoteDraft {
  title: string;
  body: string;
  eventDate: string;
  eventTime: string;
}

export interface Note extends NoteDraft {
  id: NoteId;
  createdAt: number;
  updatedAt: number;
}

export interface NotesRepository {
  list(query?: string): Promise<Note[]>;
  create(draft: NoteDraft): Promise<Note>;
  update(id: NoteId, draft: NoteDraft): Promise<Note>;
  remove(id: NoteId): Promise<void>;
}

export function createEmptyDraft(now = new Date()): NoteDraft {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return {
    title: '',
    body: '',
    eventDate: `${day}.${month}.${year}`,
    eventTime: `${hours}:${minutes}`,
  };
}
