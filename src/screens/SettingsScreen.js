import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';
import { SectionLabel, Tappable } from '../components/ui';
import Slider from '../components/Slider';
import { formatCount } from '../lib/format';

function Row({ icon, title, desc, value, onValueChange, last }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#2A2A2A', true: colors.white }}
        thumbColor={value ? '#000000' : '#EDEDED'}
        ios_backgroundColor="#2A2A2A"
      />
    </View>
  );
}

function Stat({ num, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, videos, favoriteVideos, albums, refresh } = useApp();
  const [sens, setSens] = useState(settings.scrollSensitivity ?? 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 120, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Settings</Text>

      <View style={styles.banner}>
        <Stat num={formatCount(videos.length)} label="Clips" />
        <View style={styles.statDivider} />
        <Stat num={formatCount(favoriteVideos.length)} label="Favorites" />
        <View style={styles.statDivider} />
        <Stat num={formatCount(albums.length)} label="Collections" />
      </View>

      <SectionLabel style={{ marginTop: 28, marginBottom: 12, paddingHorizontal: 2 }}>Playback</SectionLabel>
      <View style={styles.card}>
        <Row icon="shuffle" title="Shuffle" desc="Randomize the order of every collection" value={settings.shuffle} onValueChange={(v) => updateSettings({ shuffle: v })} />
        <Row icon="repeat" title="Loop clips" desc="Replay a clip until you swipe on" value={settings.loop} onValueChange={(v) => updateSettings({ loop: v })} />
        <Row icon="volume-mute" title="Start muted" desc="Open the reel with sound off" value={settings.startMuted} onValueChange={(v) => updateSettings({ startMuted: v })} last />
      </View>

      <SectionLabel style={{ marginTop: 26, marginBottom: 12, paddingHorizontal: 2 }}>Feel</SectionLabel>
      <View style={styles.card}>
        <Row icon="phone-portrait-outline" title="Haptics" desc="Subtle taps on likes and shuffles" value={settings.hapticsOn} onValueChange={(v) => updateSettings({ hapticsOn: v })} last />
      </View>

      <SectionLabel style={{ marginTop: 26, marginBottom: 12, paddingHorizontal: 2 }}>Scrolling</SectionLabel>
      <View style={styles.card}>
        <View style={styles.sliderRow}>
          <View style={styles.sliderHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Swipe sensitivity</Text>
              <Text style={styles.rowDesc}>How short a swipe moves to the next clip</Text>
            </View>
            <Text style={styles.sensValue}>{sens.toFixed(1)}</Text>
          </View>
          <Slider
            value={sens}
            min={1}
            max={5}
            onChange={setSens}
            onComplete={(v) => updateSettings({ scrollSensitivity: v })}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderHint}>Longer swipe</Text>
            <Text style={styles.sliderHint}>Shorter swipe</Text>
          </View>
        </View>
      </View>

      <SectionLabel style={{ marginTop: 26, marginBottom: 12, paddingHorizontal: 2 }}>Library</SectionLabel>
      <View style={styles.card}>
        <Tappable style={styles.actionRow} onPress={refresh} scaleTo={0.98}>
          <View style={styles.rowIcon}><Ionicons name="refresh" size={18} color={colors.text} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Rescan device</Text>
            <Text style={styles.rowDesc}>Pick up newly added videos</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Tappable>
        <Tappable style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={() => Linking.openSettings()} scaleTo={0.98}>
          <View style={styles.rowIcon}><Ionicons name="lock-closed-outline" size={18} color={colors.text} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Permissions</Text>
            <Text style={styles.rowDesc}>Manage media access in system settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Tappable>
      </View>

      <View style={styles.about}>
        <Text style={styles.aboutTitle}>MyCollectives</Text>
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
  h1: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.7, marginBottom: 4 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: 20,
    marginTop: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: colors.white, fontSize: 23, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 12, fontWeight: '600', marginTop: 3 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: colors.hairlineStrong },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.surfaceHi,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  rowDesc: { color: colors.textMuted, fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  sliderRow: { paddingVertical: 16 },
  sliderHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sensValue: { color: colors.white, fontSize: 16, fontWeight: '800', marginLeft: 12 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sliderHint: { color: colors.textMuted, fontSize: 11.5, fontWeight: '600' },
  about: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  aboutTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  aboutText: { color: colors.textDim, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  version: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 16 },
});
