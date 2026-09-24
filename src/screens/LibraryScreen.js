import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Thumb from '../components/Thumb';
import { colors, radius, brandGradient } from '../theme';
import { SectionLabel, Tappable } from '../components/ui';
import { formatCount } from '../lib/format';

const GRID_PAD = 16;
const GRID_GAP = 8;
const COLS = 3;

export default function LibraryScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { videos, albums, favoriteVideos, playSource, loadingLibrary, refresh, haptic } = useApp();

  const tileW = (width - GRID_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS;
  const tileH = tileW * 1.5;

  const openAt = (index) => {
    haptic('light');
    playSource({ type: 'ordered', title: 'Library' }, index);
  };

  const Header = (
    <View>
      <Text style={styles.h1}>Your Library</Text>
      <Text style={styles.sub}>
        {formatCount(videos.length)} clips · {formatCount(albums.length)} collections · offline
      </Text>

      {/* Quick collections */}
      <View style={styles.quickRow}>
        <Tappable style={{ flex: 1 }} onPress={() => playSource({ type: 'all', title: 'For You' })} scaleTo={0.97}>
          <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickCard}>
            <Ionicons name="sparkles" size={22} color={colors.white} />
            <Text style={styles.quickTitle}>For You</Text>
            <Text style={styles.quickSub}>{formatCount(videos.length)} shuffled</Text>
          </LinearGradient>
        </Tappable>
        <Tappable style={{ flex: 1 }} onPress={() => playSource({ type: 'favorites', title: 'Favorites' })} scaleTo={0.97}>
          <View style={[styles.quickCard, styles.quickCardAlt]}>
            <Ionicons name="heart" size={22} color={colors.like} />
            <Text style={styles.quickTitle}>Favorites</Text>
            <Text style={styles.quickSub}>{formatCount(favoriteVideos.length)} saved</Text>
          </View>
        </Tappable>
      </View>

      {/* Albums */}
      {albums.length > 0 ? (
        <View style={{ marginTop: 26 }}>
          <SectionLabel style={{ marginBottom: 14 }}>Collections</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {albums.map((a) => (
              <Tappable
                key={a.id}
                scaleTo={0.95}
                style={styles.albumCard}
                onPress={() => playSource({ type: 'album', albumId: a.id, title: a.title })}
              >
                {a.cover ? (
                  <Thumb asset={a.cover} rounded={radius.md} showDuration={false} style={styles.albumCover} />
                ) : (
                  <View style={[styles.albumCover, styles.albumCoverEmpty]}>
                    <Ionicons name="albums" size={26} color={colors.textDim} />
                  </View>
                )}
                <Text style={styles.albumTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.albumCount}>{formatCount(a.count)} clips</Text>
              </Tappable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <SectionLabel style={{ marginTop: 26, marginBottom: 12 }}>All clips</SectionLabel>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        ListHeaderComponent={Header}
        columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: GRID_PAD }}
        contentContainerStyle={{ paddingBottom: 120, gap: GRID_GAP }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingLibrary} onRefresh={refresh} tintColor={colors.violet} colors={[colors.violet]} />
        }
        renderItem={({ item, index }) => (
          <Tappable scaleTo={0.94} onPress={() => openAt(index)}>
            <Thumb asset={item} style={{ width: tileW, height: tileH }} rounded={radius.sm} />
          </Tappable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <Ionicons name="videocam-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyGridText}>No videos found on this device yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.6, paddingHorizontal: GRID_PAD },
  sub: { color: colors.textDim, fontSize: 14, fontWeight: '600', marginTop: 6, paddingHorizontal: GRID_PAD },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 22, paddingHorizontal: GRID_PAD },
  quickCard: {
    borderRadius: radius.lg,
    padding: 18,
    height: 116,
    justifyContent: 'space-between',
  },
  quickCardAlt: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline },
  quickTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 8 },
  quickSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '600' },
  albumCard: { width: 132, marginLeft: GRID_PAD },
  albumCover: { width: 132, height: 132 },
  albumCoverEmpty: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  albumTitle: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 10 },
  albumCount: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  emptyGrid: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyGridText: { color: colors.textMuted, fontSize: 14, fontWeight: '600', marginTop: 12, textAlign: 'center' },
});
