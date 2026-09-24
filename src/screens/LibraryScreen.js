import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Thumb from '../components/Thumb';
import { colors, radius } from '../theme';
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

  const QuickCard = ({ icon, title, sub, onPress }) => (
    <Tappable style={{ flex: 1 }} onPress={onPress} scaleTo={0.97}>
      <View style={styles.quickCard}>
        <Ionicons name={icon} size={20} color={colors.white} />
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSub}>{sub}</Text>
      </View>
    </Tappable>
  );

  const Header = (
    <View>
      <Text style={styles.h1}>Library</Text>
      <Text style={styles.sub}>
        {formatCount(videos.length)} clips · {formatCount(albums.length)} collections
      </Text>

      <View style={styles.quickRow}>
        <QuickCard
          icon="shuffle"
          title="For You"
          sub={`${formatCount(videos.length)} shuffled`}
          onPress={() => playSource({ type: 'all', title: 'For You' })}
        />
        <QuickCard
          icon="heart-outline"
          title="Favorites"
          sub={`${formatCount(favoriteVideos.length)} saved`}
          onPress={() => playSource({ type: 'favorites', title: 'Favorites' })}
        />
      </View>

      {albums.length > 0 ? (
        <View style={{ marginTop: 28 }}>
          <SectionLabel style={{ marginBottom: 14, paddingHorizontal: 2 }}>Collections</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {albums.map((a, i) => (
              <Tappable
                key={a.id}
                scaleTo={0.95}
                style={[styles.albumCard, { marginLeft: i === 0 ? 0 : 12 }]}
                onPress={() => playSource({ type: 'album', albumId: a.id, title: a.title })}
              >
                {a.cover ? (
                  <Thumb asset={a.cover} rounded={radius.md} showDuration={false} style={styles.albumCover} />
                ) : (
                  <View style={[styles.albumCover, styles.albumCoverEmpty]}>
                    <Ionicons name="albums-outline" size={24} color={colors.textMuted} />
                  </View>
                )}
                <Text style={styles.albumTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.albumCount}>{formatCount(a.count)} clips</Text>
              </Tappable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <SectionLabel style={{ marginTop: 28, marginBottom: 12, paddingHorizontal: 2 }}>All clips</SectionLabel>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        ListHeaderComponent={Header}
        ListHeaderComponentStyle={{ paddingHorizontal: GRID_PAD }}
        columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: GRID_PAD }}
        contentContainerStyle={{ paddingBottom: 120, gap: GRID_GAP }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loadingLibrary} onRefresh={refresh} tintColor={colors.white} colors={[colors.white]} />
        }
        renderItem={({ item, index }) => (
          <Tappable scaleTo={0.94} onPress={() => openAt(index)}>
            <Thumb asset={item} style={{ width: tileW, height: tileH }} rounded={radius.sm} />
          </Tappable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <Ionicons name="videocam-outline" size={38} color={colors.textMuted} />
            <Text style={styles.emptyGridText}>No videos found on this device yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.7 },
  sub: { color: colors.textDim, fontSize: 14, fontWeight: '500', marginTop: 6 },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  quickCard: {
    borderRadius: radius.lg,
    padding: 18,
    height: 112,
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  quickTitle: { color: colors.white, fontSize: 17, fontWeight: '800', marginTop: 8 },
  quickSub: { color: colors.textDim, fontSize: 12.5, fontWeight: '600' },
  albumCard: { width: 132 },
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
