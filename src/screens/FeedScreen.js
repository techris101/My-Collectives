import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import VideoItem from '../components/VideoItem';
import { colors, radius } from '../theme';
import { IconButton } from '../components/ui';
import { prettyName, formatDuration } from '../lib/format';

const TAB_SPACE = 78;

export default function FeedScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    feed,
    settings,
    updateSettings,
    isFavorite,
    toggleFavorite,
    reshuffle,
    haptic,
  } = useApp();

  const [activeIndex, setActiveIndex] = useState(feed.startIndex || 0);
  const [globalMuted, setGlobalMuted] = useState(settings.startMuted);
  const [infoAsset, setInfoAsset] = useState(null);
  const listRef = useRef(null);

  const pageHeight = height;
  const bottomInset = TAB_SPACE + insets.bottom * 0.4;

  // Keep the active (playing) item in sync when the source/shuffle changes.
  useEffect(() => {
    setActiveIndex(feed.startIndex || 0);
  }, [feed.seed]);

  const viewConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewable = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const getItemLayout = useCallback(
    (_, index) => ({ length: pageHeight, offset: pageHeight * index, index }),
    [pageHeight]
  );

  const toggleMute = useCallback(() => {
    haptic('select');
    setGlobalMuted((m) => {
      updateSettings({ startMuted: !m });
      return !m;
    });
  }, [haptic, updateSettings]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <VideoItem
        asset={item}
        height={pageHeight}
        active={index === activeIndex}
        globalMuted={globalMuted}
        loop={settings.loop}
        liked={isFavorite(item.id)}
        collectionTitle={feed.source?.title}
        bottomInset={bottomInset}
        onToggleMute={toggleMute}
        onToggleLike={() => toggleFavorite(item.id)}
        onShuffle={reshuffle}
        onOpenInfo={() => setInfoAsset(item)}
      />
    ),
    [pageHeight, activeIndex, globalMuted, settings.loop, isFavorite, feed.source, bottomInset, toggleMute, toggleFavorite, reshuffle]
  );

  if (!feed.assets || feed.assets.length === 0) {
    return <EmptyFeed insets={insets} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={feed.seed}
        ref={listRef}
        data={feed.assets}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={Math.min(feed.startIndex || 0, feed.assets.length - 1)}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        removeClippedSubviews
        decelerationRate="fast"
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewConfig}
      />

      {/* Top overlay */}
      <View style={[styles.topBar, { top: insets.top + 6 }]} pointerEvents="box-none">
        <View style={styles.topLeft}>
          <Text style={styles.brand}>My<Text style={{ color: colors.violet }}>Collectives</Text></Text>
          <Text style={styles.nowPlaying} numberOfLines={1}>
            {feed.source?.title || 'For You'} · {activeIndex + 1}/{feed.assets.length}
          </Text>
        </View>
        <IconButton icon="shuffle" onPress={reshuffle} />
      </View>

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
  const { refresh, loadingLibrary, setTab } = useApp();
  return (
    <View style={[styles.empty, { paddingTop: insets.top + 40 }]}>
      <LinearGradient
        colors={['rgba(139,92,246,0.25)', 'rgba(236,72,153,0.12)']}
        style={styles.emptyOrb}
      >
        <Ionicons name="film-outline" size={46} color={colors.white} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No clips in this collection yet</Text>
      <Text style={styles.emptyText}>
        Record or download a few videos, then pull them into your reel. Everything stays on your device.
      </Text>
      <Pressable style={styles.emptyBtn} onPress={() => setTab('library')}>
        <Ionicons name="albums-outline" size={18} color={colors.white} />
        <Text style={styles.emptyBtnText}>Browse collections</Text>
      </Pressable>
      <Pressable style={styles.emptyLink} onPress={refresh}>
        <Text style={styles.emptyLinkText}>{loadingLibrary ? 'Refreshing…' : 'Refresh library'}</Text>
      </Pressable>
    </View>
  );
}

function InfoSheet({ asset, liked, onToggleLike, onClose, insets }) {
  if (!asset) return null;
  const created = asset.creationTime ? new Date(asset.creationTime).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  }) : '—';
  const rows = [
    { icon: 'text', label: 'Name', value: prettyName(asset.filename) },
    { icon: 'time-outline', label: 'Duration', value: formatDuration(asset.duration) },
    { icon: 'resize-outline', label: 'Resolution', value: `${asset.width} × ${asset.height}` },
    { icon: 'calendar-outline', label: 'Created', value: created },
    { icon: 'document-outline', label: 'File', value: asset.filename },
  ];
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Clip details</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          {rows.map((r) => (
            <View key={r.label} style={styles.infoRow}>
              <Ionicons name={r.icon} size={18} color={colors.violet} style={{ width: 26 }} />
              <Text style={styles.infoLabel}>{r.label}</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{r.value}</Text>
            </View>
          ))}
        </ScrollView>
        <Pressable style={[styles.sheetAction, liked && { backgroundColor: 'rgba(255,59,107,0.16)', borderColor: 'rgba(255,59,107,0.4)' }]} onPress={onToggleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.like : colors.text} />
          <Text style={[styles.sheetActionText, liked && { color: colors.like }]}>
            {liked ? 'In your favorites' : 'Add to favorites'}
          </Text>
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
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  nowPlaying: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 32 },
  emptyOrb: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  emptyText: {
    color: colors.textDim,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.violet,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radius.pill,
    marginTop: 26,
  },
  emptyBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  emptyLink: { marginTop: 16, padding: 8 },
  emptyLinkText: { color: colors.textDim, fontWeight: '700', fontSize: 14 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
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
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.hairlineStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 14 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  infoLabel: { color: colors.textDim, fontSize: 14, fontWeight: '600', width: 92 },
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
