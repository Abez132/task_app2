import { Platform } from 'react-native';

import PetUsageStats from '../../../modules/pet-usage-stats';

import { socialAppName } from './social-apps';
import type { SocialAppUsage } from './types';

/**
 * The native bridge only ships in Android development/production builds.
 * Expo Go, iOS and web get `null`, which the UI explains instead of pretending
 * to have data.
 */
export const usageTrackingSupported = Platform.OS === 'android' && PetUsageStats !== null;

export async function hasUsageAccess(): Promise<boolean> {
  if (!PetUsageStats) return false;

  try {
    return await PetUsageStats.hasUsageAccess();
  } catch {
    return false;
  }
}

/** Social app usage since local midnight, biggest first. */
export async function readTodaySocialUsage(): Promise<SocialAppUsage[]> {
  if (!PetUsageStats) return [];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const entries = await PetUsageStats.getUsage(startOfDay.getTime(), Date.now());

  return entries
    .flatMap((entry): SocialAppUsage[] => {
      const socialName = socialAppName(entry.packageName, entry.appName);
      const minutes = Math.round(entry.totalTimeMs / 60_000);

      if (!socialName || minutes < 1) return [];

      return [{ packageName: entry.packageName, appName: socialName, minutes }];
    })
    .sort((a, b) => b.minutes - a.minutes);
}

export async function openUsageAccessSettings(): Promise<void> {
  if (!PetUsageStats) return;
  await PetUsageStats.openUsageAccessSettings();
}
