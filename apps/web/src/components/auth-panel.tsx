'use client';

import { useState } from 'react';

import { useAuth } from '@/components/auth-provider';

export function AuthPanel() {
  const { user, signIn, signUp, signInGoogle, signInGuest, signOut, sendReset, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function run(action: () => Promise<void>, success: string) {
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إكمال العملية.');
    }
  }

  if (user) {
    return (
      <div className="auth-panel compact-auth">
        <p className="body-copy">{user.isAnonymous ? 'جلسة ضيف' : user.email ?? user.displayName ?? 'مستخدم نور الهدى'}</p>
        <button className="ghost-button" onClick={() => void signOut()}>تسجيل الخروج</button>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <div className="inline-field-row two-fields">
        <input className="text-field" dir="ltr" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="text-field" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="chip-row">
        <button className="primary-button" onClick={() => void run(() => signIn(email, password), 'تم تسجيل الدخول.')}>دخول</button>
        <button className="ghost-button" onClick={() => void run(() => signUp(email, password), 'تم إنشاء الحساب.')}>حساب جديد</button>
        <button className="ghost-button" onClick={() => void run(() => signInGoogle(), 'تم تسجيل الدخول بجوجل.')}>Google</button>
        <button className="ghost-button" onClick={() => void run(() => signInGuest(), 'تم فتح جلسة ضيف.')}>ضيف</button>
        <button className="ghost-button" onClick={() => void run(() => sendReset(email), 'تم إرسال رابط إعادة التعيين.')}>إعادة التعيين</button>
        <button className="ghost-button" onClick={() => void run(() => sendMagicLink(email), 'تم إرسال رابط الدخول.')}>رابط سحري</button>
      </div>
      {message ? <p className="panel-note">{message}</p> : null}
    </div>
  );
}
