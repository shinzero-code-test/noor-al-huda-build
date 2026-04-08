import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInAnonymously,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { buildEmailLinkActionSettings } from '../features/auth/email-link';
import { type Bookmark, type UserSettings } from '../types/domain';
import { bookmarkKey } from '../store/app-store';

const firebaseRnAuth = require('@firebase/auth/dist/rn/index.js') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => unknown;
};

type FirebaseExtra = {
  firebase?: {
    apiKey?: string;
    appId?: string;
    projectId?: string;
    authDomain?: string;
    messagingSenderId?: string;
    storageBucket?: string;
  };
};

const extra = (Constants.expoConfig?.extra ?? {}) as FirebaseExtra;
const firebaseConfig = extra.firebase;
const pendingEmailStorageKey = 'noor-al-huda:pending-email-link';

const hasFirebaseConfig = Boolean(
  firebaseConfig?.apiKey && firebaseConfig?.appId && firebaseConfig?.projectId
);

let firebaseApp: FirebaseApp | null = null;

if (hasFirebaseConfig) {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig!);
}

export const auth = firebaseApp
  ? (() => {
      try {
        return initializeAuth(firebaseApp!, {
          persistence: firebaseRnAuth.getReactNativePersistence(AsyncStorage) as never,
        });
      } catch {
        return getAuth(firebaseApp!);
      }
    })()
  : null;

export const db = firebaseApp ? getFirestore(firebaseApp) : null;

export { hasFirebaseConfig };

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, callback);
}

export async function registerWithEmail(email: string, password: string, name: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  return credential.user;
}

export async function loginWithEmail(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function continueAsGuest() {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function sendPasswordResetLink(email: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  await sendPasswordResetEmail(auth, email.trim());
}

export async function sendPasswordlessSignInLink(email: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const normalizedEmail = email.trim();
  await sendSignInLinkToEmail(
    auth,
    normalizedEmail,
    buildEmailLinkActionSettings(firebaseConfig?.authDomain ?? 'noor-al-huda-260326.firebaseapp.com')
  );
  await AsyncStorage.setItem(pendingEmailStorageKey, normalizedEmail);
}

export function canHandleEmailLink(url: string) {
  if (!auth) {
    return false;
  }

  return isSignInWithEmailLink(auth, url);
}

export async function getPendingEmailForLink() {
  return AsyncStorage.getItem(pendingEmailStorageKey);
}

export async function completePasswordlessSignIn(emailLink: string, email?: string | null) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const resolvedEmail = email?.trim() || (await AsyncStorage.getItem(pendingEmailStorageKey));
  if (!resolvedEmail) {
    throw new Error('تعذر تحديد البريد الإلكتروني المطلوب لإكمال تسجيل الدخول بالرابط.');
  }

  const credential = await signInWithEmailLink(auth, resolvedEmail, emailLink);
  await AsyncStorage.removeItem(pendingEmailStorageKey);
  return credential.user;
}

export async function sendVerificationEmailToCurrentUser() {
  if (!auth?.currentUser) {
    throw new Error('لا يوجد مستخدم حالي لإرسال رسالة التحقق.');
  }

  await sendEmailVerification(auth.currentUser);
}

export async function reloadCurrentUser() {
  if (!auth?.currentUser) {
    return null;
  }

  await reload(auth.currentUser);
  return auth.currentUser;
}

export function getCurrentUser() {
  return auth?.currentUser ?? null;
}

export async function logoutUser() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

export async function syncUserSettings(uid: string, settings: UserSettings) {
  if (!db) {
    return;
  }

  await setDoc(
    doc(db, 'users', uid),
    {
      profile: {
        updatedAt: serverTimestamp(),
      },
      settings,
    },
    { merge: true }
  );
}

export async function syncUserProfile(uid: string) {
  if (!db || !auth?.currentUser || auth.currentUser.uid !== uid) {
    return;
  }

  await setDoc(
    doc(db, 'users', uid),
    {
      profile: {
        displayName: auth.currentUser.displayName ?? null,
        email: auth.currentUser.email ?? null,
        emailVerified: auth.currentUser.emailVerified,
        isAnonymous: auth.currentUser.isAnonymous,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}

export async function syncWorshipAggregate(
  uid: string,
  weekKey: string,
  aggregate: {
    total_actions: number;
    tahajjud_count: number;
    fasting_count: number;
    quran_pages: number;
  }
) {
  if (!db) {
    return;
  }

  await setDoc(
    doc(db, 'users', uid, 'weekly_stats', weekKey),
    {
      ...aggregate,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveBookmark(uid: string, bookmark: Bookmark) {
  if (!db) {
    return;
  }

  await addDoc(collection(db, 'quran_bookmarks'), {
    userId: uid,
    surahId: bookmark.surahId,
    surahName: bookmark.surahName,
    ayahNumber: bookmark.ayahNumber,
    createdAt: serverTimestamp(),
  });
}

export async function pushBookmarksSnapshot(uid: string, bookmarks: Bookmark[], remoteKeys: string[]) {
  if (!db) {
    return;
  }

  const batch = writeBatch(db);
  const remoteKeySet = new Set(remoteKeys);
  const localKeySet = new Set(bookmarks.map((bookmark) => bookmarkKey(bookmark)));

  for (const bookmark of bookmarks) {
    const key = bookmarkKey(bookmark);
    batch.set(doc(db, 'users', uid, 'bookmarks', key), {
      surahId: bookmark.surahId,
      surahName: bookmark.surahName,
      ayahNumber: bookmark.ayahNumber,
      createdAt: bookmark.createdAt,
      updatedAt: serverTimestamp(),
    });
  }

  for (const remoteKey of remoteKeySet) {
    if (!localKeySet.has(remoteKey)) {
      batch.delete(doc(db, 'users', uid, 'bookmarks', remoteKey));
    }
  }

  await batch.commit();
}

export function subscribeToRemoteSettings(
  uid: string,
  callback: (settings: UserSettings | null) => void
) {
  if (!db) {
    callback(null);
    return () => undefined;
  }

  return onSnapshot(doc(db, 'users', uid), (snapshot) => {
    const data = snapshot.data();
    const settings = data?.settings as UserSettings | undefined;
    callback(settings ?? null);
  });
}

export function subscribeToRemoteBookmarks(
  uid: string,
  callback: (payload: { bookmarks: Bookmark[]; remoteKeys: string[] }) => void
) {
  if (!db) {
    callback({ bookmarks: [], remoteKeys: [] });
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, 'users', uid, 'bookmarks'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      const bookmarks = snapshot.docs.map((entry) => normalizeBookmarkDocument(entry.data()));
      callback({
        bookmarks: bookmarks.filter((entry): entry is Bookmark => entry !== null),
        remoteKeys: snapshot.docs.map((entry) => entry.id),
      });
    }
  );
}

export async function loadLegacyBookmarks(uid: string): Promise<Bookmark[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, 'quran_bookmarks'), where('userId', '==', uid)));

  return snapshot.docs
    .map((entry) => normalizeBookmarkDocument(entry.data()))
    .filter((entry): entry is Bookmark => entry !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function loadBookmarks(uid: string): Promise<Bookmark[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, 'quran_bookmarks'), where('userId', '==', uid)));

  return snapshot.docs
    .map((entry) => entry.data())
    .map((entry) => ({
      surahId: Number(entry.surahId),
      surahName: String(entry.surahName),
      ayahNumber: Number(entry.ayahNumber),
      createdAt:
        typeof entry.createdAt?.toDate === 'function'
          ? entry.createdAt.toDate().toISOString()
          : new Date().toISOString(),
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function normalizeBookmarkDocument(entry: Record<string, unknown>): Bookmark | null {
  const surahId = Number(entry.surahId);
  const ayahNumber = Number(entry.ayahNumber);
  const surahName = String(entry.surahName ?? '');

  if (!surahId || !ayahNumber || !surahName) {
    return null;
  }

  let createdAt = new Date().toISOString();
  const source = entry.createdAt as
    | string
    | { toDate?: () => Date }
    | undefined;

  if (typeof source === 'string') {
    createdAt = source;
  } else if (typeof source?.toDate === 'function') {
    createdAt = source.toDate().toISOString();
  }

  return {
    surahId,
    surahName,
    ayahNumber,
    createdAt,
  };
}
