import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as MediaLibrary from 'expo-media-library';
import { colors, radius } from '../theme';
import { formatDuration } from '../lib/format';

// Module-level cache so thumbnails survive re-renders and scrolling.
const cache = new Map();

// Deterministic soft gradient per asset so fallbacks still look designed.
const PALETTES = [
  ['#312E81', '#6D28D9'],
  ['#831843', '#BE185D'],
  ['#134E4A', '#0F766E'],
  ['#1E3A8A', '#4338CA'],
  ['#7C2D12', '#B45309'],
  ['#3B0764', '#7E22CE'],
];
function paletteFor(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return PALETTES[h % PALETTES.length];
}

async function resolveUri(asset) {
  if (asset.localUri) return asset.localUri;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(asset);
    return info.localUri || asset.uri;
  } catch (e) {
    return asset.uri;
  }
}

export default function Thumb({ asset, style, rounded = radius.md, showDuration = true, iconSize = 26 }) {
  const [uri, setUri] = useState(cache.get(asset.id) || null);
  const [failed, setFailed] = useState(false);
  const palette = paletteFor(asset.id);

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
          quality: 0.6,
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
        <LinearGradient colors={palette} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.img}>
          {!failed ? (
            <ActivityIndicator color="rgba(255,255,255,0.7)" />
          ) : (
            <Ionicons name="film-outline" size={iconSize} color="rgba(255,255,255,0.85)" />
          )}
        </LinearGradient>
      )}

      {/* Bottom scrim for legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Play glyph */}
      <View style={styles.playBadge} pointerEvents="none">
        <Ionicons name="play" size={12} color={colors.white} />
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
  playBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  durText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
