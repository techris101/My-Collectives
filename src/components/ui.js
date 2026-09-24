import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type } from '../theme';

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

// Primary CTA — solid white on black, black label. The one high-contrast moment.
export function PrimaryButton({ label, icon, onPress, style, small }) {
  return (
    <Tappable onPress={onPress} style={[styles.primary, small && styles.primarySmall, style]} scaleTo={0.97}>
      {icon ? <Ionicons name={icon} size={small ? 17 : 19} color={colors.black} style={{ marginRight: 8 }} /> : null}
      <Text style={[styles.primaryText, small && { fontSize: 15 }]}>{label}</Text>
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
  return (
    <Tappable onPress={onPress} scaleTo={0.95} style={[active ? styles.chipActive : styles.chip, { marginRight: 10 }]}>
      {icon ? (
        <Ionicons name={icon} size={14} color={active ? colors.black : colors.textDim} style={{ marginRight: 6 }} />
      ) : null}
      <Text style={active ? styles.chipActiveText : styles.chipText}>{label}</Text>
    </Tappable>
  );
}

export function SectionLabel({ children, style }) {
  return <Text style={[type.section, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  primarySmall: { paddingVertical: 11, paddingHorizontal: 18 },
  primaryText: { color: colors.black, fontWeight: '800', fontSize: 16, letterSpacing: 0.1 },
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
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
    backgroundColor: colors.white,
  },
  chipActiveText: { color: colors.black, fontWeight: '800', fontSize: 13.5 },
});
