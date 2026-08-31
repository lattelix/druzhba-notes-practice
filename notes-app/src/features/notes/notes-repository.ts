import type { NotesRepository } from './model';

const unsupported = async (): Promise<never> => {
  throw new Error('Хранилище заметок не поддерживается на этой платформе.');
};

export const notesRepository: NotesRepository = {
  list: unsupported,
  create: unsupported,
  update: unsupported,
  remove: unsupported,
};
