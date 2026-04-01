'use client';

import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import type { SurahDetail } from '@/lib/types';

const BOOKMARK_KEY = 'noor-web-bookmarks';

type Bookmark = { surah: number; ayah: number; label: string };

function readBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) ?? '[]') as Bookmark[];
  } catch {
    return [];
  }
}

function writeBookmarks(items: Bookmark[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(items));
}

export function QuranReader({ detail }: { detail: SurahDetail }) {
  const { bookmarks: syncedBookmarks, setBookmarks } = useAuth();
  const [bookmarks] = useState<Bookmark[]>(() => readBookmarks());
  const [copied, setCopied] = useState('');

  const isBookmarked = useMemo(
    () => new Set((syncedBookmarks.length ? syncedBookmarks : bookmarks).map((item) => `${item.surah}:${item.ayah}`)),
    [bookmarks, syncedBookmarks]
  );

  function toggleBookmark(ayahNumber: number) {
    const key = `${detail.surah.id}:${ayahNumber}`;
    const source = syncedBookmarks.length ? syncedBookmarks : bookmarks;
    const exists = source.some((item) => `${item.surah}:${item.ayah}` === key);
    const next = exists
      ? source.filter((item) => `${item.surah}:${item.ayah}` !== key)
      : [{ surah: detail.surah.id, ayah: ayahNumber, label: `${detail.surah.name} - ${ayahNumber}` }, ...source];
    writeBookmarks(next);
    void setBookmarks(next);
  }

  async function copyVerse(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setCopied('');
    }
  }

  return (
    <div className="reader-shell">
      <div className="reader-header-card">
        <div>
          <p className="eyebrow">{detail.surah.transliteration}</p>
          <h2>{detail.surah.name}</h2>
          <p className="body-copy">{detail.surah.versesCount} آية · {detail.surah.revelation === 'Meccan' ? 'مكية' : 'مدنية'}</p>
        </div>
        {detail.audioUrl ? (
          <audio controls preload="none" src={detail.audioUrl} className="audio-player" />
        ) : null}
      </div>

      <div className="verse-list">
        {detail.verses.map((verse) => (
          <article key={verse.number} className="verse-card">
            <div className="verse-meta-row">
              <span className="chip">الآية {verse.number}</span>
              <div className="inline-field-row">
                <button className="ghost-button small-button" onClick={() => toggleBookmark(verse.number)}>
                  {isBookmarked.has(`${detail.surah.id}:${verse.number}`) ? 'إزالة الحفظ' : 'حفظ'}
                </button>
                <button className="ghost-button small-button" onClick={() => void copyVerse(verse.arabicText)}>
                  {copied === verse.arabicText ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
            </div>
            <p className="arabic-copy">{verse.arabicText}</p>
            <p className="body-copy">{verse.translation}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
