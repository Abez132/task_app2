import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { AppColors, MaxContentWidth, Spacing } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Tasks: { active: 'list', inactive: 'list-outline' },
  Done: { active: 'checkmark-done', inactive: 'checkmark-done-outline' },
  Progress: { active: 'stats-chart', inactive: 'stats-chart-outline' },
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Tasks</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Done</TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabButton>Progress</TabButton>
          </TabTrigger>
          <TabTrigger name="pet" href="/pet" asChild>
            <TabButton>Pet</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: Omit<TabTriggerSlotProps, 'ref'>) {
  const label = typeof children === 'string' ? children : 'Tasks';
  const icons = TAB_ICONS[label];
  const isPet = label === 'Pet';

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonViewFocused]}>
        {isPet ? (
          <Text style={styles.petEmoji}>🐾</Text>
        ) : (
          <Ionicons
            name={isFocused ? icons.active : icons.inactive}
            size={20}
            color={isFocused ? AppColors.peach : AppColors.textDim}
          />
        )}
        {isFocused && <Text style={styles.tabLabel}>{label}</Text>}
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <LinearGradient
        colors={['rgba(32, 32, 44, 0.98)', 'rgba(14, 14, 21, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.innerContainer}
      >
        {props.children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 12,
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    minWidth: 62,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  tabButtonViewFocused: {
    backgroundColor: 'rgba(255, 214, 165, 0.13)',
  },
  petEmoji: { fontSize: 18, lineHeight: 22 },
  tabLabel: { color: AppColors.peach, fontSize: 12, fontWeight: '700' },
});
