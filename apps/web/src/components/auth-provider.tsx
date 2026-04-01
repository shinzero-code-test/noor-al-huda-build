'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

import {
  completeWebEmailLink,
  loadTrackerEntries,
  loginAsGuest,
  loginWithEmail,
  loginWithGoogle,
  logoutWebUser,
  saveUserSettings,
  saveTrackerEntries,
  sendWebPasswordReset,
  sendWebPasswordlessLink,
  signUpWithEmail,
  subscribeBookmarks,
  subscribeUserSettings,
  syncBookmarks,
  watchAuth,
  type PrivacyMode,
  type TrackerEntry,
  type WebBookmark,
} from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  privacyMode: PrivacyMode;
  bookmarks: WebBookmark[];
  trackerEntries: TrackerEntry[];
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  setPrivacyMode: (mode: PrivacyMode) => Promise<void>;
  setBookmarks: (items: WebBookmark[]) => Promise<void>;
  setTrackerEntries: (items: TrackerEntry[]) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const BOOKMARKS_KEY = 'noor-web-bookmarks';
const TRACKER_KEY = 'noor-web-worship-log';
const PRIVACY_KEY = 'noor-web-privacy-mode';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? 'null') as T ?? fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyModeState] = useState<PrivacyMode>('full');
  const [bookmarks, setBookmarksState] = useState<WebBookmark[]>([]);
  const [trackerEntries, setTrackerEntriesState] = useState<TrackerEntry[]>([]);

  useEffect(() => {
    setPrivacyModeState(readJson<PrivacyMode>(PRIVACY_KEY, 'full'));
    setBookmarksState(readJson<WebBookmark[]>(BOOKMARKS_KEY, []));
    setTrackerEntriesState(readJson<TrackerEntry[]>(TRACKER_KEY, []));

    if (typeof window !== 'undefined') {
      void completeWebEmailLink(window.location.href).catch(() => undefined);
    }

    const unsubscribe = watchAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const localPrivacy = readJson<PrivacyMode>(PRIVACY_KEY, 'full');
    void saveUserSettings(user.uid, { privacyMode: localPrivacy });

    const unsubscribeSettings = subscribeUserSettings(user.uid, (settings) => {
      const next = settings?.privacyMode ?? readJson<PrivacyMode>(PRIVACY_KEY, 'full');
      setPrivacyModeState(next);
      window.localStorage.setItem(PRIVACY_KEY, JSON.stringify(next));
    });

    const unsubscribeBookmarks = subscribeBookmarks(user.uid, (items) => {
      if (items.length) {
        setBookmarksState(items);
        window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
      } else {
        const localBookmarks = readJson<WebBookmark[]>(BOOKMARKS_KEY, []);
        if (localBookmarks.length) {
          void syncBookmarks(user.uid, localBookmarks);
        }
      }
    });

    void loadTrackerEntries(user.uid).then((items) => {
      if (items.length) {
        setTrackerEntriesState(items);
        window.localStorage.setItem(TRACKER_KEY, JSON.stringify(items));
      } else {
        const localEntries = readJson<TrackerEntry[]>(TRACKER_KEY, []);
        if (localEntries.length) {
          void saveTrackerEntries(user.uid, localEntries);
        }
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeBookmarks();
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    privacyMode,
    bookmarks,
    trackerEntries,
    signUp: async (email, password) => {
      await signUpWithEmail(email, password);
    },
    signIn: async (email, password) => {
      await loginWithEmail(email, password);
    },
    signInGoogle: async () => {
      await loginWithGoogle();
    },
    signInGuest: async () => {
      await loginAsGuest();
    },
    signOut: async () => {
      await logoutWebUser();
    },
    sendReset: async (email) => {
      await sendWebPasswordReset(email);
    },
    sendMagicLink: async (email) => {
      await sendWebPasswordlessLink(email);
    },
    setPrivacyMode: async (mode) => {
      setPrivacyModeState(mode);
      window.localStorage.setItem(PRIVACY_KEY, JSON.stringify(mode));
      if (user) {
        await saveUserSettings(user.uid, { privacyMode: mode });
      }
    },
    setBookmarks: async (items) => {
      setBookmarksState(items);
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
      if (user) {
        await syncBookmarks(user.uid, items);
      }
    },
    setTrackerEntries: (items) => {
      setTrackerEntriesState(items);
      window.localStorage.setItem(TRACKER_KEY, JSON.stringify(items));
    },
  }), [bookmarks, loading, privacyMode, trackerEntries, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
