import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useApp } from '../context/AppContext';
import VideoItem from '../components/VideoItem';
import { colors, radius } from '../theme';
import { IconButton, PrimaryButton } from '../components/ui';
import { prettyName, formatDuration } from '../lib/format';

const TAB_H = 62; // matches the bottom TabBar content height
// Only mount video players for items within this many steps of the active one
// (current + 1 ahead + 1 behind = 3 live players → smooth, low memory).
const WINDOW = 1;

// Map swipe-sensitivity (1..5) to the fraction of the screen you must drag to
// advance a clip. 1 = long swipe (0.45), 5 = short swipe (0.12).
function sensFraction(s) {
  const c = Math.max(1, Math.min(5, s || 3));
  return 0.45 - (c - 1) * 0.0825;
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { feed, settings, updateSettings, isFavorite, toggleFavorite, reshuffle, haptic } = useApp();

  const [activeIndex, setActiveIndex] = useState(feed.startIndex || 0);
  const [globalMuted, setGlobalMuted] = useState(settings.startMuted);
  const [infoAsset, setInfoAsset] = useState(null);
  const [viewportH, setViewportH] = useState(0);
  const listRef = useRef(null);

  const bottomInset = TAB_H + insets.bottom;

  // Keep the active (playing) item in sync when the source/shuffle changes.
  useEffect(() => {
    setActiveIndex(feed.startIndex || 0);
  }, [feed.seed]);

  const viewConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewable = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const getItemLayout = useCallback(
    (_, index) => ({ length: viewportH, offset: viewportH * index, index }),
    [viewportH]
  );

  const toggleMute = useCallback(() => {
    haptic('select');
    setGlobalMuted((m) => {
      updateSettings({ startMuted: !m });
      return !m;
    });
  }, [haptic, updateSettings]);

  // If a clip can't start (bad/corrupt file), quietly skip to the next.
  const advanceFrom = useCallback(
    (index) => {
      const next = index + 1;
      if (next < feed.assets.length && listRef.current) {
        try {
          listRef.current.scrollToIndex({ index: next, animated: true });
        } catch (e) {}
      }
    },
    [feed.assets.length]
  );

  // Share the actual video file via the system share sheet.
  const onShare = useCallback(
    async (asset) => {
      try {
        haptic('light');
        let uri = asset.localUri;
        if (!uri) {
          const info = await MediaLibrary.getAssetInfoAsync(asset);
          uri = info.localUri || asset.uri;
        }
        const can = await Sharing.isAvailableAsync();
        if (can && uri) await Sharing.shareAsync(uri);
      } catch (e) {}
    },
    [haptic]
  );

  // Custom, adjustable snap paging. Advance when the drag passes a
  // sensitivity-controlled fraction of the screen (or on a flick).
  const dragStartY = useRef(0);
  const onScrollBeginDrag = useCallback((e) => {
    dragStartY.current = e.nativeEvent.contentOffset.y;
  }, []);
  const onScrollEndDrag = useCallback(
    (e) => {
      const { contentOffset, velocity } = e.nativeEvent;
      const delta = contentOffset.y - dragStartY.current;
      const threshold = viewportH * sensFraction(settings.scrollSensitivity);
      const vy = velocity ? velocity.y : 0;
      let target = activeIndex;
      if (delta > threshold || vy > 0.6) target = activeIndex + 1;
      else if (delta < -threshold || vy < -0.6) target = activeIndex - 1;
      target = Math.max(0, Math.min((feed.assets?.length || 1) - 1, target));
      setActiveIndex(target);
      requestAnimationFrame(() => {
        try {
          listRef.current?.scrollToIndex({ index: target, animated: true });
        } catch (err) {}
      });
    },
    [viewportH, settings.scrollSensitivity, activeIndex, feed.assets]
  );
  const onMomentumEnd = useCallback(
    (e) => {
      if (!viewportH) return;
      const idx = Math.round(e.nativeEvent.contentOffset.y / viewportH);
      setActiveIndex(Math.max(0, Math.min((feed.assets?.length || 1) - 1, idx)));
    },
    [viewportH, feed.assets]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const distance = Math.abs(index - activeIndex);
      // Outside the window: cheap black spacer — no video player in memory.
      if (distance > WINDOW) {
        return <View style={{ height: viewportH, backgroundColor: colors.black }} />;
      }
      return (
        <VideoItem
          asset={item}
          height={viewportH}
          active={index === activeIndex}
          globalMuted={globalMuted}
          loop={settings.loop}
          liked={isFavorite(item.id)}
          collectionTitle={feed.source?.title}
          bottomInset={bottomInset}
          onToggleMute={toggleMute}
          onToggleLike={() => toggleFavorite(item.id)}
          onShare={() => onShare(item)}
          onOpenInfo={() => setInfoAsset(item)}
          onFailed={() => advanceFrom(index)}
        />
      );
    },
    [activeIndex, viewportH, globalMuted, settings.loop, isFavorite, feed.source, bottomInset, toggleMute, toggleFavorite, onShare, advanceFrom]
  );

  const empty = !feed.assets || feed.assets.length === 0;

  return (
    <View style={styles.container} onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}>
      {empty ? (
        <EmptyFeed insets={insets} />
      ) : viewportH > 0 ? (
        <FlatList
          key={`${feed.seed}-${viewportH}`}
          ref={listRef}
          data={feed.assets}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          getItemLayout={getItemLayout}
          initialScrollIndex={Math.min(feed.startIndex || 0, feed.assets.length - 1)}
          windowSize={5}
          maxToRenderPerBatch={2}
          initialNumToRender={2}
          removeClippedSubviews={false}
          decelerationRate="fast"
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onMomentumScrollEnd={onMomentumEnd}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={viewConfig}
        />
      ) : null}

      {!empty ? (
        <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
          <View style={styles.topLeft}>
            <Text style={styles.brand}>MyCollectives</Text>
            <Text style={styles.nowPlaying} numberOfLines={1}>
              {feed.source?.title || 'For You'} · {activeIndex + 1}/{feed.assets.length}
            </Text>
          </View>
          <IconButton icon="shuffle" onPress={reshuffle} />
        </View>
      ) : null}

      <InfoSheet
        asset={infoAsset}
        liked={infoAsset ? isFavorite(infoAsset.id) : false}
        onToggleLike={() => infoAsset && toggleFavorite(infoAsset.id)}
        onClose={() => setInfoAsset(null)}
        insets={insets}
      />
    </View>
  );
}

function EmptyFeed({ insets }) {
  const { refresh, loadingLibrary, libError, setTab } = useApp();

  if (loadingLibrary) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 96 }]}>
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={[styles.emptyTitle, { marginTop: 22 }]}>Scanning your library…</Text>
        <Text style={styles.emptyText}>Getting your first clips ready. A large library can take a couple of seconds.</Text>
      </View>
    );
  }

  if (libError) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 80 }]}>
        <View style={styles.emptyOrb}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textDim} />
        </View>
        <Text style={styles.emptyTitle}>Couldn't read your videos</Text>
        <Text style={styles.emptyText}>
          {libError === 'timeout'
            ? 'Your library is taking unusually long to read.'
            : 'Something went wrong reading your media.'}{' '}
          Tap retry to try again.
        </Text>
        <PrimaryButton label="Retry" icon="refresh" onPress={refresh} style={{ marginTop: 26 }} />
      </View>
    );
  }

  return (
    <View style={[styles.empty, { paddingTop: insets.top + 60 }]}>
      <View style={styles.emptyOrb}>
        <Ionicons name="film-outline" size={40} color={colors.textDim} />
      </View>
      <Text style={styles.emptyTitle}>Nothing to play yet</Text>
      <Text style={styles.emptyText}>
        Add a few videos to your device, then pull them into your reel. Everything stays offline.
      </Text>
      <PrimaryButton label="Browse library" icon="grid-outline" onPress={() => setTab('library')} style={{ marginTop: 26 }} />
      <Pressable style={styles.emptyLink} onPress={refresh}>
        <Text style={styles.emptyLinkText}>Rescan device</Text>
      </Pressable>
    </View>
  );
}

function InfoSheet({ asset, liked, onToggleLike, onClose, insets }) {
  if (!asset) return null;
  const created = asset.creationTime
    ? new Date(asset.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';
  const rows = [
    { label: 'Name', value: prettyName(asset.filename) },
    { label: 'Duration', value: formatDuration(asset.duration) },
    { label: 'Resolution', value: `${asset.width} × ${asset.height}` },
    { label: 'Created', value: created },
    { label: 'File', value: asset.filename },
  ];
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Clip details</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {rows.map((r) => (
            <View key={r.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{r.label}</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{r.value}</Text>
            </View>
          ))}
        </ScrollView>
        <Pressable style={styles.sheetAction} onPress={onToggleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={colors.text} />
          <Text style={styles.sheetActionText}>{liked ? 'Remove from favorites' : 'Add to favorites'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  topBar: {
    position: 'absolute',
    left: 18,
    right: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topLeft: { flex: 1, marginRight: 12 },
  brand: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  nowPlaying: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 5,
  },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 32 },
  emptyOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  emptyLink: { marginTop: 16, padding: 8 },
  emptyLinkText: { color: colors.textDim, fontWeight: '700', fontSize: 14 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.hairline,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.hairlineStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  infoLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600', width: 96 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
    paddingVertical: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  sheetActionText: { color: colors.text, fontWeight: '800', fontSize: 15 },
});
