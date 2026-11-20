import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Glow } from '@/components/ui/glow';
import { AppColors, Radii } from '@/constants/theme';

import { useTasks } from '@/features/tasks/task-provider';

function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, isLoading } = useTasks();
  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
      return {
        key: getDayKey(date),
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        count: 0,
        isToday: index === 6,
      };
    });
    const dateIndex = new Map(dates.map((day, index) => [day.key, index]));

    completedTasks.forEach((task) => {
      const completionTime = task.completedAt ?? task.updatedAt;
      const completedDate = new Date(completionTime);
      if (Number.isNaN(completedDate.getTime())) return;
      const index = dateIndex.get(getDayKey(completedDate));
      if (index !== undefined) dates[index].count += 1;
    });

    return dates;
  }, [completedTasks]);

  const streak = useMemo(() => {
    const days = new Set(
      completedTasks.map((task) => getDayKey(new Date(task.completedAt ?? task.updatedAt))),
    );
    const cursor = new Date();

    // A streak can start yesterday if today has no completions yet.
    if (!days.has(getDayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let count = 0;
    while (days.has(getDayKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }, [completedTasks]);

  const maxDayCount = Math.max(1, ...weeklyProgress.map((day) => day.count));
  const weekTotal = weeklyProgress.reduce((total, day) => total + day.count, 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <Glow size={380} color={AppColors.violet} opacity={0.16} style={{ top: -190, left: -140 }} />
      <Glow size={280} color={AppColors.peach} opacity={0.09} style={{ top: 260, right: -160 }} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}>
        <Eyebrow label="YOUR ACTIVITY" icon="pulse-outline" />
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>A look at how far you’ve come.</Text>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={AppColors.peach} />
          </View>
        ) : (
          <>
            <Card style={styles.overviewCard}>
              <LinearGradient
                colors={['rgba(124, 58, 237, 0.3)', 'rgba(21, 21, 29, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.overviewTop}>
                <View>
                  <Text style={styles.cardEyebrow}>ALL TIME</Text>
                  <Text style={styles.overviewTitle}>Task completion</Text>
                </View>
                <Text style={styles.percent}>{completionRate}%</Text>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`${completionRate}% of tasks completed`}
                accessibilityValue={{ min: 0, max: 100, now: completionRate }}
                style={styles.progressTrack}
              >
                <LinearGradient
                  colors={[AppColors.peach, AppColors.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.max(3, completionRate)}%` }]}
                />
              </View>
              <View style={styles.overviewFooter}>
                <Text style={styles.overviewCaption}>
                  {completedTasks.length} of {tasks.length} tasks completed
                </Text>
                <View style={styles.streakChip}>
                  <Ionicons name="flame" size={12} color={AppColors.amber} />
                  <Text style={styles.streakText}>
                    {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
                  </Text>
                </View>
              </View>
            </Card>

            <Card style={styles.chartCard}>
              <View style={styles.chartHeading}>
                <View>
                  <Text style={styles.cardEyebrow}>LAST 7 DAYS</Text>
                  <Text style={styles.chartTitle}>Completed tasks</Text>
                </View>
                <View style={styles.weekTotalChip}>
                  <Text style={styles.weekTotal}>{weekTotal}</Text>
                  <Text style={styles.weekTotalLabel}>done</Text>
                </View>
              </View>

              {tasks.length === 0 ? (
                <Text style={styles.emptyCopy}>Your chart will grow as you complete tasks.</Text>
              ) : (
                <View style={styles.chart}>
                  <View pointerEvents="none" style={[styles.gridline, styles.gridlineTop]} />
                  <View pointerEvents="none" style={[styles.gridline, styles.gridlineMiddle]} />
                  <View pointerEvents="none" style={[styles.gridline, styles.gridlineBottom]} />
                  {weeklyProgress.map((day) => (
                    <View key={day.key} style={styles.barColumn}>
                      <Text style={[styles.barValue, day.isToday && styles.barValueToday]}>
                        {day.count || ''}
                      </Text>
                      <View style={styles.barTrack}>
                        {day.count > 0 ? (
                          <LinearGradient
                            colors={[AppColors.peach, AppColors.purple]}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                            style={[styles.bar, { height: `${Math.max(8, (day.count / maxDayCount) * 100)}%` }]}
                          />
                        ) : (
                          <View style={[styles.bar, styles.emptyBar, { height: 5 }]} />
                        )}
                      </View>
                      <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
                        {day.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <View style={[styles.statIcon, styles.statIconViolet]}>
                  <Ionicons name="layers-outline" size={16} color={AppColors.violet} />
                </View>
                <Text style={styles.statValue}>{tasks.length}</Text>
                <Text style={styles.statLabel}>Total tasks</Text>
              </Card>
              <Card style={styles.statCard}>
                <View style={[styles.statIcon, styles.statIconPeach]}>
                  <Ionicons name="hourglass-outline" size={16} color={AppColors.peach} />
                </View>
                <Text style={styles.statValue}>{tasks.length - completedTasks.length}</Text>
                <Text style={styles.statLabel}>Still to do</Text>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background, overflow: 'hidden' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 22 },
  title: { color: AppColors.text, fontSize: 36, lineHeight: 44, fontWeight: '800', letterSpacing: -1, marginTop: 14 },
  subtitle: { color: AppColors.textMuted, fontSize: 15, lineHeight: 21, marginTop: 4 },
  loading: { minHeight: 260, alignItems: 'center', justifyContent: 'center' },

  overviewCard: { padding: 20, marginTop: 26, overflow: 'hidden' },
  overviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardEyebrow: { color: AppColors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  overviewTitle: { color: AppColors.text, fontSize: 16, fontWeight: '700', marginTop: 8 },
  percent: { color: AppColors.text, fontSize: 38, fontWeight: '800', letterSpacing: -1.5 },
  progressTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginTop: 22,
  },
  progressFill: { height: '100%', borderRadius: 8 },
  overviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  overviewCaption: { flex: 1, color: AppColors.textMuted, fontSize: 13 },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 196, 107, 0.1)',
  },
  streakText: { color: AppColors.amber, fontSize: 11, fontWeight: '700' },

  chartCard: { minHeight: 284, padding: 20, marginTop: 14 },
  chartHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { color: AppColors.text, fontSize: 17, fontWeight: '700', marginTop: 8 },
  weekTotalChip: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  weekTotal: { color: AppColors.text, fontSize: 28, fontWeight: '800' },
  weekTotalLabel: { color: AppColors.textMuted, fontSize: 11, fontWeight: '700' },
  chart: {
    height: 178,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18,
  },
  gridline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  gridlineTop: { top: 19 },
  gridlineMiddle: { top: 88 },
  gridlineBottom: { top: 157 },
  barColumn: { flex: 1, alignItems: 'center' },
  barValue: { height: 18, color: AppColors.textMuted, fontSize: 11, fontWeight: '700' },
  barValueToday: { color: AppColors.peach },
  barTrack: { width: '100%', flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '58%', minHeight: 4, borderRadius: 8 },
  emptyBar: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  dayLabel: { color: AppColors.textDim, fontSize: 11, marginTop: 8 },
  dayLabelToday: { color: AppColors.peach, fontWeight: '800' },
  emptyCopy: { color: AppColors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 32 },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statCard: { minHeight: 108, flex: 1, justifyContent: 'flex-end', padding: 18 },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'auto',
  },
  statIconViolet: { backgroundColor: 'rgba(185, 162, 255, 0.12)' },
  statIconPeach: { backgroundColor: 'rgba(255, 214, 165, 0.1)' },
  statValue: { color: AppColors.text, fontSize: 26, fontWeight: '800' },
  statLabel: { color: AppColors.textMuted, fontSize: 13, marginTop: 5 },
});
