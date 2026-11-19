import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/theme';
import { PET_EMOJI, PET_NAME, type PetLevel } from '@/features/pet/pets';

type PetAvatarProps = {
  level: PetLevel;
  size?: number;
};

export function PetAvatar({ level, size = 116 }: PetAvatarProps) {
  const innerSize = size - 14;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${PET_NAME}, level ${level.level} ${level.title}`}
      style={[styles.halo, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View
        style={[
          styles.inner,
          { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
        ]}
      >
        <Text style={{ fontSize: size * 0.46, lineHeight: size * 0.58 }}>{PET_EMOJI}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>LV {level.level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 165, 0.4)',
    backgroundColor: 'rgba(255, 214, 165, 0.08)',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2233',
    borderWidth: 1,
    borderColor: 'rgba(106, 0, 244, 0.45)',
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: AppColors.purple,
    borderWidth: 1,
    borderColor: '#1B1B20',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});
