import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ScreenTimeDay } from './types';

const SCREEN_TIME_STORAGE_KEY = '@task-manager/screen-time-v1';
const HISTORY_LENGTH = 14;

export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function upsertDay(days: ScreenTimeDay[], day: ScreenTimeDay): ScreenTimeDay[] {
  return [...days.filter((entry) => entry.date !== day.date), day]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-HISTORY_LENGTH);
}

export async function loadScreenTimeHistory(): Promise<ScreenTimeDay[]> {
  const stored = await AsyncStorage.getItem(SCREEN_TIME_STORAGE_KEY);
  if (stored === null) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved screen time has an invalid format.');
  }

  return parsed as ScreenTimeDay[];
}

export async function saveScreenTimeHistory(days: ScreenTimeDay[]): Promise<void> {
  await AsyncStorage.setItem(SCREEN_TIME_STORAGE_KEY, JSON.stringify(days));
}
