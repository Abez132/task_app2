import { DarkTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import AppTabs from "@/components/app-tabs";
import { useNotifications } from "@/features/notifications/use-notifications";
import { PetProvider } from "@/features/pet/pet-provider";
import { ScreenTimeProvider } from "@/features/screen-time/screen-time-provider";
import { TaskProvider } from "@/features/tasks/task-provider";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 250, fade: true });

export default function TabLayout() {
  // Request notification permission, create the Android channel, and listen
  // for taps on due-date reminders (navigates back to the task list).
  useNotifications();

  // The native splash stays up until the app has mounted, then fades straight
  // into the task list — there is no second, in-app splash.
  useEffect(() => {
    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.error("Unable to hide the native splash screen.", error);
    });
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <TaskProvider>
        <ScreenTimeProvider>
          <PetProvider>
            <AppTabs />
          </PetProvider>
        </ScreenTimeProvider>
      </TaskProvider>
    </ThemeProvider>
  );
}
