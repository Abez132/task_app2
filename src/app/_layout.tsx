import { DarkTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { useNotifications } from "@/features/notifications/use-notifications";
import { PetProvider } from "@/features/pet/pet-provider";
import { ScreenTimeProvider } from "@/features/screen-time/screen-time-provider";
import { TaskProvider } from "@/features/tasks/task-provider";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  // Request notification permission, create the Android channel, and listen
  // for taps on due-date reminders (navigates back to the task list).
  useNotifications();

  return (
    <ThemeProvider value={DarkTheme}>
      <TaskProvider>
        <ScreenTimeProvider>
          <PetProvider>
            <AnimatedSplashOverlay />
            <AppTabs />
          </PetProvider>
        </ScreenTimeProvider>
      </TaskProvider>
    </ThemeProvider>
  );
}
