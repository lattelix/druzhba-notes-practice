import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { NoteEditor } from './note-editor';
import type { Note, NoteDraft } from './model';
import { notesRepository } from './notes-repository';

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const loadSequence = useRef(0);

  const loadNotes = useCallback(async (searchQuery: string) => {
    const sequence = ++loadSequence.current;
    try {
      const result = await notesRepository.list(searchQuery);
      if (sequence === loadSequence.current) {
        setNotes(result);
        setError('');
      }
    } catch {
      if (sequence === loadSequence.current) {
        setError('Не удалось загрузить заметки. Перезапустите приложение и повторите попытку.');
      }
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadNotes(query), 160);
    return () => clearTimeout(timer);
  }, [loadNotes, query]);

  const openCreate = () => {
    setSelectedNote(null);
    setEditorVisible(true);
  };

  const openEdit = (note: Note) => {
    setSelectedNote(note);
    setEditorVisible(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorVisible(false);
  };

  const saveNote = async (draft: NoteDraft) => {
    setSaving(true);
    try {
      if (selectedNote) {
        await notesRepository.update(selectedNote.id, draft);
      } else {
        await notesRepository.create(draft);
      }
      setEditorVisible(false);
      await loadNotes(query);
    } catch {
      setError('Не удалось сохранить заметку. Проверьте доступ к хранилищу и повторите попытку.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      await notesRepository.remove(selectedNote.id);
      setEditorVisible(false);
      await loadNotes(query);
    } catch {
      setError('Не удалось удалить заметку. Повторите попытку.');
    } finally {
      setSaving(false);
    }
  };

  if (editorVisible) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <NoteEditor
          note={selectedNote}
          onClose={closeEditor}
          onDelete={deleteNote}
          onSave={saveNote}
          saving={saving}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.eyebrow}>ДОЛ «ДРУЖБА»</Text>
            <Text style={styles.title}>Рабочие заметки</Text>
            <Text style={styles.subtitle}>Заявки, решения и работы IT-отдела</Text>
          </View>
          <Pressable
            accessibilityLabel="Создать новую заметку"
            accessibilityRole="button"
            onPress={openCreate}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonText}>+ Новая заметка</Text>
          </Pressable>
        </View>

        <TextInput
          accessibilityLabel="Поиск заметок"
          onChangeText={setQuery}
          placeholder="Поиск по тексту, дате или времени"
          placeholderTextColor="#7d8790"
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />

        {error ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadNotes(query)}>
              <Text style={styles.retryText}>Повторить</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#18766d" size="large" />
            <Text style={styles.stateText}>Загрузка заметок...</Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={notes.length ? styles.list : styles.emptyList}
            data={notes}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(note) => String(note.id)}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{query ? 'Ничего не найдено' : 'Заметок пока нет'}</Text>
                <Text style={styles.stateText}>
                  {query
                    ? 'Измените поисковый запрос или очистите строку.'
                    : 'Создайте первую запись по заявке или выполненной работе.'}
                </Text>
                {!query ? (
                  <Pressable accessibilityRole="button" onPress={openCreate} style={styles.emptyButton}>
                    <Text style={styles.emptyButtonText}>Создать заметку</Text>
                  </Pressable>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityHint="Открывает заметку для редактирования"
                accessibilityRole="button"
                onPress={() => openEdit(item)}
                style={({ pressed }) => [styles.noteCard, pressed && styles.cardPressed]}>
                <View style={styles.noteHeader}>
                  <Text numberOfLines={1} style={styles.noteTitle}>
                    {item.title}
                  </Text>
                  <Text style={styles.noteDate}>{item.eventDate}</Text>
                </View>
                <Text numberOfLines={3} style={styles.noteBody}>
                  {item.body}
                </Text>
                <View style={styles.noteFooter}>
                  <Text style={styles.eventTime}>{item.eventTime}</Text>
                  <Text style={styles.updatedAt}>Изменено {formatUpdatedAt(item.updatedAt)}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eef1f2' },
  page: {
    width: '100%',
    maxWidth: 820,
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  brandBlock: { flex: 1 },
  eyebrow: { color: '#18766d', fontSize: 12, fontWeight: '800' },
  title: { marginTop: 5, color: '#182128', fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 5, color: '#5c6871', fontSize: 15, lineHeight: 21 },
  addButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#18766d',
  },
  addButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  searchInput: {
    minHeight: 48,
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#c6cdd2',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    color: '#182128',
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    padding: 13,
    borderLeftWidth: 4,
    borderLeftColor: '#b42318',
    borderRadius: 4,
    backgroundColor: '#fff1ef',
  },
  errorText: { flex: 1, color: '#7a271a', fontSize: 14, lineHeight: 20 },
  retryText: { color: '#7a271a', fontSize: 14, fontWeight: '700' },
  list: { paddingBottom: 30, gap: 10 },
  emptyList: { flexGrow: 1 },
  noteCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#d8dde1',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  cardPressed: { borderColor: '#18766d', backgroundColor: '#f8fbfa' },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteTitle: { flex: 1, color: '#182128', fontSize: 18, fontWeight: '700' },
  noteDate: { color: '#6c7680', fontSize: 13, fontWeight: '600' },
  noteBody: { marginTop: 10, color: '#4d5861', fontSize: 15, lineHeight: 21 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  eventTime: { color: '#9a6300', fontSize: 12, fontWeight: '700' },
  updatedAt: { color: '#7d8790', fontSize: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { marginBottom: 8, color: '#26323a', fontSize: 21, fontWeight: '700' },
  stateText: { maxWidth: 390, color: '#66717a', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  emptyButton: { marginTop: 20, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 6, backgroundColor: '#ffffff' },
  emptyButtonText: { color: '#18766d', fontSize: 15, fontWeight: '700' },
});
