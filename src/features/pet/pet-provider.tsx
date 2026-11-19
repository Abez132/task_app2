import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { overageMinutes, penaltyPointsFor } from '@/features/screen-time/limits';
import { useScreenTime } from '@/features/screen-time/screen-time-provider';
import { useTasks } from '@/features/tasks/task-provider';

import { applyScreenTimePenalty, applyTaskRewards, createInitialPetState } from './leveling';
import {
  levelForPoints,
  levelProgressFor,
  nextLevelFor,
  type LevelProgress,
  type PetLevel,
} from './pets';
import { loadPetState, savePetState } from './storage';
import type { PetEvent, PetState } from './types';

type PetContextValue = {
  pet: PetState | null;
  points: number;
  level: PetLevel;
  nextLevel: PetLevel | null;
  progress: LevelProgress;
  isLoading: boolean;
  lastEvent: PetEvent | null;
  dismissEvent: () => void;
  /** True when today's social media time is past the free allowance. */
  isOverLimit: boolean;
};

const PetContext = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: PropsWithChildren) {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { snapshot } = useScreenTime();

  const [pet, setPet] = useState<PetState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastEvent, setLastEvent] = useState<PetEvent | null>(null);

  const petRef = useRef<PetState | null>(null);
  const tasksRef = useRef(tasks);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const commit = useCallback((next: PetState) => {
    petRef.current = next;
    setPet(next);
    void savePetState(next);
  }, []);

  // Wait for tasks so an existing pet isn't rewarded for tasks that were
  // already completed before it existed.
  useEffect(() => {
    if (tasksLoading || hasLoadedRef.current || isLoadingRef.current) return;
    isLoadingRef.current = true;

    let cancelled = false;

    void (async () => {
      try {
        let stored: PetState | null = null;

        try {
          stored = await loadPetState();
        } catch {
          // Corrupt storage should not brick the pet; start fresh instead.
          stored = null;
        }

        if (cancelled) return;

        const initial =
          stored ??
          createInitialPetState(
            tasksRef.current.filter((task) => task.completed).map((task) => task.id),
          );

        petRef.current = initial;
        setPet(initial);
        hasLoadedRef.current = true;

        if (!stored) void savePetState(initial);
      } finally {
        isLoadingRef.current = false;
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tasksLoading]);

  // Task completion → points.
  useEffect(() => {
    const current = petRef.current;
    if (!current) return;

    const change = applyTaskRewards(current, tasks);
    if (!change) return;

    commit(change.state);

    const at = new Date().toISOString();
    setLastEvent(
      change.levelAfter > change.levelBefore
        ? { type: 'level-up', level: change.levelAfter, at }
        : { type: 'reward', points: change.gained, taskTitle: change.taskTitle, at },
    );
  }, [tasks, pet, commit]);

  // Excess social media → point loss (and possibly a level down).
  useEffect(() => {
    const current = petRef.current;
    if (!current || snapshot.status !== 'ready') return;

    const minutesOver = overageMinutes(snapshot.totalMinutes);
    const change = applyScreenTimePenalty(current, {
      date: snapshot.date,
      targetPoints: penaltyPointsFor(snapshot.totalMinutes),
      minutesOver,
    });
    if (!change) return;

    const lost = current.points - change.state.points;
    commit(change.state);

    const at = new Date().toISOString();
    if (change.levelAfter < change.levelBefore) {
      setLastEvent({ type: 'level-down', level: change.levelAfter, at });
    } else if (lost > 0) {
      setLastEvent({ type: 'penalty', points: lost, minutesOver, at });
    }
  }, [snapshot, pet, commit]);

  const dismissEvent = useCallback(() => setLastEvent(null), []);

  const points = pet?.points ?? 0;
  const level = levelForPoints(points);
  const nextLevel = nextLevelFor(level);
  const progress = levelProgressFor(points);
  const isOverLimit =
    snapshot.status === 'ready' && overageMinutes(snapshot.totalMinutes) > 0;

  const value = useMemo(
    () => ({
      pet,
      points,
      level,
      nextLevel,
      progress,
      isLoading,
      lastEvent,
      dismissEvent,
      isOverLimit,
    }),
    [
      pet,
      points,
      level,
      nextLevel,
      progress,
      isLoading,
      lastEvent,
      dismissEvent,
      isOverLimit,
    ],
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet(): PetContextValue {
  const context = useContext(PetContext);
  if (context === null) {
    throw new Error('usePet must be used within a PetProvider.');
  }

  return context;
}
