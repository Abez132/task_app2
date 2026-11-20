import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type GlowProps = {
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft radial glow built from stacked translucent circles. Keeps the ambient
 * look without pulling in a blur or image dependency.
 */
export function Glow({ size = 320, color = '#7C3AED', opacity = 0.16, style }: GlowProps) {
  const rings = [1, 0.74, 0.48, 0.24];

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size }, style]}
    >
      {rings.map((scale, index) => (
        <View
          key={scale}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            backgroundColor: color,
            opacity: (opacity * (index + 1)) / rings.length,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
