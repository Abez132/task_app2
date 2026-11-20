import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Glow } from '@/components/ui/glow';
import { AppColors, Radii, Shadows } from '@/constants/theme';
import { usePet } from '@/features/pet/pet-provider';
import { MAX_PET_LEVEL, PET_LEVELS, petForLevel } from '@/features/pet/pets';
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

function eventCopy(event: PetEvent, currentName: string): string {
  switch (event.type) {
    case 'reward':
      return `${currentName} gained +${event.points} points from “${event.taskTitle}”.`;
    case 'penalty':
      return `${currentName} lost ${event.points} point${event.points === 1 ? '' : 's'} — ${event.minutesOver} min over the social media limit.`;
    case 'level-up':
      return `Evolved! ${petForLevel(event.level).name} joined you at level ${event.level}.`;
    case 'level-down':
      return `Back to ${petForLevel(event.level).name} at level ${event.level}. Finish a task to evolve again.`;
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
    ? `${level.name} is feeling neglected — ${over} min over today's limit.`
    : points === 0
      ? `Finish a task to wake ${level.name} up.`
      : level.blurb;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <Glow
        size={400}
        color={level.colors.accent}
        opacity={0.16}
        style={{ top: -200, right: -160 }}
      />
      <Glow size={300} color={AppColors.purple} opacity={0.14} style={{ top: 220, left: -170 }} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor={AppColors.peach}
          />
        }
      >
        <Eyebrow label="YOUR COMPANION" icon="paw-outline" />
        <Text style={styles.title}>{level.name}</Text>
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
            <Text style={styles.eventText}>{eventCopy(lastEvent, level.name)}</Text>
            <Ionicons name="close" size={16} color={AppColors.textMuted} />
          </Pressable>
        )}

        <View style={styles.petCard}>
          <LinearGradient
            colors={[level.colors.glow, 'rgba(21, 21, 29, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
                accessibilityLabel="Progress to the next level"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(progress.ratio * 100) }}
                style={styles.progressTrack}
              >
                <LinearGradient
                  colors={[level.colors.accent, AppColors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(2, Math.round(progress.ratio * 100))}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressCaption}>
                {nextLevel
                  ? `${progress.pointsNeeded} points to ${nextLevel.name} · ${nextLevel.title}`
                  : 'Max level reached — keep the balance.'}
              </Text>
              <View style={styles.hintRow}>
                <View style={styles.hintChip}>
                  <Ionicons name="add-circle-outline" size={12} color={AppColors.green} />
                  <Text style={styles.hintText}>
                    +{POINTS_PER_TASK.low}–{POINTS_PER_TASK.high} per task
                  </Text>
                </View>
                <View style={styles.hintChip}>
                  <Ionicons name="remove-circle-outline" size={12} color={AppColors.red} />
                  <Text style={styles.hintText}>
                    1 per {MINUTES_PER_POINT_LOST} min over
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, styles.cardIconViolet]}>
              <Ionicons name="git-branch-outline" size={16} color={AppColors.violet} />
            </View>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.cardEyebrow}>EVOLUTION LINE</Text>
              <Text style={styles.cardTitle}>A new companion every level</Text>
            </View>
          </View>
          <Text style={styles.cardCaption}>
            Finish tasks to evolve. Too much social time can send you back a form.
          </Text>
          <View style={styles.collectionRow}>
            {PET_LEVELS.map((form) => {
              const unlocked = points >= form.minPoints;
              const isCurrent = form.level === level.level;

              return (
                <View
                  key={form.level}
                  style={[
                    styles.collectionItem,
                    isCurrent && {
                      backgroundColor: form.colors.glow,
                      borderColor: form.colors.accent,
                    },
                  ]}
                >
                  <Text style={[styles.collectionEmoji, !unlocked && styles.collectionLocked]}>
                    {unlocked ? form.emoji : '🔒'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.collectionName,
                      isCurrent && { color: AppColors.text },
                      !unlocked && styles.collectionLocked,
                    ]}
                  >
                    {form.name}
                  </Text>
                  <Text style={styles.collectionLevel}>LV {form.level}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, styles.cardIconPeach]}>
              <Ionicons name="phone-portrait-outline" size={16} color={AppColors.peach} />
            </View>
            <View style={styles.cardHeaderCopy}>
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
            <LinearGradient
              colors={
                isOverLimit
                  ? [AppColors.amber, AppColors.red]
                  : [AppColors.green, AppColors.violet]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.usageFill,
                { width: `${Math.max(snapshot.status === 'ready' ? 2 : 0, usageRatio * 100)}%` },
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
                  <LinearGradient
                    colors={[AppColors.purple, AppColors.violet]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
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
              No social media use today. {level.name} is proud of you.
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
                Allow “Usage access” so {level.name} can see social media time. Nothing is read
                until you turn it on.
              </Text>
              <Pressable
                onPress={() => void requestAccess()}
                accessibilityRole="button"
                accessibilityLabel="Open usage access settings"
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={['#FFE7C7', '#FFB98A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonFill}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color="#251627" />
                  <Text style={styles.primaryButtonText}>Enable usage access</Text>
                </LinearGradient>
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
              <Ionicons name="refresh" size={15} color={AppColors.textMuted} />
              <Text style={styles.secondaryButtonText}>
                {isRefreshing ? 'Reading…' : 'Refresh now'}
              </Text>
            </Pressable>
          )}

          {supported && error && <Text style={styles.errorText}>{error}</Text>}
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, styles.cardIconGreen]}>
              <Ionicons name="bulb-outline" size={16} color={AppColors.green} />
            </View>
            <View style={styles.cardHeaderCopy}>
              <Text style={styles.cardEyebrow}>THINGS YOU COULD HAVE DONE</Text>
              <Text style={styles.cardTitle}>
                {over > 0 ? `${over} minutes went to social apps` : 'Ideas for your next break'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardCaption}>
            {over > 0
              ? 'Same time, different choice:'
              : 'Your balance looks healthy. Here is what that time could become:'}
          </Text>

          {suggestions.map((suggestion) => (
            <View key={suggestion.id} style={styles.suggestionRow}>
              <View style={styles.suggestionIcon}>
                <Text style={styles.suggestionEmoji}>{suggestion.icon}</Text>
              </View>
              <View style={styles.suggestionCopy}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionDetail}>{suggestion.detail}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background, overflow: 'hidden' },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  title: {
    color: AppColors.text,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 14,
  },
  subtitle: { color: AppColors.textMuted, fontSize: 15, lineHeight: 21, marginTop: 4 },

  eventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginTop: 18,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(185, 162, 255, 0.24)',
  },
  eventIcon: { fontSize: 18 },
  eventText: { flex: 1, color: '#E8DFF5', fontSize: 13, lineHeight: 19 },

  petCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 20,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Shadows.card,
  },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 22 },
  points: { color: AppColors.text, fontSize: 42, fontWeight: '800', letterSpacing: -1.5 },
  pointsLabel: { color: AppColors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  mood: {
    color: '#C9C9D6',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  progressTrack: {
    height: 10,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginTop: 22,
  },
  progressFill: { height: '100%', borderRadius: 8 },
  progressCaption: {
    color: AppColors.textMuted,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  hintRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hintText: { color: AppColors.textMuted, fontSize: 11, fontWeight: '600' },

  card: { padding: 20, marginTop: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardHeaderCopy: { flex: 1 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconViolet: { backgroundColor: 'rgba(185, 162, 255, 0.12)' },
  cardIconPeach: { backgroundColor: 'rgba(255, 214, 165, 0.1)' },
  cardIconGreen: { backgroundColor: 'rgba(123, 224, 166, 0.1)' },
  cardEyebrow: {
    color: AppColors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cardTitle: { color: AppColors.text, fontSize: 17, fontWeight: '700', marginTop: 5 },
  cardValue: { color: AppColors.green, fontSize: 14, fontWeight: '700' },
  overValue: { color: AppColors.red },
  cardCaption: { color: AppColors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 10 },

  usageTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginTop: 20,
  },
  usageFill: { height: '100%', borderRadius: 8 },
  usageLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  usageLabel: { color: AppColors.textMuted, fontSize: 11 },

  appRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  appName: { width: 92, color: '#DDDDE6', fontSize: 12, fontWeight: '600' },
  appBarTrack: { flex: 1, height: 6, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.07)' },
  appBar: { height: '100%', borderRadius: 4 },
  appMinutes: { width: 52, color: AppColors.textMuted, fontSize: 11, textAlign: 'right' },

  emptyCopy: { color: AppColors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 16 },
  noticeText: { color: AppColors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 16 },
  errorText: { color: '#FFB4AA', fontSize: 12, marginTop: 12 },

  primaryButton: { marginTop: 16, borderRadius: Radii.md, overflow: 'hidden' },
  primaryButtonFill: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { color: '#251627', fontSize: 14, fontWeight: '800' },
  secondaryButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceRaised,
  },
  secondaryButtonText: { color: '#D9D9E2', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.55 },

  suggestionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 16 },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: AppColors.borderSoft,
  },
  suggestionEmoji: { fontSize: 18, lineHeight: 24 },
  suggestionCopy: { flex: 1, paddingTop: 1 },
  suggestionTitle: { color: AppColors.text, fontSize: 14, fontWeight: '700' },
  suggestionDetail: { color: AppColors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },

  collectionRow: { flexDirection: 'row', gap: 6, marginTop: 16 },
  collectionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceRaised,
    borderWidth: 1,
    borderColor: AppColors.borderSoft,
  },
  collectionEmoji: { fontSize: 20, lineHeight: 26 },
  collectionName: { color: '#B9B9C6', fontSize: 10, fontWeight: '700', marginTop: 4 },
  collectionLevel: {
    color: AppColors.textDim,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  collectionLocked: { opacity: 0.4 },

  pressed: { opacity: 0.76 },
});
