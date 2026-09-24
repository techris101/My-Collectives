import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Linking, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, radius, brandGradient } from '../theme';
import { GradientButton } from '../components/ui';

function Feature({ icon, title, text }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color={colors.violet} />
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
  const { width } = useWindowDimensions();
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

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const denied = permission === 'denied';

  const onGrant = async () => {
    haptic('medium');
    const status = await requestPermission();
    if (status === 'granted') completeOnboarding();
    else if (denied) Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(139,92,246,0.22)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      />
      <Animated.View style={{ flex: 1, opacity: fade, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: 28 }}>
        <View style={styles.hero}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
              <Ionicons name="play" size={52} color={colors.white} style={{ marginLeft: 6 }} />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.brand}>My<Text style={{ color: colors.violet }}>Collectives</Text></Text>
          <Text style={styles.tagline}>Your own video reel — shuffled, offline, and entirely yours.</Text>
        </View>

        <View style={styles.features}>
          <Feature icon="infinite" title="Endless personal feed" text="Swipe through your own clips, reshuffled every session." />
          <Feature icon="cloud-offline" title="Fully offline" text="No internet, no uploads. Nothing ever leaves your phone." />
          <Feature icon="albums" title="Your collections" text="Play by album, or save favorites for instant replays." />
        </View>

        <View>
          {denied ? (
            <Text style={styles.deniedNote}>
              Access is currently off. Enable media access in Settings to build your reel.
            </Text>
          ) : null}
          <GradientButton
            label={denied ? 'Open Settings' : 'Grant media access'}
            icon={denied ? 'settings-outline' : 'lock-open'}
            onPress={onGrant}
          />
          <Text style={styles.privacy}>MyCollectives only reads video files to play them. It never modifies or shares them.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: 'center', marginTop: 12 },
  logo: {
    width: 108,
    height: 108,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.violet,
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  brand: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.6, marginTop: 26 },
  tagline: { color: colors.textDim, fontSize: 15.5, lineHeight: 22, textAlign: 'center', marginTop: 12, paddingHorizontal: 10 },
  features: { flex: 1, justifyContent: 'center', gap: 8, marginTop: 20 },
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
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTitle: { color: colors.text, fontSize: 15.5, fontWeight: '800' },
  featureText: { color: colors.textDim, fontSize: 13, lineHeight: 18, marginTop: 3 },
  deniedNote: { color: colors.pink, fontSize: 13.5, fontWeight: '600', textAlign: 'center', marginBottom: 14 },
  privacy: { color: colors.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 16 },
});
