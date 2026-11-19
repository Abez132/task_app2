import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PetState } from './types';

const PET_STORAGE_KEY = '@task-manager/pet-v1';

let writeQueue: Promise<void> = Promise.resolve();

function isValidPetState(value: unknown): value is PetState {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<PetState>;
  return (
    typeof candidate.points === 'number' &&
    typeof candidate.lifetimePoints === 'number' &&
    Array.isArray(candidate.rewardedTaskIds) &&
    typeof candidate.penaltiesByDate === 'object' &&
    candidate.penaltiesByDate !== null
  );
}

export async function loadPetState(): Promise<PetState | null> {
  const stored = await AsyncStorage.getItem(PET_STORAGE_KEY);
  if (stored === null) return null;

  const parsed: unknown = JSON.parse(stored);
  return isValidPetState(parsed) ? parsed : null;
}

/** Writes are queued so rapid rewards/penalties can't land out of order. */
export function savePetState(state: PetState): Promise<void> {
  const operation = writeQueue.then(() =>
    AsyncStorage.setItem(PET_STORAGE_KEY, JSON.stringify(state)),
  );

  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}
