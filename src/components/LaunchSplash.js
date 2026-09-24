import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// A ~2s premium launch sequence: the icon falls in, settles onto the
// wordmark, does a subtle wiggle, then the whole thing fades away to reveal
// the app. Self-contained — renders null once finished.
export default function LaunchSplash() {
  const { height } = useWindowDimensions();
  const [done, setDone] = useState(false);

  const iconY = useRef(new Animated.Value(-height * 0.34)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconRot = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.9)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(12)).current;
  const overlay = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1 — fall in with a natural bounce landing
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(iconY, { toValue: 0, duration: 640, easing: Easing.bounce, useNativeDriver: true }),
      ]),
      // 2 — wordmark rises in while the icon gives a gentle wiggle
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(wordY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(iconRot, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(iconRot, { toValue: -1, duration: 110, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(iconRot, { toValue: 0.5, duration: 90, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(iconRot, { toValue: 0, duration: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]),
      // 3 — brief hold, then reveal the app
      Animated.delay(120),
      Animated.timing(overlay, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setDone(true));
  }, []);

  if (done) return null;

  const rotate = iconRot.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlay }]} pointerEvents="none">
      <View style={styles.lockup}>
        <Animated.View
          style={{
            opacity: iconOpacity,
            transform: [{ translateY: iconY }, { rotate }, { scale: iconScale }],
          }}
        >
          <View style={styles.icon}>
            <Ionicons name="play" size={40} color={colors.black} style={{ marginLeft: 4 }} />
          </View>
        </Animated.View>

        <Animated.Text style={[styles.wordmark, { opacity: wordOpacity, transform: [{ translateY: wordY }] }]}>
          MyCollectives
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  lockup: { alignItems: 'center' },
  icon: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 26,
  },
});
