'use client';

import { useEffect, useState } from 'react';

import { apiBaseUrl } from '@/lib/api';

type SearchResult = {
  surah: number;
  ayah: number;
  text_ar: string;
  surah_name: string;
  score: number;
};

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/quran/search?q=${encodeURIComponent(debounced)}&limit=6`,
          { cache: 'no-store' }
        );
        const payload = (await response.json()) as { results?: SearchResult[] };
        if (!cancelled) {
          setResults(payload.results ?? []);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="interactive-panel">
      <label className="field-label" htmlFor="semantic-search">ابحث بالمعنى</label>
      <input
        id="semantic-search"
        className="text-field"
        dir="rtl"
        placeholder="مثل: الصبر عند البلاء"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {loading ? <p className="panel-note">جاري البحث...</p> : null}
      <div className="result-list">
        {results.map((item) => (
          <article key={`${item.surah}:${item.ayah}`} className="result-item">
            <div className="result-meta">
              <span>{item.surah_name}</span>
              <span>{item.ayah}</span>
            </div>
            <p className="arabic-copy">{item.text_ar}</p>
            <div className="score-track">
              <div className="score-fill" style={{ width: `${Math.max(8, Math.round(item.score * 100))}%` }} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
