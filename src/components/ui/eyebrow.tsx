import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors, Radii } from '@/constants/theme';

type EyebrowProps = {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

/** Small pill above a screen title, with an optional icon. */
export function Eyebrow({ label, icon }: EyebrowProps) {
  return (
    <View style={styles.pill}>
      {icon ? (
        <Ionicons name={icon} size={12} color={AppColors.peach} />
      ) : (
        <View style={styles.dot} />
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 214, 165, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 165, 0.16)',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.peach,
  },
  label: {
    color: AppColors.peach,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
});
