import React, { useRef } from 'react';
import { Pressable, Text, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, brandGradient, type, shadow, spacing } from '../theme';

// Pressable that scales down slightly on press for a tactile feel.
export function Tappable({ children, onPress, onLongPress, style, scaleTo = 0.96, disabled, hitSlop }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function GradientButton({ label, icon, onPress, style, small }) {
  return (
    <Tappable onPress={onPress} style={style} scaleTo={0.97}>
      <LinearGradient
        colors={brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gbtn, small && styles.gbtnSmall, shadow.glow]}
      >
        {icon ? <Ionicons name={icon} size={small ? 18 : 20} color={colors.white} style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.gbtnText, small && { fontSize: 15 }]}>{label}</Text>
      </LinearGradient>
    </Tappable>
  );
}

export function GhostButton({ label, icon, onPress, style }) {
  return (
    <Tappable onPress={onPress} style={[styles.ghost, style]} scaleTo={0.97}>
      {icon ? <Ionicons name={icon} size={18} color={colors.text} style={{ marginRight: 8 }} /> : null}
      <Text style={styles.ghostText}>{label}</Text>
    </Tappable>
  );
}

export function IconButton({ icon, onPress, size = 22, color = colors.text, style, bg = true, onLongPress }) {
  return (
    <Tappable onPress={onPress} onLongPress={onLongPress} scaleTo={0.9} hitSlop={8} style={[bg && styles.iconBtn, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Tappable>
  );
}

export function Chip({ label, active, onPress, icon }) {
  if (active) {
    return (
      <Tappable onPress={onPress} scaleTo={0.95} style={{ marginRight: 10 }}>
        <LinearGradient
          colors={brandGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chipActive}
        >
          {icon ? <Ionicons name={icon} size={14} color={colors.white} style={{ marginRight: 6 }} /> : null}
          <Text style={styles.chipActiveText}>{label}</Text>
        </LinearGradient>
      </Tappable>
    );
  }
  return (
    <Tappable onPress={onPress} scaleTo={0.95} style={[styles.chip, { marginRight: 10 }]}>
      {icon ? <Ionicons name={icon} size={14} color={colors.textDim} style={{ marginRight: 6 }} /> : null}
      <Text style={styles.chipText}>{label}</Text>
    </Tappable>
  );
}

export function SectionLabel({ children, style }) {
  return <Text style={[type.section, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  gbtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
  },
  gbtnSmall: { paddingVertical: 11, paddingHorizontal: 18 },
  gbtnText: { color: colors.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  ghostText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipText: { color: colors.textDim, fontWeight: '700', fontSize: 13.5 },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  chipActiveText: { color: colors.white, fontWeight: '800', fontSize: 13.5 },
});
