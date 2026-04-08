import { useEffect, useState } from 'react';
import { type User } from 'firebase/auth';

import { mapFirebaseAuthError } from './error-messages';
import {
  canHandleEmailLink,
  completePasswordlessSignIn,
  continueAsGuest,
  getCurrentUser,
  loginWithEmail,
  logoutUser,
  reloadCurrentUser,
  registerWithEmail,
  sendPasswordResetLink,
  sendPasswordlessSignInLink,
  sendVerificationEmailToCurrentUser,
  subscribeToAuth,
} from '../../lib/firebase';

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

export const authActions = {
  canHandleEmailLink,
  completePasswordlessSignIn,
  continueAsGuest,
  loginWithEmail,
  logoutUser,
  registerWithEmail,
  sendPasswordResetLink,
  sendPasswordlessSignInLink,
  sendVerificationEmailToCurrentUser,
};

export { mapFirebaseAuthError };
