import { mapFirebaseAuthError } from './error-messages';

describe('auth error messages', () => {
  it('maps Firebase email-in-use errors to Arabic guidance', () => {
    expect(mapFirebaseAuthError('Firebase: Error (auth/email-already-in-use).')).toContain(
      'هذا البريد مستخدم بالفعل'
    );
  });

  it('maps Firebase password errors to Arabic guidance', () => {
    expect(mapFirebaseAuthError('Firebase: Error (auth/weak-password).')).toContain(
      'كلمة المرور ضعيفة'
    );
  });
});
