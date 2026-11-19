import { POINTS_PER_TASK } from '@/features/screen-time/limits';
import type { Task } from '@/features/tasks/types';

import { levelForPoints } from './pets';
import type { PetState } from './types';

export type PetChange = {
  state: PetState;
  levelBefore: number;
  levelAfter: number;
};

export function createInitialPetState(rewardedTaskIds: string[] = []): PetState {
  const now = new Date().toISOString();

  return {
    points: 0,
    lifetimePoints: 0,
    rewardedTaskIds,
    penaltiesByDate: {},
    createdAt: now,
    updatedAt: now,
  };
}

/** Awards points for tasks that just became completed. */
export function applyTaskRewards(
  state: PetState,
  tasks: Task[],
): (PetChange & { gained: number; taskTitle: string }) | null {
  const rewarded = new Set(state.rewardedTaskIds);
  const newlyCompleted = tasks.filter((task) => task.completed && !rewarded.has(task.id));

  if (newlyCompleted.length === 0) return null;

  const gained = newlyCompleted.reduce((sum, task) => sum + POINTS_PER_TASK[task.priority], 0);
  const points = state.points + gained;
  const now = new Date().toISOString();

  return {
    state: {
      ...state,
      points,
      lifetimePoints: state.lifetimePoints + gained,
      rewardedTaskIds: [...state.rewardedTaskIds, ...newlyCompleted.map((task) => task.id)],
      updatedAt: now,
    },
    gained,
    taskTitle: newlyCompleted[0].title,
    levelBefore: levelForPoints(state.points).level,
    levelAfter: levelForPoints(points).level,
  };
}

/**
 * Deducts the difference between the day's target penalty and what was already
 * charged, so polling every minute never double-charges the same usage.
 */
export function applyScreenTimePenalty(
  state: PetState,
  input: { date: string; targetPoints: number; minutesOver: number },
): (PetChange & { charged: number }) | null {
  const alreadyCharged = state.penaltiesByDate[input.date] ?? 0;
  if (input.targetPoints <= alreadyCharged) return null;

  const charged = input.targetPoints - alreadyCharged;
  const points = Math.max(0, state.points - charged);

  return {
    state: {
      ...state,
      points,
      penaltiesByDate: { ...state.penaltiesByDate, [input.date]: input.targetPoints },
      updatedAt: new Date().toISOString(),
    },
    charged,
    levelBefore: levelForPoints(state.points).level,
    levelAfter: levelForPoints(points).level,
  };
}
