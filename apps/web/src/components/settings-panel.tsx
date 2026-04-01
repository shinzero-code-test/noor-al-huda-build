'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { apiBaseUrl } from '@/lib/api';

export function SettingsPanel() {
  const { bookmarks, privacyMode, setPrivacyMode, trackerEntries, user } = useAuth();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    void fetch(`${apiBaseUrl}/api/health`, { cache: 'no-store' })
      .then((response) => setStatus(response.ok ? 'connected' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  function exportData() {
    const payload = {
      privacyMode,
      tracker: JSON.parse(window.localStorage.getItem('noor-web-worship-log') ?? '[]'),
      bookmarks: JSON.parse(window.localStorage.getItem('noor-web-bookmarks') ?? '[]'),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'noor-al-huda-web-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function wipeData() {
    window.localStorage.removeItem('noor-web-worship-log');
    window.localStorage.removeItem('noor-web-bookmarks');
    window.localStorage.removeItem('noor-web-privacy-mode');
    void setPrivacyMode('full');
  }

  return (
    <div className="settings-shell">
      <section className="feature-card">
        <p className="feature-eyebrow">الخصوصية</p>
        <h3>اختر أسلوب استخدامك</h3>
        <div className="chip-row">
          {(['full', 'partial', 'private'] as const).map((item) => (
            <button key={item} className={`ghost-button ${privacyMode === item ? 'active-chip' : ''}`} onClick={() => void setPrivacyMode(item)}>
              {item === 'full' ? 'كامل' : item === 'partial' ? 'متوازن' : 'خاص'}
            </button>
          ))}
        </div>
      </section>
      <section className="feature-card">
        <p className="feature-eyebrow">الحساب</p>
        <h3>حالة المصادقة</h3>
        <p className="body-copy">{user ? (user.isAnonymous ? 'أنت تستخدم جلسة ضيف.' : `تم تسجيل الدخول كبريد: ${user.email ?? 'مستخدم'}`) : 'لم يتم تسجيل الدخول بعد.'}</p>
        <p className="body-copy">العلامات المرجعية: {bookmarks.length} · سجلات العبادة: {trackerEntries.length}</p>
      </section>
      <section className="feature-card">
        <p className="feature-eyebrow">الخلفية</p>
        <h3>حالة الاتصال</h3>
        <p className="body-copy">{status === 'connected' ? 'الخادم متصل ويعمل.' : status === 'error' ? 'تعذر الوصول إلى الخادم حالياً.' : 'جارٍ التحقق...'}</p>
      </section>
      <section className="feature-card">
        <p className="feature-eyebrow">البيانات المحلية</p>
        <h3>تصدير أو حذف</h3>
        <div className="inline-field-row">
          <button className="primary-button" onClick={exportData}>تصدير JSON</button>
          <button className="ghost-button" onClick={wipeData}>حذف كل البيانات المحلية</button>
        </div>
      </section>
    </div>
  );
}
