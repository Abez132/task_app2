import type { TaskPriority } from '@/features/tasks/types';

/** Free social media time per day before the pet starts losing points. */
export const DAILY_SOCIAL_LIMIT_MINUTES = 45;

/** Every this many minutes over the limit costs the pet one point. */
export const MINUTES_PER_POINT_LOST = 10;

/** Points earned when a task is completed (once per task). */
export const POINTS_PER_TASK: Record<TaskPriority, number> = {
  low: 6,
  medium: 10,
  high: 14,
};

export function overageMinutes(totalMinutes: number): number {
  return Math.max(0, Math.round(totalMinutes) - DAILY_SOCIAL_LIMIT_MINUTES);
}

/** Total points that should have been deducted for a day's usage. */
export function penaltyPointsFor(totalMinutes: number): number {
  return Math.floor(overageMinutes(totalMinutes) / MINUTES_PER_POINT_LOST);
}
