import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';
import { PrimaryButton } from '../components/ui';

function Feature({ icon, title, text }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={19} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { permission, requestPermission, completeOnboarding, haptic } = useApp();

  const float = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const blocked = permission === 'blocked';

  const onGrant = async () => {
    haptic('medium');
    if (blocked) {
      Linking.openSettings();
      return;
    }
    const status = await requestPermission();
    if (status === 'granted') completeOnboarding();
    else if (status === 'blocked') Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fade,
          paddingTop: insets.top + 44,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 28,
        }}
      >
        <View style={styles.hero}>
          <Animated.View style={[styles.logo, { transform: [{ translateY }] }]}>
            <Ionicons name="play" size={46} color={colors.black} style={{ marginLeft: 5 }} />
          </Animated.View>
          <Text style={styles.brand}>MyCollectives</Text>
          <Text style={styles.tagline}>Your own video reel — shuffled, offline, entirely yours.</Text>
        </View>

        <View style={styles.features}>
          <Feature icon="infinite" title="Endless personal feed" text="Swipe your own clips, reshuffled every session." />
          <Feature icon="cloud-offline" title="Fully offline" text="No internet, no uploads. Nothing leaves your phone." />
          <Feature icon="albums" title="Your collections" text="Play by album, or save favorites for instant replays." />
        </View>

        <View>
          {blocked ? (
            <Text style={styles.deniedNote}>
              Media access is turned off. Enable it in Settings to build your reel.
            </Text>
          ) : null}
          <PrimaryButton
            label={blocked ? 'Open settings' : 'Allow media access'}
            icon={blocked ? 'settings-outline' : 'lock-open'}
            onPress={onGrant}
          />
          <Text style={styles.privacy}>MyCollectives only reads video files to play them — it never edits or shares them.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', marginTop: 12 },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...(colors.card || {}),
  },
  brand: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 26 },
  tagline: { color: colors.textDim, fontSize: 15.5, lineHeight: 22, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },
  features: { flex: 1, justifyContent: 'center', marginTop: 20 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: 16,
    marginVertical: 6,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.surfaceHi,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  featureText: { color: colors.textDim, fontSize: 13, lineHeight: 18, marginTop: 3 },
  deniedNote: { color: colors.textDim, fontSize: 13.5, fontWeight: '600', textAlign: 'center', marginBottom: 14 },
  privacy: { color: colors.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 16 },
});
