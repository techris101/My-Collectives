import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { colors } from '../theme';
import { prettyName, formatDuration } from '../lib/format';

function RailAction({ icon, label, color = colors.white, onPress, filled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const bounce = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, speed: 50 }),
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
      <Animated.View style={[styles.railIcon, { transform: [{ scale }] }]}>
        <Ionicons name={icon} size={30} color={color} />
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
  onShuffle,
  onOpenInfo,
}) {
  const videoRef = useRef(null);
  const [uri, setUri] = useState(asset.localUri || asset.uri);
  const [status, setStatus] = useState({});
  const [userPaused, setUserPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);

  const progress = useRef(new Animated.Value(0)).current;
  const pauseIcon = useRef(new Animated.Value(0)).current;
  const heart = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const tapTimer = useRef(null);

  // Resolve a reliably-playable local uri.
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

  // Reset paused state when this item becomes active.
  useEffect(() => {
    if (active) setUserPaused(false);
  }, [active]);

  const shouldPlay = active && !userPaused;

  const onStatus = useCallback(
    (s) => {
      setStatus(s);
      if (!s.isLoaded) return;
      setBuffering(!!s.isBuffering && !s.isPlaying);
      if (s.durationMillis) {
        progress.setValue(Math.min(1, s.positionMillis / s.durationMillis));
      }
    },
    [progress]
  );

  const flashPause = (show) => {
    Animated.timing(pauseIcon, {
      toValue: show ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
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
      // double tap -> like
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = 0;
      if (!liked) onToggleLike && onToggleLike();
      burstHeart();
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        // single tap -> play/pause
        setUserPaused((p) => {
          const np = !p;
          flashPause(np);
          return np;
        });
      }, 260);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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

      {/* Buffering spinner */}
      {active && buffering ? (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator size="large" color="rgba(255,255,255,0.9)" />
        </View>
      ) : null}

      {/* Pause glyph */}
      <Animated.View
        style={[styles.center, { opacity: pauseIcon, transform: [{ scale: pauseIcon.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}
        pointerEvents="none"
      >
        <View style={styles.playCircle}>
          <Ionicons name="play" size={44} color={colors.white} />
        </View>
      </Animated.View>

      {/* Double-tap heart burst */}
      <Animated.View
        style={[
          styles.center,
          {
            opacity: heart,
            transform: [
              { scale: heart.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.15] }) },
              { rotate: '-12deg' },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Ionicons name="heart" size={128} color={colors.like} />
      </Animated.View>

      {/* Bottom gradient for text legibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
        style={[styles.bottomScrim, { height: height * 0.4 }]}
        pointerEvents="none"
      />

      {/* Right action rail */}
      <View style={[styles.rail, { bottom: bottomInset + 24 }]}>
        <RailAction
          icon={liked ? 'heart' : 'heart-outline'}
          color={liked ? colors.like : colors.white}
          label="Like"
          onPress={onToggleLike}
        />
        <RailAction
          icon={globalMuted ? 'volume-mute' : 'volume-high'}
          label={globalMuted ? 'Muted' : 'Sound'}
          onPress={onToggleMute}
        />
        <RailAction icon="shuffle" label="Shuffle" onPress={onShuffle} />
        <RailAction icon="information-circle-outline" label="Info" onPress={onOpenInfo} />
      </View>

      {/* Meta */}
      <View style={[styles.meta, { bottom: bottomInset + 22 }]}>
        {collectionTitle ? (
          <View style={styles.collPill}>
            <Ionicons name="albums" size={12} color={colors.white} />
            <Text style={styles.collText} numberOfLines={1}>
              {collectionTitle}
            </Text>
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {prettyName(asset.filename)}
        </Text>
        <Text style={styles.sub}>
          {formatDuration(asset.duration)} · {asset.width}×{asset.height}
        </Text>
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
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
  },
  bottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  rail: { position: 'absolute', right: 12, alignItems: 'center' },
  railBtn: { alignItems: 'center', marginBottom: 22 },
  railIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
  },
  railLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  meta: { position: 'absolute', left: 18, right: 86 },
  collPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  collText: { color: colors.white, fontSize: 12, fontWeight: '700', marginLeft: 5, maxWidth: 200 },
  title: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  sub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  progressFill: { height: 3, backgroundColor: colors.white },
});
