import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  favorites: '@mc/favorites',
  settings: '@mc/settings',
  seenOnboarding: '@mc/onboarding',
  hidden: '@mc/hidden',
};

export const defaultSettings = {
  shuffle: true,
  autoplay: true,
  loop: true,
  startMuted: false,
  showInfo: true,
  hapticsOn: true,
};

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // best-effort persistence
  }
}

export const store = {
  getFavorites: () => readJSON(KEYS.favorites, []),
  setFavorites: (ids) => writeJSON(KEYS.favorites, ids),

  getHidden: () => readJSON(KEYS.hidden, []),
  setHidden: (ids) => writeJSON(KEYS.hidden, ids),

  getSettings: async () => {
    const s = await readJSON(KEYS.settings, {});
    return { ...defaultSettings, ...s };
  },
  setSettings: (s) => writeJSON(KEYS.settings, s),

  getSeenOnboarding: () => readJSON(KEYS.seenOnboarding, false),
  setSeenOnboarding: (v) => writeJSON(KEYS.seenOnboarding, !!v),
};
