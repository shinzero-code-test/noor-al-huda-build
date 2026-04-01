import { makeRedirectUri } from 'expo-auth-session';
import { useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';
import { type User } from 'firebase/auth';

import { mapFirebaseAuthError, mapGoogleAuthError } from './error-messages';
import {
  canHandleEmailLink,
  completePasswordlessSignIn,
  continueAsGuest,
  getCurrentUser,
  googleAuthConfig,
  hasGoogleAuthConfig,
  loginWithEmail,
  loginWithGoogleIdToken,
  logoutUser,
  reloadCurrentUser,
  registerWithEmail,
  sendPasswordResetLink,
  sendPasswordlessSignInLink,
  sendVerificationEmailToCurrentUser,
  subscribeToAuth,
} from '../../lib/firebase';

WebBrowser.maybeCompleteAuthSession();

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  return {
    initializing,
    revision,
    user,
    refresh: async () => {
      await reloadCurrentUser();
      setUser(getCurrentUser());
      setRevision((value) => value + 1);
    },
  };
}

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'opening' | 'verifying' | 'done'>('idle');

  const androidUnsupported = Platform.OS === 'android';
  const enabled = hasGoogleAuthConfig && !androidUnsupported;
  const googleConfig = useMemo(
    () =>
      androidUnsupported
        ? {}
        : {
            webClientId: googleAuthConfig.webClientId,
            androidClientId: googleAuthConfig.androidClientId,
            iosClientId: googleAuthConfig.iosClientId,
            selectAccount: true,
            scopes: ['profile', 'email'],
          },
    [androidUnsupported]
  );

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    googleConfig,
    androidUnsupported
      ? undefined
      : {
          native: makeRedirectUri({ native: 'nooralhuda:/oauthredirect' }),
        }
  );

  useEffect(() => {
    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  useEffect(() => {
    if (androidUnsupported) {
      setInfo('تسجيل الدخول عبر Google معطّل مؤقتاً على Android في إصدار الإنتاج الحالي حتى ننتقل إلى تكامل Google Sign-In الأصلي الآمن.');
    }
  }, [androidUnsupported]);

  useEffect(() => {
    let cancelled = false;

    async function handleResponse() {
      if (!response) {
        return;
      }

      if (response.type !== 'success') {
        setLoading(false);
        setStage('idle');
        if (response.type === 'cancel' || response.type === 'dismiss') {
          setInfo('تم إلغاء تسجيل الدخول قبل الاكتمال.');
          setError(null);
          return;
        }

        if (response?.type === 'error') {
          setError(mapGoogleAuthError(response.error?.message));
        }
        return;
      }

      const idToken = response.params.id_token;
      if (!idToken) {
        setError('لم يتم استلام Google ID token.');
        setLoading(false);
        setStage('idle');
        return;
      }

      setLoading(true);
      setStage('verifying');
      setError(null);
      setInfo('جارٍ ربط حساب Google مع Firebase...');

      try {
        await loginWithGoogleIdToken(idToken);
        if (!cancelled) {
          setInfo('تم ربط حساب Google بنجاح.');
          setStage('done');
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(mapGoogleAuthError(nextError instanceof Error ? nextError.message : undefined));
          setStage('idle');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void handleResponse();

    return () => {
      cancelled = true;
    };
  }, [response]);

  return {
    enabled,
    loading,
    error,
  info,
  stage,
  ready: Boolean(request),
    canStart: enabled && Boolean(request) && !loading,
    signIn: async () => {
      if (!enabled) {
        throw new Error(
          androidUnsupported
            ? 'Google Sign-In معطّل حالياً على Android في هذا الإصدار الإنتاجي.'
            : 'Google sign-in is not configured yet.'
        );
      }

      if (!request) {
        throw new Error('Google sign-in is not ready yet.');
      }

      setError(null);
      setInfo('سيتم فتح نافذة Google الآمنة الآن.');
      setStage('opening');
      setLoading(true);
      const result = await promptAsync({ showInRecents: true });
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setLoading(false);
        setStage('idle');
      }
    },
  };
}

export const authActions = {
  canHandleEmailLink,
  completePasswordlessSignIn,
  continueAsGuest,
  loginWithEmail,
  loginWithGoogleIdToken,
  logoutUser,
  registerWithEmail,
  sendPasswordResetLink,
  sendPasswordlessSignInLink,
  sendVerificationEmailToCurrentUser,
};

export { mapFirebaseAuthError, mapGoogleAuthError };
