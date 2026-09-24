import React from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import Thumb from '../components/Thumb';
import { colors, radius } from '../theme';
import { PrimaryButton, Tappable } from '../components/ui';
import { formatCount } from '../lib/format';

const GRID_PAD = 16;
const GRID_GAP = 8;
const COLS = 3;

export default function FavoritesScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { favoriteVideos, playSource, setTab, haptic } = useApp();

  const tileW = (width - GRID_PAD * 2 - GRID_GAP * (COLS - 1)) / COLS;
  const tileH = tileW * 1.5;

  if (favoriteVideos.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 90 }]}>
        <View style={styles.orb}>
          <Ionicons name="heart-outline" size={40} color={colors.textDim} />
        </View>
        <Text style={styles.emptyTitle}>No favorites yet</Text>
        <Text style={styles.emptyText}>
          Double-tap a clip while watching, or tap the heart, to keep it here for quick replays.
        </Text>
        <PrimaryButton label="Start watching" icon="play" onPress={() => setTab('feed')} style={{ marginTop: 26 }} />
      </View>
    );
  }

  const Header = (
    <View style={{ paddingHorizontal: GRID_PAD }}>
      <Text style={styles.h1}>Favorites</Text>
      <Text style={styles.sub}>{formatCount(favoriteVideos.length)} clips you love</Text>
      <Tappable
        scaleTo={0.97}
        style={styles.playAll}
        onPress={() => {
          haptic('medium');
          playSource({ type: 'favorites', title: 'Favorites' });
        }}
      >
        <Ionicons name="play" size={17} color={colors.black} />
        <Text style={styles.playAllText}>Play all · shuffled</Text>
      </Tappable>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <FlatList
        data={favoriteVideos}
        keyExtractor={(item) => item.id}
        numColumns={COLS}
        ListHeaderComponent={Header}
        columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: GRID_PAD }}
        contentContainerStyle={{ paddingBottom: 120, gap: GRID_GAP }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Tappable
            scaleTo={0.94}
            onPress={() => {
              haptic('light');
              playSource({ type: 'favorites', title: 'Favorites' }, index);
            }}
          >
            <Thumb asset={item} style={{ width: tileW, height: tileH }} rounded={radius.sm} />
          </Tappable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  h1: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.7 },
  sub: { color: colors.textDim, fontSize: 14, fontWeight: '500', marginTop: 6 },
  playAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: 18,
    marginBottom: 6,
  },
  playAllText: { color: colors.black, fontWeight: '800', fontSize: 15 },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 32 },
  orb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    marginBottom: 22,
  },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 10 },
});
