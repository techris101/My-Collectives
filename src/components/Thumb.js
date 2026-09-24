import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as MediaLibrary from 'expo-media-library';
import { colors, radius } from '../theme';
import { formatDuration } from '../lib/format';

// Module-level cache so thumbnails survive re-renders and scrolling.
const cache = new Map();

async function resolveUri(asset) {
  if (asset.localUri) return asset.localUri;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(asset);
    return info.localUri || asset.uri;
  } catch (e) {
    return asset.uri;
  }
}

export default function Thumb({ asset, style, rounded = radius.md, showDuration = true, iconSize = 24 }) {
  const [uri, setUri] = useState(cache.get(asset.id) || null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    if (cache.has(asset.id)) {
      setUri(cache.get(asset.id));
      return;
    }
    (async () => {
      try {
        const src = await resolveUri(asset);
        const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(src, {
          time: Math.min(1000, (asset.duration || 1) * 400),
          quality: 0.5,
        });
        if (!alive) return;
        cache.set(asset.id, thumb);
        setUri(thumb);
      } catch (e) {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [asset]);

  return (
    <View style={[styles.wrap, { borderRadius: rounded }, style]}>
      {uri ? (
        <Image source={{ uri }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={[styles.img, styles.fallback]}>
          {!failed ? (
            <ActivityIndicator color={colors.textMuted} />
          ) : (
            <Ionicons name="film-outline" size={iconSize} color={colors.textMuted} />
          )}
        </View>
      )}

      {/* Bottom scrim block for badge legibility */}
      <View style={styles.scrim} pointerEvents="none" />

      <View style={styles.playBadge} pointerEvents="none">
        <Ionicons name="play" size={11} color={colors.white} />
      </View>

      {showDuration && asset.duration ? (
        <View style={styles.durBadge} pointerEvents="none">
          <Text style={styles.durText}>{formatDuration(asset.duration)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.surface },
  img: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fallback: { backgroundColor: colors.surface },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, backgroundColor: 'rgba(0,0,0,0.28)' },
  playBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute',
    bottom: 7,
    right: 7,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  durText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
