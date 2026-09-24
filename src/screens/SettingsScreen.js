import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, radius, brandGradient } from '../theme';
import { SectionLabel, Tappable } from '../components/ui';
import { formatCount } from '../lib/format';

function Row({ icon, title, desc, value, onValueChange, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={colors.violet} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceHi, true: colors.violet }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.surfaceHi}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, videos, favoriteVideos, albums, refresh } = useApp();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Settings</Text>

      {/* Stat banner */}
      <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{formatCount(videos.length)}</Text>
          <Text style={styles.statLabel}>Clips</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{formatCount(favoriteVideos.length)}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{formatCount(albums.length)}</Text>
          <Text style={styles.statLabel}>Collections</Text>
        </View>
      </LinearGradient>

      <SectionLabel style={{ marginTop: 26, marginBottom: 12 }}>Playback</SectionLabel>
      <View style={styles.card}>
        <Row
          icon="shuffle"
          title="Shuffle"
          desc="Randomize the order of every collection"
          value={settings.shuffle}
          onValueChange={(v) => updateSettings({ shuffle: v })}
        />
        <Row
          icon="repeat"
          title="Loop clips"
          desc="Replay a clip until you swipe on"
          value={settings.loop}
          onValueChange={(v) => updateSettings({ loop: v })}
        />
        <Row
          icon="volume-mute"
          title="Start muted"
          desc="Open the reel with sound off"
          value={settings.startMuted}
          onValueChange={(v) => updateSettings({ startMuted: v })}
          last
        />
      </View>

      <SectionLabel style={{ marginTop: 26, marginBottom: 12 }}>Feel</SectionLabel>
      <View style={styles.card}>
        <Row
          icon="phone-portrait-outline"
          title="Haptics"
          desc="Subtle taps on likes and shuffles"
          value={settings.hapticsOn}
          onValueChange={(v) => updateSettings({ hapticsOn: v })}
          last
        />
      </View>

      <SectionLabel style={{ marginTop: 26, marginBottom: 12 }}>Library</SectionLabel>
      <View style={styles.card}>
        <Tappable style={styles.actionRow} onPress={refresh} scaleTo={0.98}>
          <View style={styles.rowIcon}><Ionicons name="refresh" size={19} color={colors.violet} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Rescan device</Text>
            <Text style={styles.rowDesc}>Pick up newly added videos</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Tappable>
        <Tappable style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={() => Linking.openSettings()} scaleTo={0.98}>
          <View style={styles.rowIcon}><Ionicons name="lock-closed-outline" size={19} color={colors.violet} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Permissions</Text>
            <Text style={styles.rowDesc}>Manage media access in system settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Tappable>
      </View>

      <View style={styles.about}>
        <Text style={styles.aboutTitle}>My<Text style={{ color: colors.violet }}>Collectives</Text></Text>
        <Text style={styles.aboutText}>
          Your videos, your reel. No cloud, no accounts, no algorithm — everything plays straight from this device.
        </Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.6, marginBottom: 4 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: 20,
    marginTop: 18,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: colors.white, fontSize: 24, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', marginTop: 3 },
  statDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.25)' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  rowDesc: { color: colors.textMuted, fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  about: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  aboutTitle: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  aboutText: { color: colors.textDim, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  version: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 16 },
});
