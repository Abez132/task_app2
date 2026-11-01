import { useEffect } from 'react';
import { addNotificationResponseReceivedListener } from 'expo-notifications';
import { router } from 'expo-router';

import { configureNotificationsHandler, setupNotifications } from './notifications';

/**
 * Set up due-date notifications for the app. Mount this once near the root of
 * the app (inside the Router context). It:
 *  - configures foreground presentation,
 *  - requests permission + creates the Android channel,
 *  - navigates to the task list when a user taps a due-date reminder.
 */
export function useNotifications(): void {
  useEffect(() => {
    configureNotificationsHandler();
    void setupNotifications();

    const subscription = addNotificationResponseReceivedListener((response) => {
      const taskId = response.notification.request.content.data?.taskId;
      if (typeof taskId === 'string') {
        // The reminder points back to the task list (the app's home route).
        router.push('/');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
