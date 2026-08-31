import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { createEmptyDraft, type Note, type NoteDraft } from './model';

interface NoteEditorProps {
  note: Note | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: NoteDraft) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function NoteEditor({ note, saving, onClose, onSave, onDelete }: NoteEditorProps) {
  const [draft, setDraft] = useState<NoteDraft>(note ?? createEmptyDraft());
  const [validationError, setValidationError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateField = (field: keyof NoteDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      setValidationError('Укажите заголовок заметки.');
      return;
    }
    if (!draft.body.trim()) {
      setValidationError('Добавьте содержание заметки.');
      return;
    }
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(draft.eventDate)) {
      setValidationError('Дата должна быть в формате ДД.ММ.ГГГГ.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(draft.eventTime)) {
      setValidationError('Время должно быть в формате ЧЧ:ММ.');
      return;
    }

    setValidationError('');
    await onSave({
      title: draft.title.trim(),
      body: draft.body.trim(),
      eventDate: draft.eventDate,
      eventTime: draft.eventTime,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.editorPage}>
      <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>ДРУЖБА NOTES</Text>
              <Text style={styles.heading}>{note ? 'Редактирование' : 'Новая заметка'}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Заголовок</Text>
            <TextInput
              accessibilityLabel="Заголовок заметки"
              onChangeText={(value) => updateField('title', value)}
              placeholder="Например, подготовка компьютерного класса"
              placeholderTextColor="#8b929b"
              style={styles.input}
              value={draft.title}
            />

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Дата</Text>
                <TextInput
                  accessibilityLabel="Дата заметки"
                  inputMode="numeric"
                  onChangeText={(value) => updateField('eventDate', value)}
                  placeholder="ДД.ММ.ГГГГ"
                  placeholderTextColor="#8b929b"
                  style={styles.input}
                  value={draft.eventDate}
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>Время</Text>
                <TextInput
                  accessibilityLabel="Время заметки"
                  inputMode="numeric"
                  onChangeText={(value) => updateField('eventTime', value)}
                  placeholder="ЧЧ:ММ"
                  placeholderTextColor="#8b929b"
                  style={styles.input}
                  value={draft.eventTime}
                />
              </View>
            </View>

            <Text style={styles.label}>Содержание</Text>
            <TextInput
              accessibilityLabel="Содержание заметки"
              multiline
              onChangeText={(value) => updateField('body', value)}
              placeholder="Решения, вопросы, следующие действия"
              placeholderTextColor="#8b929b"
              style={[styles.input, styles.bodyInput]}
              textAlignVertical="top"
              value={draft.body}
            />

            {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void handleSave()}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryButtonText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={onClose}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>Отмена</Text>
              </Pressable>
            </View>

            {note ? (
              <View style={styles.deleteArea}>
                {confirmDelete ? (
                  <>
                    <Text style={styles.deletePrompt}>Удалить эту заметку без возможности восстановления?</Text>
                    <View style={styles.deleteActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={saving}
                        onPress={() => void onDelete()}
                        style={styles.deleteConfirmButton}>
                        <Text style={styles.deleteConfirmText}>Да, удалить</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(false)}>
                        <Text style={styles.cancelDeleteText}>Не удалять</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)}>
                    <Text style={styles.deleteLink}>Удалить заметку</Text>
                  </Pressable>
                )}
              </View>
            ) : null}
          </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  editorPage: {
    flex: 1,
    backgroundColor: '#eef1f2',
  },
  sheet: {
    width: '100%',
    maxWidth: 720,
    flex: 1,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d8dde2',
  },
  eyebrow: { color: '#18766d', fontSize: 11, fontWeight: '700' },
  heading: { marginTop: 3, color: '#182128', fontSize: 22, fontWeight: '700' },
  closeButton: { paddingVertical: 8, paddingLeft: 12 },
  closeButtonText: { color: '#4d5861', fontSize: 15, fontWeight: '600' },
  form: { padding: 20, paddingBottom: 36 },
  label: { marginBottom: 7, color: '#38444d', fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 48,
    marginBottom: 18,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#cbd2d8',
    borderRadius: 6,
    backgroundColor: '#fbfcfc',
    color: '#182128',
    fontSize: 16,
  },
  bodyInput: { minHeight: 180 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  timeField: { width: 120 },
  errorText: { marginTop: -5, marginBottom: 14, color: '#b42318', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#18766d',
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    minHeight: 48,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd2d8',
    borderRadius: 6,
  },
  secondaryButtonText: { color: '#38444d', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.78 },
  deleteArea: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eceff1' },
  deleteLink: { color: '#b42318', fontSize: 15, fontWeight: '600' },
  deletePrompt: { marginBottom: 12, color: '#57211c', fontSize: 14 },
  deleteActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  deleteConfirmButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, backgroundColor: '#b42318' },
  deleteConfirmText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  cancelDeleteText: { color: '#4d5861', fontSize: 14, fontWeight: '600' },
});
