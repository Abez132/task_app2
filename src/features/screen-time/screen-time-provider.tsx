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
import { AppState } from 'react-native';

import {
  hasUsageAccess,
  openUsageAccessSettings,
  readTodaySocialUsage,
  usageTrackingSupported,
} from './native-usage';
import { loadScreenTimeHistory, saveScreenTimeHistory, todayKey, upsertDay } from './storage';
import type { ScreenTimeDay, ScreenTimeSnapshot } from './types';

/** Android's usage database is cheap to query; once a minute is plenty. */
const POLL_INTERVAL_MS = 60_000;

function createInitialSnapshot(): ScreenTimeSnapshot {
  return {
    status: usageTrackingSupported ? 'permission-required' : 'unsupported',
    date: todayKey(),
    totalMinutes: 0,
    apps: [],
    updatedAt: null,
  };
}

type ScreenTimeContextValue = {
  snapshot: ScreenTimeSnapshot;
  history: ScreenTimeDay[];
  isRefreshing: boolean;
  error: string | null;
  /** False in Expo Go, on iOS and on web. */
  supported: boolean;
  refresh: () => Promise<void>;
  /** Opens Android's "Usage access" settings for this app. */
  requestAccess: () => Promise<void>;
};

const ScreenTimeContext = createContext<ScreenTimeContextValue | null>(null);

export function ScreenTimeProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<ScreenTimeSnapshot>(createInitialSnapshot);
  const [history, setHistory] = useState<ScreenTimeDay[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<ScreenTimeDay[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const stored = await loadScreenTimeHistory();
        if (cancelled) return;
        historyRef.current = stored;
        setHistory(stored);
      } catch {
        // A corrupt history only costs the chart, never the live tracking.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!usageTrackingSupported) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const granted = await hasUsageAccess();
      const now = new Date();
      const date = todayKey(now);

      if (!granted) {
        setSnapshot({
          status: 'permission-required',
          date,
          totalMinutes: 0,
          apps: [],
          updatedAt: now.toISOString(),
        });
        return;
      }

      const apps = await readTodaySocialUsage();
      const totalMinutes = apps.reduce((sum, app) => sum + app.minutes, 0);

      setSnapshot({
        status: 'ready',
        date,
        totalMinutes,
        apps,
        updatedAt: now.toISOString(),
      });

      const nextHistory = upsertDay(historyRef.current, { date, totalMinutes, apps });
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      void saveScreenTimeHistory(nextHistory);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : 'Could not read screen time.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, POLL_INTERVAL_MS);

    // Coming back from the settings screen (or from a social app) refreshes
    // immediately, so a newly granted permission starts working right away.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]);

  const requestAccess = useCallback(async () => {
    await openUsageAccessSettings();
  }, []);

  const value = useMemo(
    () => ({
      snapshot,
      history,
      isRefreshing,
      error,
      supported: usageTrackingSupported,
      refresh,
      requestAccess,
    }),
    [snapshot, history, isRefreshing, error, refresh, requestAccess],
  );

  return <ScreenTimeContext.Provider value={value}>{children}</ScreenTimeContext.Provider>;
}

export function useScreenTime(): ScreenTimeContextValue {
  const context = useContext(ScreenTimeContext);
  if (context === null) {
    throw new Error('useScreenTime must be used within a ScreenTimeProvider.');
  }

  return context;
}
