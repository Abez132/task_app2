import { Platform } from 'react-native';
import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  type NotificationRequest,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';

import type { Task } from '@/features/tasks/types';

/**
 * Due-date local notifications.
 *
 * Task due dates are stored as date-only `YYYY-MM-DD` strings (no time of day),
 * so this module picks a reminder time (09:00 local) and schedules a single
 * local notification for that moment on the due date. All scheduling is keyed
 * by the task id (stored in `content.data.taskId`) and is reconciled against
 * the OS's list of scheduled notifications, so no extra persistence is needed.
 */

/** Android channel used for all due-date reminders (required on Android 8+). */
const DUE_DATE_CHANNEL_ID = 'task-due-dates';
const DUE_DATE_CHANNEL_NAME = 'Task due dates';

/** Hour of the day (local time) at which a due-date reminder fires. */
const REMINDER_HOUR = 9;

/** expo-notifications is a native module; local scheduling only works on iOS/Android. */
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

function warn(context: string, error: unknown): void {
  console.warn(`[notifications] ${context} failed:`, error);
}

/** Read the task id we attached to a scheduled notification's payload, if any. */
function readTaskId(request: NotificationRequest): string | undefined {
  const taskId = request.content.data?.taskId;
  return typeof taskId === 'string' ? taskId : undefined;
}

/**
 * Build the local Date at which a due-date reminder should fire.
 *
 * The due date is date-only, so we always fire at 09:00 local time on that day.
 * Returns `null` when the due date is missing/invalid or that moment has already
 * passed (a past reminder can't be delivered, so we don't schedule it).
 */
function buildTriggerDate(dueDate: string, now: Date = new Date()): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Construct in LOCAL time (month is 0-indexed) at 09:00.
  const trigger = new Date(year, month - 1, day, REMINDER_HOUR, 0, 0, 0);
  return trigger.getTime() > now.getTime() ? trigger : null;
}

/** Configure how due-date notifications are presented while the app is in the foreground. */
export function configureNotificationsHandler(): void {
  if (!isNative) return;

  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Request notification permissions and set up the Android channel.
 *
 * Call once on app start. For local-only notifications we only need permission
 * (no push token). On Android 13+ the permission prompt requires a channel to
 * exist first, so the channel is created before requesting.
 */
export async function setupNotifications(): Promise<void> {
  if (!isNative) return;

  // The Android channel must exist before the Android 13+ permission prompt
  // can appear. Creating it can fail in Expo Go (its bundled native module
  // doesn't fully support channels), so we isolate it so a failure here does
  // not block the permission request below.
  if (Platform.OS === 'android') {
    try {
      await setNotificationChannelAsync(DUE_DATE_CHANNEL_ID, {
        name: DUE_DATE_CHANNEL_NAME,
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (error) {
      warn('channel', error);
    }
  }

  try {
    const { status: existingStatus } = await getPermissionsAsync();
    if (existingStatus !== 'granted') {
      await requestPermissionsAsync();
    }
  } catch (error) {
    warn('permissions', error);
  }
}

/** Schedule a fresh due-date notification for `task`. Internal: assumes the task should have one. */
async function scheduleForTask(task: Task): Promise<void> {
  if (!task.dueDate) return;

  const triggerDate = buildTriggerDate(task.dueDate);
  if (!triggerDate) return; // due date is in the past — nothing to schedule

  await scheduleNotificationAsync({
    content: {
      title: 'Task due today',
      body: task.title,
      data: { taskId: task.id, title: task.title },
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: DUE_DATE_CHANNEL_ID,
    },
  });
}

/**
 * Cancel any scheduled due-date notification for the given task.
 *
 * Never throws: a failed/missing cancel is non-fatal. We discover the existing
 * notification by the `taskId` in its payload (rather than relying on a stored
 * notification id), so this stays correct even if the OS regenerated ids.
 */
export async function cancelDueDateNotification(taskId: string): Promise<void> {
  if (!isNative) return;

  try {
    const scheduled = await getAllScheduledNotificationsAsync();
    const existing = scheduled.find((request) => readTaskId(request) === taskId);
    if (existing) {
      await cancelScheduledNotificationAsync(existing.identifier);
    }
  } catch (error) {
    warn('cancel', error);
  }
}

/**
 * Keep the scheduled notification in sync with a task's current state.
 *
 * - No due date, or completed → cancel any existing reminder.
 * - Due date set and not completed → (re)schedule (cancels the old one first,
 *   so editing a due date replaces the reminder).
 *
 * Never throws; safe to call fire-and-forget after a task mutation.
 */
export async function syncTaskNotification(task: Task): Promise<void> {
  if (!isNative) return;

  try {
    if (!task.dueDate || task.completed) {
      await cancelDueDateNotification(task.id);
      return;
    }

    await cancelDueDateNotification(task.id);
    await scheduleForTask(task);
  } catch (error) {
    warn('sync', error);
  }
}

/**
 * Reconcile scheduled notifications against the full task list.
 *
 * Call after tasks load (e.g. app start) so that tasks created before this
 * feature shipped, or reminders cleared by the OS, get rescheduled. Performs a
 * single scan of scheduled notifications and cancels/replaces as needed. Never
 * throws.
 */
export async function reconcileTaskNotifications(tasks: Task[]): Promise<void> {
  if (!isNative) return;

  try {
    const scheduled = await getAllScheduledNotificationsAsync();
    const scheduledIdByTaskId = new Map<string, string>();
    for (const request of scheduled) {
      const taskId = readTaskId(request);
      if (taskId) scheduledIdByTaskId.set(taskId, request.identifier);
    }

    const wantedTaskIds = new Set(
      tasks.filter((task) => task.dueDate !== null && !task.completed).map((task) => task.id)
    );

    // Cancel reminders for tasks that no longer need one (deleted/completed/no due date).
    for (const [taskId, identifier] of scheduledIdByTaskId) {
      if (!wantedTaskIds.has(taskId)) {
        try {
          await cancelScheduledNotificationAsync(identifier);
        } catch (error) {
          warn('reconcile-cancel', error);
        }
      }
    }

    // (Re)schedule a reminder for each task that should have one. This replaces
    // stale reminders whose due date/time may have changed since last schedule.
    for (const task of tasks) {
      if (!task.dueDate || task.completed) continue;
      try {
        const existingIdentifier = scheduledIdByTaskId.get(task.id);
        if (existingIdentifier) {
          await cancelScheduledNotificationAsync(existingIdentifier);
        }
        await scheduleForTask(task);
      } catch (error) {
        warn('reconcile-schedule', error);
      }
    }
  } catch (error) {
    warn('reconcile', error);
  }
}
