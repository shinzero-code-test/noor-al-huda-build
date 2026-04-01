import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type User,
  getAuth,
} from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const pendingEmailKey = 'noor-web-pending-email-link';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyA0Q7SFUTkvj8iyzCM2aYk0lDwuxuMNXDE',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:1024474386791:web:afa7b5df1cde4bfd2adfc2',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'noor-al-huda-260326',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'noor-al-huda-260326.firebaseapp.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '1024474386791',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'noor-al-huda-260326.firebasestorage.app',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

void setPersistence(auth, browserLocalPersistence);

export type PrivacyMode = 'full' | 'partial' | 'private';

export type WebBookmark = {
  surah: number;
  ayah: number;
  label: string;
};

export type TrackerEntry = {
  date: string;
  activity: string;
  value: number;
};

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await sendEmailVerification(credential.user);
  await syncUserProfile(credential.user);
  return credential.user;
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncUserProfile(credential.user);
  return credential.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  await syncUserProfile(credential.user);
  return credential.user;
}

export async function loginAsGuest() {
  const credential = await signInAnonymously(auth);
  await syncUserProfile(credential.user);
  return credential.user;
}

export async function logoutWebUser() {
  await signOut(auth);
}

export async function sendWebPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function sendWebPasswordlessLink(email: string) {
  const normalized = email.trim();
  const actionCodeSettings = {
    url: typeof window === 'undefined' ? `https://${firebaseConfig.authDomain}/settings` : `${window.location.origin}/settings`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, normalized, actionCodeSettings);
  window.localStorage.setItem(pendingEmailKey, normalized);
}

export async function completeWebEmailLink(url: string) {
  if (!isSignInWithEmailLink(auth, url)) return null;
  const email = window.localStorage.getItem(pendingEmailKey);
  if (!email) {
    throw new Error('لا يوجد بريد محفوظ لإتمام الدخول بالرابط.');
  }
  const credential = await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem(pendingEmailKey);
  await syncUserProfile(credential.user);
  return credential.user;
}

export async function syncUserProfile(user: User) {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      profile: {
        displayName: user.displayName ?? null,
        email: user.email ?? null,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}

export function subscribeUserSettings(userId: string, callback: (settings: { privacyMode?: PrivacyMode } | null) => void) {
  return onSnapshot(doc(db, 'users', userId), (snapshot) => {
    const data = snapshot.data();
    callback((data?.settings as { privacyMode?: PrivacyMode } | undefined) ?? null);
  });
}

export async function saveUserSettings(userId: string, settings: { privacyMode: PrivacyMode }) {
  await setDoc(
    doc(db, 'users', userId),
    { settings, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export function subscribeBookmarks(userId: string, callback: (items: WebBookmark[]) => void) {
  return onSnapshot(collection(db, 'users', userId, 'bookmarks'), (snapshot) => {
    callback(
      snapshot.docs.map((entry) => ({
        surah: Number(entry.data().surahId ?? entry.data().surah ?? 0),
        ayah: Number(entry.data().ayahNumber ?? entry.data().ayah ?? 0),
        label: String(entry.data().surahName ?? entry.data().label ?? ''),
      }))
    );
  });
}

export async function syncBookmarks(userId: string, bookmarks: WebBookmark[]) {
  const batch = writeBatch(db);
  const existing = await getDocs(collection(db, 'users', userId, 'bookmarks'));
  const nextKeys = new Set(bookmarks.map((item) => `${item.surah}:${item.ayah}`));

  existing.docs.forEach((entry) => {
    if (!nextKeys.has(entry.id)) {
      batch.delete(entry.ref);
    }
  });

  bookmarks.forEach((bookmark) => {
    batch.set(doc(db, 'users', userId, 'bookmarks', `${bookmark.surah}:${bookmark.ayah}`), {
      surahId: bookmark.surah,
      ayahNumber: bookmark.ayah,
      surahName: bookmark.label,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function saveTrackerEntries(userId: string, entries: TrackerEntry[]) {
  const totalActions = entries.length;
  const quranPages = entries.filter((entry) => entry.activity === 'quran_pages').reduce((sum, entry) => sum + entry.value, 0);
  const fastingCount = entries.filter((entry) => entry.activity === 'fast_fard' || entry.activity === 'fast_nafl').length;
  const tahajjudCount = entries.filter((entry) => entry.activity === 'tahajjud').length;
  const weekKey = `web-${new Date().toISOString().slice(0, 10)}`;

  await setDoc(
    doc(db, 'users', userId, 'weekly_stats', weekKey),
    {
      total_actions: totalActions,
      quran_pages: quranPages,
      fasting_count: fastingCount,
      tahajjud_count: tahajjudCount,
      source: 'web',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(doc(db, 'users', userId, 'sync_data', 'tracker-web'), {
    id: 'tracker-web',
    updated_at: Date.now(),
    synced_at: Date.now(),
    deleted: false,
    entries,
  });
}

export async function loadTrackerEntries(userId: string) {
  const snapshot = await getDoc(doc(db, 'users', userId, 'sync_data', 'tracker-web'));
  const data = snapshot.data() as { entries?: TrackerEntry[] } | undefined;
  return data?.entries ?? [];
}

export async function createKhatmGroup(userId: string, name: string) {
  const inviteCode = `NOOR${Math.floor(10 + Math.random() * 89)}`;
  const groupRef = await addDoc(collection(db, 'khatm_groups'), {
    name,
    created_by: userId,
    created_at: serverTimestamp(),
    member_count: 1,
    status: 'active',
    invite_code: inviteCode,
    pages_per_member: 604,
  });

  await setDoc(doc(db, 'khatm_members', `${groupRef.id}__${userId}`), {
    user_id: userId,
    display_name: auth.currentUser?.displayName ?? auth.currentUser?.email ?? 'عضو نور الهدى',
    assigned_pages: Array.from({ length: 50 }, (_, index) => index + 1),
    completed_pages: [],
    joined_at: serverTimestamp(),
  });

  await setDoc(doc(db, 'khatm_progress', groupRef.id), {
    total_pages_done: 0,
    last_updated: serverTimestamp(),
  });

  return { id: groupRef.id, inviteCode };
}

export async function joinKhatmGroup(userId: string, inviteCode: string) {
  const snapshot = await getDocs(query(collection(db, 'khatm_groups'), where('invite_code', '==', inviteCode.trim().toUpperCase())));
  const target = snapshot.docs[0];
  if (!target) {
    throw new Error('لم يتم العثور على مجموعة بهذا الرمز.');
  }

  await setDoc(doc(db, 'khatm_members', `${target.id}__${userId}`), {
    user_id: userId,
    display_name: auth.currentUser?.displayName ?? auth.currentUser?.email ?? 'عضو نور الهدى',
    assigned_pages: Array.from({ length: 50 }, (_, index) => index + 1),
    completed_pages: [],
    joined_at: serverTimestamp(),
  }, { merge: true });

  await updateDoc(doc(db, 'khatm_groups', target.id), {
    member_count: increment(1),
  });

  return { id: target.id, ...target.data() };
}

export function subscribeMyKhatmMemberships(userId: string, callback: (items: Array<{ id: string; groupId: string; completedPages: number[]; assignedPages: number[] }>) => void) {
  return onSnapshot(query(collection(db, 'khatm_members'), where('user_id', '==', userId)), (snapshot) => {
    callback(snapshot.docs.map((entry) => {
      const data = entry.data() as { completed_pages?: number[]; assigned_pages?: number[] };
      return {
        id: entry.id,
        groupId: entry.id.split('__')[0] ?? entry.id,
        completedPages: data.completed_pages ?? [],
        assignedPages: data.assigned_pages ?? [],
      };
    }));
  });
}

export function subscribeKhatmGroup(groupId: string, callback: (payload: { name: string; inviteCode: string; totalPagesDone: number }) => void) {
  let state = { name: 'ختمة جماعية', inviteCode: '', totalPagesDone: 0 };

  const unsubscribeGroup = onSnapshot(doc(db, 'khatm_groups', groupId), (snapshot) => {
    const data = snapshot.data() as { name?: string; invite_code?: string } | undefined;
    if (!data) return;
    state = {
      ...state,
      name: data.name ?? state.name,
      inviteCode: data.invite_code ?? state.inviteCode,
    };
    callback(state);
  });

  const unsubscribeProgress = onSnapshot(doc(db, 'khatm_progress', groupId), (snapshot) => {
    const data = snapshot.data() as { total_pages_done?: number } | undefined;
    if (!data) return;
    state = {
      ...state,
      totalPagesDone: Number(data.total_pages_done ?? 0),
    };
    callback(state);
  });

  return () => {
    unsubscribeGroup();
    unsubscribeProgress();
  };
}

export async function markKhatmPageDone(groupId: string, userId: string, page: number) {
  await updateDoc(doc(db, 'khatm_members', `${groupId}__${userId}`), {
    completed_pages: arrayUnion(page),
  });
  await updateDoc(doc(db, 'khatm_progress', groupId), {
    total_pages_done: increment(1),
    last_updated: serverTimestamp(),
  });
}
