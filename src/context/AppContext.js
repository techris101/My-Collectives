import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { store, defaultSettings } from '../lib/storage';
import { shuffleArray } from '../lib/format';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const MAX_VIDEOS = 4000;
const FIRST_PAGE = 240; // enough to start the reel instantly
const PAGE = 500; // background pages after that
const MAX_ALBUMS = 80;

// Map an expo-media-library permission response to our simple states.
function mapPermission(res) {
  if (!res) return 'denied';
  const ok = res.granted === true || res.accessPrivileges === 'limited' || res.status === 'granted';
  if (ok) return 'granted';
  if (res.canAskAgain === false) return 'blocked';
  return 'denied';
}

export function AppProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [permission, setPermission] = useState('undetermined'); // undetermined | granted | denied | blocked
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const [videos, setVideos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [settings, setSettingsState] = useState(defaultSettings);

  const [tab, setTab] = useState('feed');
  const [feed, setFeed] = useState({ source: { type: 'all', title: 'For You' }, assets: [], startIndex: 0, seed: 0 });

  const favSet = useMemo(() => new Set(favorites), [favorites]);
  const seedRef = useRef(0);

  // ---- boot ----
  useEffect(() => {
    (async () => {
      const [fav, s, seen, perm] = await Promise.all([
        store.getFavorites(),
        store.getSettings(),
        store.getSeenOnboarding(),
        MediaLibrary.getPermissionsAsync().catch(() => null),
      ]);
      setFavorites(fav);
      setSettingsState(s);
      setSeenOnboarding(seen);
      const status = perm ? mapPermission(perm) : 'undetermined';
      setPermission(status);
      setBooting(false);
      if (status === 'granted') loadLibrary(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const haptic = useCallback(
    (kind = 'light') => {
      if (!settings.hapticsOn) return;
      try {
        if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        else if (kind === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (kind === 'select') Haptics.selectionAsync();
      } catch (e) {}
    },
    [settings.hapticsOn]
  );

  // ---- permissions ----
  const requestPermission = useCallback(async () => {
    try {
      const res = await MediaLibrary.requestPermissionsAsync();
      const status = mapPermission(res);
      setPermission(status);
      if (status === 'granted') loadLibrary(true);
      return status;
    } catch (e) {
      setPermission('denied');
      return 'denied';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- library loading (staged: fast first page, rest in background) ----
  const loadLibrary = useCallback(async (resetFeed = false) => {
    setLoadingLibrary(true);
    try {
      const first = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.video,
        first: FIRST_PAGE,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      const initial = first.assets || [];
      setVideos(initial);
      if (resetFeed) {
        setFeed({
          source: { type: 'all', title: 'For You' },
          assets: shuffleArray(initial),
          startIndex: 0,
          seed: seedRef.current,
        });
      }
      setLoadingLibrary(false);

      // Background: pull the remaining videos, then compute collections.
      (async () => {
        let all = initial;
        let cursor = first.endCursor;
        let hasNext = first.hasNextPage;
        while (hasNext && all.length < MAX_VIDEOS) {
          try {
            const page = await MediaLibrary.getAssetsAsync({
              mediaType: MediaLibrary.MediaType.video,
              first: PAGE,
              after: cursor,
              sortBy: [[MediaLibrary.SortBy.creationTime, false]],
            });
            all = all.concat(page.assets || []);
            cursor = page.endCursor;
            hasNext = page.hasNextPage;
            setVideos([...all]);
          } catch (e) {
            break;
          }
        }
        loadAlbums();
      })();
    } catch (e) {
      setVideos([]);
      setLoadingLibrary(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlbums = useCallback(async () => {
    try {
      const raw = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      const sliced = raw.slice(0, MAX_ALBUMS);
      const counted = await Promise.all(
        sliced.map(async (a) => {
          try {
            const r = await MediaLibrary.getAssetsAsync({
              album: a,
              mediaType: MediaLibrary.MediaType.video,
              first: 1,
            });
            return { id: a.id, title: a.title, count: r.totalCount, cover: r.assets?.[0] || null };
          } catch (e) {
            return { id: a.id, title: a.title, count: 0, cover: null };
          }
        })
      );
      setAlbums(counted.filter((a) => a.count > 0).sort((x, y) => y.count - x.count));
    } catch (e) {
      setAlbums([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (permission === 'granted') await loadLibrary(false);
  }, [permission, loadLibrary]);

  // ---- favorites ----
  const isFavorite = useCallback((id) => favSet.has(id), [favSet]);

  const toggleFavorite = useCallback(
    (id) => {
      setFavorites((prev) => {
        const exists = prev.includes(id);
        const next = exists ? prev.filter((x) => x !== id) : [id, ...prev];
        store.setFavorites(next);
        return next;
      });
      haptic(favSet.has(id) ? 'light' : 'success');
    },
    [favSet, haptic]
  );

  const favoriteVideos = useMemo(() => videos.filter((v) => favSet.has(v.id)), [videos, favSet]);

  // ---- settings ----
  const updateSettings = useCallback((patch) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      store.setSettings(next);
      return next;
    });
  }, []);

  // ---- feed sourcing ----
  const playSource = useCallback(
    async (source, startIndex = 0) => {
      let assets = [];
      try {
        if (source.type === 'favorites') {
          assets = videos.filter((v) => favSet.has(v.id));
        } else if (source.type === 'album') {
          const r = await MediaLibrary.getAssetsAsync({
            album: source.albumId,
            mediaType: MediaLibrary.MediaType.video,
            first: MAX_VIDEOS,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          assets = r.assets || [];
        } else {
          assets = videos;
        }
      } catch (e) {
        assets = videos;
      }
      const ordered = settings.shuffle && source.type !== 'ordered' ? shuffleArray(assets) : assets;
      seedRef.current += 1;
      setFeed({ source, assets: ordered, startIndex, seed: seedRef.current });
      setTab('feed');
    },
    [videos, favSet, settings.shuffle]
  );

  const reshuffle = useCallback(() => {
    setFeed((prev) => {
      seedRef.current += 1;
      return { ...prev, assets: shuffleArray(prev.assets), startIndex: 0, seed: seedRef.current };
    });
    haptic('medium');
  }, [haptic]);

  const completeOnboarding = useCallback(() => {
    setSeenOnboarding(true);
    store.setSeenOnboarding(true);
  }, []);

  const value = {
    booting,
    seenOnboarding,
    completeOnboarding,
    permission,
    requestPermission,
    loadingLibrary,
    videos,
    albums,
    favorites,
    favoriteVideos,
    isFavorite,
    toggleFavorite,
    settings,
    updateSettings,
    tab,
    setTab,
    feed,
    playSource,
    reshuffle,
    refresh,
    haptic,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
