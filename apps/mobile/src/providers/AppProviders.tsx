import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as SystemUI from 'expo-system-ui';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  canHandleEmailLink,
  completePasswordlessSignIn,
  loadLegacyBookmarks,
  subscribeToAuth,
  subscribeToRemoteBookmarks,
  subscribeToRemoteSettings,
  syncUserProfile,
  syncUserSettings,
  pushBookmarksSnapshot,
} from '../lib/firebase';
import { initStorageAsync } from '../lib/mmkv';
import { initDatabaseAsync } from '../lib/sqlite';
import { theme } from '../lib/theme';
import { serializeBookmarks, useAppStore } from '../store/app-store';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000,
          },
        },
      })
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        await SystemUI.setBackgroundColorAsync(theme.colors.background);
        await initStorageAsync();
        await initDatabaseAsync();
      } catch {
        useAppStore.getState().setSyncState('error', 'تعذر تهيئة التخزين المحلي بشكل كامل.');
      }
      if (mounted) {
        setIsReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: theme.colors.background }} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthLinkBridge />
          <FirestoreSyncBridge />
          {children}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthLinkBridge() {
  useEffect(() => {
    let active = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !canHandleEmailLink(url)) {
        return;
      }

      useAppStore.getState().setSyncState('syncing', 'جارٍ إكمال تسجيل الدخول بالرابط البريدي...');
      try {
        await completePasswordlessSignIn(url);
        if (active) {
          useAppStore.getState().setSyncState('synced', 'تم تسجيل الدخول بالرابط البريدي بنجاح.');
        }
      } catch {
        if (active) {
          useAppStore.getState().setSyncState(
            'error',
            'تعذر إكمال تسجيل الدخول بالرابط. أعد إرسال الرابط أو افتحه على نفس الجهاز.'
          );
        }
      }
    };

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', (event) => {
      void handleUrl(event.url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return null;
}

function FirestoreSyncBridge() {
  useEffect(() => {
    let unsubscribeStore: (() => void) | undefined;
    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeBookmarks: (() => void) | undefined;
    let settingsTimeout: ReturnType<typeof setTimeout> | undefined;
    let bookmarksTimeout: ReturnType<typeof setTimeout> | undefined;
    let applyingRemoteState = false;
    let remoteBookmarkKeys: string[] = [];

    const stopRemoteListeners = () => {
      if (settingsTimeout) {
        clearTimeout(settingsTimeout);
      }
      if (bookmarksTimeout) {
        clearTimeout(bookmarksTimeout);
      }
      unsubscribeStore?.();
      unsubscribeSettings?.();
      unsubscribeBookmarks?.();
      unsubscribeStore = undefined;
      unsubscribeSettings = undefined;
      unsubscribeBookmarks = undefined;
      remoteBookmarkKeys = [];
    };

    const unsubscribeAuth = subscribeToAuth((user) => {
      stopRemoteListeners();

      if (!user) {
        useAppStore.getState().setSyncState('idle', 'سجّل الدخول لتفعيل المزامنة السحابية.');
        return;
      }

      useAppStore.getState().setSyncState('syncing', 'جارٍ ربط بياناتك مع Firebase...');
      void syncUserProfile(user.uid);

      unsubscribeSettings = subscribeToRemoteSettings(user.uid, (remoteSettings) => {
        if (!remoteSettings) {
          void syncUserSettings(user.uid, useAppStore.getState().settings);
          return;
        }

        const localSerialized = JSON.stringify(useAppStore.getState().settings);
        const remoteSerialized = JSON.stringify(remoteSettings);

        if (localSerialized !== remoteSerialized) {
          applyingRemoteState = true;
          useAppStore.getState().replaceSettings(remoteSettings);
          applyingRemoteState = false;
        }

        useAppStore.getState().setSyncState('synced', 'تم تحديث الإعدادات من Firebase.');
      });

      unsubscribeBookmarks = subscribeToRemoteBookmarks(user.uid, async ({ bookmarks, remoteKeys }) => {
        remoteBookmarkKeys = remoteKeys;

        if (!bookmarks.length) {
          const localBookmarks = useAppStore.getState().bookmarks;
          if (localBookmarks.length) {
            try {
              await pushBookmarksSnapshot(user.uid, localBookmarks, remoteKeys);
              return;
            } catch {
              useAppStore.getState().setSyncState('error', 'تعذر رفع الإشارات المرجعية المحلية.');
            }
          }

          const legacy = await loadLegacyBookmarks(user.uid);
          if (legacy.length) {
            try {
              await pushBookmarksSnapshot(user.uid, legacy, remoteKeys);
              return;
            } catch {
              useAppStore.getState().setSyncState('error', 'تعذر ترحيل الإشارات المرجعية القديمة.');
            }
          }
        }

        const localSerialized = serializeBookmarks(useAppStore.getState().bookmarks);
        const remoteSerialized = serializeBookmarks(bookmarks);

        if (localSerialized !== remoteSerialized) {
          applyingRemoteState = true;
          useAppStore.getState().replaceBookmarks(bookmarks);
          applyingRemoteState = false;
        }

        useAppStore.getState().setSyncState('synced', 'تم تحديث الإشارات المرجعية من Firebase.');
      });

      unsubscribeStore = useAppStore.subscribe((state, previousState) => {
        if (applyingRemoteState) {
          return;
        }

        if (JSON.stringify(state.settings) !== JSON.stringify(previousState.settings)) {
          useAppStore.getState().setSyncState('syncing', 'جارٍ مزامنة الإعدادات...');
          if (settingsTimeout) {
            clearTimeout(settingsTimeout);
          }

          settingsTimeout = setTimeout(() => {
            void syncUserSettings(user.uid, useAppStore.getState().settings)
              .then(() => syncUserProfile(user.uid))
              .then(() => {
                useAppStore.getState().setSyncState('synced', 'تمت مزامنة الإعدادات.');
              })
              .catch(() => {
                useAppStore.getState().setSyncState('error', 'تعذرت مزامنة الإعدادات.');
              });
          }, 400);
        }

        if (serializeBookmarks(state.bookmarks) !== serializeBookmarks(previousState.bookmarks)) {
          useAppStore.getState().setSyncState('syncing', 'جارٍ مزامنة الإشارات المرجعية...');
          if (bookmarksTimeout) {
            clearTimeout(bookmarksTimeout);
          }

          bookmarksTimeout = setTimeout(() => {
            void pushBookmarksSnapshot(user.uid, useAppStore.getState().bookmarks, remoteBookmarkKeys)
              .then(() => {
                useAppStore.getState().setSyncState('synced', 'تمت مزامنة الإشارات المرجعية.');
              })
              .catch(() => {
                useAppStore.getState().setSyncState('error', 'تعذرت مزامنة الإشارات المرجعية.');
              });
          }, 250);
        }
      });
    });

    return () => {
      stopRemoteListeners();
      unsubscribeAuth();
    };
  }, []);

  return null;
}
