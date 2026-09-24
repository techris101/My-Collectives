import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme';
import Onboarding from './src/screens/Onboarding';
import FeedScreen from './src/screens/FeedScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TabBar from './src/components/TabBar';

function Root() {
  const { booting, permission, seenOnboarding, tab } = useApp();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, []);

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.violet} size="large" />
      </View>
    );
  }

  const needsOnboarding = permission !== 'granted' || !seenOnboarding;
  if (needsOnboarding) {
    return (
      <>
        <StatusBar style="light" />
        <Onboarding />
      </>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {tab === 'feed' && <FeedScreen />}
        {tab === 'library' && <LibraryScreen />}
        {tab === 'favorites' && <FavoritesScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </View>
      <TabBar />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1 },
  boot: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
