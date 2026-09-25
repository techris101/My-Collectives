import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator, PanResponder } from 'react-native';
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

function fmtMs(ms) {
  return formatDuration(Math.max(0, Math.floor((ms || 0) / 1000)));
}

// Draggable scrubber shown while paused.
function SeekBar({ width, position, duration, onSeek, bottom }) {
  const wRef = useRef(1);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;
  const [dragFrac, setDragFrac] = useState(null);

  const fracFromX = (x) => Math.max(0, Math.min(1, x / (wRef.current || 1)));

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setDragFrac(fracFromX(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => setDragFrac(fracFromX(e.nativeEvent.locationX)),
      onPanResponderRelease: (e) => {
        const f = fracFromX(e.nativeEvent.locationX);
        setDragFrac(null);
        onSeekRef.current && onSeekRef.current(f);
      },
      onPanResponderTerminate: () => setDragFrac(null),
    })
  ).current;

  const frac = dragFrac != null ? dragFrac : duration > 0 ? position / duration : 0;
  const shownMs = dragFrac != null ? dragFrac * duration : position;

  return (
    <View style={[styles.seekWrap, { bottom }]}>
      <View style={styles.seekTimes}>
        <Text style={styles.seekTime}>{fmtMs(shownMs)}</Text>
        <Text style={styles.seekTime}>{fmtMs(duration)}</Text>
      </View>
      <View
        style={styles.seekHit}
        onLayout={(e) => (wRef.current = e.nativeEvent.layout.width)}
        {...pan.panHandlers}
      >
        <View style={styles.seekTrack}>
          <View style={[styles.seekFill, { width: `${frac * 100}%` }]} />
        </View>
        <View style={[styles.seekThumb, { left: `${frac * 100}%` }]} />
      </View>
    </View>
  );
}

export default function VideoItem({
  asset,
  height,
  width,
  active,
  globalMuted,
  loop,
  liked,
  collectionTitle,
  bottomInset,
  doubleTapSeek,
  seekBarOnPause,
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
  const [posMs, setPosMs] = useState(0);
  const [durMs, setDurMs] = useState(0);

  const progress = useRef(new Animated.Value(0)).current;
  const pauseIcon = useRef(new Animated.Value(0)).current;
  const heart = useRef(new Animated.Value(0)).current;
  const seekFx = useRef(new Animated.Value(0)).current;
  const [seekSide, setSeekSide] = useState(null); // 'fwd' | 'back'
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const failTimer = useRef(null);
  const startedRef = useRef(false);

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

  const showSeek = userPaused && seekBarOnPause;
  const shouldPlay = active && !userPaused;

  const onStatus = useCallback(
    (s) => {
      if (!s.isLoaded) {
        if (s.error && active) onFailed && onFailed();
        return;
      }
      setBuffering(!!s.isBuffering && !s.isPlaying);
      if (s.isPlaying || s.positionMillis > 0) {
        startedRef.current = true;
        if (failTimer.current) clearTimeout(failTimer.current);
      }
      if (s.durationMillis) {
        setDurMs(s.durationMillis);
        progress.setValue(Math.min(1, s.positionMillis / s.durationMillis));
      }
      setPosMs(s.positionMillis || 0);
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

  const flashSeek = (side) => {
    setSeekSide(side);
    seekFx.setValue(0);
    Animated.sequence([
      Animated.timing(seekFx, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(seekFx, { toValue: 0, duration: 360, delay: 280, useNativeDriver: true }),
    ]).start(() => setSeekSide(null));
  };

  const seekBy = useCallback(async (deltaSec) => {
    try {
      const s = await videoRef.current.getStatusAsync();
      if (!s.isLoaded) return;
      const dur = s.durationMillis || 0;
      let np = (s.positionMillis || 0) + deltaSec * 1000;
      np = Math.max(0, dur ? Math.min(dur, np) : np);
      await videoRef.current.setStatusAsync({ positionMillis: np });
    } catch (e) {}
  }, []);

  const seekToFraction = useCallback(async (frac) => {
    try {
      const s = await videoRef.current.getStatusAsync();
      if (!s.isLoaded || !s.durationMillis) return;
      await videoRef.current.setStatusAsync({ positionMillis: Math.floor(frac * s.durationMillis) });
    } catch (e) {}
  }, []);

  const togglePause = () => {
    setUserPaused((p) => {
      const np = !p;
      flashPause(np);
      return np;
    });
  };

  const handleTap = (evt) => {
    const x = evt.nativeEvent.locationX;
    const now = Date.now();
    if (now - lastTap.current < 280) {
      // double tap
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = 0;
      const w = width || 1;
      const zone = x < w * 0.33 ? 'left' : x > w * 0.67 ? 'right' : 'center';
      if (doubleTapSeek && zone === 'left') {
        seekBy(-10);
        flashSeek('back');
      } else if (doubleTapSeek && zone === 'right') {
        seekBy(10);
        flashSeek('fwd');
      } else {
        if (!liked) onToggleLike && onToggleLike();
        burstHeart();
      }
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        togglePause();
      }, 280);
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

      {active && buffering && !userPaused ? (
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

      {/* Double-tap heart */}
      <Animated.View
        style={[styles.center, { opacity: heart, transform: [{ scale: heart.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] }) }] }]}
        pointerEvents="none"
      >
        <Ionicons name="heart" size={120} color={colors.white} />
      </Animated.View>

      {/* ±10s seek indicator */}
      {seekSide ? (
        <Animated.View
          style={[
            styles.seekFx,
            seekSide === 'fwd' ? { right: 0 } : { left: 0 },
            { opacity: seekFx, transform: [{ scale: seekFx.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] },
          ]}
          pointerEvents="none"
        >
          <Ionicons name={seekSide === 'fwd' ? 'play-forward' : 'play-back'} size={30} color={colors.white} />
          <Text style={styles.seekFxText}>10s</Text>
        </Animated.View>
      ) : null}

      {/* Right action rail */}
      <View style={[styles.rail, { bottom: bottomInset + 20 }]}>
        <RailAction icon={liked ? 'heart' : 'heart-outline'} label="Like" onPress={onToggleLike} />
        <RailAction icon={globalMuted ? 'volume-mute' : 'volume-high'} label={globalMuted ? 'Muted' : 'Sound'} onPress={onToggleMute} />
        <RailAction icon="share-social-outline" label="Share" onPress={onShare} />
        <RailAction icon="ellipsis-horizontal" label="Info" onPress={onOpenInfo} />
      </View>

      {/* Meta */}
      <View style={[styles.meta, { bottom: bottomInset + (showSeek ? 62 : 18) }]}>
        {collectionTitle ? (
          <Text style={styles.coll} numberOfLines={1}>{collectionTitle.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>{prettyName(asset.filename)}</Text>
        <Text style={styles.sub}>{formatDuration(asset.duration)} · {asset.width}×{asset.height}</Text>
      </View>

      {/* Seek bar (paused) or passive progress line */}
      {showSeek ? (
        <SeekBar width={width} position={posMs} duration={durMs} onSeek={seekToFraction} bottom={bottomInset + 6} />
      ) : (
        <View style={[styles.progressTrack, { bottom: bottomInset }]} pointerEvents="none">
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      )}
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
  seekFx: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '34%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  seekFxText: { color: colors.white, fontSize: 13, fontWeight: '800', marginTop: 4 },
  rail: { position: 'absolute', right: 12, alignItems: 'center' },
  railBtn: { alignItems: 'center', marginBottom: 20 },
  railLabel: { color: colors.white, fontSize: 11, fontWeight: '700', marginTop: 5, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 5 },
  meta: { position: 'absolute', left: 18, right: 82 },
  coll: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 5 },
  title: { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.2, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 8 },
  sub: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600', marginTop: 5, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 5 },
  progressTrack: { position: 'absolute', left: 0, right: 0, height: 2.5, backgroundColor: 'rgba(255,255,255,0.18)' },
  progressFill: { height: 2.5, backgroundColor: colors.white },

  seekWrap: { position: 'absolute', left: 16, right: 16 },
  seekTimes: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  seekTime: { color: colors.white, fontSize: 12, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 4 },
  seekHit: { height: 30, justifyContent: 'center' },
  seekTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
  seekFill: { height: 4, backgroundColor: colors.white },
  seekThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginLeft: -8,
    top: (30 - 16) / 2,
  },
});
