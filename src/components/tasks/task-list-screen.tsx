import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Eyebrow } from '@/components/ui/eyebrow';
import { Glow } from '@/components/ui/glow';
import { AppColors, Radii, Shadows } from '@/constants/theme';
import { usePet } from '@/features/pet/pet-provider';
import { useTasks } from '@/features/tasks/task-provider';
import type { Task, TaskPriority } from '@/features/tasks/types';

import { TaskEditorModal } from './task-editor-modal';

type TaskListScreenProps = {
  showCompleted?: boolean;
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: AppColors.green,
  medium: AppColors.amber,
  high: AppColors.red,
};

export function TaskListScreen({ showCompleted = false }: TaskListScreenProps) {
  const insets = useSafeAreaInsets();
  const { tasks, isLoading, error, reloadTasks, changeTaskCompletion } = useTasks();
  const { level, points } = usePet();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.completed === showCompleted),
    [tasks, showCompleted],
  );
  const remainingCount = tasks.filter((task) => !task.completed).length;

  function openNewTask() {
    setEditingTask(null);
    setIsEditorOpen(true);
  }

  function openTask(task: Task) {
    setEditingTask(task);
    setIsEditorOpen(true);
  }

  async function toggleTask(task: Task) {
    try {
      await changeTaskCompletion(task.id, !task.completed);
    } catch {
      // The provider keeps and displays the storage error for retry.
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <Glow size={380} color={AppColors.purple} opacity={0.2} style={{ top: -190, right: -150 }} />
      <Glow size={260} color={AppColors.peach} opacity={0.1} style={{ top: 150, left: -160 }} />

      <FlatList
        data={visibleTasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 104 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Eyebrow
              label={showCompleted ? 'YOUR PROGRESS' : 'FOCUS · TASKS'}
              icon={showCompleted ? 'trophy-outline' : 'sparkles-outline'}
            />
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.title}>{showCompleted ? 'Completed' : 'My tasks'}</Text>
                <Text style={styles.subtitle}>
                  {showCompleted
                    ? `${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'} finished`
                    : remainingCount === 0
                      ? 'A little progress, every day.'
                      : `${remainingCount} task${remainingCount === 1 ? '' : 's'} to focus on`}
                </Text>
              </View>
              {!showCompleted && remainingCount > 0 && (
                <Pressable
                  onPress={openNewTask}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Add a task"
                  style={({ pressed }) => [
                    styles.addButton,
                    isLoading && styles.disabledAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <LinearGradient
                    colors={['#FFE7C7', '#FFB98A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addButtonFill}
                  >
                    <Ionicons name="add" size={28} color="#251627" />
                  </LinearGradient>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => router.push('/pet')}
              accessibilityRole="button"
              accessibilityLabel={`${level.name}, level ${level.level}, ${points} points. Open pet.`}
              style={({ pressed }) => [styles.petStrip, pressed && styles.pressed]}
            >
              <LinearGradient
                colors={['rgba(124, 58, 237, 0.3)', 'rgba(21, 21, 29, 0.25)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.petStripFill}
              >
                <View style={styles.petStripAvatar}>
                  <Text style={styles.petStripEmoji}>{level.emoji}</Text>
                </View>
                <View style={styles.petStripCopy}>
                  <Text style={styles.petStripName}>
                    {level.name} · LV {level.level}
                  </Text>
                  <Text style={styles.petStripMeta}>{points} points · tap to visit</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
              </LinearGradient>
            </Pressable>

            {!showCompleted && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, styles.statIconPeach]}>
                    <Ionicons name="time-outline" size={15} color={AppColors.peach} />
                  </View>
                  <Text style={styles.statValue}>{remainingCount}</Text>
                  <Text style={styles.statTitle}>To do</Text>
                  <Text style={styles.statCaption}>Keep your focus</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, styles.statIconGreen]}>
                    <Ionicons name="checkmark-done-outline" size={15} color={AppColors.green} />
                  </View>
                  <Text style={styles.statValue}>{tasks.length - remainingCount}</Text>
                  <Text style={styles.statTitle}>Completed</Text>
                  <Text style={styles.statCaption}>Small wins add up</Text>
                </View>
              </View>
            )}

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#FFB4AA" />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  onPress={() => void reloadTasks()}
                  accessibilityRole="button"
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>
                {showCompleted ? 'Finished tasks' : 'Your list'}
              </Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{visibleTasks.length}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            isNew={item.id === newTaskId}
            onOpen={() => openTask(item)}
            onToggle={() => void toggleTask(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={AppColors.peach} />
              <Text style={styles.emptyTitle}>Loading tasks</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={showCompleted ? 'checkmark-done' : 'sparkles-outline'}
                  size={28}
                  color={AppColors.peach}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {showCompleted ? 'No completed tasks yet' : 'Nothing on your list yet'}
              </Text>
              <Text style={styles.emptyText}>
                {showCompleted
                  ? 'Finished tasks will appear here.'
                  : 'Tap the plus to add your first task.'}
              </Text>
              {!showCompleted && (
                <Pressable
                  onPress={openNewTask}
                  accessibilityRole="button"
                  accessibilityLabel="Add your first task"
                  style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
                >
                  <LinearGradient
                    colors={['#FFE7C7', '#FFB98A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyActionFill}
                  >
                    <Ionicons name="add" size={18} color="#251627" />
                    <Text style={styles.emptyActionText}>Add a task</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          )
        }
      />

      <TaskEditorModal
        visible={isEditorOpen}
        task={editingTask}
        onClose={() => setIsEditorOpen(false)}
        onTaskCreated={setNewTaskId}
      />
    </SafeAreaView>
  );
}

function TaskRow({
  task,
  isNew,
  onOpen,
  onToggle,
}: {
  task: Task;
  isNew: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const scale = useSharedValue(isNew ? 0.72 : 1);
  const opacity = useSharedValue(isNew ? 0 : 1);
  const sparkleScale = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const accent = PRIORITY_COLORS[task.priority];

  useEffect(() => {
    if (!isNew) return;
    scale.value = 0.72;
    opacity.value = 0;
    scale.value = withSpring(1, { damping: 20, stiffness: 420, mass: 0.7 });
    opacity.value = withTiming(1, { duration: 240 });
  }, [isNew, opacity, scale]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }, { rotate: '12deg' }],
  }));

  function animateCompletion() {
    if (isAnimating) return;
    if (task.completed) {
      onToggle();
      return;
    }
    setIsAnimating(true);
    sparkleScale.value = withSequence(
      withTiming(1.35, { duration: 270 }),
      withTiming(0.35, { duration: 310 }),
    );
    sparkleOpacity.value = withSequence(
      withTiming(1, { duration: 230 }),
      withDelay(130, withTiming(0, { duration: 260 })),
    );
    scale.value = withSequence(
      withTiming(1.04, { duration: 160 }),
      withTiming(0.65, { duration: 460 }),
    );
    opacity.value = withDelay(
      160,
      withTiming(0, { duration: 460 }, (finished) => {
        if (finished) runOnJS(onToggle)();
      }),
    );
  }

  return (
    <Animated.View style={[styles.taskCard, animatedCardStyle]}>
      <View style={[styles.priorityBar, { backgroundColor: accent }]} />
      <Animated.View pointerEvents="none" style={[styles.sparkleLayer, sparkleStyle]}>
        <Text style={[styles.sparkle, styles.sparkleTopLeft]}>✦</Text>
        <Text style={[styles.sparkle, styles.sparkleTopCenter]}>✧</Text>
        <Text style={[styles.sparkle, styles.sparkleTopRight]}>✦</Text>
        <Text style={[styles.sparkle, styles.sparkleLeft]}>✧</Text>
        <Text style={[styles.sparkle, styles.sparkleRight]}>✧</Text>
        <Text style={[styles.sparkle, styles.sparkleBottomLeft]}>✦</Text>
        <Text style={[styles.sparkle, styles.sparkleBottomRight]}>✧</Text>
      </Animated.View>
      <Pressable
        onPress={animateCompletion}
        disabled={isAnimating}
        accessibilityRole="checkbox"
        accessibilityLabel={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`}
        accessibilityState={{ checked: task.completed }}
        style={({ pressed }) => [
          styles.checkbox,
          task.completed && styles.checkboxChecked,
          pressed && styles.pressed,
        ]}
      >
        {task.completed && <Ionicons name="checkmark" size={22} color="#FFFFFF" />}
      </Pressable>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Edit task: ${task.title}`}
        style={({ pressed }) => [styles.taskDetails, pressed && styles.pressed]}
      >
        <Text numberOfLines={2} style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
          {task.title}
        </Text>
        {!!task.notes && (
          <Text numberOfLines={2} style={styles.taskNotes}>
            {task.notes}
          </Text>
        )}
        <View style={styles.taskMeta}>
          <View style={styles.priorityChip}>
            <View style={[styles.priorityDot, { backgroundColor: accent }]} />
            <Text style={[styles.priorityText, { color: accent }]}>{task.priority}</Text>
          </View>
          {!!task.dueDate && (
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={11} color={AppColors.textMuted} />
              <Text style={styles.metaText}>Due {task.dueDate}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background, overflow: 'hidden' },
  listContent: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20 },
  header: { paddingTop: 14 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 },
  headingCopy: { flex: 1 },
  title: { color: AppColors.text, fontSize: 36, lineHeight: 44, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: AppColors.textMuted, fontSize: 15, lineHeight: 21, marginTop: 4 },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  addButtonFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  petStrip: {
    marginTop: 20,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(185, 162, 255, 0.2)',
  },
  petStripFill: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  petStripAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  petStripEmoji: { fontSize: 22, lineHeight: 28 },
  petStripCopy: { flex: 1 },
  petStripName: { color: AppColors.text, fontSize: 14, fontWeight: '700' },
  petStripMeta: { color: AppColors.textMuted, fontSize: 12, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 28 },
  statCard: {
    minHeight: 152,
    flex: 1,
    padding: 18,
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.borderSoft,
    ...Shadows.card,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'auto',
  },
  statIconPeach: { backgroundColor: 'rgba(255, 214, 165, 0.1)' },
  statIconGreen: { backgroundColor: 'rgba(123, 224, 166, 0.1)' },
  statValue: { color: AppColors.text, fontSize: 34, lineHeight: 38, fontWeight: '800', marginTop: 16 },
  statTitle: { color: AppColors.text, fontSize: 15, fontWeight: '700', marginTop: 6 },
  statCaption: { color: AppColors.textMuted, fontSize: 12, marginTop: 3 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginTop: 18,
    borderRadius: Radii.md,
    backgroundColor: '#34201F',
  },
  errorText: { flex: 1, color: '#FFB4AA', fontSize: 14, lineHeight: 20 },
  retryButton: { minHeight: 44, minWidth: 54, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#FFB4AA', fontWeight: '700', fontSize: 14 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: AppColors.text, fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  sectionCount: {
    minWidth: 26,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    alignItems: 'center',
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.borderSoft,
  },
  sectionCountText: { color: AppColors.textMuted, fontSize: 12, fontWeight: '700' },

  taskCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.borderSoft,
    overflow: 'visible',
  },
  priorityBar: { position: 'absolute', left: 0, top: 18, bottom: 18, width: 3, borderRadius: 2 },
  checkbox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: AppColors.purple,
    borderColor: 'rgba(185, 162, 255, 0.6)',
    shadowColor: AppColors.purple,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  taskDetails: { flex: 1, minHeight: 58, justifyContent: 'center', paddingVertical: 4 },
  taskTitle: { color: AppColors.text, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  taskTitleDone: { color: AppColors.textDim, textDecorationLine: 'line-through' },
  taskNotes: { color: AppColors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: AppColors.textMuted, fontSize: 12 },
  separator: { height: 10 },

  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 30 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 18,
  },
  emptyTitle: { color: AppColors.text, fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  emptyText: {
    maxWidth: 300,
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyAction: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  emptyActionFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  emptyActionText: { color: '#251627', fontSize: 14, fontWeight: '800' },

  sparkleLayer: { position: 'absolute', zIndex: 2, left: -8, right: -8, top: -10, bottom: -10 },
  sparkle: { position: 'absolute', color: AppColors.peach, fontSize: 18, fontWeight: '700' },
  sparkleTopLeft: { top: -2, left: 24, fontSize: 16 },
  sparkleTopCenter: { top: -9, left: '48%', fontSize: 14, color: AppColors.peach },
  sparkleTopRight: { top: 0, right: 32 },
  sparkleLeft: { top: '43%', left: -2, fontSize: 15, color: AppColors.peach },
  sparkleRight: { top: '48%', right: -2, fontSize: 16 },
  sparkleBottomLeft: { bottom: -5, left: 56, fontSize: 15 },
  sparkleBottomRight: { bottom: -8, right: 68, fontSize: 17, color: AppColors.peach },

  pressed: { opacity: 0.76 },
  disabledAction: { opacity: 0.5 },
});
