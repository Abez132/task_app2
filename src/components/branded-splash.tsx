import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Glow } from '@/components/ui/glow';
import { AppColors, Radii } from '@/constants/theme';

/** How long the splash stays fully visible before it starts to leave. */
const HOLD_MS = 1500;
const EXIT_MS = 420;
const PROGRESS_WIDTH = 152;

const APP_NAME = (Constants.expoConfig?.name ?? 'task2').replace(
  /^./,
  (character) => character.toUpperCase(),
);

type BrandedSplashProps = {
  onFinish: () => void;
};

/**
 * An in-app splash shown after the native splash has been hidden. The native
 * splash cannot animate, so this overlay carries the logo, wordmark and
 * loading state, then fades away to reveal the app.
 */
export function BrandedSplash({ onFinish }: BrandedSplashProps) {
  const intro = useSharedValue(0);
  const textIntro = useSharedValue(0);
  const spin = useSharedValue(0);
  const progress = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    intro.value = withSpring(1, { damping: 13, stiffness: 160, mass: 0.9 });
    textIntro.value = withDelay(
      260,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
    );
    spin.value = withRepeat(
      withTiming(1, { duration: 12_000, easing: Easing.linear }),
      -1,
      false,
    );
    progress.value = withTiming(1, {
      duration: HOLD_MS,
      easing: Easing.inOut(Easing.quad),
    });

    const exitTimer = setTimeout(() => {
      exit.value = withTiming(1, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) });
    }, HOLD_MS);
    const finishTimer = setTimeout(onFinish, HOLD_MS + EXIT_MS + 60);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [exit, intro, onFinish, progress, spin, textIntro]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: 1 + exit.value * 0.04 }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [{ scale: 0.72 + intro.value * 0.28 }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: textIntro.value,
    transform: [{ translateY: (1 - textIntro.value) * 14 }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: progress.value * PROGRESS_WIDTH,
  }));

  return (
    <Animated.View
      accessibilityViewIsModal
      onStartShouldSetResponder={() => true}
      style={[styles.root, rootStyle]}
    >
      <LinearGradient
        colors={['#0C0A14', AppColors.background, '#0B0812']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Glow size={430} color={AppColors.purple} opacity={0.22} style={{ top: -170, right: -150 }} />
      <Glow size={320} color={AppColors.peach} opacity={0.12} style={{ bottom: -80, left: -170 }} />

      <View style={styles.center}>
        <View style={styles.badgeArea}>
          <View style={styles.badgeHalo} />
          <Animated.View style={[styles.orbit, orbitStyle]} />

          <Animated.View style={[styles.badge, badgeStyle]}>
            <LinearGradient
              colors={['#FFE7C7', '#FFB98A', AppColors.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <View style={styles.badgeInner}>
                <Ionicons name="paw" size={42} color={AppColors.peach} />
              </View>
            </LinearGradient>
          </Animated.View>

          <Text style={[styles.sparkle, styles.sparkleTopLeft]}>✦</Text>
          <Text style={[styles.sparkle, styles.sparkleBottomRight]}>✧</Text>
        </View>

        <Animated.View style={[styles.copy, copyStyle]}>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Small wins, every day.</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottom, copyStyle]}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Starting the app"
          style={styles.progressTrack}
        >
          <Animated.View style={[styles.progressFillWrap, progressStyle]}>
            <LinearGradient
              colors={[AppColors.peach, AppColors.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.loading}>Getting your day ready…</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  center: { alignItems: 'center', marginTop: -24 },
  badgeArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHalo: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(255, 214, 165, 0.05)',
  },
  orbit: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 214, 165, 0.12)',
    borderTopColor: 'rgba(255, 214, 165, 0.75)',
    borderRightColor: 'rgba(185, 162, 255, 0.4)',
  },
  badge: {
    width: 116,
    height: 116,
    borderRadius: 38,
    shadowColor: AppColors.peach,
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  badgeGradient: { flex: 1, borderRadius: 38, padding: 2.5 },
  badgeInner: {
    flex: 1,
    borderRadius: 35.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#100D18',
  },
  sparkle: { position: 'absolute', color: AppColors.peach, fontSize: 16, fontWeight: '700' },
  sparkleTopLeft: { top: 22, left: 18, fontSize: 18 },
  sparkleBottomRight: { bottom: 24, right: 16, fontSize: 14 },

  copy: { alignItems: 'center', marginTop: 26 },
  title: {
    color: AppColors.text,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tagline: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    letterSpacing: 0.3,
  },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 68,
    alignItems: 'center',
  },
  progressTrack: {
    width: PROGRESS_WIDTH,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressFillWrap: { height: '100%', borderRadius: Radii.pill, overflow: 'hidden' },
  loading: {
    color: AppColors.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    marginTop: 12,
  },
});
