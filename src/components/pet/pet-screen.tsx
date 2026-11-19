import { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@/constants/theme';
import { usePet } from '@/features/pet/pet-provider';
import { MAX_PET_LEVEL, PET_NAME } from '@/features/pet/pets';
import { buildSuggestions } from '@/features/pet/suggestions';
import type { PetEvent } from '@/features/pet/types';
import {
  DAILY_SOCIAL_LIMIT_MINUTES,
  MINUTES_PER_POINT_LOST,
  POINTS_PER_TASK,
  overageMinutes,
} from '@/features/screen-time/limits';
import { useScreenTime } from '@/features/screen-time/screen-time-provider';
import { useTasks } from '@/features/tasks/task-provider';

import { PetAvatar } from './pet-avatar';

function eventCopy(event: PetEvent): string {
  switch (event.type) {
    case 'reward':
      return `${PET_NAME} gained +${event.points} points from “${event.taskTitle}”.`;
    case 'penalty':
      return `${PET_NAME} lost ${event.points} point${event.points === 1 ? '' : 's'} — ${event.minutesOver} min over the social media limit.`;
    case 'level-up':
      return `${PET_NAME} reached level ${event.level}.`;
    case 'level-down':
      return `${PET_NAME} dropped to level ${event.level}. Finish a task to climb back.`;
  }
}

function eventIcon(event: PetEvent): string {
  switch (event.type) {
    case 'reward':
      return '✨';
    case 'penalty':
      return '💔';
    case 'level-up':
      return '🎉';
    case 'level-down':
      return '💧';
  }
}

export function PetScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useTasks();
  const { snapshot, isRefreshing, error, supported, refresh, requestAccess } = useScreenTime();
  const { points, level, nextLevel, progress, isLoading, lastEvent, dismissEvent, isOverLimit } =
    usePet();

  const openTasks = useMemo(
    () => tasks.filter((task) => !task.completed).map((task) => task.title),
    [tasks],
  );

  const suggestions = useMemo(
    () =>
      buildSuggestions({
        totalMinutes: snapshot.totalMinutes,
        openTasks,
        date: snapshot.date,
      }),
    [snapshot.totalMinutes, snapshot.date, openTasks],
  );

  const over = overageMinutes(snapshot.totalMinutes);
  const usageRatio = Math.min(1, snapshot.totalMinutes / DAILY_SOCIAL_LIMIT_MINUTES);
  const topApps = snapshot.apps.slice(0, 4);
  const maxAppMinutes = Math.max(1, ...topApps.map((app) => app.minutes));

  const mood = isOverLimit
    ? `${PET_NAME} is feeling neglected — ${over} min over today's limit.`
    : points === 0
      ? `Finish a task to wake ${PET_NAME} up.`
      : `${PET_NAME} is keeping pace with you.`;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor="#F4F4F5"
          />
        }
      >
        <Text style={styles.eyebrow}>YOUR COMPANION</Text>
        <Text style={styles.title}>{PET_NAME}</Text>
        <Text style={styles.subtitle}>
          {level.title} · Level {level.level} of {MAX_PET_LEVEL}
        </Text>

        {lastEvent && (
          <Pressable
            onPress={dismissEvent}
            accessibilityRole="button"
            accessibilityLabel="Dismiss update"
            style={({ pressed }) => [styles.eventBanner, pressed && styles.pressed]}
          >
            <Text style={styles.eventIcon}>{eventIcon(lastEvent)}</Text>
            <Text style={styles.eventText}>{eventCopy(lastEvent)}</Text>
            <Text style={styles.eventClose}>✕</Text>
          </Pressable>
        )}

        <View style={styles.petCard}>
          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={AppColors.peach} />
            </View>
          ) : (
            <>
              <PetAvatar level={level} />
              <View style={styles.pointsRow}>
                <Text style={styles.points}>{points}</Text>
                <Text style={styles.pointsLabel}>points</Text>
              </View>
              <Text style={styles.mood}>{mood}</Text>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`Progress to the next level`}
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress.ratio * 100) }}
                style={styles.progressTrack}
              >
                <View style={[styles.progressFill, { width: `${Math.round(progress.ratio * 100)}%` }]} />
              </View>
              <Text style={styles.progressCaption}>
                {nextLevel
                  ? `${progress.pointsNeeded} points to Level ${nextLevel.level} · ${nextLevel.title}`
                  : 'Max level reached — keep the balance.'}
              </Text>
              <Text style={styles.hint}>
                +{POINTS_PER_TASK.low}–{POINTS_PER_TASK.high} points per task · −1 point per{' '}
                {MINUTES_PER_POINT_LOST} min over the limit
              </Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.cardHeadingCopy}>
              <Text style={styles.cardEyebrow}>SOCIAL MEDIA TODAY</Text>
              <Text style={styles.cardTitle}>
                {snapshot.status === 'ready' ? `${snapshot.totalMinutes} min` : 'Not connected'}
              </Text>
            </View>
            <Text style={[styles.cardValue, isOverLimit && styles.overValue]}>
              {snapshot.status === 'ready' ? (isOverLimit ? `+${over} min` : 'on track') : '—'}
            </Text>
          </View>

          <View style={styles.usageTrack}>
            <View
              style={[
                styles.usageFill,
                { width: `${Math.max(snapshot.status === 'ready' ? 2 : 0, usageRatio * 100)}%` },
                isOverLimit && styles.usageFillOver,
              ]}
            />
          </View>
          <View style={styles.usageLabels}>
            <Text style={styles.usageLabel}>
              {snapshot.status === 'ready'
                ? isOverLimit
                  ? `${over} min over`
                  : `${Math.max(0, DAILY_SOCIAL_LIMIT_MINUTES - snapshot.totalMinutes)} min left`
                : 'Tracking off'}
            </Text>
            <Text style={styles.usageLabel}>Free limit {DAILY_SOCIAL_LIMIT_MINUTES} min</Text>
          </View>

          {snapshot.status === 'ready' &&
            topApps.map((app) => (
              <View key={app.packageName} style={styles.appRow}>
                <Text numberOfLines={1} style={styles.appName}>
                  {app.appName}
                </Text>
                <View style={styles.appBarTrack}>
                  <View
                    style={[
                      styles.appBar,
                      { width: `${Math.max(6, (app.minutes / maxAppMinutes) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.appMinutes}>{app.minutes} min</Text>
              </View>
            ))}

          {snapshot.status === 'ready' && topApps.length === 0 && (
            <Text style={styles.emptyCopy}>
              No social media use today. {PET_NAME} is proud of you.
            </Text>
          )}

          {snapshot.status === 'unsupported' && (
            <Text style={styles.noticeText}>
              {Platform.OS === 'ios'
                ? 'iOS only exposes screen time through Apple’s Family Controls entitlement, so automatic tracking is Android-only for now.'
                : 'Automatic tracking needs a development build with the usage-access module — Expo Go cannot read app usage.'}
            </Text>
          )}

          {snapshot.status === 'permission-required' && (
            <>
              <Text style={styles.noticeText}>
                Allow “Usage access” so {PET_NAME} can see social media time. Nothing is read until
                you turn it on.
              </Text>
              <Pressable
                onPress={() => void requestAccess()}
                accessibilityRole="button"
                accessibilityLabel="Open usage access settings"
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Enable usage access</Text>
              </Pressable>
            </>
          )}

          {snapshot.status === 'ready' && (
            <Pressable
              onPress={() => void refresh()}
              disabled={isRefreshing}
              accessibilityRole="button"
              accessibilityLabel="Refresh screen time"
              style={({ pressed }) => [
                styles.secondaryButton,
                isRefreshing && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                {isRefreshing ? 'Reading…' : 'Refresh now'}
              </Text>
            </Pressable>
          )}

          {supported && error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>THINGS YOU COULD HAVE DONE</Text>
          <Text style={styles.cardTitle}>
            {over > 0 ? `${over} minutes went to social apps` : 'Ideas for your next break'}
          </Text>
          <Text style={styles.cardCaption}>
            {over > 0
              ? 'Same time, different choice:'
              : 'Your balance looks healthy. Here is what that time could become:'}
          </Text>

          {suggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionRow}>
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <View style={styles.suggestionCopy}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionDetail}>{suggestion.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0C0C10' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 22 },
  eyebrow: { color: '#92929D', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: '#F7F7F8', fontSize: 34, lineHeight: 42, fontWeight: '800', marginTop: 10 },
  subtitle: { color: '#96969F', fontSize: 15, lineHeight: 21, marginTop: 4 },

  eventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#2A2233',
    borderWidth: 1,
    borderColor: '#3D3348',
  },
  eventIcon: { fontSize: 18 },
  eventText: { flex: 1, color: '#E8DFF5', fontSize: 13, lineHeight: 19 },
  eventClose: { color: '#8E8798', fontSize: 14, fontWeight: '700' },

  petCard: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
    marginTop: 20,
    borderRadius: 26,
    backgroundColor: '#242429',
    borderWidth: 1,
    borderColor: '#303036',
  },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 22 },
  points: { color: '#F7F7F8', fontSize: 38, fontWeight: '800' },
  pointsLabel: { color: '#92929D', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  mood: {
    color: '#C9C9D1',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  progressTrack: {
    height: 9,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#3A3A42',
    marginTop: 20,
  },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: AppColors.peach },
  progressCaption: { color: '#A0A0AA', fontSize: 12, marginTop: 10, textAlign: 'center' },
  hint: { color: '#7C7C86', fontSize: 11, marginTop: 12, textAlign: 'center' },

  card: {
    padding: 20,
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: '#242429',
    borderWidth: 1,
    borderColor: '#303036',
  },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  cardHeadingCopy: { flex: 1 },
  cardEyebrow: { color: '#92929D', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  cardTitle: { color: '#F3F3F5', fontSize: 18, fontWeight: '700', marginTop: 8 },
  cardValue: { color: '#B8E4C7', fontSize: 15, fontWeight: '700' },
  overValue: { color: '#F3B5B5' },
  cardCaption: { color: '#96969F', fontSize: 13, lineHeight: 19, marginTop: 6 },

  usageTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#3A3A42',
    marginTop: 20,
  },
  usageFill: { height: '100%', borderRadius: 8, backgroundColor: '#7BD8A2' },
  usageFillOver: { backgroundColor: '#FF8E8E' },
  usageLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  usageLabel: { color: '#92929D', fontSize: 11 },

  appRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  appName: { width: 92, color: '#DDDDE3', fontSize: 12, fontWeight: '600' },
  appBarTrack: { flex: 1, height: 6, borderRadius: 4, backgroundColor: '#33333A' },
  appBar: { height: '100%', borderRadius: 4, backgroundColor: AppColors.purple },
  appMinutes: { width: 52, color: '#92929D', fontSize: 11, textAlign: 'right' },

  emptyCopy: { color: '#92929D', fontSize: 13, lineHeight: 19, marginTop: 16 },
  noticeText: { color: '#A0A0AA', fontSize: 13, lineHeight: 20, marginTop: 16 },
  errorText: { color: '#FFB4AA', fontSize: 12, marginTop: 12 },

  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderRadius: 15,
    backgroundColor: AppColors.purple,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3D3D46',
    backgroundColor: '#1D1D22',
  },
  secondaryButtonText: { color: '#D9D9DF', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.55 },

  suggestionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  suggestionIcon: { fontSize: 20, lineHeight: 26, width: 26, textAlign: 'center' },
  suggestionCopy: { flex: 1 },
  suggestionTitle: { color: '#F1F1F3', fontSize: 14, fontWeight: '700' },
  suggestionDetail: { color: '#92929D', fontSize: 12, lineHeight: 18, marginTop: 3 },

  pressed: { opacity: 0.74 },
});
