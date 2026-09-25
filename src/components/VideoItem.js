import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { colors } from '../theme';
import { prettyName, formatDuration } from '../lib/format';

function RailAction({ icon, label, color = colors.white, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const bounce = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.22, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };
  return (
    <Pressable
      onPress={() => {
        bounce();
        onPress && onPress();
      }}
      style={styles.railBtn}
      hitSlop={6}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={icon} size={29} color={color} />
      </Animated.View>
      {label ? <Text style={styles.railLabel}>{label}</Text> : null}
    </Pressable>
  );
}

export default function VideoItem({
  asset,
  height,
  active,
  globalMuted,
  loop,
  liked,
  collectionTitle,
  bottomInset,
  onToggleMute,
  onToggleLike,
  onShare,
  onOpenInfo,
  onFailed,
}) {
  const videoRef = useRef(null);
  const [uri, setUri] = useState(asset.localUri || asset.uri);
  const [userPaused, setUserPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const failTimer = useRef(null);
  const startedRef = useRef(false);

  const progress = useRef(new Animated.Value(0)).current;
  const pauseIcon = useRef(new Animated.Value(0)).current;
  const heart = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const tapTimer = useRef(null);

  // Resolve a reliably-playable local uri (only when needed).
  useEffect(() => {
    let alive = true;
    (async () => {
      if (asset.localUri) return;
      try {
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        if (alive && info.localUri) setUri(info.localUri);
      } catch (e) {}
    })();
    return () => {
      alive = false;
    };
  }, [asset]);

  // Reset paused state + start a watchdog when this item becomes active.
  useEffect(() => {
    if (!active) return;
    setUserPaused(false);
    startedRef.current = false;
    if (failTimer.current) clearTimeout(failTimer.current);
    failTimer.current = setTimeout(() => {
      if (!startedRef.current) onFailed && onFailed();
    }, 9000);
    return () => {
      if (failTimer.current) clearTimeout(failTimer.current);
    };
  }, [active]);

  const shouldPlay = active && !userPaused;

  const onStatus = useCallback(
    (s) => {
      if (!s.isLoaded) {
        // A hard playback error — skip to the next clip.
        if (s.error && active) onFailed && onFailed();
        return;
      }
      setBuffering(!!s.isBuffering && !s.isPlaying);
      if (s.isPlaying || s.positionMillis > 0) {
        startedRef.current = true;
        if (failTimer.current) clearTimeout(failTimer.current);
      }
      if (s.durationMillis) {
        progress.setValue(Math.min(1, s.positionMillis / s.durationMillis));
      }
    },
    [progress, active, onFailed]
  );

  const flashPause = (show) => {
    Animated.timing(pauseIcon, { toValue: show ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  };

  const burstHeart = () => {
    heart.setValue(0);
    Animated.sequence([
      Animated.spring(heart, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }),
      Animated.timing(heart, { toValue: 0, duration: 420, delay: 250, useNativeDriver: true }),
    ]).start();
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 260) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = 0;
      if (!liked) onToggleLike && onToggleLike();
      burstHeart();
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        setUserPaused((p) => {
          const np = !p;
          flashPause(np);
          return np;
        });
      }, 260);
    }
  };

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPress={handleTap} style={[styles.page, { height }]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.CONTAIN}
        isMuted={globalMuted}
        isLooping={loop}
        shouldPlay={shouldPlay}
        progressUpdateIntervalMillis={200}
        onPlaybackStatusUpdate={onStatus}
      />

      {active && buffering ? (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator size="large" color="rgba(255,255,255,0.85)" />
        </View>
      ) : null}

      {/* Pause glyph */}
      <Animated.View
        style={[styles.center, { opacity: pauseIcon, transform: [{ scale: pauseIcon.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }]}
        pointerEvents="none"
      >
        <View style={styles.playCircle}>
          <Ionicons name="play" size={40} color={colors.white} />
        </View>
      </Animated.View>

      {/* Double-tap heart burst */}
      <Animated.View
        style={[styles.center, { opacity: heart, transform: [{ scale: heart.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] }) }] }]}
        pointerEvents="none"
      >
        <Ionicons name="heart" size={120} color={colors.white} />
      </Animated.View>

      {/* Right action rail */}
      <View style={[styles.rail, { bottom: bottomInset + 20 }]}>
        <RailAction icon={liked ? 'heart' : 'heart-outline'} label="Like" onPress={onToggleLike} />
        <RailAction icon={globalMuted ? 'volume-mute' : 'volume-high'} label={globalMuted ? 'Muted' : 'Sound'} onPress={onToggleMute} />
        <RailAction icon="share-social-outline" label="Share" onPress={onShare} />
        <RailAction icon="ellipsis-horizontal" label="Info" onPress={onOpenInfo} />
      </View>

      {/* Meta */}
      <View style={[styles.meta, { bottom: bottomInset + 18 }]}>
        {collectionTitle ? (
          <Text style={styles.coll} numberOfLines={1}>{collectionTitle.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>{prettyName(asset.filename)}</Text>
        <Text style={styles.sub}>{formatDuration(asset.duration)} · {asset.width}×{asset.height}</Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { bottom: bottomInset }]} pointerEvents="none">
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { width: '100%', backgroundColor: colors.black, justifyContent: 'center' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  rail: { position: 'absolute', right: 12, alignItems: 'center' },
  railBtn: { alignItems: 'center', marginBottom: 20 },
  railLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 5,
  },
  meta: { position: 'absolute', left: 18, right: 82 },
  coll: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 5,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 8,
  },
  sub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 5,
  },
  progressTrack: { position: 'absolute', left: 0, right: 0, height: 2.5, backgroundColor: 'rgba(255,255,255,0.18)' },
  progressFill: { height: 2.5, backgroundColor: colors.white },
});
