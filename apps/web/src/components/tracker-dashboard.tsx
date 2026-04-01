'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { saveTrackerEntries } from '@/lib/firebase';

const STORAGE_KEY = 'noor-web-worship-log';

type TrackerEntry = {
  date: string;
  activity: string;
  value: number;
};

const activities = [
  { id: 'fast_fard', label: 'صيام فرض' },
  { id: 'fast_nafl', label: 'صيام نفل' },
  { id: 'tahajjud', label: 'قيام الليل' },
  { id: 'sadaqah', label: 'صدقة' },
  { id: 'azkar_morning', label: 'أذكار الصباح' },
  { id: 'azkar_evening', label: 'أذكار المساء' },
  { id: 'quran_pages', label: 'صفحات القرآن' },
];

function readEntries(): TrackerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as TrackerEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: TrackerEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function TrackerDashboard() {
  const { user, trackerEntries, setTrackerEntries } = useAuth();
  const [entries, setEntries] = useState<TrackerEntry[]>(() => (trackerEntries.length ? trackerEntries : readEntries()));

  useEffect(() => {
    if (trackerEntries.length) {
      setEntries(trackerEntries);
    }
  }, [trackerEntries]);

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = entries.filter((entry) => entry.date === today).length;
    const quranPages = entries.filter((entry) => entry.activity === 'quran_pages').reduce((sum, item) => sum + item.value, 0);
    return { todayCount, quranPages, total: entries.length };
  }, [entries]);

  function addEntry(activity: string) {
    const next = [
      {
        date: new Date().toISOString().slice(0, 10),
        activity,
        value: activity === 'quran_pages' ? 2 : 1,
      },
      ...entries,
    ].slice(0, 60);
    setEntries(next);
    writeEntries(next);
    setTrackerEntries(next);
    if (user && !user.isAnonymous) {
      void saveTrackerEntries(user.uid, next);
    }
  }

  const fastingStreak = useMemo(() => entries.filter((entry) => entry.activity === 'fast_fard' || entry.activity === 'fast_nafl').length, [entries]);
  const tahajjudStreak = useMemo(() => entries.filter((entry) => entry.activity === 'tahajjud').length, [entries]);

  return (
    <div className="tracker-shell">
      <section className="content-grid three-up">
        <article className="metric-card"><span>اليوم</span><strong>{summary.todayCount}</strong></article>
        <article className="metric-card"><span>إجمالي السجل</span><strong>{summary.total}</strong></article>
        <article className="metric-card"><span>صفحات القرآن</span><strong>{summary.quranPages}</strong></article>
      </section>
      <section className="content-grid three-up compact-top-gap">
        <article className="metric-card"><span>صيام هذا الشهر</span><strong>{fastingStreak}</strong></article>
        <article className="metric-card"><span>قيام الليل</span><strong>{tahajjudStreak}</strong></article>
        <article className="metric-card"><span>المزامنة</span><strong>{user && !user.isAnonymous ? 'Firebase' : 'محلي'}</strong></article>
      </section>
      <section className="feature-card">
        <p className="feature-eyebrow">قائمة اليوم</p>
        <h3>سجّل عبادتك بسرعة</h3>
        <div className="chip-row">
          {activities.map((activity) => (
            <button key={activity.id} className="ghost-button" onClick={() => addEntry(activity.id)}>{activity.label}</button>
          ))}
        </div>
      </section>
      <section className="heatmap-grid">
        {entries.slice(0, 35).map((entry, index) => (
          <div key={`${entry.date}-${entry.activity}-${index}`} className="heat-cell">
            <span>{entry.date.slice(5)}</span>
            <strong>{entry.activity}</strong>
          </div>
        ))}
      </section>
      <section className="feature-card">
        <p className="feature-eyebrow">تصدير</p>
        <h3>تقريرك الحالي</h3>
        <p className="body-copy">يمكنك نسخ هذا الملخص أو حفظه محلياً من خلال متصفحك.</p>
        <pre className="tracker-export">{JSON.stringify(entries.slice(0, 12), null, 2)}</pre>
      </section>
      <section className="feature-card">
        <p className="feature-eyebrow">آخر الأنشطة</p>
        <h3>ملخص آخر التسجيلات</h3>
        <div className="result-list">
          {entries.slice(0, 8).map((entry, index) => (
            <article key={`${entry.date}-${entry.activity}-${index}`} className="result-item compact-result">
              <div className="result-meta">
                <span>{entry.date}</span>
                <span>{entry.value}</span>
              </div>
              <p className="body-copy">{entry.activity}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
