import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors, Radii } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type TabIconProps = {
  focused: boolean;
  color: ColorValue;
  active: IoniconName;
  inactive: IoniconName;
};

function TabIcon({ focused, color, active, inactive }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? active : inactive}
        size={20}
        color={typeof color === 'string' ? color : AppColors.textDim}
      />
    </View>
  );
}

function TabLabel({
  focused,
  color,
  label,
}: {
  focused: boolean;
  color: ColorValue;
  label: string;
}) {
  if (!focused) return null;
  return <Text style={[styles.label, { color }]}>{label}</Text>;
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        sceneStyle: { backgroundColor: AppColors.background },
        tabBarBackground: () => (
          <LinearGradient
            colors={['rgba(32, 32, 44, 0.98)', 'rgba(14, 14, 21, 0.98)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.barBackground}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12),
          height: 68,
          paddingTop: 7,
          paddingBottom: 7,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarActiveTintColor: AppColors.peach,
        tabBarInactiveTintColor: AppColors.textDim,
        tabBarItemStyle: { borderRadius: Radii.lg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} active="list" inactive="list-outline" />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel focused={focused} color={color} label="Tasks" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Done',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              active="checkmark-done"
              inactive="checkmark-done-outline"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel focused={focused} color={color} label="Done" />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              active="stats-chart"
              inactive="stats-chart-outline"
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel focused={focused} color={color} label="Progress" />
          ),
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          title: 'Pet',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Text style={styles.petEmoji}>🐾</Text>
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <TabLabel focused={focused} color={color} label="Pet" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barBackground: {
    flex: 1,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 214, 165, 0.13)',
  },
  petEmoji: { fontSize: 18, lineHeight: 22 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2, marginTop: 2 },
});
