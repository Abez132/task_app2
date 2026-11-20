import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Radii, Shadows } from '@/constants/theme';
import { useTasks } from '@/features/tasks/task-provider';
import type { Task, TaskPriority } from '@/features/tasks/types';

import { CalendarDatePicker } from './calendar-date-picker';

type TaskEditorModalProps = {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onTaskCreated?: (taskId: string) => void;
};

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; tint: string }> = {
  low: { label: 'Low', color: AppColors.green, tint: 'rgba(123, 224, 166, 0.12)' },
  medium: { label: 'Medium', color: AppColors.amber, tint: 'rgba(255, 196, 107, 0.12)' },
  high: { label: 'High', color: AppColors.red, tint: 'rgba(255, 143, 143, 0.12)' },
};

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function TaskEditorModal({ visible, task, onClose, onTaskCreated }: TaskEditorModalProps) {
  const { addTask, updateTask, removeTask } = useTasks();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [focusedField, setFocusedField] = useState<'title' | 'notes' | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
    setDueDate(task?.dueDate ?? '');
    setPriority(task?.priority ?? 'medium');
    setError(null);
    setIsConfirmingDelete(false);
    setFocusedField(null);
  }, [task, visible]);

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Add a title for this task.');
      return;
    }
    const trimmedDate = dueDate.trim();
    if (trimmedDate && !isValidDate(trimmedDate)) {
      setError('Enter a valid date in YYYY-MM-DD format.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const draft = {
        title: trimmedTitle,
        notes: notes.trim(),
        dueDate: trimmedDate || null,
        priority,
      };
      if (task) {
        await updateTask(task.id, draft);
      } else {
        const createdTask = await addTask(draft);
        onTaskCreated?.(createdTask.id);
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this task.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setIsSaving(true);
    setError(null);
    try {
      await removeTask(task.id);
      onClose();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Could not delete this task.');
    } finally {
      setIsSaving(false);
      setIsConfirmingDelete(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <View style={styles.grabber} />
            <View style={styles.headerRow}>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close task editor"
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={20} color={AppColors.textMuted} />
              </Pressable>
              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>{task ? 'EDIT' : 'CREATE'}</Text>
                <Text style={styles.headerTitle}>{task ? 'Edit task' : 'New task'}</Text>
              </View>
              <View style={styles.closeButton} />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <View style={styles.labelRow}>
              <Ionicons name="create-outline" size={13} color={AppColors.peach} />
              <Text style={styles.label}>Title</Text>
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to get done?"
              placeholderTextColor={AppColors.textDim}
              style={[styles.titleInput, focusedField === 'title' && styles.inputFocused]}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              maxLength={120}
              autoCapitalize="sentences"
              returnKeyType="done"
              accessibilityLabel="Task title"
            />

            <View style={styles.labelRow}>
              <Ionicons name="document-text-outline" size={13} color={AppColors.peach} />
              <Text style={styles.label}>Notes</Text>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a few details (optional)"
              placeholderTextColor={AppColors.textDim}
              style={[
                styles.input,
                styles.notesInput,
                focusedField === 'notes' && styles.inputFocused,
              ]}
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              accessibilityLabel="Task notes"
            />

            <View style={styles.labelRow}>
              <Ionicons name="calendar-outline" size={13} color={AppColors.peach} />
              <Text style={styles.label}>Due date</Text>
            </View>
            <CalendarDatePicker value={dueDate} onChange={setDueDate} />

            <View style={styles.labelRow}>
              <Ionicons name="flag-outline" size={13} color={AppColors.peach} />
              <Text style={styles.label}>Priority</Text>
            </View>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((option) => {
                const selected = priority === option;
                const meta = PRIORITY_META[option];
                return (
                  <Pressable
                    key={option}
                    onPress={() => setPriority(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${meta.label} priority`}
                    style={({ pressed }) => [
                      styles.priorityButton,
                      selected && { backgroundColor: meta.tint, borderColor: meta.color },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: meta.color }]} />
                    <Text
                      style={[styles.priorityText, selected && { color: meta.color }]}
                    >
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error && (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#FFB4AA" />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={() => void handleSave()}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={task ? 'Save changes' : 'Create task'}
              style={({ pressed }) => [
                styles.saveButton,
                isSaving && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={['#FFE7C7', '#FFB98A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonFill}
              >
                <Ionicons
                  name={task ? 'checkmark' : 'add'}
                  size={20}
                  color="#251627"
                />
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
                </Text>
              </LinearGradient>
            </Pressable>

            {task && !isConfirmingDelete && (
              <Pressable
                onPress={() => setIsConfirmingDelete(true)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
              >
                <Ionicons name="trash-outline" size={16} color="#FF8A80" />
                <Text style={styles.deleteText}>Delete task</Text>
              </Pressable>
            )}

            {task && isConfirmingDelete && (
              <View style={styles.confirmDeletePanel}>
                <Text style={styles.confirmDeleteTitle}>Delete this task?</Text>
                <Text style={styles.confirmDeleteCopy}>This removes it from this device.</Text>
                <View style={styles.confirmActions}>
                  <Pressable
                    onPress={() => setIsConfirmingDelete(false)}
                    disabled={isSaving}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.confirmCancel, pressed && styles.pressed]}
                  >
                    <Text style={styles.confirmCancelText}>Keep task</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleDelete()}
                    disabled={isSaving}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.confirmDelete,
                      isSaving && styles.disabledButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.confirmDeleteText}>
                      {isSaving ? 'Deleting…' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  header: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 12 },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.border,
    marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    color: AppColors.textDim,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  headerTitle: { color: AppColors.text, fontSize: 18, fontWeight: '700', marginTop: 3 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.borderSoft,
  },

  form: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 22, paddingBottom: 44 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 20 },
  label: { color: '#E2E2EA', fontSize: 13, fontWeight: '700' },
  titleInput: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceRaised,
    color: AppColors.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  input: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceRaised,
    color: AppColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  inputFocused: { borderColor: AppColors.peach, backgroundColor: '#1F1F2A' },
  notesInput: { minHeight: 120, paddingTop: 14 },

  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityButton: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
  priorityText: { color: AppColors.textMuted, fontSize: 14, fontWeight: '600' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginTop: 16,
    borderRadius: Radii.md,
    backgroundColor: '#34201F',
  },
  error: { flex: 1, color: '#FFB4AA', fontSize: 13, lineHeight: 19 },

  saveButton: {
    marginTop: 28,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  saveButtonFill: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: { opacity: 0.55 },
  saveButtonText: { color: '#251627', fontSize: 16, fontWeight: '800' },

  deleteButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
  },
  deleteText: { color: '#FF8A80', fontSize: 15, fontWeight: '600' },

  confirmDeletePanel: {
    marginTop: 16,
    padding: 16,
    borderRadius: Radii.lg,
    backgroundColor: '#34201F',
    borderWidth: 1,
    borderColor: 'rgba(255, 143, 143, 0.2)',
  },
  confirmDeleteTitle: { color: '#FFE2DE', fontSize: 16, fontWeight: '700' },
  confirmDeleteCopy: { color: '#E7A9A2', fontSize: 14, marginTop: 5 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  confirmCancel: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  confirmCancelText: { color: '#E0E0E8', fontSize: 14, fontWeight: '700' },
  confirmDelete: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    backgroundColor: '#9E3D36',
  },
  confirmDeleteText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.76 },
});
