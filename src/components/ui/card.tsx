import { StyleSheet, View, type ViewProps } from 'react-native';

import { AppColors, Radii, Shadows } from '@/constants/theme';

/** Rounded, bordered surface used for every card in the app. */
export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Shadows.card,
  },
});
