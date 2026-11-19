import { StyleSheet, Text, View } from 'react-native';

import type { PetLevel } from '@/features/pet/pets';

type PetAvatarProps = {
  level: PetLevel;
  size?: number;
};

export function PetAvatar({ level, size = 120 }: PetAvatarProps) {
  const innerSize = size - 14;
  const auraSize = size + 30;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${level.name}, level ${level.level} ${level.title}`}
      style={{ width: auraSize, height: auraSize, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={[
          styles.aura,
          {
            width: auraSize,
            height: auraSize,
            borderRadius: auraSize / 2,
            backgroundColor: level.colors.glow,
          },
        ]}
      />

      <Text style={[styles.auraMark, styles.auraTopLeft, { color: level.colors.accent }]}>
        {level.aura}
      </Text>
      <Text style={[styles.auraMark, styles.auraTopRight, { color: level.colors.accent }]}>
        {level.aura}
      </Text>
      <Text style={[styles.auraMark, styles.auraBottomLeft, { color: level.colors.accent }]}>
        {level.aura}
      </Text>
      <Text style={[styles.auraMark, styles.auraBottomRight, { color: level.colors.accent }]}>
        {level.aura}
      </Text>

      <View
        style={[
          styles.halo,
          { width: size, height: size, borderRadius: size / 2, borderColor: level.colors.ring },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: level.colors.core,
              borderColor: level.colors.ring,
            },
          ]}
        >
          <Text style={{ fontSize: size * 0.46, lineHeight: size * 0.6 }}>{level.emoji}</Text>
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: level.colors.accent }]}>
        <Text style={styles.badgeText}>LV {level.level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aura: { position: 'absolute' },
  auraMark: { position: 'absolute', fontSize: 13, fontWeight: '700' },
  auraTopLeft: { top: 8, left: 16 },
  auraTopRight: { top: 14, right: 10 },
  auraBottomLeft: { bottom: 20, left: 8 },
  auraBottomRight: { bottom: 8, right: 20 },
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1B1B20',
  },
  badgeText: { color: '#17141C', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});
