import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

const TABS = [
  { key: 'feed', label: 'Reel', icon: 'play', iconOutline: 'play-outline' },
  { key: 'library', label: 'Library', icon: 'grid', iconOutline: 'grid-outline' },
  { key: 'favorites', label: 'Favorites', icon: 'heart', iconOutline: 'heart-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
];

export default function TabBar() {
  const insets = useSafeAreaInsets();
  const { tab, setTab, haptic } = useApp();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <Pressable
            key={t.key}
            style={styles.tab}
            onPress={() => {
              if (!active) haptic('select');
              setTab(t.key);
            }}
          >
            <View style={styles.dotWrap}>
              <View style={[styles.dot, active && styles.dotActive]} />
            </View>
            <Ionicons
              name={active ? t.icon : t.iconOutline}
              size={23}
              color={active ? colors.white : colors.textMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 10,
    backgroundColor: colors.bgElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  tab: { flex: 1, alignItems: 'center' },
  dotWrap: { height: 6, justifyContent: 'center', marginBottom: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  dotActive: { backgroundColor: colors.white },
  label: { color: colors.textMuted, fontSize: 10.5, fontWeight: '700', marginTop: 4, letterSpacing: 0.2 },
  labelActive: { color: colors.white },
});
