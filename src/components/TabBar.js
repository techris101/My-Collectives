import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, radius, brandGradient } from '../theme';

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
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <BlurView intensity={40} tint="dark" experimentalBlurMethod="dimezisBlurView" style={styles.bar}>
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
              {active ? (
                <LinearGradient
                  colors={brandGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activePill}
                >
                  <Ionicons name={t.icon} size={20} color={colors.white} />
                </LinearGradient>
              ) : (
                <View style={styles.inactive}>
                  <Ionicons name={t.iconOutline} size={22} color={colors.textDim} />
                </View>
              )}
              <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(18,18,24,0.62)',
  },
  tab: { flex: 1, alignItems: 'center' },
  activePill: {
    width: 46,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { width: 46, height: 34, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.textMuted, fontSize: 10.5, fontWeight: '700', marginTop: 3 },
  labelActive: { color: colors.text },
});
