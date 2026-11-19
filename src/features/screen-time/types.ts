export type SocialAppUsage = {
  packageName: string;
  /** Friendly name, e.g. "Instagram". */
  appName: string;
  minutes: number;
};

export type ScreenTimeStatus =
  /** No usage-access bridge in this build (Expo Go, iOS, web). */
  | 'unsupported'
  /** The bridge exists but Android's "Usage access" toggle is off. */
  | 'permission-required'
  /** Reading real usage data. */
  | 'ready';

export type ScreenTimeSnapshot = {
  status: ScreenTimeStatus;
  /** Local calendar day the numbers belong to (YYYY-MM-DD). */
  date: string;
  /** Minutes spent in social apps today. */
  totalMinutes: number;
  apps: SocialAppUsage[];
  updatedAt: string | null;
};

export type ScreenTimeDay = {
  date: string;
  totalMinutes: number;
  apps: SocialAppUsage[];
};
