import { requireOptionalNativeModule } from 'expo';

export type UsageEntry = {
  packageName: string;
  appName: string;
  totalTimeMs: number;
  lastTimeUsed: number;
};

export type PetUsageStatsModule = {
  /** Whether the user granted "Usage access" in Android settings. */
  hasUsageAccess(): Promise<boolean>;
  /** Foreground time per app between the two timestamps (milliseconds). */
  getUsage(startTime: number, endTime: number): Promise<UsageEntry[]>;
  /** Open the system screen that lets the user grant usage access. */
  openUsageAccessSettings(): Promise<boolean>;
};

/**
 * Only present on Android development/production builds. Returns `null` in
 * Expo Go, on iOS and on web, where the app falls back to a friendly notice.
 */
export default requireOptionalNativeModule<PetUsageStatsModule>('PetUsageStats');
