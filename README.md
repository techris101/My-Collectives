# MyCollectives 🎬

A TikTok-style vertical video reel that shuffles and plays your **local video library** — no internet, no algorithms, no accounts. Just your own footage, reshuffled every time you open it.

Built with **React Native + Expo (SDK 51)**.

## Features

- **Personal reel** — full-screen, vertically-swipeable feed of your own videos
- **Shuffle** — every session reorders your clips; reshuffle any time
- **Collections** — play by device album, or by your favorites
- **Favorites** — double-tap or tap the heart to save clips for instant replays
- **Player controls** — tap to pause, mute/unmute, live progress bar, clip details
- **Fully offline & private** — videos are only ever read to play them; nothing is uploaded, modified, or shared
- **Premium dark UI** — glass tab bar, violet→pink accents, haptics, smooth animations

## Project structure

```
App.js                     App shell + tab routing
index.js                   Entry point
app.json                   Expo config (icons, splash, Android permissions)
src/
  theme.js                 Design system (colors, radii, type, gradients)
  context/AppContext.js    Global state: media, favorites, settings, feed
  lib/                     storage (AsyncStorage) + formatting helpers
  components/              VideoItem, Thumb, TabBar, shared UI
  screens/                 Onboarding, Feed, Library, Favorites, Settings
```

## Run in development

```bash
npm install
npx expo start
```

Open in **Expo Go** (Android) or a dev build. On first launch, grant media access so the app can read your videos.

## Build an installable Android APK

**Local build** (requires JDK 17 + Android SDK):

```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

The APK lands at `android/app/build/outputs/apk/release/app-release.apk`.

**Cloud build** (no local Android SDK, requires a free Expo account):

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

## Privacy

MyCollectives requests read-only access to your media purely to list and play your videos. It has no network code, no analytics, and no sign-in. Your library never leaves your device.
